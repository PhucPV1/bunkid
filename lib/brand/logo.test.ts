import { describe, expect, it } from "vitest";
import { ICON_FILES, iconFile, svgDataUri } from "./iconFiles";
import {
  LOGO_GRADIENT,
  LOGO_SVG_MASKABLE,
  LOGO_SVG_ROUNDED,
  LOGO_SVG_SQUARE,
} from "./logo";

const ALL = [LOGO_SVG_ROUNDED, LOGO_SVG_SQUARE, LOGO_SVG_MASKABLE];

describe("logo", () => {
  it("every variant is one ASCII-only SVG document", () => {
    for (const svg of ALL) {
      expect(
        svg.startsWith(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">',
        ),
      ).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      expect(/^[\x20-\x7E]*$/.test(svg)).toBe(true);
      expect(svg).toContain(`stop-color="${LOGO_GRADIENT.from}"`);
      expect(svg).toContain(`stop-color="${LOGO_GRADIENT.to}"`);
      expect(svg).toContain('fill="#FFC94A"');
    }
  });

  it("only the rounded variant has rounded corners", () => {
    expect(LOGO_SVG_ROUNDED).toContain('rx="27"');
    expect(LOGO_SVG_SQUARE).not.toContain("rx=");
    expect(LOGO_SVG_MASKABLE).not.toContain("rx=");
  });

  it("the maskable variant shrinks the artwork to 80% around the centre", () => {
    expect(LOGO_SVG_MASKABLE).toContain(
      '<g transform="translate(12 12) scale(0.8)">',
    );
    expect(LOGO_SVG_SQUARE).not.toContain("<g ");
  });
});

describe("icon files", () => {
  it("serves exactly the five icon URLs", () => {
    expect(Object.keys(ICON_FILES).sort()).toEqual([
      "apple-touch-icon.png",
      "icon-192.png",
      "icon-512.png",
      "icon.svg",
      "maskable-512.png",
    ]);
  });

  it("maps each file to its source and size", () => {
    expect(iconFile("icon.svg")).toEqual({
      contentType: "image/svg+xml",
      svg: LOGO_SVG_ROUNDED,
    });
    expect(iconFile("icon-192.png")).toEqual({
      contentType: "image/png",
      size: 192,
      svg: LOGO_SVG_SQUARE,
    });
    expect(iconFile("icon-512.png")).toEqual({
      contentType: "image/png",
      size: 512,
      svg: LOGO_SVG_SQUARE,
    });
    expect(iconFile("maskable-512.png")).toEqual({
      contentType: "image/png",
      size: 512,
      svg: LOGO_SVG_MASKABLE,
    });
    expect(iconFile("apple-touch-icon.png")).toEqual({
      contentType: "image/png",
      size: 180,
      svg: LOGO_SVG_SQUARE,
    });
  });

  it("rejects unknown names, including inherited object keys", () => {
    expect(iconFile("favicon.ico")).toBeNull();
    expect(iconFile("constructor")).toBeNull();
    expect(iconFile("")).toBeNull();
  });

  it("svgDataUri round-trips through base64", () => {
    const uri = svgDataUri(LOGO_SVG_SQUARE);
    expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(atob(uri.slice("data:image/svg+xml;base64,".length))).toBe(
      LOGO_SVG_SQUARE,
    );
  });
});
