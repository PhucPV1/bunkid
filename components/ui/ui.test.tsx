import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { Backdrop } from "./Backdrop";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("draws the named path as a decorative outline", () => {
    const html = renderToStaticMarkup(<Icon name="heart" />);
    expect(html).toContain(`d="${ICON_PATHS.heart}"`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('fill="none"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('width="22"');
    expect(html).toContain('stroke-width="2"');
  });

  it("fills solid icons and takes a size", () => {
    const html = renderToStaticMarkup(
      <Icon name="stop" filled size={18} className="x" />,
    );
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('width="18"');
    expect(html).toContain('class="x"');
  });
});

describe("Backdrop", () => {
  it("is one hidden layer with three colour blobs", () => {
    const html = renderToStaticMarkup(<Backdrop />);
    expect(html).toContain("data-backdrop");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("bg-blob-1");
    expect(html).toContain("bg-blob-2");
    expect(html).toContain("bg-blob-3");
    expect(html).toContain("print:hidden");
  });
});
