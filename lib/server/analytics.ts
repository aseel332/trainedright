import "server-only";

import { createAdminSupabaseClient } from "@/lib/server/supabase-admin";
import type { TrainerAnalytics } from "@/lib/types";

/**
 * Real demand analytics, backed by the `trainer_events` table
 * (supabase/migrations/20260717000000_production_cleanup_and_events.sql).
 *
 * Events are written by the public site through POST /api/track and read back
 * here for the trainer dashboard. Everything is best-effort: analytics must
 * never break a page.
 */

export const TRACKED_EVENTS = [
  "profile_view",
  "whatsapp_click",
  "trial_request",
  "save",
  "share",
] as const;

export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

export function isTrackedEvent(value: unknown): value is TrackedEvent {
  return (
    typeof value === "string" && TRACKED_EVENTS.includes(value as TrackedEvent)
  );
}

/** Store one event against the trainer a public page belongs to. */
export async function recordTrainerEvent(slug: string, event: TrackedEvent) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return;
  }

  try {
    const { data: trainer } = await supabase
      .from("trainers")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!trainer) {
      return;
    }

    await supabase
      .from("trainer_events")
      .insert({ trainer_id: trainer.id, event_type: event });
  } catch {
    // Analytics loss is acceptable; failing the request is not.
  }
}

export const EMPTY_ANALYTICS: TrainerAnalytics = {
  available: false,
  totals: { profileViews: 0, whatsappClicks: 0, trialRequests: 0, saves: 0 },
  weeklyViews: [0, 0, 0, 0, 0, 0, 0, 0],
};

/** Aggregated analytics for the trainer owned by `userId`. */
export async function getTrainerAnalytics(
  userId: string,
): Promise<TrainerAnalytics> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return EMPTY_ANALYTICS;
  }

  try {
    const { data: trainer } = await supabase
      .from("trainers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!trainer) {
      return EMPTY_ANALYTICS;
    }

    const since = new Date(Date.now() - 8 * 7 * 86_400_000).toISOString();
    const [countsResult, viewsResult] = await Promise.all([
      supabase
        .from("trainer_events")
        .select("event_type")
        .eq("trainer_id", trainer.id),
      supabase
        .from("trainer_events")
        .select("created_at")
        .eq("trainer_id", trainer.id)
        .eq("event_type", "profile_view")
        .gte("created_at", since),
    ]);

    // Table not migrated yet (or any other read failure): report unavailable
    // rather than pretending the numbers are zero activity.
    if (countsResult.error || viewsResult.error) {
      return EMPTY_ANALYTICS;
    }

    const totals = { ...EMPTY_ANALYTICS.totals };
    for (const row of countsResult.data ?? []) {
      switch (row.event_type) {
        case "profile_view":
          totals.profileViews += 1;
          break;
        case "whatsapp_click":
          totals.whatsappClicks += 1;
          break;
        case "trial_request":
          totals.trialRequests += 1;
          break;
        case "save":
          totals.saves += 1;
          break;
      }
    }

    const weeklyViews = Array.from({ length: 8 }, () => 0);
    const now = Date.now();
    for (const row of viewsResult.data ?? []) {
      const at = Date.parse(String(row.created_at));
      if (!Number.isFinite(at)) {
        continue;
      }
      const weeksAgo = Math.floor((now - at) / (7 * 86_400_000));
      if (weeksAgo >= 0 && weeksAgo < 8) {
        weeklyViews[7 - weeksAgo] += 1;
      }
    }

    return { available: true, totals, weeklyViews };
  } catch {
    return EMPTY_ANALYTICS;
  }
}
