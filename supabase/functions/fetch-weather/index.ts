import "../deno.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS helper
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

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin ?? undefined);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { city } = await req.json();
    const apiKey = Deno.env.get('WEATHER_API_KEY');
    if (!city) {
      console.error('[fetch-weather] Missing city parameter');
      return new Response(JSON.stringify({ error: 'Missing city parameter' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!apiKey) {
      console.error('[fetch-weather] Weather API key not configured');
      return new Response(JSON.stringify({ error: 'Weather API key not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error('[fetch-weather] Weather API error:', res.status, errText);
      return new Response(JSON.stringify({ error: 'Weather API error', status: res.status, details: errText }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await res.json();
    return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[fetch-weather] Unhandled error:', err);
    return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
