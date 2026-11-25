# Kim Bun — Sức khỏe M2d: biểu đồ vùng bình thường Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§5.4; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng: "Duyệt năm plan"; patch và số test sinh lại cùng ngày trên nền bản sửa thanh vị trí, xem Ghi chú khi thực thi; chưa có lệnh chạy, mỗi lần lên `main` vẫn phải hỏi)

**Goal:** Biểu đồ Tăng trưởng vẽ một vùng xanh "bình thường", đường giữa và đường nối các lần đo của bé, chấm mới nhất to hơn và có nhãn; bỏ 5 đường bách phân vị.

**Architecture:**

- **Luật thuần:** `curve()` trong `lib/rules/growth.ts` trả 3 giá trị `low`, `mid`, `high` (z −2, 0, +2); `chartView` trong `lib/rules/growthView.ts` tính những gì biểu đồ hiện ngoài vùng tô.
- **Biểu đồ:** `GrowthChart` (Recharts, tải lười như cũ) chỉ vẽ; tiêu đề, chú giải và dòng nguồn nằm ở `GrowthChartCard` không tải lười, nên test được bằng markup tĩnh.
- Danh sách các lần đo giữ kiểu cũ tới M2e. Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m2d`, cắt từ `main` sau khi M2c và bản sửa thanh vị trí (nhánh `fix/kim-bun-position-bar-night`) đã lên. Baseline: 1299 test vitest xanh (172 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                                        | Plan                                           |
| ------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| M1a, M1b, M1c      | §3, §4 dòng 2 và 3                                                              | đã xong, đã lên `main` @ `5ecc02c`             |
| M2a                | §5.1 luật cảnh báo, §5.2 câu so sánh; chip và dòng 1 của §4 trên trang Sức khỏe | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md` |
| M2b                | §5.3: luật và khối giao diện của thẻ kết luận, thẻ cảnh báo; popup              | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2b.md` |
| M2c                | §5.3: màn Tăng trưởng mở đầu bằng cảnh báo và kết luận                          | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2c.md` |
| **M2d (plan này)** | §5.4 biểu đồ                                                                    | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2d.md` |
| M2e                | §5.5 các lần đo; xóa `formatZ`                                                  | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2e.md` |
| M3                 | §6 Chiều cao, thẻ mục tiêu của §5.3                                             | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4                                  | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                                                    | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M2 chia năm plan.** Spec §10 ghi M2 là một mốc. Bản dựng thử cho thấy M2 dài quá một plan, nên cắt ở năm chỗ app vẫn chạy trọn vẹn: M2a có luật cảnh báo và đưa cảnh báo lên trang Sức khỏe; M2b thêm luật và khối giao diện của thẻ kết luận, thẻ cảnh báo (màn hình chưa đổi); M2c ghép chúng vào màn Tăng trưởng (biểu đồ và danh sách còn kiểu cũ); M2d đổi biểu đồ; M2e đổi danh sách các lần đo.
2. **Hình vẽ của biểu đồ không có unit test.** Recharts không vẽ gì khi dựng tĩnh trong test (đã thử: markup ra 127 ký tự, không có đường nào). Vì vậy mọi phép tính nằm ở `chartView` và `curve` (có test), khung quanh biểu đồ nằm ở `GrowthChartCard` (có test), còn chính hình vẽ được xem ở Task 2 trên một trang fixture tạm. **Nếu hình vẽ sai ở bước đó thì dừng và báo người dùng**, không tự sửa ngoài patch.
3. **Trục ngang giữ chữ "tháng" ở cuối trục** như biểu đồ hiện tại, thay vì viết nhãn cuối thành `{n} tháng` như §5.4 ghi: nhãn dài ở vạch cuối sẽ tràn mép phải của thẻ. **Đây là chỗ plan lệch spec có chủ ý; người dùng cần biết khi duyệt.**
4. **Nhãn "Bình thường"** đặt ở mép phải, giữa đường giữa và mép trên của vùng tô. Hai nhãn "Cao hơn chuẩn", "Thấp hơn chuẩn" là chữ HTML đặt ở góc trên trái và góc dưới phải của khung biểu đồ.
5. **Nhãn của chấm mới nhất** là giá trị có đơn vị (`formatGrowthValue`, ví dụ "6,1 kg"); khi có cảnh báo là `6,1 kg · Thấp` và nằm dưới chấm.
6. **Chấm mới nhất mà bảng WHO không đặt được** (quá 1856 ngày tuổi) vẽ màu thường, nhãn không có chip: cảnh báo là của lần đo gần nhất nằm trong bảng.
7. **`aria-label` của biểu đồ:** `{tiêu đề}. {n} lần đo. Lần gần nhất: {chip}.`; chưa có lần đo thì `{tiêu đề}. Chưa có lần đo.`
8. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 2** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2d.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 2 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `5ecc02c` và nối tiếp các plan trước của mốc M2; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn hoặc `var(--color-…)`. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 2 dừng lại hỏi, không tự push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Sinh lại ngày 2026-11-25, sau khi plan đã được duyệt.** Lần kiểm trình duyệt của M2c cho thấy ở theme Ban đêm hai vùng của thanh vị trí cùng một màu; bản sửa (nhánh `fix/kim-bun-position-bar-night`) đổi `components/growth/PositionBar.tsx`, `GrowthVerdict.tsx` và thêm một test vào `growthparts.test.tsx`. Các patch và số test của plan này được sinh lại và đo lại trên nền bản sửa đó; nội dung thay đổi của plan không đổi. Plan này chỉ chạy được sau khi bản sửa đã ở `main`.

## Contracts with Other Plans

Plan này đứng ngay sau M2c. M2e đứng ngay sau.

**Consumes (từ M2a, M2b và M2c):** `growthAlerts`, `GrowthAlert`, `GrowthMeasure`, `GrowthTables`, `alertTone` (`lib/rules/growthAlerts.ts`); `IndicatorSummary`, `indicatorSummaries`, `defaultIndicator` (`lib/rules/growthView.ts`); `GrowthAlertCard`, `GrowthVerdict`; các biến `tables`, `alerts`, `summaries`, `indicator`, `lms`, `range` của `GrowthScreen` (M2c).

**Produces:**

- `lib/rules/growth.ts`: `BAND_LINES` (z −2, 0, +2) thay `PERCENTILE_LINES`; `CurvePoint = { day; low; mid; high }`; `curve()` không đổi chữ ký.
- `lib/rules/growthAlerts.ts`: `newestFirst<T extends GrowthMeasure>(rows: T[]): T[]`.
- `lib/rules/growthView.ts`: `ChartView = { title; unit: "kg" | "cm"; points: { day; value }[]; last: { day; value; label; tone: "accent" | "warn" | "danger" } | null; ariaLabel; alertTone: "warn" | "danger" | null; shifted: boolean }`, `chartView(input: { indicator; rows; dob; alerts; summaries }): ChartView`.
- `components/growth/GrowthChart.tsx`: `GrowthChart({ band: CurvePoint[]; points; last; to; unit; label })`. `GrowthChartCard.tsx`: `GrowthChartCard({ title; babyName; alertTone; shifted; children })`.
- **Vitest sau M2d:** 1314 test, 172 file.

