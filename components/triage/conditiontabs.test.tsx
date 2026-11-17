import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONDITIONS } from "@/lib/content/conditions";
import type { Suggestion } from "@/lib/rules/symptoms";
import { ConditionTabs, nextTabIndex } from "./ConditionTabs";

const article = (code: string) => {
  const found = CONDITIONS.articles.find((a) => a.code === code);
  if (!found) throw new Error(code);
  return found;
};

const suggestions: Suggestion[] = [
  {
    article: article("cam_lanh"),
    matched: ["Sốt hoặc sờ thấy nóng", "Ho"],
    score: 1,
  },
  { article: article("croup"), matched: ["Ho"], score: 0.5 },
];

describe("ConditionTabs (spec 2026-11-17 §6.2)", () => {
  const html = renderToStaticMarkup(
    <ConditionTabs suggestions={suggestions} />,
  );

  it("says it is a suggestion, not a diagnosis", () => {
    expect(html).toContain(">Có thể bé đang bị</h2>");
    expect(html).toContain(
      "Gợi ý theo triệu chứng đã chọn, không phải chẩn đoán.",
    );
  });

  it("is a tab list with one 44 px tab per suggestion, short names, first selected", () => {
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Bệnh có thể gặp"');
    expect(html.match(/role="tab"/g)).toHaveLength(2);
    expect(html).toMatch(/aria-selected="true"[^>]*>Cảm lạnh<\/button>/);
    expect(html).toMatch(/aria-selected="false"[^>]*>Croup<\/button>/);
    expect(html).toContain("min-h-11");
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  });

  it("shows the selected article in full in the tab panel", () => {
    const first = article("cam_lanh");
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("Khớp: Sốt hoặc sờ thấy nóng, Ho");
    expect(html).toContain(first.summary);
    for (const heading of [
      "Dấu hiệu",
      "Chăm tại nhà",
      "Nên đi khám",
      "Đi khám ngay",
    ])
      expect(html).toContain(`>${heading}</h3>`);
    expect(html).toContain(`href="${first.source}"`);
    expect(html).toContain("Thường kéo dài: ");
    expect(html).toContain("bg-danger-soft");
    expect(html).toContain("text-danger-ink");
  });

  it("renders nothing without suggestions", () => {
    expect(renderToStaticMarkup(<ConditionTabs suggestions={[]} />)).toBe("");
  });
});

describe("nextTabIndex", () => {
  it("wraps with the arrows and jumps with Home and End", () => {
    expect(nextTabIndex(0, "ArrowRight", 3)).toBe(1);
    expect(nextTabIndex(2, "ArrowRight", 3)).toBe(0);
    expect(nextTabIndex(0, "ArrowLeft", 3)).toBe(2);
    expect(nextTabIndex(1, "Home", 3)).toBe(0);
    expect(nextTabIndex(1, "End", 3)).toBe(2);
    expect(nextTabIndex(1, "Enter", 3)).toBeNull();
  });
});
