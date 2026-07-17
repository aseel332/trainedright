"use client";

/**
 * Fire-and-forget analytics beacon. Uses sendBeacon so events survive the
 * page unloading (e.g. tapping through to WhatsApp), with a fetch fallback.
 */
export function trackTrainerEvent(
  slug: string,
  event:
    | "profile_view"
    | "whatsapp_click"
    | "trial_request"
    | "save"
    | "share",
) {
  try {
    const payload = JSON.stringify({ slug, event });

    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) {
        return;
      }
    }

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let analytics break the page.
  }
}
