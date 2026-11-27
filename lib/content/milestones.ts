import { z } from "zod";
import data from "@/content/milestones.vi.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const code = z.string().regex(/^[a-z0-9_]{1,40}$/);

export const DomainSchema = z.enum([
  "social",
  "language",
  "cognitive",
  "movement",
]);
export type Domain = z.infer<typeof DomainSchema>;

export const MilestoneGroupSchema = z
  .object({
    months: z.number().int().min(1).max(36),
    items: z
      .array(
        z
          .object({ code, domain: DomainSchema, text: z.string().min(1) })
          .strict(),
      )
      .min(1),
    // Spec §6.9: "Khi nào nên hỏi bác sĩ" for every month group.
    askDoctor: z.array(z.string().min(1)).min(1),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const MotorMilestoneSchema = z
  .object({
    code,
    name: z.string().min(1),
    // Spec 2026-11-27 §3.4: lower-case name for the "Vận động lớn" summary.
    short: z.string().min(1),
    // Normal age window in months: WHO 1st–99th percentile for the six WHO
    // milestones; "lat" (rolling) uses the 4–6 months of spec §6.9 / CDC.
    fromMonths: z.number().min(0),
    toMonths: z.number().min(0),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict()
  .refine((m) => m.fromMonths < m.toMonths, "fromMonths < toMonths");

export const MilestonesContentSchema = z
  .object({
    title: z.string().min(1),
    intro: z.string().min(1),
    domains: z.record(DomainSchema, z.string().min(1)),
    reviewedAt: isoDate,
    groups: z.array(MilestoneGroupSchema).min(1),
    motor: z.array(MotorMilestoneSchema).min(1),
  })
  .strict();

export type MilestoneGroup = z.infer<typeof MilestoneGroupSchema>;
export type MotorMilestone = z.infer<typeof MotorMilestoneSchema>;

export const MILESTONES = MilestonesContentSchema.parse(data);
