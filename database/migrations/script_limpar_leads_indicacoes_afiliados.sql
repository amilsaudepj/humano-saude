-- =============================================================================
-- SCRIPT: Limpar TODOS os leads, indicações e afiliados do sistema
-- Executar no Supabase SQL Editor. FAZER BACKUP antes.
-- =============================================================================

-- Ordem: respeitar FKs. Tabelas que referenciam leads/afiliados usam
-- ON DELETE SET NULL ou CASCADE; mesmo assim limpamos na ordem segura.

-- -----------------------------------------------------------------------------
-- 1. Indicações (leads da calculadora / link corretor / formulário indicar)
--    Referencia corretor_afiliados(afiliado_id) com ON DELETE SET NULL.
-- -----------------------------------------------------------------------------
DELETE FROM public.leads_indicacao;

-- -----------------------------------------------------------------------------
-- 2. Leads do painel (insurance_leads: admin + corretores, todas as origens)
--    crm_cards, crm_contacts, crm_deals etc. referenciam com ON DELETE SET NULL.
-- -----------------------------------------------------------------------------
DELETE FROM public.insurance_leads;

-- -----------------------------------------------------------------------------
-- 3. Afiliados (corretor_afiliados: todos os cadastros de afiliados)
--    Nada depende dele com RESTRICT; leads_indicacao já foi esvaziado.
-- -----------------------------------------------------------------------------
DELETE FROM public.corretor_afiliados;

-- =============================================================================
-- RESUMO
-- =============================================================================
-- Após executar:
--   - leads_indicacao .......... 0 linhas
--   - insurance_leads ........... 0 linhas
--   - corretor_afiliados ........ 0 linhas
--
-- Referências em crm_cards, crm_contacts, crm_deals a insurance_leads(id)
-- ficarão com lead_id = NULL automaticamente (ON DELETE SET NULL).
-- =============================================================================
