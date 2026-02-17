'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plug, CheckCircle, Globe, Zap, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getIntegrations, getSystemConfig, getWebhookLogs, saveSystemConfig } from '@/app/actions/integrations';
import type { IntegrationSetting, WebhookLog } from '@/lib/types/database';

type IntegrationCardId =
  | 'whatsapp'
  | 'meta_ads'
  | 'google_analytics'
  | 'google_ads'
  | 'gtm'
  | 'meta_pixel'
  | 'tiktok_ads'
  | 'x_ads'
  | 'linkedin_ads'
  | 'hotjar'
  | 'openai'
  | 'gemini'
  | 'vertex_ai'
  | 'resend'
  | 'upstash'
  | 'supabase'
  | 'n8n'
  | 'smtp'
  | 'voip';

type IntegrationCard = {
  id: IntegrationCardId;
  name: string;
  icon: string;
  desc: string;
  logoSrc?: string;
  logoSize?: number;
};

const INTEGRATION_CARDS: IntegrationCard[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: '💬',
    desc: 'Envie e receba mensagens automaticamente',
    logoSrc: '/images/logos/whatsapp2-logo.png',
    logoSize: 48,
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    icon: '📢',
    desc: 'Sincronize campanhas do Facebook e Instagram',
    logoSrc: '/images/logos/meta-logo1.png',
    logoSize: 48,
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    icon: '📊',
    desc: 'Rastreie visitas e comportamento do site',
    logoSrc: '/images/logos/Google-Analytics-Logo.png',
    logoSize: 56,
  },
  { id: 'google_ads', name: 'Google Ads API', icon: '🔎', desc: 'Métricas e campanhas do Google Ads' },
  { id: 'gtm', name: 'Google Tag Manager', icon: '🏷️', desc: 'Container de tags e scripts de marketing' },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel',
    icon: '🎯',
    desc: 'Rastreie conversões de anúncios',
    logoSrc: '/images/logos/meta-logo1.png',
    logoSize: 48,
  },
  { id: 'tiktok_ads', name: 'TikTok Ads', icon: '🎵', desc: 'Campanhas e métricas TikTok for Business' },
  { id: 'x_ads', name: 'X Ads', icon: '𝕏', desc: 'Mídia paga no X/Twitter' },
  { id: 'linkedin_ads', name: 'LinkedIn Ads', icon: '💼', desc: 'Campanhas B2B no LinkedIn' },
  { id: 'hotjar', name: 'Hotjar', icon: '🔥', desc: 'Heatmaps e gravações de sessão' },
  { id: 'openai', name: 'OpenAI', icon: '🤖', desc: 'Motor IA para análises e automações' },
  { id: 'gemini', name: 'Gemini (Google AI)', icon: '✨', desc: 'Geração de textos e criativos' },
  { id: 'vertex_ai', name: 'Vertex AI', icon: '🧠', desc: 'OCR e IA avançada no Google Cloud' },
  { id: 'resend', name: 'Resend', icon: '📨', desc: 'Envio de emails transacionais' },
  { id: 'upstash', name: 'Upstash Redis', icon: '⚡', desc: 'Rate limiting e cache distribuído' },
  { id: 'supabase', name: 'Supabase', icon: '🗄️', desc: 'Banco, auth e storage' },
  { id: 'n8n', name: 'n8n Webhooks', icon: '🔁', desc: 'Automações externas por webhook' },
  { id: 'smtp', name: 'SMTP (Email)', icon: '✉️', desc: 'Configure envio de emails transacionais' },
  { id: 'voip', name: 'VoIP', icon: '📞', desc: 'Central de telefonia IP' },
];

const GA4_PROPERTY_ID_REGEX = /^\d+$/;
const GA4_MEASUREMENT_ID_REGEX = /^G-[A-Z0-9]+$/;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getSystemGA4PropertyId(config: Record<string, unknown>): string {
  const direct =
    asString(config.ga4_property_id) ||
    asString(config.google_analytics_property_id) ||
    asString(config.ga4PropertyId) ||
    asString(config.googleAnalyticsPropertyId);
  if (GA4_PROPERTY_ID_REGEX.test(direct)) return direct;

  const legacy = asString(config.google_analytics_id);
  return GA4_PROPERTY_ID_REGEX.test(legacy) ? legacy : '';
}

