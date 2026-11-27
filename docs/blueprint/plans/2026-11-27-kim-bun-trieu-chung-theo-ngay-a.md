# Kim Bun — Triệu chứng theo ngày, plan A: luật, báo cáo và Nhật ký Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-27-kim-bun-trieu-chung-theo-ngay-design.md` (§3 toàn bộ; §4.1 phần "Ghi bù"; §4.3 phần `startOfDayIso` và dải ngày dạng luật; §6.2 phần luật và cột giờ; §6.3; phần tương ứng của §7)

**Status:** approved 2026-11-27

**Goal:** App có mọi luật của "triệu chứng theo ngày" (gộp theo ngày, lưu, xóa, dải ngày, thuộc đợt ốm theo ngày lịch); báo cáo và Nhật ký đã đọc triệu chứng theo ngày; "Ghi bù" không còn "Triệu chứng". Phiếu mới đến ở plan B.

**Architecture:**

- **File luật mới `lib/rules/symptomDay.ts`:** `symptomDay` (đọc một ngày: bản ghi của mình, mã bị khóa, ghi chú), `symptomDaySave` (trả danh sách thao tác insert / update / delete), `symptomDayDelete`, `canDeleteDay`, `dayStrip` (các ô của dải ngày). Không gọi dữ liệu; component của plan B chạy các thao tác bằng `useSaveLog` / `useDeleteLog`.
- **`lib/rules/illness.ts`:** hàm mới `symptomInEpisode` (thuộc đợt theo ngày lịch VN); `symptomEntries` dùng nó. `startOfDayIso` chuyển sang `lib/rules/days.ts` và được export.
- **`lib/rules/report.ts`:** `episodeReportLogs` (lọc bản ghi của kỳ "Đợt ốm": triệu chứng theo ngày, loại khác theo giờ) và `symptomRows` gộp theo ngày. `ReportScreen` dùng `episodeReportLogs`, cột đầu đổi tên "Ngày".
- **`lib/rules/history.ts`:** `groupByVnDay` cho bản ghi triệu chứng đứng đầu ngày; `logTimeText` ("Cả ngày" cho triệu chứng). `HistoryList` và `RecentCard` dùng `logTimeText`. `MANUAL_TYPES` bỏ "Triệu chứng".
- Không migration, không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Zod, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-trieu-chung-theo-ngay-a`, cắt từ `main` @ `5b90853`. Baseline: 2062 test vitest xanh (215 file), typecheck sạch.

**Các plan của spec này:**

| Plan | Nội dung | File |
| --- | --- | --- |
| A | Luật thuần (§3), báo cáo theo ngày (§6.3), Nhật ký "Cả ngày" và thứ tự (§6.2), bỏ "Triệu chứng" khỏi "Ghi bù" (§4.1). Chưa có phiếu mới. | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-a.md` |
| B | Chip khóa (§5.3), phiếu `SymptomDaySheet` với dải ngày (§4, §5), "+" và thẻ đợt ốm mở phiếu mới (§4.1). | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-b.md` |
| C | Nút "Sửa"/"Ghi triệu chứng" ở "Từng ngày" (§6.1), Nhật ký mở phiếu của ngày (§6.2), kiểm trình duyệt cho cả B và C, Bước 39 của checklist (§7). | `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-c.md` |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Spec cắt làm ba plan** vì một plan sẽ dài quá 3.000 dòng. Plan A xong thì app vẫn chạy đủ: phiếu "Triệu chứng" cũ (có "Lúc nào?") còn đó tới plan B. Trong khoảng giữa A và B, Nhật ký đã ghi "Cả ngày" cho mọi bản ghi triệu chứng, kể cả bản ghi vừa lưu bằng phiếu cũ có giờ; chấp nhận được, vì spec coi triệu chứng là của cả ngày. Cũng trong khoảng đó, "Ghi bù" không còn "Triệu chứng" mà dải ngày chưa có: ghi cho ngày trước chỉ còn "Giờ khác" của phiếu cũ. Task 6 hỏi người dùng có muốn chờ B, C rồi lên `main` cùng không.
2. **`symptomInEpisode` so chuỗi ngày `YYYY-MM-DD`.** Ngày cuối của đợt đang mở là hôm nay theo `now`; của đợt đã đóng là ngày của `ended_at`.
3. **Bảng "Triệu chứng" của Báo cáo giữ tên trường `at`** (nay là "dd/MM") để `ReportScreen` chỉ đổi chữ đầu cột. Một ngày chỉ còn mã lạ vẫn có hàng, ô Triệu chứng để trống (như cũ với một bản ghi).
4. **Test cũ của kỳ "Đợt ốm" đổi kỳ vọng:** bản ghi "Nôn" lúc 20:05 ngày bắt đầu đợt (đợt mở 23:30) trước đây không thuộc đợt, nay thuộc (spec §3.4). Đó là thay đổi spec muốn.
5. **`symptomDay` xếp bản ghi theo `started_at`, cùng giờ thì theo `id`,** để "bản ghi cũ nhất" (bản được giữ khi gộp) không phụ thuộc thứ tự mảng.
6. **Giới hạn ghi chú 200 tính như `zod` `.max(200)`** (đơn vị UTF-16, `note.trim().length`), để lời báo "Ghi chú dài quá 200 ký tự" và schema không bao giờ lệch nhau.
7. **"Không đổi gì" còn gồm trường hợp `own` rỗng và `ownCodes` rỗng** (chỉ còn chip khóa): không thao tác. **Lưu không bao giờ xóa trọn một ngày** (spec §7): không chip nào bật và không chip khóa thì `symptomDaySave` trả danh sách rỗng, kể cả khi ngày có bản ghi của mình (phiếu vốn đã tắt "Lưu" lúc đó; đây là chốt chặn thứ hai, có test). Chỉ khi còn chip khóa thì Lưu mới bỏ được phần của mình.
8. **`dayStrip` bỏ ngày trước ngày sinh ở cả hai kiểu dải.** Thứ viết tắt lấy theo `getUTCDay` của chuỗi ngày: "CN", "T2"…"T7".
9. **`groupByVnDay` nhận kiểu `{ started_at: string; type?: string }`** để các chỗ gọi cũ (và test cũ không có `type`) vẫn biên dịch.
10. **`LogEditSheet`, `FieldList` (kiểu `"symptoms"`) và `QUICK_FIELDS.symptom` được giữ.** `QUICK_FIELDS.symptom` còn được `LOG_FIELDS` (kiểu `Record<LogType, …>`), `buildDetails` và `defaultQuickValues` dùng; bỏ chúng là đụng tới nhiều file mà không đổi gì cho người dùng. Sau plan C không đường nào mở `LogEditSheet` cho bản ghi triệu chứng.
11. **Plan A không có bước trình duyệt.** Ba chỗ hiện ra (chữ "Cả ngày", đầu cột "Ngày", danh sách "Loại" của "Ghi bù") được kiểm bằng test render, và được xem trong trình duyệt ở plan C.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 10** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 10 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `5b90853`; bản sao có `node_modules` riêng (`bun install --frozen-lockfile`; một symlink tới `node_modules` của repo làm `next build` của Turbopack từ chối). Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. `bun run build` thoát 0 ở trạng thái cuối của plan này (42/42; lần đo này chạy qua ngay, lần chạy thử trước đó dừng một lần ở thông báo bảo mật). Sau khi viết (và sau lượt sửa theo reviewer), các patch được trích lại từ chính file này bằng `kb_patch` và áp lên một bản sao sạch khác: kết quả như trên.
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

Plan này đứng đầu. Plan B và C dùng mọi thứ dưới mục Produces.

**Consumes (đã ở `main`):** `detailsSchemas` (`lib/rules/logDetails.ts`); `joinCodes`, `parseCodes`, `symptomShorts` (`lib/rules/symptomForm.ts`); `TRIAGE` (`lib/content/triage.ts`); `vnDateString`, `formatVnTime` (`lib/rules/time.ts`); `addDays`, `formatDayShort`, `vnDayStartMs` (`lib/rules/days.ts`); `belongsTo`, `EpisodeLike`, `symptomEntries`, `episodeDays` (`lib/rules/illness.ts`); `LogPatch` (`lib/rules/logForm.ts`); `groupByVnDay`, `canModifyLog` (`lib/rules/history.ts`).

**Produces:**

- `lib/rules/days.ts`: `startOfDayIso(day: string): string` (nửa đêm VN, chuỗi ISO).
- `lib/rules/illness.ts`: `symptomInEpisode(log: { started_at: string }, episode: EpisodeLike, now: Date): boolean`; `symptomEntries` dùng nó.
- `lib/rules/report.ts`: `episodeReportLogs<T extends { type: string; started_at: string }>(logs: T[], episode: EpisodeLike, now: Date): T[]`; `symptomRows(logs, fromMs)` trả mỗi ngày một hàng `{ at: "dd/MM", text, note }`.
- `lib/rules/symptomDay.ts`:
  - `type SymptomLog = { id: string; type: string; started_at: string; ended_at: string | null; details: unknown; note: string | null; created_by: string }` (một `LogRow` vừa kiểu này)
  - `type SymptomDay = { day: string; logs: SymptomLog[]; own: SymptomLog[]; locked: string[]; codes: string[]; ownNote: string; otherNotes: string[] }`
  - `type SymptomOp = { op: "insert"; patch: LogPatch } | { op: "update"; id: string; patch: LogPatch } | { op: "delete"; id: string }`
  - `NOTE_TOO_LONG = "Ghi chú dài quá 200 ký tự"`
  - `symptomDay(logs: readonly SymptomLog[], day: string, canModify: (createdBy: string) => boolean): SymptomDay`
  - `symptomDaySave(input: { day: SymptomDay; picked: readonly string[]; note: string; today: string; now: Date }): { ok: true; ops: SymptomOp[] } | { ok: false; message: string }`
  - `symptomDayDelete(day: SymptomDay): SymptomOp[]`; `canDeleteDay(day: SymptomDay): boolean`
  - `type StripDay = { day: string; top: string; bottom: string }`; `dayStrip(input: { episode: EpisodeLike | null; today: string; dob: string }): { label: string; days: StripDay[] }`
- `lib/rules/history.ts`: `groupByVnDay<T extends { started_at: string; type?: string }>` (triệu chứng đầu ngày, cũ trước); `logTimeText(log: { type: string; started_at: string }): string`.
- `lib/rules/logForm.ts`: `MANUAL_TYPES` 10 loại, không có `symptom`.
- `ReportScreen`: cột đầu bảng "Triệu chứng" tên "Ngày"; kỳ "Đợt ốm" lọc bằng `episodeReportLogs`.
- **Vitest sau plan A:** 2091 test, 216 file.

---

### Task 1: Ngày bắt đầu dạng ISO, và triệu chứng thuộc đợt theo ngày lịch (§3.4, §4.3)

**Files:**

- Modify: `lib/rules/days.ts`, `lib/rules/illness.ts`
- Test: `lib/rules/days.test.ts`, `lib/rules/illness.test.ts`

**Interfaces:**

- Consumes: `vnDayStartMs`, `vnDateString`, `EpisodeLike`, `symptomEntries`, `episodeDays`.
- Produces: `startOfDayIso(day)` trong `days.ts`; `symptomInEpisode(log, episode, now)` trong `illness.ts`; `symptomEntries` lọc bằng nó.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-trieu-chung-theo-ngay-a
git rev-parse --short HEAD   # 5b90853, hoặc mới hơn nếu main đã đi tiếp: khi đó số test nền khác, báo lại trước khi làm tiếp
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/days.test.ts b/lib/rules/days.test.ts
index c84d2ed..ce136f7 100644
--- a/lib/rules/days.test.ts
+++ b/lib/rules/days.test.ts
@@ -4,6 +4,7 @@ import {
   addMonths,
   formatDayFull,
   formatDayShort,
+  startOfDayIso,
   vnDayLabel,
   vnDayRange,
   vnDayStartMs,
@@ -16,6 +17,10 @@ describe("days", () => {
     );
   });
 
+  it("spec 2026-11-27 §4.3: startOfDayIso is VN midnight as an ISO string", () => {
+    expect(startOfDayIso("2026-11-14")).toBe("2026-11-13T17:00:00.000Z");
+  });
+
   it("addMonths keeps the day of month and clamps to the month's last day", () => {
     expect(addMonths("2026-01-15", 12)).toBe("2027-01-15");
     expect(addMonths("2026-11-30", 3)).toBe("2027-02-28");
diff --git a/lib/rules/illness.test.ts b/lib/rules/illness.test.ts
index c798cf0..ecb28b0 100644
--- a/lib/rules/illness.test.ts
+++ b/lib/rules/illness.test.ts
@@ -18,6 +18,7 @@ import {
   sinceText,
   statusTone,
   symptomEntries,
+  symptomInEpisode,
 } from "./illness";
 
 // Vietnam time, written the way a parent reads the clock.
@@ -207,6 +208,42 @@ describe("episodeReadings, antipyreticTimes, symptomEntries", () => {
   });
 });
 
+// Spec 2026-11-27 §3.4: a symptom log belongs to an episode by its Vietnam
+// calendar day, not by the time of the episode's start or end.
+describe("symptomInEpisode", () => {
+  const now = vn("2026-11-27 08:00");
+  const open = episode("2026-11-25 18:00");
+  const closed = episode("2026-11-25 18:00", "2026-11-26 07:00");
+  const on = (time: string) => ({ started_at: iso(time) });
+
+  it("the whole first day counts, even before the episode's start", () => {
+    expect(symptomInEpisode(on("2026-11-25 12:00"), open, now)).toBe(true);
+    expect(symptomInEpisode(on("2026-11-25 00:00"), open, now)).toBe(true);
+    expect(symptomInEpisode(on("2026-11-24 23:59"), open, now)).toBe(false);
+  });
+
+  it("an open episode reaches the end of today", () => {
+    expect(symptomInEpisode(on("2026-11-27 12:00"), open, now)).toBe(true);
+    expect(symptomInEpisode(on("2026-11-28 00:00"), open, now)).toBe(false);
+  });
+
+  it("a closed episode reaches the end of its last day, not further", () => {
+    expect(symptomInEpisode(on("2026-11-26 12:00"), closed, now)).toBe(true);
+    expect(symptomInEpisode(on("2026-11-27 00:00"), closed, now)).toBe(false);
+  });
+
+  it("symptomEntries uses it: a 12:00 log of the first day is on day 1", () => {
+    const logs = [
+      symptom("2026-11-25 12:00", ["cough"]),
+      symptom("2026-11-24 12:00", ["fever"]),
+    ];
+    expect(
+      sameForEveryOrder(logs, (list) => symptomEntries(list, open, now)),
+    ).toEqual([{ at: vn("2026-11-25 12:00").getTime(), codes: ["cough"] }]);
+    expect(episodeDays(logs, open, now).at(-1)?.codes).toEqual(["cough"]);
+  });
+});
+
 describe("formatCelsius", () => {
   it("writes a comma and at most one decimal", () => {
     expect(formatCelsius(38.6)).toBe("38,6");
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 213 passed (215)`, `Tests  5 failed | 2062 passed (2067)`. Năm test mới đỏ vì `startOfDayIso` và `symptomInEpisode` chưa được export (`tsc` cũng báo hai lỗi TS2305).

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/rules/days.ts b/lib/rules/days.ts
index 01c01ff..9dfc0b1 100644
--- a/lib/rules/days.ts
+++ b/lib/rules/days.ts
@@ -15,6 +15,12 @@ export function vnDayStartMs(day: string): number {
   return Date.parse(`${day}T00:00:00+07:00`);
 }
 
