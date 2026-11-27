# Kim Bun — Nhật ký gom theo buổi, plan B: vẽ, gập/mở, kiểm trình duyệt Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-27-kim-bun-nhat-ky-theo-buoi-design.md` (§3.5 phần state; §4; §5.2; §5.3)

**Status:** approved 2026-11-27

**Goal:** Nhật ký vẽ mỗi ngày thành các buổi gập/mở được bằng luật của plan A, chỉ buổi mới nhất có bản ghi của hôm nay mở sẵn; kiểm trên trình duyệt, thêm Bước 40 vào checklist, rồi hỏi để đưa A và B lên `main`.

**Architecture:**

- **`lib/rules/dayPeriods.ts` (mới):** luật thuần: buổi của một bản ghi, các buổi của một ngày (`dayPeriods`), tóm tắt buổi, buổi mở sẵn (`defaultOpenPeriod`), trạng thái mở của mọi buổi (`openPeriods`), cắt "màn hình đầu" theo dòng của buổi đang mở (`firstScreenDays`).
- **`HistoryList`:** nhận các ngày đã chia buổi (`OpenPeriodDay<LogRow>[]`) và `onToggle`; vẽ dòng triệu chứng, rồi mỗi buổi một `<li>` (nút tiêu đề + `<ul>` lồng khi mở, hoặc hàng không bấm được).
- **`HistoryScreen`:** giữ lựa chọn gập/mở của người dùng trong state (`overrides`), xóa khi đổi chip lọc; `firstScreen` cũ trong `lib/rules/history.ts` bị bỏ, thay bằng `firstScreenDays`.
- Không đổi dữ liệu, không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-nhat-ky-theo-buoi`, cùng nhánh plan A đã tạo, chạy tiếp sau 2 commit của plan A. Baseline: `Test Files  220 passed (220)`, `Tests  2137 passed (2137)`, typecheck sạch.

**Các plan của spec này:**

| Plan | Nội dung | File |
| --- | --- | --- |
| A | Luật chia buổi `lib/rules/dayPeriods.ts` (§3, §4.5 phần luật), có test. Chưa đổi màn hình. | `docs/blueprint/plans/2026-11-27-kim-bun-nhat-ky-theo-buoi-a.md` |
| B | `HistoryList` và `HistoryScreen` vẽ và gập/mở buổi (§3.5, §4), bỏ `firstScreen` cũ, kiểm trình duyệt, Bước 40 của checklist (§5). | `docs/blueprint/plans/2026-11-27-kim-bun-nhat-ky-theo-buoi-b.md` |

A và B lên `main` cùng nhau sau bước trình duyệt của B (A không push riêng).

**Diễn giải spec** (chỗ spec để plan chốt, hoặc phải chọn một cách đọc):

1. **Luật nằm trong file mới `lib/rules/dayPeriods.ts`**, không trong `lib/rules/history.ts` như ví dụ ở §3.2 và §3.5 của spec (spec để plan chốt tên và chữ ký). `history.ts` vẫn giữ `matchesFilter`, `daySummary`, `groupByVnDay` và hằng `FIRST_SCREEN_ROWS`; `dayPeriods.ts` import từ đó, `history.ts` không import ngược lại.
2. **Tên và chữ ký chốt:** `periodOf`, `DAY_PERIODS`, `periodSummary`, `dayPeriods`, `periodOpenKey`, `periodListId`, `defaultOpenPeriod`, `openPeriods`, `firstScreenDays`; kiểu `DayPeriodKey`, `PeriodKind`, `DayPeriod<T>`, `PeriodDay<T>`, `OpenDayPeriod<T>`, `OpenPeriodDay<T>` (xem Contracts).
3. **Tóm tắt dài thì xuống dòng, không cắt "…"** (§4.2 để plan chọn): ô tóm tắt `min-w-0 flex-1 text-right`, không `truncate`. Nhãn buổi `shrink-0 whitespace-nowrap`. Bước trình duyệt đo ở 375 và 390 px.
4. **`firstScreen` cũ bị bỏ** cùng 3 test của nó, thay bằng `firstScreenDays` (§4.5). Buổi mở bị cắt hết dòng ở khung đầu vẫn hiện tiêu đề đang mở với danh sách rỗng trong một khung hình, rồi React vẽ đủ ngay sau.
5. **Phút ngủ của từng buổi được làm tròn riêng** (`Math.round(ms / 60000)`), giống `daySummary` làm tròn cả ngày. Với giờ chẵn phút (mọi bản ghi tay), tổng các buổi bằng đúng phút ngủ của ngày (có test). Bản ghi bấm giờ có giây lẻ có thể làm tổng lệch tối đa 1 phút mỗi buổi so với dòng của ngày; plan chấp nhận, không đổi `daySummary`.
6. **Ngày hiện hay ẩn:** một ngày hiện khi có ít nhất một dòng triệu chứng hoặc một buổi có dòng (sau bộ lọc). Ở lọc "Tất cả" mọi ngày có bản ghi đều hiện, như cũ.
7. **Dòng bản ghi** được tách thành hàm `logRow(log, row)` thường (không phải component) trong `HistoryList.tsx`, để test duyệt cây (`findElements`) vẫn thấy nút của dòng. Kiểu dòng không đổi.
8. **Nền hàng tiêu đề buổi** là `bg-line` (§4.2), riêng theme `night` là `bg-line/70` (lớp `in-data-[theme=night]:bg-line/70`, cùng kiểu `in-data-[theme=night]:` đã dùng ở `TabBar`). Lý do: ở `night`, chữ tóm tắt 13 px `text-muted` (`#b5734f`) trên `bg-line` đầy (`rgb(217 137 92 / 0.1)`) phủ trên kính chỉ đạt 4.38:1, dưới mức 4.5:1 của §5.3; ở 70% (alpha 0.07) đạt 4.58:1. Sáu theme còn lại giữ `bg-line` đầy (ước tính khi viết plan: khoảng 5.1–5.9:1). Không token mới. Hàng không bấm được (§4.3) không có nền.
9. **Nền để đo tương phản** (§5.3): kính phủ trên `--color-bg` của theme (hoặc `--color-glass-solid`), không phải chỗ có đốm màu `blob`; ở chỗ có đốm, chữ `text-muted` trên kính sẵn có của app cũng dưới 4.5:1 ở `night` (3.86:1), không thuộc phạm vi spec này.
10. **Xóa lựa chọn riêng khi đổi lọc** (§3.5 điều 5, §5.2) không có test component bấm thật: repo chỉ có `renderToStaticMarkup` và `findElements`, không có thư viện test tương tác. Phần luật (`openPeriods` với `overrides` và `filter`) có unit test; việc `changeFilter` xóa `overrides` được kiểm ở bước trình duyệt (Task kiểm cuối, Step 5 mục 7).
11. **Bản ghi có ngày VN sau ngày của `now`** (đồng hồ máy khác chạy nhanh lúc gần nửa đêm) được coi như ngày cũ: đủ 4 buổi. Spec không nói tới; vô hại, không sửa.

## Global Constraints

Chép nguyên văn mục 2 của spec:

- Không migration, không đổi bảng `logs`, không đổi RLS, không ghi dữ liệu mới. Màn Nhật ký vẫn chỉ đọc qua `useHistoryLogs`.
- Giờ và ngày luôn theo giờ Việt Nam (UTC+7, không đổi giờ theo mùa): ngày bằng `vnDateString` (`lib/rules/time.ts`), mốc đầu ngày bằng `vnDayStartMs` (`lib/rules/days.ts`).
- Buổi của một bản ghi tính theo **`started_at`** của nó, giờ VN: giờ 0–5 → Đêm, 6–11 → Sáng, 12–17 → Chiều, 18–23 → Tối.
- Mốc giờ là hằng số trong code, không cấu hình.
- Không icon mới: mũi tên dùng `chevronDown` / `chevronUp` có sẵn trong `lib/ui/icons.ts`. Dấu chờ đồng bộ dùng `PendingMark` có sẵn. Không token màu mới.
- Vùng bấm tối thiểu 44 px, như mọi nút của app.
- Chữ trên màn hình viết đúng như spec này ghi trong ngoặc kép; dấu gạch nối giờ là en dash "–" (U+2013).
- Rules thuần nằm trong `lib/rules/`, có test vitest; component có test render như các file `*.test.tsx` hiện có.
- Hết spec: `bun run typecheck` sạch, toàn bộ vitest xanh, `bun run build` thoát 0.

