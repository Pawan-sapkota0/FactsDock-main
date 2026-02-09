
-- ============================================================================
-- ADMINS TABLE - Fix duplicate policies and optimize
-- ============================================================================

-- Drop all duplicate and conflicting policies
DROP POLICY IF EXISTS "Users view own admin record" ON admins;
DROP POLICY IF EXISTS "Users can update own admin record" ON admins;
DROP POLICY IF EXISTS "Admins can read their own admin record" ON admins;
DROP POLICY IF EXISTS "Admins can update their own admin record" ON admins;
DROP POLICY IF EXISTS "Superadmins view all admins" ON admins;
DROP POLICY IF EXISTS "Superadmins manage admins" ON admins;
DROP POLICY IF EXISTS "Admins can view admin table" ON admins;
DROP POLICY IF EXISTS "Admins can view records" ON admins;
DROP POLICY IF EXISTS "Admins can update records" ON admins;
DROP POLICY IF EXISTS "Superadmins can insert admins" ON admins;
DROP POLICY IF EXISTS "Superadmins can delete admins" ON admins;

-- ============================================================================
-- Recreate clean consolidated policies
-- ============================================================================

-- 1. SELECT: Users can view their own record OR superadmins can view all
--    Consolidated: "Users view own admin record" + "Superadmins view all admins"
--    Optimized with (SELECT auth.uid())
CREATE POLICY "Admins can view records" ON admins
  FOR SELECT
  USING (
    (SELECT auth.uid()) = auth_user_id
    OR EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.role = 'superadmin'
      AND admins.is_active = true
    )
  );

-- 2. UPDATE: Users can update their own record OR superadmins can update all
--    Consolidated: "Users can update own admin record" + "Superadmins manage admins" UPDATE
--    Optimized with (SELECT auth.uid())
CREATE POLICY "Admins can update records" ON admins
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = auth_user_id
    OR EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.role = 'superadmin'
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = auth_user_id
    OR EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.role = 'superadmin'
      AND admins.is_active = true
    )
  );

-- 3. INSERT: Only superadmins
--    Optimized with (SELECT auth.uid())
CREATE POLICY "Superadmins can insert admins" ON admins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.role = 'superadmin'
      AND admins.is_active = true
    )
  );

-- 4. DELETE: Only superadmins
--    Optimized with (SELECT auth.uid())
CREATE POLICY "Superadmins can delete admins" ON admins
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.role = 'superadmin'
      AND admins.is_active = true
    )
  );

-- 