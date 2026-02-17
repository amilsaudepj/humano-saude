import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { addUsersToMetaAudience } from './audiences-client';
import { hashUserData, validateEmail, validatePhone } from './utils';
import type { HashedUserData, SyncResult } from './types';

interface AudienceRow {
  id: string;
  meta_audience_id: string;
  name: string;
  auto_sync: boolean;
  sync_frequency_hours: number;
  last_synced_at: string | null;
  status: string;
}

interface LeadRow {
  id: string;
  email: string | null;
  whatsapp: string | null;
  telefone: string | null;
  nome: string | null;
  updated_at: string;
  status: string;
}

function isLeadEligible(lead: LeadRow): boolean {
  const blockedStatuses = new Set(['perdido', 'arquivado']);
  return !blockedStatuses.has((lead.status || '').toLowerCase());
}

function leadToHashed(lead: LeadRow): HashedUserData | null {
  const email = lead.email?.trim() || '';
  const rawPhone = (lead.whatsapp || lead.telefone || '').trim();

  const canUseEmail = email ? validateEmail(email) : false;
  const canUsePhone = rawPhone ? validatePhone(rawPhone) : false;

  if (!canUseEmail && !canUsePhone) return null;

  return hashUserData({
    email: canUseEmail ? email : undefined,
    phone: canUsePhone ? rawPhone : undefined,
    external_id: lead.id,
    fn: lead.nome || undefined,
    country: 'BR',
  });
}

async function listSyncAudiences(): Promise<AudienceRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('audiences')
    .select('id, meta_audience_id, name, auto_sync, sync_frequency_hours, last_synced_at, status')
    .eq('auto_sync', true)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data || []) as AudienceRow[];
  return rows.filter((aud) => {
    if ((aud.status || '').toLowerCase() === 'deleted') return false;
    if (!aud.last_synced_at) return true;
    const last = new Date(aud.last_synced_at).getTime();
    const frequency = Math.max(1, Number(aud.sync_frequency_hours || 4));
    const threshold = Date.now() - frequency * 60 * 60 * 1000;
    return last < threshold;
  });
}

async function fetchLeadCandidates(lastSyncedAt: string | null): Promise<LeadRow[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from('insurance_leads')
    .select('id, email, whatsapp, telefone, nome, updated_at, status')
    .order('updated_at', { ascending: false })
    .limit(10000);

  if (lastSyncedAt) {
    query = query.gte('updated_at', lastSyncedAt);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data || []) as LeadRow[]).filter(isLeadEligible);
}

