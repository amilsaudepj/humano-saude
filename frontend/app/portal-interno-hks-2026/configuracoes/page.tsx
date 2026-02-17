'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Building,
  Globe,
  Bell,
  Shield,
  Mail,
  Loader2,
  Users,
  Plus,
  MoreVertical,
  UserPlus,
  X,
  BookOpen,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getSystemConfig, saveSystemConfig } from '@/app/actions/integrations';
import { getEquipe, convidarMembro, updateMembroRole, toggleMembroAtivo, removerMembro, type MembroEquipe } from '@/app/actions/equipe';
import { getInitials } from '@/lib/utils';

interface Config {
  empresa_nome: string;
  empresa_cnpj: string;
  empresa_telefone: string;
  empresa_email: string;
  empresa_site: string;

  // WhatsApp
  whatsapp_api_token: string;
  whatsapp_phone_number_id: string;
  whatsapp_business_account_id: string;
  whatsapp_webhook_verify_token: string;

  // Meta
  meta_access_token: string;
  meta_ad_account_id: string;
  meta_app_id: string;
  meta_app_secret: string;
  meta_page_id: string;
  meta_page_access_token: string;
  meta_instagram_id: string;
  meta_pixel_id: string;
  meta_test_event_code: string;

  // Google Analytics
  ga4_property_id: string;
  ga4_measurement_id: string;

  // TikTok
  tiktok_access_token: string;
  tiktok_advertiser_id: string;
  tiktok_pixel_id: string;

  // X / Twitter
  x_ads_account_id: string;
  x_bearer_token: string;
  x_api_key: string;
  x_api_secret: string;

  // LinkedIn
  linkedin_access_token: string;
  linkedin_ad_account_id: string;

  // Google Ads
  google_ads_customer_id: string;
  google_ads_client_id: string;
  google_ads_refresh_token: string;

  // Heatmap / analytics
  hotjar_site_id: string;

  // IA Providers
  openai_api_key: string;
  google_ai_api_key: string;

  // SMTP
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;

  notificar_novo_lead: boolean;
  notificar_cotacao: boolean;
  notificar_proposta: boolean;
  tema: 'dark' | 'light';
}

const DEFAULT_CONFIG: Config = {
  empresa_nome: 'Humano Saúde',
  empresa_cnpj: '',
  empresa_telefone: '',
  empresa_email: '',
  empresa_site: '',

  whatsapp_api_token: '',
  whatsapp_phone_number_id: '',
  whatsapp_business_account_id: '',
  whatsapp_webhook_verify_token: '',

  meta_access_token: '',
  meta_ad_account_id: '',
  meta_app_id: '',
  meta_app_secret: '',
  meta_page_id: '',
  meta_page_access_token: '',
  meta_instagram_id: '',
  meta_pixel_id: '',
  meta_test_event_code: '',

  ga4_property_id: '',
  ga4_measurement_id: '',

  tiktok_access_token: '',
  tiktok_advertiser_id: '',
  tiktok_pixel_id: '',

  x_ads_account_id: '',
  x_bearer_token: '',
  x_api_key: '',
  x_api_secret: '',

  linkedin_access_token: '',
  linkedin_ad_account_id: '',

  google_ads_customer_id: '',
  google_ads_client_id: '',
  google_ads_refresh_token: '',

  hotjar_site_id: '',

  openai_api_key: '',
  google_ai_api_key: '',

  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',

  notificar_novo_lead: true,
  notificar_cotacao: true,
  notificar_proposta: true,
  tema: 'dark',
};

