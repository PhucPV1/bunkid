import data from "@/content/who/adult_height.json";
import { z } from "zod";

const AdultLmsSchema = z
  .object({
    l: z.number(),
    m: z.number().positive(),
    s: z.number().positive(),
  })
  .strict();

// Spec 2026-11-25 §6.2: L, M, S of the WHO Growth Reference 2007,
// height-for-age, at 228 months (19 years), where the reference ends. Written
// by `bun scripts/build-who.ts adult`.
export const AdultHeightSchema = z
  .object({
    source: z.url(),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    boys: AdultLmsSchema,
    girls: AdultLmsSchema,
  })
  .strict();

export type AdultHeight = z.infer<typeof AdultHeightSchema>;

// Parsed once at import: a malformed content file fails loudly in tests and builds.
export const ADULT_HEIGHT: AdultHeight = AdultHeightSchema.parse(data);
