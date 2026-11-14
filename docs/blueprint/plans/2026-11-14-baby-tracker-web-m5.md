# Baby Tracker Web — M5 (Trang Nhật ký `/nhat-ky`) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/nhat-ky` hiện mọi bản ghi theo ngày giờ Việt Nam, lọc theo loại, bấm vào bản ghi để sửa giờ, chi tiết, ghi chú hoặc xóa theo quyền §4.1, và có nút "+ Thêm" để nhập tay đủ giờ (spec §6.3).

**Architecture:** Quy tắc mới là hàm thuần trong `lib/rules/` (Vitest): ranh giới ngày VN, nhóm theo ngày, bộ lọc, phân trang 7 ngày, quyền sửa, và dựng bản ghi từ form. Trang tải log theo trang 7 ngày bằng `useInfiniteQuery`, sửa/xóa gọi thẳng Supabase (RLS là ranh giới bảo mật) và coi 0 dòng trả về là bị từ chối quyền (spec §5.2). Mọi query log nằm dưới khóa `["logs", babyId, ...]` nên Realtime của M4 làm mới luôn trang này.

**Tech Stack:** như M1–M4 (Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, supabase-js 2.118.0, React Query 5.105.0, zod 4.6.7, Vitest 5.0.5). Không thêm thư viện.

**Milestones của đợt phát hành 1** (M5 cũ được tách làm hai cho vừa cỡ một plan): M1 nền tảng + đăng nhập (xong) · M2 quy tắc thuần + khai báo bé (xong) · M3 trang chủ ghi chép (xong) · M4 đánh giá, cảnh báo, Realtime (xong) · **M5 `/nhat-ky`** · M6 `/thong-ke` (biểu đồ, thêm `recharts`) · M7 thanh tab, `/cai-dat`, theme, `/cai-app` · M8 service worker, offline outbox, Web Push, pg_cron, tạm tắt. M6–M8 lập plan sau khi M5 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- §6.3 "nhập tay đủ giờ": bản ghi thêm tay của loại đồng hồ (Bú mẹ, Ngủ) bắt buộc có giờ kết thúc. Chỉ khi **sửa** một đồng hồ đang chạy mới được để trống giờ kết thúc (nghĩa là vẫn đang chạy). Bản ghi tức thời lưu `ended_at = started_at` (§5.1).
- Giờ bắt đầu và kết thúc không được ở tương lai (cho phép lệch 1 phút), kết thúc không trước bắt đầu (khớp `check` của bảng `logs`). Ghi chú tối đa 500 ký tự.
- Không đổi được `type` của bản ghi đã có (spec chỉ cho sửa giờ, details, ghi chú). Loại thêm tay ở đợt 1: Bú mẹ, Bú bình, Ngủ, Tã, Thuốc, Nhiệt độ. Hút sữa và Tummy time thuộc đợt 3; bản ghi có sẵn của hai loại này vẫn hiện và sửa được.
- Bộ lọc: Tất cả · Bú (`breast` + `bottle`) · Ngủ · Tã · Thuốc · Nhiệt độ.
- Tải theo trang 7 ngày lịch VN, mới nhất trước. Nút "Xem thêm 7 ngày trước" ẩn khi trang đã tải chạm ngày sinh. Lý do: Supabase trả tối đa 1000 dòng mỗi lần gọi.
- Quyền §4.1: owner sửa/xóa mọi bản ghi; member chỉ bản ghi do mình tạo. Bản ghi không được sửa thì sheet chỉ hiện giờ, nội dung, người ghi, ghi chú và câu "Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được." RLS vẫn là chốt chặn thật.
- Xóa trả 0 dòng thì `select` lại theo `id`: không còn dòng nghĩa là máy khác đã xóa (coi là thành công), còn dòng nghĩa là bị RLS chặn (giống quy tắc §9).
- Cảnh báo thuốc hạ sốt §7.4 hiện cả trong sheet "+ Thêm" khi chọn Thuốc và tick "Thuốc hạ sốt" (đây cũng là "thêm thuốc"). Khi sửa bản ghi cũ thì không hiện.
- Nút "+ Thêm bản ghi" của §6.3 ghi gọn là "+ Thêm" để vừa thanh tiêu đề trên màn 375 pt; tiêu đề sheet vẫn là "Thêm bản ghi".
- Thanh tab dưới thuộc M7. Ở M5, trang chủ có thêm nút "Nhật ký", trang `/nhat-ky` có link "← Trang chủ".

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

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component (`'use client'`), tự kiểm tra phiên ở client.
- `supabase-js` khởi tạo với `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.
- Toàn bộ logic nghiệp vụ là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Tuổi của bé tính bằng số ngày: `ageDays = (ngày hiện tại theo giờ VN) − dob`.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Cột `created_by` có `default auth.uid()`; client không bao giờ gửi `created_by`.
- Mọi lệnh `update`/`delete` ở client dùng `.select()` và coi 0 dòng trả về là "bị từ chối quyền" (spec §5.2).
- Tên route: `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`, `/`, `/nhat-ky`.
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`).
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x. Thêm thư viện khác phải ghi lý do trong plan.
- Không dùng Workbox, Serwist, `next-pwa`: service worker viết tay ở `public/sw.js` (M8).
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.

Riêng M5:

- Trước khi viết code Next.js, đọc trong `node_modules/next/dist/docs/01-app/01-getting-started/`: `04-linking-and-navigating.md` (dùng `<Link>`) và `05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/days.ts`, `lib/rules/history.ts`, `lib/rules/logForm.ts` phải đúng từng ký tự như plan này (có test khóa lại).

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`f48194b`):

- `supabase()` (`lib/supabase/client.ts`); `LogRow`, `Baby`, `FamilyMember` (`lib/supabase/rows.ts`); `Json` (`lib/supabase/types.ts`)
- `vnDateString`, `formatVnTime`, `fromVnLocalInput`, `toVnLocalInput` (`lib/rules/time.ts`)
- `detailsSchemas`, `isTimerType`, `LogType` (`lib/rules/logDetails.ts`); `describeLog` (`lib/rules/describeLog.ts`)
- `QUICK_FIELDS`, `QuickField`, `QuickValues`, `defaultQuickValues`, `buildDetails` (`lib/rules/quickEntry.ts`)
- `medicineWarnings` (`lib/rules/alerts.ts`)
- `logsKey`, `insertLog` (`lib/data/logs.ts`); `useLogsRealtime` (`lib/data/realtime.ts`); `useMembers` (`lib/data/family.ts`)
- `PermissionDeniedError`, `toVietnameseError` (`lib/data/errors.ts`); `useNow` (`lib/hooks/useNow.ts`)
- `AuthGate` với `need="baby"` (`components/AuthGate.tsx`); `HomeScreen`, `QuickEntrySheet` (`components/home/`)
- Bảng `logs` với RLS §5.2 (`supabase/migrations/20261113000200_rls.sql`), nằm trong publication `supabase_realtime`

