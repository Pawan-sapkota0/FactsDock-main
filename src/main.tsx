import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";
import { log, debug, warn, error } from "@/lib/logger";
import "@/lib/silence-console";
import { initTelemetry } from "@/lib/telemetry";
import { cleanupAdminStorageFlags } from "@/lib/storage-cleanup";

/**
 * IMPORTANT: Clean up any leftover admin flags BEFORE rendering the app
 * This ensures UserAuthContext and SessionRestoreLoader have a clean slate
 */
cleanupAdminStorageFlags();

/**
 * REMOVED: Auto-redirect to /admin after signin
 *
 * Previous flow: User signs in → automatically redirected to /admin
 * Problem: This redirects EVERY user to /admin, even non-admins
 * New flow: User signs in → stays on current page → AdminAuthContext handles authorization
 *
 * If user is admitted → AdminAuthContext allows access
 * If user is not admin → AdminGuard shows denial message, user stays logged in
 * This gives proper control to AdminAuthContext + AdminGuard
 */

// DEPRECATED: The code that automatically redirected users to /admin has been removed
// Auth flow is now handled by:
// - UserAuthContext: handles user authentication (/auth/login, /auth/signup)
// - AdminAuthContext: handles admin verification (only on /admin routes)
// - AdminGuard: handles authorization (redirects non-admins with clear message)

createRoot(document.getElementById("root")!).render(<App />);

// Initialize telemetry (Sentry) asynchronously; optional DSN required
try {
  void initTelemetry();
} catch (e) {
  /* ignored - telemetry init best-effort */
}
