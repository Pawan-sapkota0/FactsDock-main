# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/843ef601-3009-48cb-a2d9-c86affc7aa1e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/843ef601-3009-48cb-a2d9-c86affc7aa1e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/843ef601-3009-48cb-a2d9-c86affc7aa1e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Local environment variables

This project requires a few environment variables to work locally and for Supabase Functions.

- Copy `.env.example` to `.env` in the project root to configure client-side variables used by Vite.
- Required client vars (in `.env`):

  - VITE_SUPABASE_URL - your Supabase project URL
  - VITE_SUPABASE_ANON_KEY - your Supabase anon/public key

- Server / Functions vars (configure these in Supabase dashboard functions settings):
  - LOVABLE_API_KEY - API key used by `generate-content` function (set in Supabase Function environment; do NOT put this in client-side `.env`).

Example:

1. Copy example: `cp .env.example .env` (or create `.env` manually on Windows)
2. Fill in values from your Supabase project and AI provider.

Note: never commit real API keys into source control. Keep server-side keys (LOVABLE_API_KEY) configured only in the server/functions environment.

## Cache invalidation and publish workflow

This project uses an event-based cache invalidation system so that when admins create, update, or approve facts/quizzes the public site updates automatically without a full redeploy.

- Admins generate content using server-side functions (Supabase Edge Functions) which persist generated items as drafts in the `facts` or `quizzes` tables.
- When an admin publishes or approves a draft, the admin UI calls the helper in `src/lib/api.ts` that clears local caches and dispatches a browser event named `wf:facts-updated`.
- Public pages listen for `wf:facts-updated` and will re-fetch the currently-selected category/subcategory (or country) automatically so newly-approved content appears immediately to visitors.

Key implementation notes:

- The cache helpers live in `src/lib/api.ts`. They expose `clearFactsCacheAll()` and `clearFactsCacheForKey(key)` which both dispatch the `wf:facts-updated` CustomEvent after clearing in-memory/localStorage caches.
- Public listing pages (examples: `src/pages/FunFacts.tsx`, `src/pages/WorldFacts.tsx`, `src/pages/CategoryView.tsx`, `src/pages/CountryCategoryPage.tsx`) attach an event listener for `wf:facts-updated`. When fired they re-query the currently-selected view (category/subcategory or country) so the UI refreshes without a full reload.
- The public frontend intentionally does NOT call AI generation endpoints — it only reads approved/published content from the database. Admins are the only ones allowed to invoke server-side AI functions which run with server-side secrets and can persist draft records.

Small code example (public page listener):

```ts
useEffect(() => {
  const handler = async () => {
    if (selectedCategory && selectedSub) {
      await handleSubClick(selectedCategory, selectedSub);
      return;
    }
    if (selectedCategory) {
      await handleMainFetch(selectedCategory);
      return;
    }
    // fallback: clear caches/state
    clearFactsCacheAll();
    setFacts([]);
  };
  window.addEventListener("wf:facts-updated", handler as EventListener);
  return () =>
    window.removeEventListener("wf:facts-updated", handler as EventListener);
}, [selectedCategory, selectedSub]);
```

If you prefer a different UX (for example automatically opening the category panel or showing a temporary toast when new content appears), update the event handlers in the pages above — they are intentionally small and easy to extend.
