'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  CrmPipeline, CrmPipelineInsert,
  CrmStage, CrmStageWithMetrics,
  CrmDeal, CrmDealEnriched, CrmDealInsert, CrmDealUpdate,
  CrmContact, CrmContactEnriched, CrmContactInsert, CrmContactUpdate,
  CrmCompany, CrmCompanyEnriched, CrmCompanyInsert, CrmCompanyUpdate,
  CrmActivity, CrmActivityEnriched, CrmActivityInsert,
  CrmDealMetrics, CrmCorretorPerformance,
  CrmDealFilters, CrmContactFilters, CrmCompanyFilters,
  CrmPaginatedResult, AdminKanbanBoard,
} from '@/lib/types/crm';

// ========================================
// HELPERS
// ========================================

type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};

function err(msg: string): ActionResult<never> {
  return { success: false, error: msg };
}

function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

// ========================================
// PIPELINES
// ========================================

export async function getPipelines(): Promise<ActionResult<CrmPipeline[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_pipelines')
      .select('*')
      .eq('is_active', true)
      .order('posicao');
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) {
    logger.error('[getPipelines]', e);
    return err('Erro ao carregar pipelines');
  }
}

export async function createPipeline(input: CrmPipelineInsert): Promise<ActionResult<CrmPipeline>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_pipelines').insert(input).select().single();
    if (error) throw error;
    return ok(data);
  } catch (e) {
    logger.error('[createPipeline]', e);
    return err('Erro ao criar pipeline');
  }
}

export async function updatePipeline(id: string, updates: Partial<CrmPipelineInsert>): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_pipelines').update(updates).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[updatePipeline]', e);
    return err('Erro ao atualizar pipeline');
  }
}

// ========================================
// STAGES
// ========================================

export async function getStages(pipelineId: string): Promise<ActionResult<CrmStage[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('posicao');
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) {
    logger.error('[getStages]', e);
    return err('Erro ao carregar stages');
  }
}

export async function getStagesWithMetrics(pipelineId: string): Promise<ActionResult<CrmStageWithMetrics[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_deal_by_stage')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('stage_posicao');
    if (error) throw error;

    const stages: CrmStageWithMetrics[] = (data ?? []).map((row) => ({
      id: row.stage_id,
      pipeline_id: pipelineId,
      nome: row.stage_nome,
      slug: row.stage_slug,
      posicao: row.stage_posicao,
      cor: row.stage_cor,
      icone: null,
      probabilidade: row.probabilidade,
      is_won: false,
      is_lost: false,
      auto_move_days: null,
      created_at: '',
      updated_at: '',
      pipeline_nome: row.pipeline_nome,
      total_deals: row.total_deals,
      valor_total: row.valor_total,
      valor_medio: row.valor_medio,
      deals_hot: row.deals_hot,
      deals_stale: row.deals_stale,
    }));

    return ok(stages);
  } catch (e) {
    logger.error('[getStagesWithMetrics]', e);
    return err('Erro ao carregar stages com métricas');
  }
}

export async function createStage(input: {
  pipeline_id: string;
  nome: string;
  slug: string;
  cor: string;
  probabilidade: number;
  is_won?: boolean;
  is_lost?: boolean;
}): Promise<ActionResult<CrmStage>> {
  try {
    const sb = createServiceClient();
    // Descobrir próxima posição
    const { data: existing } = await sb
      .from('crm_stages')
      .select('posicao')
      .eq('pipeline_id', input.pipeline_id)
      .order('posicao', { ascending: false })
      .limit(1);

    const nextPos = existing && existing.length > 0 ? existing[0].posicao + 1 : 0;

    const { data, error } = await sb
      .from('crm_stages')
      .insert({ ...input, posicao: nextPos })
      .select()
      .single();
    if (error) throw error;
    return ok(data);
  } catch (e) {
    logger.error('[createStage]', e);
    return err('Erro ao criar stage');
  }
}

