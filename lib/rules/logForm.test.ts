import { describe, expect, it } from "vitest";
import {
  buildLogDetails,
  buildLogPatch,
  defaultLogValues,
  hasNoteField,
  LOG_FIELDS,
  MANUAL_TYPES,
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

  it("MANUAL_TYPES: the six old types, then Ăn dặm, Uống nước, Tắm and Ghi chú", () => {
    expect(MANUAL_TYPES).toHaveLength(10);
    expect(MANUAL_TYPES[5].label).toBe("Nhiệt độ");
    expect(MANUAL_TYPES.slice(6)).toEqual([
      { value: "solids", label: "Ăn dặm" },
      { value: "water", label: "Uống nước" },
      { value: "bath", label: "Tắm" },
      { value: "note", label: "Ghi chú" },
    ]);
  });

  it("the new types take their fields and defaults from quick entry", () => {
    for (const type of ["solids", "water", "bath", "note"] as const)
      expect(LOG_FIELDS[type]).toBe(QUICK_FIELDS[type]);
    expect(defaultLogValues("bath")).toEqual({});
    const details = { food: "Cháo bí đỏ", amount: "lots", isNew: true };
    const values = valuesFromDetails("solids", details);
    expect(values).toEqual({ ...details, reaction: "" });
    expect(buildLogDetails("solids", values)).toEqual({ ok: true, details });
    expect(valuesFromDetails("water", { ml: 30 })).toEqual({ ml: "30" });
    expect(buildLogDetails("bath", {})).toEqual({ ok: true, details: {} });
  });

  it("spec 2026-11-26 §3.4: a symptom log round-trips with its codes as one string", () => {
    expect(LOG_FIELDS.symptom).toBe(QUICK_FIELDS.symptom);
    expect(defaultLogValues("symptom")).toEqual({ codes: "", note: "" });
    const details = { codes: ["runny_nose", "cough"], note: "Ho về đêm" };
    const values = valuesFromDetails("symptom", details);
    expect(values).toEqual({ codes: "runny_nose,cough", note: "Ho về đêm" });
    expect(buildLogDetails("symptom", values)).toEqual({ ok: true, details });
    expect(valuesFromDetails("symptom", { codes: ["cough"] })).toEqual({
      codes: "cough",
      note: "",
    });
    expect(buildLogDetails("symptom", { codes: "", note: "" })).toEqual({
      ok: false,
      message: "Chọn ít nhất một triệu chứng",
    });
  });

  it("spec 2026-11-26 §3.4: a symptom log keeps its note in details, never in logs.note", () => {
    expect(hasNoteField("symptom")).toBe(false);
    expect(
      buildLogPatch({
        ...base,
        type: "symptom",
        values: { codes: "cough", note: " Ho về đêm " },
        start: "2026-11-14T08:30",
        end: "",
        note: "gõ lúc còn chọn loại khác",
      }),
    ).toEqual({
      ok: true,
      patch: {
        started_at: "2026-11-14T01:30:00.000Z",
        ended_at: "2026-11-14T01:30:00.000Z",
        details: { codes: ["cough"], note: "Ho về đêm" },
        note: null,
      },
    });
  });

  it("a note log has no separate Ghi chú: buildLogPatch never fills logs.note for it", () => {
    expect(hasNoteField("note")).toBe(false);
    expect(hasNoteField("solids")).toBe(true);
    expect(hasNoteField("breast")).toBe(true);
    expect(
      buildLogPatch({
        ...base,
        type: "note",
        values: { text: " Bé cười nhiều " },
        start: "2026-11-14T08:30",
        end: "",
        note: "gõ lúc còn chọn loại khác",
      }),
    ).toEqual({
      ok: true,
      patch: {
        started_at: "2026-11-14T01:30:00.000Z",
        ended_at: "2026-11-14T01:30:00.000Z",
        details: { text: "Bé cười nhiều" },
        note: null,
      },
    });
  });
});
