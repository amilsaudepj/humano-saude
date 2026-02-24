'use server';

import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { createPropostaFilaEntry, type PropostaFilaStatus } from '@/app/actions/propostas-fila';

// Tipo para os dados do lead vindos do backend Python
export type ScannedLeadData = {
  nome: string;
  whatsapp: string;
  email?: string;
  operadora_atual?: string;
  valor_atual?: number;
  idades: number[];
  economia_estimada?: number;
  valor_proposto?: number;
  tipo_contratacao?: string;
  dados_pdf?: unknown;
  observacoes?: string;
  corretor_id?: string;
  registrar_fila_proposta?: boolean;
  permitir_lead_existente?: boolean;
  status_inicial_fila?: PropostaFilaStatus;
};

// Tipo para a resposta da função
export type SaveLeadResponse = {
  success: boolean;
  lead_id?: string;
  /** ID do afiliado criado (ex.: cadastro sem vínculo) para vincular indicações no painel */
  afiliado_id?: string;
  error?: string;
  message?: string;
};

type ServiceSupabaseClient = ReturnType<typeof createServiceClient>;

type CrmStageSeed = {
  id: string;
  probabilidade: number | null;
};

function normalizeEmailForStorage(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function splitLeadName(fullName: string): { nome: string; sobrenome: string | null } {
  const cleaned = fullName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return { nome: 'Lead', sobrenome: null };

  const parts = cleaned.split(' ');
  const nome = parts.shift() || 'Lead';
  const sobrenome = parts.length > 0 ? parts.join(' ') : null;
  return { nome, sobrenome };
}

function extractScannerCategory(dadosPdf: unknown): string | null {
  if (!dadosPdf || typeof dadosPdf !== 'object') return null;
  const candidate = (dadosPdf as { categoria?: unknown }).categoria;
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate.trim() : null;
}

async function resolveInitialCrmStage(
  sb: ServiceSupabaseClient,
  pipelineId: string,
): Promise<CrmStageSeed | null> {
  const { data: novoLeadStage, error: novoLeadStageError } = await sb
    .from('crm_stages')
    .select('id, probabilidade')
    .eq('pipeline_id', pipelineId)
    .eq('slug', 'novo_lead')
    .maybeSingle();

  if (novoLeadStageError) {
    logger.warn('Não foi possível buscar stage "novo_lead" no CRM', {
      error: novoLeadStageError.message,
      pipeline_id: pipelineId,
    });
  }

  if (novoLeadStage?.id) {
    return novoLeadStage;
  }

  const { data: fallbackStage, error: fallbackStageError } = await sb
    .from('crm_stages')
    .select('id, probabilidade')
    .eq('pipeline_id', pipelineId)
    .order('posicao', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackStageError) {
    logger.warn('Não foi possível buscar stage inicial do CRM por posição', {
      error: fallbackStageError.message,
      pipeline_id: pipelineId,
    });
    return null;
  }

  return fallbackStage ?? null;
}

async function syncLeadToCrm(
  sb: ServiceSupabaseClient,
  leadId: string,
  leadData: ScannedLeadData,
  ownerCorretorId: string | null = null,
): Promise<void> {
  const scannerCategory = extractScannerCategory(leadData.dados_pdf);
  const tags = [
    'scanner_inteligente',
    scannerCategory ? `modalidade:${scannerCategory}` : null,
    ownerCorretorId ? `corretor:${ownerCorretorId}` : null,
  ].filter((tag): tag is string => Boolean(tag));

  const { data: pipeline, error: pipelineError } = await sb
    .from('crm_pipelines')
    .select('id')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('posicao', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pipelineError || !pipeline?.id) {
    logger.warn('Sync CRM: pipeline ativo não encontrado', {
      error: pipelineError?.message,
      lead_id: leadId,
    });
    return;
  }

  const stage = await resolveInitialCrmStage(sb, pipeline.id);
  if (!stage?.id) {
    logger.warn('Sync CRM: stage inicial não encontrado', {
      pipeline_id: pipeline.id,
      lead_id: leadId,
    });
    return;
  }

  const email = normalizeEmailForStorage(leadData.email);
  const whatsapp = normalizePhoneDigits(leadData.whatsapp);
  const { nome, sobrenome } = splitLeadName(leadData.nome);

  let contactId: string | null = null;

  const { data: existingContactByLead, error: contactByLeadError } = await sb
    .from('crm_contacts')
    .select('id')
    .eq('lead_id', leadId)
    .maybeSingle();

  if (contactByLeadError) {
    logger.warn('Sync CRM: erro ao buscar contato por lead_id', {
      error: contactByLeadError.message,
      lead_id: leadId,
    });
  } else if (existingContactByLead?.id) {
    contactId = existingContactByLead.id;
  }

  if (!contactId && whatsapp) {
    const { data: existingContactByWhatsapp, error: contactByWhatsappError } = await sb
      .from('crm_contacts')
      .select('id')
      .eq('whatsapp', whatsapp)
      .limit(1)
      .maybeSingle();

    if (contactByWhatsappError) {
      logger.warn('Sync CRM: erro ao buscar contato por WhatsApp', {
        error: contactByWhatsappError.message,
        lead_id: leadId,
      });
    } else if (existingContactByWhatsapp?.id) {
      contactId = existingContactByWhatsapp.id;
    }
  }

  if (contactId) {
    const contactUpdates: {
      lead_id: string;
      nome: string;
      sobrenome: string | null;
      lifecycle_stage: 'lead';
      lead_source: string;
      tags: string[];
      email?: string;
      telefone?: string;
      whatsapp?: string;
      owner_corretor_id?: string | null;
    } = {
      lead_id: leadId,
      nome,
      sobrenome,
      lifecycle_stage: 'lead',
      lead_source: 'scanner_inteligente',
      tags,
    };

    if (email) {
      contactUpdates.email = email;
    }
    if (whatsapp) {
      contactUpdates.telefone = whatsapp;
      contactUpdates.whatsapp = whatsapp;
    }
    if (ownerCorretorId) {
      contactUpdates.owner_corretor_id = ownerCorretorId;
    }

    const { error: updateContactError } = await sb
      .from('crm_contacts')
      .update(contactUpdates)
      .eq('id', contactId);

    if (updateContactError) {
      logger.warn('Sync CRM: erro ao atualizar contato existente', {
        error: updateContactError.message,
        lead_id: leadId,
        contact_id: contactId,
      });
    }
  } else {
    const { data: insertedContact, error: insertContactError } = await sb
      .from('crm_contacts')
      .insert({
        company_id: null,
        lead_id: leadId,
        owner_corretor_id: ownerCorretorId,
        nome,
        sobrenome,
        email,
        telefone: whatsapp || null,
        whatsapp: whatsapp || null,
        cpf: null,
        data_nascimento: null,
        cargo: null,
        lifecycle_stage: 'lead',
        lead_source: 'scanner_inteligente',
        score: 0,
        score_motivo: null,
        ultimo_contato: null,
        total_atividades: 0,
        avatar_url: null,
        tags,
        custom_fields: {},
      })
      .select('id')
      .single();

    if (insertContactError) {
      logger.warn('Sync CRM: erro ao criar contato', {
        error: insertContactError.message,
        lead_id: leadId,
      });
    } else {
      contactId = insertedContact.id;
    }
  }

  const { data: existingDeal, error: existingDealError } = await sb
    .from('crm_deals')
    .select('id, contact_id, owner_corretor_id')
    .eq('lead_id', leadId)
    .limit(1)
    .maybeSingle();

  if (existingDealError) {
    logger.warn('Sync CRM: erro ao buscar deal existente', {
      error: existingDealError.message,
      lead_id: leadId,
    });
    return;
  }

  if (existingDeal?.id) {
    const dealUpdates: { contact_id?: string; owner_corretor_id?: string } = {};
    if (!existingDeal.contact_id && contactId) {
      dealUpdates.contact_id = contactId;
    }
    if (!existingDeal.owner_corretor_id && ownerCorretorId) {
      dealUpdates.owner_corretor_id = ownerCorretorId;
    }

    if (Object.keys(dealUpdates).length > 0) {
      const { error: updateDealContactError } = await sb
        .from('crm_deals')
        .update(dealUpdates)
        .eq('id', existingDeal.id);

      if (updateDealContactError) {
        logger.warn('Sync CRM: erro ao vincular contato em deal existente', {
          error: updateDealContactError.message,
          deal_id: existingDeal.id,
          contact_id: contactId,
        });
      }
    }
    return;
  }

  const { data: stageTail, error: stageTailError } = await sb
    .from('crm_deals')
    .select('posicao')
    .eq('stage_id', stage.id)
    .order('posicao', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (stageTailError) {
    logger.warn('Sync CRM: erro ao calcular próxima posição do deal', {
      error: stageTailError.message,
      stage_id: stage.id,
      lead_id: leadId,
    });
  }

  const nextPosition = typeof stageTail?.posicao === 'number' ? stageTail.posicao + 1 : 0;
  const valorDeal = leadData.valor_proposto ?? leadData.valor_atual ?? null;

  const { data: insertedDeal, error: insertDealError } = await sb
    .from('crm_deals')
    .insert({
      pipeline_id: pipeline.id,
      stage_id: stage.id,
      contact_id: contactId,
      company_id: null,
      owner_corretor_id: ownerCorretorId,
      crm_card_id: null,
      lead_id: leadId,
      titulo: `Proposta ${leadData.nome}`,
      valor: valorDeal,
      valor_recorrente: valorDeal,
      moeda: 'BRL',
      data_previsao_fechamento: null,
      data_ganho: null,
      data_perda: null,
      probabilidade: stage.probabilidade ?? 10,
      posicao: nextPosition,
      motivo_perda: null,
      motivo_perda_detalhe: null,
      score: 0,
      prioridade: 'media',
      is_hot: false,
      is_stale: false,
      dias_no_stage: 0,
      tags,
      custom_fields: {},
      metadata: {
        origem: 'scanner_inteligente',
        lead_id: leadId,
        corretor_id: ownerCorretorId,
      },
    })
    .select('id')
    .single();

  if (insertDealError) {
    logger.warn('Sync CRM: erro ao criar deal', {
      error: insertDealError.message,
      lead_id: leadId,
      pipeline_id: pipeline.id,
      stage_id: stage.id,
    });
    return;
  }

  const { error: activityError } = await sb
    .from('crm_activities')
    .insert({
      deal_id: insertedDeal.id,
      contact_id: contactId,
      company_id: null,
      owner_corretor_id: ownerCorretorId,
      tipo: 'sistema',
      assunto: 'Lead criado via Scanner Inteligente',
      descricao: `Lead "${leadData.nome}" incluído automaticamente no pipeline.`,
      metadata: {
        lead_id: leadId,
        origem: 'scanner_inteligente',
        corretor_id: ownerCorretorId,
      },
    });

  if (activityError) {
    logger.warn('Sync CRM: erro ao criar atividade inicial do deal', {
      error: activityError.message,
      deal_id: insertedDeal.id,
      lead_id: leadId,
    });
  }
}

async function syncLeadToCorretorKanban(
  sb: ServiceSupabaseClient,
  leadId: string,
  leadData: ScannedLeadData,
  corretorId: string,
): Promise<void> {
  const { data: existingCard, error: existingCardError } = await sb
    .from('crm_cards')
    .select('id')
    .eq('corretor_id', corretorId)
    .eq('lead_id', leadId)
    .maybeSingle();

  if (existingCardError) {
    logger.warn('Sync CRM Corretor: erro ao buscar card existente', {
      error: existingCardError.message,
      lead_id: leadId,
      corretor_id: corretorId,
    });
    return;
  }

  const subtitle = [leadData.operadora_atual, leadData.valor_atual ? `R$ ${leadData.valor_atual.toFixed(2)}` : null]
    .filter((item): item is string => Boolean(item))
    .join(' · ') || null;

  if (existingCard?.id) {
    const { error: updateError } = await sb
      .from('crm_cards')
      .update({
        titulo: leadData.nome,
        subtitulo: subtitle,
        valor_estimado: leadData.valor_proposto ?? leadData.valor_atual ?? null,
      })
      .eq('id', existingCard.id);

    if (updateError) {
      logger.warn('Sync CRM Corretor: erro ao atualizar card existente', {
        error: updateError.message,
        card_id: existingCard.id,
      });
    }

    return;
  }

  const { data: stageTail, error: tailError } = await sb
    .from('crm_cards')
    .select('posicao')
    .eq('corretor_id', corretorId)
    .eq('coluna_slug', 'novo_lead')
    .order('posicao', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tailError) {
    logger.warn('Sync CRM Corretor: erro ao calcular posição no Kanban', {
      error: tailError.message,
      corretor_id: corretorId,
    });
  }

  const nextPosition = typeof stageTail?.posicao === 'number' ? stageTail.posicao + 1 : 0;
  const { data: insertedCard, error: insertCardError } = await sb
    .from('crm_cards')
    .insert({
      corretor_id: corretorId,
      lead_id: leadId,
      coluna_slug: 'novo_lead',
      titulo: leadData.nome,
      subtitulo: subtitle,
      valor_estimado: leadData.valor_proposto ?? leadData.valor_atual ?? null,
      posicao: nextPosition,
      score: 0,
      score_motivo: null,
      ultima_interacao_proposta: null,
      total_interacoes: 0,
      tags: ['scanner_inteligente'],
      prioridade: 'media',
      metadata: {
        origem: 'scanner_inteligente',
      },
    })
    .select('id')
    .single();

  if (insertCardError) {
    logger.warn('Sync CRM Corretor: erro ao criar card', {
      error: insertCardError.message,
      lead_id: leadId,
      corretor_id: corretorId,
    });
    return;
  }

  const { error: interactionError } = await sb
    .from('crm_interacoes')
    .insert({
      card_id: insertedCard.id,
      corretor_id: corretorId,
      lead_id: leadId,
      tipo: 'sistema',
      titulo: 'Lead criado via Scanner Inteligente',
      descricao: `Lead "${leadData.nome}" inserido automaticamente no pipeline.`,
      metadata: {
        origem: 'scanner_inteligente',
      },
    });

  if (interactionError) {
    logger.warn('Sync CRM Corretor: erro ao registrar interação inicial', {
      error: interactionError.message,
      card_id: insertedCard.id,
    });
  }
}

/**
 * Server Action: Salva um lead escaneado pela IA no Supabase
 * 
 * @param leadData - Dados do lead retornados pelo backend Python
 * @returns Promise<SaveLeadResponse> - Resultado da operação
 */
export async function saveScannedLead(
  leadData: ScannedLeadData
): Promise<SaveLeadResponse> {
  try {
    const sb = createServiceClient();

    // Validação básica
    if (!leadData.nome || !leadData.whatsapp) {
      return {
        success: false,
        error: 'validation_error',
        message: 'Nome e WhatsApp são obrigatórios'
      };
    }

    const nowIso = new Date().toISOString();
    const normalizedWhatsapp = normalizePhoneDigits(leadData.whatsapp);
    if (!normalizedWhatsapp) {
      return {
        success: false,
        error: 'validation_error',
        message: 'WhatsApp inválido'
      };
    }

    const scannerCategory = extractScannerCategory(leadData.dados_pdf);
    const leadOrigin = leadData.corretor_id ? 'scanner_inteligente_corretor' : 'scanner_inteligente';
    const shouldQueue = leadData.registrar_fila_proposta ?? Boolean(leadData.corretor_id);

    // Verifica se já existe um lead com esse WhatsApp
    const { data: existingLead, error: existingLeadError } = await sb
      .from('insurance_leads')
      .select('id, nome, corretor_id, historico')
      .eq('whatsapp', normalizedWhatsapp)
      .maybeSingle();

    if (existingLeadError) {
      logger.warn('Erro ao verificar lead existente por WhatsApp', {
        error: existingLeadError.message,
        whatsapp: normalizedWhatsapp,
      });
    }

    let targetLeadId = '';
    let reusedExistingLead = false;

    if (existingLead?.id) {
      if (!leadData.permitir_lead_existente) {
        return {
          success: false,
          error: 'duplicate_lead',
          message: `Lead já existe: ${existingLead.nome}`,
          lead_id: existingLead.id
        };
      }

      reusedExistingLead = true;
      targetLeadId = existingLead.id;

      const existingHistory = Array.isArray(existingLead.historico) ? existingLead.historico : [];
      const nextHistory = [
        ...existingHistory,
        {
          timestamp: nowIso,
          evento: 'nova_proposta_scanner',
          origem: leadOrigin,
          detalhes: `Proposta reenviada via Scanner Inteligente${scannerCategory ? ` (${scannerCategory})` : ''}`,
        },
      ];

      const leadUpdates: Record<string, unknown> = {
        historico: nextHistory,
        dados_pdf: leadData.dados_pdf || null,
        observacoes: leadData.observacoes || null,
        updated_at: nowIso,
      };

      const normalizedEmail = normalizeEmailForStorage(leadData.email);
      if (normalizedEmail) leadUpdates.email = normalizedEmail;
      if (leadData.operadora_atual) leadUpdates.operadora_atual = leadData.operadora_atual;
      if (leadData.valor_atual != null) leadUpdates.valor_atual = leadData.valor_atual;
      if (leadData.economia_estimada != null) leadUpdates.economia_estimada = leadData.economia_estimada;
      if (leadData.valor_proposto != null) leadUpdates.valor_proposto = leadData.valor_proposto;
      if (leadData.tipo_contratacao) leadUpdates.tipo_contratacao = leadData.tipo_contratacao;
      if (Array.isArray(leadData.idades) && leadData.idades.length > 0) leadUpdates.idades = leadData.idades;
      if (Object.prototype.hasOwnProperty.call(leadData, 'corretor_id')) {
        leadUpdates.corretor_id = leadData.corretor_id || null;
      }

      const { error: updateExistingError } = await sb
        .from('insurance_leads')
        .update(leadUpdates)
        .eq('id', existingLead.id);

      if (updateExistingError) {
        logger.warn('Lead existente encontrado, mas atualização incremental falhou', {
          lead_id: existingLead.id,
          error: updateExistingError.message,
        });
      }
    } else {
      // Prepara os dados para inserção
      const leadToInsert = {
        nome: leadData.nome,
        whatsapp: normalizedWhatsapp,
        email: normalizeEmailForStorage(leadData.email),
        operadora_atual: leadData.operadora_atual || null,
        valor_atual: leadData.valor_atual || null,
        idades: leadData.idades,
        economia_estimada: leadData.economia_estimada || null,
        valor_proposto: leadData.valor_proposto || null,
        tipo_contratacao: leadData.tipo_contratacao || null,
        status: 'novo' as const,
        origem: leadOrigin,
        prioridade: 'media',
        dados_pdf: leadData.dados_pdf || null,
        observacoes: leadData.observacoes || null,
        corretor_id: leadData.corretor_id || null,
        historico: [
          {
            timestamp: nowIso,
            evento: 'lead_criado',
            origem: leadOrigin,
            detalhes: 'Lead criado automaticamente pelo Scanner Inteligente'
          }
        ],
        arquivado: false
      };

      // Insere o lead no Supabase
      const { data, error } = await sb
        .from('insurance_leads')
        .insert(leadToInsert)
        .select('id')
        .single();

      if (error) {
        logger.error('Erro ao salvar lead no Supabase', error);
        return {
          success: false,
          error: 'database_error',
          message: `Erro ao salvar no banco: ${error.message}`
        };
      }

      targetLeadId = data.id;
    }

    try {
      await syncLeadToCrm(sb, targetLeadId, leadData, leadData.corretor_id || null);
    } catch (crmSyncError: unknown) {
      logger.warn('Lead criado, mas sync CRM falhou', {
        lead_id: targetLeadId,
        error: crmSyncError instanceof Error ? crmSyncError.message : String(crmSyncError),
      });
    }

    if (leadData.corretor_id) {
      try {
        await syncLeadToCorretorKanban(sb, targetLeadId, leadData, leadData.corretor_id);
      } catch (kanbanSyncError: unknown) {
        logger.warn('Lead criado/atualizado, mas sync no Kanban do corretor falhou', {
          lead_id: targetLeadId,
          corretor_id: leadData.corretor_id,
          error: kanbanSyncError instanceof Error ? kanbanSyncError.message : String(kanbanSyncError),
        });
      }
    }

    if (shouldQueue) {
      const proposalPayload =
        leadData.dados_pdf && typeof leadData.dados_pdf === 'object' && !Array.isArray(leadData.dados_pdf)
          ? (leadData.dados_pdf as Record<string, unknown>)
          : {};

      const queueResult = await createPropostaFilaEntry({
        lead_id: targetLeadId,
        corretor_id: leadData.corretor_id || null,
        categoria: scannerCategory,
        origem: leadOrigin,
        dados_proposta: proposalPayload,
        status: leadData.status_inicial_fila || 'enviada',
        metadata: {
          lead_reutilizado: reusedExistingLead,
        },
      });

      if (!queueResult.success) {
        logger.warn('Lead salvo, mas não foi possível registrar na fila de propostas', {
          lead_id: targetLeadId,
          error: queueResult.error,
        });
      }
    }

    // Revalida o cache da página de leads e CRM
    revalidatePath('/portal-interno-hks-2026/leads');
    revalidatePath('/portal-interno-hks-2026');
    revalidatePath('/portal-interno-hks-2026/crm');
    revalidatePath('/portal-interno-hks-2026/crm/deals');
    revalidatePath('/portal-interno-hks-2026/crm/contacts');
    revalidatePath('/portal-interno-hks-2026/propostas/fila');
    revalidatePath('/dashboard/corretor/crm');
    revalidatePath('/dashboard/corretor/crm/deals');
    revalidatePath('/dashboard/corretor/crm/contacts');
    revalidatePath('/dashboard/corretor/propostas');
    revalidatePath('/dashboard/corretor/propostas/fila');

    logger.info('Lead salvo com sucesso', {
      lead_id: targetLeadId,
      reused_existing: reusedExistingLead,
      corretor_id: leadData.corretor_id || null,
    });

    return {
      success: true,
      lead_id: targetLeadId,
      message: reusedExistingLead
        ? 'Lead existente atualizado e proposta registrada com sucesso!'
        : 'Lead salvo com sucesso!'
    };

  } catch (error: unknown) {
    logger.error('Erro inesperado ao salvar lead', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado ao salvar lead';
    return {
      success: false,
      error: 'unexpected_error',
      message
    };
  }
}

/**
 * Server Action: Busca todos os leads do dashboard
 * 
 * @param filters - Filtros opcionais (status, limite, offset)
 * @returns Promise com array de leads
 */
export async function getLeads(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
  /** Incluir apenas leads com esta origem (ex.: 'landing_seja_afiliado') */
  origem?: string;
  /** Excluir leads com estas origens (ex.: ['landing_seja_afiliado'] para não misturar na lista geral) */
  excludeOrigem?: string[];
}) {
  try {
    const sb = createServiceClient();
    let query = sb
      .from('insurance_leads')
      .select('*')
      .eq('arquivado', false)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.origem) {
      query = query.eq('origem', filters.origem);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset !== undefined && filters?.limit) {
      query = query.range(
        filters.offset,
        filters.offset + filters.limit - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar leads', error);
      return { success: false, data: [], error: error.message };
    }

    let result = data || [];
    if (filters?.excludeOrigem?.length && !filters?.origem) {
      result = result.filter((row: { origem?: string }) => !filters.excludeOrigem!.includes(row.origem || ''));
    }

    return { success: true, data: result };

  } catch (error: unknown) {
    logger.error('Erro inesperado ao buscar leads', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado ao buscar leads';
    return { success: false, data: [], error: message };
  }
}

/**
 * Server Action: Atualiza o status de um lead
 * 
 * @param leadId - ID do lead
 * @param newStatus - Novo status
 * @param observacao - Observação opcional
 * @returns Promise<SaveLeadResponse>
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: string,
  observacao?: string
): Promise<SaveLeadResponse> {
  try {
    const sb = createServiceClient();

    // Busca o lead atual (incluindo whatsapp para sync)
    const { data: currentLead, error: fetchError } = await sb
      .from('insurance_leads')
      .select('status, historico, whatsapp, nome')
      .eq('id', leadId)
      .single();

    if (fetchError || !currentLead) {
      return {
        success: false,
        error: 'not_found',
        message: 'Lead não encontrado'
      };
    }

    // Prepara o novo histórico
    const novoHistorico = [
      ...(currentLead.historico || []),
      {
        timestamp: new Date().toISOString(),
        evento: 'mudanca_status',
        status_anterior: currentLead.status,
        status_novo: newStatus,
        observacao: observacao || null
      }
    ];

    // Atualiza o lead no insurance_leads (admin)
    const { error: updateError } = await sb
      .from('insurance_leads')
      .update({
        status: newStatus,
        historico: novoHistorico
      })
      .eq('id', leadId);

    if (updateError) {
      logger.error('Erro ao atualizar status do lead', updateError, { lead_id: leadId, new_status: newStatus });
      return {
        success: false,
        error: 'database_error',
        message: `Erro ao atualizar: ${updateError.message}`
      };
    }

    // ═══ SYNC: Atualizar leads_indicacao do corretor ═══
    // Mapeamento de status: insurance_leads → leads_indicacao
    const STATUS_MAP: Record<string, string> = {
      novo: 'simulou',
      contatado: 'entrou_em_contato',
      negociacao: 'em_analise',
      proposta_enviada: 'proposta_enviada',
      ganho: 'fechado',
      perdido: 'perdido',
      pausado: 'em_analise',
    };

    const statusCorretor = STATUS_MAP[newStatus];
    if (statusCorretor && currentLead.whatsapp) {
      try {
        // Buscar leads_indicacao pelo telefone (pode ter mais de um corretor)
        const whatsappDigits = currentLead.whatsapp.replace(/\D/g, '');
        const { data: indicacoes } = await sb
          .from('leads_indicacao')
          .select('id, corretor_id, telefone, status')
          .or(`telefone.ilike.%${whatsappDigits}%,telefone.ilike.%${whatsappDigits.slice(-11)}%`);

        if (indicacoes && indicacoes.length > 0) {
          for (const indicacao of indicacoes) {
            // Atualizar status no leads_indicacao
            await sb
              .from('leads_indicacao')
              .update({
                status: statusCorretor,
                updated_at: new Date().toISOString(),
              })
              .eq('id', indicacao.id);

            logger.info('Sync leads_indicacao', { indicacao_id: indicacao.id, status: statusCorretor, corretor_id: indicacao.corretor_id });
          }
        }
      } catch (syncErr) {
        // Não falhar se sync falhar
        logger.warn('Sync leads_indicacao falhou', { error: String(syncErr) });
      }
    }

    // Revalida o cache
    revalidatePath('/portal-interno-hks-2026/leads');
    revalidatePath('/portal-interno-hks-2026');
    revalidatePath('/dashboard/corretor/indicacoes');

    return {
      success: true,
      lead_id: leadId,
      message: 'Status atualizado com sucesso!'
    };

  } catch (error: unknown) {
    logger.error('Erro ao atualizar status', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    return {
      success: false,
      error: 'unexpected_error',
      message
    };
  }
}

/**
 * Server Action: Busca estatísticas do dashboard
 * 
 * @returns Promise com estatísticas
 */
export async function getDashboardStats() {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('dashboard_stats')
      .select('*')
      .single();

    if (error) {
      logger.error('Erro ao buscar estatísticas', error);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data };

  } catch (error: unknown) {
    logger.error('Erro ao buscar estatísticas', error);
    const message = error instanceof Error ? error.message : 'Erro ao buscar estatísticas';
    return { success: false, data: null, error: message };
  }
}

export type DashboardPeriod = 'hoje' | 'ontem' | '7d' | '30d' | 'mes' | 'dia';

export type DashboardEssentials = {
  periodo: DashboardPeriod;
  inicio: string;
  fim: string;
  leads_periodo: number;
  propostas_enviadas: number;
  vendas_fechadas: number;
  pdfs_processados: number;
  economia_estimada_total: number;
  taxa_fechamento: number;
  clientes_abertos_potencial: number;
  clientes_sem_contato: number;
  clientes_sem_contato_48h: number;
  leads_estagnados_7d: number;
  valor_potencial_aberto: number;
  pipeline_deals_abertos: number;
  pipeline_deals_estagnados: number;
  pipeline_valor_aberto: number;
};

export async function getDashboardEssentials(periodo: DashboardPeriod = 'hoje') {
  try {
    const sb = createServiceClient();
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    const normalizedPeriod = periodo === 'dia' ? 'hoje' : periodo;

    switch (normalizedPeriod) {
      case 'hoje': {
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'ontem': {
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);

        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case '7d': {
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case '30d': {
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'mes': {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      }
      default: {
        start.setHours(0, 0, 0, 0);
      }
    }

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const { data, error } = await sb
      .from('insurance_leads')
      .select('status, origem, economia_estimada')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .eq('arquivado', false);

    if (error) {
      logger.error('Erro ao buscar métricas essenciais do dashboard', error);
      return { success: false, data: null, error: error.message };
    }

    // Excluir "quero ser afiliado" das métricas de leads (não são leads de venda)
    const leads = (data || []).filter(
      (row: { origem?: string }) => row.origem !== 'landing_seja_afiliado',
    );
    const leadsPeriodo = leads.length;
    const propostasEnviadas = leads.filter((lead) => lead.status === 'proposta_enviada').length;
    const vendasFechadas = leads.filter((lead) => lead.status === 'ganho').length;
    const pdfsProcessados = leads.filter(
      (lead) => lead.origem === 'scanner_pdf' || lead.origem === 'scanner_inteligente',
    ).length;
    const economiaEstimadaTotal = leads.reduce(
      (sum, lead) => sum + Number(lead.economia_estimada || 0),
      0,
    );

    const taxaFechamento =
      leadsPeriodo > 0 ? Number(((vendasFechadas / leadsPeriodo) * 100).toFixed(1)) : 0;

    const { data: backlogRaw, error: backlogLeadsError } = await sb
      .from('insurance_leads')
      .select('status, created_at, updated_at, valor_proposto, valor_atual, origem')
      .eq('arquivado', false);

    if (backlogLeadsError) {
      logger.error('Erro ao buscar backlog estratégico de leads', backlogLeadsError);
      return { success: false, data: null, error: backlogLeadsError.message };
    }

    // Excluir "quero ser afiliado" dos clientes em aberto
    const backlogLeads = (backlogRaw || []).filter(
      (row: { origem?: string }) => row.origem !== 'landing_seja_afiliado',
    );

    const openStatuses = new Set(['novo', 'contatado', 'negociacao', 'proposta_enviada']);
    const fortyEightHoursAgo = now.getTime() - 48 * 60 * 60 * 1000;
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    let clientesAbertosPotencial = 0;
    let clientesSemContato = 0;
    let clientesSemContato48h = 0;
    let leadsEstagnados7d = 0;
    let valorPotencialAberto = 0;

    (backlogLeads || []).forEach((lead) => {
      const status = typeof lead.status === 'string' ? lead.status : '';
      const isOpen = openStatuses.has(status);
      if (!isOpen) return;

      clientesAbertosPotencial += 1;
      valorPotencialAberto += Number(lead.valor_proposto ?? lead.valor_atual ?? 0);

      if (status === 'novo') {
        clientesSemContato += 1;
        const createdAtTime = Date.parse(String(lead.created_at || ''));
        if (Number.isFinite(createdAtTime) && createdAtTime <= fortyEightHoursAgo) {
          clientesSemContato48h += 1;
        }
      }

      const updatedAtTime = Date.parse(String(lead.updated_at || ''));
      if (Number.isFinite(updatedAtTime) && updatedAtTime <= sevenDaysAgo) {
        leadsEstagnados7d += 1;
      }
    });

    const { data: pipelineDeals, error: pipelineDealsError } = await sb
      .from('crm_deals')
      .select('valor, is_stale, dias_no_stage')
      .is('data_perda', null)
      .is('data_ganho', null);

    if (pipelineDealsError) {
      logger.error('Erro ao buscar métricas estratégicas do pipeline CRM', pipelineDealsError);
      return { success: false, data: null, error: pipelineDealsError.message };
    }

    const pipelineDealsAbertos = (pipelineDeals || []).length;
    const pipelineDealsEstagnados = (pipelineDeals || []).filter(
      (deal) => Boolean(deal.is_stale) || Number(deal.dias_no_stage || 0) >= 7,
    ).length;
    const pipelineValorAberto = (pipelineDeals || []).reduce(
      (sum, deal) => sum + Number(deal.valor || 0),
      0,
    );

    return {
      success: true,
      data: {
        periodo: normalizedPeriod,
        inicio: startIso,
        fim: endIso,
        leads_periodo: leadsPeriodo,
        propostas_enviadas: propostasEnviadas,
        vendas_fechadas: vendasFechadas,
        pdfs_processados: pdfsProcessados,
        economia_estimada_total: economiaEstimadaTotal,
        taxa_fechamento: taxaFechamento,
        clientes_abertos_potencial: clientesAbertosPotencial,
        clientes_sem_contato: clientesSemContato,
        clientes_sem_contato_48h: clientesSemContato48h,
        leads_estagnados_7d: leadsEstagnados7d,
        valor_potencial_aberto: valorPotencialAberto,
        pipeline_deals_abertos: pipelineDealsAbertos,
        pipeline_deals_estagnados: pipelineDealsEstagnados,
        pipeline_valor_aberto: pipelineValorAberto,
      } as DashboardEssentials,
    };
  } catch (error: unknown) {
    logger.error('Erro inesperado ao buscar métricas essenciais', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: message };
  }
}

// =============================================
// Server Action: Salva lead da calculadora /economizar no insurance_leads (admin)
// Salva TUDO: dados OCR, dados digitados, resultado simulação, propostas
// =============================================

export type SaveCalculadoraLeadData = {
  nome: string;
  telefone: string;
  email?: string;
  operadora_atual?: string;
  valor_atual?: number;
  idades?: number[] | string[];
  economia_estimada?: number;
  valor_proposto?: number;
  tipo_pessoa?: string;
  plano_atual?: string;
  corretor_slug?: string;
  corretor_id?: string;
  // Dados completos para o admin ver TUDO
  dados_ocr?: Record<string, unknown>;
  resultado_simulacao?: Record<string, unknown>;
  propostas?: Record<string, unknown>[];
};

export async function saveCalculadoraLead(
  data: SaveCalculadoraLeadData
): Promise<SaveLeadResponse> {
  try {
    if (!data.nome || !data.telefone) {
      return {
        success: false,
        error: 'validation_error',
        message: 'Nome e telefone são obrigatórios',
      };
    }

    const sb = createServiceClient();
    const whatsapp = data.telefone.replace(/\D/g, '');

    // Montar dados_pdf com TODAS as informações para o admin
    const dadosCompletos = {
      origem_pagina: 'calculadora_economia',
      dados_ocr: data.dados_ocr || null,
      dados_digitados: {
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone,
        operadora: data.operadora_atual || null,
        plano: data.plano_atual || null,
        valor_atual: data.valor_atual || null,
        tipo_pessoa: data.tipo_pessoa || null,
        idades: data.idades || [],
      },
      resultado_simulacao: data.resultado_simulacao || null,
      propostas: data.propostas || null,
      corretor: data.corretor_slug ? {
        slug: data.corretor_slug,
        id: data.corretor_id || null,
      } : null,
      timestamp: new Date().toISOString(),
    };

    // Verificar duplicata por whatsapp
    const { data: existing } = await sb
      .from('insurance_leads')
      .select('id, nome, historico')
      .eq('whatsapp', whatsapp)
      .maybeSingle();

    if (existing) {
      const novoHistorico = [
        ...(Array.isArray(existing.historico) ? existing.historico : []),
        {
          timestamp: new Date().toISOString(),
          evento: 'nova_simulacao',
          origem: 'calculadora_economia',
          detalhes: `Nova simulação: ${data.operadora_atual || 'sem operadora'}, R$ ${data.valor_atual?.toFixed(2) || '?'}`,
        },
      ];

      await sb
        .from('insurance_leads')
        .update({
          operadora_atual: data.operadora_atual || undefined,
          valor_atual: data.valor_atual || undefined,
          economia_estimada: data.economia_estimada || undefined,
          valor_proposto: data.valor_proposto || undefined,
          dados_pdf: dadosCompletos,
          historico: novoHistorico,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return {
        success: true,
        lead_id: existing.id,
        message: 'Lead atualizado com novos dados da simulação',
      };
    }

    // Observações detalhadas para o admin
    const observacoes = [
      `📋 SIMULAÇÃO DA CALCULADORA`,
      data.corretor_slug ? `👤 Via corretor: ${data.corretor_slug}` : '🌐 Tráfego direto',
      data.tipo_pessoa ? `Tipo: ${data.tipo_pessoa}` : null,
      data.operadora_atual ? `Operadora atual: ${data.operadora_atual}` : null,
      data.plano_atual ? `Plano: ${data.plano_atual}` : null,
      data.valor_atual ? `Valor atual: R$ ${data.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null,
      data.economia_estimada ? `💰 Economia estimada: R$ ${data.economia_estimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês` : null,
      data.idades?.length ? `Vidas: ${data.idades.length} (idades: ${data.idades.join(', ')})` : null,
    ].filter(Boolean).join('\n');

    const { data: newLead, error } = await sb
      .from('insurance_leads')
      .insert({
        nome: data.nome,
        whatsapp,
        email: data.email || null,
        operadora_atual: data.operadora_atual || null,
        valor_atual: data.valor_atual || null,
        idades: data.idades || [],
        economia_estimada: data.economia_estimada || null,
        valor_proposto: data.valor_proposto || null,
        tipo_contratacao: data.tipo_pessoa === 'PJ' ? 'PME' : 'individual',
        status: 'novo',
        origem: 'calculadora_economia',
        prioridade: data.economia_estimada && data.economia_estimada > 500 ? 'alta' : 'media',
        observacoes,
        dados_pdf: dadosCompletos,
        historico: [
          {
            timestamp: new Date().toISOString(),
            evento: 'lead_criado',
            origem: 'calculadora_economia',
            detalhes: `Lead pela calculadora${data.corretor_slug ? ` (corretor: ${data.corretor_slug})` : ''}. ${data.idades?.length || 0} vida(s).`,
          },
        ],
        arquivado: false,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Erro ao salvar lead da calculadora', error);
      return {
        success: false,
        error: 'database_error',
        message: `Erro ao salvar: ${error.message}`,
      };
    }

    revalidatePath('/portal-interno-hks-2026/leads');
    revalidatePath('/portal-interno-hks-2026');

    logger.info('Lead da calculadora salvo', { lead_id: newLead?.id, corretor: data.corretor_slug || 'direto' });

    return {
      success: true,
      lead_id: newLead?.id,
      message: 'Lead salvo com sucesso!',
    };
  } catch (error: unknown) {
    logger.error('Erro inesperado (calculadora)', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    return {
      success: false,
      error: 'unexpected_error',
      message,
    };
  }
}

// =============================================
// Server Action: Indicação SEM vínculo (vai direto pro admin)
// Usado na landing /indicar sem ref — lead aparece em portal Leads
// =============================================

export type SaveIndicacaoAdminData = {
  nome: string;
  telefone: string;
  email?: string;
  mensagem?: string;
  /** Quando o usuário acabou de se cadastrar como afiliado (sem vínculo), para vincular a indicação ao painel dele */
  afiliado_id?: string;
};

export async function saveLeadIndicacaoAdmin(
  data: SaveIndicacaoAdminData
): Promise<SaveLeadResponse> {
  try {
    const nome = data.nome?.trim();
    const telefone = data.telefone?.trim().replace(/\D/g, '');
    if (!nome || !telefone || telefone.length < 10) {
      return {
        success: false,
        error: 'validation_error',
        message: 'Nome e telefone (com DDD) são obrigatórios.',
      };
    }

    const sb = createServiceClient();
    const email = data.email?.trim().toLowerCase() || null;
    const mensagem = data.mensagem?.trim() || null;

    const dadosPdf = {
      origem_pagina: 'landing_indicar_admin',
      indicacao_sem_vinculo: true,
      dados_digitados: {
        nome,
        email,
        telefone: data.telefone?.trim() ?? '',
        mensagem_indicador: mensagem,
      },
      corretor: null,
      timestamp: new Date().toISOString(),
    };

    const observacoes = [
      '📋 INDICAÇÃO (sem vínculo com corretor)',
      '🌐 Landing "Quero apenas indicar" — direto para o admin',
      mensagem ? `Mensagem: ${mensagem}` : null,
    ].filter(Boolean).join('\n');

    let corretorIdSemVinculo: string | null = null;
    try {
      const { getOrCreateCorretorAfiliadosSemVinculo } = await import('@/app/actions/corretor-afiliados');
      const res = await getOrCreateCorretorAfiliadosSemVinculo();
      if (res.success && res.corretor_id) corretorIdSemVinculo = res.corretor_id;
    } catch (_) {}

    const { data: newLead, error } = await sb
      .from('insurance_leads')
      .insert({
        nome,
        whatsapp: telefone,
        email,
        operadora_atual: null,
        valor_atual: null,
        idades: [],
        economia_estimada: null,
        valor_proposto: null,
        tipo_contratacao: 'individual',
        status: 'novo',
        origem: 'landing_indicar_admin',
        prioridade: 'media',
        observacoes,
        dados_pdf: dadosPdf,
        historico: [
          {
            timestamp: new Date().toISOString(),
            evento: 'lead_criado',
            origem: 'landing_indicar_admin',
            detalhes: 'Indicação sem vínculo com corretor. Lead vai direto para o admin.',
          },
        ],
        arquivado: false,
        ...(corretorIdSemVinculo && { corretor_id: corretorIdSemVinculo }),
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Erro ao salvar lead indicação admin', error);
      return {
        success: false,
        error: 'database_error',
        message: error.message,
      };
    }

    // Se o indicador é afiliado recém-cadastrado (sem vínculo), gravar também em leads_indicacao para aparecer no painel do afiliado
    if (data.afiliado_id && corretorIdSemVinculo) {
      const { error: errLI } = await sb.from('leads_indicacao').insert({
        corretor_id: corretorIdSemVinculo,
        afiliado_id: data.afiliado_id,
        nome,
        telefone: data.telefone?.trim() ?? null,
        email,
        status: 'simulou',
        origem: 'form_indicar_afiliado',
        metadata: mensagem ? { mensagem_indicador: mensagem } : {},
      });
      if (errLI) {
        logger.warn('Indicação admin: falha ao gravar em leads_indicacao para painel do afiliado', { error: errLI });
      }
    }

    // Cadastrar o lead no CRM do corretor (sem vínculo) para aparecer no Kanban
    if (newLead?.id && corretorIdSemVinculo) {
      try {
        const { createCardForExistingLead } = await import('@/app/actions/corretor-crm');
        await createCardForExistingLead(newLead.id, corretorIdSemVinculo, 'novo_lead');
      } catch (crmErr) {
        logger.warn('Indicação admin: falha ao adicionar lead ao CRM', { error: crmErr });
      }
    }

    revalidatePath('/portal-interno-hks-2026/leads');
    revalidatePath('/portal-interno-hks-2026');

    return {
      success: true,
      lead_id: newLead?.id,
      message: 'Indicação enviada! Nossa equipe entrará em contato.',
    };
  } catch (error: unknown) {
    logger.error('Erro ao salvar indicação admin', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    return {
      success: false,
      error: 'unexpected_error',
      message,
    };
  }
}

export type SaveSejaAfiliadoAdminData = {
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
};

/** Lead "quero ser afiliado" sem vínculo (Step 1 sem ref). Origem landing_seja_afiliado. */
export async function saveLeadSejaAfiliadoAdmin(
  data: SaveSejaAfiliadoAdminData
): Promise<SaveLeadResponse> {
  try {
    const nome = data.nome?.trim();
    const email = data.email?.trim()?.toLowerCase();
    const telefone = data.telefone?.trim()?.replace(/\D/g, '');
    if (!nome || !email || !telefone || telefone.length < 10) {
      return {
        success: false,
        error: 'validation_error',
        message: 'Nome, e-mail e telefone (com DDD) são obrigatórios.',
      };
    }

    const sb = createServiceClient();
    const cpf = data.cpf?.trim()?.replace(/\D/g, '') || null;

    const dadosPdf = {
      origem_pagina: 'landing_seja_afiliado',
      quero_ser_afiliado: true,
      dados_digitados: { nome, email, telefone: data.telefone?.trim() ?? '', cpf },
      corretor: null,
      timestamp: new Date().toISOString(),
    };

    const observacoes = [
      'QUERO SER AFILIADO (sem vínculo)',
      'Landing Seja afiliado. Cadastro inicial, direto para o admin.',
      cpf ? `CPF: ${cpf}` : null,
    ].filter(Boolean).join('\n');

    let corretorIdSemVinculo: string | null = null;
    try {
      const { getOrCreateCorretorAfiliadosSemVinculo } = await import('@/app/actions/corretor-afiliados');
      const res = await getOrCreateCorretorAfiliadosSemVinculo();
      if (res.success && res.corretor_id) corretorIdSemVinculo = res.corretor_id;
    } catch (_) {}

    const { data: newLead, error } = await sb
      .from('insurance_leads')
      .insert({
        nome,
        whatsapp: telefone,
        email,
        operadora_atual: null,
        valor_atual: null,
        idades: [],
        economia_estimada: null,
        valor_proposto: null,
        tipo_contratacao: 'individual',
        status: 'novo',
        origem: 'landing_seja_afiliado',
        prioridade: 'media',
        observacoes,
        dados_pdf: dadosPdf,
        historico: [
          {
            timestamp: new Date().toISOString(),
            evento: 'lead_criado',
            origem: 'landing_seja_afiliado',
            detalhes: 'Cadastro quero ser afiliado sem vínculo. Lead vai direto para o admin.',
          },
        ],
        arquivado: false,
        ...(corretorIdSemVinculo && { corretor_id: corretorIdSemVinculo }),
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Erro ao salvar lead seja afiliado admin', error);
      return { success: false, error: 'database_error', message: error.message };
    }

    revalidatePath('/portal-interno-hks-2026/leads');
    revalidatePath('/portal-interno-hks-2026');
    revalidatePath('/portal-interno-hks-2026/afiliados');

    // Criar conta de afiliado (sem vínculo) e enviar e-mail com dados de acesso
    const { criarAfiliadoSemVinculo } = await import('@/app/actions/corretor-afiliados');
    const contaAfiliado = await criarAfiliadoSemVinculo({
      nome,
      email,
      telefone: data.telefone?.trim() ?? '',
      cpf: data.cpf?.trim()?.replace(/\D/g, '') || undefined,
    });

    void (async () => {
      try {
        const { enviarEmailAfiliadoAcessoPainel, enviarEmailAdminLeadSejaAfiliado } = await import('@/lib/email');
        if (contaAfiliado.success) {
          await Promise.all([
            enviarEmailAfiliadoAcessoPainel({
              to: email,
              nomeAfiliado: nome,
              senhaTemporaria: contaAfiliado.senhaTemporaria,
            }),
            enviarEmailAdminLeadSejaAfiliado({
              nome,
              email,
              telefone: data.telefone?.trim() ?? '',
              cpf: cpf || undefined,
            }),
          ]);
        } else {
          const { enviarEmailAfiliadoInteresseRecebido, enviarEmailAdminLeadSejaAfiliado } = await import('@/lib/email');
          await Promise.all([
            enviarEmailAfiliadoInteresseRecebido({ to: email, nome }),
            enviarEmailAdminLeadSejaAfiliado({
              nome,
              email,
              telefone: data.telefone?.trim() ?? '',
              cpf: cpf || undefined,
            }),
          ]);
        }
      } catch (emailErr) {
        logger.warn('[saveLeadSejaAfiliadoAdmin] Falha ao enviar e-mails (afiliado/admin)', { error: emailErr });
      }
    })();

    return {
      success: true,
      lead_id: newLead?.id,
      afiliado_id: contaAfiliado.success && contaAfiliado.afiliado_id ? contaAfiliado.afiliado_id : undefined,
      message: contaAfiliado.success
        ? 'Cadastro concluído! Você receberá um e-mail com o link e os dados para acessar o painel do afiliado.'
        : 'Cadastro enviado! Nossa equipe entrará em contato.',
    };
  } catch (error: unknown) {
    logger.error('Erro ao salvar seja afiliado admin', error);
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: 'unexpected_error', message };
  }
}
