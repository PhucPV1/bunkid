import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
import type { Baby } from "@/lib/supabase/rows";
import { SymptomDaySheet } from "./SymptomDaySheet";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;
const wrap = (node: ReactNode) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>{node}</ToastProvider>
    </QueryClientProvider>,
  );

// Spec 2026-11-27 §4 and §5: the sheet reads the day's logs itself.
describe("SymptomDaySheet", () => {
  it("without a day: the strip, today picked, waiting for the logs", () => {
    const html = wrap(
      <SymptomDaySheet
        baby={baby}
        userId="u1"
        canModify={() => true}
        onClose={() => {}}
      />,
    );
    expect(html).toContain(">Triệu chứng</h2>");
    expect(html).toContain('role="group" aria-label="Ngày nào?"');
    expect(html).toMatch(/aria-pressed="true"[^>]*><span[^>]*>Hôm nay<\/span>/);
    expect(html).toContain(">Đang tải…</p>");
    expect(html).not.toContain(">Lúc nào?</span>");
  });

  it("a fixed day: its title and line, no strip", () => {
    const html = wrap(
      <SymptomDaySheet
        baby={baby}
        userId="u1"
        canModify={() => true}
        day="2026-11-25"
        sub="Cả ngày"
        onClose={() => {}}
      />,
    );
    expect(html).toContain(">Triệu chứng · 25/11</h2>");
    expect(html).toContain(">Cả ngày</p>");
    expect(html).not.toContain('aria-label="Ngày nào?"');
  });
});
