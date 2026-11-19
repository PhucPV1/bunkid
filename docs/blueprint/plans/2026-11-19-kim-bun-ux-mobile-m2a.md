# Kim Bun — UX mobile M2a: luật và header của trang Hôm nay Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§3.1; phần luật của §3.2, §3.3 và §3.5; icon `more` của §3.4; phần tương ứng của §11.1)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Luật của trang Hôm nay trả về năm trạng thái thẻ lớn và ba ô trạng thái, dòng tổng "24 giờ qua" biết bỏ số 0, và header có nút Cài đặt.

**Architecture:**

- **Luật thuần** (`lib/rules/`): `heroState` bỏ `next`, thêm `awake` và `none`; `statusTiles` mới trong `status.ts`; `totalsLine` trả `null` khi không có gì để ghi.
- **Giao diện:** `HomeHeaderView` thêm nút Cài đặt; icon `more` thêm vào `lib/ui/icons.ts`.
- **Chưa làm ở plan này:** vẽ lại thẻ lớn và component `StatusTiles` (M2b); hàng Ghi nhanh, khối "24 giờ qua", thứ tự khối trong `HomeScreen` (M2c).

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m2a`, cắt từ `main` @ `5c4ea5f`. Baseline: 951 test vitest xanh (151 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| **M2a (plan này)** | luật của §3.2, §3.3, §3.5; §3.1 header | `2026-11-19-kim-bun-ux-mobile-m2a.md` |
| M2b | §3.2 thẻ lớn; §3.3 component ô trạng thái | `2026-11-19-kim-bun-ux-mobile-m2b.md` |
| M2c | §3.4, §3.5, §3.6; kiểm cuối M2 và lên `main` | `2026-11-19-kim-bun-ux-mobile-m2c.md` |
| M3 | §4 timer trong tab, §5.4 sheet "+" | chưa viết |
| M4 | §6 Triệu chứng | chưa viết |
| M5 | §7 Tiêm chủng, §9 Khám phá | chưa viết |
| M6 | phần còn lại của §8 Thống kê, §11.3 | chưa viết |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **`awake.since` là `Date`**, giống `overdue.due`. Giấc ngủ kết thúc đúng 12 giờ trước vẫn tính là `awake`, cùng quy ước với `feedDue`.
2. **Viền cảnh báo của ô trạng thái:** không thêm cờ riêng. Chỉ hàng "trễ" có `tone === "warn"`, component dựa vào đó (M2b).
3. **"Bú gần nhất" và "Tã gần nhất"** bỏ qua bản ghi có `details` không hợp schema. Bản ghi cũ đúng 24 giờ vẫn hiện.
4. **Nhiều timer bú chạy cùng lúc:** "từ HH:MM" lấy theo timer bắt đầu muộn nhất.
5. **Cữ bú dưới một phút** hiện "trái · 0p"; đúng giờ dự kiến thì hiện "trễ 0p".
6. **Nút Cài đặt** dùng `text-ink`. Số icon trong `lib/ui/categories.test.ts` tăng từ 42 lên 43.
7. **Trạng thái trung gian.** Sau Task 1, thẻ lớn tạm không vẽ gì cho `awake` và `none`, và không còn nhánh `next`. Vì vậy M2a chỉ nằm trên nhánh.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (quy tắc CSS của hotfix 7822c90): lớp trong chỉ còn màu nền và viền. Không thiết kế gì dựa vào blur của lớp trong. Màn hình không tự cộng `env(safe-area-inset-*)`, trừ các thanh `fixed` ở đáy đang dùng công thức `max(calc(env(safe-area-inset-bottom)+10px),26px)`.
- Mọi giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString` có sẵn.
- Mọi ghi bản ghi (`logs`) đi qua outbox như hiện tại. Spec này không thêm đường ghi mới.
- Chữ về sức khoẻ: không thêm ngưỡng hay câu khuyên mới. Chỉ dùng lại ngưỡng và câu `explain` đang có trong `lib/rules/ratings.ts`.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị xuống dòng hoặc bị cắt "…", trừ tên bé, tên thành viên, tên mũi tiêm và dòng mô tả của thẻ ở Khám phá (§9, tối đa 2 dòng).
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay dừng đồng hồ, không bật tắt công tắc ở Cài đặt.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 935 test vitest (148 file), pgTAP 001–013, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao của `main` có M1 ở ngoài repo, trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5): `tsc --noEmit` sạch sau mỗi commit code, số test đỏ và xanh đúng như ghi; cả bộ sau Task 2 là 972 test trong 151 file.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Next.js.** Không task nào thêm route. Chỗ dùng API của Next duy nhất là `next/link` trong `StatsSection.tsx` (M2c), dùng y như `HomeHeader.tsx` và `RecentCard.tsx` đang dùng.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status). Ba plan M2a, M2b, M2c chỉ lên `main` cùng nhau, ở cuối M2c: giữa chừng trang Hôm nay tạm thiếu giờ cữ bú tiếp và dòng Vitamin D.

## Contracts with Other Plans

Plan này đứng sau M1 (đã ở trên `main` @ `5c4ea5f`) và ngay trước M2b.

**Consumes (từ `main` @ `5c4ea5f`):**

- `lib/rules/status.ts`: `feedDue(logs, feedIntervalMin, now): Date | null`.
- `lib/rules/summaryText.ts`: `shortDuration(minutes): string`, `totalsLine`.
- `lib/rules/ratings.ts`: `WINDOW_MS`.

