# Kim Bun — Mốc phát triển theo dòng thời gian, plan B: dòng thời gian và hai sheet Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-27-kim-bun-moc-phat-trien-dong-thoi-gian-design.md` (§3.2 phần vẽ, §4.3, §4.4, §4.5; §5 phần component)

**Status:** approved 2026-11-27

**Goal:** Có ba component hiển thị mới, đủ test render: dòng thời gian 8 mốc tháng, sheet "Vận động lớn" có thanh khoảng tuổi, và sheet "Khi nào nên hỏi bác sĩ", để plan C chỉ còn việc ghép vào màn.

**Architecture:**

- **`components/milestones/MilestoneTimeline.tsx` (mới):** không gọi hook; nhận các bước của `timelineSteps` (plan A) và vẽ `<ol>` các mốc, nút tròn, tiêu đề là nút gập/mở, thẻ của mốc đang mở chia theo lĩnh vực, mỗi dòng là `MilestoneItem` có sẵn.
- **`components/milestones/MotorSheet.tsx` (mới):** `MotorSheetBody` không gọi hook (danh sách 7 mốc, chip, thanh, nhãn trục) và `MotorSheet` bọc nó trong `Sheet` có sẵn.
- **`components/milestones/AskDoctorSheet.tsx` (mới):** `Sheet` chứa danh sách `askDoctor`.
- Chưa sửa `MilestonesScreen`: sau plan B màn vẫn như cũ (plan C gắn).

**Tech Stack:** Next.js 16.4.6, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind 4.3.3, Vitest 5.0.5, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-moc-phat-trien`, cùng nhánh plan A đã tạo, chạy tiếp sau 4 commit của plan A. Baseline: `Test Files  220 passed (220)`, `Tests  2153 passed (2153)`, typecheck sạch.

**Các plan của spec này:**

| Plan | Nội dung | File |
| --- | --- | --- |
| A | Trường `short` của 7 mốc vận động (§3.4) và các luật thuần của dòng thời gian, tóm tắt vận động, thanh khoảng tuổi (§3, §5), có test. Chưa đổi màn hình. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-a.md` |
| B | Hai component hiển thị mới không gọi hook dữ liệu: `MilestoneTimeline` (§4.3), `MotorSheet` và `AskDoctorSheet` (§4.4, §4.5), có test render. Chưa gắn vào màn. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-b.md` |
| C | `MilestonesScreen` ghép mọi phần (§4.1, §4.2, §4.6), bỏ `visibleGroups`, test màn; kiểm cuối, trang fixture, trình duyệt (§6), Bước 41 của checklist (§7), hỏi trước khi lên `main`. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-c.md` |

A, B, C chạy lần lượt trên cùng nhánh `feat/kim-bun-moc-phat-trien` và lên `main` cùng nhau ở cuối plan C (A và B không push riêng).

**Diễn giải spec** (chỗ spec để plan chốt, hoặc phải chọn một cách đọc):

1. **Component không gọi hook để test duyệt cây được.** `MilestoneTimeline` và `MotorSheetBody` là hàm thường trả về JSX, nên test gọi thẳng `MilestoneTimeline(props)` rồi tìm nút bằng `findElements` (`components/ui/testTree.ts`) và gọi `onClick`. `MotorSheet` (có `Sheet`, có hook) chỉ test bằng `renderToStaticMarkup`; `Sheet` vẽ con của nó trong `<dialog>` đóng nên vẫn thấy được chữ.
2. **Id của thẻ đang mở:** `timelineListId(months)` → `"ms-4"` (export từ `MilestoneTimeline.tsx`), dùng cho `id` của `<ul>` và `aria-controls` của nút tiêu đề.
3. **Nút tròn** (spec §3.2): `size-7` (28 px), chữ `text-xs font-bold`; `past-missing` ghi ký tự "!"; `next` và `later` cùng kiểu `border-2 border-muted/50 bg-glass-solid text-muted`. Nút có `aria-hidden="true"`: trạng thái đã nằm trong chữ tóm tắt.
4. **Chip trong sheet** cao bằng vòng tick 22 px: `leading-[22px]`, không `py`. Đoạn màu dùng `absolute inset-y-0` (bằng `top-0 bottom-0` của spec). Vạch hôm nay: `absolute -top-1 -bottom-1 -ml-px w-0.5 rounded bg-ink`.
5. **Tên mốc và dấu chờ đồng bộ** nằm chung một `<span>` `min-w-0 flex-1` (tên được xuống dòng, chip `shrink-0` không bị đè), giống `MilestoneItem`.
6. **Tiêu đề mốc** là `<span className="text-base font-bold …">` trong nút; tóm tắt là `<span>` thứ hai, chỉ render khi `summary !== null`.
7. **Màu chấm của lĩnh vực** dùng token loại bản ghi có sẵn (`bg-cat-feed`, `bg-cat-temp`, `bg-cat-sleep`, `bg-cat-diaper`), như spec §4.3; chỉ để trang trí (`aria-hidden`), tên lĩnh vực luôn có chữ.

## Global Constraints

Chép nguyên văn mục 2 của spec:

