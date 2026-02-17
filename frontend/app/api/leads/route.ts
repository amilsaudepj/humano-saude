import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isIP } from 'node:net';
import { apiLeadSchema } from '@/lib/validations';
import { checkRateLimit, leadsLimiter } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { enviarEmailNovoLead } from '@/lib/email';

function extractClientIp(request: NextRequest): string | null {
  const candidates = [
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
  ];

  for (const raw of candidates) {
    if (!raw) continue;

    // x-forwarded-for pode vir com múltiplos IPs: "client, proxy1, proxy2"
    let value = raw.split(',')[0]?.trim() ?? '';
    if (!value || value.toLowerCase() === 'unknown') continue;

    // IPv6 com porta: "[2001:db8::1]:443"
    if (value.startsWith('[') && value.includes(']')) {
      value = value.slice(1, value.indexOf(']'));
    } else if (value.includes('.') && value.includes(':')) {
      // IPv4 com porta: "1.2.3.4:56789"
      const parts = value.split(':');
      if (parts.length === 2 && /^\d+$/.test(parts[1])) {
        value = parts[0];
      }
    }

    // Mapeamento IPv4-in-IPv6: "::ffff:1.2.3.4"
    if (value.startsWith('::ffff:')) {
      value = value.slice('::ffff:'.length);
    }

    if (isIP(value)) return value;
  }

  return null;
}

function normalizeOrigem(origem?: string, source?: string): 'calculadora' | 'hero_form' | 'landing' {
  const candidate = (origem || source || 'landing').toLowerCase();
  if (candidate === 'calculadora' || candidate === 'hero_form' || candidate === 'landing') {
    return candidate;
  }
  return 'landing';
}

function normalizePhoneForDb(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  // Aceitar formato do banco: + opcional seguido por 10 a 15 dígitos.
  const normalizedDigits = digits.length > 15 ? digits.slice(-15) : digits;
  if (normalizedDigits.length < 10) return null;

  return hasPlus ? `+${normalizedDigits}` : normalizedDigits;
}

function normalizeCnpj(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length ? digits : null;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 leads/min por IP
    const blocked = await checkRateLimit(request, leadsLimiter);
    if (blocked) return blocked;

    const body = await request.json();
    
    // Validar dados
    const validatedData = apiLeadSchema.parse(body);
    
    // Converter top_3_planos array para string se necessário
    const top_3_planos = Array.isArray(validatedData.top_3_planos)
      ? validatedData.top_3_planos.join(', ')
      : validatedData.top_3_planos || null;

    const normalizedPhone = normalizePhoneForDb(validatedData.telefone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Telefone inválido para salvar lead' },
        { status: 400 },
      );
    }
    
    // Capturar IP e User-Agent
    const ip = extractClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Determinar origem
    const origem = normalizeOrigem(validatedData.origem, validatedData.source);
    const isParcial = validatedData.parcial === true;
    const nome = validatedData.nome?.trim() || '';
    const email = validatedData.email?.trim() || null;
    const cnpj = normalizeCnpj(validatedData.cnpj);
    const observacoes = validatedData.empresa?.trim()
      ? `Empresa informada na landing: ${validatedData.empresa.trim()}`
      : null;
    
    // ✅ Tabela unificada: insurance_leads
    const supabase = createServiceClient();
    const historico = [
      {
        timestamp: new Date().toISOString(),
        evento: isParcial ? 'lead_parcial' : 'lead_criado',
        origem,
        detalhes: isParcial
          ? 'Lead parcial salvo (usuário abandonou o formulário)'
          : `Lead criado via ${origem}`,
      },
    ];

    const payload = {
      nome,
      email,
      whatsapp: normalizedPhone,
      telefone: normalizedPhone,
      perfil: validatedData.perfil || null,
      tipo_contratacao: validatedData.tipo_contratacao || null,
      cnpj,
      acomodacao: validatedData.acomodacao || null,
      idades_beneficiarios: validatedData.idades_beneficiarios || null,
      bairro: validatedData.bairro || null,
      top_3_planos,
      ip_address: ip,
      user_agent: userAgent,
      status: 'novo',
      origem,
      utm_source: validatedData.utm_source || null,
      utm_medium: validatedData.utm_medium || null,
      utm_campaign: validatedData.utm_campaign || null,
      observacoes,
      historico,
      arquivado: false,
    };

    const primaryInsert = await supabase
      .from('insurance_leads')
      .insert([payload])
      .select()
      .single();
    let data = primaryInsert.data;
    let error = primaryInsert.error;

    if (error) {
      logger.warn('Falha no insert completo de lead. Tentando payload compatível.', {
        details: error.message,
      });

      const legacyPayload = {
        nome,
        email,
        whatsapp: normalizedPhone,
        tipo_contratacao: validatedData.tipo_contratacao || null,
        status: 'novo',
        origem,
        observacoes,
        historico,
        arquivado: false,
      };

      const legacyInsert = await supabase
        .from('insurance_leads')
        .insert([legacyPayload])
        .select()
        .single();

      if (!legacyInsert.error) {
        data = legacyInsert.data;
        error = null;
      } else {
        logger.error('Falha no payload compatível (fallback) ao salvar lead', legacyInsert.error as Error, {
          primary_error: error.message,
        });
        error = {
          ...legacyInsert.error,
          message: `${error.message} | fallback: ${legacyInsert.error.message}`,
        };
      }
    }
    
    if (error) {
      logger.error('Erro ao inserir lead', error as Error, { origem });
      return NextResponse.json(
        { error: 'Erro ao salvar lead', details: error.message },
        { status: 500 }
      );
    }
    
    logger.info('Lead criado com sucesso', { lead_id: data.id, origem, parcial: isParcial });

    // ✉️ Enviar email de notificação para a equipe comercial (async, não bloqueia resposta)
    enviarEmailNovoLead({
      nome: validatedData.nome || '',
      email: validatedData.email || '',
      telefone: validatedData.telefone || '',
      cnpj: validatedData.cnpj || undefined,
      perfil: validatedData.perfil || undefined,
      intencao: validatedData.intencao || undefined,
      perfilCnpj: validatedData.perfil_cnpj || undefined,
      acomodacao: validatedData.acomodacao || undefined,
      bairro: validatedData.bairro || undefined,
      idades: validatedData.idades_beneficiarios?.join(', ') || undefined,
      qtdVidas: validatedData.qtd_vidas_estimada?.toString() || undefined,
      usaBypass: validatedData.usa_bypass || false,
      origem,
      parcial: isParcial,
    }).catch((err: unknown) => {
      logger.error('Erro ao enviar email de novo lead', err as Error, { lead_id: data.id });
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Lead criado com sucesso!',
        leadId: data.id 
      },
      { status: 201 }
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    logger.error('Erro no servidor (leads)', error as Error, { path: '/api/leads' });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
