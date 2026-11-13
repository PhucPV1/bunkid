import { z } from "zod";

export const LOG_TYPES = [
  "breast",
  "bottle",
  "sleep",
  "diaper",
  "medicine",
  "temperature",
  "pump",
  "tummy",
] as const;
export type LogType = (typeof LOG_TYPES)[number];

export const TIMER_TYPES: readonly LogType[] = [
  "breast",
  "sleep",
  "pump",
  "tummy",
];
export function isTimerType(type: LogType): boolean {
  return TIMER_TYPES.includes(type);
}

const STOOL_COLORS = [
  "yellow",
  "green",
  "brown",
  "black",
  "pale",
  "red",
] as const;
export type StoolColor = (typeof STOOL_COLORS)[number];

const breast = z.object({ side: z.enum(["left", "right"]) }).strict();
const bottle = z
  .object({
    ml: z.number().int().min(1).max(400),
    milk: z.enum(["breast_milk", "formula"]),
  })
  .strict();
const empty = z.object({}).strict();
const diaper = z
  .object({
    wet: z.boolean(),
    dirty: z.boolean(),
    stoolColor: z.enum(STOOL_COLORS).optional(),
  })
  .strict()
  .refine((d) => d.wet || d.dirty, { message: "Chọn ít nhất ướt hoặc bẩn" });
const medicine = z
  .object({
    name: z.string().trim().min(1).max(80),
    amount: z.number().positive().max(1000),
    unit: z.enum(["ml", "mg", "giọt", "viên"]),
    antipyretic: z.boolean(),
  })
  .strict();
const temperature = z
  .object({
    celsius: z.number().min(34).max(43),
    method: z.enum(["nach", "tran", "tai", "hau_mon"]),
  })
  .strict();
const pump = z
  .object({
    mlLeft: z.number().int().min(0).max(500).optional(),
    mlRight: z.number().int().min(0).max(500).optional(),
  })
  .strict();

export const detailsSchemas = {
  breast,
  bottle,
  sleep: empty,
  diaper,
  medicine,
  temperature,
  pump,
  tummy: empty,
} satisfies Record<LogType, z.ZodType>;

export type LogDetails = {
  [K in LogType]: z.infer<(typeof detailsSchemas)[K]>;
};
