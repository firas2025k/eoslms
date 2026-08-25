/**
 * Parse a Sanity lesson videoUrl into a safe provider embed URL.
 * Only allowlisted hosts become iframe src — never pass raw strings through.
 */

export type VideoProvider = "youtube" | "vimeo" | "bunny";

export type VideoEmbed = {
  provider: VideoProvider;
  embedUrl: string;
};

export type VideoEmbedOptions = {
  /** Enable the YouTube IFrame API so we can read currentTime (signed-in resume). */
  youtubeJsApi?: boolean;
  /** Required by YouTube when enablejsapi=1. */
  origin?: string | null;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

const BUNNY_HOSTS = new Set(["iframe.mediadelivery.net", "video.bunnycdn.com"]);

function parseStartSeconds(startSeconds: number | null | undefined): number | null {
  if (startSeconds == null || !Number.isFinite(startSeconds) || startSeconds < 0) {
    return null;
  }
  return Math.floor(startSeconds);
}

function youtubeIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }
  if (url.pathname.startsWith("/embed/")) {
    return url.pathname.split("/")[2] || null;
  }
  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/")[2] || null;
  }
  return url.searchParams.get("v");
}

function vimeoIdFromUrl(url: URL): string | null {
  if (url.hostname === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    // /video/{id}
    const idx = parts.indexOf("video");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return null;
  }
  const parts = url.pathname.split("/").filter(Boolean);
  // /{id} or /channels/.../{id} — take the last numeric segment
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(parts[i]!)) return parts[i]!;
  }
  return null;
}

/**
 * Returns an embed descriptor, or null if the URL is missing/unsupported.
 */
export function getVideoEmbed(
  videoUrl: string | null | undefined,
  startSeconds?: number | null,
  options?: VideoEmbedOptions,
): VideoEmbed | null {
  if (!videoUrl) return null;

  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  const start = parseStartSeconds(startSeconds);

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const id = youtubeIdFromUrl(url);
    if (!id || !/^[\w-]{6,}$/.test(id)) return null;
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    embed.searchParams.set("rel", "0");
    if (start != null && start > 0) {
      embed.searchParams.set("start", String(start));
    }
    if (options?.youtubeJsApi) {
      embed.searchParams.set("enablejsapi", "1");
      if (options.origin) {
        embed.searchParams.set("origin", options.origin);
      }
    }
    return { provider: "youtube", embedUrl: embed.toString() };
  }

  if (VIMEO_HOSTS.has(url.hostname)) {
    const id = vimeoIdFromUrl(url);
    if (!id) return null;
    const embed = new URL(`https://player.vimeo.com/video/${id}`);
    if (start != null && start > 0) {
      embed.hash = `t=${start}s`;
    }
    return { provider: "vimeo", embedUrl: embed.toString() };
  }

  if (BUNNY_HOSTS.has(url.hostname)) {
    // Already an embed-style URL — only allow known Bunny hosts.
    const embed = new URL(url.toString());
    // Bunny start param varies by library config; omit if unsupported.
    if (start != null && start > 0) {
      embed.searchParams.set("t", String(start));
    }
    return { provider: "bunny", embedUrl: embed.toString() };
  }

  return null;
}
