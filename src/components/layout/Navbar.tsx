import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, Monitor, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ThemeSelector from "@/components/ui/ThemeSelector";

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/world-facts", label: "Facts" },
    { path: "/quiz", label: "Quizzes" },
    { path: "/the-world", label: "World" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-card/75 backdrop-blur-md transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Brand */}
          <Link to="/" className="flex items-center gap-2.5 group min-w-fit">
            <div className="group-hover:scale-110 transition-transform duration-300">
              <img
                src="/worldfacts-logo.png"
                alt="World Facts Logo"
                className="h-8 w-8"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground">
                World Facts
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Global Knowledge
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
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
          <div className="flex items-center gap-3">
            {/* Theme Selector */}
            <div className="hidden sm:block">
              <ThemeSelector />
            </div>

            {/* Start Quiz CTA */}
            <Link to="/quiz" className="hidden md:block">
              <Button
                variant="default"
                className="gap-2 h-9 px-4 text-sm font-medium"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Start Quiz</span>
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 space-y-1 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
            {/* Mobile Links */}
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

            {/* Mobile Quiz CTA */}
            <Link to="/quiz" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="default" className="w-full gap-2 mt-2 text-sm">
                <Play className="h-4 w-4" />
                Start Quiz
              </Button>
            </Link>

            {/* Mobile Theme Selector */}
            <div className="sm:hidden px-4 py-2.5">
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
