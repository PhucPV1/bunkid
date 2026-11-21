# Kim Bun — UX mobile M3b: sheet "+" xếp theo ngón cái Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§5.4; câu cuối của §11.3; phần tương ứng của §11.1 và §11.2)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Sheet "+" đặt nhóm hay dùng gần ngón cái với hàng 5 nút tròn bấm giờ, mọi nhãn nằm một dòng, nút "Khác" ở Hôm nay chỉ mở nhóm "Khác", rồi cả M3 lên `main`.

**Architecture:**

- **Luật thuần** (`lib/rules/quickActions.ts`): `sheetGroups` chọn nhóm được vẽ; `actionSheetReducer` giữ trạng thái mở và nhóm đang lọc.
- **Giao diện:** `ActionSheet` vẽ nhóm `timer` bằng nút tròn như hàng Bấm giờ ở Hôm nay; `QuickActionsProvider` dùng reducer; hai nơi gọi `openActionSheet` được sửa để sự kiện click không lọt vào tham số.
- **Tài liệu:** bước 34 của `docs/device-checklist.md` tả ô timer.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m3b`, cắt từ `feat/kim-bun-ux-mobile-m3a`. Baseline: 1107 test vitest xanh (157 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a, M2b, M2c | §3 trang Hôm nay | đã xong, đã lên `main` @ `e1e729f` |
| M6 | phần còn lại của §8 Thống kê | đã xong, đã lên `main` @ `34f18f6` |
| M5a, M5b, M5c | §7 Tiêm chủng (bảng vắc xin × mũi), §9 Khám phá | đã xong, đã lên `main` @ `2448528` |
| M3a | §4 timer trong thanh tab | `2026-11-19-kim-bun-ux-mobile-m3a.md` |
| **M3b (plan này)** | §5.4 sheet "+", sửa bước 34 của checklist | `2026-11-19-kim-bun-ux-mobile-m3b.md` |
| M4 | §6 Triệu chứng, khung chờ của trang Hôm nay | chưa viết |
| Kết | §11.3 bước 36 của checklist thiết bị | làm sau cùng |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Ô tròn của timer đang chạy trong sheet** dùng `CATEGORY_RUNNING` (có quầng sáng) như `TimerButtons`. Ô tròn lúc nghỉ dùng `glass` cùng màu chữ của loại; nằm trong sheet `glass-strong` nên nó chỉ còn nền và viền, không có blur riêng.
2. **Nhãn đậm 700 khi đang chạy** chỉ áp dụng trong sheet. Hàng Bấm giờ ở Hôm nay giữ độ đậm 500 vì §3.4 ghi "không đổi".
3. **Nút bấm giờ trong sheet không bị khoá khi `busy`**, giống các ô cũ.
4. **Nhãn một dòng:** cả 13 nhãn có `whitespace-nowrap`; padding của ô không đổi. "Uống nước" rộng 63,24 px trong chỗ trống 63,25 px, nên trước đây nó xuống dòng.
5. **`groups`:** thứ tự luôn theo `QUICK_ACTION_GROUPS`; mảng rỗng thì không vẽ nhóm nào; tiêu đề sheet và tiêu đề nhóm "Khác" giữ nguyên.
6. **Nút "+" luôn mở đủ ba nhóm**, kể cả ngay sau khi vừa đóng một sheet đã lọc. Khi đóng, nhóm đang lọc được giữ tới lần mở sau để nội dung không đổi giữa lúc sheet trượt xuống.
7. **Không chặn tham số sai ở `openActionSheet`.** Việc sửa nằm ở hai nơi gọi, như spec ghi; test ghim cả hai bằng cách gọi với một sự kiện click giả.
8. **Ô 84 px không còn trạng thái đang chạy** (viền đậm, nhãn "Dừng …", nhãn "Nên bú"): chỉ timer dùng tới, mà timer giờ là nút tròn.
9. **Bước 34 của checklist:** tiêu đề giữ nguyên; mục 2 thành "chạm ô timer, về Hôm nay, bấm Dừng ở thẻ lớn, toast nằm ngay trên thanh tab".
10. **Kiểm trình duyệt** do phiên chính làm bằng khung Browser trong app ở 375×812. §11.2 yêu cầu hỏi người dùng trước mỗi phiên dùng khung này: người dùng đã chọn khung này cho phiên làm việc hiện tại (2026-11-19) và đã đăng nhập lại ở đó ngày 2026-11-21. Nếu plan được làm ở một phiên khác thì phải hỏi lại trước khi mở khung; người dùng từ chối thì ghi "chưa kiểm" cho cả Step 3.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 3** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m3b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 3 patch đã được áp lần lượt lên bản sao của `main` @ `2448528` đã có M3a, ở ngoài repo; trong bản chạy thử Task 1 là hai commit (test trước, code sau). `tsc --noEmit` sạch sau commit code; số test đỏ và xanh và tổng cả bộ ở Task 3 đều đo trên bản sao đó. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status).
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.
- **Lên `main` một lần.** M3a nằm trên nhánh cho tới khi M3b xong; `main` nhận cả hai ở cuối M3b. Lý do: phần kiểm trình duyệt của cả mốc nằm ở cuối M3b, và `main` không nhận code chưa được nhìn trên trình duyệt. Người dùng nói "plan nào xong phần nào thì commit push main luôn"; ở đây "phần" được hiểu là cả mốc M3. Báo lại điều này trong báo cáo cuối.
- **Quyền đẩy `main`.** Mục Global Constraints bên trên chép nguyên văn §2 của spec, trong đó mỗi lần đẩy `main` cần người dùng đồng ý. Với 6 mốc của spec này, lời đồng ý trước ở dòng Status thay cho việc hỏi từng lần. Mọi việc đẩy khác vẫn theo §2.

## Contracts with Other Plans

Plan này đứng ngay sau M3a và trước M4 (chưa viết).

**Consumes:**

- Từ M3a: `QUICK_ACTION_GROUPS` theo thứ tự `other`, `quick`, `timer`; `ActionChrome` không còn `TimerPill`.
- Từ M2c: `QuickLogGrid` có prop `onMore`; `HomeScreen` đang gọi `actions.openActionSheet()`.
- Từ M1: `BackfillButton` và `historyscreen.test.tsx`.

**Produces** (M4 được dựa vào đúng những tên này):

- `components/actions/QuickActions.tsx`: `openActionSheet(groups?)`, `actionSheetGroups`.
- `components/actions/ActionChrome.tsx`: dựng `TabBar` (có `timer`) và `ActionSheet`. M4 thêm việc ẩn hai thứ này ở trang Triệu chứng.
- `lib/ui/categories.ts`: `CATEGORY_TEXT`.
- **Vitest sau M3:** 1122 test, 157 file.

---

### Task 1: Sheet "+": nhóm Bấm giờ là nút tròn, nhãn một dòng, lọc theo nhóm (§5.4)

**Files:**

- Modify: `components/actions/ActionChrome.tsx`
- Modify: `components/actions/ActionSheet.tsx`
- Modify: `components/actions/QuickActions.tsx`
- Modify: `components/history/HistoryScreen.tsx`
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/TimerButtons.tsx`
- Modify: `components/nav/TabBar.tsx`
- Modify: `lib/rules/quickActions.ts`
- Modify: `lib/ui/categories.ts`
- Test: `components/actions/actionchrome.test.tsx` (sửa)
- Test: `components/actions/actionsheet.test.tsx` (sửa)
- Test: `components/history/historyscreen.test.tsx` (sửa)
- Test: `components/home/homescreen.test.tsx` (sửa)
- Test: `lib/rules/quickActions.test.ts` (sửa)
- Test: `lib/ui/categories.test.ts` (sửa)

