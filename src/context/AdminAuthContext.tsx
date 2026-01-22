import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminUser,
  getCurrentAdminUser,
  verifyAdminCredentials,
  canAccessAdmin,
  AdminPermission,
  hasAdminPermission as checkAdminPermission,
} from "@/lib/admin-auth";

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  checkPermission: (permission: AdminPermission) => boolean;
  refreshSession: () => Promise<void>;
  canAccess: (resource: string) => Promise<boolean>;
}

/**
 * Admin Authentication Context
 * Provides app-wide access to admin user state and auth methods
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

  /**
   * Check if user is currently authenticated
   */
  const isAuthenticated = user !== null;

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        setLoading(true);

        // Check Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setUser(null);
            setError(null);
          }
          return;
        }

        // Get admin user from service
        const adminUser = await getCurrentAdminUser();
        if (isMounted) {
          setUser(adminUser);
          setError(null);
        }
      } catch (err) {
        console.error("[AdminAuthContext] Init error:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Auth initialization failed",
          );
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Setup auth state change listener
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug("[AdminAuthContext] Auth state changed:", event);

      if (!session?.user) {
        setUser(null);
        setError(null);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        try {
          const adminUser = await getCurrentAdminUser();
          setUser(adminUser);
          setError(null);
        } catch (err) {
          console.error("[AdminAuthContext] Error fetching admin user:", err);
          setError("Failed to load admin details");
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Logout user and clear session
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error("[AdminAuthContext] Logout error:", err);
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if user has specific permission
   */
  const checkPermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (!user) return false;
      // Superadmins have all permissions
      if (user.role === "superadmin") return true;
      // Check specific permission in user's permission list
      return user.permissions.includes(permission);
    },
    [user],
  );

  /**
   * Refresh user session
   */
  const refreshSession = useCallback(async () => {
    try {
      const adminUser = await getCurrentAdminUser();
      if (adminUser) {
        setUser(adminUser);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[AdminAuthContext] Session refresh error:", err);
      setError("Session refresh failed");
    }
  }, []);

  /**
   * Check if user can access a resource
   */
  const canAccess = useCallback(
    async (resource: string): Promise<boolean> => {
      if (!user) return false;

      try {
        // Map resource names to permissions
        const resourceToPermissionMap: Record<string, AdminPermission> = {
          facts: "manage_facts",
          quizzes: "manage_quizzes",
          categories: "manage_categories",
          settings: "manage_settings",
          users: "manage_admins",
          analytics: "view_analytics",
        };

        const permission = resourceToPermissionMap[resource.toLowerCase()];
        if (!permission) return false;

        // Superadmins can access everything
        if (user.role === "superadmin") return true;

        // Check user's permissions
        return user.permissions.includes(permission);
      } catch (err) {
        console.error("[AdminAuthContext] Access check error:", err);
        return false;
      }
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
    refreshSession,
    canAccess,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

/**
 * Hook to use admin auth context
 * Must be used within AdminAuthProvider
 */
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};

/**
 * Hook to check if user is authenticated
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
