
-- ============================================================================

-- Drop all existing admin policies
DROP POLICY IF EXISTS "Allow admin insert" ON country_news;
DROP POLICY IF EXISTS "Allow admin update" ON country_news;
DROP POLICY IF EXISTS "Allow admin delete" ON country_news;

-- ============================================================================
-- Recreate optimized policies
-- ============================================================================

-- 1. INSERT: Authenticated users or service role can insert (via Edge Functions)
--    Optimized with (SELECT auth.role())
CREATE POLICY "Allow admin insert" ON country_news
  FOR INSERT 
  WITH CHECK ((SELECT auth.role()) IN ('authenticated', 'service_role'));

-- 2. UPDATE: Only service role can update (via cron/Edge Functions)
--    Optimized with (SELECT auth.role())
CREATE POLICY "Allow admin update" ON country_news
  FOR UPDATE 
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- 3. DELETE: Only service role can delete (via cron/Edge Functions)
--    Optimized with (SELECT auth.role())
CREATE POLICY "Allow admin delete" ON country_news
  FOR DELETE 
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================================================
-- 