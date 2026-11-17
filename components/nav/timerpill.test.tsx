import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hostElements } from "@/components/ui/testTree";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { TimerPillView } from "./TimerPill";

const NOW = new Date("2026-11-17T05:00:00Z");
const row = (over: Partial<LogRow>): LogRow =>
  ({
    id: "l1",
    baby_id: "b1",
    type: "breast",
    started_at: "2026-11-17T04:47:26.000Z", // 12 phút 34 giây trước
    ended_at: null,
    details: { side: "left" },
    note: null,
    created_by: "u1",
    created_at: "2026-11-17T04:47:26.000Z",
    updated_at: "2026-11-17T04:47:26.000Z",
    ...over,
  }) as LogRow;

describe("TimerPillView (spec 2026-11-17 §5.2)", () => {
  it("is one glass pill above the tab bar with the timer, its clock and Dừng", () => {
    const html = renderToStaticMarkup(
      <TimerPillView
        log={row({})}
        more={0}
        now={NOW}
        busy={false}
        onStop={() => {}}
      />,
    );
    expect(html.match(/glass-strong/g)).toHaveLength(1);
    // No plain `glass` class anywhere: nothing inside the pill blurs again.
    expect(html).not.toMatch(/class="(?:[^"]* )?glass(?: [^"]*)?"/);
    expect(html).toContain(
      "bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+70px)]",
    );
    expect(html).toContain("fixed");
    expect(html).toContain("z-10");
    expect(html).toContain("h-11");
    expect(html).toContain("print:hidden");
    expect(html).toContain('href="/"');
    expect(html).toContain("size-8");
    expect(html).toContain("bg-cat-feed/15 text-cat-feed");
    expect(html).toContain(`d="${ICON_PATHS.heart}"`);
    expect(html).toContain("Bú trái ·");
    expect(html).toContain('<span class="tabular-nums">12:34</span>');
    expect(html).toContain("min-w-16");
    expect(html).toContain("text-accent-text");
    expect(html).toContain(">Dừng</button>");
    // No "+n" counter when it is the only timer.
    expect(html).not.toContain(">+");
  });

  it("counts the other running timers and shows hours past one hour", () => {
    const html = renderToStaticMarkup(
      <TimerPillView
        log={row({
          type: "sleep",
          details: {},
          started_at: "2026-11-17T03:29:55.000Z",
        })}
        more={2}
        now={NOW}
        busy={false}
        onStop={() => {}}
      />,
    );
    expect(html).toContain("Ngủ ·");
    expect(html).toContain(">1:30:05</span>");
    expect(html).toContain(">+2</span>");
  });

  it("Dừng stops the shown timer and is disabled while busy", () => {
    const onStop = vi.fn();
    const [button] = hostElements(
      TimerPillView({ log: row({}), more: 0, now: NOW, busy: true, onStop }),
      "button",
    );
    expect(button.props.disabled).toBe(true);
    (button.props.onClick as () => void)();
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});

describe("room for the timer pill (spec 2026-11-17 §5.2)", () => {
  it("globals.css defines --pill-offset, 52px while the pill shows", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(/:root\s*\{\s*--pill-offset:\s*0px;\s*\}/);
    expect(css).toMatch(
      /:root\[data-timer-pill="on"\]\s*\{\s*--pill-offset:\s*52px;\s*\}/,
    );
  });

  it("the page's bottom padding grows by the same offset", () => {
    const gate = readFileSync("components/AuthGate.tsx", "utf8");
    expect(
      gate.match(/pb-\[calc\(120px\+var\(--pill-offset\)\)\]/g),
    ).toHaveLength(2);
    expect(gate).not.toContain("pb-[120px]");
  });
});
