
-- ============================================================================

-- Drop existing inefficient policies
DROP POLICY IF EXISTS "country_page_views_update_policy" ON country_page_views;
DROP POLICY IF EXISTS "country_page_views_delete_policy" ON country_page_views;

-- ============================================================================
-- Recreate optimized policies
-- ============================================================================

-- 1. UPDATE: Only admins can update page analytics
--    Optimized with (SELECT auth.uid())
CREATE POLICY "country_page_views_update_policy" ON country_page_views
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

-- 2. DELETE: Only admins can delete page views
--    Optimized with (SELECT auth.uid())
CREATE POLICY "country_page_views_delete_policy" ON country_page_views
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