- Không migration, không đổi bảng `milestones_achieved`, không đổi RLS. Đọc và ghi vẫn qua `useMilestones` / `useMilestoneActions` (`lib/data/milestones.ts`) như hiện tại.
- Tuổi theo tháng: `ageInMonths(ageDays(baby.dob, now))` (`lib/rules/milestones.ts`, `lib/rules/time.ts`), 30,4375 ngày một tháng, như hiện tại. `now` là `new Date()` lúc render.
- Nội dung chỉ đọc từ `content/milestones.vi.json` qua `MILESTONES` (`lib/content/milestones.ts`). Thay đổi nội dung duy nhất: thêm trường `short` cho 7 mốc vận động (§3.4). `public/content/milestones.vi.json` là bản sao bị git bỏ qua, do `scripts/copy-content.ts` tạo lại ở `prebuild`; không sửa tay, không commit. Trường `short` chỉ thêm vào, không đổi trường cũ, nên nơi khác đọc `/content/*.vi.json` không bị ảnh hưởng.
- Không icon mới: dùng `star`, `check`, `alert`, `chevronDown`, `chevronUp`, `chevronRight`, `close` có sẵn trong `lib/ui/icons.ts`. Dấu chờ đồng bộ dùng `PendingMark` có sẵn (qua `MilestoneItem`). Không token màu mới.
- Vùng bấm tối thiểu 44 px, như mọi nút của app.
- Chữ trên màn hình viết đúng như spec này ghi trong ngoặc kép. Dấu gạch nối khoảng số là en dash "–" (U+2013). Dấu chấm giữa là "·" (U+00B7) có một khoảng trắng mỗi bên. Số thập phân dùng dấu phẩy ("3,8"), như `motorStatus` đang làm.
- Không thêm câu thống kê kiểu "… trong 100 bé" (ghi chú người dùng 2026-11-25).
- Rules thuần nằm trong `lib/rules/`, có test vitest; component hiển thị có test render bằng `renderToStaticMarkup` như các file `*.test.tsx` hiện có.
- Hết spec: `bun run typecheck` sạch, toàn bộ vitest xanh, `bun run build` thoát 0.

Giữ từ các spec trước (không đổi ở spec này):

