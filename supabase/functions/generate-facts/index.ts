import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// This Edge Function is a template for generating facts via a server-side AI API
// It expects a server-side secret GITHUB_AI_TOKEN (or other provider) to be set.

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
  const body = await req.json();
  const { country, category, category_id, subcategory, subcategory_id, type = 'world-facts', fact_type_id, fact_type_name, count = 5 } = body;

    // Load secret server-side token
    const GITHUB_AI_TOKEN = Deno.env.get('GITHUB_AI_TOKEN');
    if (!GITHUB_AI_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Basic input validation: allow category name or ids; we'll build the prompt from the names if provided.
    const categoryName = category || null;
    const subcategoryName = subcategory || null;
    const factTypeName = fact_type_name || null;

    if (!factTypeName && !categoryName && !category_id) {
      return new Response(JSON.stringify({ error: 'At least a fact type or category is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build a friendly prompt that includes fact type, category and subcategory names if available.
    const promptParts: string[] = [];
    if (factTypeName) promptParts.push(`Fact Type: ${factTypeName}`);
    if (categoryName) promptParts.push(`Category: ${categoryName}`);
    if (subcategoryName) promptParts.push(`Subcategory: ${subcategoryName}`);
    const promptTarget = promptParts.length ? promptParts.join(' | ') : (categoryName || 'the world');

  const prompt = `Generate ${count} concise factual statements (${type}) for ${country || 'the world'} about ${promptTarget}. Return a JSON array of short objects. Each object should include a concise text field (fact, description, or title) and optional metadata. Respond with only valid JSON (no surrounding prose).`;

  // Rate-limit stub (recommended production: Upstash/Redis or Cloudflare)
  // const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
  // const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

    // Prepare AI request. Allow API URL and model to be configured via env vars.
    const AI_API_URL = Deno.env.get('AI_API_URL') || Deno.env.get('OPENROUTER_API_URL') || 'https://api.openrouter.ai/v1/chat/completions';
    const AI_MODEL = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';

    // Example: call OpenRouter (GitHub AI via OpenRouter). The token is provided
    // in the environment as GITHUB_AI_TOKEN (server-side secret).
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_AI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ai = await response.json();
    // OpenRouter/chat-style responses typically have choices[0].message.content
    let generated: string | null = null;
    if (ai?.choices && ai.choices[0]) generated = ai.choices[0]?.message?.content || ai.choices[0]?.text || null;
    if (!generated && ai?.result) generated = ai.result;

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
      console.error('AI response missing content', ai);
      return new Response(JSON.stringify({ error: 'AI returned no content' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let parsed: any = null;
    const candidate = extractJsonLike(stripCodeFences(String(generated)));
    try {
      parsed = JSON.parse(candidate);
    } catch (e) {
      // give a last-ditch attempt: try parsing the full string
      try { parsed = JSON.parse(generated); } catch (e2) {
        console.error('Failed to parse AI response', { candidate, generated });
        return new Response(JSON.stringify({ error: 'Invalid AI response format' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    // If the request included `persist: true` and a service role is configured,
    // persist generated items to the `facts` table as drafts.
    // Support either SUPABASE_SERVICE_ROLE or service_role (some dashboards/cli set different names)
    const svcRole = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('service_role') || Deno.env.get('SERVICE_ROLE');
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
            metadata: { raw: p }
          })))
        });
        if (!insertRes.ok) console.error('Failed to insert generated facts', await insertRes.text());
      } catch (e) {
        console.error('Persist error', e);
      }
    }

    return new Response(JSON.stringify({ data: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('generate-facts error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
