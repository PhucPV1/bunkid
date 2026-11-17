import { detailsSchemas, isTimerType, type LogType } from "./logDetails";
import {
  buildDetails,
  defaultQuickValues,
  QUICK_FIELDS,
  type QuickField,
  type QuickValues,
} from "./quickEntry";
import { fromVnLocalInput } from "./time";

export const MANUAL_TYPES: { value: LogType; label: string }[] = [
  { value: "breast", label: "Bú mẹ" },
  { value: "bottle", label: "Bú bình" },
  { value: "sleep", label: "Ngủ" },
  { value: "diaper", label: "Tã" },
  { value: "medicine", label: "Thuốc" },
  { value: "temperature", label: "Nhiệt độ" },
  { value: "solids", label: "Ăn dặm" },
  { value: "water", label: "Uống nước" },
  { value: "bath", label: "Tắm" },
  { value: "note", label: "Ghi chú" },
];

// Spec 2026-11-17 §3.3: a note log's text is its "Nội dung" (details.text), so the
// sheet's own "Ghi chú" field (the logs.note column) is not offered for it.
export function hasNoteField(type: LogType): boolean {
  return type !== "note";
}

export const LOG_FIELDS: Record<LogType, QuickField[]> = {
  ...QUICK_FIELDS,
  breast: [
    {
      key: "side",
      label: "Bên",
      kind: "select",
      options: [
        { value: "left", label: "Trái" },
        { value: "right", label: "Phải" },
      ],
    },
  ],
  sleep: [],
  pump: [
    { key: "mlLeft", label: "Số ml bên trái", kind: "number" },
    { key: "mlRight", label: "Số ml bên phải", kind: "number" },
  ],
  tummy: [],
};

export function defaultLogValues(type: LogType): QuickValues {
  if (type === "breast") return { side: "left" };
  if (type === "pump") return { mlLeft: "", mlRight: "" };
  if (type === "sleep" || type === "tummy") return {};
  return defaultQuickValues(type);
}

export function valuesFromDetails(
  type: LogType,
  details: unknown,
): QuickValues {
  const values = defaultLogValues(type);
  const parsed = detailsSchemas[type].safeParse(details);
  if (!parsed.success) return values;
  for (const [key, value] of Object.entries(parsed.data))
    values[key] = typeof value === "number" ? String(value) : value;
  return values;
}

export function buildLogDetails(
  type: LogType,
  values: QuickValues,
):
  | { ok: true; details: Record<string, unknown> }
  | { ok: false; message: string } {
  switch (type) {
    case "breast": {
      const p = detailsSchemas.breast.safeParse({ side: values.side });
      return p.success
        ? { ok: true, details: p.data }
        : { ok: false, message: "Chọn bên bú" };
    }
    case "sleep":
    case "tummy":
      return { ok: true, details: {} };
    case "pump": {
      const raw: Record<string, number> = {};
      for (const key of ["mlLeft", "mlRight"]) {
        const value = values[key];
        if (typeof value === "string" && value.trim() !== "")
          raw[key] = Number(value.trim());
      }
      const p = detailsSchemas.pump.safeParse(raw);
      return p.success
        ? { ok: true, details: p.data }
        : { ok: false, message: "Nhập số ml từ 0 đến 500" };
    }
    default:
      return buildDetails(type, values);
  }
}

export type LogPatch = {
  started_at: string;
  ended_at: string | null;
  details: Record<string, unknown>;
  note: string | null;
};

const FUTURE_SLACK_MS = 60_000;

export function buildLogPatch(input: {
  type: LogType;
  values: QuickValues;
  start: string;
  end: string;
  note: string;
  allowOpenEnd: boolean;
  now: Date;
}): { ok: true; patch: LogPatch } | { ok: false; message: string } {
  const details = buildLogDetails(input.type, input.values);
  if (!details.ok) return details;
  const latest = input.now.getTime() + FUTURE_SLACK_MS;
  const start = fromVnLocalInput(input.start);
  if (Number.isNaN(start.getTime()))
    return { ok: false, message: "Nhập giờ bắt đầu" };
  if (start.getTime() > latest)
    return { ok: false, message: "Giờ bắt đầu không được ở tương lai" };
  let end: Date | null = start;
  if (isTimerType(input.type)) {
    if (input.end === "") {
      if (!input.allowOpenEnd)
        return { ok: false, message: "Nhập giờ kết thúc" };
      end = null;
    } else {
      end = fromVnLocalInput(input.end);
      if (Number.isNaN(end.getTime()))
        return { ok: false, message: "Nhập giờ kết thúc" };
      if (end.getTime() < start.getTime())
        return { ok: false, message: "Giờ kết thúc phải sau giờ bắt đầu" };
      if (end.getTime() > latest)
        return { ok: false, message: "Giờ kết thúc không được ở tương lai" };
    }
  }
  const note = hasNoteField(input.type) ? input.note.trim() : "";
  if (note.length > 500)
    return { ok: false, message: "Ghi chú tối đa 500 ký tự" };
  return {
    ok: true,
    patch: {
      started_at: start.toISOString(),
      ended_at: end === null ? null : end.toISOString(),
      details: details.details,
      note: note === "" ? null : note,
    },
  };
}
