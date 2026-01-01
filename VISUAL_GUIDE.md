# Visual Guide: Bulk Country Facts Implementation

## User Interface Flow

```
┌─────────────────────────────────────────────────────┐
│              ADMIN FACTS PAGE                       │
│  ┌─────────────────────────────────────────────────┐│
│  │ "Facts"                                [🔍] [New] [🌍 Bulk] │
│  └─────────────────────────────────────────────────┘│
│  │                                                  │
│  │  [Existing facts list...]                       │
│  │  • Fact 1 [Edit] [Approve] [Delete]             │
│  │  • Fact 2 [Edit] [Approve] [Delete]             │
│  │  • Fact 3 [Edit] [Approve] [Delete]             │
│  │                                                  │
│  │  [Prev] [Next]                                  │
│  │                                                  │
└─────────────────────────────────────────────────────┘
         ↓ (click "🌍 Bulk" button)
         │
┌─────────────────────────────────────────────────────┐
│   STEP 1: CONFIG - Generate Country Facts (Bulk)   │
│  ┌─────────────────────────────────────────────────┐│
│  │ Generate facts for all countries A-Z in one op │
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  Category *                                          │
│  [Select a category ▼]                              │
│    ├─ Geography                                     │
│    ├─ History                                       │
│    ├─ Culture                                       │
│    └─ Economics                                     │
│                                                      │
│  Facts Per Country                                  │
│  [5    ]  (input)                                   │
│  1-20 per country                                   │
│                                                      │
│  ℹ️ This will generate ~975 facts total across     │
│     195 countries. Generation will take a few min.  │
│                                                      │
│  [Cancel]  [Start Generation]                       │
│                                                      │
└─────────────────────────────────────────────────────┘
         ↓ (click "Start Generation")
         │
    [6-10 minutes of processing...]
         │
┌─────────────────────────────────────────────────────┐
│ STEP 2: PREVIEW - (195 countries selected)         │
│         975 facts ready to save                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ [Select All] [Deselect All]                    ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  ☑ Afghanistan                                   ✓   │
│    5 facts                                          │
│    • Afghanistan is the 36th largest...             │
│    • The country is landlocked...                   │
│                                                      │
│  ☑ Albania                                       ✓   │
│    5 facts                                          │
│    • Albania is located in Southeast...             │
│    • The country borders Greece...                  │
│                                                      │
│  ☑ Algeria                                       ✓   │
│    5 facts                                          │
│    • Algeria is the largest country...             │
│    • The Sahara Desert covers most...              │
│                                                      │
│  [scroll down for more countries...]                │
│                                                      │
│  ☑ Zimbabwe                                      ✓   │
│    5 facts                                          │
│    • Zimbabwe is in southern Africa...             │
│    • Victoria Falls is one of the...               │
│                                                      │
│  [← Back to Settings]  [💾 Save Draft] [✅ Publish] │
│                                                      │
└─────────────────────────────────────────────────────┘
         ↓ (click "Publish")
         │
┌─────────────────────────────────────────────────────┐
│            STEP 3: SAVING...                        │
│                                                      │
│                 ⟳ (loading spinner)                 │
│                                                      │
│           Inserting 975 facts into DB...            │
│                                                      │
└─────────────────────────────────────────────────────┘
         ↓ (after insertion completes)
         │
    ✅ Toast: "Published: 975 facts published"
         │
    Modal closes, return to Facts page
```

## Data Flow Diagram

```
FRONTEND                           BACKEND                    DATABASE
─────────────────────────────────────────────────────────────────────────

Admin clicks
"🌍 Bulk Generate"
      │
      ├──► BulkCountryFactsModal
      │    (Config Step)
      │    - Select category
      │    - Set facts/country
      │
      └───► handleGenerate()
            │
            ├─► POST /bulk-generate-facts
            │
            │                    bulk-generate-facts
            │                    (Edge Function)
            │                    │
            │                    ├─► Load: COUNTRIES_A_TO_Z
            │                    │
            │                    ├─► FOR each country:
            │                    │   ├─► Check: existing facts ──→ SELECT
            │                    │   ├─► Call: Gemini API
            │                    │   ├─► Parse: JSON response
            │                    │   ├─► Filter: duplicates
            │                    │   ├─► Build: result object
            │                    │   └─► Wait: 500ms
            │                    │
            │                    └─► Return: bulkResults array
            │
      ◄─────┤
            │
      ├─► BulkCountryFactsModal
      │    (Preview Step)
      │    - Show all countries
      │    - Show all facts
      │    - Enable selection
      │
      ├─► toggleCountrySelection()
      │    (user selects/deselects)
      │
      └─► handleSaveBulk()
            │
            ├─► Collect selected facts
            │
            ├─► Filter by selection
            │
            ├─► Split into batches (100/batch)
            │
            └─► POST facts ──────────────────→ INSERT INTO facts
                (multiple times)             (batch inserts)

                                            ◄─── fact rows created

            ├─► Invalidate cache
            │
            └─► Show success toast

Modal closes, user sees new facts in list
```

## File Structure Visualization

