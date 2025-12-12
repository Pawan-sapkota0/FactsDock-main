# Supabase Admin Backend Setup

This file documents steps to set up the Supabase backend for the Admin Dashboard and AI generation.

## Required environment variables

- For frontend (Vite, local):
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
- For serverless functions (Supabase Functions):
  - GEMINI_API_KEY (server-only secret used to call Google Gemini API)
  - GEMINI_MODEL (optional, e.g. `gemini-2.5-flash`)
- Optional server-only secret:
  - SUPABASE_SERVICE_ROLE (use only for privileged server logic; never exposed to browser)

## Deploy functions

1. Install `supabase` CLI and log in.
2. From project root run:
   - `supabase functions deploy generate-facts --project-ref <your-ref>`
   - `supabase functions deploy generate-quiz --project-ref <your-ref>`
3. Add secrets via:

- `supabase secrets set GEMINI_API_KEY="your_key" --project-ref <your-ref>`
- `supabase secrets set GEMINI_MODEL="gemini-2.5-flash" --project-ref <your-ref>`

## Database migrations

- The `supabase/migrations/001_init_schema.sql` file contains example table definitions for `categories`, `subcategories`, `facts`, `quizzes`, `admins`, and `user_stats`.
- Apply via Supabase SQL editor or migrations tool.

## Security

- Enable RLS on public tables and create policies that only allow admins (listed in `admins` table) to insert/update/delete facts and quizzes.
- Do not expose `SUPABASE_SERVICE_ROLE` to client.
- Restrict CORS on deployed functions to your production domain.

## Local development

- Create a `.env.local` with your Vite envs.
- Run `npm run dev` to start the frontend.
- Functions can be tested locally using the Supabase CLI (see supabase docs).

## Notes

- Functions now use Google Gemini via the official SDK. Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in your function secrets.
- Always validate AI responses before persisting to the DB.