Giữ từ các spec trước (không đổi ở spec này):

- Chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; không thêm dependency, không web font.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md). Plan này không dùng API mới nào của Next.
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`. Theme `night` chỉ có một tông màu: không trạng thái nào được phân biệt chỉ bằng màu (buổi mở/gập khác nhau bằng mũi tên và bằng việc có dòng bên dưới).
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không xóa. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Push lên `main` cần người dùng đồng ý từng lần.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi code nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 2** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-nhat-ky-theo-buoi-b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch của plan A và B (2 + 2) đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `e6fffab`, có `node_modules` riêng (`bun install --frozen-lockfile`). Mỗi task code là hai commit (test trước, code sau). Số test đỏ và xanh là số đo thật trên cả bộ test; `tsc --noEmit` sạch sau mỗi commit code. `bun run build` ở trạng thái cuối: lần đầu dừng ở `SecurityFatalError`, lần hai thoát 0, `Generating static pages … (42/42)`, `/nhat-ky` vẫn `○`. Trang fixture của Task 2 đã qua `tsc` và đã render thử bằng `renderToStaticMarkup` (kết quả ghi ở Task 2 Step 3). **Chưa chạy khi viết plan:** mọi bước trình duyệt.
- **Không sửa patch bằng công cụ có prettier.** Một hook PostToolUse chạy prettier lên mọi file `.md` vừa được Edit/Write, và nó đổi các dòng trống trong khối `diff` (patch hỏng). Ghi kết quả vào file plan này bằng một script (ví dụ `python3` mở file, thay chuỗi, ghi lại), không bằng Edit/Write.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài spec.
- **`bun run build` và `bun run dev`** có thể dừng một hay vài lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 (`SecurityFatalError`); chạy lại đúng lệnh tới khi thoát 0. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Spec và hai file plan chưa được commit.** `git status` thấy spec `docs/blueprint/specs/2026-11-27-kim-bun-nhat-ky-theo-buoi-design.md` và hai file plan `…-nhat-ky-theo-buoi-{a,b}.md` là untracked. Task 2 commit cả ba cùng kết quả, chỉ khi người dùng đồng ý.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **Trình duyệt.** Theo `~/.claude/CLAUDE.md` của người dùng, mặc định là Claude in Chrome (`mcp__claude-in-chrome__*`): `tabs_context_mcp` trước, rồi mở tab mới bằng `tabs_create_mcp`, không dùng tab sẵn có của họ; cửa sổ Chrome không hẹp hơn 455 px, nên đo ở 455 thay cho 375 và ghi rõ. Khung Browser trong app (`mcp__Claude_Browser__*`, cỡ 375×812 bằng `resize_window` preset `mobile`) chỉ dùng khi người dùng chọn nó ở câu hỏi của Step 4. Gọi `navigate` trước, rồi `resize_window`. Trang fixture vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt khi xong. Bỏ phần tử `nextjs-portal` (huy hiệu dev) trước khi chụp. Bấm theo `ref` của `find`. Lọc console bằng `onlyErrors`, so số lỗi trước và sau một lần tải mới.
- **Chỉ xem trên trang thật.** Trên `/nhat-ky` thật chỉ được bấm hàng tiêu đề buổi và chip lọc; không mở rồi lưu bản ghi nào.

## Contracts with Other Plans

**Consumes (từ plan A):**

- `lib/rules/dayPeriods.ts`:
  - `type DayPeriodKey = "night" | "morning" | "afternoon" | "evening"`
  - `const DAY_PERIODS: readonly { key: DayPeriodKey; label: string; fromHour: number }[]` (Tối, Chiều, Sáng, Đêm)
  - `periodOf(startedAt: string): DayPeriodKey`
  - `type PeriodKind = "logs" | "sleepOnly" | "empty"`
  - `type DayPeriod<T> = { key: DayPeriodKey; label: string; summary: string; logs: T[]; kind: PeriodKind }`
  - `periodSummary(input: { feeds: number; diapers: number; sleepMinutes: number; count: number }): string`
  - `dayPeriods<T extends LogLike>(input: { day: string; logs: T[]; all: LogLike[]; filter: HistoryFilter; now: Date }): { symptoms: T[]; periods: DayPeriod<T>[] }`
  - `periodOpenKey(day: string, key: DayPeriodKey): string` → `"2026-11-14|afternoon"`
  - `periodListId(day: string, key: DayPeriodKey): string` → `"p-2026-11-14-afternoon"`
  - `defaultOpenPeriod(days, now: Date): string | null`
  - `type PeriodDay<T> = { day: string; summary: string; symptoms: T[]; periods: DayPeriod<T>[] }`
  - `type OpenDayPeriod<T> = DayPeriod<T> & { open: boolean }`; `type OpenPeriodDay<T>` = `PeriodDay<T>` với `periods: OpenDayPeriod<T>[]`
  - `openPeriods<T>(days: PeriodDay<T>[], input: { filter: HistoryFilter; now: Date; overrides: Readonly<Record<string, boolean>> }): OpenPeriodDay<T>[]`
  - `firstScreenDays<T>(days: OpenPeriodDay<T>[], rows = FIRST_SCREEN_ROWS): OpenPeriodDay<T>[]`

**Produces:**

- `lib/rules/history.ts`: bỏ `firstScreen`; giữ `FIRST_SCREEN_ROWS = 12`.
- `HistoryList({ groups, now, nameOf, pending, onOpen, onToggle })` với `groups: OpenPeriodDay<LogRow>[]`, `onToggle: (day: string, key: DayPeriodKey, open: boolean) => void` (`open` là trạng thái mới muốn có).
- `docs/device-checklist.md`: Bước 40.
- **Vitest sau plan:** `Test Files  220 passed (220)`, `Tests  2140 passed (2140)`.

---

### Task 1: Nhật ký vẽ và gập/mở các buổi (spec §3.5, §4)

**Files:**

- Modify: `components/history/HistoryList.tsx` (viết lại phần vẽ), `components/history/HistoryScreen.tsx` (state gập/mở, dùng `dayPeriods`), `lib/rules/history.ts` (bỏ `firstScreen`)
- Test: `components/history/historylist.test.tsx` (viết lại), `components/history/historyscreen.test.tsx` (thêm một test), `lib/rules/history.test.ts` (bỏ 3 test của `firstScreen`)

**Interfaces:**

- Consumes: mọi Produces của plan A; `PendingMark`, `Glass`, `Icon`, `ChipGroup`; `periodListId`, `periodOpenKey`.
- Produces: `HistoryList` với `groups: OpenPeriodDay<LogRow>[]` và `onToggle`; `HistoryScreen` giữ `overrides`, xóa khi đổi lọc.

Cấu trúc HTML phải đúng §4.1 của spec: mỗi buổi `"logs"` là một `<li class="border-b border-line last:border-b-0">` chứa `<button type="button" aria-expanded aria-controls?>` và, khi mở, `<ul id="p-{day}-{key}">` với mỗi dòng `<li class="border-t border-line">`. Buổi `"sleepOnly"`/`"empty"` là một `<li>` không có nút. `aria-controls` chỉ có khi mở.

- [x] **Step 0: Kiểm plan A đã xong**

Kết quả (2026-11-27): đang ở `feat/kim-bun-nhat-ky-theo-buoi` sau `46d5513`; `firstScreenDays` có; `Test Files  220 passed (220)`, `Tests  2137 passed (2137)`.

```bash
git checkout feat/kim-bun-nhat-ky-theo-buoi
test -f lib/rules/dayPeriods.ts && grep -q 'export function firstScreenDays' lib/rules/dayPeriods.ts && echo 'A xong'
bunx vitest run   # Test Files  220 passed (220), Tests  2137 passed (2137)
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

Kết quả (2026-11-27): Patch 1 áp sạch (3 file).

Test phủ §5.2 của spec (trừ phần đổi lọc, xem Diễn giải 10): lớp `in-data-[theme=night]:bg-line/70` của tiêu đề; dòng triệu chứng đứng trước mọi buổi và ghi "Cả ngày"; buổi mở có nút với `aria-expanded="true"`, `aria-controls` bằng `id` của `<ul>` lồng, nền `bg-line`, `chevronUp`; buổi gập có tóm tắt, `chevronDown`, không có dòng, không `aria-controls`; dòng mờ "Không có bản ghi" và hàng `"sleepOnly"` không phải nút, không dùng `opacity`; dấu "Chờ đồng bộ" ở tiêu đề chỉ khi buổi gập; nút tiêu đề gọi `onToggle(day, key, !open)`, dòng gọi `onOpen(log)`; màn hình lúc 12:30 chỉ mở Sáng, Chiều là dòng mờ, Tối chưa hiện, Đêm gập với "1 tã".

