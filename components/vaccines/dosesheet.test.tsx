import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import type { VaccineDoseRow } from "@/lib/supabase/rows";
import { DoseSheet } from "./DoseSheet";

const item = {
  dose: { code: "bcg", doseNo: 1, name: "Lao (BCG)", protects: ["Lao"] },
  due: "2026-11-20",
  state: "upcoming",
  record: null,
  unchosen: false,
  pastMaxAge: false,
} as unknown as ScheduleItem;

const rescheduled = {
  id: "v1",
  baby_id: "b1",
  vaccine_code: "bcg",
  dose_no: 1,
  status: "rescheduled",
  given_on: null,
  due_on_override: "2026-11-25",
  place: null,
  note: null,
  created_by: "u1",
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z",
} as VaccineDoseRow;

const render = (row: VaccineDoseRow | null) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <DoseSheet
        item={item}
        row={row}
        babyId="b1"
        userId="u1"
        dob="2026-09-10"
        onClose={() => {}}
      />
    </QueryClientProvider>,
  );

describe("DoseSheet", () => {
  it("new: dose name, what it protects, a three-way choice, date and place, Lưu", () => {
    const html = render(null);
    expect(html).toContain("<dialog");
    expect(html).toContain(">Lao (BCG)</h2>");
    expect(html).toContain("Phòng: Lao. Hẹn ");
    expect(html).toContain("20/11/2026");
    expect(html).toContain('aria-label="Trạng thái mũi tiêm"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Đã tiêm<\/button>/);
    expect(html).toContain(">Đổi ngày hẹn</button>");
    expect(html).not.toContain('type="radio"');
    expect(html).toContain(">Ngày tiêm</span>");
    expect(html).toContain(">Nơi tiêm (không bắt buộc)</span>");
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Xóa đánh dấu");
    expect(html).not.toContain(">Đóng</button>");
  });

  it("rescheduled: new date, no place, and Xóa đánh dấu", () => {
    const html = render(rescheduled);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Đổi ngày hẹn<\/button>/);
    expect(html).toContain(">Ngày hẹn mới</span>");
    expect(html).toContain('value="2026-11-25"');
    expect(html).not.toContain("Nơi tiêm");
    expect(html).toContain(">Xóa đánh dấu</button>");
    expect(html).toContain("text-danger!");
  });
});
