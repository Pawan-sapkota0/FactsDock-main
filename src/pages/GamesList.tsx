import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEOMeta } from "@/components/common/SEOMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Users, Star } from "lucide-react";

interface Game {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  players: string;
  rating?: number;
  featured?: boolean;
}

interface GameCategoryData {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  games: Game[];
}

const gameCategoriesData: Record<string, GameCategoryData> = {
  geography: {
    id: "geography",
    title: "Geography Explorer",
    description: "Test your geographical knowledge with location-based games",
    longDescription:
      "Master world geography through interactive games that challenge your knowledge of capitals, borders, landmarks, and natural features. Perfect for travelers, students, and geography enthusiasts.",
    games: [
      {
        id: "capital-challenge",
        name: "Capital Challenge",
        description:
          "Name the capitals of countries shown on the map. Test your knowledge with interactive hints and instant feedback.",
        duration: "5-10 min",
        difficulty: "Easy",
        players: "Solo",
        featured: true,
      },
      {
        id: "boundary-quest",
        name: "Boundary Quest",
        description:
          "Trace country borders and learn geographical boundaries. Perfect for understanding geopolitical landscapes.",
        duration: "10-15 min",
        difficulty: "Medium",
        players: "Solo",
      },
      {
        id: "landmark-hunter",
        name: "Landmark Hunter",
        description:
          "Identify famous landmarks from descriptions and images. Discover iconic sites from around the world.",
        duration: "8-12 min",
        difficulty: "Medium",
        players: "Solo",
        rating: 4.8,
      },
    ],
  },
  trivia: {
    id: "trivia",
    title: "World Trivia Master",
    description:
      "Challenge yourself with fascinating facts and cultural knowledge",
    longDescription:
      "Engage with rapid-fire trivia questions covering world history, cultures, languages, and fascinating facts. Build your knowledge while competing against time and scores.",
    games: [
      {
        id: "quick-quiz",
        name: "Quick Quiz",
        description:
          "Rapid-fire FactsDock facts with multiple-choice questions. Race against the clock to score maximum points.",
        duration: "3-5 min",
        difficulty: "Easy",
        players: "Solo",
        featured: true,
      },
      {
        id: "timeline-master",
        name: "Timeline Master",
        description:
          "Order historical events chronologically. Learn history while organizing events from around the world.",
        duration: "8-12 min",
        difficulty: "Hard",
        players: "Solo",
      },
      {
        id: "culture-connection",
        name: "Culture Connection",
        description:
          "Link traditions, festivals, and customs to their respective countries. Explore global cultural diversity.",
        duration: "10-15 min",
        difficulty: "Medium",
        players: "Solo",
        rating: 4.7,
      },
    ],
  },
  statistics: {
    id: "statistics",
    title: "Data Detective",
    description: "Uncover patterns through interactive statistics and data",
    longDescription:
      "Analyze real-world data and statistics about countries. Compare demographics, economies, and resources to develop analytical thinking skills.",
    games: [
      {
        id: "population-puzzle",
        name: "Population Puzzle",
        description:
          "Compare country populations and demographics. Learn about the world's population distribution.",
        duration: "10-15 min",
        difficulty: "Medium",
        players: "Solo",
        featured: true,
      },
      {
        id: "economy-explorer",
        name: "Economy Explorer",
        description:
          "Analyze economic data including GDP, trade, and resources. Understand global economic systems.",
        duration: "12-18 min",
        difficulty: "Hard",
        players: "Solo",
        rating: 4.6,
      },
      {
        id: "resource-rush",
        name: "Resource Rush",
        description:
          "Match natural resources to regions. Learn about global resource distribution and industries.",
        duration: "8-10 min",
        difficulty: "Medium",
        players: "Solo",
      },
    ],
  },
  discovery: {
    id: "discovery",
    title: "Knowledge Quest",
    description: "Embark on a journey of surprising discoveries",
    longDescription:
      "Uncover hidden gems and lesser-known facts about the world. Explore languages, celebrations, and unique characteristics of countries.",
    games: [
      {
        id: "hidden-gems",
        name: "Hidden Gems",
        description:
          "Discover lesser-known facts and interesting aspects of countries. Learn surprising trivia.",
        duration: "10-15 min",
        difficulty: "Medium",
        players: "Solo",
        featured: true,
      },
      {
        id: "language-lingo",
        name: "Language Lingo",
        description:
          "Explore world languages and learn greetings, phrases, and linguistic facts from different regions.",
        duration: "8-12 min",
        difficulty: "Easy",
        players: "Solo",
        rating: 4.9,
      },
      {
        id: "festival-finder",
        name: "Festival Finder",
        description:
          "Learn about global celebrations and festivals. Discover unique traditions from around the world.",
        duration: "10-12 min",
        difficulty: "Easy",
        players: "Solo",
      },
    ],
  },
};

const GamesList = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const category = categoryId ? gameCategoriesData[categoryId] : null;

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The game category you're looking for doesn't exist.
            </p>
            <Link
              to="/fun-zone"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Fun Zone
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300";
      case "Medium":
        return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300";
      case "Hard":
        return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300";
    }
  };

  const categoryData = gameCategoriesData[categoryId] || {
    title: "Games",
    description: "Interactive Educational Games",
    longDescription:
      "Play interactive educational games to learn about the world.",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMeta
        title={`FactsDock | ${categoryData.title}`}
        description={categoryData.longDescription}
        keywords={`${categoryData.title.toLowerCase()}, educational games, quizzes, learning`}
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
      />
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Navigation */}
            <Link
              to="/fun-zone"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Fun Zone
            </Link>

            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {category.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {category.longDescription}
              </p>
            </div>

            {/* Games Grid */}
            <div className="space-y-6">
              {category.games.map((game) => (
                <Card
                  key={game.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl md:text-2xl">
                            {game.name}
                          </CardTitle>
                          {game.featured && (
                            <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {game.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      {/* Duration */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground/80">
                          {game.duration}
                        </span>
                      </div>

                      {/* Difficulty */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${getDifficultyColor(game.difficulty)}`}
                        >
                          {game.difficulty}
                        </span>
                      </div>

                      {/* Players */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground/80">
                          {game.players}
                        </span>
                      </div>

                      {/* Rating */}
                      {game.rating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-foreground/80">
                            {game.rating}
                          </span>
                        </div>
                      )}

                      {/* Play Button */}
                      <button
                        disabled
                        className="ml-auto px-4 py-2 bg-muted text-muted-foreground rounded-lg cursor-not-allowed opacity-60 font-medium text-sm"
                      >
                        Play Now
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info section */}
            <div className="mt-12 md:mt-16 p-6 md:p-8 bg-muted/30 rounded-lg border border-muted">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Note:</span>{" "}
                Games are in development. Start exploring to be among the first
                to try these interactive learning experiences.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GamesList;
