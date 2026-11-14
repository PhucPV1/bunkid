# Baby Tracker Web — M4 (Đánh giá, cảnh báo, Realtime trên trang chủ) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang chủ chấm Xanh/Vàng/Đỏ cho giấc ngủ, cữ bú, tã ướt trong 24 giờ, hiện banner cảnh báo y tế, dòng "Cữ bú tiếp theo / Bé đã thức", ô Vitamin D, cảnh báo liều hạ sốt khi nhập thuốc, đồng bộ Realtime giữa các máy, và báo rõ khi máy chủ Supabase đang ngủ.

**Architecture:** Mọi quy tắc mới là hàm thuần trong `lib/rules/` (Vitest), nhận mảng `LogLike` đã tải sẵn và `now`. Trang chủ tải log 72 giờ (đủ cho cửa sổ 6 giờ / 24 giờ / 72 giờ của spec §7.4) rồi tính tại client. Realtime dùng Postgres Changes của Supabase trên bảng `logs`, chỉ để invalidate query của React Query.

**Tech Stack:** như M1–M3 (Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, supabase-js 2.118.0, React Query 5.105.0, zod 4.6.7, Vitest 5.0.5, Supabase CLI 2.122.0). Không thêm thư viện.

**Milestones của đợt phát hành 1:** M1 nền tảng + đăng nhập (xong) · M2 quy tắc thuần + khai báo bé (xong) · M3 trang chủ ghi chép (xong) · **M4 đánh giá, cảnh báo, Realtime** · M5 `/nhat-ky` + `/thong-ke` · M6 thanh tab, `/cai-dat`, theme, `/cai-app` · M7 service worker, offline outbox, Web Push, pg_cron, tạm tắt. M5–M7 lập plan sau khi M4 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- §7.4 "ghi trong 6 giờ qua" cho nhiệt độ: chỉ xét **lần đo mới nhất** trong 6 giờ qua. Nếu đo lại bình thường sau một lần sốt thì banner sốt biến mất. Mỗi lần đo chỉ sinh một banner nhiệt độ, theo thứ tự ưu tiên: < 35.5 → ≥ 40.0 → (≥ 38.0 và `ageDays < 91`) → ≥ 38.0.
- §6.2 ô "Vitamin D hôm nay": bấm thì mở sheet nhập thuốc đã điền sẵn `Vitamin D`, `1`, `giọt`, không phải thuốc hạ sốt; người dùng sửa lượng nếu cần rồi bấm Lưu. Lý do: `amount` là trường bắt buộc (§5.1), app không tự đặt liều (Global Constraints).
- §7.4 cảnh báo thuốc hạ sốt: hiện ngay trong sheet khi tick "Thuốc hạ sốt", không chặn nút Lưu.
- Trang `/trieu-chung` chưa có (đợt 2), nên banner vàng về sốt dùng câu thay thế của spec, và banner đỏ chỉ có nút gọi `115`.
- Ràng buộc "mỗi mục nội dung y tế ghi `source` và `reviewedAt`" áp dụng cho file nội dung `content/*.vi.json` (spec §10.2 kiểm bằng zod), bắt đầu từ đợt 2. Ngưỡng trong `lib/rules/ratings.ts` và `lib/rules/alerts.ts` lấy nguyên văn từ spec §7.2 và §7.4; nguồn của chúng là spec, không thêm hằng `source` trong code.
- Dòng trạng thái §6.2 dùng thêm ba câu spec chưa ghi: "Đang bú" (đồng hồ bú đang chạy), "Đã đến giờ bú (từ HH:mm)" (đã quá giờ dự kiến), "Bé đang ngủ X" (đồng hồ ngủ đang chạy). Dữ liệu cũ hơn 12 giờ thì ẩn dòng, giống điều kiện 12 giờ của §8.3.

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

Từ spec §2.2 (áp dụng cho M1–M4) và phiên bản ghim:

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

Riêng M4:

- Trước khi viết code Next.js, đọc hướng dẫn liên quan trong `node_modules/next/dist/docs/` (yêu cầu của `AGENTS.md` do `next dev` sinh ra). Commit `AGENTS.md` cùng commit đầu tiên của M4.
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Ngưỡng và câu chữ trong `lib/rules/ratings.ts`, `lib/rules/alerts.ts`, `lib/rules/status.ts` phải đúng từng ký tự như plan này (có test khóa lại).

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`8ef4779`):

- `supabase()` (`lib/supabase/client.ts`); `LogRow`, `Baby`, `FamilyMember` (`lib/supabase/rows.ts`)
- `LogLike = { type: string; started_at: string; ended_at: string | null; details: unknown }` (`lib/rules/describeLog.ts`)
- `detailsSchemas` (`lib/rules/logDetails.ts`); `ageDays`, `formatAgeVi`, `formatVnTime`, `formatDuration`, `vnDateString`, `fromVnLocalInput`, `toVnLocalInput` (`lib/rules/time.ts`)
- `InstantType`, `QuickValues`, `defaultQuickValues`, `buildDetails`, `QUICK_FIELDS` (`lib/rules/quickEntry.ts`)
- `logsKey`, `fetchRecentLogs(babyId, now?)`, `useRecentLogs`, `toRunning`, `useTimerPress`, `useStopTimer`, `useAddInstant` (`lib/data/logs.ts`)
- `useMembers`, `useFamilyContext` (`lib/data/family.ts`); `useNow` (`lib/hooks/useNow.ts`); `toVietnameseError` (`lib/data/errors.ts`)
- `AuthGate` (`components/AuthGate.tsx`); `components/home/*` (`HomeScreen`, `ActionGrid`, `RunningCard`, `RecentList`, `QuickEntrySheet`)
- Bảng `logs`, cột `babies.feed_interval_min`; Supabase cloud đã link (`supabase/.temp/project-ref`)

**Produces** (M5–M7 dùng):

- `lib/rules/ratings.ts`: `Rating`, `MetricResult`, `DayRatings`, `WINDOW_MS`, `groupFeedSessions`, `countFeedsInWindow`, `sleepMinutesInWindow`, `wetDiapersInWindow`, `windowTotals`, `rateLast24h`
- `lib/rules/status.ts`: `homeStatusLines`
- `lib/rules/alerts.ts`: `HomeAlert`, `homeAlerts`, `medicineWarnings`, `vitaminDToday`
- `lib/rules/summaryText.ts`: `RATING_LABEL`, `metricText`
- `lib/data/loadError.ts`: `LoadErrorKind`, `classifyLoadError`, `LOAD_ERROR_TEXT`
- `lib/data/logs.ts`: `fetchRecentLogs(babyId, now?, hours = 72)` (mặc định đổi từ 24 sang 72 giờ), `fetchFirstLogAt`, `useFirstLogAt` (key `['first-log', babyId]`)
- `lib/data/realtime.ts`: `useLogsRealtime(babyId)`
- Bảng `logs` nằm trong publication `supabase_realtime` (migration `20261114000100_realtime.sql`)
- `QuickEntrySheet` nhận thêm prop tùy chọn `initial?: QuickValues`, `recentLogs?: LogRow[]`

## File Structure

