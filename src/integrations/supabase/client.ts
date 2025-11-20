import { createClient } from '@supabase/supabase-js';

// Read Supabase config from environment only. No hard-coded fallbacks allowed.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_AVAILABLE = Boolean(supabaseUrl && supabaseAnonKey);

// Only instantiate the real Supabase client when both env vars are present.
// Calling createClient with an empty string triggers a runtime validation error
// inside the library, which is what caused the failure you saw. When not
// available, export a lightweight stub that surfaces friendly errors at call
// time. Consumers should check `SUPABASE_AVAILABLE` when they want to run
// server-backed flows in development without configuring Supabase.
let supabaseClient: any = null;

if (SUPABASE_AVAILABLE) {
  supabaseClient = createClient(supabaseUrl as string, supabaseAnonKey as string);
} else {
  console.error('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client will be disabled.');

  // Minimal stub matching the subset of the Supabase client surface used in
  // the app. This prevents module-evaluation errors while making it obvious
  // at runtime that Supabase is unavailable.
  supabaseClient = {
    functions: {
      invoke: async (_name: string, _opts?: any) => ({ error: new Error('Supabase is not configured (VITE_SUPABASE_URL missing)') }),
    },
    auth: {
      // callers may await auth.getUser() or similar - return a shaped response
      getUser: async () => ({ data: null, error: new Error('Supabase is not configured') }),
    },
    from: () => ({
      select: async () => ({ data: null, error: new Error('Supabase is not configured') }),
      insert: async () => ({ data: null, error: new Error('Supabase is not configured') }),
      update: async () => ({ data: null, error: new Error('Supabase is not configured') }),
      delete: async () => ({ data: null, error: new Error('Supabase is not configured') }),
    }),
  } as any;
}

export const supabase = supabaseClient;
