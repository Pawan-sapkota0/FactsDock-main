/**
 * AdSense Provider Component
 *
 * Conditionally loads Google AdSense script only when ads are enabled.
 * - If ads disabled: Does nothing, returns null
 * - If ads enabled: Loads AdSense script once on mount
 * - No performance impact when disabled
 * - No console errors or warnings
 *
 * Mount once at app root (typically in App.tsx or main layout)
 */

import { useEffect } from "react";
import { ADS_CONFIG } from "@/config/ads";

export const AdsProvider = () => {
  useEffect(() => {
    // Do nothing if ads are disabled
    if (!ADS_CONFIG.enabled) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug("[AdSense] Disabled - skipping script load");
      }
      return;
    }

    // Ads are enabled - load AdSense script
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[AdSense] Enabled - loading AdSense script");
    }

    // Create script element
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.clientId}`;
    script.crossOrigin = "anonymous";

    // Error handling
    script.onerror = () => {
      // eslint-disable-next-line no-console
      console.error("[AdSense] Failed to load AdSense script");
    };

    // Append to document head
    document.head.appendChild(script);

    // Cleanup on unmount (rarely happens, but good practice)
    return () => {
      // Note: We don't remove the script as it's a singleton at app root
      // and should persist for the lifetime of the app
    };
  }, []);

  // Provider returns nothing - it only manages side effects
  return null;
};
