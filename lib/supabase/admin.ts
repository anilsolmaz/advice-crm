// lib/supabase/admin.ts
// ─────────────────────────────────────────────────────────────────────────────
// Service-role Supabase client — bypasses ALL Row Level Security policies.
//
// ⚠️  CAUTION: Use exclusively in:
//     • Background jobs / cron tasks
//     • Webhook handlers (Supabase Auth, Stripe, etc.)
//     • Server-side admin operations that cannot use the user JWT
//
// NEVER import this module in:
//     • Client Components
//     • Shared lib code that may run on the browser
//     • Any file without "use server" or a .server.ts suffix
// ─────────────────────────────────────────────────────────────────────────────
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type AdminClient = SupabaseClient<Database>;

// Singleton — safe because admin.ts is server-only (no HMR sharing concerns)
let _adminClient: AdminClient | null = null;

export function createSupabaseAdminClient(): AdminClient {
  if (_adminClient) return _adminClient;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY environment variable is not set. " +
        "This client must only be instantiated in a trusted server environment.",
    );
  }

  _adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        // Admin client should never auto-refresh or persist sessions
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return _adminClient;
}
