import { describe, expect, it } from "vitest";
import { gateRedirect, resolveLanding } from "@/lib/routing";

describe("resolveLanding", () => {
  it("sends a signed-out user to the login page", () => {
    expect(
      resolveLanding({ hasSession: false, hasFamily: false, hasBaby: false }),
    ).toBe("/dang-nhap");
  });
  it("sends a signed-in user without a family to the not-invited page", () => {
    expect(
      resolveLanding({ hasSession: true, hasFamily: false, hasBaby: false }),
    ).toBe("/chua-duoc-moi");
  });
  it("sends a family without a baby to onboarding", () => {
    expect(
      resolveLanding({ hasSession: true, hasFamily: true, hasBaby: false }),
    ).toBe("/khai-bao-be");
  });
  it("sends a complete family home", () => {
    expect(
      resolveLanding({ hasSession: true, hasFamily: true, hasBaby: true }),
    ).toBe("/");
  });
});

describe("gateRedirect", () => {
  it("lets each page render only for its own landing", () => {
    expect(gateRedirect("anonymous", "/dang-nhap")).toBeNull();
    expect(gateRedirect("no-family", "/chua-duoc-moi")).toBeNull();
    expect(gateRedirect("family", "/khai-bao-be")).toBeNull();
    expect(gateRedirect("baby", "/")).toBeNull();
  });
  it("redirects to the landing everywhere else", () => {
    expect(gateRedirect("anonymous", "/")).toBe("/");
    expect(gateRedirect("no-family", "/khai-bao-be")).toBe("/khai-bao-be");
    expect(gateRedirect("family", "/dang-nhap")).toBe("/dang-nhap");
    expect(gateRedirect("baby", "/chua-duoc-moi")).toBe("/chua-duoc-moi");
  });
});
