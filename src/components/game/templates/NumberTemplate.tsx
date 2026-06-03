import React, { useMemo } from "react";
import { GameEngine } from "../GameEngine";
import { GameConfig, GameQuestion } from "../types";

export interface NumberTemplateProps {
  title: string;
  questions: Array<{ id: string; prompt: string; correct: string; options: string[] }>; 
  onBack: () => void;
  onGameComplete?: (stats: any) => void;
}

export const NumberTemplate: React.FC<NumberTemplateProps> = ({
  title,
  questions,
  onBack,
  onGameComplete,
}) => {
  const gameQuestions: GameQuestion[] = useMemo(
    () =>
      questions.map((q, idx) => ({
        id: q.id || `num-${idx}`,
        question: q.prompt,
        options: q.options,
        correctAnswer: q.correct,
        difficulty: "hard",
        category: "Number",
      })),
    [questions],
  );

  const config: GameConfig = {
    templateType: "quiz",
    title,
    description: "Fast math puzzles to hone your calculation speed.",
    questions: gameQuestions,
    showTimer: true,
    timePerQuestion: 18,
    showXP: true,
    showStreak: true,
    xpPerCorrect: 16,
    xpPerIncorrect: 0,
    streakBonusXP: 10,
    theme: "dark",
    gameId: "number-navigator",
    gameRoute: "/fun-zone/number-navigator",
  };

  return (
    <GameEngine config={config} onBack={onBack} onGameComplete={onGameComplete} />
  );
};

export default NumberTemplate;
