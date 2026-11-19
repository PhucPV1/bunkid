# Kim Bun — UX mobile M2c: hàng Ghi nhanh, "24 giờ qua" và thứ tự trang Hôm nay Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§3.4, §3.5, §3.6; phần tương ứng của §11.1 và §11.2)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Hàng Ghi nhanh là 5 nút tròn có "Khác", khối "24 giờ qua" có link Thống kê và câu giải thích, trang Hôm nay xếp các khối theo thứ tự mới cách nhau 14 px với ba ô trạng thái ngay dưới thẻ lớn, rồi cả M2 lên `main`.

**Architecture:**

- **Giao diện:** `QuickLogGrid` vẽ lại; `StatTile` và `StatsSection` chỉnh theo §3.5; `HomeScreen` nối tất cả theo thứ tự §3.6.
- **Luật thuần:** `homeStatTiles` gắn thêm câu `explain` của đánh giá vàng hoặc đỏ vào từng ô.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m2c`, cắt từ `feat/kim-bun-ux-mobile-m2b`. Baseline: 984 test vitest xanh (151 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a | luật của §3.2, §3.3, §3.5; §3.1 header | `2026-11-19-kim-bun-ux-mobile-m2a.md` |
| M2b | §3.2 thẻ lớn; §3.3 component ô trạng thái | `2026-11-19-kim-bun-ux-mobile-m2b.md` |
| **M2c (plan này)** | §3.4, §3.5, §3.6; kiểm cuối M2 và lên `main` | `2026-11-19-kim-bun-ux-mobile-m2c.md` |
| M3 | §4 timer trong tab, §5.4 sheet "+" | chưa viết |
| M4 | §6 Triệu chứng | chưa viết |
| M5 | §7 Tiêm chủng, §9 Khám phá | chưa viết |
| M6 | phần còn lại của §8 Thống kê, §11.3 | chưa viết |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **`onMore` của `QuickLogGrid` là bắt buộc.** Task 1 tạm truyền `() => {}` ở `HomeScreen` để test nối dây của Task 3 đỏ thật; giữa hai task đó "Khác" chưa làm gì.
2. **Tiêu đề "Ghi nhanh"** được giữ. Bốn icon loại cỡ 24, nét 2,2. "Khác" gọi `onMore()` qua một hàm mũi tên, nên sự kiện click không lọt vào.
3. **Câu giải thích** đi qua trường mới `HomeStatTile.explain`, nên prop của `StatsSection` không tăng. Các câu nằm giữa hàng ô và dòng tổng.
4. **Hàng tiêu đề "24 giờ qua" cao 44 px** vì link "Thống kê" có `min-h-11` (cùng kiểu với `RecentCard`). Lưới 3 ô vẫn cách nhau 10 px.
5. **14 px** viết là `gap-3.5`.
6. **`HomeSkeleton` và `GateLoading` không đổi:** vẫn vẽ khung thẻ lớn 300 px và khoảng cách 18 px lúc đang tải.
7. **`sleepStatusLine` và `homeStatusLines`** giờ chỉ còn test dùng. Giữ nguyên, không xoá.
8. **`homescreen.test.tsx`** mock `useNow` về một giờ cố định và bọc `QuickLogGrid` để bắt `onMore`.
9. **Tiêu chí chiều cao §3.6** chỉ đo được trên trình duyệt (Task 4 Step 3). Ước tính từ các lớp CSS: khoảng 712 px khi `running` không phải bú. Ghi chú dài như "Đánh giá sau 24 giờ đầu" có thể xuống dòng trong ô và làm khối cao thêm khoảng 16 px; đó là hành vi có từ trước.
10. **Kiểm trình duyệt** do phiên chính làm bằng khung Browser trong app ở 375×812; người dùng đã đồng ý dùng khung này trong phiên 2026-11-19.
11. **Lên `main`** ở Task 4, mang theo cả các commit của M2a và M2b.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên bản sao đã có M2a và M2b ở ngoài repo, trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5): `tsc --noEmit` sạch sau mỗi commit code, số test đỏ và xanh đúng như ghi; cả bộ cuối cùng là 998 test trong 151 file. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Next.js.** Không task nào thêm route. Chỗ dùng API của Next duy nhất là `next/link` trong `StatsSection.tsx` (M2c), dùng y như `HomeHeader.tsx` và `RecentCard.tsx` đang dùng.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status). Ba plan M2a, M2b, M2c chỉ lên `main` cùng nhau, ở cuối M2c: giữa chừng trang Hôm nay tạm thiếu giờ cữ bú tiếp và dòng Vitamin D.

## Contracts with Other Plans

Plan này đứng ngay sau M2b và trước M3 (chưa viết).

**Consumes:**

- Từ M2a: `statusTiles({ logs, feedIntervalMin, now }): StatusTile[]`; `totalsLine(...)` trả `string | null`; icon `more`.
- Từ M2b: `StatusTiles({ tiles, vitaminD })`; `HeroCardView` không có prop `sub`, trả `null` cho `none`.

**Produces** (M3 trở đi được dựa vào đúng những tên này):

- `components/home/QuickLogGrid.tsx`: prop `onMore: () => void`; `HomeScreen` gọi `actions.openActionSheet()` không tham số. M3 đổi lời gọi này thành `actions.openActionSheet(["other"])`.
- `lib/rules/summaryText.ts`: `HomeStatTile.explain: string | null`.
- `components/home/StatsSection.tsx`: `totals: string | null`, link "Thống kê".
- **Vitest sau M2:** 998 test, 151 file.

---

### Task 1: Hàng Ghi nhanh thành 5 nút tròn có "Khác" (§3.4)

**Files:**

- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/QuickLogGrid.tsx`
- Test: `components/home/buttons.test.tsx` (sửa)

