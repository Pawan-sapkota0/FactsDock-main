# Server (email + contact endpoint)

This small Express server provides a contact API used by the frontend.

Required packages (install in project root):

```bash
npm install resend @supabase/supabase-js express cors dotenv
```

Environment (copy `server/.env` and fill values):

- RESEND_API_KEY - your Resend API key (server-side only)
- ADMIN_EMAIL - email address that receives contact notifications
- SUPABASE_URL - your Supabase URL
- SUPABASE_SERVICE_KEY - Supabase service role key for server-side inserts
- PORT - optional server port (default 5000)

Start server (from project root):

```bash
node server/server.js
```

Notes:

- The endpoint `/api/contact` will insert the message into `contact_messages` table and notify the admin via Resend.
- Do not expose `RESEND_API_KEY` or `SUPABASE_SERVICE_KEY` to the frontend.
