'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  CrmCardFullDetail,
  CrmCardEnriched,
  CrmCard,
  CrmTask,
  CrmTaskInsert,
  CrmTaskUpdate,
  CrmCardFile,
  CrmCardFileInsert,
  CrmCardComment,
  CrmCardCommentInsert,
  CrmInteracao,
  CrmInteracaoInsert,
} from '@/lib/types/corretor';

// ========================================
// HELPERS
// ========================================

type R<T = undefined> = { success: boolean; data?: T; error?: string };

function ok<T>(data: T): R<T> { return { success: true, data }; }
function err(msg: string): R<never> { return { success: false, error: msg }; }

function enrichCardRaw(card: CrmCard & { lead?: Record<string, unknown> | null }): CrmCardEnriched {
  const now = Date.now();
  const updatedAt = new Date(card.updated_at).getTime();
  const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
  const lastProposta = card.ultima_interacao_proposta
    ? new Date(card.ultima_interacao_proposta).getTime() : 0;
  const hoursSinceProposta = lastProposta ? (now - lastProposta) / (1000 * 60 * 60) : Infinity;

  return {
    ...card,
    lead: card.lead ? {
      nome: String(card.lead.nome ?? ''),
      whatsapp: String(card.lead.whatsapp ?? ''),
      email: card.lead.email ? String(card.lead.email) : null,
      operadora_atual: card.lead.operadora_atual ? String(card.lead.operadora_atual) : null,
      valor_atual: card.lead.valor_atual ? Number(card.lead.valor_atual) : null,
      origem: card.lead.origem ? String(card.lead.origem) : null,
      tipo_contratacao: card.lead.tipo_contratacao ? String(card.lead.tipo_contratacao) : null,
      observacoes: card.lead.observacoes ? String(card.lead.observacoes) : null,
      created_at: card.lead.created_at ? String(card.lead.created_at) : null,
    } : null,
    is_hot: hoursSinceProposta <= 24,
    is_stale: hoursSinceUpdate > 48,
    hours_since_update: Math.round(hoursSinceUpdate),
  };
}

// ========================================
// CARD FULL DETAIL — Agregação completa
// ========================================

