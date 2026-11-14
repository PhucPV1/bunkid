import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InstallGuideView } from "./InstallGuide";

describe("InstallGuideView", () => {
  it("not installed: header with a back pill, logo 64, warning card and numbered steps", () => {
    const html = renderToStaticMarkup(<InstallGuideView standalone={false} />);
    expect(html).toContain(">Cài Kim Bun</h1>");
    expect(html).toContain('href="/"');
    expect(html).toContain("Quay lại</a>");
    expect(html).not.toContain("←");
    expect(html).toContain('width="64"');
    expect(html).toMatch(/<p[^>]*text-\[28px\][^>]*>Kim Bun<\/p>/);
    expect(html).toContain("thì iPhone mới nhận được thông báo.");
    expect(html).toContain(">Cách cài</h2>");
    expect(html).toContain("<strong>Thêm vào MH chính</strong>");
    expect(html).toMatch(/bg-accent[^>]*>3<\/span>/);
    expect(html).not.toContain("1. Mở trang");
  });

  it("before the check runs: only the header and the brand", () => {
    const html = renderToStaticMarkup(<InstallGuideView standalone={null} />);
    expect(html).toContain(">Cài Kim Bun</h1>");
    expect(html).not.toContain("Cách cài");
    expect(html).not.toContain("đã được cài");
  });
});
