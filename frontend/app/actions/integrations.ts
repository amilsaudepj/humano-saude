'use server';

import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { clearGA4AvailabilityCache } from '@/lib/google-analytics';

const PORTAL = '/portal-interno-hks-2026';
const supabase = createServiceClient();

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}`;
  return typeof value === 'string' ? value.trim() : '';
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
}

function firstNonEmpty(...values: Array<unknown>): string {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }
  return '';
}

const SYSTEM_CONFIG_ENV_KEYS: Record<string, string[]> = {
  whatsapp_api_token: ['WHATSAPP_API_TOKEN'],
  whatsapp_phone_number_id: ['WHATSAPP_PHONE_NUMBER_ID'],
  whatsapp_business_account_id: ['WHATSAPP_BUSINESS_ACCOUNT_ID'],
  whatsapp_webhook_verify_token: ['WHATSAPP_WEBHOOK_VERIFY_TOKEN'],
  meta_access_token: ['META_ACCESS_TOKEN', 'FACEBOOK_ACCESS_TOKEN'],
  meta_ad_account_id: ['META_AD_ACCOUNT_ID', 'FACEBOOK_AD_ACCOUNT_ID'],
  meta_business_id: ['META_BUSINESS_ID'],
  meta_app_id: ['NEXT_PUBLIC_FACEBOOK_APP_ID', 'META_APP_ID', 'FACEBOOK_APP_ID'],
  meta_app_secret: ['META_APP_SECRET', 'FACEBOOK_APP_SECRET'],
  meta_page_id: ['META_PAGE_ID', 'FACEBOOK_PAGE_ID'],
  meta_page_access_token: ['META_PAGE_ACCESS_TOKEN'],
  meta_instagram_id: ['META_INSTAGRAM_ID'],
  meta_pixel_id: ['META_PIXEL_ID', 'FACEBOOK_PIXEL_ID', 'NEXT_PUBLIC_META_PIXEL_ID'],
  meta_test_event_code: ['META_TEST_EVENT_CODE'],
  meta_webhook_verify_token: ['META_WEBHOOK_VERIFY_TOKEN'],
  ga4_property_id: [
    'GA4_PROPERTY_ID',
    'GOOGLE_ANALYTICS_PROPERTY_ID',
    'GA_PROPERTY_ID',
    'NEXT_PUBLIC_GA4_PROPERTY_ID',
    'NEXT_PUBLIC_GA_PROPERTY_ID',
  ],
  ga4_measurement_id: [
    'GA4_MEASUREMENT_ID',
    'GOOGLE_ANALYTICS_MEASUREMENT_ID',
    'GA_MEASUREMENT_ID',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  ],
  google_service_account_json: ['GOOGLE_SERVICE_ACCOUNT_JSON'],
  google_application_credentials_json: ['GOOGLE_APPLICATION_CREDENTIALS_JSON', 'GOOGLE_CREDENTIALS_JSON'],
  google_client_email: ['GOOGLE_CLIENT_EMAIL', 'GCP_CLIENT_EMAIL'],
  google_private_key: ['GOOGLE_PRIVATE_KEY', 'GCP_PRIVATE_KEY'],
  google_project_id: ['GOOGLE_PROJECT_ID'],
  tiktok_access_token: ['TIKTOK_ACCESS_TOKEN'],
  tiktok_advertiser_id: ['TIKTOK_ADVERTISER_ID'],
  tiktok_pixel_id: ['TIKTOK_PIXEL_ID'],
  x_ads_account_id: ['X_ADS_ACCOUNT_ID'],
  x_bearer_token: ['X_BEARER_TOKEN'],
  x_api_key: ['X_API_KEY'],
  x_api_secret: ['X_API_SECRET'],
  linkedin_access_token: ['LINKEDIN_ACCESS_TOKEN'],
  linkedin_ad_account_id: ['LINKEDIN_AD_ACCOUNT_ID'],
  google_ads_customer_id: ['GOOGLE_ADS_CUSTOMER_ID'],
  google_ads_client_id: ['GOOGLE_ADS_CLIENT_ID'],
  google_ads_refresh_token: ['GOOGLE_ADS_REFRESH_TOKEN'],
  hotjar_site_id: ['NEXT_PUBLIC_HOTJAR_SITE_ID'],
  gtm_id: ['NEXT_PUBLIC_GTM_ID'],
  openai_api_key: ['OPENAI_API_KEY'],
  google_ai_api_key: ['GOOGLE_AI_API_KEY'],
  resend_api_key: ['RESEND_API_KEY'],
  resend_from_email: ['RESEND_FROM_EMAIL'],
  resend_webhook_secret: ['RESEND_WEBHOOK_SECRET'],
  upstash_redis_rest_url: ['UPSTASH_REDIS_REST_URL'],
  upstash_redis_rest_token: ['UPSTASH_REDIS_REST_TOKEN'],
  supabase_url: ['NEXT_PUBLIC_SUPABASE_URL'],
  supabase_anon_key: ['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  supabase_service_role_key: ['SUPABASE_SERVICE_ROLE_KEY'],
  n8n_webhook_url: ['N8N_WEBHOOK_URL', 'NANO_BANANA_WEBHOOK_URL'],
  n8n_webhook_secret: ['N8N_WEBHOOK_SECRET'],
  app_url: ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL'],
};

// ========================================
// LISTAR INTEGRAÇÕES
// ========================================

export async function getIntegrations() {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .order('integration_name', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar integrações:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// BUSCAR INTEGRAÇÃO POR NOME
// ========================================

export async function getIntegrationByName(name: string) {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_name', name)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) return { success: false, data: null, error: error.message };
    return { success: true, data: Array.isArray(data) && data.length > 0 ? data[0] : null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// SALVAR/ATUALIZAR INTEGRAÇÃO
// ========================================

export async function upsertIntegration(input: {
  integration_name: string;
  encrypted_credentials: Record<string, unknown>;
  config?: Record<string, unknown>;
  is_active?: boolean;
}) {
  try {
    const { data: existingRows, error: existingError } = await supabase
      .from('integration_settings')
      .select('id')
      .eq('integration_name', input.integration_name)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    const existing = Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null;

    if (existing) {
      // Update
      const { error } = await supabase
        .from('integration_settings')
        .update({
          encrypted_credentials: input.encrypted_credentials,
          config: input.config || {},
          is_active: input.is_active ?? true,
          last_sync_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', existing.id);

      if (error) return { success: false, error: error.message };
    } else {
      // Insert
      const { error } = await supabase
        .from('integration_settings')
        .insert({
          integration_name: input.integration_name,
          encrypted_credentials: input.encrypted_credentials,
          config: input.config || {},
          is_active: input.is_active ?? true,
        });

      if (error) return { success: false, error: error.message };
    }

    revalidatePath(`${PORTAL}/integracoes`);
    return { success: true, message: 'Integração salva!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// TOGGLE INTEGRAÇÃO (ativar/desativar)
// ========================================

export async function toggleIntegration(id: string, is_active: boolean) {
  try {
    const { error } = await supabase
      .from('integration_settings')
      .update({ is_active })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/integracoes`);
    return { success: true, message: is_active ? 'Integração ativada!' : 'Integração desativada!' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// WEBHOOK LOGS
// ========================================

export async function getWebhookLogs(filters?: {
  source?: string;
  status?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.source) query = query.eq('source', filters.source);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar webhook logs:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], error: msg };
  }
}

