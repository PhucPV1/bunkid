import type { LogLike } from "./describeLog";
import { detailsSchemas, MEDICINE_UNITS, type StoolColor } from "./logDetails";

export type InstantType =
  | "bottle"
  | "diaper"
  | "medicine"
  | "temperature"
  | "solids"
  | "water"
  | "bath"
  | "note";
export type QuickValues = Record<string, string | boolean>;
export type QuickField = {
  key: string;
  label: string;
  kind: "number" | "text" | "textarea" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  showIf?: (values: QuickValues) => boolean;
  // Same limit as the schema, so a text field cannot be typed past it.
  maxLength?: number;
};

// Spec 2026-11-17 §3.3: how much the baby ate. Declared above QUICK_FIELDS, which uses it.
export const SOLIDS_AMOUNT_OPTIONS: { value: string; label: string }[] = [
  { value: "little", label: "Ít" },
  { value: "some", label: "Vừa" },
  { value: "lots", label: "Nhiều" },
];

export const QUICK_FIELDS: Record<InstantType, QuickField[]> = {
  bottle: [
    { key: "ml", label: "Số ml", kind: "number" },
    {
      key: "milk",
      label: "Loại sữa",
      kind: "select",
      options: [
        { value: "breast_milk", label: "Sữa mẹ" },
        { value: "formula", label: "Sữa công thức" },
      ],
    },
  ],
  diaper: [
    { key: "wet", label: "Ướt", kind: "checkbox" },
    { key: "dirty", label: "Bẩn", kind: "checkbox" },
    {
      key: "stoolColor",
      label: "Màu phân",
      kind: "select",
      showIf: (v) => v.dirty === true,
      options: [
        { value: "", label: "Không ghi" },
        { value: "yellow", label: "Vàng" },
        { value: "green", label: "Xanh" },
        { value: "brown", label: "Nâu" },
        { value: "black", label: "Đen" },
        { value: "pale", label: "Bạc màu / trắng" },
        { value: "red", label: "Có máu / đỏ" },
      ],
    },
  ],
  medicine: [
    { key: "name", label: "Tên thuốc", kind: "text" },
    { key: "amount", label: "Lượng", kind: "number" },
    {
      key: "unit",
      label: "Đơn vị",
      kind: "select",
      options: MEDICINE_UNITS.map((u) => ({
        value: u,
        label: u,
      })),
    },
    { key: "antipyretic", label: "Thuốc hạ sốt", kind: "checkbox" },
  ],
  temperature: [
    { key: "celsius", label: "Nhiệt độ (°C)", kind: "number" },
    {
      key: "method",
      label: "Đo ở",
      kind: "select",
      options: [
        { value: "nach", label: "Nách" },
        { value: "tran", label: "Trán" },
        { value: "tai", label: "Tai" },
        { value: "hau_mon", label: "Hậu môn" },
      ],
    },
  ],
  solids: [
    { key: "food", label: "Món", kind: "text", maxLength: 80 },
    {
      key: "amount",
      label: "Lượng",
      kind: "select",
      options: SOLIDS_AMOUNT_OPTIONS,
    },
    { key: "isNew", label: "Món mới", kind: "checkbox" },
    {
      key: "reaction",
      label: "Phản ứng (nếu có)",
      kind: "text",
      maxLength: 200,
    },
  ],
  water: [{ key: "ml", label: "Số ml", kind: "number" }],
  bath: [],
  note: [{ key: "text", label: "Nội dung", kind: "textarea", maxLength: 500 }],
};

const DEFAULTS: Record<InstantType, QuickValues> = {
  bottle: { ml: "", milk: "breast_milk" },
  diaper: { wet: true, dirty: false, stoolColor: "" },
  medicine: { name: "", amount: "", unit: "ml", antipyretic: false },
  temperature: { celsius: "", method: "nach" },
  solids: { food: "", amount: "some", isNew: false, reaction: "" },
  water: { ml: "" },
  bath: {},
  note: { text: "" },
};

// Tắm has no fields, so it has nothing to get wrong and no message.
type CheckedType = Exclude<InstantType, "bath">;

