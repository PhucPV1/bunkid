import { describe, expect, it } from "vitest";
import {
  moveContact,
  nextSort,
  normalizePhone,
  parseContactForm,
  profileLines,
  sortContacts,
  type Contact,
} from "./emergency";

const contact = (
  id: string,
  sort: number,
  created_at = "2026-11-14T00:00:00Z",
): Contact => ({
  id,
  label: id,
  phone: "0901234567",
  sort,
  created_at,
});

describe("parseContactForm", () => {
  it("trims the label and strips spaces, dots, dashes and brackets from the phone", () => {
    expect(normalizePhone(" (+84) 912.345-678 ")).toBe("+84912345678");
    expect(
      parseContactForm({ label: "  Bác sĩ Lan ", phone: "090 123 4567" }),
    ).toEqual({
      ok: true,
      value: { label: "Bác sĩ Lan", phone: "0901234567" },
    });
  });

  it("rejects an empty or long label and a malformed phone", () => {
    expect(parseContactForm({ label: " ", phone: "0901234567" })).toEqual({
      ok: false,
      message: "Nhập tên người hoặc nơi cần gọi.",
    });
    expect(
      parseContactForm({ label: "x".repeat(61), phone: "0901234567" }),
    ).toEqual({
      ok: false,
      message: "Tên tối đa 60 ký tự.",
    });
    for (const phone of ["12", "09a1234567", "+", "1234567890123456"])
      expect(parseContactForm({ label: "A", phone })).toEqual({
        ok: false,
        message: "Số điện thoại chỉ gồm chữ số, có thể bắt đầu bằng +.",
      });
  });
});

describe("contact order", () => {
  it("sorts by sort then creation time, and appends after the last", () => {
    const list = [
      contact("b", 1),
      contact("a2", 0, "2026-11-14T02:00:00Z"),
      contact("a1", 0, "2026-11-14T01:00:00Z"),
    ];
    expect(sortContacts(list).map((c) => c.id)).toEqual(["a1", "a2", "b"]);
    expect(nextSort(list)).toBe(2);
    expect(nextSort([])).toBe(0);
  });

  it("moveContact swaps neighbours and renumbers only what changed", () => {
    const list = [contact("x", 0), contact("y", 1), contact("z", 2)];
    expect(moveContact(list, "z", -1)).toEqual([
      { id: "z", sort: 1 },
      { id: "y", sort: 2 },
    ]);
    expect(moveContact(list, "x", -1)).toEqual([]);
    expect(moveContact(list, "z", 1)).toEqual([]);
    const tied = [
      contact("p", 0, "2026-11-14T01:00:00Z"),
      contact("q", 0, "2026-11-14T02:00:00Z"),
    ];
    expect(moveContact(tied, "q", -1)).toEqual([{ id: "p", sort: 1 }]);
  });
});

describe("profileLines (spec §6.7)", () => {
  const baby = {
    name: "Bé Na",
    dob: "2026-09-14",
    blood_type: null,
    allergies: null,
    birth_weight_g: 3200,
  };
  const now = new Date("2026-11-14T03:00:00Z");

  it("falls back to the birth weight and 'Chưa ghi'", () => {
    expect(profileLines(baby, null, now)).toEqual([
      { label: "Tên", value: "Bé Na" },
      { label: "Tuổi", value: "2 tháng" },
      { label: "Nhóm máu", value: "Chưa ghi" },
      { label: "Dị ứng", value: "Chưa ghi" },
      { label: "Cân nặng gần nhất", value: "3.200 g (lúc sinh)" },
    ]);
  });

  it("prefers the latest measured weight", () => {
    const lines = profileLines(
      {
        ...baby,
        blood_type: "O+",
        allergies: "Đạm sữa bò",
        birth_weight_g: null,
      },
      5150,
      now,
    );
    expect(lines.slice(2)).toEqual([
      { label: "Nhóm máu", value: "O+" },
      { label: "Dị ứng", value: "Đạm sữa bò" },
      { label: "Cân nặng gần nhất", value: "5.150 g" },
    ]);
    expect(
      profileLines({ ...baby, birth_weight_g: null }, null, now)[4].value,
    ).toBe("Chưa ghi");
  });
});
