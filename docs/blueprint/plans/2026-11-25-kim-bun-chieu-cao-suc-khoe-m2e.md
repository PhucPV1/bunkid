# Kim Bun — Sức khỏe M2e: danh sách các lần đo bằng lời Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§5.5; việc xóa `formatZ` ở §5.2; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng: "Duyệt năm plan"; patch và số test sinh lại cùng ngày trên `main` @ `6803b2a`, xem Ghi chú khi thực thi; mỗi lần lên `main` vẫn phải hỏi)

**Goal:** Danh sách các lần đo ghi ngày, tuổi, số đo, chênh so với lần trước và một chip bằng chữ. Trên màn Tăng trưởng không còn "z" hay "P".

**Architecture:**

- **Luật thuần:** `listRows` trong `lib/rules/growthView.ts` tính tiêu đề, số đo, dòng chênh và chip của từng hàng.
- **Danh sách:** `GrowthList` nhận sẵn `items` đã tính, không tự đánh giá z nữa. `formatZ` bị xóa.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m2e`, cắt từ `main` @ `6803b2a` (đã có M2d và hai bản sửa nhãn của biểu đồ, `db09280` và `e2ee19b`). Baseline: 1321 test vitest xanh (172 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                                        | Plan                                           |
| ------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| M1a, M1b, M1c      | §3, §4 dòng 2 và 3                                                              | đã xong, đã lên `main` @ `5ecc02c`             |
| M2a                | §5.1 luật cảnh báo, §5.2 câu so sánh; chip và dòng 1 của §4 trên trang Sức khỏe | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md` |
| M2b                | §5.3: luật và khối giao diện của thẻ kết luận, thẻ cảnh báo; popup              | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2b.md` |
| M2c                | §5.3: màn Tăng trưởng mở đầu bằng cảnh báo và kết luận                          | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2c.md` |
| M2d                | §5.4 biểu đồ                                                                    | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2d.md` |
| **M2e (plan này)** | §5.5 các lần đo; xóa `formatZ`                                                  | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2e.md` |
| M3                 | §6 Chiều cao, thẻ mục tiêu của §5.3                                             | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4                                  | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                                                    | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M2 chia năm plan.** Spec §10 ghi M2 là một mốc. Bản dựng thử cho thấy M2 dài quá một plan, nên cắt ở năm chỗ app vẫn chạy trọn vẹn: M2a có luật cảnh báo và đưa cảnh báo lên trang Sức khỏe; M2b thêm luật và khối giao diện của thẻ kết luận, thẻ cảnh báo (màn hình chưa đổi); M2c ghép chúng vào màn Tăng trưởng (biểu đồ và danh sách còn kiểu cũ); M2d đổi biểu đồ; M2e đổi danh sách các lần đo.
2. **Chênh của vòng đầu** ghi `vòng đầu +1 cm` để không lẫn với chênh của chiều dài (cùng đơn vị cm). Dấu trừ là ký tự "−" (U+2212).
3. **`formatPercentile` được giữ** vì `lib/rules/report.ts` còn dùng cho báo cáo bác sĩ; chỉ `formatZ` bị xóa.
4. **Hàng ngoài bảng WHO** ghi "Ngoài bảng WHO" như cũ; hàng mà bảng WHO chưa tải thì chưa có chip và không ghi gì.
5. **Cảnh báo gắn vào đúng một hàng:** hàng đầu tiên (mới nhất trước) của ngày đó có chỉ số đó. Hàng có hai cảnh báo lấy chip của cảnh báo `growthAlerts` trả trước.
6. **Thứ tự hàng** là mới nhất trước theo `newestFirst` (ngày đo, rồi `created_at`), bất kể thứ tự query trả về.
7. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2e.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 2 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `5ecc02c` và nối tiếp các plan trước của mốc M2; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn hoặc `var(--color-…)`. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 2 dừng lại hỏi, không tự push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Sinh lại ngày 2026-11-25, sau khi plan đã được duyệt, hai lần.** Lần đầu vì bản sửa thanh vị trí ở theme Ban đêm (`8583bec`); lần hai vì hai bản sửa nhãn của biểu đồ sau lần kiểm trình duyệt của M2d (`db09280`, `e2ee19b`). Các patch và số test của plan này được sinh lại và đo lại trên `main` @ `6803b2a`; nội dung thay đổi của plan không đổi.

## Contracts with Other Plans

Plan này đứng ngay sau M2d và là plan cuối của M2. M3 dùng màn Tăng trưởng này để thêm thẻ mục tiêu và đường mục tiêu.

**Consumes (từ M2a, M2b, M2d):** `newestFirst`, `positionKind`, `ALERT_CHIP`, `alertTone`, `GrowthAlert`, `GrowthMeasure`, `GrowthTables`, `GrowthTone` (`lib/rules/growthAlerts.ts`); `formatChange` (`lib/rules/growthView.ts`); `StatusChip`; các biến `rows`, `tables`, `alerts` của `GrowthScreen`.

**Produces:**

- `lib/rules/growthView.ts`: `GrowthListItem<T> = { row: T; title; values; delta: string | null; chip: { text; tone } | null; outside: boolean }`, `listRows<T extends GrowthMeasure>(input: { rows: T[]; tables; dob; alerts }): GrowthListItem<T>[]`.
- `components/growth/GrowthList.tsx`: `GrowthList({ items: GrowthListItem<GrowthRow>[]; pending; canEdit; onOpen })`.
- `lib/rules/growthForm.ts` không còn `formatZ`.
- **Vitest sau M2e:** 1341 test, 172 file.

