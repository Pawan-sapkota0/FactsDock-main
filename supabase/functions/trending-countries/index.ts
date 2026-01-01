/// <reference path="../deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Fallback list (exactly 4)
const FALLBACK = [
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Nepal', flag: '🇳🇵' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'China', flag: '🇨🇳' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const svcRole = Deno.env.get('SUPABASE_SERVICE_ROLE') || Deno.env.get('service_role') || Deno.env.get('SERVICE_ROLE');
    const supaUrl = Deno.env.get('SUPABASE_URL');
    if (!svcRole || !supaUrl) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Use PostgREST aggregation: select=country,view_count:count(*) & group=country
    const url = `${supaUrl}/rest/v1/country_page_views?select=country,view_count:count(*)&viewed_at=gte.${encodeURIComponent(sevenDaysAgo)}&group=country&order=view_count.desc&limit=4`;

    const res = await fetch(url, {
      headers: {
        'apikey': svcRole,
        'Authorization': `Bearer ${svcRole}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('trending-countries query failed', res.status, await res.text());
      // on error, return fallback
      return new Response(JSON.stringify({ data: FALLBACK }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rows = await res.json();
    // rows look like [{ country: 'Name', view_count: '5' }, ...]
    const parsed = (rows || []).map((r: any) => ({ name: r.country, view_count: Number(r.view_count) || 0 }));

    // If no rows or fewer than 4 or all zeros -> fallback
    const total = parsed.length;
    const allZero = parsed.every((p: any) => p.view_count === 0);
    if (total < 4 || parsed.length === 0 || allZero) {
      return new Response(JSON.stringify({ data: FALLBACK }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ data: parsed }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('trending-countries error', err);
    return new Response(JSON.stringify({ data: FALLBACK }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
