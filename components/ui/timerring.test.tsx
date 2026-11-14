import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CATEGORY_CHIP } from "@/lib/ui/categories";
import { RING_CIRCUMFERENCE, TimerRing } from "./TimerRing";

describe("TimerRing", () => {
  it("draws a 200 px ring in the category colour over a 12% track", () => {
    const html = renderToStaticMarkup(
      <TimerRing token="cat-sleep" progress={0.25}>
        <span>12:00</span>
      </TimerRing>,
    );
    expect(html).toContain('width="200"');
    expect(html.match(/<circle/g)).toHaveLength(2);
    expect(html).toContain('stroke-width="12"');
    expect(html).toContain("stroke-cat-sleep/12");
    expect(html).toContain('class="stroke-cat-sleep"');
    expect(html).toContain(`stroke-dasharray="${RING_CIRCUMFERENCE}"`);
    expect(html).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE * 0.75}"`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<span>12:00</span>");
  });

  it("clamps progress to the ring", () => {
    const full = renderToStaticMarkup(
      <TimerRing token="cat-feed" progress={2}>
        x
      </TimerRing>,
    );
    expect(full).toContain('stroke-dashoffset="0"');
    const none = renderToStaticMarkup(
      <TimerRing token="cat-feed" progress={-1}>
        x
      </TimerRing>,
    );
    expect(none).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE}"`);
  });
});

describe("CATEGORY_CHIP", () => {
  it("tints every category with its own colour", () => {
    expect(CATEGORY_CHIP["cat-feed"]).toBe("bg-cat-feed/15 text-cat-feed");
    expect(Object.keys(CATEGORY_CHIP)).toHaveLength(8);
  });
});
