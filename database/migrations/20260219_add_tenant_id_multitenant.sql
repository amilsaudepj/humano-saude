-- ============================================================
-- MULTI-TENANT: Adiciona tenant_id nas tabelas core + RLS
--
-- v4 — Reescrita baseada em diagnóstico real do banco:
--   Tabelas CONFIRMADAS como existentes via API:
--     corretores, insurance_leads, comissoes, tarefas
--     crm_contacts, crm_companies, crm_deals
--   Tabelas NÃO existentes (omitidas):
--     propostas, portal_client_accounts, crm_leads, documentos_adesao
--
-- Estratégia:
--   - ADD COLUMN IF NOT EXISTS (sintaxe direta, sem DO blocks)
--   - UPDATE + ALTER SET NOT NULL + DEFAULT em sequência
--   - CREATE INDEX IF NOT EXISTS
--   - DROP POLICY IF EXISTS antes de CREATE POLICY
-- ============================================================

-- ─── PASSO 1: tenant_id em corretores ───────────────────────
ALTER TABLE corretores
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE corretores
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

ALTER TABLE corretores
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

CREATE INDEX IF NOT EXISTS idx_corretores_tenant ON corretores(tenant_id);

-- ─── PASSO 2: funções RLS ────────────────────────────────────

-- Retorna o tenant_id do corretor autenticado
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT c.tenant_id INTO v_tenant_id
  FROM corretores c
  WHERE c.id = auth.uid()
  LIMIT 1;
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verifica se o usuário atual é Super-Admin (tenant master)
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM corretores c
    JOIN tenants t ON t.id = c.tenant_id
    WHERE c.id = auth.uid()
      AND t.is_master = true
      AND c.role IN ('administrador', 'admin')
  ) INTO v_result;
  RETURN COALESCE(v_result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── PASSO 3: RLS em corretores ─────────────────────────────
ALTER TABLE corretores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "corretores_tenant_isolation" ON corretores;
CREATE POLICY "corretores_tenant_isolation"
  ON corretores FOR SELECT
  USING (
    tenant_id = get_current_tenant_id()
    OR is_master_admin()
    OR auth.uid() = id
  );

DROP POLICY IF EXISTS "service_role_full_corretores" ON corretores;
CREATE POLICY "service_role_full_corretores"
  ON corretores FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ─── PASSO 4: insurance_leads ───────────────────────────────
ALTER TABLE insurance_leads
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE insurance_leads
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

ALTER TABLE insurance_leads
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON insurance_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON insurance_leads(tenant_id, status);

ALTER TABLE insurance_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_leads" ON insurance_leads;
CREATE POLICY "service_role_full_leads"
  ON insurance_leads FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "leads_tenant_isolation" ON insurance_leads;
CREATE POLICY "leads_tenant_isolation"
  ON insurance_leads FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR is_master_admin());

DROP POLICY IF EXISTS "leads_tenant_insert" ON insurance_leads;
CREATE POLICY "leads_tenant_insert"
  ON insurance_leads FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_master_admin());

DROP POLICY IF EXISTS "leads_tenant_update" ON insurance_leads;
CREATE POLICY "leads_tenant_update"
  ON insurance_leads FOR UPDATE
  USING (tenant_id = get_current_tenant_id() OR is_master_admin());

-- ─── PASSO 5: comissoes ──────────────────────────────────────
ALTER TABLE comissoes
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE comissoes
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

ALTER TABLE comissoes
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

CREATE INDEX IF NOT EXISTS idx_comissoes_tenant ON comissoes(tenant_id);

ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_comissoes" ON comissoes;
CREATE POLICY "service_role_full_comissoes"
  ON comissoes FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "comissoes_tenant_isolation" ON comissoes;
CREATE POLICY "comissoes_tenant_isolation"
  ON comissoes FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_master_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_master_admin());

-- ─── PASSO 6: tarefas ────────────────────────────────────────
ALTER TABLE tarefas
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE tarefas
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

ALTER TABLE tarefas
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

CREATE INDEX IF NOT EXISTS idx_tarefas_tenant ON tarefas(tenant_id);

ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_tarefas" ON tarefas;
CREATE POLICY "service_role_full_tarefas"
  ON tarefas FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tarefas_tenant_isolation" ON tarefas;
CREATE POLICY "tarefas_tenant_isolation"
  ON tarefas FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_master_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_master_admin());

-- ─── PASSO 7: crm_contacts ───────────────────────────────────
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE crm_contacts
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

ALTER TABLE crm_contacts
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant ON crm_contacts(tenant_id);

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_crm_contacts" ON crm_contacts;
CREATE POLICY "service_role_full_crm_contacts"
  ON crm_contacts FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_contacts_tenant_isolation" ON crm_contacts;
CREATE POLICY "crm_contacts_tenant_isolation"
  ON crm_contacts FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_master_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_master_admin());

-- ─── PASSO 8: crm_companies ──────────────────────────────────
ALTER TABLE crm_companies
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE crm_companies
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

ALTER TABLE crm_companies
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

CREATE INDEX IF NOT EXISTS idx_crm_companies_tenant ON crm_companies(tenant_id);

ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_crm_companies" ON crm_companies;
CREATE POLICY "service_role_full_crm_companies"
  ON crm_companies FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_companies_tenant_isolation" ON crm_companies;
CREATE POLICY "crm_companies_tenant_isolation"
  ON crm_companies FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_master_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_master_admin());

-- ─── PASSO 9: crm_deals ──────────────────────────────────────
ALTER TABLE crm_deals
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

UPDATE crm_deals
  SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

ALTER TABLE crm_deals
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

CREATE INDEX IF NOT EXISTS idx_crm_deals_tenant ON crm_deals(tenant_id);

ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_crm_deals" ON crm_deals;
CREATE POLICY "service_role_full_crm_deals"
  ON crm_deals FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crm_deals_tenant_isolation" ON crm_deals;
CREATE POLICY "crm_deals_tenant_isolation"
  ON crm_deals FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_master_admin())
  WITH CHECK (tenant_id = get_current_tenant_id() OR is_master_admin());

-- ─── VIEW: tenant_summary (painel Super-Admin) ───────────────
DROP VIEW IF EXISTS tenant_summary;
CREATE VIEW tenant_summary AS
SELECT
  t.id,
  t.name,
  t.slug,
  t.primary_color,
  t.logo_url,
  t.is_active,
  t.plan,
  COUNT(DISTINCT c.id)  AS total_corretores,
  COUNT(DISTINCT l.id)  AS total_leads,
  t.created_at
FROM tenants t
LEFT JOIN corretores       c ON c.tenant_id = t.id
LEFT JOIN insurance_leads  l ON l.tenant_id = t.id
GROUP BY t.id;

COMMENT ON VIEW tenant_summary IS 'Resumo consolidado por tenant para o painel do Super-Admin';
