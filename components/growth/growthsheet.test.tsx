import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GrowthRow } from "@/lib/supabase/rows";
import { GrowthSheet } from "./GrowthSheet";

const row = {
  id: "g1",
  baby_id: "b1",
  measured_on: "2026-11-01",
  weight_g: 5200,
  length_cm: 58.5,
  head_cm: null,
  created_by: "u1",
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z",
} as GrowthRow;

const render = (props: Partial<ComponentProps<typeof GrowthSheet>>) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <GrowthSheet
        babyId="b1"
        userId="u1"
        dob="2026-09-10"
        row={null}
        canDelete={false}
        onClose={() => {}}
        {...props}
      />
    </QueryClientProvider>,
  );

describe("GrowthSheet", () => {
  it("new measurement: date and three decimal fields, Lưu, nothing to delete", () => {
    const html = render({});
    expect(html).toContain("<dialog");
    expect(html).toContain(">Thêm lần đo</h2>");
    expect(html).toContain(">Ngày đo</span>");
    expect(html).toContain('min="2026-09-10"');
    expect(html).toContain(">Cân nặng (kg, ví dụ 5,2)</span>");
    expect(html).toContain(">Vòng đầu (cm)</span>");
    expect(html.match(/inputMode="decimal"/g)).toHaveLength(3);
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(formId).toBeTruthy();
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Xóa lần đo");
    expect(html).not.toContain("Hủy");
  });

  it("editing: values filled in, and Xóa lần đo for whoever may delete", () => {
    const html = render({ row, canDelete: true });
    expect(html).toContain(">Sửa lần đo</h2>");
    expect(html).toContain('value="2026-11-01"');
    expect(html).toContain('value="5,2"');
    expect(html).toContain('value="58,5"');
    expect(html).toContain(">Xóa lần đo</button>");
    expect(html).toContain("text-danger!");
    expect(render({ row, canDelete: false })).not.toContain("Xóa lần đo");
  });
});
