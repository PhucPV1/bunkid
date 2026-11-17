# Kim Bun — M2 Canh timer trong app Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md` (§5 toàn bộ; bảng `TIMER_LIMIT_MIN` của §4.3; phần tương ứng của §6.1 và §6.3). Bản vẽ đã chọn: A1 (viên timer trên thanh tab), B1 (nhãn "Nên bú" trên nút).

**Status:** approved 2026-11-17

**Goal:** Timer chạy quá ngưỡng hiện banner vàng trên trang chủ; timer đang chạy hiện thành một viên trên thanh tab ở mọi trang trừ Hôm nay, có nút Dừng; nút bú bên ngược với lần trước mang nhãn "Nên bú" ở thẻ hero, hàng nút bấm giờ và bảng "+".

**Architecture:**

- **Luật thuần (`lib/rules/timer.ts`, `hero.ts`, `quickActions.ts`, `lib/nav.ts`):** ngưỡng, timer quá hạn, bên bú kế tiếp, timer của viên, chữ của banner, trang nào có viên. Tất cả test được không cần DOM.
- **Giao diện:** `LongTimerBanner`, `HintBadge`, `TimerPill` là component mới; `HeroCard`, `TimerButtons`, `QuickActionGrid` nhận thêm một prop tuỳ chọn.
- **Dữ liệu:** không query mới. `QuickActionsProvider` đã gọi `useRecentLogs(baby.id)`; nó đưa thêm `runningRows` và `suggestSide` vào context, để viên và bảng "+" dùng chung ở mọi trang.
- **Chỗ cho viên:** một biến CSS `--pill-offset` mà vùng đệm đáy trang và toast cùng cộng vào.
- Không có migration, không đổi luật push. Phần push cho timer là M4.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-canh-timer-m2`, cắt từ `main` @ `c03fa31`. Baseline: 840 test vitest xanh (141 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1a, M1b | Bốn loại bản ghi mới | đã xong, đã lên `main` |
| **M2 (plan này)** | §5 canh timer trong app, `TIMER_LIMIT_MIN` | `2026-11-17-kim-bun-canh-timer-m2.md` |
| M3 | Migration `reminders`, §4.4, giờ yên lặng, `hold_feed_while_asleep` | chưa viết |
| M4 | §4.2 lịch thuốc, nhắc thuốc, nhắc hạ sốt, push timer, checklist §6.4 | chưa viết |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Hai hàm thuần spec không gọi tên.** `pillTimer(logs)` (timer nào hiện trên viên, còn bao nhiêu cái khác) và `showsTimerPill(pathname)` (trang nào có viên) được thêm để luật của viên test được mà không cần DOM.
2. **Viên lấy bản ghi qua context.** Spec viết viên "lấy bản ghi đang chạy từ `useRecentLogs(baby.id)`". `QuickActionsProvider` đã gọi đúng hook đó, nên plan đưa `runningRows` vào context thay vì để `TimerPill` gọi lần thứ hai. Cùng một query, cùng dữ liệu.
3. **Nút "Dừng" của banner và của viên** gọi `actions.stopTimer(log)`: `ended_at` là lúc bấm, có toast Hoàn tác, và với Hút sữa thì có sheet hỏi ml, y như nút Dừng của thẻ hero.
4. **`suggestSide` trong context** tính bằng `nextBreastSide(rows, new Date())` mỗi lần provider vẽ lại (dữ liệu tải lại mỗi 30 giây). Trang chủ tự tính bằng `now` của nó vì cần cả `last` và `lastAt` cho dòng "Lần trước".
5. **Nhãn cho trình đọc màn hình.** Ở hàng nút bấm giờ, `aria-label` của nút được gợi ý là `Bú phải, nên bú`. Ở thẻ hero và bảng "+", chữ "Nên bú" nằm trong nút nên được đọc theo.
6. **Chữ thời gian của banner** dùng `formatDuration` có sẵn, nên đúng một giờ được viết `1 giờ 00 phút`.
7. **Loại không có ngưỡng** (bản ghi tức thời, hoặc loại lạ từ bản mới hơn) không bao giờ bị coi là quá hạn.
8. **Bộ đếm `+n` trên viên** là viên nhỏ nền `bg-ink/10`, không thêm token màu.
9. **Test cho vùng đệm.** `AuthGate` dùng hook nên không vẽ được trong test `node`; test đọc thẳng mã nguồn `components/AuthGate.tsx` và `app/globals.css` (cách `lib/themeGuard.test.ts` đang làm).
10. **Kiểm tay (§6.3).** Người kiểm là phiên chính, bằng trình duyệt có sẵn trong app Claude ở 375×812 (trên máy này Chrome chưa đăng nhập Kim Bun và không thu hẹp dưới 455 px), và cần người dùng đồng ý mỗi lần. Viên và banner chỉ thấy được khi nhà đang có timer thật chạy; không bao giờ bấm "Dừng" của chúng.

## Global Constraints

- Giữ Global Constraints của `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md` (chỉ dùng gói miễn phí, secret không bao giờ nằm ở client, không tính liều thuốc).
- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Giữ prefix khoá localStorage `be-yeu-*`, tên package và URL `bunkid.vercel.app`.
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Không lồng `glass` trong `glass` (hotfix 7822c90). Màn hình không tự cộng `env(safe-area-inset-*)`, vì `body` đã pad sẵn.
- Mọi giờ trong luật tính theo giờ Việt Nam (UTC+7), dùng `vnDateString`, `formatVnTime`, `vnDayStartMs` có sẵn. Không dùng múi giờ của máy.
- Migration chỉ được thêm (thêm bảng, thêm cột có default, nới check constraint). Không xoá hay đổi kiểu cột đang có.
- Migration phải được áp lên Supabase thật **trước** khi bản web mới được deploy. Nếu ngược lại, bản ghi loại mới bị từ chối với mã `23514` và outbox bỏ nó.
- Chạy `bunx supabase db push` lên project thật chỉ khi người dùng đồng ý trong phiên triển khai. Push lên `main` cũng cần người dùng đồng ý từng lần.
- Mọi ghi bản ghi (`logs`) đi qua outbox như hiện tại. Lịch thuốc và cài đặt thông báo cần mạng (bọc `OnlineOnly`), không qua outbox.
- Chữ về sức khoẻ: nhắc hạ sốt không bao giờ nói nên uống tiếp hay không; công tắc "Không nhắc bú khi bé đang ngủ" luôn đi kèm ghi chú ở §4.4.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không được bắt đầu đồng hồ, không được bật tắt công tắc nào ở Cài đặt › Thông báo và Cài đặt › Nhắc thuốc (công tắc ghi thẳng vào DB).
- Test hiện có phải xanh: 803 test vitest, pgTAP 001–011, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Baseline thật.** Dòng "803 test" ở trên chép nguyên từ spec; trên `main` @ `c03fa31` con số hiện tại là 840 test, 141 file, và pgTAP 001–012.
- **Patch.** Mọi thay đổi code nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 8** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell, vì hàm không sống qua lần gọi sau), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-17-kim-bun-canh-timer-m2.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 8 patch đã được áp lần lượt lên một bản sao của `main` @ `c03fa31` ở ngoài repo: sau mỗi task `tsc --noEmit` sạch và số test đúng như ghi ở task đó; số test đỏ ở mỗi task cũng là số đo được. Chưa chạy trong lúc viết plan: `bun run build`, kiểm trên trình duyệt. Hai việc đó thuộc Task 5.
- **Formatter.** Code trong patch đã đúng định dạng prettier. Nếu sửa tay bằng công cụ Edit, hook prettier có thể xuống dòng lại vài dòng không liên quan. Việc đó bình thường, cứ commit kèm.
- **Next.js.** Chỉ Task 4 dùng API của Next (`usePathname`, `next/link`); trang cần đọc trước được ghi ngay trong task đó.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` chạy trong `bunx vitest run` và phải xanh.
- **Supabase.** Plan này không có migration và không chạy lệnh nào chạm project thật. `bun run dev` chỉ chạy ở Task 5 Step 3.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là bình thường; không chạy lệnh `next upgrade` mà nó gợi ý.
- **Git.** Mọi commit nằm trên nhánh, ở máy. Plan này không push nhánh, không merge, không push `main`.

## Contracts with Other Plans

Plan này đứng sau M1a và M1b (đã ở trên `main`) và trước M3, M4 (chưa viết).

**Consumes (từ `main` @ `c03fa31`):**

- **`lib/rules/quickActions.ts` (M1a):** `QuickAction` có `group: "timer" | "quick" | "other"`; `QUICK_ACTIONS` 13 mục, 5 mục đầu là timer theo thứ tự Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp; `actionLabel`, `isActionRunning`.
- **`components/actions/ActionSheet.tsx` (M1a):** `QuickActionGrid` vẽ 3 nhóm, lưới 4 cột, ô cao 84 px; `ActionSheetView`.
- **`lib/ui/categories.ts`:** `categoryOf(type: string)`, `CATEGORY_CHIP`, `CATEGORIES`.
- **`lib/rules/hero.ts`:** `timerLabel`, `formatClock`, `HeroState`; **`lib/rules/time.ts`:** `formatDuration`, `formatVnTime`.
- **`lib/rules/ratings.ts`:** `FORGOTTEN_BREAST_MS` (3 600 000).
- **`components/actions/QuickActions.tsx`:** `QuickActionsProvider`, `useQuickActions()` với `running`, `busy`, `pressTimer`, `stopTimer`.
- **`components/ui/Toast.tsx`:** `ToastView` ở `bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px)]`; **`components/AuthGate.tsx`:** hai chỗ `pb-[120px]`; **`components/nav/TabBar.tsx`:** thanh tab cao 62 px ở `bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)]`.

