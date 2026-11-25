# Kim Bun — Sức khỏe M4c: hai dòng thói quen của "Cần chú ý" Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§4 dòng 5 và 6; §7.1 phần "Cần chú ý"; §7.2; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng duyệt trước mọi plan còn lại của spec này: "duyệt hết, làm cho tới lúc xong và đẩy lên main, giữa chừng có bug gì thì fix luôn")

**Goal:** Mục "Cần chú ý" của trang Sức khỏe có thêm dòng "Ngủ ít hơn chuẩn" và "Nằm sấp còn ít" khi thói quen 7 ngày qua của bé còn thiếu.

**Architecture:**

- **Luật thuần:** `lib/rules/attention.ts` thêm `habitAttention(habits)` và `attentionItems` nhận thêm `habits`. Câu của từng dòng đã do `habitStats(...).attention` (M4a) tính sẵn; plan này không tính lại số nào.
- **Trang Sức khỏe:** `HealthScreen` tải bản ghi bằng `useStatsLogs` với đúng khóa truy vấn 14 ngày mà trang Chiều cao đang dùng (trang Thống kê cũng dùng khóa này khi chọn 14 ngày), nên các trang đó dùng chung một lần tải. Khối "Cần chú ý" tách ra thành `AttentionList` (HTML không đổi) để trang tạm của bước kiểm vẽ được nó.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m4c`, cắt từ `main` @ `2bde26a` (đã có M4a). Baseline: 1577 test vitest xanh (180 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                | Plan                                                                           |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------------ |
| M1, M2, M3, M4a    | §3, §4 dòng 1 đến 3, §5, §6, §7.1, §7.2 | đã xong, ở `main` @ `2bde26a`                                                  |
| **M4c (plan này)** | dòng 5 và 6 của §4 trên trang Sức khỏe  | file này                                                                       |
| M4b                | §7.3: dinh dưỡng theo giai đoạn         | chưa viết: đang chờ người dùng quyết các dòng mà nguồn không nói đúng như spec |
| M5                 | §8 Push, dòng 4 của §4, §9.3            | chưa viết                                                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M4c chạy trước M4b.** Hai plan không đụng file của nhau. M4b đang dừng ở bước đối chiếu nguồn của §7.3.
2. **Thứ tự và chỗ cắt.** Hai dòng thói quen đứng sau các dòng tăng trưởng và dòng tiêm chủng, giấc ngủ trước nằm sấp. Khi quá 4 dòng thì dòng đứng sau bị bỏ, nên dòng thói quen bị bỏ trước. Dòng 4 "Đến kỳ đo" (M5) sẽ chen vào giữa dòng tiêm chủng và dòng giấc ngủ.
3. **Chưa tải xong bản ghi** (đang tải, mất mạng, lỗi) thì không có dòng thói quen nào, không có khung chờ (§4, câu cuối).
4. **Số giờ của dòng giấc ngủ** là câu M4a đã tính: tối đa 1 chữ số thập phân, làm tròn xuống ("13,5 giờ mỗi ngày · nên 14–17 giờ").
5. **`habits` là trường bắt buộc của `attentionItems`** (giá trị `null` khi chưa tải), để trang nào gọi hàm này cũng phải nói rõ.
6. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Người dùng đã chọn khung Browser trong app cho mọi lần kiểm của ngày 2026-11-25 và nhắc lại khi duyệt: dùng khung Browser trong app ở 375×812, không hỏi lại.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m4c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ nhánh M4a @ `cb2cc96`. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang tạm của Task 3 đã qua `tsc --noEmit`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc.
- **Lên `main` không cần hỏi.** Người dùng đã cho phép trước (xem Status). Khi mọi bước kiểm xanh và không còn lỗi đã biết thì merge và push. Bước trình duyệt lộ ra lỗi thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan; **không đẩy một thay đổi còn lỗi đã biết**. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật, nhập mật khẩu) thì dừng lại và báo.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng sau M4a (đã ở `main` @ `2bde26a`). M5 sẽ thêm dòng 4 "Đến kỳ đo" vào `attentionItems`, giữa dòng tiêm chủng và dòng giấc ngủ.

**Consumes (đã ở `main`):** `habitStats`, `HabitStats` (`lib/rules/habits.ts`, M4a); `attentionItems`, `AttentionItem`, `growthAttention`, `vaccineAttention` (`lib/rules/attention.ts`); `useStatsLogs` (`lib/data/logs.ts`); `statsFetchSince` (`lib/rules/dailyStats.ts`); `vnDayRange` (`lib/rules/days.ts`); `ListGroup`, `ListRow`; `HealthScreen`.

**Produces:**

- `lib/rules/attention.ts`:
  - `habitAttention(habits: HabitStats["attention"] | null): AttentionItem[]` (khóa `sleep`, `tummy`);
  - `attentionItems(input: { growth; vaccine; habits: HabitStats["attention"] | null; today })`.
- `components/health/HealthScreen.tsx`: `AttentionList({ items: AttentionItem[] })` (export); `HealthScreen` gọi `useStatsLogs(baby.id, statsFetchSince(vnDayRange(now, 14)))`.
- **Vitest sau M4c:** 1593 test, 180 file.

---

### Task 1: Luật của hai dòng thói quen (§4 dòng 5, 6)

**Files:**

- Modify: `lib/rules/attention.ts`, `components/health/HealthScreen.tsx` (chỉ thêm `habits: null` để còn biên dịch được; Task 2 thay bằng số thật)
- Test: `lib/rules/attention.test.ts`

**Interfaces:**

- Consumes: `HabitStats` (M4a); `AttentionItem`, `growthAttention`, `vaccineAttention`.
- Produces: `habitAttention(habits)`; `attentionItems` nhận thêm `habits`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m4c
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/attention.test.ts b/lib/rules/attention.test.ts
index d429266..81b6da9 100644
--- a/lib/rules/attention.test.ts
+++ b/lib/rules/attention.test.ts
@@ -3,6 +3,7 @@ import {
   ATTENTION_MAX,
   attentionItems,
   growthAttention,
+  habitAttention,
   vaccineAttention,
   type AttentionItem,
 } from "./attention";
@@ -85,12 +86,18 @@ describe("vaccineAttention", () => {
 describe("attentionItems", () => {
   it("is empty when nothing needs attention", () => {
     expect(
-      attentionItems({ growth: null, vaccine: null, today: TODAY }),
+      attentionItems({
+        growth: null,
+        vaccine: null,
+        habits: null,
+        today: TODAY,
+      }),
     ).toEqual([]);
     expect(
       attentionItems({
         growth: [],
         vaccine: dose("later", "2027-06-14"),
+        habits: null,
         today: TODAY,
       }),
     ).toEqual([]);
@@ -100,6 +107,7 @@ describe("attentionItems", () => {
     const items = attentionItems({
       growth: null,
       vaccine: dose("overdue", "2026-11-10"),
+      habits: null,
       today: TODAY,
     });
     expect(items.map((item: AttentionItem) => item.title)).toEqual([
@@ -115,6 +123,7 @@ describe("attentionItems", () => {
     const items = attentionItems({
       growth: five,
       vaccine: dose("overdue", "2026-11-10"),
+      habits: null,
       today: TODAY,
     });
     expect(items).toHaveLength(4);
@@ -158,8 +167,84 @@ describe("growthAttention", () => {
     const items = attentionItems({
       growth: [alert("wfa", "yellow")],
       vaccine: dose("overdue", "2026-11-10"),
+      habits: null,
       today: TODAY,
     });
     expect(items.map((item) => item.key)).toEqual(["growth-wfa", "vaccine"]);
   });
 });
+
+// Spec 2026-11-25 §4, rows 5 and 6.
+describe("habitAttention", () => {
+  const SLEEP = "13,5 giờ mỗi ngày · nên 14–17 giờ";
+  const TUMMY = "15 phút mỗi ngày · nên từ 30 phút";
+
+  it("habits not worked out yet, or nothing short: no row", () => {
+    expect(habitAttention(null)).toEqual([]);
+    expect(habitAttention({ sleep: null, tummy: null })).toEqual([]);
+  });
+
+  it("sleep under the norm: Ngủ ít hơn chuẩn, in warn, opens Thống kê", () => {
+    expect(habitAttention({ sleep: SLEEP, tummy: null })).toEqual([
+      {
+        key: "sleep",
+        icon: "moon",
+        color: "cat-sleep",
+        title: "Ngủ ít hơn chuẩn",
+        detail: SLEEP,
+        tone: "warn",
+        href: "/thong-ke",
+      },
+    ]);
+  });
+
+  it("tummy time short: Nằm sấp còn ít, in warn, opens the Chiều cao page", () => {
+    expect(habitAttention({ sleep: null, tummy: TUMMY })).toEqual([
+      {
+        key: "tummy",
+        icon: "smile",
+        color: "cat-tummy",
+        title: "Nằm sấp còn ít",
+        detail: TUMMY,
+        tone: "warn",
+        href: "/tang-truong/chieu-cao",
+      },
+    ]);
+  });
+
+  it("both short: sleep first", () => {
+    expect(
+      habitAttention({ sleep: SLEEP, tummy: TUMMY }).map((item) => item.key),
+    ).toEqual(["sleep", "tummy"]);
+  });
+
+  it("habit rows come after the growth rows and the vaccine row", () => {
+    const items = attentionItems({
+      growth: [alert("wfa", "yellow")],
+      vaccine: dose("overdue", "2026-11-10"),
+      habits: { sleep: SLEEP, tummy: TUMMY },
+      today: TODAY,
+    });
+    expect(items.map((item) => item.key)).toEqual([
+      "growth-wfa",
+      "vaccine",
+      "sleep",
+      "tummy",
+    ]);
+  });
+
+  it("the cut at four rows drops the habit rows first", () => {
+    const items = attentionItems({
+      growth: [alert("wfa", "red"), alert("lhfa", "yellow")],
+      vaccine: dose("overdue", "2026-11-10"),
+      habits: { sleep: SLEEP, tummy: TUMMY },
+      today: TODAY,
+    });
+    expect(items.map((item) => item.key)).toEqual([
+      "growth-wfa",
+      "growth-lhfa",
+      "vaccine",
+      "sleep",
+    ]);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 179 passed (180)`, `Tests  6 failed | 1577 passed (1583)`. Lý do đỏ: chưa có `habitAttention`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/health/HealthScreen.tsx b/components/health/HealthScreen.tsx
index 932bd32..7994c2d 100644
--- a/components/health/HealthScreen.tsx
+++ b/components/health/HealthScreen.tsx
@@ -199,7 +199,12 @@ export function HealthScreen({ baby }: { baby: Baby }) {
         table: measured.tables.lhfa,
       })
     : null;
