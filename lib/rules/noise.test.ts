import { describe, expect, it } from "vitest";
import {
  fillNoise,
  formatRemaining,
  seamlessNoise,
  type NoiseColor,
} from "./noise";

// Small deterministic generator so the test is repeatable.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const meanStep = (a: Float32Array) => {
  let sum = 0;
  for (let i = 1; i < a.length; i++) sum += Math.abs(a[i] - a[i - 1]);
  return sum / (a.length - 1);
};

describe("fillNoise (spec §6.12)", () => {
  const make = (color: NoiseColor) => {
    const out = new Float32Array(48_000);
    fillNoise(color, out, seeded(7));
    return out;
  };

  it("keeps every sample within [-1, 1] and is not silent", () => {
    for (const color of ["white", "pink", "brown"] as const) {
      const out = make(color);
      expect(Math.max(...out)).toBeLessThanOrEqual(1);
      expect(Math.min(...out)).toBeGreaterThanOrEqual(-1);
      expect(Math.max(...out.map(Math.abs))).toBeGreaterThan(0.05);
    }
  });

  it("pink and brown change more slowly than white (less high pitch)", () => {
    const white = meanStep(make("white"));
    const pink = meanStep(make("pink"));
    const brown = meanStep(make("brown"));
    expect(pink).toBeLessThan(white);
    expect(brown).toBeLessThan(pink);
  });
});

describe("seamlessNoise", () => {
  it("continues the generated stream across the loop point", () => {
    const length = 1000;
    const blend = 100;
    const full = new Float32Array(length + blend);
    fillNoise("brown", full, seeded(3));
    const out = seamlessNoise("brown", length, blend, seeded(3));
    expect(out.length).toBe(length);
    // The loop jumps from out[length-1] (= full[length-1]) to out[0] (= full[length]).
    expect(out[length - 1]).toBe(full[length - 1]);
    expect(out[0]).toBeCloseTo(full[length], 6);
    expect(out[blend]).toBe(full[blend]);
  });

  it("makes the jump at the loop point as small as a normal step", () => {
    const out = seamlessNoise("brown", 96_000, 2_400, seeded(11));
    expect(Math.abs(out[0] - out[out.length - 1])).toBeLessThan(
      3 * meanStep(out),
    );
  });
});

describe("sleep timer", () => {
  it("formats the time left as m:ss", () => {
    expect(formatRemaining(15 * 60_000)).toBe("15:00");
    expect(formatRemaining(61_500)).toBe("1:02");
    expect(formatRemaining(-5)).toBe("0:00");
  });
});
