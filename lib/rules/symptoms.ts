import type { ConditionArticle } from "@/lib/content/conditions";
import type {
  FirstAid,
  TriageQuestion,
  TriageSymptom,
} from "@/lib/content/triage";
import { hasFever, visibleQuestions } from "./triage";

export const FEVER_SYMPTOM = "fever";
export const FEVER_TOKEN = "@fever";

// Scores closer than this are equal, so 1/n sums that differ only by float error tie.
const EPSILON = 1e-9;

export type Suggestion = {
  article: ConditionArticle;
  // Texts of the selected symptoms that pointed here, in symptom order.
  matched: string[];
  score: number;
};

function inAge(
  item: { minAgeDays?: number; maxAgeDays?: number },
  ageDays: number,
): boolean {
  return (
    (item.minAgeDays === undefined || ageDays >= item.minAgeDays) &&
    (item.maxAgeDays === undefined || ageDays <= item.maxAgeDays)
  );
}

export function visibleSymptoms(
  symptoms: TriageSymptom[],
  ageDays: number,
): TriageSymptom[] {
  return symptoms.filter((symptom) => inAge(symptom, ageDays));
}

// The chips the parent picked, plus "fever" when the temperature is from 38°C.
export function effectiveSymptoms(
  selected: ReadonlySet<string>,
  celsius: number | null,
): Set<string> {
  const out = new Set(selected);
  if (hasFever(celsius)) out.add(FEVER_SYMPTOM);
  return out;
}

// Spec 2026-11-19 §6: how many of these chips show as picked, the fever chip
// locked by the temperature included.
export function pickedSymptomCount(
  chips: TriageSymptom[],
  selected: ReadonlySet<string>,
  feverLocked: boolean,
): number {
  return chips.filter(
    (chip) =>
      selected.has(chip.code) || (feverLocked && chip.code === FEVER_SYMPTOM),
  ).length;
}

// Spec 2026-11-19 §6: n on the result bar, the picked chips (the locked fever
// chip included) plus the switches that are on, among those shown.
export function triageAnswerCount(input: {
  chips: TriageSymptom[];
  selected: ReadonlySet<string>;
  feverLocked: boolean;
  questions: TriageQuestion[];
  checked: ReadonlySet<string>;
}): number {
  const { chips, selected, feverLocked, questions, checked } = input;
  return (
    pickedSymptomCount(chips, selected, feverLocked) +
    questions.filter((question) => checked.has(question.code)).length
  );
}

// A copy of the set with the item added, or removed if it was there.
export function toggled<T>(set: ReadonlySet<T>, item: T): Set<T> {
  const next = new Set(set);
  if (!next.delete(item)) next.add(item);
  return next;
}

// Spec 2026-11-17 §5.2: each selected symptom gives 1/n to each of its n articles.
export function suggestConditions(input: {
  symptoms: TriageSymptom[];
  articles: ConditionArticle[];
  selected: ReadonlySet<string>;
  ageDays: number;
}): Suggestion[] {
  const { symptoms, articles, selected, ageDays } = input;
  const totals = new Map<string, { score: number; matched: string[] }>();
  for (const symptom of visibleSymptoms(symptoms, ageDays)) {
    if (!selected.has(symptom.code)) continue;
    const share = 1 / symptom.suggests.length;
    for (const code of symptom.suggests) {
      const entry = totals.get(code) ?? { score: 0, matched: [] };
      entry.score += share;
      entry.matched.push(symptom.text);
      totals.set(code, entry);
    }
  }
  const ranked: { index: number; suggestion: Suggestion }[] = [];
  articles.forEach((article, index) => {
    const entry = totals.get(article.code);
    if (!entry || entry.score <= 0 || !inAge(article, ageDays)) return;
    ranked.push({
      index,
      suggestion: { article, matched: entry.matched, score: entry.score },
    });
  });
  ranked.sort((left, right) => {
    const diff = right.suggestion.score - left.suggestion.score;
    return Math.abs(diff) < EPSILON ? left.index - right.index : diff;
  });
  return ranked.map((item) => item.suggestion);
}

// Spec 2026-11-17 §5.3: blocks whose `when` hits a ticked visible question or @fever.
export function firstAidFor(input: {
  blocks: FirstAid[];
  checked: ReadonlySet<string>;
  celsius: number | null;
  ageDays: number;
  questions: TriageQuestion[];
}): FirstAid[] {
  const { blocks, checked, celsius, ageDays, questions } = input;
  const ticked = new Set(
    visibleQuestions(questions, ageDays)
      .filter((question) => checked.has(question.code))
      .map((question) => question.code),
  );
  const fever = hasFever(celsius);
  return blocks.filter((block) =>
    block.when.some((when) =>
      when === FEVER_TOKEN ? fever : ticked.has(when),
    ),
  );
}
