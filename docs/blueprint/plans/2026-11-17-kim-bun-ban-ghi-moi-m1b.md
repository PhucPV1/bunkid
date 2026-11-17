# Kim Bun — M1b Bốn loại bản ghi mới: sửa bản ghi, bộ lọc Nhật ký, Thống kê Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md` (§3.3 đoạn `LogEditSheet` và `FieldList`; §3.4; phần tương ứng của §6.1 và §6.3). Plan theo bản spec đã cập nhật ngày 2026-11-17.

**Status:** approved 2026-11-17

**Goal:** Thêm và sửa được bốn loại bản ghi mới trong sheet của Nhật ký; Nhật ký có hai bộ lọc "Ăn dặm" và "Khác"; Thống kê có tab "Ăn dặm" với số bữa và số ml nước. Hết plan này là hết mốc M1 của spec.

**Architecture:**

- **Luật thuần (`lib/rules/`):** `MANUAL_TYPES` và `hasNoteField` (`logForm.ts`), `HISTORY_FILTERS` (`history.ts`), `DayStat` / `STATS_TABS` / `chartRows` / `emptyStatsText` (`dailyStats.ts`).
- **Giao diện:** `FieldList` vẽ `textarea` và truyền `maxLength`; `LogEditSheet` ẩn ô "Ghi chú" với loại `note`; `StatsTable` và `StatsScreen` có thêm tab `solids`.
- **Không phải sửa:** `LOG_FIELDS`, `defaultLogValues`, `valuesFromDetails`, `buildLogDetails` (đã nhận 4 loại mới qua `QUICK_FIELDS` / `buildDetails` của M1a); `HistoryScreen` (vẽ `HISTORY_FILTERS` bằng `ChipGroup` cuộn ngang); `HistoryList`; `daySummary`.
- Ba task độc lập nhau về code; thứ tự chỉ để commit gọn. Không có migration.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, zod 4, Vitest (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ban-ghi-moi-m1b`, cắt từ `feat/kim-bun-ban-ghi-moi-m1a` sau khi M1a xong. Baseline: 827 test vitest xanh (141 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                             | Plan                                    |
| ------------------ | -------------------------------------------------------------------- | --------------------------------------- |
| M1a                | Migration `log_types`, §3.1, §3.2, §3.3 (nhập nhanh, bảng "+"), §3.5 | `2026-11-17-kim-bun-ban-ghi-moi-m1.md`  |
| **M1b (plan này)** | §3.3 (`LogEditSheet`), §3.4 (bộ lọc Nhật ký, Thống kê)               | `2026-11-17-kim-bun-ban-ghi-moi-m1b.md` |
| M2                 | §5 canh timer trong app, `TIMER_LIMIT_MIN`                           | chưa viết                               |
| M3                 | Migration `reminders`, §4.4, giờ yên lặng, `hold_feed_while_asleep`  | chưa viết                               |
| M4                 | §4.2 lịch thuốc, nhắc thuốc, nhắc hạ sốt, push timer, checklist §6.4 | chưa viết                               |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc; chỉ gồm những mục thuộc task của plan này):

1. **`FieldList` và `maxLength`.** `QuickField.maxLength` (thêm ở M1a) được `FieldList` truyền xuống `<input>` / `<textarea>`, nên sheet sửa bản ghi cũng có giới hạn 80 / 200 / 500 như sheet nhập nhanh. Dòng phụ "Đánh dấu lần đầu bé ăn món này" và placeholder của ô phản ứng chỉ có ở sheet nhập nhanh (`SolidsFields`): `QUICK_FIELDS` không mang hai chữ đó, và §3.3 nói sheet này vẽ ô từ `LOG_FIELDS` "như hiện tại".
2. **Ô "Ghi chú" bị ẩn thì cũng không được lưu.** Với loại `note`, `buildLogPatch` luôn trả `note: null` (hàm mới `hasNoteField`). Nếu không, chữ gõ vào "Ghi chú" trước khi đổi "Loại" sang Ghi chú sẽ đi theo bản ghi mà người dùng không còn thấy nó.
3. **`solidsMeals`** đếm mọi bản ghi `solids` bắt đầu trong ngày, kể cả khi `details` hỏng (đúng chữ "số bản ghi `solids`"). **`waterMl`** chỉ cộng bản ghi `water` đọc được `ml`.
4. **Tab Ăn dặm khi chỉ có nước.** Biểu đồ nhường chỗ cho chữ "Chưa có bữa ăn dặm nào trong … ngày", còn bảng vẫn có số ml nước. Đây là hệ quả của câu "Biểu đồ chỉ vẽ số bữa".
5. **Cổng `main`.** Plan này không có migration, nhưng code của nó ghi và sửa bản ghi loại mới. Nó chỉ được lên `main` khi migration `log_types` đã được áp lên project thật, tức ô Task 1 Step 8 của plan M1a đã tick.
6. **§6.3, đổi theme khi kiểm tay.** Plan đổi `data-theme` của `<html>` bằng javascript tool, không bấm gì trong Cài đặt. Cách này không ghi gì vào DB hay localStorage.

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

- **Patch.** Mọi thay đổi code nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Số này đếm lại từ 1 và không nối tiếp Patch 1–8 của M1a. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell, vì hàm không sống qua lần gọi sau), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm, dấu cách là ngữ cảnh, `@@ -a,b +c,d @@` cho số dòng trước và sau khi sửa.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao của `main` @ `213cc41` đã có đủ 8 patch của M1a: sau mỗi task `tsc --noEmit` sạch và số test đúng như ghi ở task đó. Chưa chạy trong lúc viết plan: `bun run build`, kiểm Chrome. Hai việc đó thuộc người thực thi.
- **Formatter.** Code trong patch đã đúng định dạng prettier. Nếu sửa tay bằng công cụ Edit, hook prettier có thể xuống dòng lại vài dòng không liên quan. Việc đó bình thường, cứ commit kèm.
- **Next.js.** Không task nào thêm route, thêm `import` từ `next/*`, hay đổi một lời gọi API của Next (`next/dynamic` trong `StatsScreen.tsx` giữ nguyên). Nếu thấy cần, dừng lại và đọc trang tương ứng trong `node_modules/next/dist/docs/01-app/` trước (AGENTS.md).
- **Màu.** Không patch nào thêm màu. `SERIES.solids` dùng biến CSS có sẵn `var(--color-cat-bottle)`. `lib/themeGuard.test.ts` chạy trong `bunx vitest run` và phải xanh.
- **Supabase.** Plan này không có migration và không chạy lệnh nào chạm project thật. `bun run dev` chỉ chạy ở Task 3 Step 6.
- **Git.** Mọi commit nằm trên nhánh, ở máy. Plan này không push nhánh, không merge, không push `main`.

## Contracts with Other Plans

Plan này đứng sau M1a (`docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1.md`) và trước M2–M4 (chưa viết). M2–M4 dựa vào cả M1a lẫn plan này.

**Consumes (từ M1a, đúng tên và kiểu trong mục Produces của nó):**

- **Nhánh** `feat/kim-bun-ban-ghi-moi-m1a` với 5 commit của M1a; vitest 827 test, 141 file.
- **DB:** `logs_type_check` nhận 12 giá trị. Việc đã áp lên project thật hay chưa nằm ở ô Task 1 Step 8 của M1a; nó là điều kiện để code của plan này lên `main`.
- **`lib/rules/logDetails.ts`:** `LOG_TYPES` có 12 giá trị (4 giá trị cuối `"solids"`, `"water"`, `"bath"`, `"note"`); `LogType`; `detailsSchemas.water` với `LogDetails["water"] = { ml: number }`; `detailsSchemas.solids`, `.bath`, `.note`.
- **`lib/rules/quickEntry.ts`:**
  - `InstantType` có 8 giá trị; `QuickField.kind` có `"textarea"`; `QuickField.maxLength?: number`.
  - `QUICK_FIELDS.solids` = `food` (`text`, `maxLength: 80`), `amount` (`select`, 3 lựa chọn), `isNew` (`checkbox`), `reaction` (`text`, `maxLength: 200`); `QUICK_FIELDS.water` = `ml` (`number`); `QUICK_FIELDS.bath = []`; `QUICK_FIELDS.note` = `text` (`textarea`, `maxLength: 500`).
  - `defaultQuickValues(type: InstantType): QuickValues`; `buildDetails(type: InstantType, values: QuickValues)`, thông báo của `note` là "Nhập ghi chú".
- **`lib/rules/describeLog.ts`:** `Ăn dặm · <food> · <ít|vừa|nhiều>[ · món mới][ · <reaction>]` và `Ghi chú · <text>` (test của `LogEditSheet` so đúng hai chuỗi này).
- **`lib/ui/`:** `ICON_PATHS.bowl`; `CATEGORIES.solids` (`cat-bottle`, `bowl`) và `CATEGORIES.note` (`cat-tummy`, `doc`).
- Từ `main` @ `213cc41`, không đổi qua M1a: `LOG_FIELDS`, `defaultLogValues`, `valuesFromDetails`, `buildLogDetails`, `buildLogPatch` (`lib/rules/logForm.ts`); `matchesFilter`, `HISTORY_FILTERS` (`lib/rules/history.ts`); `dailyStats`, `chartRows`, `hasStatsData`, `emptyStatsText` (`lib/rules/dailyStats.ts`); `STATS_COLUMNS` (`components/stats/StatsTable.tsx`); `FIELD_INPUT`, `FIELD_LABEL`; `findElements`, `hostElements`.

**Produces** (M2–M4 được dựa vào đúng những tên này):

- **`lib/rules/logForm.ts`:** `MANUAL_TYPES` có 10 mục, 4 mục cuối là `solids` "Ăn dặm", `water` "Uống nước", `bath` "Tắm", `note` "Ghi chú"; `hasNoteField(type: LogType): boolean`; `buildLogPatch` trả `note: null` cho loại `note`.
- **`components/quick/FieldList.tsx`:** vẽ `kind: "textarea"` thành `<textarea rows={3}>`; truyền `maxLength` cho ô chữ.
- **`lib/rules/history.ts`:** `HistoryFilter = "all" | "feed" | "sleep" | "diaper" | "medicine" | "temperature" | "solids" | "other"`; `HISTORY_FILTERS` theo đúng thứ tự đó, hai mục cuối là `{ value: "solids", label: "Ăn dặm" }` và `{ value: "other", label: "Khác" }`.
- **`lib/rules/dailyStats.ts`:** `DayStat` thêm `solidsMeals: number` và `waterMl: number` (sau `tummyMinutes`); `StatsTab` thêm `"solids"`; `STATS_TABS` có 6 mục, cuối là `{ value: "solids", label: "Ăn dặm" }`.
- **`components/stats/`:** `STATS_COLUMNS.solids` (cột "Bữa ăn dặm", "Nước (ml)"); `SERIES.solids` trong `StatsScreen.tsx`.
- **Nhánh:** `feat/kim-bun-ban-ghi-moi-m1b` với 3 commit của plan này.
- **Vitest sau M1b (hết M1):** 840 test, 141 file.

**M1b không đụng tới** (để M2–M4 sửa): `lib/rules/timer.ts`, `lib/rules/ratings.ts` (`isFeed` giữ nguyên, §3.5), `lib/rules/pushSelection.ts`, `lib/rules/notifications.ts`, `lib/rules/alerts.ts`, `lib/rules/quickActions.ts`, `lib/rules/undo.ts`, `components/actions/`, `components/home/`, `components/AuthGate.tsx`, `components/ui/Toast.tsx`, `sw/sw.template.js`, `docs/device-checklist.md` (bước 31–34 thuộc M4).

---

### Task 1: `LogEditSheet` thêm và sửa được bốn loại mới

**Files:**

- Modify: `lib/rules/logForm.ts:11-18` (`MANUAL_TYPES`, hàm mới `hasNoteField`), `:135` (`buildLogPatch`)
- Modify: `components/quick/FieldList.tsx:6-7` (comment), `:73-86` (nhánh `textarea`, `maxLength`)
- Modify: `components/history/LogEditSheet.tsx:13-19` (import), `:227-235` (ô "Ghi chú")
- Test: `lib/rules/logForm.test.ts`, `components/quick/fieldlist.test.tsx`, `components/history/logedit.test.tsx`

**Interfaces:**

- Consumes: `QUICK_FIELDS` của 4 loại mới, `QuickField.kind === "textarea"`, `QuickField.maxLength` (M1a).
- Produces:
  - `MANUAL_TYPES` có 10 mục; 4 mục cuối là `solids` "Ăn dặm", `water` "Uống nước", `bath` "Tắm", `note` "Ghi chú".
  - `hasNoteField(type: LogType): boolean`: `false` chỉ với `"note"`.
  - `buildLogPatch` trả `note: null` cho loại `note`, bất kể `input.note`.
  - `FieldList` vẽ `kind: "textarea"` thành `<textarea rows={3}>`, và truyền `maxLength` cho ô chữ.

`LOG_FIELDS`, `defaultLogValues`, `valuesFromDetails`, `buildLogDetails` không cần sửa. `LOG_FIELDS` trải `...QUICK_FIELDS`, ba hàm kia rơi về `defaultQuickValues` / `buildDetails`, nên đã nhận 4 loại mới từ M1a. Test "the new types take their fields and defaults from quick entry" trong Patch 1 vì thế xanh ngay; nó ở đó để khoá hành vi này lại.

- [x] **Step 1: Tạo nhánh từ nhánh của M1a và kiểm baseline**

Run: `git switch feat/kim-bun-ban-ghi-moi-m1a && git switch -c feat/kim-bun-ban-ghi-moi-m1b && bun run typecheck && bunx vitest run`
Expected: `Switched to a new branch 'feat/kim-bun-ban-ghi-moi-m1b'`; typecheck không lỗi; `Test Files  141 passed (141)`, `Tests  827 passed (827)`. Nếu số test khác 827, M1a chưa xong hoặc đã đổi: dừng và báo lại, không làm tiếp.

- [x] **Step 2: Viết test hỏng (Patch 1)**

```diff
--- a/components/history/logedit.test.tsx
+++ b/components/history/logedit.test.tsx
@@ -81,2 +81,47 @@ describe("LogEditSheet", () => {
   });
+
+  it("new log: the type picker also offers the four new types", () => {
+    const html = render({});
+    expect(html).toContain('<option value="solids">Ăn dặm</option>');
+    expect(html).toContain('<option value="water">Uống nước</option>');
+    expect(html).toContain('<option value="bath">Tắm</option>');
+    expect(html).toContain('<option value="note">Ghi chú</option>');
+    expect(html.match(/<option /g)).toHaveLength(10);
+  });
+
+  it("a note log: Nội dung only, the sheet's own Ghi chú field is hidden", () => {
+    const html = render({
+      log: {
+        ...diaper,
+        id: "n1",
+        type: "note",
+        details: { text: "Bé cười nhiều" },
+        note: null,
+      } as LogRow,
+    });
+    expect(html).toContain("11:00 · Ghi chú · Bé cười nhiều · Mẹ");
+    expect(html).toContain(`d="${ICON_PATHS.doc}"`);
+    expect(html).toContain(">Nội dung</span>");
+    expect(html).toContain(">Bé cười nhiều</textarea>");
+    expect(html.match(/<textarea/g)).toHaveLength(1);
+    expect(html).not.toContain(">Ghi chú</span>");
+    expect(html).toContain(">Thời điểm</span>");
+  });
+
+  it("a solids log: quick-entry fields plus the usual Ghi chú", () => {
+    const html = render({
+      log: {
+        ...diaper,
+        id: "s1",
+        type: "solids",
+        details: { food: "Cháo bí đỏ", amount: "lots", isNew: true },
+      } as LogRow,
+    });
+    expect(html).toContain(
+      "11:00 · Ăn dặm · Cháo bí đỏ · nhiều · món mới · Mẹ",
+    );
+    expect(html).toMatch(/<input[^>]*maxLength="80"[^>]*value="Cháo bí đỏ"/);
+    expect(html).toMatch(/aria-pressed="true"[^>]*>Nhiều<\/button>/);
+    expect(html).toContain(">Ghi chú</span>");
+  });
 });
--- a/components/quick/fieldlist.test.tsx
+++ b/components/quick/fieldlist.test.tsx
@@ -2,3 +2,3 @@ import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
-import { findElements } from "@/components/ui/testTree";
+import { findElements, hostElements } from "@/components/ui/testTree";
 import { LOG_FIELDS } from "@/lib/rules/logForm";
@@ -78,2 +78,32 @@ describe("FieldList", () => {

+  it("a textarea field is three lines tall and capped; text fields carry maxLength", () => {
+    const note = html({
+      fields: LOG_FIELDS.note,
+      values: { text: "Bé cười nhiều" },
+      onChange: () => {},
+    });
+    expect(note).toContain(">Nội dung</span>");
+    expect(note).toMatch(/<textarea[^>]*rows="3"/);
+    expect(note).toMatch(/<textarea[^>]*maxLength="500"/);
+    expect(note).toContain(">Bé cười nhiều</textarea>");
+    expect(note).not.toContain("<input");
+    const solids = html({
+      fields: LOG_FIELDS.solids,
+      values: { food: "Cháo", amount: "some", isNew: false, reaction: "" },
+      onChange: () => {},
+    });
+    expect(solids).toMatch(/<input[^>]*maxLength="80"[^>]*value="Cháo"/);
+    expect(solids).toMatch(/<input[^>]*maxLength="200"/);
+    expect(solids).toMatch(/aria-pressed="true"[^>]*>Vừa<\/button>/);
+    const onChange = vi.fn();
+    const [area] = hostElements(
+      FieldList({ fields: LOG_FIELDS.note, values: { text: "" }, onChange }),
+      "textarea",
+    );
+    (area.props.onChange as (e: unknown) => void)({
+      target: { value: "Mọc răng" },
+    });
+    expect(onChange).toHaveBeenLastCalledWith({ text: "Mọc răng" });
+  });
+
   it("reports changes with the field's key", () => {
--- a/lib/rules/logForm.test.ts
+++ b/lib/rules/logForm.test.ts
@@ -4,3 +4,6 @@ import {
   buildLogPatch,
+  defaultLogValues,
+  hasNoteField,
   LOG_FIELDS,
+  MANUAL_TYPES,
   valuesFromDetails,
@@ -139,2 +142,49 @@ describe("logForm", () => {
   });
+
+  it("MANUAL_TYPES: the six old types, then Ăn dặm, Uống nước, Tắm and Ghi chú", () => {
+    expect(MANUAL_TYPES).toHaveLength(10);
+    expect(MANUAL_TYPES[5].label).toBe("Nhiệt độ");
+    expect(MANUAL_TYPES.slice(6)).toEqual([
+      { value: "solids", label: "Ăn dặm" },
+      { value: "water", label: "Uống nước" },
+      { value: "bath", label: "Tắm" },
+      { value: "note", label: "Ghi chú" },
+    ]);
+  });
+
+  it("the new types take their fields and defaults from quick entry", () => {
+    for (const type of ["solids", "water", "bath", "note"] as const)
+      expect(LOG_FIELDS[type]).toBe(QUICK_FIELDS[type]);
+    expect(defaultLogValues("bath")).toEqual({});
+    const details = { food: "Cháo bí đỏ", amount: "lots", isNew: true };
+    const values = valuesFromDetails("solids", details);
+    expect(values).toEqual({ ...details, reaction: "" });
+    expect(buildLogDetails("solids", values)).toEqual({ ok: true, details });
+    expect(valuesFromDetails("water", { ml: 30 })).toEqual({ ml: "30" });
+    expect(buildLogDetails("bath", {})).toEqual({ ok: true, details: {} });
+  });
+
+  it("a note log has no separate Ghi chú: buildLogPatch never fills logs.note for it", () => {
+    expect(hasNoteField("note")).toBe(false);
+    expect(hasNoteField("solids")).toBe(true);
+    expect(hasNoteField("breast")).toBe(true);
+    expect(
+      buildLogPatch({
+        ...base,
+        type: "note",
+        values: { text: " Bé cười nhiều " },
+        start: "2026-11-14T08:30",
+        end: "",
+        note: "gõ lúc còn chọn loại khác",
+      }),
+    ).toEqual({
+      ok: true,
+      patch: {
+        started_at: "2026-11-14T01:30:00.000Z",
+        ended_at: "2026-11-14T01:30:00.000Z",
+        details: { text: "Bé cười nhiều" },
+        note: null,
+      },
+    });
+  });
 });
```

- [x] **Step 3: Chạy test để thấy hỏng**

Run: `bunx vitest run lib/rules/logForm.test.ts components/quick/fieldlist.test.tsx components/history/logedit.test.tsx`
Expected: FAIL, `Tests  6 failed | 17 passed (23)`. Ví dụ: `to have a length of 10 but got 6`, `hasNoteField is not a function`, `to match /<textarea[^>]*rows="3"/`.

- [x] **Step 4: Viết code (Patch 2)**

```diff
--- a/components/history/LogEditSheet.tsx
+++ b/components/history/LogEditSheet.tsx
@@ -15,2 +15,3 @@ import {
   defaultLogValues,
+  hasNoteField,
   LOG_FIELDS,
@@ -226,11 +227,13 @@ export function LogEditSheet({
               )}
-            <label className="flex flex-col gap-1.5">
-              <span className={FIELD_LABEL}>Ghi chú</span>
-              <textarea
-                className={`${FIELD_INPUT} min-h-20 py-2.5`}
-                value={note}
-                maxLength={500}
-                onChange={(event) => setNote(event.target.value)}
-              />
-            </label>
+            {hasNoteField(type) && (
+              <label className="flex flex-col gap-1.5">
+                <span className={FIELD_LABEL}>Ghi chú</span>
+                <textarea
+                  className={`${FIELD_INPUT} min-h-20 py-2.5`}
+                  value={note}
+                  maxLength={500}
+                  onChange={(event) => setNote(event.target.value)}
+                />
+              </label>
+            )}
             {warnings.map((warning) => (
--- a/components/quick/FieldList.tsx
+++ b/components/quick/FieldList.tsx
@@ -7,2 +7,3 @@ import { FIELD_INPUT, FIELD_LABEL } from "./styles";
 // Switch, a select with 2–6 options a Segmented, a longer select stays native.
+// A textarea is three lines tall; text fields carry the field's maxLength.
 export function FieldList({
@@ -72,2 +73,16 @@ export function FieldList({

+          if (field.kind === "textarea")
+            return (
+              <label key={field.key} className="flex flex-col gap-1.5">
+                <span className={FIELD_LABEL}>{field.label}</span>
+                <textarea
+                  rows={3}
+                  maxLength={field.maxLength}
+                  className={`${FIELD_INPUT} py-2.5`}
+                  value={String(value ?? "")}
+                  onChange={(event) => set(event.target.value)}
+                />
+              </label>
+            );
+
           return (
@@ -82,2 +97,3 @@ export function FieldList({
                 inputMode={field.kind === "number" ? "decimal" : "text"}
+                maxLength={field.maxLength}
                 value={String(value ?? "")}
--- a/lib/rules/logForm.ts
+++ b/lib/rules/logForm.ts
@@ -17,4 +17,14 @@ export const MANUAL_TYPES: { value: LogType; label: string }[] = [
   { value: "temperature", label: "Nhiệt độ" },
+  { value: "solids", label: "Ăn dặm" },
+  { value: "water", label: "Uống nước" },
+  { value: "bath", label: "Tắm" },
+  { value: "note", label: "Ghi chú" },
 ];

+// Spec 2026-11-17 §3.3: a note log's text is its "Nội dung" (details.text), so the
+// sheet's own "Ghi chú" field (the logs.note column) is not offered for it.
+export function hasNoteField(type: LogType): boolean {
+  return type !== "note";
+}
+
 export const LOG_FIELDS: Record<LogType, QuickField[]> = {
@@ -134,3 +144,3 @@ export function buildLogPatch(input: {
   }
-  const note = input.note.trim();
+  const note = hasNoteField(input.type) ? input.note.trim() : "";
   if (note.length > 500)
```

Trong `LogEditSheet`, ô "Ghi chú" chỉ bị ẩn ở chế độ sửa được. Đoạn chỉ đọc (`Ghi chú: {log.note}`) giữ nguyên. Quyền sửa và xoá không đổi.

- [x] **Step 5: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: typecheck không lỗi; `Tests  834 passed (834)` (827 + 7: `logForm` 3, `fieldlist` 1, `logedit` 3).

- [x] **Step 6: Commit**

```bash
git add lib/rules/logForm.ts lib/rules/logForm.test.ts components/quick/FieldList.tsx components/quick/fieldlist.test.tsx components/history/LogEditSheet.tsx components/history/logedit.test.tsx
git commit -m "feat(history): add and edit the four new log types"
```

---

### Task 2: Hai bộ lọc mới của Nhật ký

**Files:**

- Modify: `lib/rules/history.ts:7-8` (`HistoryFilter`), `:10-17` (`HISTORY_FILTERS`), `:19-25` (`FILTER_TYPES`)
- Test: `lib/rules/history.test.ts`

**Interfaces:**

- Consumes: `LOG_TYPES` 12 giá trị (M1a), chỉ dùng trong test.
- Produces: `HistoryFilter` thêm `"solids"` và `"other"`; `HISTORY_FILTERS` thêm `{ value: "solids", label: "Ăn dặm" }` và `{ value: "other", label: "Khác" }` sau "Nhiệt độ"; `matchesFilter(log, "solids")` đúng với `solids` và `water`; `matchesFilter(log, "other")` đúng với `bath`, `note`, `pump`, `tummy`.

`HistoryScreen` không cần sửa: nó vẽ `HISTORY_FILTERS` bằng `ChipGroup`, vốn cuộn ngang. `daySummary` không đổi (§3.4).

- [x] **Step 1: Viết test hỏng (Patch 3)**

```diff
--- a/lib/rules/history.test.ts
+++ b/lib/rules/history.test.ts
@@ -5,2 +5,3 @@ import {
   groupByVnDay,
+  HISTORY_FILTERS,
   historyPageRange,
@@ -9,2 +10,3 @@ import {
 } from "./history";
+import { LOG_TYPES } from "./logDetails";

@@ -20,2 +22,20 @@ describe("history", () => {

+  it("HISTORY_FILTERS: Ăn dặm and Khác come after Nhiệt độ", () => {
+    expect(HISTORY_FILTERS).toHaveLength(8);
+    expect(HISTORY_FILTERS.slice(5)).toEqual([
+      { value: "temperature", label: "Nhiệt độ" },
+      { value: "solids", label: "Ăn dặm" },
+      { value: "other", label: "Khác" },
+    ]);
+  });
+
+  it("matchesFilter: Ăn dặm is solids and water; Khác is bath, note, pump and tummy", () => {
+    const shown = (filter: "solids" | "other") =>
+      LOG_TYPES.filter((type) => matchesFilter({ type }, filter));
+    expect(shown("solids")).toEqual(["solids", "water"]);
+    expect(shown("other")).toEqual(["pump", "tummy", "bath", "note"]);
+    expect(matchesFilter({ type: "water" }, "feed")).toBe(false);
+    expect(matchesFilter({ type: "note" }, "all")).toBe(true);
+  });
+
   it("groupByVnDay splits at VN midnight, newest day and log first", () => {
```

- [x] **Step 2: Chạy test để thấy hỏng**

Run: `bunx vitest run lib/rules/history.test.ts`
Expected: FAIL, `Tests  2 failed | 8 passed (10)`.

- [x] **Step 3: Thêm hai bộ lọc (Patch 4)**

```diff
--- a/lib/rules/history.ts
+++ b/lib/rules/history.ts
@@ -7,3 +7,10 @@ import { shortDuration } from "./summaryText";
 export type HistoryFilter =
-  "all" | "feed" | "sleep" | "diaper" | "medicine" | "temperature";
+  | "all"
+  | "feed"
+  | "sleep"
+  | "diaper"
+  | "medicine"
+  | "temperature"
+  | "solids"
+  | "other";

@@ -16,2 +23,4 @@ export const HISTORY_FILTERS: { value: HistoryFilter; label: string }[] = [
   { value: "temperature", label: "Nhiệt độ" },
+  { value: "solids", label: "Ăn dặm" },
+  { value: "other", label: "Khác" },
 ];
@@ -24,2 +33,5 @@ const FILTER_TYPES: Record<Exclude<HistoryFilter, "all">, readonly string[]> = {
   temperature: ["temperature"],
+  // Spec 2026-11-17 §3.4: water sits with solids; "Khác" is every type without its own chip.
+  solids: ["solids", "water"],
+  other: ["bath", "note", "pump", "tummy"],
 };
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: typecheck không lỗi; `Tests  836 passed (836)` (834 + 2).

- [x] **Step 5: Commit**

```bash
git add lib/rules/history.ts lib/rules/history.test.ts
git commit -m "feat(history): Ăn dặm and Khác filters"
```

---

### Task 3: Thống kê tab "Ăn dặm", rồi kiểm cuối M1

**Files:**

- Modify: `lib/rules/dailyStats.ts:7-26` (`DayStat`, `StatsTab`, `STATS_TABS`), `:53-91` (`dailyStats`), `:102-120` (`chartRows`), `:128-134` (`EMPTY_NOUN`)
- Modify: `components/stats/StatsTable.tsx:26-33` (`STATS_COLUMNS.solids`)
- Modify: `components/stats/StatsScreen.tsx:75-81` (`SERIES.solids`)
- Test: `lib/rules/dailyStats.test.ts`, `components/stats/statstable.test.tsx`

**Interfaces:**

- Consumes: `detailsSchemas.water` (M1a).
- Produces:
  - `DayStat` thêm `solidsMeals: number` và `waterMl: number`.
  - `StatsTab` thêm `"solids"`; `STATS_TABS` thêm `{ value: "solids", label: "Ăn dặm" }` ở cuối.
  - `chartRows(stats, "solids")` trả `primary = solidsMeals`, `secondary = null`.
  - `emptyStatsText("solids", n)` trả `Chưa có bữa ăn dặm nào trong <n> ngày`.
  - `STATS_COLUMNS.solids`: cột "Bữa ăn dặm" và cột "Nước (ml)".
  - `SERIES.solids = { primary: "Bữa ăn dặm", secondary: null, color: "var(--color-cat-bottle)", secondaryColor: null }`.

`SERIES` là hằng nội bộ của `StatsScreen.tsx` và không có test riêng. Kiểu `Record<StatsTab, …>` của nó là thứ canh: thiếu `solids` thì `bun run typecheck` báo lỗi ở file đó. `var(--color-cat-bottle)` là biến CSS có sẵn, không phải màu mới.

- [x] **Step 1: Viết test hỏng (Patch 5)**

```diff
--- a/components/stats/statstable.test.tsx
+++ b/components/stats/statstable.test.tsx
@@ -15,2 +15,4 @@ const stat = (day: string, over: Partial<DayStat> = {}): DayStat => ({
   tummyMinutes: 0,
+  solidsMeals: 0,
+  waterMl: 0,
   ...over,
@@ -46,2 +48,23 @@ describe("StatsTable", () => {
   });
+
+  it("the Ăn dặm tab has a meals column and a water column", () => {
+    const html = renderToStaticMarkup(
+      <StatsTable
+        stats={[
+          stat("2026-11-13", { solidsMeals: 2, waterMl: 30 }),
+          stat("2026-11-14", { waterMl: 60 }),
+        ]}
+        tab="solids"
+        now={NOW}
+      />,
+    );
+    expect(html.indexOf(">Bữa ăn dặm</th>")).toBeLessThan(
+      html.indexOf(">Nước (ml)</th>"),
+    );
+    expect(html.match(/<th /g)).toHaveLength(3);
+    const cells = [...html.matchAll(/tabular-nums">([^<]*)<\/td>/g)].map(
+      (m) => m[1],
+    );
+    expect(cells).toEqual(["0", "60", "2", "30"]);
+  });
 });
--- a/lib/rules/dailyStats.test.ts
+++ b/lib/rules/dailyStats.test.ts
@@ -8,2 +8,3 @@ import {
   sleepHours,
+  STATS_TABS,
   statsFetchSince,
@@ -91,2 +92,4 @@ describe("dailyStats", () => {
         tummyMinutes: 0,
+        solidsMeals: 0,
+        waterMl: 0,
       },
@@ -101,2 +104,4 @@ describe("dailyStats", () => {
         tummyMinutes: 0,
+        solidsMeals: 0,
+        waterMl: 0,
       },
@@ -123,2 +128,4 @@ describe("dailyStats", () => {
       tummyMinutes: 25,
+      solidsMeals: 3,
+      waterMl: 90,
     };
@@ -133,2 +140,35 @@ describe("dailyStats", () => {
     expect(chartRows([stat], "tummy")[0].primary).toBe(25);
+    expect(chartRows([stat], "solids")).toEqual([
+      { label: "9", primary: 3, secondary: null },
+    ]);
+  });
+
+  it("counts solids meals and adds water ml on the VN day they start (spec 2026-11-17 §3.4)", () => {
+    const at = (type: string, iso: string, details: unknown = {}) =>
+      log(type, iso, iso, details);
+    const meal = { food: "Cháo bí đỏ", amount: "some", isNew: false };
+    const stats = dailyStats(
+      [
+        at("solids", "2026-11-13T04:00:00Z", meal),
+        at("solids", "2026-11-13T16:59:00Z", meal), // 23:59 on 13/11
+        at("solids", "2026-11-13T17:00:00Z", meal), // 00:00 on 14/11
+        at("water", "2026-11-13T05:00:00Z", { ml: 30 }),
+        at("water", "2026-11-14T01:00:00Z", { ml: 40 }),
+        at("water", "2026-11-14T02:00:00Z", { ml: 20 }),
+        at("water", "2026-11-14T02:30:00Z", { ml: 0 }), // broken: not added
+        at("bath", "2026-11-14T02:40:00Z"),
+      ],
+      days,
+      now,
+    );
+    expect(stats.map((s) => s.solidsMeals)).toEqual([2, 1]);
+    expect(stats.map((s) => s.waterMl)).toEqual([30, 60]);
+    // Neither is a feed: the feed count and the bottle ml stay untouched (spec §3.5).
+    expect(stats.map((s) => s.feeds)).toEqual([0, 0]);
+    expect(stats.map((s) => s.bottleMl)).toEqual([0, 0]);
+  });
+
+  it("STATS_TABS ends with Ăn dặm", () => {
+    expect(STATS_TABS).toHaveLength(6);
+    expect(STATS_TABS.at(-1)).toEqual({ value: "solids", label: "Ăn dặm" });
   });
@@ -167,2 +207,4 @@ describe("empty stats", () => {
     tummyMinutes: 0,
+    solidsMeals: 0,
+    waterMl: 0,
     ...over,
@@ -179,2 +221,11 @@ describe("empty stats", () => {

+  it("the Ăn dặm chart only counts meals: water alone leaves it empty", () => {
+    expect(hasStatsData([stat("2026-11-14", { waterMl: 60 })], "solids")).toBe(
+      false,
+    );
+    expect(
+      hasStatsData([stat("2026-11-14", { solidsMeals: 1 })], "solids"),
+    ).toBe(true);
+  });
+
   it("emptyStatsText names what is missing and the range", () => {
@@ -189,2 +240,5 @@ describe("empty stats", () => {
     );
+    expect(emptyStatsText("solids", 14)).toBe(
+      "Chưa có bữa ăn dặm nào trong 14 ngày",
+    );
   });
```

- [x] **Step 2: Chạy test để thấy hỏng**

Run: `bunx vitest run lib/rules/dailyStats.test.ts components/stats/statstable.test.tsx`
Expected: FAIL, `Tests  7 failed | 8 passed (15)`. Hai test cũ ("counts wet and dirty diapers…", "sleepHours rounds…") cũng đỏ, vì kỳ vọng của chúng giờ có `solidsMeals` và `waterMl`.

- [x] **Step 3: Viết code (Patch 6)**

```diff
--- a/components/stats/StatsScreen.tsx
+++ b/components/stats/StatsScreen.tsx
@@ -80,2 +80,8 @@ const SERIES: Record<
   },
+  solids: {
+    primary: "Bữa ăn dặm",
+    secondary: null,
+    color: "var(--color-cat-bottle)",
+    secondaryColor: null,
+  },
 };
--- a/components/stats/StatsTable.tsx
+++ b/components/stats/StatsTable.tsx
@@ -32,2 +32,6 @@ export const STATS_COLUMNS: Record<
   ],
+  solids: [
+    { label: "Bữa ăn dặm", value: (s) => String(s.solidsMeals) },
+    { label: "Nước (ml)", value: (s) => String(s.waterMl) },
+  ],
 };
--- a/lib/rules/dailyStats.ts
+++ b/lib/rules/dailyStats.ts
@@ -15,5 +15,8 @@ export type DayStat = {
   tummyMinutes: number;
+  solidsMeals: number;
+  waterMl: number;
 };

-export type StatsTab = "sleep" | "feed" | "diaper" | "pump" | "tummy";
+export type StatsTab =
+  "sleep" | "feed" | "diaper" | "pump" | "tummy" | "solids";

@@ -25,2 +28,3 @@ export const STATS_TABS: { value: StatsTab; label: string }[] = [
   { value: "tummy", label: "Tummy" },
+  { value: "solids", label: "Ăn dặm" },
 ];
@@ -65,2 +69,4 @@ export function dailyStats(
       tummyMinutes: minutesBetween("tummy", logs, from, to, now),
+      solidsMeals: 0,
+      waterMl: 0,
     };
@@ -89,2 +95,8 @@ export function dailyStats(
     }
+    // Spec 2026-11-17 §3.4: every solids log that started that day is one meal.
+    if (log.type === "solids") stat.solidsMeals += 1;
+    if (log.type === "water") {
+      const p = detailsSchemas.water.safeParse(log.details);
+      if (p.success) stat.waterMl += p.data.ml;
+    }
   }
@@ -116,3 +128,5 @@ export function chartRows(
               ? stat.tummyMinutes
-              : stat.wetDiapers,
+              : tab === "solids"
+                ? stat.solidsMeals
+                : stat.wetDiapers,
     secondary: tab === "diaper" ? stat.dirtyDiapers : null,
@@ -133,2 +147,3 @@ const EMPTY_NOUN: Record<StatsTab, string> = {
   tummy: "lần nằm sấp",
+  solids: "bữa ăn dặm",
 };
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck`
Expected: không lỗi.

Run: `bunx vitest run`
Expected: `Test Files  141 passed (141)`, `Tests  840 passed (840)`. Cách đếm: 827 (sau M1a) + 7 (Task 1) + 2 (Task 2) + 4 (Task 3). Nếu số lệch, đếm lại các `it(` đã thêm; không sửa test cho khớp số.

- [x] **Step 5: Build**

Run: `bun run build`
Expected: build xong, không lỗi. Hiện tại lần chạy đầu có thể dừng với một thông báo security advisory của Next.js 16.4.3; chạy lại lệnh lần thứ hai thì qua. Thông báo đó đã biết trước và không phải việc của plan này: không nâng Next, không sửa gì vì nó.

Nếu Docker chạy được, chạy thêm `bun run db:test`. Expected: `001`…`012` `ok`, `All tests successful.` Nếu không, ghi "pgTAP chưa chạy lại ở M1b: Docker không chạy" vào báo cáo cuối. Plan này không đổi gì ở DB, nên đây chỉ là kiểm lại.

- [ ] **Step 6: Kiểm trong Chrome (Claude in Chrome, mở tab mới)** (không bấm Lưu, không bắt đầu timer)

App dev nối vào Supabase thật của gia đình. Trong cả bước này:

- Không bấm "Lưu" và không bấm "Xóa bản ghi" ở bất kỳ sheet nào.
- Không bấm ô nào trong bảng của nút "+", không bấm nút nào của hàng "Bấm giờ" ở trang chủ.
- Không vào Cài đặt.

Chạy `bun run dev`. Dùng Claude in Chrome: `tabs_context_mcp`, rồi `tabs_create_mcp` để mở tab mới (không dùng lại tab của người dùng) tới `http://localhost:3000/nhat-ky`, cửa sổ 375×812.

1. Hàng chip lọc có "Ăn dặm" và "Khác" sau "Nhiệt độ" (cuộn ngang để thấy). Bấm từng chip: danh sách lọc theo, hoặc hiện "Không có bản ghi nào cho mục này."
2. Bấm nút lịch "Thêm bản ghi cũ". Ô "Loại" có thêm Ăn dặm, Uống nước, Tắm, Ghi chú ở cuối. Chọn "Ghi chú": chỉ còn "Nội dung" (ô cao 3 dòng) và "Thời điểm", không có ô "Ghi chú". Chọn "Ăn dặm": có Món, Lượng, Món mới, Phản ứng, và có lại ô "Ghi chú". Chọn "Tắm": chỉ có "Thời điểm" và "Ghi chú". Đóng bằng X, "Bỏ thay đổi".
3. Nếu Nhật ký đã có một bản ghi Ghi chú hoặc Ăn dặm (do người dùng ghi sau M1a), bấm vào nó: sheet hiện đúng các ô như mục 2 với giá trị của bản ghi. Đóng bằng X, không lưu. Nếu chưa có bản ghi nào như vậy thì bỏ qua mục này và ghi rõ trong báo cáo; không tự tạo bản ghi.
4. Mở Thống kê (`/thong-ke`), bấm chip "Ăn dặm". Kỳ vọng: chữ "Chưa có bữa ăn dặm nào trong 7 ngày" (hoặc biểu đồ cột nếu đã có dữ liệu), và bảng có hai cột "Bữa ăn dặm", "Nước (ml)". Đổi sang "14 ngày": chữ và bảng đổi theo.
5. Ở mỗi màn hình và sheet trên, chạy bằng javascript tool: `document.documentElement.scrollWidth <= window.innerWidth`. Kỳ vọng `true` (không tràn ngang ở 375 px). Câu này không thấy được phần nằm trong `<dialog>`, nên khi một sheet đang mở thì chạy thêm: `(() => { const el = document.querySelector("dialog[open] .overflow-y-auto"); return el ? el.scrollWidth <= el.clientWidth : "không tìm thấy thân sheet"; })()`. Kỳ vọng `true`; nếu ra chuỗi "không tìm thấy thân sheet" thì ghi vào báo cáo là chưa kiểm được tràn ngang trong sheet, không ghi đạt.
6. Lặp lại mục 1–5 ở hai theme nữa. Đổi theme bằng javascript tool: `document.documentElement.dataset.theme = "dark"` (Tối), rồi `"night"` (Ban đêm); `"rose"` là Hồng dịu. Lệnh này chỉ đổi giao diện của tab đang mở và mất khi tải lại trang; nếu app tự đặt lại theme thì chạy lại lệnh. Kỳ vọng: chữ đọc rõ ở cả ba theme.

Bảng "+" và bốn sheet nhập nhanh đã được kiểm ở M1a.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục vào báo cáo cuối. Nếu Claude in Chrome không nối được, để ô này chưa tick và ghi rõ trong báo cáo; không thay bằng trình duyệt khác khi người dùng chưa cho phép. Nếu tab bị chuyển sang `/dang-nhap`, cũng để ô này chưa tick và ghi rõ trong báo cáo; không tự đăng nhập.

- [x] **Step 7: Commit**

```bash
git add lib/rules/dailyStats.ts lib/rules/dailyStats.test.ts components/stats/StatsTable.tsx components/stats/StatsScreen.tsx components/stats/statstable.test.tsx docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1b.md
git commit -m "feat(stats): Ăn dặm tab with meals and water"
```

- [ ] **Step 8: Báo cáo, và cổng trước khi lên `main`**

Báo cáo cuối gồm: 3 commit của nhánh; số test (840); kết quả build; kết quả kiểm Chrome từng mục; và mọi ô còn chưa tick kèm lý do.

Plan này dừng ở đây, và mốc M1 của spec xong. Không merge, không push. Đưa code lên `main` là việc người dùng quyết từng lần, và chỉ được làm khi **ô Task 1 Step 8 của plan M1a đã tick** (migration `log_types` đã có trên project thật). Mở `docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1.md` để xem ô đó. Nếu nó chưa tick, nói rõ trong báo cáo: "Chưa được push `main`: migration `log_types` chưa áp lên project thật."
