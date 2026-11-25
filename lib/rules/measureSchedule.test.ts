import { describe, expect, it } from "vitest";
import { addDays } from "./days";
import { latestDay, measureReminder, nextMeasureDue } from "./measureSchedule";

const DOB = "2026-01-01";
const day = (age: number) => addDays(DOB, age);

// Spec 2026-11-25 §8.3.
describe("nextMeasureDue", () => {
  it("under one year the next measurement is 30 days after the last one", () => {
    expect(
      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(100), today: day(120) }),
    ).toEqual({ interval: 30, due: day(130), measureDue: false });
  });

  it("is due from the due day on", () => {
    const at = (today: number) =>
      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(100), today: day(today) })
        .measureDue;
    expect(at(129)).toBe(false);
    expect(at(130)).toBe(true);
    expect(at(200)).toBe(true);
  });

  it("the interval follows the age today: 30 days at 364 days old, 90 days from 365", () => {
    expect(
      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(350), today: day(364) }),
    ).toEqual({ interval: 30, due: day(380), measureDue: false });
    expect(
      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(350), today: day(365) }),
    ).toEqual({ interval: 90, due: day(440), measureDue: false });
  });

  it("never measured: counts from the day of birth", () => {
    expect(
      nextMeasureDue({ dob: DOB, lastMeasuredOn: null, today: day(29) }),
    ).toEqual({ interval: 30, due: day(30), measureDue: false });
    expect(
      nextMeasureDue({ dob: DOB, lastMeasuredOn: null, today: day(30) }),
    ).toEqual({ interval: 30, due: day(30), measureDue: true });
    expect(
      nextMeasureDue({ dob: DOB, lastMeasuredOn: null, today: day(400) }),
    ).toEqual({ interval: 90, due: day(90), measureDue: true });
  });

  it("past day 1856 nothing is due any more", () => {
    const at = (today: number) =>
      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(1000), today: day(today) })
        .measureDue;
    expect(at(1856)).toBe(true);
    expect(at(1857)).toBe(false);
  });
});

describe("latestDay", () => {
  it("is the greatest day, or null with no day", () => {
    expect(latestDay([])).toBeNull();
    expect(latestDay(["2026-03-01", "2026-11-02", "2026-10-30"])).toBe(
      "2026-11-02",
    );
  });
});

// Spec 2026-11-25 §8.3: the row on the Chiều cao page.
describe("measureReminder", () => {
  it("under one year: every month, with the day of the next reminder", () => {
    expect(
      measureReminder({ dob: DOB, lastMeasuredOn: day(100), today: day(120) }),
    ).toEqual({ title: "Nhắc đo mỗi tháng", detail: `Lần tới 11/05 · 08:00` });
  });

  it("from one year: every three months", () => {
    expect(
      measureReminder({ dob: DOB, lastMeasuredOn: day(350), today: day(365) }),
    ).toEqual({
      title: "Nhắc đo ba tháng một lần",
      detail: "Lần tới 17/03 · 08:00",
    });
  });

  it("due: says so in place of the next day", () => {
    expect(
      measureReminder({ dob: DOB, lastMeasuredOn: day(100), today: day(130) }),
    ).toEqual({ title: "Nhắc đo mỗi tháng", detail: "Đã đến kỳ đo" });
    expect(
      measureReminder({ dob: DOB, lastMeasuredOn: null, today: day(45) })
        ?.detail,
    ).toBe("Đã đến kỳ đo");
  });

  it("past day 1856 there is no row", () => {
    const at = (today: number) =>
      measureReminder({
        dob: DOB,
        lastMeasuredOn: day(1850),
        today: day(today),
      });
    expect(at(1856)?.title).toBe("Nhắc đo ba tháng một lần");
    expect(at(1857)).toBeNull();
  });
});
