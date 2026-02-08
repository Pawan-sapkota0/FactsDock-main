/**
 * Quiz Progress Management
 * Handles both guest (localStorage) and authenticated user progress
 */

import { log, error as logError } from "@/lib/logger";

export interface QuizProgressRecord {
  mode: "country" | "fun" | "world" | "random";
  country?: string | null;
  difficulty: "easy" | "medium" | "hard" | "all";
  highestLevelUnlocked: number;
  completedLevels: number[];
  lastPlayedAt?: string;
  score?: number;
}

const PROGRESS_PREFIX = "wf:quiz:progress";

/**
 * Generate a unique progress key for storage
 */
function generateProgressKey(
  mode: string,
  difficulty: string,
  country?: string | null
): string {
  const countryPart = country ? `:${country.toLowerCase()}` : "";
  return `${PROGRESS_PREFIX}:${mode}:${difficulty}${countryPart}`;
}

/**
 * Save guest user progress to localStorage
 * Called when user plays Level 1+ without being logged in
 */
export function saveGuestProgress(
  mode: "country" | "fun" | "world",
  difficulty: "easy" | "medium" | "hard",
  levelUnlocked: number,
  completedLevels: number[] = [],
  country?: string | null
): void {
  try {
    const key = generateProgressKey(mode, difficulty, country);
    const progress: QuizProgressRecord = {
      mode,
      difficulty,
      country: country || null,
      highestLevelUnlocked: levelUnlocked,
      completedLevels,
      lastPlayedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (e) {
    logError("[saveGuestProgress] Error:", e);
  }
}

/**
 * Get guest user progress from localStorage
 */
export function getGuestProgress(
  mode: string,
  difficulty: string,
  country?: string | null
): QuizProgressRecord | null {
  try {
    const key = generateProgressKey(mode, difficulty, country);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    logError("[getGuestProgress] Error:", e);
    return null;
  }
}

/**
 * Complete a level for guest user
 * Unlocks next level automatically
 */
export function completeGuestLevel(
  mode: "country" | "fun" | "world",
  difficulty: "easy" | "medium" | "hard",
  levelNumber: number,
  country?: string | null
): QuizProgressRecord {
  const current = getGuestProgress(mode, difficulty, country) || {
    mode,
    difficulty,
    country: country || null,
    highestLevelUnlocked: 1,
    completedLevels: [],
  };

  // Mark level as completed
  if (!current.completedLevels.includes(levelNumber)) {
    current.completedLevels.push(levelNumber);
  }

  // Unlock next level
  if (levelNumber >= current.highestLevelUnlocked) {
    current.highestLevelUnlocked = levelNumber + 1;
  }

  current.lastPlayedAt = new Date().toISOString();

  saveGuestProgress(
    mode,
    difficulty,
    current.highestLevelUnlocked,
    current.completedLevels,
    country
  );

  return current;
}

/**
 * Clear all guest progress for a specific quiz
 * Useful for "Reset Progress" button
 */
export function clearGuestProgress(
  mode: string,
  difficulty: string,
  country?: string | null
): void {
  try {
    const key = generateProgressKey(mode, difficulty, country);
    localStorage.removeItem(key);
  } catch (e) {
    logError("[clearGuestProgress] Error:", e);
  }
}

/**
 * Get all guest progress records
 * Useful for showing progress summary
 */
export function getAllGuestProgress(): QuizProgressRecord[] {
  try {
    const all: QuizProgressRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PROGRESS_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            all.push(JSON.parse(raw));
          } catch (e) {
            // Skip malformed entries
          }
        }
      }
    }
    return all;
  } catch (e) {
    logError("[getAllGuestProgress] Error:", e);
    return [];
  }
}

/**
 * Check if user should see login prompt
 * Show after completing Level 1
 */
export function shouldShowLoginPrompt(
  mode: string,
  difficulty: string,
  country?: string | null
): boolean {
  const progress = getGuestProgress(mode, difficulty, country);
  if (!progress) return false;

  // Show prompt if completed level 1 and trying to access level 2+
  return (
    progress.completedLevels.includes(1) &&
    progress.highestLevelUnlocked >= 2
  );
}