+// Spec 2026-11-27 §4.3: the start of a VN day as an ISO string, the form
+// useRangeLogs takes.
+export function startOfDayIso(day: string): string {
+  return new Date(vnDayStartMs(day)).toISOString();
+}
+
 export function addDays(day: string, n: number): string {
   return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS)
     .toISOString()
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index 1e66192..e30436e 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -1,6 +1,6 @@
 import { bannerReading } from "./alerts";
 import { dailyStats } from "./dailyStats";
-import { addDays, formatDayShort, vnDayStartMs } from "./days";
+import { addDays, formatDayShort, startOfDayIso, vnDayStartMs } from "./days";
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
 import { vnDateString } from "./time";
@@ -105,6 +105,22 @@ export function antipyreticTimes(
 
 export type SymptomEntry = { at: number; codes: string[] };
 
+// Spec 2026-11-27 §3.4: a symptom is recorded for a whole day, so it belongs
+// to the episode by its Vietnam calendar day: from the episode's first day to
+// its last (an open episode: today), whatever the hour of start and end.
+export function symptomInEpisode(
+  log: { started_at: string },
+  episode: EpisodeLike,
+  now: Date,
+): boolean {
+  const day = vnDateString(new Date(log.started_at));
+  const first = vnDateString(new Date(episode.started_at));
+  const last = vnDateString(
+    episode.ended_at ? new Date(episode.ended_at) : now,
+  );
+  return day >= first && day <= last;
+}
+
 // The symptom logs of the episode, oldest first.
 export function symptomEntries(
   logs: LogLike[],
@@ -114,7 +130,7 @@ export function symptomEntries(
   const entries: SymptomEntry[] = [];
   for (const log of logs) {
     if (log.type !== "symptom") continue;
-    if (!belongsTo(episode, log.started_at, now)) continue;
+    if (!symptomInEpisode(log, episode, now)) continue;
     const parsed = detailsSchemas.symptom.safeParse(log.details);
     if (parsed.success)
       entries.push({
@@ -132,9 +148,6 @@ export function formatCelsius(celsius: number): string {
   return decimal.format(celsius);
 }
 
-const startOfDayIso = (day: string) =>
-  new Date(vnDayStartMs(day)).toISOString();
-
 // Spec §6.3: the logs the episode's page reads. From the start of the 8th day
 // before the first day (seven days to compare with, and one more so a sleep
 // that began the evening before still counts) to the start of the day after
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  215 passed (215)`, `Tests  2067 passed (2067)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/days.ts lib/rules/days.test.ts lib/rules/illness.ts lib/rules/illness.test.ts
git commit -m "feat(illness): a symptom belongs to an episode by its calendar day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Báo cáo đọc triệu chứng theo ngày (§6.3)

**Files:**

- Modify: `lib/rules/report.ts`, `components/report/ReportScreen.tsx`
- Test: `lib/rules/reportIllness.test.ts`, `components/report/reportscreen.test.tsx`

**Interfaces:**

- Consumes: `symptomInEpisode` (Task 1), `belongsTo`, `symptomShorts`, `formatDayShort`, `vnDateString`.
- Produces: `episodeReportLogs(logs, episode, now)`; `symptomRows` mỗi ngày một hàng `{ at: "dd/MM", text, note }`; đầu cột "Ngày".

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/report/reportscreen.test.tsx b/components/report/reportscreen.test.tsx
index 86267c6..18880ff 100644
--- a/components/report/reportscreen.test.tsx
+++ b/components/report/reportscreen.test.tsx
@@ -144,16 +144,16 @@ beforeEach(() => {
 
 // Spec 2026-11-26 §9: "Triệu chứng", for every period.
 describe("ReportScreen: symptoms", () => {
-  it("a table after the medicines: time, short names, note", () => {
+  it("a table after the medicines: day, short names, note (spec 2026-11-27 §6.3)", () => {
     const html = render({ stats: SYMPTOMS });
     expect(html).toMatch(
-      /<h3[^>]*>Triệu chứng<\/h3><table[^>]*><thead><tr><th[^>]*>Giờ<\/th><th[^>]*>Triệu chứng<\/th><th[^>]*>Ghi chú<\/th><\/tr><\/thead>/,
+      /<h3[^>]*>Triệu chứng<\/h3><table[^>]*><thead><tr><th[^>]*>Ngày<\/th><th[^>]*>Triệu chứng<\/th><th[^>]*>Ghi chú<\/th><\/tr><\/thead>/,
     );
     expect(html).toMatch(
-      /<td[^>]*>21\/11 21:15<\/td><td[^>]*>Sốt<\/td><td[^>]*>quấy cả tối<\/td>/,
+      /<td[^>]*>21\/11<\/td><td[^>]*>Sốt<\/td><td[^>]*>quấy cả tối<\/td>/,
     );
     expect(html).toMatch(
-      /<td[^>]*>25\/11 08:00<\/td><td[^>]*>Sổ mũi, Ho<\/td><td[^>]*><\/td>/,
+      /<td[^>]*>25\/11<\/td><td[^>]*>Sổ mũi, Ho<\/td><td[^>]*><\/td>/,
     );
     const order = [
       ">Thuốc đã dùng</h3>",
@@ -189,7 +189,8 @@ describe("ReportScreen: symptoms", () => {
 describe("ReportScreen: the episode period", () => {
   const EPISODE_LOGS = [
     // On the first day, before the episode began: a feed counts for the day,
-    // the reading does not belong to the episode.
+    // the reading does not belong to the episode, the symptom does (spec
+    // 2026-11-27 §3.4: a symptom belongs by its calendar day).
     log("breast", "2026-11-24 20:00", { side: "left" }),
     log("temperature", "2026-11-24 20:00", { celsius: 37.9, method: "nach" }),
     log("symptom", "2026-11-24 20:05", { codes: ["vomit"] }),
@@ -274,8 +275,8 @@ describe("ReportScreen: the episode period", () => {
     expect(html).not.toContain("37,9°C");
     expect(html).toContain("24/11 23:40: 38,4°C (nách)");
     expect(html).toContain("25/11 15:10: Hapacol (hạ sốt) — 2,5 ml");
-    expect(html).toContain(">Ho</td>");
-    expect(html).not.toContain(">Nôn</td>");
+    expect(html).toMatch(/<td[^>]*>24\/11<\/td><td[^>]*>Nôn<\/td>/);
+    expect(html).toMatch(/<td[^>]*>25\/11<\/td><td[^>]*>Ho<\/td>/);
   });
 
   it("the fever chart stands before the readings and is printed", () => {
diff --git a/lib/rules/reportIllness.test.ts b/lib/rules/reportIllness.test.ts
index 5442c58..6ea7f8f 100644
--- a/lib/rules/reportIllness.test.ts
+++ b/lib/rules/reportIllness.test.ts
@@ -1,6 +1,11 @@
 import { describe, expect, it } from "vitest";
 import type { EpisodeLike } from "./illness";
-import { episodeReport, reportSelection, symptomRows } from "./report";
+import {
+  episodeReport,
+  episodeReportLogs,
+  reportSelection,
+  symptomRows,
+} from "./report";
 
 const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
 const iso = (text: string) => vn(text).toISOString();
@@ -134,11 +139,13 @@ describe("symptomRows", () => {
     details,
   });
 
-  it("oldest first: the time, the short names in the content's order, the note", () => {
+  it("spec 2026-11-27 §6.3: one row per day, oldest first: the day, the short names, the notes", () => {
     expect(
       symptomRows(
         [
           log("2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
+          log("2026-11-25 20:00", { codes: ["fussy"], note: "quấy tối" }),
+          log("2026-11-25 07:00", { codes: ["runny_nose"], note: "sáng" }),
           log("2026-11-21 21:15", { codes: ["fever"], note: "quấy cả tối" }),
           log("2026-11-19 09:00", { codes: ["vomit"] }),
           {
@@ -150,8 +157,8 @@ describe("symptomRows", () => {
         from,
       ),
     ).toEqual([
-      { at: "21/11 21:15", text: "Sốt", note: "quấy cả tối" },
-      { at: "25/11 08:00", text: "Sổ mũi, Ho", note: "" },
+      { at: "21/11", text: "Sốt", note: "quấy cả tối" },
+      { at: "25/11", text: "Sổ mũi, Ho, Quấy", note: "sáng · quấy tối" },
     ]);
   });
 
@@ -166,8 +173,29 @@ describe("symptomRows", () => {
         from,
       ),
     ).toEqual([
-      { at: "21/11 08:00", text: "Ho", note: "" },
-      { at: "22/11 08:00", text: "", note: "" },
+      { at: "21/11", text: "Ho", note: "" },
+      { at: "22/11", text: "", note: "" },
+    ]);
+  });
+});
+
+// Spec 2026-11-27 §6.3: the logs of the episode period of the report.
+describe("episodeReportLogs", () => {
+  const at = (type: string, time: string) => ({
+    type,
+    started_at: iso(time),
+  });
+
+  it("a symptom log by its calendar day, every other log by its time", () => {
+    const logs = [
+      at("temperature", "2026-11-24 20:00"),
+      at("symptom", "2026-11-24 20:05"),
+      at("temperature", "2026-11-24 23:40"),
+      at("symptom", "2026-11-23 23:59"),
+    ];
+    expect(episodeReportLogs(logs, OPEN, NOW)).toEqual([
+      at("symptom", "2026-11-24 20:05"),
+      at("temperature", "2026-11-24 23:40"),
     ]);
   });
 });
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 213 passed (215)`, `Tests  5 failed | 2063 passed (2068)`. Hai test của `symptomRows` đỏ vì còn một hàng mỗi bản ghi kèm giờ; test của `episodeReportLogs` đỏ vì hàm chưa có; hai test của `ReportScreen` đỏ vì đầu cột còn là "Giờ" và "Nôn" của ngày đầu chưa thuộc đợt.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/report/ReportScreen.tsx b/components/report/ReportScreen.tsx
index 11040a7..152f407 100644
--- a/components/report/ReportScreen.tsx
+++ b/components/report/ReportScreen.tsx
@@ -23,9 +23,10 @@ import {
   statsFetchSince,
 } from "@/lib/rules/dailyStats";
 import { formatDayShort, vnDayRange, vnDayStartMs } from "@/lib/rules/days";
-import { belongsTo, feverChartModel } from "@/lib/rules/illness";
+import { feverChartModel } from "@/lib/rules/illness";
 import {
   episodeReport,
+  episodeReportLogs,
   growthSummary,
   medicineRows,
   REPORT_DAYS,
@@ -98,10 +99,9 @@ export function ReportScreen({
 
   const rows = logs.data ?? [];
   // The daily table counts whole calendar days; the readings, the medicines
-  // and the symptoms of an episode are only the logs that belong to it.
-  const own = episode
-    ? rows.filter((log) => belongsTo(episode, log.started_at, now))
-    : rows;
+  // and the symptoms of an episode are only the logs that belong to it (a
+  // symptom by its calendar day, spec 2026-11-27 §3.4).
+  const own = episode ? episodeReportLogs(rows, episode, now) : rows;
   const stats = dailyStats(rows, days, now);
   const temperatures = temperatureRows(own, fromMs);
   const medicines = medicineRows(own, fromMs);
@@ -329,7 +329,7 @@ export function ReportScreen({
               <table className="w-full border-collapse text-left">
                 <thead>
                   <tr>
-                    <th className={cell}>Giờ</th>
+                    <th className={cell}>Ngày</th>
                     <th className={cell}>Triệu chứng</th>
                     <th className={cell}>Ghi chú</th>
                   </tr>
diff --git a/lib/rules/report.ts b/lib/rules/report.ts
index 25802f7..ac86375 100644
--- a/lib/rules/report.ts
+++ b/lib/rules/report.ts
@@ -9,7 +9,12 @@ import {
   INDICATORS,
   type GrowthInput,
 } from "./growthForm";
-import { type EpisodeLike, episodeDayCount } from "./illness";
+import {
+  belongsTo,
+  type EpisodeLike,
+  episodeDayCount,
+  symptomInEpisode,
+} from "./illness";
 import { detailsSchemas } from "./logDetails";
 import { symptomShorts } from "./symptomForm";
 import { formatVnTime, vnDateString } from "./time";
@@ -79,28 +84,45 @@ export function medicineRows(
     });
 }
 
-// Spec 2026-11-26 §9: the symptom logs of the period, oldest first: the
-// time, the short names in the content's order, the note. Codes the content
-// no longer has are left out (spec §3.1).
+// Spec 2026-11-27 §6.3: the logs of an episode the report shows. A symptom
+// log by its calendar day (§3.4), every other log by its time (belongsTo).
+export function episodeReportLogs<
+  T extends { type: string; started_at: string },
+>(logs: T[], episode: EpisodeLike, now: Date): T[] {
+  return logs.filter((log) =>
+    log.type === "symptom"
+      ? symptomInEpisode(log, episode, now)
+      : belongsTo(episode, log.started_at, now),
+  );
+}
+
+// Spec 2026-11-27 §6.3: one row per Vietnam day of the period, oldest first:
+// the day, the short names of every code of the day in the content's order,
+// the day's notes joined by " · ". Codes the content no longer has are left
+// out (spec 2026-11-26 §3.1).
 export function symptomRows(
   logs: LogLike[],
   fromMs: number,
 ): { at: string; text: string; note: string }[] {
-  return logs
+  const days = new Map<string, { codes: string[]; notes: string[] }>();
+  const sorted = logs
     .filter((log) => log.type === "symptom")
     .filter((log) => Date.parse(log.started_at) >= fromMs)
-    .sort((a, b) => a.started_at.localeCompare(b.started_at))
-    .flatMap((log) => {
-      const parsed = detailsSchemas.symptom.safeParse(log.details);
-      if (!parsed.success) return [];
-      return [
-        {
-          at: when(log.started_at),
-          text: symptomShorts(parsed.data.codes, TRIAGE.symptoms).join(", "),
-          note: parsed.data.note ?? "",
-        },
-      ];
-    });
+    .sort((a, b) => a.started_at.localeCompare(b.started_at));
+  for (const log of sorted) {
+    const parsed = detailsSchemas.symptom.safeParse(log.details);
+    if (!parsed.success) continue;
+    const day = vnDateString(new Date(log.started_at));
+    const entry = days.get(day) ?? { codes: [], notes: [] };
+    entry.codes.push(...parsed.data.codes);
+    if (parsed.data.note) entry.notes.push(parsed.data.note);
+    days.set(day, entry);
+  }
+  return [...days].map(([day, entry]) => ({
+    at: formatDayShort(day),
+    text: symptomShorts(entry.codes, TRIAGE.symptoms).join(", "),
+    note: entry.notes.join(" · "),
+  }));
 }
 
 // Spec 2026-11-26 §9 from M5: the table "Lần khám" of the episode period, a
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  215 passed (215)`, `Tests  2068 passed (2068)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/report.ts lib/rules/reportIllness.test.ts components/report/ReportScreen.tsx components/report/reportscreen.test.tsx
git commit -m "feat(report): the symptom table has one row per day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Một ngày triệu chứng: đọc, lưu, xóa (§3.1–§3.3, §5.2)

**Files:**

- Create: `lib/rules/symptomDay.ts`
- Test: `lib/rules/symptomDay.test.ts`

**Interfaces:**

- Consumes: `detailsSchemas`, `LogPatch`, `joinCodes`, `parseCodes`, `TRIAGE`, `vnDateString`.
- Produces: `SymptomLog`, `SymptomDay`, `SymptomOp`, `NOTE_TOO_LONG`, `symptomDay`, `symptomDaySave`, `symptomDayDelete`, `canDeleteDay` (chữ ký ở Contracts).

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/lib/rules/symptomDay.test.ts b/lib/rules/symptomDay.test.ts
new file mode 100644
index 0000000..f861ebc
--- /dev/null
+++ b/lib/rules/symptomDay.test.ts
@@ -0,0 +1,261 @@
+import { describe, expect, it } from "vitest";
+import {
+  canDeleteDay,
+  NOTE_TOO_LONG,
+  symptomDay,
+  symptomDayDelete,
+  symptomDaySave,
+  type SymptomLog,
+} from "./symptomDay";
+
+const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
+const iso = (text: string) => vn(text).toISOString();
+
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
+const owner = () => true;
+const NOW = vn("2026-11-27 15:30");
+const TODAY = "2026-11-27";
+
+// Spec 2026-11-27 §3.1.
+describe("symptomDay", () => {
+  const logs = [
+    log("b", "2026-11-25 20:00", { codes: ["fussy", "cough"], note: "tối" }),
+    log("a", "2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
+    log("c", "2026-11-25 09:00", { codes: ["fever"], note: "bà ghi" }, "ba"),
+    log("d", "2026-11-25 10:00", { codes: [] }), // not valid
+    log("e", "2026-11-24 23:59", { codes: ["vomit"] }), // the day before
+    { ...log("f", "2026-11-25 11:00", { celsius: 38 }), type: "temperature" },
+  ];
+
+  it("the valid symptom logs of the Vietnam day, oldest first", () => {
+    const day = symptomDay(logs, "2026-11-25", mine);
+    expect(day.day).toBe("2026-11-25");
+    expect(day.logs.map((l) => l.id)).toEqual(["a", "c", "b"]);
+  });
+
+  it("a member: own logs, locked codes of the others, notes kept apart", () => {
+    const day = symptomDay(logs, "2026-11-25", mine);
+    expect(day.own.map((l) => l.id)).toEqual(["a", "b"]);
+    expect(day.locked).toEqual(["fever"]);
+    expect(day.codes).toEqual(["fever", "runny_nose", "cough", "fussy"]);
+    expect(day.ownNote).toBe("tối");
+    expect(day.otherNotes).toEqual(["bà ghi"]);
+  });
+
+  it("the owner modifies every log: nothing is locked", () => {
+    const day = symptomDay(logs, "2026-11-25", owner);
+    expect(day.own.map((l) => l.id)).toEqual(["a", "c", "b"]);
+    expect(day.locked).toEqual([]);
+    expect(day.ownNote).toBe("bà ghi · tối");
+    expect(day.otherNotes).toEqual([]);
+  });
+
+  it("a code in both an own log and another's log is locked", () => {
+    const both = [
+      log("a", "2026-11-25 08:00", { codes: ["cough"] }),
+      log("c", "2026-11-25 09:00", { codes: ["cough"] }, "ba"),
+    ];
+    expect(symptomDay(both, "2026-11-25", mine).locked).toEqual(["cough"]);
+  });
+
+  it("a day without symptom logs", () => {
+    const day = symptomDay(logs, "2026-11-26", mine);
+    expect(day).toEqual({
+      day: "2026-11-26",
+      logs: [],
+      own: [],
+      locked: [],
+      codes: [],
+      ownNote: "",
+      otherNotes: [],
+    });
+  });
+});
+
+// Spec 2026-11-27 §3.2.
+describe("symptomDaySave", () => {
+  const save = (
+    logs: SymptomLog[],
+    day: string,
+    picked: string[],
+    note = "",
+    canModify: (createdBy: string) => boolean = mine,
+  ) =>
+    symptomDaySave({
+      day: symptomDay(logs, day, canModify),
+      picked,
+      note,
+      today: TODAY,
+      now: NOW,
+    });
+
+  it("a new day today: one insert at now, ended_at = started_at, no note column", () => {
+    expect(save([], TODAY, ["runny_nose", "cough"], "  ho đêm ")).toEqual({
+      ok: true,
+      ops: [
+        {
+          op: "insert",
+          patch: {
+            started_at: NOW.toISOString(),
+            ended_at: NOW.toISOString(),
+            details: { codes: ["runny_nose", "cough"], note: "ho đêm" },
+            note: null,
+          },
+        },
+      ],
+    });
+  });
+
+  it("a new past day: one insert at 12:00 Vietnam time, codes in the content's order", () => {
+    expect(save([], "2026-11-25", ["fussy", "fever"])).toEqual({
+      ok: true,
+      ops: [
+        {
+          op: "insert",
+          patch: {
+            started_at: iso("2026-11-25 12:00"),
+            ended_at: iso("2026-11-25 12:00"),
+            details: { codes: ["fever", "fussy"] },
+            note: null,
+          },
+        },
+      ],
+    });
+  });
+
+  it("a day with several own logs: update the oldest, keep its times and note column, delete the rest", () => {
+    const first = {
+      ...log("a", "2026-11-25 08:00", { codes: ["cough"] }),
+      note: "cột cũ",
+    };
+    const logs = [
+      first,
+      log("b", "2026-11-25 20:00", { codes: ["fussy"], note: "tối" }),
+    ];
+    expect(
+      save(logs, "2026-11-25", ["cough", "fussy", "vomit"], "tối"),
+    ).toEqual({
+      ok: true,
+      ops: [
+        {
+          op: "update",
+          id: "a",
+          patch: {
+            started_at: first.started_at,
+            ended_at: first.ended_at,
+            details: { codes: ["cough", "vomit", "fussy"], note: "tối" },
+            note: "cột cũ",
+          },
+        },
+        { op: "delete", id: "b" },
+      ],
+    });
+  });
+
+  it("locked codes stay out of what the member saves", () => {
+    const logs = [log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba")];
+    const result = save(logs, "2026-11-25", ["fever", "cough"]);
+    expect(result.ok && result.ops[0]).toMatchObject({
+      op: "insert",
+      patch: { details: { codes: ["cough"] } },
+    });
+  });
+
+  it("only locked chips left: the member's own logs are deleted", () => {
+    const logs = [
+      log("a", "2026-11-25 08:00", { codes: ["cough"] }),
+      log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba"),
+    ];
+    expect(save(logs, "2026-11-25", ["fever"])).toEqual({
+      ok: true,
+      ops: [{ op: "delete", id: "a" }],
+    });
+  });
+
+  it("nothing changed: no operation (codes compared as a set, locked codes left out)", () => {
+    const logs = [
+      log("a", "2026-11-25 08:00", {
+        codes: ["fussy", "cough", "fever"],
+        note: "tối",
+      }),
+      log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba"),
+    ];
+    expect(
+      save(logs, "2026-11-25", ["cough", "fussy", "fever"], " tối "),
+    ).toEqual({
+      ok: true,
+      ops: [],
+    });
+    expect(save([], "2026-11-25", [])).toEqual({ ok: true, ops: [] });
+    const others = [log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba")];
+    expect(save(others, "2026-11-25", ["fever"], "")).toEqual({
+      ok: true,
+      ops: [],
+    });
+  });
+
+  it("spec §7: Lưu never empties a day; with no chip on and none locked it does nothing", () => {
+    const logs = [
+      log("a", "2026-11-25 08:00", { codes: ["cough"] }),
+      log("b", "2026-11-25 20:00", { codes: ["fussy"] }),
+    ];
+    expect(save(logs, "2026-11-25", [])).toEqual({ ok: true, ops: [] });
+    expect(save(logs, "2026-11-25", [], "", owner)).toEqual({
+      ok: true,
+      ops: [],
+    });
+  });
+
+  it("a note longer than 200 characters is refused, not cut", () => {
+    expect(save([], TODAY, ["cough"], "a".repeat(201))).toEqual({
+      ok: false,
+      message: NOTE_TOO_LONG,
+    });
+    expect(NOTE_TOO_LONG).toBe("Ghi chú dài quá 200 ký tự");
+    expect(save([], TODAY, ["cough"], "a".repeat(200)).ok).toBe(true);
+  });
+});
+
+// Spec 2026-11-27 §3.3 and §5.2.
+describe("symptomDayDelete and canDeleteDay", () => {
+  it("deletes every own log of the day", () => {
+    const day = symptomDay(
+      [
+        log("a", "2026-11-25 08:00", { codes: ["cough"] }),
+        log("b", "2026-11-25 20:00", { codes: ["fussy"] }),
+      ],
+      "2026-11-25",
+      mine,
+    );
+    expect(symptomDayDelete(day)).toEqual([
+      { op: "delete", id: "a" },
+      { op: "delete", id: "b" },
+    ]);
+    expect(canDeleteDay(day)).toBe(true);
+  });
+
+  it("no delete without an own log, nor while another's codes are locked", () => {
+    const others = [log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba")];
+    expect(canDeleteDay(symptomDay(others, "2026-11-25", mine))).toBe(false);
+    const mixed = [
+      ...others,
+      log("a", "2026-11-25 08:00", { codes: ["cough"] }),
+    ];
+    expect(canDeleteDay(symptomDay(mixed, "2026-11-25", mine))).toBe(false);
+    expect(canDeleteDay(symptomDay([], "2026-11-25", mine))).toBe(false);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 215 passed (216)`, `Tests  2068 passed (2068)`. File test mới đỏ ngay ở bước nạp (`Cannot find module './symptomDay'`), nên chưa test nào của nó được đếm.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/lib/rules/symptomDay.ts b/lib/rules/symptomDay.ts
new file mode 100644
index 0000000..9df31f0
--- /dev/null
+++ b/lib/rules/symptomDay.ts
@@ -0,0 +1,163 @@
+import { TRIAGE } from "@/lib/content/triage";
+import { detailsSchemas } from "./logDetails";
+import type { LogPatch } from "./logForm";
+import { joinCodes, parseCodes } from "./symptomForm";
+import { vnDateString } from "./time";
+
+// Spec 2026-11-27: symptoms are recorded per Vietnam day. A day has one
+// symptom log per person who may change it; every reader merges by day.
+
+// The fields of a log row these rules read (a LogRow fits).
+export type SymptomLog = {
+  id: string;
+  type: string;
+  started_at: string;
+  ended_at: string | null;
+  details: unknown;
+  note: string | null;
+  created_by: string;
+};
+
+export type SymptomDay = {
+  // "YYYY-MM-DD", a Vietnam day.
+  day: string;
+  // The valid symptom logs of the day, oldest first.
+  logs: SymptomLog[];
+  // The part of `logs` the viewer may change.
+  own: SymptomLog[];
+  // Codes in a log the viewer may not change, in the content's order.
+  locked: string[];
+  // Every code of the day, once each, in the content's order.
+  codes: string[];
+  // The notes of `own`, joined by " · ", empty notes left out.
+  ownNote: string;
+  // The notes of the logs the viewer may not change.
+  otherNotes: string[];
+};
+
+export type SymptomOp =
+  | { op: "insert"; patch: LogPatch }
+  | { op: "update"; id: string; patch: LogPatch }
+  | { op: "delete"; id: string };
+
+export const NOTE_TOO_LONG = "Ghi chú dài quá 200 ký tự";
+// Same limit as detailsSchemas.symptom (zod counts UTF-16 units).
+const NOTE_MAX = 200;
+
+const ordered = (codes: readonly string[]) =>
+  parseCodes(joinCodes(codes, TRIAGE.symptoms));
+
+function parsed(log: SymptomLog) {
+  if (log.type !== "symptom") return null;
+  const result = detailsSchemas.symptom.safeParse(log.details);
+  return result.success ? result.data : null;
+}
+
+// Spec §3.1. `canModify` says whether the viewer may change a log made by
+// `createdBy` (canModifyLog: the owner every log, a member their own).
+export function symptomDay(
+  logs: readonly SymptomLog[],
+  day: string,
+  canModify: (createdBy: string) => boolean,
+): SymptomDay {
+  const valid = logs
+    .filter((log) => parsed(log) !== null)
+    .filter((log) => vnDateString(new Date(log.started_at)) === day)
+    .sort(
+      (a, b) =>
+        Date.parse(a.started_at) - Date.parse(b.started_at) ||
+        a.id.localeCompare(b.id),
+    );
+  const own = valid.filter((log) => canModify(log.created_by));
+  const others = valid.filter((log) => !canModify(log.created_by));
+  const codesOf = (log: SymptomLog) => parsed(log)?.codes ?? [];
+  const noteOf = (log: SymptomLog) => parsed(log)?.note ?? "";
+  return {
+    day,
+    logs: valid,
+    own,
+    locked: ordered(others.flatMap(codesOf)),
+    codes: ordered(valid.flatMap(codesOf)),
+    ownNote: own.map(noteOf).filter(Boolean).join(" · "),
+    otherNotes: others.map(noteOf).filter(Boolean),
+  };
+}
+
+const sameSet = (a: readonly string[], b: readonly string[]) =>
+  a.length === b.length && a.every((code) => b.includes(code));
+
+// Spec §3.2: what Lưu does to the day. `picked` is every chip switched on,
+// locked ones included; `note` is the note field as typed.
+export function symptomDaySave(input: {
+  day: SymptomDay;
+  picked: readonly string[];
+  note: string;
+  today: string;
+  now: Date;
+}): { ok: true; ops: SymptomOp[] } | { ok: false; message: string } {
+  const { day, picked, today, now } = input;
+  const note = input.note.trim();
+  if (note.length > NOTE_MAX) return { ok: false, message: NOTE_TOO_LONG };
+  const ownCodes = ordered(picked.filter((code) => !day.locked.includes(code)));
+  const details = note ? { codes: ownCodes, note } : { codes: ownCodes };
+
+  // Spec §7: Lưu never empties a day; that is the delete button's job (the
+  // sheet keeps Lưu off without a chip on). Only another's locked chips left
+  // on may take the viewer's own part away.
+  if (picked.length === 0 && day.locked.length === 0)
+    return { ok: true, ops: [] };
+  if (ownCodes.length === 0 && day.own.length === 0)
+    return { ok: true, ops: [] };
+  if (day.own.length === 1) {
+    const current = parsed(day.own[0]);
+    const theirs = (current?.codes ?? []).filter(
+      (code) => !day.locked.includes(code),
+    );
+    if (sameSet(theirs, ownCodes) && (current?.note ?? "") === note)
+      return { ok: true, ops: [] };
+  }
+  if (ownCodes.length === 0) return { ok: true, ops: symptomDayDelete(day) };
+  if (day.own.length === 0) {
+    const at =
+      day.day === today
+        ? now.toISOString()
+        : new Date(`${day.day}T12:00:00+07:00`).toISOString();
+    return {
+      ok: true,
+      ops: [
+        {
+          op: "insert",
+          patch: { started_at: at, ended_at: at, details, note: null },
+        },
+      ],
+    };
+  }
+  const [first, ...rest] = day.own;
+  return {
+    ok: true,
+    ops: [
+      {
+        op: "update",
+        id: first.id,
+        patch: {
+          started_at: first.started_at,
+          ended_at: first.ended_at,
+          details,
+          note: first.note,
+        },
+      },
+      ...rest.map((log): SymptomOp => ({ op: "delete", id: log.id })),
+    ],
+  };
+}
+
+// Spec §3.3: "Xóa triệu chứng ngày này" deletes every own log of the day.
+export function symptomDayDelete(day: SymptomDay): SymptomOp[] {
+  return day.own.map((log) => ({ op: "delete", id: log.id }));
+}
+
+// Spec §5.2: the delete button shows only when the day has an own log and
+// nothing of anyone else's, so the day is empty afterwards.
+export function canDeleteDay(day: SymptomDay): boolean {
+  return day.own.length > 0 && day.locked.length === 0;
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  216 passed (216)`, `Tests  2083 passed (2083)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/symptomDay.ts lib/rules/symptomDay.test.ts
git commit -m "feat(symptoms): the rules of a day of symptoms" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: Các ô của dải ngày (§4.3)

**Files:**

- Modify: `lib/rules/symptomDay.ts`
- Test: `lib/rules/symptomDay.test.ts`

**Interfaces:**

- Consumes: `addDays`, `formatDayShort`, `vnDateString`, `EpisodeLike`.
- Produces: `StripDay`, `dayStrip({ episode, today, dob })` → `{ label, days }`, ô cũ trước, hôm nay cuối.

- [x] **Step 1: Viết test đỏ (Patch 7)**

```diff
diff --git a/lib/rules/symptomDay.test.ts b/lib/rules/symptomDay.test.ts
index f861ebc..6c1c6c2 100644
--- a/lib/rules/symptomDay.test.ts
+++ b/lib/rules/symptomDay.test.ts
@@ -1,6 +1,7 @@
 import { describe, expect, it } from "vitest";
 import {
   canDeleteDay,
+  dayStrip,
   NOTE_TOO_LONG,
   symptomDay,
   symptomDayDelete,
@@ -259,3 +260,65 @@ describe("symptomDayDelete and canDeleteDay", () => {
     expect(canDeleteDay(symptomDay([], "2026-11-25", mine))).toBe(false);
   });
 });
+
+// Spec 2026-11-27 §4.3.
+describe("dayStrip", () => {
+  const episode = (start: string, end: string | null = null) => ({
+    id: "ep1",
+    started_at: iso(start),
+    ended_at: end === null ? null : iso(end),
+  });
+
+  it("an open episode: one cell per day of it, today last", () => {
+    expect(
+      dayStrip({
+        episode: episode("2026-11-24 20:10"),
+        today: TODAY,
+        dob: "2026-09-10",
+      }),
+    ).toEqual({
+      label: "Ngày nào? · đợt ốm từ 24/11",
+      days: [
+        { day: "2026-11-24", top: "Ngày 1", bottom: "24/11" },
+        { day: "2026-11-25", top: "Ngày 2", bottom: "25/11" },
+        { day: "2026-11-26", top: "Ngày 3", bottom: "26/11" },
+        { day: "2026-11-27", top: "Hôm nay", bottom: "27/11" },
+      ],
+    });
+  });
+
+  it("an episode that began today: one cell", () => {
+    expect(
+      dayStrip({
+        episode: episode("2026-11-27 06:00"),
+        today: TODAY,
+        dob: "2026-09-10",
+      }).days,
+    ).toEqual([{ day: "2026-11-27", top: "Hôm nay", bottom: "27/11" }]);
+  });
+
+  it("no open episode: the last 7 days by weekday, today last", () => {
+    expect(
+      dayStrip({ episode: null, today: TODAY, dob: "2026-09-10" }),
+    ).toEqual({
+      label: "Ngày nào?",
+      days: [
+        { day: "2026-11-21", top: "T7", bottom: "21/11" },
+        { day: "2026-11-22", top: "CN", bottom: "22/11" },
+        { day: "2026-11-23", top: "T2", bottom: "23/11" },
+        { day: "2026-11-24", top: "T3", bottom: "24/11" },
+        { day: "2026-11-25", top: "T4", bottom: "25/11" },
+        { day: "2026-11-26", top: "Hôm qua", bottom: "26/11" },
+        { day: "2026-11-27", top: "Hôm nay", bottom: "27/11" },
+      ],
+    });
+  });
+
+  it("no day before the baby was born", () => {
+    expect(
+      dayStrip({ episode: null, today: TODAY, dob: "2026-11-25" }).days.map(
+        (cell) => cell.day,
+      ),
+    ).toEqual(["2026-11-25", "2026-11-26", "2026-11-27"]);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 215 passed (216)`, `Tests  4 failed | 2083 passed (2087)`. Bốn test của `dayStrip` đỏ vì hàm chưa có.

- [x] **Step 3: Viết code (Patch 8)**

```diff
diff --git a/lib/rules/symptomDay.ts b/lib/rules/symptomDay.ts
index 9df31f0..0cf7715 100644
--- a/lib/rules/symptomDay.ts
+++ b/lib/rules/symptomDay.ts
@@ -1,4 +1,6 @@
 import { TRIAGE } from "@/lib/content/triage";
+import { addDays, formatDayShort } from "./days";
+import type { EpisodeLike } from "./illness";
 import { detailsSchemas } from "./logDetails";
 import type { LogPatch } from "./logForm";
 import { joinCodes, parseCodes } from "./symptomForm";
@@ -161,3 +163,53 @@ export function symptomDayDelete(day: SymptomDay): SymptomOp[] {
 export function canDeleteDay(day: SymptomDay): boolean {
   return day.own.length > 0 && day.locked.length === 0;
 }
+
+export type StripDay = {
+  day: string;
+  // The bold line: "Ngày 2", "Hôm nay", "Hôm qua", "T2"…"T7", "CN".
+  top: string;
+  // "dd/MM".
+  bottom: string;
+};
+
+const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
+const STRIP_DAYS = 7;
+
+// Spec §4.3: the cells of the day strip, oldest first (today is the last
+// cell, before "Khác"). `episode` is the baby's open episode, or null. No
+// cell is before the day the baby was born.
+export function dayStrip(input: {
+  episode: EpisodeLike | null;
+  today: string;
+  dob: string;
+}): { label: string; days: StripDay[] } {
+  const { episode, today, dob } = input;
+  const yesterday = addDays(today, -1);
+  if (episode) {
+    const first = vnDateString(new Date(episode.started_at));
+    const days: StripDay[] = [];
+    for (let n = 1, day = first; day <= today; n += 1, day = addDays(day, 1))
+      if (day >= dob)
+        days.push({
+          day,
+          top: day === today ? "Hôm nay" : `Ngày ${n}`,
+          bottom: formatDayShort(day),
+        });
+    return { label: `Ngày nào? · đợt ốm từ ${formatDayShort(first)}`, days };
+  }
+  const days = Array.from({ length: STRIP_DAYS }, (_, i) =>
+    addDays(today, i - STRIP_DAYS + 1),
+  )
+    .filter((day) => day >= dob)
+    .map((day) => ({
+      day,
+      top:
+        day === today
+          ? "Hôm nay"
+          : day === yesterday
+            ? "Hôm qua"
+            : WEEKDAY_SHORT[new Date(`${day}T00:00:00Z`).getUTCDay()],
+      bottom: formatDayShort(day),
+    }));
+  return { label: "Ngày nào?", days };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  216 passed (216)`, `Tests  2087 passed (2087)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/symptomDay.ts lib/rules/symptomDay.test.ts
git commit -m "feat(symptoms): the cells of the day strip" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: Nhật ký và "Gần đây": "Cả ngày", triệu chứng đầu ngày; "Ghi bù" bỏ Triệu chứng (§6.2, §4.1)

**Files:**

- Modify: `lib/rules/history.ts`, `components/history/HistoryList.tsx`, `components/home/RecentCard.tsx`, `lib/rules/logForm.ts`
- Test: `lib/rules/history.test.ts`, `components/history/historylist.test.tsx`, `components/home/stats.test.tsx`, `lib/rules/logForm.test.ts`, `components/history/logedit.test.tsx`

**Interfaces:**

- Consumes: `formatVnTime`, `vnDateString`.
- Produces: `groupByVnDay` (triệu chứng đầu ngày), `logTimeText(log)`; `MANUAL_TYPES` không có `symptom`.

- [x] **Step 1: Viết test đỏ (Patch 9)**

```diff
diff --git a/components/history/historylist.test.tsx b/components/history/historylist.test.tsx
index 4228e98..df2cc9a 100644
--- a/components/history/historylist.test.tsx
+++ b/components/history/historylist.test.tsx
@@ -42,7 +42,9 @@ const sleep = log(
   "2026-11-14T03:00:00.000Z",
   {},
 );
-const groups = [{ day: "2026-11-14", summary: "1 cữ · 0 tã · ngủ 1g", logs: [bottle, sleep] }];
+const groups = [
+  { day: "2026-11-14", summary: "1 cữ · 0 tã · ngủ 1g", logs: [bottle, sleep] },
+];
 
 describe("HistoryList", () => {
   it("groups by day with a 20/700 title and the day summary, rows with chip, text, time and who", () => {
@@ -70,6 +72,27 @@ describe("HistoryList", () => {
     expect(html).toContain("glass");
   });
 
+  it("spec 2026-11-27 §6.2: a symptom row reads Cả ngày instead of its time", () => {
+    const symptom = log(
+      "y1",
+      "symptom",
+      "2026-11-14T05:00:00.000Z",
+      "2026-11-14T05:00:00.000Z",
+      { codes: ["cough"] },
+    );
+    const html = renderToStaticMarkup(
+      <HistoryList
+        groups={[{ day: "2026-11-14", summary: "", logs: [symptom] }]}
+        now={NOW}
+        nameOf={() => "Ba"}
+        pending={new Set()}
+        onOpen={() => {}}
+      />,
+    );
+    expect(html).toContain(">Cả ngày</span>");
+    expect(html).not.toContain(">12:00</span>");
+  });
+
   it("opens the row's log", () => {
     const onOpen = vi.fn();
     const rows = findElements(
diff --git a/components/history/logedit.test.tsx b/components/history/logedit.test.tsx
index c4c117f..5206b77 100644
--- a/components/history/logedit.test.tsx
+++ b/components/history/logedit.test.tsx
@@ -109,11 +109,9 @@ describe("LogEditSheet", () => {
     expect(html).toContain('<option value="water">Uống nước</option>');
     expect(html).toContain('<option value="bath">Tắm</option>');
     expect(html).toContain('<option value="note">Ghi chú</option>');
-    expect(html.match(/<option /g)).toHaveLength(11);
-    // Spec 2026-11-26 §3.4: Triệu chứng sits right after Nhiệt độ.
-    expect(html).toContain(
-      '<option value="temperature">Nhiệt độ</option><option value="symptom">Triệu chứng</option>',
-    );
+    expect(html.match(/<option /g)).toHaveLength(10);
+    // Spec 2026-11-27 §4.1: Ghi bù no longer offers Triệu chứng.
+    expect(html).not.toContain('<option value="symptom">');
   });
 
   it("a note log: Nội dung only, the sheet's own Ghi chú field is hidden", () => {
diff --git a/components/home/stats.test.tsx b/components/home/stats.test.tsx
index 9a03971..0f4a6e9 100644
--- a/components/home/stats.test.tsx
+++ b/components/home/stats.test.tsx
@@ -126,6 +126,25 @@ describe("RecentCard", () => {
     expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
   });
 
+  it("spec 2026-11-27 §6.2: a symptom row reads Cả ngày instead of its time", () => {
+    const symptom = {
+      ...bottle(1),
+      id: "y1",
+      type: "symptom",
+      details: { codes: ["cough"] },
+    } as LogRow;
+    const html = renderToStaticMarkup(
+      <RecentCard
+        logs={[symptom]}
+        now={NOW}
+        nameOf={() => "Ba"}
+        pending={new Set()}
+      />,
+    );
+    expect(html).toContain(">Cả ngày</span>");
+    expect(html).not.toContain(">11:00</span>");
+  });
+
   it("says so when nothing was logged", () => {
     const html = renderToStaticMarkup(
       <RecentCard
diff --git a/lib/rules/history.test.ts b/lib/rules/history.test.ts
index f0a9c20..6639ba5 100644
--- a/lib/rules/history.test.ts
+++ b/lib/rules/history.test.ts
@@ -6,6 +6,7 @@ import {
   groupByVnDay,
   HISTORY_FILTERS,
   historyPageRange,
+  logTimeText,
   matchesFilter,
   nextHistoryPage,
 } from "./history";
@@ -62,6 +63,26 @@ describe("history", () => {
     expect(groups[1].logs.map((l) => l.id)).toEqual(["a"]);
   });
 
+  it("spec 2026-11-27 §6.2: symptom logs head their day, oldest of them first", () => {
+    const groups = groupByVnDay([
+      { id: "s1", type: "symptom", started_at: "2026-11-14T01:00:00Z" }, // 08:00
+      { id: "f", type: "bottle", started_at: "2026-11-14T02:00:00Z" }, // 09:00
+      { id: "s2", type: "symptom", started_at: "2026-11-14T05:00:00Z" }, // 12:00
+      { id: "d", type: "diaper", started_at: "2026-11-14T06:00:00Z" }, // 13:00
+      { id: "y", type: "symptom", started_at: "2026-11-13T05:00:00Z" },
+    ]);
+    expect(groups.map((g) => g.logs.map((l) => l.id))).toEqual([
+      ["s1", "s2", "d", "f"],
+      ["y"],
+    ]);
+  });
+
+  it("spec 2026-11-27 §6.2: a symptom log reads Cả ngày instead of its time", () => {
+    const at = "2026-11-14T05:00:00Z"; // 12:00 VN
+    expect(logTimeText({ type: "symptom", started_at: at })).toBe("Cả ngày");
+    expect(logTimeText({ type: "bottle", started_at: at })).toBe("12:00");
+  });
+
   it("historyPageRange covers 7 VN days per page", () => {
     expect(historyPageRange(now, 0)).toEqual({
       fromDay: "2026-11-08",
diff --git a/lib/rules/logForm.test.ts b/lib/rules/logForm.test.ts
index a7def08..1fe924d 100644
--- a/lib/rules/logForm.test.ts
+++ b/lib/rules/logForm.test.ts
@@ -141,11 +141,11 @@ describe("logForm", () => {
     ).toEqual({ ok: false, message: "Nhập số ml từ 1 đến 400" });
   });
 
-  it("MANUAL_TYPES: the six old types, Triệu chứng, then Ăn dặm, Uống nước, Tắm and Ghi chú", () => {
-    expect(MANUAL_TYPES).toHaveLength(11);
+  it("MANUAL_TYPES: the six old types, then Ăn dặm, Uống nước, Tắm and Ghi chú; no Triệu chứng (spec 2026-11-27 §4.1)", () => {
+    expect(MANUAL_TYPES).toHaveLength(10);
     expect(MANUAL_TYPES[5].label).toBe("Nhiệt độ");
-    expect(MANUAL_TYPES[6]).toEqual({ value: "symptom", label: "Triệu chứng" });
-    expect(MANUAL_TYPES.slice(7)).toEqual([
+    expect(MANUAL_TYPES.map((t) => t.value)).not.toContain("symptom");
+    expect(MANUAL_TYPES.slice(6)).toEqual([
       { value: "solids", label: "Ăn dặm" },
       { value: "water", label: "Uống nước" },
       { value: "bath", label: "Tắm" },
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  5 failed | 211 passed (216)`, `Tests  6 failed | 2085 passed (2091)`.

- [x] **Step 3: Viết code (Patch 10)**

```diff
diff --git a/components/history/HistoryList.tsx b/components/history/HistoryList.tsx
index 324ffb2..623b29d 100644
--- a/components/history/HistoryList.tsx
+++ b/components/history/HistoryList.tsx
@@ -3,8 +3,8 @@ import { Glass } from "@/components/ui/Glass";
 import { Icon } from "@/components/ui/Icon";
 import { vnDayLabel } from "@/lib/rules/days";
 import { describeLog } from "@/lib/rules/describeLog";
+import { logTimeText } from "@/lib/rules/history";
 import type { LogType } from "@/lib/rules/logDetails";
-import { formatVnTime } from "@/lib/rules/time";
 import type { LogRow } from "@/lib/supabase/rows";
 import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
@@ -79,7 +79,7 @@ export function HistoryList({
                     </span>
                     <span className="flex shrink-0 flex-col items-end">
                       <span className="text-[15px] font-semibold text-ink tabular-nums">
-                        {formatVnTime(new Date(log.started_at))}
+                        {logTimeText(log)}
                       </span>
                       <span className="text-xs text-muted">
                         {nameOf(log.created_by)}
diff --git a/components/home/RecentCard.tsx b/components/home/RecentCard.tsx
index 3c6c164..6465498 100644
--- a/components/home/RecentCard.tsx
+++ b/components/home/RecentCard.tsx
@@ -3,8 +3,8 @@ import { PendingMark } from "@/components/sync/PendingMark";
 import { Glass } from "@/components/ui/Glass";
 import { Icon } from "@/components/ui/Icon";
 import { describeLog } from "@/lib/rules/describeLog";
+import { logTimeText } from "@/lib/rules/history";
 import type { LogType } from "@/lib/rules/logDetails";
-import { formatVnTime } from "@/lib/rules/time";
 import type { LogRow } from "@/lib/supabase/rows";
 import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
@@ -68,7 +68,7 @@ export function RecentCard({
                   </span>
                 </span>
                 <span className="text-[15px] font-semibold text-ink tabular-nums">
-                  {formatVnTime(new Date(log.started_at))}
+                  {logTimeText(log)}
                 </span>
               </li>
             );
diff --git a/lib/rules/history.ts b/lib/rules/history.ts
index 00cb32a..0a3ce05 100644
--- a/lib/rules/history.ts
+++ b/lib/rules/history.ts
@@ -1,5 +1,5 @@
 import { addDays, vnDayStartMs } from "./days";
-import { vnDateString } from "./time";
+import { formatVnTime, vnDateString } from "./time";
 import type { LogLike } from "./describeLog";
 import { groupFeedSessions } from "./ratings";
 import { shortDuration } from "./summaryText";
@@ -44,7 +44,9 @@ export function matchesFilter(
   return filter === "all" || FILTER_TYPES[filter].includes(log.type);
 }
 
-export function groupByVnDay<T extends { started_at: string }>(
+// Newest day and log first. Spec 2026-11-27 §6.2: a symptom log is for the
+// whole day, so the day's symptom logs head it, the oldest of them first.
+export function groupByVnDay<T extends { started_at: string; type?: string }>(
   logs: T[],
 ): { day: string; logs: T[] }[] {
   const sorted = [...logs].sort(
@@ -57,9 +59,25 @@ export function groupByVnDay<T extends { started_at: string }>(
     if (last && last.day === day) last.logs.push(log);
     else groups.push({ day, logs: [log] });
   }
+  for (const group of groups) {
+    const symptoms = group.logs.filter((log) => log.type === "symptom");
+    if (symptoms.length === 0) continue;
+    group.logs = [
+      ...symptoms.reverse(),
+      ...group.logs.filter((log) => log.type !== "symptom"),
+    ];
+  }
   return groups;
 }
 
+// Spec 2026-11-27 §6.2: the time of a row in Nhật ký and "Gần đây"; a
+// symptom log is for the whole day.
+export function logTimeText(log: { type: string; started_at: string }): string {
+  return log.type === "symptom"
+    ? "Cả ngày"
+    : formatVnTime(new Date(log.started_at));
+}
+
 export const HISTORY_PAGE_DAYS = 7;
 
 export function historyPageRange(
diff --git a/lib/rules/logForm.ts b/lib/rules/logForm.ts
index 09f6598..f53196b 100644
--- a/lib/rules/logForm.ts
+++ b/lib/rules/logForm.ts
@@ -8,6 +8,8 @@ import {
 } from "./quickEntry";
 import { fromVnLocalInput } from "./time";
 
+// Spec 2026-11-27 §4.1: Ghi bù has no Triệu chứng; an earlier day's symptoms
+// are recorded with the day strip of the symptom sheet.
 export const MANUAL_TYPES: { value: LogType; label: string }[] = [
   { value: "breast", label: "Bú mẹ" },
   { value: "bottle", label: "Bú bình" },
@@ -15,7 +17,6 @@ export const MANUAL_TYPES: { value: LogType; label: string }[] = [
   { value: "diaper", label: "Tã" },
   { value: "medicine", label: "Thuốc" },
   { value: "temperature", label: "Nhiệt độ" },
-  { value: "symptom", label: "Triệu chứng" },
   { value: "solids", label: "Ăn dặm" },
   { value: "water", label: "Uống nước" },
   { value: "bath", label: "Tắm" },
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  216 passed (216)`, `Tests  2091 passed (2091)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/history.ts lib/rules/history.test.ts components/history/HistoryList.tsx components/history/historylist.test.tsx components/home/RecentCard.tsx components/home/stats.test.tsx lib/rules/logForm.ts lib/rules/logForm.test.ts components/history/logedit.test.tsx
git commit -m "feat(history): symptoms read Cả ngày and head their day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: Kiểm cuối plan A, rồi hỏi trước khi lên `main`

**Files:**

- Modify: `docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-a.md` (ghi kết quả, bằng script)

**Interfaces:**

- Consumes: mọi Produces của Task 1–5.
- Produces: nhánh `feat/kim-bun-trieu-chung-theo-ngay-a` sẵn sàng; plan B cắt từ đây hoặc từ `main`.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  216 passed (216)`, `Tests  2091 passed (2091)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: thoát 0, `Generating static pages … (42/42)`; `/bao-cao` và `/nhat-ky` vẫn `○`. Có thể dừng ở `SecurityFatalError`: chạy lại đúng lệnh đó tới khi thoát 0.

- [x] **Step 3: Ghi kết quả vào plan**

Ghi ngay dưới bước này (bằng script, xem Ghi chú khi thực thi): số đỏ và xanh của từng task có khớp plan không; kết quả Step 1 và Step 2. Đánh dấu `[x]` các bước đã làm.

**Kết quả thực thi (2026-11-27, nhánh `feat/kim-bun-trieu-chung-theo-ngay-a` cắt từ `main` @ `5b90853`):**

- Mười patch được trích bằng `kb_patch` và áp bằng `git apply`, patch nào cũng sạch, không sửa tay dòng nào.
- Task 1: đỏ `2 failed | 213 passed (215)` file, `5 failed | 2062 passed (2067)` test; xanh `215 passed (215)`, `2067 passed (2067)`; tsc sạch. Khớp. Commit `4cbcb47`.
- Task 2: đỏ `2 failed | 213 passed (215)`, `5 failed | 2063 passed (2068)`; xanh `215 passed (215)`, `2068 passed (2068)`; tsc sạch. Khớp. Commit `5425ce8`.
- Task 3: đỏ `1 failed | 215 passed (216)`, `2068 passed (2068)` (`Cannot find module './symptomDay'`); xanh `216 passed (216)`, `2083 passed (2083)`; tsc sạch. Khớp. Commit `aeb7bbe`.
- Task 4: đỏ `1 failed | 215 passed (216)`, `4 failed | 2083 passed (2087)`; xanh `216 passed (216)`, `2087 passed (2087)`; tsc sạch. Khớp. Commit `7e50903`.
- Task 5: đỏ `5 failed | 211 passed (216)`, `6 failed | 2085 passed (2091)`; xanh `216 passed (216)`, `2091 passed (2091)`; tsc sạch. Khớp. Commit `19304a5`.
- Step 1: `tsc --noEmit` sạch; `Test Files  216 passed (216)`, `Tests  2091 passed (2091)`.
- Step 2: lần đầu `bun run build` dựng xong 42/42 rồi dừng ở `SecurityFatalError` (thoát 1); chạy lại đúng lệnh: thoát 0, `Generating static pages … (42/42)`, `/bao-cao` và `/nhat-ky` vẫn `○`. Không chạy `next upgrade`.

- [x] **Step 4: Hỏi người dùng, rồi mới commit file spec, file plan và lên `main`**

Hỏi người dùng, bằng tiếng Việt, một lần, ba ý: (1) commit spec `docs/blueprint/specs/2026-11-27-kim-bun-trieu-chung-theo-ngay-design.md` và ba file plan `…-trieu-chung-theo-ngay-{a,b,c}.md` vào nhánh không; (2) đưa plan A lên `main` ngay, hay chờ B và C rồi lên cùng; (3) báo trước hai điều của khoảng giữa A và B: Nhật ký đã ghi "Cả ngày" cho bản ghi triệu chứng cũ có giờ (Diễn giải spec mục 1); và "Ghi bù" không còn "Triệu chứng" trong khi dải ngày chưa có, nên muốn ghi triệu chứng cho một ngày trước thì chỉ còn chip "Giờ khác" của phiếu cũ. Chỉ làm đúng điều người dùng đồng ý.

Nếu được đồng ý commit các file docs:

```bash
git add docs/blueprint/specs/2026-11-27-kim-bun-trieu-chung-theo-ngay-design.md docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-a.md docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-b.md docs/blueprint/plans/2026-11-27-kim-bun-trieu-chung-theo-ngay-c.md
git commit -m "docs: the spec and plans of symptoms by day, with plan A's check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Nếu được đồng ý lên `main` ngay:

```bash
git checkout main
git merge --ff-only feat/kim-bun-trieu-chung-theo-ngay-a
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit mới; kết quả typecheck, vitest, build; nhánh đang ở đâu; plan B chạy tiếp từ nhánh nào.

**Trả lời của người dùng (2026-11-27):** (1) commit spec và ba file plan vào nhánh `feat/kim-bun-trieu-chung-theo-ngay-a`; (2) chưa lên `main`: chờ plan B và C, cả ba lên cùng sau bước trình duyệt của C. Không push. Plan B cắt từ nhánh `feat/kim-bun-trieu-chung-theo-ngay-a`.
