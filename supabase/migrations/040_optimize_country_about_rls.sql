
-- ============================================================================

-- Drop outdated policies
DROP POLICY IF EXISTS "Active admins insert country_about" ON country_about;
DROP POLICY IF EXISTS "Active admins update country_about" ON country_about;
DROP POLICY IF EXISTS "Active admins delete country_about" ON country_about;

-- Keep SELECT policy as-is (public read is fine)
-- CREATE POLICY IF NOT EXISTS "Public select country_about" ON country_about
--   FOR SELECT
--   USING (true);

-- ============================================================================
-- Recreate optimized write policies
-- ============================================================================

-- INSERT: Active admins only (optimized)
--    Uses optimized (SELECT auth.uid()) pattern
--    Uses EXISTS with auth_user_id + is_active check
CREATE POLICY "Active admins insert country_about" ON country_about
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- UPDATE: Active admins only (optimized)
--    Uses optimized (SELECT auth.uid()) pattern
--    Uses EXISTS with auth_user_id + is_active check
CREATE POLICY "Active admins update country_about" ON country_about
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

-- DELETE: Active admins only (optimized)
--    Uses optimized (SELECT auth.uid()) pattern
--    Uses EXISTS with auth_user_id + is_active check
CREATE POLICY "Active admins delete country_about" ON country_about
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 