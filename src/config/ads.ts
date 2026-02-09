/**
 * Global AdSense Configuration
 *
 * This file controls all ad infrastructure behavior globally.
 * Ads are DISABLED by default and can only be enabled via environment flag.
 *
 * To enable ads:
 * 1. Set VITE_ADS_ENABLED=true in .env
 * 2. Set VITE_ADS_CLIENT_ID to your Google AdSense client ID
 * 3. Redeploy the application
 *
 * When disabled:
 * - No AdSense scripts are loaded
 * - Ad slots render as placeholder divs with reserved space
 * - No performance impact
 * - No CLS (layout shift) occurs
 */

export const ADS_CONFIG = {
  /**
   * Master kill switch - ads are disabled by default
   * Only true if VITE_ADS_ENABLED=true in environment
   */
  enabled: import.meta.env.VITE_ADS_ENABLED === "true",

  /**
   * Google AdSense Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
   * Placeholder value - replace with actual ID when enabling ads
   */
  clientId: import.meta.env.VITE_ADS_CLIENT_ID || "ca-pub-XXXXXXXXXXXXXXXX",
} as const;

/**
 * Verify ads configuration is safe
 * Log to console for debugging purposes only (no user-facing errors)
 */
if (typeof window !== "undefined" && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log(
    "[AdSense] Configuration loaded:",
    `enabled=${ADS_CONFIG.enabled}, clientId=${ADS_CONFIG.clientId.slice(0, 10)}...`,
  );
}