export async function reorderStages(pipelineId: string, stageIds: string[]): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const updates = stageIds.map((id, i) =>
      sb.from('crm_stages').update({ posicao: i }).eq('id', id).eq('pipeline_id', pipelineId)
    );
    await Promise.all(updates);
    return { success: true };
  } catch (e) {
    logger.error('[reorderStages]', e);
    return err('Erro ao reordenar stages');
  }
}

// ========================================
// DEALS — KANBAN BOARD
// ========================================

export async function getAdminKanbanBoard(pipelineId: string, corretorFilter?: string | null): Promise<ActionResult<AdminKanbanBoard>> {
  try {
    const sb = createServiceClient();

    // Pipeline
    const { data: pipeline, error: pErr } = await sb
      .from('crm_pipelines')
      .select('*')
      .eq('id', pipelineId)
      .single();
    if (pErr) throw pErr;

    // Stages com métricas
    const { data: stagesRaw } = await sb
      .from('crm_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('posicao');

    const stages = stagesRaw ?? [];

    // Deals com joins (com filtro de corretor opcional)
    let dealsQuery = sb
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(nome, sobrenome, email, telefone, whatsapp, cargo, avatar_url),
        company:crm_companies(nome, cnpj),
        owner:corretores(nome, foto_url),
        stage:crm_stages(nome, cor, slug)
      `)
      .eq('pipeline_id', pipelineId)
      .is('data_perda', null)
      .order('posicao');

    if (corretorFilter) {
      dealsQuery = dealsQuery.eq('owner_corretor_id', corretorFilter);
    }

    const { data: deals, error: dErr } = await dealsQuery;
    if (dErr) throw dErr;

    // Agrupar deals por stage
    const dealsByStage: Record<string, CrmDealEnriched[]> = {};
    stages.forEach((s) => { dealsByStage[s.id] = []; });

    (deals ?? []).forEach((d) => {
      const enriched: CrmDealEnriched = {
        ...d,
        stage_nome: d.stage?.nome,
        stage_cor: d.stage?.cor,
        stage_slug: d.stage?.slug,
        contact: d.contact,
        company: d.company,
        owner: d.owner,
        total_activities: 0,
        total_products: 0,
      };
      if (dealsByStage[d.stage_id]) {
        dealsByStage[d.stage_id].push(enriched);
      }
    });

    // Enriquecer stages com métricas locais
    const stagesWithMetrics: CrmStageWithMetrics[] = stages.map((s) => ({
      ...s,
      pipeline_nome: pipeline.nome,
      total_deals: dealsByStage[s.id]?.length ?? 0,
      valor_total: dealsByStage[s.id]?.reduce((acc, d) => acc + (d.valor ?? 0), 0) ?? 0,
      valor_medio: 0,
      deals_hot: dealsByStage[s.id]?.filter((d) => d.is_hot).length ?? 0,
      deals_stale: dealsByStage[s.id]?.filter((d) => d.is_stale).length ?? 0,
    }));

    return ok({ pipeline, stages: stagesWithMetrics, dealsByStage });
  } catch (e) {
    logger.error('[getAdminKanbanBoard]', e);
    return err('Erro ao carregar o Kanban');
  }
}

// ========================================
// DEALS — CRUD
// ========================================

export async function createDeal(input: CrmDealInsert): Promise<ActionResult<CrmDeal>> {
  try {
    const sb = createServiceClient();

    // Buscar probabilidade do stage
    const { data: stage } = await sb.from('crm_stages').select('probabilidade').eq('id', input.stage_id).single();

    // Buscar próxima posição no stage
    const { data: existing } = await sb
      .from('crm_deals')
      .select('posicao')
      .eq('stage_id', input.stage_id)
      .order('posicao', { ascending: false })
      .limit(1);
    const nextPos = existing && existing.length > 0 ? existing[0].posicao + 1 : 0;

    const { data, error } = await sb
      .from('crm_deals')
      .insert({
        ...input,
        posicao: nextPos,
        probabilidade: stage?.probabilidade ?? input.probabilidade ?? 0,
      })
      .select()
      .single();
    if (error) throw error;

    // Registrar atividade de criação
    await sb.from('crm_activities').insert({
      deal_id: data.id,
      owner_corretor_id: input.owner_corretor_id,
      tipo: 'sistema',
      assunto: 'Deal criado',
      descricao: `"${input.titulo}" adicionado ao pipeline`,
    });

    return ok(data);
  } catch (e) {
    logger.error('[createDeal]', e);
    return err('Erro ao criar deal');
  }
}

export async function updateDeal(id: string, updates: CrmDealUpdate): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_deals').update(updates).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[updateDeal]', e);
    return err('Erro ao atualizar deal');
  }
}

export async function moveDeal(
  dealId: string,
  newStageId: string,
  newPosition: number,
  corretorId: string,
): Promise<ActionResult<{ is_won: boolean; is_lost: boolean }>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.rpc('move_crm_deal', {
      p_deal_id: dealId,
      p_new_stage_id: newStageId,
      p_new_position: newPosition,
      p_corretor_id: corretorId,
    });
    if (error) throw error;
    return ok(data as { is_won: boolean; is_lost: boolean });
  } catch (e) {
    logger.error('[moveDeal]', e);
    return err('Erro ao mover deal');
  }
}

export async function markDealLost(
  dealId: string,
  motivo: string,
  detalhe: string | null,
  corretorId: string,
): Promise<ActionResult> {
  try {
    const sb = createServiceClient();

    // Buscar stage "perdido" do pipeline
    const { data: deal } = await sb.from('crm_deals').select('pipeline_id').eq('id', dealId).single();
    if (!deal) throw new Error('Deal não encontrado');

    const { data: lostStage } = await sb
      .from('crm_stages')
      .select('id')
      .eq('pipeline_id', deal.pipeline_id)
      .eq('is_lost', true)
      .single();

    const updates: CrmDealUpdate = {
      motivo_perda: motivo,
      motivo_perda_detalhe: detalhe,
      data_perda: new Date().toISOString(),
    };
    if (lostStage) updates.stage_id = lostStage.id;

    const { error } = await sb.from('crm_deals').update(updates).eq('id', dealId);
    if (error) throw error;

    await sb.from('crm_activities').insert({
      deal_id: dealId,
      owner_corretor_id: corretorId,
      tipo: 'sistema',
      assunto: 'Deal perdido',
      descricao: `Motivo: ${motivo}${detalhe ? ` — ${detalhe}` : ''}`,
    });

    return { success: true };
  } catch (e) {
    logger.error('[markDealLost]', e);
    return err('Erro ao marcar deal como perdido');
  }
}

export async function markDealWon(
  dealId: string,
  corretorId: string,
): Promise<ActionResult> {
  try {
    const sb = createServiceClient();

    // Buscar stage "ganho" do pipeline
    const { data: deal } = await sb.from('crm_deals').select('pipeline_id, titulo, valor').eq('id', dealId).single();
    if (!deal) throw new Error('Deal não encontrado');

    const { data: wonStage } = await sb
      .from('crm_stages')
      .select('id')
      .eq('pipeline_id', deal.pipeline_id)
      .eq('is_won', true)
      .single();

    const updates: CrmDealUpdate = {
      data_ganho: new Date().toISOString(),
    };
    if (wonStage) updates.stage_id = wonStage.id;

    const { error } = await sb.from('crm_deals').update(updates).eq('id', dealId);
    if (error) throw error;

    await sb.from('crm_activities').insert({
      deal_id: dealId,
      owner_corretor_id: corretorId,
      tipo: 'sistema',
      assunto: 'Deal ganho! 🎉',
      descricao: `"${deal.titulo}" fechado com valor de R$ ${(deal.valor ?? 0).toLocaleString('pt-BR')}`,
    });

    return { success: true };
  } catch (e) {
    logger.error('[markDealWon]', e);
    return err('Erro ao marcar deal como ganho');
  }
}

export async function reorderDealsInStage(
  stageId: string,
  dealIds: string[],
): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const updates = dealIds.map((id, i) =>
      sb.from('crm_deals').update({ posicao: i }).eq('id', id).eq('stage_id', stageId)
    );
    await Promise.all(updates);
    return { success: true };
  } catch (e) {
    logger.error('[reorderDealsInStage]', e);
    return err('Erro ao reordenar deals');
  }
}

export async function deleteDeal(dealId: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_deals').delete().eq('id', dealId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteDeal]', e);
    return err('Erro ao excluir deal');
  }
}

export async function getDealDetail(dealId: string): Promise<ActionResult<CrmDealEnriched>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(nome, sobrenome, email, telefone, whatsapp, cargo, avatar_url),
        company:crm_companies(nome, cnpj),
        owner:corretores(nome, foto_url),
        stage:crm_stages(nome, cor, slug)
      `)
      .eq('id', dealId)
      .single();
    if (error) throw error;

    // Contar activities e products
    const [{ count: actCount }, { count: prodCount }] = await Promise.all([
      sb.from('crm_activities').select('*', { count: 'exact', head: true }).eq('deal_id', dealId),
      sb.from('crm_deal_products').select('*', { count: 'exact', head: true }).eq('deal_id', dealId),
    ]);

    const enriched: CrmDealEnriched = {
      ...data,
      stage_nome: data.stage?.nome,
      stage_cor: data.stage?.cor,
      stage_slug: data.stage?.slug,
      contact: data.contact,
      company: data.company,
      owner: data.owner,
      total_activities: actCount ?? 0,
      total_products: prodCount ?? 0,
    };

    return ok(enriched);
  } catch (e) {
    logger.error('[getDealDetail]', e);
    return err('Erro ao carregar oportunidade');
  }
}

