-- ============================================================
-- RBAC: Sistema de Permissões Granulares
--
-- Lógica:
--   1. Adiciona campo permissions JSONB na tabela corretores
--   2. Cria tabela permission_audit_log para rastreabilidade
--   3. Funções RPC para get/set/reset permissões
--   4. Trigger para preencher permissões default ao criar corretor
-- ============================================================

-- 1. Adicionar campo permissions JSONB em corretores
ALTER TABLE corretores
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN corretores.permissions IS 'Permissões granulares RBAC — chaves booleanas por funcionalidade';

CREATE INDEX IF NOT EXISTS idx_corretores_permissions ON corretores USING GIN (permissions);

-- 2. Tabela de auditoria de alterações de permissões
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id UUID NOT NULL REFERENCES corretores(id) ON DELETE CASCADE,
  changed_by TEXT NOT NULL DEFAULT 'admin',
  old_permissions JSONB,
  new_permissions JSONB,
  changed_keys TEXT[], -- Chaves que mudaram
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perm_audit_corretor ON permission_audit_log(corretor_id);
CREATE INDEX IF NOT EXISTS idx_perm_audit_created ON permission_audit_log(created_at DESC);

ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_perm_audit"
  ON permission_audit_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE permission_audit_log IS 'Audit trail de alterações de permissões RBAC';

-- 3. Função para obter template de permissões baseado no cargo
CREATE OR REPLACE FUNCTION get_default_permissions(p_role TEXT)
RETURNS JSONB AS $$
BEGIN
  CASE p_role
    -- ADMINISTRADOR: acesso total
    WHEN 'administrador', 'admin' THEN
      RETURN jsonb_build_object(
        'nav_home', true,
        'nav_leads', true,
        'nav_calculadora', true,
        'nav_propostas', true,
        'nav_financeiro', true,
        'nav_configuracoes', true,
        'nav_comercial', true,
        'nav_marketing', true,
        'nav_social_flow', true,
        'nav_ia_automacao', true,
        'nav_operacoes', true,
        'nav_comunicacao', true,
        'nav_corretores', true,
        'nav_crm', true,
        'nav_usuarios', true,
        'action_create_lead', true,
        'action_edit_lead', true,
        'action_delete_lead', true,
        'action_export_csv', true,
        'action_create_proposta', true,
        'action_edit_proposta', true,
        'action_delete_proposta', true,
        'action_approve_proposta', true,
        'action_manage_corretores', true,
        'action_manage_users', true,
        'action_send_convite', true,
        'action_generate_magic_link', true,
        'action_manage_automacoes', true,
        'action_manage_integracoes', true,
        'fin_view_dashboard', true,
        'fin_view_comissoes', true,
        'fin_launch_comissoes', true,
        'fin_view_grade', true,
        'fin_edit_grade', true,
        'fin_view_producao', true,
        'fin_view_faturamento', true,
        'mkt_view_meta_ads', true,
        'mkt_edit_campanhas', true,
        'mkt_view_analytics', true,
        'mkt_view_leads_origem', true
      );

    -- ASSISTENTE: somente leitura
    WHEN 'assistente' THEN
      RETURN jsonb_build_object(
        'nav_home', true,
        'nav_leads', true,
        'nav_calculadora', true,
        'nav_propostas', true,
        'nav_financeiro', false,
        'nav_configuracoes', false,
        'nav_comercial', true,
        'nav_marketing', false,
        'nav_social_flow', false,
        'nav_ia_automacao', false,
        'nav_operacoes', true,
        'nav_comunicacao', true,
        'nav_corretores', false,
        'nav_crm', true,
        'nav_usuarios', false,
        'action_create_lead', false,
        'action_edit_lead', false,
        'action_delete_lead', false,
        'action_export_csv', true,
        'action_create_proposta', false,
        'action_edit_proposta', false,
        'action_delete_proposta', false,
        'action_approve_proposta', false,
        'action_manage_corretores', false,
        'action_manage_users', false,
        'action_send_convite', false,
        'action_generate_magic_link', false,
        'action_manage_automacoes', false,
        'action_manage_integracoes', false,
        'fin_view_dashboard', false,
        'fin_view_comissoes', false,
        'fin_launch_comissoes', false,
        'fin_view_grade', false,
        'fin_edit_grade', false,
        'fin_view_producao', false,
        'fin_view_faturamento', false,
        'mkt_view_meta_ads', false,
        'mkt_edit_campanhas', false,
        'mkt_view_analytics', false,
        'mkt_view_leads_origem', false
      );

    -- GESTOR DE TRÁFEGO: marketing + ads, sem financeiro
    WHEN 'gestor_trafego' THEN
      RETURN jsonb_build_object(
        'nav_home', true,
        'nav_leads', true,
        'nav_calculadora', false,
        'nav_propostas', false,
        'nav_financeiro', false,
        'nav_configuracoes', false,
        'nav_comercial', false,
        'nav_marketing', true,
        'nav_social_flow', true,
        'nav_ia_automacao', true,
        'nav_operacoes', false,
        'nav_comunicacao', true,
        'nav_corretores', false,
        'nav_crm', false,
        'nav_usuarios', false,
        'action_create_lead', true,
        'action_edit_lead', true,
        'action_delete_lead', false,
        'action_export_csv', true,
        'action_create_proposta', false,
        'action_edit_proposta', false,
        'action_delete_proposta', false,
        'action_approve_proposta', false,
        'action_manage_corretores', false,
        'action_manage_users', false,
        'action_send_convite', false,
        'action_generate_magic_link', false,
        'action_manage_automacoes', true,
        'action_manage_integracoes', false,
        'fin_view_dashboard', false,
        'fin_view_comissoes', false,
        'fin_launch_comissoes', false,
        'fin_view_grade', false,
        'fin_edit_grade', false,
        'fin_view_producao', false,
        'fin_view_faturamento', false,
        'mkt_view_meta_ads', true,
        'mkt_edit_campanhas', true,
        'mkt_view_analytics', true,
        'mkt_view_leads_origem', true
      );

    -- CORRETOR: acesso padrão de vendas (sem painel admin)
    WHEN 'corretor' THEN
      RETURN jsonb_build_object(
        'nav_home', true,
        'nav_leads', true,
        'nav_calculadora', true,
        'nav_propostas', true,
        'nav_financeiro', true,
        'nav_configuracoes', false,
        'nav_comercial', true,
        'nav_marketing', false,
        'nav_social_flow', false,
        'nav_ia_automacao', false,
        'nav_operacoes', false,
        'nav_comunicacao', true,
        'nav_corretores', false,
        'nav_crm', true,
        'nav_usuarios', false,
        'action_create_lead', true,
        'action_edit_lead', true,
        'action_delete_lead', false,
        'action_export_csv', true,
        'action_create_proposta', true,
        'action_edit_proposta', true,
        'action_delete_proposta', false,
        'action_approve_proposta', false,
        'action_manage_corretores', false,
        'action_manage_users', false,
        'action_send_convite', false,
        'action_generate_magic_link', false,
        'action_manage_automacoes', false,
        'action_manage_integracoes', false,
        'fin_view_dashboard', true,
        'fin_view_comissoes', true,
        'fin_launch_comissoes', false,
        'fin_view_grade', true,
        'fin_edit_grade', false,
        'fin_view_producao', true,
        'fin_view_faturamento', false,
        'mkt_view_meta_ads', false,
        'mkt_edit_campanhas', false,
        'mkt_view_analytics', false,
        'mkt_view_leads_origem', false
      );

    ELSE
      -- Fallback: permissões mínimas
      RETURN jsonb_build_object(
        'nav_home', true,
        'nav_leads', false,
        'nav_calculadora', false,
        'nav_propostas', false,
        'nav_financeiro', false,
        'nav_configuracoes', false
      );
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_default_permissions IS 'Retorna template de permissões RBAC baseado no cargo';

