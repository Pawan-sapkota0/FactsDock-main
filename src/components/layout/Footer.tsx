import { Link } from "react-router-dom";
import { Mail, Globe } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Explore",
      links: [
        { label: "Facts", href: "/world-facts" },
        { label: "Quizzes", href: "/quiz" },
        { label: "Game Zone", href: "/fun-zone" },
        { label: "Countries", href: "/the-world" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms & Conditions", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-card border-t border-border/50 mt-24">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/worldfacts-logo.png"
                alt="World Facts Logo"
                className="h-8 w-8"
              />
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                World Facts
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Explore facts and quizzes from every country. Discover global knowledge in bite-sized, engaging content.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:hello@worldfacts.com"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                title="Email us"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Contact</span>
              </a>
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              {footerSections[0].links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-1 group"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity -ml-2" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerSections[1].links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-1 group"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity -ml-2" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About World Facts */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">
              About
            </h3>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-lg p-4">
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                World Facts is an educational platform dedicated to sharing fascinating facts, engaging quizzes, and comprehensive information about countries across the globe.
              </p>
              <div className="flex items-center gap-2 text-xs text-primary font-medium">
                <Globe className="h-3.5 w-3.5" />
                <span>Discover. Learn. Explore.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* Footer Bottom */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} World Facts. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Made with knowledge and care</span>
            <span className="text-primary">•</span>
            <span>v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
