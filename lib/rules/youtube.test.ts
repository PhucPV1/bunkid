import { describe, expect, it, vi } from "vitest";
import {
  FALLBACK_MS,
  openYouTube,
  parseOpenMode,
  parseYouTubeUrl,
  youtubePath,
  type OpenDeps,
} from "./youtube";

const V = "dQw4w9WgXcQ";
const L = "PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG";

describe("parseYouTubeUrl (spec §6.11)", () => {
  it("reads every supported form", () => {
    const video = { kind: "video", id: V };
    for (const url of [
      `https://www.youtube.com/watch?v=${V}`,
      `https://youtube.com/watch?v=${V}&list=${L}`,
      `https://youtu.be/${V}?si=abc`,
      `https://www.youtube.com/shorts/${V}`,
      `https://www.youtube.com/live/${V}?feature=share`,
      `https://m.youtube.com/watch?v=${V}`,
      `https://music.youtube.com/watch?v=${V}`,
      `youtu.be/${V}`,
      `  https://www.youtube.com/watch?feature=share&v=${V}  `,
    ])
      expect(parseYouTubeUrl(url), url).toEqual(video);
    expect(
      parseYouTubeUrl(`https://www.youtube.com/playlist?list=${L}`),
    ).toEqual({ kind: "playlist", id: L });
    for (const host of ["music.youtube.com", "m.youtube.com"])
      expect(parseYouTubeUrl(`https://${host}/playlist?list=${L}`)).toEqual({
        kind: "playlist",
        id: L,
      });
  });

  it("rejects other sites, missing ids and malformed links", () => {
    for (const url of [
      "",
      "không phải link",
      `https://vimeo.com/${V}`,
      `https://youtube.com.evil.example/watch?v=${V}`,
      "https://www.youtube.com/watch",
      "https://www.youtube.com/watch?v=short",
      "https://youtu.be/",
      "https://www.youtube.com/playlist",
      "https://www.youtube.com/@kenh",
    ])
      expect(parseYouTubeUrl(url), url).toBeNull();
  });
});

describe("youtubePath", () => {
  it("builds watch, playlist and search paths", () => {
    expect(youtubePath({ kind: "video", id: V })).toBe(`watch?v=${V}`);
    expect(youtubePath({ kind: "playlist", id: L })).toBe(`playlist?list=${L}`);
    expect(youtubePath({ kind: "search", query: "nhạc ru ngủ cho bé" })).toBe(
      "results?search_query=nh%E1%BA%A1c%20ru%20ng%E1%BB%A7%20cho%20b%C3%A9",
    );
  });
});

describe("openYouTube (spec §6.11)", () => {
  function fakeDeps() {
    const visits: string[] = [];
    let leave: (() => void) | null = null;
    let pending: (() => void) | null = null;
    const deps: OpenDeps = {
      go: (href) => visits.push(href),
      setTimer: vi.fn((fn: () => void, ms: number) => {
        expect(ms).toBe(FALLBACK_MS);
        pending = fn;
        return 1;
      }),
      clearTimer: vi.fn(() => {
        pending = null;
      }),
      onLeave: (fn) => {
        leave = fn;
        return () => {
          leave = null;
        };
      },
    };
    return {
      deps,
      visits,
      leave: () => leave?.(),
      fire: () => pending?.(),
    };
  }

  it("opens the app and stays there when the page loses focus", () => {
    const t = fakeDeps();
    openYouTube(`watch?v=${V}`, t.deps);
    t.leave();
    t.fire();
    expect(t.visits).toEqual([`youtube://www.youtube.com/watch?v=${V}`]);
  });

  it("falls back to the web page in the same tab when nothing happened in 1.5 s", () => {
    const t = fakeDeps();
    openYouTube(`watch?v=${V}`, t.deps);
    t.fire();
    expect(t.visits).toEqual([
      `youtube://www.youtube.com/watch?v=${V}`,
      `https://www.youtube.com/watch?v=${V}`,
    ]);
  });
});

describe("parseOpenMode", () => {
  it("defaults to the app and keeps an explicit web choice", () => {
    expect(parseOpenMode(null)).toBe("app");
    expect(parseOpenMode("app")).toBe("app");
    expect(parseOpenMode("web")).toBe("web");
    expect(parseOpenMode("other")).toBe("app");
  });
});
