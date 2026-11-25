# Kim Bun — Sức khỏe M2c: màn Tăng trưởng mở đầu bằng cảnh báo và kết luận Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§5.3 trừ thẻ mục tiêu chiều cao; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng: "Duyệt năm plan"; chưa có lệnh chạy, mỗi lần lên `main` vẫn phải hỏi)

**Goal:** Mở màn Tăng trưởng là thấy ngay cảnh báo (nếu có) và một thẻ kết luận bằng lời cho từng chỉ số, kèm thanh vị trí; thanh chọn chỉ số có chấm ở chỉ số đang có cảnh báo và tự mở ở chỉ số đó; chưa có lần đo nào thì màn chỉ còn lời mời thêm lần đo.

**Architecture:**

- **`GrowthScreen`** tải cả 3 bảng WHO thay vì chỉ bảng đang chọn, gọi `growthAlerts` theo từng bảng đã tải, rồi ghép các khối của M2b (`GrowthAlertCard`, `GrowthVerdict`, chấm của `Segmented`, `Popup`) phía trên thanh chọn.
- Biểu đồ giữ kiểu cũ tới M2d, danh sách tới M2e.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m2c`, cắt từ `main` sau khi M2b đã lên (`main` lúc đó bằng `feat/kim-bun-suc-khoe-m2b`). Baseline: 1286 test vitest xanh (171 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                                        | Plan                                           |
| ------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| M1a, M1b, M1c      | §3, §4 dòng 2 và 3                                                              | đã xong, đã lên `main` @ `5ecc02c`             |
| M2a                | §5.1 luật cảnh báo, §5.2 câu so sánh; chip và dòng 1 của §4 trên trang Sức khỏe | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md` |
| M2b                | §5.3: luật và khối giao diện của thẻ kết luận, thẻ cảnh báo; popup              | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2b.md` |
| **M2c (plan này)** | §5.3: màn Tăng trưởng mở đầu bằng cảnh báo và kết luận                          | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2c.md` |
| M2d                | §5.4 biểu đồ                                                                    | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2d.md` |
| M2e                | §5.5 các lần đo; xóa `formatZ`                                                  | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2e.md` |
| M3                 | §6 Chiều cao, thẻ mục tiêu của §5.3                                             | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4                                  | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                                                    | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M2 chia năm plan.** Spec §10 ghi M2 là một mốc. Bản dựng thử cho thấy M2 dài quá một plan, nên cắt ở năm chỗ app vẫn chạy trọn vẹn: M2a có luật cảnh báo và đưa cảnh báo lên trang Sức khỏe; M2b thêm luật và khối giao diện của thẻ kết luận, thẻ cảnh báo (màn hình chưa đổi); M2c ghép chúng vào màn Tăng trưởng (biểu đồ và danh sách còn kiểu cũ); M2d đổi biểu đồ; M2e đổi danh sách các lần đo.
2. **Sau plan này màn Tăng trưởng nửa cũ nửa mới:** phía trên đã nói bằng lời, còn biểu đồ vẫn 5 đường và danh sách vẫn ghi "z · P" cùng dòng chú thích về z-score. M2d và M2e đổi nốt. Người dùng nên biết điều này nếu định đưa M2c lên `main` trước hai plan đó.
3. **Thẻ mục tiêu chiều cao (§5.3 mục 4)** thuộc M3, plan này không vẽ.
4. **Chỉ số mở sẵn** được tính lại mỗi lần vẽ cho tới khi người dùng tự chọn; một bảng WHO về muộn có thể làm nó đổi một lần.
5. **Dòng "Đo gần nhất {dd/mm} · {tuổi}"** lấy lần đo mới nhất bất kể chỉ số (`latestGrowth`). Thẻ kết luận chỉ hiện khi có ít nhất một chỉ số đánh giá được.
6. **Chưa có lần đo nào** (đã tải xong và danh sách rỗng): màn chỉ còn header và `EmptyState`, không có thanh chọn và biểu đồ, đúng §5.3. Trong lúc đang tải, mất mạng hoặc lỗi thì thanh chọn và biểu đồ vẫn hiện như hiện tại.
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
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 2 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `5ecc02c` và nối tiếp các plan trước của mốc M2; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn hoặc `var(--color-…)`. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 2 dừng lại hỏi, không tự push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.

