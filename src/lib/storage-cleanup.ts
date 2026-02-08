/**
 * Storage Cleanup - Remove all leftover admin verification flags
 *
 * This runs before UserAuthProvider mounts to ensure no stale flags
 * can interfere with normal user authentication.
 *
 * Usage: Import this in main.tsx or App.tsx before mounting providers
 */

export const cleanupAdminStorageFlags = () => {
  // List of all possible admin flags that might exist from previous attempts
  const flagsToRemove = [
    "wf:adminVerificationPending",
    "adminVerificationPending",
    "wf:admin:verification:pending",
    "ADMIN_VERIFICATION_PENDING",
  ];

  flagsToRemove.forEach((flag) => {
    localStorage.removeItem(flag);
    sessionStorage.removeItem(flag);
  });
};
