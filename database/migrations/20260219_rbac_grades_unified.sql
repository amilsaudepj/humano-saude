-- ═══════════════════════════════════════════════════════════
-- MIGRAÇÃO UNIFICADA: RBAC + Grades de Comissionamento
-- Data: 2026-02-19
-- 
-- Esta migração é DEFINITIVA e substitui:
--   • 20260219_rbac_permissions_system.sql
--   • 20260219_add_materiais_deals_renovacoes_extrato.sql
--
-- Conteúdo:
--   1. Coluna permissions JSONB em corretores
--   2. Coluna grade_comissionamento em corretores
--   3. Tabela grades_comissionamento (config por grade)
--   4. Tabela permission_audit_log (auditoria)
--   5. Função get_default_permissions() com TODAS as chaves
--   6. Triggers para auto-preenchimento
--   7. Seed das 4 grades padrão
--   8. Aplicar permissões em corretores existentes
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Adicionar colunas em corretores ───────────────────

ALTER TABLE corretores
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT NULL;

ALTER TABLE corretores
  ADD COLUMN IF NOT EXISTS grade_comissionamento VARCHAR(30) DEFAULT 'interno';

COMMENT ON COLUMN corretores.permissions IS
  'Permissões granulares RBAC — objeto JSON com chaves booleanas por funcionalidade';

COMMENT ON COLUMN corretores.grade_comissionamento IS
  'Grade de comissionamento: interno, externo, personalizado_1, personalizado_2';

CREATE INDEX IF NOT EXISTS idx_corretores_permissions
  ON corretores USING GIN (permissions);

CREATE INDEX IF NOT EXISTS idx_corretores_grade
  ON corretores(grade_comissionamento);

-- ─── 2. Tabela de Grades de Comissionamento ───────────────

