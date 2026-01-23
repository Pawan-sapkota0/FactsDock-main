/**
 * Fact filtering utilities for session-based filtering logic
 * Supports: All facts, New today, Latest release, Not seen yet
 */

const VIEWED_FACTS_KEY = "wf:viewed_facts";

/**
 * Latest release window in hours - tunable constant for future adjustments
 */
const LATEST_RELEASE_WINDOW = 48;

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
 * Check if a fact was published within the last 48 hours
 */
export function isFactWithinLatestReleaseWindow(fact: any): boolean {
  const factDate = getFactDate(fact);
  const now = new Date();
  const hoursAgo = new Date(now.getTime() - LATEST_RELEASE_WINDOW * 60 * 60 * 1000);

  return factDate >= hoursAgo && factDate <= now;
}

/**
 * Check if a fact was created/published today
 */
export function isFactFromToday(fact: any): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Try multiple date field names
  const dateStr =
    fact.created_at || fact.published_at || fact.date || fact.createdAt;

  if (!dateStr) return false;

  try {
    const factDate = new Date(dateStr);
    factDate.setHours(0, 0, 0, 0);
    return factDate.getTime() === today.getTime();
  } catch {
    return false;
  }
}

/**
 * Get release/publish date from fact with fallbacks
 */
export function getFactDate(fact: any): Date {
  const dateStr =
    fact.published_at ||
    fact.release_date ||
    fact.releaseDate ||
    fact.created_at ||
    fact.createdAt ||
    fact.date;

  if (!dateStr) return new Date(0); // Return epoch if no date found

  try {
    return new Date(dateStr);
  } catch {
    return new Date(0);
  }
}

/**
 * Apply filtering based on selected filter type
 */
export function filterFacts(
  facts: any[],
  filterType: string,
  viewedFactIds?: string[]
): any[] {
  if (!facts) return [];

  switch (filterType) {
    case "newtoday":
      return facts.filter((f) => isFactFromToday(f));

    case "latest":
      // Filter facts published within last 48 hours, sorted newest first
      return [...facts]
        .filter((f) => isFactWithinLatestReleaseWindow(f))
        .sort(
          (a, b) => getFactDate(b).getTime() - getFactDate(a).getTime()
        );

    case "notseen":
      const viewed = viewedFactIds || getViewedFactIds();
      return facts.filter((f) => !viewed.includes(String(f.id || f.fact_id)));

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
      return "No facts published today yet. Check back later!";
    case "latest":
      return "No facts published in the last 48 hours. Check back soon for fresh content!";
    case "notseen":
      return "You've seen all available facts in this category during this session!";
    case "all":
    default:
        return "No facts available for this topic yet.";
  }
}
