import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TRIAGE } from "@/lib/content/triage";
import {
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import { ageDays } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import { TriageResult } from "./TriageResult";
import { TriageScreen } from "./TriageScreen";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;

describe("TriageScreen", () => {
  it("a glass temperature card, one switch per visible question, a large Xem kết quả and the 115 pill", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <TriageScreen baby={baby} />
      </QueryClientProvider>,
    );
    const visible = visibleQuestions(
      TRIAGE.questions,
      ageDays(baby.dob, new Date()),
    );
    expect(html).toContain('href="/kham-pha"');
    expect(html.match(/role="switch"/g)).toHaveLength(visible.length);
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain('inputMode="decimal"');
    expect(html).toMatch(/min-h-\[50px\][^>]*>Xem kết quả<\/button>/);
    expect(html).toContain("bg-danger-solid");
    expect(html).not.toContain("bg-alarm");
  });
});

describe("TriageResult", () => {
  it("a solid danger card without emoji, the call list and a large Làm lại", () => {
    const result = {
      level: "red",
      findings: [{ text: "Bé khó thở" }],
    } as unknown as Result;
    const html = renderToStaticMarkup(
      <TriageResult
        result={result}
        ageDays={30}
        contacts={[]}
        onRestart={() => {}}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("rounded-[28px] p-4 bg-danger-solid text-on-danger");
    expect(html).not.toMatch(/🔴|🟡|🟢/);
    expect(html).toContain(">Bé khó thở</li>");
    expect(html).toContain('href="tel:115"');
    expect(html).toMatch(/min-h-\[50px\][^>]*>Làm lại<\/button>/);
  });
});