```diff
diff --git a/components/history/historylist.test.tsx b/components/history/historylist.test.tsx
index df2cc9a..27b7753 100644
--- a/components/history/historylist.test.tsx
+++ b/components/history/historylist.test.tsx
@@ -1,6 +1,7 @@
 import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
 import { findElements } from "@/components/ui/testTree";
+import type { OpenPeriodDay } from "@/lib/rules/dayPeriods";
 import type { LogRow } from "@/lib/supabase/rows";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { HistoryList } from "./HistoryList";
@@ -42,24 +43,93 @@ const sleep = log(
   "2026-11-14T03:00:00.000Z",
   {},
 );
-const groups = [
-  { day: "2026-11-14", summary: "1 cữ · 0 tã · ngủ 1g", logs: [bottle, sleep] },
+const diaper = log(
+  "d1",
+  "diaper",
+  "2026-11-13T22:30:00.000Z",
+  "2026-11-13T22:30:00.000Z",
+  { wet: true, dirty: false },
+);
+const symptom = log(
+  "y1",
+  "symptom",
+  "2026-11-14T05:00:00.000Z",
+  "2026-11-14T05:00:00.000Z",
+  { codes: ["cough"] },
+);
+
+const groups: OpenPeriodDay<LogRow>[] = [
+  {
+    day: "2026-11-14",
+    summary: "1 cữ · 1 tã · ngủ 1g",
+    symptoms: [symptom],
+    periods: [
+      {
+        key: "afternoon",
+        label: "Chiều · 12–18 giờ",
+        summary: "",
+        logs: [],
+        kind: "empty",
+        open: false,
+      },
+      {
+        key: "morning",
+        label: "Sáng · 6–12 giờ",
+        summary: "1 cữ · ngủ 1g",
+        logs: [bottle, sleep],
+        kind: "logs",
+        open: true,
+      },
+      {
+        key: "night",
+        label: "Đêm · 0–6 giờ",
+        summary: "1 tã · ngủ 4g",
+        logs: [diaper],
+        kind: "logs",
+        open: false,
+      },
+    ],
+  },
+  {
+    day: "2026-11-13",
+    summary: "0 cữ · 0 tã · ngủ 2g",
+    symptoms: [],
+    periods: [
+      {
+        key: "evening",
+        label: "Tối · 18–24 giờ",
+        summary: "ngủ 2g",
+        logs: [],
+        kind: "sleepOnly",
+        open: false,
+      },
+    ],
+  },
 ];
 
+const render = (pending = new Set<string>()) =>
+  renderToStaticMarkup(
+    <HistoryList
+      groups={groups}
+      now={NOW}
+      nameOf={() => "Ba"}
+      pending={pending}
+      onOpen={() => {}}
+      onToggle={() => {}}
+    />,
+  );
+
 describe("HistoryList", () => {
-  it("groups by day with a 20/700 title and the day summary, rows with chip, text, time and who", () => {
-    const html = renderToStaticMarkup(
-      <HistoryList
-        groups={groups}
-        now={NOW}
-        nameOf={() => "Ba"}
-        pending={new Set(["b1"])}
-        onOpen={() => {}}
-      />,
-    );
+  it("groups by day with a 20/700 title and the day summary", () => {
+    const html = render();
     expect(html).toContain(">Hôm nay</h2>");
     expect(html).toContain("text-xl");
-    expect(html).toContain(">1 cữ · 0 tã · ngủ 1g</span>");
+    expect(html).toContain(">1 cữ · 1 tã · ngủ 1g</span>");
+    expect(html).toContain("glass");
+  });
+
+  it("rows of an open period keep chip, text, note, time, who and the pending mark", () => {
+    const html = render(new Set(["b1"]));
     expect(html).toContain("size-[34px]");
     expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
     expect(html).toContain(`d="${ICON_PATHS.moon}"`);
@@ -67,46 +137,89 @@ describe("HistoryList", () => {
     expect(html).toContain(">uống hết</span>");
     expect(html).toContain(">11:00</span>");
     expect(html).toContain(">09:00</span>");
-    expect(html.match(/>Ba<\/span>/g)).toHaveLength(2);
     expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
-    expect(html).toContain("glass");
   });
 
-  it("spec 2026-11-27 §6.2: a symptom row reads Cả ngày instead of its time", () => {
-    const symptom = log(
-      "y1",
-      "symptom",
-      "2026-11-14T05:00:00.000Z",
-      "2026-11-14T05:00:00.000Z",
-      { codes: ["cough"] },
+  // Spec 2026-11-27 (Nhật ký theo buổi) §4.1.
+  it("symptom rows come first, read Cả ngày, and sit outside every period", () => {
+    const html = render();
+    expect(html).toContain(">Cả ngày</span>");
+    expect(html.indexOf(">Cả ngày</span>")).toBeLessThan(
+      html.indexOf(">Chiều · 12–18 giờ</span>"),
+    );
+  });
+
+  // §4.1, §4.2.
+  it("an open period is a header button over a nested list it controls", () => {
+    const html = render();
+    expect(html).toMatch(
+      /<li class="[^"]*border-b border-line[^"]*"><button type="button" aria-expanded="true" aria-controls="p-2026-11-14-morning" class="[^"]*min-h-\[52px\][^"]*bg-line[^"]*"><span class="[^"]*shrink-0 whitespace-nowrap text-base font-bold text-ink[^"]*">Sáng · 6–12 giờ<\/span><span class="[^"]*text-\[13px\] text-muted tabular-nums[^"]*">1 cữ · ngủ 1g<\/span>/,
     );
-    const html = renderToStaticMarkup(
-      <HistoryList
-        groups={[{ day: "2026-11-14", summary: "", logs: [symptom] }]}
-        now={NOW}
-        nameOf={() => "Ba"}
-        pending={new Set()}
-        onOpen={() => {}}
-      />,
+    expect(html).toContain(`d="${ICON_PATHS.chevronUp}"`);
+    // Night: a lighter header keeps the muted summary at 4.5:1 (§5.3).
+    expect(html).toContain("in-data-[theme=night]:bg-line/70");
+    expect(html).toMatch(
+      /<ul id="p-2026-11-14-morning"><li class="border-t border-line">/,
     );
-    expect(html).toContain(">Cả ngày</span>");
-    expect(html).not.toContain(">12:00</span>");
+    expect(html.match(/<ul id=/g)).toHaveLength(1);
+  });
+
+  it("a closed period shows its summary and no rows", () => {
+    const html = render();
+    expect(html).toMatch(
+      /<button type="button" aria-expanded="false" class="[^"]*">.*?>Đêm · 0–6 giờ<\/span><span[^>]*>1 tã · ngủ 4g<\/span>/,
+    );
+    expect(html).toContain(`d="${ICON_PATHS.chevronDown}"`);
+    expect(html).not.toContain("Tã ướt");
+    expect(html).not.toContain("p-2026-11-14-night");
+  });
+
+  // §4.3.
+  it("an empty period is a faded row and a sleep-only period a plain row, neither a button", () => {
+    const html = render();
+    expect(html).toMatch(
+      /<li class="[^"]*min-h-\[52px\][^"]*"><span class="[^"]*font-bold text-muted[^"]*">Chiều · 12–18 giờ<\/span><span class="[^"]*text-muted[^"]*">Không có bản ghi<\/span><\/li>/,
+    );
+    expect(html).toMatch(
+      /<li class="[^"]*min-h-\[52px\][^"]*"><span class="[^"]*font-bold text-ink[^"]*">Tối · 18–24 giờ<\/span><span class="[^"]*text-muted[^"]*">ngủ 2g<\/span><\/li>/,
+    );
+    expect(html).not.toContain("opacity");
+  });
+
+  // §4.2.
+  it("a closed period with a pending row shows the mark on its header; an open one does not", () => {
+    const closed = render(new Set(["d1"]));
+    expect(closed).toMatch(
+      />1 tã · ngủ 4g<\/span><span role="img" aria-label="Chờ đồng bộ"/,
+    );
+    const open = render(new Set(["s1"]));
+    expect(open).not.toMatch(/ngủ 1g<\/span><span role="img"/);
+    expect(open.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
   });
 
-  it("opens the row's log", () => {
+  it("a header hands its period on to be flipped; a row opens its log", () => {
     const onOpen = vi.fn();
-    const rows = findElements(
+    const onToggle = vi.fn();
+    const buttons = findElements(
       HistoryList({
         groups,
         now: NOW,
         nameOf: () => "Ba",
         pending: new Set(),
         onOpen,
+        onToggle,
       }),
       (el) => el.type === "button",
     );
-    expect(rows).toHaveLength(2);
-    (rows[1].props.onClick as () => void)();
+    // Cả ngày, Sáng header, two rows of Sáng, Đêm header.
+    expect(buttons).toHaveLength(5);
+    (buttons[1].props.onClick as () => void)();
+    expect(onToggle).toHaveBeenCalledWith("2026-11-14", "morning", false);
+    (buttons[4].props.onClick as () => void)();
+    expect(onToggle).toHaveBeenLastCalledWith("2026-11-14", "night", true);
+    (buttons[3].props.onClick as () => void)();
     expect(onOpen).toHaveBeenCalledWith(sleep);
+    (buttons[0].props.onClick as () => void)();
+    expect(onOpen).toHaveBeenLastCalledWith(symptom);
   });
 });
diff --git a/components/history/historyscreen.test.tsx b/components/history/historyscreen.test.tsx
index f913482..d569ac3 100644
--- a/components/history/historyscreen.test.tsx
+++ b/components/history/historyscreen.test.tsx
@@ -1,19 +1,21 @@
 import { renderToStaticMarkup } from "react-dom/server";
-import { beforeEach, describe, expect, it, vi } from "vitest";
-import type { Baby, FamilyMember } from "@/lib/supabase/rows";
+import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
+import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { BackfillButton, HistoryScreen } from "./HistoryScreen";
 
 const state = vi.hoisted(() => ({
   // The handler HistoryScreen gave to the empty state's button.
   onEmptyAction: null as ((event?: unknown) => void) | null,
+  // What useHistoryLogs returns as its only page.
+  logs: [] as LogRow[],
 }));
 const openActionSheet = vi.hoisted(() => vi.fn());
 
 vi.mock("@/lib/data/logs", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@/lib/data/logs")>()),
   useHistoryLogs: () => ({
-    data: { pages: [[]] },
+    data: { pages: [state.logs] },
     isPending: false,
     isError: false,
     fetchStatus: "idle",
@@ -48,8 +50,12 @@ const member = { role: "owner", user_id: "u1" } as FamilyMember;
 
 beforeEach(() => {
   state.onEmptyAction = null;
+  state.logs = [];
   openActionSheet.mockClear();
 });
+afterEach(() => {
+  vi.useRealTimers();
+});
 
 describe("BackfillButton", () => {
   it("is a labelled glass button, not the calendar icon", () => {
@@ -83,3 +89,49 @@ describe("HistoryScreen with no logs", () => {
     expect(openActionSheet.mock.calls).toEqual([[]]);
   });
 });
+
+// Spec 2026-11-27 (Nhật ký theo buổi) §3.5.
+describe("HistoryScreen with logs", () => {
+  const log = (id: string, type: string, start: string, details: unknown) =>
+    ({
+      id,
+      baby_id: "b1",
+      type,
+      started_at: start,
+      ended_at: start,
+      details,
+      note: null,
+      created_by: "u1",
+      created_at: start,
+      updated_at: start,
+    }) as LogRow;
+
+  it("opens only today's latest period with logs; the rest show their summary", () => {
+    vi.useFakeTimers();
+    vi.setSystemTime(new Date("2026-11-14T12:30:00+07:00"));
+    state.logs = [
+      log("b1", "bottle", "2026-11-14T03:00:00.000Z", {
+        ml: 90,
+        milk: "formula",
+      }),
+      log("d1", "diaper", "2026-11-13T20:00:00.000Z", {
+        wet: true,
+        dirty: false,
+      }),
+    ];
+    const html = renderToStaticMarkup(
+      <HistoryScreen baby={baby} member={member} userId="u1" />,
+    );
+    expect(html).toContain(">Chiều · 12–18 giờ</span>");
+    expect(html).toContain(">Không có bản ghi</span>");
+    expect(html).not.toContain("Tối · 18–24 giờ");
+    expect(html).toContain(
+      'aria-expanded="true" aria-controls="p-2026-11-14-morning"',
+    );
+    expect(html).toContain("Bình 90 ml sữa công thức");
+    expect(html).toMatch(
+      /aria-expanded="false" class="[^"]*">.*?>Đêm · 0–6 giờ<\/span><span[^>]*>1 tã<\/span>/,
+    );
+    expect(html).not.toContain("Tã ướt");
+  });
+});
diff --git a/lib/rules/history.test.ts b/lib/rules/history.test.ts
index afcd757..b36ab22 100644
--- a/lib/rules/history.test.ts
+++ b/lib/rules/history.test.ts
@@ -2,7 +2,6 @@ import { describe, expect, it } from "vitest";
 import {
   canModifyLog,
   daySummary,
-  firstScreen,
   groupByVnDay,
   HISTORY_FILTERS,
   historyPageRange,
@@ -191,29 +190,3 @@ describe("daySummary", () => {
     );
   });
 });
-
-describe("firstScreen", () => {
-  const day = (name: string, count: number) => ({
-    day: name,
-    logs: Array.from({ length: count }, (_, i) => `${name}-${i}`),
-  });
-
-  it("keeps whole days until the row budget is used", () => {
-    const groups = [day("a", 5), day("b", 7), day("c", 4)];
-    expect(firstScreen(groups, 12)).toEqual([groups[0], groups[1]]);
-  });
-
-  it("cuts the last day it reaches to the rows that are left", () => {
-    const groups = [day("a", 5), day("b", 20), day("c", 4)];
-    const shown = firstScreen(groups, 12);
-    expect(shown.map((g) => g.logs.length)).toEqual([5, 7]);
-    expect(shown[1].logs).toEqual(groups[1].logs.slice(0, 7));
-    expect(groups[1].logs).toHaveLength(20);
-  });
-
-  it("returns every day when they fit", () => {
-    const groups = [day("a", 2), day("b", 3)];
-    expect(firstScreen(groups, 12)).toEqual(groups);
-    expect(firstScreen([], 12)).toEqual([]);
-  });
-});
```

