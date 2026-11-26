import type { TriageSymptom } from "@/lib/content/triage";
import { visibleSymptoms } from "./symptoms";

type Group = { code: string; name: string };

// Spec 2026-11-26 §3.4: a form value is a string or a boolean, so the picked
// codes travel as one comma-joined string. "" means nothing picked.
export function parseCodes(value: string | boolean | undefined): string[] {
  return typeof value === "string" ? value.split(",").filter(Boolean) : [];
}

// Known codes in the content's order, then codes the content no longer has
// (they stay in the log when it is saved again), each code once.
export function joinCodes(
  codes: readonly string[],
  symptoms: readonly TriageSymptom[],
): string {
  const picked = new Set(codes);
  const known = symptoms
    .filter((symptom) => picked.has(symptom.code))
    .map((symptom) => symptom.code);
  const unknown = [...picked].filter((code) => !known.includes(code));
  return [...known, ...unknown].join(",");
}

export function toggleCode(
  value: string,
  code: string,
  symptoms: readonly TriageSymptom[],
): string {
  const codes = parseCodes(value);
  return joinCodes(
    codes.includes(code)
      ? codes.filter((other) => other !== code)
      : [...codes, code],
    symptoms,
  );
}

// Spec 2026-11-26 §3.3: the short names of a log's codes, in the content's order.
export function symptomShorts(
  codes: readonly string[],
  symptoms: readonly TriageSymptom[],
): string[] {
  return symptoms
    .filter((symptom) => codes.includes(symptom.code))
    .map((symptom) => symptom.short);
}

export type PickerLayout = {
  // The first row, always drawn.
  common: TriageSymptom[];
  // Picked chips that are not common: drawn after `common` while collapsed.
  picked: TriageSymptom[];
  // Every chip that is not common, by group: drawn when expanded.
  groups: { code: string; name: string; chips: TriageSymptom[] }[];
  // How many chips there are in all, for "Xem tất cả {n} triệu chứng".
  total: number;
};

// Spec 2026-11-26 §3.5. `ageDays` null means no age filter. A picked chip
// outside the baby's age still shows, so it can be seen and switched off.
export function pickerLayout(input: {
  symptoms: TriageSymptom[];
  groups: Group[];
  ageDays: number | null;
  selected: readonly string[];
}): PickerLayout {
  const { symptoms, groups, ageDays, selected } = input;
  const inAge = new Set(
    (ageDays === null ? symptoms : visibleSymptoms(symptoms, ageDays)).map(
      (symptom) => symptom.code,
    ),
  );
  const shown = symptoms.filter(
    (symptom) => inAge.has(symptom.code) || selected.includes(symptom.code),
  );
  const rest = shown.filter((symptom) => symptom.common !== true);
  return {
    common: shown.filter((symptom) => symptom.common === true),
    picked: rest.filter((symptom) => selected.includes(symptom.code)),
    groups: groups
      .map((group) => ({
        ...group,
        chips: rest.filter((symptom) => symptom.group === group.code),
      }))
      .filter((group) => group.chips.length > 0),
    total: shown.length,
  };
}
