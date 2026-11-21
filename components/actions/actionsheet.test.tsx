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
const sectionsOf = (html: string) => html.split("<section").slice(1);
const titlesOf = (html: string) =>
  [...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);

describe("QuickActionGrid", () => {
  const html = renderToStaticMarkup(
    <QuickActionGrid running={[]} onPick={() => {}} />,
  );

  it("draws three titled groups: Khác and Ghi nhanh as 4-column grids of 84 px tiles", () => {
    const titles = [...html.matchAll(/<h3 class="([^"]*)">([^<]+)<\/h3>/g)];
    // Spec 2026-11-19 §5.4: the most used group sits lowest, near the thumb.
    expect(titles.map((m) => m[2])).toEqual(["Khác", "Ghi nhanh", "Bấm giờ"]);
    expect(titles[0][1]).toBe(
      "text-[13px] leading-[18px] font-semibold text-muted",
    );
    const [other, quick, timers] = sectionsOf(html);
    for (const part of [other, quick]) {
      expect(part).toContain('<div class="grid grid-cols-4 gap-2">');
      expect(part.match(/<button/g)).toHaveLength(4);
      expect(part.match(/h-\[84px\][^"]*rounded-\[20px\]/g)).toHaveLength(4);
      expect(part.match(/size-\[38px\]/g)).toHaveLength(4);
      expect(part.match(/width="20" height="20"/g)).toHaveLength(4);
      expect(part).not.toContain("size-[58px]");
    }
    expect(timers).not.toContain("h-[84px]");
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    for (const icon of ["drop", "bowl", "glass", "bath", "doc"] as const)
      expect(html).toContain(`d="${ICON_PATHS[icon]}"`);
  });

  // Spec 2026-11-19 §5.4.
  it("draws Bấm giờ as one row of five 58 px round buttons, like the home page", () => {
    const timers = sectionsOf(html)[2];
    expect(timers).toContain('<div class="grid grid-cols-5 gap-1">');
    expect(timers.match(/<button/g)).toHaveLength(5);
    expect(timers.match(/size-\[58px\]/g)).toHaveLength(5);
    expect(timers.match(/width="24" height="24"/g)).toHaveLength(5);
    expect(timers.match(/stroke-width="2.2"/g)).toHaveLength(5);
    const labels = [
      ...timers.matchAll(
        /text-xs leading-4 font-medium whitespace-nowrap text-ink">([^<]+)</g,
      ),
    ].map((m) => m[1]);
    expect(labels).toEqual(["Bú trái", "Bú phải", "Ngủ", "Hút sữa", "Nằm sấp"]);
    expect(timers).toContain("rounded-full glass text-cat-feed");
    expect(timers).toContain("rounded-full glass text-cat-sleep");
    for (const icon of ["heart", "moon", "cup", "smile"] as const)
      expect(timers).toContain(`d="${ICON_PATHS[icon]}"`);
    expect(html).not.toContain("Dừng");
  });

  // Spec 2026-11-19 §5.4: "Uống nước" used to wrap at 375 px.
  it("keeps every label on one line", () => {
    expect(
      html.match(
        /<span class="[^"]*\bwhitespace-nowrap\b[^"]*">[^<]+<\/span><\/button>/g,
      ),
    ).toHaveLength(13);
    expect(html).toContain(
      '<span class="text-center text-xs leading-4 font-semibold whitespace-nowrap">Uống nước</span>',
    );
    for (const action of QUICK_ACTIONS)
      expect(html).toContain(`>${action.label}</span>`);
  });

  it("timer buttons carry no clock badge: the group title says it", () => {
    expect(html).not.toContain(`d="${ICON_PATHS.clock}"`);
    expect(html).not.toContain("bấm giờ");
  });

  it("a running timer fills its circle and bolds its label; Dừng … is only read out", () => {
    const running = renderToStaticMarkup(
      <QuickActionGrid running={[leftFeed]} onPick={() => {}} />,
    );
    expect(running.match(/aria-label="Dừng /g)).toHaveLength(1);
    expect(running).toContain('aria-label="Dừng bú trái"');
    expect(running).toContain('aria-label="Bú phải"');
    expect(running).not.toContain(">Dừng");
    expect(running).toContain("bg-cat-feed ring-4 ring-cat-feed/30 text-bg");
    expect(running).toContain(
      '<span class="text-xs leading-4 font-bold whitespace-nowrap text-ink">Bú trái</span>',
    );
    expect(
      running.match(/font-bold whitespace-nowrap text-ink/g),
    ).toHaveLength(1);
    expect(running).toContain(
      'font-medium whitespace-nowrap text-ink">Bú phải</span>',
    );
    // The old outlined 84 px tile is gone.
    expect(running).not.toContain("border-2 border-accent-text");
  });

  it("reports the picked action", () => {
    const onPick = vi.fn();
    const buttons = hostElements(
      QuickActionGrid({ running: [], onPick }),
      "button",
    );
    expect(buttons).toHaveLength(13);
    // Buttons follow the sheet's group order; QUICK_ACTIONS keeps its own.
    (buttons[5].props.onClick as () => void)();
    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[6]);
    expect(QUICK_ACTIONS[6].label).toBe("Thay tã");
    (buttons[3].props.onClick as () => void)();
    expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[12]);
    expect(QUICK_ACTIONS[12]).toMatchObject({ instant: "note" });
    (buttons[8].props.onClick as () => void)();
    expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[0]);
    expect(QUICK_ACTIONS[0].label).toBe("Bú trái");
  });
});

// Spec 2026-11-19 §5.4.
describe("QuickActionGrid groups", () => {
  it("draws only the groups asked for", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} groups={["other"]} />,
    );
    expect(titlesOf(html)).toEqual(["Khác"]);
    expect(html.match(/<button/g)).toHaveLength(4);
    for (const label of ["Ăn dặm", "Uống nước", "Tắm", "Ghi chú"])
      expect(html).toContain(`>${label}</span>`);
    expect(html).not.toContain("Thay tã");
    expect(html).not.toContain("Bú trái");
  });

  it("keeps the sheet's own order whatever order is asked for", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid
        running={[]}
        onPick={() => {}}
        groups={["timer", "other"]}
      />,
    );
    expect(titlesOf(html)).toEqual(["Khác", "Bấm giờ"]);
    expect(html.match(/<button/g)).toHaveLength(9);
  });

  it("reports a pick from a filtered sheet", () => {
    const onPick = vi.fn();
    const buttons = hostElements(
      QuickActionGrid({ running: [], onPick, groups: ["other"] }),
      "button",
    );
    expect(buttons).toHaveLength(4);
    (buttons[1].props.onClick as () => void)();
    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[10]);
    expect(QUICK_ACTIONS[10].label).toBe("Uống nước");
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
    expect(titlesOf(html)).toEqual(["Khác", "Ghi nhanh", "Bấm giờ"]);
  });

  // Spec 2026-11-19 §5.4: what the home page's "Khác" button opens.
  it("draws only the groups it is given, under the same title", () => {
    const html = renderToStaticMarkup(
      <ActionSheetView
        open
        babyName="Bun"
        running={[]}
        groups={["other"]}
        onClose={() => {}}
        onPick={() => {}}
      />,
    );
    expect(html).toContain(">Ghi lại cho Bun</h2>");
    expect(titlesOf(html)).toEqual(["Khác"]);
  });
});

describe("QuickActionGrid next-side hint (spec 2026-11-17 §5.3)", () => {
  it("puts Nên bú on the suggested breast button and reads it out", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} suggestSide="left" />,
    );
    expect(html.match(/Nên bú/g)).toHaveLength(1);
    const [other, quick, timers] = sectionsOf(html);
    expect(timers).toMatch(/Nên bú<\/span>.*Bú trái/s);
    expect(other + quick).not.toContain("Nên bú");
    expect(html).toContain('aria-label="Bú trái, nên bú"');
    expect(html).toContain('aria-label="Bú phải"');
    expect(html.match(/<button/g)).toHaveLength(13);
  });

  it("shows no label without a hint", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} />,
    );
    expect(html).not.toContain("Nên bú");
  });
});
