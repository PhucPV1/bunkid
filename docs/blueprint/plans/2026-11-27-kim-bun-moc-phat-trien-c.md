# Kim Bun — Mốc phát triển theo dòng thời gian, plan C: ghép màn, kiểm cuối Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-27-kim-bun-moc-phat-trien-dong-thoi-gian-design.md` (§4.1, §4.2, §4.6; §5 phần `MilestonesScreen`; §6; §7)

**Status:** approved 2026-11-27

**Goal:** Màn `/phat-trien` hiện dòng "Vận động lớn", dòng thời gian 8 mốc, dòng "Khi nào nên hỏi bác sĩ" và dòng nguồn; được kiểm trên trình duyệt; có Bước 41 trong checklist; rồi lên `main` khi người dùng đồng ý.

**Architecture:**

- **`components/milestones/MilestonesScreen.tsx`:** giữ hook dữ liệu như cũ; state `openMonths` (khởi tạo bằng `defaultOpenMonths`) và `sheet` (`motor` / `askDoctor` / `item` có cờ `fromMotor`); ghép `MilestoneTimeline`, `MotorSheet`, `AskDoctorSheet`, `MilestoneSheet` có sẵn. Bỏ đoạn giới thiệu, khối "Mốc vận động lớn", các khối theo tháng và nút "Xem tất cả các mốc".
- **`lib/rules/milestones.ts`:** xóa `visibleGroups`; `lib/rules/milestones.test.ts` xóa test của nó.
- **Test màn mới** `components/milestones/milestonesscreen.test.tsx`: vẽ màn thật trong `QueryClientProvider` có dữ liệu đặt sẵn và đồng hồ giả.
- Trang fixture tạm `app/chk/page.tsx` cho bước trình duyệt, xóa trước khi commit.

