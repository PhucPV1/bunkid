import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BabyForm } from "./BabyForm";

describe("BabyForm", () => {
  it("field styles, a segmented sex picker with nothing chosen yet, and a large Lưu", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <BabyForm familyId="f1" />
      </QueryClientProvider>,
    );
    expect(html).toContain(">Tên bé</span>");
    expect(html).toContain(">Ngày sinh</span>");
    expect(html).toContain('aria-label="Giới tính"');
    expect(html).toContain(">Bé gái</button>");
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).not.toContain('type="radio"');
    expect(html).toContain('inputMode="numeric"');
    expect(html).toMatch(/type="submit"[^>]*min-h-\[50px\][^>]*>Lưu<\/button>/);
    expect(html).not.toContain("rounded-xl border");
  });
});
