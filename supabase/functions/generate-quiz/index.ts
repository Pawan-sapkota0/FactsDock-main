import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || null;
  // Accept POST body as fallback for client invocations
  const body = await req.json().catch(()=>({}));
  const { country, category, questionCount = 10, fact_type_slug } = body || {};

    const GITHUB_AI_TOKEN = Deno.env.get('GITHUB_AI_TOKEN');
    if (!GITHUB_AI_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
    const fetchFacts = async (): Promise<any[]> => {
      let factsUrl = `${supaUrl}/rest/v1/facts?select=*&status=eq.approved`;
      if (mode === 'fact_type' || fact_type_slug) {
        // resolve fact_type id by slug
        const ftRes = await fetch(`${supaUrl}/rest/v1/fact_types?select=id&slug=eq.${encodeURIComponent(fact_type_slug)}`, { headers });
        if (!ftRes.ok) return [];
        const fts = await ftRes.json();
        const ftId = fts && fts[0] && fts[0].id;
        if (ftId) factsUrl += `&fact_type_id=eq.${ftId}`;
      }
      if (mode === 'country' || country) {
        factsUrl += `&country=eq.${encodeURIComponent(country as string)}`;
      }
      const res = await fetch(factsUrl, { headers });
      if (!res.ok) return [];
      const facts = await res.json();
      return facts || [];
    };

    // fetch existing fact_ids in quizzes to avoid duplicates
    const existingRes = await fetch(`${supaUrl}/rest/v1/quizzes?select=fact_id`, { headers });
    const existing = existingRes.ok ? (await existingRes.json()).map((r:any)=>r.fact_id).filter(Boolean) : [];

    const allFacts = await fetchFacts();
    // Filter out already-queried facts
    const newFacts = (allFacts || []).filter((f:any) => !existing.includes(f.id));
    // Shuffle and take questionCount
    for (let i = newFacts.length -1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [newFacts[i], newFacts[j]] = [newFacts[j], newFacts[i]]; }
    const chosen = newFacts.slice(0, questionCount || 10);

    if (!chosen || chosen.length === 0) {
      return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build insert payload
    const inserts = chosen.map((f:any) => ({
      question: f.fact_text,
      options: ['Option 1','Option 2','Option 3','Option 4'],
      correct_answer: 'Option 1',
      fact_id: f.id,
      fact_type_id: f.fact_type_id || null,
      category_id: f.category_id || null,
      subcategory_id: f.subcategory_id || null,
      country_name: f.country || null,
      status: 'draft'
    }));

    const insertRes = await fetch(`${supaUrl}/rest/v1/quizzes`, { method: 'POST', headers, body: JSON.stringify(inserts) });
    if (!insertRes.ok) {
      const txt = await insertRes.text();
      console.error('Insert failed', insertRes.status, txt);
      return new Response(JSON.stringify({ error: 'Insert failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const inserted = await insertRes.json();
    return new Response(JSON.stringify({ data: inserted }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('generate-quiz error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
