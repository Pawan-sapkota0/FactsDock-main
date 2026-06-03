/**
 * Capital Challenge Template
 * Converts world capital questions into the reusable game engine format.
 */

import React, { useMemo } from "react";
import { GameEngine } from "../GameEngine";
import { GameConfig, GameQuestion } from "../types";

export interface CapitalTemplateProps {
  questions: Array<{
    id: string;
    country: string;
    capital: string;
    options: string[];
    fact?: string;
    image?: string;
  }>;
  title: string;
  onBack: () => void;
  onGameComplete?: (stats: any) => void;
}

export const CapitalTemplate: React.FC<CapitalTemplateProps> = ({
  questions,
  title,
  onBack,
  onGameComplete,
}) => {
  const gameQuestions: GameQuestion[] = useMemo(
    () =>
      questions.map((question, index) => ({
        id: question.id || `capital-${index}`,
        question: `What is the capital of ${question.country}?`,
        options: question.options,
        correctAnswer: question.capital,
        fact: question.fact,
        image: question.image,
        difficulty: "medium",
        category: "Capital",
      })),
    [questions],
  );

  const config: GameConfig = {
    templateType: "capital",
    title,
    description: "Identify world capitals before the timer runs out.",
    questions: gameQuestions,
    showTimer: true,
    timePerQuestion: 18,
    showXP: true,
    showStreak: true,
    xpPerCorrect: 15,
    xpPerIncorrect: 0,
    streakBonusXP: 10,
    theme: "dark",
    gameId: "capital-challenge",
    gameRoute: "/fun-zone/capitals",
  };

  return (
    <GameEngine
      config={config}
      onBack={onBack}
      onGameComplete={onGameComplete}
    />
  );
};

export default CapitalTemplate;
