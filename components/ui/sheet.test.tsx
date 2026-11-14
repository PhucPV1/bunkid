import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { Sheet } from "./Sheet";

const noop = () => {};

describe("Sheet", () => {
  it("is a dialog labelled by its title, with handle, close button, body and footer", () => {
    const html = renderToStaticMarkup(
      <Sheet
        open
        title="Thay tã"
        icon="drop"
        iconColor="cat-diaper"
        onClose={noop}
        footer={<button>Lưu</button>}
      >
        <p>Thân</p>
      </Sheet>,
    );
    expect(html).toContain("<dialog");
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(">Thay tã</h2>");
    expect(html).toContain("data-sheet-handle");
    expect(html).toContain('aria-label="Đóng"');
    expect(html).toContain("size-9");
    expect(html).toContain(`d="${ICON_PATHS.drop}"`);
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain("<p>Thân</p>");
    expect(html).toContain(">Lưu</button>");
    expect(html).toContain("max-h-[88dvh] rounded-[38px]");
    expect(html).toContain("glass-strong");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("backdrop:bg-scrim");
    expect(html).not.toContain("Bỏ thay đổi?");
  });

  it("the floating variant has no handle and a smaller radius", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="Ghi lại cho Bun" variant="floating" onClose={noop}>
        x
      </Sheet>,
    );
    expect(html).not.toContain("data-sheet-handle");
    expect(html).toContain("rounded-[34px]");
  });

  it("slides in with the iOS curve", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="a" onClose={noop}>
        x
      </Sheet>,
    );
    expect(html).toContain(
      "animate-[kb-sheet-in_280ms_cubic-bezier(0.32,0.72,0,1)]",
    );
  });
});
