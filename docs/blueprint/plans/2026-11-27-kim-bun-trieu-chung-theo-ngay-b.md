# Kim Bun — Triệu chứng theo ngày, plan B: phiếu triệu chứng có dải ngày Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-27-kim-bun-trieu-chung-theo-ngay-design.md` (§4 toàn bộ; §5.1 phần dòng phụ, §5.2, §5.3; phần tương ứng của §7)

**Status:** approved 2026-11-27

**Goal:** Bấm "Triệu chứng" ở phiếu "+" hay ở thẻ đợt ốm mở phiếu mới `SymptomDaySheet`: chọn ngày bằng dải ngày, chip của ngày hiện sẵn, chip người khác ghi bị khóa, một ghi chú mỗi ngày; Lưu gộp về một bản ghi mỗi ngày. Phiếu cũ với "Lúc nào?" không còn mở cho triệu chứng.

**Architecture:**

- **`components/quick/SymptomPicker.tsx`:** prop mới `locked` (chip bật sẵn, mờ, bấm không đổi).
- **`components/quick/SymptomDaySheet.tsx` (mới), ba phần:** `DayStrip` (dải ngày, không hook; nhận `scrollRef` cho hàng cuộn), `SymptomDaySheetView` (toàn bộ phiếu, không hook, nhận mọi thứ qua props), `SymptomDaySheet` (đọc `useEpisodes`, `useRangeLogs`; giữ trạng thái; sau khi `<dialog>` đã mở thì cuộn dải tới cuối; chạy các `SymptomOp` của plan A bằng `useSaveLog.mutateAsync` / `useDeleteLog.mutateAsync` theo thứ tự).
- **`components/actions/QuickActions.tsx`:** `InstantSheet` (mới, export) chọn `SymptomDaySheet` cho `symptom`, `QuickEntrySheet` cho loại khác. `QuickEntrySheet` bỏ phần ô của triệu chứng; `SymptomFields` bị xóa.
- Không đổi dữ liệu, không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-trieu-chung-theo-ngay-b`, cắt từ `main` nếu plan A đã lên `main`, không thì từ `feat/kim-bun-trieu-chung-theo-ngay-a`. Baseline: 2091 test vitest xanh (216 file), typecheck sạch.

**Các plan của spec này:**

| Plan | Nội dung | File |
| --- | --- | --- |
| A | Luật thuần (§3), báo cáo theo ngày (§6.3), Nhật ký "Cả ngày" và thứ tự (§6.2), bỏ "Triệu chứng" khỏi "Ghi bù" (§4.1). Chưa có phiếu mới. | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-a.md` |
| B | Chip khóa (§5.3), phiếu `SymptomDaySheet` với dải ngày (§4, §5), "+" và thẻ đợt ốm mở phiếu mới (§4.1). | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-b.md` |
| C | Nút "Sửa"/"Ghi triệu chứng" ở "Từng ngày" (§6.1), Nhật ký mở phiếu của ngày (§6.2), kiểm trình duyệt cho cả B và C, Bước 39 của checklist (§7). | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-c.md` |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **"Đang tải: chip tắt"** đọc là: khi đang tải hay lỗi tải, phiếu không vẽ chip và ô ghi chú; dòng gợi ý (§4.2 mục 3) là "Đang tải…" hoặc "Không tải được triệu chứng đã ghi" (`role="alert"`), "Lưu" mờ.
2. **Toast viết "Đã lưu triệu chứng hôm nay"** (chữ thường giữa câu); ngày khác là "Đã lưu triệu chứng {dd/MM}". Spec ghi `{Hôm nay | dd/MM}`.
3. **"Ô ghi chú tắt khi `ownCodes` rỗng"** dùng `disabled` của `<textarea>` cộng `disabled:opacity-50`, dòng "Bật ít nhất một triệu chứng để ghi chú." ngay dưới ô. Ô giữ `maxLength={200}`; ghi chú gộp sẵn dài hơn 200 vẫn hiện đủ và "Lưu" báo "Ghi chú dài quá 200 ký tự".
4. **Ô "Khác"** là một `<label>` chứa `<input type="date">` trong suốt phủ cả ô (bấm vào mở bánh xe ngày của iOS), `min` = ngày sinh, `max` = hôm nay. Ngày chọn được mà nằm trong dải thì chọn ô đó.
5. **Chấm của ô** có khi ngày có ít nhất một bản ghi triệu chứng hợp lệ, của bất kỳ ai; kèm chữ ẩn ", đã ghi" cho trình đọc màn hình.
6. **Đợt ốm chưa tải xong** thì dải là 7 ngày; tải xong (và có đợt đang mở) thì dải đổi sang các ngày của đợt. Thường danh sách đợt đã có trong bộ nhớ đệm nên không thấy đổi.
7. **"Hôm nay" của phiếu là ngày lúc mở phiếu**, không đổi khi phiếu còn mở qua nửa đêm.
8. **Lưu không có thay đổi** (luật trả danh sách rỗng) chỉ đóng phiếu, không toast. **Mọi lần sửa** (kể cả sửa rồi trả về như cũ) làm phiếu hỏi trước khi đóng (`dirty` của `Sheet`).
9. **Nút xóa chỉ hiện khi đã tải xong** và `canDeleteDay`, và mờ (`disabled`) khi đang lưu hay đang xóa; ở plan B nút chưa có chỗ nào mở được (phiếu ngày cố định mở từ hàng ngày và Nhật ký ở plan C) nhưng đã có test.
10. **`QuickEntrySheet` giữ prop `ageDays`** (nay không dùng) để không phải sửa các chỗ gọi; phần ô của `symptom` là `null`. `SymptomFields` (chỉ phiếu cũ dùng) bị xóa cùng hai test của nó; test cũ "symptom opens on its chips" được thay bằng một test nói phiếu này không còn chip.
11. **Plan B không có bước trình duyệt riêng.** Phiếu mới được xem ở plan C cùng với hàng ngày và Nhật ký (một trang fixture). Vì thế plan B không lên `main` một mình: B và C lên cùng nhau ở cuối plan C.
12. **Cuộn dải tới cuối.** `<dialog>` của `Sheet` là `display:none` tới khi effect của `Sheet` gọi `showModal()`; lúc đó hàng dải chưa có bề ngang, nên một callback ref (chạy lúc commit, trước effect) không cuộn được. `SymptomDaySheet` là cha của `Sheet` nên effect của nó chạy sau `showModal()`: một effect theo số ô của dải đặt `scrollLeft = scrollWidth` (mở phiếu, và khi danh sách đợt ốm tải xong làm dải dài ra) rồi gọi `keepPickedInView`; một effect theo ngày đang chọn gọi `keepPickedInView`. `keepPickedInView` chỉ đổi `scrollLeft` của hàng, tính bằng hàm thuần `nearestScrollLeft` (có test): ô bị che bên trái thì mép trái ô về mép trái hàng, bị che bên phải thì mép phải ô về mép phải hàng, đã thấy thì để yên. Không dùng `scrollIntoView`: nó cuộn cả `<dialog>` (overflow:auto) khi tấm phiếu còn đang trượt lên (`kb-sheet-in`), và phiếu nhảy, đúng lỗi mà `markAutofocus` trong `Sheet.tsx` đã ghi. Vị trí ô tính từ hai hộp `getBoundingClientRect` cộng `scrollLeft`, không từ `offsetLeft` (hàng không phải `offsetParent` của ô). Thứ tự ô trong DOM giữ nguyên: cũ → hôm nay → "Khác". Test render chạy bằng `renderToStaticMarkup` nên không chạy effect: test chỉ kiểm `scrollRef` được gắn đúng hàng, thứ tự ô và `nearestScrollLeft`; việc cuộn được kiểm ở plan C (trang thật, `atEnd`, phiếu không nhảy).
13. **Một đồng hồ cho một lần Lưu:** `saveNow = new Date()` lúc bấm, `today = vnDateString(saveNow)`, và chữ của toast cũng lấy từ đó. Phiếu mở lúc 23:59 và lưu sau nửa đêm thì ngày đã chọn (nay là hôm qua) được lưu lúc 12:00 và toast ghi "Đã lưu triệu chứng {dd/MM}", không "hôm nay".
14. **Chấm của ô lấy từ bản ghi của dải** (`stripLogs`), kể cả khi "Khác" đang hiện một ngày ngoài dải.

## Global Constraints

Chép nguyên văn mục 2 của spec:

