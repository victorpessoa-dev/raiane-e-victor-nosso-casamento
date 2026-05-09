/*
  # Wedding Media Uploads

  1. New Tables
    - `media_uploads`
      - `id` (uuid, primary key)
      - `file_name` (text) - original filename
      - `storage_path` (text) - path in storage bucket
      - `file_type` (text) - 'image' or 'video'
      - `mime_type` (text) - full MIME type
      - `file_size` (bigint) - size in bytes
      - `uploader_name` (text) - optional guest name
      - `message` (text) - optional message from guest
      - `created_at` (timestamptz)

  2. Storage
    - Bucket `wedding-media` (public read, authenticated upload)

  3. Security
    - Enable RLS on `media_uploads`
    - Anyone can insert (public upload)
    - Only service role can delete (admin only via server)
    - Anyone can read (public gallery view not exposed, admin reads all)
*/

CREATE TABLE IF NOT EXISTS media_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL DEFAULT '',
  storage_path text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'image',
  mime_type text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  uploader_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert media uploads"
  ON media_uploads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can select media uploads"
  ON media_uploads FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can delete media uploads"
  ON media_uploads FOR DELETE
  TO service_role
  USING (true);
