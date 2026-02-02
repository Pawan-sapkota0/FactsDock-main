/**
 * Admin Authentication & Authorization Service
 * Handles secure session management, role-based access control
 * Supports: Email/Password, OAuth (Google)
 */

// Note: The Supabase client stores auth sessions in localStorage by default.
// For production, prefer server-issued HttpOnly cookies to avoid client-side token exposure via XSS.
import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "superadmin" | "editor";
  permissions: AdminPermission[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export type AdminPermission =
  | "manage_facts"
  | "manage_quizzes"
  | "manage_categories"
  | "manage_settings"
  | "manage_admins"
  | "view_analytics";

export interface AdminSession {
  user: AdminUser;
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

const SESSION_STORAGE_KEY = "wf_admin_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

/**
 * Sign in with email and password
 */
export const signInWithEmailPassword = async (
  email: string,
  password: string,
): Promise<{ user: AdminUser | null; error: unknown }> => {
  try {
    logger.debug("[AdminAuth] Starting email/password login");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    logger.debug("[AdminAuth] Supabase auth response:", {
      hasSession: !!data.session,
      hasError: !!error,
      error: error?.message,
    });

    if (error) {
      return { user: null, error };
    }

    if (!data.session) {
      return { user: null, error: "No session returned" };
    }

    // Verify admin credentials and get permissions
    logger.debug("[AdminAuth] Calling verifyAdminCredentials...");
    const adminUser = await verifyAdminCredentials();
    logger.debug("[AdminAuth] verifyAdminCredentials returned:", adminUser ? "user found" : "null");
    return { user: adminUser, error: null };
  } catch (err) {
    logger.error("[AdminAuth] Email/password login error:", err);
    return { user: null, error: err };
  }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<{ error: unknown }> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback/google`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    return { error };
  } catch (err) {
    return { error: err };
  }
};

/**
 * Sign up new admin (usually done by superadmin only)
 */
export const signUpAdmin = async (
  email: string,
  password: string,
): Promise<{ user: Record<string, unknown> | null; error: unknown }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/login`,
      },
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: err };
  }
};

/**
 * Reset password
 */
export const resetPassword = async (email: string): Promise<{ error: unknown }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    return { error };
  } catch (err) {
    return { error: err };
  }
};

/**
 * Update password
 */
export const updatePassword = async (
  newPassword: string,
): Promise<{ error: unknown }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  } catch (err) {
    return { error: err };
  }
};

/**
 * Get current admin user from session
 */
export const getCurrentAdminUser = async (): Promise<AdminUser | null> => {
  try {
    const session = getSessionFromStorage();
    if (!session) return null;

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearSessionStorage();
      return null;
    }

    // Get fresh user data from database (use maybeSingle to prevent hangs)
    const { data, error } = await supabase
      .from("admins")
      .select("id, email, role, permissions, created_at, last_login, is_active")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !data) {
      clearSessionStorage();
      return null;
    }

    // User is inactive
    if (!data.is_active) {
      clearSessionStorage();
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      createdAt: data.created_at,
      lastLogin: data.last_login,
      isActive: data.is_active,
    };
  } catch (error) {
    logger.error("[AdminAuth] Error getting current user:", error);
    return null;
  }
};

/**
 * Check if user is authenticated admin
 */
export const isAdminAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentAdminUser();
  return !!user;
};

/**
 * Check if user has specific permission
 */
export const hasAdminPermission = async (
  permission: AdminPermission
): Promise<boolean> => {
  const user = await getCurrentAdminUser();
  if (!user) return false;

  // Superadmins have all permissions
  if (user.role === "superadmin") return true;

  // Check specific permission
  return user.permissions.includes(permission);
};

/**
 * Verify admin credentials (called after Supabase auth)
 */
export const verifyAdminCredentials = async (): Promise<AdminUser | null> => {
  try {
    const authUser = await supabase.auth.getUser();
    logger.debug("[AdminAuth] Auth user:", authUser.data?.user?.id);
    
    if (!authUser.data?.user) {
      logger.warn("[AdminAuth] No auth user found");
      return null;
    }

    // Check if user is in admins table (use maybeSingle to prevent hangs)
    const { data, error } = await supabase
      .from("admins")
      .select("id, email, role, permissions, created_at, is_active")
      .eq("id", authUser.data.user.id)
      .eq("is_active", true)
      .maybeSingle();

    const errMsg = (error as { message?: string } | null)?.message ?? null;
    logger.debug("[AdminAuth] Admin query result:", { hasData: !!data, error: errMsg });

    if (error || !data) {
      logger.warn("[AdminAuth] User is not an authorized admin - Error:", error);
      return null;
    }

    const adminUser: AdminUser = {
      id: data.id,
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      createdAt: data.created_at,
      isActive: data.is_active,
    };

    // Update last login (non-critical, don't fail if it errors)
    try {
      await supabase
        .from("admins")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);
    } catch (updateError) {
      logger.warn("[AdminAuth] Failed to update last_login:", updateError);
      // Continue anyway - this is not critical
    }

    // Store session
    const session: AdminSession = {
      user: adminUser,
      token: authUser.data.user.id,
      expiresAt: Date.now() + SESSION_TIMEOUT_MS,
    };
    setSessionInStorage(session);

    logger.debug("[AdminAuth] Successfully verified and stored admin session");
    return adminUser;
  } catch (error) {
    logger.error("[AdminAuth] Error verifying credentials:", error);
    return null;
  }
};

/**
 * Admin logout
 */
export const adminLogout = async (): Promise<void> => {
  try {
    clearSessionStorage();
    await supabase.auth.signOut();
  } catch (error) {
    logger.error("[AdminAuth] Error during logout:", error);
  }
};

/**
 * Check if user can access admin area
 */
export const canAccessAdmin = async (): Promise<boolean> => {
  const user = await getCurrentAdminUser();
  return !!user && user.isActive;
};

/**
 * Check if user can perform action
 */
export const canPerformAction = async (
  action: AdminPermission
): Promise<boolean> => {
  return hasAdminPermission(action);
};

/**
 * Log admin activity
 */
export const logAdminActivity = async (
  action: string,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    const user = await getCurrentAdminUser();
    if (!user) return;

    await supabase.from("admin_activity_logs").insert({
      admin_id: user.id,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip_address: await getClientIP(),
    });
    } catch (error: unknown) {
      logger.error("[AdminAuth] Error logging activity:", error);
  }
};

/**
 * Session management helpers (sessionStorage)
 * Note: For production, prefer HttpOnly cookies set by the server to avoid XSS exposure.
 */
function setSessionInStorage(session: AdminSession): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    logger.error("[AdminAuth] Error storing session:", error);
  }
}

function getSessionFromStorage(): AdminSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    logger.error("[AdminAuth] Error retrieving session:", error);
    return null;
  }
}

function clearSessionStorage(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    logger.error("[AdminAuth] Error clearing session:", error);
  }
}

/**
 * Get client IP address (basic)
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Permission helper - creates role-based permission sets
 */
export const getRolePermissions = (role: string): AdminPermission[] => {
  const permissionMap: Record<string, AdminPermission[]> = {
    editor: [
      "manage_facts",
      "manage_quizzes",
      "manage_categories",
      "view_analytics",
    ],
    admin: [
      "manage_facts",
      "manage_quizzes",
      "manage_categories",
      "manage_settings",
      "view_analytics",
    ],
    superadmin: [
      "manage_facts",
      "manage_quizzes",
      "manage_categories",
      "manage_settings",
      "manage_admins",
      "view_analytics",
    ],
  };

  return permissionMap[role] || [];
};