**Interfaces:**

- Consumes: `QUICK_ACTION_GROUPS` (M3a); `CATEGORY_CHIP`, `CATEGORY_RUNNING`; `HintBadge`; `useQuickActions`; `QuickLogGrid.onMore` ở `HomeScreen` (M2c).
- Produces: `sheetGroups` và `actionSheetReducer` trong `lib/rules/quickActions.ts`; `QuickActionsValue.openActionSheet(groups?: QuickActionGroup[])` và trường `actionSheetGroups`; `ActionSheet` chỉ vẽ các nhóm được chọn; nhóm `timer` là lưới 5 cột nút tròn 58 px; `CATEGORY_TEXT` trong `lib/ui/categories.ts` (chuyển từ map `IDLE` của `TimerButtons.tsx`). `HistoryScreen` gọi `() => actions.openActionSheet()`; `HomeScreen` gọi `actions.openActionSheet(["other"])`.

- [ ] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m3b feat/kim-bun-ux-mobile-m3a
```

- [ ] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/actions/actionchrome.test.tsx b/components/actions/actionchrome.test.tsx
index eeceab6..61d012d 100644
--- a/components/actions/actionchrome.test.tsx
+++ b/components/actions/actionchrome.test.tsx
@@ -5,9 +5,20 @@ import { ToastProvider } from "@/components/ui/Toast";
 import { logsKey } from "@/lib/data/logs";
 import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
 import { ActionChrome } from "./ActionChrome";
-import { QuickActionsProvider } from "./QuickActions";
+import { QuickActionsProvider, type QuickActionsValue } from "./QuickActions";
 
 const nav = vi.hoisted(() => ({ pathname: "/nhat-ky" }));
+// Static rendering cannot press a button, so a test sets the sheet's state.
+const sheet = vi.hoisted(() => ({
+  state: null as Partial<QuickActionsValue> | null,
+}));
+vi.mock("./QuickActions", async (importOriginal) => {
+  const actual = await importOriginal<typeof import("./QuickActions")>();
+  return {
+    ...actual,
+    useQuickActions: () => ({ ...actual.useQuickActions(), ...sheet.state }),
+  };
+});
 // TabBar reads the current path; outside the Next router there is none.
 vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
 vi.mock("@/lib/hooks/useNow", () => ({
@@ -54,8 +65,12 @@ function render(logs: LogRow[] = []) {
 }
 const homeTab = (html: string) => html.split("<a ")[1];
 
+const groupTitles = (html: string) =>
+  [...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
+
 beforeEach(() => {
   nav.pathname = "/nhat-ky";
+  sheet.state = null;
 });
 
 describe("ActionChrome", () => {
@@ -107,3 +122,14 @@ describe("ActionChrome with a running timer", () => {
     expect(home).not.toContain("bg-accent-tint");
   });
 });
+
+// Spec 2026-11-19 §5.4.
+describe("ActionChrome action sheet groups", () => {
+  it("gives the sheet the groups it was opened with, all three by default", () => {
+    expect(groupTitles(render())).toEqual(["Khác", "Ghi nhanh", "Bấm giờ"]);
+    sheet.state = { actionSheetOpen: true, actionSheetGroups: ["other"] };
+    const html = render();
+    expect(html).toContain('aria-expanded="true"');
+    expect(groupTitles(html)).toEqual(["Khác"]);
+  });
+});
diff --git a/components/actions/actionsheet.test.tsx b/components/actions/actionsheet.test.tsx
index 7918d95..014fd42 100644
--- a/components/actions/actionsheet.test.tsx
+++ b/components/actions/actionsheet.test.tsx
@@ -11,48 +11,97 @@ const leftFeed: RunningLog = {
   type: "breast",
   details: { side: "left" },
 };
+const sectionsOf = (html: string) => html.split("<section").slice(1);
+const titlesOf = (html: string) =>
+  [...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
 
 describe("QuickActionGrid", () => {
-  it("draws three titled groups, each a 4-column grid of 84 px tiles", () => {
-    const html = renderToStaticMarkup(
-      <QuickActionGrid running={[]} onPick={() => {}} />,
-    );
+  const html = renderToStaticMarkup(
+    <QuickActionGrid running={[]} onPick={() => {}} />,
+  );
+
+  it("draws three titled groups: Khác and Ghi nhanh as 4-column grids of 84 px tiles", () => {
     const titles = [...html.matchAll(/<h3 class="([^"]*)">([^<]+)<\/h3>/g)];
     // Spec 2026-11-19 §5.4: the most used group sits lowest, near the thumb.
     expect(titles.map((m) => m[2])).toEqual(["Khác", "Ghi nhanh", "Bấm giờ"]);
     expect(titles[0][1]).toBe(
       "text-[13px] leading-[18px] font-semibold text-muted",
     );
-    expect(html.match(/grid grid-cols-4 gap-2/g)).toHaveLength(3);
-    const tiles = html.split("<section").slice(1);
-    expect(tiles.map((part) => part.match(/<button/g)?.length)).toEqual([
-      4, 4, 5,
-    ]);
-    expect(html.match(/h-\[84px\][^"]*rounded-\[20px\]/g)).toHaveLength(13);
-    expect(html.match(/size-\[38px\]/g)).toHaveLength(13);
-    expect(html.match(/width="20" height="20"/g)).toHaveLength(13);
-    expect(html.match(/text-xs leading-4 font-semibold/g)).toHaveLength(13);
+    const [other, quick, timers] = sectionsOf(html);
+    for (const part of [other, quick]) {
+      expect(part).toContain('<div class="grid grid-cols-4 gap-2">');
+      expect(part.match(/<button/g)).toHaveLength(4);
+      expect(part.match(/h-\[84px\][^"]*rounded-\[20px\]/g)).toHaveLength(4);
+      expect(part.match(/size-\[38px\]/g)).toHaveLength(4);
+      expect(part.match(/width="20" height="20"/g)).toHaveLength(4);
+      expect(part).not.toContain("size-[58px]");
+    }
+    expect(timers).not.toContain("h-[84px]");
     expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
     for (const icon of ["drop", "bowl", "glass", "bath", "doc"] as const)
       expect(html).toContain(`d="${ICON_PATHS[icon]}"`);
+  });
+
+  // Spec 2026-11-19 §5.4.
+  it("draws Bấm giờ as one row of five 58 px round buttons, like the home page", () => {
+    const timers = sectionsOf(html)[2];
+    expect(timers).toContain('<div class="grid grid-cols-5 gap-1">');
+    expect(timers.match(/<button/g)).toHaveLength(5);
+    expect(timers.match(/size-\[58px\]/g)).toHaveLength(5);
+    expect(timers.match(/width="24" height="24"/g)).toHaveLength(5);
+    expect(timers.match(/stroke-width="2.2"/g)).toHaveLength(5);
+    const labels = [
+      ...timers.matchAll(
+        /text-xs leading-4 font-medium whitespace-nowrap text-ink">([^<]+)</g,
+      ),
+    ].map((m) => m[1]);
+    expect(labels).toEqual(["Bú trái", "Bú phải", "Ngủ", "Hút sữa", "Nằm sấp"]);
+    expect(timers).toContain("rounded-full glass text-cat-feed");
+    expect(timers).toContain("rounded-full glass text-cat-sleep");
+    for (const icon of ["heart", "moon", "cup", "smile"] as const)
+      expect(timers).toContain(`d="${ICON_PATHS[icon]}"`);
+    expect(html).not.toContain("Dừng");
+  });
+
+  // Spec 2026-11-19 §5.4: "Uống nước" used to wrap at 375 px.
+  it("keeps every label on one line", () => {
+    expect(
+      html.match(
+        /<span class="[^"]*\bwhitespace-nowrap\b[^"]*">[^<]+<\/span><\/button>/g,
+      ),
+    ).toHaveLength(13);
+    expect(html).toContain(
+      '<span class="text-center text-xs leading-4 font-semibold whitespace-nowrap">Uống nước</span>',
+    );
     for (const action of QUICK_ACTIONS)
       expect(html).toContain(`>${action.label}</span>`);
   });
 
-  it("timer tiles carry no clock badge: the group title says it", () => {
-    const html = renderToStaticMarkup(
-      <QuickActionGrid running={[]} onPick={() => {}} />,
-    );
+  it("timer buttons carry no clock badge: the group title says it", () => {
     expect(html).not.toContain(`d="${ICON_PATHS.clock}"`);
     expect(html).not.toContain("bấm giờ");
   });
 
-  it("a running timer is outlined and reads Dừng …", () => {
-    const html = renderToStaticMarkup(
+  it("a running timer fills its circle and bolds its label; Dừng … is only read out", () => {
+    const running = renderToStaticMarkup(
       <QuickActionGrid running={[leftFeed]} onPick={() => {}} />,
     );
-    expect(html).toContain(">Dừng bú trái</span>");
-    expect(html.split("border-2 border-accent-text").length - 1).toBe(1);
+    expect(running.match(/aria-label="Dừng /g)).toHaveLength(1);
+    expect(running).toContain('aria-label="Dừng bú trái"');
+    expect(running).toContain('aria-label="Bú phải"');
+    expect(running).not.toContain(">Dừng");
+    expect(running).toContain("bg-cat-feed ring-4 ring-cat-feed/30 text-bg");
+    expect(running).toContain(
+      '<span class="text-xs leading-4 font-bold whitespace-nowrap text-ink">Bú trái</span>',
+    );
+    expect(
+      running.match(/font-bold whitespace-nowrap text-ink/g),
+    ).toHaveLength(1);
+    expect(running).toContain(
+      'font-medium whitespace-nowrap text-ink">Bú phải</span>',
+    );
+    // The old outlined 84 px tile is gone.
+    expect(running).not.toContain("border-2 border-accent-text");
   });
 
   it("reports the picked action", () => {
@@ -61,6 +110,7 @@ describe("QuickActionGrid", () => {
       QuickActionGrid({ running: [], onPick }),
       "button",
     );
+    expect(buttons).toHaveLength(13);
     // Buttons follow the sheet's group order; QUICK_ACTIONS keeps its own.
     (buttons[5].props.onClick as () => void)();
     expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[6]);
@@ -74,6 +124,45 @@ describe("QuickActionGrid", () => {
   });
 });
 
+// Spec 2026-11-19 §5.4.
+describe("QuickActionGrid groups", () => {
+  it("draws only the groups asked for", () => {
+    const html = renderToStaticMarkup(
+      <QuickActionGrid running={[]} onPick={() => {}} groups={["other"]} />,
+    );
+    expect(titlesOf(html)).toEqual(["Khác"]);
+    expect(html.match(/<button/g)).toHaveLength(4);
+    for (const label of ["Ăn dặm", "Uống nước", "Tắm", "Ghi chú"])
+      expect(html).toContain(`>${label}</span>`);
+    expect(html).not.toContain("Thay tã");
+    expect(html).not.toContain("Bú trái");
+  });
+
+  it("keeps the sheet's own order whatever order is asked for", () => {
+    const html = renderToStaticMarkup(
+      <QuickActionGrid
+        running={[]}
+        onPick={() => {}}
+        groups={["timer", "other"]}
+      />,
+    );
+    expect(titlesOf(html)).toEqual(["Khác", "Bấm giờ"]);
+    expect(html.match(/<button/g)).toHaveLength(9);
+  });
+
+  it("reports a pick from a filtered sheet", () => {
+    const onPick = vi.fn();
+    const buttons = hostElements(
+      QuickActionGrid({ running: [], onPick, groups: ["other"] }),
+      "button",
+    );
+    expect(buttons).toHaveLength(4);
+    (buttons[1].props.onClick as () => void)();
+    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[10]);
+    expect(QUICK_ACTIONS[10].label).toBe("Uống nước");
+  });
+});
+
 describe("ActionSheetView", () => {
   it("is a floating sheet titled for the baby, without the old clock legend", () => {
     const html = renderToStaticMarkup(
@@ -89,19 +178,37 @@ describe("ActionSheetView", () => {
     expect(html).toContain("rounded-[34px]");
     expect(html).not.toContain("data-sheet-handle");
     expect(html).not.toContain("= bấm giờ");
-    expect(html).toContain(">Bấm giờ</h3>");
+    expect(titlesOf(html)).toEqual(["Khác", "Ghi nhanh", "Bấm giờ"]);
+  });
+
+  // Spec 2026-11-19 §5.4: what the home page's "Khác" button opens.
+  it("draws only the groups it is given, under the same title", () => {
+    const html = renderToStaticMarkup(
+      <ActionSheetView
+        open
+        babyName="Bun"
+        running={[]}
+        groups={["other"]}
+        onClose={() => {}}
+        onPick={() => {}}
+      />,
+    );
+    expect(html).toContain(">Ghi lại cho Bun</h2>");
+    expect(titlesOf(html)).toEqual(["Khác"]);
   });
 });
 
 describe("QuickActionGrid next-side hint (spec 2026-11-17 §5.3)", () => {
-  it("puts Nên bú on the suggested breast tile", () => {
+  it("puts Nên bú on the suggested breast button and reads it out", () => {
     const html = renderToStaticMarkup(
       <QuickActionGrid running={[]} onPick={() => {}} suggestSide="left" />,
     );
     expect(html.match(/Nên bú/g)).toHaveLength(1);
-    const [other, quick, timers] = html.split("<section").slice(1);
+    const [other, quick, timers] = sectionsOf(html);
     expect(timers).toMatch(/Nên bú<\/span>.*Bú trái/s);
     expect(other + quick).not.toContain("Nên bú");
+    expect(html).toContain('aria-label="Bú trái, nên bú"');
+    expect(html).toContain('aria-label="Bú phải"');
     expect(html.match(/<button/g)).toHaveLength(13);
   });
 
diff --git a/components/history/historyscreen.test.tsx b/components/history/historyscreen.test.tsx
index 75f5f54..f913482 100644
--- a/components/history/historyscreen.test.tsx
+++ b/components/history/historyscreen.test.tsx
@@ -1,7 +1,55 @@
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it, vi } from "vitest";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { Baby, FamilyMember } from "@/lib/supabase/rows";
 import { ICON_PATHS } from "@/lib/ui/icons";
-import { BackfillButton } from "./HistoryScreen";
+import { BackfillButton, HistoryScreen } from "./HistoryScreen";
+
+const state = vi.hoisted(() => ({
+  // The handler HistoryScreen gave to the empty state's button.
+  onEmptyAction: null as ((event?: unknown) => void) | null,
+}));
+const openActionSheet = vi.hoisted(() => vi.fn());
+
+vi.mock("@/lib/data/logs", async (importOriginal) => ({
+  ...(await importOriginal<typeof import("@/lib/data/logs")>()),
+  useHistoryLogs: () => ({
+    data: { pages: [[]] },
+    isPending: false,
+    isError: false,
+    fetchStatus: "idle",
+    hasNextPage: false,
+  }),
+}));
+vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime: () => {} }));
+vi.mock("@/lib/data/family", () => ({ useMembers: () => ({ data: [] }) }));
+vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
+vi.mock("@/components/actions/QuickActions", () => ({
+  useQuickActions: () => ({ openActionSheet }),
+}));
+vi.mock("@/components/ui/EmptyState", async (importOriginal) => {
+  const actual =
+    await importOriginal<typeof import("@/components/ui/EmptyState")>();
+  type Props = Parameters<typeof actual.EmptyState>[0];
+  return {
+    EmptyState: (props: Props) => {
+      state.onEmptyAction = props.action?.onClick ?? null;
+      return actual.EmptyState(props);
+    },
+  };
+});
+
+const baby = {
+  id: "b1",
+  family_id: "f1",
+  name: "Bun",
+  dob: "2026-09-10",
+} as Baby;
+const member = { role: "owner", user_id: "u1" } as FamilyMember;
+
+beforeEach(() => {
+  state.onEmptyAction = null;
+  openActionSheet.mockClear();
+});
 
 describe("BackfillButton", () => {
   it("is a labelled glass button, not the calendar icon", () => {
@@ -21,3 +69,17 @@ describe("BackfillButton", () => {
     expect(onClick).toHaveBeenCalledOnce();
   });
 });
+
+// Spec 2026-11-19 §5.4: openActionSheet now takes the groups to show, so a
+// click event must not reach it.
+describe("HistoryScreen with no logs", () => {
+  it("Ghi bản đầu tiên opens the + sheet and passes nothing on", () => {
+    const html = renderToStaticMarkup(
+      <HistoryScreen baby={baby} member={member} userId="u1" />,
+    );
+    expect(html).toContain(">Chưa có bản ghi nào.</p>");
+    expect(html).toContain(">Ghi bản đầu tiên</button>");
+    state.onEmptyAction?.({ type: "click" });
+    expect(openActionSheet.mock.calls).toEqual([[]]);
+  });
+});
diff --git a/components/home/homescreen.test.tsx b/components/home/homescreen.test.tsx
index f583741..bbae64e 100644
--- a/components/home/homescreen.test.tsx
+++ b/components/home/homescreen.test.tsx
@@ -230,9 +230,10 @@ describe("HomeScreen with logs", () => {
     expect(html).not.toMatch(/<p[^>]*>(Bình|Tã bẩn) /);
   });
 
-  it("Khác opens the + sheet and passes nothing on", () => {
+  // Spec 2026-11-19 §5.4.
+  it("Khác opens the + sheet with only the Khác group, whatever the click passes", () => {
     loaded(DAY);
     state.onMore?.({ type: "click" });
-    expect(openActionSheet.mock.calls).toEqual([[]]);
+    expect(openActionSheet.mock.calls).toEqual([[["other"]]]);
   });
 });
diff --git a/lib/rules/quickActions.test.ts b/lib/rules/quickActions.test.ts
index d138a81..c2d5602 100644
--- a/lib/rules/quickActions.test.ts
+++ b/lib/rules/quickActions.test.ts
@@ -1,12 +1,16 @@
 import { describe, expect, it } from "vitest";
 import {
+  ACTION_SHEET_CLOSED,
   actionLabel,
+  actionSheetReducer,
   isActionRunning,
   isSuggestedSide,
   NEXT_SIDE_LABEL,
   QUICK_ACTION_GROUPS,
   QUICK_ACTIONS,
+  sheetGroups,
   shouldAskPumpAmounts,
+  type QuickActionGroup,
 } from "./quickActions";
 import type { RunningLog } from "./timer";
 
@@ -92,6 +96,57 @@ describe("QUICK_ACTIONS", () => {
   });
 });
 
+// Spec 2026-11-19 §5.4: the "+" sheet can be opened with only some groups.
+describe("sheetGroups", () => {
+  it("draws all three groups without a filter", () => {
+    expect(sheetGroups()).toEqual(QUICK_ACTION_GROUPS);
+    expect(sheetGroups(undefined)).toEqual(QUICK_ACTION_GROUPS);
+  });
+
+  it("keeps only the groups asked for, in the sheet's own order", () => {
+    expect(sheetGroups(["other"])).toEqual([{ group: "other", title: "Khác" }]);
+    expect(sheetGroups(["timer", "other"]).map((g) => g.group)).toEqual([
+      "other",
+      "timer",
+    ]);
+  });
+});
+
+describe("actionSheetReducer", () => {
+  const opened = (groups?: QuickActionGroup[]) =>
+    actionSheetReducer(ACTION_SHEET_CLOSED, { type: "open", groups });
+
+  it("starts closed", () => {
+    expect(ACTION_SHEET_CLOSED).toEqual({ open: false });
+  });
+
+  it("opens with the groups asked for, or with all of them", () => {
+    expect(opened(["other"])).toEqual({ open: true, groups: ["other"] });
+    expect(opened().open).toBe(true);
+    expect(sheetGroups(opened().groups)).toHaveLength(3);
+  });
+
+  it("+ opens every group, also right after a filtered sheet was closed", () => {
+    const closed = actionSheetReducer(opened(["other"]), { type: "close" });
+    const again = actionSheetReducer(closed, { type: "toggle" });
+    expect(again.open).toBe(true);
+    expect(again.groups).toBeUndefined();
+  });
+
+  it("closing keeps the groups, so the sheet does not change on its way out", () => {
+    const shut = { open: false, groups: ["other"] };
+    expect(actionSheetReducer(opened(["other"]), { type: "close" })).toEqual(
+      shut,
+    );
+    expect(actionSheetReducer(opened(["other"]), { type: "toggle" })).toEqual(
+      shut,
+    );
+    expect(actionSheetReducer(ACTION_SHEET_CLOSED, { type: "close" })).toBe(
+      ACTION_SHEET_CLOSED,
+    );
+  });
+});
+
 describe("running state", () => {
   it("a breast timer is running only for its own side", () => {
     expect(isActionRunning(byKey("breast-left"), [leftFeed])).toBe(true);
diff --git a/lib/ui/categories.test.ts b/lib/ui/categories.test.ts
index 0c1b87a..8c114d5 100644
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -5,6 +5,7 @@ import {
   CATEGORY_CHIP,
   CATEGORY_RUNNING,
   CATEGORY_SOLID,
+  CATEGORY_TEXT,
   categoryOf,
 } from "./categories";
 import { ICON_PATHS } from "./icons";
@@ -70,6 +71,12 @@ describe("category class maps", () => {
     for (const classes of Object.values(CATEGORY_SOLID))
       expect(classes).not.toContain("ring");
   });
+
+  // The idle circle of a round timer button: only the icon takes the colour.
+  it("CATEGORY_TEXT colours every category's icon", () => {
+    expect(CATEGORY_TEXT["cat-pump"]).toBe("text-cat-pump");
+    expect(Object.keys(CATEGORY_TEXT)).toHaveLength(8);
+  });
 });
 
 describe("icon paths", () => {
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/quickActions.test.ts lib/ui/categories.test.ts components/actions/actionsheet.test.tsx components/actions/actionchrome.test.tsx components/actions/quickactions.test.tsx components/history/historyscreen.test.tsx components/home/homescreen.test.tsx components/home/buttons.test.tsx`
Expected: FAIL, `Tests  19 failed | 50 passed (69)`.