---

### Task 1: Biểu đồ: vùng bình thường, đường giữa, chấm mới nhất (§5.4)

**Files:**

- Create: `components/growth/GrowthChartCard.tsx`
- Modify: `lib/rules/growth.ts`, `lib/rules/growthAlerts.ts`, `lib/rules/growthView.ts`, `components/growth/GrowthChart.tsx`, `components/growth/GrowthScreen.tsx`
- Test: `lib/rules/growth.test.ts`, `lib/rules/growthView.test.ts`, `components/growth/growthparts.test.tsx`, `components/growth/growthscreen.test.tsx`

**Interfaces:**

- Consumes: `IndicatorSummary`, `GrowthAlert`, `GrowthMeasure`, `alertTone`, `readings` (M2a, M2b); `ageOnDay`; `formatGrowthValue`, `indicatorValue`, `INDICATORS`; `Glass`.
- Produces: `BAND_LINES`, `CurvePoint` mới; `newestFirst`; `ChartView`, `chartView`; `GrowthChartCard`; `GrowthChart` với prop mới.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m2d
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/growth/growthparts.test.tsx b/components/growth/growthparts.test.tsx
index ee94405..ac557c4 100644
--- a/components/growth/growthparts.test.tsx
+++ b/components/growth/growthparts.test.tsx
@@ -5,6 +5,7 @@ import type { GrowthAlert } from "@/lib/rules/growthAlerts";
 import type { IndicatorSummary } from "@/lib/rules/growthView";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { GrowthAlertCard } from "./GrowthAlertCard";
+import { GrowthChartCard } from "./GrowthChartCard";
 import { GrowthVerdict } from "./GrowthVerdict";
 import { PositionBar, ZONE_NORMAL, ZONE_OFF } from "./PositionBar";

@@ -196,3 +197,50 @@ describe("GrowthAlertCard", () => {
     expect(onWhy).toHaveBeenCalledOnce();
   });
 });
+
+// Spec 2026-11-25 §5.4: what surrounds the lazily loaded chart.
+describe("GrowthChartCard", () => {
+  const render = (alertTone: "warn" | "danger" | null, shifted = false) =>
+    renderToStaticMarkup(
+      <GrowthChartCard
+        title="Cân nặng theo tháng tuổi"
+        babyName="Bun"
+        alertTone={alertTone}
+        shifted={shifted}
+      >
+        <div data-chart="" />
+      </GrowthChartCard>,
+    );
+
+  it("a glass card: the title, the chart, the legend, the source line", () => {
+    const html = render(null);
+    const order = [
+      ">Cân nặng theo tháng tuổi</h2>",
+      "data-chart",
+      ">Bun</span>",
+      ">Vùng bình thường</span>",
+      ">Mức giữa</span>",
+      "95 trong 100 bé khỏe mạnh nằm trong vùng xanh. Nguồn: WHO Child Growth Standards.",
+    ].map((mark) => html.indexOf(mark));
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+    expect(html).toContain("glass");
+    expect(html).not.toContain("Lần đo có cảnh báo");
+    expect(html).not.toContain("hướng đi");
+  });
+
+  it("with an alert the legend names the coloured dot", () => {
+    expect(render("warn")).toContain(
+      '<span class="size-2.5 rounded-full bg-warn"></span>Lần đo có cảnh báo',
+    );
+    expect(render("danger")).toContain(
+      '<span class="size-2.5 rounded-full bg-danger"></span>Lần đo có cảnh báo',
+    );
+  });
+
+  it("a falling or rising alert adds the sentence about direction", () => {
+    expect(render("warn", true)).toContain(
+      "Nguồn: WHO Child Growth Standards. App cảnh báo theo hướng đi của bé, không chỉ theo vị trí.</p>",
+    );
+  });
+});
diff --git a/components/growth/growthscreen.test.tsx b/components/growth/growthscreen.test.tsx
index 3314fcc..d18ee39 100644
--- a/components/growth/growthscreen.test.tsx
+++ b/components/growth/growthscreen.test.tsx
@@ -21,8 +21,22 @@ vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
 vi.mock("next/dynamic", () => ({
   default:
     () =>
-    ({ unit, points }: { unit: string; points: unknown[] }) => (
-      <div data-chart={`${unit}:${points.length}`} />
+    ({
+      unit,
+      points,
+      last,
+      band,
+    }: {
+      unit: string;
+      points: unknown[];
+      last: { label: string; tone: string } | null;
+      band: Record<string, number>[];
+    }) => (
+      <div
+        data-chart={`${unit}:${points.length}`}
+        data-last={last ? `${last.label}|${last.tone}` : ""}
+        data-band={Object.keys(band[0] ?? {}).join(",")}
+      />
     ),
 }));

@@ -200,6 +214,25 @@ describe("GrowthScreen", () => {
     expect(html).not.toContain("Chưa có lần đo nào.");
   });

+  it("the chart card: a title, the band of the chosen indicator, the newest point", () => {
+    const html = render([
+      measure("2026-11-15", 5500),
+      measure("2026-10-14", 4400, 55),
+    ]);
+    expect(html).toContain(">Cân nặng theo tháng tuổi</h2>");
+    expect(html).toContain('data-band="day,low,mid,high"');
+    expect(html).toContain('data-last="5,5 kg|accent"');
+    expect(html).toContain("95 trong 100 bé khỏe mạnh nằm trong vùng xanh.");
+    expect(html).not.toContain("Đường WHO P3");
+    expect(html).not.toContain("Lần đo có cảnh báo");
+  });
+
+  it("the chart of an indicator with an alert marks its newest point", () => {
+    const html = render([measure("2026-11-15", 4000)]);
+    expect(html).toContain('data-last="4 kg · Thấp|warn"');
+    expect(html).toContain("Lần đo có cảnh báo");
+  });
+
   it("the why popup is closed until asked for", () => {
     expect(render([measure("2026-11-15", 4000)])).not.toContain("<dialog");
   });
diff --git a/lib/rules/growth.test.ts b/lib/rules/growth.test.ts
index f779d87..d151bb0 100644
--- a/lib/rules/growth.test.ts
+++ b/lib/rules/growth.test.ts
@@ -1,3 +1,4 @@
+import * as growth from "./growth";
 import { describe, expect, it } from "vitest";
 import {
   loadWhoTable,
@@ -140,8 +141,9 @@ describe("assess", () => {
   });
 });