const GA4_PROPERTY_ID_REGEX = /^\d+$/;
const GA4_MEASUREMENT_ID_REGEX = /^G-[A-Z0-9]+$/;
const HOTJAR_SITE_ID_REGEX = /^\d+$/;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getGA4Config(rawConfig: Record<string, unknown>): { ga4PropertyId: string; ga4MeasurementId: string } {
  const legacyId = asString(rawConfig.google_analytics_id);

  const ga4PropertyId =
    asString(rawConfig.ga4_property_id) ||
    asString(rawConfig.google_analytics_property_id) ||
    (GA4_PROPERTY_ID_REGEX.test(legacyId) ? legacyId : '');

  const measurementFromRaw =
    asString(rawConfig.ga4_measurement_id) ||
    asString(rawConfig.google_analytics_measurement_id) ||
    (GA4_MEASUREMENT_ID_REGEX.test(legacyId.toUpperCase()) ? legacyId : '');

  const ga4MeasurementId = measurementFromRaw ? measurementFromRaw.toUpperCase() : '';

  return { ga4PropertyId, ga4MeasurementId };
}

type StringFieldKey = {
  [K in keyof Config]: Config[K] extends string ? K : never;
}[keyof Config];

type BooleanFieldKey = {
  [K in keyof Config]: Config[K] extends boolean ? K : never;
}[keyof Config];

type CompanyFieldKey = 'empresa_nome' | 'empresa_cnpj' | 'empresa_telefone' | 'empresa_email' | 'empresa_site';
type NotificationFieldKey = 'notificar_novo_lead' | 'notificar_cotacao' | 'notificar_proposta';
type IntegrationFieldKey =
  | 'whatsapp_api_token'
  | 'whatsapp_phone_number_id'
  | 'whatsapp_business_account_id'
  | 'whatsapp_webhook_verify_token'
  | 'meta_access_token'
  | 'meta_ad_account_id'
  | 'meta_app_id'
  | 'meta_app_secret'
  | 'meta_page_id'
  | 'meta_page_access_token'
  | 'meta_instagram_id'
  | 'meta_pixel_id'
  | 'meta_test_event_code'
  | 'ga4_property_id'
  | 'ga4_measurement_id'
  | 'tiktok_access_token'
  | 'tiktok_advertiser_id'
  | 'tiktok_pixel_id'
  | 'x_ads_account_id'
  | 'x_bearer_token'
  | 'x_api_key'
  | 'x_api_secret'
  | 'linkedin_access_token'
  | 'linkedin_ad_account_id'
  | 'google_ads_customer_id'
  | 'google_ads_client_id'
  | 'google_ads_refresh_token'
  | 'hotjar_site_id'
  | 'openai_api_key'
  | 'google_ai_api_key';
type SmtpFieldKey = 'smtp_host' | 'smtp_port' | 'smtp_user';
type IntegrationGuideId =
  | 'whatsapp_business'
  | 'meta_ads'
  | 'meta_pixel'
  | 'ga4'
  | 'tiktok_ads'
  | 'x_ads'
  | 'linkedin_ads'
  | 'google_ads'
  | 'hotjar'
  | 'ai_keys';

type IntegrationGuideStep = {
  title: string;
  description: string;
  link?: string;
};

type IntegrationFieldDefinition = {
  key: IntegrationFieldKey;
  label: string;
  placeholder: string;
  helperText?: string;
  sensitive?: boolean;
  inputMode?: 'text' | 'numeric';
};

type IntegrationGuide = {
  id: IntegrationGuideId;
  name: string;
  description: string;
  requiredKeys: IntegrationFieldKey[];
  requiredMode?: 'all' | 'any';
  fields: IntegrationFieldDefinition[];
  tutorial: IntegrationGuideStep[];
};

const COMPANY_FIELDS: Array<{ key: CompanyFieldKey; label: string; type: 'text' | 'tel' | 'email' | 'url' }> = [
  { key: 'empresa_nome', label: 'Nome da Empresa', type: 'text' },
  { key: 'empresa_cnpj', label: 'CNPJ', type: 'text' },
  { key: 'empresa_telefone', label: 'Telefone', type: 'tel' },
  { key: 'empresa_email', label: 'Email', type: 'email' },
  { key: 'empresa_site', label: 'Site', type: 'url' },
];

const NOTIFICATION_FIELDS: Array<{ key: NotificationFieldKey; label: string }> = [
  { key: 'notificar_novo_lead', label: 'Notificar quando novo lead for capturado' },
  { key: 'notificar_cotacao', label: 'Notificar quando cotação for gerada' },
  { key: 'notificar_proposta', label: 'Notificar quando proposta for aceita' },
];

