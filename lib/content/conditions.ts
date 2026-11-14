import { z } from "zod";
import data from "@/content/conditions.vi.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const lines = z.array(z.string().min(1)).min(1);

export const ConditionArticleSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    title: z.string().min(1),
    summary: z.string().min(1),
    signs: lines,
    homeCare: lines,
    seeDoctor: lines,
    // Spec §6.6: every article has "Khi nào đi khám ngay".
    goNow: lines,
    usualCourse: z.string().min(1),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const ConditionsContentSchema = z
  .object({
    title: z.string().min(1),
    intro: z.string().min(1),
    disclaimer: z.literal("Thông tin tham khảo, không thay thế bác sĩ."),
    reviewedAt: isoDate,
    articles: z.array(ConditionArticleSchema).min(1),
  })
  .strict();

export type ConditionArticle = z.infer<typeof ConditionArticleSchema>;

export const CONDITIONS = ConditionsContentSchema.parse(data);
