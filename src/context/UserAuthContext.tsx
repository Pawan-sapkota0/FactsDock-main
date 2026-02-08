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
import { User, getCurrentUser, signOutUser } from "@/lib/user-auth";

interface UserAuthContextType {
  user: User | null;
  loading: boolean;
  sessionRestored: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * User Authentication Context (Identity Only)
 *
 * CRITICAL PRINCIPLES:
 * - Only manages Supabase auth state (email/password, OAuth)
 * - Does NOT check admin role or permissions
 * - Does NOT interfere with admin verification
 * - Completely isolated from AdminAuthContext
 * - Never calls signOut() for non-admins or role checks
 */
export const UserAuthContext = createContext<UserAuthContextType | undefined>(
  undefined,
);

interface UserAuthProviderProps {
  children: React.ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  /**
   * Setup Supabase auth listener
   *
   * TWO-PHASE RESTORATION (Non-blocking):
   *
   * Phase 1: Session Check (IMMEDIATE)
   *   - supabase.auth.getSession() → get cached session from localStorage
   *   - sessionRestored = true immediately (Supabase session is checked)
   *   - Create fallback user from session.user if exists
   *   - Navbar renders based on sessionRestored + user
   *
   * Phase 2: Profile Enrichment (BACKGROUND)
   *   - getCurrentUser() fetches full user profile
   *   - Updates user with enriched data (async, no block)
   *   - Navbar shows fallback first, updates silently when profile loads
   *
   * Why separate?
   *   - sessionRestored must not wait for profile fetch
   *   - Navbar shows instantly with fallback email
   *   - Profile enrichment happens in background
   */
  useEffect(() => {
    logger.debug("[UserAuthContext] Setting up auth listener");

    let timeoutId: NodeJS.Timeout | null = null;
    let lastEventTime = 0;
    let isMounted = true;

    // PHASE 1: Check Supabase session immediately
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;

      // Session check complete - mark restoration done
      // This happens regardless of whether user exists
      setSessionRestored(true);

      if (data?.session?.user) {
        logger.debug(
          "[UserAuthContext] Cached session found for:",
          data.session.user.email,
        );

        // Create fallback user from Supabase session.user (available immediately)
        const fallbackUser: User = {
          id: data.session.user.id,
          email: data.session.user.email || "",
          displayName:
            (data.session.user.user_metadata?.display_name as string) ||
            data.session.user.email?.split("@")[0] ||
            "User",
          createdAt: data.session.user.created_at || new Date().toISOString(),
          emailVerified: data.session.user.email_confirmed_at !== null,
          emailVerifiedAt: data.session.user.email_confirmed_at || undefined,
        };

        setUser(fallbackUser);

        // PHASE 2 (Background): Enrich profile in the background
        // Don't wait for this, user is already set and rendered
        getCurrentUser()
          .then((enrichedUser) => {
            if (!isMounted) return;
            if (enrichedUser) {
              logger.debug(
                "[UserAuthContext] Profile enriched for:",
                enrichedUser.email,
              );
              setUser(enrichedUser);
            }
          })
          .catch((err) => {
            logger.warn("[UserAuthContext] Profile enrichment failed:", err);
            // Keep fallback user, profile enrichment is optional
          });
      } else {
        logger.debug("[UserAuthContext] No cached session");
        setUser(null);
      }
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug(
        "[UserAuthContext] Auth event:",
        event,
        "| User:",
        session?.user?.email || "null",
      );

      // Debounce rapid events
      const now = Date.now();
      if (now - lastEventTime < 50) {
        logger.debug("[UserAuthContext] Debouncing rapid event");
        return;
      }
      lastEventTime = now;

      if (timeoutId) clearTimeout(timeoutId);

      // Handle logout
      if (event === "SIGNED_OUT") {
        setSessionRestored(true);
        logger.debug("[UserAuthContext] User signed out");
        setUser(null);
        setError(null);
        setLoading(false);
        return;
      }

      // Handle no session (unauthenticated)
      if (!session?.user) {
        setSessionRestored(true);
        logger.debug("[UserAuthContext] No active session");
        setUser(null);
        setError(null);
        setLoading(false);
        return;
      }

      // Handle signin/session restore
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        try {
          logger.debug("[UserAuthContext] Auth event:", event);

          // PHASE 1: Set fallback user immediately from session.user
          const fallbackUser: User = {
            id: session.user.id,
            email: session.user.email || "",
            displayName:
              (session.user.user_metadata?.display_name as string) ||
              session.user.email?.split("@")[0] ||
              "User",
            createdAt: session.user.created_at || new Date().toISOString(),
            emailVerified: session.user.email_confirmed_at !== null,
            emailVerifiedAt: session.user.email_confirmed_at || undefined,
          };

          setUser(fallbackUser);
          setSessionRestored(true);
          setError(null);

          // ✅ Progress migration removed - all progress now stored in localStorage only
          // No need to migrate between devices or databases

          // PHASE 2 (Background): Enrich profile
          // Don't wait for this, fallback user already set
          const currentUser = await getCurrentUser();
          if (!isMounted) return;

          if (currentUser) {
            logger.debug(
              "[UserAuthContext] Profile enriched:",
              currentUser.email,
            );
            setUser(currentUser);
          }
          // If enrichment fails, keep fallback user (already set above)

          setLoading(false);
        } catch (err) {
          logger.error("[UserAuthContext] Auth error:", err);

          // Keep fallback user and mark session restored
          // Enrichment failed but session is still valid
          if (!isMounted) return;
          setError(err instanceof Error ? err.message : "Auth error");
          setSessionRestored(true);
          setLoading(false);
        }
      } else if (event === "TOKEN_REFRESHED") {
        setSessionRestored(true);
        setLoading(false);
      } else {
        setSessionRestored(true);
        setLoading(false);
      }
    });

    // Safety timeout
    timeoutId = setTimeout(() => {
      logger.warn("[UserAuthContext] Auth check timeout, resolving");
      setLoading(false);
      if (isMounted) {
        setSessionRestored(true);
      }
    }, 10000);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Max loading timeout (UX: prevent spinner sticking)
   */
  useEffect(() => {
    if (!loading) return;

    const timeout = setTimeout(() => {
      logger.debug("[UserAuthContext] Max loading timeout reached");
      setLoading(false);
      setSessionRestored(true);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [loading]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      logger.debug("[UserAuthContext] Logout initiated");
      setLoading(true);
      setError(null);

      const result = await signOutUser();

      if (result.error) {
        logger.error("[UserAuthContext] Signout error:", result.error.message);
        setError(result.error.message);
        setLoading(false);
        return;
      }

      logger.debug("[UserAuthContext] Signout successful");
      setUser(null);
      setError(null);
      setLoading(false);
    } catch (err) {
      logger.error("[UserAuthContext] Logout exception:", err);
      setError(err instanceof Error ? err.message : "Logout failed");
      setLoading(false);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: UserAuthContextType = {
    user,
    loading,
    sessionRestored,
    error,
    isAuthenticated,
    logout,
    clearError,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};

/**
 * Hook to use user auth context
 */
export const useUserAuth = (): UserAuthContextType => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error("useUserAuth must be used within UserAuthProvider");
  }
  return context;
};

/**
 * Hook to check if user is authenticated
 */
export const useIsUserAuthenticated = (): boolean => {
  const { isAuthenticated } = useUserAuth();
  return isAuthenticated;
};

/**
 * Hook to get current user
 */
export const useCurrentUser = (): User | null => {
  const { user } = useUserAuth();
  return user;
};
