import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { VertexAI } from '@google-cloud/vertexai';
import { verifyToken } from '@/lib/auth-jwt';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

const VERTEX_PROJECT_ID = 'gen-lang-client-0591725975';
const VERTEX_LOCATION = 'us-central1';
const VERTEX_MODEL = 'gemini-2.0-flash-001';

const payloadSchema = z.object({
  cardId: z.string().uuid(),
  leadId: z.string().uuid(),
  baseMessage: z.string().trim().min(10).max(3000),
  phase: z.enum(['novo', 'follow_up', 'recuperacao']),
  dayId: z.string().trim().min(1).max(20),
});

type JsonObject = Record<string, unknown>;

function toObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as JsonObject;
}

function extractOcrData(dadosPdf: unknown): JsonObject | null {
  const root = toObject(dadosPdf);
  if (!root) return null;

  const explicitOcr = toObject(root.dados_ocr);
  if (explicitOcr) return explicitOcr;

  const scanner = toObject(root.scanner);
  if (scanner) return scanner;

  const looksLikeDirectOcr = ['operadora', 'valor_total', 'titular', 'beneficiarios']
    .some((key) => key in root);

  return looksLikeDirectOcr ? root : null;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveProfileHint(leadRow: JsonObject): string {
  const dadosPdf = toObject(leadRow.dados_pdf);
  const dadosDigitados = toObject(dadosPdf?.dados_digitados);
  const possible = [
    readString(leadRow.perfil),
    readString(dadosDigitados?.perfil),
    readString(leadRow.tipo_contratacao),
    readString(dadosDigitados?.tipo_pessoa),
    readString(leadRow.origem),
  ].filter((item): item is string => Boolean(item));

  return possible[0] ?? 'perfil empresarial';
}

function getVertexModel() {
  const rawServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawServiceAccount) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON nao configurada');
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
      temperature: 0.45,
      topP: 0.9,
      maxOutputTokens: 700,
    },
  });
}

function buildPrompt(params: {
  lead: JsonObject;
  ocrData: JsonObject | null;
  baseMessage: string;
  phase: string;
  dayId: string;
  profileHint: string;
}): string {
  const { lead, ocrData, baseMessage, phase, dayId, profileHint } = params;
  const leadContext = {
    nome: readString(lead.nome),
    operadora_atual: readString(lead.operadora_atual),
    valor_atual: lead.valor_atual ?? null,
    economia_estimada: lead.economia_estimada ?? null,
    tipo_contratacao: readString(lead.tipo_contratacao),
    perfil: readString(lead.perfil),
    observacoes: readString(lead.observacoes),
  };

  const fallbackInstruction = ocrData
    ? 'Use os dados do OCR para argumentar economia mensal/anual de forma objetiva e realista.'
    : `Nao ha OCR de boleto. Foque no perfil da empresa (${profileHint}) e cite que a rede credenciada e adequada para esse contexto.`;

  return `
Voce e um especialista comercial da Humano Saude focado em conversao via WhatsApp.

Objetivo:
- Reescrever a mensagem base para ficar personalizada, humana e objetiva.
- Argumentar com foco em economia real e beneficios da rede credenciada.
- Nao inventar valores. Se nao houver numero confiavel, use linguagem consultiva.
- Manter linguagem em portugues do Brasil.

Contexto de cadencia:
- Fase: ${phase}
- Dia: ${dayId}

Dados do lead (JSON):
${JSON.stringify(leadContext, null, 2)}

Dados do OCR do boleto (JSON):
${ocrData ? JSON.stringify(ocrData, null, 2) : 'null'}

Mensagem base:
"""${baseMessage}"""

Instrucoes adicionais:
- ${fallbackInstruction}
- Gere somente uma mensagem final pronta para WhatsApp.
- Maximo de 550 caracteres.
- Nao use markdown, nao use aspas extras, nao liste topicos.
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get('admin_token')?.value ||
      request.cookies.get('corretor_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const jwt = await verifyToken(token);
    if (!jwt) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
    }

    const rawBody = await request.json();
    const parsed = payloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload invalido', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { cardId, leadId, baseMessage, phase, dayId } = parsed.data;
    const sb = createServiceClient();

    const { data: card, error: cardError } = await sb
      .from('crm_cards')
      .select('id, lead_id, corretor_id')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card nao encontrado' }, { status: 404 });
    }

    if (card.lead_id !== leadId) {
      return NextResponse.json({ error: 'Card e lead nao conferem' }, { status: 400 });
    }

    if (jwt.role === 'corretor' && jwt.corretor_id && card.corretor_id !== jwt.corretor_id) {
      return NextResponse.json({ error: 'Sem permissao para este lead' }, { status: 403 });
    }

    const { data: leadRow, error: leadError } = await sb
      .from('insurance_leads')
      .select('id, nome, perfil, tipo_contratacao, origem, observacoes, operadora_atual, valor_atual, economia_estimada, dados_pdf')
      .eq('id', leadId)
      .single();

    if (leadError || !leadRow) {
      return NextResponse.json({ error: 'Lead nao encontrado' }, { status: 404 });
    }

    const leadData = (leadRow as JsonObject);
    const ocrData = extractOcrData(leadData.dados_pdf);
    const profileHint = resolveProfileHint(leadData);

    const prompt = buildPrompt({
      lead: leadData,
      ocrData,
      baseMessage,
      phase,
      dayId,
      profileHint,
    });

    const model = getVertexModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .map((part) => part.text ?? '')
      .join('\n')
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: 'A IA nao retornou texto para personalizacao' },
        { status: 502 },
      );
    }

    const sanitizedText = text
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      success: true,
      personalizedText: sanitizedText,
      source: {
        model: VERTEX_MODEL,
        project: VERTEX_PROJECT_ID,
        location: VERTEX_LOCATION,
      },
    });
  } catch (error: unknown) {
    logger.error('[api/leads/ai-personalize] erro', error as Error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
