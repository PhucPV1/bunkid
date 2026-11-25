import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HEALTH_CARDS, TOOLS } from "@/lib/nav";
import { ICON_PATHS } from "@/lib/ui/icons";
import { NavCard } from "./NavCard";

const [VACCINE] = HEALTH_CARDS;
const LINE = "line-clamp-2 text-[13px] leading-[18px]";

// Spec 2026-11-25 §3.4 and §3.5.
describe("NavCard", () => {
  it("is a glass link with a tinted round icon, the name and the description", () => {
    const html = renderToStaticMarkup(<NavCard item={TOOLS[0]} />);
    expect(html).toContain(
      '<a class="glass flex flex-col gap-1.5 rounded-[26px] p-4 text-ink min-h-32" href="/on-trang">',
    );
    expect(html).toContain(
      "flex size-9 items-center justify-center rounded-full bg-cat-sleep/15 text-cat-sleep",
    );
    expect(html).toContain(`d="${ICON_PATHS.wave}"`);
    expect(html).toContain('<span class="text-base font-bold">Ồn trắng</span>');
    expect(html).toContain(
      `<span class="${LINE} text-muted">Tiếng ồn đều giúp bé dễ ngủ</span>`,
    );
  });

  it("short cards are 112 px tall at least", () => {
    const html = renderToStaticMarkup(<NavCard item={VACCINE} short />);
    expect(html).toContain("p-4 text-ink min-h-28");
    expect(html).not.toContain("min-h-32");
  });

  it("a live line replaces the description", () => {
    const html = renderToStaticMarkup(
      <NavCard item={VACCINE} live={{ text: "10/12 · Sởi", warn: false }} />,
    );
    expect(html).toContain(
      `<span class="${LINE} text-muted">10/12 · Sởi</span>`,
    );
    expect(html).not.toContain(VACCINE.detail);
  });

  it("a warning live line is semibold in the warn colour", () => {
    const html = renderToStaticMarkup(
      <NavCard item={VACCINE} live={{ text: "Quá hạn: Sởi", warn: true }} />,
    );
    expect(html).toContain(
      `<span class="${LINE} font-semibold text-warn">Quá hạn: Sởi</span>`,
    );
  });

  it("a live line with no text yet keeps the description", () => {
    const html = renderToStaticMarkup(
      <NavCard item={VACCINE} live={{ text: null, warn: false }} />,
    );
    expect(html).toContain(
      `<span class="${LINE} text-muted">${VACCINE.detail}</span>`,
    );
  });
});
