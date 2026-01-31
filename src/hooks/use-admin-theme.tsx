import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";
const STORAGE_KEY = "admin:theme-preference";

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

// Scoped admin theme hook - writes to a different storage key and applies
// the `dark` class to the `#admin-root` container instead of document.documentElement.
export function useAdminTheme() {
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
      const root = document.getElementById("admin-root");
      if (!root) return;
      if (pref === "light") {
        root.classList.remove("dark");
      } else if (pref === "dark") {
        root.classList.add("dark");
      } else {
        if (getSystemPrefersDark()) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    } catch (e) {
      /* ignored */
    }
  }, []);

  useEffect(() => {
    apply(preference);

    let mq: MediaQueryList | null = null;
    function onChange(_e?: MediaQueryListEvent) {
      if (preference === "system") apply("system");
    }

    if (preference === "system" && typeof window !== "undefined") {
      mq = window.matchMedia("(prefers-color-scheme: dark)");
      try {
        mq.addEventListener("change", onChange);
      } catch (e) {
        try {
          // older browsers use addListener
          // MediaQueryListListener expects a callback with an event param
          // our `onChange` signature is compatible
          (
            mq as unknown as {
              addListener: (cb: (e: MediaQueryListEvent) => void) => void;
            }
          ).addListener(onChange);
        } catch (e) {
          /* ignored */
        }
      }
    }

    return () => {
      if (mq) {
        try {
          mq.removeEventListener("change", onChange);
        } catch (e) {
          try {
            (
              mq as unknown as {
                removeListener: (cb: (e: MediaQueryListEvent) => void) => void;
              }
            ).removeListener(onChange);
          } catch (e) {
            /* ignored */
          }
        }
      }
    };
  }, [preference, apply]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch (e) {
      /* ignored */
    }
  }, [preference]);

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref);
  }, []);

  return { preference, setTheme } as const;
}

export function getSavedAdminTheme(): ThemePreference {
  try {
    if (typeof window === "undefined") return "system";
    const raw = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return raw || "system";
  } catch (e) {
    return "system";
  }
}
