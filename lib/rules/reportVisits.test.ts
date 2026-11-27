import { describe, expect, it } from "vitest";
import { visitRows } from "./report";

const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const visit = (
  at: string,
  over: { place?: string; conclusion?: string; advice?: string } = {},
) => ({
  visited_at: iso(at),
  place: over.place ?? null,
  conclusion: over.conclusion ?? null,
  advice: over.advice ?? null,
});

// Spec 2026-11-26 §9 from M5: the table "Lần khám" of the episode period.
describe("visitRows", () => {
  it("one row per visit, in the order given: time, place, conclusion, advice", () => {
    expect(
      visitRows([
        visit("2026-11-25 09:15", {
          place: "Phòng khám Nhi",
          conclusion: "Viêm họng",
          advice: "Uống nhiều nước",
        }),
        visit("2026-11-26 08:05"),
      ]),
    ).toEqual([
      {
        at: "25/11 09:15",
        place: "Phòng khám Nhi",
        conclusion: "Viêm họng",
        advice: "Uống nhiều nước",
      },
      { at: "26/11 08:05", place: "", conclusion: "", advice: "" },
    ]);
  });
});
