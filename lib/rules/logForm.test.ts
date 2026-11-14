import { describe, expect, it } from "vitest";
import {
  buildLogDetails,
  buildLogPatch,
  LOG_FIELDS,
  valuesFromDetails,
} from "./logForm";
import { QUICK_FIELDS } from "./quickEntry";

const now = new Date("2026-11-14T03:00:00Z"); // 10:00 on 14/11 in VN
const base = {
  values: {},
  note: "",
  allowOpenEnd: false,
  now,
};

describe("logForm", () => {
  it("LOG_FIELDS adds timer types to the quick-entry fields", () => {
    expect(LOG_FIELDS.bottle).toBe(QUICK_FIELDS.bottle);
    expect(LOG_FIELDS.breast.map((f) => f.key)).toEqual(["side"]);
    expect(LOG_FIELDS.sleep).toEqual([]);
  });

  it("valuesFromDetails round-trips through buildLogDetails", () => {
    const details = { ml: 120, milk: "formula" };
    const values = valuesFromDetails("bottle", details);
    expect(values).toEqual({ ml: "120", milk: "formula" });
    expect(buildLogDetails("bottle", values)).toEqual({ ok: true, details });
    expect(
      valuesFromDetails("temperature", { celsius: 37.5, method: "tai" }),
    ).toEqual({ celsius: "37.5", method: "tai" });
  });

  it("valuesFromDetails falls back to defaults for broken details", () => {
    expect(valuesFromDetails("breast", { side: "up" })).toEqual({
      side: "left",
    });
  });

  it("buildLogDetails handles pump amounts", () => {
    expect(buildLogDetails("pump", { mlLeft: "", mlRight: "" })).toEqual({
      ok: true,
      details: {},
    });
    expect(buildLogDetails("pump", { mlLeft: "60", mlRight: "" })).toEqual({
      ok: true,
      details: { mlLeft: 60 },
    });
    expect(buildLogDetails("pump", { mlLeft: "600", mlRight: "" })).toEqual({
      ok: false,
      message: "Nhập số ml từ 0 đến 500",
    });
  });

  it("buildLogPatch uses VN time and ends instant logs at their start", () => {
    const result = buildLogPatch({
      ...base,
      type: "temperature",
      values: { celsius: "37,8", method: "nach" },
      start: "2026-11-14T08:30",
      end: "",
      note: "  sau khi tắm  ",
    });
    expect(result).toEqual({
      ok: true,
      patch: {
        started_at: "2026-11-14T01:30:00.000Z",
        ended_at: "2026-11-14T01:30:00.000Z",
        details: { celsius: 37.8, method: "nach" },
        note: "sau khi tắm",
      },
    });
  });

  it("buildLogPatch needs an end time for timers unless one may stay open", () => {
    const input = {
      ...base,
      type: "sleep" as const,
      start: "2026-11-14T07:00",
      end: "",
    };
    expect(buildLogPatch(input)).toEqual({
      ok: false,
      message: "Nhập giờ kết thúc",
    });
    const open = buildLogPatch({ ...input, allowOpenEnd: true });
    expect(open.ok && open.patch.ended_at).toBeNull();
  });

  it("buildLogPatch rejects bad time ranges", () => {
    const sleep = { ...base, type: "sleep" as const };
    expect(
      buildLogPatch({
        ...sleep,
        start: "2026-11-14T07:00",
        end: "2026-11-14T06:59",
      }),
    ).toEqual({ ok: false, message: "Giờ kết thúc phải sau giờ bắt đầu" });
    expect(
      buildLogPatch({
        ...sleep,
        start: "2026-11-14T10:02",
        end: "2026-11-14T10:03",
      }),
    ).toEqual({ ok: false, message: "Giờ bắt đầu không được ở tương lai" });
    expect(
      buildLogPatch({
        ...sleep,
        start: "2026-11-14T09:00",
        end: "2026-11-14T10:05",
      }),
    ).toEqual({ ok: false, message: "Giờ kết thúc không được ở tương lai" });
    expect(buildLogPatch({ ...sleep, start: "", end: "" })).toEqual({
      ok: false,
      message: "Nhập giờ bắt đầu",
    });
  });

  it("buildLogPatch limits notes to 500 characters and validates details first", () => {
    expect(
      buildLogPatch({
        ...base,
        type: "sleep",
        start: "2026-11-14T07:00",
        end: "2026-11-14T08:00",
        note: "a".repeat(501),
      }),
    ).toEqual({ ok: false, message: "Ghi chú tối đa 500 ký tự" });
    expect(
      buildLogPatch({
        ...base,
        type: "bottle",
        values: { ml: "", milk: "formula" },
        start: "2026-11-14T07:00",
        end: "",
      }),
    ).toEqual({ ok: false, message: "Nhập số ml từ 1 đến 400" });
  });
});
