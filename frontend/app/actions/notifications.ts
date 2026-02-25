'use server';

import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { verifyToken } from '@/lib/auth-jwt';

const PORTAL = '/portal-interno-hks-2026';

type NotificacaoScope = { destino: 'admin' } | { destino: 'corretor'; corretor_id: string };

/**
 * Resolve o escopo do usuário logado a partir dos cookies (admin_token ou corretor_token).
 * Retorna null se não houver sessão válida.
 */
async function getNotificacaoScope(): Promise<NotificacaoScope | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const corretorToken = cookieStore.get('corretor_token')?.value;

  if (corretorToken) {
    const payload = await verifyToken(corretorToken);
    if (payload?.corretor_id) {
      return { destino: 'corretor', corretor_id: payload.corretor_id };
    }
  }

  if (adminToken) {
    return { destino: 'admin' };
  }

  return null;
}

// ========================================
// LISTAR NOTIFICAÇÕES (escopo por perfil)
// ========================================

export async function getNotificacoes(filters?: {
  lida?: boolean;
  tipo?: string;
  limit?: number;
}) {
  try {
    const scope = await getNotificacaoScope();
    if (!scope) {
      return { success: true, data: [] };
    }

    const supabase = createServiceClient();
    let query = supabase
      .from('notificacoes')
      .select('*')
      .eq('destino', scope.destino)
      .order('created_at', { ascending: false });

    if (scope.destino === 'corretor') {
      query = query.eq('corretor_id', scope.corretor_id);
    } else {
      query = query.is('corretor_id', null);
    }

    if (filters?.lida !== undefined) query = query.eq('lida', filters.lida);
    if (filters?.tipo) query = query.eq('tipo', filters.tipo);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar notificações', { error: error.message });
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// CONTAR NÃO LIDAS (escopo por perfil)
// ========================================

export async function getNotificacaoCount() {
  try {
    const scope = await getNotificacaoScope();
    if (!scope) {
      return { success: true, count: 0 };
    }

    const supabase = createServiceClient();
    let query = supabase
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('lida', false)
      .eq('destino', scope.destino);

    if (scope.destino === 'corretor') {
      query = query.eq('corretor_id', scope.corretor_id);
    } else {
      query = query.is('corretor_id', null);
    }

    const { count, error } = await query;

    if (error) return { success: false, count: 0, error: error.message };
    return { success: true, count: count ?? 0 };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, count: 0, error: msg };
  }
}

// ========================================
// MARCAR COMO LIDA (só se pertencer ao perfil)
// ========================================

export async function markNotificacaoAsRead(id: string) {
  try {
    const scope = await getNotificacaoScope();
    if (!scope) {
      return { success: false, error: 'Sessão inválida' };
    }

    const supabase = createServiceClient();
    let update = supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id)
      .eq('destino', scope.destino);

    if (scope.destino === 'corretor') {
      update = update.eq('corretor_id', scope.corretor_id);
    } else {
      update = update.is('corretor_id', null);
    }

    const { error } = await update;

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/notificacoes`);
    revalidatePath('/dashboard/corretor/notificacoes');
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// MARCAR TODAS COMO LIDAS (apenas do perfil)
// ========================================

export async function markAllNotificacoesAsRead() {
  try {
    const scope = await getNotificacaoScope();
    if (!scope) {
      return { success: false, error: 'Sessão inválida' };
    }

    const supabase = createServiceClient();
    let update = supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('lida', false)
      .eq('destino', scope.destino);

    if (scope.destino === 'corretor') {
      update = update.eq('corretor_id', scope.corretor_id);
    } else {
      update = update.is('corretor_id', null);
    }

    const { error } = await update;

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/notificacoes`);
    revalidatePath('/dashboard/corretor/notificacoes');
    return { success: true, message: 'Todas as notificações marcadas como lidas!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// CRIAR NOTIFICAÇÃO (uso interno)
// destino: 'admin' | 'corretor'; corretor_id obrigatório quando destino = 'corretor'
// ========================================

export async function createNotificacao(input: {
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  link?: string;
  user_id?: string;
  /** Para qual painel: admin ou corretor */
  destino: 'admin' | 'corretor';
  /** Obrigatório quando destino = 'corretor' */
  corretor_id?: string | null;
}) {
  try {
    if (input.destino === 'corretor' && !input.corretor_id) {
      logger.warn('[createNotificacao] destino=corretor exige corretor_id');
      return { success: false, error: 'corretor_id obrigatório quando destino é corretor' };
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('notificacoes')
      .insert({
        titulo: input.titulo,
        mensagem: input.mensagem,
        tipo: input.tipo,
        link: input.link || null,
        user_id: input.user_id || null,
        destino: input.destino,
        corretor_id: input.destino === 'corretor' ? input.corretor_id : null,
        lida: false,
        metadata: {},
      })
      .select('id')
      .single();

    if (error) {
      logger.error('❌ Erro ao criar notificação', { error: error.message });
      return { success: false, error: error.message };
    }

    revalidatePath(`${PORTAL}/notificacoes`);
    revalidatePath('/dashboard/corretor/notificacoes');
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}
