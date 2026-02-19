-- ============================================================
-- FIX: Erro "policy 'service_role_full_access_perm_audit' already exists"
-- Execute APENAS este trecho no Supabase SQL Editor
-- ============================================================

-- 1. Dropar a policy existente que está causando conflito
DROP POLICY IF EXISTS "service_role_full_access_perm_audit" ON permission_audit_log;

-- 2. Recriar a policy
CREATE POLICY "service_role_full_access_perm_audit"
  ON permission_audit_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 3. Agora, execute o restante do 20260219_rbac_grades_unified.sql
--    a partir da linha APÓS o CREATE POLICY (ou re-execute o arquivo inteiro, 
--    pois agora já tem o DROP POLICY IF EXISTS antes do CREATE).