- Chỉ tiếng Việt; Next.js 16.4.6, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; không thêm dependency, không web font.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md). Ba plan này không dùng API mới nào của Next.
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`. Theme `night` chỉ có một tông màu: không trạng thái nào được phân biệt chỉ bằng màu (mốc mở/gập khác nhau bằng mũi tên; mốc đã qua còn thiếu có dấu "!" và chữ, không chỉ màu cam).
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bỏ đánh dấu mốc nào. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Push lên `main` cần người dùng đồng ý từng lần.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi code nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 14 patch của ba plan (A: 4, B: 4, C: 4 + trang fixture và checklist) đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `b1f1bdd`, có `node_modules` riêng (`bun install --frozen-lockfile`). Mỗi task code là hai commit (test trước, code sau). Số test đỏ và xanh ghi trong từng bước là số đo thật trên cả bộ test; `tsc --noEmit` sạch sau mỗi commit code (ở bước đỏ có lỗi typecheck thì plan ghi rõ). Cây file cuối giống hệt bản đã viết lúc soạn plan. `bun run build` ở trạng thái cuối thoát 0 ngay lần đầu, `Generating static pages … (42/42)`, `/phat-trien` vẫn `○`; các class mới (`ring-5`, `ring-accent-tint`, `bg-ink/7`, `bg-muted/45`, `bg-ink/15`, `size-[22px]`, `size-[34px]`) có trong CSS đã build. **Chưa chạy khi viết plan:** mọi bước trình duyệt.
- **Không sửa patch bằng công cụ có prettier.** Một hook PostToolUse chạy prettier lên mọi file `.md` vừa được Edit/Write, và nó đổi các dòng trống trong khối `diff` (patch hỏng). Ghi kết quả vào file plan bằng một script (ví dụ `python3` mở file, thay chuỗi, ghi lại), không bằng Edit/Write.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài spec.
- **`bun run build` và `bun run dev`** có thể dừng một hay vài lần với thông báo cảnh báo bảo mật của Next.js (`SecurityFatalError`); chạy lại đúng lệnh tới khi thoát 0. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Spec và ba file plan chưa được commit.** `git status` thấy spec `docs/blueprint/specs/2026-11-27-kim-bun-moc-phat-trien-dong-thoi-gian-design.md` và ba file plan `…-moc-phat-trien-{a,b,c}.md` là untracked. Chỉ task cuối của plan C commit chúng, khi người dùng đồng ý.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **Không push.** Plan B dừng trên nhánh; plan C chạy tiếp trên cùng nhánh.

## Contracts with Other Plans

**Consumes (từ plan A):** `TimelineStep`, `StepKind`, `timelineSteps`, `motorStatus`, `MotorState`, `motorRange`, `motorBar` (`lib/rules/milestones.ts`); `MotorMilestone.short`. Từ `main`: `MilestoneItem`, `Sheet`, `Icon`, `PendingMark`, `cx`, `findElements`, `MILESTONES`, `Domain`, `MilestoneRow`.

**Produces (plan C dùng):**

- `components/milestones/MilestoneTimeline.tsx`:
  - `timelineListId(months: number): string` → `"ms-4"`
  - `MilestoneTimeline(props: { steps: TimelineStep[]; openMonths: number | null; domains: Record<Domain, string>; byCode: ReadonlyMap<string, MilestoneRow>; pending: ReadonlySet<string>; canEdit: (row: MilestoneRow | undefined) => boolean; onToggle: (months: number) => void; onOpenItem: (code: string, title: string) => void })`
- `components/milestones/MotorSheet.tsx`:
  - `MotorSheetBody(props: { motor: readonly MotorMilestone[]; ageMonths: number; ageText: string; babyName: string; byCode: ReadonlyMap<string, MilestoneRow>; pending: ReadonlySet<string>; canEdit: (row: MilestoneRow | undefined) => boolean; onPick: (code: string, title: string) => void })`
  - `MotorSheet(props: <như MotorSheetBody> & { onClose: () => void })` — `Sheet` title "Vận động lớn"
- `components/milestones/AskDoctorSheet.tsx`: `AskDoctorSheet(props: { lines: readonly string[]; onClose: () => void })` — `Sheet` title "Khi nào nên hỏi bác sĩ"
- **Vitest sau plan B:** `Test Files  222 passed (222)`, `Tests  2165 passed (2165)`.

---

### Task 1: Dòng thời gian các mốc tháng (spec §3.2, §4.3)

**Files:**

- Create: `components/milestones/MilestoneTimeline.tsx`
- Test: `components/milestones/milestonetimeline.test.tsx`

**Interfaces:**

- Consumes: `timelineSteps`, `TimelineStep`, `StepKind` (plan A); `MilestoneItem`, `Icon`, `cx`, `MILESTONES`, `findElements`.
- Produces: `MilestoneTimeline`, `timelineListId` (xem Contracts).

- [x] **Step 0: Kiểm plan A đã xong**

Run: `git log --oneline -4 && bunx vitest run`
Expected: 4 commit trên cùng là của plan A (`feat(milestones): timeline steps, motor summary and bars` đứng đầu); `Test Files  220 passed (220)`, `Tests  2153 passed (2153)`.

- [x] **Step 1: Viết test đỏ (Patch 1)**

Test phủ: 8 mốc, chỉ mốc 4 tháng mở với `aria-controls="ms-4"` và mũi tên lên; chữ tóm tắt cam, tóm tắt thường, tiêu đề mốc xa `text-muted`, tiêu đề mốc kế tiếp `text-ink`; nút tròn của từng loại; bốn tiêu đề lĩnh vực theo thứ tự với chấm màu; không có tóm tắt và không có màu cam khi chưa có dữ liệu; bấm tiêu đề gọi `onToggle(6)`, bấm một mục gọi `onOpenItem(code, text)`.

```diff
diff --git a/components/milestones/milestonetimeline.test.tsx b/components/milestones/milestonetimeline.test.tsx
new file mode 100644
index 0000000..10541b9
--- /dev/null
+++ b/components/milestones/milestonetimeline.test.tsx
@@ -0,0 +1,149 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import { MILESTONES } from "@/lib/content/milestones";
+import { timelineSteps } from "@/lib/rules/milestones";
+import type { MilestoneRow } from "@/lib/supabase/rows";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { MilestoneTimeline } from "./MilestoneTimeline";
+
+const groups = MILESTONES.groups;
+const codesOf = (months: number) =>
+  groups.find((g) => g.months === months)!.items.map((i) => i.code);
+const row = (code: string) =>
+  ({
+    id: `r-${code}`,
+    baby_id: "b1",
+    milestone_code: code,
+    achieved_on: "2026-11-12",
+    note: null,
+    photo_id: null,
+    created_by: "u1",
+    created_at: "2026-11-12T00:00:00.000Z",
+  }) as MilestoneRow;
+
+// Bun at 5 months: 10 of the 11 two-month items and the first four-month item.
+const achieved = [...codesOf(2).slice(0, -1), codesOf(4)[0]];
+const byCode = new Map(achieved.map((c) => [c, row(c)]));
+
+const props = (
+  over: Partial<Parameters<typeof MilestoneTimeline>[0]> = {},
+) => ({
+  steps: timelineSteps(groups, 5, new Set(achieved), true, "Bun"),
+  openMonths: 4 as number | null,
+  domains: MILESTONES.domains,
+  byCode,
+  pending: new Set<string>(),
+  canEdit: () => true,
+  onToggle: () => {},
+  onOpenItem: () => {},
+  ...over,
+});
+
+describe("MilestoneTimeline (spec 2026-11-27 §4.3)", () => {
+  it("lists all eight month groups, only the open one expanded", () => {
+    const html = renderToStaticMarkup(<MilestoneTimeline {...props()} />);
+    expect(html.match(/<li class="flex gap-3">/g)).toHaveLength(8);
+    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
+    expect(html.match(/aria-expanded="false"/g)).toHaveLength(7);
+    expect(html).toMatch(
+      /aria-expanded="true" aria-controls="ms-4"[^>]*>.*Mốc 4 tháng/,
+    );
+    expect(html).toContain('id="ms-4"');
+    expect(html).not.toContain('id="ms-6"');
+    expect(html).toContain(`d="${ICON_PATHS.chevronUp}"`);
+  });
+
+  it("writes each summary in its colour", () => {
+    const html = renderToStaticMarkup(<MilestoneTimeline {...props()} />);
+    expect(html).toContain(
+      '<span class="text-[13px] font-semibold text-warn">Còn 1 mốc chưa đạt · nên hỏi bác sĩ</span>',
+    );
+    expect(html).toContain(
+      '<span class="text-[13px] text-muted">Bun đang ở đây · đạt 1/13</span>',
+    );
+    expect(html).toContain(">Sắp tới</span>");
+    expect(html).toContain(
+      '<span class="text-base font-bold text-muted">Mốc 9 tháng</span>',
+    );
+    expect(html).toContain(
+      '<span class="text-base font-bold text-ink">Mốc 6 tháng</span>',
+    );
+  });
+
+  it("draws the node of each kind", () => {
+    const html = renderToStaticMarkup(<MilestoneTimeline {...props()} />);
+    expect(html).toContain("bg-warn text-bg");
+    expect(html).toMatch(
+      /bg-accent text-on-accent ring-5 ring-accent-tint[^>]*>4</,
+    );
+    expect(html).toMatch(/border-2 border-muted\/50 bg-glass-solid[^>]*>6</);
+    const done = renderToStaticMarkup(
+      <MilestoneTimeline
+        {...props({
+          steps: timelineSteps(groups, 5, new Set(codesOf(2)), true, "Bun"),
+        })}
+      />,
+    );
+    expect(done).toContain("bg-good text-bg");
+    expect(done).toMatch(
+      /size-7[^"]*bg-good text-bg"><svg[^>]*><path d="M20 6 9 17l-5-5"/,
+    );
+    expect(done).toContain(">Đạt đủ 11 mốc</span>");
+  });
+
+  it("splits the open group by domain, in order, with a dot each", () => {
+    const html = renderToStaticMarkup(<MilestoneTimeline {...props()} />);
+    const heads = [...html.matchAll(/<h3[^>]*>.*?<\/span>([^<]+)<\/h3>/g)].map(
+      (m) => m[1],
+    );
+    expect(heads).toEqual([
+      "Xã hội, cảm xúc",
+      "Ngôn ngữ, giao tiếp",
+      "Nhận thức",
+      "Vận động",
+    ]);
+    for (const dot of [
+      "bg-cat-feed",
+      "bg-cat-temp",
+      "bg-cat-sleep",
+      "bg-cat-diaper",
+    ])
+      expect(html).toContain(dot);
+    expect(html).toContain("Tự cười để gây chú ý");
+    expect(html).toContain("Đạt ngày 12/11/2026");
+  });
+
+  it("shows no summary while the marks are loading", () => {
+    const html = renderToStaticMarkup(
+      <MilestoneTimeline
+        {...props({ steps: timelineSteps(groups, 5, new Set(), false, "Bun") })}
+      />,
+    );
+    for (const text of ["đang ở đây", "Sắp tới", "Sau này", "chưa đạt"])
+      expect(html).not.toContain(text);
+    expect(html).not.toContain("bg-warn");
+    expect(html).not.toContain("text-warn");
+  });
+
+  it("toggles a group and opens an item", () => {
+    const onToggle = vi.fn();
+    const onOpenItem = vi.fn();
+    const tree = MilestoneTimeline(props({ onToggle, onOpenItem }));
+    const [six] = findElements(
+      tree,
+      (e) => e.props["aria-controls"] === "ms-6",
+    );
+    (six.props.onClick as () => void)();
+    expect(onToggle).toHaveBeenCalledWith(6);
+    const [item] = findElements(
+      tree,
+      (e) => e.props.title === "Cười khúc khích khi bạn trêu",
+    );
+    (item.props.onOpen as () => void)();
+    expect(onOpenItem).toHaveBeenCalledWith(
+      codesOf(4)[1],
+      "Cười khúc khích khi bạn trêu",
+    );
+  });
+});
```

- [x] **Step 2: Chạy, thấy đỏ**

Run: `bunx vitest run components/milestones/milestonetimeline.test.tsx; bunx vitest run`
Expected: file test `Test Files  1 failed (1)`, `Error: Cannot find module './MilestoneTimeline'`; cả bộ `Test Files  1 failed | 220 passed (221)`, `Tests  2153 passed (2153)`.

- [x] **Step 3: Commit test**

```bash
git add components/milestones/milestonetimeline.test.tsx
git commit -m "test(milestones): the month timeline" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 4: Viết component (Patch 2)**

```diff
diff --git a/components/milestones/MilestoneTimeline.tsx b/components/milestones/MilestoneTimeline.tsx
new file mode 100644
index 0000000..60f931f
--- /dev/null
+++ b/components/milestones/MilestoneTimeline.tsx
@@ -0,0 +1,158 @@
+import { Icon } from "@/components/ui/Icon";
+import type { Domain } from "@/lib/content/milestones";
+import type { StepKind, TimelineStep } from "@/lib/rules/milestones";
+import type { MilestoneRow } from "@/lib/supabase/rows";
+import { cx } from "@/lib/ui/cx";
+import { MilestoneItem } from "./MilestoneItem";
+
+const DOMAINS: Domain[] = ["social", "language", "cognitive", "movement"];
+
+const DOT: Record<Domain, string> = {
+  social: "bg-cat-feed",
+  language: "bg-cat-temp",
+  cognitive: "bg-cat-sleep",
+  movement: "bg-cat-diaper",
+};
+
+const NODE: Record<StepKind, string> = {
+  "past-done": "bg-good text-bg",
+  "past-missing": "bg-warn text-bg",
+  current: "bg-accent text-on-accent ring-5 ring-accent-tint",
+  next: "border-2 border-muted/50 bg-glass-solid text-muted",
+  later: "border-2 border-muted/50 bg-glass-solid text-muted",
+};
+
+export const timelineListId = (months: number) => `ms-${months}`;
+
+function Node({ kind, months }: { kind: StepKind; months: number }) {
+  return (
+    <span
+      aria-hidden="true"
+      className={cx(
+        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
+        NODE[kind],
+      )}
+    >
+      {kind === "past-done" ? (
+        <Icon name="check" size={14} strokeWidth={3} />
+      ) : kind === "past-missing" ? (
+        "!"
+      ) : (
+        months
+      )}
+    </span>
+  );
+}
+
+// Spec 2026-11-27 §4.3: the month groups as a vertical timeline. Hook-free, so
+// tests can walk the tree.
+export function MilestoneTimeline({
+  steps,
+  openMonths,
+  domains,
+  byCode,
+  pending,
+  canEdit,
+  onToggle,
+  onOpenItem,
+}: {
+  steps: TimelineStep[];
+  openMonths: number | null;
+  domains: Record<Domain, string>;
+  byCode: ReadonlyMap<string, MilestoneRow>;
+  pending: ReadonlySet<string>;
+  canEdit: (row: MilestoneRow | undefined) => boolean;
+  onToggle: (months: number) => void;
+  onOpenItem: (code: string, title: string) => void;
+}) {
+  return (
+    <ol className="flex flex-col">
+      {steps.map(({ group, kind, summary, summaryTone }) => {
+        const open = group.months === openMonths;
+        const id = timelineListId(group.months);
+        return (
+          <li key={group.months} className="flex gap-3">
+            <div className="flex w-7 shrink-0 flex-col items-center">
+              <Node kind={kind} months={group.months} />
+              <span aria-hidden="true" className="w-0.5 flex-1 bg-ink/15" />
+            </div>
+            <div className="flex min-w-0 flex-1 flex-col gap-2 pb-3.5">
+              <button
+                type="button"
+                aria-expanded={open}
+                aria-controls={id}
+                onClick={() => onToggle(group.months)}
+                className="flex min-h-11 w-full items-center gap-2 text-left"
+              >
+                <span className="flex min-w-0 flex-1 flex-col">
+                  <span
+                    className={cx(
+                      "text-base font-bold",
+                      kind === "later" ? "text-muted" : "text-ink",
+                    )}
+                  >
+                    Mốc {group.months} tháng
+                  </span>
+                  {summary !== null && (
+                    <span
+                      className={cx(
+                        "text-[13px]",
+                        summaryTone === "warn"
+                          ? "font-semibold text-warn"
+                          : "text-muted",
+                      )}
+                    >
+                      {summary}
+                    </span>
+                  )}
+                </span>
+                <Icon
+                  name={open ? "chevronUp" : "chevronDown"}
+                  size={18}
+                  className="shrink-0 text-muted"
+                />
+              </button>
+              {open && (
+                <ul id={id} className="glass overflow-hidden rounded-[22px]">
+                  {DOMAINS.filter((d) =>
+                    group.items.some((i) => i.domain === d),
+                  ).map((domain, index) => (
+                    <li
+                      key={domain}
+                      className={cx(index > 0 && "border-t border-line")}
+                    >
+                      <h3 className="flex items-center gap-2 px-4 pt-3 pb-1 text-[13px] font-semibold tracking-[0.04em] text-muted uppercase">
+                        <span
+                          aria-hidden="true"
+                          className={cx("size-2 rounded-full", DOT[domain])}
+                        />
+                        {domains[domain]}
+                      </h3>
+                      <ul>
+                        {group.items
+                          .filter((i) => i.domain === domain)
+                          .map((i) => {
+                            const row = byCode.get(i.code);
+                            return (
+                              <MilestoneItem
+                                key={i.code}
+                                title={i.text}
+                                row={row}
+                                pending={pending.has(i.code)}
+                                disabled={!canEdit(row)}
+                                onOpen={() => onOpenItem(i.code, i.text)}
+                              />
+                            );
+                          })}
+                      </ul>
+                    </li>
+                  ))}
+                </ul>
+              )}
+            </div>
+          </li>
+        );
+      })}
+    </ol>
+  );
+}
```

- [x] **Step 5: Chạy, thấy xanh**

Run: `bunx vitest run components/milestones/milestonetimeline.test.tsx && bun run typecheck && bunx vitest run`
Expected: file test `Tests  6 passed (6)`; `tsc --noEmit` không báo lỗi; cả bộ `Test Files  221 passed (221)`, `Tests  2159 passed (2159)`.

- [x] **Step 6: Commit**

```bash
git add components/milestones/MilestoneTimeline.tsx
git commit -m "feat(milestones): the month timeline" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Sheet "Vận động lớn" và sheet "Khi nào nên hỏi bác sĩ" (spec §3.5, §4.4, §4.5)

**Files:**

- Create: `components/milestones/MotorSheet.tsx`
- Create: `components/milestones/AskDoctorSheet.tsx`
- Test: `components/milestones/motorsheet.test.tsx`

**Interfaces:**

- Consumes: `motorStatus`, `MotorState`, `motorRange`, `motorBar` (plan A); `Sheet`, `Icon`, `PendingMark`, `cx`, `MILESTONES`, `findElements`.
- Produces: `MotorSheet`, `MotorSheetBody`, `AskDoctorSheet` (xem Contracts).

- [x] **Step 1: Viết test đỏ (Patch 3)**

Test phủ: `MotorSheet` là `<dialog>` title "Vận động lớn", dòng "Bun hôm nay: 5 tháng" và câu giải thích; chip "Đạt 12/11/2026" (`bg-good-soft text-good-ink`), 2 chip "Đang tới tuổi", 4 chip "Sắp tới" ở 5 tháng, 4 chip "Nên hỏi bác sĩ" ở 14 tháng (ngồi, đứng có đỡ, bò, đi có dắt); đoạn màu `left:21.1%;width:30%` của `ngoi` và `left:22.2%;width:11.1%` của `lat`, 7 vạch `left:27.8%`; `sr-only` "Thường trong khoảng 3,8–9,2 tháng"; hàng nhãn trục ẩn với trình đọc màn hình; dấu tick, dấu chờ đồng bộ, tên đầy đủ; nút bị `disabled` khi không có quyền sửa, bấm nút gọi `onPick("ngoi", "Ngồi không cần đỡ")`; `AskDoctorSheet` có title và `<ul class="list-disc pl-5 text-base text-ink">`.

```diff
diff --git a/components/milestones/motorsheet.test.tsx b/components/milestones/motorsheet.test.tsx
new file mode 100644
index 0000000..29257e2
--- /dev/null
+++ b/components/milestones/motorsheet.test.tsx
@@ -0,0 +1,112 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import { MILESTONES } from "@/lib/content/milestones";
+import type { MilestoneRow } from "@/lib/supabase/rows";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { AskDoctorSheet } from "./AskDoctorSheet";
+import { MotorSheet, MotorSheetBody } from "./MotorSheet";
+
+const rolled = {
+  id: "r1",
+  baby_id: "b1",
+  milestone_code: "lat",
+  achieved_on: "2026-11-12",
+  note: null,
+  photo_id: null,
+  created_by: "u1",
+  created_at: "2026-11-12T00:00:00.000Z",
+} as MilestoneRow;
+
+const props = (
+  over: Partial<Parameters<typeof MotorSheetBody>[0]> = {},
+): Parameters<typeof MotorSheetBody>[0] => ({
+  motor: MILESTONES.motor,
+  ageMonths: 5,
+  ageText: "5 tháng",
+  babyName: "Bun",
+  byCode: new Map([["lat", rolled]]),
+  pending: new Set<string>(),
+  canEdit: () => true,
+  onPick: () => {},
+  ...over,
+});
+
+describe("MotorSheet (spec 2026-11-27 §4.4)", () => {
+  it("is a sheet titled Vận động lớn with today's age", () => {
+    const html = renderToStaticMarkup(
+      <MotorSheet {...props()} onClose={() => {}} />,
+    );
+    expect(html).toContain("<dialog");
+    expect(html).toContain(">Vận động lớn</h2>");
+    expect(html).toContain("Bun hôm nay: 5 tháng");
+    expect(html).toContain(
+      "Thanh màu là khoảng tuổi bé thường làm được. Bấm một mốc để ghi ngày đạt.",
+    );
+  });
+
+  it("gives each milestone a short chip", () => {
+    const html = renderToStaticMarkup(<MotorSheetBody {...props()} />);
+    expect(html).toContain(
+      '<span class="shrink-0 rounded-full px-2.5 text-[13px] leading-[22px] font-semibold whitespace-nowrap bg-good-soft text-good-ink">Đạt 12/11/2026</span>',
+    );
+    expect(
+      html.match(/bg-accent-tint text-accent-text">Đang tới tuổi</g),
+    ).toHaveLength(2);
+    expect(html.match(/bg-ink\/7 text-ink">Sắp tới</g)).toHaveLength(4);
+    const late = renderToStaticMarkup(
+      <MotorSheetBody {...props({ ageMonths: 14 })} />,
+    );
+    expect(
+      late.match(/bg-warn-soft text-warn-ink">Nên hỏi bác sĩ</g),
+    ).toHaveLength(4); // ngồi, đứng có đỡ, bò, đi có dắt at 14 months
+  });
+
+  it("draws the window bars and today's line, hidden from screen readers", () => {
+    const html = renderToStaticMarkup(<MotorSheetBody {...props()} />);
+    expect(html).toContain(
+      '<span class="absolute inset-y-0 rounded-full bg-accent" style="left:21.1%;width:30%"></span>',
+    );
+    expect(html).toContain(
+      '<span class="absolute inset-y-0 rounded-full bg-good" style="left:22.2%;width:11.1%"></span>',
+    );
+    expect(html.match(/style="left:27.8%"/g)).toHaveLength(7);
+    expect(html).toContain(
+      '<span class="sr-only">Thường trong khoảng 3,8–9,2 tháng</span>',
+    );
+    expect(html).toMatch(
+      /aria-hidden="true"[^>]*><span>0<\/span><span>6<\/span><span>12<\/span><span>18 tháng<\/span>/,
+    );
+  });
+
+  it("shows the check, the pending mark and the full name", () => {
+    const html = renderToStaticMarkup(
+      <MotorSheetBody {...props({ pending: new Set(["lat"]) })} />,
+    );
+    expect(html).toContain(`d="${ICON_PATHS.check}"`);
+    expect(html).toContain('aria-label="Chờ đồng bộ"');
+    expect(html).toContain("Lật (từ sấp sang ngửa)");
+  });
+
+  it("picks a milestone, unless the user may not change it", () => {
+    const onPick = vi.fn();
+    const tree = MotorSheetBody(props({ onPick, canEdit: (r) => !r }));
+    const buttons = findElements(tree, (e) => e.type === "button");
+    expect(buttons).toHaveLength(7);
+    expect(buttons[0].props.disabled).toBe(true);
+    (buttons[1].props.onClick as () => void)();
+    expect(onPick).toHaveBeenCalledWith("ngoi", "Ngồi không cần đỡ");
+  });
+});
+
+describe("AskDoctorSheet (spec 2026-11-27 §4.5)", () => {
+  it("lists when to ask a doctor", () => {
+    const html = renderToStaticMarkup(
+      <AskDoctorSheet lines={["Một", "Hai"]} onClose={() => {}} />,
+    );
+    expect(html).toContain(">Khi nào nên hỏi bác sĩ</h2>");
+    expect(html).toContain(
+      '<ul class="list-disc pl-5 text-base text-ink"><li>Một</li><li>Hai</li></ul>',
+    );
+  });
+});
```

- [x] **Step 2: Chạy, thấy đỏ**

Run: `bunx vitest run components/milestones/motorsheet.test.tsx; bunx vitest run`
Expected: file test `Test Files  1 failed (1)`, lỗi `Cannot find module './AskDoctorSheet'` (hoặc `./MotorSheet`); cả bộ `Test Files  1 failed | 221 passed (222)`, `Tests  2159 passed (2159)`.

- [x] **Step 3: Commit test**

```bash
git add components/milestones/motorsheet.test.tsx
git commit -m "test(milestones): the Vận động lớn and ask-a-doctor sheets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 4: Viết hai sheet (Patch 4)**

```diff
diff --git a/components/milestones/AskDoctorSheet.tsx b/components/milestones/AskDoctorSheet.tsx
new file mode 100644
index 0000000..d651c0b
--- /dev/null
+++ b/components/milestones/AskDoctorSheet.tsx
@@ -0,0 +1,23 @@
+"use client";
+
+import { Sheet } from "@/components/ui/Sheet";
+
+// Spec 2026-11-27 §4.5: the "Khi nào nên hỏi bác sĩ" lines, once for the
+// whole screen.
+export function AskDoctorSheet({
+  lines,
+  onClose,
+}: {
+  lines: readonly string[];
+  onClose: () => void;
+}) {
+  return (
+    <Sheet open onClose={onClose} title="Khi nào nên hỏi bác sĩ">
+      <ul className="list-disc pl-5 text-base text-ink">
+        {lines.map((line) => (
+          <li key={line}>{line}</li>
+        ))}
+      </ul>
+    </Sheet>
+  );
+}
diff --git a/components/milestones/MotorSheet.tsx b/components/milestones/MotorSheet.tsx
new file mode 100644
index 0000000..1a74fb7
--- /dev/null
+++ b/components/milestones/MotorSheet.tsx
@@ -0,0 +1,146 @@
+"use client";
+
+import { PendingMark } from "@/components/sync/PendingMark";
+import { Icon } from "@/components/ui/Icon";
+import { Sheet } from "@/components/ui/Sheet";
+import type { MotorMilestone } from "@/lib/content/milestones";
+import {
+  motorBar,
+  motorRange,
+  motorStatus,
+  type MotorState,
+} from "@/lib/rules/milestones";
+import type { MilestoneRow } from "@/lib/supabase/rows";
+import { cx } from "@/lib/ui/cx";
+
+const CHIP: Record<MotorState, string> = {
+  done: "bg-good-soft text-good-ink",
+  window: "bg-accent-tint text-accent-text",
+  early: "bg-ink/7 text-ink",
+  late: "bg-warn-soft text-warn-ink",
+};
+
+const BAR: Record<MotorState, string> = {
+  done: "bg-good",
+  window: "bg-accent",
+  early: "bg-muted/45",
+  late: "bg-warn",
+};
+
+type BodyProps = {
+  motor: readonly MotorMilestone[];
+  ageMonths: number;
+  ageText: string;
+  babyName: string;
+  byCode: ReadonlyMap<string, MilestoneRow>;
+  pending: ReadonlySet<string>;
+  canEdit: (row: MilestoneRow | undefined) => boolean;
+  onPick: (code: string, title: string) => void;
+};
+
+// Spec 2026-11-27 §4.4: the seven WHO motor milestones with their age windows.
+// Hook-free, so tests can walk the tree.
+export function MotorSheetBody({
+  motor,
+  ageMonths,
+  ageText,
+  babyName,
+  byCode,
+  pending,
+  canEdit,
+  onPick,
+}: BodyProps) {
+  return (
+    <div className="flex flex-col gap-3">
+      <p className="flex items-center gap-1.5 text-[13px] text-muted">
+        <span aria-hidden="true" className="h-3.5 w-0.5 rounded bg-ink" />
+        {babyName} hôm nay: {ageText}
+      </p>
+      <ul className="glass overflow-hidden rounded-[22px]">
+        {motor.map((m) => {
+          const row = byCode.get(m.code);
+          const { state } = motorStatus(m, ageMonths, row !== undefined);
+          const bar = motorBar(m, ageMonths);
+          const chip =
+            row !== undefined
+              ? `Đạt ${row.achieved_on.split("-").reverse().join("/")}`
+              : motorStatus(m, ageMonths, false).text;
+          return (
+            <li key={m.code} className="border-b border-line">
+              <button
+                type="button"
+                disabled={!canEdit(row)}
+                onClick={() => onPick(m.code, m.name)}
+                className="flex min-h-[60px] w-full flex-col gap-2 px-4 py-3 text-left disabled:opacity-100"
+              >
+                <span className="flex w-full items-center gap-2.5">
+                  <span
+                    aria-hidden="true"
+                    className={cx(
+                      "flex size-[22px] shrink-0 items-center justify-center rounded-full",
+                      row ? "bg-good text-bg" : "border-2 border-muted/50",
+                    )}
+                  >
+                    {row && <Icon name="check" size={13} strokeWidth={3} />}
+                  </span>
+                  <span className="min-w-0 flex-1 text-base text-ink">
+                    {m.name} <PendingMark pending={pending.has(m.code)} />
+                  </span>
+                  <span
+                    className={cx(
+                      "shrink-0 rounded-full px-2.5 text-[13px] leading-[22px] font-semibold whitespace-nowrap",
+                      CHIP[state],
+                    )}
+                  >
+                    {chip}
+                  </span>
+                </span>
+                <span
+                  aria-hidden="true"
+                  className="relative h-2.5 w-full rounded-full bg-ink/7"
+                >
+                  <span
+                    className={cx(
+                      "absolute inset-y-0 rounded-full",
+                      BAR[state],
+                    )}
+                    style={{ left: bar.left, width: bar.width }}
+                  />
+                  <span
+                    className="absolute -top-1 -bottom-1 -ml-px w-0.5 rounded bg-ink"
+                    style={{ left: bar.today }}
+                  />
+                </span>
+                <span className="sr-only">{motorRange(m)}</span>
+              </button>
+            </li>
+          );
+        })}
+        <li
+          aria-hidden="true"
+          className="flex justify-between px-4 pt-2 pb-3 text-[13px] text-muted"
+        >
+          <span>0</span>
+          <span>6</span>
+          <span>12</span>
+          <span>18 tháng</span>
+        </li>
+      </ul>
+      <p className="px-1 text-[13px] text-muted">
+        Thanh màu là khoảng tuổi bé thường làm được. Bấm một mốc để ghi ngày
+        đạt.
+      </p>
+    </div>
+  );
+}
+
+export function MotorSheet({
+  onClose,
+  ...body
+}: BodyProps & { onClose: () => void }) {
+  return (
+    <Sheet open onClose={onClose} title="Vận động lớn">
+      <MotorSheetBody {...body} />
+    </Sheet>
+  );
+}
```

- [x] **Step 5: Chạy, thấy xanh**

Run: `bunx vitest run components/milestones/motorsheet.test.tsx && bun run typecheck && bunx vitest run`
Expected: file test `Tests  6 passed (6)`; `tsc --noEmit` không báo lỗi; cả bộ `Test Files  222 passed (222)`, `Tests  2165 passed (2165)`.

- [x] **Step 6: Commit**

```bash
git add components/milestones/MotorSheet.tsx components/milestones/AskDoctorSheet.tsx
git commit -m "feat(milestones): the Vận động lớn and ask-a-doctor sheets" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 7: Dừng, chưa push**

Plan B xong trên nhánh `feat/kim-bun-moc-phat-trien`. Không push, không merge: plan C chạy tiếp trên cùng nhánh này.

## Kết quả thực thi (2026-11-27)

- Step 0: 4 commit plan A trên đầu (`bf6d3c0` đứng đầu); `220 passed (220)` / `2153 passed (2153)`.
- Task 1: Patch 1 áp sạch; đỏ `Test Files  1 failed (1)`, `Error: Cannot find module './MilestoneTimeline'`, cả bộ `Test Files  1 failed | 220 passed (221)`, `Tests  2153 passed (2153)`; commit `cbd5c49`. Patch 2 áp sạch; xanh `Tests  6 passed (6)`, typecheck sạch, cả bộ `221 passed (221)` / `2159 passed (2159)`; commit `f7fb0ee`.
- Task 2: Patch 3 áp sạch; đỏ `Cannot find module './AskDoctorSheet'`, cả bộ `Test Files  1 failed | 221 passed (222)`, `Tests  2159 passed (2159)`; commit `01bef50`. Patch 4 áp sạch; xanh `Tests  6 passed (6)`, typecheck sạch, cả bộ `222 passed (222)` / `2165 passed (2165)`; commit `7b1f860`.
- Mọi số khớp plan. Không push.
