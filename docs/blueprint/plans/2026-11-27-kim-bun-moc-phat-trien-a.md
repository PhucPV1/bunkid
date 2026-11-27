# Kim Bun — Mốc phát triển theo dòng thời gian, plan A: nội dung và luật Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-27-kim-bun-moc-phat-trien-dong-thoi-gian-design.md` (§3; §5 phần `lib/rules` và nội dung)

**Status:** approved 2026-11-27

**Goal:** Có tên ngắn cho 7 mốc vận động và các luật thuần, đủ test, cho dòng thời gian 8 mốc tháng, tóm tắt "Vận động lớn" và thanh khoảng tuổi, để plan B và C chỉ còn việc vẽ.

**Architecture:**

- **`content/milestones.vi.json` + `lib/content/milestones.ts`:** thêm trường `short` (chuỗi khác rỗng) cho mỗi mốc vận động.
- **`lib/rules/milestones.ts`:** đổi chữ của `motorStatus`; thêm `motorRange`, `motorSummary`, `MOTOR_AXIS_MONTHS`, `motorBar`, kiểu `StepKind` và `TimelineStep`, `timelineSteps`, `defaultOpenMonths`. `visibleGroups` **còn giữ** ở plan A (màn cũ vẫn dùng); plan C xóa nó.
- Không đổi dữ liệu, không thêm gói, không thêm token màu, không thêm icon. Màn hình chưa đổi, trừ chữ trong chip vận động của màn cũ (Diễn giải 2).

**Tech Stack:** Next.js 16.4.6, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind 4.3.3, Vitest 5.0.5, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-moc-phat-trien`, cắt từ `main` @ `b1f1bdd`. Baseline: `Test Files  220 passed (220)`, `Tests  2140 passed (2140)`, typecheck sạch.

**Các plan của spec này:**

| Plan | Nội dung | File |
| --- | --- | --- |
| A | Trường `short` của 7 mốc vận động (§3.4) và các luật thuần của dòng thời gian, tóm tắt vận động, thanh khoảng tuổi (§3, §5), có test. Chưa đổi màn hình. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-a.md` |
| B | Hai component hiển thị mới không gọi hook dữ liệu: `MilestoneTimeline` (§4.3), `MotorSheet` và `AskDoctorSheet` (§4.4, §4.5), có test render. Chưa gắn vào màn. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-b.md` |
| C | `MilestonesScreen` ghép mọi phần (§4.1, §4.2, §4.6), bỏ `visibleGroups`, test màn; kiểm cuối, trang fixture, trình duyệt (§6), Bước 41 của checklist (§7), hỏi trước khi lên `main`. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-c.md` |

A, B, C chạy lần lượt trên cùng nhánh `feat/kim-bun-moc-phat-trien` và lên `main` cùng nhau ở cuối plan C (A và B không push riêng).

**Diễn giải spec** (chỗ spec để plan chốt, hoặc phải chọn một cách đọc):

1. **`visibleGroups` bị xóa ở plan C, không ở plan A.** Spec §4.1 nói xóa nó; nếu xóa ở plan A thì `MilestonesScreen` cũ không còn biên dịch giữa hai plan. Plan C xóa hàm và test của nó cùng lúc thay màn.
2. **Chữ mới của `motorStatus` hiện tạm trên màn cũ.** Từ plan A tới plan C, chip của khối "Mốc vận động lớn" cũ ghi "Sắp tới", "Đang tới tuổi", "Nên hỏi bác sĩ". Chỉ trên nhánh, không push.
3. **Chữ ký chốt** (spec §5 để plan chốt): `motorSummary(motor: readonly MotorMilestone[], ageMonths: number, achieved: ReadonlySet<string>)`; `timelineSteps(groups: MilestoneGroup[], ageMonths: number, achieved: ReadonlySet<string>, loaded: boolean, babyName: string)`; `motorBar(milestone, ageMonths)` trả về ba chuỗi phần trăm; `defaultOpenMonths(groups, ageMonths)` trả về số tháng của mốc mở sẵn. `achieved` là tập `milestone_code` đã có bản ghi (cả bản ghi chờ đồng bộ).
4. **Mốc đã qua khi chưa có dữ liệu** có `kind = "next"` (spec §3.2, §5) và `summary = null`; mọi mốc khác cũng `summary = null`.
5. **`motorStatus` giữ chữ "Đã đạt" cho `done`** (spec §3.4). Chip của mốc đã đạt trong sheet (plan B) không dùng chữ này mà ghi "Đạt dd/mm/yyyy" từ bản ghi (spec §4.4).
6. **Định dạng phần trăm:** `Number((fraction * 100).toFixed(1)) + "%"`, nên `30%` chứ không `30.0%`, và `0%` (spec §3.5).

## Global Constraints

Chép nguyên văn mục 2 của spec:

