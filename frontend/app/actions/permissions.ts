'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { PermissionKey, UserPermissions } from '@/lib/permissions';
import { PERMISSION_KEYS, ROLE_TEMPLATES } from '@/lib/permissions';

// ─── Tipos de resposta ────────────────────────────────────
interface PermissionsResult {
  success: boolean;
  data?: {
    corretorId: string;
    role: string;
    permissions: Partial<UserPermissions>;
  };
  error?: string;
}

interface UpdateResult {
  success: boolean;
  changedKeys?: string[];
  error?: string;
}

// ─── Buscar permissões de um corretor ─────────────────────
export async function getCorretorPermissions(corretorId: string): Promise<PermissionsResult> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretores')
      .select('id, role, permissions')
      .eq('id', corretorId)
      .single();

    if (error || !data) {
      logger.error('[getCorretorPermissions] Corretor não encontrado', { corretorId, error: error?.message });
      return { success: false, error: 'Corretor não encontrado' };
    }

    // Se não tem permissões definidas, gerar template do cargo
    const permissions = (data.permissions && Object.keys(data.permissions as Record<string, unknown>).length > 0)
      ? data.permissions as Partial<UserPermissions>
      : ROLE_TEMPLATES[data.role] ?? ROLE_TEMPLATES['corretor'];

    return {
      success: true,
      data: {
        corretorId: data.id,
        role: data.role,
        permissions,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error('[getCorretorPermissions] Exception', { corretorId, error: msg });
    return { success: false, error: msg };
  }
}

// ─── Buscar permissões por email ──────────────────────────
export async function getPermissionsByEmail(email: string): Promise<PermissionsResult> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('corretores')
      .select('id, role, permissions')
      .eq('email', email)
      .single();

    if (error || !data) {
      return { success: false, error: 'Corretor não encontrado para este email' };
    }

    const permissions = (data.permissions && Object.keys(data.permissions as Record<string, unknown>).length > 0)
      ? data.permissions as Partial<UserPermissions>
      : ROLE_TEMPLATES[data.role] ?? ROLE_TEMPLATES['corretor'];

    return {
      success: true,
      data: {
        corretorId: data.id,
        role: data.role,
        permissions,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error('[getPermissionsByEmail] Exception', { email, error: msg });
    return { success: false, error: msg };
  }
}

// ─── Atualizar permissões de um corretor ──────────────────
export async function updateCorretorPermissions(
  corretorId: string,
  permissions: Partial<UserPermissions>,
  reason?: string,
): Promise<UpdateResult> {
  try {
    const supabase = createServiceClient();

    // Validar que todas as chaves são válidas
    const validKeys = new Set<string>(PERMISSION_KEYS);
    const invalidKeys = Object.keys(permissions).filter((k) => !validKeys.has(k));
    if (invalidKeys.length > 0) {
      return { success: false, error: `Chaves de permissão inválidas: ${invalidKeys.join(', ')}` };
    }

    // Buscar permissões atuais para audit trail
    const { data: current } = await supabase
      .from('corretores')
      .select('permissions')
      .eq('id', corretorId)
      .single();

    const oldPermissions = (current?.permissions as Partial<UserPermissions>) ?? {};

    // Detectar chaves que mudaram
    const changedKeys: string[] = [];
    for (const key of Object.keys(permissions)) {
      if (oldPermissions[key as PermissionKey] !== permissions[key as PermissionKey]) {
        changedKeys.push(key);
      }
    }

    // Salvar no audit log
    await supabase.from('permission_audit_log').insert({
      corretor_id: corretorId,
      changed_by: 'admin',
      old_permissions: oldPermissions,
      new_permissions: permissions,
      changed_keys: changedKeys,
      reason: reason ?? null,
    });

    // Atualizar permissões (substituição total — o admin sempre envia o mapa completo)
    const { error } = await supabase
      .from('corretores')
      .update({ permissions, updated_at: new Date().toISOString() })
      .eq('id', corretorId);

    if (error) {
      logger.error('[updateCorretorPermissions] Erro ao atualizar', { corretorId, error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('[updateCorretorPermissions] Permissões atualizadas', {
      corretorId,
      changedKeys,
      totalPermissions: Object.keys(permissions).length,
    });

    return { success: true, changedKeys };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error('[updateCorretorPermissions] Exception', { corretorId, error: msg });
    return { success: false, error: msg };
  }
}

// ─── Resetar permissões para o template do cargo ──────────
export async function resetCorretorPermissions(corretorId: string): Promise<UpdateResult> {
  try {
    const supabase = createServiceClient();

    const { data, error: fetchError } = await supabase
      .from('corretores')
      .select('role, permissions')
      .eq('id', corretorId)
      .single();

    if (fetchError || !data) {
      return { success: false, error: 'Corretor não encontrado' };
    }

    const template = ROLE_TEMPLATES[data.role] ?? ROLE_TEMPLATES['corretor'];

    // Audit log
    await supabase.from('permission_audit_log').insert({
      corretor_id: corretorId,
      changed_by: 'admin',
      old_permissions: data.permissions,
      new_permissions: template,
      changed_keys: ['RESET_ALL'],
      reason: `Reset para template do cargo: ${data.role}`,
    });

    const { error } = await supabase
      .from('corretores')
      .update({ permissions: template, updated_at: new Date().toISOString() })
      .eq('id', corretorId);

    if (error) {
      return { success: false, error: error.message };
    }

    logger.info('[resetCorretorPermissions] Permissões resetadas', { corretorId, role: data.role });
    return { success: true, changedKeys: ['RESET_ALL'] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error('[resetCorretorPermissions] Exception', { corretorId, error: msg });
    return { success: false, error: msg };
  }
}

// ─── Buscar histórico de alterações de permissões ─────────
export async function getPermissionAuditLog(corretorId: string, limit = 20) {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('permission_audit_log')
      .select('*')
      .eq('corretor_id', corretorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}
