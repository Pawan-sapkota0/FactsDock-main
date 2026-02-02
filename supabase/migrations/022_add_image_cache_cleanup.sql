-- Migration: Add automatic cleanup for expired image cache entries and old news

-- Create a function to clean up expired image cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_image_cache()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  -- Delete entries that have expired (older than 48 hours from fetched_at)
  DELETE FROM image_cache
  WHERE fetched_at < NOW() - INTERVAL '48 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION cleanup_expired_image_cache() IS 'Removes image cache entries older than 48 hours. Should be run periodically (e.g., daily)';

-- Create a function to clean up old news articles (older than 48 hours)
CREATE OR REPLACE FUNCTION cleanup_old_news()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  -- Delete news articles older than 48 hours
  DELETE FROM country_news
  WHERE created_at < NOW() - INTERVAL '48 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION cleanup_old_news() IS 'Removes news articles older than 48 hours to keep the news table fresh. Should be run periodically (e.g., daily)';

-- Create index for efficient cleanup queries on created_at
CREATE INDEX IF NOT EXISTS idx_country_news_created_at_cleanup ON country_news(created_at);

-- Migration: Fix image_cache RLS policy for UPDATE operations

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated update to image_cache" ON image_cache;

-- Create a restricted policy that only allows admins to update
CREATE POLICY "Allow admins to update image_cache" ON image_cache
  FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- Also add DELETE policy for consistency (currently missing)
CREATE POLICY "Allow admins to delete image_cache" ON image_cache
  FOR DELETE 
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));