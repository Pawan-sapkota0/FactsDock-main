-- 003_add_fact_types.sql
-- Adds a fact_types table and links categories and facts to a fact_type

BEGIN;

-- Create fact_types table
CREATE TABLE IF NOT EXISTS fact_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Add fact_type_id to categories (nullable initially)
ALTER TABLE IF EXISTS categories
  ADD COLUMN IF NOT EXISTS fact_type_id uuid REFERENCES fact_types(id) ON DELETE SET NULL;

-- Add fact_type_id to facts (nullable initially)
ALTER TABLE IF EXISTS facts
  ADD COLUMN IF NOT EXISTS fact_type_id uuid REFERENCES fact_types(id) ON DELETE SET NULL;

COMMIT;

-- Notes:
-- 1) After applying this migration, insert rows into fact_types for
--    'Fun Facts', 'World Facts', and 'Country Facts', then update
--    categories.fact_type_id to point to the appropriate type IDs.
-- 2) You can run this migration via the Supabase SQL editor or the
--    Supabase CLI. Example (Supabase CLI):
--    supabase db push --file supabase/migrations/003_add_fact_types.sql
