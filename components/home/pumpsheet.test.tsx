import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { PumpSheet } from "./PumpSheet";

describe("PumpSheet", () => {
  it("asks ml per side in a glass sheet with Lưu and Bỏ qua", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <PumpSheet logId="p1" babyId="b1" userId="u1" onClose={() => {}} />
      </QueryClientProvider>,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain(">Đã hút được bao nhiêu?</h2>");
    expect(html).toContain("bg-cat-pump/15 text-cat-pump");
    expect(html).toContain(`d="${ICON_PATHS.cup}"`);
    expect(html).toContain(">Bên trái (ml)</span>");
    expect(html).toContain(">Bên phải (ml)</span>");
    expect(html.match(/inputMode="numeric"/g)).toHaveLength(2);
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(formId).toBeTruthy();
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).toContain(">Bỏ qua</button>");
    expect(html).not.toContain("rounded-2xl border");
  });
});