**Produces** (M6–M8 dùng):

- `lib/rules/days.ts`: `vnDayStartMs(day: string): number`, `addDays(day: string, n: number): string`, `formatDayShort(day: string): string`, `vnDayLabel(day: string, now: Date): string`
- `lib/rules/history.ts`: `HistoryFilter`, `HISTORY_FILTERS`, `matchesFilter`, `groupByVnDay`, `HISTORY_PAGE_DAYS`, `historyPageRange`, `nextHistoryPage`, `canModifyLog`
- `lib/rules/logForm.ts`: `MANUAL_TYPES`, `LOG_FIELDS`, `defaultLogValues`, `valuesFromDetails`, `buildLogDetails`, `LogPatch`, `buildLogPatch`
- `lib/data/logCache.ts`: `cacheHasLog(data: unknown, id: string): boolean`
- `lib/data/logs.ts`: `insertLog` nhận thêm `note?: string | null`; `fetchHistoryPage`, `useHistoryLogs(babyId, dob)` (key `["logs", babyId, "history"]`), `updateLog`, `deleteLog`, `useSaveLog`, `useDeleteLog`
- Quy ước khóa query: mọi query chứa bản ghi `logs` dùng khóa bắt đầu bằng `logsKey(babyId)`; `useLogsRealtime` làm mới mọi khóa đó và xét sự kiện DELETE trên tất cả cache dưới khóa đó
- `components/form/QuickFields.tsx`: `QuickFields({ fields, values, onChange })`
- Route `/nhat-ky`; trang chủ có `<nav>` chứa link "Nhật ký" (M6 thêm link "Thống kê" vào nav này, M7 thay nav bằng thanh tab)

## File Structure

```
lib/rules/days.ts (+ test)            # ranh giới ngày VN, nhãn "Hôm nay"/"Hôm qua"/"Thứ Hai, 09/11"
lib/rules/history.ts (+ test)         # bộ lọc, nhóm theo ngày, phân trang 7 ngày, quyền sửa §4.1
lib/rules/logForm.ts (+ test)         # trường form theo loại, đổi details ↔ giá trị form, dựng bản ghi
lib/data/logCache.ts (+ test)         # tìm id bản ghi trong cache (danh sách hoặc infinite query)
lib/data/logs.ts                      # sửa: ghi chú khi thêm, tải theo trang, sửa, xóa
lib/data/realtime.ts                  # sửa: DELETE xét mọi cache dưới logsKey
components/form/QuickFields.tsx       # ô nhập theo QuickField (tách từ QuickEntrySheet)
components/home/QuickEntrySheet.tsx   # sửa: dùng QuickFields
components/history/LogEditSheet.tsx   # sheet thêm/sửa/xóa bản ghi
components/history/HistoryScreen.tsx  # dòng thời gian, bộ lọc, xem thêm
app/nhat-ky/page.tsx                  # route
components/home/HomeScreen.tsx        # sửa: nút "Nhật ký"
```

## Tasks

1. Ngày giờ VN, bộ lọc, phân trang, quyền sửa
2. Form bản ghi: trường theo loại, kiểm tra giờ, ghi chú
3. Dữ liệu: tải theo trang, sửa, xóa, Realtime
4. Trang `/nhat-ky` và nút từ trang chủ

---

### Task 1: Ngày giờ VN, bộ lọc, phân trang, quyền sửa

**Files:**

- Create: `lib/rules/days.ts`, `lib/rules/history.ts`
- Test: `lib/rules/days.test.ts`, `lib/rules/history.test.ts`

**Interfaces:**

- Consumes: `vnDateString(instant: Date): string` (`lib/rules/time.ts`)
- Produces:
  - `vnDayStartMs(day: string): number` — mốc 00:00 giờ VN của ngày `YYYY-MM-DD`, tính bằng ms UTC
  - `addDays(day: string, n: number): string`
  - `formatDayShort(day: string): string` — `"dd/MM"`
  - `vnDayLabel(day: string, now: Date): string` — `"Hôm nay"`, `"Hôm qua"` hoặc `"<Thứ>, dd/MM"`
  - `type HistoryFilter = "all" | "feed" | "sleep" | "diaper" | "medicine" | "temperature"`
  - `HISTORY_FILTERS: { value: HistoryFilter; label: string }[]`
  - `matchesFilter(log: { type: string }, filter: HistoryFilter): boolean`
  - `groupByVnDay<T extends { started_at: string }>(logs: T[]): { day: string; logs: T[] }[]` — ngày mới nhất trước, trong ngày bản ghi mới nhất trước
  - `HISTORY_PAGE_DAYS = 7`
  - `historyPageRange(now: Date, page: number): { fromDay: string; from: string; to: string }` — trang 0 là 7 ngày VN tính đến hôm nay; `from` gồm, `to` không gồm (ISO UTC)
  - `nextHistoryPage(dob: string, now: Date, loadedPages: number): number | undefined`
  - `canModifyLog(viewer: { role: string; user_id: string | null }, createdBy: string): boolean`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m5.md` (file plan này, đi chung commit của Task 1); commit mới nhất là `f48194b feat(home): 24-hour ratings, medical alerts, status lines, vitamin D and antipyretic warnings`.

- [ ] **Step 2: Viết test thất bại cho `days.ts`**

Tạo `lib/rules/days.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { addDays, formatDayShort, vnDayLabel, vnDayStartMs } from "./days";

describe("days", () => {
  it("vnDayStartMs is VN midnight in UTC", () => {
    expect(new Date(vnDayStartMs("2026-11-14")).toISOString()).toBe(
      "2026-11-13T17:00:00.000Z",
    );
  });

  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("formatDayShort gives dd/MM", () => {
    expect(formatDayShort("2026-01-05")).toBe("05/01");
  });

  it("vnDayLabel names today, yesterday and older days", () => {
    const now = new Date("2026-11-14T03:00:00Z"); // 10:00 Saturday 14/11 in VN
    expect(vnDayLabel("2026-11-14", now)).toBe("Hôm nay");
    expect(vnDayLabel("2026-11-13", now)).toBe("Hôm qua");
    expect(vnDayLabel("2026-11-09", now)).toBe("Thứ Hai, 09/11");
    expect(vnDayLabel("2026-11-08", now)).toBe("Chủ nhật, 08/11");
  });
});
```

- [ ] **Step 3: Viết test thất bại cho `history.ts`**

Tạo `lib/rules/history.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  canModifyLog,
  groupByVnDay,
  historyPageRange,
  matchesFilter,
  nextHistoryPage,
} from "./history";

