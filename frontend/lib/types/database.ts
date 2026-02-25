// =============================================
// 📦 HUMANO SAÚDE - TIPOS DO BANCO DE DADOS
// =============================================
// Tipagem completa para todas as 14 tabelas + 3 views
// Sincronizado com humano_saude_complete_schema.sql
// =============================================

// ========================================
// ENUMS & CONSTANTES
// ========================================

export const LEAD_STATUS = [
  'novo',
  'contatado',
  'negociacao',
  'proposta_enviada',
  'ganho',
  'perdido',
  'pausado',
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const COTACAO_STATUS = [
  'pendente',
  'enviada',
  'aceita',
  'recusada',
  'expirada',
] as const;
export type CotacaoStatus = (typeof COTACAO_STATUS)[number];

export const PROPOSTA_STATUS = [
  'analise',
  'aprovada',
  'ativa',
  'cancelada',
  'suspensa',
] as const;
export type PropostaStatus = (typeof PROPOSTA_STATUS)[number];

export const COMISSAO_STATUS = [
  'pendente',
  'paga',
  'cancelada',
] as const;
export type ComissaoStatus = (typeof COMISSAO_STATUS)[number];

export const TAREFA_STATUS = [
  'pendente',
  'em_andamento',
  'concluida',
  'cancelada',
] as const;
export type TarefaStatus = (typeof TAREFA_STATUS)[number];

export const TAREFA_PRIORIDADE = [
  'baixa',
  'media',
  'alta',
  'urgente',
] as const;
export type TarefaPrioridade = (typeof TAREFA_PRIORIDADE)[number];

export const WHATSAPP_DIRECTION = ['inbound', 'outbound'] as const;
export type WhatsAppDirection = (typeof WHATSAPP_DIRECTION)[number];

export const WHATSAPP_MESSAGE_TYPE = [
  'text',
  'image',
  'video',
  'audio',
  'document',
] as const;
export type WhatsAppMessageType = (typeof WHATSAPP_MESSAGE_TYPE)[number];

// ========================================
// 1. insurance_leads
// ========================================

export type LeadHistoricoEntry = {
  timestamp: string;
  evento: string;
  origem?: string;
  detalhes?: string;
  status_anterior?: string;
  status_novo?: string;
  observacao?: string | null;
};

export type InsuranceLead = {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  operadora_atual: string | null;
  valor_atual: number | null;
  idades: number[];
  economia_estimada: number | null;
  valor_proposto: number | null;
  tipo_contratacao: string | null;
  status: LeadStatus;
  origem: string;
  prioridade: string;
  observacoes: string | null;
  dados_pdf: Record<string, unknown> | null;
  historico: LeadHistoricoEntry[];
  atribuido_a: string | null;
  arquivado: boolean;
  // ── Campos unificados da landing page (Fase 2.1) ──
  telefone: string | null;
  perfil: string | null;
  acomodacao: string | null;
  idades_beneficiarios: string[] | null;
  bairro: string | null;
  top_3_planos: string | null;
  ip_address: string | null;
  user_agent: string | null;
  cnpj: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

export type InsuranceLeadInsert = Omit<InsuranceLead, 'id' | 'created_at' | 'updated_at'>;
export type InsuranceLeadUpdate = Partial<Omit<InsuranceLead, 'id' | 'created_at'>>;

// ========================================
// 2. operadoras
// ========================================

export type Operadora = {
  id: string;
  nome: string;
  cnpj: string | null;
  ans_registro: string | null;
  telefone: string | null;
  email: string | null;
  site: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_cep: string | null;
  logo_url: string | null;
  ativa: boolean;
  comissao_padrao: number | null;
  observacoes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OperadoraInsert = Omit<Operadora, 'id' | 'created_at' | 'updated_at'>;
export type OperadoraUpdate = Partial<Omit<Operadora, 'id' | 'created_at'>>;

// ========================================
// 3. planos
// ========================================

export type Plano = {
  id: string;
  operadora_id: string | null;
  nome: string;
  codigo: string | null;
  tipo: string;
  abrangencia: string | null;
  coparticipacao: boolean;
  valor_base: number;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
  acomodacao: string | null;
  ativo: boolean;
  descricao: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PlanoInsert = Omit<Plano, 'id' | 'created_at' | 'updated_at'>;
export type PlanoUpdate = Partial<Omit<Plano, 'id' | 'created_at'>>;

// ========================================
// 4. cotacoes
// ========================================

export type CotacaoBeneficiario = {
  nome?: string;
  cpf?: string;
  idade: number;
  valor: number;
};

export type Cotacao = {
  id: string;
  lead_id: string | null;
  plano_id: string | null;
  numero_cotacao: string | null;
  nome_cliente: string;
  email_cliente: string | null;
  telefone_cliente: string | null;
  titulares: CotacaoBeneficiario[];
  dependentes: CotacaoBeneficiario[];
  valor_total: number;
  economia_estimada: number | null;
  valor_plano_anterior: number | null;
  status: CotacaoStatus;
  validade_ate: string | null;
  observacoes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  enviada_em: string | null;
  aceita_em: string | null;
};

export type CotacaoInsert = Omit<Cotacao, 'id' | 'created_at' | 'updated_at'>;
export type CotacaoUpdate = Partial<Omit<Cotacao, 'id' | 'created_at'>>;

// ========================================
// 5. propostas
// ========================================

export type PropostaDocumento = {
  tipo: string;
  url: string;
  nome: string;
  data_upload: string;
};

export type Proposta = {
  id: string;
  cotacao_id: string | null;
  lead_id: string | null;
  plano_id: string | null;
  operadora_id: string | null;
  numero_proposta: string;
  nome_titular: string;
  cpf_titular: string;
  email_titular: string | null;
  telefone_titular: string | null;
  valor_mensalidade: number;
  comissao_corretor: number | null;
  comissao_percentual: number | null;
  data_inicio: string;
  data_fim: string | null;
  dia_vencimento: number | null;
  status: PropostaStatus;
  documentos: PropostaDocumento[];
  observacoes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  aprovada_em: string | null;
  ativada_em: string | null;
  cancelada_em: string | null;
};

export type PropostaInsert = Omit<Proposta, 'id' | 'created_at' | 'updated_at'>;
export type PropostaUpdate = Partial<Omit<Proposta, 'id' | 'created_at'>>;

// ========================================
// 6. comissoes
// ========================================

export type Comissao = {
  id: string;
  proposta_id: string | null;
  corretor_id: string | null;
  mes_referencia: string;
  valor_comissao: number;
  percentual: number | null;
  status: ComissaoStatus;
  forma_pagamento: string | null;
  data_pagamento: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ComissaoInsert = Omit<Comissao, 'id' | 'created_at' | 'updated_at'>;
export type ComissaoUpdate = Partial<Omit<Comissao, 'id' | 'created_at'>>;

// ========================================
// 7. analytics_visits
// ========================================

export type AnalyticsVisit = {
  id: string;
  session_id: string | null;
  client_id: string | null;
  page_path: string | null;
  page_title: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
  device_category: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  session_duration: number | null;
  page_views: number;
  visit_date: string | null;
  created_at: string;
};

export type AnalyticsVisitInsert = Omit<AnalyticsVisit, 'id' | 'created_at'>;

// ========================================
// 8. ads_campaigns
// ========================================

export type AdsCampaign = {
  id: string;
  campaign_id: string;
  ad_account_id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget: number | null;
  lifetime_budget: number | null;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  leads_generated: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  cpl: number | null;
  auto_scale_enabled: boolean;
  last_optimization_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AdsCampaignInsert = Omit<AdsCampaign, 'id' | 'created_at' | 'updated_at'>;
export type AdsCampaignUpdate = Partial<Omit<AdsCampaign, 'id' | 'created_at'>>;

// ========================================
// 9. ads_creatives
// ========================================

export type AdsCreative = {
  id: string;
  creative_id: string | null;
  ad_account_id: string;
  campaign_id: string | null;
  name: string;
  type: string;
  status: string;
  image_url: string | null;
  video_url: string | null;
  image_hash: string | null;
  title: string | null;
  primary_text: string | null;
  description: string | null;
  call_to_action: string | null;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number | null;
  ai_score: number | null;
  ai_analysis: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AdsCreativeInsert = Omit<AdsCreative, 'id' | 'created_at' | 'updated_at'>;
export type AdsCreativeUpdate = Partial<Omit<AdsCreative, 'id' | 'created_at'>>;

// ========================================
// 10. ads_audiences
// ========================================

export type AdsAudience = {
  id: string;
  audience_id: string;
  ad_account_id: string;
  name: string;
  type: string;
  subtype: string | null;
  status: string;
  approximate_count: number | null;
  rules: Record<string, unknown> | null;
  lookalike_source_id: string | null;
  lookalike_ratio: number | null;
  campaigns_using: number;
  total_spend: number;
  total_conversions: number;
  avg_cpl: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AdsAudienceInsert = Omit<AdsAudience, 'id' | 'created_at' | 'updated_at'>;
export type AdsAudienceUpdate = Partial<Omit<AdsAudience, 'id' | 'created_at'>>;

// ========================================
// 11. whatsapp_contacts
// ========================================

export type WhatsAppContact = {
  id: string;
  phone: string;
  profile_name: string | null;
  name: string | null;
  email: string | null;
  lead_id: string | null;
  messages_received: number;
  messages_sent: number;
  last_message_at: string | null;
  is_blocked: boolean;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WhatsAppContactInsert = Omit<WhatsAppContact, 'id' | 'created_at' | 'updated_at'>;
export type WhatsAppContactUpdate = Partial<Omit<WhatsAppContact, 'id' | 'created_at'>>;

// ========================================
// 12. whatsapp_messages
// ========================================

export type WhatsAppMessage = {
  id: string;
  contact_id: string | null;
  wa_message_id: string | null;
  phone: string;
  direction: WhatsAppDirection;
  type: WhatsAppMessageType;
  content: string | null;
  media_url: string | null;
  status: string;
  read_at: string | null;
  delivered_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type WhatsAppMessageInsert = Omit<WhatsAppMessage, 'id' | 'created_at'>;

// ========================================
// 13. webhook_logs
// ========================================

export type WebhookLog = {
  id: string;
  source: string;
  event_type: string;
  event_id: string | null;
  payload: Record<string, unknown>;
  headers: Record<string, unknown> | null;
  status: string;
  processed_at: string | null;
  error_message: string | null;
  retry_count: number;
  lead_id: string | null;
  created_at: string;
};

export type WebhookLogInsert = Omit<WebhookLog, 'id' | 'created_at'>;

// ========================================
// 14. integration_settings
// ========================================

export type IntegrationSetting = {
  id: string;
  user_id: string | null;
  integration_name: string;
  encrypted_credentials: Record<string, unknown>;
  is_active: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type IntegrationSettingInsert = Omit<IntegrationSetting, 'id' | 'created_at' | 'updated_at'>;
export type IntegrationSettingUpdate = Partial<Omit<IntegrationSetting, 'id' | 'created_at'>>;

// ========================================
// VIEWS (read-only)
// ========================================

export type PipelineCompleto = {
  lead_id: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  lead_status: LeadStatus;
  operadora_atual: string | null;
  valor_atual: number | null;
  economia_estimada: number | null;
  total_cotacoes: number;
  total_propostas: number;
  ultima_cotacao: string | null;
  ultima_proposta: string | null;
  lead_criado_em: string;
};

export type DesempenhoOperadora = {
  operadora: string;
  total_leads: number;
  total_cotacoes: number;
  total_propostas: number;
  propostas_ativas: number;
  ticket_medio: number | null;
  receita_recorrente: number | null;
};

export type AnaliseCampanha = {
  campanha: string;
  status: string;
  investimento: number;
  impressoes: number;
  cliques: number;
  leads_gerados: number;
  custo_por_lead: number | null;
  leads_no_sistema: number;
  propostas_fechadas: number;
  receita_gerada: number | null;
  roi_anual: number | null;
};

// ========================================
// TABELAS EXTRAS (tarefas, notificações)
// ========================================

export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: TarefaStatus;
  prioridade: TarefaPrioridade;
  atribuido_a: string | null;
  lead_id: string | null;
  proposta_id: string | null;
  data_vencimento: string | null;
  concluida_em: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TarefaInsert = Pick<Tarefa, 'titulo'> & Partial<Omit<Tarefa, 'id' | 'created_at' | 'updated_at' | 'titulo'>>;
export type TarefaUpdate = Partial<Omit<Tarefa, 'id' | 'created_at'>>;

export type Notificacao = {
  id: string;
  user_id: string | null;
  destino: 'admin' | 'corretor';
  corretor_id: string | null;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  lida: boolean;
  link: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NotificacaoInsert = Omit<Notificacao, 'id' | 'created_at'>;

export type Documento = {
  id: string;
  nome: string;
  tipo: string;
  url: string;
  tamanho: number | null;
  lead_id: string | null;
  proposta_id: string | null;
  uploaded_by: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DocumentoInsert = Omit<Documento, 'id' | 'created_at' | 'updated_at'>;
export type DocumentoUpdate = Partial<Omit<Documento, 'id' | 'created_at'>>;

// ========================================
// DATABASE SCHEMA TYPE (para Supabase Client)
// ========================================

export type Database = {
  public: {
    Tables: {
      insurance_leads: {
        Row: InsuranceLead;
        Insert: InsuranceLeadInsert;
        Update: InsuranceLeadUpdate;
      };
      operadoras: {
        Row: Operadora;
        Insert: OperadoraInsert;
        Update: OperadoraUpdate;
      };
      planos: {
        Row: Plano;
        Insert: PlanoInsert;
        Update: PlanoUpdate;
      };
      cotacoes: {
        Row: Cotacao;
        Insert: CotacaoInsert;
        Update: CotacaoUpdate;
      };
      propostas: {
        Row: Proposta;
        Insert: PropostaInsert;
        Update: PropostaUpdate;
      };
      comissoes: {
        Row: Comissao;
        Insert: ComissaoInsert;
        Update: ComissaoUpdate;
      };
      analytics_visits: {
        Row: AnalyticsVisit;
        Insert: AnalyticsVisitInsert;
        Update: never;
      };
      ads_campaigns: {
        Row: AdsCampaign;
        Insert: AdsCampaignInsert;
        Update: AdsCampaignUpdate;
      };
      ads_creatives: {
        Row: AdsCreative;
        Insert: AdsCreativeInsert;
        Update: AdsCreativeUpdate;
      };
      ads_audiences: {
        Row: AdsAudience;
        Insert: AdsAudienceInsert;
        Update: AdsAudienceUpdate;
      };
      whatsapp_contacts: {
        Row: WhatsAppContact;
        Insert: WhatsAppContactInsert;
        Update: WhatsAppContactUpdate;
      };
      whatsapp_messages: {
        Row: WhatsAppMessage;
        Insert: WhatsAppMessageInsert;
        Update: never;
      };
      webhook_logs: {
        Row: WebhookLog;
        Insert: WebhookLogInsert;
        Update: never;
      };
      integration_settings: {
        Row: IntegrationSetting;
        Insert: IntegrationSettingInsert;
        Update: IntegrationSettingUpdate;
      };
      tarefas: {
        Row: Tarefa;
        Insert: TarefaInsert;
        Update: TarefaUpdate;
      };
      notificacoes: {
        Row: Notificacao;
        Insert: NotificacaoInsert;
        Update: never;
      };
      documentos: {
        Row: Documento;
        Insert: DocumentoInsert;
        Update: DocumentoUpdate;
      };
    };
    Views: {
      pipeline_completo: {
        Row: PipelineCompleto;
      };
      desempenho_operadoras: {
        Row: DesempenhoOperadora;
      };
      analise_campanhas: {
        Row: AnaliseCampanha;
      };
    };
  };
};
