-- Notificações por perfil: admin vs corretor.
-- Admin vê apenas destino = 'admin'. Corretor vê apenas destino = 'corretor' e corretor_id = seu id.

ALTER TABLE public.notificacoes
  ADD COLUMN IF NOT EXISTS destino VARCHAR(20) NOT NULL DEFAULT 'admin'
    CHECK (destino IN ('admin', 'corretor'));

ALTER TABLE public.notificacoes
  ADD COLUMN IF NOT EXISTS corretor_id UUID DEFAULT NULL;

COMMENT ON COLUMN public.notificacoes.destino IS 'admin = painel admin; corretor = painel do corretor (usa corretor_id).';
COMMENT ON COLUMN public.notificacoes.corretor_id IS 'Quando destino = corretor, ID do corretor que deve ver a notificação.';

CREATE INDEX IF NOT EXISTS idx_notificacoes_destino ON public.notificacoes(destino);
CREATE INDEX IF NOT EXISTS idx_notificacoes_destino_corretor ON public.notificacoes(destino, corretor_id)
  WHERE destino = 'corretor';

-- Manter notificações existentes como admin (já é o default).
-- UPDATE public.notificacoes SET destino = 'admin', corretor_id = NULL WHERE destino IS NULL;
