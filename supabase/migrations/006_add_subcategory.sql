--world_facts_category's_subcategory
-- 1. Geography & Nature
INSERT INTO subcategories (name, category_id) VALUES
('Countries & Capitals', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Mountains & Volcanoes', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Rivers, Lakes & Oceans', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Deserts & Forests', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Natural Wonders', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Continents & Islands', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

-- 2. History & Culture
INSERT INTO subcategories (name, category_id) VALUES
('Ancient Civilizations', (SELECT id FROM categories WHERE name = 'History & Culture' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Historical Events', (SELECT id FROM categories WHERE name = 'History & Culture' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Monuments & Heritage Sites', (SELECT id FROM categories WHERE name = 'History & Culture' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Festivals & Traditions', (SELECT id FROM categories WHERE name = 'History & Culture' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Languages of the World', (SELECT id FROM categories WHERE name = 'History & Culture' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Flags & Symbols', (SELECT id FROM categories WHERE name = 'History & Culture' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

-- 3. Science & Discovery
INSERT INTO subcategories (name, category_id) VALUES
('Space & Planets', (SELECT id FROM categories WHERE name = 'Science & Discovery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Inventions & Discoveries', (SELECT id FROM categories WHERE name = 'Science & Discovery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Wildlife & Ecosystems', (SELECT id FROM categories WHERE name = 'Science & Discovery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Climate & Weather', (SELECT id FROM categories WHERE name = 'Science & Discovery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Human Body Facts', (SELECT id FROM categories WHERE name = 'Science & Discovery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Technology & Innovation', (SELECT id FROM categories WHERE name = 'Science & Discovery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

-- 4. People & Society
INSERT INTO subcategories (name, category_id) VALUES
('Famous Personalities', (SELECT id FROM categories WHERE name = 'People & Society' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('World Records', (SELECT id FROM categories WHERE name = 'People & Society' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Population & Cities', (SELECT id FROM categories WHERE name = 'People & Society' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Education & Lifestyle', (SELECT id FROM categories WHERE name = 'People & Society' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Global Economy', (SELECT id FROM categories WHERE name = 'People & Society' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Travel & Tourism', (SELECT id FROM categories WHERE name = 'People & Society' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

-- 5. Foods & Flavors
INSERT INTO subcategories (name, category_id) VALUES
('Nutrition & Healthy Foods', (SELECT id FROM categories WHERE name = 'Foods & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Global Cuisines & Ingredients', (SELECT id FROM categories WHERE name = 'Foods & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Food History & Origins', (SELECT id FROM categories WHERE name = 'Foods & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Agricultural Practices', (SELECT id FROM categories WHERE name = 'Foods & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Food Production & Sustainability', (SELECT id FROM categories WHERE name = 'Foods & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Famous Dishes Around the World', (SELECT id FROM categories WHERE name = 'Foods & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Food Science & Chemistry', (SELECT id FROM categories WHERE name = 'Foods & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

-- 6. Animals & Wildlife
INSERT INTO subcategories (name, category_id) VALUES
('Animal Habitats & Behavior', (SELECT id FROM categories WHERE name = 'Animals & Wildlife' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Endangered Species', (SELECT id FROM categories WHERE name = 'Animals & Wildlife' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Animal Adaptations', (SELECT id FROM categories WHERE name = 'Animals & Wildlife' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Interesting Animal Facts', (SELECT id FROM categories WHERE name = 'Animals & Wildlife' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Wildlife Conservation', (SELECT id FROM categories WHERE name = 'Animals & Wildlife' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Animal Classification & Types', (SELECT id FROM categories WHERE name = 'Animals & Wildlife' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Animal Life Cycles', (SELECT id FROM categories WHERE name = 'Animals & Wildlife' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

-- 7. Art, Music & Entertainment
INSERT INTO subcategories (name, category_id) VALUES
('World Art & Museums', (SELECT id FROM categories WHERE name = 'Art, Music & Entertainment' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Global Music Genres', (SELECT id FROM categories WHERE name = 'Art, Music & Entertainment' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Movies & Media', (SELECT id FROM categories WHERE name = 'Art, Music & Entertainment' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Literature & Books', (SELECT id FROM categories WHERE name = 'Art, Music & Entertainment' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Architecture Styles', (SELECT id FROM categories WHERE name = 'Art, Music & Entertainment' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

-- 8. National Data
INSERT INTO subcategories (name, category_id) VALUES
('Population Statistics', (SELECT id FROM categories WHERE name = 'National Data' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Literacy & Education Rates', (SELECT id FROM categories WHERE name = 'National Data' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Economic Data & GDP', (SELECT id FROM categories WHERE name = 'National Data' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Health & Life Expectancy', (SELECT id FROM categories WHERE name = 'National Data' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Employment & Industry Facts', (SELECT id FROM categories WHERE name = 'National Data' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Geography & Land Area', (SELECT id FROM categories WHERE name = 'National Data' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Government & Political Structure', (SELECT id FROM categories WHERE name = 'National Data' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

-- 9. Fun Zones
INSERT INTO subcategories (name, category_id) VALUES
('“Did You Know?” Series', (SELECT id FROM categories WHERE name = 'Fun Zones' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Mind-Blowing Facts', (SELECT id FROM categories WHERE name = 'Fun Zones' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Unsolved Mysteries', (SELECT id FROM categories WHERE name = 'Fun Zones' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Myths & Legends', (SELECT id FROM categories WHERE name = 'Fun Zones' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts'))),
('Random Global Curiosities', (SELECT id FROM categories WHERE name = 'Fun Zones' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'world-facts')))
ON CONFLICT DO NOTHING;

--fun_facts_category's_subcategory
-- 1. Animals & Nature
INSERT INTO subcategories (name, category_id) VALUES
('Animal Intelligence', (SELECT id FROM categories WHERE name = 'Animals & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Extinct Creatures', (SELECT id FROM categories WHERE name = 'Animals & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('World''s Smallest / Biggest Animals', (SELECT id FROM categories WHERE name = 'Animals & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Fun Ocean Facts', (SELECT id FROM categories WHERE name = 'Animals & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Nature''s Oddities', (SELECT id FROM categories WHERE name = 'Animals & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;

-- 2. Science & Technology
INSERT INTO subcategories (name, category_id) VALUES
('Space Oddities', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Animal Superpowers', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Human Body Secrets', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Physics Phenomena', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Everyday Science Facts', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Internet Firsts', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Crazy Tech Inventions', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('AI and Robots', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Space Exploration Facts', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Gaming & Pop Culture Facts', (SELECT id FROM categories WHERE name = 'Science & Technology' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;

-- 3. History & Mystery
INSERT INTO subcategories (name, category_id) VALUES
('Forgotten Inventions', (SELECT id FROM categories WHERE name = 'History & Mystery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Historical Coincidences', (SELECT id FROM categories WHERE name = 'History & Mystery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Ancient Mysteries', (SELECT id FROM categories WHERE name = 'History & Mystery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Unexpected Origins', (SELECT id FROM categories WHERE name = 'History & Mystery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Time Travel Theories', (SELECT id FROM categories WHERE name = 'History & Mystery' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;

-- 4. Food & Flavors
INSERT INTO subcategories (name, category_id) VALUES
('Weird Foods People Actually Eat', (SELECT id FROM categories WHERE name = 'Food & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Origins of Famous Dishes', (SELECT id FROM categories WHERE name = 'Food & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Food Records', (SELECT id FROM categories WHERE name = 'Food & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Food Superstitions', (SELECT id FROM categories WHERE name = 'Food & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Global Street Foods', (SELECT id FROM categories WHERE name = 'Food & Flavors' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;

-- 5. Sports
INSERT INTO subcategories (name, category_id) VALUES
('Unbelievable Sports Records', (SELECT id FROM categories WHERE name = 'Sports' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Origin of Popular Sports', (SELECT id FROM categories WHERE name = 'Sports' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Weird & Funny Sports Moments', (SELECT id FROM categories WHERE name = 'Sports' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Unusual Sports Around the World', (SELECT id FROM categories WHERE name = 'Sports' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Sports Equipment Facts', (SELECT id FROM categories WHERE name = 'Sports' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Youngest & Oldest Athletes', (SELECT id FROM categories WHERE name = 'Sports' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Olympic Oddities', (SELECT id FROM categories WHERE name = 'Sports' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;

-- 6. Geography
INSERT INTO subcategories (name, category_id) VALUES
('Country Facts & Firsts', (SELECT id FROM categories WHERE name = 'Geography' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Strangest Borders & Shapes', (SELECT id FROM categories WHERE name = 'Geography' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Extreme Places on Earth', (SELECT id FROM categories WHERE name = 'Geography' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Smallest & Largest Facts', (SELECT id FROM categories WHERE name = 'Geography' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Unusual Natural Wonders', (SELECT id FROM categories WHERE name = 'Geography' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Fun Flag Facts', (SELECT id FROM categories WHERE name = 'Geography' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('City Secrets', (SELECT id FROM categories WHERE name = 'Geography' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;

-- 7. Around the World
INSERT INTO subcategories (name, category_id) VALUES
('Unknown Countries or Places', (SELECT id FROM categories WHERE name = 'Around the World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('World''s Smallest & Largest', (SELECT id FROM categories WHERE name = 'Around the World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Facts About Time Zones', (SELECT id FROM categories WHERE name = 'Around the World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Unique Festivals', (SELECT id FROM categories WHERE name = 'Around the World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Most Isolated Places', (SELECT id FROM categories WHERE name = 'Around the World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;

-- 8. Weird & Wacky World
INSERT INTO subcategories (name, category_id) VALUES
('Bizarre World Laws', (SELECT id FROM categories WHERE name = 'Weird & Wacky World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Strange Customs & Traditions', (SELECT id FROM categories WHERE name = 'Weird & Wacky World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Unusual Sports', (SELECT id FROM categories WHERE name = 'Weird & Wacky World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Funniest Town Names', (SELECT id FROM categories WHERE name = 'Weird & Wacky World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Quirky Records', (SELECT id FROM categories WHERE name = 'Weird & Wacky World' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;

-- 9. Just for Fun
INSERT INTO subcategories (name, category_id) VALUES
('Random “Did You Know?”', (SELECT id FROM categories WHERE name = 'Just for Fun' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Optical Illusions', (SELECT id FROM categories WHERE name = 'Just for Fun' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Fun Language Facts', (SELECT id FROM categories WHERE name = 'Just for Fun' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('Funny Human Habits', (SELECT id FROM categories WHERE name = 'Just for Fun' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts'))),
('“Believe It or Not!” Corner', (SELECT id FROM categories WHERE name = 'Just for Fun' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'fun-facts')))
ON CONFLICT DO NOTHING;



SELECT 
    s.name AS subcategory_name,
    c.name AS category_name,
    c.type AS category_type,
    f.name AS fact_type_name,
    f.slug AS fact_type_slug
FROM subcategories s
JOIN categories c ON s.category_id = c.id
JOIN fact_types f ON c.fact_type_id = f.id
ORDER BY f.slug, c.name, s.name;


--country_facts_category's_subcategories
-- 1. Geography & Nature
INSERT INTO subcategories (name, category_id) VALUES
('Major Landforms', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Climate & Weather Patterns', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Natural Resources', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Borders & Neighboring Countries', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('National Parks or Natural Wonders', (SELECT id FROM categories WHERE name = 'Geography & Nature' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;

-- 2. Culture & Tradition
INSERT INTO subcategories (name, category_id) VALUES
('Festivals & Celebrations', (SELECT id FROM categories WHERE name = 'Culture & Tradition' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Traditional Dress', (SELECT id FROM categories WHERE name = 'Culture & Tradition' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Local Foods / Cuisine', (SELECT id FROM categories WHERE name = 'Culture & Tradition' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Arts, Music & Dance', (SELECT id FROM categories WHERE name = 'Culture & Tradition' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Cultural Symbols', (SELECT id FROM categories WHERE name = 'Culture & Tradition' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;

-- 3. History & Heritage
INSERT INTO subcategories (name, category_id) VALUES
('Founding / Independence Date', (SELECT id FROM categories WHERE name = 'History & Heritage' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Historical Background', (SELECT id FROM categories WHERE name = 'History & Heritage' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Important Leaders or Rulers', (SELECT id FROM categories WHERE name = 'History & Heritage' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Historical Monuments & Heritage Sites', (SELECT id FROM categories WHERE name = 'History & Heritage' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;

-- 4. Economy & Industry
INSERT INTO subcategories (name, category_id) VALUES
('Major Industries', (SELECT id FROM categories WHERE name = 'Economy & Industry' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('GDP (approximate)', (SELECT id FROM categories WHERE name = 'Economy & Industry' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Important Exports / Imports', (SELECT id FROM categories WHERE name = 'Economy & Industry' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Currency Strength & Economy Type', (SELECT id FROM categories WHERE name = 'Economy & Industry' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;

-- 5. Tourism & Landmarks
INSERT INTO subcategories (name, category_id) VALUES
('Popular Tourist Attractions', (SELECT id FROM categories WHERE name = 'Tourism & Landmarks' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('UNESCO World Heritage Sites', (SELECT id FROM categories WHERE name = 'Tourism & Landmarks' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Famous Cities & Places', (SELECT id FROM categories WHERE name = 'Tourism & Landmarks' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Natural & Man-made Wonders', (SELECT id FROM categories WHERE name = 'Tourism & Landmarks' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;

-- 6. Education & Innovation
INSERT INTO subcategories (name, category_id) VALUES
('Literacy Rate', (SELECT id FROM categories WHERE name = 'Education & Innovation' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Notable Universities', (SELECT id FROM categories WHERE name = 'Education & Innovation' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Scientific or Technological Contributions', (SELECT id FROM categories WHERE name = 'Education & Innovation' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Research & Development', (SELECT id FROM categories WHERE name = 'Education & Innovation' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;

-- 7. Sports & Achievements
INSERT INTO subcategories (name, category_id) VALUES
('National Sports', (SELECT id FROM categories WHERE name = 'Sports & Achievements' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Famous Athletes', (SELECT id FROM categories WHERE name = 'Sports & Achievements' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Olympic Participation or Wins', (SELECT id FROM categories WHERE name = 'Sports & Achievements' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Major Sporting Events', (SELECT id FROM categories WHERE name = 'Sports & Achievements' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;

-- 8. Fun & Interesting Facts
INSERT INTO subcategories (name, category_id) VALUES
('Unique Laws or Customs', (SELECT id FROM categories WHERE name = 'Fun & Interesting Facts' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('World Records or Only in This Country', (SELECT id FROM categories WHERE name = 'Fun & Interesting Facts' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Weird Traditions / Oddities', (SELECT id FROM categories WHERE name = 'Fun & Interesting Facts' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('International Rankings', (SELECT id FROM categories WHERE name = 'Fun & Interesting Facts' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;

-- 9. Global Presence
INSERT INTO subcategories (name, category_id) VALUES
('Memberships (UN, WHO, etc.)', (SELECT id FROM categories WHERE name = 'Global Presence' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Diplomatic Relations', (SELECT id FROM categories WHERE name = 'Global Presence' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Embassies / Global Impact', (SELECT id FROM categories WHERE name = 'Global Presence' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts'))),
('Contribution to Global Issues', (SELECT id FROM categories WHERE name = 'Global Presence' AND fact_type_id = (SELECT id FROM fact_types WHERE slug = 'country-facts')))
ON CONFLICT DO NOTHING;
