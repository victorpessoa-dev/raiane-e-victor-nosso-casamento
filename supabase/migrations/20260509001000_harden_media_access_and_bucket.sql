/*
  # Harden media access and create storage bucket

  1. Bucket
    - Ensure `wedding-media` exists
    - Force bucket to private

  2. Table improvements
    - Ensure visibility column exists and defaults to false
    - Add defensive constraints and indexes

  3. Policies
    - Remove previous public policies from table and storage
    - Keep access restricted to service_role only
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-media', 'wedding-media', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

ALTER TABLE media_uploads
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN is_visible SET DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'media_uploads_file_type_check'
  ) THEN
    ALTER TABLE media_uploads
      ADD CONSTRAINT media_uploads_file_type_check
      CHECK (file_type IN ('image', 'video'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'media_uploads_file_size_nonnegative_check'
  ) THEN
    ALTER TABLE media_uploads
      ADD CONSTRAINT media_uploads_file_size_nonnegative_check
      CHECK (file_size >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS media_uploads_created_at_idx
  ON media_uploads (created_at DESC);

CREATE INDEX IF NOT EXISTS media_uploads_visible_created_at_idx
  ON media_uploads (is_visible, created_at DESC);

DROP POLICY IF EXISTS "Anyone can insert media uploads" ON media_uploads;
DROP POLICY IF EXISTS "Anyone can select media uploads" ON media_uploads;
DROP POLICY IF EXISTS "Service role can delete media uploads" ON media_uploads;

CREATE POLICY "Service role manages media uploads"
  ON media_uploads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can upload wedding media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read wedding media" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete wedding media" ON storage.objects;

CREATE POLICY "Service role manages wedding media objects"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'wedding-media')
  WITH CHECK (bucket_id = 'wedding-media');
