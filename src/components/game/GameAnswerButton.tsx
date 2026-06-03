/**
 * Game Answer Button - Premium interactive answer card
 * Features: Hover animation, click animation, correct/wrong feedback, smooth transitions
 */

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameAnswerButtonProps {
  index: number;
  text: string;
  isSelected: boolean;
  isCorrect: boolean | null; // null = not answered yet
  isAnswered: boolean;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}

export const GameAnswerButton: React.FC<GameAnswerButtonProps> = ({
  index,
  text,
  isSelected,
  isCorrect,
  isAnswered,
  disabled,
  onClick,
  className,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (isSelected && isAnswered) {
      setShowFeedback(true);
    }
  }, [isSelected, isAnswered]);

  // Determine button appearance
  let bgColor = "bg-gradient-to-r from-slate-900/60 to-slate-800/60";
  let borderColor = "border-slate-700/50";
  let hoverEffect = "";
  let icon = null;

  if (isSelected && isAnswered) {
    if (isCorrect) {
      bgColor = "bg-gradient-to-r from-emerald-900/80 to-emerald-800/80";
      borderColor = "border-emerald-500/50";
      icon = (
        <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
      );
    } else {
      bgColor = "bg-gradient-to-r from-red-900/80 to-red-800/80";
      borderColor = "border-red-500/50";
      icon = <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />;
    }
  } else if (disabled) {
    hoverEffect = "";
    borderColor = "border-slate-700/30";
  } else {
    hoverEffect =
      "hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:-translate-y-1";
    borderColor = "border-slate-600/30";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 ease-out",
        "text-left font-semibold text-lg text-white",
        "flex items-center gap-4",
        "active:scale-95",
        bgColor,
        borderColor,
        hoverEffect,
        disabled && "cursor-not-allowed",
        showFeedback && "ring-2 ring-offset-2 ring-offset-slate-950",
        isCorrect === true && "ring-emerald-500",
        isCorrect === false && "ring-red-500",
        className,
      )}
    >
      {/* Letter Badge */}
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-cyan-400 border border-cyan-400/30">
        {String.fromCharCode(65 + index)}
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        {typeof text === "string" && /^(https?:)?\/\//.test(text) ? (
          <img
            src={text}
            alt="flag option"
            className="h-10 object-contain rounded-md border border-slate-700/30"
          />
        ) : (
          <p className="break-words text-white/90">{text}</p>
        )}
      </div>

      {/* Feedback Icon */}
      {icon && <div className="flex-shrink-0">{icon}</div>}

      {/* Shimmer effect on correct answer */}
      {isSelected && isCorrect === true && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      )}
    </button>
  );
};

export default GameAnswerButton;
