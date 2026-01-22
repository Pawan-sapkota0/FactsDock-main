// Minimal declarations for the Supabase Edge Function Deno environment
// This file is only for editor/TypeScript intellisense and will not change runtime behavior.

declare namespace Deno {
  // Only the env.get API is used in the function; add a minimal typing for it.
  const env: {
    get(key: string): string | undefined;
  };
}

// Provide a module declaration for the remote std library import used by the function.
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

// In case other std versions are used locally, also allow a looser match (optional)
declare module "https://deno.land/std/*" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

// Supabase client module - handle both direct URL and aliased import
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
  export * from "https://esm.sh/@supabase/supabase-js@2";
}

declare module "supabase" {
  export * from "https://esm.sh/@supabase/supabase-js@2";
}
