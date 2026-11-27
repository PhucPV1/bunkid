# Kim Bun — Nhật ký gom theo buổi, plan A: luật chia buổi Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-27-kim-bun-nhat-ky-theo-buoi-design.md` (§3; §4.5 phần luật; §5.1)

**Status:** approved 2026-11-27

**Goal:** Có luật thuần, đủ test, chia các bản ghi của một ngày thành Đêm / Sáng / Chiều / Tối với tóm tắt, buổi mở sẵn và trạng thái mở, để plan B chỉ còn việc vẽ.

**Architecture:**

- **`lib/rules/dayPeriods.ts` (mới):** luật thuần: buổi của một bản ghi, các buổi của một ngày (`dayPeriods`), tóm tắt buổi, buổi mở sẵn (`defaultOpenPeriod`), trạng thái mở của mọi buổi (`openPeriods`), cắt "màn hình đầu" theo dòng của buổi đang mở (`firstScreenDays`).
- **`HistoryList`:** nhận các ngày đã chia buổi (`OpenPeriodDay<LogRow>[]`) và `onToggle`; vẽ dòng triệu chứng, rồi mỗi buổi một `<li>` (nút tiêu đề + `<ul>` lồng khi mở, hoặc hàng không bấm được).
- **`HistoryScreen`:** giữ lựa chọn gập/mở của người dùng trong state (`overrides`), xóa khi đổi chip lọc; `firstScreen` cũ trong `lib/rules/history.ts` bị bỏ, thay bằng `firstScreenDays`.
- Không đổi dữ liệu, không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-nhat-ky-theo-buoi`, cắt từ `main` @ `e6fffab`. Baseline: `Test Files  219 passed (219)`, `Tests  2114 passed (2114)`, typecheck sạch.

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
    on' docs/blueprint/plans/2026-11-27-kim-bun-nhat-ky-theo-buoi-a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch của plan A và B (2 + 2) đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `e6fffab`, có `node_modules` riêng (`bun install --frozen-lockfile`). Mỗi task code là hai commit (test trước, code sau). Số test đỏ và xanh là số đo thật trên cả bộ test; `tsc --noEmit` sạch sau mỗi commit code. `bun run build` ở trạng thái cuối: lần đầu dừng ở `SecurityFatalError`, lần hai thoát 0, `Generating static pages … (42/42)`, `/nhat-ky` vẫn `○`. Trang fixture của plan B (Task 2) đã qua `tsc` và đã render thử bằng `renderToStaticMarkup` (kết quả ghi ở plan B, Task 2 Step 3). **Chưa chạy khi viết plan:** mọi bước trình duyệt.
- **Không sửa patch bằng công cụ có prettier.** Một hook PostToolUse chạy prettier lên mọi file `.md` vừa được Edit/Write, và nó đổi các dòng trống trong khối `diff` (patch hỏng). Ghi kết quả vào file plan này bằng một script (ví dụ `python3` mở file, thay chuỗi, ghi lại), không bằng Edit/Write.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài spec.
- **`bun run build` và `bun run dev`** có thể dừng một hay vài lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 (`SecurityFatalError`); chạy lại đúng lệnh tới khi thoát 0. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Spec và hai file plan chưa được commit.** `git status` thấy spec `docs/blueprint/specs/2026-11-27-kim-bun-nhat-ky-theo-buoi-design.md` và hai file plan `…-nhat-ky-theo-buoi-{a,b}.md` là untracked. Plan A không commit chúng; task cuối của plan B commit cả ba, chỉ khi người dùng đồng ý.
- **Không push.** Plan A dừng trên nhánh; A và B lên `main` cùng nhau ở cuối plan B.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **Trình duyệt.** Theo `~/.claude/CLAUDE.md` của người dùng, mặc định là Claude in Chrome (`mcp__claude-in-chrome__*`): `tabs_context_mcp` trước, rồi mở tab mới bằng `tabs_create_mcp`, không dùng tab sẵn có của họ; cửa sổ Chrome không hẹp hơn 455 px, nên đo ở 455 thay cho 375 và ghi rõ. Khung Browser trong app (`mcp__Claude_Browser__*`, cỡ 375×812 bằng `resize_window` preset `mobile`) chỉ dùng khi người dùng chọn nó ở câu hỏi của Step 4. Gọi `navigate` trước, rồi `resize_window`. Trang fixture vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt khi xong. Bỏ phần tử `nextjs-portal` (huy hiệu dev) trước khi chụp. Bấm theo `ref` của `find`. Lọc console bằng `onlyErrors`, so số lỗi trước và sau một lần tải mới.
- **Chỉ xem trên trang thật.** Trên `/nhat-ky` thật chỉ được bấm hàng tiêu đề buổi và chip lọc; không mở rồi lưu bản ghi nào.

## Contracts with Other Plans

**Consumes:** chỉ code có sẵn trên `main` @ `e6fffab`.

**Produces (plan B dùng):**

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
- **Vitest sau plan A:** `Test Files  220 passed (220)`, `Tests  2137 passed (2137)`.

---

### Task 1: Luật chia buổi (spec §3)

**Files:**

- Create: `lib/rules/dayPeriods.ts`
- Test: `lib/rules/dayPeriods.test.ts`

**Interfaces:**

- Consumes: `vnDayStartMs` (`lib/rules/days.ts`), `LogLike` (`lib/rules/describeLog.ts`), `FIRST_SCREEN_ROWS`, `HistoryFilter`, `matchesFilter` (`lib/rules/history.ts`), `groupFeedSessions` (`lib/rules/ratings.ts`), `shortDuration` (`lib/rules/summaryText.ts`), `vnDateString` (`lib/rules/time.ts`).
- Produces: mọi tên của `lib/rules/dayPeriods.ts` trong Contracts.

- [x] **Step 0: Tạo nhánh và đo baseline**

Kết quả (2026-11-27): `main` = `e6fffab`; nhánh `feat/kim-bun-nhat-ky-theo-buoi` tạo từ đó; `Test Files  219 passed (219)`, `Tests  2114 passed (2114)`.

```bash
git checkout main
git rev-parse --short main   # e6fffab
git checkout -b feat/kim-bun-nhat-ky-theo-buoi
bunx vitest run   # Test Files  219 passed (219), Tests  2114 passed (2114)
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

