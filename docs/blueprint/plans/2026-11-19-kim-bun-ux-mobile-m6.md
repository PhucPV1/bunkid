# Kim Bun — UX mobile M6: biểu đồ Thống kê có đơn vị và chuẩn theo tuổi Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§8 trừ gạch đầu dòng thứ nhất đã làm ở M1; phần tương ứng của §11.1 và §11.2)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Biểu đồ ở Thống kê ghi rõ đơn vị, vẽ vùng hoặc đường chuẩn theo tuổi của bé, làm nhạt cột của hôm nay, và dòng dưới bảng giải thích các dấu đó.

**Architecture:**

- **Luật thuần:** `dailyNorm` trong `lib/rules/ratings.ts` dùng lại đúng các ngưỡng đang có, không thêm ngưỡng mới; `statsFootnote` trong `lib/rules/dailyStats.ts` ghép các câu của §8.
- **Giao diện:** `StatsChart` vẽ đơn vị, `ReferenceArea` hoặc `ReferenceLine`, và cột hôm nay nhạt; `StatsScreen` tính tuổi của bé rồi truyền đơn vị và chuẩn xuống.
- Không có migration, không thêm gói (dùng `recharts` 3.10.1 đang có), không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m6`, cắt từ `main` @ `e1e729f`. Baseline: 998 test vitest xanh (151 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a, M2b, M2c | §3 trang Hôm nay | đã xong, đã lên `main` @ `e1e729f` |
| **M6 (plan này)** | phần còn lại của §8 Thống kê | `2026-11-19-kim-bun-ux-mobile-m6.md` |
| M5 | §7 Tiêm chủng (bảng vắc xin × mũi), §9 Khám phá | chưa viết |
| M3 | §4 timer trong tab, §5.4 sheet "+" | chưa viết |
| M4 | §6 Triệu chứng | chưa viết |
| Kết | §11.3 bước 36 của checklist thiết bị | làm sau cùng |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Thứ tự mốc.** Spec §12 xếp M6 sau cùng. M6 không đụng file nào của M3, M4, M5 và bản chạy thử của nó đã xong, nên nó được làm trước. Riêng bước 36 của checklist thiết bị (§11.3) dời xuống sau cùng, khi mọi mốc đã ở trên `main`, vì bước đó tả cả những màn chưa làm.
2. **Commit đầu của nhánh** mang theo bản sửa §7 của spec ngày 2026-11-21 (trang Tiêm chủng thành bảng vắc xin × mũi, theo yêu cầu người dùng). Plan này không làm §7; M5 sẽ làm.
3. **`DailyNorm`** là `{ min: number; max?: number }`. Giấc ngủ tính bằng giờ như trục của biểu đồ; cữ bú và tã ướt là số lần.
4. **Dòng chú thích** là hàm thuần `statsFootnote`. Câu gốc "Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại." giữ nguyên ở đầu; các câu của §8 chỉ nối thêm khi biểu đồ được vẽ.
5. **Trục Y chứa hết vùng chuẩn** nhờ `ifOverflow="extendDomain"` của `recharts`, không tự tính miền giá trị.
6. **Cột hôm nay nhạt** làm bằng prop `shape` của `Bar`: một `Rectangle` có `fillOpacity` 0,45 khi `originalDataIndex` là hàng cuối. Áp cho cả cột phụ (tã bẩn).
7. **Chữ đơn vị** nằm trong `SERIES` của `StatsScreen` (nay được export để test) và được vẽ ở lề trên của biểu đồ, nên lề trên tăng từ 8 lên 24 px.
8. **Test của biểu đồ** soi cây phần tử React mà `StatsChart` trả về, không dựng `recharts` thật; việc vẽ thật kiểm ở Task 4 Step 3.
9. **Kiểm trình duyệt** do phiên chính làm bằng khung Browser trong app ở 375×812; người dùng đã đồng ý dùng khung này trong phiên 2026-11-19.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (quy tắc CSS của hotfix 7822c90): lớp trong chỉ còn màu nền và viền. Không thiết kế gì dựa vào blur của lớp trong. Màn hình không tự cộng `env(safe-area-inset-*)`, trừ các thanh `fixed` ở đáy đang dùng công thức `max(calc(env(safe-area-inset-bottom)+10px),26px)`.
- Mọi giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString` có sẵn.
- Mọi ghi bản ghi (`logs`) đi qua outbox như hiện tại. Spec này không thêm đường ghi mới.
- Chữ về sức khoẻ: không thêm ngưỡng hay câu khuyên mới. Chỉ dùng lại ngưỡng và câu `explain` đang có trong `lib/rules/ratings.ts`.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị xuống dòng hoặc bị cắt "…", trừ tên bé, tên thành viên, tên mũi tiêm, nhãn hàng của bảng tiêm chủng (§7.2, tối đa 3 dòng) và dòng mô tả của thẻ ở Khám phá (§9, tối đa 2 dòng).
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay dừng đồng hồ, không bật tắt công tắc ở Cài đặt.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 935 test vitest (148 file), pgTAP 001–013, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m6.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao của `main` @ `e1e729f` ở ngoài repo; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code, số test đỏ và xanh đúng như ghi; cả bộ sau Task 3 là 1016 test trong 153 file. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status).
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.\n
## Contracts with Other Plans

