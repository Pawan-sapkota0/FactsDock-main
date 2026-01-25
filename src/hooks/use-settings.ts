import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, Settings, DEFAULT_SETTINGS, cacheSettings, getCachedSettings } from "@/lib/settings-api";
import { debug, log } from "@/lib/logger";

/**
 * Custom hook to fetch and manage global website settings
 * Listens for wf:settings-updated events and refetches settings
 */
export const useSettings = () => {
  const queryClient = useQueryClient();
  const [initialCacheUsed, setInitialCacheUsed] = useState(false);

  // Query to fetch settings from database
  const { data: settings, isLoading, isFetching } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Use cached settings on initial mount if available
  useEffect(() => {
    if (!initialCacheUsed && !settings) {
      const cached = getCachedSettings();
      if (cached) {
        debug("[useSettings] Using cached settings from localStorage");
        setInitialCacheUsed(true);
      }
    }
  }, [initialCacheUsed, settings]);

  // Cache settings when they change
  useEffect(() => {
    if (settings) {
      debug("[useSettings] Caching settings to localStorage");
      cacheSettings(settings);
    }
  }, [settings]);

  // Listen for settings update events from admin panel
  useEffect(() => {
    const handleSettingsUpdate = () => {
      log("[useSettings] Settings update event received, refetching...");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    };

    window.addEventListener("wf:settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("wf:settings-updated", handleSettingsUpdate);
  }, [queryClient]);

  // Return settings or cached version or defaults
  const effectiveSettings: Settings = settings || getCachedSettings() || DEFAULT_SETTINGS;

  return {
    settings: effectiveSettings,
    isLoading: isLoading && !initialCacheUsed && !settings,
    isFetching,
  };
};
