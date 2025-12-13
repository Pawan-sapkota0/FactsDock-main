-- Add is_random column to quizzes table to support random quiz generation
ALTER TABLE quizzes ADD COLUMN is_random BOOLEAN DEFAULT FALSE;
