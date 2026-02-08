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
   * THREE-PHASE AUTHORIZATION CHECK
   *
   * Phase 1: Wait for cached session to restore (sessionRestored = true)
   *   - User session loads from localStorage (~0-100ms)
   *   - SessionRestoreLoader shows skeleton during this
   *   - Admin checks do NOT block this phase
   *
   * Phase 2: Session restored, check if user is admin (authLoading completes)
   *   - Queries admins table via RLS
   *   - Very fast if admin, returns null if not
   *   - No flicker, no messages
   *
   * Phase 3: Authorization decision
   *   - Admin + has permission → Render children
   *   - Not admin → Show denial message (keep user logged in)
   *   - Error → Show error message
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

    // STEP 1: Wait for user session to restore
    // Don't check admin status until user session is ready
    if (!sessionRestored) {
      logger.debug("[AdminGuard] Waiting for user session to restore...");
      if (!cancelled) {
        setState("loading");
      }
      return;
    }

    // STEP 2: User session is ready, now check admin status
    // Still loading admin check? Show loading
    if (authLoading) {
      logger.debug("[AdminGuard] User session ready, checking admin status...");
      if (!cancelled) {
        setState("loading");
      }
      return;
    }

    // Error from AdminAuthContext
    if (authError) {
      logger.error("[AdminGuard] Admin auth error:", authError);
      if (!cancelled) {
        setState("error");
        setError("Failed to verify admin status");
      }
      return;
    }

    // STEP 3: User session ready + admin check done. Now evaluate authorization
    // NOT an admin user - deny access but KEEP user logged in
    if (!adminUser) {
      logger.debug(
        "[AdminGuard] User not admin - access denied (user stays logged in)",
        {
          userEmail: userSession?.email,
        },
      );
      if (!cancelled) {
        setState("denied");
        setError(null);
      }
      return;
    }

    // Check permission if required
    if (requiredPermission) {
      const hasPermission = checkPermission(requiredPermission);
      if (!hasPermission) {
        logger.warn("[AdminGuard] Missing permission:", requiredPermission);
        if (!cancelled) {
          setState("denied");
          setError(`Missing permission: ${requiredPermission}`);
        }
        return;
      }
    }

    // Authorized
    logger.debug("[AdminGuard] Admin authorized");
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
    userSession?.email,
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
  return <>{children}</>;
};

export default AdminGuard;
