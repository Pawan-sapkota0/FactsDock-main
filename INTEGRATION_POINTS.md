# 🎯 Feature Entry Points & Integration Points

## User Interface Entry Point

### Location: Admin Facts Page

```
URL: /admin/facts
Button: "🌍 Bulk Generate Country Facts"
Component: BulkCountryFactsModal
```

### Component Hierarchy

```
FactsAdmin (page)
├── State: bulkModalOpen, factTypes, categories
├── useEffect: Load fact types and categories
├── Render: "🌍 Bulk Generate" button
└── Render: BulkCountryFactsModal
    ├── Step 1: Config (category, facts count)
    ├── Step 2: Preview (facts by country)
    └── Step 3: Saving (progress indicator)
```

---

## Backend API Entry Point

### Endpoint

```
POST /functions/v1/bulk-generate-facts
Authentication: Bearer JWT Token
```

### URL

```
https://{PROJECT}.supabase.co/functions/v1/bulk-generate-facts
```

### Integration Point in Code

```typescript
// src/components/admin/BulkCountryFactsModal.tsx
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-generate-facts`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  }
);
```

---

## Database Integration Points

### Tables Involved

```
1. facts             - Facts insertion (main table)
2. categories        - Category selection/validation
3. fact_types        - Fact type validation
4. subcategories     - Optional subcategory reference
```

### Insert Point

```typescript
// Backend: supabase/functions/bulk-generate-facts/index.ts
const { error } = await supabase.from("facts").insert(batch);
```

### Query Points

```typescript
// Check for duplicates
SELECT fact_text FROM facts
WHERE country = ?
  AND category_id = ?
  AND subcategory_id = ?

// Load categories
SELECT * FROM categories
WHERE type = 'country'
```

---

## Data Flow Integration Points

### Input Flow

```
Admin UI Form
  ↓
BulkCountryFactsModal.tsx (state management)
  ↓
handleGenerate() function
  ↓
POST /bulk-generate-facts
  ↓
Backend validation
```

### Processing Flow

```
Backend receives request
  ↓
Loop through COUNTRIES_A_TO_Z
  ↓
For each country:
  - Check existing facts (duplicate prevention)
  - Call Gemini API
  - Parse response
  - Filter duplicates
  - Add to results
  - Wait 500ms (rate limiting)
  ↓
Return all results
```

### Output Flow

```
bulkResults array
  ↓
Frontend receives response
  ↓
BulkCountryFactsModal preview step
  ↓
Admin selects countries
  ↓
handleSaveBulk() function
  ↓
Batch POST facts
  ↓
Database inserts
  ↓
Cache invalidation
  ↓
Success notification
```

---

## Component Integration Points

### FactsAdmin.tsx Integration

```typescript
// Imports
import { BulkCountryFactsModal } from "@/components/admin/BulkCountryFactsModal";

// State
const [bulkModalOpen, setBulkModalOpen] = useState(false);
const [factTypes, setFactTypes] = useState<any[]>([]);
const [categories, setCategories] = useState<any[]>([]);

// Effect
useEffect(() => {
  // Load fact types and categories
}, []);

// Render
<Button onClick={() => setBulkModalOpen(true)}>
  🌍 Bulk Generate Country Facts
</Button>

<BulkCountryFactsModal
  open={bulkModalOpen}
  onOpenChange={setBulkModalOpen}
  factTypes={factTypes}
  categories={categories}
/>
```

### BulkCountryFactsModal.tsx Integration

```typescript
// Receives Props
interface BulkCountryFactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factTypes: any[];
  categories: any[];
}

// Uses Supabase
import { supabase } from "@/integrations/supabase/client";

// Calls API
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-generate-facts`, ...)

// Inserts to Database
await supabase.from("facts").insert(batch)

// Invalidates Cache
qc.invalidateQueries({ queryKey: ["admin", "facts"] })
```

---

## Utility Integration Points

### countries.ts Usage

```typescript
// In bulk-generate-facts backend function
import { COUNTRIES_A_TO_Z } from "...";

// Or if accessed from frontend
import {
  COUNTRIES_A_TO_Z,
  areDuplicateFacts,
  removeDuplicateFacts
} from "@/lib/countries";

// Use country list
for (const country of COUNTRIES_A_TO_Z) { ... }

// Check for duplicates
if (areDuplicateFacts(fact1, fact2)) { ... }

// Remove duplicates
const unique = removeDuplicateFacts(facts);
```

---

## Environment Variable Integration Points

### Backend Access (Deno)

```typescript
// supabase/functions/bulk-generate-facts/index.ts
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const supaUrl = Deno.env.get("SUPABASE_URL");
const svcRole = Deno.env.get("SUPABASE_SERVICE_ROLE");
```

