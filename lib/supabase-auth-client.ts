"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAuthConfig } from "@/lib/supabase-auth";

export function createAuthBrowserClient() {
  const { url, key } = getSupabaseAuthConfig();
  return createBrowserClient(url, key);
}