-- 4. Função RPC: atualizar permissões de um corretor (chamada pelo admin)
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
  -- Buscar permissões atuais
  SELECT COALESCE(permissions, '{}'::jsonb) INTO v_old
  FROM corretores WHERE id = p_corretor_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Corretor não encontrado');
  END IF;

  -- Detectar chaves que mudaram
  v_changed := ARRAY[]::TEXT[];
  FOR v_key IN SELECT jsonb_object_keys(p_permissions)
  LOOP
    IF (v_old->>v_key) IS DISTINCT FROM (p_permissions->>v_key) THEN
      v_changed := array_append(v_changed, v_key);
    END IF;
  END LOOP;

  -- Salvar no audit log
  INSERT INTO permission_audit_log (corretor_id, changed_by, old_permissions, new_permissions, changed_keys, reason)
  VALUES (p_corretor_id, p_changed_by, v_old, p_permissions, v_changed, p_reason);

  -- Atualizar permissões (merge com existentes)
  UPDATE corretores
  SET permissions = COALESCE(permissions, '{}'::jsonb) || p_permissions,
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

COMMENT ON FUNCTION update_user_permissions IS 'Atualiza permissões RBAC de um corretor com audit trail';

-- 5. Função RPC: resetar permissões para o template do cargo atual
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

  -- Salvar no audit log
  INSERT INTO permission_audit_log (corretor_id, changed_by, old_permissions, new_permissions, changed_keys, reason)
  VALUES (p_corretor_id, p_changed_by, v_old, v_new, ARRAY['RESET_ALL'], 'Reset para template do cargo: ' || v_role);

  -- Atualizar
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

-- 6. Trigger: preencher permissões default ao criar corretor
CREATE OR REPLACE FUNCTION auto_set_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.permissions IS NULL OR NEW.permissions = '{}'::jsonb THEN
    NEW.permissions := get_default_permissions(COALESCE(NEW.role, 'corretor'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_permissions ON corretores;
CREATE TRIGGER trg_auto_permissions
  BEFORE INSERT ON corretores
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_default_permissions();

-- 7. Preencher permissões para corretores existentes que não têm
UPDATE corretores
SET permissions = get_default_permissions(COALESCE(role, 'corretor'))
WHERE permissions IS NULL OR permissions = '{}'::jsonb;

-- 8. Atualizar constraint de role para incluir novos cargos
-- Remover constraint antiga e criar nova
ALTER TABLE corretores DROP CONSTRAINT IF EXISTS corretores_role_check;
ALTER TABLE corretores ADD CONSTRAINT corretores_role_check
  CHECK (role IN ('corretor', 'supervisor', 'admin', 'administrador', 'assistente', 'gestor_trafego'));

-- ============================================================
-- COMENTÁRIOS FINAIS
-- ============================================================
-- • Campo permissions em corretores armazena o RBAC granular
-- • Templates por cargo servem como ponto de partida
-- • Admin pode sobrescrever qualquer permissão individualmente
-- • Audit log rastreia toda alteração com old/new/changed_keys
-- • Trigger garante que novos corretores recebem template automático
-- ============================================================