**Produces** (M2b, M2c và các mốc sau được dựa vào đúng những tên này):

- `lib/rules/hero.ts`: `HeroState<T>` = `running | empty | overdue | awake | none`; không còn `ringProgress`.
- `lib/rules/status.ts`: `StatusTile`, `statusTiles({ logs, feedIntervalMin, now }): StatusTile[]` (đúng 3 phần tử, theo thứ tự "Cữ bú tiếp", "Bú gần nhất", "Tã gần nhất").
- `lib/rules/summaryText.ts`: `totalsLine(...)` trả `string | null`.
- `lib/ui/icons.ts`: icon `more`. `components/home/HomeHeader.tsx`: nút Cài đặt.
- **Vitest sau M2a:** 972 test, 151 file.

---

### Task 1: Luật: năm trạng thái thẻ lớn, ba ô trạng thái, dòng tổng có thể rỗng (§3.2, §3.3, §3.5)

**Files:**

- Modify: `components/home/HeroCard.tsx`
- Modify: `components/home/HomeScreen.tsx`
- Modify: `lib/rules/hero.ts`
- Modify: `lib/rules/status.ts`
- Modify: `lib/rules/summaryText.ts`
- Test: `components/home/herocard.test.tsx` (sửa)
- Test: `lib/rules/hero.test.ts` (sửa)
- Test: `lib/rules/status.test.ts` (sửa)
- Test: `lib/rules/summaryText.test.ts` (sửa)

**Interfaces:**

- Consumes: `feedDue` (`lib/rules/status.ts`), `shortDuration` (`lib/rules/summaryText.ts`), `detailsSchemas` (`lib/rules/logDetails.ts`), `WINDOW_MS` (`lib/rules/ratings.ts`), `formatVnTime`.
- Produces: `HeroState<T>` gồm `running | empty | overdue | awake | none`, với `{ kind: "awake"; since: Date }` (không còn `next`); `statusTiles({ logs, feedIntervalMin, now }): StatusTile[]` và kiểu `StatusTile = { label: string; value: string; note: string; tone: "good" | "warn" | "muted" }` trong `lib/rules/status.ts`; `totalsLine(...): string | null`; `ringProgress` bị xoá.

- [ ] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m2a main
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2a.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2b.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2c.md
git commit -m "docs(plan): the three M2 plans for the home page" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [ ] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/home/herocard.test.tsx b/components/home/herocard.test.tsx
index 3e53319..de8476f 100644
--- a/components/home/herocard.test.tsx
+++ b/components/home/herocard.test.tsx
@@ -108,20 +108,6 @@ describe("HeroCardView feed states", () => {
     expect(onTimer).toHaveBeenCalledWith({ type: "breast", side: "right" });
   });
 
