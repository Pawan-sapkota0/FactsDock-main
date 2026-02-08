import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "@/context/UserAuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";
import logger from "@/lib/logger";

/**
 * OAuth Callback Handler
 * Supabase redirects here after Google authentication
 * The user is automatically logged in via the auth listener
 * Profile is auto-created by the database trigger
 */
const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, sessionRestored } = useUserAuth();

  useEffect(() => {
    const handleCallback = async () => {
      logger.debug("[OAuthCallback] OAuth callback started");
      logger.debug("[OAuthCallback] Auth state:", {
        isAuthenticated,
        hasUser: !!user,
        userEmail: user?.email,
        loading,
        sessionRestored,
      });

      // Wait for session restore to complete (wait for sessionRestored flag)
      // But don't wait forever - timeout after 5 seconds
      let attempts = 0;
      const maxAttempts = 50; // 50 * 100ms = 5 second timeout

      while ((!sessionRestored || loading) && attempts < maxAttempts) {
        logger.debug(
          "[OAuthCallback] Waiting for auth state... attempts:",
          attempts + 1,
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      logger.debug("[OAuthCallback] Final auth state after wait:", {
        isAuthenticated,
        hasUser: !!user,
        userEmail: user?.email,
        loading,
        sessionRestored,
      });

      if (isAuthenticated && user?.email) {
        logger.debug("[OAuthCallback] OAuth successful for:", user.email);
        navigate("/", { replace: true });
      } else {
        logger.warn("[OAuthCallback] Authentication not confirmed after OAuth");
        logger.warn("[OAuthCallback] isAuthenticated:", isAuthenticated);
        logger.warn("[OAuthCallback] user:", user);
        logger.warn("[OAuthCallback] loading:", loading);
        logger.warn("[OAuthCallback] sessionRestored:", sessionRestored);
        navigate("/auth/login", { replace: true });
      }
    };

    handleCallback();
  }, [isAuthenticated, user, navigate, loading, sessionRestored]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Completing sign-in...</p>
          <p className="text-xs text-muted-foreground">
            You will be redirected shortly
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OAuthCallback;
