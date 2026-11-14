import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { MilestoneSheet } from "./MilestoneSheet";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;
const row = {
  id: "m1",
  baby_id: "b1",
  milestone_code: "smile",
  achieved_on: "2026-11-01",
  note: "cười với mẹ",
  photo_id: null,
  created_by: "u1",
  created_at: "2026-11-01T00:00:00.000Z",
} as MilestoneRow;

const render = (r: MilestoneRow | null) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <MilestoneSheet
        code="smile"
        title="Cười đáp lại"
        row={r}
        baby={baby}
        userId="u1"
        onClose={() => {}}
      />
    </QueryClientProvider>,
  );

describe("MilestoneSheet", () => {
  it("new: date and note in a glass sheet with Lưu, nothing to unmark", () => {
    const html = render(null);
    expect(html).toContain("<dialog");
    expect(html).toContain(">Cười đáp lại</h2>");
    expect(html).toContain(">Ngày đạt</span>");
    expect(html).toContain('min="2026-09-10"');
    expect(html).toContain(">Ghi chú (không bắt buộc)</span>");
    expect(html).toContain("<textarea");
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Bỏ đánh dấu");
    expect(html).not.toContain("Hủy");
  });

  it("already marked: keeps date and note, offers Bỏ đánh dấu", () => {
    const html = render(row);
    expect(html).toContain('value="2026-11-01"');
    expect(html).toContain(">cười với mẹ</textarea>");
    expect(html).toContain(">Bỏ đánh dấu</button>");
    expect(html).toContain("text-danger!");
  });
});
