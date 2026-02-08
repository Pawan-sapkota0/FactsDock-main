-- Migration: Link admins table to auth.users via auth_user_id
-- This creates a foreign key relationship so admin authorization is based on authenticated user ID
-- not just email (which is insecure and not linked to the actual auth session)

-- Add auth_user_id column to admins table
-- This column will hold the UUID of the auth.users record for each admin
ALTER TABLE IF EXISTS admins 
ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for faster lookups by auth_user_id during admin verification
CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);

-- Add comment explaining the column purpose
COMMENT ON COLUMN admins.auth_user_id IS 'Foreign key linking to auth.users(id). Used for secure admin verification during login.';

-- Update RLS policies to use auth_user_id instead of id for proper verification

-- Drop old (broken) RLS policies that incorrectly compared auth.uid() with admins.id
DROP POLICY IF EXISTS "Users view own admin record" ON admins;
DROP POLICY IF EXISTS "Superadmins view all admins" ON admins;
DROP POLICY IF EXISTS "Superadmins manage admins" ON admins;

-- Create new RLS policies that correctly use auth_user_id
CREATE POLICY "Users view own admin record" ON admins
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = auth_user_id);

CREATE POLICY "Superadmins view all admins" ON admins
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE role = 'superadmin' AND is_active = true
  ));

CREATE POLICY "Superadmins manage admins" ON admins
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE role = 'superadmin' AND is_active = true
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE role = 'superadmin' AND is_active = true
  ));

-- Update fact write policies to use correct admin verification
DROP POLICY IF EXISTS "Active admins insert facts" ON facts;
DROP POLICY IF EXISTS "Active admins update facts" ON facts;
DROP POLICY IF EXISTS "Active admins delete facts" ON facts;

CREATE POLICY "Active admins insert facts" ON facts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

CREATE POLICY "Active admins update facts" ON facts
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

CREATE POLICY "Active admins delete facts" ON facts
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

-- Update quiz write policies to use correct admin verification
DROP POLICY IF EXISTS "Active admins insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Active admins update quizzes" ON quizzes;
DROP POLICY IF EXISTS "Active admins delete quizzes" ON quizzes;

CREATE POLICY "Active admins insert quizzes" ON quizzes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

CREATE POLICY "Active admins update quizzes" ON quizzes
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

CREATE POLICY "Active admins delete quizzes" ON quizzes
  FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

-- Update categories write policies to use correct admin verification
DROP POLICY IF EXISTS "Active admins insert categories" ON categories;
DROP POLICY IF EXISTS "Active admins update categories" ON categories;

CREATE POLICY "Active admins insert categories" ON categories
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

CREATE POLICY "Active admins update categories" ON categories
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

-- Update admin activity logs policies
DROP POLICY IF EXISTS "Admins can log their activities" ON admin_activity_logs;
DROP POLICY IF EXISTS "Superadmins view audit logs" ON admin_activity_logs;

CREATE POLICY "Admins can log their activities" ON admin_activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE is_active = true
  ));

CREATE POLICY "Superadmins view audit logs" ON admin_activity_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (
    SELECT auth_user_id FROM admins WHERE role = 'superadmin' AND is_active = true
  ));
