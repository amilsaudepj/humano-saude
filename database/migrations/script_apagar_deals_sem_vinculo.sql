-- =============================================================================
-- SCRIPT: Apagar deals do CRM sem vínculo (sem dono)
-- Remove os deals que aparecem no admin com owner_corretor_id NULL.
-- Executar no Supabase SQL Editor.
-- =============================================================================

-- Deals sem dono (owner_corretor_id IS NULL) são os "sem vínculo" que aparecem
-- no Kanban do admin. Tabelas ligadas (crm_activities, crm_quotes, etc.) usam
-- ON DELETE CASCADE, então serão removidas automaticamente.

DELETE FROM public.crm_deals
WHERE owner_corretor_id IS NULL;
