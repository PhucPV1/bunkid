# Kim Bun — UX mobile M3a: timer đang chạy nằm trong tab "Hôm nay" Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§4; thứ tự nhóm của §5.4; phần tương ứng của §11.1)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Ngoài trang Hôm nay, timer đang chạy hiện ngay trong tab "Hôm nay" của thanh tab; viên timer nổi và khoảng chừa chỗ cho nó biến mất.

**Architecture:**

- **Luật thuần:** `formatTabClock` cho đồng hồ gọn; `showsTabTimer` thay `showsTimerPill`; `QUICK_ACTION_GROUPS` đổi thứ tự.
- **Giao diện:** `TabBarView` vẽ ô timer; `ActionChrome` không còn dựng `TimerPill`; `Toast` và `AuthGate` bỏ khoảng bù `--pill-offset`.
- **Chưa làm ở plan này (thuộc M3b):** vẽ lại nhóm "Bấm giờ" của sheet "+", tham số `groups`, nút "Khác" ở Hôm nay.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m3a`, cắt từ `main` @ `2448528`. Baseline: 1097 test vitest xanh (158 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a, M2b, M2c | §3 trang Hôm nay | đã xong, đã lên `main` @ `e1e729f` |
| M6 | phần còn lại của §8 Thống kê | đã xong, đã lên `main` @ `34f18f6` |
| M5a, M5b, M5c | §7 Tiêm chủng (bảng vắc xin × mũi), §9 Khám phá | đã xong, đã lên `main` @ `2448528` |
| **M3a (plan này)** | §4 timer trong thanh tab | `2026-11-19-kim-bun-ux-mobile-m3a.md` |
| M3b | §5.4 sheet "+", sửa bước 34 của checklist | `2026-11-19-kim-bun-ux-mobile-m3b.md` |
| M4 | §6 Triệu chứng, khung chờ của trang Hôm nay | chưa viết |
| Kết | §11.3 bước 36 của checklist thiết bị | làm sau cùng |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Bề rộng ô timer.** Spec ghi 121 px; tính cả viền 1 px của `glass-strong` thì ô rộng 119,9 px ở 375 px. Nội dung vẫn vừa: trường hợp chật nhất là timer từ 10 giờ ("10g 00p"), còn dư 0,9 px.
2. **Bố cục thanh tab:** `<ul>` chuyển từ lưới 3 cột sang `flex` ở mọi trang; ba tab thường vẫn bằng nhau, ô timer là `flex-[1.7]`.
3. **Trong ô timer:** cụm nội dung canh giữa, `gap-1.5`, `px-1`; cột chữ canh trái; đồng hồ `text-ink`; icon nét 2,2.
4. **Ô tròn 36 px không có quầng sáng.** Map mới `CATEGORY_SOLID` (nền màu loại, icon `text-bg`), vì `CATEGORY_RUNNING` kèm `ring-4` chỉ dành cho thẻ lớn.
5. **Nền ô timer** dùng lại `CATEGORY_CHIP`; màu chữ của map đó bị `text-ink` ghi đè ở cả hai dòng.
6. **`formatTabClock`:** số âm cho "0:00"; không giới hạn số giờ ("14g 30p"); từ 1 giờ thì bỏ giây.
7. **`pillTimer` giữ tên cũ**; chỉ lời chú thích của nó đổi.
8. **Test của `TimerPill`** bị xoá cùng component. Các ca về đồng hồ, "+n", việc xoá `--pill-offset` và vị trí toast chuyển sang `tabbar.test.tsx` và `toast.test.tsx`. Ca "Dừng" không còn vì nút đó không còn; thay bằng ca "không có nút Dừng".

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m3a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao của `main` @ `2448528` ở ngoài repo; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task và tổng cả bộ ở Task 3 đều đo trên bản sao đó.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status).
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.
- **Lên `main` một lần.** M3a nằm trên nhánh cho tới khi M3b xong; `main` nhận cả hai ở cuối M3b. Lý do: phần kiểm trình duyệt của cả mốc nằm ở cuối M3b, và `main` không nhận code chưa được nhìn trên trình duyệt. Người dùng nói "plan nào xong phần nào thì commit push main luôn"; ở đây "phần" được hiểu là cả mốc M3. Báo lại điều này trong báo cáo cuối.
- **Quyền đẩy `main`.** Mục Global Constraints bên trên chép nguyên văn §2 của spec, trong đó mỗi lần đẩy `main` cần người dùng đồng ý. Với 6 mốc của spec này, lời đồng ý trước ở dòng Status thay cho việc hỏi từng lần. Mọi việc đẩy khác vẫn theo §2.

## Contracts with Other Plans

Plan này đứng sau M5c (đã ở trên `main` @ `2448528`) và ngay trước M3b.

**Consumes (từ `main` @ `2448528`):**

- `lib/rules/timer.ts`: `pillTimer(rows): { log: LogRow; more: number } | null`.
- `lib/rules/hero.ts`: `formatClock`, `timerLabel`. `lib/nav.ts`: `TABS`, `activeTab`, `showsTimerPill`.
- `components/actions/QuickActions.tsx`: `useQuickActions().runningRows`.
- `lib/ui/categories.ts`: `CATEGORY_CHIP`, `CATEGORY_RUNNING`, `categoryOf`.

**Produces** (M3b và M4 được dựa vào đúng những tên này):

- `lib/rules/hero.ts`: `formatTabClock(ms)`. `lib/nav.ts`: `showsTabTimer(pathname)`.
- `lib/rules/quickActions.ts`: `QUICK_ACTION_GROUPS` theo thứ tự `other`, `quick`, `timer`.
- `components/nav/TabBar.tsx`: prop `timer`. `components/actions/ActionChrome.tsx`: không còn `TimerPill`.
- `lib/ui/categories.ts`: `CATEGORY_SOLID`.
- **Vitest sau M3a:** 1107 test, 157 file.

---

### Task 1: Luật: đồng hồ của ô timer, đổi tên `showsTabTimer`, thứ tự nhóm của sheet "+" (§4, §5.4)

**Files:**

- Modify: `components/nav/TimerPill.tsx`
- Modify: `lib/nav.ts`
- Modify: `lib/rules/hero.ts`
- Modify: `lib/rules/quickActions.ts`
- Test: `components/actions/actionsheet.test.tsx` (sửa)
- Test: `lib/nav.test.ts` (sửa)
- Test: `lib/rules/hero.test.ts` (sửa)
- Test: `lib/rules/quickActions.test.ts` (sửa)

**Interfaces:**

- Consumes: `formatClock` (`lib/rules/hero.ts`); `showsTimerPill` (`lib/nav.ts`); `QUICK_ACTION_GROUPS` (`lib/rules/quickActions.ts`).
- Produces: `formatTabClock(ms: number): string` trong `lib/rules/hero.ts` (dưới 1 giờ "M:SS", từ 1 giờ "{h}g {mm}p"); `showsTabTimer(pathname: string): boolean` trong `lib/nav.ts` thay cho `showsTimerPill`, cùng luật `pathname !== "/"`; `QUICK_ACTION_GROUPS` theo thứ tự `other`, `quick`, `timer`.

- [ ] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m3a main
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m3a.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m3b.md
git commit -m "docs(plan): the two M3 plans for the tab timer and the + sheet" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [ ] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/actions/actionsheet.test.tsx b/components/actions/actionsheet.test.tsx
index 2c22c40..7918d95 100644
--- a/components/actions/actionsheet.test.tsx
+++ b/components/actions/actionsheet.test.tsx
@@ -18,14 +18,15 @@ describe("QuickActionGrid", () => {
       <QuickActionGrid running={[]} onPick={() => {}} />,
     );
     const titles = [...html.matchAll(/<h3 class="([^"]*)">([^<]+)<\/h3>/g)];
-    expect(titles.map((m) => m[2])).toEqual(["Bấm giờ", "Ghi nhanh", "Khác"]);
+    // Spec 2026-11-19 §5.4: the most used group sits lowest, near the thumb.
+    expect(titles.map((m) => m[2])).toEqual(["Khác", "Ghi nhanh", "Bấm giờ"]);
     expect(titles[0][1]).toBe(
       "text-[13px] leading-[18px] font-semibold text-muted",
     );
     expect(html.match(/grid grid-cols-4 gap-2/g)).toHaveLength(3);
     const tiles = html.split("<section").slice(1);
     expect(tiles.map((part) => part.match(/<button/g)?.length)).toEqual([
-      5, 4, 4,
+      4, 4, 5,
     ]);
     expect(html.match(/h-\[84px\][^"]*rounded-\[20px\]/g)).toHaveLength(13);
     expect(html.match(/size-\[38px\]/g)).toHaveLength(13);
@@ -60,12 +61,16 @@ describe("QuickActionGrid", () => {
       QuickActionGrid({ running: [], onPick }),
       "button",
     );
-    (buttons[6].props.onClick as () => void)();
+    // Buttons follow the sheet's group order; QUICK_ACTIONS keeps its own.
+    (buttons[5].props.onClick as () => void)();
     expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[6]);
     expect(QUICK_ACTIONS[6].label).toBe("Thay tã");
-    (buttons[12].props.onClick as () => void)();
+    (buttons[3].props.onClick as () => void)();
     expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[12]);
     expect(QUICK_ACTIONS[12]).toMatchObject({ instant: "note" });
+    (buttons[8].props.onClick as () => void)();
+    expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[0]);
+    expect(QUICK_ACTIONS[0].label).toBe("Bú trái");
   });
 });
 
@@ -94,8 +99,9 @@ describe("QuickActionGrid next-side hint (spec 2026-11-17 §5.3)", () => {
       <QuickActionGrid running={[]} onPick={() => {}} suggestSide="left" />,
     );
     expect(html.match(/Nên bú/g)).toHaveLength(1);
-    const first = html.split("<section")[1];
-    expect(first).toMatch(/Nên bú<\/span>.*Bú trái/s);
+    const [other, quick, timers] = html.split("<section").slice(1);
+    expect(timers).toMatch(/Nên bú<\/span>.*Bú trái/s);
+    expect(other + quick).not.toContain("Nên bú");
     expect(html.match(/<button/g)).toHaveLength(13);
   });
 
diff --git a/lib/nav.test.ts b/lib/nav.test.ts
index bb44eec..0d7e901 100644
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -1,4 +1,5 @@
 import { describe, expect, it } from "vitest";
+import * as nav from "./nav";
 import {
   activeTab,
   EXPLORE_EMERGENCY,
@@ -6,7 +7,7 @@ import {
   EXPLORE_REPORT,
   EXPLORE_SOOTHE,
   EXPLORE_TRACK,
-  showsTimerPill,
+  showsTabTimer,
   TABS,
 } from "./nav";
 
@@ -94,11 +95,16 @@ describe("nav", () => {
   });
 });
 
-describe("showsTimerPill (spec 2026-11-17 §5.2)", () => {
+describe("showsTabTimer (spec 2026-11-19 §4)", () => {
   it("is off on Hôm nay, which already has the hero card, and on elsewhere", () => {
-    expect(showsTimerPill("/")).toBe(false);
-    expect(showsTimerPill("/nhat-ky")).toBe(true);
-    expect(showsTimerPill("/kham-pha")).toBe(true);
-    expect(showsTimerPill("/cai-dat/cu-bu")).toBe(true);
+    expect(showsTabTimer("/")).toBe(false);
+    expect(showsTabTimer("/nhat-ky")).toBe(true);
+    expect(showsTabTimer("/kham-pha")).toBe(true);
+    expect(showsTabTimer("/cai-dat")).toBe(true);
+    expect(showsTabTimer("/cai-dat/cu-bu")).toBe(true);
+  });
+
+  it("replaces showsTimerPill: the old name is gone", () => {
+    expect(Object.keys(nav)).not.toContain("showsTimerPill");
   });
 });
diff --git a/lib/rules/hero.test.ts b/lib/rules/hero.test.ts
index 66afcac..ff55a76 100644
--- a/lib/rules/hero.test.ts
+++ b/lib/rules/hero.test.ts
@@ -3,6 +3,7 @@ import type { LogLike } from "./describeLog";
 import {
   formatClock,
   formatMinutes,
+  formatTabClock,
   heroState,
   longTimerText,
   runningLabel,
@@ -144,6 +145,18 @@ describe("hero text helpers", () => {
     expect(formatClock(-5_000)).toBe("0:00");
   });
 
+  // Spec 2026-11-19 §4: the clock on the tab bar's timer tile.
+  it("formatTabClock shows M:SS, then hours and minutes from one hour", () => {
+    expect(formatTabClock(0)).toBe("0:00");
+    expect(formatTabClock(54 * 60_000 + 38_000)).toBe("54:38");
+    expect(formatTabClock(59 * 60_000 + 59_999)).toBe("59:59");
+    expect(formatTabClock(3_600_000)).toBe("1g 00p");
+    expect(formatTabClock(3_900_000)).toBe("1g 05p");
+    expect(formatTabClock(3_959_999)).toBe("1g 05p");
+    expect(formatTabClock(14 * 3_600_000 + 30 * 60_000)).toBe("14g 30p");
+    expect(formatTabClock(-5_000)).toBe("0:00");
+  });
+
   it("formatMinutes switches to hours from 60 minutes", () => {
     expect(formatMinutes(0)).toBe("0 phút");
     expect(formatMinutes(25)).toBe("25 phút");
diff --git a/lib/rules/quickActions.test.ts b/lib/rules/quickActions.test.ts
index 806fb78..d138a81 100644
--- a/lib/rules/quickActions.test.ts
+++ b/lib/rules/quickActions.test.ts
@@ -49,11 +49,12 @@ describe("QUICK_ACTIONS", () => {
     expect(new Set(QUICK_ACTIONS.map((a) => a.key)).size).toBe(13);
   });
 
-  it("QUICK_ACTION_GROUPS titles the three groups; the timer group is exactly the timers", () => {
+  // Spec 2026-11-19 §5.4: the "+" sheet lists Khác, Ghi nhanh, then Bấm giờ.
+  it("QUICK_ACTION_GROUPS titles the three groups, timers last; the timer group is exactly the timers", () => {
     expect(QUICK_ACTION_GROUPS).toEqual([
-      { group: "timer", title: "Bấm giờ" },
-      { group: "quick", title: "Ghi nhanh" },
       { group: "other", title: "Khác" },
+      { group: "quick", title: "Ghi nhanh" },
+      { group: "timer", title: "Bấm giờ" },
     ]);
     for (const action of QUICK_ACTIONS)
       expect(action.group === "timer").toBe(action.kind === "timer");
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/hero.test.ts lib/nav.test.ts lib/rules/quickActions.test.ts components/actions/actionsheet.test.tsx`
Expected: FAIL, `Tests  7 failed | 30 passed (37)`.