- Không migration, không đổi bảng `logs`, không đổi RLS. Bản ghi triệu chứng vẫn là `type = 'symptom'`, `details = { codes: string[], note?: string }` theo `lib/rules/logDetails.ts` (codes 1–30, không trùng; note 1–200 ký tự sau khi trim).
- "Ngày" luôn là ngày lịch giờ Việt Nam: `vnDateString` trong `lib/rules/time.ts`, dạng `YYYY-MM-DD`.
- Giờ lưu của bản ghi mới: ngày hôm nay → thời điểm bấm Lưu; ngày trước hôm nay → 12:00 giờ VN của ngày đó.
- Ghi dữ liệu chỉ qua `useSaveLog` và `useDeleteLog` (`lib/data/logs.ts`), để mất mạng vẫn chạy qua outbox. Không gọi Supabase trực tiếp.
- Quyền sửa một bản ghi: `canModifyLog(member, log.created_by)` trong `lib/rules/history.ts` (chủ gia đình: mọi bản ghi; thành viên: bản ghi của mình).
- Không icon mới: chỉ dùng tên có trong `lib/ui/icons.ts` (`calendar`, `pencil`, `plus`, `close`, `chevronLeft`, `chevronRight`…). Không token màu mới.
- Vùng bấm tối thiểu 44 px (`min-h-11`), như mọi nút của app.
- Chữ trên màn hình viết đúng như spec này ghi trong ngoặc kép.
- Rules thuần nằm trong `lib/rules/`, có test vitest; component có test render như các file `*.test.tsx` hiện có.
- Hết spec: `bun run typecheck` (hoặc `tsc --noEmit`) sạch, toàn bộ vitest xanh, `bun run build` thoát 0.

Giữ từ các spec trước (không đổi ở spec này):

- Chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; không thêm dependency, không web font.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`. Theme `night` chỉ có một tông màu: không trạng thái nào được phân biệt chỉ bằng màu.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…".
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không xóa, không bắt đầu hay đóng đợt ốm. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Push lên `main` cần người dùng đồng ý từng lần (lời duyệt trước của các spec cũ đã dùng hết ngày 2026-11-27).

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `5b90853` cộng 10 patch của plan A trích từ file plan đó; bản sao có `node_modules` riêng (`bun install --frozen-lockfile`). Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). Số test đỏ và xanh của từng task là số đo thật trên cả bộ test; `tsc --noEmit` sạch sau mỗi commit code (ở bước đỏ `tsc` báo lỗi vì test dùng prop hay export chưa có: đó là đỏ đúng). `bun run build` thoát 0 ở trạng thái cuối của plan C (42/42; chưa build riêng ở cuối plan B). Sau khi viết (và sau lượt sửa theo reviewer), các patch được trích lại từ chính file này bằng `kb_patch` và áp lên một bản sao sạch khác: kết quả như trên.
- **Không sửa patch bằng công cụ có prettier.** Một hook PostToolUse chạy prettier lên mọi file `.md` vừa được Edit/Write, và nó đổi các dòng trống trong khối `diff` (patch hỏng). Ghi kết quả vào file plan này bằng một script (ví dụ `python3` mở file, thay chuỗi, ghi lại), không bằng Edit/Write.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan.
- **Màu.** Không patch nào thêm token màu hay icon. `lib/themeGuard.test.ts` phải xanh.
- **`bun run build` và `bun run dev`** có thể dừng một hay vài lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 (`SecurityFatalError`, có khi in ra sau khi đã dựng xong 42 trang); chạy lại đúng lệnh tới khi thoát 0 (khi viết plan: nhiều nhất hai lần dừng). Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Spec và các file plan chưa được commit.** `git status` thấy spec `docs/blueprint/specs/2026-11-27-kim-bun-trieu-chung-theo-ngay-design.md` và ba file plan `…-trieu-chung-theo-ngay-{a,b,c}.md` là untracked. Không commit chúng trừ khi người dùng đồng ý (task cuối hỏi).
- **Lên `main` phải hỏi.** Bước cuối dừng lại hỏi người dùng trước khi push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

**Consumes (từ plan A):** `symptomDay`, `SymptomDay`, `SymptomLog`, `symptomDaySave`, `symptomDayDelete`, `canDeleteDay`, `SymptomOp`, `dayStrip`, `StripDay` (`lib/rules/symptomDay.ts`); `startOfDayIso` (`lib/rules/days.ts`); `canModifyLog` (`lib/rules/history.ts`). **Từ `main`:** `useEpisodes` (`lib/data/illness.ts`); `useRangeLogs`, `useSaveLog`, `useDeleteLog` (`lib/data/logs.ts`); `Sheet`, `Button`, `Icon`, `useToast`; `SymptomPicker`; `QuickEntrySheet`; `CATEGORIES`.

**Produces (plan C dùng):**

- `SymptomPicker` / `SymptomPickerView`: prop `locked?: readonly string[]`.
- `components/quick/SymptomDaySheet.tsx`:
  - `DayStrip(props: { label: string; days: StripDay[]; selected: string; marked: readonly string[]; other: string | null; min: string; max: string; onPick: (day: string) => void; scrollRef?: Ref<HTMLDivElement> })`
  - `type SheetStatus = "loading" | "error" | "ready"`
  - `SymptomDaySheetView(props: { title: string; sub: string | null; strip: DayStrip props | null; status: SheetStatus; day: SymptomDay; picked: string; note: string; ageDays: number | null; dirty: boolean; saving: boolean; message: string | null; deletable: boolean; onPicked; onNote; onSave; onDelete; onClose })`
  - `SymptomDaySheet(props: { baby: Baby; userId: string; canModify: (createdBy: string) => boolean; day?: string | null; sub?: string | null; onClose: () => void })`: không `day` → dải ngày mở ở hôm nay; có `day` → ngày cố định, tiêu đề "Triệu chứng · dd/MM", dòng phụ `sub`, nút xóa khi được.
- `lib/ui/scrollRow.ts`: `nearestScrollLeft({ cellLeft, cellWidth, scrollLeft, clientWidth }): number` (thuần); `keepPickedInView(row: HTMLElement | null): void` (chỉ đổi `scrollLeft` của hàng).
- `components/actions/QuickActions.tsx`: `InstantSheet(props: { sheet: { type: InstantType; initial?: QuickValues }; baby; member; userId; rows: LogRow[]; onSaved; onClose })`.
- **Vitest sau plan B:** 2109 test, 219 file.

---

### Task 1: Chip bị khóa (§5.3)

**Files:**

- Modify: `components/quick/SymptomPicker.tsx`
- Test: `components/quick/symptoms.test.tsx`

**Interfaces:**

- Consumes: `toggleCode`, `pickerLayout`.
- Produces: `SymptomPickerView` và `SymptomPicker` nhận `locked?: readonly string[]`; chip khóa có `aria-disabled="true"`, lớp `opacity-50`, bấm không gọi `onChange`.

- [x] **Step 0: Kiểm plan A đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
grep -q 'export function dayStrip' lib/rules/symptomDay.ts && echo 'A trên main' || echo 'A chưa trên main'
# A trên main:
git checkout -b feat/kim-bun-trieu-chung-theo-ngay-b
# A chưa trên main:
# git checkout feat/kim-bun-trieu-chung-theo-ngay-a && git checkout -b feat/kim-bun-trieu-chung-theo-ngay-b
bunx vitest run   # Test Files  216 passed (216), Tests  2091 passed (2091)
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/quick/symptoms.test.tsx b/components/quick/symptoms.test.tsx
index 1740316..9c67820 100644
--- a/components/quick/symptoms.test.tsx
+++ b/components/quick/symptoms.test.tsx
@@ -116,6 +116,25 @@ describe("SymptomPickerView", () => {
     for (const button of buttons) expect(button.props.type).toBe("button");
   });
 
+  it("spec 2026-11-27 §5.3: a locked chip stays on, is marked disabled and does nothing", () => {
+    const onChange = vi.fn();
+    const html = view({ value: "fever,cough", locked: ["fever"] });
+    expect(html).toMatch(
+      /aria-pressed="true" aria-disabled="true" class="[^"]*opacity-50[^"]*">✓ Sốt<\/button>/,
+    );
+    expect(html).toMatch(/aria-pressed="true" class="[^"]*">✓ Ho<\/button>/);
+    const buttons = hostElements(
+      SymptomPickerView(
+        props({ value: "fever,cough", locked: ["fever"], onChange }),
+      ),
+      "button",
+    );
+    (buttons[0].props.onClick as () => void)();
+    expect(onChange).not.toHaveBeenCalled();
+    (buttons[2].props.onClick as () => void)();
+    expect(onChange).toHaveBeenCalledWith("fever");
+  });
+
   it("a code the content lost survives a toggle", () => {
     const onChange = vi.fn();
     const buttons = hostElements(
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 215 passed (216)`, `Tests  1 failed | 2091 passed (2092)`. `tsc` báo `'locked' does not exist` ở test mới.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/quick/SymptomPicker.tsx b/components/quick/SymptomPicker.tsx
index 9d61fa4..798d774 100644
--- a/components/quick/SymptomPicker.tsx
+++ b/components/quick/SymptomPicker.tsx
@@ -10,13 +10,16 @@ const ROW = "flex flex-wrap gap-2";
 
 // Spec 2026-11-26 §3.5: the common chips first; one button opens the rest by
 // group. `value` is the picked codes joined with ",". A picked chip is filled
