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
    'http://localhost:5173',
    'https://worldfacts.com',
    'https://www.worldfacts.com',
  ];
  
  return {
    'Access-Control-Allow-Origin': (origin && ALLOWED_ORIGINS.includes(origin)) ? origin : 'https://worldfacts.com',
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
    } catch {
      // Body is not JSON, that's fine
    }
    const count = Math.min(parseInt(body.count || url.searchParams.get('count') || '10'), 100);
    const topic = body.topic || url.searchParams.get('topic') || null;
    const sourceType = body.sourceType || url.searchParams.get('sourceType') || null;

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

    // Build SQL filter: published quizzes, optionally filtered by topic/sourceType
    let whereClause = "status = 'published' AND is_random = true";

    if (topic) {
      const normalizedTopic = topic.replace(/-/g, ' ').trim();
      whereClause += ` AND country ILIKE '%${normalizedTopic}%'`;
    }

    if (sourceType) {
      // Resolve sourceType slug to fact_type_id
      let slug = sourceType;
      if (sourceType === 'fun') slug = 'fun-facts';
      else if (sourceType === 'world') slug = 'world-facts';
      else if (sourceType === 'country') slug = 'country-facts';

      whereClause += ` AND fact_type_id = (SELECT id FROM fact_types WHERE slug = '${slug}' LIMIT 1)`;
    }

    // Query with ORDER BY RANDOM() to get fresh shuffled results
    const query = `
      SELECT id, questions, country, is_random, fact_type_id
      FROM quizzes
      WHERE ${whereClause}
      ORDER BY RANDOM()
      LIMIT 1000
    `;

    const response = await fetch(`${supaUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      // Fallback: use standard query endpoint if RPC is unavailable
      const fallbackRes = await fetch(
        `${supaUrl}/rest/v1/quizzes?select=id,questions,country,is_random,fact_type_id&status=eq.published&is_random=eq.true&limit=1000`,
        {
          headers: {
            'apikey': supaKey,
            'Authorization': `Bearer ${supaKey}`,
          },
        }
      );

      if (!fallbackRes.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch quizzes' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK/HTTP response boundary
      let rows: any[] = await fallbackRes.json();

      // Filter by topic/sourceType in JS if needed
      if (topic) {
        const normalizedTopic = topic.toLowerCase().replace(/-/g, ' ');
        rows = rows.filter(r => 
          String(r.country || '').toLowerCase().includes(normalizedTopic)
        );
      }

      // Shuffle rows
      for (let i = rows.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rows[i], rows[j]] = [rows[j], rows[i]];
      }

      // Flatten and select
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK/DB row shape (questions array)
      const allQuestions: any[] = [];
      for (const r of rows) {
        const qs = Array.isArray(r.questions) ? r.questions : (r.questions?.data || []);
        for (const q of qs) allQuestions.push(q);
        if (allQuestions.length >= count) break;
      }

      const selected = allQuestions.slice(0, count);
      return new Response(
        JSON.stringify({ data: selected }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK/HTTP response boundary
    const rows: any[] = await response.json();

    // Flatten questions from result rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK/DB row shape (questions array)
    const allQuestions: any[] = [];
    for (const r of rows) {
      const qs = Array.isArray(r.questions) ? r.questions : (r.questions?.data || []);
      for (const q of qs) allQuestions.push(q);
      if (allQuestions.length >= count) break;
    }

    // Return selected subset
    const selected = allQuestions.slice(0, count);
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