```
lib/rules/ratings.ts (+ test)        # gom cữ bú, tổng 24 giờ, chấm điểm theo tuổi (§7.1–7.2)
lib/rules/status.ts (+ test)         # dòng "Cữ bú tiếp theo", "Bé đã thức" (§6.2)
lib/rules/alerts.ts (+ test)         # banner cảnh báo, cảnh báo thuốc hạ sốt, Vitamin D (§7.4, §6.2)
lib/rules/summaryText.ts (+ test)    # chữ hiển thị cho thẻ "24 giờ qua"
lib/data/loadError.ts (+ test)       # phân loại lỗi tải: offline / máy chủ ngủ / khác (§10.1)
lib/data/logs.ts                     # sửa: cửa sổ 72 giờ, log đầu tiên của bé
lib/data/realtime.ts                 # Realtime trên bảng logs (§5.3)
supabase/migrations/20261114000100_realtime.sql, supabase/tests/003_realtime.test.sql
components/AuthGate.tsx              # sửa: thông báo lỗi theo loại
components/home/AlertBanners.tsx, SummaryCard.tsx, StatusLines.tsx, VitaminDRow.tsx
components/home/QuickEntrySheet.tsx  # sửa: giá trị điền sẵn + cảnh báo hạ sốt
components/home/HomeScreen.tsx       # sửa: ráp các phần trên
```

## Tasks

1. Quy tắc đánh giá 24 giờ và dòng trạng thái
2. Quy tắc cảnh báo, thuốc hạ sốt, Vitamin D
3. Dữ liệu: cửa sổ 72 giờ, Realtime, lỗi máy chủ ngủ
4. Trang chủ: thẻ đánh giá, banner, trạng thái, Vitamin D, cảnh báo thuốc

---

### Task 1: Quy tắc đánh giá 24 giờ và dòng trạng thái

**Files:**

- Create: `lib/rules/ratings.ts`, `lib/rules/status.ts`
- Modify: `.gitignore` (thêm `.idea/`)
- Test: `lib/rules/ratings.test.ts`, `lib/rules/status.test.ts`

**Interfaces:**

- Consumes: `LogLike` (`lib/rules/describeLog.ts`), `detailsSchemas` (`lib/rules/logDetails.ts`), `formatVnTime`, `formatDuration` (`lib/rules/time.ts`)
- Produces:
  - `type Rating = "green" | "yellow" | "red"`
  - `type MetricResult = { status: "rated"; rating: Rating; value: number; explain: string } | { status: "not-rated"; value: number } | { status: "no-data" }`
  - `type DayRatings = { sleepMinutes: MetricResult; feeds: MetricResult; wetDiapers: MetricResult }`
  - `WINDOW_MS = 86_400_000`
  - `groupFeedSessions(logs: LogLike[], now: Date): { start: number; end: number }[]`
  - `countFeedsInWindow(logs: LogLike[], now: Date): number`
  - `sleepMinutesInWindow(logs: LogLike[], now: Date): number`
  - `wetDiapersInWindow(logs: LogLike[], now: Date): number`
  - `windowTotals(logs: LogLike[], now: Date): { bottleMl: number; dirtyDiapers: number }`
  - `rateLast24h(input: { logs: LogLike[]; ageDays: number; firstLogAt: string | null; now: Date }): DayRatings`
  - `homeStatusLines(input: { logs: LogLike[]; feedIntervalMin: number; now: Date }): string[]`

- [ ] **Step 1: Dọn cây git**

Thêm dòng `.idea/` vào cuối `.gitignore`.

Run: `git status --short`
Expected: có `?? AGENTS.md`, ` M .gitignore` và file plan này `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m4.md` (nếu chưa commit). Cả ba đi chung commit của Task 1.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/rules/ratings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LogLike } from "@/lib/rules/describeLog";
import {
  countFeedsInWindow,
  groupFeedSessions,
  rateLast24h,
  sleepMinutesInWindow,
  wetDiapersInWindow,
  windowTotals,
} from "@/lib/rules/ratings";

const NOW = new Date("2026-11-14T05:00:00Z");
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (
  type: string,
  start: number,
  end: number | null,
  details: unknown = {},
): LogLike => ({
  type,
  started_at: ago(start),
  ended_at: end === null ? null : ago(end),
  details,
});
const bottle = (h: number, ml = 90) =>
  log("bottle", h, h, { ml, milk: "formula" });
const wet = (h: number) => log("diaper", h, h, { wet: true, dirty: false });
const bottlesEvery3h = (n: number) =>
  Array.from({ length: n }, (_, i) => bottle(1 + 3 * i));
const wets = (n: number) => Array.from({ length: n }, (_, i) => wet(1 + 2 * i));
const OLD = ago(48);

describe("feed sessions", () => {
  it("merges feeds that start within 30 minutes after the previous one ends", () => {
    const logs = [
      log("breast", 3, 2.75, { side: "left" }),
      log("breast", 2.6, 2.4, { side: "right" }),
      bottle(1.5),
      bottle(25),
    ];
    expect(groupFeedSessions(logs, NOW)).toHaveLength(3);
    expect(countFeedsInWindow(logs, NOW)).toBe(2);
  });
});

describe("window totals", () => {
  it("clips sleep to the 24-hour window and counts a running sleep up to now", () => {
    expect(
      sleepMinutesInWindow(
        [log("sleep", 25, 23), log("sleep", 0.5, null)],
        NOW,
      ),
    ).toBe(90);
  });
  it("counts only valid wet diapers inside the window", () => {
    const logs = [
      wet(1),
      log("diaper", 2, 2, { wet: false, dirty: true }),
      wet(30),
      log("diaper", 3, 3, { bad: 1 }),
    ];
    expect(wetDiapersInWindow(logs, NOW)).toBe(1);
  });
  it("sums bottle ml and dirty diapers inside the window", () => {
    const logs = [
      bottle(1),
      bottle(2),
      log("diaper", 2, 2, { wet: true, dirty: true }),
      bottle(30, 50),
    ];
    expect(windowTotals(logs, NOW)).toEqual({ bottleMl: 180, dirtyDiapers: 1 });
  });
});

describe("rateLast24h", () => {
  it("reports no data until the first log is 24 hours old", () => {
    expect(
      rateLast24h({
        logs: [bottle(1)],
        ageDays: 60,
        firstLogAt: ago(10),
        now: NOW,
      }),
    ).toEqual({
      sleepMinutes: { status: "no-data" },
      feeds: { status: "no-data" },
      wetDiapers: { status: "no-data" },
    });
  });

  it("rates sleep against the age band", () => {
    const rate = (logs: LogLike[], age: number) =>
      rateLast24h({ logs, ageDays: age, firstLogAt: OLD, now: NOW })
        .sleepMinutes;
    expect(rate([log("sleep", 20, 5)], 60)).toEqual({
      status: "rated",
      rating: "green",
      value: 900,
      explain: "Bé ngủ đủ (chuẩn 14–17 giờ)",
    });
    expect(rate([log("sleep", 20, 10)], 60)).toEqual({
      status: "rated",
      rating: "yellow",
      value: 600,
      explain: "Bé ngủ ít hơn chuẩn (14–17 giờ)",
    });
    expect(rate([log("sleep", 23, 4)], 200)).toEqual({
      status: "rated",
      rating: "yellow",
      value: 1140,
      explain: "Bé ngủ nhiều hơn chuẩn (12–15 giờ)",
    });
    expect(rate([bottle(1)], 60)).toEqual({ status: "no-data" });
  });

  it("rates feeds by age and stops rating after 180 days", () => {
    const rate = (logs: LogLike[], age: number) =>
      rateLast24h({ logs, ageDays: age, firstLogAt: OLD, now: NOW }).feeds;
    expect(rate(bottlesEvery3h(6), 60)).toEqual({
      status: "rated",
      rating: "green",
      value: 6,
      explain: "Đủ cữ bú (chuẩn từ 6 cữ)",
    });
    expect(rate(bottlesEvery3h(5), 60)).toEqual({
      status: "rated",
      rating: "yellow",
      value: 5,
      explain: "Ít cữ bú hơn chuẩn (từ 6 cữ)",
    });
    expect(rate(bottlesEvery3h(6), 20)).toMatchObject({
      rating: "yellow",
      explain: "Ít cữ bú hơn chuẩn (từ 8 cữ)",
    });
    expect(rate(bottlesEvery3h(6), 200)).toEqual({
      status: "not-rated",
      value: 6,
    });
  });

  it("rates wet diapers from day 6, red below 4", () => {
    const rate = (logs: LogLike[], age: number) =>
      rateLast24h({ logs, ageDays: age, firstLogAt: OLD, now: NOW }).wetDiapers;
    expect(rate(wets(2), 3)).toEqual({ status: "not-rated", value: 2 });
    expect(rate(wets(6), 60)).toEqual({
      status: "rated",
      rating: "green",
      value: 6,
      explain: "Đủ tã ướt (chuẩn từ 6 tã)",
    });
    expect(rate(wets(4), 60)).toMatchObject({
      rating: "yellow",
      explain: "Hơi ít tã ướt (chuẩn từ 6 tã)",
    });
    expect(rate(wets(3), 60)).toMatchObject({
      rating: "red",
      explain: "Rất ít tã ướt: nguy cơ mất nước",
    });
    expect(
      rate([log("diaper", 1, 1, { wet: false, dirty: true })], 60),
    ).toMatchObject({ rating: "red", value: 0 });
  });
});
```

Tạo `lib/rules/status.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LogLike } from "@/lib/rules/describeLog";
import { homeStatusLines } from "@/lib/rules/status";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (
  type: string,
  start: number,
  end: number | null,
  details: unknown = {},
): LogLike => ({
  type,
  started_at: ago(start),
  ended_at: end === null ? null : ago(end),
  details,
});
const bottle = (h: number) => log("bottle", h, h, { ml: 90, milk: "formula" });
const lines = (logs: LogLike[]) =>
  homeStatusLines({ logs, feedIntervalMin: 180, now: NOW });

