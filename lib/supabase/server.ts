// lib/supabase/server.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side Supabase client using @supabase/ssr.
// Must be called inside Server Components, Server Actions, or Route Handlers.
// Reads/writes session cookies so the JWT is always fresh on every request.
// ─────────────────────────────────────────────────────────────────────────────
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies cannot be written here.
            // The middleware refreshes the session cookie before every route render,
            // so this silent catch is safe.
          }
        },
      },
    },
  );
}