## Contracts with Other Plans

Plan này đứng ngay sau M2b. M2d và M2e đứng sau và dùng màn này.

**Consumes:**

- Từ M2a (`2026-11-25-kim-bun-chieu-cao-suc-khoe-m2a.md`): `growthAlerts`, `GrowthTables`, `GrowthAlertKind` (`lib/rules/growthAlerts.ts`).
- Từ M2b (`2026-11-25-kim-bun-chieu-cao-suc-khoe-m2b.md`): `indicatorSummaries`, `defaultIndicator`, `alertDots` (`lib/rules/growthView.ts`); `alertReason`; `GrowthAlertCard`, `GrowthVerdict`; `Popup`; `ChoiceOption.dot`.
- Từ M1: `latestGrowth`. Từ code có sẵn: `GrowthList`, `GrowthChart`, `useWhoTable`.

**Produces:**

- `GrowthScreen` gọi `useWhoTable` 3 lần và giữ các biến `rows`, `tables`, `alerts`, `summaries`, `indicator`, `lms`, `range`, `empty` cho M2d và M2e.
- Thứ tự khối: header, thẻ cảnh báo, thẻ kết luận, thanh chọn, biểu đồ, danh sách; khi chưa có lần đo nào chỉ còn header và `EmptyState`.
- **Vitest sau M2c:** 1298 test, 172 file.

---

### Task 1: Màn Tăng trưởng mở đầu bằng cảnh báo và kết luận (§5.3)

**Files:**

- Modify: `components/growth/GrowthScreen.tsx`
- Test: `components/growth/growthscreen.test.tsx` (mới)

**Interfaces:**