- [x] **Step 2: Chạy, thấy đỏ**

Kết quả (2026-11-27): `Test Files  2 failed | 218 passed (220)`, `Tests  9 failed | 2131 passed (2140)`; 8 test ở `historylist.test.tsx`, 1 ở `historyscreen.test.tsx`, đúng như dự kiến.

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 218 passed (220)`, `Tests  9 failed | 2131 passed (2140)`; hai file hỏng là `components/history/historylist.test.tsx` (8 test) và `components/history/historyscreen.test.tsx` (1 test).

- [x] **Step 3: Commit test**

Kết quả (2026-11-27): commit `a069ac3`.

```bash
git add components/history/historylist.test.tsx components/history/historyscreen.test.tsx lib/rules/history.test.ts
git commit -m "test(history): Nhật ký shows the periods of each day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 4: Viết phần vẽ và state (Patch 2)**

Kết quả (2026-11-27): Patch 2 áp sạch (3 file).

```diff
diff --git a/components/history/HistoryList.tsx b/components/history/HistoryList.tsx
index 623b29d..079704e 100644
--- a/components/history/HistoryList.tsx
+++ b/components/history/HistoryList.tsx
@@ -1,6 +1,12 @@
 import { PendingMark } from "@/components/sync/PendingMark";
 import { Glass } from "@/components/ui/Glass";
 import { Icon } from "@/components/ui/Icon";
+import {
+  type DayPeriodKey,
+  type OpenDayPeriod,
+  type OpenPeriodDay,
+  periodListId,
+} from "@/lib/rules/dayPeriods";
 import { vnDayLabel } from "@/lib/rules/days";
 import { describeLog } from "@/lib/rules/describeLog";
 import { logTimeText } from "@/lib/rules/history";
@@ -9,20 +15,141 @@ import type { LogRow } from "@/lib/supabase/rows";
 import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 
-// Spec §9 Nhật ký: one glass list per VN day.
+type RowProps = {
+  now: Date;
+  nameOf: (userId: string) => string;
+  pending: Set<string>;
+  onOpen: (log: LogRow) => void;
+};
+
+// One log as a tappable row. A plain function, not a component, so tests that
+// walk the returned tree see its button.
+function logRow(log: LogRow, { now, nameOf, pending, onOpen }: RowProps) {
+  const category = CATEGORIES[log.type as LogType];
+  return (
+    <button
+      type="button"
+      onClick={() => onOpen(log)}
+      className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left"
+    >
+      {category && (
+        <span
+          className={cx(
+            "flex size-[34px] shrink-0 items-center justify-center rounded-full",
+            CATEGORY_CHIP[category.token],
+          )}
+        >
+          <Icon name={category.icon} size={18} strokeWidth={2.2} />
+        </span>
+      )}
+      <span className="flex min-w-0 flex-1 flex-col">
+        <span className="text-base font-medium text-ink">
+          {describeLog(log, now)} <PendingMark pending={pending.has(log.id)} />
+        </span>
+        {log.note && (
+          <span className="truncate text-[13px] text-muted">{log.note}</span>
+        )}
+      </span>
+      <span className="flex shrink-0 flex-col items-end">
+        <span className="text-[15px] font-semibold text-ink tabular-nums">
+          {logTimeText(log)}
+        </span>
+        <span className="text-xs text-muted">{nameOf(log.created_by)}</span>
+      </span>
+    </button>
+  );
+}
+
+const PERIOD_ROW = "flex min-h-[52px] w-full items-center gap-2.5 px-4 py-2";
+const PERIOD_LABEL = "shrink-0 whitespace-nowrap text-base font-bold";
+const PERIOD_SUMMARY =
+  "min-w-0 flex-1 text-right text-[13px] text-muted tabular-nums";
+
+// Spec 2026-11-27 (Nhật ký theo buổi) §4.1–§4.3: one period of a day.
+function periodItem(
+  day: string,
+  period: OpenDayPeriod<LogRow>,
+  row: RowProps,
+  onToggle: (day: string, key: DayPeriodKey, open: boolean) => void,
+) {
+  if (period.kind !== "logs")
+    return (
+      <li
+        key={period.key}
+        className={cx(PERIOD_ROW, "border-b border-line last:border-b-0")}
+      >
+        <span
+          className={cx(
+            PERIOD_LABEL,
+            period.kind === "empty" ? "text-muted" : "text-ink",
+          )}
+        >
+          {period.label}
+        </span>
+        <span className={PERIOD_SUMMARY}>
+          {period.kind === "empty" ? "Không có bản ghi" : period.summary}
+        </span>
+      </li>
+    );
+  const id = periodListId(day, period.key);
+  return (
+    <li key={period.key} className="border-b border-line last:border-b-0">
+      <button
+        type="button"
+        aria-expanded={period.open}
+        aria-controls={period.open ? id : undefined}
+        onClick={() => onToggle(day, period.key, !period.open)}
+        // At night bg-line at full strength leaves the muted summary under
+        // 4.5:1; 70% of it keeps 4.58:1 on glass over the page background.
+        className={cx(
+          PERIOD_ROW,
+          "bg-line text-left in-data-[theme=night]:bg-line/70",
+        )}
+      >
+        <span className={cx(PERIOD_LABEL, "text-ink")}>{period.label}</span>
+        <span className={PERIOD_SUMMARY}>{period.summary}</span>
+        {!period.open && (
+          <PendingMark
+            pending={period.logs.some((log) => row.pending.has(log.id))}
+          />
+        )}
+        <Icon
+          name={period.open ? "chevronUp" : "chevronDown"}
+          size={18}
+          className="shrink-0"
+        />
+      </button>
+      {period.open && (
+        <ul id={id}>
+          {period.logs.map((log) => (
+            <li key={log.id} className="border-t border-line">
+              {logRow(log, row)}
+            </li>
+          ))}
+        </ul>
+      )}
+    </li>
+  );
+}
+
+// Spec §9 Nhật ký: one glass list per VN day; spec 2026-11-27 (Nhật ký theo
+// buổi): the day's symptom rows, then its periods.
 export function HistoryList({
   groups,
   now,
   nameOf,
   pending,
   onOpen,
+  onToggle,
 }: {
-  groups: { day: string; summary: string; logs: LogRow[] }[];
+  groups: OpenPeriodDay<LogRow>[];
   now: Date;
   nameOf: (userId: string) => string;
   pending: Set<string>;
   onOpen: (log: LogRow) => void;
+  onToggle: (day: string, key: DayPeriodKey, open: boolean) => void;
 }) {
+  const row: RowProps = { now, nameOf, pending, onOpen };
   return (
     <>
       {groups.map((group) => (
@@ -40,55 +167,14 @@ export function HistoryList({
             </span>
           </div>
           <Glass as="ul" className="overflow-hidden">
-            {group.logs.map((log) => {
-              const category = CATEGORIES[log.type as LogType];
-              return (
-                <li
-                  key={log.id}
-                  className="border-b border-line last:border-b-0"
-                >
-                  <button
-                    type="button"
-                    onClick={() => onOpen(log)}
-                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left"
-                  >
-                    {category && (
-                      <span
-                        className={cx(
-                          "flex size-[34px] shrink-0 items-center justify-center rounded-full",
-                          CATEGORY_CHIP[category.token],
-                        )}
-                      >
-                        <Icon
-                          name={category.icon}
-                          size={18}
-                          strokeWidth={2.2}
-                        />
-                      </span>
-                    )}
-                    <span className="flex min-w-0 flex-1 flex-col">
-                      <span className="text-base font-medium text-ink">
-                        {describeLog(log, now)}{" "}
-                        <PendingMark pending={pending.has(log.id)} />
-                      </span>
-                      {log.note && (
-                        <span className="truncate text-[13px] text-muted">
-                          {log.note}
-                        </span>
-                      )}
-                    </span>
-                    <span className="flex shrink-0 flex-col items-end">
-                      <span className="text-[15px] font-semibold text-ink tabular-nums">
-                        {logTimeText(log)}
-                      </span>
-                      <span className="text-xs text-muted">
-                        {nameOf(log.created_by)}
-                      </span>
-                    </span>
-                  </button>
-                </li>
-              );
-            })}
+            {group.symptoms.map((log) => (
+              <li key={log.id} className="border-b border-line last:border-b-0">
+                {logRow(log, row)}
+              </li>
+            ))}
+            {group.periods.map((period) =>
+              periodItem(group.day, period, row, onToggle),
+            )}
           </Glass>
         </section>
       ))}
diff --git a/components/history/HistoryScreen.tsx b/components/history/HistoryScreen.tsx
index c137786..679427a 100644
--- a/components/history/HistoryScreen.tsx
+++ b/components/history/HistoryScreen.tsx
@@ -17,15 +17,20 @@ import { useLogsRealtime } from "@/lib/data/realtime";
 import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
 import { useNow } from "@/lib/hooks/useNow";
 import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
+import {
+  dayPeriods,
+  type DayPeriodKey,
+  firstScreenDays,
+  openPeriods,
+  periodOpenKey,
+} from "@/lib/rules/dayPeriods";
 import {
   canModifyLog,
   daySummary,
-  firstScreen,
   groupByVnDay,
   HISTORY_FILTERS,
   historySheet,
   type HistorySheet,
-  matchesFilter,
   type HistoryFilter,
 } from "@/lib/rules/history";
 import { ageDays } from "@/lib/rules/time";
@@ -77,11 +82,24 @@ export function HistoryScreen({
     [pendingKey],
   );
   const [filter, setFilter] = useState<HistoryFilter>("all");
+  // Spec 2026-11-27 (Nhật ký theo buổi) §3.5: the periods the user tapped,
+  // by periodOpenKey. Not kept anywhere; a new filter starts from the default.
+  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
   const [sheet, setSheet] = useState<SheetState>(null);
+  const changeFilter = useCallback((next: HistoryFilter) => {
+    setFilter(next);
+    setOverrides({});
+  }, []);
+  const togglePeriod = useCallback(
+    (day: string, key: DayPeriodKey, open: boolean) =>
+      setOverrides((prev) => ({ ...prev, [periodOpenKey(day, key)]: open })),
+    [],
+  );
 
   const rows = useMemo(() => history.data?.pages.flat() ?? [], [history.data]);
-  // The day summary counts every log of the day; the filter only hides rows (spec §9).
-  const groups = useMemo(
+  // The day summary counts every log of the day; the filter only hides rows
+  // (spec §9). A day with no row left under the filter is hidden.
+  const days = useMemo(
     () =>
       groupByVnDay(rows)
         .map((group) => ({
@@ -92,17 +110,31 @@ export function HistoryScreen({
             all: rows,
             now,
           }),
-          logs: group.logs.filter((row) => matchesFilter(row, filter)),
+          ...dayPeriods({
+            day: group.day,
+            logs: group.logs,
+            all: rows,
+            filter,
+            now,
+          }),
         }))
-        .filter((group) => group.logs.length > 0),
+        .filter(
+          (day) =>
+            day.symptoms.length > 0 ||
+            day.periods.some((period) => period.logs.length > 0),
+        ),
     [rows, filter, now],
   );
+  const groups = useMemo(
+    () => openPeriods(days, { filter, now, overrides }),
+    [days, filter, now, overrides],
+  );
   // A tab switch commits the first screen of rows only; React renders the
   // days below right after, so the tap is not held for the whole week.
-  const deferredGroups = useDeferredValue(groups, firstScreen(groups));
+  const deferredGroups = useDeferredValue(groups, firstScreenDays(groups));
   // Rows that arrive after the skeleton keep the first screen while the rest renders.
   const shownGroups =
-    deferredGroups.length === 0 ? firstScreen(groups) : deferredGroups;
+    deferredGroups.length === 0 ? firstScreenDays(groups) : deferredGroups;
   const nameOf = useCallback(
     (userId: string) =>
       members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó",
@@ -125,7 +157,7 @@ export function HistoryScreen({
         label="Lọc nhật ký"
         options={HISTORY_FILTERS}
         value={filter}
-        onChange={setFilter}
+        onChange={changeFilter}
       />
 
       {waitingForNetwork(history) ? (
@@ -169,6 +201,7 @@ export function HistoryScreen({
           nameOf={nameOf}
           pending={pending}
           onOpen={openLog}
+          onToggle={togglePeriod}
         />
       )}
 
diff --git a/lib/rules/history.ts b/lib/rules/history.ts
index 4f1c201..4a51ac6 100644
--- a/lib/rules/history.ts
+++ b/lib/rules/history.ts
@@ -155,25 +155,7 @@ export function daySummary(input: {
   return `${feeds} cữ · ${diapers} tã · ngủ ${shortDuration(Math.round(sleepMs / 60_000))}`;
 }
 
-// The rows a phone screen shows first on Nhật ký. A tab switch renders only
-// these, and the days below them right after, so the tap is not held while a
-// week of rows is built.
+// The log rows a phone screen shows first on Nhật ký (dayPeriods.ts
+// firstScreenDays). A tab switch renders only these, and the rest right after,
+// so the tap is not held while a week of rows is built.
 export const FIRST_SCREEN_ROWS = 12;
-
-export function firstScreen<T extends { logs: unknown[] }>(
-  groups: T[],
-  rows = FIRST_SCREEN_ROWS,
-): T[] {
-  const out: T[] = [];
-  let left = rows;
-  for (const group of groups) {
-    if (left <= 0) break;
-    out.push(
-      group.logs.length > left
-        ? { ...group, logs: group.logs.slice(0, left) }
-        : group,
-    );
-    left -= group.logs.length;
-  }
-  return out;
-}
```

