import { describe, expect, it } from "vitest";
import {
  closeStep,
  dragOffset,
  SHEET_DRAG_CLOSE_PX,
  shouldDismissDrag,
} from "./sheet";

describe("sheet drag", () => {
  it("closes only past 80 px downwards", () => {
    expect(SHEET_DRAG_CLOSE_PX).toBe(80);
    expect(shouldDismissDrag(80)).toBe(false);
    expect(shouldDismissDrag(81)).toBe(true);
    expect(shouldDismissDrag(-200)).toBe(false);
  });

  it("follows the finger downwards only", () => {
    expect(dragOffset(40)).toBe(40);
    expect(dragOffset(-30)).toBe(0);
  });
});

describe("closeStep", () => {
  it("closes straight away when nothing was typed", () => {
    expect(closeStep(false, false)).toBe("close");
  });

  it("asks first when there is unsaved input", () => {
    expect(closeStep(true, false)).toBe("confirm");
  });

  it("a second close request while asking keeps the sheet (Esc = Tiếp tục nhập)", () => {
    expect(closeStep(true, true)).toBe("keep");
    expect(closeStep(false, true)).toBe("keep");
  });
});
