-- Marca o corretor helciodmtt como e-mail confirmado (já confirmou fora do fluxo atual).

UPDATE public.corretores
SET email_confirmado_em = COALESCE(created_at, NOW())
WHERE (email ILIKE '%helciodmtt%' OR slug = 'helciodmtt')
  AND (email_confirmado_em IS NULL OR email_confirmado_em < created_at);
