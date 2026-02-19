// ============================================================
// TIPOS: Multi-Tenant
// ============================================================

export type TenantPlan = 'trial' | 'standard' | 'pro' | 'enterprise';

export interface TenantFeatures {
  // ── Módulos principais (por grupo do sidebar) ──────────────
  /** Grupo Comercial: Leads, Pipeline, CRM, Cotações, Contratos, Vendas, Planos */
  modulo_comercial: boolean;
  /** Cotações online (sub-feature do comercial) */
  cotacoes: boolean;
  /** CRM avançado: deals, analytics, empresas */
  crm_advanced: boolean;
  /** Grupo Materiais: banners, IA Clone, galeria, uploads */
  modulo_materiais: boolean;
  /** Grupo Marketing & Ads: métricas, cockpit, Meta Ads, TikTok, Google */
  modulo_marketing: boolean;
  /** Meta Ads — campanhas, criativos, cockpit */
  meta_ads: boolean;
  /** Social Flow — composer, calendário, biblioteca, aprovação */
  social_flow: boolean;
  /** Grupo IA & Automação: AI Performance, regras, insights, scanner, automações */
  modulo_ia: boolean;
  /** AI WhatsApp — disparo automático via WhatsApp */
  ai_whatsapp: boolean;
  /** Grupo Operações: clientes, documentos, tarefas, corretores, indicações, renovações, treinamento */
  modulo_operacoes: boolean;
  /** Grupo Comunicação: WhatsApp, Chat, Email, Notificações */
  modulo_comunicacao: boolean;
  /** Grupo Financeiro: comissões, produção, faturamento */
  modulo_financeiro: boolean;
  /** Seletor de tenant (trocar de corretora no painel) — apenas Super-Admin */
  tenant_switcher: boolean;
  /** Acesso ao painel de Tenants/Corretoras */
  modulo_tenants: boolean;
  [key: string]: boolean;
}

export interface Tenant {
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
  plan: TenantPlan;
  max_corretores: number;
  features: Partial<TenantFeatures>;
  gestor_email: string | null;
  support_email: string | null;
  support_phone: string | null;
  site_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  logo_url: string | null;
  is_active: boolean;
  plan: TenantPlan;
  total_corretores: number;
  total_leads: number;
  total_propostas: number;
  created_at: string;
}

// Tenant "fallback" da Humano Saúde — usado quando tenant_id é desconhecido
export const HUMANO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const DEFAULT_TENANT: Pick<Tenant, 'primary_color' | 'secondary_color' | 'accent_color'> = {
  primary_color: '#D4AF37',
  secondary_color: '#050505',
  accent_color: '#F6E05E',
};