- [ ] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/actions/ActionChrome.tsx b/components/actions/ActionChrome.tsx
index da4f748..673a252 100644
--- a/components/actions/ActionChrome.tsx
+++ b/components/actions/ActionChrome.tsx
@@ -22,6 +22,7 @@ export function ActionChrome({ babyName }: { babyName: string }) {
         open={actions.actionSheetOpen}
         onClose={actions.closeActionSheet}
         babyName={babyName}
+        groups={actions.actionSheetGroups}
       />
     </>
   );
diff --git a/components/actions/ActionSheet.tsx b/components/actions/ActionSheet.tsx
index 9a005e2..90cadb6 100644
--- a/components/actions/ActionSheet.tsx
+++ b/components/actions/ActionSheet.tsx
@@ -8,82 +8,124 @@ import {
   isActionRunning,
   isSuggestedSide,
   NEXT_SIDE_LABEL,
-  QUICK_ACTION_GROUPS,
   QUICK_ACTIONS,
+  sheetGroups,
   type QuickAction,
+  type QuickActionGroup,
 } from "@/lib/rules/quickActions";
 import type { BreastSide, RunningLog } from "@/lib/rules/timer";
-import { CATEGORIES, type CategoryToken } from "@/lib/ui/categories";
+import {
+  CATEGORIES,
+  CATEGORY_CHIP,
+  CATEGORY_RUNNING,
+  CATEGORY_TEXT,
+} from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 import { useQuickActions } from "./QuickActions";
 