```
world-facts/
│
├── src/
│   ├── components/
│   │   └── admin/
│   │       ├── AIGeneratorModal.tsx           (existing)
│   │       └── BulkCountryFactsModal.tsx      ✨ NEW
│   │
│   ├── lib/
│   │   ├── api.ts                            (existing)
│   │   ├── countries.ts                      ✨ NEW
│   │   └── ...others
│   │
│   └── pages/
│       └── admin/
│           └── FactsAdmin.tsx                (modified: +40 lines)
│
├── supabase/
│   └── functions/
│       ├── bulk-generate-facts/              ✨ NEW
│       │   ├── index.ts                      (~288 lines)
│       │   └── deno.json
│       │
│       ├── generate-facts/                   (existing)
│       │   ├── index.ts
│       │   └── deno.json
│       │
│       └── ...others
│
└── Documentation/
    ├── BULK_COUNTRY_FACTS_README.md          ✨ NEW
    ├── BULK_API_REFERENCE.md                 ✨ NEW
    ├── IMPLEMENTATION_SUMMARY.md             ✨ NEW
    └── IMPLEMENTATION.md                     ✨ NEW
```

## State Machine: BulkCountryFactsModal

```
                    ┌──────────────┐
                    │              │
                    ▼              │
              ┌─────────────┐      │
    onOpenChange(true) ──→ │ CONFIG  │      │
              │            │        │      │
              │            └─────────┘      │
              │              │ handleGenerate()
              │              ▼              │
              │            GENERATING...    │
              │              │              │
              │              ▼              │
              │            (backend processes)
              │              │              │
              │              ▼              │
              │              ✓ Response     │
              │              │              │
              │              ▼              │
              └─────────── │ PREVIEW │◄─────┘
                           │        │
                           └────────┘
                             │    │
         handleReject()◄──────┘    └──── handleSaveBulk()
               │                              │
               ▼                              ▼
            Back to CONFIG               SAVING...
                                             │
                                      (insertions)
                                             │
                                             ▼
                                        onOpenChange(false)
                                             │
                                        Modal closes
                                             │
                                        Return to FactsAdmin
```

## Duplicate Detection Process

```
NEW FACT from AI                  EXISTING FACTS in DB
    │                                    │
    ├─ "France is in Europe"             │
    │                                    ├─ "France is located in Europe"
    │                                    │
    ├─ Normalize:                        ├─ Normalize:
    │  "franceisineurope"                │  "franceislocatedineurope"
    │                                    │
    ├─ Compare:                          │
    │  - Exact match? NO                 │
    │  - Similarity > 80%? YES           │
    │                                    │
    └─ FILTERED OUT (DUPLICATE)          │
                                         │
Result: Only unique facts are inserted into DB
```

## Database Schema (Facts Table)

```
Facts Table
├── id (UUID) ─────────────────┬─ auto-generated
├── fact_type_id (UUID) ───────┼─ references fact_types
├── category_id (UUID) ────────┼─ references categories
├── subcategory_id (UUID) ─────┼─ references subcategories (optional)
├── country (text) ────────────┼─ "France", "Japan", etc.
├── fact_text (text) ──────────┼─ "France is in Europe..."
├── source (text) ─────────────┼─ "ai"
├── status (text) ─────────────┼─ "draft" or "approved"
├── created_by (UUID) ─────────┼─ admin user ID
├── metadata (JSONB) ──────────┼─ {raw: AI response}
└── created_at (timestamptz) ──┼─ auto-generated

Indexes for performance:
- (country, category_id, subcategory_id)
- (fact_type_id)
- (status)
- (created_at)
```

## Request/Response Cycle Timing

```
t=0s      Admin initiates bulk generation
t=0.5s    Request sent to backend
t=1s      Backend validates input
t=2s      First country (Afghanistan) - check DB + generate
t=3s      Second country (Albania) - check DB + generate
t=4.5s    Third country (Algeria) - check DB + generate
...
t=390s    Last country (Zimbabwe) - check DB + generate
t=391s    Backend returns all results
t=391.5s  Frontend receives response, shows preview
t=???     Admin reviews and clicks save
t=????    Batch insertion begins (100 facts at a time)
t=????    All facts inserted, cache invalidated
t=????    Success toast shown, modal closes

Total time: ~6-10 minutes (depending on API latency)
```

## Error Handling Flow

```
Backend generates fact for Country X
    │
    ├─ Success ✓
    │  └─ Add to results: {country, facts: [...], factCount: 5}
    │
    └─ Error ✗
       ├─ Log error
       ├─ Continue to next country
       └─ Add to results: {country, facts: [], factCount: 0, error: "..."}

Frontend receives results with mixed success/failure
    │
    ├─ Show all countries in preview
    ├─ Mark failed countries with ✗ icon
    ├─ Show error message in failed countries
    │
    └─ Admin can:
       ├─ Select all countries (including failed ones for retry)
       ├─ Deselect failed countries (skip)
       └─ Save only selected countries

Only selected countries' facts are inserted into DB
Failed countries can be retried in next batch
```

## Performance Profile

```
                    Timeline
                    ────────

Config input        [░]  0.1s

Backend processing  [██████████████████████████████] 6-10min
├─ Per country:     [░░] 1-2s
├─ Check DB:        [░] 0.2s
├─ Gemini call:     [░░] 1-1.5s
├─ Parse/filter:    [░] 0.1s
└─ Rate limit:      [░░░░░] 0.5s delay

Frontend preview    [░░] 0.5-1s

Admin review        [████████████] 1-5min (human time)

Database insert     [████████] 1-3min
├─ Batch 1 (100):   [░░] 1s
├─ Batch 2 (100):   [░░] 1s
├─ Batch 3 (100):   [░░] 1s
└─ ... (≤39 batches)

Cache invalidation  [░] 0.1s

Total end-to-end    [═══════════════════════] 8-20min
```

This gives admins complete visibility into the process and helps them plan bulk generation operations.
