/**
 * Route-Level Auth Guards
 *
 * These components handle auth protection at the ROUTE level,
 * NOT in individual components. This prevents redirect loops and
 * ensures clean separation between routing and auth state.
 *
 * PRINCIPLE: Auth provides STATE. Routing provides NAVIGATION.
 * Never let auth trigger navigation - that's routing's job.
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserAuth } from "@/context/UserAuthContext";
import logger from "@/lib/logger";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Route requires user to be authenticated */
  requireAuth?: boolean;
  /** Route requires user to NOT be authenticated */
  requireNoAuth?: boolean;
  /** Fallback component while auth is loading */
  loadingComponent?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Use this to wrap routes that require authentication.
 * NEVER use this to redirect - only to show/hide routes.
 *
 * Example usage:
 * <Route path="/profile" element={
 *   <ProtectedRoute requireAuth={true}>
 *     <UserProfile />
 *   </ProtectedRoute>
 * } />
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireNoAuth = false,
  loadingComponent = null,
}) => {
  const { isAuthenticated, loading } = useUserAuth();
  const location = useLocation();

  // Still checking auth - show loading component
  if (loading) {
    return loadingComponent || <div />;
  }

  // Route requires authentication but user is NOT authenticated
  if (requireAuth && !isAuthenticated) {
    logger.debug(
      "[ProtectedRoute] Redirecting to login (requireAuth=true, not authenticated)",
    );
    return (
      <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
    );
  }

  // Route requires NO authentication but user IS authenticated
  if (requireNoAuth && isAuthenticated) {
    logger.debug(
      "[ProtectedRoute] Redirecting to home (requireNoAuth=true, is authenticated)",
    );
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // Auth condition satisfied - render children
  return <>{children}</>;
};

/**
 * Hook to check if user is authenticated and ready
 * Use this to make conditional rendering decisions WITHOUT routing
 *
 * Example:
 * const { isReady, isAuthenticated } = useAuthStatus();
 * if (!isReady) return <Skeleton />;
 * if (isAuthenticated) return <UserMenu />;
 * return <LoginButton />;
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthStatus() {
  const { isAuthenticated, loading, error } = useUserAuth();

  return {
    /** Auth state lookup has completed */
    isReady: !loading,
    /** User is currently authenticated */
    isAuthenticated,
    /** Auth check is in progress */
    isLoading: loading,
    /** Error during auth initialization */
    error,
  };
}

/**
 * Hook to redirect user if not authenticated
 * Use this INSTEAD of useEffect in auth pages
 *
 * Example:
 * useEnforceAuth() // Will do nothing if already authed
 * useEnforceAuth({ redirectTo: "/dashboard" }) // Custom redirect
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useEnforceAuth(options?: { alreadyAuthedRedirectTo?: string }) {
  const { isAuthenticated, loading } = useUserAuth();

  React.useEffect(() => {
    // Still loading - don't redirect yet
    if (loading) return;

    // If already authenticated on login page, no action needed
    // (ProtectedRoute will handle redirect via requireNoAuth)
    if (isAuthenticated) {
      logger.debug(
        "[useEnforceAuth] User is already authenticated, not redirecting here",
      );
    }
  }, [isAuthenticated, loading]);
}

/**
 * Hook to check auth status without blocking
 * Returns current state and loading status
 * Safe to use on public pages
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalAuth() {
  const { user, isAuthenticated, loading, error } = useUserAuth();

  return {
    user,
    isAuthenticated,
    isLoading: loading,
    error,
  };
}

export default ProtectedRoute;
