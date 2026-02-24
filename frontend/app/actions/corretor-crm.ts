'use server';

import { createServiceClient } from '@/lib/supabase';
import type {
  CrmCard,
  CrmCardEnriched,
  CrmCardInsert,
  CrmCardUpdate,
  CrmInteracaoInsert,
  KanbanBoard,
  KanbanColumnSlug,
  KANBAN_COLUMN_SLUG,
} from '@/lib/types/corretor';
import { logger } from '@/lib/logger';

// ========================================
// HELPERS
// ========================================

function enrichCard(card: CrmCard & { lead?: Record<string, unknown> | null }): CrmCardEnriched {
  const now = Date.now();
  const updatedAt = new Date(card.updated_at).getTime();
  const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
  
  const lastPropostaInteraction = card.ultima_interacao_proposta
    ? new Date(card.ultima_interacao_proposta).getTime()
    : 0;
  const hoursSincePropostaInteraction = lastPropostaInteraction
    ? (now - lastPropostaInteraction) / (1000 * 60 * 60)
    : Infinity;

  return {
    ...card,
    lead: card.lead
      ? {
          nome: String(card.lead.nome ?? ''),
          whatsapp: String(card.lead.whatsapp ?? ''),
          email: card.lead.email ? String(card.lead.email) : null,
          operadora_atual: card.lead.operadora_atual ? String(card.lead.operadora_atual) : null,
          valor_atual: card.lead.valor_atual ? Number(card.lead.valor_atual) : null,
          origem: card.lead.origem ? String(card.lead.origem) : null,
          tipo_contratacao: card.lead.tipo_contratacao ? String(card.lead.tipo_contratacao) : null,
          observacoes: card.lead.observacoes ? String(card.lead.observacoes) : null,
          created_at: card.lead.created_at ? String(card.lead.created_at) : null,
        }
      : null,
    is_hot: hoursSincePropostaInteraction <= 24,
    is_stale: hoursSinceUpdate > 48,
    hours_since_update: Math.round(hoursSinceUpdate),
  };
}

// ========================================
// KANBAN BOARD
// ========================================

export async function getKanbanBoard(corretorId: string): Promise<{
  success: boolean;
  data?: KanbanBoard;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data: cards, error } = await supabase
      .from('crm_cards')
      .select(`
        *,
        lead:insurance_leads(nome, whatsapp, email, operadora_atual, valor_atual, origem, tipo_contratacao, observacoes, created_at)
      `)
      .eq('corretor_id', corretorId)
      .order('posicao', { ascending: true });

    if (error) throw error;

    const columns: KanbanColumnSlug[] = [
      'novo_lead',
      'qualificado',
      'proposta_enviada',
      'documentacao',
      'fechado',
      'perdido',
    ];

    const board: KanbanBoard = {} as KanbanBoard;
    columns.forEach((col) => {
      board[col] = [];
    });

    (cards ?? []).forEach((card) => {
      const enriched = enrichCard(card as CrmCard & { lead?: Record<string, unknown> | null });
      if (board[enriched.coluna_slug]) {
        board[enriched.coluna_slug].push(enriched);
      }
    });

    return { success: true, data: board };
  } catch (err) {
    logger.error('[getKanbanBoard]', err);
    return { success: false, error: 'Erro ao carregar o pipeline' };
  }
}

// ========================================
// CRUD CARDS
// ========================================

export async function createCrmCard(data: CrmCardInsert): Promise<{
  success: boolean;
  data?: CrmCard;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data: card, error } = await supabase
      .from('crm_cards')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Registra interação de criação
    await supabase.from('crm_interacoes').insert({
      card_id: card.id,
      corretor_id: data.corretor_id,
      lead_id: data.lead_id,
      tipo: 'sistema',
      titulo: 'Card criado',
      descricao: `Lead "${data.titulo}" adicionado ao pipeline`,
    });

    return { success: true, data: card };
  } catch (err) {
    logger.error('[createCrmCard]', err);
    return { success: false, error: 'Erro ao criar card' };
  }
}

// ========================================
// CRIAR LEAD COMPLETO + CARD NO PIPELINE
// ========================================

