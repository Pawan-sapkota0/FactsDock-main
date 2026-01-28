/**
 * Fact filtering utilities for session-based filtering logic
 * Supports: All facts, New today (in-memory), Latest release (in-memory), Not seen yet
 */

const VIEWED_FACTS_KEY = "wf:viewed_facts";
const LATEST_RELEASE_LIMIT = 20;
const NEW_TODAY_LIMIT = 15;

/**
 * Check if a fact was viewed in current session
 */
export function isFactViewed(factId: string | number): boolean {
  try {
    const viewed = JSON.parse(sessionStorage.getItem(VIEWED_FACTS_KEY) || "[]");
    return viewed.includes(String(factId));
  } catch {
    return false;
  }
}

/**
 * Mark a fact as viewed in current session
 */
export function markFactViewed(factId: string | number): void {
  try {
    const viewed = JSON.parse(sessionStorage.getItem(VIEWED_FACTS_KEY) || "[]");
    const factIdStr = String(factId);
    if (!viewed.includes(factIdStr)) {
      viewed.push(factIdStr);
      sessionStorage.setItem(VIEWED_FACTS_KEY, JSON.stringify(viewed));
    }
  } catch {
    // Silently fail if sessionStorage is unavailable
  }
}

/**
 * Get all viewed fact IDs from session
 */
export function getViewedFactIds(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(VIEWED_FACTS_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Get creation date from fact with fallbacks
 */
function getFactCreatedAt(fact: unknown): Date {
  const obj = (fact as Record<string, unknown> | null) || null;
  const dateStr = obj?.created_at ?? obj?.createdAt;

  if (!dateStr) return new Date(0);

  try {
    return new Date(String(dateStr));
  } catch {
    return new Date(0);
  }
}

/**
 * Check if a fact was created today (UTC-safe)
 */
function isFactFromToday(fact: unknown): boolean {
  const factDate = getFactCreatedAt(fact);
  
  // If no valid date found, return false
  if (factDate.getTime() === 0) return false;

  // Get today's date in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Get the fact's date in UTC
  const factDateUTC = new Date(factDate);
  factDateUTC.setUTCHours(0, 0, 0, 0);

  return factDateUTC.getTime() === today.getTime();
}

/**
 * Apply filtering based on selected filter type
 * NOTE: "newtoday" and "latest" filters work on already-fetched facts only (no DB query).
 * They operate in-memory on the current fact set.
 */
export function filterFacts(
  facts: unknown[] | null | undefined,
  filterType: string,
  viewedFactIds?: string[]
): unknown[] {
  if (!facts) return [];

  switch (filterType) {
    case "newtoday":
      // In-memory filter: Filter facts created today and take top 15
      return [...facts]
        .filter((f) => isFactFromToday(f))
        .sort((a, b) => {
          const dateA = getFactCreatedAt(a).getTime();
          const dateB = getFactCreatedAt(b).getTime();
          return dateB - dateA; // DESC order (newest first)
        })
        .slice(0, NEW_TODAY_LIMIT);

    case "latest":
      // In-memory filter: Sort by created_at DESC and take top 20
      return [...facts]
        .sort((a, b) => {
          const dateA = getFactCreatedAt(a).getTime();
          const dateB = getFactCreatedAt(b).getTime();
          return dateB - dateA; // DESC order (newest first)
        })
        .slice(0, LATEST_RELEASE_LIMIT);

    case "notseen": {
      const viewed = viewedFactIds || getViewedFactIds();
      return facts.filter((f) => {
        const obj = (f as Record<string, unknown> | null) || null;
        return !viewed.includes(String(obj?.id ?? obj?.fact_id ?? ''));
      });
    }

    case "all":
    default:
        return facts;
  }
}

/**
 * Get empty state message for a filter type
 */
export function getEmptyStateMessage(filterType: string): string {
  switch (filterType) {
    case "newtoday":
      return "No facts added today. Check back later!";
    case "latest":
      return "No facts available to display.";
    case "notseen":
      return "You've seen all available facts in this category during this session!";
    case "all":
    default:
      return "No facts available for this topic yet.";
  }
}
