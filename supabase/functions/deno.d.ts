// Minimal declarations for the Supabase Edge Function Deno environment
// This file is only for editor/TypeScript intellisense and will not change runtime behavior.

// Deno global namespace with env.get() method
declare namespace Deno {
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
  // SDK boundary: allow flexible options and return type for the external client
  interface QueryBuilder {
    select(columns?: string, options?: Record<string, unknown>): QueryBuilder;
    limit(count: number): QueryBuilder;
    eq(column: string, value: unknown): QueryBuilder;
    not(column: string, operator: string, value: unknown): QueryBuilder;
    lt(column: string, value: unknown): QueryBuilder;
    maybeSingle(): Promise<{ data: unknown; error: unknown }>;
    then(onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown): Promise<unknown>;
  }
  
  export interface SupabaseClient {
    from(table: string): {
      select(columns?: string, options?: Record<string, unknown>): QueryBuilder;
      insert(values: unknown | unknown[], options?: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
      update(values: Record<string, unknown>, options?: Record<string, unknown>): {
        eq(column: string, value: unknown): Promise<{ data: unknown; error: unknown }>;
      };
      upsert(values: unknown | unknown[], options?: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
      delete(): {
        lt(column: string, value: string): Promise<{ data: unknown; error: unknown }>;
      };
      [key: string]: unknown;
    };
    rpc(fn: string, args?: Record<string, unknown>, options?: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
    [key: string]: unknown;
  }
  export function createClient(url: string, key: string, options?: Record<string, unknown>): SupabaseClient;
  export * from "https://esm.sh/@supabase/supabase-js@2";
}

declare module "supabase" {
  export * from "https://esm.sh/@supabase/supabase-js@2";
}
