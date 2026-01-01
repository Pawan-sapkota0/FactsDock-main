/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
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
      Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
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
    const countriesToProcess = countries || COUNTRIES_A_TO_Z;

    // Create a ReadableStream to stream results immediately
    const stream = new ReadableStream({
      async start(controller: any) {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const encoder = new TextEncoder();

        for (let i = 0; i < countriesToProcess.length; i++) {
          const country = countriesToProcess[i];

      try {
        console.log(
          `[Bulk] Processing country ${i + 1}/${countriesToProcess.length}: ${country}`
        );

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
        const promptParts: string[] = [
          `Country: ${country}`,
          `Category: ${category || "Unknown"}`,
        ];
        if (subcategory) {
          promptParts.push(`Subcategory: ${subcategory}`);
        }
        const promptTarget = promptParts.join(" | ");

        const prompt = `Generate ${factsPerCountry} unique, factual, and neutral statements about ${country} regarding ${category}${subcategory ? " - " + subcategory : ""}. 
Make facts concise (one sentence), interesting, and verifiable. 
Return a JSON array where each item has a "text" field (the fact), and optional "source" field.
Respond with ONLY valid JSON, no markdown or explanation.`;

        // Call Gemini
        const gres: any = await model.generateContent(prompt);
        let generated: string | null = null;

        if (gres?.response && typeof gres.response.text === "function") {
          generated = await gres.response.text();
        } else if (typeof gres === "string") {
          generated = gres;
        }

        if (!generated) {
          console.warn(`No content generated for ${country}`);
          continue;
        }

        // Parse JSON response
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

        // Filter out duplicates and structure for storage
        const facts = Array.isArray(parsed) ? parsed : [parsed];
        const validFacts = facts.filter((f: any) => {
          const text = (f.text || f.fact || f.description || "").toString();
          const normalized = normalizeFact(text);
          return (
            text &&
            !existingTexts.some(
              (e) =>
                e === normalized || e.includes(normalized) ||
                normalized.includes(e)
            )
          );
        });

        // Write result immediately (newline-delimited JSON)
        const countryResult = {
          country,
          facts: validFacts.map((f: any) => ({
            text: (f.text || f.fact || f.description || f.title || "")
              .toString()
              .slice(0, 1000),
            source: f.source || "ai",
            metadata: f,
          })),
          factCount: validFacts.length,
        };
        controller.enqueue(encoder.encode(JSON.stringify(countryResult) + '\n'));

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
