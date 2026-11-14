import { z } from "zod";
import data from "@/content/holding.vi.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const lines = z.array(z.string().min(1)).min(1);

export const HoldingPositionSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    name: z.string().min(1),
    steps: lines,
    safety: lines,
    searchQuery: z.string().min(1),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const HoldingContentSchema = z
  .object({
    title: z.string().min(1),
    intro: z.string().min(1),
    reviewedAt: isoDate,
    stages: z
      .array(
        z
          .object({
            code: z.string().regex(/^[a-z0-9_]+$/),
            name: z.string().min(1),
            positions: z.array(HoldingPositionSchema).min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type HoldingPosition = z.infer<typeof HoldingPositionSchema>;

export const HOLDING = HoldingContentSchema.parse(data);
