import "../deno.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY",
) as string;
const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY") as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required Supabase environment variables");
}

if (!UNSPLASH_ACCESS_KEY) {
  throw new Error("Missing UNSPLASH_ACCESS_KEY environment variable");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface UnsplashImage {
  id: string;
  urls: { regular: string };
  alt_description: string;
  user: { name: string; portfolio_url?: string };
  width: number;
  height: number;
}

interface CachedImage {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl?: string;
  width: number;
  height: number;
}

/**
 * Fetch fresh images from Unsplash for a country
 */
async function fetchImagesFromUnsplash(
  country: string,
  searchQueries: string[],
): Promise<CachedImage[]> {
  const images: CachedImage[] = [];

  if (!UNSPLASH_ACCESS_KEY) {
    console.error("UNSPLASH_ACCESS_KEY is not set!");
    return images;
  }

  for (const query of searchQueries) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=4&client_id=${UNSPLASH_ACCESS_KEY}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `Image fetch failed: ${response.status}`,
        );
        continue;
      }

      const data = await response.json();
      const results = data.results || [];

      for (const photo of results) {
        const unsplashPhoto = photo as UnsplashImage;
        images.push({
          url: unsplashPhoto.urls.regular,
          alt: unsplashPhoto.alt_description || `Image of ${country}`,
          photographer: unsplashPhoto.user.name,
          photographerUrl: unsplashPhoto.user.portfolio_url,
          width: unsplashPhoto.width,
          height: unsplashPhoto.height,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching images for query "${query}":`, error);
    }
  }

  return images.slice(0, 12); // Return up to 12 unique images
}

/**
 * Refresh image cache for a single country
 * Updates expired entries safely
 */
async function refreshCountryImages(
  country: string,
  searchQueries: string[],
): Promise<boolean> {
  try {
    // Fetch new images from Unsplash
    const newImages = await fetchImagesFromUnsplash(country, searchQueries);

    if (newImages.length === 0) {
      console.debug(`No images found: ${country}`);
      return false;
    }

    // Get current cache entry
    const { data: existingCache, error: fetchError } = await supabase
      .from("image_cache")
      .select("*")
      .eq("country", country)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error(`Error fetching existing cache for ${country}:`, fetchError);
      return false;
    }

    // Prepare new cache entry
    const newCacheEntry = {
      country: country,
      search_queries: searchQueries,
      images: newImages,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
      updated_at: new Date().toISOString(),
      last_refresh_attempt: new Date().toISOString(),
      refresh_status: 'success' as const,
      consecutive_failures: 0,
    };

    if (existingCache) {
      // Update existing cache entry
      const { error: updateError } = await supabase
        .from("image_cache")
        .update(newCacheEntry)
        .eq("id", existingCache.id);

      if (updateError) {
        console.error(`Error updating cache for ${country}:`, updateError);
        return false;
      }

      console.log(
        `✓ Updated cache for ${country}`,
      );
    } else {
      // Insert new cache entry
      const { error: insertError } = await supabase
        .from("image_cache")
        .insert([newCacheEntry]);

      if (insertError) {
        console.error(`Error inserting cache for ${country}:`, insertError);
        return false;
      }

      console.log(
        `✓ Created cache for ${country}`,
      );
    }

    return true;
  } catch (error) {
    console.error(`Error refreshing images for ${country}:`, error);
    return false;
  }
}

/**
 * Main handler: Refresh image cache for countries with expired entries
 * Run daily as a cron job
 * Has a 30-second timeout to prevent function from running too long
 */
async function refreshImageCache() {
  try {
    console.log("Starting daily image cache refresh...");
    const startTime = Date.now();
    const MAX_DURATION = 30000; // 30 seconds max

    // Get all unique countries from facts
    const { data: countries, error: countriesError } = await supabase
      .from("facts")
      .select("country")
      .not("country", "is", null);

    if (countriesError) {
      console.error("Error fetching countries:", countriesError);
      return {
        success: false,
        error: `Failed to fetch countries: ${countriesError.message}`,
      };
    }

    // Get unique countries
    const uniqueCountries = Array.from(
      new Set((countries || [])
        .map((row: Record<string, unknown>) => row.country as string)
        .filter(Boolean))
    ) as string[];

    if (uniqueCountries.length === 0) {
      console.debug("No countries found");
      return { success: true, refreshed: 0, message: "No countries to refresh" };
    }

    console.log(`Checking ${uniqueCountries.length} countries for refresh`);

    // Check which entries are older than 24 hours
    const { data: expiredEntries, error: expiredError } = await supabase
      .from("image_cache")
      .select("country")
      .lt("fetched_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (expiredError && expiredError.code !== "PGRST116") {
      console.error("Error checking expired entries:", expiredError);
    }

    const expiredCountries = (expiredEntries || [])
      .map((row: Record<string, unknown>) => row.country as string);

    // Countries without cache entries (new countries)
    const { data: cachedCountries, error: cachedError } = await supabase
      .from("image_cache")
      .select("country");

    if (cachedError && cachedError.code !== "PGRST116") {
      console.error("Error fetching cached countries:", cachedError);
    }

    const cachedCountriesSet = new Set(
      (cachedCountries || []).map((row: Record<string, unknown>) => row.country as string),
    );
    const newCountries = uniqueCountries.filter((c: string) => !cachedCountriesSet.has(c));

    const countriesToRefresh = [
      ...new Set([...expiredCountries, ...newCountries]),
    ];

    console.log(
      `Queued ${countriesToRefresh.length} for refresh (${expiredCountries.length} expired, ${newCountries.length} new)`,
    );

    // Refresh images for each country
    const results = [];
    for (const country of countriesToRefresh) {
      // Check if we're running out of time
      if (Date.now() - startTime > MAX_DURATION) {
        console.warn(`Timeout: Completed ${results.length} of ${countriesToRefresh.length}`);
        break;
      }

      // Generate search queries based on country name
      const searchQueries = [
        `${country} landscape`,
        `${country} culture`,
        `${country} nature`,
      ];

      const success = await refreshCountryImages(country, searchQueries);
      results.push({ country, success });

      // Add delay between requests to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `Refresh: ${successCount} succeeded, ${failureCount} failed`,
    );

    // Clean up expired entries (older than 48 hours)
    console.debug("Starting cleanup...");
    
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc("cleanup_expired_image_cache");

    if (cleanupError) {
      console.warn("Cleanup warning (non-fatal)");
    } else {
      const deletedCount = cleanupResult?.[0]?.deleted_count || 0;
      console.debug(`Cleanup: ${deletedCount} expired entries removed`);
    }

    // Clean up old news articles (older than 48 hours)
    const { data: newsCleanupResult, error: newsCleanupError } = await supabase
      .rpc("cleanup_old_news");

    if (newsCleanupError) {
      console.warn("News cleanup warning (non-fatal)");
    } else {
      const newsDeletedCount = newsCleanupResult?.[0]?.deleted_count || 0;
      console.debug(`News cleanup: ${newsDeletedCount} old articles removed`);
    }

    return {
      success: true,
      refreshed: successCount,
      failed: failureCount,
      cleaned: cleanupResult?.[0]?.deleted_count || 0,
      newsRemoved: newsCleanupResult?.[0]?.deleted_count || 0,
      message: `Refreshed ${successCount}/${countriesToRefresh.length} countries`,
    };
  } catch (error) {
    console.error("Fatal error during image cache refresh:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, Accept, x-api-key",
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  // Allow POST requests (from cron or manual triggers)
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST and GET requests allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  try {
    console.debug("Image cache refresh started");
    const result = await refreshImageCache();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
});
