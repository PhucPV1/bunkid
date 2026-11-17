import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONDITIONS } from "@/lib/content/conditions";
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

  it("red: first aid blocks, then the way there, then the possible conditions", () => {
    const result = {
      level: "red",
      findings: [{ level: "red", text: "Bé co giật" }],
    } as unknown as Result;
    const seizure = TRIAGE.firstAid.find((b) => b.code === "seizure");
    const sot = CONDITIONS.articles.find((a) => a.code === "sot");
    if (!seizure || !sot) throw new Error("content");
    const html = renderToStaticMarkup(
      <TriageResult
        result={result}
        ageDays={200}
        contacts={[]}
        onRestart={() => {}}
        firstAid={[seizure]}
        suggestions={[
          { article: sot, matched: ["Sốt hoặc sờ thấy nóng"], score: 1 },
        ]}
      />,
    );
    const aid = html.indexOf(`>${seizure.title}</h2>`);
    const way = html.indexOf(">Trên đường đi</h2>");
    const tabs = html.indexOf('role="tablist"');
    expect(aid).toBeGreaterThan(-1);
    expect(way).toBeGreaterThan(aid);
    expect(tabs).toBeGreaterThan(way);
    expect(html).toContain("border-2");
    expect(html).toContain("border-danger-solid");
    expect(html).toContain(`<li>${seizure.steps[0]}</li>`);
    expect(html).toContain(`<li>${TRIAGE.whileGoing[0]}</li>`);
    expect(html).not.toContain("Chăm bé tại nhà");
  });

  it("yellow without first aid: Trong lúc chờ đi khám uses the general home care", () => {
    const result = { level: "yellow", findings: [] } as unknown as Result;
    const html = renderToStaticMarkup(
      <TriageResult
        result={result}
        ageDays={200}
        contacts={[]}
        onRestart={() => {}}
      />,
    );
    expect(html).toContain(">Trong lúc chờ đi khám</h2>");
    expect(html).toContain(`<li>${TRIAGE.homeCare[0]}</li>`);
  });

  it("green: Làm ngay tại nhà with the fever block; Chăm bé tại nhà only without suggestions", () => {
    const result = { level: "green", findings: [] } as unknown as Result;
    const fever = TRIAGE.firstAid.find((b) => b.code === "fever");
    const sot = CONDITIONS.articles.find((a) => a.code === "sot");
    if (!fever || !sot) throw new Error("content");
    const withData = renderToStaticMarkup(
      <TriageResult
        result={result}
        ageDays={200}
        contacts={[]}
        onRestart={() => {}}
        firstAid={[fever]}
        suggestions={[
          { article: sot, matched: ["Sốt hoặc sờ thấy nóng"], score: 1 },
        ]}
      />,
    );
    expect(withData).toContain(">Làm ngay tại nhà</h2>");
    expect(withData).toContain(`>${fever.title}</h3>`);
    expect(withData).not.toContain("Chăm bé tại nhà");
    const bare = renderToStaticMarkup(
      <TriageResult
        result={result}
        ageDays={200}
        contacts={[]}
        onRestart={() => {}}
      />,
    );
    expect(bare).toContain(">Chăm bé tại nhà</h2>");
    expect(bare).not.toContain("Làm ngay tại nhà");
    expect(bare).not.toContain('role="tablist"');
  });
});
