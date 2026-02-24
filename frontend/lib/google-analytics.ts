// =====================================================
// GOOGLE ANALYTICS 4 — Biblioteca Completa
// Blueprint 12 — Humano Saúde
// 14 funções GA4 (Reports + Realtime + Outbound + Video)
// =====================================================

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GA4Row = any;

// =====================================================
// CONFIGURAÇÃO & AUTENTICAÇÃO
// =====================================================

const GA4_CACHE_TTL_MS = 60 * 1000;
let cachedGA4PropertyId: string | null | undefined;
let cachedGA4PropertyAt = 0;
let cachedGA4MeasurementHint: string | null | undefined;
let cachedGA4MeasurementAt = 0;

export function clearGA4AvailabilityCache(): void {
  cachedGA4PropertyId = undefined;
  cachedGA4PropertyAt = 0;
  cachedGA4MeasurementHint = undefined;
  cachedGA4MeasurementAt = 0;
}

function parseCredentialJson(raw: string, source: string): { client_email?: string; private_key?: string } | null {
  const value = raw.trim();
  if (!value) return null;

  const parseObject = (content: string) => {
    const parsed = JSON.parse(content);
    if (parsed.private_key?.includes('\\n')) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed as { client_email?: string; private_key?: string };
  };

  try {
    return parseObject(value);
  } catch {
    try {
      // Alguns ambientes salvam JSON em base64.
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      return parseObject(decoded);
    } catch {
      logger.error(`❌ Erro ao parsear ${source}`);
      return null;
    }
  }
}

