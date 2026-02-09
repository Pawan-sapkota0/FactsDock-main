
-- ============================================================================

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Admin read settings" ON settings;
DROP POLICY IF EXISTS "Admin update settings" ON settings;

-- ============================================================================
-- Recreate optimized policies
-- ============================================================================

-- 1. SELECT: Admins can read all settings
--    Optimized with (SELECT auth.uid())
CREATE POLICY "Admin read settings" ON settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 2. UPDATE: Admins can update settings
--    Optimized with (SELECT auth.uid())
CREATE POLICY "Admin update settings" ON settings
  FOR UPDATE
  TO authenticated
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

-- 