export async function createLeadWithCard(input: {
  corretor_id: string;
  coluna_slug: KanbanColumnSlug;
  // Dados do lead
  nome: string;
  whatsapp: string;
  email?: string | null;
  operadora_atual?: string | null;
  valor_atual?: number | null;
  tipo_contratacao?: string | null;
  idades?: number[];
  observacoes?: string | null;
  origem?: string | null;
  // Dados do card
  valor_estimado?: number | null;
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  tags?: string[];
}): Promise<{ success: boolean; data?: CrmCard; error?: string }> {
  try {
    const supabase = createServiceClient();

    // 1. Cria o lead na insurance_leads
    const { data: lead, error: leadError } = await supabase
      .from('insurance_leads')
      .insert({
        nome: input.nome,
        whatsapp: input.whatsapp,
        email: input.email ?? null,
        operadora_atual: input.operadora_atual ?? null,
        valor_atual: input.valor_atual ?? null,
        tipo_contratacao: input.tipo_contratacao ?? null,
        idades: input.idades ?? [],
        status: 'novo',
        origem: input.origem ?? 'corretor_crm',
        prioridade: input.prioridade ?? 'media',
        observacoes: input.observacoes ?? null,
        atribuido_a: null,
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // 2. Cria o card no kanban vinculado ao lead
    const { data: card, error: cardError } = await supabase
      .from('crm_cards')
      .insert({
        corretor_id: input.corretor_id,
        lead_id: lead.id,
        coluna_slug: input.coluna_slug,
        titulo: input.nome,
        subtitulo: input.operadora_atual
          ? `${input.operadora_atual}${input.valor_atual ? ` · R$ ${input.valor_atual.toLocaleString('pt-BR')}` : ''}`
          : null,
        valor_estimado: input.valor_estimado ?? null,
        posicao: 0,
        score: 0,
        score_motivo: null,
        ultima_interacao_proposta: null,
        total_interacoes: 0,
        tags: input.tags ?? [],
        prioridade: input.prioridade ?? 'media',
        metadata: {},
      })
      .select()
      .single();

    if (cardError) throw cardError;

    // 3. Registra interação de criação
    await supabase.from('crm_interacoes').insert({
      card_id: card.id,
      corretor_id: input.corretor_id,
      lead_id: lead.id,
      tipo: 'sistema',
      titulo: 'Lead criado via CRM',
      descricao: `Lead "${input.nome}" (${input.whatsapp}) adicionado ao pipeline`,
    });

    return { success: true, data: card };
  } catch (err) {
    logger.error('[createLeadWithCard]', err);
    return { success: false, error: 'Erro ao criar lead' };
  }
}

/**
 * Adiciona um lead já existente (insurance_leads) ao CRM do corretor.
 * Usado quando um lead/indicação entra por outro canal e deve aparecer no Kanban.
 */
export async function createCardForExistingLead(
  leadId: string,
  corretorId: string,
  colunaSlug: KanbanColumnSlug = 'novo_lead',
): Promise<{ success: boolean; data?: CrmCard; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { data: lead, error: leadError } = await supabase
      .from('insurance_leads')
      .select('id, nome, whatsapp, email, operadora_atual, valor_atual')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      logger.warn('[createCardForExistingLead] Lead não encontrado', { leadId, error: leadError?.message });
      return { success: false, error: 'Lead não encontrado' };
    }

    const { data: card, error: cardError } = await supabase
      .from('crm_cards')
      .insert({
        corretor_id: corretorId,
        lead_id: lead.id,
        coluna_slug: colunaSlug,
        titulo: lead.nome || 'Indicado',
        subtitulo: lead.operadora_atual
          ? `${lead.operadora_atual}${lead.valor_atual ? ` · R$ ${Number(lead.valor_atual).toLocaleString('pt-BR')}` : ''}`
          : null,
        valor_estimado: lead.valor_atual ?? null,
        posicao: 0,
        score: 0,
        score_motivo: null,
        ultima_interacao_proposta: null,
        total_interacoes: 0,
        tags: [],
        prioridade: 'media',
        metadata: {},
      })
      .select()
      .single();

    if (cardError) throw cardError;

    await supabase.from('crm_interacoes').insert({
      card_id: card.id,
      corretor_id: corretorId,
      lead_id: lead.id,
      tipo: 'sistema',
      titulo: 'Lead adicionado ao CRM',
      descricao: `Lead "${lead.nome || 'Indicado'}" (${lead.whatsapp || '—'}) entrou por indicação/formulário`,
    });

    return { success: true, data: card };
  } catch (err) {
    logger.error('[createCardForExistingLead]', err);
    return { success: false, error: 'Erro ao adicionar lead ao CRM' };
  }
}

export async function updateCrmCard(
  cardId: string,
  updates: CrmCardUpdate,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('crm_cards')
      .update(updates)
      .eq('id', cardId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[updateCrmCard]', err);
    return { success: false, error: 'Erro ao atualizar card' };
  }
}

