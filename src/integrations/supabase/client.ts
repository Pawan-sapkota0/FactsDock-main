import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Fallback for preview environments without env vars: call public Edge Functions directly
  console.warn('[Supabase] Missing VITE_SUPABASE_URL/ANON_KEY - using fetch fallback for edge functions.');
  supabase = {
    functions: {
      invoke: async (name: string, options?: { body?: any }) => {
        const url = `${window.location.origin}/functions/v1/${name}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });
        if (!resp.ok) {
          let err: any;
          try { err = await resp.json(); } catch { err = await resp.text(); }
          return { data: null, error: err || new Error(`Request failed: ${resp.status}`) };
        }
        const data = await resp.json();
        return { data, error: null };
      },
    },
  } as any;
}

export { supabase };
