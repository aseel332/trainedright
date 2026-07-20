import { NextResponse, type NextRequest } from "next/server";
import { isTrackedEvent, recordTrainerEvent } from "@/lib/server/analytics";

/**
 * Analytics beacon for the public marketplace pages (profile views, WhatsApp
 * clicks, trial requests, saves, shares). Accepts sendBeacon payloads, so it
 * must stay a route handler rather than a server action.
 *
 * Always answers 204: the beacon is fire-and-forget and callers never read
 * the body. Invalid payloads are dropped silently.
 */

// Basic in-memory abuse controls. The endpoint is unauthenticated, so without
// these anyone could inflate a trainer's demand numbers by replaying the
// beacon. In-memory state is per-instance (Fluid Compute reuses instances),
// which is enough to blunt casual scripted inflation without a datastore.
const DEDUP_WINDOW_MS = 60_000; // ignore identical (ip, slug, event) repeats
const RATE_WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 60; // per client IP, across all events
const MAX_TRACKED_KEYS = 50_000; // hard cap so the maps can't grow unbounded

const recentEvents = new Map<string, number>();
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** True when this IP is within its per-window budget (and records the hit). */
function withinRateLimit(ip: string, now: number) {
  const entry = ipCounts.get(ip);
  if (!entry || now >= entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_EVENTS_PER_WINDOW) {
    return false;
  }
  entry.count += 1;
  return true;
}

/** True when this exact event is a duplicate inside the dedup window. */
function isDuplicate(key: string, now: number) {
  const last = recentEvents.get(key);
  if (last !== undefined && now - last < DEDUP_WINDOW_MS) {
    return true;
  }
  recentEvents.set(key, now);
  return false;
}

/** Drop expired entries, and evict oldest if a map somehow grows too large. */
function sweep(now: number) {
  if (recentEvents.size > MAX_TRACKED_KEYS) {
    recentEvents.clear();
  }
  for (const [key, at] of recentEvents) {
    if (now - at >= DEDUP_WINDOW_MS) {
      recentEvents.delete(key);
    }
  }
  for (const [ip, entry] of ipCounts) {
    if (now >= entry.resetAt) {
      ipCounts.delete(ip);
    }
  }
}

export async function POST(request: NextRequest) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  if (typeof body !== "object" || body === null) {
    return new NextResponse(null, { status: 204 });
  }

  const { slug, event } = body as { slug?: unknown; event?: unknown };

  if (
    typeof slug === "string" &&
    slug.length > 0 &&
    slug.length <= 200 &&
    /^[a-z0-9-]+$/.test(slug) &&
    isTrackedEvent(event)
  ) {
    const now = Date.now();
    const ip = clientIp(request);

    // Opportunistic cleanup keeps the maps bounded without a timer.
    if (recentEvents.size > 1000 || ipCounts.size > 1000) {
      sweep(now);
    }

    if (
      withinRateLimit(ip, now) &&
      !isDuplicate(`${ip}:${slug}:${event}`, now)
    ) {
      await recordTrainerEvent(slug, event);
    }
  }

  return new NextResponse(null, { status: 204 });
}
