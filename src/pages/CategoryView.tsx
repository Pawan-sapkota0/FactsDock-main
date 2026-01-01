import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fetchFactsByCategory } from "@/lib/facts";
import LazyFactCard from "@/components/cards/LazyFactCard";
const QuizModal = React.lazy(() => import("../components/QuizModal"));
import { useToast } from "@/hooks/use-toast";

function slugToTitle(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const BATCH_SIZE = 10;

const CategoryView: React.FC = () => {
  const { slug, type } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
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

  const categoryKey = `${type || "fun-facts"}:${slug}`;
  const factTypeIdRef = useRef<string | null>(null);

  // use shared lazy wrapper

  useEffect(() => {
    // reset when slug/type changes
    setFacts([]);
    setPage(0);
    setHasMore(true);
    cacheRef.current.clear();
    setCurrentCategoryKey(null);
    loadMore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, type]);

  useEffect(() => {
    // resolve fact_type id for the current route (world-facts vs fun-facts)
    // Use `location.pathname` instead of the optional route 'type' param
    // because routes are defined as '/world-facts/:slug' and '/fun-facts/:slug'.
    void (async () => {
      try {
        const isWorld = location.pathname.startsWith("/world-facts");
        const typeKey = isWorld ? "world-facts" : "fun-facts";
        const { data: ft } = await (
          await import("@/integrations/supabase/client")
        ).supabase
          .from("fact_types")
          .select("id")
          .eq("slug", typeKey)
          .maybeSingle();
        factTypeIdRef.current = ft?.id || null;
      } catch (e) {
        factTypeIdRef.current = null;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Listen for global facts-updated events (clears) so this view can reload
  useEffect(() => {
    const handler = () => {
      void (async () => {
        try {
          // If we have a current category key (may include subcategory), re-fetch it
          if (currentCategoryKey) {
            // clear global caches, then local cache and re-fetch the current view
            const { clearFactsCacheAll } = await import("@/lib/api");
            clearFactsCacheAll();
            cacheRef.current.clear();
            setFacts([]);
            setPage(0);
            setHasMore(true);
            await loadMore(0);
            return;
          }

          // otherwise just clear caches and reset
          const { clearFactsCacheAll } = await import("@/lib/api");
          clearFactsCacheAll();
          cacheRef.current.clear();
          setFacts([]);
          setPage(0);
          setHasMore(true);
        } catch (err) {
          // Ensure fact_type id resolved so the query is scoped properly
          if (!factTypeIdRef.current) {
            try {
              // Determine the page type consistently (same logic used elsewhere)
              const isWorld = location.pathname.startsWith("/world-facts");
              const typeKey = isWorld ? "world-facts" : "fun-facts";
              const supa = (await import("@/integrations/supabase/client"))
                .supabase;
              const { data: ft } = await supa
                .from("fact_types")
                .select("id")
                .eq("slug", typeKey)
                .maybeSingle();
              factTypeIdRef.current = ft?.id || null;
            } catch (err) {
              // ignore – will call without explicit id if resolution fails
            }
          }
          const opts: any = { fact_type_id: factTypeIdRef.current };
        }
      })();
    };
    window.addEventListener("wf:facts-updated", handler as EventListener);
    return () =>
      window.removeEventListener("wf:facts-updated", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, type, currentCategoryKey]);

  const loadMore = async (nextPage = page) => {
    if (!slug) return;
    // determine whether this page is for world or fun based on pathname
    const isWorld = location.pathname.startsWith("/world-facts");
    const typeKey = (isWorld ? "world-facts" : "fun-facts") as
      | "fun-facts"
      | "world-facts";

    // prefer currentCategoryKey if set (used for subcategory paging)
    const preferredKey =
      currentCategoryKey || `${typeKey}:${slugToTitle(slug)}`;
    const cacheKey = preferredKey;
    try {
      setIsLoading(true);
      // Ensure we resolve the fact_type id for this page before fetching
      // so that fetchFactsByCategory can operate strictly for the chosen type
      // (avoid falling back to other fact types when an explicit type exists).
      if (!factTypeIdRef.current) {
        try {
          const supa = (await import("@/integrations/supabase/client"))
            .supabase;
          const { data: ft } = await supa
            .from("fact_types")
            .select("id")
            .eq("slug", typeKey)
            .maybeSingle();
          factTypeIdRef.current = ft?.id || null;
        } catch (e) {
          // ignore – we'll proceed without an explicit id if resolution fails
        }
      }
      // If we've cached a full list for this category, page through it locally
      if (cacheRef.current.has(cacheKey)) {
        const all = cacheRef.current.get(cacheKey) || [];
        const start = nextPage * BATCH_SIZE;
        const slice = all.slice(start, start + BATCH_SIZE);
        setFacts((s) => [...s, ...slice]);
        setHasMore(start + BATCH_SIZE < all.length);
        setPage(nextPage + 1);
        return;
      }

      // If we don't already have the full list cached for the cacheKey, fetch it
      // cacheKey might be in the form 'fun-facts:Title — Sub' or 'fun-facts:Title'.
      // Try the straightforward slug->title fetch first; only attempt a main—sub
      // reconstruction when the initial fetch returns no items (avoids
      // misclassifying single hyphenated main-category slugs).
      let fetchCategory = cacheKey.split(":").slice(1).join(":");
      const opts: any = { fact_type_id: factTypeIdRef.current };
      let res = await fetchFactsByCategory(typeKey, fetchCategory, opts);
      let items = res || [];
      if ((items || []).length === 0 && slug && slug.includes("-")) {
        const parts = String(slug).split("-");
        const main = slugToTitle(parts[0] || "");
        const sub = slugToTitle(parts.slice(1).join("-") || "");
        if (main && sub) {
          // Try multiple alt formats when slug includes dashes
          const altCandidates = [
            `${main} — ${sub}`,
            `${main} - ${sub}`,
            `${main} & ${sub}`,
            `${main} and ${sub}`,
            `${main} ${sub}`,
          ];
          for (const altCategory of altCandidates) {
            try {
              const altRes = await fetchFactsByCategory(
                typeKey,
                altCategory,
                opts
              );
              if ((altRes || []).length > 0) {
                items = altRes || [];
                fetchCategory = altCategory;
                res = altRes;
                break;
              }
            } catch (e) {
              // ignore and continue with next candidate
            }
          }
        }
      }
      // If no items found for a main category, try common alternate spellings (insert '&' or 'and')
      if (
        (items || []).length === 0 &&
        !fetchCategory.includes("—") &&
        !fetchCategory.includes("—")
      ) {
        const parts = fetchCategory.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          const alt1 = parts.join(" & ");
          const alt2 = parts.join(" and ");
          try {
            res = await fetchFactsByCategory(typeKey, alt1, opts);
            items = res || [];
          } catch (e) {
            // ignore
          }
          if ((items || []).length === 0) {
            try {
              res = await fetchFactsByCategory(typeKey, alt2, opts);
              items = res || [];
            } catch (e) {}
          }
        }
      }
      if (process.env.NODE_ENV !== "production") {
        try {
          console.debug("[CategoryView] loadMore fetched", {
            cacheKey,
            fetchCategory,
            count: items.length,
            sample: items[0],
          });
        } catch (e) {}
      }
      cacheRef.current.set(cacheKey, items);
      setCurrentCategoryKey(cacheKey);
      const slice = items.slice(0, BATCH_SIZE);
      setFacts((s) => (nextPage === 0 ? slice : [...s, ...slice]));
      setHasMore(items.length > slice.length);
      setPage(nextPage === 0 ? 1 : nextPage + 1);
    } catch (e) {
      console.error("Failed to load category facts", e);
      toast({
        title: "Error",
        description: "Failed to load facts for this category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const next = page;
    loadMore(next);
  };

  // NOTE: Infinite-scroll via IntersectionObserver was causing repeated triggers and layout jitter
  // that produced a 'shaking' effect. Re-introducing a guarded observer that will trigger
  // loadMore() only when not loading and hasMore is true. This uses a tiny debounce via
  // checking isLoading/hasMore and a short timeout to avoid rapid retriggers.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            // small safety delay
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
  }, [hasMore, isLoading, page, currentCategoryKey]);

  // Restore a previously-saved snapshot when the user navigates with the
  // browser Back/Forward buttons (popstate). We attach snapshots via
  // `history.replaceState(..., { wf_snapshot })` before entering a
  // subcategory and `pushState` after, so Back will provide the snapshot.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const state =
        (e.state as any) || (window.history && (window.history.state as any));
      const snap = state && state.wf_snapshot ? state.wf_snapshot : null;
      if (!snap) return;
      try {
        // restore cached list if present
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
        // restore scroll position a moment later so layout stabilizes
        setTimeout(() => {
          if (typeof window !== "undefined" && snap.scrollY)
            window.scrollTo(0, snap.scrollY);
        }, 50);
      } catch (err) {
        // ignore restore errors
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a subcategory is chosen from the dropdown, fetch facts for that subtopic
  const handleSubSelect = async (sub: string) => {
    if (!slug) return;
    setShowSubs(false);
    setIsLoading(true);
    // Save a snapshot of the current view into the current history entry so
    // that hitting the browser Back button restores the previous loaded state
    // (facts, page, currentCategoryKey, scroll position).
    try {
      const snapshot = {
        currentCategoryKey,
        facts:
          cacheRef.current.get(
            currentCategoryKey ||
              `${type === "world" ? "world-facts" : "fun-facts"}:${slugToTitle(
                slug
              )}`
          ) || facts,
        page,
        hasMore,
        scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      };
      // Attach snapshot to the current history entry
      try {
        window.history.replaceState(
          { ...(window.history.state || {}), wf_snapshot: snapshot },
          ""
        );
      } catch (e) {
        // ignore replaceState failures in restrictive environments
      }
    } catch (e) {
      // ignore snapshot errors
    }

    setFacts([]);
    try {
      const typeKey = (type === "world" ? "world-facts" : "fun-facts") as
        | "fun-facts"
        | "world-facts";
      const category = `${title} — ${sub}`;
      const cacheKey = `${typeKey}:${category}`;

      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey) || [];
        setFacts(cached.slice(0, BATCH_SIZE));
        setHasMore(cached.length > BATCH_SIZE);
        setPage(1);
        return;
      }

      const opts: any = { fact_type_id: factTypeIdRef.current };
      const res = await fetchFactsByCategory(typeKey, category, opts);
      const items = res || [];
      // After loading the subcategory facts, push a new history entry so that
      // pressing Back will trigger a popstate with the snapshot we attached
      // to the previous entry above.
      try {
        window.history.pushState(
          { ...(window.history.state || {}), wf_sub: category },
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

  // Prefer the title passed via navigation state so it matches the main category exact label
  const navState: any = (location && (location.state as any)) || {};
  const mainTitle = navState.title || (slug ? slugToTitle(slug) : "Category");
  const availableSubs: string[] = navState.subs || [];
  const title = mainTitle;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back button removed per request */}

          <div className="flex flex-col items-center">
            <h1 className="text-xl md:text-2xl font-semibold mb-4 text-center animate-fade-in transition-all duration-300">
              <span className="inline-block pb-1 border-b-2 border-primary/10">
                {title}
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
                {/* use native title attribute for tooltip to avoid layout jitter */}
                <Button
                  onClick={() => setOpenQuiz(true)}
                  variant="secondary"
                  className="px-4 py-2 text-lg transform transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_10px_24px_rgba(99,102,241,0.10)]"
                  title={`Play a quick quiz about ${title}`}
                >
                  Play Quiz
                </Button>
              </div>
            </div>

            {/* Dynamic heading moved below the subcategories so opening the dropdown pushes the heading down */}
          </div>

          {/* Subcategories dropdown (toggle controlled) */}
          {showSubs && (
            <div className="mb-4">
              <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
                {availableSubs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No subcategories available for this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {availableSubs.map((s) => (
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

          {/* Dynamic heading placed after subcategories so it moves down when subs open */}
          {(() => {
            // Determine if we're currently viewing a subcategory by inspecting
            // `currentCategoryKey`. It has the form `${typeKey}:${categoryLabel}`
            // where `categoryLabel` may be `Main — Sub` when a subcategory is selected.
            const categoryLabel = currentCategoryKey
              ? String(currentCategoryKey).split(":").slice(1).join(":")
              : null;
            let subcategoryName: string | null = null;
            if (categoryLabel && categoryLabel.includes("—")) {
              const parts = categoryLabel.split("—").map((s) => s.trim());
              if (parts.length > 1)
                subcategoryName = parts.slice(1).join(" — ");
            }
            return (
              title && (
                <div className="w-full mt-6 mb-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                    {subcategoryName
                      ? `Facts about ${subcategoryName} of ${title}`
                      : `Facts about ${title}`}
                  </h2>
                </div>
              )
            );
          })()}

          <div className="space-y-4">
            {facts.length === 0 && !isLoading && (
              <Card className="p-6 text-center">
                No facts available for this topic yet.
              </Card>
            )}

            {facts.map((f, i) => (
              <div key={f?.id || i} className="p-0">
                <LazyFactCard
                  fact={f?.fact_text || f?.fact || f?.title || ""}
                />
              </div>
            ))}

            {/* debug panel removed */}

            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" /> Loading...
              </div>
            )}

            {/* debug panel removed - rendering fixed */}

            {!isLoading && hasMore && (
              <div className="pt-4">
                <Button onClick={handleLoadMore} className="w-full">
                  Load more
                </Button>
              </div>
            )}
            {/* sentinel for guarded infinite scroll (observed by IntersectionObserver) */}
            <div ref={sentinelRef as any} style={{ height: 1 }} />
          </div>
        </div>
      </main>
      <React.Suspense fallback={<div />}>
        <QuizModal
          open={openQuiz}
          onOpenChange={setOpenQuiz}
          topic={title}
          sourceType={type === "world" ? "world" : "fun"}
        />
      </React.Suspense>
      {/* dev-only debug panel to show resolved ids */}
      {/* ResolveDebugPanel removed */}
      <Footer />
    </div>
  );
};

export default CategoryView;