describe("homeStatusLines", () => {
  it("shows the next feed time from the last feed start", () => {
    expect(lines([bottle(1)])).toEqual(["Cữ bú tiếp theo khoảng 14:00"]);
  });
  it("says the feed is due once the interval has passed", () => {
    expect(lines([bottle(4)])).toEqual(["Đã đến giờ bú (từ 11:00)"]);
  });
  it("says the baby is feeding while a breast timer runs", () => {
    expect(lines([log("breast", 0.2, null, { side: "left" })])).toEqual([
      "Đang bú",
    ]);
  });
  it("hides lines based on data older than 12 hours", () => {
    expect(lines([bottle(13), log("sleep", 14, 13)])).toEqual([]);
  });
  it("shows how long the baby has been awake or asleep", () => {
    expect(lines([bottle(1), log("sleep", 2, 0.75)])).toEqual([
      "Cữ bú tiếp theo khoảng 14:00",
      "Bé đã thức 45 phút",
    ]);
    expect(lines([log("sleep", 1.5, null)])).toEqual([
      "Bé đang ngủ 1 giờ 30 phút",
    ]);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `bun run test lib/rules/ratings.test.ts lib/rules/status.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/rules/ratings"` và `"@/lib/rules/status"`.

- [ ] **Step 4: Viết code**

Tạo `lib/rules/ratings.ts`:

```ts
import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";

export type Rating = "green" | "yellow" | "red";
export type MetricResult =
  | { status: "rated"; rating: Rating; value: number; explain: string }
  | { status: "not-rated"; value: number }
  | { status: "no-data" };
export type DayRatings = {
  sleepMinutes: MetricResult;
  feeds: MetricResult;
  wetDiapers: MetricResult;
};

const HOUR_MS = 3_600_000;
export const WINDOW_MS = 24 * HOUR_MS;
const SAME_FEED_GAP_MS = 30 * 60_000;

const ms = (iso: string) => Date.parse(iso);
const endMs = (log: LogLike, now: Date) =>
  log.ended_at ? ms(log.ended_at) : now.getTime();
const isFeed = (log: LogLike) => log.type === "breast" || log.type === "bottle";

function startsInWindow(log: LogLike, now: Date): boolean {
  const start = ms(log.started_at);
  return start >= now.getTime() - WINDOW_MS && start <= now.getTime();
}

function overlapsWindow(log: LogLike, now: Date): boolean {
  return (
    endMs(log, now) >= now.getTime() - WINDOW_MS &&
    ms(log.started_at) <= now.getTime()
  );
}

export function groupFeedSessions(
  logs: LogLike[],
  now: Date,
): { start: number; end: number }[] {
  const feeds = logs
    .filter(isFeed)
    .sort((a, b) => ms(a.started_at) - ms(b.started_at));
  const sessions: { start: number; end: number }[] = [];
  for (const log of feeds) {
    const start = ms(log.started_at);
    const end = endMs(log, now);
    const last = sessions.at(-1);
    if (last && start <= last.end + SAME_FEED_GAP_MS)
      last.end = Math.max(last.end, end);
    else sessions.push({ start, end });
  }
  return sessions;
}

export function countFeedsInWindow(logs: LogLike[], now: Date): number {
  const from = now.getTime() - WINDOW_MS;
  return groupFeedSessions(logs, now).filter(
    (s) => s.start >= from && s.start <= now.getTime(),
  ).length;
}

export function sleepMinutesInWindow(logs: LogLike[], now: Date): number {
  const from = now.getTime() - WINDOW_MS;
  let total = 0;
  for (const log of logs) {
    if (log.type !== "sleep") continue;
    const start = Math.max(ms(log.started_at), from);
    const end = Math.min(endMs(log, now), now.getTime());
    if (end > start) total += end - start;
  }
  return Math.round(total / 60_000);
}

function diaperDetails(log: LogLike) {
  const parsed = detailsSchemas.diaper.safeParse(log.details);
  return parsed.success ? parsed.data : null;
}

export function wetDiapersInWindow(logs: LogLike[], now: Date): number {
  return logs.filter(
    (log) =>
      log.type === "diaper" &&
      startsInWindow(log, now) &&
      diaperDetails(log)?.wet === true,
  ).length;
}

export function windowTotals(
  logs: LogLike[],
  now: Date,
): { bottleMl: number; dirtyDiapers: number } {
  let bottleMl = 0;
  let dirtyDiapers = 0;
  for (const log of logs) {
    if (!startsInWindow(log, now)) continue;
    if (log.type === "bottle") {
      const parsed = detailsSchemas.bottle.safeParse(log.details);
      if (parsed.success) bottleMl += parsed.data.ml;
    }
    if (log.type === "diaper" && diaperDetails(log)?.dirty === true)
      dirtyDiapers += 1;
  }
  return { bottleMl, dirtyDiapers };
}

const SLEEP_BANDS = [
  { maxAge: 90, min: 14, max: 17 },
  { maxAge: 364, min: 12, max: 15 },
  { maxAge: 729, min: 11, max: 14 },
  { maxAge: Number.POSITIVE_INFINITY, min: 10, max: 13 },
];

function rateSleep(
  logs: LogLike[],
  ageDays: number,
  enoughHistory: boolean,
  now: Date,
): MetricResult {
  if (
    !enoughHistory ||
    !logs.some((l) => l.type === "sleep" && overlapsWindow(l, now))
  )
    return { status: "no-data" };
  const value = sleepMinutesInWindow(logs, now);
  const band =
    SLEEP_BANDS.find((b) => ageDays <= b.maxAge) ??
    SLEEP_BANDS[SLEEP_BANDS.length - 1];
  const range = `${band.min}–${band.max} giờ`;
  if (value < band.min * 60)
    return {
      status: "rated",
      rating: "yellow",
      value,
      explain: `Bé ngủ ít hơn chuẩn (${range})`,
    };
  if (value > band.max * 60)
    return {
      status: "rated",
      rating: "yellow",
      value,
      explain: `Bé ngủ nhiều hơn chuẩn (${range})`,
    };
  return {
    status: "rated",
    rating: "green",
    value,
    explain: `Bé ngủ đủ (chuẩn ${range})`,
  };
}

function rateFeeds(
  logs: LogLike[],
  ageDays: number,
  enoughHistory: boolean,
  now: Date,
): MetricResult {
  const value = countFeedsInWindow(logs, now);
  if (ageDays > 180) return { status: "not-rated", value };
  if (!enoughHistory || !logs.some((l) => isFeed(l) && overlapsWindow(l, now)))
    return { status: "no-data" };
  const min = ageDays <= 30 ? 8 : 6;
  if (value >= min)
    return {
      status: "rated",
      rating: "green",
      value,
      explain: `Đủ cữ bú (chuẩn từ ${min} cữ)`,
    };
  return {
    status: "rated",
    rating: "yellow",
    value,
    explain: `Ít cữ bú hơn chuẩn (từ ${min} cữ)`,
  };
}

function rateWet(
  logs: LogLike[],
  ageDays: number,
  enoughHistory: boolean,
  now: Date,
): MetricResult {
  const value = wetDiapersInWindow(logs, now);
  if (ageDays <= 5) return { status: "not-rated", value };
  if (
    !enoughHistory ||
    !logs.some((l) => l.type === "diaper" && startsInWindow(l, now))
  )
    return { status: "no-data" };
  if (value >= 6)
    return {
      status: "rated",
      rating: "green",
      value,
      explain: "Đủ tã ướt (chuẩn từ 6 tã)",
    };
  if (value >= 4)
    return {
      status: "rated",
      rating: "yellow",
      value,
      explain: "Hơi ít tã ướt (chuẩn từ 6 tã)",
    };
  return {
    status: "rated",
    rating: "red",
    value,
    explain: "Rất ít tã ướt: nguy cơ mất nước",
  };
}

export function rateLast24h(input: {
  logs: LogLike[];
  ageDays: number;
  firstLogAt: string | null;
  now: Date;
}): DayRatings {
  const { logs, ageDays, firstLogAt, now } = input;
  const enoughHistory =
    firstLogAt !== null && now.getTime() - ms(firstLogAt) >= WINDOW_MS;
  return {
    sleepMinutes: rateSleep(logs, ageDays, enoughHistory, now),
    feeds: rateFeeds(logs, ageDays, enoughHistory, now),
    wetDiapers: rateWet(logs, ageDays, enoughHistory, now),
  };
}
```

Tạo `lib/rules/status.ts`:

```ts
import type { LogLike } from "./describeLog";
import { formatDuration, formatVnTime } from "./time";

const STALE_MS = 12 * 3_600_000;
const ms = (iso: string) => Date.parse(iso);

function latestBy(
  logs: LogLike[],
  key: (log: LogLike) => number,
): LogLike | null {
  let best: LogLike | null = null;
  for (const log of logs) if (!best || key(log) > key(best)) best = log;
  return best;
}

function feedLine(
  logs: LogLike[],
  feedIntervalMin: number,
  now: Date,
): string | null {
  const feeds = logs.filter((l) => l.type === "breast" || l.type === "bottle");
  if (feeds.some((l) => l.type === "breast" && l.ended_at === null))
    return "Đang bú";
  const last = latestBy(feeds, (l) => ms(l.started_at));
  if (!last || now.getTime() - ms(last.started_at) > STALE_MS) return null;
  const due = new Date(ms(last.started_at) + feedIntervalMin * 60_000);
  return now.getTime() >= due.getTime()
    ? `Đã đến giờ bú (từ ${formatVnTime(due)})`
    : `Cữ bú tiếp theo khoảng ${formatVnTime(due)}`;
}

function sleepLine(logs: LogLike[], now: Date): string | null {
  const sleeps = logs.filter((l) => l.type === "sleep");
  const running = sleeps.find((l) => l.ended_at === null);
  if (running)
    return `Bé đang ngủ ${formatDuration(now.getTime() - ms(running.started_at))}`;
  const last = latestBy(sleeps, (l) => ms(l.ended_at as string));
  if (!last || now.getTime() - ms(last.ended_at as string) > STALE_MS)
    return null;
  return `Bé đã thức ${formatDuration(now.getTime() - ms(last.ended_at as string))}`;
}

export function homeStatusLines(input: {
  logs: LogLike[];
  feedIntervalMin: number;
  now: Date;
}): string[] {
  const { logs, feedIntervalMin, now } = input;
  return [feedLine(logs, feedIntervalMin, now), sleepLine(logs, now)].filter(
    (line): line is string => line !== null,
  );
}
```

- [ ] **Step 5: Chạy test, xác nhận đạt**

Run: `bun run test lib/rules/ratings.test.ts lib/rules/status.test.ts && bun run typecheck`
Expected: PASS — ratings 8 test, status 5 test; không lỗi type.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(rules): 24-hour ratings by age and home status lines"
```

`git add -A` lần này đưa cả `AGENTS.md` (do `next dev` sinh) vào commit.

---

### Task 2: Quy tắc cảnh báo, thuốc hạ sốt, Vitamin D

**Files:**

- Create: `lib/rules/alerts.ts`
- Test: `lib/rules/alerts.test.ts`

**Interfaces:**

- Consumes: `LogLike`, `detailsSchemas`, `formatVnTime`, `vnDateString` (M1–M3); `MetricResult` (Task 1)
- Produces:
  - `type HomeAlert = { key: string; level: "red" | "yellow"; message: string }`
  - `homeAlerts(input: { logs: LogLike[]; ageDays: number; wetDiapers: MetricResult; triageAvailable: boolean; now: Date }): HomeAlert[]` (đỏ trước, vàng sau)
  - `medicineWarnings(input: { logs: LogLike[]; at: Date }): string[]`
  - `vitaminDToday(logs: LogLike[], now: Date): string | null` (giờ `HH:mm` lần đầu trong ngày VN, hoặc `null`)

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/alerts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  homeAlerts,
  medicineWarnings,
  vitaminDToday,
} from "@/lib/rules/alerts";
import type { LogLike } from "@/lib/rules/describeLog";
import type { MetricResult } from "@/lib/rules/ratings";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (type: string, h: number, details: unknown): LogLike => ({
  type,
  started_at: ago(h),
  ended_at: ago(h),
  details,
});
const temp = (h: number, celsius: number) =>
  log("temperature", h, { celsius, method: "nach" });
const stool = (h: number, stoolColor: string) =>
  log("diaper", h, { wet: false, dirty: true, stoolColor });
const med = (h: number, antipyretic: boolean, name = "Paracetamol") =>
  log("medicine", h, { name, amount: 2.5, unit: "ml", antipyretic });
const NO_DATA: MetricResult = { status: "no-data" };
const alerts = (
  logs: LogLike[],
  ageDays = 60,
  wetDiapers: MetricResult = NO_DATA,
  triageAvailable = false,
) => homeAlerts({ logs, ageDays, wetDiapers, triageAvailable, now: NOW });

describe("homeAlerts — temperature", () => {
  it("flags fever under 3 months as red", () => {
    expect(alerts([temp(2, 38.2)])).toEqual([
      {
        key: "fever-infant",
        level: "red",
        message: "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay.",
      },
    ]);
  });
  it("flags fever from 3 months as yellow, with the release-1 wording until triage exists", () => {
    expect(alerts([temp(2, 38.5)], 100)).toEqual([
      {
        key: "fever",
        level: "yellow",
        message: "Bé đang sốt — theo dõi sát, hỏi bác sĩ nếu sốt kéo dài.",
      },
    ]);
    expect(alerts([temp(2, 38.5)], 100, NO_DATA, true)[0].message).toBe(
      "Bé đang sốt — xem Phân loại triệu chứng.",
    );
  });
  it("prefers very high fever and low temperature messages", () => {
    expect(alerts([temp(1, 40.1)])).toEqual([
      {
        key: "fever-high",
        level: "red",
        message: "Sốt rất cao: cần đi khám ngay.",
      },
    ]);
    expect(alerts([temp(1, 35.0)])).toEqual([
      {
        key: "hypothermia",
        level: "red",
        message: "Thân nhiệt thấp: cần đi khám ngay.",
      },
    ]);
  });
  it("uses only the latest reading within 6 hours", () => {
    expect(alerts([temp(7, 39)])).toEqual([]);
    expect(alerts([temp(3, 38.6), temp(1, 37.0)])).toEqual([]);
  });
});

describe("homeAlerts — diapers", () => {
  it("flags pale or bloody stool within 72 hours", () => {
    expect(alerts([stool(48, "pale")])).toEqual([
      {
        key: "stool-pale",
        level: "red",
        message: "Phân bạc màu: cần đi khám ngay.",
      },
    ]);
    expect(alerts([stool(10, "red")])).toEqual([
      {
        key: "stool-blood",
        level: "red",
        message: "Phân có máu: cần đi khám ngay.",
      },
    ]);
    expect(alerts([stool(80, "pale")])).toEqual([]);
  });
  it("flags a red wet-diaper rating", () => {
    const red: MetricResult = {
      status: "rated",
      rating: "red",
      value: 2,
      explain: "Rất ít tã ướt: nguy cơ mất nước",
    };
    expect(alerts([], 60, red)).toEqual([
      { key: "few-wet", level: "red", message: "Ít tã ướt: nguy cơ mất nước." },
    ]);
  });
  it("lists red alerts before yellow ones", () => {
    expect(
      alerts([temp(1, 38.5), stool(5, "pale")], 100).map((a) => a.key),
    ).toEqual(["stool-pale", "fever"]);
  });
});

describe("medicineWarnings", () => {
  it("warns when the previous antipyretic dose was less than 4 hours ago", () => {
    expect(medicineWarnings({ logs: [med(3, true)], at: NOW })).toEqual([
      "Chưa đủ 4 giờ từ liều hạ sốt trước (09:00).",
    ]);
    expect(medicineWarnings({ logs: [med(5, true)], at: NOW })).toEqual([]);
  });
  it("warns when 4 antipyretic doses were given in 24 hours", () => {
    const logs = [med(5, true), med(10, true), med(15, true), med(20, true)];
    expect(medicineWarnings({ logs, at: NOW })).toEqual([
      "Đã đủ 4 liều hạ sốt trong 24 giờ.",
    ]);
  });
  it("ignores medicine that is not an antipyretic", () => {
    expect(medicineWarnings({ logs: [med(1, false)], at: NOW })).toEqual([]);
  });
});

describe("vitaminDToday", () => {
  it("returns the time of today's vitamin D (VN day, case-insensitive)", () => {
    expect(vitaminDToday([med(4, false, " vitamin D ")], NOW)).toBe("08:00");
  });
  it("ignores yesterday's dose", () => {
    expect(vitaminDToday([med(18, false, "Vitamin D")], NOW)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `bun run test lib/rules/alerts.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/rules/alerts"`.

- [ ] **Step 3: Viết `lib/rules/alerts.ts`**

```ts
import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import type { MetricResult } from "./ratings";
import { formatVnTime, vnDateString } from "./time";

export type HomeAlert = {
  key: string;
  level: "red" | "yellow";
  message: string;
};

const HOUR_MS = 3_600_000;
const ms = (iso: string) => Date.parse(iso);
const within = (log: LogLike, now: Date, hours: number) => {
  const start = ms(log.started_at);
  return start <= now.getTime() && now.getTime() - start <= hours * HOUR_MS;
};

function temperatureAlert(
  logs: LogLike[],
  ageDays: number,
  triageAvailable: boolean,
  now: Date,
): HomeAlert | null {
  let latest: { at: number; celsius: number } | null = null;
  for (const log of logs) {
    if (log.type !== "temperature" || !within(log, now, 6)) continue;
    const parsed = detailsSchemas.temperature.safeParse(log.details);
    if (!parsed.success) continue;
    const at = ms(log.started_at);
    if (!latest || at > latest.at)
      latest = { at, celsius: parsed.data.celsius };
  }
  if (!latest) return null;
  const c = latest.celsius;
  if (c < 35.5)
    return {
      key: "hypothermia",
      level: "red",
      message: "Thân nhiệt thấp: cần đi khám ngay.",
    };
  if (c >= 40.0)
    return {
      key: "fever-high",
      level: "red",
      message: "Sốt rất cao: cần đi khám ngay.",
    };
  if (c >= 38.0 && ageDays < 91)
    return {
      key: "fever-infant",
      level: "red",
      message: "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay.",
    };
  if (c >= 38.0)
    return {
      key: "fever",
      level: "yellow",
      message: triageAvailable
        ? "Bé đang sốt — xem Phân loại triệu chứng."
        : "Bé đang sốt — theo dõi sát, hỏi bác sĩ nếu sốt kéo dài.",
    };
  return null;
}

function stoolAlerts(logs: LogLike[], now: Date): HomeAlert[] {
  const colors = new Set<string>();
  for (const log of logs) {
    if (log.type !== "diaper" || !within(log, now, 72)) continue;
    const parsed = detailsSchemas.diaper.safeParse(log.details);
    if (parsed.success && parsed.data.stoolColor)
      colors.add(parsed.data.stoolColor);
  }
  const result: HomeAlert[] = [];
  if (colors.has("pale"))
    result.push({
      key: "stool-pale",
      level: "red",
      message: "Phân bạc màu: cần đi khám ngay.",
    });
  if (colors.has("red"))
    result.push({
      key: "stool-blood",
      level: "red",
      message: "Phân có máu: cần đi khám ngay.",
    });
  return result;
}

export function homeAlerts(input: {
  logs: LogLike[];
  ageDays: number;
  wetDiapers: MetricResult;
  triageAvailable: boolean;
  now: Date;
}): HomeAlert[] {
  const { logs, ageDays, wetDiapers, triageAvailable, now } = input;
  const all: HomeAlert[] = [];
  const temperature = temperatureAlert(logs, ageDays, triageAvailable, now);
  if (temperature) all.push(temperature);
  all.push(...stoolAlerts(logs, now));
  if (wetDiapers.status === "rated" && wetDiapers.rating === "red")
    all.push({
      key: "few-wet",
      level: "red",
      message: "Ít tã ướt: nguy cơ mất nước.",
    });
  return [
    ...all.filter((a) => a.level === "red"),
    ...all.filter((a) => a.level === "yellow"),
  ];
}

function antipyreticTimes(logs: LogLike[], at: Date): number[] {
  return logs
    .filter((log) => log.type === "medicine")
    .filter((log) => {
      const parsed = detailsSchemas.medicine.safeParse(log.details);
      return parsed.success && parsed.data.antipyretic;
    })
    .map((log) => ms(log.started_at))
    .filter((t) => t <= at.getTime());
}

export function medicineWarnings(input: {
  logs: LogLike[];
  at: Date;
}): string[] {
  const { logs, at } = input;
  const times = antipyreticTimes(logs, at);
  const warnings: string[] = [];
  const latest = times.length > 0 ? Math.max(...times) : null;
  if (latest !== null && at.getTime() - latest < 4 * HOUR_MS)
    warnings.push(
      `Chưa đủ 4 giờ từ liều hạ sốt trước (${formatVnTime(new Date(latest))}).`,
    );
  if (times.filter((t) => at.getTime() - t < 24 * HOUR_MS).length >= 4)
    warnings.push("Đã đủ 4 liều hạ sốt trong 24 giờ.");
  return warnings;
}

export function vitaminDToday(logs: LogLike[], now: Date): string | null {
  const today = vnDateString(now);
  const times = logs
    .filter(
      (log) =>
        log.type === "medicine" &&
        vnDateString(new Date(log.started_at)) === today,
    )
    .filter((log) => {
      const parsed = detailsSchemas.medicine.safeParse(log.details);
      return parsed.success && parsed.data.name.toLowerCase() === "vitamin d";
    })
    .map((log) => ms(log.started_at));
  return times.length > 0 ? formatVnTime(new Date(Math.min(...times))) : null;
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `bun run test lib/rules/alerts.test.ts && bun run typecheck`
Expected: PASS — 12 test; không lỗi type.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(rules): home alerts, antipyretic warnings and vitamin D check"
```

---

### Task 3: Dữ liệu — cửa sổ 72 giờ, Realtime, lỗi máy chủ ngủ

**Files:**

- Create: `supabase/migrations/20261114000100_realtime.sql`, `lib/data/realtime.ts`, `lib/data/loadError.ts`
- Modify: `lib/data/logs.ts` (`fetchRecentLogs`, thêm `fetchFirstLogAt`, `useFirstLogAt`), `components/AuthGate.tsx` (màn lỗi)
- Test: `supabase/tests/003_realtime.test.sql`, `lib/data/loadError.test.ts`

**Interfaces:**

- Consumes: `supabase()`, `logsKey`, `LogRow` (M1–M3)
- Produces:
  - `fetchRecentLogs(babyId: string, now: Date = new Date(), hours = 72): Promise<LogRow[]>`
  - `fetchFirstLogAt(babyId: string): Promise<string | null>`, `useFirstLogAt(babyId: string)` (key `["first-log", babyId]`, `staleTime` 10 phút)
  - `useLogsRealtime(babyId: string): void`
  - `type LoadErrorKind = "offline" | "server-down" | "other"`, `classifyLoadError(e: unknown, online: boolean): LoadErrorKind`, `LOAD_ERROR_TEXT: Record<LoadErrorKind, string>`

- [ ] **Step 1: Viết test thất bại**

Tạo `supabase/tests/003_realtime.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
select ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'logs'
  ),
  'logs is published to supabase_realtime');
select * from finish();
rollback;
```

Tạo `lib/data/loadError.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyLoadError, LOAD_ERROR_TEXT } from "@/lib/data/loadError";

describe("classifyLoadError", () => {
  it("reports offline first", () => {
    expect(
      classifyLoadError({ message: "TypeError: Failed to fetch" }, false),
    ).toBe("offline");
  });
  it("treats fetch failures while online as the server being down", () => {
    expect(
      classifyLoadError(
        { message: "TypeError: Failed to fetch", code: "" },
        true,
      ),
    ).toBe("server-down");
    expect(classifyLoadError(new TypeError("Load failed"), true)).toBe(
      "server-down",
    );
  });
  it("leaves other errors generic", () => {
    expect(
      classifyLoadError({ message: "permission denied", code: "42501" }, true),
    ).toBe("other");
  });
  it("explains how to wake a paused Supabase project", () => {
    expect(LOAD_ERROR_TEXT["server-down"]).toBe(
      "Máy chủ đang ngủ hoặc không truy cập được. Nếu kéo dài, vào supabase.com, mở project và bấm Restore.",
    );
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `003_realtime.test.sql .. not ok 1 - logs is published to supabase_realtime`.

Run: `bun run test lib/data/loadError.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/data/loadError"`.

- [ ] **Step 3: Migration và phân loại lỗi**

Tạo `supabase/migrations/20261114000100_realtime.sql`:

```sql
alter publication supabase_realtime add table public.logs;
```

Tạo `lib/data/loadError.ts`:

```ts
export type LoadErrorKind = "offline" | "server-down" | "other";

export const LOAD_ERROR_TEXT: Record<LoadErrorKind, string> = {
  offline: "Bạn đang offline. Kết nối mạng rồi thử lại.",
  "server-down":
    "Máy chủ đang ngủ hoặc không truy cập được. Nếu kéo dài, vào supabase.com, mở project và bấm Restore.",
  other: "Không tải được dữ liệu gia đình.",
};

export function classifyLoadError(e: unknown, online: boolean): LoadErrorKind {
  if (!online) return "offline";
  const message =
    typeof e === "object" && e !== null && "message" in e
      ? String((e as { message: unknown }).message)
      : "";
  if (/failed to fetch|load failed|network/i.test(message))
    return "server-down";
  return "other";
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001_schema.test.sql .. ok`, `002_rls.test.sql .. ok`, `003_realtime.test.sql .. ok`, `All tests successful.`

Run: `bun run test lib/data/loadError.test.ts`
Expected: PASS — 4 test.

- [ ] **Step 5: Cửa sổ 72 giờ, log đầu tiên, Realtime**

Trong `lib/data/logs.ts`, thay hàm `fetchRecentLogs` bằng:

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

và thêm ngay sau `useRecentLogs`:

```ts
export async function fetchFirstLogAt(babyId: string): Promise<string | null> {
  const { data, error } = await supabase()
    .from("logs")
    .select("started_at")
    .eq("baby_id", babyId)
    .order("started_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return data[0]?.started_at ?? null;
}

export function useFirstLogAt(babyId: string) {
  return useQuery({
    queryKey: ["first-log", babyId],
    queryFn: () => fetchFirstLogAt(babyId),
    staleTime: 10 * 60_000,
  });
}
```

Tạo `lib/data/realtime.ts`:

```ts
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { LogRow } from "@/lib/supabase/rows";
import { logsKey } from "./logs";

export function useLogsRealtime(babyId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sb = supabase();
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: logsKey(babyId) });
      void queryClient.invalidateQueries({ queryKey: ["first-log", babyId] });
    };
    const filter = `baby_id=eq.${babyId}`;
    const channel = sb
      // Unique topic per mount: re-adding callbacks to an already-subscribed topic throws.
      .channel(`logs:${babyId}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "logs", filter },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "logs", filter },
        invalidate,
      )
      // DELETE events cannot be filtered by column; only react to rows we have on screen.
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "logs" },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          const cached = queryClient.getQueryData<LogRow[]>(logsKey(babyId));
          if (id && cached?.some((row) => row.id === id)) invalidate();
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [babyId, queryClient]);
}
```

Trong `components/AuthGate.tsx`:

- thêm `import { classifyLoadError, LOAD_ERROR_TEXT } from "@/lib/data/loadError";`
- thay dòng `<p className="mb-4">Không tải được dữ liệu gia đình.</p>` bằng:

```tsx
<p className="mb-4">
  {
    LOAD_ERROR_TEXT[
      classifyLoadError(
        family.error,
        typeof navigator === "undefined" ? true : navigator.onLine,
      )
    ]
  }
