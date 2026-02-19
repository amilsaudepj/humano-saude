-- =====================================================
-- CORRIGIR POLÍTICAS DA TABELA user_login_logs
-- =====================================================
-- Permite inserção sem autenticação (anon key)
-- =====================================================

-- Remove políticas antigas
DROP POLICY IF EXISTS "Inserção de logs autenticada" ON user_login_logs;
DROP POLICY IF EXISTS "Inserção via service_role" ON user_login_logs;

-- Permite inserção para qualquer um (anon + authenticated + service_role)
CREATE POLICY "Permitir inserção de logs"
ON user_login_logs FOR INSERT
WITH CHECK (true);

-- Mantém leitura apenas via service_role
-- (a política "Leitura de logs apenas via service_role" já existe)

-- =====================================================
-- OBSERVAÇÕES
-- =====================================================
-- • Agora qualquer client pode inserir logs de login
-- • Apenas admins (service_role) podem LER os logs
-- • Isso permite que o registro funcione sem SERVICE_ROLE_KEY
-- =====================================================
