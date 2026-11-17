import { describe, expect, it } from "vitest";
import { medicineKey, sameMedicine, VITAMIN_D } from "./medicineNames";

describe("sameMedicine (spec 2026-11-17 §4.3)", () => {
  it("treats every way of writing Vitamin D as the same drops", () => {
    expect(sameMedicine("Vitamin D", "vitamin d3")).toBe(true);
    expect(sameMedicine("Vitamin D", "VitaminD3 K2")).toBe(true);
    expect(sameMedicine("Vitamin D3", "Vitamin D")).toBe(true);
    expect(sameMedicine("Vitamin D", "Vitamin DHA")).toBe(false);
    expect(sameMedicine("Vitamin D", "DHA")).toBe(false);
    expect(VITAMIN_D.test("vitamin d (Aquadetrim)")).toBe(true);
  });

  it("ignores case, outer spaces and tone marks for other names", () => {
    expect(sameMedicine("Men tiêu hoá", " men tiêu hóa ")).toBe(true);
    expect(sameMedicine("DHA", "dha")).toBe(true);
    expect(sameMedicine("Siro sắt", "SIRO SAT")).toBe(true);
    expect(sameMedicine("Đạm sữa", "dam sua")).toBe(true);
    expect(sameMedicine("DHA", "DHA 2")).toBe(false);
    expect(sameMedicine("Canxi", "Kẽm")).toBe(false);
  });

  it("medicineKey is the form two names are compared in", () => {
    expect(medicineKey("  Men Tiêu Hoá ")).toBe("men tieu hoa");
    expect(medicineKey("Đường")).toBe("duong");
  });
});
