import { describe, expect, it } from "vitest";
import type { ConditionArticle } from "@/lib/content/conditions";
import type {
  FirstAid,
  TriageQuestion,
  TriageSymptom,
} from "@/lib/content/triage";
import {
  effectiveSymptoms,
  firstAidFor,
  pickedSymptomCount,
  suggestConditions,
  toggled,
  triageAnswerCount,
  visibleSymptoms,
} from "./symptoms";

const s = (
  code: string,
  suggests: string[],
  extra: Partial<TriageSymptom> = {},
): TriageSymptom => ({
  code,
  group: "other",
  short: code,
  text: `${code} text`,
  suggests,
  ...extra,
});

const a = (
  code: string,
  extra: Partial<ConditionArticle> = {},
): ConditionArticle => ({
  code,
  title: code,
  summary: "s",
  signs: ["x"],
  homeCare: ["x"],
  seeDoctor: ["x"],
  goNow: ["x"],
  usualCourse: "x",
  source: "https://www.nhs.uk/x",
  reviewedAt: "2026-11-17",
  ...extra,
});

const q = (
  code: string,
  extra: Partial<TriageQuestion> = {},
): TriageQuestion => ({
  code,
  group: "other",
  level: "red",
  text: code,
  short: code,
  source: "https://example.org",
  reviewedAt: "2026-11-17",
  ...extra,
});

describe("visibleSymptoms", () => {
  it("applies minAgeDays and maxAgeDays, both bounds inclusive", () => {
    const list = [
      s("any", ["x"]),
      s("teeth", ["x"], { minAgeDays: 90 }),
      s("colic", ["x"], { maxAgeDays: 180 }),
    ];
    const codes = (age: number) =>
      visibleSymptoms(list, age).map((x) => x.code);
    expect(codes(89)).toEqual(["any", "colic"]);
    expect(codes(90)).toEqual(["any", "teeth", "colic"]);
    expect(codes(180)).toEqual(["any", "teeth", "colic"]);
    expect(codes(181)).toEqual(["any", "teeth"]);
  });
});

describe("effectiveSymptoms", () => {
  it("adds fever from 38°C and keeps the rest", () => {
    expect([...effectiveSymptoms(new Set(["cough"]), 38)]).toEqual([
      "cough",
      "fever",
    ]);
    expect([...effectiveSymptoms(new Set(["cough"]), 37.9)]).toEqual(["cough"]);
    expect([...effectiveSymptoms(new Set(), null)]).toEqual([]);
  });
});

describe("suggestConditions (spec 2026-11-17 §5.2)", () => {
  const articles = [a("x"), a("y"), a("baby", { maxAgeDays: 60 }), a("z")];

  it("adds 1/n per symptom and sorts by score", () => {
    const symptoms = [s("both", ["x", "y"]), s("only_y", ["y"])];
    const out = suggestConditions({
      symptoms,
      articles,
      selected: new Set(["both", "only_y"]),
      ageDays: 100,
    });
    expect(out.map((r) => [r.article.code, r.score])).toEqual([
      ["y", 1.5],
      ["x", 0.5],
    ]);
    expect(out[0].matched).toEqual(["both text", "only_y text"]);
  });

  it("keeps article order on equal scores", () => {
    const out = suggestConditions({
      symptoms: [s("to_z", ["z"]), s("to_x", ["x"])],
      articles,
      selected: new Set(["to_z", "to_x"]),
      ageDays: 100,
    });
    expect(out.map((r) => r.article.code)).toEqual(["x", "z"]);
  });

  it("drops articles outside their age and symptoms hidden for this age", () => {
    const symptoms = [
      s("young", ["baby", "x"]),
      s("old", ["z"], { minAgeDays: 400 }),
    ];
    const out = suggestConditions({
      symptoms,
      articles,
      selected: new Set(["young", "old"]),
      ageDays: 61,
    });
    expect(out.map((r) => r.article.code)).toEqual(["x"]);
  });

  it("is empty with nothing selected", () => {
    expect(
      suggestConditions({
        symptoms: [s("a", ["x"])],
        articles,
        selected: new Set(),
        ageDays: 10,
      }),
    ).toEqual([]);
  });
});

describe("firstAidFor (spec 2026-11-17 §5.3)", () => {
  const blocks: FirstAid[] = [
    { code: "seizure", title: "Co giật", when: ["convulsion"], steps: ["a"] },
    {
      code: "fever",
      title: "Sốt",
      when: ["@fever", "infant_hot"],
      steps: ["b"],
    },
  ];
  const questions = [q("convulsion"), q("infant_hot", { maxAgeDays: 90 })];
  const codes = (checked: string[], celsius: number | null, ageDays: number) =>
    firstAidFor({
      blocks,
      checked: new Set(checked),
      celsius,
      ageDays,
      questions,
    }).map((b) => b.code);

  it("matches ticked questions and a fever from 38°C, in block order", () => {
    expect(codes(["convulsion"], 38.4, 200)).toEqual(["seizure", "fever"]);
    expect(codes([], 37.5, 200)).toEqual([]);
    expect(codes(["infant_hot"], null, 30)).toEqual(["fever"]);
  });

  it("ignores a ticked question hidden for this age", () => {
    expect(codes(["infant_hot"], null, 200)).toEqual([]);
  });
});

describe("pickedSymptomCount (spec 2026-11-19 §6)", () => {
  const chips = [s("fever", []), s("cough", []), s("vomit", [])];

  it("counts the picked chips among the given ones", () => {
    expect(pickedSymptomCount(chips, new Set(), false)).toBe(0);
    expect(pickedSymptomCount(chips, new Set(["cough", "vomit"]), false)).toBe(
      2,
    );
    expect(pickedSymptomCount(chips, new Set(["rash"]), false)).toBe(0);
  });

  it("counts the fever chip locked by the temperature once", () => {
    expect(pickedSymptomCount(chips, new Set(), true)).toBe(1);
    expect(pickedSymptomCount(chips, new Set(["fever"]), true)).toBe(1);
    expect(pickedSymptomCount(chips, new Set(["cough"]), true)).toBe(2);
  });

  it("a locked fever does not count where there is no fever chip", () => {
    expect(pickedSymptomCount([s("cough", [])], new Set(), true)).toBe(0);
  });
});

describe("toggled", () => {
  it("adds an item that is missing, removes one that is there, and leaves the input alone", () => {
    const start: ReadonlySet<string> = new Set(["fever"]);
    expect([...toggled(start, "skin")]).toEqual(["fever", "skin"]);
    expect([...toggled(start, "fever")]).toEqual([]);
    expect([...start]).toEqual(["fever"]);
  });
});

describe("triageAnswerCount (spec 2026-11-19 §6)", () => {
  const chips = [s("fever", []), s("cough", [])];
  const questions = [q("convulsion"), q("blue_lips")];
  const count = (
    selected: string[],
    feverLocked: boolean,
    checked: string[],
  ) =>
    triageAnswerCount({
      chips,
      selected: new Set(selected),
      feverLocked,
      questions,
      checked: new Set(checked),
    });

  it("is 0 with nothing picked", () => {
    expect(count([], false, [])).toBe(0);
  });

  it("adds the picked chips, the locked fever chip and the switches on", () => {
    expect(count(["cough"], false, [])).toBe(1);
    expect(count([], true, [])).toBe(1);
    expect(count([], false, ["convulsion", "blue_lips"])).toBe(2);
    expect(count(["cough"], true, ["convulsion"])).toBe(3);
  });

  it("ignores codes that are not among the chips or questions shown", () => {
    expect(count(["rash"], false, ["infant_hot"])).toBe(0);
  });
});
