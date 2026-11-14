import { describe, expect, it } from "vitest";
import { TRIAGE } from "./triage";

describe("content/triage.vi.json (spec §6.6, §10.2)", () => {
  it("every question has a source, a review date, a known group and a unique code", () => {
    const groups = new Set(TRIAGE.groups.map((g) => g.code));
    const codes = TRIAGE.questions.map((q) => q.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const q of TRIAGE.questions) {
      expect(q.source, q.code).toMatch(/^https:\/\//);
      expect(q.reviewedAt, q.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(groups.has(q.group), q.code).toBe(true);
    }
  });

  it("keeps the six groups of spec §6.6 in order", () => {
    expect(TRIAGE.groups.map((g) => g.name)).toEqual([
      "Sốt",
      "Hô hấp",
      "Tiêu hóa",
      "Da",
      "Hành vi, ăn bú",
      "Khác",
    ]);
  });

  it("has a red question for every mandatory danger sign that is not a temperature", () => {
    const red = new Set(
      TRIAGE.questions.filter((q) => q.level === "red").map((q) => q.code),
    );
    for (const code of [
      "poor_feeding",
      "convulsion",
      "lethargic",
      "fast_breathing",
      "chest_indrawing",
      "blue_skin",
      "vomits_everything",
      "bulging_fontanelle",
      "jaundice_palms",
      "pale_stool",
      "bloody_stool",
      "few_wet_diapers",
    ])
      expect(red.has(code), code).toBe(true);
  });

  it("asks the mandatory red signs at every age, except the age-specific ones", () => {
    const limited = TRIAGE.questions
      .filter((q) => q.level === "red")
      .filter((q) => q.minAgeDays !== undefined || q.maxAgeDays !== undefined)
      .map((q) => q.code);
    expect(limited).toEqual([
      "feels_hot_infant",
      "few_wet_diapers",
      "jaundice_first_day",
      "feeding_less_infant",
    ]);
  });

  it("never names a disease as a finding", () => {
    const text = JSON.stringify(TRIAGE).toLowerCase();
    for (const word of [
      "viêm phổi",
      "viêm màng não",
      "nhiễm trùng huyết",
      "sốt xuất huyết",
      "chẩn đoán",
    ])
      expect(text).not.toContain(word);
  });
});
