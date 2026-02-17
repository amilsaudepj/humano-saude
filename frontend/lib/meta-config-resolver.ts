import { createServiceClient } from '@/lib/supabase';
import type { MetaAdsConfig } from '@/lib/ads/types';
import { logger } from '@/lib/logger';

export interface MetaRuntimeConfig extends Partial<MetaAdsConfig> {
  businessId?: string;
}

export interface ResolveMetaRuntimeOptions {
  preferIntegration?: boolean;
  allowEnvFallback?: boolean;
  requiredAdAccountId?: string;
}

export interface ResolvedMetaRuntime {
  config: MetaRuntimeConfig;
  source: 'integration' | 'env' | 'mixed' | 'none';
  isConfigured: boolean;
  missing: {
    accessToken: boolean;
    adAccountId: boolean;
    pageId: boolean;
  };
  accountMatchesRequirement: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}`;
  return typeof value === 'string' ? value.trim() : '';
}

function firstNonEmpty(...values: Array<unknown>): string {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }
  return '';
}

function normalizeAdAccountId(value: string): string {
  return value.replace(/^act_/i, '').trim();
}

function matchesRequiredAccount(current: string, required?: string): boolean {
  if (!required) return true;
  return normalizeAdAccountId(current) === normalizeAdAccountId(required);
}

function readEnvMetaConfig(): MetaRuntimeConfig {
  return {
    accessToken: firstNonEmpty(
      process.env.META_ACCESS_TOKEN,
      process.env.FACEBOOK_ACCESS_TOKEN,
    ),
    adAccountId: firstNonEmpty(
      process.env.META_AD_ACCOUNT_ID,
      process.env.FACEBOOK_AD_ACCOUNT_ID,
    ),
    pageId: firstNonEmpty(
      process.env.META_PAGE_ID,
      process.env.FACEBOOK_PAGE_ID,
    ),
    pixelId: firstNonEmpty(
      process.env.META_PIXEL_ID,
      process.env.FACEBOOK_PIXEL_ID,
      process.env.NEXT_PUBLIC_META_PIXEL_ID,
    ),
    pageAccessToken: firstNonEmpty(process.env.META_PAGE_ACCESS_TOKEN),
    instagramId: firstNonEmpty(process.env.META_INSTAGRAM_ID, process.env.INSTAGRAM_ACTOR_ID),
    businessId: firstNonEmpty(process.env.META_BUSINESS_ID),
  };
}

async function readIntegrationMetaConfig(): Promise<MetaRuntimeConfig> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('integration_settings')
      .select('integration_name, config, encrypted_credentials, is_active, updated_at')
      .in('integration_name', ['system_config', 'meta_ads', 'meta_pixel', 'meta'])
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error || !Array.isArray(data)) {
      if (error) {
        logger.warn('Falha ao ler integration_settings para Meta runtime', { error: error.message });
      }
      return {};
    }

    const merged: Record<string, unknown> = {};

    for (const row of data) {
      const typedRow = row as {
        integration_name?: string;
        is_active?: boolean;
        config?: unknown;
        encrypted_credentials?: unknown;
      };

      const integrationName = asString(typedRow.integration_name);
      const isActive = integrationName === 'system_config' || typedRow.is_active !== false;
      if (!isActive) continue;

      Object.assign(merged, asRecord(typedRow.config), asRecord(typedRow.encrypted_credentials));
    }

    return {
      accessToken: firstNonEmpty(
        merged.meta_access_token,
        merged.facebook_access_token,
        merged.access_token,
        merged.meta_token,
      ),
      adAccountId: firstNonEmpty(
        merged.meta_ad_account_id,
        merged.facebook_ad_account_id,
        merged.ad_account_id,
      ),
      pageId: firstNonEmpty(
        merged.meta_page_id,
        merged.facebook_page_id,
        merged.page_id,
      ),
      pixelId: firstNonEmpty(
        merged.meta_pixel_id,
        merged.facebook_pixel_id,
        merged.next_public_meta_pixel_id,
        merged.pixel_id,
      ),
      pageAccessToken: firstNonEmpty(
        merged.meta_page_access_token,
        merged.page_access_token,
      ),
      instagramId: firstNonEmpty(
        merged.meta_instagram_id,
        merged.instagram_actor_id,
        merged.instagram_id,
      ),
      businessId: firstNonEmpty(
        merged.meta_business_id,
        merged.business_id,
      ),
    };
  } catch (error) {
    logger.warn('Falha inesperada ao resolver Meta config do banco', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
}

export async function resolveMetaRuntimeConfig(
  options?: ResolveMetaRuntimeOptions
): Promise<ResolvedMetaRuntime> {
  const preferIntegration = options?.preferIntegration ?? true;
  const allowEnvFallback = options?.allowEnvFallback ?? true;

  const [integrationConfig, envConfig] = await Promise.all([
    readIntegrationMetaConfig(),
    Promise.resolve(readEnvMetaConfig()),
  ]);

  const sourceIntegrationReady = Boolean(
    integrationConfig.accessToken && integrationConfig.adAccountId && integrationConfig.pageId
  );
  const sourceEnvReady = Boolean(
    envConfig.accessToken && envConfig.adAccountId && envConfig.pageId
  );

  const mergeByPriority = (...configs: MetaRuntimeConfig[]): MetaRuntimeConfig => ({
    accessToken: firstNonEmpty(...configs.map((cfg) => cfg.accessToken)),
    adAccountId: firstNonEmpty(...configs.map((cfg) => cfg.adAccountId)),
    pageId: firstNonEmpty(...configs.map((cfg) => cfg.pageId)),
    pixelId: firstNonEmpty(...configs.map((cfg) => cfg.pixelId)),
    pageAccessToken: firstNonEmpty(...configs.map((cfg) => cfg.pageAccessToken)),
    instagramId: firstNonEmpty(...configs.map((cfg) => cfg.instagramId)),
    businessId: firstNonEmpty(...configs.map((cfg) => cfg.businessId)),
  });

  const priority = preferIntegration
    ? [integrationConfig, allowEnvFallback ? envConfig : {}]
    : [envConfig, integrationConfig];

  const config = mergeByPriority(...priority);

  const missing = {
    accessToken: !config.accessToken,
    adAccountId: !config.adAccountId,
    pageId: !config.pageId,
  };

  const isConfigured = !(missing.accessToken || missing.adAccountId || missing.pageId);
  const accountMatchesRequirement = matchesRequiredAccount(
    config.adAccountId || '',
    options?.requiredAdAccountId,
  );

  let source: 'integration' | 'env' | 'mixed' | 'none' = 'none';
  if (sourceIntegrationReady && sourceEnvReady) source = 'mixed';
  else if (sourceIntegrationReady) source = 'integration';
  else if (sourceEnvReady) source = 'env';

  return {
    config,
    source,
    isConfigured,
    missing,
    accountMatchesRequirement,
  };
}
