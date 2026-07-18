export type SocialPlatform = "instagram" | "x" | "youtube";

export const SOCIAL_PLATFORMS: {
  id: SocialPlatform;
  label: string;
  placeholder: string;
}[] = [
  { id: "instagram", label: "Instagram", placeholder: "@handle or link" },
  { id: "x", label: "X", placeholder: "@handle or link" },
  { id: "youtube", label: "YouTube", placeholder: "@channel or link" },
];

/**
 * Turn a raw handle or link into a full profile URL. Accepts a pasted URL as
 * is, or an @handle / bare handle and builds the platform URL. Returns "" for
 * empty input so callers can skip unset socials.
 */
export function normalizeSocialUrl(
  platform: SocialPlatform,
  raw: string,
): string {
  const value = raw.trim();
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const handle = value.replace(/^@+/, "").replace(/^\/+/, "");
  if (!handle) {
    return "";
  }

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    case "youtube":
      // Preserve real channel paths; otherwise treat it as an @handle.
      return /^(channel|c|user)\//.test(handle)
        ? `https://youtube.com/${handle}`
        : `https://youtube.com/@${handle}`;
  }
}
