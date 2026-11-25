import { z } from "zod";
import data from "@/content/nutrition.vi.json";

export const NutritionStageSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,20}$/),
    // Days of age, both ends included.
    fromDay: z.number().int().min(0),
    toDay: z.number().int().min(0),
    title: z.string().min(1),
    items: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type NutritionStage = z.infer<typeof NutritionStageSchema>;

// Spec 2026-11-25 §7.3: what to feed at each stage, with the sources each
// line was checked against and the day of that check.
export const NutritionContentSchema = z
  .object({
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sources: z
      .array(z.object({ name: z.string().min(1), url: z.url() }).strict())
      .min(1),
    stages: z.array(NutritionStageSchema).min(1),
  })
  .strict();

export type NutritionContent = z.infer<typeof NutritionContentSchema>;

// Parsed once at import: a malformed content file fails loudly in tests and builds.
export const NUTRITION: NutritionContent = NutritionContentSchema.parse(data);

// The stage of a baby of that age and the one after it. The last stage has no
// next one; outside every stage both are null.
export function nutritionStage(
  ageDays: number,
  stages: NutritionStage[] = NUTRITION.stages,
): { current: NutritionStage | null; next: NutritionStage | null } {
  const index = stages.findIndex(
    (stage) => ageDays >= stage.fromDay && ageDays <= stage.toDay,
  );
  if (index === -1) return { current: null, next: null };
  return { current: stages[index], next: stages[index + 1] ?? null };
}