**Tech Stack:** Next.js 16.4.6, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind 4.3.3, Vitest 5.0.5, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-moc-phat-trien`, chạy tiếp sau 4 commit của plan A và 4 commit của plan B. Baseline: `Test Files  222 passed (222)`, `Tests  2165 passed (2165)`, typecheck sạch.

**Các plan của spec này:**

| Plan | Nội dung | File |
| --- | --- | --- |
| A | Trường `short` của 7 mốc vận động (§3.4) và các luật thuần của dòng thời gian, tóm tắt vận động, thanh khoảng tuổi (§3, §5), có test. Chưa đổi màn hình. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-a.md` |
| B | Hai component hiển thị mới không gọi hook dữ liệu: `MilestoneTimeline` (§4.3), `MotorSheet` và `AskDoctorSheet` (§4.4, §4.5), có test render. Chưa gắn vào màn. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-b.md` |
| C | `MilestonesScreen` ghép mọi phần (§4.1, §4.2, §4.6), bỏ `visibleGroups`, test màn; kiểm cuối, trang fixture, trình duyệt (§6), Bước 41 của checklist (§7), hỏi trước khi lên `main`. | `docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-c.md` |

A, B, C chạy lần lượt trên cùng nhánh `feat/kim-bun-moc-phat-trien` và lên `main` cùng nhau ở cuối plan C (A và B không push riêng).

**Diễn giải spec** (chỗ spec để plan chốt, hoặc phải chọn một cách đọc):

1. **Mốc hiện tại cho sheet hỏi bác sĩ và link CDC** (spec §4.5, §4.6) là `groups.find((g) => g.months === defaultOpenMonths(groups, months))`: mốc hiện tại, hoặc `groups[0]` khi bé dưới 2 tháng. "Nguồn CDC" lấy `source` của mốc đang mở, không mốc nào mở thì mốc trên.
2. **"Nguồn WHO"** lấy `source` của mốc `ngoi` một lần ở cấp module (`WHO_SOURCE`).
3. **Đổi sheet** (spec §4.4): một state `sheet`; bấm mốc trong sheet vận động đặt thẳng `{ kind: "item", fromMotor: true }` (sheet vận động gỡ ngay, sheet nhập ngày gắn ngay); `MilestoneSheet` đóng thì đặt lại `{ kind: "motor" }` nếu `fromMotor`, ngược lại `null`.
4. **Test màn** (spec §5 không liệt kê; plan thêm): bé sinh `2026-06-27`, đồng hồ giả `2026-11-27T05:00:00Z` (153 ngày, 5,03 tháng); dữ liệu đặt sẵn bằng `client.setQueryData(milestonesKey("b1"), rows)`; không đặt thì `marks.data` là `undefined` (trường hợp "chưa có dữ liệu"). `useOutboxEntries` chỉ chạy trong `useEffect`, nên lúc vẽ tĩnh trả về mảng rỗng.
5. **Dòng tóm tắt "Vận động lớn"** chỉ render khi đã có dữ liệu (spec §3.2, §4.2).
6. **Trang fixture** vẽ `MotorSheetBody` trong một khung `glass-strong` thường, không phải `<dialog>` thật (chỉ một `<dialog>` mở được một lúc); sheet thật được xem trên trang thật ở Task 2 Step 6. Fixture có 4 bé: 0,5 / 5 / 13 / 30 tháng; mỗi mốc đã qua thiếu đúng mục cuối; mốc hiện tại đạt mục đầu; mốc vận động trễ ở 13 tháng ("đứng có đỡ") và 30 tháng ("tự đi"); một dòng chờ đồng bộ; tên bé dài "Bun Nguyễn Minh Khang".
7. **Nền để đo tương phản** (spec §6 mục 2): kính phủ trên `--color-bg` của theme, không phải chỗ có đốm màu `blob`, không tính blur; cùng cách đo của Bước 40. Nếu một số đo dưới 4.5:1 thì **dừng, ghi số, hỏi người dùng**: không tự thêm token hay đổi màu ngoài spec.

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
    on' docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-c.md
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
- **Trình duyệt.** Theo `~/.claude/CLAUDE.md` của người dùng, mặc định là Claude in Chrome (`mcp__claude-in-chrome__*`): `tabs_context_mcp` trước, rồi mở tab mới bằng `tabs_create_mcp`, không dùng tab sẵn có của họ; cửa sổ Chrome không hẹp hơn 455 px, nên đo ở 455 thay cho 375 và ghi rõ. Khung Browser trong app (`mcp__Claude_Browser__*`, cỡ 375×812 bằng `resize_window` preset `mobile`) chỉ dùng khi người dùng chọn nó ở câu hỏi của Task 2 Step 3. Gọi `navigate` trước, rồi `resize_window`. Trang fixture vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt khi xong. Bỏ phần tử `nextjs-portal` (huy hiệu dev) trước khi chụp. Bấm theo `ref` của `find`. Lọc console bằng `onlyErrors`, so số lỗi trước và sau một lần tải mới.
- **Chỉ xem trên trang thật.** Trên `/phat-trien` thật chỉ được bấm tiêu đề mốc, dòng "Vận động lớn", một mốc trong sheet đó (rồi đóng sheet nhập ngày bằng Esc hoặc nút Đóng, **không** bấm Lưu), dòng "Khi nào nên hỏi bác sĩ" và nút Đóng của các sheet. Không bấm dòng mốc nào trong dòng thời gian rồi lưu, không "Bỏ đánh dấu".
- **Không push nếu người dùng chưa đồng ý** ở Task 2 Step 9.

## Contracts with Other Plans

**Consumes:**

- Plan A: `defaultOpenMonths`, `motorSummary`, `timelineSteps`, `ageInMonths` (`lib/rules/milestones.ts`); `MotorMilestone.short`.
- Plan B: `MilestoneTimeline`, `MotorSheet`, `MotorSheetBody`, `AskDoctorSheet` (chữ ký ở Contracts của plan B).
- `main`: `MilestoneSheet`, `PageHeader`, `ErrorCard`, `Icon`, `useMilestones`, `milestonesKey` (`lib/data/outbox.ts`), `entriesFor`, `pendingRowIds`, `useOutboxEntries`, `ageDays`, `formatAgeVi`.

**Produces:** màn `/phat-trien` mới; `visibleGroups` không còn. **Vitest sau plan C:** `Test Files  223 passed (223)`, `Tests  2167 passed (2167)`.

---

### Task 1: Màn Mốc phát triển ghép dòng thời gian và hai sheet (spec §4.1, §4.2, §4.4, §4.6)

**Files:**

- Modify: `components/milestones/MilestonesScreen.tsx` (viết lại phần thân)
- Modify: `lib/rules/milestones.ts` (xóa `visibleGroups`)
- Modify: `lib/rules/milestones.test.ts` (xóa test của `visibleGroups`)
- Test: `components/milestones/milestonesscreen.test.tsx`

**Interfaces:**

- Consumes: như Contracts.
- Produces: `MilestonesScreen({ baby, userId, isOwner })` (chữ ký không đổi; `app/phat-trien/page.tsx` không sửa).

- [x] **Step 0: Kiểm plan B đã xong**

Run: `git log --oneline -8 && bunx vitest run`
Expected: 8 commit trên cùng là của plan A và B (`feat(milestones): the Vận động lớn and ask-a-doctor sheets` đứng đầu); `Test Files  222 passed (222)`, `Tests  2165 passed (2165)`.

- [x] **Step 1: Viết test đỏ (Patch 1)**

Test màn phủ: nút về `/suc-khoe`; dòng "Vận động lớn" có `aria-haspopup="dialog"` và tóm tắt "Đã lật · đang tới tuổi ngồi, đứng có đỡ"; "Còn 1 mốc chưa đạt · nên hỏi bác sĩ"; mốc 4 tháng mở, "Bun đang ở đây · đạt 0/13"; dòng "Khi nào nên hỏi bác sĩ"; câu nguồn, link CDC của mốc 4 tháng, link WHO của `ngoi`; không còn đoạn giới thiệu, "Xem tất cả các mốc", "Nguồn: CDC", "Mốc vận động lớn", không `<dialog>` nào lúc đầu; khi chưa có dữ liệu không có tóm tắt và không có chữ cam. Patch này cũng xóa test của `visibleGroups`.

```diff
diff --git a/components/milestones/milestonesscreen.test.tsx b/components/milestones/milestonesscreen.test.tsx
new file mode 100644
index 0000000..35896de
--- /dev/null
+++ b/components/milestones/milestonesscreen.test.tsx
@@ -0,0 +1,92 @@
+import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import { renderToStaticMarkup } from "react-dom/server";
+import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
+import { MILESTONES } from "@/lib/content/milestones";
+import { milestonesKey } from "@/lib/data/outbox";
+import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
+import { MilestonesScreen } from "./MilestonesScreen";
+
+// Bun is 5 months old on 2026-11-27 (153 days).
+const baby = {
+  id: "b1",
+  family_id: "f1",
+  name: "Bun",
+  dob: "2026-06-27",
+} as Baby;
+const group = (months: number) =>
+  MILESTONES.groups.find((g) => g.months === months)!;
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
+const render = (rows?: MilestoneRow[]) => {
+  const client = new QueryClient();
+  if (rows) client.setQueryData(milestonesKey("b1"), rows);
+  return renderToStaticMarkup(
+    <QueryClientProvider client={client}>
+      <MilestonesScreen baby={baby} userId="u1" isOwner />
+    </QueryClientProvider>,
+  );
+};
+
+beforeEach(() => {
+  vi.useFakeTimers();
+  vi.setSystemTime(new Date("2026-11-27T05:00:00Z"));
+});
+afterEach(() => vi.useRealTimers());
+
+describe("MilestonesScreen (spec 2026-11-27 §4.1)", () => {
+  const loaded = [
+    ...group(2)
+      .items.slice(0, -1)
+      .map((i) => row(i.code)),
+    row("lat"),
+  ];
+
+  it("has the motor row, the timeline, the ask-a-doctor row and the sources", () => {
+    const html = render(loaded);
+    expect(html).toContain('href="/suc-khoe"');
+    expect(html).toMatch(
+      /aria-haspopup="dialog"[^>]*>.*Vận động lớn.*Đã lật · đang tới tuổi ngồi, đứng có đỡ/,
+    );
+    expect(html).toContain("Còn 1 mốc chưa đạt · nên hỏi bác sĩ");
+    expect(html).toContain('aria-expanded="true" aria-controls="ms-4"');
+    expect(html).toContain("Bun đang ở đây · đạt 0/13");
+    expect(html).toMatch(
+      /aria-haspopup="dialog"[^>]*>.*Khi nào nên hỏi bác sĩ/,
+    );
+    expect(html).toContain("Theo CDC và WHO, không thay cho khám sàng lọc.");
+    expect(html).toContain(`href="${group(4).source}"`);
+    expect(html).toContain(">Nguồn CDC</a>");
+    expect(html).toContain(
+      `href="${MILESTONES.motor.find((m) => m.code === "ngoi")!.source}"`,
+    );
+    expect(html).toContain(">Nguồn WHO</a>");
+  });
+
+  it("drops the intro, the per-month cards and the show-all button", () => {
+    const html = render(loaded);
+    expect(html).not.toContain(MILESTONES.intro);
+    expect(html).not.toContain("Xem tất cả các mốc");
+    expect(html).not.toContain("Nguồn: CDC");
+    expect(html).not.toContain("Mốc vận động lớn");
+    expect(html).not.toContain("<dialog");
+  });
+
+  it("shows no summary and no orange before the marks load", () => {
+    const html = render();
+    expect(html).not.toContain("Đã lật");
+    expect(html).not.toContain("chưa đạt");
+    expect(html).not.toContain("đang ở đây");
+    expect(html).not.toContain('text-warn"');
+    expect(html).toContain('aria-expanded="true" aria-controls="ms-4"');
+  });
+});
diff --git a/lib/rules/milestones.test.ts b/lib/rules/milestones.test.ts
index 07074a5..49ab2ca 100644
--- a/lib/rules/milestones.test.ts
+++ b/lib/rules/milestones.test.ts
@@ -1,9 +1,5 @@
 import { describe, expect, it } from "vitest";
