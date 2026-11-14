import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandMark } from "@/components/brand/BrandMark";
import { GOOGLE_BUTTON, GOOGLE_G_COLORS } from "@/lib/ui/tokens";
import { GoogleButton } from "./GoogleButton";

describe("BrandMark", () => {
  it("lg: a 96 px logo, a 34 px rounded wordmark h1 and the tagline", () => {
    const html = renderToStaticMarkup(
      <BrandMark tagline="Nhật ký chăm bé của cả nhà" />,
    );
    expect(html).toContain('src="/icons/icon.svg"');
    expect(html).toContain('width="96"');
    expect(html).toMatch(
      /<h1[^>]*font-rounded[^>]*text-\[34px\][^>]*>Kim Bun<\/h1>/,
    );
    expect(html).toContain("font-extrabold");
    expect(html).toContain(">Nhật ký chăm bé của cả nhà</p>");
  });

  it("md without heading: 64 px logo, 28 px wordmark in a paragraph", () => {
    const html = renderToStaticMarkup(<BrandMark size="md" heading={false} />);
    expect(html).toContain('width="64"');
    expect(html).toMatch(/<p[^>]*text-\[28px\][^>]*>Kim Bun<\/p>/);
    expect(html).not.toContain("<h1");
  });
});

describe("GoogleButton", () => {
  it("Google's light and dark colours from tokens, a glass ink version at night, a four-colour G", () => {
    const html = renderToStaticMarkup(<GoogleButton onClick={() => {}} />);
    expect(html).toContain(`--gb-bg:${GOOGLE_BUTTON.light.bg}`);
    expect(html).toContain(`--gb-border:${GOOGLE_BUTTON.light.border}`);
    expect(html).toContain(`--gb-text:${GOOGLE_BUTTON.light.text}`);
    expect(html).toContain(`--gb-bg-dark:${GOOGLE_BUTTON.dark.bg}`);
    expect(html).toContain(`--g-blue:${GOOGLE_G_COLORS.blue}`);
    expect(html).toContain("bg-(--gb-bg)");
    expect(html).toContain("in-data-[theme=dark]:bg-(--gb-bg-dark)");
    expect(html).toContain("in-data-[theme=night]:bg-glass");
    expect(html).toContain("in-data-[theme=night]:text-ink");
    // On the svg, not the button: the button's inline style would win over its own class.
    expect(html).toMatch(/<svg[^>]*in-data-\[theme=night\]:\[--g-red:currentColor\]/);
    expect(
      html.match(/fill="var\(--g-(blue|green|yellow|red)\)"/g),
    ).toHaveLength(4);
    expect(html).toContain("Đăng nhập bằng Google</button>");
    expect(html).toContain("min-h-[50px]");
  });
});
