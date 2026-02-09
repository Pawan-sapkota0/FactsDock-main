
-- Drop duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view own auth logs" ON auth_logs;
DROP POLICY IF EXISTS "Admins can view all auth logs" ON auth_logs;

-- ============================================================================
-- Recreate consolidated SELECT policy
-- ============================================================================

-- Single consolidated SELECT policy
-- Users can view:
--   1. Their own logs (user_id = auth.uid()), OR
--   2. All logs if they're an admin
CREATE POLICY "SELECT auth_logs" ON auth_logs
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())  -- User viewing own logs
    OR
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )  -- Admin viewing all logs
  );

-- 