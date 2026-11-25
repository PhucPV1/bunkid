import { describe, expect, it } from "vitest";
import { LOG_TYPES } from "@/lib/rules/logDetails";
import {
  CATEGORIES,
  CATEGORY_CHIP,
  CATEGORY_RUNNING,
  CATEGORY_SOLID,
  CATEGORY_TEXT,
  categoryOf,
} from "./categories";
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
      solids: { token: "cat-bottle", icon: "bowl", label: "Ăn dặm" },
      water: { token: "cat-pump", icon: "glass", label: "Uống nước" },
      bath: { token: "cat-diaper", icon: "bath", label: "Tắm" },
      note: { token: "cat-tummy", icon: "doc", label: "Ghi chú" },
    });
  });

  it("categoryOf falls back to a neutral category for an unknown type", () => {
    expect(categoryOf("sleep")).toBe(CATEGORIES.sleep);
    expect(categoryOf("vaccine")).toEqual({
      token: "cat-med",
      icon: "doc",
      label: "Bản ghi",
    });
    expect(categoryOf("toString").label).toBe("Bản ghi");
  });

  it("every token and icon exists", () => {
    for (const { token, icon } of Object.values(CATEGORIES)) {
      expect(TOKEN_NAMES).toContain(token);
      expect(ICON_PATHS[icon]).toBeTruthy();
    }
  });
});

describe("category class maps", () => {
  it("CATEGORY_CHIP tints every category with its own colour", () => {
    expect(CATEGORY_CHIP["cat-feed"]).toBe("bg-cat-feed/15 text-cat-feed");
    expect(Object.keys(CATEGORY_CHIP)).toHaveLength(8);
  });

  it("CATEGORY_RUNNING fills every category with its colour inside a halo", () => {
    expect(CATEGORY_RUNNING["cat-sleep"]).toBe(
      "bg-cat-sleep ring-4 ring-cat-sleep/30",
    );
    expect(Object.keys(CATEGORY_RUNNING)).toHaveLength(8);
  });

  // Spec 2026-11-19 §4: the 36 px circle of the tab bar's timer tile.
  it("CATEGORY_SOLID fills every category with its colour, without a halo", () => {
    expect(CATEGORY_SOLID["cat-sleep"]).toBe("bg-cat-sleep text-bg");
    expect(Object.keys(CATEGORY_SOLID)).toHaveLength(8);
    for (const classes of Object.values(CATEGORY_SOLID))
      expect(classes).not.toContain("ring");
  });

  // The idle circle of a round timer button: only the icon takes the colour.
  it("CATEGORY_TEXT colours every category's icon", () => {
    expect(CATEGORY_TEXT["cat-pump"]).toBe("text-cat-pump");
    expect(Object.keys(CATEGORY_TEXT)).toHaveLength(8);
  });
});

describe("icon paths", () => {
  it("has the 48 icons the app uses, each a non-empty path", () => {
    expect(Object.keys(ICON_PATHS)).toHaveLength(48);
    for (const d of Object.values(ICON_PATHS)) expect(d).toMatch(/^[Mm]/);
  });

  // Spec 2026-11-19 §3.4: the "Khác" button on the home page.
  it("has more: three dots in a row", () => {
    expect(ICON_PATHS.more).toBe("M5 12h.01M12 12h.01M19 12h.01");
  });

  it("has bowl, glass and bath, each a closed shape plus detail strokes", () => {
    const paths: Record<string, string> = ICON_PATHS;
    for (const name of ["bowl", "glass", "bath"]) {
      expect(paths[name], name).toMatch(/^M[^z]+z(M[^z]+)+$/);
      expect(paths[name]).not.toMatch(/[^MmLlHhVvAaZz0-9 .-]/);
    }
  });
});