-const TINT: Record<CategoryToken, string> = {
-  "cat-feed": "bg-cat-feed/15 text-cat-feed",
-  "cat-bottle": "bg-cat-bottle/15 text-cat-bottle",
-  "cat-sleep": "bg-cat-sleep/15 text-cat-sleep",
-  "cat-diaper": "bg-cat-diaper/15 text-cat-diaper",
-  "cat-pump": "bg-cat-pump/15 text-cat-pump",
-  "cat-tummy": "bg-cat-tummy/15 text-cat-tummy",
-  "cat-med": "bg-cat-med/15 text-cat-med",
-  "cat-temp": "bg-cat-temp/15 text-cat-temp",
-};
-
-// Spec 2026-11-17 §3.3: one titled block per group, four 84 px tiles to a row.
+// Spec 2026-11-19 §5.4: one titled block per group. "Bấm giờ" is a row of five
+// 58 px round buttons like the home page's timer row; the other groups are
+// 84 px tiles, four to a row. Every label stays on one line at 375 px.
 export function QuickActionGrid({
   running,
   onPick,
   suggestSide = null,
+  groups,
 }: {
   running: RunningLog[];
   onPick: (action: QuickAction) => void;
   // Spec 2026-11-17 §5.3: the breast side to label "Nên bú"; null shows no label.
   suggestSide?: BreastSide | null;
+  // Draw only these groups; all three when left out.
+  groups?: QuickActionGroup[];
 }) {
+  // Like TimerButtons: "Dừng …" is only read out, the label keeps the name.
+  const roundButton = (action: QuickAction) => {
+    const on = isActionRunning(action, running);
+    const category = CATEGORIES[action.category];
+    const suggested = isSuggestedSide(action, suggestSide);
+    const label = actionLabel(action, running);
+    return (
+      <button
+        key={action.key}
+        type="button"
+        aria-label={
+          suggested ? `${label}, ${NEXT_SIDE_LABEL.toLowerCase()}` : label
+        }
+        onClick={() => onPick(action)}
+        className="flex flex-col items-center gap-1.5 transition-transform duration-[120ms] active:scale-[0.97]"
+      >
+        <span
+          className={cx(
+            "relative flex size-[58px] items-center justify-center rounded-full",
+            on
+              ? `${CATEGORY_RUNNING[category.token]} text-bg`
+              : `glass ${CATEGORY_TEXT[category.token]}`,
+          )}
+        >
+          <Icon name={category.icon} size={24} strokeWidth={2.2} />
+          {suggested && (
+            <HintBadge className="-top-1.5 -right-2">
+              {NEXT_SIDE_LABEL}
+            </HintBadge>
+          )}
+        </span>
+        <span
+          className={cx(
+            "text-xs leading-4",
+            on ? "font-bold" : "font-medium",
+            "whitespace-nowrap text-ink",
+          )}
+        >
+          {action.label}
+        </span>
+      </button>
+    );
+  };
+  const tile = (action: QuickAction) => {
+    const category = CATEGORIES[action.category];
+    return (
+      <button
+        key={action.key}
+        type="button"
+        onClick={() => onPick(action)}
+        className="flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-[20px] border border-edge bg-glass-solid/75 px-1 text-ink transition-transform duration-[120ms] active:scale-[0.97]"
+      >
+        <span
+          className={cx(
+            "flex size-[38px] shrink-0 items-center justify-center rounded-full",
+            CATEGORY_CHIP[category.token],
+          )}
+        >
+          <Icon name={category.icon} size={20} />
+        </span>
+        <span className="text-center text-xs leading-4 font-semibold whitespace-nowrap">
+          {action.label}
+        </span>
+      </button>
+    );
+  };
   return (
     <div className="flex flex-col gap-4">
-      {QUICK_ACTION_GROUPS.map(({ group, title }) => (
-        <section key={group} className="flex flex-col gap-2">
-          <h3 className="text-[13px] leading-[18px] font-semibold text-muted">
-            {title}
-          </h3>
-          <div className="grid grid-cols-4 gap-2">
-            {QUICK_ACTIONS.filter((action) => action.group === group).map(
-              (action) => {
-                const on = isActionRunning(action, running);
-                const category = CATEGORIES[action.category];
-                return (
-                  <button
-                    key={action.key}
-                    type="button"
-                    onClick={() => onPick(action)}
-                    className={cx(
-                      "relative flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-[20px] bg-glass-solid/75 px-1 text-ink transition-transform duration-[120ms] active:scale-[0.97]",
-                      on ? "border-2 border-accent-text" : "border border-edge",
-                    )}
-                  >
-                    {isSuggestedSide(action, suggestSide) && (
-                      <HintBadge className="-top-1.5 -right-1">
-                        {NEXT_SIDE_LABEL}
-                      </HintBadge>
-                    )}
-                    <span
-                      className={cx(
-                        "flex size-[38px] shrink-0 items-center justify-center rounded-full",
-                        TINT[category.token],
-                      )}
-                    >
-                      <Icon name={category.icon} size={20} />
-                    </span>
-                    <span className="text-center text-xs leading-4 font-semibold">
-                      {actionLabel(action, running)}
-                    </span>
-                  </button>
-                );
-              },
-            )}
-          </div>
-        </section>
-      ))}
+      {sheetGroups(groups).map(({ group, title }) => {
+        const timers = group === "timer";
+        return (
+          <section key={group} className="flex flex-col gap-2">
+            <h3 className="text-[13px] leading-[18px] font-semibold text-muted">
+              {title}
+            </h3>
+            <div
+              className={
+                timers ? "grid grid-cols-5 gap-1" : "grid grid-cols-4 gap-2"
+              }
+            >
+              {QUICK_ACTIONS.filter((action) => action.group === group).map(
+                timers ? roundButton : tile,
+              )}
+            </div>
+          </section>
+        );
+      })}
     </div>
   );
 }
