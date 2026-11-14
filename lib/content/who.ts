import { z } from "zod";

export type WhoIndicator = "wfa" | "lhfa" | "hcfa";
export type WhoSex = "boys" | "girls";

export const WHO_LAST_DAY = 1856;

export type LmsRow = [day: number, l: number, m: number, s: number];

export const WhoTableSchema = z
  .object({
    indicator: z.enum(["wfa", "lhfa", "hcfa"]),
    sex: z.enum(["boys", "girls"]),
    unit: z.enum(["kg", "cm"]),
    source: z.url(),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    // [day, L, M, S] for every day 0..1856.
    rows: z
      .array(
        z.tuple([
          z.number().int().min(0),
          z.number(),
          z.number().positive(),
          z.number().positive(),
        ]),
      )
      .length(WHO_LAST_DAY + 1),
  })
  .strict();

export type WhoTable = z.infer<typeof WhoTableSchema>;

// One chunk per table, loaded only by the pages that draw it (each is ~50 KB).
const LOADERS: Record<`${WhoIndicator}_${WhoSex}`, () => Promise<unknown>> = {
  wfa_boys: () => import("@/content/who/wfa_boys.json"),
  wfa_girls: () => import("@/content/who/wfa_girls.json"),
  lhfa_boys: () => import("@/content/who/lhfa_boys.json"),
  lhfa_girls: () => import("@/content/who/lhfa_girls.json"),
  hcfa_boys: () => import("@/content/who/hcfa_boys.json"),
  hcfa_girls: () => import("@/content/who/hcfa_girls.json"),
};

export async function loadWhoTable(
  indicator: WhoIndicator,
  sex: WhoSex,
): Promise<WhoTable> {
  const mod = (await LOADERS[`${indicator}_${sex}`]()) as { default: unknown };
  return WhoTableSchema.parse(mod.default);
}

// babies.sex is "male" | "female"; the WHO tables are named boys / girls.
export const whoSex = (sex: string): WhoSex =>
  sex === "female" ? "girls" : "boys";
