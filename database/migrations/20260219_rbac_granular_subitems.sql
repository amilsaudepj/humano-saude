-- ═══════════════════════════════════════════════════════════
-- Migration: RBAC Granular Sub-items
-- Data: 2026-02-19
-- Descrição: Expande o JSONB de permissões para incluir chaves
--            granulares de sub-itens dentro de cada seção de
--            navegação (comercial, marketing, operações, etc.)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Atualizar a função get_default_permissions() ──────
CREATE OR REPLACE FUNCTION get_default_permissions(p_role TEXT DEFAULT 'corretor')
RETURNS JSONB AS $$
BEGIN
  IF p_role = 'administrador' THEN
    RETURN '{
      "nav_home": true, "nav_comercial": true, "nav_marketing": true,
      "nav_social_flow": true, "nav_ia_automacao": true, "nav_operacoes": true,
      "nav_comunicacao": true, "nav_financeiro": true, "nav_configuracoes": true,

      "nav_comercial_pipeline": true, "nav_comercial_leads": true,
      "nav_comercial_crm": true, "nav_comercial_crm_contatos": true,
      "nav_comercial_crm_empresas": true, "nav_comercial_cotacoes": true,
      "nav_comercial_propostas": true, "nav_comercial_propostas_fila": true,
      "nav_comercial_propostas_ia": true, "nav_comercial_propostas_manual": true,
      "nav_comercial_contratos": true, "nav_comercial_vendas": true,
      "nav_comercial_planos": true, "nav_comercial_crm_analytics": true,

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
      "nav_ops_treinamento": true,

      "nav_com_whatsapp": true, "nav_com_chat": true,
      "nav_com_email": true, "nav_com_notificacoes": true,

      "nav_fin_visao": true, "nav_fin_producao": true,
      "nav_fin_comissoes": true, "nav_fin_faturamento": true,

      "nav_config_geral": true, "nav_config_apis": true,
      "nav_config_usuarios": true, "nav_config_perfil": true,
      "nav_config_seguranca": true,

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

      "nav_comercial_pipeline": false, "nav_comercial_leads": true,
      "nav_comercial_crm": true, "nav_comercial_crm_contatos": true,
      "nav_comercial_crm_empresas": true, "nav_comercial_cotacoes": true,
      "nav_comercial_propostas": false, "nav_comercial_propostas_fila": false,
      "nav_comercial_propostas_ia": false, "nav_comercial_propostas_manual": false,
      "nav_comercial_contratos": false, "nav_comercial_vendas": false,
      "nav_comercial_planos": false, "nav_comercial_crm_analytics": false,

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
      "nav_ops_treinamento": false,

      "nav_com_whatsapp": true, "nav_com_chat": true,
      "nav_com_email": true, "nav_com_notificacoes": true,

      "nav_fin_visao": false, "nav_fin_producao": false,
      "nav_fin_comissoes": false, "nav_fin_faturamento": false,

      "nav_config_geral": false, "nav_config_apis": false,
      "nav_config_usuarios": false, "nav_config_perfil": false,
      "nav_config_seguranca": false,

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

      "nav_comercial_pipeline": false, "nav_comercial_leads": false,
      "nav_comercial_crm": false, "nav_comercial_crm_contatos": false,
      "nav_comercial_crm_empresas": false, "nav_comercial_cotacoes": false,
      "nav_comercial_propostas": false, "nav_comercial_propostas_fila": false,
      "nav_comercial_propostas_ia": false, "nav_comercial_propostas_manual": false,
      "nav_comercial_contratos": false, "nav_comercial_vendas": false,
      "nav_comercial_planos": false, "nav_comercial_crm_analytics": false,

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
      "nav_ops_treinamento": false,

      "nav_com_whatsapp": true, "nav_com_chat": true,
      "nav_com_email": true, "nav_com_notificacoes": true,

      "nav_fin_visao": false, "nav_fin_producao": false,
      "nav_fin_comissoes": false, "nav_fin_faturamento": false,

      "nav_config_geral": false, "nav_config_apis": false,
      "nav_config_usuarios": false, "nav_config_perfil": false,
      "nav_config_seguranca": false,

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
      "nav_social_flow": false, "nav_ia_automacao": false, "nav_operacoes": false,
      "nav_comunicacao": true, "nav_financeiro": true, "nav_configuracoes": false,

      "nav_comercial_pipeline": true, "nav_comercial_leads": true,
      "nav_comercial_crm": true, "nav_comercial_crm_contatos": true,
      "nav_comercial_crm_empresas": false, "nav_comercial_cotacoes": true,
      "nav_comercial_propostas": true, "nav_comercial_propostas_fila": true,
      "nav_comercial_propostas_ia": false, "nav_comercial_propostas_manual": true,
      "nav_comercial_contratos": false, "nav_comercial_vendas": false,
      "nav_comercial_planos": true, "nav_comercial_crm_analytics": false,

      "nav_mkt_geral": false, "nav_mkt_google": false, "nav_mkt_meta": false,
      "nav_mkt_tiktok": false,

      "nav_sf_dashboard": false, "nav_sf_composer": false, "nav_sf_calendario": false,
      "nav_sf_biblioteca": false, "nav_sf_aprovacao": false, "nav_sf_connect": false,
      "nav_sf_analytics": false,

      "nav_ia_performance": false, "nav_ia_regras": false, "nav_ia_insights": false,
      "nav_ia_scanner": false, "nav_ia_automacoes": false, "nav_ia_workflows": false,

      "nav_ops_clientes": false, "nav_ops_clientes_portal": false,
      "nav_ops_documentos": false, "nav_ops_tarefas": false,
      "nav_ops_corretores": false, "nav_ops_indicacoes": false,
      "nav_ops_treinamento": false,

      "nav_com_whatsapp": true, "nav_com_chat": true,
      "nav_com_email": true, "nav_com_notificacoes": true,

      "nav_fin_visao": true, "nav_fin_producao": true,
      "nav_fin_comissoes": true, "nav_fin_faturamento": false,

      "nav_config_geral": false, "nav_config_apis": false,
      "nav_config_usuarios": false, "nav_config_perfil": false,
      "nav_config_seguranca": false,

      "action_create_lead": true, "action_edit_lead": true,
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


-- ─── 2. Atualizar permissões existentes: merge com novas chaves ───
-- Para cada corretor, merge novas chaves (sem sobrescrever as existentes)
-- usando o template do cargo como base para as chaves novas.
UPDATE corretores
SET permissions = (
  get_default_permissions(COALESCE(role, 'corretor')) || permissions
)
WHERE permissions IS NOT NULL;

-- Para corretores sem permissions ainda, aplicar o template completo
UPDATE corretores
SET permissions = get_default_permissions(COALESCE(role, 'corretor'))
WHERE permissions IS NULL;


-- ─── 3. Remover chaves antigas que não existem mais ───────
-- As chaves antigas (nav_leads, nav_crm, nav_propostas, nav_calculadora,
-- nav_corretores, nav_usuarios) foram substituídas pelas granulares.
UPDATE corretores
SET permissions = permissions
  - 'nav_leads'
  - 'nav_crm'
  - 'nav_propostas'
  - 'nav_calculadora'
  - 'nav_corretores'
  - 'nav_usuarios'
WHERE permissions IS NOT NULL
  AND (
    permissions ? 'nav_leads'
    OR permissions ? 'nav_crm'
    OR permissions ? 'nav_propostas'
    OR permissions ? 'nav_calculadora'
    OR permissions ? 'nav_corretores'
    OR permissions ? 'nav_usuarios'
  );
