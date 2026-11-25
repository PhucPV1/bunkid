# Kim Bun — Sức khỏe M2b: luật và khối giao diện của thẻ kết luận, thẻ cảnh báo Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (các phần của §5.3 mà M2c ghép vào màn; phần tương ứng của §9.1)

**Status:** approved 2026-11-25 (người dùng: "Duyệt năm plan"; chưa có lệnh chạy, mỗi lần lên `main` vẫn phải hỏi)

**Goal:** Có sẵn luật của thẻ kết luận, thanh vị trí, thẻ kết luận, thẻ cảnh báo, chấm trên thanh chọn chỉ số và hộp thoại giữa màn hình; trên màn hình app chưa đổi gì.

**Architecture:**

- **Luật thuần:** `lib/rules/growthView.ts` tính những gì thẻ kết luận hiện (`indicatorSummaries`), chỉ số mở sẵn (`defaultIndicator`) và chấm trên thanh chọn (`alertDots`).
- **Khối giao diện:** `PositionBar`, `GrowthVerdict`, `GrowthAlertCard` trong `components/growth/`; `Segmented` nhận thêm `dot` cho từng lựa chọn; `components/ui/Popup.tsx` là hộp thoại giữa màn hình, dùng lại được.
- Chưa màn nào dùng các khối này; M2c nối chúng vào màn Tăng trưởng.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m2b`, cắt từ `main` sau khi M2a đã lên (`main` lúc đó bằng `feat/kim-bun-suc-khoe-m2a`). Baseline: 1251 test vitest xanh (168 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                                        | Plan                                           |
| ------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| M1a, M1b, M1c      | §3, §4 dòng 2 và 3                                                              | đã xong, đã lên `main` @ `5ecc02c`             |
| M2a                | §5.1 luật cảnh báo, §5.2 câu so sánh; chip và dòng 1 của §4 trên trang Sức khỏe | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md` |
| **M2b (plan này)** | §5.3: luật và khối giao diện của thẻ kết luận, thẻ cảnh báo; popup              | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2b.md` |
| M2c                | §5.3: màn Tăng trưởng mở đầu bằng cảnh báo và kết luận                          | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2c.md` |
| M2d                | §5.4 biểu đồ                                                                    | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2d.md` |
| M2e                | §5.5 các lần đo; xóa `formatZ`                                                  | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2e.md` |
| M3                 | §6 Chiều cao, thẻ mục tiêu của §5.3                                             | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4                                  | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                                                    | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M2 chia năm plan.** Spec §10 ghi M2 là một mốc. Bản dựng thử cho thấy M2 dài quá một plan, nên cắt ở năm chỗ app vẫn chạy trọn vẹn: M2a có luật cảnh báo và đưa cảnh báo lên trang Sức khỏe; M2b thêm luật và khối giao diện của thẻ kết luận, thẻ cảnh báo (màn hình chưa đổi); M2c ghép chúng vào màn Tăng trưởng (biểu đồ và danh sách còn kiểu cũ); M2d đổi biểu đồ; M2e đổi danh sách các lần đo.
2. **Popup "Vì sao có cảnh báo này?"** là hộp thoại giữa màn hình mới, `components/ui/Popup.tsx`, dựng theo đúng hộp "Bỏ thay đổi?" của spec `2026-11-15-kim-bun-hong-diu-thuoc-popup-design.md` §5.2: lớp tối phủ kín, hộp đặc `bg-glass-solid` rộng tối đa 300 px, hiệu ứng `kb-pop-in`. Nó là một `<dialog>` mở bằng `showModal()`, có một nút "Đã hiểu"; Esc và chạm vùng tối cũng đóng. Chữ "Đã hiểu" không có trong spec, là chữ giao diện, không phải lời khuyên sức khỏe. M4 dùng lại hộp này cho "Giai đoạn kế".
3. **`{chênh}`** so với lần đo cùng chỉ số ở một ngày trước đó; dòng thứ hai trong cùng ngày không tính là "lần trước". Dấu trừ là ký tự "−" (U+2212).
4. **Chip của chỉ số không có cảnh báo** luôn là "Bình thường": theo §5.1, chỉ số có |z| > 2 luôn có cảnh báo.
5. **Chỉ số mở sẵn khi có nhiều cảnh báo** là chỉ số đứng trước theo thứ tự trên màn (Cân nặng, Chiều dài, Vòng đầu), không phải cảnh báo đỏ trước.
6. **Không có bước kiểm trình duyệt**, vì plan này không đổi gì trên màn hình.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `5ecc02c` và nối tiếp các plan trước của mốc M2; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn hoặc `var(--color-…)`. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 3 dừng lại hỏi, không tự push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.

## Contracts with Other Plans

Plan này đứng ngay sau M2a. M2c ghép mọi thứ dưới đây vào màn Tăng trưởng.

**Consumes (từ M2a, `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md`):** `growthAlerts`, `GrowthAlert`, `GrowthAlertKind`, `GrowthAlertLevel`, `GrowthTables`, `GrowthMeasure`, `GrowthTone`, `readings`, `alertTone` (`lib/rules/growthAlerts.ts`); `comparePhrase` (`lib/rules/growthForm.ts`); `StatusChip`. Từ code có sẵn: `Button`, `Segmented`; keyframe `kb-pop-in` trong `app/globals.css`.

**Produces:**

- `lib/rules/growthForm.ts`: `outOf100(percentile: number): number` (số nguyên 1–99).
- `lib/rules/growthView.ts`:
  - `IndicatorSummary = { indicator; title; value; chip: { text; tone: GrowthTone }; position: number; compare: string; change: string | null; measuredOn: string; ageDays: number }`;
  - `gaugePosition(z): number` (0–100), `formatChange(indicator, delta): string`;
  - `indicatorSummaries(input: { rows; tables; dob; sex; alerts }): IndicatorSummary[]`;
  - `defaultIndicator(alerts): WhoIndicator`, `alertDots(alerts): Partial<Record<WhoIndicator, "warn" | "danger">>`.
