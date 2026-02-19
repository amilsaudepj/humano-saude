-- ============================================================
-- INTEGRAÇÃO: propostas_fila → producoes_corretor → commissions_ledger
-- 
-- Lógica:
--   1. Adiciona colunas em producoes_corretor para vincular à fila
--   2. Adiciona colunas em commissions_ledger para vincular à produção
--   3. Adiciona tabela de anexos/comprovantes para produções
--   4. Cria função que auto-gera produção + comissões quando proposta é implantada
-- ============================================================

-- 1. Adicionar vínculo producoes_corretor → propostas_fila
ALTER TABLE producoes_corretor 
  ADD COLUMN IF NOT EXISTS fila_proposta_id UUID,
  ADD COLUMN IF NOT EXISTS operadora_id UUID,
  ADD COLUMN IF NOT EXISTS valor_comissao_total DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS percentual_comissao DECIMAL(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS grade_id UUID,
  ADD COLUMN IF NOT EXISTS observacoes_admin TEXT,
  ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;

-- Índices
CREATE INDEX IF NOT EXISTS idx_prod_fila_proposta ON producoes_corretor(fila_proposta_id);
CREATE INDEX IF NOT EXISTS idx_prod_operadora ON producoes_corretor(operadora_id);

COMMENT ON COLUMN producoes_corretor.fila_proposta_id IS 'Vínculo com propostas_fila.id — origem da proposta';
COMMENT ON COLUMN producoes_corretor.operadora_id IS 'Vínculo com operadoras.id';
COMMENT ON COLUMN producoes_corretor.valor_comissao_total IS 'Valor total de comissão calculado para esta produção';
COMMENT ON COLUMN producoes_corretor.grade_id IS 'Grade de comissão aplicada (commission_grades.id)';
COMMENT ON COLUMN producoes_corretor.anexos IS 'JSON array de anexos [{url, nome, tipo, uploaded_at}]';

-- 2. Adicionar vínculo commissions_ledger → producoes_corretor
ALTER TABLE commissions_ledger
  ADD COLUMN IF NOT EXISTS producao_id UUID,
  ADD COLUMN IF NOT EXISTS fila_proposta_id UUID;

CREATE INDEX IF NOT EXISTS idx_cl_producao ON commissions_ledger(producao_id);
CREATE INDEX IF NOT EXISTS idx_cl_fila_proposta ON commissions_ledger(fila_proposta_id);

COMMENT ON COLUMN commissions_ledger.producao_id IS 'Vínculo com producoes_corretor.id — produção que gerou esta comissão';
COMMENT ON COLUMN commissions_ledger.fila_proposta_id IS 'Vínculo com propostas_fila.id — proposta original';

-- 3. Tabela de anexos e comprovantes para produções (independente)
CREATE TABLE IF NOT EXISTS producao_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producao_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'documento',
    -- documento, comprovante_pagamento, boleto, contrato, outros
  nome VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  mime_type VARCHAR(100),
  observacao TEXT,
  uploaded_by VARCHAR(50) DEFAULT 'admin', -- admin ou corretor
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pa_producao ON producao_anexos(producao_id);

ALTER TABLE producao_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_producao_anexos"
  ON producao_anexos FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE producao_anexos IS 'Anexos e comprovantes vinculados a produções';

-- 4. Função RPC para criar produção a partir de proposta implantada
-- Chamada pelo frontend quando admin muda status para "implantada"
CREATE OR REPLACE FUNCTION create_producao_from_fila(
  p_fila_id UUID,
  p_operadora_id UUID DEFAULT NULL,
  p_valor_mensalidade DECIMAL DEFAULT 0,
  p_modalidade TEXT DEFAULT NULL,
  p_subproduto TEXT DEFAULT NULL,
  p_percentual_comissao DECIMAL DEFAULT 100,
  p_numero_parcelas INTEGER DEFAULT 12,
  p_observacoes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_fila RECORD;
  v_lead RECORD;
  v_producao_id UUID;
  v_grade RECORD;
  v_pct_first DECIMAL;
  v_pct_recurring DECIMAL;
  v_valor_comissao DECIMAL;
  v_parcela_num INTEGER;
  v_reference_month VARCHAR;
  v_expected_date DATE;
BEGIN
  -- Buscar dados da fila
  SELECT * INTO v_fila FROM propostas_fila WHERE id = p_fila_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Proposta não encontrada na fila');
  END IF;

  -- Buscar dados do lead
  SELECT id, nome, cpf, whatsapp, email INTO v_lead 
  FROM insurance_leads WHERE id = v_fila.lead_id;

  -- Verificar se já existe produção para esta fila
  SELECT id INTO v_producao_id 
  FROM producoes_corretor WHERE fila_proposta_id = p_fila_id;
  
  IF v_producao_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Já existe produção para esta proposta', 'producao_id', v_producao_id);
  END IF;

  -- Buscar grade de comissão do corretor (se existir)
  SELECT * INTO v_grade 
  FROM commission_grades 
  WHERE broker_id = v_fila.corretor_id 
    AND (operator_id = p_operadora_id OR operator_id IS NULL)
    AND ativo = true
  ORDER BY operator_id NULLS LAST
  LIMIT 1;

  IF FOUND THEN
    v_pct_first := v_grade.first_installment_pct;
    v_pct_recurring := v_grade.recurring_pct;
  ELSE
    v_pct_first := p_percentual_comissao;
    v_pct_recurring := p_percentual_comissao;
  END IF;

  -- Criar produção
  INSERT INTO producoes_corretor (
    corretor_id,
    fila_proposta_id,
    numero_proposta,
    nome_segurado,
    cpf_segurado,
    operadora,
    operadora_id,
    modalidade,
    subproduto,
    valor_mensalidade,
    percentual_comissao,
    grade_id,
    status,
    data_producao,
    data_implantacao,
    observacoes_admin,
    metadata
  ) VALUES (
    v_fila.corretor_id,
    p_fila_id,
    COALESCE((v_fila.dados_proposta->>'numero_proposta')::TEXT, 'PROP-' || LEFT(p_fila_id::TEXT, 8)),
    COALESCE(v_lead.nome, 'Não informado'),
    v_lead.cpf,
    NULL, -- será preenchido via operadora_id JOIN
    p_operadora_id,
    COALESCE(p_modalidade, v_fila.categoria),
    p_subproduto,
    p_valor_mensalidade,
    v_pct_first,
    v_grade.id,
    'Implantada',
    CURRENT_DATE,
    CURRENT_DATE,
    p_observacoes,
    jsonb_build_object(
      'origem', 'fila_proposta',
      'fila_id', p_fila_id,
      'lead_id', v_fila.lead_id,
      'dados_proposta', v_fila.dados_proposta
    )
  ) RETURNING id INTO v_producao_id;

  -- Gerar parcelas de comissão e ledger entries
  v_reference_month := to_char(CURRENT_DATE, 'YYYY-MM');
  
  FOR v_parcela_num IN 1..p_numero_parcelas LOOP
    -- Calcular percentual e valor
    IF v_parcela_num = 1 THEN
      v_valor_comissao := p_valor_mensalidade * (v_pct_first / 100);
    ELSE
      v_valor_comissao := p_valor_mensalidade * (v_pct_recurring / 100);
    END IF;

    -- Calcular data esperada de pagamento (mês a mês)
    v_expected_date := (CURRENT_DATE + ((v_parcela_num - 1) || ' months')::INTERVAL)::DATE;
    v_reference_month := to_char(v_expected_date, 'YYYY-MM');

    -- Criar parcela na tabela parcelas_comissao
    INSERT INTO parcelas_comissao (
      producao_id,
      corretor_id,
      numero_parcela,
      valor_parcela,
      taxa,
      data_vencimento,
      percentual_comissao,
      status_comissao
    ) VALUES (
      v_producao_id,
      v_fila.corretor_id,
      v_parcela_num,
      p_valor_mensalidade,
      v_valor_comissao,
      v_expected_date,
      CASE WHEN v_parcela_num = 1 THEN v_pct_first ELSE v_pct_recurring END,
      'pendente'
    );

    -- Criar entrada no commissions_ledger
    INSERT INTO commissions_ledger (
      producao_id,
      fila_proposta_id,
      broker_id,
      operator_id,
      grade_id,
      titular_name,
      proposal_number,
      cpf_titular,
      amount,
      base_amount,
      applied_pct,
      installment_number,
      status,
      reference_month,
      expected_payment_date
    ) VALUES (
      v_producao_id,
      p_fila_id,
      v_fila.corretor_id,
      p_operadora_id,
      v_grade.id,
      COALESCE(v_lead.nome, 'Não informado'),
      COALESCE((v_fila.dados_proposta->>'numero_proposta')::TEXT, 'PROP-' || LEFT(p_fila_id::TEXT, 8)),
      v_lead.cpf,
      v_valor_comissao,
      p_valor_mensalidade,
      CASE WHEN v_parcela_num = 1 THEN v_pct_first ELSE v_pct_recurring END,
      v_parcela_num,
      'pending',
      v_reference_month,
      v_expected_date
    );
  END LOOP;

  -- Atualizar valor total de comissão na produção
  UPDATE producoes_corretor 
  SET valor_comissao_total = (
    SELECT COALESCE(SUM(amount), 0) FROM commissions_ledger WHERE producao_id = v_producao_id
  )
  WHERE id = v_producao_id;

  RETURN json_build_object(
    'success', true,
    'producao_id', v_producao_id,
    'parcelas_geradas', p_numero_parcelas,
    'corretor_id', v_fila.corretor_id,
    'valor_mensalidade', p_valor_mensalidade
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_producao_from_fila IS 'Cria produção e parcelas de comissão a partir de uma proposta da fila';

-- 5. Função para recalcular comissões de uma produção (quando admin altera valores/grade)
CREATE OR REPLACE FUNCTION recalcular_comissoes_producao(
  p_producao_id UUID,
  p_valor_mensalidade DECIMAL DEFAULT NULL,
  p_pct_first DECIMAL DEFAULT NULL,
  p_pct_recurring DECIMAL DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_prod RECORD;
  v_valor DECIMAL;
  v_first DECIMAL;
  v_recurring DECIMAL;
  v_total DECIMAL := 0;
BEGIN
  SELECT * INTO v_prod FROM producoes_corretor WHERE id = p_producao_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Produção não encontrada');
  END IF;

  v_valor := COALESCE(p_valor_mensalidade, v_prod.valor_mensalidade);
  v_first := COALESCE(p_pct_first, v_prod.percentual_comissao, 100);
  v_recurring := COALESCE(p_pct_recurring, 30);

  -- Atualizar cada entrada no ledger
  UPDATE commissions_ledger SET
    base_amount = v_valor,
    applied_pct = CASE WHEN installment_number = 1 THEN v_first ELSE v_recurring END,
    amount = v_valor * (CASE WHEN installment_number = 1 THEN v_first ELSE v_recurring END / 100)
  WHERE producao_id = p_producao_id
    AND status NOT IN ('paid', 'cancelled');

  -- Atualizar parcelas_comissao
  UPDATE parcelas_comissao SET
    valor_parcela = v_valor,
    percentual_comissao = CASE WHEN numero_parcela = 1 THEN v_first ELSE v_recurring END,
    taxa = v_valor * (CASE WHEN numero_parcela = 1 THEN v_first ELSE v_recurring END / 100)
  WHERE producao_id = p_producao_id
    AND status_comissao != 'paga';

  -- Recalcular total
  SELECT COALESCE(SUM(amount), 0) INTO v_total 
  FROM commissions_ledger WHERE producao_id = p_producao_id;

  -- Atualizar produção
  UPDATE producoes_corretor SET
    valor_mensalidade = v_valor,
    percentual_comissao = v_first,
    valor_comissao_total = v_total
  WHERE id = p_producao_id;

  RETURN json_build_object(
    'success', true,
    'producao_id', p_producao_id,
    'valor_mensalidade', v_valor,
    'total_comissao', v_total,
    'pct_first', v_first,
    'pct_recurring', v_recurring
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. View integrada para o admin ver tudo
CREATE OR REPLACE VIEW admin_producoes_integradas AS
SELECT
  pc.id,
  pc.corretor_id,
  pc.fila_proposta_id,
  pc.numero_proposta,
  pc.nome_segurado,
  pc.cpf_segurado,
  pc.operadora,
  pc.operadora_id,
  pc.modalidade,
  pc.subproduto,
  pc.valor_mensalidade,
  pc.valor_comissao_total,
  pc.percentual_comissao,
  pc.grade_id,
  pc.status,
  pc.data_producao,
  pc.data_implantacao,
  pc.observacoes_admin,
  pc.anexos,
  pc.created_at,
  pc.updated_at,
  c.nome AS corretor_nome,
  c.email AS corretor_email,
  c.telefone AS corretor_telefone,
  (SELECT COUNT(*) FROM commissions_ledger cl WHERE cl.producao_id = pc.id) AS total_parcelas,
  (SELECT COUNT(*) FROM commissions_ledger cl WHERE cl.producao_id = pc.id AND cl.status = 'paid') AS parcelas_pagas,
  (SELECT COALESCE(SUM(cl.amount), 0) FROM commissions_ledger cl WHERE cl.producao_id = pc.id AND cl.status = 'paid') AS valor_pago,
  (SELECT COALESCE(SUM(cl.amount), 0) FROM commissions_ledger cl WHERE cl.producao_id = pc.id AND cl.status = 'pending') AS valor_pendente
FROM producoes_corretor pc
LEFT JOIN corretores c ON c.id = pc.corretor_id;

COMMENT ON VIEW admin_producoes_integradas IS 'Visão integrada para admin: produções com dados do corretor e resumo de comissões';
