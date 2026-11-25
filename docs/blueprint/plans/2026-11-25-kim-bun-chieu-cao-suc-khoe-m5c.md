# Kim Bun — Sức khỏe M5c: hàng nhắc đo, dòng "Đến kỳ đo" và checklist thiết bị Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§8.3 phần "Hàng nhắc đo trên trang Chiều cao"; mục 8 của §6.3; dòng 4 của §4; §9.3; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng duyệt trước mọi plan còn lại của spec này: "duyệt hết, làm cho tới lúc xong và đẩy lên main, giữa chừng có bug gì thì fix luôn, mở trình duyệt thì dùng browser trong app nếu khi implement có hỏi")

**Goal:** Trang Chiều cao có hàng nhắc đo với công tắc "Nhắc đo định kỳ" của người đang xem; trang Sức khỏe có dòng "Đến kỳ đo" khi tới hạn; checklist thiết bị có Bước 37.

**Architecture:**

- **Luật thuần:** `measureReminder` (`lib/rules/measureSchedule.ts`) cho tên và dòng phụ của hàng nhắc đo; `measureAttention` (`lib/rules/attention.ts`) cho dòng 4 của "Cần chú ý". Cả hai dùng `nextMeasureDue` của M5b, cùng luật với thông báo đẩy lúc 08:00.
- **Giao diện:** `components/height/MeasureReminderRow.tsx` có phần chỉ vẽ (`MeasureReminderRowView`) và phần nối dữ liệu, đọc và ghi tùy chọn `growth_measure` bằng `useNotificationPrefs` / `useSavePrefs` sẵn có, tức cùng dữ liệu với công tắc ở Cài đặt. `HeightScreen` nhận thêm `userId`.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m5c`, cắt từ `main` @ `e6334a2` (đã có M5a và M5b). Baseline: 1618 test vitest xanh (181 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                       | Nội dung                               | Plan                                                           |
| ------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| M1 đến M4a, M4c, M5a, M5b | §3 đến §7.2, §8.1, §8.2, luật của §8.3 | đã xong, ở `main` @ `e6334a2`                                  |
| **M5c (plan này)**        | hàng nhắc đo, dòng 4 của §4, §9.3      | file này                                                       |
| M4b                       | §7.3: dinh dưỡng theo giai đoạn        | chờ người dùng quyết các dòng mà nguồn không nói đúng như spec |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **"Máy chưa bật thông báo thì xử lý như `MedicineScheduleSection`":** phần đó không kiểm máy có bật thông báo hay không; công tắc luôn gạt được và chỉ lưu tùy chọn. Hàng nhắc đo làm đúng như vậy: không thêm câu nhắc bật thông báo, không khóa công tắc vì lý do đó.
2. **Công tắc bị khóa** trong lúc tùy chọn chưa tải xong hoặc đang lưu, như các công tắc ở Cài đặt. Tải tùy chọn lỗi hoặc lưu lỗi thì có một dòng báo lỗi dưới hàng (câu của `toVietnameseError` sẵn có), cũng như ở Cài đặt.
3. **Tên đọc cho trình đọc màn hình của công tắc** là "Nhắc đo định kỳ", trùng tên tùy chọn ở Cài đặt.
4. **Bé quá 1856 ngày tuổi:** không vẽ hàng nhắc đo (không còn kỳ đo nào tới hạn, §8.3).
5. **Hàng nhắc đo chờ các lần đo tải xong** và nằm sau khối thói quen, trước đoạn chữ cuối trang (mục 8 của §6.3; khối dinh dưỡng của M4b sẽ chen vào trước nó).
6. **`lastMeasuredOn`** là `measured_on` lớn nhất của mọi dòng `growth`, bất kể chỉ số nào (§8.3).
7. **Dòng "Đến kỳ đo"** đứng sau dòng tiêm chủng, trước hai dòng thói quen. Khi quá 4 dòng thì dòng đứng sau bị bỏ.
8. **Hai test cũ của thẻ Tăng trưởng** dựng bé 67 ngày tuổi chưa đo lần nào; từ plan này trang có dòng "Đến kỳ đo" đứng trước thẻ và cũng mở `/tang-truong`. Test "static description" đổi sang bé 25 ngày tuổi, còn hàm `goalCard` của nhóm test hàng mục tiêu cắt trang từ "Theo dõi" trở đi, để cả hai vẫn đọc đúng thẻ chứ không đọc nhầm dòng mới. Hành vi của thẻ không đổi.
9. **Bước 37 của checklist** viết theo §9.3, thêm mục cho hai công tắc, khối thói quen và theme Ban đêm. Mục 6 của nó (thông báo cảnh báo tới máy thứ hai) cần một lần đo thử do chính người dùng nhập rồi xóa trên máy của họ; plan này không nhập gì.
10. **Kiểm trình duyệt** chỉ xem, không gạt công tắc. Dùng khung Browser trong app ở 375×812, không hỏi lại.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`; mã hex trong bản vẽ không được chép vào component.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (hotfix 7822c90): lớp trong chỉ còn màu nền và viền.
- Mọi ngày giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString`, `ageDays`, `ageOnDay` có sẵn.
- Số đo (`growth`) vẫn ghi qua outbox như hiện tại. Hồ sơ bé (`babies`) vẫn ghi bằng `updateBaby` (`lib/data/baby.ts`), chỉ chủ gia đình ghi được (policy `babies_update` hiện có); spec này không đổi policy nào.
- Chữ về sức khỏe: chỉ dùng đúng các câu ghi trong spec này. App không chẩn đoán, không nêu tên bệnh, không nêu liều thuốc, không gợi ý thực phẩm chức năng, không dùng câu nào cam kết đạt chiều cao mục tiêu.
- Mọi con số y khoa mới phải lấy từ nguồn ghi ở §6.2, §7.1, §7.3 và ghi `source`, `reviewedAt` trong file nội dung; không lấy số từ trí nhớ.
- Bảng WHO trong app chỉ có ngày tuổi 0–1856. Ngoài khoảng đó không đánh giá, không cảnh báo, không vẽ đường mục tiêu.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề và nội dung thẻ cảnh báo, dòng chênh dưới thanh vị trí, các đoạn chú thích `text-muted`, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), các dòng dinh dưỡng.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay dừng đồng hồ, không bật tắt công tắc. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Tải file từ `cdn.who.int` (§6.2) cần người dùng đồng ý trước khi chạy.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 1153 test vitest, pgTAP 001–013, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 5** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m5c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 5 patch đã được áp lần lượt lên một bản sao ở ngoài repo, trên nền M5b. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh là số đo thật trên cả bộ test. Trang tạm của Task 3 đã qua `tsc --noEmit`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: **không gạt công tắc của hàng nhắc đo** (gạt là ghi vào tùy chọn thật của người dùng), không bấm "Lưu", không thêm hay sửa lần đo, không bắt đầu hay dừng đồng hồ.
- **Lên `main` không cần hỏi.** Khi mọi bước kiểm xanh và không còn lỗi đã biết thì merge và push. Bước trình duyệt lộ ra lỗi thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan; **không đẩy một thay đổi còn lỗi đã biết**. Chỗ nào cần người dùng quyết thì dừng lại và báo.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng sau M5b (đã ở `main` @ `e6334a2`) và là plan cuối của mốc M5. M4b sau này thêm khối dinh dưỡng vào trang Chiều cao, ngay trước hàng nhắc đo.

**Consumes (đã ở `main`):** `nextMeasureDue`, `latestDay`, `daysBetween`, `MeasureDue` (`lib/rules/measureSchedule.ts`, M5b); `attentionItems`, `AttentionItem`, `habitAttention` (`lib/rules/attention.ts`, M4c); `AttentionList`, `HealthScreen` (M4c); `HeightScreen`, `HabitsCard` (M3c, M4a); `useNotificationPrefs`, `useSavePrefs`, `DEFAULT_PREFS` với trường `growth_measure` (`lib/data/notificationPrefs.ts`, M5a); `Switch`, `Icon`; `toVietnameseError`; `formatDayShort`; `WHO_LAST_DAY`.

**Produces:**

- `lib/rules/measureSchedule.ts`: `MeasureReminder = { title: string; detail: string }`; `measureReminder(input: { dob: string; lastMeasuredOn: string | null; today: string }): MeasureReminder | null`.
- `lib/rules/attention.ts`: `measureAttention(measure: { measureDue: boolean; lastMeasuredOn: string | null } | null): AttentionItem | null` (khóa `measure`); `attentionItems(input: { growth; vaccine; measure; habits; today })`.
- `components/height/MeasureReminderRow.tsx`: `MeasureReminderRowView({ reminder, checked, disabled, onChange })`, `MeasureReminderRow({ userId, reminder })`.
- `HeightScreen({ baby, isOwner, userId })`; `app/tang-truong/chieu-cao/page.tsx` truyền `session.user.id`.
- `docs/device-checklist.md`: "Bước 37", trạng thái "Chờ người dùng".
- **Vitest sau M5c:** 1642 test, 182 file.

---

### Task 1: Dòng "Đến kỳ đo" của "Cần chú ý" (§4 dòng 4)

**Files:**

- Modify: `lib/rules/attention.ts`, `components/health/HealthScreen.tsx`
- Test: `lib/rules/attention.test.ts`, `components/health/health.test.tsx`

**Interfaces:**

- Consumes: `nextMeasureDue`, `latestDay` (M5b); `attentionItems`, `AttentionItem`; `formatDayShort`.
- Produces: `measureAttention(measure)`; `attentionItems` nhận thêm `measure`; `HealthScreen` tính `measure` từ các lần đo đã tải.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m5c
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/health/health.test.tsx b/components/health/health.test.tsx
index a8878b3..e4b930f 100644
--- a/components/health/health.test.tsx
+++ b/components/health/health.test.tsx
@@ -389,12 +389,66 @@ describe("HealthScreen: habits in Cần chú ý", () => {
   });
 });

+// Spec 2026-11-25 §4, row 4. The baby was born on 14/09 and today is 20/11:
+// under one year, so a measurement is due 30 days after the last one.
+describe("HealthScreen: Đến kỳ đo in Cần chú ý", () => {
+  it("the last measurement is 30 days old or more: a plain row that opens Tăng trưởng", () => {
+    const page = render({ growth: loaded([measure("2026-10-21", 5500)]) });
+    expect(page.indexOf(">Cần chú ý<")).toBeLessThan(
+      page.indexOf(">Theo dõi<"),
+    );
+    const row = link(page, "/tang-truong");
+    expect(row).toContain(">Đến kỳ đo</span>");
+    expect(row).toContain(
+      '<span class="text-[13px] text-muted">Lần đo gần nhất 21/10</span>',
+    );
+    expect(row).toContain(`d="${ICON_PATHS.ruler}"`);
+  });
+
+  it("measured less than 30 days ago: no row", () => {
+    const page = render({ growth: loaded([measure("2026-10-22", 5500)]) });
+    expect(page).not.toContain("Đến kỳ đo");
+  });
+
+  it("never measured, 30 days after birth: says so", () => {
+    const page = render({ growth: loaded([]) });
+    expect(link(page, "/tang-truong")).toContain(
+      '<span class="text-[13px] text-muted">Chưa có lần đo nào</span>',
+    );
+    expect(render({ growth: loaded([]) }, "2026-10-22")).not.toContain(
+      "Đến kỳ đo",
+    );
+  });
+
+  it.each([
+    ["loading", LOADING],
+    ["offline", OFFLINE],
+    ["after an error", FAILED],
+  ])("measurements %s: no row", (_, q) => {
+    expect(render({ growth: q })).not.toContain("Đến kỳ đo");
+  });
+
+  it("comes after the vaccine row", () => {
+    const page = render({
+      doses: loaded([]),
+      growth: loaded([measure("2026-10-21", 5500)]),
+    });
+    const order = [">Quá hạn: Lao (BCG)<", ">Đến kỳ đo<", ">Theo dõi<"].map(
+      (text) => page.indexOf(text),
+    );
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+  });
+});
+
 describe("HealthScreen: the Tăng trưởng card", () => {
   it.each([
     ["loading", LOADING],
     ["no measurement", loaded([])],
   ])("%s: the static description and no values", (_, q) => {
-    const card = link(render({ growth: q }), HEALTH_GROWTH.href);
+    // Born 25 days ago: no measurement is due yet, so the card is the first
+    // link to Tăng trưởng on the page.
+    const card = link(render({ growth: q }, "2026-10-26"), HEALTH_GROWTH.href);
     expect(card).toContain(`>${HEALTH_GROWTH.detail}</span>`);
     expect(card).not.toContain("Cân nặng</span>");
     expect(card).not.toContain("Đo gần nhất");
@@ -423,8 +477,11 @@ describe("HealthScreen: the Tăng trưởng card", () => {
   });

   // Spec 2026-11-25 §3.4 and §6.4: the line at the foot of the card.
-  const goalCard = (growth: unknown, target: number | null, tables = true) =>
-    link(render({ growth, tables }, "2026-09-14", target), HEALTH_GROWTH.href);
+  const goalCard = (growth: unknown, target: number | null, tables = true) => {
+    const page = render({ growth, tables }, "2026-09-14", target);
+    // The card itself, not a row of "Cần chú ý" that also opens Tăng trưởng.
+    return link(page.slice(page.indexOf(">Theo dõi<")), HEALTH_GROWTH.href);
+  };

   it("no target: no goal line", () => {
     expect(goalCard(loaded([measure("2026-11-15", 5500)]), null)).not.toContain(
diff --git a/lib/rules/attention.test.ts b/lib/rules/attention.test.ts
index 81b6da9..14ac41f 100644
--- a/lib/rules/attention.test.ts
+++ b/lib/rules/attention.test.ts
@@ -4,6 +4,7 @@ import {
   attentionItems,
   growthAttention,
   habitAttention,
+  measureAttention,
   vaccineAttention,
   type AttentionItem,
 } from "./attention";
@@ -89,6 +90,7 @@ describe("attentionItems", () => {
       attentionItems({
         growth: null,
         vaccine: null,
+        measure: null,
         habits: null,
         today: TODAY,
       }),
@@ -97,6 +99,7 @@ describe("attentionItems", () => {
       attentionItems({
         growth: [],
         vaccine: dose("later", "2027-06-14"),
+        measure: null,
         habits: null,
         today: TODAY,
       }),
@@ -107,6 +110,7 @@ describe("attentionItems", () => {
     const items = attentionItems({
       growth: null,
       vaccine: dose("overdue", "2026-11-10"),
+      measure: null,
       habits: null,
       today: TODAY,
     });
@@ -123,6 +127,7 @@ describe("attentionItems", () => {
     const items = attentionItems({
       growth: five,
       vaccine: dose("overdue", "2026-11-10"),
+      measure: null,
       habits: null,
       today: TODAY,
     });
@@ -167,6 +172,7 @@ describe("growthAttention", () => {
     const items = attentionItems({
       growth: [alert("wfa", "yellow")],
       vaccine: dose("overdue", "2026-11-10"),
+      measure: null,
       habits: null,
       today: TODAY,
     });
@@ -222,6 +228,7 @@ describe("habitAttention", () => {
     const items = attentionItems({
       growth: [alert("wfa", "yellow")],
       vaccine: dose("overdue", "2026-11-10"),
+      measure: null,
       habits: { sleep: SLEEP, tummy: TUMMY },
       today: TODAY,
     });
@@ -237,6 +244,7 @@ describe("habitAttention", () => {
     const items = attentionItems({
       growth: [alert("wfa", "red"), alert("lhfa", "yellow")],
       vaccine: dose("overdue", "2026-11-10"),
+      measure: null,
       habits: { sleep: SLEEP, tummy: TUMMY },
       today: TODAY,
     });
@@ -248,3 +256,52 @@ describe("habitAttention", () => {
     ]);
   });
 });
+
+// Spec 2026-11-25 §4, row 4.
+describe("measureAttention", () => {
+  it("not worked out yet, or not due: no row", () => {
+    expect(measureAttention(null)).toBeNull();
+    expect(
+      measureAttention({ measureDue: false, lastMeasuredOn: "2026-11-20" }),
+    ).toBeNull();
+  });
+
+  it("due: Đến kỳ đo with the day of the last measurement, opens Tăng trưởng", () => {
+    expect(
+      measureAttention({ measureDue: true, lastMeasuredOn: "2026-10-16" }),
+    ).toEqual({
+      key: "measure",
+      icon: "ruler",
+      color: "cat-tummy",
+      title: "Đến kỳ đo",
+      detail: "Lần đo gần nhất 16/10",
+      tone: "normal",
+      href: "/tang-truong",
+    });
+  });
+
+  it("due and never measured: says so", () => {
+    expect(
+      measureAttention({ measureDue: true, lastMeasuredOn: null })?.detail,
+    ).toBe("Chưa có lần đo nào");
+  });
+
+  it("comes after the vaccine row and before the habit rows; the cut at four drops the last one", () => {
+    const items = attentionItems({
+      growth: [alert("wfa", "yellow")],
+      vaccine: dose("overdue", "2026-11-10"),
+      measure: { measureDue: true, lastMeasuredOn: "2026-10-16" },
+      habits: {
+        sleep: "13,5 giờ mỗi ngày · nên 14–17 giờ",
+        tummy: "15 phút mỗi ngày · nên từ 30 phút",
+      },
+      today: TODAY,
+    });
+    expect(items.map((item) => item.key)).toEqual([
+      "growth-wfa",
+      "vaccine",
+      "measure",
+      "sleep",
+    ]);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  2 failed | 179 passed (181)`, `Tests  7 failed | 1622 passed (1629)`. Lý do đỏ: chưa có `measureAttention` và trang chưa có dòng "Đến kỳ đo".

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/health/HealthScreen.tsx b/components/health/HealthScreen.tsx
index deb09fd..f2b3c25 100644
--- a/components/health/HealthScreen.tsx
+++ b/components/health/HealthScreen.tsx
@@ -35,6 +35,7 @@ import {
 import { indicatorSummaries } from "@/lib/rules/growthView";
 import { habitStats } from "@/lib/rules/habits";
 import { goalLine } from "@/lib/rules/heightView";
+import { latestDay, nextMeasureDue } from "@/lib/rules/measureSchedule";
 import { vnDateString } from "@/lib/rules/time";
 import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
 import { buildSchedule, nextDose } from "@/lib/rules/vaccines";
@@ -232,9 +233,21 @@ export function HealthScreen({ baby }: { baby: Baby }) {
         table: measured.tables.lhfa,
       })
     : null;
