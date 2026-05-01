/**
 * YouTubeEmbed — renders a responsive 16:9 YouTube iframe for any common
 * YouTube URL form. Returns `null` if the URL is missing or unparseable,
 * so consumers can simply place it in the DOM and it degrades gracefully
 * when a workout has no video.
 *
 * Supported URL forms:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - https://www.youtube.com/shorts/VIDEO_ID
 *   - bare 11-char video id (e.g. "dQw4w9WgXcQ")
 */

interface YouTubeEmbedProps {
  /** Any YouTube URL or bare video ID. `null`/`undefined`/empty renders nothing. */
  url?: string | null;
  /** Optional accessible title for the iframe. */
  title?: string;
  /** Optional extra classes to merge with the dark-theme wrapper styles. */
  className?: string;
}

/**
 * Extracts a YouTube video id from a variety of URL shapes. Returns `null`
 * if no id can be found. Kept pure (no hooks) so it's easy to unit-test.
 */
export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Bare 11-char id shortcut — YouTube ids are always [A-Za-z0-9_-]{11}.
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // Try to parse as a URL; if it isn't a valid URL, bail out.
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  // youtube.com/watch?v=<id>
  if (host.endsWith("youtube.com")) {
    const v = parsed.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

    // /embed/<id> or /shorts/<id>
    const match = parsed.pathname.match(
      /^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/
    );
    if (match) return match[1];
  }

  return null;
}

import { useTranslation } from "@/lib/language-context";

export function YouTubeEmbed({ url, title, className = "" }: YouTubeEmbedProps) {
  const { t } = useTranslation();
  if (!url) return null;
  const id = extractYouTubeId(url);
  if (!id) return null;

  // Fall back to the localized generic title only when the caller
  // didn't pass one. All current call-sites do pass a title, but
  // keeping this safety net preserves the component's drop-in API.
  const resolvedTitle = title ?? t("workoutDetail.videoTitleFallback");

  return (
    // 16:9 wrapper using Tailwind's aspect-video so the embed scales
    // responsively inside the dark-theme card. Rounded + border matches
    // the style used for the workout hero image.
    <div
      className={`relative w-full aspect-video rounded-3xl overflow-hidden border border-border dark:border-white/5 bg-black ${className}`}
    >
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={resolvedTitle}
        className="absolute inset-0 w-full h-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default YouTubeEmbed;
