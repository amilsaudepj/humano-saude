-- =====================================================
-- Blueprint 15 (Fase Final): Storage para Launch Multipart
-- Data: 2026-02-17
-- Objetivo: garantir bucket creatives para upload de múltiplas imagens
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creatives',
  'creatives',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'creatives_public_read'
  ) THEN
    CREATE POLICY creatives_public_read ON storage.objects
      FOR SELECT
      USING (bucket_id = 'creatives');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'creatives_insert'
  ) THEN
    CREATE POLICY creatives_insert ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'creatives');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'creatives_update'
  ) THEN
    CREATE POLICY creatives_update ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'creatives')
      WITH CHECK (bucket_id = 'creatives');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'creatives_delete'
  ) THEN
    CREATE POLICY creatives_delete ON storage.objects
      FOR DELETE
      USING (bucket_id = 'creatives');
  END IF;
END
$$;
