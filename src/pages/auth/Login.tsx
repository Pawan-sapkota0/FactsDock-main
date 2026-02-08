import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { signInWithEmail, signInWithGoogle } from "@/lib/user-auth";
import logger from "@/lib/logger";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // IMPORTANT: No redirect here. Route protection is handled by ProtectedRoute
  // This component just shows the form. Navigation is routing's responsibility.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate inputs
    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    // Safety timeout - reset loading after 60 seconds
    // Supabase auth can take significant time on slow networks or during high load
    const timeoutId = setTimeout(() => {
      logger.warn("[Login] Request timeout after 60 seconds");
      setLoading(false);
      setError(
        "Login is taking longer than expected. Your connection might be slow. Please refresh the page and try again.",
      );
    }, 60000);

    try {
      const startTime = performance.now();
      logger.debug("[Login] Attempting login for:", email);

      const { user, error: authError } = await signInWithEmail(email, password);

      clearTimeout(timeoutId);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      logger.debug(
        "[Login] Response received in",
        duration,
        "ms - user:",
        user?.id,
        "error:",
        authError?.message,
      );

      if (authError) {
        logger.error("[Login] Login failed:", authError.message);
        setError(authError.message);
        setLoading(false);
      } else if (user) {
        logger.debug("[Login] Login successful for:", user.email);
        setLoading(false);
        // Navigation will be handled by context update
        navigate("/");
      } else {
        logger.warn("[Login] No user and no error returned");
        setError("Login failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      logger.error("[Login] Exception:", err);
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="border-2">
            <CardHeader className="space-y-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <CardTitle className="text-3xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your account to continue playing quizzes and saving
                your progress
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Error Alert */}
              {error && (
                <div className="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Google OAuth Button - Primary */}
              <button
                type="button"
                onClick={async () => {
                  setError(null);
                  const { error } = await signInWithGoogle();
                  if (error) {
                    setError(error.message);
                  }
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="currentColor"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-sm font-medium">Sign in with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email/Password Form - Secondary */}
              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Continue with Email
                </button>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-foreground"
                      >
                        Password
                      </label>
                      <Link
                        to="/auth/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  {/* Back to Options */}
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to options
                  </button>
                </form>
              )}

              {/* Signup Link */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <Link
                  to="/auth/signup"
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
