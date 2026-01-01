# Bulk Country Facts Generation Feature

## Overview

The bulk country facts generation feature allows admins to generate and publish facts for all 195 countries (A-Z) in a single operation. This maintains the existing single-country generation flow while adding powerful bulk capabilities specifically for `fact_type = 'country_facts'`.

## Architecture

### Components

#### 1. **Backend Edge Function** (`supabase/functions/bulk-generate-facts/index.ts`)

- **Purpose**: Handles server-side bulk generation via Google Gemini AI
- **Entry Point**: POST `/functions/v1/bulk-generate-facts`
- **Request Body**:

  ```typescript
  {
    type: 'country_facts',           // Must be 'country_facts'
    category: string,                // Category name (e.g., "Geography")
    category_id: string,             // Category UUID (required)
    subcategory?: string,            // Optional subcategory name
    subcategory_id?: string,         // Optional subcategory UUID
    bulkMode: true,                  // Must be true
    factsPerCountry: number,         // 1-20 facts per country
    factTypeId?: string,             // Fact type ID
    created_by?: string,             // Admin user ID
    countries?: string[]             // Optional: specific countries (defaults to A-Z)
  }
  ```

- **Response**:

  ```typescript
  {
    success: true,
    bulkResults: Array<{
      country: string,
      facts: Array<{
        text: string,
        source: string,
        metadata?: any
      }>,
      factCount: number,
      error?: string
    }>,
    totalFacts: number,
    totalCountries: number,
    processedCountries: number
  }
  ```

- **Key Features**:
  - Sequential processing (not parallel) to avoid rate limiting
  - 500ms delay between countries for rate limiting protection
  - Duplicate detection checking against existing database facts
  - Error resilience: continues processing even if one country fails
  - Hardcoded country list (A-Z, 195 countries)

#### 2. **Frontend Modal Component** (`src/components/admin/BulkCountryFactsModal.tsx`)

- **Purpose**: Admin UI for bulk generation workflow
- **Flow**:

  1. **Config Step**: Admin selects category, facts per country
  2. **Preview Step**: Shows results organized by country with selection checkboxes
  3. **Saving Step**: Displays progress while inserting facts

- **Features**:
  - Category selection (required)
  - Facts per country setting (1-20)
  - Preview all generated facts by country
  - Select/deselect countries before saving
  - Batch insertion with error handling
  - Saves as draft or publishes directly

#### 3. **Utilities** (`src/lib/countries.ts`)

- `COUNTRIES_A_TO_Z`: Hardcoded array of 195 countries
- `areDuplicateFacts()`: Similarity detection for duplicate prevention
- `removeDuplicateFacts()`: Filter duplicate facts from arrays

#### 4. **Integration** (`src/pages/admin/FactsAdmin.tsx`)

- Added "🌍 Bulk Generate Country Facts" button
- Loads fact types and country categories on mount
- Opens BulkCountryFactsModal when clicked

## How It Works

### Generation Flow

```
Admin clicks "Bulk Generate Country Facts"
     ↓
Configure: Select category + facts/country count
     ↓
Backend loops through 195 countries sequentially:
  - For each country:
    - Check for existing facts (duplicate prevention)
    - Generate N facts via Gemini AI
    - Parse and validate JSON response
    - Filter duplicates from generated set
    - Add to results (with error handling)
    - Wait 500ms (rate limiting)
     ↓
Display preview with all generated facts organized by country
     ↓
Admin reviews and selects countries to keep
     ↓
Backend inserts selected facts in batches:
  - Each fact gets: country, category, subcategory, content, status
  - Status: 'draft' or 'approved' (based on admin choice)
  - Source: 'ai'
  - created_by: admin user ID
     ↓
Cache invalidation + Success notification
```

### Scope & Safety

✅ **Only affects**: `fact_type = 'country_facts'`
❌ **Does not affect**:

- World Facts generation
- Fun Facts generation
- Single-country generation (existing flow unchanged)
- Quiz generation
- UI layout

### Database Storage

Facts are inserted into the `facts` table with:

