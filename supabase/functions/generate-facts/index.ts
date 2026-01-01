/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Use the official Google Generative AI SDK for Deno (npm compatibility)
import { GoogleGenerativeAI } from "@google/generative-ai";

// This Edge Function generates facts via Google Gemini API.
// It expects a server-side secret GEMINI_API_KEY to be set.

const allowedOrigin = 'http://localhost:8080'; // or '*' in dev, restrict in production

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
  const body = await req.json();
  const { country, category, category_id, subcategory, subcategory_id, type = 'world-facts', fact_type_id, fact_type_name, count = 5 } = body;

    // Load Gemini secret server-side token
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
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

    // Use Google Gemini (gemini-2.5-flash) via the official SDK.
    let generated: string | null = null;
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      // Use the same prompt text; SDK returns an object with response text.
      const gres: any = await model.generateContent(prompt);
      // SDK compatibility: try to extract a textual response.
      if (gres?.response && typeof gres.response.text === 'function') {
        generated = await gres.response.text();
      } else if (gres?.output && Array.isArray(gres.output) && gres.output[0]?.content) {
        // Fallback extraction pattern
        generated = gres.output.map((o:any)=> (o.content || []).map((c:any)=> c.text || '').join('')).join('\n');
      } else if (typeof gres === 'string') {
        generated = gres;
      }
    } catch (e) {
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

    return new Response(JSON.stringify({ data: parsed }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error('generate-facts error', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