- Không migration, không đổi bảng `milestones_achieved`, không đổi RLS. Đọc và ghi vẫn qua `useMilestones` / `useMilestoneActions` (`lib/data/milestones.ts`) như hiện tại.
- Tuổi theo tháng: `ageInMonths(ageDays(baby.dob, now))` (`lib/rules/milestones.ts`, `lib/rules/time.ts`), 30,4375 ngày một tháng, như hiện tại. `now` là `new Date()` lúc render.
- Nội dung chỉ đọc từ `content/milestones.vi.json` qua `MILESTONES` (`lib/content/milestones.ts`). Thay đổi nội dung duy nhất: thêm trường `short` cho 7 mốc vận động (§3.4). `public/content/milestones.vi.json` là bản sao bị git bỏ qua, do `scripts/copy-content.ts` tạo lại ở `prebuild`; không sửa tay, không commit. Trường `short` chỉ thêm vào, không đổi trường cũ, nên nơi khác đọc `/content/*.vi.json` không bị ảnh hưởng.
- Không icon mới: dùng `star`, `check`, `alert`, `chevronDown`, `chevronUp`, `chevronRight`, `close` có sẵn trong `lib/ui/icons.ts`. Dấu chờ đồng bộ dùng `PendingMark` có sẵn (qua `MilestoneItem`). Không token màu mới.
- Vùng bấm tối thiểu 44 px, như mọi nút của app.
- Chữ trên màn hình viết đúng như spec này ghi trong ngoặc kép. Dấu gạch nối khoảng số là en dash "–" (U+2013). Dấu chấm giữa là "·" (U+00B7) có một khoảng trắng mỗi bên. Số thập phân dùng dấu phẩy ("3,8"), như `motorStatus` đang làm.
- Không thêm câu thống kê kiểu "… trong 100 bé" (ghi chú người dùng 2026-11-25).
- Rules thuần nằm trong `lib/rules/`, có test vitest; component hiển thị có test render bằng `renderToStaticMarkup` như các file `*.test.tsx` hiện có.
- Hết spec: `bun run typecheck` sạch, toàn bộ vitest xanh, `bun run build` thoát 0.

Giữ từ các spec trước (không đổi ở spec này):

