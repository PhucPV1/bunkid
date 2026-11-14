import { describe, expect, it } from "vitest";
import {
  FEED_INTERVAL_OPTIONS,
  formatInterval,
  parseMemberForm,
  roleLabel,
} from "./familySettings";

describe("familySettings", () => {
  it("parseMemberForm trims and lowercases the Gmail", () => {
    expect(
      parseMemberForm({
        email: "  Ba.Be@Gmail.COM ",
        displayName: " Ba ",
        role: "member",
      }),
    ).toEqual({
      ok: true,
      value: { email: "ba.be@gmail.com", display_name: "Ba", role: "member" },
    });
  });

  it("parseMemberForm reports every invalid field", () => {
    expect(
      parseMemberForm({ email: "ba@", displayName: " ", role: "admin" }),
    ).toEqual({
      ok: false,
      errors: {
        email: "Nhập Gmail hợp lệ",
        displayName: "Nhập tên hiển thị (tối đa 40 ký tự)",
        role: "Chọn vai trò",
      },
    });
    expect(
      parseMemberForm({
        email: "a@b.c",
        displayName: "x".repeat(41),
        role: "owner",
      }),
    ).toMatchObject({ ok: false, errors: { displayName: expect.any(String) } });
  });

  it("roleLabel names both roles and passes unknown values through", () => {
    expect(roleLabel("owner")).toBe("Chủ gia đình");
    expect(roleLabel("member")).toBe("Thành viên");
    expect(roleLabel("guest")).toBe("guest");
  });

  it("feed interval options go from 60 to 360 minutes in steps of 15", () => {
    expect(FEED_INTERVAL_OPTIONS).toHaveLength(21);
    expect(FEED_INTERVAL_OPTIONS[0]).toBe(60);
    expect(FEED_INTERVAL_OPTIONS.at(-1)).toBe(360);
    expect(FEED_INTERVAL_OPTIONS).toContain(195);
  });

  it("formatInterval writes hours and minutes", () => {
    expect(formatInterval(60)).toBe("1 giờ");
    expect(formatInterval(180)).toBe("3 giờ");
    expect(formatInterval(135)).toBe("2 giờ 15 phút");
  });
});
