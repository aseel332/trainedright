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
    await recordTrainerEvent(slug, event);
  }

  return new NextResponse(null, { status: 204 });
}