export async function moveCard(
  cardId: string,
  destinationColumn: KanbanColumnSlug,
  newPosition: number,
  corretorId: string,
  sourceColumn?: KanbanColumnSlug,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('crm_cards')
      .update({
        coluna_slug: destinationColumn,
        posicao: newPosition,
      })
      .eq('id', cardId);

    if (error) throw error;

    // Registra mudança de coluna no histórico
    if (sourceColumn && sourceColumn !== destinationColumn) {
      await supabase.from('crm_interacoes').insert({
        card_id: cardId,
        corretor_id: corretorId,
        tipo: 'status_change',
        titulo: 'Status alterado',
        status_anterior: sourceColumn,
        status_novo: destinationColumn,
      });
    }

    return { success: true };
  } catch (err) {
    logger.error('[moveCard]', err);
    return { success: false, error: 'Erro ao mover card' };
  }
}

// ========================================
// INTERAÇÕES (Timeline Hubspot-style)
// ========================================

export async function getCardInteracoes(cardId: string): Promise<{
  success: boolean;
  data?: CrmInteracaoInsert[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('crm_interacoes')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (err) {
    logger.error('[getCardInteracoes]', err);
    return { success: false, error: 'Erro ao carregar interações' };
  }
}

export async function addInteracao(data: CrmInteracaoInsert): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase.from('crm_interacoes').insert(data);
    if (error) throw error;

    // Atualiza total_interacoes e ultima_interacao_proposta no card
    const isPropostaRelated = ['proposta_enviada', 'proposta_aceita', 'proposta_recusada'].includes(data.tipo);

    try {
      await supabase.rpc('increment_card_interacoes', {
        p_card_id: data.card_id,
        p_is_proposta: isPropostaRelated,
      });
    } catch { /* best effort - RPC pode não existir ainda */ }

    return { success: true };
  } catch (err) {
    logger.error('[addInteracao]', err);
    return { success: false, error: 'Erro ao registrar interação' };
  }
}

// ========================================
// LEAD SCORING
// ========================================

export async function recalculateScore(cardId: string): Promise<{
  success: boolean;
  score?: number;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data: card } = await supabase
      .from('crm_cards')
      .select('*, lead:insurance_leads(*)')
      .eq('id', cardId)
      .single();

    if (!card) throw new Error('Card não encontrado');

    let score = 0;
    const motivos: string[] = [];

    // +20 se tem valor estimado
    if (card.valor_estimado && card.valor_estimado > 0) {
      score += 20;
      motivos.push('Valor estimado preenchido');
    }

    // +25 se interagiu com proposta nas últimas 24h
    if (card.ultima_interacao_proposta) {
      const hours = (Date.now() - new Date(card.ultima_interacao_proposta).getTime()) / 3600000;
      if (hours <= 24) {
        score += 25;
        motivos.push('Interação recente com proposta');
      }
    }

    // +15 se tem mais de 3 interações
    if (card.total_interacoes > 3) {
      score += 15;
      motivos.push(`${card.total_interacoes} interações registradas`);
    }

    // +20 se está em colunas avançadas
    const advancedColumns = ['proposta_enviada', 'documentacao'];
    if (advancedColumns.includes(card.coluna_slug)) {
      score += 20;
      motivos.push('Estágio avançado no pipeline');
    }

    // +10 se lead tem email
    if (card.lead?.email) {
      score += 10;
      motivos.push('Email disponível');
    }

    // +10 se prioridade alta/urgente
    if (['alta', 'urgente'].includes(card.prioridade)) {
      score += 10;
      motivos.push('Prioridade alta');
    }

    score = Math.min(score, 100);

    await supabase
      .from('crm_cards')
      .update({ score, score_motivo: motivos.join('; ') })
      .eq('id', cardId);

    return { success: true, score };
  } catch (err) {
    logger.error('[recalculateScore]', err);
    return { success: false, error: 'Erro ao recalcular score' };
  }
}

// ========================================
// CRM STATS (Big Numbers + Funil)
// ========================================

export type CrmStats = {
  totalLeads: number;
  porColuna: Record<KanbanColumnSlug, number>;
  valorTotalPipeline: number;
  valorFechado: number;
  taxaConversao: number;
  tempoMedioPorEtapa: Record<string, number>;
  leadsHot: number;
  leadsStale: number;
  scoreDistribuicao: { faixa: string; count: number }[];
  interacoesUltimos7d: number;
  funil: { etapa: string; total: number; cor: string }[];
};