**Produces** (M3, M4 được dựa vào đúng những tên này):

- **`lib/rules/timer.ts`:** `TIMER_LIMIT_MIN`, `overdueTimers`, `BreastSide`, `NextSide`, `nextBreastSide`, `pillTimer` (chữ ký ở Task 1). M4 dùng `TIMER_LIMIT_MIN` cho luật push timer.
- **`lib/rules/ratings.ts`:** `FORGOTTEN_BREAST_MS = TIMER_LIMIT_MIN.breast * 60_000`.
- **`lib/rules/hero.ts`:** `longTimerText`. **`lib/rules/quickActions.ts`:** `NEXT_SIDE_LABEL`, `isSuggestedSide`. **`lib/nav.ts`:** `showsTimerPill`.
- **Component:** `LongTimerBanner`, `HintBadge`, `TimerPillView`, `TimerPill`.
- **`QuickActionsValue`:** thêm `runningRows: LogRow[]` và `suggestSide: BreastSide | null`.
- **CSS:** `--pill-offset`; thuộc tính `data-timer-pill="on"` trên `<html>` khi viên hiện.
- **Nhánh:** `feat/kim-bun-canh-timer-m2` với 4 commit code và 1 commit ghi kết quả.
- **Vitest sau M2:** 866 test, 143 file.

---

### Task 1: Luật timer: ngưỡng, timer quá hạn, bên bú kế tiếp, timer của viên

**Files:**

- Modify: `lib/rules/timer.ts` (thêm vào cuối file), `lib/rules/ratings.ts` (`FORGOTTEN_BREAST_MS` lấy từ ngưỡng `breast`)
- Test: `lib/rules/timer.test.ts`

**Interfaces:**

- Consumes: `LogType` (`lib/rules/logDetails.ts`), `FORGOTTEN_BREAST_MS` hiện là `60 * 60_000` (`lib/rules/ratings.ts`).
- Produces (đều từ `lib/rules/timer.ts`):
  - `TIMER_LIMIT_MIN = { breast: 60, pump: 60, tummy: 30, sleep: 840 } as const`.
  - `overdueTimers<T extends { type: string; started_at: string; ended_at: string | null; details: unknown }>(logs: T[], now: Date): T[]`: bản ghi đang chạy đã tới hoặc quá ngưỡng, cũ nhất trước.
  - `type BreastSide = "left" | "right"`; `type NextSide = { suggest: BreastSide; last: BreastSide; lastAt: string }`.
  - `nextBreastSide(logs, now: Date): NextSide | null`.
  - `pillTimer<T>(logs: T[]): { log: T; more: number } | null`: timer đang chạy bắt đầu gần nhất và số timer còn lại.
  - `FORGOTTEN_BREAST_MS` (`lib/rules/ratings.ts`) giữ nguyên giá trị 3 600 000, nay tính từ `TIMER_LIMIT_MIN.breast`.

`lib/rules/timer.ts` chỉ import kiểu `LogType`, nên `ratings.ts` import nó không tạo vòng import.

- [x] **Step 0: Tạo nhánh và đo baseline**

Run: `git checkout main && git status --short && git checkout -b feat/kim-bun-canh-timer-m2 && bun run typecheck && bunx vitest run`
Expected: `git status --short` không in gì; `tsc --noEmit` không báo lỗi; `Test Files  141 passed (141)`, `Tests  840 passed (840)`. Nếu khác, dừng và báo lại, không làm tiếp.

- [x] **Step 1: Viết test hỏng (Patch 1)**

Run: `kb_patch 1 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/lib/rules/timer.test.ts b/lib/rules/timer.test.ts
index 02f1097..a254288 100644
--- a/lib/rules/timer.test.ts
+++ b/lib/rules/timer.test.ts
@@ -1,5 +1,12 @@
 import { describe, expect, it } from "vitest";
-import { planTimerPress, type RunningLog } from "@/lib/rules/timer";
+import {
+  nextBreastSide,
+  overdueTimers,
+  pillTimer,
+  planTimerPress,
+  TIMER_LIMIT_MIN,
+  type RunningLog,
+} from "@/lib/rules/timer";
 
 const breastLeft: RunningLog = {
   id: "b1",
@@ -39,3 +46,110 @@ describe("planTimerPress", () => {
     ]);
   });
 });
+
+const NOW = new Date("2026-11-17T05:00:00Z"); // 12:00 giờ VN
+const minutesAgo = (m: number) =>
+  new Date(NOW.getTime() - m * 60_000).toISOString();
+const timed = (
+  id: string,
+  type: string,
+  startMin: number,
+  endMin: number | null,
+  details: unknown = {},
+) => ({
+  id,
+  type,
+  started_at: minutesAgo(startMin),
+  ended_at: endMin === null ? null : minutesAgo(endMin),
+  details,
+});
+
+describe("TIMER_LIMIT_MIN", () => {
+  it("is 60 for breast and pump, 30 for tummy, 14 hours for sleep", () => {
+    expect(TIMER_LIMIT_MIN).toEqual({
+      breast: 60,
+      pump: 60,
+      tummy: 30,
+      sleep: 840,
+    });
+  });
+});
+
+describe("overdueTimers", () => {
+  it("keeps running timers at or past their limit, oldest first", () => {
+    const logs = [
+      timed("t", "tummy", 30, null),
+      timed("b", "breast", 59, null, { side: "left" }),
+      timed("p", "pump", 61, null),
+      timed("s", "sleep", 840, null),
+    ];
+    expect(overdueTimers(logs, NOW).map((l) => l.id)).toEqual(["s", "p", "t"]);
+  });
+
+  it("ignores finished logs, instant logs and types without a limit", () => {
+    const logs = [
+      timed("done", "sleep", 900, 10),
+      timed("bottle", "bottle", 500, 500),
+      timed("odd", "bath", 500, null),
+    ];
+    expect(overdueTimers(logs, NOW)).toEqual([]);
+  });
+});
+
+describe("nextBreastSide", () => {
+  it("suggests the side opposite to the latest finished breast log", () => {
+    const logs = [
+      timed("a", "breast", 300, 290, { side: "right" }),
+      timed("b", "breast", 120, 105, { side: "left" }),
+      timed("c", "bottle", 60, 60, { ml: 90, milk: "formula" }),
+    ];
+    expect(nextBreastSide(logs, NOW)).toEqual({
+      suggest: "right",
+      last: "left",
+      lastAt: minutesAgo(120),
+    });
+  });
+
+  it("says nothing without a breast log in the last 24 hours", () => {
+    expect(nextBreastSide([], NOW)).toBeNull();
+    expect(
+      nextBreastSide(
+        [timed("old", "breast", 24 * 60 + 1, 24 * 60, { side: "left" })],
+        NOW,
+      ),
+    ).toBeNull();
+  });
+
+  it("says nothing while a breast timer is running", () => {
+    const logs = [
+      timed("b", "breast", 120, 105, { side: "left" }),
+      timed("run", "breast", 5, null, { side: "right" }),
+    ];
+    expect(nextBreastSide(logs, NOW)).toBeNull();
+  });
+
+  it("skips a breast log whose side cannot be read", () => {
+    const logs = [
+      timed("bad", "breast", 30, 20, {}),
+      timed("ok", "breast", 200, 190, { side: "right" }),
+    ];
+    expect(nextBreastSide(logs, NOW)?.suggest).toBe("left");
+  });
+});
+
+describe("pillTimer", () => {
+  it("shows the timer started last and counts the others", () => {
+    const logs = [
+      timed("s", "sleep", 90, null),
+      timed("b", "breast", 12, null, { side: "left" }),
+      timed("done", "tummy", 40, 35),
+    ];
+    const pill = pillTimer(logs);
+    expect(pill?.log.id).toBe("b");
+    expect(pill?.more).toBe(1);
+  });
+
+  it("is null when nothing is running", () => {
+    expect(pillTimer([timed("done", "sleep", 90, 10)])).toBeNull();
+  });
+});
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run lib/rules/timer.test.ts`
Expected: `Tests  9 failed | 4 passed (13)`; lỗi đầu tiên là `overdueTimers is not a function` hoặc `expected undefined to deeply equal`.

- [x] **Step 3: Viết code (Patch 2)**