function getCredentials(): { client_email?: string; private_key?: string } | null {
  // Método 1: JSON completo (recomendado para Vercel)
  const jsonCandidates = [
    { key: 'GOOGLE_APPLICATION_CREDENTIALS_JSON', value: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON },
    { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', value: process.env.GOOGLE_SERVICE_ACCOUNT_JSON },
    { key: 'GOOGLE_CREDENTIALS_JSON', value: process.env.GOOGLE_CREDENTIALS_JSON },
  ];

  for (const candidate of jsonCandidates) {
    if (!candidate.value) continue;
    const creds = parseCredentialJson(candidate.value, candidate.key);
    if (creds) return creds;
  }

  // Método 2: Variáveis separadas
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim() || process.env.GCP_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY ?? process.env.GCP_PRIVATE_KEY;
  const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');
  if (clientEmail && privateKey) {
    return { client_email: clientEmail, private_key: privateKey };
  }

  return null;
}

function extractPropertyId(config?: Record<string, unknown> | null): string | null {
  if (!config) return null;
  const explicitPropertyId =
    toPropertyId(config.ga4_property_id) ||
    toPropertyId(config.google_analytics_property_id) ||
    toPropertyId(config.ga4PropertyId) ||
    toPropertyId(config.googleAnalyticsPropertyId) ||
    null;

  if (explicitPropertyId) return explicitPropertyId;

  // Campo legado que em projetos antigos era usado de forma ambígua.
  return toPropertyId(config.google_analytics_id) || null;
}

function extractMeasurementId(config?: Record<string, unknown> | null): string | null {
  if (!config) return null;
  const explicitMeasurementId =
    toMeasurementId(config.ga_measurement_id) ||
    toMeasurementId(config.ga4_measurement_id) ||
    toMeasurementId(config.google_analytics_measurement_id) ||
    toMeasurementId(config.gaMeasurementId) ||
    toMeasurementId(config.ga4MeasurementId) ||
    toMeasurementId(config.googleAnalyticsMeasurementId) ||
    null;

  if (explicitMeasurementId) return explicitMeasurementId;

  // Campo legado que em projetos antigos era usado de forma ambígua.
  return toMeasurementId(config.google_analytics_id) || null;
}

function resolvePropertyIdFromEnv(): string | null {
  const envCandidates = [
    process.env.GA4_PROPERTY_ID,
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
    process.env.GA_PROPERTY_ID,
    process.env.NEXT_PUBLIC_GA4_PROPERTY_ID,
    process.env.NEXT_PUBLIC_GA_PROPERTY_ID,
  ];

  for (const candidate of envCandidates) {
    const normalized = toPropertyId(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function resolveMeasurementIdFromEnv(): string | null {
  const envCandidates = [
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    process.env.GA_MEASUREMENT_ID,
    process.env.GA4_MEASUREMENT_ID,
    process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID,
  ];

  for (const candidate of envCandidates) {
    const normalized = toMeasurementId(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function toPropertyId(candidate: unknown): string | null {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return `${Math.trunc(candidate)}`;
  }
  if (typeof candidate !== 'string') return null;
  const cleaned = candidate.trim();
  if (!cleaned) return null;

  if (cleaned.startsWith('properties/')) {
    const onlyId = cleaned.slice('properties/'.length).trim();
    return /^\d+$/.test(onlyId) ? onlyId : null;
  }

  return /^\d+$/.test(cleaned) ? cleaned : null;
}

function toMeasurementId(candidate: unknown): string | null {
  if (typeof candidate !== 'string') return null;
  const cleaned = candidate.trim().toUpperCase();
  if (!cleaned) return null;
  return /^G-[A-Z0-9]+$/.test(cleaned) ? cleaned : null;
}

function extractPropertyIdFromRow(row: Record<string, unknown>): string | null {
  return (
    toPropertyId(row.ga4_property_id) ||
    toPropertyId(row.google_analytics_property_id) ||
    extractPropertyId((row.config as Record<string, unknown> | null | undefined) ?? null) ||
    extractPropertyId((row.encrypted_credentials as Record<string, unknown> | null | undefined) ?? null) ||
    null
  );
}

function extractMeasurementFromRow(row: Record<string, unknown>): string | null {
  return (
    toMeasurementId(row.ga_measurement_id) ||
    toMeasurementId(row.ga4_measurement_id) ||
    toMeasurementId(row.google_analytics_measurement_id) ||
    toMeasurementId(row.google_analytics_id) ||
    extractMeasurementId((row.config as Record<string, unknown> | null | undefined) ?? null) ||
    extractMeasurementId((row.encrypted_credentials as Record<string, unknown> | null | undefined) ?? null) ||
    null
  );
}

type SettingsResolution = { propertyId: string | null; measurementId: string | null };

async function resolveFromIntegrationSettings(): Promise<SettingsResolution> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('integration_settings')
    .select('*')
    .limit(50);

  if (error || !Array.isArray(data)) {
    return { propertyId: null, measurementId: null };
  }

  let propertyId: string | null = null;
  let measurementId: string | null = null;

  for (const rawRow of data) {
    const row = rawRow as Record<string, unknown>;
    if (!propertyId) propertyId = extractPropertyIdFromRow(row);
    if (!measurementId) measurementId = extractMeasurementFromRow(row);
    if (propertyId && measurementId) break;
  }

  return { propertyId, measurementId };
}

export type GA4AvailabilityDiagnostics = {
  available: boolean;
  hasPropertyId: boolean;
  hasCredentials: boolean;
  missing: string[];
  propertyId?: string | null;
  measurementIdHint?: string | null;
};

export async function getGA4AvailabilityDiagnostics(): Promise<GA4AvailabilityDiagnostics> {
  const propertyId = await resolveGA4PropertyId();
  const measurementHint = await resolveGA4MeasurementHint();
  const creds = getCredentials();

  const hasPropertyId = !!propertyId;
  const hasCredentials = !!creds;
  const missing: string[] = [];

  if (!hasPropertyId) {
    if (measurementHint) {
      missing.push(
        `Measurement ID detectado (${measurementHint}). Para a API do GA4 é obrigatório o Property ID numérico (ex.: 123456789).`
      );
    } else {
      missing.push(
        'Defina GA4_PROPERTY_ID numérico (ex.: 123456789), ou salve ga4_property_id numérico em integration_settings.'
      );
    }
  }
  if (!hasCredentials) {
    missing.push(
      'Defina GOOGLE_APPLICATION_CREDENTIALS_JSON ou GOOGLE_SERVICE_ACCOUNT_JSON, ou GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.'
    );
  }

  return {
    available: hasPropertyId && hasCredentials,
    hasPropertyId,
    hasCredentials,
    missing,
    propertyId,
    measurementIdHint: measurementHint,
  };
}

export async function isGA4Available(): Promise<boolean> {
  const diagnostics = await getGA4AvailabilityDiagnostics();
  return diagnostics.available;
}

async function resolveGA4PropertyId(): Promise<string | null> {
  const fromEnv = resolvePropertyIdFromEnv();
  if (fromEnv) return fromEnv;

  const now = Date.now();
  if (cachedGA4PropertyId !== undefined && now - cachedGA4PropertyAt < GA4_CACHE_TTL_MS) {
    return cachedGA4PropertyId;
  }

  let resolved: string | null = null;
  try {
    const settings = await resolveFromIntegrationSettings();
    resolved = settings.propertyId;
  } catch (error) {
    logger.warn('⚠️ Falha ao resolver GA4_PROPERTY_ID via integration_settings', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  cachedGA4PropertyId = resolved;
  cachedGA4PropertyAt = now;
  return resolved;
}

async function resolveGA4MeasurementHint(): Promise<string | null> {
  const fromEnv = resolveMeasurementIdFromEnv();
  if (fromEnv) return fromEnv;

  const now = Date.now();
  if (cachedGA4MeasurementHint !== undefined && now - cachedGA4MeasurementAt < GA4_CACHE_TTL_MS) {
    return cachedGA4MeasurementHint;
  }

  let resolved: string | null = null;
  try {
    const settings = await resolveFromIntegrationSettings();
    resolved = settings.measurementId;
  } catch (error) {
    logger.warn('⚠️ Falha ao resolver Measurement ID via integration_settings', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  cachedGA4MeasurementHint = resolved;
  cachedGA4MeasurementAt = now;
  return resolved;
}

async function getClientAndProperty(): Promise<{ client: BetaAnalyticsDataClient; property: string } | null> {
  const creds = getCredentials();
  const propertyId = await resolveGA4PropertyId();
  if (!creds || !propertyId) return null;

  try {
    const client = new BetaAnalyticsDataClient({
      credentials: creds,
      projectId: process.env.GOOGLE_PROJECT_ID,
    });
    return { client, property: `properties/${propertyId}` };
  } catch (error) {
    logger.error('❌ Erro ao criar GA4 client:', error);
    return null;
  }
}

// =====================================================
// HELPERS
// =====================================================

function formatGA4Date(dateStr: string): string {
  if (dateStr.length === 8) {
    const day = dateStr.slice(6, 8);
    const month = dateStr.slice(4, 6);
    return `${day}/${month}`;
  }
  return dateStr;
}

function normalizeDate(input: string | null): string | null {
  if (!input) return null;
  // Accept ISO or "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
  return input;
}

type DateRangeInput = { startDate: string; endDate: string };
function buildDateRanges(start: string | null, end: string | null, defaultRange: string = '7daysAgo'): DateRangeInput[] {
  if (start && end) return [{ startDate: start, endDate: end }];
  return [{ startDate: defaultRange, endDate: 'today' }];
}

const SOURCE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

// =====================================================
// 1. getKPIs — Totais gerais
// =====================================================

export async function getKPIs(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return null;
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'eventCount' },
      { name: 'sessions' },
    ],
  });

  const row = response.rows?.[0];
  return {
    totalUsers: parseInt(row?.metricValues?.[0]?.value ?? '0'),
    totalViews: parseInt(row?.metricValues?.[1]?.value ?? '0'),
    totalEvents: parseInt(row?.metricValues?.[2]?.value ?? '0'),
    totalSessions: parseInt(row?.metricValues?.[3]?.value ?? '0'),
  };
}

// =====================================================
// 2. getTrafficData — Tráfego diário (para gráfico)
// =====================================================

export async function getTrafficData(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return [];
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
  });

  return (response.rows || []).map((row: GA4Row) => ({
    date: formatGA4Date(row.dimensionValues?.[0]?.value ?? ''),
    usuarios: parseInt(row.metricValues?.[0]?.value ?? '0'),
    visualizacoes: parseInt(row.metricValues?.[1]?.value ?? '0'),
  }));
}

// =====================================================
// 3. getTrafficSources — Fontes de tráfego (6 cores)
// =====================================================

export async function getTrafficSources(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return [];
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 6,
  });

  return (response.rows || []).map((row: GA4Row, i: number) => ({
    source: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));
}

// =====================================================
// 4. getTopPages — Top 10 páginas
// =====================================================

export async function getTopPages(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return [];
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });

  return (response.rows || []).map((row: GA4Row) => ({
    title: row.dimensionValues?.[0]?.value ?? 'Sem título',
    views: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));
}

// =====================================================
// 5. getTopCountries — Top 5 países
// =====================================================

export async function getTopCountries(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return [];
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 5,
  });

  return (response.rows || [])
    .map((row: GA4Row) => ({
      country: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    }))
    .filter((c: { country: string }) => c.country !== '(not set)');
}

