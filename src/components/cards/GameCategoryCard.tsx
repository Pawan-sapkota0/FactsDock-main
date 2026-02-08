import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ReactNode } from "react";

interface GameCategoryCardProps {
  title: string;
  icon: ReactNode;
  games: string[];
  categoryId: string;
  description?: string;
  accentColor?: string; // Tailwind color class
}

const GameCategoryCard = ({
  title,
  icon,
  games,
  categoryId,
  description,
  accentColor = "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
}: GameCategoryCardProps) => {
  return (
    <Card className="relative overflow-hidden h-full border border-border hover:shadow-lg transition-all duration-300 hover:border-foreground/20 bg-transparent">
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1 text-xl md:text-2xl text-muted-foreground">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-semibold text-foreground truncate">
                {title}
              </h3>
              {description && (
                <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        {/* Games list */}
        <div className="space-y-2 mb-4">
          {games.map((game, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-sm text-foreground/80"
            >
              <span className="text-muted-foreground font-bold flex-shrink-0">
                •
              </span>
              <span className="leading-snug">{game}</span>
            </div>
          ))}
        </div>

        {/* Explore link */}
        <Link
          to={`/games/${categoryId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/70 transition-colors group"
        >
          Explore
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  );
};

export default GameCategoryCard;
