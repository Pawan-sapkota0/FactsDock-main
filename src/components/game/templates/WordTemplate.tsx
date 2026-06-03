import React, { useMemo } from "react";
import { GameEngine } from "../GameEngine";
import { GameConfig, GameQuestion } from "../types";

export interface WordTemplateProps {
  title: string;
  questions: Array<{ id: string; prompt: string; correct: string; options: string[]; fact?: string }>;
  onBack: () => void;
  onGameComplete?: (stats: any) => void;
}

export const WordTemplate: React.FC<WordTemplateProps> = ({
  title,
  questions,
  onBack,
  onGameComplete,
}) => {
  const gameQuestions: GameQuestion[] = useMemo(
    () =>
      questions.map((q, idx) => ({
        id: q.id || `word-${idx}`,
        question: q.prompt,
        options: q.options,
        correctAnswer: q.correct,
        fact: q.fact,
        difficulty: "medium",
        category: "Word",
      })),
    [questions],
  );

  const config: GameConfig = {
    templateType: "quiz",
    title,
    description: "Word puzzles to test vocabulary and speed.",
    questions: gameQuestions,
    showTimer: true,
    timePerQuestion: 25,
    showXP: true,
    showStreak: true,
    xpPerCorrect: 14,
    xpPerIncorrect: 0,
    streakBonusXP: 8,
    theme: "dark",
    gameId: "word-wizard",
    gameRoute: "/fun-zone/word-wizard",
  };

  return (
    <GameEngine config={config} onBack={onBack} onGameComplete={onGameComplete} />
  );
};

export default WordTemplate;
