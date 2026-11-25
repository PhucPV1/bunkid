# Kim Bun — Sức khỏe M2a: luật cảnh báo tăng trưởng và cảnh báo trên trang Sức khỏe Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§5.1, §5.2; chip của thẻ Tăng trưởng ở §3.4; §4 dòng 1; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng: "Duyệt năm plan"; chưa có lệnh chạy, mỗi lần lên `main` vẫn phải hỏi)

**Goal:** App biết khi nào một lần đo lệch chuẩn hoặc đi lệch hướng, nói điều đó bằng lời, và hiện ngay trên trang Sức khỏe: chip trạng thái trên thẻ Tăng trưởng và một dòng trong "Cần chú ý" cho mỗi cảnh báo.

**Architecture:**

- **Luật thuần:** `lib/rules/growthAlerts.ts` (đọc số đo theo bảng WHO, chọn tối đa một cảnh báo cho mỗi chỉ số, viết chữ của cảnh báo) và `comparePhrase` trong `lib/rules/growthForm.ts`.
- **Trang Sức khỏe:** `HealthScreen` tải thêm 3 bảng WHO bằng `useWhoTable` có sẵn, gọi `growthAlerts`, rồi đưa kết quả vào `attentionItems` và chip `StatusChip` trên thẻ Tăng trưởng.
- Màn Tăng trưởng chưa đổi ở plan này. Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m2a`, cắt từ `main` @ `5ecc02c`. Baseline: 1201 test vitest xanh (165 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                                        | Plan                                           |
| ------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| M1a, M1b, M1c      | §3, §4 dòng 2 và 3                                                              | đã xong, đã lên `main` @ `5ecc02c`             |
| **M2a (plan này)** | §5.1 luật cảnh báo, §5.2 câu so sánh; chip và dòng 1 của §4 trên trang Sức khỏe | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md` |
| M2b                | §5.3: luật và khối giao diện của thẻ kết luận, thẻ cảnh báo; popup              | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2b.md` |
| M2c                | §5.3: màn Tăng trưởng mở đầu bằng cảnh báo và kết luận                          | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2c.md` |
| M2d                | §5.4 biểu đồ                                                                    | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2d.md` |
| M2e                | §5.5 các lần đo; xóa `formatZ`                                                  | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2e.md` |
| M3                 | §6 Chiều cao, thẻ mục tiêu của §5.3                                             | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4                                  | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                                                    | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M2 chia năm plan.** Spec §10 ghi M2 là một mốc. Bản dựng thử cho thấy M2 dài quá một plan, nên cắt ở năm chỗ app vẫn chạy trọn vẹn: M2a có luật cảnh báo và đưa cảnh báo lên trang Sức khỏe; M2b thêm luật và khối giao diện của thẻ kết luận, thẻ cảnh báo (màn hình chưa đổi); M2c ghép chúng vào màn Tăng trưởng (biểu đồ và danh sách còn kiểu cũ); M2d đổi biểu đồ; M2e đổi danh sách các lần đo.
2. **Ngưỡng 1,33 được so với dung sai 1e-9.** z là kết quả phép chia số thực; không có dung sai thì một độ lệch đúng 1,33 có thể ra 1,3299999 và trượt ngưỡng. Các ngưỡng ±2 và ±3 so trực tiếp như `rateZ` đang làm.
3. **`falling` hoặc `rising` mà số đo không tăng** (cân nặng tăng ≤ 0 g, hoặc chiều dài, vòng đầu tăng ≤ 0 cm so với lần so sánh): nội dung chỉ còn câu `{giá trị} lúc {tuổi}.` mà §5.1 đã cho làm câu dự phòng, vì câu chính của spec viết "tăng".
4. **Trang Sức khỏe chờ đủ cả 3 bảng WHO** rồi mới tính cảnh báo và hiện chip, để chip không hiện "Lớn đều" rồi đổi khi bảng thứ ba về. Màn Tăng trưởng (M2c) thì tính theo từng bảng như §5.1 ghi.
5. **Hai lần đo cùng ngày:** lần có `created_at` muộn hơn là lần gần nhất; dòng không có `created_at` giữ thứ tự được đưa vào (query trả hàng tạo sau trước).
6. **`comparePhrase` nhận `sex` là `"boys"` hoặc `"girls"`** (kiểu `WhoSex` các màn đang dùng), không phải `"male"`/`"female"`.
7. **Dòng "Cần chú ý" của tăng trưởng** có `key` là `growth-{chỉ số}`, icon `ruler`, màu `cat-tummy`, dùng `ListRow` như M1 (ô icon 30 px).
8. **`{Δ}` của `loss` và `falling` cân nặng** là gam nguyên; `{a}` và `{e}` làm tròn gam nguyên mỗi ngày.
9. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề và nội dung thẻ cảnh báo, câu so sánh dưới thanh vị trí, các đoạn chú thích `text-muted`, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), các dòng dinh dưỡng.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay dừng đồng hồ, không bật tắt công tắc. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Tải file từ `cdn.who.int` (§6.2) cần người dùng đồng ý trước khi chạy.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 1153 test vitest, pgTAP 001–013, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `5ecc02c` và nối tiếp các plan trước của mốc M2; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn hoặc `var(--color-…)`. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 4 dừng lại hỏi, không tự push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.

## Contracts with Other Plans

Plan này đứng sau M1c (đã lên `main`). Các plan M2b đến M2e dùng mọi thứ dưới đây.

**Consumes (từ M1, đã ở `main`):** `attentionItems`, `vaccineAttention`, `AttentionItem` (`lib/rules/attention.ts`); `HealthScreen`; `ListRow.detailTone`; `latestGrowth`. Từ code có sẵn: `ageOnDay`, `lmsAt`, `zScore`, `percentile` (`lib/rules/growth.ts`); `formatGrowthValue`, `indicatorValue`, `INDICATORS`; `formatAgeVi`; `formatDayShort`; `useWhoTable`, `whoSex`.

**Produces:**

- `lib/rules/growthForm.ts`: `sexLabel(sex: WhoSex): string`, `comparePhrase(indicator: WhoIndicator, percentile: number, sex: WhoSex, ageDays: number): string`.
- `lib/rules/growthAlerts.ts`:
  - kiểu `GrowthAlertKind = "veryLow" | "veryHigh" | "loss" | "falling" | "rising" | "low" | "high"`, `GrowthAlertLevel = "yellow" | "red"`, `GrowthTone = "good" | "warn" | "danger"`;
  - `GrowthAlert = { indicator; kind; level; title; body; advice; chip; measuredOn: string; previousPercentile: number | null }`;
  - `GrowthTables = Partial<Record<WhoIndicator, LmsRow[]>>`, `GrowthMeasure = GrowthInput & { created_at?: string | null }`, `Reading = { day; ageDays; value; z; median }`;
  - `readings(rows, table, dob, indicator): Reading[]` (mới nhất trước), `positionKind(z)`, `ALERT_CHIP`, hằng `SHIFT_Z`, `COMPARE_MIN_DAYS`, `COMPARE_MAX_DAYS`, `LOSS_MIN_AGE_DAYS`;
  - `growthAlerts(input: { rows: GrowthMeasure[]; tables: GrowthTables; dob: string; sex: WhoSex; babyName: string }): GrowthAlert[]` (đỏ trước, rồi cân nặng, chiều dài, vòng đầu);
  - `alertTone(level): "warn" | "danger"`, `growthStatus(alerts): { text: string; tone: GrowthTone }`.
- `lib/rules/attention.ts`: `growthAttention(alerts: GrowthAlert[] | null): AttentionItem[]`; `attentionItems` nhận thêm trường bắt buộc `growth: GrowthAlert[] | null`.
- `components/ui/StatusChip.tsx`: `StatusChip({ tone: "good" | "warn" | "danger" | "neutral"; children: string })`.
- `HealthScreen` gọi `useWhoTable` 3 lần (`wfa`, `lhfa`, `hcfa`).
- **Vitest sau M2a:** 1251 test, 168 file.

---

### Task 1: Câu so sánh bằng lời (§5.2)

**Files:**

- Modify: `lib/rules/growthForm.ts`
- Test: `lib/rules/comparePhrase.test.ts` (mới)

**Interfaces:**

