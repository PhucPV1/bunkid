import { describe, expect, it } from "vitest";
import {
  ageDays,
  formatAgeVi,
  formatDuration,
  formatVnTime,
  fromVnLocalInput,
  toVnLocalInput,
  vnDateString,
} from "@/lib/rules/time";

describe("vnDateString / ageDays", () => {
  it("uses the Vietnam calendar day", () => {
    expect(vnDateString(new Date("2026-11-12T16:59:59Z"))).toBe("2026-11-12");
    expect(vnDateString(new Date("2026-11-12T17:00:00Z"))).toBe("2026-11-13");
  });
  it("counts age in Vietnam days, switching at VN midnight", () => {
    expect(ageDays("2026-09-13", new Date("2026-11-12T16:59:59Z"))).toBe(60);
    expect(ageDays("2026-09-13", new Date("2026-11-12T17:00:00Z"))).toBe(61);
  });
});

describe("formatAgeVi", () => {
  const at = (vnDate: string) => new Date(`${vnDate}T05:00:00Z`);
  it("shows only days under one month", () => {
    expect(formatAgeVi("2026-09-13", at("2026-09-20"))).toBe("7 ngày");
  });
  it("shows whole months", () => {
    expect(formatAgeVi("2026-09-13", at("2026-11-13"))).toBe("2 tháng");
  });
  it("shows months and days", () => {
    expect(formatAgeVi("2026-09-13", at("2026-11-20"))).toBe("2 tháng 7 ngày");
  });
  it("clamps to the end of a shorter month", () => {
    expect(formatAgeVi("2026-01-31", at("2026-02-28"))).toBe("1 tháng");
  });
});

describe("formatVnTime / formatDuration", () => {
  it("formats a 24-hour Vietnam clock time", () => {
    expect(formatVnTime(new Date("2026-11-13T01:05:00Z"))).toBe("08:05");
  });
  it("formats durations", () => {
    expect(formatDuration(30_000)).toBe("dưới 1 phút");
    expect(formatDuration(12 * 60_000)).toBe("12 phút");
    expect(formatDuration(65 * 60_000)).toBe("1 giờ 05 phút");
  });
});

describe("local input conversion", () => {
  it("round-trips through the Vietnam wall clock", () => {
    const instant = new Date("2026-11-13T01:05:00Z");
    expect(toVnLocalInput(instant)).toBe("2026-11-13T08:05");
    expect(fromVnLocalInput("2026-11-13T08:05").toISOString()).toBe(
      "2026-11-13T01:05:00.000Z",
    );
  });
});
