import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { requestPasswordReset, updatePassword } from "@/lib/user-auth";
import logger from "@/lib/logger";

type Step = "request" | "reset" | "success";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a token in the URL (from reset email link)
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (token && type === "recovery") {
      logger.debug("[ForgotPassword] Reset token found in URL");
      setStep("reset");
    }
  }, [searchParams]);

  const validatePassword = (pwd: string): boolean => {
    // At least 8 chars, uppercase, lowercase, number, special char
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[@#$%^&*]/.test(pwd)
    );
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      setError(
        "Password reset via email is not currently available. Please contact support or try signing up again with a new password.",
      );
      logger.warn(
        "[ForgotPassword] Email service not configured - password reset disabled",
      );
    } catch (err) {
      logger.error("[ForgotPassword] Exception:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters (@#$%^&*)",
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        logger.error("[ForgotPassword] Reset error:", error.message);
        setError(error.message);
      } else {
        logger.debug("[ForgotPassword] Password reset successful");
        setStep("success");
      }
    } catch (err) {
      logger.error("[ForgotPassword] Exception:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="border-2 max-w-md w-full">
            <CardContent className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Password Reset! ✓
              </h3>
              <p className="text-muted-foreground">
                Your password has been successfully reset. You can now sign in
                with your new password.
              </p>
              <Button
                onClick={() => navigate("/auth/login")}
                className="w-full mt-4"
              >
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="border-2">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">
                {step === "request"
                  ? "Reset Your Password"
                  : "Set New Password"}
              </CardTitle>
              <CardDescription>
                {step === "request"
                  ? "Enter your email to receive a password reset link"
                  : "Create a new password for your account"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              )}

              {message && (
                <div className="mb-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ {message}
                  </p>
                </div>
              )}

              {step === "request" && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              )}

              {step === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 characters with uppercase, lowercase, numbers,
                      and special characters (@#$%^&*)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-6 border-t border-border pt-4">
                <Button
                  onClick={() => navigate("/auth/login")}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
