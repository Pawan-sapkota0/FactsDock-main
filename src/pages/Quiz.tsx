import React, { useState, useEffect, useRef } from "react";
import {
  Shuffle,
  MapPin,
  ArrowLeft,
  Loader2,
  Lock,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PreFooterCTA from "@/components/layout/PreFooterCTA";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SearchBar from "@/components/common/SearchBar";
import { useToast } from "@/hooks/use-toast";
import { generateQuizForTopic, generateRandomQuiz } from "@/lib/api";
import { SEOMeta } from "@/components/common/SEOMeta";
import { PAGE_TEMPLATES, generateArticleSchema } from "@/lib/seo-utils";
import { log, debug, warn, error } from "@/lib/logger";
import { useUserAuth } from "@/context/UserAuthContext";
import type { Quiz } from "@/lib/quiz-levels";
import {
  calculateLevels,
  getQuestionsForLevel,
  QuizLevel,
} from "@/lib/quiz-levels";
import {
  getGuestProgress,
  completeGuestLevel,
  saveGuestProgress,
  getRandomQuizProgress,
  saveRandomQuizProgress,
  completeRandomLevel,
  canAccessLevel,
} from "@/lib/quiz-progress";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/lib/ad-spacing";

const QuizModal = React.lazy(() => import("@/components/QuizModal"));

const Quiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useUserAuth();
  const [quizType, setQuizType] = useState<"country" | "random" | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoQuiz, setAutoQuiz] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // inline modal state
  const [openInline, setOpenInline] = useState(false);
  const [inlineTopic, setInlineTopic] = useState<string | undefined>(undefined);
  const [inlineCount, setInlineCount] = useState<number>(10);

  // Random quiz level state
  const [isRandomLevelMode, setIsRandomLevelMode] = useState(false);
  const [randomQuizAllQuestions, setRandomQuizAllQuestions] = useState<
    Record<string, unknown>[]
  >([]);
  const [isLoadingRandomQuestions, setIsLoadingRandomQuestions] =
    useState(false);
  const [selectedRandomLevel, setSelectedRandomLevel] = useState<number | null>(
    null,
  );
  const [randomUserProgress, setRandomUserProgress] = useState<{
    highestLevelUnlocked: number;
    completedLevels: number[];
  }>({ highestLevelUnlocked: 1, completedLevels: [] });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const questionOptions = [5, 10, 15, 20, 25, 30, 35];

  const countryRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLDivElement | null>(null);

  // Load all random questions sorted by oldest first
  const loadRandomQuizQuestions = async () => {
    setIsLoadingRandomQuestions(true);
    try {
      log("[Quiz] Loading random quiz questions");
      const rawResponse = await generateRandomQuiz(100); // Load 100 random questions

      let allQuestions = rawResponse || [];

      // Questions should already be flattened from Edge Function
      if (!Array.isArray(allQuestions)) {
        allQuestions = [];
      }

      if (!allQuestions || allQuestions.length === 0) {
        toast({
          title: "No Questions Available",
          description:
            "Could not load random quiz questions. Please try again later.",
          variant: "destructive",
        });
        setIsLoadingRandomQuestions(false);
        return;
      }

      // Sort by created_at or id (older first) - assuming API returns them in creation order
      const sorted = (allQuestions || []).sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) => {
          const aVal = a.created_at || a.id || 0;
          const bVal = b.created_at || b.id || 0;
          const aTime = new Date(aVal as string | number).getTime();
          const bTime = new Date(bVal as string | number).getTime();
          return aTime - bTime;
        },
      );

      setRandomQuizAllQuestions(sorted);
      log("[Quiz] Random quiz questions loaded", {
        count: sorted.length,
      });

      // Load user progress for random quiz from localStorage only
      // All users (guest and authenticated) use the same localStorage mechanism
      try {
        const progress = getRandomQuizProgress();

        setRandomUserProgress({
          highestLevelUnlocked: progress.highestLevelUnlocked || 1,
          completedLevels: progress.completedLevels || [],
        });

        log("[Quiz] Loaded random progress from localStorage", progress);
      } catch (e) {
        log("[Quiz] Error loading random progress", e);
        setRandomUserProgress({ highestLevelUnlocked: 1, completedLevels: [] });
      }

      setIsRandomLevelMode(true);
    } catch (err) {
      error("[Quiz] Error loading random quiz questions", err);
      toast({
        title: "Error",
        description: "Failed to load random quiz questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRandomQuestions(false);
    }
  };

  // Handle level selection for random quiz
  const handleRandomLevelSelect = (levelNumber: number) => {
    // === SEQUENTIAL LEVEL UNLOCK CHECK ===
    // User can access level N only if level N-1 is completed
    // This is a READ-ONLY validation that doesn't modify progress
    const { canAccess, requiredLevel } = canAccessLevel(
      levelNumber,
      randomUserProgress,
    );

    if (!canAccess) {
      toast({
        title: "Level Locked",
        description: `Complete Level ${requiredLevel} to unlock this level.`,
        variant: "destructive",
      });
      return;
    }

    // Check login requirement for level 2+
    if (!isAuthenticated && levelNumber >= 2) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedRandomLevel(levelNumber);
  };

  // Handle random quiz completion
  const handleRandomQuizComplete = async (score: number, total: number) => {
    if (selectedRandomLevel === null) return;

    // ✅ Save progress to localStorage only (both guest and authenticated users)
    // No database calls - fully client-side, per-device tracking
    try {
      const current = getRandomQuizProgress();

      // Mark level as completed
      if (!current.completedLevels.includes(selectedRandomLevel)) {
        current.completedLevels.push(selectedRandomLevel);
      }

      // Authenticated users unlock next level, guests don't
      if (isAuthenticated) {
        // Auth: Unlock next level
        if (selectedRandomLevel >= current.highestLevelUnlocked) {
          current.highestLevelUnlocked = selectedRandomLevel + 1;
        }
      } else {
        // Guest: Don't unlock next level (keep same highestLevelUnlocked)
      }

      // Save to localStorage only
      saveRandomQuizProgress(
        current.highestLevelUnlocked,
        current.completedLevels,
      );

      setRandomUserProgress({
        highestLevelUnlocked: current.highestLevelUnlocked,
        completedLevels: current.completedLevels,
      });
    } catch (e) {
      log("[Quiz] Error saving progress", e);
    }

    // Show appropriate message based on authentication
    const nextLevel = selectedRandomLevel + 1;
    const totalLevels = Math.ceil(randomQuizAllQuestions.length / 10);

    if (!isAuthenticated) {
      // Guest: Show "Create Account" message
      toast({
        title: "Create Account to Unlock Level 2+",
        description: "Sign up to unlock and save progress in higher levels.",
        variant: "default",
      });
    } else if (nextLevel <= totalLevels) {
      // Authenticated: Show "Level Unlocked" message
      toast({
        title: "Level Completed! 🎉",
        description: `You unlocked Level ${nextLevel}!`,
      });
    } else {
      toast({
        title: "All Levels Completed! 🏆",
        description: "You've completed all available levels!",
      });
    }
  };

  const handleStartQuiz = async () => {
    if (quizType === "country" && !selectedCountry) {
      toast({
        title: "Selection Required",
        description: "Please select a country first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const topic = quizType === "country" ? selectedCountry : undefined;
      // open inline quiz modal instead of navigating
      setInlineTopic(topic || undefined);
      setInlineCount(questionCount);
      setOpenInline(true);
      toast({
        title: "Quiz Ready!",
        description: `Starting quiz ${topic ? `for ${topic}` : "random"}`,
      });
    } catch (error) {
      error("Error preparing quiz:", error);
      toast({
        title: "Error",
        description: "Failed to prepare quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-load random quiz levels when random quiz is selected
  useEffect(() => {
    if (
      quizType === "random" &&
      !isRandomLevelMode &&
      !isLoadingRandomQuestions
    ) {
      loadRandomQuizQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizType]);

  // Try to auto-start quiz if currentQuiz exists or autoStart flag present
  useEffect(() => {
    // react to query changes so navigation to /quiz?autoStart=1 triggers auto-run
    const params = new URLSearchParams(window.location.search);
    const autoStart = params.get("autoStart");
    const stored = localStorage.getItem("currentQuiz");
    if ((autoStart === "1" || stored) && !autoQuiz) {
      try {
        let parsed = stored ? JSON.parse(stored) : null;
        // support shape { data: [...] } or raw array
        if (parsed && parsed.data && Array.isArray(parsed.data))
          parsed = parsed.data;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAutoQuiz(
            parsed.map((q: unknown) => ({ ...(q as Record<string, unknown>) })),
          );
        }
      } catch (e) {
        error("Invalid stored quiz:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  // Scroll to appropriate section when quiz type is selected - instant, no animation
  useEffect(() => {
    if (!quizType) return;

    // Use a longer timeout to ensure DOM has fully updated and rendered
    const scrollTimer = setTimeout(() => {
      try {
        let targetRef: HTMLDivElement | null = null;

        if (quizType === "country") {
          targetRef = countryRef.current;
        } else if (quizType === "random") {
          targetRef = countRef.current;
        }

        if (targetRef) {
          // Disable smooth scrolling
          const html = document.documentElement;
          const originalScrollBehavior = html.style.scrollBehavior;
          html.style.scrollBehavior = "auto";

          // Get element position and scroll to it
          const elementTop =
            targetRef.getBoundingClientRect().top + window.scrollY - 100; // Add navbar offset
          window.scrollTo({
            top: elementTop,
            behavior: "auto",
          });

          // Restore scroll behavior
          requestAnimationFrame(() => {
            html.style.scrollBehavior = originalScrollBehavior;
          });
        }
      } catch (e) {
        error("Scroll error:", e);
      }
    }, 100); // Increased delay for better DOM rendering

    return () => clearTimeout(scrollTimer);
  }, [quizType]);

  useEffect(() => {
    if (autoQuiz && autoQuiz.length > 0) {
      // reset runner state
      setCurrentIndex(0);
      setAnswers({});
      setShowResults(false);
    }
  }, [autoQuiz]);

  const handleAnswer = (choice: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: choice }));
    setSelectedChoice(choice);
    // auto-advance after a short delay to show feedback
    setTimeout(() => {
      setSelectedChoice(null);
      nextQuestion();
    }, 800);
  };

  const nextQuestion = () => {
    if (!autoQuiz) return;
    if (currentIndex < autoQuiz.length - 1) setCurrentIndex((i) => i + 1);
    else {
      // compute score
      let correct = 0;
      autoQuiz.forEach((q, idx) => {
        const ans = answers[idx];
        if (!ans && idx === currentIndex) return; // skip
        const qAnswer = String((q as Record<string, unknown>).answer ?? "");
        if (ans && qAnswer && ans === qAnswer) correct++;
      });
      setShowResults(true);
      setLastScore(correct);
      try {
        localStorage.setItem(
          "lastQuizScore",
          JSON.stringify({ total: autoQuiz.length, correct }),
        );
      } catch (e) {
        /* ignored - storage best-effort */
      }
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta
        title={PAGE_TEMPLATES.quizzes.title}
        description={PAGE_TEMPLATES.quizzes.description}
        keywords={PAGE_TEMPLATES.quizzes.keywords}
        ogImage={`${window.location.origin}/og-image.png`}
        structuredData={generateArticleSchema({
          headline: "Geography Quizzes",
          description:
            "Challenge yourself with fun, educational geography quizzes. Test your knowledge about countries, capitals, and global facts.",
          datePublished: new Date().toISOString(),
        })}
      />
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Back button removed per request */}

            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  Quiz Setup
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Choose your quiz type and get started!
              </p>
            </div>

            {/* If autoQuiz is present, render the quiz runner; otherwise show the quiz type cards */}
            {autoQuiz ? (
              !showResults ? (
                <div className="space-y-6">
                  <Card className="p-6">
                    <CardHeader>
                      <CardTitle>
                        Question {currentIndex + 1} of {autoQuiz.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">
                        {String(
                          (autoQuiz[currentIndex] as Record<string, unknown>)
                            .question ?? "",
                        )}
                      </p>
                      <div className="grid gap-3">
                        {(
                          ((autoQuiz[currentIndex] as Record<string, unknown>)
                            .options as string[]) || []
                        ).map((opt: string, i: number) => {
                          const isSelected =
                            answers[currentIndex] === opt ||
                            selectedChoice === opt;
                          const isCorrect =
                            autoQuiz[currentIndex].answer === opt;
                          let variant: React.ComponentProps<
                            typeof Button
                          >["variant"] = "outline";
                          let className = "";
                          if (selectedChoice) {
                            if (isCorrect) {
                              variant = "default";
                              className =
                                "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800";
                            } else if (isSelected) {
                              variant = "destructive";
                              className =
                                "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800";
                            }
                          } else if (answers[currentIndex] === opt) {
                            variant = "default";
                          }
                          // Use unique key combining question index and option index
                          const uniqueKey = `q${currentIndex}-opt${i}`;
                          return (
                            <Button
                              key={uniqueKey}
                              variant={variant}
                              className={className}
                              onClick={() => handleAnswer(opt)}
                              disabled={!!selectedChoice}
                            >
                              {opt}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={prevQuestion}
                      disabled={currentIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button onClick={nextQuestion}>
                      {currentIndex < autoQuiz.length - 1 ? "Next" : "Finish"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Results</h2>
                  <p className="mb-4">
                    Score: {lastScore ?? 0} / {autoQuiz.length}
                  </p>
                  <div className="space-y-4">
                    {autoQuiz.map((q, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="font-semibold mb-2">
                          Q{idx + 1}:{" "}
                          {String(
                            (q as Record<string, unknown>).question ?? "",
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Your answer: {answers[idx] ?? "—"}
                        </div>
                        <div className="text-sm text-primary">
                          Correct answer:{" "}
                          {String((q as Record<string, unknown>).answer ?? "")}
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        localStorage.removeItem("currentQuiz");
                        setAutoQuiz(null);
                        navigate("/");
                      }}
                    >
                      Done
                    </Button>
                  </div>

                  {/* Ad Slot: After quiz result (high-value placement) */}
                  <AdSlot slot={AD_SLOTS.QUIZ_RESULT} className="mt-4" />
                </div>
              )
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <Card
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    quizType === "country" ? "border-primary border-2" : ""
                  }`}
                  onClick={() => setQuizType("country")}
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="bg-primary/10 p-4 rounded-2xl">
                        <MapPin className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-center">
                      Country-wise Quiz
                    </CardTitle>
                    <CardDescription className="text-center">
                      Test your knowledge about a specific country
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    quizType === "random" ? "border-primary border-2" : ""
                  }`}
                  onClick={() => setQuizType("random")}
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="bg-primary/10 p-4 rounded-2xl">
                        <Shuffle className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-center">Random Quiz</CardTitle>
                    <CardDescription className="text-center">
                      Questions from multiple countries
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}

            {/* Country Selection (if country-wise) */}
            {quizType === "country" && (
              <div ref={countryRef} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Select a Country
                </h3>
                <SearchBar
                  placeholder="Search and select a country..."
                  onChange={(value) => setSelectedCountry(value)}
                  onSelect={(value) => setSelectedCountry(value)}
                />
              </div>
            )}

            {/* Question Count Selection (only for country-wise) */}
            {quizType === "country" && (
              <div ref={countRef} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Number of Questions
                </h3>
                <div className="flex flex-wrap gap-3">
                  {questionOptions.map((count) => (
                    <Button
                      key={count}
                      variant={questionCount === count ? "default" : "outline"}
                      onClick={() => setQuestionCount(count)}
                      className="px-6"
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Level Selection Load Button (for random quiz) */}
            {quizType === "random" &&
              !isRandomLevelMode &&
              !selectedRandomLevel &&
              isLoadingRandomQuestions && (
                <div className="text-center pt-4">
                  <Button variant="hero" size="lg" disabled={true}>
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading Levels...
                    </>
                  </Button>
                </div>
              )}

            {/* Random Quiz Levels Display */}
            {quizType === "random" &&
              isRandomLevelMode &&
              !selectedRandomLevel &&
              randomQuizAllQuestions.length > 0 &&
              !showLoginPrompt && (
                <div ref={countRef} className="space-y-6">
                  {/* Upgrade Prompt for Logged Out Users - REMOVED FROM HERE */}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Random Quiz Levels
                    </h3>
                    <p className="text-muted-foreground">
                      10 Questions per Level
                    </p>
                  </div>

                  {randomUserProgress && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Progress: Level{" "}
                            {randomUserProgress.highestLevelUnlocked || 1}{" "}
                            unlocked
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {randomUserProgress.completedLevels?.length || 0}{" "}
                            levels completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {(
                              ((randomUserProgress.completedLevels?.length ||
                                0) /
                                Math.max(
                                  Math.ceil(randomQuizAllQuestions.length / 10),
                                  1,
                                )) *
                              100
                            ).toFixed(0)}
                            %
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Complete
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({
                      length: Math.ceil(randomQuizAllQuestions.length / 10),
                    }).map((_, idx) => {
                      const levelNumber = idx + 1;
                      const isLocked =
                        levelNumber > randomUserProgress.highestLevelUnlocked;
                      const requiresLogin =
                        !isAuthenticated && levelNumber >= 2;
                      const isCompleted =
                        randomUserProgress.completedLevels.includes(
                          levelNumber,
                        );
                      const isPlayable = !isLocked && !requiresLogin;

                      // Determine icon and color
                      let iconComponent;
                      let iconColor;
                      let borderColor = "border-border";
                      let hoverBorder = "hover:border-primary";

                      if (isLocked) {
                        iconComponent = (
                          <Lock className="h-10 w-10 text-muted-foreground" />
                        );
                        iconColor = "text-muted-foreground";
                      } else if (requiresLogin) {
                        iconComponent = (
                          <Lock className="h-10 w-10 text-orange-500" />
                        );
                        iconColor = "text-orange-500";
                        borderColor = "border-orange-200";
                        hoverBorder = "hover:border-orange-500";
                      } else if (isCompleted) {
                        iconComponent = (
                          <CheckCircle2 className="h-10 w-10 text-green-600" />
                        );
                        iconColor = "text-green-600";
                        borderColor = "border-green-200";
                        hoverBorder = "hover:border-green-600";
                      } else {
                        iconComponent = (
                          <Star className="h-10 w-10 text-amber-500" />
                        );
                        iconColor = "text-amber-500";
                        borderColor = "border-amber-200";
                        hoverBorder = "hover:border-amber-500";
                      }

                      return (
                        <button
                          key={levelNumber}
                          onClick={() => {
                            handleRandomLevelSelect(levelNumber);
                          }}
                          disabled={isLocked || requiresLogin}
                          className="w-full text-left transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Card
                            className={`h-full border-2 cursor-pointer transition-all duration-300 ${borderColor} ${hoverBorder} ${
                              isLocked || requiresLogin
                                ? "opacity-60 bg-muted/30"
                                : ""
                            }`}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between mb-4">
                                <div className={iconColor}>{iconComponent}</div>
                              </div>
                              <CardTitle className="text-2xl text-foreground">
                                Level {levelNumber}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm text-muted-foreground">
                                10 Questions
                              </p>
                              <div className="pt-2 border-t border-current border-opacity-10">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {isCompleted ? (
                                    <span className="text-green-600 font-medium">
                                      ✓ Completed
                                    </span>
                                  ) : requiresLogin ? (
                                    <span className="text-orange-600 font-medium">
                                      Login to play
                                    </span>
                                  ) : isLocked ? (
                                    `Complete Level ${levelNumber - 1} to unlock`
                                  ) : (
                                    "Ready to play"
                                  )}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </button>
                      );
                    })}
                  </div>

                  {/* Upgrade Prompt for Logged Out Users - BELOW LEVELS */}
                  {!isAuthenticated && (
                    <Card className="border-2 border-border bg-muted/50 mt-8">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-semibold text-foreground">
                            Create a free account to unlock Level 2+
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Save your progress and unlock advanced levels
                          </p>
                          <Button
                            onClick={() => navigate("/auth/signup")}
                            variant="hero"
                            size="lg"
                            className="w-full sm:w-auto"
                          >
                            Create Account
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            You can continue playing Level 1 without logging in
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

            {/* Login Prompt for Level 2+ */}
            {quizType === "random" &&
              isRandomLevelMode &&
              showLoginPrompt &&
              !selectedRandomLevel && (
                <div className="max-w-2xl mx-auto">
                  <Card className="border-2 border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Create Account to Continue
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Log in to unlock Level 2+ and save your progress
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                          <Button
                            onClick={() => navigate("/auth/signup")}
                            variant="hero"
                            size="lg"
                          >
                            Create Account
                          </Button>
                          <Button
                            onClick={() => navigate("/admin/login")}
                            variant="outline"
                            size="lg"
                          >
                            Login
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                          You can play Level 1 without logging in
                        </p>
                        <Button
                          onClick={() => {
                            setShowLoginPrompt(false);
                            handleRandomLevelSelect(1);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          Play Level 1 Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            {/* Start Quiz Button (starts inline modal) for country quiz */}
            {quizType === "country" && selectedCountry && (
              <div className="text-center pt-4">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleStartQuiz}
                  className="px-12"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    "Start Quiz"
                  )}
                </Button>
                {/* When a country is selected, provide a separate explicit action to view details */}
                {quizType === "country" && selectedCountry && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const slug = selectedCountry
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, "");
                        navigate(`/country/${slug}`);
                      }}
                    >
                      View Country Details
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Random Quiz In-Progress Display */}
            {quizType === "random" &&
              isRandomLevelMode &&
              selectedRandomLevel !== null &&
              randomQuizAllQuestions.length > 0 &&
              !showResults && (
                <div className="space-y-6">
                  {(() => {
                    const levelQuestions = getQuestionsForLevel(
                      randomQuizAllQuestions as Quiz[],
                      selectedRandomLevel,
                      10,
                    );
                    if (currentIndex >= levelQuestions.length) return null;

                    const currentQuestion = levelQuestions[currentIndex];
                    return (
                      <Card className="p-6">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle>
                              Level {selectedRandomLevel} - Question{" "}
                              {currentIndex + 1} of {levelQuestions.length}
                            </CardTitle>
                            <button
                              onClick={() => {
                                setSelectedRandomLevel(null);
                                setCurrentIndex(0);
                                setAnswers({});
                                setSelectedChoice(null);
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              aria-label="Close quiz"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4 text-lg font-medium">
                            {String(
                              (currentQuestion as Record<string, unknown>)
                                .question ?? "",
                            )}
                          </p>
                          <div className="grid gap-3">
                            {(
                              (currentQuestion as Record<string, unknown>)
                                .options as string[]
                            ).map((opt: string, i: number) => {
                              const isSelected =
                                answers[currentIndex] === opt ||
                                selectedChoice === opt;
                              // Support both real data (correct_answer) and mock data (answer)
                              const correctAnswer = String(
                                (currentQuestion as Record<string, unknown>)
                                  .correct_answer ||
                                  (currentQuestion as Record<string, unknown>)
                                    .answer ||
                                  "",
                              ).trim();
                              const trimmedOpt = String(opt ?? "").trim();
                              const isCorrect = correctAnswer === trimmedOpt;
                              let variant: React.ComponentProps<
                                typeof Button
                              >["variant"] = "outline";
                              let className = "";
                              if (selectedChoice) {
                                // Show correct answer in green
                                if (isCorrect && isSelected) {
                                  variant = "default";
                                  className =
                                    "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800";
                                }
                                // Show selected wrong answer in red
                                else if (isSelected && !isCorrect) {
                                  variant = "destructive";
                                  className =
                                    "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800";
                                }
                              } else if (answers[currentIndex] === trimmedOpt) {
                                variant = "default";
                              }
                              const uniqueKey = `random-q${currentIndex}-opt${i}`;
                              return (
                                <Button
                                  key={uniqueKey}
                                  variant={variant}
                                  className={className}
                                  onClick={() => {
                                    // Update answers state
                                    const updatedAnswers = {
                                      ...answers,
                                      [currentIndex]: trimmedOpt,
                                    };
                                    setAnswers(updatedAnswers);
                                    setSelectedChoice(trimmedOpt);
                                    setTimeout(() => {
                                      setSelectedChoice(null);
                                      if (
                                        currentIndex <
                                        levelQuestions.length - 1
                                      ) {
                                        setCurrentIndex((i) => i + 1);
                                      } else {
                                        // ✅ Calculate score using updatedAnswers, not the stale answers state
                                        let correct = 0;
                                        levelQuestions.forEach(
                                          (q: Quiz, idx: number) => {
                                            const ans = String(
                                              updatedAnswers[idx] ?? "",
                                            ).trim();
                                            // Support both real data (correct_answer) and mock data (answer)
                                            const qAnswer = String(
                                              q.correct_answer ||
                                                q.answer ||
                                                "",
                                            ).trim();
                                            if (
                                              ans &&
                                              qAnswer &&
                                              ans === qAnswer
                                            )
                                              correct++;
                                          },
                                        );
                                        handleRandomQuizComplete(
                                          correct,
                                          levelQuestions.length,
                                        );
                                      }
                                    }, 800);
                                  }}
                                  disabled={!!selectedChoice}
                                >
                                  {opt}
                                </Button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
                      }}
                      disabled={currentIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => {
                        if (currentIndex < 9) {
                          setCurrentIndex((i) => i + 1);
                        } else {
                          const levelQuestions = getQuestionsForLevel(
                            randomQuizAllQuestions as Quiz[],
                            selectedRandomLevel,
                            10,
                          );
                          let correct = 0;
                          levelQuestions.forEach((q: Quiz, idx: number) => {
                            const ans = String(answers[idx] ?? "").trim();
                            // Support both real data (correct_answer) and mock data (answer)
                            const qAnswer = String(
                              q.correct_answer || q.answer || "",
                            ).trim();
                            if (ans && qAnswer && ans === qAnswer) correct++;
                          });
                          setLastScore(correct);
                          setShowResults(true);
                          handleRandomQuizComplete(
                            correct,
                            levelQuestions.length,
                          );
                        }
                      }}
                    >
                      {currentIndex < 9 ? "Next" : "Finish"}
                    </Button>
                  </div>
                </div>
              )}

            {/* Random Quiz Results Screen */}
            {quizType === "random" &&
              isRandomLevelMode &&
              selectedRandomLevel !== null &&
              showResults && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <CardHeader>
                      <CardTitle className="text-center">
                        Level {selectedRandomLevel} Complete!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <p className="text-4xl font-bold text-primary">
                          {lastScore ?? 0}/10
                        </p>
                        <p className="text-lg text-muted-foreground">
                          {(lastScore ?? 0) >= 7
                            ? "🎉 Excellent! Ready for the next level?"
                            : (lastScore ?? 0) >= 5
                              ? "👏 Good try! Practice more for higher levels."
                              : "💪 Nice try — practice more to improve."}
                        </p>
                        <div className="flex gap-2 justify-center pt-4 flex-wrap">
                          {(lastScore ?? 0) >= 5 &&
                          selectedRandomLevel <
                            Math.ceil(randomQuizAllQuestions.length / 10) &&
                          isAuthenticated ? (
                            <Button
                              onClick={() => {
                                setShowResults(false);
                                setCurrentIndex(0);
                                setAnswers({});
                                setSelectedChoice(null);
                                setSelectedRandomLevel(selectedRandomLevel + 1);
                              }}
                              variant="hero"
                            >
                              Next Level →
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={() => {
                                  setShowResults(false);
                                  setCurrentIndex(0);
                                  setAnswers({});
                                  setSelectedChoice(null);
                                  setSelectedRandomLevel(null);
                                }}
                                variant="hero"
                              >
                                Back to Levels
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowResults(false);
                                  setCurrentIndex(0);
                                  setAnswers({});
                                  setSelectedChoice(null);
                                }}
                                variant="outline"
                              >
                                Retry Level
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsRandomLevelMode(false);
                              setRandomQuizAllQuestions([]);
                              setSelectedRandomLevel(null);
                              setShowResults(false);
                              setCurrentIndex(0);
                              setAnswers({});
                              setQuizType(null);
                            }}
                          >
                            Back to Menu
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ad Slot: After random quiz result (high-value placement) */}
                  <AdSlot slot={AD_SLOTS.QUIZ_RESULT} className="mt-4" />
                </div>
              )}

            {/* Back Button for Level Selection */}
            {quizType === "random" &&
              isRandomLevelMode &&
              !selectedRandomLevel && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRandomLevelMode(false);
                      setRandomQuizAllQuestions([]);
                      setShowLoginPrompt(false);
                      setQuizType(null);
                    }}
                  >
                    ← Back
                  </Button>
                </div>
              )}
          </div>
        </div>
      </main>

      <PreFooterCTA />
      <Footer />

      <React.Suspense fallback={<div />}>
        <QuizModal
          open={openInline}
          onOpenChange={setOpenInline}
          topic={inlineTopic}
          sourceType={quizType === "country" ? "country" : undefined}
          questionCount={inlineCount}
        />
      </React.Suspense>
    </div>
  );
};

export default Quiz;
