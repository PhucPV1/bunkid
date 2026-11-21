import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { CONDITIONS } from "@/lib/content/conditions";
import { TRIAGE } from "@/lib/content/triage";
import {
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import { visibleSymptoms } from "@/lib/rules/symptoms";
import { ageDays } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import { SymptomChips } from "./SymptomChips";
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
    const age = ageDays(baby.dob, new Date());
    const chips = visibleSymptoms(TRIAGE.symptoms, age);
    // Spec 2026-11-19 §6: every chip group starts closed.
    const groups = new Set(chips.map((chip) => chip.group));
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(groups.size);
    expect(html).not.toContain('aria-expanded="true"');
    expect(html).not.toContain("aria-pressed=");
    expect(html).toContain(">Mở nhóm rồi chạm để chọn, chọn được nhiều.</p>");
    expect(html).not.toContain("Chạm để chọn, chọn được nhiều.");
    expect(html).toContain(">Bé đang có gì?</h2>");
    expect(html).toContain(">Có dấu hiệu nào dưới đây?</h2>");
    expect(html.indexOf("Bé đang có gì?")).toBeLessThan(
      html.indexOf("Có dấu hiệu nào dưới đây?"),
    );
    expect(html).not.toContain("Đánh dấu những gì bé đang có:");
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

// Spec 2026-11-19 §6: one glass list of groups that open and close.
describe("SymptomChips", () => {
  const symptoms = TRIAGE.symptoms.filter((s) =>
    ["fever", "cough", "diaper_rash"].includes(s.code),
  );
  const chips = ({
    selected = [] as string[],
    open = [] as string[],
    feverLocked = false,
  }) =>
    renderToStaticMarkup(
      <SymptomChips
        groups={TRIAGE.groups}
        symptoms={symptoms}
        selected={new Set(selected)}
        feverLocked={feverLocked}
        openGroups={new Set(open)}
        onToggle={() => {}}
        onToggleGroup={() => {}}
      />,
    );
  // The markup of one group's header button, found by its name.
  function header(html: string, name: string): string {
    const buttons = html.match(/<button[^>]*aria-expanded.*?<\/button>/g);
    return buttons?.find((button) => button.includes(`>${name}<`)) ?? "";
  }

  it("closed groups: one glass list, a 52 px header per group and no chips", () => {
    const html = chips({});
    expect(html).toMatch(
      /^<ul class="glass overflow-hidden rounded-\[22px\]">/,
    );
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(3);
    expect(html).not.toContain('aria-expanded="true"');
    expect(html).not.toContain("aria-pressed");
    expect(html).not.toContain('role="group"');
    expect(html).not.toContain("đã chọn");
    const resp = header(html, "Hô hấp");
    expect(resp).toContain("min-h-[52px]");
    expect(resp).toMatch(/text-base[^>]*>Hô hấp</);
    expect(resp).toContain('d="m6 9 6 6 6-6"');
  });

  it("a closed group with picked chips shows how many in the badge", () => {
    const html = chips({ selected: ["cough"] });
    const resp = header(html, "Hô hấp");
    expect(resp).toMatch(
      /class="[^"]*\bbg-accent-tint\b[^"]*\btext-accent-text\b[^"]*">1 đã chọn<\/span>/,
    );
    expect(resp).toMatch(/text-xs[^"]*font-bold[^>]*>1 đã chọn</);
    expect(header(html, "Da")).not.toContain("đã chọn");
    expect(html).not.toContain("aria-pressed");
  });

  it("an open group draws its chips with the classes they had", () => {
    const html = chips({ selected: ["cough"], open: ["breathing"] });
    const resp = header(html, "Hô hấp");
    expect(resp).toContain('aria-expanded="true"');
    expect(resp).toContain('d="m6 15 6-6 6 6"');
    expect(header(html, "Da")).toContain('aria-expanded="false"');
    expect(html.match(/role="group"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Hô hấp"');
    expect(html).toContain("flex flex-wrap gap-2");
    expect(html).toMatch(/aria-pressed="true"[^>]*>✓ Ho<\/button>/);
    expect(html).toMatch(/class="[^"]*\bbg-ink\b[^"]*\btext-bg\b[^"]*">✓ Ho</);
    expect(html).toContain("min-h-11");
    expect(html).not.toContain(">Sốt hoặc sờ thấy nóng</button>");
  });

  it("several groups can be open at once", () => {
    const html = chips({ open: ["fever", "breathing", "skin"] });
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(3);
    expect(html.match(/role="group"/g)).toHaveLength(3);
    expect(html).toMatch(
      /aria-pressed="false"[^>]*glass[^>]*>Sốt hoặc sờ thấy nóng<\/button>/,
    );
    expect(html).not.toContain("Bật theo nhiệt độ đã nhập.");
  });

  it("a header sits in a heading and names the chips it opens", () => {
    const closed = chips({});
    expect(
      closed.match(/<h3><button type="button" aria-expanded="false"/g),
    ).toHaveLength(3);
    expect(closed).not.toContain("aria-controls");
    const open = chips({ open: ["breathing"] });
    expect(open).toContain(
      '<h3><button type="button" aria-expanded="true" aria-controls="symptom-group-breathing"',
    );
    expect(open).toContain('<div id="symptom-group-breathing"');
    expect(open.match(/aria-controls=/g)).toHaveLength(1);
  });

  it("tapping a header asks to toggle that group and nothing else", () => {
    const onToggle = vi.fn();
    const onToggleGroup = vi.fn();
    const headers = findElements(
      SymptomChips({
        groups: TRIAGE.groups,
        symptoms,
        selected: new Set(),
        feverLocked: false,
        openGroups: new Set(),
        onToggle,
        onToggleGroup,
      }),
      (el) => el.type === "button" && "aria-expanded" in el.props,
    );
    const shown = TRIAGE.groups.filter((group) =>
      symptoms.some((symptom) => symptom.group === group.code),
    );
    expect(headers).toHaveLength(shown.length);
    (headers[1].props.onClick as () => void)();
    expect(onToggleGroup).toHaveBeenCalledExactlyOnceWith(shown[1].code);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("the fever chip locked by the temperature counts, open or closed", () => {
    const closed = chips({ feverLocked: true });
    expect(header(closed, "Sốt")).toContain(">1 đã chọn</span>");
    expect(closed).not.toContain("Bật theo nhiệt độ đã nhập.");
    const open = chips({ feverLocked: true, open: ["fever"] });
    expect(open).toMatch(
      /aria-pressed="true" aria-disabled="true"[^>]*>✓ Sốt hoặc sờ thấy nóng<\/button>/,
    );
    expect(open).toContain(">Bật theo nhiệt độ đã nhập.</p>");
  });
});
