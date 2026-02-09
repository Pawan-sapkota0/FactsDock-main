
-- Drop duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- Single consolidated SELECT policy
-- Users can view:
--   1. Their own profile (id = auth.uid()), OR
--   2. Any profile if they're an admin
CREATE POLICY "SELECT profiles" ON profiles
  FOR SELECT
  USING (
    id = (SELECT auth.uid())  -- User viewing own profile
    OR
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )  -- Admin viewing any profile
  );

-- Optimized UPDATE policy
-- Users can update their own profile only
CREATE POLICY "UPDATE profiles" ON profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Optimized INSERT policy
-- Users can insert their own profile only (used during signup via trigger)
CREATE POLICY "INSERT profiles" ON profiles
  FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================================
-- 