'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  enviarEmailAfiliadoIndicacaoRecebida,
  enviarEmailAfiliadoStatusLead,
  enviarEmailAfiliadoVenda,
  enviarEmailCorretorNovoLeadAfiliado,
} from '@/lib/email';

// =============================================
// TIPOS
// =============================================

export type TipoIndicacaoLead = 'form_indicar' | 'form_indicar_afiliado';

export interface LeadIndicacao {
  id: string;
  corretor_id: string;
  afiliado_id?: string | null;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp?: string | null;
  cpf: string | null;
  operadora_atual: string | null;
  plano_atual: string | null;
  valor_atual: number | null;
  qtd_vidas: number;
  idades: string[] | null;
  valor_estimado_min: number | null;
  valor_estimado_max: number | null;
  economia_estimada: number | null;
  status: string;
  clicou_no_contato: boolean;
  data_contato: string | null;
  origem: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** Preenchido pela action: form_indicar (direto) ou form_indicar_afiliado (via afiliado) */
  tipo?: TipoIndicacaoLead;
  /** Nome do afiliado quando tipo = form_indicar_afiliado */
  afiliado_nome?: string | null;
}

export interface CorretorPublico {
  id: string;
  nome: string;
  slug: string;
  foto_url: string | null;
  logo_personalizada_url: string | null;
  cor_primaria: string | null;
  whatsapp: string | null;
  telefone: string | null;
  email: string | null;
}

// =============================================
// 1. VALIDAR SLUG DO CORRETOR
// =============================================

export async function getCorretorBySlug(slug: string): Promise<{
  success: boolean;
  data?: CorretorPublico;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretores')
      .select('id, nome, slug, foto_url, logo_personalizada_url, cor_primaria, whatsapp, telefone, email')
      .eq('slug', slug)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Corretor não encontrado' };
    }

    return { success: true, data };
  } catch (err) {
    logger.error('[getCorretorBySlug]', err);
    return { success: false, error: 'Erro ao buscar corretor' };
  }
}

/** Busca corretor por id (para /economizar/afiliado/[token]). */
export async function getCorretorById(corretorId: string): Promise<{
  success: boolean;
  data?: CorretorPublico;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('corretores')
      .select('id, nome, slug, foto_url, logo_personalizada_url, cor_primaria, whatsapp, telefone, email')
      .eq('id', corretorId)
      .eq('ativo', true)
      .single();
    if (error || !data) return { success: false, error: 'Corretor não encontrado' };
    return { success: true, data };
  } catch (err) {
    logger.error('[getCorretorById]', err);
    return { success: false, error: 'Erro ao buscar corretor' };
  }
}

// =============================================
// 2. SALVAR LEAD DA INDICAÇÃO
// =============================================

