import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  canAccessAdmin,
  getCurrentAdminUser,
  AdminPermission,
  canPerformAction,
} from "@/lib/admin-auth";
import { log, debug, warn, error } from "@/lib/logger";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: AdminPermission;
}

/**
 * ProtectedRoute Component
 * - Verifies admin authentication
 * - Checks role-based permissions
 * - Prevents unauthorized access
 * - Redirects to login if not authenticated
 * - Blocks access if insufficient permissions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // Check if user is authenticated
        const isAuthenticated = await canAccessAdmin();
        if (!isAuthenticated) {
          setIsAuthorized(false);
          return;
        }

        // Check permission if required
        if (requiredPermission) {
          const hasPermission = await canPerformAction(requiredPermission);
          if (!hasPermission) {
            setError("Insufficient permissions to access this resource");
            setIsAuthorized(false);
            return;
          }
        }

        setIsAuthorized(true);
      } catch (err) {
        error("[ProtectedRoute] Authorization error:", err);
        setError("Authorization error");
        setIsAuthorized(false);
      }
    };

    verifyAccess();
  }, [requiredPermission]);

  if (isAuthorized === null) {
    // Loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    // Not authorized - redirect to login with return path
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (error) {
    // Permission error
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">{error}</p>
          <a href="/admin" className="text-primary hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
};

export default ProtectedRoute;
