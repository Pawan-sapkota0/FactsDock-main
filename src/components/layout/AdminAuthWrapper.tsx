import React, { useEffect } from "react";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import logger from "@/lib/logger";

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AdminAuthWrapper - Isolated Admin Auth Context
 *
 * CRITICAL DESIGN PRINCIPLES:
 * - ONLY mounts AdminAuthContext when user visits /admin/* routes
 * - Does NOT affect any non-admin pages (/,  /auth/*, /profile, etc)
 * - AdminAuthContext is completely isolated from UserAuthContext
 * - Normal user login NEVER triggers admin verification
 * - SessionRestoreLoader happens BEFORE AdminAuthWrapper mounts
 *
 * Flow for Normal Users:
 * 1. User visits "/" → UserAuthProvider only → instant UI
 * 2. User visits "/admin/login" → AdminAuthWrapper mounts → shows admin login
 * 3. AdminAuthContext checks if user is admin (in admins table)
 * 4. If not admin → deny access, user stays logged in as regular user
 * 5. If admin → allow access to /admin/*
 *
 * Flow for Unauthenticated Users:
 * 1. User visits "/admin/login" → SessionRestoreLoader shows skeleton
 * 2. UserAuthContext restores session from localStorage (~100ms)
 * 3. SessionRestoreLoader unblocks → AdminAuthWrapper mounts
 * 4. AdminAuthContext checks if current Supabase user is admin
 * 5. If no session → both return null
 * 6. AdminGuard shows "No admin access" message
 *
 * Key: AdminAuthContext NEVER interferes with normal user flows
 */
export const AdminAuthWrapper: React.FC<AdminAuthWrapperProps> = ({
  children,
}) => {
  useEffect(() => {
    logger.debug(
      "[AdminAuthWrapper] Admin context mounted - only for /admin routes",
    );
    return () => {
      logger.debug("[AdminAuthWrapper] Admin context unmounted - cleaning up");
    };
  }, []);

  return <AdminAuthProvider>{children}</AdminAuthProvider>;
};
