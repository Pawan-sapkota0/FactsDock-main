-- Create quiz_progress table for authenticated users
CREATE TABLE IF NOT EXISTS quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_mode TEXT NOT NULL CHECK (quiz_mode IN ('random', 'difficulty', 'country')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'all')),
  country TEXT,
  highest_level_unlocked INTEGER NOT NULL DEFAULT 1,
  completed_levels INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  last_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_mode, difficulty, country)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_progress_user_id ON quiz_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_progress_mode ON quiz_progress(quiz_mode);

-- Enable RLS
ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own progress
CREATE POLICY "Users can view own quiz progress" ON quiz_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own progress
CREATE POLICY "Users can insert own quiz progress" ON quiz_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own progress
CREATE POLICY "Users can update own quiz progress" ON quiz_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quiz_progress_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quiz_progress_update_timestamp
  BEFORE UPDATE ON quiz_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_progress_timestamp();
