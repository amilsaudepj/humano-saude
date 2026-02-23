import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiLeadSchema } from '@/lib/validations';
import { checkRateLimit, leadsLimiter } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { enviarEmailNovoLead, enviarEmailConfirmacaoLeadCliente } from '@/lib/email';

function parseValidIp(ip: string): string | null {
  const raw = (ip || '').trim().split(',')[0].trim();
  if (!raw || raw === 'unknown') return null;
  const v4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const v6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (v4.test(raw) || v6.test(raw)) return raw;
  return null;
}

/** Normaliza telefone para o constraint whatsapp_format: ^\+?[0-9]{10,15}$ */
function normalizeWhatsapp(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, leadsLimiter);
    if (blocked) return blocked;

    const body = await request.json();
    const validatedData = apiLeadSchema.parse(body);

    const top_3_planos = Array.isArray(validatedData.top_3_planos)
      ? validatedData.top_3_planos.join(', ')
      : validatedData.top_3_planos || null;

    const ipRaw =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '';
    const ipAddress = parseValidIp(ipRaw);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const origem = validatedData.origem || validatedData.source || 'landing';
    const isParcial = validatedData.parcial === true;

    const whatsappNormalized = normalizeWhatsapp(validatedData.telefone);

    const supabase = createServiceClient();
    const insertPayload = {
      nome: validatedData.nome || null,
      email: validatedData.email || null,
      whatsapp: whatsappNormalized,
      telefone: validatedData.telefone || null,
      perfil: validatedData.perfil || null,
      tipo_contratacao: validatedData.tipo_contratacao || null,
      cnpj: validatedData.cnpj || null,
      acomodacao: validatedData.acomodacao || null,
      idades_beneficiarios: validatedData.idades_beneficiarios || null,
      bairro: validatedData.bairro || null,
      operadora_atual: validatedData.operadora_atual || null,
      top_3_planos,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: isParcial ? 'parcial' : 'novo',
      origem,
      utm_source: validatedData.utm_source || null,
      utm_medium: validatedData.utm_medium || null,
      utm_campaign: validatedData.utm_campaign || null,
      historico: [
        {
          timestamp: new Date().toISOString(),
          evento: isParcial ? 'lead_parcial' : 'lead_criado',
          origem,
          detalhes: isParcial
            ? 'Lead parcial salvo (usuário abandonou o formulário)'
            : `Lead criado via ${origem}`,
        },
      ],
      arquivado: false,
    };

    const { data, error } = await supabase
      .from('insurance_leads')
      .insert([insertPayload])
      .select()
      .single();
    
    if (error) {
      logger.error('Erro ao inserir lead', error as Error, { origem });
      return NextResponse.json(
        { error: 'Erro ao salvar lead', details: error.message },
        { status: 500 }
      );
    }
    
    logger.info('Lead criado com sucesso', { lead_id: data.id, origem, parcial: isParcial });

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

    if (!isParcial && validatedData.email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validatedData.email.trim())) {
      enviarEmailConfirmacaoLeadCliente({
        nome: (validatedData.nome || '').trim() || 'Cliente',
        email: validatedData.email.trim(),
      }).catch((err: unknown) => {
        logger.error('Erro ao enviar email de confirmação ao cliente', err as Error, { lead_id: data.id });
      });
    }

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
