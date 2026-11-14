import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { QuickEntrySheet } from "./QuickEntrySheet";

const bottle = {
  id: "b1",
  baby_id: "b",
  type: "bottle",
  started_at: "2026-11-14T04:00:00.000Z",
  ended_at: "2026-11-14T04:00:00.000Z",
  details: { ml: 120, milk: "formula" },
  note: null,
  created_by: "u1",
  created_at: "2026-11-14T04:00:00.000Z",
  updated_at: "2026-11-14T04:00:00.000Z",
} as LogRow;

const render = (
  props: Partial<ComponentProps<typeof QuickEntrySheet>> & {
    type: ComponentProps<typeof QuickEntrySheet>["type"];
  },
) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <QuickEntrySheet babyId="b" userId="u1" onClose={() => {}} {...props} />
    </QueryClientProvider>,
  );

describe("QuickEntrySheet", () => {
  it("is a glass sheet with the category chip, time chips and a 56 px Lưu that submits the form", () => {
    const html = render({ type: "bottle", recentLogs: [bottle] });
    expect(html).toContain("<dialog");
    expect(html).toContain(">Bú bình</h2>");
    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
    expect(html).toContain(`d="${ICON_PATHS.bottle}"`);
    expect(html).toContain(">120 ml</button>");
    expect(html).toContain(">Lúc nào?</span>");
    expect(html).toMatch(/aria-pressed="true"[^>]*>Bây giờ<\/button>/);
    expect(html).not.toContain('type="datetime-local"');
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(formId).toBeTruthy();
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Hủy");
    expect(html).not.toContain("rounded-xl border");
  });

  it("opens each type with its own fields", () => {
    expect(render({ type: "diaper" })).toMatch(
      /aria-pressed="true"[^>]*>Ướt<\/button>/,
    );
    expect(render({ type: "temperature" })).toContain('placeholder="37,0"');
    const medicine = render({ type: "medicine" });
    expect(medicine).toContain(">Cho uống thuốc</h2>");
    expect(medicine).toContain(">Thuốc hạ sốt</span>");
  });

  it("keeps the Vitamin D prefill", () => {
    const html = render({
      type: "medicine",
      initial: {
        name: "Vitamin D",
        amount: "1",
        unit: "giọt",
        antipyretic: false,
      },
    });
    expect(html).toContain('value="Vitamin D"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>giọt<\/button>/);
    expect(html).toContain('aria-checked="false"');
  });
});
