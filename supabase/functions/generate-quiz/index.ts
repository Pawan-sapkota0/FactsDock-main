import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ========== UNIQUENESS CHECKING UTILITIES ==========
function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

function hashContent(text: string): string {
  // Simple hash for exact duplicate detection
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

async function checkQuizUniqueness(
  question: string,
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
    
    let url = `${supaUrl}/rest/v1/quizzes?select=question`;
    if (filters.factTypeId) url += `&fact_type_id=eq.${filters.factTypeId}`;
    
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn('[checkQuizUniqueness] Failed to fetch existing quizzes');
      return { isUnique: true, duplicateCount: 0, potentialMatches: [], hash: hashContent(question) };
    }

    const existingQuizzes = (await res.json()) as unknown[];
    const potentialMatches: unknown[] = [];
    
    for (const quiz of existingQuizzes) {
      const existingQuestion = (quiz as Record<string, unknown>)?.question as string;
      if (!existingQuestion) continue;
      
      const similarity = calculateSimilarity(question, existingQuestion);
      if (similarity > 0.8) {
        potentialMatches.push({ similarity, text: existingQuestion });
      }
    }

    return {
      isUnique: potentialMatches.length === 0,
      duplicateCount: potentialMatches.length,
      potentialMatches,
      hash: hashContent(question)
    };
  } catch (e) {
    console.error('[checkQuizUniqueness] Error:', e);
    return { isUnique: true, duplicateCount: 0, potentialMatches: [], hash: hashContent(question) };
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin ?? undefined);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || null;
  // Accept POST body as fallback for client invocations
  const body = await req.json().catch(()=>({}));
  const { 
    country, 
    category, 
    questionCount = 10, 
    fact_type_slug,
    fact_type_id,
    fact_type_name,
    category_id,
    subcategory_id,
    subcategory,
    difficulty,
    checkUniqueness = false 
  } = body || {};
  
  console.log('[generate-quiz] Starting with params:', { fact_type_id, category_id, subcategory_id, country, checkUniqueness });
  
  let uniquenessReport: Record<string, unknown> | null = null;

    // Gemini key is not required for this function (no AI calls here),
    // but we read the env var to keep parity with other functions.
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    // This function supports three modes: random, fact_type, country
    // Use the Supabase service role REST API to query facts and insert quizzes
    const svcRole = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('service_role') || Deno.env.get('SERVICE_ROLE');
    const supaUrl = Deno.env.get('SUPABASE_URL') as string;
    if (!svcRole || !supaUrl) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const headers = {
      'apikey': svcRole as string,
      'Authorization': `Bearer ${svcRole}`,
      'Content-Type': 'application/json'
    };

    // Helper: fetch facts matching criteria via REST, then filter out existing
    const fetchFacts = async (): Promise<unknown[]> => {
      let factsUrl = `${supaUrl}/rest/v1/facts?select=*&status=eq.approved`;
      
      // Use fact_type_id if provided, otherwise resolve by slug
      if (fact_type_id) {
        factsUrl += `&fact_type_id=eq.${fact_type_id}`;
      } else if (mode === 'fact_type' || fact_type_slug) {
        // resolve fact_type id by slug
        const ftRes = await fetch(`${supaUrl}/rest/v1/fact_types?select=id&slug=eq.${encodeURIComponent(fact_type_slug)}`, { headers });
        if (!ftRes.ok) return [];
        const fts = (await ftRes.json()) as unknown;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- REST API response shape
        const ftId = (fts && (fts as any)[0] && (fts as any)[0].id) ?? null;
        if (ftId) factsUrl += `&fact_type_id=eq.${ftId}`;
      }
      
      // Filter by category if provided
      if (category_id) {
        factsUrl += `&category_id=eq.${category_id}`;
      }
      
      // Filter by subcategory if provided
      if (subcategory_id) {
        factsUrl += `&subcategory_id=eq.${subcategory_id}`;
      }
      
      // Filter by country if provided
      if (mode === 'country' || country) {
        factsUrl += `&country=eq.${encodeURIComponent(country as string)}`;
      }
      
      console.log('[fetchFacts] URL:', factsUrl);
      const res = await fetch(factsUrl, { headers });
      if (!res.ok) {
        console.error('[fetchFacts] Failed to fetch facts from', factsUrl, 'status:', res.status);
        const errText = await res.text();
        console.error('[fetchFacts] Error:', errText);
        return [];
      }
      const facts = (await res.json()) as unknown;
      return (Array.isArray(facts) ? facts : []) || [];
    };

    // fetch existing fact_ids in quizzes to avoid duplicates
    const existingRes = await fetch(`${supaUrl}/rest/v1/quizzes?select=fact_id`, { headers });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- REST API response shape
    const existing = existingRes.ok ? ((await existingRes.json()) as any[]).map((r: Record<string, unknown>)=>r.fact_id).filter(Boolean) : [];
    console.log('[generate-quiz] Existing fact_ids:', existing.length);
    console.log('[generate-quiz] Request params - fact_type_id:', fact_type_id, 'category_id:', category_id, 'subcategory_id:', subcategory_id, 'country:', country);

    const allFacts = await fetchFacts();
    console.log('[generate-quiz] Fetched facts:', allFacts.length);
    
    // Filter out already-queried facts
    const newFacts = (Array.isArray(allFacts) ? allFacts : []).filter((f: unknown) => !existing.includes((f as Record<string, unknown>)?.id));
    console.log('[generate-quiz] New facts after filtering existing:', newFacts.length);
    
    // Shuffle and take questionCount
    for (let i = newFacts.length -1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [newFacts[i], newFacts[j]] = [newFacts[j], newFacts[i]]; }
    const chosen = newFacts.slice(0, questionCount || 10);
    console.log('[generate-quiz] Chosen items for quiz:', chosen.length);

    if (!chosen || chosen.length === 0) {
      console.log('[generate-quiz] No facts available, returning empty');
      return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ========== UNIQUENESS CHECKING ==========
    let itemsToInsert = chosen;
    if (checkUniqueness) {
      console.log('[generate-quiz] Starting uniqueness check for', chosen.length, 'items');
      const uniqueItems: unknown[] = [];
      const duplicates: unknown[] = [];

      for (const item of chosen) {
        const itemRecord = item as Record<string, unknown>;
        const questionText = itemRecord.fact_text as string || '';
        const result = await checkQuizUniqueness(questionText, supaUrl, svcRole, { factTypeId: itemRecord.fact_type_id });

        if (result.isUnique) {
          uniqueItems.push({ ...itemRecord, _contentHash: result.hash });
        } else {
          duplicates.push({
            text: questionText.substring(0, 100),
            duplicateCount: result.duplicateCount,
            matches: result.potentialMatches.map((m) => {
              const matchRecord = m as Record<string, unknown>;
              return { similarity: matchRecord.similarity as number, text: (matchRecord.text as string).substring(0, 60) };
            })
          });
        }
      }

      console.log('[generate-quiz] Uniqueness check complete: unique=', uniqueItems.length, 'duplicates=', duplicates.length);

      uniquenessReport = {
        totalGenerated: chosen.length,
        uniqueCount: uniqueItems.length,
        duplicateCount: duplicates.length,
        duplicates,
        timestamp: new Date().toISOString()
      };

      if (uniqueItems.length === 0) {
        console.log('[generate-quiz] No unique items, returning 409');
        return new Response(
          JSON.stringify({ error: 'No unique quizzes generated - all similar to existing content', report: uniquenessReport }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      itemsToInsert = uniqueItems;
    }
    // ========== END UNIQUENESS CHECKING =========

    // Build insert payload
    console.log('[generate-quiz] Building insert payload for', itemsToInsert.length, 'items');
    const inserts = itemsToInsert.map((f) => {
      const fRecord = f as Record<string, unknown>;
      return {
        questions: JSON.stringify([{
          question: fRecord.fact_text,
          options: ['Option 1','Option 2','Option 3','Option 4'],
          correct_answer: 'Option 1'
        }]),
        fact_id: fRecord.id,
        fact_type_id: fRecord.fact_type_id || null,
        category_id: fRecord.category_id || null,
        subcategory_id: fRecord.subcategory_id || null,
        country: fRecord.country || null,
        status: 'draft',
        is_random: true
      };
    });

    console.log('[generate-quiz] Insert payload sample:', JSON.stringify(inserts[0] || {}, null, 2));
    const insertRes = await fetch(`${supaUrl}/rest/v1/quizzes`, { method: 'POST', headers, body: JSON.stringify(inserts) });
    if (!insertRes.ok) {
      const txt = await insertRes.text();
      console.error('Insert failed', insertRes.status, txt);
      return new Response(
        JSON.stringify({ error: 'Insert failed', details: txt, status: insertRes.status }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const inserted = await insertRes.json();
    return new Response(
      JSON.stringify({ data: inserted, uniquenessReport }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-quiz error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
