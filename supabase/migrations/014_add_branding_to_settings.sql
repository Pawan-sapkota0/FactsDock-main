-- Add branding image storage columns to settings table
-- This migration adds support for single hero background, logo, and favicon URLs

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS hero_background_url text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS favicon_url text;

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS hero_background_storage_path text,
ADD COLUMN IF NOT EXISTS logo_storage_path text,
ADD COLUMN IF NOT EXISTS favicon_storage_path text;

-- Create index on image columns for faster lookups
CREATE INDEX IF NOT EXISTS settings_hero_background_url_idx ON settings(hero_background_url);
CREATE INDEX IF NOT EXISTS settings_logo_url_idx ON settings(logo_url);
CREATE INDEX IF NOT EXISTS settings_favicon_url_idx ON settings(favicon_url);

-- Add comment to document the branding columns
COMMENT ON COLUMN settings.hero_background_url IS 'URL to hero background image';
COMMENT ON COLUMN settings.logo_url IS 'URL to logo image';
COMMENT ON COLUMN settings.favicon_url IS 'URL to favicon image';
COMMENT ON COLUMN settings.hero_background_storage_path IS 'Storage path for hero background in Supabase Storage';
COMMENT ON COLUMN settings.logo_storage_path IS 'Storage path for logo in Supabase Storage';
COMMENT ON COLUMN settings.favicon_storage_path IS 'Storage path for favicon in Supabase Storage';
