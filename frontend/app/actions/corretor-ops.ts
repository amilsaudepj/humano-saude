'use server';

import { createServiceClient } from '@/lib/supabase';
import type { CorretorDashboard, Renovacao, RenovacaoUpdate } from '@/lib/types/corretor';
import type { Comissao } from '@/lib/types/database';
import { logger } from '@/lib/logger';

// ========================================
// DASHBOARD DO CORRETOR
// ========================================

export async function getCorretorDashboard(corretorId: string): Promise<{
  success: boolean;
  data?: CorretorDashboard;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretor_dashboard')
      .select('*')
      .eq('corretor_id', corretorId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    logger.error('[getCorretorDashboard]', err);
    return { success: false, error: 'Erro ao carregar dashboard' };
  }
}

// ========================================
// COMISSÕES & FINANCEIRO
// ========================================

export async function getComissoes(
  corretorId: string,
  filtros?: { mes?: string; status?: string },
): Promise<{
  success: boolean;
  data?: Comissao[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('comissoes')
      .select('*')
      .eq('corretor_id', corretorId)
      .order('mes_referencia', { ascending: false });

    if (filtros?.mes) {
      query = query.gte('mes_referencia', `${filtros.mes}-01`)
        .lte('mes_referencia', `${filtros.mes}-31`);
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (err) {
    logger.error('[getComissoes]', err);
    return { success: false, error: 'Erro ao carregar comissões' };
  }
}

export async function getComissoesResumo(corretorId: string): Promise<{
  success: boolean;
  data?: {
    total_recebido: number;
    total_pendente: number;
    total_mes_atual: number;
    quantidade_propostas_ativas: number;
  };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data: comissoes, error } = await supabase
      .from('comissoes')
      .select('valor_comissao, status, mes_referencia')
      .eq('corretor_id', corretorId);

    if (error) throw error;

    const mesAtual = new Date().toISOString().slice(0, 7);

    const resumo = {
      total_recebido: 0,
      total_pendente: 0,
      total_mes_atual: 0,
      quantidade_propostas_ativas: 0,
    };

    (comissoes ?? []).forEach((c) => {
      if (c.status === 'paga') {
        resumo.total_recebido += Number(c.valor_comissao);
      }
      if (c.status === 'pendente') {
        resumo.total_pendente += Number(c.valor_comissao);
      }
      if (c.mes_referencia?.startsWith(mesAtual)) {
        resumo.total_mes_atual += Number(c.valor_comissao);
        resumo.quantidade_propostas_ativas++;
      }
    });

    return { success: true, data: resumo };
  } catch (err) {
    logger.error('[getComissoesResumo]', err);
    return { success: false, error: 'Erro ao carregar resumo' };
  }
}

// Grade de comissionamento: calcula baseado na regra de faixa
export async function calcularComissao(
  valorMensalidade: number,
  faixa: '100%' | '200%' | '300%',
  comissaoPadraoPct: number,
): Promise<{ valor: number; descricao: string }> {
  const multiplicadores: Record<string, number> = {
    '100%': 1,
    '200%': 2,
    '300%': 3,
  };

  const multiplicador = multiplicadores[faixa] ?? 1;
  const valor = (valorMensalidade * comissaoPadraoPct / 100) * multiplicador;

  return {
    valor: Math.round(valor * 100) / 100,
    descricao: `${comissaoPadraoPct}% × ${multiplicador}x = R$ ${valor.toFixed(2)}`,
  };
}

// ========================================
// RENOVAÇÕES (Gold Mine)
// ========================================

export async function getRenovacoes(
  corretorId: string,
  diasLimite: number = 60,
): Promise<{
  success: boolean;
  data?: Renovacao[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    // Calcula datas-limite dinamicamente (coluna gerada não existe na tabela)
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() - 30); // Inclui vencidos há até 30 dias
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + diasLimite);

    const { data, error } = await supabase
      .from('renovacoes')
      .select('*')
      .eq('corretor_id', corretorId)
      .gte('data_vencimento', minDate.toISOString().split('T')[0])
      .lte('data_vencimento', maxDate.toISOString().split('T')[0])
      .neq('status', 'renovado')
      .neq('status', 'cancelado')
      .order('data_vencimento', { ascending: true });

    if (error) throw error;

    // Computa dias_para_vencimento dinamicamente
    const enriched: Renovacao[] = (data ?? []).map((row) => {
      const vencimento = new Date(row.data_vencimento);
      const diffMs = vencimento.getTime() - now.getTime();
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...row, dias_para_vencimento: dias };
    });

    return { success: true, data: enriched };
  } catch (err) {
    logger.error('[getRenovacoes]', err);
    return { success: false, error: 'Erro ao carregar renovações' };
  }
}

export async function updateRenovacao(
  renovacaoId: string,
  updates: RenovacaoUpdate,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('renovacoes')
      .update(updates)
      .eq('id', renovacaoId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[updateRenovacao]', err);
    return { success: false, error: 'Erro ao atualizar renovação' };
  }
}

// ========================================
// MATERIAIS DE VENDAS
// ========================================

