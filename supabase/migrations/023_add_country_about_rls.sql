-- Migration: Add RLS policies for country_about table

-- Enable RLS on country_about table
ALTER TABLE IF EXISTS country_about ENABLE ROW LEVEL SECURITY;

-- Policy: Public select - anyone can read country descriptions
CREATE POLICY IF NOT EXISTS "Public select country_about" ON country_about
  FOR SELECT
  USING (true);

-- Policy: Active admins can insert country descriptions
CREATE POLICY IF NOT EXISTS "Active admins insert country_about" ON country_about
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

-- Policy: Active admins can update country descriptions
CREATE POLICY IF NOT EXISTS "Active admins update country_about" ON country_about
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

-- Policy: Active admins can delete country descriptions
CREATE POLICY IF NOT EXISTS "Active admins delete country_about" ON country_about
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));
