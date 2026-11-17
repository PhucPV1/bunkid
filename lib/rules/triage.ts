import type { TriageQuestion } from "@/lib/content/triage";

export type TriageLevel = "red" | "yellow" | "green";

export const RESULT_TITLE: Record<TriageLevel, string> = {
  red: "Đi cấp cứu ngay",
  yellow: "Cho bé đi khám trong 24 giờ",
  green: "Theo dõi tại nhà",
};

// Spec §6.6: ≥ 60 breaths/min under 60 days, ≥ 50 from 60 to 364 days, ≥ 40 from 365 days.
export function fastBreathingRate(ageDays: number): number {
  if (ageDays < 60) return 60;
  if (ageDays < 365) return 50;
  return 40;
}

export function questionText(
  question: TriageQuestion,
  ageDays: number,
): string {
  return question.text.replace(
    "{fastBreathing}",
    String(fastBreathingRate(ageDays)),
  );
}

export function visibleQuestions(
  questions: TriageQuestion[],
  ageDays: number,
): TriageQuestion[] {
  return questions.filter(
    (q) =>
      (q.minAgeDays === undefined || ageDays >= q.minAgeDays) &&
      (q.maxAgeDays === undefined || ageDays <= q.maxAgeDays),
  );
}

export type Finding = { level: "red" | "yellow"; text: string };

// Spec 2026-11-17 §5.1, first match wins. From 6 months, 38–39.9°C alone is not a
// finding (NHS fever in children); it only turns on the "Sốt" symptom.
export function temperatureFindings(
  celsius: number | null,
  ageDays: number,
): Finding[] {
  if (celsius === null) return [];
  if (celsius < 35.5) return [{ level: "red", text: "Thân nhiệt dưới 35,5°C" }];
  if (celsius >= 40) return [{ level: "red", text: "Sốt từ 40°C trở lên" }];
  if (celsius >= 38 && ageDays < 91)
    return [{ level: "red", text: "Bé dưới 3 tháng sốt từ 38°C trở lên" }];
  if (celsius >= 39 && ageDays < 183)
    return [{ level: "red", text: "Bé 3–6 tháng sốt từ 39°C trở lên" }];
  if (celsius >= 38 && ageDays < 183)
    return [{ level: "yellow", text: "Bé 3–6 tháng đang sốt từ 38°C trở lên" }];
  return [];
}

export function hasFever(celsius: number | null): boolean {
  return celsius !== null && celsius >= 38;
}

export type TriageResult = {
  level: TriageLevel;
  // Red findings first, then yellow, in question order.
  findings: Finding[];
};

export function evaluateTriage(input: {
  questions: TriageQuestion[];
  checked: Set<string>;
  celsius: number | null;
  ageDays: number;
}): TriageResult {
  const { questions, checked, celsius, ageDays } = input;
  const answered: Finding[] = visibleQuestions(questions, ageDays)
    .filter((q) => checked.has(q.code))
    .map((q) => ({ level: q.level, text: questionText(q, ageDays) }));
  const all = [...temperatureFindings(celsius, ageDays), ...answered];
  const findings = [
    ...all.filter((f) => f.level === "red"),
    ...all.filter((f) => f.level === "yellow"),
  ];
  const level: TriageLevel = findings.some((f) => f.level === "red")
    ? "red"
    : findings.length > 0
      ? "yellow"
      : "green";
  return { level, findings };
}

// "Đi khám ngay nếu xuất hiện: …" on the green result.
export function goNowIf(questions: TriageQuestion[], ageDays: number): string {
  const fever =
    ageDays < 91
      ? "sốt từ 38°C"
      : ageDays < 183
        ? "sốt từ 39°C"
        : "sốt từ 40°C";
  const signs = visibleQuestions(questions, ageDays)
    .filter((q) => q.level === "red")
    .map((q) => q.short);
  return `Đi khám ngay nếu xuất hiện: ${[fever, "thân nhiệt dưới 35,5°C", ...signs].join(", ")}.`;
}

// Step 1: the latest temperature logged in the last 6 hours, if any.
export function recentCelsius(
  logs: { type: string; started_at: string; details: unknown }[],
  now: Date,
): number | null {
  const since = now.getTime() - 6 * 3_600_000;
  const latest = logs
    .filter((log) => log.type === "temperature")
    .filter((log) => {
      const at = Date.parse(log.started_at);
      return at >= since && at <= now.getTime();
    })
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))[0];
  const celsius = (latest?.details as { celsius?: unknown } | undefined)
    ?.celsius;
  return typeof celsius === "number" ? celsius : null;
}

export function parseCelsius(raw: string): number | null | "bad" {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  const n = Number(text);
  if (!/^\d+(\.\d+)?$/.test(text) || n < 30 || n > 43) return "bad";
  return n;
}
