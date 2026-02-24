-- =============================================================================
-- SCRIPT: Apagar "Quero ser afiliado" e/ou TODOS os leads do sistema
-- Admin + todos os corretores/usuários.
-- Executar no Supabase SQL Editor. Fazer backup antes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- OPÇÃO 1: Só apagar leads "Quero ser afiliado" (origem landing_seja_afiliado)
-- -----------------------------------------------------------------------------
-- Os registros em insurance_leads com origem = 'landing_seja_afiliado' são
-- removidos. Tabelas que referenciam insurance_leads(id) com ON DELETE CASCADE
-- (ex.: interaction_logs, portal_client_accounts, propostas_fila) terão as
-- linhas apagadas automaticamente. Com ON DELETE SET NULL (ex.: crm_cards),
-- o lead_id fica NULL.

-- DELETE FROM public.insurance_leads
-- WHERE origem = 'landing_seja_afiliado';


-- -----------------------------------------------------------------------------
-- OPÇÃO 2: Apagar TODOS os leads do sistema (admin + todos os corretores)
-- -----------------------------------------------------------------------------
-- Ordem: primeiro tabelas que referenciam insurance_leads, se alguma tiver
-- ON DELETE RESTRICT; depois insurance_leads. No seu schema a maioria usa
-- ON DELETE SET NULL ou ON DELETE CASCADE, então um único DELETE em
-- insurance_leads costuma ser suficiente. Se der erro de FK, descomente
-- os blocos abaixo na ordem.

-- 2.1) Opcional: limpar referências que possam ser RESTRICT (ajuste conforme seu schema)
-- UPDATE public.crm_cards SET lead_id = NULL WHERE lead_id IS NOT NULL;
-- UPDATE public.crm_contacts SET lead_id = NULL WHERE lead_id IS NOT NULL;
-- UPDATE public.crm_deals SET lead_id = NULL WHERE lead_id IS NOT NULL;
-- UPDATE public.audience_users SET lead_id = NULL WHERE lead_id IS NOT NULL;

-- 2.2) Apagar todos os leads em insurance_leads (admin + corretores)
--      CASCADE/SET NULL nas FKs cuidam do resto.
DELETE FROM public.insurance_leads;


-- -----------------------------------------------------------------------------
-- OPÇÃO 3: Apagar TODOS os leads de INDICAÇÃO (leads_indicacao)
-- -----------------------------------------------------------------------------
-- São os leads da calculadora / link do corretor e indicações de afiliados.
-- Tabela independente de insurance_leads.

DELETE FROM public.leads_indicacao;


-- -----------------------------------------------------------------------------
-- (Opcional) Apagar afiliados "sem vínculo" em corretor_afiliados
-- -----------------------------------------------------------------------------
-- Só use se quiser remover também os cadastros de "quero ser afiliado" da
-- tabela de afiliados (não só os leads). Ajuste o corretor_id pelo ID real
-- do corretor "Helcio Duarte Mattos" (sem vínculo) no seu ambiente.

-- DELETE FROM public.corretor_afiliados
-- WHERE corretor_id = (SELECT id FROM public.corretores WHERE email = 'helciodmtt@gmail.com' LIMIT 1);


-- =============================================================================
-- RESUMO
-- =============================================================================
-- 1) Só "quero ser afiliado": descomente OPÇÃO 1 e execute.
-- 2) Todos os leads (admin + corretores): descomente OPÇÃO 2 (2.2) e execute.
-- 3) Todos os leads de indicação: OPÇÃO 3 já está ativa (DELETE em leads_indicacao).
-- 4) Se quiser limpar também afiliados sem vínculo: descomente o bloco opcional.
--
-- Neste arquivo estão ativos por padrão:
--   - DELETE FROM public.insurance_leads;   (todos os leads)
--   - DELETE FROM public.leads_indicacao;   (todas as indicações)
-- Para só "quero ser afiliado", comente os DELETEs acima e use só a OPÇÃO 1.
-- =============================================================================
