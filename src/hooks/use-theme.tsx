import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
const STORAGE_KEY = "theme-preference";

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    try {
      if (typeof window === "undefined") return "system";
      const raw = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      return raw || "system";
    } catch (e) {
      return "system";
    }
  });

  const apply = useCallback((pref: ThemePreference) => {
    try {
      const root = document.documentElement;
      if (pref === "light") {
        root.classList.remove("dark");
      } else if (pref === "dark") {
        root.classList.add("dark");
      } else {
        // system
        if (getSystemPrefersDark()) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    } catch (e) {
      /* ignored - DOM access best-effort */
    }
  }, []);

  // react to changes
  useEffect(() => {
    apply(preference);

    // when system preference is used, listen to changes
    let mq: MediaQueryList | null = null;
    function onChange(e: MediaQueryListEvent) {
      if (preference === "system") apply("system");
    }

    if (preference === "system" && typeof window !== "undefined") {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      try {
        mq.addEventListener("change", onChange);
      } catch (e) {
        try {
          mq.addListener(onChange);
        } catch (e) {
          /* ignored - legacy browsers */
        }
      }
    }

    return () => {
      if (mq) {
        try {
          mq.removeEventListener("change", onChange);
        } catch (e) {
          try {
            mq.removeListener(onChange);
          } catch (e) {
            /* ignored - legacy browsers */
          }
        }
      }
    };
  }, [preference, apply]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch (e) {
      /* ignored - storage not writable */
    }
  }, [preference]);

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref);
  }, []);

  return { preference, setTheme } as const;
}

export function getSavedTheme(): ThemePreference {
  try {
    if (typeof window === "undefined") return "system";
    const raw = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return raw || "system";
  } catch (e) {
    return "system";
  }
}
