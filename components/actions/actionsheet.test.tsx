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
  it("draws three titled groups, each a 4-column grid of 84 px tiles", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} />,
    );
    const titles = [...html.matchAll(/<h3 class="([^"]*)">([^<]+)<\/h3>/g)];
    expect(titles.map((m) => m[2])).toEqual(["Bấm giờ", "Ghi nhanh", "Khác"]);
    expect(titles[0][1]).toBe(
      "text-[13px] leading-[18px] font-semibold text-muted",
    );
    expect(html.match(/grid grid-cols-4 gap-2/g)).toHaveLength(3);
    const tiles = html.split("<section").slice(1);
    expect(tiles.map((part) => part.match(/<button/g)?.length)).toEqual([
      5, 4, 4,
    ]);
    expect(html.match(/h-\[84px\][^"]*rounded-\[20px\]/g)).toHaveLength(13);
    expect(html.match(/size-\[38px\]/g)).toHaveLength(13);
    expect(html.match(/width="20" height="20"/g)).toHaveLength(13);
    expect(html.match(/text-xs leading-4 font-semibold/g)).toHaveLength(13);
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    for (const icon of ["drop", "bowl", "glass", "bath", "doc"] as const)
      expect(html).toContain(`d="${ICON_PATHS[icon]}"`);
    for (const action of QUICK_ACTIONS)
      expect(html).toContain(`>${action.label}</span>`);
  });

  it("timer tiles carry no clock badge: the group title says it", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} />,
    );
    expect(html).not.toContain(`d="${ICON_PATHS.clock}"`);
    expect(html).not.toContain("bấm giờ");
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
    (buttons[6].props.onClick as () => void)();
    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[6]);
    expect(QUICK_ACTIONS[6].label).toBe("Thay tã");
    (buttons[12].props.onClick as () => void)();
    expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[12]);
    expect(QUICK_ACTIONS[12]).toMatchObject({ instant: "note" });
  });
});

describe("ActionSheetView", () => {
  it("is a floating sheet titled for the baby, without the old clock legend", () => {
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
    expect(html).not.toContain("= bấm giờ");
    expect(html).toContain(">Bấm giờ</h3>");
  });
});
