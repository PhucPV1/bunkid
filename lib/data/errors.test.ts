import { describe, expect, it } from "vitest";
import {
  memberErrorText,
  PermissionDeniedError,
  toVietnameseError,
} from "@/lib/data/errors";

describe("toVietnameseError", () => {
  it("maps a duplicate running timer", () => {
    expect(toVietnameseError({ code: "23505", message: "duplicate key" })).toBe(
      "Đã có người bắt đầu trước.",
    );
  });
  it("maps a missing related row, as the outbox does", () => {
    expect(
      toVietnameseError({ code: "23503", message: "violates foreign key" }),
    ).toBe("Bản ghi liên quan không còn.");
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

describe("member errors", () => {
  it("maps the last-owner guard", () => {
    expect(toVietnameseError({ code: "P0001", message: "last_owner" })).toBe(
      "Gia đình phải còn ít nhất một chủ gia đình.",
    );
  });
  it("maps a duplicate Gmail only for member changes", () => {
    expect(memberErrorText({ code: "23505", message: "duplicate key" })).toBe(
      "Gmail này đã có trong gia đình.",
    );
    expect(memberErrorText({ code: "42501", message: "x" })).toBe(
      "Bạn không có quyền thực hiện thao tác này",
    );
  });
});
