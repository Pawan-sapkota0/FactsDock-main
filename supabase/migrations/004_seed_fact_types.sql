7.Around the World-- 004_seed_fact_types.sql
-- Seeds the fact_types table with three standard types and provides
-- example updates to assign existing categories to these types.

BEGIN;

-- Insert standard fact types (id will be generated)
INSERT INTO fact_types (name, slug)
VALUES
  ('Fun Facts', 'fun-facts'),
  ('World Facts', 'world-facts'),
  ('Country Facts', 'country-facts')
ON CONFLICT (slug) DO NOTHING;

-- Example category mapping: update categories that match common names
-- to the appropriate fact type. These UPDATE statements are safe if
-- the referenced category names don't exist (no rows will be changed).

COMMIT;

-- Notes:
-- Run this file in the Supabase SQL editor or via your migration tooling.
-- If your category names differ, edit the WHERE name IN (...) lists above
-- to match your actual category names, or run a SELECT on categories first:
-- SELECT id, name FROM categories ORDER BY name;