- [x] **Step 5: Chạy, thấy xanh**

Kết quả (2026-11-27): `tsc --noEmit` sạch; `Test Files  220 passed (220)`, `Tests  2140 passed (2140)`.

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  220 passed (220)`, `Tests  2140 passed (2140)`. `lib/themeGuard.test.ts` nằm trong số xanh (không mã hex mới).

- [x] **Step 6: Commit**

Kết quả (2026-11-27): commit `c40362c`.

```bash
git add components/history/HistoryList.tsx components/history/HistoryScreen.tsx lib/rules/history.ts
git commit -m "feat(history): Nhật ký folds each day into periods" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Kiểm cuối, trình duyệt, checklist, rồi hỏi trước khi lên `main`

**Files:**

- Create rồi xóa (không commit): `app/fixture-nhat-ky/page.tsx`
- Modify: `docs/device-checklist.md` (Bước 40), hai file plan A, B (ghi kết quả, bằng script)

**Interfaces:**

- Consumes: mọi Produces của plan A và Task 1.
- Produces: Bước 40 của checklist; nhánh sẵn sàng lên `main`.

- [x] **Step 1: Chạy cả bộ kiểm**

Kết quả (2026-11-27): `tsc --noEmit` sạch; `Test Files  220 passed (220)`, `Tests  2140 passed (2140)`.

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  220 passed (220)`, `Tests  2140 passed (2140)`.

- [x] **Step 2: Build**

Kết quả (2026-11-27): lần 1 thoát 1 ở `SecurityFatalError`; lần 2 thoát 0, `✓ Generating static pages using 9 workers (42/42)`, `├ ○ /nhat-ky`.

Run: `bun run build`
Expected: thoát 0, `Generating static pages … (42/42)`, `/nhat-ky` vẫn `○`. Có thể dừng ở `SecurityFatalError`: chạy lại đúng lệnh đó tới khi thoát 0.

- [x] **Step 3: Tạo trang fixture tạm**

Kết quả (2026-11-27): trang lấy nguyên khối `tsx` dưới đây; `tsc --noEmit` sạch; vẽ đúng như kết quả render thử (hôm nay 27/11, "bây giờ" 15:30).

Dữ liệu thật của gia đình có thể không có đủ trạng thái (giấc qua đêm, buổi có bản ghi chờ đồng bộ, tóm tắt dài nhất), nên xem đủ ở đây. Trang dùng luật và `HistoryList` thật với dữ liệu giả; "bây giờ" là 15:30 hôm nay; chip lọc và gập/mở bấm được, bấm dòng không làm gì. Tạo `app/fixture-nhat-ky/page.tsx` (không commit):

```tsx
"use client";

