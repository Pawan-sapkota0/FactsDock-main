/**
 * Game Engine Type Definitions
 * Defines the structure for all game types and templates
 */

export type GameTemplateType = "quiz" | "flag" | "truefalse" | "timeline" | "imagereveal" | "capital";

export interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string | number;
  fact?: string; // Educational fact shown after answer
  image?: string; // Optional image URL
  difficulty?: "easy" | "medium" | "hard";
  category?: string;
}

export interface GameConfig {
  templateType: GameTemplateType;
  title: string;
  description?: string;
  questions: GameQuestion[];
  showTimer?: boolean;
  timePerQuestion?: number; // in seconds
  showXP?: boolean;
  showStreak?: boolean;
  xpPerCorrect?: number;
  xpPerIncorrect?: number;
  streakBonusXP?: number;
  theme?: "dark" | "light";
  gameId?: string;
  gameRoute?: string;
}

export interface GameState {
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  currentStreak: number;
  bestStreak: number;
  isAnswered: boolean;
  selectedAnswerIndex: number | null;
  isCorrect: boolean | null;
  gameFinished: boolean;
  startTime: number;
  endTime: number | null;
  timeSpent: number; // in seconds
}

export interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  xpEarned: number;
  bestStreak: number;
  timeSpent: number;
  averageTimePerQuestion: number;
}

export interface AnswerAnalytics {
  questionIndex: number;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}
