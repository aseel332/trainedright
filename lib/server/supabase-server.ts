import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAuthConfig } from "@/lib/supabase-config";

export async function createAuthServerClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseAuthConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; Proxy refreshes the session.
        }
      },
    },
  });
}