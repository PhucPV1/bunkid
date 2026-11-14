import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hostElements } from "@/components/ui/testTree";
import { QUICK_ACTIONS } from "@/lib/rules/quickActions";
import type { RunningLog } from "@/lib/rules/timer";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ActionSheetView, QuickActionGrid } from "./ActionSheet";

const leftFeed: RunningLog = {
  id: "l1",
  type: "breast",
  details: { side: "left" },
};

describe("QuickActionGrid", () => {
  it("is a 3×3 grid of 100 pt tiles with category icons", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} />,
    );
    expect(html).toContain("grid grid-cols-3");
    expect(html.match(/<button/g)).toHaveLength(9);
    expect(html).toContain("h-[100px]");
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain(`d="${ICON_PATHS.drop}"`);
    for (const action of QUICK_ACTIONS)
      expect(html).toContain(`>${action.label}</span>`);
  });

  it("badges the five timers with a clock", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} />,
    );
    expect(html.split(`d="${ICON_PATHS.clock}"`).length - 1).toBe(5);
    expect(html.split("bấm giờ").length - 1).toBe(5);
  });

  it("a running timer is outlined and reads Dừng …", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[leftFeed]} onPick={() => {}} />,
    );
    expect(html).toContain(">Dừng bú trái</span>");
    expect(html.split("border-2 border-accent-text").length - 1).toBe(1);
  });

  it("reports the picked action", () => {
    const onPick = vi.fn();
    const buttons = hostElements(
      QuickActionGrid({ running: [], onPick }),
      "button",
    );
    (buttons[4].props.onClick as () => void)();
    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[4]);
    expect(QUICK_ACTIONS[4].label).toBe("Thay tã");
  });
});

describe("ActionSheetView", () => {
  it("is a floating sheet titled for the baby with the clock legend", () => {
    const html = renderToStaticMarkup(
      <ActionSheetView
        open
        babyName="Bun"
        running={[]}
        onClose={() => {}}
        onPick={() => {}}
      />,
    );
    expect(html).toContain(">Ghi lại cho Bun</h2>");
    expect(html).toContain("rounded-[34px]");
    expect(html).not.toContain("data-sheet-handle");
    expect(html).toContain("= bấm giờ");
  });
});
