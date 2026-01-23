/**
 * Quick Test Script for News Feature
 * Run these commands in browser console (F12) to verify news feature
 */

import { log, debug, warn, error } from "@/lib/logger";

// ============================================================
// TEST 1: Check if news section element exists
// ============================================================
log("=== TEST 1: News Section DOM ===");
const newsSection = document.getElementById("latest-news");
log("✓ News section found:", !!newsSection);
if (newsSection) {
  log("✓ HTML:", newsSection.innerHTML.substring(0, 100));
}

// ============================================================
// TEST 2: Fetch news from database
// ============================================================
log("\n=== TEST 2: Fetch News from Database ===");
(async () => {
  try {
    // Import the function
    const { fetchCountryNews } = await import("@/lib/api");
    
    // Test with current page's country (modify if needed)
    const countryName = document.querySelector("h1")?.textContent || "France";
    log(`Fetching news for: ${countryName}`);
    
    const news = await fetchCountryNews(countryName);
    log(`✓ News fetched: ${news?.length || 0} articles`);
    
    if (news && news.length > 0) {
      log("✓ Sample article:", news[0]);
    } else {
      warn("⚠ No news found in database");
    }
  } catch (err) {
    error("✗ Error fetching news:", err);
  }
})();

// ============================================================
// TEST 3: Check Supabase connection
// ============================================================
log("\n=== TEST 3: Supabase Connection ===");
(async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    
    // Try to query news table
    const { data, error } = await supabase
      .from("country_news")
      .select("COUNT(*)")
      .single();
    
    if (error) {
      error("✗ Supabase error:", error);
    } else {
      log("✓ Supabase connection OK");
      
      // Get count of news
      const { count } = await supabase
        .from("country_news")
        .select("id", { count: "exact" });
      
      log(`✓ Total news articles in database: ${count}`);
    }
  } catch (err) {
    error("✗ Error:", err);
  }
})();

// ============================================================
// TEST 4: Manual scroll test
// ============================================================
log("\n=== TEST 4: Scroll to News Section ===");
(async () => {
  try {
    const { scrollToElementObserver } = await import("@/lib/scroll-utils");
    const result = await scrollToElementObserver("latest-news", 5000);
    log(`✓ Scroll result: ${result ? "Success" : "Failed"}`);
  } catch (err) {
    error("✗ Scroll error:", err);
  }
})();

// ============================================================
// TEST 5: Check browser cache
// ============================================================
log("\n=== TEST 5: Browser Cache ===");
try {
  const cached = localStorage.getItem("wf:news:france");
  if (cached) {
    log("✓ Cached news found:", JSON.parse(cached));
  } else {
    log("⚠ No cached news (will be cached after first fetch)");
  }
} catch (err) {
  error("✗ Cache error:", err);
}

log("\n=== All tests completed ===");
