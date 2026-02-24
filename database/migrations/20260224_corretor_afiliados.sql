-- =============================================
-- AFILIADOS DO CORRETOR
-- Corretor cadastra pessoas que vão indicar leads para ele.
-- Cada afiliado tem um link único (/indicar?ref=TOKEN) que atribui o lead ao corretor.
-- =============================================

CREATE TABLE IF NOT EXISTS public.corretor_afiliados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,

  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,

  -- Token único para o link de indicação (ex: /indicar?ref=abc123)
  token_unico TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(token_unico)
);

CREATE INDEX IF NOT EXISTS idx_corretor_afiliados_corretor ON corretor_afiliados(corretor_id);
CREATE INDEX IF NOT EXISTS idx_corretor_afiliados_token ON corretor_afiliados(token_unico);
CREATE INDEX IF NOT EXISTS idx_corretor_afiliados_ativo ON corretor_afiliados(ativo) WHERE ativo = true;

DROP TRIGGER IF EXISTS update_corretor_afiliados_updated_at ON corretor_afiliados;
CREATE TRIGGER update_corretor_afiliados_updated_at
  BEFORE UPDATE ON corretor_afiliados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE corretor_afiliados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_corretor_afiliados"
  ON corretor_afiliados FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- LEADS_INDICACAO: rastrear qual afiliado indicou (opcional)
-- =============================================

ALTER TABLE public.leads_indicacao
  ADD COLUMN IF NOT EXISTS afiliado_id UUID REFERENCES public.corretor_afiliados(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_indicacao_afiliado ON leads_indicacao(afiliado_id);