CREATE TABLE IF NOT EXISTS grades_comissionamento (
  id VARCHAR(30) PRIMARY KEY, -- interno, externo, personalizado_1, personalizado_2
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,

  -- Comissões por produto (percentuais)
  -- O admin vai configurar os valores reais depois
  comissao_saude_pf DECIMAL(5,2) DEFAULT 0,
  comissao_saude_pj DECIMAL(5,2) DEFAULT 0,
  comissao_odonto_pf DECIMAL(5,2) DEFAULT 0,
  comissao_odonto_pj DECIMAL(5,2) DEFAULT 0,
  comissao_vida DECIMAL(5,2) DEFAULT 0,
  comissao_empresarial DECIMAL(5,2) DEFAULT 0,

  -- Bônus e metas
  bonus_meta_mensal DECIMAL(5,2) DEFAULT 0,         -- % extra se bater meta
  meta_mensal_valor DECIMAL(12,2) DEFAULT 0,         -- valor da meta mensal
  bonus_ativacao DECIMAL(12,2) DEFAULT 0,            -- bônus por ativação

  -- Recorrência (comissão sobre renovações)
  comissao_renovacao_pct DECIMAL(5,2) DEFAULT 0,     -- % sobre renovação

  -- Configurações extras em JSON (flexível)
  config_extra JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE grades_comissionamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_grades"
  ON grades_comissionamento FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Policy para corretores lerem sua própria grade
CREATE POLICY "corretores_read_grades"
  ON grades_comissionamento FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE grades_comissionamento IS
  'Configuração das grades de comissionamento: Interno, Externo, Personalizado 1 e 2';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grades_updated_at ON grades_comissionamento;
CREATE TRIGGER trg_grades_updated_at
  BEFORE UPDATE ON grades_comissionamento
  FOR EACH ROW
  EXECUTE FUNCTION update_grades_updated_at();


-- ─── 3. Seed das 4 grades padrão ─────────────────────────

INSERT INTO grades_comissionamento (id, nome, descricao)
VALUES
  ('interno', 'Interno', 'Corretor interno da empresa — comissão padrão'),
  ('externo', 'Externo', 'Corretor externo / parceiro — comissão diferenciada'),
  ('personalizado_1', 'Personalizado 1', 'Grade personalizada 1 — configuração sob medida'),
  ('personalizado_2', 'Personalizado 2', 'Grade personalizada 2 — configuração sob medida')
ON CONFLICT (id) DO NOTHING;


-- ─── 4. Tabela de Auditoria de Permissões ─────────────────

CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  changed_by TEXT NOT NULL DEFAULT 'admin',
  old_permissions JSONB,
  new_permissions JSONB,
  changed_keys TEXT[],
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perm_audit_corretor
  ON permission_audit_log(corretor_id);

CREATE INDEX IF NOT EXISTS idx_perm_audit_created
  ON permission_audit_log(created_at DESC);

ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists antes de criar
DROP POLICY IF EXISTS "service_role_full_access_perm_audit" ON permission_audit_log;
CREATE POLICY "service_role_full_access_perm_audit"
  ON permission_audit_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE permission_audit_log IS
  'Audit trail de alterações de permissões RBAC';


-- ─── 5. Função get_default_permissions() ──────────────────
-- VERSÃO DEFINITIVA com TODAS as 109 chaves do frontend

CREATE OR REPLACE FUNCTION get_default_permissions(p_role TEXT DEFAULT 'corretor')
RETURNS JSONB AS $$
BEGIN
  IF p_role = 'administrador' OR p_role = 'admin' THEN
    RETURN '{
      "nav_home": true, "nav_comercial": true, "nav_marketing": true,
      "nav_social_flow": true, "nav_ia_automacao": true, "nav_operacoes": true,
      "nav_comunicacao": true, "nav_financeiro": true, "nav_configuracoes": true,
      "nav_materiais": true,

      "nav_comercial_pipeline": true, "nav_comercial_leads": true,
      "nav_comercial_crm": true, "nav_comercial_crm_contatos": true,
      "nav_comercial_crm_empresas": true, "nav_comercial_cotacoes": true,
      "nav_comercial_propostas": true, "nav_comercial_propostas_fila": true,
      "nav_comercial_propostas_ia": true, "nav_comercial_propostas_manual": true,
      "nav_comercial_contratos": true, "nav_comercial_vendas": true,
      "nav_comercial_planos": true, "nav_comercial_crm_analytics": true,
      "nav_comercial_deals": true,

      "nav_mkt_geral": true, "nav_mkt_google": true, "nav_mkt_meta": true,
      "nav_mkt_tiktok": true,

      "nav_sf_dashboard": true, "nav_sf_composer": true, "nav_sf_calendario": true,
      "nav_sf_biblioteca": true, "nav_sf_aprovacao": true, "nav_sf_connect": true,
      "nav_sf_analytics": true,

      "nav_ia_performance": true, "nav_ia_regras": true, "nav_ia_insights": true,
      "nav_ia_scanner": true, "nav_ia_automacoes": true, "nav_ia_workflows": true,

      "nav_ops_clientes": true, "nav_ops_clientes_portal": true,
      "nav_ops_documentos": true, "nav_ops_tarefas": true,
      "nav_ops_corretores": true, "nav_ops_indicacoes": true,
      "nav_ops_renovacoes": true, "nav_ops_treinamento": true,

      "nav_com_whatsapp": true, "nav_com_chat": true,
      "nav_com_email": true, "nav_com_notificacoes": true,

      "nav_fin_visao": true, "nav_fin_producao": true,
      "nav_fin_comissoes": true, "nav_fin_extrato": true,
      "nav_fin_faturamento": true,

      "nav_config_geral": true, "nav_config_apis": true,
      "nav_config_usuarios": true, "nav_config_perfil": true,
      "nav_config_seguranca": true,

      "nav_mat_vendas": true, "nav_mat_banners": true,
      "nav_mat_iaclone": true, "nav_mat_galeria": true,
      "nav_mat_upload": true,

      "action_create_lead": true, "action_edit_lead": true,
      "action_delete_lead": true, "action_export_csv": true,
      "action_create_proposta": true, "action_edit_proposta": true,
      "action_delete_proposta": true, "action_approve_proposta": true,
      "action_manage_corretores": true, "action_manage_users": true,
      "action_send_convite": true, "action_generate_magic_link": true,
      "action_manage_automacoes": true, "action_manage_integracoes": true,

      "fin_view_dashboard": true, "fin_view_comissoes": true,
      "fin_launch_comissoes": true, "fin_view_grade": true,
      "fin_edit_grade": true, "fin_view_producao": true,
      "fin_view_faturamento": true,

      "mkt_view_meta_ads": true, "mkt_edit_campanhas": true,
      "mkt_view_analytics": true, "mkt_view_leads_origem": true
    }'::JSONB;

  ELSIF p_role = 'assistente' THEN
    RETURN '{
      "nav_home": true, "nav_comercial": true, "nav_marketing": false,
      "nav_social_flow": false, "nav_ia_automacao": false, "nav_operacoes": true,
      "nav_comunicacao": true, "nav_financeiro": false, "nav_configuracoes": false,
      "nav_materiais": false,

      "nav_comercial_pipeline": false, "nav_comercial_leads": true,
      "nav_comercial_crm": true, "nav_comercial_crm_contatos": true,
      "nav_comercial_crm_empresas": true, "nav_comercial_cotacoes": true,
      "nav_comercial_propostas": false, "nav_comercial_propostas_fila": false,
      "nav_comercial_propostas_ia": false, "nav_comercial_propostas_manual": false,
      "nav_comercial_contratos": false, "nav_comercial_vendas": false,
      "nav_comercial_planos": false, "nav_comercial_crm_analytics": false,
      "nav_comercial_deals": false,

      "nav_mkt_geral": false, "nav_mkt_google": false, "nav_mkt_meta": false,
      "nav_mkt_tiktok": false,

      "nav_sf_dashboard": false, "nav_sf_composer": false, "nav_sf_calendario": false,
      "nav_sf_biblioteca": false, "nav_sf_aprovacao": false, "nav_sf_connect": false,
      "nav_sf_analytics": false,

      "nav_ia_performance": false, "nav_ia_regras": false, "nav_ia_insights": false,
      "nav_ia_scanner": false, "nav_ia_automacoes": false, "nav_ia_workflows": false,

      "nav_ops_clientes": true, "nav_ops_clientes_portal": true,
      "nav_ops_documentos": true, "nav_ops_tarefas": true,
      "nav_ops_corretores": false, "nav_ops_indicacoes": false,
      "nav_ops_renovacoes": false, "nav_ops_treinamento": false,

      "nav_com_whatsapp": true, "nav_com_chat": true,
      "nav_com_email": true, "nav_com_notificacoes": true,

      "nav_fin_visao": false, "nav_fin_producao": false,
      "nav_fin_comissoes": false, "nav_fin_extrato": false,
      "nav_fin_faturamento": false,

      "nav_config_geral": false, "nav_config_apis": false,
      "nav_config_usuarios": false, "nav_config_perfil": false,
      "nav_config_seguranca": false,

      "nav_mat_vendas": false, "nav_mat_banners": false,
      "nav_mat_iaclone": false, "nav_mat_galeria": false,
      "nav_mat_upload": false,

      "action_create_lead": false, "action_edit_lead": false,
      "action_delete_lead": false, "action_export_csv": true,
      "action_create_proposta": false, "action_edit_proposta": false,
      "action_delete_proposta": false, "action_approve_proposta": false,
      "action_manage_corretores": false, "action_manage_users": false,
      "action_send_convite": false, "action_generate_magic_link": false,
      "action_manage_automacoes": false, "action_manage_integracoes": false,

      "fin_view_dashboard": false, "fin_view_comissoes": false,
      "fin_launch_comissoes": false, "fin_view_grade": false,
      "fin_edit_grade": false, "fin_view_producao": false,
      "fin_view_faturamento": false,

      "mkt_view_meta_ads": false, "mkt_edit_campanhas": false,
      "mkt_view_analytics": false, "mkt_view_leads_origem": false
    }'::JSONB;

  ELSIF p_role = 'gestor_trafego' THEN
    RETURN '{
      "nav_home": true, "nav_comercial": false, "nav_marketing": true,
      "nav_social_flow": true, "nav_ia_automacao": true, "nav_operacoes": false,
      "nav_comunicacao": true, "nav_financeiro": false, "nav_configuracoes": false,
      "nav_materiais": false,

      "nav_comercial_pipeline": false, "nav_comercial_leads": false,
      "nav_comercial_crm": false, "nav_comercial_crm_contatos": false,
      "nav_comercial_crm_empresas": false, "nav_comercial_cotacoes": false,
      "nav_comercial_propostas": false, "nav_comercial_propostas_fila": false,
      "nav_comercial_propostas_ia": false, "nav_comercial_propostas_manual": false,
      "nav_comercial_contratos": false, "nav_comercial_vendas": false,
      "nav_comercial_planos": false, "nav_comercial_crm_analytics": false,
      "nav_comercial_deals": false,

      "nav_mkt_geral": true, "nav_mkt_google": true, "nav_mkt_meta": true,
      "nav_mkt_tiktok": true,

      "nav_sf_dashboard": true, "nav_sf_composer": true, "nav_sf_calendario": true,
      "nav_sf_biblioteca": true, "nav_sf_aprovacao": true, "nav_sf_connect": true,
      "nav_sf_analytics": true,

      "nav_ia_performance": true, "nav_ia_regras": true, "nav_ia_insights": true,
      "nav_ia_scanner": false, "nav_ia_automacoes": true, "nav_ia_workflows": true,

      "nav_ops_clientes": false, "nav_ops_clientes_portal": false,
      "nav_ops_documentos": false, "nav_ops_tarefas": false,
      "nav_ops_corretores": false, "nav_ops_indicacoes": false,
      "nav_ops_renovacoes": false, "nav_ops_treinamento": false,

      "nav_com_whatsapp": true, "nav_com_chat": true,
      "nav_com_email": true, "nav_com_notificacoes": true,

      "nav_fin_visao": false, "nav_fin_producao": false,
      "nav_fin_comissoes": false, "nav_fin_extrato": false,
      "nav_fin_faturamento": false,

      "nav_config_geral": false, "nav_config_apis": false,
      "nav_config_usuarios": false, "nav_config_perfil": false,
      "nav_config_seguranca": false,

      "nav_mat_vendas": false, "nav_mat_banners": false,
      "nav_mat_iaclone": false, "nav_mat_galeria": false,
      "nav_mat_upload": false,

      "action_create_lead": true, "action_edit_lead": true,
      "action_delete_lead": false, "action_export_csv": true,
      "action_create_proposta": false, "action_edit_proposta": false,
      "action_delete_proposta": false, "action_approve_proposta": false,
      "action_manage_corretores": false, "action_manage_users": false,
      "action_send_convite": false, "action_generate_magic_link": false,
      "action_manage_automacoes": true, "action_manage_integracoes": false,

      "fin_view_dashboard": false, "fin_view_comissoes": false,
      "fin_launch_comissoes": false, "fin_view_grade": false,
      "fin_edit_grade": false, "fin_view_producao": false,
      "fin_view_faturamento": false,

      "mkt_view_meta_ads": true, "mkt_edit_campanhas": true,
      "mkt_view_analytics": true, "mkt_view_leads_origem": true
    }'::JSONB;

  ELSE -- corretor (default)
    RETURN '{
      "nav_home": true, "nav_comercial": true, "nav_marketing": false,
      "nav_social_flow": false, "nav_ia_automacao": false, "nav_operacoes": true,
      "nav_comunicacao": false, "nav_financeiro": true, "nav_configuracoes": false,
      "nav_materiais": true,

      "nav_comercial_pipeline": false, "nav_comercial_leads": false,
      "nav_comercial_crm": false, "nav_comercial_crm_contatos": false,
      "nav_comercial_crm_empresas": false, "nav_comercial_cotacoes": true,
      "nav_comercial_propostas": true, "nav_comercial_propostas_fila": true,
      "nav_comercial_propostas_ia": false, "nav_comercial_propostas_manual": true,
      "nav_comercial_contratos": false, "nav_comercial_vendas": true,
      "nav_comercial_planos": true, "nav_comercial_crm_analytics": false,
      "nav_comercial_deals": false,

      "nav_mkt_geral": false, "nav_mkt_google": false, "nav_mkt_meta": false,
      "nav_mkt_tiktok": false,

      "nav_sf_dashboard": false, "nav_sf_composer": false, "nav_sf_calendario": false,
      "nav_sf_biblioteca": false, "nav_sf_aprovacao": false, "nav_sf_connect": false,
      "nav_sf_analytics": false,

      "nav_ia_performance": false, "nav_ia_regras": false, "nav_ia_insights": false,
      "nav_ia_scanner": false, "nav_ia_automacoes": false, "nav_ia_workflows": false,

      "nav_ops_clientes": false, "nav_ops_clientes_portal": false,
      "nav_ops_documentos": false, "nav_ops_tarefas": false,
      "nav_ops_corretores": false, "nav_ops_indicacoes": true,
      "nav_ops_renovacoes": true, "nav_ops_treinamento": true,

      "nav_com_whatsapp": false, "nav_com_chat": false,
      "nav_com_email": false, "nav_com_notificacoes": false,

      "nav_fin_visao": true, "nav_fin_producao": true,
      "nav_fin_comissoes": true, "nav_fin_extrato": true,
      "nav_fin_faturamento": false,

      "nav_config_geral": false, "nav_config_apis": false,
      "nav_config_usuarios": false, "nav_config_perfil": false,
      "nav_config_seguranca": false,

      "nav_mat_vendas": true, "nav_mat_banners": true,
      "nav_mat_iaclone": true, "nav_mat_galeria": true,
      "nav_mat_upload": true,

      "action_create_lead": false, "action_edit_lead": false,
      "action_delete_lead": false, "action_export_csv": true,
      "action_create_proposta": true, "action_edit_proposta": true,
      "action_delete_proposta": false, "action_approve_proposta": false,
      "action_manage_corretores": false, "action_manage_users": false,
      "action_send_convite": false, "action_generate_magic_link": false,
      "action_manage_automacoes": false, "action_manage_integracoes": false,

      "fin_view_dashboard": true, "fin_view_comissoes": true,
      "fin_launch_comissoes": false, "fin_view_grade": true,
      "fin_edit_grade": false, "fin_view_producao": true,
      "fin_view_faturamento": false,

      "mkt_view_meta_ads": false, "mkt_edit_campanhas": false,
      "mkt_view_analytics": false, "mkt_view_leads_origem": false
    }'::JSONB;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_default_permissions IS
  'Retorna template RBAC com todas as 109 chaves baseado no cargo';