const MESSAGES: Record<CheckedType, string> = {
  bottle: "Nhập số ml từ 1 đến 400",
  diaper: "Chọn ít nhất ướt hoặc bẩn",
  medicine: "Nhập tên thuốc và lượng dùng",
  temperature: "Nhập nhiệt độ từ 34 đến 43°C",
  solids: "Nhập tên món",
  water: "Nhập số ml từ 1 đến 500",
  note: "Nhập ghi chú",
};

export function defaultQuickValues(type: InstantType): QuickValues {
  return { ...DEFAULTS[type] };
}

// Spec 2026-11-19 §5.3: what a quick-entry sheet starts from. A bottle opens with
// the most recent amount, unless the caller already gave one.
export function initialQuickValues(
  type: InstantType,
  initial: QuickValues | undefined,
  recentLogs: LogLike[],
): QuickValues {
  const values = { ...defaultQuickValues(type), ...initial };
  if (type !== "bottle" || initial?.ml !== undefined) return values;
  const [latest] = recentBottleAmounts(recentLogs);
  return latest === undefined ? values : { ...values, ml: String(latest) };
}

function toNumber(value: string | boolean | undefined): number {
  if (typeof value !== "string" || value.trim() === "") return Number.NaN;
  return Number(value.trim().replace(",", "."));
}

function rawDetails(
  type: CheckedType,
  v: QuickValues,
): Record<string, unknown> {
  switch (type) {
    case "bottle":
      return { ml: toNumber(v.ml), milk: v.milk };
    case "diaper":
      return {
        wet: v.wet === true,
        dirty: v.dirty === true,
        ...(v.dirty === true &&
        typeof v.stoolColor === "string" &&
        v.stoolColor !== ""
          ? { stoolColor: v.stoolColor }
          : {}),
      };
    case "medicine":
      return {
        name: typeof v.name === "string" ? v.name.trim() : "",
        amount: toNumber(v.amount),
        unit: v.unit,
        antipyretic: v.antipyretic === true,
      };
    case "temperature":
      return { celsius: toNumber(v.celsius), method: v.method };
    case "solids": {
      const reaction = typeof v.reaction === "string" ? v.reaction.trim() : "";
      return {
        food: typeof v.food === "string" ? v.food.trim() : "",
        amount: v.amount,
        isNew: v.isNew === true,
        ...(reaction === "" ? {} : { reaction }),
      };
    }
    case "water":
      return { ml: toNumber(v.ml) };
    case "note":
      return { text: typeof v.text === "string" ? v.text.trim() : "" };
  }
}

export function buildDetails(
  type: InstantType,
  values: QuickValues,
):
  | { ok: true; details: Record<string, unknown> }
  | { ok: false; message: string } {
  if (type === "bath") return { ok: true, details: {} };
  const result = detailsSchemas[type].safeParse(rawDetails(type, values));
  return result.success
    ? { ok: true, details: result.data as Record<string, unknown> }
    : { ok: false, message: MESSAGES[type] };
}

const byNewest = (logs: LogLike[]) =>
  [...logs].sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));

// Spec §2.3: up to 3 different ml amounts from bottle logs, newest first.
export function recentBottleAmounts(logs: LogLike[]): number[] {
  const amounts: number[] = [];
  for (const log of byNewest(logs)) {
    if (log.type !== "bottle") continue;
    const parsed = detailsSchemas.bottle.safeParse(log.details);
    if (!parsed.success || amounts.includes(parsed.data.ml)) continue;
    amounts.push(parsed.data.ml);
    if (amounts.length === 3) break;
  }
  return amounts;
}

// Spec §4.1: the quick chips, always shown, in this order.
export const MEDICINE_PRESETS = ["Vitamin D", "DHA", "Men tiêu hoá"] as const;

const medicineKey = (name: string) => name.trim().toLocaleLowerCase("vi");

