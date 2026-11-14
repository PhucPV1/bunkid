import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SettingsSubpage } from "./SettingsSubpage";

describe("SettingsSubpage", () => {
  it("has a large title, a back pill to Cài đặt and an online-only body", () => {
    const html = renderToStaticMarkup(
      <SettingsSubpage title="Thành viên">
        <p>Nội dung</p>
      </SettingsSubpage>,
    );
    expect(html).toContain(">Thành viên</h1>");
    expect(html).toContain('href="/cai-dat"');
    expect(html).toContain("Cài đặt</a>");
    expect(html).toContain("<fieldset");
    expect(html).toContain("<p>Nội dung</p>");
  });
});