const now = new Date("2026-11-14T03:00:00Z"); // 10:00 on 14/11 in VN

describe("history", () => {
  it("matchesFilter groups breast and bottle under feed", () => {
    expect(matchesFilter({ type: "breast" }, "feed")).toBe(true);
    expect(matchesFilter({ type: "bottle" }, "feed")).toBe(true);
    expect(matchesFilter({ type: "sleep" }, "feed")).toBe(false);
    expect(matchesFilter({ type: "pump" }, "all")).toBe(true);
  });

  it("groupByVnDay splits at VN midnight, newest day and log first", () => {
    const groups = groupByVnDay([
      { id: "a", started_at: "2026-11-13T16:59:00Z" }, // 23:59 on 13/11
      { id: "c", started_at: "2026-11-14T02:00:00Z" }, // 09:00 on 14/11
      { id: "b", started_at: "2026-11-13T17:00:00Z" }, // 00:00 on 14/11
    ]);
    expect(groups.map((g) => g.day)).toEqual(["2026-11-14", "2026-11-13"]);
    expect(groups[0].logs.map((l) => l.id)).toEqual(["c", "b"]);
    expect(groups[1].logs.map((l) => l.id)).toEqual(["a"]);
  });

  it("historyPageRange covers 7 VN days per page", () => {
    expect(historyPageRange(now, 0)).toEqual({
      fromDay: "2026-11-08",
      from: "2026-11-07T17:00:00.000Z",
      to: "2026-11-14T17:00:00.000Z",
    });
    expect(historyPageRange(now, 1)).toEqual({
      fromDay: "2026-11-01",
      from: "2026-10-31T17:00:00.000Z",
      to: "2026-11-07T17:00:00.000Z",
    });
  });

  it("nextHistoryPage stops once the loaded pages reach the birth date", () => {
    expect(nextHistoryPage("2026-09-01", now, 1)).toBe(1);
    expect(nextHistoryPage("2026-11-08", now, 1)).toBeUndefined();
    expect(nextHistoryPage("2026-11-10", now, 1)).toBeUndefined();
  });

  it("canModifyLog follows the owner/member rules", () => {
    expect(canModifyLog({ role: "owner", user_id: "u1" }, "u2")).toBe(true);
    expect(canModifyLog({ role: "member", user_id: "u1" }, "u1")).toBe(true);
    expect(canModifyLog({ role: "member", user_id: "u1" }, "u2")).toBe(false);
    expect(canModifyLog({ role: "member", user_id: null }, "u2")).toBe(false);
  });
});
```

- [ ] **Step 4: Chạy test để thấy thất bại**

Run: `bun run test lib/rules/days.test.ts lib/rules/history.test.ts`
Expected: FAIL — `Cannot find module './days'` và `Cannot find module './history'`.

- [ ] **Step 5: Viết `lib/rules/days.ts`**

```ts
import { vnDateString } from "./time";

const DAY_MS = 86_400_000;
const WEEKDAYS = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

export function vnDayStartMs(day: string): number {
  return Date.parse(`${day}T00:00:00+07:00`);
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function formatDayShort(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

export function vnDayLabel(day: string, now: Date): string {
  const today = vnDateString(now);
  if (day === today) return "Hôm nay";
  if (day === addDays(today, -1)) return "Hôm qua";
  const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
  return `${weekday}, ${formatDayShort(day)}`;
}
```

- [ ] **Step 6: Viết `lib/rules/history.ts`**

```ts
import { addDays, vnDayStartMs } from "./days";
import { vnDateString } from "./time";

export type HistoryFilter =
  "all" | "feed" | "sleep" | "diaper" | "medicine" | "temperature";

export const HISTORY_FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "feed", label: "Bú" },
  { value: "sleep", label: "Ngủ" },
  { value: "diaper", label: "Tã" },
  { value: "medicine", label: "Thuốc" },
  { value: "temperature", label: "Nhiệt độ" },
];

const FILTER_TYPES: Record<Exclude<HistoryFilter, "all">, readonly string[]> = {
  feed: ["breast", "bottle"],
  sleep: ["sleep"],
  diaper: ["diaper"],
  medicine: ["medicine"],
  temperature: ["temperature"],
};

export function matchesFilter(
  log: { type: string },
  filter: HistoryFilter,
): boolean {
  return filter === "all" || FILTER_TYPES[filter].includes(log.type);
}

export function groupByVnDay<T extends { started_at: string }>(
  logs: T[],
): { day: string; logs: T[] }[] {
  const sorted = [...logs].sort(
    (a, b) => Date.parse(b.started_at) - Date.parse(a.started_at),
  );
  const groups: { day: string; logs: T[] }[] = [];
  for (const log of sorted) {
    const day = vnDateString(new Date(log.started_at));
    const last = groups.at(-1);
    if (last && last.day === day) last.logs.push(log);
    else groups.push({ day, logs: [log] });
  }
  return groups;
}

export const HISTORY_PAGE_DAYS = 7;

export function historyPageRange(
  now: Date,
  page: number,
): { fromDay: string; from: string; to: string } {
  const today = vnDateString(now);
  const fromDay = addDays(today, -HISTORY_PAGE_DAYS * page - 6);
  const toDay = addDays(today, -HISTORY_PAGE_DAYS * page + 1);
  return {
    fromDay,
    from: new Date(vnDayStartMs(fromDay)).toISOString(),
    to: new Date(vnDayStartMs(toDay)).toISOString(),
  };
}

export function nextHistoryPage(
  dob: string,
  now: Date,
  loadedPages: number,
): number | undefined {
  return historyPageRange(now, loadedPages - 1).fromDay > dob
    ? loadedPages
    : undefined;
}

export function canModifyLog(
  viewer: { role: string; user_id: string | null },
  createdBy: string,
): boolean {
  return (
    viewer.role === "owner" ||
    (viewer.user_id !== null && viewer.user_id === createdBy)
  );
}
```

- [ ] **Step 7: Chạy test để thấy đạt**

Run: `bun run test lib/rules/days.test.ts lib/rules/history.test.ts && bun run typecheck`
Expected: PASS — days 4 test, history 5 test; không lỗi type.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(rules): VN day helpers, history filters, paging and edit permission"
```

