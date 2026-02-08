/**
 * User Authentication Service
 * Production-grade authentication with email verification and OTP support
 * Completely separate from admin authentication
 */

import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";

/**
 * Email validation result with detailed feedback
 */
export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Common disposable/temporary email domains to block
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "temp-mail.org",
  "sharklasers.com",
  "yopmail.com",
  "trashmail.com",
  "throwaway.email",
  "maildrop.cc",
  "temp-mail.io",
  "mailnesia.com",
  "pokemail.net",
  "fakeinbox.com",
  "temp-mail.info",
  "minutemail.com",
  "gettempemail.com",
  "speedymail.org",
  "moactual.com",
  "throwawaymail.com",
];

/**
 * Validates email format using regex
 * Accepts standard email formats with optional subdomains
 */
const isValidEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Checks if email uses a disposable/temporary email service
 */
const isDisposableEmail = (email: string): boolean => {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
};

/**
 * Validates email address
 * - Checks format validity
 * - Blocks disposable email domains
 * - Returns detailed feedback for invalid emails
 *
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 */
export const validateEmail = (email: string): EmailValidationResult => {
  try {
    const trimmedEmail = email.trim();

    // Check if email is provided
    if (!trimmedEmail) {
      logger.debug("[EmailValidation] Email is empty");
      return {
        valid: false,
        error: "Please enter an email address",
      };
    }

    // Check email format
    if (!isValidEmailFormat(trimmedEmail)) {
      logger.debug("[EmailValidation] Invalid email format:", trimmedEmail);
      return {
        valid: false,
        error: "Please enter a valid email address (e.g., user@example.com)",
      };
    }

    // Check for disposable domains
    if (isDisposableEmail(trimmedEmail)) {
      const domain = trimmedEmail.split("@")[1];
      logger.debug("[EmailValidation] Disposable email domain blocked:", domain);
      return {
        valid: false,
        error: "Temporary or disposable email addresses are not allowed. Please use a permanent email address.",
      };
    }

    logger.debug("[EmailValidation] Valid email passed all checks:", trimmedEmail);
    return { valid: true };
  } catch (err) {
    logger.error("[EmailValidation] Unexpected error during validation:", err);
    return {
      valid: false,
      error: "An error occurred while validating your email. Please try again.",
    };
  }
};

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLogin?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  otpEnabled?: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  otpEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Convert Supabase error messages to user-friendly messages
 */
