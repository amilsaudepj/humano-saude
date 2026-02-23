-- Coluna empresa (razão social) em insurance_leads — usada pela completar-cotacao e LP leads

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'insurance_leads'
      AND column_name = 'empresa'
  ) THEN
    ALTER TABLE public.insurance_leads
      ADD COLUMN empresa VARCHAR(255);
    COMMENT ON COLUMN public.insurance_leads.empresa IS 'Razão social da empresa (consultada por CNPJ na Brasil API).';
  END IF;
END $$;