Run: `kb_patch 2 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/lib/rules/ratings.ts b/lib/rules/ratings.ts
index aec4eae..c2848d3 100644
--- a/lib/rules/ratings.ts
+++ b/lib/rules/ratings.ts
@@ -1,5 +1,6 @@
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
+import { TIMER_LIMIT_MIN } from "./timer";
 
 export type Rating = "green" | "yellow" | "red";
 export type MetricResult =
@@ -17,7 +18,7 @@ export const WINDOW_MS = 24 * HOUR_MS;
 const SAME_FEED_GAP_MS = 30 * 60_000;
 // A breast timer still running after this long is taken as forgotten: it no
 // longer merges later feeds into itself or holds back the feed reminder.
-export const FORGOTTEN_BREAST_MS = 60 * 60_000;
+export const FORGOTTEN_BREAST_MS = TIMER_LIMIT_MIN.breast * 60_000;
 
 const ms = (iso: string) => Date.parse(iso);
 const endMs = (log: LogLike, now: Date) =>
diff --git a/lib/rules/timer.ts b/lib/rules/timer.ts
index fb5a0e7..bdaab42 100644
--- a/lib/rules/timer.ts
+++ b/lib/rules/timer.ts
@@ -31,3 +31,88 @@ export function planTimerPress(
   }
   return [{ kind: "stop", id: current.id }];
 }
+
+// Spec 2026-11-17 §4.3: minutes after which a running timer counts as forgotten.
+export const TIMER_LIMIT_MIN = {
+  breast: 60,
+  pump: 60,
+  tummy: 30,
+  sleep: 840,
+} as const;
+
+type TimedLog = {
+  type: string;
+  started_at: string;
+  ended_at: string | null;
+  details: unknown;
+};
+
+const startMs = (log: TimedLog) => Date.parse(log.started_at);
+
+function limitMs(type: string): number | null {
+  return Object.hasOwn(TIMER_LIMIT_MIN, type)
+    ? TIMER_LIMIT_MIN[type as keyof typeof TIMER_LIMIT_MIN] * 60_000
+    : null;
+}
+
+// Spec §5.1: running timers at or past their limit, oldest first.
+export function overdueTimers<T extends TimedLog>(logs: T[], now: Date): T[] {
+  return logs
+    .filter((log) => {
+      const limit = limitMs(log.type);
+      return (
+        log.ended_at === null &&
+        limit !== null &&
+        now.getTime() - startMs(log) >= limit
+      );
+    })
+    .sort((a, b) => startMs(a) - startMs(b));
+}
+
+export type BreastSide = "left" | "right";
+export type NextSide = {
+  suggest: BreastSide;
+  last: BreastSide;
+  lastAt: string;
+};
+
+const DAY_MS = 24 * 3_600_000;
+
+function sideOf(log: TimedLog): BreastSide | null {
+  const side = (log.details as { side?: unknown } | null)?.side;
+  return side === "left" || side === "right" ? side : null;
+}
+
+// Spec §5.3: the side opposite to the latest finished breast log of the last
+// 24 hours. Nothing while a breast timer runs: the hero card offers "Đổi bên".
+export function nextBreastSide(logs: TimedLog[], now: Date): NextSide | null {
+  const breast = logs.filter((log) => log.type === "breast");
+  if (breast.some((log) => log.ended_at === null)) return null;
+  const from = now.getTime() - DAY_MS;
+  let latest: { at: number; side: BreastSide; log: TimedLog } | null = null;
+  for (const log of breast) {
+    const at = startMs(log);
+    const side = sideOf(log);
+    if (side === null || at < from || at > now.getTime()) continue;
+    if (!latest || at > latest.at) latest = { at, side, log };
+  }
+  if (!latest) return null;
+  return {
+    suggest: latest.side === "left" ? "right" : "left",
+    last: latest.side,
+    lastAt: latest.log.started_at,
+  };
+}
+
+// Spec §5.2: the pill shows the running timer that started last, plus how
+// many others are running.
+export function pillTimer<T extends TimedLog>(
+  logs: T[],
+): { log: T; more: number } | null {
+  const running = logs
+    .filter((log) => log.ended_at === null)
+    .sort((a, b) => startMs(b) - startMs(a));
+  return running.length > 0
+    ? { log: running[0], more: running.length - 1 }
+    : null;
+}
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  141 passed (141)`, `Tests  849 passed (849)`.

- [x] **Step 5: Commit**

```bash
git add lib/rules/timer.test.ts lib/rules/ratings.ts lib/rules/timer.ts
git commit -m "feat(timer): limits, overdue timers, next breast side and pill timer rules" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 2: Banner timer chạy quá lâu trên trang chủ (§5.1)

**Files:**

- Create: `components/home/LongTimerBanner.tsx`
- Modify: `lib/rules/hero.ts` (thêm `longTimerText`), `components/home/HomeScreen.tsx` (vẽ banner ngay dưới `AlertBanners`)
- Test: `lib/rules/hero.test.ts`, `components/home/longtimer.test.tsx` (mới)

**Interfaces:**

- Consumes: `overdueTimers` (Task 1); `timerLabel` (`lib/rules/hero.ts`); `formatDuration` (`lib/rules/time.ts`, ví dụ `32 phút`, `1 giờ 00 phút`); `actions.stopTimer(log)` và `actions.busy` của `useQuickActions()`; `Icon`; token `warn-soft`, `warn-ink`, `warn`.
- Produces:
  - `longTimerText(log: { type: string; started_at: string; details: unknown }, now: Date): string` (`lib/rules/hero.ts`), dạng `<nhãn> đã chạy <thời gian>. Còn đang <bú|ngủ|hút sữa|nằm sấp> không?`.
  - `LongTimerBanner({ log: LogRow, now: Date, busy: boolean, onStop: () => void })`.

Nút "Dừng" gọi `actions.stopTimer(log)`, cùng đường với nút Dừng của thẻ hero: có toast Hoàn tác, và với Hút sữa thì có sheet hỏi ml.

- [x] **Step 1: Viết test hỏng (Patch 3)**

Run: `kb_patch 3 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/components/home/longtimer.test.tsx b/components/home/longtimer.test.tsx
new file mode 100644
index 0000000..3ee02cc
--- /dev/null
+++ b/components/home/longtimer.test.tsx
@@ -0,0 +1,49 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import type { LogRow } from "@/lib/supabase/rows";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { LongTimerBanner } from "./LongTimerBanner";
+
+const NOW = new Date("2026-11-17T05:00:00Z");
+const tummy: LogRow = {
+  id: "t1",
+  baby_id: "b1",
+  type: "tummy",
+  started_at: "2026-11-17T04:28:00Z",
+  ended_at: null,
+  details: {},
+  note: null,
+  created_by: "u1",
+  created_at: "2026-11-17T04:28:00Z",
+  updated_at: "2026-11-17T04:28:00Z",
+};
+
+describe("LongTimerBanner", () => {
+  it("is a yellow status row with a clock, the question and a Dừng button", () => {
+    const html = renderToStaticMarkup(
+      <LongTimerBanner log={tummy} now={NOW} busy={false} onStop={() => {}} />,
+    );
+    expect(html).toContain('role="status"');
+    expect(html).toContain("bg-warn-soft");
+    expect(html).toContain("text-warn-ink");
+    expect(html).toContain(`d="${ICON_PATHS.clock}"`);
+    expect(html).toContain("Nằm sấp đã chạy 32 phút. Còn đang nằm sấp không?");
+    expect(html).toContain("min-h-11");
+    expect(html).toContain(">Dừng</button>");
+  });
+
+  it("Dừng calls onStop and is disabled while busy", () => {
+    const onStop = vi.fn();
+    const [button] = findElements(
+      LongTimerBanner({ log: tummy, now: NOW, busy: false, onStop }),
+      (el) => el.type === "button",
+    );
+    (button.props.onClick as () => void)();
+    expect(onStop).toHaveBeenCalledTimes(1);
+    const html = renderToStaticMarkup(
+      <LongTimerBanner log={tummy} now={NOW} busy onStop={onStop} />,
+    );
+    expect(html).toContain("disabled");
+  });
+});
diff --git a/lib/rules/hero.test.ts b/lib/rules/hero.test.ts
index 8eddb33..d8f796c 100644
--- a/lib/rules/hero.test.ts
+++ b/lib/rules/hero.test.ts
@@ -4,6 +4,7 @@ import {
   formatClock,
   formatMinutes,
   heroState,
+  longTimerText,
   ringProgress,
   timerLabel,
 } from "./hero";
@@ -114,4 +115,19 @@ describe("hero text helpers", () => {
     expect(ringProgress(75 * 60_000)).toBe(0.25);
     expect(ringProgress(-1_000)).toBe(0);
   });
+
+  it("longTimerText says how long a timer has run and asks if it still is", () => {
+    expect(longTimerText(log("tummy", 32 / 60, null), NOW)).toBe(
+      "Nằm sấp đã chạy 32 phút. Còn đang nằm sấp không?",
+    );
+    expect(
+      longTimerText(log("breast", 1.25, null, { side: "left" }), NOW),
+    ).toBe("Bú trái đã chạy 1 giờ 15 phút. Còn đang bú không?");
+    expect(longTimerText(log("sleep", 14.5, null), NOW)).toBe(
+      "Ngủ đã chạy 14 giờ 30 phút. Còn đang ngủ không?",
+    );
+    expect(longTimerText(log("pump", 1, null), NOW)).toBe(
+      "Hút sữa đã chạy 1 giờ 00 phút. Còn đang hút sữa không?",
+    );
+  });
 });
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run lib/rules/hero.test.ts components/home/longtimer.test.tsx`
Expected: `Test Files  2 failed (2)`, `Tests  1 failed | 10 passed (11)`; có lỗi `Cannot find module './LongTimerBanner'` và `longTimerText is not a function`.

- [x] **Step 3: Viết code (Patch 4)**

Run: `kb_patch 4 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index ec36bbc..84dfb3a 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -18,11 +18,13 @@ import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
 import { sleepStatusLine } from "@/lib/rules/status";
 import { homeStatTiles, totalsLine } from "@/lib/rules/summaryText";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
+import { overdueTimers } from "@/lib/rules/timer";
 import type { Baby } from "@/lib/supabase/rows";
 import { AlertBanners } from "./AlertBanners";
 import { HeroCardView } from "./HeroCard";
 import { HomeHeader } from "./HomeHeader";
 import { HomeSkeleton } from "./HomeSkeleton";
+import { LongTimerBanner } from "./LongTimerBanner";
 import { QuickLogGrid } from "./QuickLogGrid";
 import { RecentCard } from "./RecentCard";
 import { StatsSection } from "./StatsSection";
@@ -92,6 +94,16 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
         <>
           <AlertBanners alerts={alerts} />
 
