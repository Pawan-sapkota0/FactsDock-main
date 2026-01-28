import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/common/PaginationControls";
import PaginationSkeleton from "@/components/common/PaginationSkeleton";
import {
  Dog,
  FlaskConical,
  Scroll,
  Apple,
  Trophy,
  Mountain,
  Sparkles,
  Loader2,
  X,
  MapPin,
  Lightbulb,
  Filter,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryCard from "@/components/cards/CategoryCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clearFactsCacheAll, fetchFactsByCategory } from "@/lib/api";
import LazyFactCard from "@/components/cards/LazyFactCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  filterFacts,
  getEmptyStateMessage,
  markFactViewed,
} from "@/lib/fact-filtering";
import { log, debug, warn, error } from "@/lib/logger";
// import { generateQuiz } from '@/lib/quiz';
const QuizModal = React.lazy(() => import("@/components/QuizModal"));
import { Button } from "@/components/ui/button";

// Type definition for fact objects
interface Fact {
  id?: string;
  fact_id?: string;
  fact_text?: string;
  fact?: string;
  title?: string;
  subcategory_id?: string;
  [key: string]: unknown;
}

const FunFacts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [facts, setFacts] = useState<Fact[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [openQuizModal, setOpenQuizModal] = useState(false);
  const [quizModalTopic, setQuizModalTopic] = useState<string | undefined>(
    undefined,
  );
  const factTypeIdRef = React.useRef<string | null>(null);

  // Initialize pagination at top level
  const pagination = usePagination({ itemsPerPage: 8 });
  // use shared lazy wrapper

  // Main categories and their subcategories
  const mainCategories = [
    {
      title: "Animals & Nature",
      icon: Dog,
      subs: [
        "Animal Intelligence",
        "Extinct Creatures",
        "World’s Smallest / Biggest Animals",
        "Fun Ocean Facts",
        "Nature’s Oddities",
      ],
    },
    {
      title: "Science & Technology",
      icon: FlaskConical,
      subs: [
        "Space Oddities",
        "Animal Superpowers",
        "Human Body Secrets",
        "Physics Phenomena",
        "Everyday Science Facts",
        "Internet Firsts",
        "Crazy Tech Inventions",
        "AI and Robots",
        "Space Exploration Facts",
        "Gaming & Pop Culture Facts",
      ],
    },
    {
      title: "History & Mystery",
      icon: Scroll,
      subs: [
        "Forgotten Inventions",
        "Historical Coincidences",
        "Ancient Mysteries",
        "Unexpected Origins",
        "Time Travel Theories",
      ],
    },
    {
      title: "Food & Flavors",
      icon: Apple,
      subs: [
        "Weird Foods People Actually Eat",
        "Origins of Famous Dishes",
        "Food Records",
        "Food Superstitions",
        "Global Street Foods",
      ],
    },
    {
      title: "Sports",
      icon: Trophy,
      subs: [
        "Unbelievable Sports Records",
        "Origin of Popular Sports",
        "Weird & Funny Sports Moments",
        "Unusual Sports Around the World",
        "Sports Equipment Facts",
        "Youngest & Oldest Athletes",
        "Olympic Oddities",
      ],
    },
    {
      title: "Geography",
      icon: Mountain,
      subs: [
        "Country Facts & Firsts",
        "Strangest Borders & Shapes",
        "Extreme Places on Earth",
        "Smallest & Largest Facts",
        "Unusual Natural Wonders",
        "Fun Flag Facts",
        "City Secrets",
      ],
    },
    {
      title: "Around the World",
      icon: MapPin,
      subs: [
        "Unknown Countries or Places",
        "World’s Smallest & Largest",
        "Facts About Time Zones",
        "Unique Festivals",
        "Most Isolated Places",
      ],
    },
    {
      title: "Weird & Wacky World",
      icon: Sparkles,
      subs: [
        "Bizarre World Laws",
        "Strange Customs & Traditions",
        "Unusual Sports",
        "Funniest Town Names",
        "Quirky Records",
      ],
    },
    {
      title: "Just for Fun",
      icon: Lightbulb,
      subs: [
        "Random “Did You Know?”",
        "Optical Illusions",
        "Fun Language Facts",
        "Funny Human Habits",
        "“Believe It or Not!” Corner",
      ],
    },
  ];

  const [openMain, setOpenMain] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLoading, setFilterLoading] = useState(false);

  // Handle filter changes with visual feedback
  const handleFilterChange = (newFilter: string) => {
    setFilterLoading(true);
    setFilterType(newFilter);
    setTimeout(() => setFilterLoading(false), 150);
  };

  // Component-level cache to avoid duplicate generation calls for the same subcategory
  const subCacheRef = new Map<string, unknown[]>();
  // Track in-flight promises to dedupe concurrent requests
  const pendingRef = new Map<string, Promise<unknown[]>>();

  // Listen for global cache-clear events from admin actions so this view can reload
  // If a category/subcategory is currently selected, re-fetch that data automatically.
  useEffect(() => {
    // Wrap async handler to avoid passing an async function directly to addEventListener
    const handler = () => {
      void (async () => {
        try {
          if (selectedCategory && selectedSub) {
            // re-fetch the currently-selected subcategory
            await handleSubClick(selectedCategory, selectedSub);
            return;
          }

          if (selectedCategory && !selectedSub) {
            // re-fetch the main category
            await handleMainFetch(selectedCategory);
            return;
          }

          // no selection: clear both global and local caches and reset UI
          clearFactsCacheAll();
          subCacheRef.clear();
          pendingRef.clear();
          setFacts([]);
          setSelectedCategory("");
          setSelectedSub(null);
          setIsLoading(false);
        } catch (err) {
          // ignore
        }
      })();
    };
    window.addEventListener("wf:facts-updated", handler as EventListener);
    return () =>
      window.removeEventListener("wf:facts-updated", handler as EventListener);
    // We intentionally depend on selectedCategory/selectedSub so the handler
    // always knows which view to refresh. Do not add handleMainFetch/handleSubClick
    // to deps to avoid re-registering on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSub]);

  // Update pagination when facts or selected subcategory changes
  useEffect(() => {
    const displayed = (facts || []).filter((f) => {
      if (selectedSub) {
        return !!(f && (f as { subcategory_id?: unknown })?.subcategory_id);
      }
      return !(f && (f as { subcategory_id?: unknown })?.subcategory_id);
    });
    pagination.setTotalItems(displayed.length);
  }, [facts, selectedSub]);

  const handleMainClick = (title: string) => {
    // navigate to category page
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const mc = mainCategories.find((m) => m.title === title);
    navigate(`/fun-facts/${slug}`, { state: { title, subs: mc?.subs || [] } });
  };

  // Helper to re-fetch facts for a main category (used by "Generate More Facts" button)
  const handleMainFetch = async (main: string) => {
    if (!main) return;
    setIsLoading(true);
    setFacts([]);
    try {
      const key = main;
      if (subCacheRef.has(key)) {
        const cached = subCacheRef.get(key) || [];
        setFacts(cached as Fact[]);
        toast({
          title: "Loaded from cache",
          description: `Loaded ${cached.length} cached facts for ${main}.`,
        });
        setIsLoading(false);
        return;
      }
      if (pendingRef.has(key)) {
        const pending = pendingRef.get(key)!;
        const result = await pending;
        setFacts((result || []) as Fact[]);
        toast({
          title: "Facts Loaded",
          description: `Loaded ${result?.length || 0} facts for ${main}.`,
        });
        return;
      }
      const promise = (async () => {
        // prefer ID-based lookup when available
        const opts: {
          ttl?: number;
          force?: boolean;
          fact_type_id?: string;
          category_id?: string;
          subcategory_id?: string;
        } = { force: true };
        if (factTypeIdRef.current) opts.fact_type_id = factTypeIdRef.current;
        const res = await fetchFactsByCategory("fun-facts", key, opts);
        subCacheRef.set(key, res || []);
        pendingRef.delete(key);
        return res || [];
      })();
      pendingRef.set(key, promise);
      const result = await promise;
      setFacts((result || []) as Fact[]);
      try {
        debug("[FunFacts] handleMainFetch setFacts", {
          key,
          count: (result || []).length,
          sample: (result || [])[0],
        });
      } catch (e) {
        /* ignored - debug only */
      }
      toast({
        title: "Facts Loaded",
        description: `Loaded ${result?.length || 0} facts for ${main}.`,
      });
    } catch (e) {
      error(e);
      toast({
        title: "Error",
        description: "Failed to reload facts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubClick = async (main: string, sub: string) => {
    setIsLoading(true);
    setSelectedCategory(main);
    setSelectedSub(sub);
    setFacts([]);
    try {
      // Use sub as the category key for facts generation to keep topics focused
      const key = `${main} — ${sub}`;

      // Return cached immediately if present
      if (subCacheRef.has(key)) {
        const cached = subCacheRef.get(key) || [];
        setFacts(cached as Fact[]);
        toast({
          title: "Loaded from cache",
          description: `Loaded ${cached.length} cached facts for ${sub}.`,
        });
        setIsLoading(false);
        return;
      }

      // If a pending request exists, await it instead of issuing another
      if (pendingRef.has(key)) {
        const pending = pendingRef.get(key)!;
        const result = await pending;
        setFacts((result || []) as Fact[]);
        toast({
          title: "Facts Loaded",
          description: `Loaded ${result?.length || 0} facts for ${sub}.`,
        });
        return;
      }

      const promise = (async () => {
        const opts: {
          ttl?: number;
          force?: boolean;
          fact_type_id?: string;
          category_id?: string;
          subcategory_id?: string;
        } = { force: true };
        if (factTypeIdRef.current) opts.fact_type_id = factTypeIdRef.current;
        const res = await fetchFactsByCategory("fun-facts", key, opts);
        subCacheRef.set(key, res || []);
        pendingRef.delete(key);
        return res || [];
      })();

      pendingRef.set(key, promise);
      const result = await promise;
      setFacts((result || []) as Fact[]);
      try {
        debug("[FunFacts] handleSubClick setFacts", {
          main,
          sub,
          count: (result || []).length,
          sample: (result || [])[0],
        });
      } catch (e) {
        /* ignored - debug only */
      }
      toast({
        title: "Facts Loaded",
        description: `Loaded ${result?.length || 0} facts for ${sub}.`,
      });
    } catch (e) {
      error(e);
      toast({
        title: "Error",
        description: "Failed to load facts for this subcategory.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // resolve fact_type id for 'fun-facts' once
    void (async () => {
      try {
        // Supabase response: allow `any` at SDK boundary
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r: any = await supabase
          .from("fact_types")
          .select("id")
          .eq("slug", "fun-facts")
          .maybeSingle();
        factTypeIdRef.current = r?.data?.id || null;
      } catch (e) {
        factTypeIdRef.current = null;
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Back button removed per request */}

            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  Fun Facts
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Discover amazing and entertaining facts from around the world
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {mainCategories.map((mc) => (
                <div key={mc.title} className="relative">
                  <CategoryCard
                    title={mc.title}
                    icon={mc.icon}
                    onClick={() => handleMainClick(mc.title)}
                  />

                  {/* Animated subcategory panel */}
                  <div
                    aria-hidden={openMain !== mc.title}
                    className={`absolute z-20 w-full mt-2 left-0 transition-all duration-300 ${
                      openMain === mc.title
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
                      <div className="grid grid-cols-1 gap-2">
                        {mc.subs.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              const mainSlug = mc.title
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/(^-|-$)/g, "");
                              const subSlug = sub
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/(^-|-$)/g, "");
                              navigate(`/fun-facts/${mainSlug}-${subSlug}`, {
                                state: { title: mc.title, subs: mc.subs },
                              });
                            }}
                            className="w-full text-left px-3 py-2 rounded hover:scale-105 transition-transform duration-150 bg-transparent"
                            style={{ backdropFilter: "blur(4px)" }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">
                                {sub}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                View
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inline Facts (show when a subcategory is selected) */}
            {selectedSub && (
              <div className="mt-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                    Facts about {selectedSub}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <label className="text-sm font-medium text-foreground">
                      View facts
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer transition-all hover:border-primary/50"
                    >
                      <option value="all">All facts</option>
                      <option value="newtoday">New today</option>
                      <option value="latest">Latest release</option>
                      <option value="notseen">Not seen yet</option>
                    </select>
                    {filterType !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFilterChange("all")}
                        className="text-xs h-8"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin" /> Generating facts...
                  </div>
                ) : filterLoading ? (
                  <PaginationSkeleton count={8} columns={2} height="120px" />
                ) : (
                  (() => {
                    // filter facts according to selectedSub: show only subcategory facts when a sub is selected,
                    // otherwise show only main-category facts (no subcategory_id).
                    const displayed = (facts || []).filter((f) => {
                      if (selectedSub) {
                        // sub views should show only items tied to a subcategory
                        return !!(
                          f &&
                          (f as { subcategory_id?: unknown })?.subcategory_id
                        );
                      }
                      // main category: show only facts not assigned to a subcategory
                      return !(
                        f && (f as Record<string, unknown>)?.subcategory_id
                      );
                    });

                    // Apply filter
                    const filtered = filterFacts(
                      displayed,
                      filterType,
                    ) as Fact[];

                    if (filtered.length === 0) {
                      return (
                        <Card className="p-6 text-center">
                          <p className="text-muted-foreground">
                            {getEmptyStateMessage(filterType)}
                          </p>
                        </Card>
                      );
                    }

                    return (
                      <div className="grid md:grid-cols-2 gap-4">
                        <React.Suspense fallback={<div />}>
                          {filtered.map((fact, idx) => (
                            <div
                              key={idx}
                              className="transform transition-all duration-400 opacity-0 animate-fade-in"
                              style={{ animationDelay: `${idx * 60}ms` }}
                              onMouseEnter={() =>
                                markFactViewed(
                                  String(fact.id || fact.fact_id || ""),
                                )
                              }
                            >
                              <LazyFactCard
                                fact={String(
                                  fact.fact_text ||
                                    fact.fact ||
                                    fact.title ||
                                    "",
                                )}
                              />
                            </div>
                          ))}
                        </React.Suspense>
                      </div>
                    );
                  })()
                )}
                {/* debug panel removed - rendering fixed */}
              </div>
            )}

            {/* Quiz CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 mt-8">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Test Your Knowledge!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Take a quiz based on fun facts and topics you like.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  className="transform transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_12px_30px_rgba(99,102,241,0.12)]"
                  onClick={() => {
                    // open inline quiz modal (random)
                    setQuizModalTopic(undefined);
                    setOpenQuizModal(true);
                  }}
                >
                  Play Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Fun Facts: {selectedCategory}
            </DialogTitle>
            <DialogDescription>
              Discover amazing and entertaining facts
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Generating fun facts...
              </span>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <React.Suspense fallback={<div />}>
                {facts.map((fact, index) => (
                  <div key={index} className="p-6">
                    <LazyFactCard
                      fact={String(
                        fact.fact_text || fact.fact || fact.title || "",
                      )}
                    />
                  </div>
                ))}
              </React.Suspense>
              {facts.length > 0 && (
                <Button
                  onClick={() => handleMainFetch(selectedCategory)}
                  variant="outline"
                  className="w-full"
                >
                  Generate More Facts
                </Button>
              )}
              {facts.length > 0 && (
                <div className="pt-4">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      // open inline quiz modal for the selected category
                      setQuizModalTopic(selectedCategory || undefined);
                      setOpenQuizModal(true);
                    }}
                    disabled={isGeneratingQuiz}
                  >
                    {isGeneratingQuiz ? "Generating..." : "Play Quiz"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <React.Suspense fallback={<div />}>
        <QuizModal
          open={openQuizModal}
          onOpenChange={setOpenQuizModal}
          topic={quizModalTopic}
          sourceType="fun"
        />
      </React.Suspense>
    </div>
  );
};

export default FunFacts;