export async function getCardFullDetail(
  cardId: string,
  corretorId: string,
): Promise<R<CrmCardFullDetail>> {
  try {
    const sb = createServiceClient();

    // Busca paralela — queries obrigatórias
    const [cardRes, interacoesRes, historyRes, corretorRes] = await Promise.all([
      sb.from('crm_cards')
        .select('*, lead:insurance_leads(nome, whatsapp, email, operadora_atual, valor_atual, origem, tipo_contratacao, observacoes, created_at)')
        .eq('id', cardId)
        .single(),

      sb.from('crm_interacoes')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })
        .limit(200),

      sb.from('crm_interacoes')
        .select('id, status_anterior, status_novo, created_at')
        .eq('card_id', cardId)
        .eq('tipo', 'status_change')
        .order('created_at', { ascending: true }),

      sb.from('corretores')
        .select('id, nome, foto_url, email, whatsapp')
        .eq('id', corretorId)
        .single(),
    ]);

    if (cardRes.error) {
      logger.error('[getCardFullDetail] card not found', cardRes.error.message ?? cardRes.error);
      return err('Lead não encontrado');
    }

    // Queries opcionais — tabelas podem não existir ainda (migration pendente)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeQuery = async (fn: () => PromiseLike<{ data: any; error: any }>): Promise<any[] | null> => {
      try { const r = await fn(); return r.error ? null : (r.data ?? null); } catch { return null; }
    };

    const [tasksData, filesData, commentsData] = await Promise.all([
      safeQuery(() =>
        sb.from('crm_card_tasks')
          .select('*')
          .eq('card_id', cardId)
          .order('data_vencimento', { ascending: true }),
      ),
      safeQuery(() =>
        sb.from('crm_card_files')
          .select('*')
          .eq('card_id', cardId)
          .order('created_at', { ascending: false }),
      ),
      safeQuery(() =>
        sb.from('crm_card_comments')
          .select('*, corretor:corretores(nome, foto_url)')
          .eq('card_id', cardId)
          .order('created_at', { ascending: true }),
      ),
    ]);

    const tasksRes = { data: (tasksData ?? []) as CrmTask[] };
    const filesRes = { data: (filesData ?? []) as CrmCardFile[] };
    const commentsRes = { data: (commentsData ?? []) as Record<string, unknown>[] };

    const enriched = enrichCardRaw(cardRes.data);

    // Enriquecer comentários com nome e threads
    const flatComments: CrmCardComment[] = (commentsRes.data ?? []).map((c: Record<string, unknown>) => ({
      id: String(c.id),
      card_id: String(c.card_id),
      corretor_id: String(c.corretor_id),
      texto: String(c.texto),
      is_pinned: Boolean(c.is_pinned),
      parent_id: c.parent_id ? String(c.parent_id) : null,
      metadata: (c.metadata as Record<string, unknown>) ?? {},
      created_at: String(c.created_at),
      corretor_nome: (c.corretor as Record<string, unknown>)?.nome ? String((c.corretor as Record<string, unknown>).nome) : 'Desconhecido',
      corretor_foto: (c.corretor as Record<string, unknown>)?.foto_url ? String((c.corretor as Record<string, unknown>).foto_url) : null,
      replies: [],
    }));

    // Thread grouping
    const commentMap = new Map<string, CrmCardComment>();
    const rootComments: CrmCardComment[] = [];
    flatComments.forEach((c) => commentMap.set(c.id, c));
    flatComments.forEach((c) => {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        const parent = commentMap.get(c.parent_id)!;
        parent.replies = parent.replies ?? [];
        parent.replies.push(c);
      } else {
        rootComments.push(c);
      }
    });

    // Lead enriched — campos extras podem não existir na tabela
    const leadData = cardRes.data.lead as Record<string, unknown> | null;
    const enrichedLead = leadData ? {
      ...enriched.lead!,
      cpf: leadData.cpf ? String(leadData.cpf) : null,
      data_nascimento: leadData.data_nascimento ? String(leadData.data_nascimento) : null,
      cidade: leadData.cidade ? String(leadData.cidade) : null,
      estado: leadData.estado ? String(leadData.estado) : null,
      tipo_plano: leadData.tipo_plano ? String(leadData.tipo_plano) : null,
      quantidade_vidas: leadData.quantidade_vidas ? Number(leadData.quantidade_vidas) : null,
      faixa_etaria: leadData.faixa_etaria ? String(leadData.faixa_etaria) : null,
    } : null;

    const detail: CrmCardFullDetail = {
      ...enriched,
      lead: enrichedLead as CrmCardFullDetail['lead'],
      interacoes: (interacoesRes.data ?? []) as CrmInteracao[],
      tasks: (tasksRes.data ?? []) as CrmTask[],
      files: (filesRes.data ?? []) as CrmCardFile[],
      comments: rootComments,
      stage_history: (historyRes.data ?? []).map((h: Record<string, unknown>) => ({
        id: String(h.id),
        status_anterior: h.status_anterior ? String(h.status_anterior) : null,
        status_novo: h.status_novo ? String(h.status_novo) : null,
        created_at: String(h.created_at),
      })),
      corretor: corretorRes.data ? {
        id: String(corretorRes.data.id),
        nome: String(corretorRes.data.nome),
        foto_url: corretorRes.data.foto_url ? String(corretorRes.data.foto_url) : null,
        email: corretorRes.data.email ? String(corretorRes.data.email) : null,
        whatsapp: corretorRes.data.whatsapp ? String(corretorRes.data.whatsapp) : null,
      } : null,
    };

    return ok(detail);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: string }).message) : String(e);
    logger.error('[getCardFullDetail]', msg);
    return err('Erro ao carregar detalhes do card');
  }
}

// ========================================
// TASKS
// ========================================

export async function createTask(input: CrmTaskInsert): Promise<R<CrmTask>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_card_tasks').insert(input).select().single();
    if (error) throw error;
    return ok(data as CrmTask);
  } catch (e) {
    logger.error('[createTask]', e);
    return err('Erro ao criar tarefa');
  }
}

export async function updateTask(taskId: string, updates: CrmTaskUpdate): Promise<R> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_card_tasks').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', taskId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[updateTask]', e);
    return err('Erro ao atualizar tarefa');
  }
}

