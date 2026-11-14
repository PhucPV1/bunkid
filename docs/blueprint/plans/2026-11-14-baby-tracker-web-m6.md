# Baby Tracker Web — M6 (Trang Thống kê `/thong-ke`) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/thong-ke` có tab Ngủ / Bú / Tã, mỗi tab một biểu đồ cột 7 hoặc 14 ngày theo ngày lịch giờ Việt Nam, giấc ngủ vắt qua nửa đêm được chia phần cho từng ngày (spec §6.4), kèm bảng số liệu từng ngày.

**Architecture:** Tổng hợp theo ngày là hàm thuần `dailyStats` trong `lib/rules/dailyStats.ts` (Vitest), dùng lại cách gom cữ bú §7.1 của M4 (`groupFeedSessions`). Trang tải log từ 1 ngày trước ngày đầu khoảng xem (để giấc ngủ và cữ bú vắt qua nửa đêm được tính đúng), tính ở client, vẽ bằng `recharts` 3.x. Biểu đồ nạp bằng `next/dynamic` với `ssr: false` nên `recharts` chỉ tải khi mở `/thong-ke`. Query nằm dưới khóa `["logs", babyId, ...]` nên Realtime của M4 tự làm mới.

**Tech Stack:** như M1–M5 (Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, supabase-js 2.118.0, React Query 5.105.0, zod 4.6.7, Vitest 5.0.5), thêm `recharts` 3.10.1 và `react-is` 19.3.1.

**Milestones của đợt phát hành 1:** M1 nền tảng + đăng nhập (xong) · M2 quy tắc thuần + khai báo bé (xong) · M3 trang chủ ghi chép (xong) · M4 đánh giá, cảnh báo, Realtime (xong) · M5 `/nhat-ky` (xong) · **M6 `/thong-ke`** · M7 thanh tab, `/cai-dat`, theme, `/cai-app` · M8 service worker, offline outbox, Web Push, pg_cron, tạm tắt. M7–M8 lập plan sau khi M6 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- §6.4 "theo ngày lịch giờ VN": mỗi cột là một ngày từ 00:00 đến 24:00 giờ VN. Hôm nay tính đến hiện tại. Giấc ngủ đang chạy tính đến hiện tại.
- Tab **Ngủ**: cột là số giờ ngủ trong ngày, làm tròn 1 chữ số thập phân. Bảng ghi dạng "7 giờ 30 phút"; ngày không có giấc ngủ ghi "—".
- Tab **Bú**: cột là số cữ bú, gom cữ theo §7.1 (cách nhau dưới 30 phút là một cữ), cữ được tính cho ngày nó bắt đầu. Tổng ml bình không vẽ chung (khác thang đo), chỉ ghi trong bảng.
- Tab **Tã**: hai cột mỗi ngày, "Tã ướt" và "Tã bẩn". Một tã vừa ướt vừa bẩn được đếm ở cả hai.
- Nhãn trục ngang là số ngày trong tháng (ví dụ `9`, `14`). Bảng dưới biểu đồ ghi "Hôm nay", "Hôm qua" hoặc "Thứ Hai, 09/11", mới nhất ở trên.
- Không vẽ đường chuẩn theo tuổi trên biểu đồ (spec không yêu cầu). Đánh giá Xanh/Vàng/Đỏ vẫn chỉ ở trang chủ (§7.2).
- Màu biểu đồ cố định (hồng `#ec4899`, nâu `#a16207`). Theme Tối và Ban đêm thuộc M7.
- Thư viện thêm ngoài danh sách §2.2: `react-is` 19.3.1, vì đây là peer dependency bắt buộc của `recharts` 3.x; ghim đúng phiên bản React 19.3.1 của repo.
- Một lần tải 15 ngày log (14 ngày + 1 ngày trước). Supabase trả tối đa 1000 dòng mỗi lần gọi; với 30–60 bản ghi mỗi ngày thì còn dư. Nếu sau này vượt, ngày cũ nhất sẽ thiếu số liệu và cần chia nhỏ lần tải.
- Khi đang tải (kể cả lúc đổi 7/14 ngày) trang hiện "Đang tải…" thay cho biểu đồ và bảng, để không hiện số 0 như dữ liệu thật.
- Thanh tab dưới thuộc M7. Ở M6, `<nav>` trên trang chủ có thêm nút "Thống kê", trang `/thong-ke` có link "← Trang chủ".

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

