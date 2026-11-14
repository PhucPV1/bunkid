import type { MusicCategory, MusicPreset } from "@/lib/content/music";
import type { YouTubeTarget } from "./youtube";

export type MusicLinkLike = {
  id: string;
  category: string;
  title: string | null;
  youtube_video_id: string | null;
  youtube_playlist_id: string | null;
  preset_code: string | null;
  hidden: boolean;
  created_by: string;
};

export type MusicItem =
  | {
      kind: "preset";
      key: string;
      title: string;
      target: { kind: "search"; query: string };
      hidden: boolean;
      preset: MusicPreset;
    }
  | {
      kind: "link";
      key: string;
      title: string;
      target: YouTubeTarget;
      hidden: boolean;
      link: MusicLinkLike;
    };

export const BRAIN_NOTE =
  "Chỉ cho bé nghe, không cho bé xem màn hình. WHO khuyến nghị trẻ dưới 2 tuổi không xem màn hình.";

// Presets first (in content order), then the family's links oldest first.
// A preset row in music_links only carries the hidden flag (spec §6.11).
export function musicItems(input: {
  presets: MusicPreset[];
  links: MusicLinkLike[];
  category: MusicCategory;
}): MusicItem[] {
  const { presets, links, category } = input;
  const hiddenPresets = new Set(
    links.filter((l) => l.preset_code && l.hidden).map((l) => l.preset_code),
  );
  const presetItems: MusicItem[] = presets
    .filter((p) => p.category === category)
    .map((preset) => ({
      kind: "preset",
      key: `preset:${preset.presetCode}`,
      title: preset.title,
      target: { kind: "search", query: preset.searchQuery },
      hidden: hiddenPresets.has(preset.presetCode),
      preset,
    }));
  const linkItems = links
    .filter((l) => l.category === category && !l.preset_code)
    .flatMap((link): MusicItem[] => {
      const target: YouTubeTarget | null = link.youtube_video_id
        ? { kind: "video", id: link.youtube_video_id }
        : link.youtube_playlist_id
          ? { kind: "playlist", id: link.youtube_playlist_id }
          : null;
      if (!target) return [];
      return [
        {
          kind: "link",
          key: `link:${link.id}`,
          title: link.title?.trim() || "Link YouTube",
          target,
          hidden: link.hidden,
          link,
        },
      ];
    });
  return [...presetItems, ...linkItems];
}

export function parseLinkTitle(raw: string): string | null | "too_long" {
  const title = raw.trim();
  if (title === "") return null;
  return title.length > 80 ? "too_long" : title;
}
