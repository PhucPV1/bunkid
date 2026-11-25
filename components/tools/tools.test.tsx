import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HEALTH_CARDS, HEALTH_SICK, TOOLS } from "@/lib/nav";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ToolsScreen } from "./ToolsScreen";

// Spec 2026-11-25 §3.5.
describe("ToolsScreen", () => {
  const html = renderToStaticMarkup(<ToolsScreen />);

  it("has the large title and no back link", () => {
    expect(html).toContain(">Tiện ích</h1>");
    expect(html).not.toContain(ICON_PATHS.chevronLeft);
  });

  it("is one two-column grid of four tall cards, in spec order", () => {
    expect(html.match(/grid grid-cols-2 gap-2\.5/g)).toHaveLength(1);
    expect(html.match(/min-h-32/g)).toHaveLength(4);
    const order = TOOLS.map((item) => html.indexOf(`href="${item.href}"`));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("each card has its icon, name and description", () => {
    for (const item of TOOLS) {
      expect(html).toContain(`d="${ICON_PATHS[item.icon]}"`);
      expect(html).toContain(`>${item.label}</span>`);
      expect(html).toContain(`>${item.detail}</span>`);
    }
  });

  it("links none of the Sức khỏe pages", () => {
    for (const item of [...HEALTH_CARDS, ...HEALTH_SICK])
      expect(html).not.toContain(`href="${item.href}"`);
  });
});