`git add -A` lần này đưa cả file plan M5 vào commit.

---

### Task 2: Form bản ghi: trường theo loại, kiểm tra giờ, ghi chú

**Files:**

- Create: `lib/rules/logForm.ts`
- Test: `lib/rules/logForm.test.ts`

**Interfaces:**

- Consumes: `detailsSchemas`, `isTimerType`, `LogType` (`lib/rules/logDetails.ts`); `QUICK_FIELDS`, `QuickField`, `QuickValues`, `defaultQuickValues`, `buildDetails` (`lib/rules/quickEntry.ts`); `fromVnLocalInput` (`lib/rules/time.ts`)
- Produces:
  - `MANUAL_TYPES: { value: LogType; label: string }[]` — 6 loại thêm tay ở đợt 1
  - `LOG_FIELDS: Record<LogType, QuickField[]>` — 4 loại tức thời dùng lại đúng mảng của `QUICK_FIELDS`
  - `defaultLogValues(type: LogType): QuickValues`
  - `valuesFromDetails(type: LogType, details: unknown): QuickValues` — details hỏng thì trả giá trị mặc định
  - `buildLogDetails(type: LogType, values: QuickValues): { ok: true; details: Record<string, unknown> } | { ok: false; message: string }`
  - `type LogPatch = { started_at: string; ended_at: string | null; details: Record<string, unknown>; note: string | null }`
  - `buildLogPatch(input: { type: LogType; values: QuickValues; start: string; end: string; note: string; allowOpenEnd: boolean; now: Date }): { ok: true; patch: LogPatch } | { ok: false; message: string }` — `start`/`end` là giá trị ô `datetime-local` theo giờ VN (`"YYYY-MM-DDTHH:mm"`), `end` rỗng được phép chỉ khi `allowOpenEnd`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/logForm.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bun run test lib/rules/logForm.test.ts`
Expected: FAIL — `Cannot find module './logForm'`.

- [ ] **Step 3: Viết `lib/rules/logForm.ts`**

```ts
import { detailsSchemas, isTimerType, type LogType } from "./logDetails";
import {
  buildDetails,
  defaultQuickValues,
  QUICK_FIELDS,
  type QuickField,
  type QuickValues,
} from "./quickEntry";
import { fromVnLocalInput } from "./time";

export const MANUAL_TYPES: { value: LogType; label: string }[] = [
  { value: "breast", label: "Bú mẹ" },
  { value: "bottle", label: "Bú bình" },
  { value: "sleep", label: "Ngủ" },
  { value: "diaper", label: "Tã" },
  { value: "medicine", label: "Thuốc" },
  { value: "temperature", label: "Nhiệt độ" },
];

export const LOG_FIELDS: Record<LogType, QuickField[]> = {
  ...QUICK_FIELDS,
  breast: [
    {
      key: "side",
      label: "Bên",
      kind: "select",
      options: [
        { value: "left", label: "Trái" },
        { value: "right", label: "Phải" },
      ],
    },
  ],
  sleep: [],
  pump: [
    { key: "mlLeft", label: "Số ml bên trái", kind: "number" },
    { key: "mlRight", label: "Số ml bên phải", kind: "number" },
  ],
  tummy: [],
};

export function defaultLogValues(type: LogType): QuickValues {
  if (type === "breast") return { side: "left" };
  if (type === "pump") return { mlLeft: "", mlRight: "" };
  if (type === "sleep" || type === "tummy") return {};
  return defaultQuickValues(type);
}

export function valuesFromDetails(
  type: LogType,
  details: unknown,
): QuickValues {
  const values = defaultLogValues(type);
  const parsed = detailsSchemas[type].safeParse(details);
  if (!parsed.success) return values;
  for (const [key, value] of Object.entries(parsed.data))
    values[key] = typeof value === "number" ? String(value) : value;
  return values;
}

export function buildLogDetails(
  type: LogType,
  values: QuickValues,
):
  | { ok: true; details: Record<string, unknown> }
  | { ok: false; message: string } {
  switch (type) {
    case "breast": {
      const p = detailsSchemas.breast.safeParse({ side: values.side });
      return p.success
        ? { ok: true, details: p.data }
        : { ok: false, message: "Chọn bên bú" };
    }
    case "sleep":
    case "tummy":
      return { ok: true, details: {} };
    case "pump": {
      const raw: Record<string, number> = {};
      for (const key of ["mlLeft", "mlRight"]) {
        const value = values[key];
        if (typeof value === "string" && value.trim() !== "")
          raw[key] = Number(value.trim());
      }
      const p = detailsSchemas.pump.safeParse(raw);
      return p.success
        ? { ok: true, details: p.data }
        : { ok: false, message: "Nhập số ml từ 0 đến 500" };
    }
    default:
      return buildDetails(type, values);
  }
}

export type LogPatch = {
  started_at: string;
  ended_at: string | null;
  details: Record<string, unknown>;
  note: string | null;
};

const FUTURE_SLACK_MS = 60_000;

