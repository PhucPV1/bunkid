# Kim Bun — UX mobile M5a: thẻ "cần làm trước" và luật của bảng tiêm chủng Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§7.1; phần luật của §7.2; phần tương ứng của §11.1)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Trang Tiêm chủng mở ra là thấy ngay mũi cần làm trước, và có sẵn các hàm thuần xếp lịch tiêm thành bảng vắc xin × mũi để M5b vẽ.

**Architecture:**

- **Luật thuần:** `nextDose`, `nextDoseLabel` trong `lib/rules/vaccines.ts`; file mới `lib/rules/vaccineGrid.ts` với `vaccineGrid` và `doseCell`; `formatDayFull` trong `lib/rules/days.ts`.
- **Giao diện:** component mới `NextDoseCard`, nối vào `VaccineScreen`.
- **Chưa làm ở plan này (thuộc M5b):** component bảng `DoseGrid`, thay danh sách cũ, sửa `DoseSheet`.
- `vaccineSummary` trong `lib/rules/report.ts` không đổi. Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m5a`, cắt từ `main` @ `34f18f6`. Baseline: 1016 test vitest xanh (153 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a, M2b, M2c | §3 trang Hôm nay | đã xong, đã lên `main` @ `e1e729f` |
| M6 | phần còn lại của §8 Thống kê | đã xong, đã lên `main` @ `34f18f6` |
| **M5a (plan này)** | §7.1 thẻ "cần làm trước", luật của §7.2 | `2026-11-19-kim-bun-ux-mobile-m5a.md` |
| M5b | §7.2 bảng vắc xin × mũi, §7.3 | `2026-11-19-kim-bun-ux-mobile-m5b.md` |
| M5c | §9 Khám phá | `2026-11-19-kim-bun-ux-mobile-m5c.md` |
| M3a, M3b | §4 timer trong tab, §5.4 sheet "+" | đã chạy thử, chưa viết plan |
| M4 | §6 Triệu chứng | chưa viết |
| Kết | §11.3 bước 36 của checklist thiết bị | làm sau cùng |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Thứ tự mốc.** Spec §12 xếp M5 sau M3 và M4. Ngày 2026-11-21 người dùng yêu cầu đổi trang Tiêm chủng sang dạng bảng, nên M5 được làm trước; nó không đụng file nào của M3 hay M4.
2. **Commit đầu của nhánh** mang theo phần chỉnh §7.2 và §7.3 của spec ngày 2026-11-21 (luật nhãn hàng khi các mũi khác tên, `DoseSheet` không lặp ngày hẹn).
3. **Vị trí thẻ:** giữa `PageHeader` và hàng "Nguồn lịch tiêm". Thẻ là component riêng `NextDoseCard`, không có hook.
4. **Nhãn thẻ khi không quá hạn** dùng `text-muted`, có `tracking-[0.04em]` như các nhãn viết hoa 13/18 khác của app. Ba dòng trong thẻ cách nhau 2 px.
5. **Số ngày `n`** tính từ đúng chuỗi `today` mà màn hình đưa vào `buildSchedule`, qua `vnDayStartMs`. Trạng thái không phải `overdue` hay `upcoming` thì nhãn là "Mũi tiếp theo".
6. **Bỏ đuôi tên mũi** bằng biểu thức `/ (?:mũi|lần) \d+.*$/`: bỏ cả phần đứng sau số mũi.
7. **Nhóm không có tên trong `groups`** thì nhãn hàng chưa chọn loại là mã nhóm. Mũi `unchosen` không có `group` bị bỏ qua (dữ liệu hiện tại không sinh ra trường hợp này).
8. **`doseCell().date`** là ngày thô `YYYY-MM-DD`; component định dạng bằng `formatDayFull`.
9. **Test màn hình** mock `@/lib/content/vaccines` bằng 4 mũi mẫu và giả `Date` ở 2026-11-20 12:00 giờ Việt Nam. `vaccineGrid.test.ts` ghim số hàng, số cột và nhãn hàng trên nội dung thật cho ba bộ lựa chọn.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code, số test đỏ và xanh của từng task đúng như ghi; tổng cả bộ đã được đo lại trên `main` @ `34f18f6`.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status).
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.
- **Lên `main` một lần.** M5a nằm trên nhánh cho tới khi M5b xong; `main` nhận cả hai ở cuối M5b.

## Contracts with Other Plans

Plan này đứng sau M6 (đã ở trên `main` @ `34f18f6`) và ngay trước M5b.

**Consumes (từ `main` @ `34f18f6`):**

- `lib/rules/vaccines.ts`: `ScheduleItem` (`dose`, `due`, `state`, `record`, `unchosen`, `pastMaxAge`), `buildSchedule`, `DoseState`.
- `lib/rules/vaccineForm.ts`: `formatDueDate`. `lib/rules/days.ts`: `vnDayStartMs`.
- `lib/content/vaccineSchema.ts`: `VaccineGroup`, `VaccineDose`.
- `components/vaccines/VaccineScreen.tsx`, `DoseSheet`.

**Produces** (M5b và M5c được dựa vào đúng những tên này):

- `lib/rules/vaccines.ts`: `nextDose(items)`, `nextDoseLabel(item, today)`.
- `lib/rules/vaccineGrid.ts`: `GridRow`, `DoseTone`, `vaccineGrid(items, groups)`, `doseCell(item)`.
- `lib/rules/days.ts`: `formatDayFull(day)`.
- `components/vaccines/NextDoseCard.tsx`: `NextDoseCard`.
- **Vitest sau M5a:** 1051 test, 156 file.

---

### Task 1: Luật: `nextDose` và nhãn của thẻ "cần làm trước" (§7.1)

**Files:**

- Modify: `lib/rules/vaccines.ts`
- Test: `lib/rules/vaccines.test.ts` (sửa)

**Interfaces:**

- Consumes: `ScheduleItem`, `buildSchedule` (`lib/rules/vaccines.ts`); `vnDayStartMs` (`lib/rules/days.ts`).
- Produces: `nextDose(items: ScheduleItem[]): ScheduleItem | null` (bỏ qua `unchosen`, `pastMaxAge`, `done`, `skipped`); `nextDoseLabel(item: ScheduleItem, today: string): { text: string; overdue: boolean }`, với `today` là ngày Việt Nam dạng `YYYY-MM-DD`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m5a main
git add docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5a.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5b.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5c.md
git commit -m "docs(plan): the three M5 plans, vaccine table details in the spec" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/vaccines.test.ts b/lib/rules/vaccines.test.ts
index 91f8d68..f09aa30 100644
--- a/lib/rules/vaccines.test.ts
+++ b/lib/rules/vaccines.test.ts
@@ -4,9 +4,13 @@ import {
   ageDate,
   buildSchedule,
   dueDates,
+  nextDose,
+  nextDoseLabel,
   NOT_TAKING,
   visibleDoses,
   type DoseRecord,
+  type DoseState,
+  type ScheduleItem,
 } from "./vaccines";
 
 const base = {
@@ -180,3 +184,102 @@ describe("buildSchedule", () => {
     expect(schedule("2026-07-25")).toEqual([["2026-07-01", "overdue", true]]);
   });
 });
+
+const item = (
+  code: string,
+  state: DoseState,
+  due: string,
+  extra: Partial<ScheduleItem> = {},
+): ScheduleItem => ({
+  dose: dose(code, 1, 0),
+  due,
+  state,
+  record: null,
+  unchosen: false,
+  pastMaxAge: false,
+  ...extra,
+});
+
+// Spec 2026-11-19 §7.
+describe("nextDose", () => {
+  it("skips doses that are done, skipped, of an unchosen group or past the age limit", () => {
+    const items = [
+      item("given", "done", "2026-09-14"),
+      item("left", "skipped", "2026-09-24"),
+      item("combo", "overdue", "2026-10-14", { unchosen: true }),
+      item("rota", "overdue", "2026-10-20", { pastMaxAge: true }),
+      item("pcv", "overdue", "2026-11-14"),
+      item("mmr", "upcoming", "2026-12-01"),
+    ];
+    expect(nextDose(items)).toBe(items[4]);
+  });
+
+  it("takes the first item in list order: overdue, else upcoming, else later", () => {
+    const upcoming = item("mmr", "upcoming", "2026-12-01");
+    const later = item("je", "later", "2027-09-14");
+    expect(nextDose([upcoming, later])).toBe(upcoming);
+    expect(nextDose([item("given", "done", "2026-09-14"), later])).toBe(later);
+  });
+
+  it("returns null for an empty list and when no dose qualifies", () => {
+    expect(nextDose([])).toBeNull();
+    expect(
+      nextDose([
+        item("given", "done", "2026-09-14"),
+        item("left", "skipped", "2026-09-24"),
+        item("combo", "upcoming", "2026-12-01", { unchosen: true }),
+        item("rota", "overdue", "2026-10-20", { pastMaxAge: true }),
+      ]),
+    ).toBeNull();
+  });
+
+  it("reads a real schedule: the unchosen group and the given dose are passed over", () => {
+    const items = buildSchedule({
+      doses: [...doses, dose("pcv", 1, 60)],
+      choices: {},
+      dob: "2026-09-14",
+      records: [record("bcg", 1, { given_on: "2026-09-14" })],
+      today: "2026-11-20",
+    });
+    expect(nextDose(items)?.dose.code).toBe("pcv");
+  });
+});
+
+describe("nextDoseLabel", () => {
+  const today = "2026-11-20";
+
+  it("overdue: the calendar days since the due date, flagged as overdue", () => {
+    expect(nextDoseLabel(item("pcv", "overdue", "2026-11-19"), today)).toEqual({
+      text: "Quá hạn 1 ngày",
+      overdue: true,
+    });
+    expect(nextDoseLabel(item("pcv", "overdue", "2026-10-31"), today)).toEqual({
+      text: "Quá hạn 20 ngày",
+      overdue: true,
+    });
+    // Across a year end.
+    expect(
+      nextDoseLabel(item("pcv", "overdue", "2026-12-30"), "2027-01-02"),
+    ).toEqual({ text: "Quá hạn 3 ngày", overdue: true });
+  });
+
+  it("upcoming: the days left, or hôm nay when it is due today", () => {
+    expect(nextDoseLabel(item("pcv", "upcoming", "2026-12-20"), today)).toEqual(
+      { text: "Sắp tới · còn 30 ngày", overdue: false },
+    );
+    expect(nextDoseLabel(item("pcv", "upcoming", "2026-11-21"), today)).toEqual(
+      { text: "Sắp tới · còn 1 ngày", overdue: false },
+    );
+    expect(nextDoseLabel(item("pcv", "upcoming", today), today)).toEqual({
+      text: "Sắp tới · hôm nay",
+      overdue: false,
+    });
+  });
+
+  it("later: no day count", () => {
+    expect(nextDoseLabel(item("je", "later", "2027-09-14"), today)).toEqual({
+      text: "Mũi tiếp theo",
+      overdue: false,
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/vaccines.test.ts`
Expected: FAIL, `Tests  7 failed | 10 passed (17)`. Lý do đỏ: `nextDose is not a function`, `nextDoseLabel is not a function`.