---

### Task 1: Các lần đo bằng lời; bỏ z-score khỏi màn hình (§5.5, §5.2)

**Files:**

- Modify: `lib/rules/growthView.ts`, `lib/rules/growthForm.ts`, `components/growth/GrowthList.tsx`, `components/growth/GrowthScreen.tsx`
- Test: `lib/rules/growthView.test.ts`, `lib/rules/growthForm.test.ts`, `components/growth/growthlist.test.tsx`, `components/growth/growthscreen.test.tsx`

**Interfaces:**

- Consumes: `newestFirst` (M2d); `positionKind`, `ALERT_CHIP`, `alertTone`, `GrowthAlert`, `GrowthMeasure`, `GrowthTables`, `GrowthTone` (M2a); `formatChange` (M2b); `lmsAt`, `zScore`, `ageOnDay`; `formatDayShort`; `formatAgeVi`; `StatusChip`; `PendingMark`.
- Produces: `GrowthListItem<T>`, `listRows`; `GrowthList` với prop `items`; `formatZ` bị xóa.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m2e
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/growth/growthlist.test.tsx b/components/growth/growthlist.test.tsx
index 3d78e6e..aadfccf 100644
--- a/components/growth/growthlist.test.tsx
+++ b/components/growth/growthlist.test.tsx
@@ -1,7 +1,7 @@
 import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
 import { findElements } from "@/components/ui/testTree";
-import { formatGrowthValue } from "@/lib/rules/growthForm";
+import type { GrowthListItem } from "@/lib/rules/growthView";
 import type { GrowthRow } from "@/lib/supabase/rows";
 import { GrowthList } from "./GrowthList";

@@ -18,36 +18,101 @@ const row = (id: string, by: string): GrowthRow =>
     updated_at: "2026-11-01T00:00:00.000Z",
   }) as GrowthRow;

+const item = (
+  id: string,
+  by: string,
+  over: Partial<GrowthListItem<GrowthRow>> = {},
+): GrowthListItem<GrowthRow> => ({
+  row: row(id, by),
+  title: "01/11 · 1 tháng 22 ngày",
+  values: "5,2 kg · 58,5 cm",
+  delta: "+0,8 kg · +3,5 cm so với lần trước",
+  chip: { text: "Bình thường", tone: "good" },
+  outside: false,
+  ...over,
+});
+
 const props = (over: Partial<Parameters<typeof GrowthList>[0]> = {}) => ({
-  rows: [row("g1", "u1"), row("g2", "u2")],
-  lms: undefined,
-  indicator: "wfa" as const,
-  dob: "2026-09-10",
+  items: [item("g1", "u1"), item("g2", "u2", { delta: null })],
   pending: new Set(["g1"]),
   canEdit: (r: GrowthRow) => r.created_by === "u1",
   onOpen: () => {},
   ...over,
 });

