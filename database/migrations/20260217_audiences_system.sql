-- =====================================================
-- BLUEPRINT 16 — Sistema de Públicos (Audiences)
-- Data: 2026-02-17
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TABELA 1: audiences
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  meta_audience_id VARCHAR(255) UNIQUE NOT NULL,
  meta_account_id VARCHAR(255) NOT NULL,

  audience_type VARCHAR(50) NOT NULL, -- custom, lookalike, saved
  subtype VARCHAR(50),

  name VARCHAR(255) NOT NULL,
  description TEXT,

  config JSONB DEFAULT '{}'::jsonb,

  source_audience_id UUID REFERENCES public.audiences(id) ON DELETE SET NULL,
  lookalike_spec JSONB,

  status VARCHAR(50) DEFAULT 'populating',
  approximate_count INTEGER DEFAULT 0,

  auto_sync BOOLEAN DEFAULT true,
  sync_frequency_hours INTEGER DEFAULT 4,
  last_synced_at TIMESTAMPTZ,
  sync_status VARCHAR(50),

  campaigns_count INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  avg_cpa DECIMAL(10,2),
  avg_roas DECIMAL(10,4),

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_audiences_type ON public.audiences(audience_type);
CREATE INDEX IF NOT EXISTS idx_audiences_status ON public.audiences(status);
CREATE INDEX IF NOT EXISTS idx_audiences_meta_id ON public.audiences(meta_audience_id);
CREATE INDEX IF NOT EXISTS idx_audiences_auto_sync ON public.audiences(auto_sync) WHERE auto_sync = true;
CREATE INDEX IF NOT EXISTS idx_audiences_source ON public.audiences(source_audience_id);

DROP TRIGGER IF EXISTS update_audiences_updated_at ON public.audiences;
CREATE TRIGGER update_audiences_updated_at
  BEFORE UPDATE ON public.audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- TABELA 2: audience_users
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audience_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_id UUID NOT NULL REFERENCES public.audiences(id) ON DELETE CASCADE,

  email_hash VARCHAR(64),
  phone_hash VARCHAR(64),
  external_id_hash VARCHAR(64),

  lead_id UUID REFERENCES public.insurance_leads(id) ON DELETE SET NULL,

  status VARCHAR(50) DEFAULT 'pending',
  upload_session_id VARCHAR(255),
  error_message TEXT,

  added_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ,

  CONSTRAINT unique_audience_user_external UNIQUE (audience_id, external_id_hash)
);

CREATE INDEX IF NOT EXISTS idx_audience_users_audience ON public.audience_users(audience_id);
CREATE INDEX IF NOT EXISTS idx_audience_users_status ON public.audience_users(status);
CREATE INDEX IF NOT EXISTS idx_audience_users_lead ON public.audience_users(lead_id);

-- ==========================================
-- TABELA 3: audience_sync_logs
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audience_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_id UUID NOT NULL REFERENCES public.audiences(id) ON DELETE CASCADE,

  users_added INTEGER DEFAULT 0,
  users_removed INTEGER DEFAULT 0,
  users_failed INTEGER DEFAULT 0,
  batch_count INTEGER DEFAULT 0,

  status VARCHAR(50) NOT NULL, -- success, partial, failed
  error_message TEXT,
  error_details JSONB,

  duration_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  triggered_by VARCHAR(50) DEFAULT 'manual',
  triggered_by_user UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audience_sync_logs_audience ON public.audience_sync_logs(audience_id);
CREATE INDEX IF NOT EXISTS idx_audience_sync_logs_created ON public.audience_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audience_sync_logs_status ON public.audience_sync_logs(status);

-- ==========================================
-- TABELA 4: audience_insights
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audience_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_id UUID NOT NULL REFERENCES public.audiences(id) ON DELETE CASCADE,

  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,

  ctr DECIMAL(10,4) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpa DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(10,4) DEFAULT 0,

  date_start DATE NOT NULL,
  date_end DATE NOT NULL,

  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_audience_insights_period UNIQUE(audience_id, date_start, date_end)
);

CREATE INDEX IF NOT EXISTS idx_audience_insights_audience ON public.audience_insights(audience_id);
CREATE INDEX IF NOT EXISTS idx_audience_insights_period ON public.audience_insights(date_start, date_end);