- [x] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/lib/rules/vaccines.ts b/lib/rules/vaccines.ts
index bb24206..a19211a 100644
--- a/lib/rules/vaccines.ts
+++ b/lib/rules/vaccines.ts
@@ -1,5 +1,5 @@
 import type { VaccineDose } from "@/lib/content/vaccineSchema";
-import { addDays, addMonths } from "./days";
+import { addDays, addMonths, vnDayStartMs } from "./days";
 
 // vaccine_choices[group] = series code, or NOT_TAKING when the family skips that group.
 export const NOT_TAKING = "none";
@@ -149,3 +149,40 @@ export function buildSchedule(input: {
         a.dose.doseNo - b.dose.doseNo,
     );
 }
+
+// Spec 2026-11-19 §7: the dose to deal with first. `items` comes sorted by due
+// date, so this is the first open dose of a chosen series. A dose past the
+// product's age limit is passed over, as in pushSelection.ts.
+export function nextDose(items: ScheduleItem[]): ScheduleItem | null {
+  return (
+    items.find(
+      (item) =>
+        !item.unchosen &&
+        !item.pastMaxAge &&
+        (item.state === "overdue" ||
+          item.state === "upcoming" ||
+          item.state === "later"),
+    ) ?? null
+  );
+}
+
+const DAY_MS = 86_400_000;
+
+// Spec 2026-11-19 §7: the label of the "cần làm trước" card. The count is the
+// calendar days between `due` and `today`, both Vietnam days.
+export function nextDoseLabel(
+  item: ScheduleItem,
+  today: string,
+): { text: string; overdue: boolean } {
+  const days = Math.round(
+    Math.abs(vnDayStartMs(item.due) - vnDayStartMs(today)) / DAY_MS,
+  );
+  if (item.state === "overdue")
+    return { text: `Quá hạn ${days} ngày`, overdue: true };
+  if (item.state === "upcoming")
+    return {
+      text: days === 0 ? "Sắp tới · hôm nay" : `Sắp tới · còn ${days} ngày`,
+      overdue: false,
+    };
+  return { text: "Mũi tiếp theo", overdue: false };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/vaccines.test.ts && bun run typecheck`
Expected: `Tests  17 passed (17)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add -- lib/rules/vaccines.ts lib/rules/vaccines.test.ts
git commit -m "feat(vaccines): pick the dose to deal with first" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Thẻ "cần làm trước" ở đầu trang Tiêm chủng (§7.1)

**Files:**

- Create: `components/vaccines/NextDoseCard.tsx`
- Modify: `components/vaccines/VaccineScreen.tsx`
- Test: `components/vaccines/nextdose.test.tsx` (mới)
- Test: `components/vaccines/vaccinescreen.test.tsx` (mới)

**Interfaces:**

- Consumes: `nextDose`, `nextDoseLabel` (Task 1); `formatDueDate` (`lib/rules/vaccineForm.ts`); `DoseSheet` qua state `open` có sẵn của `VaccineScreen`.
- Produces: `NextDoseCard({ item, today, onOpen }: { item: ScheduleItem; today: string; onOpen: (item: ScheduleItem) => void })` trong `components/vaccines/NextDoseCard.tsx`; `VaccineScreen` vẽ thẻ ngay dưới `PageHeader` khi `needsSetup` sai và `nextDose` khác `null`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/vaccines/nextdose.test.tsx b/components/vaccines/nextdose.test.tsx
new file mode 100644
index 0000000..b502acb
--- /dev/null
+++ b/components/vaccines/nextdose.test.tsx
@@ -0,0 +1,72 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import type { ScheduleItem } from "@/lib/rules/vaccines";
+import { NextDoseCard } from "./NextDoseCard";
+
+const TODAY = "2026-11-20";
+const item = (state: string, due: string, program = "dich_vu") =>
+  ({
+    dose: {
+      code: "pcv",
+      doseNo: 1,
+      name: "Phế cầu mũi 1",
+      protects: ["Phế cầu"],
+      program,
+    },
+    due,
+    state,
+    record: null,
+    unchosen: false,
+    pastMaxAge: false,
+  }) as unknown as ScheduleItem;
+
+const render = (dose: ScheduleItem) =>
+  renderToStaticMarkup(
+    <NextDoseCard item={dose} today={TODAY} onOpen={() => {}} />,
+  );
+
+// Spec 2026-11-19 §7.
+describe("NextDoseCard", () => {
+  it("overdue: a glass button, 28 px corners, 16 px padding, warn label and border", () => {
+    const html = render(item("overdue", "2026-11-14"));
+    expect(html).toMatch(
+      /^<button type="button" class="glass [^"]*\brounded-\[28px\] p-4\b[^"]*\bborder-warn!">/,
+    );
+    expect(html).toMatch(
+      /<span class="text-\[13px\] leading-\[18px\] font-semibold [^"]*\buppercase text-warn">Quá hạn 6 ngày<\/span>/,
+    );
+    expect(html).toContain(
+      '<span class="text-xl leading-[26px] font-bold text-ink">Phế cầu mũi 1</span>',
+    );
+    expect(html).toContain(
+      '<span class="text-[13px] leading-[18px] text-muted">Hẹn Thứ Bảy, 14/11/2026 · Dịch vụ</span>',
+    );
+    expect(html.endsWith("</button>")).toBe(true);
+  });
+
+  it("upcoming: the days left, no warn colour or border", () => {
+    const html = render(item("upcoming", "2026-12-10", "tcmr"));
+    expect(html).toMatch(/\buppercase text-muted">Sắp tới · còn 20 ngày</);
+    expect(html).toContain(">Hẹn Thứ Năm, 10/12/2026 · Tiêm chủng mở rộng<");
+    expect(html).not.toContain("text-warn");
+    expect(html).not.toContain("border-warn!");
+  });
+
+  it("upcoming and due today: hôm nay instead of a count", () => {
+    expect(render(item("upcoming", TODAY))).toContain(">Sắp tới · hôm nay<");
+  });
+
+  it("later: Mũi tiếp theo", () => {
+    const html = render(item("later", "2027-06-14"));
+    expect(html).toMatch(/\buppercase text-muted">Mũi tiếp theo</);
+    expect(html).not.toContain("border-warn!");
+  });
+
+  it("opens its dose when tapped", () => {
+    const onOpen = vi.fn();
+    const dose = item("overdue", "2026-11-14");
+    const tree = NextDoseCard({ item: dose, today: TODAY, onOpen });
+    (tree.props.onClick as () => void)();
+    expect(onOpen).toHaveBeenCalledExactlyOnceWith(dose);
+  });
+});
diff --git a/components/vaccines/vaccinescreen.test.tsx b/components/vaccines/vaccinescreen.test.tsx
new file mode 100644
index 0000000..e217c6b
--- /dev/null
+++ b/components/vaccines/vaccinescreen.test.tsx
@@ -0,0 +1,198 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
+import type { Baby, VaccineDoseRow } from "@/lib/supabase/rows";
+import { VaccineScreen } from "./VaccineScreen";
+
+const state = vi.hoisted(() => ({ doses: {} as Record<string, unknown> }));
+// Four doses: one at birth, two at two months (one of them in a group), one late.
+const content = vi.hoisted(() => {
+  const base = {
+    protects: ["X"],
+    source: "https://example.org",
+    reviewedAt: "2026-11-14",
+  };
+  return {
+    title: "Lịch tiêm",
+    disclaimer: "Lịch tham khảo.",
+    reviewedAt: "2026-11-14",
+    groups: [
+      {
+        code: "dtp_combo",
+        name: "Bạch hầu, ho gà, uốn ván",
+        series: [
+          { code: "6in1", name: "6 trong 1", program: "dich_vu" },
+          { code: "tcmr_5in1", name: "5 trong 1", program: "tcmr" },
+        ],
+      },
+    ],
+    doses: [
+      {
+        ...base,
+        code: "bcg",
+        doseNo: 1,
+        name: "Lao (BCG)",
+        program: "tcmr",
+        recommendedAgeDays: 0,
+        minAgeDays: 0,
+      },
+      {
+        ...base,
+        code: "hexa",
+        doseNo: 1,
+        name: "6 trong 1 mũi 1",
+        program: "dich_vu",
+        group: "dtp_combo",
+        series: "6in1",
+        recommendedAgeDays: 60,
+        minAgeDays: 42,
+      },
+      {
+        ...base,
+        code: "pcv",
+        doseNo: 1,
+        name: "Phế cầu mũi 1",
+        program: "dich_vu",
+        recommendedAgeDays: 60,
+        minAgeDays: 42,
+      },
+      {
+        ...base,
+        code: "mmr",
+        doseNo: 1,
+        name: "Sởi mũi 1",
+        program: "tcmr",
+        recommendedAgeDays: 270,
+        minAgeDays: 270,
+      },
+    ],
+  };
+});
+
+vi.mock("@/lib/content/vaccines", () => ({ VACCINES: content }));
+vi.mock("@/lib/data/vaccines", () => {
+  const idle = {
+    isPending: false,
+    isError: false,
+    error: null,
+    mutate: () => {},
+  };
+  return {
+    useVaccineDoses: () => state.doses,
+    useUpdateChoices: () => idle,
+    useVaccineSetup: () => idle,
+    useDoseActions: () => ({ save: idle, clear: idle }),
+  };
+});
+vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
+
+const CHOSEN = { dtp_combo: "6in1" };
+const CARD = /<button type="button" class="glass [^"]*rounded-\[28px\]/;
+
+const done = (code: string): VaccineDoseRow =>
+  ({
+    id: `row-${code}`,
+    baby_id: "b1",
+    vaccine_code: code,
+    dose_no: 1,
+    status: "done",
+    given_on: "2026-11-15",
+    due_on_override: null,
+    place: null,
+    note: null,
+    created_by: "u1",
+    created_at: "2026-11-15T00:00:00.000Z",
+    updated_at: "2026-11-15T00:00:00.000Z",
+  }) as VaccineDoseRow;
+
+function render(
+  rows: VaccineDoseRow[] | undefined,
+  choices: Record<string, string> = CHOSEN,
+  isOwner = true,
+) {
+  state.doses = {
+    data: rows,
+    isPending: rows === undefined,
+    isError: false,
+    error: null,
+    fetchStatus: rows === undefined ? "fetching" : "idle",
+    refetch: () => {},
+  };
+  const baby = {
+    id: "b1",
+    family_id: "f1",
+    name: "Bun",
+    dob: "2026-09-14",
+    vaccine_choices: choices,
+  } as Baby;
+  return renderToStaticMarkup(
+    <VaccineScreen baby={baby} userId="u1" isOwner={isOwner} />,
+  );
+}
+
+beforeAll(() => {
+  vi.useFakeTimers({ toFake: ["Date"] });
+  vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
+});
+afterAll(() => vi.useRealTimers());
+
+// Spec 2026-11-19 §7.
+describe("VaccineScreen: the cần làm trước card", () => {
+  it("sits right under the page header, above the source row, for the first open dose", () => {
+    const html = render([]);
+    expect(html).toMatch(CARD);
+    expect(html.match(/border-warn!/g)).toHaveLength(1);
+    expect(html).toContain(">Quá hạn 67 ngày</span>");
+    expect(html).toContain(
+      ">Hẹn Thứ Hai, 14/09/2026 · Tiêm chủng mở rộng</span>",
+    );
+    const header = html.indexOf("</header>");
+    const card = html.search(CARD);
+    expect(card).toBeGreaterThan(header);
+    expect(html.slice(header, card)).toBe("</header>");
+    expect(html.indexOf("Nguồn lịch tiêm")).toBeGreaterThan(card);
+    expect(html.slice(card, html.indexOf("Nguồn lịch tiêm"))).toContain(
+      ">Lao (BCG)</span>",
+    );
+  });
+
+  it("moves on once a dose is marked: the next one by due date and code", () => {
+    const html = render([done("bcg")]);
+    const card = html.slice(html.search(CARD), html.indexOf("Nguồn lịch tiêm"));
+    expect(card).toContain(">Quá hạn 6 ngày</span>");
+    expect(card).toContain(">6 trong 1 mũi 1</span>");
+    expect(card).toContain(">Hẹn Thứ Bảy, 14/11/2026 · Dịch vụ</span>");
+  });
+
+  it("passes over the doses of a group with no series chosen", () => {
+    const html = render([done("bcg")], {}, false);
+    const card = html.slice(html.search(CARD), html.indexOf("Nguồn lịch tiêm"));
+    expect(card).toContain(">Phế cầu mũi 1</span>");
+  });
+
+  it("a dose that is not overdue: no warn border", () => {
+    const html = render([done("bcg"), done("hexa"), done("pcv")]);
+    const card = html.slice(html.search(CARD), html.indexOf("Nguồn lịch tiêm"));
+    expect(card).toContain(">Mũi tiếp theo</span>");
+    expect(card).toContain(">Sởi mũi 1</span>");
+    expect(html).not.toContain("border-warn!");
+  });
+
+  it("is hidden during setup", () => {
+    const html = render([], {});
+    expect(html).toContain(">Thiết lập lịch tiêm</h2>");
+    expect(html).not.toMatch(CARD);
+    expect(html).not.toContain("Quá hạn 67 ngày");
+  });
+
+  it("is hidden when no dose is left to do", () => {
+    const html = render(["bcg", "hexa", "pcv", "mmr"].map(done));
+    expect(html).toContain(">Đã tiêm (4)</h2>");
+    expect(html).not.toMatch(CARD);
+  });
+
+  it("is hidden while the doses load", () => {
+    const html = render(undefined);
+    expect(html).toContain("kb-pulse");
+    expect(html).not.toMatch(CARD);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/vaccines/nextdose.test.tsx components/vaccines/vaccinescreen.test.tsx`
Expected: FAIL, `Test Files  2 failed (2)`, `Tests  4 failed | 3 passed (7)`. File `nextdose.test.tsx` không nạp được (`Cannot find module './NextDoseCard'`) nên 5 test của nó chưa được đếm.

- [x] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/vaccines/NextDoseCard.tsx b/components/vaccines/NextDoseCard.tsx
new file mode 100644
index 0000000..bf406f2
--- /dev/null
+++ b/components/vaccines/NextDoseCard.tsx
@@ -0,0 +1,40 @@
+import { formatDueDate } from "@/lib/rules/vaccineForm";
+import { nextDoseLabel, type ScheduleItem } from "@/lib/rules/vaccines";
+import { cx } from "@/lib/ui/cx";
+
+const LABEL =
+  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] uppercase";
+
+// Spec 2026-11-19 §7: the "cần làm trước" card. `today` is a Vietnam day.
+export function NextDoseCard({
+  item,
+  today,
+  onOpen,
+}: {
+  item: ScheduleItem;
+  today: string;
+  onOpen: (item: ScheduleItem) => void;
+}) {
+  const label = nextDoseLabel(item, today);
+  return (
+    <button
+      type="button"
+      onClick={() => onOpen(item)}
+      className={cx(
+        "glass flex w-full flex-col items-start gap-0.5 rounded-[28px] p-4 text-left",
+        label.overdue && "border-warn!",
+      )}
+    >
+      <span className={cx(LABEL, label.overdue ? "text-warn" : "text-muted")}>
+        {label.text}
+      </span>
+      <span className="text-xl leading-[26px] font-bold text-ink">
+        {item.dose.name}
+      </span>
+      <span className="text-[13px] leading-[18px] text-muted">
+        Hẹn {formatDueDate(item.due)} ·{" "}
+        {item.dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
+      </span>
+    </button>
+  );
+}
diff --git a/components/vaccines/VaccineScreen.tsx b/components/vaccines/VaccineScreen.tsx
index 50a23cd..38a6046 100644
--- a/components/vaccines/VaccineScreen.tsx
+++ b/components/vaccines/VaccineScreen.tsx
@@ -18,11 +18,16 @@ import {
   parseChoices,
   toDoseRecords,
 } from "@/lib/rules/vaccineForm";
-import { buildSchedule, type ScheduleItem } from "@/lib/rules/vaccines";
+import {
+  buildSchedule,
+  nextDose,
+  type ScheduleItem,
+} from "@/lib/rules/vaccines";
 import type { Baby } from "@/lib/supabase/rows";
 import { ChoiceFields } from "./ChoiceFields";
 import { DoseSections } from "./DoseSections";
 import { DoseSheet } from "./DoseSheet";
+import { NextDoseCard } from "./NextDoseCard";
 import { VaccineSetup } from "./VaccineSetup";
 import { VaccineSourceRow } from "./VaccineSourceRow";
 
@@ -76,18 +81,21 @@ export function VaccineScreen({
 
   const rows = doses.data;
   const records = toDoseRecords(rows);
+  const today = vnDateString(new Date());
   const items = buildSchedule({
     doses: VACCINES.doses,
     choices,
     dob: baby.dob,
     records,
-    today: vnDateString(new Date()),
+    today,
   });
   const unchosen = VACCINES.groups.filter(
     (group) => cleanChoices([group], choices)[group.code] === undefined,
   ).length;
   const needsSetup =
     isOwner && Object.keys(choices).length === 0 && !setupLater;
+  // Spec 2026-11-19 §7: nothing to do first while the setup step is showing.
+  const next = needsSetup ? null : nextDose(items);
   const rowFor = (item: ScheduleItem) =>
     rows.find(
       (row) =>
@@ -97,6 +105,7 @@ export function VaccineScreen({
   return (
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       {header}
+      {next && <NextDoseCard item={next} today={today} onOpen={setOpen} />}
       <VaccineSourceRow text={VACCINES.disclaimer} />
       {needsSetup ? (
         <section className="flex flex-col gap-3">
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/vaccines/nextdose.test.tsx components/vaccines/vaccinescreen.test.tsx && bun run typecheck`
Expected: `Tests  12 passed (12)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add -- components/vaccines/NextDoseCard.tsx components/vaccines/VaccineScreen.tsx components/vaccines/nextdose.test.tsx components/vaccines/vaccinescreen.test.tsx
git commit -m "feat(vaccines): a do-this-first card at the top of the page" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Luật của bảng: `vaccineGrid`, `doseCell`, `formatDayFull` (§7.2)

**Files:**

- Modify: `lib/rules/days.ts`
- Create: `lib/rules/vaccineGrid.ts`
- Test: `lib/rules/days.test.ts` (sửa)
- Test: `lib/rules/vaccineGrid.test.ts` (mới)

**Interfaces:**

- Consumes: `ScheduleItem` (`lib/rules/vaccines.ts`); `VaccineGroup` (`lib/content/vaccineSchema.ts`).
- Produces: `formatDayFull(day: string): string` trong `lib/rules/days.ts` ("2026-10-29" thành "29/10/2026"). Trong file mới `lib/rules/vaccineGrid.ts`: kiểu `GridRow` (hàng vắc xin có `cells: (ScheduleItem | null)[]`, hoặc hàng chưa chọn loại), `DoseTone = "done" | "skipped" | "late" | "soon" | "open"`, `vaccineGrid(items: ScheduleItem[], groups: VaccineGroup[]): { columns: number; rows: GridRow[] }`, `doseCell(item: ScheduleItem): { label: string; date: string | null; tone: DoseTone }` với `date` là ngày thô `YYYY-MM-DD`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/lib/rules/days.test.ts b/lib/rules/days.test.ts
index 64448b5..c84d2ed 100644
--- a/lib/rules/days.test.ts
+++ b/lib/rules/days.test.ts
@@ -2,6 +2,7 @@ import { describe, expect, it } from "vitest";
 import {
   addDays,
   addMonths,
+  formatDayFull,
   formatDayShort,
   vnDayLabel,
   vnDayRange,
@@ -40,6 +41,12 @@ describe("days", () => {
     expect(formatDayShort("2026-01-05")).toBe("05/01");
   });
 
+  // Spec 2026-11-19 §7.2: the dates in the vaccine table.
+  it("formatDayFull gives dd/MM/yyyy", () => {
+    expect(formatDayFull("2026-10-29")).toBe("29/10/2026");
+    expect(formatDayFull("2027-01-05")).toBe("05/01/2027");
+  });
+
   it("vnDayLabel names today, yesterday and older days", () => {
     const now = new Date("2026-11-14T03:00:00Z"); // 10:00 Saturday 14/11 in VN
     expect(vnDayLabel("2026-11-14", now)).toBe("Hôm nay");
diff --git a/lib/rules/vaccineGrid.test.ts b/lib/rules/vaccineGrid.test.ts
new file mode 100644
index 0000000..c670bc7
--- /dev/null
+++ b/lib/rules/vaccineGrid.test.ts
@@ -0,0 +1,319 @@
+import { describe, expect, it } from "vitest";
+import type { VaccineDose, VaccineGroup } from "@/lib/content/vaccineSchema";
+import { VACCINES } from "@/lib/content/vaccines";
+import { doseCell, vaccineGrid } from "./vaccineGrid";
+import { buildSchedule, type DoseState, type ScheduleItem } from "./vaccines";
+
+const item = (
+  code: string,
+  doseNo: number,
+  name: string,
+  over: Partial<Omit<ScheduleItem, "dose">> & {
+    dose?: Partial<VaccineDose>;
+  } = {},
+): ScheduleItem => {
+  const { dose, ...rest } = over;
+  return {
+    dose: {
+      code,
+      doseNo,
+      name,
+      protects: ["X"],
+      program: "tcmr",
+      recommendedAgeDays: 0,
+      minAgeDays: 0,
+      source: "https://example.org",
+      reviewedAt: "2026-11-14",
+      ...dose,
+    },
+    due: "2026-11-20",
+    state: "later",
+    record: null,
+    unchosen: false,
+    pastMaxAge: false,
+    ...rest,
+  };
+};
+
+const groups: VaccineGroup[] = [
+  {
+    code: "dtp_combo",
+    name: "Bạch hầu, ho gà, uốn ván",
+    series: [
+      { code: "6in1", name: "6 trong 1 (Hexaxim)", program: "dich_vu" },
+      { code: "tcmr_5in1", name: "5 trong 1", program: "tcmr" },
+    ],
+  },
+  {
+    code: "measles_tcmr",
+    name: "Sởi (Tiêm chủng mở rộng)",
+    series: [
+      {
+        code: "tcmr_measles",
+        name: "Sởi 9 tháng, Sởi – Rubella 18 tháng",
+        program: "tcmr",
+      },
+    ],
+  },
+  {
+    code: "rota",
+    name: "Tiêu chảy do Rota",
+    series: [
+      { code: "rotarix", name: "Rotarix", program: "dich_vu" },
+      { code: "rotateq", name: "RotaTeq", program: "dich_vu" },
+    ],
+  },
+];
+
+const six = { group: "dtp_combo", series: "6in1" };
+const measles = { group: "measles_tcmr", series: "tcmr_measles" };
+const rota = { group: "rota" };
+
+// Spec 2026-11-19 §7.2.
+describe("vaccineGrid", () => {
+  it("one row per vaccine code, in order of first appearance, doses in their columns", () => {
+    const items = [
+      item("bcg", 1, "Vắc xin lao (BCG)"),
+      item("hexa", 1, "6 trong 1 mũi 1", { dose: six }),
+      item("opv", 1, "Uống bại liệt (OPV) lần 1"),
+      item("hexa", 2, "6 trong 1 mũi 2", { dose: six }),
+      item("opv", 3, "Uống bại liệt (OPV) lần 3"),
+      item("hexa", 4, "6 trong 1 mũi 4 (nhắc)", { dose: six }),
+    ];
+    const grid = vaccineGrid(items, groups);
+    expect(grid.columns).toBe(4);
+    expect(grid.rows.map((row) => [row.kind, row.label])).toEqual([
+      ["vaccine", "Vắc xin lao (BCG)"],
+      ["vaccine", "6 trong 1"],
+      ["vaccine", "Uống bại liệt (OPV)"],
+    ]);
+    const [bcg, hexa, opv] = grid.rows;
+    if (
+      bcg.kind !== "vaccine" ||
+      hexa.kind !== "vaccine" ||
+      opv.kind !== "vaccine"
+    )
+      throw new Error("vaccine rows expected");
+    expect(bcg.cells).toEqual([items[0], null, null, null]);
+    expect(hexa.cells).toEqual([items[1], items[3], null, items[5]]);
+    expect(opv.cells).toEqual([items[2], null, items[4], null]);
+  });
+
+  it("labels come from the lowest dose number, whatever the due order", () => {
+    const items = [
+      item("flu", 2, "Cúm mùa mũi 2", { due: "2026-10-01" }),
+      item("flu", 1, "Cúm mùa mũi 1", { due: "2026-11-01" }),
+    ];
+    expect(vaccineGrid(items, groups).rows[0].label).toBe("Cúm mùa");
+  });
+
+  it("falls back to the series name when the doses of a code disagree", () => {
+    const items = [
+      item("tcmr_measles", 1, "Sởi (9 tháng)", { dose: measles }),
+      item("tcmr_measles", 2, "Sởi – Rubella (MR, 18 tháng)", {
+        dose: measles,
+      }),
+    ];
+    expect(vaccineGrid(items, groups).rows[0].label).toBe(
+      "Sởi 9 tháng, Sởi – Rubella 18 tháng",
+    );
+  });
+
+  it("keeps the stripped name when the series is not found", () => {
+    const items = [item("x", 1, "X mũi 1"), item("x", 2, "Y mũi 2")];
+    expect(vaccineGrid(items, groups).rows[0].label).toBe("X");
+  });
+
+  it("one row per group with open unchosen doses, at the group's first dose, alternatives not listed", () => {
+    const items = [
+      item("bcg", 1, "Vắc xin lao (BCG)"),
+      item("rotarix", 1, "Rotarix (uống) lần 1", {
+        dose: rota,
+        unchosen: true,
+        state: "overdue",
+      }),
+      item("rotateq", 1, "RotaTeq (uống) lần 1", {
+        dose: rota,
+        unchosen: true,
+        state: "overdue",
+      }),
+      item("pcv", 1, "Phế cầu mũi 1"),
+      item("rotateq", 3, "RotaTeq (uống) lần 3", {
+        dose: rota,
+        unchosen: true,
+      }),
+    ];
+    const grid = vaccineGrid(items, groups);
+    expect(grid.rows.map((row) => [row.kind, row.label])).toEqual([
+      ["vaccine", "Vắc xin lao (BCG)"],
+      ["unchosen", "Tiêu chảy do Rota"],
+      ["vaccine", "Phế cầu"],
+    ]);
+    // Unchosen doses do not widen the table.
+    expect(grid.columns).toBe(1);
+  });
+
+  it("no unchosen row when none of the group's doses is still open", () => {
+    const items = [
+      item("rotarix", 1, "Rotarix (uống) lần 1", {
+        dose: rota,
+        unchosen: true,
+        state: "done",
+      }),
+      item("rotarix", 2, "Rotarix (uống) lần 2", {
+        dose: rota,
+        unchosen: true,
+        state: "skipped",
+      }),
+    ];
+    expect(vaccineGrid(items, groups)).toEqual({ columns: 1, rows: [] });
+  });
+
+  it("an open dose keeps its group's row even after done ones", () => {
+    const states: DoseState[] = ["done", "upcoming"];
+    const items = states.map((state, i) =>
+      item("rotarix", i + 1, `Rotarix (uống) lần ${i + 1}`, {
+        dose: rota,
+        unchosen: true,
+        state,
+      }),
+    );
+    expect(vaccineGrid(items, groups).rows).toEqual([
+      { kind: "unchosen", key: "rota", label: "Tiêu chảy do Rota" },
+    ]);
+  });
+
+  it("at least one column", () => {
+    expect(vaccineGrid([], groups)).toEqual({ columns: 1, rows: [] });
+  });
+
+  describe("the real content", () => {
+    const schedule = (choices: Record<string, string>) =>
+      buildSchedule({
+        doses: VACCINES.doses,
+        choices,
+        dob: "2026-09-14",
+        records: [],
+        today: "2026-11-20",
+      });
+
+    it("nothing chosen: the two birth doses and one row per group", () => {
+      const grid = vaccineGrid(schedule({}), VACCINES.groups);
+      expect(grid.columns).toBe(1);
+      expect(grid.rows.map((row) => [row.kind, row.label])).toEqual([
+        ["vaccine", "Vắc xin lao (BCG)"],
+        ["vaccine", "Viêm gan B liều sơ sinh"],
+        ["unchosen", "Não mô cầu nhóm B"],
+        ["unchosen", "Bạch hầu, ho gà, uốn ván, bại liệt, Hib, viêm gan B"],
+        ["unchosen", "Phế cầu"],
+        ["unchosen", "Tiêu chảy do Rota"],
+        ["unchosen", "Cúm mùa"],
+        ["unchosen", "Viêm não Nhật Bản"],
+        ["unchosen", "Sởi – Quai bị – Rubella (dịch vụ)"],
+        ["unchosen", "Sởi, Sởi – Rubella (Tiêm chủng mở rộng)"],
+        ["unchosen", "Thủy đậu"],
+        ["unchosen", "Viêm gan A"],
+      ]);
+    });
+
+    it("6 trong 1, Rotarix and Synflorix chosen", () => {
+      const grid = vaccineGrid(
+        schedule({ dtp_combo: "6in1", rota: "rotarix", pneumo: "synflorix" }),
+        VACCINES.groups,
+      );
+      expect(grid.columns).toBe(4);
+      expect(grid.rows.map((row) => [row.kind, row.label])).toEqual([
+        ["vaccine", "Vắc xin lao (BCG)"],
+        ["vaccine", "Viêm gan B liều sơ sinh"],
+        ["unchosen", "Não mô cầu nhóm B"],
+        ["vaccine", "6 trong 1"],
+        ["vaccine", "Rotarix (uống)"],
+        ["vaccine", "Synflorix"],
+        ["unchosen", "Cúm mùa"],
+        ["unchosen", "Viêm não Nhật Bản"],
+        ["unchosen", "Sởi – Quai bị – Rubella (dịch vụ)"],
+        ["unchosen", "Sởi, Sởi – Rubella (Tiêm chủng mở rộng)"],
+        ["unchosen", "Thủy đậu"],
+        ["unchosen", "Viêm gan A"],
+      ]);
+    });
+
+    it("the 5 trong 1 series: three rows, the DPT row falls back to the series name", () => {
+      const grid = vaccineGrid(
+        schedule({ dtp_combo: "tcmr_5in1" }),
+        VACCINES.groups,
+      );
+      const labels = grid.rows
+        .filter((row) => row.kind === "vaccine")
+        .map((row) => row.label);
+      expect(labels).toEqual([
+        "Vắc xin lao (BCG)",
+        "Viêm gan B liều sơ sinh",
+        "Tiêm chủng mở rộng: 5 trong 1, bại liệt uống và tiêm",
+        "Uống bại liệt (OPV)",
+        "Tiêm bại liệt (IPV)",
+      ]);
+      expect(grid.columns).toBe(4);
+    });
+  });
+});
+
+describe("doseCell", () => {
+  const done = (given_on: string | null) =>
+    item("bcg", 1, "BCG", {
+      state: "done",
+      record: {
+        vaccine_code: "bcg",
+        dose_no: 1,
+        status: "done",
+        given_on,
+        due_on_override: null,
+      },
+    });
+
+  it("done: the day it was given, if known", () => {
+    expect(doseCell(done("2026-10-29"))).toEqual({
+      label: "Đã tiêm",
+      date: "2026-10-29",
+      tone: "done",
+    });
+    expect(doseCell(done(null))).toEqual({
+      label: "Đã tiêm",
+      date: null,
+      tone: "done",
+    });
+  });
+
+  it("skipped: no date", () => {
+    expect(doseCell(item("bcg", 1, "BCG", { state: "skipped" }))).toEqual({
+      label: "Bỏ qua",
+      date: null,
+      tone: "skipped",
+    });
+  });
+
+  it("past the age limit wins over overdue and upcoming", () => {
+    for (const state of ["overdue", "upcoming", "later"] as const)
+      expect(
+        doseCell(item("rotarix", 1, "R", { state, pastMaxAge: true })),
+      ).toEqual({ label: "Quá tuổi", date: "2026-11-20", tone: "late" });
+  });
+
+  it("overdue, upcoming and later: the due date", () => {
+    expect(doseCell(item("a", 1, "A", { state: "overdue" }))).toEqual({
+      label: "Trễ hẹn",
+      date: "2026-11-20",
+      tone: "late",
+    });
+    expect(doseCell(item("a", 1, "A", { state: "upcoming" }))).toEqual({
+      label: "Sắp tới",
+      date: "2026-11-20",
+      tone: "soon",
+    });
+    expect(doseCell(item("a", 1, "A", { state: "later" }))).toEqual({
+      label: "Chưa tiêm",
+      date: "2026-11-20",
+      tone: "open",
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/days.test.ts lib/rules/vaccineGrid.test.ts`
Expected: FAIL, `Test Files  2 failed (2)`, `Tests  1 failed | 6 passed (7)`. `formatDayFull is not a function`; file `vaccineGrid.test.ts` không nạp được `./vaccineGrid` nên test của nó chưa được đếm.

- [x] **Step 3: Sửa code (Patch 6)**

```diff
diff --git a/lib/rules/days.ts b/lib/rules/days.ts
index e23c95d..01c01ff 100644
--- a/lib/rules/days.ts
+++ b/lib/rules/days.ts
@@ -42,6 +42,12 @@ export function formatDayShort(day: string): string {
   return `${date}/${month}`;
 }
 
+// Spec 2026-11-19 §7.2: "2026-10-29" → "29/10/2026".
+export function formatDayFull(day: string): string {
+  const [year, month, date] = day.split("-");
+  return `${date}/${month}/${year}`;
+}
+
 export function vnDayLabel(day: string, now: Date): string {
   const today = vnDateString(now);
   if (day === today) return "Hôm nay";
diff --git a/lib/rules/vaccineGrid.ts b/lib/rules/vaccineGrid.ts
new file mode 100644
index 0000000..8a5d11e
--- /dev/null
+++ b/lib/rules/vaccineGrid.ts
@@ -0,0 +1,107 @@
+import type { VaccineGroup } from "@/lib/content/vaccineSchema";
+import type { ScheduleItem } from "./vaccines";
+
+export type GridRow =
+  | {
+      kind: "vaccine";
+      key: string;
+      label: string;
+      // cells[doseNo - 1] is that dose; null where the vaccine has no such dose.
+      cells: (ScheduleItem | null)[];
+    }
+  | { kind: "unchosen"; key: string; label: string };
+
+export type DoseTone = "done" | "skipped" | "late" | "soon" | "open";
+
+// " mũi 1", " lần 2", and whatever follows it (" mũi 4 (nhắc)").
+const DOSE_SUFFIX = / (?:mũi|lần) \d+.*$/;
+
+const isOpen = (item: ScheduleItem) =>
+  item.state === "overdue" ||
+  item.state === "upcoming" ||
+  item.state === "later";
+
+function vaccineLabel(doses: ScheduleItem[], groups: VaccineGroup[]): string {
+  const sorted = [...doses].sort((a, b) => a.dose.doseNo - b.dose.doseNo);
+  const names = sorted.map((item) => item.dose.name.replace(DOSE_SUFFIX, ""));
+  if (names.every((name) => name === names[0])) return names[0];
+  const { group, series } = sorted[0].dose;
+  const named = groups
+    .find((g) => g.code === group)
+    ?.series.find((s) => s.code === series);
+  return named?.name ?? names[0];
+}
+
+// Spec 2026-11-19 §7.2: rows are vaccines (or one row per group with no series
+// chosen yet), columns are dose numbers. `items` comes sorted by due date.
+export function vaccineGrid(
+  items: ScheduleItem[],
+  groups: VaccineGroup[],
+): { columns: number; rows: GridRow[] } {
+  const byCode = new Map<string, ScheduleItem[]>();
+  const openGroups = new Set(
+    items
+      .filter((item) => item.unchosen && isOpen(item) && item.dose.group)
+      .map((item) => item.dose.group as string),
+  );
+  const order: { kind: "vaccine" | "unchosen"; key: string }[] = [];
+  const placed = new Set<string>();
+  for (const item of items) {
+    const { code, group } = item.dose;
+    if (!item.unchosen) {
+      const doses = byCode.get(code);
+      if (doses) doses.push(item);
+      else {
+        byCode.set(code, [item]);
+        order.push({ kind: "vaccine", key: code });
+      }
+    } else if (group && openGroups.has(group) && !placed.has(group)) {
+      placed.add(group);
+      order.push({ kind: "unchosen", key: group });
+    }
+  }
+  const columns = Math.max(
+    1,
+    ...items.filter((item) => !item.unchosen).map((item) => item.dose.doseNo),
+  );
+  const rows = order.map(({ kind, key }): GridRow => {
+    if (kind === "unchosen")
+      return {
+        kind,
+        key,
+        label: groups.find((group) => group.code === key)?.name ?? key,
+      };
+    const doses = byCode.get(key) as ScheduleItem[];
+    const cells: (ScheduleItem | null)[] = Array.from(
+      { length: columns },
+      () => null,
+    );
+    for (const item of doses) cells[item.dose.doseNo - 1] = item;
+    return { kind, key, label: vaccineLabel(doses, groups), cells };
+  });
+  return { columns, rows };
+}
+
+// Spec 2026-11-19 §7.2: what one cell of the table says, checked in this order.
+// `date` is a plain YYYY-MM-DD day.
+export function doseCell(item: ScheduleItem): {
+  label: string;
+  date: string | null;
+  tone: DoseTone;
+} {
+  if (item.state === "done")
+    return {
+      label: "Đã tiêm",
+      date: item.record?.given_on ?? null,
+      tone: "done",
+    };
+  if (item.state === "skipped")
+    return { label: "Bỏ qua", date: null, tone: "skipped" };
+  if (item.pastMaxAge)
+    return { label: "Quá tuổi", date: item.due, tone: "late" };
+  if (item.state === "overdue")
+    return { label: "Trễ hẹn", date: item.due, tone: "late" };
+  if (item.state === "upcoming")
+    return { label: "Sắp tới", date: item.due, tone: "soon" };
+  return { label: "Chưa tiêm", date: item.due, tone: "open" };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/days.test.ts lib/rules/vaccineGrid.test.ts && bun run typecheck`
Expected: `Tests  22 passed (22)`; `tsc --noEmit` không báo lỗi.

Ở task này nhãn hàng còn dùng tên `series` mỗi khi các mũi cho ra nhãn khác nhau. Task 3 của M5b thu hẹp luật đó theo đúng §7.2.

- [x] **Step 5: Commit**

```bash
git add -- lib/rules/days.ts lib/rules/vaccineGrid.ts lib/rules/days.test.ts lib/rules/vaccineGrid.test.ts
git commit -m "feat(vaccines): rules that lay the schedule out as vaccine by dose" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm giữa chừng M5a

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5a.md` (tick các ô)

**Interfaces:**

- Consumes: mọi thứ Task 1–3 tạo ra.
- Produces: nhánh `feat/kim-bun-ux-mobile-m5a` làm nền cho M5b. Nhánh này không lên `main` trước khi M5b xong.

- [x] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  156 passed (156)`, `Tests  1051 passed (1051)`.

- [x] **Step 2: Commit phần tick**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5a.md
git commit -m "docs(plan): tick the M5a steps" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```
