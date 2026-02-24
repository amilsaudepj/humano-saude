-- Adiciona controle de confirmação de e-mail para corretores.
-- Se o corretor não confirmar em até 7 dias, a conta pode ser suspensa (ativo = false).

ALTER TABLE public.corretores
  ADD COLUMN IF NOT EXISTS email_confirmado_em TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.corretores.email_confirmado_em IS 'Data/hora em que o corretor confirmou o e-mail. NULL = não confirmado. Prazo de 7 dias a partir de created_at para confirmar.';

-- Opcional: considerar corretores já existentes como confirmados (evita banner para todos):
-- UPDATE public.corretores SET email_confirmado_em = created_at WHERE email_confirmado_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_corretores_email_confirmado_em ON public.corretores(email_confirmado_em)
  WHERE email_confirmado_em IS NULL;