</p>
```

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; mọi test Vitest đạt (M1–M3 cũ + Task 1–3).

- [ ] **Step 6: 👤 Đẩy migration lên Supabase cloud**

Implementer nhờ người dùng chạy trong terminal của họ (lệnh có thể hỏi mật khẩu DB):

Run: `bunx supabase db push`
Expected: `Applying migration 20261114000100_realtime.sql...`, `Finished supabase db push.`

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(data): 72-hour log window, first-log query, realtime on logs, load error messages"
```

---

### Task 4: Trang chủ — thẻ đánh giá, banner, trạng thái, Vitamin D, cảnh báo thuốc

**Files:**

- Create: `lib/rules/summaryText.ts`, `components/home/AlertBanners.tsx`, `components/home/SummaryCard.tsx`, `components/home/StatusLines.tsx`, `components/home/VitaminDRow.tsx`
- Modify: `components/home/QuickEntrySheet.tsx`, `components/home/HomeScreen.tsx` (thay toàn bộ)
- Test: `lib/rules/summaryText.test.ts`

**Interfaces:**

- Consumes: `rateLast24h`, `windowTotals`, `WINDOW_MS`, `MetricResult`, `Rating`, `DayRatings` (Task 1); `homeStatusLines` (Task 1); `homeAlerts`, `HomeAlert`, `medicineWarnings`, `vitaminDToday` (Task 2); `useFirstLogAt`, `useLogsRealtime` (Task 3); `ageDays`, `formatAgeVi`, `formatDuration`, `fromVnLocalInput` (M2); các hook và component trang chủ của M3
- Produces:
  - `RATING_LABEL: Record<Rating, string>`
  - `metricText(kind: "sleep" | "feeds" | "wet", result: MetricResult): { label: string; value: string; note: string; rating: Rating | null }`
  - `QuickEntrySheet` props: `{ type: InstantType; babyId: string; onClose: () => void; initial?: QuickValues; recentLogs?: LogRow[] }`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/summaryText.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { metricText, RATING_LABEL } from "@/lib/rules/summaryText";

