import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiLeadSchema } from '@/lib/validations';
import { checkRateLimit, leadsLimiter } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { enviarEmailNovoLead } from '@/lib/email';

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
    
    // Capturar IP e User-Agent
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Determinar origem
    const origem = validatedData.origem || validatedData.source || 'landing';
    const isParcial = validatedData.parcial === true;
    
    // ✅ Tabela unificada: insurance_leads
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('insurance_leads')
      .insert([
        {
          nome: validatedData.nome || null,
          email: validatedData.email || null,
          whatsapp: validatedData.telefone || null,
          telefone: validatedData.telefone || null,
          perfil: validatedData.perfil || null,
          tipo_contratacao: validatedData.tipo_contratacao || null,
          cnpj: validatedData.cnpj || null,
          acomodacao: validatedData.acomodacao || null,
          idades_beneficiarios: validatedData.idades_beneficiarios || null,
          bairro: validatedData.bairro || null,
          top_3_planos,
          ip_address: ip,
          user_agent: userAgent,
          status: isParcial ? 'parcial' : 'novo',
          origem,
          utm_source: validatedData.utm_source || null,
          utm_medium: validatedData.utm_medium || null,
          utm_campaign: validatedData.utm_campaign || null,
          empresa: validatedData.empresa || null,
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
        },
      ])
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