export function buildLogPatch(input: {
  type: LogType;
  values: QuickValues;
  start: string;
  end: string;
  note: string;
  allowOpenEnd: boolean;
  now: Date;
}): { ok: true; patch: LogPatch } | { ok: false; message: string } {
  const details = buildLogDetails(input.type, input.values);
  if (!details.ok) return details;
  const latest = input.now.getTime() + FUTURE_SLACK_MS;
  const start = fromVnLocalInput(input.start);
  if (Number.isNaN(start.getTime()))
    return { ok: false, message: "Nhập giờ bắt đầu" };
  if (start.getTime() > latest)
    return { ok: false, message: "Giờ bắt đầu không được ở tương lai" };
  let end: Date | null = start;
  if (isTimerType(input.type)) {
    if (input.end === "") {
      if (!input.allowOpenEnd)
        return { ok: false, message: "Nhập giờ kết thúc" };
      end = null;
    } else {
      end = fromVnLocalInput(input.end);
      if (Number.isNaN(end.getTime()))
        return { ok: false, message: "Nhập giờ kết thúc" };
      if (end.getTime() < start.getTime())
        return { ok: false, message: "Giờ kết thúc phải sau giờ bắt đầu" };
      if (end.getTime() > latest)
        return { ok: false, message: "Giờ kết thúc không được ở tương lai" };
    }
  }
  const note = input.note.trim();
  if (note.length > 500)
    return { ok: false, message: "Ghi chú tối đa 500 ký tự" };
  return {
    ok: true,
    patch: {
      started_at: start.toISOString(),
      ended_at: end === null ? null : end.toISOString(),
      details: details.details,
      note: note === "" ? null : note,
    },
  };
}
```

Ghi chú: trong `buildLogDetails`, nhánh `default` chỉ còn 4 loại tức thời nên TypeScript tự thu hẹp `type` về `InstantType` khi gọi `buildDetails`.

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run test lib/rules/logForm.test.ts && bun run typecheck`
Expected: PASS — 8 test; không lỗi type.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(rules): log form fields, details round-trip and time validation"
```

---

### Task 3: Dữ liệu: tải theo trang, sửa, xóa, Realtime

**Files:**

- Create: `lib/data/logCache.ts`
- Modify: `lib/data/logs.ts` (import ở đầu file, tham số `insertLog`, thêm hàm ở cuối file), `lib/data/realtime.ts` (import `LogRow`, nhánh `DELETE`)
- Test: `lib/data/logCache.test.ts`

**Interfaces:**

- Consumes: `historyPageRange`, `nextHistoryPage` (Task 1); `LogPatch` (Task 2); `PermissionDeniedError` (`lib/data/errors.ts`); `logsKey`, `insertLog` (`lib/data/logs.ts`)
- Produces:
  - `cacheHasLog(data: unknown, id: string): boolean` — `data` là `LogRow[]` hoặc dữ liệu infinite query `{ pages: LogRow[][] }`
  - `insertLog(row: { id; baby_id; type; started_at; ended_at; details; note?: string | null }): Promise<void>`
  - `fetchHistoryPage(babyId: string, page: number, now: Date): Promise<LogRow[]>`
  - `useHistoryLogs(babyId: string, dob: string)` — `useInfiniteQuery`, key `["logs", babyId, "history"]`, `pageParam` là số trang (0 = 7 ngày gần nhất)
  - `updateLog(id: string, patch: LogPatch): Promise<void>` — 0 dòng thì ném `PermissionDeniedError`
  - `deleteLog(id: string): Promise<void>` — 0 dòng mà dòng còn tồn tại thì ném `PermissionDeniedError`; dòng đã mất thì coi là thành công
  - `useSaveLog(babyId: string)` — `mutate({ id: string | null; type: LogType; patch: LogPatch })`, `id = null` là thêm mới
  - `useDeleteLog(babyId: string)` — `mutate(id: string)`
  - Cả hai mutation làm mới `logsKey(babyId)` (mọi khóa con) và `["first-log", babyId]`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/data/logCache.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cacheHasLog } from "./logCache";

describe("cacheHasLog", () => {
  it("finds a row in a plain list", () => {
    expect(cacheHasLog([{ id: "a" }, { id: "b" }], "b")).toBe(true);
    expect(cacheHasLog([{ id: "a" }], "z")).toBe(false);
  });

  it("finds a row in infinite-query pages", () => {
    const data = { pages: [[{ id: "a" }], [{ id: "b" }]], pageParams: [0, 1] };
    expect(cacheHasLog(data, "b")).toBe(true);
    expect(cacheHasLog(data, "z")).toBe(false);
  });

  it("returns false for empty or unknown cache entries", () => {
    expect(cacheHasLog(undefined, "a")).toBe(false);
    expect(cacheHasLog(null, "a")).toBe(false);
    expect(cacheHasLog("x", "a")).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bun run test lib/data/logCache.test.ts`
Expected: FAIL — `Cannot find module './logCache'`.

- [ ] **Step 3: Viết `lib/data/logCache.ts`**

```ts
export function cacheHasLog(data: unknown, id: string): boolean {
  if (Array.isArray(data))
    return data.some(
      (row) => typeof row === "object" && row !== null && row.id === id,
    );
  if (
    typeof data === "object" &&
    data !== null &&
    "pages" in data &&
    Array.isArray(data.pages)
  )
    return data.pages.some((page) => cacheHasLog(page, id));
  return false;
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run test lib/data/logCache.test.ts`
Expected: PASS — 3 test.

- [ ] **Step 5: Sửa phần import của `lib/data/logs.ts`**

Thay dòng:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LogType } from "@/lib/rules/logDetails";
```

bằng:

```ts
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { historyPageRange, nextHistoryPage } from "@/lib/rules/history";
import type { LogType } from "@/lib/rules/logDetails";
import type { LogPatch } from "@/lib/rules/logForm";
```

Thay dòng:

```ts
import type { Json } from "@/lib/supabase/types";
```

bằng:

```ts
import type { Json } from "@/lib/supabase/types";
import { PermissionDeniedError } from "./errors";
```

- [ ] **Step 6: Cho `insertLog` nhận ghi chú**

Trong tham số của `insertLog`, thay:

```ts
  details: Record<string, unknown>;
}): Promise<void> {
```

bằng:

```ts
  details: Record<string, unknown>;
  note?: string | null;
}): Promise<void> {
```

Thân hàm giữ nguyên: nó đã gửi cả `row` (`{ ...row, details: ... }`), nên `note` đi theo.

- [ ] **Step 7: Thêm vào cuối `lib/data/logs.ts`**

```ts
export async function fetchHistoryPage(
  babyId: string,
  page: number,
  now: Date,
): Promise<LogRow[]> {
  const range = historyPageRange(now, page);
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .gte("started_at", range.from)
    .lt("started_at", range.to)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function useHistoryLogs(babyId: string, dob: string) {
  return useInfiniteQuery({
    queryKey: [...logsKey(babyId), "history"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchHistoryPage(babyId, pageParam, new Date()),
    getNextPageParam: (_last, pages) =>
      nextHistoryPage(dob, new Date(), pages.length),
  });
}

export async function updateLog(id: string, patch: LogPatch): Promise<void> {
  const { data, error } = await supabase()
    .from("logs")
    .update({ ...patch, details: patch.details as NonNullable<Json> })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

export async function deleteLog(id: string): Promise<void> {
  const sb = supabase();
  const { data, error } = await sb
    .from("logs")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length > 0) return;
  // 0 rows: either another device already deleted it, or RLS refused.
  const { data: left, error: checkError } = await sb
    .from("logs")
    .select("id")
    .eq("id", id);
  if (checkError) throw checkError;
  if (left.length > 0) throw new PermissionDeniedError();
}

function invalidateLogs(queryClient: QueryClient, babyId: string) {
  void queryClient.invalidateQueries({ queryKey: logsKey(babyId) });
  void queryClient.invalidateQueries({ queryKey: ["first-log", babyId] });
}

export function useSaveLog(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      type,
      patch,
    }: {
      id: string | null;
      type: LogType;
      patch: LogPatch;
    }) =>
      id
        ? updateLog(id, patch)
        : insertLog({
            id: crypto.randomUUID(),
            baby_id: babyId,
            type,
            ...patch,
          }),
    onSettled: () => invalidateLogs(queryClient, babyId),
  });
}