**Interfaces:**

- Consumes: icon `more` (M2a); `CATEGORIES`, `CATEGORY_CHIP`; `GROUP_LABEL`.
- Produces: `QuickLogGrid({ onInstant, onMore }: { onInstant: (type: InstantType) => void; onMore: () => void })`. `onMore` là prop bắt buộc; ở task này `HomeScreen` tạm truyền `() => {}`, Task 3 nối thật.

- [ ] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m2c feat/kim-bun-ux-mobile-m2b
```

- [ ] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/home/buttons.test.tsx b/components/home/buttons.test.tsx
index 1eac509..f412eda 100644
--- a/components/home/buttons.test.tsx
+++ b/components/home/buttons.test.tsx
@@ -75,24 +75,60 @@ describe("TimerButtons next-side hint (spec 2026-11-17 §5.3)", () => {
   });
 });
 
+// Spec 2026-11-19 §3.4.
 describe("QuickLogGrid", () => {
-  it("is a 2×2 grid of glass pills with a coloured chip, in spec order", () => {
-    const onInstant = vi.fn();
-    const html = renderToStaticMarkup(<QuickLogGrid onInstant={onInstant} />);
+  const html = renderToStaticMarkup(
+    <QuickLogGrid onInstant={() => {}} onMore={() => {}} />,
+  );
+
+  it("is one row of five 58 px round buttons with labels, in spec order", () => {
     expect(html).toContain(">Ghi nhanh</h2>");
-    expect(html).toContain("grid-cols-2");
-    expect(html.match(/min-h-14/g)).toHaveLength(4);
-    const labels = [...html.matchAll(/<span>([^<]+)<\/span><\/button>/g)].map(
-      (m) => m[1],
-    );
-    expect(labels).toEqual(["Thay tã", "Bú bình", "Thuốc", "Nhiệt độ"]);
-    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
-    expect(html).toContain(`d="${ICON_PATHS.thermo}"`);
+    expect(html).toContain('<div class="grid grid-cols-5 gap-1">');
+    expect(html.match(/<button/g)).toHaveLength(5);
+    expect(html.match(/size-\[58px\]/g)).toHaveLength(5);
+    const labels = [
+      ...html.matchAll(/text-xs leading-4 font-medium text-ink">([^<]+)</g),
+    ].map((m) => m[1]);
+    expect(labels).toEqual(["Thay tã", "Bú bình", "Thuốc", "Nhiệt độ", "Khác"]);
+    expect(html).not.toContain("grid-cols-2");
+    expect(html).not.toContain("min-h-14");
+  });
+
+  it("tints the four log circles with their category colour, without glass", () => {
+    for (const token of ["diaper", "bottle", "med", "temp"])
+      expect(html).toContain(
+        `rounded-full bg-cat-${token}/15 text-cat-${token}`,
+      );
+    for (const icon of ["drop", "bottle", "pill", "thermo"] as const)
+      expect(html).toContain(`d="${ICON_PATHS[icon]}"`);
+    expect(html.match(/stroke-width="2.2"/g)).toHaveLength(4);
+    expect(html).not.toContain("glass");
+  });
+
+  it("draws Khác as three bold dots on a muted circle", () => {
+    expect(html).toContain("rounded-full bg-muted/15 text-ink");
+    expect(html).toContain(`d="${ICON_PATHS.more}"`);
+    expect(html.match(/stroke-width="3"/g)).toHaveLength(1);
+  });
+
+  it("the first four open their sheet, Khác calls onMore with no argument", () => {
+    const onInstant = vi.fn();
+    const onMore = vi.fn();
     const buttons = findElements(
-      QuickLogGrid({ onInstant }),
+      QuickLogGrid({ onInstant, onMore }),
       (el) => el.type === "button",
     );
-    (buttons[0].props.onClick as () => void)();
-    expect(onInstant).toHaveBeenCalledWith("diaper");
+    expect(buttons).toHaveLength(5);
+    for (const button of buttons.slice(0, 4))
+      (button.props.onClick as () => void)();
+    expect(onInstant.mock.calls).toEqual([
+      ["diaper"],
+      ["bottle"],
+      ["medicine"],
+      ["temperature"],
+    ]);
+    expect(onMore).not.toHaveBeenCalled();
+    (buttons[4].props.onClick as (event: unknown) => void)({ type: "click" });
+    expect(onMore.mock.calls).toEqual([[]]);
   });
 });
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/home/buttons.test.tsx components/home/homescreen.test.tsx`
Expected: FAIL, `Tests  4 failed | 8 passed (12)`.

- [ ] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index 62c8a54..79a1090 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -137,7 +137,10 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
             suggestSide={nextSide?.suggest ?? null}
           />
 
