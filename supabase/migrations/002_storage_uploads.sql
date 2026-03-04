-- Storage: allow authenticated users to upload and read from the "uploads" bucket.
-- Create the bucket via Supabase Dashboard (Storage → New bucket → id: uploads) if it does not exist.
-- These policies assume the bucket "uploads" exists.

-- Allow authenticated users to upload (INSERT) to the uploads bucket
CREATE POLICY "Authenticated users can upload to uploads bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads');

-- Allow authenticated users to read (SELECT) from the uploads bucket (e.g. for signed URLs / display)
CREATE POLICY "Authenticated users can read from uploads bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads');

-- Allow authenticated users to update/delete their uploads (optional; for replace/cleanup)
CREATE POLICY "Authenticated users can update objects in uploads bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'uploads')
  WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can delete from uploads bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads');