import { useState } from "react";
import { HistoryList } from "@/components/history/HistoryList";
import { ChipGroup } from "@/components/ui/ChipGroup";
import {
  dayPeriods,
  openPeriods,
  periodOpenKey,
  type OpenPeriodDay,
} from "@/lib/rules/dayPeriods";
import { addDays } from "@/lib/rules/days";
import {
  daySummary,
  groupByVnDay,
  HISTORY_FILTERS,
  type HistoryFilter,
} from "@/lib/rules/history";
import { vnDateString } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";

// Dữ liệu giả, không đọc hay ghi gì của gia đình. "Bây giờ" là 15:30 hôm nay.
const TODAY = vnDateString(new Date());
const Y = addDays(TODAY, -1);
const OLD = addDays(TODAY, -3);
const NOW = new Date(`${TODAY}T15:30:00+07:00`);
const at = (day: string, hhmm: string) =>
  new Date(`${day}T${hhmm}:00+07:00`).toISOString();
const log = (
  id: string,
  type: string,
  start: string,
  end: string | null,
  details: unknown,
  note: string | null = null,
) =>
  ({
    id,
    baby_id: "b",
    type,
    started_at: start,
    ended_at: end,
    details,
    note,
    created_by: "me",
    created_at: start,
    updated_at: start,
  }) as LogRow;
const feed = (id: string, day: string, hhmm: string, side: "left" | "right") =>
  log(id, "breast", at(day, hhmm), at(day, hhmm), { side });
const wet = (id: string, day: string, hhmm: string) =>
  log(id, "diaper", at(day, hhmm), at(day, hhmm), { wet: true, dirty: false });

