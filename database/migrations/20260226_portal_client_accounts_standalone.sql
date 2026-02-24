-- =====================================================
-- ALTERNATIVA: portal_client_accounts SEM FK para insurance_leads
-- Use este arquivo se 20260217 falhar por "insurance_leads não existe".
-- Cria a tabela com lead_id nullable (sem FK).
-- =====================================================

CREATE TABLE IF NOT EXISTS public.portal_client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID UNIQUE,
  corretor_id UUID,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  senha_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  dados_resumo JSONB NOT NULL DEFAULT '{}'::jsonb,
  solicitou_documentacao_completa BOOLEAN NOT NULL DEFAULT FALSE,
  solicitou_documentacao_em TIMESTAMPTZ,
  ultimo_login_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portal_client_accounts_email_key UNIQUE (email),
  CONSTRAINT portal_client_accounts_status_check CHECK (status IN ('ativo', 'inativo', 'bloqueado'))
);

CREATE INDEX IF NOT EXISTS idx_portal_client_accounts_email
  ON public.portal_client_accounts (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_portal_client_accounts_status
  ON public.portal_client_accounts (status);
CREATE INDEX IF NOT EXISTS idx_portal_client_accounts_corretor
  ON public.portal_client_accounts (corretor_id);

CREATE OR REPLACE FUNCTION public.set_portal_client_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_portal_client_accounts_updated_at ON public.portal_client_accounts;
CREATE TRIGGER trg_set_portal_client_accounts_updated_at
BEFORE UPDATE ON public.portal_client_accounts
FOR EACH ROW
EXECUTE PROCEDURE public.set_portal_client_accounts_updated_at();
