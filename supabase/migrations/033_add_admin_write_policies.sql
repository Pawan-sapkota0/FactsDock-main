-- Migration: Add non-recursive write policies for admin operations
-- Problem: Need to protect facts/quizzes/categories from unauthorized writes
-- Solution: Use EXISTS checks (not recursive subqueries) to verify admin status

-- CRITICAL: These policies use EXISTS which does NOT cause recursion
-- because EXISTS checks a different table (admins), not the table being evaluated

-- ============================================================================
-- FACTS TABLE - Write policies
-- ============================================================================

-- Only admins can insert facts
CREATE POLICY "Only admins can insert facts" ON facts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Only admins can update facts
CREATE POLICY "Only admins can update facts" ON facts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Only admins can delete facts
CREATE POLICY "Only admins can delete facts" ON facts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- ============================================================================
-- QUIZZES TABLE - Write policies
-- ============================================================================

-- Only admins can insert quizzes
CREATE POLICY "Only admins can insert quizzes" ON quizzes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Only admins can update quizzes
CREATE POLICY "Only admins can update quizzes" ON quizzes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Only admins can delete quizzes
CREATE POLICY "Only admins can delete quizzes" ON quizzes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- ============================================================================
-- CATEGORIES TABLE - Write policies
-- ============================================================================

-- Only admins can insert categories
CREATE POLICY "Only admins can insert categories" ON categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Only admins can update categories
CREATE POLICY "Only admins can update categories" ON categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Only admins can delete categories
CREATE POLICY "Only admins can delete categories" ON categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- ============================================================================
-- ADMIN_ACTIVITY_LOGS TABLE - Write policies
-- ============================================================================

-- Only admins can insert activity logs
CREATE POLICY "Only admins can insert activity logs" ON admin_activity_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Only superadmins can view activity logs
CREATE POLICY "Only superadmins can view activity logs" ON admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = auth.uid()
      AND admins.role = 'superadmin'
      AND admins.is_active = true
    )
  );

-- ============================================================================
-- KEY DESIGN PRINCIPLES
-- ============================================================================
-- 
-- WHY NO RECURSION:
-- - These use EXISTS which checks the ADMINS table
-- - The policies are on FACTS/QUIZZES/CATEGORIES tables
-- - Different tables = no recursion
-- - Compare with old approach: checking the table being evaluated = recursion
--
-- SECURITY BENEFITS:
-- - Database enforces: only auth.uid() IN admins table
-- - Regular users cannot bypass the app to write data
-- - is_active = true ensures inactive admins are blocked
-- - Superadmin role restrictions work at database level
--
-- PERFORMANCE:
-- - EXISTS query with indexed auth_user_id column = fast
-- - No complex subqueries or multiple table scans
-- - Simple, direct check for each operation
