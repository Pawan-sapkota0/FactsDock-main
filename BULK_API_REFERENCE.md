# Bulk Country Facts API Reference

## Endpoint

```
POST /functions/v1/bulk-generate-facts
```

## Authentication

Requires valid Supabase JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Request Body

```typescript
{
  // REQUIRED FIELDS
  type: 'country_facts',                  // Only 'country_facts' accepted
  category_id: string,                    // UUID of category (required)
  bulkMode: true,                         // Must be true
  factsPerCountry: number,                // 1-20 facts per country

  // OPTIONAL FIELDS
  category?: string,                      // Category name (display purposes)
  subcategory?: string,                   // Subcategory name
  subcategory_id?: string,                // Subcategory UUID
  factTypeId?: string,                    // Fact type UUID
  created_by?: string,                    // Admin user ID
  countries?: string[],                   // Custom countries array (default: A-Z, 195 countries)
}
```

## Response (Success)

```typescript
HTTP 200 OK
Content-Type: application/json

{
  success: true,
  bulkResults: [
    {
      country: "Afghanistan",
      factCount: 5,
      facts: [
        {
          text: "Afghanistan is the 36th largest country by area",
          source: "ai",
          metadata: { /* raw AI response */ }
        },
        {
          text: "The country is landlocked with no direct access to the sea",
          source: "ai",
          metadata: { /* raw AI response */ }
        },
        // ... more facts
      ],
      error: null
    },
    {
      country: "Albania",
      factCount: 5,
      facts: [
        {
          text: "Albania is located in Southeast Europe",
          source: "ai",
          metadata: { /* raw AI response */ }
        },
        // ...
      ],
      error: null
    },
    // ... 193 more countries
    {
      country: "Zimbabwe",
      factCount: 3,
      facts: [ /* ... */ ],
      error: null
    }
  ],
  totalFacts: 975,              // sum of all factCount
  totalCountries: 195,          // number of countries processed
  processedCountries: 195       // countries without errors
}
```

## Response (Error)

### Bad Request (400)

```json
{
  "error": "Bulk generation only supported for country_facts"
}
```

### Validation Error (400)

```json
{
  "error": "Category is required for bulk generation"
}
```

```json
{
  "error": "Facts per country must be between 1 and 20"
}
```

### Not Configured (500)

```json
{
  "error": "Server not configured (missing API key)"
}
```

### Server Error (500)

```json
{
  "error": "Server error"
}
```

## Error Handling

### Country-Level Errors

Some countries may have generation errors, but the request continues:

```json
{
  "country": "CountryName",
  "factCount": 0,
  "facts": [],
  "error": "Error message describing what went wrong"
}
```

The overall response is still HTTP 200, but individual countries report errors.

## CORS Headers

Response includes CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, Authorization
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Max-Age: 86400
```

## Rate Limiting

The function implements rate limiting through:

- **500ms delay** between each country (sequential processing)
- Estimated total execution time: **6-10 minutes** for full run
- Respects Gemini API rate limits (no parallel requests)

## Usage Examples

### Example 1: Basic Bulk Generation (5 facts per country)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/bulk-generate-facts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "country_facts",
    "category": "Geography",
    "category_id": "550e8400-e29b-41d4-a716-446655440000",
    "bulkMode": true,
    "factsPerCountry": 5,
    "created_by": "user-uuid-here"
  }'
```

### Example 2: With Subcategory

```bash
curl -X POST https://your-project.supabase.co/functions/v1/bulk-generate-facts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "country_facts",
    "category": "Geography",
    "category_id": "550e8400-e29b-41d4-a716-446655440000",
    "subcategory": "Mountains",
    "subcategory_id": "660e8400-e29b-41d4-a716-446655440000",
    "bulkMode": true,
    "factsPerCountry": 10,
    "factTypeId": "770e8400-e29b-41d4-a716-446655440000"
  }'
```

### Example 3: Custom Countries (Specific Subset)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/bulk-generate-facts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "country_facts",
    "category": "History",
    "category_id": "550e8400-e29b-41d4-a716-446655440000",
    "bulkMode": true,
    "factsPerCountry": 3,
    "countries": ["France", "Germany", "Italy", "Spain"]
  }'
```

## JavaScript/TypeScript Client Example

```typescript
interface BulkGenerateFactsRequest {
  type: "country_facts";
  category_id: string;
  category?: string;
  subcategory?: string;
  subcategory_id?: string;
  bulkMode: true;
  factsPerCountry: number;
  factTypeId?: string;
  created_by?: string;
  countries?: string[];
}

interface BulkGenerateFactsResponse {
  success: boolean;
  bulkResults: Array<{
    country: string;
    factCount: number;
    facts: Array<{
      text: string;
      source: string;
      metadata?: any;
    }>;
    error?: string;
  }>;
  totalFacts: number;
  totalCountries: number;
  processedCountries: number;
}

async function generateCountryFacts(
  request: BulkGenerateFactsRequest
): Promise<BulkGenerateFactsResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-generate-facts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Generation failed");
  }

  return await response.json();
}

// Usage
const results = await generateCountryFacts({
  type: "country_facts",
  category_id: "some-uuid",
  category: "Geography",
  bulkMode: true,
  factsPerCountry: 5,
});

console.log(
  `Generated ${results.totalFacts} facts across ${results.totalCountries} countries`
);
```

## Environment Variables (Backend)

The function requires these to be set in Supabase:

```env
GEMINI_API_KEY          # Google Generative AI API key
GEMINI_MODEL            # Model to use (default: gemini-2.5-flash)
SUPABASE_URL            # Supabase project URL
SUPABASE_SERVICE_ROLE   # Service role key (or SERVICE_ROLE/service_role)
```

## Constraints & Limits

| Parameter            | Min               | Max                  | Required             |
| -------------------- | ----------------- | -------------------- | -------------------- |
| factsPerCountry      | 1                 | 20                   | Yes                  |
| Total countries      | 1                 | 195                  | No (defaults to 195) |
| Total facts estimate | 195               | 3,900                | N/A                  |
| Category ID          | -                 | -                    | Yes                  |
| Execution time       | ~1m (4 countries) | ~10m (195 countries) | N/A                  |

## Response Structure Details

### bulkResults Array

- **Sorted by**: Country name (A-Z)
- **Length**: Matches number of countries processed
- **Contains**: One entry per country, success or failure

### Facts Array Per Country

- **text**: Generated fact (max 1000 chars)
- **source**: Always "ai"
- **metadata**: Full AI response object (for debugging)

## Processing Flow

```
1. Validate inputs
2. For each country:
   a. Check database for existing facts (duplicate prevention)
   b. Build Gemini prompt
   c. Call Gemini API
   d. Parse JSON response
   e. Filter duplicates
   f. Add to results
   g. Wait 500ms
3. Return all results
```

## Timeouts & Delays

- **Per country**: ~2 seconds (1s generation + 0.5s DB check + 0.5s delay)
- **All 195 countries**: ~6-10 minutes total
- **API timeout**: Standard Supabase edge function timeout

## Notes

- Function runs on Deno runtime
- Responses are streamed as generated
- Errors are non-fatal (partial results returned)
- All operations are logged server-side
- Database operations use service role authentication
- No user-level permissions required (admins only via Auth)
