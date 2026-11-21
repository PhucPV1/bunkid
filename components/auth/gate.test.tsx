import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GateError, GateLoading } from "@/components/AuthGate";
import { NotInvited } from "./NotInvited";

describe("AuthGate states", () => {
  it("loading draws the home page's shapes, not text", () => {
    const html = renderToStaticMarkup(<GateLoading />);
    expect(html).toMatch(/^<main aria-busy="true" class="[^"]*\bgap-3\.5\b/);
    expect(html).not.toContain("gap-[18px]");
    // The header bar, then the shapes of the current home page.
    expect(html.indexOf("h-11 w-48 rounded-full")).toBeGreaterThan(-1);
    expect(html.indexOf("h-11 w-48 rounded-full")).toBeLessThan(
      html.indexOf("h-[104px] rounded-[32px]"),
    );
    expect(html).not.toContain("h-[300px]");
    expect(html.match(/size-\[58px\] rounded-full/g)).toHaveLength(10);
    expect(html.match(/kb-pulse/g)).toHaveLength(26);
    expect(html).not.toContain("Đang tải…");
  });

  it("a load error is a retry card", () => {
    const html = renderToStaticMarkup(
      <GateError message="Mất kết nối" onRetry={() => {}} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain(">Mất kết nối</p>");
    expect(html).toContain(">Thử lại</button>");
  });
});

describe("NotInvited", () => {
  it("a large title, the signed-in Gmail and a secondary Đăng xuất", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <NotInvited email="ba@example.com" />
      </QueryClientProvider>,
    );
    expect(html).toContain(">Bạn chưa được mời</h1>");
    expect(html).toContain("text-[34px]");
    expect(html).toContain("<strong>ba@example.com</strong>");
    expect(html).toContain(">Đăng xuất</button>");
    expect(html).not.toContain("rounded-xl border");
  });
});
