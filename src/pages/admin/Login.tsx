import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  signInWithEmailPassword,
  signInWithGoogle,
  getCurrentAdminUser,
} from "@/lib/admin-auth";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AlertCircle, Loader2, Eye, EyeOff, Mail, Chrome } from "lucide-react";

type AuthMethod = "select" | "email-password" | "google";
type Step = "method-select" | "credentials" | "verifying" | "success" | "error";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();

  // Form state
  const [authMethod, setAuthMethod] = useState<AuthMethod>("select");
  const [step, setStep] = useState<Step>("method-select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/admin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Handle OAuth redirect
  useEffect(() => {
    const checkOAuthCallback = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);

      // Check for OAuth error
      const errorParam = params.get("error");
      if (errorParam) {
        setError(`OAuth Error: ${errorParam}`);
        setStep("error");
        return;
      }

      // Check for OAuth token in hash or localStorage (Supabase sets it)
      if (hash.includes("access_token")) {
        setStep("verifying");
        try {
          const adminUser = await getCurrentAdminUser();
          if (adminUser) {
            setStep("success");
            toast({
              title: "Success!",
              description: "You are now logged in as an admin.",
            });
            setTimeout(() => navigate("/admin"), 1000);
          } else {
            setError("Access Denied: You do not have admin permissions");
            setStep("error");
          }
        } catch (err: unknown) {
          const e = err as Record<string, unknown> | undefined;
          const msg =
            (e && (e.message as string)) ||
            String(err || "Failed to verify login");
          setError(msg);
          setStep("error");
        }
      } else if (hash.includes("error")) {
        setError("OAuth login failed. Please try again.");
        setStep("error");
      }
    };

    checkOAuthCallback();
  }, [navigate, toast]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate inputs
    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    setStep("verifying");
    const { user, error: authError } = await signInWithEmailPassword(
      email,
      password,
    );

    if (authError) {
      setError(authError.message || "Invalid email or password");
      setStep("error");
      setLoading(false);
    } else if (user) {
      setStep("success");
      toast({
        title: "Success!",
        description: `Welcome back, ${user.email}!`,
      });
      setTimeout(() => navigate("/admin"), 1000);
    } else {
      setError("Access Denied: You do not have admin permissions");
      setStep("error");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setStep("verifying");

    const { error: oauthError } = await signInWithGoogle();

    if (oauthError) {
      setError(oauthError.message || "Failed to initiate Google login");
      setStep("error");
      setLoading(false);
    }
    // If successful, OAuth will redirect to Supabase which redirects back to us
  };

  const handleBackToMethodSelect = () => {
    setAuthMethod("select");
    setStep("method-select");
    setEmail("");
    setPassword("");
    setError(null);
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Sign in to manage World Facts content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Alert */}
          {error && step === "error" && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-green-700 font-medium">Login successful!</p>
              <p className="text-sm text-gray-600">Redirecting...</p>
            </div>
          )}

          {/* Verifying State */}
          {step === "verifying" && (
            <div className="space-y-4 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              <p className="text-sm text-gray-600">Verifying your login...</p>
            </div>
          )}

          {/* Method Selection */}
          {step === "method-select" && authMethod === "select" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 mb-4">
                Choose a login method:
              </p>

              <Button
                onClick={() => {
                  setAuthMethod("email-password");
                  setStep("credentials");
                }}
                variant="outline"
                className="w-full justify-start h-12 border-2"
              >
                <Mail className="w-5 h-5 mr-3" />
                Email & Password
              </Button>

              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full justify-start h-12 border-2"
                disabled={loading}
              >
                <Chrome className="w-5 h-5 mr-3" />
                {loading ? "Connecting..." : "Google Account"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setAuthMethod("email-password");
                  setStep("credentials");
                }}
                variant="ghost"
                className="w-full text-indigo-600 hover:text-indigo-700"
              >
                Other login method
              </Button>
            </div>
          )}

          {/* Email & Password Form */}
          {step === "credentials" && authMethod === "email-password" && (
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <Button
                type="button"
                onClick={handleBackToMethodSelect}
                variant="ghost"
                className="w-full"
                disabled={loading}
              >
                Back
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center text-sm">
                <button
                  type="button"
                  className="text-indigo-600 hover:underline"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {/* Error State - Retry Options */}
          {step === "error" && (
            <div className="space-y-4">
              <Button onClick={handleBackToMethodSelect} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
