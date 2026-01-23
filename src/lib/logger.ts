/* eslint-disable no-console */
// Lightweight centralized logger — silences output in production builds
import { captureException, captureMessage } from "./telemetry";

const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env;
const isProd = typeof import.meta !== "undefined" && Boolean(metaEnv?.PROD);

export const log = (...args: unknown[]) => {
  if (!isProd) console.log(...args);
};

export const debug = (...args: unknown[]) => {
  if (!isProd) console.debug(...args);
};

export const info = (...args: unknown[]) => {
  if (!isProd) console.info(...args);
};

export const warn = (...args: unknown[]) => {
  if (!isProd) console.warn(...args);
};

export const error = (...args: unknown[]) => {
  try {
    // Forward to Sentry/telemetry in production
    if (args && args.length > 0) {
      const first = args[0];
      if (first instanceof Error) {
        captureException(first);
      } else {
        // send combined message
        const msg = args.map((a) => {
          try { return typeof a === "string" ? a : JSON.stringify(a); } catch (e) { return String(a); }
        }).join(" ");
        captureMessage(msg);
      }
    }
    } catch (e) {
      /* ignored - best-effort logging */
  }

  if (!isProd) console.error(...args);
};

export default { log, debug, info, warn, error };
