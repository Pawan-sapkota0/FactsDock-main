let sentry: { captureException?: (e: unknown) => void; captureMessage?: (m: string) => void } | null = null;
let initialized = false;

export async function initTelemetry() {
  if (initialized) return;
  initialized = true;
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    const dsn = metaEnv?.VITE_SENTRY_DSN;
    if (!dsn) return;
    // dynamic import so package is optional and won't break builds if not installed
    // Use a runtime loader to avoid static analysis by Vite or other bundlers.
    // dynamic Function-based import is intentional to avoid static bundling
    const loader = new Function("m", "return import(m)") as (
      m: string,
    ) => Promise<unknown>;
    const Sentry = (await loader("@sentry/browser")) as {
      init?: (opts: Record<string, unknown>) => void;
      captureException?: (e: unknown) => void;
      captureMessage?: (m: string) => void;
    } | null;
    if (Sentry && Sentry.init) {
      Sentry.init({
        dsn,
        environment: metaEnv?.MODE || metaEnv?.VITE_ENV || "production",
        release: metaEnv?.VITE_RELEASE || undefined,
      });
      sentry = { captureException: Sentry.captureException, captureMessage: Sentry.captureMessage };
    }
  } catch (e) {
    /* ignored - optional telemetry failed to init */
  }
}

export function captureException(err: unknown) {
  try {
    const s = sentry;
    s?.captureException?.(err);
  } catch (e) {
    /* ignored - telemetry capture best-effort */
  }
}

export function captureMessage(msg: string) {
  try {
    const s = sentry;
    s?.captureMessage?.(msg);
  } catch (e) {
    /* ignored - telemetry capture best-effort */
  }
}

export default { initTelemetry, captureException, captureMessage };