const SMTP_FIELDS: Array<{ key: SmtpFieldKey; label: string; placeholder: string }> = [
  { key: 'smtp_host', label: 'Host SMTP', placeholder: 'smtp.gmail.com' },
  { key: 'smtp_port', label: 'Porta', placeholder: '587' },
  { key: 'smtp_user', label: 'Usuário', placeholder: 'email@empresa.com' },
];

const INTEGRATION_GUIDES: IntegrationGuide[] = [
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business API',
    description: 'Mensagens, notificações e fluxos automáticos',
    requiredKeys: ['whatsapp_api_token', 'whatsapp_phone_number_id'],
    fields: [
      { key: 'whatsapp_api_token', label: 'API Token', placeholder: 'EAAB... ou token permanente', sensitive: true },
      { key: 'whatsapp_phone_number_id', label: 'Phone Number ID', placeholder: 'Ex: 123456789012345', inputMode: 'numeric' },
      { key: 'whatsapp_business_account_id', label: 'Business Account ID', placeholder: 'Ex: 987654321098765', inputMode: 'numeric' },
      { key: 'whatsapp_webhook_verify_token', label: 'Webhook Verify Token', placeholder: 'Token de validação do webhook', sensitive: true },
    ],
    tutorial: [
      { title: 'Acesse o Meta for Developers', description: 'Entre no app da sua empresa e abra WhatsApp > API Setup.', link: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started' },
      { title: 'Copie credenciais principais', description: 'Cole o Access Token e o Phone Number ID nos campos desta tela.' },
      { title: 'Configure webhook', description: 'Use URL pública + Verify Token para receber mensagens e status.' },
    ],
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads API',
    description: 'Campanhas, ad sets, ads, custos e performance',
    requiredKeys: ['meta_access_token', 'meta_ad_account_id'],
    fields: [
      { key: 'meta_access_token', label: 'Access Token', placeholder: 'Token com permissões ads_read/ads_management', sensitive: true },
      { key: 'meta_ad_account_id', label: 'Ad Account ID', placeholder: 'act_1234567890' },
      { key: 'meta_app_id', label: 'App ID', placeholder: 'ID do app Meta' },
      { key: 'meta_app_secret', label: 'App Secret', placeholder: 'Segredo do app Meta', sensitive: true },
      { key: 'meta_page_id', label: 'Page ID', placeholder: 'ID da página do Facebook' },
      { key: 'meta_page_access_token', label: 'Page Access Token', placeholder: 'Token da página', sensitive: true },
      { key: 'meta_instagram_id', label: 'Instagram Business ID', placeholder: 'ID da conta Instagram business' },
    ],
    tutorial: [
      { title: 'Crie/abra um app no Meta Developers', description: 'Ative Marketing API e adicione permissões de anúncios.', link: 'https://developers.facebook.com/docs/marketing-apis/' },
      { title: 'Gere token válido', description: 'Use user token + extensão para long-lived token com permissões de ads.' },
      { title: 'Ad account', description: 'No Ads Manager copie o identificador da conta no formato act_XXXX.' },
    ],
  },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel + CAPI',
    description: 'Conversões de site e eventos server-side',
    requiredKeys: ['meta_pixel_id'],
    fields: [
      { key: 'meta_pixel_id', label: 'Pixel ID', placeholder: 'Ex: 123456789012345' },
      { key: 'meta_test_event_code', label: 'Test Event Code', placeholder: 'Opcional para testes (TEST12345)' },
    ],
    tutorial: [
      { title: 'Abra o Events Manager', description: 'Crie ou selecione o Pixel do negócio.', link: 'https://www.facebook.com/events_manager2/' },
      { title: 'Copie o Pixel ID', description: 'Cole aqui e salve para habilitar tracking no frontend.' },
      { title: 'Teste eventos', description: 'Use o Test Event Code para validar eventos antes de publicar.' },
    ],
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Sessões, fontes, comportamento e realtime',
    requiredKeys: ['ga4_property_id'],
    fields: [
      { key: 'ga4_property_id', label: 'GA4 Property ID', placeholder: 'Ex: 123456789', inputMode: 'numeric', helperText: 'Obrigatório para Data API (somente números).' },
      { key: 'ga4_measurement_id', label: 'GA4 Measurement ID', placeholder: 'Ex: G-ABC123XYZ', helperText: 'Usado no tracking frontend.' },
    ],
    tutorial: [
      { title: 'Abra o Admin do GA4', description: 'Vá em Propriedade > Detalhes da propriedade e copie o Property ID.', link: 'https://support.google.com/analytics/answer/9304153' },
      { title: 'Crie/baixe service account no GCP', description: 'Ative Analytics Data API e gere JSON da conta de serviço.' },
      { title: 'Configure stream web', description: 'Copie também o Measurement ID no formato G-XXXX.' },
    ],
  },
  {
    id: 'tiktok_ads',
    name: 'TikTok Ads',
    description: 'Métricas de campanha, pixel e funil',
    requiredKeys: ['tiktok_access_token', 'tiktok_advertiser_id'],
    fields: [
      { key: 'tiktok_access_token', label: 'Access Token', placeholder: 'Token OAuth da TikTok Marketing API', sensitive: true },
      { key: 'tiktok_advertiser_id', label: 'Advertiser ID', placeholder: 'ID da conta anunciante' },
      { key: 'tiktok_pixel_id', label: 'Pixel ID', placeholder: 'ID do Pixel TikTok (opcional)' },
    ],
    tutorial: [
      { title: 'Ative TikTok Marketing API', description: 'Crie app no TikTok for Business e conecte conta anunciante.', link: 'https://ads.tiktok.com/marketing_api/docs' },
      { title: 'Copie advertiser_id', description: 'No Business Center localize o ID da conta de anúncios.' },
      { title: 'Token OAuth', description: 'Gere token com escopos de leitura para métricas e campanhas.' },
    ],
  },
  {
    id: 'x_ads',
    name: 'X Ads (Twitter Ads)',
    description: 'Desempenho de campanhas no X/Twitter',
    requiredKeys: ['x_ads_account_id', 'x_bearer_token'],
    fields: [
      { key: 'x_ads_account_id', label: 'Ads Account ID', placeholder: 'Ex: 18ce54d4x5t' },
      { key: 'x_bearer_token', label: 'Bearer Token', placeholder: 'Bearer token de API', sensitive: true },
      { key: 'x_api_key', label: 'API Key', placeholder: 'Consumer API Key' },
      { key: 'x_api_secret', label: 'API Secret', placeholder: 'Consumer API Secret', sensitive: true },
    ],
    tutorial: [
      { title: 'Crie app no X Developer', description: 'Ative acesso Ads API para a conta anunciante.', link: 'https://developer.x.com/en/docs/twitter-ads-api' },
      { title: 'Pegue o account id', description: 'No painel Ads, copie o identificador da conta.' },
      { title: 'Configure tokens', description: 'Cole Bearer Token, API Key e API Secret.' },
    ],
  },
  {
    id: 'linkedin_ads',
    name: 'LinkedIn Ads',
    description: 'Campanhas B2B e métricas profissionais',
    requiredKeys: ['linkedin_access_token', 'linkedin_ad_account_id'],
    fields: [
      { key: 'linkedin_access_token', label: 'Access Token', placeholder: 'Token OAuth LinkedIn Marketing', sensitive: true },
      { key: 'linkedin_ad_account_id', label: 'Ad Account ID', placeholder: 'urn:li:sponsoredAccount:XXXX' },
    ],
    tutorial: [
      { title: 'Abra o LinkedIn Developer', description: 'Crie app e solicite escopos para Marketing API.', link: 'https://learn.microsoft.com/linkedin/marketing/' },
      { title: 'Conecte Campaign Manager', description: 'Vincule conta de anúncios ao app para leitura de métricas.' },
      { title: 'Cole token e account urn', description: 'Use o URN completo da conta patrocinada.' },
    ],
  },
  {
    id: 'google_ads',
    name: 'Google Ads API',
    description: 'Campanhas de pesquisa, display e conversões',
    requiredKeys: ['google_ads_customer_id', 'google_ads_client_id', 'google_ads_refresh_token'],
    fields: [
      { key: 'google_ads_customer_id', label: 'Customer ID', placeholder: '123-456-7890' },
      { key: 'google_ads_client_id', label: 'OAuth Client ID', placeholder: 'Client ID do OAuth app' },
      { key: 'google_ads_refresh_token', label: 'Refresh Token', placeholder: 'Refresh token OAuth', sensitive: true },
    ],
    tutorial: [
      { title: 'Ative Google Ads API', description: 'Configure projeto no Google Cloud e vincule MCC/conta.', link: 'https://developers.google.com/google-ads/api/docs/get-started/overview' },
      { title: 'OAuth', description: 'Crie credencial OAuth e gere refresh token.' },
      { title: 'Customer ID', description: 'No Google Ads copie o Customer ID da conta alvo.' },
    ],
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'Heatmaps e gravações de sessão',
    requiredKeys: ['hotjar_site_id'],
    fields: [
      { key: 'hotjar_site_id', label: 'Site ID', placeholder: 'Ex: 622740', inputMode: 'numeric' },
    ],
    tutorial: [
      { title: 'Crie site no Hotjar', description: 'No workspace do Hotjar, adicione o domínio principal.', link: 'https://help.hotjar.com/hc/en-us/articles/115011640307' },
      { title: 'Copie Site ID', description: 'Cole aqui para ativar HotjarInit automaticamente.' },
    ],
  },
  {
    id: 'ai_keys',
    name: 'Provedores de IA',
    description: 'Personalização e automações com IA',
    requiredKeys: ['openai_api_key', 'google_ai_api_key'],
    requiredMode: 'any',
    fields: [
      { key: 'openai_api_key', label: 'OpenAI API Key', placeholder: 'sk-...', sensitive: true },
      { key: 'google_ai_api_key', label: 'Google AI API Key (Gemini)', placeholder: 'AIza...', sensitive: true },
    ],
    tutorial: [
      { title: 'OpenAI', description: 'Crie chave no painel da OpenAI e limite por projeto.', link: 'https://platform.openai.com/api-keys' },
      { title: 'Gemini (AI Studio)', description: 'Crie chave da Google AI para rotas de geração rápida.', link: 'https://aistudio.google.com/app/apikey' },
      { title: 'Segurança', description: 'Use rotação periódica e permissões mínimas por ambiente.' },
    ],
  },
];

