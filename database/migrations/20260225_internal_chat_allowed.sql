-- ============================================================
-- Chat interno: quem cada corretor pode conversar (admin define)
-- Tabela: internal_chat_allowed
-- ============================================================

CREATE TABLE IF NOT EXISTS public.internal_chat_allowed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_email TEXT NOT NULL,
  allowed_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(corretor_email, allowed_email)
);

CREATE INDEX IF NOT EXISTS idx_internal_chat_allowed_corretor
  ON public.internal_chat_allowed(corretor_email);

ALTER TABLE public.internal_chat_allowed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "internal_chat_allowed_service_all" ON public.internal_chat_allowed;
CREATE POLICY "internal_chat_allowed_service_all" ON public.internal_chat_allowed
  FOR ALL TO service_role USING (true) WITH CHECK (true);