// ========================================
// DEALS — LIST COM FILTROS
// ========================================

export async function getDealsList(
  filters: CrmDealFilters = {},
): Promise<ActionResult<CrmPaginatedResult<CrmDealEnriched>>> {
  try {
    const sb = createServiceClient();
    const {
      search, pipeline_id, stage_id, owner_corretor_id,
      prioridade, is_hot, is_stale, valor_min, valor_max,
      tags, orderBy = 'updated_at', orderDir = 'desc',
      page = 1, perPage = 20,
    } = filters;

    let query = sb
      .from('crm_deals')
      .select(`
        *,
        contact:crm_contacts(nome, sobrenome, email, telefone, whatsapp, cargo, avatar_url),
        company:crm_companies(nome, cnpj),
        owner:corretores(nome, foto_url),
        stage:crm_stages(nome, cor, slug)
      `, { count: 'exact' });

    if (pipeline_id) query = query.eq('pipeline_id', pipeline_id);
    if (stage_id) query = query.eq('stage_id', stage_id);
    if (owner_corretor_id) query = query.eq('owner_corretor_id', owner_corretor_id);
    if (prioridade) query = query.eq('prioridade', prioridade);
    if (is_hot !== undefined) query = query.eq('is_hot', is_hot);
    if (is_stale !== undefined) query = query.eq('is_stale', is_stale);
    if (valor_min !== undefined) query = query.gte('valor', valor_min);
    if (valor_max !== undefined) query = query.lte('valor', valor_max);
    if (search) query = query.ilike('titulo', `%${search}%`);
    if (tags && tags.length > 0) query = query.overlaps('tags', tags);

    const from = (page - 1) * perPage;
    query = query.order(orderBy, { ascending: orderDir === 'asc' }).range(from, from + perPage - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const enriched: CrmDealEnriched[] = (data ?? []).map((d) => ({
      ...d,
      stage_nome: d.stage?.nome,
      stage_cor: d.stage?.cor,
      stage_slug: d.stage?.slug,
      contact: d.contact,
      company: d.company,
      owner: d.owner,
      total_activities: 0,
      total_products: 0,
    }));

    return ok({
      data: enriched,
      total: count ?? 0,
      page,
      perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (e) {
    logger.error('[getDealsList]', e);
    return err('Erro ao carregar oportunidades');
  }
}

// ========================================
// CONTACTS — CRUD
// ========================================

export async function createContact(input: CrmContactInsert): Promise<ActionResult<CrmContact>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_contacts').insert(input).select().single();
    if (error) throw error;
    return ok(data);
  } catch (e) {
    logger.error('[createContact]', e);
    return err('Erro ao criar contato');
  }
}

export async function updateContact(id: string, updates: CrmContactUpdate): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_contacts').update(updates).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[updateContact]', e);
    return err('Erro ao atualizar contato');
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_contacts').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteContact]', e);
    return err('Erro ao excluir contato');
  }
}

