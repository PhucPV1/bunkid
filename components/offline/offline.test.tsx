import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GUIDES, OfflineView } from "./OfflineView";

describe("OfflineView", () => {
  it("a large title, a glass retry card and the cached guides as plain links", () => {
    const html = renderToStaticMarkup(
      <OfflineView cached={GUIDES.slice(0, 2)} onRetry={() => {}} />,
    );
    expect(html).toContain(">Bạn đang offline</h1>");
    expect(html).toContain("Những trang đã mở trước đó vẫn xem được.");
    expect(html).toMatch(/min-h-\[50px\][^>]*>Thử lại<\/button>/);
    expect(html).toContain(">Xem được khi offline</h2>");
    expect(html).toContain('<a href="/khan-cap"');
    expect(html).toContain("Thông tin khẩn cấp");
    expect(html).not.toContain('href="/trieu-chung"');
    expect(html).not.toContain("divide-y");
  });

  it("no list when nothing is cached", () => {
    const html = renderToStaticMarkup(
      <OfflineView cached={[]} onRetry={() => {}} />,
    );
    expect(html).not.toContain("Xem được khi offline");
  });
});