- Consumes: `indicatorSummaries`, `defaultIndicator`, `alertDots`, `GrowthAlertCard`, `GrowthVerdict`, `Popup`, `ChoiceOption.dot`, `alertReason` (M2b); `growthAlerts`, `GrowthTables`, `GrowthAlertKind` (M2a); `latestGrowth`.
- Produces: `GrowthScreen` tải 3 bảng WHO; thứ tự khối: header, thẻ cảnh báo, thẻ kết luận, thanh chọn, biểu đồ, danh sách; khi chưa có lần đo nào chỉ còn header và `EmptyState`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m2c
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/growth/growthscreen.test.tsx b/components/growth/growthscreen.test.tsx
new file mode 100644
index 0000000..3314fcc
--- /dev/null
+++ b/components/growth/growthscreen.test.tsx
@@ -0,0 +1,206 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { Baby, GrowthRow } from "@/lib/supabase/rows";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { GrowthScreen } from "./GrowthScreen";
+
+const state = vi.hoisted(() => ({
+  growth: {} as Record<string, unknown>,
+  tables: {} as Record<string, unknown>,
+}));
+const useGrowth = vi.hoisted(() => vi.fn());
+const useWhoTable = vi.hoisted(() => vi.fn());
+
+vi.mock("@/lib/data/growth", () => ({
+  useGrowth,
+  useWhoTable,
+  useGrowthActions: vi.fn(),
+}));
+vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
+// The chart is loaded lazily; a stand-in shows which indicator it was given.
+vi.mock("next/dynamic", () => ({
+  default:
+    () =>
+    ({ unit, points }: { unit: string; points: unknown[] }) => (
+      <div data-chart={`${unit}:${points.length}`} />
+    ),
+}));
+
+const LOADING = {
+  data: undefined,
+  isPending: true,
+  isError: false,
+  error: null,
+  fetchStatus: "fetching",
+};
+const loaded = (data: unknown) => ({
+  data,
+  isPending: false,
+  isError: false,
+  error: null,
+  fetchStatus: "idle",
+});
+// z = (value / median − 1) × 8 on every day.
+const flat = (median: number) =>
+  loaded({
+    rows: Array.from({ length: 1857 }, (_, day) => [day, 1, median, 0.125]),
+  });
+const TABLES = { wfa: flat(5.5), lhfa: flat(58.5), hcfa: flat(38) };
+
+const measure = (
+  measured_on: string,
+  weight_g: number | null,
+  length_cm: number | null = 58.5,
+) =>
+  ({
+    id: `g-${measured_on}`,
+    baby_id: "b1",
+    measured_on,
+    weight_g,
+    length_cm,
+    head_cm: null,
+    created_by: "u1",
+    created_at: `${measured_on}T03:00:00.000Z`,
+    updated_at: `${measured_on}T03:00:00.000Z`,
+  }) as GrowthRow;
+
+const baby = {
+  id: "b1",
+  family_id: "f1",
+  name: "Bun",
+  dob: "2026-09-14",
+  sex: "male",
+} as unknown as Baby;
+
+function render(
+  rows: GrowthRow[] | null,
+  tables: Record<string, unknown> = TABLES,
+) {
+  state.growth = rows === null ? LOADING : loaded(rows);
+  state.tables = tables;
+  return renderToStaticMarkup(<GrowthScreen baby={baby} userId="u1" isOwner />);
+}
+
+const pressed = (html: string) =>
+  [...html.matchAll(/aria-pressed="(true|false)"[^>]*>([^<]+)/g)]
+    .filter((m) => m[1] === "true")
+    .map((m) => m[2]);
+
+beforeEach(() => {
+  useGrowth.mockImplementation(() => state.growth);
+  useWhoTable.mockImplementation(
+    (indicator: string) => state.tables[indicator] ?? LOADING,
+  );
+});
+
+// Spec 2026-11-25 §5.3.
+describe("GrowthScreen", () => {
+  it("goes back to Sức khỏe and keeps the add button", () => {
+    const html = render([measure("2026-11-15", 5500)]);
+    expect(html).toContain('href="/suc-khoe"');
+    expect(html).toContain('aria-label="Thêm lần đo"');
+  });
+
+  it("reads the three WHO tables of the baby's sex", () => {
+    useWhoTable.mockClear();
+    render([measure("2026-11-15", 5500)]);
+    expect(useWhoTable.mock.calls).toEqual([
+      ["wfa", "boys"],
+      ["lhfa", "boys"],
+      ["hcfa", "boys"],
+    ]);
+  });
+
+  it("on the norm: the calm verdict, no alert card, the picker on weight", () => {
+    const html = render([
+      measure("2026-11-15", 5500),
+      measure("2026-10-14", 4400, 55),
+    ]);
+    expect(html).toContain(">Bun đang lớn đều</h2>");
+    expect(html).toContain(">Đo gần nhất 15/11 · 2 tháng 1 ngày</span>");
+    expect(html).toContain("+1,1 kg sau 32 ngày");
+    expect(html).not.toContain(ICON_PATHS.alert);
+    expect(html).not.toContain('aria-label="có cảnh báo"');
+    expect(pressed(html)).toEqual(["Cân nặng"]);
+    expect(html).toContain('data-chart="kg:2"');
+  });
+
+  it("blocks come in order: alert cards, verdict, picker, chart, list", () => {
+    // 51 cm against a 58,5 cm median is z −1,03 lower than a month before: no
+    // alert; 4 kg is z −2,18: low.
+    const html = render([measure("2026-11-15", 4000)]);
+    const order = [
+      ">Cân nặng thấp hơn chuẩn</h2>",
+      ">Đo gần nhất 15/11",
+      'aria-label="Chỉ số"',
+      "data-chart=",
+      ">Các lần đo</h2>",
+    ].map((mark) => html.indexOf(mark));
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+  });
+
+  it("with an alert: its card, no calm heading, a dot on its indicator", () => {
+    const html = render([measure("2026-11-15", 4000)]);
+    expect(html).toContain("border-warn/35 bg-warn-soft text-warn-ink");
+    expect(html).toContain(">Nên hỏi bác sĩ ở lần khám tới.</p>");
+    expect(html).not.toContain("đang lớn đều");
+    expect(html).toContain('Cân nặng<span role="img" aria-label="có cảnh báo"');
+    expect(html.match(/aria-label="có cảnh báo"/g)).toHaveLength(1);
+    expect(html).toContain('bg-warn-soft text-warn-ink">Thấp</span>');
+  });
+
+  it("opens on the first indicator that has an alert", () => {
+    // 48 cm against 58,5 cm is z −1,44; 44 cm is z −1,98; 43 cm is z −2,12.
+    const html = render([measure("2026-11-15", 5500, 43)]);
+    expect(pressed(html)).toEqual(["Chiều dài"]);
+    expect(html).toContain('data-chart="cm:1"');
+  });
+
+  it("one card per alert, the red one first", () => {
+    const html = render([measure("2026-11-15", 4000, 30)]);
+    expect(html.indexOf(">Chiều dài thấp hơn chuẩn nhiều</h2>")).toBeLessThan(
+      html.indexOf(">Cân nặng thấp hơn chuẩn</h2>"),
+    );
+    expect(html.match(/Vì sao có cảnh báo này\?/g)).toHaveLength(2);
+  });
+
+  it("a table still loading: that indicator has no block and raises no alert", () => {
+    const html = render([measure("2026-11-15", 4000, 30)], {
+      lhfa: TABLES.lhfa,
+    });
+    expect(html).toContain(">Chiều dài thấp hơn chuẩn nhiều</h2>");
+    expect(html).not.toContain(">Cân nặng thấp hơn chuẩn</h2>");
+    // The weight block of the verdict card is not there yet.
+    expect(html).not.toContain('aria-label="Thấp. Nặng hơn');
+    expect(html.match(/role="img" aria-label="[^"]*trong 100/g)).toHaveLength(
+      1,
+    );
+  });
+
+  it("no table yet: no verdict card and no alert", () => {
+    const html = render([measure("2026-11-15", 4000)], {});
+    expect(html).not.toContain("Đo gần nhất");
+    expect(html).not.toContain(ICON_PATHS.alert);
+  });
+
+  it("no measurement: only the header and the empty state", () => {
+    const html = render([]);
+    expect(html).toContain("Chưa có lần đo nào.");
+    expect(html).not.toContain("Đo gần nhất");
+    expect(html).not.toContain(ICON_PATHS.alert);
+    expect(html).not.toContain('aria-label="Chỉ số"');
+    expect(html).not.toContain("data-chart");
+  });
+
+  it("while the measurements load the picker and the chart stay", () => {
+    const html = render(null);
+    expect(html).toContain('aria-label="Chỉ số"');
+    expect(html).toContain("data-chart");
+    expect(html).not.toContain("Chưa có lần đo nào.");
+  });
+
+  it("the why popup is closed until asked for", () => {
+    expect(render([measure("2026-11-15", 4000)])).not.toContain("<dialog");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 171 passed (172)`, `Tests  8 failed | 1290 passed (1298)`. Lý do đỏ: màn chưa đọc 3 bảng, chưa có thẻ cảnh báo, thẻ kết luận, chấm và chỉ số mở sẵn; màn trống còn hiện thanh chọn và biểu đồ.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/growth/GrowthScreen.tsx b/components/growth/GrowthScreen.tsx
index af20392..af68bdd 100644
--- a/components/growth/GrowthScreen.tsx
+++ b/components/growth/GrowthScreen.tsx
@@ -7,6 +7,7 @@ import { ErrorCard } from "@/components/ui/ErrorCard";
 import { Glass } from "@/components/ui/Glass";
 import { IconButton } from "@/components/ui/IconButton";
 import { PageHeader } from "@/components/ui/PageHeader";
+import { Popup } from "@/components/ui/Popup";
 import { Segmented } from "@/components/ui/Segmented";
 import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
 import { Skeleton } from "@/components/ui/Skeleton";
@@ -15,12 +16,31 @@ import { toVietnameseError } from "@/lib/data/errors";
 import { useGrowth, useWhoTable } from "@/lib/data/growth";
 import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
 import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
+import { formatDayShort } from "@/lib/rules/days";
 import { curve } from "@/lib/rules/growth";
-import { chartRange, indicatorValue, INDICATORS } from "@/lib/rules/growthForm";
-import { ageDays } from "@/lib/rules/time";
+import {
+  alertReason,
+  type GrowthAlertKind,
+  growthAlerts,
+  type GrowthTables,
+} from "@/lib/rules/growthAlerts";
+import {
+  chartRange,
+  indicatorValue,
+  INDICATORS,
+  latestGrowth,
+} from "@/lib/rules/growthForm";
+import {
+  alertDots,
+  defaultIndicator,
+  indicatorSummaries,
+} from "@/lib/rules/growthView";
+import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import type { Baby, GrowthRow } from "@/lib/supabase/rows";
+import { GrowthAlertCard } from "./GrowthAlertCard";
 import { GrowthList } from "./GrowthList";
 import { GrowthSheet } from "./GrowthSheet";
+import { GrowthVerdict } from "./GrowthVerdict";

 function ChartUnavailable() {
   return <p className="h-72 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
@@ -34,11 +54,6 @@ const GrowthChart = dynamic(
   { ssr: false, loading: () => <div className="h-72" /> },
 );

-const INDICATOR_OPTIONS = INDICATORS.map((item) => ({
-  value: item.key,
-  label: item.title,
-}));
-
 export function GrowthScreen({
   baby,
   userId,
@@ -50,13 +65,35 @@ export function GrowthScreen({
 }) {
   const growth = useGrowth(baby.id);
   const sex = whoSex(baby.sex);
-  const [indicator, setIndicator] = useState<WhoIndicator>("wfa");
-  const table = useWhoTable(indicator, sex);
+  const wfa = useWhoTable("wfa", sex);
+  const lhfa = useWhoTable("lhfa", sex);
+  const hcfa = useWhoTable("hcfa", sex);
+  const queries = { wfa, lhfa, hcfa };
+  // Spec 2026-11-25 §5.1: a table that has not loaded is left out, so its
+  // indicator has no block in the verdict card and raises no alert yet.
+  const tables: GrowthTables = {};
+  for (const item of INDICATORS) {
+    const data = queries[item.key].data;
+    if (data) tables[item.key] = data.rows as LmsRow[];
+  }
   const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "growth"));
   const [sheet, setSheet] = useState<{ row: GrowthRow | null } | null>(null);

   const rows = growth.data ?? [];
-  const lms = table.data?.rows as LmsRow[] | undefined;
+  // Spec 2026-11-25 §5.3: with no measurement at all the page is only its
+  // header and the empty state. While they load, the picker and chart stay.
+  const empty = growth.data !== undefined && rows.length === 0;
+  const base = { rows, tables, dob: baby.dob, sex };
+  const alerts = growthAlerts({ ...base, babyName: baby.name });
+  const summaries = indicatorSummaries({ ...base, alerts });
+  const latest = latestGrowth(rows);
+  // Until the user picks one, the page shows the first indicator with an alert.
+  const [picked, setPicked] = useState<WhoIndicator | null>(null);
+  const indicator = picked ?? defaultIndicator(alerts);
+  const [why, setWhy] = useState<GrowthAlertKind | null>(null);
+  const dots = alertDots(alerts);
+  const table = queries[indicator];
+  const lms = tables[indicator];
   const range = chartRange(ageDays(baby.dob, new Date()));
   const current = INDICATORS.find((i) => i.key === indicator)!;
   const points = rows.flatMap((row) => {
@@ -81,31 +118,54 @@ export function GrowthScreen({
           />
         }
       />
-      <Segmented
-        label="Chỉ số"
-        options={INDICATOR_OPTIONS}
-        value={indicator}
-        onChange={setIndicator}
-      />
-      <Glass className="p-3">
-        {lms ? (
-          <GrowthChart
-            curve={curve(lms, 0, range.to, range.step)}
-            points={points}
-            to={range.to}
-            unit={indicator === "wfa" ? "kg" : "cm"}
+      {alerts.map((alert) => (
+        <GrowthAlertCard
+          key={alert.indicator}
+          alert={alert}
+          onWhy={() => setWhy(alert.kind)}
+        />
+      ))}
+      {latest && summaries.length > 0 && (
+        <GrowthVerdict
+          babyName={baby.name}
+          measured={`Đo gần nhất ${formatDayShort(latest.measuredOn)} · ${formatAgeVi(baby.dob, new Date(`${latest.measuredOn}T05:00:00Z`))}`}
+          calm={alerts.length === 0}
+          summaries={summaries}
+        />
+      )}
+      {!empty && (
+        <>
+          <Segmented
+            label="Chỉ số"
+            options={INDICATORS.map((item) => ({
+              value: item.key,
+              label: item.title,
+              dot: dots[item.key],
+            }))}
+            value={indicator}
+            onChange={setPicked}
           />
-        ) : table.isError ? (
-          <ChartUnavailable />
-        ) : (
-          <Skeleton className="h-72" />
-        )}
-      </Glass>
-      <p className="px-1 text-[13px] text-muted">
-        Đường WHO P3, P15, P50 (đậm), P85, P97 cho{" "}
-        {sex === "girls" ? "bé gái" : "bé trai"}; chấm là các lần đo của bé.
-        Nguồn: WHO Child Growth Standards.
-      </p>
+          <Glass className="p-3">
+            {lms ? (
+              <GrowthChart
+                curve={curve(lms, 0, range.to, range.step)}
+                points={points}
+                to={range.to}
+                unit={indicator === "wfa" ? "kg" : "cm"}
+              />
+            ) : table.isError ? (
+              <ChartUnavailable />
+            ) : (
+              <Skeleton className="h-72" />
+            )}
+          </Glass>
+          <p className="px-1 text-[13px] text-muted">
+            Đường WHO P3, P15, P50 (đậm), P85, P97 cho{" "}
+            {sex === "girls" ? "bé gái" : "bé trai"}; chấm là các lần đo của bé.
+            Nguồn: WHO Child Growth Standards.
+          </p>
+        </>
+      )}
       {waitingForNetwork(growth) ? (
         <NeedsNetwork what="các lần đo" />
       ) : growth.isPending ? (
@@ -145,6 +205,11 @@ export function GrowthScreen({
           </p>
         </>
       )}
+      {why && (
+        <Popup title="Vì sao có cảnh báo này?" onClose={() => setWhy(null)}>
+          {alertReason(why)}
+        </Popup>
+      )}
       {sheet && (
         <GrowthSheet
           babyId={baby.id}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  172 passed (172)`, `Tests  1298 passed (1298)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/growth/GrowthScreen.tsx components/growth/growthscreen.test.tsx
git commit -m "feat(growth): the growth page opens with its alerts and a verdict in words" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Kiểm cuối M2c và hỏi người dùng trước khi lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  172 passed (172)`, `Tests  1298 passed (1298)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 7). Chạy `bun run dev`. Cỡ 375×812. Mở `http://localhost:3000/tang-truong`:

1. Dưới tiêu đề là thẻ kết luận: khi không có cảnh báo có dấu tích và "{Tên bé} đang lớn đều"; dòng "Đo gần nhất {dd/mm} · {tuổi}" khớp lần đo mới nhất ở danh sách.
2. Mỗi chỉ số đã đo có một khối: tên, giá trị, chip, thanh vị trí, câu "… hơn {n} trong 100 …". Hàng tên, giá trị, chip không bị cắt chữ. Chấm của thanh vị trí nằm trong thanh và trong vùng xanh khi chip là "Bình thường".
3. Vị trí chấm: `[...document.querySelectorAll('main [role="img"] > span:last-child')].map((el) => el.style.left)`. Ghi lại; mỗi giá trị nằm trong 0%–100%.
4. Nếu có cảnh báo: thẻ cảnh báo đứng trên thẻ kết luận, hai nút cao 44 px; chạm "Vì sao có cảnh báo này?" mở một hộp thoại ở giữa màn hình có đúng một đoạn giải thích; đóng được bằng nút "Đã hiểu" và bằng cách chạm vùng tối bên ngoài. Nếu không có cảnh báo: ghi "chưa kiểm, có unit test".
5. Thanh chọn chỉ số: chỉ số đang chọn khớp chỉ số có cảnh báo đầu tiên (hoặc Cân nặng); chạm chỉ số khác thì biểu đồ đổi theo.
6. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
7. Lặp mục 1–2 ở `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: thanh vị trí còn phân biệt được vùng vàng và vùng xanh, chấm còn thấy rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được (thường là thẻ cảnh báo, hộp thoại "Vì sao" và màn chưa có lần đo nào) thì ghi "chưa kiểm, có unit test"; M2d có trang tạm cho thẻ cảnh báo và hộp thoại "Vì sao".

**Kết quả (2026-11-25).** Task 1: cả 2 patch áp sạch bằng `kb_patch`; đỏ đúng `Expected` (`Test Files  1 failed | 171 passed (172)`, `Tests  8 failed | 1290 passed (1298)`), xanh đúng `Expected` (172 file, 1298 test), `tsc --noEmit` sạch; commit `7f8e527`. Step 1: `tsc --noEmit` sạch; `Test Files  172 passed (172)`, `Tests  1298 passed (1298)`. Step 2: `bun run build` lần đầu dừng với cảnh báo bảo mật của Next.js 16.4.3 (mã 1), lần hai `✓ Generating static pages using 9 workers (39/39)` và thoát mã 0; không chạy `next upgrade`. Step 3: người dùng chọn khung Browser trong app (question card); cỡ 375×812 (`window.innerWidth` = 375); vẫn còn đăng nhập; dev nối Supabase thật, chỉ xem, chỉ chạm ba nút của thanh chọn chỉ số (mục 5), không chạm nút nào khác. Theme đang lưu trên máy là `dark`. Không dựng trang tạm, không dựng dữ liệu giả: mọi mục dưới đây là trên trang thật `/tang-truong`. Dữ liệu thật: 2 lần đo (25/11 và 15/11), có cân nặng và chiều dài, chưa có vòng đầu, không có cảnh báo nào.

1. **Đạt, trên trang thật, nhánh không có cảnh báo.** Ngay dưới tiêu đề là thẻ kết luận: vòng tròn có dấu tích, "Bun đang lớn đều", dòng "Đo gần nhất 25/11 · 2 tháng 15 ngày". Hàng đầu của danh sách là "25/11/2026 · 2 tháng 15 ngày": khớp. Thẻ kết luận khi có cảnh báo (không có dấu tích và tiêu đề "lớn đều"): **chưa kiểm, có unit test** (`components/growth/growthscreen.test.tsx`, `components/growth/growthparts.test.tsx`).
2. **Đạt, trên trang thật.** Hai khối: "Cân nặng · 5,7 kg · Bình thường", câu "Nặng hơn 34 trong 100 bé trai cùng tuổi · +0,2 kg sau 10 ngày"; "Chiều dài · 56,9 cm · Bình thường", câu "Dài hơn 6 trong 100 bé trai cùng tuổi · +1,9 cm sau 10 ngày". Vòng đầu chưa đo nên không có khối. Tên, giá trị, chip nằm trên một hàng; không phần tử nào trong `main` có `scrollWidth` lớn hơn `clientWidth` với `text-overflow: ellipsis` (0 phần tử); hai câu so sánh xuống 2 dòng, đúng phần được phép. Thanh vị trí rộng x 33–342; vùng xanh x 85–290. Chấm cân nặng x 156–176, chấm chiều dài x 99–119: cả hai nằm trong thanh và trong vùng xanh. Chấm cao 20 px trên thanh cao 10 px (nhô 5 px trên dưới, đúng thiết kế của `PositionBar`). Chip "Thấp", "Cao" và chấm ở vùng vàng: **chưa kiểm, có unit test**.
3. **Đạt.** Lệnh trong mục 3 trả về `["42.9706%", "24.5332%"]`, cả hai trong 0%–100%.
4. **Chưa kiểm, có unit test** (`components/growth/growthscreen.test.tsx`, `components/growth/growthparts.test.tsx`, `components/ui/popup.test.tsx`, `lib/rules/growthAlerts.test.ts`): dữ liệu thật không có cảnh báo, nên không thấy thẻ cảnh báo, hai nút 44 px, hộp thoại "Vì sao có cảnh báo này?", nút "Đã hiểu", chạm vùng tối để đóng. `showModal()`, Esc và hiệu ứng `kb-pop-in` của `Popup` vẫn chưa chạy lần nào trong trình duyệt. Trong trang chỉ có một `<dialog>`, là tấm ghi nhanh của layout (đang đóng), không phải `Popup`.
5. **Đạt, trên trang thật, nhánh không có cảnh báo.** Mở trang thì "Cân nặng" đang chọn (`aria-pressed="true"`); ba nút cao 44 px. Chạm "Chiều dài": biểu đồ đổi sang trục 45–81 cm, 2 chấm đo, dòng chú thích cuối trang đổi thành "(chiều dài)". Chạm "Vòng đầu": trục đổi sang 30–50 cm (đọc từ DOM, không chụp màn hình ở bước này; dữ liệu chưa có lần đo vòng đầu nào). Chạm lại "Cân nặng": trục 0–12 kg. Thanh chọn không có chấm cảnh báo nào (0 phần tử `aria-label="có cảnh báo"`), đúng vì không có cảnh báo. Chấm trên thanh chọn và việc tự mở ở chỉ số có cảnh báo: **chưa kiểm, có unit test** (`components/growth/growthscreen.test.tsx`, `components/ui/segmented.test.tsx`, `lib/rules/growthView.test.ts`).
6. **Đạt.** `document.documentElement.scrollWidth <= window.innerWidth` là `true` (375 và 375) ở cả bốn theme đã xem.
7. **Đạt ở `rose`, `light`, `dark`; không đạt một ý ở `night`** (đổi `dataset.theme` trong trang, không lưu). Ở `rose`, `light`, `dark`: thanh vị trí phân biệt được vùng vàng nâu hai đầu và vùng xanh ở giữa (ở `dark` hai màu đều trầm nhưng vẫn khác nhau), chấm thấy rõ (chấm màu `ink` có viền `glass-solid`), chữ và chip đọc rõ, không chữ nào bị cắt. Ở `night`: chấm, chữ và chip đọc rõ, nhưng **vùng vàng và vùng xanh của thanh vị trí cùng một màu**, và hai ô màu của dòng chú giải "Bình thường" / "Thấp hoặc cao hơn chuẩn" cũng giống hệt nhau. Lý do: theme `night` chỉ có một màu hổ phách, `--color-good` và `--color-warn` trong `app/globals.css` đều là `#d9895c` (màu tính được của hai vùng trùng nhau: `oklab(0.703705 0.0749038 0.0875176 / 0.35)`). Không sửa ở plan này (không thêm token, không tự sửa ngoài patch); cần người dùng quyết định. `peach`, `lavender`, `sea` không nằm trong mục 7: **chưa kiểm**.

Ghi chú của lần kiểm:

- **Màu của thẻ cảnh báo** (`bg-warn text-bg` ở vòng tròn và nút nền vàng): **chưa kiểm bằng mắt**, vì không thấy được thẻ cảnh báo. Số dưới đây chỉ tính từ token đọc trong trang (`--color-bg` trên `--color-warn`), không phải nhìn thẻ thật: `dark` 12,49, `night` 7,35, `light` 5,27, `rose` 5,42. Chữ `warn-ink` trên nền `warn-soft` của thẻ: `dark` 10,99, `night` 6,53, `light` 6,82, `rose` 6,23.
- Console của trang không có lỗi nào.
- `preview_start` cần `.claude/launch.json`; đã viết file tạm (`bun run dev`, cổng 3000) và xóa sau khi dừng dev. `bun run dev` lần này chạy được ngay, không dừng vì cảnh báo bảo mật. Sau khi dừng dev, `tsc --noEmit` vẫn sạch.
- Chưa kiểm: màn chưa có lần đo nào (chỉ còn tiêu đề và lời mời; có unit test), trạng thái đang tải và một bảng WHO về muộn (có unit test), iPhone thật, PWA đã cài.
- Sau plan này biểu đồ vẫn 5 đường WHO kèm dòng "Đường WHO P3, P15, P50 (đậm), P85, P97…", danh sách vẫn ghi "z -0,4 · P33,7" và dòng "z-score và phân vị là của chỉ số đang chọn": đúng Diễn giải spec mục 2, chờ M2d và M2e.

- [x] **Step 4: Commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2c.md
git commit -m "docs(plan): record the M2c check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Khi hỏi người dùng, nhắc Diễn giải spec mục 2: biểu đồ còn kiểu cũ cho tới M2d, danh sách cho tới M2e.

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m2c
git push origin main
```
