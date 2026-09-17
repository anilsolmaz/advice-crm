// lib/supabase/client.ts
// ─────────────────────────────────────────────────────────────────────────────
// Browser-side Supabase client using @supabase/ssr.
// Suitable for Client Components and client-side hooks only.
// Re-use the same instance across the app — createBrowserClient is idempotent.
// ─────────────────────────────────────────────────────────────────────────────
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
