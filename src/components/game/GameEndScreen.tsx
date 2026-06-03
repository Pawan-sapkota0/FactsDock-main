/**
 * Game End Screen - Premium results and completion screen
 * Shows: Score, Accuracy, XP Earned, Best Streak, Achievements, Next Steps
 */

import React from "react";
import { Share2, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
}

interface GameEndScreenProps {
  score: number;
  totalQuestions: number;
  accuracy: number;
  xpEarned: number;
  bestStreak: number;
  timeSpent: number;
  achievements?: Achievement[];
  onPlayAgain: () => void;
  onNextGame?: () => void;
  onShare?: () => void;
  onClose?: () => void;
  className?: string;
}

export const GameEndScreen: React.FC<GameEndScreenProps> = ({
  score,
  totalQuestions,
  accuracy,
  xpEarned,
  bestStreak,
  timeSpent,
  achievements = [],
  onPlayAgain,
  onNextGame,
  onShare,
  onClose,
  className,
}) => {
  const getPerformanceRating = (accuracy: number) => {
    if (accuracy === 100) return { title: "Perfect! 🎉", color: "text-yellow-400" };
    if (accuracy >= 80) return { title: "Excellent! 🌟", color: "text-emerald-400" };
    if (accuracy >= 60) return { title: "Good Job! 👏", color: "text-cyan-400" };
    if (accuracy >= 40) return { title: "Nice Try! 💪", color: "text-blue-400" };
    return { title: "Keep Practicing! 📚", color: "text-slate-400" };
  };

  const performance = getPerformanceRating(accuracy);
  const avgTime =
    totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <div
      className={cn(
        "w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 md:px-6 space-y-8",
        className,
      )}
    >
      {/* Celebration Animation */}
      <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Rating */}
        <div>
          <h1
            className={cn(
              "text-5xl md:text-6xl font-black mb-2",
              performance.color,
            )}
          >
            {performance.title}
          </h1>
          <p className="text-slate-400 text-lg">Quiz Complete!</p>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-2 border-cyan-500/30 rounded-3xl p-8 md:p-10 space-y-6">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {/* Score */}
            <div className="flex flex-col items-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2 font-bold">
                Score
              </p>
              <p className="text-3xl md:text-4xl font-black text-cyan-400">
                {score}/{totalQuestions}
              </p>
            </div>

            {/* Accuracy */}
            <div className="flex flex-col items-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2 font-bold">
                Accuracy
              </p>
              <p className="text-3xl md:text-4xl font-black text-emerald-400">
                {accuracy}%
              </p>
            </div>

            {/* Time */}
            <div className="flex flex-col items-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2 font-bold">
                Time
              </p>
              <p className="text-3xl md:text-4xl font-black text-amber-400">
                {timeSpent}s
              </p>
            </div>
          </div>

          {/* XP Earned */}
          <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-2 border-amber-600/40 rounded-2xl px-6 py-4 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300 mb-1 font-bold">
              Total XP Earned
            </p>
            <p className="text-4xl font-black text-amber-300">+{xpEarned}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-xl px-4 py-3 text-center border border-slate-700/50">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">
                Best Streak
              </p>
              <p className="text-2xl font-bold text-orange-400">
                {bestStreak}🔥
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl px-4 py-3 text-center border border-slate-700/50">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">
                Avg. Time
              </p>
              <p className="text-2xl font-bold text-cyan-400">{avgTime}s</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">
              🏆 Achievements Unlocked
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border-2 border-amber-500/30 rounded-2xl p-4 text-center"
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="text-sm font-bold text-amber-300">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        <Button
          onClick={onPlayAgain}
          size="lg"
          className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold h-14 text-lg"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Play Again
        </Button>

        <div className="flex gap-3">
          {onShare && (
            <Button
              onClick={onShare}
              variant="outline"
              size="lg"
              className="flex-1 border-white/20 hover:bg-white/10 h-12"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}

          {onNextGame && (
            <Button
              onClick={onNextGame}
              variant="outline"
              size="lg"
              className="flex-1 border-white/20 hover:bg-white/10 h-12"
            >
              Next Game
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="lg"
              className="flex-1 h-12"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default GameEndScreen;
