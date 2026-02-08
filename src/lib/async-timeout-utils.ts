/**
 * Async Timeout Utilities
 * 
 * Prevents infinite loading by ensuring all async operations have hard timeouts.
 * Golden rule: Every async task must resolve or reject within a defined time.
 */

import logger from "@/lib/logger";

/**
 * Race between a promise and a timeout
 * If timeout wins, returns null (failure-safe, not throw)
 * 
 * @param promise - Promise to race
 * @param timeoutMs - Timeout in milliseconds
 * @param taskName - For logging purposes
 * @returns Result of promise or null if timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  taskName: string = "async task",
): Promise<T | null> {
  return Promise.race([
    promise.catch((err) => {
      logger.error(`[withTimeout] ${taskName} failed:`, err);
      return null as T | null;
    }),
    new Promise<T | null>((resolve) => {
      setTimeout(() => {
        logger.warn(
          `[withTimeout] ${taskName} timed out after ${timeoutMs}ms, returning null`,
        );
        resolve(null);
      }, timeoutMs);
    }),
  ]);
}

/**
 * Create a controller for a promise with timeout
 * Allows early cancellation
 * 
 * @param promise - Promise to control
 * @param timeoutMs - Timeout in milliseconds
 * @param taskName - For logging
 * @returns Object with promise and cancel method
 */
export function createTimeoutController<T>(
  promise: Promise<T>,
  timeoutMs: number,
  taskName: string = "async task",
) {
  let isCancelled = false;
  let timeoutId: NodeJS.Timeout | null = null;

  const controlledPromise = new Promise<T | null>((resolve) => {
    timeoutId = setTimeout(() => {
      isCancelled = true;
      logger.warn(
        `[TimeoutController] ${taskName} timed out after ${timeoutMs}ms`,
      );
      resolve(null);
    }, timeoutMs);

    promise
      .then((result) => {
        if (!isCancelled) {
          if (timeoutId) clearTimeout(timeoutId);
          resolve(result);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          if (timeoutId) clearTimeout(timeoutId);
          logger.error(`[TimeoutController] ${taskName} error:`, err);
          resolve(null);
        }
      });
  });

  const cancel = () => {
    isCancelled = true;
    if (timeoutId) clearTimeout(timeoutId);
  };

  return {
    promise: controlledPromise,
    cancel,
  };
}

/**
 * Retry an async operation with exponential backoff
 * Never blocks - always resolves (success or null on failure)
 * 
 * @param operation - Async function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param baseDelayMs - Initial delay between retries
 * @param maxTotalTimeMs - Maximum total time to spend (hard stop)
 * @param taskName - For logging
 * @returns Result or null on final failure
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000,
  maxTotalTimeMs: number = 10000,
  taskName: string = "operation",
): Promise<T | null> {
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const elapsedMs = Date.now() - startTime;

      // Hard time limit check
      if (elapsedMs >= maxTotalTimeMs) {
        logger.warn(
          `[withRetry] ${taskName} exceeded max time (${maxTotalTimeMs}ms), stopping retries`,
        );
        return null;
      }

      // Calculate timeout for this attempt
      const remainingMs = maxTotalTimeMs - elapsedMs;
      const attemptTimeoutMs = Math.min(
        baseDelayMs * (attempt - 1),
        remainingMs,
      );

      const result = await Promise.race<T | null>([
        operation(),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), attemptTimeoutMs);
        }),
      ]);

      if (result !== null) {
        return result;
      }

      logger.debug(
        `[withRetry] ${taskName} attempt ${attempt}/${maxAttempts} timed out`,
      );

      // Only delay if not last attempt and we have time
      if (attempt < maxAttempts) {
        const elapsedNow = Date.now() - startTime;
        const delayMs = Math.min(baseDelayMs * attempt, maxTotalTimeMs - elapsedNow);

        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    } catch (err) {
      logger.error(
        `[withRetry] ${taskName} attempt ${attempt}/${maxAttempts} error:`,
        err,
      );

      // Only retry if not last attempt
      if (attempt < maxAttempts) {
        const elapsedNow = Date.now() - startTime;
        const delayMs = Math.min(baseDelayMs * attempt, maxTotalTimeMs - elapsedNow);

        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
  }

  logger.warn(
    `[withRetry] ${taskName} failed after ${maxAttempts} attempts`,
  );
  return null;
}
