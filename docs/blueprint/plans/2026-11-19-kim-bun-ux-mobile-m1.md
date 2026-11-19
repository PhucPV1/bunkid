# Kim Bun — UX mobile M1: sheet ghi nhanh và chữ Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§5.1, §5.2, §5.3, §10, gạch đầu dòng thứ nhất của §8; phần tương ứng của §11.1 và §11.2)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Hàng "Lúc nào?" hiện đủ 4 lựa chọn không cần cuộn, sheet Đo nhiệt độ có 6 mốc chọn sẵn, sheet Bú bình mở ra với lượng gần nhất, Nhật ký có nút chữ "Ghi bù", và không còn chữ "Tummy" trên màn hình.

**Architecture:**

- **Luật thuần** (`lib/rules/`): nhãn mới trong `TIME_CHIPS`; hằng `TEMP_PRESETS`; hàm `initialQuickValues`; ba chuỗi "Nằm sấp".
- **Giao diện:** `TimeChips` dùng `Segmented` thay `ChipGroup`; `TemperatureFields` thêm hàng mốc; `QuickEntrySheet` lấy giá trị khởi đầu từ `initialQuickValues`; `HistoryScreen` có `BackfillButton`.
- **Chặn tái phát:** `lib/copyGuard.test.ts` quét `components/` và `lib/`, đỏ khi có chữ "Tummy" ngoài file test.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m1`, cắt từ `main` @ `ceb4878`. Baseline: 935 test vitest xanh (148 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| **M1 (plan này)** | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | `2026-11-19-kim-bun-ux-mobile-m1.md` |
| M2 | §3 trang Hôm nay | chưa viết |
| M3 | §4 timer trong tab, §5.4 sheet "+" | chưa viết |
| M4 | §6 Triệu chứng | chưa viết |
| M5 | §7 Tiêm chủng, §9 Khám phá | chưa viết |
| M6 | phần còn lại của §8 Thống kê, §11.3 | chưa viết |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Sáu mốc nhiệt độ** nằm trong hằng `TEMP_PRESETS` ở `lib/rules/quickEntry.ts`, là đúng chuỗi mà ô số hiện ("38,0"). Nút được tô khi chuỗi của nó bằng đúng chuỗi đang nhập; gõ tay "38" thì không nút nào tô.
2. **Lượng sữa khởi đầu** do hàm thuần `initialQuickValues(type, initial, recentLogs)` quyết định. Khi `initial` đã có `ml`, kể cả chuỗi rỗng, thì giữ nguyên giá trị đó.
3. **Nút "Ghi bù"** là component `BackfillButton`, export từ `components/history/HistoryScreen.tsx` để test được mà không phải dựng cả màn Nhật ký.
4. **Tiêu chí grep của §10** được giữ bằng test `lib/copyGuard.test.ts` thay vì chỉ chạy tay một lần.
5. **Ô `datetime-local`** vẫn có `aria-label="Chọn giờ"`. Spec chỉ đổi nhãn của 4 ô.
6. **Phương án dự phòng `px-1`** của §5.1 không nằm trong patch. Chỉ thêm khi bước kiểm trình duyệt (Task 5 Step 3) thấy nhãn "15p trước" bị cắt.
7. **Kiểm trình duyệt (§11.2)** do phiên chính làm bằng khung Browser trong app ở 375×812. Người dùng đã đồng ý dùng khung này trong phiên 2026-11-19.
8. **Lên `main`.** Theo lời người dùng ở dòng Status, sau khi Task 5 xanh thì fast-forward `main` tới nhánh này rồi push.

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
- Push lên `main` cần người dùng đồng ý từng lần. (Với spec này người dùng đã đồng ý trước cho cả 6 mốc, xem dòng Status.)
- Test hiện có phải xanh: 935 test vitest (148 file), pgTAP 001–013, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 8** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m1.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 8 patch đã được áp lần lượt lên một bản sao của `main` @ `ceb4878` ở ngoài repo: `tsc --noEmit` sạch sau mỗi task, số test vitest đỏ và xanh đúng như ghi, cả bộ cuối cùng là 951 test trong 151 file. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.

## Contracts with Other Plans

Plan này là mốc đầu của spec. M2–M6 chưa viết.

**Consumes (từ `main` @ `ceb4878`):**

- `components/ui/Segmented.tsx`: `Segmented<T>({ label, options, value, onChange })`, 2–6 lựa chọn, chữ 13 px khi có từ 3 lựa chọn.
- `components/ui/Button.tsx`: `Button` với `size="md"`, `variant="secondary"`.
- `lib/rules/quickEntry.ts`: `defaultQuickValues`, `recentBottleAmounts`, `TEMP_STEP`, `QuickValues`, `InstantType`.
- `components/quick/NumberStepper.tsx`: prop `placeholder`.

**Produces** (các mốc sau được dựa vào đúng những tên này):

- `lib/rules/timeChips.ts`: `TIME_CHIPS` có nhãn "Bây giờ", "5p trước", "15p trước", "Giờ khác"; giá trị `now`, `5m`, `15m`, `custom` không đổi.
- `components/quick/TimeChips.tsx`: vẽ bằng `Segmented`, prop không đổi.
- `lib/rules/quickEntry.ts`: `TEMP_PRESETS` (tuple 6 chuỗi), `initialQuickValues(type: InstantType, initial: QuickValues | undefined, recentLogs: LogLike[]): QuickValues`.
- `components/history/HistoryScreen.tsx`: `BackfillButton({ onClick }: { onClick: () => void })`.
- `lib/copyGuard.test.ts`: cấm chữ "Tummy" trong `components/` và `lib/` (trừ file test).
- **Vitest sau M1:** 951 test, 151 file.

---

### Task 1: Hàng "Lúc nào?" thành 4 ô đều nhau (§5.1)

**Files:**

- Modify: `lib/rules/timeChips.ts`
- Modify: `components/quick/TimeChips.tsx`
- Test: `lib/rules/timeChips.test.ts` (sửa), `components/quick/timechips.test.tsx` (mới)

**Interfaces:**

- Consumes: `Segmented` (`components/ui/Segmented.tsx`).
- Produces: `TIME_CHIPS` với nhãn mới; `TimeChips` giữ nguyên prop `chip`, `custom`, `onChip`, `onCustom`.

- [x] **Step 0: Tạo nhánh và commit spec cùng plan**

```bash
git checkout -b feat/kim-bun-ux-mobile-m1
git add docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m1.md
git commit -m "docs(spec): mobile UX spec and the M1 plan" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/quick/timechips.test.tsx b/components/quick/timechips.test.tsx
new file mode 100644
index 0000000..2bd4fd7
--- /dev/null
+++ b/components/quick/timechips.test.tsx
@@ -0,0 +1,37 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import type { TimeChip } from "@/lib/rules/timeChips";
+import { TimeChips } from "./TimeChips";
+
+const noop = () => {};
+const render = (chip: TimeChip) =>
+  renderToStaticMarkup(
+    <TimeChips
+      chip={chip}
+      custom="2026-11-14T08:30"
+      onChip={noop}
+      onCustom={noop}
+    />,
+  );
+
+describe("TimeChips", () => {
+  it("shows all four choices as equal segments, nothing to scroll", () => {
+    const html = render("now");
+    expect(html).toContain(">Lúc nào?</span>");
+    expect(html).toContain('role="group" aria-label="Lúc nào?"');
+    expect(html).toContain("grid-template-columns:repeat(4, minmax(0, 1fr))");
+    expect(html.match(/<button/g)).toHaveLength(4);
+    expect(html).toMatch(/aria-pressed="true"[^>]*>Bây giờ<\/button>/);
+    expect(html).toContain(">5p trước</button>");
+    expect(html).toContain(">15p trước</button>");
+    expect(html).toContain(">Giờ khác</button>");
+    expect(html).not.toContain("overflow-x-auto");
+    expect(html).not.toContain('type="datetime-local"');
+  });
+
+  it("Giờ khác opens the date and time field", () => {
+    const html = render("custom");
+    expect(html).toMatch(/aria-pressed="true"[^>]*>Giờ khác<\/button>/);
+    expect(html).toMatch(/type="datetime-local"[^>]*value="2026-11-14T08:30"/);
+  });
+});
diff --git a/lib/rules/timeChips.test.ts b/lib/rules/timeChips.test.ts
index d0e190b..d14eb76 100644
--- a/lib/rules/timeChips.test.ts
+++ b/lib/rules/timeChips.test.ts
@@ -16,7 +16,7 @@ describe("timeChipToDate", () => {
     );
   });
 
