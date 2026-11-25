import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TabBarView } from "@/components/nav/TabBar";
import { findElements } from "@/components/ui/testTree";
import { CONDITIONS } from "@/lib/content/conditions";
import { TRIAGE } from "@/lib/content/triage";
import { logsKey } from "@/lib/data/logs";
import {
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import { visibleSymptoms } from "@/lib/rules/symptoms";
import { ageDays } from "@/lib/rules/time";
import type { Baby, LogRow } from "@/lib/supabase/rows";
import { SymptomChips } from "./SymptomChips";
import { TriageResult } from "./TriageResult";
import { TriageScreen } from "./TriageScreen";

// Spec 2026-11-19 §6: what TriageScreen asks of the chrome and gives the bar.
const state = vi.hoisted(() => ({
  hideChrome: undefined as boolean | undefined,
  bar: null as { count: number; onSubmit: () => void } | null,
  // Makes the temperature field read as invalid.
  badTemperature: false,
  // How many times a result was worked out.
  evaluated: 0,
}));
vi.mock("@/components/actions/ChromeVisibility", () => ({
  useHideChrome: (hide: boolean) => {
    state.hideChrome = hide;
  },
}));
vi.mock("./ResultBar", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ResultBar")>();
  type Props = Parameters<typeof actual.ResultBar>[0];
  return {
    ResultBar: (props: Props) => {
      state.bar = props;
      return actual.ResultBar(props);
    },
  };
});
vi.mock("@/lib/rules/triage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rules/triage")>();
  return {
    ...actual,
    parseCelsius: (raw: string) =>
      state.badTemperature ? "bad" : actual.parseCelsius(raw),
    evaluateTriage: (...args: Parameters<typeof actual.evaluateTriage>) => {
      state.evaluated += 1;
      return actual.evaluateTriage(...args);
    },
  };
});

beforeEach(() => {
  state.hideChrome = undefined;
  state.bar = null;
  state.badTemperature = false;
  state.evaluated = 0;
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;

function renderScreen(logs: LogRow[] = []) {
  const client = new QueryClient();
  client.setQueryData(logsKey("b1"), logs);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <TriageScreen baby={baby} />
    </QueryClientProvider>,
  );
}

describe("TriageScreen", () => {
  it("a glass temperature card, one switch per visible question and the 115 pill", () => {
    const html = renderScreen();
    const visible = visibleQuestions(
      TRIAGE.questions,
      ageDays(baby.dob, new Date()),
    );
    expect(html).toContain('href="/suc-khoe"');
    expect(html.match(/role="switch"/g)).toHaveLength(visible.length);
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain('inputMode="decimal"');
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

  // Spec 2026-11-19 §6.
  it("the result bar replaces the buttons at the end of the form", () => {
    const html = renderScreen();
    expect(state.bar?.count).toBe(0);
    expect(html).not.toContain("min-h-[50px]");
    expect(html.match(/>Xem kết quả<\/button>/g)).toHaveLength(1);
    // The 115 pill at the top and the round 115 button of the bar.
    expect(html.match(/href="tel:115"/g)).toHaveLength(2);
    expect(html.match(/>Gọi cấp cứu 115<\/span>/g)).toHaveLength(1);
    expect(html.indexOf(">Gọi cấp cứu 115</span>")).toBeLessThan(
      html.indexOf(">Có dấu hiệu nào dưới đây?</h2>"),
    );
    expect(html.match(/aria-label="Gọi cấp cứu 115"/g)).toHaveLength(1);
  });

  it("hides the tab bar and + while there is no result", () => {
    renderScreen();
    expect(state.hideChrome).toBe(true);
  });

  it("the bar counts the fever chip locked by a logged temperature", () => {
    const at = new Date(Date.now() - 3_600_000).toISOString();
    const fever = {
      id: "c1",
      baby_id: "b1",
      type: "temperature",
      started_at: at,
      ended_at: at,
      details: { celsius: 38.5, method: "nach" },
      note: null,
      created_by: "u1",
      created_at: at,
      updated_at: at,
    } as LogRow;
    const html = renderScreen([fever]);
    expect(state.bar?.count).toBe(1);
    expect(html).toContain(">Xem kết quả · đã chọn 1</button>");
  });

  it("Xem kết quả with a bad temperature scrolls to the top and works out nothing", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollTo });
    state.badTemperature = true;
    renderScreen();
    state.bar?.onSubmit();
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 });
    expect(state.evaluated).toBe(0);
  });

  it("Xem kết quả with a valid temperature works out the result", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollTo });
    renderScreen();
    state.bar?.onSubmit();
    expect(state.evaluated).toBe(1);
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 });
  });
});

// Spec 2026-11-19 §6.
describe("ResultBar", () => {
  const bar = async (count: number) => {
    const { ResultBar } =
      await vi.importActual<typeof import("./ResultBar")>("./ResultBar");
    return renderToStaticMarkup(
      <ResultBar count={count} onSubmit={() => {}} />,
    );
  };

  it("sits where the tab bar sits, a fully round glass-strong bar", async () => {
    const html = await bar(0);
    const outer = html.slice(0, html.indexOf(">")).split(/[" ]/);
    // The classes that place the tab bar, read from its own markup.
    const nav = renderToStaticMarkup(<TabBarView current={null} />);
    const place = (/<nav[^>]* class="([^"]*)"/.exec(nav)?.[1] ?? "")
      .split(" ")
      .filter((name) =>
        /^(fixed|inset-|bottom-|z-|mx-auto|max-w-|print:)/.test(name),
      );
    expect(place).toEqual([
      "fixed",
      "inset-x-4",
      "bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)]",
      "z-10",
      "mx-auto",
      "max-w-md",
      "print:hidden",
    ]);
    for (const name of [
      ...place,
      "glass-strong",
      "rounded-full",
      "p-1.5",
      "gap-2",
    ])
      expect(outer).toContain(name);
  });

  it("a round 56 px 115 link, then the primary button", async () => {
    const html = await bar(0);
    expect(html).toMatch(
      /<a href="tel:115" aria-label="Gọi cấp cứu 115" class="[^"]*\bsize-14\b[^"]*\brounded-full\b[^"]*\bbg-danger-solid text-on-danger\b[^"]*">/,
    );
    expect(html).toContain('d="M22 16.9v3');
    expect(html.indexOf('href="tel:115"')).toBeLessThan(
      html.indexOf("<button"),
    );
    expect(html).toMatch(
      /<button type="button" class="[^"]*\bh-14\b[^"]*\bflex-1\b[^"]*\bbg-accent text-on-accent\b[^"]*">Xem kết quả<\/button>/,
    );
  });

  it("says how many answers are picked once there are some", async () => {
    expect(await bar(3)).toContain(">Xem kết quả · đã chọn 3</button>");
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
