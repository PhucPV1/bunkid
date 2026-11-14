import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { STOOL_SWATCHES } from "@/lib/ui/tokens";
import { Swatch } from "./Swatch";
import { Switch } from "./Switch";
import { hostElements } from "./testTree";

describe("Switch", () => {
  it("is an iOS-sized switch button with its state", () => {
    const on = renderToStaticMarkup(
      <Switch checked label="Nhắc cữ bú" onChange={() => {}} />,
    );
    expect(on).toContain('role="switch"');
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain('aria-label="Nhắc cữ bú"');
    expect(on).toContain("h-[31px] w-[51px]");
    expect(on).toContain("after:-inset-[7px]");
    expect(on).toContain("bg-switch-on");
    expect(on).toContain("left-[22px]");
    const off = renderToStaticMarkup(
      <Switch checked={false} label="x" onChange={() => {}} />,
    );
    expect(off).toContain('aria-checked="false"');
    expect(off).toContain("bg-muted/30");
    expect(off).toContain("left-[2px]");
  });

  it("asks for the opposite state when pressed", () => {
    const onChange = vi.fn();
    const [button] = hostElements(
      Switch({ checked: true, label: "x", onChange }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("can be disabled", () => {
    expect(
      renderToStaticMarkup(
        <Switch checked label="x" disabled onChange={() => {}} />,
      ),
    ).toContain('disabled=""');
  });
});

describe("Swatch", () => {
  it("paints the real colour and shows the label", () => {
    const html = renderToStaticMarkup(
      <Swatch
        color={STOOL_SWATCHES.yellow}
        label="Vàng"
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(html).toContain(`background:${STOOL_SWATCHES.yellow}`);
    expect(html).toContain(">Vàng</span>");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("size-11 rounded-full");
  });

  it("rings the selected swatch, dashes the empty one, outlines on request", () => {
    expect(
      renderToStaticMarkup(
        <Swatch
          color={STOOL_SWATCHES.black}
          label="Đen"
          selected
          outlined
          onSelect={() => {}}
        />,
      ),
    ).toContain("ring-2 ring-accent-text ring-offset-[3px] ring-offset-bg");
    expect(
      renderToStaticMarkup(
        <Swatch
          color={STOOL_SWATCHES.black}
          label="Đen"
          selected={false}
          outlined
          onSelect={() => {}}
        />,
      ),
    ).toContain("border border-muted");
    const none = renderToStaticMarkup(
      <Swatch color={null} label="Không ghi" selected onSelect={() => {}} />,
    );
    expect(none).toContain("border-2 border-dashed border-muted");
    expect(none).not.toContain("background:");
  });

  it("calls onSelect when pressed", () => {
    const onSelect = vi.fn();
    const [button] = hostElements(
      Swatch({ color: null, label: "x", selected: false, onSelect }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
