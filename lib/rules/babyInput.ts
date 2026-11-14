import { ageDays } from "./time";

export type BabyFormRaw = {
  name: string;
  dob: string;
  sex: string;
  birthWeightG: string;
  birthLengthCm: string;
  birthHeadCm: string;
};

export type BabyInput = {
  name: string;
  dob: string;
  sex: "male" | "female";
  birth_weight_g: number | null;
  birth_length_cm: number | null;
  birth_head_cm: number | null;
};

export type BabyFormResult =
  | { ok: true; value: BabyInput }
  | { ok: false; errors: Partial<Record<keyof BabyFormRaw, string>> };

const MAX_AGE_DAYS = 1856;

function optionalNumber(
  raw: string,
  min: number,
  max: number,
  integer: boolean,
): number | null | "invalid" {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < min || value > max) return "invalid";
  if (integer && !Number.isInteger(value)) return "invalid";
  return integer ? value : Math.round(value * 10) / 10;
}

function isRealDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const ms = Date.parse(`${text}T00:00:00Z`);
  return (
    Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === text
  );
}

export function parseBabyForm(raw: BabyFormRaw, now: Date): BabyFormResult {
  const errors: Partial<Record<keyof BabyFormRaw, string>> = {};

  const name = raw.name.trim();
  if (name.length < 1 || name.length > 60)
    errors.name = "Nhập tên bé (tối đa 60 ký tự)";

  if (!isRealDate(raw.dob)) errors.dob = "Ngày sinh không hợp lệ";
  else if (ageDays(raw.dob, now) < 0)
    errors.dob = "Ngày sinh không được ở tương lai";
  else if (ageDays(raw.dob, now) > MAX_AGE_DAYS)
    errors.dob = "Ngày sinh quá xa (tối đa 5 tuổi)";

  if (raw.sex !== "male" && raw.sex !== "female") errors.sex = "Chọn giới tính";

  const weight = optionalNumber(raw.birthWeightG, 300, 7000, true);
  if (weight === "invalid")
    errors.birthWeightG = "Cân nặng lúc sinh từ 300 đến 7000 g";
  const length = optionalNumber(raw.birthLengthCm, 20, 70, false);
  if (length === "invalid")
    errors.birthLengthCm = "Chiều dài lúc sinh từ 20 đến 70 cm";
  const head = optionalNumber(raw.birthHeadCm, 15, 50, false);
  if (head === "invalid")
    errors.birthHeadCm = "Vòng đầu lúc sinh từ 15 đến 50 cm";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      dob: raw.dob,
      sex: raw.sex as "male" | "female",
      birth_weight_g: weight as number | null,
      birth_length_cm: length as number | null,
      birth_head_cm: head as number | null,
    },
  };
}

const text = (n: number | null) => (n === null ? "" : String(n));

export function babyToRaw(baby: {
  name: string;
  dob: string;
  sex: string;
  birth_weight_g: number | null;
  birth_length_cm: number | null;
  birth_head_cm: number | null;
}): BabyFormRaw {
  return {
    name: baby.name,
    dob: baby.dob,
    sex: baby.sex,
    birthWeightG: text(baby.birth_weight_g),
    birthLengthCm: text(baby.birth_length_cm),
    birthHeadCm: text(baby.birth_head_cm),
  };
}
