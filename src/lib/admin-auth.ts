/**
 * Admin Authorization Service 
 * Handles role-based access control
 * Delegates authentication to Supabase (UserAuthContext)
 * 
 * CRITICAL PRINCIPLES:
 * - Admin is AUTHORIZATION, NOT AUTHENTICATION
 * - User authenticates via Supabase (UserAuthContext) 
 * - AdminAuthContext checks if user is in admins table (this file)
 * - AdminGuard redirects if not admin
 * - Never blocks or interferes with user authentication
 * - No pending flags, no race conditions, no forced logouts
 */

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

/**
 * Clean up admin login session
 * If user is logged in but NOT admin, sign them out to allow admin login
 * This is called BEFORE admin login attempt
 *
 * SAFE: Only signs out if user exists AND is not admin
 * Never affects admin sessions
 */
export const cleanAdminLoginSession = async (): Promise<void> => {
  try {
    // Check current Supabase session
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      logger.debug("[AdminAuth] No session to clean");
      return;
    }

    logger.debug("[AdminAuth] Checking if session is admin before login...");

    // Query admins table using RLS
    // RLS will only return records where auth.uid() = auth_user_id
    // If user is not admin or not active, RLS will deny access with error 42501
    const { data: adminData, error } = await supabase
      .from("admins")
      .select("id")
      .eq("is_active", true)
      .single();

    // If user IS admin, keep the session (don't sign out)
    if (adminData && !error) {
      logger.debug("[AdminAuth] Session is already admin, keeping it");
      return;
    }

    // User is NOT admin - sign them out to clear the session
    logger.debug("[AdminAuth] Session is non-admin, clearing for fresh admin login");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      logger.warn("[AdminAuth] Sign out warning:", signOutError.message);
    }
  } catch (err) {
    logger.error("[AdminAuth] Error cleaning session:", err);
    // Don't throw - allow login attempt to continue
  }
};

/**
 * Get current admin user
 * Returns null if user is not authenticated or not in admins table
 * Uses RLS policies to verify admin status (auth_user_id = auth.uid())
 * 
 * SAFE: This function only reads, never writes, never signs out
 */
export const getCurrentAdminUser = async (): Promise<AdminUser | null> => {
  try {
    // Get current Supabase user
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      logger.debug("[AdminAuth] No Supabase user, not admin");
      return null;
    }

    logger.debug("[AdminAuth] Checking admin role for user:", supabaseUser.id);

    // Query admins table using RLS
    // RLS policy: SELECT USING (auth.uid() = auth_user_id)
    // Will only return record if current user is linked admin and is_active
    // Filters by is_active to ensure we only get active admins
    const { data: adminData, error } = await supabase
      .from("admins")
      .select("id, email, role, permissions, created_at, last_login, is_active")
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found (404) - user is not admin or not active
        logger.debug("[AdminAuth] User not in admins table or not active");
        return null;
      }
      if (error.code === "42501") {
        // Permission denied (403) - RLS denied access because user is not admin
        logger.debug("[AdminAuth] RLS denied access - user not admin or not linked");
        return null;
      }
      // Other error - log and fail safely
      logger.error("[AdminAuth] Query error:", error.message);
      return null;
    }

    if (!adminData) {
      logger.debug("[AdminAuth] Admin query returned no data");
      return null;
    }

    const adminUser: AdminUser = {
      id: adminData.id,
      email: adminData.email,
      role: adminData.role,
      permissions: adminData.permissions || [],
      createdAt: adminData.created_at,
      lastLogin: adminData.last_login,
      isActive: adminData.is_active,
    };

    logger.debug("[AdminAuth] Admin verified:", adminUser.email);
    return adminUser;
  } catch (err) {
    logger.error("[AdminAuth] Error getting admin user:", err);
    return null;
  }
};

/**
 * Check if user has specific permission
 * Pure function - no side effects
 */
export const hasAdminPermission = (
  adminUser: AdminUser | null,
  permission: AdminPermission,
): boolean => {
  if (!adminUser) return false;
  if (adminUser.role === "superadmin") return true;
  return adminUser.permissions.includes(permission);
};