const getUserFriendlyErrorMessage = (error: string): string => {
  const lowerError = error.toLowerCase();

  // Password-related errors
  if (lowerError.includes("invalid login credentials")) {
    return "Email or password is incorrect. Please try again.";
  }
  if (lowerError.includes("password")) {
    return "Password must include: Uppercase (A-Z), Lowercase (a-z), Numbers (0-9), Special characters (@, #, $, %, etc.), and be at least 8 characters long. Example: Secure@Pass123";
  }

  // Email-related errors
  if (lowerError.includes("already registered")) {
    return "This email is already registered. Please sign in instead.";
  }
  if (lowerError.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  if (lowerError.includes("email")) {
    return "There's an issue with your email. Please check and try again.";
  }

  // Account-related errors
  if (lowerError.includes("user not found")) {
    return "No account found with this email. Please sign up first.";
  }
  if (lowerError.includes("email not confirmed")) {
    return "Please verify your email before signing in. Check your inbox for a confirmation link.";
  }
  if (lowerError.includes("unverified")) {
    return "Please verify your email before signing in. Check your inbox for a confirmation link.";
  }

  // Network/server errors
  if (lowerError.includes("network") || lowerError.includes("connection")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (lowerError.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  // Default message for unknown errors
  return "Something went wrong. Please try again or contact support.";
};

/**
 * Sign up new user with email and password
 * Requires email verification before account is fully active
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string,
): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Starting email signup");

    // Sign up with Supabase Auth
    // Email verification is skipped - users can immediately log in
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split("@")[0],
        },
      },
    });

    if (error) {
      logger.error("[UserAuth] Signup error - code:", error.code, "message:", error.message);
      logger.debug("[UserAuth] Signup Error Details - Code:", error.code, "Message:", error.message);
      return {
        user: null,
        error: {
          message: error.message || getUserFriendlyErrorMessage(error.message),
          code: error.code,
        },
      };
    }

    if (!data.user) {
      logger.warn("[UserAuth] No user returned from signup");
      return {
        user: null,
        error: { message: "Account creation failed. Please try again." },
      };
    }

    logger.debug("[UserAuth] Signup successful, email verification required:", data.user.id);

    const user: User = {
      id: data.user.id,
      email: data.user.email || "",
      displayName: displayName || email.split("@")[0],
      createdAt: data.user.created_at || new Date().toISOString(),
      emailVerified: data.user.email_confirmed_at !== null,
      emailVerifiedAt: data.user.email_confirmed_at || undefined,
    };

    return { user, error: null };
  } catch (err) {
    logger.error("[UserAuth] Signup exception:", err);
    return {
      user: null,
      error: {
        message: err instanceof Error ? err.message : "Unknown signup error",
      },
    };
  }
};

/**
 * Sign in with email and password
 * Email verification no longer required - users can login immediately after signup
 */
export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Starting email login");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error("[UserAuth] Login error:", error.message);
      return {
        user: null,
        error: {
          message: getUserFriendlyErrorMessage(error.message),
          code: error.code,
        },
      };
    }

    if (!data.user) {
      return {
        user: null,
        error: { message: "Sign in failed. Please try again." },
      };
    }

    // Email verification is no longer required
    logger.debug("[UserAuth] User logged in:", data.user.email);

    logger.debug("[UserAuth] Login successful:", data.user.id);

    const user: User = {
      id: data.user.id,
      email: data.user.email || "",
      displayName:
        (data.user.user_metadata?.display_name as string) ||
        email.split("@")[0],
      createdAt: data.user.created_at || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      emailVerified: data.user.email_confirmed_at !== null,
      emailVerifiedAt: data.user.email_confirmed_at || undefined,
    };

    return { user, error: null };
  } catch (err) {
    logger.error("[UserAuth] Login exception:", err);
    return {
      user: null,
      error: {
        message: err instanceof Error ? err.message : "Unknown login error",
      },
    };
  }
};

/**
 * Sign in with OTP (One-Time Password)
 * Alternative login method - requires email verification
 */
export const signInWithOtp = async (
  email: string,
): Promise<{ error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Starting OTP login request");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      logger.error("[UserAuth] OTP login error:", error.message);
      return {
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    logger.debug("[UserAuth] OTP sent to email:", email);
    return { error: null };
  } catch (err) {
    logger.error("[UserAuth] OTP login exception:", err);
    return {
      error: {
        message:
          err instanceof Error ? err.message : "Unknown OTP login error",
      },
    };
  }
};

/**
 * Verify email with OTP (One-Time Password)
 * Called after user receives OTP in their email
 */
export const verifyEmailWithOtp = async (
  email: string,
  token: string,
): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Verifying email with OTP");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      logger.error("[UserAuth] OTP verification error:", error.message);
      return {
        user: null,
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    if (!data.user) {
      return {
        user: null,
        error: { message: "Email verification failed. Please try again." },
      };
    }

    logger.debug("[UserAuth] Email verified successfully:", data.user.id);

    const user: User = {
      id: data.user.id,
      email: data.user.email || "",
      displayName:
        (data.user.user_metadata?.display_name as string) ||
        data.user.email?.split("@")[0] ||
        "User",
      createdAt: data.user.created_at || new Date().toISOString(),
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
    };

    return { user, error: null };
  } catch (err) {
    logger.error("[UserAuth] OTP verification exception:", err);
    return {
      user: null,
      error: {
        message:
          err instanceof Error ? err.message : "Unknown OTP verification error",
      },
    };
  }
};

