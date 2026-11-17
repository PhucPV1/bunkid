import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { LogEditSheet } from "./LogEditSheet";

const diaper = {
  id: "d1",
  baby_id: "b1",
  type: "diaper",
  started_at: "2026-11-14T04:00:00.000Z",
  ended_at: "2026-11-14T04:00:00.000Z",
  details: { wet: true, dirty: false },
  note: "bé quấy",
  created_by: "u2",
  created_at: "2026-11-14T04:00:00.000Z",
  updated_at: "2026-11-14T04:00:00.000Z",
} as LogRow;

const render = (props: Partial<ComponentProps<typeof LogEditSheet>>) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <LogEditSheet
        babyId="b1"
        userId="u1"
        log={null}
        canModify
        who="Mẹ"
        recentLogs={[]}
        onClose={() => {}}
        {...props}
      />
    </QueryClientProvider>,
  );

describe("LogEditSheet", () => {
  it("new log: type picker, fields, start and end, Lưu, no delete", () => {
    const html = render({});
    expect(html).toContain("<dialog");
    expect(html).toContain(">Thêm bản ghi</h2>");
    expect(html).toContain("bg-cat-feed/15 text-cat-feed");
    expect(html).toContain(">Loại</span>");
    expect(html).toContain('<option value="temperature">Nhiệt độ</option>');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Trái<\/button>/);
    expect(html).toContain(">Bắt đầu</span>");
    expect(html).toContain(">Kết thúc</span>");
    expect(html.match(/type="datetime-local"/g)).toHaveLength(2);
    expect(html).toContain(">Ghi chú</span>");
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Xóa bản ghi");
    expect(html).not.toContain("Hủy");
  });

  it("own log: description, switches for the diaper, Lưu and Xóa bản ghi", () => {
    const html = render({ log: diaper });
    expect(html).toContain(">Bản ghi</h2>");
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain(`d="${ICON_PATHS.drop}"`);
    expect(html).toContain("11:00 · Tã ướt · Mẹ");
    expect(html.match(/role="switch"/g)).toHaveLength(2);
    expect(html).toContain(">Thời điểm</span>");
    expect(html).not.toContain(">Loại</span>");
    expect(html).toContain(">Xóa bản ghi</button>");
    expect(html).toContain("text-danger!");
  });

  it("someone else's log without rights: read only, no footer", () => {
    const html = render({ log: diaper, canModify: false });
    expect(html).toContain("<dialog");
    expect(html).toContain(
      "Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được.",
    );
    expect(html).toContain("Ghi chú: bé quấy");
    expect(html).not.toContain('type="submit"');
    expect(html).not.toContain("<input");
    expect(html).not.toContain("Xóa bản ghi");
  });

  it("new log: the type picker also offers the four new types", () => {
    const html = render({});
    expect(html).toContain('<option value="solids">Ăn dặm</option>');
    expect(html).toContain('<option value="water">Uống nước</option>');
    expect(html).toContain('<option value="bath">Tắm</option>');
    expect(html).toContain('<option value="note">Ghi chú</option>');
    expect(html.match(/<option /g)).toHaveLength(10);
  });

  it("a note log: Nội dung only, the sheet's own Ghi chú field is hidden", () => {
    const html = render({
      log: {
        ...diaper,
        id: "n1",
        type: "note",
        details: { text: "Bé cười nhiều" },
        note: null,
      } as LogRow,
    });
    expect(html).toContain("11:00 · Ghi chú · Bé cười nhiều · Mẹ");
    expect(html).toContain(`d="${ICON_PATHS.doc}"`);
    expect(html).toContain(">Nội dung</span>");
    expect(html).toContain(">Bé cười nhiều</textarea>");
    expect(html.match(/<textarea/g)).toHaveLength(1);
    expect(html).not.toContain(">Ghi chú</span>");
    expect(html).toContain(">Thời điểm</span>");
  });

  it("a solids log: quick-entry fields plus the usual Ghi chú", () => {
    const html = render({
      log: {
        ...diaper,
        id: "s1",
        type: "solids",
        details: { food: "Cháo bí đỏ", amount: "lots", isNew: true },
      } as LogRow,
    });
    expect(html).toContain(
      "11:00 · Ăn dặm · Cháo bí đỏ · nhiều · món mới · Mẹ",
    );
    expect(html).toMatch(/<input[^>]*maxLength="80"[^>]*value="Cháo bí đỏ"/);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Nhiều<\/button>/);
    expect(html).toContain(">Ghi chú</span>");
  });
});
