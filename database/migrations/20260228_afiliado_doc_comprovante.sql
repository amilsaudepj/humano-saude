-- Comprovante de residência do afiliado (completar cadastro)
-- doc_anexo_url = Identidade/CPF (CNH, RG etc.); doc_comprovante_residencia_url = Comprovante de residência

ALTER TABLE public.corretor_afiliados
  ADD COLUMN IF NOT EXISTS doc_comprovante_residencia_url TEXT;

COMMENT ON COLUMN public.corretor_afiliados.doc_anexo_url IS 'URL do documento de identidade/CPF (CNH, RG, etc.)';
COMMENT ON COLUMN public.corretor_afiliados.doc_comprovante_residencia_url IS 'URL do comprovante de residência';
