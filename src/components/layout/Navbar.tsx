import { Link, useLocation } from "react-router-dom";
import { Globe, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              WORLD FACTS
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/">
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  className="font-medium"
                >
                  Home
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  variant={isActive("/about") ? "default" : "ghost"}
                  className="font-medium"
                >
                  About
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant={isActive("/contact") ? "default" : "ghost"}
                  className="font-medium"
                >
                  Contact
                </Button>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                aria-label="Toggle menu"
                onClick={() => setOpen((o) => !o)}
                className="p-2 rounded-md hover:bg-muted/50"
              >
                {open ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu panel */}
          {open && (
            <div className="md:hidden absolute left-0 right-0 top-full bg-card/95 backdrop-blur py-4 shadow-md z-40">
              <div className="container mx-auto px-4 flex flex-col gap-2">
                <Link to="/" onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive("/") ? "default" : "ghost"}
                    className="w-full text-left"
                  >
                    Home
                  </Button>
                </Link>
                <Link to="/about" onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive("/about") ? "default" : "ghost"}
                    className="w-full text-left"
                  >
                    About
                  </Button>
                </Link>
                <Link to="/contact" onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive("/contact") ? "default" : "ghost"}
                    className="w-full text-left"
                  >
                    Contact
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
