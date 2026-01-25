import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getCurrentAdminUser,
  AdminUser,
  AdminPermission,
} from "@/lib/admin-auth";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: AdminPermission;
}

/**
 * Helper: Create timeout promise that rejects after N milliseconds
 */
const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms);
  });
};

/**
 * Helper: Retry logic with exponential backoff
 * Retries up to 2 times with 1s, then 2s delays
 */
const withRetry = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.pow(1000, attempt + 1); // 1s, 2s
        logger.debug(
          `[AdminGuard] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
};

const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [notAdmin, setNotAdmin] = useState(false);
  const [insufficientPermissions, setInsufficientPermissions] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    id?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const checkAuth = async () => {
      try {
        setError(null);

        // Dev bypass: set VITE_ADMIN_BYPASS=true in your local env to skip auth checks
        if (
          import.meta.env.DEV &&
          import.meta.env.VITE_ADMIN_BYPASS === "true"
        ) {
          logger.debug("[AdminGuard] dev bypass enabled");
          if (!cancelled) {
            setAuthorized(true);
            setLoading(false);
          }
          return;
        }

        // Wrap auth check with timeout (60 seconds)
        await Promise.race([
          withRetry(async () => {
            // Check if user is authenticated with Supabase
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
              logger.debug(
                "[AdminGuard] no session found, redirecting to login",
              );
              if (!cancelled && location.pathname !== "/admin/login") {
                navigate("/admin/login", {
                  state: { from: location.pathname },
                  replace: true,
                });
              }
              return;
            }

            // Attempt to refresh session if needed
            try {
              await supabase.auth.refreshSession();
            } catch (refreshError) {
              logger.warn(
                "[AdminGuard] Session refresh attempt failed:",
                refreshError,
              );
              // Continue anyway, getSession above should have valid session
            }

            // Get admin user from database
            const { data: admins, error } = await supabase
              .from("admins")
              .select("id, email, role, permissions, created_at, is_active")
              .eq("id", session.user.id)
              .limit(1);

            if (error || !admins || admins.length === 0) {
              logger.warn("[AdminGuard] user is not an admin");
              setUserInfo({
                id: session.user.id,
                email: session.user.email || "unknown",
              });
              setNotAdmin(true);
              if (!cancelled) setLoading(false);
              return;
            }

            const adminRecord = admins[0] as Record<string, unknown>;

            // Check if user is active
            if (!(adminRecord.is_active as boolean)) {
              logger.warn("[AdminGuard] user admin account is inactive");
              setUserInfo({
                id: String(adminRecord.id),
                email: String(adminRecord.email || ""),
                role: String(adminRecord.role || ""),
              });
              setNotAdmin(true);
              if (!cancelled) setLoading(false);
              return;
            }

            // Check if user has required permission
            if (requiredPermission) {
              const isSuperadmin = String(adminRecord.role) === "superadmin";
              const perms =
                (adminRecord.permissions as string[] | undefined) || [];
              const hasPermission =
                isSuperadmin || perms.includes(requiredPermission);

              if (!hasPermission) {
                logger.warn(
                  `[AdminGuard] user lacks permission: ${requiredPermission}`,
                );
                setCurrentUser({
                  id: String(adminRecord.id),
                  email: String(adminRecord.email || ""),
                  role: String(adminRecord.role || "editor") as
                    | "admin"
                    | "superadmin"
                    | "editor",
                  permissions: perms as AdminPermission[],
                  createdAt: String(adminRecord.created_at),
                  isActive: Boolean(adminRecord.is_active),
                });
                setInsufficientPermissions(true);
                if (!cancelled) setLoading(false);
                return;
              }
            }

            // Get current admin user from service
            const adminUser = await getCurrentAdminUser();
            if (adminUser) {
              setCurrentUser(adminUser);
            }

            if (!cancelled) {
              setAuthorized(true);
              setLoading(false);
            }
          }),
          createTimeoutPromise(60000), // 60 second timeout
        ]);
      } catch (e) {
        logger.error("[AdminGuard] auth check error:", e);
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Authentication check failed",
          );
          setLoading(false);

          // If timeout or repeated failures, redirect to login with error state
          if (
            location.pathname !== "/admin/login" &&
            location.pathname !== "/"
          ) {
            timeoutId = setTimeout(() => {
              if (!cancelled) {
                navigate("/admin/login", {
                  state: {
                    from: location.pathname,
                    error: "Session verification failed. Please log in again.",
                  },
                  replace: true,
                });
              }
            }, 2000); // Give user time to see error
          }
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, location, requiredPermission]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verifying admin access...
          </p>
          {error && (
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 max-w-xs text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Not an admin
  if (notAdmin && userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-xl w-full space-y-6 p-6 border rounded-lg shadow-sm bg-card">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Admin Access Required
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your account is not configured as an admin.
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded space-y-2 text-sm">
            <p>
              <span className="font-semibold">Signed in as:</span>{" "}
              {userInfo.email}
            </p>
            {userInfo.id && (
              <p>
                <span className="font-semibold">User ID:</span> {userInfo.id}
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Contact a superadmin to grant you admin access, or run this SQL in
              Supabase:
            </p>
            <pre className="bg-background p-2 rounded text-xs font-mono mt-2 overflow-auto">
              INSERT INTO admins (id, email, created_at) VALUES ('{userInfo.id}
              ', '{userInfo.email}', now());
            </pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-2 border rounded hover:bg-muted transition-colors text-sm font-medium"
            >
              Go Home
            </button>
            <button
              onClick={() => {
                supabase.auth.signOut();
                navigate("/");
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Insufficient permissions
  if (insufficientPermissions && currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-xl w-full space-y-6 p-6 border rounded-lg shadow-sm bg-card">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Insufficient Permissions
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                You don't have permission to access this area.
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded space-y-2 text-sm">
            <p>
              <span className="font-semibold">User:</span> {currentUser.email}
            </p>
            <p>
              <span className="font-semibold">Role:</span> {currentUser.role}
            </p>
            {currentUser.permissions.length > 0 && (
              <p>
                <span className="font-semibold">Permissions:</span>{" "}
                {currentUser.permissions.join(", ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Contact a superadmin to grant you the required permissions.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="flex-1 px-4 py-2 border rounded hover:bg-muted transition-colors text-sm font-medium"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-2 border rounded hover:bg-muted transition-colors text-sm font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized - render children
  if (authorized) {
    return <>{children}</>;
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Checking permissions...</p>
    </div>
  );
};

export default AdminGuard;
