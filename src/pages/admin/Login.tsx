import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOMeta } from "@/components/common/SEOMeta";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { cleanAdminLoginSession } from "@/lib/admin-auth";
import logger from "@/lib/logger";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      logger.debug("[AdminLogin] Already authenticated, redirecting to /admin");
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate inputs
    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      logger.debug("[AdminLogin] Attempting admin login for:", email);

      // STEP 1: Pre-login session cleanup
      // If user is logged in but NOT admin, sign them out
      // This allows same email to be used for both user and admin accounts
      logger.debug("[AdminLogin] Checking if existing session is admin...");
      await cleanAdminLoginSession();

      // STEP 2: Set verification pending flag
      // This tells AdminAuthContext to expect admin verification
      localStorage.setItem("wf:adminVerificationPending", "true");
      logger.debug("[AdminLogin] Set verification pending flag");

      // STEP 3: Attempt Supabase auth with cleaned session
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (authError) {
        // Clear pending flag on auth failure
        localStorage.removeItem("wf:adminVerificationPending");
        logger.error("[AdminLogin] Auth error:", authError.message);
        setError(authError.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      if (!data.session) {
        // Clear pending flag on failure
        localStorage.removeItem("wf:adminVerificationPending");
        logger.error("[AdminLogin] No session returned");
        setError("Login failed - no session");
        setLoading(false);
        return;
      }

      logger.debug(
        "[AdminLogin] Session created, verifying admin status using UUID...",
      );

      // STEP 4: Get the logged-in user's UUID from session
      const userUuid = data.session.user.id;
      logger.debug("[AdminLogin] User UUID from session:", userUuid);

      // STEP 5: Query admins table using auth_user_id (UUID), not email
      // RLS policy ensures only this user can query their own admin record
      // Filter by auth_user_id and is_active = true
      try {
        const { data: admin, error: adminError } = await supabase
          .from("admins")
          .select("id, email, role, is_active, auth_user_id")
          .eq("auth_user_id", userUuid)
          .eq("is_active", true)
          .single();

        if (adminError) {
          // Not found or RLS denied - user is not an admin or not active
          logger.warn("[AdminLogin] Admin verification failed:", {
            code: adminError.code,
            message: adminError.message,
            userUuid,
            email,
          });

          if (adminError.code === "42P17") {
            const recursionMessage =
              "Database configuration issue: RLS policies need to be updated. " +
              "Please contact your administrator.";

            logger.error(
              "[AdminLogin] RLS Infinite Recursion Error:",
              recursionMessage,
            );

            // Sign out
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) {
              logger.warn("[AdminLogin] Sign out error:", signOutError.message);
            }

            // Clear pending flag
            localStorage.removeItem("wf:adminVerificationPending");

            setError(recursionMessage);
            setLoading(false);
            return;
          }

          // Sign out non-admin user immediately
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) {
            logger.warn("[AdminLogin] Sign out error:", signOutError.message);
          }

          // Clear pending flag
          localStorage.removeItem("wf:adminVerificationPending");

          // Show error and stay on login page
          setError("You do not have permission to access this area");
          setLoading(false);
          return;
        }

        if (!admin) {
          // Query succeeded but no record found
          logger.warn("[AdminLogin] No admin record found for UUID:", userUuid);

          // Sign out non-admin user
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) {
            logger.warn("[AdminLogin] Sign out error:", signOutError.message);
          }

          // Clear pending flag
          localStorage.removeItem("wf:adminVerificationPending");

          setError("You do not have permission to access this area");
          setLoading(false);
          return;
        }

        // ✅ ADMIN VERIFIED - auth_user_id matches session UUID and is_active = true
        logger.debug(
          "[AdminLogin] Admin verified using UUID:",
          admin.email,
          "Role:",
          admin.role,
        );
      } catch (verifyErr) {
        logger.error("[AdminLogin] Admin verification error:", verifyErr);

        // Sign out on any verification error
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          logger.warn("[AdminLogin] Sign out error:", signOutError.message);
        }

        // Clear pending flag
        localStorage.removeItem("wf:adminVerificationPending");

        // Show error
        setError(
          verifyErr instanceof Error
            ? verifyErr.message
            : "Admin verification failed",
        );
        setLoading(false);
        return;
      }

      // Clear pending flag
      localStorage.removeItem("wf:adminVerificationPending");

      toast({
        title: "Signed In",
        description: "Welcome Admin! Redirecting...",
      });

      // Navigate to admin dashboard
      logger.debug(
        "[AdminLogin] Admin login successful, redirecting to /admin",
      );
      setLoading(false);
      navigate("/admin", { replace: true });
    } catch (err) {
      // Clear pending flag on any exception
      localStorage.removeItem("wf:adminVerificationPending");
      logger.error("[AdminLogin] Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <SEOMeta
        title="FactsDock Admin | Login"
        description="Admin login portal"
        robots="noindex, nofollow"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Sign in with your admin credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Info */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            Only authorized administrators can access this panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