export async function getContactsList(
  filters: CrmContactFilters = {},
): Promise<ActionResult<CrmPaginatedResult<CrmContactEnriched>>> {
  try {
    const sb = createServiceClient();
    const {
      search, lifecycle_stage, company_id, owner_corretor_id,
      score_min, tags,
      orderBy = 'updated_at', orderDir = 'desc',
      page = 1, perPage = 20,
    } = filters;

    let query = sb
      .from('crm_contacts')
      .select(`
        *,
        company:crm_companies(nome),
        owner:corretores(nome)
      `, { count: 'exact' });

    if (lifecycle_stage) query = query.eq('lifecycle_stage', lifecycle_stage);
    if (company_id) query = query.eq('company_id', company_id);
    if (owner_corretor_id) query = query.eq('owner_corretor_id', owner_corretor_id);
    if (score_min !== undefined) query = query.gte('score', score_min);
    if (search) query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    if (tags && tags.length > 0) query = query.overlaps('tags', tags);

    const from = (page - 1) * perPage;
    query = query.order(orderBy, { ascending: orderDir === 'asc' }).range(from, from + perPage - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const enriched: CrmContactEnriched[] = (data ?? []).map((c) => ({
      ...c,
      company_nome: c.company?.nome ?? null,
      owner_nome: c.owner?.nome ?? null,
      total_deals: 0,
    }));

    return ok({
      data: enriched,
      total: count ?? 0,
      page, perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (e) {
    logger.error('[getContactsList]', e);
    return err('Erro ao carregar contatos');
  }
}

export async function getContactDetail(contactId: string): Promise<ActionResult<CrmContactEnriched>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_contacts')
      .select(`
        *,
        company:crm_companies(nome),
        owner:corretores(nome)
      `)
      .eq('id', contactId)
      .single();
    if (error) throw error;

    const { count: dealCount } = await sb
      .from('crm_deals')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId);

    return ok({
      ...data,
      company_nome: data.company?.nome ?? null,
      owner_nome: data.owner?.nome ?? null,
      total_deals: dealCount ?? 0,
    });
  } catch (e) {
    logger.error('[getContactDetail]', e);
    return err('Erro ao carregar contato');
  }
}

// ========================================
// COMPANIES — CRUD
// ========================================

export async function createCompany(input: CrmCompanyInsert): Promise<ActionResult<CrmCompany>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_companies').insert(input).select().single();
    if (error) throw error;
    return ok(data);
  } catch (e) {
    logger.error('[createCompany]', e);
    return err('Erro ao criar empresa');
  }
}

