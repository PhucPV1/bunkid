import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hostElements } from "@/components/ui/testTree";
import { ICON_PATHS } from "@/lib/ui/icons";
import { TabBarView } from "./TabBar";

describe("TabBarView", () => {
  it("is a floating glass pill with three icon tabs", () => {
    const html = renderToStaticMarkup(<TabBarView current="history" />);
    expect(html).toContain('aria-label="Điều hướng chính"');
    expect(html).toContain("glass-strong");
    expect(html).toContain("h-[62px]");
    expect(html).toContain(
      "bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)]",
    );
    expect(html).toContain("print:hidden");
    expect(html.match(/<a /g)).toHaveLength(3);
    for (const name of ["home", "list", "explore"] as const)
      expect(html).toContain(`d="${ICON_PATHS[name]}"`);
    expect(html).toContain(">Hôm nay</a>");
    expect(html).toContain(">Khám phá</a>");
  });

  it("marks only the current tab", () => {
    // <Link> is a component, not an <a> host element, so read the rendered HTML instead.
    const anchors = renderToStaticMarkup(<TabBarView current="history" />)
      .split("<a ")
      .slice(1);
    expect(anchors.map((a) => a.includes('aria-current="page"'))).toEqual([
      false,
      true,
      false,
    ]);
    expect(anchors[1]).toContain("bg-accent-tint text-accent-text");
    expect(anchors[0]).not.toContain("bg-accent-tint");
  });

  it("has no + button until a handler is given", () => {
    expect(renderToStaticMarkup(<TabBarView current="home" />)).not.toContain(
      "<button",
    );
  });

  it("shows + to open and × to close, and reports presses", () => {
    const onPlus = vi.fn();
    const closed = renderToStaticMarkup(
      <TabBarView current="home" onPlus={onPlus} />,
    );
    expect(closed).toContain('aria-label="Ghi lại"');
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("size-[62px]");
    expect(closed).toContain("bg-accent text-on-accent");
    expect(closed).toContain(`d="${ICON_PATHS.plus}"`);
    const open = renderToStaticMarkup(
      <TabBarView current="home" onPlus={onPlus} plusOpen />,
    );
    expect(open).toContain('aria-label="Đóng"');
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain("bg-ink text-bg");
    expect(open).toContain(`d="${ICON_PATHS.close}"`);
    const [button] = hostElements(
      TabBarView({ current: "home", onPlus }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onPlus).toHaveBeenCalledOnce();
  });
  it("sits below the old z-20 sheets and dims while the action sheet is open", () => {
    const closed = renderToStaticMarkup(
      <TabBarView current="home" onPlus={() => {}} />,
    );
    expect(closed).toContain(" z-10 ");
    expect(closed).not.toContain("z-20");
    expect(closed).not.toContain("opacity-60");
    const open = renderToStaticMarkup(
      <TabBarView current="home" onPlus={() => {}} plusOpen />,
    );
    expect(open).toContain("opacity-60");
  });
});
