// =====================================================
// API: /api/ads/launch — Lançar Campanha Completa (Batch)
// Aceita JSON e multipart/form-data para múltiplas imagens.
// =====================================================

import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  isMetaConfigured,
  getMetaConfig,
  createCampaign,
  createAdSet,
  createAdCreative,
  createAd,
  buildTargeting,
  uploadImageToMeta,
} from '@/lib/ads/meta-client';
import { getOptimizationConfig, getRecommendedCTA } from '@/lib/ads/optimization-config';
import { generateAdCopy, generateCopiesForImages } from '@/lib/ads/copy-generator';
import { getFunnelStrategy, buildStrategyTargeting, calculateAdjustedBudget } from '@/lib/ads/funnel-strategy';
import type {
  FunnelStage,
  CampaignObjectiveKey,
  MetaCampaignObjective,
  MetaAdsConfig,
  GeneratedCopy,
} from '@/lib/ads/types';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export const runtime = 'nodejs';

const CREATIVE_BUCKET = 'creatives';
const MAX_IMAGES = 5;
const MAX_VARIATIONS_PER_IMAGE = 3;

const OBJECTIVE_VALUES: CampaignObjectiveKey[] = ['TRAFEGO', 'CONVERSAO', 'LEADS', 'ENGAJAMENTO', 'ALCANCE'];
const FUNNEL_VALUES: FunnelStage[] = ['TOPO', 'MEIO', 'FUNDO'];

interface LaunchRequest {
  name?: string;
  dailyBudget?: number;
  primaryText?: string;
  headline?: string;
  imageUrl?: string;
  imageUrls?: string[];
  linkUrl?: string;
  description?: string;
  objective?: CampaignObjectiveKey;
  funnelStage?: FunnelStage;
  audience?: string;
  status?: 'ACTIVE' | 'PAUSED';
  customAudienceIds?: string[];
  excludedAudienceIds?: string[];
  generateCopy?: boolean;
}

interface LaunchPayload {
  name: string;
  dailyBudget: number;
  primaryText: string;
  headline: string;
  imageUrl: string;
  imageUrls: string[];
  linkUrl: string;
  description: string;
  objective: CampaignObjectiveKey;
  funnelStage: FunnelStage;
  audience: string;
  status: 'ACTIVE' | 'PAUSED';
  customAudienceIds: string[];
  excludedAudienceIds: string[];
  generateCopy: boolean;
  imageFiles: File[];
}

interface CreativeVariation {
  primaryText: string;
  headline: string;
}

