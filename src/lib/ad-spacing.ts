/**
 * Reusable Ad Spacing Utilities
 *
 * These spacing rules ensure consistent layout, prevent CLS (Cumulative Layout Shift),
 * and maintain professional appearance across all ad placements.
 *
 * Core Principles:
 * - Always reserve space to prevent layout shift
 * - Ads are never mixed inside content
 * - Ads appear only after meaningful content
 * - Consistent margins and min-height across all placements
 */

export const AD_SPACING = {
  /**
   * Standard ad spacing: 32px top/bottom margin
   * Used for most ad placements where ads are a clear visual break
   * Min-height prevents CLS before ads load
   */
  standard: {
    marginTop: "32px",
    marginBottom: "32px",
    minHeight: "90px",
  },

  /**
   * Quiz completion spacing: tighter margins
   * Used after quiz results where attention is high
   * Higher min-height for better appearance post-result
   */
  quiz: {
    marginTop: "24px",
    marginBottom: "24px",
    minHeight: "120px",
  },

  /**
   * Compact spacing: minimal margins
   * Used in constrained areas or sidebar-like placements
   */
  compact: {
    marginTop: "16px",
    marginBottom: "16px",
    minHeight: "90px",
  },

  /**
   * Premium spacing: generous margins
   * Used for high-value placements where user attention is guaranteed
   */
  premium: {
    marginTop: "40px",
    marginBottom: "40px",
    minHeight: "120px",
  },
} as const;

/**
 * Predefined ad slot configurations
 * Each slot has its own spacing based on context and user experience
 */
export const AD_SLOTS = {
  /**
   * COUNTRY_FACTS_BOTTOM: Below news section on country page
   * Context: User has consumed facts, news, stats
   * Attention: High (user has engaged with content)
   * Risk: Low (no disruption of content flow)
   */
  COUNTRY_FACTS_BOTTOM: {
    slot: "5914638491",
    spacing: AD_SPACING.standard,
    description: "Below news section - country facts page",
  },

  /**
   * FACTS_PAGE_BOTTOM: Below facts list and pagination on facts page
   * Context: User has scrolled through facts
   * Attention: Medium (pagination signals content end)
   * Risk: Low (clear content boundary)
   */
  FACTS_PAGE_BOTTOM: {
    slot: "3719485201",
    spacing: AD_SPACING.standard,
    description: "Below facts list - facts archive page",
  },

  /**
   * QUIZ_RESULT: After quiz completion, below result/score
   * Context: User just finished quiz, high engagement moment
   * Attention: Highest (peak user attention point)
   * Risk: Very low (non-interruptive placement)
   * Priority: HIGH - Best monetization point on FactsDock
   */
  QUIZ_RESULT: {
    slot: "7432951068",
    spacing: AD_SPACING.quiz,
    description:
      "After quiz result/score - highest quality placement (GOLD)",
  },

  /**
   * QUIZ_PLAY_FOOTER: Before footer on quiz play page
   * Context: Results visible, or about to start new quiz
   * Attention: Medium (pre-footer area)
   * Risk: Very low (no interruption during gameplay)
   */
  QUIZ_PLAY_FOOTER: {
    slot: "2847391045",
    spacing: AD_SPACING.standard,
    description: "Before footer - quiz play page",
  },

  /**
   * CATEGORY_FACTS_FOOTER: Before footer on category facts page
   * Context: User browsing category facts
   * Attention: Medium (pre-footer area)
   * Risk: Very low (non-interruptive)
   */
  CATEGORY_FACTS_FOOTER: {
    slot: "1985472036",
    spacing: AD_SPACING.standard,
    description: "Before footer - category facts page",
  },
} as const;

/**
 * Type for ad slot configuration keys
 * Use this to ensure only valid slots are referenced
 */
export type AdSlotKey = keyof typeof AD_SLOTS;
