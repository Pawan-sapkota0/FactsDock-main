-- Migration: Add forgot password and OTP verification functions
-- These support the password reset and OTP-based features

-- Function to initiate password reset (OTP sent to email)
CREATE OR REPLACE FUNCTION public.request_password_reset(email text)
RETURNS json AS $$
DECLARE
  reset_token text;
  result json;
BEGIN
  -- Supabase handles password reset via auth API
  -- This is a helper function for logging/tracking
  
  -- Log the reset request
  INSERT INTO public.auth_logs (user_email, action, details)
  VALUES (email, 'password_reset_requested', json_build_object('timestamp', now()));
  
  RETURN json_build_object(
    'success', true,
    'message', 'If an account exists with this email, you will receive a password reset link.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to verify email (mark profile as email_verified)
CREATE OR REPLACE FUNCTION public.verify_email()
RETURNS json AS $$
DECLARE
  user_id uuid;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Update profile to mark email as verified
  UPDATE public.profiles
  SET 
    email_verified = true,
    email_verified_at = now()
  WHERE id = user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email verified successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to enable OTP login for a user
CREATE OR REPLACE FUNCTION public.enable_otp_login()
RETURNS json AS $$
DECLARE
  user_id uuid;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Update profile to enable OTP
  UPDATE public.profiles
  SET otp_enabled = true
  WHERE id = user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'OTP login enabled. You can now sign in with OTP.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to disable OTP login for a user
CREATE OR REPLACE FUNCTION public.disable_otp_login()
RETURNS json AS $$
DECLARE
  user_id uuid;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Update profile to disable OTP
  UPDATE public.profiles
  SET otp_enabled = false
  WHERE id = user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'OTP login disabled.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Optional: Create auth_logs table for tracking auth events
CREATE TABLE IF NOT EXISTS auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  user_id uuid,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create index for auth_logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- Enable RLS on auth_logs
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own auth logs
CREATE POLICY "Users can view own auth logs" ON auth_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Admins can view all auth logs
CREATE POLICY "Admins can view all auth logs" ON auth_logs
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));