interface CreativeLaunchResult {
  imageUrl: string;
  primaryText: string;
  headline: string;
  creativeId: string;
  adId: string;
  generatedName: string;
  metadata: Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}`;
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function firstNonEmpty(...values: Array<unknown>): string {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }
  return '';
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return fallback;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'sim', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'nao', 'não', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }

  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => asString(item)).filter(Boolean);
      }
    } catch {
      // Continua para split simples.
    }
  }

  return trimmed
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeDailyBudgetCents(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value < 1000) return Math.round(value * 100);
  return Math.round(value);
}

function normalizeAdAccountId(value: string): string {
  return value.replace(/^act_/i, '').trim();
}

function normalizeObjective(value: string): CampaignObjectiveKey {
  const upper = value.toUpperCase();
  return OBJECTIVE_VALUES.includes(upper as CampaignObjectiveKey)
    ? (upper as CampaignObjectiveKey)
    : 'CONVERSAO';
}

function normalizeFunnelStage(value: string): FunnelStage {
  const upper = value.toUpperCase();
  return FUNNEL_VALUES.includes(upper as FunnelStage)
    ? (upper as FunnelStage)
    : 'TOPO';
}

function normalizeStatus(value: string): 'ACTIVE' | 'PAUSED' {
  return value.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
}

function readFormArray(formData: FormData, key: string): string[] {
  const direct = formData.getAll(key).flatMap((entry) => parseStringArray(entry));
  const bracket = formData.getAll(`${key}[]`).flatMap((entry) => parseStringArray(entry));
  return uniqueStrings([...direct, ...bracket]);
}

function getImageFilesFromForm(formData: FormData): File[] {
  const files: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File)) continue;
    if (value.size === 0) continue;
    if (key === 'images' || key.startsWith('image')) {
      files.push(value);
    }
  }

  return files.slice(0, MAX_IMAGES);
}

async function parseLaunchPayload(request: NextRequest): Promise<LaunchPayload> {
  const contentType = request.headers.get('content-type')?.toLowerCase() || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const imageFiles = getImageFilesFromForm(formData);

    const imageUrls = uniqueStrings([
      ...readFormArray(formData, 'imageUrls'),
      asString(formData.get('imageUrl')),
    ]);

    return {
      name: asString(formData.get('name')),
      dailyBudget: asNumber(formData.get('dailyBudget')),
      primaryText: asString(formData.get('primaryText')),
      headline: asString(formData.get('headline')),
      imageUrl: asString(formData.get('imageUrl')),
      imageUrls,
      linkUrl: asString(formData.get('linkUrl')),
      description: asString(formData.get('description')),
      objective: normalizeObjective(asString(formData.get('objective'))),
      funnelStage: normalizeFunnelStage(asString(formData.get('funnelStage'))),
      audience: asString(formData.get('audience')) || 'Empresas PME',
      status: normalizeStatus(asString(formData.get('status'))),
      customAudienceIds: readFormArray(formData, 'customAudienceIds'),
      excludedAudienceIds: readFormArray(formData, 'excludedAudienceIds'),
      generateCopy: parseBoolean(formData.get('generateCopy'), false),
      imageFiles,
    };
  }

  let body: LaunchRequest = {};
  try {
    body = (await request.json()) as LaunchRequest;
  } catch {
    body = {};
  }

  return {
    name: asString(body.name),
    dailyBudget: asNumber(body.dailyBudget),
    primaryText: asString(body.primaryText),
    headline: asString(body.headline),
    imageUrl: asString(body.imageUrl),
    imageUrls: uniqueStrings([...(body.imageUrls || []), asString(body.imageUrl)]),
    linkUrl: asString(body.linkUrl),
    description: asString(body.description),
    objective: normalizeObjective(asString(body.objective)),
    funnelStage: normalizeFunnelStage(asString(body.funnelStage)),
    audience: asString(body.audience) || 'Empresas PME',
    status: normalizeStatus(asString(body.status)),
    customAudienceIds: uniqueStrings(body.customAudienceIds || []),
    excludedAudienceIds: uniqueStrings(body.excludedAudienceIds || []),
    generateCopy: parseBoolean(body.generateCopy, false),
    imageFiles: [],
  };
}

async function loadMetaConfigFromIntegrations(
  supabase: ReturnType<typeof createServiceClient>
): Promise<Partial<MetaAdsConfig>> {
  const integrationNames = ['system_config', 'meta_ads', 'meta_pixel', 'meta'];

  const { data, error } = await supabase
    .from('integration_settings')
    .select('integration_name, config, encrypted_credentials, is_active, updated_at')
    .in('integration_name', integrationNames)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error || !Array.isArray(data)) {
    if (error) {
      logger.warn('Não foi possível carregar integrações Meta para launch', { error: error.message });
    }
    return {};
  }

  const merged: Record<string, unknown> = {};

  for (const row of data) {
    const rowRecord = row as {
      integration_name?: string;
      is_active?: boolean;
      config?: unknown;
      encrypted_credentials?: unknown;
    };

    const isActive = rowRecord.integration_name === 'system_config' || rowRecord.is_active !== false;
    if (!isActive) continue;

    Object.assign(merged, asRecord(rowRecord.config), asRecord(rowRecord.encrypted_credentials));
  }

  return {
    accessToken: firstNonEmpty(
      merged.meta_access_token,
      merged.facebook_access_token,
      merged.meta_token,
      merged.access_token,
    ),
    adAccountId: firstNonEmpty(
      merged.meta_ad_account_id,
      merged.facebook_ad_account_id,
      merged.ad_account_id,
    ),
    pageId: firstNonEmpty(merged.meta_page_id, merged.facebook_page_id, merged.page_id),
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
  };
}

async function resolveMetaConfig(
  supabase: ReturnType<typeof createServiceClient>
): Promise<Partial<MetaAdsConfig> & { source: 'env' | 'integration' | 'mixed' | 'none' }> {
  const envConfig = getMetaConfig();
  const integrationConfig = await loadMetaConfigFromIntegrations(supabase);

  const merged: Partial<MetaAdsConfig> = {
    accessToken: firstNonEmpty(integrationConfig.accessToken, envConfig.accessToken),
    adAccountId: firstNonEmpty(integrationConfig.adAccountId, envConfig.adAccountId),
    pageId: firstNonEmpty(integrationConfig.pageId, envConfig.pageId),
    pixelId: firstNonEmpty(integrationConfig.pixelId, envConfig.pixelId),
    pageAccessToken: firstNonEmpty(integrationConfig.pageAccessToken, envConfig.pageAccessToken),
    instagramId: firstNonEmpty(integrationConfig.instagramId, envConfig.instagramId),
  };

  const envReady = Boolean(envConfig.accessToken && envConfig.adAccountId && envConfig.pageId);
  const dbReady = Boolean(integrationConfig.accessToken && integrationConfig.adAccountId && integrationConfig.pageId);

  let source: 'env' | 'integration' | 'mixed' | 'none' = 'none';
  if (envReady && dbReady) source = 'mixed';
  else if (envReady) source = 'env';
  else if (dbReady) source = 'integration';

  return { ...merged, source };
}

async function ensureCreativesBucket(
  supabase: ReturnType<typeof createServiceClient>
): Promise<void> {
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(CREATIVE_BUCKET);

  if (bucketData) return;

  if (bucketError) {
    const bucketErrorMessage = bucketError.message.toLowerCase();
    const canCreate = bucketErrorMessage.includes('not found') || bucketErrorMessage.includes('does not exist');
    if (!canCreate) {
      logger.warn('Erro ao consultar bucket creatives', { error: bucketError.message });
    }
  }

  const { error: createError } = await supabase.storage.createBucket(CREATIVE_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
  });

  if (createError && !createError.message.toLowerCase().includes('already')) {
    throw new Error(`Falha ao criar bucket ${CREATIVE_BUCKET}: ${createError.message}`);
  }
}

function inferFileExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;

  const mime = file.type.toLowerCase();
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

async function uploadImageFiles(
  supabase: ReturnType<typeof createServiceClient>,
  files: File[]
): Promise<string[]> {
  if (!files.length) return [];

  await ensureCreativesBucket(supabase);

  const uploadedUrls: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const ext = inferFileExtension(file);
    const path = `ads-launch/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${index}-${randomUUID()}.${ext}`;

    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(CREATIVE_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro no upload da imagem ${file.name}: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from(CREATIVE_BUCKET).getPublicUrl(path);
    const publicUrl = asString(publicUrlData?.publicUrl);
    if (publicUrl) uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

function buildVariationsForImage(
  copy: GeneratedCopy | undefined,
  manualPrimaryText: string,
  manualHeadline: string,
  generateCopy: boolean
): CreativeVariation[] {
  if (!generateCopy && manualPrimaryText && manualHeadline) {
    return [{ primaryText: manualPrimaryText, headline: manualHeadline }];
  }

  const primaryTexts = (copy?.primaryText || []).map((item) => item.trim()).filter(Boolean);
  const headlines = (copy?.headlines || []).map((item) => item.trim()).filter(Boolean);

  const total = Math.min(
    MAX_VARIATIONS_PER_IMAGE,
    Math.max(primaryTexts.length, headlines.length, manualPrimaryText || manualHeadline ? 1 : 0)
  );

  const variations: CreativeVariation[] = [];

  for (let index = 0; index < total; index += 1) {
    const primaryText = primaryTexts[index] || primaryTexts[0] || manualPrimaryText;
    const headline = headlines[index] || headlines[0] || manualHeadline;

    if (!primaryText || !headline) continue;
    variations.push({ primaryText, headline });
  }

  if (!variations.length && manualPrimaryText && manualHeadline) {
    return [{ primaryText: manualPrimaryText, headline: manualHeadline }];
  }

  return variations;
}

function buildObjectStorySpec(params: {
  pageId: string;
  instagramId?: string;
  linkUrl: string;
  cta: string;
  primaryText: string;
  headline: string;
  imageHash?: string;
}): {
  page_id: string;
  instagram_actor_id?: string;
  link_data: {
    message: string;
    link: string;
    name: string;
    image_hash?: string;
    call_to_action: { type: string; value: { link: string } };
  };
} {
  const spec: {
    page_id: string;
    instagram_actor_id?: string;
    link_data: {
      message: string;
      link: string;
      name: string;
      image_hash?: string;
      call_to_action: { type: string; value: { link: string } };
    };
  } = {
    page_id: params.pageId,
    link_data: {
      message: params.primaryText,
      link: params.linkUrl,
      name: params.headline,
      call_to_action: { type: params.cta, value: { link: params.linkUrl } },
    },
  };

  if (params.imageHash) spec.link_data.image_hash = params.imageHash;
  if (params.instagramId) spec.instagram_actor_id = params.instagramId;

  return spec;
}

async function createAdsForImage(params: {
  accountId: string;
  campaignName: string;
  adSetId: string;
  imageUrl: string;
  imageIndex: number;
  cta: string;
  linkUrl: string;
  pageId: string;
  instagramId?: string;
  variations: CreativeVariation[];
  metaConfigOverrides: Partial<MetaAdsConfig>;
  status: 'ACTIVE' | 'PAUSED';
}): Promise<{ results: CreativeLaunchResult[]; errors: string[] }> {
  const results: CreativeLaunchResult[] = [];
  const errors: string[] = [];

  let imageHash = '';
  try {
    imageHash = await uploadImageToMeta(params.imageUrl, params.accountId, params.metaConfigOverrides);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida no upload para Meta';
    errors.push(`Imagem ${params.imageIndex + 1}: ${message}`);
    return { results, errors };
  }

  for (let variationIndex = 0; variationIndex < params.variations.length; variationIndex += 1) {
    const variation = params.variations[variationIndex];
    const generatedName = `${params.campaignName} - Img${params.imageIndex + 1}-Var${variationIndex + 1}`;

    try {
      const creative = await createAdCreative(
        params.accountId,
        {
          name: `${generatedName} - Creative`,
          object_story_spec: buildObjectStorySpec({
            pageId: params.pageId,
            instagramId: params.instagramId,
            linkUrl: params.linkUrl,
            cta: params.cta,
            primaryText: variation.primaryText,
            headline: variation.headline,
            imageHash,
          }),
        },
        params.metaConfigOverrides
      );

      const ad = await createAd(
        params.accountId,
        {
          name: `${generatedName} - Ad`,
          adset_id: params.adSetId,
          creative: { creative_id: creative.id },
          status: params.status,
        },
        params.metaConfigOverrides
      );

      results.push({
        imageUrl: params.imageUrl,
        primaryText: variation.primaryText,
        headline: variation.headline,
        creativeId: creative.id,
        adId: ad.id,
        generatedName,
        metadata: {
          imageIndex: params.imageIndex,
          variationIndex,
          hasImageHash: true,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida ao criar creative/ad';
      errors.push(`Imagem ${params.imageIndex + 1}, variação ${variationIndex + 1}: ${message}`);
    }
  }

  return { results, errors };
}

async function createAdsWithoutImage(params: {
  accountId: string;
  campaignName: string;
  adSetId: string;
  cta: string;
  linkUrl: string;
  pageId: string;
  instagramId?: string;
  variations: CreativeVariation[];
  metaConfigOverrides: Partial<MetaAdsConfig>;
  status: 'ACTIVE' | 'PAUSED';
}): Promise<{ results: CreativeLaunchResult[]; errors: string[] }> {
  const results: CreativeLaunchResult[] = [];
  const errors: string[] = [];

  for (let variationIndex = 0; variationIndex < params.variations.length; variationIndex += 1) {
    const variation = params.variations[variationIndex];
    const generatedName = `${params.campaignName} - Var${variationIndex + 1}`;

    try {
      const creative = await createAdCreative(
        params.accountId,
        {
          name: `${generatedName} - Creative`,
          object_story_spec: buildObjectStorySpec({
            pageId: params.pageId,
            instagramId: params.instagramId,
            linkUrl: params.linkUrl,
            cta: params.cta,
            primaryText: variation.primaryText,
            headline: variation.headline,
          }),
        },
        params.metaConfigOverrides
      );

      const ad = await createAd(
        params.accountId,
        {
          name: `${generatedName} - Ad`,
          adset_id: params.adSetId,
          creative: { creative_id: creative.id },
          status: params.status,
        },
        params.metaConfigOverrides
      );

      results.push({
        imageUrl: '',
        primaryText: variation.primaryText,
        headline: variation.headline,
        creativeId: creative.id,
        adId: ad.id,
        generatedName,
        metadata: {
          imageIndex: -1,
          variationIndex,
          hasImageHash: false,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida ao criar creative/ad';
      errors.push(`Variação ${variationIndex + 1}: ${message}`);
    }
  }

  return { results, errors };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await parseLaunchPayload(request);

    if (!payload.name || !payload.dailyBudget || !payload.linkUrl) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, dailyBudget, linkUrl' },
        { status: 400 }
      );
    }

    const dailyBudgetCents = normalizeDailyBudgetCents(payload.dailyBudget);
    if (!dailyBudgetCents) {
      return NextResponse.json({ error: 'dailyBudget inválido' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const resolvedMetaConfig = await resolveMetaConfig(supabase);

    if (!isMetaConfigured(resolvedMetaConfig)) {
      return NextResponse.json(
        {
          error: 'Meta Ads não configurado. Defina Access Token, Ad Account ID e Page ID em Configurações > APIs.',
          missing: {
            accessToken: !resolvedMetaConfig.accessToken,
            adAccountId: !resolvedMetaConfig.adAccountId,
            pageId: !resolvedMetaConfig.pageId,
          },
        },
        { status: 503 }
      );
    }

    const requiredAdAccountId = normalizeAdAccountId(process.env.META_REQUIRED_AD_ACCOUNT_ID || '');
    const activeAdAccountId = normalizeAdAccountId(resolvedMetaConfig.adAccountId || '');
    if (requiredAdAccountId && requiredAdAccountId !== activeAdAccountId) {
      return NextResponse.json(
        {
          error: 'Conta Meta ativa não corresponde ao account obrigatório do ambiente',
          expectedAdAccountId: requiredAdAccountId,
          activeAdAccountId,
        },
        { status: 412 }
      );
    }

    const accountId = normalizeAdAccountId(resolvedMetaConfig.adAccountId || '');
    const objective = payload.objective || 'CONVERSAO';
    const funnelStage = payload.funnelStage || 'TOPO';
    const audience = payload.audience || 'Empresas PME';
    const status = payload.status || 'PAUSED';

    if (!payload.generateCopy && (!payload.primaryText || !payload.headline)) {
      return NextResponse.json(
        { error: 'Forneça primaryText/headline ou ative generateCopy' },
        { status: 400 }
      );
    }

    const uploadedImageUrls = await uploadImageFiles(supabase, payload.imageFiles);
    const allImageUrls = uniqueStrings([
      ...uploadedImageUrls,
      ...payload.imageUrls,
      payload.imageUrl,
    ]).slice(0, MAX_IMAGES);

    let generatedCopies: GeneratedCopy[] = [];
    if (allImageUrls.length > 0) {
      if (payload.generateCopy || !payload.primaryText || !payload.headline) {
        generatedCopies = await generateCopiesForImages(allImageUrls, objective, audience);
      } else {
        generatedCopies = allImageUrls.map((url) => ({
          imageUrl: url,
          primaryText: [payload.primaryText],
          headlines: [payload.headline],
          metadata: { analysisType: 'manual' },
        }));
      }
    } else if (payload.generateCopy || !payload.primaryText || !payload.headline) {
      generatedCopies = [await generateAdCopy(objective, audience)];
    }

    const fallbackPrimaryText = payload.primaryText || generatedCopies[0]?.primaryText?.[0] || '';
    const fallbackHeadline = payload.headline || generatedCopies[0]?.headlines?.[0] || '';

    if (!fallbackPrimaryText || !fallbackHeadline) {
      return NextResponse.json(
        { error: 'Não foi possível obter copy válida para criação dos anúncios.' },
        { status: 422 }
      );
    }

    const optConfig = getOptimizationConfig(objective, funnelStage);
    const campaignObjective = optConfig.campaignObjective as MetaCampaignObjective;
    const cta = getRecommendedCTA(objective);

    const campaignName = `[HSA] ${payload.name} - ${funnelStage}`;

    const campaignResult = await createCampaign(
      accountId,
      {
        name: campaignName,
        objective: campaignObjective,
        status,
        special_ad_categories: [],
      },
      resolvedMetaConfig
    );

    if (!campaignResult?.id) {
      return NextResponse.json({ error: 'Falha ao criar campanha na Meta' }, { status: 502 });
    }

    const strategy = getFunnelStrategy(funnelStage, objective);
    let targeting = strategy
      ? buildStrategyTargeting(strategy)
      : buildTargeting(audience);

    if (payload.customAudienceIds.length) {
      targeting = {
        ...targeting,
        custom_audiences: payload.customAudienceIds.map((id) => ({ id })),
      };
    }

    if (payload.excludedAudienceIds.length) {
      targeting = {
        ...targeting,
        excluded_custom_audiences: payload.excludedAudienceIds.map((id) => ({ id })),
      };
    }

    const adjustedBudget = strategy
      ? calculateAdjustedBudget(dailyBudgetCents, strategy)
      : dailyBudgetCents;

    const adSetResult = await createAdSet(
      accountId,
      {
        name: `${campaignName} - AdSet`,
        campaign_id: campaignResult.id,
        daily_budget: adjustedBudget,
        targeting,
        optimization_goal: optConfig.optimizationGoal,
        billing_event: optConfig.billingEvent,
        status,
        ...(optConfig.requiresPixel && resolvedMetaConfig.pixelId
          ? {
              pixel_id: resolvedMetaConfig.pixelId,
              custom_event_type: optConfig.customEventType || 'PURCHASE',
            }
          : {}),
      },
      resolvedMetaConfig
    );

    if (!adSetResult?.id) {
      return NextResponse.json(
        { error: 'Falha ao criar AdSet', campaignId: campaignResult.id, partial: true },
        { status: 502 }
      );
    }

    const creativeResults: CreativeLaunchResult[] = [];
    const creationErrors: string[] = [];

    if (allImageUrls.length > 0) {
      for (let imageIndex = 0; imageIndex < allImageUrls.length; imageIndex += 1) {
        const imageUrl = allImageUrls[imageIndex];
        const variations = buildVariationsForImage(
          generatedCopies[imageIndex],
          fallbackPrimaryText,
          fallbackHeadline,
          payload.generateCopy
        );

        if (!variations.length) {
          creationErrors.push(`Imagem ${imageIndex + 1}: sem variações de copy válidas.`);
          continue;
        }

        const imageResult = await createAdsForImage({
          accountId,
          campaignName,
          adSetId: adSetResult.id,
          imageUrl,
          imageIndex,
          cta,
          linkUrl: payload.linkUrl,
          pageId: resolvedMetaConfig.pageId || '',
          instagramId: resolvedMetaConfig.instagramId,
          variations,
          metaConfigOverrides: resolvedMetaConfig,
          status,
        });

        creativeResults.push(...imageResult.results);
        creationErrors.push(...imageResult.errors);
      }
    } else {
      const noImageVariations = buildVariationsForImage(
        generatedCopies[0],
        fallbackPrimaryText,
        fallbackHeadline,
        payload.generateCopy
      );

      const noImageResult = await createAdsWithoutImage({
        accountId,
        campaignName,
        adSetId: adSetResult.id,
        cta,
        linkUrl: payload.linkUrl,
        pageId: resolvedMetaConfig.pageId || '',
        instagramId: resolvedMetaConfig.instagramId,
        variations: noImageVariations,
        metaConfigOverrides: resolvedMetaConfig,
        status,
      });

      creativeResults.push(...noImageResult.results);
      creationErrors.push(...noImageResult.errors);
    }

    if (!creativeResults.length) {
      return NextResponse.json(
        {
          error: 'Nenhum anúncio foi criado. Verifique permissões da conta Meta e criativos enviados.',
          campaignId: campaignResult.id,
          adSetId: adSetResult.id,
          partial: true,
          details: creationErrors,
        },
        { status: 502 }
      );
    }

    const adCreativeIds = creativeResults.map((item) => item.creativeId);
    const adIds = creativeResults.map((item) => item.adId);

    let campaignLogId: string | null = null;

    try {
      const { data: campaignLogData, error: campaignLogError } = await supabase
        .from('ads_campaigns_log')
        .insert({
          campaign_id: campaignResult.id,
          campaign_name: campaignName,
          campaign_status: status,
          funnel_stage: funnelStage,
          adset_id: adSetResult.id,
          ad_ids: adIds,
          objective,
          daily_budget: Number((adjustedBudget / 100).toFixed(2)),
          target_audience: audience,
          images_count: allImageUrls.length,
          link_url: payload.linkUrl,
          image_urls: allImageUrls,
          generated_copies: generatedCopies,
          status: creationErrors.length > 0 ? 'error' : 'success',
          error_message: creationErrors.length > 0 ? creationErrors.join(' | ') : null,
          metadata: {
            source: resolvedMetaConfig.source,
            ad_creative_ids: adCreativeIds,
            uploaded_images: uploadedImageUrls.length,
            total_ads_created: adIds.length,
            total_creatives_created: adCreativeIds.length,
            generate_copy: payload.generateCopy,
          },
        })
        .select('id')
        .maybeSingle();

      if (campaignLogError) {
        logger.warn('Falha ao salvar ads_campaigns_log', { error: campaignLogError.message });
      }

      campaignLogId = campaignLogData?.id || null;
    } catch (error) {
      logger.warn('Falha inesperada ao salvar log de campanha', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (campaignLogId) {
      try {
        const creativeRows = creativeResults.map((item) => ({
          campaign_log_id: campaignLogId,
          image_url: item.imageUrl || 'no-image',
          primary_texts: [item.primaryText],
          headlines: [item.headline],
          ad_creative_id: item.creativeId,
          ad_id: item.adId,
          generated_name: item.generatedName,
          analysis_metadata: item.metadata,
        }));

        if (creativeRows.length) {
          const { error: creativesError } = await supabase
            .from('ads_creatives_generated')
            .insert(creativeRows);

          if (creativesError) {
            logger.warn('Falha ao salvar ads_creatives_generated', { error: creativesError.message });
          }
        }
      } catch (error) {
        logger.warn('Falha inesperada ao salvar logs de criativos', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      partial: creationErrors.length > 0,
      warnings: creationErrors,
      data: {
        campaignId: campaignResult.id,
        adSetId: adSetResult.id,
        creativeId: adCreativeIds[0] || null,
        adId: adIds[0] || null,
        adCreativeIds,
        adIds,
        campaignName,
        objective: campaignObjective,
        funnelStage,
        dailyBudget: `R$${(adjustedBudget / 100).toFixed(2)}`,
        status,
        copy: {
          primaryText: fallbackPrimaryText,
          headline: fallbackHeadline,
          description: payload.description,
        },
        cta,
        imagesProcessed: allImageUrls.length,
        variationsCreated: creativeResults.length,
      },
    });
  } catch (error) {
    logger.error('❌ Erro no launch:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
