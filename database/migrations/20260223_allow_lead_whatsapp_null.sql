-- Permitir leads sem telefone (ex.: completar cotação vindo do e-mail)
-- whatsapp passa a aceitar NULL; o CHECK continua válido quando há valor

ALTER TABLE public.insurance_leads
  ALTER COLUMN whatsapp DROP NOT NULL;

ALTER TABLE public.insurance_leads
  DROP CONSTRAINT IF EXISTS whatsapp_format;

ALTER TABLE public.insurance_leads
  ADD CONSTRAINT whatsapp_format CHECK (
    whatsapp IS NULL OR (whatsapp ~ '^\+?[0-9]{10,15}$')
  );

COMMENT ON COLUMN public.insurance_leads.whatsapp IS 'Telefone WhatsApp (10-15 dígitos). NULL quando o lead veio só por e-mail (ex.: completar cotação).';
