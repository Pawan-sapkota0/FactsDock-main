import React, { useEffect, useState, useCallback } from "react";
import logger from "@/lib/logger";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, LogOut } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { AdminPermission } from "@/lib/admin-auth";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: AdminPermission;
}

const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user: adminUser,
    loading: authLoading,
    error: authError,
    checkPermission,
  } = useAdminAuth();

  const {
    user: userSession,
    loading: userLoading,
    sessionRestored,
    logout: userLogout,
  } = useUserAuth();

  type AuthState = "loading" | "authorized" | "denied" | "error";
  const [state, setState] = useState<AuthState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Handle non-admin user logout
   * Uses UserAuthContext logout, not AdminAuthContext
   * This ensures normal users can logout without special admin handling
   */
  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await userLogout();
      logger.debug("[AdminGuard] User logged out successfully");
      navigate("/auth/login", { replace: true });
    } catch (err) {
      logger.error("[AdminGuard] Logout failed:", err);
      // Fallback: redirect anyway
      window.location.href = "/auth/login";
    } finally {
      setIsLoggingOut(false);
    }
  }, [userLogout, navigate]);

  /**
   * THREE-PHASE AUTHORIZATION CHECK (STRICT STATE MACHINE)
   *
   * ⏳ Phase 1: Loading - NEVER show denied message during this phase
   *   - Checks: sessionRestored OR authLoading
   *   - Shows: Spinner only
   *
   * ❌ Phase 2: Denied - Only after loading is COMPLETELY done
   *   - Checks: sessionRestored AND !authLoading AND !adminUser
   *   - Shows: Access denied message
   *
   * ✅ Phase 3: Authorized - Admin verified
   *   - Checks: sessionRestored AND !authLoading AND adminUser
   *   - Shows: Children (admin panel)
   *
   * CRITICAL: Never evaluate `!adminUser` before `authLoading` is false
   * This prevents "not admin" flash on page refresh
   */
  useEffect(() => {
    let cancelled = false;

    // Dev bypass for testing
    if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_BYPASS === "true") {
      logger.debug("[AdminGuard] Dev bypass enabled");
      if (!cancelled) {
        setState("authorized");
        setError(null);
      }
      return;
    }

    // ⏳ PHASE 1: ALWAYS WAIT FOR LOADING TO COMPLETE
    // Only proceed if BOTH conditions are true:
    // - User session is restored (from localStorage)
    // - Admin role check is complete (not still loading)
    if (!sessionRestored || authLoading) {
      logger.debug("[AdminGuard] ⏳ Loading - waiting for auth...", {
        sessionRestored,
        authLoading,
      });
      if (!cancelled) {
        setState("loading");
      }
      return;
    }

    // 🎯 PHASE 2+3: LOADING DONE - Now evaluate authorization

    // ❌ Error state
    if (authError) {
      logger.error("[AdminGuard] ❌ Auth error:", authError);
      if (!cancelled) {
        setState("error");
        setError("Failed to verify admin status");
      }
      return;
    }

    // ❌ Access denied (not admin)
    if (!adminUser) {
      logger.debug(
        "[AdminGuard] ❌ Not admin - access denied (user stays logged in)",
      );
      if (!cancelled) {
        setState("denied");
        setError(null);
      }
      return;
    }

    // 🔐 Check permission if required
    if (requiredPermission && !checkPermission(requiredPermission)) {
      logger.warn("[AdminGuard] ❌ Missing permission:", requiredPermission);
      if (!cancelled) {
        setState("denied");
        setError(`Missing permission: ${requiredPermission}`);
      }
      return;
    }

    // ✅ Authorized - render children
    logger.debug("[AdminGuard] ✅ Admin authorized");
    if (!cancelled) {
      setState("authorized");
      setError(null);
    }

    return () => {
      cancelled = true;
    };
  }, [
    sessionRestored,
    authLoading,
    authError,
    adminUser,
    requiredPermission,
    checkPermission,
  ]);

  /**
   * Clear admin verification pending flag when denied
   * This effect runs at top-level (not conditionally)
   */
  useEffect(() => {
    if (state === "denied") {
      const wasAdminLoginAttempt =
        localStorage.getItem("wf:adminVerificationPending") === "true";

      if (wasAdminLoginAttempt) {
        logger.debug(
          "[AdminGuard] Clearing admin verification pending flag on denial",
        );
        localStorage.removeItem("wf:adminVerificationPending");
      }
    }
  }, [state]);

  // Loading state - smooth skeleton, no messages
  if (state === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex max-w-md flex-col gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <div className="flex-1">
              <h2 className="font-semibold text-destructive">Access Error</h2>
              <p className="mt-1 text-sm text-destructive/80">{error}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/login")}
            className="mt-4 rounded bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Denied state - show permission denied message with user info
  if (state === "denied") {
    // Check if this is a failed admin login attempt
    const wasAdminLoginAttempt =
      localStorage.getItem("wf:adminVerificationPending") === "true";

    const denialMessage = wasAdminLoginAttempt
      ? "You do not have permission to access the admin panel. You are signed in as a regular user. If you believe you should have admin access, please contact the administrator."
      : "You do not have permission to access this area. You are signed in as a user.";

    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="flex max-w-md flex-col gap-6 rounded-lg border border-warning/50 bg-warning/10 p-8">
          {/* Header */}
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-warning mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {wasAdminLoginAttempt
                  ? "Admin Access Denied"
                  : "You Don't Have Admin Access"}
              </h2>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-2 bg-background/50 rounded p-4">
            <p className="text-sm text-muted-foreground">
              You are signed in as:
            </p>
            <p className="text-sm font-medium text-foreground">
              {userSession?.email || "User"}
            </p>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground">{denialMessage}</p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Logout
                </>
              )}
            </button>
          </div>

          {/* Footer help text */}
          <p className="text-xs text-muted-foreground text-center">
            If you believe you should have admin access, please contact the
            administrator.
          </p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  if (state === "authorized") {
    return <>{children}</>;
  }

  // Should never reach here
  return null;
};

export default AdminGuard;