+// Spec 2026-11-25 §5.5.
 describe("GrowthList", () => {
-  it("a glass list titled Các lần đo: date, age and each measured value", () => {
+  it("a glass list titled Các lần đo: the day and age, the values, the change, a chip", () => {
     const html = renderToStaticMarkup(<GrowthList {...props()} />);
     expect(html).toContain(">Các lần đo</h2>");
     expect(html).toContain("glass");
-    expect(html).toContain("01/11/2026 · ");
-    expect(html).toContain(">Cân nặng:</span>");
-    expect(html).toContain(`>${formatGrowthValue("wfa", 5.2)}</span>`);
-    expect(html).toContain(`>${formatGrowthValue("lhfa", 58.5)}</span>`);
-    expect(html).not.toContain(">Vòng đầu:</span>");
+    expect(html).toContain("01/11 · 1 tháng 22 ngày");
+    expect(html).toContain(
+      '<span class="text-[15px] text-ink tabular-nums">5,2 kg · 58,5 cm</span>',
+    );
+    expect(html).toContain(
+      '<span class="text-[13px] leading-[18px] text-muted">+0,8 kg · +3,5 cm so với lần trước</span>',
+    );
+    expect(html.match(/so với lần trước/g)).toHaveLength(1);
+    expect(
+      html.match(/bg-good-soft text-good-ink">Bình thường<\/span>/g),
+    ).toHaveLength(2);
+  });
+
+  it("no longer writes z-scores or percentile codes", () => {
+    const html = renderToStaticMarkup(<GrowthList {...props()} />);
+    expect(html).not.toMatch(/>z |· P\d/);
+    expect(html).not.toContain("Cân nặng:");
+  });
+
+  it("marks the row still waiting to sync and locks the rows of others", () => {
+    const html = renderToStaticMarkup(<GrowthList {...props()} />);
     expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
     expect(html.match(/disabled=""/g)).toHaveLength(1);
   });

+  it("a warning chip takes its tone", () => {
+    const html = renderToStaticMarkup(
+      <GrowthList
+        {...props({
+          items: [
+            item("g1", "u1", { chip: { text: "Tăng chậm", tone: "warn" } }),
+          ],
+        })}
+      />,
+    );
+    expect(html).toContain('bg-warn-soft text-warn-ink">Tăng chậm</span>');
+  });
+
+  it("a row outside the WHO table says so instead of a chip", () => {
+    const html = renderToStaticMarkup(
+      <GrowthList
+        {...props({ items: [item("g1", "u1", { chip: null, outside: true })] })}
+      />,
+    );
+    expect(html).toContain(
+      '<span class="shrink-0 text-[13px] text-muted">Ngoài bảng WHO</span>',
+    );
+    expect(html).not.toContain("rounded-full px-2.5");
+  });
+
+  it("a row not assessed yet has neither", () => {
+    const html = renderToStaticMarkup(
+      <GrowthList
+        {...props({
+          items: [item("g1", "u1", { chip: null, outside: false })],
+        })}
+      />,
+    );
+    expect(html).not.toContain("Ngoài bảng WHO");
+    expect(html).not.toContain("rounded-full px-2.5");
+  });
+
   it("opens a row its owner may edit", () => {
     const onOpen = vi.fn();
     const p = props({ onOpen });
     const [first] = findElements(GrowthList(p), (el) => el.type === "button");
     (first.props.onClick as () => void)();
-    expect(onOpen).toHaveBeenCalledWith(p.rows[0]);
+    expect(onOpen).toHaveBeenCalledWith(p.items[0].row);
   });
 });
diff --git a/components/growth/growthscreen.test.tsx b/components/growth/growthscreen.test.tsx
index d18ee39..2120679 100644
--- a/components/growth/growthscreen.test.tsx
+++ b/components/growth/growthscreen.test.tsx
@@ -233,6 +233,29 @@ describe("GrowthScreen", () => {
     expect(html).toContain("Lần đo có cảnh báo");
   });

+  it("the list: one row per measurement with the change and a chip, no z-score note", () => {
+    const html = render([
+      measure("2026-11-15", 5500),
+      measure("2026-10-14", 4400, 55),
+    ]);
+    const list = html.slice(html.indexOf(">Các lần đo</h2>"));
+    expect(list).toContain("15/11 · 2 tháng 1 ngày");
+    expect(list).toContain(">5,5 kg · 58,5 cm</span>");
+    expect(list).toContain(">+1,1 kg · +3,5 cm so với lần trước</span>");
+    expect(list.match(/>Bình thường<\/span>/g)).toHaveLength(2);
+    expect(html).not.toContain("z-score");
+  });
+
+  it("the list chips the row an alert is about", () => {
+    const html = render([
+      measure("2026-11-15", 4000),
+      // Lighter a month before, so the newest row is low, not a weight loss.
+      measure("2026-10-14", 3900, 55),
+    ]);
+    const list = html.slice(html.indexOf(">Các lần đo</h2>"));
+    expect(list).toContain('bg-warn-soft text-warn-ink">Thấp</span>');
+  });
+
   it("the why popup is closed until asked for", () => {
     expect(render([measure("2026-11-15", 4000)])).not.toContain("<dialog");
   });
diff --git a/lib/rules/growthForm.test.ts b/lib/rules/growthForm.test.ts
index 353a6a5..f29da21 100644
--- a/lib/rules/growthForm.test.ts
+++ b/lib/rules/growthForm.test.ts
@@ -3,12 +3,12 @@ import {
   chartRange,
   formatGrowthValue,
   formatPercentile,
-  formatZ,
   growthToRaw,
   indicatorValue,
   latestWeightG,
   parseGrowthForm,
 } from "./growthForm";
+import * as growthForm from "./growthForm";

 const ctx = { dob: "2026-09-14", today: "2026-11-14" };
 const raw = {
@@ -83,12 +83,9 @@ describe("display helpers", () => {
     });
   });

-  it("formats values, z and percentiles the Vietnamese way", () => {
+  it("formats values and percentiles the Vietnamese way", () => {
     expect(formatGrowthValue("wfa", 5.125)).toBe("5,13 kg");
     expect(formatGrowthValue("hcfa", 39)).toBe("39 cm");
-    expect(formatZ(0.456)).toBe("+0,5");
-    expect(formatZ(-2.04)).toBe("-2,0");
-    expect(formatZ(0)).toBe("0,0");
     expect(formatPercentile(67.04)).toBe("P67");
     expect(formatPercentile(2.27)).toBe("P2,3");
     expect(formatPercentile(0.05)).toBe("dưới P0,1");
@@ -119,3 +116,10 @@ describe("display helpers", () => {
     expect(chartRange(1850)).toEqual({ to: 1856, step: 30 });
   });
 });
+
+// Spec 2026-11-25 §5.2: the screens no longer print z-scores.
+describe("formatZ", () => {
+  it("is gone", () => {
+    expect(Object.keys(growthForm)).not.toContain("formatZ");
+  });
+});
diff --git a/lib/rules/growthView.test.ts b/lib/rules/growthView.test.ts
index 723b89e..c6c3b26 100644
--- a/lib/rules/growthView.test.ts
+++ b/lib/rules/growthView.test.ts
@@ -15,6 +15,7 @@ import {
   formatChange,
   gaugePosition,
   indicatorSummaries,
+  listRows,
 } from "./growthView";

 const DOB = "2026-01-01";
@@ -348,3 +349,121 @@ describe("chartView", () => {
     });
   });
 });
