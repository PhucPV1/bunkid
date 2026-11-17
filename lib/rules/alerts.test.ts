import { describe, expect, it } from "vitest";
import {
  homeAlerts,
  medicineWarnings,
  vitaminDToday,
} from "@/lib/rules/alerts";
import type { LogLike } from "@/lib/rules/describeLog";
import type { MetricResult } from "@/lib/rules/ratings";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (type: string, h: number, details: unknown): LogLike => ({
  type,
  started_at: ago(h),
  ended_at: ago(h),
  details,
});
const temp = (h: number, celsius: number) =>
  log("temperature", h, { celsius, method: "nach" });
const stool = (h: number, stoolColor: string) =>
  log("diaper", h, { wet: false, dirty: true, stoolColor });
const med = (h: number, antipyretic: boolean, name = "Paracetamol") =>
  log("medicine", h, { name, amount: 2.5, unit: "ml", antipyretic });
const NO_DATA: MetricResult = { status: "no-data" };
const alerts = (
  logs: LogLike[],
  ageDays = 60,
  wetDiapers: MetricResult = NO_DATA,
  triageAvailable = false,
) => homeAlerts({ logs, ageDays, wetDiapers, triageAvailable, now: NOW });

describe("homeAlerts — temperature", () => {
  it("flags fever under 3 months as red", () => {
    expect(alerts([temp(2, 38.2)])).toEqual([
      {
        key: "fever-infant",
        level: "red",
        message: "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay.",
      },
    ]);
  });
  it("flags 39°C between 3 and 6 months as red, like the triage screen", () => {
    expect(alerts([temp(2, 39.5)], 120)).toEqual([
      {
        key: "fever-infant",
        level: "red",
        message: "Bé 3–6 tháng sốt ≥ 39°C: cần đi khám ngay.",
      },
    ]);
    expect(alerts([temp(2, 38.9)], 120)[0].level).toBe("yellow");
    expect(alerts([temp(2, 39.5)], 183)[0].level).toBe("yellow");
  });
  it("flags fever from 3 months as yellow, with the release-1 wording until triage exists", () => {
    expect(alerts([temp(2, 38.5)], 100)).toEqual([
      {
        key: "fever",
        level: "yellow",
        message: "Bé đang sốt — theo dõi sát, hỏi bác sĩ nếu sốt kéo dài.",
      },
    ]);
    expect(alerts([temp(2, 38.5)], 100, NO_DATA, true)[0].message).toBe(
      "Bé đang sốt — xem Phân loại triệu chứng.",
    );
  });
  it("prefers very high fever and low temperature messages", () => {
    expect(alerts([temp(1, 40.1)])).toEqual([
      {
        key: "fever-high",
        level: "red",
        message: "Sốt rất cao: cần đi khám ngay.",
      },
    ]);
    expect(alerts([temp(1, 35.0)])).toEqual([
      {
        key: "hypothermia",
        level: "red",
        message: "Thân nhiệt thấp: cần đi khám ngay.",
      },
    ]);
  });
  it("uses only the latest reading within 6 hours", () => {
    expect(alerts([temp(7, 39)])).toEqual([]);
    expect(alerts([temp(3, 38.6), temp(1, 37.0)])).toEqual([]);
  });
});

describe("homeAlerts — diapers", () => {
  it("flags pale or bloody stool within 72 hours", () => {
    expect(alerts([stool(48, "pale")])).toEqual([
      {
        key: "stool-pale",
        level: "red",
        message: "Phân bạc màu: cần đi khám ngay.",
      },
    ]);
    expect(alerts([stool(10, "red")])).toEqual([
      {
        key: "stool-blood",
        level: "red",
        message: "Phân có máu: cần đi khám ngay.",
      },
    ]);
    expect(alerts([stool(80, "pale")])).toEqual([]);
  });
  it("flags a red wet-diaper rating", () => {
    const red: MetricResult = {
      status: "rated",
      rating: "red",
      value: 2,
      explain: "Rất ít tã ướt: nguy cơ mất nước",
    };
    expect(alerts([], 60, red)).toEqual([
      { key: "few-wet", level: "red", message: "Ít tã ướt: nguy cơ mất nước." },
    ]);
  });
  it("lists red alerts before yellow ones", () => {
    expect(
      alerts([temp(1, 38.5), stool(5, "pale")], 100).map((a) => a.key),
    ).toEqual(["stool-pale", "fever"]);
  });
});

describe("medicineWarnings", () => {
  it("warns when the previous antipyretic dose was less than 4 hours ago", () => {
    expect(medicineWarnings({ logs: [med(3, true)], at: NOW })).toEqual([
      "Chưa đủ 4 giờ từ liều hạ sốt trước (09:00).",
    ]);
    expect(medicineWarnings({ logs: [med(5, true)], at: NOW })).toEqual([]);
  });
  it("warns when 4 antipyretic doses were given in 24 hours", () => {
    const logs = [med(5, true), med(10, true), med(15, true), med(20, true)];
    expect(medicineWarnings({ logs, at: NOW })).toEqual([
      "Đã đủ 4 liều hạ sốt trong 24 giờ.",
    ]);
  });
  it("warns about a later dose when a forgotten one is entered afterwards", () => {
    // Dose already logged at 10:00; the forgotten 08:30 dose is entered now.
    const at = new Date(NOW.getTime() - 3.5 * H);
    expect(medicineWarnings({ logs: [med(2, true)], at })).toEqual([
      "Chưa đủ 4 giờ trước liều hạ sốt sau (10:00).",
    ]);
    // A dose 4.5 hours earlier and nothing after it is fine.
    expect(medicineWarnings({ logs: [med(8, true)], at })).toEqual([]);
  });
  it("counts the 24-hour limit around a back-dated dose", () => {
    const logs = [med(22, true), med(17, true), med(7, true), med(1, true)];
    // 12 hours ago sits between them: five doses within 21 hours.
    const at = new Date(NOW.getTime() - 12 * H);
    expect(medicineWarnings({ logs, at })).toEqual([
      "Đã đủ 4 liều hạ sốt trong 24 giờ.",
    ]);
    // Three other doses nearby is still fine.
    expect(medicineWarnings({ logs: logs.slice(1), at })).toEqual([]);
  });
  it("ignores medicine that is not an antipyretic", () => {
    expect(medicineWarnings({ logs: [med(1, false)], at: NOW })).toEqual([]);
  });
});

describe("vitaminDToday", () => {
  it("returns the time of today's vitamin D (VN day, case-insensitive)", () => {
    expect(vitaminDToday([med(4, false, " vitamin D ")], NOW)).toBe("08:00");
  });
  it("recognises the names people type for the same drops", () => {
    for (const name of [
      "Vitamin D3",
      "vitamin d3 k2",
      "VitaminD",
      "Vitamin D (Aquadetrim)",
    ])
      expect(vitaminDToday([med(4, false, name)], NOW)).toBe("08:00");
    for (const name of ["Vitamin DHA", "DHA", "Vitamin C"])
      expect(vitaminDToday([med(4, false, name)], NOW)).toBeNull();
  });
  it("ignores yesterday's dose", () => {
    expect(vitaminDToday([med(18, false, "Vitamin D")], NOW)).toBeNull();
  });
});