const ROWS: LogRow[] = [
  log("y0", "symptom", at(TODAY, "12:00"), at(TODAY, "12:00"), {
    codes: ["cough", "runny_nose"],
  }),
  log(
    "a3",
    "bottle",
    at(TODAY, "15:00"),
    at(TODAY, "15:00"),
    { ml: 90, milk: "breast_milk" },
    "uống hết",
  ),
  wet("a2", TODAY, "14:00"),
  feed("p1", TODAY, "13:10", "left"),
  feed("m6", TODAY, "11:40", "right"),
  wet("m5", TODAY, "11:00"),
  log("m4", "sleep", at(TODAY, "09:20"), at(TODAY, "10:45"), {}),
  feed("m3", TODAY, "08:40", "left"),
  wet("m2", TODAY, "07:30"),
  feed("m1", TODAY, "06:50", "right"),
  log("e1", "sleep", at(Y, "21:00"), at(TODAY, "06:30"), {}),
  feed("e0", Y, "20:30", "left"),
  wet("f1", Y, "13:00"),
  log("f0", "bottle", at(Y, "07:00"), at(Y, "07:00"), {
    ml: 60,
    milk: "formula",
  }),
];
const PENDING = new Set(["p1", "m3"]);

// Một ngày làm tay để đo tóm tắt dài nhất của spec §5.3.
const LONG: OpenPeriodDay<LogRow> = {
  day: OLD,
  summary: "10 cữ · 12 tã · ngủ 11g 55p",
  symptoms: [],
  periods: [
    {
      key: "afternoon",
      label: "Chiều · 12–18 giờ",
      summary: "10 cữ · 12 tã · ngủ 11g 55p",
      logs: [feed("z1", OLD, "13:00", "left")],
      kind: "logs",
      open: false,
    },
  ],
};

export default function Page() {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const days = groupByVnDay(ROWS)
    .map((group) => ({
      day: group.day,
      summary: daySummary({
        day: group.day,
        logs: group.logs,
        all: ROWS,
        now: NOW,
      }),
      ...dayPeriods({
        day: group.day,
        logs: group.logs,
        all: ROWS,
        filter,
        now: NOW,
      }),
    }))
    .filter(
      (day) =>
        day.symptoms.length > 0 || day.periods.some((p) => p.logs.length > 0),
    );
  const groups = [...openPeriods(days, { filter, now: NOW, overrides }), LONG];
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <ChipGroup
        label="Lọc nhật ký"
        options={HISTORY_FILTERS}
        value={filter}
        onChange={(next) => {
          setFilter(next);
          setOverrides({});
        }}
      />
      <HistoryList
        groups={groups}
        now={NOW}
        nameOf={() => "Mẹ"}
        pending={PENDING}
        onOpen={() => {}}
        onToggle={(day, key, open) =>
          setOverrides((prev) => ({ ...prev, [periodOpenKey(day, key)]: open }))
        }
      />
    </main>
  );
}
```

Kết quả render thử khi viết plan (ngày 27/11; ngày khác chỉ đổi ngày trong `id`):

```text
Hôm nay:    Chiều "2 cữ · 1 tã" (mở, có dòng p1 chờ đồng bộ) · Sáng "3 cữ · 2 tã · ngủ 1g 55p" (gập, dấu chờ đồng bộ trên tiêu đề) · Đêm "ngủ 6g" (không bấm được)
Hôm qua:    Tối "1 cữ · ngủ 3g" · Chiều "1 tã" · Sáng "1 cữ" · Đêm "Không có bản ghi"
3 hôm trước: Chiều "10 cữ · 12 tã · ngủ 11g 55p" (làm tay, gập)
Buổi mở: p-<hôm nay>-afternoon. Tối hôm nay chưa hiện (15:30).
```

- [x] **Step 4: Hỏi dùng trình duyệt nào, rồi chạy dev**

Kết quả (2026-11-27): người dùng chọn khung Browser trong app. `bun run dev` lần 1 thoát 1 (`SecurityFatalError`), lần 2 `Ready`. `resize_window` preset `mobile`, `innerWidth` = 375. Đo lúc 20:33 giờ VN, theme giữ bằng `MutationObserver`, `nextjs-portal` đã bỏ.

Hỏi người dùng một câu: khung Browser trong app hay Chrome. Rồi `bun run dev` chạy nền (có thể phải chạy lại sau `SecurityFatalError`), `navigate` tới `http://localhost:3000/fixture-nhat-ky`, `resize_window` preset `mobile`, đọc `innerWidth` (phải là 375).

- [x] **Step 5: Kiểm trên trang fixture, theme `rose`**

Kết quả (2026-11-27): đạt cả 8 mục, ở 375 px. (1) Hôm nay: dòng triệu chứng "Cả ngày" (chữ trên trang là "Triệu chứng: Sổ mũi, Ho", thứ tự do `describeLog` sẵn có), rồi Chiều, Sáng, Đêm; không có Tối. (2) Chiều `aria-expanded="true"`, `aria-controls="p-2026-11-27-afternoon"` = `id` của `<ul>` 3 dòng; Sáng và 3 buổi có bản ghi của hôm qua `false`, không `aria-controls`. (3) nút tiêu đề nhỏ nhất 52 px, hàng không bấm được 52 px, dòng bản ghi 60 px. (4) mọi nhãn buổi 1 dòng; "10 cữ · 12 tã · ngủ 11g 55p" 2 dòng, không "…" (`text-overflow: clip`); "3 cữ · 2 tã · ngủ 1g 55p" của Sáng (có dấu chờ đồng bộ bên cạnh) cũng 2 dòng. (5) Hôm nay 6 đường kẻ, Hôm qua 3, ngày làm tay 0; không đường đôi; không đường kẻ ở đáy khối. (6) bấm Sáng: mở, mũi tên `m6 9 6 6 6-6` → `m6 15 6-6 6 6`, dấu chờ đồng bộ rời tiêu đề xuống dòng "Bú trái" 08:40; Sáng có 6 dòng (m1–m6 của fixture), không phải "ba dòng" như chữ của mục này. `scrollY` giữ nguyên khi mở/gập ở 60 (tiêu đề đứng ở 347.5) và ở đáy trang 98.5 (tiêu đề ở 309). Ghi chú: nếu cuộn xuống 400 khi Sáng mở, gập (trang ngắn lại, Chrome kẹp về 98.5) rồi mở lại mà không cuộn gì ở giữa, Chrome trả `scrollY` về 400; cuộn một lần ở giữa thì không. Đó là cách Chrome nhớ vị trí bị kẹp, không do app; trên trang thật dài không gặp. Bấm lại: gập. (7) chip "Bú": Hôm nay Chiều (Bình, Bú trái) và Sáng (3 dòng bú) mở; Hôm qua Tối và Sáng mở; dòng triệu chứng, hai Đêm và Chiều hôm qua không còn; ngày làm tay vẫn hiện, gập. "Tất cả": về như mục 2, Sáng gập. (8) `rose`: tóm tắt trên nền tiêu đề 5.14:1, chữ hàng "Không có bản ghi" (nhãn và tóm tắt) 5.97:1, `opacity` 1.

Đặt `document.documentElement.dataset.theme = 'rose'` (giữ bằng `MutationObserver` nếu sau 21:00). Kỳ vọng, đo bằng script trên trang (rect của từng hàng, `getComputedStyle`), không chỉ nhìn:

1. Thứ tự trong khối "Hôm nay": dòng "Triệu chứng: Ho, Sổ mũi" ("Cả ngày"), Chiều, Sáng, Đêm. Không có Tối.
2. Chiều mở (`aria-expanded="true"`, `aria-controls` trỏ đúng `<ul>` có ba dòng); Sáng và các buổi hôm qua gập.
3. Mọi nút tiêu đề cao ≥ 52 px; hàng không bấm được cao ≥ 52 px; mọi dòng bản ghi cao ≥ 60 px.
4. Nhãn buổi (ví dụ "Chiều · 12–18 giờ") nằm trên một dòng (đo bằng rect từng ký tự). Tóm tắt dài nhất "10 cữ · 12 tã · ngủ 11g 55p" không bị cắt "…" (được xuống dòng); ghi số dòng nó chiếm ở 375 và ở 390 px.
5. Giữa các hàng chỉ có một đường kẻ (không có đường đôi), hàng cuối của khối không có đường kẻ dưới.
6. Bấm tiêu đề Sáng: ba dòng hiện ra, mũi tên lên, dấu chờ đồng bộ chuyển từ tiêu đề xuống dòng "Bú trái" 08:40. `window.scrollY` trước và sau bấm như nhau. Bấm lại: gập.
7. Bấm chip "Bú": mọi buổi còn lại đều mở và chỉ có dòng bú; Đêm hôm nay ("sleepOnly") và Đêm hôm qua ("empty") không còn; ngày làm tay vẫn hiện (nó nằm ngoài luật). Bấm "Tất cả": về như mục 2, Sáng gập lại dù vừa mở ở mục 6.
8. Tương phản chữ: tóm tắt 13 px `text-muted` trên nền tiêu đề, và chữ dòng mờ: ≥ 4.5:1. Tính từ màu đã tính (`getComputedStyle`) của chữ và của nền tiêu đề trộn lên kính phủ trên `--color-bg` (Diễn giải 9), không đo chỗ có đốm màu. Ước tính khi viết plan: các theme sáng và `dark` khoảng 5.1–5.9:1, `night` 4.58:1 (với `bg-line/70`); ghi lại số đo thật trên trình duyệt.