### Frontend Access (Vite)

```typescript
// src/components/admin/BulkCountryFactsModal.tsx
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

---

## External Service Integration Points

### Google Gemini AI API

```typescript
// Backend function calls Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
const response = await model.generateContent(prompt);
```

### Supabase Authentication

```typescript
// Frontend gets JWT token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Included in API calls
'Authorization': `Bearer ${token}`
```

### Supabase Database

```typescript
// Backend operations
await fetch(`${supaUrl}/rest/v1/facts`, {
  method: "POST",
  headers: {
    apikey: svcKey,
    Authorization: `Bearer ${svcKey}`,
  },
  body: JSON.stringify(facts),
});

// Frontend operations
await supabase.from("facts").insert(batch);
```

---

## Caching Integration Points

### Query Client Invalidation

```typescript
// src/components/admin/BulkCountryFactsModal.tsx
import { useQueryClient } from "@tanstack/react-query";

const qc = useQueryClient();

// After successful save
qc.invalidateQueries({ queryKey: ["admin", "facts"], exact: false });
```

---

## State Management Integration

### Frontend State Flow

```
BulkCountryFactsModal State
├── step: 'config' | 'preview' | 'saving'
├── selectedCategoryId: string
├── selectedCategory: string
├── factsPerCountry: number
├── bulkResults: CountryFactsResult[]
├── isGenerating: boolean
├── isSaving: boolean
└── adminUserId: string

User Interactions
├── handleGenerate() → isGenerating = true
├── API Response → bulkResults = data
├── Preview Step → User selections
├── handleSaveBulk() → isSaving = true
└── Completion → Modal closes
```

---

## Error Handling Integration Points

### API Error Handling

```typescript
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || `Server error: ${response.status}`);
}
```

### Toast Notifications

```typescript
import { useToast } from "@/hooks/use-toast";
const { toast } = useToast();

toast({
  title: "Error",
  description: error.message,
  variant: "destructive",
});
```

### Database Error Handling

```typescript
const { error } = await supabase.from("facts").insert(batch);
if (error) throw error;
```

---

## Type Definition Integration Points

### Request Type

```typescript
{
  type: 'country_facts';
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
```

### Response Type

```typescript
{
  success: boolean;
  bulkResults: {
    country: string;
    factCount: number;
    facts: {
      text: string;
      source: string;
      metadata?: any;
    }[];
    error?: string;
  }[];
  totalFacts: number;
  totalCountries: number;
  processedCountries: number;
}
```

---

## File Access Integration Points

### Component File Structure

```
src/
├── components/admin/
│   ├── BulkCountryFactsModal.tsx       ← Frontend Modal
│   └── AIGeneratorModal.tsx            (unchanged)
├── lib/
│   ├── countries.ts                    ← Utilities
│   └── api.ts                          (unchanged)
└── pages/admin/
    └── FactsAdmin.tsx                  ← Integration Point

supabase/functions/
├── bulk-generate-facts/
│   ├── index.ts                        ← Backend Function
│   └── deno.json
└── generate-facts/                     (unchanged)
```

---

## Testing Integration Points

### Unit Tests

```typescript
// Test: countries.ts utilities
- areDuplicateFacts()
- removeDuplicateFacts()
- COUNTRIES_A_TO_Z array
```

### Component Tests

```typescript
// Test: BulkCountryFactsModal
- Renders correctly
- State changes on input
- API calls on generate
- Preview display
- Save functionality
```

### Integration Tests

```typescript
// Test: Full workflow
- Admin clicks button
- Modal opens
- Selects category
- Generates facts
- Previews results
- Saves to database
- Facts appear in list
```

### API Tests

```bash
# Test: Backend endpoint
POST /bulk-generate-facts
- Valid request → 200 OK
- Invalid request → 400 Bad Request
- Unauthorized → 401 Unauthorized
- Server error → 500 Internal Server Error
```

---

## Monitoring Integration Points

### Error Logs

```
Backend: supabase functions logs bulk-generate-facts
Frontend: Browser console (F12)
Database: Supabase dashboard
```

### Performance Metrics

```
- Generation time per country
- Total generation time
- Database insertion time
- API response time
- Error rate
```

### Usage Metrics

```
- Admin usage frequency
- Facts generated per day
- Success rate
- Error rate
- Average generation time
```

---

## Summary

**Total Integration Points**: 50+
**Complexity Level**: Moderate
**Dependencies**: Supabase, Gemini AI, React Query
**Critical Paths**: API, Database, Frontend State

All integration points are documented and accessible for maintenance and debugging.
