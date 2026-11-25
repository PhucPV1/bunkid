# Kim Bun — Sức khỏe M2f: bình thường nhưng gần ranh, và số chuẩn trên thẻ kết luận Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§5.6, trừ chip của thẻ Tăng trưởng ở trang Sức khỏe; câu về gần ranh ở §5.1 và §5.5; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng duyệt cả các chỗ sửa spec nêu ở mục Diễn giải spec)

**Goal:** Màn Tăng trưởng nói rõ khi một số đo còn trong chuẩn nhưng sát ranh ("Gần mức thấp", "Gần mức cao"), và viết chuẩn thành ba con số ngay dưới thanh vị trí để người đọc tự so.

**Architecture:**

- **Luật thuần:** `nearKind` và `growthStatus` (nhận thêm danh sách gần ranh) trong `lib/rules/growthAlerts.ts`; `standardRange` trong `lib/rules/growth.ts`; `lib/rules/growthView.ts` tính cho từng chỉ số trạng thái gần ranh, ba nhãn số chuẩn, câu đọc cho trình đọc màn hình và dòng "Cách mức…", thêm `verdictHead` (tiêu đề và dòng nhắc của thẻ kết luận), và cho `listRows` biết gần ranh.
- **Khối giao diện:** `StandardLabels` (ba nhãn dưới thanh) nằm cùng file với `PositionBar` vì chúng dùng chung các mốc 16,7% và 83,3%; `GrowthVerdict` nhận `head` thay cho `babyName` và `calm`; `GrowthScreen` nối `verdictHead` vào.
- Gần ranh không phải cảnh báo: không thẻ cảnh báo, không dòng "Cần chú ý", không chấm trên thanh chọn, không đổi màu chấm của biểu đồ. Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m2f`, cắt từ `main` @ `da04808` (đã có M2a đến M2e và các bản sửa sau lần kiểm trình duyệt). Baseline: 1343 test vitest xanh (172 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                 | Plan                                           |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| M1a, M1b, M1c      | §3, §4 dòng 2 và 3                                       | đã xong, ở `main`                              |
| M2a đến M2e        | §5.1 đến §5.5, chip và dòng 1 của §4 trên trang Sức khỏe | đã xong, ở `main` @ `da04808`                  |
| **M2f (plan này)** | §5.6: luật gần ranh, số chuẩn, thẻ kết luận              | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2f.md` |
| M2g                | §5.5 hàng danh sách khi chip dài; chip gần ranh của §3.4 | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2g.md` |
| M3                 | §6 Chiều cao, thẻ mục tiêu của §5.3                      | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4           | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                             | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **§5.6 chia hai plan** (spec §10 đã ghi lại). Làm một plan thì bản dựng thử ra khoảng 1.900 dòng, quá sức đọc, nên cắt ở chỗ app vẫn chạy trọn vẹn: **M2f** có luật gần ranh, số chuẩn và thẻ kết luận của màn Tăng trưởng (điều người dùng hỏi: ghi "bình thường nhưng gần mức thấp" và cho thấy chuẩn là bao nhiêu); **M2g** lo hàng của danh sách khi chip dài và chip gần ranh trên trang Sức khỏe. **Giữa hai plan, trong lúc M2f đã lên `main` mà M2g chưa:** thẻ Tăng trưởng ở trang Sức khỏe vẫn ghi "Lớn đều" dù màn Tăng trưởng đã ghi "Gần mức thấp"; và hàng danh sách còn bố cục của M2e, nên với bé từ 10 tháng tuổi, tiêu đề dài như "25/11 · 11 tháng 29 ngày" đứng cạnh chip "Gần mức thấp" có thể bị ngắt làm hai dòng (bé nhà mình 2 tháng 15 ngày nên chưa gặp). Nếu không muốn `main` có quãng lệch này, người dùng có thể giữ M2f trên nhánh, cho chạy M2g từ nhánh đó, rồi đẩy cả hai một lần.
2. **Hai ranh của chuẩn làm tròn vào trong** (ranh thấp làm tròn lên, ranh cao làm tròn xuống, tới 1 chữ số thập phân); mức giữa làm tròn nửa lên. **Đây là chỗ sửa spec sau lần đọc của reviewer; người dùng đã duyệt cùng plan này ngày 2026-11-25** (§5.6 đã ghi, có đánh dấu). Bản spec người dùng duyệt ghi cả ba số làm tròn nửa lên; làm vậy thì bé trai 76 ngày tuổi dài 55,9 cm bị báo "Thấp" (ranh chính xác là 55,945 cm) trong khi nhãn lại ghi mức thấp nhất của chuẩn là "55,9 cm". Làm tròn vào trong thì nhãn ghi "56,0 cm", và số đo 56,9 cm ra "Cách mức thấp nhất của chuẩn 0,9 cm", đúng như bản vẽ. Phép làm tròn trừ đi một lề 1e-6 để tích số thực như 3,9000000000000004 vẫn là 3,9.
3. **`{d}` tính từ số đo đã làm tròn 1 chữ số thập phân**, đúng như §5.6 ghi, kể cả với cân nặng mà thẻ đang viết tới 2 chữ số ("5,72 kg"): khi đó người đọc tự trừ sẽ lệch tối đa 0,05 kg so với `{d}`. Người dùng cần biết khi duyệt.
4. **"Sát mức … của chuẩn"** hiện khi số đo đã làm tròn bằng ranh đã viết, hoặc nằm quá nó. Trường hợp sau chỉ có với cân nặng: ranh thấp 4,61 kg viết "4,7 kg", bé nặng 4,62 kg còn trong chuẩn nhưng đọc ra 4,6.
5. **`nearKind` so trực tiếp, không dung sai**, như `positionKind` và `rateZ`: z = −2 và z = +2 là gần ranh; z = −1 và z = +1 thì không.
6. **`aria-label` của biểu đồ** đọc chip của lần gần nhất (§5.4), nên với chỉ số gần ranh nó thành "… Lần gần nhất: Gần mức thấp." Hình vẽ của biểu đồ không đổi.
7. **Chip của hàng danh sách** theo thứ tự: chip của cảnh báo gắn vào hàng đó → "Rất thấp"/"Rất cao" → "Thấp"/"Cao" → gần ranh (chỉ số đầu tiên theo thứ tự cân nặng, chiều dài, vòng đầu) → "Bình thường".
8. **Tên chỉ số trong dòng nhắc** viết thường từ tên thứ hai trở đi bằng `toLocaleLowerCase("vi")`: "Cân nặng, chiều dài và vòng đầu".
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
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2f.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `da04808`. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang tạm của task cuối đã qua `tsc --noEmit`, và các trường hợp của nó đã được chạy qua luật với bảng WHO thật (chữ kỳ vọng ở bước trình duyệt lấy từ lần chạy đó). Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 4 dừng lại hỏi, không tự push. Người dùng không muốn đẩy một thay đổi còn lỗi đã biết: nếu bước trình duyệt lộ ra lỗi thì nêu lỗi và cách sửa trước, rồi mới hỏi.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn).

## Contracts with Other Plans

Plan này đứng sau M2e (đã ở `main` @ `da04808`). M2g đứng ngay sau và dùng mọi thứ dưới đây.

**Consumes (từ M2a đến M2e, đã ở `main`):** `positionKind`, `ALERT_CHIP`, `alertTone`, `growthStatus`, `readings`, `GrowthAlert`, `GrowthMeasure`, `GrowthTables`, `GrowthTone` (`lib/rules/growthAlerts.ts`); `valueAtZ`, `lmsAt`, `zScore`, `percentile`, `Lms` (`lib/rules/growth.ts`); `IndicatorSummary`, `indicatorSummaries`, `listRows`, `GrowthListItem` (`lib/rules/growthView.ts`); `PositionBar`, `GrowthVerdict`, `GrowthScreen`; `StatusChip`.

**Produces:**

- `lib/rules/growth.ts`: `standardRange(lms: Lms): { low: number; mid: number; high: number }`.
- `lib/rules/growthAlerts.ts`: `NearKind = "nearLow" | "nearHigh"`; `NEAR_CHIP: Record<NearKind, string>`; `nearKind(z: number): NearKind | null`; `growthStatus(alerts: GrowthAlert[], near?: (NearKind | null)[]): { text: string; tone: GrowthTone }`.
- `lib/rules/growthView.ts`:
  - `IndicatorSummary` có thêm `near: NearKind | null`, `standard: { low: string; mid: string; high: string }`, `barLabel: string`, `nearLine: string | null`;
  - `VerdictHead = { heading: string | null; note: { strong: string[]; rest: string } | null }`, `verdictHead(input: { babyName: string; alerts: GrowthAlert[]; summaries: IndicatorSummary[] }): VerdictHead`;
  - `listRows` trả chip "Gần mức thấp" hoặc "Gần mức cao" (tone `warn`) cho hàng gần ranh.
- `components/growth/PositionBar.tsx`: `StandardLabels({ standard: IndicatorSummary["standard"]; near: NearKind | null })`.
- `components/growth/GrowthVerdict.tsx`: `GrowthVerdict({ head: VerdictHead; measured: string; summaries: IndicatorSummary[] })` (bỏ `babyName` và `calm`).
- **Vitest sau M2f:** 1383 test, 172 file.

---

### Task 1: Luật gần ranh và số chuẩn (§5.6)

**Files:**

- Modify: `lib/rules/growth.ts`, `lib/rules/growthAlerts.ts`
- Test: `lib/rules/growth.test.ts`, `lib/rules/growthAlerts.test.ts`

**Interfaces:**

- Consumes: `valueAtZ`, `Lms`; `GrowthAlert`, `GrowthTone`, `growthStatus`.
- Produces: `standardRange(lms)`; `NearKind`, `NEAR_CHIP`, `nearKind(z)`; `growthStatus(alerts, near?)`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m2f
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/growth.test.ts b/lib/rules/growth.test.ts
index d151bb0..f73fc40 100644
--- a/lib/rules/growth.test.ts
+++ b/lib/rules/growth.test.ts
@@ -13,6 +13,7 @@ import {
   normalCdf,
   percentile,
   rateZ,
+  standardRange,
   valueAtZ,
   zScore,
   type LmsRow,
@@ -167,3 +168,24 @@ describe("curve", () => {
     expect(Object.keys(growth)).not.toContain("PERCENTILE_LINES");
   });
 });
+
+// Spec 2026-11-25 §5.6: the norm in numbers.
+describe("standardRange", () => {
+  it("is the value at z −2, the median, and the value at z +2", () => {
+    expect(standardRange({ l: 1, m: 16, s: 0.125 })).toEqual({
+      low: 12,
+      mid: 16,
+      high: 20,
+    });
+  });
+
+  it("follows a skewed table: the two ends are not the same distance from the median", () => {
+    // WHO weight-for-age, boys, at birth.
+    const lms = { l: 0.3487, m: 3.3464, s: 0.14602 };
+    const range = standardRange(lms);
+    expect(range.mid).toBe(lms.m);
+    expect(zScore(lms, range.low)).toBeCloseTo(-2, 9);
+    expect(zScore(lms, range.high)).toBeCloseTo(2, 9);
+    expect(range.high - range.mid).toBeGreaterThan(range.mid - range.low);
+  });
+});
diff --git a/lib/rules/growthAlerts.test.ts b/lib/rules/growthAlerts.test.ts
index 242a650..60fe716 100644
--- a/lib/rules/growthAlerts.test.ts
+++ b/lib/rules/growthAlerts.test.ts
@@ -8,6 +8,8 @@ import {
   type GrowthTables,
   growthAlerts,
   growthStatus,
+  NEAR_CHIP,
+  nearKind,
   positionKind,
   readings,
 } from "./growthAlerts";
@@ -368,6 +370,79 @@ describe("growthStatus", () => {
       tone: "danger",
     });
   });
+
+  // Spec 2026-11-25 §5.6: with no alert, the indicators near the edge speak.
+  it("no alert, near the low edge only: Gần mức thấp", () => {
+    expect(growthStatus([], ["nearLow", null, "nearLow"])).toEqual({
+      text: "Gần mức thấp",
+      tone: "warn",
+    });
+  });
+
+  it("no alert, near the high edge only: Gần mức cao", () => {
+    expect(growthStatus([], [null, "nearHigh"])).toEqual({
+      text: "Gần mức cao",
+      tone: "warn",
+    });
+  });
+
+  it("no alert, one near each edge: Gần ranh chuẩn", () => {
+    expect(growthStatus([], ["nearHigh", "nearLow", null])).toEqual({
+      text: "Gần ranh chuẩn",
+      tone: "warn",
+    });
+  });
+
+  it("nothing near: still Lớn đều", () => {
+    expect(growthStatus([], [null, null, null])).toEqual({
+      text: "Lớn đều",
+      tone: "good",
+    });
+  });
+
+  it("an alert always wins over an indicator near the edge", () => {
+    expect(growthStatus(run([length(40, 11)]), ["nearLow"])).toEqual({
+      text: "Cần chú ý",
+      tone: "warn",
+    });
+    expect(growthStatus(run([weight(40, 9)]), ["nearHigh"])).toEqual({
+      text: "Nên đi khám",
+      tone: "danger",
+    });
+  });
+});
+
+// Spec 2026-11-25 §5.6: inside the norm, but close to its edge.
+describe("nearKind", () => {
+  it("is near the low edge from −2 up to, but not at, −1", () => {
+    expect([-2, -1.5, -1.01].map(nearKind)).toEqual([
+      "nearLow",
+      "nearLow",
+      "nearLow",
+    ]);
+    expect(nearKind(-1)).toBeNull();
+  });
+
+  it("is near the high edge above +1, up to and at +2", () => {
+    expect(nearKind(1)).toBeNull();
+    expect([1.01, 1.5, 2].map(nearKind)).toEqual([
+      "nearHigh",
+      "nearHigh",
+      "nearHigh",
+    ]);
+  });
+
+  it("is null in the middle of the norm and outside it", () => {
+    for (const z of [-3.01, -3, -2.01, -0.99, 0, 0.99, 2.01, 3, 3.01])
+      expect(nearKind(z), String(z)).toBeNull();
+  });
+
+  it("each kind has its chip", () => {
+    expect(NEAR_CHIP).toEqual({
+      nearLow: "Gần mức thấp",
+      nearHigh: "Gần mức cao",
+    });
+  });
 });

 // Spec 2026-11-25 §5.3: the popup "Vì sao có cảnh báo này?".
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  2 failed | 170 passed (172)`, `Tests  9 failed | 1345 passed (1354)`. Lý do đỏ: chưa có `standardRange`, `nearKind`, `NEAR_CHIP`; `growthStatus` chưa đọc danh sách gần ranh.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/rules/growth.ts b/lib/rules/growth.ts
index f763eb9..7ea1eae 100644
--- a/lib/rules/growth.ts
+++ b/lib/rules/growth.ts
@@ -32,6 +32,16 @@ export function valueAtZ(lms: Lms, z: number): number {
   return lms.m * (1 + lms.l * lms.s * z) ** (1 / lms.l);
 }

