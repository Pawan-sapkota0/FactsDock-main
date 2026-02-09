
-- Drop existing inefficient policies
DROP POLICY IF EXISTS "Admin only - audit read" ON ai_generation_audit;
DROP POLICY IF EXISTS "Service role - audit write" ON ai_generation_audit;

-- ============================================================================
-- Recreate optimized policies
-- ============================================================================

-- 1. SELECT: Admins can read OR service role can read
--    Consolidated: "Admin only - audit read" + SELECT from "Service role - audit write"
--    Optimized with (SELECT auth.uid()) and (SELECT auth.role())
CREATE POLICY "Audit read" ON ai_generation_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
    OR (SELECT auth.role()) = 'service_role'
  );

-- 2. INSERT: Only service role can insert audit logs
--    Optimized with (SELECT auth.role())
CREATE POLICY "Audit insert" ON ai_generation_audit
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- 3. UPDATE: Only service role can update audit logs
--    Optimized with (SELECT auth.role())
CREATE POLICY "Audit update" ON ai_generation_audit
  FOR UPDATE
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- 4. DELETE: Only service role can delete audit logs
--    Optimized with (SELECT auth.role())
CREATE POLICY "Audit delete" ON ai_generation_audit
  FOR DELETE
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================================================
--