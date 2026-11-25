import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ReportScreen } from "./ReportScreen";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
  sex: "male",
  vaccine_choices: {},
} as unknown as Baby;

describe("ReportScreen", () => {
  it("screen controls stay off paper: header, 7/14 days, a print button and skeletons while loading", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ReportScreen baby={baby} />
      </QueryClientProvider>,
    );
    expect(html).toContain("print:hidden");
    expect(html).toContain('href="/suc-khoe"');
    expect(html).toContain(">Báo cáo cho bác sĩ</h1>");
    expect(html).toContain('aria-label="Khoảng thời gian"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>7 ngày<\/button>/);
    expect(html).toContain(`d="${ICON_PATHS.doc}"`);
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*>(?:(?!<button)[\s\S])*In \/ Lưu PDF<\/button>/,
    );
    expect(html).toContain("kb-pulse");
    expect(html).not.toContain("bg-soft");
    expect(html).not.toContain("Đang tải dữ liệu…");
  });
});