+// Spec 2026-11-25 §5.6: the norm in numbers, on one day of age: the two edges
+// of the normal band and its median.
+export function standardRange(lms: Lms): {
+  low: number;
+  mid: number;
+  high: number;
+} {
+  return { low: valueAtZ(lms, -2), mid: lms.m, high: valueAtZ(lms, 2) };
+}
+
 // Standard normal CDF via erf (Abramowitz & Stegun 7.1.26, error < 1.5e-7).
 export function normalCdf(z: number): number {
   const x = Math.abs(z) / Math.SQRT2;
diff --git a/lib/rules/growthAlerts.ts b/lib/rules/growthAlerts.ts
index 618dbe9..45f4827 100644
--- a/lib/rules/growthAlerts.ts
+++ b/lib/rules/growthAlerts.ts
@@ -126,6 +126,21 @@ export function positionKind(
   return null;
 }

+// Spec 2026-11-25 §5.6: inside the norm, but among the lowest or the highest
+// 16 of 100 babies of that age and sex. Not an alert.
+export type NearKind = "nearLow" | "nearHigh";
+
+export const NEAR_CHIP: Record<NearKind, string> = {
+  nearLow: "Gần mức thấp",
+  nearHigh: "Gần mức cao",
+};
+
+export function nearKind(z: number): NearKind | null {
+  if (z >= -2 && z < -1) return "nearLow";
+  if (z > 1 && z <= 2) return "nearHigh";
+  return null;
+}
+
 type Found = { kind: GrowthAlertKind; compared: Reading | null };

 function findAlert(indicator: WhoIndicator, list: Reading[]): Found | null {
@@ -274,13 +289,23 @@ export const alertTone = (level: GrowthAlertLevel): "warn" | "danger" =>
   level === "red" ? "danger" : "warn";

 // Spec 2026-11-25 §3.4: the chip on the growth card of the Sức khỏe page.
-export function growthStatus(alerts: GrowthAlert[]): {
+export function growthStatus(
+  alerts: GrowthAlert[],
+  // §5.6: one entry per indicator on the card, null where it is not near the
+  // edge of the norm. Only read when there is no alert.
+  near: (NearKind | null)[] = [],
+): {
   text: string;
   tone: GrowthTone;
 } {
   if (alerts.some((alert) => alert.level === "red"))
     return { text: "Nên đi khám", tone: "danger" };
   if (alerts.length > 0) return { text: "Cần chú ý", tone: "warn" };
+  const low = near.includes("nearLow");
+  const high = near.includes("nearHigh");
+  if (low && high) return { text: "Gần ranh chuẩn", tone: "warn" };
+  if (low || high)
+    return { text: NEAR_CHIP[low ? "nearLow" : "nearHigh"], tone: "warn" };
   return { text: "Lớn đều", tone: "good" };
 }

```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  172 passed (172)`, `Tests  1354 passed (1354)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/growth.ts lib/rules/growth.test.ts lib/rules/growthAlerts.ts lib/rules/growthAlerts.test.ts
git commit -m "feat(growth): nearKind, standardRange, and a status for a baby near the edge of the norm" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Thẻ kết luận và danh sách biết gần ranh; số chuẩn thành chữ (§5.6, §5.5)

**Files:**

- Modify: `lib/rules/growthView.ts`
- Test: `lib/rules/growthView.test.ts`, `components/growth/growthparts.test.tsx` (hàm dựng `IndicatorSummary` của test thêm 4 trường mới), `components/growth/growthscreen.test.tsx` (một hàng cũ của test nay gần ranh)

**Interfaces:**

- Consumes: `standardRange`, `nearKind`, `NEAR_CHIP`, `NearKind` (Task 1); `lmsAt`, `Lms`; `readings`, `positionKind`, `comparePhrase`.
- Produces: `IndicatorSummary` với `near`, `standard`, `barLabel`, `nearLine`; `VerdictHead`, `verdictHead`; `listRows` với chip gần ranh. Sau task này chip "Gần mức thấp"/"Gần mức cao" đã hiện ở thẻ kết luận và danh sách; tiêu đề thẻ và ba nhãn đợi Task 3.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/growth/growthparts.test.tsx b/components/growth/growthparts.test.tsx
index 8c8a03f..e3c2d7a 100644
--- a/components/growth/growthparts.test.tsx
+++ b/components/growth/growthparts.test.tsx
@@ -19,6 +19,11 @@ const summary = (over: Partial<IndicatorSummary> = {}): IndicatorSummary => ({
   change: "+1,5 kg sau 46 ngày",
   measuredOn: "2026-11-25",
   ageDays: 76,
+  near: null,
+  standard: { low: "4,7 kg", mid: "giữa 6,0", high: "7,6 kg" },
+  barLabel:
+    "Bình thường. Nặng hơn 55 trong 100 bé trai cùng tuổi. Chuẩn từ 4,7 đến 7,6 kg, giữa 6,0.",
+  nearLine: null,
   ...over,
 });

diff --git a/components/growth/growthscreen.test.tsx b/components/growth/growthscreen.test.tsx
index 2120679..e05db34 100644
--- a/components/growth/growthscreen.test.tsx
+++ b/components/growth/growthscreen.test.tsx
@@ -242,7 +242,9 @@ describe("GrowthScreen", () => {
     expect(list).toContain("15/11 · 2 tháng 1 ngày");
     expect(list).toContain(">5,5 kg · 58,5 cm</span>");
     expect(list).toContain(">+1,1 kg · +3,5 cm so với lần trước</span>");
-    expect(list.match(/>Bình thường<\/span>/g)).toHaveLength(2);
+    expect(list.match(/>Bình thường<\/span>/g)).toHaveLength(1);
+    // Spec §5.6: 4,4 kg against a 5,5 kg median is z −1,6, near the low edge.
+    expect(list).toContain('bg-warn-soft text-warn-ink">Gần mức thấp</span>');
     expect(html).not.toContain("z-score");
   });

diff --git a/lib/rules/growthView.test.ts b/lib/rules/growthView.test.ts
index c6c3b26..dce6305 100644
--- a/lib/rules/growthView.test.ts
+++ b/lib/rules/growthView.test.ts
@@ -16,6 +16,7 @@ import {
   gaugePosition,
   indicatorSummaries,
   listRows,
+  verdictHead,
 } from "./growthView";

 const DOB = "2026-01-01";
@@ -102,6 +103,11 @@ describe("indicatorSummaries", () => {
       change: null,
       measuredOn: day(40),
       ageDays: 40,
+      near: null,
+      standard: { low: "12,0 kg", mid: "giữa 16,0", high: "20,0 kg" },
+      barLabel:
+        "Bình thường. Nặng hơn 50 trong 100 bé trai cùng tuổi. Chuẩn từ 12,0 đến 20,0 kg, giữa 16,0.",
+      nearLine: null,
     });
   });

@@ -161,6 +167,197 @@ describe("indicatorSummaries", () => {
   });
 });

+// Spec 2026-11-25 §5.6. On the flat table the norm runs from 12 to 20, and a
+// value is near an edge from 12 up to 14 and above 18 up to 20.
+describe("indicatorSummaries: near the edge of the norm", () => {
+  it("near the low edge: the chip, the distance to the lowest value of the norm", () => {
+    const [length] = view([measure(40, null, 12.9)]).summaries;
+    expect(length.near).toBe("nearLow");
+    expect(length.chip).toEqual({ text: "Gần mức thấp", tone: "warn" });
+    expect(length.standard).toEqual({
+      low: "12,0 cm",
+      mid: "giữa 16,0",
+      high: "20,0 cm",
+    });
+    expect(length.nearLine).toBe("Cách mức thấp nhất của chuẩn 0,9 cm");
+    expect(length.barLabel).toBe(
+      "Gần mức thấp. Dài hơn 6 trong 100 bé trai cùng tuổi. Chuẩn từ 12,0 đến 20,0 cm, giữa 16,0.",
+    );
+  });
+
+  it("near the high edge: the chip, the distance to the highest value of the norm", () => {
+    const [weight] = view([measure(40, 18.5)]).summaries;
+    expect(weight.near).toBe("nearHigh");
+    expect(weight.chip).toEqual({ text: "Gần mức cao", tone: "warn" });
+    expect(weight.nearLine).toBe("Cách mức cao nhất của chuẩn 1,5 kg");
+  });
+
+  it("the limits: z −2 and +2 are near, z −1 and +1 are not", () => {
+    const near = (kg: number) => view([measure(40, kg)]).summaries[0].near;
+    expect([12, 13.99, 14, 16, 18, 18.01, 20].map(near)).toEqual([
+      "nearLow",
+      "nearLow",
+      null,
+      null,
+      null,
+      "nearHigh",
+      "nearHigh",
+    ]);
+  });
+
+  it("the distance is taken between the two numbers as written, with one decimal", () => {
+    // 12,34 reads 12,3 on the screen: 12,3 − 12,0.
+    expect(view([measure(40, null, 12.34)]).summaries[0].nearLine).toBe(
+      "Cách mức thấp nhất của chuẩn 0,3 cm",
+    );
+    // 19,96 reads 20,0, the same as the edge.
+    expect(view([measure(40, null, 19.96)]).summaries[0].nearLine).toBe(
+      "Sát mức cao nhất của chuẩn",
+    );
+    expect(view([measure(40, 12.04)]).summaries[0].nearLine).toBe(
+      "Sát mức thấp nhất của chuẩn",
+    );
+  });
+
+  // The alert reads the exact edge, the screen a rounded one. Rounded to the
+  // nearest tenth, 12,0975 would read "12,1" for a value of 12,1 (fine) but
+  // 12,04 would read "12,0" while 12,0 is already an alert.
+  it("the edges are rounded inwards: a value the app calls low is always below the lowest number shown", () => {
+    // M = 16,13: the norm runs from 12,0975 to 20,1625.
+    const table: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+      d,
+      1,
+      16.13,
+      0.125,
+    ]);
+    const at = (cm: number) =>
+      view([measure(40, null, cm)], { lhfa: table }).summaries[0];
+    expect(at(16).standard).toEqual({
+      low: "12,1 cm",
+      mid: "giữa 16,1",
+      high: "20,1 cm",
+    });
+    expect(at(12).chip.text).toBe("Thấp");
+    expect(at(12.1).chip.text).toBe("Gần mức thấp");
+    expect(at(12.1).nearLine).toBe("Sát mức thấp nhất của chuẩn");
+    expect(at(20.1).nearLine).toBe("Sát mức cao nhất của chuẩn");
+    expect(at(20.2).chip.text).toBe("Cao");
+  });
+
+  it("a weight inside the norm that reads just past the number shown is at the edge, never a distance beyond it", () => {
+    // M = 16,02: the norm runs from 12,015 to 20,025, written 12,1 and 20,0.
+    const table: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+      d,
+      1,
+      16.02,
+      0.125,
+    ]);
+    const at = (kg: number) =>
+      view([measure(40, kg)], { wfa: table }).summaries[0];
+    expect(at(12.02).standard.low).toBe("12,1 kg");
+    expect(at(12.02).nearLine).toBe("Sát mức thấp nhất của chuẩn");
+    expect(at(20.02).standard.high).toBe("20,0 kg");
+    expect(at(20.02).nearLine).toBe("Sát mức cao nhất của chuẩn");
+  });
+
+  it("an indicator with an alert is never near the edge", () => {
+    // z −1,33 is in the near range, but the fall from z 0 is an alert.
+    const [length] = view([
+      measure(54, null, 13.34),
+      measure(40, null, 16),
+    ]).summaries;
+    expect(length.chip).toEqual({ text: "Tăng chậm", tone: "warn" });
+    expect(length.near).toBeNull();
+    expect(length.nearLine).toBeNull();
+  });
+
+  it("every indicator carries the norm, with or without an alert", () => {
+    const [weight] = view([measure(40, 11)]).summaries;
+    expect(weight.chip.text).toBe("Thấp");
+    expect(weight.standard).toEqual({
+      low: "12,0 kg",
+      mid: "giữa 16,0",
+      high: "20,0 kg",
+    });
+    expect(weight.barLabel).toBe(
+      "Thấp. Nặng hơn 1 trong 100 bé trai cùng tuổi. Chuẩn từ 12,0 đến 20,0 kg, giữa 16,0.",
+    );
+  });
+
+  it("the norm is read on the day of the newest measurement of that indicator", () => {
+    // The median grows 0,03 a day from 4: 5,2 on day 40, 6,4 on day 80.
+    const growing: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+      d,
+      1,
+      4 + 0.03 * d,
+      0.125,
+    ]);
+    const { summaries } = view([measure(80, 6.4), measure(40, null, 5.2)], {
+      wfa: growing,
+      lhfa: growing,
+    });
+    expect(summaries.map((s) => s.standard)).toEqual([
+      { low: "4,8 kg", mid: "giữa 6,4", high: "8,0 kg" },
+      { low: "3,9 cm", mid: "giữa 5,2", high: "6,5 cm" },
+    ]);
+  });
+});
+
+describe("verdictHead", () => {
+  const head = (rows: GrowthMeasure[]) => {
+    const { alerts, summaries } = view(rows);
+    return verdictHead({ babyName: "Bun", alerts, summaries });
+  };
+  const REST = "Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới.";
+
+  it("nothing wrong and nothing near: the calm heading, no note", () => {
+    expect(head([measure(40, 16, 16, 16)])).toEqual({
+      heading: "Bun đang lớn đều",
+      note: null,
+    });
+  });
+
+  it("one indicator near the low edge: a heading that still says normal, and the note", () => {
+    expect(head([measure(40, 16, 12.9, 16)])).toEqual({
+      heading: "Bun phát triển bình thường",
+      note: {
+        strong: ["Chiều dài đang gần mức thấp của chuẩn."],
+        rest: REST,
+      },
+    });
+  });
+
+  it("two and three indicators: listed in screen order, only the first word capitalised", () => {
+    expect(head([measure(40, 13, 12.9, 16)]).note?.strong).toEqual([
+      "Cân nặng và chiều dài đang gần mức thấp của chuẩn.",
+    ]);
+    expect(head([measure(40, 19, 19, 19)]).note?.strong).toEqual([
+      "Cân nặng, chiều dài và vòng đầu đang gần mức cao của chuẩn.",
+    ]);
+  });
+
+  it("some near the low edge and some near the high one: a sentence each, low first", () => {
+    expect(head([measure(40, 19, 13, 19)]).note).toEqual({
+      strong: [
+        "Chiều dài đang gần mức thấp của chuẩn.",
+        "Cân nặng và vòng đầu đang gần mức cao của chuẩn.",
+      ],
+      rest: REST,
+    });
+  });
+
+  it("with an alert there is no heading, but the note about another indicator stays", () => {
+    expect(head([measure(40, 11, 13)])).toEqual({
+      heading: null,
+      note: {
+        strong: ["Chiều dài đang gần mức thấp của chuẩn."],
+        rest: REST,
+      },
+    });
+    expect(head([measure(40, 11, 16)])).toEqual({ heading: null, note: null });
+  });
+});
+
 describe("defaultIndicator and alertDots", () => {
   it("opens on weight when nothing is wrong", () => {
     expect(defaultIndicator([])).toBe("wfa");
@@ -430,6 +627,34 @@ describe("listRows", () => {
     ]);
   });

+  // Spec 2026-11-25 §5.6: every row is judged by its own values, old ones too.
+  it("a row inside the norm but near its edge says which edge", () => {
+    // More than 183 days apart, and no weight on the newest row, so no row
+    // raises an alert against another.
+    const items = list([
+      measure(700, null, 12.9),
+      measure(400, 18.5, 16),
+      measure(100, 16, 16),
+    ]);
+    expect(items.map((item) => item.chip)).toEqual([
+      { text: "Gần mức thấp", tone: "warn" },
+      { text: "Gần mức cao", tone: "warn" },
+      { text: "Bình thường", tone: "good" },
+    ]);
+  });
+
+  it("near both edges in one row: the first indicator in weight, length, head order", () => {
+    expect(list([measure(40, 19, 13)])[0].chip?.text).toBe("Gần mức cao");
+    expect(list([measure(40, 16, 13, 19)])[0].chip?.text).toBe("Gần mức thấp");
+  });
+
+  it("outside the norm beats near the edge, whichever indicator comes first", () => {
+    // The older row carries no alert: its weight is near the low edge, its
+    // length above the norm.
+    const [, older] = list([measure(700, null, 16), measure(40, 13, 21)]);
+    expect(older.chip).toEqual({ text: "Cao", tone: "warn" });
+  });
+
   it("the newest row of an indicator with an alert takes the alert's chip", () => {
     const items = list([measure(54, null, 13.34), measure(40, null, 16)]);
     expect(items.map((item) => item.chip)).toEqual([
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  2 failed | 170 passed (172)`, `Tests  18 failed | 1353 passed (1371)`. Lý do đỏ: `indicatorSummaries` chưa có 4 trường mới, chưa có `verdictHead`, `listRows` chưa xét gần ranh.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/lib/rules/growthView.ts b/lib/rules/growthView.ts
index c1f9361..28d3364 100644
--- a/lib/rules/growthView.ts
+++ b/lib/rules/growthView.ts
@@ -1,6 +1,13 @@
 import type { WhoIndicator, WhoSex } from "@/lib/content/who";
 import { formatDayShort } from "./days";
-import { ageOnDay, lmsAt, percentile, zScore } from "./growth";
+import {
+  ageOnDay,
+  type Lms,
+  lmsAt,
+  percentile,
+  standardRange,
+  zScore,
+} from "./growth";
 import {
   ALERT_CHIP,
   alertTone,
@@ -8,6 +15,9 @@ import {
   type GrowthMeasure,
   type GrowthTables,
   type GrowthTone,
+  NEAR_CHIP,
+  type NearKind,
+  nearKind,
   newestFirst,
   positionKind,
   readings,
@@ -35,8 +45,70 @@ export type IndicatorSummary = {
   change: string | null;
   measuredOn: string;
   ageDays: number;
+  // Spec §5.6: inside the norm but close to its edge. Null with an alert.
+  near: NearKind | null;
+  // The three labels under the position bar: "56,0 cm", "giữa 60,0", "64,0 cm".
+  standard: { low: string; mid: string; high: string };
+  // What the position bar says to a screen reader.
+  barLabel: string;
+  // "Cách mức thấp nhất của chuẩn 0,9 cm"; null when the value is not near.
+  nearLine: string | null;
 };

+// The norm is always written with one decimal, "56,0" too, so the numbers on
+// the screen line up and the reader can subtract them.
+const oneDecimal = new Intl.NumberFormat("vi-VN", {
+  minimumFractionDigits: 1,
+  maximumFractionDigits: 1,
+});
+const toTenths = (n: number) => Math.round(n * 10);
+const fromTenths = (n: number) => oneDecimal.format(n / 10);
+// The two edges are rounded inwards, the low one up and the high one down:
+// the alerts read the exact edge, so a value the app calls low is then always
+// below the lowest number on the screen, and one it calls high always above
+// the highest. The margin keeps a product such as 3,9000000000000004 at 3,9.
+const ROUNDING_MARGIN = 1e-6;
+const tenthsUp = (n: number) => Math.ceil(n * 10 - ROUNDING_MARGIN);
+const tenthsDown = (n: number) => Math.floor(n * 10 + ROUNDING_MARGIN);
+
+// Spec 2026-11-25 §5.6: the norm on the day of one measurement, in words.
+function standardText(
+  indicator: WhoIndicator,
+  lms: Lms,
+  value: number,
+  near: NearKind | null,
+): Pick<IndicatorSummary, "standard" | "nearLine"> & { spoken: string } {
+  const range = standardRange(lms);
+  const low = tenthsUp(range.low);
+  const mid = toTenths(range.mid);
+  const high = tenthsDown(range.high);
+  const unit = indicator === "wfa" ? "kg" : "cm";
+  // Between the two numbers as the screen writes them. A value inside the
+  // norm that reads at or just past the number shown is at the edge.
+  const gap = Math.max(
+    0,
+    near === "nearLow"
+      ? toTenths(value) - low
+      : near === "nearHigh"
+        ? high - toTenths(value)
+        : 0,
+  );
+  const edge = near === "nearLow" ? "thấp" : "cao";
+  return {
+    standard: {
+      low: `${fromTenths(low)} ${unit}`,
+      mid: `giữa ${fromTenths(mid)}`,
+      high: `${fromTenths(high)} ${unit}`,
+    },
+    spoken: `Chuẩn từ ${fromTenths(low)} đến ${fromTenths(high)} ${unit}, giữa ${fromTenths(mid)}.`,
+    nearLine: !near
+      ? null
+      : gap === 0
+        ? `Sát mức ${edge} nhất của chuẩn`
+        : `Cách mức ${edge} nhất của chuẩn ${fromTenths(gap)} ${unit}`,
+  };
+}
+
 // z −3…+3 across the bar; anything beyond sits at the end.
 export function gaugePosition(z: number): number {
   return Math.min(1, Math.max(0, (z + 3) / 6)) * 100;
@@ -59,7 +131,28 @@ export function indicatorSummaries(input: {
     if (!table) return [];
     const [latest, ...older] = readings(input.rows, table, input.dob, key);
     if (!latest) return [];
+    const lms = lmsAt(table, latest.ageDays);
+    if (!lms) return [];
     const alert = input.alerts.find((item) => item.indicator === key);
+    // An alert always wins: an indicator that has one is never "near".
+    const near = alert ? null : nearKind(latest.z);
+    const chip: IndicatorSummary["chip"] = alert
+      ? { text: alert.chip, tone: alertTone(alert.level) }
+      : near
+        ? { text: NEAR_CHIP[near], tone: "warn" }
+        : { text: "Bình thường", tone: "good" };
+    const compare = comparePhrase(
+      key,
+      percentile(latest.z),
+      input.sex,
+      latest.ageDays,
+    );
+    const { standard, spoken, nearLine } = standardText(
+      key,
+      lms,
+      latest.value,
+      near,
+    );
     const before = older.find((reading) => reading.day < latest.day);
     const shifted =
       alert && alert.previousPercentile !== null
@@ -70,16 +163,9 @@ export function indicatorSummaries(input: {
         indicator: key,
         title,
         value: formatGrowthValue(key, latest.value),
-        chip: alert
-          ? { text: alert.chip, tone: alertTone(alert.level) }
-          : { text: "Bình thường", tone: "good" },
+        chip,
         position: gaugePosition(latest.z),
-        compare: comparePhrase(
-          key,
-          percentile(latest.z),
-          input.sex,
-          latest.ageDays,
-        ),
+        compare,
         change:
           shifted ??
           (before
@@ -87,11 +173,68 @@ export function indicatorSummaries(input: {
             : null),
         measuredOn: latest.day,
         ageDays: latest.ageDays,
+        near,
+        standard,
+        barLabel: `${chip.text}. ${compare}. ${spoken}`,
+        nearLine,
       },
     ];
   });
 }

+// Spec 2026-11-25 §5.6: how the verdict card opens.
+export type VerdictHead = {
+  // Null with an alert: the alert cards above the verdict already say it.
+  heading: string | null;
+  // The strip about the indicators near the edge of the norm: one sentence in
+  // bold for each edge, then the advice. Null when none is near.
+  note: { strong: string[]; rest: string } | null;
+};
+
+const NEAR_REST =
+  "Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới.";
+
+// "Cân nặng, chiều dài và vòng đầu": only the first name keeps its capital.
+function nameList(titles: string[]): string {
+  const names = titles.map((title, index) =>
+    index === 0 ? title : title.toLocaleLowerCase("vi"),
+  );
+  return names.length === 1
+    ? names[0]
+    : `${names.slice(0, -1).join(", ")} và ${names[names.length - 1]}`;
+}
+
+export function verdictHead(input: {
+  babyName: string;
+  alerts: GrowthAlert[];
+  summaries: IndicatorSummary[];
+}): VerdictHead {
+  const titles = (kind: NearKind) =>
+    input.summaries.filter((item) => item.near === kind).map((s) => s.title);
+  const low = titles("nearLow");
+  const high = titles("nearHigh");
+  const near = low.length + high.length > 0;
+  return {
+    heading:
+      input.alerts.length > 0
+        ? null
+        : `${input.babyName} ${near ? "phát triển bình thường" : "đang lớn đều"}`,
+    note: near
+      ? {
+          strong: [
+            ...(low.length > 0
+              ? [`${nameList(low)} đang gần mức thấp của chuẩn.`]
+              : []),
+            ...(high.length > 0
+              ? [`${nameList(high)} đang gần mức cao của chuẩn.`]
+              : []),
+          ],
+          rest: NEAR_REST,
+        }
+      : null,
+  };
+}
+
 // The indicator the page opens on: the first one, in screen order, with an alert.
 export function defaultIndicator(alerts: GrowthAlert[]): WhoIndicator {
   return (
@@ -270,6 +413,8 @@ export function listRows<T extends GrowthMeasure>(input: {
     const changes: string[] = [];
     let red: string | null = null;
     let yellow: string | null = null;
+    // Spec §5.6: the first indicator, in screen order, near the edge.
+    let near: NearKind | null = null;
     let assessed = 0;
     let outside = false;
     for (const { key } of INDICATORS) {
@@ -287,9 +432,11 @@ export function listRows<T extends GrowthMeasure>(input: {
         continue;
       }
       assessed += 1;
-      const kind = positionKind(zScore(lms, value));
+      const z = zScore(lms, value);
+      const kind = positionKind(z);
       if (kind === "veryLow" || kind === "veryHigh") red ??= ALERT_CHIP[kind];
       else if (kind) yellow ??= ALERT_CHIP[kind];
+      else near ??= nearKind(z);
     }
     const alert = alertOf.get(row);
     const chip: GrowthListItem<T>["chip"] = alert
@@ -298,9 +445,11 @@ export function listRows<T extends GrowthMeasure>(input: {
         ? { text: red, tone: "danger" }
         : yellow
           ? { text: yellow, tone: "warn" }
-          : assessed > 0
-            ? { text: "Bình thường", tone: "good" }
-            : null;
+          : near
+            ? { text: NEAR_CHIP[near], tone: "warn" }
+            : assessed > 0
+              ? { text: "Bình thường", tone: "good" }
+              : null;
     return {
       row,
       title: `${formatDayShort(row.measured_on)} · ${
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  172 passed (172)`, `Tests  1371 passed (1371)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/growthView.ts lib/rules/growthView.test.ts components/growth/growthparts.test.tsx components/growth/growthscreen.test.tsx
git commit -m "feat(growth): the verdict and the list say when a value is near the edge; the norm in numbers" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Thẻ kết luận: ba nhãn số chuẩn, dòng cách ranh, tiêu đề và dòng nhắc (§5.6)

**Files:**

- Modify: `components/growth/PositionBar.tsx`, `components/growth/GrowthVerdict.tsx`, `components/growth/GrowthScreen.tsx`
- Test: `components/growth/growthparts.test.tsx`, `components/growth/growthscreen.test.tsx`

**Interfaces:**

- Consumes: `IndicatorSummary` với trường mới, `VerdictHead`, `verdictHead` (Task 2); `NearKind` (Task 1); `PositionBar`, `StatusChip`, `Icon`.
- Produces: `StandardLabels({ standard, near })`; `GrowthVerdict({ head, measured, summaries })`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/growth/growthparts.test.tsx b/components/growth/growthparts.test.tsx
index e3c2d7a..be5efa7 100644
--- a/components/growth/growthparts.test.tsx
+++ b/components/growth/growthparts.test.tsx
@@ -2,12 +2,17 @@ import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
 import { findElements } from "@/components/ui/testTree";
 import type { GrowthAlert } from "@/lib/rules/growthAlerts";
-import type { IndicatorSummary } from "@/lib/rules/growthView";
+import type { IndicatorSummary, VerdictHead } from "@/lib/rules/growthView";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { GrowthAlertCard } from "./GrowthAlertCard";
 import { GrowthChartCard } from "./GrowthChartCard";
 import { GrowthVerdict } from "./GrowthVerdict";
-import { PositionBar, ZONE_NORMAL, ZONE_OFF } from "./PositionBar";
+import {
+  PositionBar,
+  StandardLabels,
+  ZONE_NORMAL,
+  ZONE_OFF,
+} from "./PositionBar";

 const summary = (over: Partial<IndicatorSummary> = {}): IndicatorSummary => ({
   indicator: "wfa",
@@ -80,19 +85,79 @@ describe("PositionBar", () => {
   });
 });

+// Spec 2026-11-25 §5.6: the norm in numbers, under the bar.
+describe("StandardLabels", () => {
+  const standard = { low: "56,0 cm", mid: "giữa 60,0", high: "64,0 cm" };
+  const LABEL = "absolute -translate-x-1/2 whitespace-nowrap";
+  const render = (near: "nearLow" | "nearHigh" | null) =>
+    renderToStaticMarkup(<StandardLabels standard={standard} near={near} />);
+
+  it("a 16 px row of small muted labels, hidden from screen readers: the bar's own label says the numbers", () => {
+    expect(render(null)).toContain(
+      '<span aria-hidden="true" class="relative block h-4 text-xs leading-4 text-muted tabular-nums">',
+    );
+  });
+
+  it("each label is centred on its point of the bar: the two edges of the norm and the middle", () => {
+    const html = render(null);
+    expect(html).toContain(
+      `<span class="${LABEL} left-[16.7%]">56,0 cm</span>`,
+    );
+    expect(html).toContain(`<span class="${LABEL} left-1/2">giữa 60,0</span>`);
+    expect(html).toContain(
+      `<span class="${LABEL} left-[83.3%]">64,0 cm</span>`,
+    );
+    expect(html).not.toContain("font-bold");
+  });
+
+  it("near the low edge: the lowest value of the norm in bold warn", () => {
+    const html = render("nearLow");
+    expect(html).toContain(
+      `<span class="${LABEL} left-[16.7%] font-bold text-warn">56,0 cm</span>`,
+    );
+    expect(html.match(/font-bold/g)).toHaveLength(1);
+  });
+
+  it("near the high edge: the highest value of the norm in bold warn", () => {
+    const html = render("nearHigh");
+    expect(html).toContain(
+      `<span class="${LABEL} left-[83.3%] font-bold text-warn">64,0 cm</span>`,
+    );
+    expect(html.match(/font-bold/g)).toHaveLength(1);
+  });
+});
+
 describe("GrowthVerdict", () => {
-  const render = (calm: boolean, summaries = [summary()]) =>
+  const CALM: VerdictHead = { heading: "Bun đang lớn đều", note: null };
+  const ALERT: VerdictHead = { heading: null, note: null };
+  const REST = "Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới.";
+  const NOTE =
+    '<p class="rounded-2xl bg-warn-soft px-3 py-2.5 text-sm leading-5 text-warn-ink">';
+  const render = (head: VerdictHead, summaries = [summary()]) =>
     renderToStaticMarkup(
       <GrowthVerdict
-        babyName="Bun"
+        head={head}
         measured="Đo gần nhất 25/11 · 2 tháng 15 ngày"
-        calm={calm}
         summaries={summaries}
       />,
     );
+  const nearLength = summary({
+    indicator: "lhfa",
+    title: "Chiều dài",
+    value: "56,9 cm",
+    chip: { text: "Gần mức thấp", tone: "warn" },
+    position: 24.5,
+    compare: "Dài hơn 6 trong 100 bé trai cùng tuổi",
+    change: "+1,9 cm sau 10 ngày",
+    near: "nearLow",
+    standard: { low: "56,0 cm", mid: "giữa 60,0", high: "64,0 cm" },
+    barLabel:
+      "Gần mức thấp. Dài hơn 6 trong 100 bé trai cùng tuổi. Chuẩn từ 56,0 đến 64,0 cm, giữa 60,0.",
+    nearLine: "Cách mức thấp nhất của chuẩn 0,9 cm",
+  });

   it("with no alert: a check, the calm heading and the day of the newest measurement", () => {
-    const html = render(true);
+    const html = render(CALM);
     expect(html).toContain(">Bun đang lớn đều</h2>");
     expect(html).toContain("bg-good-soft text-good-ink");
     expect(html).toContain(`d="${ICON_PATHS.check}"`);
@@ -100,14 +165,14 @@ describe("GrowthVerdict", () => {
   });

   it("with an alert: only the day line, no heading and no check", () => {
-    const html = render(false);
-    expect(html).not.toContain("đang lớn đều");
+    const html = render(ALERT);
+    expect(html).not.toContain("<h2");
     expect(html).not.toContain(ICON_PATHS.check);
     expect(html).toContain(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>");
   });

   it("each indicator: its name, value, chip, bar and the comparison with the change", () => {
-    const html = render(true, [
+    const html = render(CALM, [
       summary(),
       summary({
         indicator: "lhfa",
@@ -117,6 +182,8 @@ describe("GrowthVerdict", () => {
         position: 28,
         compare: "Dài hơn 9 trong 100 bé trai cùng tuổi",
         change: "trước đó là 45 trong 100",
+        barLabel:
+          "Tăng chậm. Dài hơn 9 trong 100 bé trai cùng tuổi. Chuẩn từ 56,0 đến 64,0 cm, giữa 60,0.",
       }),
     ]);
     expect(html).toContain(">Cân nặng</span>");
@@ -127,7 +194,7 @@ describe("GrowthVerdict", () => {
     );
     expect(html).toContain('bg-warn-soft text-warn-ink">Tăng chậm</span>');
     expect(html).toContain(
-      'aria-label="Tăng chậm. Dài hơn 9 trong 100 bé trai cùng tuổi"',
+      'aria-label="Tăng chậm. Dài hơn 9 trong 100 bé trai cùng tuổi. Chuẩn từ 56,0 đến 64,0 cm, giữa 60,0."',
     );
     expect(html).toContain('style="left:28%"');
     expect(html).toContain(
@@ -137,13 +204,104 @@ describe("GrowthVerdict", () => {
   });

   it("without an earlier measurement the comparison stands alone", () => {
-    expect(render(true, [summary({ change: null })])).toContain(
+    expect(render(CALM, [summary({ change: null })])).toContain(
       ">Nặng hơn 55 trong 100 bé trai cùng tuổi</span>",
     );
   });

+  // Spec 2026-11-25 §5.6.
+  it("under every bar: the norm in three labels, with or without an alert", () => {
+    const html = render(ALERT, [summary(), nearLength]);
+    expect(
+      html.match(/aria-hidden="true" class="relative block h-4/g),
+    ).toHaveLength(2);
+    for (const text of ["4,7 kg", "giữa 6,0", "7,6 kg", "56,0 cm", "giữa 60,0"])
+      expect(html).toContain(`>${text}</span>`);
+    // The labels come right after their bar.
+    expect(html.indexOf(">4,7 kg<")).toBeGreaterThan(
+      html.indexOf('style="left:52%"'),
+    );
+    expect(html.indexOf(">4,7 kg<")).toBeLessThan(
+      html.indexOf(">Nặng hơn 55 trong 100"),
+    );
+  });
+
+  it("an indicator near the edge: its edge label in bold, and the distance between the labels and the comparison", () => {
+    const html = render(CALM, [summary(), nearLength]);
+    expect(html).toContain('font-bold text-warn">56,0 cm</span>');
+    const line =
+      '<span class="text-[13px] leading-[18px] font-semibold text-warn">Cách mức thấp nhất của chuẩn 0,9 cm</span>';
+    expect(html).toContain(line);
+    expect(html.indexOf(line)).toBeGreaterThan(html.indexOf(">64,0 cm<"));
+    expect(html.indexOf(line)).toBeLessThan(
+      html.indexOf(
+        ">Dài hơn 6 trong 100 bé trai cùng tuổi · +1,9 cm sau 10 ngày<",
+      ),
+    );
+    // The indicator that is not near has no such line.
+    expect(html.match(/font-semibold text-warn"/g)).toHaveLength(1);
+  });
+
+  it("something near and no alert: still a check, a heading that says normal, then the note", () => {
+    const html = render(
+      {
+        heading: "Bun phát triển bình thường",
+        note: {
+          strong: ["Chiều dài đang gần mức thấp của chuẩn."],
+          rest: REST,
+        },
+      },
+      [summary(), nearLength],
+    );
+    expect(html).toContain(">Bun phát triển bình thường</h2>");
+    expect(html).toContain(`d="${ICON_PATHS.check}"`);
+    const note = `${NOTE}<strong class="font-bold">Chiều dài đang gần mức thấp của chuẩn.</strong> ${REST}</p>`;
+    expect(html).toContain(note);
+    expect(html.indexOf(note)).toBeGreaterThan(html.indexOf("</h2>"));
+    expect(html.indexOf(note)).toBeLessThan(html.indexOf(">Cân nặng</span>"));
+  });
+
+  it("near both edges: a bold sentence for each, then the advice once", () => {
+    const html = render({
+      heading: "Bun phát triển bình thường",
+      note: {
+        strong: [
+          "Chiều dài đang gần mức thấp của chuẩn.",
+          "Cân nặng đang gần mức cao của chuẩn.",
+        ],
+        rest: REST,
+      },
+    });
+    expect(html).toContain(
+      `${NOTE}<strong class="font-bold">Chiều dài đang gần mức thấp của chuẩn.</strong> <strong class="font-bold">Cân nặng đang gần mức cao của chuẩn.</strong> ${REST}</p>`,
+    );
+  });
+
+  it("an alert on one indicator, another near the edge: no heading, the note under the day line", () => {
+    const html = render(
+      {
+        heading: null,
+        note: {
+          strong: ["Chiều dài đang gần mức thấp của chuẩn."],
+          rest: REST,
+        },
+      },
+      [summary({ chip: { text: "Thấp", tone: "warn" } }), nearLength],
+    );
+    expect(html).not.toContain("<h2");
+    expect(html.indexOf(NOTE)).toBeGreaterThan(
+      html.indexOf(">Đo gần nhất 25/11 · 2 tháng 15 ngày</span>"),
+    );
+    expect(html.indexOf(NOTE)).toBeLessThan(html.indexOf(">Cân nặng</span>"));
+  });
+
+  it("nothing near: no note", () => {
+    expect(render(CALM)).not.toContain(NOTE);
+    expect(render(ALERT)).not.toContain(NOTE);
+  });
+
   it("ends with the legend of the two bar zones, drawn as the bar draws them", () => {
-    const html = render(true);
+    const html = render(CALM);
     expect(html.indexOf("Thấp hoặc cao hơn chuẩn")).toBeGreaterThan(
       html.indexOf("+1,5 kg sau 46 ngày"),
     );
diff --git a/components/growth/growthscreen.test.tsx b/components/growth/growthscreen.test.tsx
index e05db34..c74d489 100644
--- a/components/growth/growthscreen.test.tsx
+++ b/components/growth/growthscreen.test.tsx
@@ -139,6 +139,43 @@ describe("GrowthScreen", () => {
     expect(html).toContain('data-chart="kg:2"');
   });

+  // Spec 2026-11-25 §5.6. 48 cm against a 58,5 cm median is z −1,44: inside
+  // the norm (43,9 to 73,1 cm) but near its low edge.
+  it("near the edge of the norm: a heading that says normal, the note, the norm in numbers, no alert", () => {
+    const html = render([measure("2026-11-15", 5500, 48)]);
+    expect(html).toContain(">Bun phát triển bình thường</h2>");
+    expect(html).toContain(
+      '<strong class="font-bold">Chiều dài đang gần mức thấp của chuẩn.</strong> Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới.</p>',
+    );
+    expect(html).toContain('bg-warn-soft text-warn-ink">Gần mức thấp</span>');
+    expect(html).toContain('font-bold text-warn">43,9 cm</span>');
+    expect(html).toContain(">giữa 58,5</span>");
+    expect(html).toContain(">73,1 cm</span>");
+    expect(html).toContain(">Cách mức thấp nhất của chuẩn 4,1 cm</span>");
+    expect(html).toContain(
+      'aria-label="Gần mức thấp. Dài hơn 8 trong 100 bé trai cùng tuổi. Chuẩn từ 43,9 đến 73,1 cm, giữa 58,5."',
+    );
+    // Weight sits on the median: its labels are there, none of them in bold.
+    // Its norm runs from 4,125 to 6,875 kg; the edges are rounded inwards.
+    expect(html).toContain(">4,2 kg</span>");
+    expect(html).toContain(">6,8 kg</span>");
+    expect(html.match(/font-bold text-warn"/g)).toHaveLength(1);
+    // Near the edge is not an alert: no card, no dot, the picker stays on weight.
+    expect(html).not.toContain(ICON_PATHS.alert);
+    expect(html).not.toContain('aria-label="có cảnh báo"');
+    expect(pressed(html)).toEqual(["Cân nặng"]);
+  });
+
+  it("an alert on one indicator and another near the edge: the alert card, no heading, and the note", () => {
+    const html = render([measure("2026-11-15", 4000, 48)]);
+    expect(html).toContain(">Cân nặng thấp hơn chuẩn</h2>");
+    expect(html).not.toContain("phát triển bình thường");
+    expect(html).not.toContain("đang lớn đều");
+    expect(html).toContain(
+      '<strong class="font-bold">Chiều dài đang gần mức thấp của chuẩn.</strong>',
+    );
+  });
+
   it("blocks come in order: alert cards, verdict, picker, chart, list", () => {
     // 51 cm against a 58,5 cm median is z −1,03 lower than a month before: no
     // alert; 4 kg is z −2,18: low.
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  2 failed | 170 passed (172)`, `Tests  13 failed | 1370 passed (1383)`. Lý do đỏ: chưa có `StandardLabels`; `GrowthVerdict` còn nhận `calm` và chưa vẽ nhãn, dòng cách ranh, dòng nhắc.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/components/growth/GrowthScreen.tsx b/components/growth/GrowthScreen.tsx
index 9447ba2..ff6dc71 100644
--- a/components/growth/GrowthScreen.tsx
+++ b/components/growth/GrowthScreen.tsx
@@ -30,6 +30,7 @@ import {
   defaultIndicator,
   indicatorSummaries,
   listRows,
+  verdictHead,
 } from "@/lib/rules/growthView";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import type { Baby, GrowthRow } from "@/lib/supabase/rows";
@@ -123,9 +124,8 @@ export function GrowthScreen({
       ))}
       {latest && summaries.length > 0 && (
         <GrowthVerdict
-          babyName={baby.name}
+          head={verdictHead({ babyName: baby.name, alerts, summaries })}
           measured={`Đo gần nhất ${formatDayShort(latest.measuredOn)} · ${formatAgeVi(baby.dob, new Date(`${latest.measuredOn}T05:00:00Z`))}`}
-          calm={alerts.length === 0}
           summaries={summaries}
         />
       )}
diff --git a/components/growth/GrowthVerdict.tsx b/components/growth/GrowthVerdict.tsx
index 7df0277..d4c2330 100644
--- a/components/growth/GrowthVerdict.tsx
+++ b/components/growth/GrowthVerdict.tsx
@@ -1,35 +1,40 @@
+import { Fragment } from "react";
 import { Icon } from "@/components/ui/Icon";
 import { StatusChip } from "@/components/ui/StatusChip";
-import type { IndicatorSummary } from "@/lib/rules/growthView";
+import type { IndicatorSummary, VerdictHead } from "@/lib/rules/growthView";
 import { cx } from "@/lib/ui/cx";
-import { PositionBar, ZONE_NORMAL, ZONE_OFF } from "./PositionBar";
+import {
+  PositionBar,
+  StandardLabels,
+  ZONE_NORMAL,
+  ZONE_OFF,
+} from "./PositionBar";

 const SUB = "text-[13px] leading-[18px] text-muted";

-// Spec 2026-11-25 §5.3: the verdict in words, one block per indicator.
+// Spec 2026-11-25 §5.3 and §5.6: the verdict in words, one block per
+// indicator, each with the norm in numbers under its bar.
 export function GrowthVerdict({
-  babyName,
+  head,
   measured,
-  calm,
   summaries,
 }: {
-  babyName: string;
+  // The heading (none with an alert) and the note about values near the edge.
+  head: VerdictHead;
   // "Đo gần nhất {dd/mm} · {tuổi}".
   measured: string;
-  // No alert: the card opens with the reassuring heading.
-  calm: boolean;
   summaries: IndicatorSummary[];
 }) {
   return (
     <section className="glass flex flex-col gap-4 rounded-[26px] p-4">
-      {calm ? (
+      {head.heading ? (
         <div className="flex items-center gap-3">
           <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-good-soft text-good-ink">
             <Icon name="check" size={22} />
           </span>
           <div className="flex min-w-0 flex-col">
             <h2 className="text-xl leading-[26px] font-bold text-ink">
-              {babyName} đang lớn đều
+              {head.heading}
             </h2>
             <span className={SUB}>{measured}</span>
           </div>
@@ -37,6 +42,16 @@ export function GrowthVerdict({
       ) : (
         <span className={SUB}>{measured}</span>
       )}
+      {head.note && (
+        <p className="rounded-2xl bg-warn-soft px-3 py-2.5 text-sm leading-5 text-warn-ink">
+          {head.note.strong.map((sentence) => (
+            <Fragment key={sentence}>
+              <strong className="font-bold">{sentence}</strong>{" "}
+            </Fragment>
+          ))}
+          {head.note.rest}
+        </p>
+      )}
       {summaries.map((item) => (
         <div key={item.indicator} className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
@@ -48,10 +63,13 @@ export function GrowthVerdict({
             </span>
             <StatusChip tone={item.chip.tone}>{item.chip.text}</StatusChip>
           </div>
-          <PositionBar
-            position={item.position}
-            label={`${item.chip.text}. ${item.compare}`}
-          />
+          <PositionBar position={item.position} label={item.barLabel} />
+          <StandardLabels standard={item.standard} near={item.near} />
+          {item.nearLine && (
+            <span className="text-[13px] leading-[18px] font-semibold text-warn">
+              {item.nearLine}
+            </span>
+          )}
           <span className={SUB}>
             {item.change ? `${item.compare} · ${item.change}` : item.compare}
           </span>
diff --git a/components/growth/PositionBar.tsx b/components/growth/PositionBar.tsx
index ccad5a3..e16c92d 100644
--- a/components/growth/PositionBar.tsx
+++ b/components/growth/PositionBar.tsx
@@ -1,3 +1,5 @@
+import type { NearKind } from "@/lib/rules/growthAlerts";
+import type { IndicatorSummary } from "@/lib/rules/growthView";
 import { cx } from "@/lib/ui/cx";

 // Spec 2026-11-25 §5.3: where a measurement sits between z −3 and z +3. The
@@ -34,3 +36,44 @@ export function PositionBar({
     </span>
   );
 }
+
+const LABEL = "absolute -translate-x-1/2 whitespace-nowrap";
+
+// Spec 2026-11-25 §5.6: the norm in numbers, right under the bar. Each label
+// is centred on its point of the bar: the two edges of the normal range and
+// its middle. The edge the value is near is written in bold. Screen readers
+// get the same numbers from the bar's own label.
+export function StandardLabels({
+  standard,
+  near,
+}: {
+  standard: IndicatorSummary["standard"];
+  near: NearKind | null;
+}) {
+  return (
+    <span
+      aria-hidden
+      className="relative block h-4 text-xs leading-4 text-muted tabular-nums"
+    >
+      <span
+        className={cx(
+          LABEL,
+          "left-[16.7%]",
+          near === "nearLow" && "font-bold text-warn",
+        )}
+      >
+        {standard.low}
+      </span>
+      <span className={cx(LABEL, "left-1/2")}>{standard.mid}</span>
+      <span
+        className={cx(
+          LABEL,
+          "left-[83.3%]",
+          near === "nearHigh" && "font-bold text-warn",
+        )}
+      >
+        {standard.high}
+      </span>
+    </span>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  172 passed (172)`, `Tests  1383 passed (1383)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/growth
git commit -m "feat(growth): the verdict card writes the norm under each bar and says when a value is near its edge" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M2f và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-growth/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  172 passed (172)`, `Tests  1383 passed (1383)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm cho các trạng thái dữ liệu thật không có**

Trang này chỉ đọc bảng WHO (file nội dung của app), không đọc hay ghi dữ liệu của gia đình. Tạo `app/fixture-growth/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { GrowthAlertCard } from "@/components/growth/GrowthAlertCard";
import { GrowthList } from "@/components/growth/GrowthList";
import { GrowthVerdict } from "@/components/growth/GrowthVerdict";
import type { LmsRow } from "@/lib/content/who";
import { useWhoTable } from "@/lib/data/growth";
import { addDays } from "@/lib/rules/days";
import { growthAlerts, type GrowthTables } from "@/lib/rules/growthAlerts";
import {
  indicatorSummaries,
  listRows,
  verdictHead,
} from "@/lib/rules/growthView";
import type { GrowthRow } from "@/lib/supabase/rows";

// Mỗi trường hợp: ngày sinh và các lần đo [ngày tuổi, kg, cm, vòng đầu cm].
// ?c=0 chiều dài gần mức thấp · 1 cân gần cao, chiều dài gần thấp ·
// 2 cả ba gần thấp · 3 cân thấp (cảnh báo), chiều dài gần thấp ·
// 4 cân sát mức thấp nhất · 5 bình thường · 6 bé 4 tuổi, cả ba gần cao.
const CASES: { dob: string; rows: [number, number, number, number][] }[] = [
  {
    dob: "2026-09-10",
    rows: [
      [0, 3.2, 47.5, 34.5],
      [30, 4.2, 52, 37.2],
      [76, 5.7, 56.9, 39.9],
    ],
  },
  {
    dob: "2026-09-10",
    rows: [
      [0, 3.9, 47.5, 34.5],
      [30, 5.3, 52, 37.2],
      [76, 7.2, 57, 39.9],
    ],
  },
  {
    dob: "2026-09-10",
    rows: [
      [0, 2.8, 47.3, 32.5],
      [30, 3.7, 51.6, 35.3],
      [76, 4.9, 56.5, 37.6],
    ],
  },
  {
    dob: "2026-09-10",
    rows: [
      [0, 2.8, 47.5, 34.5],
      [30, 3.6, 52, 37.2],
      [76, 4.4, 57, 39.9],
    ],
  },
  {
    dob: "2026-09-10",
    rows: [
      [0, 2.6, 50, 34.5],
      [30, 3.5, 55.2, 37.4],
      [76, 4.7, 61.5, 39.9],
    ],
  },
  {
    dob: "2026-09-10",
    rows: [
      [0, 3.3, 50, 34.5],
      [30, 4.6, 55.2, 37.4],
      [76, 6.1, 61.5, 39.9],
    ],
  },
  { dob: "2022-11-26", rows: [[1460, 20.5, 110.5, 52.3]] },
];

export default function Page() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setIndex(Number(query.get("c") ?? 0));
  }, []);
  const wfa = useWhoTable("wfa", "boys");
  const lhfa = useWhoTable("lhfa", "boys");
  const hcfa = useWhoTable("hcfa", "boys");
  if (!wfa.data || !lhfa.data || !hcfa.data) return <p>Đang tải bảng WHO…</p>;

  const { dob, rows: measured } = CASES[index] ?? CASES[0];
  const rows = measured.map(
    ([age, kg, cm, head]) =>
      ({
        id: `fixture-${age}`,
        baby_id: "fixture",
        measured_on: addDays(dob, age),
        weight_g: Math.round(kg * 1000),
        length_cm: cm,
        head_cm: head,
        created_by: "fixture",
        created_at: addDays(dob, age),
        updated_at: addDays(dob, age),
      }) as GrowthRow,
  );
  const tables: GrowthTables = {
    wfa: wfa.data.rows as LmsRow[],
    lhfa: lhfa.data.rows as LmsRow[],
    hcfa: hcfa.data.rows as LmsRow[],
  };
  const base = { rows, tables, dob, sex: "boys" as const };
  const alerts = growthAlerts({ ...base, babyName: "Bun" });
  const summaries = indicatorSummaries({ ...base, alerts });

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture gần ranh, trường hợp {index}</p>
      {alerts.map((alert) => (
        <GrowthAlertCard key={alert.indicator} alert={alert} onWhy={() => {}} />
      ))}
      <GrowthVerdict
        head={verdictHead({ babyName: "Bun", alerts, summaries })}
        measured="Đo gần nhất (fixture)"
        summaries={summaries}
      />
      <GrowthList
        items={listRows({ rows, tables, dob, alerts })}
        pending={new Set()}
        canEdit={() => false}
        onOpen={() => {}}
      />
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 9). Chạy `bun run dev`. Cỡ 375×812.

Trên trang tạm `http://localhost:3000/fixture-growth?c=0` (chiều dài gần mức thấp):

1. Thẻ kết luận mở đầu bằng vòng tròn có dấu tích và tiêu đề "Bun phát triển bình thường". Ngay dưới là một dải nền vàng: câu đậm "Chiều dài đang gần mức thấp của chuẩn." rồi "Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới."
2. Khối Chiều dài: chip "Gần mức thấp" (nền vàng). Dưới thanh có ba nhãn: "56,0 cm" (đậm, màu cảnh báo), "giữa 60,0", "64,0 cm". Dưới nữa là dòng đậm "Cách mức thấp nhất của chuẩn 0,9 cm", rồi câu "Dài hơn 6 trong 100 bé trai cùng tuổi · +4,9 cm sau 46 ngày".
3. Khối Cân nặng và Vòng đầu: chip "Bình thường"; nhãn "4,7 kg", "giữa 6,0", "7,5 kg" và "37,6 cm", "giữa 39,9", "42,2 cm"; không nhãn nào đậm, không có dòng "Cách mức".
4. Mỗi nhãn nằm ngay dưới điểm của nó trên thanh: nhãn trái dưới chỗ vạch mỏng nối vào viên to, nhãn phải dưới chỗ viên to nối vào vạch mỏng, nhãn giữa ở giữa thanh. Không nhãn nào đè lên nhau, bị cắt hay tràn ra ngoài thẻ. Chấm của Chiều dài nằm trong viên to, gần đầu trái của nó.
5. Danh sách: 3 hàng đều có chip "Gần mức thấp".

Lần lượt các trường hợp còn lại:

6. `?c=1`: dải vàng có hai câu đậm, "Chiều dài đang gần mức thấp của chuẩn." rồi "Cân nặng đang gần mức cao của chuẩn."; khối Cân nặng có chip "Gần mức cao", nhãn "7,5 kg" đậm, dòng "Cách mức cao nhất của chuẩn 0,3 kg".
7. `?c=2`: câu đậm "Cân nặng, chiều dài và vòng đầu đang gần mức thấp của chuẩn."; Cân nặng "Cách mức thấp nhất của chuẩn 0,2 kg", Chiều dài "Cách mức thấp nhất của chuẩn 0,5 cm", Vòng đầu (37,6 cm, đúng bằng nhãn "37,6 cm") "Sát mức thấp nhất của chuẩn".
8. `?c=3`: có thẻ cảnh báo "Cân nặng thấp hơn chuẩn". Thẻ kết luận không có tiêu đề và dấu tích, nhưng vẫn có dải vàng về chiều dài. Khối Cân nặng: chip "Thấp", đủ ba nhãn, không nhãn nào đậm, không dòng "Cách mức"; chấm nằm trên vạch mỏng bên trái.
9. `?c=4`: Cân nặng 4,7 kg, chip "Gần mức thấp", nhãn "4,7 kg" đậm, dòng "Sát mức thấp nhất của chuẩn".
10. `?c=5`: tiêu đề "Bun đang lớn đều", không có dải vàng, không nhãn nào đậm; danh sách ba hàng "Bình thường".
11. `?c=6` (bé 4 tuổi, số dài nhất): nhãn "12,8 kg", "giữa 16,3", "21,1 kg"; "95,0 cm", "giữa 103,3", "111,6 cm"; "47,3 cm", "giữa 50,2", "53,1 cm"; không nhãn nào đè nhau hay tràn thẻ. Câu so sánh của chiều dài bắt đầu bằng "Cao hơn". Hàng duy nhất của danh sách: "25/11 · 47 tháng 30 ngày", chip "Gần mức cao"; nếu tiêu đề bị ngắt làm hai dòng thì ghi lại (M2g sửa), không phải lỗi của plan này.
12. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở `?c=0` và `?c=6`.
13. Lặp mục 1, 2 (ở `?c=0`) và mục 8 (ở `?c=3`) với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: dải vàng, nhãn đậm và dòng "Cách mức" đọc rõ. Ở `night` màu tốt và màu cảnh báo trùng nhau: nhãn ở ranh vẫn phải nhận ra được nhờ chữ đậm.

Trang thật (chỉ xem):

14. `http://localhost:3000/tang-truong`: ghi lại tiêu đề thẻ kết luận, chip, ba nhãn và dòng "Cách mức" (nếu có) của từng chỉ số. Với số đo ngày 25/11 của bé (5,7 kg, 56,9 cm), kỳ vọng: "Bun phát triển bình thường", Chiều dài "Gần mức thấp", nhãn "56,0 cm" đậm, "Cách mức thấp nhất của chuẩn 0,9 cm"; nếu số đo thật đã khác thì ghi cái đang thấy.
15. Cũng trang đó: không có thẻ cảnh báo, không có chấm trên thanh chọn chỉ số, chấm mới nhất của biểu đồ vẫn màu thường; hàng trên cùng của danh sách có chip khớp thẻ kết luận.
16. `http://localhost:3000/suc-khoe`: thẻ Tăng trưởng còn ghi "Lớn đều" (M2g đổi), khối "Cần chú ý" không có dòng tăng trưởng.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả kiểm (2026-11-25).** Người dùng chọn khung Browser trong app (question card). Cỡ 375×812, theme đang lưu là `dark`, phiên Kim Bun còn đăng nhập. Chỉ xem: không bấm Lưu, không mở sheet; lần bấm duy nhất là nút "Chiều dài" trên thanh chọn chỉ số của trang thật. Vị trí nhãn đo bằng script trong trang (`getBoundingClientRect`), không ước bằng mắt. Ảnh để ở thư mục ghi chú chung, `m2f-screens/` (19 ảnh).

Trước bước này: `bun run typecheck` sạch; `bunx vitest run` ra `Test Files  172 passed (172)`, `Tests  1383 passed (1383)`; `bun run build` lần đầu dừng vì cảnh báo bảo mật của Next.js 16.4.3, lần hai `✓ Generating static pages (39/39)`, mã 0. Không chạy `next upgrade`.

Trang tạm (`dark`):

- Mục 1, 2, 3, 5 (`?c=0`): đúng từng chữ. Dấu tích, "Bun phát triển bình thường", dải vàng một câu đậm; Chiều dài "Gần mức thấp", "56,0 cm" đậm (700) màu cảnh báo, "Cách mức thấp nhất của chuẩn 0,9 cm" (600), "Dài hơn 6 trong 100 bé trai cùng tuổi · +4,9 cm sau 46 ngày"; Cân nặng "4,7 kg / giữa 6,0 / 7,5 kg" và Vòng đầu "37,6 cm / giữa 39,9 / 42,2 cm", không nhãn đậm, không dòng "Cách mức"; ba hàng danh sách "Gần mức thấp".
- Mục 4: ở cả 7 trường hợp (21 thanh), tâm mỗi nhãn lệch 0,0 px so với điểm của nó (hai đầu viên to ở 51,6 và 257,4 trên thanh rộng 309 px; giữa thanh). Khoảng hở nhỏ nhất giữa hai nhãn cạnh nhau: 43,4 px (`?c=6`, "giữa 103,3" và "111,6 cm"). Mọi nhãn nằm trong phần ruột của thẻ, một dòng, cách đáy thanh 13 px. Chấm Chiều dài của `?c=0` ở 75,8 px, trong viên to, gần đầu trái.
- Mục 6 (`?c=1`): đúng. Hai câu đậm theo thứ tự thấp trước, cao sau; Cân nặng "Gần mức cao", "7,5 kg" đậm, "Cách mức cao nhất của chuẩn 0,3 kg". Chiều dài 57 cm ra "Cách mức thấp nhất của chuẩn 1,0 cm". Ba hàng danh sách "Gần mức cao" (cân nặng đứng trước).
- Mục 7 (`?c=2`): đúng. "Cân nặng, chiều dài và vòng đầu đang gần mức thấp của chuẩn."; "0,2 kg", "0,5 cm", Vòng đầu "Sát mức thấp nhất của chuẩn".
- Mục 8 (`?c=3`): đúng. Thẻ cảnh báo "Cân nặng thấp hơn chuẩn"; thẻ kết luận không tiêu đề, không dấu tích, còn dải vàng về chiều dài; Cân nặng chip "Thấp", ba nhãn thường, không dòng "Cách mức", chấm trên vạch mỏng bên trái (25,5 px). Hàng trên cùng của danh sách "Thấp", hai hàng dưới "Gần mức thấp".
- Mục 9 (`?c=4`): đúng. 4,7 kg, "Gần mức thấp", "4,7 kg" đậm, "Sát mức thấp nhất của chuẩn".
- Mục 10 (`?c=5`): đúng. "Bun đang lớn đều", không dải vàng, không nhãn đậm, ba hàng "Bình thường".
- Mục 11 (`?c=6`): đúng. "12,8 kg / giữa 16,3 / 21,1 kg", "95,0 cm / giữa 103,3 / 111,6 cm", "47,3 cm / giữa 50,2 / 53,1 cm"; không đè, không tràn. Câu so sánh "Cao hơn 96 trong 100 bé trai cùng tuổi". Hàng "25/11 · 47 tháng 30 ngày" với chip "Gần mức cao": tiêu đề nằm trên một dòng (hàng này không có dấu "Chờ đồng bộ").
- Mục 12: `scrollWidth` 375, `innerWidth` 375 ở cả 7 trường hợp. Không phần tử nào bị cắt "…".
- Mục 13: `?c=0` và `?c=3` ở `rose`, `light`, `dark`, `night`: dải vàng, nhãn đậm và dòng "Cách mức" đọc rõ. Ở `night` chip "Gần mức thấp" và "Bình thường" cùng tông, chỉ khác chữ (đã biết); nhãn ở ranh nhận ra được nhờ chữ đậm và sáng hơn (217,137,92 so với 181,115,79 của nhãn thường); dải nhắc chỉ đậm hơn nền thẻ một chút, chữ vẫn rõ. Chưa xem `peach`, `lavender`, `sea`.

Trang thật (`dark`, chỉ xem):

- Mục 14 (`/tang-truong`): đúng kỳ vọng. "Bun phát triển bình thường", "Đo gần nhất 25/11 · 2 tháng 15 ngày", dải vàng "Chiều dài đang gần mức thấp của chuẩn. …". Cân nặng 5,7 kg "Bình thường", "4,7 kg / giữa 6,0 / 7,5 kg", "Nặng hơn 34 trong 100 bé trai cùng tuổi · +0,2 kg sau 10 ngày". Chiều dài 56,9 cm "Gần mức thấp", "56,0 cm" đậm, "giữa 60,0", "64,0 cm", "Cách mức thấp nhất của chuẩn 0,9 cm", "Dài hơn 6 trong 100 bé trai cùng tuổi · +1,9 cm sau 10 ngày". Chưa có số đo vòng đầu nên không có khối Vòng đầu. Nhãn lệch 0,0 px, `scrollWidth` 375. Cũng xem ở `night` và `rose` (đặt tạm trên trang, không lưu).
- Mục 15: không thẻ cảnh báo, không chấm trên thanh chọn (thanh mở ở "Cân nặng"); chấm mới nhất của biểu đồ cân nặng và chiều dài đều màu `accent`; biểu đồ chiều dài đọc "… Lần gần nhất: Gần mức thấp."; hàng 25/11 có chip "Gần mức thấp", khớp thẻ kết luận. Hàng 15/11 (5,5 kg, 55 cm) cũng "Gần mức thấp".
- Mục 16 (`/suc-khoe`): thẻ Tăng trưởng ghi "Lớn đều" (M2g đổi); trang không có khối "Cần chú ý".

Không thấy lỗi nào của plan này. Chưa kiểm: bề ngang 440 px; theme `peach`, `lavender`, `sea`; hàng danh sách đang chờ đồng bộ đứng cạnh chip "Gần mức thấp/cao" (trang tạm để `pending` rỗng; phần của M2g); VoiceOver đọc `aria-label` của thanh; iPhone thật, PWA.

**Phản hồi của người dùng trong lúc kiểm, và phần sửa theo đó (2026-11-25, ngoài 6 patch của plan này).** Người dùng viết: "không cần nặng hơn ... trong 100 hoặc dài hơn, quá nhiều thông tin gây rối, chỉ cần ghi cảnh báo nằm trong nhóm thiếu cân, thấp hơn so với tiêu chuẩn". Hỏi lại bằng question card, người dùng chọn **bỏ cả 4 chỗ**; cùng lúc chọn **giữ M2f trên nhánh**, chưa lên `main`.

Commit `163040c` (sau commit ghi kết quả `6819891`):

- Thẻ kết luận: dưới hàng nhãn (và dòng "Cách mức…" nếu có) chỉ còn dòng chênh, "+1,9 cm sau 10 ngày"; không có lần đo trước thì không có dòng nào. Chỉ số đang có cảnh báo `falling` hoặc `rising` cũng ghi dòng chênh thường, không còn "trước đó là {n} trong 100".
- Thẻ cảnh báo `low`, `high`: nội dung chỉ còn "{giá trị} lúc {tuổi}." Tiêu đề, lời khuyên và các loại cảnh báo khác không đổi; không thêm chữ "thiếu cân".
- `aria-label` của thanh: "{chip}. Chuẩn từ {low} đến {high} {đơn vị}, giữa {mid}."
- Xóa `comparePhrase`, `outOf100` (`lib/rules/growthForm.ts`) và `lib/rules/comparePhrase.test.ts`; bỏ `GrowthAlert.previousPercentile`, `IndicatorSummary.compare`; `indicatorSummaries` không còn nhận `sex` (bảng đã theo giới). Giữ hai câu nói về chuẩn: "95 trong 100 bé khỏe mạnh nằm trong vùng xanh." dưới biểu đồ và câu trong popup "Vì sao có cảnh báo này?".
- Spec đã sửa cho khớp (§2, §5.1, §5.2, §5.3, §5.6, §9.2); file spec vẫn chưa commit.
- **Các số của plan này đổi sau commit đó:** vitest nay là `Test Files  171 passed (171)`, `Tests  1381 passed (1381)` (không còn là 1383 test, 172 file ghi ở Contracts); đỏ trước khi sửa code: 12 test, 5 file. `tsc --noEmit` sạch; `bun run build` lần hai mã 0. Plan M2g không đụng file nào trong commit này, nhưng số test kỳ vọng của nó phải tính lại từ 1381 test, 171 file.
- Xem lại ở 375×812 (khung Browser, `dark`, trang tạm dựng lại rồi xóa): `?c=0` ba khối chỉ còn dòng chênh; `?c=3` thẻ cảnh báo "Cân nặng thấp hơn chuẩn" với "4,4 kg lúc 2 tháng 15 ngày."; `?c=7` (thêm tạm: chiều dài tăng chậm) khối Chiều dài chip "Tăng chậm", dòng "+2 cm sau 46 ngày"; trang thật `/tang-truong`: Cân nặng "+0,2 kg sau 10 ngày", Chiều dài "Cách mức thấp nhất của chuẩn 0,9 cm" rồi "+1,9 cm sau 10 ngày". Nhãn vẫn lệch 0,0 px, `scrollWidth` 375, không còn chữ "trong 100 bé" nào trên màn. Ảnh `m2f-screens/bo-cau-*.jpg`. Chưa xem lại ở theme khác `dark` và `/suc-khoe` (commit này không đụng trang đó).

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-growth
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec và file plan khác có thể hiện là untracked: không commit chúng
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2f.md
git commit -m "docs(plan): record the M2f check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; chỗ nào chưa đẹp thì nêu trước, kèm cách sửa. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m2f
git push origin main
```
