import React, { useMemo } from "react";
import { GameEngine } from "../GameEngine";
import { GameConfig, GameQuestion } from "../types";

export interface ScienceTemplateProps {
  title: string;
  questions: Array<{ id: string; prompt: string; correct: string; options: string[]; fact?: string }>;
  onBack: () => void;
  onGameComplete?: (stats: any) => void;
}

export const ScienceTemplate: React.FC<ScienceTemplateProps> = ({
  title,
  questions,
  onBack,
  onGameComplete,
}) => {
  const gameQuestions: GameQuestion[] = useMemo(
    () =>
      questions.map((q, idx) => ({
        id: q.id || `sci-${idx}`,
        question: q.prompt,
        options: q.options,
        correctAnswer: q.correct,
        fact: q.fact,
        difficulty: "medium",
        category: "Science",
      })),
    [questions],
  );

  const config: GameConfig = {
    templateType: "quiz",
    title,
    description: "Quick science facts and questions to test your knowledge.",
    questions: gameQuestions,
    showTimer: true,
    timePerQuestion: 22,
    showXP: true,
    showStreak: true,
    xpPerCorrect: 12,
    xpPerIncorrect: 0,
    streakBonusXP: 6,
    theme: "dark",
    gameId: "science-sprint",
    gameRoute: "/fun-zone/science-sprint",
  };

  return (
    <GameEngine config={config} onBack={onBack} onGameComplete={onGameComplete} />
  );
};

export default ScienceTemplate;