/**
 * Check if a level can be accessed by the user
 * READ-ONLY validation - does not modify progress
 * 
 * Sequential unlock rule: User can access level N only if level N-1 is completed.
 * Level 1 is always accessible for first-time users.
 * 
 * @param levelNumber - The level to check access for
 * @param userProgress - User's progress containing highestLevelUnlocked
 * @returns { canAccess: boolean, requiredLevel?: number } - Access status and required completion level if locked
 * 
 * @example
 * const progress = getGuestProgress("random", "all");
 * const { canAccess, requiredLevel } = canAccessLevel(2, progress);
 * if (!canAccess) {
 *   toast(`Complete Level ${requiredLevel} to unlock Level 2`);
 * }
 */
export function canAccessLevel(
  levelNumber: number,
  userProgress?: QuizProgressRecord | null | { highestLevelUnlocked?: number }
): { canAccess: boolean; requiredLevel?: number } {
  // Level 1 is always accessible
  if (levelNumber <= 1) {
    return { canAccess: true };
  }

  // Get highest unlocked level, default to 1
  const highestUnlocked = userProgress?.highestLevelUnlocked ?? 1;

  // Can access level N only if N <= highestUnlocked
  // This ensures sequential progression: must complete level N-1 to unlock level N
  const canAccess = levelNumber <= highestUnlocked;
  
  if (!canAccess) {
    // Return the previous level that must be completed first
    return {
      canAccess: false,
      requiredLevel: levelNumber - 1,
    };
  }

  return { canAccess: true };
}

/**
 * Merge guest progress into user account after login
 * Called by auth context when user logs in
 * NOTE: This is a placeholder - actual server-side merge happens via Supabase
 */
export function migrateGuestProgressToUser(userId: string): void {
  try {
    const allProgress = getAllGuestProgress();
    if (allProgress.length === 0) return;

    // Store migration flag in localStorage for later sync
    localStorage.setItem(
      `${PROGRESS_PREFIX}:migrate:${userId}`,
      JSON.stringify({
        progress: allProgress,
        migratedAt: new Date().toISOString(),
      })
    );

    log(
      `[migrateGuestProgressToUser] Flagged ${allProgress.length} records for sync`
    );
  } catch (e) {
    logError("[migrateGuestProgressToUser] Error:", e);
  }
}

/**
 * Get random quiz progress with TTL caching (like facts)
 */
export function getRandomQuizProgress(): {
  highestLevelUnlocked: number;
  completedLevels: number[];
} {
  try {
    const key = `${PROGRESS_PREFIX}:random:levels`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { highestLevelUnlocked: 1, completedLevels: [] };
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    logError("[getRandomQuizProgress] Error:", e);
    return { highestLevelUnlocked: 1, completedLevels: [] };
  }
}

/**
 * Save random quiz progress with TTL caching (like facts)
 */
export function saveRandomQuizProgress(
  highestLevelUnlocked: number,
  completedLevels: number[]
): void {
  try {
    const key = `${PROGRESS_PREFIX}:random:levels`;
    const progress = {
      highestLevelUnlocked,
      completedLevels,
      lastPlayedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(progress));
    log(`[saveRandomQuizProgress] Saved: level ${highestLevelUnlocked}`);
  } catch (e) {
    logError("[saveRandomQuizProgress] Error:", e);
  }
}

/**
 * Complete a random level and unlock next
 */
export function completeRandomLevel(
  levelNumber: number
): {
  highestLevelUnlocked: number;
  completedLevels: number[];
} {
  try {
    const current = getRandomQuizProgress();

    // Mark level as completed
    if (!current.completedLevels.includes(levelNumber)) {
      current.completedLevels.push(levelNumber);
    }

    // Unlock next level
    if (levelNumber >= current.highestLevelUnlocked) {
      current.highestLevelUnlocked = levelNumber + 1;
    }

    saveRandomQuizProgress(
      current.highestLevelUnlocked,
      current.completedLevels
    );
    return current;
  } catch (e) {
    logError("[completeRandomLevel] Error:", e);
    return getRandomQuizProgress();
  }
}


