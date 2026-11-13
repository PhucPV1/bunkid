import { describe, expect, it } from "vitest";
import { describeLog } from "@/lib/rules/describeLog";

const now = new Date("2026-11-13T03:00:00Z");
const at = (iso: string) => iso;

describe("describeLog", () => {
  it("describes a running breast timer with elapsed time", () => {
    expect(
      describeLog(
        {
          type: "breast",
          started_at: at("2026-11-13T02:48:00Z"),
          ended_at: null,
          details: { side: "left" },
        },
        now,
      ),
    ).toBe("Bú trái · 12 phút (đang chạy)");
  });
  it("describes a finished sleep", () => {
    expect(
      describeLog(
        {
          type: "sleep",
          started_at: at("2026-11-13T00:00:00Z"),
          ended_at: at("2026-11-13T01:05:00Z"),
          details: {},
        },
        now,
      ),
    ).toBe("Ngủ · 1 giờ 05 phút");
  });
  it("describes instant entries", () => {
    const t = at("2026-11-13T02:00:00Z");
    expect(
      describeLog(
        {
          type: "bottle",
          started_at: t,
          ended_at: t,
          details: { ml: 90, milk: "breast_milk" },
        },
        now,
      ),
    ).toBe("Bình 90 ml sữa mẹ");
    expect(
      describeLog(
        {
          type: "diaper",
          started_at: t,
          ended_at: t,
          details: { wet: true, dirty: true, stoolColor: "yellow" },
        },
        now,
      ),
    ).toBe("Tã ướt + bẩn (phân vàng)");
    expect(
      describeLog(
        {
          type: "medicine",
          started_at: t,
          ended_at: t,
          details: {
            name: "Paracetamol",
            amount: 2.5,
            unit: "ml",
            antipyretic: true,
          },
        },
        now,
      ),
    ).toBe("Thuốc Paracetamol 2.5 ml · hạ sốt");
    expect(
      describeLog(
        {
          type: "temperature",
          started_at: t,
          ended_at: t,
          details: { celsius: 37.8, method: "nach" },
        },
        now,
      ),
    ).toBe("Nhiệt độ 37.8°C (nách)");
  });
  it("falls back for invalid details", () => {
    expect(
      describeLog(
        {
          type: "bottle",
          started_at: now.toISOString(),
          ended_at: null,
          details: { ml: "x" },
        },
        now,
      ),
    ).toBe("Bản ghi không hợp lệ");
  });
});
