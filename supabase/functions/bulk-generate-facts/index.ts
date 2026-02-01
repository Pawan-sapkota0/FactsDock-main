import "../deno.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ========== UNIQUENESS CHECKING UTILITIES ==========
function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function hashContent(text: string): string {
  const normalized = normalizeForComparison(text);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length, bLen = b.length;
  const dp: number[][] = Array.from({ length: aLen + 1 }, () => Array(bLen + 1).fill(0));
  for (let i = 0; i <= aLen; i++) dp[i][0] = i;
  for (let j = 0; j <= bLen; j++) dp[0][j] = j;
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[aLen][bLen];
}

function calculateSimilarity(a: string, b: string): number {
  const normalized1 = normalizeForComparison(a);
  const normalized2 = normalizeForComparison(b);
  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - (distance / maxLen);
}

async function checkBulkFactUniqueness(
  factText: string,
  supaUrl: string,
  svcKey: string,
  filters: Record<string, unknown>
): Promise<{ isUnique: boolean; duplicateCount: number; potentialMatches: unknown[]; hash: string }> {
  try {
    const headers = {
      'apikey': svcKey,
      'Authorization': `Bearer ${svcKey}`,
      'Content-Type': 'application/json'
    };
    
    let url = `${supaUrl}/rest/v1/facts?select=fact_text`;
    if (filters.factTypeId) url += `&fact_type_id=eq.${filters.factTypeId}`;
    if (filters.country) url += `&country=eq.${encodeURIComponent(filters.country as string)}`;
    if (filters.categoryId) url += `&category_id=eq.${filters.categoryId}`;
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn('[checkBulkFactUniqueness] Failed to fetch existing facts');
      return { isUnique: true, duplicateCount: 0, potentialMatches: [], hash: hashContent(factText) };
    }

    const existingFacts = (await res.json()) as unknown[];
    const potentialMatches: unknown[] = [];
    
    for (const fact of existingFacts) {
      const existingText = (fact as Record<string, unknown>)?.fact_text as string;
      if (!existingText) continue;
      
      const similarity = calculateSimilarity(factText, existingText);
      if (similarity > 0.8) {
        potentialMatches.push({ similarity, text: existingText });
      }
    }

    return {
      isUnique: potentialMatches.length === 0,
      duplicateCount: potentialMatches.length,
      potentialMatches,
      hash: hashContent(factText)
    };
  } catch (e) {
    console.error('[checkBulkFactUniqueness] Error:', e);
    return { isUnique: true, duplicateCount: 0, potentialMatches: [], hash: hashContent(factText) };
  }
}
// ========== END UNIQUENESS CHECKING ==========

// Get CORS headers with origin validation
const getCorsHeaders = (origin?: string) => {
  const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://factsdock.com',
    'https://www.factsdock.com',
  ];
  
  return {
    'Access-Control-Allow-Origin': (origin && ALLOWED_ORIGINS.includes(origin)) ? origin : 'https://factsdock.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

// Hardcoded countries list A-Z
const COUNTRIES_A_TO_Z = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

// Delay helper for rate limiting
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Extract JSON from AI response
const stripCodeFences = (s: string) =>
  s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

const extractJsonLike = (s: string) => {
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
  const arrayMatch = s.match(/\[([\s\S]*?)\]/m);
  if (arrayMatch) return "[" + arrayMatch[1] + "]";
  const objMatch = s.match(/\{([\s\S]*?)\}/m);
  if (objMatch) return "{" + objMatch[1] + "}";
  return s;
};

// Check for duplicate facts in DB
const checkExistingFacts = async (
  supaUrl: string,
  svcKey: string,
  country: string,
  category_id: string | null,
  subcategory_id: string | null
): Promise<string[]> => {
  try {
    const resp = await fetch(
      `${supaUrl}/rest/v1/facts?country=eq.${encodeURIComponent(country)}&category_id=eq.${category_id}&subcategory_id=eq.${subcategory_id}&select=fact_text`,
      {
        method: "GET",
        headers: {
          apikey: svcKey,
          Authorization: `Bearer ${svcKey}`,
        },
      }
    );

    if (!resp.ok) return [];
    const existing = await resp.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- HTTP/DB response boundary
    return existing.map((f: any) => f.fact_text?.toLowerCase().trim() || "");
  } catch (e) {
    console.warn("Error checking existing facts:", e);
    return [];
  }
};

// Normalize fact for comparison
const normalizeFact = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .substring(0, 100);
};