-- ==========================================
-- VIEW: audiences_summary
-- ==========================================
CREATE OR REPLACE VIEW public.audiences_summary AS
SELECT
  a.id,
  a.name,
  a.audience_type,
  a.status,
  a.approximate_count,
  a.auto_sync,
  a.last_synced_at,
  COUNT(DISTINCT au.id) FILTER (WHERE au.status = 'uploaded')::INTEGER AS users_count,
  (
    SELECT sl.status
    FROM public.audience_sync_logs sl
    WHERE sl.audience_id = a.id
    ORDER BY sl.created_at DESC
    LIMIT 1
  ) AS last_sync_status,
  COALESCE(SUM(ai.spend) FILTER (WHERE ai.date_start >= CURRENT_DATE - INTERVAL '30 days'), 0)::DECIMAL(10,2) AS total_spend_30d,
  COALESCE(SUM(ai.conversions) FILTER (WHERE ai.date_start >= CURRENT_DATE - INTERVAL '30 days'), 0)::INTEGER AS total_conversions_30d,
  COALESCE(AVG(ai.roas) FILTER (WHERE ai.date_start >= CURRENT_DATE - INTERVAL '30 days'), 0)::DECIMAL(10,4) AS avg_roas_30d,
  a.created_at
FROM public.audiences a
LEFT JOIN public.audience_users au ON au.audience_id = a.id
LEFT JOIN public.audience_insights ai ON ai.audience_id = a.id
WHERE a.deleted_at IS NULL
GROUP BY a.id
ORDER BY a.created_at DESC;

-- ==========================================
-- FUNÇÕES
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_pending_sync_count(p_audience_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.audience_users
    WHERE audience_id = p_audience_id
      AND status = 'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_audiences_for_sync()
RETURNS TABLE (
  id UUID,
  meta_audience_id VARCHAR,
  name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.meta_audience_id,
    a.name
  FROM public.audiences a
  WHERE a.auto_sync = true
    AND a.deleted_at IS NULL
    AND COALESCE(LOWER(a.status), 'ready') <> 'deleted'
    AND (
      a.last_synced_at IS NULL
      OR a.last_synced_at < NOW() - (COALESCE(a.sync_frequency_hours, 4) || ' hours')::INTERVAL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_audience_performance(
  p_audience_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_spend DECIMAL,
  total_conversions INTEGER,
  avg_cpa DECIMAL,
  avg_roas DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(spend), 0)::DECIMAL(10,2) AS total_spend,
    COALESCE(SUM(conversions), 0)::INTEGER AS total_conversions,
    CASE
      WHEN COALESCE(SUM(conversions), 0) > 0
      THEN ROUND((COALESCE(SUM(spend), 0) / SUM(conversions))::NUMERIC, 2)
      ELSE 0
    END::DECIMAL(10,2) AS avg_cpa,
    CASE
      WHEN COALESCE(SUM(spend), 0) > 0
      THEN ROUND((COALESCE(SUM(revenue), 0) / SUM(spend))::NUMERIC, 4)
      ELSE 0
    END::DECIMAL(10,4) AS avg_roas
  FROM public.audience_insights
  WHERE audience_id = p_audience_id
    AND date_start >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
END;
$$;

-- ==========================================
-- RLS
-- ==========================================
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_insights ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_full_access_audiences') THEN
    CREATE POLICY "admin_full_access_audiences" ON public.audiences
      FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_full_access_audience_users') THEN
    CREATE POLICY "admin_full_access_audience_users" ON public.audience_users
      FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_full_access_audience_sync_logs') THEN
    CREATE POLICY "admin_full_access_audience_sync_logs" ON public.audience_sync_logs
      FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_full_access_audience_insights') THEN
    CREATE POLICY "admin_full_access_audience_insights" ON public.audience_insights
      FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_full_access_audiences') THEN
    CREATE POLICY "service_role_full_access_audiences" ON public.audiences
      FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_full_access_audience_users') THEN
    CREATE POLICY "service_role_full_access_audience_users" ON public.audience_users
      FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_full_access_audience_sync_logs') THEN
    CREATE POLICY "service_role_full_access_audience_sync_logs" ON public.audience_sync_logs
      FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_full_access_audience_insights') THEN
    CREATE POLICY "service_role_full_access_audience_insights" ON public.audience_insights
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

COMMENT ON TABLE public.audiences IS 'Registro de públicos custom, lookalike e saved';
COMMENT ON TABLE public.audience_users IS 'Usuários hash por público para sincronização com Meta';
COMMENT ON TABLE public.audience_sync_logs IS 'Histórico de sincronizações CRM/Leads -> Meta Audience';
COMMENT ON TABLE public.audience_insights IS 'Cache de performance por público';
COMMENT ON VIEW public.audiences_summary IS 'Resumo agregado de públicos e sincronização';
