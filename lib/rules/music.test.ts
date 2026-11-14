import { describe, expect, it } from "vitest";
import type { MusicPreset } from "@/lib/content/music";
import { musicItems, parseLinkTitle, type MusicLinkLike } from "./music";

const presets: MusicPreset[] = [
  { presetCode: "relax_a", category: "relax", title: "A", searchQuery: "ru a" },
  { presetCode: "relax_b", category: "relax", title: "B", searchQuery: "ru b" },
  { presetCode: "brain_c", category: "brain", title: "C", searchQuery: "c" },
];
const link = (over: Partial<MusicLinkLike>): MusicLinkLike => ({
  id: "l1",
  category: "relax",
  title: null,
  youtube_video_id: null,
  youtube_playlist_id: null,
  preset_code: null,
  hidden: false,
  created_by: "u1",
  ...over,
});

describe("musicItems (spec §6.11)", () => {
  it("lists the tab's presets, then the family's links, with hidden flags", () => {
    const items = musicItems({
      presets,
      category: "relax",
      links: [
        link({ id: "h", preset_code: "relax_b", hidden: true }),
        link({ id: "v", title: " Ru con ", youtube_video_id: "dQw4w9WgXcQ" }),
        link({
          id: "p",
          youtube_playlist_id: "PLx0sYbCqOb8TBPRdmB",
          hidden: true,
        }),
        link({ id: "x", category: "brain", youtube_video_id: "dQw4w9WgXcQ" }),
      ],
    });
    expect(items.map((i) => [i.key, i.title, i.hidden])).toEqual([
      ["preset:relax_a", "A", false],
      ["preset:relax_b", "B", true],
      ["link:v", "Ru con", false],
      ["link:p", "Link YouTube", true],
    ]);
    expect(items[0].target).toEqual({ kind: "search", query: "ru a" });
    expect(items[3].target).toEqual({
      kind: "playlist",
      id: "PLx0sYbCqOb8TBPRdmB",
    });
  });

  it("an unhidden preset row does not hide the preset", () => {
    const items = musicItems({
      presets,
      category: "brain",
      links: [
        link({ preset_code: "brain_c", category: "brain", hidden: false }),
      ],
    });
    expect(items).toHaveLength(1);
    expect(items[0].hidden).toBe(false);
  });
});

describe("parseLinkTitle", () => {
  it("trims, allows empty and caps at 80 characters", () => {
    expect(parseLinkTitle("  Ru  ")).toBe("Ru");
    expect(parseLinkTitle(" ")).toBeNull();
    expect(parseLinkTitle("x".repeat(81))).toBe("too_long");
  });
});