Kết quả (2026-11-27): Patch 1 áp sạch bằng `kb_patch 1 | git apply --verbose`.

Test phủ §5.1 của spec: mốc 05:59/06:00/11:59/12:00/17:59/18:00/23:59; ngày cũ đủ 4 buổi; hôm nay lúc 10:00 và 12:00 đúng; bản ghi bắt đầu 12:00:20 khi bây giờ là 11:59:40; lọc "Bú"; tóm tắt "3 cữ · 2 tã · ngủ 2g 10p", "1 tã", "ngủ 4g 20p", "1 mục"; cữ vắt qua 12:00 tính ở Sáng, Chiều "1 mục"; giấc 21:00–06:30 cho Đêm `"sleepOnly"` "ngủ 6g", giấc 23:00–05:00 cho "ngủ 5g"; tổng phút ngủ các buổi bằng của `daySummary`; giấc đang chạy; triệu chứng tách ra; `defaultOpenPeriod`; `openPeriods`; `firstScreenDays`.

```diff
diff --git a/lib/rules/dayPeriods.test.ts b/lib/rules/dayPeriods.test.ts
new file mode 100644
index 0000000..86ac3db
--- /dev/null
+++ b/lib/rules/dayPeriods.test.ts
@@ -0,0 +1,473 @@
+import { describe, expect, it } from "vitest";
+import {
+  DAY_PERIODS,
+  dayPeriods,
+  defaultOpenPeriod,
+  firstScreenDays,
+  openPeriods,
+  periodListId,
+  periodOf,
+  periodOpenKey,
+  periodSummary,
+  type OpenPeriodDay,
+} from "./dayPeriods";
+import { daySummary } from "./history";
+
+// A VN wall-clock time on a VN day, as the ISO string logs carry.
+const vn = (hhmm: string, day = "2026-11-14") =>
+  new Date(`${day}T${hhmm}+07:00`).toISOString();
+const entry = (
+  type: string,
+  start: string,
+  end: string | null = start,
+  details: unknown = {},
+) => ({ type, started_at: start, ended_at: end, details });
+const keys = (periods: { key: string }[]) => periods.map((p) => p.key);
+const AFTER = new Date(vn("09:00", "2026-11-16")); // two days later
+
+describe("periodOf", () => {
+  it("cuts the VN day at 6, 12 and 18 o'clock", () => {
+    expect(periodOf(vn("00:00"))).toBe("night");
+    expect(periodOf(vn("05:59"))).toBe("night");
+    expect(periodOf(vn("06:00"))).toBe("morning");
+    expect(periodOf(vn("11:59"))).toBe("morning");
+    expect(periodOf(vn("12:00"))).toBe("afternoon");
+    expect(periodOf(vn("17:59"))).toBe("afternoon");
+    expect(periodOf(vn("18:00"))).toBe("evening");
+    expect(periodOf(vn("23:59"))).toBe("evening");
+  });
+
+  it("labels the periods latest first", () => {
+    expect(DAY_PERIODS.map((p) => p.label)).toEqual([
+      "Tối · 18–24 giờ",
+      "Chiều · 12–18 giờ",
+      "Sáng · 6–12 giờ",
+      "Đêm · 0–6 giờ",
+    ]);
+  });
+});
+
+describe("periodSummary", () => {
+  it("drops the parts that are 0, and counts the logs when all three are", () => {
+    expect(
+      periodSummary({ feeds: 3, diapers: 2, sleepMinutes: 130, count: 9 }),
+    ).toBe("3 cữ · 2 tã · ngủ 2g 10p");
+    expect(
+      periodSummary({ feeds: 0, diapers: 1, sleepMinutes: 0, count: 1 }),
+    ).toBe("1 tã");
+    expect(
+      periodSummary({ feeds: 0, diapers: 0, sleepMinutes: 260, count: 0 }),
+    ).toBe("ngủ 4g 20p");
+    expect(
+      periodSummary({ feeds: 0, diapers: 0, sleepMinutes: 0, count: 1 }),
+    ).toBe("1 mục");
+  });
+});
+
+describe("dayPeriods", () => {
+  it("a past day has all four periods, latest first; one with nothing is empty", () => {
+    const logs = [
+      entry("diaper", vn("13:00"), vn("13:00"), { wet: true, dirty: false }),
+    ];
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs,
+      all: logs,
+      filter: "all",
+      now: AFTER,
+    });
+    expect(keys(periods)).toEqual(["evening", "afternoon", "morning", "night"]);
+    expect(periods[1]).toEqual({
+      key: "afternoon",
+      label: "Chiều · 12–18 giờ",
+      summary: "1 tã",
+      logs,
+      kind: "logs",
+    });
+    expect(periods[0]).toEqual({
+      key: "evening",
+      label: "Tối · 18–24 giờ",
+      summary: "",
+      logs: [],
+      kind: "empty",
+    });
+  });
+
+  it("today shows the periods that have begun", () => {
+    const at10 = dayPeriods({
+      day: "2026-11-14",
+      logs: [],
+      all: [],
+      filter: "all",
+      now: new Date(vn("10:00")),
+    });
+    expect(keys(at10.periods)).toEqual(["morning", "night"]);
+    const at12 = dayPeriods({
+      day: "2026-11-14",
+      logs: [],
+      all: [],
+      filter: "all",
+      now: new Date(vn("12:00")),
+    });
+    expect(keys(at12.periods)).toEqual(["afternoon", "morning", "night"]);
+  });
+
+  it("today keeps a period whose log starts a moment after now", () => {
+    const early = entry("bottle", vn("12:00:20"), vn("12:00:20"), {
+      ml: 90,
+      milk: "formula",
+    });
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs: [early],
+      all: [early],
+      filter: "all",
+      now: new Date(vn("11:59:40")),
+    });
+    expect(keys(periods)).toEqual(["afternoon", "morning", "night"]);
+    expect(periods[0].kind).toBe("logs");
+    expect(periods[0].logs).toEqual([early]);
+  });
+
+  it("a filter keeps only the periods with a matching log, and their matching logs", () => {
+    const bottle = entry("bottle", vn("07:00"), vn("07:00"), {
+      ml: 90,
+      milk: "formula",
+    });
+    const diaper = entry("diaper", vn("08:00"), vn("08:00"), {
+      wet: true,
+      dirty: false,
+    });
+    const nap = entry("sleep", vn("13:00"), vn("14:00"));
+    const night = entry("sleep", vn("21:00", "2026-11-13"), vn("05:00"));
+    const logs = [nap, diaper, bottle];
+    const all = [...logs, night];
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs,
+      all,
+      filter: "feed",
+      now: AFTER,
+    });
+    expect(keys(periods)).toEqual(["morning"]);
+    expect(periods[0].logs).toEqual([bottle]);
+    // The summary still counts every log of the period.
+    expect(periods[0].summary).toBe("1 cữ · 1 tã");
+    expect(
+      keys(
+        dayPeriods({ day: "2026-11-14", logs, all, filter: "all", now: AFTER })
+          .periods,
+      ),
+    ).toEqual(["evening", "afternoon", "morning", "night"]);
+  });
+
+  it("counts feed sessions, diapers and sleep in the summary", () => {
+    const logs = [
+      entry("sleep", vn("09:50"), vn("11:00")),
+      entry("diaper", vn("09:40"), vn("09:40"), { wet: true, dirty: true }),
+      entry("bottle", vn("09:30"), vn("09:30"), { ml: 90, milk: "formula" }),
+      entry("breast", vn("08:00"), vn("08:15"), { side: "left" }),
+      entry("breast", vn("08:20"), vn("08:30"), { side: "right" }),
+      entry("diaper", vn("07:10"), vn("07:10"), { wet: true, dirty: false }),
+      entry("sleep", vn("06:30"), vn("07:30")),
+      entry("breast", vn("06:10"), vn("06:25"), { side: "left" }),
+    ];
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs,
+      all: logs,
+      filter: "all",
+      now: AFTER,
+    });
+    expect(periods[2].summary).toBe("3 cữ · 2 tã · ngủ 2g 10p");
+  });
+
+  it("a feed across a boundary counts once, where it began", () => {
+    const left = entry("breast", vn("11:55"), vn("12:00"), { side: "left" });
+    const right = entry("breast", vn("12:05"), vn("12:15"), { side: "right" });
+    const logs = [right, left];
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs,
+      all: logs,
+      filter: "all",
+      now: AFTER,
+    });
+    expect(periods[1]).toMatchObject({ key: "afternoon", summary: "1 mục" });
+    expect(periods[2]).toMatchObject({ key: "morning", summary: "1 cữ" });
+  });
+
+  it("a period with only medicine counts its logs", () => {
+    const dose = entry("medicine", vn("07:00"), vn("07:00"), {
+      name: "Vitamin D3",
+      amount: 1,
+      unit: "giọt",
+    });
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs: [dose],
+      all: [dose],
+      filter: "all",
+      now: AFTER,
+    });
+    expect(periods[2].summary).toBe("1 mục");
+  });
+
+  it("a night that began the evening before makes Đêm sleep-only", () => {
+    const night = entry("sleep", vn("21:00", "2026-11-13"), vn("06:30"));
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs: [],
+      all: [night],
+      filter: "all",
+      now: AFTER,
+    });
+    expect(periods[3]).toEqual({
+      key: "night",
+      label: "Đêm · 0–6 giờ",
+      summary: "ngủ 6g",
+      logs: [],
+      kind: "sleepOnly",
+    });
+    expect(periods[2]).toMatchObject({ kind: "sleepOnly", summary: "ngủ 30p" });
+    const short = entry("sleep", vn("23:00", "2026-11-13"), vn("05:00"));
+    expect(
+      dayPeriods({
+        day: "2026-11-14",
+        logs: [],
+        all: [short],
+        filter: "all",
+        now: AFTER,
+      }).periods[3].summary,
+    ).toBe("ngủ 5g");
+  });
+
+  it("the periods' sleep adds up to the day's", () => {
+    const night = entry("sleep", vn("21:00", "2026-11-13"), vn("06:30"));
+    const nap = entry("sleep", vn("11:20"), vn("13:05"));
+    const evening = entry("sleep", vn("19:00"), vn("02:00", "2026-11-15"));
+    const logs = [evening, nap];
+    const all = [...logs, night];
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs,
+      all,
+      filter: "all",
+      now: AFTER,
+    });
+    expect(periods.map((p) => p.summary)).toEqual([
+      "ngủ 5g",
+      "ngủ 1g 5p",
+      "ngủ 1g 10p",
+      "ngủ 6g",
+    ]);
+    expect(daySummary({ day: "2026-11-14", logs, all, now: AFTER })).toBe(
+      "0 cữ · 0 tã · ngủ 13g 15p",
+    );
+  });
+
+  it("counts a running sleep up to now", () => {
+    const running = entry("sleep", vn("09:00"), null);
+    const { periods } = dayPeriods({
+      day: "2026-11-14",
+      logs: [running],
+      all: [running],
+      filter: "all",
+      now: new Date(vn("09:45")),
+    });
+    expect(periods[0]).toMatchObject({ key: "morning", summary: "ngủ 45p" });
+  });
+
+  it("symptom logs go above the periods and leave them as they were", () => {
+    const symptom = entry("symptom", vn("12:00"), vn("12:00"), {
+      codes: ["cough"],
+    });
+    const out = dayPeriods({
+      day: "2026-11-14",
+      logs: [symptom],
+      all: [symptom],
+      filter: "all",
+      now: AFTER,
+    });
+    expect(out.symptoms).toEqual([symptom]);
+    expect(out.periods.every((p) => p.kind === "empty")).toBe(true);
+    expect(
+      dayPeriods({
+        day: "2026-11-14",
+        logs: [symptom],
+        all: [symptom],
+        filter: "temperature",
+        now: AFTER,
+      }).symptoms,
+    ).toEqual([symptom]);
+    expect(
+      dayPeriods({
+        day: "2026-11-14",
+        logs: [symptom],
+        all: [symptom],
+        filter: "feed",
+        now: AFTER,
+      }),
+    ).toEqual({ symptoms: [], periods: [] });
+  });
+});
+
+describe("defaultOpenPeriod", () => {
+  const day = (name: string, kinds: [string, string][]) => ({
+    day: name,
+    periods: kinds.map(([key, kind]) => ({ key, kind })) as {
+      key: "night" | "morning" | "afternoon" | "evening";
+      kind: "logs" | "sleepOnly" | "empty";
+    }[],
+  });
+
+  it("is today's latest period with logs", () => {
+    const now = new Date(vn("12:05"));
+    const days = [
+      day("2026-11-14", [
+        ["afternoon", "empty"],
+        ["morning", "logs"],
+        ["night", "logs"],
+      ]),
+      day("2026-11-13", [["evening", "logs"]]),
+    ];
+    expect(defaultOpenPeriod(days, now)).toBe("2026-11-14|morning");
+  });
+
+  it("is none when today has no logs or is not loaded", () => {
+    const now = new Date(vn("12:05"));
+    expect(
+      defaultOpenPeriod(
+        [
+          day("2026-11-14", [
+            ["afternoon", "empty"],
+            ["morning", "sleepOnly"],
+          ]),
+        ],
+        now,
+      ),
+    ).toBeNull();
+    expect(
+      defaultOpenPeriod([day("2026-11-13", [["evening", "logs"]])], now),
+    ).toBeNull();
+  });
+});
+
+describe("periodOpenKey and periodListId", () => {
+  it("name a period of a day", () => {
+    expect(periodOpenKey("2026-11-14", "afternoon")).toBe(
+      "2026-11-14|afternoon",
+    );
+    expect(periodListId("2026-11-14", "afternoon")).toBe(
+      "p-2026-11-14-afternoon",
+    );
+  });
+});
+
+describe("openPeriods", () => {
+  const p = (key: "night" | "morning" | "evening", kind: string) => ({
+    key,
+    label: key,
+    summary: "",
+    logs: kind === "logs" ? ["x"] : [],
+    kind: kind as "logs" | "sleepOnly" | "empty",
+  });
+  const days = [
+    {
+      day: "2026-11-14",
+      summary: "",
+      symptoms: [],
+      periods: [p("morning", "logs"), p("night", "logs")],
+    },
+    {
+      day: "2026-11-13",
+      summary: "",
+      symptoms: [],
+      periods: [p("evening", "logs"), p("night", "sleepOnly")],
+    },
+  ];
+  const now = new Date(vn("10:00"));
+  const open = (out: OpenPeriodDay<string>[]) =>
+    out.flatMap((d) => d.periods.map((x) => x.open));
+
+  it("Tất cả opens only the default period", () => {
+    expect(
+      open(openPeriods(days, { filter: "all", now, overrides: {} })),
+    ).toEqual([true, false, false, false]);
+  });
+
+  it("a tap overrides the default either way", () => {
+    expect(
+      open(
+        openPeriods(days, {
+          filter: "all",
+          now,
+          overrides: {
+            "2026-11-14|morning": false,
+            "2026-11-13|evening": true,
+          },
+        }),
+      ),
+    ).toEqual([false, false, true, false]);
+  });
+
+  it("a filter opens every period with logs; a sleep-only period never opens", () => {
+    expect(
+      open(openPeriods(days, { filter: "feed", now, overrides: {} })),
+    ).toEqual([true, true, true, false]);
+    expect(
+      open(
+        openPeriods(days, {
+          filter: "feed",
+          now,
+          overrides: { "2026-11-14|night": false, "2026-11-13|night": true },
+        }),
+      ),
+    ).toEqual([true, false, true, false]);
+  });
+});
+
+describe("firstScreenDays", () => {
+  const p = (key: "night" | "morning", count: number, open: boolean) => ({
+    key,
+    label: key,
+    summary: "",
+    logs: Array.from({ length: count }, (_, i) => `${key}-${i}`),
+    kind: "logs" as const,
+    open,
+  });
+  const d = (
+    day: string,
+    symptoms: number,
+    periods: ReturnType<typeof p>[],
+  ): OpenPeriodDay<string> => ({
+    day,
+    summary: "",
+    symptoms: Array.from({ length: symptoms }, (_, i) => `${day}-s${i}`),
+    periods,
+  });
+
+  it("counts only symptom rows and rows of open periods", () => {
+    const days = [
+      d("a", 1, [p("morning", 5, true), p("night", 30, false)]),
+      d("b", 0, [p("morning", 20, false)]),
+    ];
+    expect(firstScreenDays(days, 12)).toEqual(days);
+  });
+
+  it("cuts the open rows it reaches to the budget, and stops at the next day", () => {
+    const days = [
+      d("a", 2, [p("morning", 8, true), p("night", 6, true)]),
+      d("b", 0, [p("morning", 3, true)]),
+    ];
+    const shown = firstScreenDays(days, 12);
+    expect(shown).toHaveLength(1);
+    expect(shown[0].symptoms).toHaveLength(2);
+    expect(shown[0].periods.map((x) => x.logs.length)).toEqual([8, 2]);
+    expect(days[0].periods[1].logs).toHaveLength(6);
+  });
+
+  it("returns every day when they fit", () => {
+    expect(firstScreenDays([], 12)).toEqual([]);
+  });
+});
```

