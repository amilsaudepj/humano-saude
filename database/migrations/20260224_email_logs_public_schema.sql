-- ============================================================
-- Aplicar no Supabase quando aparecer:
-- "Could not find the table 'public.email_logs' in the schema cache"
-- Cria email_logs e email_events no schema public + view + RLS
-- ============================================================

-- 1. Tabela principal
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id TEXT UNIQUE,
  from_email TEXT NOT NULL DEFAULT 'Humano Saúde <noreply@humanosaude.com.br>',
  to_email TEXT NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  reply_to TEXT,
  subject TEXT NOT NULL,
  template_name TEXT,
  template_version TEXT DEFAULT '1.0',
  html_content TEXT,
  text_content TEXT,
  email_type TEXT NOT NULL DEFAULT 'transactional',
  category TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'queued',
  last_event TEXT,
  last_event_at TIMESTAMPTZ,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  error_code TEXT,
  bounce_type TEXT,
  triggered_by TEXT,
  reference_type TEXT,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de eventos
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_log_id UUID NOT NULL REFERENCES public.email_logs(id) ON DELETE CASCADE,
  resend_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  click_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  bounce_type TEXT,
  bounce_message TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. View de estatísticas (últimos 30 dias)
CREATE OR REPLACE VIEW public.email_stats AS
SELECT
  COUNT(*)::BIGINT AS total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT AS total_delivered,
  COUNT(*) FILTER (WHERE status = 'opened' OR opened_count > 0)::BIGINT AS total_opened,
  COUNT(*) FILTER (WHERE clicked_count > 0)::BIGINT AS total_clicked,
  COUNT(*) FILTER (WHERE status = 'bounced')::BIGINT AS total_bounced,
  COUNT(*) FILTER (WHERE status = 'complained')::BIGINT AS total_complained,
  COUNT(*) FILTER (WHERE status = 'failed')::BIGINT AS total_failed,
  ROUND((COUNT(*) FILTER (WHERE status = 'delivered'))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) AS delivery_rate,
  ROUND((COUNT(*) FILTER (WHERE status = 'opened' OR opened_count > 0))::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0) * 100, 2) AS open_rate,
  ROUND((COUNT(*) FILTER (WHERE clicked_count > 0))::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE status = 'opened' OR opened_count > 0), 0) * 100, 2) AS click_rate,
  ROUND((COUNT(*) FILTER (WHERE status = 'bounced'))::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) AS bounce_rate,
  COUNT(*) FILTER (WHERE email_type = 'transactional')::BIGINT AS transactional_count,
  COUNT(*) FILTER (WHERE email_type = 'marketing')::BIGINT AS marketing_count,
  COUNT(*) FILTER (WHERE email_type = 'system')::BIGINT AS system_count,
  NOW() AS calculated_at
FROM public.email_logs
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON public.email_logs(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_email_log_id ON public.email_events(email_log_id);

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER trg_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_logs_updated_at();

-- 6. RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_email_logs_all" ON public.email_logs;
CREATE POLICY "service_role_email_logs_all" ON public.email_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_email_events_all" ON public.email_events;
CREATE POLICY "service_role_email_events_all" ON public.email_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_read_own_emails" ON public.email_logs;
CREATE POLICY "users_read_own_emails" ON public.email_logs
  FOR SELECT TO authenticated USING (to_email = auth.email());

DROP POLICY IF EXISTS "users_read_own_events" ON public.email_events;
CREATE POLICY "users_read_own_events" ON public.email_events
  FOR SELECT TO authenticated
  USING (email_log_id IN (SELECT id FROM public.email_logs WHERE to_email = auth.email()));
