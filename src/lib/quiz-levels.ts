/**
 * Quiz Levels System
 * Handles dynamic level calculation and slicing of quiz questions
 * Levels are NOT stored in DB - calculated at runtime based on question count
 */

export interface Quiz {
  id?: string;
  question: string;
  options: string[];
  answer: string;
  difficulty?: string;
  category?: string;
  [key: string]: unknown;
}

export interface QuizLevel {
  levelNumber: number;
  startIndex: number;
  endIndex: number;
  questionCount: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface LevelQuestions {
  level: number;
  questions: Quiz[];
  totalInLevel: number;
}

/**
 * Calculate quiz levels based on total question count
 * Default: 10 questions per level
 * 
 * @param totalQuestions - Total number of questions available
 * @param questionsPerLevel - Questions per level (default 10)
 * @param userProgress - User's highest unlocked level and completed levels
 * @returns Array of QuizLevel objects with unlock/completion status
 */
export function calculateLevels(
  totalQuestions: number,
  questionsPerLevel: number = 10,
  userProgress?: {
    highestLevelUnlocked?: number;
    completedLevels?: number[];
  }
): QuizLevel[] {
  const highestUnlocked = userProgress?.highestLevelUnlocked ?? 1;
  const completedLevels = userProgress?.completedLevels ?? [];

  const levels: QuizLevel[] = [];
  let levelNum = 1;
  let startIdx = 0;

  while (startIdx < totalQuestions) {
    const endIdx = Math.min(startIdx + questionsPerLevel - 1, totalQuestions - 1);
    const questionCount = endIdx - startIdx + 1;

    levels.push({
      levelNumber: levelNum,
      startIndex: startIdx,
      endIndex: endIdx,
      questionCount,
      isUnlocked: levelNum <= highestUnlocked,
      isCompleted: completedLevels.includes(levelNum),
    });

    startIdx = endIdx + 1;
    levelNum++;
  }

  return levels;
}

/**
 * Get questions for a specific level
 * Uses deterministic slicing - always returns same questions for same level
 * 
 * @param questions - All questions for the quiz
 * @param levelNumber - The level to get questions for
 * @param questionsPerLevel - Questions per level (default 10)
 * @returns Questions for the specified level
 */
export function getQuestionsForLevel(
  questions: Quiz[],
  levelNumber: number,
  questionsPerLevel: number = 10
): Quiz[] {
  const level = calculateLevels(questions.length, questionsPerLevel).find(
    (l) => l.levelNumber === levelNumber
  );

  if (!level) {
    return [];
  }

  return questions.slice(level.startIndex, level.endIndex + 1);
}

/**
 * Get auto-generated level descriptions based on difficulty
 * 
 * @param difficulty - 'easy' | 'medium' | 'hard'
 * @param levelNumber - The level number
 * @returns Description text for the level
 */
export function getLevelDescription(
  difficulty: string,
  levelNumber: number
): string {
  const difficultyDescriptions: Record<string, string> = {
    easy: "Basics & introductions",
    medium: "Geography, culture & details",
    hard: "History & advanced facts",
  };

  const base = difficultyDescriptions[difficulty] || "Educational content";
  const levelHint = `• Level ${levelNumber} progression`;

  return `${base}\n${levelHint}`;
}

/**
 * Validate level number against available levels
 * 
 * @param levelNumber - Level to validate
 * @param totalQuestions - Total questions available
 * @param questionsPerLevel - Questions per level
 * @returns true if level exists
 */
export function isValidLevel(
  levelNumber: number,
  totalQuestions: number,
  questionsPerLevel: number = 10
): boolean {
  const levels = calculateLevels(totalQuestions, questionsPerLevel);
  return levels.some((l) => l.levelNumber === levelNumber);
}

/**
 * Get total levels available
 * 
 * @param totalQuestions - Total questions available
 * @param questionsPerLevel - Questions per level
 * @returns Number of levels
 */
export function getTotalLevels(
  totalQuestions: number,
  questionsPerLevel: number = 10
): number {
  return calculateLevels(totalQuestions, questionsPerLevel).length;
}
