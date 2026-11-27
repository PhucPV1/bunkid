# Kim Bun — Triệu chứng theo ngày, plan C: hàng ngày, Nhật ký, kiểm trình duyệt Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-27-kim-bun-trieu-chung-theo-ngay-design.md` (§5.1 phần chỗ mở; §6.1; §6.2 phần mở phiếu; §7 phần trình duyệt và checklist)

**Status:** approved 2026-11-27

**Goal:** Mỗi hàng của "Từng ngày" trên trang đợt ốm có nút "Sửa" hoặc "Ghi triệu chứng" mở phiếu của đúng ngày đó; bấm một bản ghi triệu chứng trong Nhật ký cũng mở phiếu đó. Kiểm cả plan B và C trong trình duyệt, thêm Bước 39 vào checklist, rồi hỏi để đưa A (nếu chưa), B, C lên `main`.

**Architecture:**

- **`EpisodeDayList`:** prop mới `onEdit(day)`; sau các chip là một nút nhỏ (`pencil` + "Sửa", hoặc `plus` + "Ghi triệu chứng"). Hàng tự nó vẫn không bấm được.
- **`EpisodeScreen`:** giữ ngày đang mở phiếu; `EpisodeBody` nhận `onEditDay`; mở `SymptomDaySheet` với `day` và dòng phụ "Ngày {n} của đợt ốm · cả ngày".
- **`lib/rules/history.ts`:** `historySheet(log)` cho biết hàng Nhật ký mở gì; `HistoryScreen` mở `SymptomDaySheet` (dòng phụ "Cả ngày") cho bản ghi triệu chứng, `LogEditSheet` cho loại khác.
- Không đổi dữ liệu, không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-trieu-chung-theo-ngay-c`, cắt từ `feat/kim-bun-trieu-chung-theo-ngay-b`. Baseline: 2109 test vitest xanh (219 file), typecheck sạch.

**Các plan của spec này:**

| Plan | Nội dung | File |
| --- | --- | --- |
| A | Luật thuần (§3), báo cáo theo ngày (§6.3), Nhật ký "Cả ngày" và thứ tự (§6.2), bỏ "Triệu chứng" khỏi "Ghi bù" (§4.1). Chưa có phiếu mới. | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-a.md` |
| B | Chip khóa (§5.3), phiếu `SymptomDaySheet` với dải ngày (§4, §5), "+" và thẻ đợt ốm mở phiếu mới (§4.1). | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-b.md` |
| C | Nút "Sửa"/"Ghi triệu chứng" ở "Từng ngày" (§6.1), Nhật ký mở phiếu của ngày (§6.2), kiểm trình duyệt cho cả B và C, Bước 39 của checklist (§7). | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-c.md` |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Nút của hàng ngày** cao 44 px (`min-h-11`), chữ 13 px đậm, nền `accent-tint`, chữ `accent-text`, icon 14 px; `aria-label` "Sửa triệu chứng ngày {dd/MM}" hoặc "Ghi triệu chứng ngày {dd/MM}". Ngày chưa có chip thì nút đứng một mình ở dòng chip.
2. **Số ngày của dòng phụ** tính bằng `episodeDay(episode.started_at, 12:00 của ngày đó)`.
3. **Quyền ở trang đợt ốm** viết là `isOwner || createdBy === userId` (trang này có `isOwner`, không có `member`); cùng luật với `canModifyLog`. Ở Nhật ký dùng `canModifyLog(member, createdBy)`.
4. **`EpisodeBody` nhận `onEditDay` không bắt buộc** (mặc định không làm gì) để trang fixture cũ và test cũ không phải đổi.
5. **Nhật ký mở phiếu theo `historySheet`**, một hàm thuần có test; `HistoryScreen` không có test bấm hàng (cần trạng thái), nên phần nối được xem trong trình duyệt.
6. **Checklist:** Bước 39 mới, 11 mục; mục 10 kiểm việc gộp qua "Lưu" (chủ mở một ngày có bản ghi của mình và của thành viên, thêm một chip, Lưu: Nhật ký còn một dòng, của chủ, mang mọi chip và ghi chú của thành viên). Không sửa Bước 38, chỉ ghi ở đầu Bước 39 rằng nó thay mục 1–4, 18 và 24 của Bước 38 ở những chỗ nói tới phiếu cũ.
7. **B và C lên `main` cùng nhau** sau bước trình duyệt (plan B không có bước trình duyệt riêng).

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 5** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 5 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `5b90853` cộng 10 patch của plan A và 6 patch của plan B trích từ các file plan đó; bản sao có `node_modules` riêng (`bun install --frozen-lockfile`). Trong bản chạy thử mỗi task code là hai commit (test trước, code sau). Số test đỏ và xanh là số đo thật trên cả bộ test; `tsc --noEmit` sạch sau mỗi commit code. `bun run build` thoát 0 ở trạng thái cuối của plan này (các lần đo lại: dừng một hay hai lần ở `SecurityFatalError`, có khi sau khi đã dựng 42/42, rồi thoát 0; lần đo cuối cùng: một lần dừng, lần hai thoát 0; `/dot-om/chi-tiet`, `/nhat-ky`, `/bao-cao` vẫn `○`). Trang fixture của Task 3 đã qua `tsc` trên bản sao đó. Sau lượt sửa theo reviewer, mọi patch của A, B, C được trích lại từ các file plan và áp lên một bản sao sạch của `5b90853`: áp sạch, số đo như ghi, cây cuối trùng bản chạy thử. **Chưa chạy khi viết plan:** mọi bước trình duyệt (không có số đo nào trong plan là số đo thật trên màn hình).
- **Không sửa patch bằng công cụ có prettier.** Một hook PostToolUse chạy prettier lên mọi file `.md` vừa được Edit/Write, và nó đổi các dòng trống trong khối `diff` (patch hỏng). Ghi kết quả vào file plan này bằng một script (ví dụ `python3` mở file, thay chuỗi, ghi lại), không bằng Edit/Write.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan.
- **Màu.** Không patch nào thêm token màu hay icon. `lib/themeGuard.test.ts` phải xanh.
- **`bun run build` và `bun run dev`** có thể dừng một hay vài lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 (`SecurityFatalError`, có khi in ra sau khi đã dựng xong 42 trang); chạy lại đúng lệnh tới khi thoát 0 (khi viết plan: nhiều nhất hai lần dừng). Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Spec và các file plan chưa được commit.** `git status` thấy spec `docs/blueprint/specs/2026-11-27-kim-bun-trieu-chung-theo-ngay-design.md` và ba file plan `…-trieu-chung-theo-ngay-{a,b,c}.md` là untracked. Không commit chúng trừ khi người dùng đồng ý (task cuối hỏi).
- **Lên `main` phải hỏi.** Bước cuối dừng lại hỏi người dùng trước khi push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