function getSystemGA4MeasurementId(config: Record<string, unknown>): string {
  const direct =
    asString(config.ga4_measurement_id) ||
    asString(config.google_analytics_measurement_id) ||
    asString(config.gaMeasurementId) ||
    asString(config.ga4MeasurementId) ||
    asString(config.googleAnalyticsMeasurementId);
  if (GA4_MEASUREMENT_ID_REGEX.test(direct.toUpperCase())) return direct.toUpperCase();

  const legacy = asString(config.google_analytics_id).toUpperCase();
  return GA4_MEASUREMENT_ID_REGEX.test(legacy) ? legacy : '';
}

function findIntegrationRow(cardId: IntegrationCardId, rows: IntegrationSetting[]): IntegrationSetting | null {
  const namesByCard: Record<IntegrationCardId, string[]> = {
    whatsapp: ['whatsapp', 'whatsapp_business'],
    meta_ads: ['meta_ads'],
    google_analytics: ['google_analytics', 'ga4'],
    google_ads: ['google_ads'],
    gtm: ['gtm'],
    meta_pixel: ['meta_pixel'],
    tiktok_ads: ['tiktok_ads', 'tiktok'],
    x_ads: ['x_ads', 'twitter_ads'],
    linkedin_ads: ['linkedin_ads', 'linkedin'],
    hotjar: ['hotjar'],
    openai: ['openai'],
    gemini: ['gemini', 'google_ai'],
    vertex_ai: ['vertex_ai'],
    resend: ['resend'],
    upstash: ['upstash'],
    supabase: ['supabase'],
    n8n: ['n8n'],
    smtp: ['smtp', 'email_smtp'],
    voip: ['voip'],
  };

  const candidates = new Set(namesByCard[cardId]);
  const row = rows.find((item) => candidates.has(item.integration_name));
  return row || null;
}

