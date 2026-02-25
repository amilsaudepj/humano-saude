-- Quando o admin reativa um corretor, a contagem dos 7 dias para confirmar e-mail
-- zera e passa a contar a partir da reativação (esta coluna).

ALTER TABLE public.corretores
  ADD COLUMN IF NOT EXISTS prazo_confirmacao_email_desde TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.corretores.prazo_confirmacao_email_desde IS 'Data/hora a partir da qual contar 7 dias para confirmação de e-mail. Preenchido ao reativar o corretor (admin). Se NULL, usa created_at.';
