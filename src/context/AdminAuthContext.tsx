/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";
import {
  AdminUser,
  getCurrentAdminUser,
  AdminPermission,
} from "@/lib/admin-auth";

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  checkPermission: (permission: AdminPermission) => boolean;
}

/**
 * Admin Authorization Context (Role Check Only)
 *
 * CRITICAL PRINCIPLES:
 * - Works AFTER user is authenticated by UserAuthContext
 * - Only checks admin role by querying admins table
 * - Non-admins have user=null (no access to AdminGuard routes)
 * - Never signs out non-admins or interferes with user sessions
 * - Completely separate from authentication
 */
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

interface AdminAuthProviderProps {
  children: React.ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  /**
   * Initialize admin verification on mount
   * Just check if current Supabase user is in admins table
   * Don't sign out anyone - that's not our responsibility
   */
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const initAdmin = async () => {
      try {
        setLoading(true);

        // Simple timeout check
        const timeoutPromise = new Promise<null>((resolve) => {
          timeoutId = setTimeout(() => {
            logger.warn("[AdminAuthContext] Admin check timeout");
            resolve(null);
          }, 10000);
        });

        // Check if current user is admin
        const adminCheckPromise = getCurrentAdminUser();

        const adminUser = await Promise.race([
          adminCheckPromise,
          timeoutPromise,
        ]);

        if (timeoutId) clearTimeout(timeoutId);

        if (isMounted) {
          if (adminUser) {
            logger.debug("[AdminAuthContext] Admin verified:", adminUser.email);
            setUser(adminUser);
          } else {
            logger.debug("[AdminAuthContext] User is not admin");
            setUser(null);
          }
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        logger.error("[AdminAuthContext] Init error:", err);
        if (isMounted) {
          setUser(null);
          setError(
            err instanceof Error ? err.message : "Admin verification failed",
          );
          setLoading(false);
        }
      }
    };

    initAdmin();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  /**
   * Handle admin verification pending flag
   * If flag is set and user is not admin, auto-signOut
   */
  useEffect(() => {
    let isMounted = true;

    const handleVerificationFailure = async () => {
      // Check if verification pending flag exists
      const isPending =
        localStorage.getItem("wf:adminVerificationPending") === "true";

      // If pending and user is not admin, sign them out
      if (isPending && !user) {
        logger.warn(
          "[AdminAuthContext] Verification failed - user not admin, clearing session",
        );

        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            logger.warn(
              "[AdminAuthContext] Sign out after failed verification:",
              error.message,
            );
          }
        } catch (err) {
          logger.error(
            "[AdminAuthContext] Error during failed verification cleanup:",
            err,
          );
        } finally {
          if (isMounted) {
            // Clear the pending flag
            localStorage.removeItem("wf:adminVerificationPending");
          }
        }
      } else if (isPending && user) {
        // Verification succeeded - clear the pending flag
        logger.debug(
          "[AdminAuthContext] Verification succeeded - clearing pending flag",
        );
        localStorage.removeItem("wf:adminVerificationPending");
      }
    };

    // Run verification check when admin user state settles
    handleVerificationFailure();

    return () => {
      isMounted = false;
    };
  }, [user]);

  /**
   * Listen for logout only - clear admin when user signs out
   * Don't interfere with user signin/signup
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Only handle logout - clear admin user when signed out
      if (event === "SIGNED_OUT") {
        logger.debug("[AdminAuthContext] User signed out - clearing admin");
        logger.debug(
          "[AdminAuthContext] Clearing verification pending flag on logout",
        );
        localStorage.removeItem("wf:adminVerificationPending");
        setUser(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Logout (delegates to Supabase)
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      logger.debug("[AdminAuthContext] Signout complete");
      setUser(null);
      setError(null);
    } catch (err) {
      logger.error("[AdminAuthContext] Logout error:", err);
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if user has permission
   */
  const checkPermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (!user) return false;
      if (user.role === "superadmin") return true;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const value: AdminAuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    logout,
    checkPermission,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

/**
 * Hook to use admin auth context
 */
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};

/**
 * Hook to check if user is authenticated as admin
 */
export const useIsAdminAuthenticated = (): boolean => {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated;
};

/**
 * Hook to get current admin user
 */
export const useCurrentAdminUser = (): AdminUser | null => {
  const { user } = useAdminAuth();
  return user;
};

/**
 * Hook to check specific permission
 */
export const useAdminPermission = (permission: AdminPermission): boolean => {
  const { checkPermission } = useAdminAuth();
  return checkPermission(permission);
};
