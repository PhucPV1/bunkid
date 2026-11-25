import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { HabitRow } from "@/lib/rules/habits";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HabitsCard } from "./HabitsCard";

const CHIP = "font-semibold whitespace-nowrap";
const sleep: HabitRow = {
  key: "sleep",
  title: "Giấc ngủ",
  line: "13 giờ 30 phút mỗi ngày · nên 14–17 giờ",
  chip: { text: "Ít hơn chuẩn", tone: "warn" },
  progress: 0.79,
};
const tummy: HabitRow = {
  key: "tummy",
  title: "Nằm sấp",
  line: "30 phút mỗi ngày · nên từ 30 phút",
  chip: { text: "Đủ", tone: "good" },
  progress: 1,
};
const vitaminD: HabitRow = {
  key: "vitaminD",
  title: "Vitamin D",
  line: "Đã uống 5 trên 7 ngày",
  chip: { text: "Sót 2 ngày", tone: "neutral" },
  progress: 5 / 7,
};
const render = (rows: HabitRow[]) =>
  renderToStaticMarkup(<HabitsCard rows={rows} />);

// Spec 2026-11-25 §7.1.
describe("HabitsCard", () => {
  it("is titled, lists one row per habit in a glass group, and names its sources", () => {
    const html = render([sleep, tummy, vitaminD]);
    expect(html).toContain(">Thói quen 7 ngày qua</h2>");
    expect(html).toContain("glass");
    expect(html).toContain("rounded-[26px]");
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html).toContain(
      ">Chuẩn giấc ngủ như trang Thống kê. Nằm sấp: WHO 2019.</p>",
    );
    expect(html.indexOf("Giấc ngủ")).toBeLessThan(html.indexOf("Nằm sấp"));
    expect(html.indexOf("Nằm sấp")).toBeLessThan(html.indexOf("Vitamin D"));
  });

  it("each habit has its icon in its own colour", () => {
    const html = render([sleep, tummy, vitaminD]);
    for (const [icon, colour] of [
      ["moon", "bg-cat-sleep/15 text-cat-sleep"],
      ["smile", "bg-cat-tummy/15 text-cat-tummy"],
      ["sun", "bg-cat-med/15 text-cat-med"],
    ] as const) {
      expect(html).toContain(`d="${ICON_PATHS[icon]}"`);
      expect(html).toContain(colour);
    }
    expect(html).toContain("size-9");
  });

  it("a row: the name, the value against the norm, the chip in its tone", () => {
    const html = render([sleep, tummy, vitaminD]);
    expect(html).toContain(">Giấc ngủ</span>");
    expect(html).toContain(
      '<span class="text-[13px] leading-[18px] text-muted">13 giờ 30 phút mỗi ngày · nên 14–17 giờ</span>',
    );
    expect(html).toContain(
      `${CHIP} bg-warn-soft text-warn-ink">Ít hơn chuẩn</span>`,
    );
    expect(html).toContain(`${CHIP} bg-good-soft text-good-ink">Đủ</span>`);
    expect(html).toContain(`${CHIP} bg-line text-ink">Sót 2 ngày</span>`);
  });

  // Beside the value line a chip such as "Nhiều hơn chuẩn" would leave it
  // about 116 px at 375 px wide, and it would run onto three lines.
  it("the chip shares a line with the name only; the value line has the full width under it", () => {
    const html = render([sleep]);
    expect(html).toContain(
      '<span class="flex items-center gap-2"><span class="min-w-0 flex-1 text-base font-bold text-ink">Giấc ngủ</span><span class="shrink-0',
    );
    expect(html.indexOf("Ít hơn chuẩn")).toBeLessThan(
      html.indexOf("13 giờ 30 phút mỗi ngày"),
    );
  });

  it("the bar is decoration in the habit's colour, as wide as the progress", () => {
    const html = render([sleep, tummy, vitaminD]);
    expect(
      html.match(
        /aria-hidden="true" class="block h-1.5 overflow-hidden rounded-full bg-line"/g,
      ),
    ).toHaveLength(3);
    expect(html).toContain(
      'class="block h-full rounded-full bg-cat-sleep" style="width:79%"',
    );
    expect(html).toContain(
      'class="block h-full rounded-full bg-cat-tummy" style="width:100%"',
    );
    expect(html).toMatch(/bg-cat-med" style="width:71\.42857142857\d*%"/);
  });

  it("a habit not judged for lack of data: its line only, no chip and no bar", () => {
    const html = render([
      {
        key: "sleep",
        title: "Giấc ngủ",
        line: "Chưa đủ dữ liệu ngủ 7 ngày",
        chip: null,
        progress: null,
      },
    ]);
    expect(html).toContain(">Chưa đủ dữ liệu ngủ 7 ngày</span>");
    expect(html).not.toContain(CHIP);
    expect(html).not.toContain("h-1.5");
  });

  it("an older child has fewer rows, and the note names only the norms that are shown", () => {
    const html = render([sleep, vitaminD]);
    expect(html.match(/<li /g)).toHaveLength(2);
    expect(html).toContain(">Chuẩn giấc ngủ như trang Thống kê.</p>");
    expect(html).not.toContain("WHO 2019");
  });
});