Từ spec §2.2 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7; M6 thêm `recharts` 3.10.1 (phát hành 2026-07-25) và `react-is` 19.3.1 (phát hành 2026-10-14).
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component (`'use client'`), tự kiểm tra phiên ở client.
- `supabase-js` khởi tạo với `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.
- Toàn bộ logic nghiệp vụ là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Tuổi của bé tính bằng số ngày: `ageDays = (ngày hiện tại theo giờ VN) − dob`.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Tên route: `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`, `/`, `/nhat-ky`, `/thong-ke`.
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`).
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x. Thêm thư viện khác phải ghi lý do trong plan (M6: `react-is`, lý do ở "Diễn giải spec").
- Không dùng Workbox, Serwist, `next-pwa`: service worker viết tay ở `public/sw.js` (M8).
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.

Riêng M6:

- Trước khi viết code Next.js, đọc `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` (phần `next/dynamic` và `ssr: false`) (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/dailyStats.ts` và `components/stats/*` phải đúng từng ký tự như plan này.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`a7810a0`):

- `vnDayStartMs`, `addDays`, `vnDayLabel` (`lib/rules/days.ts`, M5)
- `groupFeedSessions(logs: LogLike[], now: Date): { start: number; end: number }[]` (`lib/rules/ratings.ts`, M4)
- `LogLike` (`lib/rules/describeLog.ts`); `detailsSchemas` (`lib/rules/logDetails.ts`); `vnDateString`, `formatDuration` (`lib/rules/time.ts`)
- `logsKey`, `fetchRecentLogs` (`lib/data/logs.ts`); `useLogsRealtime` (`lib/data/realtime.ts`, làm mới mọi khóa dưới `logsKey(babyId)`)
- `toVietnameseError` (`lib/data/errors.ts`); `useNow` (`lib/hooks/useNow.ts`); `AuthGate` với `need="baby"`; `Baby` (`lib/supabase/rows.ts`)
- `<nav>` có link "Nhật ký" trong `components/home/HomeScreen.tsx` (M5)

**Produces** (M7–M8 dùng):

- `lib/rules/days.ts`: thêm `vnDayRange(now: Date, count: number): string[]` (cũ nhất trước, kết thúc ở hôm nay giờ VN)
- `lib/rules/dailyStats.ts`: `DayStat`, `StatsTab`, `STATS_TABS`, `dailyStats`, `statsFetchSince`, `sleepHours`, `chartRows`
- `lib/data/logs.ts`: `fetchLogsSince(babyId: string, since: string): Promise<LogRow[]>` (log có `started_at >= since` hoặc đang chạy, mới nhất trước); `fetchRecentLogs` giữ chữ ký cũ và gọi `fetchLogsSince`; `useStatsLogs(babyId: string, since: string)` (key `["logs", babyId, "stats", since]`)
- `components/stats/StatsChart.tsx`, `components/stats/StatsScreen.tsx`; route `/thong-ke`
- `<nav>` trang chủ có hai link "Nhật ký" và "Thống kê" (M7 thay bằng thanh tab, mục Thống kê nằm trong Tiện ích §6.18)

## File Structure

```
lib/rules/days.ts (+ test)            # sửa: thêm vnDayRange
lib/rules/dailyStats.ts (+ test)      # tổng hợp theo ngày VN, chia giấc ngủ qua nửa đêm, dữ liệu cột
lib/data/logs.ts                      # sửa: fetchLogsSince, useStatsLogs
components/stats/StatsChart.tsx       # biểu đồ cột recharts
components/stats/StatsScreen.tsx      # tab, chọn 7/14 ngày, biểu đồ, bảng
app/thong-ke/page.tsx                 # route
components/home/HomeScreen.tsx        # sửa: nút "Thống kê"
package.json, bun.lock                # thêm recharts 3.10.1, react-is 19.3.1
```

## Tasks

1. Quy tắc thống kê theo ngày VN
2. Trang `/thong-ke` với biểu đồ và nút từ trang chủ

---

### Task 1: Quy tắc thống kê theo ngày VN

**Files:**

- Create: `lib/rules/dailyStats.ts`
- Modify: `lib/rules/days.ts` (thêm `vnDayRange` sau `addDays`)
- Test: `lib/rules/dailyStats.test.ts`, `lib/rules/days.test.ts` (thêm 1 test)

**Interfaces:**

- Consumes: `vnDayStartMs`, `addDays` (`lib/rules/days.ts`); `groupFeedSessions` (`lib/rules/ratings.ts`); `LogLike` (`lib/rules/describeLog.ts`); `detailsSchemas` (`lib/rules/logDetails.ts`); `vnDateString` (`lib/rules/time.ts`)
- Produces:
  - `vnDayRange(now: Date, count: number): string[]`
  - `type DayStat = { day: string; sleepMinutes: number; feeds: number; bottleMl: number; wetDiapers: number; dirtyDiapers: number }`
  - `type StatsTab = "sleep" | "feed" | "diaper"`
  - `STATS_TABS: { value: StatsTab; label: string }[]` — Ngủ, Bú, Tã
  - `dailyStats(logs: LogLike[], days: string[], now: Date): DayStat[]` — cùng thứ tự với `days`
  - `statsFetchSince(days: string[]): string` — ISO UTC, 00:00 giờ VN của ngày trước `days[0]`
  - `sleepHours(minutes: number): number` — làm tròn 1 chữ số thập phân
  - `chartRows(stats: DayStat[], tab: StatsTab): { label: string; primary: number; secondary: number | null }[]`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m6.md` (file plan này, đi chung commit của Task 1); commit mới nhất là `a7810a0 feat(history): /nhat-ky timeline with filters, manual entry, edit and delete`.

- [ ] **Step 2: Thêm test thất bại cho `vnDayRange`**

Trong `lib/rules/days.test.ts`, thay dòng import:

```ts
import { addDays, formatDayShort, vnDayLabel, vnDayStartMs } from "./days";
```

bằng:

```ts
import {
  addDays,
  formatDayShort,
  vnDayLabel,
  vnDayRange,
  vnDayStartMs,
} from "./days";
```

Rồi chèn test sau khối `it("addDays crosses month and year boundaries", ...)` (trước `it("formatDayShort gives dd/MM", ...)`):

```ts
  it("vnDayRange ends on today in VN time, oldest first", () => {
    const now = new Date("2026-11-13T18:30:00Z"); // 01:30 on 14/11 in VN
    expect(vnDayRange(now, 3)).toEqual([
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
  });
```

- [ ] **Step 3: Viết test thất bại cho `dailyStats.ts`**

Tạo `lib/rules/dailyStats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  chartRows,
  dailyStats,
  sleepHours,
  statsFetchSince,
} from "./dailyStats";

const days = ["2026-11-13", "2026-11-14"];
const now = new Date("2026-11-14T03:00:00Z"); // 10:00 on 14/11 in VN
const log = (
  type: string,
  started_at: string,
  ended_at: string | null,
  details: unknown = {},
) => ({ type, started_at, ended_at, details });

describe("dailyStats", () => {
  it("splits a sleep across VN midnight", () => {
    const stats = dailyStats(
      [log("sleep", "2026-11-13T15:00:00Z", "2026-11-13T23:00:00Z")], // 22:00 → 06:00
      days,
      now,
    );
    expect(stats.map((s) => s.sleepMinutes)).toEqual([120, 360]);
  });

  it("counts a running sleep up to now", () => {
    const stats = dailyStats(
      [log("sleep", "2026-11-14T01:00:00Z", null)], // 08:00, still asleep at 10:00
      days,
      now,
    );
    expect(stats[1].sleepMinutes).toBe(120);
  });

  it("counts a feed session on the day it starts", () => {
    const stats = dailyStats(
      [
        log("breast", "2026-11-13T16:40:00Z", "2026-11-13T16:55:00Z", {
          side: "left",
        }), // 23:40
        log("bottle", "2026-11-13T17:10:00Z", "2026-11-13T17:10:00Z", {
          ml: 60,
          milk: "formula",
        }), // 00:10, same session
        log("bottle", "2026-11-14T02:00:00Z", "2026-11-14T02:00:00Z", {
          ml: 90,
          milk: "formula",
        }),
      ],
      days,
      now,
    );
    expect(stats.map((s) => s.feeds)).toEqual([1, 1]);
    expect(stats.map((s) => s.bottleMl)).toEqual([0, 150]);
  });

  it("counts wet and dirty diapers and skips broken or out-of-range rows", () => {
    const stats = dailyStats(
      [
        log("diaper", "2026-11-14T01:00:00Z", "2026-11-14T01:00:00Z", {
          wet: true,
          dirty: true,
          stoolColor: "yellow",
        }),
        log("diaper", "2026-11-14T02:00:00Z", "2026-11-14T02:00:00Z", {
          wet: false,
          dirty: false,
        }),
        log("diaper", "2026-11-11T02:00:00Z", "2026-11-11T02:00:00Z", {
          wet: true,
          dirty: false,
        }),
      ],
      days,
      now,
    );
    expect(stats).toEqual([
      {
        day: "2026-11-13",
        sleepMinutes: 0,
        feeds: 0,
        bottleMl: 0,
        wetDiapers: 0,
        dirtyDiapers: 0,
      },
      {
        day: "2026-11-14",
        sleepMinutes: 0,
        feeds: 0,
        bottleMl: 0,
        wetDiapers: 1,
        dirtyDiapers: 1,
      },
    ]);
  });

  it("statsFetchSince starts one day before the first VN day", () => {
    expect(statsFetchSince(["2026-11-08", "2026-11-09"])).toBe(
      "2026-11-06T17:00:00.000Z",
    );
  });

  it("sleepHours rounds to one decimal and chartRows picks the tab's values", () => {
    expect(sleepHours(450)).toBe(7.5);
    expect(sleepHours(100)).toBe(1.7);
    const stat = {
      day: "2026-11-09",
      sleepMinutes: 840,
      feeds: 8,
      bottleMl: 120,
      wetDiapers: 6,
      dirtyDiapers: 2,
    };
    expect(chartRows([stat], "sleep")).toEqual([
      { label: "9", primary: 14, secondary: null },
    ]);
    expect(chartRows([stat], "feed")[0].primary).toBe(8);
    expect(chartRows([stat], "diaper")).toEqual([
      { label: "9", primary: 6, secondary: 2 },
    ]);
  });
});
```

- [ ] **Step 4: Chạy test để thấy thất bại**

Run: `bun run test lib/rules/days.test.ts lib/rules/dailyStats.test.ts`
Expected: FAIL — `days.test.ts` báo `TypeError: vnDayRange is not a function`, `dailyStats.test.ts` báo `Cannot find module './dailyStats'`.

- [ ] **Step 5: Thêm `vnDayRange` vào `lib/rules/days.ts`**

Chèn ngay sau hàm `addDays` (trước `export function formatDayShort`):

```ts
export function vnDayRange(now: Date, count: number): string[] {
  const today = vnDateString(now);
  return Array.from({ length: count }, (_, i) => addDays(today, i - count + 1));
}
```

`vnDateString` đã được import ở đầu file.

- [ ] **Step 6: Viết `lib/rules/dailyStats.ts`**

```ts
import { addDays, vnDayStartMs } from "./days";
import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import { groupFeedSessions } from "./ratings";
import { vnDateString } from "./time";

export type DayStat = {
  day: string;
  sleepMinutes: number;
  feeds: number;
  bottleMl: number;
  wetDiapers: number;
  dirtyDiapers: number;
};

export type StatsTab = "sleep" | "feed" | "diaper";

export const STATS_TABS: { value: StatsTab; label: string }[] = [
  { value: "sleep", label: "Ngủ" },
  { value: "feed", label: "Bú" },
  { value: "diaper", label: "Tã" },
];

function sleepMinutesBetween(
  logs: LogLike[],
  from: number,
  to: number,
  now: Date,
): number {
  let total = 0;
  for (const log of logs) {
    if (log.type !== "sleep") continue;
    const start = Math.max(Date.parse(log.started_at), from);
    const end = Math.min(
      log.ended_at ? Date.parse(log.ended_at) : now.getTime(),
      to,
    );
    if (end > start) total += end - start;
  }
  return Math.round(total / 60_000);
}

export function dailyStats(
  logs: LogLike[],
  days: string[],
  now: Date,
): DayStat[] {
  const result: DayStat[] = days.map((day) => ({
    day,
    sleepMinutes: sleepMinutesBetween(
      logs,
      vnDayStartMs(day),
      Math.min(vnDayStartMs(addDays(day, 1)), now.getTime()),
      now,
    ),
    feeds: 0,
    bottleMl: 0,
    wetDiapers: 0,
    dirtyDiapers: 0,
  }));
  const byDay = new Map(result.map((stat) => [stat.day, stat]));
  for (const session of groupFeedSessions(logs, now)) {
    const stat = byDay.get(vnDateString(new Date(session.start)));
    if (stat) stat.feeds += 1;
  }
  for (const log of logs) {
    const stat = byDay.get(vnDateString(new Date(log.started_at)));
    if (!stat) continue;
    if (log.type === "bottle") {
      const p = detailsSchemas.bottle.safeParse(log.details);
      if (p.success) stat.bottleMl += p.data.ml;
    }
    if (log.type === "diaper") {
      const p = detailsSchemas.diaper.safeParse(log.details);
      if (p.success && p.data.wet) stat.wetDiapers += 1;
      if (p.success && p.data.dirty) stat.dirtyDiapers += 1;
    }
  }
  return result;
}

export function statsFetchSince(days: string[]): string {
  return new Date(vnDayStartMs(days[0]) - 86_400_000).toISOString();
}

export function sleepHours(minutes: number): number {
  return Math.round(minutes / 6) / 10;
}

export function chartRows(
  stats: DayStat[],
  tab: StatsTab,
): { label: string; primary: number; secondary: number | null }[] {
  return stats.map((stat) => ({
    label: String(Number(stat.day.slice(8))),
    primary:
      tab === "sleep"
        ? sleepHours(stat.sleepMinutes)
        : tab === "feed"
          ? stat.feeds
          : stat.wetDiapers,
    secondary: tab === "diaper" ? stat.dirtyDiapers : null,
  }));
}
```

- [ ] **Step 7: Chạy test để thấy đạt**

Run: `bun run test lib/rules/days.test.ts lib/rules/dailyStats.test.ts && bun run typecheck`
Expected: PASS — days 5 test, dailyStats 6 test; không lỗi type.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(rules): daily stats by VN calendar day with midnight-split sleep"
```

`git add -A` lần này đưa cả file plan M6 vào commit.

---

### Task 2: Trang `/thong-ke` với biểu đồ và nút từ trang chủ

**Files:**

- Create: `components/stats/StatsChart.tsx`, `components/stats/StatsScreen.tsx`, `app/thong-ke/page.tsx`
- Modify: `package.json`, `bun.lock` (qua `bun add`), `lib/data/logs.ts` (`fetchRecentLogs`, thêm `useStatsLogs`), `components/home/HomeScreen.tsx` (`<nav>`)

**Interfaces:**

- Consumes: `vnDayRange`, `vnDayLabel` (`lib/rules/days.ts`); `chartRows`, `dailyStats`, `STATS_TABS`, `statsFetchSince`, `DayStat`, `StatsTab` (Task 1); `logsKey`, `useLogsRealtime`, `toVietnameseError`, `useNow`, `formatDuration`, `AuthGate`
- Produces:
  - `fetchLogsSince(babyId: string, since: string): Promise<LogRow[]>`
  - `useStatsLogs(babyId: string, since: string)` — `useQuery`, key `["logs", babyId, "stats", since]`
  - `StatsChart({ rows: { label: string; primary: number; secondary: number | null }[]; primaryName: string; secondaryName: string | null; decimals: boolean })`
  - `StatsScreen({ baby: Baby })`
  - Route `/thong-ke`

- [ ] **Step 1: Đọc tài liệu Next.js**

Đọc `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`, phần `next/dynamic` và tùy chọn `ssr: false` (chỉ dùng được trong client component; `StatsScreen` có `"use client"`).

- [ ] **Step 2: Cài thư viện**

Run: `bun add recharts@3.10.1 react-is@19.3.1 --exact`
Expected: `installed recharts@3.10.1`, `installed react-is@19.3.1`; trong `package.json`, mục `dependencies` có `"react-is": "19.3.1"` và `"recharts": "3.10.1"` (không có `^`).

- [ ] **Step 3: Thêm `fetchLogsSince` và `useStatsLogs` vào `lib/data/logs.ts`**

Thay nguyên hàm `fetchRecentLogs` hiện có:

```ts
export async function fetchRecentLogs(
  babyId: string,
  now: Date = new Date(),
  hours = 72,
): Promise<LogRow[]> {
  const since = new Date(now.getTime() - hours * 3_600_000).toISOString();
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .or(`started_at.gte.${since},ended_at.is.null`)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data;
}
```

bằng:

```ts
export async function fetchLogsSince(
  babyId: string,
  since: string,
): Promise<LogRow[]> {
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .or(`started_at.gte.${since},ended_at.is.null`)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRecentLogs(
  babyId: string,
  now: Date = new Date(),
  hours = 72,
): Promise<LogRow[]> {
  return fetchLogsSince(
    babyId,
    new Date(now.getTime() - hours * 3_600_000).toISOString(),
  );
}
```

Rồi chèn ngay trước `export async function updateLog`:

```ts
export function useStatsLogs(babyId: string, since: string) {
  return useQuery({
    queryKey: [...logsKey(babyId), "stats", since],
    queryFn: () => fetchLogsSince(babyId, since),
  });
}
```

`useQuery` đã được import ở đầu file.

Run: `bun run typecheck`
Expected: không lỗi type.

- [ ] **Step 4: Tạo `components/stats/StatsChart.tsx`**

```tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function StatsChart({
  rows,
  primaryName,
  secondaryName,
  decimals,
}: {
  rows: { label: string; primary: number; secondary: number | null }[];
  primaryName: string;
  secondaryName: string | null;
  decimals: boolean;
}) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
          <YAxis allowDecimals={decimals} width={32} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString("vi-VN")}
          />
          {secondaryName && <Legend />}
          <Bar
            dataKey="primary"
            name={primaryName}
            fill="#ec4899"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          {secondaryName && (
            <Bar
              dataKey="secondary"
              name={secondaryName}
              fill="#a16207"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: Tạo `components/stats/StatsScreen.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useStatsLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import {
  chartRows,
  dailyStats,
  STATS_TABS,
  statsFetchSince,
  type DayStat,
  type StatsTab,
} from "@/lib/rules/dailyStats";
import { vnDayLabel, vnDayRange } from "@/lib/rules/days";
import { formatDuration } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";

const StatsChart = dynamic(
  () => import("./StatsChart").then((m) => m.StatsChart),
  { ssr: false, loading: () => <div className="h-60" /> },
);

const SERIES: Record<StatsTab, { primary: string; secondary: string | null }> =
  {
    sleep: { primary: "Giờ ngủ", secondary: null },
    feed: { primary: "Số cữ bú", secondary: null },
    diaper: { primary: "Tã ướt", secondary: "Tã bẩn" },
  };

const COLUMNS: Record<
  StatsTab,
  { label: string; value: (s: DayStat) => string }[]
> = {
  sleep: [
    {
      label: "Giờ ngủ",
      value: (s) =>
        s.sleepMinutes === 0 ? "—" : formatDuration(s.sleepMinutes * 60_000),
    },
  ],
  feed: [
    { label: "Cữ bú", value: (s) => String(s.feeds) },
    { label: "Bình (ml)", value: (s) => String(s.bottleMl) },
  ],
  diaper: [
    { label: "Ướt", value: (s) => String(s.wetDiapers) },
    { label: "Bẩn", value: (s) => String(s.dirtyDiapers) },
  ],
};

export function StatsScreen({ baby }: { baby: Baby }) {
  const now = useNow(60_000);
  useLogsRealtime(baby.id);
  const [tab, setTab] = useState<StatsTab>("sleep");
  const [range, setRange] = useState<7 | 14>(7);
  const days = vnDayRange(now, range);
  const logs = useStatsLogs(baby.id, statsFetchSince(days));
  const stats = dailyStats(logs.data ?? [], days, now);
  const series = SERIES[tab];
  const pill = (active: boolean) =>
    `min-h-11 flex-1 rounded-full px-4 ${active ? "bg-pink-500 text-white" : "bg-neutral-100"}`;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-h-11 items-center text-pink-700">
          ← Trang chủ
        </Link>
        <h1 className="text-2xl font-semibold">Thống kê</h1>
        <span className="w-16" />
      </header>

      <nav className="flex gap-2">
        {STATS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={tab === t.value}
            onClick={() => setTab(t.value)}
            className={pill(tab === t.value)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="flex gap-2">
        {([7, 14] as const).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={range === n}
            onClick={() => setRange(n)}
            className={pill(range === n)}
          >
            {n} ngày
          </button>
        ))}
      </div>

      {logs.isError ? (
        <p role="alert" className="text-red-600">
          {toVietnameseError(logs.error)}
        </p>
      ) : logs.isPending ? (
        <p className="h-60 text-neutral-500">Đang tải…</p>
      ) : (
        <>
          <StatsChart
            rows={chartRows(stats, tab)}
            primaryName={series.primary}
            secondaryName={series.secondary}
            decimals={tab === "sleep"}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-neutral-500">
                <th className="py-2 font-normal">Ngày</th>
                {COLUMNS[tab].map((c) => (
                  <th key={c.label} className="py-2 text-right font-normal">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...stats].reverse().map((s) => (
                <tr key={s.day}>
                  <td className="py-2">{vnDayLabel(s.day, now)}</td>
                  {COLUMNS[tab].map((c) => (
                    <td key={c.label} className="py-2 text-right tabular-nums">
                      {c.value(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-neutral-500">
            Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.
          </p>
        </>
      )}
    </main>
  );
}
```

`statsFetchSince(days)` chỉ đổi khi sang ngày mới hoặc đổi 7/14 ngày, nên khóa query ổn định giữa các lần vẽ lại mỗi phút.

- [ ] **Step 6: Tạo `app/thong-ke/page.tsx`**

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { StatsScreen } from "@/components/stats/StatsScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) => (ctx?.baby ? <StatsScreen baby={ctx.baby} /> : null)}
    </AuthGate>
  );
}
```

- [ ] **Step 7: Thêm nút "Thống kê" ở trang chủ**

Trong `components/home/HomeScreen.tsx`, thay đoạn cuối của `<nav>`:

```text
          Nhật ký
        </Link>
      </nav>
```

bằng:

```text
          Nhật ký
        </Link>
        <Link
          href="/thong-ke"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border"
        >
          Thống kê
        </Link>
      </nav>
```

(Khối JSX, không có dấu `;`.)

- [ ] **Step 8: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  103 passed (103)` (96 của M1–M5, 7 của Task 1); `next build` thành công, danh sách route gồm `/`, `/_not-found`, `/auth/callback`, `/chua-duoc-moi`, `/dang-nhap`, `/khai-bao-be`, `/nhat-ky` và route mới `○ /thong-ke`.

- [ ] **Step 9: 👤 Kiểm tra tay trên localhost**

Run: `bun run dev`. Mở `http://localhost:3000/` trong Claude in Chrome (bắt đầu bằng `tabs_context_mcp`, mở tab mới bằng `tabs_create_mcp`). Nhờ người dùng tự đăng nhập Google nếu cần. Nếu Chrome không kết nối được, hỏi người dùng dùng trình duyệt nào trước khi đổi. Kiểm tra cùng người dùng:

1. Trang chủ có hai nút "Nhật ký" và "Thống kê". Bấm "Thống kê" → trang "Thống kê" có tab Ngủ / Bú / Tã (Ngủ đang chọn), nút "7 ngày" đang chọn, biểu đồ 7 cột có nhãn là số ngày trong tháng, cột cuối là hôm nay; bảng dưới có 7 dòng, dòng đầu "Hôm nay".
2. (Làm sau 05:30 sáng giờ VN, vì M5 chặn giờ ở tương lai.) Vào "Nhật ký" → "+ Thêm" → Ngủ, Bắt đầu = hôm qua 22:00, Kết thúc = hôm nay 05:30 → Lưu. Quay lại "Thống kê": ô "Giờ ngủ" của dòng "Hôm qua" tăng thêm 2 giờ, dòng "Hôm nay" tăng thêm 5 giờ 30 phút so với trước khi thêm (ghi lại hai số trước khi thêm).
3. Tab "Bú": bảng có cột "Cữ bú" và "Bình (ml)"; số cữ hôm nay khớp ô "Cữ bú" của thẻ "24 giờ qua" ở trang chủ khi mọi cữ trong 24 giờ đều rơi vào hôm nay (nếu không, chỉ cần thấy số hợp lý).
4. Tab "Tã": biểu đồ có hai cột mỗi ngày và chú thích "Tã ướt", "Tã bẩn"; bảng có cột "Ướt", "Bẩn".
5. Bấm "14 ngày" → biểu đồ 14 cột, bảng 14 dòng. Biểu đồ không tràn ngang trang ở chiều rộng 375 px (thu nhỏ cửa sổ hoặc dùng chế độ điện thoại).
6. Mở cửa sổ thứ hai cùng tài khoản ở trang chủ, ghi một tã ướt. Ở cửa sổ đang mở "Thống kê" tab Tã, cột "Tã ướt" hôm nay tăng 1 trong ≤ 3 giây.
7. Xóa hai bản ghi thử (giấc ngủ ở bước 2, tã ở bước 6) trong "Nhật ký" → số liệu "Thống kê" trở lại như trước.

- [ ] **Step 10: Commit và deploy**

```bash
git add -A && git commit -m "feat(stats): /thong-ke daily charts for sleep, feeds and diapers"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app. Nhờ người dùng mở PWA trên iPhone, bấm "Thống kê", xem đủ ba tab và chế độ 14 ngày (biểu đồ vừa màn hình, không cuộn ngang), rồi xác nhận đạt.

---

## Ngoài phạm vi M6

- M7: thanh tab dưới §6.18 (thay `<nav>` tạm ở trang chủ), `/cai-dat` (thành viên, hồ sơ bé, `feed_interval_min`, theme Sáng/Tối/Ban đêm/Theo hệ thống, đăng xuất), `/cai-app` §6.17.
- M8: service worker §8.4, offline outbox §9, push `feed` §8, pg_cron + Vault, tạm tắt thông báo, checklist thiết bị bước 1–4 và 7.
