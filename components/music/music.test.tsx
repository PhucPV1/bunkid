import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { ICON_PATHS } from "@/lib/ui/icons";
import { MusicScreen } from "./MusicScreen";
import { YouTubeModePicker } from "./YouTubeModePicker";

describe("MusicScreen", () => {
  it("a header back to Khám phá, two segmented pickers, a glass list with play icons and the add form", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <MusicScreen familyId="f1" userId="u1" isOwner />
      </QueryClientProvider>,
    );
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain(">Nhạc cho bé</h1>");
    expect(html).toContain('aria-label="Loại nhạc"');
    expect(html).toMatch(
      /aria-pressed="true"[^>]*>Thư giãn \/ ru ngủ<\/button>/,
    );
    expect(html).toContain('aria-label="Mở YouTube bằng"');
    expect(html).toContain(`d="${ICON_PATHS.play}"`);
    expect(html).not.toContain("▶");
    expect(html).toContain("Mở trên web");
    expect(html).toContain(">Thêm link YouTube</h2>");
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("rounded-2xl border");
  });
});

describe("YouTubeModePicker", () => {
  it("is a two-way segmented control", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <YouTubeModePicker mode="web" onChange={onChange} />,
    );
    expect(html).toMatch(/aria-pressed="true"[^>]*>Trình duyệt<\/button>/);
    const [segmented] = findElements(
      YouTubeModePicker({ mode: "web", onChange }),
      (el) => el.props.options !== undefined,
    );
    (segmented.props.onChange as (v: string) => void)("app");
    expect(onChange).toHaveBeenCalledWith("app");
  });
});
