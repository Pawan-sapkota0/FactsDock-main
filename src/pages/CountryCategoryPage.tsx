import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fetchFactsForCountry, fetchCountryFacts } from "@/lib/api";
import { fetchFactsByCategory } from "@/lib/facts";
import { useToast } from "@/hooks/use-toast";
const QuizModal = React.lazy(() => import("../components/QuizModal"));
import LazyFactCard from "@/components/cards/LazyFactCard";

function slugToTitle(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const BATCH_SIZE = 10;

const CountryCategoryPage: React.FC = () => {
  const { country, category } = useParams<{
    country: string;
    category: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [facts, setFacts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openQuiz, setOpenQuiz] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [currentCategoryKey, setCurrentCategoryKey] = useState<string | null>(
    null
  );

  const cacheRef = useRef<Map<string, any[]>>(new Map());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const factTypeIdRef = useRef<string | null>(null);

  // Listen for admin cache invalidation events and reload facts for this country/category
  useEffect(() => {
    const handler = () => {
      void (async () => {
        try {
          // If this page currently has a selection (country + category), re-fetch it
          if (country && category) {
            const { clearFactsCacheAll } = await import("@/lib/api");
            clearFactsCacheAll();
            cacheRef.current.clear();
            setFacts([]);
            setPage(0);
            setHasMore(true);
            await loadMore(0);
            return;
          }

          // fallback: clear caches/state
          const { clearFactsCacheAll } = await import("@/lib/api");
          clearFactsCacheAll();
          cacheRef.current.clear();
          setFacts([]);
          setPage(0);
          setHasMore(true);
        } catch (e) {}
      })();
    };
    window.addEventListener("wf:facts-updated", handler as EventListener);
    return () =>
      window.removeEventListener("wf:facts-updated", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, category]);

  const title = category ? slugToTitle(category) : "Category";
  const countryName = country ? slugToTitle(country) : "Country";
  const pageKey = `${countryName}:${title}`;

  // predefined subcategories mapping based on the user's provided list
  const subcategoryMap: Record<string, string[]> = {
    "Geography & Nature": [
      "Major Landforms",
      "Climate & Weather Patterns",
      "Natural Resources",
      "Borders & Neighboring Countries",
      "National Parks or Natural Wonders",
    ],
    "Culture & Tradition": [
      "Festivals & Celebrations",
      "Traditional Dress",
      "Local Foods / Cuisine",
      "Arts, Music & Dance",
      "Cultural Symbols",
    ],
    "History & Heritage": [
      "Founding / Independence Date",
      "Historical Background",
      "Important Leaders or Rulers",
      "Historical Monuments & Heritage Sites",
    ],
    "Economy & Industry": [
      "Major Industries",
      "GDP (approximate)",
      "Important Exports / Imports",
      "Currency Strength & Economy Type",
    ],
    "Tourism & Landmarks": [
      "Popular Tourist Attractions",
      "UNESCO World Heritage Sites",
      "Famous Cities & Places",
      "Natural & Man-made Wonders",
    ],
    "Education & Innovation": [
      "Literacy Rate",
      "Notable Universities",
      "Scientific or Technological Contributions",
      "Research & Development",
    ],
    "Sports & Achievements": [
      "National Sports",
      "Famous Athletes",
      "Olympic Participation or Wins",
      "Major Sporting Events",
    ],
    "Fun & Interesting Facts": [
      "Unique Laws or Customs",
      "World Records or Only in This Country",
      "Weird Traditions / Oddities",
      "International Rankings",
    ],
    "Global Presence": [
      "Memberships (UN, WHO, etc.)",
      "Diplomatic Relations",
      "Embassies / Global Impact",
      "Contribution to Global Issues",
    ],
  };

  useEffect(() => {
    setFacts([]);
    setPage(0);
    setHasMore(true);
    cacheRef.current.clear();
    loadMore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, category]);

  const loadMore = async (nextPage = page) => {
    if (!category || !country) return;
    const cacheKey = pageKey;
    try {
      setIsLoading(true);
      if (cacheRef.current.has(cacheKey)) {
        const all = cacheRef.current.get(cacheKey) || [];
        const start = nextPage * BATCH_SIZE;
        const slice = all.slice(start, start + BATCH_SIZE);
        setFacts((s) => [...s, ...slice]);
        setHasMore(start + BATCH_SIZE < all.length);
        setPage(nextPage + 1);
        return;
      }

      // Use the country-specific helper so we request world-facts for this country+category
      const opts: any = { force: true };
      if (factTypeIdRef.current) opts.fact_type_id = factTypeIdRef.current;
      // First try with the plain title (slug->title). If that returns no items
      // and the category slug contains a dash, attempt a "Main — Sub" reconstruction
      // and re-fetch. This prevents misinterpreting main-category slugs that have
      // hyphens in their single-token form.
      let searchCategory = title;
      let res = await fetchCountryFacts(countryName, {
        ...opts,
        category: searchCategory,
      });
      let items = res || [];
      if ((items || []).length === 0 && category && category.includes("-")) {
        const parts = category.split("-");
        const main = slugToTitle(parts[0] || "");
        const sub = slugToTitle(parts.slice(1).join("-") || "");
        if (main && sub) {
          const alt = `${main} — ${sub}`;
          try {
            const altRes = await fetchCountryFacts(countryName, {
              ...opts,
              category: alt,
            });
            if ((altRes || []).length > 0) {
              items = altRes || [];
              res = altRes;
              searchCategory = alt;
            }
          } catch (e) {
            // ignore and continue
          }
        }
      }

      if (process.env.NODE_ENV !== "production") {
        try {
          console.debug(
            "[CountryCategoryPage] loadMore fetched items count",
            items.length,
            { countryName, title, cacheKey, sample: items[0] }
          );
        } catch (e) {}
      }
      cacheRef.current.set(cacheKey, items);
      setCurrentCategoryKey(cacheKey);
      const slice = items.slice(0, BATCH_SIZE);
      setFacts((s) => (nextPage === 0 ? slice : [...s, ...slice]));
      setHasMore(items.length > slice.length);
      setPage(nextPage === 0 ? 1 : nextPage + 1);
    } catch (e) {
      console.error("Failed to load category facts for country", e);
      toast({
        title: "Error",
        description: "Failed to load facts for this category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // When a subcategory is selected, build a cacheKey with country + category + sub
  const handleSubSelect = async (sub: string) => {
    if (!category || !country) return;
    setShowSubs(false);
    setIsLoading(true);
    // Save a snapshot of the current view into the current history entry so
    // that hitting the browser Back button restores the previous loaded state
    // (facts, page, currentCategoryKey, scroll position).
    try {
      const snapshot = {
        pageKey,
        currentCategoryKey,
        facts: cacheRef.current.get(currentCategoryKey || pageKey) || facts,
        page,
        hasMore,
        scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      };
      try {
        window.history.replaceState(
          { ...(window.history.state || {}), wf_snapshot: snapshot },
          ""
        );
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }

    setFacts([]);
    try {
      const cacheKey = `${countryName}:${title}:${sub}`;

      // If cached, page through the cached list locally
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey) || [];
        setFacts(cached.slice(0, BATCH_SIZE));
        setHasMore(cached.length > BATCH_SIZE);
        setPage(1);
        setCurrentCategoryKey(cacheKey);
        return;
      }

      // Fetch subcategory facts for this country
      const opts: any = { force: true };
      if (factTypeIdRef.current) opts.fact_type_id = factTypeIdRef.current;
      const res = await fetchCountryFacts(countryName, {
        ...opts,
        category: `${title} — ${sub}`,
      });
      const items = res || [];
      if (process.env.NODE_ENV !== "production") {
        try {
          console.debug(
            "[CountryCategoryPage] handleSubSelect fetched items count",
            items.length,
            { countryName, title, sub, cacheKey }
          );
        } catch (e) {}
      }
      // After loading the subcategory facts, push a new history entry so that
      // pressing Back will trigger a popstate with the snapshot we attached
      // to the previous entry above.
      try {
        window.history.pushState(
          {
            ...(window.history.state || {}),
            wf_sub: `${countryName}:${title}:${sub}`,
          },
          ""
        );
      } catch (e) {
        // ignore
      }
      cacheRef.current.set(cacheKey, items);
      setCurrentCategoryKey(cacheKey);
      setFacts(items.slice(0, BATCH_SIZE));
      setHasMore(items.length > BATCH_SIZE);
      setPage(1);
    } catch (e) {
      console.error("Failed to load subcategory facts", e);
      toast({
        title: "Error",
        description: "Failed to load subcategory facts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // resolve fact_type id for 'world-facts'
    void (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const r: any = await supabase
          .from("fact_types")
          .select("id")
          .eq("slug", "world-facts")
          .maybeSingle();
        factTypeIdRef.current = r?.data?.id || null;
      } catch (e) {
        factTypeIdRef.current = null;
      }
    })();
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            setTimeout(() => {
              if (!isLoading && hasMore) loadMore(page);
            }, 150);
          }
        });
      },
      { root: null, rootMargin: "150px", threshold: 0.1 }
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, page]);

  // Restore a previously-saved snapshot when the user navigates with Back/Forward.
  // We attach snapshots via `history.replaceState(..., { wf_snapshot })` before
  // entering a subcategory and `pushState` after, so Back will provide the snapshot.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const state =
        (e.state as any) || (window.history && (window.history.state as any));
      const snap = state && state.wf_snapshot ? state.wf_snapshot : null;
      if (!snap) return;
      // Ensure the snapshot belongs to this page (country+category)
      if (snap.pageKey !== pageKey) return;
      try {
        if (snap.currentCategoryKey) {
          cacheRef.current.set(snap.currentCategoryKey, snap.facts || []);
        }
        setCurrentCategoryKey(snap.currentCategoryKey || null);
        const all = snap.facts || [];
        const pageToRestore = snap.page || 1;
        const slice = all.slice(0, Math.max(1, pageToRestore) * BATCH_SIZE);
        setFacts(slice);
        setPage(pageToRestore);
        setHasMore(
          typeof snap.hasMore === "boolean"
            ? snap.hasMore
            : all.length > slice.length
        );
        setTimeout(() => {
          if (typeof window !== "undefined" && snap.scrollY)
            window.scrollTo(0, snap.scrollY);
        }, 50);
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back button removed per request */}

          <div className="flex flex-col items-center">
            <h1 className="text-xl md:text-2xl font-semibold mb-4 text-center animate-fade-in transition-all duration-300">
              <span className="inline-block pb-1 border-b-2 border-primary/10">
                {title} of {countryName}
              </span>
            </h1>

            <div className="w-full flex items-center justify-between mb-6">
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowSubs((s) => !s)}
                  className="px-4 py-2 text-lg"
                >
                  Facts by Subcategories
                </Button>
              </div>

              <div>
                <Button
                  onClick={() => setOpenQuiz(true)}
                  variant="secondary"
                  className="px-4 py-2 text-lg transform transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_10px_24px_rgba(99,102,241,0.10)]"
                  title={`Play a quick quiz about ${title} of ${countryName}`}
                >
                  Play Quiz
                </Button>
              </div>
            </div>
          </div>

          {/* Subcategories dropdown (toggle controlled) */}
          {showSubs && (
            <div className="mb-4">
              <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
                {!subcategoryMap[title] ||
                subcategoryMap[title].length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No subcategories available for this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {subcategoryMap[title].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSubSelect(s)}
                        className="w-full text-left px-3 py-2 rounded hover:scale-105 transition-transform duration-150 bg-transparent"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{s}</span>
                          <span className="text-xs text-muted-foreground">
                            View
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(() => {
            const parts = currentCategoryKey
              ? String(currentCategoryKey).split(":").slice(1)
              : null;
            let subName: string | null = null;
            if (parts && parts.length > 1) {
              // parts[0] is the main category title, parts[1] (and beyond) form the subcategory
              subName = parts.slice(1).join(":");
            }
            return (
              <div className="w-full mt-6 mb-2">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                  {subName
                    ? `Facts about ${subName} of ${title} in ${countryName}`
                    : `Facts about ${title} of ${countryName}`}
                </h2>
              </div>
            );
          })()}

          <div className="space-y-4">
            {facts.length === 0 && !isLoading && (
              <Card className="p-6 text-center">
                No facts available for this topic yet.
              </Card>
            )}

            {(() => {
              const showingSub = !!(
                currentCategoryKey && currentCategoryKey.split(":").length >= 3
              );
              // When viewing a main category, show both category-level facts and
              // any facts belonging to its subcategories. When viewing a subcategory
              // (currentCategoryKey includes a sub token), show only subcategory facts.
              const displayed = showingSub
                ? (facts || []).filter(
                    (f) => !!(f && (f as any).subcategory_id)
                  )
                : facts || [];
              if (process.env.NODE_ENV !== "production") {
                try {
                  console.debug(
                    "[CountryCategoryPage] facts array",
                    facts,
                    "displayed",
                    displayed,
                    "currentCategoryKey",
                    currentCategoryKey
                  );
                } catch (e) {}
              }
              return displayed.map((f, i) => (
                <div key={f?.id || i}>
                  <LazyFactCard
                    fact={f?.fact_text || f?.fact || f?.title || ""}
                  />
                </div>
              ));
            })()}

            {process.env.NODE_ENV !== "production" && (
              <div className="mt-4 p-4 bg-muted/5 rounded">
                <h4 className="font-semibold mb-2">Debug: facts state</h4>
                <pre className="text-sm max-h-48 overflow-auto">
                  {JSON.stringify(facts, null, 2)}
                </pre>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" /> Loading...
              </div>
            )}

            {/* debug panel removed - rendering fixed */}

            {!isLoading && hasMore && (
              <div className="pt-4">
                <Button onClick={() => loadMore(page)} className="w-full">
                  Load more
                </Button>
              </div>
            )}

            <div ref={sentinelRef as any} style={{ height: 1 }} />
          </div>
        </div>
      </main>
      <React.Suspense fallback={<div />}>
        <QuizModal
          open={openQuiz}
          onOpenChange={setOpenQuiz}
          topic={`${title} of ${countryName}`}
          sourceType={"fun"}
        />
      </React.Suspense>
      <Footer />
    </div>
  );
};

export default CountryCategoryPage;
