import { describe, expect, it } from "vitest";
import {
  ageMonthsOn,
  defaultTakenOn,
  fitWithin,
  groupByAgeMonth,
  parsePhotoForm,
  photoPath,
  usage,
} from "./photos";

const MB = 1024 ** 2;

describe("fitWithin (spec §6.14)", () => {
  it("keeps small images and scales the longest side down to 1600 px", () => {
    expect(fitWithin(1200, 800)).toEqual({ width: 1200, height: 800 });
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(1600, 900)).toEqual({ width: 1600, height: 900 });
  });
});

describe("photoPath", () => {
  it("uses <family_id>/<baby_id>/<uuid>.jpg", () => {
    expect(photoPath("f", "b", "p")).toBe("f/b/p.jpg");
  });
});

describe("usage (spec §6.14)", () => {
  it("warns from 900 MB and blocks from 1000 MB", () => {
    expect(usage(250 * MB)).toEqual({
      level: "ok",
      percent: (250 / 1024) * 100,
      text: "Đã dùng 250 MB / 1 GB",
    });
    expect(usage(900 * MB).level).toBe("warn");
    expect(usage(900 * MB).text).toBe(
      "Đã dùng 900 MB / 1 GB. Sắp đầy dung lượng.",
    );
    expect(usage(1000 * MB).level).toBe("full");
    expect(usage(2000 * MB).percent).toBe(100);
  });
});

describe("months of age", () => {
  it("counts whole months between dob and the day", () => {
    expect(ageMonthsOn("2026-09-14", "2026-10-13")).toBe(0);
    expect(ageMonthsOn("2026-09-14", "2026-10-14")).toBe(1);
    expect(ageMonthsOn("2026-01-31", "2026-03-01")).toBe(1);
    expect(ageMonthsOn("2026-09-14", "2026-09-01")).toBe(0);
  });

  it("groups photos by month of age, newest group and photo first", () => {
    const p = (
      id: string,
      taken_on: string,
      created_at = "2026-11-14T00:00:00Z",
    ) => ({
      id,
      taken_on,
      created_at,
    });
    const groups = groupByAgeMonth(
      [
        p("a", "2026-09-20"),
        p("b", "2026-11-14"),
        p("c", "2026-10-20"),
        p("d", "2026-11-14", "2026-11-14T05:00:00Z"),
      ],
      "2026-09-14",
    );
    expect(groups.map((g) => [g.label, g.photos.map((x) => x.id)])).toEqual([
      ["2 tháng tuổi", ["d", "b"]],
      ["1 tháng tuổi", ["c"]],
      ["Dưới 1 tháng tuổi", ["a"]],
    ]);
  });
});

describe("photo form", () => {
  const now = new Date("2026-11-14T03:00:00Z");
  it("defaults the day to the EXIF day, else the file date, within dob..today", () => {
    const picked = Date.parse("2026-11-14T02:00:00Z");
    expect(defaultTakenOn("2026-10-05", picked, "2026-09-14", now)).toBe(
      "2026-10-05",
    );
    expect(
      defaultTakenOn(null, Date.parse("2026-11-10T20:00:00Z"), "2026-09-14", now),
    ).toBe("2026-11-11");
    expect(defaultTakenOn("2025-01-01", picked, "2026-09-14", now)).toBe(
      "2026-09-14",
    );
    expect(
      defaultTakenOn(null, Date.parse("2027-01-01T00:00:00Z"), "2026-09-14", now),
    ).toBe("2026-11-14");
  });

  it("checks the day and the caption", () => {
    const ctx = { dob: "2026-09-14", today: "2026-11-14" };
    expect(
      parsePhotoForm(
        { takenOn: "2026-11-14", caption: "  Lần đầu cười " },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: { taken_on: "2026-11-14", caption: "Lần đầu cười" },
    });
    expect(parsePhotoForm({ takenOn: "2026-11-15", caption: "" }, ctx)).toEqual(
      {
        ok: false,
        message: "Ngày chụp phải từ ngày sinh đến hôm nay.",
      },
    );
    expect(
      parsePhotoForm({ takenOn: "2026-11-14", caption: "x".repeat(201) }, ctx),
    ).toEqual({
      ok: false,
      message: "Ghi chú tối đa 200 ký tự.",
    });
  });
});