+
+// Spec 2026-11-25 §5.5.
+describe("listRows", () => {
+  const list = (rows: GrowthMeasure[], tables: GrowthTables = TABLES) =>
+    listRows({
+      rows,
+      tables,
+      dob: DOB,
+      alerts: growthAlerts({
+        rows,
+        tables,
+        dob: DOB,
+        sex: "boys",
+        babyName: "Bun",
+      }),
+    });
+
+  it("lists every measurement newest first and keeps the row it came from", () => {
+    const old = measure(10, 15);
+    const recent = measure(40, 16);
+    const items = list([old, recent]);
+    expect(items.map((item) => item.row)).toEqual([recent, old]);
+  });
+
+  it("titles a row with its day and the age, and the birth day with lúc sinh", () => {
+    const items = list([measure(40, 16), measure(0, 16)]);
+    expect(items.map((item) => item.title)).toEqual([
+      "10/02 · 1 tháng 9 ngày",
+      "01/01 · lúc sinh",
+    ]);
+  });
+
+  it("writes the values that were measured, the head with its name", () => {
+    expect(list([measure(40, 16, 16.5, 17)])[0].values).toBe(
+      "16 kg · 16,5 cm · vòng đầu 17 cm",
+    );
+    expect(list([measure(40, null, 16.5)])[0].values).toBe("16,5 cm");
+    expect(list([measure(40, null, null, 17)])[0].values).toBe(
+      "vòng đầu 17 cm",
+    );
+  });
+
+  it("the change is against the row just below, for the indicators both rows have", () => {
+    const items = list([
+      measure(86, 17.5, 16.3, 17),
+      measure(40, 16, 16, 16),
+      measure(10, null, 15.5),
+    ]);
+    expect(items.map((item) => item.delta)).toEqual([
+      "+1,5 kg · +0,3 cm · vòng đầu +1 cm so với lần trước",
+      "+0,5 cm so với lần trước",
+      null,
+    ]);
+  });
+
+  it("no indicator in common with the row below: no change line", () => {
+    expect(list([measure(40, 16), measure(10, null, 16)])[0].delta).toBeNull();
+  });
+
+  it("a drop is written with a minus sign", () => {
+    expect(list([measure(40, 15.85), measure(10, 16)])[0].delta).toBe(
+      "−0,15 kg so với lần trước",
+    );
+  });
+
+  it("chips an older row by where its values sit: normal, low or high, very low or very high", () => {
+    const items = list([
+      // Far enough from the others that it is compared with none of them.
+      measure(300, 16, 16),
+      measure(50, 16, 21),
+      measure(40, 9.5, 21),
+      measure(30, 16, 16),
+    ]);
+    expect(items.map((item) => item.chip)).toEqual([
+      { text: "Bình thường", tone: "good" },
+      { text: "Cao", tone: "warn" },
+      { text: "Rất thấp", tone: "danger" },
+      { text: "Bình thường", tone: "good" },
+    ]);
+  });
+
+  it("the newest row of an indicator with an alert takes the alert's chip", () => {
+    const items = list([measure(54, null, 13.34), measure(40, null, 16)]);
+    expect(items.map((item) => item.chip)).toEqual([
+      { text: "Tăng chậm", tone: "warn" },
+      { text: "Bình thường", tone: "good" },
+    ]);
+  });
+
+  it("two alerts on one row: the chip of the one growthAlerts lists first", () => {
+    // Weight is low (yellow), length very high (red): red comes first.
+    expect(list([measure(40, 11, 23)])[0].chip).toEqual({
+      text: "Rất cao",
+      tone: "danger",
+    });
+  });
+
+  it("two rows on one day are chipped each by its own values, the newer one first", () => {
+    const newer = { ...measure(40, 16), created_at: "2026-02-10T02:00:00Z" };
+    const older = { ...measure(40, 11), created_at: "2026-02-10T01:00:00Z" };
+    expect(list([older, newer]).map((item) => item.chip?.text)).toEqual([
+      "Bình thường",
+      "Thấp",
+    ]);
+  });
+
+  it("a row outside the WHO table has no chip and says so", () => {
+    const [late] = list([measure(1857, 20), measure(40, 16)]);
+    expect(late.chip).toBeNull();
+    expect(late.outside).toBe(true);
+  });
+
+  it("while a table is loading the row has no chip and is not called outside", () => {
+    const [row] = list([measure(40, 16)], {});
+    expect(row.chip).toBeNull();
+    expect(row.outside).toBe(false);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  4 failed | 168 passed (172)`, `Tests  22 failed | 1319 passed (1341)`. Lý do đỏ: chưa có `listRows`; `GrowthList` còn nhận `rows` và in "z · P"; `formatZ` còn đó.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/growth/GrowthList.tsx b/components/growth/GrowthList.tsx
index 813164a..f9073f5 100644
--- a/components/growth/GrowthList.tsx
+++ b/components/growth/GrowthList.tsx
@@ -1,104 +1,54 @@
 import { PendingMark } from "@/components/sync/PendingMark";
 import { ListGroup } from "@/components/ui/ListGroup";
-import type { LmsRow, WhoIndicator } from "@/lib/content/who";
-import { assess, type Assessment } from "@/lib/rules/growth";
-import {
-  formatGrowthValue,
-  formatPercentile,
-  formatZ,
-  indicatorValue,
-  INDICATORS,
-} from "@/lib/rules/growthForm";
-import { formatAgeVi } from "@/lib/rules/time";
+import { StatusChip } from "@/components/ui/StatusChip";
+import type { GrowthListItem } from "@/lib/rules/growthView";
 import type { GrowthRow } from "@/lib/supabase/rows";

-const LEVEL_CLASS = {
-  green: "bg-good-soft text-good-ink",
-  yellow: "bg-warn-soft text-warn-ink",
-  red: "bg-danger-soft text-danger-ink",
-} as const;
-
-function MeasureLine({
-  title,
-  text,
-  result,
-  shown,
-}: {
-  title: string;
-  text: string;
-  result: Assessment | null | undefined;
-  shown: boolean;
-}) {
-  return (
-    <span className="flex flex-wrap items-center gap-2 text-[15px]">
-      <span className="text-muted">{title}:</span>
-      <span className="text-ink tabular-nums">{text}</span>
-      {shown &&
-        result !== undefined &&
-        (result ? (
-          <span
-            className={`rounded-full px-2 text-[13px] font-semibold tabular-nums ${LEVEL_CLASS[result.level]}`}
-          >
-            z {formatZ(result.z)} · {formatPercentile(result.percentile)}
-            {result.text ? ` · ${result.text}` : ""}
-          </span>
-        ) : (
-          <span className="text-[13px] text-muted">Ngoài bảng WHO</span>
-        ))}
-    </span>
-  );
-}
-
-// Spec §9 Tăng trưởng: the measurements as a glass list.
+// Spec 2026-11-25 §5.5: the measurements as a glass list, each with its
+// change since the one before and a status in words.
 export function GrowthList({
-  rows,
-  lms,
-  indicator,
-  dob,
+  items,
   pending,
   canEdit,
   onOpen,
 }: {
-  rows: GrowthRow[];
-  lms: LmsRow[] | undefined;
-  indicator: WhoIndicator;
-  dob: string;
+  items: GrowthListItem<GrowthRow>[];
   pending: Set<string>;
   canEdit: (row: GrowthRow) => boolean;
   onOpen: (row: GrowthRow) => void;
 }) {
   return (
     <ListGroup title="Các lần đo">
-      {rows.map((row) => (
+      {items.map(({ row, title, values, delta, chip, outside }) => (
         <li key={row.id} className="border-b border-line last:border-b-0">
           <button
             type="button"
             disabled={!canEdit(row)}
             onClick={() => onOpen(row)}
-            className="flex min-h-[52px] w-full flex-col gap-1 px-4 py-2.5 text-left disabled:opacity-100"
+            className="flex min-h-[52px] w-full items-start gap-3 px-4 py-2.5 text-left disabled:opacity-100"
           >
-            <span className="text-base font-semibold text-ink tabular-nums">
-              {row.measured_on.split("-").reverse().join("/")} ·{" "}
-              {formatAgeVi(dob, new Date(`${row.measured_on}T05:00:00Z`))}{" "}
-              <PendingMark pending={pending.has(row.id)} />
+            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
+              <span className="text-base font-semibold text-ink tabular-nums">
+                {title} <PendingMark pending={pending.has(row.id)} />
+              </span>
+              <span className="text-[15px] text-ink tabular-nums">
+                {values}
+              </span>
+              {delta && (
+                <span className="text-[13px] leading-[18px] text-muted">
+                  {delta}
+                </span>
+              )}
             </span>
-            {INDICATORS.map((item) => {
-              const value = indicatorValue(row, item.key);
-              if (value === null) return null;
-              // undefined: table not loaded yet; null: outside 0..1856 days.
-              const result = lms
-                ? assess(lms, dob, row.measured_on, value)
-                : undefined;
-              return (
-                <MeasureLine
-                  key={item.key}
-                  title={item.title}
-                  text={formatGrowthValue(item.key, value)}
-                  result={result}
-                  shown={item.key === indicator}
-                />
-              );
-            })}
+            {chip ? (
+              <StatusChip tone={chip.tone}>{chip.text}</StatusChip>
+            ) : (
+              outside && (
+                <span className="shrink-0 text-[13px] text-muted">
+                  Ngoài bảng WHO
+                </span>
+              )
+            )}
           </button>
         </li>
       ))}
diff --git a/components/growth/GrowthScreen.tsx b/components/growth/GrowthScreen.tsx
index a6764c5..9447ba2 100644
--- a/components/growth/GrowthScreen.tsx
+++ b/components/growth/GrowthScreen.tsx
@@ -29,6 +29,7 @@ import {
   chartView,
   defaultIndicator,
   indicatorSummaries,
+  listRows,
 } from "@/lib/rules/growthView";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import type { Baby, GrowthRow } from "@/lib/supabase/rows";
@@ -91,7 +92,6 @@ export function GrowthScreen({
   const table = queries[indicator];
   const lms = tables[indicator];
   const range = chartRange(ageDays(baby.dob, new Date()));
-  const current = INDICATORS.find((i) => i.key === indicator)!;
   const chart = chartView({
     indicator,
     rows,
@@ -187,21 +187,12 @@ export function GrowthScreen({
           }}
         />
       ) : (
-        <>
-          <GrowthList
-            rows={rows}
-            lms={lms}
-            indicator={indicator}
-            dob={baby.dob}
-            pending={pending}
-            canEdit={canEdit}
-            onOpen={(row) => setSheet({ row })}
-          />
-          <p className="px-1 text-[13px] text-muted">
-            z-score và phân vị là của chỉ số đang chọn (
-            {current.title.toLowerCase()}).
-          </p>
-        </>
+        <GrowthList
+          items={listRows({ rows, tables, dob: baby.dob, alerts })}
+          pending={pending}
+          canEdit={canEdit}
+          onOpen={(row) => setSheet({ row })}
+        />
       )}
       {why && (
         <Popup title="Vì sao có cảnh báo này?" onClose={() => setWhy(null)}>
diff --git a/lib/rules/growthForm.ts b/lib/rules/growthForm.ts
index cc31848..a807aa1 100644
--- a/lib/rules/growthForm.ts
+++ b/lib/rules/growthForm.ts
@@ -96,14 +96,6 @@ export function formatGrowthValue(
     : `${decimals(1).format(value)} cm`;
 }

-export function formatZ(z: number): string {
-  return new Intl.NumberFormat("vi-VN", {
-    minimumFractionDigits: 1,
-    maximumFractionDigits: 1,
-    signDisplay: "exceptZero",
-  }).format(z);
-}
-
 export function formatPercentile(p: number): string {
   if (p < 0.1) return "dưới P0,1";
   if (p > 99.9) return "trên P99,9";
diff --git a/lib/rules/growthView.ts b/lib/rules/growthView.ts
index ae83224..c1f9361 100644
--- a/lib/rules/growthView.ts
+++ b/lib/rules/growthView.ts
@@ -1,12 +1,15 @@
 import type { WhoIndicator, WhoSex } from "@/lib/content/who";
-import { ageOnDay, percentile } from "./growth";
+import { formatDayShort } from "./days";
+import { ageOnDay, lmsAt, percentile, zScore } from "./growth";
 import {
+  ALERT_CHIP,
   alertTone,
   type GrowthAlert,
   type GrowthMeasure,
   type GrowthTables,
   type GrowthTone,
   newestFirst,
+  positionKind,
   readings,
 } from "./growthAlerts";
 import {
@@ -16,6 +19,7 @@ import {
   indicatorValue,
   outOf100,
 } from "./growthForm";
+import { formatAgeVi } from "./time";

 // Spec 2026-11-25 §5.3: one block of the verdict card.
 export type IndicatorSummary = {
@@ -225,3 +229,90 @@ export function chartView(input: {
     shifted: alert?.kind === "falling" || alert?.kind === "rising",
   };
 }
+
+// Spec 2026-11-25 §5.5: one row of "Các lần đo".
+export type GrowthListItem<T> = {
+  row: T;
+  title: string;
+  values: string;
+  delta: string | null;
+  // null: not assessed, either outside the WHO table or its tables not loaded.
+  chip: { text: string; tone: GrowthTone } | null;
+  outside: boolean;
+};
+
+const withName = (indicator: WhoIndicator, text: string) =>
+  indicator === "hcfa" ? `vòng đầu ${text}` : text;
+
+export function listRows<T extends GrowthMeasure>(input: {
+  rows: T[];
+  tables: GrowthTables;
+  dob: string;
+  alerts: GrowthAlert[];
+}): GrowthListItem<T>[] {
+  const sorted = newestFirst(input.rows);
+  // The row an alert is about: the first one, newest first, of its day that
+  // has the indicator. A row with two alerts keeps the one listed first.
+  const alertOf = new Map<T, GrowthAlert>();
+  for (const alert of input.alerts) {
+    const row = sorted.find(
+      (item) =>
+        item.measured_on === alert.measuredOn &&
+        indicatorValue(item, alert.indicator) !== null,
+    );
+    if (row && !alertOf.has(row)) alertOf.set(row, alert);
+  }
+
+  return sorted.map((row, index): GrowthListItem<T> => {
+    const below = sorted[index + 1];
+    const age = ageOnDay(input.dob, row.measured_on);
+    const values: string[] = [];
+    const changes: string[] = [];
+    let red: string | null = null;
+    let yellow: string | null = null;
+    let assessed = 0;
+    let outside = false;
+    for (const { key } of INDICATORS) {
+      const value = indicatorValue(row, key);
+      if (value === null) continue;
+      values.push(withName(key, formatGrowthValue(key, value)));
+      const before = below ? indicatorValue(below, key) : null;
+      if (before !== null && before !== undefined)
+        changes.push(withName(key, formatChange(key, value - before)));
+      const table = input.tables[key];
+      if (!table) continue;
+      const lms = lmsAt(table, age);
+      if (!lms) {
+        outside = true;
+        continue;
+      }
+      assessed += 1;
+      const kind = positionKind(zScore(lms, value));
+      if (kind === "veryLow" || kind === "veryHigh") red ??= ALERT_CHIP[kind];
+      else if (kind) yellow ??= ALERT_CHIP[kind];
+    }
+    const alert = alertOf.get(row);
+    const chip: GrowthListItem<T>["chip"] = alert
+      ? { text: alert.chip, tone: alertTone(alert.level) }
+      : red
+        ? { text: red, tone: "danger" }
+        : yellow
+          ? { text: yellow, tone: "warn" }
+          : assessed > 0
+            ? { text: "Bình thường", tone: "good" }
+            : null;
+    return {
+      row,
+      title: `${formatDayShort(row.measured_on)} · ${
+        row.measured_on === input.dob
+          ? "lúc sinh"
+          : formatAgeVi(input.dob, new Date(`${row.measured_on}T05:00:00Z`))
+      }`,
+      values: values.join(" · "),
+      delta:
+        changes.length > 0 ? `${changes.join(" · ")} so với lần trước` : null,
+      chip,
+      outside: chip === null && outside,
+    };
+  });
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  172 passed (172)`, `Tests  1341 passed (1341)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/growthView.ts lib/rules/growthView.test.ts lib/rules/growthForm.ts lib/rules/growthForm.test.ts components/growth
git commit -m "feat(growth): the list of measurements in words; z-scores leave the screen" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Kiểm cuối M2e và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-growth/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  172 passed (172)`, `Tests  1341 passed (1341)`.

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
import { GrowthList } from "@/components/growth/GrowthList";
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
  listRows,
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
      <GrowthList
        items={listRows({ rows, tables, dob, alerts })}
        pending={new Set()}
        canEdit={() => false}
        onOpen={() => {}}
      />
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

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 7). Chạy `bun run dev`. Cỡ 375×812.

Trên trang tạm `http://localhost:3000/fixture-growth?c=0`:

1. Danh sách 3 hàng, mới nhất trên cùng. Hàng trên cùng: dòng số đo "6,1 kg · 61,5 cm · vòng đầu 39,9 cm", dòng chênh "+1,5 kg · +6,3 cm · vòng đầu +2,5 cm so với lần trước", chip "Bình thường". Hàng cuối ghi "lúc sinh" và không có dòng chênh.
2. Chip nằm bên phải, không đẩy chữ ra ngoài thẻ; dòng chênh được phép xuống dòng, các dòng khác không bị cắt.

Lần lượt `?c=1` đến `?c=7`:

3. Hàng trên cùng mang chip của cảnh báo, theo thứ tự: "Tăng chậm", "Rất thấp" (nền đỏ), "Giảm cân", "Cao", "Rất cao" (nền đỏ), "Tăng nhanh", "Thấp". Cùng với "Bình thường" ở `?c=0` là đủ 8 loại chip. Hai hàng dưới vẫn "Bình thường", trừ `?c=7`: hàng "lúc sinh" cũng là "Thấp".
4. Ở `?c=3` dòng chênh của hàng trên cùng bắt đầu bằng "−0,2 kg".
5. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở `?c=0`.
6. Lặp mục 1 và 3 ở `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: chip đọc rõ.

Trang thật `http://localhost:3000/tang-truong`:

7. Danh sách của bé theo kiểu mới; ngày và số đo của từng hàng khớp với trước M2e. Không còn chữ "z" hay "P" kèm số, không còn dòng chú thích về z-score.
8. Chạm đổi chỉ số: biểu đồ đổi theo, danh sách không đổi.
9. Chạm một hàng mình tạo: sheet sửa mở ra như trước (đóng lại, không lưu).

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả kiểm, 2026-11-25** (nhánh `feat/kim-bun-suc-khoe-m2e` @ `d00eaa6`)

- Step 1: `tsc --noEmit` sạch; `Test Files  172 passed (172)`, `Tests  1341 passed (1341)`. Đỏ ở Task 1 Step 2 đúng số: `4 failed | 168 passed (172)`, `22 failed | 1319 passed (1341)`. Hai patch áp sạch bằng `kb_patch`.
- Step 2: `bun run build` lần đầu dừng với cảnh báo bảo mật của Next.js 16.4.3 (mã 1); lần hai `✓ Generating static pages (39/39)`, mã 0. Không chạy `next upgrade`.
- Step 4: người dùng chọn khung Browser trong app (question card). 375×812, phiên Kim Bun còn đăng nhập, theme mở sẵn `dark`. `bun run dev` chạy ngay lần đầu. Số liệu đọc bằng script trong trang (chữ, số dòng, màu, hộp bao), kèm ảnh chụp.

Trang tạm `/fixture-growth` (bé 76 ngày tuổi, 3 lần đo, đủ ba chỉ số):

1. `?c=0`: đạt. 3 hàng, mới nhất trên cùng: "25/11 · 2 tháng 15 ngày", "10/10 · 1 tháng", "10/09 · lúc sinh". Hàng trên cùng: "6,1 kg · 61,5 cm · vòng đầu 39,9 cm", "+1,5 kg · +6,3 cm · vòng đầu +2,5 cm so với lần trước", chip "Bình thường". Hàng "lúc sinh" không có dòng chênh.
2. Chip nằm bên phải, mép phải x=342 trong thẻ (16–359), luôn một dòng; không chữ nào bị cắt "…" (`scrollWidth` không vượt `clientWidth` ở mọi hàng của cả 8 trường hợp); không chữ nào ra ngoài thẻ. **Chưa đẹp, cần người dùng quyết:** chip chiếm chỗ suốt chiều cao của hàng, nên cột chữ chỉ còn 200 px (chip "Bình thường") đến 252 px (chip "Cao"), và **dòng số đo của hàng có đủ ba chỉ số xuống hai dòng** ở 22 trên 24 hàng đã xem. Chỗ ngắt tách số khỏi tên hoặc đơn vị: "6,1 kg · 61,5 cm · vòng đầu / 39,9 cm" (chip "Bình thường", "Tăng chậm", "Tăng nhanh"), "6,1 kg · 52 cm · vòng đầu 39,9 / cm" (chip "Rất thấp" ở `?c=2`, chip "Thấp" ở `?c=7`: chữ "cm" đứng riêng một dòng). Hàng trên cùng của `?c=3` ("Giảm cân") và `?c=5` ("Rất cao") cũng hai dòng theo script, chưa xem ảnh chỗ ngắt. Chỉ một dòng khi chip là "Cao" (`?c=4`) hoặc số đo ngắn ("3,3 kg · 46 cm · vòng đầu 34,5 cm" với chip "Thấp"). Dòng chênh cũng ngắt giữa số và đơn vị ("vòng đầu +4,4 / cm so với lần trước"); dòng này được phép xuống dòng. Global Constraints cho hàng danh sách xuống tối đa 2 dòng, nên không trái plan; nhưng spec §5.5 gọi đây là "Dòng 2". Hàng chỉ có cân nặng và chiều dài (dữ liệu thật hiện nay) thì một dòng.
3. `?c=1` đến `?c=7`: đạt. Chip của hàng trên cùng lần lượt "Tăng chậm", "Rất thấp" (nền đỏ `danger-soft`), "Giảm cân", "Cao", "Rất cao" (nền đỏ), "Tăng nhanh", "Thấp"; các chip vàng nền `warn-soft`. Hai hàng dưới "Bình thường", riêng `?c=7` hàng "lúc sinh" là "Thấp".
4. `?c=3`: đạt. Dòng chênh của hàng trên cùng: "−0,2 kg · +6,3 cm · vòng đầu +2,5 cm so với lần trước" (dấu trừ U+2212).
5. `scrollWidth` 375 = `innerWidth` 375 ở `?c=0` và ở cả `?c=1` đến `?c=7`: đạt.
6. Theme: `?c=1` (chip vàng và xanh) và `?c=2` (chip đỏ) ở `rose`, `light`, `dark`, `night`, thêm `peach`, `lavender`, `sea` (đo màu, không chụp): chip đọc rõ, tương phản chữ trên nền chip từ 5,7 (đỏ ở `night`) đến 12,1 (`dark`). `?c=0` chỉ xem ở `dark`; chip "Bình thường" của nó là chip của hai hàng dưới ở `?c=1`. Ở `night` cả ba loại chip cùng tông cam nâu (theme một màu), chỉ phân biệt bằng chữ.

Trang thật `/tang-truong` (2 lần đo, không cảnh báo; chỉ xem):

7. Đạt. "25/11 · 2 tháng 15 ngày" / "5,7 kg · 56,9 cm" / "+0,2 kg · +1,9 cm so với lần trước" / "Bình thường"; "15/11 · 2 tháng 5 ngày" / "5,5 kg · 55 cm" / "Bình thường", không dòng chênh. Ngày và số đo khớp với ảnh chụp trước M2e của phiên M2d (25/11/2026: 5,7 kg, 56,9 cm; 15/11/2026: 5,5 kg, 55 cm). Trên cả trang không còn "z" hay "P" kèm số, không còn chữ "z-score" hay "phân vị". Mỗi dòng nằm trọn một dòng, không cuộn ngang. Xem ở `dark`, `rose`, `night`.
8. Đạt. Chạm "Chiều dài", "Vòng đầu": tiêu đề biểu đồ đổi theo ("Chiều dài theo tháng tuổi", "Vòng đầu theo tháng tuổi"), danh sách giữ nguyên từng chữ.
9. Đạt. Chạm hàng 25/11: sheet "Sửa lần đo" mở ra với ngày 25/11/2026, 5,7 và 56,9 điền sẵn, có "Lưu" và "Xóa lần đo". Đóng bằng Esc, không bấm gì trong sheet; danh sách sau đó không đổi.

Chưa kiểm: trên trang thật không có hàng nào mang chip cảnh báo, "lúc sinh", "Ngoài bảng WHO", đủ ba chỉ số, hay hàng của người khác (bị khóa); các trạng thái này chỉ thấy trên trang tạm hoặc trong unit test ("Ngoài bảng WHO", hàng chưa có chip, `PendingMark`, hàng bị khóa: chỉ unit test). `?c=0` ở theme khác `dark`; ảnh chụp ở `peach`, `lavender`, `sea`. Bề ngang 440 px. iPhone thật, PWA.

Ghi nhận khác (không thuộc plan này): trên trang thật, chiều dài của bé "Dài hơn 6 trong 100 bé trai cùng tuổi" vẫn mang chip "Bình thường"; đó là phần gần ranh của spec §5.6, thuộc plan sau (M2f). Chip "Gần mức thấp", "Gần mức cao" của M2f dài hơn "Bình thường", nên chỗ xuống dòng ở mục 2 sẽ nặng hơn nếu giữ cách đặt chip hiện tại.

Sau khi xóa `app/fixture-growth/`, `bun run typecheck` đỏ vì `.next/dev/types/validator.ts` còn trỏ tới trang tạm; đã xóa thư mục sinh tự động `.next/dev/types` (git-ignored), typecheck sạch lại, vitest vẫn 172 file / 1341 test. `.claude/launch.json` tạm (để khung Browser chạy `bun run dev`) đã xóa.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-growth
git status --short   # chỉ còn file plan này thay đổi
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2e.md
git commit -m "docs(plan): record the M2e check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m2e
git push origin main
```
