import "server-only";

import { hasAdminSession } from "@/lib/server/admin-auth";
import { createAdminSupabaseClient } from "@/lib/server/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const SESSION_EXPIRED = "Your admin session expired. Sign in again.";
const SERVICE_NOT_CONFIGURED =
  "SUPABASE_SERVICE_ROLE_KEY is not set, so admin actions are disabled.";

/**
 * The gate every admin Server Action goes through.
 *
 * Server Actions are reachable by direct POST, not only from the console UI,
 * so the session check has to live inside the action rather than in the page
 * that renders the button. Lives outside the `"use server"` action files on
 * purpose: everything exported from one of those becomes a callable endpoint.
 */
export async function requireAdmin(): Promise<
  { supabase: SupabaseClient } | { error: string }
> {
  if (!(await hasAdminSession())) {
    return { error: SESSION_EXPIRED };
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { error: SERVICE_NOT_CONFIGURED };
  }

  return { supabase };
}
