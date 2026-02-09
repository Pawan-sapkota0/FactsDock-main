import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import GameCategoryCard from "@/components/cards/GameCategoryCard";
import { Brain, MapPin, BarChart3, Lightbulb } from "lucide-react";
import { SEOMeta } from "@/components/common/SEOMeta";
import { PAGE_TEMPLATES, generateArticleSchema } from "@/lib/seo-utils";

interface GameCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  games: string[];
  description: string;
  accentColor: string;
}

const gameCategories: GameCategory[] = [
  {
    id: "geography",
    title: "Geography Explorer",
    icon: <MapPin className="text-muted-foreground" />,
    games: [
      "Capital Challenge - Name the capitals",
      "Boundary Quest - Trace country borders",
      "Landmark Hunter - Identify famous sites",
    ],
    description: "Test your geographical knowledge with location-based games",
    accentColor: "from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950",
  },
  {
    id: "trivia",
    title: "World Trivia Master",
    icon: <Brain className="text-muted-foreground" />,
    games: [
      "Quick Quiz - Rapid-fire FactsDock facts",
      "Timeline Master - Order historical events",
      "Culture Connection - Link traditions to countries",
    ],
    description:
      "Challenge yourself with fascinating facts and cultural knowledge",
    accentColor:
      "from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950",
  },
  {
    id: "statistics",
    title: "Data Detective",
    icon: <BarChart3 className="text-muted-foreground" />,
    games: [
      "Population Puzzle - Compare country demographics",
      "Economy Explorer - Analyze economic data",
      "Resource Rush - Match natural resources to regions",
    ],
    description: "Uncover patterns through interactive statistics and data",
    accentColor:
      "from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950",
  },
  {
    id: "discovery",
    title: "Knowledge Quest",
    icon: <Lightbulb className="text-muted-foreground" />,
    games: [
      "Hidden Gems - Discover lesser-known facts",
      "Language Lingo - Explore world languages",
      "Festival Finder - Learn global celebrations",
    ],
    description: "Embark on a journey of surprising discoveries",
    accentColor:
      "from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950",
  },
];

const FunZone = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMeta
        title={PAGE_TEMPLATES.funzone.title}
        description={PAGE_TEMPLATES.funzone.description}
        keywords={PAGE_TEMPLATES.funzone.keywords}
        ogImage={`${window.location.origin}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Fun Zone - Educational Games & Quizzes",
          description:
            "Enjoy interactive games and quizzes to learn about the world in a fun way. Perfect for students and curious minds.",
          datePublished: new Date().toISOString(),
        })}
      />
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  Fun Zone
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Play, learn, and refresh your mind with interactive games
              </p>
              <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl mx-auto">
                Explore different categories of educational games designed to
                make learning engaging and enjoyable
              </p>
            </div>

            {/* Game Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
              {gameCategories.map((category) => (
                <GameCategoryCard
                  key={category.id}
                  title={category.title}
                  icon={category.icon}
                  games={category.games}
                  categoryId={category.id}
                  description={category.description}
                  accentColor={category.accentColor}
                />
              ))}
            </div>

            {/* Info section */}
            <div className="mt-16 md:mt-20 p-6 md:p-8 bg-muted/30 rounded-lg border border-muted text-center max-w-3xl mx-auto">
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Each category offers a unique learning experience combining
                entertainment with educational value. Start with any category
                that interests you and discover new facts about our world.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FunZone;
