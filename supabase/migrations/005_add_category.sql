INSERT INTO categories (name, fact_type_id, type)
VALUES
('Geography & Nature', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts'),
('History & Culture', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts'),
('Science & Discovery', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts'),
('People & Society', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts'),
('Foods & Flavors', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts'),
('Animals & Wildlife', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts'),
('Art, Music & Entertainment', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts'),
('National Data', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts'),
('Fun Zones', (SELECT id FROM fact_types WHERE slug = 'world-facts'), 'world-facts')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE categories
ADD CONSTRAINT categories_name_unique UNIQUE (name);

SELECT name, type, fact_type_id
FROM categories
WHERE fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')
ORDER BY name;

INSERT INTO categories (name, fact_type_id, type)
VALUES
('Animals & Nature', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts'),
('Science & Technology', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts'),
('History & Mystery', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts'),
('Food & Flavors', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts'),
('Sports', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts'),
('Geography', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts'),
('Around the World', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts'),
('Weird & Wacky World', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts'),
('Just for Fun', (SELECT id FROM fact_types WHERE slug = 'fun-facts'), 'fun-facts')
ON CONFLICT (name) DO NOTHING;

SELECT name, type, fact_type_id
FROM categories
WHERE fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')
ORDER BY name;

INSERT INTO categories (name, fact_type_id, type)
VALUES
('Geography & Nature', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts'),
('Culture & Tradition', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts'),
('History & Heritage', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts'),
('Economy & Industry', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts'),
('Tourism & Landmarks', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts'),
('Education & Innovation', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts'),
('Sports & Achievements', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts'),
('Fun & Interesting Facts', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts'),
('Global Presence', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts')
ON CONFLICT (name) DO NOTHING;

SELECT name, type, fact_type_id
FROM categories
WHERE fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')
ORDER BY name;

-- Drop the old unique constraint
ALTER TABLE categories
DROP CONSTRAINT IF EXISTS categories_name_unique;

-- Create a new unique constraint on (name, fact_type_id)
ALTER TABLE categories
ADD CONSTRAINT categories_name_fact_type_unique UNIQUE (name, fact_type_id);

INSERT INTO categories (name, fact_type_id, type)
VALUES
('Geography & Nature', (SELECT id FROM fact_types WHERE slug = 'country-facts'), 'country-facts')
ON CONFLICT (name, fact_type_id) DO NOTHING;
