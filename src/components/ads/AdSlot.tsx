/**
 * AdSlot Component
 *
 * Renders a Google AdSense ad slot or a placeholder div.
 * - When ads disabled: Shows empty div with reserved space
 * - When ads enabled: Shows AdSense ad unit
 * - Always reserves vertical space to prevent CLS (layout shift)
 *
 * Usage:
 * import { AdSlot } from "@/components/ads/AdSlot";
 * import { AD_SLOTS } from "@/lib/ad-spacing";
 *
 * <AdSlot slot={AD_SLOTS.QUIZ_RESULT} />
 *
 * Or with inline spacing:
 * <AdSlot slot="my-slot-id" minHeight={120} />
 */

import { useMemo } from "react";
import { ADS_CONFIG } from "@/config/ads";
import type { AdSlotKey, AD_SLOTS } from "@/lib/ad-spacing";

interface AdSlotProps {
  /**
   * Ad slot ID or predefined slot configuration
   * Can be:
   * - A string: raw ad slot ID (e.g., "5914638491")
   * - An AD_SLOTS object: { slot: "...", spacing: {...}, description: "..." }
   */
  slot: string | (typeof AD_SLOTS)[AdSlotKey];

  /**
   * Minimum height in pixels
   * Used when slot prop is a string (not a full config object)
   * Ignored if slot includes spacing configuration
   * Default: 90px
   */
  minHeight?: number;

  /**
   * Optional CSS class for styling the container
   * Useful for applying custom margins, alignment, etc.
   */
  className?: string;
}

/**
 * Helper to extract spacing from slot config
 */
interface SpacingConfig {
  marginTop: string;
  marginBottom: string;
  minHeight: string;
}

function extractSpacing(
  slot: string | (typeof AD_SLOTS)[AdSlotKey],
  fallbackMinHeight?: number,
): SpacingConfig {
  if (typeof slot === "string") {
    // Simple string slot - use minHeight parameter
    return {
      marginTop: "0",
      marginBottom: "0",
      minHeight: `${fallbackMinHeight ?? 90}px`,
    };
  }

  // Full config object - use built-in spacing
  if (slot && "spacing" in slot) {
    return {
      marginTop: slot.spacing.marginTop,
      marginBottom: slot.spacing.marginBottom,
      minHeight: slot.spacing.minHeight,
    };
  }

  // Fallback
  return {
    marginTop: "0",
    marginBottom: "0",
    minHeight: `${fallbackMinHeight ?? 90}px`,
  };
}

export const AdSlot = ({ slot, minHeight = 90, className }: AdSlotProps) => {
  // Extract slot ID and spacing once
  const { slotId, spacing } = useMemo(() => {
    const slotId = typeof slot === "string" ? slot : slot.slot;
    const spacing = extractSpacing(slot, minHeight);
    return { slotId, spacing };
  }, [slot, minHeight]);

  // Container style with spacing
  const containerStyle: React.CSSProperties = {
    marginTop: spacing.marginTop,
    marginBottom: spacing.marginBottom,
    minHeight: spacing.minHeight,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: import.meta.env.DEV
      ? "rgba(200, 200, 200, 0.1)"
      : "transparent",
  };

  // When ads are disabled, return placeholder div
  if (!ADS_CONFIG.enabled) {
    return (
      <div
        style={containerStyle}
        className={className}
        data-testid="ad-slot-placeholder"
        data-slot={slotId}
      >
        {/* Empty - reserved space only */}
      </div>
    );
  }

  // When ads are enabled, render AdSense unit
  return (
    <div style={containerStyle} className={className} data-testid="ad-slot">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADS_CONFIG.clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
