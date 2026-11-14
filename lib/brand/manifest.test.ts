import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ICON_FILES } from "./iconFiles";

const manifest = JSON.parse(
  readFileSync("public/manifest.webmanifest", "utf8"),
);

describe("web app manifest", () => {
  it("lists the generated icons with the right purposes", () => {
    expect(manifest.icons).toEqual([
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });

  it("every manifest icon is served by the icon route", () => {
    for (const icon of manifest.icons)
      expect(Object.keys(ICON_FILES)).toContain(
        icon.src.replace("/icons/", ""),
      );
  });

  it("uses the light background colour", () => {
    expect(manifest.background_color).toBe("#FBF3F0");
    expect(manifest.theme_color).toBe("#FBF3F0");
  });
});