- Consumes: `WhoIndicator`, `WhoSex` (`lib/content/who.ts`).
- Produces: `sexLabel(sex)`, `comparePhrase(indicator, percentile, sex, ageDays)`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m2a
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/comparePhrase.test.ts b/lib/rules/comparePhrase.test.ts
new file mode 100644
index 0000000..1d01544
--- /dev/null
+++ b/lib/rules/comparePhrase.test.ts
@@ -0,0 +1,39 @@
+import { describe, expect, it } from "vitest";
+import { comparePhrase, sexLabel } from "./growthForm";
+
+// Spec 2026-11-25 §5.2.
+describe("comparePhrase", () => {
+  it("says how many of 100 babies of the same sex and age are below", () => {
+    expect(comparePhrase("wfa", 55.4, "boys", 76)).toBe(
+      "Nặng hơn 55 trong 100 bé trai cùng tuổi",
+    );
+    expect(comparePhrase("hcfa", 52.6, "girls", 76)).toBe(
+      "Lớn hơn 53 trong 100 bé gái cùng tuổi",
+    );
+  });
+
+  it("length is Dài hơn before two years and Cao hơn from two years", () => {
+    expect(comparePhrase("lhfa", 79, "boys", 729)).toBe(
+      "Dài hơn 79 trong 100 bé trai cùng tuổi",
+    );
+    expect(comparePhrase("lhfa", 79, "boys", 730)).toBe(
+      "Cao hơn 79 trong 100 bé trai cùng tuổi",
+    );
+  });
+
+  it("keeps the number between 1 and 99", () => {
+    expect(comparePhrase("wfa", 0.02, "boys", 76)).toBe(
+      "Nặng hơn 1 trong 100 bé trai cùng tuổi",
+    );
+    expect(comparePhrase("wfa", 0.5, "boys", 76)).toContain(" 1 trong 100");
+    expect(comparePhrase("wfa", 99.5, "boys", 76)).toContain(" 99 trong 100");
+    expect(comparePhrase("wfa", 99.99, "girls", 76)).toBe(
+      "Nặng hơn 99 trong 100 bé gái cùng tuổi",
+    );
+  });
+
+  it("sexLabel names the sex as the alerts write it", () => {
+    expect(sexLabel("boys")).toBe("bé trai");
+    expect(sexLabel("girls")).toBe("bé gái");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 165 passed (166)`, `Tests  4 failed | 1201 passed (1205)`. Lý do đỏ: chưa có `comparePhrase` và `sexLabel`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/rules/growthForm.ts b/lib/rules/growthForm.ts
index 5e339e1..ff579bc 100644
--- a/lib/rules/growthForm.ts
+++ b/lib/rules/growthForm.ts
@@ -1,4 +1,4 @@
-import type { WhoIndicator } from "@/lib/content/who";
+import type { WhoIndicator, WhoSex } from "@/lib/content/who";

 export type GrowthFormRaw = {
   measuredOn: string;
@@ -110,6 +110,29 @@ export function formatPercentile(p: number): string {
   return `P${decimals(1).format(p)}`;
 }

+export const sexLabel = (sex: WhoSex) =>
+  sex === "girls" ? "bé gái" : "bé trai";
+
+// Spec 2026-11-25 §5.2: a percentile in plain words. The number stays within
+// 1–99 so it never reads "hơn 0" or "hơn 100".
+export function comparePhrase(
+  indicator: WhoIndicator,
+  percentile: number,
+  sex: WhoSex,
+  ageDays: number,
+): string {
+  const n = Math.min(99, Math.max(1, Math.round(percentile)));
+  const word =
+    indicator === "wfa"
+      ? "Nặng hơn"
+      : indicator === "hcfa"
+        ? "Lớn hơn"
+        : ageDays < 730
+          ? "Dài hơn"
+          : "Cao hơn";
+  return `${word} ${n} trong 100 ${sexLabel(sex)} cùng tuổi`;
+}
+
 export const INDICATORS: {
   key: WhoIndicator;
   title: string;
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  166 passed (166)`, `Tests  1205 passed (1205)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/growthForm.ts lib/rules/comparePhrase.test.ts
git commit -m "feat(growth): comparePhrase puts a percentile in plain words" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Luật cảnh báo tăng trưởng (§5.1)

**Files:**

- Create: `lib/rules/growthAlerts.ts`
- Test: `lib/rules/growthAlerts.test.ts` (mới)

**Interfaces:**

- Consumes: `comparePhrase`, `sexLabel` (Task 1); `ageOnDay`, `lmsAt`, `zScore`, `percentile`; `formatGrowthValue`, `indicatorValue`, `INDICATORS`, `GrowthInput`; `formatAgeVi`; `formatDayShort`.
- Produces: mọi tên của `lib/rules/growthAlerts.ts` ghi ở Contracts, trừ `alertTone`, `growthStatus`, `GrowthTone` (Task 3).

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/rules/growthAlerts.test.ts b/lib/rules/growthAlerts.test.ts
new file mode 100644
index 0000000..8fcf4b4
--- /dev/null
+++ b/lib/rules/growthAlerts.test.ts
@@ -0,0 +1,348 @@
+import { describe, expect, it } from "vitest";
+import type { LmsRow } from "@/lib/content/who";
+import { addDays } from "./days";
+import {
+  ALERT_CHIP,
+  type GrowthMeasure,
+  type GrowthTables,
+  growthAlerts,
+  positionKind,
+  readings,
+} from "./growthAlerts";
+
+const DOB = "2026-01-01";
+const day = (age: number) => addDays(DOB, age);
+
+// L = 1, M = 16, S = 1/8 on every day, so z = value / 2 − 8 exactly:
+// 16 → 0, 12 → −2, 10 → −3, 20 → +2, 22 → +3.
+const FLAT: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+  d,
+  1,
+  16,
+  0.125,
+]);
+// The median grows 0,03 a day from 4, so "bé cùng tuổi thường tăng" is not zero.
+const GROWING: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+  d,
+  1,
+  4 + 0.03 * d,
+  0.125,
+]);
+
+const weight = (
+  age: number,
+  kg: number,
+  created_at?: string,
+): GrowthMeasure => ({
+  measured_on: day(age),
+  weight_g: Math.round(kg * 1000),
+  length_cm: null,
+  head_cm: null,
+  created_at,
+});
+const length = (age: number, cm: number): GrowthMeasure => ({
+  measured_on: day(age),
+  weight_g: null,
+  length_cm: cm,
+  head_cm: null,
+});
+const head = (age: number, cm: number): GrowthMeasure => ({
+  measured_on: day(age),
+  weight_g: null,
+  length_cm: null,
+  head_cm: cm,
+});
+
+const run = (
+  rows: GrowthMeasure[],
+  tables: GrowthTables = { wfa: FLAT, lhfa: FLAT, hcfa: FLAT },
+) => growthAlerts({ rows, tables, dob: DOB, sex: "boys", babyName: "Bun" });
+const kinds = (rows: GrowthMeasure[]) =>
+  run(rows).map((alert) => `${alert.indicator}:${alert.kind}`);
+
+describe("positionKind", () => {
+  it("is null from −2 to +2, low or high up to ±3, very low or very high beyond", () => {
+    expect(
+      [-3.01, -3, -2.01, -2, 0, 2, 2.01, 3, 3.01].map(positionKind),
+    ).toEqual([
+      "veryLow",
+      "low",
+      "low",
+      null,
+      null,
+      null,
+      "high",
+      "high",
+      "veryHigh",
+    ]);
+  });
+});
+
+describe("readings", () => {
+  it("lists one indicator newest first and leaves out what the table cannot place", () => {
+    const list = readings(
+      [
+        length(10, 16),
+        weight(40, 16),
+        length(40, 12),
+        length(1857, 16),
+        length(-1, 16),
+      ],
+      FLAT,
+      DOB,
+      "lhfa",
+    );
+    expect(list).toEqual([
+      { day: day(40), ageDays: 40, value: 12, z: -2, median: 16 },
+      { day: day(10), ageDays: 10, value: 16, z: 0, median: 16 },
+    ]);
+  });
+
+  it("on one day the row created last comes first; without created_at the given order stays", () => {
+    const early = weight(40, 16, "2026-02-10T01:00:00Z");
+    const late = weight(40, 12, "2026-02-10T02:00:00Z");
+    expect(readings([early, late], FLAT, DOB, "wfa")[0].value).toBe(12);
+    expect(readings([late, early], FLAT, DOB, "wfa")[0].value).toBe(12);
+    expect(
+      readings([weight(40, 16), weight(40, 12)], FLAT, DOB, "wfa")[0].value,
+    ).toBe(16);
+  });
+});
+
+// Spec 2026-11-25 §5.1.
+describe("growthAlerts: position", () => {
+  it("nothing from z −2 to z +2", () => {
+    expect(kinds([length(40, 12)])).toEqual([]);
+    expect(kinds([length(40, 16)])).toEqual([]);
+    expect(kinds([length(40, 20)])).toEqual([]);
+  });
+
+  it("yellow below −2 down to −3 and above +2 up to +3", () => {
+    expect(kinds([length(40, 11.98)])).toEqual(["lhfa:low"]);
+    expect(kinds([length(40, 10)])).toEqual(["lhfa:low"]);
+    expect(kinds([length(40, 20.02)])).toEqual(["lhfa:high"]);
+    expect(kinds([length(40, 22)])).toEqual(["lhfa:high"]);
+    expect(run([length(40, 10)])[0].level).toBe("yellow");
+  });
+
+  it("red beyond ±3", () => {
+    expect(kinds([length(40, 9.98)])).toEqual(["lhfa:veryLow"]);
+    expect(kinds([length(40, 22.02)])).toEqual(["lhfa:veryHigh"]);
+    expect(run([length(40, 9.98)])[0].level).toBe("red");
+  });
+
+  it("only the newest measurement of an indicator can raise an alert", () => {
+    expect(kinds([length(10, 9), length(40, 16)])).toEqual([]);
+  });
+
+  it("an indicator whose table has not loaded gives no alert", () => {
+    expect(run([length(40, 9), weight(40, 9)], { wfa: FLAT })).toHaveLength(1);
+  });
+
+  it("a measurement outside days 0–1856 is passed over, also as the newest", () => {
+    expect(kinds([length(1857, 9), length(40, 16)])).toEqual([]);
+    expect(kinds([length(1857, 16), length(40, 9)])).toEqual(["lhfa:veryLow"]);
+  });
+});
+
+describe("growthAlerts: falling and rising", () => {
+  it("falling when z is 1,33 below the highest z of the last 14 to 183 days", () => {
+    // 13,34 → z −1,33; 13,36 → z −1,32.
+    expect(kinds([length(40, 16), length(54, 13.34)])).toEqual([
+      "lhfa:falling",
+    ]);
+    expect(kinds([length(40, 16), length(54, 13.36)])).toEqual([]);
+  });
+
+  it("the window takes day 14 and day 183 and leaves out day 13 and day 184", () => {
+    expect(kinds([length(41, 16), length(54, 13.34)])).toEqual([]);
+    expect(kinds([length(40, 16), length(223, 13.34)])).toEqual([
+      "lhfa:falling",
+    ]);
+    expect(kinds([length(40, 16), length(224, 13.34)])).toEqual([]);
+  });
+
+  it("compares with the highest reading in the window, not the nearest", () => {
+    const [alert] = run([length(10, 16), length(40, 14), length(60, 13.34)]);
+    expect(alert.kind).toBe("falling");
+    expect(alert.previousPercentile).toBeCloseTo(50, 5);
+  });
+
+  it("weight falls the same way while it still goes up", () => {
+    // Day 86: median 6,58 kg, so 5,45 kg is z −1,37 after z 0 on day 40.
+    expect(
+      run([weight(40, 5.2), weight(86, 5.45)], { wfa: GROWING }).map(
+        (alert) => alert.kind,
+      ),
+    ).toEqual(["falling"]);
+  });
+
+  it("rising is for the head only", () => {
+    expect(kinds([length(40, 16), length(54, 18.66)])).toEqual([]);
+    expect(kinds([head(40, 16), head(54, 18.66)])).toEqual(["hcfa:rising"]);
+    expect(kinds([head(40, 16), head(54, 18.64)])).toEqual([]);
+  });
+
+  it("a head that both fell and rose inside the window is falling", () => {
+    expect(kinds([head(10, 13), head(30, 19), head(50, 16.34)])).toEqual([
+      "hcfa:falling",
+    ]);
+  });
+});
+
+describe("growthAlerts: weight loss", () => {
+  it("lighter than the nearest weighing at least 14 days back", () => {
+    expect(kinds([weight(20, 16), weight(34, 15.9)])).toEqual(["wfa:loss"]);
+    expect(kinds([weight(20, 16), weight(34, 16)])).toEqual([]);
+  });
+
+  it("not when the two weighings are 13 days apart", () => {
+    expect(kinds([weight(20, 16), weight(33, 15.9)])).toEqual([]);
+  });
+
+  it("never against a weighing from the first two weeks of life", () => {
+    expect(kinds([weight(0, 16), weight(30, 15.9)])).toEqual([]);
+    expect(kinds([weight(13, 16), weight(30, 15.9)])).toEqual([]);
+    expect(kinds([weight(14, 16), weight(30, 15.9)])).toEqual(["wfa:loss"]);
+  });
+
+  it("takes the nearest weighing that is far enough back", () => {
+    // 20 days back the baby was lighter, 40 days back heavier: no loss.
+    expect(kinds([weight(20, 16.5), weight(40, 15.5), weight(60, 16)])).toEqual(
+      [],
+    );
+  });
+});
+
+describe("growthAlerts: one alert per indicator, by priority", () => {
+  it("very low beats loss and falling", () => {
+    expect(kinds([weight(20, 16), weight(40, 9.9)])).toEqual(["wfa:veryLow"]);
+  });
+
+  it("loss beats falling", () => {
+    expect(kinds([weight(20, 16), weight(40, 13)])).toEqual(["wfa:loss"]);
+  });
+
+  it("falling beats low", () => {
+    expect(kinds([length(20, 14.8), length(40, 11.9)])).toEqual([
+      "lhfa:falling",
+    ]);
+  });
+
+  it("red alerts first, then weight, length, head", () => {
+    expect(
+      kinds([weight(40, 11), length(40, 23), head(40, 21), weight(20, 12)]),
+    ).toEqual(["lhfa:veryHigh", "wfa:loss", "hcfa:high"]);
+  });
+});
+
+describe("growthAlerts: wording", () => {
+  const text = (
+    rows: GrowthMeasure[],
+    tables: GrowthTables = { wfa: FLAT, lhfa: FLAT, hcfa: FLAT },
+  ) => {
+    const [{ title, body, advice, chip }] = run(rows, tables);
+    return { title, body, advice, chip };
+  };
+
+  it("very low and very high", () => {
+    expect(text([length(40, 9.9)])).toEqual({
+      title: "Chiều dài thấp hơn chuẩn nhiều",
+      body: "9,9 cm lúc 1 tháng 9 ngày, thấp hơn gần như mọi bé trai cùng tuổi.",
+      advice: "Nên cho bé đi khám.",
+      chip: "Rất thấp",
+    });
+    expect(text([weight(40, 22.5)])).toEqual({
+      title: "Cân nặng cao hơn chuẩn nhiều",
+      body: "22,5 kg lúc 1 tháng 9 ngày, cao hơn gần như mọi bé trai cùng tuổi.",
+      advice: "Nên cho bé đi khám.",
+      chip: "Rất cao",
+    });
+  });
+
+  it("low and high carry the plain-words percentile", () => {
+    expect(text([head(40, 11)])).toEqual({
+      title: "Vòng đầu thấp hơn chuẩn",
+      body: "11 cm lúc 1 tháng 9 ngày. Lớn hơn 1 trong 100 bé trai cùng tuổi.",
+      advice: "Nên hỏi bác sĩ ở lần khám tới.",
+      chip: "Thấp",
+    });
+    expect(text([length(40, 21)])).toEqual({
+      title: "Chiều dài cao hơn chuẩn",
+      body: "21 cm lúc 1 tháng 9 ngày. Dài hơn 99 trong 100 bé trai cùng tuổi.",
+      advice: "Nên hỏi bác sĩ ở lần khám tới.",
+      chip: "Cao",
+    });
+  });
+
+  it("loss names the grams and the day of the earlier weighing", () => {
+    expect(text([weight(20, 16), weight(34, 15.85)])).toEqual({
+      title: "Cân nặng giảm",
+      body: "Bun nhẹ hơn 150 g so với lần đo 21/01.",
+      advice: "Nên hỏi bác sĩ ở lần khám tới.",
+      chip: "Giảm cân",
+    });
+  });
+
+  it("falling weight: the gain, the days, grams a day and what is usual", () => {
+    // Medians: 5,2 kg on day 40 and 6,58 kg on day 86, so 30 g a day is usual.
+    expect(text([weight(40, 5.2), weight(86, 5.45)], { wfa: GROWING })).toEqual(
+      {
+        title: "Cân nặng tăng chậm lại",
+        body: "Bun tăng 250 g trong 46 ngày, khoảng 5 g mỗi ngày. Bé cùng tuổi thường tăng khoảng 30 g mỗi ngày.",
+        advice: "Nên hỏi bác sĩ ở lần khám tới.",
+        chip: "Tăng chậm",
+      },
+    );
+  });
+
+  it("falling length and rising head: the gain in cm and what is usual over the same days", () => {
+    expect(text([length(40, 5.2), length(86, 5.4)], { lhfa: GROWING })).toEqual(
+      {
+        title: "Chiều dài tăng chậm lại",
+        body: "Bun tăng 0,2 cm trong 46 ngày. Bé cùng tuổi thường tăng khoảng 1,4 cm trong cùng thời gian.",
+        advice: "Nên hỏi bác sĩ ở lần khám tới.",
+        chip: "Tăng chậm",
+      },
+    );
+    expect(text([head(40, 5.2), head(86, 7.9)], { hcfa: GROWING })).toEqual({
+      title: "Vòng đầu tăng nhanh",
+      body: "Bun tăng 2,7 cm trong 46 ngày. Bé cùng tuổi thường tăng khoảng 1,4 cm trong cùng thời gian.",
+      advice: "Nên hỏi bác sĩ ở lần khám tới.",
+      chip: "Tăng nhanh",
+    });
+  });
+
+  it("falling without a gain to speak of says only the value and the age", () => {
+    expect(text([length(40, 16), length(54, 13.34)]).body).toBe(
+      "13,3 cm lúc 1 tháng 23 ngày.",
+    );
+    // The same length 46 days later, while the median grew: no gain at all.
+    expect(
+      text([length(40, 5.2), length(86, 5.2)], { lhfa: GROWING }).body,
+    ).toBe("5,2 cm lúc 2 tháng 27 ngày.");
+  });
+
+  it("every kind has its chip", () => {
+    expect(ALERT_CHIP).toEqual({
+      veryLow: "Rất thấp",
+      veryHigh: "Rất cao",
+      loss: "Giảm cân",
+      falling: "Tăng chậm",
+      rising: "Tăng nhanh",
+      low: "Thấp",
+      high: "Cao",
+    });
+  });
+});
+
+describe("growthAlerts: what the screens need besides the text", () => {
+  it("names the day of the measurement and, for a shift, the earlier percentile", () => {
+    const [falling] = run([length(40, 16), length(54, 13.34)]);
+    expect(falling.measuredOn).toBe(day(54));
+    expect(falling.previousPercentile).toBeCloseTo(50, 5);
+    const [low] = run([length(40, 11)]);
+    expect(low.measuredOn).toBe(day(40));
+    expect(low.previousPercentile).toBeNull();
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 166 passed (167)`, `Tests  1205 passed (1205)`. File test mới không chạy được test nào vì chưa có `./growthAlerts`.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/lib/rules/growthAlerts.ts b/lib/rules/growthAlerts.ts
new file mode 100644
index 0000000..24d4464
--- /dev/null
+++ b/lib/rules/growthAlerts.ts
@@ -0,0 +1,263 @@
+import type { LmsRow, WhoIndicator, WhoSex } from "@/lib/content/who";
+import { formatDayShort } from "./days";
+import { ageOnDay, lmsAt, percentile, zScore } from "./growth";
+import {
+  comparePhrase,
+  formatGrowthValue,
+  type GrowthInput,
+  INDICATORS,
+  indicatorValue,
+  sexLabel,
+} from "./growthForm";
+import { formatAgeVi } from "./time";
+
+// Spec 2026-11-25 §5.1.
+export type GrowthAlertKind =
+  "veryLow" | "veryHigh" | "loss" | "falling" | "rising" | "low" | "high";
+export type GrowthAlertLevel = "yellow" | "red";
+
+export type GrowthAlert = {
+  indicator: WhoIndicator;
+  kind: GrowthAlertKind;
+  level: GrowthAlertLevel;
+  title: string;
+  body: string;
+  advice: string;
+  chip: string;
+  // measured_on of the measurement the alert is about.
+  measuredOn: string;
+  // falling and rising: the percentile of the measurement it is compared with.
+  previousPercentile: number | null;
+};
+
+// A table that has not loaded is left out: its indicator gives no alert.
+export type GrowthTables = Partial<Record<WhoIndicator, LmsRow[]>>;
+export type GrowthMeasure = GrowthInput & { created_at?: string | null };
+
+// One measurement of one indicator, placed on its WHO table.
+export type Reading = {
+  day: string;
+  ageDays: number;
+  value: number;
+  z: number;
+  // The table's median on that day, in the table's unit.
+  median: number;
+};
+
+// Two percentile bands (0,67 z each).
+export const SHIFT_Z = 1.33;
+export const COMPARE_MIN_DAYS = 14;
+export const COMPARE_MAX_DAYS = 183;
+export const LOSS_MIN_AGE_DAYS = 14;
+// z comes out of floating-point division: 1.33 must not read as 1.3299999.
+const EPSILON = 1e-9;
+
+export const ALERT_CHIP: Record<GrowthAlertKind, string> = {
+  veryLow: "Rất thấp",
+  veryHigh: "Rất cao",
+  loss: "Giảm cân",
+  falling: "Tăng chậm",
+  rising: "Tăng nhanh",
+  low: "Thấp",
+  high: "Cao",
+};
+
+const ASK = "Nên hỏi bác sĩ ở lần khám tới.";
+const GO = "Nên cho bé đi khám.";
+
+const TITLE = Object.fromEntries(
+  INDICATORS.map((item) => [item.key, item.title]),
+) as Record<WhoIndicator, string>;
+
+const whole = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
+const oneDecimal = new Intl.NumberFormat("vi-VN", {
+  maximumFractionDigits: 1,
+});
+const tenth = (n: number) => Math.round(n * 10) / 10;
+
+// The measurements of one indicator that fall inside the WHO table, newest
+// first: by measured_on, then created_at; rows with neither keep their order.
+export function readings(
+  rows: GrowthMeasure[],
+  table: LmsRow[],
+  dob: string,
+  indicator: WhoIndicator,
+): Reading[] {
+  return rows
+    .map((row, index) => ({ row, index }))
+    .sort(
+      (a, b) =>
+        b.row.measured_on.localeCompare(a.row.measured_on) ||
+        (b.row.created_at ?? "").localeCompare(a.row.created_at ?? "") ||
+        a.index - b.index,
+    )
+    .flatMap(({ row }): Reading[] => {
+      const value = indicatorValue(row, indicator);
+      if (value === null || !(value > 0)) return [];
+      const ageDays = ageOnDay(dob, row.measured_on);
+      const lms = lmsAt(table, ageDays);
+      if (!lms) return [];
+      return [
+        {
+          day: row.measured_on,
+          ageDays,
+          value,
+          z: zScore(lms, value),
+          median: lms.m,
+        },
+      ];
+    });
+}
+
+// Where a z-score sits against the ±2 and ±3 lines; null inside ±2.
+export function positionKind(
+  z: number,
+): "veryLow" | "low" | "high" | "veryHigh" | null {
+  if (z < -3) return "veryLow";
+  if (z > 3) return "veryHigh";
+  if (z < -2) return "low";
+  if (z > 2) return "high";
+  return null;
+}
+
+type Found = { kind: GrowthAlertKind; compared: Reading | null };
+
+function findAlert(indicator: WhoIndicator, list: Reading[]): Found | null {
+  const [latest, ...older] = list;
+  const position = positionKind(latest.z);
+  if (position === "veryLow" || position === "veryHigh")
+    return { kind: position, compared: null };
+
+  const apart = (reading: Reading) => latest.ageDays - reading.ageDays;
+  if (indicator === "wfa") {
+    // `older` is newest first, so this is the nearest reading far enough back.
+    const before = older.find(
+      (reading) =>
+        apart(reading) >= COMPARE_MIN_DAYS &&
+        reading.ageDays >= LOSS_MIN_AGE_DAYS,
+    );
+    if (before && latest.value < before.value)
+      return { kind: "loss", compared: before };
+  }
+
+  const window = older.filter(
+    (reading) =>
+      apart(reading) >= COMPARE_MIN_DAYS && apart(reading) <= COMPARE_MAX_DAYS,
+  );
+  // On equal z the newer reading stays: `window` is newest first.
+  const highest = window.reduce<Reading | null>(
+    (best, reading) => (best === null || reading.z > best.z ? reading : best),
+    null,
+  );
+  if (highest && highest.z - latest.z >= SHIFT_Z - EPSILON)
+    return { kind: "falling", compared: highest };
+  if (indicator === "hcfa") {
+    const lowest = window.reduce<Reading | null>(
+      (best, reading) => (best === null || reading.z < best.z ? reading : best),
+      null,
+    );
+    if (lowest && latest.z - lowest.z >= SHIFT_Z - EPSILON)
+      return { kind: "rising", compared: lowest };
+  }
+
+  return position ? { kind: position, compared: null } : null;
+}
+
+function describe(
+  indicator: WhoIndicator,
+  found: Found,
+  latest: Reading,
+  ctx: { dob: string; sex: WhoSex; babyName: string },
+): Pick<GrowthAlert, "title" | "body" | "advice"> {
+  const name = TITLE[indicator];
+  const value = formatGrowthValue(indicator, latest.value);
+  const age = formatAgeVi(ctx.dob, new Date(`${latest.day}T05:00:00Z`));
+  const plain = `${value} lúc ${age}.`;
+  const { kind, compared } = found;
+
+  if (kind === "veryLow" || kind === "veryHigh") {
+    const side = kind === "veryLow" ? "thấp" : "cao";
+    return {
+      title: `${name} ${side} hơn chuẩn nhiều`,
+      body: `${value} lúc ${age}, ${side} hơn gần như mọi ${sexLabel(ctx.sex)} cùng tuổi.`,
+      advice: GO,
+    };
+  }
+  if (kind === "low" || kind === "high")
+    return {
+      title: `${name} ${kind === "low" ? "thấp" : "cao"} hơn chuẩn`,
+      body: `${plain} ${comparePhrase(indicator, percentile(latest.z), ctx.sex, latest.ageDays)}.`,
+      advice: ASK,
+    };
+  if (kind === "loss" && compared)
+    return {
+      title: "Cân nặng giảm",
+      body: `${ctx.babyName} nhẹ hơn ${whole.format(Math.round((compared.value - latest.value) * 1000))} g so với lần đo ${formatDayShort(compared.day)}.`,
+      advice: ASK,
+    };
+
+  const title =
+    kind === "rising" ? "Vòng đầu tăng nhanh" : `${name} tăng chậm lại`;
+  if (!compared) return { title, body: plain, advice: ASK };
+  const days = latest.ageDays - compared.ageDays;
+  if (indicator === "wfa") {
+    const gain = Math.round((latest.value - compared.value) * 1000);
+    // The copy says "tăng": a measurement that did not go up has no such line.
+    if (gain <= 0) return { title, body: plain, advice: ASK };
+    const usual = Math.round(((latest.median - compared.median) * 1000) / days);
+    return {
+      title,
+      body: `${ctx.babyName} tăng ${whole.format(gain)} g trong ${days} ngày, khoảng ${whole.format(Math.round(gain / days))} g mỗi ngày. Bé cùng tuổi thường tăng khoảng ${whole.format(usual)} g mỗi ngày.`,
+      advice: ASK,
+    };
+  }
+  const gain = tenth(latest.value - compared.value);
+  if (gain <= 0) return { title, body: plain, advice: ASK };
+  return {
+    title,
+    body: `${ctx.babyName} tăng ${oneDecimal.format(gain)} cm trong ${days} ngày. Bé cùng tuổi thường tăng khoảng ${oneDecimal.format(tenth(latest.median - compared.median))} cm trong cùng thời gian.`,
+    advice: ASK,
+  };
+}
+
+// At most one alert per indicator, for its newest measurement only. Red ones
+// come first, then weight, length, head.
+export function growthAlerts(input: {
+  rows: GrowthMeasure[];
+  tables: GrowthTables;
+  dob: string;
+  sex: WhoSex;
+  babyName: string;
+}): GrowthAlert[] {
+  const alerts = INDICATORS.flatMap(({ key }): GrowthAlert[] => {
+    const table = input.tables[key];
+    if (!table) return [];
+    const list = readings(input.rows, table, input.dob, key);
+    if (list.length === 0) return [];
+    const found = findAlert(key, list);
+    if (!found) return [];
+    const [latest] = list;
+    return [
+      {
+        indicator: key,
+        kind: found.kind,
+        level:
+          found.kind === "veryLow" || found.kind === "veryHigh"
+            ? "red"
+            : "yellow",
+        ...describe(key, found, latest, input),
+        chip: ALERT_CHIP[found.kind],
+        measuredOn: latest.day,
+        previousPercentile:
+          (found.kind === "falling" || found.kind === "rising") &&
+          found.compared
+            ? percentile(found.compared.z)
+            : null,
+      },
+    ];
+  });
+  return [
+    ...alerts.filter((alert) => alert.level === "red"),
+    ...alerts.filter((alert) => alert.level === "yellow"),
+  ];
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  167 passed (167)`, `Tests  1236 passed (1236)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/growthAlerts.ts lib/rules/growthAlerts.test.ts
git commit -m "feat(growth): alerts for a measurement off the norm or going the wrong way" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Cảnh báo trên trang Sức khỏe: chip và dòng "Cần chú ý" (§3.4, §4 dòng 1)

**Files:**

- Create: `components/ui/StatusChip.tsx`
- Modify: `lib/rules/growthAlerts.ts`, `lib/rules/attention.ts`, `components/health/HealthScreen.tsx`
- Test: `components/ui/statuschip.test.tsx` (mới), `lib/rules/growthAlerts.test.ts`, `lib/rules/attention.test.ts`, `components/health/health.test.tsx`

**Interfaces:**

- Consumes: `growthAlerts`, `GrowthAlert`, `GrowthAlertLevel` (Task 2); `attentionItems`, `AttentionItem`; `HealthScreen`; `useWhoTable`, `whoSex`, `LmsRow`.
- Produces: `GrowthTone`, `alertTone(level)`, `growthStatus(alerts)`; `growthAttention(alerts)`; `attentionItems({ growth, vaccine, today })`; `StatusChip`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/health/health.test.tsx b/components/health/health.test.tsx
index 205e1d9..c8722c9 100644
--- a/components/health/health.test.tsx
+++ b/components/health/health.test.tsx
@@ -15,8 +15,10 @@ import { HealthScreen } from "./HealthScreen";
 const state = vi.hoisted(() => ({
   growth: {} as Record<string, unknown>,
   doses: {} as Record<string, unknown>,
+  tables: {} as Record<string, unknown>,
 }));
 const useGrowth = vi.hoisted(() => vi.fn());
+const useWhoTable = vi.hoisted(() => vi.fn());
 const useVaccineDoses = vi.hoisted(() => vi.fn());
 // Four doses: one at birth, two at two months (one of them in a group), one late.
 const content = vi.hoisted(() => {
@@ -83,7 +85,7 @@ const content = vi.hoisted(() => {
 });

 vi.mock("@/lib/content/vaccines", () => ({ VACCINES: content }));
-vi.mock("@/lib/data/growth", () => ({ useGrowth }));
+vi.mock("@/lib/data/growth", () => ({ useGrowth, useWhoTable }));
 vi.mock("@/lib/data/vaccines", () => ({ useVaccineDoses }));

 const LOADING = {
@@ -109,6 +111,19 @@ const loaded = (data: unknown[]) => ({
   fetchStatus: "idle",
 });

+// WHO tables whose median never changes, so z = (value / median − 1) × 8:
+// 5,5 kg and 58,5 cm sit exactly on the median.
+const flat = (median: number) => ({
+  data: {
+    rows: Array.from({ length: 1857 }, (_, day) => [day, 1, median, 0.125]),
+  },
+  isPending: false,
+  isError: false,
+  error: null,
+  fetchStatus: "idle",
+});
+const TABLES = { wfa: flat(5.5), lhfa: flat(58.5), hcfa: flat(38) };
+
 const CHOSEN = { dtp_combo: "6in1" };
 const [VACCINE, MILESTONES] = HEALTH_CARDS;
 const LINE = "line-clamp-2 text-[13px] leading-[18px]";
@@ -139,11 +154,12 @@ const done = (code: string) =>
   }) as VaccineDoseRow;

 function render(
-  query: { growth?: unknown; doses?: unknown } = {},
+  query: { growth?: unknown; doses?: unknown; tables?: boolean } = {},
   dob = "2026-09-14",
 ) {
   state.growth = (query.growth ?? LOADING) as Record<string, unknown>;
   state.doses = (query.doses ?? LOADING) as Record<string, unknown>;
+  state.tables = query.tables ? TABLES : {};
   const baby = {
     id: "b1",
     family_id: "f1",
@@ -163,6 +179,9 @@ function link(html: string, href: string) {

 beforeAll(() => {
   useGrowth.mockImplementation(() => state.growth);
+  useWhoTable.mockImplementation(
+    (indicator: string) => state.tables[indicator] ?? LOADING,
+  );
   useVaccineDoses.mockImplementation(() => state.doses);
   vi.useFakeTimers({ toFake: ["Date"] });
   vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
@@ -302,16 +321,100 @@ describe("HealthScreen: the Tăng trưởng card", () => {
       );
   });

-  it("has no status chip and no goal line yet", () => {
+  it("has no goal line yet", () => {
     const card = link(
-      render({ growth: loaded([measure("2026-11-15", 5500)]) }),
+      render({ growth: loaded([measure("2026-11-15", 5500)]), tables: true }),
       HEALTH_GROWTH.href,
     );
-    expect(card).not.toContain("Lớn đều");
     expect(card).not.toContain("Mục tiêu");
   });
 });

+// Spec 2026-11-25 §3.4 and §4 row 1.
+describe("HealthScreen: growth alerts", () => {
+  const CHIP = "font-semibold whitespace-nowrap";
+  // The card sits below "Theo dõi"; an alert row above it links to the same page.
+  const growthCard = (page: string) =>
+    link(page.slice(page.indexOf(">Theo dõi<")), HEALTH_GROWTH.href);
+  const growthRow = (page: string) => {
+    const attention = page.slice(
+      page.indexOf(">Cần chú ý<"),
+      page.indexOf(">Theo dõi<"),
+    );
+    return attention.includes('href="/tang-truong"')
+      ? link(attention, "/tang-truong")
+      : null;
+  };
+
+  it("reads the three WHO tables of the baby's sex", () => {
+    useWhoTable.mockClear();
+    render({ growth: loaded([measure("2026-11-15", 5500)]) });
+    expect(useWhoTable.mock.calls).toEqual([
+      ["wfa", "boys"],
+      ["lhfa", "boys"],
+      ["hcfa", "boys"],
+    ]);
+  });
+
+  it("no chip until the measurements and all three tables have loaded", () => {
+    for (const page of [
+      render({ growth: loaded([measure("2026-11-15", 5500)]) }),
+      render({ tables: true }),
+      render({ growth: loaded([]), tables: true }),
+    ])
+      expect(growthCard(page)).not.toContain(CHIP);
+  });
+
+  it("on the norm: the chip Lớn đều and no growth row", () => {
+    const page = render({
+      growth: loaded([measure("2026-11-15", 5500)]),
+      doses: loaded([]),
+      tables: true,
+    });
+    expect(growthCard(page)).toContain(
+      `${CHIP} bg-good-soft text-good-ink">Lớn đều</span>`,
+    );
+    expect(growthRow(page)).toBeNull();
+  });
+
+  it("a yellow alert: the chip Cần chú ý and a warn row above the vaccine row", () => {
+    // 4 kg against a 5,5 kg median is z −2,18.
+    const page = render({
+      growth: loaded([measure("2026-11-15", 4000)]),
+      doses: loaded([]),
+      tables: true,
+    });
+    expect(growthCard(page)).toContain(
+      `${CHIP} bg-warn-soft text-warn-ink">Cần chú ý</span>`,
+    );
+    const row = growthRow(page);
+    expect(row).toContain(">Cân nặng thấp hơn chuẩn</span>");
+    expect(row).toContain(
+      '<span class="text-[13px] font-semibold text-warn">Nên hỏi bác sĩ ở lần khám tới.</span>',
+    );
+    expect(row).toContain(`d="${ICON_PATHS.ruler}"`);
+    expect(page.indexOf(">Cân nặng thấp hơn chuẩn<")).toBeLessThan(
+      page.indexOf(">Quá hạn: Lao (BCG)<"),
+    );
+  });
+
+  it("a red alert: the chip Nên đi khám and a danger row", () => {
+    // 3 kg against a 5,5 kg median is z −3,6.
+    const page = render({
+      growth: loaded([measure("2026-11-15", 3000)]),
+      tables: true,
+    });
+    expect(growthCard(page)).toContain(
+      `${CHIP} bg-danger-soft text-danger-ink">Nên đi khám</span>`,
+    );
+    const row = growthRow(page);
+    expect(row).toContain(">Cân nặng thấp hơn chuẩn nhiều</span>");
+    expect(row).toContain(
+      '<span class="text-[13px] font-semibold text-danger">Nên cho bé đi khám.</span>',
+    );
+  });
+});
+
 describe("HealthScreen: the Tiêm chủng and Phát triển cards", () => {
   it("are short cards in a two-column grid", () => {
     const page = render();
diff --git a/components/ui/statuschip.test.tsx b/components/ui/statuschip.test.tsx
new file mode 100644
index 0000000..cd9abe2
--- /dev/null
+++ b/components/ui/statuschip.test.tsx
@@ -0,0 +1,20 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import { StatusChip } from "./StatusChip";
+
+const BASE =
+  "shrink-0 rounded-full px-2.5 py-0.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap";
+
+// Spec 2026-11-25 §3.4 and §5.1: the chip that names a growth status.
+describe("StatusChip", () => {
+  it.each([
+    ["good", "bg-good-soft text-good-ink"],
+    ["warn", "bg-warn-soft text-warn-ink"],
+    ["danger", "bg-danger-soft text-danger-ink"],
+    ["neutral", "bg-line text-ink"],
+  ] as const)("%s", (tone, colours) => {
+    expect(
+      renderToStaticMarkup(<StatusChip tone={tone}>Lớn đều</StatusChip>),
+    ).toBe(`<span class="${BASE} ${colours}">Lớn đều</span>`);
+  });
+});
diff --git a/lib/rules/attention.test.ts b/lib/rules/attention.test.ts
index 5318e1d..3057e81 100644
--- a/lib/rules/attention.test.ts
+++ b/lib/rules/attention.test.ts
@@ -2,11 +2,29 @@ import { describe, expect, it } from "vitest";
 import {
   ATTENTION_MAX,
   attentionItems,
+  growthAttention,
   vaccineAttention,
   type AttentionItem,
 } from "./attention";
+import type { GrowthAlert } from "./growthAlerts";
 import type { DoseState, ScheduleItem } from "./vaccines";

+const alert = (
+  indicator: GrowthAlert["indicator"],
+  level: GrowthAlert["level"],
+): GrowthAlert => ({
+  indicator,
+  kind: level === "red" ? "veryLow" : "low",
+  level,
+  title: `Tiêu đề ${indicator}`,
+  body: "Nội dung",
+  advice:
+    level === "red" ? "Nên cho bé đi khám." : "Nên hỏi bác sĩ ở lần khám tới.",
+  chip: level === "red" ? "Rất thấp" : "Thấp",
+  measuredOn: "2026-11-20",
+  previousPercentile: null,
+});
+
 const TODAY = "2026-11-25";

 const dose = (state: DoseState, due: string) =>
@@ -67,14 +85,21 @@ describe("vaccineAttention", () => {

 describe("attentionItems", () => {
   it("is empty when nothing needs attention", () => {
-    expect(attentionItems({ vaccine: null, today: TODAY })).toEqual([]);
     expect(
-      attentionItems({ vaccine: dose("later", "2027-06-14"), today: TODAY }),
+      attentionItems({ growth: null, vaccine: null, today: TODAY }),
+    ).toEqual([]);
+    expect(
+      attentionItems({
+        growth: [],
+        vaccine: dose("later", "2027-06-14"),
+        today: TODAY,
+      }),
     ).toEqual([]);
   });

   it("lists the vaccine row", () => {
     const items = attentionItems({
+      growth: null,
       vaccine: dose("overdue", "2026-11-10"),
       today: TODAY,
     });
@@ -85,5 +110,57 @@ describe("attentionItems", () => {

   it("never returns more than four rows", () => {
     expect(ATTENTION_MAX).toBe(4);
+    const five = (["wfa", "lhfa", "hcfa", "wfa", "lhfa"] as const).map(
+      (indicator, index) => alert(indicator, index === 4 ? "red" : "yellow"),
+    );
+    const items = attentionItems({
+      growth: five,
+      vaccine: dose("overdue", "2026-11-10"),
+      today: TODAY,
+    });
+    expect(items).toHaveLength(4);
+    expect(items.every((item) => item.href === "/tang-truong")).toBe(true);
+  });
+});
+
+// Spec 2026-11-25 §4, row 1.
+describe("growthAttention", () => {
+  it("no alerts, or alerts not worked out yet: no row", () => {
+    expect(growthAttention(null)).toEqual([]);
+    expect(growthAttention([])).toEqual([]);
+  });
+
+  it("one row per alert, in the order given: the title, the advice, the tone", () => {
+    expect(
+      growthAttention([alert("lhfa", "red"), alert("wfa", "yellow")]),
+    ).toEqual([
+      {
+        key: "growth-lhfa",
+        icon: "ruler",
+        color: "cat-tummy",
+        title: "Tiêu đề lhfa",
+        detail: "Nên cho bé đi khám.",
+        tone: "danger",
+        href: "/tang-truong",
+      },
+      {
+        key: "growth-wfa",
+        icon: "ruler",
+        color: "cat-tummy",
+        title: "Tiêu đề wfa",
+        detail: "Nên hỏi bác sĩ ở lần khám tới.",
+        tone: "warn",
+        href: "/tang-truong",
+      },
+    ]);
+  });
+
+  it("growth rows come before the vaccine row", () => {
+    const items = attentionItems({
+      growth: [alert("wfa", "yellow")],
+      vaccine: dose("overdue", "2026-11-10"),
+      today: TODAY,
+    });
+    expect(items.map((item) => item.key)).toEqual(["growth-wfa", "vaccine"]);
   });
 });
diff --git a/lib/rules/growthAlerts.test.ts b/lib/rules/growthAlerts.test.ts
index 8fcf4b4..cbd7d7c 100644
--- a/lib/rules/growthAlerts.test.ts
+++ b/lib/rules/growthAlerts.test.ts
@@ -6,6 +6,7 @@ import {
   type GrowthMeasure,
   type GrowthTables,
   growthAlerts,
+  growthStatus,
   positionKind,
   readings,
 } from "./growthAlerts";
@@ -346,3 +347,24 @@ describe("growthAlerts: what the screens need besides the text", () => {
     expect(low.previousPercentile).toBeNull();
   });
 });
+
+// Spec 2026-11-25 §3.4: the chip on the growth card of the Sức khỏe page.
+describe("growthStatus", () => {
+  it("no alert: Lớn đều", () => {
+    expect(growthStatus([])).toEqual({ text: "Lớn đều", tone: "good" });
+  });
+
+  it("only yellow alerts: Cần chú ý", () => {
+    expect(growthStatus(run([length(40, 11)]))).toEqual({
+      text: "Cần chú ý",
+      tone: "warn",
+    });
+  });
+
+  it("any red alert: Nên đi khám", () => {
+    expect(growthStatus(run([length(40, 11), weight(40, 9)]))).toEqual({
+      text: "Nên đi khám",
+      tone: "danger",
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  4 failed | 164 passed (168)`, `Tests  11 failed | 1236 passed (1247)`. Lý do đỏ: chưa có `growthStatus`, `growthAttention`, `StatusChip`; `HealthScreen` chưa đọc bảng WHO.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/components/health/HealthScreen.tsx b/components/health/HealthScreen.tsx
index 34fcc79..ac0815c 100644
--- a/components/health/HealthScreen.tsx
+++ b/components/health/HealthScreen.tsx
@@ -5,8 +5,10 @@ import { Icon } from "@/components/ui/Icon";
 import { ListGroup, ListRow } from "@/components/ui/ListGroup";
 import { type LiveLine, NavCard } from "@/components/ui/NavCard";
 import { PageHeader } from "@/components/ui/PageHeader";
+import { StatusChip } from "@/components/ui/StatusChip";
 import { VACCINES } from "@/lib/content/vaccines";
-import { useGrowth } from "@/lib/data/growth";
+import { type LmsRow, whoSex } from "@/lib/content/who";
+import { useGrowth, useWhoTable } from "@/lib/data/growth";
 import { useVaccineDoses } from "@/lib/data/vaccines";
 import {
   HEALTH_CARDS,
@@ -17,6 +19,11 @@ import {
 } from "@/lib/nav";
 import { attentionItems } from "@/lib/rules/attention";
 import { formatDayShort } from "@/lib/rules/days";
+import {
+  growthAlerts,
+  growthStatus,
+  type GrowthTone,
+} from "@/lib/rules/growthAlerts";
 import { vaccineCardText } from "@/lib/rules/exploreCards";
 import {
   formatGrowthValue,
@@ -57,7 +64,14 @@ function growthCells(latest: LatestGrowth): [title: string, value: string][] {
   ];
 }

-function GrowthCard({ latest }: { latest: LatestGrowth | null }) {
+function GrowthCard({
+  latest,
+  status,
+}: {
+  latest: LatestGrowth | null;
+  // null: the alerts are not worked out yet, so there is no chip.
+  status: { text: string; tone: GrowthTone } | null;
+}) {
   return (
     <Link
       href={HEALTH_GROWTH.href}
@@ -80,6 +94,9 @@ function GrowthCard({ latest }: { latest: LatestGrowth | null }) {
               : HEALTH_GROWTH.detail}
           </span>
         </span>
+        {latest && status && (
+          <StatusChip tone={status.tone}>{status.text}</StatusChip>
+        )}
         <Icon name="chevronRight" size={18} className="text-muted" />
       </span>
       {latest && (
@@ -114,7 +131,27 @@ export function HealthScreen({ baby }: { baby: Baby }) {
         }),
       )
     : null;
-  const attention = attentionItems({ vaccine: next, today });
+  const sex = whoSex(baby.sex);
+  const wfa = useWhoTable("wfa", sex);
+  const lhfa = useWhoTable("lhfa", sex);
+  const hcfa = useWhoTable("hcfa", sex);
+  // Spec 2026-11-25 §3.4: the alerts wait for the measurements and all three
+  // tables, so the chip never shows a verdict that a late table would change.
+  const alerts =
+    growth.data && wfa.data && lhfa.data && hcfa.data
+      ? growthAlerts({
+          rows: growth.data,
+          tables: {
+            wfa: wfa.data.rows as LmsRow[],
+            lhfa: lhfa.data.rows as LmsRow[],
+            hcfa: hcfa.data.rows as LmsRow[],
+          },
+          dob: baby.dob,
+          sex,
+          babyName: baby.name,
+        })
+      : null;
+  const attention = attentionItems({ growth: alerts, vaccine: next, today });
   const live: Partial<Record<string, LiveLine>> = {
     "/tiem-chung": {
       text: vaccineCardText(next),
@@ -147,7 +184,10 @@ export function HealthScreen({ baby }: { baby: Baby }) {

       <section className="flex flex-col gap-2.5">
         <SectionTitle>Theo dõi</SectionTitle>
-        <GrowthCard latest={growth.data ? latestGrowth(growth.data) : null} />
+        <GrowthCard
+          latest={growth.data ? latestGrowth(growth.data) : null}
+          status={alerts ? growthStatus(alerts) : null}
+        />
         <div className="grid grid-cols-2 gap-2.5">
           {HEALTH_CARDS.map((item) => (
             <NavCard key={item.href} item={item} live={live[item.href]} short />
diff --git a/components/ui/StatusChip.tsx b/components/ui/StatusChip.tsx
new file mode 100644
index 0000000..a275cd9
--- /dev/null
+++ b/components/ui/StatusChip.tsx
@@ -0,0 +1,30 @@
+import { cx } from "@/lib/ui/cx";
+
+export type ChipTone = "good" | "warn" | "danger" | "neutral";
+
+const TONE: Record<ChipTone, string> = {
+  good: "bg-good-soft text-good-ink",
+  warn: "bg-warn-soft text-warn-ink",
+  danger: "bg-danger-soft text-danger-ink",
+  neutral: "bg-line text-ink",
+};
+
+// Spec 2026-11-25 §3.4 and §5.1: a short status next to a growth value.
+export function StatusChip({
+  tone,
+  children,
+}: {
+  tone: ChipTone;
+  children: string;
+}) {
+  return (
+    <span
+      className={cx(
+        "shrink-0 rounded-full px-2.5 py-0.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap",
+        TONE[tone],
+      )}
+    >
+      {children}
+    </span>
+  );
+}
diff --git a/lib/rules/attention.ts b/lib/rules/attention.ts
index e75ec47..96f5734 100644
--- a/lib/rules/attention.ts
+++ b/lib/rules/attention.ts
@@ -1,6 +1,7 @@
 import type { CategoryToken } from "@/lib/ui/categories";
 import type { IconName } from "@/lib/ui/icons";
 import { formatDayShort, vnDayStartMs } from "./days";
+import { alertTone, type GrowthAlert } from "./growthAlerts";
 import type { ScheduleItem } from "./vaccines";

 export type AttentionTone = "normal" | "warn" | "danger";
@@ -56,13 +57,31 @@ export function vaccineAttention(
   };
 }

+// Row 1 of the table: one row per growth alert, in the order growthAlerts
+// returned them (red first). null: the alerts are not worked out yet.
+export function growthAttention(alerts: GrowthAlert[] | null): AttentionItem[] {
+  return (alerts ?? []).map((alert) => ({
+    key: `growth-${alert.indicator}`,
+    icon: "ruler",
+    color: "cat-tummy",
+    title: alert.title,
+    detail: alert.advice,
+    tone: alertTone(alert.level),
+    href: "/tang-truong",
+  }));
+}
+
 // The rows in priority order, at most ATTENTION_MAX. A source whose data has
 // not loaded is passed as null and gives no row.
 export function attentionItems(input: {
+  growth: GrowthAlert[] | null;
   vaccine: ScheduleItem | null;
   today: string;
 }): AttentionItem[] {
-  const rows = [vaccineAttention(input.vaccine, input.today)];
+  const rows = [
+    ...growthAttention(input.growth),
+    vaccineAttention(input.vaccine, input.today),
+  ];
   return rows
     .filter((row): row is AttentionItem => row !== null)
     .slice(0, ATTENTION_MAX);
diff --git a/lib/rules/growthAlerts.ts b/lib/rules/growthAlerts.ts
index 24d4464..522e228 100644
--- a/lib/rules/growthAlerts.ts
+++ b/lib/rules/growthAlerts.ts
@@ -261,3 +261,19 @@ export function growthAlerts(input: {
     ...alerts.filter((alert) => alert.level === "yellow"),
   ];
 }
+
+export type GrowthTone = "good" | "warn" | "danger";
+
+export const alertTone = (level: GrowthAlertLevel): "warn" | "danger" =>
+  level === "red" ? "danger" : "warn";
+
+// Spec 2026-11-25 §3.4: the chip on the growth card of the Sức khỏe page.
+export function growthStatus(alerts: GrowthAlert[]): {
+  text: string;
+  tone: GrowthTone;
+} {
+  if (alerts.some((alert) => alert.level === "red"))
+    return { text: "Nên đi khám", tone: "danger" };
+  if (alerts.length > 0) return { text: "Cần chú ý", tone: "warn" };
+  return { text: "Lớn đều", tone: "good" };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  168 passed (168)`, `Tests  1251 passed (1251)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/ui/StatusChip.tsx components/ui/statuschip.test.tsx lib/rules/growthAlerts.ts lib/rules/growthAlerts.test.ts lib/rules/attention.ts lib/rules/attention.test.ts components/health
git commit -m "feat(health): growth alerts on the Sức khỏe page: a status chip and rows in Cần chú ý" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M2a và hỏi người dùng trước khi lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  168 passed (168)`, `Tests  1251 passed (1251)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 9). Chạy `bun run dev`. Cỡ 375×812. Mở `http://localhost:3000/suc-khoe`:

1. Thẻ Tăng trưởng có chip ở cạnh mũi tên: "Lớn đều" (nền xanh), "Cần chú ý" (nền vàng) hoặc "Nên đi khám" (nền đỏ). Ghi lại đang thấy chip nào và số đo gần nhất của bé.
2. Chip, tên thẻ và mũi tên nằm trên một hàng, không chữ nào bị cắt hay xuống dòng.
3. Nếu chip không phải "Lớn đều": khối "Cần chú ý" có dòng của tăng trưởng đứng trên dòng tiêm chủng, dòng phụ đậm màu vàng hoặc đỏ. Nếu chip là "Lớn đều": không có dòng tăng trưởng nào.
4. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
5. Lặp mục 1–2 ở `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: chip đọc rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Trạng thái nào dữ liệu thật không cho thấy được (thường là chip vàng, chip đỏ và dòng "Cần chú ý" của tăng trưởng) thì ghi "chưa kiểm, có unit test".

**Kết quả (2026-11-25).** Task 1–3: mọi patch áp sạch; số đỏ và xanh khớp đúng `Expected` của từng task (đỏ 4 / 1205, xanh 1205; đỏ 1 file không chạy được, xanh 1236; đỏ 11 / 1247, xanh 1251). Step 1: `tsc --noEmit` sạch; `Test Files  168 passed (168)`, `Tests  1251 passed (1251)`. Step 2: `bun run build` lần đầu dừng với cảnh báo bảo mật của Next.js 16.4.3 (mã 1), lần hai `✓ Generating static pages using 9 workers (39/39)` và thoát mã 0; không chạy `next upgrade`. Step 3: người dùng chọn khung Browser trong app; cỡ 375×812 (`window.innerWidth` = 375); dev nối Supabase thật, chỉ xem, không chạm nút nào. Theme đang lưu trên máy là `dark`. Không dựng trang tạm: mọi mục dưới đây là trên trang thật `/suc-khoe`.

1. **Đạt, trên trang thật.** Thẻ Tăng trưởng có chip "Lớn đều" (lớp `bg-good-soft text-good-ink`) nằm ngay trước mũi tên. Số đo gần nhất: "Đo gần nhất 25/11", cân nặng 5,7 kg, chiều dài 56,9 cm, vòng đầu "—" (chưa có). Chip "Cần chú ý" (vàng) và "Nên đi khám" (đỏ): **chưa kiểm, có unit test** (`components/health/health.test.tsx`, `lib/rules/growthAlerts.test.ts`, `components/ui/statuschip.test.tsx`), vì dữ liệu thật không có cảnh báo nào.
2. **Đạt, trên trang thật.** Chip (x 241,6–312, cao 22 px), tên thẻ "Tăng trưởng" (cao 24 px, một dòng, kết thúc ở x 229,6), dòng "Đo gần nhất 25/11" (cao 18 px, một dòng) và mũi tên (x 324) nằm trong cùng một hàng cao 42 px; `scrollWidth` không lớn hơn `clientWidth` ở phần tử nào, không chữ nào bị cắt hay xuống dòng. Chưa đo với chip dài hơn ("Cần chú ý", "Nên đi khám").
3. **Đạt, trên trang thật, nhánh "Lớn đều".** Trang không có khối "Cần chú ý" nào (mũi tiêm kế tiếp là 12/12, chưa tới hạn), nên không có dòng tăng trưởng. Dòng tăng trưởng trong "Cần chú ý", thứ tự trên dòng tiêm chủng, dòng phụ đậm màu vàng hoặc đỏ: **chưa kiểm, có unit test** (`components/health/health.test.tsx`, `lib/rules/attention.test.ts`).
4. **Đạt, trên trang thật.** `document.documentElement.scrollWidth <= window.innerWidth` là `true` (375 và 375) ở cả bốn theme đã xem.
5. **Đạt, trên trang thật** ở `rose`, `light`, `dark`, `night` (đổi `dataset.theme` trong trang, không lưu). Số đo của mục 2 giống hệt nhau ở cả bốn theme. Chip đọc rõ; độ tương phản chữ trên nền chip: `rose` 6,47, `light` 6,97, `dark` 12,11, `night` 6,73. Ở `night` nền chip gần trùng nền thẻ, chữ chip màu hổ phách vẫn đọc rõ. `peach`, `lavender`, `sea` không nằm trong mục 5: **chưa kiểm**.

Ghi chú của lần kiểm:

- Console của trang không có lỗi nào.
- `preview_start` cần `.claude/launch.json`; đã viết file tạm (`bun run dev`, cổng 3000) và xóa sau khi dừng dev. `bun run dev` lần này chạy được ngay, không dừng vì cảnh báo bảo mật. Sau khi dừng dev, `tsc --noEmit` vẫn sạch.
- Chưa kiểm: iPhone thật, PWA đã cài, trạng thái đang tải (chưa có chip khi một bảng WHO chưa về; có unit test).

- [x] **Step 4: Commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md
git commit -m "docs(plan): record the M2a check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m2a
git push origin main
```
