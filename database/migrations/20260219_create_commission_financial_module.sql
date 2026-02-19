-- ============================================================
-- MÓDULO FINANCEIRO DE COMISSÕES — Fase Avançada
-- Tabelas: commission_grades, commissions_ledger
-- ============================================================

-- 1. Grades de Comissão por Corretor + Operadora
CREATE TABLE IF NOT EXISTS commission_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL,
  operator_id UUID REFERENCES operadoras(id) ON DELETE CASCADE,
  -- Percentual da 1ª parcela (venda nova)
  first_installment_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  -- Percentual recorrente (parcelas 2+)
  recurring_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  -- Regras de bônus em JSON (ex: {"meta_mensal": 10, "bonus_pct": 5})
  bonus_rules JSONB DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(broker_id, operator_id)
);

COMMENT ON TABLE commission_grades IS 'Grade de comissão por corretor/operadora com percentuais e bônus';
COMMENT ON COLUMN commission_grades.first_installment_pct IS 'Percentual aplicado na 1ª parcela da proposta';
COMMENT ON COLUMN commission_grades.recurring_pct IS 'Percentual aplicado nas parcelas recorrentes (2+)';
COMMENT ON COLUMN commission_grades.bonus_rules IS 'JSON com regras de bônus: meta_mensal, bonus_pct, etc';

-- 2. Ledger de Comissões (rastreio granular por parcela)
-- NOTA: proposal_id sem FK pois tabela propostas pode ser criada depois.
-- Quando propostas existir, adicionar FK com:
--   ALTER TABLE commissions_ledger ADD CONSTRAINT fk_cl_proposal FOREIGN KEY (proposal_id) REFERENCES propostas(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS commissions_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID,
  broker_id UUID NOT NULL,
  operator_id UUID REFERENCES operadoras(id) ON DELETE SET NULL,
  grade_id UUID REFERENCES commission_grades(id) ON DELETE SET NULL,
  -- Dados desnormalizados (auto-suficiente sem JOIN em propostas)
  titular_name VARCHAR(255),
  proposal_number VARCHAR(100),
  cpf_titular VARCHAR(14),
  -- Valor da comissão desta parcela
  amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  -- Valor base da mensalidade que gerou esta comissão
  base_amount NUMERIC(12,2) DEFAULT 0.00,
  -- Percentual aplicado nesta parcela
  applied_pct NUMERIC(5,2) DEFAULT 0.00,
  -- Número da parcela (1 = primeira, 2+ = recorrente)
  installment_number INTEGER NOT NULL DEFAULT 1,
  -- Status do lançamento
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'disputed')),
  -- Datas de controle financeiro
  reference_month VARCHAR(7) NOT NULL, -- formato YYYY-MM
  expected_payment_date DATE,
  actual_payment_date DATE,
  -- Dados do pagamento efetivo
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  -- Auditoria Gemini
  audit_status VARCHAR(20) DEFAULT 'not_audited'
    CHECK (audit_status IN ('not_audited', 'match', 'divergent', 'missing')),
  audit_notes TEXT,
  audited_at TIMESTAMPTZ,
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE commissions_ledger IS 'Ledger granular de comissões — cada linha = 1 parcela de 1 proposta';
COMMENT ON COLUMN commissions_ledger.reference_month IS 'Mês de referência no formato YYYY-MM';
COMMENT ON COLUMN commissions_ledger.audit_status IS 'Resultado da auditoria automática via Gemini';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_cl_broker ON commissions_ledger(broker_id);
CREATE INDEX IF NOT EXISTS idx_cl_proposal ON commissions_ledger(proposal_id);
CREATE INDEX IF NOT EXISTS idx_cl_status ON commissions_ledger(status);
CREATE INDEX IF NOT EXISTS idx_cl_reference_month ON commissions_ledger(reference_month);
CREATE INDEX IF NOT EXISTS idx_cl_expected_payment ON commissions_ledger(expected_payment_date);
CREATE INDEX IF NOT EXISTS idx_cl_audit_status ON commissions_ledger(audit_status);
CREATE INDEX IF NOT EXISTS idx_cg_broker ON commission_grades(broker_id);

-- 4. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_commission_grades_updated') THEN
    CREATE TRIGGER trg_commission_grades_updated
      BEFORE UPDATE ON commission_grades
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_commissions_ledger_updated') THEN
    CREATE TRIGGER trg_commissions_ledger_updated
      BEFORE UPDATE ON commissions_ledger
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 5. RLS (Row Level Security)
ALTER TABLE commission_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions_ledger ENABLE ROW LEVEL SECURITY;

-- Admins (service_role) veem tudo
CREATE POLICY "service_role_full_access_grades"
  ON commission_grades FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_ledger"
  ON commissions_ledger FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Corretores veem apenas seus próprios dados
CREATE POLICY "broker_read_own_grades"
  ON commission_grades FOR SELECT
  TO authenticated
  USING (broker_id = auth.uid());

CREATE POLICY "broker_read_own_ledger"
  ON commissions_ledger FOR SELECT
  TO authenticated
  USING (broker_id = auth.uid());

-- 6. View materializada para dashboard financeiro
CREATE OR REPLACE VIEW commissions_monthly_summary AS
SELECT
  reference_month,
  broker_id,
  COUNT(*) AS total_entries,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_count,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
  COUNT(*) FILTER (WHERE status = 'disputed') AS disputed_count,
  COALESCE(SUM(amount) FILTER (WHERE status IN ('pending', 'confirmed')), 0) AS total_payable,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS total_paid,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS total_pending,
  COALESCE(SUM(amount) FILTER (WHERE audit_status = 'divergent'), 0) AS total_divergent
FROM commissions_ledger
GROUP BY reference_month, broker_id;

-- 7. RPC para resumo mensal (chamada do frontend)
CREATE OR REPLACE FUNCTION get_commissions_summary(p_month VARCHAR DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  target_month VARCHAR;
  result JSON;
BEGIN
  target_month := COALESCE(p_month, to_char(now(), 'YYYY-MM'));

  SELECT json_build_object(
    'month', target_month,
    'total_payable', COALESCE(SUM(amount) FILTER (WHERE status IN ('pending', 'confirmed')), 0),
    'total_pending_operator', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
    'total_paid', COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0),
    'total_cancelled', COALESCE(SUM(amount) FILTER (WHERE status = 'cancelled'), 0),
    'total_disputed', COALESCE(SUM(amount) FILTER (WHERE status = 'disputed'), 0),
    'entries_count', COUNT(*),
    'pending_count', COUNT(*) FILTER (WHERE status = 'pending'),
    'confirmed_count', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'paid_count', COUNT(*) FILTER (WHERE status = 'paid'),
    'divergent_count', COUNT(*) FILTER (WHERE audit_status = 'divergent'),
    'missing_count', COUNT(*) FILTER (WHERE audit_status = 'missing')
  ) INTO result
  FROM commissions_ledger
  WHERE reference_month = target_month;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
