"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/admin-guard";
import type { AdminActionResult } from "@/lib/admin-action-result";
import {
  HOME_SETTINGS_ID,
  parseHomeSettings,
  type HomeSettings,
} from "@/lib/home-settings";

const TABLE_MISSING =
  "Run supabase/migrations/20260821000000_site_settings.sql in the Supabase SQL editor. Until it is applied there is nowhere to store the landing page settings, so the site falls back to the built-in defaults.";

/** Postgres codes for "no such table" and "no such column". */
function isMissingTable(code: string | undefined) {
  return code === "42P01" || code === "42703" || code === "PGRST205";
}

/**
 * Persist the landing page's editorial settings.
 *
 * The payload arrives from the browser, so it is re-parsed through
 * `parseHomeSettings` before it is written: the stored row can then only ever
 * contain fields the page knows how to render, with defaults filled in for
 * anything blank or missing.
 */
export async function saveHomeSettings(
  incoming: HomeSettings,
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  const settings = parseHomeSettings(incoming);

  const { error } = await ctx.supabase
    .from("site_settings")
    .upsert(
      { id: HOME_SETTINGS_ID, content: settings, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );

  if (error) {
    return {
      ok: false,
      error: isMissingTable(error.code) ? TABLE_MISSING : error.message,
    };
  }

  // The landing page is ISR'd, so an edit is only visible once its entry is
  // dropped. `/admin` too, so the editor reloads with what was actually stored.
  revalidatePath("/");
  revalidatePath("/admin");

  return { ok: true };
}
