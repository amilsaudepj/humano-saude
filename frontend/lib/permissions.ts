// ═══════════════════════════════════════════════════════════
// RBAC: Permissões granulares — tipos, constantes e templates
// ═══════════════════════════════════════════════════════════

// ─── Todas as chaves de permissão do sistema ──────────────
export const PERMISSION_KEYS = [
  // Navegação — seções principais
  'nav_home',
  'nav_comercial',
  'nav_marketing',
  'nav_social_flow',
  'nav_ia_automacao',
  'nav_operacoes',
  'nav_comunicacao',
  'nav_financeiro',
  'nav_configuracoes',
  'nav_materiais',
  // Navegação — sub-itens Comercial
  'nav_comercial_pipeline',
  'nav_comercial_leads',
  'nav_comercial_crm',
  'nav_comercial_crm_contatos',
  'nav_comercial_crm_empresas',
  'nav_comercial_cotacoes',
  'nav_comercial_propostas',
  'nav_comercial_propostas_fila',
  'nav_comercial_propostas_ia',
  'nav_comercial_propostas_manual',
  'nav_comercial_contratos',
  'nav_comercial_vendas',
  'nav_comercial_planos',
  'nav_comercial_crm_analytics',
  'nav_comercial_deals',
  // Navegação — sub-itens Marketing
  'nav_mkt_geral',
  'nav_mkt_google',
  'nav_mkt_meta',
  'nav_mkt_tiktok',
  // Navegação — sub-itens Social Flow
  'nav_sf_dashboard',
  'nav_sf_composer',
  'nav_sf_calendario',
  'nav_sf_biblioteca',
  'nav_sf_aprovacao',
  'nav_sf_connect',
  'nav_sf_analytics',
  // Navegação — sub-itens IA & Automação
  'nav_ia_performance',
  'nav_ia_regras',
  'nav_ia_insights',
  'nav_ia_scanner',
  'nav_ia_automacoes',
  'nav_ia_workflows',
  // Navegação — sub-itens Operações
  'nav_ops_clientes',
  'nav_ops_clientes_portal',
  'nav_ops_documentos',
  'nav_ops_tarefas',
  'nav_ops_corretores',
  'nav_ops_indicacoes',
  'nav_ops_renovacoes',
  'nav_ops_treinamento',
  'nav_ops_design_system_emails',
  // Navegação — sub-itens Comunicação
  'nav_com_whatsapp',
  'nav_com_chat',
  'nav_com_chat_permissoes',
  'nav_com_email',
  'nav_com_notificacoes',
  // Navegação — sub-itens Financeiro
  'nav_fin_visao',
  'nav_fin_producao',
  'nav_fin_comissoes',
  'nav_fin_extrato',
  'nav_fin_faturamento',
  // Navegação — sub-itens Configurações
  'nav_config_geral',
  'nav_config_apis',
  'nav_config_usuarios',
  'nav_config_perfil',
  'nav_config_seguranca',
  // Navegação — sub-itens Materiais
  'nav_mat_vendas',
  'nav_mat_banners',
  'nav_mat_iaclone',
  'nav_mat_galeria',
  'nav_mat_upload',
  // Ações
  'action_create_lead',
  'action_edit_lead',
  'action_delete_lead',
  'action_export_csv',
  'action_create_proposta',
  'action_edit_proposta',
  'action_delete_proposta',
  'action_approve_proposta',
  'action_manage_corretores',
  'action_manage_users',
  'action_send_convite',
  'action_generate_magic_link',
  'action_manage_automacoes',
  'action_manage_integracoes',
  // Financeiro (ações)
  'fin_view_dashboard',
  'fin_view_comissoes',
  'fin_launch_comissoes',
  'fin_view_grade',
  'fin_edit_grade',
  'fin_view_producao',
  'fin_view_faturamento',
  // Marketing (ações)
  'mkt_view_meta_ads',
  'mkt_edit_campanhas',
  'mkt_view_analytics',
  'mkt_view_leads_origem',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type UserPermissions = Record<PermissionKey, boolean>;

// ─── Sub-itens por seção de navegação ─────────────────────
export interface SubPermissionItem {
  key: PermissionKey;
  label: string;
  sidebarId: string; // ID do sidebar-config.ts
}

export interface PermissionItem {
  key: PermissionKey;
  label: string;
  description: string;
  children?: SubPermissionItem[];
}

export interface PermissionCategory {
  id: string;
  label: string;
  icon: string;
  items: PermissionItem[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'navegacao',
    label: 'Navegação',
    icon: 'LayoutDashboard',
    items: [
      { key: 'nav_home', label: 'Home / Visão Geral', description: 'Acesso ao dashboard principal' },
      {
        key: 'nav_comercial', label: 'Comercial', description: 'Pipeline, cotações, vendas',
        children: [
          { key: 'nav_comercial_pipeline', label: 'Pipeline Visual', sidebarId: 'com-pipeline' },
          { key: 'nav_comercial_leads', label: 'Leads', sidebarId: 'com-leads' },
          { key: 'nav_comercial_crm', label: 'CRM', sidebarId: 'com-crm' },
          { key: 'nav_comercial_crm_contatos', label: 'Contatos', sidebarId: 'com-crm-contatos' },
          { key: 'nav_comercial_crm_empresas', label: 'Empresas', sidebarId: 'com-crm-empresas' },
          { key: 'nav_comercial_cotacoes', label: 'Cotações', sidebarId: 'com-cotacoes' },
          { key: 'nav_comercial_propostas_fila', label: 'Fila de Propostas', sidebarId: 'com-propostas-fila' },
          { key: 'nav_comercial_propostas_ia', label: 'Scanner Inteligente', sidebarId: 'com-propostas-ia' },
          { key: 'nav_comercial_contratos', label: 'Contratos', sidebarId: 'com-contratos' },
          { key: 'nav_comercial_vendas', label: 'Vendas', sidebarId: 'com-vendas' },
          { key: 'nav_comercial_planos', label: 'Tabela de Preços', sidebarId: 'com-planos' },
          { key: 'nav_comercial_crm_analytics', label: 'Analytics CRM', sidebarId: 'com-crm-analytics' },
          { key: 'nav_comercial_deals', label: 'Oportunidades (Deals)', sidebarId: 'com-deals' },
        ],
      },
      {
        key: 'nav_marketing', label: 'Marketing & Ads', description: 'Meta Ads, Google, TikTok',
        children: [
          { key: 'nav_mkt_geral', label: 'Geral (Métricas, Performance)', sidebarId: 'mkt-geral' },
          { key: 'nav_mkt_google', label: 'Google Ads & Analytics', sidebarId: 'mkt-google' },
          { key: 'nav_mkt_meta', label: 'Meta Ads', sidebarId: 'mkt-meta' },
          { key: 'nav_mkt_tiktok', label: 'TikTok Ads', sidebarId: 'mkt-tiktok' },
        ],
      },
      {
        key: 'nav_social_flow', label: 'Social Flow', description: 'Composer, calendário, biblioteca',
        children: [
          { key: 'nav_sf_dashboard', label: 'Dashboard', sidebarId: 'sf-dashboard' },
          { key: 'nav_sf_composer', label: 'Composer', sidebarId: 'sf-composer' },
          { key: 'nav_sf_calendario', label: 'Calendário', sidebarId: 'sf-calendario' },
          { key: 'nav_sf_biblioteca', label: 'Biblioteca', sidebarId: 'sf-biblioteca' },
          { key: 'nav_sf_aprovacao', label: 'Aprovação', sidebarId: 'sf-aprovacao' },
          { key: 'nav_sf_connect', label: 'Conectar Contas', sidebarId: 'sf-connect' },
          { key: 'nav_sf_analytics', label: 'Analytics', sidebarId: 'sf-analytics' },
        ],
      },
      {
        key: 'nav_ia_automacao', label: 'IA & Automação', description: 'AI Performance, regras, workflows',
        children: [
          { key: 'nav_ia_performance', label: 'AI Performance', sidebarId: 'ia-perf' },
          { key: 'nav_ia_regras', label: 'Regras & Alertas', sidebarId: 'ia-perf-rules' },
          { key: 'nav_ia_insights', label: 'Insights IA', sidebarId: 'ia-insights' },
          { key: 'nav_ia_scanner', label: 'Scanner Inteligente', sidebarId: 'ia-scanner' },
          { key: 'nav_ia_automacoes', label: 'Automações IA', sidebarId: 'ia-auto' },
          { key: 'nav_ia_workflows', label: 'Workflows CRM', sidebarId: 'ia-workflows' },
        ],
      },
      {
        key: 'nav_operacoes', label: 'Operações', description: 'Clientes, documentos, tarefas',
        children: [
          { key: 'nav_ops_clientes', label: 'Clientes', sidebarId: 'ops-clientes' },
          { key: 'nav_ops_clientes_portal', label: 'Clientes Portal', sidebarId: 'ops-clientes-portal' },
          { key: 'nav_ops_documentos', label: 'Documentos', sidebarId: 'ops-documentos' },
          { key: 'nav_ops_tarefas', label: 'Tarefas', sidebarId: 'ops-tarefas' },
          { key: 'nav_ops_corretores', label: 'Corretores', sidebarId: 'ops-corretores' },
          { key: 'nav_ops_indicacoes', label: 'Indicações', sidebarId: 'ops-indicacoes' },
          { key: 'nav_ops_renovacoes', label: 'Renovações', sidebarId: 'ops-renovacoes' },
          { key: 'nav_ops_treinamento', label: 'Treinamento', sidebarId: 'ops-treinamento' },
          { key: 'nav_ops_design_system_emails', label: 'E-mails Design System', sidebarId: 'ops-design-system-emails' },
        ],
      },
      {
        key: 'nav_comunicacao', label: 'Comunicação', description: 'WhatsApp, chat, e-mail',
        children: [
          { key: 'nav_com_whatsapp', label: 'WhatsApp', sidebarId: 'com-whatsapp' },
          { key: 'nav_com_chat', label: 'Chat Equipe', sidebarId: 'com-chat' },
          { key: 'nav_com_chat_permissoes', label: 'Permissões Chat', sidebarId: 'com-chat-permissoes' },
          { key: 'nav_com_email', label: 'E-mail', sidebarId: 'com-email' },
          { key: 'nav_com_notificacoes', label: 'Notificações', sidebarId: 'com-notificacoes' },
        ],
      },
      {
        key: 'nav_financeiro', label: 'Financeiro', description: 'Dashboard financeiro, produção',
        children: [
          { key: 'nav_fin_visao', label: 'Visão Geral', sidebarId: 'fin-visao' },
          { key: 'nav_fin_producao', label: 'Produção', sidebarId: 'fin-producao' },
          { key: 'nav_fin_comissoes', label: 'Comissões', sidebarId: 'fin-comissoes' },
          { key: 'nav_fin_extrato', label: 'Extrato', sidebarId: 'fin-extrato' },
          { key: 'nav_fin_faturamento', label: 'Faturamento', sidebarId: 'fin-faturamento' },
        ],
      },
      {
        key: 'nav_configuracoes', label: 'Configurações', description: 'Geral, APIs, perfil, segurança',
        children: [
          { key: 'nav_config_geral', label: 'Geral', sidebarId: 'config-geral' },
          { key: 'nav_config_apis', label: 'APIs & Integrações', sidebarId: 'config-apis' },
          { key: 'nav_config_usuarios', label: 'Usuários do Sistema', sidebarId: 'config-usuarios' },
          { key: 'nav_config_perfil', label: 'Perfil', sidebarId: 'config-perfil' },
          { key: 'nav_config_seguranca', label: 'Segurança', sidebarId: 'config-seguranca' },
        ],
      },
      {
        key: 'nav_materiais', label: 'Materiais', description: 'Material de vendas, criativos, uploads',
        children: [
          { key: 'nav_mat_vendas', label: 'Material de Vendas', sidebarId: 'mat-vendas' },
          { key: 'nav_mat_banners', label: 'CriativoPRO', sidebarId: 'mat-banners' },
          { key: 'nav_mat_iaclone', label: 'IA Clone', sidebarId: 'mat-iaclone' },
          { key: 'nav_mat_galeria', label: 'Galeria Salvas', sidebarId: 'mat-galeria' },
          { key: 'nav_mat_upload', label: 'Meus Uploads', sidebarId: 'mat-upload' },
        ],
      },
    ],
  },
  {
    id: 'acoes',
    label: 'Ações',
    icon: 'Zap',
    items: [
      { key: 'action_create_lead', label: 'Criar Lead', description: 'Criar novos leads manualmente' },
      { key: 'action_edit_lead', label: 'Editar Lead', description: 'Modificar dados de leads existentes' },
      { key: 'action_delete_lead', label: 'Deletar Lead', description: 'Remover leads permanentemente' },
      { key: 'action_export_csv', label: 'Exportar Dados', description: 'Download de dados em CSV/Excel' },
      { key: 'action_create_proposta', label: 'Criar Proposta', description: 'Criar novas propostas' },
      { key: 'action_edit_proposta', label: 'Editar Proposta', description: 'Modificar propostas existentes' },
      { key: 'action_delete_proposta', label: 'Deletar Proposta', description: 'Remover propostas' },
      { key: 'action_approve_proposta', label: 'Aprovar Proposta', description: 'Mudar status de propostas para aprovada' },
      { key: 'action_manage_corretores', label: 'Gerenciar Corretores', description: 'Criar, editar, suspender corretores' },
      { key: 'action_manage_users', label: 'Gerenciar Usuários', description: 'Editar, suspender, excluir usuários' },
      { key: 'action_send_convite', label: 'Enviar Convites', description: 'Convidar novos corretores' },
      { key: 'action_generate_magic_link', label: 'Gerar Link Mágico', description: 'Gerar links de acesso sem senha' },
      { key: 'action_manage_automacoes', label: 'Gerenciar Automações', description: 'Criar e editar automações IA' },
      { key: 'action_manage_integracoes', label: 'Gerenciar Integrações', description: 'Configurar APIs e conexões' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: 'Wallet',
    items: [
      { key: 'fin_view_dashboard', label: 'Ver Dashboard Financeiro', description: 'Visualizar métricas financeiras' },
      { key: 'fin_view_comissoes', label: 'Ver Comissões', description: 'Visualizar comissões de corretores' },
      { key: 'fin_launch_comissoes', label: 'Lançar Comissões', description: 'Criar e aprovar lançamentos' },
      { key: 'fin_view_grade', label: 'Ver Grade de Comissão', description: 'Visualizar grades por operadora' },
      { key: 'fin_edit_grade', label: 'Editar Grade de Comissão', description: 'Modificar percentuais e regras' },
      { key: 'fin_view_producao', label: 'Ver Produção', description: 'Acompanhar produções implantadas' },
      { key: 'fin_view_faturamento', label: 'Ver Faturamento', description: 'Visualizar dados de faturamento' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    items: [
      { key: 'mkt_view_meta_ads', label: 'Ver Meta Ads', description: 'Visualizar campanhas e métricas' },
      { key: 'mkt_edit_campanhas', label: 'Editar Campanhas', description: 'Criar e modificar campanhas' },
      { key: 'mkt_view_analytics', label: 'Ver Analytics', description: 'Acessar GA4 e relatórios' },
      { key: 'mkt_view_leads_origem', label: 'Ver Leads por Origem', description: 'Filtrar leads pela fonte de tráfego' },
    ],
  },
];

// ─── Helper: gerar template com tudo true ou tudo false ───
function allKeys(val: boolean): UserPermissions {
  return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, val])) as UserPermissions;
}

// ─── Templates por cargo (espelham a RPC do banco) ────────
export const ROLE_TEMPLATES: Record<string, UserPermissions> = {
  administrador: allKeys(true),

  assistente: {
    ...allKeys(false),
    // Navegação principal
    nav_home: true, nav_comercial: true, nav_operacoes: true, nav_comunicacao: true,
    // Sub-itens comercial
    nav_comercial_leads: true, nav_comercial_crm: true, nav_comercial_crm_contatos: true,
    nav_comercial_crm_empresas: true, nav_comercial_cotacoes: true,
    // Sub-itens operações
    nav_ops_clientes: true, nav_ops_clientes_portal: true, nav_ops_documentos: true,
    nav_ops_tarefas: true, nav_ops_design_system_emails: true,
    // Sub-itens comunicação
    nav_com_whatsapp: true, nav_com_chat: true, nav_com_email: true, nav_com_notificacoes: true,
    // Ações
    action_export_csv: true,
  },

  gestor_trafego: {
    ...allKeys(false),
    // Navegação principal
    nav_home: true, nav_marketing: true, nav_social_flow: true,
    nav_ia_automacao: true, nav_comunicacao: true,
    // Sub-itens marketing
    nav_mkt_geral: true, nav_mkt_google: true, nav_mkt_meta: true, nav_mkt_tiktok: true,
    // Sub-itens social flow
    nav_sf_dashboard: true, nav_sf_composer: true, nav_sf_calendario: true,
    nav_sf_biblioteca: true, nav_sf_aprovacao: true, nav_sf_connect: true, nav_sf_analytics: true,
    // Sub-itens IA
    nav_ia_performance: true, nav_ia_regras: true, nav_ia_insights: true,
    nav_ia_automacoes: true, nav_ia_workflows: true,
    // Sub-itens comunicação
    nav_com_whatsapp: true, nav_com_chat: true, nav_com_email: true, nav_com_notificacoes: true,
    // Ações
    action_create_lead: true, action_edit_lead: true, action_export_csv: true,
    action_manage_automacoes: true,
    // Marketing ações
    mkt_view_meta_ads: true, mkt_edit_campanhas: true, mkt_view_analytics: true,
    mkt_view_leads_origem: true,
  },

  corretor: {
    ...allKeys(false),
    // Navegação principal — APENAS o essencial
    nav_home: true,
    nav_comercial: true,       // seção "Propostas" no corretor
    nav_financeiro: true,      // seção "Vendas & Comissões"
    nav_materiais: true,       // seção "Materiais"
    nav_operacoes: true,       // seção "Renovações" (item direto)

    // Sub-itens Propostas (dentro de Comercial)
    nav_comercial_propostas_fila: true,
    nav_comercial_propostas_ia: true,
    nav_comercial_cotacoes: true,
    nav_comercial_planos: true,

    // Sub-itens Materiais
    nav_mat_vendas: true, nav_mat_banners: true, nav_mat_iaclone: true,
    nav_mat_galeria: true, nav_mat_upload: true,

    // Sub-itens Vendas & Comissões (Financeiro)
    nav_fin_visao: true,
    nav_comercial_vendas: true,
    nav_fin_comissoes: true,
    nav_fin_producao: true,
    nav_fin_extrato: true,

    // Renovações (Operações)
    nav_ops_renovacoes: true,

    // Indicações
    nav_ops_indicacoes: true,

    // Treinamento
    nav_ops_treinamento: true,

    // Ações básicas
    action_create_proposta: true, action_edit_proposta: true,
    action_export_csv: true,

    // Financeiro (visualização)
    fin_view_dashboard: true, fin_view_comissoes: true,
    fin_view_grade: true, fin_view_producao: true,
  },
};

// ─── Mapeamento sidebar item ID → permission key ──────────
// Usado pelo DockSidebar para filtrar itens baseado em permissões.
// Para sub-itens: verifica primeiro a chave granular; se não existir,
// cai na chave da seção pai (handled pelo helper canSeeSidebarItem).
export const SIDEBAR_PERMISSION_MAP: Record<string, PermissionKey> = {
  // Seções principais (top-level)
  'visao-geral': 'nav_home',
  'comercial': 'nav_comercial',
  'marketing-ads': 'nav_marketing',
  'social-flow': 'nav_social_flow',
  'ia-automacao': 'nav_ia_automacao',
  'operacoes': 'nav_operacoes',
  'comunicacao': 'nav_comunicacao',
  'financeiro': 'nav_financeiro',
  'configuracoes': 'nav_configuracoes',

  // Sub-itens Comercial
  'com-pipeline': 'nav_comercial_pipeline',
  'com-leads': 'nav_comercial_leads',
  'com-crm': 'nav_comercial_crm',
  'com-crm-contatos': 'nav_comercial_crm_contatos',
  'com-crm-empresas': 'nav_comercial_crm_empresas',
  'com-cotacoes': 'nav_comercial_cotacoes',
  'com-propostas-fila': 'nav_comercial_propostas_fila',
  'com-propostas-ia': 'nav_comercial_propostas_ia',
  'com-contratos': 'nav_comercial_contratos',
  'com-vendas': 'nav_comercial_vendas',
  'com-planos': 'nav_comercial_planos',
  'com-crm-analytics': 'nav_comercial_crm_analytics',

  // Sub-itens Marketing
  'mkt-geral': 'nav_mkt_geral',
  'mkt-google': 'nav_mkt_google',
  'mkt-meta': 'nav_mkt_meta',
  'mkt-tiktok': 'nav_mkt_tiktok',

  // Sub-itens Social Flow
  'sf-dashboard': 'nav_sf_dashboard',
  'sf-composer': 'nav_sf_composer',
  'sf-calendario': 'nav_sf_calendario',
  'sf-biblioteca': 'nav_sf_biblioteca',
  'sf-aprovacao': 'nav_sf_aprovacao',
  'sf-connect': 'nav_sf_connect',
  'sf-analytics': 'nav_sf_analytics',

  // Sub-itens IA & Automação
  'ia-perf': 'nav_ia_performance',
  'ia-perf-rules': 'nav_ia_regras',
  'ia-insights': 'nav_ia_insights',
  'ia-scanner': 'nav_ia_scanner',
  'ia-auto': 'nav_ia_automacoes',
  'ia-workflows': 'nav_ia_workflows',

  // Sub-itens Operações
  'ops-clientes': 'nav_ops_clientes',
  'ops-clientes-portal': 'nav_ops_clientes_portal',
  'ops-documentos': 'nav_ops_documentos',
  'ops-tarefas': 'nav_ops_tarefas',
  'ops-design-system-emails': 'nav_ops_design_system_emails',
  'ops-corretores': 'nav_ops_corretores',
  'ops-indicacoes': 'nav_ops_indicacoes',
  'indicacoes': 'nav_ops_indicacoes',
  'ops-treinamento': 'nav_ops_treinamento',
  // Sub-sub-itens corretores
  'corr-painel': 'nav_ops_corretores',
  'corr-solicitacoes': 'nav_ops_corretores',
  'corr-convites': 'nav_ops_corretores',

  // Sub-itens Comunicação
  'com-whatsapp': 'nav_com_whatsapp',
  'com-chat': 'nav_com_chat',
  'com-chat-permissoes': 'nav_com_chat_permissoes',
  'com-email': 'nav_com_email',
  'com-notificacoes': 'nav_com_notificacoes',

  // Sub-itens Financeiro
  'fin-visao': 'nav_fin_visao',
  'fin-vendas': 'nav_fin_visao',
  'fin-producao': 'nav_fin_producao',
  'fin-comissoes': 'nav_fin_comissoes',
  'fin-extrato': 'nav_fin_extrato',
  'fin-faturamento': 'nav_fin_faturamento',

  // Sub-itens Configurações
  'config-geral': 'nav_config_geral',
  'config-apis': 'nav_config_apis',
  'config-usuarios': 'nav_config_usuarios',
  'config-perfil': 'nav_config_perfil',
  'config-seguranca': 'nav_config_seguranca',

  // Sub-itens Materiais (admin sidebar)
  'materiais': 'nav_materiais',
  'mat-vendas': 'nav_mat_vendas',
  'mat-banners': 'nav_mat_banners',
  'mat-iaclone': 'nav_mat_iaclone',
  'mat-galeria': 'nav_mat_galeria',
  'mat-upload': 'nav_mat_upload',

  // Sub-itens Comercial extras
  'com-deals': 'nav_comercial_deals',

  // Sub-itens Operações extras
  'ops-renovacoes': 'nav_ops_renovacoes',
  'ops-treinamento-tour': 'nav_ops_treinamento',
  'ops-treinamento-produto': 'nav_ops_treinamento',
  'ops-treinamento-mercado': 'nav_ops_treinamento',
  'ops-treinamento-central': 'nav_ops_treinamento',

  // Seção Treinamento (corretor sidebar — mapeia para operações)
  'treinamento': 'nav_ops_treinamento',

  // Sub-itens Marketing (flattened — usados no corretor sidebar)
  'mkt-metricas': 'nav_mkt_geral',
  'mkt-performance': 'nav_mkt_geral',
  'mkt-relatorios': 'nav_mkt_geral',
  'mkt-cockpit': 'nav_mkt_geral',
  'mkt-meta-visao': 'nav_mkt_meta',
  'mkt-google-ga4': 'nav_mkt_google',

  // Sub-itens IA extras
  'ia-perf-v1': 'nav_ia_performance',
  'ia-perf-escala': 'nav_ia_performance',
  'ia-perf-audiences': 'nav_ia_performance',
  'ia-perf-settings': 'nav_ia_performance',
  'ia-regras-legacy': 'nav_ia_regras',

  // Sub-itens Social Flow config
  'sf-config': 'nav_sf_dashboard',

  // Sub-itens Configurações extras
  'config-integracoes-legacy': 'nav_config_apis',
};

// ─── Mapeamento rota → permissão (para middleware) ────────
export const ROUTE_PERMISSION_MAP: Record<string, PermissionKey> = {
  '/portal-interno-hks-2026/leads': 'nav_comercial_leads',
  '/portal-interno-hks-2026/funil': 'nav_comercial_pipeline',
  '/portal-interno-hks-2026/crm': 'nav_comercial_crm',
  '/portal-interno-hks-2026/propostas': 'nav_comercial_propostas',
  '/portal-interno-hks-2026/cotacoes': 'nav_comercial_cotacoes',
  '/portal-interno-hks-2026/planos': 'nav_comercial_planos',
  '/portal-interno-hks-2026/contratos': 'nav_comercial_contratos',
  '/portal-interno-hks-2026/vendas': 'nav_comercial_vendas',
  '/portal-interno-hks-2026/meta-ads': 'nav_marketing',
  '/portal-interno-hks-2026/social-flow': 'nav_social_flow',
  '/portal-interno-hks-2026/ai-performance': 'nav_ia_performance',
  '/portal-interno-hks-2026/automacao': 'nav_ia_automacoes',
  '/portal-interno-hks-2026/financeiro': 'nav_financeiro',
  '/portal-interno-hks-2026/producao': 'nav_fin_producao',
  '/portal-interno-hks-2026/faturamento': 'nav_fin_faturamento',
  '/portal-interno-hks-2026/corretores': 'nav_ops_corretores',
  '/portal-interno-hks-2026/usuarios': 'nav_config_usuarios',
  '/portal-interno-hks-2026/configuracoes': 'nav_configuracoes',
  '/portal-interno-hks-2026/clientes': 'nav_ops_clientes',
  '/portal-interno-hks-2026/clientes-portal': 'nav_ops_clientes_portal',
  '/portal-interno-hks-2026/documentos': 'nav_ops_documentos',
  '/portal-interno-hks-2026/design-system-emails': 'nav_ops_design_system_emails',
  '/portal-interno-hks-2026/tarefas': 'nav_ops_tarefas',
  '/portal-interno-hks-2026/indicacoes': 'nav_ops_indicacoes',
  '/portal-interno-hks-2026/renovacoes': 'nav_ops_renovacoes',
  '/portal-interno-hks-2026/treinamento': 'nav_ops_treinamento',
  '/portal-interno-hks-2026/materiais': 'nav_materiais',
  '/portal-interno-hks-2026/crm/deals': 'nav_comercial_deals',
  '/portal-interno-hks-2026/financeiro/extrato': 'nav_fin_extrato',
  '/portal-interno-hks-2026/whatsapp': 'nav_com_whatsapp',
  '/portal-interno-hks-2026/chat': 'nav_com_chat',
  '/portal-interno-hks-2026/chat/permissoes': 'nav_com_chat_permissoes',
  '/portal-interno-hks-2026/email': 'nav_com_email',
  '/portal-interno-hks-2026/notificacoes': 'nav_com_notificacoes',
  '/portal-interno-hks-2026/analytics': 'mkt_view_analytics',
  '/portal-interno-hks-2026/metricas': 'mkt_view_analytics',
  '/portal-interno-hks-2026/cockpit': 'mkt_view_analytics',
  '/portal-interno-hks-2026/performance': 'mkt_view_analytics',
  '/portal-interno-hks-2026/relatorios': 'mkt_view_analytics',
  '/portal-interno-hks-2026/insights': 'nav_ia_insights',
  '/portal-interno-hks-2026/scanner': 'nav_ia_scanner',
  '/portal-interno-hks-2026/regras-ia': 'nav_ia_regras',

  // ═══ Rotas do Corretor ═══
  '/dashboard/corretor/cotacoes': 'nav_comercial_cotacoes',
  '/dashboard/corretor/propostas': 'nav_comercial_propostas',
  '/dashboard/corretor/propostas/fila': 'nav_comercial_propostas_fila',
  '/dashboard/corretor/propostas/manual': 'nav_comercial_propostas_manual',
  '/dashboard/corretor/vendas': 'nav_comercial_vendas',
  '/dashboard/corretor/planos': 'nav_comercial_planos',
  '/dashboard/corretor/materiais': 'nav_materiais',
  '/dashboard/corretor/renovacoes': 'nav_ops_renovacoes',
  '/dashboard/corretor/indicacoes': 'nav_ops_indicacoes',
  '/dashboard/corretor/treinamento': 'nav_ops_treinamento',
  '/dashboard/corretor/financeiro': 'nav_financeiro',
  '/dashboard/corretor/financeiro/producao': 'nav_fin_producao',
  '/dashboard/corretor/financeiro/comissoes': 'nav_fin_comissoes',
  '/dashboard/corretor/financeiro/extrato': 'nav_fin_extrato',
};

// ─── Helper: verificar se usuário tem permissão ───────────
export function hasPermission(
  permissions: Partial<UserPermissions> | null | undefined,
  key: PermissionKey,
): boolean {
  if (!permissions) return false;
  return permissions[key] === true;
}

// ─── Helper: contar permissões ativas ─────────────────────
export function countActivePermissions(permissions: Partial<UserPermissions> | null): number {
  if (!permissions) return 0;
  return Object.values(permissions).filter(Boolean).length;
}

// ─── Helper: obter permissão por rota (prefix match) ──────
export function getPermissionForRoute(pathname: string): PermissionKey | null {
  // Busca exata primeiro
  if (ROUTE_PERMISSION_MAP[pathname]) {
    return ROUTE_PERMISSION_MAP[pathname];
  }
  // Busca por prefixo (mais longo primeiro para match mais específico)
  const sorted = Object.keys(ROUTE_PERMISSION_MAP).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname.startsWith(route)) {
      return ROUTE_PERMISSION_MAP[route];
    }
  }
  return null;
}

// ─── Helper: obter chaves-filhas de um item de navegação ──
// Retorna todas as PermissionKeys dos children de um item pai
export function getChildKeys(parentKey: PermissionKey): PermissionKey[] {
  for (const cat of PERMISSION_CATEGORIES) {
    for (const item of cat.items) {
      if (item.key === parentKey && item.children) {
        return item.children.map((c) => c.key);
      }
    }
  }
  return [];
}
