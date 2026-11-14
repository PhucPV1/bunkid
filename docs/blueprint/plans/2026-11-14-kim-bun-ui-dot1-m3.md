# Kim Bun UI — Đợt 1 / M3 (Ban đêm theo lịch, màu thanh trạng thái) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-14

**Goal:** Thêm lịch Ban đêm tự bật (mặc định 21:00–06:00) và bật/tắt tạm thời, chọn theme trước lần vẽ đầu, cập nhật màu thanh trạng thái theo theme, và thêm điều khiển lịch vào phần Giao diện của Cài đặt.

**Architecture:**

- Luật thuần trong `lib/rules/theme.ts`: cửa sổ đêm theo giờ VN, mốc kế tiếp, chọn theme từ lựa chọn + hệ thống + lịch + bật tay.
- `lib/theme.ts` đọc 3 key `localStorage` (chuyển giá trị cũ `"night"` thành bật tay đến mốc kế tiếp) và chứa `THEME_INIT_SCRIPT` tự chứa; test bảo đảm script cho cùng kết quả với `resolveActiveTheme`.
- `lib/hooks/useTheme.ts` áp theme mỗi phút, khi hệ thống đổi sáng/tối và khi `localStorage` đổi; đặt `meta[name=theme-color]`.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, Vitest 5, Bun. Không thêm gói nào.

**Các mốc của Đợt 1 (spec §12):**

- **M1:** nhận diện Kim Bun — tên, logo, icon, manifest, service worker (spec §3.1–3.3). Wordmark (§3.4) chỉ dùng ở màn Đăng nhập và Cài app, nên làm cùng các màn đó ở Đợt 5.
- **M2:** token 3 theme, lớp kính, in, tiêu điểm, `Icon`, `Backdrop`, bảng loại sự kiện (spec §4.1–4.3, §4.5–4.8 phần CSS chung, §4.4 phần font; §5 phần `Backdrop`/`Icon`). Thang cỡ chữ §4.4 không thành token: component ở M4 và các đợt sau dùng class Tailwind có sẵn hoặc giá trị tùy ý (`text-[34px]/[41px]`) đúng bảng §4.4.
- **M3:** Ban đêm theo lịch và màu thanh trạng thái (spec §6.6, §6.7). Cần M2.
- **M4 (plan sau):** các component còn lại có cột "Đợt" = 1 ở spec §5: `Glass`, `Button`, `IconButton`, `Sheet`, `Segmented`, `ChipGroup`, `Switch`, `Swatch`, `ListGroup`/`ListRow`, `Toast`, `Skeleton`, `StatTile`. Cần M2.

Thứ tự làm: M1 → M2 → M3 → M4. M1 và M2 không phụ thuộc nhau.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- **Không tải font web.** Font chữ: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Noto Sans", sans-serif`. Font tròn: `ui-rounded, "SF Pro Rounded", -apple-system, sans-serif`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI (emoji cũ ở tab bar được thay ở Đợt 2).
- Chiều rộng thiết kế 375–440 pt.
- Logic nghiệp vụ là hàm thuần trong `lib/rules/`, có unit test.
- Mọi trang là client-rendered shell; không thêm middleware, không kiểm tra đăng nhập phía server.
- Route cũ phải còn chạy (không trả 404).
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong `.tsx` của `app/` và `components/`).
- Tương phản: mọi cặp chữ/nền ≥ 4.5:1 ở cả 3 theme (trên `--color-bg` và trên kính đã trộn với `--color-bg`); `--color-switch-on` ≥ 3:1 với `--color-bg`; theme Ban đêm không có `#FFFFFF` và không có màu hue 180–260.
- Không đổi các key `localStorage` đang có (`be-yeu-theme`, …), tên package `be-yeu`, tên cache service worker `be-yeu-…`, URL `bunkid.vercel.app`.
- Safari iOS 16.4 trở lên; vùng chạm ≥ 44×44 pt; tôn trọng `safe-area-inset-*`.
- Tôn trọng `prefers-reduced-motion: reduce` và `prefers-reduced-transparency: reduce`.
- Bản in `/bao-cao` vẫn đen trắng A4; khi in ẩn `Backdrop`, kính thành nền trắng không blur, không bóng.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".

