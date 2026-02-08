import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "@/context/UserAuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LogOut,
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  BookOpen,
  Zap,
  Home,
} from "lucide-react";
import logger from "@/lib/logger";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useUserAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // IMPORTANT: No redirect here. Route protection is handled by ProtectedRoute.
  // If not authenticated, ProtectedRoute will handle the redirect to login.
  // This component assumes user is already authenticated when it renders.
  // See App.tsx routing configuration for ProtectedRoute wrapping.

  const handleLogout = () => {
    // Optimistic logout: immediate UI feedback, async cleanup
    setIsLoggingOut(true);
    logger.debug("[Profile] Logout initiated (optimistic)");

    // Navigate to home immediately (non-blocking)
    navigate("/", { replace: true });

    // Logout in background without blocking navigation
    logout()
      .then(() => {
        logger.debug("[Profile] Logout complete");
      })
      .catch((err) => {
        logger.error("[Profile] Logout error in background:", err);
        // Error doesn't affect UX - user is already home
      });
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const accountCreatedDate = new Date(user.createdAt);
  const daysActive = Math.floor(
    (new Date().getTime() - accountCreatedDate.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {/* Header Section */}
          <div className="mb-12">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </button>

            <div className="space-y-2 mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Welcome back, {user.displayName}! 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your account and continue your learning journey
              </p>
            </div>
          </div>

          {/* Profile Grid */}
          <div className="grid lg:grid-cols-1 gap-6 mb-8">
            {/* Main Profile Card */}
            <div>
              <Card className="border border-border/50 shadow-lg overflow-hidden">
                {/* Header Background */}
                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/10" />

                <CardContent className="pt-0 px-6 sm:px-8 pb-8">
                  {/* User Avatar + Name Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 -mt-12 mb-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-4 border-card shadow-md">
                        <User className="h-12 w-12 text-primary-foreground" />
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-foreground mb-1">
                        {user.displayName}
                      </h2>
                      <p className="text-muted-foreground flex items-center gap-2 mb-3">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="inline-block px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                          ✓ Active & Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border my-8" />

                  {/* Account Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                        Account Information
                      </h3>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Account Created
                        </label>
                        <p className="text-base font-semibold text-foreground">
                          {accountCreatedDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {daysActive} day{daysActive !== 1 ? "s" : ""} ago
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border my-8" />

                  {/* Logout Button */}
                  <Button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="destructive"
                    className="w-full gap-2 h-11 text-base font-medium"
                  >
                    <LogOut className="h-5 w-5" />
                    {isLoggingOut ? "Logging out..." : "Logout from Account"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              {/* Account Stats */}
              <Card className="border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Account Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Account Age
                      </span>
                      <span className="font-semibold text-foreground">
                        {daysActive} day{daysActive !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                        Active
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => navigate("/world-facts")}
                    variant="ghost"
                    className="w-full justify-start text-sm h-9"
                  >
                    📚 Explore Facts
                  </Button>
                  <Button
                    onClick={() => navigate("/quiz")}
                    variant="ghost"
                    className="w-full justify-start text-sm h-9"
                  >
                    🎯 Take a Quiz
                  </Button>
                  <Button
                    onClick={() => navigate("/the-world")}
                    variant="ghost"
                    className="w-full justify-start text-sm h-9"
                  >
                    🌍 Explore World
                  </Button>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card className="border border-border/50 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your account is protected with secure authentication. Keep
                    your email address private and never share your login
                    credentials.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info Section */}
          <Card className="border border-border/50 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Learning Journey</CardTitle>
              <CardDescription>
                Start exploring and take quizzes to test your knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigate("/world-facts")}
                  className="h-16 flex flex-col items-center justify-center gap-2"
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm">Discover Facts</span>
                </Button>
                <Button
                  onClick={() => navigate("/quiz")}
                  className="h-16 flex flex-col items-center justify-center gap-2"
                >
                  <Zap className="h-5 w-5" />
                  <span className="text-sm">Start Quiz</span>
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                >
                  <Home className="h-5 w-5" />
                  <span className="text-sm">Home</span>
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

export default Profile;
