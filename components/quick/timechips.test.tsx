import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TimeChip } from "@/lib/rules/timeChips";
import { TimeChips } from "./TimeChips";

const noop = () => {};
const render = (chip: TimeChip) =>
  renderToStaticMarkup(
    <TimeChips
      chip={chip}
      custom="2026-11-14T08:30"
      onChip={noop}
      onCustom={noop}
    />,
  );

describe("TimeChips", () => {
  it("shows all four choices as equal segments, nothing to scroll", () => {
    const html = render("now");
    expect(html).toContain(">Lúc nào?</span>");
    expect(html).toContain('role="group" aria-label="Lúc nào?"');
    expect(html).toContain("grid-template-columns:repeat(4, minmax(0, 1fr))");
    expect(html.match(/<button/g)).toHaveLength(4);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Bây giờ<\/button>/);
    expect(html).toContain(">5p trước</button>");
    expect(html).toContain(">15p trước</button>");
    expect(html).toContain(">Giờ khác</button>");
    expect(html).not.toContain("overflow-x-auto");
    expect(html).not.toContain('type="datetime-local"');
  });

  it("Giờ khác opens the date and time field", () => {
    const html = render("custom");
    expect(html).toMatch(/aria-pressed="true"[^>]*>Giờ khác<\/button>/);
    expect(html).toMatch(/type="datetime-local"[^>]*value="2026-11-14T08:30"/);
  });
});