@@ -95,6 +137,7 @@ export function ActionSheetView({
   running,
   onPick,
   suggestSide = null,
+  groups,
 }: {
   open: boolean;
   onClose: () => void;
@@ -102,6 +145,7 @@ export function ActionSheetView({
   running: RunningLog[];
   onPick: (action: QuickAction) => void;
   suggestSide?: BreastSide | null;
+  groups?: QuickActionGroup[];
 }) {
   return (
     <Sheet
@@ -114,6 +158,7 @@ export function ActionSheetView({
         running={running}
         onPick={onPick}
         suggestSide={suggestSide}
+        groups={groups}
       />
     </Sheet>
   );
@@ -123,10 +168,13 @@ export function ActionSheet({
   open,
   onClose,
   babyName,
+  groups,
 }: {
   open: boolean;
   onClose: () => void;
   babyName: string;
+  // Spec 2026-11-19 §5.4: e.g. ["other"] from the home page's "Khác" button.
+  groups?: QuickActionGroup[];
 }) {
   const actions = useQuickActions();
   return (
@@ -136,6 +184,7 @@ export function ActionSheet({
       babyName={babyName}
       running={actions.running}
       suggestSide={actions.suggestSide}
+      groups={groups}
       onPick={(action) => {
         onClose();
         if (action.kind === "timer") actions.pressTimer(action.button);
diff --git a/components/actions/QuickActions.tsx b/components/actions/QuickActions.tsx
index d08cdce..1a583f5 100644
--- a/components/actions/QuickActions.tsx
+++ b/components/actions/QuickActions.tsx
@@ -4,6 +4,7 @@ import {
   createContext,
   useContext,
   useEffect,
+  useReducer,
   useRef,
   useState,
   type ReactNode,
@@ -21,7 +22,12 @@ import {
   useTimerPress,
 } from "@/lib/data/logs";
 import type { LogType } from "@/lib/rules/logDetails";
-import { shouldAskPumpAmounts } from "@/lib/rules/quickActions";
+import {
+  ACTION_SHEET_CLOSED,
+  actionSheetReducer,
+  shouldAskPumpAmounts,
+  type QuickActionGroup,
+} from "@/lib/rules/quickActions";
 import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
 import {
   nextBreastSide,
@@ -58,7 +64,10 @@ export type QuickActionsValue = {
   openInstant: (type: InstantType, initial?: QuickValues) => void;
   // The "+" action sheet (spec §6.3), open from any page inside the provider.
   actionSheetOpen: boolean;
-  openActionSheet: () => void;
+  // Spec 2026-11-19 §5.4: the groups it shows; all three when left out. From
+  // onClick call `() => openActionSheet()`, or the event is taken for groups.
+  actionSheetGroups?: QuickActionGroup[];
+  openActionSheet: (groups?: QuickActionGroup[]) => void;
   toggleActionSheet: () => void;
   closeActionSheet: () => void;
 };
@@ -86,7 +95,10 @@ export function QuickActionsProvider({
     type: InstantType;
     initial?: QuickValues;
   } | null>(null);
-  const [actionSheetOpen, setActionSheetOpen] = useState(false);
+  const [actionSheet, dispatchActionSheet] = useReducer(
+    actionSheetReducer,
+    ACTION_SHEET_CLOSED,
+  );
   // Id of a pumping log that was just stopped: ask for ml (spec gốc §6.13).
   const [pumpStopped, setPumpStopped] = useState<string | null>(null);
   // Spec §7.4: the Undo toast for that stop waits until the ml sheet closes.
@@ -155,10 +167,11 @@ export function QuickActionsProvider({
     stopTimer: (log) =>
       stop.mutate(log.id, { onSuccess: () => afterStop(log) }),
     openInstant: (type, initial) => setSheet({ type, initial }),
-    actionSheetOpen,
-    openActionSheet: () => setActionSheetOpen(true),
-    toggleActionSheet: () => setActionSheetOpen((open) => !open),
-    closeActionSheet: () => setActionSheetOpen(false),
+    actionSheetOpen: actionSheet.open,
+    actionSheetGroups: actionSheet.groups,
+    openActionSheet: (groups) => dispatchActionSheet({ type: "open", groups }),
+    toggleActionSheet: () => dispatchActionSheet({ type: "toggle" }),
+    closeActionSheet: () => dispatchActionSheet({ type: "close" }),
   };
 
   return (
diff --git a/components/history/HistoryScreen.tsx b/components/history/HistoryScreen.tsx
index 88cde2a..5dc3dd9 100644
--- a/components/history/HistoryScreen.tsx
+++ b/components/history/HistoryScreen.tsx
@@ -113,7 +113,8 @@ export function HistoryScreen({
             text="Chưa có bản ghi nào."
             action={{
               label: "Ghi bản đầu tiên",
-              onClick: actions.openActionSheet,
+              // Not passed as is: the click event would be taken for groups.
+              onClick: () => actions.openActionSheet(),
             }}
           />
         ) : (
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index 6c03963..7ca93d0 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -152,7 +152,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
 
           <QuickLogGrid
             onInstant={(type) => actions.openInstant(type)}
-            onMore={() => actions.openActionSheet()}
+            onMore={() => actions.openActionSheet(["other"])}
           />
 
           {actions.error && (
diff --git a/components/home/TimerButtons.tsx b/components/home/TimerButtons.tsx
index 35ad92c..512fde3 100644
--- a/components/home/TimerButtons.tsx
+++ b/components/home/TimerButtons.tsx
@@ -12,7 +12,7 @@ import type { BreastSide, RunningLog, TimerButton } from "@/lib/rules/timer";
 import {
   CATEGORIES,
   CATEGORY_RUNNING,
-  type CategoryToken,
+  CATEGORY_TEXT,
 } from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 import { GROUP_LABEL } from "./sectionTitle";
@@ -24,17 +24,6 @@ const TIMER_ACTIONS = QUICK_ACTIONS.filter(
   (action): action is TimerAction => action.kind === "timer",
 );
 
-const IDLE: Record<CategoryToken, string> = {
-  "cat-feed": "text-cat-feed",
-  "cat-bottle": "text-cat-bottle",
-  "cat-sleep": "text-cat-sleep",
-  "cat-diaper": "text-cat-diaper",
-  "cat-pump": "text-cat-pump",
-  "cat-tummy": "text-cat-tummy",
-  "cat-med": "text-cat-med",
-  "cat-temp": "text-cat-temp",
-};
-
 export function TimerButtons({
   running,
   busy,
@@ -72,7 +61,7 @@ export function TimerButtons({
                   "relative flex size-[58px] items-center justify-center rounded-full",
                   on
                     ? `${CATEGORY_RUNNING[token]} text-bg`
-                    : `glass ${IDLE[token]}`,
+                    : `glass ${CATEGORY_TEXT[token]}`,
                 )}
               >
                 <Icon
diff --git a/components/nav/TabBar.tsx b/components/nav/TabBar.tsx
index 647b585..c08331f 100644
--- a/components/nav/TabBar.tsx
+++ b/components/nav/TabBar.tsx
@@ -13,11 +13,7 @@ import {
 } from "@/lib/nav";
 import { formatClock, formatTabClock, timerLabel } from "@/lib/rules/hero";
 import type { LogRow } from "@/lib/supabase/rows";
-import {
-  CATEGORY_CHIP,
-  CATEGORY_SOLID,
-  categoryOf,
-} from "@/lib/ui/categories";
+import { CATEGORY_CHIP, CATEGORY_SOLID, categoryOf } from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 
 // The running timer the Hôm nay tab shows, and how many others are running.
diff --git a/lib/rules/quickActions.ts b/lib/rules/quickActions.ts
index 3046ed8..efdc607 100644
--- a/lib/rules/quickActions.ts
+++ b/lib/rules/quickActions.ts
@@ -31,6 +31,35 @@ export const QUICK_ACTION_GROUPS: { group: QuickActionGroup; title: string }[] =
     { group: "timer", title: "Bấm giờ" },
   ];
 
+// Spec 2026-11-19 §5.4: the groups the "+" sheet draws. A caller may ask for
+// only some of them; the order stays that of QUICK_ACTION_GROUPS.
+export function sheetGroups(
+  only?: QuickActionGroup[],
+): { group: QuickActionGroup; title: string }[] {
+  return only
+    ? QUICK_ACTION_GROUPS.filter(({ group }) => only.includes(group))
+    : QUICK_ACTION_GROUPS;
+}
+
+export type ActionSheetState = { open: boolean; groups?: QuickActionGroup[] };
+export type ActionSheetEvent =
+  | { type: "open"; groups?: QuickActionGroup[] }
+  | { type: "toggle" }
+  | { type: "close" };
+
+export const ACTION_SHEET_CLOSED: ActionSheetState = { open: false };
+
+// "open" shows the groups asked for; "toggle" (the "+" button) opens all of
+// them. Closing keeps the groups, so the sheet does not change on its way out.
+export function actionSheetReducer(
+  state: ActionSheetState,
+  event: ActionSheetEvent,
+): ActionSheetState {
+  if (event.type === "open") return { open: true, groups: event.groups };
+  if (!state.open) return event.type === "toggle" ? { open: true } : state;
+  return { ...state, open: false };
+}
+
 // Group by group, timers first: the home page's timer row (TimerButtons) takes
 // the kind "timer" entries in this order. QUICK_ACTION_GROUPS orders the sheet.
 export const QUICK_ACTIONS: QuickAction[] = [
diff --git a/lib/ui/categories.ts b/lib/ui/categories.ts
index 62f1950..2134e22 100644
--- a/lib/ui/categories.ts
+++ b/lib/ui/categories.ts
@@ -71,3 +71,15 @@ export const CATEGORY_SOLID: Record<CategoryToken, string> = {
   "cat-med": "bg-cat-med text-bg",
   "cat-temp": "bg-cat-temp text-bg",
 };
+
+// Only the icon takes the category colour, e.g. on a glass circle.
+export const CATEGORY_TEXT: Record<CategoryToken, string> = {
+  "cat-feed": "text-cat-feed",
+  "cat-bottle": "text-cat-bottle",
+  "cat-sleep": "text-cat-sleep",
+  "cat-diaper": "text-cat-diaper",
+  "cat-pump": "text-cat-pump",
+  "cat-tummy": "text-cat-tummy",
+  "cat-med": "text-cat-med",
+  "cat-temp": "text-cat-temp",
+};
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/quickActions.test.ts lib/ui/categories.test.ts components/actions/actionsheet.test.tsx components/actions/actionchrome.test.tsx components/actions/quickactions.test.tsx components/history/historyscreen.test.tsx components/home/homescreen.test.tsx components/home/buttons.test.tsx && bun run typecheck`
Expected: `Tests  69 passed (69)`; `tsc --noEmit` không báo lỗi.

Patch code này mang theo một dòng thuộc về M3a: câu import từ `lib/ui/categories` trong `components/nav/TabBar.tsx` được gộp lại một dòng. Không đổi hành vi.

- [ ] **Step 5: Commit**

```bash
git add -- components/actions/ActionChrome.tsx components/actions/ActionSheet.tsx components/actions/QuickActions.tsx components/history/HistoryScreen.tsx components/home/HomeScreen.tsx components/home/TimerButtons.tsx components/nav/TabBar.tsx lib/rules/quickActions.ts lib/ui/categories.ts components/actions/actionchrome.test.tsx components/actions/actionsheet.test.tsx components/history/historyscreen.test.tsx components/home/homescreen.test.tsx lib/rules/quickActions.test.ts lib/ui/categories.test.ts
git commit -m "feat(actions): thumb-first + sheet with round timer buttons and a group filter" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Bước 34 của checklist thiết bị tả ô timer (§11.3)

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: ô timer của M3a.
- Produces: mục 1 và 2 của bước 34 tả ô timer trong thanh tab thay cho viên timer nổi. Bước 34 vẫn ghi "Chờ người dùng".

- [ ] **Step 1: Sửa tài liệu (Patch 3)**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index 4b23fa1..7b1d5a1 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -550,8 +550,8 @@ Kết quả: Chờ người dùng.
 
 ## Bước 34 — Canh timer (spec 2026-11-17 §5, §4.3)
 
-1. Bấm "Nằm sấp" ở trang chủ, sang tab Nhật ký. Kỳ vọng: một viên kính ngay trên thanh tab ghi "Nằm sấp · m:ss" đang nhảy và chữ "Dừng"; về tab Hôm nay thì viên biến mất.
-2. Ở Nhật ký bấm "Dừng" trên viên. Kỳ vọng: viên biến mất, toast Hoàn tác hiện phía trên chỗ viên vừa nằm.
+1. Bấm "Nằm sấp" ở trang chủ, sang tab Nhật ký. Kỳ vọng: tab "Hôm nay" trong thanh tab thành ô timer rộng hơn hai tab còn lại, có ô tròn màu của Nằm sấp, đồng hồ "m:ss" đang nhảy và chữ "Hôm nay" bên dưới; không có viên kính nào phía trên thanh tab và không có nút "Dừng"; về tab Hôm nay thì tab "Hôm nay" trở lại như thường.
+2. Ở Nhật ký chạm ô timer. Kỳ vọng: về trang Hôm nay, thẻ đầu trang chủ ghi "Đang nằm sấp" và có nút "Dừng". Bấm "Dừng". Kỳ vọng: timer dừng, toast Hoàn tác hiện ngay phía trên thanh tab.
 3. Sau một cữ bú mẹ đã xong: thẻ đầu trang chủ (khi đang "Trễ cữ bú") và hàng "Bấm giờ" có nhãn "Nên bú" trên nút của bên ngược lại, kèm dòng "Lần trước: … lúc …"; bảng "+" cũng có nhãn đó.
 4. Bấm "Nằm sấp" và để yên 31 phút. Kỳ vọng: nhận "Timer Nằm sấp đã chạy quá 30 phút"; trang chủ có dải vàng "Nằm sấp đã chạy … Còn đang nằm sấp không?" với nút "Dừng".
 5. Dọn dẹp: dừng timer, xóa các bản ghi Nằm sấp thử.
```

- [ ] **Step 2: Commit**

```bash
git add docs/device-checklist.md
git commit -m "docs(checklist): step 34 describes the timer tile in the tab bar" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M3 và lên `main`

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m3b.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ của M3a và Task 1–2.
- Produces: `main` có cả M3a và M3b; M4 cắt nhánh từ `main`.

- [ ] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  157 passed (157)`, `Tests  1122 passed (1122)`.

- [ ] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [ ] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không bấm Lưu, không đụng timer)**

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Dùng khung Browser của app ở cỡ 375×812. Đóng mọi sheet bằng phím Esc.

Không bấm nút nào của hàng Bấm giờ, không bấm "Dừng", không chọn ô nào trong sheet "+" ngoài việc mở và đóng nó.

1. Mở `http://localhost:3000/nhat-ky`. Nếu dữ liệu thật đang có timer chạy: tab "Hôm nay" là ô timer rộng hơn hai tab kia, gồm ô tròn có icon, đồng hồ đang nhảy, chữ "Hôm nay"; không còn viên timer nổi và không có nút "Dừng". Chạy bằng javascript tool: `(() => { const nav = document.querySelector('nav[aria-label="Điều hướng chính"]'); const t = nav.querySelector('a[href="/"]'); const o = nav.querySelector('a[href="/nhat-ky"]'); const box = t.getBoundingClientRect(); const cs = getComputedStyle(t); const left = box.left + parseFloat(cs.paddingLeft); const right = box.right - parseFloat(cs.paddingRight); const spans = [...t.querySelectorAll("span")].map((s) => s.getBoundingClientRect()); return { w: Math.round(box.width * 10) / 10, ratio: Math.round((box.width / o.getBoundingClientRect().width) * 100) / 100, inside: spans.every((r) => r.left >= left - 0.5 && r.right <= right + 0.5), spare: Math.round((right - left - (Math.max(...spans.map((r) => r.right)) - Math.min(...spans.map((r) => r.left)))) * 10) / 10, label: t.getAttribute("aria-label"), pill: document.querySelectorAll("[data-timer-pill]").length }; })()`. Kỳ vọng: `inside` là `true` (nội dung nằm trong phần ruột của ô), `ratio` từ 1,65 đến 1,75 (nội dung quá rộng sẽ đẩy ô to hơn phần 1,7 của nó), `pill` là 0. Ghi lại `w` và `spare`. Nếu không có timer nào chạy: ghi "chưa kiểm" cho mục 1–3.
2. Chạm ô timer: về trang Hôm nay, tab "Hôm nay" vẽ như thường, thẻ lớn có nút "Dừng".
3. Mở `/cai-dat` khi timer còn chạy: ô timer vẫn hiện và có `aria-current="page"`.
4. Ở `/nhat-ky`, chạm "+": sheet có ba nhóm theo thứ tự "Khác", "Ghi nhanh", "Bấm giờ"; nhóm "Bấm giờ" là một hàng 5 nút tròn. Chạy: `(() => { const rows = [...document.querySelectorAll("dialog[open] button")].flatMap((b) => { const box = b.getBoundingClientRect(); return [...b.querySelectorAll("span")].filter((s) => s.children.length === 0 && s.textContent.trim() && getComputedStyle(s).position !== "absolute").map((s) => { const r = s.getBoundingClientRect(); return { text: s.textContent, spare: Math.round((box.width - r.width) * 10) / 10, out: r.left < box.left - 0.5 || r.right > box.right + 0.5 || r.height > 1.5 * parseFloat(getComputedStyle(s).lineHeight) }; }); }); return { out: rows.filter((r) => r.out).map((r) => r.text), tightest: rows.sort((a, b) => a.spare - b.spare).slice(0, 3).map((r) => [r.text, r.spare]) }; })()`. Kỳ vọng: `out` rỗng (không nhãn nào tràn ra ngoài nút của nó hay xuống dòng; "Uống nước" nằm một dòng). Ghi lại `tightest` (bề rộng nút trừ bề rộng nhãn của ba nhãn chật nhất). Đóng bằng Esc.
5. Ở trang Hôm nay, chạm "Khác": sheet chỉ có nhóm "Khác" với 4 ô. Đóng bằng Esc. Chạm "+": sheet lại đủ ba nhóm. Đóng bằng Esc.
6. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở cả hai trang.
7. Lặp mục 1 và 4 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`: chữ và icon đọc rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được thì ghi "chưa kiểm".

- [ ] **Step 4: Commit phần ghi kết quả, đưa lên `main`, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m3b.md
git commit -m "docs(plan): record the M3 check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-ux-mobile-m3b
git push origin main
```

Báo cáo cho người dùng: `git log --oneline 2448528..main`; kết quả typecheck, vitest, build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa.
