-- ============================================
-- HUMANO SAÚDE - DATABASE SCHEMA
-- Supabase PostgreSQL
-- ============================================

-- ============================================
-- 1. TABELA: insurance_leads
-- Armazena todos os leads captados pela IA
-- ============================================

CREATE TABLE IF NOT EXISTS public.insurance_leads (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Dados do Lead
  nome VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20),  -- NULL quando lead veio só por e-mail (ex.: completar cotação)
  email VARCHAR(255),
  empresa VARCHAR(255),  -- Razão social (consultada por CNPJ na completar-cotacao / landing)
  
  -- Dados do Plano Atual
  operadora_atual VARCHAR(100),
  valor_atual DECIMAL(10, 2),
  idades JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Análise e Cotação
  economia_estimada DECIMAL(10, 2),
  valor_proposto DECIMAL(10, 2),
  tipo_contratacao VARCHAR(50),
  
  -- Gestão do Lead
  status VARCHAR(50) NOT NULL DEFAULT 'novo',
  origem VARCHAR(50) DEFAULT 'scanner_pdf',
  prioridade VARCHAR(20) DEFAULT 'media',
  
  -- Observações e Metadados
  observacoes TEXT,
  dados_pdf JSONB,
  historico JSONB DEFAULT '[]'::jsonb,
  
  -- Controle
  atribuido_a UUID REFERENCES auth.users(id),
  arquivado BOOLEAN DEFAULT FALSE,
  
  -- Índices para busca
  CONSTRAINT whatsapp_format CHECK (whatsapp IS NULL OR whatsapp ~ '^\+?[0-9]{10,15}$'),
  CONSTRAINT status_valido CHECK (status IN (
    'novo', 'contatado', 'negociacao', 
    'proposta_enviada', 'ganho', 'perdido', 'pausado'
  ))
);

-- Índices para performance
CREATE INDEX idx_insurance_leads_created_at ON public.insurance_leads(created_at DESC);
CREATE INDEX idx_insurance_leads_status ON public.insurance_leads(status);
CREATE INDEX idx_insurance_leads_whatsapp ON public.insurance_leads(whatsapp);
CREATE INDEX idx_insurance_leads_email ON public.insurance_leads(email);
CREATE INDEX idx_insurance_leads_atribuido ON public.insurance_leads(atribuido_a);
CREATE INDEX idx_insurance_leads_idades ON public.insurance_leads USING GIN(idades);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_insurance_leads_updated_at
  BEFORE UPDATE ON public.insurance_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. VIEW: dashboard_stats
-- Estatísticas do dashboard
-- ============================================

CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  -- Total de Leads
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS leads_mes_atual,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS leads_semana_atual,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS leads_hoje,
  
  -- Leads por Status
  COUNT(*) FILTER (WHERE status = 'novo') AS leads_novos,
  COUNT(*) FILTER (WHERE status = 'contatado') AS leads_contatados,
  COUNT(*) FILTER (WHERE status = 'negociacao') AS leads_em_negociacao,
  COUNT(*) FILTER (WHERE status = 'proposta_enviada') AS leads_com_proposta,
  COUNT(*) FILTER (WHERE status = 'ganho') AS leads_ganhos,
  COUNT(*) FILTER (WHERE status = 'perdido') AS leads_perdidos,
  
  -- Economia Gerada
  SUM(economia_estimada) AS economia_total,
  SUM(economia_estimada) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS economia_mes_atual,
  AVG(economia_estimada) AS economia_media,
  
  -- Valores
  SUM(valor_atual) AS valor_total_planos_atuais,
  SUM(valor_proposto) AS valor_total_propostas,
  AVG(valor_atual) AS ticket_medio_atual,
  AVG(valor_proposto) AS ticket_medio_proposto,
  
  -- Taxa de Conversão
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'ganho')::DECIMAL / 
     NULLIF(COUNT(*), 0) * 100), 2
  ) AS taxa_conversao,
  
  -- Tempo Médio de Conversão (em dias)
  AVG(
    EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
  ) FILTER (WHERE status = 'ganho') AS tempo_medio_conversao_dias,
  
  -- Origem dos Leads
  COUNT(*) FILTER (WHERE origem = 'scanner_pdf') AS leads_scanner_pdf,
  COUNT(*) FILTER (WHERE origem = 'meta_ads') AS leads_meta_ads,
  COUNT(*) FILTER (WHERE origem = 'manual') AS leads_manual,
  
  -- Última atualização
  MAX(created_at) AS ultimo_lead_criado,
  MAX(updated_at) AS ultima_atualizacao

FROM public.insurance_leads
WHERE arquivado = FALSE;

-- ============================================
-- 3. VIEW: leads_por_operadora
-- Estatísticas agrupadas por operadora
-- ============================================

CREATE OR REPLACE VIEW public.leads_por_operadora AS
SELECT
  operadora_atual,
  COUNT(*) AS total_leads,
  AVG(valor_atual) AS ticket_medio,
  SUM(economia_estimada) AS economia_total,
  COUNT(*) FILTER (WHERE status = 'ganho') AS leads_convertidos
