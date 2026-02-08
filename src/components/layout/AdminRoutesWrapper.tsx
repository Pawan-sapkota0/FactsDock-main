import React from "react";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import AdminGuard from "@/pages/admin/AdminGuard";
import logger from "@/lib/logger";

interface AdminRoutesWrapperProps {
  children: React.ReactNode;
}

/**
 * AdminRoutesWrapper - Isolated Admin Auth Context for Admin Routes
 *
 * CRITICAL PRINCIPLES:
 * - Only mounts AdminAuthContext for routes under /admin/*
 * - Does NOT affect normal user pages or authentication
 * - Provides authorization checks via AdminGuard
 * - Completely isolated from UserAuthContext
 *
 * Usage:
 *   <Route path="/admin" element={<AdminRoutesWrapper><AdminLayout /></AdminRoutesWrapper>} />
 *
 * Flow:
 * 1. User navigates to /admin/dashboard (or any /admin/* route)
 * 2. AdminRoutesWrapper mounts and provides AdminAuthContext
 * 3. AdminGuard runs authorization checks
 * 4. If admin: render children
 * 5. If not admin: show denial message, user stays logged in as regular user
 * 6. When user leaves /admin, AdminRoutesWrapper unmounts and AdminAuthContext cleans up
 *
 * Key Difference from AdminAuthWrapper:
 * - AdminAuthWrapper: For /admin/login only (single page)
 * - AdminRoutesWrapper: For all /admin/* routes (full subtree)
 */
export const AdminRoutesWrapper: React.FC<AdminRoutesWrapperProps> = ({
  children,
}) => {
  logger.debug(
    "[AdminRoutesWrapper] Mounting isolated AdminAuthContext for admin routes",
  );

  return (
    <AdminAuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AdminAuthProvider>
  );
};
