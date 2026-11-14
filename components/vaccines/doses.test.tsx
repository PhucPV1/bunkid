import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import { ICON_PATHS } from "@/lib/ui/icons";
import { DoseSections } from "./DoseSections";
import { VaccineSourceRow } from "./VaccineSourceRow";

const item = (code: string, state: string, over: Partial<ScheduleItem> = {}) =>
  ({
    dose: {
      code,
      doseNo: 1,
      name: `Mũi ${code}`,
      protects: ["X"],
      program: "tcmr",
    },
    due: "2026-11-20",
    state,
    record: null,
    unchosen: false,
    pastMaxAge: false,
    ...over,
  }) as unknown as ScheduleItem;

describe("DoseSections", () => {
  it("one glass group per state with a count, rows with name, date and labels", () => {
    const items = [
      item("bcg", "overdue"),
      item("rota", "overdue", { unchosen: true, pastMaxAge: true }),
      item("mmr", "later"),
    ];
    const html = renderToStaticMarkup(
      <DoseSections
        items={items}
        pending={new Set(["bcg#1"])}
        onOpen={() => {}}
      />,
    );
    expect(html).toContain(">Quá hạn (2)</h2>");
    expect(html).toContain(">Sau này (1)</h2>");
    expect(html).not.toContain("Đã tiêm (");
    expect(html.match(/class="glass/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain(">Mũi bcg ");
    expect(html).toContain("Hẹn ");
    expect(html).toContain("Tiêm chủng mở rộng");
    expect(html).toContain(">Chưa chọn loại</span>");
    expect(html).toContain("Đã quá tuổi khuyến cáo");
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
  });

  it("opens the tapped dose", () => {
    const onOpen = vi.fn();
    const items = [item("bcg", "upcoming")];
    const [row] = findElements(
      DoseSections({ items, pending: new Set(), onOpen }),
      (el) => el.type === "button",
    );
    (row.props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledWith(items[0]);
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
