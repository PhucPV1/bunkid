import { describe, expect, it } from "vitest";
import {
  ATTENTION_MAX,
  attentionItems,
  growthAttention,
  habitAttention,
  measureAttention,
  vaccineAttention,
  type AttentionItem,
} from "./attention";
import type { GrowthAlert } from "./growthAlerts";
import type { DoseState, ScheduleItem } from "./vaccines";

const alert = (
  indicator: GrowthAlert["indicator"],
  level: GrowthAlert["level"],
): GrowthAlert => ({
  indicator,
  kind: level === "red" ? "veryLow" : "low",
  level,
  title: `Tiêu đề ${indicator}`,
  body: "Nội dung",
  advice:
    level === "red" ? "Nên cho bé đi khám." : "Nên hỏi bác sĩ ở lần khám tới.",
  chip: level === "red" ? "Rất thấp" : "Thấp",
  measuredOn: "2026-11-20",
});

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
    expect(
      attentionItems({
        growth: null,
        vaccine: null,
        measure: null,
        habits: null,
        today: TODAY,
      }),
    ).toEqual([]);
    expect(
      attentionItems({
        growth: [],
        vaccine: dose("later", "2027-06-14"),
        measure: null,
        habits: null,
        today: TODAY,
      }),
    ).toEqual([]);
  });

  it("lists the vaccine row", () => {
    const items = attentionItems({
      growth: null,
      vaccine: dose("overdue", "2026-11-10"),
      measure: null,
      habits: null,
      today: TODAY,
    });
    expect(items.map((item: AttentionItem) => item.title)).toEqual([
      "Quá hạn: 6 trong 1 mũi 2",
    ]);
  });

  it("never returns more than four rows", () => {
    expect(ATTENTION_MAX).toBe(4);
    const five = (["wfa", "lhfa", "hcfa", "wfa", "lhfa"] as const).map(
      (indicator, index) => alert(indicator, index === 4 ? "red" : "yellow"),
    );
    const items = attentionItems({
      growth: five,
      vaccine: dose("overdue", "2026-11-10"),
      measure: null,
      habits: null,
      today: TODAY,
    });
    expect(items).toHaveLength(4);
    expect(items.every((item) => item.href === "/tang-truong")).toBe(true);
  });
});

// Spec 2026-11-25 §4, row 1.
describe("growthAttention", () => {
  it("no alerts, or alerts not worked out yet: no row", () => {
    expect(growthAttention(null)).toEqual([]);
    expect(growthAttention([])).toEqual([]);
  });

  it("one row per alert, in the order given: the title, the advice, the tone", () => {
    expect(
      growthAttention([alert("lhfa", "red"), alert("wfa", "yellow")]),
    ).toEqual([
      {
        key: "growth-lhfa",
        icon: "ruler",
        color: "cat-tummy",
        title: "Tiêu đề lhfa",
        detail: "Nên cho bé đi khám.",
        tone: "danger",
        href: "/tang-truong",
      },
      {
        key: "growth-wfa",
        icon: "ruler",
        color: "cat-tummy",
        title: "Tiêu đề wfa",
        detail: "Nên hỏi bác sĩ ở lần khám tới.",
        tone: "warn",
        href: "/tang-truong",
      },
    ]);
  });

  it("growth rows come before the vaccine row", () => {
    const items = attentionItems({
      growth: [alert("wfa", "yellow")],
      vaccine: dose("overdue", "2026-11-10"),
      measure: null,
      habits: null,
      today: TODAY,
    });
    expect(items.map((item) => item.key)).toEqual(["growth-wfa", "vaccine"]);
  });
});

