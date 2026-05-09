/*
  # Add visibility field to media_uploads

  1. Changes
    - Add `is_visible` boolean column (default: false)
      - Admin must explicitly show photos on carousel
      - Public users only see visible photos
      - Helps curate the wedding gallery
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_uploads' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE media_uploads ADD COLUMN is_visible boolean DEFAULT false;
  END IF;
END $$;
