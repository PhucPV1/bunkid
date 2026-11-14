import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const VaccineSeriesSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    program: z.enum(["tcmr", "dich_vu"]),
  })
  .strict();

export const VaccineGroupSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    series: z.array(VaccineSeriesSchema).min(1),
  })
  .strict();

// Spec §6.8, plus optional maxAgeDays / note for products with a hard age limit.
export const VaccineDoseSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    doseNo: z.number().int().min(1).max(10),
    name: z.string().min(1),
    protects: z.array(z.string().min(1)).min(1),
    program: z.enum(["tcmr", "dich_vu"]),
    group: z.string().min(1).optional(),
    series: z.string().min(1).optional(),
    recommendedAgeDays: z.number().int().min(0),
    minAgeDays: z.number().int().min(0),
    minIntervalDaysFromPrev: z.number().int().min(1).optional(),
    maxAgeDays: z.number().int().min(0).optional(),
    note: z.string().min(1).optional(),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const VaccineContentSchema = z
  .object({
    title: z.string().min(1),
    disclaimer: z.string().min(1),
    reviewedAt: isoDate,
    groups: z.array(VaccineGroupSchema),
    doses: z.array(VaccineDoseSchema),
  })
  .strict();

export type VaccineSeries = z.infer<typeof VaccineSeriesSchema>;
export type VaccineGroup = z.infer<typeof VaccineGroupSchema>;
export type VaccineDose = z.infer<typeof VaccineDoseSchema>;
export type VaccineContent = z.infer<typeof VaccineContentSchema>;