export async function completeTask(taskId: string): Promise<R> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_card_tasks').update({
      status: 'concluida',
      data_conclusao: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', taskId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[completeTask]', e);
    return err('Erro ao concluir tarefa');
  }
}

export async function deleteTask(taskId: string): Promise<R> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_card_tasks').delete().eq('id', taskId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteTask]', e);
    return err('Erro ao excluir tarefa');
  }
}

// ========================================
// FILES
// ========================================

export async function uploadCardFile(
  cardId: string,
  corretorId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileBase64: string,
  categoria?: string,
): Promise<R<CrmCardFile>> {
  try {
    const sb = createServiceClient();

    // Upload to Supabase Storage
    const ext = fileName.split('.').pop() ?? 'bin';
    const storagePath = `cards/${cardId}/${Date.now()}_${fileName}`;
    const buffer = Buffer.from(fileBase64, 'base64');

    const { error: uploadError } = await sb.storage
      .from('crm-files')
      .upload(storagePath, buffer, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = sb.storage.from('crm-files').getPublicUrl(storagePath);

    // Insert record
    const { data, error } = await sb.from('crm_card_files').insert({
      card_id: cardId,
      corretor_id: corretorId,
      nome: fileName,
      tipo_arquivo: fileType,
      tamanho_bytes: fileSize,
      url: urlData.publicUrl,
      categoria: categoria ?? null,
      metadata: { storage_path: storagePath },
    }).select().single();

    if (error) throw error;
    return ok(data as CrmCardFile);
  } catch (e) {
    logger.error('[uploadCardFile]', e);
    return err('Erro ao fazer upload do arquivo');
  }
}

export async function deleteCardFile(fileId: string): Promise<R> {
  try {
    const sb = createServiceClient();

    // Get file record for storage path
    const { data: file } = await sb.from('crm_card_files').select('metadata').eq('id', fileId).single();
    if (file?.metadata && typeof file.metadata === 'object' && 'storage_path' in (file.metadata as Record<string, unknown>)) {
      const storagePath = String((file.metadata as Record<string, unknown>).storage_path);
      await sb.storage.from('crm-files').remove([storagePath]);
    }

    const { error } = await sb.from('crm_card_files').delete().eq('id', fileId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteCardFile]', e);
    return err('Erro ao excluir arquivo');
  }
}

// ========================================
// COMMENTS
// ========================================

export async function addCardComment(input: CrmCardCommentInsert): Promise<R<CrmCardComment>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb.from('crm_card_comments').insert({
      card_id: input.card_id,
      corretor_id: input.corretor_id,
      texto: input.texto,
      is_pinned: input.is_pinned ?? false,
      parent_id: input.parent_id ?? null,
      metadata: input.metadata ?? {},
    }).select('*, corretor:corretores(nome, foto_url)').single();

    if (error) throw error;

    const c = data as Record<string, unknown>;
    const result: CrmCardComment = {
      id: String(c.id),
      card_id: String(c.card_id),
      corretor_id: String(c.corretor_id),
      texto: String(c.texto),
      is_pinned: Boolean(c.is_pinned),
      parent_id: c.parent_id ? String(c.parent_id) : null,
      metadata: (c.metadata as Record<string, unknown>) ?? {},
      created_at: String(c.created_at),
      corretor_nome: (c.corretor as Record<string, unknown>)?.nome ? String((c.corretor as Record<string, unknown>).nome) : 'Desconhecido',
      corretor_foto: (c.corretor as Record<string, unknown>)?.foto_url ? String((c.corretor as Record<string, unknown>).foto_url) : null,
      replies: [],
    };

    return ok(result);
  } catch (e) {
    logger.error('[addCardComment]', e);
    return err('Erro ao adicionar comentário');
  }
}

export async function deleteCardComment(commentId: string): Promise<R> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_card_comments').delete().eq('id', commentId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[deleteCardComment]', e);
    return err('Erro ao excluir comentário');
  }
}

export async function togglePinCardComment(commentId: string, pinned: boolean): Promise<R> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_card_comments').update({ is_pinned: pinned }).eq('id', commentId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('[togglePinCardComment]', e);
    return err('Erro ao fixar comentário');
  }
}