-// and ticked, so it reads without colour (theme night).
+// and ticked, so it reads without colour (theme night). Spec 2026-11-27 §5.3:
+// a `locked` code was logged by someone the viewer may not overrule; its chip
+// stays on, faded, and a tap does nothing.
 export function SymptomPickerView({
   value,
   onChange,
   ageDays,
   expanded,
   onExpanded,
+  locked = [],
 }: {
   value: string;
   onChange: (next: string) => void;
@@ -24,6 +27,7 @@ export function SymptomPickerView({
   ageDays: number | null;
   expanded: boolean;
   onExpanded: (next: boolean) => void;
+  locked?: readonly string[];
 }) {
   const selected = parseCodes(value);
   const layout = pickerLayout({
@@ -34,17 +38,21 @@ export function SymptomPickerView({
   });
   const chip = (symptom: TriageSymptom) => {
     const on = selected.includes(symptom.code);
+    const fixed = locked.includes(symptom.code);
     return (
       <button
         key={symptom.code}
         type="button"
         aria-pressed={on}
-        onClick={() =>
-          onChange(toggleCode(value, symptom.code, TRIAGE.symptoms))
-        }
+        aria-disabled={fixed || undefined}
+        onClick={() => {
+          if (!fixed)
+            onChange(toggleCode(value, symptom.code, TRIAGE.symptoms));
+        }}
         className={cx(
           "min-h-11 rounded-full px-4 text-[15px]",
           on ? "bg-ink font-semibold text-bg" : "glass font-medium text-ink",
+          fixed && "opacity-50",
         )}
       >
         {on ? `✓ ${symptom.short}` : symptom.short}
@@ -85,6 +93,7 @@ export function SymptomPicker(props: {
   value: string;
   onChange: (next: string) => void;
   ageDays: number | null;
+  locked?: readonly string[];
 }) {
   const [expanded, setExpanded] = useState(false);
   return (
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  216 passed (216)`, `Tests  2092 passed (2092)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/quick/SymptomPicker.tsx components/quick/symptoms.test.tsx
git commit -m "feat(symptoms): a locked chip stays on" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Dải ngày và phiếu của một ngày, phần vẽ (§4.2, §4.3, §5.1–§5.3)

**Files:**

- Create: `components/quick/SymptomDaySheet.tsx` (chỉ `DayStrip` và `SymptomDaySheetView` ở task này)
- Test: `components/quick/symptomday.test.tsx`

**Interfaces:**

- Consumes: `SymptomDay`, `StripDay`, `symptomDay` (plan A); `SymptomPicker` với `locked` (Task 1); `Sheet`, `Button`, `Icon`, `CATEGORIES`, `FIELD_INPUT`, `FIELD_LABEL`.
- Produces: `DayStrip`, `SheetStatus`, `SymptomDaySheetView` (chữ ký ở Contracts).

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/quick/symptomday.test.tsx b/components/quick/symptomday.test.tsx
new file mode 100644
index 0000000..64faca1
--- /dev/null
+++ b/components/quick/symptomday.test.tsx
@@ -0,0 +1,293 @@
+import { type ComponentProps, createRef } from "react";
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements, hostElements } from "@/components/ui/testTree";
+import { symptomDay, type SymptomLog } from "@/lib/rules/symptomDay";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { DayStrip, SymptomDaySheetView } from "./SymptomDaySheet";
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const log = (
+  id: string,
+  time: string,
+  details: unknown,
+  createdBy = "me",
+): SymptomLog => ({
+  id,
+  type: "symptom",
+  started_at: iso(time),
+  ended_at: iso(time),
+  details,
+  note: null,
+  created_by: createdBy,
+});
+const mine = (createdBy: string) => createdBy === "me";
+
+// Spec 2026-11-27 §4.3.
+describe("DayStrip", () => {
+  const strip = (
+    over: Partial<ComponentProps<typeof DayStrip>> = {},
+  ): ComponentProps<typeof DayStrip> => ({
+    label: "Ngày nào? · đợt ốm từ 25/11",
+    days: [
+      { day: "2026-11-25", top: "Ngày 1", bottom: "25/11" },
+      { day: "2026-11-26", top: "Ngày 2", bottom: "26/11" },
+      { day: "2026-11-27", top: "Hôm nay", bottom: "27/11" },
+    ],
+    selected: "2026-11-26",
+    marked: ["2026-11-25", "2026-11-26"],
+    other: null,
+    min: "2026-09-10",
+    max: "2026-11-27",
+    onPick: () => {},
+    ...over,
+  });
+
+  it("a label, one 64 px cell per day, the picked one filled, a dot on logged days, then Khác", () => {
+    const html = renderToStaticMarkup(<DayStrip {...strip()} />);
+    expect(html).toContain(">Ngày nào? · đợt ốm từ 25/11</span>");
+    expect(html).toContain('role="group" aria-label="Ngày nào?"');
+    expect(html).toContain("overflow-x-auto");
+    const cells = html.split("<button").slice(1);
+    expect(cells).toHaveLength(3);
+    for (const cell of cells) {
+      expect(cell).toContain("w-16");
+      expect(cell).toContain("min-h-16");
+      expect(cell).toContain("rounded-[18px]");
+    }
+    expect(cells[0]).toMatch(/aria-pressed="false" class="[^"]*glass/);
+    expect(cells[1]).toMatch(
+      /aria-pressed="true" class="[^"]*bg-accent text-on-accent/,
+    );
+    expect(cells[1]).toContain(">Ngày 2</span>");
+    expect(cells[1]).toContain(">26/11</span>");
+    expect(cells[0]).toContain("size-1.5 rounded-full bg-accent");
+    expect(cells[1]).toContain("size-1.5 rounded-full bg-on-accent");
+    expect(cells[2]).not.toContain("size-1.5");
+    expect(cells[0]).toContain('<span class="sr-only">, đã ghi</span>');
+    expect(html).toContain(`d="${ICON_PATHS.calendar}"`);
+    expect(html).toMatch(
+      /<input type="date" aria-label="Chọn ngày khác" min="2026-09-10" max="2026-11-27" class="[^"]*opacity-0[^"]*" value=""\/>/,
+    );
+    expect(html).toMatch(/>Khác<\/span><input/);
+  });
+
+  it("a day outside the strip: Khác is filled and shows that day", () => {
+    const html = renderToStaticMarkup(
+      <DayStrip {...strip({ selected: "2026-11-10", other: "2026-11-10" })} />,
+    );
+    expect(html).not.toContain('aria-pressed="true"');
+    expect(html).toMatch(/<label class="[^"]*bg-accent text-on-accent/);
+    expect(html).toMatch(/>10\/11<\/span><input[^>]*value="2026-11-10"/);
+  });
+
+  it("the scrolling row takes the ref its sheet scrolls with; cells stay oldest → today → Khác", () => {
+    const scrollRef = createRef<HTMLDivElement>();
+    const rows = hostElements(DayStrip(strip({ scrollRef })), "div").filter(
+      (el) => el.props.role === "group",
+    );
+    expect(rows).toHaveLength(1);
+    expect(rows[0].props.ref).toBe(scrollRef);
+    const html = renderToStaticMarkup(<DayStrip {...strip()} />);
+    expect(html.indexOf(">Ngày 1</span>")).toBeLessThan(
+      html.indexOf(">Hôm nay</span>"),
+    );
+    expect(html.indexOf(">Hôm nay</span>")).toBeLessThan(
+      html.indexOf(">Khác</span>"),
+    );
+  });
+
+  it("a cell or the date field picks a day", () => {
+    const onPick = vi.fn();
+    const tree = DayStrip(strip({ onPick }));
+    const buttons = hostElements(tree, "button");
+    (buttons[2].props.onClick as () => void)();
+    expect(onPick).toHaveBeenLastCalledWith("2026-11-27");
+    const [input] = hostElements(tree, "input");
+    const change = input.props.onChange as (event: {
+      target: { value: string };
+    }) => void;
+    change({ target: { value: "2026-11-02" } });
+    expect(onPick).toHaveBeenLastCalledWith("2026-11-02");
+    change({ target: { value: "" } });
+    expect(onPick).toHaveBeenCalledTimes(2);
+  });
+});
+
+// Spec 2026-11-27 §4.2, §5.
+describe("SymptomDaySheetView", () => {
+  const day = (logs: SymptomLog[] = [], date = "2026-11-25") =>
+    symptomDay(logs, date, mine);
+  const props = (
+    over: Partial<ComponentProps<typeof SymptomDaySheetView>> = {},
+  ): ComponentProps<typeof SymptomDaySheetView> => ({
+    title: "Triệu chứng",
+    sub: null,
+    strip: null,
+    status: "ready",
+    day: day(),
+    picked: "",
+    note: "",
+    ageDays: 76,
+    dirty: false,
+    saving: false,
+    message: null,
+    deletable: false,
+    onPicked: () => {},
+    onNote: () => {},
+    onSave: () => {},
+    onDelete: () => {},
+    onClose: () => {},
+    ...over,
+  });
+  const render = (
+    over: Partial<ComponentProps<typeof SymptomDaySheetView>> = {},
+  ) => renderToStaticMarkup(<SymptomDaySheetView {...props(over)} />);
+  const saveButton = (html: string) =>
+    html.match(/<button[^>]*>Lưu<\/button>/)?.[0] ?? "";
+
+  it("an empty day: the plain hint, the chips, the note; Lưu off until a chip is on", () => {
+    const html = render();
+    expect(html).toContain(">Triệu chứng</h2>");
+    expect(html).toContain("bg-cat-med/15 text-cat-med");
+    expect(html).toContain(">Bấm những gì bé có trong ngày.</p>");
+    expect(html).toContain(">Hay gặp</span>");
+    expect(html).toContain(">Ghi chú (không bắt buộc)</span>");
+    expect(html).toMatch(/<textarea rows="3" maxLength="200" disabled=""/);
+    expect(html).toContain(">Bật ít nhất một triệu chứng để ghi chú.</p>");
+    expect(saveButton(html)).toContain('disabled=""');
+    expect(html).not.toContain("Xóa triệu chứng ngày này");
+    const on = render({ picked: "cough" });
+    expect(saveButton(on)).not.toContain('disabled=""');
+    expect(on).not.toMatch(/<textarea[^>]*disabled=""/);
+    expect(on).not.toContain("Bật ít nhất một triệu chứng");
+  });
+
+  it("a day with symptoms: the line saying what was logged", () => {
+    const html = render({
+      day: day([
+        log("a", "2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
+      ]),
+      picked: "runny_nose,cough",
+    });
+    expect(html).toContain(
+      ">Ngày này đã ghi Sổ mũi, Ho. Bấm để thêm hoặc bỏ rồi Lưu.</p>",
+    );
+    expect(html).toContain("bg-accent-tint");
+  });
+
+  it("another's chips are locked, with a line saying why; their notes show under the field", () => {
+    const html = render({
+      day: day([
+        log(
+          "c",
+          "2026-11-25 09:00",
+          { codes: ["fever"], note: "bà ghi" },
+          "ba",
+        ),
+      ]),
+      picked: "fever",
+    });
+    expect(html).toMatch(/aria-disabled="true"[^>]*>✓ Sốt<\/button>/);
+    expect(html).toContain(
+      ">Chip mờ do người khác ghi, chỉ họ hoặc chủ gia đình bỏ được.</p>",
+    );
+    expect(html).toContain(">Người khác ghi: bà ghi</p>");
+    // Only another's chip is on: the note waits for one of the viewer's own.
+    expect(html).toMatch(/<textarea[^>]*disabled=""/);
+    expect(saveButton(html)).not.toContain('disabled=""');
+  });
+
+  it("loading and a load error: no chips, no note, Lưu off", () => {
+    const loading = render({ status: "loading", picked: "cough" });
+    expect(loading).toContain(">Đang tải…</p>");
+    expect(loading).not.toContain(">Hay gặp</span>");
+    expect(loading).not.toContain("<textarea");
+    expect(saveButton(loading)).toContain('disabled=""');
+    const failed = render({ status: "error", picked: "cough" });
+    expect(failed).toContain(
+      'role="alert" class="text-[15px] text-danger">Không tải được triệu chứng đã ghi</p>',
+    );
+    expect(saveButton(failed)).toContain('disabled=""');
+  });
+
+  it("the fixed day: its title, its line, no strip, and the delete button when allowed", () => {
+    const html = render({
+      title: "Triệu chứng · 25/11",
+      sub: "Ngày 1 của đợt ốm · cả ngày",
+      picked: "cough",
+      deletable: true,
+    });
+    expect(html).toContain(">Triệu chứng · 25/11</h2>");
+    expect(html).toContain(">Ngày 1 của đợt ốm · cả ngày</p>");
+    expect(html).not.toContain('aria-label="Ngày nào?"');
+    expect(html).toMatch(
+      /<button type="button" class="[^"]*min-h-11[^"]*text-danger[^"]*">Xóa triệu chứng ngày này<\/button>/,
+    );
+    expect(html.indexOf(">Lưu</button>")).toBeLessThan(
+      html.indexOf(">Xóa triệu chứng ngày này</button>"),
+    );
+  });
+
+  it("the delete button waits while a save or delete is on its way", () => {
+    const html = render({ picked: "cough", deletable: true, saving: true });
+    expect(html).toMatch(
+      /<button type="button" disabled=""[^>]*>Xóa triệu chứng ngày này<\/button>/,
+    );
+  });
+
+  it("the strip mode draws the strip above the hint", () => {
+    const html = render({
+      strip: {
+        label: "Ngày nào?",
+        days: [{ day: "2026-11-25", top: "Hôm nay", bottom: "25/11" }],
+        selected: "2026-11-25",
+        marked: [],
+        other: null,
+        min: "2026-09-10",
+        max: "2026-11-25",
+        onPick: () => {},
+      },
+    });
+    expect(html.indexOf('aria-label="Ngày nào?"')).toBeLessThan(
+      html.indexOf(">Bấm những gì bé có trong ngày.</p>"),
+    );
+  });
+
+  it("a message is an alert above Lưu", () => {
+    const html = render({
+      picked: "cough",
+      message: "Ghi chú dài quá 200 ký tự",
+    });
+    expect(html).toContain(
+      'role="alert" class="text-[15px] text-danger">Ghi chú dài quá 200 ký tự</p>',
+    );
+  });
+
+  it("Lưu, Xóa and the note call back", () => {
+    const onSave = vi.fn();
+    const onDelete = vi.fn();
+    const onNote = vi.fn();
+    const tree = SymptomDaySheetView(
+      props({ picked: "cough", deletable: true, onSave, onDelete, onNote }),
+    );
+    const buttons = findElements(
+      tree,
+      (el) => typeof el.props.onClick === "function",
+    );
+    const save = buttons.find((el) => el.props.children === "Lưu");
+    const remove = buttons.find(
+      (el) => el.props.children === "Xóa triệu chứng ngày này",
+    );
+    (save?.props.onClick as () => void)();
+    (remove?.props.onClick as () => void)();
+    expect(onSave).toHaveBeenCalledTimes(1);
+    expect(onDelete).toHaveBeenCalledTimes(1);
+    const [textarea] = findElements(tree, (el) => el.type === "textarea");
+    (textarea.props.onChange as (event: { target: { value: string } }) => void)(
+      { target: { value: "ho" } },
+    );
+    expect(onNote).toHaveBeenCalledWith("ho");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 216 passed (217)`, `Tests  2092 passed (2092)`. File test mới đỏ ngay ở bước nạp (`./SymptomDaySheet` chưa có).

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/quick/SymptomDaySheet.tsx b/components/quick/SymptomDaySheet.tsx
new file mode 100644
index 0000000..cde49d9
--- /dev/null
+++ b/components/quick/SymptomDaySheet.tsx
@@ -0,0 +1,261 @@
+"use client";
+
+import type { Ref } from "react";
+import { Button } from "@/components/ui/Button";
+import { Icon } from "@/components/ui/Icon";
+import { Sheet } from "@/components/ui/Sheet";
+import { TRIAGE } from "@/lib/content/triage";
+import { formatDayShort } from "@/lib/rules/days";
+import type { StripDay, SymptomDay } from "@/lib/rules/symptomDay";
+import { parseCodes, symptomShorts } from "@/lib/rules/symptomForm";
+import { CATEGORIES } from "@/lib/ui/categories";
+import { cx } from "@/lib/ui/cx";
+import { FIELD_INPUT, FIELD_LABEL } from "./styles";
+import { SymptomPicker } from "./SymptomPicker";
+
+const CELL =
+  "flex min-h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[18px] text-center";
+
+// Spec 2026-11-27 §4.3: the day strip of the symptom sheet. `other` is a day
+// picked with "Khác" that is not in the strip. The cells stay in time order
+// (oldest, …, today, Khác), so a screen reader reads them that way; the sheet
+// scrolls the row to its end through `scrollRef` once its dialog is open.
+export function DayStrip({
+  label,
+  days,
+  selected,
+  marked,
+  other,
+  min,
+  max,
+  onPick,
+  scrollRef,
+}: {
+  label: string;
+  days: StripDay[];
+  selected: string;
+  // Days that already have a symptom log.
+  marked: readonly string[];
+  other: string | null;
+  min: string;
+  max: string;
+  onPick: (day: string) => void;
+  scrollRef?: Ref<HTMLDivElement>;
+}) {
+  return (
+    <div className="flex flex-col gap-2">
+      <span className={FIELD_LABEL}>{label}</span>
+      <div
+        ref={scrollRef}
+        role="group"
+        aria-label="Ngày nào?"
+        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
+      >
+        {days.map((cell) => {
+          const on = cell.day === selected && other === null;
+          return (
+            <button
+              key={cell.day}
+              type="button"
+              aria-pressed={on}
+              onClick={() => onPick(cell.day)}
+              className={cx(
+                CELL,
+                on ? "bg-accent text-on-accent" : "glass text-ink",
+              )}
+            >
+              <span className="text-[15px] leading-5 font-bold">
+                {cell.top}
+              </span>
+              <span className={cx("text-xs leading-4", !on && "text-muted")}>
+                {cell.bottom}
+              </span>
+              {marked.includes(cell.day) && (
+                <>
+                  <span
+                    aria-hidden="true"
+                    className={cx(
+                      "size-1.5 rounded-full",
+                      on ? "bg-on-accent" : "bg-accent",
+                    )}
+                  />
+                  <span className="sr-only">, đã ghi</span>
+                </>
+              )}
+            </button>
+          );
+        })}
+        <label
+          className={cx(
+            CELL,
+            "relative",
+            other ? "bg-accent text-on-accent" : "glass text-ink",
+          )}
+        >
+          <Icon name="calendar" size={20} />
+          <span className={cx("text-xs leading-4", !other && "text-muted")}>
+            {other ? formatDayShort(other) : "Khác"}
+          </span>
+          <input
+            type="date"
+            aria-label="Chọn ngày khác"
+            min={min}
+            max={max}
+            className="absolute inset-0 opacity-0"
+            value={other ?? ""}
+            onChange={(event) => {
+              if (event.target.value) onPick(event.target.value);
+            }}
+          />
+        </label>
+      </div>
+    </div>
+  );
+}
+
+export type SheetStatus = "loading" | "error" | "ready";
+
+// Spec 2026-11-27 §4.2 and §5: the symptom sheet of one day, drawn without
+// hooks. `strip` is null for a fixed day; `picked` is every chip switched on
+// (comma-joined, locked ones included).
+export function SymptomDaySheetView({
+  title,
+  sub,
+  strip,
+  status,
+  day,
+  picked,
+  note,
+  ageDays,
+  dirty,
+  saving,
+  message,
+  deletable,
+  onPicked,
+  onNote,
+  onSave,
+  onDelete,
+  onClose,
+}: {
+  title: string;
+  sub: string | null;
+  strip: Parameters<typeof DayStrip>[0] | null;
+  status: SheetStatus;
+  day: SymptomDay;
+  picked: string;
+  note: string;
+  ageDays: number | null;
+  dirty: boolean;
+  saving: boolean;
+  message: string | null;
+  deletable: boolean;
+  onPicked: (next: string) => void;
+  onNote: (next: string) => void;
+  onSave: () => void;
+  onDelete: () => void;
+  onClose: () => void;
+}) {
+  const ready = status === "ready";
+  const codes = parseCodes(picked);
+  const ownCodes = codes.filter((code) => !day.locked.includes(code));
+  const logged = symptomShorts(day.codes, TRIAGE.symptoms);
+
+  return (
+    <Sheet
+      open
+      onClose={onClose}
+      title={title}
+      icon={CATEGORIES.symptom.icon}
+      iconColor={CATEGORIES.symptom.token}
+      dirty={dirty}
+      footer={
+        <div className="flex flex-col gap-2">
+          {message && (
+            <p role="alert" className="text-[15px] text-danger">
+              {message}
+            </p>
+          )}
+          <Button
+            block
+            busy={saving}
+            disabled={!ready || codes.length === 0}
+            onClick={onSave}
+            className="min-h-14!"
+          >
+            Lưu
+          </Button>
+          {deletable && (
+            <button
+              type="button"
+              disabled={saving}
+              onClick={onDelete}
+              className="min-h-11 w-full rounded-full text-[15px] font-semibold text-danger disabled:opacity-50"
+            >
+              Xóa triệu chứng ngày này
+            </button>
+          )}
+        </div>
+      }
+    >
+      <div className="flex flex-col gap-5 pt-1">
+        {sub && <p className="-mt-2 text-[15px] text-muted">{sub}</p>}
+        {strip && <DayStrip {...strip} />}
+        {status === "loading" ? (
+          <p className="text-[15px] text-muted">Đang tải…</p>
+        ) : status === "error" ? (
+          <p role="alert" className="text-[15px] text-danger">
+            Không tải được triệu chứng đã ghi
+          </p>
+        ) : logged.length > 0 ? (
+          <p className="rounded-[16px] bg-accent-tint px-3 py-2.5 text-[15px] font-medium text-accent-text">
+            {`Ngày này đã ghi ${logged.join(", ")}. Bấm để thêm hoặc bỏ rồi Lưu.`}
+          </p>
+        ) : (
+          <p className="text-[15px] text-muted">
+            Bấm những gì bé có trong ngày.
+          </p>
+        )}
+        {ready && (
+          <>
+            <div className="flex flex-col gap-2">
+              <SymptomPicker
+                value={picked}
+                onChange={onPicked}
+                ageDays={ageDays}
+                locked={day.locked}
+              />
+              {day.locked.length > 0 && (
+                <p className="text-[13px] leading-[18px] text-muted">
+                  Chip mờ do người khác ghi, chỉ họ hoặc chủ gia đình bỏ được.
+                </p>
+              )}
+            </div>
+            <div className="flex flex-col gap-1.5">
+              <label className="flex flex-col gap-1.5">
+                <span className={FIELD_LABEL}>Ghi chú (không bắt buộc)</span>
+                <textarea
+                  rows={3}
+                  maxLength={200}
+                  disabled={ownCodes.length === 0}
+                  className={`${FIELD_INPUT} py-2.5 disabled:opacity-50`}
+                  value={note}
+                  onChange={(event) => onNote(event.target.value)}
+                />
+              </label>
+              {ownCodes.length === 0 && (
+                <p className="text-[13px] leading-[18px] text-muted">
+                  Bật ít nhất một triệu chứng để ghi chú.
+                </p>
+              )}
+              {day.otherNotes.length > 0 && (
+                <p className="text-[13px] leading-[18px] text-muted">
+                  {`Người khác ghi: ${day.otherNotes.join(" · ")}`}
+                </p>
+              )}
+            </div>
+          </>
+        )}
+      </div>
+    </Sheet>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  217 passed (217)`, `Tests  2105 passed (2105)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/quick/SymptomDaySheet.tsx components/quick/symptomday.test.tsx
git commit -m "feat(symptoms): the day strip and the sheet of one day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Phiếu tự đọc dữ liệu và lưu; "+" và thẻ đợt ốm mở nó (§4.1, §4.3, §4.4, §5.2)

**Files:**

- Create: `lib/ui/scrollRow.ts`
- Modify: `components/quick/SymptomDaySheet.tsx` (thêm `SymptomDaySheet`), `components/actions/QuickActions.tsx`, `components/home/QuickEntrySheet.tsx`
- Delete: `components/quick/SymptomFields.tsx`
- Test: `lib/ui/scrollRow.test.ts` (mới), `components/quick/symptomdaysheet.test.tsx` (mới), `components/actions/quickactions.test.tsx`, `components/home/quickentry.test.tsx`, `components/quick/symptoms.test.tsx`

**Interfaces:**

- Consumes: `DayStrip`, `SymptomDaySheetView` (Task 2); `dayStrip`, `symptomDay`, `symptomDaySave`, `symptomDayDelete`, `canDeleteDay`, `startOfDayIso` (plan A); `useEpisodes`, `useRangeLogs`, `useSaveLog`, `useDeleteLog`, `useToast`, `toVietnameseError`, `canModifyLog`.
- Produces: `SymptomDaySheet({ baby, userId, canModify, day?, sub?, onClose })`; `InstantSheet` trong `QuickActions.tsx`; `nearestScrollLeft({ cellLeft, cellWidth, scrollLeft, clientWidth }): number` và `keepPickedInView(row: HTMLElement | null): void` trong `lib/ui/scrollRow.ts`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/actions/quickactions.test.tsx b/components/actions/quickactions.test.tsx
index 62474a8..fb7b39d 100644
--- a/components/actions/quickactions.test.tsx
+++ b/components/actions/quickactions.test.tsx
@@ -4,9 +4,18 @@ import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it } from "vitest";
 import { ToastProvider } from "@/components/ui/Toast";
 import type { Baby, FamilyMember } from "@/lib/supabase/rows";
-import { QuickActionsProvider, useQuickActions } from "./QuickActions";
+import {
+  InstantSheet,
+  QuickActionsProvider,
+  useQuickActions,
+} from "./QuickActions";
 
-const baby = { id: "b1", family_id: "f1", name: "Bun" } as Baby;
+const baby = {
+  id: "b1",
+  family_id: "f1",
+  name: "Bun",
+  dob: "2026-09-10",
+} as Baby;
 const member = {
   role: "owner",
   user_id: "u1",
@@ -59,6 +68,31 @@ describe("QuickActionsProvider", () => {
     ).toThrow("useToast must be used inside ToastProvider");
   });
 
+  it("spec 2026-11-27 §4.1: Triệu chứng opens the day sheet, the other types the quick-entry sheet", () => {
+    const sheet = (type: "symptom" | "bottle") =>
+      renderToStaticMarkup(
+        withQuery(
+          <ToastProvider>
+            <InstantSheet
+              sheet={{ type }}
+              baby={baby}
+              member={member}
+              userId="u1"
+              rows={[]}
+              onSaved={() => {}}
+              onClose={() => {}}
+            />
+          </ToastProvider>,
+        ),
+      );
+    const symptom = sheet("symptom");
+    expect(symptom).toContain('aria-label="Ngày nào?"');
+    expect(symptom).not.toContain(">Lúc nào?</span>");
+    const bottle = sheet("bottle");
+    expect(bottle).toContain(">Lúc nào?</span>");
+    expect(bottle).not.toContain('aria-label="Ngày nào?"');
+  });
+
   it("useQuickActions throws outside the provider", () => {
     expect(() => renderToStaticMarkup(<Probe />)).toThrow(
       "useQuickActions must be used inside QuickActionsProvider",
diff --git a/components/home/quickentry.test.tsx b/components/home/quickentry.test.tsx
index e25c8e0..f79bc34 100644
--- a/components/home/quickentry.test.tsx
+++ b/components/home/quickentry.test.tsx
@@ -88,30 +88,9 @@ describe("QuickEntrySheet", () => {
     );
   });
 
-  it("spec 2026-11-26 §3.5: symptom opens on its chips; Lưu waits for the first one", () => {
+  it("spec 2026-11-27 §4.1: no symptom fields here; Lưu is never off up front", () => {
     const html = render({ type: "symptom", ageDays: 76 });
-    expect(html).toContain(">Triệu chứng</h2>");
-    expect(html).toContain("bg-cat-med/15 text-cat-med");
-    expect(html).toContain(`d="${ICON_PATHS.pulse}"`);
-    expect(html).toContain(">Bấm những gì bé đang có.</p>");
-    expect(html).toContain(">Xem tất cả 22 triệu chứng</button>");
-    expect(html).not.toContain('aria-pressed="true">✓');
-    expect(html.indexOf(">Hay gặp</span>")).toBeLessThan(
-      html.indexOf(">Ghi chú (không bắt buộc)</span>"),
-    );
-    expect(html.indexOf(">Ghi chú (không bắt buộc)</span>")).toBeLessThan(
-      html.indexOf(">Lúc nào?</span>"),
-    );
-    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""[^>]*>Lưu</);
-    const picked = render({
-      type: "symptom",
-      ageDays: 76,
-      initial: { codes: "cough" },
-    });
-    expect(picked).toContain(">Bấm những gì bé đang có. Đã chọn 1.</p>");
-    expect(picked).toMatch(/aria-pressed="true"[^>]*>✓ Ho<\/button>/);
-    expect(picked).not.toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
-    // The other types never disable Lưu up front.
+    expect(html).not.toContain(">Hay gặp</span>");
     expect(render({ type: "note" })).not.toMatch(
       /<button[^>]*type="submit"[^>]*disabled=""/,
     );
diff --git a/components/quick/symptomdaysheet.test.tsx b/components/quick/symptomdaysheet.test.tsx
new file mode 100644
index 0000000..7824683
--- /dev/null
+++ b/components/quick/symptomdaysheet.test.tsx
@@ -0,0 +1,55 @@
+import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import type { ReactNode } from "react";
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import { ToastProvider } from "@/components/ui/Toast";
+import type { Baby } from "@/lib/supabase/rows";
+import { SymptomDaySheet } from "./SymptomDaySheet";
+
+const baby = {
+  id: "b1",
+  family_id: "f1",
+  name: "Bun",
+  dob: "2026-09-10",
+} as Baby;
+const wrap = (node: ReactNode) =>
+  renderToStaticMarkup(
+    <QueryClientProvider client={new QueryClient()}>
+      <ToastProvider>{node}</ToastProvider>
+    </QueryClientProvider>,
+  );
+
+// Spec 2026-11-27 §4 and §5: the sheet reads the day's logs itself.
+describe("SymptomDaySheet", () => {
+  it("without a day: the strip, today picked, waiting for the logs", () => {
+    const html = wrap(
+      <SymptomDaySheet
+        baby={baby}
+        userId="u1"
+        canModify={() => true}
+        onClose={() => {}}
+      />,
+    );
+    expect(html).toContain(">Triệu chứng</h2>");
+    expect(html).toContain('role="group" aria-label="Ngày nào?"');
+    expect(html).toMatch(/aria-pressed="true"[^>]*><span[^>]*>Hôm nay<\/span>/);
+    expect(html).toContain(">Đang tải…</p>");
+    expect(html).not.toContain(">Lúc nào?</span>");
+  });
+
+  it("a fixed day: its title and line, no strip", () => {
+    const html = wrap(
+      <SymptomDaySheet
+        baby={baby}
+        userId="u1"
+        canModify={() => true}
+        day="2026-11-25"
+        sub="Cả ngày"
+        onClose={() => {}}
+      />,
+    );
+    expect(html).toContain(">Triệu chứng · 25/11</h2>");
+    expect(html).toContain(">Cả ngày</p>");
+    expect(html).not.toContain('aria-label="Ngày nào?"');
+  });
+});
diff --git a/components/quick/symptoms.test.tsx b/components/quick/symptoms.test.tsx
index 9c67820..4cbd667 100644
--- a/components/quick/symptoms.test.tsx
+++ b/components/quick/symptoms.test.tsx
@@ -1,7 +1,6 @@
 import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
 import { hostElements } from "@/components/ui/testTree";
-import { SymptomFields } from "./SymptomFields";
 import { SymptomPickerView } from "./SymptomPicker";
 
 type ViewProps = Parameters<typeof SymptomPickerView>[0];
@@ -145,27 +144,3 @@ describe("SymptomPickerView", () => {
     expect(onChange).toHaveBeenCalledWith("fever,gone_code");
   });
 });
-
-describe("SymptomFields", () => {
-  const html = (values: Record<string, string>) =>
-    renderToStaticMarkup(
-      <SymptomFields values={values} onChange={() => {}} ageDays={76} />,
-    );
-
-  it("a hint line, the chips, then a note of at most 200 characters", () => {
-    const empty = html({ codes: "", note: "" });
-    expect(empty).toContain(">Bấm những gì bé đang có.</p>");
-    expect(empty).toContain(">Hay gặp</span>");
-    expect(empty).toContain(">Ghi chú (không bắt buộc)</span>");
-    expect(empty).toMatch(/<textarea[^>]*rows="3"[^>]*maxLength="200"/);
-    expect(empty.indexOf(">Hay gặp</span>")).toBeLessThan(
-      empty.indexOf(">Ghi chú (không bắt buộc)</span>"),
-    );
-  });
-
-  it("says how many are picked and shows the note", () => {
-    const picked = html({ codes: "runny_nose,cough", note: "Ho về đêm" });
-    expect(picked).toContain(">Bấm những gì bé đang có. Đã chọn 2.</p>");
-    expect(picked).toContain(">Ho về đêm</textarea>");
-  });
-});
diff --git a/lib/ui/scrollRow.test.ts b/lib/ui/scrollRow.test.ts
new file mode 100644
index 0000000..f7e10c3
--- /dev/null
+++ b/lib/ui/scrollRow.test.ts
@@ -0,0 +1,23 @@
+import { describe, expect, it } from "vitest";
+import { nearestScrollLeft } from "./scrollRow";
+
+// Spec 2026-11-27 §4.3: a picked cell of the day strip is brought into view by
+// moving the row only as far as needed, never the sheet around it.
+describe("nearestScrollLeft", () => {
+  const view = { cellWidth: 64, scrollLeft: 100, clientWidth: 300 };
+
+  it("a cell already in view: the row stays", () => {
+    expect(nearestScrollLeft({ ...view, cellLeft: 100 })).toBe(100);
+    expect(nearestScrollLeft({ ...view, cellLeft: 336 })).toBe(100);
+  });
+
+  it("a cell cut on the left: its left edge goes to the row's left edge", () => {
+    expect(nearestScrollLeft({ ...view, cellLeft: 40 })).toBe(40);
+    expect(nearestScrollLeft({ ...view, cellLeft: 0 })).toBe(0);
+  });
+
+  it("a cell cut on the right: its right edge goes to the row's right edge", () => {
+    expect(nearestScrollLeft({ ...view, cellLeft: 340 })).toBe(104);
+    expect(nearestScrollLeft({ ...view, cellLeft: 600 })).toBe(364);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  4 failed | 215 passed (219)`, `Tests  4 failed | 2102 passed (2106)`. Patch 5 cũng xóa hai test của `SymptomFields` và thay test triệu chứng cũ của `QuickEntrySheet`, nên tổng giảm 3 rồi cộng 4 test mới; file test mới `lib/ui/scrollRow.test.ts` đỏ ngay ở bước nạp nên ba test của nó chưa được đếm.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/components/actions/QuickActions.tsx b/components/actions/QuickActions.tsx
index 23ce4a3..510cb83 100644
--- a/components/actions/QuickActions.tsx
+++ b/components/actions/QuickActions.tsx
@@ -11,6 +11,7 @@ import {
 } from "react";
 import { PumpSheet } from "@/components/home/PumpSheet";
 import { QuickEntrySheet } from "@/components/home/QuickEntrySheet";
+import { SymptomDaySheet } from "@/components/quick/SymptomDaySheet";
 import { useToast } from "@/components/ui/Toast";
 import { toVietnameseError } from "@/lib/data/errors";
 import {
@@ -21,6 +22,7 @@ import {
   useStopTimer,
   useTimerPress,
 } from "@/lib/data/logs";
+import { canModifyLog } from "@/lib/rules/history";
 import type { LogType } from "@/lib/rules/logDetails";
 import {
   ACTION_SHEET_CLOSED,
@@ -51,6 +53,48 @@ import {
 import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
 import { tapFeedback } from "@/lib/ui/haptics";
 
+// Spec 2026-11-27 §4.1: Triệu chứng opens the day sheet; every other type
+// the quick-entry sheet with its time chips.
+export function InstantSheet({
+  sheet,
+  baby,
+  member,
+  userId,
+  rows,
+  onSaved,
+  onClose,
+}: {
+  sheet: { type: InstantType; initial?: QuickValues };
+  baby: Baby;
+  member: FamilyMember;
+  userId: string;
+  rows: LogRow[];
+  onSaved: Parameters<typeof QuickEntrySheet>[0]["onSaved"];
+  onClose: () => void;
+}) {
+  if (sheet.type === "symptom")
+    return (
+      <SymptomDaySheet
+        baby={baby}
+        userId={userId}
+        canModify={(createdBy) => canModifyLog(member, createdBy)}
+        onClose={onClose}
+      />
+    );
+  return (
+    <QuickEntrySheet
+      type={sheet.type}
+      initial={sheet.initial}
+      recentLogs={rows}
+      ageDays={ageDays(baby.dob, new Date())}
+      babyId={baby.id}
+      userId={userId}
+      onSaved={onSaved}
+      onClose={onClose}
+    />
+  );
+}
+
 export type QuickActionsValue = {
   running: RunningLog[];
   // The running timers as full rows, for the tab bar's timer tile
@@ -179,13 +223,12 @@ export function QuickActionsProvider({
     <QuickActionsContext.Provider value={value}>
       {children}
       {sheet && (
-        <QuickEntrySheet
-          type={sheet.type}
-          initial={sheet.initial}
-          recentLogs={rows}
-          ageDays={ageDays(baby.dob, new Date())}
-          babyId={baby.id}
+        <InstantSheet
+          sheet={sheet}
+          baby={baby}
+          member={member}
           userId={userId}
+          rows={rows}
           onSaved={(saved) => showUndo(instantToast(saved))}
           onClose={() => setSheet(null)}
         />
diff --git a/components/home/QuickEntrySheet.tsx b/components/home/QuickEntrySheet.tsx
index ab2f0e2..7577a34 100644
--- a/components/home/QuickEntrySheet.tsx
+++ b/components/home/QuickEntrySheet.tsx
@@ -6,7 +6,6 @@ import { DiaperFields } from "@/components/quick/DiaperFields";
 import { MedicineFields } from "@/components/quick/MedicineFields";
 import { NoteFields } from "@/components/quick/NoteFields";
 import { SolidsFields } from "@/components/quick/SolidsFields";
-import { SymptomFields } from "@/components/quick/SymptomFields";
 import { TemperatureFields } from "@/components/quick/TemperatureFields";
 import { TimeChips } from "@/components/quick/TimeChips";
 import { WaterFields } from "@/components/quick/WaterFields";
@@ -26,7 +25,6 @@ import {
   type InstantType,
   type QuickValues,
 } from "@/lib/rules/quickEntry";
-import { parseCodes } from "@/lib/rules/symptomForm";
 import {
   timeChipError,
   timeChipToDate,
@@ -70,7 +68,8 @@ export function QuickEntrySheet({
   }) => void;
   initial?: QuickValues;
   recentLogs?: LogRow[];
-  // Spec 2026-11-26 §3.5: filters the symptom chips; null shows them all.
+  // Spec 2026-11-26 §3.5: filtered the symptom chips. Spec 2026-11-27 §4.1:
+  // symptoms have their own sheet now; kept so callers need not change.
   ageDays?: number | null;
 }) {
   const add = useAddInstant(babyId, userId);
@@ -155,13 +154,9 @@ export function QuickEntrySheet({
     // Tắm has no fields: the sheet is just the time chips and Lưu.
     bath: null,
     note: <NoteFields values={values} onChange={setValues} />,
-    symptom: (
-      <SymptomFields values={values} onChange={setValues} ageDays={ageDays} />
-    ),
+    // Spec 2026-11-27 §4.1: Triệu chứng opens SymptomDaySheet instead.
+    symptom: null,
   }[type];
-  // Spec 2026-11-26 §3.5: a symptom log needs at least one chip.
-  const nothingPicked =
-    type === "symptom" && parseCodes(values.codes).length === 0;
 
   return (
     <Sheet
@@ -183,7 +178,6 @@ export function QuickEntrySheet({
             form={formId}
             block
             busy={add.isPending}
-            disabled={nothingPicked}
             className="min-h-14!"
           >
             Lưu
diff --git a/components/quick/SymptomDaySheet.tsx b/components/quick/SymptomDaySheet.tsx
index cde49d9..406d8e1 100644
--- a/components/quick/SymptomDaySheet.tsx
+++ b/components/quick/SymptomDaySheet.tsx
@@ -1,14 +1,30 @@
 "use client";
 
-import type { Ref } from "react";
+import { type Ref, useEffect, useRef, useState } from "react";
 import { Button } from "@/components/ui/Button";
 import { Icon } from "@/components/ui/Icon";
 import { Sheet } from "@/components/ui/Sheet";
+import { useToast } from "@/components/ui/Toast";
 import { TRIAGE } from "@/lib/content/triage";
-import { formatDayShort } from "@/lib/rules/days";
-import type { StripDay, SymptomDay } from "@/lib/rules/symptomDay";
+import { toVietnameseError } from "@/lib/data/errors";
+import { useEpisodes } from "@/lib/data/illness";
+import { useDeleteLog, useRangeLogs, useSaveLog } from "@/lib/data/logs";
+import { addDays, formatDayShort, startOfDayIso } from "@/lib/rules/days";
+import {
+  canDeleteDay,
+  dayStrip,
+  type StripDay,
+  symptomDay,
+  type SymptomDay,
+  symptomDayDelete,
+  symptomDaySave,
+  type SymptomOp,
+} from "@/lib/rules/symptomDay";
 import { parseCodes, symptomShorts } from "@/lib/rules/symptomForm";
+import { ageDays, vnDateString } from "@/lib/rules/time";
+import type { Baby } from "@/lib/supabase/rows";
 import { CATEGORIES } from "@/lib/ui/categories";
+import { keepPickedInView } from "@/lib/ui/scrollRow";
 import { cx } from "@/lib/ui/cx";
 import { FIELD_INPUT, FIELD_LABEL } from "./styles";
 import { SymptomPicker } from "./SymptomPicker";
@@ -259,3 +275,194 @@ export function SymptomDaySheetView({
     </Sheet>
   );
 }
+
+// Spec 2026-11-27 §4 and §5: the symptom sheet with its data. Without `day`
+// it opens on today with the day strip (the open episode's days, else the
+// last 7); with `day` that day is fixed and `sub` is the line under the title.
+// `canModify` says whether the viewer may change a log made by someone
+// (canModifyLog).
+export function SymptomDaySheet({
+  baby,
+  userId,
+  canModify,
+  day: fixedDay = null,
+  sub = null,
+  onClose,
+}: {
+  baby: Baby;
+  userId: string;
+  canModify: (createdBy: string) => boolean;
+  day?: string | null;
+  sub?: string | null;
+  onClose: () => void;
+}) {
+  const toast = useToast();
+  const save = useSaveLog(baby.id, userId);
+  const remove = useDeleteLog(baby.id, userId);
+  const [openedAt] = useState(() => new Date());
+  const today = vnDateString(openedAt);
+  const episodes = useEpisodes(baby.id);
+  const open = episodes.data?.find((item) => item.ended_at === null) ?? null;
+  const strip =
+    fixedDay === null
+      ? dayStrip({ episode: open, today, dob: baby.dob })
+      : null;
+  const [chosen, setChosen] = useState(today);
+  const day = fixedDay ?? chosen;
+  const inStrip = strip?.days.some((cell) => cell.day === day) ?? false;
+  const stripLogs = useRangeLogs(
+    baby.id,
+    startOfDayIso(strip?.days[0]?.day ?? today),
+    null,
+    strip !== null,
+  );
+  const dayLogs = useRangeLogs(
+    baby.id,
+    startOfDayIso(day),
+    startOfDayIso(addDays(day, 1)),
+    !inStrip,
+  );
+  const source = inStrip ? stripLogs : dayLogs;
+  // The strip is drawn inside the sheet's <dialog>, which is display:none
+  // until Sheet's effect has called showModal(). These effects run after it
+  // (a parent's effects run after its children's), so the row has a width.
+  // The strip opens scrolled to its end, where today and "Khác" are, and
+  // again when it gains cells (the episode list arrived); a picked cell is
+  // then kept in view. Only the row moves (keepPickedInView), never the
+  // dialog, which is still sliding in.
+  const scrollRef = useRef<HTMLDivElement>(null);
+  const cellCount = strip?.days.length ?? 0;
+  useEffect(() => {
+    const row = scrollRef.current;
+    if (row) row.scrollLeft = row.scrollWidth;
+    keepPickedInView(row);
+  }, [cellCount]);
+  useEffect(() => keepPickedInView(scrollRef.current), [day]);
+  const rows = source.data ?? [];
+  const status: SheetStatus = source.data
+    ? "ready"
+    : source.isError
+      ? "error"
+      : "loading";
+  const current = symptomDay(rows, day, canModify);
+  // What the parent changed on this day; dropped when another day is picked.
+  const [edit, setEdit] = useState<{
+    day: string;
+    picked: string;
+    note: string;
+  } | null>(null);
+  const shown =
+    edit && edit.day === day
+      ? edit
+      : { day, picked: current.codes.join(","), note: current.ownNote };
+  const [message, setMessage] = useState<string | null>(null);
+  const [busy, setBusy] = useState(false);
+
+  async function run(ops: SymptomOp[]) {
+    for (const op of ops) {
+      if (op.op === "delete") await remove.mutateAsync(op.id);
+      else
+        await save.mutateAsync({
+          id: op.op === "update" ? op.id : null,
+          type: "symptom",
+          patch: op.patch,
+        });
+    }
+  }
+
+  async function perform(ops: SymptomOp[], done: string) {
+    setBusy(true);
+    setMessage(null);
+    try {
+      await run(ops);
+      toast(done);
+      onClose();
+    } catch (error) {
+      setMessage(toVietnameseError(error));
+    } finally {
+      setBusy(false);
+    }
+  }
+
+  function onSave() {
+    // One clock for the whole save: a sheet opened at 23:59 and saved after
+    // midnight stores its day (then yesterday) at 12:00, not at "now".
+    const saveNow = new Date();
+    const result = symptomDaySave({
+      day: current,
+      picked: parseCodes(shown.picked),
+      note: shown.note,
+      today: vnDateString(saveNow),
+      now: saveNow,
+    });
+    if (!result.ok) {
+      setMessage(result.message);
+      return;
+    }
+    if (result.ops.length === 0) {
+      onClose();
+      return;
+    }
+    // Also from the clock of the save, not the day the sheet was opened.
+    const label =
+      day === vnDateString(saveNow) ? "hôm nay" : formatDayShort(day);
+    void perform(result.ops, `Đã lưu triệu chứng ${label}`);
+  }
+
+  function onDelete() {
+    const date = formatDayShort(day);
+    if (!window.confirm(`Xóa triệu chứng ngày ${date}?`)) return;
+    void perform(symptomDayDelete(current), `Đã xóa triệu chứng ${date}`);
+  }
+
+  return (
+    <SymptomDaySheetView
+      title={
+        fixedDay === null
+          ? "Triệu chứng"
+          : `Triệu chứng · ${formatDayShort(fixedDay)}`
+      }
+      sub={fixedDay === null ? null : sub}
+      strip={
+        strip && {
+          label: strip.label,
+          days: strip.days,
+          selected: day,
+          // From the strip's own logs, also while "Khác" shows another day.
+          marked: strip.days
+            .filter(
+              (cell) =>
+                symptomDay(stripLogs.data ?? [], cell.day, () => true).logs
+                  .length > 0,
+            )
+            .map((cell) => cell.day),
+          scrollRef,
+          other: inStrip ? null : day,
+          min: baby.dob,
+          max: today,
+          onPick: (next) => {
+            setChosen(next);
+            setEdit(null);
+            setMessage(null);
+          },
+        }
+      }
+      status={status}
+      day={current}
+      picked={shown.picked}
+      note={shown.note}
+      ageDays={ageDays(baby.dob, openedAt)}
+      dirty={edit !== null}
+      saving={busy}
+      message={message}
+      deletable={
+        fixedDay !== null && status === "ready" && canDeleteDay(current)
+      }
+      onPicked={(picked) => setEdit({ ...shown, picked })}
+      onNote={(note) => setEdit({ ...shown, note })}
+      onSave={onSave}
+      onDelete={onDelete}
+      onClose={onClose}
+    />
+  );
+}
diff --git a/components/quick/SymptomFields.tsx b/components/quick/SymptomFields.tsx
deleted file mode 100644
index 3d7f159..0000000
--- a/components/quick/SymptomFields.tsx
+++ /dev/null
@@ -1,30 +0,0 @@
-import { QUICK_FIELDS, type QuickValues } from "@/lib/rules/quickEntry";
-import { parseCodes } from "@/lib/rules/symptomForm";
-import { FieldList } from "./FieldList";
-
-// Spec 2026-11-26 §3.5: a hint that counts the picked chips, then the same two
-// fields the edit sheet draws (the chips and the note).
-export function SymptomFields({
-  values,
-  onChange,
-  ageDays,
-}: {
-  values: QuickValues;
-  onChange: (next: QuickValues) => void;
-  ageDays: number | null;
-}) {
-  const count = parseCodes(values.codes).length;
-  return (
-    <>
-      <p className="text-[15px] text-muted">
-        {`Bấm những gì bé đang có.${count > 0 ? ` Đã chọn ${count}.` : ""}`}
-      </p>
-      <FieldList
-        fields={QUICK_FIELDS.symptom}
-        values={values}
-        onChange={onChange}
-        ageDays={ageDays}
-      />
-    </>
-  );
-}
diff --git a/lib/ui/scrollRow.ts b/lib/ui/scrollRow.ts
new file mode 100644
index 0000000..5a236e9
--- /dev/null
+++ b/lib/ui/scrollRow.ts
@@ -0,0 +1,38 @@
+// Spec 2026-11-27 §4.3: the scrollLeft that brings a cell of a horizontal row
+// into view while moving the row as little as possible. Positions are in the
+// row's content coordinates (0 = the row's first pixel). Only the row moves:
+// scrollIntoView would also scroll the sheet's <dialog> while its panel is
+// still sliding in, and the sheet would jump.
+export function nearestScrollLeft({
+  cellLeft,
+  cellWidth,
+  scrollLeft,
+  clientWidth,
+}: {
+  cellLeft: number;
+  cellWidth: number;
+  scrollLeft: number;
+  clientWidth: number;
+}): number {
+  if (cellLeft < scrollLeft) return cellLeft;
+  if (cellLeft + cellWidth > scrollLeft + clientWidth)
+    return cellLeft + cellWidth - clientWidth;
+  return scrollLeft;
+}
+
+// Moves `row` so its picked cell (aria-pressed="true") is in view. The cell's
+// left edge comes from the two boxes, so it does not depend on which ancestor
+// is the cell's offsetParent.
+export function keepPickedInView(row: HTMLElement | null): void {
+  const cell = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
+  if (!row || !cell) return;
+  row.scrollLeft = nearestScrollLeft({
+    cellLeft:
+      cell.getBoundingClientRect().left -
+      row.getBoundingClientRect().left +
+      row.scrollLeft,
+    cellWidth: cell.offsetWidth,
+    scrollLeft: row.scrollLeft,
+    clientWidth: row.clientWidth,
+  });
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  219 passed (219)`, `Tests  2109 passed (2109)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/quick/SymptomDaySheet.tsx components/quick/symptomdaysheet.test.tsx components/actions/QuickActions.tsx components/actions/quickactions.test.tsx components/home/QuickEntrySheet.tsx components/home/quickentry.test.tsx components/quick/symptoms.test.tsx components/quick/SymptomFields.tsx lib/ui/scrollRow.ts lib/ui/scrollRow.test.ts
git commit -m "feat(symptoms): the + sheet and the episode card open the day sheet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối plan B (không lên `main`)

**Files:**

- Modify: `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-b.md` (ghi kết quả, bằng script)

**Interfaces:**

- Consumes: mọi Produces của Task 1–3.
- Produces: nhánh `feat/kim-bun-trieu-chung-theo-ngay-b`; plan C cắt từ đây.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  219 passed (219)`, `Tests  2109 passed (2109)`.

- [x] **Step 2: Ghi kết quả vào plan, dừng**

Ghi ngay dưới bước này (bằng script): số đỏ và xanh của từng task có khớp plan không; kết quả Step 1. Đánh dấu `[x]` các bước đã làm. Không merge, không push: plan B lên `main` cùng plan C (Diễn giải spec mục 11). Báo cáo bằng tiếng Việt: `git log --oneline` của nhánh; số test; plan C chạy tiếp từ nhánh này.

**Kết quả (2026-11-27, phiên thực thi):**

- Step 0: `main` chưa có plan A (`git show main:lib/rules/symptomDay.ts` không có file), nên nhánh `feat/kim-bun-trieu-chung-theo-ngay-b` cắt từ `feat/kim-bun-trieu-chung-theo-ngay-a` @ `b8469e8`. Không chạy `git checkout main && git pull`. Baseline: `Test Files  216 passed (216)`, `Tests  2091 passed (2091)`.
- 6 patch trích bằng `kb_patch` đều `git apply` sạch, không sửa tay.
- Task 1: đỏ `1 failed | 215 passed (216)`, `1 failed | 2091 passed (2092)`, `tsc` báo `'locked' does not exist`; xanh `216 passed (216)`, `2092 passed (2092)`, `tsc` sạch. Khớp plan. Commit `85a5849`.
- Task 2: đỏ `1 failed | 216 passed (217)`, `2092 passed (2092)` (file mới đỏ lúc nạp); xanh `217 passed (217)`, `2105 passed (2105)`, `tsc` sạch. Khớp plan. Commit `f78c5ea`.
- Task 3: đỏ `4 failed | 215 passed (219)`, `4 failed | 2102 passed (2106)` (`lib/ui/scrollRow.test.ts` đỏ lúc nạp); xanh `219 passed (219)`, `2109 passed (2109)`, `tsc` sạch. Khớp plan. Commit `e845191`. Không còn chỗ nào nhắc `SymptomFields` trong `components`, `lib`, `app`.
- Step 1: `tsc --noEmit` thoát 0; `Test Files  219 passed (219)`, `Tests  2109 passed (2109)`. Khớp plan.
- Không build, không merge, không push. Plan C cắt từ `feat/kim-bun-trieu-chung-theo-ngay-b`; B lên `main` cùng C sau bước trình duyệt của C.
