# Baby Tracker Web — M2 (Quy tắc thuần, khai báo bé) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-13

**Goal:** Viết các hàm thuần về thời gian giờ VN, chi tiết bản ghi, đồng hồ và mô tả bản ghi, rồi làm trang khai báo bé cho owner.

**Architecture:** Mọi trang là client-rendered shell; client gọi thẳng Supabase bằng `supabase-js` (PKCE, phiên trong `localStorage`), RLS trong Postgres là ranh giới bảo mật duy nhất. Logic nghiệp vụ là hàm thuần trong `lib/rules/` có Vitest. Schema, RLS và RPC nằm trong `supabase/migrations/`, kiểm bằng pgTAP trên Supabase local.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.3, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, Vitest 5.0.5, Supabase CLI 2.122.0 (devDependency), Bun 1.4.x, pgTAP.

**Milestones của đợt phát hành 1:** M1 nền tảng + đăng nhập + spike iPhone · M2 quy tắc thuần + khai báo bé · M3 trang chủ ghi chép · M4 đánh giá, cảnh báo, nhật ký, thống kê, Realtime, cài đặt · M5 service worker, offline outbox, Web Push. Mỗi milestone một file plan, làm theo thứ tự; M4–M5 lập plan sau khi M3 xong.

**Lệch so với spec (người dùng đã duyệt 2026-11-13):** Spec §4.1/§5.2 chỉ cho member sửa bản ghi của chính mình, nên member không dừng được đồng hồ người khác bấm. M1 thêm RPC `stop_timer(p_log_id uuid, p_ended_at timestamptz)` (security definer): mọi thành viên được dừng một đồng hồ đang chạy, RPC chỉ ghi `ended_at`, không cho sửa gì khác.

## Global Constraints

Từ spec §2.1 (nguyên văn):

