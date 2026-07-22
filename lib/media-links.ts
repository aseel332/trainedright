export type VideoProvider = "drive" | "youtube" | "file";

export type ParsedVideo = {
  provider: VideoProvider;
  /** What gets stored + played: an iframe src (drive/youtube) or file URL. */
  embedUrl: string;
  /** true when embedUrl must be rendered in an <iframe>, not a <video>. */
  isIframe: boolean;
  /** Poster/thumbnail image URL, or "" when none can be derived. */
  thumbnailUrl: string;
};

function driveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function youtubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Turn a pasted video link (Google Drive, YouTube, or a direct file) into an
 * embeddable URL + thumbnail. Returns null for anything unrecognized so the UI
 * can reject it.
 */
export function parseVideoLink(raw: string): ParsedVideo | null {
  const url = raw.trim();
  if (!url) {
    return null;
  }

  if (/drive\.google\.com/i.test(url)) {
    const id = driveFileId(url);
    if (!id) {
      return null;
    }
    return {
      provider: "drive",
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      isIframe: true,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
    };
  }

  if (/youtube\.com|youtu\.be/i.test(url)) {
    const id = youtubeId(url);
    if (!id) {
      return null;
    }
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      isIframe: true,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (
    /^https?:\/\//i.test(url) &&
    /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url)
  ) {
    return { provider: "file", embedUrl: url, isIframe: false, thumbnailUrl: "" };
  }

  return null;
}

export function isValidVideoLink(raw: string): boolean {
  return parseVideoLink(raw) !== null;
}

/**
 * A URL that opens the source video in its own, fully-controllable player —
 * used as a reliable fallback where the inline embed's controls are limited,
 * notably Google Drive's preview player on mobile (persistent top toolbar,
 * flaky touch controls). Takes the URL as stored by publish (an embed/preview
 * or direct-file URL) and returns the "watch"/"view" page.
 */
export function watchUrlForStoredVideo(url: string): string {
  const youtube = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (youtube) {
    return `https://www.youtube.com/watch?v=${youtube[1]}`;
  }

  if (/drive\.google\.com/i.test(url)) {
    return url.replace(/\/preview([?#].*)?$/i, "/view");
  }

  return url;
}

/**
 * True when Next's image optimizer is allowed to fetch this URL — it must match
 * a host in next.config `images.remotePatterns`. Video thumbnails (Google Drive,
 * YouTube) and other off-allowlist hosts must render with `unoptimized`.
 */
export function isOptimizableImageUrl(url: string): boolean {
  return (
    /^https:\/\/[^/]*\.supabase\.co\/storage\/v1\/object\/public\//i.test(url) ||
    /^https:\/\/images\.unsplash\.com\//i.test(url)
  );
}

/**
 * Given a stored media URL (as written by publish), decide how to render it and
 * build the display src. `autoplay` adds autoplay params where supported —
 * YouTube and direct files autoplay; Google Drive's preview player cannot, so
 * it just embeds (plays on tap).
 */
export function resolveStoredVideo(
  url: string,
  autoplay = false,
): { isIframe: boolean; src: string } {
  const youtubeMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    const params = autoplay
      ? `autoplay=1&mute=1&loop=1&playlist=${id}&rel=0&playsinline=1`
      : "rel=0";
    return { isIframe: true, src: `https://www.youtube.com/embed/${id}?${params}` };
  }

  if (/drive\.google\.com/i.test(url)) {
    return { isIframe: true, src: url };
  }

  return { isIframe: false, src: url };
}
