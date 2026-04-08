import { env } from "~/env";

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  thumbnails: {
    maxres?: { url: string };
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  };
}

interface YouTubeVideoContentDetails {
  duration: string; // ISO 8601 e.g. "PT12M34S"
}

interface YouTubeVideoResource {
  id: string;
  snippet: YouTubeVideoSnippet;
  contentDetails: YouTubeVideoContentDetails;
}

interface YouTubeApiResponse {
  items?: YouTubeVideoResource[];
}

export interface YouTubeVideoMeta {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  timestamps: { time: number; label: string }[];
}

/**
 * Extracts a YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

/** Converts ISO 8601 duration (PT1H2M30S) to readable string */
function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = match[1] ? `${match[1]}:` : "";
  const m = match[2] ?? "0";
  const s = (match[3] ?? "0").padStart(2, "0");
  if (h) return `${h}${m.padStart(2, "0")}:${s}`;
  return `${m}:${s}`;
}

/**
 * Parses timestamps from a YouTube description.
 * Looks for lines like "0:00 Introduction" or "1:23:45 Some chapter".
 */
function parseTimestamps(
  description: string,
): { time: number; label: string }[] {
  const lines = description.split("\n");
  const timestamps: { time: number; label: string }[] = [];

  for (const line of lines) {
    const match = line.trim().match(/^(\d{1,2}(?::\d{2}){1,2})\s+(.+)$/);
    if (!match?.[1] || !match[2]) continue;

    const parts = match[1].split(":").map(Number);
    let seconds = 0;
    if (parts.length === 3) {
      seconds = (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
    } else {
      seconds = (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
    }

    timestamps.push({ time: seconds, label: match[2].trim() });
  }

  return timestamps;
}

/** Fetches video metadata from YouTube Data API v3 */
export async function fetchYouTubeMetadata(
  videoId: string,
): Promise<YouTubeVideoMeta> {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("id", videoId);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube API returned ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as YouTubeApiResponse;
  const video = data.items?.[0];
  if (!video) {
    throw new Error("Video not found on YouTube");
  }

  const { snippet, contentDetails } = video;
  const thumb =
    snippet.thumbnails.maxres ??
    snippet.thumbnails.high ??
    snippet.thumbnails.medium ??
    snippet.thumbnails.default;

  return {
    youtubeId: videoId,
    title: snippet.title,
    description: snippet.description,
    thumbnailUrl:
      thumb?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: formatDuration(contentDetails.duration),
    timestamps: parseTimestamps(snippet.description),
  };
}
