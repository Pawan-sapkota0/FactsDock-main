
-- Drop ALL existing policies (no matter the name)
-- Including the problematic legacy "auth_manage_facts" (FOR ALL) that causes duplicate DELETE policies
DROP POLICY IF EXISTS "Public select facts" ON facts;
DROP POLICY IF EXISTS "public_read_facts" ON facts;
DROP POLICY IF EXISTS "Anyone can read facts" ON facts;
DROP POLICY IF EXISTS "Public can view approved facts" ON facts;
DROP POLICY IF EXISTS "Admins can manage facts" ON facts;
DROP POLICY IF EXISTS "Active admins insert facts" ON facts;
DROP POLICY IF EXISTS "Active admins update facts" ON facts;
DROP POLICY IF EXISTS "Active admins delete facts" ON facts;
DROP POLICY IF EXISTS "Only admins can insert facts" ON facts;
DROP POLICY IF EXISTS "Only admins can update facts" ON facts;
DROP POLICY IF EXISTS "Only admins can delete facts" ON facts;
DROP POLICY IF EXISTS "auth_manage_facts" ON facts;  -- Legacy FOR ALL policy (causes duplicates)

-- Recreate only 4 required policies
-- 1. SELECT: Public read (anyone, including unauthenticated)
CREATE POLICY "Anyone can read facts" ON facts
  FOR SELECT
  USING (true);

-- 2. INSERT: Only active admins
CREATE POLICY "Only admins can insert facts" ON facts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 3. UPDATE: Only active admins
CREATE POLICY "Only admins can update facts" ON facts
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

-- 4. DELETE: Only active admins
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
-- QUIZZES TABLE - Drop all policies, recreate clean
-- ============================================================================

DROP POLICY IF EXISTS "Public select quizzes" ON quizzes;
DROP POLICY IF EXISTS "public_read_quizzes" ON quizzes;
DROP POLICY IF EXISTS "Anyone can read quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Active admins insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Active admins update quizzes" ON quizzes;
DROP POLICY IF EXISTS "Active admins delete quizzes" ON quizzes;
DROP POLICY IF EXISTS "Only admins can insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Only admins can update quizzes" ON quizzes;
DROP POLICY IF EXISTS "Only admins can delete quizzes" ON quizzes;
DROP POLICY IF EXISTS "auth_manage_quizzes" ON quizzes;  -- Legacy FOR ALL policy (causes duplicates)

CREATE POLICY "Anyone can read quizzes" ON quizzes
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert quizzes" ON quizzes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

CREATE POLICY "Only admins can update quizzes" ON quizzes
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
-- CATEGORIES TABLE - Drop all policies, recreate clean
-- ============================================================================

DROP POLICY IF EXISTS "Public select categories" ON categories;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Admins manage categories" ON categories;
DROP POLICY IF EXISTS "Active admins insert categories" ON categories;
DROP POLICY IF EXISTS "Active admins update categories" ON categories;
DROP POLICY IF EXISTS "Active admins delete categories" ON categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
DROP POLICY IF EXISTS "auth_manage_categories" ON categories;  -- Legacy FOR ALL policy (causes duplicates)
DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;

CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert categories" ON categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

CREATE POLICY "Only admins can update categories" ON categories
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

CREATE POLICY "Only admins can delete categories" ON categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- ============================================================================
-- SUBCATEGORIES TABLE - Drop all policies, recreate clean
-- ============================================================================

DROP POLICY IF EXISTS "Public select subcategories" ON subcategories;
DROP POLICY IF EXISTS "public_read_subcategories" ON subcategories;
DROP POLICY IF EXISTS "Anyone can read subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins manage subcategories" ON subcategories;
DROP POLICY IF EXISTS "Active admins insert subcategories" ON subcategories;
DROP POLICY IF EXISTS "Active admins update subcategories" ON subcategories;
DROP POLICY IF EXISTS "Active admins delete subcategories" ON subcategories;
DROP POLICY IF EXISTS "Only admins can insert subcategories" ON subcategories;
DROP POLICY IF EXISTS "Only admins can update subcategories" ON subcategories;
DROP POLICY IF EXISTS "auth_manage_subcategories" ON subcategories;  -- Legacy FOR ALL policy (causes duplicates)
DROP POLICY IF EXISTS "Only admins can delete subcategories" ON subcategories;

CREATE POLICY "Anyone can read subcategories" ON subcategories
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert subcategories" ON subcategories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

CREATE POLICY "Only admins can update subcategories" ON subcategories
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

CREATE POLICY "Only admins can delete subcategories" ON subcategories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_user_id = (SELECT auth.uid())
      AND admins.is_active = true
    )
  );

-- 