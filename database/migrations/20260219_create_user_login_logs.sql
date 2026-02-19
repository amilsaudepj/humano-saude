-- =====================================================
-- CRIAR TABELA DE LOGS DE LOGIN
-- =====================================================
-- Esta tabela rastreia os logins dos usuários
-- =====================================================

-- 1. Criar tabela user_login_logs
CREATE TABLE IF NOT EXISTS user_login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    user_id TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    login_type TEXT, -- 'admin', 'corretor', 'user'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Comentários
COMMENT ON TABLE user_login_logs IS 'Registro de logins dos usuários';
COMMENT ON COLUMN user_login_logs.user_email IS 'Email do usuário que fez login';
COMMENT ON COLUMN user_login_logs.user_id IS 'ID do usuário (opcional)';
COMMENT ON COLUMN user_login_logs.login_at IS 'Data/hora do login';
COMMENT ON COLUMN user_login_logs.ip_address IS 'Endereço IP da requisição';
COMMENT ON COLUMN user_login_logs.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN user_login_logs.login_type IS 'Tipo de login (admin, corretor, user)';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON user_login_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON user_login_logs(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_type ON user_login_logs(login_type);

-- 4. Políticas RLS
ALTER TABLE user_login_logs ENABLE ROW LEVEL SECURITY;

-- Permitir leitura apenas para admins (via service_role)
CREATE POLICY "Leitura de logs apenas via service_role"
ON user_login_logs FOR SELECT
TO service_role
USING (true);

-- Permitir inserção autenticada (para registrar logins)
CREATE POLICY "Inserção de logs autenticada"
ON user_login_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir inserção via service_role
CREATE POLICY "Inserção via service_role"
ON user_login_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- OBSERVAÇÕES
-- =====================================================
-- • Tabela usada para rastrear logins de todos os usuários
-- • Armazena IP, user agent e tipo de login
-- • Apenas admins podem ler os logs
-- =====================================================
