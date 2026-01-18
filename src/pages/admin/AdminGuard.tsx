import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    id?: string;
    email?: string;
  } | null>(null);
  // debug UI state removed — keeping console.debug logs only

  useEffect(() => {
    let cancelled = false;

    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const checkAuth = async (attempt = 1) => {
      console.debug(`[AdminGuard] auth check attempt ${attempt}`);
      // Dev bypass: set VITE_ADMIN_BYPASS=true in your local env to skip auth checks
      if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_BYPASS === "true") {
        console.debug("[AdminGuard] dev bypass enabled");
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const userResp = await supabase.auth.getUser();
        console.debug("[AdminGuard] getUser response", userResp);
        const user = (userResp as any)?.data?.user || null;

        if (!user) {
          // sometimes the session is established a moment after redirect; retry a few times
          if (attempt < 4) {
            console.debug("[AdminGuard] user not found, retrying", attempt);
            await wait(700);
            if (!cancelled) await checkAuth(attempt + 1);
            return;
          }
          console.debug(
            "[AdminGuard] user not found after retries, redirecting to login",
          );
          if (location.pathname !== "/admin/login") navigate("/admin/login");
          return;
        }

        // Check admins table for the user id
        const { data: admins, error } = await supabase
          .from("admins")
          .select("id,email")
          .eq("id", user.id)
          .limit(1);
        console.debug("[AdminGuard] admins query result", { admins, error });
        if (error || !admins || (admins as any).length === 0) {
          // Not an admin — retry a few times to avoid transient race conditions
          if (attempt < 4) {
            console.debug("[AdminGuard] admin row missing, retrying", attempt);
            await wait(700);
            if (!cancelled) await checkAuth(attempt + 1);
            return;
          }

          // Instead of redirecting away immediately, show a clear message to the user
          // with their id/email and SQL to add them as an admin. This avoids layout
          // jumps and gives actionable steps.
          setUserInfo({ id: user.id, email: (user as any).email });
          setNotAdmin(true);
          setLoading(false);
          return;
        }

        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error("Admin guard error", e);
        if (location.pathname !== "/") navigate("/");
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-6 w-6 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span className="text-sm text-muted-foreground">
            Loading admin...
          </span>
        </div>
      </div>
    );

  if (notAdmin && userInfo)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-xl p-6 bg-white/90 rounded shadow">
          <h3 className="text-lg font-semibold">Access required</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in but your account is not in the <code>admins</code>{" "}
            table.
          </p>
          <div className="mt-4">
            <p className="text-sm">
              <strong>Signed in as:</strong>
            </p>
            <p className="font-mono text-sm my-1">id: {userInfo.id}</p>
            {userInfo.email && (
              <p className="font-mono text-sm">email: {userInfo.email}</p>
            )}
          </div>
          <div className="mt-4 text-sm">
            <p>
              To grant admin access run this SQL in Supabase SQL editor (or ask
              a project admin):
            </p>
            <pre className="bg-slate-100 p-2 rounded text-xs mt-2">
              INSERT INTO admins (id, email, created_at) VALUES ('{userInfo.id}
              ', '{userInfo.email || ""}', now());
            </pre>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <button
              className="px-3 py-2 border rounded"
              onClick={() => (window.location.href = "/")}
            >
              Go Home
            </button>
          </div>
          {/* debug UI removed */}
        </div>
      </div>
    );
  return <>{children}</>;
};

export default AdminGuard;
