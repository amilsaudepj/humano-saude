-- ============================================================
-- MULTI-TENANT: Tabela tenants + seed inicial
--
-- Arquitetura:
--   1. Tabela tenants — cada corretora parceira é um "inquilino"
--   2. Tabela tenant_domain_map — domínios customizados por tenant
--   3. Seed: Humano Saúde (master), Arcfy, Mattos
--
-- Regra de negócio:
--   - slug é o identificador público (URL-safe, único)
--   - domain é o domínio customizado opcional (ex: portal.arcfy.com.br)
--   - primary_color / secondary_color controlam o white-label visual
--   - pixel_id_fb / tag_manager_id são carregados APENAS na LP do tenant
--   - is_master = true → Super-Admin da Humano Saúde (acesso global)
-- ============================================================

-- 1. Tabela de tenants (corretoras parceiras)
CREATE TABLE IF NOT EXISTS tenants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  domain           TEXT UNIQUE,
  logo_url         TEXT,
  favicon_url      TEXT,
  primary_color    TEXT NOT NULL DEFAULT '#D4AF37',
  secondary_color  TEXT NOT NULL DEFAULT '#050505',
  accent_color     TEXT NOT NULL DEFAULT '#F6E05E',

  -- Rastreamento (carregado dinamicamente por tenant)
  pixel_id_fb      TEXT,
  tag_manager_id   TEXT,
  ga_measurement_id TEXT,

  -- Configurações operacionais
  is_active        BOOLEAN NOT NULL DEFAULT true,
  is_master        BOOLEAN NOT NULL DEFAULT false, -- Apenas Humano Saúde
  plan             TEXT NOT NULL DEFAULT 'standard' CHECK (plan IN ('trial', 'standard', 'pro', 'enterprise')),
  max_corretores   INT NOT NULL DEFAULT 10,
  features         JSONB NOT NULL DEFAULT '{}',

  -- Contato do gestor da corretora
  gestor_email     TEXT,
  gestor_phone     TEXT,
  cnpj             TEXT,

  -- White-label texto
  support_email    TEXT,
  support_phone    TEXT,
  site_url         TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tenants IS 'Inquilinos do sistema multi-tenant — cada corretora parceira da Humano Saúde';
COMMENT ON COLUMN tenants.slug IS 'Identificador URL-safe único (ex: arcfy, mattos, humano)';
COMMENT ON COLUMN tenants.is_master IS 'Tenant mestre (Humano Saúde) tem acesso de visualização a todos os outros tenants';
COMMENT ON COLUMN tenants.features IS 'Features flags JSONB: {"ai_whatsapp": true, "social_flow": false, "cotacoes": true}';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active) WHERE is_active = true;

-- 2. Mapa de domínios customizados (1 tenant pode ter N domínios)
CREATE TABLE IF NOT EXISTS tenant_domains (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain     TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  ssl_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain);

COMMENT ON TABLE tenant_domains IS 'Domínios customizados associados a cada tenant (ex: portal.arcfy.com.br)';

-- 3. Trigger: updated_at automático
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_tenants_updated_at();

-- 4. RLS — Tenants são lidos publicamente (LP precisa), escritos apenas por service_role
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- Leitura pública de tenants ativos (LPs e middleware precisam sem autenticação)
DROP POLICY IF EXISTS "public_read_active_tenants" ON tenants;
CREATE POLICY "public_read_active_tenants"
  ON tenants FOR SELECT
  USING (is_active = true);

-- Escrita apenas por service_role (admin do sistema)
DROP POLICY IF EXISTS "service_role_full_access_tenants" ON tenants;
CREATE POLICY "service_role_full_access_tenants"
  ON tenants FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_tenant_domains" ON tenant_domains;
CREATE POLICY "service_role_full_access_tenant_domains"
  ON tenant_domains FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_tenant_domains" ON tenant_domains;
CREATE POLICY "public_read_tenant_domains"
  ON tenant_domains FOR SELECT
  USING (true);

