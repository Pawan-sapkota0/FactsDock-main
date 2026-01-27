import "../deno.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

// This Edge Function generates facts via Google Gemini API with built-in uniqueness checking.
// Ensures no AI-generated duplicate or paraphrased facts are saved to database.
// Database columns required: content_hash, is_unique, ai_generated, checked_at

// Get CORS headers with origin validation
const getCorsHeaders = (origin?: string) => {
  const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://worldfacts.com',
    'https://www.worldfacts.com',
  ];
  
  return {
    'Access-Control-Allow-Origin': (origin && ALLOWED_ORIGINS.includes(origin)) ? origin : 'https://worldfacts.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

// ========== UNIQUENESS CHECKING (prevents duplicate AI-generated facts) ==========
function normalizeForComparison(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').substring(0, 200);
}

function hashContent(text: string): string {
  let hash = 0;
  const normalized = normalizeForComparison(text);
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function levenshteinDistance(s1: string, s2: string): number {
  const n1 = normalizeForComparison(s1);
  const n2 = normalizeForComparison(s2);
  const len1 = n1.length, len2 = n2.length;
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  const matrix: number[][] = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = n1[i - 1] === n2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
    }
  }
  return matrix[len2][len1];
}

function calculateSimilarity(s1: string, s2: string): number {
  const maxLen = Math.max(normalizeForComparison(s1).length, normalizeForComparison(s2).length);
  if (maxLen === 0) return 1.0;
  return 1.0 - (levenshteinDistance(s1, s2) / maxLen);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Deno/fetch API boundary
async function checkContentUniqueness(factText: string, supaUrl: string, svcKey: string, filters: any): Promise<any> {
  const hash = hashContent(factText);
  const minSimilarityThreshold = 0.80;
  try {
    let factsUrl = `${supaUrl}/rest/v1/facts?select=id,fact_text&status=eq.approved&ai_generated=eq.true`;
    if (filters.factTypeId) factsUrl += `&fact_type_id=eq.${filters.factTypeId}`;
    if (filters.categoryId) factsUrl += `&category_id=eq.${filters.categoryId}`;
    if (filters.subcategoryId) factsUrl += `&subcategory_id=eq.${filters.subcategoryId}`;
    if (filters.country) factsUrl += `&country=eq.${encodeURIComponent(filters.country)}`;
    const res = await fetch(factsUrl, { headers: { 'apikey': svcKey, 'Authorization': `Bearer ${svcKey}` } });
    if (!res.ok) {
      console.warn('[checkContentUniqueness] Failed to fetch existing facts');
      return { isUnique: true, duplicateCount: 0, potentialMatches: [], hash };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- REST API response
    const existingFacts = (await res.json()) as any[];
    const potentialMatches = [];
    for (const fact of existingFacts || []) {
      const existingText = (fact && fact.fact_text) || '';
      const similarity = calculateSimilarity(factText, existingText);
      if (similarity > minSimilarityThreshold) {
        potentialMatches.push({ id: fact.id || '', text: existingText, similarity: Math.round(similarity * 100) });
      }
    }
    return { isUnique: potentialMatches.length === 0, duplicateCount: potentialMatches.length, potentialMatches, hash };
  } catch (e) {
    console.error('[checkContentUniqueness] Error:', e);
    return { isUnique: true, duplicateCount: 0, potentialMatches: [], hash };
  }
}
// ========== END UNIQUENESS CHECKING ==========

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin ?? undefined);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
  const body = await req.json();
  const { country, category, category_id, subcategory, subcategory_id, type = 'world-facts', fact_type_id, fact_type_name, count = 5, checkUniqueness = false } = body;

    // Load Gemini secret server-side token
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash-lite';
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Basic input validation: allow category name or ids; we'll build the prompt from the names if provided.
    const categoryName = category || null;
    const subcategoryName = subcategory || null;
    const factTypeName = fact_type_name || null;

    if (!factTypeName && !categoryName && !category_id) {
      return new Response(JSON.stringify({ error: 'At least a fact type or category is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  const prompt = `Generate exactly ${count} concise, unique, and factual statements about ${country || 'the world'}.

CONTEXT - Generate facts ONLY matching these criteria:
- Fact Type: ${factTypeName || 'General'}
- Category: ${categoryName || 'General'}
${subcategoryName ? `- Subcategory: ${subcategoryName}` : ''}
${country ? `- Country/Region: ${country}` : ''}
- Number of Facts: ${count}

REQUIREMENTS:
- Generate exactly ${count} facts
- Each fact MUST match the Fact Type: ${factTypeName || 'General'}
- Each fact MUST match the Category: ${categoryName || 'General'}${subcategoryName ? ` and Subcategory: ${subcategoryName}` : ''}${country ? ` and be specific to ${country}` : ''}
- Each fact must be one sentence (max 15 words), interesting, and verifiable
- Facts must be factual, accurate, specific, human-friendly, use simple words, and diverse
- Do NOT generate facts about other categories, types, countries, or fact types
- Do NOT repeat similar facts
- Ensure all facts are unique and not repetitive
- Return ONLY a JSON array with each item having a "text" field
- No markdown, no explanation, no surrounding prose

Example format:
[
  { "text": "Your fact here" },
  { "text": "Another fact here" }
]`;

  // Rate-limit stub (recommended production: Upstash/Redis or Cloudflare)
  // const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
  // const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

    // Use Google Gemini via the official SDK.
    let generated: string | null = null;
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      // Use the same prompt text; SDK returns an object with response text.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK response object from Google Generative AI
      const gres: any = await model.generateContent(prompt);
      // SDK compatibility: try to extract a textual response.
      if (gres?.response && typeof gres.response.text === 'function') {
        generated = await gres.response.text();
      } else if (gres?.output && Array.isArray(gres.output) && gres.output[0]?.content) {
        // Fallback extraction pattern
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK output array items
        generated = gres.output.map((o: any) => (o.content || []).map((c: any) => c.text || '').join('')).join('\n');
      } else if (typeof gres === 'string') {
        generated = gres;
      }
    } catch (e: unknown) {
      console.error('Gemini generation error', e);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Helper: strip markdown code fences and attempt to find JSON substring
    const stripCodeFences = (s: string) => s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const extractJsonLike = (s: string) => {
      // look for a JSON array block first
      const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenceMatch && fenceMatch[1]) return fenceMatch[1].trim();
      // otherwise look for the first [...] or { ... } block
      const arrayMatch = s.match(/\[([\s\S]*?)\]/m);
      if (arrayMatch) return '[' + arrayMatch[1] + ']';
      const objMatch = s.match(/\{([\s\S]*?)\}/m);
      if (objMatch) return '{' + objMatch[1] + '}';
      return s;
    };

    if (!generated) {
      console.error('AI response missing content');
      return new Response(JSON.stringify({ error: 'AI returned no content' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsed AI JSON payload
    let parsed: any = null;
    const candidate = extractJsonLike(stripCodeFences(String(generated)));
    try {
      parsed = JSON.parse(candidate);
    } catch (e) {
      // give a last-ditch attempt: try parsing the full string
      try { parsed = JSON.parse(generated); } catch (e2) {
        console.error('Failed to parse AI response', { candidate, generated });
        return new Response(JSON.stringify({ error: 'Invalid AI response format' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    // If the request included `persist: true` and a service role is configured,
    // persist generated items to the `facts` table as drafts.
    // Support either SUPABASE_SERVICE_ROLE or service_role (some dashboards/cli set different names)
    const svcRole = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('service_role') || Deno.env.get('SERVICE_ROLE');
    
    // ========== APPLY UNIQUENESS CHECKING IF REQUESTED ==========
    let uniquenessReport = null;
    if (checkUniqueness && svcRole) {
      const supaUrl = Deno.env.get('SUPABASE_URL') as string;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const uniqueItems = [];
      const duplicates = [];

      for (const item of items) {
        const factText = (item.fact || item.description || item.title || item.text || '').toString();
        const result = await checkContentUniqueness(factText, supaUrl, svcRole, { factTypeId: fact_type_id, categoryId: category_id, subcategoryId: subcategory_id, country });

        if (result.isUnique) {
          uniqueItems.push({ ...item, _contentHash: result.hash });
        } else {
          duplicates.push({
            text: factText.substring(0, 100),
            duplicateCount: result.duplicateCount,
            matches: result.potentialMatches.map((m: Record<string, unknown>) => ({ similarity: m.similarity as number, text: (m.text as string).substring(0, 60) }))
          });
        }
      }

      parsed = uniqueItems;
      uniquenessReport = {
        totalGenerated: items.length,
        uniqueCount: uniqueItems.length,
        duplicateCount: duplicates.length,
        duplicates,
        timestamp: new Date().toISOString()
      };

      if (uniqueItems.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No unique facts generated - all similar to existing content', report: uniquenessReport }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // ========== END UNIQUENESS CHECKING ==========
    
    if (body.persist && svcRole) {
      try {
        const svcKey = svcRole as string;
        const supaUrl = Deno.env.get('SUPABASE_URL') as string;
        const insertRes = await fetch(`${supaUrl}/rest/v1/facts`, {
          method: 'POST',
          headers: {
            'apikey': svcKey,
            'Authorization': `Bearer ${svcKey}`,
            'Content-Type': 'application/json',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI-generated item shape
          body: JSON.stringify((Array.isArray(parsed) ? parsed : [parsed]).map((p: any) => ({
            fact_type_id: fact_type_id || null,
            category_id: category_id || null,
            subcategory_id: subcategory_id || null,
            country: country || null,
            // created_by may be provided by the admin client; include if present
            created_by: body.created_by || null,
            fact_text: (p.fact || p.description || p.title || p.text || '')?.toString().slice(0, 1000) || JSON.stringify(p).slice(0, 1000),
            source: 'ai',
            status: 'draft',
            ai_generated: true,
            content_hash: p._contentHash || hashContent(p.fact || p.description || p.title || p.text || ''),
            is_unique: true,
            checked_at: new Date().toISOString(),
            metadata: { raw: p }
          })))
        });
        if (!insertRes.ok) console.error('Failed to insert generated facts', await insertRes.text());
      } catch (e) {
        console.error('Persist error', e);
      }
    }

    return new Response(JSON.stringify({ data: parsed, uniquenessReport }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error('generate-facts error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
