-- Add contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Optional: grant select to authenticated users (adjust to your RLS policies)
-- GRANT SELECT ON contact_messages TO authenticated;
