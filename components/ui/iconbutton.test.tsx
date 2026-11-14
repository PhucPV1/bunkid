import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { IconButton } from "./IconButton";

describe("IconButton large", () => {
  it("is a 64 px circle with a 28 px icon", () => {
    const html = renderToStaticMarkup(
      <IconButton label="Phát" icon="play" large filled variant="accent" />,
    );
    expect(html).toContain("size-16");
    expect(html).toContain('width="28"');
    expect(html).toContain(`d="${ICON_PATHS.play}"`);
    expect(html).toContain('aria-label="Phát"');
    expect(html).not.toContain("size-11");
  });
});
