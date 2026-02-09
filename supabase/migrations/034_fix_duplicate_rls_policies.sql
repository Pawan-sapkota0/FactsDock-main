
-- Drop any duplicate or conflicting policies on facts
DROP POLICY IF EXISTS "Admins can manage facts" ON facts;
DROP POLICY IF EXISTS "Active admins delete facts" ON facts;
DROP POLICY IF EXISTS "Only admins can delete facts" ON facts;

-- Recreate with clean, single policy
CREATE POLICY "Only admins can delete facts" ON facts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- ============================================================================
-- QUIZZES TABLE - Clean up and consolidate DELETE policies  
-- ============================================================================

-- Drop ALL conflicting policies (permissive and any duplicates)
DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Active admins delete quizzes" ON quizzes;
DROP POLICY IF EXISTS "Only admins can delete quizzes" ON quizzes;
DROP POLICY IF EXISTS "auth_manage_quizzes" ON quizzes;

-- Recreate with clean, single policy
CREATE POLICY "Only admins can delete quizzes" ON quizzes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- ============================================================================
-- CATEGORIES TABLE - Clean up and consolidate DELETE policies
-- ============================================================================

-- Drop any duplicate or conflicting policies on categories
DROP POLICY IF EXISTS "Admins manage categories" ON categories;
DROP POLICY IF EXISTS "Active admins delete categories" ON categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;

-- Recreate with clean, single policy
CREATE POLICY "Only admins can delete categories" ON categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 