-  const attention = attentionItems({ growth: alerts, vaccine: next, today });
+  const attention = attentionItems({
+    growth: alerts,
+    vaccine: next,
+    habits: null,
+    today,
+  });
   const live: Partial<Record<string, LiveLine>> = {
     "/tiem-chung": {
       text: vaccineCardText(next),
diff --git a/lib/rules/attention.ts b/lib/rules/attention.ts
index 96f5734..db07347 100644
--- a/lib/rules/attention.ts
+++ b/lib/rules/attention.ts
@@ -2,6 +2,7 @@ import type { CategoryToken } from "@/lib/ui/categories";
 import type { IconName } from "@/lib/ui/icons";
 import { formatDayShort, vnDayStartMs } from "./days";
 import { alertTone, type GrowthAlert } from "./growthAlerts";
+import type { HabitStats } from "./habits";
 import type { ScheduleItem } from "./vaccines";

 export type AttentionTone = "normal" | "warn" | "danger";
@@ -71,16 +72,48 @@ export function growthAttention(alerts: GrowthAlert[] | null): AttentionItem[] {
   }));
 }

+// Rows 5 and 6 of the table: `habits` is what habitStats worked out, the
+// detail of each row or null. null: the logs have not loaded yet.
+export function habitAttention(
+  habits: HabitStats["attention"] | null,
+): AttentionItem[] {
+  if (habits === null) return [];
+  const rows: AttentionItem[] = [];
+  if (habits.sleep !== null)
+    rows.push({
+      key: "sleep",
+      icon: "moon",
+      color: "cat-sleep",
+      title: "Ngủ ít hơn chuẩn",
+      detail: habits.sleep,
+      tone: "warn",
+      href: "/thong-ke",
+    });
+  if (habits.tummy !== null)
+    rows.push({
+      key: "tummy",
+      icon: "smile",
+      color: "cat-tummy",
+      title: "Nằm sấp còn ít",
+      detail: habits.tummy,
+      tone: "warn",
+      href: "/tang-truong/chieu-cao",
+    });
+  return rows;
+}
+
 // The rows in priority order, at most ATTENTION_MAX. A source whose data has
 // not loaded is passed as null and gives no row.
 export function attentionItems(input: {
   growth: GrowthAlert[] | null;
   vaccine: ScheduleItem | null;
+  habits: HabitStats["attention"] | null;
   today: string;
 }): AttentionItem[] {
   const rows = [
     ...growthAttention(input.growth),
     vaccineAttention(input.vaccine, input.today),
+    ...habitAttention(input.habits),
   ];
   return rows
     .filter((row): row is AttentionItem => row !== null)
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  180 passed (180)`, `Tests  1583 passed (1583)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/attention.ts lib/rules/attention.test.ts components/health/HealthScreen.tsx
git commit -m "feat(attention): rows for short sleep and short tummy time" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Trang Sức khỏe hiện hai dòng thói quen (§4, §7.2)

**Files:**

- Modify: `components/health/HealthScreen.tsx`
- Test: `components/health/health.test.tsx`

**Interfaces:**

- Consumes: `habitAttention`, `attentionItems` (Task 1); `habitStats` (M4a); `useStatsLogs`, `statsFetchSince`, `vnDayRange`.
- Produces: `AttentionList({ items })`; `HealthScreen` tải bản ghi 14 ngày và đưa `habitStats(...).attention` vào `attentionItems`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/health/health.test.tsx b/components/health/health.test.tsx
index 2275b21..a8878b3 100644
--- a/components/health/health.test.tsx
+++ b/components/health/health.test.tsx
@@ -8,6 +8,9 @@ import {
   HEALTH_STATS,
   TOOLS,
 } from "@/lib/nav";
+import { statsFetchSince } from "@/lib/rules/dailyStats";
+import { addDays, vnDayRange } from "@/lib/rules/days";
+import type { LogLike } from "@/lib/rules/describeLog";
 import type { Baby, GrowthRow, VaccineDoseRow } from "@/lib/supabase/rows";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { HealthScreen } from "./HealthScreen";
@@ -16,10 +19,12 @@ const state = vi.hoisted(() => ({
   growth: {} as Record<string, unknown>,
   doses: {} as Record<string, unknown>,
   tables: {} as Record<string, unknown>,
+  logs: {} as Record<string, unknown>,
 }));
 const useGrowth = vi.hoisted(() => vi.fn());
 const useWhoTable = vi.hoisted(() => vi.fn());
 const useVaccineDoses = vi.hoisted(() => vi.fn());
+const useStatsLogs = vi.hoisted(() => vi.fn());
 // Four doses: one at birth, two at two months (one of them in a group), one late.
 const content = vi.hoisted(() => {
   const base = {
@@ -87,6 +92,7 @@ const content = vi.hoisted(() => {
 vi.mock("@/lib/content/vaccines", () => ({ VACCINES: content }));
 vi.mock("@/lib/data/growth", () => ({ useGrowth, useWhoTable }));
 vi.mock("@/lib/data/vaccines", () => ({ useVaccineDoses }));
+vi.mock("@/lib/data/logs", () => ({ useStatsLogs }));

 const LOADING = {
   data: undefined,
@@ -154,13 +160,19 @@ const done = (code: string) =>
   }) as VaccineDoseRow;

 function render(
-  query: { growth?: unknown; doses?: unknown; tables?: boolean } = {},
+  query: {
+    growth?: unknown;
+    doses?: unknown;
+    tables?: boolean;
+    logs?: unknown;
+  } = {},
   dob = "2026-09-14",
   target: number | null = null,
 ) {
   state.growth = (query.growth ?? LOADING) as Record<string, unknown>;
   state.doses = (query.doses ?? LOADING) as Record<string, unknown>;
   state.tables = query.tables ? TABLES : {};
+  state.logs = (query.logs ?? LOADING) as Record<string, unknown>;
   const baby = {
     id: "b1",
     family_id: "f1",
@@ -187,6 +199,7 @@ beforeAll(() => {
     (indicator: string) => state.tables[indicator] ?? LOADING,
   );
   useVaccineDoses.mockImplementation(() => state.doses);
+  useStatsLogs.mockImplementation(() => state.logs);
   vi.useFakeTimers({ toFake: ["Date"] });
   vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
 });
@@ -292,6 +305,90 @@ describe("HealthScreen: Cần chú ý", () => {
   });
 });

+// Spec 2026-11-25 §4, rows 5 and 6. "Now" is noon on 20/11 in Việt Nam, so
+// the habits read 13/11 to 19/11; the baby is 67 days old (sleep 14–17 hours).
+describe("HealthScreen: habits in Cần chú ý", () => {
+  // One log a day over the seven days, from 02:00 Việt Nam time.
+  const everyDay = (type: "sleep" | "tummy", minutes: number): LogLike[] =>
+    Array.from({ length: 7 }, (_, i) => {
+      const start = Date.parse(
+        `${addDays("2026-11-20", i - 7)}T02:00:00+07:00`,
+      );
+      return {
+        type,
+        started_at: new Date(start).toISOString(),
+        ended_at: new Date(start + minutes * 60_000).toISOString(),
+        details: {},
+      };
+    });
+  const SHORT = [...everyDay("sleep", 13 * 60 + 30), ...everyDay("tummy", 15)];
+
+  it("reads the logs of the last 14 days, the query the Thống kê page already uses", () => {
+    useStatsLogs.mockClear();
+    render();
+    expect(useStatsLogs).toHaveBeenCalledExactlyOnceWith(
+      "b1",
+      statsFetchSince(vnDayRange(new Date("2026-11-20T05:00:00Z"), 14)),
+    );
+  });
+
+  it.each([
+    ["loading", LOADING],
+    ["offline", OFFLINE],
+    ["after an error", FAILED],
+    ["nothing logged", loaded([])],
+  ])("logs %s: no habit row", (_, q) => {
+    expect(render({ logs: q })).not.toContain("Cần chú ý");
+  });
+
+  it("sleep under the norm: a warn row that opens Thống kê", () => {
+    const page = render({ logs: loaded(everyDay("sleep", 13 * 60 + 30)) });
+    expect(page.indexOf(">Cần chú ý<")).toBeLessThan(
+      page.indexOf(">Theo dõi<"),
+    );
+    const row = link(page, "/thong-ke");
+    expect(row).toContain(">Ngủ ít hơn chuẩn</span>");
+    expect(row).toContain(
+      '<span class="text-[13px] font-semibold text-warn">13,5 giờ mỗi ngày · nên 14–17 giờ</span>',
+    );
+    expect(row).toContain(`d="${ICON_PATHS.moon}"`);
+    expect(page).not.toContain("Nằm sấp còn ít");
+  });
+
+  it("tummy time short: a warn row that opens the Chiều cao page", () => {
+    const page = render({ logs: loaded(everyDay("tummy", 15)) });
+    const row = link(page, "/tang-truong/chieu-cao");
+    expect(row).toContain(">Nằm sấp còn ít</span>");
+    expect(row).toContain(
+      '<span class="text-[13px] font-semibold text-warn">15 phút mỗi ngày · nên từ 30 phút</span>',
+    );
+    expect(row).toContain(`d="${ICON_PATHS.smile}"`);
+    expect(page).not.toContain("Ngủ ít hơn chuẩn");
+  });
+
+  it("enough sleep and tummy time: no row", () => {
+    const logs = [...everyDay("sleep", 15 * 60), ...everyDay("tummy", 40)];
+    expect(render({ logs: loaded(logs) })).not.toContain("Cần chú ý");
+  });
+
+  it("the habit rows come after the vaccine row, sleep before tummy time", () => {
+    const page = render({ doses: loaded([]), logs: loaded(SHORT) });
+    const order = [
+      ">Quá hạn: Lao (BCG)<",
+      ">Ngủ ít hơn chuẩn<",
+      ">Nằm sấp còn ít<",
+      ">Theo dõi<",
+    ].map((text) => page.indexOf(text));
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+  });
+
+  it("a child of one year or more has no tummy row", () => {
+    const page = render({ logs: loaded(SHORT) }, "2025-11-20");
+    expect(page).not.toContain("Nằm sấp còn ít");
+  });
+});
+
 describe("HealthScreen: the Tăng trưởng card", () => {
   it.each([
     ["loading", LOADING],
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 179 passed (180)`, `Tests  4 failed | 1589 passed (1593)`. Lý do đỏ: trang chưa gọi `useStatsLogs` và chưa có hai dòng thói quen.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/health/HealthScreen.tsx b/components/health/HealthScreen.tsx
index 7994c2d..deb09fd 100644
--- a/components/health/HealthScreen.tsx
+++ b/components/health/HealthScreen.tsx
@@ -9,6 +9,7 @@ import { StatusChip } from "@/components/ui/StatusChip";
 import { VACCINES } from "@/lib/content/vaccines";
 import { type LmsRow, whoSex } from "@/lib/content/who";
 import { useGrowth, useWhoTable } from "@/lib/data/growth";
+import { useStatsLogs } from "@/lib/data/logs";
 import { useVaccineDoses } from "@/lib/data/vaccines";
 import {
   HEALTH_CARDS,
@@ -17,8 +18,9 @@ import {
   HEALTH_SICK,
   HEALTH_STATS,
 } from "@/lib/nav";
-import { attentionItems } from "@/lib/rules/attention";
-import { formatDayShort } from "@/lib/rules/days";
+import { type AttentionItem, attentionItems } from "@/lib/rules/attention";
+import { statsFetchSince } from "@/lib/rules/dailyStats";
+import { formatDayShort, vnDayRange } from "@/lib/rules/days";
 import {
   growthAlerts,
   growthStatus,
@@ -31,6 +33,7 @@ import {
   latestGrowth,
 } from "@/lib/rules/growthForm";
 import { indicatorSummaries } from "@/lib/rules/growthView";
+import { habitStats } from "@/lib/rules/habits";
 import { goalLine } from "@/lib/rules/heightView";
 import { vnDateString } from "@/lib/rules/time";
 import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
@@ -138,10 +141,40 @@ export function GrowthCard({
   );
 }

+// Spec 2026-11-25 §4. Exported for the temporary fixture pages of the browser
+// checks.
+export function AttentionList({ items }: { items: AttentionItem[] }) {
+  return (
+    <section className="flex flex-col gap-2.5">
+      <SectionTitle>Cần chú ý</SectionTitle>
+      <ListGroup>
+        {items.map((item) => (
+          <ListRow
+            key={item.key}
+            label={item.title}
+            detail={item.detail}
+            detailTone={item.tone === "normal" ? "muted" : item.tone}
+            icon={item.icon}
+            iconColor={item.color}
+            href={item.href}
+          />
+        ))}
+      </ListGroup>
+    </section>
+  );
+}
+
 export function HealthScreen({ baby }: { baby: Baby }) {
   const growth = useGrowth(baby.id);
   const doses = useVaccineDoses(baby.id);
-  const today = vnDateString(new Date());
+  const now = new Date();
+  const today = vnDateString(now);
+  // Spec §7.2: the 14-day query of the Thống kê page, shared through its
+  // cache. Until it has loaded there is no habit row.
+  const logs = useStatsLogs(baby.id, statsFetchSince(vnDayRange(now, 14)));
+  const habits = logs.data
+    ? habitStats(logs.data, baby.dob, now).attention
+    : null;
   // No data yet (loading, offline, error): no row and the static description.
   const next = doses.data
     ? nextDose(
@@ -202,7 +235,7 @@ export function HealthScreen({ baby }: { baby: Baby }) {
   const attention = attentionItems({
     growth: alerts,
     vaccine: next,
-    habits: null,
+    habits,
     today,
   });
   const live: Partial<Record<string, LiveLine>> = {
@@ -216,24 +249,7 @@ export function HealthScreen({ baby }: { baby: Baby }) {
     <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
       <PageHeader title="Sức khỏe" />

-      {attention.length > 0 && (
-        <section className="flex flex-col gap-2.5">
-          <SectionTitle>Cần chú ý</SectionTitle>
-          <ListGroup>
-            {attention.map((item) => (
-              <ListRow
-                key={item.key}
-                label={item.title}
-                detail={item.detail}
-                detailTone={item.tone === "normal" ? "muted" : item.tone}
-                icon={item.icon}
-                iconColor={item.color}
-                href={item.href}
-              />
-            ))}
-          </ListGroup>
-        </section>
-      )}
+      {attention.length > 0 && <AttentionList items={attention} />}

       <section className="flex flex-col gap-2.5">
         <SectionTitle>Theo dõi</SectionTitle>
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  180 passed (180)`, `Tests  1593 passed (1593)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/health/HealthScreen.tsx components/health/health.test.tsx
git commit -m "feat(health): the Sức khỏe page lists short sleep and short tummy time" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M4c rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-health/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M4c.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  180 passed (180)`, `Tests  1593 passed (1593)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm cho các trạng thái dữ liệu thật không có**

Trang này không đọc hay ghi dữ liệu của gia đình; nó dựng khối "Cần chú ý" từ các dòng cho sẵn. Tạo `app/fixture-health/page.tsx`:

```tsx
"use client";

import { AttentionList } from "@/components/health/HealthScreen";
import { type AttentionItem, habitAttention } from "@/lib/rules/attention";

const HABITS = habitAttention({
  sleep: "13,5 giờ mỗi ngày · nên 14–17 giờ",
  tummy: "15 phút mỗi ngày · nên từ 30 phút",
});
// Hai dòng mẫu của các nguồn đã có từ M1 và M2, để thấy đủ bốn dòng.
const GROWTH: AttentionItem = {
  key: "growth-wfa",
  icon: "ruler",
  color: "cat-tummy",
  title: "Cân nặng thấp hơn chuẩn",
  detail: "Nên hỏi bác sĩ ở lần khám tới.",
  tone: "warn",
  href: "/tang-truong",
};
const VACCINE: AttentionItem = {
  key: "vaccine",
  icon: "syringe",
  color: "cat-temp",
  title: "6 trong 1 mũi 2",
  detail: "Hẹn 09/12 · còn 14 ngày",
  tone: "normal",
  href: "/tiem-chung",
};

// Ba bộ: 1 chỉ hai dòng thói quen · 2 đủ bốn dòng · 3 chỉ giấc ngủ, số lẻ dài nhất.
const SETS: AttentionItem[][] = [
  HABITS,
  [GROWTH, VACCINE, ...HABITS],
  habitAttention({
    sleep: "11,9 giờ mỗi ngày · nên 12–15 giờ",
    tummy: null,
  }),
];

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture hai dòng thói quen của Cần chú ý</p>
      {SETS.map((items, index) => (
        <AttentionList key={index} items={items} />
      ))}
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Dùng khung Browser trong app, cỡ 375×812 (xem Diễn giải spec, mục 6). Chạy `bun run dev`.

Trên trang tạm `http://localhost:3000/fixture-health` (ba khối, mỗi khối có tiêu đề "Cần chú ý"):

1. **Khối 1:** hai dòng. "Ngủ ít hơn chuẩn" có icon mặt trăng trong ô màu của giấc ngủ; dòng dưới "13,5 giờ mỗi ngày · nên 14–17 giờ" màu cảnh báo, đậm. "Nằm sấp còn ít" có icon mặt cười; dòng dưới "15 phút mỗi ngày · nên từ 30 phút" màu cảnh báo, đậm. Mỗi dòng có mũi tên phải. Dòng dưới của mỗi hàng nằm trên **một** dòng; dùng `getBoundingClientRect()` ghi lại bề ngang của dòng dài nhất và bề ngang chỗ dành cho nó. Xuống hai dòng thì ghi lại; quá hai dòng là lỗi.
2. **Khối 2:** đủ bốn dòng, theo thứ tự: dòng tăng trưởng, dòng tiêm chủng (chữ xám, không cảnh báo), "Ngủ ít hơn chuẩn", "Nằm sấp còn ít".
3. **Khối 3:** chỉ một dòng "Ngủ ít hơn chuẩn" với "11,9 giờ mỗi ngày · nên 12–15 giờ".
4. Bấm dòng "Ngủ ít hơn chuẩn" mở `/thong-ke`; quay lại, bấm "Nằm sấp còn ít" mở `/tang-truong/chieu-cao`. Hai trang đó chỉ xem.
5. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
6. Lặp mục 1 và 2 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"peach"`, `"lavender"`, `"sea"`, `"dark"`, `"night"`: chữ cảnh báo đọc rõ trên nền thẻ ở cả bảy theme.

Trang thật `http://localhost:3000/suc-khoe` (dữ liệu thật của gia đình: chỉ xem):

7. Ghi lại khối "Cần chú ý" đang có những dòng nào (hoặc không có khối). Đối chiếu với trang `http://localhost:3000/tang-truong/chieu-cao`, khối "Thói quen 7 ngày qua": hàng Giấc ngủ có chip "Ít hơn chuẩn" thì trang Sức khỏe phải có dòng "Ngủ ít hơn chuẩn", không thì không; hàng Nằm sấp có chip "Còn thiếu" thì phải có dòng "Nằm sấp còn ít", không thì không. Số giờ, số phút của hai trang phải khớp (dòng giấc ngủ ở trang Sức khỏe viết theo giờ lẻ một chữ số, làm tròn xuống).
8. Các khối khác của trang Sức khỏe (thẻ Tăng trưởng, Tiêm chủng, Phát triển, Thống kê, Khi bé ốm) không đổi so với trước.
9. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả thực thi (2026-11-25, tối, giờ Việt Nam)**

Bốn patch áp sạch bằng `kb_patch`, không sửa tay. Số đo khớp plan: Task 1 đỏ `1 failed | 179 passed (180)`, `6 failed | 1577 passed (1583)`, xanh 180 / 1583; Task 2 đỏ `1 failed | 179 passed (180)`, `4 failed | 1589 passed (1593)`, xanh 180 / 1593. Step 1: `tsc --noEmit` sạch, `Test Files  180 passed (180)`, `Tests  1593 passed (1593)`. Step 2: `bun run build` lần đầu mã 1 (thông báo bảo mật của Next.js 16.4.3; không chạy `next upgrade`), lần hai mã 0, 40/40 trang.

Trình duyệt: khung Browser trong app, 375×812, DPR 2, mở bằng `navigate` (không cần `launch.json`), đang đăng nhập sẵn. App mở ở theme `night` (sau 21 giờ); các theme khác giữ bằng một `MutationObserver` trong trang, không lưu.

Trang tạm `/fixture-health`:

1. **Đạt.** Khối 1 có hai dòng, mỗi dòng có icon trong ô màu (mặt trăng `bg-cat-sleep`, mặt cười `bg-cat-tummy`), dòng dưới màu cảnh báo, đậm 600, có mũi tên phải 16 px. Hàng cao 55,5 px. Dòng dưới dài nhất "15 phút mỗi ngày · nên từ 30 phút" rộng 211,7 px trong chỗ 239 px: một dòng. "13,5 giờ mỗi ngày · nên 14–17 giờ" rộng 207,5 px. Tiêu đề dài nhất của trang tạm ("Cân nặng thấp hơn chuẩn") 185,6 px: một dòng.
2. **Đạt.** Khối 2 đủ bốn dòng, đúng thứ tự: dòng tăng trưởng, dòng tiêm chủng (chữ `text-muted`, đậm 400), "Ngủ ít hơn chuẩn", "Nằm sấp còn ít".
3. **Đạt.** Khối 3 một dòng "Ngủ ít hơn chuẩn" với "11,9 giờ mỗi ngày · nên 12–15 giờ" (205,8 px, một dòng).
4. **Đạt.** Bấm "Ngủ ít hơn chuẩn" mở `/thong-ke` (tiêu đề "Thống kê"); bấm "Nằm sấp còn ít" mở `/tang-truong/chieu-cao`. Hai trang đó chỉ xem, không bấm gì thêm.
5. **Đạt.** `scrollWidth` 375 = `innerWidth` 375.
6. **Đạt.** Cả bảy theme: mọi dòng một dòng, không tràn ngang. Tỉ lệ tương phản của chữ cảnh báo trên nền thẻ (ước lượng: màu nền của thẻ chồng lên nền trắng, không tính lớp mờ của kính): `rose` 5,91; `light` 5,55; `peach` 5,92; `lavender` 5,98; `sea` 6,13; `dark` 10,42; `night` 6,94. Đã chụp `night`, `rose`, `dark`, `light`; `peach`, `lavender`, `sea` chỉ đo màu. Ở `night` chữ cảnh báo cùng màu với tiêu đề (theme này một màu), chỉ khác độ đậm và cỡ chữ; các dòng tăng trưởng có từ M2 cũng vậy.

Đo thêm ngoài danh sách (trang tạm): ở 390, 393, 430 và 440 px mọi dòng vẫn một dòng, không tràn ngang (chỗ cho chữ 254, 257, 294, 304 px).

Trang thật `/suc-khoe` (chỉ xem; không bấm Lưu, không đụng đồng hồ hay công tắc):

7. **Đạt.** Khối "Cần chú ý" có đúng hai dòng: "Ngủ ít hơn chuẩn" với "12,9 giờ mỗi ngày · nên 14–17 giờ" (mở `/thong-ke`) và "Nằm sấp còn ít" với "2 phút mỗi ngày · nên từ 30 phút" (mở `/tang-truong/chieu-cao`). Không có dòng tăng trưởng hay tiêm chủng. Trang Chiều cao cùng lúc: Giấc ngủ "12 giờ 56 phút mỗi ngày · nên 14–17 giờ", chip "Ít hơn chuẩn" (776 phút = 12,93 giờ, làm tròn xuống 12,9: khớp); Nằm sấp "2 phút mỗi ngày · nên từ 30 phút", chip "Còn thiếu" (khớp); Vitamin D "Đều", không có dòng nào trên trang Sức khỏe (đúng spec). Dòng dưới 207,6 và 205 px trong chỗ 239 px, một dòng. Đã xem ở `night` và `rose`.
8. **Đạt, theo chữ đọc được.** Thẻ Tăng trưởng ("Đo gần nhất 25/11", "Gần mức thấp", 5,7 kg, 56,9 cm, "—", "Mục tiêu 180 cm: dưới đường mục tiêu 4,0 cm"), Tiêm chủng ("12/12 · 6 trong 1 mũi 2"), Phát triển, Thống kê và mục "Khi bé ốm" hiện đủ, đúng chỗ. Không có ảnh chụp trước M4c để so từng điểm ảnh; Patch 4 không đụng các khối đó.
9. **Đạt.** `scrollWidth` 375 = `innerWidth` 375. Console không có lỗi.

Chưa kiểm: trạng thái đang tải, mất mạng và lỗi tải bản ghi trên trang thật (chỉ có test); chỗ cắt ở bốn dòng trên dữ liệu thật (dữ liệu thật đang có hai dòng; đã thấy bốn dòng trên trang tạm, chỗ cắt chỉ có test); bé từ 1 tuổi trên dữ liệu thật; việc trang Sức khỏe và trang Thống kê dùng chung một lần tải (chỉ có test về khóa truy vấn, chưa đếm request); phía thành viên; trình đọc màn hình; iPhone thật, PWA.

Dọn: dev đã dừng (cổng 3000 trống); `app/fixture-health` đã xóa; `.next/dev/types` đã xóa sau khi typecheck đỏ vì nó, chạy lại sạch; khung Browser đã đóng. Sau khi dọn: `tsc --noEmit` sạch, `Tests  1593 passed (1593)`.

**Sửa sau lần kiểm:** không có. Bước trình duyệt không lộ ra lỗi nào; spec không đổi.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả**

```bash
rm -r app/fixture-health
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m4c.md
git commit -m "docs(plan): record the M4c check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 6: Đưa lên `main`**

Chỉ khi Step 1, 2 và 4 đều đạt và không còn lỗi đã biết (lỗi tìm thấy ở Step 4 phải được sửa, có test, và ghi vào plan trước):

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m4c
git push origin main
git rev-parse --short main origin/main   # hai dòng phải giống nhau
```

Báo cáo: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; lỗi nào đã sửa trong phiên.
