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

  it("bottle starts from the latest amount, or empty when there is none", () => {
    expect(render({ type: "bottle", recentLogs: [bottle] })).toContain(
      'value="120"',
    );
    const empty = render({ type: "bottle" });
    expect(empty).toContain('placeholder="0"');
    expect(empty).not.toContain('value="120"');
    expect(
      render({ type: "bottle", recentLogs: [bottle], initial: { ml: "60" } }),
    ).toContain('value="60"');
  });

  it("opens each type with its own fields", () => {
    expect(render({ type: "diaper" })).toMatch(
      /aria-pressed="true"[^>]*>Ướt<\/button>/,
    );
    expect(render({ type: "temperature" })).toContain('placeholder="––,–"');
    const medicine = render({ type: "medicine" });
    expect(medicine).toContain(">Cho uống thuốc</h2>");
    expect(medicine).toContain(">Thuốc hạ sốt</span>");
  });

  it("solids: bowl chip, its fields with a recent-food chip, then the time chips", () => {
    const chao = {
      ...bottle,
      id: "s1",
      type: "solids",
      details: { food: "Cháo bí đỏ", amount: "some", isNew: false },
    } as LogRow;
    const html = render({ type: "solids", recentLogs: [chao] });
    expect(html).toContain(">Ăn dặm</h2>");
    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
    expect(html).toContain(`d="${ICON_PATHS.bowl}"`);
    expect(html).toContain(">Cháo bí đỏ</button>");
    expect(html.indexOf(">Phản ứng (nếu có)</span>")).toBeLessThan(
      html.indexOf(">Lúc nào?</span>"),
    );
  });

  it("spec 2026-11-27 §4.1: no symptom fields here; Lưu is never off up front", () => {
    const html = render({ type: "symptom", ageDays: 76 });
    expect(html).not.toContain(">Hay gặp</span>");
    expect(render({ type: "note" })).not.toMatch(
      /<button[^>]*type="submit"[^>]*disabled=""/,
    );
  });

  it("water, bath and note: own title and icon; bath has no field at all", () => {
    const water = render({ type: "water" });
    expect(water).toContain(">Uống nước</h2>");
    expect(water).toContain("bg-cat-pump/15 text-cat-pump");
    expect(water).toContain(`d="${ICON_PATHS.glass}"`);
    expect(water).toContain('aria-label="Thêm 10 ml"');
    const bath = render({ type: "bath" });
    expect(bath).toContain(">Tắm</h2>");
    expect(bath).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(bath).toContain(`d="${ICON_PATHS.bath}"`);
    expect(bath).not.toContain("<input");
    expect(bath).not.toContain("<textarea");
    expect(bath).toContain(">Lúc nào?</span>");
    const note = render({ type: "note" });
    expect(note).toContain(">Ghi chú</h2>");
    expect(note).toContain("bg-cat-tummy/15 text-cat-tummy");
    expect(note).toContain(`d="${ICON_PATHS.doc}"`);
    expect(note).toMatch(/<textarea[^>]*maxLength="500"/);
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

  it("shows the quick chips and leaves the presets out of Gần đây", () => {
    const dha = {
      ...bottle,
      id: "m1",
      type: "medicine",
      details: { name: "DHA", amount: 5, unit: "giọt", antipyretic: false },
    } as LogRow;
    const para = {
      ...bottle,
      id: "m2",
      type: "medicine",
      started_at: "2026-11-14T03:00:00.000Z",
      details: {
        name: "Paracetamol",
        amount: 2.5,
        unit: "ml",
        antipyretic: true,
      },
    } as LogRow;
    const html = render({ type: "medicine", recentLogs: [dha, para] });
    expect(html).toContain('aria-label="Chọn nhanh"');
    const recent = html.slice(html.indexOf('aria-label="Thuốc gần đây"'));
    expect(recent).toContain(">Paracetamol</button>");
    expect(recent).not.toContain(">DHA</button>");
  });
});
