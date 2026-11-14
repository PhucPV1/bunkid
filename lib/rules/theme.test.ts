import { describe, expect, it } from "vitest";
import {
  DEFAULT_NIGHT_SCHEDULE,
  HALF_HOURS,
  inNightWindow,
  nextNightBoundary,
  parseNightOverride,
  parseNightSchedule,
  resolveActiveTheme,
  toggleNightOverride,
  vnMinuteOfDay,
  type NightSchedule,
} from "./theme";

// VN is UTC+7 all year. `vn("21:00")` is 2026-11-14 21:00 in Vietnam.
const vn = (hm: string, day = 14) =>
  new Date(
    Date.UTC(2026, 10, day, Number(hm.slice(0, 2)) - 7, Number(hm.slice(3))),
  );
const LATE: NightSchedule = { enabled: true, start: "22:30", end: "05:30" };

describe("night window", () => {
  it("reads the clock in Vietnam time", () => {
    expect(vnMinuteOfDay(vn("00:00"))).toBe(0);
    expect(vnMinuteOfDay(vn("21:00"))).toBe(21 * 60);
    expect(vnMinuteOfDay(vn("05:59"))).toBe(5 * 60 + 59);
  });

  it("21:00–06:00 includes its start and excludes its end", () => {
    const s = DEFAULT_NIGHT_SCHEDULE;
    expect(inNightWindow(vn("20:59"), s)).toBe(false);
    expect(inNightWindow(vn("21:00"), s)).toBe(true);
    expect(inNightWindow(vn("05:59"), s)).toBe(true);
    expect(inNightWindow(vn("06:00"), s)).toBe(false);
  });

  it("works for another window across midnight", () => {
    expect(inNightWindow(vn("22:29"), LATE)).toBe(false);
    expect(inNightWindow(vn("22:30"), LATE)).toBe(true);
    expect(inNightWindow(vn("05:29"), LATE)).toBe(true);
    expect(inNightWindow(vn("05:30"), LATE)).toBe(false);
  });

  it("a disabled schedule or an empty window is never night", () => {
    expect(
      inNightWindow(vn("23:00"), { ...DEFAULT_NIGHT_SCHEDULE, enabled: false }),
    ).toBe(false);
    expect(
      inNightWindow(vn("23:00"), {
        enabled: true,
        start: "21:00",
        end: "21:00",
      }),
    ).toBe(false);
  });
});

describe("nextNightBoundary", () => {
  const s = DEFAULT_NIGHT_SCHEDULE;
  it("from 03:00 the next boundary is 06:00 the same morning", () => {
    expect(nextNightBoundary(vn("03:00"), s).toISOString()).toBe(
      vn("06:00").toISOString(),
    );
  });
  it("from 12:00 it is 21:00 the same day", () => {
    expect(nextNightBoundary(vn("12:00"), s).toISOString()).toBe(
      vn("21:00").toISOString(),
    );
  });
  it("from 23:00 it is 06:00 the next morning", () => {
    expect(nextNightBoundary(vn("23:00"), s).toISOString()).toBe(
      vn("06:00", 15).toISOString(),
    );
  });
  it("exactly at 21:00 it skips to 06:00", () => {
    expect(nextNightBoundary(vn("21:00"), s).toISOString()).toBe(
      vn("06:00", 15).toISOString(),
    );
  });
});

