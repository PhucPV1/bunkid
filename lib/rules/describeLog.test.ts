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
  it("names a tummy timer Nằm sấp", () => {
    expect(
      describeLog(
        {
          type: "tummy",
          started_at: at("2026-11-13T02:50:00Z"),
          ended_at: at("2026-11-13T02:54:00Z"),
          details: {},
        },
        now,
      ),
    ).toBe("Nằm sấp · 4 phút");
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
  const instant = (type: string, details: unknown) =>
    describeLog(
      {
        type,
        started_at: "2026-11-13T02:00:00Z",
        ended_at: "2026-11-13T02:00:00Z",
        details,
      },
      now,
    );
  it("describes solids with its amount, new-food mark and reaction", () => {
    const solids = { food: "Cháo bí đỏ", amount: "some", isNew: false };
    expect(instant("solids", solids)).toBe("Ăn dặm · Cháo bí đỏ · vừa");
    expect(
      instant("solids", { ...solids, amount: "little", isNew: true }),
    ).toBe("Ăn dặm · Cháo bí đỏ · ít · món mới");
    expect(
      instant("solids", { ...solids, amount: "lots", reaction: "nổi mẩn" }),
    ).toBe("Ăn dặm · Cháo bí đỏ · nhiều · nổi mẩn");
    expect(
      instant("solids", { ...solids, isNew: true, reaction: "nổi mẩn" }),
    ).toBe("Ăn dặm · Cháo bí đỏ · vừa · món mới · nổi mẩn");
  });
  it("describes water, bath and note", () => {
    expect(instant("water", { ml: 30 })).toBe("Uống nước · 30 ml");
    expect(instant("bath", {})).toBe("Tắm");
    expect(instant("note", { text: "Bé cười nhiều" })).toBe(
      "Ghi chú · Bé cười nhiều",
    );
    expect(instant("water", { ml: 0 })).toBe("Bản ghi không hợp lệ");
    expect(instant("vaccine", {})).toBe("Bản ghi không hợp lệ");
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
