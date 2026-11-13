import { describe, expect, it } from "vitest";
import { PermissionDeniedError, toVietnameseError } from "@/lib/data/errors";

describe("toVietnameseError", () => {
  it("maps a duplicate running timer", () => {
    expect(toVietnameseError({ code: "23505", message: "duplicate key" })).toBe(
      "Đã có người bắt đầu trước.",
    );
  });
  it("maps permission errors", () => {
    expect(
      toVietnameseError({ code: "42501", message: "permission_denied" }),
    ).toBe("Bạn không có quyền thực hiện thao tác này");
    expect(toVietnameseError(new PermissionDeniedError())).toBe(
      "Bạn không có quyền thực hiện thao tác này",
    );
  });
  it("maps network failures", () => {
    expect(toVietnameseError(new TypeError("Failed to fetch"))).toBe(
      "Mất kết nối mạng, thử lại sau.",
    );
    expect(
      toVietnameseError({ code: "", message: "TypeError: Load failed" }),
    ).toBe("Mất kết nối mạng, thử lại sau.");
  });
  it("falls back to a generic message", () => {
    expect(toVietnameseError(new Error("boom"))).toBe("Có lỗi xảy ra: boom");
    expect(toVietnameseError("weird")).toBe("Có lỗi xảy ra.");
  });
});
