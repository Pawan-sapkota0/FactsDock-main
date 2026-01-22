-- Create country_news table for storing fetched news articles
CREATE TABLE IF NOT EXISTS country_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(url, country) -- Prevent duplicate articles per country
);

-- Create index for efficient queries
CREATE INDEX idx_country_news_country ON country_news(country);
CREATE INDEX idx_country_news_created_at ON country_news(created_at DESC);
CREATE INDEX idx_country_news_country_created ON country_news(country, created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE country_news ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read news (public)
CREATE POLICY "Allow public read access" ON country_news
  FOR SELECT USING (true);

-- Policy: Only admins can insert/update/delete (via Edge Functions)
CREATE POLICY "Allow admin insert" ON country_news
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow admin update" ON country_news
  FOR UPDATE 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow admin delete" ON country_news
  FOR DELETE 
  USING (auth.role() = 'service_role');

-- Create a view for clean data retrieval (latest news per country)
CREATE OR REPLACE VIEW latest_country_news AS
SELECT 
  country,
  title,
  source,
  url,
  image_url,
  published_at,
  created_at
FROM country_news
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY published_at DESC NULLS LAST, created_at DESC;
