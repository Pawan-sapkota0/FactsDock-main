import React, { useMemo } from "react";
import { GameEngine } from "../GameEngine";
import { GameConfig, GameQuestion } from "../types";

export interface MemoryTemplateProps {
  title: string;
  pairs: Array<{ id: string; prompt: string; match: string; fact?: string }>;
  onBack: () => void;
  onGameComplete?: (stats: any) => void;
}

export const MemoryTemplate: React.FC<MemoryTemplateProps> = ({
  title,
  pairs,
  onBack,
  onGameComplete,
}) => {
  const randomizeOptions = (correct: string, allMatches: string[]) => {
    const wrongOptions = allMatches.filter((match) => match !== correct);
    const shuffledWrong = [...wrongOptions].sort(() => Math.random() - 0.5);
    const selectedWrong = shuffledWrong.slice(0, 3);
    const options = [correct, ...selectedWrong].sort(() => Math.random() - 0.5);
    return options;
  };

  const gameQuestions: GameQuestion[] = useMemo(() => {
    const allMatches = pairs.map((p) => p.match);

    return pairs.map((p) => ({
      id: `${p.id}-a`,
      question: `Match: ${p.prompt}`,
      options: randomizeOptions(p.match, allMatches),
      correctAnswer: p.match,
      fact: p.fact,
      difficulty: "easy",
      category: "Memory",
    }));
  }, [pairs]);

  const config: GameConfig = {
    templateType: "truefalse",
    title,
    description: "Memory match challenge - pair up matching items.",
    questions: gameQuestions,
    showTimer: false,
    showXP: true,
    showStreak: true,
    xpPerCorrect: 10,
    xpPerIncorrect: 0,
    streakBonusXP: 5,
    theme: "dark",
    gameId: "memory-match",
    gameRoute: "/fun-zone/memory",
  };

  return (
    <GameEngine
      config={config}
      onBack={onBack}
      onGameComplete={onGameComplete}
    />
  );
};

export default MemoryTemplate;