- `lib/rules/growthAlerts.ts`: `alertReason(kind: GrowthAlertKind): string`.
- `components/ui/Segmented.tsx`: `ChoiceOption` có thêm `dot?: "warn" | "danger"`.
- `components/ui/Popup.tsx`: `Popup({ title: string; onClose: () => void; children: ReactNode })` (gắn vào cây là mở) và `PopupView({ title; titleId; onClose; dialogRef?; children })` không có hook, để test.
- `components/growth/PositionBar.tsx`: `PositionBar({ position, label })`; `GrowthVerdict.tsx`: `GrowthVerdict({ babyName, measured, calm, summaries })`; `GrowthAlertCard.tsx`: `GrowthAlertCard({ alert, onWhy })`.
- **Vitest sau M2b:** 1286 test, 171 file.

---

### Task 1: Luật của thẻ kết luận (§5.3)

**Files:**

- Create: `lib/rules/growthView.ts`
- Modify: `lib/rules/growthForm.ts`
- Test: `lib/rules/growthView.test.ts` (mới)

**Interfaces:**

- Consumes: `readings`, `alertTone`, `GrowthAlert`, `GrowthMeasure`, `GrowthTables`, `GrowthTone`, `growthAlerts` (M2a); `comparePhrase`, `formatGrowthValue`, `INDICATORS`; `percentile`.
- Produces: `IndicatorSummary`, `gaugePosition`, `formatChange`, `indicatorSummaries`, `defaultIndicator`, `alertDots`; `outOf100`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m2b
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/growthView.test.ts b/lib/rules/growthView.test.ts
new file mode 100644
index 0000000..dcf8789
--- /dev/null
+++ b/lib/rules/growthView.test.ts
@@ -0,0 +1,172 @@
+import { describe, expect, it } from "vitest";
+import type { LmsRow } from "@/lib/content/who";
+import { addDays } from "./days";
+import {
+  type GrowthMeasure,
+  growthAlerts,
+  type GrowthTables,
+} from "./growthAlerts";
+import {
+  alertDots,
+  defaultIndicator,
+  formatChange,
+  gaugePosition,
+  indicatorSummaries,
+} from "./growthView";
+
+const DOB = "2026-01-01";
+const day = (age: number) => addDays(DOB, age);
+// z = value / 2 − 8 on every day (see growthAlerts.test.ts).
+const FLAT: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+  d,
+  1,
+  16,
+  0.125,
+]);
+const TABLES: GrowthTables = { wfa: FLAT, lhfa: FLAT, hcfa: FLAT };
+
+const measure = (
+  age: number,
+  kg: number | null,
+  cm: number | null = null,
+  headCm: number | null = null,
+): GrowthMeasure => ({
+  measured_on: day(age),
+  weight_g: kg === null ? null : Math.round(kg * 1000),
+  length_cm: cm,
+  head_cm: headCm,
+});
+
+const view = (rows: GrowthMeasure[], tables: GrowthTables = TABLES) => {
+  const base = { rows, tables, dob: DOB, sex: "boys" as const };
+  const alerts = growthAlerts({ ...base, babyName: "Bun" });
+  return { alerts, summaries: indicatorSummaries({ ...base, alerts }) };
+};
+
+// Spec 2026-11-25 §5.3.
+describe("gaugePosition", () => {
+  it("maps z −3…+3 onto 0…100 and stops at the ends", () => {
+    expect([-3, -2, 0, 2, 3].map(gaugePosition)).toEqual([
+      0,
+      (1 / 6) * 100,
+      50,
+      (5 / 6) * 100,
+      100,
+    ]);
+    expect(gaugePosition(-4.2)).toBe(0);
+    expect(gaugePosition(5)).toBe(100);
+  });
+});
+
+describe("formatChange", () => {
+  it("writes the sign, the amount and the unit", () => {
+    expect(formatChange("wfa", 6.1 - 4.6)).toBe("+1,5 kg");
+    expect(formatChange("lhfa", 61.5 - 55.2)).toBe("+6,3 cm");
+    expect(formatChange("hcfa", 0)).toBe("+0 cm");
+  });
+
+  it("a drop takes a real minus sign", () => {
+    expect(formatChange("wfa", -0.15)).toBe("−0,15 kg");
+  });
+});
+
+describe("indicatorSummaries", () => {
+  it("one entry per indicator that was ever measured, in weight, length, head order", () => {
+    const { summaries } = view([
+      measure(40, 16, 16),
+      measure(10, null, null, 16),
+    ]);
+    expect(summaries.map((s) => [s.indicator, s.title, s.value])).toEqual([
+      ["wfa", "Cân nặng", "16 kg"],
+      ["lhfa", "Chiều dài", "16 cm"],
+      ["hcfa", "Vòng đầu", "16 cm"],
+    ]);
+    expect(view([measure(40, 16)]).summaries.map((s) => s.indicator)).toEqual([
+      "wfa",
+    ]);
+  });
+
+  it("on the norm: Bình thường, the dot in the middle, the plain-words percentile", () => {
+    const [weight] = view([measure(40, 16)]).summaries;
+    expect(weight).toEqual({
+      indicator: "wfa",
+      title: "Cân nặng",
+      value: "16 kg",
+      chip: { text: "Bình thường", tone: "good" },
+      position: 50,
+      compare: "Nặng hơn 50 trong 100 bé trai cùng tuổi",
+      change: null,
+      measuredOn: day(40),
+      ageDays: 40,
+    });
+  });
+
+  it("the change is against the measurement of the same indicator just before", () => {
+    const { summaries } = view([
+      measure(86, 17.5, 16.3),
+      measure(60, null, 16),
+      measure(40, 16, 15),
+    ]);
+    expect(summaries.map((s) => s.change)).toEqual([
+      "+1,5 kg sau 46 ngày",
+      "+0,3 cm sau 26 ngày",
+    ]);
+  });
+
+  it("a second row on the same day is not the measurement before", () => {
+    const { summaries } = view([
+      measure(40, 16),
+      measure(40, 15),
+      measure(20, 15.5),
+    ]);
+    expect(summaries[0].change).toBe("+0,5 kg sau 20 ngày");
+  });
+
+  it("an alert gives the chip its text and tone", () => {
+    expect(view([measure(40, null, 11)]).summaries[0].chip).toEqual({
+      text: "Thấp",
+      tone: "warn",
+    });
+    expect(view([measure(40, null, 9)]).summaries[0].chip).toEqual({
+      text: "Rất thấp",
+      tone: "danger",
+    });
+  });
+
+  it("falling and rising say where the baby stood before instead of the change", () => {
+    const [length] = view([
+      measure(54, null, 13.34),
+      measure(40, null, 16),
+    ]).summaries;
+    expect(length.chip).toEqual({ text: "Tăng chậm", tone: "warn" });
+    expect(length.change).toBe("trước đó là 50 trong 100");
+    expect(length.compare).toBe("Dài hơn 9 trong 100 bé trai cùng tuổi");
+  });
+
+  it("an indicator whose table has not loaded is left out", () => {
+    expect(
+      view([measure(40, 16, 16)], { lhfa: FLAT }).summaries.map(
+        (s) => s.indicator,
+      ),
+    ).toEqual(["lhfa"]);
+  });
+
+  it("a measurement the table cannot place is not the latest", () => {
+    const [weight] = view([measure(1857, 20), measure(40, 16)]).summaries;
+    expect(weight.value).toBe("16 kg");
+  });
+});
+
+describe("defaultIndicator and alertDots", () => {
+  it("opens on weight when nothing is wrong", () => {
+    expect(defaultIndicator([])).toBe("wfa");
+    expect(alertDots([])).toEqual({});
+  });
+
+  it("opens on the first indicator, in screen order, that has an alert", () => {
+    const { alerts } = view([measure(40, 16, 11, 23)]);
+    expect(alerts.map((a) => a.indicator)).toEqual(["hcfa", "lhfa"]);
+    expect(defaultIndicator(alerts)).toBe("lhfa");
+    expect(alertDots(alerts)).toEqual({ lhfa: "warn", hcfa: "danger" });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 168 passed (169)`, `Tests  1251 passed (1251)`. File test mới không chạy được test nào vì chưa có `./growthView`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/rules/growthForm.ts b/lib/rules/growthForm.ts
index ff579bc..cc31848 100644
--- a/lib/rules/growthForm.ts
+++ b/lib/rules/growthForm.ts
@@ -113,6 +113,10 @@ export function formatPercentile(p: number): string {
 export const sexLabel = (sex: WhoSex) =>
   sex === "girls" ? "bé gái" : "bé trai";

+// "n trong 100": a whole number that never reads 0 or 100.
+export const outOf100 = (percentile: number) =>
+  Math.min(99, Math.max(1, Math.round(percentile)));
+
 // Spec 2026-11-25 §5.2: a percentile in plain words. The number stays within
 // 1–99 so it never reads "hơn 0" or "hơn 100".
 export function comparePhrase(
@@ -121,7 +125,7 @@ export function comparePhrase(
   sex: WhoSex,
   ageDays: number,
 ): string {
-  const n = Math.min(99, Math.max(1, Math.round(percentile)));
+  const n = outOf100(percentile);
   const word =
     indicator === "wfa"
       ? "Nặng hơn"
diff --git a/lib/rules/growthView.ts b/lib/rules/growthView.ts
new file mode 100644
index 0000000..e1b7519
--- /dev/null
+++ b/lib/rules/growthView.ts
@@ -0,0 +1,105 @@
+import type { WhoIndicator, WhoSex } from "@/lib/content/who";
+import { percentile } from "./growth";
+import {
+  alertTone,
+  type GrowthAlert,
+  type GrowthMeasure,
+  type GrowthTables,
+  type GrowthTone,
+  readings,
+} from "./growthAlerts";
+import {
+  comparePhrase,
+  formatGrowthValue,
+  INDICATORS,
+  outOf100,
+} from "./growthForm";
+
+// Spec 2026-11-25 §5.3: one block of the verdict card.
+export type IndicatorSummary = {
+  indicator: WhoIndicator;
+  title: string;
+  value: string;
+  chip: { text: string; tone: GrowthTone };
+  // 0–100: where the dot sits on the position bar.
+  position: number;
+  compare: string;
+  // "+1,5 kg sau 46 ngày", "trước đó là 45 trong 100", or null when there is
+  // no earlier measurement.
+  change: string | null;
+  measuredOn: string;
+  ageDays: number;
+};
+
+// z −3…+3 across the bar; anything beyond sits at the end.
+export function gaugePosition(z: number): number {
+  return Math.min(1, Math.max(0, (z + 3) / 6)) * 100;
+}
+
+// "+1,5 kg", "−0,2 cm": the difference between two values of one indicator.
+export function formatChange(indicator: WhoIndicator, delta: number): string {
+  return `${delta < 0 ? "−" : "+"}${formatGrowthValue(indicator, Math.abs(delta))}`;
+}
+
+export function indicatorSummaries(input: {
+  rows: GrowthMeasure[];
+  tables: GrowthTables;
+  dob: string;
+  sex: WhoSex;
+  alerts: GrowthAlert[];
+}): IndicatorSummary[] {
+  return INDICATORS.flatMap(({ key, title }): IndicatorSummary[] => {
+    const table = input.tables[key];
+    if (!table) return [];
+    const [latest, ...older] = readings(input.rows, table, input.dob, key);
+    if (!latest) return [];
+    const alert = input.alerts.find((item) => item.indicator === key);
+    const before = older.find((reading) => reading.day < latest.day);
+    const shifted =
+      alert && alert.previousPercentile !== null
+        ? `trước đó là ${outOf100(alert.previousPercentile)} trong 100`
+        : null;
+    return [
+      {
+        indicator: key,
+        title,
+        value: formatGrowthValue(key, latest.value),
+        chip: alert
+          ? { text: alert.chip, tone: alertTone(alert.level) }
+          : { text: "Bình thường", tone: "good" },
+        position: gaugePosition(latest.z),
+        compare: comparePhrase(
+          key,
+          percentile(latest.z),
+          input.sex,
+          latest.ageDays,
+        ),
+        change:
+          shifted ??
+          (before
+            ? `${formatChange(key, latest.value - before.value)} sau ${latest.ageDays - before.ageDays} ngày`
+            : null),
+        measuredOn: latest.day,
+        ageDays: latest.ageDays,
+      },
+    ];
+  });
+}
+
+// The indicator the page opens on: the first one, in screen order, with an alert.
+export function defaultIndicator(alerts: GrowthAlert[]): WhoIndicator {
+  return (
+    INDICATORS.find((item) =>
+      alerts.some((alert) => alert.indicator === item.key),
+    )?.key ?? "wfa"
+  );
+}
+
+// The dot next to an indicator's name in the picker.
+export function alertDots(
+  alerts: GrowthAlert[],
+): Partial<Record<WhoIndicator, "warn" | "danger">> {
+  return Object.fromEntries(
+    alerts.map((alert) => [alert.indicator, alertTone(alert.level)]),
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  169 passed (169)`, `Tests  1264 passed (1264)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/growthView.ts lib/rules/growthView.test.ts lib/rules/growthForm.ts
git commit -m "feat(growth): what the verdict card shows for each indicator" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Thanh vị trí, thẻ kết luận, thẻ cảnh báo, chấm trên thanh chọn, popup giữa màn hình (§5.3)

**Files:**

- Create: `components/growth/PositionBar.tsx`, `components/growth/GrowthVerdict.tsx`, `components/growth/GrowthAlertCard.tsx`, `components/ui/Popup.tsx`
- Modify: `components/ui/Segmented.tsx`, `lib/rules/growthAlerts.ts`
- Test: `components/growth/growthparts.test.tsx` (mới), `components/ui/popup.test.tsx` (mới), `components/ui/segmented.test.tsx`, `lib/rules/growthAlerts.test.ts`

**Interfaces:**

- Consumes: `IndicatorSummary` (Task 1); `GrowthAlert`, `GrowthAlertKind`, `GrowthAlertLevel`, `StatusChip` (M2a); icon `alert`, `check`; `Button`.
- Produces: `PositionBar`, `GrowthVerdict`, `GrowthAlertCard`; `Popup`, `PopupView`; `ChoiceOption.dot`; `alertReason(kind)`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/growth/growthparts.test.tsx b/components/growth/growthparts.test.tsx
new file mode 100644
index 0000000..7d2fcb1
--- /dev/null
+++ b/components/growth/growthparts.test.tsx
@@ -0,0 +1,182 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import type { GrowthAlert } from "@/lib/rules/growthAlerts";
+import type { IndicatorSummary } from "@/lib/rules/growthView";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { GrowthAlertCard } from "./GrowthAlertCard";
+import { GrowthVerdict } from "./GrowthVerdict";
+import { PositionBar } from "./PositionBar";
+
+const summary = (over: Partial<IndicatorSummary> = {}): IndicatorSummary => ({
+  indicator: "wfa",
+  title: "Cân nặng",
+  value: "6,1 kg",
+  chip: { text: "Bình thường", tone: "good" },
+  position: 52,
+  compare: "Nặng hơn 55 trong 100 bé trai cùng tuổi",
+  change: "+1,5 kg sau 46 ngày",
+  measuredOn: "2026-11-25",
+  ageDays: 76,
+  ...over,
+});
+
+const alert = (over: Partial<GrowthAlert> = {}): GrowthAlert => ({
+  indicator: "wfa",
+  kind: "falling",
+  level: "yellow",
+  title: "Cân nặng tăng chậm lại",
+  body: "Bun tăng 250 g trong 46 ngày, khoảng 5 g mỗi ngày.",
+  advice: "Nên hỏi bác sĩ ở lần khám tới.",
+  chip: "Tăng chậm",
+  measuredOn: "2026-11-25",
+  previousPercentile: 45,
+  ...over,
+});
+
+// Spec 2026-11-25 §5.3.
+describe("PositionBar", () => {
+  const html = renderToStaticMarkup(
+    <PositionBar position={52} label="Bình thường. Nặng hơn 55 trong 100" />,
+  );
+
+  it("is an image named by the chip and the comparison", () => {
+    expect(html).toContain(
+      'role="img" aria-label="Bình thường. Nặng hơn 55 trong 100"',
+    );
+  });
+
+  it("has a yellow sixth at each end and green between", () => {
+    expect(html).toContain(
+      '<span class="w-[16.7%] rounded-l-full bg-warn/35"></span>',
+    );
+    expect(html).toContain('<span class="flex-1 bg-good/35"></span>');
+    expect(html).toContain(
+      '<span class="w-[16.7%] rounded-r-full bg-warn/35"></span>',
+    );
+  });
+
+  it("puts the 20 px dot at the position", () => {
+    expect(html).toContain("size-5");
+    expect(html).toContain("border-glass-solid bg-ink");
+    expect(html).toContain('style="left:52%"');
+  });
+});
+
+describe("GrowthVerdict", () => {
+  const render = (calm: boolean, summaries = [summary()]) =>
+    renderToStaticMarkup(
+      <GrowthVerdict
+        babyName="Bun"
+        measured="Đo gần nhất 25/11 · 2 tháng 15 ngày"
+        calm={calm}
+        summaries={summaries}
+      />,
+    );
+
+  it("with no alert: a check, the calm heading and the day of the newest measurement", () => {
+    const html = render(true);
+    expect(html).toContain(">Bun đang lớn đều</h2>");
+    expect(html).toContain("bg-good-soft text-good-ink");
+    expect(html).toContain(`d="${ICON_PATHS.check}"`);
+    expect(html).toContain(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>");
+  });
+
+  it("with an alert: only the day line, no heading and no check", () => {
+    const html = render(false);
+    expect(html).not.toContain("đang lớn đều");
+    expect(html).not.toContain(ICON_PATHS.check);
+    expect(html).toContain(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>");
+  });
+
+  it("each indicator: its name, value, chip, bar and the comparison with the change", () => {
+    const html = render(true, [
+      summary(),
+      summary({
+        indicator: "lhfa",
+        title: "Chiều dài",
+        value: "61,5 cm",
+        chip: { text: "Tăng chậm", tone: "warn" },
+        position: 28,
+        compare: "Dài hơn 9 trong 100 bé trai cùng tuổi",
+        change: "trước đó là 45 trong 100",
+      }),
+    ]);
+    expect(html).toContain(">Cân nặng</span>");
+    expect(html).toContain(">6,1 kg</span>");
+    expect(html).toContain('bg-good-soft text-good-ink">Bình thường</span>');
+    expect(html).toContain(
+      ">Nặng hơn 55 trong 100 bé trai cùng tuổi · +1,5 kg sau 46 ngày</span>",
+    );
+    expect(html).toContain('bg-warn-soft text-warn-ink">Tăng chậm</span>');
+    expect(html).toContain(
+      'aria-label="Tăng chậm. Dài hơn 9 trong 100 bé trai cùng tuổi"',
+    );
+    expect(html).toContain('style="left:28%"');
+    expect(html).toContain(
+      ">Dài hơn 9 trong 100 bé trai cùng tuổi · trước đó là 45 trong 100</span>",
+    );
+    expect(html.match(/role="img"/g)).toHaveLength(2);
+  });
+
+  it("without an earlier measurement the comparison stands alone", () => {
+    expect(render(true, [summary({ change: null })])).toContain(
+      ">Nặng hơn 55 trong 100 bé trai cùng tuổi</span>",
+    );
+  });
+
+  it("ends with the legend of the two bar colours", () => {
+    const html = render(true);
+    expect(html.indexOf("Thấp hoặc cao hơn chuẩn")).toBeGreaterThan(
+      html.indexOf("+1,5 kg sau 46 ngày"),
+    );
+    expect(html).toContain("border-t border-line");
+  });
+});
+
+describe("GrowthAlertCard", () => {
+  it("yellow: warn colours, the alert icon, title, body, bold advice", () => {
+    const html = renderToStaticMarkup(
+      <GrowthAlertCard alert={alert()} onWhy={() => {}} />,
+    );
+    expect(html).toContain("border-warn/35 bg-warn-soft text-warn-ink");
+    expect(html).toContain("rounded-full bg-warn text-bg");
+    expect(html).toContain(`d="${ICON_PATHS.alert}"`);
+    expect(html).toContain(">Cân nặng tăng chậm lại</h2>");
+    expect(html).toContain(
+      ">Bun tăng 250 g trong 46 ngày, khoảng 5 g mỗi ngày.</p>",
+    );
+    expect(html).toContain(
+      '<p class="text-[15px] leading-5 font-bold">Nên hỏi bác sĩ ở lần khám tới.</p>',
+    );
+    expect(html).not.toContain("danger");
+  });
+
+  it("red: danger colours", () => {
+    const html = renderToStaticMarkup(
+      <GrowthAlertCard
+        alert={alert({ level: "red", kind: "veryLow" })}
+        onWhy={() => {}}
+      />,
+    );
+    expect(html).toContain("border-danger/35 bg-danger-soft text-danger-ink");
+    expect(html).toContain("rounded-full bg-danger-solid text-on-danger");
+    expect(html).not.toContain("warn");
+  });
+
+  it("links to the doctor report and asks why, both 44 px tall", () => {
+    const onWhy = vi.fn();
+    const card = <GrowthAlertCard alert={alert()} onWhy={onWhy} />;
+    const html = renderToStaticMarkup(card);
+    expect(html).toContain('href="/bao-cao"');
+    expect(html).toContain(">Báo cáo cho bác sĩ</a>");
+    expect(html.match(/min-h-11/g)).toHaveLength(2);
+    const [why] = findElements(
+      GrowthAlertCard({ alert: alert(), onWhy }),
+      (el) => el.type === "button",
+    );
+    expect(why.props.children).toBe("Vì sao có cảnh báo này?");
+    (why.props.onClick as () => void)();
+    expect(onWhy).toHaveBeenCalledOnce();
+  });
+});
diff --git a/components/ui/popup.test.tsx b/components/ui/popup.test.tsx
new file mode 100644
index 0000000..6103fd6
--- /dev/null
+++ b/components/ui/popup.test.tsx
@@ -0,0 +1,73 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { Popup, PopupView } from "./Popup";
+import { findElements } from "./testTree";
+
+// Spec 2026-11-25 §5.3: a short explanation in the middle of the screen, in
+// the look of the "Bỏ thay đổi?" dialog (spec 2026-11-15 §5.2).
+describe("Popup", () => {
+  const html = renderToStaticMarkup(
+    <Popup title="Vì sao có cảnh báo này?" onClose={() => {}}>
+      App so số đo của bé với chuẩn của WHO.
+    </Popup>,
+  );
+
+  it("is a modal dialog that fills the screen and centres its box", () => {
+    expect(html).toMatch(/^<dialog /);
+    expect(html).toContain("fixed inset-0");
+    expect(html).toContain("hidden");
+    expect(html).toContain("open:flex");
+    expect(html).toContain("items-center justify-center");
+    expect(html).toContain("backdrop:bg-black/40");
+  });
+
+  it("the box is solid, 300 px wide at most, with the title naming the dialog", () => {
+    expect(html).toContain(
+      "w-full max-w-[300px] rounded-[28px] bg-glass-solid p-[22px_18px_16px] text-center shadow-[0_20px_60px_rgb(0_0_0/0.3)]",
+    );
+    const id = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
+    expect(id).toBeTruthy();
+    expect(html).toContain(
+      `<h2 id="${id}" class="text-[19px] leading-6 font-bold text-ink">Vì sao có cảnh báo này?</h2>`,
+    );
+  });
+
+  it("shows the text and one button to close", () => {
+    expect(html).toContain(">App so số đo của bé với chuẩn của WHO.</div>");
+    expect(html.match(/<button/g)).toHaveLength(1);
+    expect(html).toContain(">Đã hiểu</button>");
+  });
+
+  it("the button closes it", () => {
+    const onClose = vi.fn();
+    const [button] = findElements(
+      PopupView({ title: "x", titleId: "t", onClose, children: "y" }),
+      (el) => el.props.children === "Đã hiểu",
+    );
+    (button.props.onClick as () => void)();
+    expect(onClose).toHaveBeenCalledOnce();
+  });
+
+  it("a tap on the dark area closes it, a tap inside the box does not", () => {
+    const onClose = vi.fn();
+    const [dialog] = findElements(
+      PopupView({ title: "x", titleId: "t", onClose, children: "y" }),
+      (el) => el.type === "dialog",
+    );
+    const click = dialog.props.onClick as (event: unknown) => void;
+    const area = {};
+    click({ target: {}, currentTarget: area });
+    expect(onClose).not.toHaveBeenCalled();
+    click({ target: area, currentTarget: area });
+    expect(onClose).toHaveBeenCalledOnce();
+  });
+
+  it("closing with Esc reports through the dialog's close event", () => {
+    const onClose = vi.fn();
+    const [dialog] = findElements(
+      PopupView({ title: "x", titleId: "t", onClose, children: "y" }),
+      (el) => el.type === "dialog",
+    );
+    expect(dialog.props.onClose).toBe(onClose);
+  });
+});
diff --git a/components/ui/segmented.test.tsx b/components/ui/segmented.test.tsx
index 985e89a..d856364 100644
--- a/components/ui/segmented.test.tsx
+++ b/components/ui/segmented.test.tsx
@@ -69,3 +69,34 @@ describe("Segmented label size", () => {
     ).toThrow("Segmented needs 2–6 options, got 7");
   });
 });
+
+// Spec 2026-11-25 §5.3: an indicator with an alert carries a dot.
+describe("Segmented option dot", () => {
+  const html = renderToStaticMarkup(
+    <Segmented
+      label="Chỉ số"
+      options={[
+        { value: "wfa", label: "Cân nặng", dot: "warn" },
+        { value: "lhfa", label: "Chiều dài" },
+        { value: "hcfa", label: "Vòng đầu", dot: "danger" },
+      ]}
+      value="wfa"
+      onChange={noop}
+    />,
+  );
+  const DOT = "ml-1.5 inline-block size-2 rounded-full align-middle";
+
+  it("draws an 8 px dot after the label, named for screen readers", () => {
+    expect(html).toContain(
+      `Cân nặng<span role="img" aria-label="có cảnh báo" class="${DOT} bg-warn"></span></button>`,
+    );
+    expect(html).toContain(
+      `Vòng đầu<span role="img" aria-label="có cảnh báo" class="${DOT} bg-danger"></span></button>`,
+    );
+  });
+
+  it("an option without a dot is drawn as before", () => {
+    expect(html).toContain(">Chiều dài</button>");
+    expect(html.match(/có cảnh báo/g)).toHaveLength(2);
+  });
+});
diff --git a/lib/rules/growthAlerts.test.ts b/lib/rules/growthAlerts.test.ts
index cbd7d7c..242a650 100644
--- a/lib/rules/growthAlerts.test.ts
+++ b/lib/rules/growthAlerts.test.ts
@@ -3,6 +3,7 @@ import type { LmsRow } from "@/lib/content/who";
 import { addDays } from "./days";
 import {
   ALERT_CHIP,
+  alertReason,
   type GrowthMeasure,
   type GrowthTables,
   growthAlerts,
@@ -368,3 +369,26 @@ describe("growthStatus", () => {
     });
   });
 });
+
+// Spec 2026-11-25 §5.3: the popup "Vì sao có cảnh báo này?".
+describe("alertReason", () => {
+  it("position alerts explain the WHO comparison", () => {
+    const text =
+      "App so số đo của bé với chuẩn tăng trưởng của WHO cho trẻ cùng tuổi, cùng giới. Số đo này nằm ngoài vùng của 95 trong 100 bé khỏe mạnh. Có bé vẫn khỏe dù nằm ngoài vùng này, nên bác sĩ là người kết luận.";
+    for (const kind of ["veryLow", "veryHigh", "low", "high"] as const)
+      expect(alertReason(kind)).toBe(text);
+  });
+
+  it("falling and rising explain the shift between measurements", () => {
+    const text =
+      "App so vị trí của bé trên biểu đồ WHO giữa các lần đo trong 6 tháng gần đây. Vị trí đã đổi hai dải trở lên. Đo lệch tay cũng có thể gây ra điều này, nên hãy đo lại rồi hỏi bác sĩ.";
+    expect(alertReason("falling")).toBe(text);
+    expect(alertReason("rising")).toBe(text);
+  });
+
+  it("loss explains that weight should only go up after two weeks", () => {
+    expect(alertReason("loss")).toBe(
+      "Sau hai tuần đầu, cân nặng của bé thường chỉ tăng. Lần cân này thấp hơn lần trước. Cân khác nhau hoặc cân lúc bé vừa bú cũng có thể gây lệch, nên hãy cân lại rồi hỏi bác sĩ.",
+    );
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  4 failed | 167 passed (171)`, `Tests  5 failed | 1264 passed (1269)`. Hai file `growthparts.test.tsx` và `popup.test.tsx` không chạy được test nào vì chưa có các component.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/growth/GrowthAlertCard.tsx b/components/growth/GrowthAlertCard.tsx
new file mode 100644
index 0000000..c0e6aa3
--- /dev/null
+++ b/components/growth/GrowthAlertCard.tsx
@@ -0,0 +1,66 @@
+import Link from "next/link";
+import { Icon } from "@/components/ui/Icon";
+import type { GrowthAlert, GrowthAlertLevel } from "@/lib/rules/growthAlerts";
+import { cx } from "@/lib/ui/cx";
+
+const TONE: Record<GrowthAlertLevel, { card: string; solid: string }> = {
+  yellow: {
+    card: "border-warn/35 bg-warn-soft text-warn-ink",
+    solid: "bg-warn text-bg",
+  },
+  red: {
+    card: "border-danger/35 bg-danger-soft text-danger-ink",
+    solid: "bg-danger-solid text-on-danger",
+  },
+};
+
+// Spec 2026-11-25 §5.3: one growth alert at the top of the page.
+export function GrowthAlertCard({
+  alert,
+  onWhy,
+}: {
+  alert: GrowthAlert;
+  onWhy: () => void;
+}) {
+  const tone = TONE[alert.level];
+  return (
+    <section
+      aria-label={alert.title}
+      className={cx("flex flex-col gap-3 rounded-[26px] border p-4", tone.card)}
+    >
+      <div className="flex items-start gap-3">
+        <span
+          className={cx(
+            "flex size-11 shrink-0 items-center justify-center rounded-full",
+            tone.solid,
+          )}
+        >
+          <Icon name="alert" size={22} />
+        </span>
+        <div className="flex min-w-0 flex-col gap-1">
+          <h2 className="text-xl leading-[26px] font-bold">{alert.title}</h2>
+          <p className="text-[15px] leading-5">{alert.body}</p>
+        </div>
+      </div>
+      <p className="text-[15px] leading-5 font-bold">{alert.advice}</p>
+      <div className="flex flex-wrap gap-2">
+        <Link
+          href="/bao-cao"
+          className={cx(
+            "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
+            tone.solid,
+          )}
+        >
+          Báo cáo cho bác sĩ
+        </Link>
+        <button
+          type="button"
+          onClick={onWhy}
+          className="min-h-11 rounded-full px-3.5 text-sm font-semibold underline"
+        >
+          Vì sao có cảnh báo này?
+        </button>
+      </div>
+    </section>
+  );
+}
diff --git a/components/growth/GrowthVerdict.tsx b/components/growth/GrowthVerdict.tsx
new file mode 100644
index 0000000..ef3f3a6
--- /dev/null
+++ b/components/growth/GrowthVerdict.tsx
@@ -0,0 +1,71 @@
+import { Icon } from "@/components/ui/Icon";
+import { StatusChip } from "@/components/ui/StatusChip";
+import type { IndicatorSummary } from "@/lib/rules/growthView";
+import { PositionBar } from "./PositionBar";
+
+const SUB = "text-[13px] leading-[18px] text-muted";
+
+// Spec 2026-11-25 §5.3: the verdict in words, one block per indicator.
+export function GrowthVerdict({
+  babyName,
+  measured,
+  calm,
+  summaries,
+}: {
+  babyName: string;
+  // "Đo gần nhất {dd/mm} · {tuổi}".
+  measured: string;
+  // No alert: the card opens with the reassuring heading.
+  calm: boolean;
+  summaries: IndicatorSummary[];
+}) {
+  return (
+    <section className="glass flex flex-col gap-4 rounded-[26px] p-4">
+      {calm ? (
+        <div className="flex items-center gap-3">
+          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-good-soft text-good-ink">
+            <Icon name="check" size={22} />
+          </span>
+          <div className="flex min-w-0 flex-col">
+            <h2 className="text-xl leading-[26px] font-bold text-ink">
+              {babyName} đang lớn đều
+            </h2>
+            <span className={SUB}>{measured}</span>
+          </div>
+        </div>
+      ) : (
+        <span className={SUB}>{measured}</span>
+      )}
+      {summaries.map((item) => (
+        <div key={item.indicator} className="flex flex-col gap-2">
+          <div className="flex items-center gap-2">
+            <span className="flex-1 text-[15px] font-semibold text-ink">
+              {item.title}
+            </span>
+            <span className="text-base font-bold text-ink tabular-nums">
+              {item.value}
+            </span>
+            <StatusChip tone={item.chip.tone}>{item.chip.text}</StatusChip>
+          </div>
+          <PositionBar
+            position={item.position}
+            label={`${item.chip.text}. ${item.compare}`}
+          />
+          <span className={SUB}>
+            {item.change ? `${item.compare} · ${item.change}` : item.compare}
+          </span>
+        </div>
+      ))}
+      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-line pt-3 text-xs text-muted">
+        <span className="flex items-center gap-1.5">
+          <span className="h-2 w-3.5 rounded-full bg-good/35" />
+          Bình thường
+        </span>
+        <span className="flex items-center gap-1.5">
+          <span className="h-2 w-3.5 rounded-full bg-warn/35" />
+          Thấp hoặc cao hơn chuẩn
+        </span>
+      </div>
+    </section>
+  );
+}
diff --git a/components/growth/PositionBar.tsx b/components/growth/PositionBar.tsx
new file mode 100644
index 0000000..bf34c50
--- /dev/null
+++ b/components/growth/PositionBar.tsx
@@ -0,0 +1,26 @@
+// Spec 2026-11-25 §5.3: where a measurement sits between z −3 and z +3. The
+// middle two thirds (z −2 to +2) are the normal range.
+export function PositionBar({
+  position,
+  label,
+}: {
+  // 0–100, from gaugePosition.
+  position: number;
+  label: string;
+}) {
+  return (
+    <span
+      role="img"
+      aria-label={label}
+      className="relative my-[5px] flex h-2.5"
+    >
+      <span className="w-[16.7%] rounded-l-full bg-warn/35" />
+      <span className="flex-1 bg-good/35" />
+      <span className="w-[16.7%] rounded-r-full bg-warn/35" />
+      <span
+        className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-glass-solid bg-ink"
+        style={{ left: `${position}%` }}
+      />
+    </span>
+  );
+}
diff --git a/components/ui/Popup.tsx b/components/ui/Popup.tsx
new file mode 100644
index 0000000..bf76fb0
--- /dev/null
+++ b/components/ui/Popup.tsx
@@ -0,0 +1,81 @@
+"use client";
+
+import {
+  type MouseEvent,
+  type ReactNode,
+  type Ref,
+  useEffect,
+  useId,
+  useRef,
+} from "react";
+import { Button } from "./Button";
+
+// The dialog without its hooks, so tests can read it as a plain tree.
+export function PopupView({
+  title,
+  titleId,
+  onClose,
+  dialogRef,
+  children,
+}: {
+  title: string;
+  titleId: string;
+  onClose: () => void;
+  dialogRef?: Ref<HTMLDialogElement>;
+  children: ReactNode;
+}) {
+  return (
+    <dialog
+      ref={dialogRef}
+      aria-labelledby={titleId}
+      // Esc closes a modal dialog by itself and fires this event.
+      onClose={onClose}
+      onClick={(event: MouseEvent<HTMLDialogElement>) => {
+        if (event.target === event.currentTarget) onClose();
+      }}
+      className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-6 backdrop:bg-black/40 open:flex"
+    >
+      <div className="w-full max-w-[300px] rounded-[28px] bg-glass-solid p-[22px_18px_16px] text-center shadow-[0_20px_60px_rgb(0_0_0/0.3)] animate-[kb-pop-in_180ms_cubic-bezier(0.32,0.72,0,1)]">
+        <h2 id={titleId} className="text-[19px] leading-6 font-bold text-ink">
+          {title}
+        </h2>
+        <div className="mt-2 text-[15px] leading-5 text-muted">{children}</div>
+        <div className="mt-4 flex flex-col">
+          <Button variant="secondary" block onClick={onClose}>
+            Đã hiểu
+          </Button>
+        </div>
+      </div>
+    </dialog>
+  );
+}
+
+// Spec 2026-11-25 §5.3: a short explanation in the middle of the screen, in
+// the look of the "Bỏ thay đổi?" dialog (spec 2026-11-15 §5.2). Mount it to
+// open it; it asks to be unmounted through onClose.
+export function Popup({
+  title,
+  onClose,
+  children,
+}: {
+  title: string;
+  onClose: () => void;
+  children: ReactNode;
+}) {
+  const ref = useRef<HTMLDialogElement>(null);
+  const titleId = useId();
+  useEffect(() => {
+    const dialog = ref.current;
+    if (dialog && !dialog.open) dialog.showModal();
+  }, []);
+  return (
+    <PopupView
+      title={title}
+      titleId={titleId}
+      onClose={onClose}
+      dialogRef={ref}
+    >
+      {children}
+    </PopupView>
+  );
+}
diff --git a/components/ui/Segmented.tsx b/components/ui/Segmented.tsx
index 5a43fa4..29f3866 100644
--- a/components/ui/Segmented.tsx
+++ b/components/ui/Segmented.tsx
@@ -1,6 +1,12 @@
 import { cx } from "@/lib/ui/cx";

-export type ChoiceOption<T extends string> = { value: T; label: string };
+export type ChoiceOption<T extends string> = {
+  value: T;
+  label: string;
+  // Spec 2026-11-25 §5.3: a small dot after the label, for an option that
+  // has an alert.
+  dot?: "warn" | "danger";
+};

 export function Segmented<T extends string>({
   label,
@@ -44,6 +50,16 @@ export function Segmented<T extends string>({
             )}
           >
             {option.label}
+            {option.dot && (
+              <span
+                role="img"
+                aria-label="có cảnh báo"
+                className={cx(
+                  "ml-1.5 inline-block size-2 rounded-full align-middle",
+                  option.dot === "danger" ? "bg-danger" : "bg-warn",
+                )}
+              />
+            )}
           </button>
         );
       })}
diff --git a/lib/rules/growthAlerts.ts b/lib/rules/growthAlerts.ts
index 522e228..bcf91a6 100644
--- a/lib/rules/growthAlerts.ts
+++ b/lib/rules/growthAlerts.ts
@@ -277,3 +277,18 @@ export function growthStatus(alerts: GrowthAlert[]): {
   if (alerts.length > 0) return { text: "Cần chú ý", tone: "warn" };
   return { text: "Lớn đều", tone: "good" };
 }
+
+const REASON_POSITION =
+  "App so số đo của bé với chuẩn tăng trưởng của WHO cho trẻ cùng tuổi, cùng giới. Số đo này nằm ngoài vùng của 95 trong 100 bé khỏe mạnh. Có bé vẫn khỏe dù nằm ngoài vùng này, nên bác sĩ là người kết luận.";
+const REASON_SHIFT =
+  "App so vị trí của bé trên biểu đồ WHO giữa các lần đo trong 6 tháng gần đây. Vị trí đã đổi hai dải trở lên. Đo lệch tay cũng có thể gây ra điều này, nên hãy đo lại rồi hỏi bác sĩ.";
+const REASON_LOSS =
+  "Sau hai tuần đầu, cân nặng của bé thường chỉ tăng. Lần cân này thấp hơn lần trước. Cân khác nhau hoặc cân lúc bé vừa bú cũng có thể gây lệch, nên hãy cân lại rồi hỏi bác sĩ.";
+
+// Spec 2026-11-25 §5.3: the one paragraph of the popup "Vì sao có cảnh báo này?".
+export function alertReason(kind: GrowthAlertKind): string {
+  if (kind === "loss") return REASON_LOSS;
+  return kind === "falling" || kind === "rising"
+    ? REASON_SHIFT
+    : REASON_POSITION;
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  171 passed (171)`, `Tests  1286 passed (1286)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/growth/PositionBar.tsx components/growth/GrowthVerdict.tsx components/growth/GrowthAlertCard.tsx components/growth/growthparts.test.tsx components/ui/Popup.tsx components/ui/popup.test.tsx components/ui/Segmented.tsx components/ui/segmented.test.tsx lib/rules/growthAlerts.ts lib/rules/growthAlerts.test.ts
git commit -m "feat(growth): position bar, verdict card, alert card, picker dot, centred popup" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M2b và hỏi người dùng trước khi lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  171 passed (171)`, `Tests  1286 passed (1286)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

**Kết quả (2026-11-25).** Nhánh `feat/kim-bun-suc-khoe-m2b` cắt từ `main` @ `6d20b34`. Task 1–2: cả 4 patch áp sạch bằng `kb_patch`; số đỏ và xanh khớp đúng `Expected` của từng task (Task 1: đỏ `1 failed | 168 passed (169)` / 1251, xanh 169 file / 1264; Task 2: đỏ `4 failed | 167 passed (171)`, `5 failed | 1264 passed (1269)`, xanh 171 file / 1286); `tsc --noEmit` sạch sau mỗi task. Commit: `dc00981` (Task 1), `74de745` (Task 2). Step 1: `tsc --noEmit` sạch (mã 0); `Test Files  171 passed (171)`, `Tests  1286 passed (1286)`. Step 2: `bun run build` lần đầu dừng với cảnh báo bảo mật của Next.js 16.4.3 (mã 1), lần hai `✓ Compiled successfully`, `✓ Generating static pages using 9 workers (39/39)` và thoát mã 0; không chạy `next upgrade`. Sau build cây làm việc không có file nào đổi. Không có bước kiểm trình duyệt: plan này không đổi gì trên màn hình, chưa màn nào dùng các khối mới; không chạy `bun run dev`, không mở trình duyệt.

Chưa kiểm, có unit test: `PositionBar`, `GrowthVerdict`, `GrowthAlertCard`, chấm của `Segmented` và `Popup` chưa được nhìn trên màn hình thật ở theme nào (test chỉ đọc markup tĩnh và cây phần tử); `showModal()`, phím Esc và hiệu ứng `kb-pop-in` của `Popup` chưa chạy trong trình duyệt. M2c ghép các khối này vào màn Tăng trưởng và có bước kiểm trình duyệt.

- [x] **Step 3: Commit phần ghi kết quả rồi dừng lại hỏi người dùng**

Ghi kết quả của Step 1 và Step 2 ngay dưới Step 2. Plan này không đổi gì trên màn hình nên không có bước kiểm trình duyệt.

```bash
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2b.md
git commit -m "docs(plan): record the M2b check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; nói rõ plan này không đổi gì trên màn hình nên không có bước kiểm trình duyệt. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m2b
git push origin main
```
