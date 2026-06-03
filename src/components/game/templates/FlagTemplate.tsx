import React, { useMemo } from "react";
import { GameEngine } from "../GameEngine";
import { GameConfig, GameQuestion } from "../types";

const shuffleOptions = (options: string[]) =>
  [...options].sort(() => Math.random() - 0.5);

export interface FlagTemplateProps {
  title: string;
  questions: Array<{
    id: string;
    country: string;
    correctFlag: string;
    options: string[];
    fact?: string;
    image?: string;
  }>;
  onBack: () => void;
  onGameComplete?: (stats: any) => void;
}

export const FlagTemplate: React.FC<FlagTemplateProps> = ({
  title,
  questions,
  onBack,
  onGameComplete,
}) => {
  const gameQuestions: GameQuestion[] = useMemo(
    () =>
      questions.map((q, idx) => ({
        id: q.id || `flag-${idx}`,
        question: `Which flag belongs to ${q.country}?`,
        options: shuffleOptions(q.options),
        correctAnswer: q.correctFlag,
        fact: q.fact,
        image: q.image,
        difficulty: "medium",
        category: "Flag",
      })),
    [questions],
  );

  const config: GameConfig = {
    templateType: "flag",
    title,
    description: "Match flags to countries in a visual challenge.",
    questions: gameQuestions,
    showTimer: true,
    timePerQuestion: 20,
    showXP: true,
    showStreak: true,
    xpPerCorrect: 12,
    xpPerIncorrect: 0,
    streakBonusXP: 6,
    theme: "dark",
    gameId: "flag-finder",
    gameRoute: "/fun-zone/flags",
  };

  return (
    <GameEngine
      config={config}
      onBack={onBack}
      onGameComplete={onGameComplete}
    />
  );
};

export default FlagTemplate;
