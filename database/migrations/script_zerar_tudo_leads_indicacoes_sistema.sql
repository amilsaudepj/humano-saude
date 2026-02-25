-- =============================================================================
-- SCRIPT: Zerar leads, indicações e CRM de TODOS os usuários (sistema inteiro)
-- Admin + todos os corretores. Executar no Supabase SQL Editor. FAZER BACKUP.
-- =============================================================================

-- Ordem: respeitar FKs. Primeiro tabelas que referenciam outras; por último
-- as tabelas centrais (insurance_leads, leads_indicacao, corretor_afiliados).

-- -----------------------------------------------------------------------------
-- 1. CRM: interações (timeline dos cards) — referenciam crm_cards
-- -----------------------------------------------------------------------------
DELETE FROM public.crm_interacoes;

-- -----------------------------------------------------------------------------
-- 2. CRM: cards do Kanban (o que o corretor vê por lead)
--    Ao apagar, crm_deals.crm_card_id vira NULL (ON DELETE SET NULL).
-- -----------------------------------------------------------------------------
DELETE FROM public.crm_cards;

-- -----------------------------------------------------------------------------
-- 3. Indicações (leads da calculadora / link corretor / formulário indicar)
-- -----------------------------------------------------------------------------
DELETE FROM public.leads_indicacao;

-- -----------------------------------------------------------------------------
-- 4. Leads do sistema (insurance_leads: admin + todos os corretores)
--    CASCADE limpa propostas_fila, interaction_logs, portal_client_accounts etc.
--    SET NULL em crm_contacts, crm_deals (lead_id vira NULL).
-- -----------------------------------------------------------------------------
DELETE FROM public.insurance_leads;

-- -----------------------------------------------------------------------------
-- 5. Afiliados (todos os cadastros em corretor_afiliados)
-- -----------------------------------------------------------------------------
DELETE FROM public.corretor_afiliados;

-- =============================================================================
-- RESUMO
-- =============================================================================
-- Após executar (todos os usuários, todo o sistema):
--   - crm_interacoes ....... 0 linhas (timeline dos cards)
--   - crm_cards ............ 0 linhas (Kanban de todos os corretores)
--   - leads_indicacao ...... 0 linhas
--   - insurance_leads ...... 0 linhas
--   - corretor_afiliados ... 0 linhas
--
-- crm_contacts e crm_deals permanecem; lead_id e crm_card_id ficam NULL onde
-- havia referência. Se quiser zerar deals/contacts também, descomente abaixo:
--
-- DELETE FROM public.crm_deals;
-- DELETE FROM public.crm_contacts;
-- =============================================================================