- **Trình duyệt.** Dùng khung Browser trong app (công cụ `mcp__Claude_Browser__*`), cỡ 375×812 (`resize_window` preset `mobile`). Theo ghi nhớ của người dùng, phải hỏi họ một câu trước khi dùng khung này cho localhost; nếu họ muốn Chrome thì dùng Chrome (bề ngang tối thiểu 455 px ở đó: đo ở 455 thay cho 375 và ghi rõ). Gọi `navigate` trước. Trang tạm vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt khi xong. Bấm theo `ref` của `find` trên trang thật. Lọc console bằng `onlyErrors`.
- **Chỉ xem trên trang thật.** Không bấm "Lưu", "Xóa triệu chứng ngày này", "Bắt đầu đợt ốm", "Bé đã khỏi"; được mở phiếu rồi đóng (phiếu chưa sửa gì thì đóng không hỏi).
- **Không chạy prettier lên `docs/device-checklist.md`.** File đó từ trước đã không theo prettier.

## Contracts with Other Plans

**Consumes (từ plan A, B):** `SymptomDaySheet`, `SymptomDaySheetView`, `DayStrip` (`components/quick/SymptomDaySheet.tsx`); `dayStrip`, `symptomDay`, `SymptomLog` (`lib/rules/symptomDay.ts`); `canModifyLog`, `HISTORY_FILTERS` và các hàm cũ của `lib/rules/history.ts`; `episodeDay` (`lib/rules/illness.ts`); `formatDayShort`, `addDays`.

**Produces:**

- `EpisodeDayList({ rows, onEdit })` với `onEdit: (day: string) => void` bắt buộc.
- `EpisodeBody` nhận `onEditDay?: (day: string) => void`.
- `lib/rules/history.ts`: `type HistorySheet<T> = { kind: "log"; log: T | null } | { kind: "symptoms"; day: string }`; `historySheet<T extends { type: string; started_at: string }>(log: T): HistorySheet<T>`.
- `docs/device-checklist.md`: Bước 39 (11 mục).
- **Vitest sau plan C:** 2113 test, 219 file.

---

### Task 1: Nút "Sửa" / "Ghi triệu chứng" ở "Từng ngày" (§6.1, §5.1)

**Files:**

- Modify: `components/illness/EpisodeDayList.tsx`, `components/illness/EpisodeScreen.tsx`
- Test: `components/illness/episodecards.test.tsx`, `components/illness/episodescreen.test.tsx`

**Interfaces:**

- Consumes: `SymptomDaySheet` (plan B), `episodeDay`, `formatDayShort`, `Icon`.
- Produces: `EpisodeDayList({ rows, onEdit })`; `EpisodeBody` với `onEditDay`; `EpisodeScreen` mở `SymptomDaySheet` cố định ngày.

- [ ] **Step 0: Kiểm plan B đã xong, rồi tạo nhánh**

```bash
git checkout feat/kim-bun-trieu-chung-theo-ngay-b
test -f components/quick/SymptomDaySheet.tsx && grep -q 'export function InstantSheet' components/actions/QuickActions.tsx && echo 'B xong'
git checkout -b feat/kim-bun-trieu-chung-theo-ngay-c
bunx vitest run   # Test Files  219 passed (219), Tests  2109 passed (2109)
```

- [ ] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/illness/episodecards.test.tsx b/components/illness/episodecards.test.tsx
index 9c7e826..169b4a0 100644
--- a/components/illness/episodecards.test.tsx
+++ b/components/illness/episodecards.test.tsx
@@ -146,17 +146,41 @@ describe("EpisodeDayList", () => {
       label: { text: "Sốt", tone: "warn" },
     },
   ];
-  const html = renderToStaticMarkup(<EpisodeDayList rows={rows} />);
+  const html = renderToStaticMarkup(
+    <EpisodeDayList rows={rows} onEdit={() => {}} />,
+  );
   const items = html.split("<li").slice(1);
 