export async function salvarLeadIndicacao(dados: {
  corretor_id?: string;
  afiliado_id?: string;
  origem?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  operadora_atual?: string;
  plano_atual?: string;
  valor_atual?: number;
  qtd_vidas?: number;
  idades?: string[];
  valor_estimado_min?: number;
  valor_estimado_max?: number;
  economia_estimada?: number;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; lead_id?: string; error?: string }> {
  try {
    const supabase = createServiceClient();
    const corretorId = dados.corretor_id || null;
    const nome = dados.nome || null;
    const telefone = dados.telefone || null;
    const email = dados.email || null;

    let nomeAfiliado: string | null = null;
    if (dados.afiliado_id) {
      const { data: af } = await supabase
        .from('corretor_afiliados')
        .select('nome')
        .eq('id', dados.afiliado_id)
        .single();
      nomeAfiliado = af?.nome ?? null;
    }

    const observacoesIndicacao =
      nomeAfiliado
        ? `Indicação do afiliado: ${nomeAfiliado}`
        : null;
    const historicoIndicacao = nomeAfiliado
      ? [
          {
            timestamp: new Date().toISOString(),
            evento: 'lead_criado',
            origem: 'form_indicar_afiliado',
            detalhes: `Indicação do afiliado ${nomeAfiliado}. Lead no painel e no CRM do corretor.`,
          },
        ]
      : undefined;

    // Criar lead em insurance_leads e card no CRM do corretor para a indicação aparecer no Kanban
    let insuranceLeadId: string | null = null;
    if (corretorId && (nome || telefone)) {
      const whatsapp = typeof telefone === 'string' ? telefone.replace(/\D/g, '') : '';
      const { data: newLead, error: leadErr } = await supabase
        .from('insurance_leads')
        .insert({
          nome: nome || 'Indicado',
          whatsapp: whatsapp || null,
          email: email || null,
          corretor_id: corretorId,
          status: 'novo',
          origem: dados.origem || 'form_indicar_afiliado',
          prioridade: 'media',
          idades: [],
          arquivado: false,
          ...(observacoesIndicacao && { observacoes: observacoesIndicacao }),
          ...(historicoIndicacao && { historico: historicoIndicacao }),
        })
        .select('id')
        .single();
      if (!leadErr && newLead?.id) {
        insuranceLeadId = newLead.id;
        const { createCardForExistingLead } = await import('@/app/actions/corretor-crm');
        await createCardForExistingLead(newLead.id, corretorId, 'novo_lead');
      }
    }

    const insertPayload: Record<string, unknown> = {
      corretor_id: corretorId,
      nome,
      email,
      telefone,
      cpf: dados.cpf || null,
      operadora_atual: dados.operadora_atual || null,
      plano_atual: dados.plano_atual || null,
      valor_atual: dados.valor_atual || null,
      qtd_vidas: dados.qtd_vidas || 1,
      idades: dados.idades || null,
      valor_estimado_min: dados.valor_estimado_min || null,
      valor_estimado_max: dados.valor_estimado_max || null,
      economia_estimada: dados.economia_estimada || null,
      status: 'simulou',
      origem: dados.origem || 'link_corretor',
      metadata: dados.metadata || {},
    };
    if (dados.afiliado_id) insertPayload.afiliado_id = dados.afiliado_id;

    const { data, error } = await supabase
      .from('leads_indicacao')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) throw error;

    // E-mails: afiliado (confirmação) e corretor (novo lead) — só quando veio de afiliado
    if (dados.afiliado_id && corretorId && (nome || telefone)) {
      const nomeIndicado = nome || 'Indicado';
      const telefoneLead = typeof telefone === 'string' ? telefone : '';

      Promise.all([
        supabase.from('corretor_afiliados').select('nome, email').eq('id', dados.afiliado_id).single(),
        supabase.from('corretores').select('nome, email').eq('id', corretorId).single(),
      ])
        .then(([afRes, corRes]) => {
          const afiliado = afRes.data as { nome?: string; email?: string } | null;
          const corretor = corRes.data as { nome?: string; email?: string } | null;

          if (afiliado?.email) {
            enviarEmailAfiliadoIndicacaoRecebida({
              to: afiliado.email,
              nomeAfiliado: afiliado.nome || 'Afiliado',
              nomeIndicado,
            }).catch((e) => logger.warn('[salvarLeadIndicacao] e-mail afiliado', e));
          }
          if (corretor?.email) {
            enviarEmailCorretorNovoLeadAfiliado({
              to: corretor.email,
              nomeCorretor: corretor.nome || 'Corretor',
              nomeAfiliado: nomeAfiliado || afiliado?.nome || 'Afiliado',
              nomeLead: nomeIndicado,
              telefoneLead,
              emailLead: email || null,
            }).catch((e) => logger.warn('[salvarLeadIndicacao] e-mail corretor', e));
          }
        })
        .catch((e) => logger.warn('[salvarLeadIndicacao] e-mails indicação', e));
    }

    return { success: true, lead_id: data?.id };
  } catch (err) {
    logger.error('[salvarLeadIndicacao]', err);
    return { success: false, error: 'Erro ao salvar lead' };
  }
}

// =============================================
// 3. MARCAR CLICOU NO CONTATO
// =============================================

export async function marcarClicouContato(leadId: string): Promise<{ success: boolean }> {
  try {
    const supabase = createServiceClient();

    await supabase
      .from('leads_indicacao')
      .update({
        clicou_no_contato: true,
        data_contato: new Date().toISOString(),
        status: 'entrou_em_contato',
      })
      .eq('id', leadId);

    return { success: true };
  } catch (err) {
    logger.error('[marcarClicouContato]', err);
    return { success: false };
  }
}

