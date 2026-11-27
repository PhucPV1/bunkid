import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { MILESTONES } from "@/lib/content/milestones";
import type { MilestoneRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { AskDoctorSheet } from "./AskDoctorSheet";
import { MotorSheet, MotorSheetBody } from "./MotorSheet";

const rolled = {
  id: "r1",
  baby_id: "b1",
  milestone_code: "lat",
  achieved_on: "2026-11-12",
  note: null,
  photo_id: null,
  created_by: "u1",
  created_at: "2026-11-12T00:00:00.000Z",
} as MilestoneRow;

const props = (
  over: Partial<Parameters<typeof MotorSheetBody>[0]> = {},
): Parameters<typeof MotorSheetBody>[0] => ({
  motor: MILESTONES.motor,
  ageMonths: 5,
  ageText: "5 tháng",
  babyName: "Bun",
  byCode: new Map([["lat", rolled]]),
  pending: new Set<string>(),
  canEdit: () => true,
  onPick: () => {},
  ...over,
});

describe("MotorSheet (spec 2026-11-27 §4.4)", () => {
  it("is a sheet titled Vận động lớn with today's age", () => {
    const html = renderToStaticMarkup(
      <MotorSheet {...props()} onClose={() => {}} />,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain(">Vận động lớn</h2>");
    expect(html).toContain("Bun hôm nay: 5 tháng");
    expect(html).toContain(
      "Thanh màu là khoảng tuổi bé thường làm được. Bấm một mốc để ghi ngày đạt.",
    );
  });

  it("gives each milestone a short chip", () => {
    const html = renderToStaticMarkup(<MotorSheetBody {...props()} />);
    expect(html).toContain(
      '<span class="shrink-0 rounded-full px-2.5 text-[13px] leading-[22px] font-semibold whitespace-nowrap bg-good-soft text-good-ink">Đạt 12/11/2026</span>',
    );
    expect(
      html.match(/bg-accent-tint text-accent-text">Đang tới tuổi</g),
    ).toHaveLength(2);
    expect(html.match(/bg-ink\/7 text-ink">Sắp tới</g)).toHaveLength(4);
    const late = renderToStaticMarkup(
      <MotorSheetBody {...props({ ageMonths: 14 })} />,
    );
    expect(
      late.match(/bg-warn-soft text-warn-ink">Nên hỏi bác sĩ</g),
    ).toHaveLength(4); // ngồi, đứng có đỡ, bò, đi có dắt at 14 months
  });

  it("draws the window bars and today's line, hidden from screen readers", () => {
    const html = renderToStaticMarkup(<MotorSheetBody {...props()} />);
    expect(html).toContain(
      '<span class="absolute inset-y-0 rounded-full bg-accent" style="left:21.1%;width:30%"></span>',
    );
    expect(html).toContain(
      '<span class="absolute inset-y-0 rounded-full bg-good" style="left:22.2%;width:11.1%"></span>',
    );
    expect(html.match(/style="left:27.8%"/g)).toHaveLength(7);
    expect(html).toContain(
      '<span class="sr-only">Thường trong khoảng 3,8–9,2 tháng</span>',
    );
    expect(html).toMatch(
      /aria-hidden="true"[^>]*><span>0<\/span><span>6<\/span><span>12<\/span><span>18 tháng<\/span>/,
    );
  });

  it("shows the check, the pending mark and the full name", () => {
    const html = renderToStaticMarkup(
      <MotorSheetBody {...props({ pending: new Set(["lat"]) })} />,
    );
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain('aria-label="Chờ đồng bộ"');
    expect(html).toContain("Lật (từ sấp sang ngửa)");
  });

  it("picks a milestone, unless the user may not change it", () => {
    const onPick = vi.fn();
    const tree = MotorSheetBody(props({ onPick, canEdit: (r) => !r }));
    const buttons = findElements(tree, (e) => e.type === "button");
    expect(buttons).toHaveLength(7);
    expect(buttons[0].props.disabled).toBe(true);
    (buttons[1].props.onClick as () => void)();
    expect(onPick).toHaveBeenCalledWith("ngoi", "Ngồi không cần đỡ");
  });
});

describe("AskDoctorSheet (spec 2026-11-27 §4.5)", () => {
  it("lists when to ask a doctor", () => {
    const html = renderToStaticMarkup(
      <AskDoctorSheet lines={["Một", "Hai"]} onClose={() => {}} />,
    );
    expect(html).toContain(">Khi nào nên hỏi bác sĩ</h2>");
    expect(html).toContain(
      '<ul class="list-disc pl-5 text-base text-ink"><li>Một</li><li>Hai</li></ul>',
    );
  });
});
