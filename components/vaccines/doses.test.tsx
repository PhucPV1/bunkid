import { existsSync } from "node:fs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as vaccines from "@/lib/rules/vaccines";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import { ICON_PATHS } from "@/lib/ui/icons";
import { DoseLine } from "./DoseLine";
import { VaccineSourceRow } from "./VaccineSourceRow";

const item = (state: string, { dose, ...over }: Record<string, unknown> = {}) =>
  ({
    dose: {
      code: "rotarix",
      doseNo: 1,
      name: "Rotarix (uống) lần 1",
      protects: ["X"],
      program: "tcmr",
      note: "Uống trước 24 tuần tuổi.",
      ...(dose as object),
    },
    due: "2026-11-20",
    state,
    record: null,
    unchosen: false,
    pastMaxAge: false,
    ...over,
  }) as unknown as ScheduleItem;

const render = (dose: ScheduleItem) =>
  renderToStaticMarkup(<DoseLine item={dose} />);

// Spec 2026-11-19 §7.3: DoseLine now draws only the facts shown in DoseSheet.
describe("DoseLine", () => {
  it("an open dose: the program, then the note; no name, date or pill", () => {
    const html = render(item("upcoming", { unchosen: true }));
    expect(html).toBe(
      '<span class="text-[13px] text-muted">Tiêm chủng mở rộng</span>' +
        '<span class="text-[13px] text-muted">Uống trước 24 tuần tuổi.</span>',
    );
    expect(html).not.toContain("Rotarix");
    expect(html).not.toContain("Hẹn");
    expect(html).not.toContain("Chưa chọn loại");
  });

  it("past the age limit: the ask-a-doctor sentence", () => {
    const html = render(
      item("overdue", { pastMaxAge: true, dose: { program: "dich_vu" } }),
    );
    expect(html).toContain('<span class="text-[13px] text-muted">Dịch vụ</span>');
    expect(html).toContain(
      '<span class="text-[13px] text-danger">Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ.</span>',
    );
  });

  it("done: the program only, no date and no note", () => {
    const given = (given_on: string | null) =>
      item("done", {
        record: {
          vaccine_code: "rotarix",
          dose_no: 1,
          status: "done",
          given_on,
          due_on_override: null,
        },
      });
    const html = render(given("2026-11-15"));
    expect(html).toBe(
      '<span class="text-[13px] text-muted">Tiêm chủng mở rộng</span>',
    );
    expect(render(given(null))).toBe(html);
  });

  it("skipped: the program, the note still shown", () => {
    const html = render(item("skipped"));
    expect(html).toContain(">Tiêm chủng mở rộng</span>");
    expect(html).not.toContain("bỏ qua");
    expect(html).toContain(">Uống trước 24 tuần tuổi.</span>");
  });

  it("no pending mark", () => {
    expect(render(item("later"))).not.toContain(ICON_PATHS.clock);
  });
});

describe("the old list by state", () => {
  it("is gone: no DoseSections, no STATE_SECTIONS", () => {
    expect(existsSync("components/vaccines/DoseSections.tsx")).toBe(false);
    expect(Object.keys(vaccines)).not.toContain("STATE_SECTIONS");
  });
});

describe("VaccineSourceRow", () => {
  it("a book row that opens a sheet with the full source note", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <VaccineSourceRow text="Lịch tham khảo theo Thông tư." />
      </QueryClientProvider>,
    );
    expect(html).toContain(">Nguồn lịch tiêm</span>");
    expect(html).toContain(`d="${ICON_PATHS.book}"`);
    expect(html).toContain("<dialog");
    expect(html).toContain(">Lịch tham khảo theo Thông tư.</p>");
  });
});
