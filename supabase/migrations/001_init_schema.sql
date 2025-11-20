-- Migration: Initial schema for facts, quizzes, categories, subcategories, admins

-- Enable uuid-ossp if required by your Postgres provider
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL, -- 'fun' | 'world' | 'country'
  description text,
  created_at timestamptz DEFAULT now()
);

-- Subcategories
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Facts
CREATE TABLE IF NOT EXISTS facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id),
  subcategory_id uuid REFERENCES subcategories(id),
  country text,
  fact_text text NOT NULL,
  source text,
  status text NOT NULL DEFAULT 'draft', -- draft|approved|rejected
  metadata jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
-- Add fact_type_id only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='facts'
          AND column_name='fact_type_id'
    ) THEN
        ALTER TABLE facts
        ADD COLUMN fact_type_id uuid REFERENCES fact_types(id) NOT NULL;
    END IF;
END$$;

ALTER TABLE facts
ADD COLUMN fact_type_id uuid REFERENCES fact_types(id) NOT NULL;

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id),
  country text,
  questions jsonb NOT NULL,
  difficulty text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Optional: user stats / bookmarks
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fact_id uuid REFERENCES facts(id),
  quiz_id uuid REFERENCES quizzes(id),
  action text,
  created_at timestamptz DEFAULT now()
);
