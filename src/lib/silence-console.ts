/* Silence console output in production builds for client-side only. */
if (typeof window !== "undefined") {
  try {
    // Vite exposes import.meta.env.PROD at build time.
    const isProd = Boolean((import.meta as unknown as { env?: Record<string, unknown> })?.env?.PROD);
    if (isProd) {
      // Replace console methods with no-ops to avoid leaking runtime data.
      const noop = (..._args: unknown[]) => { /* no-op */ };
      const methods: Array<keyof Console> = [
        'log', 'debug', 'info', 'warn', 'error',
      ];

      const consoleLike = console as unknown as Record<string, (...args: unknown[]) => void>;
      for (const m of methods) {
        consoleLike[m] = noop;
      }
    }
  } catch (_e: unknown) {
    // If anything goes wrong, do not break the app.
  }
}