// ========================================
// INTERAÇÕES (add com atualização do card)
// ========================================

export async function addCardInteracao(input: CrmInteracaoInsert): Promise<R> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_interacoes').insert(input);
    if (error) throw error;

    // Atualizar card: total_interacoes e updated_at
    const isProposta = ['proposta_enviada', 'proposta_aceita', 'proposta_recusada'].includes(input.tipo);

    await sb.from('crm_cards').update({
      total_interacoes: undefined, // será incrementado via RPC se existir
      updated_at: new Date().toISOString(),
      ...(isProposta ? { ultima_interacao_proposta: new Date().toISOString() } : {}),
    }).eq('id', input.card_id);

    return { success: true };
  } catch (e) {
    logger.error('[addCardInteracao]', e);
    return err('Erro ao registrar interação');
  }
}

// ========================================
// UPDATE CARD INLINE
// ========================================

export async function updateCardField(
  cardId: string,
  corretorId: string,
  field: string,
  value: string | number | boolean | null | string[],
): Promise<R> {
  try {
    const sb = createServiceClient();

    // Campos permitidos
    const allowedFields = ['titulo', 'subtitulo', 'valor_estimado', 'prioridade', 'tags', 'score', 'metadata', 'coluna_slug'];
    if (!allowedFields.includes(field)) {
      return err(`Campo "${field}" não pode ser editado`);
    }

    const { error } = await sb.from('crm_cards')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .eq('corretor_id', corretorId);

    if (error) throw error;

    // Registrar no histórico
    await sb.from('crm_interacoes').insert({
      card_id: cardId,
      corretor_id: corretorId,
      tipo: 'sistema',
      titulo: `Campo "${field}" atualizado`,
      descricao: `Novo valor: ${String(value)}`,
    });

    return { success: true };
  } catch (e) {
    logger.error('[updateCardField]', e);
    return err('Erro ao atualizar campo');
  }
}

// ========================================
// UPDATE LEAD ORIGIN — edita origem e registra atividade (nunca apagável)
// ========================================

