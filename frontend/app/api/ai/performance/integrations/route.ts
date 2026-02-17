import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type IntegrationStatus = {
  name: string;
  key: string;
  connected: boolean;
  envVar: string;
  description: string;
  hint?: string;
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function firstNonEmpty(...values: Array<unknown>): string {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }
  return '';
}

function hasEnv(name: string): boolean {
  return Boolean(process.env[name] && process.env[name]!.trim());
}

export async function GET() {
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from('integration_settings')
      .select('integration_name, is_active, config, encrypted_credentials, updated_at')
      .in('integration_name', [
        'system_config',
        'meta_ads',
        'google_analytics',
        'ga4',
        'hotjar',
        'whatsapp',
        'meta_pixel',
        'resend',
        'upstash',
        'supabase',
        'n8n',
      ])
      .order('updated_at', { ascending: false })
      .limit(100);

    const rows = Array.isArray(data) ? data : [];

    const mergedConfig: Record<string, unknown> = {};
    const mergedCredentials: Record<string, unknown> = {};
    for (const row of [...rows].reverse()) {
      Object.assign(mergedConfig, asObject(row.config));
      Object.assign(mergedCredentials, asObject(row.encrypted_credentials));
    }

    const findRow = (names: string[]) => rows.find((row) => names.includes(asString(row.integration_name)));
    const systemRow = findRow(['system_config']);
    const metaRow = findRow(['meta_ads']);
    const gaRow = findRow(['google_analytics', 'ga4']);
    const hotjarRow = findRow(['hotjar']);

    const config = { ...mergedConfig, ...asObject(systemRow?.config) };
    const credentials = { ...mergedCredentials, ...asObject(systemRow?.encrypted_credentials) };
    const metaConfig = asObject(metaRow?.config);
    const metaCredentials = asObject(metaRow?.encrypted_credentials);
    const gaConfig = asObject(gaRow?.config);
    const gaCredentials = asObject(gaRow?.encrypted_credentials);
    const hotjarConfig = asObject(hotjarRow?.config);

    const ga4PropertyId = firstNonEmpty(
      process.env.GA4_PROPERTY_ID,
      config.ga4_property_id,
      config.google_analytics_property_id,
      gaConfig.ga4_property_id,
      gaConfig.google_analytics_property_id,
      gaCredentials.ga4_property_id,
      gaCredentials.google_analytics_property_id,
    );
    const ga4PropertyReady = /^\d+$/.test(ga4PropertyId);
    const googleServiceAccountJson = firstNonEmpty(
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      credentials.google_service_account_json,
      config.google_service_account_json,
    );
    const googleApplicationCredentialsJson = firstNonEmpty(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      process.env.GOOGLE_CREDENTIALS_JSON,
      credentials.google_application_credentials_json,
      config.google_application_credentials_json,
    );
    const googleClientEmail = firstNonEmpty(
      process.env.GOOGLE_CLIENT_EMAIL,
      process.env.GCP_CLIENT_EMAIL,
      credentials.google_client_email,
      config.google_client_email,
    );
    const googlePrivateKey = firstNonEmpty(
      process.env.GOOGLE_PRIVATE_KEY,
      process.env.GCP_PRIVATE_KEY,
      credentials.google_private_key,
      config.google_private_key,
    );
    const ga4CredentialReady =
      Boolean(googleServiceAccountJson) ||
      Boolean(googleApplicationCredentialsJson) ||
      Boolean(googleClientEmail && googlePrivateKey);

    const metaAccessToken = firstNonEmpty(
      process.env.META_ACCESS_TOKEN,
      process.env.FACEBOOK_ACCESS_TOKEN,
      credentials.meta_access_token,
      credentials.facebook_access_token,
      metaCredentials.meta_access_token,
      metaCredentials.facebook_access_token,
    );
    const metaAccountId = firstNonEmpty(
      process.env.META_AD_ACCOUNT_ID,
      process.env.FACEBOOK_AD_ACCOUNT_ID,
      config.meta_ad_account_id,
      config.facebook_ad_account_id,
      metaConfig.meta_ad_account_id,
      metaConfig.facebook_ad_account_id,
      metaCredentials.meta_ad_account_id,
      metaCredentials.facebook_ad_account_id,
    );

    const hotjarSiteId = firstNonEmpty(
      process.env.NEXT_PUBLIC_HOTJAR_SITE_ID,
      config.hotjar_site_id,
      hotjarConfig.site_id,
      hotjarConfig.hotjar_site_id,
    );
    const gtmId = firstNonEmpty(
      process.env.NEXT_PUBLIC_GTM_ID,
      config.gtm_id,
      config.google_tag_manager_id,
    );

    const openAiKey = firstNonEmpty(
      process.env.OPENAI_API_KEY,
      credentials.openai_api_key,
      config.openai_api_key,
    );
    const geminiKey = firstNonEmpty(
      process.env.GOOGLE_AI_API_KEY,
      credentials.google_ai_api_key,
      config.google_ai_api_key,
    );
    const whatsappToken = firstNonEmpty(
      process.env.WHATSAPP_API_TOKEN,
      credentials.whatsapp_api_token,
      config.whatsapp_api_token,
    );
    const whatsappPhoneId = firstNonEmpty(
      process.env.WHATSAPP_PHONE_NUMBER_ID,
      config.whatsapp_phone_number_id,
      credentials.whatsapp_phone_number_id,
    );
    const metaPixelId = firstNonEmpty(
      process.env.META_PIXEL_ID,
      process.env.FACEBOOK_PIXEL_ID,
      process.env.NEXT_PUBLIC_META_PIXEL_ID,
      config.meta_pixel_id,
      metaConfig.meta_pixel_id,
    );
    const tiktokAccessToken = firstNonEmpty(
      process.env.TIKTOK_ACCESS_TOKEN,
      credentials.tiktok_access_token,
      config.tiktok_access_token,
    );
    const tiktokAdvertiserId = firstNonEmpty(
      process.env.TIKTOK_ADVERTISER_ID,
      config.tiktok_advertiser_id,
      credentials.tiktok_advertiser_id,
    );
    const xAccountId = firstNonEmpty(
      process.env.X_ADS_ACCOUNT_ID,
      config.x_ads_account_id,
      credentials.x_ads_account_id,
    );
    const xBearerToken = firstNonEmpty(
      process.env.X_BEARER_TOKEN,
      credentials.x_bearer_token,
      config.x_bearer_token,
    );
    const linkedinToken = firstNonEmpty(
      process.env.LINKEDIN_ACCESS_TOKEN,
      credentials.linkedin_access_token,
      config.linkedin_access_token,
    );
    const linkedinAccountId = firstNonEmpty(
      process.env.LINKEDIN_AD_ACCOUNT_ID,
      config.linkedin_ad_account_id,
      credentials.linkedin_ad_account_id,
    );
    const googleAdsCustomerId = firstNonEmpty(
      process.env.GOOGLE_ADS_CUSTOMER_ID,
      config.google_ads_customer_id,
    );
    const googleAdsClientId = firstNonEmpty(
      process.env.GOOGLE_ADS_CLIENT_ID,
      config.google_ads_client_id,
    );
    const googleAdsRefreshToken = firstNonEmpty(
      process.env.GOOGLE_ADS_REFRESH_TOKEN,
      credentials.google_ads_refresh_token,
      config.google_ads_refresh_token,
    );
    const resendApiKey = firstNonEmpty(
      process.env.RESEND_API_KEY,
      credentials.resend_api_key,
      config.resend_api_key,
    );
    const upstashRestUrl = firstNonEmpty(
      process.env.UPSTASH_REDIS_REST_URL,
      config.upstash_redis_rest_url,
      credentials.upstash_redis_rest_url,
    );
    const upstashRestToken = firstNonEmpty(
      process.env.UPSTASH_REDIS_REST_TOKEN,
      credentials.upstash_redis_rest_token,
      config.upstash_redis_rest_token,
    );
    const supabaseUrl = firstNonEmpty(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      config.supabase_url,
    );
    const supabaseAnonKey = firstNonEmpty(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      config.supabase_anon_key,
    );
    const supabaseServiceRoleKey = firstNonEmpty(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      credentials.supabase_service_role_key,
      config.supabase_service_role_key,
    );
    const n8nWebhookUrl = firstNonEmpty(
      process.env.N8N_WEBHOOK_URL,
      process.env.NANO_BANANA_WEBHOOK_URL,
      config.n8n_webhook_url,
      config.nano_banana_webhook_url,
    );
    const n8nWebhookSecret = firstNonEmpty(
      process.env.N8N_WEBHOOK_SECRET,
      credentials.n8n_webhook_secret,
      config.n8n_webhook_secret,
    );

    const statuses: IntegrationStatus[] = [
      {
        name: 'OpenAI',
        key: 'openai',
        connected: Boolean(openAiKey),
        envVar: 'OPENAI_API_KEY',
        description: 'Motor GPT-4o para análise inteligente (Camadas 1 e 2)',
        hint: openAiKey ? undefined : 'Configure OPENAI_API_KEY (env) ou OpenAI API Key em Configurações > APIs.',
      },
      {
        name: 'Gemini (Google AI Studio)',
        key: 'gemini',
        connected: Boolean(geminiKey),
        envVar: 'GOOGLE_AI_API_KEY',
        description: 'Geração de copy, ângulos e criativos IA',
        hint: geminiKey ? undefined : 'Configure GOOGLE_AI_API_KEY (env) ou Google AI API Key em Configurações > APIs.',
      },
      {
        name: 'Vertex AI (Gemini GCP)',
        key: 'vertex_ai',
        connected: Boolean(googleServiceAccountJson || googleApplicationCredentialsJson || (googleClientEmail && googlePrivateKey)),
        envVar: 'GOOGLE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS_JSON',
        description: 'OCR e personalização IA com Gemini no GCP',
        hint: (googleServiceAccountJson || googleApplicationCredentialsJson || (googleClientEmail && googlePrivateKey))
          ? undefined
          : 'Configure credenciais de service account para OCR e rotas Vertex.',
      },
      {
        name: 'Meta Marketing API',
        key: 'meta',
        connected: Boolean(metaAccessToken && metaAccountId),
        envVar: 'META_ACCESS_TOKEN + META_AD_ACCOUNT_ID',
        description: 'Dados de campanhas, ad sets e anúncios',
        hint: metaAccessToken && metaAccountId
          ? undefined
          : 'Faltam token e/ou ad account id da Meta.',
      },
      {
        name: 'Google Analytics 4',
        key: 'ga4',
        connected: ga4PropertyReady && ga4CredentialReady,
        envVar: 'GA4_PROPERTY_ID + credenciais Google',
        description: 'Tráfego, sessões, fontes e dados realtime',
        hint: ga4PropertyReady && ga4CredentialReady
          ? undefined
          : 'Requer Property ID numérico e credenciais Google válidas.',
      },
      {
        name: 'Google Tag Manager',
        key: 'gtm',
        connected: Boolean(gtmId),
        envVar: 'NEXT_PUBLIC_GTM_ID',
        description: 'Container de tags para pixels e scripts',
        hint: gtmId ? undefined : 'Configure GTM ID (GTM-XXXXXXX) em Configurações > APIs.',
      },
      {
        name: 'Hotjar',
        key: 'hotjar',
        connected: Boolean(hotjarSiteId),
        envVar: 'NEXT_PUBLIC_HOTJAR_SITE_ID',
        description: 'Heatmaps e session replay',
        hint: hotjarSiteId
          ? undefined
          : 'Defina NEXT_PUBLIC_HOTJAR_SITE_ID para ativar tracking dedicado.',
      },
      {
        name: 'WhatsApp Business API',
        key: 'whatsapp',
        connected: Boolean(whatsappToken && whatsappPhoneId),
        envVar: 'WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID',
        description: 'Mensageria oficial e automações WhatsApp',
        hint: whatsappToken && whatsappPhoneId
          ? undefined
          : 'Preencha token e phone number id em Configurações > APIs.',
      },
      {
        name: 'Meta Pixel',
        key: 'meta_pixel',
        connected: Boolean(metaPixelId),
        envVar: 'META_PIXEL_ID',
        description: 'Tracking de conversões e eventos',
        hint: metaPixelId ? undefined : 'Configure o Pixel ID para rastrear conversões.',
      },
      {
        name: 'TikTok Ads',
        key: 'tiktok_ads',
        connected: Boolean(tiktokAccessToken && tiktokAdvertiserId),
        envVar: 'TIKTOK_ACCESS_TOKEN + TIKTOK_ADVERTISER_ID',
        description: 'Métricas e campanhas da TikTok Marketing API',
        hint: tiktokAccessToken && tiktokAdvertiserId
          ? undefined
          : 'Faltam token e/ou advertiser id da TikTok.',
      },
      {
        name: 'X Ads (Twitter Ads)',
        key: 'x_ads',
        connected: Boolean(xAccountId && xBearerToken),
        envVar: 'X_ADS_ACCOUNT_ID + X_BEARER_TOKEN',
        description: 'Métricas de mídia paga no X/Twitter',
        hint: xAccountId && xBearerToken
          ? undefined
          : 'Faltam account id e/ou bearer token do X.',
      },
      {
        name: 'LinkedIn Ads',
        key: 'linkedin_ads',
        connected: Boolean(linkedinToken && linkedinAccountId),
        envVar: 'LINKEDIN_ACCESS_TOKEN + LINKEDIN_AD_ACCOUNT_ID',
        description: 'Campanhas B2B e performance LinkedIn',
        hint: linkedinToken && linkedinAccountId
          ? undefined
          : 'Faltam access token e/ou ad account id do LinkedIn.',
      },
      {
        name: 'Google Ads API',
        key: 'google_ads',
        connected: Boolean(googleAdsCustomerId && googleAdsClientId && googleAdsRefreshToken),
        envVar: 'GOOGLE_ADS_CUSTOMER_ID + GOOGLE_ADS_CLIENT_ID + GOOGLE_ADS_REFRESH_TOKEN',
        description: 'Campanhas de pesquisa/display e conversões',
        hint: googleAdsCustomerId && googleAdsClientId && googleAdsRefreshToken
          ? undefined
          : 'Faltam customer id, client id e/ou refresh token do Google Ads.',
      },
      {
        name: 'Resend',
        key: 'resend',
        connected: Boolean(resendApiKey),
        envVar: 'RESEND_API_KEY',
        description: 'Envio de emails transacionais',
        hint: resendApiKey ? undefined : 'Defina RESEND_API_KEY para disparos por email.',
      },
      {
        name: 'Upstash Redis',
        key: 'upstash',
        connected: Boolean(upstashRestUrl && upstashRestToken),
        envVar: 'UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN',
        description: 'Rate limit e cache distribuído',
        hint: upstashRestUrl && upstashRestToken
          ? undefined
          : 'Configure URL e token do Upstash para rate limiting.',
      },
      {
        name: 'Supabase',
        key: 'supabase',
        connected: Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey),
        envVar: 'NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY',
        description: 'Banco de dados, auth e storage',
      },
      {
        name: 'n8n Webhooks',
        key: 'n8n',
        connected: Boolean(n8nWebhookUrl),
        envVar: 'N8N_WEBHOOK_URL (+ N8N_WEBHOOK_SECRET opcional)',
        description: 'Automacao de fluxos externos',
        hint: n8nWebhookUrl
          ? n8nWebhookSecret ? undefined : 'Webhook URL detectada sem secret de assinatura.'
          : 'Configure URL do webhook n8n em Configurações > APIs.',
      },
    ];

    return NextResponse.json({ success: true, data: statuses });
  } catch (error: unknown) {
    logger.error('[ai/performance/integrations] erro', error as Error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 },
    );
  }
}
