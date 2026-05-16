-- Migration: Create Stories Management System Tables

-- Story Categories Table
CREATE TABLE IF NOT EXISTS story_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS story_categories_slug_idx ON story_categories(slug);

-- Stories Table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  content jsonb NOT NULL,
  cover_image text NOT NULL,
  category_id uuid NOT NULL REFERENCES story_categories(id) ON DELETE RESTRICT,
  tags text[],
  reading_time text NOT NULL,
  is_featured boolean DEFAULT false,
  is_trending boolean DEFAULT false,
  status text NOT NULL DEFAULT 'draft', -- draft | published
  views integer DEFAULT 0,
  meta_title text,
  meta_description text,
  seo_keywords text,
  author text DEFAULT 'FactsDock Team',
  publish_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS stories_slug_idx ON stories(slug);
CREATE INDEX IF NOT EXISTS stories_category_id_idx ON stories(category_id);
CREATE INDEX IF NOT EXISTS stories_status_idx ON stories(status);
CREATE INDEX IF NOT EXISTS stories_is_featured_idx ON stories(is_featured);
CREATE INDEX IF NOT EXISTS stories_is_trending_idx ON stories(is_trending);
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON stories(created_at DESC);

-- Story Views Table (for tracking views)
CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Create index for story_views
CREATE INDEX IF NOT EXISTS story_views_story_id_idx ON story_views(story_id);
CREATE INDEX IF NOT EXISTS story_views_viewed_at_idx ON story_views(viewed_at DESC);

-- Enable RLS on all tables
ALTER TABLE story_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for story_categories
-- ============================================================================

-- Public: Everyone can read published categories
CREATE POLICY "Public read categories" ON story_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin: Can manage categories
CREATE POLICY "Admin read categories" ON story_categories
  FOR SELECT
  TO authenticated
  USING (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admin create categories" ON story_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admin update categories" ON story_categories
  FOR UPDATE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()));

CREATE POLICY "Admin delete categories" ON story_categories
  FOR DELETE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================================================
-- RLS Policies for stories
-- ============================================================================

-- Public: Everyone can read published stories
CREATE POLICY "Public read published stories" ON stories
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admin: Can read all stories (draft and published)
CREATE POLICY "Admin read all stories" ON stories
  FOR SELECT
  TO authenticated
  USING (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admin: Can create stories
CREATE POLICY "Admin create stories" ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admin: Can update stories
CREATE POLICY "Admin update stories" ON stories
  FOR UPDATE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()));

-- Admin: Can delete stories
CREATE POLICY "Admin delete stories" ON stories
  FOR DELETE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM admins WHERE id = auth.uid()));

-- ============================================================================
-- RLS Policies for story_views
-- ============================================================================

-- Public: Everyone can insert views
CREATE POLICY "Public insert views" ON story_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public: Everyone can read views for analytics
CREATE POLICY "Public read views" ON story_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- Insert default categories
-- ============================================================================

INSERT INTO story_categories (name, slug, description)
VALUES 
  ('History', 'history', 'Stories about historical events and civilizations'),
  ('Science', 'science', 'Scientific discoveries and insights'),
  ('Countries', 'countries', 'Facts and stories about nations'),
  ('Psychology', 'psychology', 'Understanding human behavior and mind'),
  ('Mysteries', 'mysteries', 'Unsolved mysteries and enigmas'),
  ('Culture', 'culture', 'Cultural traditions and customs'),
  ('Space', 'space', 'Astronomy and space exploration')
ON CONFLICT (slug) DO NOTHING;
