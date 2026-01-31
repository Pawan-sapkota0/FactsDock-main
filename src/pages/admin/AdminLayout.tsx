import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Layers,
  Mail,
  Settings,
  Image,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import ThemeSelector from "@/components/ui/ThemeSelector";

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/admin/login", { replace: true });
    } catch (error) {
      logger.error("[AdminLayout] Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/facts", label: "Facts", icon: BookOpen },
    { path: "/admin/quizzes", label: "Quizzes", icon: HelpCircle },
    { path: "/admin/categories", label: "Categories", icon: Layers },
    { path: "/admin/messages", label: "Messages", icon: Mail },
    { path: "/admin/image-cache", label: "Image Cache", icon: Image },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div id="admin-root" className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/worldfacts-logo.png"
            alt="WorldFacts"
            className="h-6 w-6"
          />
          <span className="font-bold text-foreground">WorldFacts Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 pt-14 md:pt-0">
        {/* Sidebar - Desktop */}
        <aside
          className={`hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-20"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <img
                  src="/worldfacts-logo.png"
                  alt="WorldFacts"
                  className="h-8 w-8"
                />
                <div>
                  <div className="font-bold text-foreground text-sm">
                    WorldFacts
                  </div>
                  <div className="text-xs text-muted-foreground">Admin</div>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-1">
              <div className="hidden md:block">
                <ThemeSelector scope="admin" compact />
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                title={sidebarOpen ? "Collapse" : "Expand"}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-6 space-y-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(path)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={label}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </button>
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border space-y-3">
            {user && (
              <div className={`text-xs ${sidebarOpen ? "block" : "hidden"}`}>
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                sidebarOpen
                  ? "text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  : "justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              }`}
              title="Logout"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && (isLoggingOut ? "Logging out..." : "Logout")}
            </button>

            <div className={`text-xs ${sidebarOpen ? "block" : "hidden"}`}>
              <div className="mb-2">
                <p className="text-muted-foreground">Admin Panel v1.0</p>
              </div>

              <p className="text-xs text-muted-foreground/60">
                © 2025 WorldFacts
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
              {/* Close Button */}
              <div className="p-4 flex justify-end">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 px-3 space-y-2">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link key={path} to={path}>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(path)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </button>
                  </Link>
                ))}
              </nav>

              {/* Mobile Logout */}
              <div className="p-3 border-t border-border space-y-2">
                {user && (
                  <div className="px-4 py-2 text-xs">
                    <p className="font-medium text-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