// =====================================================
// 6. getTopCities — Top 10 cidades
// =====================================================

export async function getTopCities(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return [];
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'city' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 12,
  });

  return (response.rows || [])
    .map((row: GA4Row) => ({
      city: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    }))
    .filter((c: { city: string }) => c.city !== '(not set)')
    .slice(0, 10);
}

// =====================================================
// 7. getDevices — desktop/mobile/tablet
// =====================================================

export async function getDevices(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return [];
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  });

  return (response.rows || []).map((row: GA4Row) => ({
    device: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));
}

// =====================================================
// 8. getBrowsers — Chrome, Safari, etc.
// =====================================================

export async function getBrowsers(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return [];
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'browser' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 6,
  });

  return (response.rows || []).map((row: GA4Row) => ({
    browser: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));
}

// =====================================================
// 9. getAgeGroups — Faixas etárias
// =====================================================

export async function getAgeGroups(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return [];
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'userAgeBracket' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'userAgeBracket' }, desc: false }],
  });

  return (response.rows || [])
    .map((row: GA4Row) => ({
      age: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    }))
    .filter((a: { age: string }) => a.age !== '(not set)');
}

// =====================================================
// 10. getRealtimeData — Usuários ativos agora
// Total sem dimensões para não inflar (somar por página contava 2x o mesmo usuário)
// =====================================================