+          {overdueTimers(rows, now).map((log) => (
+            <LongTimerBanner
+              key={log.id}
+              log={log}
+              now={now}
+              busy={actions.busy}
+              onStop={() => actions.stopTimer(log)}
+            />
+          ))}
+
           {failed ? (
             <ErrorCard
               message={toVietnameseError(logs.error)}
diff --git a/components/home/LongTimerBanner.tsx b/components/home/LongTimerBanner.tsx
new file mode 100644
index 0000000..935e613
--- /dev/null
+++ b/components/home/LongTimerBanner.tsx
@@ -0,0 +1,36 @@
+import { Icon } from "@/components/ui/Icon";
+import { longTimerText } from "@/lib/rules/hero";
+import type { LogRow } from "@/lib/supabase/rows";
+
+// Spec 2026-11-17 §5.1: one yellow row for each timer that ran past its limit.
+export function LongTimerBanner({
+  log,
+  now,
+  busy,
+  onStop,
+}: {
+  log: LogRow;
+  now: Date;
+  busy: boolean;
+  onStop: () => void;
+}) {
+  return (
+    <div
+      role="status"
+      className="flex items-center gap-2.5 rounded-[20px] bg-warn-soft py-2.5 pr-2.5 pl-3.5 text-warn-ink"
+    >
+      <Icon name="clock" className="shrink-0" />
+      <p className="min-w-0 flex-1 text-[15px] leading-5 font-medium">
+        {longTimerText(log, now)}
+      </p>
+      <button
+        type="button"
+        disabled={busy}
+        onClick={onStop}
+        className="min-h-11 shrink-0 rounded-full border border-warn px-4 text-[15px] font-semibold transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50"
+      >
+        Dừng
+      </button>
+    </div>
+  );
+}
diff --git a/lib/rules/hero.ts b/lib/rules/hero.ts
index 6109853..ea814ea 100644
--- a/lib/rules/hero.ts
+++ b/lib/rules/hero.ts
@@ -1,5 +1,6 @@
 import type { LogLike } from "./describeLog";
 import { feedDue } from "./status";
+import { formatDuration } from "./time";
 
 export type HeroState<T extends LogLike> =
   | { kind: "running"; log: T }
@@ -47,6 +48,22 @@ export function timerLabel(log: { type: string; details: unknown }): string {
   return TIMER_LABEL[log.type] ?? "Đang chạy";
 }
 
+const STILL: Record<string, string> = {
+  breast: "bú",
+  sleep: "ngủ",
+  pump: "hút sữa",
+  tummy: "nằm sấp",
+};
+
+// Spec 2026-11-17 §5.1: the sentence on the banner of a timer left running.
+export function longTimerText(
+  log: { type: string; started_at: string; details: unknown },
+  now: Date,
+): string {
+  const ran = formatDuration(now.getTime() - Date.parse(log.started_at));
+  return `${timerLabel(log)} đã chạy ${ran}. Còn đang ${STILL[log.type] ?? "chạy"} không?`;
+}
+
 export function formatClock(ms: number): string {
   const total = Math.max(0, Math.floor(ms / 1000));
   const hours = Math.floor(total / 3600);
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  142 passed (142)`, `Tests  852 passed (852)`.

- [x] **Step 5: Commit**

```bash
git add components/home/longtimer.test.tsx lib/rules/hero.test.ts components/home/HomeScreen.tsx components/home/LongTimerBanner.tsx lib/rules/hero.ts
git commit -m "feat(home): banner for a timer left running past its limit" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 3: Nhãn "Nên bú" ở thẻ hero, hàng nút bấm giờ và bảng "+" (§5.3, bản vẽ B1)

**Files:**

- Create: `components/ui/HintBadge.tsx`
- Modify: `lib/rules/quickActions.ts` (`NEXT_SIDE_LABEL`, `isSuggestedSide`), `components/home/HeroCard.tsx`, `components/home/TimerButtons.tsx`, `components/actions/ActionSheet.tsx`, `components/actions/QuickActions.tsx` (`suggestSide` trong context), `components/home/HomeScreen.tsx`
- Test: `lib/rules/quickActions.test.ts`, `components/home/herocard.test.tsx`, `components/home/buttons.test.tsx`, `components/actions/actionsheet.test.tsx`

**Interfaces:**

- Consumes: `nextBreastSide`, `NextSide`, `BreastSide` (Task 1); `QUICK_ACTIONS` 13 mục có `group`, `QuickActionGrid` chia 3 nhóm (M1a); `Button`; token `accent`, `on-accent`.
- Produces:
  - `NEXT_SIDE_LABEL = "Nên bú"`; `isSuggestedSide(action: QuickAction, side: BreastSide | null): boolean` (`lib/rules/quickActions.ts`).
  - `HintBadge({ children, className? })` (`components/ui/HintBadge.tsx`): viên nhỏ `absolute`, nền `accent`, chữ `on-accent` 11 px đậm; phần tử cha phải có `relative`.
  - `HeroCardView` nhận thêm `nextSide?: NextSide | null` (mặc định `null`); `TimerButtons` và `QuickActionGrid` / `ActionSheetView` nhận thêm `suggestSide?: BreastSide | null` (mặc định `null`).
  - `QuickActionsValue.suggestSide: BreastSide | null`.

Khi không có gợi ý, con của nút "Bú trái" / "Bú phải" trong thẻ hero vẫn là đúng một chuỗi, nên các test cũ tìm nút theo chữ không phải sửa. Cả hai nút luôn bấm được.

- [x] **Step 1: Viết test hỏng (Patch 5)**

Run: `kb_patch 5 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/components/actions/actionsheet.test.tsx b/components/actions/actionsheet.test.tsx
index e26dd1d..2c22c40 100644
--- a/components/actions/actionsheet.test.tsx
+++ b/components/actions/actionsheet.test.tsx
@@ -87,3 +87,22 @@ describe("ActionSheetView", () => {
     expect(html).toContain(">Bấm giờ</h3>");
   });
 });
+
+describe("QuickActionGrid next-side hint (spec 2026-11-17 §5.3)", () => {
+  it("puts Nên bú on the suggested breast tile", () => {
+    const html = renderToStaticMarkup(
+      <QuickActionGrid running={[]} onPick={() => {}} suggestSide="left" />,
+    );
+    expect(html.match(/Nên bú/g)).toHaveLength(1);
+    const first = html.split("<section")[1];
+    expect(first).toMatch(/Nên bú<\/span>.*Bú trái/s);
+    expect(html.match(/<button/g)).toHaveLength(13);
+  });
+
+  it("shows no label without a hint", () => {
+    const html = renderToStaticMarkup(
+      <QuickActionGrid running={[]} onPick={() => {}} />,
+    );
+    expect(html).not.toContain("Nên bú");
+  });
+});
diff --git a/components/home/buttons.test.tsx b/components/home/buttons.test.tsx
index 14e03c2..1eac509 100644
--- a/components/home/buttons.test.tsx
+++ b/components/home/buttons.test.tsx
@@ -51,6 +51,30 @@ describe("TimerButtons", () => {
   });
 });
 
+describe("TimerButtons next-side hint (spec 2026-11-17 §5.3)", () => {
+  it("puts Nên bú on the suggested side only", () => {
+    const html = renderToStaticMarkup(
+      <TimerButtons
+        running={[]}
+        busy={false}
+        onTimer={() => {}}
+        suggestSide="right"
+      />,
+    );
+    expect(html.match(/Nên bú/g)).toHaveLength(1);
+    expect(html).toContain('aria-label="Bú phải, nên bú"');
+    expect(html).toContain('aria-label="Bú trái"');
+    expect(html.match(/<button/g)).toHaveLength(5);
+  });
+
+  it("shows no label without a hint", () => {
+    const html = renderToStaticMarkup(
+      <TimerButtons running={[]} busy={false} onTimer={() => {}} />,
+    );
+    expect(html).not.toContain("Nên bú");
+  });
+});
+
 describe("QuickLogGrid", () => {
   it("is a 2×2 grid of glass pills with a coloured chip, in spec order", () => {
     const onInstant = vi.fn();
diff --git a/components/home/herocard.test.tsx b/components/home/herocard.test.tsx
index 063b94c..3e53319 100644
--- a/components/home/herocard.test.tsx
+++ b/components/home/herocard.test.tsx
@@ -149,3 +149,56 @@ describe("PendingMark", () => {
     expect(renderToStaticMarkup(<PendingMark pending={false} />)).toBe("");
   });
 });
+
+describe("HeroCardView next-side hint (spec 2026-11-17 §5.3)", () => {
+  const nextSide = {
+    suggest: "right" as const,
+    last: "left" as const,
+    lastAt: "2026-11-14T03:05:00.000Z", // 10:05 giờ VN
+  };
+  const overdue: HeroState<LogRow> = {
+    kind: "overdue",
+    due: new Date("2026-11-14T04:48:00Z"),
+    lateMinutes: 12,
+  };
+
+  it("labels the suggested button and says which side was last", () => {
+    const out = html(props(overdue, { nextSide }));
+    expect(out.match(/Nên bú/g)).toHaveLength(1);
+    expect(out).toMatch(/Bú phải<span[^>]*bg-accent[^>]*>Nên bú<\/span>/);
+    expect(out).toContain("Lần trước: trái lúc 10:05");
+    const empty = html(props({ kind: "empty" }, { nextSide }));
+    expect(empty).toMatch(/Bú phải<span[^>]*>Nên bú<\/span>/);
+  });
+
+  it("keeps both buttons pressable", () => {
+    const onTimer = vi.fn();
+    const buttons = findElements(
+      HeroCardView(props(overdue, { nextSide, onTimer })),
+      (el) => typeof el.props.onClick === "function",
+    );
+    expect(buttons).toHaveLength(2);
+    buttons.forEach((b) => (b.props.onClick as () => void)());
+    expect(onTimer.mock.calls).toEqual([
+      [{ type: "breast", side: "left" }],
+      [{ type: "breast", side: "right" }],
+    ]);
+  });
+
+  it("shows nothing without a hint, and nothing in the next state", () => {
+    expect(html(props(overdue))).not.toContain("Nên bú");
+    expect(html(props(overdue))).not.toContain("Lần trước");
+    const next = html(
+      props(
+        {
+          kind: "next",
+          due: new Date("2026-11-14T06:00:00Z"),
+          minutesLeft: 60,
+        },
+        { nextSide },
+      ),
+    );
+    expect(next).not.toContain("Nên bú");
+    expect(next).not.toContain("Lần trước");
+  });
+});
diff --git a/lib/rules/quickActions.test.ts b/lib/rules/quickActions.test.ts
index 8906843..806fb78 100644
--- a/lib/rules/quickActions.test.ts
+++ b/lib/rules/quickActions.test.ts
@@ -2,6 +2,8 @@ import { describe, expect, it } from "vitest";
 import {
   actionLabel,
   isActionRunning,
+  isSuggestedSide,
+  NEXT_SIDE_LABEL,
   QUICK_ACTION_GROUPS,
   QUICK_ACTIONS,
   shouldAskPumpAmounts,
@@ -127,3 +129,18 @@ describe("shouldAskPumpAmounts", () => {
     ).toBe(false);
   });
 });
+
+describe("next-side hint (spec 2026-11-17 §5.3)", () => {
+  it("marks only the breast action of the suggested side", () => {
+    expect(NEXT_SIDE_LABEL).toBe("Nên bú");
+    expect(
+      QUICK_ACTIONS.filter((a) => isSuggestedSide(a, "right")).map(
+        (a) => a.key,
+      ),
+    ).toEqual(["breast-right"]);
+    expect(
+      QUICK_ACTIONS.filter((a) => isSuggestedSide(a, "left")).map((a) => a.key),
+    ).toEqual(["breast-left"]);
+    expect(QUICK_ACTIONS.some((a) => isSuggestedSide(a, null))).toBe(false);
+  });
+});
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run lib/rules/quickActions.test.ts components/home/herocard.test.tsx components/home/buttons.test.tsx components/actions/actionsheet.test.tsx`
Expected: `Test Files  4 failed (4)`, `Tests  4 failed | 29 passed (33)`.

- [x] **Step 3: Viết code (Patch 6)**

Run: `kb_patch 6 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/components/actions/ActionSheet.tsx b/components/actions/ActionSheet.tsx
index 88d4b0b..9a005e2 100644
--- a/components/actions/ActionSheet.tsx
+++ b/components/actions/ActionSheet.tsx
@@ -1,15 +1,18 @@
 "use client";
 
+import { HintBadge } from "@/components/ui/HintBadge";
 import { Icon } from "@/components/ui/Icon";
 import { Sheet } from "@/components/ui/Sheet";
 import {
   actionLabel,
   isActionRunning,
+  isSuggestedSide,
+  NEXT_SIDE_LABEL,
   QUICK_ACTION_GROUPS,
   QUICK_ACTIONS,
   type QuickAction,
 } from "@/lib/rules/quickActions";
-import type { RunningLog } from "@/lib/rules/timer";
+import type { BreastSide, RunningLog } from "@/lib/rules/timer";
 import { CATEGORIES, type CategoryToken } from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 import { useQuickActions } from "./QuickActions";
@@ -29,9 +32,12 @@ const TINT: Record<CategoryToken, string> = {
 export function QuickActionGrid({
   running,
   onPick,
+  suggestSide = null,
 }: {
   running: RunningLog[];
   onPick: (action: QuickAction) => void;
+  // Spec 2026-11-17 §5.3: the breast side to label "Nên bú"; null shows no label.
+  suggestSide?: BreastSide | null;
 }) {
   return (
     <div className="flex flex-col gap-4">
@@ -51,10 +57,15 @@ export function QuickActionGrid({
                     type="button"
                     onClick={() => onPick(action)}
                     className={cx(
-                      "flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-[20px] bg-glass-solid/75 px-1 text-ink transition-transform duration-[120ms] active:scale-[0.97]",
+                      "relative flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-[20px] bg-glass-solid/75 px-1 text-ink transition-transform duration-[120ms] active:scale-[0.97]",
                       on ? "border-2 border-accent-text" : "border border-edge",
                     )}
                   >
+                    {isSuggestedSide(action, suggestSide) && (
+                      <HintBadge className="-top-1.5 -right-1">
+                        {NEXT_SIDE_LABEL}
+                      </HintBadge>
+                    )}
                     <span
                       className={cx(
                         "flex size-[38px] shrink-0 items-center justify-center rounded-full",
@@ -83,12 +94,14 @@ export function ActionSheetView({
   babyName,
   running,
   onPick,
+  suggestSide = null,
 }: {
   open: boolean;
   onClose: () => void;
   babyName: string;
   running: RunningLog[];
   onPick: (action: QuickAction) => void;
+  suggestSide?: BreastSide | null;
 }) {
   return (
     <Sheet
@@ -97,7 +110,11 @@ export function ActionSheetView({
       title={`Ghi lại cho ${babyName}`}
       variant="floating"
     >
-      <QuickActionGrid running={running} onPick={onPick} />
+      <QuickActionGrid
+        running={running}
+        onPick={onPick}
+        suggestSide={suggestSide}
+      />
     </Sheet>
   );
 }
@@ -118,6 +135,7 @@ export function ActionSheet({
       onClose={onClose}
       babyName={babyName}
       running={actions.running}
+      suggestSide={actions.suggestSide}
       onPick={(action) => {
         onClose();
         if (action.kind === "timer") actions.pressTimer(action.button);
diff --git a/components/actions/QuickActions.tsx b/components/actions/QuickActions.tsx
index df087e5..a37e9e4 100644
--- a/components/actions/QuickActions.tsx
+++ b/components/actions/QuickActions.tsx
@@ -23,7 +23,12 @@ import {
 import type { LogType } from "@/lib/rules/logDetails";
 import { shouldAskPumpAmounts } from "@/lib/rules/quickActions";
 import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
-import type { RunningLog, TimerButton } from "@/lib/rules/timer";
+import {
+  nextBreastSide,
+  type BreastSide,
+  type RunningLog,
+  type TimerButton,
+} from "@/lib/rules/timer";
 import {
   canResume,
   instantToast,
@@ -41,6 +46,8 @@ import { tapFeedback } from "@/lib/ui/haptics";
 
 export type QuickActionsValue = {
   running: RunningLog[];
+  // Spec 2026-11-17 §5.3: the breast side to label "Nên bú", or null.
+  suggestSide: BreastSide | null;
   busy: boolean;
   error: Error | null;
   pressTimer: (button: TimerButton) => void;
@@ -124,6 +131,7 @@ export function QuickActionsProvider({
 
   const value: QuickActionsValue = {
     running,
+    suggestSide: nextBreastSide(rows, new Date())?.suggest ?? null,
     busy: press.isPending || stop.isPending,
     error: press.error ?? stop.error,
     pressTimer: (button) => {
diff --git a/components/home/HeroCard.tsx b/components/home/HeroCard.tsx
index 9bdc336..df72d84 100644
--- a/components/home/HeroCard.tsx
+++ b/components/home/HeroCard.tsx
@@ -2,6 +2,7 @@ import type { ReactNode } from "react";
 import { PendingMark } from "@/components/sync/PendingMark";
 import { Button } from "@/components/ui/Button";
 import { Glass } from "@/components/ui/Glass";
+import { HintBadge } from "@/components/ui/HintBadge";
 import { TimerRing } from "@/components/ui/TimerRing";
 import {
   formatClock,
@@ -10,7 +11,8 @@ import {
   timerLabel,
   type HeroState,
 } from "@/lib/rules/hero";
-import type { TimerButton } from "@/lib/rules/timer";
+import { NEXT_SIDE_LABEL } from "@/lib/rules/quickActions";
+import type { BreastSide, NextSide, TimerButton } from "@/lib/rules/timer";
 import { formatVnTime } from "@/lib/rules/time";
 import type { LogRow } from "@/lib/supabase/rows";
 import { categoryOf } from "@/lib/ui/categories";
@@ -35,6 +37,7 @@ export function HeroCardView({
   busy,
   onTimer,
   onStop,
+  nextSide = null,
 }: {
   state: HeroState<LogRow>;
   now: Date;
@@ -44,16 +47,39 @@ export function HeroCardView({
   busy: boolean;
   onTimer: (button: TimerButton) => void;
   onStop: (log: LogRow) => void;
+  // Spec 2026-11-17 §5.3: which side to offer first; null shows no hint.
+  nextSide?: NextSide | null;
 }) {
+  // Without a hint the button's only child stays the plain label.
+  const feedButton = (button: TimerButton, side: BreastSide, text: string) => (
+    <Button
+      disabled={busy}
+      className="relative"
+      onClick={() => onTimer(button)}
+    >
+      {nextSide?.suggest === side ? (
+        <>
+          {text}
+          <HintBadge className="-top-2 right-2">{NEXT_SIDE_LABEL}</HintBadge>
+        </>
+      ) : (
+        text
+      )}
+    </Button>
+  );
   const feedButtons = (
-    <div className="grid w-full grid-cols-2 gap-2.5">
-      <Button disabled={busy} onClick={() => onTimer(LEFT)}>
-        Bú trái
-      </Button>
-      <Button disabled={busy} onClick={() => onTimer(RIGHT)}>
-        Bú phải
-      </Button>
-    </div>
+    <>
+      <div className="grid w-full grid-cols-2 gap-2.5">
+        {feedButton(LEFT, "left", "Bú trái")}
+        {feedButton(RIGHT, "right", "Bú phải")}
+      </div>
+      {nextSide && (
+        <span className="text-[13px] leading-[18px] text-muted tabular-nums">
+          Lần trước: {nextSide.last === "left" ? "trái" : "phải"} lúc{" "}
+          {formatVnTime(new Date(nextSide.lastAt))}
+        </span>
+      )}
+    </>
   );
 
   let body: ReactNode;
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index 84dfb3a..1ec110d 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -18,7 +18,7 @@ import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
 import { sleepStatusLine } from "@/lib/rules/status";
 import { homeStatTiles, totalsLine } from "@/lib/rules/summaryText";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
-import { overdueTimers } from "@/lib/rules/timer";
+import { nextBreastSide, overdueTimers } from "@/lib/rules/timer";
 import type { Baby } from "@/lib/supabase/rows";
 import { AlertBanners } from "./AlertBanners";
 import { HeroCardView } from "./HeroCard";
@@ -67,6 +67,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
     now,
   });
   const heroLog = hero.kind === "running" ? hero.log : null;
+  const nextSide = nextBreastSide(rows, now);
   const vitaminD = vitaminDToday(rows, now);
   const sub =
     [sleepStatusLine(rows, now), vitaminD && `Vitamin D đã uống ${vitaminD}`]
@@ -119,6 +120,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
               busy={actions.busy}
               onTimer={actions.pressTimer}
               onStop={actions.stopTimer}
+              nextSide={nextSide}
             />
           )}
 
@@ -138,6 +140,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
             running={actions.running}
             busy={actions.busy}
             onTimer={actions.pressTimer}
+            suggestSide={nextSide?.suggest ?? null}
           />
 
           <QuickLogGrid onInstant={(type) => actions.openInstant(type)} />
diff --git a/components/home/TimerButtons.tsx b/components/home/TimerButtons.tsx
index e47213a..a1ba4a0 100644
--- a/components/home/TimerButtons.tsx
+++ b/components/home/TimerButtons.tsx
@@ -1,11 +1,14 @@
+import { HintBadge } from "@/components/ui/HintBadge";
 import { Icon } from "@/components/ui/Icon";
 import {
   actionLabel,
   isActionRunning,
+  isSuggestedSide,
+  NEXT_SIDE_LABEL,
   QUICK_ACTIONS,
   type QuickAction,
 } from "@/lib/rules/quickActions";
-import type { RunningLog, TimerButton } from "@/lib/rules/timer";
+import type { BreastSide, RunningLog, TimerButton } from "@/lib/rules/timer";
 import { CATEGORIES, type CategoryToken } from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 import { GROUP_LABEL } from "./sectionTitle";
@@ -43,10 +46,13 @@ export function TimerButtons({
   running,
   busy,
   onTimer,
+  suggestSide = null,
 }: {
   running: RunningLog[];
   busy: boolean;
   onTimer: (button: TimerButton) => void;
+  // Spec 2026-11-17 §5.3: the breast side to label "Nên bú"; null shows no label.
+  suggestSide?: BreastSide | null;
 }) {
   return (
     <section className="flex flex-col gap-2.5">
@@ -55,18 +61,22 @@ export function TimerButtons({
         {TIMER_ACTIONS.map((action) => {
           const on = isActionRunning(action, running);
           const token = CATEGORIES[action.category].token;
+          const suggested = isSuggestedSide(action, suggestSide);
+          const label = actionLabel(action, running);
           return (
             <button
               key={action.key}
               type="button"
               disabled={busy}
-              aria-label={actionLabel(action, running)}
+              aria-label={
+                suggested ? `${label}, ${NEXT_SIDE_LABEL.toLowerCase()}` : label
+              }
               onClick={() => onTimer(action.button)}
               className="flex flex-col items-center gap-1.5 transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50"
             >
               <span
                 className={cx(
-                  "flex size-[58px] items-center justify-center rounded-full",
+                  "relative flex size-[58px] items-center justify-center rounded-full",
                   on ? `${RUNNING[token]} text-bg` : `glass ${IDLE[token]}`,
                 )}
               >
@@ -75,6 +85,11 @@ export function TimerButtons({
                   size={24}
                   strokeWidth={2.2}
                 />
+                {suggested && (
+                  <HintBadge className="-top-1.5 -right-2">
+                    {NEXT_SIDE_LABEL}
+                  </HintBadge>
+                )}
               </span>
               <span className="text-xs leading-4 font-medium text-ink">
                 {action.label}
diff --git a/components/ui/HintBadge.tsx b/components/ui/HintBadge.tsx
new file mode 100644
index 0000000..a495452
--- /dev/null
+++ b/components/ui/HintBadge.tsx
@@ -0,0 +1,23 @@
+import type { ReactNode } from "react";
+import { cx } from "@/lib/ui/cx";
+
+// A small accent pill pinned to a corner of the control it points at. The control
+// needs `relative`; `className` places the pill (e.g. "-top-2 right-2").
+export function HintBadge({
+  children,
+  className,
+}: {
+  children: ReactNode;
+  className?: string;
+}) {
+  return (
+    <span
+      className={cx(
+        "pointer-events-none absolute rounded-full bg-accent px-[7px] py-1 text-[11px] leading-[11px] font-bold whitespace-nowrap text-on-accent",
+        className,
+      )}
+    >
+      {children}
+    </span>
+  );
+}
diff --git a/lib/rules/quickActions.ts b/lib/rules/quickActions.ts
index f7d999a..0439bf2 100644
--- a/lib/rules/quickActions.ts
+++ b/lib/rules/quickActions.ts
@@ -1,6 +1,6 @@
 import type { LogType } from "./logDetails";
 import type { InstantType } from "./quickEntry";
-import type { RunningLog, TimerButton } from "./timer";
+import type { BreastSide, RunningLog, TimerButton } from "./timer";
 
 export type QuickActionGroup = "timer" | "quick" | "other";
 
@@ -152,6 +152,21 @@ export function isActionRunning(
   );
 }
 
+// Spec 2026-11-17 §5.3: the label on the breast action of the suggested side.
+export const NEXT_SIDE_LABEL = "Nên bú";
+
+export function isSuggestedSide(
+  action: QuickAction,
+  side: BreastSide | null,
+): boolean {
+  return (
+    side !== null &&
+    action.kind === "timer" &&
+    action.button.type === "breast" &&
+    action.button.side === side
+  );
+}
+
 export function actionLabel(
   action: QuickAction,
   running: RunningLog[],
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  142 passed (142)`, `Tests  860 passed (860)`.

- [x] **Step 5: Commit**

```bash
git add components/actions/actionsheet.test.tsx components/home/buttons.test.tsx components/home/herocard.test.tsx lib/rules/quickActions.test.ts components/actions/ActionSheet.tsx components/actions/QuickActions.tsx components/home/HeroCard.tsx components/home/HomeScreen.tsx components/home/TimerButtons.tsx components/ui/HintBadge.tsx lib/rules/quickActions.ts
git commit -m "feat(feed): Nên bú hint on the hero card, timer row and + sheet" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 4: Viên timer trên thanh tab ở mọi trang trừ Hôm nay (§5.2, bản vẽ A1)

**Files:**

- Create: `components/nav/TimerPill.tsx`
- Modify: `lib/nav.ts` (`showsTimerPill`), `components/actions/QuickActions.tsx` (`runningRows` trong context), `components/actions/ActionChrome.tsx` (vẽ `<TimerPill />`), `components/AuthGate.tsx:96,103` (vùng đệm đáy), `components/ui/Toast.tsx:34` (`bottom`), `app/globals.css` (`--pill-offset`)
- Test: `lib/nav.test.ts`, `components/ui/toast.test.tsx`, `components/nav/timerpill.test.tsx` (mới)

**Interfaces:**

- Consumes: `pillTimer` (Task 1); `timerLabel`, `formatClock` (`lib/rules/hero.ts`); `categoryOf`, `CATEGORY_CHIP` (`lib/ui/categories.ts`); `useNow` (`lib/hooks/useNow.ts`); `useQuickActions()` với `busy`, `stopTimer`; `usePathname` của `next/navigation` (`TabBar.tsx` đang dùng cùng hook này).
- Produces:
  - `showsTimerPill(pathname: string): boolean` (`lib/nav.ts`): `false` chỉ với `"/"`.
  - `QuickActionsValue.runningRows: LogRow[]`.
  - `TimerPillView({ log: LogRow, more: number, now: Date, busy: boolean, onStop: () => void })` và `TimerPill()` (`components/nav/TimerPill.tsx`).
  - Biến CSS `--pill-offset` (`0px`, hoặc `52px` khi `<html data-timer-pill="on">`); `TimerPill` đặt và gỡ thuộc tính đó.
  - Vùng đệm đáy trang `pb-[calc(120px+var(--pill-offset))]`; toast ở `bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px+var(--pill-offset))]`.

**Đọc trước khi làm (AGENTS.md):** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md`. `usePathname` chỉ dùng trong Client Component và trả đúng pathname, ví dụ `/` hay `/nhat-ky`. Phần cần effect (đặt `data-timer-pill`, tick mỗi giây) nằm trong `LivePill`, chỉ được mount khi viên hiện; phần vẽ là `TimerPillView`, test được bằng `renderToStaticMarkup`.

- [x] **Step 1: Viết test hỏng (Patch 7)**

Run: `kb_patch 7 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/components/nav/timerpill.test.tsx b/components/nav/timerpill.test.tsx
new file mode 100644
index 0000000..cb9f25a
--- /dev/null
+++ b/components/nav/timerpill.test.tsx
@@ -0,0 +1,106 @@
+import { readFileSync } from "node:fs";
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { hostElements } from "@/components/ui/testTree";
+import type { LogRow } from "@/lib/supabase/rows";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { TimerPillView } from "./TimerPill";
+
+const NOW = new Date("2026-11-17T05:00:00Z");
+const row = (over: Partial<LogRow>): LogRow =>
+  ({
+    id: "l1",
+    baby_id: "b1",
+    type: "breast",
+    started_at: "2026-11-17T04:47:26.000Z", // 12 phút 34 giây trước
+    ended_at: null,
+    details: { side: "left" },
+    note: null,
+    created_by: "u1",
+    created_at: "2026-11-17T04:47:26.000Z",
+    updated_at: "2026-11-17T04:47:26.000Z",
+    ...over,
+  }) as LogRow;
+
+describe("TimerPillView (spec 2026-11-17 §5.2)", () => {
+  it("is one glass pill above the tab bar with the timer, its clock and Dừng", () => {
+    const html = renderToStaticMarkup(
+      <TimerPillView
+        log={row({})}
+        more={0}
+        now={NOW}
+        busy={false}
+        onStop={() => {}}
+      />,
+    );
+    expect(html.match(/glass-strong/g)).toHaveLength(1);
+    // No plain `glass` class anywhere: nothing inside the pill blurs again.
+    expect(html).not.toMatch(/class="(?:[^"]* )?glass(?: [^"]*)?"/);
+    expect(html).toContain(
+      "bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+70px)]",
+    );
+    expect(html).toContain("fixed");
+    expect(html).toContain("z-10");
+    expect(html).toContain("h-11");
+    expect(html).toContain("print:hidden");
+    expect(html).toContain('href="/"');
+    expect(html).toContain("size-8");
+    expect(html).toContain("bg-cat-feed/15 text-cat-feed");
+    expect(html).toContain(`d="${ICON_PATHS.heart}"`);
+    expect(html).toContain("Bú trái ·");
+    expect(html).toContain('<span class="tabular-nums">12:34</span>');
+    expect(html).toContain("min-w-16");
+    expect(html).toContain("text-accent-text");
+    expect(html).toContain(">Dừng</button>");
+    // No "+n" counter when it is the only timer.
+    expect(html).not.toContain(">+");
+  });
+
+  it("counts the other running timers and shows hours past one hour", () => {
+    const html = renderToStaticMarkup(
+      <TimerPillView
+        log={row({
+          type: "sleep",
+          details: {},
+          started_at: "2026-11-17T03:29:55.000Z",
+        })}
+        more={2}
+        now={NOW}
+        busy={false}
+        onStop={() => {}}
+      />,
+    );
+    expect(html).toContain("Ngủ ·");
+    expect(html).toContain(">1:30:05</span>");
+    expect(html).toContain(">+2</span>");
+  });
+
+  it("Dừng stops the shown timer and is disabled while busy", () => {
+    const onStop = vi.fn();
+    const [button] = hostElements(
+      TimerPillView({ log: row({}), more: 0, now: NOW, busy: true, onStop }),
+      "button",
+    );
+    expect(button.props.disabled).toBe(true);
+    (button.props.onClick as () => void)();
+    expect(onStop).toHaveBeenCalledTimes(1);
+  });
+});
+
+describe("room for the timer pill (spec 2026-11-17 §5.2)", () => {
+  it("globals.css defines --pill-offset, 52px while the pill shows", () => {
+    const css = readFileSync("app/globals.css", "utf8");
+    expect(css).toMatch(/:root\s*\{\s*--pill-offset:\s*0px;\s*\}/);
+    expect(css).toMatch(
+      /:root\[data-timer-pill="on"\]\s*\{\s*--pill-offset:\s*52px;\s*\}/,
+    );
+  });
+
+  it("the page's bottom padding grows by the same offset", () => {
+    const gate = readFileSync("components/AuthGate.tsx", "utf8");
+    expect(
+      gate.match(/pb-\[calc\(120px\+var\(--pill-offset\)\)\]/g),
+    ).toHaveLength(2);
+    expect(gate).not.toContain("pb-[120px]");
+  });
+});
diff --git a/components/ui/toast.test.tsx b/components/ui/toast.test.tsx
index e79f9f9..f5ec78e 100644
--- a/components/ui/toast.test.tsx
+++ b/components/ui/toast.test.tsx
@@ -10,7 +10,10 @@ describe("ToastView", () => {
     );
     expect(html).toContain('role="status"');
     expect(html).toContain('aria-live="polite"');
-    expect(html).toContain("bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px)]");
+    // Spec 2026-11-17 §5.2: rises by the pill's height when the timer pill shows.
+    expect(html).toContain(
+      "bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px+var(--pill-offset))]",
+    );
     expect(html).toContain("print:hidden");
     expect(html).not.toContain("glass-strong");
   });
diff --git a/lib/nav.test.ts b/lib/nav.test.ts
index a24e260..bb44eec 100644
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -6,6 +6,7 @@ import {
   EXPLORE_REPORT,
   EXPLORE_SOOTHE,
   EXPLORE_TRACK,
+  showsTimerPill,
   TABS,
 } from "./nav";
 
@@ -92,3 +93,12 @@ describe("nav", () => {
     expect(activeTab("/cai-app")).toBeNull();
   });
 });
+
+describe("showsTimerPill (spec 2026-11-17 §5.2)", () => {
+  it("is off on Hôm nay, which already has the hero card, and on elsewhere", () => {
+    expect(showsTimerPill("/")).toBe(false);
+    expect(showsTimerPill("/nhat-ky")).toBe(true);
+    expect(showsTimerPill("/kham-pha")).toBe(true);
+    expect(showsTimerPill("/cai-dat/cu-bu")).toBe(true);
+  });
+});
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run lib/nav.test.ts components/ui/toast.test.tsx components/nav/timerpill.test.tsx`
Expected: `Test Files  3 failed (3)`, `Tests  2 failed | 8 passed (10)`; có lỗi `Cannot find module './TimerPill'` và `showsTimerPill is not a function`.

- [x] **Step 3: Viết code (Patch 8)**

Run: `kb_patch 8 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/app/globals.css b/app/globals.css
index a2972e7..4a06980 100644
--- a/app/globals.css
+++ b/app/globals.css
@@ -308,6 +308,16 @@
   }
 }
 
+/* Spec 2026-11-17 §5.2: room for the timer pill (44 px + 8 px) above the tab bar.
+   TimerPill sets data-timer-pill on <html> while it shows. */
+:root {
+  --pill-offset: 0px;
+}
+
+:root[data-timer-pill="on"] {
+  --pill-offset: 52px;
+}
+
 @utility glass {
   background: var(--color-glass);
   border: 1px solid var(--color-edge);
diff --git a/components/AuthGate.tsx b/components/AuthGate.tsx
index 80e259e..9e48b09 100644
--- a/components/AuthGate.tsx
+++ b/components/AuthGate.tsx
@@ -93,14 +93,14 @@ export function AuthGate({
   if (!session || !baby || !member)
     return (
       <>
-        <div className="pb-[120px]">{content}</div>
+        <div className="pb-[calc(120px+var(--pill-offset))]">{content}</div>
         <TabBar />
       </>
     );
   return (
     <QuickActionsProvider baby={baby} member={member} userId={session.user.id}>
       <SyncBarProvider userId={session.user.id}>
-        <div className="pb-[120px]">{content}</div>
+        <div className="pb-[calc(120px+var(--pill-offset))]">{content}</div>
       </SyncBarProvider>
       <ActionChrome babyName={baby.name} />
     </QuickActionsProvider>
diff --git a/components/actions/ActionChrome.tsx b/components/actions/ActionChrome.tsx
index bdadf42..e3110c6 100644
--- a/components/actions/ActionChrome.tsx
+++ b/components/actions/ActionChrome.tsx
@@ -1,15 +1,17 @@
 "use client";
 
 import { TabBar } from "@/components/nav/TabBar";
+import { TimerPill } from "@/components/nav/TimerPill";
 import { ActionSheet } from "./ActionSheet";
 import { useQuickActions } from "./QuickActions";
 
-// The tab bar with its "+" button and the 13-action sheet. Whether the sheet is open lives in
+// The tab bar with its "+" button, the timer pill above it and the 13-action sheet. Whether the sheet is open lives in
 // QuickActionsProvider, so a page (e.g. an empty Nhật ký) can open it too.
 export function ActionChrome({ babyName }: { babyName: string }) {
   const actions = useQuickActions();
   return (
     <>
+      <TimerPill />
       <TabBar
         onPlus={actions.toggleActionSheet}
         plusOpen={actions.actionSheetOpen}
diff --git a/components/actions/QuickActions.tsx b/components/actions/QuickActions.tsx
index a37e9e4..4141787 100644
--- a/components/actions/QuickActions.tsx
+++ b/components/actions/QuickActions.tsx
@@ -46,6 +46,8 @@ import { tapFeedback } from "@/lib/ui/haptics";
 
 export type QuickActionsValue = {
   running: RunningLog[];
+  // The running timers as full rows, for the timer pill (spec 2026-11-17 §5.2).
+  runningRows: LogRow[];
   // Spec 2026-11-17 §5.3: the breast side to label "Nên bú", or null.
   suggestSide: BreastSide | null;
   busy: boolean;
@@ -131,6 +133,7 @@ export function QuickActionsProvider({
 
   const value: QuickActionsValue = {
     running,
+    runningRows: rows.filter((row) => row.ended_at === null),
     suggestSide: nextBreastSide(rows, new Date())?.suggest ?? null,
     busy: press.isPending || stop.isPending,
     error: press.error ?? stop.error,
diff --git a/components/nav/TimerPill.tsx b/components/nav/TimerPill.tsx
new file mode 100644
index 0000000..c753e9b
--- /dev/null
+++ b/components/nav/TimerPill.tsx
@@ -0,0 +1,97 @@
+"use client";
+
+import Link from "next/link";
+import { usePathname } from "next/navigation";
+import { useEffect } from "react";
+import { useQuickActions } from "@/components/actions/QuickActions";
+import { Icon } from "@/components/ui/Icon";
+import { useNow } from "@/lib/hooks/useNow";
+import { showsTimerPill } from "@/lib/nav";
+import { formatClock, timerLabel } from "@/lib/rules/hero";
+import { pillTimer } from "@/lib/rules/timer";
+import type { LogRow } from "@/lib/supabase/rows";
+import { CATEGORY_CHIP, categoryOf } from "@/lib/ui/categories";
+import { cx } from "@/lib/ui/cx";
+
+// Spec 2026-11-17 §5.2 (drawing A1): the running timer, 8 px above the 62 px tab bar.
+export function TimerPillView({
+  log,
+  more,
+  now,
+  busy,
+  onStop,
+}: {
+  log: LogRow;
+  more: number;
+  now: Date;
+  busy: boolean;
+  onStop: () => void;
+}) {
+  const category = categoryOf(log.type);
+  return (
+    <div className="glass-strong fixed bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+70px)] left-1/2 z-10 flex h-11 -translate-x-1/2 items-center overflow-hidden rounded-full shadow-[0_8px_22px_rgb(0_0_0/0.14)] in-data-[theme=night]:shadow-none print:hidden">
+      <Link
+        href="/"
+        className="flex h-11 items-center gap-2 pr-3 pl-1.5 text-[15px] font-semibold whitespace-nowrap text-ink"
+      >
+        <span
+          className={cx(
+            "flex size-8 shrink-0 items-center justify-center rounded-full",
+            CATEGORY_CHIP[category.token],
+          )}
+        >
+          <Icon name={category.icon} size={17} strokeWidth={2.2} />
+        </span>
+        <span>
+          {timerLabel(log)} ·{" "}
+          <span className="tabular-nums">
+            {formatClock(now.getTime() - Date.parse(log.started_at))}
+          </span>
+        </span>
+        {more > 0 && (
+          <span className="rounded-full bg-ink/10 px-[7px] py-1 text-[11px] leading-[11px] font-bold">
+            +{more}
+          </span>
+        )}
+      </Link>
+      <button
+        type="button"
+        disabled={busy}
+        onClick={onStop}
+        className="h-11 min-w-16 border-l border-line px-4 text-[15px] font-bold text-accent-text disabled:opacity-50"
+      >
+        Dừng
+      </button>
+    </div>
+  );
+}
+
+// Only this component ticks every second, and only while the pill shows.
+function LivePill({ log, more }: { log: LogRow; more: number }) {
+  const actions = useQuickActions();
+  const now = useNow(1000);
+  // Tells globals.css to make room: the page padding and the toast both rise.
+  useEffect(() => {
+    document.documentElement.dataset.timerPill = "on";
+    return () => {
+      delete document.documentElement.dataset.timerPill;
+    };
+  }, []);
+  return (
+    <TimerPillView
+      log={log}
+      more={more}
+      now={now}
+      busy={actions.busy}
+      onStop={() => actions.stopTimer(log)}
+    />
+  );
+}
+
+export function TimerPill() {
+  const actions = useQuickActions();
+  const pill = showsTimerPill(usePathname())
+    ? pillTimer(actions.runningRows)
+    : null;
+  return pill ? <LivePill log={pill.log} more={pill.more} /> : null;
+}
diff --git a/components/ui/Toast.tsx b/components/ui/Toast.tsx
index c9aadc7..7e2ec15 100644
--- a/components/ui/Toast.tsx
+++ b/components/ui/Toast.tsx
@@ -31,7 +31,7 @@ export function ToastView({
     <div
       role="status"
       aria-live="polite"
-      className="pointer-events-none fixed inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px)] z-40 flex justify-center print:hidden"
+      className="pointer-events-none fixed inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px+var(--pill-offset))] z-40 flex justify-center print:hidden"
     >
       {item && (
         <div className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 shadow-[0_10px_30px_rgb(0_0_0/0.15)]">
diff --git a/lib/nav.ts b/lib/nav.ts
index 0cd46c8..11e9d7e 100644
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -118,3 +118,9 @@ export function activeTab(pathname: string): TabKey | null {
     return "explore";
   return null;
 }
+
+// Spec 2026-11-17 §5.2: the timer pill shows on every page except Hôm nay,
+// where the hero card already shows the running timer.
+export function showsTimerPill(pathname: string): boolean {
+  return pathname !== "/";
+}
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  143 passed (143)`, `Tests  866 passed (866)`.

- [x] **Step 5: Commit**

```bash
git add components/nav/timerpill.test.tsx components/ui/toast.test.tsx lib/nav.test.ts app/globals.css components/AuthGate.tsx components/actions/ActionChrome.tsx components/actions/QuickActions.tsx components/nav/TimerPill.tsx components/ui/Toast.tsx lib/nav.ts
git commit -m "feat(nav): running-timer pill above the tab bar on every page but Hôm nay" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 5: Kiểm cuối M2

**Files:**

- Modify: `docs/blueprint/plans/2026-11-17-kim-bun-canh-timer-m2.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ Task 1–4 tạo ra.
- Produces: nhánh `feat/kim-bun-canh-timer-m2` sẵn sàng cho người dùng quyết định đưa lên `main`.

- [x] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  143 passed (143)`, `Tests  866 passed (866)`.

- [x] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu dừng với `SecurityFatalError` của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0. Không chạy lệnh `next upgrade` mà thông báo gợi ý.

> **Kết quả 2026-11-17 (Step 1–2).** Trên nhánh `feat/kim-bun-canh-timer-m2`: `tsc --noEmit` sạch; vitest `143 passed (143)` file, `866 passed (866)` test; `bun run build` dừng lần đầu với `SecurityFatalError`, lần hai `✓ Generating static pages (37/37)` và thoát mã 0. Cả 8 patch áp sạch; số test đỏ ở Task 1–4 đúng như ghi (9/13, 1/11, 4/33, 2/10).

- [ ] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không bấm Lưu, không bấm Dừng)**

Bước này do **phiên chính** làm, bằng trình duyệt có sẵn trong app Claude, và cần người dùng đồng ý trước mỗi lần. Người thực thi là subagent thì **để ô này chưa tick** và ghi vào báo cáo là chưa làm.

App dev nối vào Supabase thật của gia đình. Trong cả bước này:

- Không bấm "Lưu" ở bất kỳ sheet nào.
- Không bấm nút nào bắt đầu hay dừng timer: 5 nút của hàng "Bấm giờ", 5 ô nhóm "Bấm giờ" trong bảng "+", hai nút "Bú trái" / "Bú phải" của thẻ hero, nút "Dừng" / "Đổi bên" của thẻ hero, nút "Dừng" của banner và của viên timer.
- Không vào Cài đặt.

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Mở `http://localhost:3000` trong trình duyệt của app, đặt cỡ 375×812. Nếu bị chuyển sang `/dang-nhap`: để ô này chưa tick, báo lại, không tự đăng nhập.

1. Trang chủ, khi thẻ hero ở trạng thái "Trễ cữ bú" hoặc "Chưa có cữ bú nào gần đây" và trong 24 giờ qua có một cữ bú mẹ đã xong: một trong hai nút "Bú trái" / "Bú phải" có viên nhỏ "Nên bú" ở góc trên bên phải, bên ngược với cữ gần nhất; dưới hai nút có dòng `Lần trước: <trái|phải> lúc <HH:mm>`. Hàng "Bấm giờ" cũng có đúng một nhãn "Nên bú" trên cùng bên đó. Nếu thẻ hero đang ở trạng thái "Cữ bú tiếp theo" thì thẻ không có nhãn (đúng), chỉ hàng "Bấm giờ" có.
2. Bấm "+": ô bú của bên được gợi ý có nhãn "Nên bú" ở góc; nhãn không che chữ của ô bên cạnh. Đóng bằng X.
3. Nếu nhà đang có một timer bú chạy: không chỗ nào có nhãn "Nên bú" (đúng theo §5.3). Ghi rõ trong báo cáo là mục 1–2 không kiểm được lúc đó.
4. Nếu nhà đang có timer chạy: mở `/nhat-ky`. Kỳ vọng: một viên kính nằm giữa, ngay trên thanh tab, gồm vòng icon, `<nhãn> · <đồng hồ>` đang nhảy mỗi giây, vạch dọc và chữ "Dừng"; nội dung cuối trang không bị viên che khi cuộn hết. Về `/`: viên biến mất. Chạy bằng javascript tool: `document.documentElement.dataset.timerPill` phải là `"on"` ở `/nhat-ky` và `undefined` ở `/`.
5. Nếu không có timer nào chạy: viên và banner **không thể thấy** trên trình duyệt. Ghi rõ điều đó trong báo cáo; đứng thay là test `components/nav/timerpill.test.tsx`, `components/home/longtimer.test.tsx` và `lib/rules/timer.test.ts`. Không tự bắt đầu timer để xem.
6. Ở mỗi trang đã mở, chạy bằng javascript tool: `document.documentElement.scrollWidth <= window.innerWidth`. Kỳ vọng `true`.
7. Lặp lại mục 1, 2 và 4 ở hai theme nữa bằng `document.documentElement.dataset.theme = "rose"` rồi `"night"` (`"dark"` là Tối). Lệnh này chỉ đổi giao diện của tab đang mở và mất khi tải lại trang. Kỳ vọng: chữ "Nên bú" và chữ trên viên đọc rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này.

- [ ] **Step 4: Commit phần ghi kết quả, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-17-kim-bun-canh-timer-m2.md
git commit -m "docs(plan): record the M2 check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: nhánh và `git log --oneline main..HEAD`; kết quả typecheck, vitest (số file và số test), build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa và vì sao. Plan này không đưa gì lên `main`: việc đó chờ người dùng đồng ý.
