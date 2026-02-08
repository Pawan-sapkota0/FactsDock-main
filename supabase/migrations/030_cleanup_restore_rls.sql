-- Migration: Cleanup and restore RLS to initial state
-- Context: This migration cleans up temporary changes made during debugging
-- Action: Re-enable RLS on admins table and ensure original policies are in place

-- Step 1: Re-enable RLS on admins table (was disabled for debugging)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies that may conflict
DROP POLICY IF EXISTS "Users view own admin record for login" ON admins;
DROP POLICY IF EXISTS "Superadmins view all admins for management" ON admins;
DROP POLICY IF EXISTS "Users view own admin record" ON admins;
DROP POLICY IF EXISTS "Superadmins view all admins" ON admins;
DROP POLICY IF EXISTS "Superadmins manage admins" ON admins;

-- Step 3: Recreate the original RLS policies from migration 008
-- Allow any authenticated user to check their own admin status (for login verification)
CREATE POLICY "Users view own admin record" ON admins
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Superadmins can view all admin records for management purposes
CREATE POLICY "Superadmins view all admins" ON admins
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE role = 'superadmin' AND is_active));

-- Superadmins can manage (insert, update, delete) admin records
CREATE POLICY "Superadmins manage admins" ON admins
  FOR ALL
  USING (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE role = 'superadmin' AND is_active))
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() IN (SELECT id FROM admins WHERE role = 'superadmin' AND is_active));