- `fact_type_id`: Country facts type UUID
- `category_id`: Selected category UUID
- `subcategory_id`: Optional subcategory UUID
- `country`: Country name (e.g., "France")
- `fact_text`: Generated fact content (max 1000 chars)
- `source`: 'ai'
- `status`: 'draft' or 'approved'
- `created_by`: Admin user UUID
- `metadata`: Additional JSON data
- `created_at`: Timestamp

### Performance & Rate Limiting

- **Sequential processing**: One country at a time (500ms delay between)
- **Estimated duration**: ~195 countries × 2 sec per country ≈ 6-8 minutes
- **Batch insertion**: Facts inserted in batches of 100
- **Duplicate prevention**: Checks DB before generating + filters duplicates in results
- **Error resilience**: Continues if one country fails, reports errors in preview

## Configuration

### Environment Variables Required

```env
GEMINI_API_KEY        # Google Generative AI API key
GEMINI_MODEL          # Model name (default: gemini-2.5-flash)
SUPABASE_URL          # Supabase project URL
SUPABASE_SERVICE_ROLE # Service role key for backend operations
```

### Constraints

| Setting               | Min      | Max  | Default |
| --------------------- | -------- | ---- | ------- |
| Facts per Country     | 1        | 20   | 5       |
| Total Countries       | Fixed at | 195  | -       |
| Estimated Total Facts | 195      | 3900 | 975     |

## Usage Example

### Via Admin UI

1. Navigate to "Facts" admin page
2. Click "🌍 Bulk Generate Country Facts" button
3. Select a category (e.g., "Geography")
4. Set facts per country (e.g., 5)
5. Click "Start Generation"
6. Wait for generation to complete
7. Review facts in preview (organized by country)
8. Select/deselect countries as needed
9. Click "Save as Draft" or "Publish"

### Via API (Direct)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/bulk-generate-facts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "country_facts",
    "category": "Geography",
    "category_id": "some-uuid",
    "bulkMode": true,
    "factsPerCountry": 5,
    "factTypeId": "country-facts-uuid"
  }'
```

## Testing Checklist

- [ ] Backend function deployed to Supabase
- [ ] Edge function can access Gemini API and Supabase
- [ ] Modal appears in Facts admin page
- [ ] Category selection works
- [ ] Facts per country validation (1-20)
- [ ] Generation produces results for all countries
- [ ] Preview shows organized facts by country
- [ ] Selection checkboxes work (select/deselect all)
- [ ] Facts save to database with correct fields
- [ ] Facts show with status 'draft' or 'approved'
- [ ] No errors in browser console
- [ ] Existing flows (World Facts, Fun Facts, single country) unchanged
- [ ] Quiz generation unaffected
- [ ] Cache invalidation works

## Troubleshooting

### Generation takes too long

- Check Gemini API quota and rate limits
- Reduce `factsPerCountry` value
- Check network latency

### Facts not appearing in database

- Verify `category_id` matches valid category
- Check database RLS policies
- Verify service role key is configured
- Check browser console for API errors

### Duplicate facts appearing

- Duplicate detection runs on generation
- May need to review generated facts before saving
- Use select/deselect to skip problematic countries

### Modal doesn't appear

- Ensure `categories` loaded successfully (fact_type = 'country')
- Check for console errors
- Verify fact types loaded from database

## File Structure

```
src/
├── components/admin/
│   ├── BulkCountryFactsModal.tsx        [NEW]
│   └── AIGeneratorModal.tsx              [unchanged]
├── lib/
│   ├── countries.ts                      [NEW]
│   └── api.ts                            [unchanged]
└── pages/admin/
    └── FactsAdmin.tsx                    [MODIFIED: added bulk button + modal]

supabase/functions/
├── bulk-generate-facts/                  [NEW]
│   ├── index.ts
│   └── deno.json
└── generate-facts/                       [unchanged]
```

## Future Enhancements

- Support filtering by region/continent
- Progress tracking during generation
- Webhook notifications on completion
- Scheduled bulk generation jobs
- Custom country lists
- Fact quality scoring
- Batch editing of generated facts

## Notes

- The countries list is hardcoded in the backend for consistency
- Bulk generation is intentionally sequential to protect against rate limits
- Preview mode ensures admin review before database writes
- No UI layout changes - button added to existing controls
- Existing single-country flow remains completely unchanged
