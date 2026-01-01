import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">World Facts</span>
          </div>

          <nav className="flex gap-4">
            <Link
              to="/about"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Contact
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground text-center">
            Developed by{" "}
            <span className="text-primary font-semibold">PAWAN SAPKOTA</span>
          </p>

          <p className="text-xs text-muted-foreground">
            © 2025 World Facts. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
