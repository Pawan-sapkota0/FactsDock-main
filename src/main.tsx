import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";
import { log, debug, warn, error } from "@/lib/logger";
import "@/lib/silence-console";
import { initTelemetry } from "@/lib/telemetry";

// Listen for auth changes and redirect to /admin when a user signs in.
// This helps handle the magic-link redirect flow where the SDK triggers
// a SIGNED_IN event after the redirect back to the app.
if (supabase?.auth && typeof supabase.auth.onAuthStateChange === "function") {
  try {
    let redirected = false;

    // Determine whether a session already existed at page load. If a session
    // existed, we avoid automatically redirecting on a SIGNED_IN event (this
    // happens during page hydration when the SDK restores a persisted session).
    (async () => {
      let hadSessionAtLoad = false;
      try {
        const { data } = await supabase.auth.getSession();
        hadSessionAtLoad = !!data?.session;
      } catch (e) {
        /* ignored - auth check */
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          // Only redirect to /admin when the user has just signed in *and*
          // there was no session at page load. Also limit redirects to when
          // the user is on a public entry page to avoid surprise navigations.
          if (event === "SIGNED_IN" && !redirected && !hadSessionAtLoad) {
            const pathname = window.location.pathname;
            if (
              pathname === "/" ||
              pathname === "/admin/login" ||
              pathname === "/login"
            ) {
              redirected = true;
              window.location.href = "/admin";
            }
          }
        },
      );

      // Optionally clean up on hot reloads (Vite)
      const meta = import.meta as unknown as {
        hot?: { dispose?: (fn: () => void) => void };
      };
      if (meta.hot) {
        meta.hot.dispose(() => {
          try {
            listener?.subscription?.unsubscribe?.();
          } catch (e) {
            /* ignored - hot cleanup */
          }
        });
      }
    })();
  } catch (e) {
    warn("Failed to attach Supabase auth listener", e);
  }
}

createRoot(document.getElementById("root")!).render(<App />);

// Initialize telemetry (Sentry) asynchronously; optional DSN required
try {
  void initTelemetry();
} catch (e) {
  /* ignored - telemetry init best-effort */
}
