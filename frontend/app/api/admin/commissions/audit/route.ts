import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { verifyToken } from '@/lib/auth-jwt';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { AuditResult, AuditDivergence } from '@/lib/types/commissions';

export const maxDuration = 120;

const VERTEX_PROJECT_ID = 'gen-lang-client-0591725975';
const VERTEX_LOCATION = 'us-central1';
const VERTEX_MODEL = 'gemini-2.0-flash-001';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── Inicializa modelo Gemini via Vertex AI ──
function getVertexModel() {
  const rawServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawServiceAccount) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurada');
  }

  const credentials = JSON.parse(rawServiceAccount) as Record<string, unknown>;
  const vertex = new VertexAI({
    project: VERTEX_PROJECT_ID,
    location: VERTEX_LOCATION,
    googleAuthOptions: { credentials },
  });

  return vertex.getGenerativeModel({
    model: VERTEX_MODEL,
    generationConfig: {
      temperature: 0.1, // Baixa para OCR preciso
      topP: 0.9,
      maxOutputTokens: 8000,
    },
  });
}

// ── Prompt de extração de dados do PDF ──
function buildExtractionPrompt(operatorName: string): string {
  return `Você é um auditor financeiro especialista em comissões de planos de saúde.

Analise este PDF de extrato de comissões da operadora "${operatorName}".

Extraia TODOS os lançamentos encontrados no documento em formato JSON.
Para cada lançamento, identifique:
- nome_titular: nome do titular/beneficiário
- numero_proposta: número da proposta ou contrato (se disponível)
- cpf: CPF do titular (se disponível)
- valor_comissao: valor da comissão paga (número decimal)
- parcela: número da parcela (se identificável)
- valor_mensalidade: valor da mensalidade base (se disponível)
- observacao: qualquer observação relevante

Responda EXCLUSIVAMENTE com JSON válido, sem markdown, sem explicações:
{
  "operadora": "nome da operadora",
  "periodo": "período do extrato",
  "total_extrato": 0.00,
  "lancamentos": [
    {
      "nome_titular": "",
      "numero_proposta": "",
      "cpf": "",
      "valor_comissao": 0.00,
      "parcela": 1,
      "valor_mensalidade": 0.00,
      "observacao": ""
    }
  ]
}`;
}

type ExtractedEntry = {
  nome_titular: string;
  numero_proposta: string;
  cpf: string;
  valor_comissao: number;
  parcela: number;
  valor_mensalidade: number;
  observacao: string;
};

type ExtractedData = {
  operadora: string;
  periodo: string;
  total_extrato: number;
  lancamentos: ExtractedEntry[];
};

type LedgerRow = {
  id: string;
  amount: number;
  installment_number: number;
  titular_name: string | null;
  proposal_number: string | null;
  cpf_titular: string | null;
  base_amount: number;
};

// ── Normaliza nome para comparação fuzzy ──
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// ── Compara dois nomes com tolerância ──
function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  // Verifica se um contém o outro (nomes abreviados)
  if (na.includes(nb) || nb.includes(na)) return true;
  // Compara primeiro e último nome
  const partsA = na.split(/\s+/);
  const partsB = nb.split(/\s+/);
  return partsA[0] === partsB[0] && partsA[partsA.length - 1] === partsB[partsB.length - 1];
}

// ── Tolerância para diferença de centavos (R$ 0.05) ──
const CENTS_TOLERANCE = 0.05;