describe("metricText", () => {
  it("formats a rated sleep total", () => {
    expect(
      metricText("sleep", {
        status: "rated",
        rating: "green",
        value: 900,
        explain: "Bé ngủ đủ (chuẩn 14–17 giờ)",
      }),
    ).toEqual({
      label: "Giấc ngủ",
      value: "15 giờ 00 phút",
      note: "Bé ngủ đủ (chuẩn 14–17 giờ)",
      rating: "green",
    });
  });
  it("shows the count without a rating when the age band is not rated", () => {
    expect(metricText("feeds", { status: "not-rated", value: 7 })).toEqual({
      label: "Cữ bú",
      value: "7 cữ",
      note: "Không đánh giá ở tuổi này",
      rating: null,
    });
  });
  it("shows a dash when there is not enough data", () => {
    expect(metricText("wet", { status: "no-data" })).toEqual({
      label: "Tã ướt",
      value: "—",
      note: "Chưa đủ dữ liệu",
      rating: null,
    });
  });
  it("labels each rating", () => {
    expect(RATING_LABEL).toEqual({
      green: "Tốt",
      yellow: "Lưu ý",
      red: "Nguy cơ",
    });
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `bun run test lib/rules/summaryText.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/rules/summaryText"`.

- [ ] **Step 3: Viết `lib/rules/summaryText.ts`**

```ts
import type { MetricResult, Rating } from "./ratings";
import { formatDuration } from "./time";

export const RATING_LABEL: Record<Rating, string> = {
  green: "Tốt",
  yellow: "Lưu ý",
  red: "Nguy cơ",
};

const LABEL = { sleep: "Giấc ngủ", feeds: "Cữ bú", wet: "Tã ướt" } as const;

function valueText(kind: "sleep" | "feeds" | "wet", value: number): string {
  if (kind === "sleep") return formatDuration(value * 60_000);
  return kind === "feeds" ? `${value} cữ` : `${value} tã`;
}

export function metricText(
  kind: "sleep" | "feeds" | "wet",
  result: MetricResult,
): { label: string; value: string; note: string; rating: Rating | null } {
  const label = LABEL[kind];
  if (result.status === "no-data")
    return { label, value: "—", note: "Chưa đủ dữ liệu", rating: null };
  if (result.status === "not-rated")
    return {
      label,
      value: valueText(kind, result.value),
      note: "Không đánh giá ở tuổi này",
      rating: null,
    };
  return {
    label,
    value: valueText(kind, result.value),
    note: result.explain,
    rating: result.rating,
  };
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `bun run test lib/rules/summaryText.test.ts`
Expected: PASS — 4 test.

- [ ] **Step 5: Các component mới**

Tạo `components/home/AlertBanners.tsx`:

```tsx
import type { HomeAlert } from "@/lib/rules/alerts";

export function AlertBanners({ alerts }: { alerts: HomeAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <div
          key={alert.key}
          role="alert"
          className={`rounded-2xl p-4 ${alert.level === "red" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-950"}`}
        >
          <p className="font-semibold">{alert.message}</p>
          {alert.level === "red" && (
            <a
              href="tel:115"
              className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-white px-4 font-semibold text-red-700"
            >
              Gọi 115
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
```

Tạo `components/home/SummaryCard.tsx`:

```tsx
import type { DayRatings, Rating } from "@/lib/rules/ratings";
import { metricText, RATING_LABEL } from "@/lib/rules/summaryText";

const TONE: Record<Rating, string> = {
  green: "bg-emerald-100 text-emerald-900",
  yellow: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-900",
};

export function SummaryCard({
  ratings,
  totals,
}: {
  ratings: DayRatings;
  totals: { bottleMl: number; dirtyDiapers: number };
}) {
  const items = [
    metricText("sleep", ratings.sleepMinutes),
    metricText("feeds", ratings.feeds),
    metricText("wet", ratings.wetDiapers),
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl p-3 ${item.rating ? TONE[item.rating] : "bg-neutral-100"}`}
          >
            <p className="text-sm">{item.label}</p>
            <p className="text-lg font-semibold">{item.value}</p>
            {item.rating && (
              <p className="text-xs font-medium">{RATING_LABEL[item.rating]}</p>
            )}
            <p className="text-xs">{item.note}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-neutral-600">
        Bình: {totals.bottleMl} ml · Tã bẩn: {totals.dirtyDiapers}
      </p>
    </div>
  );
}
```

Tạo `components/home/StatusLines.tsx`:

```tsx
export function StatusLines({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-neutral-700">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
```

Tạo `components/home/VitaminDRow.tsx`:

```tsx
export function VitaminDRow({
  doneAt,
  onRecord,
}: {
  doneAt: string | null;
  onRecord: () => void;
}) {
  if (doneAt)
    return (
      <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-900">
        ✓ Đã uống Vitamin D hôm nay lúc {doneAt}
      </p>
    );
  return (
    <button
      type="button"
      onClick={onRecord}
      className="min-h-11 rounded-2xl border border-dashed text-neutral-700"
    >
      Ghi Vitamin D hôm nay
    </button>
  );
}
```

- [ ] **Step 6: Sửa `QuickEntrySheet` — giá trị điền sẵn và cảnh báo thuốc hạ sốt**

Trong `components/home/QuickEntrySheet.tsx`:

1. Thêm import:

```tsx
import { medicineWarnings } from "@/lib/rules/alerts";
import type { LogRow } from "@/lib/supabase/rows";
```

2. Đổi chữ ký component thành:

```tsx
export function QuickEntrySheet({
  type,
  babyId,
  onClose,
  initial,
  recentLogs = [],
}: {
  type: InstantType;
  babyId: string;
  onClose: () => void;
  initial?: QuickValues;
  recentLogs?: LogRow[];
}) {
```

3. Đổi khởi tạo state `values` thành:

```tsx
const [values, setValues] = useState<QuickValues>(() => ({
  ...defaultQuickValues(type),
  ...initial,
}));
```

4. Ngay sau dòng `const [message, setMessage] = useState<string | null>(null);` thêm:

```tsx
const warnings =
  type === "medicine" && values.antipyretic === true
    ? medicineWarnings({ logs: recentLogs, at: fromVnLocalInput(at) })
    : [];
```

5. Ngay trước khối `{message && (`, thêm:

Dán nguyên văn khối dưới đây (nó là một biểu thức JSX nằm trong `{ }`, **không có** dấu `;` ở cuối):

```text
        {warnings.map((warning) => (
          <p key={warning} role="status" className="rounded-xl bg-amber-50 p-3 text-amber-900">
            {warning}
          </p>
        ))}
```

- [ ] **Step 7: Thay toàn bộ `components/home/HomeScreen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import {
  toRunning,
  useFirstLogAt,
  useRecentLogs,
  useStopTimer,
  useTimerPress,
} from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
import { homeStatusLines } from "@/lib/rules/status";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { ActionGrid } from "./ActionGrid";
import { AlertBanners } from "./AlertBanners";
import { QuickEntrySheet } from "./QuickEntrySheet";
import { RecentList } from "./RecentList";
import { RunningCard } from "./RunningCard";
import { StatusLines } from "./StatusLines";
import { SummaryCard } from "./SummaryCard";
import { VitaminDRow } from "./VitaminDRow";

type SheetState = { type: InstantType; initial?: QuickValues } | null;

const VITAMIN_D: QuickValues = {
  name: "Vitamin D",
  amount: "1",
  unit: "giọt",
  antipyretic: false,
};

export function HomeScreen({
  baby,
  member,
}: {
  baby: Baby;
  member: FamilyMember;
}) {
  const now = useNow(1000);
  useLogsRealtime(baby.id);
  const logs = useRecentLogs(baby.id);
  const firstLogAt = useFirstLogAt(baby.id);
  const members = useMembers(baby.family_id);
  const press = useTimerPress(baby.id);
  const stop = useStopTimer(baby.id);
  const [sheet, setSheet] = useState<SheetState>(null);

  const rows = logs.data ?? [];
  const age = ageDays(baby.dob, now);
  const ratings = rateLast24h({
    logs: rows,
    ageDays: age,
    firstLogAt: firstLogAt.data ?? null,
    now,
  });
  const alerts = homeAlerts({
    logs: rows,
    ageDays: age,
    wetDiapers: ratings.wetDiapers,
    triageAvailable: false,
    now,
  });
  const statusLines = homeStatusLines({
    logs: rows,
    feedIntervalMin: baby.feed_interval_min,
    now,
  });
  const totals = windowTotals(rows, now);
  const vitaminD = vitaminDToday(rows, now);
  const runningRows = rows.filter((row) => row.ended_at === null);
  const recentRows = rows.filter(
    (row) =>
      row.ended_at !== null &&
      Date.parse(row.started_at) >= now.getTime() - WINDOW_MS,
  );
  const running = toRunning(rows);
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";
  const error = press.error ?? stop.error;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <AlertBanners alerts={alerts} />

      <header>
        <h1 className="text-2xl font-semibold">{baby.name}</h1>
        <p className="text-neutral-500">
          {formatAgeVi(baby.dob, now)} · Xin chào {member.display_name}
        </p>
      </header>

      <StatusLines lines={statusLines} />

      <ActionGrid
        running={running}
        busy={press.isPending}
        onTimer={(button) => press.mutate({ running, button })}
        onInstant={(type) => setSheet({ type })}
      />

      {error && (
        <p role="alert" className="text-red-600">
          {toVietnameseError(error)}
        </p>
      )}

      {runningRows.map((log) => (
        <RunningCard
          key={log.id}
          log={log}
          who={nameOf(log.created_by)}
          now={now}
          busy={stop.isPending}
          onStop={() => stop.mutate(log.id)}
        />
      ))}

      <VitaminDRow
        doneAt={vitaminD}
        onRecord={() => setSheet({ type: "medicine", initial: VITAMIN_D })}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">24 giờ qua</h2>
        <SummaryCard ratings={ratings} totals={totals} />
        {logs.isError ? (
          <p className="text-red-600">{toVietnameseError(logs.error)}</p>
        ) : (
          <RecentList logs={recentRows} now={now} nameOf={nameOf} />
        )}
      </section>

      {sheet && (
        <QuickEntrySheet
          type={sheet.type}
          initial={sheet.initial}
          recentLogs={rows}
          babyId={baby.id}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
```

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; mọi test Vitest đạt; `next build` thành công với đủ 5 route như M3.

- [ ] **Step 8: 👤 Kiểm tra tay trên localhost**

Run: `bun run dev`. Nhờ người dùng đăng nhập ở `http://localhost:3000/` và kiểm tra:

1. Thẻ "24 giờ qua" có 3 ô Giấc ngủ / Cữ bú / Tã ướt. Nếu log đầu tiên của bé chưa đủ 24 giờ: cả ba ghi "Chưa đủ dữ liệu". Dòng dưới ghi "Bình: … ml · Tã bẩn: …".
2. Dưới tên bé có dòng "Cữ bú tiếp theo khoảng HH:mm" (bằng giờ bắt đầu cữ gần nhất cộng 3 giờ), và "Bé đã thức …" nếu có giấc ngủ đã kết thúc trong 12 giờ qua.
3. Bấm "Nhiệt độ", nhập `38,2`, Lưu → nếu bé dưới 91 ngày tuổi: banner đỏ "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay." kèm nút "Gọi 115"; nếu bé từ 91 ngày: banner vàng "Bé đang sốt — theo dõi sát, hỏi bác sĩ nếu sốt kéo dài." không có nút. Nhập tiếp `37,0`, Lưu → banner biến mất.
4. Bấm "Thuốc", tick "Thuốc hạ sốt", tên `Paracetamol`, lượng `2,5`, Lưu. Mở lại "Thuốc", tick "Thuốc hạ sốt" → hiện "Chưa đủ 4 giờ từ liều hạ sốt trước (HH:mm)."; nút Lưu vẫn bấm được (bấm Hủy để không ghi thêm).
5. Bấm "Ghi Vitamin D hôm nay" → sheet thuốc điền sẵn Vitamin D / 1 / giọt. Lưu → ô đổi thành "✓ Đã uống Vitamin D hôm nay lúc HH:mm".
6. Mở thêm cửa sổ ẩn danh đăng nhập cùng tài khoản. Bấm "Ngủ" ở cửa sổ A → cửa sổ B hiện thẻ đang chạy trong ≤ 3 giây.
7. Xóa các bản ghi thử ở bước 3–4 trong Supabase dashboard → Table Editor → `logs` (trang `/nhat-ky` để M5) → cả hai cửa sổ cập nhật trong ≤ 3 giây.
8. Tắt Wi-Fi rồi tải lại trang → thấy "Bạn đang offline. Kết nối mạng rồi thử lại." (nếu trình duyệt còn cache trang) hoặc trang lỗi của trình duyệt; bật lại Wi-Fi, bấm "Thử lại" → vào lại trang chủ.

- [ ] **Step 9: Commit và deploy**

```bash
git add -A && git commit -m "feat(home): 24-hour ratings, medical alerts, status lines, vitamin D and antipyretic warnings"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app. Nhờ người dùng lặp lại bước 3 và 6 của Step 8 trên iPhone đã cài PWA (bước 6 dùng hai máy: iPhone và máy tính) và xác nhận đạt.

---

## Ngoài phạm vi M4

- M5: `/nhat-ky` (dòng thời gian theo ngày VN, lọc theo loại, sửa giờ/details/ghi chú, xóa theo quyền §4.1, thêm bản ghi tay) và `/thong-ke` (biểu đồ 7/14 ngày, chia giấc ngủ vắt qua nửa đêm; thêm `recharts` 3.x).
- M6: thanh tab dưới §6.18, `/cai-dat` (thành viên, hồ sơ bé, `feed_interval_min`, theme Sáng/Tối/Ban đêm/Theo hệ thống, đăng xuất), `/cai-app` §6.17.
- M7: service worker §8.4, offline outbox §9, push `feed` §8, pg_cron + Vault, tạm tắt thông báo, checklist thiết bị bước 1–4 và 7.
