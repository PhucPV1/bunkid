import { describe, expect, it, vi } from "vitest";
import { INITIAL_TOAST, TOAST_MS, toastReducer } from "./toast";

describe("toastReducer", () => {
  it("shows one toast at a time with increasing ids", () => {
    const action = { label: "Hoàn tác", onAction: vi.fn() };
    const first = toastReducer(INITIAL_TOAST, {
      type: "show",
      message: "Đã ghi Tã ướt lúc 17:16",
      action,
    });
    expect(first.current).toEqual({
      id: 1,
      message: "Đã ghi Tã ướt lúc 17:16",
      action,
    });
    const second = toastReducer(first, {
      type: "show",
      message: "Đã ghi Bú bình lúc 17:20",
    });
    expect(second.current).toEqual({
      id: 2,
      message: "Đã ghi Bú bình lúc 17:20",
      action: undefined,
    });
  });

  it("an old timer does not dismiss a newer toast", () => {
    const first = toastReducer(INITIAL_TOAST, { type: "show", message: "a" });
    const second = toastReducer(first, { type: "show", message: "b" });
    expect(toastReducer(second, { type: "dismiss", id: 1 })).toBe(second);
    expect(toastReducer(second, { type: "dismiss", id: 2 }).current).toBeNull();
  });

  it("lasts five seconds", () => {
    expect(TOAST_MS).toBe(5000);
  });
});
