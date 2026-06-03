/**
 * Premium Quiz Modal - Uses the new Game Engine
 * Backward compatible with existing QuizModal API
 */

import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GameEngine } from "@/components/game/GameEngine";
import { GameConfig, GameQuestion } from "@/components/game/types";
import { generateQuizForTopic, generateRandomQuiz } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { log, error as logError } from "@/lib/logger";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  topic?: string;
  sourceType?: "fun" | "world" | "country" | "global" | "random";
  questionCount?: number;
  onComplete?: () => void;
};

async function fetchQuestions(
  topic: string | undefined,
  count: number,
  sourceType?: string,
) {
  let res;
  if (sourceType) {
    res = await generateQuizForTopic(topic, count, { sourceType, force: true });
  } else if (topic) {
    res = await generateQuizForTopic(topic, count, { force: true });
  } else {
    res = await generateRandomQuiz(count);
  }

  const questions: GameQuestion[] = (res || []).map((q: any, index: number) => {
    const questionRaw = q.question ?? q.title ?? "Question";
    const question = String(questionRaw ?? "");
    const optionsRaw = q.options ?? q.choices ?? q.answers ?? [];
    const options = Array.isArray(optionsRaw)
      ? (optionsRaw as unknown[]).map((o) => String(o))
      : [];
    const answer = q.answer ?? q.correctAnswer ?? q.correct_answer ?? "";

    return {
      id: `q-${index}`,
      question,
      options,
      correctAnswer: answer,
      fact: q.fact || q.explanation,
      difficulty:
        index < Math.floor(res.length / 3)
          ? "easy"
          : index < Math.floor((res.length * 2) / 3)
            ? "medium"
            : "hard",
    };
  });

  return questions;
}

export const PremiumQuizModal: React.FC<Props> = ({
  open,
  onOpenChange,
  topic,
  sourceType,
  questionCount = 10,
  onComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  // Load questions when modal opens
  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const qs = await fetchQuestions(topic, questionCount, sourceType);
        if (!mounted) return;

        setQuestions(qs);

        const config: GameConfig = {
          templateType: "quiz",
          title: topic ? `Quiz: ${topic}` : "Quiz Challenge",
          description: "Test your knowledge",
          questions: qs,
          showTimer: false,
          showXP: true,
          showStreak: true,
          xpPerCorrect: 10,
          xpPerIncorrect: 0,
          streakBonusXP: 5,
          theme: "dark",
        };

        setGameConfig(config);
      } catch (e) {
        logError("Failed to load quiz questions", e);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [open, topic, questionCount, sourceType]);

  const handleGameComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
    // Close modal after a short delay
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  }, [onComplete, onOpenChange]);

  const handleBack = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Loading state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-screen md:h-auto border-0 bg-slate-950">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
              <p className="text-slate-400">Generating questions...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Game state
  if (gameConfig && questions.length > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-screen md:h-auto border-0 bg-slate-950 p-0">
          <GameEngine
            config={gameConfig}
            onBack={handleBack}
            onGameComplete={handleGameComplete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Empty state
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-0 bg-slate-950">
        <div className="text-center py-8">
          <p className="text-slate-400">No quiz available. Please try again.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumQuizModal;
