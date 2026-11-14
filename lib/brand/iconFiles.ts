import { LOGO_SVG_MASKABLE, LOGO_SVG_ROUNDED, LOGO_SVG_SQUARE } from "./logo";

export type IconFile =
  | { contentType: "image/svg+xml"; svg: string }
  | { contentType: "image/png"; size: number; svg: string };

export const ICON_FILES: Record<string, IconFile> = {
  "icon.svg": { contentType: "image/svg+xml", svg: LOGO_SVG_ROUNDED },
  "icon-192.png": { contentType: "image/png", size: 192, svg: LOGO_SVG_SQUARE },
  "icon-512.png": { contentType: "image/png", size: 512, svg: LOGO_SVG_SQUARE },
  "maskable-512.png": {
    contentType: "image/png",
    size: 512,
    svg: LOGO_SVG_MASKABLE,
  },
  "apple-touch-icon.png": {
    contentType: "image/png",
    size: 180,
    svg: LOGO_SVG_SQUARE,
  },
};

export function iconFile(name: string): IconFile | null {
  return Object.hasOwn(ICON_FILES, name) ? ICON_FILES[name] : null;
}

// The logo is ASCII-only (tested), so btoa is safe in both Node and the browser.
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
