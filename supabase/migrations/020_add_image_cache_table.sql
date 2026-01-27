-- Migration: Add image cache table for country gallery images

-- Image cache table to store Unsplash image URLs and metadata
CREATE TABLE IF NOT EXISTS image_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  search_queries jsonb NOT NULL, -- Array of search queries used
  images jsonb NOT NULL, -- Array of { url, alt, photographer, photographerUrl, width, height }
  fetched_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '48 hours'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country)
);

-- Index for faster lookups by country
CREATE INDEX IF NOT EXISTS idx_image_cache_country ON image_cache(country);
CREATE INDEX IF NOT EXISTS idx_image_cache_expires_at ON image_cache(expires_at);

-- Optional: Add RLS policies if admin authentication is required
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (images are public data)
CREATE POLICY "Allow public read access to image_cache" ON image_cache
  FOR SELECT USING (true);

-- Allow authenticated users (admins) to insert/update
CREATE POLICY "Allow authenticated insert to image_cache" ON image_cache
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to image_cache" ON image_cache
  FOR UPDATE USING (auth.role() = 'authenticated');