/**
 * Get current user session with profile information
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Add timeout protection to prevent hanging on slow DB/RLS
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        logger.warn("[UserAuth] getCurrentUser timeout after 8s");
        resolve(null);
      }, 8000);
    });

    // Race: session check vs timeout
    const sessionPromise = supabase.auth.getSession();
    const sessionResult = await Promise.race([
      sessionPromise,
      timeoutPromise,
    ]) as { data: { session: { user: Record<string, unknown> } | null } | null } | null;

    let user = sessionResult?.data?.session?.user;

    // If no session, try getUser() which may work even if session wasn't restored
    if (!user) {
      logger.debug("[UserAuth] No session found, trying getUser()");
      
      // Add timeout protection here too
      const getUserPromise = supabase.auth.getUser();
      const getUserResult = await Promise.race([
        getUserPromise,
        new Promise<{ data: { user: null }; error: Record<string, unknown> | null }>((resolve) => {
          setTimeout(() => {
            logger.warn("[UserAuth] getUser() timeout after 8s");
            resolve({ data: { user: null }, error: null });
          }, 8000);
        }),
      ]) as { data: { user: Record<string, unknown> | null } | null } | null;

      const { data, error } = getUserResult;
      
      if (error) {
        logger.debug("[UserAuth] getUser() returned error:", error.message);
        return null;
      }
      
      user = data?.user;
    }

    if (!user) {
      logger.debug("[UserAuth] No user found from session or getUser()");
      return null;
    }

    logger.debug("[UserAuth] Current user found:", user.id);

    return {
      id: user.id,
      email: user.email || "",
      displayName:
        (user.user_metadata?.display_name as string) ||
        user.email?.split("@")[0] ||
        "User",
      createdAt: user.created_at || new Date().toISOString(),
      emailVerified: user.email_confirmed_at !== null,
      emailVerifiedAt: user.email_confirmed_at || undefined,
    };
  } catch (err) {
    logger.error("[UserAuth] Get current user error:", err);
    return null;
  }
};

/**
 * Get full user profile from profiles table
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    logger.debug("[UserAuth] Fetching user profile:", userId);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      logger.error("[UserAuth] Get profile error:", error.message);
      return null;
    }

    // Fetch user from auth for email
    const { data: { session } } = await supabase.auth.getSession();
    const authUser = session?.user;

    if (!authUser) return null;

    return {
      id: data.id,
      email: authUser.email || "",
      displayName: data.display_name || (authUser.email?.split("@")[0] || "User"),
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
      emailVerified: data.email_verified || false,
      emailVerifiedAt: data.email_verified_at || undefined,
      otpEnabled: data.otp_enabled || false,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || undefined,
    };
  } catch (err) {
    logger.error("[UserAuth] Get user profile exception:", err);
    return null;
  }
};

/**
 * Update user profile in profiles table
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>,
): Promise<{ profile: UserProfile | null; error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Updating user profile:", userId);

    const { displayName, avatarUrl, bio } = updates;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        bio: bio,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      logger.error("[UserAuth] Update profile error:", error.message);
      return {
        profile: null,
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    logger.debug("[UserAuth] Profile updated successfully");

    // Fetch session user for email
    const { data: { session } } = await supabase.auth.getSession();
    const authUser = session?.user;

    const profile: UserProfile = {
      id: data.id,
      email: authUser?.email || "",
      displayName: data.display_name || undefined,
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
      emailVerified: data.email_verified || false,
      emailVerifiedAt: data.email_verified_at || undefined,
      otpEnabled: data.otp_enabled || false,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString(),
    };

    return { profile, error: null };
  } catch (err) {
    logger.error("[UserAuth] Update profile exception:", err);
    return {
      profile: null,
      error: {
        message:
          err instanceof Error ? err.message : "Failed to update profile",
      },
    };
  }
};

/**
 * Send password reset email (OTP link)
 */
