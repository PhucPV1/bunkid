import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { Button, buttonClass } from "./Button";
import { Glass } from "./Glass";
import { IconButton } from "./IconButton";

describe("Glass", () => {
  it("is a glass card by default", () => {
    expect(renderToStaticMarkup(<Glass>x</Glass>)).toBe(
      '<div class="glass rounded-[28px]">x</div>',
    );
  });

  it("takes strong glass, a radius, a tag and extra props", () => {
    const html = renderToStaticMarkup(
      <Glass
        strong
        radius="sheet"
        as="section"
        className="p-4"
        aria-label="Khối"
      >
        x
      </Glass>,
    );
    expect(html).toBe(
      '<section aria-label="Khối" class="glass-strong rounded-[38px] p-4">x</section>',
    );
  });
});

describe("Button", () => {
  it("defaults to a large primary pill of type button", () => {
    const html = renderToStaticMarkup(<Button>Lưu</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain("bg-accent text-on-accent");
    expect(html).toContain("min-h-[50px]");
    expect(html).toContain("rounded-full");
    expect(html).toContain(">Lưu</button>");
  });

  it("supports every variant and the medium size", () => {
    expect(buttonClass({ variant: "secondary" })).toContain("glass text-ink");
    expect(buttonClass({ variant: "ghost" })).toContain("text-accent-text");
    expect(
      buttonClass({ variant: "danger", size: "md", block: true }),
    ).toContain("bg-danger-solid text-on-danger");
    expect(buttonClass({ size: "md" })).toContain("min-h-11");
    expect(buttonClass({ block: true })).toContain("w-full");
    expect(buttonClass()).not.toContain("w-full");
  });

  it("busy disables only this button and marks it busy", () => {
    const html = renderToStaticMarkup(
      <Button busy type="submit">
        Lưu
      </Button>,
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("opacity-60");
  });

  it("passes the click handler through", () => {
    const onClick = vi.fn();
    const element = Button({ onClick, children: "x" });
    (element.props as { onClick: () => void }).onClick();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("IconButton", () => {
  it("is a 44 pt round glass button named by its label", () => {
    const html = renderToStaticMarkup(
      <IconButton label="Khẩn cấp" icon="phone" />,
    );
    expect(html).toContain('aria-label="Khẩn cấp"');
    expect(html).toContain('type="button"');
    expect(html).toContain("size-11");
    expect(html).toContain("glass text-ink");
    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
  });

  it("has a small 36 pt size, other variants and aria-pressed", () => {
    const html = renderToStaticMarkup(
      <IconButton
        label="Ban đêm"
        icon="moon"
        small
        filled
        variant="accent"
        aria-pressed
      />,
    );
    expect(html).toContain("size-9");
    expect(html).toContain("bg-accent text-on-accent");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('fill="currentColor"');
  });
});