-- 5. Função RPC: buscar tenant por slug ou domínio (usada no middleware Edge)
CREATE OR REPLACE FUNCTION get_tenant_by_slug(p_slug TEXT)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  slug            TEXT,
  domain          TEXT,
  logo_url        TEXT,
  primary_color   TEXT,
  secondary_color TEXT,
  accent_color    TEXT,
  pixel_id_fb     TEXT,
  tag_manager_id  TEXT,
  ga_measurement_id TEXT,
  is_master       BOOLEAN,
  is_active       BOOLEAN,
  features        JSONB
) AS $$
  SELECT
    t.id, t.name, t.slug, t.domain, t.logo_url,
    t.primary_color, t.secondary_color, t.accent_color,
    t.pixel_id_fb, t.tag_manager_id, t.ga_measurement_id,
    t.is_master, t.is_active, t.features
  FROM tenants t
  WHERE t.slug = p_slug AND t.is_active = true
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_tenant_by_domain(p_domain TEXT)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  slug            TEXT,
  domain          TEXT,
  logo_url        TEXT,
  primary_color   TEXT,
  secondary_color TEXT,
  accent_color    TEXT,
  pixel_id_fb     TEXT,
  tag_manager_id  TEXT,
  ga_measurement_id TEXT,
  is_master       BOOLEAN,
  is_active       BOOLEAN,
  features        JSONB
) AS $$
  SELECT
    t.id, t.name, t.slug, t.domain, t.logo_url,
    t.primary_color, t.secondary_color, t.accent_color,
    t.pixel_id_fb, t.tag_manager_id, t.ga_measurement_id,
    t.is_master, t.is_active, t.features
  FROM tenants t
  LEFT JOIN tenant_domains td ON td.tenant_id = t.id
  WHERE (t.domain = p_domain OR td.domain = p_domain) AND t.is_active = true
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 6. SEED: Tenants iniciais
-- Humano Saúde (master — acesso global a todos os tenants)
INSERT INTO tenants (
  id, name, slug, domain,
  primary_color, secondary_color, accent_color,
  pixel_id_fb, tag_manager_id, ga_measurement_id,
  is_master, is_active, plan, max_corretores,
  features,
  gestor_email, site_url
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Humano Saúde',
  'humano',
  'humanosaude.com.br',
  '#D4AF37', '#050505', '#F6E05E',
  NULL, NULL, NULL,
  true, true, 'enterprise', 9999,
  '{"ai_whatsapp": true, "social_flow": true, "cotacoes": true, "meta_ads": true, "crm_advanced": true, "tenant_switcher": true}',
  'contato@humanosaude.com.br',
  'https://humanosaude.com.br'
) ON CONFLICT (slug) DO NOTHING;

-- Arcfy Corretora
INSERT INTO tenants (
  id, name, slug, domain,
  primary_color, secondary_color, accent_color,
  pixel_id_fb, tag_manager_id,
  is_master, is_active, plan, max_corretores,
  features,
  gestor_email, site_url
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Arcfy',
  'arcfy',
  'arcfy.com.br',
  '#1E40AF', '#0F172A', '#3B82F6',
  NULL, NULL,
  false, true, 'pro', 50,
  '{"ai_whatsapp": true, "social_flow": true, "cotacoes": true, "meta_ads": true, "crm_advanced": false}',
  'gestor@arcfy.com.br',
  'https://arcfy.com.br'
) ON CONFLICT (slug) DO NOTHING;

-- Mattos Corretora
INSERT INTO tenants (
  id, name, slug, domain,
  primary_color, secondary_color, accent_color,
  pixel_id_fb, tag_manager_id,
  is_master, is_active, plan, max_corretores,
  features,
  gestor_email, site_url
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Mattos',
  'mattos',
  NULL,
  '#7C3AED', '#0D0D1A', '#A78BFA',
  NULL, NULL,
  false, true, 'standard', 20,
  '{"ai_whatsapp": false, "social_flow": false, "cotacoes": true, "meta_ads": false, "crm_advanced": false}',
  'gestor@mattos.com.br',
  NULL
) ON CONFLICT (slug) DO NOTHING;
