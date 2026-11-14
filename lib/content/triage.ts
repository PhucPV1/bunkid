import { z } from "zod";
import data from "@/content/triage.vi.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const TriageQuestionSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    group: z.string().min(1),
    level: z.enum(["red", "yellow"]),
    // May contain {fastBreathing}, filled in with the age-based threshold.
    text: z.string().min(1),
    // Used in "Đi khám ngay nếu xuất hiện: …".
    short: z.string().min(1),
    minAgeDays: z.number().int().min(0).optional(),
    maxAgeDays: z.number().int().min(0).optional(),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const TriageContentSchema = z
  .object({
    title: z.string().min(1),
    disclaimer: z.literal("Thông tin tham khảo, không thay thế bác sĩ."),
    reviewedAt: isoDate,
    groups: z.array(z.object({ code: z.string(), name: z.string() }).strict()),
    homeCare: z.array(z.string().min(1)).min(1),
    homeCareSource: z.url(),
    questions: z.array(TriageQuestionSchema),
  })
  .strict();

export type TriageQuestion = z.infer<typeof TriageQuestionSchema>;
export type TriageContent = z.infer<typeof TriageContentSchema>;

export const TRIAGE: TriageContent = TriageContentSchema.parse(data);