// Spec §2.3 (spec gốc) and §4.1: up to 4 different medicine names, case-insensitive,
// latest spelling kept; names in `exclude` (the quick chips) are skipped before counting.
export function recentMedicineNames(
  logs: LogLike[],
  exclude: readonly string[] = [],
): string[] {
  const names: string[] = [];
  const seen = new Set(exclude.map(medicineKey));
  for (const log of byNewest(logs)) {
    if (log.type !== "medicine") continue;
    const parsed = detailsSchemas.medicine.safeParse(log.details);
    if (!parsed.success) continue;
    const name = parsed.data.name.trim();
    const key = medicineKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length === 4) break;
  }
  return names;
}

// Spec 2026-11-17 §3.3: up to 4 different food names from solids logs, same rule as
// recentMedicineNames: case-insensitive, latest spelling kept.
export function recentFoodNames(logs: LogLike[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const log of byNewest(logs)) {
    if (log.type !== "solids") continue;
    const parsed = detailsSchemas.solids.safeParse(log.details);
    if (!parsed.success) continue;
    const name = parsed.data.food.trim();
    const key = medicineKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length === 4) break;
  }
  return names;
}

// Spec §4.1: a chip fills the name plus the dose from the latest log of that medicine.
// Never logged: Vitamin D is 1 giọt; anything else clears the amount and keeps the unit.
export function medicinePrefill(name: string, logs: LogLike[]): QuickValues {
  const key = medicineKey(name);
  for (const log of byNewest(logs)) {
    if (log.type !== "medicine") continue;
    const parsed = detailsSchemas.medicine.safeParse(log.details);
    if (!parsed.success || medicineKey(parsed.data.name) !== key) continue;
    return {
      name,
      amount: String(parsed.data.amount).replace(".", ","),
      unit: parsed.data.unit,
      antipyretic: parsed.data.antipyretic,
    };
  }
  if (key === medicineKey("Vitamin D"))
    return { name: "Vitamin D", amount: "1", unit: "giọt", antipyretic: false };
  return { name, amount: "", antipyretic: false };
}

export type StepRule = { start: number; min: number; decimals: number };
export const ML_STEP: StepRule = { start: 0, min: 0, decimals: 0 };
export const TEMP_STEP: StepRule = { start: 37, min: 0, decimals: 1 };

// Spec 2026-11-19 §5.2: the six preset temperatures, as the text the field shows.
export const TEMP_PRESETS = [
  "36,5",
  "37,0",
  "37,5",
  "38,0",
  "38,5",
  "39,0",
] as const;

// The −/+ buttons next to a number field. An empty or unreadable field starts at `rule.start`.
export function stepAmount(
  value: string,
  delta: number,
  rule: StepRule,
): string {
  const current = toNumber(value);
  const base = Number.isNaN(current) ? rule.start : current;
  const scale = 10 ** rule.decimals;
  const next = Math.max(rule.min, Math.round((base + delta) * scale) / scale);
  return rule.decimals === 0
    ? String(next)
    : next.toFixed(rule.decimals).replace(".", ",");
}

export type DiaperKind = "wet" | "dirty" | "both";

export function diaperKind(values: QuickValues): DiaperKind {
  if (values.dirty === true) return values.wet === true ? "both" : "dirty";
  return "wet";
}

export function withDiaperKind(
  values: QuickValues,
  kind: DiaperKind,
): QuickValues {
  return {
    ...values,
    wet: kind !== "dirty",
    dirty: kind !== "wet",
    stoolColor: kind === "wet" ? "" : (values.stoolColor ?? ""),
  };
}

function optionsOf(type: InstantType, key: string) {
  return QUICK_FIELDS[type].find((field) => field.key === key)?.options ?? [];
}

export const MILK_OPTIONS = optionsOf("bottle", "milk");
export const UNIT_OPTIONS = optionsOf("medicine", "unit");
export const METHOD_OPTIONS = optionsOf("temperature", "method");
export const STOOL_OPTIONS = optionsOf("diaper", "stoolColor") as {
  value: "" | StoolColor;
  label: string;
}[];
export const DIAPER_KIND_OPTIONS: { value: DiaperKind; label: string }[] = [
  { value: "wet", label: "Ướt" },
  { value: "dirty", label: "Bẩn" },
  { value: "both", label: "Cả hai" },
];
