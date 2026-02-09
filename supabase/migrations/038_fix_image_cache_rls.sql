
-- Drop all existing policies (including duplicates and old variants)
DROP POLICY IF EXISTS "Allow authenticated insert to image_cache" ON image_cache;
DROP POLICY IF EXISTS "Allow authenticated update to image_cache" ON image_cache;
DROP POLICY IF EXISTS "Allow service role to manage image_cache" ON image_cache;
DROP POLICY IF EXISTS "Allow service role to update image_cache" ON image_cache;
DROP POLICY IF EXISTS "Allow service role to insert image_cache" ON image_cache;
DROP POLICY IF EXISTS "Allow admins to update image_cache" ON image_cache;
DROP POLICY IF EXISTS "Allow admins to delete image_cache" ON image_cache;
DROP POLICY IF EXISTS "Allow public read access to image_cache" ON image_cache;
DROP POLICY IF EXISTS "Anyone can read image_cache" ON image_cache;

-- ============================================================================
-- Recreate 4 clean consolidated policies
-- ============================================================================

-- 1. SELECT: Public read (single consolidated policy, no duplicates)
--    Anyone can read cached image metadata
CREATE POLICY "Anyone can read image_cache" ON image_cache
  FOR SELECT
  USING (true);

-- 2. INSERT: Admins only
--    Service role from Edge Functions/cron bypasses RLS via service_role key
--    Admins can also insert for manual testing/management
CREATE POLICY "Admins can insert image_cache" ON image_cache
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 3. UPDATE: Admins only (consolidated)
--    Service role (Edge Functions with service_role key) bypasses RLS automatically
--    Admins can also update for manual refreshes
--    Uses optimized (SELECT auth.uid()) pattern for admin check
CREATE POLICY "Admins can update image_cache" ON image_cache
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 4. DELETE: Admins only (consolidated)
--    Service role via cron jobs bypasses RLS with service_role key
--    For cleanup/maintenance via admin dashboard
CREATE POLICY "Admins can delete image_cache" ON image_cache
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- ============================================================================
--