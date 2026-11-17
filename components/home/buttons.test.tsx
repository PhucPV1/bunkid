import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { RunningLog } from "@/lib/rules/timer";
import { ICON_PATHS } from "@/lib/ui/icons";
import { QuickLogGrid } from "./QuickLogGrid";
import { TimerButtons } from "./TimerButtons";

const leftFeed: RunningLog = {
  id: "l1",
  type: "breast",
  details: { side: "left" },
};

describe("TimerButtons", () => {
  it("shows five 58 px round buttons with labels, in spec order", () => {
    const html = renderToStaticMarkup(
      <TimerButtons running={[]} busy={false} onTimer={() => {}} />,
    );
    expect(html).toContain(">Bấm giờ</h2>");
    expect(html.match(/<button/g)).toHaveLength(5);
    expect(html.match(/size-\[58px\]/g)).toHaveLength(5);
    const labels = [
      ...html.matchAll(/text-xs leading-4 font-medium text-ink">([^<]+)</g),
    ].map((m) => m[1]);
    expect(labels).toEqual(["Bú trái", "Bú phải", "Ngủ", "Hút sữa", "Nằm sấp"]);
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
    expect(html).not.toContain("Dừng");
  });

  it("fills a running timer with its colour and a halo, and offers to stop it", () => {
    const html = renderToStaticMarkup(
      <TimerButtons running={[leftFeed]} busy={false} onTimer={() => {}} />,
    );
    expect(html.match(/aria-label="Dừng /g)).toHaveLength(1);
    expect(html).toContain('aria-label="Dừng bú trái"');
    expect(html).toContain("bg-cat-feed ring-4 ring-cat-feed/30 text-bg");
    expect(html).toContain('aria-label="Bú phải"');
  });

  it("presses the timer's button, and is disabled while busy", () => {
    const onTimer = vi.fn();
    const buttons = findElements(
      TimerButtons({ running: [], busy: true, onTimer }),
      (el) => el.type === "button",
    );
    expect(buttons).toHaveLength(5);
    expect(buttons.every((b) => b.props.disabled === true)).toBe(true);
    (buttons[2].props.onClick as () => void)();
    expect(onTimer).toHaveBeenCalledWith({ type: "sleep" });
  });
});

describe("TimerButtons next-side hint (spec 2026-11-17 §5.3)", () => {
  it("puts Nên bú on the suggested side only", () => {
    const html = renderToStaticMarkup(
      <TimerButtons
        running={[]}
        busy={false}
        onTimer={() => {}}
        suggestSide="right"
      />,
    );
    expect(html.match(/Nên bú/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Bú phải, nên bú"');
    expect(html).toContain('aria-label="Bú trái"');
    expect(html.match(/<button/g)).toHaveLength(5);
  });

  it("shows no label without a hint", () => {
    const html = renderToStaticMarkup(
      <TimerButtons running={[]} busy={false} onTimer={() => {}} />,
    );
    expect(html).not.toContain("Nên bú");
  });
});

describe("QuickLogGrid", () => {
  it("is a 2×2 grid of glass pills with a coloured chip, in spec order", () => {
    const onInstant = vi.fn();
    const html = renderToStaticMarkup(<QuickLogGrid onInstant={onInstant} />);
    expect(html).toContain(">Ghi nhanh</h2>");
    expect(html).toContain("grid-cols-2");
    expect(html.match(/min-h-14/g)).toHaveLength(4);
    const labels = [...html.matchAll(/<span>([^<]+)<\/span><\/button>/g)].map(
      (m) => m[1],
    );
    expect(labels).toEqual(["Thay tã", "Bú bình", "Thuốc", "Nhiệt độ"]);
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain(`d="${ICON_PATHS.thermo}"`);
    const buttons = findElements(
      QuickLogGrid({ onInstant }),
      (el) => el.type === "button",
    );
    (buttons[0].props.onClick as () => void)();
    expect(onInstant).toHaveBeenCalledWith("diaper");
  });
});