export const requestPasswordReset = async (
  email: string,
): Promise<{ error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Starting password reset request");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      logger.error("[UserAuth] Password reset error:", error.message);
      return {
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    logger.debug("[UserAuth] Password reset email sent");
    return { error: null };
  } catch (err) {
    logger.error("[UserAuth] Password reset exception:", err);
    return {
      error: {
        message:
          err instanceof Error
            ? err.message
            : "Failed to send password reset email",
      },
    };
  }
};

/**
 * Complete password reset with new password
 */
export const updatePassword = async (
  newPassword: string,
): Promise<{ error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Updating password");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      logger.error("[UserAuth] Password update error:", error.message);
      return {
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    logger.debug("[UserAuth] Password updated successfully");
    return { error: null };
  } catch (err) {
    logger.error("[UserAuth] Password update exception:", err);
    return {
      error: {
        message:
          err instanceof Error ? err.message : "Failed to update password",
      },
    };
  }
};

/**
 * Enable OTP login for current user
 */
export const enableOtpLogin = async (): Promise<{ error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Enabling OTP login");

    const { data, error } = await supabase.rpc("enable_otp_login");

    if (error) {
      logger.error("[UserAuth] Enable OTP error:", error.message);
      return {
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    logger.debug("[UserAuth] OTP login enabled");
    return { error: null };
  } catch (err) {
    logger.error("[UserAuth] Enable OTP exception:", err);
    return {
      error: {
        message:
          err instanceof Error ? err.message : "Failed to enable OTP login",
      },
    };
  }
};

/**
 * Disable OTP login for current user
 */
export const disableOtpLogin = async (): Promise<{ error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Disabling OTP login");

    const { data, error } = await supabase.rpc("disable_otp_login");

    if (error) {
      logger.error("[UserAuth] Disable OTP error:", error.message);
      return {
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    logger.debug("[UserAuth] OTP login disabled");
    return { error: null };
  } catch (err) {
    logger.error("[UserAuth] Disable OTP exception:", err);
    return {
      error: {
        message:
          err instanceof Error ? err.message : "Failed to disable OTP login",
      },
    };
  }
};

/**
 * Sign out user
 * CRITICAL: Be as fast as possible - this is called from UI and user expects instant logout
 */
export const signOutUser = async (): Promise<{ error: AuthError | null }> => {
  try {
    logger.debug("[UserAuth] Starting sign out");
    
    // ✅ FAST PATH: Just sign out, don't verify
    // Verification calls can timeout and slow down logout
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      logger.error("[UserAuth] Signout error:", error.message);
      return {
        error: {
          message: error.message,
          code: error.code,
        },
      };
    }

    logger.debug("[UserAuth] Sign out successful");
    return { error: null };
  } catch (err) {
    logger.error("[UserAuth] Signout exception:", err);
    return {
      error: {
        message:
          err instanceof Error ? err.message : "Unknown signout error",
      },
    };
  }
};

/**
 * Sign in with Google OAuth
 * Securely redirects to Google, handles callback
 * Email is auto-verified by Google
 */
export const signInWithGoogle = async (): Promise<{
  error: AuthError | null;
}> => {
  try {
    logger.debug("[UserAuth] Starting Google OAuth sign-in");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      logger.error("[UserAuth] Google OAuth error:", error.message);
      return {
        error: {
          message: error.message || "Google sign-in failed",
          code: error.code,
        },
      };
    }

    logger.debug("[UserAuth] Google OAuth redirect initiated");
    return { error: null };
  } catch (err) {
    logger.error("[UserAuth] Google OAuth exception:", err);
    return {
      error: {
        message:
          err instanceof Error ? err.message : "Google sign-in failed",
      },
    };
  }
};
