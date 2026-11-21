# Kim Bun — UX mobile M5b: trang Tiêm chủng thành bảng vắc xin × mũi Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§7.2 phần component, §7.3; phần tương ứng của §11.1 và §11.2)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Trang Tiêm chủng hiện lịch tiêm thành một bảng: mỗi hàng một vắc xin, mỗi cột một mũi, mỗi ô tô màu theo trạng thái, mỗi nhóm chưa chọn loại chỉ một hàng; rồi M5a và M5b lên `main`.

**Architecture:**

- **Giao diện:** component mới `DoseGrid` vẽ `<table>` thật trong một vùng cuộn ngang, cột nhãn dính trái; `VaccineScreen` dùng nó thay `DoseSections`; `DoseSheet` hiện thêm chương trình, câu quá tuổi và ghi chú của mũi.
- **Luật thuần:** thu hẹp luật dùng tên `series` làm nhãn hàng.
- **Xoá:** `DoseSections.tsx`, `STATE_SECTIONS`.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m5b`, cắt từ `feat/kim-bun-ux-mobile-m5a`. Baseline: 1051 test vitest xanh (156 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a, M2b, M2c | §3 trang Hôm nay | đã xong, đã lên `main` @ `e1e729f` |
| M6 | phần còn lại của §8 Thống kê | đã xong, đã lên `main` @ `34f18f6` |
| M5a | §7.1 thẻ "cần làm trước", luật của §7.2 | `2026-11-19-kim-bun-ux-mobile-m5a.md` |
| **M5b (plan này)** | §7.2 bảng vắc xin × mũi, §7.3 | `2026-11-19-kim-bun-ux-mobile-m5b.md` |
| M5c | §9 Khám phá | `2026-11-19-kim-bun-ux-mobile-m5c.md` |
| M3a, M3b | §4 timer trong tab, §5.4 sheet "+" | đã chạy thử, chưa viết plan |
| M4 | §6 Triệu chứng | chưa viết |
| Kết | §11.3 bước 36 của checklist thiết bị | làm sau cùng |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Ô tiêu đề "Vắc xin"** cũng dính trái với nền `bg-glass-solid` như cả cột nhãn. Nhãn hàng là `<th scope="row">`.
2. **Bảng** dùng `border-separate border-spacing-0`; ô có padding 4 px.
3. **Icon dấu tích** cỡ 12, nét 3.
4. **`PendingMark`** nằm ở góc trên phải của ô bấm (đặt tuyệt đối). Đặt cùng dòng với nhãn thì "Đã tiêm" kèm icon sẽ vượt 70 px.
5. **Không xuống dòng:** dòng nhãn của ô và chữ "Chưa chọn loại" có `whitespace-nowrap`.
6. **`aria-label` khi không có ngày** là "{tên mũi}: {nhãn}", không có khoảng trắng thừa. Nút "Chưa chọn loại" không có `aria-label` riêng.
7. **Dải mờ mép phải** dùng `bg-linear-to-l from-glass-solid to-transparent`, cùng kiểu với `ChipGroup`.
8. **Chú giải** là `<ul>`, mỗi mục một ô vuông `size-2.5 rounded-[3px]`.
9. **"Cuộn về đầu trang"** là `window.scrollTo({ top: 0 })`, không cuộn mượt, như `TriageScreen`.
10. **`onChoose` khi chủ gia đình đang ở bước thiết lập** chỉ cuộn về đầu trang (bước thiết lập chính là nơi chọn loại), không bật `editing`.
11. **`ChoicesEditor`:** phần sửa loại vaccine được tách khỏi `ChoicesSection` để bản nháp luôn bắt đầu từ lựa chọn đã lưu mỗi lần mở, kể cả khi mở từ bảng. Nút "Chọn loại vaccine" hoạt động như cũ.
12. **Một cột mũi:** khi chưa chọn loại nào, bảng chỉ có cột "Mũi 1" và nút "Chưa chọn loại" làm cột đó rộng hơn 78 px.
13. **Thứ còn thiếu test:** việc phần "Loại vaccine" thật sự mở ra khi chạm hàng chưa chọn loại (không có môi trường DOM). Test chỉ ghim `onChoose` có hay không và lời gọi cuộn. Phần còn lại kiểm ở Task 4 Step 3.
14. **Test xoá file:** `doses.test.tsx` kiểm rằng `DoseSections.tsx` không còn và `lib/rules/vaccines` không còn export `STATE_SECTIONS`.
15. **Kiểm trình duyệt** do phiên chính làm bằng khung Browser trong app ở 375×812; người dùng đã đăng nhập lại ở khung này ngày 2026-11-21.

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
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên bản sao đã có M5a ở ngoài repo; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code, số test đỏ và xanh của từng task đúng như ghi; tổng cả bộ đã được đo lại trên `main` @ `34f18f6`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status).
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.

## Contracts with Other Plans

Plan này đứng ngay sau M5a và ngay trước M5c.

**Consumes (từ M5a, `2026-11-19-kim-bun-ux-mobile-m5a.md`):**

- `lib/rules/vaccineGrid.ts`: `vaccineGrid(items, groups)`, `doseCell(item)`, `DoseTone`, `GridRow`.
- `lib/rules/days.ts`: `formatDayFull(day)`.
- `components/vaccines/NextDoseCard.tsx` và việc `VaccineScreen` đã vẽ nó.

**Produces:**

- `components/vaccines/DoseGrid.tsx`: `DoseGrid`.
- `components/vaccines/DoseLine.tsx`: `DoseLine({ item })` chỉ còn chương trình, câu quá tuổi, ghi chú.
- Không còn `components/vaccines/DoseSections.tsx` và `STATE_SECTIONS`.
- **Vitest sau M5b:** 1076 test, 157 file.

---

### Task 1: Component bảng `DoseGrid` (§7.2)

**Files:**

- Create: `components/vaccines/DoseGrid.tsx`
- Test: `components/vaccines/dosegrid.test.tsx` (mới)

**Interfaces:**

- Consumes: `vaccineGrid`, `doseCell`, `DoseTone`, `formatDayFull` (M5a); `doseKey` (`lib/rules/vaccineForm.ts`); `Icon`, `PendingMark`.
- Produces: `DoseGrid({ items, groups, pending, onOpen, onChoose }: { items: ScheduleItem[]; groups: VaccineGroup[]; pending: Set<string>; onOpen: (item: ScheduleItem) => void; onChoose?: () => void })` trong `components/vaccines/DoseGrid.tsx`, không có hook, tự gọi `vaccineGrid`. Có `onChoose` thì hàng chưa chọn loại là nút; không có thì là chữ.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m5b feat/kim-bun-ux-mobile-m5a
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/vaccines/dosegrid.test.tsx b/components/vaccines/dosegrid.test.tsx
new file mode 100644
index 0000000..346cb33
--- /dev/null
+++ b/components/vaccines/dosegrid.test.tsx
@@ -0,0 +1,235 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import type { VaccineGroup } from "@/lib/content/vaccineSchema";
+import type { ScheduleItem } from "@/lib/rules/vaccines";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { DoseGrid } from "./DoseGrid";
+
+const item = (
+  code: string,
+  doseNo: number,
+  state: string,
+  over: Record<string, unknown> = {},
+) =>
+  ({
+    dose: {
+      code,
+      doseNo,
+      name: `${code.toUpperCase()} mũi ${doseNo}`,
+      protects: ["X"],
+      program: "tcmr",
+      ...(over.dose as object),
+    },
+    due: "2026-10-29",
+    state,
+    record: null,
+    unchosen: false,
+    pastMaxAge: false,
+    ...over,
+  }) as unknown as ScheduleItem;
+
+const groups: VaccineGroup[] = [
+  {
+    code: "rota",
+    name: "Tiêu chảy do Rota",
+    series: [{ code: "rotarix", name: "Rotarix", program: "dich_vu" }],
+  },
+];
+
+const doneBcg = item("bcg", 1, "done", {
+  record: {
+    vaccine_code: "bcg",
+    dose_no: 1,
+    status: "done",
+    given_on: "2026-09-20",
+    due_on_override: null,
+  },
+});
+const rota = item("rotarix", 1, "later", {
+  unchosen: true,
+  dose: { group: "rota", series: "rotarix" },
+});
+const items = [
+  doneBcg,
+  item("pcv", 1, "overdue"),
+  rota,
+  item("pcv", 2, "upcoming"),
+  item("pcv", 4, "later"),
+];
+
+const render = (
+  list: ScheduleItem[],
+  over: { pending?: Set<string>; onChoose?: () => void } = {},
+) =>
+  renderToStaticMarkup(
+    <DoseGrid
+      items={list}
+      groups={groups}
+      pending={over.pending ?? new Set()}
+      onOpen={() => {}}
+      onChoose={over.onChoose}
+    />,
+  );
+
+const cell = (html: string, name: string) => {
+  const at = html.indexOf(`aria-label="${name}`);
+  expect(at, name).toBeGreaterThan(-1);
+  const start = html.lastIndexOf("<button", at);
+  return html.slice(start, html.indexOf("</button>", at) + 9);
+};
+
+// Spec 2026-11-19 §7.2.
+describe("DoseGrid", () => {
+  it("a real table in a glass shell that scrolls sideways, no glass inside it", () => {
+    const html = render(items);
+    expect(html).toMatch(
+      /^<div[^>]*><div class="glass [^"]*\brelative\b[^"]*\boverflow-hidden\b[^"]*\brounded-\[22px\]/,
+    );
+    expect(html).toMatch(/<div class="overflow-x-auto"><table/);
+    expect(html.match(/(?:class="|\s)glass(?=[\s"])/g)).toHaveLength(1);
+  });
+
+  it("header: Vắc xin, then Mũi 1 … Mũi {columns}", () => {
+    const html = render(items);
+    const head = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"));
+    const titles = [...head.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map(
+      (m) => m[1],
+    );
+    expect(titles).toEqual(["Vắc xin", "Mũi 1", "Mũi 2", "Mũi 3", "Mũi 4"]);
+    expect(head).toMatch(
+      /<th scope="col" class="sticky left-0 [^"]*\bbg-glass-solid\b[^"]*\bw-\[108px\][^"]*\btext-\[13px\] leading-\[18px\] font-semibold text-muted\b/,
+    );
+    expect(head).toMatch(
+      /<th scope="col" class="[^"]*\bw-\[78px\][^"]*">Mũi 1<\/th>/,
+    );
+  });
+
+  it("row labels stick to the left on solid glass, at most three lines", () => {
+    const html = render(items);
+    expect(html).toMatch(
+      /<th scope="row" class="sticky left-0 [^"]*\bbg-glass-solid\b[^"]*\bw-\[108px\][^"]*"><span class="line-clamp-3 text-\[13px\] leading-\[18px\] font-medium text-ink">BCG<\/span><\/th>/,
+    );
+    expect(html).toContain(">PCV</span></th>");
+  });
+
+  it("a done cell: green, check icon, the day it was given", () => {
+    const html = cell(render(items), "BCG mũi 1:");
+    expect(html).toContain('aria-label="BCG mũi 1: Đã tiêm 20/09/2026"');
+    expect(html).toMatch(
+      /^<button type="button" [^>]*class="[^"]*\bw-\[70px\] min-h-14\b[^"]*\brounded-\[14px\][^"]*\bbg-good-soft text-good-ink"/,
+    );
+    expect(html).toContain(`d="${ICON_PATHS.check}"`);
+    expect(html).toContain('width="12"');
+    expect(html).toMatch(/font-semibold[^"]*">.*Đã tiêm<\/span>/);
+    expect(html).toContain(
+      '<span class="text-[12px] leading-4 tabular-nums">20/09/2026</span>',
+    );
+  });
+
+  it("a done cell with no date: one line", () => {
+    const html = render([item("bcg", 1, "done")]);
+    expect(html).toContain('aria-label="BCG mũi 1: Đã tiêm"');
+    expect(html).not.toContain("tabular-nums");
+  });
+
+  it("each case gets its tone", () => {
+    const html = render([
+      item("a", 1, "skipped"),
+      item("b", 1, "overdue", { pastMaxAge: true }),
+      item("c", 1, "overdue"),
+      item("d", 1, "upcoming"),
+      item("e", 1, "later"),
+    ]);
+    expect(cell(html, "A mũi 1:")).toMatch(/bg-muted\/10 text-muted"/);
+    expect(cell(html, "A mũi 1:")).toContain('aria-label="A mũi 1: Bỏ qua"');
+    expect(cell(html, "B mũi 1:")).toContain(
+      'aria-label="B mũi 1: Quá tuổi 29/10/2026"',
+    );
+    expect(cell(html, "B mũi 1:")).toMatch(/bg-danger-soft text-danger-ink"/);
+    expect(cell(html, "C mũi 1:")).toContain(
+      'aria-label="C mũi 1: Trễ hẹn 29/10/2026"',
+    );
+    expect(cell(html, "C mũi 1:")).toMatch(/bg-danger-soft text-danger-ink"/);
+    expect(cell(html, "D mũi 1:")).toMatch(/bg-warn-soft text-warn-ink"/);
+    expect(cell(html, "D mũi 1:")).toContain(">Sắp tới");
+    expect(cell(html, "E mũi 1:")).toMatch(/bg-muted\/10 text-ink"/);
+    expect(cell(html, "E mũi 1:")).toContain(">Chưa tiêm");
+    expect(html).not.toContain(`d="${ICON_PATHS.check}"`);
+  });
+
+  it("a cell with no dose stays empty", () => {
+    const html = render(items);
+    const pcv = html.slice(html.indexOf(">PCV</span>"));
+    const row = pcv.slice(0, pcv.indexOf("</tr>"));
+    expect(row.match(/<td/g)).toHaveLength(4);
+    expect(row.match(/<button/g)).toHaveLength(3);
+    expect(row).toMatch(/<td class="[^"]*"><\/td>/);
+  });
+
+  it("a pending dose carries the pending mark", () => {
+    const html = render(items, { pending: new Set(["pcv#2"]) });
+    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
+    expect(cell(html, "PCV mũi 2:")).toContain('aria-label="Chờ đồng bộ"');
+  });
+
+  it("unchosen group, owner: a dashed button across the dose columns", () => {
+    const html = render(items, { onChoose: () => {} });
+    expect(html).toContain(">Tiêu chảy do Rota</span></th>");
+    expect(html).toMatch(
+      /<td colSpan="4" [^>]*><button type="button" class="[^"]*\bmin-h-14\b[^"]*\brounded-\[14px\] border border-dashed border-muted\b[^"]*\btext-\[13px\][^"]*\bfont-semibold\b[^"]*">Chưa chọn loại<svg/,
+    );
+    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
+    expect(html).not.toContain("Rotarix");
+  });
+
+  it("unchosen group, not the owner: plain muted text", () => {
+    const html = render(items);
+    const row = html.slice(html.indexOf(">Tiêu chảy do Rota</span>"));
+    const td = row.slice(row.indexOf("<td"), row.indexOf("</td>"));
+    expect(td).toContain('colSpan="4"');
+    expect(td).not.toContain("<button");
+    expect(td).toMatch(/class="[^"]*\btext-muted\b[^"]*">Chưa chọn loại</);
+    expect(html).not.toContain(ICON_PATHS.chevronRight);
+  });
+
+  it("a right fade only with more than three dose columns", () => {
+    const fade = /bg-linear-to-l from-glass-solid/;
+    expect(render(items)).toMatch(fade);
+    expect(render(items)).toMatch(/aria-hidden="true" class="[^"]*\bw-6\b/);
+    expect(render(items.slice(0, 4))).not.toMatch(fade);
+  });
+
+  it("a legend of four under the table", () => {
+    const html = render(items);
+    const legend = html.slice(html.indexOf("</table>"));
+    expect(legend).toMatch(
+      /<ul class="[^"]*\btext-\[12px\][^"]*\btext-muted\b/,
+    );
+    const entries = [
+      ...legend.matchAll(
+        /<li[^>]*><span aria-hidden="true" class="size-2\.5 rounded-\[3px\] ([^"]+)"><\/span>([^<]+)<\/li>/g,
+      ),
+    ].map((m) => [m[1], m[2]]);
+    expect(entries).toEqual([
+      ["bg-good-soft", "Đã tiêm"],
+      ["bg-danger-soft", "Trễ hẹn"],
+      ["bg-warn-soft", "Sắp tới"],
+      ["bg-muted/10", "Chưa tiêm"],
+    ]);
+  });
+
+  it("opens the tapped dose; the unchosen button calls onChoose", () => {
+    const onOpen = vi.fn();
+    const onChoose = vi.fn();
+    const buttons = findElements(
+      DoseGrid({ items, groups, pending: new Set(), onOpen, onChoose }),
+      (el) => el.type === "button",
+    );
+    expect(buttons).toHaveLength(5);
+    (buttons[1].props.onClick as () => void)();
+    expect(onOpen).toHaveBeenCalledExactlyOnceWith(items[1]);
+    (buttons[4].props.onClick as () => void)();
+    expect(onChoose).toHaveBeenCalledOnce();
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/vaccines/dosegrid.test.tsx`
Expected: FAIL, `Test Files  1 failed (1)`, không test nào chạy được (`Cannot find module './DoseGrid'`).

- [x] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/vaccines/DoseGrid.tsx b/components/vaccines/DoseGrid.tsx
new file mode 100644
index 0000000..dfcb594
--- /dev/null
+++ b/components/vaccines/DoseGrid.tsx
@@ -0,0 +1,175 @@
+import { PendingMark } from "@/components/sync/PendingMark";
+import { Icon } from "@/components/ui/Icon";
+import type { VaccineGroup } from "@/lib/content/vaccineSchema";
+import { formatDayFull } from "@/lib/rules/days";
+import { doseKey } from "@/lib/rules/vaccineForm";
+import { doseCell, vaccineGrid, type DoseTone } from "@/lib/rules/vaccineGrid";
+import type { ScheduleItem } from "@/lib/rules/vaccines";
+import { cx } from "@/lib/ui/cx";
+
+const TONE: Record<DoseTone, string> = {
+  done: "bg-good-soft text-good-ink",
+  skipped: "bg-muted/10 text-muted",
+  late: "bg-danger-soft text-danger-ink",
+  soon: "bg-warn-soft text-warn-ink",
+  open: "bg-muted/10 text-ink",
+};
+
+const LEGEND = [
+  { swatch: "bg-good-soft", text: "Đã tiêm" },
+  { swatch: "bg-danger-soft", text: "Trễ hẹn" },
+  { swatch: "bg-warn-soft", text: "Sắp tới" },
+  { swatch: "bg-muted/10", text: "Chưa tiêm" },
+];
+
+const HEAD = "text-[13px] leading-[18px] font-semibold text-muted";
+const LABEL_COLUMN =
+  "sticky left-0 z-10 bg-glass-solid w-[108px] min-w-[108px]";
+
+// Spec 2026-11-19 §7.2: vaccines × dose numbers. `onChoose` is given to the
+// family owner only; without it an unchosen group is plain text.
+export function DoseGrid({
+  items,
+  groups,
+  pending,
+  onOpen,
+  onChoose,
+}: {
+  items: ScheduleItem[];
+  groups: VaccineGroup[];
+  pending: Set<string>;
+  onOpen: (item: ScheduleItem) => void;
+  onChoose?: () => void;
+}) {
+  const { columns, rows } = vaccineGrid(items, groups);
+  const doseColumns = Array.from({ length: columns }, (_, i) => i + 1);
+  return (
+    <div className="flex flex-col gap-2.5">
+      <div className="glass relative overflow-hidden rounded-[22px]">
+        <div className="overflow-x-auto">
+          <table className="border-separate border-spacing-0">
+            <thead>
+              <tr>
+                <th
+                  scope="col"
+                  className={cx(LABEL_COLUMN, "px-3 py-2 text-left", HEAD)}
+                >
+                  Vắc xin
+                </th>
+                {doseColumns.map((n) => (
+                  <th
+                    key={n}
+                    scope="col"
+                    className={cx(
+                      "w-[78px] min-w-[78px] px-1 py-2 text-center",
+                      HEAD,
+                    )}
+                  >
+                    Mũi {n}
+                  </th>
+                ))}
+              </tr>
+            </thead>
+            <tbody>
+              {rows.map((row) => (
+                <tr key={`${row.kind}:${row.key}`}>
+                  <th
+                    scope="row"
+                    className={cx(LABEL_COLUMN, "px-3 py-1 text-left")}
+                  >
+                    <span className="line-clamp-3 text-[13px] leading-[18px] font-medium text-ink">
+                      {row.label}
+                    </span>
+                  </th>
+                  {row.kind === "unchosen" ? (
+                    <td colSpan={columns} className="p-1">
+                      {onChoose ? (
+                        <button
+                          type="button"
+                          onClick={onChoose}
+                          className="flex min-h-14 w-full items-center justify-center gap-1 rounded-[14px] border border-dashed border-muted px-3 text-[13px] leading-[18px] font-semibold whitespace-nowrap text-ink"
+                        >
+                          Chưa chọn loại
+                          <Icon name="chevronRight" size={16} />
+                        </button>
+                      ) : (
+                        <span className="block px-2 text-[13px] leading-[18px] whitespace-nowrap text-muted">
+                          Chưa chọn loại
+                        </span>
+                      )}
+                    </td>
+                  ) : (
+                    row.cells.map((item, i) =>
+                      item ? (
+                        <td key={i} className="p-1">
+                          {doseButton(
+                            item,
+                            pending.has(
+                              doseKey(item.dose.code, item.dose.doseNo),
+                            ),
+                            onOpen,
+                          )}
+                        </td>
+                      ) : (
+                        <td key={i} className="p-1"></td>
+                      ),
+                    )
+                  )}
+                </tr>
+              ))}
+            </tbody>
+          </table>
+        </div>
+        {columns > 3 && (
+          <div
+            aria-hidden="true"
+            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-glass-solid to-transparent"
+          />
+        )}
+      </div>
+      <ul className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[12px] leading-4 text-muted">
+        {LEGEND.map((entry) => (
+          <li key={entry.text} className="flex items-center gap-1.5">
+            <span
+              aria-hidden="true"
+              className={cx("size-2.5 rounded-[3px]", entry.swatch)}
+            ></span>
+            {entry.text}
+          </li>
+        ))}
+      </ul>
+    </div>
+  );
+}
+
+// A plain function, not a component, so the button stays in DoseGrid's tree.
+function doseButton(
+  item: ScheduleItem,
+  pending: boolean,
+  onOpen: (item: ScheduleItem) => void,
+) {
+  const { label, date, tone } = doseCell(item);
+  const day = date ? formatDayFull(date) : null;
+  return (
+    <button
+      type="button"
+      onClick={() => onOpen(item)}
+      aria-label={`${item.dose.name}: ${label}${day ? ` ${day}` : ""}`}
+      className={cx(
+        "relative mx-auto flex w-[70px] min-h-14 flex-col items-center justify-center rounded-[14px] px-1 py-1.5",
+        TONE[tone],
+      )}
+    >
+      <span className="flex items-center gap-0.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap">
+        {tone === "done" && <Icon name="check" size={12} strokeWidth={3} />}
+        {label}
+      </span>
+      {day && <span className="text-[12px] leading-4 tabular-nums">{day}</span>}
+      {pending && (
+        <span className="absolute top-0.5 right-0.5">
+          <PendingMark pending />
+        </span>
+      )}
+    </button>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/vaccines/dosegrid.test.tsx && bun run typecheck`
Expected: `Tests  13 passed (13)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add -- components/vaccines/DoseGrid.tsx components/vaccines/dosegrid.test.tsx
git commit -m "feat(vaccines): the vaccine by dose table" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Trang Tiêm chủng dùng bảng; `DoseSheet` có phần thông tin mũi; xoá danh sách cũ (§7.3)

**Files:**

- Modify: `components/vaccines/DoseLine.tsx`
- Delete: `components/vaccines/DoseSections.tsx`
- Modify: `components/vaccines/DoseSheet.tsx`
- Modify: `components/vaccines/VaccineScreen.tsx`
- Modify: `lib/rules/vaccines.ts`
- Test: `components/vaccines/doses.test.tsx` (sửa)
- Test: `components/vaccines/dosesheet.test.tsx` (sửa)
- Test: `components/vaccines/vaccinescreen.test.tsx` (sửa)

**Interfaces:**

- Consumes: `DoseGrid` (Task 1); `VACCINES.groups`; state `editing` có sẵn của `VaccineScreen`; `DoseLine`.
- Produces: `VaccineScreen` vẽ `DoseGrid` thay cho `DoseSections`; chủ gia đình có `onChoose` (mở phần "Loại vaccine" và cuộn về đầu trang), người khác thì không. Phần sửa loại vaccine tách thành component nội bộ `ChoicesEditor`. `DoseLine({ item })` không còn tên mũi, nhãn "Chưa chọn loại" và prop `pending`; `DoseSheet` vẽ nó ở đầu form. `components/vaccines/DoseSections.tsx` và `STATE_SECTIONS` bị xoá.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/vaccines/doses.test.tsx b/components/vaccines/doses.test.tsx
index 3fcf653..3b2726f 100644
--- a/components/vaccines/doses.test.tsx
+++ b/components/vaccines/doses.test.tsx
@@ -1,20 +1,23 @@
+import { existsSync } from "node:fs";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it, vi } from "vitest";
-import { findElements } from "@/components/ui/testTree";
+import { describe, expect, it } from "vitest";
+import * as vaccines from "@/lib/rules/vaccines";
 import type { ScheduleItem } from "@/lib/rules/vaccines";
 import { ICON_PATHS } from "@/lib/ui/icons";
-import { DoseSections } from "./DoseSections";
+import { DoseLine } from "./DoseLine";
 import { VaccineSourceRow } from "./VaccineSourceRow";
 
-const item = (code: string, state: string, over: Partial<ScheduleItem> = {}) =>
+const item = (state: string, { dose, ...over }: Record<string, unknown> = {}) =>
   ({
     dose: {
-      code,
+      code: "rotarix",
       doseNo: 1,
-      name: `Mũi ${code}`,
+      name: "Rotarix (uống) lần 1",
       protects: ["X"],
       program: "tcmr",
+      note: "Uống trước 24 tuần tuổi.",
+      ...(dose as object),
     },
     due: "2026-11-20",
     state,
@@ -24,41 +27,65 @@ const item = (code: string, state: string, over: Partial<ScheduleItem> = {}) =>
     ...over,
   }) as unknown as ScheduleItem;
 
-describe("DoseSections", () => {
-  it("one glass group per state with a count, rows with name, date and labels", () => {
-    const items = [
-      item("bcg", "overdue"),
-      item("rota", "overdue", { unchosen: true, pastMaxAge: true }),
-      item("mmr", "later"),
-    ];
-    const html = renderToStaticMarkup(
-      <DoseSections
-        items={items}
-        pending={new Set(["bcg#1"])}
-        onOpen={() => {}}
-      />,
+const render = (dose: ScheduleItem) =>
+  renderToStaticMarkup(<DoseLine item={dose} />);
+
+// Spec 2026-11-19 §7.3: DoseLine now draws only the facts shown in DoseSheet.
+describe("DoseLine", () => {
+  it("an open dose: when and program, then the note; no name, no pill", () => {
+    const html = render(item("upcoming", { unchosen: true }));
+    expect(html).toBe(
+      '<span class="text-[13px] text-muted tabular-nums">Hẹn Thứ Sáu, 20/11/2026 · Tiêm chủng mở rộng</span>' +
+        '<span class="text-[13px] text-muted">Uống trước 24 tuần tuổi.</span>',
     );
-    expect(html).toContain(">Quá hạn (2)</h2>");
-    expect(html).toContain(">Sau này (1)</h2>");
-    expect(html).not.toContain("Đã tiêm (");
-    expect(html.match(/class="glass/g)?.length).toBeGreaterThanOrEqual(2);
-    expect(html).toContain(">Mũi bcg ");
-    expect(html).toContain("Hẹn ");
-    expect(html).toContain("Tiêm chủng mở rộng");
-    expect(html).toContain(">Chưa chọn loại</span>");
-    expect(html).toContain("Đã quá tuổi khuyến cáo");
-    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
+    expect(html).not.toContain("Rotarix");
+    expect(html).not.toContain("Chưa chọn loại");
   });
 
-  it("opens the tapped dose", () => {
-    const onOpen = vi.fn();
-    const items = [item("bcg", "upcoming")];
-    const [row] = findElements(
-      DoseSections({ items, pending: new Set(), onOpen }),
-      (el) => el.type === "button",
+  it("past the age limit: the ask-a-doctor sentence", () => {
+    const html = render(
+      item("overdue", { pastMaxAge: true, dose: { program: "dich_vu" } }),
     );
-    (row.props.onClick as () => void)();
-    expect(onOpen).toHaveBeenCalledWith(items[0]);
+    expect(html).toContain(">Hẹn Thứ Sáu, 20/11/2026 · Dịch vụ</span>");
+    expect(html).toContain(
+      '<span class="text-[13px] text-danger">Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ.</span>',
+    );
+  });
+
+  it("done: the day it was given, no note", () => {
+    const given = (given_on: string | null) =>
+      item("done", {
+        record: {
+          vaccine_code: "rotarix",
+          dose_no: 1,
+          status: "done",
+          given_on,
+          due_on_override: null,
+        },
+      });
+    const html = render(given("2026-11-15"));
+    expect(html).toContain(
+      ">Đã tiêm Chủ nhật, 15/11/2026 · Tiêm chủng mở rộng<",
+    );
+    expect(html).not.toContain("Uống trước");
+    expect(render(given(null))).toContain(">Đã tiêm · Tiêm chủng mở rộng<");
+  });
+
+  it("skipped: Đã bỏ qua, the note still shown", () => {
+    const html = render(item("skipped"));
+    expect(html).toContain(">Đã bỏ qua · Tiêm chủng mở rộng<");
+    expect(html).toContain(">Uống trước 24 tuần tuổi.</span>");
+  });
+
+  it("no pending mark", () => {
+    expect(render(item("later"))).not.toContain(ICON_PATHS.clock);
+  });
+});
+
+describe("the old list by state", () => {
+  it("is gone: no DoseSections, no STATE_SECTIONS", () => {
+    expect(existsSync("components/vaccines/DoseSections.tsx")).toBe(false);
+    expect(Object.keys(vaccines)).not.toContain("STATE_SECTIONS");
   });
 });
 
diff --git a/components/vaccines/dosesheet.test.tsx b/components/vaccines/dosesheet.test.tsx
index 0f91d99..272e6d5 100644
--- a/components/vaccines/dosesheet.test.tsx
+++ b/components/vaccines/dosesheet.test.tsx
@@ -29,11 +29,11 @@ const rescheduled = {
   updated_at: "2026-11-01T00:00:00.000Z",
 } as VaccineDoseRow;
 
-const render = (row: VaccineDoseRow | null) =>
+const render = (row: VaccineDoseRow | null, dose: ScheduleItem = item) =>
   renderToStaticMarkup(
     <QueryClientProvider client={new QueryClient()}>
       <DoseSheet
-        item={item}
+        item={dose}
         row={row}
         babyId="b1"
         userId="u1"
@@ -72,4 +72,25 @@ describe("DoseSheet", () => {
     expect(html).toContain(">Xóa đánh dấu</button>");
     expect(html).toContain("text-danger!");
   });
+
+  // Spec 2026-11-19 §7.3: what the old list showed for the dose, at the top.
+  it("starts with when and program, the age-limit sentence and the note", () => {
+    const html = render(null, {
+      ...item,
+      state: "overdue",
+      pastMaxAge: true,
+      dose: { ...item.dose, note: "Uống trước 24 tuần tuổi." },
+    } as ScheduleItem);
+    expect(html).toMatch(
+      /<form [^>]*><div class="flex flex-col gap-0\.5"><span class="text-\[13px\] text-muted tabular-nums">Hẹn Thứ Sáu, 20\/11\/2026 · Dịch vụ<\/span><span class="text-\[13px\] text-danger">Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ\.<\/span><span class="text-\[13px\] text-muted">Uống trước 24 tuần tuổi\.<\/span><\/div><p /,
+    );
+  });
+
+  it("the facts of a plain dose: just when and program", () => {
+    const html = render(null);
+    expect(html).toMatch(
+      /<form [^>]*><div class="flex flex-col gap-0\.5"><span [^>]*>Hẹn Thứ Sáu, 20\/11\/2026 · Dịch vụ<\/span><\/div>/,
+    );
+    expect(html).not.toContain("Đã quá tuổi");
+  });
 });
diff --git a/components/vaccines/vaccinescreen.test.tsx b/components/vaccines/vaccinescreen.test.tsx
index e217c6b..a8ebb50 100644
--- a/components/vaccines/vaccinescreen.test.tsx
+++ b/components/vaccines/vaccinescreen.test.tsx
@@ -1,9 +1,15 @@
 import { renderToStaticMarkup } from "react-dom/server";
 import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
 import type { Baby, VaccineDoseRow } from "@/lib/supabase/rows";
+import type { DoseGrid } from "./DoseGrid";
 import { VaccineScreen } from "./VaccineScreen";
 
-const state = vi.hoisted(() => ({ doses: {} as Record<string, unknown> }));
+type GridProps = Parameters<typeof DoseGrid>[0];
+
+const state = vi.hoisted(() => ({
+  doses: {} as Record<string, unknown>,
+  grid: null as GridProps | null,
+}));
 // Four doses: one at birth, two at two months (one of them in a group), one late.
 const content = vi.hoisted(() => {
   const base = {
@@ -84,6 +90,16 @@ vi.mock("@/lib/data/vaccines", () => {
   };
 });
 vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
+// The real table, with its props kept for the tests below.
+vi.mock("./DoseGrid", async (importOriginal) => {
+  const actual = await importOriginal<typeof import("./DoseGrid")>();
+  return {
+    DoseGrid: (props: GridProps) => {
+      state.grid = props;
+      return actual.DoseGrid(props);
+    },
+  };
+});
 
 const CHOSEN = { dtp_combo: "6in1" };
 const CARD = /<button type="button" class="glass [^"]*rounded-\[28px\]/;
@@ -186,7 +202,9 @@ describe("VaccineScreen: the cần làm trước card", () => {
 
   it("is hidden when no dose is left to do", () => {
     const html = render(["bcg", "hexa", "pcv", "mmr"].map(done));
-    expect(html).toContain(">Đã tiêm (4)</h2>");
+    expect(
+      html.match(/aria-label="[^"]*: Đã tiêm 15\/11\/2026"/g),
+    ).toHaveLength(4);
     expect(html).not.toMatch(CARD);
   });
 
@@ -196,3 +214,68 @@ describe("VaccineScreen: the cần làm trước card", () => {
     expect(html).not.toMatch(CARD);
   });
 });
+
+// Spec 2026-11-19 §7.2 and §7.3.
+describe("VaccineScreen: the table", () => {
+  it("comes after the card, the source row and the choices, with its legend", () => {
+    const html = render([]);
+    const at = [
+      html.indexOf("</header>"),
+      html.search(CARD),
+      html.indexOf("Nguồn lịch tiêm"),
+      html.indexOf(">Chọn loại vaccine</button>"),
+      html.indexOf("<table"),
+      html.indexOf("</table>"),
+      html.indexOf(">Chưa tiêm</li>"),
+    ];
+    expect(at.every((n) => n > -1)).toBe(true);
+    expect([...at].sort((a, b) => a - b)).toEqual(at);
+    expect(html.slice(html.indexOf("</table>"))).not.toContain("<button");
+  });
+
+  it("one row per vaccine, no list by state", () => {
+    const html = render([done("bcg")]);
+    const labels = [
+      ...html.matchAll(/line-clamp-3[^"]*">([^<]+)<\/span>/g),
+    ].map((m) => m[1]);
+    expect(labels).toEqual(["Lao (BCG)", "6 trong 1", "Phế cầu", "Sởi"]);
+    expect(html).toContain('aria-label="Lao (BCG): Đã tiêm 15/11/2026"');
+    expect(html).toContain('aria-label="6 trong 1 mũi 1: Trễ hẹn 14/11/2026"');
+    expect(html).not.toContain("Quá hạn (");
+    expect(html).not.toContain("Sau này (");
+  });
+
+  it("not the owner: the unchosen group is plain text, and the new sentence", () => {
+    const html = render([], {}, false);
+    expect(state.grid?.onChoose).toBeUndefined();
+    expect(html).toContain(">Bạch hầu, ho gà, uốn ván</span></th>");
+    expect(html).toMatch(/text-muted">Chưa chọn loại<\/span><\/td>/);
+    expect(html).toContain(
+      "Còn 1 nhóm chưa chọn loại vaccine. Mỗi nhóm này hiện một hàng &quot;Chưa chọn loại&quot; trong bảng và không có nhắc lịch.",
+    );
+    expect(html).not.toContain("hiện nhãn");
+  });
+
+  it("the owner: a dashed button that scrolls back to the top", () => {
+    // A stored choice for a group that no longer exists: past setup, one unchosen.
+    const html = render([], { legacy: "x" });
+    expect(html).not.toContain(">Thiết lập lịch tiêm</h2>");
+    expect(html).toMatch(/border-dashed border-muted[^"]*">Chưa chọn loại<svg/);
+    expect(html).toContain("Còn 1 nhóm chưa chọn loại vaccine.");
+    const scrollTo = vi.fn();
+    vi.stubGlobal("window", { scrollTo });
+    try {
+      state.grid?.onChoose?.();
+    } finally {
+      vi.unstubAllGlobals();
+    }
+    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 });
+  });
+
+  it("the owner during setup: the button still scrolls to the setup step", () => {
+    const html = render([], {});
+    expect(html).toContain(">Thiết lập lịch tiêm</h2>");
+    expect(html).toMatch(/border-dashed border-muted/);
+    expect(state.grid?.onChoose).toBeTypeOf("function");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/vaccines/doses.test.tsx components/vaccines/dosesheet.test.tsx components/vaccines/vaccinescreen.test.tsx`
Expected: FAIL, `Tests  10 failed | 13 passed (23)`.

- [x] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/vaccines/DoseLine.tsx b/components/vaccines/DoseLine.tsx
index ed2cb2c..39991b9 100644
--- a/components/vaccines/DoseLine.tsx
+++ b/components/vaccines/DoseLine.tsx
@@ -1,14 +1,9 @@
-import { PendingMark } from "@/components/sync/PendingMark";
 import { formatDueDate } from "@/lib/rules/vaccineForm";
 import type { ScheduleItem } from "@/lib/rules/vaccines";
 
-export function DoseLine({
-  item,
-  pending,
-}: {
-  item: ScheduleItem;
-  pending: boolean;
-}) {
+// Spec 2026-11-19 §7.3: the facts of one dose at the top of DoseSheet. The
+// sheet title carries the name and the table carries the pending mark.
+export function DoseLine({ item }: { item: ScheduleItem }) {
   const { dose, record } = item;
   const when =
     item.state === "done"
@@ -20,17 +15,9 @@ export function DoseLine({
         : `Hẹn ${formatDueDate(item.due)}`;
   return (
     <>
-      <span className="text-base font-medium text-ink">
-        {dose.name} <PendingMark pending={pending} />
-      </span>
       <span className="text-[13px] text-muted tabular-nums">
         {when} · {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
       </span>
-      {item.unchosen && (
-        <span className="mt-0.5 rounded-full bg-muted/15 px-2 text-[13px] text-ink">
-          Chưa chọn loại
-        </span>
-      )}
       {item.pastMaxAge && (
         <span className="text-[13px] text-danger">
           Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ.
diff --git a/components/vaccines/DoseSections.tsx b/components/vaccines/DoseSections.tsx
deleted file mode 100644
index f230085..0000000
--- a/components/vaccines/DoseSections.tsx
+++ /dev/null
@@ -1,45 +0,0 @@
-import { ListGroup } from "@/components/ui/ListGroup";
-import { doseKey } from "@/lib/rules/vaccineForm";
-import { STATE_SECTIONS, type ScheduleItem } from "@/lib/rules/vaccines";
-import { DoseLine } from "./DoseLine";
-
-// Spec §9 Tiêm chủng: one ListGroup per state, in STATE_SECTIONS order.
-export function DoseSections({
-  items,
-  pending,
-  onOpen,
-}: {
-  items: ScheduleItem[];
-  pending: Set<string>;
-  onOpen: (item: ScheduleItem) => void;
-}) {
-  return (
-    <>
-      {STATE_SECTIONS.map((section) => {
-        const list = items.filter((item) => item.state === section.state);
-        if (list.length === 0) return null;
-        return (
-          <ListGroup
-            key={section.state}
-            title={`${section.title} (${list.length})`}
-          >
-            {list.map((item) => {
-              const key = doseKey(item.dose.code, item.dose.doseNo);
-              return (
-                <li key={key} className="border-b border-line last:border-b-0">
-                  <button
-                    type="button"
-                    onClick={() => onOpen(item)}
-                    className="flex min-h-[52px] w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left"
-                  >
-                    <DoseLine item={item} pending={pending.has(key)} />
-                  </button>
-                </li>
-              );
-            })}
-          </ListGroup>
-        );
-      })}
-    </>
-  );
-}
diff --git a/components/vaccines/DoseSheet.tsx b/components/vaccines/DoseSheet.tsx
index 515ede7..16c7a24 100644
--- a/components/vaccines/DoseSheet.tsx
+++ b/components/vaccines/DoseSheet.tsx
@@ -16,6 +16,7 @@ import {
 } from "@/lib/rules/vaccineForm";
 import type { ScheduleItem } from "@/lib/rules/vaccines";
 import type { VaccineDoseRow } from "@/lib/supabase/rows";
+import { DoseLine } from "./DoseLine";
 
 const ACTIONS: { value: DoseAction; label: string }[] = [
   { value: "done", label: "Đã tiêm" },
@@ -145,6 +146,10 @@ export function DoseSheet({
       }
     >
       <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
+        {/* Spec 2026-11-19 §7.3: what the old list showed for this dose. */}
+        <div className="flex flex-col gap-0.5">
+          <DoseLine item={item} />
+        </div>
         <p className="text-[15px] text-muted">
           Phòng: {item.dose.protects.join(", ")}. Hẹn {formatDueDate(item.due)}.
         </p>
diff --git a/components/vaccines/VaccineScreen.tsx b/components/vaccines/VaccineScreen.tsx
index 38a6046..d934178 100644
--- a/components/vaccines/VaccineScreen.tsx
+++ b/components/vaccines/VaccineScreen.tsx
@@ -25,7 +25,7 @@ import {
 } from "@/lib/rules/vaccines";
 import type { Baby } from "@/lib/supabase/rows";
 import { ChoiceFields } from "./ChoiceFields";
-import { DoseSections } from "./DoseSections";
+import { DoseGrid } from "./DoseGrid";
 import { DoseSheet } from "./DoseSheet";
 import { NextDoseCard } from "./NextDoseCard";
 import { VaccineSetup } from "./VaccineSetup";
@@ -96,6 +96,12 @@ export function VaccineScreen({
     isOwner && Object.keys(choices).length === 0 && !setupLater;
   // Spec 2026-11-19 §7: nothing to do first while the setup step is showing.
   const next = needsSetup ? null : nextDose(items);
+  // Spec 2026-11-19 §7.2: an unchosen row opens "Loại vaccine" at the top of
+  // the page; during setup the setup step up there is where to choose.
+  const choose = () => {
+    if (!needsSetup) setEditing(true);
+    window.scrollTo({ top: 0 });
+  };
   const rowFor = (item: ScheduleItem) =>
     rows.find(
       (row) =>
@@ -129,10 +135,12 @@ export function VaccineScreen({
           setEditing={setEditing}
         />
       )}
-      <DoseSections
+      <DoseGrid
         items={items}
+        groups={VACCINES.groups}
         pending={pending}
         onOpen={(item) => setOpen(item)}
+        onChoose={isOwner ? choose : undefined}
       />
       {open && (
         <DoseSheet
@@ -163,27 +171,17 @@ function ChoicesSection({
   editing: boolean;
   setEditing: (on: boolean) => void;
 }) {
-  const update = useUpdateChoices(baby.id);
-  const [draft, setDraft] = useState(choices);
-
   if (!editing)
     return (
       <section className="flex flex-col gap-2.5">
         {unchosen > 0 && (
           <p className="px-1 text-[15px] text-muted">
-            Còn {unchosen} nhóm chưa chọn loại vaccine. Mũi của các nhóm này
-            hiện nhãn "Chưa chọn loại" và không có nhắc lịch.
+            Còn {unchosen} nhóm chưa chọn loại vaccine. Mỗi nhóm này hiện một
+            hàng "Chưa chọn loại" trong bảng và không có nhắc lịch.
           </p>
         )}
         {isOwner ? (
-          <Button
-            variant="secondary"
-            block
-            onClick={() => {
-              setDraft(choices);
-              setEditing(true);
-            }}
-          >
+          <Button variant="secondary" block onClick={() => setEditing(true)}>
             Chọn loại vaccine
           </Button>
         ) : (
@@ -196,6 +194,29 @@ function ChoicesSection({
       </section>
     );
 
+  return (
+    <ChoicesEditor
+      baby={baby}
+      choices={choices}
+      onClose={() => setEditing(false)}
+    />
+  );
+}
+
+// Mounted each time it opens (from the button or from a row of the table), so
+// the draft always starts from the saved choices.
+function ChoicesEditor({
+  baby,
+  choices,
+  onClose,
+}: {
+  baby: Baby;
+  choices: Record<string, string>;
+  onClose: () => void;
+}) {
+  const update = useUpdateChoices(baby.id);
+  const [draft, setDraft] = useState(choices);
+
   return (
     <section className="flex flex-col gap-3">
       <h2 className={SECTION_TITLE}>Loại vaccine</h2>
@@ -210,7 +231,7 @@ function ChoicesSection({
           busy={update.isPending}
           onClick={() =>
             update.mutate(cleanChoices(VACCINES.groups, draft), {
-              onSuccess: () => setEditing(false),
+              onSuccess: onClose,
             })
           }
         >
@@ -222,7 +243,7 @@ function ChoicesSection({
           {toVietnameseError(update.error)}
         </p>
       )}
-      <Button variant="secondary" block onClick={() => setEditing(false)}>
+      <Button variant="secondary" block onClick={onClose}>
         Đóng
       </Button>
     </section>
diff --git a/lib/rules/vaccines.ts b/lib/rules/vaccines.ts
index a19211a..9864b52 100644
--- a/lib/rules/vaccines.ts
+++ b/lib/rules/vaccines.ts
@@ -27,14 +27,6 @@ export type ScheduleItem = {
 
 export const UPCOMING_DAYS = 30;
 
-export const STATE_SECTIONS: { state: DoseState; title: string }[] = [
-  { state: "overdue", title: "Quá hạn" },
-  { state: "upcoming", title: "Sắp tới (≤ 30 ngày)" },
-  { state: "done", title: "Đã tiêm" },
-  { state: "skipped", title: "Đã bỏ qua" },
-  { state: "later", title: "Sau này" },
-];
-
 export function visibleDoses(
   doses: VaccineDose[],
   choices: Record<string, string>,
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/vaccines/doses.test.tsx components/vaccines/dosesheet.test.tsx components/vaccines/vaccinescreen.test.tsx && bun run typecheck`
Expected: `Tests  23 passed (23)`; `tsc --noEmit` không báo lỗi.

Sau task này `DoseLine` còn in dòng "Hẹn …", trùng với đoạn "Phòng: …. Hẹn …." có sẵn của sheet. Task 3 bỏ chỗ trùng đó.

- [x] **Step 5: Commit**

```bash
git add -- components/vaccines/DoseLine.tsx components/vaccines/DoseSections.tsx components/vaccines/DoseSheet.tsx components/vaccines/VaccineScreen.tsx lib/rules/vaccines.ts components/vaccines/doses.test.tsx components/vaccines/dosesheet.test.tsx components/vaccines/vaccinescreen.test.tsx
git commit -m "feat(vaccines): the page shows the table instead of the lists" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Nhãn hàng khi `series` có nhiều mã; `DoseSheet` không lặp ngày hẹn (§7.2, §7.3)

**Files:**

- Modify: `components/vaccines/DoseLine.tsx`
- Modify: `lib/rules/vaccineGrid.ts`
- Test: `components/vaccines/doses.test.tsx` (sửa)
- Test: `components/vaccines/dosesheet.test.tsx` (sửa)
- Test: `lib/rules/vaccineGrid.test.ts` (sửa)

**Interfaces:**

- Consumes: `vaccineGrid` (M5a); `DoseLine` (Task 2).
- Produces: `vaccineGrid`: khi các mũi của một mã cho ra nhãn khác nhau, chỉ dùng tên `series` nếu trong `items` chỉ có đúng một mã thuộc `series` đó (cùng `group`); ngược lại giữ nhãn của mũi có `doseNo` nhỏ nhất. `DoseLine` chỉ còn: dòng chương trình ("Tiêm chủng mở rộng" hoặc "Dịch vụ"), câu quá tuổi khi `pastMaxAge`, và `dose.note` khi mũi chưa tiêm.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/vaccines/doses.test.tsx b/components/vaccines/doses.test.tsx
index 3b2726f..7fe34d7 100644
--- a/components/vaccines/doses.test.tsx
+++ b/components/vaccines/doses.test.tsx
@@ -32,13 +32,14 @@ const render = (dose: ScheduleItem) =>
 
 // Spec 2026-11-19 §7.3: DoseLine now draws only the facts shown in DoseSheet.
 describe("DoseLine", () => {
-  it("an open dose: when and program, then the note; no name, no pill", () => {
+  it("an open dose: the program, then the note; no name, date or pill", () => {
     const html = render(item("upcoming", { unchosen: true }));
     expect(html).toBe(
-      '<span class="text-[13px] text-muted tabular-nums">Hẹn Thứ Sáu, 20/11/2026 · Tiêm chủng mở rộng</span>' +
+      '<span class="text-[13px] text-muted">Tiêm chủng mở rộng</span>' +
         '<span class="text-[13px] text-muted">Uống trước 24 tuần tuổi.</span>',
     );
     expect(html).not.toContain("Rotarix");
+    expect(html).not.toContain("Hẹn");
     expect(html).not.toContain("Chưa chọn loại");
   });
 
@@ -46,13 +47,13 @@ describe("DoseLine", () => {
     const html = render(
       item("overdue", { pastMaxAge: true, dose: { program: "dich_vu" } }),
     );
-    expect(html).toContain(">Hẹn Thứ Sáu, 20/11/2026 · Dịch vụ</span>");
+    expect(html).toContain('<span class="text-[13px] text-muted">Dịch vụ</span>');
     expect(html).toContain(
       '<span class="text-[13px] text-danger">Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ.</span>',
     );
   });
 
-  it("done: the day it was given, no note", () => {
+  it("done: the program only, no date and no note", () => {
     const given = (given_on: string | null) =>
       item("done", {
         record: {
@@ -64,16 +65,16 @@ describe("DoseLine", () => {
         },
       });
     const html = render(given("2026-11-15"));
-    expect(html).toContain(
-      ">Đã tiêm Chủ nhật, 15/11/2026 · Tiêm chủng mở rộng<",
+    expect(html).toBe(
+      '<span class="text-[13px] text-muted">Tiêm chủng mở rộng</span>',
     );
-    expect(html).not.toContain("Uống trước");
-    expect(render(given(null))).toContain(">Đã tiêm · Tiêm chủng mở rộng<");
+    expect(render(given(null))).toBe(html);
   });
 
-  it("skipped: Đã bỏ qua, the note still shown", () => {
+  it("skipped: the program, the note still shown", () => {
     const html = render(item("skipped"));
-    expect(html).toContain(">Đã bỏ qua · Tiêm chủng mở rộng<");
+    expect(html).toContain(">Tiêm chủng mở rộng</span>");
+    expect(html).not.toContain("bỏ qua");
     expect(html).toContain(">Uống trước 24 tuần tuổi.</span>");
   });
 
diff --git a/components/vaccines/dosesheet.test.tsx b/components/vaccines/dosesheet.test.tsx
index 272e6d5..f15d6e0 100644
--- a/components/vaccines/dosesheet.test.tsx
+++ b/components/vaccines/dosesheet.test.tsx
@@ -74,7 +74,7 @@ describe("DoseSheet", () => {
   });
 
   // Spec 2026-11-19 §7.3: what the old list showed for the dose, at the top.
-  it("starts with when and program, the age-limit sentence and the note", () => {
+  it("starts with the program, the age-limit sentence and the note", () => {
     const html = render(null, {
       ...item,
       state: "overdue",
@@ -82,15 +82,16 @@ describe("DoseSheet", () => {
       dose: { ...item.dose, note: "Uống trước 24 tuần tuổi." },
     } as ScheduleItem);
     expect(html).toMatch(
-      /<form [^>]*><div class="flex flex-col gap-0\.5"><span class="text-\[13px\] text-muted tabular-nums">Hẹn Thứ Sáu, 20\/11\/2026 · Dịch vụ<\/span><span class="text-\[13px\] text-danger">Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ\.<\/span><span class="text-\[13px\] text-muted">Uống trước 24 tuần tuổi\.<\/span><\/div><p /,
+      /<form [^>]*><div class="flex flex-col gap-0\.5"><span class="text-\[13px\] text-muted">Dịch vụ<\/span><span class="text-\[13px\] text-danger">Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ\.<\/span><span class="text-\[13px\] text-muted">Uống trước 24 tuần tuổi\.<\/span><\/div><p /,
     );
   });
 
-  it("the facts of a plain dose: just when and program", () => {
+  it("the facts of a plain dose: just the program; the date only once", () => {
     const html = render(null);
     expect(html).toMatch(
-      /<form [^>]*><div class="flex flex-col gap-0\.5"><span [^>]*>Hẹn Thứ Sáu, 20\/11\/2026 · Dịch vụ<\/span><\/div>/,
+      /<form [^>]*><div class="flex flex-col gap-0\.5"><span [^>]*>Dịch vụ<\/span><\/div><p class="text-\[15px\] text-muted">Phòng: Lao\. Hẹn Thứ Sáu, 20\/11\/2026\.<\/p>/,
     );
+    expect(html.match(/20\/11\/2026/g)).toHaveLength(1);
     expect(html).not.toContain("Đã quá tuổi");
   });
 });
diff --git a/lib/rules/vaccineGrid.test.ts b/lib/rules/vaccineGrid.test.ts
index c670bc7..f1c66c7 100644
--- a/lib/rules/vaccineGrid.test.ts
+++ b/lib/rules/vaccineGrid.test.ts
@@ -119,6 +119,19 @@ describe("vaccineGrid", () => {
     );
   });
 
+  it("keeps the lowest dose's name when its series holds other codes too", () => {
+    const five = { group: "dtp_combo", series: "tcmr_5in1" };
+    const items = [
+      item("dpt_vgb_hib", 1, "DPT-VGB-Hib (5 trong 1) mũi 1", { dose: five }),
+      item("opv", 1, "Uống bại liệt (OPV) lần 1", { dose: five }),
+      item("dpt_vgb_hib", 4, "DPT nhắc lại (18 tháng)", { dose: five }),
+    ];
+    expect(vaccineGrid(items, groups).rows.map((row) => row.label)).toEqual([
+      "DPT-VGB-Hib (5 trong 1)",
+      "Uống bại liệt (OPV)",
+    ]);
+  });
+
   it("keeps the stripped name when the series is not found", () => {
     const items = [item("x", 1, "X mũi 1"), item("x", 2, "Y mũi 2")];
     expect(vaccineGrid(items, groups).rows[0].label).toBe("X");
@@ -238,7 +251,7 @@ describe("vaccineGrid", () => {
       ]);
     });
 
-    it("the 5 trong 1 series: three rows, the DPT row falls back to the series name", () => {
+    it("the 5 trong 1 series: three rows, the DPT row keeps its own name", () => {
       const grid = vaccineGrid(
         schedule({ dtp_combo: "tcmr_5in1" }),
         VACCINES.groups,
@@ -249,7 +262,7 @@ describe("vaccineGrid", () => {
       expect(labels).toEqual([
         "Vắc xin lao (BCG)",
         "Viêm gan B liều sơ sinh",
-        "Tiêm chủng mở rộng: 5 trong 1, bại liệt uống và tiêm",
+        "DPT-VGB-Hib (5 trong 1)",
         "Uống bại liệt (OPV)",
         "Tiêm bại liệt (IPV)",
       ]);
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/vaccineGrid.test.ts components/vaccines/doses.test.tsx components/vaccines/dosesheet.test.tsx`
Expected: FAIL, `Tests  8 failed | 19 passed (27)`.

- [x] **Step 3: Sửa code (Patch 6)**

```diff
diff --git a/components/vaccines/DoseLine.tsx b/components/vaccines/DoseLine.tsx
index 39991b9..ac07b87 100644
--- a/components/vaccines/DoseLine.tsx
+++ b/components/vaccines/DoseLine.tsx
@@ -1,22 +1,14 @@
-import { formatDueDate } from "@/lib/rules/vaccineForm";
 import type { ScheduleItem } from "@/lib/rules/vaccines";
 
 // Spec 2026-11-19 §7.3: the facts of one dose at the top of DoseSheet. The
-// sheet title carries the name and the table carries the pending mark.
+// sheet title carries the name, its "Phòng: …. Hẹn …." line the date, and
+// the table the pending mark.
 export function DoseLine({ item }: { item: ScheduleItem }) {
-  const { dose, record } = item;
-  const when =
-    item.state === "done"
-      ? record?.given_on
-        ? `Đã tiêm ${formatDueDate(record.given_on)}`
-        : "Đã tiêm"
-      : item.state === "skipped"
-        ? "Đã bỏ qua"
-        : `Hẹn ${formatDueDate(item.due)}`;
+  const { dose } = item;
   return (
     <>
-      <span className="text-[13px] text-muted tabular-nums">
-        {when} · {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
+      <span className="text-[13px] text-muted">
+        {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
       </span>
       {item.pastMaxAge && (
         <span className="text-[13px] text-danger">
diff --git a/lib/rules/vaccineGrid.ts b/lib/rules/vaccineGrid.ts
index 8a5d11e..296f6b1 100644
--- a/lib/rules/vaccineGrid.ts
+++ b/lib/rules/vaccineGrid.ts
@@ -21,11 +21,25 @@ const isOpen = (item: ScheduleItem) =>
   item.state === "upcoming" ||
   item.state === "later";
 
-function vaccineLabel(doses: ScheduleItem[], groups: VaccineGroup[]): string {
+function vaccineLabel(
+  doses: ScheduleItem[],
+  items: ScheduleItem[],
+  groups: VaccineGroup[],
+): string {
   const sorted = [...doses].sort((a, b) => a.dose.doseNo - b.dose.doseNo);
   const names = sorted.map((item) => item.dose.name.replace(DOSE_SUFFIX, ""));
   if (names.every((name) => name === names[0])) return names[0];
   const { group, series } = sorted[0].dose;
+  // The series name only when it names this code alone among `items`
+  // (tcmr_5in1 also holds opv and ipv, so dpt_vgb_hib keeps its own name).
+  const codes = new Set(
+    items
+      .filter(
+        (item) => item.dose.group === group && item.dose.series === series,
+      )
+      .map((item) => item.dose.code),
+  );
+  if (series === undefined || codes.size !== 1) return names[0];
   const named = groups
     .find((g) => g.code === group)
     ?.series.find((s) => s.code === series);
@@ -77,7 +91,7 @@ export function vaccineGrid(
       () => null,
     );
     for (const item of doses) cells[item.dose.doseNo - 1] = item;
-    return { kind, key, label: vaccineLabel(doses, groups), cells };
+    return { kind, key, label: vaccineLabel(doses, items, groups), cells };
   });
   return { columns, rows };
 }
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/vaccineGrid.test.ts components/vaccines/doses.test.tsx components/vaccines/dosesheet.test.tsx && bun run typecheck`
Expected: `Tests  27 passed (27)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add -- components/vaccines/DoseLine.tsx lib/rules/vaccineGrid.ts components/vaccines/doses.test.tsx components/vaccines/dosesheet.test.tsx lib/rules/vaccineGrid.test.ts
git commit -m "fix(vaccines): own name for rows of a shared series, no repeated due date" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M5b và lên `main`

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5b.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ của M5a và Task 1–3.
- Produces: `main` có M5a và M5b; nhánh `feat/kim-bun-ux-mobile-m5b` làm nền cho M5c.

- [x] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  157 passed (157)`, `Tests  1076 passed (1076)`.

- [x] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không bấm Lưu, không đụng timer)**

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Dùng khung Browser của app ở cỡ 375×812. Đóng mọi sheet bằng phím Esc.

Mở `http://localhost:3000/tiem-chung`. Trong `DoseSheet` không bấm "Lưu" hay nút nào ghi dữ liệu. Trong phần "Loại vaccine" không bấm "Lưu".

1. Ngay dưới tiêu đề có thẻ "cần làm trước" (trừ khi đang ở bước thiết lập hoặc không còn mũi nào để làm). Ghi lại nội dung đang thấy.
2. Bảng có hàng tiêu đề "Vắc xin", "Mũi 1", … Chạy bằng javascript tool: `(() => { const t = document.querySelector("main table"); const rows = [...t.querySelectorAll("tbody tr")]; return { head: [...t.querySelectorAll("thead th")].map((h) => h.textContent), rows: rows.map((r) => [r.querySelector("th")?.textContent, ...[...r.querySelectorAll("td")].map((d) => d.textContent)]), tableW: Math.round(t.getBoundingClientRect().width), boxW: Math.round(t.parentElement.getBoundingClientRect().width), clipped: [...t.querySelectorAll("td button span")].filter((s) => s.scrollWidth > s.clientWidth + 1).map((s) => s.textContent) }; })()`. Ghi lại `head` và `rows`. Kỳ vọng: mỗi nhóm chưa chọn loại chỉ có một hàng; `clipped` rỗng.
3. Ô "Đã tiêm" màu xanh nhạt có icon dấu tích và ngày tiêm; ô "Trễ hẹn" màu đỏ nhạt; ô "Sắp tới" màu vàng nhạt; ô "Chưa tiêm" màu xám nhạt. Mỗi ô có ngày dạng dd/mm/yyyy.
4. Nếu `tableW > boxW`: cuộn ngang bảng, cột "Vắc xin" đứng yên và mép phải có dải mờ. Nếu không: ghi "chưa kiểm" cho việc cuộn ngang.
5. Chạm một ô có mũi: `DoseSheet` của đúng mũi đó mở ra; đầu sheet có dòng "Tiêm chủng mở rộng" hoặc "Dịch vụ", và ngày hẹn chỉ xuất hiện một lần. Đóng bằng Esc.
6. Nếu có hàng "Chưa chọn loại" và tài khoản là chủ gia đình: chạm nút đó thì phần "Loại vaccine" mở ra ở đầu trang. Không bấm Lưu; tải lại trang để thoát.
7. Dưới bảng có chú giải "Đã tiêm", "Trễ hẹn", "Sắp tới", "Chưa tiêm".
8. `document.documentElement.scrollWidth <= window.innerWidth` là `true` (trang không tràn ngang, chỉ bảng cuộn).
9. Lặp mục 2 và 3 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`: chữ trong ô đọc rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được thì ghi "chưa kiểm".

**Kết quả (2026-11-21, khung Browser của app, 375×812, dữ liệu thật của gia đình, chỉ xem, không bấm Lưu):**

Step 1 và Step 2, chạy lại sau commit sửa thêm `0ada3b5` (xem cuối phần này):

- `tsc --noEmit` không báo lỗi; `Test Files  157 passed (157)`, `Tests  1079 passed (1079)`. Nhiều hơn con số dự kiến 3 test, là 3 test của commit sửa thêm.
- `bun run build`: lần đầu dừng với thông báo bảo mật, lần hai thoát mã 0, `✓ Generating static pages using 9 workers (38/38)`.

Step 3:

1. Đạt. Thẻ: "QUÁ HẠN 11 NGÀY", "Bexsero mũi 1", "Hẹn Thứ Ba, 10/11/2026 · Dịch vụ".
2. Đạt. `head`: Vắc xin, Mũi 1, Mũi 2, Mũi 3, Mũi 4. `clipped` rỗng. 12 hàng, ba nhóm chưa chọn loại mỗi nhóm một hàng:
   - Vắc xin lao (BCG): Đã tiêm
   - Viêm gan B liều sơ sinh: Đã tiêm 11/09/2026
   - Bexsero: Trễ hẹn 10/11/2026, Chưa tiêm 10/01/2027, Chưa tiêm 10/09/2027
   - 6 trong 1: Đã tiêm 12/11/2026, Sắp tới 10/12/2026, Chưa tiêm 10/01/2027, Chưa tiêm 10/12/2027
   - Prevenar 13: Trễ hẹn 10/11/2026, Sắp tới 10/12/2026, Chưa tiêm 10/01/2027, Chưa tiêm 10/09/2027
   - Rotarix (uống): Đã tiêm 12/11/2026, Sắp tới 10/12/2026
   - Cúm mùa: Chưa tiêm 10/03/2027, Chưa tiêm 10/04/2027
   - Viêm não Nhật Bản: Chưa chọn loại
   - Sởi – Quai bị – Rubella (dịch vụ): Chưa chọn loại
   - Sởi 9 tháng, Sởi – Rubella 18 tháng: Chưa tiêm 10/06/2027, Chưa tiêm 10/03/2028
   - Thủy đậu: Chưa chọn loại
   - Viêm gan A (Avaxim 80U): Chưa tiêm 10/09/2027, Chưa tiêm 10/03/2028
3. Đạt, với một ngoại lệ đúng thiết kế: ô BCG "Đã tiêm" chỉ có một dòng vì bản ghi không có ngày tiêm.
4. Đạt. Bảng 440 px trong hộp 341 px, cuộn ngang được 99 px; cột "Vắc xin" đứng yên; mép phải có dải mờ.
5. Đạt. Chạm ô "Bexsero mũi 2": sheet tên "Bexsero mũi 2", dòng "Dịch vụ", rồi "Phòng: Não mô cầu nhóm B. Hẹn Chủ nhật, 10/01/2027."; ngày hẹn xuất hiện đúng một lần. Đóng bằng Esc, không có hộp hỏi lại.
6. Đạt. Chạm nút "Chưa chọn loại" của hàng Viêm não Nhật Bản: phần "Loại vaccine" mở ra, trang cuộn về đầu (`scrollY` 0, tiêu đề ở 315 px). Không bấm Lưu; tải lại trang để thoát.
7. Đạt: Đã tiêm, Trễ hẹn, Sắp tới, Chưa tiêm.
8. Đạt: `true`. Chiều cao trang 1.426 px (trang cũ 4.701 px).
9. Đạt ở `rose` và `night` (nhìn tận mắt), thêm `dark` là theme gia đình đang dùng. Ngoài ra đo bằng script tỷ lệ tương phản chữ trên nền của bốn loại ô, nhãn hàng và nút "Chưa chọn loại" ở cả 7 theme: thấp nhất 5,7:1 (ô "Trễ hẹn" ở `night`), mọi giá trị đều trên 4,5:1.

Sửa thêm sau khi nhìn trang thật, ngoài các patch của plan (commit `0ada3b5`, test trước, code sau):

- Khi có dải mờ ở mép phải, bảng có thêm 20 px ở cuối (`pr-5`), để cột mũi cuối không nằm dưới dải mờ. Đo khi cuộn hết: ô cuối cách mép hộp 24 px.
- Chữ "Chưa chọn loại" bắt đầu ở mép trái của khung thay vì ở giữa, và dính ở 124 px (`sticky left-[124px]`) khi cuộn ngang. Trước khi sửa, cuộn hết sang phải thì chữ trượt xuống dưới cột "Vắc xin", chỉ còn thấy "ại ›". Đo sau khi sửa: mép trái của chữ ở 141–142 px với `scrollLeft` 0, 50 và 99.
- Hai test của `vaccinescreen.test.tsx` đổi theo markup mới.

Chưa kiểm: Safari trên iPhone. Riêng chữ dính của nút "Chưa chọn loại", nếu Safari không áp `sticky` bên trong nút thì chữ cuộn theo khung như trước khi sửa.

Không dừng `bun run dev`: M5c dùng tiếp cho phần kiểm trình duyệt.

- [x] **Step 4: Commit phần ghi kết quả, đưa lên `main`, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5b.md
git commit -m "docs(plan): record the M5b check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-ux-mobile-m5b
git push origin main
```

Báo cáo cho người dùng: `git log --oneline 34f18f6..main`; kết quả typecheck, vitest, build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa.