export async function getMateriais(filtros?: {
  categoria?: string;
  operadora_id?: string;
  busca?: string;
}): Promise<{
  success: boolean;
  data?: Array<Record<string, unknown>>;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('materiais_vendas')
      .select('*, operadora:operadoras(nome, logo_url)')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('ordem', { ascending: true });

    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }

    if (filtros?.operadora_id) {
      query = query.eq('operadora_id', filtros.operadora_id);
    }

    if (filtros?.busca) {
      query = query.ilike('nome', `%${filtros.busca}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data ?? [] };
  } catch (err) {
    logger.error('[getMateriais]', err);
    return { success: false, error: 'Erro ao carregar materiais' };
  }
}

// ========================================
// BANNER GENERATOR
// ========================================

export async function requestBanner(
  corretorId: string,
  nomeCorretor: string,
  whatsappCorretor: string,
  templateId?: string,
): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('banner_requests')
      .insert({
        corretor_id: corretorId,
        nome_corretor: nomeCorretor,
        whatsapp_corretor: whatsappCorretor,
        template_id: templateId,
        status: 'pendente',
      })
      .select('id')
      .single();

    if (error) throw error;

    // TODO: Disparar webhook para Nano Banana API renderizar o banner
    // await fetch(process.env.NANO_BANANA_WEBHOOK_URL, { ... })

    return { success: true, data };
  } catch (err) {
    logger.error('[requestBanner]', err);
    return { success: false, error: 'Erro ao solicitar banner' };
  }
}

// ========================================
// AUTH DO CORRETOR
// ========================================

export async function getCorretorById(corretorId: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretores')
      .select('*')
      .eq('id', corretorId)
      .eq('ativo', true)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    logger.error('[getCorretorById]', err);
    return { success: false, error: 'Corretor não encontrado' };
  }
}

const PRAZO_DIAS_CONFIRMACAO_EMAIL = 7;

/**
 * Status de confirmação de e-mail do corretor.
 * Usado no painel para exibir banner e dias restantes até suspensão.
 */
export async function getStatusConfirmacaoEmail(corretorId: string): Promise<{
  success: boolean;
  data?: {
    precisaConfirmar: boolean;
    diasRestantes: number;
    emailConfirmadoEm: string | null;
    created_at: string;
  };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretores')
      .select('email_confirmado_em, created_at, prazo_confirmacao_email_desde')
      .eq('id', corretorId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Corretor não encontrado' };
    }

    const emailConfirmadoEm = (data.email_confirmado_em as string | null) ?? null;
    const prazoDesde = (data.prazo_confirmacao_email_desde as string | null) ?? null;
    const created_at = (data.created_at as string) || new Date().toISOString();
    const inicioPrazo = prazoDesde || created_at;
    const precisaConfirmar = !emailConfirmadoEm;

    const inicioEm = new Date(inicioPrazo).getTime();
    const agora = Date.now();
    const diasDesdeInicio = Math.floor((agora - inicioEm) / (24 * 60 * 60 * 1000));
    const diasRestantes = Math.max(0, PRAZO_DIAS_CONFIRMACAO_EMAIL - diasDesdeInicio);

    return {
      success: true,
      data: {
        precisaConfirmar,
        diasRestantes,
        emailConfirmadoEm,
        created_at,
      },
    };
  } catch (err) {
    logger.error('[getStatusConfirmacaoEmail]', err);
    return { success: false, error: 'Erro ao verificar status' };
  }
}

/**
 * Reenvia e-mail de confirmação para o corretor (link único, 24h).
 */
export async function reenviarEmailConfirmacaoCorretor(corretorId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data: corretor, error: fetchError } = await supabase
      .from('corretores')
      .select('nome, email, email_confirmado_em')
      .eq('id', corretorId)
      .single();

    if (fetchError || !corretor?.email) {
      return { success: false, error: 'Corretor não encontrado' };
    }

    if ((corretor.email_confirmado_em as string | null) != null) {
      return { success: true }; // já confirmado, não precisa reenviar
    }

    const { signConfirmEmailToken } = await import('@/lib/auth-jwt');
    const { enviarEmailConfirmacaoCorretor } = await import('@/lib/email');

    const token = await signConfirmEmailToken(corretorId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
    const confirmLink = `${baseUrl}/api/auth/corretor/confirmar-email?token=${encodeURIComponent(token)}`;

    const result = await enviarEmailConfirmacaoCorretor({
      nome: (corretor.nome as string) || 'Corretor',
      email: corretor.email as string,
      confirmLink,
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Falha ao enviar e-mail' };
    }

    return { success: true };
  } catch (err) {
    logger.error('[reenviarEmailConfirmacaoCorretor]', err);
    return { success: false, error: 'Erro ao reenviar e-mail' };
  }
}

/**
 * Marca o e-mail do corretor como confirmado (chamado ao clicar no link do e-mail).
 */
export async function marcarEmailCorretorConfirmado(corretorId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('corretores')
      .update({ email_confirmado_em: new Date().toISOString() })
      .eq('id', corretorId);

    if (error) {
      logger.error('[marcarEmailCorretorConfirmado]', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    logger.error('[marcarEmailCorretorConfirmado]', err);
    return { success: false, error: 'Erro ao confirmar e-mail' };
  }
}
