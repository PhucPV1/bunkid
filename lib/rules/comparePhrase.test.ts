import { describe, expect, it } from "vitest";
import { comparePhrase, sexLabel } from "./growthForm";

// Spec 2026-11-25 §5.2.
describe("comparePhrase", () => {
  it("says how many of 100 babies of the same sex and age are below", () => {
    expect(comparePhrase("wfa", 55.4, "boys", 76)).toBe(
      "Nặng hơn 55 trong 100 bé trai cùng tuổi",
    );
    expect(comparePhrase("hcfa", 52.6, "girls", 76)).toBe(
      "Lớn hơn 53 trong 100 bé gái cùng tuổi",
    );
  });

  it("length is Dài hơn before two years and Cao hơn from two years", () => {
    expect(comparePhrase("lhfa", 79, "boys", 729)).toBe(
      "Dài hơn 79 trong 100 bé trai cùng tuổi",
    );
    expect(comparePhrase("lhfa", 79, "boys", 730)).toBe(
      "Cao hơn 79 trong 100 bé trai cùng tuổi",
    );
  });

  it("keeps the number between 1 and 99", () => {
    expect(comparePhrase("wfa", 0.02, "boys", 76)).toBe(
      "Nặng hơn 1 trong 100 bé trai cùng tuổi",
    );
    expect(comparePhrase("wfa", 0.5, "boys", 76)).toContain(" 1 trong 100");
    expect(comparePhrase("wfa", 99.5, "boys", 76)).toContain(" 99 trong 100");
    expect(comparePhrase("wfa", 99.99, "girls", 76)).toBe(
      "Nặng hơn 99 trong 100 bé gái cùng tuổi",
    );
  });

  it("sexLabel names the sex as the alerts write it", () => {
    expect(sexLabel("boys")).toBe("bé trai");
    expect(sexLabel("girls")).toBe("bé gái");
  });
});
