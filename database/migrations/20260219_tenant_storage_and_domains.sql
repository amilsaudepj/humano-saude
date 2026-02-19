-- ============================================================
-- TENANT ADMIN: Storage bucket para logos + domínios iniciais
--
-- Execute APÓS as migrations 20260219_create_tenants e
-- 20260219_add_tenant_id já aplicadas.
-- ============================================================

-- 1. Criar bucket "tenant-logos" no Supabase Storage
-- (se já existir, o INSERT ON CONFLICT garante idempotência)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-logos',
  'tenant-logos',
  true,                                -- público: logos acessíveis sem auth
  2097152,                             -- 2 MB máx por arquivo
  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'];

-- 2. RLS do bucket: qualquer um lê, só service_role escreve
DROP POLICY IF EXISTS "tenant_logos_public_read" ON storage.objects;
CREATE POLICY "tenant_logos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tenant-logos');

DROP POLICY IF EXISTS "tenant_logos_service_write" ON storage.objects;
CREATE POLICY "tenant_logos_service_write"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'tenant-logos')
  WITH CHECK (bucket_id = 'tenant-logos');

-- 3. Inserir domínios iniciais dos parceiros
-- Mattos Connect
INSERT INTO tenant_domains (tenant_id, domain, is_primary, ssl_active)
VALUES (
  '00000000-0000-0000-0000-000000000003',  -- Mattos
  'mattosconnect.com.br',
  true,
  true
)
ON CONFLICT (domain) DO NOTHING;

INSERT INTO tenant_domains (tenant_id, domain, is_primary, ssl_active)
VALUES (
  '00000000-0000-0000-0000-000000000003',  -- Mattos
  'www.mattosconnect.com.br',
  false,
  true
)
ON CONFLICT (domain) DO NOTHING;

-- Arcfy Saúde
INSERT INTO tenant_domains (tenant_id, domain, is_primary, ssl_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',  -- Arcfy
  'arcfysaude.com.br',
  true,
  true
)
ON CONFLICT (domain) DO NOTHING;

INSERT INTO tenant_domains (tenant_id, domain, is_primary, ssl_active)
VALUES (
  '00000000-0000-0000-0000-000000000002',  -- Arcfy
  'www.arcfysaude.com.br',
  false,
  true
)
ON CONFLICT (domain) DO NOTHING;

-- 4. Atualizar domain principal nos tenants (fallback para match direto)
UPDATE tenants SET domain = 'mattosconnect.com.br'
  WHERE id = '00000000-0000-0000-0000-000000000003' AND (domain IS NULL OR domain = '');

UPDATE tenants SET domain = 'arcfysaude.com.br'
  WHERE id = '00000000-0000-0000-0000-000000000002' AND (domain IS NULL OR domain = 'arcfy.com.br');
