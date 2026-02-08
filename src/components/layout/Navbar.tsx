import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  Play,
  LogOut,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import ThemeSelector from "@/components/ui/ThemeSelector";
import { useUserAuth } from "@/context/UserAuthContext";
import logger from "@/lib/logger";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, sessionRestored } = useUserAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setMobileMenuOpen(false);

    try {
      logger.debug("[Navbar] Starting logout");

      // Clear storage immediately
      localStorage.clear();
      sessionStorage.clear();

      // Call logout and wait for completion
      await logout();
      logger.debug("[Navbar] Logout complete");

      // Navigate to home
      navigate("/", { replace: true });
    } catch (err) {
      logger.error("[Navbar] Logout error:", err);
      // Still navigate even if logout fails
      navigate("/", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/world-facts", label: "Facts" },
    { path: "/quiz", label: "Quizzes" },
    { path: "/the-world", label: "The World" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-card/75 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo + Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group min-w-fit flex-shrink-0"
          >
            <div className="group-hover:scale-110 transition-transform duration-300">
              <img
                src="/worldfacts-logo.png"
                alt="FactsDock Logo"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground">
                FactsDock
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Global Knowledge
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {navLinks.map(({ path, label }) => (
              <Link key={path} to={path}>
                <button
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 relative group ${
                    isActive(path)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {/* Active underline */}
                  <span
                    className={`absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full transition-all duration-300 ${
                      isActive(path)
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-100"
                    }`}
                  />
                </button>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Theme Selector - Always visible on sm+ */}
            <div className="hidden sm:block">
              <ThemeSelector />
            </div>

            {/* Auth Buttons - Wait for session restore before rendering */}
            {!sessionRestored ? (
              // Session restoring - show small inline skeleton for user area
              <div className="hidden lg:flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            ) : isAuthenticated ? (
              <>
                {/* Desktop Profile Button - xl+ only */}
                <Link to="/profile" className="hidden xl:block">
                  <Button
                    variant="outline"
                    className="h-9 px-3 text-sm font-medium"
                    title="Profile"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                {/* Desktop Logout Button - lg+ only */}
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="default"
                  className="hidden lg:flex gap-2 h-9 px-3 text-sm font-medium"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Desktop Login/Signup Buttons - lg+ only */}
                <Link to="/auth/login" className="hidden lg:block">
                  <Button
                    variant="outline"
                    className="h-9 px-3 text-sm font-medium"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup" className="hidden lg:block">
                  <Button
                    variant="default"
                    className="h-9 px-3 text-sm font-medium"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Start Quiz CTA - Always visible, lg+ only */}
            <Link to="/quiz" className="hidden lg:block">
              <Button
                variant="default"
                className="gap-2 h-9 px-3 text-sm font-medium"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Quiz</span>
              </Button>
            </Link>

            {/* Hamburger Menu Button - Shows on lg and smaller screens */}
            <button
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md hover:bg-accent transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Shows navigation + auth buttons on smaller screens */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 space-y-3 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
            {/* Mobile Navigation Links */}
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
              >
                <button
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive(path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              </Link>
            ))}

            {/* Divider */}
            <div className="my-4 border-t border-border/30" />

            {/* Mobile Auth Section - Wait for session restore */}
            {!sessionRestored ? (
              // Session restoring - show skeleton for mobile auth area
              <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ) : isAuthenticated ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full text-sm h-10 flex items-center justify-center"
                    title="Profile"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="default"
                  className="w-full gap-2 text-sm h-10"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                {/* Secondary Action - Sign In */}
                <Link
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button
                    variant="ghost"
                    className="w-full text-sm h-9 font-medium"
                  >
                    Login
                  </Button>
                </Link>

                {/* Secondary Action - Sign Up */}
                <Link
                  to="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button
                    variant="default"
                    className="w-full text-sm h-10 font-medium"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Divider */}
            <div className="my-4 border-t border-border/30" />

            {/* Mobile Start Quiz - Always visible */}
            <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
              <Link
                to="/quiz"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  variant="default"
                  className="w-full gap-2 text-sm h-10 font-medium"
                >
                  <Play className="h-4 w-4" />
                  Start Quiz
                </Button>
              </Link>
            </div>

            {/* Mobile Theme Selector */}
            <div className="sm:hidden px-4 py-2.5 border-t border-border/30 mt-4">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                Theme
              </p>
              <ThemeSelector />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
