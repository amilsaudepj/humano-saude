-- ============================================
-- MIGRATION: Lead contact tracking for sales playbook
-- DATA: 2026-02-17
-- ============================================

-- 1) Campo de ultimo contato no lead
ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_insurance_leads_last_contact_at
  ON public.insurance_leads(last_contact_at DESC);

-- 2) Log dedicado de interacoes comerciais por canal
CREATE TABLE IF NOT EXISTS public.interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.insurance_leads(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.crm_cards(id) ON DELETE SET NULL,
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL,
  channel VARCHAR(30) NOT NULL DEFAULT 'whatsapp',
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_lead_id
  ON public.interaction_logs(lead_id);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_card_id
  ON public.interaction_logs(card_id);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_corretor_id
  ON public.interaction_logs(corretor_id);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_created_at
  ON public.interaction_logs(created_at DESC);

ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interaction_logs_corretor_access" ON public.interaction_logs;
CREATE POLICY "interaction_logs_corretor_access" ON public.interaction_logs
  FOR ALL
  TO authenticated
  USING (
    corretor_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.corretores c
      WHERE c.id = interaction_logs.corretor_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    corretor_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.corretores c
      WHERE c.id = interaction_logs.corretor_id
        AND c.user_id = auth.uid()
    )
  );
