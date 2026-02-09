
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow admins to read contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow admins to delete contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow service role to insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow public insert contact messages" ON contact_messages;

-- ============================================================================
-- Recreate optimized policies
-- ============================================================================

-- 1. SELECT: Only admins can read contact messages
--    Optimized with (SELECT auth.uid())
CREATE POLICY "Admins can read contact messages" ON contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 2. INSERT: Only service role can insert contact messages (via cron/Edge Functions)
--    Optimized with (SELECT auth.role()) to evaluate once per query
CREATE POLICY "Service role can insert contact messages" ON contact_messages
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- 3. DELETE: Only admins can delete contact messages
--    Optimized with (SELECT auth.uid())
CREATE POLICY "Admins can delete contact messages" ON contact_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- ============================================================================
-- VERIFICATION
-- 