// =============================================
// 4. ATUALIZAR STATUS DO LEAD
// =============================================

export async function atualizarStatusLead(
  leadId: string,
  novoStatus: string,
  opts?: { valor?: string; prazo?: string; formaPagamento?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('leads_indicacao')
      .update({ status: novoStatus })
      .eq('id', leadId);

    if (error) throw error;

    // Notificar afiliado por e-mail (mudança de status e, se fechado, e-mail de venda)
    const { data: lead } = await supabase
      .from('leads_indicacao')
      .select('id, nome, afiliado_id')
      .eq('id', leadId)
      .single();

    if (lead?.afiliado_id) {
      const { data: afiliado } = await supabase
        .from('corretor_afiliados')
        .select('id, nome, email')
        .eq('id', lead.afiliado_id)
        .single();

      if (afiliado?.email) {
        await enviarEmailAfiliadoStatusLead({
          to: afiliado.email,
          nomeAfiliado: afiliado.nome || 'Afiliado',
          nomeLead: lead.nome || 'Indicação',
          novoStatus,
        });
        if (novoStatus === 'fechado') {
          await enviarEmailAfiliadoVenda({
            to: afiliado.email,
            nomeAfiliado: afiliado.nome || 'Afiliado',
            nomeLead: lead.nome || 'Indicação',
            valor: opts?.valor,
            prazo: opts?.prazo,
            formaPagamento: opts?.formaPagamento,
          });
        }
      }
    }

    return { success: true };
  } catch (err) {
    logger.error('[atualizarStatusLead]', err);
    return { success: false, error: 'Erro ao atualizar status' };
  }
}

// =============================================
// 5. LISTAR INDICAÇÕES DO CORRETOR (Dashboard)
// =============================================

export async function getIndicacoesCorretor(
  corretorId: string,
  filtros?: {
    status?: string;
    busca?: string;
    pagina?: number;
    limite?: number;
  },
): Promise<{
  success: boolean;
  data?: LeadIndicacao[];
  total?: number;
  resumo?: {
    total: number;
    simularam: number;
    contataram: number;
    em_analise: number;
    fechados: number;
    taxa_conversao: number;
  };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const pagina = filtros?.pagina || 1;
    const limite = filtros?.limite || 20;
    const offset = (pagina - 1) * limite;

    // Query principal
    let query = supabase
      .from('leads_indicacao')
      .select('*', { count: 'exact' })
      .eq('corretor_id', corretorId)
      .order('created_at', { ascending: false });

    if (filtros?.status && filtros.status !== 'todos') {
      query = query.eq('status', filtros.status);
    }

    if (filtros?.busca) {
      query = query.or(
        `nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%`,
      );
    }

    query = query.range(offset, offset + limite - 1);

    const { data: rawData, error, count } = await query;

    if (error) throw error;

    // Enriquecer com tipo e nome do afiliado
    const afiliadoIds = [...new Set((rawData ?? []).map((l) => l.afiliado_id).filter(Boolean))] as string[];
    const { data: afiliados } = afiliadoIds.length
      ? await supabase.from('corretor_afiliados').select('id, nome').in('id', afiliadoIds)
      : { data: [] };
    const afiliadoNomeById = new Map<string, string>(((afiliados as { id: string; nome: string }[]) || []).map((a) => [a.id, a.nome || '']));

    const data = (rawData ?? []).map((lead) => ({
      ...lead,
      tipo: lead.afiliado_id ? ('form_indicar_afiliado' as const) : ('form_indicar' as const),
      afiliado_nome: lead.afiliado_id ? (afiliadoNomeById.get(lead.afiliado_id) ?? null) : null,
    }));

    // Resumo de métricas
    const { data: metricas } = await supabase
      .from('leads_indicacao')
      .select('status')
      .eq('corretor_id', corretorId);

    const total = metricas?.length || 0;
    const simularam = metricas?.filter((m) => m.status === 'simulou').length || 0;
    const contataram = metricas?.filter((m) =>
      ['entrou_em_contato', 'em_analise', 'proposta_enviada', 'fechado'].includes(m.status),
    ).length || 0;
    const em_analise = metricas?.filter((m) =>
      ['em_analise', 'proposta_enviada'].includes(m.status),
    ).length || 0;
    const fechados = metricas?.filter((m) => m.status === 'fechado').length || 0;

    return {
      success: true,
      data: data ?? [],
      total: count ?? 0,
      resumo: {
        total,
        simularam,
        contataram,
        em_analise,
        fechados,
        taxa_conversao: total > 0 ? Math.round((fechados / total) * 100) : 0,
      },
    };
  } catch (err) {
    logger.error('[getIndicacoesCorretor]', err);
    return { success: false, error: 'Erro ao buscar indicações' };
  }
}

