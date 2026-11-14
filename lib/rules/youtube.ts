export type YouTubeTarget =
  { kind: "video"; id: string } | { kind: "playlist"; id: string };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const LIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

// Spec §6.11: watch?v=, youtu.be/, shorts/, m., music., playlist?list=.
// A watch link that also carries list= opens the video.
export function parseYouTubeUrl(raw: string): YouTubeTarget | null {
  let url: URL;
  try {
    const text = raw.trim();
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;
  const video = (id: string | null | undefined): YouTubeTarget | null =>
    id && VIDEO_ID.test(id) ? { kind: "video", id } : null;
  if (host === "youtu.be") return video(url.pathname.split("/")[1]);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "watch") return video(url.searchParams.get("v"));
  if (parts[0] === "shorts" || parts[0] === "live") return video(parts[1]);
  if (parts[0] === "playlist") {
    const list = url.searchParams.get("list");
    return list && LIST_ID.test(list) ? { kind: "playlist", id: list } : null;
  }
  return null;
}

// "<path>" of spec §6.11.
export function youtubePath(
  target: YouTubeTarget | { kind: "search"; query: string },
): string {
  if (target.kind === "video") return `watch?v=${target.id}`;
  if (target.kind === "playlist") return `playlist?list=${target.id}`;
  return `results?search_query=${encodeURIComponent(target.query)}`;
}

export const appUrl = (path: string) => `youtube://www.youtube.com/${path}`;

// Per-device choice: "app" tries youtube:// first (spec §6.11); "web" opens
// www.youtube.com directly, for phones whose YouTube app does not handle
// youtube:// (for example one installed outside the App Store).
export type OpenMode = "app" | "web";
export const OPEN_MODE_KEY = "be-yeu:youtube-open";

export function parseOpenMode(value: string | null): OpenMode {
  return value === "web" ? "web" : "app";
}
export const webUrl = (path: string) => `https://www.youtube.com/${path}`;

export type OpenDeps = {
  go: (href: string) => void;
  setTimer: (fn: () => void, ms: number) => number;
  clearTimer: (id: number) => void;
  // Registers a one-shot "the page lost focus" listener; returns an unsubscribe.
  onLeave: (fn: () => void) => () => void;
};

export const FALLBACK_MS = 1500;

// Spec §6.11: try the app; if the page never loses focus within 1.5 s, open the
// web page in the same tab.
export function openYouTube(path: string, deps: OpenDeps): void {
  let timer = 0;
  const stopListening = deps.onLeave(() => {
    deps.clearTimer(timer);
    stopListening();
  });
  timer = deps.setTimer(() => {
    stopListening();
    deps.go(webUrl(path));
  }, FALLBACK_MS);
  deps.go(appUrl(path));
}

export function browserOpenDeps(): OpenDeps {
  return {
    go: (href) => {
      window.location.href = href;
    },
    setTimer: (fn, ms) => window.setTimeout(fn, ms),
    clearTimer: (id) => window.clearTimeout(id),
    onLeave: (fn) => {
      const onVisibility = () => {
        if (document.visibilityState === "hidden") fn();
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", fn);
      window.addEventListener("blur", fn);
      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", fn);
        window.removeEventListener("blur", fn);
      };
    },
  };
}