// Spec 2026-11-25 §4, rows 5 and 6.
describe("habitAttention", () => {
  const SLEEP = "13,5 giờ mỗi ngày · nên 14–17 giờ";
  const TUMMY = "15 phút mỗi ngày · nên từ 30 phút";

  it("habits not worked out yet, or nothing short: no row", () => {
    expect(habitAttention(null)).toEqual([]);
    expect(habitAttention({ sleep: null, tummy: null })).toEqual([]);
  });

  it("sleep under the norm: Ngủ ít hơn chuẩn, in warn, opens Thống kê", () => {
    expect(habitAttention({ sleep: SLEEP, tummy: null })).toEqual([
      {
        key: "sleep",
        icon: "moon",
        color: "cat-sleep",
        title: "Ngủ ít hơn chuẩn",
        detail: SLEEP,
        tone: "warn",
        href: "/thong-ke",
      },
    ]);
  });

  it("tummy time short: Nằm sấp còn ít, in warn, opens the Chiều cao page", () => {
    expect(habitAttention({ sleep: null, tummy: TUMMY })).toEqual([
      {
        key: "tummy",
        icon: "smile",
        color: "cat-tummy",
        title: "Nằm sấp còn ít",
        detail: TUMMY,
        tone: "warn",
        href: "/tang-truong/chieu-cao",
      },
    ]);
  });

  it("both short: sleep first", () => {
    expect(
      habitAttention({ sleep: SLEEP, tummy: TUMMY }).map((item) => item.key),
    ).toEqual(["sleep", "tummy"]);
  });

  it("habit rows come after the growth rows and the vaccine row", () => {
    const items = attentionItems({
      growth: [alert("wfa", "yellow")],
      vaccine: dose("overdue", "2026-11-10"),
      measure: null,
      habits: { sleep: SLEEP, tummy: TUMMY },
      today: TODAY,
    });
    expect(items.map((item) => item.key)).toEqual([
      "growth-wfa",
      "vaccine",
      "sleep",
      "tummy",
    ]);
  });

  it("the cut at four rows drops the habit rows first", () => {
    const items = attentionItems({
      growth: [alert("wfa", "red"), alert("lhfa", "yellow")],
      vaccine: dose("overdue", "2026-11-10"),
      measure: null,
      habits: { sleep: SLEEP, tummy: TUMMY },
      today: TODAY,
    });
    expect(items.map((item) => item.key)).toEqual([
      "growth-wfa",
      "growth-lhfa",
      "vaccine",
      "sleep",
    ]);
  });
});

// Spec 2026-11-25 §4, row 4.
describe("measureAttention", () => {
  it("not worked out yet, or not due: no row", () => {
    expect(measureAttention(null)).toBeNull();
    expect(
      measureAttention({ measureDue: false, lastMeasuredOn: "2026-11-20" }),
    ).toBeNull();
  });

  it("due: Đến kỳ đo with the day of the last measurement, opens Tăng trưởng", () => {
    expect(
      measureAttention({ measureDue: true, lastMeasuredOn: "2026-10-16" }),
    ).toEqual({
      key: "measure",
      icon: "ruler",
      color: "cat-tummy",
      title: "Đến kỳ đo",
      detail: "Lần đo gần nhất 16/10",
      tone: "normal",
      href: "/tang-truong",
    });
  });

  it("due and never measured: says so", () => {
    expect(
      measureAttention({ measureDue: true, lastMeasuredOn: null })?.detail,
    ).toBe("Chưa có lần đo nào");
  });

  it("comes after the vaccine row and before the habit rows; the cut at four drops the last one", () => {
    const items = attentionItems({
      growth: [alert("wfa", "yellow")],
      vaccine: dose("overdue", "2026-11-10"),
      measure: { measureDue: true, lastMeasuredOn: "2026-10-16" },
      habits: {
        sleep: "13,5 giờ mỗi ngày · nên 14–17 giờ",
        tummy: "15 phút mỗi ngày · nên từ 30 phút",
      },
      today: TODAY,
    });
    expect(items.map((item) => item.key)).toEqual([
      "growth-wfa",
      "vaccine",
      "measure",
      "sleep",
    ]);
  });
});
