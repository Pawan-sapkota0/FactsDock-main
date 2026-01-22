/// <reference path="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Supabase module types
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const GNEWS_API_KEY = Deno.env.get("NEWS_API_KEY") as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GNEWS_API_KEY) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface NewsArticle {
  country: string;
  title: string;
  source: string;
  url: string;
  image_url?: string;
  published_at?: string;
}

/**
 * Fetch latest news for a country using gnews.io API and store in database
 * Runs on a schedule (e.g., daily or every 12 hours)
 */
async function fetchAndStoreNews(country: string): Promise<boolean> {
  try {
    // Use gnews.io API to fetch articles
    const response = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(
        country
      )}&token=${GNEWS_API_KEY}&lang=en&sortby=publishedAt&max=10`
    );

    if (!response.ok) {
      console.error(`gnews.io request failed: ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Error details:", errorBody);
      return false;
    }

    const data = await response.json();
    const articles = data.articles || [];

    if (articles.length === 0) {
      console.log(`No news found for ${country}`);
      return true;
    }

    // Transform gnews.io articles for database storage
    const newsRecords: NewsArticle[] = articles.map((article: any) => ({
      country,
      title: article.title || "Untitled",
      source: article.source?.name || "Unknown",
      url: article.url,
      image_url: article.image || undefined,
      published_at: article.publishedAt,
    }));

    // Insert into database (upsert to avoid duplicates)
    const { error } = await supabase.from("country_news").upsert(newsRecords, {
      onConflict: "url,country",
    });

    if (error) {
      console.error(`Error storing news for ${country}:`, error);
      return false;
    }

    console.log(`✓ Stored ${newsRecords.length} news articles for ${country}`);
    return true;
  } catch (err) {
    console.error(`Exception fetching news for ${country}:`, err);
    return false;
  }
}

/**
 * Cleanup old news articles (older than 7 days)
 */
async function cleanupOldNews(): Promise<boolean> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from("country_news")
      .delete()
      .lt("created_at", sevenDaysAgo.toISOString());

    if (error) {
      console.error("Error cleaning up old news:", error);
      return false;
    }

    console.log("✓ Cleanup completed");
    return true;
  } catch (err) {
    console.error("Exception during cleanup:", err);
    return false;
  }
}

/**
 * Get top countries to fetch news for
 */
async function getTopCountries(): Promise<string[]> {
  const fallbackCountries = [
    "United States",
    "United Kingdom",
    "France",
    "Germany",
    "India",
    "China",
    "Japan",
    "Nepal",
    "Canada",
    "Australia",
    "Brazil",
    "Mexico",
    "Spain",
    "Italy",
    "Russia",
    "South Korea",
    "Netherlands",
    "Switzerland",
    "Sweden",
    "Norway",
    "Denmark",
    "Belgium",
    "Austria",
    "Greece",
    "Portugal",
    "Poland",
    "Czech Republic",
    "Ireland",
    "New Zealand",
    "Singapore",
    "Hong Kong",
    "Thailand",
    "Vietnam",
    "Philippines",
    "Indonesia",
    "Malaysia",
    "Pakistan",
    "Bangladesh",
    "Turkey",
    "Saudi Arabia",
    "United Arab Emirates",
    "Israel",
    "South Africa",
    "Egypt",
    "Nigeria",
    "Kenya",
    "Argentina",
    "Chile",
    "Colombia",
    "Peru",
    "Venezuela",
  ];

  try {
    const { data, error } = await supabase
      .from("countries")
      .select("name")
      .limit(50);

    if (error) {
      console.error("Error fetching countries:", error);
      return fallbackCountries;
    }

    const result = (data || []).map((c: any) => c.name).filter(Boolean);
    console.log(`Fetched ${result.length} countries from database`);
    return result.length > 0 ? result : fallbackCountries;
  } catch (err) {
    console.error("Exception fetching countries:", err);
    return fallbackCountries;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Allow GET and OPTIONS requests without authentication
    if (req.method === "GET" || req.method === "OPTIONS") {
      // Continue with function execution
    } else {
      // For POST/PUT/DELETE, verify authorization
      const authHeader = req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Missing authorization header" }), {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        });
      }
    }

    const countries = await getTopCountries();
    console.log(`Fetching news for ${countries.length} countries...`);

    // Fetch news for each country sequentially to avoid rate limits
    const results: Record<string, boolean> = {};
    for (const country of countries) {
      results[country] = await fetchAndStoreNews(country);
      // Small delay between requests to avoid rate limiting (gnews.io has limits)
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Cleanup old news
    await cleanupOldNews();

    const successful = Object.values(results).filter(Boolean).length;
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${successful}/${countries.length} countries`,
        results,
      }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  }
});