- [x] **Step 2: Chạy, thấy đỏ**

Kết quả (2026-11-27): `Test Files  1 failed | 219 passed (220)`, `Tests  2114 passed (2114)`; file hỏng `lib/rules/dayPeriods.test.ts`, đúng như dự kiến.

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 219 passed (220)`, `Tests  2114 passed (2114)`; file hỏng là `lib/rules/dayPeriods.test.ts` vì chưa có `./dayPeriods`.

- [x] **Step 3: Commit test**

Kết quả (2026-11-27): commit `1370e43`.

```bash
git add lib/rules/dayPeriods.test.ts
git commit -m "test(history): periods of a day in Nhật ký" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 4: Viết luật (Patch 2)**

Kết quả (2026-11-27): Patch 2 áp sạch.

```diff
diff --git a/lib/rules/dayPeriods.ts b/lib/rules/dayPeriods.ts
new file mode 100644
index 0000000..3e874be
--- /dev/null
+++ b/lib/rules/dayPeriods.ts
@@ -0,0 +1,221 @@
+import { vnDayStartMs } from "./days";
+import type { LogLike } from "./describeLog";
+import {
+  FIRST_SCREEN_ROWS,
+  type HistoryFilter,
+  matchesFilter,
+} from "./history";
+import { groupFeedSessions } from "./ratings";
+import { shortDuration } from "./summaryText";
+import { vnDateString } from "./time";
+
+// Spec 2026-11-27 (Nhật ký theo buổi) §3.1: the periods of a VN day, latest
+// first, the order Nhật ký shows them in.
+export type DayPeriodKey = "night" | "morning" | "afternoon" | "evening";
+
+export const DAY_PERIODS: readonly {
+  key: DayPeriodKey;
+  label: string;
+  fromHour: number;
+}[] = [
+  { key: "evening", label: "Tối · 18–24 giờ", fromHour: 18 },
+  { key: "afternoon", label: "Chiều · 12–18 giờ", fromHour: 12 },
+  { key: "morning", label: "Sáng · 6–12 giờ", fromHour: 6 },
+  { key: "night", label: "Đêm · 0–6 giờ", fromHour: 0 },
+];
+
+const HOUR_MS = 3_600_000;
+const PERIOD_MS = 6 * HOUR_MS;
+const VN_OFFSET_MS = 7 * HOUR_MS; // Vietnam has no daylight saving time.
+
+// The period a log belongs to: the VN hour it started.
+export function periodOf(startedAt: string): DayPeriodKey {
+  const hour = new Date(Date.parse(startedAt) + VN_OFFSET_MS).getUTCHours();
+  if (hour < 6) return "night";
+  if (hour < 12) return "morning";
+  if (hour < 18) return "afternoon";
+  return "evening";
+}
+
+// §3.2: "logs" when a log (not a symptom) started in the period; "sleepOnly"
+// when none did but a sleep from before runs into it; "empty" otherwise.
+export type PeriodKind = "logs" | "sleepOnly" | "empty";
+
+export type DayPeriod<T> = {
+  key: DayPeriodKey;
+  label: string;
+  summary: string;
+  logs: T[];
+  kind: PeriodKind;
+};
+
+// §3.3: "3 cữ · 2 tã · ngủ 2g 10p" without the parts that are 0; "N mục"
+// when all three are.
+export function periodSummary(input: {
+  feeds: number;
+  diapers: number;
+  sleepMinutes: number;
+  count: number;
+}): string {
+  const parts: string[] = [];
+  if (input.feeds > 0) parts.push(`${input.feeds} cữ`);
+  if (input.diapers > 0) parts.push(`${input.diapers} tã`);
+  if (input.sleepMinutes > 0)
+    parts.push(`ngủ ${shortDuration(input.sleepMinutes)}`);
+  return parts.length > 0 ? parts.join(" · ") : `${input.count} mục`;
+}
+
+// Sleep inside [from, to), cut at both edges like daySummary cuts at midnight.
+function sleepMs(all: LogLike[], from: number, to: number, now: Date): number {
+  let total = 0;
+  for (const log of all) {
+    if (log.type !== "sleep") continue;
+    const start = Math.max(Date.parse(log.started_at), from);
+    const end = Math.min(
+      log.ended_at ? Date.parse(log.ended_at) : now.getTime(),
+      to,
+    );
+    if (end > start) total += end - start;
+  }
+  return total;
+}
+
+// §3.2–§3.4. `logs` are the logs that started on `day`, newest first (as
+// groupByVnDay leaves them); `all` is every loaded log, where a sleep from the
+// evening before comes from. Symptom logs are for the whole day and go above
+// the periods.
+export function dayPeriods<T extends LogLike>(input: {
+  day: string;
+  logs: T[];
+  all: LogLike[];
+  filter: HistoryFilter;
+  now: Date;
+}): { symptoms: T[]; periods: DayPeriod<T>[] } {
+  const { day, logs, all, filter, now } = input;
+  const dayStart = vnDayStartMs(day);
+  const nowMs = now.getTime();
+  const isToday = day === vnDateString(now);
+  const symptoms = logs.filter(
+    (log) => log.type === "symptom" && matchesFilter(log, filter),
+  );
+  const rest = logs.filter((log) => log.type !== "symptom");
+  // Sessions of the whole day, so a feed across a boundary counts once.
+  const sessions = groupFeedSessions(rest, now);
+  const periods: DayPeriod<T>[] = [];
+  for (const period of DAY_PERIODS) {
+    const from = dayStart + period.fromHour * HOUR_MS;
+    const to = from + PERIOD_MS;
+    const own = rest.filter((log) => periodOf(log.started_at) === period.key);
+    const sleepMinutes = Math.round(
+      sleepMs(all, from, Math.min(to, nowMs), now) / 60_000,
+    );
+    const kind: PeriodKind =
+      own.length > 0 ? "logs" : sleepMinutes > 0 ? "sleepOnly" : "empty";
+    // Today stops at the period under way, but a log never disappears.
+    if (isToday && from > nowMs && kind !== "logs") continue;
+    const shown = own.filter((log) => matchesFilter(log, filter));
+    if (filter !== "all" && shown.length === 0) continue;
+    periods.push({
+      key: period.key,
+      label: period.label,
+      logs: shown,
+      kind,
+      summary:
+        kind === "empty"
+          ? ""
+          : periodSummary({
+              feeds: sessions.filter((s) => s.start >= from && s.start < to)
+                .length,
+              diapers: own.filter((log) => log.type === "diaper").length,
+              sleepMinutes,
+              count: own.length,
+            }),
+    });
+  }
+  return { symptoms, periods };
+}
+
+export function periodOpenKey(day: string, key: DayPeriodKey): string {
+  return `${day}|${key}`;
+}
+
+// §4.1: the id of the list of a period's rows, for aria-controls.
+export function periodListId(day: string, key: DayPeriodKey): string {
+  return `p-${day}-${key}`;
+}
+
+// §3.5: today's latest period with logs, the one Tất cả opens by itself.
+export function defaultOpenPeriod(
+  days: readonly {
+    day: string;
+    periods: readonly { key: DayPeriodKey; kind: PeriodKind }[];
+  }[],
+  now: Date,
+): string | null {
+  const today = days.find((d) => d.day === vnDateString(now));
+  const period = today?.periods.find((p) => p.kind === "logs");
+  return today && period ? periodOpenKey(today.day, period.key) : null;
+}
+
+export type PeriodDay<T> = {
+  day: string;
+  summary: string;
+  symptoms: T[];
+  periods: DayPeriod<T>[];
+};
+export type OpenDayPeriod<T> = DayPeriod<T> & { open: boolean };
+export type OpenPeriodDay<T> = Omit<PeriodDay<T>, "periods"> & {
+  periods: OpenDayPeriod<T>[];
+};
+
+// §3.5: a filter opens every period with logs; Tất cả opens the default one.
+// A tap (`overrides`, by periodOpenKey) wins either way. Only "logs" periods
+// open.
+export function openPeriods<T>(
+  days: PeriodDay<T>[],
+  input: {
+    filter: HistoryFilter;
+    now: Date;
+    overrides: Readonly<Record<string, boolean>>;
+  },
+): OpenPeriodDay<T>[] {
+  const defaultKey =
+    input.filter === "all" ? defaultOpenPeriod(days, input.now) : null;
+  return days.map((d) => ({
+    ...d,
+    periods: d.periods.map((p) => {
+      const key = periodOpenKey(d.day, p.key);
+      const open =
+        p.kind === "logs" &&
+        (input.overrides[key] ??
+          (input.filter !== "all" || key === defaultKey));
+      return { ...p, open };
+    }),
+  }));
+}
+
+// §4.5: the rows a phone screen shows first. Only symptom rows and rows of
+// open periods count; headers do not.
+export function firstScreenDays<T>(
+  days: OpenPeriodDay<T>[],
+  rows = FIRST_SCREEN_ROWS,
+): OpenPeriodDay<T>[] {
+  const out: OpenPeriodDay<T>[] = [];
+  let left = rows;
+  for (const day of days) {
+    if (left <= 0) break;
+    const symptoms = day.symptoms.slice(0, left);
+    left -= symptoms.length;
+    let cut = symptoms.length < day.symptoms.length;
+    const periods = day.periods.map((p) => {
+      if (!p.open) return p;
+      const logs = p.logs.slice(0, Math.max(left, 0));
+      left -= logs.length;
+      if (logs.length === p.logs.length) return p;
+      cut = true;
+      return { ...p, logs };
+    });
+    out.push(cut ? { ...day, symptoms, periods } : day);
+  }
+  return out;
+}
```

- [x] **Step 5: Chạy, thấy xanh**

Kết quả (2026-11-27): file mới `Tests  23 passed (23)`; `tsc --noEmit` sạch; cả bộ `Test Files  220 passed (220)`, `Tests  2137 passed (2137)`.

Run: `bunx vitest run lib/rules/dayPeriods.test.ts && bun run typecheck && bunx vitest run`
Expected: `Tests  23 passed (23)` cho file mới; `tsc --noEmit` không báo lỗi; cả bộ `Test Files  220 passed (220)`, `Tests  2137 passed (2137)`.

- [x] **Step 6: Commit**

Kết quả (2026-11-27): commit `46d5513`.

```bash
git add lib/rules/dayPeriods.ts
git commit -m "feat(history): periods of a day in Nhật ký" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 7: Dừng, chưa push**

Kết quả (2026-11-27): không push; plan B chạy tiếp trên cùng nhánh.

Plan A xong trên nhánh `feat/kim-bun-nhat-ky-theo-buoi`. Không push, không merge: plan B chạy tiếp trên cùng nhánh này.
