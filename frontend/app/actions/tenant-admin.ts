'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────

export interface TenantWithDomains {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  pixel_id_fb: string | null;
  tag_manager_id: string | null;
  ga_measurement_id: string | null;
  is_active: boolean;
  is_master: boolean;
  plan: string;
  max_corretores: number;
  features: Record<string, boolean>;
  gestor_email: string | null;
  gestor_phone: string | null;
  cnpj: string | null;
  support_email: string | null;
  support_phone: string | null;
  site_url: string | null;
  created_at: string;
  domains: { id: string; domain: string; is_primary: boolean; ssl_active: boolean }[];
}

export interface TenantSavePayload {
  id?: string;
  name: string;
  slug: string;
  is_active: boolean;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  favicon_url?: string | null;
  pixel_id_fb: string | null;
  tag_manager_id: string | null;
  ga_measurement_id: string | null;
  plan: string;
  max_corretores: number;
  features: Record<string, boolean>;
  gestor_email: string | null;
  gestor_phone: string | null;
  cnpj: string | null;
  support_email: string | null;
  support_phone: string | null;
  site_url: string | null;
  domains: string[]; // lista de domínios (strings)
}

// ─── List all tenants ────────────────────────────────────────

export async function listTenants(): Promise<TenantWithDomains[]> {
  const sb = createServiceClient();

  const { data: tenants, error } = await sb
    .from('tenants')
    .select('*')
    .order('is_master', { ascending: false })
    .order('name');

  if (error || !tenants) return [];

  const { data: domains } = await sb
    .from('tenant_domains')
    .select('*')
    .order('is_primary', { ascending: false });

  return tenants.map((t) => ({
    ...t,
    features: (t.features as Record<string, boolean>) ?? {},
    domains: (domains ?? []).filter((d) => d.tenant_id === t.id),
  }));
}

// ─── Get single tenant ───────────────────────────────────────

export async function getTenant(id: string): Promise<TenantWithDomains | null> {
  const sb = createServiceClient();

  const { data: t, error } = await sb
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !t) return null;

  const { data: domains } = await sb
    .from('tenant_domains')
    .select('*')
    .eq('tenant_id', id)
    .order('is_primary', { ascending: false });

  return {
    ...t,
    features: (t.features as Record<string, boolean>) ?? {},
    domains: domains ?? [],
  };
}

// ─── Save (create or update) tenant ─────────────────────────

export async function saveTenant(
  payload: TenantSavePayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  const sb = createServiceClient();

  // Validações básicas
  if (!payload.name?.trim()) return { success: false, error: 'Nome obrigatório' };
  if (!payload.slug?.trim()) return { success: false, error: 'Slug obrigatório' };
  if (!/^[a-z0-9-]+$/.test(payload.slug))
    return { success: false, error: 'Slug: apenas letras minúsculas, números e hífen' };

  const tenantData = {
    name: payload.name.trim(),
    slug: payload.slug.trim().toLowerCase(),
    is_active: payload.is_active,
    primary_color: payload.primary_color || '#D4AF37',
    secondary_color: payload.secondary_color || '#050505',
    accent_color: payload.accent_color || '#F6E05E',
    logo_url: payload.logo_url || null,
    favicon_url: payload.favicon_url || null,
    pixel_id_fb: payload.pixel_id_fb || null,
    tag_manager_id: payload.tag_manager_id || null,
    ga_measurement_id: payload.ga_measurement_id || null,
    plan: payload.plan || 'standard',
    max_corretores: payload.max_corretores || 10,
    features: payload.features ?? {},
    gestor_email: payload.gestor_email || null,
    gestor_phone: payload.gestor_phone || null,
    cnpj: payload.cnpj || null,
    support_email: payload.support_email || null,
    support_phone: payload.support_phone || null,
    site_url: payload.site_url || null,
  };

  let tenantId = payload.id;

  if (tenantId) {
    // UPDATE
    const { error } = await sb
      .from('tenants')
      .update({ ...tenantData, updated_at: new Date().toISOString() })
      .eq('id', tenantId);

    if (error) return { success: false, error: error.message };
  } else {
    // INSERT
    const { data, error } = await sb
      .from('tenants')
      .insert(tenantData)
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    tenantId = data.id;
  }

  // Sincronizar domínios
  if (tenantId) {
    await syncTenantDomains(sb, tenantId, payload.domains);
  }

  // Revalidar cache do proxy/middleware e páginas admin
  revalidatePath('/portal-interno-hks-2026/tenants');
  revalidatePath('/api/revalidate');

  return { success: true, id: tenantId };
}

// ─── Sync tenant_domains ─────────────────────────────────────

async function syncTenantDomains(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  tenantId: string,
  newDomains: string[]
) {
  // Buscar domínios existentes
  const { data: existing } = await sb
    .from('tenant_domains')
    .select('id, domain')
    .eq('tenant_id', tenantId);

  const existingDomains: string[] = (existing ?? []).map((d: { domain: string }) => d.domain);
  const cleanNew = newDomains.map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')).filter(Boolean);

  // Remover domínios que foram deletados
  const toDelete = (existing ?? []).filter(
    (d: { domain: string }) => !cleanNew.includes(d.domain)
  );
  if (toDelete.length > 0) {
    await sb.from('tenant_domains').delete().in('id', toDelete.map((d: { id: string }) => d.id));
  }

  // Inserir novos domínios
  const toInsert = cleanNew
    .filter((d) => !existingDomains.includes(d))
    .map((domain, i) => ({
      tenant_id: tenantId,
      domain,
      is_primary: i === 0 && existingDomains.length === 0,
      ssl_active: false,
    }));

  if (toInsert.length > 0) {
    await sb.from('tenant_domains').insert(toInsert);
  }
}

// ─── Toggle active status ────────────────────────────────────

export async function toggleTenantStatus(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  const sb = createServiceClient();

  const { error } = await sb
    .from('tenants')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('is_master', false); // nunca desativa o master

  if (error) return { success: false, error: error.message };

  revalidatePath('/portal-interno-hks-2026/tenants');
  return { success: true };
}

// ─── Upload logo ─────────────────────────────────────────────

export async function uploadTenantLogo(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const sb = createServiceClient();
  const file = formData.get('file') as File | null;
  const tenantSlug = formData.get('slug') as string;

  if (!file) return { success: false, error: 'Arquivo não encontrado' };
  if (file.size > 2 * 1024 * 1024) return { success: false, error: 'Arquivo deve ter no máximo 2 MB' };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const path = `${tenantSlug}/logo.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await sb.storage
    .from('tenant-logos')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) return { success: false, error: error.message };

  const { data } = sb.storage.from('tenant-logos').getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}
