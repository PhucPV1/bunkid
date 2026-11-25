import { describe, expect, it } from "vitest";
import {
  ATTENTION_MAX,
  attentionItems,
  vaccineAttention,
  type AttentionItem,
} from "./attention";
import type { DoseState, ScheduleItem } from "./vaccines";

const TODAY = "2026-11-25";

const dose = (state: DoseState, due: string) =>
  ({
    dose: { code: "hexa", doseNo: 2, name: "6 trong 1 mũi 2" },
    due,
    state,
    record: null,
    unchosen: false,
    pastMaxAge: false,
  }) as ScheduleItem;

// Spec 2026-11-25 §4, rows 2 and 3.
describe("vaccineAttention", () => {
  it("no next dose: no row", () => {
    expect(vaccineAttention(null, TODAY)).toBeNull();
  });

  it("overdue: Quá hạn with the dose name, the due day, warn", () => {
    expect(vaccineAttention(dose("overdue", "2026-11-10"), TODAY)).toEqual({
      key: "vaccine",
      icon: "syringe",
      color: "cat-temp",
      title: "Quá hạn: 6 trong 1 mũi 2",
      detail: "Hẹn 10/11",
      tone: "warn",
      href: "/tiem-chung",
    });
  });

  it("due within 14 days: the dose name, the due day and the days left", () => {
    expect(vaccineAttention(dose("upcoming", "2026-12-10"), TODAY)).toBeNull();
    expect(vaccineAttention(dose("upcoming", "2026-12-09"), TODAY)).toEqual({
      key: "vaccine",
      icon: "syringe",
      color: "cat-temp",
      title: "6 trong 1 mũi 2",
      detail: "Hẹn 09/12 · còn 14 ngày",
      tone: "normal",
      href: "/tiem-chung",
    });
    expect(
      vaccineAttention(dose("upcoming", "2026-11-26"), TODAY)?.detail,
    ).toBe("Hẹn 26/11 · còn 1 ngày");
  });

  it("due today: the whole detail is Hẹn hôm nay", () => {
    expect(vaccineAttention(dose("upcoming", TODAY), TODAY)?.detail).toBe(
      "Hẹn hôm nay",
    );
  });

  it("a dose further away than 14 days gives no row, whatever its state", () => {
    expect(vaccineAttention(dose("later", "2027-06-14"), TODAY)).toBeNull();
    expect(vaccineAttention(dose("upcoming", "2026-12-20"), TODAY)).toBeNull();
  });
});

describe("attentionItems", () => {
  it("is empty when nothing needs attention", () => {
    expect(attentionItems({ vaccine: null, today: TODAY })).toEqual([]);
    expect(
      attentionItems({ vaccine: dose("later", "2027-06-14"), today: TODAY }),
    ).toEqual([]);
  });

  it("lists the vaccine row", () => {
    const items = attentionItems({
      vaccine: dose("overdue", "2026-11-10"),
      today: TODAY,
    });
    expect(items.map((item: AttentionItem) => item.title)).toEqual([
      "Quá hạn: 6 trong 1 mũi 2",
    ]);
  });

  it("never returns more than four rows", () => {
    expect(ATTENTION_MAX).toBe(4);
  });
});
