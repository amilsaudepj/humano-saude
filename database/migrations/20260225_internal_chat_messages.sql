-- ============================================================
-- Chat interno da equipe (portal admin)
-- Tabela: internal_chat_messages
-- ============================================================

CREATE TABLE IF NOT EXISTS public.internal_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_internal_chat_sender_receiver
  ON public.internal_chat_messages(sender_email, receiver_email);
CREATE INDEX IF NOT EXISTS idx_internal_chat_receiver_sender
  ON public.internal_chat_messages(receiver_email, sender_email);
CREATE INDEX IF NOT EXISTS idx_internal_chat_created
  ON public.internal_chat_messages(created_at DESC);

ALTER TABLE public.internal_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "internal_chat_service_all" ON public.internal_chat_messages;
CREATE POLICY "internal_chat_service_all" ON public.internal_chat_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "internal_chat_authenticated_read_own" ON public.internal_chat_messages;
CREATE POLICY "internal_chat_authenticated_read_own" ON public.internal_chat_messages
  FOR SELECT TO authenticated
  USING (
    sender_email = auth.jwt()->>'email' OR receiver_email = auth.jwt()->>'email'
  );

DROP POLICY IF EXISTS "internal_chat_authenticated_insert_own" ON public.internal_chat_messages;
CREATE POLICY "internal_chat_authenticated_insert_own" ON public.internal_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_email = auth.jwt()->>'email');
