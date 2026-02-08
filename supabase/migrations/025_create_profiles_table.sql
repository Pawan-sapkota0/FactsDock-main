-- Migration: Create user profiles table with RLS policies
-- This table stores user profile data separate from auth.users
-- Each user can only access and modify their own profile

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  email_verified_at timestamptz,
  email_verified boolean DEFAULT false,
  otp_enabled boolean DEFAULT false,
  phone text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add helpful comments
COMMENT ON TABLE profiles IS 'User profile information, separate from auth.users. One row per authenticated user.';
COMMENT ON COLUMN profiles.email_verified_at IS 'Timestamp when user verified their email via OTP.';
COMMENT ON COLUMN profiles.email_verified IS 'Whether user has completed email verification.';
COMMENT ON COLUMN profiles.otp_enabled IS 'Whether user has enabled OTP login as alternative auth method.';

-- Create index for email_verified status (useful for queries)
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can select all profiles (for admin dashboard)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Policy: Allow inserts only for authenticated users' own profile
-- The trigger (with SECURITY DEFINER) can bypass this and create any profile
-- But regular users can only insert their own profile (if needed)
CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    email_verified,
    email_verified_at
  )
  VALUES (
    NEW.id,
    NEW.user_metadata->>'display_name',
    CASE 
      -- If email confirmation is disabled, mark as verified
      WHEN NEW.email_confirmed_at IS NOT NULL THEN true
      ELSE false
    END,
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
      ELSE null
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update function to refresh updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_profile_updated ON profiles;

-- Create trigger for updated_at
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
