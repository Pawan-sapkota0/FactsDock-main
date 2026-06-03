import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import StoryCard from "@/components/stories/StoryCard";
import { Button } from "@/components/ui/button";
import { SEOMeta } from "@/components/common/SEOMeta";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PAGE_TEMPLATES } from "@/lib/seo-utils";
import { storiesAPI, Story, StoryCategory } from "@/lib/stories-api";
import { storyCategoriesAPI } from "@/lib/stories-api";
import logger from "@/lib/logger";

const Stories = () => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    loadData();

    timeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      setError("Loading stories is taking longer than expected.");
    }, 20000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [storiesData, categoriesData] = await Promise.all([
        storiesAPI.getPublishedStories(),
        storyCategoriesAPI.getAll(),
      ]);
      setStories(storiesData);
      setCategories(categoriesData);
    } catch (err) {
      logger.error("[Stories] Failed to load data", err);
      setStories([]);
      setCategories([]);
      setError(err instanceof Error ? err.message : "Failed to load stories");
    } finally {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
    }
  };

  const categoryNames = useMemo(
    () => ["All", ...categories.map((c) => c.name)],
    [categories],
  );

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesCategory =
        selectedCategory === "All" ||
        story.story_categories?.name === selectedCategory;
      const matchesQuery =
        query.trim().length === 0 ||
        [story.title, story.description, story.story_categories?.name]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory, stories]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEOMeta
        title="Stories Worth Exploring | FactsDock"
        description="Discover fascinating stories, hidden truths, surprising history, science, cultures, and mysteries from around the world."
        keywords="stories, articles, facts, history, science, culture"
      />
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-slate-950 text-white py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 opacity-95" />
          <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-primary/90 mb-4">
                Stories
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Stories Worth Exploring
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Discover fascinating stories, hidden truths, surprising history,
                science, cultures, and mysteries from around the world.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/stories/the-dark-truth-behind-ancient-rome">
                  <Button variant="default" size="lg" className="shadow-xl">
                    Explore the lead story
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Search stories by title, category, or keyword"
                className="h-14 w-full rounded-3xl border border-border bg-card/90 px-12 text-base text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                disabled={loading}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {categoryNames.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  disabled={loading}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
                    selectedCategory === category
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/70 hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            /* Loading skeleton */
            <div className="mt-10 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading stories...
              </p>
            </div>
          ) : error ? (
            /* Error state */
            <div className="mt-16 rounded-[2rem] border border-destructive/40 bg-destructive/5 p-12 text-center">
              <p className="text-lg font-semibold text-foreground">
                Unable to load stories at the moment.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : stories.length === 0 ? (
            /* No stories available */
            <div className="mt-16 rounded-[2rem] border border-dashed border-slate-300 bg-white/50 p-12 text-center">
              <p className="text-lg font-semibold text-foreground">
                No stories available yet.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon for new stories!
              </p>
            </div>
          ) : filteredStories.length === 0 ? (
            /* No stories match filter */
            <div className="mt-16 rounded-[2rem] border border-border bg-card p-12 text-center">
              <p className="text-lg font-semibold text-foreground">
                No stories match your search.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a new keyword or explore another category.
              </p>
            </div>
          ) : (
            /* Display stories */
            <>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {filteredStories.length}{" "}
                    {filteredStories.length === 1 ? "story" : "stories"}{" "}
                    available
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    Curated stories for curious minds.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Filter:</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    {selectedCategory}
                  </span>
                </div>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredStories.map((story) => (
                  <StoryCard key={story.slug} story={story} />
                ))}
              </div>
            </>
          )}
        </section>
        <Footer />
      </main>
    </div>
  );
};

export default Stories;
