import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoginScreen } from "./LoginScreen";

describe("LoginScreen", () => {
  it("logo, wordmark, tagline, the Google button and the install link", () => {
    const html = renderToStaticMarkup(<LoginScreen />);
    expect(html).toContain('src="/icons/icon.svg"');
    expect(html).toContain(">Kim Bun</h1>");
    expect(html).toContain(">Nhật ký chăm bé của cả nhà</p>");
    expect(html).toContain("Đăng nhập bằng Google</button>");
    expect(html).toContain("--gb-bg:");
    expect(html).toContain('href="/cai-app"');
    expect(html).not.toContain("bg-accent text-lg");
  });
});