- Chỉ tiếng Việt; Next.js 16.4.6, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; không thêm dependency, không web font.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md). Ba plan này không dùng API mới nào của Next.
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`. Theme `night` chỉ có một tông màu: không trạng thái nào được phân biệt chỉ bằng màu (mốc mở/gập khác nhau bằng mũi tên; mốc đã qua còn thiếu có dấu "!" và chữ, không chỉ màu cam).
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bỏ đánh dấu mốc nào. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Push lên `main` cần người dùng đồng ý từng lần.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi code nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 14 patch của ba plan (A: 4, B: 4, C: 4 + trang fixture và checklist) đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `b1f1bdd`, có `node_modules` riêng (`bun install --frozen-lockfile`). Mỗi task code là hai commit (test trước, code sau). Số test đỏ và xanh ghi trong từng bước là số đo thật trên cả bộ test; `tsc --noEmit` sạch sau mỗi commit code (ở bước đỏ có lỗi typecheck thì plan ghi rõ). Cây file cuối giống hệt bản đã viết lúc soạn plan. `bun run build` ở trạng thái cuối thoát 0 ngay lần đầu, `Generating static pages … (42/42)`, `/phat-trien` vẫn `○`; các class mới (`ring-5`, `ring-accent-tint`, `bg-ink/7`, `bg-muted/45`, `bg-ink/15`, `size-[22px]`, `size-[34px]`) có trong CSS đã build. **Chưa chạy khi viết plan:** mọi bước trình duyệt.
- **Không sửa patch bằng công cụ có prettier.** Một hook PostToolUse chạy prettier lên mọi file `.md` vừa được Edit/Write, và nó đổi các dòng trống trong khối `diff` (patch hỏng). Ghi kết quả vào file plan bằng một script (ví dụ `python3` mở file, thay chuỗi, ghi lại), không bằng Edit/Write.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài spec.
- **`bun run build` và `bun run dev`** có thể dừng một hay vài lần với thông báo cảnh báo bảo mật của Next.js (`SecurityFatalError`); chạy lại đúng lệnh tới khi thoát 0. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Spec và ba file plan chưa được commit.** `git status` thấy spec `docs/blueprint/specs/2026-11-27-kim-bun-moc-phat-trien-dong-thoi-gian-design.md` và ba file plan `…-moc-phat-trien-{a,b,c}.md` là untracked. Chỉ task cuối của plan C commit chúng, khi người dùng đồng ý.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **Không push.** Plan A dừng trên nhánh; plan B chạy tiếp trên cùng nhánh.

## Contracts with Other Plans

**Consumes:** chỉ code có sẵn trên `main` @ `b1f1bdd`.

**Produces (plan B và C dùng):**

- `MotorMilestone` (`lib/content/milestones.ts`) có thêm `short: string`; `MILESTONES.motor[i].short` lần lượt "lật", "ngồi", "đứng có đỡ", "bò", "đi có dắt", "tự đứng", "tự đi".
- `lib/rules/milestones.ts`:
  - `motorStatus(milestone: MotorMilestone, ageMonths: number, achieved: boolean): { state: MotorState; text: string }` với `text` "Đã đạt" / "Sắp tới" / "Đang tới tuổi" / "Nên hỏi bác sĩ"
  - `type MotorState = "done" | "early" | "window" | "late"` (không đổi)
  - `motorRange(milestone: MotorMilestone): string` → `"Thường trong khoảng 3,8–9,2 tháng"`
  - `motorSummary(motor: readonly MotorMilestone[], ageMonths: number, achieved: ReadonlySet<string>): { tone: "muted" | "warn"; text: string }`
  - `const MOTOR_AXIS_MONTHS = 18`
  - `motorBar(milestone: MotorMilestone, ageMonths: number): { left: string; width: string; today: string }` → ví dụ `{ left: "21.1%", width: "30%", today: "27.8%" }`
  - `type StepKind = "past-done" | "past-missing" | "current" | "next" | "later"`
  - `type TimelineStep = { group: MilestoneGroup; kind: StepKind; summary: string | null; summaryTone: "muted" | "warn" }`
  - `timelineSteps(groups: MilestoneGroup[], ageMonths: number, achieved: ReadonlySet<string>, loaded: boolean, babyName: string): TimelineStep[]`
  - `defaultOpenMonths(groups: MilestoneGroup[], ageMonths: number): number`
  - `visibleGroups` vẫn còn (plan C xóa).
- **Vitest sau plan A:** `Test Files  220 passed (220)`, `Tests  2153 passed (2153)`.

---

### Task 1: Tên ngắn của 7 mốc vận động (spec §3.4)

**Files:**

- Modify: `content/milestones.vi.json` (7 dòng của mảng `motor`)
- Modify: `lib/content/milestones.ts` (`MotorMilestoneSchema`)
- Test: `lib/content/milestones.test.ts`

**Interfaces:**

- Consumes: `MILESTONES` (`lib/content/milestones.ts`).
- Produces: `MotorMilestone.short: string`.

- [x] **Step 0: Tạo nhánh và đo baseline**

```bash
git checkout main
git rev-parse --short main   # b1f1bdd
git checkout -b feat/kim-bun-moc-phat-trien
bunx vitest run   # Test Files  220 passed (220), Tests  2140 passed (2140)
```

Expected: `main` là `b1f1bdd` (nếu `main` đã đi tiếp thì dừng và hỏi người dùng); vitest như dòng chú thích.

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/content/milestones.test.ts b/lib/content/milestones.test.ts
index f21398d..55e1b86 100644
--- a/lib/content/milestones.test.ts
+++ b/lib/content/milestones.test.ts
@@ -37,4 +37,16 @@ describe("content/milestones.vi.json (spec §6.9, §10.2)", () => {
     ]);
     for (const m of MILESTONES.motor) expect(m.source).toMatch(/^https:\/\//);
   });
+
+  it("has a short lower-case name for each motor milestone (spec 2026-11-27 §3.4)", () => {
+    expect(MILESTONES.motor.map((m) => [m.code, m.short])).toEqual([
+      ["lat", "lật"],
+      ["ngoi", "ngồi"],
+      ["dung_co_do", "đứng có đỡ"],
+      ["bo", "bò"],
+      ["di_co_dat", "đi có dắt"],
+      ["tu_dung", "tự đứng"],
+      ["tu_di", "tự đi"],
+    ]);
+  });
 });
```

- [x] **Step 2: Chạy, thấy đỏ**

Run: `bunx vitest run lib/content/milestones.test.ts; bunx vitest run`
Expected: file test `Tests  1 failed | 3 passed (4)`, lỗi `expected [ [ 'lat', undefined ], …(6) ] to deeply equal [ [ 'lat', 'lật' ], …(6) ]`; cả bộ `Test Files  1 failed | 219 passed (220)`, `Tests  1 failed | 2140 passed (2141)`. (`tsc --noEmit` lúc này báo `Property 'short' does not exist`, là đúng ở bước đỏ.)

- [x] **Step 3: Commit test**

