import { describe, expect, it } from "vitest";
import {
  babyToRaw,
  parseBabyForm,
  type BabyFormRaw,
} from "@/lib/rules/babyInput";

const now = new Date("2026-11-13T05:00:00Z");
const valid: BabyFormRaw = {
  name: " Bông ",
  dob: "2026-09-13",
  sex: "female",
  birthWeightG: "3200",
  birthLengthCm: "49,5",
  birthHeadCm: "",
};

describe("parseBabyForm", () => {
  it("trims, converts numbers (comma decimals) and keeps empty optionals as null", () => {
    expect(parseBabyForm(valid, now)).toEqual({
      ok: true,
      value: {
        name: "Bông",
        dob: "2026-09-13",
        sex: "female",
        birth_weight_g: 3200,
        birth_length_cm: 49.5,
        birth_head_cm: null,
      },
    });
  });

  it("reports every invalid field with a Vietnamese message", () => {
    const result = parseBabyForm(
      {
        name: "",
        dob: "2026-11-14",
        sex: "",
        birthWeightG: "200",
        birthLengthCm: "abc",
        birthHeadCm: "60",
      },
      now,
    );
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Nhập tên bé (tối đa 60 ký tự)",
        dob: "Ngày sinh không được ở tương lai",
        sex: "Chọn giới tính",
        birthWeightG: "Cân nặng lúc sinh từ 300 đến 7000 g",
        birthLengthCm: "Chiều dài lúc sinh từ 20 đến 70 cm",
        birthHeadCm: "Vòng đầu lúc sinh từ 15 đến 50 cm",
      },
    });
  });

  it("rejects malformed dates and dates older than 1856 days", () => {
    expect(parseBabyForm({ ...valid, dob: "13/09/2026" }, now)).toMatchObject({
      ok: false,
      errors: { dob: "Ngày sinh không hợp lệ" },
    });
    expect(parseBabyForm({ ...valid, dob: "2021-10-01" }, now)).toMatchObject({
      ok: false,
      errors: { dob: "Ngày sinh quá xa (tối đa 5 tuổi)" },
    });
  });

  it("accepts a baby born today (VN)", () => {
    expect(parseBabyForm({ ...valid, dob: "2026-11-13" }, now).ok).toBe(true);
  });

  it("babyToRaw fills the form from a saved baby and parses back unchanged", () => {
    const saved = {
      name: "Bông",
      dob: "2026-09-13",
      sex: "female",
      birth_weight_g: 3200,
      birth_length_cm: 49.5,
      birth_head_cm: null,
    };
    const raw = babyToRaw(saved);
    expect(raw).toEqual({
      name: "Bông",
      dob: "2026-09-13",
      sex: "female",
      birthWeightG: "3200",
      birthLengthCm: "49.5",
      birthHeadCm: "",
    });
    expect(parseBabyForm(raw, now)).toEqual({ ok: true, value: saved });
  });
});
