-- RLS policies example for Admin-only management
-- This migration assumes you will insert admin rows with id = auth.uid()

-- Enable RLS on tables 
ALTER TABLE IF EXISTS facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subcategories ENABLE ROW LEVEL SECURITY;

-- Policy: allow anyone to SELECT facts (public read) but only admins can INSERT/UPDATE/DELETE
CREATE POLICY "Public select facts" ON facts
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage facts" ON facts
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins));

-- Quizzes: public select, admin manage
CREATE POLICY "Public select quizzes" ON quizzes
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quizzes" ON quizzes
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins));


-- Categories: only admins can create/update/delete; anyone can read
CREATE POLICY "Public select categories" ON categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage categories" ON categories
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins));


-- Subcategories: admin manage, public select
CREATE POLICY "Public select subcategories" ON subcategories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage subcategories" ON subcategories
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins));

-- Facts: public read, admin manage


CREATE POLICY "public_read_facts" ON facts
  FOR SELECT USING (true);


CREATE POLICY "Admins can view admin table"
ON admins
FOR SELECT
USING (true);

CREATE POLICY "Admins can read user_stats"
ON public.user_stats
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM admins)
);

CREATE POLICY "Admins can insert user_stats"
ON public.user_stats
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM admins)
);

CREATE POLICY "Admins can update user_stats"
ON public.user_stats
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM admins)
)
WITH CHECK (
  auth.uid() IN (SELECT id FROM admins)
);

CREATE POLICY "Admins can delete user_stats"
ON public.user_stats
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Notes:
-- 1) This migration assumes the `admins` table stores admin entries where `id` matches `auth.uid()` (the Supabase user id).
--    Alternatively, you can store emails in `admins.email` and use policies that compare to current_user email via a JWT claim.
-- 2) Test policies carefully. Use the Supabase SQL editor to apply and adjust as needed.
