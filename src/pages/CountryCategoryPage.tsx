import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fetchFactsForCountry, fetchCountryFacts } from "@/lib/api";
import { fetchFactsByCategory } from "@/lib/facts";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/common/PaginationControls";
import PaginationSkeleton from "@/components/common/PaginationSkeleton";
import {
  filterFacts,
  getEmptyStateMessage,
  markFactViewed,
} from "@/lib/fact-filtering";
import { log, debug, warn, error } from "@/lib/logger";
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

  const [facts, setFacts] = useState<unknown[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openQuiz, setOpenQuiz] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [currentCategoryKey, setCurrentCategoryKey] = useState<string | null>(
    null,
  );
  const [filterType, setFilterType] = useState<string>("all");

  const cacheRef = useRef<Map<string, unknown[]>>(new Map());
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
        } catch (e) {
          /* ignored - event handler */
        }
      })();
    };
    window.addEventListener("wf:facts-updated", handler as EventListener);
    return () =>
      window.removeEventListener("wf:facts-updated", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, category]);

  // Initialize pagination at top level
  const pagination = usePagination({ itemsPerPage: 8 });

  // Update pagination when facts change
  useEffect(() => {
    pagination.setTotalItems(facts.length);
  }, [facts]);

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
      const opts: { force: boolean; fact_type_id?: string } = { force: true };
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

      try {
        debug(
          "[CountryCategoryPage] loadMore fetched items count",
          items.length,
          { countryName, title, cacheKey, sample: items[0] },
        );
      } catch (e) {
        /* ignored - debug only */
      }
      cacheRef.current.set(cacheKey, items);
      setCurrentCategoryKey(cacheKey);
      const slice = items.slice(0, BATCH_SIZE);
      setFacts((s) => (nextPage === 0 ? slice : [...s, ...slice]));
      setHasMore(items.length > slice.length);
      setPage(nextPage === 0 ? 1 : nextPage + 1);
    } catch (e) {
      error("Failed to load category facts for country", e);
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
          "",
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
      const opts: { force: boolean; fact_type_id?: string } = { force: true };
      if (factTypeIdRef.current) opts.fact_type_id = factTypeIdRef.current;
      const res = await fetchCountryFacts(countryName, {
        ...opts,
        category: `${title} — ${sub}`,
      });
      const items = res || [];
      try {
        debug(
          "[CountryCategoryPage] handleSubSelect fetched items count",
          items.length,
          { countryName, title, sub, cacheKey },
        );
      } catch (e) {
        /* ignored - debug only */
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
          "",
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
      error("Failed to load subcategory facts", e);
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
        // Supabase response: allow `any` at SDK boundary
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Restore a previously-saved snapshot when the user navigates with Back/Forward.
  // We attach snapshots via `history.replaceState(..., { wf_snapshot })` before
  // entering a subcategory and `pushState` after, so Back will provide the snapshot.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const stateObj = (e.state ??
        (window.history && window.history.state)) as Record<
        string,
        unknown
      > | null;
      const snap = stateObj?.wf_snapshot as {
        pageKey?: string;
        currentCategoryKey?: string | null;
        facts?: unknown[];
        page?: number;
        hasMore?: boolean;
        scrollY?: number;
      } | null;
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
            : all.length > slice.length,
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
              {/* 
              <div>
                <Button
                  onClick={() => setOpenQuiz(true)}
                  variant="secondary"
                  className="px-4 py-2 text-lg transform transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_10px_24px_rgba(99,102,241,0.10)]"
                  title={`Play a quick quiz about ${title} of ${countryName}`}
                >
                  Play Quiz
                </Button>
              </div> */}
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
              <div className="w-full mt-6 mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                  {subName
                    ? `Facts about ${subName} of ${title} in ${countryName}`
                    : `Facts about ${title} of ${countryName}`}
                </h2>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <label className="text-sm font-medium text-foreground">
                    View facts
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary/50"
                  >
                    <option value="all">All facts</option>
                    <option value="newtoday">New today</option>
                    <option value="latest">Latest release</option>
                    <option value="notseen">Not seen yet</option>
                  </select>
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            {facts.length === 0 && !isLoading && (
              <Card className="p-6 text-center">
                No facts available for this topic yet.
              </Card>
            )}

            {/* ResolveDebugPanel removed */}
            {(() => {
              const showingSub = !!(
                currentCategoryKey && currentCategoryKey.split(":").length >= 3
              );
              // When viewing a main category, show both category-level facts and
              // any facts belonging to its subcategories. When viewing a subcategory
              // (currentCategoryKey includes a sub token), show only subcategory facts.
              const displayed = showingSub
                ? (facts || []).filter(
                    (f) =>
                      !!(f && (f as Record<string, unknown>)?.subcategory_id),
                  )
                : facts || [];

              // Apply selected filter
              const filtered = filterFacts(displayed, filterType);

              try {
                debug(
                  "[CountryCategoryPage] facts array",
                  facts,
                  "displayed",
                  displayed,
                  "filtered",
                  filtered,
                  "filterType",
                  filterType,
                );
              } catch (e) {
                /* ignored - history push best-effort */
              }

              const paginatedFacts = pagination.paginate(filtered);

              return (
                <>
                  {filtered.length === 0 && !isLoading ? (
                    <Card className="p-6 text-center">
                      <p className="text-muted-foreground">
                        {getEmptyStateMessage(filterType)}
                      </p>
                    </Card>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {paginatedFacts.map((f, i) => {
                          const row = f as {
                            id?: string | number;
                            fact_id?: string | number;
                            fact_text?: unknown;
                            fact?: unknown;
                            title?: unknown;
                          };
                          return (
                            <div
                              key={row?.id || i}
                              onMouseEnter={() =>
                                markFactViewed(row?.id || row?.fact_id)
                              }
                            >
                              <LazyFactCard
                                fact={String(
                                  row?.fact_text ||
                                    row?.fact ||
                                    row?.title ||
                                    "",
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {pagination.totalPages > 1 && (
                        <PaginationControls
                          currentPage={pagination.currentPage}
                          totalPages={pagination.totalPages}
                          onPageChange={(page) => {
                            pagination.setPage(page);
                            document
                              .getElementById("facts-section")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                          canGoPrevious={pagination.canGoPrevious}
                          canGoNext={pagination.canGoNext}
                          className="mt-4"
                        />
                      )}
                    </>
                  )}
                </>
              );
            })()}

            {/* debug panel removed */}

            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" /> Loading...
              </div>
            )}

            {/* debug panel removed - rendering fixed */}
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
