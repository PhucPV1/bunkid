import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { COMPACT_AFTER_PX, PageHeader, PageHeaderView } from "./PageHeader";

describe("PageHeaderView", () => {
  it("shows a 34 pt large title and hides the compact bar at the top", () => {
    const html = renderToStaticMarkup(
      <PageHeaderView title="Khám phá" compact={false} />,
    );
    expect(html).toContain(
      '<h1 class="text-[34px] leading-[41px] font-bold text-ink">Khám phá</h1>',
    );
    expect(html).toContain("pointer-events-none opacity-0");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<a ");
  });

  it("shows the compact glass bar once scrolled", () => {
    const html = renderToStaticMarkup(
      <PageHeaderView title="Khám phá" compact />,
    );
    expect(html).toContain("glass-strong");
    expect(html).toContain("opacity-100");
    expect(html).toContain("h-[calc(env(safe-area-inset-top)+44px)]");
    expect(html).toContain(">Khám phá</span>");
    expect(html).toContain("duration-[160ms]");
  });

  it("a child page has a back pill and a right-side action", () => {
    const html = renderToStaticMarkup(
      <PageHeaderView
        title="Cài đặt"
        back={{ href: "/", label: "Hôm nay" }}
        action={<button type="button">Thêm</button>}
        compact={false}
      />,
    );
    expect(html).toContain('href="/"');
    expect(html).toContain(`d="${ICON_PATHS.chevronLeft}"`);
    expect(html).toContain("Hôm nay</a>");
    expect(html).toContain("min-h-11");
    expect(html).toContain('<button type="button">Thêm</button>');
  });
});

describe("PageHeader", () => {
  it("starts expanded and compacts after 40 px", () => {
    expect(COMPACT_AFTER_PX).toBe(40);
    expect(renderToStaticMarkup(<PageHeader title="Khám phá" />)).toContain(
      "opacity-0",
    );
  });
});