## Contracts with Other Plans

**Produces** (Đợt 2 dùng cho nút trăng và trang Cài đặt mới):

- `lib/rules/theme.ts`: `type ThemePref = "light" | "dark" | "system"`, `type NightSchedule = { enabled: boolean; start: string; end: string }`, `type NightOverride = { on: boolean; until: string } | null`, `DEFAULT_NIGHT_SCHEDULE`, `HALF_HOURS`, `vnMinuteOfDay`, `parseHm`, `inNightWindow`, `nextNightBoundary`, `resolveActiveTheme`, `parseNightSchedule`, `parseNightOverride`, `toggleNightOverride`.
- `lib/theme.ts`: `THEME_STORAGE_KEY`, `NIGHT_SCHEDULE_KEY = "be-yeu-night-schedule"`, `NIGHT_OVERRIDE_KEY = "be-yeu-night-override"`, `THEME_COLORS`, `THEME_OPTIONS` (Sáng / Tối / Tự động), `parseThemePref`, `resolveTheme`, `type ThemeState`, `readThemeState`, `THEME_INIT_SCRIPT`.
- `lib/hooks/useTheme.ts`: `applyTheme(): ThemeName`, `useSystemThemeSync()`, `useThemePref()`, `useNightSchedule()`.
- `docs/device-checklist.md` bước 21.

**Consumes** (từ M2):

- `lib/ui/tokens.ts`: `type ThemeName = "light" | "dark" | "night"`.

---

### Task 1: Luật Ban đêm (`lib/rules/theme.ts`)

**Files:**

- Create: `lib/rules/theme.ts`, `lib/rules/theme.test.ts`

**Interfaces:**

- Consumes: `ThemeName` từ `lib/ui/tokens.ts` (M2).
- Produces:
  - `type ThemePref = "light" | "dark" | "system"`
  - `type NightSchedule = { enabled: boolean; start: string; end: string }` (giờ `"HH:mm"`, phút là `00` hoặc `30`)
  - `type NightOverride = { on: boolean; until: string } | null` (`until` ISO 8601)
  - `DEFAULT_NIGHT_SCHEDULE: NightSchedule` = `{ enabled: true, start: "21:00", end: "06:00" }`
  - `HALF_HOURS: string[]` (48 mốc `"00:00"` … `"23:30"`)
  - `vnMinuteOfDay(now: Date): number`, `parseHm(hm: string): number`
  - `inNightWindow(now: Date, schedule: NightSchedule): boolean`
  - `nextNightBoundary(now: Date, schedule: NightSchedule): Date`
  - `resolveActiveTheme(input: { pref: ThemePref; prefersDark: boolean; schedule: NightSchedule; override: NightOverride; now: Date }): ThemeName`
  - `parseNightSchedule(raw: string | null): NightSchedule`
  - `parseNightOverride(raw: string | null): NightOverride`
  - `toggleNightOverride(current: ThemeName, schedule: NightSchedule, now: Date): { on: boolean; until: string }`

- [ ] **Step 1: Viết test hỏng**

`lib/rules/theme.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/theme.test.ts`
Expected: FAIL — `Failed to resolve import "./theme"`.

- [ ] **Step 3: Viết `lib/rules/theme.ts`**

```ts
import type { ThemeName } from "@/lib/ui/tokens";

export type ThemePref = "light" | "dark" | "system";
export type NightSchedule = { enabled: boolean; start: string; end: string };
export type NightOverride = { on: boolean; until: string } | null;

export const DEFAULT_NIGHT_SCHEDULE: NightSchedule = {
  enabled: true,
  start: "21:00",
  end: "06:00",
};

const HM = /^([01]\d|2[0-3]):(00|30)$/;
const MINUTE = 60_000;
const DAY_MINUTES = 1440;
const VN_OFFSET_MINUTES = 7 * 60;

export const HALF_HOURS: string[] = Array.from(
  { length: 48 },
  (_, i) =>
    `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
);