// ========================================
// CONFIGURAÇÕES DO SISTEMA (usa integration_settings)
// ========================================

export async function getSystemConfig() {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('integration_name, config, encrypted_credentials, updated_at')
      .in('integration_name', ['system_config', 'meta_ads', 'google_analytics', 'ga4', 'hotjar', 'whatsapp', 'meta_pixel'])
      .order('updated_at', { ascending: true })
      .limit(100);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    const rows = Array.isArray(data) ? data : [];
    const merged: Record<string, unknown> = {};

    for (const row of rows) {
      const config = asRecord(row.config);
      const encrypted = asRecord(row.encrypted_credentials);
      Object.assign(merged, config, encrypted);
    }

    // Normaliza aliases legados de GA4
    const gaLegacy = asString(merged.google_analytics_id);
    const ga4PropertyId = firstNonEmpty(
      merged.ga4_property_id,
      merged.google_analytics_property_id,
      /^\d+$/.test(gaLegacy) ? gaLegacy : '',
    );
    const ga4MeasurementId = firstNonEmpty(
      merged.ga4_measurement_id,
      merged.google_analytics_measurement_id,
      /^G-[A-Z0-9]+$/.test(gaLegacy.toUpperCase()) ? gaLegacy.toUpperCase() : '',
    );
    if (ga4PropertyId) merged.ga4_property_id = ga4PropertyId;
    if (ga4MeasurementId) merged.ga4_measurement_id = ga4MeasurementId;

    // Alias Meta/Facebook
    const metaAccessToken = firstNonEmpty(merged.meta_access_token, merged.facebook_access_token);
    const metaAdAccountId = firstNonEmpty(merged.meta_ad_account_id, merged.facebook_ad_account_id);
    const metaPixelId = firstNonEmpty(merged.meta_pixel_id, merged.facebook_pixel_id, merged.next_public_meta_pixel_id);
    const metaPageId = firstNonEmpty(merged.meta_page_id, merged.facebook_page_id);
    if (metaAccessToken) merged.meta_access_token = metaAccessToken;
    if (metaAdAccountId) merged.meta_ad_account_id = metaAdAccountId;
    if (metaPixelId) merged.meta_pixel_id = metaPixelId;
    if (metaPageId) merged.meta_page_id = metaPageId;

    // Preenche com env se estiver vazio na base
    for (const [targetKey, envNames] of Object.entries(SYSTEM_CONFIG_ENV_KEYS)) {
      if (hasValue(merged[targetKey])) continue;
      const envValue = firstNonEmpty(...envNames.map((envName) => process.env[envName]));
      if (envValue) merged[targetKey] = envValue;
    }

    return {
      success: true,
      data: Object.keys(merged).length > 0 ? merged : null,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

export async function saveSystemConfig(config: Record<string, unknown>) {
  try {
    const sensitiveKeys = [
      'whatsapp_api_token',
      'whatsapp_webhook_verify_token',
      'meta_access_token',
      'meta_app_secret',
      'meta_webhook_verify_token',
      'meta_page_access_token',
      'tiktok_access_token',
      'x_bearer_token',
      'x_api_key',
      'x_api_secret',
      'linkedin_access_token',
      'google_ads_refresh_token',
      'google_service_account_json',
      'google_application_credentials_json',
      'google_credentials_json',
      'google_private_key',
      'openai_api_key',
      'google_ai_api_key',
      'resend_api_key',
      'resend_webhook_secret',
      'upstash_redis_rest_token',
      'supabase_service_role_key',
      'n8n_webhook_secret',
      'facebook_app_secret',
      'smtp_host',
      'smtp_port',
      'smtp_user',
    ] as const;

    const normalize = (value: unknown): string => {
      if (typeof value === 'number' && Number.isFinite(value)) return `${value}`;
      if (typeof value === 'string') return value.trim();
      return '';
    };

    const encryptedCredentials: Record<string, unknown> = {};
    const publicConfig: Record<string, unknown> = { ...config };

    for (const key of sensitiveKeys) {
      encryptedCredentials[key] = normalize(config[key]);
      delete publicConfig[key];
    }

    const result = await upsertIntegration({
      integration_name: 'system_config',
      encrypted_credentials: encryptedCredentials,
      config: publicConfig,
      is_active: true,
    });

    if (result.success) {
      clearGA4AvailabilityCache();
      revalidatePath(`${PORTAL}/analytics`);
    }

    revalidatePath(`${PORTAL}/configuracoes`);
    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// PERFIL DO ADMIN (usa integration_settings)
// ========================================

export async function getAdminProfile() {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('config')
      .eq('integration_name', 'admin_profile')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return { success: true, data: row?.config || null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

export async function saveAdminProfile(profile: Record<string, unknown>) {
  try {
    const result = await upsertIntegration({
      integration_name: 'admin_profile',
      encrypted_credentials: {},
      config: profile,
      is_active: true,
    });

    revalidatePath(`${PORTAL}/perfil`);
    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}
