import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { NoiseScreen } from "./NoiseScreen";

describe("NoiseScreen", () => {
  it("segmented sound and timer pickers, a glass volume card and a 64 px play button", () => {
    const html = renderToStaticMarkup(<NoiseScreen />);
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain('aria-label="Loại âm"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Trắng<\/button>/);
    expect(html).toContain('aria-label="Hẹn giờ tắt"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>30 phút<\/button>/);
    expect(html).toContain('type="range"');
    expect(html).toContain("accent-accent");
    expect(html).toContain('aria-label="Phát"');
    expect(html).toContain("size-16");
    expect(html).toContain(`d="${ICON_PATHS.play}"`);
    expect(html).not.toContain("bg-soft");
    expect(html).not.toContain("rounded-xl border");
  });
});
