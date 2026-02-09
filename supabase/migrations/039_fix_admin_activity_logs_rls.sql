
-- Drop all existing policies (including duplicates)
DROP POLICY IF EXISTS "Only admins can insert activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Only superadmins can view activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "auth_insert_activity_logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admins can log their activities" ON admin_activity_logs;
DROP POLICY IF EXISTS "Superadmins view audit logs" ON admin_activity_logs;

-- ============================================================================
-- Recreate clean consolidated policies
-- ============================================================================

-- 1. INSERT: Admins can log their activities (single consolidated policy)
--    Uses optimized (SELECT auth.uid()) pattern
CREATE POLICY "Only admins can insert activity logs" ON admin_activity_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 2. SELECT: Only superadmins can view activity logs (optimized)
--    Uses optimized (SELECT auth.uid()) pattern
CREATE POLICY "Only superadmins can view activity logs" ON admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.role = 'superadmin'
      AND admins.is_active = true
    )
  );

-- 