- [ ] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/nav/TimerPill.tsx b/components/nav/TimerPill.tsx
index c753e9b..9a37bff 100644
--- a/components/nav/TimerPill.tsx
+++ b/components/nav/TimerPill.tsx
@@ -6,7 +6,7 @@ import { useEffect } from "react";
 import { useQuickActions } from "@/components/actions/QuickActions";
 import { Icon } from "@/components/ui/Icon";
 import { useNow } from "@/lib/hooks/useNow";
-import { showsTimerPill } from "@/lib/nav";
+import { showsTabTimer } from "@/lib/nav";
 import { formatClock, timerLabel } from "@/lib/rules/hero";
 import { pillTimer } from "@/lib/rules/timer";
 import type { LogRow } from "@/lib/supabase/rows";
@@ -90,7 +90,7 @@ function LivePill({ log, more }: { log: LogRow; more: number }) {
 
 export function TimerPill() {
   const actions = useQuickActions();
-  const pill = showsTimerPill(usePathname())
+  const pill = showsTabTimer(usePathname())
     ? pillTimer(actions.runningRows)
     : null;
   return pill ? <LivePill log={pill.log} more={pill.more} /> : null;
diff --git a/lib/nav.ts b/lib/nav.ts
index 11e9d7e..e6c6ed8 100644
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -119,8 +119,8 @@ export function activeTab(pathname: string): TabKey | null {
   return null;
 }
 
-// Spec 2026-11-17 §5.2: the timer pill shows on every page except Hôm nay,
-// where the hero card already shows the running timer.
-export function showsTimerPill(pathname: string): boolean {
+// Spec 2026-11-19 §4: the Hôm nay tab shows the running timer on every page
+// except Hôm nay, where the hero card already shows it.
+export function showsTabTimer(pathname: string): boolean {
   return pathname !== "/";
 }
diff --git a/lib/rules/hero.ts b/lib/rules/hero.ts
index 826318b..90dcc1f 100644
--- a/lib/rules/hero.ts
+++ b/lib/rules/hero.ts
@@ -93,6 +93,16 @@ export function formatClock(ms: number): string {
     : `${minutes}:${seconds}`;
 }
 
+// Spec 2026-11-19 §4: the clock on the tab bar's timer tile. Like formatClock
+// under one hour; from one hour it drops the seconds to stay narrow.
+export function formatTabClock(ms: number): string {
+  const total = Math.max(0, Math.floor(ms / 1000));
+  if (total < 3600) return formatClock(ms);
+  const hours = Math.floor(total / 3600);
+  const minutes = Math.floor((total % 3600) / 60);
+  return `${hours}g ${String(minutes).padStart(2, "0")}p`;
+}
+
 export function formatMinutes(minutes: number): string {
   if (minutes < 60) return `${minutes} phút`;
   return `${Math.floor(minutes / 60)} giờ ${String(minutes % 60).padStart(2, "0")} phút`;
diff --git a/lib/rules/quickActions.ts b/lib/rules/quickActions.ts
index 0439bf2..3046ed8 100644
--- a/lib/rules/quickActions.ts
+++ b/lib/rules/quickActions.ts
@@ -22,16 +22,17 @@ export type QuickAction =
       instant: InstantType;
     };
 
-// Spec 2026-11-17 §3.3: the "+" sheet draws one titled block per group, in this order.
+// Spec 2026-11-19 §5.4: the "+" sheet draws one titled block per group, in this
+// order. The most used group comes last, nearest the thumb.
 export const QUICK_ACTION_GROUPS: { group: QuickActionGroup; title: string }[] =
   [
-    { group: "timer", title: "Bấm giờ" },
-    { group: "quick", title: "Ghi nhanh" },
     { group: "other", title: "Khác" },
+    { group: "quick", title: "Ghi nhanh" },
+    { group: "timer", title: "Bấm giờ" },
   ];
 
-// Group by group, in the order the "+" sheet shows them. The home page's timer row
-// (TimerButtons) takes the kind "timer" entries in this same order.
+// Group by group, timers first: the home page's timer row (TimerButtons) takes
+// the kind "timer" entries in this order. QUICK_ACTION_GROUPS orders the sheet.
 export const QUICK_ACTIONS: QuickAction[] = [
   {
     key: "breast-left",
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/hero.test.ts lib/nav.test.ts lib/rules/quickActions.test.ts components/actions/actionsheet.test.tsx && bun run typecheck`
Expected: `Tests  37 passed (37)`; `tsc --noEmit` không báo lỗi.

Để code vẫn biên dịch, patch này chỉ đổi thêm một chỗ: `components/nav/TimerPill.tsx` gọi `showsTabTimer` thay cho tên cũ. File đó bị xoá ở Task 2. Vì `QUICK_ACTION_GROUPS` đổi thứ tự nên sheet "+" đổi thứ tự nhóm ngay từ task này; ba kiểm tra thứ tự trong `actionsheet.test.tsx` đi cùng patch test.

- [ ] **Step 5: Commit**

```bash
git add -- components/nav/TimerPill.tsx lib/nav.ts lib/rules/hero.ts lib/rules/quickActions.ts components/actions/actionsheet.test.tsx lib/nav.test.ts lib/rules/hero.test.ts lib/rules/quickActions.test.ts
git commit -m "feat(nav): tab clock format, showsTabTimer, Khác first in the + sheet" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Ô timer trong tab "Hôm nay", bỏ viên timer nổi (§4)

**Files:**

- Modify: `app/globals.css`
- Modify: `components/AuthGate.tsx`
- Modify: `components/actions/ActionChrome.tsx`
- Modify: `components/actions/QuickActions.tsx`
- Modify: `components/nav/TabBar.tsx`
- Delete: `components/nav/TimerPill.tsx`
- Modify: `components/ui/Toast.tsx`
- Modify: `lib/rules/timer.ts`
- Modify: `lib/ui/categories.ts`
- Test: `components/actions/actionchrome.test.tsx` (sửa)
- Test: `components/nav/tabbar.test.tsx` (sửa)
- Test: `components/nav/timerpill.test.tsx` (xoá)
- Test: `components/ui/toast.test.tsx` (sửa)
- Test: `lib/ui/categories.test.ts` (sửa)

**Interfaces:**

- Consumes: `formatTabClock`, `showsTabTimer` (Task 1); `pillTimer` (`lib/rules/timer.ts`); `timerLabel`, `formatClock`; `CATEGORY_CHIP`, `categoryOf`; `useNow`; `TABS`.
- Produces: `TabBarView` nhận thêm `timer?: { log: LogRow; more: number } | null`; khi có, tab "Hôm nay" vẽ thành ô timer (component nội bộ `TimerTab`, nơi duy nhất gọi `useNow(1000)`). `TabBar` chỉ truyền `timer` khi `showsTabTimer(pathname)`. `ActionChrome` truyền `pillTimer(actions.runningRows)`. `CATEGORY_SOLID: Record<CategoryToken, string>` mới trong `lib/ui/categories.ts`. `components/nav/TimerPill.tsx`, `--pill-offset` và `data-timer-pill` bị xoá.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/actions/actionchrome.test.tsx b/components/actions/actionchrome.test.tsx
index cdb6b5e..eeceab6 100644
--- a/components/actions/actionchrome.test.tsx
+++ b/components/actions/actionchrome.test.tsx
@@ -1,13 +1,18 @@
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it, vi } from "vitest";
+import { beforeEach, describe, expect, it, vi } from "vitest";
 import { ToastProvider } from "@/components/ui/Toast";
-import type { Baby, FamilyMember } from "@/lib/supabase/rows";
+import { logsKey } from "@/lib/data/logs";
+import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
 import { ActionChrome } from "./ActionChrome";
 import { QuickActionsProvider } from "./QuickActions";
 
+const nav = vi.hoisted(() => ({ pathname: "/nhat-ky" }));
 // TabBar reads the current path; outside the Next router there is none.
-vi.mock("next/navigation", () => ({ usePathname: () => "/nhat-ky" }));
+vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
+vi.mock("@/lib/hooks/useNow", () => ({
+  useNow: () => new Date("2026-11-17T05:00:00Z"),
+}));
 
 const baby = { id: "b1", family_id: "f1", name: "Bun" } as Baby;
 const member = {
@@ -15,21 +20,90 @@ const member = {
   user_id: "u1",
   display_name: "Ba",
 } as FamilyMember;
+const running = (id: string, type: string, started_at: string): LogRow =>
+  ({
+    id,
+    baby_id: "b1",
+    type,
+    started_at,
+    ended_at: null,
+    details: {},
+    note: null,
+    created_by: "u1",
+    created_at: started_at,
+    updated_at: started_at,
+  }) as LogRow;
+// A sleep 12 minutes 34 seconds old and an older tummy timer.
+const TIMERS = [
+  running("t1", "tummy", "2026-11-17T04:00:00.000Z"),
+  running("s1", "sleep", "2026-11-17T04:47:26.000Z"),
+];
+
+function render(logs: LogRow[] = []) {
+  const client = new QueryClient();
+  client.setQueryData(logsKey("b1"), logs);
+  return renderToStaticMarkup(
+    <QueryClientProvider client={client}>
+      <ToastProvider>
+        <QuickActionsProvider baby={baby} member={member} userId="u1">
+          <ActionChrome babyName="Bun" />
+        </QuickActionsProvider>
+      </ToastProvider>
+    </QueryClientProvider>,
+  );
+}
+const homeTab = (html: string) => html.split("<a ")[1];
+
+beforeEach(() => {
+  nav.pathname = "/nhat-ky";
+});
 
 describe("ActionChrome", () => {
   it("draws the tab bar with + and the closed action sheet from the shared state", () => {
-    const html = renderToStaticMarkup(
-      <QueryClientProvider client={new QueryClient()}>
-        <ToastProvider>
-          <QuickActionsProvider baby={baby} member={member} userId="u1">
-            <ActionChrome babyName="Bun" />
-          </QuickActionsProvider>
-        </ToastProvider>
-      </QueryClientProvider>,
-    );
+    const html = render();
     expect(html).toContain('href="/nhat-ky"');
     expect(html).toContain('aria-label="Ghi lại"');
     expect(html).toContain('aria-expanded="false"');
     expect(html).toContain(">Ghi lại cho Bun</h2>");
+    expect(html).toContain(">Hôm nay</a>");
+    expect(html).not.toContain("đã chạy");
+  });
+});
+
+// Spec 2026-11-19 §4.
+describe("ActionChrome with a running timer", () => {
+  it("off Hôm nay, the Hôm nay tab shows the latest timer and counts the rest", () => {
+    const html = render(TIMERS);
+    const home = homeTab(html);
+    expect(home).toContain('href="/"');
+    expect(home).toContain('aria-label="Hôm nay, Ngủ đã chạy 12:34"');
+    expect(home).toContain(">12:34</span>");
+    expect(home).toContain(">Hôm nay · +1</span>");
+    expect(home).not.toContain("aria-current");
+  });
+
+  it("has no floating pill and no Dừng button of its own", () => {
+    const html = render(TIMERS);
+    expect(html).not.toContain(">Dừng</button>");
+    expect(html).not.toContain("+70px)]");
+    // Only the tab bar and the sheet are glass.
+    expect(html.match(/glass-strong/g)).toHaveLength(2);
+  });
+
+  it("on Hôm nay the tab is drawn as before: the hero card has the timer", () => {
+    nav.pathname = "/";
+    const html = render(TIMERS);
+    expect(html).toContain(">Hôm nay</a>");
+    expect(html).not.toContain("đã chạy");
+    expect(html).not.toContain("flex-[1.7]");
+    expect(homeTab(html)).toContain("bg-accent-tint text-accent-text");
+  });
+
+  it("on Cài đặt the timer tile is the current tab, in the category tint", () => {
+    nav.pathname = "/cai-dat";
+    const home = homeTab(render(TIMERS));
+    expect(home).toContain('aria-current="page"');
+    expect(home).toContain("bg-cat-sleep/15");
+    expect(home).not.toContain("bg-accent-tint");
   });
 });
diff --git a/components/nav/tabbar.test.tsx b/components/nav/tabbar.test.tsx
index 41095ce..c8aed23 100644
--- a/components/nav/tabbar.test.tsx
+++ b/components/nav/tabbar.test.tsx
@@ -1,9 +1,36 @@
+import { existsSync, readFileSync } from "node:fs";
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it, vi } from "vitest";
+import { beforeEach, describe, expect, it, vi } from "vitest";
 import { hostElements } from "@/components/ui/testTree";
+import type { LogRow } from "@/lib/supabase/rows";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { TabBarView } from "./TabBar";
 
+const NOW = vi.hoisted(() => new Date("2026-11-17T05:00:00Z"));
+const useNow = vi.hoisted(() => vi.fn((_ms: number) => NOW));
+vi.mock("@/lib/hooks/useNow", () => ({ useNow }));
+
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
+// <Link> is a component, not an <a> host element, so read the rendered HTML.
+const anchorsOf = (html: string) => html.split("<a ").slice(1);
+
+beforeEach(() => {
+  useNow.mockClear();
+});
+
 describe("TabBarView", () => {
   it("is a floating glass pill with three icon tabs", () => {
     const html = renderToStaticMarkup(<TabBarView current="history" />);
@@ -22,10 +49,9 @@ describe("TabBarView", () => {
   });
 
   it("marks only the current tab", () => {
-    // <Link> is a component, not an <a> host element, so read the rendered HTML instead.
-    const anchors = renderToStaticMarkup(<TabBarView current="history" />)
-      .split("<a ")
-      .slice(1);
+    const anchors = anchorsOf(
+      renderToStaticMarkup(<TabBarView current="history" />),
+    );
     expect(anchors.map((a) => a.includes('aria-current="page"'))).toEqual([
       false,
       true,
@@ -78,3 +104,136 @@ describe("TabBarView", () => {
     expect(open).toContain("opacity-60");
   });
 });
+
+// Spec 2026-11-19 §4: the running timer lives in the Hôm nay tab.
+describe("TabBarView timer tile", () => {
+  const itemsOf = (html: string) =>
+    [...html.matchAll(/<li class="([^"]*)">/g)].map((m) => m[1]);
+
+  it("without a timer the three tabs share the bar equally and nothing ticks", () => {
+    for (const html of [
+      renderToStaticMarkup(<TabBarView current="history" />),
+      renderToStaticMarkup(<TabBarView current="history" timer={null} />),
+    ]) {
+      expect(itemsOf(html)).toEqual([
+        "flex flex-1",
+        "flex flex-1",
+        "flex flex-1",
+      ]);
+      expect(html).toContain(">Hôm nay</a>");
+      expect(html).not.toContain("tabular-nums");
+    }
+    expect(useNow).not.toHaveBeenCalled();
+  });
+
+  it("draws the Hôm nay tab as a wider tile with the timer's circle and clock", () => {
+    const html = renderToStaticMarkup(
+      <TabBarView
+        current="history"
+        onPlus={() => {}}
+        timer={{ log: row({}), more: 0 }}
+      />,
+    );
+    expect(itemsOf(html)).toEqual([
+      "flex flex-[1.7]",
+      "flex flex-1",
+      "flex flex-1",
+    ]);
+    const anchors = anchorsOf(html);
+    expect(anchors).toHaveLength(3);
+    const [home, history] = anchors;
+    // Still a link to Hôm nay, where the timer can be stopped.
+    expect(home).toContain('href="/"');
+    expect(home).toContain('aria-label="Hôm nay, Bú trái đã chạy 12:34"');
+    expect(home).toContain("rounded-full px-1 bg-cat-feed/15");
+    expect(home).not.toContain("bg-accent-tint");
+    expect(home).not.toContain("aria-current");
+    expect(home).toContain(
+      "size-9 shrink-0 items-center justify-center rounded-full bg-cat-feed text-bg",
+    );
+    expect(home).toContain('width="18" height="18"');
+    expect(home).toContain(`d="${ICON_PATHS.heart}"`);
+    expect(home).not.toContain(`d="${ICON_PATHS.home}"`);
+    expect(home).toContain(
+      '<span class="text-[17px] leading-5 font-bold whitespace-nowrap text-ink tabular-nums">12:34</span>',
+    );
+    expect(home).toContain(
+      '<span class="text-[10px] leading-3 font-semibold whitespace-nowrap text-ink">Hôm nay</span>',
+    );
+    // The other two tabs are drawn as before.
+    expect(history).toContain('aria-current="page"');
+    expect(history).toContain("bg-accent-tint text-accent-text");
+    expect(history).toContain(">Nhật ký</a>");
+    expect(html).toContain(">Khám phá</a>");
+    // Nothing stops the timer from here: the only button is "+".
+    expect(html).not.toContain("Dừng");
+    expect(html.match(/<button/g)).toHaveLength(1);
+  });
+
+  it("only the tile ticks, once a second", () => {
+    renderToStaticMarkup(
+      <TabBarView current="history" timer={{ log: row({}), more: 0 }} />,
+    );
+    expect(useNow.mock.calls).toEqual([[1000]]);
+  });
+
+  it("shows hours and minutes past one hour and counts the other timers", () => {
+    const html = renderToStaticMarkup(
+      <TabBarView
+        current="explore"
+        timer={{
+          log: row({
+            type: "sleep",
+            details: {},
+            started_at: "2026-11-17T03:29:55.000Z",
+          }),
+          more: 2,
+        }}
+      />,
+    );
+    const [home] = anchorsOf(html);
+    expect(home).toContain('aria-label="Hôm nay, Ngủ đã chạy 1:30:05"');
+    expect(home).toContain(">1g 30p</span>");
+    expect(home).toContain(">Hôm nay · +2</span>");
+    expect(home).toContain("bg-cat-sleep/15");
+    expect(home).toContain("rounded-full bg-cat-sleep text-bg");
+    expect(home).toContain(`d="${ICON_PATHS.moon}"`);
+    // No separate round counter: the tile is too narrow for one.
+    expect(home).not.toContain(">+2<");
+  });
+
+  it("on Cài đặt the tile stays the current tab but keeps the category tint", () => {
+    const anchors = anchorsOf(
+      renderToStaticMarkup(
+        <TabBarView current="home" timer={{ log: row({}), more: 0 }} />,
+      ),
+    );
+    expect(anchors.map((a) => a.includes('aria-current="page"'))).toEqual([
+      true,
+      false,
+      false,
+    ]);
+    expect(anchors[0]).toContain("bg-cat-feed/15");
+    expect(anchors.join("")).not.toContain("bg-accent-tint");
+  });
+
+});
+
+// Spec 2026-11-19 §4: the floating pill is gone, and so is the room it took.
+describe("the old timer pill", () => {
+  it("has no component left", () => {
+    expect(existsSync("components/nav/TimerPill.tsx")).toBe(false);
+  });
+
+  it("globals.css keeps no offset for it", () => {
+    const css = readFileSync("app/globals.css", "utf8");
+    expect(css).not.toContain("--pill-offset");
+    expect(css).not.toContain("data-timer-pill");
+  });
+
+  it("the page's bottom padding is back to 120 px", () => {
+    const gate = readFileSync("components/AuthGate.tsx", "utf8");
+    expect(gate.match(/pb-\[120px\]/g)).toHaveLength(2);
+    expect(gate).not.toContain("pill-offset");
+  });
+});
diff --git a/components/nav/timerpill.test.tsx b/components/nav/timerpill.test.tsx
deleted file mode 100644
index cb9f25a..0000000
--- a/components/nav/timerpill.test.tsx
+++ /dev/null
@@ -1,106 +0,0 @@
-import { readFileSync } from "node:fs";
-import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it, vi } from "vitest";
-import { hostElements } from "@/components/ui/testTree";
-import type { LogRow } from "@/lib/supabase/rows";
-import { ICON_PATHS } from "@/lib/ui/icons";
-import { TimerPillView } from "./TimerPill";
-
-const NOW = new Date("2026-11-17T05:00:00Z");
-const row = (over: Partial<LogRow>): LogRow =>
-  ({
-    id: "l1",
-    baby_id: "b1",
-    type: "breast",
-    started_at: "2026-11-17T04:47:26.000Z", // 12 phút 34 giây trước
-    ended_at: null,
-    details: { side: "left" },
-    note: null,
-    created_by: "u1",
-    created_at: "2026-11-17T04:47:26.000Z",
-    updated_at: "2026-11-17T04:47:26.000Z",
-    ...over,
-  }) as LogRow;
-
-describe("TimerPillView (spec 2026-11-17 §5.2)", () => {
-  it("is one glass pill above the tab bar with the timer, its clock and Dừng", () => {
-    const html = renderToStaticMarkup(
-      <TimerPillView
-        log={row({})}
-        more={0}
-        now={NOW}
-        busy={false}
-        onStop={() => {}}
-      />,
-    );
-    expect(html.match(/glass-strong/g)).toHaveLength(1);
-    // No plain `glass` class anywhere: nothing inside the pill blurs again.
-    expect(html).not.toMatch(/class="(?:[^"]* )?glass(?: [^"]*)?"/);
-    expect(html).toContain(
-      "bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+70px)]",
-    );
-    expect(html).toContain("fixed");
-    expect(html).toContain("z-10");
-    expect(html).toContain("h-11");
-    expect(html).toContain("print:hidden");
-    expect(html).toContain('href="/"');
-    expect(html).toContain("size-8");
-    expect(html).toContain("bg-cat-feed/15 text-cat-feed");
-    expect(html).toContain(`d="${ICON_PATHS.heart}"`);
-    expect(html).toContain("Bú trái ·");
-    expect(html).toContain('<span class="tabular-nums">12:34</span>');
-    expect(html).toContain("min-w-16");
-    expect(html).toContain("text-accent-text");
-    expect(html).toContain(">Dừng</button>");
-    // No "+n" counter when it is the only timer.
-    expect(html).not.toContain(">+");
-  });
-
-  it("counts the other running timers and shows hours past one hour", () => {
-    const html = renderToStaticMarkup(
-      <TimerPillView
-        log={row({
-          type: "sleep",
-          details: {},
-          started_at: "2026-11-17T03:29:55.000Z",
-        })}
-        more={2}
-        now={NOW}
-        busy={false}
-        onStop={() => {}}
-      />,
-    );
-    expect(html).toContain("Ngủ ·");
-    expect(html).toContain(">1:30:05</span>");
-    expect(html).toContain(">+2</span>");
-  });
-
-  it("Dừng stops the shown timer and is disabled while busy", () => {
-    const onStop = vi.fn();
-    const [button] = hostElements(
-      TimerPillView({ log: row({}), more: 0, now: NOW, busy: true, onStop }),
-      "button",
-    );
-    expect(button.props.disabled).toBe(true);
-    (button.props.onClick as () => void)();
-    expect(onStop).toHaveBeenCalledTimes(1);
-  });
-});
-
-describe("room for the timer pill (spec 2026-11-17 §5.2)", () => {
-  it("globals.css defines --pill-offset, 52px while the pill shows", () => {
-    const css = readFileSync("app/globals.css", "utf8");
-    expect(css).toMatch(/:root\s*\{\s*--pill-offset:\s*0px;\s*\}/);
-    expect(css).toMatch(
-      /:root\[data-timer-pill="on"\]\s*\{\s*--pill-offset:\s*52px;\s*\}/,
-    );
-  });
-
-  it("the page's bottom padding grows by the same offset", () => {
-    const gate = readFileSync("components/AuthGate.tsx", "utf8");
-    expect(
-      gate.match(/pb-\[calc\(120px\+var\(--pill-offset\)\)\]/g),
-    ).toHaveLength(2);
-    expect(gate).not.toContain("pb-[120px]");
-  });
-});
diff --git a/components/ui/toast.test.tsx b/components/ui/toast.test.tsx
index f5ec78e..74820b9 100644
--- a/components/ui/toast.test.tsx
+++ b/components/ui/toast.test.tsx
@@ -10,10 +10,11 @@ describe("ToastView", () => {
     );
     expect(html).toContain('role="status"');
     expect(html).toContain('aria-live="polite"');
-    // Spec 2026-11-17 §5.2: rises by the pill's height when the timer pill shows.
+    // Spec 2026-11-19 §4: no timer pill to rise above any more.
     expect(html).toContain(
-      "bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px+var(--pill-offset))]",
+      "bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px)]",
     );
+    expect(html).not.toContain("pill-offset");
     expect(html).toContain("print:hidden");
     expect(html).not.toContain("glass-strong");
   });
diff --git a/lib/ui/categories.test.ts b/lib/ui/categories.test.ts
index 6f42f96..0c1b87a 100644
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -4,6 +4,7 @@ import {
   CATEGORIES,
   CATEGORY_CHIP,
   CATEGORY_RUNNING,
+  CATEGORY_SOLID,
   categoryOf,
 } from "./categories";
 import { ICON_PATHS } from "./icons";
@@ -61,6 +62,14 @@ describe("category class maps", () => {
     );
     expect(Object.keys(CATEGORY_RUNNING)).toHaveLength(8);
   });
+
+  // Spec 2026-11-19 §4: the 36 px circle of the tab bar's timer tile.
+  it("CATEGORY_SOLID fills every category with its colour, without a halo", () => {
+    expect(CATEGORY_SOLID["cat-sleep"]).toBe("bg-cat-sleep text-bg");
+    expect(Object.keys(CATEGORY_SOLID)).toHaveLength(8);
+    for (const classes of Object.values(CATEGORY_SOLID))
+      expect(classes).not.toContain("ring");
+  });
 });
 
 describe("icon paths", () => {
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/nav/tabbar.test.tsx components/ui/toast.test.tsx components/actions/actionchrome.test.tsx lib/ui/categories.test.ts`
Expected: FAIL, `Tests  13 failed | 20 passed (33)`.

- [ ] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/app/globals.css b/app/globals.css
index cd25cd2..e2a6b24 100644
--- a/app/globals.css
+++ b/app/globals.css
@@ -308,16 +308,6 @@
   }
 }
 
-/* Spec 2026-11-17 §5.2: room for the timer pill (44 px + 8 px) above the tab bar.
-   TimerPill sets data-timer-pill on <html> while it shows. */
-:root {
-  --pill-offset: 0px;
-}
-
-:root[data-timer-pill="on"] {
-  --pill-offset: 52px;
-}
-
 @utility glass {
   background: var(--color-glass);
   border: 1px solid var(--color-edge);
diff --git a/components/AuthGate.tsx b/components/AuthGate.tsx
index 9e48b09..80e259e 100644
--- a/components/AuthGate.tsx
+++ b/components/AuthGate.tsx
@@ -93,14 +93,14 @@ export function AuthGate({
   if (!session || !baby || !member)
     return (
       <>
-        <div className="pb-[calc(120px+var(--pill-offset))]">{content}</div>
+        <div className="pb-[120px]">{content}</div>
         <TabBar />
       </>
     );
   return (
     <QuickActionsProvider baby={baby} member={member} userId={session.user.id}>
       <SyncBarProvider userId={session.user.id}>
-        <div className="pb-[calc(120px+var(--pill-offset))]">{content}</div>
+        <div className="pb-[120px]">{content}</div>
       </SyncBarProvider>
       <ActionChrome babyName={baby.name} />
     </QuickActionsProvider>
diff --git a/components/actions/ActionChrome.tsx b/components/actions/ActionChrome.tsx
index e3110c6..da4f748 100644
--- a/components/actions/ActionChrome.tsx
+++ b/components/actions/ActionChrome.tsx
@@ -1,20 +1,22 @@
 "use client";
 
 import { TabBar } from "@/components/nav/TabBar";
-import { TimerPill } from "@/components/nav/TimerPill";
+import { pillTimer } from "@/lib/rules/timer";
 import { ActionSheet } from "./ActionSheet";
 import { useQuickActions } from "./QuickActions";
 
-// The tab bar with its "+" button, the timer pill above it and the 13-action sheet. Whether the sheet is open lives in
-// QuickActionsProvider, so a page (e.g. an empty Nhật ký) can open it too.
+// The tab bar with its "+" button and the 13-action sheet. The bar draws the
+// running timer in its Hôm nay tab (spec 2026-11-19 §4). Whether the sheet is
+// open lives in QuickActionsProvider, so a page (e.g. an empty Nhật ký) can
+// open it too.
 export function ActionChrome({ babyName }: { babyName: string }) {
   const actions = useQuickActions();
   return (
     <>
-      <TimerPill />
       <TabBar
         onPlus={actions.toggleActionSheet}
         plusOpen={actions.actionSheetOpen}
+        timer={pillTimer(actions.runningRows)}
       />
       <ActionSheet
         open={actions.actionSheetOpen}
diff --git a/components/actions/QuickActions.tsx b/components/actions/QuickActions.tsx
index 4141787..d08cdce 100644
--- a/components/actions/QuickActions.tsx
+++ b/components/actions/QuickActions.tsx
@@ -46,7 +46,8 @@ import { tapFeedback } from "@/lib/ui/haptics";
 
 export type QuickActionsValue = {
   running: RunningLog[];
-  // The running timers as full rows, for the timer pill (spec 2026-11-17 §5.2).
+  // The running timers as full rows, for the tab bar's timer tile
+  // (spec 2026-11-19 §4).
   runningRows: LogRow[];
   // Spec 2026-11-17 §5.3: the breast side to label "Nên bú", or null.
   suggestSide: BreastSide | null;
diff --git a/components/nav/TabBar.tsx b/components/nav/TabBar.tsx
index 5d69786..647b585 100644
--- a/components/nav/TabBar.tsx
+++ b/components/nav/TabBar.tsx
@@ -3,17 +3,83 @@
 import Link from "next/link";
 import { usePathname } from "next/navigation";
 import { Icon } from "@/components/ui/Icon";
-import { activeTab, TABS, type TabKey } from "@/lib/nav";
+import { useNow } from "@/lib/hooks/useNow";
+import {
+  activeTab,
+  showsTabTimer,
+  TABS,
+  type Tab,
+  type TabKey,
+} from "@/lib/nav";
+import { formatClock, formatTabClock, timerLabel } from "@/lib/rules/hero";
+import type { LogRow } from "@/lib/supabase/rows";
+import {
+  CATEGORY_CHIP,
+  CATEGORY_SOLID,
+  categoryOf,
+} from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 
+// The running timer the Hôm nay tab shows, and how many others are running.
+export type TabTimer = { log: LogRow; more: number };
+
+// Spec 2026-11-19 §4: the Hôm nay tab while a timer runs on another page. Only
+// this component ticks every second, and only while the tile shows.
+function TimerTab({
+  tab,
+  timer,
+  current,
+}: {
+  tab: Tab;
+  timer: TabTimer;
+  current: boolean;
+}) {
+  const now = useNow(1000);
+  const { log, more } = timer;
+  const category = categoryOf(log.type);
+  const ms = now.getTime() - Date.parse(log.started_at);
+  return (
+    <Link
+      href={tab.href}
+      aria-current={current ? "page" : undefined}
+      aria-label={`${tab.label}, ${timerLabel(log)} đã chạy ${formatClock(ms)}`}
+      className={cx(
+        "flex flex-1 items-center justify-center gap-1.5 rounded-full px-1",
+        CATEGORY_CHIP[category.token],
+      )}
+    >
+      <span
+        className={cx(
+          "flex size-9 shrink-0 items-center justify-center rounded-full",
+          CATEGORY_SOLID[category.token],
+        )}
+      >
+        <Icon name={category.icon} size={18} strokeWidth={2.2} />
+      </span>
+      <span className="flex flex-col">
+        <span className="text-[17px] leading-5 font-bold whitespace-nowrap text-ink tabular-nums">
+          {formatTabClock(ms)}
+        </span>
+        {/* text-ink: text-muted is too faint on the tint in Ban đêm. */}
+        <span className="text-[10px] leading-3 font-semibold whitespace-nowrap text-ink">
+          {more > 0 ? `${tab.label} · +${more}` : tab.label}
+        </span>
+      </span>
+    </Link>
+  );
+}
+
 export function TabBarView({
   current,
   onPlus,
   plusOpen = false,
+  timer = null,
 }: {
   current: TabKey | null;
   onPlus?: () => void;
   plusOpen?: boolean;
+  // Spec 2026-11-19 §4: turns the Hôm nay tab into the wider timer tile.
+  timer?: TabTimer | null;
 }) {
   return (
     <nav
@@ -22,25 +88,33 @@ export function TabBarView({
     >
       <ul
         className={cx(
-          "glass-strong grid h-[62px] flex-1 grid-cols-3 rounded-full p-1 shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=dark]:shadow-[0_10px_30px_rgb(0_0_0/0.25)] in-data-[theme=night]:shadow-none",
+          "glass-strong flex h-[62px] flex-1 rounded-full p-1 shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=dark]:shadow-[0_10px_30px_rgb(0_0_0/0.25)] in-data-[theme=night]:shadow-none",
           plusOpen && "opacity-60",
         )}
       >
         {TABS.map((tab) => {
           const active = tab.key === current;
+          const tile = tab.key === "home" ? timer : null;
           return (
-            <li key={tab.key} className="flex">
-              <Link
-                href={tab.href}
-                aria-current={active ? "page" : undefined}
-                className={cx(
-                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] leading-3 font-semibold",
-                  active ? "bg-accent-tint text-accent-text" : "text-ink/80",
-                )}
-              >
-                <Icon name={tab.icon} size={22} />
-                {tab.label}
-              </Link>
+            <li
+              key={tab.key}
+              className={cx("flex", tile ? "flex-[1.7]" : "flex-1")}
+            >
+              {tile ? (
+                <TimerTab tab={tab} timer={tile} current={active} />
+              ) : (
+                <Link
+                  href={tab.href}
+                  aria-current={active ? "page" : undefined}
+                  className={cx(
+                    "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] leading-3 font-semibold",
+                    active ? "bg-accent-tint text-accent-text" : "text-ink/80",
+                  )}
+                >
+                  <Icon name={tab.icon} size={22} />
+                  {tab.label}
+                </Link>
+              )}
             </li>
           );
         })}
@@ -70,15 +144,20 @@ export function TabBarView({
 export function TabBar({
   onPlus,
   plusOpen,
+  timer = null,
 }: {
   onPlus?: () => void;
   plusOpen?: boolean;
+  timer?: TabTimer | null;
 }) {
+  const pathname = usePathname();
   return (
     <TabBarView
-      current={activeTab(usePathname())}
+      current={activeTab(pathname)}
       onPlus={onPlus}
       plusOpen={plusOpen}
+      // Hôm nay already shows the running timer on its hero card.
+      timer={showsTabTimer(pathname) ? timer : null}
     />
   );
 }
diff --git a/components/nav/TimerPill.tsx b/components/nav/TimerPill.tsx
deleted file mode 100644
index 9a37bff..0000000
--- a/components/nav/TimerPill.tsx
+++ /dev/null
@@ -1,97 +0,0 @@
-"use client";
-
-import Link from "next/link";
-import { usePathname } from "next/navigation";
-import { useEffect } from "react";
-import { useQuickActions } from "@/components/actions/QuickActions";
-import { Icon } from "@/components/ui/Icon";
-import { useNow } from "@/lib/hooks/useNow";
-import { showsTabTimer } from "@/lib/nav";
-import { formatClock, timerLabel } from "@/lib/rules/hero";
-import { pillTimer } from "@/lib/rules/timer";
-import type { LogRow } from "@/lib/supabase/rows";
-import { CATEGORY_CHIP, categoryOf } from "@/lib/ui/categories";
-import { cx } from "@/lib/ui/cx";
-
-// Spec 2026-11-17 §5.2 (drawing A1): the running timer, 8 px above the 62 px tab bar.
-export function TimerPillView({
-  log,
-  more,
-  now,
-  busy,
-  onStop,
-}: {
-  log: LogRow;
-  more: number;
-  now: Date;
-  busy: boolean;
-  onStop: () => void;
-}) {
-  const category = categoryOf(log.type);
-  return (
-    <div className="glass-strong fixed bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+70px)] left-1/2 z-10 flex h-11 -translate-x-1/2 items-center overflow-hidden rounded-full shadow-[0_8px_22px_rgb(0_0_0/0.14)] in-data-[theme=night]:shadow-none print:hidden">
-      <Link
-        href="/"
-        className="flex h-11 items-center gap-2 pr-3 pl-1.5 text-[15px] font-semibold whitespace-nowrap text-ink"
-      >
-        <span
-          className={cx(
-            "flex size-8 shrink-0 items-center justify-center rounded-full",
-            CATEGORY_CHIP[category.token],
-          )}
-        >
-          <Icon name={category.icon} size={17} strokeWidth={2.2} />
-        </span>
-        <span>
-          {timerLabel(log)} ·{" "}
-          <span className="tabular-nums">
-            {formatClock(now.getTime() - Date.parse(log.started_at))}
-          </span>
-        </span>
-        {more > 0 && (
-          <span className="rounded-full bg-ink/10 px-[7px] py-1 text-[11px] leading-[11px] font-bold">
-            +{more}
-          </span>
-        )}
-      </Link>
-      <button
-        type="button"
-        disabled={busy}
-        onClick={onStop}
-        className="h-11 min-w-16 border-l border-line px-4 text-[15px] font-bold text-accent-text disabled:opacity-50"
-      >
-        Dừng
-      </button>
-    </div>
-  );
-}
-
-// Only this component ticks every second, and only while the pill shows.
-function LivePill({ log, more }: { log: LogRow; more: number }) {
-  const actions = useQuickActions();
-  const now = useNow(1000);
-  // Tells globals.css to make room: the page padding and the toast both rise.
-  useEffect(() => {
-    document.documentElement.dataset.timerPill = "on";
-    return () => {
-      delete document.documentElement.dataset.timerPill;
-    };
-  }, []);
-  return (
-    <TimerPillView
-      log={log}
-      more={more}
-      now={now}
-      busy={actions.busy}
-      onStop={() => actions.stopTimer(log)}
-    />
-  );
-}
-
-export function TimerPill() {
-  const actions = useQuickActions();
-  const pill = showsTabTimer(usePathname())
-    ? pillTimer(actions.runningRows)
-    : null;
-  return pill ? <LivePill log={pill.log} more={pill.more} /> : null;
-}
diff --git a/components/ui/Toast.tsx b/components/ui/Toast.tsx
index 7e2ec15..c9aadc7 100644
--- a/components/ui/Toast.tsx
+++ b/components/ui/Toast.tsx
@@ -31,7 +31,7 @@ export function ToastView({
     <div
       role="status"
       aria-live="polite"
-      className="pointer-events-none fixed inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px+var(--pill-offset))] z-40 flex justify-center print:hidden"
+      className="pointer-events-none fixed inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px)] z-40 flex justify-center print:hidden"
     >
       {item && (
         <div className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 shadow-[0_10px_30px_rgb(0_0_0/0.15)]">
diff --git a/lib/rules/timer.ts b/lib/rules/timer.ts
index bdaab42..3bfaa12 100644
--- a/lib/rules/timer.ts
+++ b/lib/rules/timer.ts
@@ -104,8 +104,8 @@ export function nextBreastSide(logs: TimedLog[], now: Date): NextSide | null {
   };
 }
 
-// Spec §5.2: the pill shows the running timer that started last, plus how
-// many others are running.
+// Spec 2026-11-19 §4: the tab bar's timer tile shows the running timer that
+// started last, plus how many others are running.
 export function pillTimer<T extends TimedLog>(
   logs: T[],
 ): { log: T; more: number } | null {
diff --git a/lib/ui/categories.ts b/lib/ui/categories.ts
index d84470d..62f1950 100644
--- a/lib/ui/categories.ts
+++ b/lib/ui/categories.ts
@@ -59,3 +59,15 @@ export const CATEGORY_RUNNING: Record<CategoryToken, string> = {
   "cat-med": "bg-cat-med ring-4 ring-cat-med/30",
   "cat-temp": "bg-cat-temp ring-4 ring-cat-temp/30",
 };
+
+// The same solid circle without the halo, under an icon in the page colour.
+export const CATEGORY_SOLID: Record<CategoryToken, string> = {
+  "cat-feed": "bg-cat-feed text-bg",
+  "cat-bottle": "bg-cat-bottle text-bg",
+  "cat-sleep": "bg-cat-sleep text-bg",
+  "cat-diaper": "bg-cat-diaper text-bg",
+  "cat-pump": "bg-cat-pump text-bg",
+  "cat-tummy": "bg-cat-tummy text-bg",
+  "cat-med": "bg-cat-med text-bg",
+  "cat-temp": "bg-cat-temp text-bg",
+};
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/nav/tabbar.test.tsx components/ui/toast.test.tsx components/actions/actionchrome.test.tsx lib/ui/categories.test.ts && bun run typecheck`
Expected: `Tests  33 passed (33)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- app/globals.css components/AuthGate.tsx components/actions/ActionChrome.tsx components/actions/QuickActions.tsx components/nav/TabBar.tsx components/nav/TimerPill.tsx components/ui/Toast.tsx lib/rules/timer.ts lib/ui/categories.ts components/actions/actionchrome.test.tsx components/nav/tabbar.test.tsx components/nav/timerpill.test.tsx components/ui/toast.test.tsx lib/ui/categories.test.ts
git commit -m "feat(nav): show the running timer inside the Hôm nay tab" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm giữa chừng M3a

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m3a.md` (tick các ô)

**Interfaces:**

- Consumes: mọi thứ Task 1–2 tạo ra.
- Produces: nhánh `feat/kim-bun-ux-mobile-m3a` làm nền cho M3b. Nhánh này không lên `main` trước khi M3b xong.

- [ ] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  157 passed (157)`, `Tests  1107 passed (1107)`.

- [ ] **Step 2: Commit phần tick**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m3a.md
git commit -m "docs(plan): tick the M3a steps" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```
