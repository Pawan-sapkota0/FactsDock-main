-- Migration: Create story-covers storage bucket

-- Create the storage bucket for story cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-covers', 'story-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to the bucket
CREATE POLICY "Public Read story-covers" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'story-covers');

-- Allow authenticated users to upload to story-covers
CREATE POLICY "Authenticated Upload story-covers" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'story-covers' AND
    EXISTS(SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Allow authenticated admins to delete from story-covers
CREATE POLICY "Authenticated Delete story-covers" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'story-covers' AND
    EXISTS(SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Allow authenticated admins to update in story-covers
CREATE POLICY "Authenticated Update story-covers" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'story-covers' AND
    EXISTS(SELECT 1 FROM admins WHERE id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'story-covers' AND
    EXISTS(SELECT 1 FROM admins WHERE id = auth.uid())
  );
