import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import {
  getCurrentAdminUser,
  AdminUser,
  AdminPermission,
} from "@/lib/admin-auth";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: AdminPermission;
}

const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [notAdmin, setNotAdmin] = useState(false);
  const [insufficientPermissions, setInsufficientPermissions] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    id?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        // Dev bypass: set VITE_ADMIN_BYPASS=true in your local env to skip auth checks
        if (
          import.meta.env.DEV &&
          import.meta.env.VITE_ADMIN_BYPASS === "true"
        ) {
          console.debug("[AdminGuard] dev bypass enabled");
          if (!cancelled) {
            setAuthorized(true);
            setLoading(false);
          }
          return;
        }

        // Check if user is authenticated with Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          console.debug("[AdminGuard] no session found, redirecting to login");
          if (!cancelled && location.pathname !== "/admin/login") {
            navigate("/admin/login", {
              state: { from: location.pathname },
              replace: true,
            });
          }
          return;
        }

        // Get admin user from database
        const { data: admins, error } = await supabase
          .from("admins")
          .select("id, email, role, permissions, created_at, is_active")
          .eq("id", session.user.id)
          .limit(1);

        if (error || !admins || admins.length === 0) {
          console.warn("[AdminGuard] user is not an admin");
          setUserInfo({
            id: session.user.id,
            email: session.user.email || "unknown",
          });
          setNotAdmin(true);
          if (!cancelled) setLoading(false);
          return;
        }

        const adminRecord = admins[0] as any;

        // Check if user is active
        if (!adminRecord.is_active) {
          console.warn("[AdminGuard] user admin account is inactive");
          setUserInfo({
            id: adminRecord.id,
            email: adminRecord.email,
            role: adminRecord.role,
          });
          setNotAdmin(true);
          if (!cancelled) setLoading(false);
          return;
        }

        // Check if user has required permission
        if (requiredPermission) {
          const isSuperadmin = adminRecord.role === "superadmin";
          const hasPermission =
            isSuperadmin ||
            (adminRecord.permissions || []).includes(requiredPermission);

          if (!hasPermission) {
            console.warn(
              `[AdminGuard] user lacks permission: ${requiredPermission}`,
            );
            setCurrentUser({
              id: adminRecord.id,
              email: adminRecord.email,
              role: adminRecord.role || "editor",
              permissions: adminRecord.permissions || [],
              createdAt: adminRecord.created_at,
              isActive: adminRecord.is_active,
            });
            setInsufficientPermissions(true);
            if (!cancelled) setLoading(false);
            return;
          }
        }

        // Get current admin user from service
        const adminUser = await getCurrentAdminUser();
        if (adminUser) {
          setCurrentUser(adminUser);
        }

        if (!cancelled) {
          setAuthorized(true);
          setLoading(false);
        }
      } catch (e) {
        console.error("[AdminGuard] auth check error:", e);
        if (!cancelled && location.pathname !== "/") {
          navigate("/", { replace: true });
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, location, requiredPermission]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  // Not an admin
  if (notAdmin && userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-xl w-full space-y-6 p-6 border rounded-lg shadow-sm bg-card">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Admin Access Required
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your account is not configured as an admin.
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded space-y-2 text-sm">
            <p>
              <span className="font-semibold">Signed in as:</span>{" "}
              {userInfo.email}
            </p>
            {userInfo.id && (
              <p>
                <span className="font-semibold">User ID:</span> {userInfo.id}
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Contact a superadmin to grant you admin access, or run this SQL in
              Supabase:
            </p>
            <pre className="bg-background p-2 rounded text-xs font-mono mt-2 overflow-auto">
              INSERT INTO admins (id, email, created_at) VALUES ('{userInfo.id}
              ', '{userInfo.email}', now());
            </pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-2 border rounded hover:bg-muted transition-colors text-sm font-medium"
            >
              Go Home
            </button>
            <button
              onClick={() => {
                supabase.auth.signOut();
                navigate("/");
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Insufficient permissions
  if (insufficientPermissions && currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-xl w-full space-y-6 p-6 border rounded-lg shadow-sm bg-card">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Insufficient Permissions
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                You don't have permission to access this area.
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded space-y-2 text-sm">
            <p>
              <span className="font-semibold">User:</span> {currentUser.email}
            </p>
            <p>
              <span className="font-semibold">Role:</span> {currentUser.role}
            </p>
            {currentUser.permissions.length > 0 && (
              <p>
                <span className="font-semibold">Permissions:</span>{" "}
                {currentUser.permissions.join(", ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Contact a superadmin to grant you the required permissions.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="flex-1 px-4 py-2 border rounded hover:bg-muted transition-colors text-sm font-medium"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-2 border rounded hover:bg-muted transition-colors text-sm font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized - render children
  if (authorized) {
    return <>{children}</>;
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Checking permissions...</p>
    </div>
  );
};

export default AdminGuard;
