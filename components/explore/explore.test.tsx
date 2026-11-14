import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EXPLORE_EMERGENCY,
  EXPLORE_GUIDES,
  EXPLORE_REPORT,
  EXPLORE_SOOTHE,
  EXPLORE_TRACK,
} from "@/lib/nav";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ExploreScreen } from "./ExploreScreen";

const html = renderToStaticMarkup(<ExploreScreen />);

describe("ExploreScreen", () => {
  it("has a large title and the four section headings in spec order", () => {
    expect(html).toContain(">Khám phá</h1>");
    const order = [
      "Khẩn cấp",
      "Theo dõi",
      "Cẩm nang",
      "Dỗ bé và kỷ niệm",
      "Báo cáo cho bác sĩ",
    ].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("starts with the red emergency card", () => {
    expect(html).toContain(`href="${EXPLORE_EMERGENCY.href}"`);
    expect(html).toContain(EXPLORE_EMERGENCY.detail);
    expect(html).toContain("bg-danger-solid text-on-danger");
    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
  });

  it("links every item with its icon", () => {
    for (const item of [
      ...EXPLORE_TRACK,
      ...EXPLORE_GUIDES,
      ...EXPLORE_SOOTHE,
      EXPLORE_REPORT,
    ]) {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(`d="${ICON_PATHS[item.icon]}"`);
      expect(html).toContain(`>${item.label}<`);
    }
  });

  it("track cards are a two-column grid of glass cards with tinted icons", () => {
    expect(html).toContain("grid grid-cols-2");
    expect(html).toContain("bg-cat-sleep/15 text-cat-sleep");
    expect(html).toContain("min-h-32");
  });
});