Plan này đứng sau M2 (đã ở trên `main` @ `e1e729f`). M3, M4, M5 chưa viết và không dùng gì của plan này.

**Consumes (từ `main` @ `e1e729f`):**

- `lib/rules/ratings.ts`: `SLEEP_BANDS`, ngưỡng của `rateFeeds` (8 cữ đến 30 ngày tuổi, 6 cữ từ 31 đến 180 ngày) và `rateWet` (6 tã ướt khi trên 5 ngày tuổi).
- `lib/rules/dailyStats.ts`: `StatsTab`, `hasStatsData`, `dailyStats`.
- `components/stats/StatsChart.tsx`, `components/stats/StatsScreen.tsx`.

**Produces:**

- `lib/rules/ratings.ts`: `DailyNorm`, `dailyNorm(tab, ageDays)`.
- `lib/rules/dailyStats.ts`: `statsFootnote(tab, norm, charted)`.
- `components/stats/StatsChart.tsx`: prop `unit`, `norm`. `components/stats/StatsScreen.tsx`: `SERIES` có `unit`.
- **Vitest sau M6:** 1016 test, 153 file.

---

### Task 1: Luật: chuẩn theo ngày của biểu đồ và dòng chú thích (§8)

**Files:**

- Modify: `lib/rules/dailyStats.ts`
- Modify: `lib/rules/ratings.ts`
- Test: `lib/rules/dailyStats.test.ts` (sửa)
- Test: `lib/rules/ratings.test.ts` (sửa)

**Interfaces:**

- Consumes: `SLEEP_BANDS` và các ngưỡng cữ bú, tã ướt đang có trong `lib/rules/ratings.ts`; `StatsTab` (`lib/rules/dailyStats.ts`).
- Produces: `DailyNorm = { min: number; max?: number }` và `dailyNorm(tab: StatsTab, ageDays: number): DailyNorm | null` trong `lib/rules/ratings.ts` (ngủ tính bằng giờ, bú và tã là số lần); `statsFootnote(tab: StatsTab, norm: DailyNorm | null, charted: boolean): string` trong `lib/rules/dailyStats.ts`.

- [ ] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m6 main
git add docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m6.md
git commit -m "docs(spec): vaccine page as a vaccine-by-dose table, and the M6 plan" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [ ] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/dailyStats.test.ts b/lib/rules/dailyStats.test.ts
index e5432cf..7df1aa2 100644
--- a/lib/rules/dailyStats.test.ts
+++ b/lib/rules/dailyStats.test.ts
@@ -8,6 +8,7 @@ import {
   sleepHours,
   STATS_TABS,
   statsFetchSince,
+  statsFootnote,
 } from "./dailyStats";
 
 const days = ["2026-11-13", "2026-11-14"];
@@ -246,3 +247,35 @@ describe("empty stats", () => {
     );
   });
 });
+
+// Spec 2026-11-19 §8: the note under the table.
+describe("statsFootnote", () => {
+  const BASE = "Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.";
+
+  it("names the shaded band when the norm has a max", () => {
+    expect(statsFootnote("sleep", { min: 14, max: 17 }, true)).toBe(
+      "Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại. Vùng tô nhạt: chuẩn 14–17 giờ mỗi ngày. Cột nhạt là hôm nay, chưa hết ngày.",
+    );
+  });
+
+  it("names the line when the norm only has a min", () => {
+    expect(statsFootnote("feed", { min: 8 }, true)).toBe(
+      `${BASE} Đường kẻ: chuẩn từ 8 cữ mỗi ngày. Cột nhạt là hôm nay, chưa hết ngày.`,
+    );
+    expect(statsFootnote("diaper", { min: 6 }, true)).toBe(
+      `${BASE} Đường kẻ: chuẩn từ 6 tã ướt mỗi ngày. Cột nhạt là hôm nay, chưa hết ngày.`,
+    );
+  });
+
+  it("only explains the pale bar when the tab has no norm", () => {
+    expect(statsFootnote("pump", null, true)).toBe(
+      `${BASE} Cột nhạt là hôm nay, chưa hết ngày.`,
+    );
+  });
+
+  it("keeps to the old note when no chart is drawn", () => {
+    expect(statsFootnote("sleep", { min: 14, max: 17 }, false)).toBe(BASE);
+    expect(statsFootnote("diaper", { min: 6 }, false)).toBe(BASE);
+    expect(statsFootnote("tummy", null, false)).toBe(BASE);
+  });
+});
diff --git a/lib/rules/ratings.test.ts b/lib/rules/ratings.test.ts
index 236a36b..a2380af 100644
--- a/lib/rules/ratings.test.ts
+++ b/lib/rules/ratings.test.ts
@@ -2,7 +2,9 @@ import { describe, expect, it } from "vitest";
 import type { LogLike } from "@/lib/rules/describeLog";
 import {
   countFeedsInWindow,
+  dailyNorm,
   groupFeedSessions,
+  type MetricResult,
   rateLast24h,
   sleepMinutesInWindow,
   wetDiapersInWindow,
@@ -171,3 +173,59 @@ describe("rateLast24h", () => {
     ).toMatchObject({ rating: "red", value: 0 });
   });
 });