+// Spec 2026-11-25 §5.4.
 describe("curve", () => {
-  it("gives the five percentile lines every `step` days within the table", () => {
+  it("gives the edges of the normal band (z −2 and z +2) and the median every `step` days", () => {
     const rows: LmsRow[] = Array.from({ length: 11 }, (_, day) => [
       day,
       1,
@@ -150,8 +152,18 @@ describe("curve", () => {
     ]);
     const points = curve(rows, 0, 20, 5);
     expect(points.map((p) => p.day)).toEqual([0, 5, 10]);
-    expect(points[1].P50).toBeCloseTo(15, 10);
-    expect(points[1].P97).toBeCloseTo(15 * (1 + 0.1 * 1.881), 10);
-    expect(points[1].P3).toBeCloseTo(15 * (1 - 0.1 * 1.881), 10);
+    expect(Object.keys(points[1])).toEqual(["day", "low", "mid", "high"]);
+    expect(points[1].mid).toBeCloseTo(15, 10);
+    expect(points[1].high).toBeCloseTo(15 * (1 + 0.1 * 2), 10);
+    expect(points[1].low).toBeCloseTo(15 * (1 - 0.1 * 2), 10);
+  });
+
+  it("BAND_LINES replaces the five percentile lines", () => {
+    expect(growth.BAND_LINES).toEqual([
+      { label: "low", z: -2 },
+      { label: "mid", z: 0 },
+      { label: "high", z: 2 },
+    ]);
+    expect(Object.keys(growth)).not.toContain("PERCENTILE_LINES");
   });
 });
diff --git a/lib/rules/growthView.test.ts b/lib/rules/growthView.test.ts
index dcf8789..0e87686 100644
--- a/lib/rules/growthView.test.ts
+++ b/lib/rules/growthView.test.ts
@@ -8,6 +8,7 @@ import {
 } from "./growthAlerts";
 import {
   alertDots,
+  chartView,
   defaultIndicator,
   formatChange,
   gaugePosition,
@@ -170,3 +171,100 @@ describe("defaultIndicator and alertDots", () => {
     expect(alertDots(alerts)).toEqual({ lhfa: "warn", hcfa: "danger" });
   });
 });
+
+// Spec 2026-11-25 §5.4.
+describe("chartView", () => {
+  const chart = (
+    rows: GrowthMeasure[],
+    indicator: "wfa" | "lhfa" | "hcfa" = "wfa",
+  ) => {
+    const { alerts, summaries } = view(rows);
+    return chartView({ indicator, rows, dob: DOB, alerts, summaries });
+  };
+
+  it("titles the chart and names the unit", () => {
+    expect(chart([], "wfa")).toMatchObject({
+      title: "Cân nặng theo tháng tuổi",
+      unit: "kg",
+    });
+    expect(chart([], "lhfa")).toMatchObject({
+      title: "Chiều dài theo tháng tuổi",
+      unit: "cm",
+    });
+    expect(chart([], "hcfa").title).toBe("Vòng đầu theo tháng tuổi");
+  });
+
+  it("lists the measurements of the indicator oldest first, by day of age", () => {
+    const { points } = chart([
+      measure(86, 17.5),
+      measure(60, null, 16),
+      measure(40, 16),
+    ]);
+    expect(points).toEqual([
+      { day: 40, value: 16 },
+      { day: 86, value: 17.5 },
+    ]);
+  });
+
+  it("the newest point carries its value as the label, in the accent colour", () => {
+    expect(chart([measure(86, 17.5), measure(40, 16)]).last).toEqual({
+      day: 86,
+      value: 17.5,
+      label: "17,5 kg",
+      tone: "accent",
+    });
+  });
+
+  it("with an alert the newest point takes the alert colour and the chip in its label", () => {
+    const yellow = chart([measure(40, 11)]);
+    expect(yellow.last).toEqual({
+      day: 40,
+      value: 11,
+      label: "11 kg · Thấp",
+      tone: "warn",
+    });
+    expect(yellow.alertTone).toBe("warn");
+    expect(chart([measure(40, 9)]).last?.tone).toBe("danger");
+    expect(chart([measure(40, 9)]).alertTone).toBe("danger");
+  });
+
+  it("an alert on another indicator leaves this chart alone", () => {
+    const other = chart([measure(40, 16, 9)], "wfa");
+    expect(other.last?.tone).toBe("accent");
+    expect(other.alertTone).toBeNull();
+  });
+
+  it("shifted is set for falling and rising only", () => {
+    expect(
+      chart([measure(54, null, 13.34), measure(40, null, 16)], "lhfa").shifted,
+    ).toBe(true);
+    expect(chart([measure(40, null, 11)], "lhfa").shifted).toBe(false);
+    expect(chart([measure(40, 16)]).shifted).toBe(false);
+  });
+
+  it("no measurement: no points and no newest point", () => {
+    const empty = chart([measure(40, null, 16)], "wfa");
+    expect(empty.points).toEqual([]);
+    expect(empty.last).toBeNull();
+    expect(empty.ariaLabel).toBe("Cân nặng theo tháng tuổi. Chưa có lần đo.");
+  });
+
+  it("describes itself: the indicator, how many measurements, the newest status", () => {
+    expect(chart([measure(86, 17.5), measure(40, 16)]).ariaLabel).toBe(
+      "Cân nặng theo tháng tuổi. 2 lần đo. Lần gần nhất: Bình thường.",
+    );
+    expect(chart([measure(40, 11)]).ariaLabel).toBe(
+      "Cân nặng theo tháng tuổi. 1 lần đo. Lần gần nhất: Thấp.",
+    );
+  });
+
+  it("a newest point the WHO table cannot place keeps the plain label", () => {
+    const late = chart([measure(1857, 9), measure(40, 16)]);
+    expect(late.last).toEqual({
+      day: 1857,
+      value: 9,
+      label: "9 kg",
+      tone: "accent",
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  4 failed | 168 passed (172)`, `Tests  23 failed | 1276 passed (1299)`. File `growthparts.test.tsx` không chạy được test nào vì chưa có `GrowthChartCard`; `growthView.test.ts` đỏ vì chưa có `chartView`; `curve` còn trả 5 đường.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/growth/GrowthChart.tsx b/components/growth/GrowthChart.tsx
index 332c074..35ae517 100644
--- a/components/growth/GrowthChart.tsx
+++ b/components/growth/GrowthChart.tsx
@@ -1,40 +1,62 @@
 "use client";

 import {
+  Area,
   CartesianGrid,
   ComposedChart,
   Line,
+  ReferenceDot,
   ResponsiveContainer,
-  Scatter,
   XAxis,
   YAxis,
 } from "recharts";
-import { PERCENTILE_LINES, type CurvePoint } from "@/lib/rules/growth";
+import type { CurvePoint } from "@/lib/rules/growth";
+import type { ChartView } from "@/lib/rules/growthView";

 const DAYS_PER_MONTH = 30.4375;
 const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

-// Spec §6.5: WHO P3–P97 lines by sex, with the baby's measurements as dots.
+const TONE = {
+  accent: "var(--color-accent)",
+  warn: "var(--color-warn)",
+  danger: "var(--color-danger)",
+} as const;
+
+// Spec 2026-11-25 §5.4: the normal band (z −2 to +2) by sex, its median, and
+// the baby's measurements joined by a line.
 export function GrowthChart({
-  curve,
+  band,
   points,
+  last,
   to,
   unit,
+  label,
 }: {
-  curve: CurvePoint[];
-  points: { day: number; value: number }[];
+  band: CurvePoint[];
+  points: ChartView["points"];
+  last: ChartView["last"];
   to: number;
   unit: string;
+  label: string;
 }) {
   const months = Math.round(to / DAYS_PER_MONTH);
   const every = months > 24 ? 6 : months > 12 ? 3 : 1;
   const ticks = Array.from({ length: Math.floor(months / every) + 1 }, (_, i) =>
     Math.round(i * every * DAYS_PER_MONTH),
   );
+  const data = band.map((point) => ({
+    day: point.day,
+    range: [point.low, point.high],
+    mid: point.mid,
+  }));
+  const end = band.at(-1);
   return (
-    <div className="h-72 w-full">
+    <div role="img" aria-label={label} className="relative h-72 w-full">
       <ResponsiveContainer width="100%" height="100%">
-        <ComposedChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
+        <ComposedChart
+          data={data}
+          margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
+        >
           <CartesianGrid
             strokeDasharray="3 3"
             stroke="var(--color-muted)"
@@ -73,28 +95,72 @@ export function GrowthChart({
               fill: "var(--color-muted)",
             }}
           />
-          {PERCENTILE_LINES.map((line) => (
-            <Line
-              key={line.label}
-              data={curve}
-              dataKey={line.label}
-              dot={false}
-              isAnimationActive={false}
-              stroke={
-                line.z === 0 ? "var(--color-good-ink)" : "var(--color-muted)"
-              }
-              strokeWidth={line.z === 0 ? 2 : 1}
-              strokeDasharray={Math.abs(line.z) > 1.5 ? "4 3" : undefined}
-            />
-          ))}
-          <Scatter
+          <Area
+            dataKey="range"
+            stroke="none"
+            fill="var(--color-good)"
+            fillOpacity={0.14}
+            activeDot={false}
+            isAnimationActive={false}
+          />
+          <Line
+            dataKey="mid"
+            dot={false}
+            activeDot={false}
+            isAnimationActive={false}
+            stroke="var(--color-good-ink)"
+            strokeWidth={1.5}
+            strokeDasharray="4 4"
+          />
+          <Line
             data={points}
             dataKey="value"
-            fill="var(--color-accent)"
+            activeDot={false}
             isAnimationActive={false}
+            stroke={TONE.accent}
+            strokeWidth={2.5}
+            dot={{ r: 4.5, fill: TONE.accent, strokeWidth: 0 }}
           />
+          {end && (
+            <ReferenceDot
+              x={end.day}
+              y={(end.mid + end.high) / 2}
+              r={0}
+              label={{
+                value: "Bình thường",
+                position: "left",
+                fontSize: 11,
+                fontWeight: 600,
+                fill: "var(--color-good-ink)",
+              }}
+            />
+          )}
+          {last && (
+            <ReferenceDot
+              x={last.day}
+              y={last.value}
+              r={6.5}
+              fill={TONE[last.tone]}
+              stroke="var(--color-glass-solid)"
+              strokeWidth={2.5}
+              label={{
+                value: last.label,
+                // An alert label sits under the dot, clear of the band above.
+                position: last.tone === "accent" ? "top" : "bottom",
+                fontSize: 13,
+                fontWeight: 700,
+                fill: "var(--color-ink)",
+              }}
+            />
+          )}
         </ComposedChart>
       </ResponsiveContainer>
+      <span className="pointer-events-none absolute top-3 left-11 text-[11px] leading-none text-muted">
+        Cao hơn chuẩn
+      </span>
+      <span className="pointer-events-none absolute right-3 bottom-11 text-[11px] leading-none text-muted">
+        Thấp hơn chuẩn
+      </span>
     </div>
   );
 }
diff --git a/components/growth/GrowthChartCard.tsx b/components/growth/GrowthChartCard.tsx
new file mode 100644
index 0000000..876bec5
--- /dev/null
+++ b/components/growth/GrowthChartCard.tsx
@@ -0,0 +1,59 @@
+import type { ReactNode } from "react";
+import { Glass } from "@/components/ui/Glass";
+import { cx } from "@/lib/ui/cx";
+
+// Spec 2026-11-25 §5.4: the title, legend and source line around the chart.
+// The chart itself is loaded lazily and passed in as children.
+export function GrowthChartCard({
+  title,
+  babyName,
+  alertTone,
+  shifted,
+  children,
+}: {
+  title: string;
+  babyName: string;
+  // The colour of the newest point when its indicator has an alert.
+  alertTone: "warn" | "danger" | null;
+  // A falling or rising alert: say that direction counts too.
+  shifted: boolean;
+  children: ReactNode;
+}) {
+  return (
+    <Glass className="flex flex-col gap-2.5 p-3">
+      <h2 className="px-1 text-[15px] font-semibold text-ink">{title}</h2>
+      {children}
+      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1 text-xs text-muted">
+        <span className="flex items-center gap-1.5">
+          <span className="size-2.5 rounded-full bg-accent" />
+          {babyName}
+        </span>
+        {alertTone && (
+          <span className="flex items-center gap-1.5">
+            <span
+              className={cx(
+                "size-2.5 rounded-full",
+                alertTone === "danger" ? "bg-danger" : "bg-warn",
+              )}
+            />
+            Lần đo có cảnh báo
+          </span>
+        )}
+        <span className="flex items-center gap-1.5">
+          <span className="h-2.5 w-3.5 rounded-[3px] bg-good/25" />
+          Vùng bình thường
+        </span>
+        <span className="flex items-center gap-1.5">
+          <span className="w-3.5 border-t-2 border-dashed border-good-ink" />
+          Mức giữa
+        </span>
+      </div>
+      <p className="px-1 text-[13px] leading-[18px] text-muted">
+        95 trong 100 bé khỏe mạnh nằm trong vùng xanh. Nguồn: WHO Child Growth
+        Standards.
+        {shifted &&
+          " App cảnh báo theo hướng đi của bé, không chỉ theo vị trí."}
+      </p>
+    </Glass>
+  );
+}
diff --git a/components/growth/GrowthScreen.tsx b/components/growth/GrowthScreen.tsx
index af68bdd..a6764c5 100644
--- a/components/growth/GrowthScreen.tsx
+++ b/components/growth/GrowthScreen.tsx
@@ -4,7 +4,6 @@ import dynamic from "next/dynamic";
 import { useState } from "react";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { ErrorCard } from "@/components/ui/ErrorCard";
-import { Glass } from "@/components/ui/Glass";
 import { IconButton } from "@/components/ui/IconButton";
 import { PageHeader } from "@/components/ui/PageHeader";
 import { Popup } from "@/components/ui/Popup";
@@ -24,20 +23,17 @@ import {
   growthAlerts,
   type GrowthTables,
 } from "@/lib/rules/growthAlerts";
-import {
-  chartRange,
-  indicatorValue,
-  INDICATORS,
-  latestGrowth,
-} from "@/lib/rules/growthForm";
+import { chartRange, INDICATORS, latestGrowth } from "@/lib/rules/growthForm";
 import {
   alertDots,
+  chartView,
   defaultIndicator,
   indicatorSummaries,
 } from "@/lib/rules/growthView";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import type { Baby, GrowthRow } from "@/lib/supabase/rows";
 import { GrowthAlertCard } from "./GrowthAlertCard";
+import { GrowthChartCard } from "./GrowthChartCard";
 import { GrowthList } from "./GrowthList";
 import { GrowthSheet } from "./GrowthSheet";
 import { GrowthVerdict } from "./GrowthVerdict";
@@ -96,12 +92,12 @@ export function GrowthScreen({
   const lms = tables[indicator];
   const range = chartRange(ageDays(baby.dob, new Date()));
   const current = INDICATORS.find((i) => i.key === indicator)!;
-  const points = rows.flatMap((row) => {
-    const value = indicatorValue(row, indicator);
-    const days = Math.round(
-      (Date.parse(row.measured_on) - Date.parse(baby.dob)) / 86_400_000,
-    );
-    return value === null ? [] : [{ day: days, value }];
+  const chart = chartView({
+    indicator,
+    rows,
+    dob: baby.dob,
+    alerts,
+    summaries,
   });
   const canEdit = (row: GrowthRow) => isOwner || row.created_by === userId;

@@ -145,25 +141,27 @@ export function GrowthScreen({
             value={indicator}
             onChange={setPicked}
           />
-          <Glass className="p-3">
+          <GrowthChartCard
+            title={chart.title}
+            babyName={baby.name}
+            alertTone={chart.alertTone}
+            shifted={chart.shifted}
+          >
             {lms ? (
               <GrowthChart
-                curve={curve(lms, 0, range.to, range.step)}
-                points={points}
+                band={curve(lms, 0, range.to, range.step)}
+                points={chart.points}
+                last={chart.last}
                 to={range.to}
-                unit={indicator === "wfa" ? "kg" : "cm"}
+                unit={chart.unit}
+                label={chart.ariaLabel}
               />
             ) : table.isError ? (
               <ChartUnavailable />
             ) : (
               <Skeleton className="h-72" />
             )}
-          </Glass>
-          <p className="px-1 text-[13px] text-muted">
-            Đường WHO P3, P15, P50 (đậm), P85, P97 cho{" "}
-            {sex === "girls" ? "bé gái" : "bé trai"}; chấm là các lần đo của bé.
-            Nguồn: WHO Child Growth Standards.
-          </p>
+          </GrowthChartCard>
         </>
       )}
       {waitingForNetwork(growth) ? (
diff --git a/lib/rules/growth.ts b/lib/rules/growth.ts
index 16e2cdc..f763eb9 100644
--- a/lib/rules/growth.ts
+++ b/lib/rules/growth.ts
@@ -6,13 +6,12 @@ export type GrowthLevel = "green" | "yellow" | "red";

 const DAY_MS = 86_400_000;

-// Spec §7.3: P3 / P15 / P50 / P85 / P97 lines.
-export const PERCENTILE_LINES = [
-  { label: "P3", z: -1.881 },
-  { label: "P15", z: -1.036 },
-  { label: "P50", z: 0 },
-  { label: "P85", z: 1.036 },
-  { label: "P97", z: 1.881 },
+// Spec 2026-11-25 §5.4: the edges of the normal band and its median. The
+// band ends where rateZ starts to warn.
+export const BAND_LINES = [
+  { label: "low", z: -2 },
+  { label: "mid", z: 0 },
+  { label: "high", z: 2 },
 ] as const;

 export function lmsAt(rows: LmsRow[], day: number): Lms | null {
@@ -88,7 +87,7 @@ export function assess(
 }

 export type CurvePoint = { day: number } & Record<
-  (typeof PERCENTILE_LINES)[number]["label"],
+  (typeof BAND_LINES)[number]["label"],
   number
 >;

@@ -104,8 +103,7 @@ export function curve(
     const lms = lmsAt(rows, day);
     if (!lms) break;
     const point = { day } as CurvePoint;
-    for (const line of PERCENTILE_LINES)
-      point[line.label] = valueAtZ(lms, line.z);
+    for (const line of BAND_LINES) point[line.label] = valueAtZ(lms, line.z);
     points.push(point);
   }
   return points;
diff --git a/lib/rules/growthAlerts.ts b/lib/rules/growthAlerts.ts
index bcf91a6..618dbe9 100644
--- a/lib/rules/growthAlerts.ts
+++ b/lib/rules/growthAlerts.ts
@@ -75,14 +75,9 @@ const oneDecimal = new Intl.NumberFormat("vi-VN", {
 });
 const tenth = (n: number) => Math.round(n * 10) / 10;

-// The measurements of one indicator that fall inside the WHO table, newest
-// first: by measured_on, then created_at; rows with neither keep their order.
-export function readings(
-  rows: GrowthMeasure[],
-  table: LmsRow[],
-  dob: string,
-  indicator: WhoIndicator,
-): Reading[] {
+// Newest first: by measured_on, then created_at; rows with neither keep
+// their order.
+export function newestFirst<T extends GrowthMeasure>(rows: T[]): T[] {
   return rows
     .map((row, index) => ({ row, index }))
     .sort(
@@ -91,22 +86,33 @@ export function readings(
         (b.row.created_at ?? "").localeCompare(a.row.created_at ?? "") ||
         a.index - b.index,
     )
-    .flatMap(({ row }): Reading[] => {
-      const value = indicatorValue(row, indicator);
-      if (value === null || !(value > 0)) return [];
-      const ageDays = ageOnDay(dob, row.measured_on);
-      const lms = lmsAt(table, ageDays);
-      if (!lms) return [];
-      return [
-        {
-          day: row.measured_on,
-          ageDays,
-          value,
-          z: zScore(lms, value),
-          median: lms.m,
-        },
-      ];
-    });
+    .map(({ row }) => row);
+}
+
+// The measurements of one indicator that fall inside the WHO table, newest
+// first: by measured_on, then created_at; rows with neither keep their order.
+export function readings(
+  rows: GrowthMeasure[],
+  table: LmsRow[],
+  dob: string,
+  indicator: WhoIndicator,
+): Reading[] {
+  return newestFirst(rows).flatMap((row): Reading[] => {
+    const value = indicatorValue(row, indicator);
+    if (value === null || !(value > 0)) return [];
+    const ageDays = ageOnDay(dob, row.measured_on);
+    const lms = lmsAt(table, ageDays);
+    if (!lms) return [];
+    return [
+      {
+        day: row.measured_on,
+        ageDays,
+        value,
+        z: zScore(lms, value),
+        median: lms.m,
+      },
+    ];
+  });
 }

 // Where a z-score sits against the ±2 and ±3 lines; null inside ±2.
diff --git a/lib/rules/growthView.ts b/lib/rules/growthView.ts
index e1b7519..78d365d 100644
--- a/lib/rules/growthView.ts
+++ b/lib/rules/growthView.ts
@@ -1,17 +1,19 @@
 import type { WhoIndicator, WhoSex } from "@/lib/content/who";
-import { percentile } from "./growth";
+import { ageOnDay, percentile } from "./growth";
 import {
   alertTone,
   type GrowthAlert,
   type GrowthMeasure,
   type GrowthTables,
   type GrowthTone,
+  newestFirst,
   readings,
 } from "./growthAlerts";
 import {
   comparePhrase,
   formatGrowthValue,
   INDICATORS,
+  indicatorValue,
   outOf100,
 } from "./growthForm";

@@ -103,3 +105,73 @@ export function alertDots(
     alerts.map((alert) => [alert.indicator, alertTone(alert.level)]),
   );
 }
+
+// Spec 2026-11-25 §5.4: what the chart of one indicator draws besides the band.
+export type ChartView = {
+  title: string;
+  unit: "kg" | "cm";
+  // Oldest first; `day` is the age in days.
+  points: { day: number; value: number }[];
+  last: {
+    day: number;
+    value: number;
+    label: string;
+    tone: "accent" | "warn" | "danger";
+  } | null;
+  ariaLabel: string;
+  alertTone: "warn" | "danger" | null;
+  // A falling or rising alert: the caption adds a sentence about direction.
+  shifted: boolean;
+};
+
+export function chartView(input: {
+  indicator: WhoIndicator;
+  rows: GrowthMeasure[];
+  dob: string;
+  alerts: GrowthAlert[];
+  summaries: IndicatorSummary[];
+}): ChartView {
+  const { indicator } = input;
+  const name = INDICATORS.find((item) => item.key === indicator)!.title;
+  const title = `${name} theo tháng tuổi`;
+  const measured = newestFirst(input.rows).flatMap((row) => {
+    const value = indicatorValue(row, indicator);
+    return value === null
+      ? []
+      : [
+          {
+            on: row.measured_on,
+            day: ageOnDay(input.dob, row.measured_on),
+            value,
+          },
+        ];
+  });
+  const [newest] = measured;
+  // An alert is about the newest measurement the WHO table can place; a newer
+  // one outside the table is drawn plainly.
+  const alert = input.alerts.find(
+    (item) => item.indicator === indicator && item.measuredOn === newest?.on,
+  );
+  const summary = input.summaries.find((item) => item.indicator === indicator);
+  const tone = alert ? alertTone(alert.level) : null;
+  const value = newest ? formatGrowthValue(indicator, newest.value) : "";
+  return {
+    title,
+    unit: indicator === "wfa" ? "kg" : "cm",
+    points: measured.map(({ day, value: v }) => ({ day, value: v })).reverse(),
+    last: newest
+      ? {
+          day: newest.day,
+          value: newest.value,
+          label: alert ? `${value} · ${alert.chip}` : value,
+          tone: tone ?? "accent",
+        }
+      : null,
+    ariaLabel:
+      measured.length === 0
+        ? `${title}. Chưa có lần đo.`
+        : `${title}. ${measured.length} lần đo.${summary ? ` Lần gần nhất: ${summary.chip.text}.` : ""}`,
+    alertTone: tone,
+    shifted: alert?.kind === "falling" || alert?.kind === "rising",
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  172 passed (172)`, `Tests  1314 passed (1314)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/growth.ts lib/rules/growth.test.ts lib/rules/growthAlerts.ts lib/rules/growthView.ts lib/rules/growthView.test.ts components/growth
git commit -m "feat(growth): the chart draws the normal band, the median and the newest point" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Kiểm cuối M2d và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-growth/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  172 passed (172)`, `Tests  1314 passed (1314)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm cho các trạng thái dữ liệu thật không có**

Trang này chỉ đọc bảng WHO (file nội dung của app), không đọc hay ghi dữ liệu của gia đình. Tạo `app/fixture-growth/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { GrowthAlertCard } from "@/components/growth/GrowthAlertCard";
import { GrowthChart } from "@/components/growth/GrowthChart";
import { GrowthChartCard } from "@/components/growth/GrowthChartCard";
import { GrowthVerdict } from "@/components/growth/GrowthVerdict";
import { Popup } from "@/components/ui/Popup";
import type { LmsRow, WhoIndicator } from "@/lib/content/who";
import { useWhoTable } from "@/lib/data/growth";
import { addDays } from "@/lib/rules/days";
import { curve } from "@/lib/rules/growth";
import {
  alertReason,
  type GrowthAlertKind,
  growthAlerts,
  type GrowthTables,
} from "@/lib/rules/growthAlerts";
import { chartRange } from "@/lib/rules/growthForm";
import {
  chartView,
  defaultIndicator,
  indicatorSummaries,
} from "@/lib/rules/growthView";
import { vnDateString } from "@/lib/rules/time";
import type { GrowthRow } from "@/lib/supabase/rows";

const AGE = 76;
// [ngày tuổi, kg, cm, vòng đầu cm]. ?c=0 bình thường · 1 cân tăng chậm ·
// 2 chiều dài rất thấp · 3 sụt cân · 4 cân cao · 5 cân rất cao ·
// 6 vòng đầu tăng nhanh · 7 chiều dài thấp.
const CASES: [number, number, number, number][][] = [
  [
    [0, 3.3, 50, 34.5],
    [30, 4.6, 55.2, 37.4],
    [AGE, 6.1, 61.5, 39.9],
  ],
  [
    [0, 3.3, 50, 34.5],
    [30, 4.4, 55.2, 37.4],
    [AGE, 4.8, 61.5, 39.9],
  ],
  [
    [0, 3.3, 50, 34.5],
    [30, 4.6, 55.2, 37.4],
    [AGE, 6.1, 52, 39.9],
  ],
  [
    [0, 3.3, 50, 34.5],
    [30, 4.6, 55.2, 37.4],
    [AGE, 4.4, 61.5, 39.9],
  ],
  [
    [0, 3.3, 50, 34.5],
    [30, 4.6, 55.2, 37.4],
    [AGE, 7.9, 61.5, 39.9],
  ],
  [
    [0, 3.3, 50, 34.5],
    [30, 4.6, 55.2, 37.4],
    [AGE, 9, 61.5, 39.9],
  ],
  [
    [0, 3.3, 50, 34.5],
    [30, 4.6, 55.2, 37.4],
    [AGE, 6.1, 61.5, 41.8],
  ],
  [
    [0, 3.3, 46, 34.5],
    [30, 4.6, 51, 37.4],
    [AGE, 6.1, 55.5, 39.9],
  ],
];

export default function Page() {
  const [index, setIndex] = useState(0);
  const [indicator, setIndicator] = useState<WhoIndicator | null>(null);
  const [why, setWhy] = useState<GrowthAlertKind | null>(null);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setIndex(Number(query.get("c") ?? 0));
    setIndicator(query.get("i") as WhoIndicator | null);
  }, []);
  const wfa = useWhoTable("wfa", "boys");
  const lhfa = useWhoTable("lhfa", "boys");
  const hcfa = useWhoTable("hcfa", "boys");
  if (!wfa.data || !lhfa.data || !hcfa.data) return <p>Đang tải bảng WHO…</p>;

  const dob = addDays(vnDateString(new Date()), -AGE);
  const rows = (CASES[index] ?? CASES[0]).map(
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
  const shown = indicator ?? defaultIndicator(alerts);
  const chart = chartView({ indicator: shown, rows, dob, alerts, summaries });
  const range = chartRange(AGE);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">
        Fixture tăng trưởng, trường hợp {index}, chỉ số {shown}
      </p>
      {alerts.map((alert) => (
        <GrowthAlertCard
          key={alert.indicator}
          alert={alert}
          onWhy={() => setWhy(alert.kind)}
        />
      ))}
      <GrowthVerdict
        babyName="Bun"
        measured="Đo gần nhất (fixture)"
        calm={alerts.length === 0}
        summaries={summaries}
      />
      <GrowthChartCard
        title={chart.title}
        babyName="Bun"
        alertTone={chart.alertTone}
        shifted={chart.shifted}
      >
        <GrowthChart
          band={curve(tables[shown]!, 0, range.to, range.step)}
          points={chart.points}
          last={chart.last}
          to={range.to}
          unit={chart.unit}
          label={chart.ariaLabel}
        />
      </GrowthChartCard>
      {why && (
        <Popup title="Vì sao có cảnh báo này?" onClose={() => setWhy(null)}>
          {alertReason(why)}
        </Popup>
      )}
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 8). Chạy `bun run dev`. Cỡ 375×812.

Trên trang tạm `http://localhost:3000/fixture-growth?c=0`:

1. Biểu đồ có một vùng tô xanh nhạt chạy từ trái sang phải, một đường nét đứt ở giữa vùng, ba chấm của bé nối nhau bằng đường màu nhấn, chấm cuối to hơn và có nhãn "6,1 kg" phía trên. Vùng tô không che mất chấm và nhãn.
2. Ba nhãn chữ: "Cao hơn chuẩn" ở góc trên trái (nằm ngoài vùng tô), "Bình thường" ở mép phải trong vùng tô, "Thấp hơn chuẩn" ở góc dưới phải (nằm ngoài vùng tô). Không nhãn nào đè lên trục hay lên nhau. Nếu nhãn đè lên vùng tô hoặc lên đường của bé thì ghi rõ vị trí.
3. Trục dọc có "kg", trục ngang có "tháng". Chú giải dưới biểu đồ có "Bun", "Vùng bình thường", "Mức giữa"; dòng nguồn ghi "95 trong 100 bé khỏe mạnh nằm trong vùng xanh."

Lần lượt `?c=1` đến `?c=7` (ghi lại tiêu đề thẻ cảnh báo thấy ở mỗi trường hợp; kỳ vọng theo thứ tự, đã thử với bảng WHO thật: "Cân nặng tăng chậm lại", "Chiều dài thấp hơn chuẩn nhiều", "Cân nặng giảm", "Cân nặng cao hơn chuẩn", "Cân nặng cao hơn chuẩn nhiều", "Vòng đầu tăng nhanh", "Chiều dài thấp hơn chuẩn"). Trang tự mở biểu đồ của chỉ số có cảnh báo:

4. Chấm cuối của biểu đồ đổi màu (vàng; đỏ ở `?c=2` và `?c=5`), nhãn nằm dưới chấm và có chip, ví dụ "4,8 kg · Tăng chậm"; nhãn không bị cắt ở mép. Cả 7 chip cảnh báo đều thấy được qua 7 trường hợp: Tăng chậm, Rất thấp, Giảm cân, Cao, Rất cao, Tăng nhanh, Thấp.
5. Chú giải có thêm "Lần đo có cảnh báo". Ở `?c=1` dòng nguồn có thêm câu "App cảnh báo theo hướng đi của bé, không chỉ theo vị trí." Cũng ở `?c=1`, chạm "Vì sao có cảnh báo này?": một hộp thoại hiện ở giữa màn hình, nền tối phủ kín, có đúng một đoạn giải thích; đóng bằng nút "Đã hiểu", rồi mở lại và đóng bằng cách chạm vùng tối. Sau khi đóng, trang cuộn được như thường.
6. Thêm `&i=lhfa` rồi `&i=hcfa` vào `?c=0`: biểu đồ đổi sang cm, vùng tô và chấm vẫn đúng.
7. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở `?c=0` và `?c=1`.
8. Lặp mục 1 và 4 ở `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: vùng tô còn thấy được, chữ đọc rõ.

Nếu mục 1, 2 hoặc 4 cho thấy biểu đồ vẽ sai (không có vùng tô, vùng tô lệch khỏi trục, thiếu chấm, nhãn tràn khung): **dừng, không sửa gì, báo người dùng** kèm mô tả và ảnh chụp (Diễn giải spec, mục 2).

Trang thật `http://localhost:3000/tang-truong`:

9. Biểu đồ của bé theo kiểu mới; chạm đổi chỉ số thì biểu đồ, tiêu đề và đơn vị đổi theo.
10. Danh sách các lần đo còn kiểu cũ (M2e đổi).

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả (2026-11-25, nhánh `feat/kim-bun-suc-khoe-m2d` @ `9a79712`).**

Step 1: `tsc --noEmit` sạch; `Test Files  172 passed (172)`, `Tests  1314 passed (1314)`. Step 2: `bun run build` lần đầu dừng vì cảnh báo bảo mật của Next.js 16.4.3 (mã 1), lần hai `✓ Generating static pages (39/39)`, mã 0; không chạy `next upgrade`.

Trình duyệt: người dùng chọn khung Browser trong app (question card), 375×812, theme đang mở là `dark`. Chỉ xem; trên trang thật chỉ chạm hai nút "Chiều dài", "Vòng đầu" của thanh chọn chỉ số. Ảnh chụp nằm ở thư mục ghi chú chung của nhóm phiên, `m2d-screens/` (20 ảnh, ngoài repo).

**Lỗi hình thấy được, chưa sửa (dừng theo Diễn giải spec mục 2):**

- **Nhãn của chấm có cảnh báo bị đường của bé cắt ngang.** Nhãn nằm dưới chấm, canh giữa theo chấm, nên phần trái của nó rơi đúng lên đoạn đường nối tới chấm. Thấy ở 6 trên 7 trường hợp có cảnh báo, ở cả `dark`, `night`, `rose`, `light`: `?c=1` đường cắt qua "4,8" (dấu phẩy bị che); `?c=3` chấm đầu và đường đè lên số "4"; `?c=4` đường cắt qua "kg"; `?c=5` đường cắt qua dấu "·"; `?c=6` đường cắt qua khoảng giữa "cm" và "Tăng nhanh"; `?c=7` đường cắt qua "55,5". Riêng `?c=2` nhãn chỉ chạm sát chấm đầu (cách 0–1 px), không bị cắt.
- **`?c=6`: nhãn "41,8 cm · Tăng nhanh" đè lên trục dọc và lên số "40" của trục.** Nhãn rộng 136 px, mép trái ở x = 54 px trong khi trục dọc ở x = 65 px. Ở `?c=1` nhãn (122 px) cũng lấn qua trục dọc 4 px, chưa chạm số nào. Bé càng nhỏ tháng thì chấm mới nhất càng sát trục dọc, nên chuyện này sẽ gặp với dữ liệu thật khi có cảnh báo.
- Không nhãn nào tràn ra ngoài khung biểu đồ hay bị cắt "…".

Trang tạm `/fixture-growth`:

1. `?c=0`: **đạt.** Vùng tô chạy từ tháng 0 tới tháng 12 (ở `dark` là xám xanh nhạt), đường nét đứt ở giữa vùng, ba chấm nối bằng đường màu nhấn, chấm cuối to hơn, viền tối, nhãn "6,1 kg" phía trên. Vùng tô không che chấm hay nhãn. Mép phải của nhãn chạm đầu đường nét đứt, chữ vẫn đọc rõ.
2. **Đạt.** "Cao hơn chuẩn" ở góc trên trái, ngoài vùng tô; "Bình thường" ở mép phải, trong vùng tô, giữa đường giữa và mép trên; "Thấp hơn chuẩn" ở góc dưới phải, ngoài vùng tô. Ba nhãn này không đè lên trục, lên nhau hay lên đường của bé. Ở `?c=0` mép trên của vùng tô chạm đỉnh trục (12 kg lúc 12 tháng).
3. **Đạt.** Trục dọc "kg", trục ngang "tháng"; chú giải "Bun", "Vùng bình thường", "Mức giữa"; dòng nguồn "95 trong 100 bé khỏe mạnh nằm trong vùng xanh. Nguồn: WHO Child Growth Standards."
4. Tiêu đề thẻ cảnh báo đúng thứ tự kỳ vọng: `?c=1` "Cân nặng tăng chậm lại", `?c=2` "Chiều dài thấp hơn chuẩn nhiều", `?c=3` "Cân nặng giảm", `?c=4` "Cân nặng cao hơn chuẩn", `?c=5` "Cân nặng cao hơn chuẩn nhiều", `?c=6` "Vòng đầu tăng nhanh", `?c=7` "Chiều dài thấp hơn chuẩn". Trang tự mở đúng chỉ số có cảnh báo (wfa, lhfa, wfa, wfa, wfa, hcfa, lhfa). Chấm cuối đổi màu: vàng ở 1, 3, 4, 6, 7; đỏ ở 2 và 5. Nhãn nằm dưới chấm, đủ 7 chip: "4,8 kg · Tăng chậm", "52 cm · Rất thấp", "4,4 kg · Giảm cân", "7,9 kg · Cao", "9 kg · Rất cao", "41,8 cm · Tăng nhanh", "55,5 cm · Thấp". Không nhãn nào bị cắt ở mép khung. **Không đạt ở chỗ nhãn bị đường của bé cắt và đè lên trục, xem phần lỗi ở trên.**
5. **Đạt.** Chú giải có "Lần đo có cảnh báo" ở cả 7 trường hợp. Câu "App cảnh báo theo hướng đi của bé, không chỉ theo vị trí." có ở `?c=1` và `?c=6`, không có ở năm trường hợp còn lại. Hộp thoại "Vì sao có cảnh báo này?" ở `?c=1`: mở bằng `showModal()` (`:modal` đúng), nằm giữa màn hình (khung 300 px, x 38–338, y 288–524), nền tối 40% phủ kín, đúng một đoạn giải thích, tiêu điểm ở nút "Đã hiểu". Đóng bằng "Đã hiểu": hết; mở lại, chạm vùng tối: hết. Sau đó trang cuộn được tới đáy. Phím Esc: chưa kiểm.
6. **Đạt.** `?c=0&i=lhfa`: "Chiều dài theo tháng tuổi", trục 45–81 cm, nhãn "61,5 cm". `?c=0&i=hcfa`: "Vòng đầu theo tháng tuổi", trục 30–50 cm, nhãn "39,9 cm". Vùng tô, đường giữa, ba chấm đều đúng.
7. **Đạt.** `scrollWidth <= innerWidth` là `true` ở mọi trang đã mở (375 và 375).
8. `dark`: xem đủ `?c=0` đến `?c=7`. `night`: `?c=0`, `?c=1`, `?c=2`. `rose`: `?c=0`, `?c=1`, `?c=5`. `light`: `?c=0`, `?c=1`, `?c=2`. Vùng tô thấy được và chữ đọc rõ ở cả bốn theme. Ghi nhận thêm:
   - `night`: đường và chấm của bé dùng `--color-accent` của theme này (nâu sẫm `#6b2a12`), nằm trên nền tối nên mờ, phải nhìn kỹ mới thấy; chấm mới nhất khi không có cảnh báo cũng màu đó. Vùng tô, đường giữa và chấm vàng cùng một màu cam (`--color-good` và `--color-warn` đều là `#d9895c`); dòng nguồn vẫn ghi "vùng xanh".
   - Chấm đỏ gần màu với chấm thường của bé: `dark` `rgb(255,138,122)` cạnh `rgb(255,122,168)`; `rose` `rgb(173,16,37)` cạnh `rgb(168,37,90)`; `light` `rgb(196,20,43)` cạnh `rgb(184,40,94)`. Hai chấm trong chú giải khó phân biệt; trên biểu đồ còn nhận ra nhờ chấm cuối to hơn và nhãn có chip.
   - `peach`, `lavender`, `sea`: chưa kiểm.

Hai thứ lần đầu nhìn thấy, đều trên trang tạm:

- **Chấm của thanh vị trí trên vạch mảnh 6 px:** thấy ở `?c=2` (sát đầu trái), `?c=3` và `?c=7` (trên vạch trái), `?c=4` (trên vạch phải), `?c=5` (sát đầu phải) ở `dark`; thêm `?c=2` ở `night` và `light`, `?c=5` ở `rose`. Chấm 20 px nằm cân trên vạch, đọc rõ. Ở `?c=2` và `?c=5` tâm chấm nằm đúng đầu mút của thanh nên nửa chấm thò ra ngoài thanh khoảng 10 px, vẫn trong thẻ, không bị cắt.
- **Vòng tròn và nút nền vàng của thẻ cảnh báo (`bg-warn text-bg`):** `dark` nền `rgb(255,197,107)`, chữ `rgb(15,11,18)`; `night` nền `rgb(217,137,92)`, chữ `rgb(10,7,5)`: biểu tượng và chữ "Báo cáo cho bác sĩ" đọc rõ ở cả hai. `rose` nền `rgb(127,74,0)`, `light` nền `rgb(149,87,0)`, chữ sáng: đọc rõ. Thẻ đỏ: `dark` và `rose` nền đỏ chữ trắng, đọc rõ; `night` nền `rgb(74,20,10)` chữ `rgb(224,112,74)`, trầm nhưng đọc được.

Trang thật `/tang-truong` (theme `dark`; 2 lần đo 25/11 và 15/11, không có cảnh báo):

9. **Đạt.** Biểu đồ kiểu mới: "Cân nặng theo tháng tuổi", vùng tô, đường giữa, hai chấm, nhãn "5,7 kg" trên chấm mới nhất; hai chấm cách nhau 10 ngày nên chồng một phần lên nhau. Chạm "Chiều dài": tiêu đề "Chiều dài theo tháng tuổi", trục 45–81 cm, nhãn "56,9 cm". Chạm "Vòng đầu": tiêu đề "Vòng đầu theo tháng tuổi", trục 30–50 cm, chỉ có vùng tô và đường giữa, `aria-label` "Vòng đầu theo tháng tuổi. Chưa có lần đo." Không cuộn ngang; console không có lỗi.
10. **Đạt.** Danh sách các lần đo còn kiểu cũ ("z -0,4 · P33,7").

Chưa kiểm: thẻ cảnh báo, chấm đổi màu và hộp thoại trên trang thật (dữ liệu thật không có cảnh báo); `peach`, `lavender`, `sea`; trang thật ở theme khác `dark`; phím Esc của hộp thoại; iPhone thật, PWA.

`bun run dev` đã dừng; `.claude/launch.json` tạm đã xóa.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-growth
git status --short   # chỉ còn file plan này thay đổi
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2d.md
git commit -m "docs(plan): record the M2d check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m2d
git push origin main
```
