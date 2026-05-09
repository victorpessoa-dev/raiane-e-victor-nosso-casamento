/*
  # Storage Policies for wedding-media bucket

  Allow public uploads and public reads.
  Only service_role can delete objects.
*/

CREATE POLICY "Public can upload wedding media"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'wedding-media');

CREATE POLICY "Public can read wedding media"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'wedding-media');

CREATE POLICY "Service role can delete wedding media"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'wedding-media');
