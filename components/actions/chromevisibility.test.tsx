import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ChromeVisibilityProvider,
  holdChromeHidden,
  useChromeHidden,
  useHideChrome,
} from "./ChromeVisibility";

function Probe() {
  return <p>hidden:{String(useChromeHidden())}</p>;
}

function Hider({ hide }: { hide: boolean }) {
  useHideChrome(hide);
  return null;
}

// Spec 2026-11-19 §6: a page hides the tab bar and "+" while it holds the flag.
describe("ChromeVisibility", () => {
  it("the chrome shows by default, inside and outside the provider", () => {
    expect(renderToStaticMarkup(<Probe />)).toBe("<p>hidden:false</p>");
    expect(
      renderToStaticMarkup(
        <ChromeVisibilityProvider>
          <Probe />
        </ChromeVisibilityProvider>,
      ),
    ).toBe("<p>hidden:false</p>");
  });

  it("useHideChrome renders nothing and works outside the provider", () => {
    expect(renderToStaticMarkup(<Hider hide />)).toBe("");
    expect(
      renderToStaticMarkup(
        <ChromeVisibilityProvider>
          <Hider hide />
          <Probe />
        </ChromeVisibilityProvider>,
      ),
    ).toBe("<p>hidden:false</p>");
  });

  it("holding raises the flag and the cleanup lowers it", () => {
    const set = vi.fn();
    const release = holdChromeHidden(true, set);
    expect(set.mock.calls).toEqual([[true]]);
    release?.();
    expect(set.mock.calls).toEqual([[true], [false]]);
  });

  it("not holding leaves the flag alone", () => {
    const set = vi.fn();
    expect(holdChromeHidden(false, set)).toBeUndefined();
    expect(set).not.toHaveBeenCalled();
  });

  // An effect that runs after the paint would let the tab bar show for a
  // frame over the page's own bar.
  it("raises the flag in a layout effect, before the browser paints", () => {
    const source = readFileSync(
      "components/actions/ChromeVisibility.tsx",
      "utf8",
    );
    expect(source).toContain("useLayoutEffect(() => holdChromeHidden(");
    expect(source).not.toMatch(/\buseEffect\b/);
  });
});