export async function getRealtimeData() {
  const ga4 = await getClientAndProperty();
  if (!ga4) return null;
  const { client, property } = ga4;

  const [totalTuple, pagesTuple] = await Promise.all([
    client.runRealtimeReport({
      property,
      metrics: [{ name: 'activeUsers' }],
    }),
    client.runRealtimeReport({
      property,
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 10,
    }),
  ]);
  const totalRes = Array.isArray(totalTuple) ? totalTuple[0] : totalTuple;
  const pagesRes = Array.isArray(pagesTuple) ? pagesTuple[0] : pagesTuple;

  const totalRows = totalRes.rows || [];
  const totalActive =
    totalRows.length > 0
      ? parseInt(totalRows[0].metricValues?.[0]?.value ?? '0')
      : 0;

  const pagesRows = pagesRes.rows || [];
  const pages = pagesRows.map((row: GA4Row) => ({
    page: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));

  return {
    activeUsers: totalActive,
    pages,
  };
}

// =====================================================
// 11. getRealtimeDetailed — Realtime com cidade + device + country
// =====================================================

export async function getRealtimeDetailed() {
  const ga4 = await getClientAndProperty();
  if (!ga4) return null;
  const { client, property } = ga4;

  const [citiesRes, devicesRes, countriesRes] = await Promise.all([
    client.runRealtimeReport({
      property,
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 10,
    }),
    client.runRealtimeReport({
      property,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    }),
    client.runRealtimeReport({
      property,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 5,
    }),
  ]);

  const cities = (citiesRes[0].rows || [])
    .map((row: GA4Row) => ({
      city: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    }))
    .filter((c: { city: string }) => c.city !== '(not set)');

  const devices = (devicesRes[0].rows || []).map((row: GA4Row) => ({
    device: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));

  const countries = (countriesRes[0].rows || []).map((row: GA4Row) => ({
    country: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));

  const totalActive = cities.reduce((s: number, c: { users: number }) => s + c.users, 0) ||
    devices.reduce((s: number, d: { users: number }) => s + d.users, 0);

  return { activeUsers: totalActive, cities, devices, countries };
}

// =====================================================
// 12. getOutboundClicks — Links de saída
// =====================================================

export async function getOutboundClicks(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return null;
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null, '30daysAgo');

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'linkUrl' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: 'click', matchType: 'EXACT' as const },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 50,
  });

  const summary = { whatsapp: 0, appstore: 0, playstore: 0, external: 0, total: 0 };

  const clicks = (response.rows || [])
    .map((row: GA4Row) => {
      const url = (row.dimensionValues?.[0]?.value ?? '').toLowerCase();
      const count = parseInt(row.metricValues?.[0]?.value ?? '0');

      let category: 'whatsapp' | 'appstore' | 'playstore' | 'external' = 'external';
      if (url.includes('wa.me') || url.includes('whatsapp')) category = 'whatsapp';
      else if (url.includes('apps.apple.com')) category = 'appstore';
      else if (url.includes('play.google.com')) category = 'playstore';

      summary[category] += count;
      summary.total += count;

      return {
        url: row.dimensionValues?.[0]?.value ?? '',
        clicks: count,
        category,
      };
    })
    .filter((c: { url: string }) => {
      const u = c.url.toLowerCase();
      return !u.includes(process.env.NEXT_PUBLIC_SITE_URL || 'humanosaude.com');
    });

  return { clicks, summary };
}

// =====================================================
// 13. getVideoEvents — Eventos de vídeo
// =====================================================

export async function getVideoEvents(start?: string | null, end?: string | null) {
  const ga4 = await getClientAndProperty();
  if (!ga4) return null;
  const { client, property } = ga4;

  const dateRanges = buildDateRanges(start ?? null, end ?? null, '30daysAgo');

  const [response] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: 'video', matchType: 'BEGINS_WITH' as const },
      },
    },
  });

  let videoStart = 0;
  let videoProgress = 0;
  let videoComplete = 0;

  (response.rows || []).forEach((row: GA4Row) => {
    const event = row.dimensionValues?.[0]?.value ?? '';
    const count = parseInt(row.metricValues?.[0]?.value ?? '0');
    if (event === 'video_start') videoStart += count;
    else if (event === 'video_progress') videoProgress += count;
    else if (event === 'video_complete') videoComplete += count;
  });

  return { videoStart, videoProgress, videoComplete };
}

// =====================================================
// EXPORT — normalizeDate para uso nos endpoints
// =====================================================

export { normalizeDate };
