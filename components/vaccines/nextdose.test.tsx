import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import { NextDoseCard } from "./NextDoseCard";

const TODAY = "2026-11-20";
const item = (state: string, due: string, program = "dich_vu") =>
  ({
    dose: {
      code: "pcv",
      doseNo: 1,
      name: "Phế cầu mũi 1",
      protects: ["Phế cầu"],
      program,
    },
    due,
    state,
    record: null,
    unchosen: false,
    pastMaxAge: false,
  }) as unknown as ScheduleItem;

const render = (dose: ScheduleItem) =>
  renderToStaticMarkup(
    <NextDoseCard item={dose} today={TODAY} onOpen={() => {}} />,
  );

// Spec 2026-11-19 §7.
describe("NextDoseCard", () => {
  it("overdue: a glass button, 28 px corners, 16 px padding, warn label and border", () => {
    const html = render(item("overdue", "2026-11-14"));
    expect(html).toMatch(
      /^<button type="button" class="glass [^"]*\brounded-\[28px\] p-4\b[^"]*\bborder-warn!">/,
    );
    expect(html).toMatch(
      /<span class="text-\[13px\] leading-\[18px\] font-semibold [^"]*\buppercase text-warn">Quá hạn 6 ngày<\/span>/,
    );
    expect(html).toContain(
      '<span class="text-xl leading-[26px] font-bold text-ink">Phế cầu mũi 1</span>',
    );
    expect(html).toContain(
      '<span class="text-[13px] leading-[18px] text-muted">Hẹn Thứ Bảy, 14/11/2026 · Dịch vụ</span>',
    );
    expect(html.endsWith("</button>")).toBe(true);
  });

  it("upcoming: the days left, no warn colour or border", () => {
    const html = render(item("upcoming", "2026-12-10", "tcmr"));
    expect(html).toMatch(/\buppercase text-muted">Sắp tới · còn 20 ngày</);
    expect(html).toContain(">Hẹn Thứ Năm, 10/12/2026 · Tiêm chủng mở rộng<");
    expect(html).not.toContain("text-warn");
    expect(html).not.toContain("border-warn!");
  });

  it("upcoming and due today: hôm nay instead of a count", () => {
    expect(render(item("upcoming", TODAY))).toContain(">Sắp tới · hôm nay<");
  });

  it("later: Mũi tiếp theo", () => {
    const html = render(item("later", "2027-06-14"));
    expect(html).toMatch(/\buppercase text-muted">Mũi tiếp theo</);
    expect(html).not.toContain("border-warn!");
  });

  it("opens its dose when tapped", () => {
    const onOpen = vi.fn();
    const dose = item("overdue", "2026-11-14");
    const tree = NextDoseCard({ item: dose, today: TODAY, onOpen });
    (tree.props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(dose);
  });
});