export async function updateLeadOrigin(
  cardId: string,
  corretorId: string,
  leadId: string,
  newOrigin: string,
  oldOrigin: string | null,
): Promise<R> {
  try {
    const sb = createServiceClient();

    // Atualiza a origem na tabela insurance_leads
    const { error: leadError } = await sb.from('insurance_leads')
      .update({ origem: newOrigin })
      .eq('id', leadId);

    if (leadError) throw leadError;

    // Atualiza updated_at do card
    await sb.from('crm_cards')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cardId);

    // Mapeia labels legíveis
    const origemLabels: Record<string, string> = {
      'scanner_pdf': 'Scanner PDF', 'meta_ads': 'Meta Ads', 'facebook': 'Facebook',
      'instagram': 'Instagram', 'google': 'Google Ads', 'google_ads': 'Google Ads',
      'indicacao': 'Indicação', 'landing_page': 'Landing Page', 'corretor_crm': 'CRM Manual',
      'manual': 'Manual', 'whatsapp': 'WhatsApp', 'site': 'Website', 'telefone': 'Telefone',
      'outro': 'Outro',
    };

    const oldLabel = oldOrigin ? (origemLabels[oldOrigin] ?? oldOrigin) : 'Não definida';
    const newLabel = origemLabels[newOrigin] ?? newOrigin;

    // Registra atividade PERMANENTE no histórico (nunca pode ser apagada)
    await sb.from('crm_interacoes').insert({
      card_id: cardId,
      corretor_id: corretorId,
      tipo: 'sistema',
      titulo: 'Origem do lead alterada',
      descricao: `Origem alterada de "${oldLabel}" para "${newLabel}"`,
      metadata: {
        action: 'origin_change',
        old_origin: oldOrigin,
        new_origin: newOrigin,
        immutable: true, // Marcador: esta atividade NUNCA pode ser apagada
        changed_at: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (e) {
    logger.error('[updateLeadOrigin]', e);
    return err('Erro ao atualizar origem do lead');
  }
}

// ========================================
// ADMIN: Get all cards with corretor filter
// ========================================

export async function getAdminKanbanBoard(
  corretorFilter?: string | null,
): Promise<R<{ cards: CrmCardEnriched[]; corretores: Array<{ id: string; nome: string; foto_url: string | null }> }>> {
  try {
    const sb = createServiceClient();

    let query = sb.from('crm_cards')
      .select('*, lead:insurance_leads(nome, whatsapp, email, operadora_atual, valor_atual)')
      .order('posicao', { ascending: true });

    if (corretorFilter) {
      query = query.eq('corretor_id', corretorFilter);
    }

    const [cardsRes, corretoresRes] = await Promise.all([
      query,
      sb.from('corretores')
        .select('id, nome, foto_url')
        .eq('ativo', true)
        .order('nome'),
    ]);

    if (cardsRes.error) throw cardsRes.error;

    const enrichedCards = (cardsRes.data ?? []).map((c: Record<string, unknown>) =>
      enrichCardRaw(c as CrmCard & { lead?: Record<string, unknown> | null })
    );

    return ok({
      cards: enrichedCards,
      corretores: (corretoresRes.data ?? []).map((c) => ({
        id: String(c.id),
        nome: String(c.nome),
        foto_url: c.foto_url ? String(c.foto_url) : null,
      })),
    });
  } catch (e) {
    logger.error('[getAdminKanbanBoard]', e);
    return err('Erro ao carregar kanban admin');
  }
}

// ========================================
// CARD BY LEAD ID (admin: abrir card a partir do lead)
// ========================================

export async function getCardByLeadId(leadId: string): Promise<R<{ cardId: string; corretorId: string }>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_cards')
      .select('id, corretor_id')
      .eq('lead_id', leadId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data?.id) return err('Nenhum card no CRM para este lead');
    return ok({
      cardId: String(data.id),
      corretorId: String(data.corretor_id),
    });
  } catch (e) {
    logger.error('[getCardByLeadId]', e);
    return err('Erro ao buscar card do lead');
  }
}

/** Dados mínimos do card (id + corretor_id) para abrir a view no admin */
export async function getCardMinimal(cardId: string): Promise<R<{ id: string; corretor_id: string }>> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('crm_cards')
      .select('id, corretor_id')
      .eq('id', cardId)
      .single();
    if (error || !data) return err('Card não encontrado');
    return ok({ id: String(data.id), corretor_id: String(data.corretor_id) });
  } catch (e) {
    logger.error('[getCardMinimal]', e);
    return err('Card não encontrado');
  }
}

// ========================================
// MOVE CARD STAGE (from lead detail page)
// ========================================

export async function moveCardStage(
  cardId: string,
  corretorId: string,
  fromStage: string,
  toStage: string,
): Promise<R> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from('crm_cards')
      .update({ coluna_slug: toStage, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .eq('corretor_id', corretorId);
    if (error) throw error;

    await sb.from('crm_interacoes').insert({
      card_id: cardId,
      corretor_id: corretorId,
      tipo: 'status_change',
      titulo: 'Estágio alterado',
      status_anterior: fromStage,
      status_novo: toStage,
    });
    return { success: true };
  } catch (e) {
    logger.error('[moveCardStage]', e);
    return err('Erro ao mover estágio');
  }
}

// ========================================
// MARK CARD AS SOLD
// ========================================

