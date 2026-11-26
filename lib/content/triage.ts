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

const code = z.string().regex(/^[a-z0-9_]+$/);

// Spec 2026-11-17 §4.1: a common symptom and the articles it suggests.
// Spec 2026-11-26 §3.2: `short` is the chip of a symptom log; `common` puts the
// chip in the first row of the symptom sheet.
export const TriageSymptomSchema = z
  .object({
    code,
    group: z.string().min(1),
    short: z.string().min(1).max(16),
    common: z.boolean().optional(),
    text: z.string().min(1),
    suggests: z.array(code).min(1),
    minAgeDays: z.number().int().min(0).optional(),
    maxAgeDays: z.number().int().min(0).optional(),
  })
  .strict();

// `when` holds question codes, or "@fever" for a measured temperature from 38°C.
export const FirstAidSchema = z
  .object({
    code,
    title: z.string().min(1),
    when: z.array(z.string().regex(/^(@fever|[a-z0-9_]+)$/)).min(1),
    steps: z.array(z.string().min(1)).min(1),
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
    symptoms: z.array(TriageSymptomSchema).min(1),
    symptomsSource: z.url(),
    firstAid: z.array(FirstAidSchema).min(1),
    whileGoing: z.array(z.string().min(1)).min(1),
    questions: z.array(TriageQuestionSchema),
  })
  .strict();

export type TriageQuestion = z.infer<typeof TriageQuestionSchema>;
export type TriageContent = z.infer<typeof TriageContentSchema>;
export type TriageSymptom = z.infer<typeof TriageSymptomSchema>;
export type FirstAid = z.infer<typeof FirstAidSchema>;

export const TRIAGE: TriageContent = TriageContentSchema.parse(data);
