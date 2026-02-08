import React from "react";
import { useUserAuth } from "@/context/UserAuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionRestoreLoaderProps {
  children: React.ReactNode;
}

/**
 * Shows a page skeleton ONLY while Supabase restores the user session from localStorage
 * Disappears immediately once session is restored (even if profile is still loading)
 *
 * Two-phase restoration:
 * Phase 1: Session restoration (INITIAL_SESSION event) → sessionRestored = true → skeleton disappears
 * Phase 2: Profile data fetch happens in background → loading = false when complete
 *
 * User sees:
 * - Skeleton during session restore (T=0-100ms)
 * - Page content immediately after session restore
 * - Profile updates silently in background
 */
export const SessionRestoreLoader: React.FC<SessionRestoreLoaderProps> = ({
  children,
}) => {
  const { sessionRestored } = useUserAuth();

  // Show skeleton only while session is restoring
  // Once session is restored, show page immediately
  if (!sessionRestored) {
    return <SessionRestoreSkeleton />;
  }

  // Once session restored, show the actual content
  return <>{children}</>;
};

/**
 * Minimal skeleton to show during session restoration
 * No layout shift, just a clean loading state
 */
const SessionRestoreSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-full max-w-md space-y-4 p-4">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-3 mt-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