-  it("Chọn giờ… reads the datetime-local value in Vietnam time", () => {
+  it("Giờ khác reads the datetime-local value in Vietnam time", () => {
     expect(
       timeChipToDate("custom", NOW, "2026-11-14T08:30").toISOString(),
     ).toBe("2026-11-14T01:30:00.000Z");
@@ -44,9 +44,9 @@ describe("timeChipToDate", () => {
   it("lists the four chips in spec order", () => {
     expect(TIME_CHIPS).toEqual([
       { value: "now", label: "Bây giờ" },
-      { value: "5m", label: "5 phút trước" },
-      { value: "15m", label: "15 phút trước" },
-      { value: "custom", label: "Chọn giờ…" },
+      { value: "5m", label: "5p trước" },
+      { value: "15m", label: "15p trước" },
+      { value: "custom", label: "Giờ khác" },
     ]);
   });
 });
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/timeChips.test.ts components/quick/timechips.test.tsx`
Expected: FAIL, `Tests  3 failed | 3 passed (6)`. Ba test đỏ: "lists the four chips in spec order", "shows all four choices as equal segments, nothing to scroll", "Giờ khác opens the date and time field".

- [x] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/quick/TimeChips.tsx b/components/quick/TimeChips.tsx
index 43e8d4e..9bd48bd 100644
--- a/components/quick/TimeChips.tsx
+++ b/components/quick/TimeChips.tsx
@@ -1,8 +1,8 @@
-import { ChipGroup } from "@/components/ui/ChipGroup";
+import { Segmented } from "@/components/ui/Segmented";
 import { TIME_CHIPS, type TimeChip } from "@/lib/rules/timeChips";
 import { FIELD_INPUT, FIELD_LABEL } from "./styles";
 
-// Spec §8.1: "Lúc nào?" — Bây giờ · 5 phút trước · 15 phút trước · Chọn giờ…
+// Spec 2026-11-19 §5.1: "Lúc nào?" as four equal segments, nothing to scroll.
 export function TimeChips({
   chip,
   custom,
@@ -17,7 +17,7 @@ export function TimeChips({
   return (
     <div className="flex flex-col gap-2">
       <span className={FIELD_LABEL}>Lúc nào?</span>
-      <ChipGroup
+      <Segmented
         label="Lúc nào?"
         options={TIME_CHIPS}
         value={chip}
diff --git a/lib/rules/timeChips.ts b/lib/rules/timeChips.ts
index adb902b..b4545a0 100644
--- a/lib/rules/timeChips.ts
+++ b/lib/rules/timeChips.ts
@@ -4,9 +4,9 @@ export type TimeChip = "now" | "5m" | "15m" | "custom";
 
 export const TIME_CHIPS: { value: TimeChip; label: string }[] = [
   { value: "now", label: "Bây giờ" },
-  { value: "5m", label: "5 phút trước" },
-  { value: "15m", label: "15 phút trước" },
-  { value: "custom", label: "Chọn giờ…" },
+  { value: "5m", label: "5p trước" },
+  { value: "15m", label: "15p trước" },
+  { value: "custom", label: "Giờ khác" },
 ];
 
 const MINUTES_AGO: Record<Exclude<TimeChip, "custom">, number> = {
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/timeChips.test.ts components/quick/timechips.test.tsx components/home/quickentry.test.tsx && bun run typecheck`
Expected: `Tests  12 passed (12)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/timeChips.ts lib/rules/timeChips.test.ts components/quick/TimeChips.tsx components/quick/timechips.test.tsx
git commit -m "feat(quick-entry): show the four time choices as equal segments" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Sáu mốc nhiệt độ và placeholder mới (§5.2)

**Files:**

- Modify: `lib/rules/quickEntry.ts`
- Modify: `components/quick/TemperatureFields.tsx`
- Test: `lib/rules/quickEntry.test.ts`, `components/quick/numbers.test.tsx`, `components/home/quickentry.test.tsx` (đều sửa)

**Interfaces:**

- Consumes: `TEMP_STEP`, `stepAmount`, `NumberStepper`, `cx`.
- Produces: `TEMP_PRESETS = ["36,5", "37,0", "37,5", "38,0", "38,5", "39,0"] as const` trong `lib/rules/quickEntry.ts`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/home/quickentry.test.tsx b/components/home/quickentry.test.tsx
index 84a04f2..2fb3b0a 100644
--- a/components/home/quickentry.test.tsx
+++ b/components/home/quickentry.test.tsx
@@ -53,7 +53,7 @@ describe("QuickEntrySheet", () => {
     expect(render({ type: "diaper" })).toMatch(
       /aria-pressed="true"[^>]*>Ướt<\/button>/,
     );
-    expect(render({ type: "temperature" })).toContain('placeholder="37,0"');
+    expect(render({ type: "temperature" })).toContain('placeholder="––,–"');
     const medicine = render({ type: "medicine" });
     expect(medicine).toContain(">Cho uống thuốc</h2>");
     expect(medicine).toContain(">Thuốc hạ sốt</span>");
diff --git a/components/quick/numbers.test.tsx b/components/quick/numbers.test.tsx
index 061f974..9415e2b 100644
--- a/components/quick/numbers.test.tsx
+++ b/components/quick/numbers.test.tsx
@@ -1,6 +1,7 @@
 import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
 import { findElements } from "@/components/ui/testTree";
+import { TEMP_PRESETS } from "@/lib/rules/quickEntry";
 import { BottleFields } from "./BottleFields";
 import { TemperatureFields } from "./TemperatureFields";
 
@@ -47,13 +48,13 @@ describe("BottleFields", () => {
 });
 
 describe("TemperatureFields", () => {
-  it("empty field with 37,0 placeholder, ±0,1 and where it was measured", () => {
+  it("empty field with a dash placeholder, ±0,1 and where it was measured", () => {
     const onChange = vi.fn();
     const values = { celsius: "", method: "nach" };
     const html = renderToStaticMarkup(
       <TemperatureFields values={values} onChange={onChange} />,
     );
-    expect(html).toContain('placeholder="37,0"');
+    expect(html).toContain('placeholder="––,–"');
     expect(html).toContain(">°C</span>");
     expect(html).toContain('aria-label="Thêm 0,1 độ"');
     expect(html).toMatch(/aria-pressed="true"[^>]*>Nách<\/button>/);
@@ -65,4 +66,37 @@ describe("TemperatureFields", () => {
       method: "nach",
     });
   });
+
+  it("six preset temperatures; the one equal to the value is pressed", () => {
+    const html = renderToStaticMarkup(
+      <TemperatureFields
+        values={{ celsius: "38,0", method: "nach" }}
+        onChange={() => {}}
+      />,
+    );
+    const group = html.slice(
+      html.indexOf('aria-label="Mốc nhiệt độ"'),
+      html.indexOf('aria-label="Đo ở"'),
+    );
+    expect(group.match(/<button/g)).toHaveLength(6);
+    for (const preset of TEMP_PRESETS)
+      expect(group).toContain(`>${preset}</button>`);
+    expect(group.match(/aria-pressed="true"/g)).toHaveLength(1);
+    expect(group).toMatch(
+      /aria-pressed="true"[^>]*bg-ink text-bg[^>]*>38,0<\/button>/,
+    );
+    expect(group).toMatch(/aria-pressed="false"[^>]*glass[^>]*>37,5<\/button>/);
+  });
+
+  it("a preset fills the field with exactly its text", () => {
+    const onChange = vi.fn();
+    const values = { celsius: "", method: "tai" };
+    const tree = TemperatureFields({ values, onChange });
+    const [chip] = findElements(tree, (el) => el.props.children === "38,5");
+    (chip.props.onClick as () => void)();
+    expect(onChange).toHaveBeenLastCalledWith({
+      celsius: "38,5",
+      method: "tai",
+    });
+  });
 });
diff --git a/lib/rules/quickEntry.test.ts b/lib/rules/quickEntry.test.ts
index 7dfc97f..fa102ce 100644
--- a/lib/rules/quickEntry.test.ts
+++ b/lib/rules/quickEntry.test.ts
@@ -14,6 +14,7 @@ import {
   recentMedicineNames,
   stepAmount,
   STOOL_OPTIONS,
+  TEMP_PRESETS,
   TEMP_STEP,
   withDiaperKind,
 } from "@/lib/rules/quickEntry";
@@ -377,3 +378,20 @@ describe("diaper kind", () => {
     ]);
   });
 });
+
+describe("TEMP_PRESETS", () => {
+  it("six values from 36,5 to 39,0 that the temperature form accepts", () => {
+    expect(TEMP_PRESETS).toEqual([
+      "36,5",
+      "37,0",
+      "37,5",
+      "38,0",
+      "38,5",
+      "39,0",
+    ]);
+    for (const celsius of TEMP_PRESETS)
+      expect(
+        buildDetails("temperature", { celsius, method: "nach" }).ok,
+      ).toBe(true);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/quick/numbers.test.tsx components/home/quickentry.test.tsx lib/rules/quickEntry.test.ts`
Expected: FAIL, `Tests  5 failed | 26 passed (31)`.

- [x] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/quick/TemperatureFields.tsx b/components/quick/TemperatureFields.tsx
index 63cb189..cdf2b0e 100644
--- a/components/quick/TemperatureFields.tsx
+++ b/components/quick/TemperatureFields.tsx
@@ -2,11 +2,16 @@ import { Segmented } from "@/components/ui/Segmented";
 import {
   METHOD_OPTIONS,
   stepAmount,
+  TEMP_PRESETS,
   TEMP_STEP,
   type QuickValues,
 } from "@/lib/rules/quickEntry";
+import { cx } from "@/lib/ui/cx";
 import { NumberStepper } from "./NumberStepper";
 
+const PRESET =
+  "min-h-11 rounded-full text-[15px] font-semibold tabular-nums transition-transform duration-[120ms] active:scale-[0.97]";
+
 export function TemperatureFields({
   values,
   onChange,
@@ -22,7 +27,7 @@ export function TemperatureFields({
         label="Nhiệt độ"
         value={celsius}
         unit="°C"
-        placeholder="37,0"
+        placeholder="––,–"
         minus={{
           text: "−0,1",
           label: "Bớt 0,1 độ",
@@ -35,6 +40,32 @@ export function TemperatureFields({
         }}
         onChange={setCelsius}
       />
+      <div
+        role="group"
+        aria-label="Mốc nhiệt độ"
+        className="grid grid-cols-6 gap-1.5"
+      >
+        {TEMP_PRESETS.map((preset) => {
+          const on = preset === celsius;
+          return (
+            <button
+              key={preset}
+              type="button"
+              aria-pressed={on}
+              onClick={() => setCelsius(preset)}
+              className={cx(
+                PRESET,
+                // The picked one drops `glass`; the clear border keeps its size.
+                on
+                  ? "border border-transparent bg-ink text-bg"
+                  : "glass text-ink",
+              )}
+            >
+              {preset}
+            </button>
+          );
+        })}
+      </div>
       <Segmented
         label="Đo ở"
         options={METHOD_OPTIONS}
diff --git a/lib/rules/quickEntry.ts b/lib/rules/quickEntry.ts
index b7acfab..f101057 100644
--- a/lib/rules/quickEntry.ts
+++ b/lib/rules/quickEntry.ts
@@ -283,6 +283,16 @@ export type StepRule = { start: number; min: number; decimals: number };
 export const ML_STEP: StepRule = { start: 0, min: 0, decimals: 0 };
 export const TEMP_STEP: StepRule = { start: 37, min: 0, decimals: 1 };
 
+// Spec 2026-11-19 §5.2: the six preset temperatures, as the text the field shows.
+export const TEMP_PRESETS = [
+  "36,5",
+  "37,0",
+  "37,5",
+  "38,0",
+  "38,5",
+  "39,0",
+] as const;
+
 // The −/+ buttons next to a number field. An empty or unreadable field starts at `rule.start`.
 export function stepAmount(
   value: string,
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/quick/numbers.test.tsx components/home/quickentry.test.tsx lib/rules/quickEntry.test.ts lib/themeGuard.test.ts lib/ui/glassNesting.test.ts && bun run typecheck`
Expected: `Tests  33 passed (33)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/quickEntry.ts lib/rules/quickEntry.test.ts components/quick/TemperatureFields.tsx components/quick/numbers.test.tsx components/home/quickentry.test.tsx
git commit -m "feat(quick-entry): preset temperatures and a dash placeholder" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Bú bình mở ra với lượng gần nhất (§5.3)

**Files:**

- Modify: `lib/rules/quickEntry.ts`
- Modify: `components/home/QuickEntrySheet.tsx`
- Modify: `components/quick/BottleFields.tsx`
- Test: `lib/rules/quickEntry.test.ts`, `components/quick/numbers.test.tsx`, `components/home/quickentry.test.tsx` (đều sửa)

**Interfaces:**

- Consumes: `defaultQuickValues`, `recentBottleAmounts` (cùng file).
- Produces: `initialQuickValues(type: InstantType, initial: QuickValues | undefined, recentLogs: LogLike[]): QuickValues`. `QuickEntrySheet` dùng kết quả này làm cả giá trị đang nhập lẫn mốc so sánh `dirty`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/home/quickentry.test.tsx b/components/home/quickentry.test.tsx
index 2fb3b0a..e9393f4 100644
--- a/components/home/quickentry.test.tsx
+++ b/components/home/quickentry.test.tsx
@@ -49,6 +49,18 @@ describe("QuickEntrySheet", () => {
     expect(html).not.toContain("rounded-xl border");
   });
 
+  it("bottle starts from the latest amount, or empty when there is none", () => {
+    expect(render({ type: "bottle", recentLogs: [bottle] })).toContain(
+      'value="120"',
+    );
+    const empty = render({ type: "bottle" });
+    expect(empty).toContain('placeholder="0"');
+    expect(empty).not.toContain('value="120"');
+    expect(
+      render({ type: "bottle", recentLogs: [bottle], initial: { ml: "60" } }),
+    ).toContain('value="60"');
+  });
+
   it("opens each type with its own fields", () => {
     expect(render({ type: "diaper" })).toMatch(
       /aria-pressed="true"[^>]*>Ướt<\/button>/,
diff --git a/components/quick/numbers.test.tsx b/components/quick/numbers.test.tsx
index 9415e2b..2500690 100644
--- a/components/quick/numbers.test.tsx
+++ b/components/quick/numbers.test.tsx
@@ -47,6 +47,20 @@ describe("BottleFields", () => {
   });
 });
 
+describe("BottleFields placeholder", () => {
+  it("an empty amount shows 0 as the placeholder", () => {
+    const html = renderToStaticMarkup(
+      <BottleFields
+        values={{ ml: "", milk: "formula" }}
+        onChange={() => {}}
+        recent={[]}
+      />,
+    );
+    expect(html).toContain('placeholder="0"');
+    expect(html).toContain('value=""');
+  });
+});
+
 describe("TemperatureFields", () => {
   it("empty field with a dash placeholder, ±0,1 and where it was measured", () => {
     const onChange = vi.fn();
diff --git a/lib/rules/quickEntry.test.ts b/lib/rules/quickEntry.test.ts
index fa102ce..4384c5f 100644
--- a/lib/rules/quickEntry.test.ts
+++ b/lib/rules/quickEntry.test.ts
@@ -5,6 +5,7 @@ import {
   defaultQuickValues,
   DIAPER_KIND_OPTIONS,
   diaperKind,
+  initialQuickValues,
   MEDICINE_PRESETS,
   medicinePrefill,
   ML_STEP,
@@ -395,3 +396,38 @@ describe("TEMP_PRESETS", () => {
       ).toBe(true);
   });
 });
+
+describe("initialQuickValues", () => {
+  const logs = [bottleLog(180, 90), bottleLog(10, 120)];
+
+  it("a bottle opens with the most recent amount", () => {
+    expect(initialQuickValues("bottle", undefined, logs)).toEqual({
+      ml: "120",
+      milk: "breast_milk",
+    });
+  });
+
+  it("no bottle yet: the amount stays empty", () => {
+    expect(initialQuickValues("bottle", undefined, [])).toEqual({
+      ml: "",
+      milk: "breast_milk",
+    });
+  });
+
+  it("an amount given by the caller wins, even an empty one", () => {
+    expect(initialQuickValues("bottle", { ml: "60" }, logs).ml).toBe("60");
+    expect(initialQuickValues("bottle", { ml: "" }, logs).ml).toBe("");
+  });
+
+  it("other types only merge the defaults with what the caller gave", () => {
+    expect(initialQuickValues("water", undefined, logs)).toEqual({ ml: "" });
+    expect(
+      initialQuickValues("medicine", { name: "Vitamin D" }, logs),
+    ).toEqual({
+      name: "Vitamin D",
+      amount: "",
+      unit: "ml",
+      antipyretic: false,
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/quick/numbers.test.tsx components/home/quickentry.test.tsx lib/rules/quickEntry.test.ts`
Expected: FAIL, `Tests  6 failed | 31 passed (37)`. Bốn test của `initialQuickValues` báo `TypeError: initialQuickValues is not a function`.

- [x] **Step 3: Sửa code (Patch 6)**

```diff
diff --git a/components/home/QuickEntrySheet.tsx b/components/home/QuickEntrySheet.tsx
index df88be2..a142a12 100644
--- a/components/home/QuickEntrySheet.tsx
+++ b/components/home/QuickEntrySheet.tsx
@@ -16,7 +16,7 @@ import { useAddInstant } from "@/lib/data/logs";
 import { medicineWarnings } from "@/lib/rules/alerts";
 import {
   buildDetails,
-  defaultQuickValues,
+  initialQuickValues,
   MEDICINE_PRESETS,
   medicinePrefill,
   recentBottleAmounts,
@@ -69,10 +69,9 @@ export function QuickEntrySheet({
 }) {
   const add = useAddInstant(babyId, userId);
   const formId = useId();
-  const [start] = useState<QuickValues>(() => ({
-    ...defaultQuickValues(type),
-    ...initial,
-  }));
+  const [start] = useState<QuickValues>(() =>
+    initialQuickValues(type, initial, recentLogs),
+  );
   const [values, setValues] = useState<QuickValues>(start);
   const [chip, setChip] = useState<TimeChip>("now");
   const [custom, setCustom] = useState(() => toVnLocalInput(new Date()));
diff --git a/components/quick/BottleFields.tsx b/components/quick/BottleFields.tsx
index b098102..cfb23dc 100644
--- a/components/quick/BottleFields.tsx
+++ b/components/quick/BottleFields.tsx
@@ -25,6 +25,7 @@ export function BottleFields({
         label="Số ml"
         value={ml}
         unit="ml"
+        placeholder="0"
         minus={{
           text: "−10",
           label: "Bớt 10 ml",
diff --git a/lib/rules/quickEntry.ts b/lib/rules/quickEntry.ts
index f101057..f12040c 100644
--- a/lib/rules/quickEntry.ts
+++ b/lib/rules/quickEntry.ts
@@ -137,6 +137,19 @@ export function defaultQuickValues(type: InstantType): QuickValues {
   return { ...DEFAULTS[type] };
 }
 
+// Spec 2026-11-19 §5.3: what a quick-entry sheet starts from. A bottle opens with
+// the most recent amount, unless the caller already gave one.
+export function initialQuickValues(
+  type: InstantType,
+  initial: QuickValues | undefined,
+  recentLogs: LogLike[],
+): QuickValues {
+  const values = { ...defaultQuickValues(type), ...initial };
+  if (type !== "bottle" || initial?.ml !== undefined) return values;
+  const [latest] = recentBottleAmounts(recentLogs);
+  return latest === undefined ? values : { ...values, ml: String(latest) };
+}
+
 function toNumber(value: string | boolean | undefined): number {
   if (typeof value !== "string" || value.trim() === "") return Number.NaN;
   return Number(value.trim().replace(",", "."));
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/quick/numbers.test.tsx components/home/quickentry.test.tsx lib/rules/quickEntry.test.ts && bun run typecheck`
Expected: `Tests  37 passed (37)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/quickEntry.ts lib/rules/quickEntry.test.ts components/home/QuickEntrySheet.tsx components/home/quickentry.test.tsx components/quick/BottleFields.tsx components/quick/numbers.test.tsx
git commit -m "feat(quick-entry): open the bottle sheet with the latest amount" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: "Nằm sấp" thay "Tummy", nút "Ghi bù" (§10, §8 gạch đầu dòng 1)

**Files:**

- Modify: `lib/rules/describeLog.ts`, `lib/rules/dailyStats.ts`
- Modify: `components/stats/StatsScreen.tsx`, `components/stats/StatsTable.tsx`
- Modify: `components/history/HistoryScreen.tsx`
- Test: `lib/copyGuard.test.ts` (mới), `components/history/historyscreen.test.tsx` (mới), `lib/rules/describeLog.test.ts`, `lib/rules/dailyStats.test.ts`, `components/stats/statstable.test.tsx` (sửa)

**Interfaces:**

- Consumes: `Button` (`components/ui/Button.tsx`).
- Produces: `BackfillButton({ onClick }: { onClick: () => void })` export từ `components/history/HistoryScreen.tsx`; test chặn `lib/copyGuard.test.ts`.

- [x] **Step 1: Viết test đỏ (Patch 7)**

```diff
diff --git a/components/history/historyscreen.test.tsx b/components/history/historyscreen.test.tsx
new file mode 100644
index 0000000..75f5f54
--- /dev/null
+++ b/components/history/historyscreen.test.tsx
@@ -0,0 +1,23 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { BackfillButton } from "./HistoryScreen";
+
+describe("BackfillButton", () => {
+  it("is a labelled glass button, not the calendar icon", () => {
+    const html = renderToStaticMarkup(<BackfillButton onClick={() => {}} />);
+    expect(html).toMatch(
+      /<button[^>]*aria-label="Thêm bản ghi cũ"[^>]*>Ghi bù<\/button>/,
+    );
+    expect(html).toContain("glass");
+    expect(html).toContain("min-h-11");
+    expect(html).not.toContain(ICON_PATHS.calendar);
+  });
+
+  it("calls onClick", () => {
+    const onClick = vi.fn();
+    const tree = BackfillButton({ onClick });
+    (tree.props.onClick as () => void)();
+    expect(onClick).toHaveBeenCalledOnce();
+  });
+});
diff --git a/components/stats/statstable.test.tsx b/components/stats/statstable.test.tsx
index e004efb..5dda4c6 100644
--- a/components/stats/statstable.test.tsx
+++ b/components/stats/statstable.test.tsx
@@ -67,4 +67,12 @@ describe("StatsTable", () => {
     );
     expect(cells).toEqual(["0", "60", "2", "30"]);
   });
+
+  it("the tummy tab's column is called Nằm sấp", () => {
+    const html = renderToStaticMarkup(
+      <StatsTable stats={stats} tab="tummy" now={NOW} />,
+    );
+    expect(html).toContain(">Nằm sấp</th>");
+    expect(html).not.toContain("Tummy");
+  });
 });
diff --git a/lib/copyGuard.test.ts b/lib/copyGuard.test.ts
new file mode 100644
index 0000000..3d69c03
--- /dev/null
+++ b/lib/copyGuard.test.ts
@@ -0,0 +1,24 @@
+import { readdirSync, readFileSync } from "node:fs";
+import { join } from "node:path";
+import { describe, expect, it } from "vitest";
+
+function sourceFiles(dir: string): string[] {
+  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
+    const path = join(dir, entry.name);
+    if (entry.isDirectory()) return sourceFiles(path);
+    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
+      ? [path]
+      : [];
+  });
+}
+
+// Spec 2026-11-19 §10: the tummy timer is "Nằm sấp" everywhere on screen.
+describe("copy guard", () => {
+  it('no source file shows the English word "Tummy"', () => {
+    const files = [...sourceFiles("components"), ...sourceFiles("lib")];
+    const problems = files.filter((file) =>
+      readFileSync(file, "utf8").includes("Tummy"),
+    );
+    expect(problems).toEqual([]);
+  });
+});
diff --git a/lib/rules/dailyStats.test.ts b/lib/rules/dailyStats.test.ts
index 76d834b..e5432cf 100644
--- a/lib/rules/dailyStats.test.ts
+++ b/lib/rules/dailyStats.test.ts
@@ -170,6 +170,9 @@ describe("dailyStats", () => {
 
   it("STATS_TABS ends with Ăn dặm", () => {
     expect(STATS_TABS).toHaveLength(6);
+    expect(STATS_TABS.find((tab) => tab.value === "tummy")?.label).toBe(
+      "Nằm sấp",
+    );
     expect(STATS_TABS.at(-1)).toEqual({ value: "solids", label: "Ăn dặm" });
   });
 
diff --git a/lib/rules/describeLog.test.ts b/lib/rules/describeLog.test.ts
index 69c1452..3358c5f 100644
--- a/lib/rules/describeLog.test.ts
+++ b/lib/rules/describeLog.test.ts
@@ -18,6 +18,19 @@ describe("describeLog", () => {
       ),
     ).toBe("Bú trái · 12 phút (đang chạy)");
   });
+  it("names a tummy timer Nằm sấp", () => {
+    expect(
+      describeLog(
+        {
+          type: "tummy",
+          started_at: at("2026-11-13T02:50:00Z"),
+          ended_at: at("2026-11-13T02:54:00Z"),
+          details: {},
+        },
+        now,
+      ),
+    ).toBe("Nằm sấp · 4 phút");
+  });
   it("describes a finished sleep", () => {
     expect(
       describeLog(
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/copyGuard.test.ts components/history/historyscreen.test.tsx lib/rules/describeLog.test.ts lib/rules/dailyStats.test.ts components/stats/statstable.test.tsx`
Expected: FAIL, `Tests  6 failed | 20 passed (26)`. Test chặn liệt kê 4 file còn chữ "Tummy".

- [x] **Step 3: Sửa code (Patch 8)**

```diff
diff --git a/components/history/HistoryScreen.tsx b/components/history/HistoryScreen.tsx
index 1c171df..88cde2a 100644
--- a/components/history/HistoryScreen.tsx
+++ b/components/history/HistoryScreen.tsx
@@ -6,7 +6,6 @@ import { Button } from "@/components/ui/Button";
 import { ChipGroup } from "@/components/ui/ChipGroup";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { ErrorCard } from "@/components/ui/ErrorCard";
-import { IconButton } from "@/components/ui/IconButton";
 import { PageHeader } from "@/components/ui/PageHeader";
 import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
 import { Skeleton } from "@/components/ui/Skeleton";
@@ -31,6 +30,20 @@ import { LogEditSheet } from "./LogEditSheet";
 
 type SheetState = { log: LogRow | null } | null;
 
+// Spec 2026-11-19 §10: adding an old log is a labelled button, not a calendar icon.
+export function BackfillButton({ onClick }: { onClick: () => void }) {
+  return (
+    <Button
+      size="md"
+      variant="secondary"
+      aria-label="Thêm bản ghi cũ"
+      onClick={onClick}
+    >
+      Ghi bù
+    </Button>
+  );
+}
+
 export function HistoryScreen({
   baby,
   member,
@@ -70,13 +83,7 @@ export function HistoryScreen({
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title="Nhật ký"
-        action={
-          <IconButton
-            label="Thêm bản ghi cũ"
-            icon="calendar"
-            onClick={() => setSheet({ log: null })}
-          />
-        }
+        action={<BackfillButton onClick={() => setSheet({ log: null })} />}
       />
 
       <ChipGroup
diff --git a/components/stats/StatsScreen.tsx b/components/stats/StatsScreen.tsx
index 80d5f9b..e6f3cb3 100644
--- a/components/stats/StatsScreen.tsx
+++ b/components/stats/StatsScreen.tsx
@@ -73,7 +73,7 @@ const SERIES: Record<
     secondaryColor: null,
   },
   tummy: {
-    primary: "Tummy (phút)",
+    primary: "Nằm sấp (phút)",
     secondary: null,
     color: "var(--color-cat-tummy)",
     secondaryColor: null,
diff --git a/components/stats/StatsTable.tsx b/components/stats/StatsTable.tsx
index 87a9b33..6bf3b41 100644
--- a/components/stats/StatsTable.tsx
+++ b/components/stats/StatsTable.tsx
@@ -25,7 +25,7 @@ export const STATS_COLUMNS: Record<
   pump: [{ label: "Sữa hút (ml)", value: (s) => String(s.pumpMl) }],
   tummy: [
     {
-      label: "Tummy",
+      label: "Nằm sấp",
       value: (s) =>
         s.tummyMinutes === 0 ? "—" : formatDuration(s.tummyMinutes * 60_000),
     },
diff --git a/lib/rules/dailyStats.ts b/lib/rules/dailyStats.ts
index 9454c03..9a3cf80 100644
--- a/lib/rules/dailyStats.ts
+++ b/lib/rules/dailyStats.ts
@@ -25,7 +25,7 @@ export const STATS_TABS: { value: StatsTab; label: string }[] = [
   { value: "feed", label: "Bú" },
   { value: "diaper", label: "Tã" },
   { value: "pump", label: "Hút sữa" },
-  { value: "tummy", label: "Tummy" },
+  { value: "tummy", label: "Nằm sấp" },
   { value: "solids", label: "Ăn dặm" },
 ];
 
diff --git a/lib/rules/describeLog.ts b/lib/rules/describeLog.ts
index 70b3f75..15c6068 100644
--- a/lib/rules/describeLog.ts
+++ b/lib/rules/describeLog.ts
@@ -32,7 +32,7 @@ const AMOUNT = { little: "ít", some: "vừa", lots: "nhiều" } as const;
 const TIMER_LABEL = {
   sleep: "Ngủ",
   pump: "Hút sữa",
-  tummy: "Tummy time",
+  tummy: "Nằm sấp",
 } as const;
 
 function duration(log: LogLike, now: Date): string {
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/copyGuard.test.ts components/history/historyscreen.test.tsx lib/rules/describeLog.test.ts lib/rules/dailyStats.test.ts components/stats/statstable.test.tsx && bun run typecheck`
Expected: `Tests  26 passed (26)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/copyGuard.test.ts lib/rules/describeLog.ts lib/rules/describeLog.test.ts lib/rules/dailyStats.ts lib/rules/dailyStats.test.ts components/stats/StatsScreen.tsx components/stats/StatsTable.tsx components/stats/statstable.test.tsx components/history/HistoryScreen.tsx components/history/historyscreen.test.tsx
git commit -m "feat(copy): say Nằm sấp everywhere and label the Ghi bù button" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 5: Kiểm cuối M1 và lên `main`

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m1.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ Task 1–4 tạo ra.
- Produces: `main` có M1; nhánh `feat/kim-bun-ux-mobile-m1` làm nền cho M2.

- [x] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  151 passed (151)`, `Tests  951 passed (951)`.

- [x] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không bấm Lưu, không đụng timer)**

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Mở `http://localhost:3000/` trong khung Browser của app ở cỡ 375×812. Đóng mọi sheet bằng phím Esc.

1. Mở "Thay tã": hàng "Lúc nào?" có đủ 4 ô "Bây giờ", "5p trước", "15p trước", "Giờ khác" trên một hàng. Chạy bằng javascript tool: `[...document.querySelectorAll('dialog[open] [aria-label="Lúc nào?"] button')].map((b) => [b.textContent, b.scrollWidth <= b.clientWidth])`. Kỳ vọng: 4 phần tử, phần tử thứ hai của mỗi cặp là `true`. Nếu có `false` thì áp phương án dự phòng của §5.1 (đổi `px-1.5` thành `px-1` trong `components/ui/Segmented.tsx`), sửa test `segmented.test.tsx` nếu nó ghim lớp này, rồi kiểm lại. Sau đó chạm ô "15p trước" (chỉ đổi trạng thái trong sheet) và chạy lại đoạn javascript: ô đang chọn dùng chữ đậm hơn nên rộng hơn. Nếu phải áp phương án dự phòng thì chạy lại Step 1 rồi commit riêng trước Step 4: `git add components/ui/Segmented.tsx components/ui/segmented.test.tsx && git commit -m "fix(ui): tighter segment padding so four time labels fit at 375 px" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"`.
2. Chạm "Giờ khác": hiện ô ngày giờ. Đóng bằng Esc; nếu hỏi "Bỏ thay đổi?" thì chọn "Bỏ thay đổi".
3. Mở "Nhiệt độ": ô số hiện "––,–" màu nhạt; có 6 nút 36,5 đến 39,0 trên một hàng; chạm "38,0" thì ô số thành 38,0 và nút đó tô đậm. Đóng bằng Esc, chọn "Bỏ thay đổi".
4. Mở "Bú bình": nếu 72 giờ qua có cữ bình (sheet chỉ đọc khoảng mà `useRecentLogs` tải về) thì ô số hiện lượng gần nhất và đóng bằng Esc không hỏi gì; nếu 72 giờ qua không có cữ bình nào thì ô số hiện "0" màu nhạt.
5. Mở `/nhat-ky`: góc phải tiêu đề là nút chữ "Ghi bù". Bản ghi nằm sấp (nếu có) ghi "Nằm sấp".
6. Mở `/thong-ke`: chip thứ năm là "Nằm sấp".
7. Lặp mục 1 và 3 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`: chữ đọc rõ, nút đang chọn nổi bật.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được thì ghi "chưa kiểm".

> **Kết quả 2026-11-20.** Task 1–4 làm trên nhánh `feat/kim-bun-ux-mobile-m1`: cả 8 patch áp sạch, số test đỏ và xanh của từng task đúng như ghi. Step 1: `tsc --noEmit` sạch, `Test Files  151 passed (151)`, `Tests  951 passed (951)`. Step 2: `bun run build` lần đầu dừng với thông báo bảo mật của Next.js, lần hai thoát mã 0 với `✓ Generating static pages using 9 workers (38/38)`.
>
> Step 3, phiên chính kiểm bằng khung Browser trong app ở 375×812 (`innerWidth` 375), không bấm Lưu, không đụng timer (lúc kiểm có một timer Ngủ đang chạy thật):
>
> - Mục 1: sheet Thay tã có đủ 4 ô "Bây giờ", "5p trước", "15p trước", "Giờ khác" trên một hàng, mỗi ô rộng 74 px. `scrollWidth <= clientWidth` đúng với cả 4 ô, kể cả khi "15p trước" đang được chọn (chữ đậm 600). Không cần phương án dự phòng `px-1`.
> - Mục 2: chạm "Giờ khác" thì hiện ô ngày giờ; Esc hỏi "Bỏ thay đổi?", chọn "Bỏ thay đổi" thì sheet đóng.
> - Mục 3: ô số của Đo nhiệt độ trống, placeholder "––,–"; 6 nút 36,5 đến 39,0 nằm một hàng, mỗi nút 48×44 px; chạm "38,0" thì ô số thành "38,0" và chỉ nút đó có `aria-pressed="true"`. Đóng bằng Esc rồi "Bỏ thay đổi".
> - Mục 4: 72 giờ qua không có cữ bình nào nên ô số trống với placeholder "0", Esc đóng ngay không hỏi. **Chưa kiểm:** nhánh "điền sẵn lượng gần nhất" trên dữ liệu thật (chỉ có unit test).
> - Mục 5: Nhật ký có nút chữ "Ghi bù" 80×44 px, `aria-label="Thêm bản ghi cũ"`, không còn icon lịch; các bản ghi cũ hiện "Nằm sấp · 4 phút", "Nằm sấp · 2 phút"; không tràn ngang.
> - Mục 6: Thống kê có các chip Ngủ, Bú, Tã, Hút sữa, Nằm sấp, Ăn dặm.
> - Mục 7: sheet Đo nhiệt độ (kèm hàng "Lúc nào?") đã xem ở Ban đêm và Hồng dịu: chữ đọc rõ, nút đang chọn nổi bật. Sheet Thay tã chỉ xem ở Ban đêm.
> - Chưa thử: bấm Lưu thật ở bất kỳ sheet nào, và iPhone thật (Safari).

- [x] **Step 4: Commit phần ghi kết quả, đưa lên `main`, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m1.md
git commit -m "docs(plan): record the M1 check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-ux-mobile-m1
git push origin main
```

Báo cáo cho người dùng: `git log --oneline ceb4878..main`; kết quả typecheck, vitest, build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa.