async function upsertAudienceUsers(
  audienceId: string,
  leads: LeadRow[]
): Promise<{ pendingIds: string[]; hashedUsers: HashedUserData[] }> {
  const supabase = createServiceClient();

  const rows = leads
    .map((lead) => {
      const hashed = leadToHashed(lead);
      if (!hashed || !hashed.external_id) return null;
      return {
        audience_id: audienceId,
        lead_id: lead.id,
        email_hash: hashed.email || null,
        phone_hash: hashed.phone || null,
        external_id_hash: hashed.external_id,
        status: 'pending',
        error_message: null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (!rows.length) return { pendingIds: [], hashedUsers: [] };

  const { error: upsertError } = await supabase
    .from('audience_users')
    .upsert(rows, { onConflict: 'audience_id,external_id_hash', ignoreDuplicates: false });

  if (upsertError) throw new Error(upsertError.message);

  const { data: pendingRows, error: pendingError } = await supabase
    .from('audience_users')
    .select('id, email_hash, phone_hash, external_id_hash')
    .eq('audience_id', audienceId)
    .eq('status', 'pending')
    .limit(10000);

  if (pendingError) throw new Error(pendingError.message);

  const pending = pendingRows || [];
  return {
    pendingIds: pending.map((row) => String(row.id)),
    hashedUsers: pending.map((row) => ({
      email: row.email_hash || undefined,
      phone: row.phone_hash || undefined,
      external_id: row.external_id_hash || undefined,
    })),
  };
}

async function saveSyncLog(params: {
  audienceId: string;
  usersAdded: number;
  usersFailed: number;
  batchCount: number;
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string | null;
  durationSeconds: number;
  startedAt: string;
  triggeredBy: 'manual' | 'cron' | 'webhook';
  triggeredByUser?: string | null;
}) {
  const supabase = createServiceClient();
  await supabase.from('audience_sync_logs').insert({
    audience_id: params.audienceId,
    users_added: params.usersAdded,
    users_removed: 0,
    users_failed: params.usersFailed,
    batch_count: params.batchCount,
    status: params.status,
    error_message: params.errorMessage || null,
    duration_seconds: params.durationSeconds,
    started_at: params.startedAt,
    completed_at: new Date().toISOString(),
    triggered_by: params.triggeredBy,
    triggered_by_user: params.triggeredByUser || null,
  });
}

export async function syncAudience(
  audienceId: string,
  triggeredBy: 'manual' | 'cron' | 'webhook' = 'manual',
  triggeredByUser?: string | null
): Promise<SyncResult> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const supabase = createServiceClient();

  const { data: audRow, error: audError } = await supabase
    .from('audiences')
    .select('id, meta_audience_id, name, auto_sync, sync_frequency_hours, last_synced_at, status')
    .eq('id', audienceId)
    .single();

  if (audError || !audRow) {
    throw new Error('Audience não encontrado');
  }

  const audience = audRow as AudienceRow;
  const result: SyncResult = {
    success: false,
    audience_id: audienceId,
    users_added: 0,
    users_removed: 0,
    users_failed: 0,
    batch_count: 0,
    session_id: null,
    errors: [],
    duration_seconds: 0,
  };

  try {
    const leads = await fetchLeadCandidates(audience.last_synced_at);
    const prepared = await upsertAudienceUsers(audienceId, leads);

    if (!prepared.hashedUsers.length) {
      await supabase
        .from('audiences')
        .update({
          last_synced_at: new Date().toISOString(),
          sync_status: 'success',
          sync_frequency_hours: Math.max(1, Number(audience.sync_frequency_hours || 4)),
        })
        .eq('id', audienceId);

      result.success = true;
      result.duration_seconds = Math.round((Date.now() - startedAtDate.getTime()) / 1000);
      await saveSyncLog({
        audienceId,
        usersAdded: 0,
        usersFailed: 0,
        batchCount: 0,
        status: 'success',
        durationSeconds: result.duration_seconds,
        startedAt,
        triggeredBy,
        triggeredByUser,
      });
      return result;
    }

    const upload = await addUsersToMetaAudience(audience.meta_audience_id, prepared.hashedUsers);

    await supabase
      .from('audience_users')
      .update({
        status: 'uploaded',
        upload_session_id: upload.sessionId,
        uploaded_at: new Date().toISOString(),
      })
      .in('id', prepared.pendingIds);

    const syncStatus = upload.numInvalid > 0 ? 'partial' : 'success';
    await supabase
      .from('audiences')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: syncStatus,
        status: 'ready',
      })
      .eq('id', audienceId);

    result.success = true;
    result.users_added = upload.numReceived;
    result.users_failed = upload.numInvalid;
    result.batch_count = upload.batches;
    result.session_id = upload.sessionId;
    result.duration_seconds = Math.round((Date.now() - startedAtDate.getTime()) / 1000);

    await saveSyncLog({
      audienceId,
      usersAdded: result.users_added,
      usersFailed: result.users_failed,
      batchCount: result.batch_count,
      status: syncStatus,
      durationSeconds: result.duration_seconds,
      startedAt,
      triggeredBy,
      triggeredByUser,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    logger.error('❌ Falha no sync de audience', { audienceId, error: message });

    await supabase
      .from('audiences')
      .update({
        sync_status: 'failed',
      })
      .eq('id', audienceId);

    result.success = false;
    result.errors.push({ ref: audienceId, error: message });
    result.duration_seconds = Math.round((Date.now() - startedAtDate.getTime()) / 1000);

    await saveSyncLog({
      audienceId,
      usersAdded: 0,
      usersFailed: 0,
      batchCount: 0,
      status: 'failed',
      errorMessage: message,
      durationSeconds: result.duration_seconds,
      startedAt,
      triggeredBy,
      triggeredByUser,
    });

    return result;
  }
}

export async function syncAllAudiences(
  triggeredBy: 'manual' | 'cron' | 'webhook' = 'manual',
  triggeredByUser?: string | null
): Promise<{
  success: boolean;
  totalAudiences: number;
  synced: number;
  partial: number;
  failed: number;
  results: SyncResult[];
}> {
  const audiences = await listSyncAudiences();
  const results: SyncResult[] = [];

  let synced = 0;
  let partial = 0;
  let failed = 0;

  for (const audience of audiences) {
    const sync = await syncAudience(audience.id, triggeredBy, triggeredByUser);
    results.push(sync);

    if (sync.success && sync.users_failed === 0) synced += 1;
    else if (sync.success && sync.users_failed > 0) partial += 1;
    else failed += 1;
  }

  return {
    success: failed === 0,
    totalAudiences: audiences.length,
    synced,
    partial,
    failed,
    results,
  };
}

export async function getAudienceSyncOverview(): Promise<{
  totalAudiences: number;
  autoSyncAudiences: number;
  pendingUsers: number;
  lastSyncAt: string | null;
  recentLogs: Array<Record<string, unknown>>;
}> {
  const supabase = createServiceClient();

  const [
    { count: totalAudiences },
    { count: autoSyncAudiences },
    { count: pendingUsers },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('audiences').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('audiences')
      .select('*', { count: 'exact', head: true })
      .eq('auto_sync', true)
      .is('deleted_at', null),
    supabase.from('audience_users').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('audience_sync_logs')
      .select(
        'id, audience_id, users_added, users_failed, batch_count, status, error_message, duration_seconds, triggered_by, created_at, audiences(name)'
      )
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const lastSyncAt =
    (recentLogs && recentLogs.length > 0 && String(recentLogs[0].created_at || '')) || null;

  return {
    totalAudiences: totalAudiences || 0,
    autoSyncAudiences: autoSyncAudiences || 0,
    pendingUsers: pendingUsers || 0,
    lastSyncAt,
    recentLogs: (recentLogs || []) as Array<Record<string, unknown>>,
  };
}
