import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Story } from "@/lib/stories-api";

const StoryCard = ({ story }: { story: Story }) => {
  return (
    <Link
      to={`/stories/${story.slug}`}
      className="group block overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="relative overflow-hidden h-64 transition-transform duration-500 group-hover:scale-[1.02]">
        <img
          src={story.cover_image}
          alt={story.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <div className="absolute left-4 bottom-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
          <span className="rounded-full bg-slate-900/70 px-3 py-1">
            {story.story_categories?.name || "Story"}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            {story.reading_time}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-7">
        <h3 className="text-2xl font-semibold leading-tight text-foreground transition-colors duration-300 group-hover:text-primary">
          {story.title}
        </h3>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {story.description}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-300 group-hover:translate-x-1">
          <span>Read Story</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
};

export default StoryCard;