// Main handler
serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin ?? undefined);
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const {
      type = "country_facts",
      category,
      category_id,
      subcategory,
      subcategory_id,
      bulkMode = false,
      factsPerCountry = 5,
      countries = null,
      factTypeId = null,
      checkUniqueness = false,
    } = body;

    // Only allow bulk mode for country_facts
    if (type !== "country_facts" || !bulkMode) {
      return new Response(
        JSON.stringify({
          error: "Bulk generation only supported for country_facts",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate required fields
    if (!category && !category_id) {
      return new Response(
        JSON.stringify({ error: "Category is required for bulk generation" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (factsPerCountry < 1 || factsPerCountry > 20) {
      return new Response(
        JSON.stringify({
          error: "Facts per country must be between 1 and 20",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get API credentials
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const GEMINI_MODEL =
      Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-lite";
    const svcRole =
      Deno.env.get("SUPABASE_SERVICE_ROLE") ||
      Deno.env.get("service_role") ||
      Deno.env.get("SERVICE_ROLE");
    const supaUrl = Deno.env.get("SUPABASE_URL");

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server not configured (missing API key)" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine which countries to process
    const countriesToProcess = countries && Array.isArray(countries) && countries.length > 0 
      ? countries 
      : COUNTRIES_A_TO_Z;
    
    console.log(`[bulk-generate-facts] Processing ${countriesToProcess.length} countries`);

    // Create a ReadableStream to stream results immediately
    const stream = new ReadableStream({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ReadableStream controller runtime type
    async start(controller: any) {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const encoder = new TextEncoder();

        for (let i = 0; i < countriesToProcess.length; i++) {
          const country = countriesToProcess[i];
          console.log(`[bulk-generate-facts] Processing country ${i + 1}/${countriesToProcess.length}: ${country}`);

      try {
        // Check for existing facts to avoid duplicates
        const existingTexts: string[] = [];
        if (svcRole && supaUrl) {
          const existing = await checkExistingFacts(
            supaUrl,
            svcRole,
            country,
            category_id || null,
            subcategory_id || null
          );
          existingTexts.push(
            ...existing.map((t) => normalizeFact(t))
          );
        }

        // Build prompt for this country
        const prompt = `Generate ${factsPerCountry} unique, factual, and neutral statements about ${country} regarding ${category}${
          subcategory ? ` - ${subcategory}` : ""
        }.

      Requirements:
      - Each fact must be one sentence (max 15 words), interesting, and verifiable
      - Facts should be specific, accurate, human-friendly, use simple words and diverse
      - Do NOT repeat similar facts or paraphrase the same information
      - Return ONLY a JSON array with each item having a "text" field
      - No markdown, no explanation, no surrounding prose

      Example format:
      [
        { "text": "Your fact here" },
        { "text": "Another fact here" }
      ]`;

        // Call Gemini
        let generated: string | null = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK response object from Gemini
          const gres: any = await model.generateContent(prompt);

          if (gres?.response && typeof gres.response.text === "function") {
            generated = await gres.response.text();
          } else if (typeof gres === "string") {
            generated = gres;
          }
        } catch (geminiError: unknown) {
          console.error(`Gemini API error for ${country}:`, geminiError);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Gemini API error for ${country}` })}\n\n`));
          continue;
        }

        if (!generated) {
          console.warn(`No content generated for ${country}`);
          continue;
        }

        // Parse JSON response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsed AI JSON payload
        let parsed: any = null;
        const candidate = extractJsonLike(stripCodeFences(String(generated)));
        try {
          parsed = JSON.parse(candidate);
        } catch (e) {
          try {
            parsed = JSON.parse(generated);
          } catch (e2) {
            console.warn(`Failed to parse response for ${country}`);
            continue;
          }
        }

        // Filter out duplicates and structure for storage with uniqueness check
        const facts = Array.isArray(parsed) ? parsed : [parsed];
        const validFacts = [];

        for (const f of facts) {
          const text = (f.text || f.fact || f.description || "").toString();
          if (!text) continue;
          
          const normalized = normalizeFact(text);
          // Check against existing texts first (quick filter)
          if (existingTexts.some(e => e === normalized || e.includes(normalized) || normalized.includes(e))) {
            continue;
          }
          
          // If checkUniqueness enabled, do server-side similarity check
          if (checkUniqueness && svcRole && supaUrl) {
            const result = await checkBulkFactUniqueness(text, supaUrl, svcRole, {
              country,
              factTypeId: factTypeId || null,
              categoryId: category_id || null
            });
            if (!result.isUnique) {
              continue;
            }
          }
          
          validFacts.push(f);
        }

        // Write result immediately (newline-delimited JSON)
        const countryResult = {
          country,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsed AI item shape
          facts: validFacts.map((f: any) => ({
            text: (f.text || f.fact || f.description || f.title || "")
              .toString()
              .slice(0, 1000),
            source: f.source || "ai",
            ai_generated: true,
            content_hash: hashContent(f.text || f.fact || f.description || ""),
            is_unique: true,
            checked_at: new Date().toISOString(),
            metadata: f,
          })),
          factCount: validFacts.length,
        };
        controller.enqueue(encoder.encode(JSON.stringify(countryResult) + '\n'));
        console.log(`[bulk-generate-facts] Sent result for ${country}: ${validFacts.length} facts`);

        // Rate limiting: small delay between requests
        await delay(500);
      } catch (e) {
        console.error(`Error processing country ${country}:`, e);
        const errorResult = {
          country,
          error: String(e),
          facts: [],
          factCount: 0,
        };
        controller.enqueue(encoder.encode(JSON.stringify(errorResult) + '\n'));
        await delay(500);
      }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("bulk-generate-facts error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
