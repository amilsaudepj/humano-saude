-- =====================================================
-- CRIAR TABELA INTEGRATION_SETTINGS
-- =====================================================
-- Esta tabela armazena configurações de integrações
-- e perfis administrativos (incluindo foto do admin)
-- =====================================================

-- 1. Criar tabela integration_settings (DROP se necessário para garantir estrutura correta)
DROP TABLE IF EXISTS integration_settings CASCADE;

CREATE TABLE integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT NOT NULL UNIQUE,
    encrypted_credentials JSONB DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Comentários
COMMENT ON TABLE integration_settings IS 'Configurações de integrações e perfis administrativos';
COMMENT ON COLUMN integration_settings.integration_name IS 'Nome único da integração (ex: admin_profile, google_ads, meta_ads)';
COMMENT ON COLUMN integration_settings.encrypted_credentials IS 'Credenciais criptografadas (tokens, chaves API)';
COMMENT ON COLUMN integration_settings.config IS 'Configurações gerais (foto_url, preferências, etc)';
COMMENT ON COLUMN integration_settings.is_active IS 'Se a integração está ativa';

-- 3. Índices
CREATE INDEX idx_integration_settings_name ON integration_settings(integration_name);
CREATE INDEX idx_integration_settings_active ON integration_settings(is_active);

-- 4. Políticas RLS
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Permitir leitura autenticada
CREATE POLICY "Leitura autenticada de configurações"
ON integration_settings FOR SELECT
TO authenticated
USING (true);

-- Permitir escrita apenas via service_role (backend)
CREATE POLICY "Escrita via service_role"
ON integration_settings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Inserir registro inicial para admin_profile
INSERT INTO integration_settings (integration_name, config, is_active)
VALUES ('admin_profile', '{}'::jsonb, true);

-- =====================================================
-- OBSERVAÇÕES
-- =====================================================
-- • Tabela usada para armazenar foto do admin e outras configurações
-- • RLS permite leitura para usuários autenticados
-- • Escrita apenas via service_role (backend)
-- =====================================================
