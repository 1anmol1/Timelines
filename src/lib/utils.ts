export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 100);
}

export function generateSessionId(): string {
  if (typeof window !== "undefined") {
    let sessionId = localStorage.getItem("timelines_session_id");
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("timelines_session_id", sessionId);
    }
    return sessionId;
  }
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + "...";
}

export function parseBlockContent<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    return {} as T;
  }
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getTimelineUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/t/${slug}`;
}

export function detectContentType(text: string): "url" | "youtube" | "image_url" | "text" {
  const urlRegex = /^https?:\/\/[^\s]+$/;
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//;
  const imageUrlRegex = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;

  if (youtubeRegex.test(text)) return "youtube";
  if (imageUrlRegex.test(text)) return "image_url";
  if (urlRegex.test(text)) return "url";
  return "text";
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
