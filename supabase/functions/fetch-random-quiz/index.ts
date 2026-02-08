import "../deno.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * fetch-random-quiz: Server-side random quiz selection using SQL ORDER BY RANDOM()
 * 
 * Efficient selection of random quiz questions directly from the database.
 * Uses SQL RANDOM() to shuffle and LIMIT to select, ensuring fresh results every call.
 * 
 * Query params:
 * - count: number of questions to return (default 10, max 100)
 * - topic: optional topic/country filter (uses ilike match)
 * - sourceType: optional type filter (e.g., 'fun', 'world', 'country')
 * 
 * Returns: { data: [...questions] } with status 200 on success
 */

// Get CORS headers with origin validation
const getCorsHeaders = (origin?: string) => {
  const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:5173',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8080',
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
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    // Read parameters from request body first, fall back to query params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parsed request body from incoming HTTP request
    let body: any = {};
    try {
      body = await req.json();
      console.log('[fetch-random-quiz] Request body:', body);
    } catch {
      // Body is not JSON, that's fine
      console.log('[fetch-random-quiz] No JSON body');
    }
    const count = Math.min(parseInt(body.count || url.searchParams.get('count') || '10'), 100);
    const topic = body.topic || url.searchParams.get('topic') || null;
    const sourceType = body.sourceType || url.searchParams.get('sourceType') || null;

    console.log('[fetch-random-quiz] Parameters - count:', count, 'topic:', topic, 'sourceType:', sourceType);

    if (count <= 0) {
      return new Response(
        JSON.stringify({ error: 'count must be > 0' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supaUrl = Deno.env.get('SUPABASE_URL');
    const supaKey = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('SERVICE_ROLE');

    if (!supaUrl || !supaKey) {
      return new Response(
        JSON.stringify({ error: 'Server not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build REST API filter for published is_random=true quizzes
    // Random quizzes only have: questions and difficulty columns (no country/fact_type)
    const filterParams = new URLSearchParams();
    filterParams.append('select', 'id,questions,difficulty,is_random');
    filterParams.append('status', 'eq.published');
    filterParams.append('is_random', 'eq.true');
    filterParams.append('order', 'created_at.desc');
    filterParams.append('limit', '1000');

    const apiUrl = `${supaUrl}/rest/v1/quizzes?${filterParams.toString()}`;
    console.log('[fetch-random-quiz] API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`,
      },
    });

    if (!response.ok) {
      console.error('[fetch-random-quiz] API request failed:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch quizzes' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK/HTTP response boundary
    const rows: any[] = await response.json();
    console.log('[fetch-random-quiz] Quizzes fetched:', rows.length);

    // Shuffle rows to randomize order
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }

    // Flatten questions from quiz objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK/DB row shape (questions array)
    const allQuestions: any[] = [];
    for (const r of rows) {
      const qs = Array.isArray(r.questions) ? r.questions : (r.questions?.data || []);
      console.log('[fetch-random-quiz] Quiz has', qs?.length || 0, 'questions');
      for (const q of qs) allQuestions.push(q);
      if (allQuestions.length >= count) break;
    }

    // Return selected subset
    const selected = allQuestions.slice(0, count);
    console.log('[fetch-random-quiz] Returning', selected.length, 'questions');
    return new Response(
      JSON.stringify({ data: selected }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('fetch-random-quiz error', err);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
