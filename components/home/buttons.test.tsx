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

// Spec 2026-11-19 §3.4.
describe("QuickLogGrid", () => {
  const html = renderToStaticMarkup(
    <QuickLogGrid onInstant={() => {}} onMore={() => {}} />,
  );

  it("is one row of five 58 px round buttons with labels, in spec order", () => {
    expect(html).toContain(">Ghi nhanh</h2>");
    expect(html).toContain('<div class="grid grid-cols-5 gap-1">');
    expect(html.match(/<button/g)).toHaveLength(5);
    expect(html.match(/size-\[58px\]/g)).toHaveLength(5);
    const labels = [
      ...html.matchAll(/text-xs leading-4 font-medium text-ink">([^<]+)</g),
    ].map((m) => m[1]);
    expect(labels).toEqual(["Thay tã", "Bú bình", "Thuốc", "Nhiệt độ", "Khác"]);
    expect(html).not.toContain("grid-cols-2");
    expect(html).not.toContain("min-h-14");
  });

  it("tints the four log circles with their category colour, without glass", () => {
    for (const token of ["diaper", "bottle", "med", "temp"])
      expect(html).toContain(
        `rounded-full bg-cat-${token}/15 text-cat-${token}`,
      );
    for (const icon of ["drop", "bottle", "pill", "thermo"] as const)
      expect(html).toContain(`d="${ICON_PATHS[icon]}"`);
    expect(html.match(/stroke-width="2.2"/g)).toHaveLength(4);
    expect(html).not.toContain("glass");
  });

  it("draws Khác as three bold dots on a muted circle", () => {
    expect(html).toContain("rounded-full bg-muted/15 text-ink");
    expect(html).toContain(`d="${ICON_PATHS.more}"`);
    expect(html.match(/stroke-width="3"/g)).toHaveLength(1);
  });

  it("the first four open their sheet, Khác calls onMore with no argument", () => {
    const onInstant = vi.fn();
    const onMore = vi.fn();
    const buttons = findElements(
      QuickLogGrid({ onInstant, onMore }),
      (el) => el.type === "button",
    );
    expect(buttons).toHaveLength(5);
    for (const button of buttons.slice(0, 4))
      (button.props.onClick as () => void)();
    expect(onInstant.mock.calls).toEqual([
      ["diaper"],
      ["bottle"],
      ["medicine"],
      ["temperature"],
    ]);
    expect(onMore).not.toHaveBeenCalled();
    (buttons[4].props.onClick as (event: unknown) => void)({ type: "click" });
    expect(onMore.mock.calls).toEqual([[]]);
  });
});
