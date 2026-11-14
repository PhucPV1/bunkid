import { describe, expect, it } from "vitest";
import { classifyLoadError, LOAD_ERROR_TEXT } from "@/lib/data/loadError";

describe("classifyLoadError", () => {
  it("reports offline first", () => {
    expect(
      classifyLoadError({ message: "TypeError: Failed to fetch" }, false),
    ).toBe("offline");
  });
  it("treats fetch failures while online as the server being down", () => {
    expect(
      classifyLoadError(
        { message: "TypeError: Failed to fetch", code: "" },
        true,
      ),
    ).toBe("server-down");
    expect(classifyLoadError(new TypeError("Load failed"), true)).toBe(
      "server-down",
    );
  });
  it("leaves other errors generic", () => {
    expect(
      classifyLoadError({ message: "permission denied", code: "42501" }, true),
    ).toBe("other");
  });
  it("explains how to wake a paused Supabase project", () => {
    expect(LOAD_ERROR_TEXT["server-down"]).toBe(
      "Máy chủ đang ngủ hoặc không truy cập được. Nếu kéo dài, vào supabase.com, mở project và bấm Restore.",
    );
  });
});
