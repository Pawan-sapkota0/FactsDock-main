-- Migration: Add RLS policies for admin table and admin activity logs

-- Enable RLS on admins table
ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins table: only superadmins and the user themselves can view
CREATE POLICY "Superadmins view all admins" ON admins
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND (
    auth.uid() IN (SELECT id FROM admins WHERE role = 'superadmin' AND is_active)
    OR auth.uid() = id
  ));

CREATE POLICY "Superadmins manage admins" ON admins
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE role = 'superadmin' AND is_active))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE role = 'superadmin' AND is_active));

-- Admin activity logs: only admins can insert (for logging), only superadmins can view
CREATE POLICY "Admins can log their activities" ON admin_activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Superadmins view audit logs" ON admin_activity_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE role = 'superadmin' AND is_active));

-- Public read access for facts (anyone can read)
DROP POLICY IF EXISTS "Admins can manage facts" ON facts;
CREATE POLICY "Anyone can read facts" ON facts
  FOR SELECT
  USING (true);

-- Admin-only write policies for facts
CREATE POLICY "Active admins insert facts" ON facts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Active admins update facts" ON facts
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Active admins delete facts" ON facts
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

-- Public read access for quizzes
DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;
CREATE POLICY "Anyone can read quizzes" ON quizzes
  FOR SELECT
  USING (true);

CREATE POLICY "Active admins insert quizzes" ON quizzes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Active admins update quizzes" ON quizzes
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Active admins delete quizzes" ON quizzes
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

-- Public read access for categories
DROP POLICY IF EXISTS "Admins manage categories" ON categories;
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "Active admins insert categories" ON categories
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Active admins update categories" ON categories
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Active admins delete categories" ON categories
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

-- Public read access for subcategories
DROP POLICY IF EXISTS "Admins manage subcategories" ON subcategories;
CREATE POLICY "Anyone can read subcategories" ON subcategories
  FOR SELECT
  USING (true);

CREATE POLICY "Active admins insert subcategories" ON subcategories
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Active admins update subcategories" ON subcategories
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));

CREATE POLICY "Active admins delete subcategories" ON subcategories
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE is_active = true));