- [x] **Step 6: Lặp mục 3–5 và 8 ở theme `lavender`, `dark`, `night`, và mục 4 ở 390 px**

Kết quả (2026-11-27): mục 3–5 như `rose` ở cả ba theme (52/52/60 px; nhãn 1 dòng; tóm tắt dài nhất 2 dòng; đường kẻ 6/3/0, không đôi, không ở đáy). Tương phản tóm tắt trên tiêu đề / hàng mờ: `lavender` 5.16 / 6.04, `dark` 5.87 / 7.33, `night` 4.61 / 5.02 (nền tiêu đề `night` tính ra alpha 0.071 = `bg-line/70`). Tiêu đề so với dòng: 1.16 (`rose`), 1.17 (`lavender`), 1.25 (`dark`), 1.09 (`night`); ở `night` hình chụp vẫn thấy hàng buổi tách với dòng, mở/gập khác nhau bằng mũi tên lên/xuống. Ở 390 px (`innerWidth` 390), cả 4 theme: nhãn 1 dòng, "10 cữ · 12 tã · ngủ 11g 55p" vẫn 2 dòng, tóm tắt Sáng 1 dòng.

Kỳ vọng: như Step 5; ở `night` tiêu đề buổi vẫn tách được với dòng bản ghi (nền `bg-line/70` vẫn khác nền dòng) và buổi mở/gập phân biệt được bằng mũi tên, không chỉ bằng màu.

- [x] **Step 7: Kiểm trên trang thật, chỉ xem**

Kết quả (2026-11-27): đã đăng nhập sẵn, theme `dark`, 375 px, 7 ngày. Chỉ "Tối · 18–24 giờ" của hôm nay mở (6 dòng); mọi ngày cũ đủ 4 buổi; "Đêm · 0–6 giờ" của 24/11 và 22/11 là hàng "ngủ 6g" không bấm được; Hôm qua có dòng triệu chứng đứng đầu. Bấm Chiều hôm nay: mở 9 dòng, `aria-controls="p-2026-11-27-afternoon"`, `scrollY` 0 → 0; bấm lại: gập. Lỗi console (`onlyErrors`): 0 trước, 0 sau một lần tải mới. Không bấm gì khác, không lưu, không xóa.

`navigate` tới `http://localhost:3000/nhat-ky` (đăng nhập nếu cần, do người dùng tự làm). Kỳ vọng: chỉ buổi mới nhất có bản ghi của hôm nay mở; các ngày cũ đủ 4 buổi; không lỗi mới trong console (`onlyErrors`, so số lỗi trước và sau một lần tải mới). Chỉ bấm tiêu đề buổi và chip lọc.

- [x] **Step 8: Xóa fixture, kiểm lại**

Kết quả (2026-11-27): dev đã tắt; `app/fixture-nhat-ky` và `.next/dev/types` đã xóa; `git status --short` chỉ còn spec và hai plan untracked; `tsc --noEmit` sạch.

```bash
rm -r app/fixture-nhat-ky
rm -rf .next/dev/types   # tsconfig gồm .next/dev/types; trang tạm đã xóa làm tsc báo thiếu module
git status --short       # không còn app/fixture-nhat-ky
bun run typecheck        # sạch
```

- [x] **Step 9: Thêm Bước 40 vào checklist**

Kết quả (2026-11-27): khối dưới đây được nối vào cuối `docs/device-checklist.md` bằng script (21 dòng thêm, gồm một dòng trống phân cách).

Thêm vào cuối `docs/device-checklist.md` (sửa bằng script hoặc trình sửa không chạy prettier; file đó không theo prettier):

```markdown
## Bước 40 — Nhật ký gom theo buổi (spec 2026-11-27)

Chỉ xem, trừ mục 6 tạo một bản ghi thử rồi xóa nó. Một máy là đủ.

1. Mở tab Nhật ký. Kỳ vọng: mỗi ngày một khối kính; nếu ngày có triệu chứng thì dòng "Cả ngày" đứng đầu khối; sau đó là các hàng buổi từ muộn tới sớm ("Tối · 18–24 giờ", "Chiều · 12–18 giờ", "Sáng · 6–12 giờ", "Đêm · 0–6 giờ"). Hôm nay không có buổi chưa tới. Chỉ một buổi đang mở: buổi muộn nhất có bản ghi của hôm nay. Hàng buổi có nền hơi đậm hơn dòng bản ghi. Không chữ nào bị cắt "…".
2. Hàng buổi đang gập có tóm tắt kiểu "3 cữ · 2 tã · ngủ 2g 10p" và mũi tên xuống. Bấm vào. Kỳ vọng: các dòng của buổi hiện ra ngay dưới, mũi tên lên, trang không nhảy. Bấm lại: gập.
3. Một ngày cũ. Kỳ vọng: đủ bốn buổi; buổi không có gì là hàng mờ "Không có bản ghi", bấm không có gì xảy ra. Nếu đêm đó bé ngủ từ tối hôm trước mà 0–6 giờ không ghi gì thì "Đêm · 0–6 giờ" ghi "ngủ …", cũng không bấm được.
4. Bấm chip "Bú". Kỳ vọng: mọi buổi còn lại đều mở, chỉ có dòng bú; buổi không có cữ bú nào biến mất. Bấm "Tất cả". Kỳ vọng: về như mục 1.
5. Mở một buổi của hôm qua, sang tab "Hôm nay" rồi quay lại "Nhật ký". Kỳ vọng: buổi đó đã gập lại, như mục 1.
6. Bật chế độ máy bay, ghi một cữ bú thử. Nhật ký: dòng đó có dấu đồng hồ "Chờ đồng bộ". Gập buổi đó. Kỳ vọng: dấu đồng hồ hiện trên hàng buổi. Tắt chế độ máy bay, chờ dấu mất, rồi mở dòng thử và xóa nó.
7. Bật Ban đêm. Kỳ vọng: hàng buổi vẫn tách được với dòng bản ghi, hàng "Không có bản ghi" đọc được, buổi mở và gập phân biệt được bằng mũi tên. Tắt Ban đêm.
8. Bật VoiceOver, vuốt tới một hàng buổi. Kỳ vọng: đọc tên buổi, tóm tắt, là nút, và "thu gọn" hoặc "mở rộng" đúng trạng thái. Tắt VoiceOver.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [x] **Step 10: Ghi kết quả vào hai file plan, hỏi người dùng trước khi commit docs và lên `main`**

Kết quả (2026-11-27): kết quả đã ghi bằng script vào hai file plan; khối `diff` vẫn áp ngược sạch (`git apply -R --check`). Người dùng chọn "Commit, ff main, push". Trước khi merge: `main` = `origin/main` = `e6fffab`, là tổ tiên của nhánh.

Đánh dấu `[x]` các bước đã làm và ghi số đo thật (bằng script, không Edit/Write). Rồi hỏi người dùng một câu: commit spec, plan và Bước 40 rồi đưa nhánh lên `main` (fast-forward rồi push), hay để lại trên nhánh. Chỉ làm khi họ đồng ý:

```bash
git add docs/device-checklist.md docs/blueprint/specs/2026-11-27-kim-bun-nhat-ky-theo-buoi-design.md docs/blueprint/plans/2026-11-27-kim-bun-nhat-ky-theo-buoi-a.md docs/blueprint/plans/2026-11-27-kim-bun-nhat-ky-theo-buoi-b.md
git commit -m "docs: Nhật ký by periods, spec, plan and step 40 of the device checklist" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-nhat-ky-theo-buoi
git push origin main
```

Expected: `git merge --ff-only` không báo lỗi (nếu `main` đã đi tiếp thì dừng và hỏi); push thành công; `git rev-parse --short main` và `git rev-parse --short origin/main` (chạy riêng từng lệnh) cho cùng một mã.
