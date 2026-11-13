import { detailsSchemas } from "./logDetails";

export type InstantType = "bottle" | "diaper" | "medicine" | "temperature";
export type QuickValues = Record<string, string | boolean>;
export type QuickField = {
  key: string;
  label: string;
  kind: "number" | "text" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  showIf?: (values: QuickValues) => boolean;
};

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
      options: ["ml", "mg", "giọt", "viên"].map((u) => ({
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
};

const DEFAULTS: Record<InstantType, QuickValues> = {
  bottle: { ml: "", milk: "breast_milk" },
  diaper: { wet: true, dirty: false, stoolColor: "" },
  medicine: { name: "", amount: "", unit: "ml", antipyretic: false },
  temperature: { celsius: "", method: "nach" },
};

const MESSAGES: Record<InstantType, string> = {
  bottle: "Nhập số ml từ 1 đến 400",
  diaper: "Chọn ít nhất ướt hoặc bẩn",
  medicine: "Nhập tên thuốc và lượng dùng",
  temperature: "Nhập nhiệt độ từ 34 đến 43°C",
};

export function defaultQuickValues(type: InstantType): QuickValues {
  return { ...DEFAULTS[type] };
}

function toNumber(value: string | boolean | undefined): number {
  if (typeof value !== "string" || value.trim() === "") return Number.NaN;
  return Number(value.trim().replace(",", "."));
}

function rawDetails(
  type: InstantType,
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
  }
}

export function buildDetails(
  type: InstantType,
  values: QuickValues,
):
  | { ok: true; details: Record<string, unknown> }
  | { ok: false; message: string } {
  const result = detailsSchemas[type].safeParse(rawDetails(type, values));
  return result.success
    ? { ok: true, details: result.data as Record<string, unknown> }
    : { ok: false, message: MESSAGES[type] };
}