export function vnMinuteOfDay(now: Date): number {
  const minutes = Math.floor(now.getTime() / MINUTE) + VN_OFFSET_MINUTES;
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

export function parseHm(hm: string): number {
  return Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
}

export function inNightWindow(now: Date, schedule: NightSchedule): boolean {
  if (!schedule.enabled) return false;
  const start = parseHm(schedule.start);
  const end = parseHm(schedule.end);
  if (start === end) return false;
  const m = vnMinuteOfDay(now);
  return start < end ? m >= start && m < end : m >= start || m < end;
}

export function nextNightBoundary(now: Date, schedule: NightSchedule): Date {
  const m = vnMinuteOfDay(now);
  const deltas = [parseHm(schedule.start), parseHm(schedule.end)].map(
    (target) => {
      const d = (target - m + DAY_MINUTES) % DAY_MINUTES;
      return d === 0 ? DAY_MINUTES : d;
    },
  );
  const minuteStart = Math.floor(now.getTime() / MINUTE);
  return new Date((minuteStart + Math.min(...deltas)) * MINUTE);
}

export function resolveActiveTheme(input: {
  pref: ThemePref;
  prefersDark: boolean;
  schedule: NightSchedule;
  override: NightOverride;
  now: Date;
}): ThemeName {
  const day: ThemeName =
    input.pref === "system"
      ? input.prefersDark
        ? "dark"
        : "light"
      : input.pref;
  const { override } = input;
  if (override && input.now.getTime() < Date.parse(override.until))
    return override.on ? "night" : day;
  return inNightWindow(input.now, input.schedule) ? "night" : day;
}

export function parseNightSchedule(raw: string | null): NightSchedule {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (
      value !== null &&
      typeof value === "object" &&
      typeof (value as NightSchedule).enabled === "boolean" &&
      typeof (value as NightSchedule).start === "string" &&
      typeof (value as NightSchedule).end === "string" &&
      HM.test((value as NightSchedule).start) &&
      HM.test((value as NightSchedule).end)
    ) {
      const { enabled, start, end } = value as NightSchedule;
      return { enabled, start, end };
    }
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_NIGHT_SCHEDULE;
}

export function parseNightOverride(raw: string | null): NightOverride {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (
      value !== null &&
      typeof value === "object" &&
      typeof (value as { on: unknown }).on === "boolean" &&
      typeof (value as { until: unknown }).until === "string" &&
      !Number.isNaN(Date.parse((value as { until: string }).until))
    ) {
      const { on, until } = value as { on: boolean; until: string };
      return { on, until };
    }
  } catch {
    // Fall through.
  }
  return null;
}