-import {
-  MILESTONES,
-  type MilestoneGroup,
-  type MotorMilestone,
-} from "@/lib/content/milestones";
+import { MILESTONES, type MotorMilestone } from "@/lib/content/milestones";
 import {
   ageInMonths,
   defaultOpenMonths,
@@ -14,23 +10,8 @@ import {
   motorSummary,
   parseMilestoneForm,
   timelineSteps,
-  visibleGroups,
 } from "./milestones";
 
-const group = (months: number) => ({ months }) as MilestoneGroup;
-const groups = [2, 4, 6, 9, 12].map(group);
-
-describe("visibleGroups (spec §6.9)", () => {
-  it("shows the current age group and the next one", () => {
-    const at = (m: number) => visibleGroups(groups, m).map((g) => g.months);
-    expect(at(0.5)).toEqual([2, 4]);
-    expect(at(2)).toEqual([2, 4]);
-    expect(at(3.9)).toEqual([2, 4]);
-    expect(at(4)).toEqual([4, 6]);
-    expect(at(13)).toEqual([12]);
-  });
-});
-
 describe("motorStatus", () => {
   const sitting = {
     code: "ngoi",
```

- [x] **Step 2: Chạy, thấy đỏ**

Run: `bunx vitest run components/milestones/milestonesscreen.test.tsx; bunx vitest run`
Expected: file test `Tests  3 failed (3)`; cả bộ `Test Files  1 failed | 222 passed (223)`, `Tests  3 failed | 2164 passed (2167)`. `tsc --noEmit` sạch.

- [x] **Step 3: Commit test**

```bash
git add components/milestones/milestonesscreen.test.tsx lib/rules/milestones.test.ts
git commit -m "test(milestones): the screen shows the timeline" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 4: Viết lại màn, xóa `visibleGroups` (Patch 2)**

```diff
diff --git a/components/milestones/MilestonesScreen.tsx b/components/milestones/MilestonesScreen.tsx
index 2886813..92404f3 100644
--- a/components/milestones/MilestonesScreen.tsx
+++ b/components/milestones/MilestonesScreen.tsx
@@ -1,9 +1,8 @@
 "use client";
 
 import { useState } from "react";
-import { Button } from "@/components/ui/Button";
 import { ErrorCard } from "@/components/ui/ErrorCard";
-import { ListGroup } from "@/components/ui/ListGroup";
+import { Icon } from "@/components/ui/Icon";
 import { PageHeader } from "@/components/ui/PageHeader";
 import { MILESTONES } from "@/lib/content/milestones";
 import { toVietnameseError } from "@/lib/data/errors";
@@ -12,21 +11,26 @@ import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
 import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
 import {
   ageInMonths,
-  motorStatus,
-  visibleGroups,
-  type MotorState,
+  defaultOpenMonths,
+  motorSummary,
+  timelineSteps,
 } from "@/lib/rules/milestones";
-import { ageDays } from "@/lib/rules/time";
+import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
-import { MilestoneItem } from "./MilestoneItem";
+import { cx } from "@/lib/ui/cx";
+import { AskDoctorSheet } from "./AskDoctorSheet";
 import { MilestoneSheet } from "./MilestoneSheet";
+import { MilestoneTimeline } from "./MilestoneTimeline";
+import { MotorSheet } from "./MotorSheet";
 
-const STATE_CLASS: Record<MotorState, string> = {
-  done: "bg-good-soft text-good-ink",
-  early: "bg-muted/15 text-ink",
-  window: "bg-accent-tint text-accent-text",
-  late: "bg-warn-soft text-warn-ink",
-};
+// Spec 2026-11-27 §4.4: one sheet at a time. An item opened from the motor
+// sheet goes back to it when it closes.
+type OpenSheet =
+  | { kind: "motor" }
+  | { kind: "askDoctor" }
+  | { kind: "item"; code: string; title: string; fromMotor: boolean };
+
+const WHO_SOURCE = MILESTONES.motor.find((m) => m.code === "ngoi")!.source;
 
 export function MilestonesScreen({
   baby,
@@ -41,32 +45,25 @@ export function MilestonesScreen({
   const pending = pendingRowIds(
     entriesFor(useOutboxEntries(userId), "milestones_achieved"),
   );
-  const months = ageInMonths(ageDays(baby.dob, new Date()));
-  const [showAll, setShowAll] = useState(false);
-  const [open, setOpen] = useState<{ code: string; title: string } | null>(
-    null,
+  const now = new Date();
+  const months = ageInMonths(ageDays(baby.dob, now));
+  const groups = MILESTONES.groups;
+  const [openMonths, setOpenMonths] = useState<number | null>(() =>
+    defaultOpenMonths(groups, months),
   );
+  const [sheet, setSheet] = useState<OpenSheet | null>(null);
   const byCode = new Map((marks.data ?? []).map((m) => [m.milestone_code, m]));
-  const groups = showAll
-    ? MILESTONES.groups
-    : visibleGroups(MILESTONES.groups, months);
+  const loaded = marks.data !== undefined;
+  const achieved = new Set(byCode.keys());
+  const steps = timelineSteps(groups, months, achieved, loaded, baby.name);
+  const motor = motorSummary(MILESTONES.motor, months, achieved);
   const canEdit = (row: MilestoneRow | undefined) =>
     !row || isOwner || row.created_by === userId;
-
-  const item = (code: string, title: string, extra?: React.ReactNode) => {
-    const row = byCode.get(code);
-    return (
-      <MilestoneItem
-        key={code}
-        title={title}
-        row={row}
-        pending={pending.has(code)}
-        disabled={!canEdit(row)}
-        extra={extra}
-        onOpen={() => setOpen({ code, title })}
-      />
-    );
-  };
+  // §4.5, §4.6: the baby's current group, or the first one for a newborn.
+  const current = groups.find(
+    (g) => g.months === defaultOpenMonths(groups, months),
+  )!;
+  const cdcGroup = groups.find((g) => g.months === openMonths) ?? current;
 
   return (
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
@@ -74,74 +71,120 @@ export function MilestonesScreen({
         title={MILESTONES.title}
         back={{ href: "/suc-khoe", label: "Sức khỏe" }}
       />
-      <p className="px-1 text-[15px] text-muted">{MILESTONES.intro}</p>
       {marks.isError && !marks.data && (
         <ErrorCard
           message={toVietnameseError(marks.error)}
           onRetry={() => void marks.refetch()}
         />
       )}
-      <ListGroup title="Mốc vận động lớn">
-        {MILESTONES.motor.map((m) => {
-          const status = motorStatus(m, months, byCode.has(m.code));
-          return item(
-            m.code,
-            m.name,
-            status.state === "done" ? null : (
-              <span
-                className={`mt-1 self-start rounded-full px-2 text-[13px] font-semibold ${STATE_CLASS[status.state]}`}
-              >
-                {status.text}
+      <ul className="glass overflow-hidden rounded-[22px]">
+        <li>
+          <button
+            type="button"
+            aria-haspopup="dialog"
+            onClick={() => setSheet({ kind: "motor" })}
+            className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left"
+          >
+            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-text">
+              <Icon name="star" size={18} />
+            </span>
+            <span className="flex min-w-0 flex-1 flex-col">
+              <span className="text-base font-semibold text-ink">
+                Vận động lớn
               </span>
-            ),
-          );
-        })}
-      </ListGroup>
-      {groups.map((group) => (
-        <section key={group.months} className="flex flex-col gap-3">
-          <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
-            Mốc {group.months} tháng
-          </h2>
-          {(["social", "language", "cognitive", "movement"] as const).map(
-            (domain) => {
-              const list = group.items.filter((i) => i.domain === domain);
-              if (list.length === 0) return null;
-              return (
-                <ListGroup key={domain} title={MILESTONES.domains[domain]}>
-                  {list.map((i) => item(i.code, i.text))}
-                </ListGroup>
-              );
-            },
-          )}
-          <div className="rounded-[22px] bg-warn-soft p-4 text-[15px] text-warn-ink">
-            <p className="font-semibold">Khi nào nên hỏi bác sĩ</p>
-            <ul className="mt-1 list-disc pl-5">
-              {group.askDoctor.map((line) => (
-                <li key={line}>{line}</li>
-              ))}
-            </ul>
-          </div>
+              {loaded && (
+                <span
+                  className={cx(
+                    "text-[13px]",
+                    motor.tone === "warn"
+                      ? "font-semibold text-warn"
+                      : "text-muted",
+                  )}
+                >
+                  {motor.text}
+                </span>
+              )}
+            </span>
+            <Icon name="chevronRight" size={16} className="text-muted" />
+          </button>
+        </li>
+      </ul>
+      <MilestoneTimeline
+        steps={steps}
+        openMonths={openMonths}
+        domains={MILESTONES.domains}
+        byCode={byCode}
+        pending={pending}
+        canEdit={canEdit}
+        onToggle={(m) => setOpenMonths(openMonths === m ? null : m)}
+        onOpenItem={(code, title) =>
+          setSheet({ kind: "item", code, title, fromMotor: false })
+        }
+      />
+      <button
+        type="button"
+        aria-haspopup="dialog"
+        onClick={() => setSheet({ kind: "askDoctor" })}
+        className="flex min-h-[52px] w-full items-center gap-3 rounded-[22px] bg-warn-soft px-4 py-2.5 text-warn-ink"
+      >
+        <Icon name="alert" size={20} />
+        <span className="flex-1 text-left font-semibold">
+          Khi nào nên hỏi bác sĩ
+        </span>
+        <Icon name="chevronRight" size={16} />
+      </button>
+      <div className="flex flex-col">
+        <p className="px-1 text-[13px] text-muted">
+          Theo CDC và WHO, không thay cho khám sàng lọc.
+        </p>
+        <div className="flex gap-4 px-1">
+          <a
+            href={cdcGroup.source}
+            target="_blank"
+            rel="noreferrer"
+            className="inline-flex min-h-11 items-center text-[13px] text-muted underline"
+          >
+            Nguồn CDC
+          </a>
           <a
-            href={group.source}
+            href={WHO_SOURCE}
             target="_blank"
             rel="noreferrer"
-            className="inline-flex min-h-11 items-center px-1 text-[13px] text-muted underline"
+            className="inline-flex min-h-11 items-center text-[13px] text-muted underline"
           >
-            Nguồn: CDC
+            Nguồn WHO
           </a>
-        </section>
-      ))}
-      <Button variant="secondary" block onClick={() => setShowAll(!showAll)}>
-        {showAll ? "Chỉ xem tháng hiện tại và kế tiếp" : "Xem tất cả các mốc"}
-      </Button>
-      {open && (
+        </div>
+      </div>
+      {sheet?.kind === "motor" && (
+        <MotorSheet
+          motor={MILESTONES.motor}
+          ageMonths={months}
+          ageText={formatAgeVi(baby.dob, now)}
+          babyName={baby.name}
+          byCode={byCode}
+          pending={pending}
+          canEdit={canEdit}
+          onPick={(code, title) =>
+            setSheet({ kind: "item", code, title, fromMotor: true })
+          }
+          onClose={() => setSheet(null)}
+        />
+      )}
+      {sheet?.kind === "askDoctor" && (
+        <AskDoctorSheet
+          lines={current.askDoctor}
+          onClose={() => setSheet(null)}
+        />
+      )}
+      {sheet?.kind === "item" && (
         <MilestoneSheet
-          code={open.code}
-          title={open.title}
-          row={byCode.get(open.code) ?? null}
+          code={sheet.code}
+          title={sheet.title}
+          row={byCode.get(sheet.code) ?? null}
           baby={baby}
           userId={userId}
-          onClose={() => setOpen(null)}
+          onClose={() => setSheet(sheet.fromMotor ? { kind: "motor" } : null)}
         />
       )}
     </main>
diff --git a/lib/rules/milestones.ts b/lib/rules/milestones.ts
index 7dd06e3..3283460 100644
--- a/lib/rules/milestones.ts
+++ b/lib/rules/milestones.ts
@@ -4,18 +4,6 @@ const DAYS_PER_MONTH = 30.4375;
 
 export const ageInMonths = (ageDays: number) => ageDays / DAYS_PER_MONTH;
 
-// Spec §6.9: show the current age group and the next one.
-export function visibleGroups(
-  groups: MilestoneGroup[],
-  ageMonths: number,
-): MilestoneGroup[] {
-  let current = 0;
-  groups.forEach((group, index) => {
-    if (group.months <= ageMonths) current = index;
-  });
-  return groups.slice(current, current + 2);
-}
-
 export type MotorState = "done" | "early" | "window" | "late";
 
 const months = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
```

- [x] **Step 5: Chạy, thấy xanh**

Run: `bunx vitest run components/milestones lib/rules/milestones.test.ts components/nav && bun run typecheck && bunx vitest run`
Expected: các file trên xanh (gồm `components/nav/backlinks.test.tsx`); `tsc --noEmit` không báo lỗi; cả bộ `Test Files  223 passed (223)`, `Tests  2167 passed (2167)`.

- [x] **Step 6: Commit**

```bash
git add components/milestones/MilestonesScreen.tsx lib/rules/milestones.ts
git commit -m "feat(milestones): the screen shows the timeline" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Kiểm cuối, trình duyệt, checklist, rồi hỏi trước khi lên `main` (spec §6, §7)

**Files:**

- Create (tạm, không commit): `app/chk/page.tsx`
- Modify: `docs/device-checklist.md` (thêm Bước 41 ở cuối)
- Commit cuối (khi người dùng đồng ý): spec, ba file plan, checklist

**Interfaces:**

- Consumes: mọi thứ của plan A, B và Task 1.
- Produces: không có code mới.

- [x] **Step 1: Chạy cả bộ kiểm và build**

Run: `bun run typecheck && bunx vitest run && bun run build`
Expected: `tsc --noEmit` sạch; `Test Files  223 passed (223)`, `Tests  2167 passed (2167)`; build thoát 0 (chạy lại nếu dừng ở `SecurityFatalError`), có `Generating static pages … (42/42)` và dòng `├ ○ /phat-trien`.

- [x] **Step 2: Tạo trang fixture tạm (Patch 3)**

Trang này **không commit**. Nó vẽ bốn bé (Diễn giải 6), mỗi bé một khối `data-case`, trong đó khung sheet có `data-sheet`.

```diff
diff --git a/app/chk/page.tsx b/app/chk/page.tsx
new file mode 100644
index 0000000..83e2c47
--- /dev/null
+++ b/app/chk/page.tsx
@@ -0,0 +1,99 @@
+"use client";
+
+// Temporary fixture for the browser check of spec 2026-11-27 §6. Not committed.
+import { useState } from "react";
+import { MilestoneTimeline } from "@/components/milestones/MilestoneTimeline";
+import { MotorSheetBody } from "@/components/milestones/MotorSheet";
+import { MILESTONES } from "@/lib/content/milestones";
+import { defaultOpenMonths, timelineSteps } from "@/lib/rules/milestones";
+import type { MilestoneRow } from "@/lib/supabase/rows";
+
+const row = (code: string) =>
+  ({
+    id: `r-${code}`,
+    baby_id: "b1",
+    milestone_code: code,
+    achieved_on: "2026-11-12",
+    note: code === "lat" ? "Lật lần đầu trên giường của bà" : null,
+    photo_id: code === "lat" ? "p1" : null,
+    created_by: "u1",
+    created_at: "2026-11-12T00:00:00.000Z",
+  }) as MilestoneRow;
+
+// Each case: every group before the current one misses its last item; the
+// motor milestones reached are listed (13 and 30 months have a late one).
+const CASES = [
+  { age: 0.5, ageText: "15 ngày", motor: [] as string[] },
+  { age: 5, ageText: "5 tháng 1 ngày", motor: ["lat"] },
+  { age: 13, ageText: "13 tháng", motor: ["lat", "ngoi"] },
+  {
+    age: 30,
+    ageText: "30 tháng",
+    motor: MILESTONES.motor.map((m) => m.code).filter((c) => c !== "tu_di"),
+  },
+];
+
+function Case({ age, ageText, motor }: (typeof CASES)[number]) {
+  const groups = MILESTONES.groups;
+  const [open, setOpen] = useState<number | null>(
+    defaultOpenMonths(groups, age),
+  );
+  const done = [
+    ...groups
+      .filter((g) => g.months <= age)
+      .flatMap((g, i, list) =>
+        (i < list.length - 1 ? g.items.slice(0, -1) : g.items.slice(0, 1)).map(
+          (it) => it.code,
+        ),
+      ),
+    ...motor,
+  ];
+  const byCode = new Map(done.map((c) => [c, row(c)]));
+  const pending = new Set([done[0] ?? "lat"]);
+  return (
+    <section className="flex flex-col gap-3" data-case={age}>
+      <h2 className="px-1 text-xl font-bold text-ink">Bé {age} tháng</h2>
+      <MilestoneTimeline
+        steps={timelineSteps(
+          groups,
+          age,
+          new Set(done),
+          true,
+          "Bun Nguyễn Minh Khang",
+        )}
+        openMonths={open}
+        domains={MILESTONES.domains}
+        byCode={byCode}
+        pending={pending}
+        canEdit={() => true}
+        onToggle={(m) => setOpen(open === m ? null : m)}
+        onOpenItem={() => {}}
+      />
+      <div
+        className="glass-strong -mx-2 rounded-[38px] px-5 py-4"
+        data-sheet={age}
+      >
+        <MotorSheetBody
+          motor={MILESTONES.motor}
+          ageMonths={age}
+          ageText={ageText}
+          babyName="Bun"
+          byCode={byCode}
+          pending={pending}
+          canEdit={() => true}
+          onPick={() => {}}
+        />
+      </div>
+    </section>
+  );
+}
+
+export default function Page() {
+  return (
+    <main className="mx-auto flex max-w-md flex-col gap-10 px-4 pt-4 pb-32">
+      {CASES.map((c) => (
+        <Case key={c.age} {...c} />
+      ))}
+    </main>
+  );
+}
```

Run: `bun run typecheck`
Expected: không báo lỗi. Khi soạn plan, trang này đã được vẽ thử bằng `renderToStaticMarkup`: 4 khối `data-case`, 4 mốc đang mở, 12 tóm tắt `text-warn`, 2 chip "Nên hỏi bác sĩ".

- [x] **Step 3: Hỏi dùng trình duyệt nào, rồi chạy dev**

Hỏi người dùng một câu: Chrome (mặc định theo CLAUDE.md của họ) hay khung Browser trong app. Rồi `bun run dev` chạy nền (chạy lại nếu dừng ở `SecurityFatalError`), `navigate` tới `http://localhost:3000/chk`, đặt cỡ (375 px ở khung trong app; 455 px ở Chrome), đọc `innerWidth`.

- [x] **Step 4: Đo trên trang fixture, theme `rose`, rồi `lavender`, `dark`, `night`**

Đặt `document.documentElement.dataset.theme = '<theme>'` (giữ bằng `MutationObserver` nếu sau 21:00), chờ 1 giây, chạy script đo dưới đây trong trang:

```js
(() => {
  const ctx = document.createElement("canvas").getContext("2d");
  const rgba = (c) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top, base) => [0, 1, 2].map((i) => top[i] * top[3] + base[i] * (1 - top[3])).concat(1);
  const lum = (c) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  // Backgrounds from <html> down to the element, over --color-bg (no blobs, no blur).
  const background = (el) => {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.unshift(getComputedStyle(e).backgroundColor);
    let base = rgba(getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim());
    for (const c of chain) base = over(rgba(c), base);
    return base;
  };
  const min = (selector) => {
    const list = [...document.querySelectorAll(selector)].map((el) => {
      const bg = background(el);
      return ratio(over(rgba(getComputedStyle(el).color), bg), bg);
    });
    return list.length ? +Math.min(...list).toFixed(2) : "none";
  };
  const chips = [...document.querySelectorAll("[data-sheet] span.whitespace-nowrap.rounded-full")];
  const rows = [...document.querySelectorAll("[data-sheet] li > button")];
  return {
    width: innerWidth,
    theme: document.documentElement.dataset.theme,
    warnSummary: min("ol span.text-warn"),
    laterTitle: min("ol span.font-bold.text-muted"),
    mutedSummary: min("ol button span.text-\\[13px\\].text-muted"),
    domainTitle: min("ol h3"),
    earlyChip: min('[data-sheet] span[class*="bg-ink/7"].whitespace-nowrap'),
    chipsOneLine: chips.every((c) => c.getClientRects().length === 1 && c.getBoundingClientRect().height <= 23),
    nameNotUnderChip: rows.every((b) => {
      const [name, chip] = b.querySelectorAll(":scope > span:first-child > span:nth-child(2), :scope > span:first-child > span:nth-child(3)");
      return name.getBoundingClientRect().right <= chip.getBoundingClientRect().left + 0.5;
    }),
    ellipsis: [...document.querySelectorAll("main *")].filter((e) => getComputedStyle(e).textOverflow === "ellipsis").length,
    smallestHeaderButton: Math.min(...[...document.querySelectorAll("ol button[aria-expanded]")].map((b) => b.getBoundingClientRect().height)),
  };
})();
```

Expected, ở cả bốn theme: `warnSummary`, `laterTitle`, `mutedSummary`, `domainTitle`, `earlyChip` đều ≥ 4.5; `chipsOneLine` `true`; `nameNotUnderChip` `true`; `ellipsis` 0; `smallestHeaderButton` ≥ 44. Nếu dùng Chrome thì số đo là ở 455 px, không phải 375 px: ghi rõ trong kết quả là 375 px chưa được đo. Chụp một hình mỗi theme (bé 13 tháng: mốc cam và sheet có chip "Nên hỏi bác sĩ"). Ở `night`, hình chụp phải phân biệt được mốc mở/gập bằng mũi tên và mốc thiếu bằng dấu "!". Số nào dưới 4.5: dừng, ghi số, hỏi người dùng (Diễn giải 7).

- [x] **Step 5: Lặp Step 4 ở 390 px, theme `rose`**

Đặt cỡ 390×844 (`resize_window` width 390 height 844), đọc `innerWidth` = 390, chạy lại script. Expected: như Step 4. Thêm: bấm tiêu đề "Mốc 6 tháng" của bé 5 tháng; Expected: mốc 6 mở, mốc 4 gập (mũi tên đổi chiều).

- [x] **Step 6: Kiểm trên trang thật, chỉ xem**

`navigate` tới `http://localhost:3000/phat-trien` (đăng nhập nếu cần, do người dùng tự làm). Đếm lỗi console (`onlyErrors`) trước. Expected:

1. Không còn đoạn giới thiệu; có dòng "Vận động lớn" với tóm tắt; mốc của tháng bé đang ở mở sẵn, các mốc khác gập.
2. Bấm tiêu đề một mốc khác: mốc đó mở, mốc cũ gập.
3. Bấm "Vận động lớn": sheet mở, 7 mốc có chip và thanh. Bấm một mốc **chưa đạt**: sheet nhập ngày thay chỗ. Bấm Esc (chưa gõ gì nên không hỏi "Bỏ thay đổi?"): sheet "Vận động lớn" mở lại. Đóng nó bằng nút Đóng.
4. Bấm "Khi nào nên hỏi bác sĩ": sheet có 3 ý. Đóng.
5. Tải lại trang: số lỗi console không tăng.

Không bấm Lưu, không "Bỏ đánh dấu", không bấm mốc đã đạt.

- [x] **Step 7: Tắt dev, xóa fixture, kiểm lại**

```bash
rm -r app/chk
rm -rf .next/dev/types   # tsconfig gồm .next/dev/types; trang tạm đã xóa làm tsc báo thiếu module
git status --short       # chỉ còn spec và ba plan untracked
bun run typecheck        # sạch
```

- [x] **Step 8: Thêm Bước 41 vào checklist (Patch 4)**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index d1d0937..50c51ea 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -736,3 +736,24 @@ Kết quả: Chờ người dùng.
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 41 — Mốc phát triển theo dòng thời gian (spec 2026-11-27)
+
+Chỉ xem, không bấm Lưu, không bỏ đánh dấu mốc nào. Một máy là đủ.
+
+1. Mở tab Sức khỏe, bấm "Phát triển". Kỳ vọng: không còn đoạn giới thiệu dài; trên cùng là dòng "Vận động lớn" có ngôi sao và một dòng tóm tắt bằng tên mốc (ví dụ "Đã lật · đang tới tuổi ngồi, đứng có đỡ"), không có số; dưới là dòng thời gian 8 mốc từ "Mốc 2 tháng" tới "Mốc 24 tháng". Chỉ mốc của tháng bé đang ở mở sẵn, nút tròn của nó màu chủ đạo có số tháng. Các mốc sau mốc "Sắp tới" có tiêu đề màu nhạt. Không chữ nào bị cắt "…".
+2. Bấm tiêu đề một mốc đang gập. Kỳ vọng: mốc đó mở thành một thẻ chia nhóm "Xã hội, cảm xúc", "Ngôn ngữ, giao tiếp", "Nhận thức", "Vận động", mỗi nhóm một chấm màu; mốc đang mở trước đó gập lại; mũi tên đổi chiều. Bấm lại tiêu đề vừa mở. Kỳ vọng: gập, không mốc nào mở.
+3. Nhìn các mốc đã qua. Kỳ vọng: mốc đạt đủ có nút xanh với dấu tick và "Đạt đủ … mốc"; mốc còn thiếu có nút cam "!" và chữ cam "Còn … mốc chưa đạt · nên hỏi bác sĩ".
+4. Bấm dòng "Vận động lớn". Kỳ vọng: sheet "Vận động lớn" trượt lên, dòng đầu "{tên bé} hôm nay: …", 7 mốc; mỗi mốc có một chip ngắn không xuống dòng ("Đạt dd/mm/yyyy", "Đang tới tuổi", "Sắp tới" hoặc "Nên hỏi bác sĩ"), một thanh màu và một vạch đen "hôm nay"; dưới cùng nhãn "0", "6", "12", "18 tháng".
+5. Trong sheet đó bấm một mốc chưa đạt. Kỳ vọng: sheet nhập ngày đạt thay chỗ ngay. Bấm nút Đóng (không Lưu). Kỳ vọng: sheet "Vận động lớn" mở lại. Đóng nó.
+6. Bấm dòng cam "Khi nào nên hỏi bác sĩ" cuối màn. Kỳ vọng: sheet cùng tên có 3 ý. Đóng. Bấm "Nguồn CDC" rồi "Nguồn WHO". Kỳ vọng: mỗi link mở trang nguồn ở tab mới.
+7. Bật Ban đêm. Kỳ vọng: chữ cam, tiêu đề mốc nhạt, tiêu đề nhóm và chip "Sắp tới" đều đọc được; mốc mở và mốc gập phân biệt được bằng mũi tên. Tắt Ban đêm.
+8. Bật VoiceOver, vuốt tới tiêu đề một mốc. Kỳ vọng: đọc "Mốc … tháng", dòng tóm tắt, là nút, và "thu gọn" hoặc "mở rộng" đúng trạng thái. Mở sheet "Vận động lớn", vuốt tới một mốc. Kỳ vọng: đọc tên mốc, chip và "Thường trong khoảng … tháng". Tắt VoiceOver.
+
+Kết quả: Chờ người dùng.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

Run: `git diff --stat`
Expected: `docs/device-checklist.md | 21 +++++++++++++++++++++`.

- [x] **Step 9: Ghi kết quả vào ba file plan, hỏi người dùng trước khi commit docs và lên `main`**

Đánh dấu `[x]` các bước đã làm và ghi số đo thật vào ba file plan (bằng script, không Edit/Write; khối `diff` phải còn áp ngược sạch: `git apply -R --check` cho Patch 1–4 của plan A, Patch 1–4 của plan B, và Patch 1, 2, 4 của plan C; Patch 3 của plan C là trang fixture đã xóa nên không áp ngược được; `kb_patch` của mỗi file đọc đúng file của nó, nên đổi đường dẫn file trong hàm khi kiểm plan khác). Rồi hỏi người dùng một câu: commit spec, ba plan và Bước 41 rồi đưa nhánh lên `main` (fast-forward rồi push), hay để lại trên nhánh. Chỉ làm khi họ đồng ý:

```bash
git add docs/device-checklist.md docs/blueprint/specs/2026-11-27-kim-bun-moc-phat-trien-dong-thoi-gian-design.md docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-a.md docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-b.md docs/blueprint/plans/2026-11-27-kim-bun-moc-phat-trien-c.md
git commit -m "docs: Mốc phát triển timeline, spec, plans and step 41 of the device checklist" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-moc-phat-trien
git push origin main
```

Expected: `git merge --ff-only` không báo lỗi (nếu `main` đã đi tiếp thì dừng và hỏi); push thành công; `git rev-parse --short main` và `git rev-parse --short origin/main` (chạy riêng từng lệnh) cho cùng một mã.

## Kết quả thực thi (2026-11-27)

- Task 1 Step 0: 8 commit plan A, B trên đầu (`7b1f860` đứng đầu); `222 passed (222)` / `2165 passed (2165)`.
- Task 1: Patch 1 áp sạch; đỏ `Tests  3 failed (3)`, cả bộ `Test Files  1 failed | 222 passed (223)`, `Tests  3 failed | 2164 passed (2167)`, typecheck sạch; commit `aa2089a`. Patch 2 áp sạch; `components/milestones lib/rules/milestones.test.ts components/nav` = `Test Files  9 passed (9)`, `Tests  63 passed (63)`; typecheck sạch; cả bộ `223 passed (223)` / `2167 passed (2167)`; commit `2ff4047`.
- Task 2 Step 1: typecheck sạch; `Test Files  223 passed (223)`, `Tests  2167 passed (2167)`; `bun run build` thoát 0 ngay lần đầu, `✓ Generating static pages using 9 workers (42/42)`, `├ ○ /phat-trien`.
- Step 2: Patch 3 áp sạch, typecheck sạch.
- Step 3: người dùng chọn Chrome, nhưng Claude in Chrome không kết nối (2 lần); người dùng chọn chuyển sang khung Browser trong app. Đo ở **375 px thật** (`innerWidth` 375) và 390 px.
- Step 4 (375 px, fixture: 4 `data-case`, 4 mốc mở, 12 tóm tắt `text-warn`, 2 chip "Nên hỏi bác sĩ", 28 chip / 28 dòng sheet):

  | Theme | warnSummary | laterTitle | mutedSummary | domainTitle | earlyChip | chipsOneLine | nameNotUnderChip | ellipsis | smallestHeaderButton |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | rose | 5.42 | 5.46 | 5.46 | 5.99 | 12.17 | true | true | 0 | 44 |
  | lavender | 5.48 | 5.53 | 5.53 | 6.02 | 11.85 | true | true | 0 | 44 |
  | dark | 12.49 | 7.24 | 7.3 | 7.3 | 9.97 | true | true | 0 | 44 |
  | night | 7.35 | 5 | 5 | 5 | 5.84 | true | true | 0 | 44 |

  Mọi số ≥ 4.5. Đã chụp bé 13 tháng ở cả bốn theme; ở `night` mốc thiếu có "!" và mốc mở/gập khác nhau bằng mũi tên.
- Step 5 (390 px, `innerWidth` 390, rose): số như hàng rose ở trên. Bấm "Mốc 6 tháng" của bé 5 tháng: trước `ms-4` mở, sau chỉ `ms-6` mở, `#ms-4` biến mất, mũi tên mốc 4 xuống, mốc 6 lên.
- Step 6 (trang thật, 390 px, người dùng tự đăng nhập trong khung; theme đang là `night` vì sau 21:00): lỗi console trước = 0. (1) Không đoạn giới thiệu; dòng "Vận động lớn" có tóm tắt "Sắp tới tuổi lật"; chỉ "Mốc 2 tháng" mở ("Bun đang ở đây · đạt 11/11"). (2) Bấm "Mốc 4 tháng": chỉ `ms-4` mở, `ms-2` gập. (3) Sheet "Vận động lớn": 7 mốc, 7 thanh, chip "Sắp tới"; bấm "Ngồi không cần đỡ" (chưa đạt): còn đúng 1 `<dialog>` là sheet nhập ngày; Esc: sheet "Vận động lớn" mở lại; đóng bằng nút Đóng: 0 dialog. (4) "Khi nào nên hỏi bác sĩ": sheet có 3 ý; đóng. (5) Tải lại: lỗi console vẫn 0. Không bấm Lưu, không "Bỏ đánh dấu", không bấm mốc đã đạt.
- Step 7: dev đã tắt; `app/chk` và `.next/dev/types` đã xóa; `git status --short` chỉ còn spec và ba plan untracked; typecheck sạch.
- Step 8: Patch 4 áp sạch; `docs/device-checklist.md | 21 +++++++++++++++++++++`.
- Nhánh có 10 commit code (5 task × test + code).
- Kiểm khối `diff` áp ngược (`git apply -R --check`) trên cây cuối: A1, A2, A4, B1–B4, C1, C2, C4 sạch. A3 không áp ngược được trên cây cuối vì C1 sửa lại cùng phần đầu `lib/rules/milestones.test.ts` (đúng theo thiết kế); A3 giống hệt `git diff 0180d72 b3ad654` và áp ngược sạch lên file ở `b3ad654`.
- Step 9: người dùng chọn "Commit và push main" (2026-11-27); `main` và `origin/main` vẫn là `b1f1bdd` trước khi merge.
