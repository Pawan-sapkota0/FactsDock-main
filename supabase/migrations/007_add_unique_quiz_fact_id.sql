-- 007_add_unique_quiz_fact_id.sql
-- Remove duplicate quizzes for same fact_id (keep lowest id), then add a UNIQUE constraint on fact_id
BEGIN;

-- Delete duplicate rows keeping the smallest id for each fact_id
DELETE FROM quizzes a
USING quizzes b
WHERE a.fact_id = b.fact_id
  AND a.id > b.id
  AND a.fact_id IS NOT NULL;

-- Add unique constraint to prevent future duplicates
ALTER TABLE quizzes ADD CONSTRAINT unique_quiz_fact_id UNIQUE (fact_id);

COMMIT;

-- Note: This migration deletes duplicates if present. Review backups before running in production.
