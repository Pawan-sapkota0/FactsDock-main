import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Star,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Target,
  Globe,
  Zap,
  Lock as LockIcon,
} from "lucide-react";
import { QuizLevel, calculateLevels } from "@/lib/quiz-levels";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserAuth } from "@/context/UserAuthContext";

interface LevelSelectorProps {
  difficulty: "easy" | "medium" | "hard";
  totalQuestions: number;
  onSelectLevel: (levelNumber: number) => void;
  userProgress?: {
    highestLevelUnlocked?: number;
    completedLevels?: number[];
  };
  isLoading?: boolean;
  showLoginPrompt?: boolean;
  onLoginClick?: () => void;
  questionsPerLevel?: number;
  mode?: string;
}

/**
 * LevelSelector Component
 * Displays available levels for a selected difficulty
 * Shows unlock status and completion indicators
 */
export const LevelSelector: React.FC<LevelSelectorProps> = ({
  difficulty,
  totalQuestions,
  onSelectLevel,
  userProgress,
  isLoading = false,
  showLoginPrompt = false,
  onLoginClick,
  questionsPerLevel = 10,
  mode = "global",
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserAuth();

  // Calculate levels based on total questions
  const levels: QuizLevel[] = useMemo(() => {
    return calculateLevels(totalQuestions, questionsPerLevel, userProgress);
  }, [totalQuestions, questionsPerLevel, userProgress]);

  const getDifficultyIcon = (difficulty: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      easy: <Target className="h-5 w-5" />,
      medium: <Globe className="h-5 w-5" />,
      hard: <Zap className="h-5 w-5" />,
    };
    return icons[difficulty] || icons.easy;
  };

  const getDifficultyColor = (
    difficulty: string,
  ): {
    text: string;
    bg: string;
    border: string;
  } => {
    const colors: Record<string, { text: string; bg: string; border: string }> =
      {
        easy: {
          text: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-950/20",
          border: "border-green-200 dark:border-green-800",
        },
        medium: {
          text: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-950/20",
          border: "border-amber-200 dark:border-amber-800",
        },
        hard: {
          text: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-950/20",
          border: "border-red-200 dark:border-red-800",
        },
      };
    return colors[difficulty] || colors.easy;
  };

  const colors = getDifficultyColor(difficulty);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="text-green-600 dark:text-green-400 md:text-amber-600 md:dark:text-amber-400 lg:text-red-600 lg:dark:text-red-400">
            {getDifficultyIcon(difficulty)}
          </div>
          <h2 className={`text-3xl md:text-4xl font-bold ${colors.text}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}{" "}
            Difficulty
          </h2>
        </div>
        <p className="text-muted-foreground text-lg">
          {levels.length} {levels.length === 1 ? "level" : "levels"} available •{" "}
          {totalQuestions} total questions
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : levels.length === 0 ? (
        // No levels available
        <Card className="border-2 border-dashed border-muted-foreground/30">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">
              No levels available for {difficulty} difficulty yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Please check back later or try another difficulty.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Levels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {levels.map((level) => (
              <LevelCard
                key={level.levelNumber}
                level={level}
                difficulty={difficulty}
                isLoading={isLoading}
                onSelect={() => onSelectLevel(level.levelNumber)}
                showLoginPrompt={showLoginPrompt && level.levelNumber > 1}
                onLoginClick={onLoginClick}
              />
            ))}
          </div>

          {/* Login Prompt - Only show if user is NOT authenticated */}
          {showLoginPrompt && !isAuthenticated && (
            <div
              className={`${colors.bg} border-2 ${colors.border} rounded-lg p-6 text-center`}
            >
              <p className="text-foreground mb-4 font-medium flex items-center justify-center gap-2">
                <LockIcon className="h-5 w-5" />
                Create a free account to unlock Level 2+ and save your progress
              </p>
              <Button
                onClick={() => navigate("/auth/signup")}
                variant="hero"
                size="lg"
              >
                Create Account
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                You can continue playing Level 1 without logging in
              </p>
            </div>
          )}

          {/* Progress Summary */}
          {userProgress && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Progress: Level {userProgress.highestLevelUnlocked || 1}{" "}
                    unlocked
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userProgress.completedLevels?.length || 0} levels completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {(
                      ((userProgress.completedLevels?.length || 0) /
                        Math.max(levels.length, 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Individual Level Card Component
 */
interface LevelCardProps {
  level: QuizLevel;
  difficulty: string;
  isLoading: boolean;
  onSelect: () => void;
  showLoginPrompt?: boolean;
  onLoginClick?: () => void;
}

const LevelCard: React.FC<LevelCardProps> = ({
  level,
  difficulty,
  isLoading,
  onSelect,
  showLoginPrompt = false,
  onLoginClick,
}) => {
  const navigate = useNavigate();
  const isLocked = !level.isUnlocked;

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "border-green-200 dark:border-green-800 hover:border-green-400",
      medium: "border-amber-200 dark:border-amber-800 hover:border-amber-400",
      hard: "border-red-200 dark:border-red-800 hover:border-red-400",
    };
    return colors[difficulty] || colors.easy;
  };

  const handleClick = () => {
    if (isLocked) return;
    if (showLoginPrompt) {
      navigate("/auth/signup");
    } else {
      onSelect();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isLocked}
      className={`w-full text-left transition-all duration-300 transform ${
        !isLocked && !isLoading ? "hover:scale-105 cursor-pointer" : ""
      } ${isLocked ? "cursor-not-allowed" : ""} ${isLoading ? "opacity-50" : ""}`}
    >
      <Card
        className={`h-full border-2 overflow-hidden ${getDifficultyColor(
          difficulty,
        )} ${isLocked ? "opacity-60 bg-muted/30" : "bg-card"}`}
      >
        <CardContent className="p-6 space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Level {level.levelNumber}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {level.questionCount}{" "}
                {level.questionCount === 1 ? "question" : "questions"}
              </p>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Lock className="h-6 w-6 text-muted-foreground" />
              ) : level.isCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <Star className="h-6 w-6 text-amber-500" />
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {level.isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>Level completed</span>
              </>
            ) : isLocked ? (
              `Complete Level ${level.levelNumber - 1} to unlock`
            ) : (
              "Ready to start"
            )}
          </p>

          {/* CTA Button */}
          {!isLocked && (
            <div className="pt-2 flex items-center gap-2 text-primary">
              <span className="text-sm font-medium">
                {level.isCompleted ? "Review" : "Start"}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  );
};

export default LevelSelector;
