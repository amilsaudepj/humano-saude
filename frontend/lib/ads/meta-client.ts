// =====================================================
// META CLIENT — Wrapper da Facebook Marketing API
// Humano Saúde — Sistema de Gestão de Planos de Saúde
// =====================================================

import type {
  MetaAdsConfig,
  FacebookTargeting,
  CampaignParams,
  AdSetParams,
  AdCreativeParams,
  AdParams,
  AdMetrics,
  MetaApiError,
} from './types';
import { INTEREST_MAPPINGS } from './types';

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// =====================================================
// CONFIGURAÇÃO
// =====================================================

export function getMetaConfig(overrides?: Partial<MetaAdsConfig>): MetaAdsConfig {
  const envAccessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '';
  const envAdAccountId = process.env.META_AD_ACCOUNT_ID || process.env.FACEBOOK_AD_ACCOUNT_ID || '';
  const envPageId = process.env.META_PAGE_ID || '';
  const envPixelId = process.env.META_PIXEL_ID || process.env.FACEBOOK_PIXEL_ID || '';
  const envPageAccessToken = process.env.META_PAGE_ACCESS_TOKEN || '';
  const envInstagramId = process.env.META_INSTAGRAM_ID || '';

  const accessToken = overrides?.accessToken || envAccessToken;
  const adAccountId = overrides?.adAccountId || envAdAccountId;
  const pageId = overrides?.pageId || envPageId;
  const pixelId = overrides?.pixelId || envPixelId;
  const pageAccessToken = overrides?.pageAccessToken || envPageAccessToken;
  const instagramId = overrides?.instagramId || envInstagramId;

  return { accessToken, adAccountId, pageId, pixelId, pageAccessToken, instagramId };
}

export function isMetaConfigured(overrides?: Partial<MetaAdsConfig>): boolean {
  const config = getMetaConfig(overrides);
  return !!(config.accessToken && config.adAccountId && config.pageId);
}

function normalizeAdAccountId(accountId: string): string {
  return accountId.replace(/^act_/i, '').trim();
}

// =====================================================
// TRATAMENTO DE ERROS
// =====================================================

const META_ERROR_MESSAGES: Record<number, string> = {
  1: 'Erro desconhecido da API. Tente novamente.',
  2: 'Serviço temporariamente indisponível. Tente em 5 minutos.',
  4: 'Limite de chamadas atingido. Aguarde alguns minutos.',
  10: 'Permissão negada. Verifique as permissões do app Meta.',
  17: 'Limite de chamadas de conta atingido.',
  100: 'Parâmetro inválido na requisição.',
  190: 'Token expirado ou inválido. Gere um novo token no Meta Business.',
  200: 'Permissão insuficiente para esta ação.',
  294: 'A conta de anúncios foi desativada.',
  368: 'Conta bloqueada temporariamente por violação de política.',
  1487390: 'O criativo não atende às políticas do Facebook.',
  1885183: 'App em modo desenvolvimento. Use Page Access Token.',
  2446079: 'Verifique se os ativos estão vinculados ao Business Manager.',
};

export function handleMetaError(error: unknown): MetaApiError {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = error as { response?: { data?: { error?: { code?: number; message?: string } } } };
    const metaError = resp.response?.data?.error;
    if (metaError?.code) {
      return {
        code: metaError.code,
        message: metaError.message || 'Erro desconhecido',
        userMessage: META_ERROR_MESSAGES[metaError.code] || metaError.message || 'Erro na API da Meta.',
      };
    }
  }

  if (error instanceof Error) {
    // Tratar erros de fetch
    const codeMatch = error.message.match(/code[:\s]*(\d+)/i);
    if (codeMatch) {
      const code = parseInt(codeMatch[1], 10);
      return {
        code,
        message: error.message,
        userMessage: META_ERROR_MESSAGES[code] || error.message,
      };
    }
    return { code: 0, message: error.message, userMessage: error.message };
  }

  return { code: 0, message: 'Erro desconhecido', userMessage: 'Erro inesperado na comunicação com a Meta.' };
}