```bash
git add lib/content/milestones.test.ts
git commit -m "test(milestones): short names for the motor milestones" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 4: Thêm `short` vào nội dung và schema (Patch 2)**

```diff
diff --git a/content/milestones.vi.json b/content/milestones.vi.json
index b435eee..b69b16d 100644
--- a/content/milestones.vi.json
+++ b/content/milestones.vi.json
@@ -14,12 +14,12 @@
     {"months": 24, "items": [{"code": "m24_social_1", "domain": "social", "text": "Nhận ra khi người khác đau hoặc buồn"}, {"code": "m24_social_2", "domain": "social", "text": "Nhìn mặt bạn để biết phản ứng thế nào trong tình huống mới"}, {"code": "m24_language_1", "domain": "language", "text": "Chỉ vào hình trong sách khi được hỏi"}, {"code": "m24_language_2", "domain": "language", "text": "Nói được ít nhất hai từ ghép nhau, như \"thêm sữa\""}, {"code": "m24_language_3", "domain": "language", "text": "Chỉ được ít nhất hai bộ phận cơ thể khi được hỏi"}, {"code": "m24_language_4", "domain": "language", "text": "Dùng cử chỉ ngoài vẫy và chỉ, như hôn gió, gật đầu"}, {"code": "m24_cognitive_1", "domain": "cognitive", "text": "Cầm đồ một tay, dùng tay kia làm việc khác (như cầm hộp, mở nắp)"}, {"code": "m24_cognitive_2", "domain": "cognitive", "text": "Thử bấm công tắc, núm, nút trên đồ chơi"}, {"code": "m24_cognitive_3", "domain": "cognitive", "text": "Chơi nhiều đồ chơi cùng lúc"}, {"code": "m24_movement_1", "domain": "movement", "text": "Đá bóng"}, {"code": "m24_movement_2", "domain": "movement", "text": "Chạy"}, {"code": "m24_movement_3", "domain": "movement", "text": "Bước lên vài bậc cầu thang (có hoặc không cần giúp)"}, {"code": "m24_movement_4", "domain": "movement", "text": "Ăn bằng thìa"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/2-years.html", "reviewedAt": "2026-11-14"}
   ],
   "motor": [
-    {"code": "lat", "name": "Lật (từ sấp sang ngửa)", "fromMonths": 4, "toMonths": 6, "source": "https://www.cdc.gov/act-early/milestones/6-months.html", "reviewedAt": "2026-11-14"},
-    {"code": "ngoi", "name": "Ngồi không cần đỡ", "fromMonths": 3.8, "toMonths": 9.2, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
-    {"code": "dung_co_do", "name": "Đứng có người đỡ", "fromMonths": 4.8, "toMonths": 11.4, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
-    {"code": "bo", "name": "Bò bằng tay và gối", "fromMonths": 5.2, "toMonths": 13.5, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
-    {"code": "di_co_dat", "name": "Đi có người dắt", "fromMonths": 6.0, "toMonths": 13.7, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
-    {"code": "tu_dung", "name": "Tự đứng", "fromMonths": 6.9, "toMonths": 16.9, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
-    {"code": "tu_di", "name": "Tự đi", "fromMonths": 8.2, "toMonths": 17.6, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"}
+    {"code": "lat", "name": "Lật (từ sấp sang ngửa)", "short": "lật", "fromMonths": 4, "toMonths": 6, "source": "https://www.cdc.gov/act-early/milestones/6-months.html", "reviewedAt": "2026-11-14"},
+    {"code": "ngoi", "name": "Ngồi không cần đỡ", "short": "ngồi", "fromMonths": 3.8, "toMonths": 9.2, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
+    {"code": "dung_co_do", "name": "Đứng có người đỡ", "short": "đứng có đỡ", "fromMonths": 4.8, "toMonths": 11.4, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
+    {"code": "bo", "name": "Bò bằng tay và gối", "short": "bò", "fromMonths": 5.2, "toMonths": 13.5, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
+    {"code": "di_co_dat", "name": "Đi có người dắt", "short": "đi có dắt", "fromMonths": 6.0, "toMonths": 13.7, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
+    {"code": "tu_dung", "name": "Tự đứng", "short": "tự đứng", "fromMonths": 6.9, "toMonths": 16.9, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
+    {"code": "tu_di", "name": "Tự đi", "short": "tự đi", "fromMonths": 8.2, "toMonths": 17.6, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"}
   ]
 }
diff --git a/lib/content/milestones.ts b/lib/content/milestones.ts
index d37b1e3..c92cc71 100644
--- a/lib/content/milestones.ts
+++ b/lib/content/milestones.ts
@@ -33,6 +33,8 @@ export const MotorMilestoneSchema = z
   .object({
     code,
     name: z.string().min(1),
+    // Spec 2026-11-27 §3.4: lower-case name for the "Vận động lớn" summary.
+    short: z.string().min(1),
     // Normal age window in months: WHO 1st–99th percentile for the six WHO
     // milestones; "lat" (rolling) uses the 4–6 months of spec §6.9 / CDC.
     fromMonths: z.number().min(0),
```

- [x] **Step 5: Chạy, thấy xanh**

Run: `bunx vitest run lib/content/milestones.test.ts && bun run typecheck && bunx vitest run`
Expected: file test `Tests  4 passed (4)`; `tsc --noEmit` không báo lỗi; cả bộ `Test Files  220 passed (220)`, `Tests  2141 passed (2141)`.

- [x] **Step 6: Commit**

```bash
git add content/milestones.vi.json lib/content/milestones.ts
git commit -m "feat(milestones): short names for the motor milestones" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Luật của dòng thời gian, tóm tắt vận động, thanh khoảng tuổi (spec §3)

**Files:**

- Modify: `lib/rules/milestones.ts` (thay `motorStatus`, thêm hàm mới sau nó)
- Test: `lib/rules/milestones.test.ts`

**Interfaces:**

- Consumes: `MILESTONES`, `MilestoneGroup`, `MotorMilestone` với `short` (Task 1).
- Produces: mọi tên của `lib/rules/milestones.ts` trong Contracts.

- [x] **Step 1: Viết test đỏ (Patch 3)**

Test phủ: chữ mới của `motorStatus` (cả biên 3,8 và 9,2/9,3); `motorRange` có số thập phân dấu phẩy và số nguyên; `motorSummary` ở 5 tháng ("Đã lật · đang tới tuổi ngồi, đứng có đỡ"), 7 tháng, 3,9 tháng, 1 tháng, 4,5 tháng, mốc trễ ở 14 và 6,5 tháng, đủ 7 mốc; `motorBar` của `ngoi`, `lat`, `tu_di` ở 30 tháng; `timelineSteps` ở 0,5 / 2 / 3,9 / 5 / 13 / 30 tháng, chữ tóm tắt của từng loại, khi chưa có dữ liệu; `defaultOpenMonths`.

```diff
diff --git a/lib/rules/milestones.test.ts b/lib/rules/milestones.test.ts
index 9088c6c..07074a5 100644
--- a/lib/rules/milestones.test.ts
+++ b/lib/rules/milestones.test.ts
@@ -1,9 +1,19 @@
 import { describe, expect, it } from "vitest";
-import type { MilestoneGroup, MotorMilestone } from "@/lib/content/milestones";
+import {
+  MILESTONES,
+  type MilestoneGroup,
+  type MotorMilestone,
+} from "@/lib/content/milestones";
 import {
   ageInMonths,
+  defaultOpenMonths,
+  MOTOR_AXIS_MONTHS,
+  motorBar,
+  motorRange,
   motorStatus,
+  motorSummary,
   parseMilestoneForm,
+  timelineSteps,
   visibleGroups,
 } from "./milestones";
 
@@ -27,16 +37,20 @@ describe("motorStatus", () => {
     fromMonths: 3.8,
     toMonths: 9.2,
   } as MotorMilestone;
-  it("is early, in the window, late, or done", () => {
+  it("is early, in the window, late, or done (spec 2026-11-27 §3.4)", () => {
     expect(motorStatus(sitting, 2, false)).toEqual({
       state: "early",
-      text: "Thường trong khoảng 3,8–9,2 tháng",
+      text: "Sắp tới",
+    });
+    expect(motorStatus(sitting, 3.8, false)).toEqual({
+      state: "window",
+      text: "Đang tới tuổi",
     });
     expect(motorStatus(sitting, 6, false).state).toBe("window");
     expect(motorStatus(sitting, 9.2, false).state).toBe("window");
     expect(motorStatus(sitting, 9.3, false)).toEqual({
       state: "late",
-      text: "Đã quá khoảng bình thường (3,8–9,2 tháng), nên hỏi bác sĩ",
+      text: "Nên hỏi bác sĩ",
     });
     expect(motorStatus(sitting, 12, true)).toEqual({
       state: "done",
@@ -44,11 +58,178 @@ describe("motorStatus", () => {
     });
   });
 
+  it("says the normal window with a decimal comma", () => {
+    expect(motorRange(sitting)).toBe("Thường trong khoảng 3,8–9,2 tháng");
+    expect(motorRange({ fromMonths: 4, toMonths: 6 } as MotorMilestone)).toBe(
+      "Thường trong khoảng 4–6 tháng",
+    );
+  });
+
   it("converts days to months", () => {
     expect(ageInMonths(30.4375 * 6)).toBe(6);
   });
 });
 
+const motor = MILESTONES.motor;
+const codes = (...list: string[]) => new Set(list);
+
+describe("motorSummary (spec 2026-11-27 §3.4)", () => {
+  it("names the last milestone reached and those in their window", () => {
+    expect(motorSummary(motor, 5, codes("lat"))).toEqual({
+      tone: "muted",
+      text: "Đã lật · đang tới tuổi ngồi, đứng có đỡ",
+    });
+    expect(motorSummary(motor, 7, codes("lat", "ngoi", "bo"))).toEqual({
+      tone: "muted",
+      text: "Đã bò · đang tới tuổi đứng có đỡ, đi có dắt, tự đứng",
+    });
+  });
+
+  it("starts with the window when nothing is reached yet", () => {
+    expect(motorSummary(motor, 3.9, codes())).toEqual({
+      tone: "muted",
+      text: "Đang tới tuổi ngồi",
+    });
+  });
+
+  it("names the first coming milestone when none is reached or due", () => {
+    expect(motorSummary(motor, 1, codes())).toEqual({
+      tone: "muted",
+      text: "Sắp tới tuổi lật",
+    });
+    expect(motorSummary(motor, 4.5, codes("lat", "ngoi"))).toEqual({
+      tone: "muted",
+      text: "Đã ngồi",
+    });
+  });
+
+  it("warns about every late milestone", () => {
+    expect(motorSummary(motor, 14, codes("lat", "ngoi", "dung_co_do"))).toEqual(
+      { tone: "warn", text: "Bò, đi có dắt: nên hỏi bác sĩ" },
+    );
+    expect(motorSummary(motor, 6.5, codes())).toEqual({
+      tone: "warn",
+      text: "Lật: nên hỏi bác sĩ",
+    });
+  });
+
+  it("says when all of them are reached", () => {
+    const all = codes(...motor.map((m) => m.code));
+    expect(motorSummary(motor, 20, all)).toEqual({
+      tone: "muted",
+      text: `Đã đạt đủ ${motor.length} mốc`,
+    });
+    expect(motor.length).toBe(7);
+  });
+});
+
+describe("motorBar (spec 2026-11-27 §3.5)", () => {
+  const byCode = (code: string) => motor.find((m) => m.code === code)!;
+  it("places the window on a 0–18 month axis, as CSS percentages", () => {
+    expect(MOTOR_AXIS_MONTHS).toBe(18);
+    expect(motorBar(byCode("ngoi"), 5)).toEqual({
+      left: "21.1%",
+      width: "30%",
+      today: "27.8%",
+    });
+    expect(motorBar(byCode("lat"), 0)).toEqual({
+      left: "22.2%",
+      width: "11.1%",
+      today: "0%",
+    });
+  });
+
+  it("keeps today's line at the end of the axis after 18 months", () => {
+    expect(motorBar(byCode("tu_di"), 30)).toEqual({
+      left: "45.6%",
+      width: "52.2%",
+      today: "100%",
+    });
+  });
+});
+
+describe("timelineSteps (spec 2026-11-27 §3.1–§3.2)", () => {
+  const groups = MILESTONES.groups;
+  const kinds = (age: number) =>
+    timelineSteps(groups, age, codes(), true, "Bun").map(
+      (s) => `${s.group.months}:${s.kind}`,
+    );
+  const allOf = (months: number) =>
+    groups.find((g) => g.months === months)!.items.map((i) => i.code);
+
+  it("puts the baby on the timeline", () => {
+    expect(kinds(0.5)).toEqual([
+      "2:next",
+      "4:later",
+      "6:later",
+      "9:later",
+      "12:later",
+      "15:later",
+      "18:later",
+      "24:later",
+    ]);
+    expect(kinds(2).slice(0, 3)).toEqual(["2:current", "4:next", "6:later"]);
+    expect(kinds(3.9).slice(0, 3)).toEqual(["2:current", "4:next", "6:later"]);
+    expect(kinds(5).slice(0, 4)).toEqual([
+      "2:past-missing",
+      "4:current",
+      "6:next",
+      "9:later",
+    ]);
+    expect(kinds(13)).toEqual([
+      "2:past-missing",
+      "4:past-missing",
+      "6:past-missing",
+      "9:past-missing",
+      "12:current",
+      "15:next",
+      "18:later",
+      "24:later",
+    ]);
+    expect(kinds(30).slice(-2)).toEqual(["18:past-missing", "24:current"]);
+  });
+
+  it("writes the summary of each kind", () => {
+    const two = allOf(2);
+    const done = codes(...two.slice(0, -1), allOf(4)[0], allOf(6)[0]);
+    const steps = timelineSteps(groups, 5, done, true, "Bun");
+    expect(steps.slice(0, 4).map((s) => [s.summary, s.summaryTone])).toEqual([
+      ["Còn 1 mốc chưa đạt · nên hỏi bác sĩ", "warn"],
+      ["Bun đang ở đây · đạt 1/13", "muted"],
+      ["Sắp tới · đạt 1/12", "muted"],
+      ["Sau này", "muted"],
+    ]);
+    const full = timelineSteps(groups, 5, codes(...two), true, "Bun");
+    expect(full[0]).toMatchObject({
+      kind: "past-done",
+      summary: "Đạt đủ 11 mốc",
+      summaryTone: "muted",
+    });
+    expect(full[2].summary).toBe("Sắp tới");
+    const later = timelineSteps(groups, 5, codes(allOf(9)[0]), true, "Bun");
+    expect(later[3].summary).toBe("Đạt 1/13");
+  });
+
+  it("shows no summary and no orange before the data is loaded", () => {
+    const steps = timelineSteps(groups, 5, codes(), false, "Bun");
+    expect(steps.map((s) => s.summary)).toEqual(groups.map(() => null));
+    expect(steps.slice(0, 3).map((s) => s.kind)).toEqual([
+      "next",
+      "current",
+      "next",
+    ]);
+  });
+});
+
+describe("defaultOpenMonths (spec 2026-11-27 §3.3)", () => {
+  it("opens the current group, or the first one for a newborn", () => {
+    const groups = MILESTONES.groups;
+    expect(defaultOpenMonths(groups, 0.5)).toBe(2);
+    expect(defaultOpenMonths(groups, 5)).toBe(4);
+    expect(defaultOpenMonths(groups, 30)).toBe(24);
+  });
+});
+
 describe("parseMilestoneForm", () => {
   const ctx = { dob: "2026-09-14", today: "2026-11-14" };
   it("needs a day between birth and today and a short note", () => {
```

- [x] **Step 2: Chạy, thấy đỏ**

Run: `bunx vitest run lib/rules/milestones.test.ts; bunx vitest run`
Expected: file test `Tests  13 failed | 3 passed (16)` (lỗi kiểu `TypeError: motorRange is not a function`; 3 test còn xanh là `visibleGroups`, "converts days to months", `parseMilestoneForm`); cả bộ `Test Files  1 failed | 219 passed (220)`, `Tests  13 failed | 2140 passed (2153)`. (`tsc --noEmit` báo thiếu export, là đúng ở bước đỏ.)

- [x] **Step 3: Commit test**

```bash
git add lib/rules/milestones.test.ts
git commit -m "test(milestones): timeline, motor summary and bars" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 4: Viết luật (Patch 4)**

```diff
diff --git a/lib/rules/milestones.ts b/lib/rules/milestones.ts
index fa20b79..7dd06e3 100644
--- a/lib/rules/milestones.ts
+++ b/lib/rules/milestones.ts
@@ -20,26 +20,148 @@ export type MotorState = "done" | "early" | "window" | "late";
 
 const months = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
 
+// Spec 2026-11-27 §3.4: short words for the chip in the "Vận động lớn" sheet.
 export function motorStatus(
   milestone: MotorMilestone,
   ageMonths: number,
   achieved: boolean,
 ): { state: MotorState; text: string } {
-  const range = `${months.format(milestone.fromMonths)}–${months.format(milestone.toMonths)} tháng`;
   if (achieved) return { state: "done", text: "Đã đạt" };
   if (ageMonths < milestone.fromMonths)
-    return { state: "early", text: `Thường trong khoảng ${range}` };
+    return { state: "early", text: "Sắp tới" };
   if (ageMonths <= milestone.toMonths)
+    return { state: "window", text: "Đang tới tuổi" };
+  return { state: "late", text: "Nên hỏi bác sĩ" };
+}
+
+// The normal window, for screen readers in the sheet.
+export function motorRange(milestone: MotorMilestone): string {
+  return `Thường trong khoảng ${months.format(milestone.fromMonths)}–${months.format(milestone.toMonths)} tháng`;
+}
+
+const capitalize = (text: string) =>
+  text.charAt(0).toUpperCase() + text.slice(1);
+
+// Spec 2026-11-27 §3.4: the line under "Vận động lớn" names milestones, no
+// counts, and turns orange when one is late.
+export function motorSummary(
+  motor: readonly MotorMilestone[],
+  ageMonths: number,
+  achieved: ReadonlySet<string>,
+): { tone: "muted" | "warn"; text: string } {
+  const states = motor.map((m) => ({
+    m,
+    state: motorStatus(m, ageMonths, achieved.has(m.code)).state,
+  }));
+  const named = (state: MotorState) =>
+    states.filter((s) => s.state === state).map((s) => s.m.short);
+  const late = named("late");
+  if (late.length > 0)
     return {
-      state: "window",
-      text: `Đang trong khoảng bình thường (${range})`,
+      tone: "warn",
+      text: `${capitalize(late.join(", "))}: nên hỏi bác sĩ`,
     };
+  const done = named("done");
+  if (done.length === motor.length)
+    return { tone: "muted", text: `Đã đạt đủ ${motor.length} mốc` };
+  const window = named("window");
+  const parts = [
+    done.length > 0 ? `đã ${done[done.length - 1]}` : "",
+    window.length > 0 ? `đang tới tuổi ${window.join(", ")}` : "",
+  ].filter(Boolean);
+  if (parts.length === 0) parts.push(`sắp tới tuổi ${named("early")[0]}`);
+  return { tone: "muted", text: capitalize(parts.join(" · ")) };
+}
+
+// Spec 2026-11-27 §3.5: the age-window bars run from 0 to 18 months.
+export const MOTOR_AXIS_MONTHS = 18;
+
+const percent = (fraction: number) => `${Number((fraction * 100).toFixed(1))}%`;
+
+export function motorBar(
+  milestone: MotorMilestone,
+  ageMonths: number,
+): { left: string; width: string; today: string } {
+  const axis = MOTOR_AXIS_MONTHS;
+  const to = Math.min(milestone.toMonths, axis);
   return {
-    state: "late",
-    text: `Đã quá khoảng bình thường (${range}), nên hỏi bác sĩ`,
+    left: percent(milestone.fromMonths / axis),
+    width: percent((to - milestone.fromMonths) / axis),
+    today: percent(Math.min(ageMonths, axis) / axis),
   };
 }
 
+export type StepKind =
+  "past-done" | "past-missing" | "current" | "next" | "later";
+
+export type TimelineStep = {
+  group: MilestoneGroup;
+  kind: StepKind;
+  summary: string | null;
+  summaryTone: "muted" | "warn";
+};
+
+// Spec 2026-11-27 §3.1: the last group the baby has reached, or -1 before
+// the first one.
+function currentIndex(groups: MilestoneGroup[], ageMonths: number): number {
+  let current = -1;
+  groups.forEach((group, index) => {
+    if (group.months <= ageMonths) current = index;
+  });
+  return current;
+}
+
+// Spec 2026-11-27 §3.1–§3.2: every month group with its kind and summary.
+// Before the data is loaded nothing is orange and no group has a summary.
+export function timelineSteps(
+  groups: MilestoneGroup[],
+  ageMonths: number,
+  achieved: ReadonlySet<string>,
+  loaded: boolean,
+  babyName: string,
+): TimelineStep[] {
+  const current = currentIndex(groups, ageMonths);
+  return groups.map((group, index) => {
+    const total = group.items.length;
+    const done = group.items.filter((i) => achieved.has(i.code)).length;
+    const step = (
+      kind: StepKind,
+      summary: string,
+      summaryTone: "muted" | "warn" = "muted",
+    ): TimelineStep => ({
+      group,
+      kind,
+      summary: loaded ? summary : null,
+      summaryTone,
+    });
+    if (index < current) {
+      if (!loaded) return step("next", "");
+      if (done === total) return step("past-done", `Đạt đủ ${total} mốc`);
+      return step(
+        "past-missing",
+        `Còn ${total - done} mốc chưa đạt · nên hỏi bác sĩ`,
+        "warn",
+      );
+    }
+    if (index === current)
+      return step("current", `${babyName} đang ở đây · đạt ${done}/${total}`);
+    if (index === current + 1)
+      return step(
+        "next",
+        done === 0 ? "Sắp tới" : `Sắp tới · đạt ${done}/${total}`,
+      );
+    return step("later", done === 0 ? "Sau này" : `Đạt ${done}/${total}`);
+  });
+}
+
+// Spec 2026-11-27 §3.3: the group open when the screen opens.
+export function defaultOpenMonths(
+  groups: MilestoneGroup[],
+  ageMonths: number,
+): number {
+  return groups[Math.max(currentIndex(groups, ageMonths), 0)].months;
+}
+
 export function parseMilestoneForm(
   raw: { achievedOn: string; note: string },
   ctx: { dob: string; today: string },
```

- [x] **Step 5: Chạy, thấy xanh**

Run: `bunx vitest run lib/rules/milestones.test.ts && bun run typecheck && bunx vitest run`
Expected: file test `Tests  16 passed (16)`; `tsc --noEmit` không báo lỗi; cả bộ `Test Files  220 passed (220)`, `Tests  2153 passed (2153)`.

- [x] **Step 6: Commit**

```bash
git add lib/rules/milestones.ts
git commit -m "feat(milestones): timeline steps, motor summary and bars" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 7: Dừng, chưa push**

Plan A xong trên nhánh `feat/kim-bun-moc-phat-trien`. Không push, không merge: plan B chạy tiếp trên cùng nhánh này.

## Kết quả thực thi (2026-11-27)

- Step 0: `main` = `b1f1bdd`; nhánh `feat/kim-bun-moc-phat-trien` tạo từ đó; baseline `Test Files  220 passed (220)`, `Tests  2140 passed (2140)`.
- Task 1: Patch 1 áp sạch; đỏ `Tests  1 failed | 3 passed (4)` (lỗi `expected [ [ 'lat', undefined ], …(6) ]…`), cả bộ `Test Files  1 failed | 219 passed (220)`, `Tests  1 failed | 2140 passed (2141)`; commit `05e292e`. Patch 2 áp sạch; xanh `Tests  4 passed (4)`, typecheck sạch, cả bộ `220 passed (220)` / `2141 passed (2141)`; commit `0180d72`.
- Task 2: Patch 3 áp sạch; đỏ `Tests  13 failed | 3 passed (16)` (`TypeError: motorRange is not a function`), cả bộ `Test Files  1 failed | 219 passed (220)`, `Tests  13 failed | 2140 passed (2153)`; commit `b3ad654`. Patch 4 áp sạch; xanh `Tests  16 passed (16)`, typecheck sạch, cả bộ `220 passed (220)` / `2153 passed (2153)`; commit `bf6d3c0`.
- Mọi số khớp plan. Không push.
