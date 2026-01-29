import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import GameCategoryCard from "@/components/cards/GameCategoryCard";
import DidYouKnowCard from "@/components/cards/DidYouKnowCard";
import DidYouKnowModal from "@/components/modals/DidYouKnowModal";
import { Brain, MapPin, BarChart3, Lightbulb } from "lucide-react";
import { generateRandomQuiz } from "@/lib/api";
import { SEOMeta } from "@/components/common/SEOMeta";
import logger from "@/lib/logger";
import { PAGE_TEMPLATES, generateArticleSchema } from "@/lib/seo-utils";

interface GameCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  games: string[];
  description: string;
  accentColor: string;
}

interface DidYouKnowQuestion {
  id: string;
  question: string;
  answer: string;
}

const gameCategories: GameCategory[] = [
  {
    id: "geography",
    title: "Geography Explorer",
    icon: <MapPin className="text-blue-600 dark:text-blue-400" />,
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
    icon: <Brain className="text-purple-600 dark:text-purple-400" />,
    games: [
      "Quick Quiz - Rapid-fire world facts",
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
    icon: <BarChart3 className="text-emerald-600 dark:text-emerald-400" />,
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
    icon: <Lightbulb className="text-amber-600 dark:text-amber-400" />,
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

// Fallback questions in case database fetch fails
const fallbackQuestions: DidYouKnowQuestion[] = [
  {
    id: "1",
    question: "What is the smallest country in the world?",
    answer:
      "Vatican City is the smallest country by area (0.44 sq km) with a population of about 800 people.",
  },
  {
    id: "2",
    question: "Which country has the most time zones?",
    answer:
      "France has 12 time zones due to its overseas territories spread across the Pacific and Indian Oceans.",
  },
  {
    id: "3",
    question: "What is the most spoken language by native speakers?",
    answer:
      "Mandarin Chinese has the most native speakers with approximately 920 million speakers worldwide.",
  },
  {
    id: "4",
    question: "Which continent has the most countries?",
    answer:
      "Africa has 54 recognized sovereign states, making it the continent with the most countries.",
  },
  {
    id: "5",
    question: "Which country produces the most coffee globally?",
    answer:
      "Brazil produces about one-third of the world's coffee supply with over 27 billion coffee plants.",
  },
  {
    id: "6",
    question: "What is the oldest continuously inhabited capital city?",
    answer:
      "Damascus, Syria is considered the world's oldest continuously inhabited capital, dating back to 7,000 BC.",
  },
];

/**
 * Convert a quiz question from the database into a DidYouKnow format
 * Extracts the question text and correct answer from the quiz data structure
 * Database stores questions with: { question, options[], correct_answer }
 */
function convertQuizToDidYouKnow(quiz: unknown): DidYouKnowQuestion | null {
  if (!quiz || typeof quiz !== "object") return null;
  const q = quiz as Record<string, unknown>;
  const question =
    typeof q.question === "string"
      ? q.question
      : typeof q.question === "object" && q.question
        ? String(q.question)
        : "";
  if (!question) return null;

  let answer = "No answer available";

  const correct_answer = q.correct_answer;
  const answerField = q.answer;
  const correctAnswer = q.correctAnswer;
  const options = Array.isArray(q.options)
    ? (q.options as unknown[])
    : undefined;

  if (typeof correct_answer === "string" && correct_answer.trim().length > 0) {
    answer = correct_answer;
  } else if (typeof answerField === "string" && answerField.trim().length > 0) {
    answer = answerField;
  } else if (
    typeof correctAnswer === "number" &&
    Array.isArray(options) &&
    options.length > correctAnswer
  ) {
    answer = String(options[correctAnswer]);
  } else if (
    typeof correctAnswer === "string" &&
    correctAnswer.trim().length > 0
  ) {
    answer = correctAnswer;
  } else if (Array.isArray(answerField)) {
    const valid = (answerField as unknown[]).filter(
      (a) => a && String(a).trim().length > 0,
    );
    if (valid.length > 0) answer = String(valid[0]);
  } else if (Array.isArray(options) && options.length > 0) {
    const validOptions = options.filter(
      (o) => o && String(o).trim().length > 0,
    );
    if (validOptions.length > 0) answer = String(validOptions[0]);
  }

  return {
    id: String(q.id ?? `db-${Math.random()}`),
    question: String(question),
    answer,
  };
}

const FunZone = () => {
  const [showDidYouKnow, setShowDidYouKnow] = useState(false);
  const [currentQuestion, setCurrentQuestion] =
    useState<DidYouKnowQuestion | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);

  /**
   * Fetch a fresh random question from the database
   * Called on mount and on "Play Next" action
   */
  const fetchRandomQuestion = async () => {
    setIsLoadingQuiz(true);
    try {
      // Fetch 1 random quiz question from the database
      const quizzes = await generateRandomQuiz(1);

      if (quizzes && quizzes.length > 0) {
        // Convert quiz to DidYouKnow format
        const converted = convertQuizToDidYouKnow(quizzes[0]);

        if (converted) {
          setCurrentQuestion(converted);
        } else {
          // Fallback if conversion failed
          const randomFallback =
            fallbackQuestions[
              Math.floor(Math.random() * fallbackQuestions.length)
            ];
          setCurrentQuestion(randomFallback);
        }
      } else {
        // Fallback if no quiz found
        const randomFallback =
          fallbackQuestions[
            Math.floor(Math.random() * fallbackQuestions.length)
          ];
        setCurrentQuestion(randomFallback);
      }
    } catch (error) {
      // Log error internally, use fallback question
      error("Failed to fetch random quiz", error);
      // Use random fallback on error
      const randomFallback =
        fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      setCurrentQuestion(randomFallback);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  /**
   * Handle Play Next button - fetch a fresh random question
   */
  const handlePlayNext = () => {
    fetchRandomQuestion();
  };

  /**
   * Fetch initial question on component mount
   */
  useEffect(() => {
    fetchRandomQuestion();
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMeta
        title={PAGE_TEMPLATES.funzone.title}
        description={PAGE_TEMPLATES.funzone.description}
        keywords={PAGE_TEMPLATES.funzone.keywords}
        ogImage={`${window.location.origin}/og-image.jpg`}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
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
            {/* Did You Know Section */}
            <div className="mt-20 md:mt-28">
              <div className="max-w-sm mx-auto">
                <DidYouKnowCard
                  onClick={() => {
                    setShowDidYouKnow(true);
                  }}
                />
              </div>
            </div>
            {/* Did You Know Modal */}
            {currentQuestion && (
              <DidYouKnowModal
                isOpen={showDidYouKnow}
                onClose={() => setShowDidYouKnow(false)}
                currentQuestion={currentQuestion}
                onNext={handlePlayNext}
              />
            )}

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
