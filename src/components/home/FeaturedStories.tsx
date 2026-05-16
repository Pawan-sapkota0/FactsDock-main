import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { storiesAPI, Story } from "@/lib/stories-api";
import logger from "@/lib/logger";

// Skeleton loader component
const StorySkeleton = () => (
  <div className="rounded-[2rem] border border-border bg-card overflow-hidden h-72">
    <div className="h-full w-full bg-muted animate-pulse" />
  </div>
);

const StoryCard = ({ story }: { story: Story }) => {
  return (
    <Link
      to={`/stories/${story.slug}`}
      aria-label={story.title}
      className="group block overflow-hidden rounded-[2rem] border border-slate-200 bg-card shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative overflow-hidden h-72">
        <img
          src={story.cover_image}
          alt={story.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
          <span>{story.story_categories?.name || "Story"}</span>
          <span>·</span>
          <span>{story.reading_time}</span>
        </div>
        <h3 className="mt-4 text-2xl font-semibold leading-tight text-foreground transition-colors duration-300 group-hover:text-primary">
          {story.title}
        </h3>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {story.description}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-300 group-hover:translate-x-1">
          <span>Read Story</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
};

const FeaturedStories: React.FC = () => {
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    loadFeaturedStories();

    timeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      setLoadError("Loading stories is taking longer than expected.");
    }, 20000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadFeaturedStories = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await storiesAPI.getFeaturedStories();
      setFeaturedStories(data.slice(0, 3));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load featured stories";
      logger.error("[FeaturedStories] Failed to load featured stories", error);
      setFeaturedStories([]);
      setLoadError(message);
    } finally {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              🔥 Featured Stories
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Explore fascinating stories, hidden truths, and surprising
              discoveries from around the world.
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="whitespace-nowrap"
            >
              <Link to="/stories">View All Stories →</Link>
            </Button>
          </div>
        </div>

        {/* Show skeleton loaders while loading */}
        {loading && featuredStories.length === 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center">
            <p className="text-lg font-semibold text-foreground">
              Unable to load featured stories
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          </div>
        ) : featuredStories.length > 0 ? (
          /* Show actual stories when loaded */
          <div className="grid gap-6 lg:grid-cols-3">
            {featuredStories[0] && <StoryCard story={featuredStories[0]} />}
            {featuredStories[1] && <StoryCard story={featuredStories[1]} />}
            {featuredStories[2] && <StoryCard story={featuredStories[2]} />}
          </div>
        ) : (
          /* Show minimal empty state if no stories */
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Featured stories coming soon. Check back later!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedStories;
