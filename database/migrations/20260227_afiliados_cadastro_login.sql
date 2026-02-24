-- =============================================
-- AFILIADOS: cadastro completo, banco, doc, termo e login
-- Permite pagamento de comissão direto na conta do afiliado
-- =============================================

-- 1. Estender corretor_afiliados
ALTER TABLE public.corretor_afiliados
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS doc_anexo_url TEXT,
  ADD COLUMN IF NOT EXISTS banco_nome TEXT,
  ADD COLUMN IF NOT EXISTS banco_agencia TEXT,
  ADD COLUMN IF NOT EXISTS banco_conta TEXT,
  ADD COLUMN IF NOT EXISTS banco_tipo TEXT CHECK (banco_tipo IS NULL OR banco_tipo IN ('conta_corrente', 'conta_poupanca')),
  ADD COLUMN IF NOT EXISTS pix TEXT,
  ADD COLUMN IF NOT EXISTS termo_aceito BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS termo_assinado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cadastro_completo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS indicado_por_afiliado_id UUID REFERENCES public.corretor_afiliados(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS indicado_por_corretor_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_corretor_afiliados_cpf ON public.corretor_afiliados(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_corretor_afiliados_cadastro_completo ON public.corretor_afiliados(cadastro_completo);
CREATE INDEX IF NOT EXISTS idx_corretor_afiliados_indicado_por ON public.corretor_afiliados(indicado_por_corretor_id) WHERE indicado_por_corretor_id IS NOT NULL;

COMMENT ON COLUMN public.corretor_afiliados.cadastro_completo IS 'true quando preencheu banco, doc e termo para receber comissões';
COMMENT ON COLUMN public.corretor_afiliados.indicado_por_corretor_id IS 'Corretor que indicou este afiliado (opcional)';
COMMENT ON COLUMN public.corretor_afiliados.indicado_por_afiliado_id IS 'Afiliado que indicou este afiliado (opcional)';

-- 2. Solicitações corretor: quem indicou (corretor que compartilhou o link)
ALTER TABLE public.solicitacoes_corretor
  ADD COLUMN IF NOT EXISTS indicado_por_corretor_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_corretor_indicado_por ON public.solicitacoes_corretor(indicado_por_corretor_id) WHERE indicado_por_corretor_id IS NOT NULL;

-- 3. Leads indicação: garantir que temos origem para diferenciar (form indicar vs link)
-- já existe coluna origem; usar valores: 'link_corretor', 'form_indicar', 'form_indicar_afiliado'
