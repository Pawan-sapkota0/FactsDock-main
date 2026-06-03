/**
 * Game HUD - Premium game header
 * Shows: Back button, Progress bar, Score, XP, Streak, Timer
 */

import React, { useEffect, useState } from "react";
import { ArrowLeft, Flame, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameHUDProps {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  xp: number;
  streak: number;
  timeRemaining?: number;
  showTimer?: boolean;
  onBackClick: () => void;
  className?: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentQuestion,
  totalQuestions,
  score,
  xp,
  streak,
  timeRemaining,
  showTimer = false,
  onBackClick,
  className,
}) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining || 0);
  const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;

  useEffect(() => {
    setDisplayTime(timeRemaining || 0);
  }, [timeRemaining]);

  const isTimeRunningOut = displayTime < 10 && displayTime > 0;

  return (
    <div
      className={cn(
        "sticky top-0 z-40 bg-gradient-to-b from-slate-950 to-slate-950/80 border-b border-white/10 backdrop-blur-sm",
        className,
      )}
    >
      <div className="px-4 md:px-6 py-4 space-y-3">
        {/* Top Row: Back Button + Stats */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="text-slate-300 hover:text-white hover:bg-white/10 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Stats Row */}
          <div className="flex items-center gap-6">
            {/* Score */}
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                Score
              </span>
              <span className="text-lg font-bold text-cyan-400">{score}</span>
            </div>

            {/* XP */}
            {xp > 0 && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                    XP
                  </span>
                </div>
                <span className="text-lg font-bold text-amber-400">{xp}</span>
              </div>
            )}

            {/* Streak */}
            {streak > 0 && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                    Streak
                  </span>
                </div>
                <span className="text-lg font-bold text-orange-400">
                  {streak}
                </span>
              </div>
            )}

            {/* Timer */}
            {showTimer && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                    Time
                  </span>
                </div>
                <span
                  className={cn(
                    "text-lg font-bold",
                    isTimeRunningOut
                      ? "text-red-400 animate-pulse"
                      : "text-slate-300",
                  )}
                >
                  {Math.max(0, displayTime)}s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-900/50 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 rounded-full transition-all duration-500 ease-out shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            {currentQuestion}/{totalQuestions}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
