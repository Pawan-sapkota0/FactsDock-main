import "../deno.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Respond to preflight with 204 No Content and CORS headers
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { countryName, allCountries } = await req.json();
    console.log('Fetching country data:', { countryName, allCountries });

    let url: string;
    
    if (allCountries) {
      // Fetch all countries
      url = 'https://restcountries.com/v3.1/all';
    } else if (countryName) {
      // Fetch specific country
      url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Please provide countryName or set allCountries to true' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('REST Countries API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Country not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Successfully fetched country data');

    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in fetch-country-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
