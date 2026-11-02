import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses Row Level Security, so use it ONLY on the server
 * for trusted work: billing webhooks, usage metering and plan checks.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