+
+// Spec 2026-11-19 §8: the norm the Thống kê chart draws.
+describe("dailyNorm", () => {
+  const AGES = [5, 6, 30, 31, 90, 91, 180, 181];
+
+  it("gives the sleep band of the age, in hours", () => {
+    expect(dailyNorm("sleep", 5)).toEqual({ min: 14, max: 17 });
+    expect(dailyNorm("sleep", 90)).toEqual({ min: 14, max: 17 });
+    expect(dailyNorm("sleep", 91)).toEqual({ min: 12, max: 15 });
+    expect(dailyNorm("sleep", 364)).toEqual({ min: 12, max: 15 });
+    expect(dailyNorm("sleep", 365)).toEqual({ min: 11, max: 14 });
+    expect(dailyNorm("sleep", 729)).toEqual({ min: 11, max: 14 });
+    expect(dailyNorm("sleep", 730)).toEqual({ min: 10, max: 13 });
+  });
+
+  it("gives the feed minimum up to 180 days and nothing after", () => {
+    expect(dailyNorm("feed", 5)).toEqual({ min: 8 });
+    expect(dailyNorm("feed", 30)).toEqual({ min: 8 });
+    expect(dailyNorm("feed", 31)).toEqual({ min: 6 });
+    expect(dailyNorm("feed", 180)).toEqual({ min: 6 });
+    expect(dailyNorm("feed", 181)).toBeNull();
+  });
+
+  it("gives the wet-diaper minimum from day 6", () => {
+    expect(dailyNorm("diaper", 5)).toBeNull();
+    expect(dailyNorm("diaper", 6)).toEqual({ min: 6 });
+    expect(dailyNorm("diaper", 181)).toEqual({ min: 6 });
+  });
+
+  it("has no norm for the other tabs", () => {
+    for (const tab of ["pump", "tummy", "solids"] as const)
+      for (const age of AGES) expect(dailyNorm(tab, age)).toBeNull();
+  });
+
+  it("uses the numbers rateLast24h explains at every boundary age", () => {
+    // What the rating says: its explain line, or its status when not rated.
+    const said = (result: MetricResult) =>
+      result.status === "rated" ? result.explain : result.status;
+    const logs = [log("sleep", 20, 5), ...bottlesEvery3h(8), ...wets(6)];
+    for (const ageDays of AGES) {
+      const day = rateLast24h({ logs, ageDays, firstLogAt: OLD, now: NOW });
+      const sleep = dailyNorm("sleep", ageDays);
+      const feed = dailyNorm("feed", ageDays);
+      const wet = dailyNorm("diaper", ageDays);
+      expect(said(day.sleepMinutes)).toContain(
+        `${sleep?.min}–${sleep?.max} giờ`,
+      );
+      expect(said(day.feeds)).toContain(
+        feed ? `từ ${feed.min} cữ` : "not-rated",
+      );
+      expect(said(day.wetDiapers)).toContain(
+        wet ? `từ ${wet.min} tã` : "not-rated",
+      );
+    }
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/dailyStats.test.ts lib/rules/ratings.test.ts`
Expected: FAIL, `Tests  9 failed | 21 passed (30)`. Lý do đỏ: `dailyNorm` và `statsFootnote` chưa có.

- [ ] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/lib/rules/dailyStats.ts b/lib/rules/dailyStats.ts
index 9a3cf80..e608b21 100644
--- a/lib/rules/dailyStats.ts
+++ b/lib/rules/dailyStats.ts
@@ -1,7 +1,7 @@
 import { addDays, vnDayStartMs } from "./days";
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
-import { groupFeedSessions } from "./ratings";
+import { type DailyNorm, groupFeedSessions } from "./ratings";
 import { vnDateString } from "./time";
 
 export type DayStat = {
@@ -152,3 +152,25 @@ const EMPTY_NOUN: Record<StatsTab, string> = {
 export function emptyStatsText(tab: StatsTab, days: number): string {
   return `Chưa có ${EMPTY_NOUN[tab]} nào trong ${days} ngày`;
 }
+
+const STATS_NOTE =
+  "Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.";
+
+// Spec 2026-11-19 §8: the note under the table. The sentences about the chart
+// are only added when the chart is drawn.
+export function statsFootnote(
+  tab: StatsTab,
+  norm: DailyNorm | null,
+  charted: boolean,
+): string {
+  if (!charted) return STATS_NOTE;
+  const sentences = [STATS_NOTE];
+  if (norm?.max !== undefined)
+    sentences.push(`Vùng tô nhạt: chuẩn ${norm.min}–${norm.max} giờ mỗi ngày.`);
+  else if (norm) {
+    const what = tab === "diaper" ? "tã ướt" : "cữ";
+    sentences.push(`Đường kẻ: chuẩn từ ${norm.min} ${what} mỗi ngày.`);
+  }
+  sentences.push("Cột nhạt là hôm nay, chưa hết ngày.");
+  return sentences.join(" ");
+}
diff --git a/lib/rules/ratings.ts b/lib/rules/ratings.ts
index c2848d3..0e36d9d 100644
--- a/lib/rules/ratings.ts
+++ b/lib/rules/ratings.ts
@@ -1,3 +1,4 @@
+import type { StatsTab } from "./dailyStats";
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
 import { TIMER_LIMIT_MIN } from "./timer";
@@ -231,3 +232,23 @@ export function rateLast24h(input: {
     wetDiapers: rateWet(logs, ageDays, enoughHistory, now),
   };
 }
+
+export type DailyNorm = { min: number; max?: number };
+
+// Spec 2026-11-19 §8: the norm the Thống kê chart draws for one day, from the
+// same thresholds as the ratings above. Sleep is in hours; feeds and wet
+// diapers are counts.
+export function dailyNorm(tab: StatsTab, ageDays: number): DailyNorm | null {
+  if (tab === "sleep") {
+    const band =
+      SLEEP_BANDS.find((b) => ageDays <= b.maxAge) ??
+      SLEEP_BANDS[SLEEP_BANDS.length - 1];
+    return { min: band.min, max: band.max };
+  }
+  if (tab === "feed") {
+    if (ageDays > 180) return null;
+    return { min: ageDays <= 30 ? 8 : 6 };
+  }
+  if (tab === "diaper") return ageDays > 5 ? { min: 6 } : null;
+  return null;
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/dailyStats.test.ts lib/rules/ratings.test.ts && bun run typecheck`
Expected: `Tests  30 passed (30)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- lib/rules/dailyStats.ts lib/rules/ratings.ts lib/rules/dailyStats.test.ts lib/rules/ratings.test.ts
git commit -m "feat(stats): the daily norm and the chart footnote" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: `StatsChart`: đơn vị, vùng hoặc đường chuẩn, cột hôm nay nhạt (§8)

**Files:**

- Modify: `components/stats/StatsChart.tsx`
- Test: `components/stats/statschart.test.tsx` (mới)

**Interfaces:**

- Consumes: `DailyNorm` (Task 1); `ReferenceArea`, `ReferenceLine`, `Rectangle`, `BarShapeProps` của gói `recharts` đang có.
- Produces: `StatsChart` nhận thêm hai prop bắt buộc `unit: string` và `norm: DailyNorm | null`. Có `norm.max` thì vẽ `ReferenceArea` từ `min` tới `max`; chỉ có `min` thì vẽ `ReferenceLine` nét đứt; cả hai dùng `ifOverflow="extendDomain"` để trục Y chứa hết. Cột của hàng cuối có `fillOpacity` 0,45.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/stats/statschart.test.tsx b/components/stats/statschart.test.tsx
new file mode 100644
index 0000000..53921fc
--- /dev/null
+++ b/components/stats/statschart.test.tsx
@@ -0,0 +1,151 @@
+import type { ReactElement } from "react";
+import { renderToStaticMarkup } from "react-dom/server";
+import {
+  Bar,
+  BarChart,
+  type BarShapeProps,
+  Rectangle,
+  ReferenceArea,
+  ReferenceLine,
+  YAxis,
+} from "recharts";
+import { describe, expect, it } from "vitest";
+import { findElements, type TreeProps } from "@/components/ui/testTree";
+import { StatsChart } from "./StatsChart";
+
+type Props = Parameters<typeof StatsChart>[0];
+
+const rows = [
+  { label: "12", primary: 13.5, secondary: null },
+  { label: "13", primary: 15.2, secondary: null },
+  { label: "14", primary: 6, secondary: null },
+];
+const props = (over: Partial<Props> = {}): Props => ({
+  rows,
+  unit: "giờ",
+  norm: null,
+  primaryName: "Giờ ngủ",
+  secondaryName: null,
+  decimals: true,
+  color: "var(--color-cat-sleep)",
+  secondaryColor: null,
+  ...over,
+});
+const diaper = props({
+  rows: rows.map((row, i) => ({ ...row, primary: 5 + i, secondary: i })),
+  unit: "tã",
+  primaryName: "Tã ướt",
+  secondaryName: "Tã bẩn",
+  decimals: false,
+  color: "var(--color-cat-diaper)",
+  secondaryColor: "var(--color-muted)",
+});
+const BAND = { min: 14, max: 17 };
+const LINE = { min: 8 };
+
+// ResponsiveContainer draws nothing without a measured size, so these tests
+// read the elements StatsChart returns instead of the rendered chart.
+const parts = (p: Props, type: unknown) =>
+  findElements(StatsChart(p), (el) => el.type === type);
+// What recharts would draw for row `row` of this <Bar>; `index` is its place
+// among the bars that are drawn.
+const drawn = (bar: ReactElement<TreeProps>, row: number, index = row) =>
+  (bar.props.shape as (bar: BarShapeProps) => ReactElement<TreeProps>)({
+    x: 10,
+    y: 20,
+    width: 30,
+    height: 40,
+    fill: bar.props.fill,
+    originalDataIndex: row,
+    index,
+  } as BarShapeProps);
+
+// Spec 2026-11-19 §8.
+describe("StatsChart", () => {
+  it("writes the unit as a 12 px muted caption in the chart's top-left corner", () => {
+    const html = renderToStaticMarkup(<StatsChart {...props()} />);
+    expect(html).toMatch(
+      /^<div class="relative h-60 w-full"><p class="absolute top-0 left-0 text-\[12px\] leading-4 text-muted">giờ<\/p>/,
+    );
+    expect(renderToStaticMarkup(<StatsChart {...diaper} />)).toContain(
+      'text-muted">tã</p>',
+    );
+    // The chart leaves its top 24 px to the caption.
+    const [chart] = parts(props(), BarChart);
+    expect(chart.props.margin).toMatchObject({ top: 24 });
+  });
+
+  it("shades the norm from min to max when it has a max", () => {
+    const areas = parts(props({ norm: BAND }), ReferenceArea);
+    expect(areas).toHaveLength(1);
+    expect(areas[0].props).toMatchObject({
+      y1: 14,
+      y2: 17,
+      fill: "var(--color-good)",
+      fillOpacity: 0.12,
+    });
+    expect(areas[0].props.x1).toBeUndefined();
+    expect(areas[0].props.x2).toBeUndefined();
+    expect(parts(props({ norm: BAND }), ReferenceLine)).toHaveLength(0);
+    expect(parts(props({ norm: null }), ReferenceArea)).toHaveLength(0);
+  });
+
+  it("draws a dashed line at the minimum when the norm has no max", () => {
+    const lines = parts(props({ norm: LINE }), ReferenceLine);
+    expect(lines).toHaveLength(1);
+    expect(lines[0].props).toMatchObject({
+      y: 8,
+      stroke: "var(--color-good)",
+      strokeDasharray: "4 3",
+    });
+    expect(parts(props({ norm: LINE }), ReferenceArea)).toHaveLength(0);
+    expect(parts(props({ norm: null }), ReferenceLine)).toHaveLength(0);
+  });
+
+  it("makes the Y axis reach the band or the line", () => {
+    // recharts stretches an automatic domain to a reference element that asks
+    // for it, and only when the axis has no fixed domain of its own.
+    const overflow = (p: Props, type: unknown) =>
+      parts(p, type).map((el) => el.props.ifOverflow);
+    expect(overflow(props({ norm: BAND }), ReferenceArea)).toEqual([
+      "extendDomain",
+    ]);
+    expect(overflow(props({ norm: LINE }), ReferenceLine)).toEqual([
+      "extendDomain",
+    ]);
+    const [axis] = parts(props({ norm: BAND }), YAxis);
+    expect(axis.props.domain).toBeUndefined();
+    expect(axis.props.allowDataOverflow).toBeUndefined();
+  });
+
+  it("draws today's bar, the last row, at 0.45 opacity and the others in full", () => {
+    const [bar] = parts(props(), Bar);
+    expect(rows.map((_, i) => drawn(bar, i).props.fillOpacity)).toEqual([
+      1, 1, 0.45,
+    ]);
+    const today = drawn(bar, 2);
+    expect(today.type).toBe(Rectangle);
+    expect(today.props).toMatchObject({
+      x: 10,
+      y: 20,
+      width: 30,
+      height: 40,
+      fill: "var(--color-cat-sleep)",
+    });
+    // Today is found by its row, also when recharts skipped a bar before it.
+    expect(drawn(bar, 2, 1).props.fillOpacity).toBe(0.45);
+    expect(drawn(bar, 1, 2).props.fillOpacity).toBe(1);
+  });
+
+  it("fades both of today's bars on the diaper tab", () => {
+    const bars = parts(diaper, Bar);
+    expect(bars.map((bar) => bar.props.fill)).toEqual([
+      "var(--color-cat-diaper)",
+      "var(--color-muted)",
+    ]);
+    for (const bar of bars)
+      expect(rows.map((_, i) => drawn(bar, i).props.fillOpacity)).toEqual([
+        1, 1, 0.45,
+      ]);
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/stats/statschart.test.tsx`
Expected: FAIL, `Tests  6 failed (6)`.

- [ ] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/stats/StatsChart.tsx b/components/stats/StatsChart.tsx
index d65fb45..1213136 100644
--- a/components/stats/StatsChart.tsx
+++ b/components/stats/StatsChart.tsx
@@ -3,17 +3,24 @@
 import {
   Bar,
   BarChart,
+  type BarShapeProps,
   CartesianGrid,
   Legend,
+  Rectangle,
+  ReferenceArea,
+  ReferenceLine,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
 } from "recharts";
+import type { DailyNorm } from "@/lib/rules/ratings";
 
 // Colours come in as var(--color-…) strings so the chart follows the active theme.
 export function StatsChart({
   rows,
+  unit,
+  norm,
   primaryName,
   secondaryName,
   decimals,
@@ -21,16 +28,33 @@ export function StatsChart({
   secondaryColor,
 }: {
   rows: { label: string; primary: number; secondary: number | null }[];
+  unit?: string;
+  norm?: DailyNorm | null;
   primaryName: string;
   secondaryName: string | null;
   decimals: boolean;
   color: string;
   secondaryColor: string | null;
 }) {
+  // Spec 2026-11-19 §8: the last row is today, which is not over yet, so its
+  // bars are paler.
+  const dayBar = (bar: BarShapeProps) => (
+    <Rectangle
+      {...bar}
+      fillOpacity={bar.originalDataIndex === rows.length - 1 ? 0.45 : 1}
+    />
+  );
   return (
-    <div className="h-60 w-full">
+    <div className="relative h-60 w-full">
+      {/* The unit sits in the chart's top margin, above the Y axis. */}
+      <p className="absolute top-0 left-0 text-[12px] leading-4 text-muted">
+        {unit}
+      </p>
       <ResponsiveContainer width="100%" height="100%">
-        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
+        <BarChart
+          data={rows}
+          margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
+        >
           <CartesianGrid
             vertical={false}
             strokeDasharray="3 3"
@@ -67,12 +91,31 @@ export function StatsChart({
               )}
             />
           )}
+          {/* extendDomain: the Y axis always reaches the whole band or line. */}
+          {norm && norm.max !== undefined && (
+            <ReferenceArea
+              y1={norm.min}
+              y2={norm.max}
+              fill="var(--color-good)"
+              fillOpacity={0.12}
+              ifOverflow="extendDomain"
+            />
+          )}
+          {norm && norm.max === undefined && (
+            <ReferenceLine
+              y={norm.min}
+              stroke="var(--color-good)"
+              strokeDasharray="4 3"
+              ifOverflow="extendDomain"
+            />
+          )}
           <Bar
             dataKey="primary"
             name={primaryName}
             fill={color}
             radius={[6, 6, 0, 0]}
             isAnimationActive={false}
+            shape={dayBar}
           />
           {secondaryName && secondaryColor && (
             <Bar
@@ -81,6 +124,7 @@ export function StatsChart({
               fill={secondaryColor}
               radius={[6, 6, 0, 0]}
               isAnimationActive={false}
+              shape={dayBar}
             />
           )}
         </BarChart>
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/stats/statschart.test.tsx && bun run typecheck`
Expected: `Tests  6 passed (6)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- components/stats/StatsChart.tsx components/stats/statschart.test.tsx
git commit -m "feat(stats): unit, norm band or line and a paler bar for today" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: `StatsScreen`: tuổi của bé, đơn vị, chuẩn và dòng chú thích (§8)

**Files:**

- Modify: `components/stats/StatsChart.tsx`
- Modify: `components/stats/StatsScreen.tsx`
- Test: `components/stats/statsscreen.test.tsx` (mới)

**Interfaces:**

- Consumes: `dailyNorm`, `statsFootnote` (Task 1); `StatsChart` với `unit`, `norm` (Task 2); `ageDays` (`lib/rules/time.ts`); `hasStatsData`.
- Produces: `SERIES` (giờ được export) có thêm `unit` cho từng tab: "giờ", "cữ", "tã", "ml", "phút", "bữa". `StatsScreen` tính `dailyNorm(tab, ageDays(baby.dob, now))` và dùng `statsFootnote` cho dòng dưới bảng.

- [ ] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/stats/statsscreen.test.tsx b/components/stats/statsscreen.test.tsx
new file mode 100644
index 0000000..ebb7764
--- /dev/null
+++ b/components/stats/statsscreen.test.tsx
@@ -0,0 +1,113 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import { STATS_TABS } from "@/lib/rules/dailyStats";
+import type { Baby } from "@/lib/supabase/rows";
+import { SERIES, StatsScreen } from "./StatsScreen";
+
+// 01:00 on 14/11 in Việt Nam, still 13/11 in UTC.
+const NOW = vi.hoisted(() => new Date("2026-11-13T18:00:00Z"));
+const state = vi.hoisted(() => ({
+  logs: {} as Record<string, unknown>,
+  // The props StatsScreen gave the chart; null when it drew no chart.
+  chart: null as Record<string, unknown> | null,
+}));
+
+vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
+vi.mock("@/lib/data/logs", () => ({ useStatsLogs: () => state.logs }));
+vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime: () => {} }));
+// The real chart only loads in the browser; this stands in for it.
+vi.mock("next/dynamic", () => ({
+  default: () => (props: Record<string, unknown>) => {
+    state.chart = props;
+    return <p>chart</p>;
+  },
+}));
+
+const baby = (dob: string) =>
+  ({
+    id: "b1",
+    family_id: "f1",
+    name: "Bun",
+    dob,
+    feed_interval_min: 180,
+  }) as Baby;
+// 21:00 on 12/11 to 05:00 on 13/11 in Việt Nam.
+const SLEEP = {
+  id: "s1",
+  baby_id: "b1",
+  type: "sleep",
+  started_at: "2026-11-12T14:00:00.000Z",
+  ended_at: "2026-11-12T22:00:00.000Z",
+  details: {},
+};
+
+function render(dob: string, data: unknown[]) {
+  state.logs = {
+    data,
+    isPending: false,
+    isError: false,
+    error: null,
+    fetchStatus: "idle",
+    refetch: () => {},
+  };
+  return renderToStaticMarkup(<StatsScreen baby={baby(dob)} />);
+}
+
+const NOTE = "Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.";
+const note = (html: string) =>
+  html.match(/<p class="px-1 text-\[13px\] text-muted">([^<]*)<\/p>/)?.[1];
+
+beforeEach(() => {
+  state.chart = null;
+});
+
+// Spec 2026-11-19 §8.
+describe("StatsScreen", () => {
+  it("gives the chart the tab's unit and the norm for the baby's age at now", () => {
+    // 90 days old on 14/11, the last day of the 14–17 hour band.
+    render("2026-08-16", [SLEEP]);
+    expect(state.chart).toMatchObject({
+      unit: "giờ",
+      norm: { min: 14, max: 17 },
+      primaryName: "Giờ ngủ",
+      color: "var(--color-cat-sleep)",
+    });
+    expect(state.chart?.rows).toHaveLength(7);
+    expect((state.chart?.rows as { label: string }[]).at(-1)?.label).toBe("14");
+    // 91 days old: the next band.
+    render("2026-08-15", [SLEEP]);
+    expect(state.chart).toMatchObject({
+      unit: "giờ",
+      norm: { min: 12, max: 15 },
+    });
+  });
+
+  it("explains the band and the pale bar under the table, only when the chart is drawn", () => {
+    expect(note(render("2026-08-16", [SLEEP]))).toBe(
+      `${NOTE} Vùng tô nhạt: chuẩn 14–17 giờ mỗi ngày. Cột nhạt là hôm nay, chưa hết ngày.`,
+    );
+    expect(note(render("2026-08-15", [SLEEP]))).toBe(
+      `${NOTE} Vùng tô nhạt: chuẩn 12–15 giờ mỗi ngày. Cột nhạt là hôm nay, chưa hết ngày.`,
+    );
+    state.chart = null;
+    const empty = render("2026-08-16", []);
+    expect(state.chart).toBeNull();
+    expect(empty).toContain("Chưa có giấc ngủ nào trong 7 ngày");
+    expect(note(empty)).toBe(NOTE);
+  });
+
+  it("has the spec's unit for every tab", () => {
+    expect(
+      Object.fromEntries(
+        STATS_TABS.map(({ value }) => [value, SERIES[value].unit]),
+      ),
+    ).toEqual({
+      sleep: "giờ",
+      feed: "cữ",
+      diaper: "tã",
+      pump: "ml",
+      tummy: "phút",
+      solids: "bữa",
+    });
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/stats/statsscreen.test.tsx`
Expected: FAIL, `Tests  3 failed (3)`.

- [ ] **Step 3: Sửa code (Patch 6)**

```diff
diff --git a/components/stats/StatsChart.tsx b/components/stats/StatsChart.tsx
index 1213136..c9dcbb2 100644
--- a/components/stats/StatsChart.tsx
+++ b/components/stats/StatsChart.tsx
@@ -28,8 +28,8 @@ export function StatsChart({
   secondaryColor,
 }: {
   rows: { label: string; primary: number; secondary: number | null }[];
-  unit?: string;
-  norm?: DailyNorm | null;
+  unit: string;
+  norm: DailyNorm | null;
   primaryName: string;
   secondaryName: string | null;
   decimals: boolean;
diff --git a/components/stats/StatsScreen.tsx b/components/stats/StatsScreen.tsx
index e6f3cb3..056ef63 100644
--- a/components/stats/StatsScreen.tsx
+++ b/components/stats/StatsScreen.tsx
@@ -20,9 +20,12 @@ import {
   hasStatsData,
   STATS_TABS,
   statsFetchSince,
+  statsFootnote,
   type StatsTab,
 } from "@/lib/rules/dailyStats";
 import { vnDayRange } from "@/lib/rules/days";
+import { dailyNorm } from "@/lib/rules/ratings";
+import { ageDays } from "@/lib/rules/time";
 import type { Baby } from "@/lib/supabase/rows";
 import { StatsTable } from "./StatsTable";
 
@@ -39,11 +42,13 @@ const StatsChart = dynamic(
   { ssr: false, loading: () => <div className="h-60" /> },
 );
 
-const SERIES: Record<
+// Spec 2026-11-19 §8: `unit` is the caption at the chart's top left.
+export const SERIES: Record<
   StatsTab,
   {
     primary: string;
     secondary: string | null;
+    unit: string;
     color: string;
     secondaryColor: string | null;
   }
@@ -51,36 +56,42 @@ const SERIES: Record<
   sleep: {
     primary: "Giờ ngủ",
     secondary: null,
+    unit: "giờ",
     color: "var(--color-cat-sleep)",
     secondaryColor: null,
   },
   feed: {
     primary: "Số cữ bú",
     secondary: null,
+    unit: "cữ",
     color: "var(--color-cat-feed)",
     secondaryColor: null,
   },
   diaper: {
     primary: "Tã ướt",
     secondary: "Tã bẩn",
+    unit: "tã",
     color: "var(--color-cat-diaper)",
     secondaryColor: "var(--color-muted)",
   },
   pump: {
     primary: "Sữa hút (ml)",
     secondary: null,
+    unit: "ml",
     color: "var(--color-cat-pump)",
     secondaryColor: null,
   },
   tummy: {
     primary: "Nằm sấp (phút)",
     secondary: null,
+    unit: "phút",
     color: "var(--color-cat-tummy)",
     secondaryColor: null,
   },
   solids: {
     primary: "Bữa ăn dặm",
     secondary: null,
+    unit: "bữa",
     color: "var(--color-cat-bottle)",
     secondaryColor: null,
   },
@@ -100,6 +111,9 @@ export function StatsScreen({ baby }: { baby: Baby }) {
   const logs = useStatsLogs(baby.id, statsFetchSince(days));
   const stats = dailyStats(logs.data ?? [], days, now);
   const series = SERIES[tab];
+  // Spec 2026-11-19 §8: one age, taken at now, for the whole range.
+  const norm = dailyNorm(tab, ageDays(baby.dob, now));
+  const charted = hasStatsData(stats, tab);
 
   return (
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
@@ -135,10 +149,12 @@ export function StatsScreen({ baby }: { baby: Baby }) {
         />
       ) : (
         <>
-          {hasStatsData(stats, tab) ? (
+          {charted ? (
             <Glass className="p-3">
               <StatsChart
                 rows={chartRows(stats, tab)}
+                unit={series.unit}
+                norm={norm}
                 primaryName={series.primary}
                 secondaryName={series.secondary}
                 decimals={tab === "sleep"}
@@ -153,7 +169,7 @@ export function StatsScreen({ baby }: { baby: Baby }) {
           )}
           <StatsTable stats={stats} tab={tab} now={now} />
           <p className="px-1 text-[13px] text-muted">
-            Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.
+            {statsFootnote(tab, norm, charted)}
           </p>
         </>
       )}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/stats/statsscreen.test.tsx && bun run typecheck`
Expected: `Tests  3 passed (3)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- components/stats/StatsChart.tsx components/stats/StatsScreen.tsx components/stats/statsscreen.test.tsx
git commit -m "feat(stats): pass the age norm and unit to the chart" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M6 và lên `main`

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m6.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ Task 1–3 tạo ra.
- Produces: `main` có M6; các mốc sau cắt nhánh từ `main`.

- [ ] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  153 passed (153)`, `Tests  1016 passed (1016)`.

- [ ] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [ ] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không bấm Lưu, không đụng timer)**

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Dùng khung Browser của app ở cỡ 375×812. Đóng mọi sheet bằng phím Esc.

Mở `http://localhost:3000/thong-ke`. Chỉ bấm các tab và nút "7 ngày" / "14 ngày" (chỉ đổi trạng thái trên màn hình).

1. Tab "Ngủ": góc trên trái biểu đồ có chữ "giờ". Chạy bằng javascript tool: `({ band: document.querySelectorAll(".recharts-reference-area").length, line: document.querySelectorAll(".recharts-reference-line").length, bars: [...document.querySelectorAll(".recharts-bar-rectangle path, .recharts-bar-rectangle rect")].map((b) => b.getAttribute("fill-opacity")), note: [...document.querySelectorAll("main p")].at(-1)?.textContent })`. Kỳ vọng: `band` là 1, `line` là 0; phần tử cuối của `bars` là "0.45", các phần tử khác là "1"; `note` có câu "Vùng tô nhạt: chuẩn {min}–{max} giờ mỗi ngày." đúng theo tuổi của bé (đến 90 ngày: 14–17) và câu "Cột nhạt là hôm nay, chưa hết ngày.". Nếu hôm nay chưa có giấc ngủ nào thì hôm nay không có cột: ghi "chưa kiểm" cho phần cột nhạt, không tính là lỗi.
2. Tab "Bú": chữ "cữ"; `band` 0, `line` 1 (khi bé chưa quá 180 ngày tuổi); câu "Đường kẻ: chuẩn từ {8 | 6} cữ mỗi ngày.".
3. Tab "Tã": chữ "tã"; `line` 1 (khi bé trên 5 ngày tuổi); câu "Đường kẻ: chuẩn từ 6 tã ướt mỗi ngày.".
4. Tab "Hút sữa", "Nằm sấp", "Ăn dặm": chữ "ml", "phút", "bữa"; không có vùng hay đường chuẩn. Tab nào chưa có dữ liệu thì không có biểu đồ và dòng dưới bảng chỉ còn câu gốc "Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.".
5. Vùng hoặc đường chuẩn nằm trọn trong biểu đồ (trục Y cao tới mức chuẩn). `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
6. Lặp mục 1 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`: chữ đọc rõ; ở Ban đêm vùng chuẩn theo tông hổ phách.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được thì ghi "chưa kiểm".

- [ ] **Step 4: Commit phần ghi kết quả, đưa lên `main`, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m6.md
git commit -m "docs(plan): record the M6 check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-ux-mobile-m6
git push origin main
```

Báo cáo cho người dùng: `git log --oneline e1e729f..main`; kết quả typecheck, vitest, build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa.