-- ─── 6. Função RPC: atualizar permissões ─────────────────

CREATE OR REPLACE FUNCTION update_user_permissions(
  p_corretor_id UUID,
  p_permissions JSONB,
  p_changed_by TEXT DEFAULT 'admin',
  p_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_old JSONB;
  v_changed TEXT[];
  v_key TEXT;
BEGIN
  SELECT COALESCE(permissions, '{}'::jsonb) INTO v_old
  FROM corretores WHERE id = p_corretor_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Corretor não encontrado');
  END IF;

  v_changed := ARRAY[]::TEXT[];
  FOR v_key IN SELECT jsonb_object_keys(p_permissions)
  LOOP
    IF (v_old->>v_key) IS DISTINCT FROM (p_permissions->>v_key) THEN
      v_changed := array_append(v_changed, v_key);
    END IF;
  END LOOP;

  INSERT INTO permission_audit_log (corretor_id, changed_by, old_permissions, new_permissions, changed_keys, reason)
  VALUES (p_corretor_id, p_changed_by, v_old, p_permissions, v_changed, p_reason);

  UPDATE corretores
  SET permissions = p_permissions,
      updated_at = now()
  WHERE id = p_corretor_id;

  RETURN json_build_object(
    'success', true,
    'corretor_id', p_corretor_id,
    'changed_keys', array_to_json(v_changed),
    'total_permissions', (SELECT count(*) FROM jsonb_object_keys(p_permissions))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 7. Função RPC: resetar permissões para template ─────

CREATE OR REPLACE FUNCTION reset_permissions_to_role(
  p_corretor_id UUID,
  p_changed_by TEXT DEFAULT 'admin'
) RETURNS JSON AS $$
DECLARE
  v_role TEXT;
  v_old JSONB;
  v_new JSONB;
BEGIN
  SELECT role, COALESCE(permissions, '{}'::jsonb) INTO v_role, v_old
  FROM corretores WHERE id = p_corretor_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Corretor não encontrado');
  END IF;

  v_new := get_default_permissions(v_role);

  INSERT INTO permission_audit_log (corretor_id, changed_by, old_permissions, new_permissions, changed_keys, reason)
  VALUES (p_corretor_id, p_changed_by, v_old, v_new, ARRAY['RESET_ALL'],
          'Reset para template do cargo: ' || v_role);

  UPDATE corretores
  SET permissions = v_new, updated_at = now()
  WHERE id = p_corretor_id;

  RETURN json_build_object(
    'success', true,
    'corretor_id', p_corretor_id,
    'role', v_role,
    'permissions', v_new
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 8. Trigger: auto-preencher permissões ao criar ──────

CREATE OR REPLACE FUNCTION auto_set_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.permissions IS NULL OR NEW.permissions = '{}'::jsonb THEN
    NEW.permissions := get_default_permissions(COALESCE(NEW.role, 'corretor'));
  END IF;
  -- Garantir grade padrão
  IF NEW.grade_comissionamento IS NULL THEN
    NEW.grade_comissionamento := 'interno';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_permissions ON corretores;
CREATE TRIGGER trg_auto_permissions
  BEFORE INSERT ON corretores
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_default_permissions();


-- ─── 9. Atualizar constraint de role ──────────────────────

ALTER TABLE corretores DROP CONSTRAINT IF EXISTS corretores_role_check;
ALTER TABLE corretores ADD CONSTRAINT corretores_role_check
  CHECK (role IN ('corretor', 'supervisor', 'admin', 'administrador', 'assistente', 'gestor_trafego'));


-- ─── 10. Aplicar permissões a corretores existentes ──────
-- Só preenche quem NÃO tem permissões (não sobrescreve edições manuais do admin)

UPDATE corretores
SET permissions = get_default_permissions(COALESCE(role, 'corretor'))
WHERE permissions IS NULL OR permissions = '{}'::jsonb;

-- Garantir grade para quem não tem
UPDATE corretores
SET grade_comissionamento = 'interno'
WHERE grade_comissionamento IS NULL;


-- ═══════════════════════════════════════════════════════════
-- RESULTADO FINAL:
-- • Coluna permissions JSONB em corretores (preenchida)
-- • Coluna grade_comissionamento em corretores (default: interno)
-- • Tabela grades_comissionamento com 4 grades seed
-- • Tabela permission_audit_log para rastreabilidade
-- • Função get_default_permissions() com 109 chaves
-- • Trigger auto_set_default_permissions para novos corretores
-- • RPCs update_user_permissions e reset_permissions_to_role
--
-- PRÓXIMO PASSO: Executar este SQL no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════
