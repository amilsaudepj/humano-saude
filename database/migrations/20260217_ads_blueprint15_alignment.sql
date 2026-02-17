-- =====================================================
-- Blueprint 15 Alignment (Escala Automática de Ads)
-- Data: 2026-02-17
-- Objetivo: compatibilizar schema atual com painel de escala
-- sem quebrar tabelas existentes.
-- =====================================================

-- =============================================
-- ads_campaigns_log: campos adicionais
-- =============================================
ALTER TABLE public.ads_campaigns_log
  ADD COLUMN IF NOT EXISTS campaign_name TEXT,
  ADD COLUMN IF NOT EXISTS campaign_status TEXT DEFAULT 'PAUSED',
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT,
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS generated_copies JSONB,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_ads_campaigns_log_campaign_status
  ON public.ads_campaigns_log(campaign_status);

-- =============================================
-- optimization_logs: índice para action_type
-- =============================================
CREATE INDEX IF NOT EXISTS idx_optimization_logs_action
  ON public.optimization_logs(action_type, created_at DESC);

-- =============================================
-- View de resumo diário
-- =============================================
CREATE OR REPLACE VIEW public.optimization_summary AS
SELECT
  DATE(created_at) AS date,
  COUNT(*)::INTEGER AS total_optimizations,
  SUM(CASE WHEN UPPER(action_type) = 'PAUSE' THEN 1 ELSE 0 END)::INTEGER AS paused_ads,
  SUM(CASE WHEN UPPER(action_type) = 'SCALE' THEN 1 ELSE 0 END)::INTEGER AS scaled_ads,
  SUM(CASE WHEN UPPER(action_type) = 'NO_ACTION' THEN 1 ELSE 0 END)::INTEGER AS no_action_ads
FROM public.optimization_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =============================================
-- Função: campanhas ativas (preferência ads_campaigns)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_active_campaigns_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_active INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO total_active
  FROM public.ads_campaigns
  WHERE UPPER(status) = 'ACTIVE';

  IF total_active IS NULL OR total_active = 0 THEN
    SELECT COUNT(*)
    INTO total_active
    FROM public.ads_campaigns_log
    WHERE UPPER(COALESCE(campaign_status, '')) = 'ACTIVE';
  END IF;

  RETURN COALESCE(total_active, 0);
END;
$$;

-- =============================================
-- Função: top campanhas por ROAS
-- =============================================
CREATE OR REPLACE FUNCTION public.get_top_performing_campaigns(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  campaign_id TEXT,
  objective TEXT,
  roas NUMERIC,
  spend NUMERIC,
  revenue NUMERIC,
  purchases INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.campaign_id,
    c.objective,
    CASE WHEN COALESCE(c.spend, 0) > 0 THEN COALESCE(c.metadata->>'purchase_value', '0')::NUMERIC / c.spend ELSE 0 END AS roas,
    COALESCE(c.spend, 0) AS spend,
    COALESCE(c.metadata->>'purchase_value', '0')::NUMERIC AS revenue,
    COALESCE((c.metadata->>'purchases')::INTEGER, 0) AS purchases
  FROM public.ads_campaigns c
  WHERE UPPER(c.status) = 'ACTIVE'
  ORDER BY roas DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON VIEW public.optimization_summary IS
  'Resumo diário das ações de otimização (PAUSE, SCALE, NO_ACTION).';
