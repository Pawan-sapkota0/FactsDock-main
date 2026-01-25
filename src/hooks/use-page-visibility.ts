import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import logger from "@/lib/logger";

/**
 * Hook to mark queries as stale (not immediately refetch) when page regains focus
 * This prevents showing stale data after tab switches or idle periods
 * Uses staleTime tracking to be smart about what to refresh
 */
export const usePageVisibility = () => {
  const queryClient = useQueryClient();
  const lastVisibleTimeRef = useRef<number>(Date.now());
  const visibilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        const timeSinceLastVisible = now - lastVisibleTimeRef.current;
        
        // Only refetch if page was hidden for more than 5 minutes
        // This prevents unnecessary refetches from quick tab switches
        if (timeSinceLastVisible > 5 * 60 * 1000) {
          logger.debug(
            "[usePageVisibility] Page became visible after long idle, marking queries as stale",
            { idleMs: timeSinceLastVisible },
          );
          
          // Mark queries as stale instead of immediately invalidating
          // This allows React Query to refetch in background without blocking UI
          queryClient.refetchQueries({ stale: true });
        } else {
          logger.debug(
            "[usePageVisibility] Page became visible but idle time < 5min, skipping refetch",
            { idleMs: timeSinceLastVisible },
          );
        }
        
        lastVisibleTimeRef.current = now;
      } else {
        // Page is hidden, record the time
        lastVisibleTimeRef.current = Date.now();
      }
    };

    // Clear any pending timeout
    if (visibilityTimeoutRef.current) {
      clearTimeout(visibilityTimeoutRef.current);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [queryClient]);
};
