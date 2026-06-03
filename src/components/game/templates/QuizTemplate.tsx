/**
 * Quiz Game Template
 * Adapts quiz questions to the Game Engine format
 */

import React, { useMemo } from "react";
import { GameEngine } from "../GameEngine";
import { GameConfig, GameQuestion } from "../types";

export interface QuizTemplateProps {
  questions: Array<{
    question: string;
    options: string[];
    answer: string | number;
    fact?: string;
  }>;
  title: string;
  gameId?: string;
  gameRoute?: string;
  onBack: () => void;
  onGameComplete?: (stats: any) => void;
}

export const QuizTemplate: React.FC<QuizTemplateProps> = ({
  questions,
  title,
  gameId,
  gameRoute,
  onBack,
  onGameComplete,
}) => {
  // Convert quiz questions to game format
  const gameQuestions: GameQuestion[] = useMemo(() => {
    return questions.map((q, index) => ({
      id: `q-${index}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.answer,
      fact: q.fact,
      difficulty:
        index < Math.floor(questions.length / 3)
          ? "easy"
          : index < Math.floor((questions.length * 2) / 3)
            ? "medium"
            : "hard",
    }));
  }, [questions]);

  const config: GameConfig = {
    templateType: "quiz",
    title,
    questions: gameQuestions,
    showTimer: false,
    showXP: true,
    showStreak: true,
    xpPerCorrect: 10,
    xpPerIncorrect: 0,
    streakBonusXP: 5,
    theme: "dark",
    gameId,
    gameRoute,
  };

  return (
    <GameEngine
      config={config}
      onBack={onBack}
      onGameComplete={onGameComplete}
    />
  );
};

export default QuizTemplate;