export async function markCardAsSold(
  cardId: string,
  corretorId: string,
  valorVenda?: number,
): Promise<R<{ vendasMes: number; valorMes: number }>> {
  try {
    const sb = createServiceClient();
    const { data: card, error: cardErr } = await sb.from('crm_cards')
      .select('coluna_slug, valor_estimado')
      .eq('id', cardId).single();
    if (cardErr) throw cardErr;

    const finalValue = valorVenda ?? card.valor_estimado ?? 0;

    const { error } = await sb.from('crm_cards').update({
      coluna_slug: 'fechado',
      valor_estimado: finalValue,
      updated_at: new Date().toISOString(),
      metadata: { venda_confirmada_em: new Date().toISOString(), valor_venda: finalValue },
    }).eq('id', cardId);
    if (error) throw error;

    await sb.from('crm_interacoes').insert([
      {
        card_id: cardId, corretor_id: corretorId, tipo: 'status_change',
        titulo: '🎉 VENDA FECHADA!',
        descricao: `Venda confirmada — R$ ${Number(finalValue).toLocaleString('pt-BR')}`,
        status_anterior: card.coluna_slug, status_novo: 'fechado',
      },
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthCards } = await sb.from('crm_cards')
      .select('valor_estimado')
      .eq('corretor_id', corretorId)
      .eq('coluna_slug', 'fechado')
      .gte('updated_at', startOfMonth.toISOString());

    return ok({
      vendasMes: monthCards?.length ?? 0,
      valorMes: (monthCards ?? []).reduce((s, c) => s + (Number(c.valor_estimado) || 0), 0),
    });
  } catch (e) {
    logger.error('[markCardAsSold]', e);
    return err('Erro ao registrar venda');
  }
}

// ========================================
// TRACKED WHATSAPP
// ========================================

export async function trackWhatsAppAction(
  cardId: string,
  corretorId: string,
  mensagem: string,
  options?: {
    leadId?: string | null;
    metadata?: Record<string, unknown>;
    interactionTitle?: string;
  },
): Promise<R> {
  try {
    const sb = createServiceClient();
    const nowIso = new Date().toISOString();
    const leadId = options?.leadId ?? null;
    const metadata = {
      tracked: true,
      ...(options?.metadata ?? {}),
    };

    const { error: interactionError } = await sb.from('crm_interacoes').insert({
      card_id: cardId,
      corretor_id: corretorId,
      lead_id: leadId,
      tipo: 'whatsapp',
      titulo: options?.interactionTitle ?? 'WhatsApp enviado',
      descricao: mensagem,
      metadata,
    });
    if (interactionError) throw interactionError;

    const { error: cardError } = await sb
      .from('crm_cards')
      .update({ updated_at: nowIso })
      .eq('id', cardId);
    if (cardError) throw cardError;

    if (leadId) {
      const { error: leadError } = await sb
        .from('insurance_leads')
        .update({ last_contact_at: nowIso })
        .eq('id', leadId);

      if (leadError) {
        logger.warn('[trackWhatsAppAction] lead update warning', {
          message: leadError.message,
          details: leadError.details,
          hint: leadError.hint,
          code: leadError.code,
        });
      }

      const { error: logError } = await sb.from('interaction_logs').insert({
        lead_id: leadId,
        card_id: cardId,
        corretor_id: corretorId,
        channel: 'whatsapp',
        message: mensagem,
        metadata,
      });

      if (logError) {
        logger.warn('[trackWhatsAppAction] interaction_logs warning', {
          message: logError.message,
          details: logError.details,
          hint: logError.hint,
          code: logError.code,
        });
      }
    }

    return { success: true };
  } catch (e) {
    logger.error('[trackWhatsAppAction]', e);
    return err('Erro ao rastrear WhatsApp');
  }
}

// ========================================
// TRACKED EMAIL
// ========================================

export async function trackEmailAction(
  cardId: string,
  corretorId: string,
  emailTo: string,
  subject: string,
  body: string,
): Promise<R> {
  try {
    const sb = createServiceClient();
    await sb.from('crm_interacoes').insert({
      card_id: cardId, corretor_id: corretorId,
      tipo: 'email', titulo: `Email: ${subject}`,
      descricao: body, metadata: { tracked: true, to: emailTo, subject },
    });
    await sb.from('crm_cards').update({ updated_at: new Date().toISOString() }).eq('id', cardId);
    return { success: true };
  } catch (e) {
    logger.error('[trackEmailAction]', e);
    return err('Erro ao rastrear email');
  }
}

// ========================================
// GET CORRETOR MONTHLY SALES
// ========================================

export async function getCorretorMonthlySales(corretorId: string): Promise<R<{ vendasMes: number; valorMes: number }>> {
  try {
    const sb = createServiceClient();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { data } = await sb.from('crm_cards')
      .select('valor_estimado')
      .eq('corretor_id', corretorId)
      .eq('coluna_slug', 'fechado')
      .gte('updated_at', startOfMonth.toISOString());
    return ok({
      vendasMes: data?.length ?? 0,
      valorMes: (data ?? []).reduce((s, c) => s + (Number(c.valor_estimado) || 0), 0),
    });
  } catch (e) {
    logger.error('[getCorretorMonthlySales]', e);
    return err('Erro ao buscar vendas');
  }
}