FROM public.insurance_leads
WHERE arquivado = FALSE
  AND operadora_atual IS NOT NULL
GROUP BY operadora_atual
ORDER BY total_leads DESC;

-- ============================================
-- 4. VIEW: pipeline_vendas
-- Visão do funil de vendas
-- ============================================

CREATE OR REPLACE VIEW public.pipeline_vendas AS
SELECT
  status,
  COUNT(*) AS quantidade,
  SUM(valor_proposto) AS valor_total,
  AVG(valor_proposto) AS ticket_medio,
  ROUND(
    (COUNT(*)::DECIMAL / 
     (SELECT COUNT(*) FROM public.insurance_leads WHERE arquivado = FALSE)::DECIMAL * 100), 2
  ) AS percentual_total
FROM public.insurance_leads
WHERE arquivado = FALSE
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'novo' THEN 1
    WHEN 'contatado' THEN 2
    WHEN 'negociacao' THEN 3
    WHEN 'proposta_enviada' THEN 4
    WHEN 'ganho' THEN 5
    WHEN 'perdido' THEN 6
    WHEN 'pausado' THEN 7
  END;

-- ============================================
-- 5. FUNCTION: Adicionar Lead do Scanner PDF
-- ============================================

CREATE OR REPLACE FUNCTION public.adicionar_lead_scanner(
  p_nome VARCHAR,
  p_whatsapp VARCHAR,
  p_email VARCHAR,
  p_operadora VARCHAR,
  p_valor_atual DECIMAL,
  p_idades JSONB,
  p_economia DECIMAL,
  p_valor_proposto DECIMAL,
  p_dados_pdf JSONB
)
RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  INSERT INTO public.insurance_leads (
    nome,
    whatsapp,
    email,
    operadora_atual,
    valor_atual,
    idades,
    economia_estimada,
    valor_proposto,
    origem,
    dados_pdf,
    status,
    historico
  ) VALUES (
    p_nome,
    p_whatsapp,
    p_email,
    p_operadora,
    p_valor_atual,
    p_idades,
    p_economia,
    p_valor_proposto,
    'scanner_pdf',
    p_dados_pdf,
    'novo',
    jsonb_build_array(
      jsonb_build_object(
        'timestamp', NOW(),
        'evento', 'lead_criado',
        'origem', 'scanner_pdf'
      )
    )
  )
  RETURNING id INTO v_lead_id;
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FUNCTION: Atualizar Status do Lead
-- ============================================

CREATE OR REPLACE FUNCTION public.atualizar_status_lead(
  p_lead_id UUID,
  p_novo_status VARCHAR,
  p_observacao TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.insurance_leads
  SET 
    status = p_novo_status,
    historico = historico || jsonb_build_array(
      jsonb_build_object(
        'timestamp', NOW(),
        'evento', 'mudanca_status',
        'status_anterior', status,
        'status_novo', p_novo_status,
        'observacao', p_observacao
      )
    )
  WHERE id = p_lead_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- Descomente se precisar de segurança por usuário
-- ============================================

-- ALTER TABLE public.insurance_leads ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus leads ou leads não atribuídos
-- CREATE POLICY "Usuários veem seus leads"
--   ON public.insurance_leads
--   FOR SELECT
--   USING (
--     auth.uid() = atribuido_a OR 
--     atribuido_a IS NULL OR
--     auth.jwt() ->> 'role' = 'admin'
--   );

-- Política: Usuários podem atualizar apenas seus leads
-- CREATE POLICY "Usuários atualizam seus leads"
--   ON public.insurance_leads
--   FOR UPDATE
--   USING (
--     auth.uid() = atribuido_a OR
--     auth.jwt() ->> 'role' = 'admin'
--   );

-- ============================================
-- 8. DADOS DE EXEMPLO (Opcional para testes)
-- ============================================

-- INSERT INTO public.insurance_leads (
--   nome, whatsapp, email, operadora_atual, valor_atual, 
--   idades, economia_estimada, valor_proposto, status
-- ) VALUES
--   ('João Silva', '+5511999999999', 'joao@email.com', 'Unimed', 1200.00, 
--    '[35, 32]'::jsonb, 250.00, 950.00, 'novo'),
--   ('Maria Santos', '+5511988888888', 'maria@email.com', 'Bradesco', 1500.00, 
--    '[42, 40, 10]'::jsonb, 300.00, 1200.00, 'contatado'),
--   ('Pedro Costa', '+5511977777777', 'pedro@email.com', 'Amil', 980.00, 
--    '[28]'::jsonb, 150.00, 830.00, 'negociacao');

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar as tabelas criadas
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('insurance_leads');

-- Verificar as views criadas
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname IN ('dashboard_stats', 'leads_por_operadora', 'pipeline_vendas');

-- Ver estatísticas iniciais
SELECT * FROM public.dashboard_stats;