export async function getCrmStats(corretorId: string): Promise<{
  success: boolean;
  data?: CrmStats;
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data: cards, error } = await supabase
      .from('crm_cards')
      .select('*')
      .eq('corretor_id', corretorId);

    if (error) throw error;

    const allCards = cards ?? [];
    const now = Date.now();

    const porColuna: Record<string, number> = {};
    const columns: KanbanColumnSlug[] = ['novo_lead', 'qualificado', 'proposta_enviada', 'documentacao', 'fechado', 'perdido'];
    columns.forEach((c) => { porColuna[c] = 0; });

    let valorTotalPipeline = 0;
    let valorFechado = 0;
    let leadsHot = 0;
    let leadsStale = 0;
    const scoreRanges = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };

    allCards.forEach((card) => {
      porColuna[card.coluna_slug] = (porColuna[card.coluna_slug] ?? 0) + 1;
      const val = Number(card.valor_estimado ?? 0);

      if (card.coluna_slug !== 'perdido') valorTotalPipeline += val;
      if (card.coluna_slug === 'fechado') valorFechado += val;

      const hoursUpdate = (now - new Date(card.updated_at).getTime()) / 3600000;
      const lastProposta = card.ultima_interacao_proposta
        ? (now - new Date(card.ultima_interacao_proposta).getTime()) / 3600000
        : Infinity;

      if (lastProposta <= 24) leadsHot++;
      if (hoursUpdate > 48 && card.coluna_slug !== 'fechado' && card.coluna_slug !== 'perdido') leadsStale++;

      const s = card.score ?? 0;
      if (s <= 25) scoreRanges['0-25']++;
      else if (s <= 50) scoreRanges['26-50']++;
      else if (s <= 75) scoreRanges['51-75']++;
      else scoreRanges['76-100']++;
    });

    const totalAtivos = allCards.filter((c) => c.coluna_slug !== 'perdido').length;
    const fechados = porColuna['fechado'] ?? 0;
    const taxaConversao = totalAtivos > 0 ? Math.round((fechados / totalAtivos) * 100) : 0;

    // Interações últimos 7 dias
    const seteDiasAtras = new Date(now - 7 * 24 * 3600000).toISOString();
    const { count: interacoesCount } = await supabase
      .from('crm_interacoes')
      .select('*', { count: 'exact', head: true })
      .eq('corretor_id', corretorId)
      .gte('created_at', seteDiasAtras);

    const funnelColors: Record<string, string> = {
      novo_lead: '#3B82F6',
      qualificado: '#8B5CF6',
      proposta_enviada: '#F59E0B',
      documentacao: '#06B6D4',
      fechado: '#10B981',
      perdido: '#EF4444',
    };

    const funnelLabels: Record<string, string> = {
      novo_lead: 'Novo Lead',
      qualificado: 'Qualificado',
      proposta_enviada: 'Proposta Enviada',
      documentacao: 'Documentação',
      fechado: 'Fechado',
      perdido: 'Perdido',
    };

    const funil = columns.map((col) => ({
      etapa: funnelLabels[col] ?? col,
      total: porColuna[col] ?? 0,
      cor: funnelColors[col] ?? '#666',
    }));

    return {
      success: true,
      data: {
        totalLeads: allCards.length,
        porColuna: porColuna as Record<KanbanColumnSlug, number>,
        valorTotalPipeline,
        valorFechado,
        taxaConversao,
        tempoMedioPorEtapa: {},
        leadsHot,
        leadsStale,
        scoreDistribuicao: Object.entries(scoreRanges).map(([faixa, count]) => ({ faixa, count })),
        interacoesUltimos7d: interacoesCount ?? 0,
        funil,
      },
    };
  } catch (err) {
    logger.error('[getCrmStats]', err);
    return { success: false, error: 'Erro ao carregar métricas' };
  }
}

// ========================================
// LEADS LIST (Tabela com filtros)
// ========================================

export type LeadListFilters = {
  search?: string;
  colunaSlug?: KanbanColumnSlug | 'todos';
  prioridade?: string;
  scoreMin?: number;
  scoreMax?: number;
  orderBy?: 'created_at' | 'updated_at' | 'score' | 'valor_estimado';
  orderDir?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
};

