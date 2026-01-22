-- Migration: Add admin security fields for role-based access control

-- Add missing columns to admins table
ALTER TABLE IF EXISTS admins 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'editor',
ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Create admin_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  timestamp timestamptz DEFAULT now(),
  ip_address text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_timestamp ON admin_activity_logs(timestamp DESC);

-- Add comment to admin_activity_logs
COMMENT ON TABLE admin_activity_logs IS 'Audit trail for admin actions and security events';
COMMENT ON COLUMN admin_activity_logs.action IS 'Type of admin action (e.g., create_fact, edit_quiz, manage_admins)';
COMMENT ON COLUMN admin_activity_logs.details IS 'JSON details about the action (what was changed, by whom, etc.)';

-- Update admins table comment
COMMENT ON TABLE admins IS 'Administrative users with role-based access control';
COMMENT ON COLUMN admins.role IS 'Role: editor, admin, or superadmin';
COMMENT ON COLUMN admins.permissions IS 'Array of permission strings (manage_facts, manage_quizzes, manage_categories, manage_settings, manage_admins, view_analytics)';
COMMENT ON COLUMN admins.is_active IS 'Whether the admin account is active';
COMMENT ON COLUMN admins.last_login IS 'Timestamp of last successful login';

-- Ensure permissions default for existing records (if any)
UPDATE admins SET permissions = ARRAY['manage_facts', 'manage_quizzes', 'manage_categories', 'view_analytics'] WHERE role = 'editor' AND permissions = ARRAY[]::text[];
UPDATE admins SET permissions = ARRAY['manage_facts', 'manage_quizzes', 'manage_categories', 'manage_settings', 'view_analytics'] WHERE role = 'admin' AND permissions = ARRAY[]::text[];
UPDATE admins SET permissions = ARRAY['manage_facts', 'manage_quizzes', 'manage_categories', 'manage_settings', 'manage_admins', 'view_analytics'] WHERE role = 'superadmin' AND permissions = ARRAY[]::text[];