export function useDeleteLog(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLog,
    onSettled: () => invalidateLogs(queryClient, babyId),
  });
}
```

- [ ] **Step 8: Sửa `lib/data/realtime.ts`**

Thay dòng:

```ts
import type { LogRow } from "@/lib/supabase/rows";
```

bằng:

```ts
import { cacheHasLog } from "./logCache";
```

Trong nhánh `DELETE`, thay:

```ts
          const cached = queryClient.getQueryData<LogRow[]>(logsKey(babyId));
          if (id && cached?.some((row) => row.id === id)) invalidate();
```

bằng:

```ts
          const cached = queryClient.getQueriesData({
            queryKey: logsKey(babyId),
          });
          if (id && cached.some(([, data]) => cacheHasLog(data, id)))
            invalidate();
```

Lý do: trang `/nhat-ky` giữ bản ghi trong cache `["logs", babyId, "history"]` dạng nhiều trang; bản ghi cũ hơn 72 giờ không có trong cache trang chủ.

- [ ] **Step 9: Kiểm tra type và toàn bộ test**

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; `Tests  96 passed (96)` (76 test của M1–M4, 9 của Task 1, 8 của Task 2, 3 của Task 3).

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(data): paged history query, edit and delete with permission checks"
```

---

### Task 4: Trang `/nhat-ky` và nút từ trang chủ

**Files:**

- Create: `components/form/QuickFields.tsx`, `components/history/LogEditSheet.tsx`, `components/history/HistoryScreen.tsx`, `app/nhat-ky/page.tsx`
- Modify: `components/home/QuickEntrySheet.tsx` (import, khối vẽ ô nhập), `components/home/HomeScreen.tsx` (import, `<nav>` sau `</header>`)

**Interfaces:**

- Consumes: `vnDayLabel` (Task 1); `canModifyLog`, `groupByVnDay`, `HISTORY_FILTERS`, `matchesFilter`, `HistoryFilter` (Task 1); `buildLogPatch`, `defaultLogValues`, `LOG_FIELDS`, `MANUAL_TYPES`, `valuesFromDetails` (Task 2); `useHistoryLogs`, `useSaveLog`, `useDeleteLog` (Task 3); `useLogsRealtime`, `useMembers`, `useNow`, `toVietnameseError`, `describeLog`, `medicineWarnings`, `formatVnTime`, `fromVnLocalInput`, `toVnLocalInput`, `AuthGate`
- Produces:
  - `QuickFields({ fields: QuickField[]; values: QuickValues; onChange: (next: QuickValues) => void })`
  - `LogEditSheet({ babyId: string; log: LogRow | null; canModify: boolean; who: string; recentLogs: LogRow[]; onClose: () => void })` — `log = null` là thêm mới
  - `HistoryScreen({ baby: Baby; member: FamilyMember })`
  - Route `/nhat-ky`

- [ ] **Step 1: Đọc tài liệu Next.js**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md` (phần `<Link>`) và `05-server-and-client-components.md`. Trang trong M5 là client component (`"use client"`), điều hướng nội bộ bằng `next/link`.

- [ ] **Step 2: Tạo `components/form/QuickFields.tsx`**

Tách nguyên khối vẽ ô nhập từ `QuickEntrySheet` để sheet sửa bản ghi dùng lại:

```tsx
"use client";

import type { QuickField, QuickValues } from "@/lib/rules/quickEntry";

const INPUT = "min-h-11 rounded-xl border px-3";

