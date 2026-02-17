import { logger } from '@/lib/logger';
import { chunkArray, validateLookalikeRatio } from './utils';
import type {
  CreateCustomAudienceInput,
  CreateLookalikeInput,
  HashedUserData,
  MetaAudienceSummary,
} from './types';

const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface AudienceCredentials {
  accessToken: string;
  adAccountId: string;
  pixelId: string;
  businessId: string;
}

let runtimeAudienceCredentials: Partial<AudienceCredentials> = {};

export function setAudienceCredentialsOverride(overrides?: Partial<AudienceCredentials>): void {
  runtimeAudienceCredentials = { ...(overrides || {}) };
}

export function clearAudienceCredentialsOverride(): void {
  runtimeAudienceCredentials = {};
}

export function getAudienceCredentials(): AudienceCredentials {
  const accessToken =
    runtimeAudienceCredentials.accessToken ||
    process.env.META_ACCESS_TOKEN ||
    process.env.FACEBOOK_ACCESS_TOKEN ||
    '';
  const adAccountRaw =
    runtimeAudienceCredentials.adAccountId ||
    process.env.META_AD_ACCOUNT_ID ||
    process.env.FACEBOOK_AD_ACCOUNT_ID ||
    '';
  const adAccountId = adAccountRaw.replace(/^act_/, '');
  const pixelId =
    runtimeAudienceCredentials.pixelId ||
    process.env.META_PIXEL_ID ||
    process.env.FACEBOOK_PIXEL_ID ||
    '';
  const businessId =
    runtimeAudienceCredentials.businessId ||
    process.env.META_BUSINESS_ID ||
    '';
  return { accessToken, adAccountId, pixelId, businessId };
}

export function isAudienceApiConfigured(): boolean {
  const creds = getAudienceCredentials();
  return !!(creds.accessToken && creds.adAccountId);
}

