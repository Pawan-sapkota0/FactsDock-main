/**
 * Game Engine - Premium game orchestrator
 * Manages game state, logic, animations, and flow
 * Reusable across different game templates
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { GameHUD } from "./GameHUD";
import { GameAnswerButton } from "./GameAnswerButton";
import { FeedbackCard } from "./FeedbackCard";
import { GameEndScreen } from "./GameEndScreen";
import { GameConfig, GameState, GameStats } from "./types";
import { saveRecentlyPlayed } from "@/lib/recently-played";
import { Loader2 } from "lucide-react";

interface GameEngineProps {
  config: GameConfig;
  onBack: () => void;
  onGameComplete?: (stats: GameStats) => void;
  className?: string;
}

export const GameEngine: React.FC<GameEngineProps> = ({
  config,
  onBack,
  onGameComplete,
  className,
}) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: Math.max(1, config.questions.length),
    xpEarned: 0,
    currentStreak: 0,
    bestStreak: 0,
    isAnswered: false,
    selectedAnswerIndex: null,
    isCorrect: null,
    gameFinished: false,
    startTime: Date.now(),
    endTime: null,
    timeSpent: 0,
  });

  const [timeRemaining, setTimeRemaining] = useState(
    config.timePerQuestion || 30,
  );
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = useMemo(
    () => config.questions[gameState.currentQuestionIndex],
    [config.questions, gameState.currentQuestionIndex],
  );

  // Timer effect
  useEffect(() => {
    if (!config.showTimer || gameState.gameFinished || gameState.isAnswered)
      return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-select a wrong answer on timeout
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.showTimer, gameState.gameFinished, gameState.isAnswered]);

  // Handle answer selection
  const handleAnswer = useCallback(
    (selectedIndex: number) => {
      if (gameState.isAnswered) return;

      const isCorrect =
        selectedIndex >= 0 &&
        selectedIndex < currentQuestion.options.length &&
        currentQuestion.options[selectedIndex] ===
          currentQuestion.correctAnswer;

      const xpGain = isCorrect
        ? config.xpPerCorrect || 10
        : config.xpPerIncorrect || 0;
      const newStreak = isCorrect ? gameState.currentStreak + 1 : 0;
      const streakBonus =
        newStreak > 0 && newStreak % 3 === 0 ? config.streakBonusXP || 5 : 0;
      const totalXP = xpGain + streakBonus;

      setGameState((prev) => ({
        ...prev,
        isAnswered: true,
        selectedAnswerIndex: selectedIndex,
        isCorrect,
        score: isCorrect ? prev.score + 1 : prev.score,
        xpEarned: prev.xpEarned + totalXP,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      }));

      setShowFeedback(true);

      // Auto-advance after feedback
      setTimeout(() => {
        if (gameState.currentQuestionIndex + 1 >= config.questions.length) {
          setGameState((prev) => ({
            ...prev,
            gameFinished: true,
            endTime: Date.now(),
            timeSpent: Math.round((Date.now() - prev.startTime) / 1000),
          }));
        } else {
          setGameState((prev) => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
            isAnswered: false,
            selectedAnswerIndex: null,
            isCorrect: null,
          }));
          setTimeRemaining(config.timePerQuestion || 30);
          setShowFeedback(false);
        }
      }, 3000);
    },
    [
      gameState.currentQuestionIndex,
      gameState.currentStreak,
      currentQuestion,
      config,
    ],
  );

  // Calculate game statistics
  const stats: GameStats = useMemo(
    () => ({
      totalQuestions: gameState.totalQuestions,
      correctAnswers: gameState.score,
      accuracy:
        gameState.totalQuestions > 0
          ? Math.round((gameState.score / gameState.totalQuestions) * 100)
          : 0,
      xpEarned: gameState.xpEarned,
      bestStreak: gameState.bestStreak,
      timeSpent: gameState.timeSpent,
      averageTimePerQuestion:
        gameState.totalQuestions > 0
          ? Math.round(gameState.timeSpent / gameState.totalQuestions)
          : 0,
    }),
    [gameState],
  );

  // Notify completion and persist recently played when game metadata is available
  useEffect(() => {
    if (!gameState.gameFinished) return;

    if (config.gameId) {
      saveRecentlyPlayed({ id: config.gameId, progress: 100 });
    }

    if (onGameComplete) {
      onGameComplete(stats);
    }
  }, [config.gameId, gameState.gameFinished, onGameComplete, stats]);

  // Render end screen
  if (gameState.gameFinished) {
    return (
      <GameEndScreen
        score={stats.correctAnswers}
        totalQuestions={stats.totalQuestions}
        accuracy={stats.accuracy}
        xpEarned={stats.xpEarned}
        bestStreak={stats.bestStreak}
        timeSpent={stats.timeSpent}
        onPlayAgain={() => {
          setGameState({
            currentQuestionIndex: 0,
            score: 0,
            totalQuestions: config.questions.length,
            xpEarned: 0,
            currentStreak: 0,
            bestStreak: 0,
            isAnswered: false,
            selectedAnswerIndex: null,
            isCorrect: null,
            gameFinished: false,
            startTime: Date.now(),
            endTime: null,
            timeSpent: 0,
          });
          setTimeRemaining(config.timePerQuestion || 30);
          setShowFeedback(false);
        }}
        onClose={onBack}
      />
    );
  }

  // Render loading state
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-cyan-400" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-slate-950", className)}>
      {/* HUD */}
      <GameHUD
        currentQuestion={gameState.currentQuestionIndex + 1}
        totalQuestions={gameState.totalQuestions}
        score={gameState.score}
        xp={gameState.xpEarned}
        streak={gameState.currentStreak}
        timeRemaining={timeRemaining}
        showTimer={config.showTimer}
        onBackClick={onBack}
      />

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Question Card */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-2 border-cyan-500/20 rounded-3xl p-8 md:p-10">
              <p className="text-slate-400 text-sm uppercase tracking-[0.2em] font-semibold mb-4">
                Question {gameState.currentQuestionIndex + 1}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                {currentQuestion.question}
              </h2>

              {/* Optional Image */}
              {currentQuestion.image && (
                <img
                  src={currentQuestion.image}
                  alt="Question visual"
                  className="mt-6 rounded-2xl w-full max-h-64 object-cover"
                />
              )}
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 stagger-in-from-bottom">
            {currentQuestion.options.map((option, index) => (
              <GameAnswerButton
                key={`${gameState.currentQuestionIndex}-${index}`}
                index={index}
                text={String(option)}
                isSelected={gameState.selectedAnswerIndex === index}
                isCorrect={
                  gameState.isAnswered &&
                  gameState.selectedAnswerIndex === index
                    ? gameState.isCorrect
                    : null
                }
                isAnswered={gameState.isAnswered}
                disabled={gameState.isAnswered}
                onClick={() => handleAnswer(index)}
              />
            ))}
          </div>

          {/* Feedback Card */}
          {showFeedback && gameState.isAnswered && (
            <FeedbackCard
              isCorrect={gameState.isCorrect || false}
              xpGained={
                gameState.isCorrect
                  ? (config.xpPerCorrect || 10) +
                    (gameState.currentStreak % 3 === 0
                      ? config.streakBonusXP || 5
                      : 0)
                  : 0
              }
              streakBonus={
                gameState.isCorrect && gameState.currentStreak % 3 === 0
                  ? config.streakBonusXP || 5
                  : 0
              }
              fact={currentQuestion.fact}
              correctAnswer={String(currentQuestion.correctAnswer)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default GameEngine;