+  // Spec §4, row 4: until the measurements have loaded there is no row.
+  const lastMeasuredOn = latestDay(
+    (growth.data ?? []).map((row) => row.measured_on),
+  );
+  const measure = growth.data
+    ? {
+        measureDue: nextMeasureDue({ dob: baby.dob, lastMeasuredOn, today })
+          .measureDue,
+        lastMeasuredOn,
+      }
+    : null;
   const attention = attentionItems({
     growth: alerts,
     vaccine: next,
+    measure,
     habits,
     today,
   });
diff --git a/lib/rules/attention.ts b/lib/rules/attention.ts
index db07347..2926f6e 100644
--- a/lib/rules/attention.ts
+++ b/lib/rules/attention.ts
@@ -72,6 +72,26 @@ export function growthAttention(alerts: GrowthAlert[] | null): AttentionItem[] {
   }));
 }

+// Row 4 of the table: `measure` is what nextMeasureDue worked out and the day
+// of the last measurement. null: the measurements have not loaded yet.
+export function measureAttention(
+  measure: { measureDue: boolean; lastMeasuredOn: string | null } | null,
+): AttentionItem | null {
+  if (measure === null || !measure.measureDue) return null;
+  return {
+    key: "measure",
+    icon: "ruler",
+    color: "cat-tummy",
+    title: "Đến kỳ đo",
+    detail:
+      measure.lastMeasuredOn === null
+        ? "Chưa có lần đo nào"
+        : `Lần đo gần nhất ${formatDayShort(measure.lastMeasuredOn)}`,
+    tone: "normal",
+    href: "/tang-truong",
+  };
+}
+
 // Rows 5 and 6 of the table: `habits` is what habitStats worked out, the
 // detail of each row or null. null: the logs have not loaded yet.
 export function habitAttention(
@@ -107,12 +127,14 @@ export function habitAttention(
 export function attentionItems(input: {
   growth: GrowthAlert[] | null;
   vaccine: ScheduleItem | null;
+  measure: { measureDue: boolean; lastMeasuredOn: string | null } | null;
   habits: HabitStats["attention"] | null;
   today: string;
 }): AttentionItem[] {
   const rows = [
     ...growthAttention(input.growth),
     vaccineAttention(input.vaccine, input.today),
+    measureAttention(input.measure),
     ...habitAttention(input.habits),
   ];
   return rows
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  181 passed (181)`, `Tests  1629 passed (1629)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/attention.ts lib/rules/attention.test.ts components/health/HealthScreen.tsx components/health/health.test.tsx
git commit -m "feat(attention): a row when the next measurement is due" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Hàng nhắc đo trên trang Chiều cao (§8.3, §6.3 mục 8)

**Files:**

- Create: `components/height/MeasureReminderRow.tsx`
- Modify: `lib/rules/measureSchedule.ts`, `components/height/HeightScreen.tsx`, `app/tang-truong/chieu-cao/page.tsx`
- Test: `lib/rules/measureSchedule.test.ts`, `components/height/measurereminder.test.tsx` (mới), `components/height/heightscreen.test.tsx`

**Interfaces:**

- Consumes: `nextMeasureDue`, `latestDay`, `daysBetween` (M5b); `useNotificationPrefs`, `useSavePrefs`, `DEFAULT_PREFS` (M5a); `Switch`, `Icon`, `toVietnameseError`.
- Produces: `MeasureReminder`, `measureReminder(input)`; `MeasureReminderRowView`, `MeasureReminderRow`; `HeightScreen` nhận `userId` và vẽ hàng nhắc đo sau khối thói quen.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/height/heightscreen.test.tsx b/components/height/heightscreen.test.tsx
index 207241e..1970ebc 100644
--- a/components/height/heightscreen.test.tsx
+++ b/components/height/heightscreen.test.tsx
@@ -13,9 +13,15 @@ const state = vi.hoisted(() => ({
 const useGrowth = vi.hoisted(() => vi.fn());
 const useWhoTable = vi.hoisted(() => vi.fn());
 const useStatsLogs = vi.hoisted(() => vi.fn());
+const useNotificationPrefs = vi.hoisted(() => vi.fn());

 vi.mock("@/lib/data/growth", () => ({ useGrowth, useWhoTable }));
 vi.mock("@/lib/data/logs", () => ({ useStatsLogs }));
+vi.mock("@/lib/data/notificationPrefs", () => ({
+  DEFAULT_PREFS: { growth_measure: true },
+  useNotificationPrefs,
+  useSavePrefs: () => ({ mutate: () => {}, isPending: false, isError: false }),
+}));
 // The chart is loaded lazily; a stand-in shows what it was given.
 vi.mock("next/dynamic", () => ({
   default:
@@ -100,13 +106,19 @@ function render(
   state.growth = (query.growth ?? loaded(ROWS)) as Record<string, unknown>;
   state.table = (query.table ?? TABLE) as Record<string, unknown>;
   state.logs = (query.logs ?? loaded([])) as Record<string, unknown>;
-  return renderToStaticMarkup(<HeightScreen baby={who} isOwner={isOwner} />);
+  return renderToStaticMarkup(
+    <HeightScreen baby={who} isOwner={isOwner} userId="u1" />,
+  );
 }

 beforeAll(() => {
   useGrowth.mockImplementation(() => state.growth);
   useWhoTable.mockImplementation(() => state.table);
   useStatsLogs.mockImplementation(() => state.logs);
+  useNotificationPrefs.mockImplementation(() => ({
+    data: { growth_measure: false },
+    isSuccess: true,
+  }));
   vi.useFakeTimers({ toFake: ["Date"] });
   vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
 });
@@ -210,6 +222,30 @@ describe("HeightScreen", () => {
     }
   });

+  // Spec 2026-11-25 §8.3. The newest measurement is of 15/11 and the baby is
+  // under one year: the next one is due on 15/12.
+  it("the measure reminder: after the habits, before the closing note, with the viewer's switch", () => {
+    useNotificationPrefs.mockClear();
+    const html = render();
+    const order = [
+      ">Thói quen 7 ngày qua</h2>",
+      ">Nhắc đo mỗi tháng</span>",
+      ">Lần tới 15/12 · 08:00</span>",
+      "Chiều cao lúc lớn phần lớn do di truyền.",
+    ].map((text) => html.indexOf(text));
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+    expect(useNotificationPrefs).toHaveBeenCalledWith("u1");
+    expect(html).toContain('aria-label="Nhắc đo định kỳ"');
+    expect(html).toContain('aria-checked="false"');
+  });
+
+  it("the measure reminder says when a measurement is due", () => {
+    const html = render({ growth: loaded([measure("2026-10-14", 58.5)]) });
+    expect(html).toContain(">Đã đến kỳ đo</span>");
+    expect(html).not.toContain("Lần tới");
+  });
+
   it("no target: the goal card says so, there is no path, the rest stays", () => {
     const html = render({}, baby({ target_height_cm: null }));
     expect(html).toContain(">Chưa có mục tiêu chiều cao</p>");
@@ -276,6 +312,8 @@ describe("HeightScreen", () => {
     expect(html).not.toContain("Nằm sấp");
     expect(html).not.toContain("Vitamin D");
     expect(html).toContain(">Chuẩn giấc ngủ như trang Thống kê.</p>");
+    // Past the WHO table nothing is due, so there is no reminder row.
+    expect(html).not.toContain("Nhắc đo");
     expect(html).toContain(">Di truyền dự kiến</h2>");
     expect(html).toContain("Chiều cao lúc lớn phần lớn do di truyền.");
   });
diff --git a/components/height/measurereminder.test.tsx b/components/height/measurereminder.test.tsx
new file mode 100644
index 0000000..1b2392d
--- /dev/null
+++ b/components/height/measurereminder.test.tsx
@@ -0,0 +1,133 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import {
+  MeasureReminderRow,
+  MeasureReminderRowView,
+} from "./MeasureReminderRow";
+
+const state = vi.hoisted(() => ({
+  prefs: {} as Record<string, unknown>,
+  save: {} as Record<string, unknown>,
+}));
+const useNotificationPrefs = vi.hoisted(() => vi.fn());
+const useSavePrefs = vi.hoisted(() => vi.fn());
+const mutate = vi.hoisted(() => vi.fn());
+
+vi.mock("@/lib/data/notificationPrefs", () => ({
+  DEFAULT_PREFS: { growth_measure: true },
+  useNotificationPrefs,
+  useSavePrefs,
+}));
+
+const REMINDER = {
+  title: "Nhắc đo mỗi tháng",
+  detail: "Lần tới 15/12 · 08:00",
+};
+const view = (
+  over: Partial<Parameters<typeof MeasureReminderRowView>[0]> = {},
+) => ({
+  reminder: REMINDER,
+  checked: true,
+  disabled: false,
+  onChange: () => {},
+  ...over,
+});
+const IDLE = { mutate, isPending: false, isError: false, error: null };
+
+beforeEach(() => {
+  mutate.mockClear();
+  useNotificationPrefs.mockImplementation(() => state.prefs);
+  useSavePrefs.mockImplementation(() => state.save);
+  state.prefs = { data: { growth_measure: true }, isSuccess: true };
+  state.save = IDLE;
+});
+
+// Spec 2026-11-25 §8.3.
+describe("MeasureReminderRowView", () => {
+  it("a glass row: a bell in an accent-tinted circle, the name, the next day, the switch", () => {
+    const html = renderToStaticMarkup(<MeasureReminderRowView {...view()} />);
+    expect(html).toContain("glass");
+    expect(html).toContain("rounded-[26px]");
+    expect(html).toContain("size-9");
+    expect(html).toContain("bg-accent-tint");
+    expect(html).toContain(`d="${ICON_PATHS.bell}"`);
+    expect(html).toContain(">Nhắc đo mỗi tháng</span>");
+    expect(html).toContain(">Lần tới 15/12 · 08:00</span>");
+    expect(html).toContain('role="switch"');
+    expect(html).toContain('aria-checked="true"');
+    expect(html).toContain('aria-label="Nhắc đo định kỳ"');
+  });
+
+  it("shows the switch off and locked as told", () => {
+    const html = renderToStaticMarkup(
+      <MeasureReminderRowView {...view({ checked: false, disabled: true })} />,
+    );
+    expect(html).toContain('aria-checked="false"');
+    expect(html).toContain('disabled=""');
+  });
+
+  it("hands a change of the switch on", () => {
+    const onChange = vi.fn();
+    const [toggle] = findElements(
+      MeasureReminderRowView(view({ onChange })),
+      (el) => el.props.checked !== undefined,
+    );
+    (toggle.props.onChange as (v: boolean) => void)(false);
+    expect(onChange).toHaveBeenCalledWith(false);
+  });
+});
+
+describe("MeasureReminderRow", () => {
+  const render = () =>
+    renderToStaticMarkup(
+      <MeasureReminderRow userId="u1" reminder={REMINDER} />,
+    );
+  const toggle = () =>
+    findElements(
+      MeasureReminderRow({ userId: "u1", reminder: REMINDER }),
+      (el) => el.props.checked !== undefined,
+    )[0];
+
+  it("shows the viewer's own Nhắc đo định kỳ preference", () => {
+    expect(render()).toContain('aria-checked="true"');
+    expect(useNotificationPrefs).toHaveBeenCalledWith("u1");
+    expect(useSavePrefs).toHaveBeenCalledWith("u1");
+    state.prefs = { data: { growth_measure: false }, isSuccess: true };
+    expect(render()).toContain('aria-checked="false"');
+  });
+
+  it("saves the switch through the notification preferences", () => {
+    (toggle().props.onChange as (v: boolean) => void)(false);
+    expect(mutate).toHaveBeenCalledExactlyOnceWith({ growth_measure: false });
+  });
+
+  it("is locked until the preferences have loaded, and while a change is being saved", () => {
+    state.prefs = { data: undefined, isSuccess: false };
+    const loading = render();
+    expect(loading).toContain('aria-checked="true"');
+    expect(loading).toContain('disabled=""');
+    state.prefs = { data: { growth_measure: true }, isSuccess: true };
+    state.save = { ...IDLE, isPending: true };
+    expect(render()).toContain('disabled=""');
+    state.save = IDLE;
+    expect(render()).not.toContain('disabled=""');
+  });
+
+  it("says why when the change could not be saved, or the preference could not be loaded", () => {
+    expect(render()).not.toContain('role="alert"');
+    state.save = { ...IDLE, isError: true, error: new Error("boom") };
+    expect(render()).toContain('role="alert"');
+    state.save = IDLE;
+    state.prefs = {
+      data: undefined,
+      isSuccess: false,
+      isError: true,
+      error: new Error("boom"),
+    };
+    const failed = render();
+    expect(failed).toContain('role="alert"');
+    expect(failed).toContain('disabled=""');
+  });
+});
diff --git a/lib/rules/measureSchedule.test.ts b/lib/rules/measureSchedule.test.ts
index df0e48f..fa84fe1 100644
--- a/lib/rules/measureSchedule.test.ts
+++ b/lib/rules/measureSchedule.test.ts
@@ -1,6 +1,6 @@
 import { describe, expect, it } from "vitest";
 import { addDays } from "./days";
-import { latestDay, nextMeasureDue } from "./measureSchedule";
+import { latestDay, measureReminder, nextMeasureDue } from "./measureSchedule";

 const DOB = "2026-01-01";
 const day = (age: number) => addDays(DOB, age);
@@ -60,3 +60,42 @@ describe("latestDay", () => {
     );
   });
 });
+
+// Spec 2026-11-25 §8.3: the row on the Chiều cao page.
+describe("measureReminder", () => {
+  it("under one year: every month, with the day of the next reminder", () => {
+    expect(
+      measureReminder({ dob: DOB, lastMeasuredOn: day(100), today: day(120) }),
+    ).toEqual({ title: "Nhắc đo mỗi tháng", detail: `Lần tới 11/05 · 08:00` });
+  });
+
+  it("from one year: every three months", () => {
+    expect(
+      measureReminder({ dob: DOB, lastMeasuredOn: day(350), today: day(365) }),
+    ).toEqual({
+      title: "Nhắc đo ba tháng một lần",
+      detail: "Lần tới 17/03 · 08:00",
+    });
+  });
+
+  it("due: says so in place of the next day", () => {
+    expect(
+      measureReminder({ dob: DOB, lastMeasuredOn: day(100), today: day(130) }),
+    ).toEqual({ title: "Nhắc đo mỗi tháng", detail: "Đã đến kỳ đo" });
+    expect(
+      measureReminder({ dob: DOB, lastMeasuredOn: null, today: day(45) })
+        ?.detail,
+    ).toBe("Đã đến kỳ đo");
+  });
+
+  it("past day 1856 there is no row", () => {
+    const at = (today: number) =>
+      measureReminder({
+        dob: DOB,
+        lastMeasuredOn: day(1850),
+        today: day(today),
+      });
+    expect(at(1856)?.title).toBe("Nhắc đo ba tháng một lần");
+    expect(at(1857)).toBeNull();
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  3 failed | 179 passed (182)`, `Tests  6 failed | 1629 passed (1635)`. File test mới `measurereminder.test.tsx` không chạy được test nào vì chưa có `./MeasureReminderRow`; 6 test đỏ còn lại là của `measureReminder` và của trang.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/app/tang-truong/chieu-cao/page.tsx b/app/tang-truong/chieu-cao/page.tsx
index 80be20e..969a40f 100644
--- a/app/tang-truong/chieu-cao/page.tsx
+++ b/app/tang-truong/chieu-cao/page.tsx
@@ -8,7 +8,11 @@ export default function Page() {
     <AuthGate need="baby">
       {({ session, ctx }) =>
         ctx?.baby && session ? (
-          <HeightScreen baby={ctx.baby} isOwner={ctx.member.role === "owner"} />
+          <HeightScreen
+            baby={ctx.baby}
+            isOwner={ctx.member.role === "owner"}
+            userId={session.user.id}
+          />
         ) : null
       }
     </AuthGate>
diff --git a/components/height/HeightScreen.tsx b/components/height/HeightScreen.tsx
index d1422c9..2f4f94a 100644
--- a/components/height/HeightScreen.tsx
+++ b/components/height/HeightScreen.tsx
@@ -15,6 +15,8 @@ import { statsFetchSince } from "@/lib/rules/dailyStats";
 import { vnDayRange } from "@/lib/rules/days";
 import { habitStats } from "@/lib/rules/habits";
 import { heightView } from "@/lib/rules/heightView";
+import { latestDay, measureReminder } from "@/lib/rules/measureSchedule";
+import { vnDateString } from "@/lib/rules/time";
 import type { Baby } from "@/lib/supabase/rows";
 import {
   HeightGoalCard,
@@ -24,6 +26,7 @@ import {
 } from "./HeightCards";
 import { HabitsCard } from "./HabitsCard";
 import { HeightGoalSheet } from "./HeightGoalSheet";
+import { MeasureReminderRow } from "./MeasureReminderRow";

 const NOTE = "px-1 text-[13px] leading-[18px] text-muted";

@@ -44,9 +47,12 @@ const GrowthChart = dynamic(
 export function HeightScreen({
   baby,
   isOwner,
+  userId,
 }: {
   baby: Baby;
   isOwner: boolean;
+  // Spec §8.3: whose "Nhắc đo định kỳ" switch the reminder row shows.
+  userId: string;
 }) {
   const growth = useGrowth(baby.id);
   // Spec §6.5: only the owner of the family may open the sheet.
@@ -59,6 +65,14 @@ export function HeightScreen({
   const now = new Date();
   const logs = useStatsLogs(baby.id, statsFetchSince(vnDayRange(now, 14)));
   const habits = logs.data ? habitStats(logs.data, baby.dob, now) : null;
+  // Spec §8.3: counted from the newest measurement of any indicator.
+  const reminder = growth.data
+    ? measureReminder({
+        dob: baby.dob,
+        lastMeasuredOn: latestDay(growth.data.map((row) => row.measured_on)),
+        today: vnDateString(now),
+      })
+    : null;
   const view =
     growth.data && table.data
       ? heightView({
@@ -120,6 +134,9 @@ export function HeightScreen({
             </>
           )}
           {habits && <HabitsCard rows={habits.rows} />}
+          {reminder && (
+            <MeasureReminderRow userId={userId} reminder={reminder} />
+          )}
           <p className={NOTE}>
             Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và
             nhắc việc, không thay lời khuyên của bác sĩ.
diff --git a/components/height/MeasureReminderRow.tsx b/components/height/MeasureReminderRow.tsx
new file mode 100644
index 0000000..b0413d8
--- /dev/null
+++ b/components/height/MeasureReminderRow.tsx
@@ -0,0 +1,75 @@
+"use client";
+
+import { Icon } from "@/components/ui/Icon";
+import { Switch } from "@/components/ui/Switch";
+import { toVietnameseError } from "@/lib/data/errors";
+import {
+  DEFAULT_PREFS,
+  useNotificationPrefs,
+  useSavePrefs,
+} from "@/lib/data/notificationPrefs";
+import type { MeasureReminder } from "@/lib/rules/measureSchedule";
+
+// Spec 2026-11-25 §8.3: when the family is next reminded to measure, and the
+// viewer's own "Nhắc đo định kỳ" switch.
+export function MeasureReminderRowView({
+  reminder,
+  checked,
+  disabled,
+  onChange,
+}: {
+  reminder: MeasureReminder;
+  checked: boolean;
+  disabled: boolean;
+  onChange: (value: boolean) => void;
+}) {
+  return (
+    <div className="glass flex items-center gap-3 rounded-[26px] p-4">
+      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-text">
+        <Icon name="bell" size={18} strokeWidth={2.2} />
+      </span>
+      <span className="flex min-w-0 flex-1 flex-col">
+        <span className="text-base font-bold text-ink">{reminder.title}</span>
+        <span className="text-[13px] leading-[18px] text-muted">
+          {reminder.detail}
+        </span>
+      </span>
+      <Switch
+        checked={checked}
+        label="Nhắc đo định kỳ"
+        disabled={disabled}
+        onChange={onChange}
+      />
+    </div>
+  );
+}
+
+// The same preference as the "Nhắc đo định kỳ" switch in Cài đặt, saved the
+// same way. It is saved whether or not this device has notifications on, like
+// the switches of the medicine reminders.
+export function MeasureReminderRow({
+  userId,
+  reminder,
+}: {
+  userId: string;
+  reminder: MeasureReminder;
+}) {
+  const prefs = useNotificationPrefs(userId);
+  const save = useSavePrefs(userId);
+  const values = prefs.data ?? DEFAULT_PREFS;
+  return (
+    <>
+      <MeasureReminderRowView
+        reminder={reminder}
+        checked={values.growth_measure}
+        disabled={!prefs.isSuccess || save.isPending}
+        onChange={(value) => save.mutate({ growth_measure: value })}
+      />
+      {(prefs.isError || save.isError) && (
+        <p role="alert" className="px-1 text-[15px] text-danger">
+          {toVietnameseError(prefs.error ?? save.error)}
+        </p>
+      )}
+    </>
+  );
+}
diff --git a/lib/rules/measureSchedule.ts b/lib/rules/measureSchedule.ts
index db96bf2..dde779b 100644
--- a/lib/rules/measureSchedule.ts
+++ b/lib/rules/measureSchedule.ts
@@ -1,5 +1,5 @@
 import { WHO_LAST_DAY } from "@/lib/content/who";
-import { addDays, vnDayStartMs } from "./days";
+import { addDays, formatDayShort, vnDayStartMs } from "./days";

 const DAY_MS = 86_400_000;

@@ -40,3 +40,22 @@ export function nextMeasureDue(input: {
     measureDue: input.today >= due && age <= WHO_LAST_DAY,
   };
 }
+
+export type MeasureReminder = { title: string; detail: string };
+
+// Spec 2026-11-25 §8.3: the reminder row on the Chiều cao page. null past the
+// last day of the WHO tables, when nothing is due any more.
+export function measureReminder(input: {
+  dob: string;
+  lastMeasuredOn: string | null;
+  today: string;
+}): MeasureReminder | null {
+  if (daysBetween(input.dob, input.today) > WHO_LAST_DAY) return null;
+  const { interval, due, measureDue } = nextMeasureDue(input);
+  return {
+    title: interval === 30 ? "Nhắc đo mỗi tháng" : "Nhắc đo ba tháng một lần",
+    detail: measureDue
+      ? "Đã đến kỳ đo"
+      : `Lần tới ${formatDayShort(due)} · 08:00`,
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  182 passed (182)`, `Tests  1642 passed (1642)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/measureSchedule.ts lib/rules/measureSchedule.test.ts components/height/MeasureReminderRow.tsx components/height/measurereminder.test.tsx components/height/HeightScreen.tsx components/height/heightscreen.test.tsx app/tang-truong/chieu-cao/page.tsx
git commit -m "feat(height): the measure reminder row with the viewer's switch" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Checklist thiết bị, kiểm cuối M5c rồi đưa lên `main`

**Files:**

- Modify: `docs/device-checklist.md`
- Create rồi xóa trước khi commit: `app/fixture-height/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: "Bước 37" trong checklist; kết quả kiểm, ghi ngay trong plan; `main` có M5c.

- [x] **Step 1: Thêm Bước 37 vào checklist thiết bị (Patch 5) và commit**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index 2b6766b..ed4f2d3 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -620,3 +620,26 @@ Kết quả: Chờ người dùng.
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 37 — Sức khỏe, Tăng trưởng, Chiều cao và thông báo tăng trưởng (spec 2026-11-25 §3–§8)
+
+Mục 2 tạo một bản ghi Ngủ thử và mục 6 tạo một lần đo thử; mỗi mục xóa dữ liệu thử của nó ngay. Cần hai máy đã bật thông báo, đăng nhập hai tài khoản khác nhau của cùng gia đình (máy A, máy B).
+
+1. Mở app từ màn hình chính. Kỳ vọng: thanh tab có 4 tab "Hôm nay", "Nhật ký", "Sức khỏe", "Tiện ích"; không chữ nào bị cắt. Tab Sức khỏe có các mục Tăng trưởng, Tiêm chủng, Phát triển, Thống kê và phần "Khi bé ốm"; tab Tiện ích có các trang còn lại.
+2. Ở Hôm nay bấm "Ngủ", rồi sang tab Nhật ký, Sức khỏe, Tiện ích. Kỳ vọng: tab "Hôm nay" thành ô timer rộng hơn ba tab kia, đồng hồ đang chạy và dòng chữ nhỏ bên dưới không bị cắt hay tràn ra ngoài ô. Về Hôm nay, bấm "Dừng" rồi xóa bản ghi Ngủ thử trong Nhật ký.
+3. Sức khỏe → Tăng trưởng. Kỳ vọng: thẻ kết luận ở đầu trang nói bằng chữ bé đang thế nào so với chuẩn; mỗi chỉ số có thanh vị trí với ba số chuẩn bên dưới; thẻ "Mục tiêu chiều cao" mở trang Chiều cao.
+4. Bằng tài khoản chủ gia đình: Tăng trưởng → Mục tiêu chiều cao → nút bút chì. Nhập chiều cao thật của bố, của mẹ và mục tiêu, bấm Lưu. Kỳ vọng: thẻ mục tiêu hiện số vừa nhập và chip trạng thái; thẻ "Di truyền dự kiến" hiện khoảng dự kiến và vạch mục tiêu; biểu đồ "Đường tới … cm" có đường mục tiêu nét đứt. Bằng tài khoản thành viên khác: thấy cùng các số, không có nút bút chì.
+5. Nhập một lần đo thật (cân nặng, chiều dài, vòng đầu) ở Tăng trưởng. Kỳ vọng: thẻ kết luận, thẻ Tăng trưởng ở tab Sức khỏe và trang Chiều cao cùng cập nhật theo lần đo mới; nếu có cảnh báo thì mục "Cần chú ý" ở tab Sức khỏe có dòng của nó.
+6. Trên máy A, nhập một lần đo thử có cân nặng thấp hẳn so với lần trước (ví dụ bằng một nửa), ngày đo hôm nay. Máy B không đang trong "Giờ yên lặng" hay "Tạm tắt nhắc". Kỳ vọng: trong vài phút máy B nhận thông báo "Tăng trưởng của {tên bé} cần chú ý", chạm vào thì mở trang Tăng trưởng; máy A không nhận thông báo này. Xóa lần đo thử ngay sau đó.
+7. Cài đặt → Thông báo. Kỳ vọng: có hai công tắc "Cảnh báo tăng trưởng" và "Nhắc đo định kỳ", đang bật. Tắt "Nhắc đo định kỳ", mở Sức khỏe → Tăng trưởng → Mục tiêu chiều cao: công tắc ở hàng "Nhắc đo mỗi tháng" (bé từ 1 tuổi: "Nhắc đo ba tháng một lần") cũng đang tắt. Bật lại ở đó, quay về Cài đặt: công tắc "Nhắc đo định kỳ" đã bật.
+8. Mục này làm sau, vào ngày hàng nhắc đo ghi "Đã đến kỳ đo" (bé dưới 1 tuổi: 30 ngày sau lần đo gần nhất). Kỳ vọng: 08:00 sáng hôm đó các máy đang bật "Nhắc đo định kỳ" nhận thông báo "Đến kỳ đo cho {tên bé}"; tab Sức khỏe có dòng "Đến kỳ đo" trong "Cần chú ý". Sau khi nhập lần đo mới, dòng đó mất và hàng nhắc đo ghi "Lần tới {ngày/tháng} · 08:00".
+9. Trang Chiều cao, khối "Thói quen 7 ngày qua". Kỳ vọng: số giờ ngủ, số phút nằm sấp và số ngày uống vitamin D khớp với Nhật ký của bảy ngày trước hôm nay; khi giấc ngủ có chip "Ít hơn chuẩn" hoặc nằm sấp có chip "Còn thiếu" thì tab Sức khỏe có dòng tương ứng trong "Cần chú ý".
+10. Bật Ban đêm rồi xem lại tab Sức khỏe, trang Tăng trưởng và trang Chiều cao. Kỳ vọng: chữ, chip và biểu đồ đọc rõ, theo tông hổ phách.
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
git commit -m "docs(checklist): step 37 for health, growth, height and growth notifications" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

(File `docs/device-checklist.md` vốn không qua `prettier --check` từ trước plan này; không định dạng lại cả file.)

- [x] **Step 2: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  182 passed (182)`, `Tests  1642 passed (1642)`.

- [x] **Step 3: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 4: Tạo trang fixture tạm cho các trạng thái dữ liệu thật không có**

Trang này không đọc hay ghi dữ liệu của gia đình; công tắc trên nó không lưu gì. Tạo `app/fixture-height/page.tsx`:

```tsx
"use client";

import { AttentionList } from "@/components/health/HealthScreen";
import { MeasureReminderRowView } from "@/components/height/MeasureReminderRow";
import { habitAttention, measureAttention } from "@/lib/rules/attention";

const noop = () => {};

// Hàng nhắc đo ở bốn trạng thái: 1 bật, còn hạn · 2 tắt, đã đến kỳ đo ·
// 3 bé từ 1 tuổi (tên dài nhất) · 4 đang khóa (tùy chọn chưa tải xong).
const ROWS = [
  {
    reminder: { title: "Nhắc đo mỗi tháng", detail: "Lần tới 15/12 · 08:00" },
    checked: true,
    disabled: false,
  },
  {
    reminder: { title: "Nhắc đo mỗi tháng", detail: "Đã đến kỳ đo" },
    checked: false,
    disabled: false,
  },
  {
    reminder: {
      title: "Nhắc đo ba tháng một lần",
      detail: "Lần tới 17/03 · 08:00",
    },
    checked: true,
    disabled: false,
  },
  {
    reminder: { title: "Nhắc đo mỗi tháng", detail: "Lần tới 15/12 · 08:00" },
    checked: true,
    disabled: true,
  },
];

// Dòng "Đến kỳ đo" đứng trước hai dòng thói quen; và dạng chưa đo lần nào.
const MEASURE = measureAttention({
  measureDue: true,
  lastMeasuredOn: "2026-10-16",
});
const NEVER = measureAttention({ measureDue: true, lastMeasuredOn: null });
const HABITS = habitAttention({
  sleep: "13,5 giờ mỗi ngày · nên 14–17 giờ",
  tummy: "15 phút mỗi ngày · nên từ 30 phút",
});

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture hàng nhắc đo và dòng Đến kỳ đo</p>
      {ROWS.map((row, index) => (
        <MeasureReminderRowView key={index} {...row} onChange={noop} />
      ))}
      {MEASURE && <AttentionList items={[MEASURE, ...HABITS]} />}
      {NEVER && <AttentionList items={[NEVER]} />}
    </main>
  );
}
```

- [x] **Step 5: Kiểm trong trình duyệt (chỉ xem)**

Dùng khung Browser trong app, cỡ 375×812. Chạy `bun run dev`.

Trên trang tạm `http://localhost:3000/fixture-height`:

1. **Bốn hàng nhắc đo:** mỗi hàng là một thẻ bo tròn có vòng tròn nhạt chứa icon chuông, tên đậm, dòng xám bên dưới và công tắc ở bên phải. Hàng 1 "Nhắc đo mỗi tháng" / "Lần tới 15/12 · 08:00", công tắc bật. Hàng 2 dòng xám là "Đã đến kỳ đo", công tắc tắt. Hàng 3 tên "Nhắc đo ba tháng một lần" không đẩy công tắc ra ngoài thẻ và không bị cắt bằng "…"; dùng `getBoundingClientRect()` ghi lại bề ngang của tên và chỗ dành cho nó (ước lượng lúc viết plan: tên khoảng 194 px, chỗ khoảng 200 px, tức là sát). Tên xuống hai dòng thì **không phải lỗi**: ghi lại và đi tiếp, không đổi chữ, không đổi cỡ chữ. Hàng 4 công tắc mờ (đang khóa).
2. **Khối "Cần chú ý" thứ nhất:** ba dòng theo thứ tự "Đến kỳ đo" (dòng dưới "Lần đo gần nhất 16/10", chữ xám, icon thước), "Ngủ ít hơn chuẩn", "Nằm sấp còn ít". **Khối thứ hai:** một dòng "Đến kỳ đo" với "Chưa có lần đo nào".
3. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
4. Lặp mục 1 và 2 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"peach"`, `"lavender"`, `"sea"`, `"dark"`, `"night"`: vòng tròn icon chuông, công tắc bật và tắt, chữ xám đều đọc rõ.

Trang thật `http://localhost:3000/tang-truong/chieu-cao` (dữ liệu thật của gia đình: chỉ xem, **không gạt công tắc**):

5. Hàng nhắc đo nằm sau khối "Thói quen 7 ngày qua", trước đoạn "Chiều cao lúc lớn phần lớn do di truyền…". Ghi lại tên, dòng xám và trạng thái công tắc đang thấy. Đối chiếu dòng xám với ngày của lần đo gần nhất trên trang `http://localhost:3000/tang-truong`: bé dưới 1 tuổi thì "Lần tới" là ngày đo gần nhất cộng 30 ngày; nếu ngày đó đã qua hoặc là hôm nay thì phải là "Đã đến kỳ đo".
6. Trạng thái công tắc khớp với công tắc "Nhắc đo định kỳ" ở `http://localhost:3000/cai-dat` (chỉ nhìn, không gạt).

Trang thật `http://localhost:3000/suc-khoe`:

7. Hàng nhắc đo ghi "Đã đến kỳ đo" thì "Cần chú ý" phải có dòng "Đến kỳ đo" (trừ khi đã đủ 4 dòng đứng trước nó); ghi "Lần tới …" thì không có dòng đó. Ghi lại các dòng đang thấy.
8. `document.documentElement.scrollWidth <= window.innerWidth` là `true` trên cả hai trang thật.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả (2026-11-25, khung Browser trong app, 375×812, theme lúc mở là `night`):**

- **Step 2:** `tsc --noEmit` mã 0; `Test Files  182 passed (182)`, `Tests  1642 passed (1642)`. Các bước đỏ/xanh của Task 1 và Task 2 khớp số trong plan (7 đỏ / 1622 xanh; 181 file, 1629 test; `3 failed | 179 passed (182)`, 6 đỏ / 1629 xanh; 182 file, 1642 test). 5 patch áp sạch bằng `kb_patch`, không sửa tay.
- **Step 3:** `bun run build` lần đầu mã 1 (thông báo bảo mật của Next.js 16.4.3, không chạy `next upgrade`); lần hai mã 0, `✓ Generating static pages using 9 workers (40/40)`.
- **Mục 1 (trang tạm): đạt.** Bốn hàng đúng chữ và trạng thái: hàng 1 bật, hàng 2 "Đã đến kỳ đo" và tắt, hàng 3 "Nhắc đo ba tháng một lần", hàng 4 mờ và `disabled`. Mỗi thẻ 343×76 px; công tắc 51×31 px, mép phải ở 342 px, trong thẻ (mép phải thẻ 359 px). Tên hàng 3 rộng 197,1 px trong chỗ 198 px: **một dòng**, không cắt, không "…" (`text-overflow: clip`); ba hàng kia tên rộng 145 px.
- **Mục 2 (trang tạm): đạt.** Khối một: "Đến kỳ đo" / "Lần đo gần nhất 16/10" (chữ xám, icon thước), rồi "Ngủ ít hơn chuẩn", "Nằm sấp còn ít". Khối hai: "Đến kỳ đo" / "Chưa có lần đo nào".
- **Mục 3: đạt** (`scrollWidth` 375, `true`).
- **Mục 4: đạt** ở cả 7 theme (`night`, `rose`, `light`, `peach`, `lavender`, `sea`, `dark`; xem bằng ảnh chụp, không cuộn ngang ở theme nào): vòng tròn icon chuông, công tắc bật, tắt và đang khóa, chữ xám đều đọc rõ.
- **Mục 5 (trang thật `/tang-truong/chieu-cao`): đạt.** Thứ tự "Thói quen 7 ngày qua" → hàng nhắc đo → "Chiều cao lúc lớn phần lớn do di truyền…". Hàng ghi "Nhắc đo mỗi tháng" / "Lần tới 25/12 · 08:00", công tắc bật, không khóa, không có dòng báo lỗi. Trang `/tang-truong`: "Đo gần nhất 25/11 · 2 tháng 15 ngày" (hai lần đo 25/11 và 15/11); 25/11 cộng 30 ngày là 25/12, khớp.
- **Mục 6: đạt.** `/cai-dat`: "Nhắc đo định kỳ" bật (và "Cảnh báo tăng trưởng" bật), khớp công tắc của hàng nhắc đo. Chỉ nhìn, không gạt.
- **Mục 7: đạt cho trường hợp "Lần tới …".** `/suc-khoe`: "Cần chú ý" có hai dòng "Ngủ ít hơn chuẩn" (12,9 giờ mỗi ngày · nên 14–17 giờ) và "Nằm sấp còn ít" (2 phút mỗi ngày · nên từ 30 phút); không có dòng "Đến kỳ đo". Trường hợp "Đã đến kỳ đo" trên trang thật: **chưa kiểm** (dữ liệu thật chưa tới hạn; chỉ thấy trên trang tạm và trong test).
- **Mục 8: đạt** trên `/tang-truong/chieu-cao`, `/suc-khoe`, và cả `/tang-truong`, `/cai-dat`.
- Console của trình duyệt không có lỗi. `bun run dev` đã dừng; `.claude/launch.json` tạm đã xóa.
- **Chưa kiểm:** gạt công tắc của hàng nhắc đo trên trang thật (gạt là ghi tùy chọn thật) và việc nó đổi theo công tắc ở Cài đặt; dòng báo lỗi khi tải hoặc lưu tùy chọn lỗi (chỉ có trong test); trang thật ở các theme ngoài `night`; bề ngang 440 px; iPhone thật, PWA, VoiceOver; mọi mục của Bước 37.
- **Sửa sau lần kiểm:** không có. Không gặp lỗi nào của app; spec không đổi.

- [x] **Step 6: Xóa trang fixture, commit phần ghi kết quả**

```bash
rm -r app/fixture-height
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m5c.md
git commit -m "docs(plan): record the M5c check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 7: Đưa lên `main`**

Chỉ khi Step 2, 3 và 5 đều đạt và không còn lỗi đã biết:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m5c
git push origin main
git rev-parse --short main origin/main   # hai dòng phải giống nhau
```

Nếu `git merge --ff-only` không được vì `main` đã đổi, hoặc `git push` bị từ chối: `git checkout feat/kim-bun-suc-khoe-m5c && git rebase origin/main`, chạy lại Step 2, rồi thử lại. Không bao giờ force-push.

Báo cáo: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; lỗi nào đã sửa trong phiên; việc chỉ người dùng làm được (gạt thử công tắc, Bước 37 của checklist trên iPhone thật).