export async function updateCompany(id: string, updates: CrmCompanyUpdate): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_companies').update(updates).eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[updateCompany]', e);
    return err('Erro ao atualizar empresa');
  }
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_companies').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteCompany]', e);
    return err('Erro ao excluir empresa');
  }
}

export async function getCompaniesList(
  filters: CrmCompanyFilters = {},
): Promise<ActionResult<CrmPaginatedResult<CrmCompanyEnriched>>> {
  try {
    const sb = createServiceClient();
    const {
      search, setor, porte, owner_corretor_id,
      orderBy = 'updated_at', orderDir = 'desc',
      page = 1, perPage = 20,
    } = filters;

    let query = sb
      .from('crm_companies')
      .select(`
        *,
        owner:corretores(nome)
      `, { count: 'exact' });

    if (setor) query = query.eq('setor', setor);
    if (porte) query = query.eq('porte', porte);
    if (owner_corretor_id) query = query.eq('owner_corretor_id', owner_corretor_id);
    if (search) query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${search}%`);

    const from = (page - 1) * perPage;
    query = query.order(orderBy, { ascending: orderDir === 'asc' }).range(from, from + perPage - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const enriched: CrmCompanyEnriched[] = (data ?? []).map((c) => ({
      ...c,
      owner_nome: c.owner?.nome ?? null,
      total_contacts: 0,
      total_deals: 0,
      valor_total_deals: 0,
    }));

    return ok({
      data: enriched,
      total: count ?? 0, page, perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (e) {
    logger.error('[getCompaniesList]', e);
    return err('Erro ao carregar empresas');
  }
}

export async function getCompanyDetail(companyId: string): Promise<ActionResult<CrmCompanyEnriched>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_companies')
      .select(`
        *,
        owner:corretores(nome)
      `)
      .eq('id', companyId)
      .single();
    if (error) throw error;

    const enriched: CrmCompanyEnriched = {
      ...data,
      owner_nome: data.owner?.nome ?? null,
      total_contacts: 0,
      total_deals: 0,
      valor_total_deals: 0,
    };

    // Buscar contagem de contatos e deals relacionados
    const [contactsCount, dealsCount] = await Promise.all([
      sb.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      sb.from('crm_deals').select('id, valor', { count: 'exact' }).eq('company_id', companyId),
    ]);

    enriched.total_contacts = contactsCount.count ?? 0;
    enriched.total_deals = dealsCount.count ?? 0;
    enriched.valor_total_deals = (dealsCount.data ?? []).reduce((sum, d) => sum + (d.valor ?? 0), 0);

    return ok(enriched);
  } catch (e) {
    logger.error('[getCompanyDetail]', e);
    return err('Erro ao carregar empresa');
  }
}

// ========================================
// ACTIVITIES
// ========================================

export async function createActivity(input: CrmActivityInsert): Promise<ActionResult<CrmActivity>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_activities').insert(input).select().single();
    if (error) throw error;

    // Atualizar ultimo_contato no contact
    if (input.contact_id) {
      await sb.from('crm_contacts').update({
        ultimo_contato: new Date().toISOString(),
      }).eq('id', input.contact_id);
    }

    return ok(data);
  } catch (e) {
    logger.error('[createActivity]', e);
    return err('Erro ao registrar atividade');
  }
}

export async function getActivities(params: {
  deal_id?: string;
  contact_id?: string;
  company_id?: string;
  limit?: number;
}): Promise<ActionResult<CrmActivityEnriched[]>> {
  try {
    const sb = createServiceClient();
    let query = sb
      .from('crm_activities')
      .select(`
        *,
        owner:corretores(nome, foto_url),
        deal:crm_deals(titulo),
        contact:crm_contacts(nome)
      `)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 50);

    if (params.deal_id) query = query.eq('deal_id', params.deal_id);
    if (params.contact_id) query = query.eq('contact_id', params.contact_id);
    if (params.company_id) query = query.eq('company_id', params.company_id);

    const { data, error } = await query;
    if (error) throw error;

    const enriched: CrmActivityEnriched[] = (data ?? []).map((a) => ({
      ...a,
      owner_nome: a.owner?.nome ?? null,
      owner_foto: a.owner?.foto_url ?? null,
      deal_titulo: a.deal?.titulo ?? null,
      contact_nome: a.contact?.nome ?? null,
    }));

    return ok(enriched);
  } catch (e) {
    logger.error('[getActivities]', e);
    return err('Erro ao carregar atividades');
  }
}

export async function completeActivity(activityId: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('crm_activities')
      .update({ concluida: true, data_conclusao: new Date().toISOString() })
      .eq('id', activityId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[completeActivity]', e);
    return err('Erro ao concluir atividade');
  }
}

export async function updateActivity(
  activityId: string,
  updates: Partial<CrmActivityInsert>,
): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_activities').update(updates).eq('id', activityId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[updateActivity]', e);
    return err('Erro ao atualizar atividade');
  }
}

export async function deleteActivity(activityId: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_activities').delete().eq('id', activityId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteActivity]', e);
    return err('Erro ao excluir atividade');
  }
}

export async function pinActivity(activityId: string, pinned: boolean): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('crm_activities')
      .update({ metadata: { pinned } })
      .eq('id', activityId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[pinActivity]', e);
    return err('Erro ao fixar atividade');
  }
}

// ========================================
// ANALYTICS / METRICS
// ========================================

export async function getCrmDealMetrics(): Promise<ActionResult<CrmDealMetrics>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_deal_metrics').select('*').single();
    if (error) throw error;
    return ok(data);
  } catch (e) {
    logger.error('[getCrmDealMetrics]', e);
    return err('Erro ao carregar métricas');
  }
}

export async function getCorretoresPerformance(): Promise<ActionResult<CrmCorretorPerformance[]>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_corretor_performance')
      .select('*')
      .order('valor_ganho', { ascending: false });
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) {
    logger.error('[getCorretoresPerformance]', e);
    return err('Erro ao carregar performance');
  }
}

// ========================================
// BULK OPERATIONS
// ========================================

export async function bulkMoveDeals(
  dealIds: string[],
  newStageId: string,
  corretorId: string,
): Promise<ActionResult<{ moved: number }>> {
  try {
    const sb = createServiceClient();
    let moved = 0;

    for (const dealId of dealIds) {
      const result = await sb.rpc('move_crm_deal', {
        p_deal_id: dealId,
        p_new_stage_id: newStageId,
        p_new_position: moved,
        p_corretor_id: corretorId,
      });
      if (!result.error) moved++;
    }

    return ok({ moved });
  } catch (e) {
    logger.error('[bulkMoveDeals]', e);
    return err('Erro ao mover deals em lote');
  }
}

export async function bulkAssignOwner(
  dealIds: string[],
  ownerId: string,
): Promise<ActionResult<{ updated: number }>> {
  try {
    const sb = createServiceClient();
    const { error, count } = await sb
      .from('crm_deals')
      .update({ owner_corretor_id: ownerId })
      .in('id', dealIds);
    if (error) throw error;
    return ok({ updated: count ?? dealIds.length });
  } catch (e) {
    logger.error('[bulkAssignOwner]', e);
    return err('Erro ao atribuir responsável');
  }
}

export async function bulkDeleteDeals(dealIds: string[]): Promise<ActionResult<{ deleted: number }>> {
  try {
    const sb = createServiceClient();
    const { error, count } = await sb.from('crm_deals').delete().in('id', dealIds);
    if (error) throw error;
    return ok({ deleted: count ?? dealIds.length });
  } catch (e) {
    logger.error('[bulkDeleteDeals]', e);
    return err('Erro ao excluir deals');
  }
}

// ========================================
// CORRETORES LIST (para dropdowns)
// ========================================

export async function getCorretoresList(): Promise<ActionResult<Array<{ id: string; nome: string; foto_url: string | null }>>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('corretores')
      .select('id, nome, foto_url')
      .eq('ativo', true)
      .order('nome');
    if (error) throw error;
    return ok(data ?? []);
  } catch (e) {
    logger.error('[getCorretoresList]', e);
    return err('Erro ao carregar corretores');
  }
}
