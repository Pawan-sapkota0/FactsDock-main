-- Migration: Enhance image_cache table with refresh tracking

-- Add refresh tracking columns to image_cache if they don't exist
DO $$
BEGIN
    -- Track last refresh attempt
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'image_cache' AND column_name = 'last_refresh_attempt'
    ) THEN
        ALTER TABLE image_cache ADD COLUMN last_refresh_attempt timestamptz;
    END IF;

    -- Track refresh status (success/failed)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'image_cache' AND column_name = 'refresh_status'
    ) THEN
        ALTER TABLE image_cache ADD COLUMN refresh_status text DEFAULT 'pending' CHECK (refresh_status IN ('pending', 'success', 'failed'));
    END IF;

    -- Track consecutive failures for alerting
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'image_cache' AND column_name = 'consecutive_failures'
    ) THEN
        ALTER TABLE image_cache ADD COLUMN consecutive_failures int DEFAULT 0;
    END IF;

    -- Store the search queries used for fetching
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'image_cache' AND column_name = 'search_queries'
    ) THEN
        ALTER TABLE image_cache ADD COLUMN search_queries jsonb DEFAULT '[]'::jsonb;
    END IF;
END$$;

-- Create index for efficient querying of stale cache entries
DROP INDEX IF EXISTS idx_image_cache_expires_at;
CREATE INDEX idx_image_cache_expires_at ON image_cache(expires_at);

-- Create index for finding entries by refresh status
CREATE INDEX IF NOT EXISTS idx_image_cache_refresh_status ON image_cache(refresh_status);

-- Create index for entries needing refresh (older than 24 hours)
-- Note: Using fetched_at without WHERE clause, queries will filter at runtime
CREATE INDEX IF NOT EXISTS idx_image_cache_fetched_at ON image_cache(fetched_at);


-- Update RLS policies for better control
DROP POLICY IF EXISTS "Allow authenticated insert to image_cache" ON image_cache;
DROP POLICY IF EXISTS "Allow authenticated update to image_cache" ON image_cache;

-- Allow service role (cron functions) to insert/update
CREATE POLICY "Allow service role to manage image_cache" ON image_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update image_cache" ON image_cache
  FOR UPDATE USING (true) WITH CHECK (true);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_image_cache_updated_at ON image_cache;
CREATE TRIGGER trigger_image_cache_updated_at
  BEFORE UPDATE ON image_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_image_cache_updated_at();

-- Add helpful comment
COMMENT ON TABLE image_cache IS 'Stores cached country images from Unsplash. Refreshed daily by refresh-image-cache function. Expires after 48 hours of inactivity.';
COMMENT ON COLUMN image_cache.refresh_status IS 'Status of last refresh attempt: pending, success, or failed';
COMMENT ON COLUMN image_cache.consecutive_failures IS 'Number of consecutive failed refresh attempts for monitoring';



  CREATE POLICY "Allow admin update" ON country_news
  FOR UPDATE 
  WITH CHECK (auth.role() = 'service_role');
  -- Missing USING clause = always true (unrestricted)

  -- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow admin update" ON country_news;

-- Create a restricted policy that only allows service_role to update
CREATE POLICY "Allow admin update" ON country_news
  FOR UPDATE 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

  