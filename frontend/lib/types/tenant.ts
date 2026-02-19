// ============================================================
// TIPOS: Multi-Tenant
// ============================================================

export type TenantPlan = 'trial' | 'standard' | 'pro' | 'enterprise';

export interface TenantFeatures {
  ai_whatsapp: boolean;
  social_flow: boolean;
  cotacoes: boolean;
  meta_ads: boolean;
  crm_advanced: boolean;
  tenant_switcher: boolean;
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
