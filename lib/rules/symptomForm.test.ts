import { describe, expect, it } from "vitest";
import { TRIAGE, type TriageSymptom } from "@/lib/content/triage";
import {
  joinCodes,
  parseCodes,
  pickerLayout,
  symptomShorts,
  toggleCode,
} from "./symptomForm";

const s = (
  code: string,
  group: string,
  extra: Partial<TriageSymptom> = {},
): TriageSymptom => ({
  code,
  group,
  short: code.toUpperCase(),
  text: `${code} text`,
  suggests: ["x"],
  ...extra,
});

const symptoms = [
  s("fever", "fever", { common: true }),
  s("cough", "breathing", { common: true }),
  s("wheeze", "breathing"),
  s("vomit", "digestion"),
  s("teeth", "other", { minAgeDays: 90 }),
  s("colic", "other", { maxAgeDays: 180 }),
];
const groups = [
  { code: "fever", name: "Sốt" },
  { code: "breathing", name: "Hô hấp" },
  { code: "digestion", name: "Tiêu hóa" },
  { code: "other", name: "Khác" },
];
const codesOf = (chips: TriageSymptom[]) => chips.map((chip) => chip.code);

describe("codes as one form value (spec 2026-11-26 §3.4)", () => {
  it("parseCodes splits on commas and drops empty parts", () => {
    expect(parseCodes("cough,vomit")).toEqual(["cough", "vomit"]);
    expect(parseCodes("cough")).toEqual(["cough"]);
    expect(parseCodes("")).toEqual([]);
    expect(parseCodes(",cough,,")).toEqual(["cough"]);
    expect(parseCodes(undefined)).toEqual([]);
    expect(parseCodes(true)).toEqual([]);
  });

  it("joinCodes: known codes in the content's order, unknown ones after, each once", () => {
    expect(joinCodes(["vomit", "fever"], symptoms)).toBe("fever,vomit");
    expect(joinCodes(["gone", "cough", "old"], symptoms)).toBe(
      "cough,gone,old",
    );
    expect(joinCodes(["cough", "cough", "gone", "gone"], symptoms)).toBe(
      "cough,gone",
    );
    expect(joinCodes([], symptoms)).toBe("");
  });

  it("toggleCode adds a code that is off and removes one that is on", () => {
    expect(toggleCode("", "vomit", symptoms)).toBe("vomit");
    expect(toggleCode("vomit", "fever", symptoms)).toBe("fever,vomit");
    expect(toggleCode("fever,vomit", "fever", symptoms)).toBe("vomit");
    expect(toggleCode("vomit", "vomit", symptoms)).toBe("");
  });

  it("toggleCode keeps a saved code the content no longer has", () => {
    expect(toggleCode("gone,vomit", "cough", symptoms)).toBe(
      "cough,vomit,gone",
    );
    expect(toggleCode("cough,gone", "cough", symptoms)).toBe("gone");
  });

  it("symptomShorts: short names in the content's order, unknown codes skipped", () => {
    expect(symptomShorts(["vomit", "gone", "fever"], symptoms)).toEqual([
      "FEVER",
      "VOMIT",
    ]);
    expect(symptomShorts(["gone"], symptoms)).toEqual([]);
  });
});

describe("pickerLayout (spec 2026-11-26 §3.5)", () => {
  const layout = (ageDays: number | null, selected: string[] = []) =>
    pickerLayout({ symptoms, groups, ageDays, selected });

  it("common chips first, the rest by group in the content's group order", () => {
    const view = layout(100);
    expect(codesOf(view.common)).toEqual(["fever", "cough"]);
    expect(view.picked).toEqual([]);
    expect(view.groups.map((g) => [g.name, codesOf(g.chips)])).toEqual([
      ["Hô hấp", ["wheeze"]],
      ["Tiêu hóa", ["vomit"]],
      ["Khác", ["teeth", "colic"]],
    ]);
    expect(view.total).toBe(6);
  });

  it("filters by the baby's age; no age given means no filter", () => {
    expect(codesOf(layout(76).groups[2].chips)).toEqual(["colic"]);
    expect(layout(76).total).toBe(5);
    expect(codesOf(layout(200).groups[2].chips)).toEqual(["teeth"]);
    expect(layout(null).total).toBe(6);
  });

  it("a picked chip that is not common is listed for the collapsed row", () => {
    const view = layout(100, ["vomit", "fever"]);
    expect(codesOf(view.picked)).toEqual(["vomit"]);
    expect(codesOf(view.common)).toEqual(["fever", "cough"]);
    expect(codesOf(view.groups[1].chips)).toEqual(["vomit"]);
  });

  it("a picked chip outside the baby's age still shows; an unknown code never does", () => {
    const view = layout(76, ["teeth", "gone"]);
    expect(codesOf(view.picked)).toEqual(["teeth"]);
    expect(codesOf(view.groups[2].chips)).toEqual(["teeth", "colic"]);
    expect(view.total).toBe(6);
  });

  it("a group with no chip left is not drawn", () => {
    const view = pickerLayout({
      symptoms: symptoms.slice(0, 3),
      groups,
      ageDays: null,
      selected: [],
    });
    expect(view.groups.map((g) => g.name)).toEqual(["Hô hấp"]);
  });

  it("the real content at 76 days: 8 common chips, 22 in all, every chip in a known group", () => {
    const view = pickerLayout({
      symptoms: TRIAGE.symptoms,
      groups: TRIAGE.groups,
      ageDays: 76,
      selected: [],
    });
    expect(view.common.map((chip) => chip.short)).toEqual([
      "Sốt",
      "Sổ mũi",
      "Ho",
      "Khò khè",
      "Trớ sữa",
      "Nôn",
      "Tiêu chảy",
      "Quấy",
    ]);
    expect(view.total).toBe(22);
    expect(view.groups.map((g) => g.name)).toEqual([
      "Hô hấp",
      "Tiêu hóa",
      "Da",
      "Hành vi, ăn bú",
      "Khác",
    ]);
    expect(
      view.common.length + view.groups.flatMap((g) => g.chips).length,
    ).toBe(22);
  });
});