- Ngôn ngữ giao diện và nội dung: chỉ tiếng Việt (`vi-VN`).
- Múi giờ nghiệp vụ: `Asia/Ho_Chi_Minh` (ranh giới ngày, giờ gửi nhắc tiêm 08:00).
- Lưu thời gian trong DB: `timestamptz` (UTC). Ngày không có giờ: `date`.
- Đơn vị: gram (cân nặng), cm (chiều dài, vòng đầu), °C (nhiệt độ), ml (sữa).
- Mọi khóa chính là UUID v4. Bản ghi `logs` sinh UUID ở client để gửi lại offline không bị trùng.
- Chỉ dùng gói miễn phí: Vercel Hobby, Supabase Free. Không thêm dịch vụ trả phí.
- Bí mật không bao giờ xuống client: `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
- An toàn y tế: app **không** đặt tên bệnh, **không** tính liều thuốc. Mọi màn kết quả triệu chứng có nút gọi `115` và dòng "Thông tin tham khảo, không thay thế bác sĩ."
- Nội dung y tế (lịch tiêm, triệu chứng, mốc phát triển, chuẩn đánh giá) mỗi mục phải ghi `source` (URL) và `reviewedAt` (ngày).
- Đăng nhập chỉ bằng Google (Supabase Auth). Quyền truy cập dữ liệu do danh sách Gmail trong `family_members` quyết định.

Từ spec §2.2 (áp dụng cho M1–M3) và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component (`'use client'`), tự kiểm tra phiên ở client.
- `supabase-js` khởi tạo với `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.
- OAuth callback là trang client `/auth/callback`.
- Toàn bộ logic nghiệp vụ là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Tuổi của bé tính bằng số ngày: `ageDays = (ngày hiện tại theo giờ VN) − dob`.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Cột `created_by` có `default auth.uid()`; client không bao giờ gửi `created_by`.
- Tên route: `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`, `/`.
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`; Vitest 5 cần Node ^22.12). Dev-only `vite` 7.3.7 ghim chính xác vì là peer dependency bắt buộc của Vitest 5.
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x. Thêm thư viện khác phải ghi lý do trong plan.
- Không dùng Workbox, Serwist, `next-pwa`: service worker viết tay ở `public/sw.js` (M5).
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.

## Contracts with Other Plans

**Consumes** (từ `2026-11-13-baby-tracker-web-m1.md`, đã có trong repo):

- `supabase(): SupabaseClient<Database>` (`lib/supabase/client.ts`); `Baby` (`lib/supabase/rows.ts`)
- `<AuthGate need="family">` và `GateState.ctx: { family: Family; member: FamilyMember; baby: Baby | null } | null` (`components/AuthGate.tsx`)
- Query key `['family-context', userId]` (invalidate để `AuthGate` chuyển trang)
- Bảng `babies` và policy `babies_insert` (chỉ owner)
- Vitest đã cấu hình với alias `@/*`; lệnh `bun run test`, `bun run typecheck`, `bun run dev`

**Produces** (M3 dùng):

- `lib/rules/time.ts`: `VN_TZ`, `vnDateString`, `ageDays`, `formatAgeVi`, `formatVnTime`, `formatDuration`, `toVnLocalInput`, `fromVnLocalInput`
- `lib/rules/logDetails.ts`: `LOG_TYPES`, `LogType`, `TIMER_TYPES`, `isTimerType`, `detailsSchemas`, `LogDetails`, `StoolColor`
- `lib/rules/timer.ts`: `TimerButton`, `RunningLog`, `TimerAction`, `planTimerPress`
- `lib/rules/describeLog.ts`: `LogLike`, `describeLog`
- `lib/rules/babyInput.ts`: `BabyFormRaw`, `BabyInput`, `parseBabyForm`; `lib/data/baby.ts`: `createBaby`
- Route `/khai-bao-be` hoạt động

## File Structure

```
lib/rules/time.ts, logDetails.ts, timer.ts, describeLog.ts, babyInput.ts (+ *.test.ts)
lib/data/baby.ts
components/baby/BabyForm.tsx
app/khai-bao-be/page.tsx
```

## Tasks

1. Quy tắc thuần: thời gian, chi tiết bản ghi, đồng hồ, mô tả bản ghi
2. Khai báo bé

---

### Task 1: Quy tắc thuần — thời gian, chi tiết bản ghi, đồng hồ, mô tả bản ghi

**Files:**

- Create: `lib/rules/time.ts`, `lib/rules/logDetails.ts`, `lib/rules/timer.ts`, `lib/rules/describeLog.ts`
- Test: `lib/rules/time.test.ts`, `lib/rules/logDetails.test.ts`, `lib/rules/timer.test.ts`, `lib/rules/describeLog.test.ts`

**Interfaces:**

- Consumes: không có
- Produces:
  - `VN_TZ = 'Asia/Ho_Chi_Minh'`
  - `vnDateString(instant: Date): string` (`YYYY-MM-DD` theo giờ VN)
  - `ageDays(dob: string, now: Date): number`
  - `formatAgeVi(dob: string, now: Date): string`
  - `formatVnTime(instant: Date): string` (`HH:mm`)
  - `formatDuration(ms: number): string`
  - `toVnLocalInput(instant: Date): string` (`YYYY-MM-DDTHH:mm`), `fromVnLocalInput(value: string): Date`
  - `LOG_TYPES`, `type LogType`, `TIMER_TYPES`, `isTimerType(t: LogType): boolean`
  - `detailsSchemas: Record<LogType, z.ZodType>`, `type LogDetails` (map theo type), `type StoolColor`
  - `type TimerButton = { type: 'breast'; side: 'left' | 'right' } | { type: 'sleep' | 'pump' | 'tummy' }`
  - `type RunningLog = { id: string; type: LogType; details: Record<string, unknown> }`
  - `type TimerAction = { kind: 'stop'; id: string } | { kind: 'start'; type: LogType; details: Record<string, unknown> }`
  - `planTimerPress(running: RunningLog[], button: TimerButton): TimerAction[]`
  - `type LogLike = { type: string; started_at: string; ended_at: string | null; details: unknown }`
  - `describeLog(log: LogLike, now: Date): string`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/time.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  ageDays,
  formatAgeVi,
  formatDuration,
  formatVnTime,
  fromVnLocalInput,
  toVnLocalInput,
  vnDateString,
} from "@/lib/rules/time";

describe("vnDateString / ageDays", () => {
  it("uses the Vietnam calendar day", () => {
    expect(vnDateString(new Date("2026-11-12T16:59:59Z"))).toBe("2026-11-12");
    expect(vnDateString(new Date("2026-11-12T17:00:00Z"))).toBe("2026-11-13");
  });
  it("counts age in Vietnam days, switching at VN midnight", () => {
    expect(ageDays("2026-09-13", new Date("2026-11-12T16:59:59Z"))).toBe(60);
    expect(ageDays("2026-09-13", new Date("2026-11-12T17:00:00Z"))).toBe(61);
  });
});

describe("formatAgeVi", () => {
  const at = (vnDate: string) => new Date(`${vnDate}T05:00:00Z`);
  it("shows only days under one month", () => {
    expect(formatAgeVi("2026-09-13", at("2026-09-20"))).toBe("7 ngày");
  });
  it("shows whole months", () => {
    expect(formatAgeVi("2026-09-13", at("2026-11-13"))).toBe("2 tháng");
  });
  it("shows months and days", () => {
    expect(formatAgeVi("2026-09-13", at("2026-11-20"))).toBe("2 tháng 7 ngày");
  });
  it("clamps to the end of a shorter month", () => {
    expect(formatAgeVi("2026-01-31", at("2026-02-28"))).toBe("1 tháng");
  });
});

describe("formatVnTime / formatDuration", () => {
  it("formats a 24-hour Vietnam clock time", () => {
    expect(formatVnTime(new Date("2026-11-13T01:05:00Z"))).toBe("08:05");
  });
  it("formats durations", () => {
    expect(formatDuration(30_000)).toBe("dưới 1 phút");
    expect(formatDuration(12 * 60_000)).toBe("12 phút");
    expect(formatDuration(65 * 60_000)).toBe("1 giờ 05 phút");
  });
});

describe("local input conversion", () => {
  it("round-trips through the Vietnam wall clock", () => {
    const instant = new Date("2026-11-13T01:05:00Z");
    expect(toVnLocalInput(instant)).toBe("2026-11-13T08:05");
    expect(fromVnLocalInput("2026-11-13T08:05").toISOString()).toBe(
      "2026-11-13T01:05:00.000Z",
    );
  });
});
```

Tạo `lib/rules/logDetails.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { detailsSchemas, isTimerType } from "@/lib/rules/logDetails";

describe("detailsSchemas", () => {
  it("accepts valid details for every type", () => {
    expect(detailsSchemas.breast.safeParse({ side: "left" }).success).toBe(
      true,
    );
    expect(
      detailsSchemas.bottle.safeParse({ ml: 90, milk: "formula" }).success,
    ).toBe(true);
    expect(detailsSchemas.sleep.safeParse({}).success).toBe(true);
    expect(
      detailsSchemas.diaper.safeParse({
        wet: true,
        dirty: true,
        stoolColor: "pale",
      }).success,
    ).toBe(true);
    expect(
      detailsSchemas.medicine.safeParse({
        name: "Vitamin D",
        amount: 1,
        unit: "giọt",
        antipyretic: false,
      }).success,
    ).toBe(true);
    expect(
      detailsSchemas.temperature.safeParse({ celsius: 37.5, method: "nach" })
        .success,
    ).toBe(true);
    expect(detailsSchemas.pump.safeParse({ mlLeft: 60 }).success).toBe(true);
    expect(detailsSchemas.tummy.safeParse({}).success).toBe(true);
  });
  it("rejects out-of-range or unknown values", () => {
    expect(
      detailsSchemas.bottle.safeParse({ ml: 0, milk: "formula" }).success,
    ).toBe(false);
    expect(
      detailsSchemas.bottle.safeParse({ ml: 401, milk: "formula" }).success,
    ).toBe(false);
    expect(
      detailsSchemas.diaper.safeParse({ wet: false, dirty: false }).success,
    ).toBe(false);
    expect(
      detailsSchemas.temperature.safeParse({ celsius: 43.1, method: "nach" })
        .success,
    ).toBe(false);
    expect(
      detailsSchemas.breast.safeParse({ side: "left", extra: 1 }).success,
    ).toBe(false);
    expect(
      detailsSchemas.medicine.safeParse({
        name: "  ",
        amount: 1,
        unit: "ml",
        antipyretic: false,
      }).success,
    ).toBe(false);
  });
});

describe("isTimerType", () => {
  it("marks breast, sleep, pump and tummy as timers", () => {
    expect(
      ["breast", "sleep", "pump", "tummy"].every((t) =>
        isTimerType(t as never),
      ),
    ).toBe(true);
    expect(isTimerType("bottle")).toBe(false);
  });
});
```

Tạo `lib/rules/timer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { planTimerPress, type RunningLog } from "@/lib/rules/timer";

const breastLeft: RunningLog = {
  id: "b1",
  type: "breast",
  details: { side: "left" },
};
const sleeping: RunningLog = { id: "s1", type: "sleep", details: {} };

describe("planTimerPress", () => {
  it("starts a timer when none of that type runs", () => {
    expect(planTimerPress([], { type: "sleep" })).toEqual([
      { kind: "start", type: "sleep", details: {} },
    ]);
    expect(planTimerPress([], { type: "breast", side: "right" })).toEqual([
      { kind: "start", type: "breast", details: { side: "right" } },
    ]);
  });
  it("stops the running timer when the same button is pressed", () => {
    expect(planTimerPress([sleeping], { type: "sleep" })).toEqual([
      { kind: "stop", id: "s1" },
    ]);
    expect(
      planTimerPress([breastLeft], { type: "breast", side: "left" }),
    ).toEqual([{ kind: "stop", id: "b1" }]);
  });
  it("switches breast side by stopping then starting", () => {
    expect(
      planTimerPress([breastLeft], { type: "breast", side: "right" }),
    ).toEqual([
      { kind: "stop", id: "b1" },
      { kind: "start", type: "breast", details: { side: "right" } },
    ]);
  });
  it("keeps different timer types independent", () => {
    expect(planTimerPress([breastLeft], { type: "sleep" })).toEqual([
      { kind: "start", type: "sleep", details: {} },
    ]);
  });
});
```

Tạo `lib/rules/describeLog.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `bun run test lib/rules`
Expected: FAIL — `Failed to resolve import "@/lib/rules/time"` (và tương tự cho 3 file còn lại).

- [ ] **Step 3: Viết code**

Tạo `lib/rules/time.ts`:

```ts
export const VN_TZ = "Asia/Ho_Chi_Minh";
const VN_OFFSET = "+07:00"; // Vietnam has no daylight saving time.
const DAY_MS = 86_400_000;

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: VN_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function vnDateString(instant: Date): string {
  return dateFormat.format(instant);
}

function utcMidnight(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function ageDays(dob: string, now: Date): number {
  return Math.round(
    (utcMidnight(vnDateString(now)) - utcMidnight(dob)) / DAY_MS,
  );
}

function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return isoDate(Date.UTC(year, month, Math.min(d, lastDay)));
}

export function formatAgeVi(dob: string, now: Date): string {
  const today = vnDateString(now);
  const [y1, m1] = dob.split("-").map(Number);
  const [y2, m2] = today.split("-").map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (addMonths(dob, months) > today) months -= 1;
  const days = Math.round(
    (utcMidnight(today) - utcMidnight(addMonths(dob, months))) / DAY_MS,
  );
  if (months <= 0) return `${ageDays(dob, now)} ngày`;
  if (days === 0) return `${months} tháng`;
  return `${months} tháng ${days} ngày`;
}

export function formatVnTime(instant: Date): string {
  return timeFormat.format(instant);
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "dưới 1 phút";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  return `${hours} giờ ${String(minutes).padStart(2, "0")} phút`;
}

export function toVnLocalInput(instant: Date): string {
  return `${vnDateString(instant)}T${formatVnTime(instant)}`;
}

export function fromVnLocalInput(value: string): Date {
  return new Date(`${value}:00${VN_OFFSET}`);
}
```

Tạo `lib/rules/logDetails.ts`:

```ts
import { z } from "zod";

export const LOG_TYPES = [
  "breast",
  "bottle",
  "sleep",
  "diaper",
  "medicine",
  "temperature",
  "pump",
  "tummy",
] as const;
export type LogType = (typeof LOG_TYPES)[number];

export const TIMER_TYPES: readonly LogType[] = [
  "breast",
  "sleep",
  "pump",
  "tummy",
];
export function isTimerType(type: LogType): boolean {
  return TIMER_TYPES.includes(type);
}

const STOOL_COLORS = [
  "yellow",
  "green",
  "brown",
  "black",
  "pale",
  "red",
] as const;
export type StoolColor = (typeof STOOL_COLORS)[number];

const breast = z.object({ side: z.enum(["left", "right"]) }).strict();
const bottle = z
  .object({
    ml: z.number().int().min(1).max(400),
    milk: z.enum(["breast_milk", "formula"]),
  })
  .strict();
const empty = z.object({}).strict();
const diaper = z
  .object({
    wet: z.boolean(),
    dirty: z.boolean(),
    stoolColor: z.enum(STOOL_COLORS).optional(),
  })
  .strict()
  .refine((d) => d.wet || d.dirty, { message: "Chọn ít nhất ướt hoặc bẩn" });
const medicine = z
  .object({
    name: z.string().trim().min(1).max(80),
    amount: z.number().positive().max(1000),
    unit: z.enum(["ml", "mg", "giọt", "viên"]),
    antipyretic: z.boolean(),
  })
  .strict();
const temperature = z
  .object({
    celsius: z.number().min(34).max(43),
    method: z.enum(["nach", "tran", "tai", "hau_mon"]),
  })
  .strict();
const pump = z
  .object({
    mlLeft: z.number().int().min(0).max(500).optional(),
    mlRight: z.number().int().min(0).max(500).optional(),
  })
  .strict();

export const detailsSchemas = {
  breast,
  bottle,
  sleep: empty,
  diaper,
  medicine,
  temperature,
  pump,
  tummy: empty,
} satisfies Record<LogType, z.ZodType>;

export type LogDetails = {
  [K in LogType]: z.infer<(typeof detailsSchemas)[K]>;
};
```

Tạo `lib/rules/timer.ts`:

```ts
import type { LogType } from "./logDetails";

export type TimerButton =
  | { type: "breast"; side: "left" | "right" }
  | { type: "sleep" | "pump" | "tummy" };
export type RunningLog = {
  id: string;
  type: LogType;
  details: Record<string, unknown>;
};
export type TimerAction =
  | { kind: "stop"; id: string }
  | { kind: "start"; type: LogType; details: Record<string, unknown> };

function startAction(button: TimerButton): TimerAction {
  return {
    kind: "start",
    type: button.type,
    details: button.type === "breast" ? { side: button.side } : {},
  };
}

export function planTimerPress(
  running: RunningLog[],
  button: TimerButton,
): TimerAction[] {
  const current = running.find((log) => log.type === button.type);
  if (!current) return [startAction(button)];
  if (button.type === "breast" && current.details.side !== button.side) {
    return [{ kind: "stop", id: current.id }, startAction(button)];
  }
  return [{ kind: "stop", id: current.id }];
}
```

Tạo `lib/rules/describeLog.ts`:

```ts
import {
  detailsSchemas,
  LOG_TYPES,
  type LogDetails,
  type LogType,
} from "./logDetails";
import { formatDuration } from "./time";

export type LogLike = {
  type: string;
  started_at: string;
  ended_at: string | null;
  details: unknown;
};

const MILK = { breast_milk: "sữa mẹ", formula: "sữa công thức" } as const;
const STOOL = {
  yellow: "vàng",
  green: "xanh",
  brown: "nâu",
  black: "đen",
  pale: "bạc màu",
  red: "có máu",
} as const;
const METHOD = {
  nach: "nách",
  tran: "trán",
  tai: "tai",
  hau_mon: "hậu môn",
} as const;
const TIMER_LABEL = {
  sleep: "Ngủ",
  pump: "Hút sữa",
  tummy: "Tummy time",
} as const;

function duration(log: LogLike, now: Date): string {
  const end = log.ended_at ? Date.parse(log.ended_at) : now.getTime();
  const text = formatDuration(end - Date.parse(log.started_at));
  return log.ended_at ? text : `${text} (đang chạy)`;
}

function isLogType(type: string): type is LogType {
  return (LOG_TYPES as readonly string[]).includes(type);
}

export function describeLog(log: LogLike, now: Date): string {
  if (!isLogType(log.type)) return "Bản ghi không hợp lệ";
  const parsed = detailsSchemas[log.type].safeParse(log.details);
  if (!parsed.success) return "Bản ghi không hợp lệ";

  switch (log.type) {
    case "breast": {
      const d = parsed.data as LogDetails["breast"];
      return `Bú ${d.side === "left" ? "trái" : "phải"} · ${duration(log, now)}`;
    }
    case "sleep":
    case "tummy":
      return `${TIMER_LABEL[log.type]} · ${duration(log, now)}`;
    case "pump": {
      const d = parsed.data as LogDetails["pump"];
      const ml = (d.mlLeft ?? 0) + (d.mlRight ?? 0);
      return `${TIMER_LABEL.pump} · ${duration(log, now)}${ml > 0 ? ` · ${ml} ml` : ""}`;
    }
    case "bottle": {
      const d = parsed.data as LogDetails["bottle"];
      return `Bình ${d.ml} ml ${MILK[d.milk]}`;
    }
    case "diaper": {
      const d = parsed.data as LogDetails["diaper"];
      const kinds = [d.wet && "ướt", d.dirty && "bẩn"]
        .filter(Boolean)
        .join(" + ");
      return `Tã ${kinds}${d.stoolColor ? ` (phân ${STOOL[d.stoolColor]})` : ""}`;
    }
    case "medicine": {
      const d = parsed.data as LogDetails["medicine"];
      return `Thuốc ${d.name} ${d.amount} ${d.unit}${d.antipyretic ? " · hạ sốt" : ""}`;
    }
    case "temperature": {
      const d = parsed.data as LogDetails["temperature"];
      return `Nhiệt độ ${d.celsius.toFixed(1)}°C (${METHOD[d.method]})`;
    }
  }
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `bun run test lib/rules && bun run typecheck`
Expected: PASS — 4 file test đạt (time 9, logDetails 3, timer 4, describeLog 4); không lỗi type.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(rules): VN time helpers, log detail schemas, timer planning, log descriptions"
```

---

### Task 2: Khai báo bé

**Files:**

- Create: `lib/rules/babyInput.ts`, `lib/data/baby.ts`, `components/baby/BabyForm.tsx`, `app/khai-bao-be/page.tsx`
- Test: `lib/rules/babyInput.test.ts`

**Interfaces:**

- Consumes: `vnDateString`, `ageDays` (Task 1); `supabase()`, `AuthGate`, `FamilyContext` (M1 Task 4); `Baby` (M1 Task 3)
- Produces:
  - `type BabyFormRaw = { name: string; dob: string; sex: string; birthWeightG: string; birthLengthCm: string; birthHeadCm: string }`
  - `type BabyInput = { name: string; dob: string; sex: 'male' | 'female'; birth_weight_g: number | null; birth_length_cm: number | null; birth_head_cm: number | null }`
  - `parseBabyForm(raw: BabyFormRaw, now: Date): { ok: true; value: BabyInput } | { ok: false; errors: Partial<Record<keyof BabyFormRaw, string>> }`
  - `createBaby(familyId: string, input: BabyInput): Promise<Baby>`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/babyInput.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseBabyForm, type BabyFormRaw } from "@/lib/rules/babyInput";

const now = new Date("2026-11-13T05:00:00Z");
const valid: BabyFormRaw = {
  name: " Bông ",
  dob: "2026-09-13",
  sex: "female",
  birthWeightG: "3200",
  birthLengthCm: "49,5",
  birthHeadCm: "",
};

describe("parseBabyForm", () => {
  it("trims, converts numbers (comma decimals) and keeps empty optionals as null", () => {
    expect(parseBabyForm(valid, now)).toEqual({
      ok: true,
      value: {
        name: "Bông",
        dob: "2026-09-13",
        sex: "female",
        birth_weight_g: 3200,
        birth_length_cm: 49.5,
        birth_head_cm: null,
      },
    });
  });

  it("reports every invalid field with a Vietnamese message", () => {
    const result = parseBabyForm(
      {
        name: "",
        dob: "2026-11-14",
        sex: "",
        birthWeightG: "200",
        birthLengthCm: "abc",
        birthHeadCm: "60",
      },
      now,
    );
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Nhập tên bé (tối đa 60 ký tự)",
        dob: "Ngày sinh không được ở tương lai",
        sex: "Chọn giới tính",
        birthWeightG: "Cân nặng lúc sinh từ 300 đến 7000 g",
        birthLengthCm: "Chiều dài lúc sinh từ 20 đến 70 cm",
        birthHeadCm: "Vòng đầu lúc sinh từ 15 đến 50 cm",
      },
    });
  });

  it("rejects malformed dates and dates older than 1856 days", () => {
    expect(parseBabyForm({ ...valid, dob: "13/09/2026" }, now)).toMatchObject({
      ok: false,
      errors: { dob: "Ngày sinh không hợp lệ" },
    });
    expect(parseBabyForm({ ...valid, dob: "2021-10-01" }, now)).toMatchObject({
      ok: false,
      errors: { dob: "Ngày sinh quá xa (tối đa 5 tuổi)" },
    });
  });

  it("accepts a baby born today (VN)", () => {
    expect(parseBabyForm({ ...valid, dob: "2026-11-13" }, now).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `bun run test lib/rules/babyInput.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/rules/babyInput"`.

- [ ] **Step 3: Viết `lib/rules/babyInput.ts`**

```ts
import { ageDays } from "./time";

export type BabyFormRaw = {
  name: string;
  dob: string;
  sex: string;
  birthWeightG: string;
  birthLengthCm: string;
  birthHeadCm: string;
};

export type BabyInput = {
  name: string;
  dob: string;
  sex: "male" | "female";
  birth_weight_g: number | null;
  birth_length_cm: number | null;
  birth_head_cm: number | null;
};

export type BabyFormResult =
  | { ok: true; value: BabyInput }
  | { ok: false; errors: Partial<Record<keyof BabyFormRaw, string>> };

const MAX_AGE_DAYS = 1856;

function optionalNumber(
  raw: string,
  min: number,
  max: number,
  integer: boolean,
): number | null | "invalid" {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < min || value > max) return "invalid";
  if (integer && !Number.isInteger(value)) return "invalid";
  return integer ? value : Math.round(value * 10) / 10;
}

function isRealDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const ms = Date.parse(`${text}T00:00:00Z`);
  return (
    Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === text
  );
}

export function parseBabyForm(raw: BabyFormRaw, now: Date): BabyFormResult {
  const errors: Partial<Record<keyof BabyFormRaw, string>> = {};

  const name = raw.name.trim();
  if (name.length < 1 || name.length > 60)
    errors.name = "Nhập tên bé (tối đa 60 ký tự)";

  if (!isRealDate(raw.dob)) errors.dob = "Ngày sinh không hợp lệ";
  else if (ageDays(raw.dob, now) < 0)
    errors.dob = "Ngày sinh không được ở tương lai";
  else if (ageDays(raw.dob, now) > MAX_AGE_DAYS)
    errors.dob = "Ngày sinh quá xa (tối đa 5 tuổi)";

  if (raw.sex !== "male" && raw.sex !== "female") errors.sex = "Chọn giới tính";

  const weight = optionalNumber(raw.birthWeightG, 300, 7000, true);
  if (weight === "invalid")
    errors.birthWeightG = "Cân nặng lúc sinh từ 300 đến 7000 g";
  const length = optionalNumber(raw.birthLengthCm, 20, 70, false);
  if (length === "invalid")
    errors.birthLengthCm = "Chiều dài lúc sinh từ 20 đến 70 cm";
  const head = optionalNumber(raw.birthHeadCm, 15, 50, false);
  if (head === "invalid")
    errors.birthHeadCm = "Vòng đầu lúc sinh từ 15 đến 50 cm";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      dob: raw.dob,
      sex: raw.sex as "male" | "female",
      birth_weight_g: weight as number | null,
      birth_length_cm: length as number | null,
      birth_head_cm: head as number | null,
    },
  };
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `bun run test lib/rules/babyInput.test.ts`
Expected: PASS — 4 test đạt.

- [ ] **Step 5: Data layer, form và trang**

Tạo `lib/data/baby.ts`:

```ts
import type { BabyInput } from "@/lib/rules/babyInput";
import { supabase } from "@/lib/supabase/client";
import type { Baby } from "@/lib/supabase/rows";

export async function createBaby(
  familyId: string,
  input: BabyInput,
): Promise<Baby> {
  const { data, error } = await supabase()
    .from("babies")
    .insert({ family_id: familyId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

Tạo `components/baby/BabyForm.tsx`:

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { createBaby } from "@/lib/data/baby";
import { parseBabyForm, type BabyFormRaw } from "@/lib/rules/babyInput";
import { vnDateString } from "@/lib/rules/time";

const EMPTY: BabyFormRaw = {
  name: "",
  dob: "",
  sex: "",
  birthWeightG: "",
  birthLengthCm: "",
  birthHeadCm: "",
};

export function BabyForm({ familyId }: { familyId: string }) {
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState<BabyFormRaw>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BabyFormRaw, string>>
  >({});

  const save = useMutation({
    mutationFn: createBaby.bind(null, familyId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });

  function set<K extends keyof BabyFormRaw>(key: K, value: string) {
    setRaw((prev) => ({ ...prev, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = parseBabyForm(raw, new Date());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    save.mutate(result.value);
  }

  const field = "min-h-11 rounded-xl border px-3";
  const error = (key: keyof BabyFormRaw) =>
    errors[key] ? (
      <span className="text-sm text-red-600">{errors[key]}</span>
    ) : null;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Tên bé
        <input
          className={field}
          value={raw.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {error("name")}
      </label>
      <label className="flex flex-col gap-1">
        Ngày sinh
        <input
          type="date"
          className={field}
          max={vnDateString(new Date())}
          value={raw.dob}
          onChange={(e) => set("dob", e.target.value)}
        />
        {error("dob")}
      </label>
      <fieldset className="flex flex-col gap-1">
        <legend>Giới tính</legend>
        <div className="flex gap-3">
          {(["female", "male"] as const).map((sex) => (
            <label
              key={sex}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border"
            >
              <input
                type="radio"
                name="sex"
                value={sex}
                checked={raw.sex === sex}
                onChange={() => set("sex", sex)}
              />
              {sex === "female" ? "Bé gái" : "Bé trai"}
            </label>
          ))}
        </div>
        {error("sex")}
      </fieldset>
      <label className="flex flex-col gap-1">
        Cân nặng lúc sinh (g, không bắt buộc)
        <input
          inputMode="numeric"
          className={field}
          value={raw.birthWeightG}
          onChange={(e) => set("birthWeightG", e.target.value)}
        />
        {error("birthWeightG")}
      </label>
      <label className="flex flex-col gap-1">
        Chiều dài lúc sinh (cm, không bắt buộc)
        <input
          inputMode="decimal"
          className={field}
          value={raw.birthLengthCm}
          onChange={(e) => set("birthLengthCm", e.target.value)}
        />
        {error("birthLengthCm")}
      </label>
      <label className="flex flex-col gap-1">
        Vòng đầu lúc sinh (cm, không bắt buộc)
        <input
          inputMode="decimal"
          className={field}
          value={raw.birthHeadCm}
          onChange={(e) => set("birthHeadCm", e.target.value)}
        />
        {error("birthHeadCm")}
      </label>
      <button
        type="submit"
        disabled={save.isPending}
        className="min-h-12 rounded-2xl bg-pink-500 text-lg text-white disabled:opacity-50"
      >
        Lưu
      </button>
      {save.isError && (
        <p role="alert" className="text-red-600">
          Không lưu được. Thử lại sau.
        </p>
      )}
    </form>
  );
}
```

Tạo `app/khai-bao-be/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { BabyForm } from "@/components/baby/BabyForm";

export default function Page() {
  return (
    <AuthGate need="family">
      {({ ctx }) => (
        <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
          <h1 className="text-2xl font-semibold">Khai báo bé</h1>
          {ctx?.member.role === "owner" ? (
            <BabyForm familyId={ctx.family.id} />
          ) : (
            <p className="text-neutral-600">
              Chờ ba/mẹ của bé khai báo thông tin bé.
            </p>
          )}
        </main>
      )}
    </AuthGate>
  );
}
```

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; mọi test đạt.

- [ ] **Step 6: Kiểm tra tay**

Run: `bun run dev`, đăng nhập bằng tài khoản owner (đã tạo gia đình ở M1), mở `http://localhost:3000/khai-bao-be`.
Expected: bấm "Lưu" với form trống hiện lỗi dưới Tên bé, Ngày sinh, Giới tính. Điền hợp lệ rồi Lưu: chuyển sang `/` (vẫn là trang chữ "Bé Yêu" cho tới M3). Supabase dashboard → Table Editor → `babies` có 1 dòng.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(baby): onboarding form with validation"
```