-          <QuickLogGrid onInstant={(type) => actions.openInstant(type)} />
+          <QuickLogGrid
+            onInstant={(type) => actions.openInstant(type)}
+            onMore={() => {}}
+          />
 
           {actions.error && (
             <p role="alert" className="px-1 text-danger">
diff --git a/components/home/QuickLogGrid.tsx b/components/home/QuickLogGrid.tsx
index 059b37c..3f11b94 100644
--- a/components/home/QuickLogGrid.tsx
+++ b/components/home/QuickLogGrid.tsx
@@ -11,33 +11,44 @@ const INSTANTS: { type: InstantType; label: string }[] = [
   { type: "temperature", label: "Nhiệt độ" },
 ];
 
+const BUTTON =
+  "flex flex-col items-center gap-1.5 transition-transform duration-[120ms] active:scale-[0.97]";
+const CIRCLE = "flex size-[58px] items-center justify-center rounded-full";
+const LABEL = "text-xs leading-4 font-medium text-ink";
+
+// Spec 2026-11-19 §3.4: one row of five round buttons, sized like the timer
+// row. The circles are tinted, not glass, so the two rows look different.
 export function QuickLogGrid({
   onInstant,
+  onMore,
 }: {
   onInstant: (type: InstantType) => void;
+  // "Khác": opens the "+" sheet for what has no button here.
+  onMore: () => void;
 }) {
   return (
     <section className="flex flex-col gap-2.5">
       <h2 className={GROUP_LABEL}>Ghi nhanh</h2>
-      <div className="grid grid-cols-2 gap-2.5">
+      <div className="grid grid-cols-5 gap-1">
         {INSTANTS.map(({ type, label }) => (
           <button
             key={type}
             type="button"
             onClick={() => onInstant(type)}
-            className="glass flex min-h-14 items-center gap-3 rounded-full pr-4 pl-3 text-base font-semibold text-ink transition-transform duration-[120ms] active:scale-[0.97]"
+            className={BUTTON}
           >
-            <span
-              className={cx(
-                "flex size-8 shrink-0 items-center justify-center rounded-full",
-                CATEGORY_CHIP[CATEGORIES[type].token],
-              )}
-            >
-              <Icon name={CATEGORIES[type].icon} size={17} strokeWidth={2.2} />
+            <span className={cx(CIRCLE, CATEGORY_CHIP[CATEGORIES[type].token])}>
+              <Icon name={CATEGORIES[type].icon} size={24} strokeWidth={2.2} />
             </span>
-            <span>{label}</span>
+            <span className={LABEL}>{label}</span>
           </button>
         ))}
+        <button type="button" onClick={() => onMore()} className={BUTTON}>
+          <span className={cx(CIRCLE, "bg-muted/15 text-ink")}>
+            <Icon name="more" size={24} strokeWidth={3} />
+          </span>
+          <span className={LABEL}>Khác</span>
+        </button>
       </div>
     </section>
   );
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/home/buttons.test.tsx components/home/homescreen.test.tsx && bun run typecheck`
Expected: `Tests  12 passed (12)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- components/home/HomeScreen.tsx components/home/QuickLogGrid.tsx components/home/buttons.test.tsx
git commit -m "feat(home): quick log row of five round buttons with Khác" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Khối "24 giờ qua": link Thống kê, câu giải thích, dòng tổng có thể rỗng (§3.5)

**Files:**

- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/StatsSection.tsx`
- Modify: `components/ui/StatTile.tsx`
- Modify: `lib/rules/summaryText.ts`
- Test: `components/home/stats.test.tsx` (sửa)
- Test: `components/ui/lists.test.tsx` (sửa)
- Test: `lib/rules/summaryText.test.ts` (sửa)

**Interfaces:**

- Consumes: `totalsLine(...): string | null` (M2a); `MetricResult.explain` (`lib/rules/ratings.ts`); `StatTile`; `GROUP_LABEL`.
- Produces: `HomeStatTile` có thêm `explain: string | null` (khác `null` chỉ khi đánh giá vàng hoặc đỏ); `StatsSection({ tiles, totals }: { tiles: HomeStatTile[]; totals: string | null })` có link "Thống kê" tới `/thong-ke`; `StatTile` vẽ giá trị 20/26 và `whitespace-nowrap`.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/home/stats.test.tsx b/components/home/stats.test.tsx
index aeab0f3..9a03971 100644
--- a/components/home/stats.test.tsx
+++ b/components/home/stats.test.tsx
@@ -4,19 +4,26 @@ import type { HomeStatTile } from "@/lib/rules/summaryText";
 import type { LogRow } from "@/lib/supabase/rows";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { RecentCard } from "./RecentCard";
+import { GROUP_LABEL } from "./sectionTitle";
 import { StatsSection } from "./StatsSection";
 
 const NOW = new Date("2026-11-14T05:00:00Z");
+const tile = (
+  label: string,
+  value: string,
+  note: string,
+  tone: HomeStatTile["tone"],
+  explain: string | null = null,
+): HomeStatTile => ({ label, value, note, tone, explain });
 const tiles: HomeStatTile[] = [
-  { label: "Giấc ngủ", value: "13g 5p", note: "Bình thường", tone: "good" },
-  { label: "Cữ bú", value: "8", note: "Cần chú ý", tone: "warn" },
-  {
-    label: "Tã ướt",
-    value: "6",
-    note: "Đánh giá sau 24 giờ đầu",
-    tone: "muted",
-  },
+  tile("Giấc ngủ", "13g 5p", "Bình thường", "good"),
+  tile("Cữ bú", "8", "Bình thường", "good"),
+  tile("Tã ướt", "6", "Đánh giá sau 24 giờ đầu", "muted"),
 ];
+// Every <p> of the section as [class, text].
+const P_TAG = /<p class="([^"]*)">([^<]+)<\/p>/g;
+const lines = (html: string) =>
+  [...html.matchAll(P_TAG)].map((m) => [m[1], m[2]]);
 const bottle = (i: number): LogRow =>
   ({
     id: `b${i}`,
@@ -31,18 +38,68 @@ const bottle = (i: number): LogRow =>
     updated_at: NOW.toISOString(),
   }) as LogRow;
 
+// Spec 2026-11-19 §3.5.
 describe("StatsSection", () => {
-  it("shows a titled row of three tiles and the totals line", () => {
+  it("shows a group label, three tiles and the totals line", () => {
     const html = renderToStaticMarkup(
       <StatsSection tiles={tiles} totals="Bình 180 ml · Tã bẩn 2" />,
     );
-    expect(html).toContain(">24 giờ qua</h2>");
+    expect(html).toContain(`<h2 class="${GROUP_LABEL}">24 giờ qua</h2>`);
     expect(html).toContain("grid-cols-3");
     expect(html).toContain(">13g 5p</span>");
     expect(html).toContain(">Bình thường</span>");
     expect(html).toContain("text-good");
-    expect(html).toContain("text-warn");
-    expect(html).toContain(">Bình 180 ml · Tã bẩn 2</p>");
+    expect(lines(html)).toEqual([
+      [
+        "px-1 text-[13px] leading-[18px] text-muted tabular-nums",
+        "Bình 180 ml · Tã bẩn 2",
+      ],
+    ]);
+  });
+
+  it("links to Thống kê from the title row, with a 44 px tall touch target", () => {
+    const html = renderToStaticMarkup(
+      <StatsSection tiles={tiles} totals={null} />,
+    );
+    const link = html.match(/<a [^>]*href="\/thong-ke"[^>]*>/)?.[0] ?? "";
+    expect(link).toContain("min-h-11");
+    expect(link).toContain("text-[13px]");
+    expect(link).toContain("font-semibold");
+    expect(link).toContain("text-accent-text");
+    expect(html).toContain(
+      '>Thống kê<svg width="14" height="14" viewBox="0 0 24 24"',
+    );
+    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
+    expect(html.indexOf("24 giờ qua")).toBeLessThan(html.indexOf("Thống kê"));
+    expect(html.indexOf("Thống kê")).toBeLessThan(html.indexOf("grid-cols-3"));
+  });
+
+  it("explains each yellow or red rating under the tiles, in tile order", () => {
+    const rated = [
+      tile("Giấc ngủ", "9g", "Cần chú ý", "warn", "Bé ngủ ít hơn chuẩn"),
+      tile("Cữ bú", "5", "Cần chú ý", "warn", "Ít cữ bú hơn chuẩn"),
+      tile("Tã ướt", "2", "Báo bác sĩ", "danger", "Rất ít tã ướt"),
+    ];
+    const html = renderToStaticMarkup(
+      <StatsSection tiles={rated} totals="Tã bẩn 1" />,
+    );
+    expect(lines(html)).toEqual([
+      ["px-1 text-[13px] leading-[18px] text-warn", "Bé ngủ ít hơn chuẩn"],
+      ["px-1 text-[13px] leading-[18px] text-warn", "Ít cữ bú hơn chuẩn"],
+      ["px-1 text-[13px] leading-[18px] text-danger", "Rất ít tã ướt"],
+      ["px-1 text-[13px] leading-[18px] text-muted tabular-nums", "Tã bẩn 1"],
+    ]);
+    expect(html.indexOf("Bé ngủ ít hơn chuẩn")).toBeGreaterThan(
+      html.indexOf("Báo bác sĩ"),
+    );
+  });
+
+  it("draws no line at all when no rating needs a word and the totals are zero", () => {
+    const html = renderToStaticMarkup(
+      <StatsSection tiles={tiles} totals={null} />,
+    );
+    expect(lines(html)).toEqual([]);
+    expect(html).not.toContain("<p ");
   });
 });
 
diff --git a/components/ui/lists.test.tsx b/components/ui/lists.test.tsx
index d330e35..ae1beda 100644
--- a/components/ui/lists.test.tsx
+++ b/components/ui/lists.test.tsx
@@ -87,6 +87,16 @@ describe("StatTile", () => {
       renderToStaticMarkup(<StatTile label="a" value="1" />),
     ).not.toContain("text-[11px]");
   });
+
+  // Spec 2026-11-19 §3.5: "14g 38p" stays on one line at 375 px.
+  it("sets the value 20/26 and never wraps it", () => {
+    const html = renderToStaticMarkup(
+      <StatTile label="Giấc ngủ" value="14g 38p" />,
+    );
+    expect(html).toContain(
+      '<span class="text-xl leading-[26px] font-bold whitespace-nowrap text-ink tabular-nums">14g 38p</span>',
+    );
+  });
 });
 
 describe("Skeleton", () => {
diff --git a/lib/rules/summaryText.test.ts b/lib/rules/summaryText.test.ts
index 54001ab..b273014 100644
--- a/lib/rules/summaryText.test.ts
+++ b/lib/rules/summaryText.test.ts
@@ -26,12 +26,11 @@ const LOGS: LogLike[] = [
   log("diaper", 6, 6, { wet: true, dirty: true }),
   log("diaper", 7, 7, { wet: false, dirty: true }),
 ];
-const rated = (rating: "green" | "yellow" | "red", value: number) => ({
-  status: "rated" as const,
-  rating,
-  value,
-  explain: "x",
-});
+const rated = (
+  rating: "green" | "yellow" | "red",
+  value: number,
+  explain = "x",
+) => ({ status: "rated" as const, rating, value, explain });
 
 describe("homeStatTiles", () => {
   it("always shows the counts from the last 24 hours", () => {
@@ -46,18 +45,21 @@ describe("homeStatTiles", () => {
         value: "2g 30p",
         note: "Đánh giá sau 24 giờ đầu",
         tone: "muted",
+        explain: null,
       },
       {
         label: "Cữ bú",
         value: "2",
         note: "Đánh giá sau 24 giờ đầu",
         tone: "muted",
+        explain: null,
       },
       {
         label: "Tã ướt",
         value: "2",
         note: "Đánh giá sau 24 giờ đầu",
         tone: "muted",
+        explain: null,
       },
     ]);
   });
@@ -91,8 +93,25 @@ describe("homeStatTiles", () => {
       value: "2g 30p",
       note: "Không đánh giá ở tuổi này",
       tone: "muted",
+      explain: null,
     });
   });
+
+  // Spec 2026-11-19 §3.5: the sentence shown under the tiles.
+  it("carries the explain sentence of a yellow or red rating only", () => {
+    const ratings: DayRatings = {
+      sleepMinutes: rated("green", 150, "Bé ngủ đủ (chuẩn 14–17 giờ)"),
+      feeds: rated("yellow", 2, "Ít cữ bú hơn chuẩn (từ 8 cữ)"),
+      wetDiapers: rated("red", 2, "Rất ít tã ướt: nguy cơ mất nước"),
+    };
+    expect(
+      homeStatTiles({ ratings, logs: LOGS, now: NOW }).map((t) => t.explain),
+    ).toEqual([
+      null,
+      "Ít cữ bú hơn chuẩn (từ 8 cữ)",
+      "Rất ít tã ướt: nguy cơ mất nước",
+    ]);
+  });
 });
 
 describe("short texts", () => {
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/summaryText.test.ts components/home/stats.test.tsx components/ui/lists.test.tsx components/home/homescreen.test.tsx`
Expected: FAIL, `Tests  8 failed | 15 passed (23)`.

- [ ] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index 79a1090..d4616f4 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -162,7 +162,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
           {logs.data && (
             <StatsSection
               tiles={homeStatTiles({ ratings, logs: rows, now })}
-              totals={totalsLine(windowTotals(rows, now)) ?? ""}
+              totals={totalsLine(windowTotals(rows, now))}
             />
           )}
 
diff --git a/components/home/StatsSection.tsx b/components/home/StatsSection.tsx
index f0f48cf..3a6a256 100644
--- a/components/home/StatsSection.tsx
+++ b/components/home/StatsSection.tsx
@@ -1,17 +1,31 @@
+import Link from "next/link";
+import { Icon } from "@/components/ui/Icon";
 import { StatTile } from "@/components/ui/StatTile";
 import type { HomeStatTile } from "@/lib/rules/summaryText";
-import { SECTION_TITLE } from "./sectionTitle";
+import { cx } from "@/lib/ui/cx";
+import { GROUP_LABEL } from "./sectionTitle";
 
+// Spec 2026-11-19 §3.5: the tiles, then one sentence per yellow or red rating
+// (in tile order), then the totals line when there is something to total.
 export function StatsSection({
   tiles,
   totals,
 }: {
   tiles: HomeStatTile[];
-  totals: string;
+  totals: string | null;
 }) {
   return (
     <section className="flex flex-col gap-2.5">
-      <h2 className={SECTION_TITLE}>24 giờ qua</h2>
+      <div className="flex items-center justify-between">
+        <h2 className={GROUP_LABEL}>24 giờ qua</h2>
+        <Link
+          href="/thong-ke"
+          className="inline-flex min-h-11 items-center gap-0.5 px-1 text-[13px] font-semibold text-accent-text"
+        >
+          Thống kê
+          <Icon name="chevronRight" size={14} />
+        </Link>
+      </div>
       <div className="grid grid-cols-3 gap-2.5">
         {tiles.map((tile) => (
           <StatTile
@@ -23,9 +37,25 @@ export function StatsSection({
           />
         ))}
       </div>
-      <p className="px-1 text-[13px] leading-[18px] text-muted tabular-nums">
-        {totals}
-      </p>
+      {tiles.map(
+        (tile) =>
+          tile.explain && (
+            <p
+              key={tile.label}
+              className={cx(
+                "px-1 text-[13px] leading-[18px]",
+                tile.tone === "danger" ? "text-danger" : "text-warn",
+              )}
+            >
+              {tile.explain}
+            </p>
+          ),
+      )}
+      {totals && (
+        <p className="px-1 text-[13px] leading-[18px] text-muted tabular-nums">
+          {totals}
+        </p>
+      )}
     </section>
   );
 }
diff --git a/components/ui/StatTile.tsx b/components/ui/StatTile.tsx
index 7817a94..7447f9d 100644
--- a/components/ui/StatTile.tsx
+++ b/components/ui/StatTile.tsx
@@ -24,7 +24,7 @@ export function StatTile({
   return (
     <Glass radius="tile" className="flex flex-col gap-1 p-3.5">
       <span className="text-xs text-muted">{label}</span>
-      <span className="text-[22px] leading-7 font-bold text-ink tabular-nums">
+      <span className="text-xl leading-[26px] font-bold whitespace-nowrap text-ink tabular-nums">
         {value}
       </span>
       {note && (
diff --git a/lib/rules/summaryText.ts b/lib/rules/summaryText.ts
index 8fd7b9a..4da14b6 100644
--- a/lib/rules/summaryText.ts
+++ b/lib/rules/summaryText.ts
@@ -13,19 +13,27 @@ export type HomeStatTile = {
   value: string;
   note: string;
   tone: "good" | "warn" | "danger" | "muted";
+  // Spec 2026-11-19 §3.5: the rating's sentence, only when it is yellow or red.
+  explain: string | null;
 };
 
+type Rated = Pick<HomeStatTile, "note" | "tone" | "explain">;
+
 const RATED: Record<Rating, Pick<HomeStatTile, "note" | "tone">> = {
   green: { note: "Bình thường", tone: "good" },
   yellow: { note: "Cần chú ý", tone: "warn" },
   red: { note: "Báo bác sĩ", tone: "danger" },
 };
 
-function noteFor(result: MetricResult): Pick<HomeStatTile, "note" | "tone"> {
-  if (result.status === "rated") return RATED[result.rating];
+function noteFor(result: MetricResult): Rated {
+  if (result.status === "rated")
+    return {
+      ...RATED[result.rating],
+      explain: result.rating === "green" ? null : result.explain,
+    };
   if (result.status === "not-rated")
-    return { note: "Không đánh giá ở tuổi này", tone: "muted" };
-  return { note: "Đánh giá sau 24 giờ đầu", tone: "muted" };
+    return { note: "Không đánh giá ở tuổi này", tone: "muted", explain: null };
+  return { note: "Đánh giá sau 24 giờ đầu", tone: "muted", explain: null };
 }
 
 export function shortDuration(minutes: number): string {
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/summaryText.test.ts components/home/stats.test.tsx components/ui/lists.test.tsx components/home/homescreen.test.tsx && bun run typecheck`
Expected: `Tests  23 passed (23)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- components/home/HomeScreen.tsx components/home/StatsSection.tsx components/ui/StatTile.tsx lib/rules/summaryText.ts components/home/stats.test.tsx components/ui/lists.test.tsx lib/rules/summaryText.test.ts
git commit -m "feat(home): 24 giờ qua with a Thống kê link and rating explanations" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: `HomeScreen`: thứ tự khối, khoảng cách 14 px, nối `StatusTiles` và "Khác" (§3.6)

**Files:**

- Modify: `components/home/HomeScreen.tsx`
- Test: `components/home/homescreen.test.tsx` (sửa)

**Interfaces:**

- Consumes: `statusTiles` (M2a), `StatusTiles` (M2b), `QuickLogGrid.onMore` (Task 1), `StatsSection` (Task 2), `actions.openActionSheet` (`components/actions/QuickActions.tsx`).
- Produces: Trang Hôm nay theo đúng thứ tự §3.6, `gap-3.5`; `StatusTiles` chỉ vẽ khi `logs.data` có; "Khác" gọi `actions.openActionSheet()` không tham số (M3 đổi thành `["other"]`).

- [ ] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/home/homescreen.test.tsx b/components/home/homescreen.test.tsx
index 85cc9e2..f583741 100644
--- a/components/home/homescreen.test.tsx
+++ b/components/home/homescreen.test.tsx
@@ -1,12 +1,20 @@
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it, vi } from "vitest";
+import { beforeEach, describe, expect, it, vi } from "vitest";
 import { SyncBarProvider } from "@/components/sync/SyncSlot";
-import type { Baby } from "@/lib/supabase/rows";
+import type { Baby, LogRow } from "@/lib/supabase/rows";
 import { HomeScreen } from "./HomeScreen";
 
-const state = vi.hoisted(() => ({ logs: {} as Record<string, unknown> }));
+const NOW = vi.hoisted(() => new Date("2026-11-14T05:00:00Z")); // 12:00 giờ VN
+const state = vi.hoisted(() => ({
+  logs: {} as Record<string, unknown>,
+  actionError: null as Error | null,
+  // The handler HomeScreen gave to the "Khác" button.
+  onMore: null as ((event?: unknown) => void) | null,
+}));
+const openActionSheet = vi.hoisted(() => vi.fn());
 
+vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
 vi.mock("@/lib/data/logs", () => ({
   useRecentLogs: () => state.logs,
   useFirstLogAt: () => ({ data: null }),
@@ -19,12 +27,23 @@ vi.mock("@/components/actions/QuickActions", () => ({
   useQuickActions: () => ({
     running: [],
     busy: false,
-    error: null,
+    error: state.actionError,
     pressTimer: () => {},
     stopTimer: () => {},
     openInstant: () => {},
+    openActionSheet,
   }),
 }));
+vi.mock("./QuickLogGrid", async (importOriginal) => {
+  const actual = await importOriginal<typeof import("./QuickLogGrid")>();
+  type Props = Parameters<typeof actual.QuickLogGrid>[0];
+  return {
+    QuickLogGrid: (props: Props) => {
+      state.onMore = props.onMore;
+      return actual.QuickLogGrid(props);
+    },
+  };
+});
 vi.mock("@/components/sync/SyncBar", () => ({
   SyncBar: ({ userId }: { userId: string }) => <p>sync:{userId}</p>,
 }));
@@ -48,6 +67,59 @@ function render(logs: Record<string, unknown>) {
   );
 }
 
+const at = (time: string) => `2026-11-14T${time}:00.000Z`;
+const row = (
+  id: string,
+  type: string,
+  start: string,
+  end: string | null,
+  details: unknown = {},
+): LogRow =>
+  ({
+    id,
+    baby_id: "b1",
+    type,
+    started_at: at(start),
+    ended_at: end === null ? null : at(end),
+    details,
+    note: null,
+    created_by: "u1",
+    created_at: at(start),
+    updated_at: at(start),
+  }) as LogRow;
+const bottle = (id: string, time: string) =>
+  row(id, "bottle", time, time, { ml: 90, milk: "formula" });
+// A fever, a tummy timer past its limit, a running sleep, a feed two hours
+// ago, a wet diaper and today's Vitamin D.
+const DAY: LogRow[] = [
+  row("s1", "sleep", "04:30", null),
+  row("t1", "tummy", "04:00", null),
+  bottle("f1", "03:00"),
+  row("d1", "diaper", "04:00", "04:00", { wet: true, dirty: false }),
+  row("m1", "medicine", "01:10", "01:10", {
+    name: "Vitamin D",
+    amount: 1,
+    unit: "giọt",
+    antipyretic: false,
+  }),
+  row("c1", "temperature", "04:50", "04:50", { celsius: 38.5, method: "nach" }),
+];
+const loaded = (data: LogRow[]) =>
+  render({ data, isPending: false, isError: false, fetchStatus: "idle" });
+
+function expectInOrder(html: string, marks: string[]) {
+  const found = marks.map((mark) => html.indexOf(mark));
+  expect(found[0], marks[0]).toBeGreaterThan(-1);
+  for (let i = 1; i < marks.length; i += 1)
+    expect(found[i], marks[i]).toBeGreaterThan(found[i - 1]);
+}
+
+beforeEach(() => {
+  state.actionError = null;
+  state.onMore = null;
+  openActionSheet.mockClear();
+});
+
 describe("HomeScreen", () => {
   it("while logs load: header, sync line, then the home shapes and nothing else", () => {
     const html = render({
@@ -78,6 +150,7 @@ describe("HomeScreen", () => {
     expect(html).toContain("Thay tã");
     expect(html).not.toContain("Gần đây");
     expect(html).not.toContain('aria-busy="true"');
+    expect(html).not.toContain("Cữ bú tiếp");
   });
 
   it("offline at start (paused fetch) keeps the full page so logs can go to the outbox", () => {
@@ -90,5 +163,76 @@ describe("HomeScreen", () => {
     expect(html).not.toContain('aria-busy="true"');
     expect(html).toContain("Thay tã");
     expect(html).toContain("Gần đây");
+    expect(html).not.toContain("Cữ bú tiếp");
+    expect(html).not.toContain(">24 giờ qua<");
+  });
+});
+
+// Spec 2026-11-19 §3.6.
+describe("HomeScreen with logs", () => {
+  it("stacks the blocks 14 px apart, in the spec's order", () => {
+    state.actionError = new Error("boom");
+    const html = loaded(DAY);
+    expect(html).toMatch(/^<main class="[^"]*\bgap-3\.5\b[^"]*">/);
+    expect(html).not.toContain("gap-[18px]");
+    expectInOrder(html, [
+      "</header>",
+      "cần đi khám ngay",
+      "Còn đang nằm sấp không?",
+      ">Đang ngủ<",
+      "Nằm sấp · 1 giờ 00 phút · Ai đó",
+      ">Cữ bú tiếp<",
+      "Vitamin D đã uống 08:10",
+      ">Bấm giờ<",
+      ">Ghi nhanh<",
+      "Có lỗi xảy ra: boom",
+      ">24 giờ qua<",
+      ">Gần đây<",
+    ]);
+  });
+
+  it("shows the three status tiles and the Vitamin D time, not the Vitamin D button", () => {
+    const html = loaded(DAY);
+    expect(html).toContain(">13:00</span>");
+    expect(html).toContain(">còn 1g</span>");
+    expect(html).toContain(">Bú gần nhất</span>");
+    expect(html).toContain(">bình · 90 ml</span>");
+    expect(html).toContain(">Tã gần nhất</span>");
+    expect(html).toContain(">ướt</span>");
+    expect(html).toContain(">Vitamin D đã uống 08:10</p>");
+    expect(html).not.toContain("Ghi Vitamin D hôm nay");
+  });
+
+  it("keeps the Vitamin D button in its place, and no Vitamin D line, until the dose is logged", () => {
+    state.actionError = new Error("boom");
+    const html = loaded(DAY.filter((log) => log.type !== "medicine"));
+    expect(html).not.toContain("Vitamin D đã uống");
+    expectInOrder(html, [
+      ">Ghi nhanh<",
+      "Có lỗi xảy ra: boom",
+      "Ghi Vitamin D hôm nay",
+      ">24 giờ qua<",
+    ]);
+  });
+
+  it("draws no hero card when there is nothing to say: the tiles follow the header", () => {
+    const html = loaded([bottle("f1", "04:00")]);
+    expect(html).not.toContain("rounded-[32px]");
+    expect(html).toContain(">14:00</span>");
+    expect(html).toContain(">còn 2g</span>");
+    expectInOrder(html, ["</header>", ">Cữ bú tiếp<", ">Bấm giờ<"]);
+  });
+
+  it("shows only the non-zero totals, and no totals line when both are zero", () => {
+    expect(loaded(DAY)).toContain(">Bình 90 ml</p>");
+    const html = loaded([DAY[3]]);
+    expect(html).toContain(">24 giờ qua<");
+    expect(html).not.toMatch(/<p[^>]*>(Bình|Tã bẩn) /);
+  });
+
+  it("Khác opens the + sheet and passes nothing on", () => {
+    loaded(DAY);
+    state.onMore?.({ type: "click" });
+    expect(openActionSheet.mock.calls).toEqual([[]]);
   });
 });
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/home/homescreen.test.tsx`
Expected: FAIL, `Tests  4 failed | 5 passed (9)`. Bốn test đỏ: khoảng cách và thứ tự khối, ô trạng thái kèm dòng Vitamin D, trường hợp `none`, nút "Khác".

- [ ] **Step 3: Sửa code (Patch 6)**

```diff
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index d4616f4..6c03963 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -15,6 +15,7 @@ import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
 import { heroState } from "@/lib/rules/hero";
 import { medicinePrefill } from "@/lib/rules/quickEntry";
 import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
+import { statusTiles } from "@/lib/rules/status";
 import { homeStatTiles, totalsLine } from "@/lib/rules/summaryText";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import { nextBreastSide, overdueTimers } from "@/lib/rules/timer";
@@ -27,6 +28,7 @@ import { LongTimerBanner } from "./LongTimerBanner";
 import { QuickLogGrid } from "./QuickLogGrid";
 import { RecentCard } from "./RecentCard";
 import { StatsSection } from "./StatsSection";
+import { StatusTiles } from "./StatusTiles";
 import { TimerButtons } from "./TimerButtons";
 import { TimerRow } from "./TimerRow";
 import { VitaminDButton } from "./VitaminDButton";
@@ -80,7 +82,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
     members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";
 
   return (
-    <main className="mx-auto flex max-w-md flex-col gap-[18px] p-4">
+    <main className="mx-auto flex max-w-md flex-col gap-3.5 p-4">
       <HomeHeader name={baby.name} age={formatAgeVi(baby.dob, now)} />
       <SyncBarSlot />
 
@@ -130,6 +132,17 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
             />
           ))}
 
+          {logs.data && (
+            <StatusTiles
+              tiles={statusTiles({
+                logs: rows,
+                feedIntervalMin: baby.feed_interval_min,
+                now,
+              })}
+              vitaminD={vitaminD}
+            />
+          )}
+
           <TimerButtons
             running={actions.running}
             busy={actions.busy}
@@ -139,7 +152,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
 
           <QuickLogGrid
             onInstant={(type) => actions.openInstant(type)}
-            onMore={() => {}}
+            onMore={() => actions.openActionSheet()}
           />
 
           {actions.error && (
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/home/homescreen.test.tsx && bun run typecheck`
Expected: `Tests  9 passed (9)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- components/home/HomeScreen.tsx components/home/homescreen.test.tsx
git commit -m "feat(home): new block order with status tiles on the home page" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M2 và lên `main`

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2c.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ của M2a, M2b và Task 1–3.
- Produces: `main` có cả M2a, M2b và M2c; nhánh `feat/kim-bun-ux-mobile-m2c` làm nền cho M3.

- [ ] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  151 passed (151)`, `Tests  998 passed (998)`.

- [ ] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [ ] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không bấm Lưu, không đụng timer)**

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Mở `http://localhost:3000/` trong khung Browser của app ở cỡ 375×812. Không bấm nút nào của hàng Bấm giờ, không bấm "Dừng", "Đổi bên", "Bú trái", "Bú phải".

1. Header có 3 nút tròn: trăng, Cài đặt, Khẩn cấp. Tên bé không đè lên nút.
2. Thẻ lớn là một hàng: ô tròn 56 px, ba dòng chữ, nút "Dừng" nếu đang có timer không phải bú. Ghi lại trạng thái đang thấy (`running`, `overdue`, `awake`, `empty` hay không có thẻ).
3. Dưới thẻ lớn có 3 ô "Cữ bú tiếp", "Bú gần nhất", "Tã gần nhất". Chạy bằng javascript tool: `[...document.querySelectorAll("main span, main p")].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent)`. Kỳ vọng: mảng rỗng, hoặc chỉ có tên bé và tên thành viên.
4. Hàng "Bấm giờ" 5 nút và hàng "Ghi nhanh" 5 nút (Thay tã, Bú bình, Thuốc, Nhiệt độ, Khác) thẳng cột với nhau.
5. Tiêu chí §3.6. Chạy: `(() => { const h = [...document.querySelectorAll("main h2")].find((x) => x.textContent === "24 giờ qua"); const grid = h.closest("section").querySelector(".grid"); return Math.round(grid.getBoundingClientRect().bottom + scrollY); })()`. Kỳ vọng: `≤ 724` khi thẻ lớn là `running` không phải bú, không có banner và đã uống Vitamin D; `≤ 718` khi là `awake` với cùng điều kiện. Dữ liệu thật ở trạng thái khác thì ghi con số đo được kèm trạng thái, và ghi "chưa kiểm" cho tiêu chí. Nếu dữ liệu đang ở đúng trạng thái đủ điều kiện mà con số vượt ngưỡng thì dừng trước Step 4, tìm nguyên nhân (thường là ghi chú trong ô "24 giờ qua" bị xuống dòng), sửa rồi chạy lại Step 1–3.
6. Chạm "Khác": sheet "+" mở ra. Đóng bằng Esc.
7. Chạm nút Cài đặt: tới `/cai-dat`. Quay lại, chạm "Thống kê" ở khối "24 giờ qua": tới `/thong-ke`.
8. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở trang Hôm nay.
9. Lặp mục 1–4 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`: chữ và icon đọc rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được thì ghi "chưa kiểm".

- [ ] **Step 4: Commit phần ghi kết quả, đưa lên `main`, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2c.md
git commit -m "docs(plan): record the M2 check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-ux-mobile-m2c
git push origin main
```

Báo cáo cho người dùng: `git log --oneline 5c4ea5f..main`; kết quả typecheck, vitest, build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa.