-  it("a titled list with one row per day, none of them a link or a button", () => {
+  it("a titled list with one row per day; a row is no link, only its symptom button is a button", () => {
     expect(html).toContain(">Từng ngày</h2>");
     expect(items).toHaveLength(3);
     expect(html).not.toContain("<a ");
-    expect(html).not.toContain("<button");
+    expect(html.match(/<button/g)).toHaveLength(3);
     expect(html).not.toContain("truncate");
   });
 
+  // Spec 2026-11-27 §6.1 (board "Từng ngày · E").
+  it("a day with symptoms ends its chips with Sửa; a day without has Ghi triệu chứng", () => {
+    expect(items[1]).toMatch(
+      />Quấy<\/span><button type="button" aria-label="Sửa triệu chứng ngày 25\/11" class="[^"]*min-h-11[^"]*bg-accent-tint[^"]*text-accent-text[^"]*">/,
+    );
+    expect(items[1]).toContain(`d="${ICON_PATHS.pencil}"`);
+    expect(items[1]).toMatch(/<\/svg>Sửa<\/button>/);
+    expect(items[0]).toContain('aria-label="Ghi triệu chứng ngày 26/11"');
+    expect(items[0]).toContain(`d="${ICON_PATHS.plus}"`);
+    expect(items[0]).toMatch(/<\/svg>Ghi triệu chứng<\/button>/);
+  });
+
+  it("the button hands its day on", () => {
+    const onEdit = vi.fn();
+    const buttons = findElements(
+      EpisodeDayList({ rows, onEdit }),
+      (el) => el.type === "button",
+    );
+    (buttons[1].props.onClick as () => void)();
+    expect(onEdit).toHaveBeenCalledWith("2026-11-25");
+  });
+
   it("the label shares a line with the title only, so the line under it has the full width", () => {
     expect(items[1]).toMatch(
       />25\/11 · ngày 2<\/span><span class="[^"]*bg-danger-soft text-danger-ink[^"]*">Sốt cao<\/span><\/div>/,
@@ -169,6 +193,5 @@ describe("EpisodeDayList", () => {
     expect(items[1].match(/bg-line text-ink/g)).toHaveLength(3);
     expect(items[1]).toContain(">Quấy</span>");
     expect(items[0]).not.toContain("bg-line text-ink");
-    expect(items[0]).not.toContain("rounded-full");
   });
 });
diff --git a/components/illness/episodescreen.test.tsx b/components/illness/episodescreen.test.tsx
index 7e75675..2cb3461 100644
--- a/components/illness/episodescreen.test.tsx
+++ b/components/illness/episodescreen.test.tsx
@@ -403,6 +403,26 @@ describe("EpisodeBody", () => {
     (verdict.props.onLog as (type: string) => void)("symptom");
     expect(onLog).toHaveBeenCalledWith("symptom");
   });
+
+  // Spec 2026-11-27 §6.1.
+  it("hands the day on from the day list", () => {
+    const onEditDay = vi.fn();
+    const [list] = findElements(
+      EpisodeBody({
+        episode: open,
+        logs: LOGS,
+        babyName: "Bun",
+        now: NOW,
+        closing: false,
+        onLog: () => {},
+        onClose: () => {},
+        onEditDay,
+      }),
+      (el) => "rows" in el.props && "onEdit" in el.props,
+    );
+    (list.props.onEdit as (day: string) => void)("2026-11-25");
+    expect(onEditDay).toHaveBeenCalledWith("2026-11-25");
+  });
 });
 
 // Spec §6.1.
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 217 passed (219)`, `Tests  4 failed | 2108 passed (2112)`. `tsc` báo `onEdit` và `onEditDay` chưa có.

- [ ] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/illness/EpisodeDayList.tsx b/components/illness/EpisodeDayList.tsx
index f451419..f16f8ee 100644
--- a/components/illness/EpisodeDayList.tsx
+++ b/components/illness/EpisodeDayList.tsx
@@ -1,39 +1,61 @@
+import { Icon } from "@/components/ui/Icon";
 import { StatusChip } from "@/components/ui/StatusChip";
+import { formatDayShort } from "@/lib/rules/days";
 import type { DayRowView } from "@/lib/rules/illnessView";
 
 // Spec 2026-11-26 §6.3 item 4: one row per day of the episode, newest first.
-// The rows open nothing. The label sits beside the title only, so the line
-// under it keeps the full width of the row.
-export function EpisodeDayList({ rows }: { rows: DayRowView[] }) {
+// The label sits beside the title only, so the line under it keeps the full
+// width of the row. Spec 2026-11-27 §6.1 (board E): the row itself opens
+// nothing; a small button after the symptom chips opens the day's symptom
+// sheet: "Sửa" when the day has symptoms, else "Ghi triệu chứng".
+export function EpisodeDayList({
+  rows,
+  onEdit,
+}: {
+  rows: DayRowView[];
+  onEdit: (day: string) => void;
+}) {
   return (
     <section className="flex flex-col gap-2.5">
       <h2 className="mx-1 text-xl font-bold text-ink">Từng ngày</h2>
       <ul className="glass overflow-hidden rounded-[26px]">
-        {rows.map((row) => (
-          <li
-            key={row.day}
-            className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0"
-          >
-            <div className="flex items-start gap-2">
-              <span className="flex-1 text-base font-semibold text-ink">
-                {row.title}
-              </span>
-              {row.label && (
-                <StatusChip tone={row.label.tone}>{row.label.text}</StatusChip>
-              )}
-            </div>
-            <span className="text-[15px] text-ink">{row.detail}</span>
-            {row.chips.length > 0 && (
-              <div className="flex flex-wrap gap-1.5">
+        {rows.map((row) => {
+          const logged = row.chips.length > 0;
+          return (
+            <li
+              key={row.day}
+              className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0"
+            >
+              <div className="flex items-start gap-2">
+                <span className="flex-1 text-base font-semibold text-ink">
+                  {row.title}
+                </span>
+                {row.label && (
+                  <StatusChip tone={row.label.tone}>
+                    {row.label.text}
+                  </StatusChip>
+                )}
+              </div>
+              <span className="text-[15px] text-ink">{row.detail}</span>
+              <div className="flex flex-wrap items-center gap-1.5">
                 {row.chips.map((chip) => (
                   <StatusChip key={chip} tone="neutral">
                     {chip}
                   </StatusChip>
                 ))}
+                <button
+                  type="button"
+                  aria-label={`${logged ? "Sửa" : "Ghi"} triệu chứng ngày ${formatDayShort(row.day)}`}
+                  onClick={() => onEdit(row.day)}
+                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-accent-tint px-3 text-[13px] font-semibold text-accent-text"
+                >
+                  <Icon name={logged ? "pencil" : "plus"} size={14} />
+                  {logged ? "Sửa" : "Ghi triệu chứng"}
+                </button>
               </div>
-            )}
-          </li>
-        ))}
+            </li>
+          );
+        })}
       </ul>
     </section>
   );
diff --git a/components/illness/EpisodeScreen.tsx b/components/illness/EpisodeScreen.tsx
index 06796c6..d990611 100644
--- a/components/illness/EpisodeScreen.tsx
+++ b/components/illness/EpisodeScreen.tsx
@@ -4,6 +4,7 @@ import Link from "next/link";
 import { useRouter } from "next/navigation";
 import { type ReactNode, useState } from "react";
 import { useQuickActions } from "@/components/actions/QuickActions";
+import { SymptomDaySheet } from "@/components/quick/SymptomDaySheet";
 import { Button, buttonClass } from "@/components/ui/Button";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { ErrorCard } from "@/components/ui/ErrorCard";
@@ -22,6 +23,7 @@ import type { LogLike } from "@/lib/rules/describeLog";
 import {
   detailRange,
   type EpisodeLike,
+  episodeDay,
   feverChartModel,
 } from "@/lib/rules/illness";
 import { planClose } from "@/lib/rules/illnessForm";
@@ -59,6 +61,7 @@ export function EpisodeBody({
   visitTimes = [],
   onLog,
   onClose,
+  onEditDay = () => {},
 }: {
   episode: EpisodeLike;
   logs: LogLike[];
@@ -72,6 +75,8 @@ export function EpisodeBody({
   visitTimes?: number[];
   onLog: (type: QuickLogType) => void;
   onClose: () => void;
+  // Spec 2026-11-27 §6.1: "Sửa" or "Ghi triệu chứng" on a day's row.
+  onEditDay?: (day: string) => void;
 }) {
   return (
     <>
@@ -80,7 +85,7 @@ export function EpisodeBody({
         onLog={onLog}
       />
       <FeverChartCard chart={feverChartModel(logs, episode, now, visitTimes)} />
-      <EpisodeDayList rows={dayRows(logs, episode, now)} />
+      <EpisodeDayList rows={dayRows(logs, episode, now)} onEdit={onEditDay} />
       <EpisodeUsual view={usualView(logs, episode, now)} />
       {visits}
       {/* Spec §6.3 item 7: the report of this episode (§9), then, while it
@@ -125,6 +130,8 @@ export function EpisodeScreen({
   const actions = useEpisodeActions(baby.id, userId);
   const visits = useVisits(baby.id);
   const [editing, setEditing] = useState(false);
+  // Spec 2026-11-27 §5.1: the day whose symptom sheet is open.
+  const [symptomDay, setSymptomDay] = useState<string | null>(null);
 
   const all = episodes.data ?? [];
   const episode = all.find((item) => item.id === id) ?? null;
@@ -213,6 +220,17 @@ export function EpisodeScreen({
           }
           onLog={quick.openInstant}
           onClose={close}
+          onEditDay={setSymptomDay}
+        />
+      )}
+      {symptomDay && episode && (
+        <SymptomDaySheet
+          baby={baby}
+          userId={userId}
+          canModify={(createdBy) => isOwner || createdBy === userId}
+          day={symptomDay}
+          sub={`Ngày ${episodeDay(episode.started_at, new Date(`${symptomDay}T12:00:00+07:00`))} của đợt ốm · cả ngày`}
+          onClose={() => setSymptomDay(null)}
         />
       )}
       {editing && episode && (
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  219 passed (219)`, `Tests  2112 passed (2112)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/illness/EpisodeDayList.tsx components/illness/EpisodeScreen.tsx components/illness/episodecards.test.tsx components/illness/episodescreen.test.tsx
git commit -m "feat(illness): each day of an episode opens its symptoms" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Nhật ký mở phiếu của ngày (§6.2)

**Files:**

- Modify: `lib/rules/history.ts`, `components/history/HistoryScreen.tsx`
- Test: `lib/rules/history.test.ts`

**Interfaces:**

- Consumes: `SymptomDaySheet` (plan B), `canModifyLog`, `vnDateString`.
- Produces: `HistorySheet<T>`, `historySheet(log)`; `HistoryScreen` mở `SymptomDaySheet` với `sub="Cả ngày"` cho bản ghi triệu chứng; "Ghi bù" mở `LogEditSheet` như cũ.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/rules/history.test.ts b/lib/rules/history.test.ts
index 6639ba5..afcd757 100644
--- a/lib/rules/history.test.ts
+++ b/lib/rules/history.test.ts
@@ -6,6 +6,7 @@ import {
   groupByVnDay,
   HISTORY_FILTERS,
   historyPageRange,
+  historySheet,
   logTimeText,
   matchesFilter,
   nextHistoryPage,
@@ -83,6 +84,24 @@ describe("history", () => {
     expect(logTimeText({ type: "bottle", started_at: at })).toBe("12:00");
   });
 
+  it("spec 2026-11-27 §6.2: a symptom row opens its day's sheet, any other row its edit sheet", () => {
+    const symptom = {
+      id: "y",
+      type: "symptom",
+      started_at: "2026-11-13T17:30:00Z", // 00:30 on 14/11
+    };
+    expect(historySheet(symptom)).toEqual({
+      kind: "symptoms",
+      day: "2026-11-14",
+    });
+    const bottle = {
+      id: "f",
+      type: "bottle",
+      started_at: "2026-11-14T02:00:00Z",
+    };
+    expect(historySheet(bottle)).toEqual({ kind: "log", log: bottle });
+  });
+
   it("historyPageRange covers 7 VN days per page", () => {
     expect(historyPageRange(now, 0)).toEqual({
       fromDay: "2026-11-08",
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 218 passed (219)`, `Tests  1 failed | 2112 passed (2113)`.

- [ ] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/history/HistoryScreen.tsx b/components/history/HistoryScreen.tsx
index 603e15f..c137786 100644
--- a/components/history/HistoryScreen.tsx
+++ b/components/history/HistoryScreen.tsx
@@ -1,13 +1,8 @@
 "use client";
 
-import {
-  memo,
-  useCallback,
-  useDeferredValue,
-  useMemo,
-  useState,
-} from "react";
+import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
 import { useQuickActions } from "@/components/actions/QuickActions";
+import { SymptomDaySheet } from "@/components/quick/SymptomDaySheet";
 import { Button } from "@/components/ui/Button";
 import { ChipGroup } from "@/components/ui/ChipGroup";
 import { EmptyState } from "@/components/ui/EmptyState";
@@ -28,6 +23,8 @@ import {
   firstScreen,
   groupByVnDay,
   HISTORY_FILTERS,
+  historySheet,
+  type HistorySheet,
   matchesFilter,
   type HistoryFilter,
 } from "@/lib/rules/history";
@@ -36,7 +33,7 @@ import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
 import { HistoryList } from "./HistoryList";
 import { LogEditSheet } from "./LogEditSheet";
 
-type SheetState = { log: LogRow | null } | null;
+type SheetState = HistorySheet<LogRow> | null;
 
 // Skips re-rendering a week of rows when only the query state, the outbox or
 // the quick-actions context changed.
@@ -111,13 +108,17 @@ export function HistoryScreen({
       members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó",
     [members.data],
   );
-  const openLog = useCallback((log: LogRow) => setSheet({ log }), []);
+  const openLog = useCallback((log: LogRow) => setSheet(historySheet(log)), []);
 
   return (
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title="Nhật ký"
-        action={<BackfillButton onClick={() => setSheet({ log: null })} />}
+        action={
+          <BackfillButton
+            onClick={() => setSheet({ kind: "log", log: null })}
+          />
+        }
       />
 
       <ChipGroup
@@ -182,7 +183,17 @@ export function HistoryScreen({
         </Button>
       )}
 
-      {sheet && (
+      {sheet?.kind === "symptoms" && (
+        <SymptomDaySheet
+          baby={baby}
+          userId={userId}
+          canModify={(createdBy) => canModifyLog(member, createdBy)}
+          day={sheet.day}
+          sub="Cả ngày"
+          onClose={() => setSheet(null)}
+        />
+      )}
+      {sheet?.kind === "log" && (
         <LogEditSheet
           babyId={baby.id}
           userId={userId}
diff --git a/lib/rules/history.ts b/lib/rules/history.ts
index 0a3ce05..4f1c201 100644
--- a/lib/rules/history.ts
+++ b/lib/rules/history.ts
@@ -70,6 +70,19 @@ export function groupByVnDay<T extends { started_at: string; type?: string }>(
   return groups;
 }
 
+// Spec 2026-11-27 §6.2: what a tap on a row of Nhật ký opens: the sheet of
+// the log's day for a symptom log, the edit sheet for any other log.
+export type HistorySheet<T> =
+  { kind: "log"; log: T | null } | { kind: "symptoms"; day: string };
+
+export function historySheet<T extends { type: string; started_at: string }>(
+  log: T,
+): HistorySheet<T> {
+  return log.type === "symptom"
+    ? { kind: "symptoms", day: vnDateString(new Date(log.started_at)) }
+    : { kind: "log", log };
+}
+
 // Spec 2026-11-27 §6.2: the time of a row in Nhật ký and "Gần đây"; a
 // symptom log is for the whole day.
 export function logTimeText(log: { type: string; started_at: string }): string {
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  219 passed (219)`, `Tests  2113 passed (2113)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/history.ts lib/rules/history.test.ts components/history/HistoryScreen.tsx
git commit -m "feat(history): a symptom row opens the sheet of its day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối B và C, trình duyệt, checklist, rồi hỏi trước khi lên `main`

**Files:**

- Create rồi xóa (không commit): `app/fixture-symptom-day/page.tsx`
- Modify: `docs/device-checklist.md` (Bước 39), `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-c.md` (ghi kết quả, bằng script)

**Interfaces:**

- Consumes: mọi Produces của plan A, B và Task 1–2.
- Produces: Bước 39 của checklist; nhánh sẵn sàng lên `main`.

- [ ] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  219 passed (219)`, `Tests  2113 passed (2113)`.

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: thoát 0, `Generating static pages … (42/42)`; `/dot-om/chi-tiet`, `/nhat-ky`, `/bao-cao` vẫn `○`. Có thể dừng ở `SecurityFatalError`: chạy lại đúng lệnh đó tới khi thoát 0.

- [ ] **Step 3: Tạo trang fixture tạm**

Dữ liệu thật của gia đình không có đủ trạng thái (ngày có chip người khác ghi, ngày cũ đã ghi) và không được lưu thử trên đó, nên phiếu xem đủ ở đây. Trang vẽ `SymptomDaySheetView` thật với dữ liệu giả, cuộn dải tới cuối và giữ ô đang chọn trong khung bằng cùng hai effect như `SymptomDaySheet` (`keepPickedInView`) (nên `atEnd` trên trang tạm chỉ cho thấy bố cục; cuộn của code thật được đo ở mục 11 trên trang thật) (ngày tính từ hôm nay; đợt ốm giả mở từ 3 hôm trước 20:10; bé 80 ngày tuổi), chip và ghi chú bấm được, Lưu và Xóa không làm gì. `?view=` chọn trạng thái: không có (dải của đợt, đang ở hôm qua có "Sổ mũi, Ho"), `week` (không đợt, 7 ngày, hôm nay trống), `other` (ngày ngoài dải, 12 hôm trước), `empty` (không bản ghi nào), `fixed` (ngày cố định hôm qua, có nút xóa), `locked` (thành viên, hôm nay có "Sốt" của người khác kèm ghi chú "bà ghi"), `owner` (chủ, cùng ngày: không khóa, có nút xóa), `loading`, `error`, `message` (lời báo dưới cùng), `rows` (ba hàng của "Từng ngày"). Tạo `app/fixture-symptom-day/page.tsx` (không commit):

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { EpisodeDayList } from "@/components/illness/EpisodeDayList";
import { SymptomDaySheetView } from "@/components/quick/SymptomDaySheet";
import { addDays, formatDayShort } from "@/lib/rules/days";
import { dayStrip, symptomDay, type SymptomLog } from "@/lib/rules/symptomDay";
import { vnDateString } from "@/lib/rules/time";
import { keepPickedInView } from "@/lib/ui/scrollRow";

// Dữ liệu giả, không đọc hay ghi gì của gia đình. Ngày tính từ hôm nay.
const TODAY = vnDateString(new Date());
const DAY = (n: number) => addDays(TODAY, n);
const noon = (day: string) => new Date(`${day}T12:00:00+07:00`).toISOString();
const log = (
  id: string,
  day: string,
  details: unknown,
  by = "me",
): SymptomLog => ({
  id,
  type: "symptom",
  started_at: noon(day),
  ended_at: noon(day),
  details,
  note: null,
  created_by: by,
});
const LOGS = [
  log("a", DAY(-2), { codes: ["fever", "runny_nose"] }),
  log("b", DAY(-1), {
    codes: ["runny_nose", "cough"],
    note: "Ho nhiều về đêm",
  }),
  log("c", DAY(0), { codes: ["fever"], note: "bà ghi" }, "ba"),
];
const mine = (by: string) => by === "me";
const EPISODE = {
  id: "e",
  started_at: new Date(`${DAY(-3)}T20:10:00+07:00`).toISOString(),
  ended_at: null,
};
const DOB = DAY(-80);

function Fixture() {
  const view = useSearchParams().get("view") ?? "strip";
  const episode = view === "week" ? null : EPISODE;
  const strip = dayStrip({ episode, today: TODAY, dob: DOB });
  const start =
    view === "other"
      ? DAY(-12)
      : ["week", "empty", "locked", "owner"].includes(view)
        ? DAY(0)
        : DAY(-1);
  const [chosen, setChosen] = useState(start);
  const day = symptomDay(
    view === "empty" ? [] : LOGS,
    chosen,
    view === "owner" ? () => true : mine,
  );
  const [edit, setEdit] = useState<{ picked: string; note: string } | null>(
    null,
  );
  const shown = edit ?? { picked: day.codes.join(","), note: day.ownNote };
  const fixed = view === "fixed" || view === "locked" || view === "owner";
  // Like SymptomDaySheet: scroll the strip to its end once the dialog is
  // open, then keep the picked cell in view by moving the row only.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = scrollRef.current;
    if (row) row.scrollLeft = row.scrollWidth;
    keepPickedInView(row);
  }, [view]);
  useEffect(() => keepPickedInView(scrollRef.current), [chosen]);

  if (view === "rows")
    return (
      <main className="mx-auto max-w-md px-4 py-4">
        <EpisodeDayList
          onEdit={() => {}}
          rows={[
            {
              day: DAY(0),
              title: "Hôm nay · ngày 4",
              detail: "Cao nhất 37,4°C · không dùng thuốc",
              chips: [],
              label: { text: "Hết sốt", tone: "good" },
            },
            {
              day: DAY(-1),
              title: `${formatDayShort(DAY(-1))} · ngày 3`,
              detail: "Cao nhất 38,4°C · 1 liều hạ sốt",
              chips: ["Sổ mũi", "Ho"],
              label: { text: "Sốt", tone: "warn" },
            },
            {
              day: DAY(-2),
              title: `${formatDayShort(DAY(-2))} · ngày 2`,
              detail: "Cao nhất 39,2°C · 3 liều hạ sốt",
              chips: ["Sốt", "Sổ mũi", "Ho", "Khò khè", "Tiêu chảy", "Quấy"],
              label: { text: "Sốt cao", tone: "danger" },
            },
          ]}
        />
      </main>
    );

  return (
    <SymptomDaySheetView
      title={fixed ? `Triệu chứng · ${formatDayShort(chosen)}` : "Triệu chứng"}
      sub={fixed ? "Ngày 3 của đợt ốm · cả ngày" : null}
      strip={
        fixed
          ? null
          : {
              label: strip.label,
              days: strip.days,
              selected: chosen,
              marked: strip.days
                .filter(
                  (cell) =>
                    symptomDay(LOGS, cell.day, () => true).logs.length > 0,
                )
                .map((cell) => cell.day),
              other: strip.days.some((cell) => cell.day === chosen)
                ? null
                : chosen,
              scrollRef,
              min: DOB,
              max: TODAY,
              onPick: (next) => {
                setChosen(next);
                setEdit(null);
              },
            }
      }
      status={
        view === "loading" ? "loading" : view === "error" ? "error" : "ready"
      }
      day={day}
      picked={shown.picked}
      note={shown.note}
      ageDays={80}
      dirty={edit !== null}
      saving={false}
      message={view === "message" ? "Ghi chú dài quá 200 ký tự" : null}
      deletable={view === "fixed" || view === "owner"}
      onPicked={(picked) => setEdit({ ...shown, picked })}
      onNote={(note) => setEdit({ ...shown, note })}
      onSave={() => {}}
      onDelete={() => {}}
      onClose={() => {}}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <Fixture />
    </Suspense>
  );
}
```

Run: `bun run typecheck`
Expected: `tsc --noEmit` không báo lỗi.

- [ ] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở các trang dưới ở 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trước khi chụp. Mỗi mục chạy đoạn đo dưới (trên trang có phiếu) và ghi số:

```js
const strip = document.querySelector('[aria-label="Ngày nào?"]');
const dialog = document.querySelector("dialog[open]");
JSON.stringify({
  width: innerWidth,
  pageOverflow: document.documentElement.scrollWidth > innerWidth,
  cells: strip
    ? [...strip.children].map((cell) => {
        const box = cell.getBoundingClientRect();
        return [Math.round(box.width), Math.round(box.height), cell.innerText.replace(/\n/g, " ")];
      })
    : null,
  atEnd: strip ? Math.abs(strip.scrollLeft + strip.clientWidth - strip.scrollWidth) < 2 : null,
  cut: dialog
    ? [...dialog.querySelectorAll("button, span, p")].filter(
        (el) => el.scrollWidth > el.clientWidth + 1 && !el.closest('[aria-label="Ngày nào?"]'),
      ).map((el) => el.textContent)
    : [],
  smallTargets: dialog
    ? [...dialog.querySelectorAll("button, label")].filter((el) => el.getBoundingClientRect().height < 44).map((el) => el.textContent)
    : [],
});
```

Trên trang tạm `http://localhost:3000/fixture-symptom-day`, theme `rose`:

1. Không `view`. Kỳ vọng: phiếu "Triệu chứng" có icon nhịp tim; nhãn "Ngày nào? · đợt ốm từ {dd/mm của 3 hôm trước}"; năm ô 64×64 trở lên ("Ngày 1", "Ngày 2", "Ngày 3", "Hôm nay", "Khác") và dải đã cuộn tới cuối (`atEnd` true; nếu dải không cần cuộn ở 375 thì cũng true); ô "Ngày 3" (hôm qua) nền đậm; ô "Ngày 2", "Ngày 3", "Hôm nay" có chấm; dòng nền hồng "Ngày này đã ghi Sổ mũi, Ho. Bấm để thêm hoặc bỏ rồi Lưu."; "✓ Sổ mũi", "✓ Ho" bật; ô ghi chú có "Ho nhiều về đêm"; `pageOverflow` false; `cut` rỗng; `smallTargets` rỗng.
2. Bấm ô "Hôm nay". Kỳ vọng: chip "Sốt" bật và mờ (người khác ghi), dòng "Chip mờ do người khác ghi, chỉ họ hoặc chủ gia đình bỏ được.", ô ghi chú mờ với "Bật ít nhất một triệu chứng để ghi chú.", dòng "Người khác ghi: bà ghi". Bấm "Sốt": không tắt. Bấm "Ho": ô ghi chú hết mờ.
3. `?view=week`. Kỳ vọng: nhãn "Ngày nào?"; tám ô (bảy ngày, "Hôm qua" và "Hôm nay" là hai ô cuối trước "Khác"); dải cuộn tới cuối, ô "Hôm nay" nền đậm; dòng "Bấm những gì bé có trong ngày."; "Lưu" mờ.
4. `?view=other`. Kỳ vọng: ô "Khác" nền đậm, dòng dưới là dd/mm của 12 hôm trước; không ô nào khác nền đậm. Chạm ô "Khác" (theo `ref`): bảng chọn ngày của trình duyệt mở (trên khung Browser có thể không có bánh xe như iOS: ghi điều thấy được).
5. `?view=fixed`. Kỳ vọng: tiêu đề "Triệu chứng · {dd/mm hôm qua}", dòng "Ngày 3 của đợt ốm · cả ngày", không có dải; dưới "Lưu" là nút chữ đỏ "Xóa triệu chứng ngày này", cao ≥ 44 px.
6. `?view=locked` và `?view=owner`. Kỳ vọng: `locked` không có nút xóa; `owner` có nút xóa, chip "Sốt" không mờ, ghi chú "bà ghi" ở trong ô.
7. `?view=loading`, `?view=error`, `?view=message`. Kỳ vọng: "Đang tải…" / "Không tải được triệu chứng đã ghi" (chữ đỏ), không chip, không ô ghi chú, "Lưu" mờ; `message`: dòng đỏ "Ghi chú dài quá 200 ký tự" ngay trên "Lưu".
8. `?view=rows`. Kỳ vọng: hàng "Hôm nay · ngày 4" có nút "+ Ghi triệu chứng" (icon dấu cộng); hai hàng kia có chip rồi nút "Sửa" (icon bút chì) cùng dòng chip, hàng sáu chip xuống dòng gọn; mọi nút cao 44 px; hàng tự nó không phải nút; không chữ nào bị cắt.
9. Lặp mục 1, 2 và 8 ở 390 và 440 px. Kỳ vọng: như trên, không tràn.
10. Đặt `document.documentElement.dataset.theme` lần lượt `night`, `dark`, `light`, `peach`, `lavender`, `sea` ở mục 1, 2 và 8. Kỳ vọng: ô đang chọn khác ô thường cả ở nền lẫn màu chữ (ở `night`: nền đậm, chữ sáng); chấm thấy được; chip mờ khác chip bật thường; nút "Sửa" đọc được.

Trang thật (dữ liệu thật của gia đình: **chỉ xem**; cần đăng nhập trong khung Browser):

11. `http://localhost:3000/` → "+" → nhóm "Khác" → "Triệu chứng". Kỳ vọng: phiếu mới có dải ngày (7 ngày nếu gia đình không có đợt ốm đang mở), không có "Lúc nào?"; đoạn đo như mục 3, và `atEnd` true (đây là lần đo cuộn của `SymptomDaySheet` thật: effect chạy sau `showModal()`). Nhìn lúc phiếu trượt lên: phiếu không giật lên xuống. Nếu dải dài hơn khung: cuộn hàng về đầu rồi bấm ô cuối cùng đang bị che một phần; kỳ vọng hàng chỉ dịch vừa đủ cho ô hiện hết, phiếu (cuộn dọc của `<dialog>`) không đổi chỗ. Đóng phiếu (không chọn gì nên đóng không hỏi). Không bấm "Lưu".
12. `/nhat-ky`: nếu có bản ghi triệu chứng trong 7 ngày, dòng của nó ghi "Cả ngày" và đứng đầu ngày; bấm vào mở phiếu "Triệu chứng · dd/mm" với dòng "Cả ngày" (đóng, không lưu, không xóa). Bấm "Ghi bù": ô "Loại" không có "Triệu chứng" (đóng phiếu). Không có bản ghi triệu chứng thì ghi "chưa kiểm" cho phần đó.
13. `/bao-cao`: nếu kỳ 7 ngày có triệu chứng, đầu cột là "Ngày" và mỗi ngày một hàng. `/dot-om`: nếu gia đình có đợt ốm, trang chi tiết có nút "Sửa"/"Ghi triệu chứng" ở mỗi hàng ngày; bấm một nút mở phiếu cố định ngày (đóng, không lưu). Không có thì "chưa kiểm".
14. Console (lọc `onlyErrors`): không lỗi trên các trang thật đã mở.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này (bằng script), kèm số đo; mục nào thấy trên trang thật, mục nào chỉ trên trang tạm; mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), ghi vào plan, rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

- [ ] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-symptom-day
git status --short   # không còn app/fixture-symptom-day
```

- [ ] **Step 6: Bước 39 của checklist (Patch 5), commit**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index 4202cb8..d667b57 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -691,3 +691,27 @@ Kết quả: Chờ người dùng.
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 39 — Triệu chứng theo ngày (spec 2026-11-27)
+
+Bước này thay mục 1–4, 18 và 24 của Bước 38 ở những chỗ nói tới phiếu "Triệu chứng" cũ (chip "Lúc nào?", toast có "Hoàn tác", phiếu "Bản ghi" của Nhật ký): phiếu đó không còn. Mục 2–5 tạo một bản ghi Triệu chứng thử cho hôm qua; mục 6–10 tạo một đợt ốm thử và hai bản ghi Triệu chứng thử cho hôm nay (một của chủ, một của thành viên; mục 10 gộp chúng làm một), cần hai máy cùng gia đình: máy A đăng nhập bằng tài khoản chủ, máy B bằng một thành viên không phải chủ; mục 11 xóa hết.
+
+1. Máy A, bé không có đợt ốm nào đang mở. Bấm "+", nhóm "Khác", "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có nhãn "Ngày nào?" và một dải ô vuông: năm ô thứ ("T2"…"CN"), "Hôm qua", "Hôm nay", rồi ô "Khác" có icon lịch; dải đã cuộn sẵn tới cuối, ô "Hôm nay" nền đậm; không có "Lúc nào?". Dòng "Bấm những gì bé có trong ngày."; ô ghi chú mờ, dưới ô có dòng "Bật ít nhất một triệu chứng để ghi chú."; nút "Lưu" mờ. Không chữ nào bị cắt.
+2. Bấm ô "Hôm qua", chọn "Ho", gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: phiếu đóng, toast "Đã lưu triệu chứng {dd/mm của hôm qua}", không có nút "Hoàn tác". Tab Nhật ký, ngày hôm qua: dòng "Triệu chứng: Ho · thử" đứng đầu ngày, chỗ giờ ghi "Cả ngày".
+3. Bấm "+" → "Triệu chứng" lần nữa. Kỳ vọng: ô "Hôm qua" có một chấm nhỏ. Bấm ô "Hôm qua". Kỳ vọng: chip "Ho" bật sẵn, ô ghi chú có "thử", dòng nền hồng "Ngày này đã ghi Ho. Bấm để thêm hoặc bỏ rồi Lưu.". Chọn thêm "Sổ mũi", bấm "Lưu". Kỳ vọng: ở Nhật ký ngày hôm qua vẫn chỉ một dòng triệu chứng, nay là "Triệu chứng: Sổ mũi, Ho · thử".
+4. Bấm "+" → "Triệu chứng", chạm ô "Khác". Kỳ vọng: bánh xe chọn ngày của iOS mở ra; không chọn được ngày sau hôm nay. Chọn ngày cách đây 10 ngày, bấm "Xong". Kỳ vọng: ô "Khác" nền đậm, dòng dưới đổi thành ngày đó (dd/mm); không ô ngày nào khác nền đậm. Đóng phiếu (không lưu).
+5. Nhật ký, bấm dòng triệu chứng của hôm qua. Kỳ vọng: phiếu "Triệu chứng · {dd/mm}" với dòng "Cả ngày", không có dải ngày; dưới "Lưu" có nút chữ đỏ "Xóa triệu chứng ngày này". Đóng phiếu. Bấm "Ghi bù". Kỳ vọng: ô "Loại" không còn "Triệu chứng". Đóng phiếu.
+6. Máy A: Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Kỳ vọng: ở "Từng ngày", hàng "Hôm nay · ngày 1" có nút nhỏ "+ Ghi triệu chứng". Bấm nút đó. Kỳ vọng: phiếu "Triệu chứng · {dd/mm}" với dòng "Ngày 1 của đợt ốm · cả ngày", không có dải ngày, không có nút xóa. Chọn "Sốt", bấm "Lưu". Kỳ vọng: hàng có chip "Sốt" và ngay sau là nút "Sửa" có hình bút chì; hàng tự nó không bấm được.
+7. Trong thẻ trên cùng bấm "Triệu chứng". Kỳ vọng: nhãn "Ngày nào? · đợt ốm từ {dd/mm}" và một ô "Hôm nay" có chấm, cộng ô "Khác". Đóng phiếu.
+8. Máy B (thành viên), trang chi tiết của đợt vừa mở, chờ tối đa 2 phút cho thấy chip "Sốt". Bấm "Sửa" ở hàng hôm nay. Kỳ vọng: chip "Sốt" bật nhưng mờ, chạm vào không tắt; dưới các chip có dòng "Chip mờ do người khác ghi, chỉ họ hoặc chủ gia đình bỏ được."; ô ghi chú mờ; không có nút xóa. Bật "Ho", gõ "máy B", bấm "Lưu". Kỳ vọng: hàng hôm nay có "Sốt" và "Ho". Máy A (sau tối đa 30 giây) cũng thấy hai chip đó. Máy A bấm "Báo cáo cho bác sĩ". Kỳ vọng: bảng "Triệu chứng" có cột đầu tên "Ngày", một hàng cho hôm nay với "Sốt, Ho" và ghi chú "máy B".
+9. Máy A bật Ban đêm, mở "+" → "Triệu chứng". Kỳ vọng: ô đang chọn của dải khác hẳn các ô khác (nền đậm, chữ sáng); chấm của ô "Hôm qua" vẫn thấy. Mở "Sửa" ở hàng hôm nay trên máy B khi bật Ban đêm. Kỳ vọng: chip mờ vẫn phân biệt được với chip thường. Tắt Ban đêm.
+10. Máy A (chủ) mở "Sửa" ở hàng hôm nay. Kỳ vọng: "Sốt" và "Ho" đều bật, không chip nào mờ (chủ sửa được mọi bản ghi); ô ghi chú có "máy B"; có nút "Xóa triệu chứng ngày này". Bật thêm "Quấy", bấm "Lưu". Kỳ vọng: toast "Đã lưu triệu chứng hôm nay"; hàng hôm nay có "Sốt", "Ho", "Quấy". Tab Nhật ký, hôm nay: chỉ còn **một** dòng triệu chứng, "Triệu chứng: Sốt, Ho, Quấy · máy B", người ghi là người của máy A (bản ghi của máy B đã gộp vào bản ghi cũ hơn của máy A rồi bị xóa). Máy B (sau tối đa 30 giây) mở "Sửa" ở hàng hôm nay. Kỳ vọng: cả ba chip đều mờ, ô ghi chú mờ, không có nút xóa. Đóng phiếu.
+11. Dọn: máy A mở "Sửa" ở hàng hôm nay, bấm "Xóa triệu chứng ngày này". Kỳ vọng: hỏi lại "Xóa triệu chứng ngày {dd/mm}?"; đồng ý thì toast "Đã xóa triệu chứng {dd/mm}", hàng trở lại "+ Ghi triệu chứng". Bút chì → "Xóa đợt ốm". Nhật ký: bấm dòng triệu chứng của hôm qua, "Xóa triệu chứng ngày này", đồng ý.
+
+Kết quả: Chờ người dùng.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

```bash
git add docs/device-checklist.md
git commit -m "docs: step 39 of the device checklist, symptoms by day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Ghi kết quả vào plan**

Ghi ngay dưới bước này (bằng script): số đỏ và xanh của từng task có khớp plan không; kết quả Step 1, Step 2 và Step 4. Đánh dấu `[x]` các bước đã làm.

- [ ] **Step 8: Hỏi người dùng, rồi mới commit file docs và lên `main`**

Hỏi người dùng, bằng tiếng Việt, một lần: (1) commit spec và ba file plan (nếu plan A chưa commit chúng) không; (2) đưa B và C (và A nếu chưa lên) lên `main` không. Kèm kết quả kiểm và danh sách mục chưa kiểm. Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết. Chỉ làm đúng điều người dùng đồng ý.

Nếu được đồng ý commit các file docs (bỏ file nào đã được commit ở plan A):

```bash
git add docs/blueprint/specs/2026-11-27-kim-bun-trieu-chung-theo-ngay-design.md docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-a.md docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-b.md docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-c.md
git commit -m "docs(plan): the plans of symptoms by day and their check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Nếu được đồng ý lên `main`:

```bash
git checkout main
git merge --ff-only feat/kim-bun-trieu-chung-theo-ngay-c
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ trên trang tạm; nhắc người dùng Bước 39 của checklist đang chờ họ trên iPhone (mục 8–10 cần hai máy, một máy đăng nhập bằng thành viên không phải chủ); lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