// =====================================================
// CHAMADAS À API (fetch wrapper)
// =====================================================

async function metaApiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  accessToken?: string,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<T> {
  const token = accessToken || getMetaConfig(configOverrides).accessToken;
  if (!token) throw new Error('META_ACCESS_TOKEN não configurado');

  const url = endpoint.startsWith('http') ? endpoint : `${META_API_BASE}${endpoint}`;
  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = method === 'GET' ? `${url}${separator}access_token=${token}` : url;

  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (method === 'POST' && body) {
    options.body = JSON.stringify({ ...body, access_token: token });
  } else if (method === 'DELETE') {
    options.body = JSON.stringify({ access_token: token });
  }

  const response = await fetch(fullUrl, options);
  const data = await response.json();

  if (!response.ok || data.error) {
    const errorCode = data.error?.code || response.status;
    const errorMsg = data.error?.message || `HTTP ${response.status}`;
    const friendlyMsg = META_ERROR_MESSAGES[errorCode] || errorMsg;
    const err = new Error(friendlyMsg) as Error & { code: number; metaError: typeof data.error };
    err.code = errorCode;
    err.metaError = data.error;
    throw err;
  }

  return data as T;
}

// =====================================================
// UPLOAD DE IMAGEM
// =====================================================

export async function uploadImageToMeta(
  imageUrl: string,
  accountId?: string,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<string> {
  const config = getMetaConfig(configOverrides);
  const acctId = normalizeAdAccountId(accountId || config.adAccountId);

  const data = await metaApiCall<{ images: Record<string, { hash: string }> }>(
    `/act_${acctId}/adimages`,
    'POST',
    { url: imageUrl },
    undefined,
    configOverrides
  );

  const firstKey = Object.keys(data.images)[0];
  if (!firstKey || !data.images[firstKey]) {
    throw new Error('Falha no upload da imagem para Meta');
  }

  return data.images[firstKey].hash;
}

// =====================================================
// CAMPANHA
// =====================================================

export async function createCampaign(
  accountId: string,
  params: CampaignParams,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<{ id: string }> {
  const normalizedAccountId = normalizeAdAccountId(accountId);
  return metaApiCall<{ id: string }>(
    `/act_${normalizedAccountId}/campaigns`,
    'POST',
    {
      name: params.name,
      objective: params.objective,
      status: params.status,
      special_ad_categories: params.special_ad_categories,
      // Orçamento no nível do AdSet (não da campanha)
    },
    undefined,
    configOverrides
  );
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  await metaApiCall(`/${campaignId}`, 'DELETE');
}

// =====================================================
// TARGETING
// =====================================================

export function buildTargeting(audience: string): FacebookTargeting {
  const interests = INTEREST_MAPPINGS[audience] || INTEREST_MAPPINGS['default'];

  const targeting: FacebookTargeting = {
    geo_locations: { countries: ['BR'] },
    age_min: 25,
    age_max: 55,
    publisher_platforms: ['facebook', 'instagram'],
    facebook_positions: ['feed', 'story', 'marketplace'],
    instagram_positions: ['stream', 'story', 'reels', 'explore'],
  };

  if (interests.length > 0) {
    targeting.flexible_spec = [{ interests }];
  }

  return targeting;
}

// =====================================================
// ADSET
// =====================================================

export async function createAdSet(
  accountId: string,
  params: AdSetParams,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<{ id: string }> {
  const normalizedAccountId = normalizeAdAccountId(accountId);
  const body: Record<string, unknown> = {
    name: params.name,
    campaign_id: params.campaign_id,
    daily_budget: params.daily_budget,
    billing_event: params.billing_event || 'IMPRESSIONS',
    optimization_goal: params.optimization_goal,
    targeting: params.targeting,
    status: params.status || 'PAUSED',
    bid_strategy: params.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
  };

  // promoted_object para conversões
  if (params.pixel_id && params.custom_event_type) {
    body.promoted_object = {
      pixel_id: params.pixel_id,
      custom_event_type: params.custom_event_type,
    };
  }

  if (params.attribution_spec) {
    body.attribution_spec = params.attribution_spec;
  }

  return metaApiCall<{ id: string }>(
    `/act_${normalizedAccountId}/adsets`,
    'POST',
    body,
    undefined,
    configOverrides
  );
}

export async function updateAdSetBudget(
  adSetId: string,
  newBudgetCents: number,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<{ success: boolean }> {
  return metaApiCall<{ success: boolean }>(
    `/${adSetId}`,
    'POST',
    { daily_budget: newBudgetCents },
    undefined,
    configOverrides
  );
}

export async function getAdSetDetails(
  adSetId: string,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<{ id: string; daily_budget: string; status: string }> {
  return metaApiCall(
    `/${adSetId}?fields=id,daily_budget,status`,
    'GET',
    undefined,
    undefined,
    configOverrides
  );
}

export async function deleteAdSet(adSetId: string): Promise<void> {
  await metaApiCall(`/${adSetId}`, 'DELETE');
}

// =====================================================
// AD CREATIVE — Workaround para erro 1885183 (DEV MODE)
// =====================================================

export async function createAdCreative(
  accountId: string,
  params: AdCreativeParams,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<{ id: string }> {
  const config = getMetaConfig(configOverrides);
  const normalizedAccountId = normalizeAdAccountId(accountId);
  // Em dev mode, Page Access Token evita erro 1885183
  const token = config.pageAccessToken || config.accessToken;

  const response = await fetch(
    `${META_API_BASE}/act_${normalizedAccountId}/adcreatives`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: params.name,
        object_story_spec: params.object_story_spec,
        access_token: token,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    const code = data.error?.code || response.status;
    throw new Error(META_ERROR_MESSAGES[code] || data.error?.message || `Erro ${code} ao criar creative`);
  }

  return { id: data.id };
}

// =====================================================
// AD
// =====================================================

export async function createAd(
  accountId: string,
  params: AdParams,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<{ id: string }> {
  const config = getMetaConfig(configOverrides);
  const normalizedAccountId = normalizeAdAccountId(accountId);
  const pixelId = config.pixelId;

  const body: Record<string, unknown> = {
    name: params.name,
    adset_id: params.adset_id,
    creative: params.creative,
    status: params.status,
  };

  // Tracking do Pixel
  if (pixelId) {
    body.tracking_specs = [
      {
        'action.type': ['offsite_conversion'],
        fb_pixel: [pixelId],
      },
    ];
  }

  // UTM tags automáticas
  body.url_tags = 'utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}';

  return metaApiCall<{ id: string }>(
    `/act_${normalizedAccountId}/ads`,
    'POST',
    body,
    undefined,
    configOverrides
  );
}

export async function updateAdStatus(
  adId: string,
  status: 'ACTIVE' | 'PAUSED',
  configOverrides?: Partial<MetaAdsConfig>
): Promise<{ success: boolean }> {
  return metaApiCall<{ success: boolean }>(
    `/${adId}`,
    'POST',
    { status },
    undefined,
    configOverrides
  );
}

// =====================================================
// INSIGHTS — Métricas de performance
// =====================================================

export async function getActiveAds(
  accountId?: string,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<Array<{ id: string; name: string; status: string; adset_id: string; campaign_id: string }>> {
  const config = getMetaConfig(configOverrides);
  const acctId = normalizeAdAccountId(accountId || config.adAccountId);

  const data = await metaApiCall<{ data: Array<Record<string, string>> }>(
    `/act_${acctId}/ads?fields=id,name,status,adset_id,campaign_id&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PENDING_REVIEW","PREAPPROVED"]}]&limit=500`,
    'GET',
    undefined,
    undefined,
    configOverrides
  );

  return (data.data || []).map((ad) => ({
    id: ad.id,
    name: ad.name,
    status: ad.status,
    adset_id: ad.adset_id,
    campaign_id: ad.campaign_id,
  }));
}

export async function getAdInsights(
  accountId?: string,
  datePreset: string = 'last_7d',
  configOverrides?: Partial<MetaAdsConfig>
): Promise<AdMetrics[]> {
  const config = getMetaConfig(configOverrides);
  const acctId = normalizeAdAccountId(accountId || config.adAccountId);

  const fields = [
    'ad_id', 'ad_name', 'adset_id', 'campaign_id',
    'spend', 'impressions', 'clicks', 'ctr',
    'actions', 'action_values',
  ].join(',');

  const data = await metaApiCall<{ data: Array<Record<string, unknown>> }>(
    `/act_${acctId}/insights?fields=${fields}&level=ad&date_preset=${datePreset}&limit=500`,
    'GET',
    undefined,
    undefined,
    configOverrides
  );

  return (data.data || []).map((row) => {
    const spend = parseFloat(row.spend as string) || 0;
    const impressions = parseInt(row.impressions as string, 10) || 0;
    const clicks = parseInt(row.clicks as string, 10) || 0;
    const ctr = parseFloat(row.ctr as string) || 0;

    // Extrair compras e receita das ações (apenas fb_pixel para evitar duplicação)
    const actions = (row.actions || []) as Array<{ action_type: string; value: string }>;
    const actionValues = (row.action_values || []) as Array<{ action_type: string; value: string }>;

    const purchaseAction = actions.find(
      (a) => a.action_type === 'offsite_conversion.fb_pixel_purchase'
    );
    const purchaseValueAction = actionValues.find(
      (a) => a.action_type === 'offsite_conversion.fb_pixel_purchase'
    );

    const purchases = parseInt(purchaseAction?.value || '0', 10);
    const purchaseValue = parseFloat(purchaseValueAction?.value || '0');
    const roas = spend > 0 ? purchaseValue / spend : 0;
    const cpa = purchases > 0 ? spend / purchases : 0;

    return {
      adId: row.ad_id as string,
      adName: row.ad_name as string,
      adSetId: row.adset_id as string,
      campaignId: row.campaign_id as string,
      spend,
      impressions,
      clicks,
      ctr,
      purchases,
      purchaseValue,
      roas,
      cpa,
      dailyBudget: 0, // Preenchido depois com getAdSetDetails
    };
  });
}

// =====================================================
// CAMPANHAS — Listagem
// =====================================================

export async function getCampaigns(
  accountId?: string,
  status?: string,
  configOverrides?: Partial<MetaAdsConfig>
): Promise<Array<{ id: string; name: string; status: string; objective: string; daily_budget: string }>> {
  const config = getMetaConfig(configOverrides);
  const acctId = normalizeAdAccountId(accountId || config.adAccountId);

  let url = `/act_${acctId}/campaigns?fields=id,name,status,objective,daily_budget&limit=100`;
  if (status) {
    url += `&filtering=[{"field":"effective_status","operator":"IN","value":["${status}"]}]`;
  }

  const data = await metaApiCall<{ data: Array<{ id: string; name: string; status: string; objective: string; daily_budget: string }> }>(
    url,
    'GET',
    undefined,
    undefined,
    configOverrides
  );
  return data.data || [];
}

// =====================================================
// UPLOAD DE VÍDEO
// =====================================================

export async function uploadVideoToMeta(
  videoUrl: string,
  accountId?: string
): Promise<{ video_id: string }> {
  const config = getMetaConfig();
  const acctId = normalizeAdAccountId(accountId || config.adAccountId);

  return metaApiCall<{ video_id: string }>(
    `/act_${acctId}/advideos`,
    'POST',
    { file_url: videoUrl }
  );
}
