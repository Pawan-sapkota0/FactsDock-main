-- Migration: Add RLS policies to country_page_views table
-- The table exists but had RLS enabled without policies, blocking all access
-- Note: Service role bypasses RLS entirely, so these policies protect against regular user access

-- Drop existing policies to replace with secure versions
DROP POLICY IF EXISTS "Service role can insert page views" ON country_page_views;
DROP POLICY IF EXISTS "Service role can read page views" ON country_page_views;
DROP POLICY IF EXISTS "Admins can view page analytics" ON country_page_views;
DROP POLICY IF EXISTS "Insert page views" ON country_page_views;
DROP POLICY IF EXISTS "Public read page views" ON country_page_views;
DROP POLICY IF EXISTS "Admins manage page analytics" ON country_page_views;
DROP POLICY IF EXISTS "Admins delete page views" ON country_page_views;

-- Policy: Insert requires non-null country (validates data)
CREATE POLICY "country_page_views_insert_policy" ON country_page_views
  FOR INSERT
  WITH CHECK (country IS NOT NULL);

-- Policy: Allow public read access to page view analytics
CREATE POLICY "country_page_views_select_policy" ON country_page_views
  FOR SELECT
  USING (true);

-- Policy: Allow admins to update page analytics
CREATE POLICY "country_page_views_update_policy" ON country_page_views
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Policy: Allow admins to delete page views
CREATE POLICY "country_page_views_delete_policy" ON country_page_views
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );
