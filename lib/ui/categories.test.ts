import { describe, expect, it } from "vitest";
import { LOG_TYPES } from "@/lib/rules/logDetails";
import { CATEGORIES } from "./categories";
import { ICON_PATHS } from "./icons";
import { TOKEN_NAMES } from "./tokens";

describe("log categories", () => {
  it("covers every log type", () => {
    expect(Object.keys(CATEGORIES).sort()).toEqual([...LOG_TYPES].sort());
  });

  it("uses the spec's token, icon and label for each type", () => {
    expect(CATEGORIES).toEqual({
      breast: { token: "cat-feed", icon: "heart", label: "Bú mẹ" },
      bottle: { token: "cat-bottle", icon: "bottle", label: "Bú bình" },
      sleep: { token: "cat-sleep", icon: "moon", label: "Ngủ" },
      diaper: { token: "cat-diaper", icon: "drop", label: "Thay tã" },
      pump: { token: "cat-pump", icon: "cup", label: "Hút sữa" },
      tummy: { token: "cat-tummy", icon: "smile", label: "Nằm sấp" },
      medicine: { token: "cat-med", icon: "pill", label: "Thuốc" },
      temperature: { token: "cat-temp", icon: "thermo", label: "Nhiệt độ" },
    });
  });

  it("every token and icon exists", () => {
    for (const { token, icon } of Object.values(CATEGORIES)) {
      expect(TOKEN_NAMES).toContain(token);
      expect(ICON_PATHS[icon]).toBeTruthy();
    }
  });
});

describe("icon paths", () => {
  it("has the 39 icons the app uses, each a non-empty path", () => {
    expect(Object.keys(ICON_PATHS)).toHaveLength(39);
    for (const d of Object.values(ICON_PATHS)) expect(d).toMatch(/^[Mm]/);
  });
});