async function metaGet<T>(path: string): Promise<T> {
  const { accessToken } = getAudienceCredentials();
  if (!accessToken) throw new Error('META_ACCESS_TOKEN não configurado');
  const separator = path.includes('?') ? '&' : '?';
  const url = `${META_BASE_URL}${path}${separator}access_token=${accessToken}`;
  const response = await fetch(url);
  const data = (await response.json()) as { error?: { message?: string } } & T;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Erro Meta GET ${path}`);
  }

  return data;
}

async function metaPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { accessToken } = getAudienceCredentials();
  if (!accessToken) throw new Error('META_ACCESS_TOKEN não configurado');

  const response = await fetch(`${META_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: accessToken }),
  });
  const data = (await response.json()) as { error?: { message?: string } } & T;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Erro Meta POST ${path}`);
  }

  return data;
}

async function metaDelete(path: string): Promise<void> {
  const { accessToken } = getAudienceCredentials();
  if (!accessToken) throw new Error('META_ACCESS_TOKEN não configurado');

  const response = await fetch(`${META_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });

  const data = (await response.json()) as { error?: { message?: string } };
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Erro Meta DELETE ${path}`);
  }
}

export async function listMetaAudiences(): Promise<MetaAudienceSummary[]> {
  const { adAccountId } = getAudienceCredentials();
  if (!adAccountId) return [];

  const data = await metaGet<{
    data?: Array<{
      id: string;
      name: string;
      subtype?: string;
      approximate_count_lower_bound?: number;
      approximate_count_upper_bound?: number;
      operation_status?: { code?: string };
      delivery_status?: { description?: string };
    }>;
  }>(
    `/act_${adAccountId}/customaudiences?fields=id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,operation_status,delivery_status&limit=300`
  );

  return (data.data || []).map((item) => ({
    id: item.id,
    name: item.name,
    subtype: item.subtype || 'unknown',
    approximate_count:
      Number(item.approximate_count_upper_bound || item.approximate_count_lower_bound || 0),
    status: item.operation_status?.code || item.delivery_status?.description || 'unknown',
  }));
}

export async function createMetaCustomAudience(input: CreateCustomAudienceInput): Promise<{ id: string; name: string }> {
  const { adAccountId, pixelId } = getAudienceCredentials();
  if (!adAccountId) throw new Error('META_AD_ACCOUNT_ID não configurado');

  const subtype = input.subtype === 'website' ? 'WEBSITE' : 'CUSTOM';

  const body: Record<string, unknown> = {
    name: input.name,
    description: input.description || '',
    subtype,
    customer_file_source: input.customer_file_source || 'USER_PROVIDED_ONLY',
  };

  if (subtype === 'WEBSITE') {
    if (!pixelId) throw new Error('META_PIXEL_ID não configurado para Website Audience');
    body.rule =
      input.rule ||
      {
        inclusions: {
          operator: 'or',
          rules: [
            {
              event_sources: [{ id: pixelId, type: 'pixel' }],
              retention_seconds: Math.max(1, input.retention_days || 30) * 86400,
            },
          ],
        },
      };
    body.prefill = input.prefill ?? true;
  } else if (input.rule) {
    body.rule = input.rule;
  }

  return metaPost<{ id: string }>(`/act_${adAccountId}/customaudiences`, body).then((res) => ({
    id: res.id,
    name: input.name,
  }));
}

export async function updateMetaAudience(
  metaAudienceId: string,
  patch: { name?: string; description?: string }
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.name) body.name = patch.name;
  if (patch.description !== undefined) body.description = patch.description;
  if (Object.keys(body).length === 0) return;
  await metaPost(`/${metaAudienceId}`, body);
}

export async function createMetaLookalikeAudience(input: CreateLookalikeInput): Promise<{ id: string; name: string }> {
  const { adAccountId } = getAudienceCredentials();
  if (!adAccountId) throw new Error('META_AD_ACCOUNT_ID não configurado');
  if (!validateLookalikeRatio(input.ratio)) {
    throw new Error('ratio inválido. Use valores entre 0.01 e 0.10');
  }

  const name = input.name || `LAL ${(input.ratio * 100).toFixed(0)}% - ${input.country.toUpperCase()}`;
  const lookalikeSpec: Record<string, unknown> = {
    country: input.country.toUpperCase(),
    ratio: input.ratio,
    type: 'similarity',
  };

  if (input.startingRatio && validateLookalikeRatio(input.startingRatio)) {
    lookalikeSpec.starting_ratio = input.startingRatio;
  }

  const response = await metaPost<{ id: string }>(`/act_${adAccountId}/customaudiences`, {
    name,
    origin_audience_id: input.sourceAudienceId,
    lookalike_spec: JSON.stringify(lookalikeSpec),
    subtype: 'LOOKALIKE',
  });

  return { id: response.id, name };
}

export async function getMetaAudience(metaAudienceId: string): Promise<{
  id: string;
  name: string;
  subtype: string;
  approximate_count: number;
  status: string;
}> {
  const data = await metaGet<{
    id: string;
    name: string;
    subtype?: string;
    approximate_count_lower_bound?: number;
    approximate_count_upper_bound?: number;
    operation_status?: { code?: string };
    delivery_status?: { description?: string };
  }>(
    `/${metaAudienceId}?fields=id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,operation_status,delivery_status`
  );

  return {
    id: data.id,
    name: data.name,
    subtype: data.subtype || 'unknown',
    approximate_count: Number(data.approximate_count_upper_bound || data.approximate_count_lower_bound || 0),
    status: data.operation_status?.code || data.delivery_status?.description || 'unknown',
  };
}

export async function deleteMetaAudience(metaAudienceId: string): Promise<void> {
  await metaDelete(`/${metaAudienceId}`);
}

function usersToPayloadData(users: HashedUserData[], schema: ReadonlyArray<'EMAIL' | 'PHONE' | 'EXTERN_ID'>): string[][] {
  return users.map((user) =>
    schema.map((key) => {
      if (key === 'EMAIL') return user.email || '';
      if (key === 'PHONE') return user.phone || '';
      return user.external_id || '';
    })
  );
}

export async function addUsersToMetaAudience(
  metaAudienceId: string,
  users: HashedUserData[],
  schema: ReadonlyArray<'EMAIL' | 'PHONE' | 'EXTERN_ID'> = ['EMAIL', 'PHONE', 'EXTERN_ID']
): Promise<{ sessionId: string | null; numReceived: number; numInvalid: number; batches: number }> {
  const { accessToken } = getAudienceCredentials();
  if (!accessToken) throw new Error('META_ACCESS_TOKEN não configurado');
  if (!users.length) return { sessionId: null, numReceived: 0, numInvalid: 0, batches: 0 };

  const chunks = chunkArray(users, 10000);
  let totalReceived = 0;
  let totalInvalid = 0;
  let sessionId: string | null = null;

  for (const chunk of chunks) {
    const payload = {
      schema: [...schema],
      data: usersToPayloadData(chunk, schema),
    };

    const body = new URLSearchParams();
    body.set('access_token', accessToken);
    body.set('payload', JSON.stringify(payload));
    body.set('is_raw', 'false');

    const response = await fetch(`${META_BASE_URL}/${metaAudienceId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await response.json()) as {
      error?: { message?: string };
      session_id?: string;
      num_received?: number;
      num_invalid_entries?: number;
    };

    if (!response.ok || data.error) {
      logger.error('❌ Erro ao enviar lote para audience Meta', data.error?.message || 'unknown');
      throw new Error(data.error?.message || 'Falha no upload de usuários para Audience');
    }

    sessionId = data.session_id || sessionId;
    totalReceived += Number(data.num_received || 0);
    totalInvalid += Number(data.num_invalid_entries || 0);
  }

  return {
    sessionId,
    numReceived: totalReceived,
    numInvalid: totalInvalid,
    batches: chunks.length,
  };
}
