-- Adiciona corretor_id à view pipeline_completo para o admin exibir "de qual usuário" é cada lead no funil
-- Executar no Supabase SQL Editor se a view já existir.

CREATE OR REPLACE VIEW public.pipeline_completo AS
SELECT
  l.id AS lead_id,
  l.nome,
  l.whatsapp,
  l.email,
  l.status AS lead_status,
  l.corretor_id,
  l.operadora_atual,
  l.valor_atual,
  l.economia_estimada,
  COUNT(DISTINCT c.id) AS total_cotacoes,
  COUNT(DISTINCT p.id) AS total_propostas,
  MAX(c.created_at) AS ultima_cotacao,
  MAX(p.created_at) AS ultima_proposta,
  l.created_at AS lead_criado_em
FROM insurance_leads l
LEFT JOIN cotacoes c ON c.lead_id = l.id
LEFT JOIN propostas p ON p.lead_id = l.id
WHERE l.arquivado = FALSE
GROUP BY
  l.id,
  l.nome,
  l.whatsapp,
  l.email,
  l.status,
  l.corretor_id,
  l.operadora_atual,
  l.valor_atual,
  l.economia_estimada,
  l.created_at
ORDER BY l.created_at DESC;
