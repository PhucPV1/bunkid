import { describe, expect, it } from "vitest";
import { nearestScrollLeft } from "./scrollRow";

// Spec 2026-11-27 §4.3: a picked cell of the day strip is brought into view by
// moving the row only as far as needed, never the sheet around it.
describe("nearestScrollLeft", () => {
  const view = { cellWidth: 64, scrollLeft: 100, clientWidth: 300 };

  it("a cell already in view: the row stays", () => {
    expect(nearestScrollLeft({ ...view, cellLeft: 100 })).toBe(100);
    expect(nearestScrollLeft({ ...view, cellLeft: 336 })).toBe(100);
  });

  it("a cell cut on the left: its left edge goes to the row's left edge", () => {
    expect(nearestScrollLeft({ ...view, cellLeft: 40 })).toBe(40);
    expect(nearestScrollLeft({ ...view, cellLeft: 0 })).toBe(0);
  });

  it("a cell cut on the right: its right edge goes to the row's right edge", () => {
    expect(nearestScrollLeft({ ...view, cellLeft: 340 })).toBe(104);
    expect(nearestScrollLeft({ ...view, cellLeft: 600 })).toBe(364);
  });
});