function getGuideFilledFields(guide: IntegrationGuide, currentConfig: Config): number {
  return guide.fields.reduce((total, field) => {
    return total + (asString(currentConfig[field.key]).length > 0 ? 1 : 0);
  }, 0);
}

function isGuideConfigured(guide: IntegrationGuide, currentConfig: Config): boolean {
  const hasValue = (key: IntegrationFieldKey) => asString(currentConfig[key]).length > 0;
  const mode = guide.requiredMode ?? 'all';
  return mode === 'any'
    ? guide.requiredKeys.some(hasValue)
    : guide.requiredKeys.every(hasValue);
}

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('empresa');
  const [saving, setSaving] = useState(false);
  const [showSensitiveValues, setShowSensitiveValues] = useState(false);
  const [activeGuide, setActiveGuide] = useState<IntegrationGuide | null>(null);
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState<{ nome: string; email: string; role: 'corretor' | 'supervisor' | 'admin' }>({ nome: '', email: '', role: 'corretor' });
  const [inviting, setInviting] = useState(false);

  function updateStringField(key: StringFieldKey, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value } as Config));
  }

  function toggleBooleanField(key: BooleanFieldKey) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] } as Config));
  }

  useEffect(() => {
    async function load() {
      const [res, membros] = await Promise.all([
        getSystemConfig(),
        getEquipe(),
      ]);
      if (res.success && res.data) {
        const rawConfig = res.data as Record<string, unknown>;
        const { ga4PropertyId, ga4MeasurementId } = getGA4Config(rawConfig);
        setConfig({
          ...DEFAULT_CONFIG,
          ...(rawConfig as Partial<Config>),
          ga4_property_id: ga4PropertyId,
          ga4_measurement_id: ga4MeasurementId,
        });
      }
      setEquipe(membros);
    }
    load();
  }, []);

  async function handleSave() {
    const propertyId = config.ga4_property_id.trim();
    const measurementId = config.ga4_measurement_id.trim().toUpperCase();
    const hotjarSiteId = config.hotjar_site_id.trim();

    if (propertyId && !GA4_PROPERTY_ID_REGEX.test(propertyId)) {
      toast.error('GA4 Property ID inválido', {
        description: 'Use apenas números, ex.: 123456789.',
      });
      return;
    }

    if (measurementId && !GA4_MEASUREMENT_ID_REGEX.test(measurementId)) {
      toast.error('GA4 Measurement ID inválido', {
        description: 'Use o formato G-XXXXXXXXXX.',
      });
      return;
    }

    if (hotjarSiteId && !HOTJAR_SITE_ID_REGEX.test(hotjarSiteId)) {
      toast.error('Hotjar Site ID inválido', {
        description: 'Use apenas números, ex.: 622740.',
      });
      return;
    }

    const payload: Record<string, unknown> = {
      ...config,
      ga4_property_id: propertyId,
      ga4_measurement_id: measurementId,
      hotjar_site_id: hotjarSiteId,
      google_analytics_property_id: propertyId,
      google_analytics_measurement_id: measurementId,
    };

    setSaving(true);
    const res = await saveSystemConfig(payload);
    setSaving(false);
    if (res.success) {
      toast.success('Configurações salvas com sucesso');
    } else {
      toast.error('Erro ao salvar configurações', { description: res.error });
    }
  }

  const tabs = [
    { key: 'empresa', label: 'Empresa', icon: Building },
    { key: 'equipe', label: 'Equipe', icon: Users },
    { key: 'notificacoes', label: 'Notificações', icon: Bell },
    { key: 'integracoes', label: 'APIs', icon: Globe },
    { key: 'email', label: 'Email (SMTP)', icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            CONFIGURAÇÕES
          </h1>
          <p className="mt-2 text-gray-400">Configurações gerais do sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#F6E05E] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-[#D4AF37] text-white'
                : 'border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Empresa */}
      {activeTab === 'empresa' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-[#D4AF37]" /> Dados da Empresa
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {COMPANY_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={config[field.key]}
                  onChange={(e) => updateStringField(field.key, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notificações */}
      {activeTab === 'notificacoes' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#D4AF37]" /> Notificações
          </h2>
          {NOTIFICATION_FIELDS.map((item) => (
            <label key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer">
              <span className="text-sm text-gray-300">{item.label}</span>
              <button
                onClick={() => toggleBooleanField(item.key)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  config[item.key] ? 'bg-[#D4AF37]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    config[item.key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      )}

      {/* APIs */}
      {activeTab === 'integracoes' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#D4AF37]" /> APIs e Integrações White Label
              </h2>
              <p className="text-sm text-gray-500">
                Cada cliente pode conectar as próprias credenciais sem depender de deploy.
              </p>
            </div>
            <button
              onClick={() => setShowSensitiveValues((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:border-[#D4AF37]/40 hover:text-white transition-colors"
            >
              {showSensitiveValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSensitiveValues ? 'Ocultar credenciais' : 'Mostrar credenciais'}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {INTEGRATION_GUIDES.map((guide) => {
              const configured = isGuideConfigured(guide, config);
              const filledFields = getGuideFilledFields(guide, config);
              const requiredLabel = guide.requiredMode === 'any' ? 'Ao menos 1 chave' : 'Todas as chaves obrigatórias';

              return (
                <div
                  key={guide.id}
                  className={`rounded-xl border p-4 md:p-5 transition-colors ${
                    configured
                      ? 'border-emerald-400/40 bg-emerald-500/[0.04]'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-white">{guide.name}</h3>
                      <p className="mt-1 text-xs text-gray-400">{guide.description}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        configured
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {configured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {configured ? 'Conectado' : 'Pendente'}
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] text-gray-500">
                    {requiredLabel} • {filledFields}/{guide.fields.length} campos preenchidos
                  </p>

                  <div className="mt-4 grid gap-3">
                    {guide.fields.map((field) => {
                      const isMeasurement = field.key === 'ga4_measurement_id';
                      const inputType = field.sensitive && !showSensitiveValues ? 'password' : 'text';
                      return (
                        <div key={field.key}>
                          <label className="mb-1 block text-xs text-gray-400">{field.label}</label>
                          <input
                            type={inputType}
                            value={config[field.key]}
                            onChange={(event) => {
                              const rawValue = event.target.value;
                              const nextValue = isMeasurement ? rawValue.toUpperCase() : rawValue;
                              updateStringField(field.key, nextValue);
                            }}
                            placeholder={field.placeholder}
                            inputMode={field.inputMode ?? 'text'}
                            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-base md:text-sm text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                          />
                          {field.helperText ? (
                            <p className="mt-1 text-[11px] text-gray-500">{field.helperText}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <button
                      onClick={() => setActiveGuide(guide)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/30 px-3 py-2 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Tutorial passo a passo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SMTP */}
      {activeTab === 'email' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#D4AF37]" /> Configuração SMTP
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {SMTP_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={config[field.key]}
                  onChange={(e) => updateStringField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipe */}
      {activeTab === 'equipe' && (
        <div className="space-y-4">
          {/* Header equipe */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-[#D4AF37]" /> Equipe
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {equipe.filter(m => m.ativo).length} membros ativos de {equipe.length} total
              </p>
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#F6E05E] transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Convidar Membro
            </button>
          </div>

          {/* Modal convite */}
          {showInvite && (
            <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0a0a0a] p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">Novo Membro</h3>
                <button onClick={() => setShowInvite(false)} className="text-gray-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nome</label>
                  <input
                    type="text"
                    value={inviteData.nome}
                    onChange={(e) => setInviteData({ ...inviteData, nome: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="corretor@email.com"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Função</label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'corretor' | 'supervisor' | 'admin' })}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  >
                    <option value="corretor">Corretor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowInvite(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!inviteData.nome || !inviteData.email) {
                      toast.error('Preencha nome e email');
                      return;
                    }
                    setInviting(true);
                    const res = await convidarMembro(inviteData);
                    setInviting(false);
                    if (res.success) {
                      toast.success('Membro adicionado com sucesso!');
                      setShowInvite(false);
                      setInviteData({ nome: '', email: '', role: 'corretor' });
                      const updated = await getEquipe();
                      setEquipe(updated);
                    } else {
                      toast.error(res.error || 'Erro ao convidar');
                    }
                  }}
                  disabled={inviting}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#F6E05E] transition-colors disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {inviting ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de membros */}
          <div className="space-y-3">
            {equipe.map((membro) => (
              <div
                key={membro.id}
                className={`rounded-lg border bg-[#0a0a0a] p-4 transition-all ${
                  membro.ativo ? 'border-white/10' : 'border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      {membro.foto_url ? (
                        <img
                          src={membro.foto_url}
                          alt={membro.nome}
                          className="h-10 w-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                          {getInitials(membro.nome)}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0a0a] ${
                          membro.ativo ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div>
                      <p className="text-sm font-medium text-white">{membro.nome}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {membro.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Role badge */}
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      membro.role === 'admin'
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                        : membro.role === 'supervisor'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      <span className="flex items-center gap-1">
                        {membro.role === 'admin' ? <Shield className="h-3 w-3" /> : null}
                        {membro.role === 'admin' ? 'Admin' : membro.role === 'supervisor' ? 'Supervisor' : 'Corretor'}
                      </span>
                    </span>

                    {/* Comissão */}
                    <span className="text-xs text-gray-500 hidden md:block">
                      {membro.comissao_padrao_pct}% comissão
                    </span>

                    {/* Actions dropdown */}
                    <div className="relative group">
                      <button className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/10 bg-[#111] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        {/* Alterar role */}
                        {['admin', 'supervisor', 'corretor'].filter(r => r !== membro.role).map((role) => (
                          <button
                            key={role}
                            onClick={async () => {
                              const res = await updateMembroRole(membro.id, role as MembroEquipe['role']);
                              if (res.success) {
                                toast.success(`Função alterada para ${role}`);
                                const updated = await getEquipe();
                                setEquipe(updated);
                              } else {
                                toast.error(res.error || 'Erro');
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 first:rounded-t-lg"
                          >
                            Tornar {role === 'admin' ? 'Admin' : role === 'supervisor' ? 'Supervisor' : 'Corretor'}
                          </button>
                        ))}
                        <div className="border-t border-white/5" />
                        <button
                          onClick={async () => {
                            const res = await toggleMembroAtivo(membro.id, !membro.ativo);
                            if (res.success) {
                              toast.success(membro.ativo ? 'Acesso desativado' : 'Acesso reativado');
                              const updated = await getEquipe();
                              setEquipe(updated);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-white/5"
                        >
                          {membro.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Remover ${membro.nome} da equipe?`)) return;
                            const res = await removerMembro(membro.id);
                            if (res.success) {
                              toast.success('Membro removido');
                              setEquipe(prev => prev.filter(m => m.id !== membro.id));
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 last:rounded-b-lg"
                        >
                          Remover da equipe
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {equipe.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-12 text-center">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum membro na equipe</p>
                <p className="text-sm text-gray-600 mt-1">Convide o primeiro corretor para começar</p>
              </div>
            )}
          </div>

          {/* Permissões por função */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#D4AF37]" /> Permissões por Função
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <PermissionCard
                role="Administrador"
                cor="text-[#D4AF37]"
                permissions={[
                  'Acesso total ao sistema',
                  'Gerenciar equipe e convites',
                  'Configurar pipelines e integrações',
                  'Relatórios financeiros completos',
                ]}
              />
              <PermissionCard
                role="Supervisor"
                cor="text-purple-400"
                permissions={[
                  'Gerenciar deals e contatos',
                  'Ver relatórios da equipe',
                  'Configurar pipelines',
                  'Não pode gerenciar membros',
                ]}
              />
              <PermissionCard
                role="Corretor"
                cor="text-gray-400"
                permissions={[
                  'Criar e gerenciar seus deals',
                  'Adicionar contatos e empresas',
                  'Ver relatórios pessoais',
                  'Acesso ao portal do corretor',
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {activeGuide ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-[#D4AF37]/30 bg-[#0a0a0a] p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{activeGuide.name}</h3>
                <p className="mt-1 text-sm text-gray-400">{activeGuide.description}</p>
              </div>
              <button
                onClick={() => setActiveGuide(null)}
                className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {activeGuide.tutorial.map((step, index) => (
                <div key={`${activeGuide.id}-${index}`} className="rounded-lg border border-white/10 bg-[#111] p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-xs font-semibold text-[#D4AF37]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{step.title}</p>
                      <p className="mt-1 text-sm text-gray-400">{step.description}</p>
                      {step.link ? (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:text-[#F6E05E] transition-colors"
                        >
                          Abrir documentação oficial
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3 text-xs text-gray-300">
              Depois de preencher os campos, clique em <span className="font-semibold text-white">Salvar</span> no topo da página para ativar a integração.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PermissionCard({ role, cor, permissions }: { role: string; cor: string; permissions: string[] }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <h4 className={`font-medium ${cor}`}>{role}</h4>
      <ul className="space-y-1.5">
        {permissions.map((p, i) => (
          <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
            <span className="text-[#D4AF37] mt-0.5">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
