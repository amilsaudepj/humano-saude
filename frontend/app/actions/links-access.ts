'use server';

import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const INTEGRATION_NAME = 'links_allowed_emails';
const REQUESTS_INTEGRATION_NAME = 'links_access_requests';
const PORTAL = '/portal-interno-hks-2026';

export interface LinksAccessRequest {
  email: string;
  mensagem?: string;
  created_at: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Lista de e-mails permitidos a acessar a página /links (via token ou lista).
 */
export async function getLinksAllowedEmails(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('integration_settings')
      .select('config')
      .eq('integration_name', INTEGRATION_NAME)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: [] };
      }
      logger.error('[getLinksAllowedEmails]', { error: error.message });
      return { success: false, error: error.message };
    }

    const raw = data?.config;
    const config =
      typeof raw === 'string'
        ? (() => {
            try {
              return JSON.parse(raw) as Record<string, unknown>;
            } catch {
              return {};
            }
          })()
        : (raw as Record<string, unknown> | null) || {};
    const list = config.emails;
    const emails = Array.isArray(list)
      ? list
          .filter((e): e is string => typeof e === 'string')
          .map((e) => normalizeEmail(e))
          .filter(Boolean)
      : [];
    return { success: true, data: emails };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

/**
 * Verifica se um e-mail está na lista de permitidos.
 */
export async function isEmailAllowedForLinks(email: string): Promise<boolean> {
  const res = await getLinksAllowedEmails();
  if (!res.success || !res.data) return false;
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return res.data.some((e) => normalizeEmail(e) === normalized);
}

/**
 * Atualiza a lista de e-mails permitidos (apenas admin deve chamar).
 */
export async function setLinksAllowedEmails(emails: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('integration_settings')
      .upsert(
        { integration_name: INTEGRATION_NAME, config: { emails: normalized }, updated_at: new Date().toISOString() },
        { onConflict: 'integration_name' },
      );

    if (error) {
      logger.error('[setLinksAllowedEmails]', { error: error.message });
      return { success: false, error: error.message };
    }
    revalidatePath(PORTAL + '/links-acesso');
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ─── Solicitações de acesso ("Não tem acesso? Solicitar agora") ─────────────────

export async function getLinksAccessRequests(): Promise<{
  success: boolean;
  data?: LinksAccessRequest[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('integration_settings')
      .select('config')
      .eq('integration_name', REQUESTS_INTEGRATION_NAME)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { success: true, data: [] };
      logger.error('[getLinksAccessRequests]', { error: error.message });
      return { success: false, error: error.message };
    }

    const config = (data?.config as { requests?: LinksAccessRequest[] }) || {};
    const requests = Array.isArray(config.requests) ? config.requests : [];
    return { success: true, data: requests };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

export async function addLinksAccessRequest(
  email: string,
  mensagem?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await getLinksAccessRequests();
    if (!res.success) return { success: false, error: res.error };
    const existing = res.data || [];
    const normalized = normalizeEmail(email);
    if (existing.some((r) => normalizeEmail(r.email) === normalized)) {
      return { success: true };
    }
    const requests: LinksAccessRequest[] = [
      ...existing,
      { email: normalized, mensagem: mensagem?.trim() || undefined, created_at: new Date().toISOString() },
    ];
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('integration_settings')
      .upsert(
        { integration_name: REQUESTS_INTEGRATION_NAME, config: { requests }, updated_at: new Date().toISOString() },
        { onConflict: 'integration_name' },
      );
    if (error) {
      logger.error('[addLinksAccessRequest]', { error: error.message });
      return { success: false, error: error.message };
    }
    revalidatePath(PORTAL + '/links-acesso');
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

export async function removeLinksAccessRequest(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await getLinksAccessRequests();
    if (!res.success) return { success: false, error: res.error };
    const normalized = normalizeEmail(email);
    const requests = (res.data || []).filter((r) => normalizeEmail(r.email) !== normalized);
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('integration_settings')
      .upsert(
        { integration_name: REQUESTS_INTEGRATION_NAME, config: { requests }, updated_at: new Date().toISOString() },
        { onConflict: 'integration_name' },
      );
    if (error) return { success: false, error: error.message };
    revalidatePath(PORTAL + '/links-acesso');
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

/** Aprovar solicitação: adiciona e-mail à lista de permitidos e remove da lista de solicitações. */
export async function approveLinksAccessRequest(email: string): Promise<{ success: boolean; error?: string }> {
  const allowedRes = await getLinksAllowedEmails();
  if (!allowedRes.success || !allowedRes.data) return { success: false, error: allowedRes.error };
  const normalized = normalizeEmail(email);
  const newAllowed = allowedRes.data.includes(normalized) ? allowedRes.data : [...allowedRes.data, normalized];
  const setRes = await setLinksAllowedEmails(newAllowed);
  if (!setRes.success) return setRes;
  return removeLinksAccessRequest(email);
}
