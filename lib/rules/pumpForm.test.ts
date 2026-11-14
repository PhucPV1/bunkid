import { describe, expect, it } from "vitest";
import { parsePumpAmounts } from "./pumpForm";

describe("parsePumpAmounts (spec §6.13)", () => {
  it("keeps the sides that were filled in", () => {
    expect(parsePumpAmounts({ left: "60", right: " " })).toEqual({
      ok: true,
      details: { mlLeft: 60 },
    });
    expect(parsePumpAmounts({ left: "", right: "" })).toEqual({
      ok: true,
      details: {},
    });
    expect(parsePumpAmounts({ left: "0", right: "500" })).toEqual({
      ok: true,
      details: { mlLeft: 0, mlRight: 500 },
    });
  });

  it("rejects decimals, text and more than 500 ml", () => {
    for (const bad of ["12.5", "abc", "501", "-5"])
      expect(parsePumpAmounts({ left: bad, right: "" })).toEqual({
        ok: false,
        message: "Mỗi bên từ 0 đến 500 ml.",
      });
  });
});