export function toggleNightOverride(
  current: ThemeName,
  schedule: NightSchedule,
  now: Date,
): { on: boolean; until: string } {
  const until = schedule.enabled
    ? nextNightBoundary(now, schedule)
    : new Date(
        Date.UTC(
          now.getUTCFullYear() + 100,
          now.getUTCMonth(),
          now.getUTCDate(),
        ),
      );
  return { on: current !== "night", until: until.toISOString() };
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/theme.test.ts`
Expected: PASS (toàn bộ 18 test).

- [ ] **Step 5: Commit**

```bash
git add lib/rules/theme.ts lib/rules/theme.test.ts
git commit -m "feat(theme): night schedule and override rules"
```

---

### Task 2: Nối theme vào app (init script, hook, Cài đặt, màu thanh trạng thái)

**Files:**

- Modify: `lib/theme.ts` (viết lại), `lib/theme.test.ts` (viết lại), `lib/hooks/useTheme.ts` (viết lại), `components/settings/SettingsScreen.tsx:53-68`, `app/layout.tsx:15-20`

**Interfaces:**

- Consumes: mọi export của `lib/rules/theme.ts` (Task 1); `ThemeName` từ `lib/ui/tokens.ts` (M2).
- Produces:
  - `lib/theme.ts`: `THEME_STORAGE_KEY = "be-yeu-theme"`, `NIGHT_SCHEDULE_KEY = "be-yeu-night-schedule"`, `NIGHT_OVERRIDE_KEY = "be-yeu-night-override"`, `THEME_COLORS: Record<ThemeName, string>`, `THEME_OPTIONS: { value: ThemePref; label: string }[]`, `parseThemePref(raw: string | null): ThemePref`, `resolveTheme(pref: ThemePref, prefersDark: boolean): "light" | "dark"`, `type ThemeState = { pref: ThemePref; schedule: NightSchedule; override: NightOverride; migrated: boolean }`, `readThemeState(get: (key: string) => string | null, now: Date): ThemeState`, `THEME_INIT_SCRIPT: string`; re-export `ThemePref`.
  - `lib/hooks/useTheme.ts`: `applyTheme(): ThemeName`, `useSystemThemeSync(): void`, `useThemePref(): [ThemePref, (next: ThemePref) => void]`, `useNightSchedule(): [NightSchedule, (next: NightSchedule) => void]`.

- [ ] **Step 1: Viết lại `lib/theme.test.ts` (test hỏng)**

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_NIGHT_SCHEDULE,
  resolveActiveTheme,
  type NightSchedule,
  type ThemePref,
} from "@/lib/rules/theme";
import {
  NIGHT_OVERRIDE_KEY,
  NIGHT_SCHEDULE_KEY,
  parseThemePref,
  readThemeState,
  resolveTheme,
  THEME_COLORS,
  THEME_INIT_SCRIPT,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
} from "./theme";

const vn = (hm: string, day = 14) =>
  new Date(
    Date.UTC(2026, 10, day, Number(hm.slice(0, 2)) - 7, Number(hm.slice(3))),
  );

function runInitScript(
  store: Record<string, string>,
  prefersDark: boolean,
  now: Date,
): string {
  const root = { dataset: {} as Record<string, string> };
  const fakeDate = { now: () => now.getTime(), parse: Date.parse };
  new Function("window", "document", "localStorage", "Date", THEME_INIT_SCRIPT)(
    { matchMedia: () => ({ matches: prefersDark }) },
    { documentElement: root },
    { getItem: (key: string) => store[key] ?? null },
    fakeDate,
  );
  return root.dataset.theme;
}

describe("theme storage", () => {
  it("parseThemePref keeps light and dark, everything else is system", () => {
    expect(parseThemePref("light")).toBe("light");
    expect(parseThemePref("dark")).toBe("dark");
    expect(parseThemePref("night")).toBe("system");
    expect(parseThemePref(null)).toBe("system");
    expect(parseThemePref("blue")).toBe("system");
  });

  it("resolveTheme follows the device only for system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("offers Sáng, Tối, Tự động", () => {
    expect(THEME_OPTIONS).toEqual([
      { value: "light", label: "Sáng" },
      { value: "dark", label: "Tối" },
      { value: "system", label: "Tự động" },
    ]);
  });

  it("status bar colours match each theme's page colour", () => {
    expect(THEME_COLORS).toEqual({
      light: "#FBF3F0",
      dark: "#0F0B12",
      night: "#0A0705",
    });
  });

  it("readThemeState migrates the old stored night choice to an override", () => {
    const store: Record<string, string> = { [THEME_STORAGE_KEY]: "night" };
    const state = readThemeState((k) => store[k] ?? null, vn("12:00"));
    expect(state).toEqual({
      pref: "system",
      schedule: DEFAULT_NIGHT_SCHEDULE,
      override: { on: true, until: vn("21:00").toISOString() },
      migrated: true,
    });
  });

  it("readThemeState reads the three keys", () => {
    const schedule: NightSchedule = {
      enabled: false,
      start: "22:00",
      end: "06:00",
    };
    const override = { on: false, until: vn("23:00").toISOString() };
    const store: Record<string, string> = {
      [THEME_STORAGE_KEY]: "dark",
      [NIGHT_SCHEDULE_KEY]: JSON.stringify(schedule),
      [NIGHT_OVERRIDE_KEY]: JSON.stringify(override),
    };
    expect(readThemeState((k) => store[k] ?? null, vn("12:00"))).toEqual({
      pref: "dark",
      schedule,
      override,
      migrated: false,
    });
  });
});

describe("THEME_INIT_SCRIPT matches resolveActiveTheme before React loads", () => {
  const cases: {
    name: string;
    store: Record<string, string>;
    dark: boolean;
    now: Date;
  }[] = [
    { name: "nothing stored, noon", store: {}, dark: false, now: vn("12:00") },
    { name: "nothing stored, 20:59", store: {}, dark: false, now: vn("20:59") },
    { name: "nothing stored, 21:00", store: {}, dark: false, now: vn("21:00") },
    {
      name: "nothing stored, 05:59",
      store: {},
      dark: true,
      now: vn("05:59", 15),
    },
    {
      name: "nothing stored, 06:00 dark device",
      store: {},
      dark: true,
      now: vn("06:00", 15),
    },
    {
      name: "dark chosen, noon",
      store: { [THEME_STORAGE_KEY]: "dark" },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "schedule off at night",
      store: {
        [THEME_STORAGE_KEY]: "light",
        [NIGHT_SCHEDULE_KEY]: JSON.stringify({
          enabled: false,
          start: "21:00",
          end: "06:00",
        }),
      },
      dark: false,
      now: vn("23:00"),
    },
    {
      name: "late schedule",
      store: {
        [NIGHT_SCHEDULE_KEY]: JSON.stringify({
          enabled: true,
          start: "22:30",
          end: "05:30",
        }),
      },
      dark: false,
      now: vn("22:00"),
    },
    {
      name: "override on at noon",
      store: {
        [NIGHT_OVERRIDE_KEY]: JSON.stringify({
          on: true,
          until: vn("21:00").toISOString(),
        }),
      },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "override off at night",
      store: {
        [NIGHT_OVERRIDE_KEY]: JSON.stringify({
          on: false,
          until: vn("06:00", 15).toISOString(),
        }),
      },
      dark: true,
      now: vn("23:00"),
    },
    {
      name: "expired override",
      store: {
        [NIGHT_OVERRIDE_KEY]: JSON.stringify({
          on: true,
          until: vn("11:00").toISOString(),
        }),
      },
      dark: false,
      now: vn("12:00"),
    },
  ];

  it.each(cases)("$name", ({ store, dark, now }) => {
    const state = readThemeState((k) => store[k] ?? null, now);
    const expected = resolveActiveTheme({ ...state, prefersDark: dark, now });
    expect(runInitScript(store, dark, now)).toBe(expected);
  });

  it("an old stored night choice paints night on the first frame", () => {
    expect(
      runInitScript({ [THEME_STORAGE_KEY]: "night" }, false, vn("12:00")),
    ).toBe("night");
  });

  it("falls back to light when storage throws", () => {
    const root = { dataset: {} as Record<string, string> };
    new Function(
      "window",
      "document",
      "localStorage",
      "Date",
      THEME_INIT_SCRIPT,
    )(
      { matchMedia: () => ({ matches: false }) },
      { documentElement: root },
      {
        getItem: () => {
          throw new Error("blocked");
        },
      },
      { now: () => vn("12:00").getTime(), parse: Date.parse },
    );
    expect(root.dataset.theme).toBe("light");
  });
});

// Type-level check that ThemePref is re-exported unchanged.
const _pref: ThemePref = "system";
void _pref;
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/theme.test.ts`
Expected: FAIL — `NIGHT_OVERRIDE_KEY`, `readThemeState`, `THEME_COLORS` không được export; `THEME_OPTIONS` còn 4 lựa chọn.

- [ ] **Step 3: Viết lại `lib/theme.ts`**

```ts
import {
  nextNightBoundary,
  parseNightOverride,
  parseNightSchedule,
  toggleNightOverride,
  type NightOverride,
  type NightSchedule,
  type ThemePref,
} from "@/lib/rules/theme";
import { THEMES, type ThemeName } from "@/lib/ui/tokens";

export type { ThemePref };
export type Theme = ThemeName;

export const THEME_STORAGE_KEY = "be-yeu-theme";
export const NIGHT_SCHEDULE_KEY = "be-yeu-night-schedule";
export const NIGHT_OVERRIDE_KEY = "be-yeu-night-override";

// The status bar takes each theme's page colour; colours live only in lib/ui/tokens.ts.
export const THEME_COLORS: Record<ThemeName, string> = {
  light: THEMES.light.bg,
  dark: THEMES.dark.bg,
  night: THEMES.night.bg,
};

export const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
  { value: "system", label: "Tự động" },
];

export function parseThemePref(raw: string | null): ThemePref {
  return raw === "light" || raw === "dark" ? raw : "system";
}

export function resolveTheme(
  pref: ThemePref,
  prefersDark: boolean,
): "light" | "dark" {
  if (pref !== "system") return pref;
  return prefersDark ? "dark" : "light";
}

export type ThemeState = {
  pref: ThemePref;
  schedule: NightSchedule;
  override: NightOverride;
  migrated: boolean;
};

export function readThemeState(
  get: (key: string) => string | null,
  now: Date,
): ThemeState {
  const raw = get(THEME_STORAGE_KEY);
  const schedule = parseNightSchedule(get(NIGHT_SCHEDULE_KEY));
  // Before Ban đêm had a schedule, "night" was a stored theme. Keep it on until the next boundary.
  if (raw === "night")
    return {
      pref: "system",
      schedule,
      override: toggleNightOverride("light", schedule, now),
      migrated: true,
    };
  return {
    pref: parseThemePref(raw),
    schedule,
    override: parseNightOverride(get(NIGHT_OVERRIDE_KEY)),
    migrated: false,
  };
}

// Keeps the boundary helper reachable for callers that only import lib/theme.
export { nextNightBoundary };

// Runs inline in <head> before the first paint, so it cannot import anything.
// Mirrors readThemeState + resolveActiveTheme; lib/theme.test.ts checks they agree.
export const THEME_INIT_SCRIPT = `(function(){var t="light";try{var ls=localStorage,p=ls.getItem("${THEME_STORAGE_KEY}"),dk=window.matchMedia("(prefers-color-scheme: dark)").matches,day=p==="light"||p==="dark"?p:(dk?"dark":"light"),s={enabled:true,start:"21:00",end:"06:00"},hm=/^([01][0-9]|2[0-3]):(00|30)$/;try{var rs=JSON.parse(ls.getItem("${NIGHT_SCHEDULE_KEY}")||"null");if(rs&&typeof rs.enabled==="boolean"&&typeof rs.start==="string"&&typeof rs.end==="string"&&hm.test(rs.start)&&hm.test(rs.end))s=rs;}catch(e){}var o=null;try{o=JSON.parse(ls.getItem("${NIGHT_OVERRIDE_KEY}")||"null");}catch(e){}var now=Date.now(),m=((Math.floor(now/60000)+420)%1440+1440)%1440;function mins(x){return parseInt(x.slice(0,2),10)*60+parseInt(x.slice(3,5),10);}var a=mins(s.start),b=mins(s.end),win=s.enabled&&a!==b&&(a<b?(m>=a&&m<b):(m>=a||m<b)),ou=o&&typeof o.on==="boolean"&&typeof o.until==="string"?Date.parse(o.until):NaN;if(p==="night")t="night";else if(!isNaN(ou)&&now<ou)t=o.on?"night":day;else t=win?"night":day;}catch(e){}document.documentElement.dataset.theme=t;})();`;
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/theme.test.ts`
Expected: PASS (6 test lưu trữ + 11 ca init script + 2 test riêng).

- [ ] **Step 5: Viết lại `lib/hooks/useTheme.ts`**

```ts
"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  DEFAULT_NIGHT_SCHEDULE,
  resolveActiveTheme,
  type NightSchedule,
} from "@/lib/rules/theme";
import {
  NIGHT_OVERRIDE_KEY,
  NIGHT_SCHEDULE_KEY,
  readThemeState,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type ThemePref,
} from "@/lib/theme";
import type { ThemeName } from "@/lib/ui/tokens";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode: the choice still applies until the app is closed.
  }
}

function storageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Private mode: nothing was stored.
  }
}

export function applyTheme(): ThemeName {
  const now = new Date();
  const state = readThemeState(storageGet, now);
  if (state.migrated) {
    storageSet(THEME_STORAGE_KEY, state.pref);
    storageSet(NIGHT_OVERRIDE_KEY, JSON.stringify(state.override));
  }
  const theme = resolveActiveTheme({
    pref: state.pref,
    prefersDark: window.matchMedia(DARK_QUERY).matches,
    schedule: state.schedule,
    override: state.override,
    now,
  });
  document.documentElement.dataset.theme = theme;
  for (const meta of document.querySelectorAll('meta[name="theme-color"]'))
    meta.setAttribute("content", THEME_COLORS[theme]);
  return theme;
}

export function useSystemThemeSync(): void {
  // Dev Strict Mode remounts <html> and clears the attribute the inline script set.
  useLayoutEffect(() => {
    applyTheme();
  }, []);
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      applyTheme();
    };
    media.addEventListener("change", onChange);
    window.addEventListener("storage", onChange);
    // The night schedule switches on its own while the app stays open.
    const timer = window.setInterval(onChange, 60_000);
    return () => {
      media.removeEventListener("change", onChange);
      window.removeEventListener("storage", onChange);
      window.clearInterval(timer);
    };
  }, []);
}

export function useThemePref(): [ThemePref, (next: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(() =>
    typeof window === "undefined"
      ? "system"
      : readThemeState(storageGet, new Date()).pref,
  );
  function choose(next: ThemePref) {
    storageSet(THEME_STORAGE_KEY, next);
    // A deliberate choice in Cài đặt ends any temporary night on/off.
    storageRemove(NIGHT_OVERRIDE_KEY);
    applyTheme();
    setPref(next);
  }
  return [pref, choose];
}

export function useNightSchedule(): [
  NightSchedule,
  (next: NightSchedule) => void,
] {
  const [schedule, setSchedule] = useState<NightSchedule>(() =>
    typeof window === "undefined"
      ? DEFAULT_NIGHT_SCHEDULE
      : readThemeState(storageGet, new Date()).schedule,
  );
  function save(next: NightSchedule) {
    storageSet(NIGHT_SCHEDULE_KEY, JSON.stringify(next));
    storageRemove(NIGHT_OVERRIDE_KEY);
    applyTheme();
    setSchedule(next);
  }
  return [schedule, save];
}
```

- [ ] **Step 6: Sửa phần Giao diện trong `components/settings/SettingsScreen.tsx`**

Thêm import (cạnh import `useThemePref` sẵn có):

```ts
import { useNightSchedule, useThemePref } from "@/lib/hooks/useTheme";
import { HALF_HOURS } from "@/lib/rules/theme";
```

và xóa dòng import `useThemePref` cũ. Ngay sau `const [theme, setTheme] = useThemePref();` thêm:

```ts
const [nightSchedule, setNightSchedule] = useNightSchedule();
```

Thay khối `<section>` "Giao diện" (dòng 53–68) bằng:

```tsx
<section className="flex flex-col gap-3">
  <h2 className="text-lg font-medium">Giao diện</h2>
  <div className="grid grid-cols-3 gap-2">
    {THEME_OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={theme === option.value}
        onClick={() => setTheme(option.value)}
        className={`min-h-11 rounded-xl px-3 ${theme === option.value ? "bg-accent text-on-accent" : "bg-soft"}`}
      >
        {option.label}
      </button>
    ))}
  </div>
  <label className="flex min-h-11 items-center justify-between gap-3">
    <span>
      Ban đêm theo lịch
      <span className="block text-sm text-muted">
        Tông hổ phách dịu mắt khi cho bé bú đêm
      </span>
    </span>
    <input
      type="checkbox"
      role="switch"
      className="size-6"
      checked={nightSchedule.enabled}
      onChange={(e) =>
        setNightSchedule({ ...nightSchedule, enabled: e.target.checked })
      }
    />
  </label>
  <div className="grid grid-cols-2 gap-2">
    <label className="flex flex-col gap-1 text-sm text-muted">
      Bắt đầu
      <select
        className="min-h-11 rounded-xl border bg-surface px-3 text-base text-ink"
        disabled={!nightSchedule.enabled}
        value={nightSchedule.start}
        onChange={(e) =>
          setNightSchedule({ ...nightSchedule, start: e.target.value })
        }
      >
        {HALF_HOURS.map((hm) => (
          <option key={hm} value={hm}>
            {hm}
          </option>
        ))}
      </select>
    </label>
    <label className="flex flex-col gap-1 text-sm text-muted">
      Kết thúc
      <select
        className="min-h-11 rounded-xl border bg-surface px-3 text-base text-ink"
        disabled={!nightSchedule.enabled}
        value={nightSchedule.end}
        onChange={(e) =>
          setNightSchedule({ ...nightSchedule, end: e.target.value })
        }
      >
        {HALF_HOURS.map((hm) => (
          <option key={hm} value={hm}>
            {hm}
          </option>
        ))}
      </select>
    </label>
  </div>
</section>
```

- [ ] **Step 7: Sửa `viewport.themeColor` trong `app/layout.tsx`**

Thay `themeColor: "#f28ca0",` bằng:

```ts
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF3F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0B12" },
  ],
```

- [ ] **Step 8: Chạy toàn bộ test và typecheck**

Run: `bun run test && bun run typecheck`
Expected: mọi test PASS (gồm `lib/themeGuard.test.ts`); typecheck không lỗi. Nếu typecheck báo chỗ khác còn dùng `ThemePref` có `"night"` hoặc `resolveTheme` trả `"night"`, sửa chỗ đó theo kiểu mới (chỉ `light | dark | system`).

- [ ] **Step 9: Kiểm trên trình duyệt**

Run: `bun run dev`, mở `http://localhost:3000/cai-dat` (375 px), đăng nhập.
Expected:

- Phần Giao diện có 3 nút Sáng / Tối / Tự động, công tắc "Ban đêm theo lịch" đang bật, giờ 21:00 và 06:00.
- Đặt "Bắt đầu" là mốc :00/:30 vừa qua và "Kết thúc" là mốc sau giờ hiện tại → trang chuyển tông hổ phách ngay; `document.querySelector('meta[name="theme-color"]').content` là `#0A0705` (kiểm bằng console).
- Tắt công tắc → trang về theo lựa chọn Sáng/Tối/Tự động.
- Đặt lại 21:00–06:00 trước khi tắt dev server.

- [ ] **Step 10: Thêm bước 21 vào `docs/device-checklist.md`**

Thêm cuối file:

```markdown
## Bước 21 — Ban đêm theo lịch (UI đợt 1)

1. Cài đặt → Giao diện: bật "Ban đêm theo lịch", chọn "Bắt đầu" là mốc :00 hoặc :30 sắp tới gần nhất và "Kết thúc" là mốc sau đó 1 tiếng, để app mở. Kỳ vọng: tới giờ bắt đầu, trong ≤ 1 phút app tự chuyển sang tông hổ phách, thanh trạng thái tối; tới giờ kết thúc tự về giao diện ban ngày.
2. Tắt "Ban đêm theo lịch". Kỳ vọng: giao diện theo lựa chọn Sáng / Tối / Tự động.
3. Đặt lại 21:00–06:00 và bật lại.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 11: Commit**

```bash
git add lib/theme.ts lib/theme.test.ts lib/hooks/useTheme.ts components/settings/SettingsScreen.tsx app/layout.tsx docs/device-checklist.md
git commit -m "feat(theme): scheduled night theme and per-theme status bar colour"
```

---

## Kết thúc M3

- [ ] Chạy lần cuối: `bun run test && bun run typecheck`. Expected: xanh.
- [ ] Bước 21 trong `docs/device-checklist.md` để "Chờ người dùng", không đánh "Đạt".
- [ ] Bước tiếp theo: viết plan `docs/blueprint/plans/2026-11-14-kim-bun-ui-dot1-m4.md` cho các component còn lại của Đợt 1, dùng Produces của M2 làm Consumes.
