/**
 * Edge Function: verify-admin-session
 * 
 * Middleware-based protection for admin routes
 * Verifies session is valid and user has admin role
 * 
 * Returns:
 * - 200: User is authenticated admin with admin/superadmin role
 * - 401: No session or invalid token
 * - 403: User authenticated but not an admin
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import "../deno.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "supabase";

// Type definitions for Supabase responses
interface AuthError {
  code?: string;
  message?: string;
}

interface AdminRecord {
  id: string;
  email: string;
  role: string;
  permissions?: Record<string, unknown>[] | null;
  is_active: boolean;
  created_at: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.error("[verify-admin-session] No authorization header");
      return new Response(
        JSON.stringify({
          error: "No session",
          message: "Authorization header missing",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with the user's auth token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      } as Record<string, unknown>
    );

    // Get current user from token
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      console.error("[verify-admin-session] Auth error:", (authError as Record<string, unknown>)?.message);
      return new Response(
        JSON.stringify({
          error: "Invalid session",
          message: "Session is invalid or expired",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[verify-admin-session] User authenticated:", user.id);

    // Query admins table to verify admin role
    const { data: adminRecord, error: adminError } = await (supabase as any)
      .from("admins")
      .select("id, email, role, permissions, is_active, created_at")
      .eq("id", (user as Record<string, unknown>).id)
      .eq("is_active", true)
      .single();

    if (adminError) {
      // PGRST116 = no rows found (user is not an admin)
      if ((adminError as Record<string, unknown>).code === "PGRST116") {
        console.warn(
          "[verify-admin-session] User not in admins table:",
          user.id
        );
        return new Response(
          JSON.stringify({
            error: "Not an admin",
            message: "User does not have admin privileges",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.error(
        "[verify-admin-session] Admin query error:",
        (adminError as AuthError).message
      );
      return new Response(
        JSON.stringify({
          error: "Admin verification failed",
          message: "Could not verify admin status",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!adminRecord) {
      console.warn("[verify-admin-session] No admin record found:", user.id);
      return new Response(
        JSON.stringify({
          error: "Not an admin",
          message: "User does not have admin privileges",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is admin or superadmin (not just editor)
    const role = (adminRecord as AdminRecord).role;
    const validRoles = ["admin", "superadmin"];
    
    // Explicit role validation - handle null/undefined
    if (!role || !validRoles.includes(role)) {
      console.warn(
        "[verify-admin-session] User has invalid or missing role:",
        role || "undefined"
      );
      return new Response(
        JSON.stringify({
          error: "Insufficient role",
          message: `Admin role required for access (user role: ${role || "missing"})`,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is active
    const isActive = (adminRecord as AdminRecord).is_active;
    if (!isActive) {
      console.warn("[verify-admin-session] Admin user is inactive:", user.id);
      return new Response(
        JSON.stringify({
          error: "Account disabled",
          message: "This admin account has been disabled",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      "[verify-admin-session] Admin verified successfully:",
      (user as Record<string, unknown>).id,
      "role:",
      (adminRecord as AdminRecord).role
    );

    // Return admin data on success
    return new Response(
      JSON.stringify({
        user: {
          id: (adminRecord as AdminRecord).id,
          email: (adminRecord as AdminRecord).email,
          role: (adminRecord as AdminRecord).role,
          permissions: (adminRecord as AdminRecord).permissions || [],
          isActive: (adminRecord as AdminRecord).is_active,
          createdAt: (adminRecord as AdminRecord).created_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[verify-admin-session] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Server error",
        message: "Failed to verify admin session",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