-  it("next: expected time large, time left, no buttons", () => {
-    const out = html(
-      props({
-        kind: "next",
-        due: new Date("2026-11-14T07:00:00Z"),
-        minutesLeft: 120,
-      }),
-    );
-    expect(out).toContain(">Cữ bú tiếp theo</span>");
-    expect(out).toContain(">14:00</span>");
-    expect(out).toContain(">còn 2 giờ 00 phút</span>");
-    expect(out).not.toContain("<button");
-  });
-
   it("empty: a sentence, two feed buttons and the sub line", () => {
     const out = html(
       props(
@@ -185,20 +171,8 @@ describe("HeroCardView next-side hint (spec 2026-11-17 §5.3)", () => {
     ]);
   });
 
-  it("shows nothing without a hint, and nothing in the next state", () => {
+  it("shows nothing without a hint", () => {
     expect(html(props(overdue))).not.toContain("Nên bú");
     expect(html(props(overdue))).not.toContain("Lần trước");
-    const next = html(
-      props(
-        {
-          kind: "next",
-          due: new Date("2026-11-14T06:00:00Z"),
-          minutesLeft: 60,
-        },
-        { nextSide },
-      ),
-    );
-    expect(next).not.toContain("Nên bú");
-    expect(next).not.toContain("Lần trước");
   });
 });
diff --git a/lib/rules/hero.test.ts b/lib/rules/hero.test.ts
index d8f796c..4d2433e 100644
--- a/lib/rules/hero.test.ts
+++ b/lib/rules/hero.test.ts
@@ -5,7 +5,6 @@ import {
   formatMinutes,
   heroState,
   longTimerText,
-  ringProgress,
   timerLabel,
 } from "./hero";
 
@@ -28,6 +27,7 @@ const bottle = (h: number) => log("bottle", h, h, { ml: 90, milk: "formula" });
 const state = (logs: LogLike[]) =>
   heroState({ logs, feedIntervalMin: 180, now: NOW });
 
+// Spec 2026-11-19 §3.2: running, empty, overdue, awake, none, in that order.
 describe("heroState", () => {
   it("running: the timer that started last wins", () => {
     const sleep = log("sleep", 2, null);
@@ -38,46 +38,75 @@ describe("heroState", () => {
     });
   });
 
-  it("running beats an overdue feed", () => {
+  it("running beats every other state", () => {
     const tummy = log("tummy", 0.1, null);
+    expect(state([tummy])).toEqual({ kind: "running", log: tummy });
     expect(state([bottle(5), tummy])).toEqual({ kind: "running", log: tummy });
+    expect(state([bottle(1), log("sleep", 3, 1), tummy])).toEqual({
+      kind: "running",
+      log: tummy,
+    });
   });
 
-  it("next: before the expected feed time", () => {
-    expect(state([bottle(1)])).toEqual({
-      kind: "next",
-      due: new Date("2026-11-14T07:00:00Z"),
-      minutesLeft: 120,
-    });
-    expect(state([log("breast", 1, 0.5, { side: "right" })])).toEqual({
-      kind: "next",
-      due: new Date("2026-11-14T07:00:00Z"),
-      minutesLeft: 120,
+  it("empty: no feed in the last 12 hours, even after a recent sleep", () => {
+    expect(state([])).toEqual({ kind: "empty" });
+    expect(state([bottle(12.5), log("sleep", 3, 1)])).toEqual({
+      kind: "empty",
     });
   });
 
-  it("overdue: at or after the expected feed time", () => {
+  it("overdue: at or after the expected feed time, even after a recent sleep", () => {
     expect(state([bottle(3)])).toEqual({
       kind: "overdue",
       due: new Date("2026-11-14T05:00:00Z"),
       lateMinutes: 0,
     });
-    expect(state([bottle(3.5)])).toEqual({
+    expect(state([bottle(3.5), log("sleep", 2, 1)])).toEqual({
       kind: "overdue",
       due: new Date("2026-11-14T04:30:00Z"),
       lateMinutes: 30,
     });
   });
 
-  it("empty: no feed in the last 12 hours", () => {
-    expect(state([])).toEqual({ kind: "empty" });
-    expect(state([bottle(12.5), log("sleep", 3, 1)])).toEqual({
-      kind: "empty",
+  it("a feed exactly 12 hours old still counts", () => {
+    expect(state([bottle(12)]).kind).toBe("overdue");
+  });
+
+  it("awake: before the expected feed, since the end of the last sleep", () => {
+    expect(state([bottle(1), log("sleep", 2, 0.75)])).toEqual({
+      kind: "awake",
+      since: new Date("2026-11-14T04:15:00Z"),
     });
   });
 
-  it("a feed exactly 12 hours old still counts", () => {
-    expect(state([bottle(12)]).kind).toBe("overdue");
+  it("awake takes the sleep that ended last, not the one that started last", () => {
+    const logs = [
+      bottle(1),
+      log("sleep", 11, 9),
+      log("sleep", 5, 0.5),
+      log("sleep", 3, 2),
+    ];
+    expect(state(logs)).toEqual({
+      kind: "awake",
+      since: new Date("2026-11-14T04:30:00Z"),
+    });
+  });
+
+  it("a sleep that ended exactly 12 hours ago still counts", () => {
+    expect(state([bottle(1), log("sleep", 14, 12)])).toEqual({
+      kind: "awake",
+      since: new Date("2026-11-13T17:00:00Z"),
+    });
+  });
+
+  it("none: before the expected feed with no sleep ended in the last 12 hours", () => {
+    expect(state([bottle(1)])).toEqual({ kind: "none" });
+    expect(state([log("breast", 1, 0.5, { side: "right" })])).toEqual({
+      kind: "none",
+    });
+    expect(state([bottle(1), log("sleep", 14, 12.5)])).toEqual({
+      kind: "none",
+    });
   });
 });
 
@@ -109,13 +138,6 @@ describe("hero text helpers", () => {
     expect(formatMinutes(125)).toBe("2 giờ 05 phút");
   });
 
-  it("ringProgress fills the ring once an hour", () => {
-    expect(ringProgress(0)).toBe(0);
-    expect(ringProgress(15 * 60_000)).toBe(0.25);
-    expect(ringProgress(75 * 60_000)).toBe(0.25);
-    expect(ringProgress(-1_000)).toBe(0);
-  });
-
   it("longTimerText says how long a timer has run and asks if it still is", () => {
     expect(longTimerText(log("tummy", 32 / 60, null), NOW)).toBe(
       "Nằm sấp đã chạy 32 phút. Còn đang nằm sấp không?",
diff --git a/lib/rules/status.test.ts b/lib/rules/status.test.ts
index c873265..c07a931 100644
--- a/lib/rules/status.test.ts
+++ b/lib/rules/status.test.ts
@@ -1,6 +1,12 @@
 import { describe, expect, it } from "vitest";
-import type { LogLike } from "@/lib/rules/describeLog";
-import { feedDue, homeStatusLines, sleepStatusLine } from "@/lib/rules/status";
+import { describeLog, type LogLike } from "@/lib/rules/describeLog";
+import { heroState } from "@/lib/rules/hero";
+import {
+  feedDue,
+  homeStatusLines,
+  sleepStatusLine,
+  statusTiles,
+} from "@/lib/rules/status";
 
 const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
 const H = 3_600_000;
@@ -72,3 +78,200 @@ describe("feedDue", () => {
     expect(feedDue([log("sleep", 1, 0.5)], 180, NOW)).toBeNull();
   });
 });
+
+// Spec 2026-11-19 §3.3: the three tiles under the hero card.
+describe("statusTiles", () => {
+  const span = (
+    type: string,
+    start: string,
+    end: string | null,
+    details: unknown,
+  ): LogLike => ({ type, started_at: start, ended_at: end, details });
+  const bottleAt = (iso: string) =>
+    span("bottle", iso, iso, { ml: 90, milk: "formula" });
+  const diaper = (h: number, wet: boolean, dirty: boolean) =>
+    log("diaper", h, h, { wet, dirty });
+  const tiles = (logs: LogLike[]) =>
+    statusTiles({ logs, feedIntervalMin: 180, now: NOW });
+  const nextFeed = (logs: LogLike[]) => tiles(logs)[0];
+  const lastFeed = (logs: LogLike[]) => tiles(logs)[1];
+  const lastDiaper = (logs: LogLike[]) => tiles(logs)[2];
+
+  it("is exactly three tiles, all blank when nothing was logged", () => {
+    expect(tiles([])).toEqual([
+      { label: "Cữ bú tiếp", value: "—", note: "chưa ghi", tone: "muted" },
+      { label: "Bú gần nhất", value: "—", note: "chưa ghi", tone: "muted" },
+      { label: "Tã gần nhất", value: "—", note: "chưa ghi", tone: "muted" },
+    ]);
+    expect(tiles([log("sleep", 2, 1)])).toEqual(tiles([]));
+  });
+
+  describe("Cữ bú tiếp", () => {
+    it("says Đang bú and the start time while a breast timer runs", () => {
+      const running = log("breast", 0.25, null, { side: "left" });
+      expect(nextFeed([bottle(4), running])).toEqual({
+        label: "Cữ bú tiếp",
+        value: "Đang bú",
+        note: "từ 11:45",
+        tone: "muted",
+      });
+    });
+
+    it("is blank when feedDue has nothing: no feed in the last 12 hours", () => {
+      expect(nextFeed([bottle(13)])).toEqual({
+        label: "Cữ bú tiếp",
+        value: "—",
+        note: "chưa ghi",
+        tone: "muted",
+      });
+    });
+
+    it("before the expected time: the time, how long is left, good", () => {
+      expect(nextFeed([bottle(1)])).toEqual({
+        label: "Cữ bú tiếp",
+        value: "14:00",
+        note: "còn 2g",
+        tone: "good",
+      });
+      expect(nextFeed([bottle(2.25)]).note).toBe("còn 45p");
+    });
+
+    it("at or after the expected time: the time, how late, warn", () => {
+      expect(nextFeed([bottle(3.5)])).toEqual({
+        label: "Cữ bú tiếp",
+        value: "11:30",
+        note: "trễ 30p",
+        tone: "warn",
+      });
+      expect(nextFeed([bottle(3)])).toMatchObject({
+        value: "12:00",
+        note: "trễ 0p",
+        tone: "warn",
+      });
+      expect(nextFeed([bottle(5.25)]).note).toBe("trễ 2g 15p");
+    });
+
+    it("rounds the minutes left up and the minutes late down, like heroState", () => {
+      // Due at 12:59:30, 59.5 minutes from now.
+      expect(nextFeed([bottleAt("2026-11-14T02:59:30Z")]).note).toBe("còn 1g");
+      // Due at 11:58:30, 1.5 minutes ago.
+      const late = [bottleAt("2026-11-14T01:58:30Z")];
+      expect(nextFeed(late).note).toBe("trễ 1p");
+      const hero = heroState({ logs: late, feedIntervalMin: 180, now: NOW });
+      expect(hero).toMatchObject({ kind: "overdue", lateMinutes: 1 });
+    });
+  });
+
+  describe("Bú gần nhất", () => {
+    it("a finished breast feed: start time, side and length", () => {
+      expect(lastFeed([log("breast", 1, 0.75, { side: "left" })])).toEqual({
+        label: "Bú gần nhất",
+        value: "11:00",
+        note: "trái · 15p",
+        tone: "muted",
+      });
+      expect(lastFeed([log("breast", 2, 0.75, { side: "right" })]).note).toBe(
+        "phải · 1g 15p",
+      );
+    });
+
+    it("counts the minutes of a feed the way describeLog does", () => {
+      const feed = span(
+        "breast",
+        "2026-11-14T04:00:00Z",
+        "2026-11-14T04:15:59Z",
+        { side: "left" },
+      );
+      expect(describeLog(feed, NOW)).toBe("Bú trái · 15 phút");
+      expect(lastFeed([feed]).note).toBe("trái · 15p");
+    });
+
+    it("a running breast feed: start time and the side being fed", () => {
+      expect(lastFeed([log("breast", 0.25, null, { side: "right" })])).toEqual({
+        label: "Bú gần nhất",
+        value: "11:45",
+        note: "đang bú phải",
+        tone: "muted",
+      });
+      expect(lastFeed([log("breast", 0.25, null, { side: "left" })]).note).toBe(
+        "đang bú trái",
+      );
+    });
+
+    it("a bottle: time and ml", () => {
+      expect(lastFeed([bottle(1)])).toEqual({
+        label: "Bú gần nhất",
+        value: "11:00",
+        note: "bình · 90 ml",
+        tone: "muted",
+      });
+    });
+
+    it("takes the feed that started last", () => {
+      const breast = log("breast", 3, 2.5, { side: "left" });
+      expect(lastFeed([bottle(1), breast]).note).toBe("bình · 90 ml");
+      expect(lastFeed([breast, bottle(4)]).note).toBe("trái · 30p");
+    });
+
+    it("only looks at the last 24 hours, and says so when every feed is older", () => {
+      expect(lastFeed([bottle(25)])).toEqual({
+        label: "Bú gần nhất",
+        value: "—",
+        note: "hơn 24 giờ",
+        tone: "muted",
+      });
+      expect(lastFeed([bottle(24)])).toMatchObject({
+        value: "12:00",
+        note: "bình · 90 ml",
+      });
+      expect(lastFeed([bottle(30), bottle(23)]).value).toBe("13:00");
+    });
+
+    it("still shows a feed too old for the next-feed tile", () => {
+      expect(tiles([bottle(13)]).map((t) => [t.value, t.note])).toEqual([
+        ["—", "chưa ghi"],
+        ["23:00", "bình · 90 ml"],
+        ["—", "chưa ghi"],
+      ]);
+    });
+
+    it("skips a feed whose details are not valid", () => {
+      const broken = log("bottle", 0.5, 0.5, { ml: "nhiều" });
+      expect(lastFeed([broken]).note).toBe("chưa ghi");
+      expect(lastFeed([broken, bottle(2)]).value).toBe("10:00");
+    });
+  });
+
+  describe("Tã gần nhất", () => {
+    it("shows the time and what the diaper was", () => {
+      expect(lastDiaper([diaper(0.5, true, false)])).toEqual({
+        label: "Tã gần nhất",
+        value: "11:30",
+        note: "ướt",
+        tone: "muted",
+      });
+      expect(lastDiaper([diaper(0.5, false, true)]).note).toBe("bẩn");
+      expect(lastDiaper([diaper(0.5, true, true)]).note).toBe("ướt + bẩn");
+    });
+
+    it("takes the diaper that started last", () => {
+      const logs = [diaper(3, true, true), diaper(1, false, true), bottle(0.5)];
+      expect(lastDiaper(logs)).toMatchObject({ value: "11:00", note: "bẩn" });
+    });
+
+    it("only looks at the last 24 hours, and says so when every diaper is older", () => {
+      expect(lastDiaper([diaper(24.5, true, false)])).toEqual({
+        label: "Tã gần nhất",
+        value: "—",
+        note: "hơn 24 giờ",
+        tone: "muted",
+      });
+      expect(lastDiaper([diaper(24, true, false)]).value).toBe("12:00");
+    });
+
+    it("skips a diaper whose details are not valid", () => {
+      const broken = log("diaper", 0.5, 0.5, { wet: false, dirty: false });
+      expect(lastDiaper([broken]).note).toBe("chưa ghi");
+    });
+  });
+});
diff --git a/lib/rules/summaryText.test.ts b/lib/rules/summaryText.test.ts
index 45a90a5..54001ab 100644
--- a/lib/rules/summaryText.test.ts
+++ b/lib/rules/summaryText.test.ts
@@ -103,9 +103,13 @@ describe("short texts", () => {
     expect(shortDuration(785)).toBe("13g 5p");
   });
 
-  it("totalsLine shows bottle ml and dirty diapers", () => {
+  // Spec 2026-11-19 §3.5: only the non-zero parts.
+  it("totalsLine joins the non-zero parts and is null when both are zero", () => {
     expect(totalsLine({ bottleMl: 180, dirtyDiapers: 2 })).toBe(
       "Bình 180 ml · Tã bẩn 2",
     );
+    expect(totalsLine({ bottleMl: 180, dirtyDiapers: 0 })).toBe("Bình 180 ml");
+    expect(totalsLine({ bottleMl: 0, dirtyDiapers: 2 })).toBe("Tã bẩn 2");
+    expect(totalsLine({ bottleMl: 0, dirtyDiapers: 0 })).toBeNull();
   });
 });
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/hero.test.ts lib/rules/status.test.ts lib/rules/summaryText.test.ts components/home/herocard.test.tsx`
Expected: FAIL, `Tests  23 failed | 30 passed (53)`. Lý do đỏ: `statusTiles is not a function`, `kind: 'next'` ở chỗ chờ `awake` hoặc `none`, `'Bình 180 ml · Tã bẩn 0'`.

- [ ] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/home/HeroCard.tsx b/components/home/HeroCard.tsx
index df72d84..ba5b2dd 100644
--- a/components/home/HeroCard.tsx
+++ b/components/home/HeroCard.tsx
@@ -7,7 +7,6 @@ import { TimerRing } from "@/components/ui/TimerRing";
 import {
   formatClock,
   formatMinutes,
-  ringProgress,
   timerLabel,
   type HeroState,
 } from "@/lib/rules/hero";
@@ -25,6 +24,7 @@ const BIG =
 const BIG_LONG =
   "text-[38px] leading-[44px] font-semibold tracking-[-0.02em] text-ink tabular-nums";
 const META = "text-[15px] text-muted tabular-nums";
+const HOUR_MS = 3_600_000;
 const LEFT: TimerButton = { type: "breast", side: "left" };
 const RIGHT: TimerButton = { type: "breast", side: "right" };
 
@@ -50,6 +50,7 @@ export function HeroCardView({
   // Spec 2026-11-17 §5.3: which side to offer first; null shows no hint.
   nextSide?: NextSide | null;
 }) {
+  if (state.kind === "awake" || state.kind === "none") return null;
   // Without a hint the button's only child stays the plain label.
   const feedButton = (button: TimerButton, side: BreastSide, text: string) => (
     <Button
@@ -92,7 +93,7 @@ export function HeroCardView({
       <>
         <TimerRing
           token={categoryOf(log.type).token}
-          progress={ringProgress(elapsed)}
+          progress={(Math.max(0, elapsed) % HOUR_MS) / HOUR_MS}
         >
           <span className={cx(LABEL, "text-muted")}>
             {timerLabel(log)} <PendingMark pending={pending} />
@@ -133,14 +134,6 @@ export function HeroCardView({
         {feedButtons}
       </>
     );
-  } else if (state.kind === "next") {
-    body = (
-      <>
-        <span className={cx(LABEL, "text-muted")}>Cữ bú tiếp theo</span>
-        <span className={BIG}>{formatVnTime(state.due)}</span>
-        <span className={META}>còn {formatMinutes(state.minutesLeft)}</span>
-      </>
-    );
   } else {
     body = (
       <>
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index 1ec110d..47ec5b6 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -165,7 +165,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
           {logs.data && (
             <StatsSection
               tiles={homeStatTiles({ ratings, logs: rows, now })}
-              totals={totalsLine(windowTotals(rows, now))}
+              totals={totalsLine(windowTotals(rows, now)) ?? ""}
             />
           )}
 
diff --git a/lib/rules/hero.ts b/lib/rules/hero.ts
index ea814ea..9a48769 100644
--- a/lib/rules/hero.ts
+++ b/lib/rules/hero.ts
@@ -4,14 +4,16 @@ import { formatDuration } from "./time";
 
 export type HeroState<T extends LogLike> =
   | { kind: "running"; log: T }
+  | { kind: "empty" }
   | { kind: "overdue"; due: Date; lateMinutes: number }
-  | { kind: "next"; due: Date; minutesLeft: number }
-  | { kind: "empty" };
+  | { kind: "awake"; since: Date }
+  | { kind: "none" };
 
 const MINUTE_MS = 60_000;
-const HOUR_MS = 3_600_000;
+const STALE_MS = 12 * 3_600_000;
 
-// Spec §7.2: which state the home hero card shows.
+// Spec 2026-11-19 §3.2: which state the home hero card shows. The first match
+// wins: running, empty, overdue, awake, none.
 export function heroState<T extends LogLike>(input: {
   logs: T[];
   feedIntervalMin: number;
@@ -28,10 +30,19 @@ export function heroState<T extends LogLike>(input: {
   if (running) return { kind: "running", log: running };
   const due = feedDue(logs, feedIntervalMin, now);
   if (!due) return { kind: "empty" };
-  const diff = now.getTime() - due.getTime();
-  return diff >= 0
-    ? { kind: "overdue", due, lateMinutes: Math.floor(diff / MINUTE_MS) }
-    : { kind: "next", due, minutesLeft: Math.ceil(-diff / MINUTE_MS) };
+  const late = now.getTime() - due.getTime();
+  if (late >= 0)
+    return { kind: "overdue", due, lateMinutes: Math.floor(late / MINUTE_MS) };
+  // Nothing is running here, so every sleep has an end.
+  let wokeAt: number | null = null;
+  for (const log of logs) {
+    if (log.type !== "sleep" || log.ended_at === null) continue;
+    const ended = Date.parse(log.ended_at);
+    if (wokeAt === null || ended > wokeAt) wokeAt = ended;
+  }
+  if (wokeAt !== null && now.getTime() - wokeAt <= STALE_MS)
+    return { kind: "awake", since: new Date(wokeAt) };
+  return { kind: "none" };
 }
 
 const TIMER_LABEL: Record<string, string> = {
@@ -78,8 +89,3 @@ export function formatMinutes(minutes: number): string {
   if (minutes < 60) return `${minutes} phút`;
   return `${Math.floor(minutes / 60)} giờ ${String(minutes % 60).padStart(2, "0")} phút`;
 }
-
-// The ring fills once every 60 minutes, then starts again.
-export function ringProgress(ms: number): number {
-  return (Math.max(0, ms) % HOUR_MS) / HOUR_MS;
-}
diff --git a/lib/rules/status.ts b/lib/rules/status.ts
index 3e10be8..5669052 100644
--- a/lib/rules/status.ts
+++ b/lib/rules/status.ts
@@ -1,6 +1,10 @@
 import type { LogLike } from "./describeLog";
+import { detailsSchemas } from "./logDetails";
+import { WINDOW_MS } from "./ratings";
+import { shortDuration } from "./summaryText";
 import { formatDuration, formatVnTime } from "./time";
 
+const MINUTE_MS = 60_000;
 const STALE_MS = 12 * 3_600_000;
 const ms = (iso: string) => Date.parse(iso);
 
@@ -62,3 +66,116 @@ export function homeStatusLines(input: {
     sleepStatusLine(logs, now),
   ].filter((line): line is string => line !== null);
 }
+
+export type StatusTile = {
+  label: string;
+  value: string;
+  note: string;
+  tone: "good" | "warn" | "muted";
+};
+
+function blankTile(label: string, note: string): StatusTile {
+  return { label, value: "—", note, tone: "muted" };
+}
+
+function nextFeedTile(
+  logs: LogLike[],
+  feedIntervalMin: number,
+  now: Date,
+): StatusTile {
+  const label = "Cữ bú tiếp";
+  const feeding = latestBy(
+    logs.filter((l) => l.type === "breast" && l.ended_at === null),
+    (l) => ms(l.started_at),
+  );
+  if (feeding)
+    return {
+      label,
+      value: "Đang bú",
+      note: `từ ${formatVnTime(new Date(feeding.started_at))}`,
+      tone: "muted",
+    };
+  const due = feedDue(logs, feedIntervalMin, now);
+  if (!due) return blankTile(label, "chưa ghi");
+  // Rounded like heroState, so the hero card and this tile agree.
+  const late = now.getTime() - due.getTime();
+  return late >= 0
+    ? {
+        label,
+        value: formatVnTime(due),
+        note: `trễ ${shortDuration(Math.floor(late / MINUTE_MS))}`,
+        tone: "warn",
+      }
+    : {
+        label,
+        value: formatVnTime(due),
+        note: `còn ${shortDuration(Math.ceil(-late / MINUTE_MS))}`,
+        tone: "good",
+      };
+}
+
+// The note of a feed, or null for another type or details that are not valid.
+function feedNote(log: LogLike): string | null {
+  if (log.type === "bottle") {
+    const bottle = detailsSchemas.bottle.safeParse(log.details);
+    return bottle.success ? `bình · ${bottle.data.ml} ml` : null;
+  }
+  if (log.type !== "breast") return null;
+  const breast = detailsSchemas.breast.safeParse(log.details);
+  if (!breast.success) return null;
+  const side = breast.data.side === "left" ? "trái" : "phải";
+  if (log.ended_at === null) return `đang bú ${side}`;
+  // Whole minutes, the way describeLog counts them for the same record.
+  const minutes = Math.floor(
+    (ms(log.ended_at) - ms(log.started_at)) / MINUTE_MS,
+  );
+  return `${side} · ${shortDuration(minutes)}`;
+}
+
+function diaperNote(log: LogLike): string | null {
+  if (log.type !== "diaper") return null;
+  const diaper = detailsSchemas.diaper.safeParse(log.details);
+  if (!diaper.success) return null;
+  return [diaper.data.wet && "ướt", diaper.data.dirty && "bẩn"]
+    .filter(Boolean)
+    .join(" + ");
+}
+
+// The record that started last among those `noteOf` describes. Only the last
+// 24 hours count; older records leave the tile blank with "hơn 24 giờ".
+function lastTile(
+  label: string,
+  logs: LogLike[],
+  now: Date,
+  noteOf: (log: LogLike) => string | null,
+): StatusTile {
+  let last: { at: number; note: string } | null = null;
+  for (const log of logs) {
+    const note = noteOf(log);
+    const at = ms(log.started_at);
+    if (note !== null && (!last || at > last.at)) last = { at, note };
+  }
+  if (!last) return blankTile(label, "chưa ghi");
+  if (now.getTime() - last.at > WINDOW_MS)
+    return blankTile(label, "hơn 24 giờ");
+  return {
+    label,
+    value: formatVnTime(new Date(last.at)),
+    note: last.note,
+    tone: "muted",
+  };
+}
+
+// Spec 2026-11-19 §3.3: the three tiles under the hero card, in this order.
+export function statusTiles(input: {
+  logs: LogLike[];
+  feedIntervalMin: number;
+  now: Date;
+}): StatusTile[] {
+  const { logs, feedIntervalMin, now } = input;
+  return [
+    nextFeedTile(logs, feedIntervalMin, now),
+    lastTile("Bú gần nhất", logs, now, feedNote),
+    lastTile("Tã gần nhất", logs, now, diaperNote),
+  ];
+}
diff --git a/lib/rules/summaryText.ts b/lib/rules/summaryText.ts
index a2016c5..8fd7b9a 100644
--- a/lib/rules/summaryText.ts
+++ b/lib/rules/summaryText.ts
@@ -61,9 +61,13 @@ export function homeStatTiles(input: {
   ];
 }
 
+// Spec 2026-11-19 §3.5: only the non-zero parts; null when both are zero.
 export function totalsLine(totals: {
   bottleMl: number;
   dirtyDiapers: number;
-}): string {
-  return `Bình ${totals.bottleMl} ml · Tã bẩn ${totals.dirtyDiapers}`;
+}): string | null {
+  const parts: string[] = [];
+  if (totals.bottleMl > 0) parts.push(`Bình ${totals.bottleMl} ml`);
+  if (totals.dirtyDiapers > 0) parts.push(`Tã bẩn ${totals.dirtyDiapers}`);
+  return parts.length > 0 ? parts.join(" · ") : null;
 }
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/hero.test.ts lib/rules/status.test.ts lib/rules/summaryText.test.ts components/home/herocard.test.tsx && bun run typecheck`
Expected: `Tests  53 passed (53)`; `tsc --noEmit` không báo lỗi.

Sau patch này code vẫn biên dịch nhờ ba chỉnh tạm: `HeroCard.tsx` bỏ nhánh `next`, tự tính tiến độ vòng tròn bằng hằng `HOUR_MS` cục bộ, và trả `null` cho `awake` và `none`; `HomeScreen.tsx` dùng `totalsLine(...) ?? ""`. M2b và M2c gỡ các chỉnh tạm này.

- [ ] **Step 5: Commit**

```bash
git add -- components/home/HeroCard.tsx components/home/HomeScreen.tsx lib/rules/hero.ts lib/rules/status.ts lib/rules/summaryText.ts components/home/herocard.test.tsx lib/rules/hero.test.ts lib/rules/status.test.ts lib/rules/summaryText.test.ts
git commit -m "feat(home): hero states without next, status tile rule, nullable totals line" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Header: nút Cài đặt và icon `more` (§3.1, §3.4)

**Files:**

- Modify: `components/home/HomeHeader.tsx`
- Modify: `lib/ui/icons.ts`
- Test: `components/home/homeheader.test.tsx` (sửa)
- Test: `lib/ui/categories.test.ts` (sửa)

**Interfaces:**

- Consumes: `Icon`, `ICON_PATHS` (`lib/ui/icons.ts`), `HomeHeaderView`.
- Produces: `ICON_PATHS.more = "M5 12h.01M12 12h.01M19 12h.01"` (tên icon `more`); `HomeHeaderView` có nút thứ ba là `Link` tới `/cai-dat`, `aria-label="Cài đặt"`, đứng giữa nút trăng và nút Khẩn cấp.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/home/homeheader.test.tsx b/components/home/homeheader.test.tsx
index 22fbeb5..3fc8162 100644
--- a/components/home/homeheader.test.tsx
+++ b/components/home/homeheader.test.tsx
@@ -55,6 +55,34 @@ describe("HomeHeaderView", () => {
     expect(day).toContain(`d="${ICON_PATHS.phone}"`);
   });
 
+  // Spec 2026-11-19 §3.1: moon, Cài đặt, Khẩn cấp, each a 44 px circle.
+  it("has a glass Cài đặt link between the moon and the emergency button", () => {
+    const tree = HomeHeaderView({
+      name: "Bun",
+      age: "x",
+      night: false,
+      onToggleNight: () => {},
+    });
+    const settings = findByLabel(tree, "Cài đặt");
+    expect(settings?.props.href).toBe("/cai-dat");
+    expect(settings?.props.className).toContain("glass");
+    const icon = settings?.props.children as ReactElement<AnyProps>;
+    expect(icon.props).toMatchObject({ name: "sliders", size: 20 });
+    expect(day).toContain(`d="${ICON_PATHS.sliders}"`);
+
+    const tags = ["Bật chế độ ban đêm", "Cài đặt", "Khẩn cấp"].map((label) =>
+      day.match(new RegExp(`<(?:a|button)[^>]*aria-label="${label}"[^>]*>`)),
+    );
+    for (const tag of tags) {
+      expect(tag?.[0]).toContain("size-11");
+      expect(tag?.[0]).toContain("rounded-full");
+    }
+    const at = tags.map((tag) => tag?.index ?? -1);
+    expect(at[0]).toBeGreaterThan(-1);
+    expect(at[1]).toBeGreaterThan(at[0]);
+    expect(at[2]).toBeGreaterThan(at[1]);
+  });
+
   it("the moon button says what it will do and shows the state", () => {
     expect(day).toContain('aria-label="Bật chế độ ban đêm"');
     expect(day).toContain('aria-pressed="false"');
diff --git a/lib/ui/categories.test.ts b/lib/ui/categories.test.ts
index e382a65..48535d9 100644
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -45,11 +45,16 @@ describe("log categories", () => {
 });
 
 describe("icon paths", () => {
-  it("has the 42 icons the app uses, each a non-empty path", () => {
-    expect(Object.keys(ICON_PATHS)).toHaveLength(42);
+  it("has the 43 icons the app uses, each a non-empty path", () => {
+    expect(Object.keys(ICON_PATHS)).toHaveLength(43);
     for (const d of Object.values(ICON_PATHS)) expect(d).toMatch(/^[Mm]/);
   });
 
+  // Spec 2026-11-19 §3.4: the "Khác" button on the home page.
+  it("has more: three dots in a row", () => {
+    expect(ICON_PATHS.more).toBe("M5 12h.01M12 12h.01M19 12h.01");
+  });
+
   it("has bowl, glass and bath, each a closed shape plus detail strokes", () => {
     const paths: Record<string, string> = ICON_PATHS;
     for (const name of ["bowl", "glass", "bath"]) {
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/home/homeheader.test.tsx lib/ui/categories.test.ts`
Expected: FAIL, `Tests  3 failed | 10 passed (13)`.

- [ ] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/home/HomeHeader.tsx b/components/home/HomeHeader.tsx
index 612266f..c5038d8 100644
--- a/components/home/HomeHeader.tsx
+++ b/components/home/HomeHeader.tsx
@@ -47,6 +47,14 @@ export function HomeHeaderView({
           aria-pressed={night}
           onClick={onToggleNight}
         />
+        {/* Spec 2026-11-19 §3.1: the third button, between the other two. */}
+        <Link
+          href="/cai-dat"
+          aria-label="Cài đặt"
+          className="glass inline-flex size-11 items-center justify-center rounded-full text-ink"
+        >
+          <Icon name="sliders" size={20} />
+        </Link>
         <Link
           href="/khan-cap"
           aria-label="Khẩn cấp"
diff --git a/lib/ui/icons.ts b/lib/ui/icons.ts
index ebe76b9..1fc1597 100644
--- a/lib/ui/icons.ts
+++ b/lib/ui/icons.ts
@@ -43,6 +43,7 @@ export const ICON_PATHS = {
   phoneApp:
     "M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01",
   plus: "M12 5v14M5 12h14",
+  more: "M5 12h.01M12 12h.01M19 12h.01",
   close: "M6 6l12 12M18 6 6 18",
   check: "M20 6 9 17l-5-5",
   chevronLeft: "m15 6-6 6 6 6",
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/home/homeheader.test.tsx lib/ui/categories.test.ts && bun run typecheck`
Expected: `Tests  13 passed (13)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- components/home/HomeHeader.tsx lib/ui/icons.ts components/home/homeheader.test.tsx lib/ui/categories.test.ts
git commit -m "feat(home): settings button in the header and the more icon" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm giữa chừng M2a

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2a.md` (tick các ô)

**Interfaces:**

- Consumes: mọi thứ Task 1–2 tạo ra.
- Produces: nhánh của plan này làm nền cho M2b. Nhánh không lên `main` trước khi M2c xong.

- [ ] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  151 passed (151)`, `Tests  972 passed (972)`.

- [ ] **Step 2: Commit phần tick**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2a.md
git commit -m "docs(plan): tick the M2a steps" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```
