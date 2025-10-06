import { Link, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";
import { Button } from "./ui/button";

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