export default function IntegracoesPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<IntegrationSetting[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [systemConfig, setSystemConfig] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const [showGa4Modal, setShowGa4Modal] = useState(false);
  const [ga4PropertyId, setGa4PropertyId] = useState('');
  const [ga4MeasurementId, setGa4MeasurementId] = useState('');
  const [savingGa4, setSavingGa4] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [integrationsRes, webhookRes, configRes] = await Promise.all([
      getIntegrations(),
      getWebhookLogs({ limit: 20 }),
      getSystemConfig(),
    ]);

    if (integrationsRes.success) {
      const rows = Array.isArray(integrationsRes.data) ? integrationsRes.data : [];
      setIntegrations(rows as IntegrationSetting[]);
    } else {
      setIntegrations([]);
    }

    if (webhookRes.success) {
      const rows = Array.isArray(webhookRes.data) ? webhookRes.data : [];
      setWebhookLogs(rows as WebhookLog[]);
    } else {
      setWebhookLogs([]);
    }

    if (configRes.success && configRes.data) {
      setSystemConfig(asRecord(configRes.data));
    } else {
      setSystemConfig({});
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const isCardConfigured = useCallback((cardId: IntegrationCardId, config: Record<string, unknown>, row: IntegrationSetting | null) => {
    if (cardId === 'google_analytics') {
      const hasProperty = !!getSystemGA4PropertyId(config);
      const hasCredentials =
        asString(config.google_service_account_json).length > 0 ||
        asString(config.google_application_credentials_json).length > 0 ||
        (asString(config.google_client_email).length > 0 && asString(config.google_private_key).length > 0);
      return hasProperty && hasCredentials;
    }
    if (cardId === 'meta_pixel') return asString(config.meta_pixel_id).length > 0;
    if (cardId === 'whatsapp') return asString(config.whatsapp_api_token).length > 0 && asString(config.whatsapp_phone_number_id).length > 0;
    if (cardId === 'smtp') return asString(config.smtp_host).length > 0 && asString(config.smtp_user).length > 0;
    if (cardId === 'meta_ads') return asString(config.meta_ad_account_id).length > 0 && asString(config.meta_access_token).length > 0;
    if (cardId === 'google_ads') return asString(config.google_ads_customer_id).length > 0 && asString(config.google_ads_client_id).length > 0 && asString(config.google_ads_refresh_token).length > 0;
    if (cardId === 'gtm') return asString(config.gtm_id).length > 0;
    if (cardId === 'tiktok_ads') return asString(config.tiktok_access_token).length > 0 && asString(config.tiktok_advertiser_id).length > 0;
    if (cardId === 'x_ads') return asString(config.x_ads_account_id).length > 0 && asString(config.x_bearer_token).length > 0;
    if (cardId === 'linkedin_ads') return asString(config.linkedin_access_token).length > 0 && asString(config.linkedin_ad_account_id).length > 0;
    if (cardId === 'hotjar') return asString(config.hotjar_site_id).length > 0;
    if (cardId === 'openai') return asString(config.openai_api_key).length > 0;
    if (cardId === 'gemini') return asString(config.google_ai_api_key).length > 0;
    if (cardId === 'vertex_ai') {
      return (
        asString(config.google_service_account_json).length > 0 ||
        asString(config.google_application_credentials_json).length > 0 ||
        (asString(config.google_client_email).length > 0 && asString(config.google_private_key).length > 0)
      );
    }
    if (cardId === 'resend') return asString(config.resend_api_key).length > 0;
    if (cardId === 'upstash') return asString(config.upstash_redis_rest_url).length > 0 && asString(config.upstash_redis_rest_token).length > 0;
    if (cardId === 'supabase') {
      return (
        asString(config.supabase_url).length > 0 &&
        asString(config.supabase_anon_key).length > 0 &&
        asString(config.supabase_service_role_key).length > 0
      );
    }
    if (cardId === 'n8n') return asString(config.n8n_webhook_url).length > 0;
    if (cardId === 'voip') return !!row;
    return !!row?.is_active;
  }, []);

  const configuredCount = useMemo(() => {
    return INTEGRATION_CARDS.filter((card) => {
      const row = findIntegrationRow(card.id, integrations);
      const config = asRecord(systemConfig);
      return isCardConfigured(card.id, config, row);
    }).length;
  }, [integrations, isCardConfigured, systemConfig]);

  const activeCount = useMemo(() => {
    const config = asRecord(systemConfig);
    return INTEGRATION_CARDS.filter((card) => isCardConfigured(card.id, config, findIntegrationRow(card.id, integrations))).length;
  }, [integrations, isCardConfigured, systemConfig]);

  function openConfigure(cardId: IntegrationCardId) {
    if (cardId !== 'google_analytics') {
      router.push('/portal-interno-hks-2026/configuracoes?tab=integracoes');
      return;
    }

    const config = asRecord(systemConfig);
    setGa4PropertyId(getSystemGA4PropertyId(config));
    setGa4MeasurementId(getSystemGA4MeasurementId(config));
    setShowGa4Modal(true);
  }

  async function handleSaveGA4() {
    const property = ga4PropertyId.trim();
    const measurement = ga4MeasurementId.trim().toUpperCase();

    if (!property) {
      toast.error('GA4 Property ID é obrigatório');
      return;
    }

    if (!GA4_PROPERTY_ID_REGEX.test(property)) {
      toast.error('GA4 Property ID inválido', {
        description: 'Use somente números. Ex.: 123456789.',
      });
      return;
    }

    if (measurement && !GA4_MEASUREMENT_ID_REGEX.test(measurement)) {
      toast.error('GA4 Measurement ID inválido', {
        description: 'Use o formato G-XXXXXXXXXX.',
      });
      return;
    }

    const payload: Record<string, unknown> = {
      ...asRecord(systemConfig),
      ga4_property_id: property,
      google_analytics_property_id: property,
      ga4_measurement_id: measurement,
      google_analytics_measurement_id: measurement,
    };

    setSavingGa4(true);
    const result = await saveSystemConfig(payload);
    setSavingGa4(false);

    if (!result.success) {
      toast.error('Erro ao salvar Google Analytics', { description: result.error });
      return;
    }

    toast.success('Google Analytics configurado com sucesso');
    setShowGa4Modal(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          INTEGRAÇÕES
        </h1>
        <p className="mt-2 text-gray-400">Conecte suas ferramentas e APIs</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <Plug className="h-5 w-5 text-[#D4AF37] mb-2" />
              <p className="text-2xl font-bold text-white">{configuredCount}</p>
              <p className="text-xs text-gray-400">Integrações Configuradas</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <CheckCircle className="h-5 w-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-white">{activeCount}</p>
              <p className="text-xs text-gray-400">Ativas</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
              <Globe className="h-5 w-5 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-white">{webhookLogs.length}</p>
              <p className="text-xs text-gray-400">Webhook Logs (recentes)</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {INTEGRATION_CARDS.map((card) => {
              const row = findIntegrationRow(card.id, integrations);
              const config = asRecord(systemConfig);
              const ga4Configured = !!getSystemGA4PropertyId(config);
              const configured = isCardConfigured(card.id, config, row);

              return (
                <div
                  key={card.id}
                  className={`rounded-lg border p-5 transition-all ${
                    configured ? 'border-green-500/30 bg-[#0a0a0a]' : 'border-white/10 bg-[#0a0a0a] opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {card.logoSrc ? (
                      <Image
                        src={card.logoSrc}
                        alt={`Logo ${card.name}`}
                        width={card.logoSize ?? 44}
                        height={card.logoSize ?? 44}
                        className="shrink-0 object-contain"
                      />
                    ) : (
                      <span className="text-2xl">{card.icon}</span>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-white">{card.name}</h3>
                      <p className="text-xs text-gray-400">{card.desc}</p>
                    </div>
                  </div>

                  {card.id === 'google_analytics' && ga4Configured && (
                    <p className="mt-3 text-xs text-green-400">
                      Property ID configurado: {getSystemGA4PropertyId(config)}
                    </p>
                  )}

                  {row?.last_sync_at && (
                    <p className="text-xs text-gray-500 mt-3">
                      Último sync: {new Date(row.last_sync_at).toLocaleString('pt-BR')}
                    </p>
                  )}

                  <button
                    onClick={() => openConfigure(card.id)}
                    className="mt-3 rounded-lg border border-[#D4AF37]/30 px-3 py-1.5 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                  >
                    Configurar
                  </button>
                </div>
              );
            })}
          </div>

          {webhookLogs.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#D4AF37]" /> Webhook Logs (últimos 20)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-gray-400">
                      <th className="pb-2 pr-4">Fonte</th>
                      <th className="pb-2 pr-4">Evento</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                        {(() => {
                          const normalizedStatus = (log.status || '').toLowerCase();
                          const isOkStatus = ['processed', 'completed', 'success', 'received'].includes(normalizedStatus);
                          return (
                            <>
                              <td className="py-2 pr-4 text-white">{log.source}</td>
                              <td className="py-2 pr-4 text-gray-300">{log.event_type}</td>
                              <td className="py-2 pr-4">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  isOkStatus
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {log.status || 'unknown'}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-gray-400 text-xs">
                                {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '—'}
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showGa4Modal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl border border-[#D4AF37]/30 bg-[#0a0a0a] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Configurar Google Analytics</h3>
              <button onClick={() => setShowGa4Modal(false)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">GA4 Property ID (numérico)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={ga4PropertyId}
                  onChange={(e) => setGa4PropertyId(e.target.value)}
                  placeholder="Ex: 123456789"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 font-mono text-sm text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Obrigatório para a API do GA4 no dashboard.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">GA4 Measurement ID (opcional)</label>
                <input
                  type="text"
                  value={ga4MeasurementId}
                  onChange={(e) => setGa4MeasurementId(e.target.value.toUpperCase())}
                  placeholder="Ex: G-ABC123XYZ"
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 font-mono text-sm text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Formato: G-XXXX. Usado no tracking frontend.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowGa4Modal(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { void handleSaveGA4(); }}
                disabled={savingGa4}
                className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F6E05E] disabled:opacity-50"
              >
                {savingGa4 ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {savingGa4 ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
