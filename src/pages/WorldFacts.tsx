import React, { useState, useEffect } from "react";
import {
  Mountain,
  Scroll,
  FlaskConical,
  Users,
  Newspaper,
  BarChart,
  ArrowLeft,
  Loader2,
  Dog,
  Apple,
  Trophy,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PreFooterCTA from "@/components/layout/PreFooterCTA";
import CategoryCard from "@/components/cards/CategoryCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clearFactsCacheAll } from "@/lib/api";
import logger from "@/lib/logger";
import { fetchFactsByCategory } from "@/lib/facts";
import LazyFactCard from "@/components/cards/LazyFactCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { SEOMeta } from "@/components/common/SEOMeta";
// import { generateQuiz } from '@/lib/quiz';
const QuizModal = React.lazy(() => import("@/components/QuizModal"));

const WorldFacts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [facts, setFacts] = useState<unknown[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [openQuizModal, setOpenQuizModal] = useState(false);
  const [quizModalTopic, setQuizModalTopic] = useState<string | undefined>(
    undefined,
  );

  // New main categories + subcategories (9 primary groups)
  const mainCategories = [
    {
      title: "Geography & Nature",
      icon: Mountain,
      subs: [
        "Countries & Capitals",
        "Mountains & Volcanoes",
        "Rivers, Lakes & Oceans",
        "Deserts & Forests",
        "Natural Wonders",
        "Continents & Islands",
      ],
    },
    {
      title: "History & Culture",
      icon: Scroll,
      subs: [
        "Ancient Civilizations",
        "Historical Events",
        "Monuments & Heritage Sites",
        "Festivals & Traditions",
        "Languages of the World",
        "Flags & Symbols",
      ],
    },
    {
      title: "Science & Discovery",
      icon: FlaskConical,
      subs: [
        "Space & Planets",
        "Inventions & Discoveries",
        "Wildlife & Ecosystems",
        "Climate & Weather",
        "Human Body Facts",
        "Technology & Innovation",
      ],
    },
    {
      title: "People & Society",
      icon: Users,
      subs: [
        "Famous Personalities",
        "World Records",
        "Population & Cities",
        "Education & Lifestyle",
        "Global Economy",
        "Travel & Tourism",
      ],
    },
    {
      title: "Foods & Flavors",
      icon: Apple,
      subs: [
        "Nutrition & Healthy Foods",
        "Global Cuisines & Ingredients",
        "Food History & Origins",
        "Agricultural Practices",
        "Food Production & Sustainability",
        "Famous Dishes Around the World",
        "Food Science & Chemistry",
      ],
    },
    {
      title: "Animals & Wildlife",
      icon: Dog,
      subs: [
        "Animal Habitats & Behavior",
        "Endangered Species",
        "Animal Adaptations",
        "Interesting Animal Facts",
        "Wildlife Conservation",
        "Animal Classification & Types",
        "Animal Life Cycles",
      ],
    },
    {
      title: "Art, Music & Entertainment",
      icon: Sparkles,
      subs: [
        "World Art & Museums",
        "Global Music Genres",
        "Movies & Media",
        "Literature & Books",
        "Architecture Styles",
      ],
    },
    {
      title: "National Data",
      icon: BarChart,
      subs: [
        "Population Statistics",
        "Literacy & Education Rates",
        "Economic Data & GDP",
        "Health & Life Expectancy",
        "Employment & Industry Facts",
        "Geography & Land Area",
        "Government & Political Structure",
      ],
    },
    {
      title: "Fun Zones",
      icon: Trophy,
      subs: [
        "“Did You Know?” Series",
        "Mind-Blowing Facts",
        "Unsolved Mysteries",
        "Myths & Legends",
        "Random Global Curiosities",
      ],
    },
  ];

  const [openMain, setOpenMain] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const factTypeIdRef = React.useRef<string | null>(null);
  // use shared lazy wrapper

  // Component-level cache and pending map for subcategory results
  const subCacheRef = new Map<string, unknown[]>();
  const pendingRef = new Map<string, Promise<unknown[]>>();

  // Listen for global cache-clear events (admin approvals/deletes)
  useEffect(() => {
    // Wrap the async logic so we don't pass an async function directly to addEventListener
    const handler = () => {
      void (async () => {
        try {
          // If a category/sub is selected, re-fetch it. Otherwise clear caches/state.
          if (selectedCategory && selectedSub) {
            await handleSubClick(selectedCategory, selectedSub);
            return;
          }

          if (selectedCategory && !selectedSub) {
            await handleMainFetch(selectedCategory);
            return;
          }

          // fallback: clear both global and local caches
          clearFactsCacheAll();
          subCacheRef.clear();
          setFacts([]);
          setSelectedCategory("");
          setSelectedSub(null);
        } catch (err) {
          // ignore
        }
      })();
    };
    window.addEventListener("wf:facts-updated", handler as EventListener);
    return () =>
      window.removeEventListener("wf:facts-updated", handler as EventListener);
    // Depend on selectedCategory/selectedSub so the handler knows what to refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSub]);

  const handleMainClick = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const mc = mainCategories.find((m) => m.title === title);
    navigate(`/world-facts/${slug}`, {
      state: { title, subs: mc?.subs || [] },
    });
  };

  const handleSubClick = async (main: string, sub: string) => {
    setIsLoading(true);
    setSelectedCategory(main);
    setSelectedSub(sub);
    setFacts([]);
    try {
      const key = `${main} — ${sub}`;

      if (subCacheRef.has(key)) {
        const cached = subCacheRef.get(key) || [];
        setFacts(cached);
        toast({
          title: "Loaded from cache",
          description: `Loaded ${cached.length} cached facts for ${sub}.`,
        });
        setIsLoading(false);
        return;
      }

      if (pendingRef.has(key)) {
        const pending = pendingRef.get(key)!;
        const result = await pending;
        setFacts(result || []);
        toast({
          title: "Facts Loaded",
          description: `Loaded ${result?.length || 0} facts for ${sub}.`,
        });
        return;
      }

      // Ensure the numeric fact_type id is resolved so we pass it explicitly
      // to fetchFactsByCategory. This avoids permissive cross-type matches
      // when the UI intends to only show 'world-facts' rows.
      if (!factTypeIdRef.current) {
        try {
          // Supabase response: allow `any` at SDK boundary
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r: any = await supabase
            .from("fact_types")
            .select("id")
            .ilike("slug", "world-facts")
            .maybeSingle();
          factTypeIdRef.current = r?.data?.id || null;
        } catch (err) {
          // ignore — we'll continue without an explicit id
        }
      }

      const promise = (async () => {
        const opts = { force: true, fact_type_id: factTypeIdRef.current };
        const res = await fetchFactsByCategory("world-facts", key, opts);
        subCacheRef.set(key, res || []);
        pendingRef.delete(key);
        return res || [];
      })();

      pendingRef.set(key, promise);
      const result = await promise;
      setFacts(result || []);
      toast({
        title: "Facts Loaded",
        description: `Loaded ${result?.length || 0} facts for ${sub}.`,
      });
    } catch (error) {
      logger.error("Error generating facts:", error);
      toast({
        title: "Error",
        description: "Failed to load facts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        setFacts(cached);
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
        setFacts(result || []);
        toast({
          title: "Facts Loaded",
          description: `Loaded ${result?.length || 0} facts for ${main}.`,
        });
        return;
      }
      // Ensure the numeric fact_type id is resolved so we pass it explicitly
      // to fetchFactsByCategory. This avoids permissive cross-type matches
      // when the UI intends to only show 'world-facts' rows.
      if (!factTypeIdRef.current) {
        try {
          // Supabase response: allow `any` at SDK boundary
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r: any = await supabase
            .from("fact_types")
            .select("id")
            .ilike("slug", "world-facts")
            .maybeSingle();
          factTypeIdRef.current = r?.data?.id || null;
        } catch (err) {
          // ignore — we'll continue without an explicit id
        }
      }

      const promise = (async () => {
        const opts = { force: true, fact_type_id: factTypeIdRef.current };
        const res = await fetchFactsByCategory("world-facts", key, opts);
        subCacheRef.set(key, res || []);
        pendingRef.delete(key);
        return res || [];
      })();
      pendingRef.set(key, promise);
      const result = await promise;
      setFacts(result || []);
      toast({
        title: "Facts Loaded",
        description: `Loaded ${result?.length || 0} facts for ${main}.`,
      });
    } catch (error) {
      logger.error("Error generating facts:", error);
      toast({
        title: "Error",
        description: "Failed to reload facts. Please try again.",
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

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta
        title="FactsDock | World Facts & Global Information"
        description="Discover comprehensive facts about countries, geography, history, culture, science, and world knowledge. Educational facts for learners of all ages."
        keywords="world facts, country facts, geography facts, global information"
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
      />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Back button removed per request */}

            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  World Facts
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Explore comprehensive facts and data about our world
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {mainCategories.map((mc) => (
                <div key={mc.title} className="relative">
                  <CategoryCard
                    title={mc.title}
                    icon={mc.icon}
                    onClick={() => handleMainClick(mc.title)}
                  />

                  {/* Subcategory panel */}
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
                              // show inline subcategory facts in this page and also push the route
                              void handleSubClick(mc.title, sub);
                              const mainSlug = mc.title
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/(^-|-$)/g, "");
                              const subSlug = sub
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/(^-|-$)/g, "");
                              navigate(`/world-facts/${mainSlug}-${subSlug}`, {
                                state: { title: mc.title, subs: mc.subs },
                              });
                            }}
                            className="w-full text-left px-3 py-2 rounded hover:scale-105 transition-transform duration-150 bg-transparent"
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

            {/* Inline Facts (when a subcategory is selected) */}
            {selectedSub && (
              <div className="mt-6">
                <div className="mb-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                    Facts about {selectedSub}
                  </h2>
                </div>

                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin" /> Generating facts...
                  </div>
                ) : (
                  (() => {
                    const displayed = (facts || []).filter((f) => {
                      if (selectedSub) {
                        return !!(
                          f &&
                          (f as { subcategory_id?: unknown })?.subcategory_id
                        );
                      }
                      return !(
                        f && (f as { subcategory_id?: unknown })?.subcategory_id
                      );
                    });
                    return (
                      <div className="grid md:grid-cols-2 gap-4">
                        <React.Suspense fallback={<div />}>
                          {displayed.map((fact: unknown, idx: number) => {
                            const row = fact as {
                              fact_text?: unknown;
                              fact?: unknown;
                              title?: unknown;
                            };
                            return (
                              <div
                                key={idx}
                                className="transform transition-all duration-400 opacity-0 animate-fade-in"
                                style={{ animationDelay: `${idx * 60}ms` }}
                              >
                                <LazyFactCard
                                  fact={String(
                                    row?.fact_text ??
                                      row?.fact ??
                                      row?.title ??
                                      "",
                                  )}
                                />
                              </div>
                            );
                          })}
                        </React.Suspense>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Quiz CTA */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 mt-8">
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Test Your Knowledge!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Take a quiz based on world facts and topics you like.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  className="transform transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_12px_30px_rgba(99,102,241,0.12)]"
                  onClick={() => {
                    navigate("/quiz/play/world");
                  }}
                >
                  Play Quiz
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              World Facts: {selectedCategory}
            </DialogTitle>
            <DialogDescription>
              Educational facts about our world
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Generating world facts...
              </span>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {(() => {
                const showingSub = !!selectedSub;
                const displayed = (facts || []).filter((f) => {
                  if (showingSub)
                    return !!(
                      f && (f as Record<string, unknown>)?.subcategory_id
                    );
                  return !(f && (f as Record<string, unknown>)?.subcategory_id);
                });
                return (
                  <React.Suspense fallback={<div />}>
                    {displayed.map((fact, index) => (
                      <div key={index} className="p-6">
                        <LazyFactCard
                          fact={String(
                            (fact as Record<string, unknown>)?.fact_text ??
                              (fact as Record<string, unknown>)?.fact ??
                              (fact as Record<string, unknown>)?.title ??
                              "",
                          )}
                        />
                      </div>
                    ))}
                  </React.Suspense>
                );
              })()}
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

      <PreFooterCTA />
      <Footer />
      <React.Suspense fallback={<div />}>
        <QuizModal
          open={openQuizModal}
          onOpenChange={setOpenQuizModal}
          topic={quizModalTopic}
          sourceType="world"
        />
      </React.Suspense>
    </div>
  );
};

export default WorldFacts;
