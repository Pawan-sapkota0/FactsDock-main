-- Migration: Fix overly permissive RLS policies
-- Issue 1: story_views INSERT policy allows unrestricted access
-- Issue 2: story-covers storage bucket allows public listing

-- ============================================================================
-- Fix story_views INSERT policy
-- ============================================================================

-- Drop the overly permissive "Public insert views" policy
DROP POLICY IF EXISTS "Public insert views" ON story_views;

-- Replace with a more restrictive policy that validates story existence
CREATE POLICY "Insert views with valid story" ON story_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Ensure the story_id references a published story
    EXISTS(
      SELECT 1 FROM stories 
      WHERE id = story_views.story_id 
      AND status = 'published'
    )
  );

-- ============================================================================
-- Fix story-covers bucket SELECT policy
-- ============================================================================

-- Drop the overly broad "Public Read story-covers" policy
DROP POLICY IF EXISTS "Public Read story-covers" ON storage.objects;

-- Replace with an authenticated-only SELECT policy
-- Public users can still access files via direct URL, but cannot list bucket contents
CREATE POLICY "Authenticated Read story-covers" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'story-covers');
