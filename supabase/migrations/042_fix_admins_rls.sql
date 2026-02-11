
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

-- 1. SELECT: Users can view their own record
--    Simple: auth_user_id = current user
CREATE POLICY "Admins can view records" ON admins
  FOR SELECT
  USING (
    (SELECT auth.uid()) = auth_user_id
  );

-- 2. UPDATE: Users can update their own record
--    Simple: auth_user_id = current user
CREATE POLICY "Admins can update records" ON admins
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = auth_user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = auth_user_id
  );

-- 3. INSERT: Disabled (handled via Edge Function with service role)
-- Edge functions use SUPABASE_SERVICE_KEY which bypasses RLS
-- Regular authenticated users cannot insert

-- 4. DELETE: Disabled (handled via Edge Function with service role)
-- Edge functions use SUPABASE_SERVICE_KEY which bypasses RLS
-- Regular authenticated users cannot delete

-- 