import { describe, expect, it } from "vitest";
import { HOLDING } from "./holding";
import { MUSIC_PRESETS } from "./music";

describe("content/holding.vi.json (spec §6.10)", () => {
  it("has the three stages in order, each with sourced positions", () => {
    expect(HOLDING.stages.map((s) => s.name)).toEqual([
      "0–3 tháng",
      "3–6 tháng",
      "Trên 6 tháng",
    ]);
    const codes = HOLDING.stages.flatMap((s) => s.positions.map((p) => p.code));
    expect(new Set(codes).size).toBe(codes.length);
    for (const p of HOLDING.stages.flatMap((s) => s.positions)) {
      expect(p.source, p.code).toMatch(/^https:\/\//);
      expect(p.reviewedAt, p.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("tells parents of babies under 3 months to support the head and neck", () => {
    for (const p of HOLDING.stages[0].positions.filter(
      (x) => !x.code.startsWith("carrier"),
    ))
      expect(p.safety.join(" "), p.code).toMatch(/đỡ (đầu và cổ|cằm)/);
  });

  it("every carrier position keeps the M position and the TICKS points", () => {
    const carriers = HOLDING.stages
      .flatMap((s) => s.positions)
      .filter((p) => p.code.startsWith("carrier"));
    expect(carriers.length).toBe(3);
    for (const p of carriers) {
      const text = p.safety.join(" ");
      expect(text, p.code).toContain("chữ M");
      expect(text, p.code).toContain("một ngón tay dưới cằm");
      expect(text, p.code).toContain("nhìn thấy mặt bé");
    }
  });
});

describe("content/music.vi.json (spec §6.11)", () => {
  it("has presets in both tabs with unique codes", () => {
    const codes = MUSIC_PRESETS.map((p) => p.presetCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(MUSIC_PRESETS.map((p) => p.category))).toEqual(
      new Set(["relax", "brain"]),
    );
  });
});
