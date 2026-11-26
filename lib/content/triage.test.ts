import { describe, expect, it } from "vitest";
import { CONDITIONS } from "./conditions";
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

  it("spec 2026-11-26 §3.2: every symptom has its own short name; eight are common", () => {
    expect(
      Object.fromEntries(TRIAGE.symptoms.map((s) => [s.code, s.short])),
    ).toEqual({
      fever: "Sốt",
      runny_nose: "Sổ mũi",
      cough: "Ho",
      barking_cough: "Ho ông ổng",
      wheeze: "Khò khè",
      spit_up: "Trớ sữa",
      vomit: "Nôn",
      diarrhoea: "Tiêu chảy",
      hard_stool: "Phân cứng",
      gassy: "Đầy hơi",
      diaper_rash: "Đỏ vùng tã",
      dry_red_skin: "Da khô đỏ",
      heat_rash: "Nốt đỏ li ti",
      rash_after_fever: "Ban sau sốt",
      hand_foot_spots: "Nốt ở tay chân",
      yellow_skin: "Vàng da",
      white_mouth: "Mảng trắng miệng",
      mouth_sores: "Loét miệng",
      ear_rub: "Dụi tai",
      sticky_eye: "Mắt đỏ, ghèn",
      drooling: "Chảy dãi",
      long_crying: "Khóc nhiều",
      fussy: "Quấy",
    });
    const shorts = TRIAGE.symptoms.map((s) => s.short);
    expect(new Set(shorts).size).toBe(23);
    for (const short of shorts)
      expect(Array.from(short).length, short).toBeLessThanOrEqual(16);
    expect(
      TRIAGE.symptoms.filter((s) => s.common === true).map((s) => s.code),
    ).toEqual([
      "fever",
      "runny_nose",
      "cough",
      "wheeze",
      "spit_up",
      "vomit",
      "diarrhoea",
      "fussy",
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

  it("every symptom has a unique code, a known group and suggests existing articles", () => {
    const groups = new Set(TRIAGE.groups.map((g) => g.code));
    const articles = new Set(CONDITIONS.articles.map((a) => a.code));
    const codes = TRIAGE.symptoms.map((s) => s.code);
    expect(codes).toHaveLength(23);
    expect(new Set(codes).size).toBe(codes.length);
    for (const s of TRIAGE.symptoms) {
      expect(groups.has(s.group), s.code).toBe(true);
      expect(s.suggests.length, s.code).toBeGreaterThan(0);
      for (const code of s.suggests)
        expect(articles.has(code), `${s.code} → ${code}`).toBe(true);
    }
    expect(TRIAGE.symptomsSource).toBe("https://www.nhs.uk/conditions/");
  });

  it("first aid fires only on real question codes or @fever", () => {
    const questions = new Set(TRIAGE.questions.map((q) => q.code));
    expect(TRIAGE.firstAid.map((b) => b.code)).toEqual([
      "seizure",
      "breathing",
      "fluids",
      "fever",
    ]);
    for (const block of TRIAGE.firstAid)
      for (const when of block.when)
        expect(
          when === "@fever" || questions.has(when),
          `${block.code}: ${when}`,
        ).toBe(true);
    expect(TRIAGE.whileGoing).toHaveLength(3);
  });
});