// =============================================
// 6. LISTAR INDICAÇÕES DO AFILIADO (Dashboard afiliado)
// =============================================

export async function getIndicacoesAfiliado(
  afiliadoId: string,
  filtros?: { status?: string; pagina?: number; limite?: number },
): Promise<{
  success: boolean;
  data?: LeadIndicacao[];
  total?: number;
  resumo?: { total: number; simularam: number; contataram: number; em_analise: number; fechados: number; taxa_conversao: number };
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const pagina = filtros?.pagina || 1;
    const limite = filtros?.limite || 20;
    const offset = (pagina - 1) * limite;

    let query = supabase
      .from('leads_indicacao')
      .select('*', { count: 'exact' })
      .eq('afiliado_id', afiliadoId)
      .order('created_at', { ascending: false });

    if (filtros?.status && filtros.status !== 'todos') {
      query = query.eq('status', filtros.status);
    }

    const { data: rawData, error, count } = await query.range(offset, offset + limite - 1);

    if (error) throw error;

    const data = (rawData ?? []).map((lead) => ({
      ...lead,
      tipo: 'form_indicar_afiliado' as const,
      afiliado_nome: null,
    }));

    const { data: metricas } = await supabase
      .from('leads_indicacao')
      .select('status')
      .eq('afiliado_id', afiliadoId);

    const total = metricas?.length || 0;
    const simularam = metricas?.filter((m) => m.status === 'simulou').length || 0;
    const contataram = metricas?.filter((m) =>
      ['entrou_em_contato', 'em_analise', 'proposta_enviada', 'fechado'].includes(m.status),
    ).length || 0;
    const em_analise = metricas?.filter((m) =>
      ['em_analise', 'proposta_enviada'].includes(m.status),
    ).length || 0;
    const fechados = metricas?.filter((m) => m.status === 'fechado').length || 0;

    return {
      success: true,
      data,
      total: count ?? 0,
      resumo: {
        total,
        simularam,
        contataram,
        em_analise,
        fechados,
        taxa_conversao: total > 0 ? Math.round((fechados / total) * 100) : 0,
      },
    };
  } catch (err) {
    logger.error('[getIndicacoesAfiliado]', err);
    return { success: false, error: 'Erro ao buscar indicações' };
  }
}

// =============================================
// 7. LEADS DO /ECONOMIZAR DO CORRETOR (insurance_leads onde dados_pdf.corretor.id = corretorId)
// =============================================

export interface LeadEconomizar {
  id: string;
  nome: string | null;
  whatsapp: string | null;
  email: string | null;
  operadora_atual: string | null;
  status: string | null;
  valor_atual: number | null;
  economia_estimada: number | null;
  dados_pdf: Record<string, unknown> | null;
  created_at: string;
}

export async function getLeadsEconomizarCorretor(corretorId: string): Promise<{
  success: boolean;
  data?: LeadEconomizar[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const { data: rawData, error } = await supabase
      .from('insurance_leads')
      .select('id, nome, whatsapp, email, operadora_atual, status, valor_atual, economia_estimada, dados_pdf, created_at')
      .eq('arquivado', false)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const dados_pdf = (rawData ?? []) as Array<{ dados_pdf?: { corretor?: { id?: string } } | null }>;
    const data = dados_pdf.filter(
      (row) => (row.dados_pdf as { corretor?: { id?: string } } | null)?.corretor?.id === corretorId
    ) as LeadEconomizar[];

    return { success: true, data };
  } catch (err) {
    logger.error('[getLeadsEconomizarCorretor]', err);
    return { success: false, error: 'Erro ao buscar leads do economizar' };
  }
}
