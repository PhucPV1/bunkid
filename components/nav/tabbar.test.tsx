import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hostElements } from "@/components/ui/testTree";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { TabBarView } from "./TabBar";

const NOW = vi.hoisted(() => new Date("2026-11-17T05:00:00Z"));
const useNow = vi.hoisted(() => vi.fn((_ms: number) => NOW));
vi.mock("@/lib/hooks/useNow", () => ({ useNow }));

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
// <Link> is a component, not an <a> host element, so read the rendered HTML.
const anchorsOf = (html: string) => html.split("<a ").slice(1);

beforeEach(() => {
  useNow.mockClear();
});

describe("TabBarView", () => {
  it("is a floating glass pill with three icon tabs", () => {
    const html = renderToStaticMarkup(<TabBarView current="history" />);
    expect(html).toContain('aria-label="Điều hướng chính"');
    expect(html).toContain("glass-strong");
    expect(html).toContain("h-[62px]");
    expect(html).toContain(
      "bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)]",
    );
    expect(html).toContain("print:hidden");
    expect(html.match(/<a /g)).toHaveLength(3);
    for (const name of ["home", "list", "explore"] as const)
      expect(html).toContain(`d="${ICON_PATHS[name]}"`);
    expect(html).toContain(">Hôm nay</a>");
    expect(html).toContain(">Khám phá</a>");
  });

  it("marks only the current tab", () => {
    const anchors = anchorsOf(
      renderToStaticMarkup(<TabBarView current="history" />),
    );
    expect(anchors.map((a) => a.includes('aria-current="page"'))).toEqual([
      false,
      true,
      false,
    ]);
    expect(anchors[1]).toContain("bg-accent-tint text-accent-text");
    expect(anchors[0]).not.toContain("bg-accent-tint");
  });

  it("has no + button until a handler is given", () => {
    expect(renderToStaticMarkup(<TabBarView current="home" />)).not.toContain(
      "<button",
    );
  });

  it("shows + to open and × to close, and reports presses", () => {
    const onPlus = vi.fn();
    const closed = renderToStaticMarkup(
      <TabBarView current="home" onPlus={onPlus} />,
    );
    expect(closed).toContain('aria-label="Ghi lại"');
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("size-[62px]");
    expect(closed).toContain("bg-accent text-on-accent");
    expect(closed).toContain(`d="${ICON_PATHS.plus}"`);
    const open = renderToStaticMarkup(
      <TabBarView current="home" onPlus={onPlus} plusOpen />,
    );
    expect(open).toContain('aria-label="Đóng"');
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain("bg-ink text-bg");
    expect(open).toContain(`d="${ICON_PATHS.close}"`);
    const [button] = hostElements(
      TabBarView({ current: "home", onPlus }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onPlus).toHaveBeenCalledOnce();
  });
  it("sits below the old z-20 sheets and dims while the action sheet is open", () => {
    const closed = renderToStaticMarkup(
      <TabBarView current="home" onPlus={() => {}} />,
    );
    expect(closed).toContain(" z-10 ");
    expect(closed).not.toContain("z-20");
    expect(closed).not.toContain("opacity-60");
    const open = renderToStaticMarkup(
      <TabBarView current="home" onPlus={() => {}} plusOpen />,
    );
    expect(open).toContain("opacity-60");
  });
});

// Spec 2026-11-19 §4: the running timer lives in the Hôm nay tab.
describe("TabBarView timer tile", () => {
  const itemsOf = (html: string) =>
    [...html.matchAll(/<li class="([^"]*)">/g)].map((m) => m[1]);

  it("without a timer the three tabs share the bar equally and nothing ticks", () => {
    for (const html of [
      renderToStaticMarkup(<TabBarView current="history" />),
      renderToStaticMarkup(<TabBarView current="history" timer={null} />),
    ]) {
      expect(itemsOf(html)).toEqual([
        "flex flex-1",
        "flex flex-1",
        "flex flex-1",
      ]);
      expect(html).toContain(">Hôm nay</a>");
      expect(html).not.toContain("tabular-nums");
    }
    expect(useNow).not.toHaveBeenCalled();
  });

  it("draws the Hôm nay tab as a wider tile with the timer's circle and clock", () => {
    const html = renderToStaticMarkup(
      <TabBarView
        current="history"
        onPlus={() => {}}
        timer={{ log: row({}), more: 0 }}
      />,
    );
    expect(itemsOf(html)).toEqual([
      "flex flex-[1.7]",
      "flex flex-1",
      "flex flex-1",
    ]);
    const anchors = anchorsOf(html);
    expect(anchors).toHaveLength(3);
    const [home, history] = anchors;
    // Still a link to Hôm nay, where the timer can be stopped.
    expect(home).toContain('href="/"');
    expect(home).toContain('aria-label="Hôm nay, Bú trái đã chạy 12:34"');
    expect(home).toContain("rounded-full px-1 bg-cat-feed/15");
    expect(home).not.toContain("bg-accent-tint");
    expect(home).not.toContain("aria-current");
    expect(home).toContain(
      "size-9 shrink-0 items-center justify-center rounded-full bg-cat-feed text-bg",
    );
    expect(home).toContain('width="18" height="18"');
    expect(home).toContain(`d="${ICON_PATHS.heart}"`);
    expect(home).not.toContain(`d="${ICON_PATHS.home}"`);
    expect(home).toContain(
      '<span class="text-[17px] leading-5 font-bold whitespace-nowrap text-ink tabular-nums">12:34</span>',
    );
    expect(home).toContain(
      '<span class="text-[10px] leading-3 font-semibold whitespace-nowrap text-ink">Hôm nay</span>',
    );
    // The other two tabs are drawn as before.
    expect(history).toContain('aria-current="page"');
    expect(history).toContain("bg-accent-tint text-accent-text");
    expect(history).toContain(">Nhật ký</a>");
    expect(html).toContain(">Khám phá</a>");
    // Nothing stops the timer from here: the only button is "+".
    expect(html).not.toContain("Dừng");
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it("only the tile ticks, once a second", () => {
    renderToStaticMarkup(
      <TabBarView current="history" timer={{ log: row({}), more: 0 }} />,
    );
    expect(useNow.mock.calls).toEqual([[1000]]);
  });

  it("shows hours and minutes past one hour and counts the other timers", () => {
    const html = renderToStaticMarkup(
      <TabBarView
        current="explore"
        timer={{
          log: row({
            type: "sleep",
            details: {},
            started_at: "2026-11-17T03:29:55.000Z",
          }),
          more: 2,
        }}
      />,
    );
    const [home] = anchorsOf(html);
    // A screen reader hears the count that sighted users read as "· +2".
    expect(home).toContain(
      'aria-label="Hôm nay, Ngủ đã chạy 1:30:05, còn 2 timer khác đang chạy"',
    );
    expect(home).toContain(">1g 30p</span>");
    expect(home).toContain(">Hôm nay · +2</span>");
    expect(home).toContain("bg-cat-sleep/15");
    expect(home).toContain("rounded-full bg-cat-sleep text-bg");
    expect(home).toContain(`d="${ICON_PATHS.moon}"`);
    // No separate round counter: the tile is too narrow for one.
    expect(home).not.toContain(">+2<");
  });

  it("the tile's name counts the other timers only when there are some", () => {
    const label = (more: number) =>
      /aria-label="([^"]*)"/.exec(
        anchorsOf(
          renderToStaticMarkup(
            <TabBarView current="history" timer={{ log: row({}), more }} />,
          ),
        )[0],
      )?.[1];
    expect(label(0)).toBe("Hôm nay, Bú trái đã chạy 12:34");
    expect(label(1)).toBe(
      "Hôm nay, Bú trái đã chạy 12:34, còn 1 timer khác đang chạy",
    );
  });

  it("on Cài đặt the tile stays the current tab but keeps the category tint", () => {
    const anchors = anchorsOf(
      renderToStaticMarkup(
        <TabBarView current="home" timer={{ log: row({}), more: 0 }} />,
      ),
    );
    expect(anchors.map((a) => a.includes('aria-current="page"'))).toEqual([
      true,
      false,
      false,
    ]);
    expect(anchors[0]).toContain("bg-cat-feed/15");
    expect(anchors.join("")).not.toContain("bg-accent-tint");
  });

});

// Spec 2026-11-19 §4: the floating pill is gone, and so is the room it took.
describe("the old timer pill", () => {
  it("has no component left", () => {
    expect(existsSync("components/nav/TimerPill.tsx")).toBe(false);
  });

  it("globals.css keeps no offset for it", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).not.toContain("--pill-offset");
    expect(css).not.toContain("data-timer-pill");
  });

  it("the page's bottom padding is back to 120 px", () => {
    const gate = readFileSync("components/AuthGate.tsx", "utf8");
    expect(gate.match(/pb-\[120px\]/g)).toHaveLength(2);
    expect(gate).not.toContain("pill-offset");
  });
});