describe("resolveActiveTheme", () => {
  const base = {
    pref: "system" as const,
    prefersDark: false,
    schedule: DEFAULT_NIGHT_SCHEDULE,
    override: null,
  };

  it("uses the schedule when there is no override", () => {
    expect(resolveActiveTheme({ ...base, now: vn("12:00") })).toBe("light");
    expect(resolveActiveTheme({ ...base, now: vn("22:00") })).toBe("night");
    expect(
      resolveActiveTheme({ ...base, pref: "dark", now: vn("12:00") }),
    ).toBe("dark");
    expect(
      resolveActiveTheme({ ...base, pref: "light", now: vn("22:00") }),
    ).toBe("night");
  });

  it("follows the device for system", () => {
    expect(
      resolveActiveTheme({ ...base, prefersDark: true, now: vn("12:00") }),
    ).toBe("dark");
  });

  it("a live override wins over the schedule, both ways", () => {
    const until = vn("21:00").toISOString();
    expect(
      resolveActiveTheme({
        ...base,
        override: { on: true, until },
        now: vn("12:00"),
      }),
    ).toBe("night");
    const morning = vn("06:00", 15).toISOString();
    expect(
      resolveActiveTheme({
        ...base,
        override: { on: false, until: morning },
        now: vn("22:00"),
      }),
    ).toBe("light");
  });

  it("an expired override is ignored", () => {
    const until = vn("11:00").toISOString();
    expect(
      resolveActiveTheme({
        ...base,
        override: { on: true, until },
        now: vn("12:00"),
      }),
    ).toBe("light");
  });
});

describe("stored values", () => {
  it("parseNightSchedule accepts only valid half-hour schedules", () => {
    expect(parseNightSchedule(null)).toEqual(DEFAULT_NIGHT_SCHEDULE);
    expect(parseNightSchedule("{not json")).toEqual(DEFAULT_NIGHT_SCHEDULE);
    expect(parseNightSchedule(JSON.stringify(LATE))).toEqual(LATE);
    expect(
      parseNightSchedule(
        JSON.stringify({ enabled: false, start: "21:00", end: "06:00" }),
      ),
    ).toEqual({ enabled: false, start: "21:00", end: "06:00" });
    expect(
      parseNightSchedule(
        JSON.stringify({ enabled: true, start: "25:00", end: "06:00" }),
      ),
    ).toEqual(DEFAULT_NIGHT_SCHEDULE);
    expect(
      parseNightSchedule(
        JSON.stringify({ enabled: true, start: "21:15", end: "06:00" }),
      ),
    ).toEqual(DEFAULT_NIGHT_SCHEDULE);
  });

  it("parseNightOverride rejects malformed values", () => {
    expect(parseNightOverride(null)).toBeNull();
    expect(parseNightOverride("null")).toBeNull();
    expect(
      parseNightOverride(
        JSON.stringify({ on: true, until: "2026-11-14T14:00:00.000Z" }),
      ),
    ).toEqual({ on: true, until: "2026-11-14T14:00:00.000Z" });
    expect(
      parseNightOverride(
        JSON.stringify({ on: "yes", until: "2026-11-14T14:00:00.000Z" }),
      ),
    ).toBeNull();
    expect(
      parseNightOverride(JSON.stringify({ on: true, until: "later" })),
    ).toBeNull();
  });
});

describe("toggleNightOverride", () => {
  it("turns night on until the next boundary", () => {
    expect(
      toggleNightOverride("light", DEFAULT_NIGHT_SCHEDULE, vn("12:00")),
    ).toEqual({ on: true, until: vn("21:00").toISOString() });
  });
  it("turns night off when it is night", () => {
    expect(
      toggleNightOverride("night", DEFAULT_NIGHT_SCHEDULE, vn("22:00")),
    ).toEqual({ on: false, until: vn("06:00", 15).toISOString() });
  });
  it("lasts 100 years when the schedule is off", () => {
    const result = toggleNightOverride(
      "dark",
      { ...DEFAULT_NIGHT_SCHEDULE, enabled: false },
      vn("12:00"),
    );
    expect(result.on).toBe(true);
    expect(new Date(result.until).getUTCFullYear()).toBe(2126);
  });
});

describe("HALF_HOURS", () => {
  it("lists every half hour of the day", () => {
    expect(HALF_HOURS).toHaveLength(48);
    expect(HALF_HOURS[0]).toBe("00:00");
    expect(HALF_HOURS[1]).toBe("00:30");
    expect(HALF_HOURS[42]).toBe("21:00");
    expect(HALF_HOURS[47]).toBe("23:30");
  });
});
