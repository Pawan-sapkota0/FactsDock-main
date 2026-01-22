-- Create settings table for global website configuration
CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- General Settings
  website_name text DEFAULT 'World Facts',
  website_tagline text DEFAULT 'Know the World In One Glance',
  default_language text DEFAULT 'en',
  default_timezone text DEFAULT 'UTC',
  items_per_page integer DEFAULT 8,
  
  -- SEO Settings
  meta_title text DEFAULT 'World Facts - Global Knowledge',
  meta_description text DEFAULT 'Explore interesting facts about countries, history, science, and more',
  meta_keywords text DEFAULT 'facts, world, education, countries',
  og_image_url text,
  allow_indexing boolean DEFAULT true,
  
  -- Content Settings
  facts_per_page integer DEFAULT 8,
  quiz_questions_limit integer DEFAULT 10,
  enable_random_quiz boolean DEFAULT true,
  enable_country_quiz boolean DEFAULT true,
  
  -- Performance Settings
  enable_skeleton_loading boolean DEFAULT true,
  enable_pagination boolean DEFAULT true,
  enable_lazy_loading boolean DEFAULT true,
  
  -- Security & Access
  admin_email text,
  maintenance_mode boolean DEFAULT false,
  content_approval_required boolean DEFAULT false,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS settings_updated_at_idx ON settings(updated_at DESC);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can read all settings
CREATE POLICY "Admin read settings" ON settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- RLS Policy: Admins can update settings
CREATE POLICY "Admin update settings" ON settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- RLS Policy: Public can read settings (for frontend consumption)
CREATE POLICY "Public read settings" ON settings
  FOR SELECT
  TO anon
  USING (true);

-- Insert default settings
INSERT INTO settings (website_name, website_tagline)
VALUES ('World Facts', 'Discover amazing facts from around the world')
ON CONFLICT DO NOTHING;
