# Copilot Instructions for FactsDock Project

## Project Overview

FactsDock is a Vite + React + TypeScript web application delivering educational content about countries, facts, and quizzes. It features an admin dashboard for content management with AI-powered generation via Supabase Edge Functions and Gemini API.

## Architecture

### Core Tech Stack

- **Frontend**: Vite + React + TypeScript + shadcn-ui + Tailwind CSS
- **State Management**: TanStack React Query (data fetching + caching)
- **Backend**: Supabase (PostgreSQL + Edge Functions as serverless)
- **AI**: Google Generative AI (Gemini API, server-only)
- **Notifications**: Sonner (toasts) + Radix-ui (dialogs)

### Key Data Flows

1. **Public Content Display** → `src/lib/api.ts` (caching + localStorage) → Supabase client queries
2. **Admin Operations** → Edge Functions in `supabase/functions/` → Database via Supabase RLS policies
3. **Cache Invalidation** → Browser event `wf:facts-updated` dispatched on admin actions → triggers React Query refetch

### Directory Structure

- `src/pages/` - Route pages (public + admin)
- `src/components/` - Reusable UI (cards, modals, forms)
- `src/lib/` - Utilities: `api.ts` (Supabase + caching), `countries.ts` (195-country data)
- `supabase/functions/` - Deno-based serverless functions (e.g., `bulk-generate-facts`, `generate-content`)
- `supabase/migrations/` - Database schema and RLS policies

## Critical Conventions & Patterns

### Cache Management

- **Where**: `src/lib/api.ts` defines `setLocalCache()`, `getLocalCache()`, cache keys prefixed `wf:`
- **Example**: Facts cached with TTL: `setLocalCache('facts', countryName, data, 3600)`
- **Invalidation**: After admin edits, dispatch `new Event('wf:facts-updated')` to window, listeners refetch via React Query

### React Query Integration

- Initialized globally in `src/App.tsx` as `const queryClient = new QueryClient()`
- Used in admin pages via `useQueryClient()` to manually invalidate caches
- Mutation side effects: call `qc.invalidateQueries()` or dispatch `wf:facts-updated` event

### Admin Workflow Patterns

- **Bulk operations**: Modal-based (e.g., `BulkCountryFactsModal.tsx`) with 3 steps: Config → Preview → Save
- **Content generation**: All calls to `supabase.functions.invoke()` in `src/lib/api.ts` or component handlers
- **RLS Security**: Database operations check `admins` table; all inserts/updates require authentication

### Error & Mock Handling

- **Fallback**: If Supabase unavailable, `api.ts` returns mock data (deterministic, cache-compatible)
- **Toasts**: Use `const { toast } = useToast()` from `@/hooks/use-toast`; never `console.error` for user-facing errors

### Admin Page Structure

- `src/pages/admin/AdminLayout.tsx` - Layout wrapper
- `src/pages/admin/AdminGuard.tsx` - Auth guard (checks session)
- Child pages: `FactsAdmin.tsx`, `QuizzesAdmin.tsx`, `CategoriesAdmin.tsx`
- Modals for creation/bulk ops live in `src/components/admin/`

## Developer Workflows

### Running the App

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build
npm run test         # Run vitest
npm run lint         # ESLint check
```

### Environment Setup

Copy `.env.example` to `.env` with:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public key

Server-only secrets (in Supabase dashboard):

- `GEMINI_API_KEY` - Google Generative AI key
- `GEMINI_MODEL` - Optional, defaults to `gemini-2.5-flash`

### Testing

- Location: `src/__tests__/` + `src/test-utils/`
- Framework: Vitest (ESM-compatible)
- Example: `quiz.spec.ts` tests quiz validation helpers

### Bulk Operations Pattern

When adding bulk features (e.g., bulk generate facts for all 195 countries):

1. **Backend**: Create Edge Function in `supabase/functions/bulk-*/` (loops countries sequentially, checks duplicates)
2. **Frontend**: Build modal component with Config → Preview → Save steps
3. **Integration**: Add button to admin page, import modal, use `useQueryClient()` to clear caches post-save
4. **Documentation**: Update `IMPLEMENTATION_SUMMARY.md` with architecture diagram

## Integration Points & Important Files

| File/Pattern                                     | Purpose                                  | Notes                                                             |
| ------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------- |
| `src/lib/api.ts`                                 | All API calls, caching logic             | 924 lines; handles Supabase + mocks                               |
| `src/lib/countries.ts`                           | 195-country data + duplicate detection   | `COUNTRIES_A_TO_Z`, `removeDuplicateFacts()`                      |
| `supabase/functions/bulk-generate-facts/`        | Bulk fact generation backend             | Loops countries, calls Gemini, returns organized results          |
| `src/components/admin/BulkCountryFactsModal.tsx` | Bulk UI workflow                         | 421 lines; 3-step modal pattern                                   |
| `src/App.tsx`                                    | Route definitions + React Query provider | Central routing hub                                               |
| Browser event `wf:facts-updated`                 | Cache invalidation signal                | Dispatched by admin modals, listened by pages like `FunFacts.tsx` |

## Common Gotchas

1. **Cache key mismatches**: Ensure `cacheKey(prefix, key)` calls match between set/get (formatted as `wf:PREFIX:KEY`)
2. **RLS violations**: Check `supabase/migrations/002_rls_policies.sql` for constraints; admin queries need valid session
3. **Mock data**: When Supabase unavailable, `api.ts` generates mock facts/quizzes; ensure UI handles pagination
4. **Bulk loops**: 195 countries × fact generation = slow; Edge Functions handle sequentially with rate limiting
5. **Component imports**: Use path alias `@/` (maps to `src/`) throughout codebase
