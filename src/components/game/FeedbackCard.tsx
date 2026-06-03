/**
 * Game Feedback Card - Achievement-style feedback after each question
 * Shows: Correct/Wrong indicator, XP gained, Streak bonus, Educational fact
 */

import React from "react";
import { CheckCircle2, XCircle, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackCardProps {
  isCorrect: boolean;
  xpGained: number;
  streakBonus: number;
  fact?: string;
  correctAnswer: string;
  className?: string;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  isCorrect,
  xpGained,
  streakBonus,
  fact,
  correctAnswer,
  className,
}) => {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border-2 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
        isCorrect
          ? "bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 border-emerald-500/50"
          : "bg-gradient-to-r from-red-900/40 to-red-800/40 border-red-500/50",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {isCorrect ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <span className="text-xl font-bold text-emerald-300">Correct!</span>
          </>
        ) : (
          <>
            <XCircle className="h-6 w-6 text-red-400" />
            <span className="text-xl font-bold text-red-300">Not quite!</span>
          </>
        )}
      </div>

      {/* XP Gained */}
      {xpGained > 0 && (
        <div className="flex items-center gap-2 bg-amber-900/30 rounded-lg px-4 py-3 border border-amber-600/30">
          <Star className="h-5 w-5 text-amber-400" />
          <span className="text-amber-300 font-semibold">+{xpGained} XP</span>
          {streakBonus > 0 && (
            <span className="ml-auto text-sm text-orange-300">
              <Zap className="inline h-4 w-4 mr-1" />+{streakBonus} streak bonus
            </span>
          )}
        </div>
      )}

      {/* Correct Answer Info */}
      {!isCorrect && (
        <div className="bg-slate-900/50 rounded-lg px-4 py-3 border border-slate-700/50">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
            Correct answer
          </p>
          <p className="text-slate-200 font-semibold">{correctAnswer}</p>
        </div>
      )}

      {/* Educational Fact */}
      {fact && (
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg px-4 py-3 border border-cyan-600/30">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-2 font-semibold">
            💡 Fun Fact
          </p>
          <p className="text-slate-200 text-sm leading-relaxed">{fact}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackCard;
