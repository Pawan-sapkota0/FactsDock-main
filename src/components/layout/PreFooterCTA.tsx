import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Compass } from "lucide-react";

const PreFooterCTA = () => {
  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background to-card/50 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
          {/* Badge/Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-lg">✨</span>
            <span className="text-xs md:text-sm font-semibold text-primary">
              Explore Knowledge Without Limits
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Discover facts, countries, and quizzes on{" "}
              <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                FactsDock
              </span>
            </h2>

            {/* Supporting Description */}
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Learn fascinating world facts, explore detailed country insights,
              and challenge yourself with fun quizzes : all in one place.
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center max-w-sm sm:max-w-none mx-auto">
            <Link to="/world-facts" className="flex-1 sm:flex-none">
              <Button
                variant="default"
                size="lg"
                className="w-full sm:w-auto gap-2 font-semibold"
              >
                <Compass className="h-4 w-4" />
                Start Exploring
              </Button>
            </Link>
            <Link to="/quiz" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 font-semibold"
              >
                <Play className="h-4 w-4" />
                Play a Quiz
              </Button>
            </Link>
          </div>

          {/* Trust / Reassurance Text */}
          <div className="pt-4 border-t border-border/30">
            <p className="text-xs md:text-sm text-muted-foreground font-medium tracking-wide">
              Free to explore • No sign-up required • Learn at your pace
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreFooterCTA;
