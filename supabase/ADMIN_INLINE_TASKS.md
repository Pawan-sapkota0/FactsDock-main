Admin quick tasks

1. Insert an admin via SQL (replace <supabase-user-uuid> with user's id):

```
INSERT INTO admins (id, email, role) VALUES ('<supabase-user-uuid>', 'admin@example.com', 'admin');
```

2. Revoke GitHub token immediately if not already done.

3. Set function secrets:

```
supabase secrets set GITHUB_AI_TOKEN="<token>" --project-ref <ref>
supabase secrets set SUPABASE_SERVICE_ROLE="<service-role>" --project-ref <ref>
supabase secrets set SUPABASE_URL="https://your-project.supabase.co" --project-ref <ref>
```

4. Deploy functions:

```
supabase functions deploy generate-facts --project-ref <ref>
supabase functions deploy generate-quiz --project-ref <ref>
```
