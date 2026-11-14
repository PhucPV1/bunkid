import { z } from "zod";
import data from "@/content/music.vi.json";

export const MusicCategorySchema = z.enum(["relax", "brain"]);
export type MusicCategory = z.infer<typeof MusicCategorySchema>;

// Spec §6.11: { presetCode, category, title, searchQuery }.
export const MusicPresetSchema = z
  .object({
    presetCode: z.string().regex(/^[a-z0-9_]{1,40}$/),
    category: MusicCategorySchema,
    title: z.string().min(1),
    searchQuery: z.string().min(1),
  })
  .strict();

export type MusicPreset = z.infer<typeof MusicPresetSchema>;

export const MUSIC_PRESETS: MusicPreset[] = z
  .object({ presets: z.array(MusicPresetSchema).min(1) })
  .strict()
  .parse(data).presets;
