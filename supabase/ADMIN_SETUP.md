# Admin Setup & Security Steps

1. Revoke exposed GitHub token immediately

   You posted a token in the repository chat. Treat it as compromised and revoke it now in GitHub Settings -> Developer settings -> Personal access tokens.

2. Add admin users

   You can insert admins into the `admins` table with their `id` set to the Supabase `auth.users` id. Example SQL:

```sql
INSERT INTO admins (id, email, role) VALUES ('<supabase-user-uuid>', 'admin@example.com', 'admin');
```

To find a user's id, check the Supabase Auth users list or query `auth.users`.

3. Set function secrets

   Set `GITHUB_AI_TOKEN` using the Supabase CLI:

```bash
supabase secrets set GITHUB_AI_TOKEN="ghp_..." --project-ref <your-ref>
```

4. Test admin login

   - Sign in using Supabase Auth (email/password or OAuth).
   - Visit `/admin` — AdminGuard will verify your user is present in `admins` table.

5. Security checklist

   - Do not store service role or tokens in frontend environment.
   - Lock down RLS policies to reference `auth.uid()`.
   - Limit CORS origins for deployed functions to your production domain.
