import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Clock3, Calendar, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOMeta } from "@/components/common/SEOMeta";
import { storiesAPI, Story } from "@/lib/stories-api";
import logger from "@/lib/logger";

const StoryDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [notFound, setNotFound] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!slug) return;
    loadStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadStory = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const data = await storiesAPI.getStoryBySlug(slug!);
      setStory(data);
    } catch (error) {
      logger.error("[StoryDetail] Failed to load story", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getTextFromNode = (node: any): string => {
    if (!node) return "";
    if (typeof node.text === "string") return node.text;
    if (Array.isArray(node.content)) {
      return node.content.map(getTextFromNode).join("");
    }
    return "";
  };

  const getBodyFromContent = (content: any): string => {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (typeof content.body === "string" && content.body.trim())
      return content.body;
    if (Array.isArray(content.sections)) {
      return content.sections
        .map((section) => section.body)
        .filter(Boolean)
        .join("\n\n");
    }
    if (content.type === "doc" && Array.isArray(content.content)) {
      const paragraphs: string[] = [];
      const traverse = (node: any) => {
        if (!node) return;
        const text = getTextFromNode(node).trim();
        if (text && (node.type === "paragraph" || node.type === "heading")) {
          paragraphs.push(text);
          return;
        }
        if (Array.isArray(node.content)) {
          node.content.forEach(traverse);
        }
      };
      content.content.forEach(traverse);
      return paragraphs.join("\n\n");
    }
    return "";
  };

  const storyBody = story ? getBodyFromContent(story.content) : "";

  const storyHighlights = story
    ? typeof story.content === "string"
      ? []
      : story.content?.highlights || []
    : [];

  useEffect(() => {
    if (!story) return;
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const current = Math.min(
        100,
        Math.max(0, (window.scrollY / totalHeight) * 100),
      );
      setProgress(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [story]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <main className="container mx-auto px-4 py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading story...</p>
        </main>
      </div>
    );
  }

  if (!story || notFound) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">Story not found</h1>
          <p className="mt-4 text-muted-foreground">
            The story you’re looking for isn’t available yet.
          </p>
          <div className="mt-8 flex justify-center">
            <Button variant="default" onClick={() => navigate("/stories")}>
              Return to Stories
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <SEOMeta
        title={`${story.title} | Stories Worth Exploring`}
        description={story.description}
        keywords={[
          story.story_categories?.name || "Stories",
          "stories",
          "facts",
          "education",
        ]}
      />

      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md">
        <div className="h-1 w-full bg-slate-200">
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_330px]">
          <article className="space-y-12">
            <div className="rounded-[2rem] overflow-hidden shadow-2xl">
              <img
                src={story.cover_image}
                alt={story.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-slate-300/80 bg-slate-100/80 px-3 py-1 text-slate-700">
                  {story.story_categories?.name || "Story"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock3 className="h-4 w-4" />
                  {story.reading_time}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {story.publish_date
                    ? new Date(story.publish_date).toLocaleDateString()
                    : new Date(story.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {story.author}
                </span>
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
                {story.title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                {story.description}
              </p>
            </div>

            <div className="space-y-14">
              {storyBody ? (
                <section className="space-y-6">
                  <div className="prose prose-lg max-w-none">
                    {storyBody.split("\n\n").map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-base leading-8 text-muted-foreground mb-4"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {storyHighlights && storyHighlights.length > 0 && (
                    <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Key Highlights
                      </h3>
                      <ul className="space-y-2">
                        {storyHighlights.map((highlight, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>
                            <span className="text-sm text-muted-foreground">
                              {highlight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              ) : (
                <p className="text-base leading-8 text-muted-foreground">
                  No content available for this story yet.
                </p>
              )}
            </div>
          </article>

          <aside className="space-y-8">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Quick Read</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                This story is designed for an immersive reading experience.
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-3xl bg-slate-950/10 p-4">
                  <span className="text-sm text-muted-foreground">
                    Category
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {story.story_categories?.name || "Story"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-950/10 p-4">
                  <span className="text-sm text-muted-foreground">
                    Reading time
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {story.reading_time}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-950/10 p-4">
                  <span className="text-sm text-muted-foreground">
                    Published
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {story.publish_date
                      ? new Date(story.publish_date).toLocaleDateString()
                      : new Date(story.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Continue exploring
              </p>
              <div className="mt-6 space-y-3">
                <Link
                  to="/stories"
                  className="block rounded-3xl bg-slate-950/5 p-4 transition hover:bg-slate-950/10"
                >
                  <p className="text-sm text-muted-foreground">
                    Back to stories
                  </p>
                  <p className="mt-2 font-semibold text-foreground">
                    View all stories
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary">
                    <span>Continue Exploring</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default StoryDetail;