export type LeadListResult = {
  leads: CrmCardEnriched[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export async function getLeadsList(
  corretorId: string,
  filters: LeadListFilters = {},
): Promise<{ success: boolean; data?: LeadListResult; error?: string }> {
  try {
    const supabase = createServiceClient();
    const {
      search,
      colunaSlug = 'todos',
      prioridade,
      scoreMin,
      scoreMax,
      orderBy = 'updated_at',
      orderDir = 'desc',
      page = 1,
      perPage = 20,
    } = filters;

    let query = supabase
      .from('crm_cards')
      .select(`
        *,
        lead:insurance_leads(nome, whatsapp, email, operadora_atual, valor_atual, origem, tipo_contratacao, observacoes, created_at)
      `, { count: 'exact' })
      .eq('corretor_id', corretorId);

    if (colunaSlug && colunaSlug !== 'todos') {
      query = query.eq('coluna_slug', colunaSlug);
    }

    if (prioridade) {
      query = query.eq('prioridade', prioridade);
    }

    if (scoreMin !== undefined) {
      query = query.gte('score', scoreMin);
    }

    if (scoreMax !== undefined) {
      query = query.lte('score', scoreMax);
    }

    if (search) {
      query = query.ilike('titulo', `%${search}%`);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    query = query
      .order(orderBy, { ascending: orderDir === 'asc' })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    const enriched = (data ?? []).map((card) =>
      enrichCard(card as CrmCard & { lead?: Record<string, unknown> | null }),
    );

    return {
      success: true,
      data: {
        leads: enriched,
        total: count ?? 0,
        page,
        perPage,
        totalPages: Math.ceil((count ?? 0) / perPage),
      },
    };
  } catch (err) {
    logger.error('[getLeadsList]', err);
    return { success: false, error: 'Erro ao carregar leads' };
  }
}

// ========================================
// LEADS DOS AFILIADOS (Comercial Admin + Corretor)
// corretorId = null → admin (todos os usuários); corretorId = string → só do corretor
// ========================================

export async function getLeadsFromAffiliatesList(
  corretorId: string | null,
  filters: LeadListFilters = {},
): Promise<{ success: boolean; data?: LeadListResult; error?: string }> {
  try {
    const supabase = createServiceClient();
    const {
      search,
      colunaSlug = 'todos',
      prioridade,
      scoreMin,
      scoreMax,
      orderBy = 'updated_at',
      orderDir = 'desc',
      page = 1,
      perPage = 20,
    } = filters;

    const leadIdsQ = supabase
      .from('insurance_leads')
      .select('id')
      .eq('origem', 'form_indicar_afiliado');
    if (corretorId) {
      leadIdsQ.eq('corretor_id', corretorId);
    }
    const { data: leadRows, error: leadErr } = await leadIdsQ;
    if (leadErr) throw leadErr;
    const leadIds = (leadRows ?? []).map((r) => r.id).filter(Boolean);
    if (leadIds.length === 0) {
      return {
        success: true,
        data: {
          leads: [],
          total: 0,
          page,
          perPage,
          totalPages: 0,
        },
      };
    }

    let query = supabase
      .from('crm_cards')
      .select(`
        *,
        lead:insurance_leads(nome, whatsapp, email, operadora_atual, valor_atual, origem, tipo_contratacao, observacoes, created_at),
        corretor:corretores(nome)
      `, { count: 'exact' })
      .in('lead_id', leadIds);

    if (corretorId) {
      query = query.eq('corretor_id', corretorId);
    }
    if (colunaSlug && colunaSlug !== 'todos') {
      query = query.eq('coluna_slug', colunaSlug);
    }
    if (prioridade) {
      query = query.eq('prioridade', prioridade);
    }
    if (scoreMin !== undefined) query = query.gte('score', scoreMin);
    if (scoreMax !== undefined) query = query.lte('score', scoreMax);
    if (search) {
      query = query.ilike('titulo', `%${search}%`);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.order(orderBy, { ascending: orderDir === 'asc' }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const enriched = (data ?? []).map((card) =>
      enrichCard(card as CrmCard & { lead?: Record<string, unknown> | null }),
    );

    return {
      success: true,
      data: {
        leads: enriched,
        total: count ?? 0,
        page,
        perPage,
        totalPages: Math.ceil((count ?? 0) / perPage),
      },
    };
  } catch (err) {
    logger.error('[getLeadsFromAffiliatesList]', err);
    return { success: false, error: 'Erro ao carregar leads dos afiliados' };
  }
}

// ========================================
// DELETE CARD
// ========================================

export async function deleteCrmCard(
  cardId: string,
  corretorId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('crm_cards')
      .delete()
      .eq('id', cardId)
      .eq('corretor_id', corretorId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[deleteCrmCard]', err);
    return { success: false, error: 'Erro ao excluir card' };
  }
}

// ========================================
// UPDATE CARD DETAILS (edição completa)
// ========================================

export async function updateCardDetails(
  cardId: string,
  corretorId: string,
  updates: {
    titulo?: string;
    valor_estimado?: number | null;
    prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
    tags?: string[];
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('crm_cards')
      .update(updates)
      .eq('id', cardId)
      .eq('corretor_id', corretorId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[updateCardDetails]', err);
    return { success: false, error: 'Erro ao atualizar card' };
  }
}
