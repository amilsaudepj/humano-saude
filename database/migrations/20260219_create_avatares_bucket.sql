-- =====================================================
-- CRIAR BUCKET DE STORAGE PARA AVATARES
-- =====================================================
-- Este script cria o bucket 'avatares' no Supabase Storage
-- para armazenar fotos de perfil de usuários e admins
-- =====================================================

-- 1. Criar o bucket 'avatares' (caso não exista)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatares', 'avatares', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política RLS: Permitir leitura pública
CREATE POLICY "Leitura pública de avatares"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatares');

-- 3. Política RLS: Permitir upload autenticado
CREATE POLICY "Upload de avatares para usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatares');

-- 4. Política RLS: Permitir atualização para próprio usuário
CREATE POLICY "Atualizar próprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatares' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Política RLS: Permitir exclusão para próprio usuário
CREATE POLICY "Excluir próprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatares' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- OBSERVAÇÕES
-- =====================================================
-- • Bucket público: Qualquer pessoa pode VER as imagens
-- • Apenas autenticados podem FAZER UPLOAD
-- • Apenas o dono pode ATUALIZAR/EXCLUIR sua própria foto
-- • Pasta admin/ para fotos de administradores
-- =====================================================
