-- =============================================================================
-- Garantir coluna corretor_id em insurance_leads
-- Corrige erro: "Could not find the 'corretor_id' column of 'insurance_leads'
-- in the schema cache" ao cadastrar afiliado (quero ser afiliado).
-- Executar no Supabase SQL Editor se a coluna ainda não existir.
-- =============================================================================

ALTER TABLE public.insurance_leads
  ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_leads_corretor_id
  ON public.insurance_leads(corretor_id);

COMMENT ON COLUMN public.insurance_leads.corretor_id IS 'Corretor dono do lead (multi-tenant). NULL = admin/sem vínculo.';
