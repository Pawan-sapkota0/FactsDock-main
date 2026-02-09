import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useContext } from "react";
import { UserAuthContext } from "@/context/UserAuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PreFooterCTA from "@/components/layout/PreFooterCTA";
import { DifficultySelector } from "@/components/quiz/DifficultySelector";
import { LevelSelector } from "@/components/quiz/LevelSelector";
import { generateQuizForTopic, generateRandomQuiz } from "@/lib/api";
import {
  calculateLevels,
  getQuestionsForLevel,
  Quiz as QuizType,
  getTotalLevels,
} from "@/lib/quiz-levels";
import {
  getGuestProgress,
  completeGuestLevel,
  shouldShowLoginPrompt,
  canAccessLevel,
  saveGuestProgress,
} from "@/lib/quiz-progress";
import { log, error as logError } from "@/lib/logger";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/lib/ad-spacing";
import { SEOMeta } from "@/components/common/SEOMeta";

const QuizModal = React.lazy(() => import("@/components/QuizModal"));

type QuizMode = "country" | "fun" | "world";
type DifficultyLevel = "easy" | "medium" | "hard";

interface PageState {
  mode: "difficulty-selection" | "level-selection" | "quiz-running";
}

/**
 * QuizPlayPage Component
 * Main orchestrator for quiz flow:
 * 1. Difficulty Selection
 * 2. Level Selection
 * 3. Quiz Execution
 *
 * Route: /quiz/play/:mode/:country?
 * Example URLs:
 * - /quiz/play/country/nepal
 * - /quiz/play/fun
 * - /quiz/play/world
 */
const QuizPlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use user auth, not admin auth - quiz progress is tracked per user, not per admin
  const userAuthContext = useContext(UserAuthContext);
  if (!userAuthContext) {
    throw new Error("QuizPlayPage must be used within UserAuthProvider");
  }
  const { user, isAuthenticated } = userAuthContext;

  // URL Parameters
  const { mode: modeParam = "world", country: countryParam } = useParams<{
    mode: string;
    country?: string;
  }>();

  const mode = modeParam as QuizMode;
  const countryName = countryParam
    ? decodeURIComponent(countryParam).replace(/-/g, " ")
    : undefined;

  // Page State Management
  const [pageState, setPageState] = useState<PageState>({
    mode: "difficulty-selection",
  });
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizType[]>([]);
  const [totalQuestionsAvailable, setTotalQuestionsAvailable] = useState(0);
  const [userProgress, setUserProgress] = useState<{
    highestLevelUnlocked: number;
    completedLevels: number[];
  }>({ highestLevelUnlocked: 1, completedLevels: [] });
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  // Validate mode parameter
  useEffect(() => {
    const validModes: QuizMode[] = ["country", "fun", "world"];
    if (!validModes.includes(mode)) {
      toast({
        title: "Invalid Quiz Mode",
        description: `Mode must be one of: ${validModes.join(", ")}`,
        variant: "destructive",
      });
      navigate("/quiz");
    }
  }, [mode, navigate, toast]);

  /**
   * Fetch all questions for selected difficulty
   * Called when user selects a difficulty
   */
  const fetchQuestionsForDifficulty = async (difficulty: DifficultyLevel) => {
    setIsLoadingQuestions(true);
    try {
      log("[QuizPlayPage] Fetching questions", {
        mode,
        country: countryName,
        difficulty,
      });

      let questions: unknown[] = [];

      // Fetch based on mode
      if (mode === "country" && countryName) {
        // Country-specific quiz
        questions = await generateQuizForTopic(countryName, 100, {
          difficulty,
          sourceType: "country",
          force: true,
        });
      } else if (mode === "fun") {
        // Fun Facts quiz
        questions = await generateQuizForTopic(undefined, 100, {
          difficulty,
          sourceType: "fun",
          force: true,
        });
      } else if (mode === "world") {
        // World Facts quiz
        questions = await generateQuizForTopic(undefined, 100, {
          difficulty,
          sourceType: "world",
          force: true,
        });
      }

      // Normalize questions
      const normalized = (questions || []).map((q: unknown) => {
        const rec = (q || {}) as Record<string, unknown>;
        return {
          question: String(rec.question ?? rec.title ?? "Question"),
          options: Array.isArray(rec.options ?? rec.choices)
            ? (rec.options ?? rec.choices)
            : [],
          answer: String(
            rec.answer ?? rec.correctAnswer ?? rec.correct_answer ?? "",
          ),
          difficulty: String(rec.difficulty ?? difficulty),
        };
      });

      setQuizQuestions(normalized as QuizType[]);
      setTotalQuestionsAvailable(normalized.length);

      log("[QuizPlayPage] Questions loaded", {
        count: normalized.length,
        difficulty,
      });

      // Load user progress from localStorage (for both guests and authenticated users)
      // All progress is per-device, no database storage
      const progress = getGuestProgress(mode, difficulty, countryName);
      if (progress) {
        setUserProgress({
          highestLevelUnlocked: progress.highestLevelUnlocked,
          completedLevels: progress.completedLevels,
        });
        log("[QuizPlayPage] Loaded progress from localStorage", progress);
      }

      // ✅ ALWAYS transition to level-selection
      setPageState({ mode: "level-selection" });
    } catch (err) {
      logError("[QuizPlayPage] Error fetching questions", err);
      toast({
        title: "Error Loading Quiz",
        description:
          "Failed to load quiz questions. Please try again or select a different difficulty.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  /**
   * Handle difficulty selection
   */
  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    fetchQuestionsForDifficulty(difficulty);
  };

  /**
   * Handle level selection and start quiz
   */
  const handleLevelSelect = (levelNumber: number) => {
    if (selectedDifficulty === null) return;

    // === SEQUENTIAL LEVEL UNLOCK CHECK ===
    // User can access level N only if level N-1 is completed
    // This is a READ-ONLY validation that doesn't modify progress
    const { canAccess, requiredLevel } = canAccessLevel(
      levelNumber,
      userProgress,
    );

    if (!canAccess) {
      toast({
        title: "Level Locked",
        description: `Complete Level ${requiredLevel} to unlock this level.`,
        variant: "destructive",
      });
      return;
    }

    // Check if should show login prompt for level 2+
    if (
      !isAuthenticated &&
      shouldShowLoginPrompt(mode, selectedDifficulty, countryName)
    ) {
      // Show login prompt instead of starting quiz
      toast({
        title: "Create Account to Continue",
        description: "Log in to unlock and save progress in higher levels.",
      });
      // TODO: Navigate to login or show login modal
      return;
    }

    setSelectedLevel(levelNumber);
    setShowQuizModal(true);
    setQuizModalOpen(true);
  };

  /**
   * Handle quiz completion
   */
  const handleQuizComplete = async () => {
    if (!selectedDifficulty || !selectedLevel) return;

    // Update progress - different logic for guests vs authenticated users
    // ✅ Save progress to localStorage only (both guest and authenticated users)
    // No database calls - fully client-side, per-device tracking
    try {
      if (!isAuthenticated) {
        // Guest user: Mark level as completed but DON'T unlock next level
        const current = getGuestProgress(
          mode,
          selectedDifficulty,
          countryName,
        ) || {
          mode,
          difficulty: selectedDifficulty,
          country: countryName || null,
          highestLevelUnlocked: 1,
          completedLevels: [],
        };

        // Mark level as completed
        if (!current.completedLevels.includes(selectedLevel)) {
          current.completedLevels.push(selectedLevel);
        }

        // ✅ Do NOT increment highestLevelUnlocked for guests
        saveGuestProgress(
          mode,
          selectedDifficulty,
          current.highestLevelUnlocked, // ← Keep same value (e.g., 1)
          current.completedLevels,
          countryName,
        );

        setUserProgress({
          highestLevelUnlocked: current.highestLevelUnlocked,
          completedLevels: current.completedLevels,
        });

        log("[QuizPlayPage] Guest progress saved to localStorage", current);

        toast({
          title: "Create Account to Unlock Level 2+",
          description: "Sign up to unlock and save progress in higher levels.",
          variant: "default",
        });
      } else {
        // Authenticated user - same localStorage, but unlock next level
        const current = getGuestProgress(
          mode,
          selectedDifficulty,
          countryName,
        ) || {
          mode,
          difficulty: selectedDifficulty,
          country: countryName || null,
          highestLevelUnlocked: 1,
          completedLevels: [],
        };

        // Mark level as completed
        if (!current.completedLevels.includes(selectedLevel)) {
          current.completedLevels.push(selectedLevel);
        }

        // Authenticated user: Also unlock next level
        if (selectedLevel >= current.highestLevelUnlocked) {
          current.highestLevelUnlocked = selectedLevel + 1;
        }

        saveGuestProgress(
          mode,
          selectedDifficulty,
          current.highestLevelUnlocked,
          current.completedLevels,
          countryName,
        );

        setUserProgress({
          highestLevelUnlocked: current.highestLevelUnlocked,
          completedLevels: current.completedLevels,
        });

        log("[QuizPlayPage] Auth user progress saved to localStorage", current);

        toast({
          title: "Level Completed! 🎉",
          description: `Level ${selectedLevel} of ${selectedDifficulty} difficulty completed.`,
        });
      }
    } catch (e) {
      logError("[QuizPlayPage] Error saving progress", e);
      toast({
        title: "Warning",
        description: "Failed to save progress locally",
        variant: "destructive",
      });
    }

    // Close modal and show next steps
    setQuizModalOpen(false);
    setShowQuizModal(false);

    toast({
      title: "Level Completed! 🎉",
      description: `Level ${selectedLevel} of ${selectedDifficulty} difficulty completed.`,
    });

    // Return to level-selection view after brief delay
    // ✅ Do NOT clear selectedLevel - let UI show completed level
    setTimeout(() => {
      setPageState({ mode: "level-selection" });
      // Refresh progress display by re-rendering with updated userProgress
    }, 1500);
  };

  /**
   * Get page title based on current state
   */
  const getPageTitle = (): string => {
    if (pageState.mode === "difficulty-selection") {
      if (mode === "country" && countryName) {
        return `Quiz: ${countryName}`;
      } else if (mode === "fun") {
        return "Fun Facts Quiz";
      } else if (mode === "world") {
        return "World Facts Quiz";
      }
    }
    return "Quiz";
  };

  // Calculate levels for current questions
  const availableLevels = useMemo(() => {
    if (totalQuestionsAvailable === 0) return [];
    return calculateLevels(totalQuestionsAvailable, 10, userProgress);
  }, [totalQuestionsAvailable, userProgress]);

  // Get questions for selected level
  const levelQuestions = useMemo(() => {
    if (!selectedLevel || selectedDifficulty === null) return [];
    return getQuestionsForLevel(quizQuestions, selectedLevel, 10);
  }, [selectedLevel, selectedDifficulty, quizQuestions]);

  const modeLabel =
    mode === "country"
      ? countryName || "Quiz"
      : mode === "fun"
        ? "Fun"
        : "World";
  const pageTitle = `Play ${modeLabel} Quiz`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMeta
        title={`FactsDock | ${pageTitle}`}
        description={`Play engaging ${modeLabel.toLowerCase()} quizzes to test your knowledge. Challenge yourself with multiple difficulty levels and improve your learning.`}
        keywords={`${modeLabel.toLowerCase()} quiz, quizzes, educational, learning challenge`}
        ogImage={`${typeof window !== "undefined" ? window.location.origin : ""}/og-image.png`}
      />
      <Navbar />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (pageState.mode === "level-selection") {
                  setPageState({ mode: "difficulty-selection" });
                  setSelectedDifficulty(null);
                } else {
                  navigate(-1);
                }
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Page Content */}
          <div className="max-w-5xl mx-auto">
            {/* Difficulty Selection Screen */}
            {pageState.mode === "difficulty-selection" && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                    {getPageTitle()}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Start your learning journey by selecting a difficulty level
                  </p>
                </div>

                <DifficultySelector
                  onSelectDifficulty={handleDifficultySelect}
                  isLoading={isLoadingQuestions}
                  title="Choose Your Difficulty"
                />
              </div>
            )}

            {/* Level Selection Screen */}
            {pageState.mode === "level-selection" && selectedDifficulty && (
              <div className="space-y-8">
                <LevelSelector
                  difficulty={selectedDifficulty}
                  totalQuestions={totalQuestionsAvailable}
                  onSelectLevel={handleLevelSelect}
                  userProgress={userProgress}
                  isLoading={isLoadingQuestions}
                  showLoginPrompt={!isAuthenticated}
                  onLoginClick={() => {
                    navigate("/admin/login");
                  }}
                  questionsPerLevel={10}
                  mode={mode}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <PreFooterCTA />

      {/* Ad Slot: Before footer on quiz play page (non-interruptive) */}
      <AdSlot slot={AD_SLOTS.QUIZ_PLAY_FOOTER} />

      <Footer />

      {/* Quiz Modal - Lazy loaded */}
      {showQuizModal && selectedDifficulty && selectedLevel && (
        <Suspense fallback={<div />}>
          <QuizModal
            open={quizModalOpen}
            onOpenChange={(open) => {
              setQuizModalOpen(open);
              if (!open) {
                setShowQuizModal(false);
              }
            }}
            topic={countryName}
            sourceType={mode}
            questionCount={Math.min(levelQuestions.length, 10)}
            onComplete={handleQuizComplete}
          />
        </Suspense>
      )}
    </div>
  );
};

export default QuizPlayPage;
