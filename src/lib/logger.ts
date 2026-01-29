/* eslint-disable no-console */
// Lightweight centralized logger — silences output in production builds
// Also sanitizes logged data to avoid leaking secrets in dev or telemetry.
import { captureException, captureMessage } from "./telemetry";

const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env;
const isProd = typeof import.meta !== "undefined" && Boolean(metaEnv?.PROD);

const SENSITIVE_KEY_RE = /password|secret|token|apikey|api_key|dsn|auth/i;

function redactValue(key: string | null, value: unknown) {
  try {
    if (key && SENSITIVE_KEY_RE.test(String(key))) return '***REDACTED***';
    if (typeof value === 'string') {
      // mask long-looking tokens
      if (value.length > 80 || /[A-Za-z0-9_-]{40,}/.test(value)) return '***REDACTED***';
      return value;
    }
    return value;
  } catch (e) {
    return '***REDACTED***';
  }
}

function safeStringify(obj: unknown) {
  try {
    return JSON.stringify(obj, (k, v) => redactValue(k || null, v));
  } catch (e) {
    try {
      return String(obj);
    } catch (e2) {
      return '***UNSERIALIZABLE***';
    }
  }
}

function sanitizeArgs(args: unknown[]) {
  return args.map((a) => {
    if (a instanceof Error) return a; // keep Error objects intact for telemetry
    if (typeof a === 'string') return redactValue(null, a);
    if (typeof a === 'object' && a !== null) return safeStringify(a);
    return a;
  });
}

export const log = (...args: unknown[]) => {
  const out = sanitizeArgs(args);
  if (!isProd) console.log(...out);
};

export const debug = (...args: unknown[]) => {
  const out = sanitizeArgs(args);
  if (!isProd) console.debug(...out);
};

export const info = (...args: unknown[]) => {
  const out = sanitizeArgs(args);
  if (!isProd) console.info(...out);
};

export const warn = (...args: unknown[]) => {
  const out = sanitizeArgs(args);
  if (!isProd) console.warn(...out);
  // forward sanitized message to telemetry when available
  try {
    const msg = out.map((o) => (typeof o === 'string' ? o : safeStringify(o))).join(' ');
    captureMessage?.(msg);
  } catch (e) {
    /* best-effort */
  }
};

export const error = (...args: unknown[]) => {
  try {
    // Forward errors to telemetry in production. Preserve Error objects.
    if (args && args.length > 0) {
      const first = args[0];
      if (first instanceof Error) {
        captureException(first);
      } else {
        const msg = args.map((a) => (typeof a === 'string' ? redactValue(null, a) : safeStringify(a))).join(' ');
        captureMessage?.(msg);
      }
    }
  } catch (e) {
    /* ignored - best-effort logging */
  }

  const out = sanitizeArgs(args);
  if (!isProd) console.error(...out);
};

export default { log, debug, info, warn, error };