export function QuickFields({
  fields,
  values,
  onChange,
}: {
  fields: QuickField[];
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  return (
    <>
      {fields
        .filter((field) => !field.showIf || field.showIf(values))
        .map((field) => {
          const value = values[field.key];
          const set = (next: string | boolean) =>
            onChange({ ...values, [field.key]: next });
          if (field.kind === "checkbox") {
            return (
              <label
                key={field.key}
                className="flex min-h-11 items-center gap-3"
              >
                <input
                  type="checkbox"
                  className="size-5"
                  checked={value === true}
                  onChange={(e) => set(e.target.checked)}
                />
                {field.label}
              </label>
            );
          }
          if (field.kind === "select") {
            return (
              <label key={field.key} className="flex flex-col gap-1">
                {field.label}
                <select
                  className={INPUT}
                  value={String(value)}
                  onChange={(e) => set(e.target.value)}
                >
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          return (
            <label key={field.key} className="flex flex-col gap-1">
              {field.label}
              <input
                className={INPUT}
                inputMode={field.kind === "number" ? "decimal" : "text"}
                value={String(value)}
                onChange={(e) => set(e.target.value)}
              />
            </label>
          );
        })}
    </>
  );
}
```

- [ ] **Step 3: Cho `QuickEntrySheet` dùng `QuickFields`**

Trong `components/home/QuickEntrySheet.tsx`, thêm import ngay sau dòng `import { useState, type FormEvent } from "react";`:

```tsx
import { QuickFields } from "@/components/form/QuickFields";
```

Rồi thay cả khối JSX bắt đầu bằng `{QUICK_FIELDS[type]` (dòng ngay sau `<h2 className="text-xl font-semibold">{TITLES[type]}</h2>`) và kết thúc bằng `})}` (dòng ngay trước `<label className="flex flex-col gap-1">` của ô "Thời điểm") bằng:

```text
        <QuickFields
          fields={QUICK_FIELDS[type]}
          values={values}
          onChange={setValues}
        />
```

(Khối trên là JSX dán vào giữa `<form>`, không có dấu `;`.) Biến `const input = "min-h-11 rounded-xl border px-3";` vẫn giữ vì ô "Thời điểm" dùng nó.

Run: `bun run typecheck`
Expected: không lỗi type.

- [ ] **Step 4: Tạo `components/history/LogEditSheet.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { QuickFields } from "@/components/form/QuickFields";
import { toVietnameseError } from "@/lib/data/errors";
import { useDeleteLog, useSaveLog } from "@/lib/data/logs";
import { medicineWarnings } from "@/lib/rules/alerts";
import { describeLog } from "@/lib/rules/describeLog";
import { isTimerType, type LogType } from "@/lib/rules/logDetails";
import {
  buildLogPatch,
  defaultLogValues,
  LOG_FIELDS,
  MANUAL_TYPES,
  valuesFromDetails,
} from "@/lib/rules/logForm";
import type { QuickValues } from "@/lib/rules/quickEntry";
import {
  formatVnTime,
  fromVnLocalInput,
  toVnLocalInput,
} from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";

const INPUT = "min-h-11 rounded-xl border px-3";

export function LogEditSheet({
  babyId,
  log,
  canModify,
  who,
  recentLogs,
  onClose,
}: {
  babyId: string;
  log: LogRow | null;
  canModify: boolean;
  who: string;
  recentLogs: LogRow[];
  onClose: () => void;
}) {
  const save = useSaveLog(babyId);
  const remove = useDeleteLog(babyId);
  const [type, setType] = useState<LogType>(
    () => (log?.type as LogType | undefined) ?? "breast",
  );
  const [values, setValues] = useState<QuickValues>(() =>
    log ? valuesFromDetails(type, log.details) : defaultLogValues(type),
  );
  const [start, setStart] = useState(() =>
    toVnLocalInput(log ? new Date(log.started_at) : new Date()),
  );
  const [end, setEnd] = useState(() => {
    if (!log) return toVnLocalInput(new Date());
    return log.ended_at ? toVnLocalInput(new Date(log.ended_at)) : "";
  });
  const [note, setNote] = useState(log?.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const timer = isTimerType(type);
  const allowOpenEnd = log !== null && log.ended_at === null;
  const startAt = fromVnLocalInput(start);
  const warnings =
    !log &&
    type === "medicine" &&
    values.antipyretic === true &&
    !Number.isNaN(startAt.getTime())
      ? medicineWarnings({ logs: recentLogs, at: startAt })
      : [];
  const busy = save.isPending || remove.isPending;

  function submit(event: FormEvent) {
    event.preventDefault();
    const built = buildLogPatch({
      type,
      values,
      start,
      end,
      note,
      allowOpenEnd,
      now: new Date(),
    });
    if (!built.ok) {
      setMessage(built.message);
      return;
    }
    save.mutate(
      { id: log?.id ?? null, type, patch: built.patch },
      { onSuccess: onClose, onError: (e) => setMessage(toVietnameseError(e)) },
    );
  }

  function confirmDelete() {
    if (!log || !window.confirm("Xóa bản ghi này?")) return;
    remove.mutate(log.id, {
      onSuccess: onClose,
      onError: (e) => setMessage(toVietnameseError(e)),
    });
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col gap-3 overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">
          {log ? "Bản ghi" : "Thêm bản ghi"}
        </h2>
        {log && (
          <p className="text-neutral-600">
            {formatVnTime(new Date(log.started_at))} ·{" "}
            {describeLog(log, new Date())} · {who}
          </p>
        )}
        {log && !canModify && log.note && (
          <p className="text-neutral-600">Ghi chú: {log.note}</p>
        )}
        {log && !canModify ? (
          <>
            <p className="rounded-xl bg-neutral-100 p-3">
              Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-2xl border"
            >
              Đóng
            </button>
          </>
        ) : (
          <>
            {!log && (
              <label className="flex flex-col gap-1">
                Loại
                <select
                  className={INPUT}
                  value={type}
                  onChange={(e) => {
                    const next = e.target.value as LogType;
                    setType(next);
                    setValues(defaultLogValues(next));
                  }}
                >
                  {MANUAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <QuickFields
              fields={LOG_FIELDS[type]}
              values={values}
              onChange={setValues}
            />
            <label className="flex flex-col gap-1">
              {timer ? "Bắt đầu" : "Thời điểm"}
              <input
                type="datetime-local"
                className={INPUT}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            {timer && (
              <label className="flex flex-col gap-1">
                Kết thúc
                <input
                  type="datetime-local"
                  className={INPUT}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
                {allowOpenEnd && (
                  <span className="text-sm text-neutral-500">
                    Để trống nếu vẫn đang chạy.
                  </span>
                )}
              </label>
            )}
            <label className="flex flex-col gap-1">
              Ghi chú
              <textarea
                className="min-h-20 rounded-xl border p-3"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {warnings.map((warning) => (
              <p
                key={warning}
                role="status"
                className="rounded-xl bg-amber-50 p-3 text-amber-900"
              >
                {warning}
              </p>
            ))}
            {message && (
              <p role="alert" className="text-red-600">
                {message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 flex-1 rounded-2xl border"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-12 flex-1 rounded-2xl bg-pink-500 text-white disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
            {log && (
              <button
                type="button"
                disabled={busy}
                onClick={confirmDelete}
                className="min-h-12 rounded-2xl text-red-600 disabled:opacity-50"
              >
                Xóa bản ghi
              </button>
            )}
          </>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Tạo `components/history/HistoryScreen.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import { useHistoryLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import { vnDayLabel } from "@/lib/rules/days";
import { describeLog } from "@/lib/rules/describeLog";
import {
  canModifyLog,
  groupByVnDay,
  HISTORY_FILTERS,
  matchesFilter,
  type HistoryFilter,
} from "@/lib/rules/history";
import { formatVnTime } from "@/lib/rules/time";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { LogEditSheet } from "./LogEditSheet";

type SheetState = { log: LogRow | null } | null;

export function HistoryScreen({
  baby,
  member,
}: {
  baby: Baby;
  member: FamilyMember;
}) {
  const now = useNow(30_000);
  useLogsRealtime(baby.id);
  const history = useHistoryLogs(baby.id, baby.dob);
  const members = useMembers(baby.family_id);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sheet, setSheet] = useState<SheetState>(null);

  const rows = history.data?.pages.flat() ?? [];
  const groups = groupByVnDay(rows.filter((row) => matchesFilter(row, filter)));
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-h-11 items-center text-pink-700">
          ← Trang chủ
        </Link>
        <h1 className="text-2xl font-semibold">Nhật ký</h1>
        <button
          type="button"
          onClick={() => setSheet({ log: null })}
          className="min-h-11 rounded-xl bg-pink-500 px-3 text-white"
        >
          + Thêm
        </button>
      </header>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {HISTORY_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`min-h-11 shrink-0 rounded-full px-4 ${filter === f.value ? "bg-pink-500 text-white" : "bg-neutral-100"}`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {history.isError && (
        <p role="alert" className="text-red-600">
          {toVietnameseError(history.error)}
        </p>
      )}
      {history.isPending && <p className="text-neutral-500">Đang tải…</p>}
      {history.isSuccess && groups.length === 0 && (
        <p className="text-neutral-500">Không có bản ghi nào.</p>
      )}

      {groups.map((group) => (
        <section key={group.day} className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{vnDayLabel(group.day, now)}</h2>
          <ul className="divide-y rounded-2xl border">
            {group.logs.map((log) => (
              <li key={log.id}>
                <button
                  type="button"
                  onClick={() => setSheet({ log })}
                  className="flex min-h-11 w-full gap-3 p-3 text-left"
                >
                  <span className="w-12 shrink-0 tabular-nums text-neutral-500">
                    {formatVnTime(new Date(log.started_at))}
                  </span>
                  <span className="flex-1">
                    {describeLog(log, now)}
                    {log.note && (
                      <span className="block text-sm text-neutral-500">
                        {log.note}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {nameOf(log.created_by)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {history.hasNextPage && (
        <button
          type="button"
          disabled={history.isFetchingNextPage}
          onClick={() => void history.fetchNextPage()}
          className="min-h-12 rounded-2xl border disabled:opacity-50"
        >
          {history.isFetchingNextPage ? "Đang tải…" : "Xem thêm 7 ngày trước"}
        </button>
      )}

      {sheet && (
        <LogEditSheet
          babyId={baby.id}
          log={sheet.log}
          canModify={
            sheet.log === null || canModifyLog(member, sheet.log.created_by)
          }
          who={sheet.log ? nameOf(sheet.log.created_by) : ""}
          recentLogs={rows}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 6: Tạo `app/nhat-ky/page.tsx`**

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { HistoryScreen } from "@/components/history/HistoryScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? <HistoryScreen baby={ctx.baby} member={ctx.member} /> : null
      }
    </AuthGate>
  );
}
```

`AuthGate need="baby"` không chuyển hướng khi đã đăng nhập, có gia đình và có bé (`gateRedirect("baby", "/")` trả `null`), nên dùng được cho mọi trang cần bé.

- [ ] **Step 7: Thêm nút "Nhật ký" ở trang chủ**

Trong `components/home/HomeScreen.tsx`, thêm import trước dòng `import { useState } from "react";`:

```tsx
import Link from "next/link";
```

Rồi chèn ngay sau `</header>` (trước `<StatusLines lines={statusLines} />`):

```text
      <nav className="flex gap-3">
        <Link
          href="/nhat-ky"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border"
        >
          Nhật ký
        </Link>
      </nav>
```

(Khối JSX, không có dấu `;`.)

- [ ] **Step 8: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  96 passed (96)`; `next build` thành công, danh sách route gồm `/`, `/_not-found`, `/auth/callback`, `/chua-duoc-moi`, `/dang-nhap`, `/khai-bao-be` và route mới `○ /nhat-ky`.

- [ ] **Step 9: 👤 Kiểm tra tay trên localhost**

Run: `bun run dev`. Mở `http://localhost:3000/` trong Claude in Chrome (tab mới), nhờ người dùng tự đăng nhập Google nếu cần, rồi kiểm tra cùng người dùng:

1. Trang chủ có nút "Nhật ký". Bấm vào → trang "Nhật ký" có nhóm "Hôm nay" (và "Hôm qua" nếu có bản ghi), bản ghi mới nhất ở trên, mỗi dòng có giờ, mô tả và tên người ghi.
2. Bấm chip "Tã" → chỉ còn bản ghi tã. Bấm "Tất cả" → hiện lại đủ.
3. Bấm "+ Thêm" → Loại "Ngủ", Bắt đầu = hôm qua 22:00, Kết thúc = hôm nay 05:30, Ghi chú `thử M5` → Lưu → nhóm "Hôm qua" có dòng 22:00 "Ngủ · 7 giờ 30 phút" và dòng ghi chú "thử M5".
4. Bấm vào dòng đó → đổi Kết thúc thành 04:30 → Lưu → dòng thành "Ngủ · 6 giờ 30 phút". Mở lại, đặt Kết thúc = hôm qua 21:00 → Lưu → hiện "Giờ kết thúc phải sau giờ bắt đầu", không lưu.
5. Bấm "+ Thêm" → Loại "Ngủ", xóa trống ô Kết thúc → Lưu → hiện "Nhập giờ kết thúc".
6. Mở thêm cửa sổ ẩn danh, đăng nhập cùng tài khoản, vào `/nhat-ky`. Ở cửa sổ A bấm dòng "thử M5" → "Xóa bản ghi" → xác nhận → dòng biến mất ở cả hai cửa sổ trong ≤ 3 giây.
7. Cuối trang có nút "Xem thêm 7 ngày trước" (bé hơn 7 ngày tuổi thì không có). Bấm → nút hiện "Đang tải…" rồi các ngày cũ hơn xuất hiện bên dưới (nếu có bản ghi).
8. Về trang chủ, bấm "Bình", lưu 60 ml → quay lại "Nhật ký" thấy dòng "Bình 60 ml sữa mẹ" ở "Hôm nay" (sheet nhập nhanh vẫn chạy sau khi tách `QuickFields`). Xóa dòng thử này.
9. (Chỉ khi gia đình có tài khoản member khác) Đăng nhập bằng member, bấm một bản ghi do người khác tạo → sheet hiện giờ, nội dung, người ghi, ghi chú (nếu có), câu "Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được." và không có nút Lưu/Xóa.

- [ ] **Step 10: Commit và deploy**

```bash
git add -A && git commit -m "feat(history): /nhat-ky timeline with filters, manual entry, edit and delete"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app. Nhờ người dùng mở PWA trên iPhone, vào "Nhật ký", lặp lại bước 3–4 và 6 của Step 9 (bước 6 dùng iPhone và máy tính), rồi xác nhận đạt.

---

## Ngoài phạm vi M5

- M6: `/thong-ke` (tab Ngủ / Bú / Tã, biểu đồ cột 7 hoặc 14 ngày theo ngày VN, chia giấc ngủ vắt qua nửa đêm; thêm `recharts` 3.x), thêm link "Thống kê" vào `<nav>` trang chủ.
- M7: thanh tab dưới §6.18, `/cai-dat` (thành viên, hồ sơ bé, `feed_interval_min`, theme Sáng/Tối/Ban đêm/Theo hệ thống, đăng xuất), `/cai-app` §6.17.
- M8: service worker §8.4, offline outbox §9, push `feed` §8, pg_cron + Vault, tạm tắt thông báo, checklist thiết bị bước 1–4 và 7.