export async function POST(request: NextRequest) {
  try {
    // Autenticação: apenas admin
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const jwt = await verifyToken(token);
    if (!jwt || jwt.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const operatorName = formData.get('operator_name') as string;
    const referenceMonth = formData.get('reference_month') as string;

    if (!file || !operatorName || !referenceMonth) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: file, operator_name, reference_month' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo excede 10MB' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos' }, { status: 400 });
    }

    // ── STEP 1: Enviar PDF para Gemini ──
    logger.info(`🔍 Auditoria Gemini: ${operatorName} — ${referenceMonth}`);

    const pdfBytes = await file.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    const model = getVertexModel();
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
            { text: buildExtractionPrompt(operatorName) },
          ],
        },
      ],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpar possíveis marcadores de markdown
    const cleanJson = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let extractedData: ExtractedData;
    try {
      extractedData = JSON.parse(cleanJson);
    } catch {
      logger.error('❌ Gemini retornou JSON inválido:', cleanJson.slice(0, 500));
      return NextResponse.json(
        { error: 'Não foi possível extrair dados do PDF. O formato pode não ser suportado.' },
        { status: 422 }
      );
    }

    if (!extractedData.lancamentos || !Array.isArray(extractedData.lancamentos)) {
      return NextResponse.json(
        { error: 'Nenhum lançamento identificado no PDF' },
        { status: 422 }
      );
    }

    // ── STEP 2: Buscar lançamentos do ledger para o mesmo mês ──
    const sb = createServiceClient();
    const { data: ledgerEntries, error: ledgerError } = await sb
      .from('commissions_ledger')
      .select('id, amount, installment_number, titular_name, proposal_number, cpf_titular, base_amount')
      .eq('reference_month', referenceMonth)
      .in('status', ['pending', 'confirmed'])
      .order('created_at');

    if (ledgerError) {
      logger.error('❌ Erro ao buscar ledger:', ledgerError);
      return NextResponse.json({ error: 'Erro ao acessar dados do sistema' }, { status: 500 });
    }

    const ledger = (ledgerEntries || []) as unknown as LedgerRow[];

    // ── STEP 3: Cruzar dados (matching) ──
    const divergences: AuditDivergence[] = [];
    const matchedLedgerIds = new Set<string>();
    const matchedPdfIndices = new Set<number>();

    for (const [pdfIndex, pdfEntry] of extractedData.lancamentos.entries()) {
      let bestMatch: LedgerRow | null = null;
      let bestScore = 0;

      for (const ledgerEntry of ledger) {
        if (matchedLedgerIds.has(ledgerEntry.id)) continue;

        let score = 0;

        // Match por número de proposta (mais confiável)
        if (pdfEntry.numero_proposta && ledgerEntry.proposal_number) {
          if (pdfEntry.numero_proposta === ledgerEntry.proposal_number) {
            score += 10;
          }
        }

        // Match por CPF
        if (pdfEntry.cpf && ledgerEntry.cpf_titular) {
          const pdfCpf = pdfEntry.cpf.replace(/\D/g, '');
          const ledgerCpf = ledgerEntry.cpf_titular.replace(/\D/g, '');
          if (pdfCpf === ledgerCpf) score += 8;
        }

        // Match por nome
        if (pdfEntry.nome_titular && ledgerEntry.titular_name) {
          if (namesMatch(pdfEntry.nome_titular, ledgerEntry.titular_name)) {
            score += 5;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = ledgerEntry;
        }
      }

      // Score mínimo para considerar match
      if (bestMatch && bestScore >= 5) {
        matchedLedgerIds.add(bestMatch.id);
        matchedPdfIndices.add(pdfIndex);

        // Verificar divergência de valor
        const expectedAmount = Number(bestMatch.amount);
        const actualAmount = Number(pdfEntry.valor_comissao);
        const diff = Math.abs(expectedAmount - actualAmount);

        if (diff > CENTS_TOLERANCE) {
          divergences.push({
            proposal_number: bestMatch.proposal_number || '',
            titular_name: bestMatch.titular_name || pdfEntry.nome_titular,
            expected_amount: expectedAmount,
            actual_amount: actualAmount,
            difference: actualAmount - expectedAmount,
            type: 'amount_mismatch',
            details: `Diferença de ${formatCurrency(diff)}: sistema=${formatCurrency(expectedAmount)}, extrato=${formatCurrency(actualAmount)}`,
          });

          // Atualizar status no ledger
          await sb
            .from('commissions_ledger')
            .update({
              audit_status: 'divergent',
              audit_notes: `Extrato: ${formatCurrency(actualAmount)} | Sistema: ${formatCurrency(expectedAmount)} | Diff: ${formatCurrency(diff)}`,
              audited_at: new Date().toISOString(),
            })
            .eq('id', bestMatch.id);
        } else {
          // Match OK
          await sb
            .from('commissions_ledger')
            .update({
              audit_status: 'match',
              audit_notes: null,
              audited_at: new Date().toISOString(),
            })
            .eq('id', bestMatch.id);
        }
      }
    }

    // Vidas no sistema que NÃO apareceram no extrato
    for (const ledgerEntry of ledger) {
      if (matchedLedgerIds.has(ledgerEntry.id)) continue;

      divergences.push({
        proposal_number: ledgerEntry.proposal_number || '',
        titular_name: ledgerEntry.titular_name || 'N/A',
        expected_amount: Number(ledgerEntry.amount),
        actual_amount: null,
        difference: -Number(ledgerEntry.amount),
        type: 'missing_in_statement',
        details: `Lançamento de ${formatCurrency(Number(ledgerEntry.amount))} existe no sistema mas não foi encontrado no extrato`,
      });

      await sb
        .from('commissions_ledger')
        .update({
          audit_status: 'missing',
          audit_notes: 'Não encontrado no extrato da operadora',
          audited_at: new Date().toISOString(),
        })
        .eq('id', ledgerEntry.id);
    }

    // Vidas no extrato que NÃO existem no sistema
    for (const [pdfIndex, pdfEntry] of extractedData.lancamentos.entries()) {
      if (matchedPdfIndices.has(pdfIndex)) continue;

      divergences.push({
        proposal_number: pdfEntry.numero_proposta || 'N/A',
        titular_name: pdfEntry.nome_titular,
        expected_amount: 0,
        actual_amount: Number(pdfEntry.valor_comissao),
        difference: Number(pdfEntry.valor_comissao),
        type: 'extra_in_statement',
        details: `Vida "${pdfEntry.nome_titular}" com comissão de ${formatCurrency(Number(pdfEntry.valor_comissao))} aparece no extrato mas não no sistema`,
      });
    }

    // ── STEP 4: Montar resultado ──
    const totalExpected = ledger.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalFound = extractedData.lancamentos.reduce(
      (sum, e) => sum + Number(e.valor_comissao || 0),
      0
    );

    const auditResult: AuditResult = {
      operator_name: operatorName,
      statement_month: referenceMonth,
      total_expected: totalExpected,
      total_found: totalFound,
      total_divergent: divergences.filter((d) => d.type === 'amount_mismatch').length,
      match_count: matchedLedgerIds.size - divergences.filter((d) => d.type === 'amount_mismatch').length,
      divergences,
      raw_extracted_entries: extractedData.lancamentos.length,
      processed_at: new Date().toISOString(),
    };

    logger.info(
      `✅ Auditoria concluída: ${auditResult.match_count} OK, ${auditResult.divergences.length} divergências`
    );

    return NextResponse.json(auditResult);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    logger.error('❌ Erro na auditoria Gemini:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}
