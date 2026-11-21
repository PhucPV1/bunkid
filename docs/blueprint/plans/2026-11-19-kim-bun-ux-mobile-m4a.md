# Kim Bun — UX mobile M4a: nhóm chip triệu chứng gập mở, cờ ẩn thanh tab Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§6: ba gạch đầu dòng đầu và gạch đầu dòng về `ChromeVisibility`; phần tương ứng của §11.1)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Trang Triệu chứng ngắn lại nhờ các nhóm chip gập mở, và có sẵn cờ để một trang ẩn thanh tab cùng nút "+" (M4b dùng cờ này cho thanh kết quả).

**Architecture:**

- **Context mới** `components/actions/ChromeVisibility.tsx`: một cờ do `AuthGate` giữ; trang bật cờ bằng `useHideChrome`, `ActionChrome` đọc cờ và không dựng thanh tab.
- **Luật thuần** (`lib/rules/symptoms.ts`): `pickedSymptomCount` cho nhãn "{n} đã chọn" của nhóm; `toggled` cho việc mở và đóng một nhóm.
- **Giao diện:** `SymptomChips` thành một danh sách `glass` các nhóm gập mở; `TriageScreen` giữ danh sách nhóm đang mở.
- **Chưa làm ở plan này (thuộc M4b):** thanh kết quả dính đáy, việc `TriageScreen` gọi `useHideChrome`, bỏ hai nút cuối form.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m4a`, cắt từ `main` @ `4a443df`. Baseline: 1122 test vitest xanh (157 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a, M2b, M2c | §3 trang Hôm nay | đã xong, đã lên `main` @ `e1e729f` |
| M6 | phần còn lại của §8 Thống kê | đã xong, đã lên `main` @ `34f18f6` |
| M5a, M5b, M5c | §7 Tiêm chủng (bảng vắc xin × mũi), §9 Khám phá | đã xong, đã lên `main` @ `2448528` |
| M3a, M3b | §4 timer trong thanh tab, §5.4 sheet "+" | đã xong, đã lên `main` @ `4a443df` |
| **M4a (plan này)** | §6: cờ ẩn thanh tab, nhóm chip gập mở | `2026-11-19-kim-bun-ux-mobile-m4a.md` |
| M4b | §6: thanh kết quả dính đáy; khung chờ của trang Hôm nay | `2026-11-19-kim-bun-ux-mobile-m4b.md` |
| Kết | §11.3 bước 36 của checklist thiết bị | làm sau cùng |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Vị trí provider:** `ChromeVisibilityProvider` nằm trong `QuickActionsProvider`, bọc cả `SyncBarProvider` và `ActionChrome`. Không có provider (trong test, hay ở trang ngoài `AuthGate`) thì cờ luôn tắt và `useHideChrome` không làm gì.
2. **Ẩn nghĩa là không dựng `TabBar`** (thanh tab kèm nút "+"). `ActionSheet` vẫn được dựng để trạng thái của nó không mất; khi thanh tab ẩn thì không có nút nào mở nó.
3. **`useHideChrome` dùng `useLayoutEffect`**, không phải `useEffect`: cờ bật trước lần vẽ đầu tiên, nên thanh tab không kịp hiện một khung hình đè lên thanh của trang. Một test đọc file nguồn để ghim lựa chọn này (test của repo không chạy effect). Cờ là một giá trị đúng/sai cho một trang tại một thời điểm; hiện chỉ trang Triệu chứng dùng.
4. **Hàng tiêu đề nhóm:** tên nhóm `text-base text-ink`; nhãn "{n} đã chọn" bo tròn, `px-2 py-0.5`, không xuống dòng; icon 18 px `text-muted`. Spec không ghi cỡ icon và padding của nhãn.
5. **Thêm so với spec, cho trình đọc màn hình:** nút tiêu đề nằm trong `h3` (trước đây tên nhóm là `h3`, nên việc nhảy theo tiêu đề vẫn dùng được), và có `aria-controls` khi nhóm mở. Không đổi hình thức.
6. **Chip trong nhóm đang mở** nằm trong khối `px-4 pb-4`; câu "Bật theo nhiệt độ đã nhập." vẫn nằm dưới chip của nhóm có chip sốt, nên chỉ thấy khi nhóm đó mở. Nhãn "{n} đã chọn" của nhóm đó vẫn tính chip sốt bị khoá dù nhóm đóng.
7. **Nhóm không có chip nào cho tuổi của bé** không được vẽ, như trước.
8. **Chưa có unit test cho việc "Làm lại" đóng mọi nhóm.** Test của repo dựng HTML tĩnh, không dựng lại sau khi state đổi. Việc này được kiểm trên trình duyệt ở Step 3 mục 6 của M4b và ở bước 36 của checklist thiết bị. Phần kiểm được bằng unit test: `toggled`, và nút tiêu đề gọi `onToggleGroup` với đúng mã nhóm.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m4a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao của `main` @ `4a443df` ở ngoài repo; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task và tổng cả bộ ở Task 3 đều đo trên bản sao đó.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status).
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.
- **Lên `main` một lần.** M4a nằm trên nhánh cho tới khi M4b xong; `main` nhận cả hai ở cuối M4b. Lý do: sau M4a trang Triệu chứng vẫn còn hai nút ở cuối form và chưa có thanh kết quả, và phần kiểm trình duyệt của cả mốc nằm ở cuối M4b. Người dùng nói "plan nào xong phần nào thì commit push main luôn"; ở đây "phần" được hiểu là cả mốc M4. Báo lại điều này trong báo cáo cuối.
- **Quyền đẩy `main`.** Mục Global Constraints bên trên chép nguyên văn §2 của spec, trong đó mỗi lần đẩy `main` cần người dùng đồng ý. Với 6 mốc của spec này, lời đồng ý trước ở dòng Status thay cho việc hỏi từng lần. Mọi việc đẩy khác vẫn theo §2.
- **Đã qua một vòng review.** Bản chạy thử đầu được một reviewer độc lập đọc; các sửa đổi theo góp ý đó (layout effect, hàng tiêu đề trong `h3`, hàm `toggled`, test chặt hơn, khung chờ có hàng tiêu đề) đã nằm trong các patch của hai plan này.

## Contracts with Other Plans

Plan này đứng sau M3b (đã ở trên `main` @ `4a443df`) và ngay trước M4b.

**Consumes (từ `main` @ `4a443df`):**

- `components/actions/ActionChrome.tsx`: dựng `TabBar` (có `timer`) và `ActionSheet`; không còn `TimerPill`.
- `components/AuthGate.tsx`: `QuickActionsProvider` bọc `SyncBarProvider` (nội dung có `pb-[120px]`) và `ActionChrome`.
- `lib/rules/symptoms.ts`: `FEVER_SYMPTOM`, `visibleSymptoms`, `effectiveSymptoms`.

**Produces** (M4b được dựa vào đúng những tên này):

- `components/actions/ChromeVisibility.tsx`: `ChromeVisibilityProvider`, `useChromeHidden`, `useHideChrome`, `holdChromeHidden`.
- `lib/rules/symptoms.ts`: `pickedSymptomCount`, `toggled`.
- `components/triage/SymptomChips.tsx`: prop `openGroups`, `onToggleGroup`.
- **Vitest sau M4a:** 1138 test, 158 file.

---

### Task 1: Cờ ẩn thanh tab và nút "+" (`ChromeVisibility`) (§6)

**Files:**

- Modify: `components/AuthGate.tsx`
- Modify: `components/actions/ActionChrome.tsx`
- Create: `components/actions/ChromeVisibility.tsx`
- Test: `components/actions/actionchrome.test.tsx` (sửa)
- Test: `components/actions/chromevisibility.test.tsx` (mới)

**Interfaces:**

- Consumes: `ActionChrome` (sau M3: dựng `TabBar` có prop `timer`, và `ActionSheet`); `AuthGate`; mẫu context của `components/sync/SyncSlot.tsx`.
- Produces: `components/actions/ChromeVisibility.tsx`: `ChromeVisibilityProvider`, `useChromeHidden(): boolean`, `useHideChrome(hide: boolean): void` (chạy trong `useLayoutEffect`), `holdChromeHidden(hide, setHidden): (() => void) | undefined` (phần thuần của effect, để test không cần DOM). `ActionChrome` không dựng `TabBar` khi cờ bật; `ActionSheet` vẫn được dựng. `AuthGate` bọc nội dung và `ActionChrome` trong provider.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m4a main
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m4a.md docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m4b.md
git commit -m "docs(plan): the two M4 plans for the symptom page" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/actions/actionchrome.test.tsx b/components/actions/actionchrome.test.tsx
index 61d012d..79d87ca 100644
--- a/components/actions/actionchrome.test.tsx
+++ b/components/actions/actionchrome.test.tsx
@@ -19,6 +19,11 @@ vi.mock("./QuickActions", async (importOriginal) => {
     useQuickActions: () => ({ ...actual.useQuickActions(), ...sheet.state }),
   };
 });
+// Spec 2026-11-19 §6: a page (Triệu chứng) can hide the tab bar and "+".
+const chrome = vi.hoisted(() => ({ hidden: false }));
+vi.mock("./ChromeVisibility", () => ({
+  useChromeHidden: () => chrome.hidden,
+}));
 // TabBar reads the current path; outside the Next router there is none.
 vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
 vi.mock("@/lib/hooks/useNow", () => ({
@@ -71,6 +76,7 @@ const groupTitles = (html: string) =>
 beforeEach(() => {
   nav.pathname = "/nhat-ky";
   sheet.state = null;
+  chrome.hidden = false;
 });
 
 describe("ActionChrome", () => {
@@ -85,6 +91,25 @@ describe("ActionChrome", () => {
   });
 });
 
+// Spec 2026-11-19 §6.
+describe("ActionChrome while a page hides the chrome", () => {
+  it("draws neither the tab bar nor +, the closed sheet stays", () => {
+    chrome.hidden = true;
+    const html = render(TIMERS);
+    expect(html).not.toContain('aria-label="Điều hướng chính"');
+    expect(html).not.toContain('href="/nhat-ky"');
+    expect(html).not.toContain('aria-label="Ghi lại"');
+    expect(html).not.toContain("đã chạy");
+    expect(html).toContain(">Ghi lại cho Bun</h2>");
+  });
+
+  it("draws both again once the flag is down", () => {
+    const html = render();
+    expect(html).toContain('aria-label="Điều hướng chính"');
+    expect(html).toContain('aria-label="Ghi lại"');
+  });
+});
+
 // Spec 2026-11-19 §4.
 describe("ActionChrome with a running timer", () => {
   it("off Hôm nay, the Hôm nay tab shows the latest timer and counts the rest", () => {
diff --git a/components/actions/chromevisibility.test.tsx b/components/actions/chromevisibility.test.tsx
new file mode 100644
index 0000000..802c0e7
--- /dev/null
+++ b/components/actions/chromevisibility.test.tsx
@@ -0,0 +1,69 @@
+import { readFileSync } from "node:fs";
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import {
+  ChromeVisibilityProvider,
+  holdChromeHidden,
+  useChromeHidden,
+  useHideChrome,
+} from "./ChromeVisibility";
+
+function Probe() {
+  return <p>hidden:{String(useChromeHidden())}</p>;
+}
+
+function Hider({ hide }: { hide: boolean }) {
+  useHideChrome(hide);
+  return null;
+}
+
+// Spec 2026-11-19 §6: a page hides the tab bar and "+" while it holds the flag.
+describe("ChromeVisibility", () => {
+  it("the chrome shows by default, inside and outside the provider", () => {
+    expect(renderToStaticMarkup(<Probe />)).toBe("<p>hidden:false</p>");
+    expect(
+      renderToStaticMarkup(
+        <ChromeVisibilityProvider>
+          <Probe />
+        </ChromeVisibilityProvider>,
+      ),
+    ).toBe("<p>hidden:false</p>");
+  });
+
+  it("useHideChrome renders nothing and works outside the provider", () => {
+    expect(renderToStaticMarkup(<Hider hide />)).toBe("");
+    expect(
+      renderToStaticMarkup(
+        <ChromeVisibilityProvider>
+          <Hider hide />
+          <Probe />
+        </ChromeVisibilityProvider>,
+      ),
+    ).toBe("<p>hidden:false</p>");
+  });
+
+  it("holding raises the flag and the cleanup lowers it", () => {
+    const set = vi.fn();
+    const release = holdChromeHidden(true, set);
+    expect(set.mock.calls).toEqual([[true]]);
+    release?.();
+    expect(set.mock.calls).toEqual([[true], [false]]);
+  });
+
+  it("not holding leaves the flag alone", () => {
+    const set = vi.fn();
+    expect(holdChromeHidden(false, set)).toBeUndefined();
+    expect(set).not.toHaveBeenCalled();
+  });
+
+  // An effect that runs after the paint would let the tab bar show for a
+  // frame over the page's own bar.
+  it("raises the flag in a layout effect, before the browser paints", () => {
+    const source = readFileSync(
+      "components/actions/ChromeVisibility.tsx",
+      "utf8",
+    );
+    expect(source).toContain("useLayoutEffect(() => holdChromeHidden(");
+    expect(source).not.toMatch(/\buseEffect\b/);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/actions/chromevisibility.test.tsx components/actions/actionchrome.test.tsx`
Expected: FAIL, `Test Files  2 failed (2)`, `Tests  1 failed | 7 passed (8)`. File test mới chưa chạy được (`Cannot find module './ChromeVisibility'`).

- [x] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/AuthGate.tsx b/components/AuthGate.tsx
index 80e259e..210fc4e 100644
--- a/components/AuthGate.tsx
+++ b/components/AuthGate.tsx
@@ -4,6 +4,7 @@ import type { Session } from "@supabase/supabase-js";
 import { useRouter } from "next/navigation";
 import { useEffect, type ReactNode } from "react";
 import { ActionChrome } from "@/components/actions/ActionChrome";
+import { ChromeVisibilityProvider } from "@/components/actions/ChromeVisibility";
 import { QuickActionsProvider } from "@/components/actions/QuickActions";
 import { HomeSkeleton } from "@/components/home/HomeSkeleton";
 import { TabBar } from "@/components/nav/TabBar";
@@ -99,10 +100,12 @@ export function AuthGate({
     );
   return (
     <QuickActionsProvider baby={baby} member={member} userId={session.user.id}>
-      <SyncBarProvider userId={session.user.id}>
-        <div className="pb-[120px]">{content}</div>
-      </SyncBarProvider>
-      <ActionChrome babyName={baby.name} />
+      <ChromeVisibilityProvider>
+        <SyncBarProvider userId={session.user.id}>
+          <div className="pb-[120px]">{content}</div>
+        </SyncBarProvider>
+        <ActionChrome babyName={baby.name} />
+      </ChromeVisibilityProvider>
     </QuickActionsProvider>
   );
 }
diff --git a/components/actions/ActionChrome.tsx b/components/actions/ActionChrome.tsx
index 673a252..0521e62 100644
--- a/components/actions/ActionChrome.tsx
+++ b/components/actions/ActionChrome.tsx
@@ -3,21 +3,25 @@
 import { TabBar } from "@/components/nav/TabBar";
 import { pillTimer } from "@/lib/rules/timer";
 import { ActionSheet } from "./ActionSheet";
+import { useChromeHidden } from "./ChromeVisibility";
 import { useQuickActions } from "./QuickActions";
 
 // The tab bar with its "+" button and the 13-action sheet. The bar draws the
 // running timer in its Hôm nay tab (spec 2026-11-19 §4). Whether the sheet is
 // open lives in QuickActionsProvider, so a page (e.g. an empty Nhật ký) can
-// open it too.
+// open it too. A page can hide the bar and "+" (spec 2026-11-19 §6).
 export function ActionChrome({ babyName }: { babyName: string }) {
   const actions = useQuickActions();
+  const hidden = useChromeHidden();
   return (
     <>
-      <TabBar
-        onPlus={actions.toggleActionSheet}
-        plusOpen={actions.actionSheetOpen}
-        timer={pillTimer(actions.runningRows)}
-      />
+      {!hidden && (
+        <TabBar
+          onPlus={actions.toggleActionSheet}
+          plusOpen={actions.actionSheetOpen}
+          timer={pillTimer(actions.runningRows)}
+        />
+      )}
       <ActionSheet
         open={actions.actionSheetOpen}
         onClose={actions.closeActionSheet}
diff --git a/components/actions/ChromeVisibility.tsx b/components/actions/ChromeVisibility.tsx
new file mode 100644
index 0000000..4bc6cf2
--- /dev/null
+++ b/components/actions/ChromeVisibility.tsx
@@ -0,0 +1,55 @@
+"use client";
+
+import {
+  createContext,
+  useContext,
+  useLayoutEffect,
+  useMemo,
+  useState,
+  type ReactNode,
+} from "react";
+
+// Spec 2026-11-19 §6: a page can hide the tab bar and "+" while it shows a bar
+// of its own. AuthGate owns the flag; ActionChrome reads it.
+type Value = { hidden: boolean; setHidden: (hidden: boolean) => void };
+
+const ChromeVisibility = createContext<Value>({
+  hidden: false,
+  setHidden: () => {},
+});
+
+export function ChromeVisibilityProvider({
+  children,
+}: {
+  children: ReactNode;
+}) {
+  const [hidden, setHidden] = useState(false);
+  const value = useMemo(() => ({ hidden, setHidden }), [hidden]);
+  return (
+    <ChromeVisibility.Provider value={value}>
+      {children}
+    </ChromeVisibility.Provider>
+  );
+}
+
+export function useChromeHidden(): boolean {
+  return useContext(ChromeVisibility).hidden;
+}
+
+// The effect behind useHideChrome: raise the flag, lower it on cleanup.
+export function holdChromeHidden(
+  hide: boolean,
+  setHidden: (hidden: boolean) => void,
+): (() => void) | undefined {
+  if (!hide) return undefined;
+  setHidden(true);
+  return () => setHidden(false);
+}
+
+// Hides the chrome while `hide` is true and the page is mounted. A layout
+// effect: the flag is up before the first paint, so the tab bar never shows
+// over the page's own bar. The flag is one boolean, for one page at a time.
+export function useHideChrome(hide: boolean) {
+  const { setHidden } = useContext(ChromeVisibility);
+  useLayoutEffect(() => holdChromeHidden(hide, setHidden), [hide, setHidden]);
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/actions/chromevisibility.test.tsx components/actions/actionchrome.test.tsx && bun run typecheck`
Expected: `Tests  13 passed (13)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add -- components/AuthGate.tsx components/actions/ActionChrome.tsx components/actions/ChromeVisibility.tsx components/actions/actionchrome.test.tsx components/actions/chromevisibility.test.tsx
git commit -m "feat(actions): a page can hide the tab bar and the + button" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Chip triệu chứng theo nhóm gập mở (§6)

**Files:**

- Modify: `components/triage/SymptomChips.tsx`
- Modify: `components/triage/TriageScreen.tsx`
- Modify: `lib/rules/symptoms.ts`
- Test: `components/triage/triage.test.tsx` (sửa)
- Test: `lib/rules/symptoms.test.ts` (sửa)

**Interfaces:**

- Consumes: `FEVER_SYMPTOM`, `visibleSymptoms` (`lib/rules/symptoms.ts`); `TRIAGE.groups`; icon `chevronDown`, `chevronUp`; `findElements` (`components/ui/testTree.ts`).
- Produces: `pickedSymptomCount(chips, selected, feverLocked): number` và `toggled<T>(set, item): Set<T>` trong `lib/rules/symptoms.ts`; `SymptomChips` nhận thêm `openGroups: ReadonlySet<string>` và `onToggleGroup(code)`, mỗi hàng tiêu đề là `button` nằm trong `h3`, có `aria-expanded` và (khi mở) `aria-controls` trỏ tới khối chip `id="symptom-group-{code}"`; `TriageScreen` giữ state `openGroups` (rỗng lúc mở trang, rỗng lại khi bấm "Làm lại") và đổi dòng hướng dẫn.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/triage/triage.test.tsx b/components/triage/triage.test.tsx
index 3a8b5a9..c08e1fc 100644
--- a/components/triage/triage.test.tsx
+++ b/components/triage/triage.test.tsx
@@ -1,6 +1,7 @@
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it } from "vitest";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
 import { CONDITIONS } from "@/lib/content/conditions";
 import { TRIAGE } from "@/lib/content/triage";
 import {
@@ -41,7 +42,13 @@ describe("TriageScreen", () => {
     expect(html).not.toContain("bg-alarm");
     const age = ageDays(baby.dob, new Date());
     const chips = visibleSymptoms(TRIAGE.symptoms, age);
-    expect(html.match(/aria-pressed=/g)).toHaveLength(chips.length);
+    // Spec 2026-11-19 §6: every chip group starts closed.
+    const groups = new Set(chips.map((chip) => chip.group));
+    expect(html.match(/aria-expanded="false"/g)).toHaveLength(groups.size);
+    expect(html).not.toContain('aria-expanded="true"');
+    expect(html).not.toContain("aria-pressed=");
+    expect(html).toContain(">Mở nhóm rồi chạm để chọn, chọn được nhiều.</p>");
+    expect(html).not.toContain("Chạm để chọn, chọn được nhiều.");
     expect(html).toContain(">Bé đang có gì?</h2>");
     expect(html).toContain(">Có dấu hiệu nào dưới đây?</h2>");
     expect(html.indexOf("Bé đang có gì?")).toBeLessThan(
@@ -154,48 +161,131 @@ describe("TriageResult", () => {
   });
 });
 
-describe("SymptomChips (spec 2026-11-17 §6.1)", () => {
+// Spec 2026-11-19 §6: one glass list of groups that open and close.
+describe("SymptomChips", () => {
   const symptoms = TRIAGE.symptoms.filter((s) =>
     ["fever", "cough", "diaper_rash"].includes(s.code),
   );
-
-  it("groups wrapped multi-select chips, pressed ones inked with a tick", () => {
-    const html = renderToStaticMarkup(
+  const chips = ({
+    selected = [] as string[],
+    open = [] as string[],
+    feverLocked = false,
+  }) =>
+    renderToStaticMarkup(
       <SymptomChips
         groups={TRIAGE.groups}
         symptoms={symptoms}
-        selected={new Set(["cough"])}
-        feverLocked={false}
+        selected={new Set(selected)}
+        feverLocked={feverLocked}
+        openGroups={new Set(open)}
         onToggle={() => {}}
+        onToggleGroup={() => {}}
       />,
     );
-    expect(html.match(/role="group"/g)).toHaveLength(3);
-    expect(html).toContain('aria-label="Hô hấp"');
-    expect(html).toContain("flex flex-wrap gap-2");
+  // The markup of one group's header button, found by its name.
+  function header(html: string, name: string): string {
+    const buttons = html.match(/<button[^>]*aria-expanded.*?<\/button>/g);
+    return buttons?.find((button) => button.includes(`>${name}<`)) ?? "";
+  }
+
+  it("closed groups: one glass list, a 52 px header per group and no chips", () => {
+    const html = chips({});
     expect(html).toMatch(
-      /aria-pressed="true"[^>]*>✓ Ho<\/button>/,
+      /^<ul class="glass overflow-hidden rounded-\[22px\]">/,
+    );
+    expect(html.match(/aria-expanded="false"/g)).toHaveLength(3);
+    expect(html).not.toContain('aria-expanded="true"');
+    expect(html).not.toContain("aria-pressed");
+    expect(html).not.toContain('role="group"');
+    expect(html).not.toContain("đã chọn");
+    const resp = header(html, "Hô hấp");
+    expect(resp).toContain("min-h-[52px]");
+    expect(resp).toMatch(/text-base[^>]*>Hô hấp</);
+    expect(resp).toContain('d="m6 9 6 6 6-6"');
+  });
+
+  it("a closed group with picked chips shows how many in the badge", () => {
+    const html = chips({ selected: ["cough"] });
+    const resp = header(html, "Hô hấp");
+    expect(resp).toMatch(
+      /class="[^"]*\bbg-accent-tint\b[^"]*\btext-accent-text\b[^"]*">1 đã chọn<\/span>/,
     );
+    expect(resp).toMatch(/text-xs[^"]*font-bold[^>]*>1 đã chọn</);
+    expect(header(html, "Da")).not.toContain("đã chọn");
+    expect(html).not.toContain("aria-pressed");
+  });
+
+  it("an open group draws its chips with the classes they had", () => {
+    const html = chips({ selected: ["cough"], open: ["breathing"] });
+    const resp = header(html, "Hô hấp");
+    expect(resp).toContain('aria-expanded="true"');
+    expect(resp).toContain('d="m6 15 6-6 6 6"');
+    expect(header(html, "Da")).toContain('aria-expanded="false"');
+    expect(html.match(/role="group"/g)).toHaveLength(1);
+    expect(html).toContain('aria-label="Hô hấp"');
+    expect(html).toContain("flex flex-wrap gap-2");
+    expect(html).toMatch(/aria-pressed="true"[^>]*>✓ Ho<\/button>/);
     expect(html).toMatch(/class="[^"]*\bbg-ink\b[^"]*\btext-bg\b[^"]*">✓ Ho</);
+    expect(html).toContain("min-h-11");
+    expect(html).not.toContain(">Sốt hoặc sờ thấy nóng</button>");
+  });
+
+  it("several groups can be open at once", () => {
+    const html = chips({ open: ["fever", "breathing", "skin"] });
+    expect(html.match(/aria-expanded="true"/g)).toHaveLength(3);
+    expect(html.match(/role="group"/g)).toHaveLength(3);
     expect(html).toMatch(
       /aria-pressed="false"[^>]*glass[^>]*>Sốt hoặc sờ thấy nóng<\/button>/,
     );
-    expect(html).toContain("min-h-11");
     expect(html).not.toContain("Bật theo nhiệt độ đã nhập.");
   });
 
-  it("locks the fever chip on when the temperature is from 38°C", () => {
-    const html = renderToStaticMarkup(
-      <SymptomChips
-        groups={TRIAGE.groups}
-        symptoms={symptoms}
-        selected={new Set()}
-        feverLocked
-        onToggle={() => {}}
-      />,
+  it("a header sits in a heading and names the chips it opens", () => {
+    const closed = chips({});
+    expect(
+      closed.match(/<h3><button type="button" aria-expanded="false"/g),
+    ).toHaveLength(3);
+    expect(closed).not.toContain("aria-controls");
+    const open = chips({ open: ["breathing"] });
+    expect(open).toContain(
+      '<h3><button type="button" aria-expanded="true" aria-controls="symptom-group-breathing"',
     );
-    expect(html).toMatch(
+    expect(open).toContain('<div id="symptom-group-breathing"');
+    expect(open.match(/aria-controls=/g)).toHaveLength(1);
+  });
+
+  it("tapping a header asks to toggle that group and nothing else", () => {
+    const onToggle = vi.fn();
+    const onToggleGroup = vi.fn();
+    const headers = findElements(
+      SymptomChips({
+        groups: TRIAGE.groups,
+        symptoms,
+        selected: new Set(),
+        feverLocked: false,
+        openGroups: new Set(),
+        onToggle,
+        onToggleGroup,
+      }),
+      (el) => el.type === "button" && "aria-expanded" in el.props,
+    );
+    const shown = TRIAGE.groups.filter((group) =>
+      symptoms.some((symptom) => symptom.group === group.code),
+    );
+    expect(headers).toHaveLength(shown.length);
+    (headers[1].props.onClick as () => void)();
+    expect(onToggleGroup).toHaveBeenCalledExactlyOnceWith(shown[1].code);
+    expect(onToggle).not.toHaveBeenCalled();
+  });
+
+  it("the fever chip locked by the temperature counts, open or closed", () => {
+    const closed = chips({ feverLocked: true });
+    expect(header(closed, "Sốt")).toContain(">1 đã chọn</span>");
+    expect(closed).not.toContain("Bật theo nhiệt độ đã nhập.");
+    const open = chips({ feverLocked: true, open: ["fever"] });
+    expect(open).toMatch(
       /aria-pressed="true" aria-disabled="true"[^>]*>✓ Sốt hoặc sờ thấy nóng<\/button>/,
     );
-    expect(html).toContain(">Bật theo nhiệt độ đã nhập.</p>");
+    expect(open).toContain(">Bật theo nhiệt độ đã nhập.</p>");
   });
 });
diff --git a/lib/rules/symptoms.test.ts b/lib/rules/symptoms.test.ts
index 86ade2d..e8e46d9 100644
--- a/lib/rules/symptoms.test.ts
+++ b/lib/rules/symptoms.test.ts
@@ -8,7 +8,9 @@ import type {
 import {
   effectiveSymptoms,
   firstAidFor,
+  pickedSymptomCount,
   suggestConditions,
+  toggled,
   visibleSymptoms,
 } from "./symptoms";
 
@@ -166,3 +168,34 @@ describe("firstAidFor (spec 2026-11-17 §5.3)", () => {
     expect(codes(["infant_hot"], null, 200)).toEqual([]);
   });
 });
+
+describe("pickedSymptomCount (spec 2026-11-19 §6)", () => {
+  const chips = [s("fever", []), s("cough", []), s("vomit", [])];
+
+  it("counts the picked chips among the given ones", () => {
+    expect(pickedSymptomCount(chips, new Set(), false)).toBe(0);
+    expect(pickedSymptomCount(chips, new Set(["cough", "vomit"]), false)).toBe(
+      2,
+    );
+    expect(pickedSymptomCount(chips, new Set(["rash"]), false)).toBe(0);
+  });
+
+  it("counts the fever chip locked by the temperature once", () => {
+    expect(pickedSymptomCount(chips, new Set(), true)).toBe(1);
+    expect(pickedSymptomCount(chips, new Set(["fever"]), true)).toBe(1);
+    expect(pickedSymptomCount(chips, new Set(["cough"]), true)).toBe(2);
+  });
+
+  it("a locked fever does not count where there is no fever chip", () => {
+    expect(pickedSymptomCount([s("cough", [])], new Set(), true)).toBe(0);
+  });
+});
+
+describe("toggled", () => {
+  it("adds an item that is missing, removes one that is there, and leaves the input alone", () => {
+    const start: ReadonlySet<string> = new Set(["fever"]);
+    expect([...toggled(start, "skin")]).toEqual(["fever", "skin"]);
+    expect([...toggled(start, "fever")]).toEqual([]);
+    expect([...start]).toEqual(["fever"]);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/triage/triage.test.tsx lib/rules/symptoms.test.ts`
Expected: FAIL, `Tests  12 failed | 12 passed (24)`.

- [x] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/triage/SymptomChips.tsx b/components/triage/SymptomChips.tsx
index 9da95af..6332a81 100644
--- a/components/triage/SymptomChips.tsx
+++ b/components/triage/SymptomChips.tsx
@@ -1,70 +1,106 @@
+import { Icon } from "@/components/ui/Icon";
 import type { TriageSymptom } from "@/lib/content/triage";
-import { FEVER_SYMPTOM } from "@/lib/rules/symptoms";
+import { FEVER_SYMPTOM, pickedSymptomCount } from "@/lib/rules/symptoms";
 import { cx } from "@/lib/ui/cx";
 
-// Spec 2026-11-17 §6.1 (phương án A): wrapped multi-select chips, one block per group.
+// Spec 2026-11-19 §6: one glass list of groups; a group's chips show only
+// while it is open. Each header is a button inside a heading, the usual
+// accordion shape for screen readers. The chips are glass inside glass, so
+// globals.css drops their own blur.
 export function SymptomChips({
   groups,
   symptoms,
   selected,
   feverLocked,
+  openGroups,
   onToggle,
+  onToggleGroup,
 }: {
   groups: { code: string; name: string }[];
   symptoms: TriageSymptom[];
   selected: ReadonlySet<string>;
   feverLocked: boolean;
+  openGroups: ReadonlySet<string>;
   onToggle: (code: string) => void;
+  onToggleGroup: (code: string) => void;
 }) {
   return (
-    <div className="flex flex-col gap-3">
+    <ul className="glass overflow-hidden rounded-[22px]">
       {groups.map((group) => {
         const list = symptoms.filter((symptom) => symptom.group === group.code);
         if (list.length === 0) return null;
+        const open = openGroups.has(group.code);
+        const panelId = `symptom-group-${group.code}`;
+        const picked = pickedSymptomCount(list, selected, feverLocked);
         const hasLockedFever =
           feverLocked && list.some((symptom) => symptom.code === FEVER_SYMPTOM);
         return (
-          <section key={group.code} className="flex flex-col gap-2">
-            <h3 className="px-1 text-[13px] leading-[18px] font-semibold text-muted">
-              {group.name}
+          <li key={group.code} className="border-b border-line last:border-b-0">
+            <h3>
+              <button
+                type="button"
+                aria-expanded={open}
+                aria-controls={open ? panelId : undefined}
+                onClick={() => onToggleGroup(group.code)}
+                className="flex min-h-[52px] w-full items-center gap-3 px-4 py-1.5 text-left"
+              >
+                <span className="min-w-0 flex-1 text-base text-ink">
+                  {group.name}
+                </span>
+                {picked > 0 && (
+                  <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-bold whitespace-nowrap text-accent-text">
+                    {picked} đã chọn
+                  </span>
+                )}
+                <Icon
+                  name={open ? "chevronUp" : "chevronDown"}
+                  size={18}
+                  className="shrink-0 text-muted"
+                />
+              </button>
             </h3>
-            <div
-              role="group"
-              aria-label={group.name}
-              className="flex flex-wrap gap-2"
-            >
-              {list.map((symptom) => {
-                const locked = feverLocked && symptom.code === FEVER_SYMPTOM;
-                const on = locked || selected.has(symptom.code);
-                return (
-                  <button
-                    key={symptom.code}
-                    type="button"
-                    aria-pressed={on}
-                    aria-disabled={locked || undefined}
-                    onClick={() => {
-                      if (!locked) onToggle(symptom.code);
-                    }}
-                    className={cx(
-                      "min-h-11 rounded-full px-4 text-left text-[15px]",
-                      on
-                        ? "bg-ink text-bg font-semibold"
-                        : "glass font-medium text-ink",
-                    )}
-                  >
-                    {on ? `✓ ${symptom.text}` : symptom.text}
-                  </button>
-                );
-              })}
-            </div>
-            {hasLockedFever && (
-              <p className="px-1 text-[13px] text-muted">
-                Bật theo nhiệt độ đã nhập.
-              </p>
+            {open && (
+              <div id={panelId} className="flex flex-col gap-2 px-4 pb-4">
+                <div
+                  role="group"
+                  aria-label={group.name}
+                  className="flex flex-wrap gap-2"
+                >
+                  {list.map((symptom) => {
+                    const locked =
+                      feverLocked && symptom.code === FEVER_SYMPTOM;
+                    const on = locked || selected.has(symptom.code);
+                    return (
+                      <button
+                        key={symptom.code}
+                        type="button"
+                        aria-pressed={on}
+                        aria-disabled={locked || undefined}
+                        onClick={() => {
+                          if (!locked) onToggle(symptom.code);
+                        }}
+                        className={cx(
+                          "min-h-11 rounded-full px-4 text-left text-[15px]",
+                          on
+                            ? "bg-ink text-bg font-semibold"
+                            : "glass font-medium text-ink",
+                        )}
+                      >
+                        {on ? `✓ ${symptom.text}` : symptom.text}
+                      </button>
+                    );
+                  })}
+                </div>
+                {hasLockedFever && (
+                  <p className="px-1 text-[13px] text-muted">
+                    Bật theo nhiệt độ đã nhập.
+                  </p>
+                )}
+              </div>
             )}
-          </section>
+          </li>
         );
       })}
-    </div>
+    </ul>
   );
 }
diff --git a/components/triage/TriageScreen.tsx b/components/triage/TriageScreen.tsx
index 77e8e92..b3b7044 100644
--- a/components/triage/TriageScreen.tsx
+++ b/components/triage/TriageScreen.tsx
@@ -18,6 +18,7 @@ import {
   firstAidFor,
   type Suggestion,
   suggestConditions,
+  toggled,
   visibleSymptoms,
 } from "@/lib/rules/symptoms";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
@@ -49,6 +50,8 @@ export function TriageScreen({ baby }: { baby: Baby }) {
   const [celsius, setCelsius] = useState<string | null>(null);
   const [checked, setChecked] = useState<Set<string>>(new Set());
   const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
+  // Spec 2026-11-19 §6: the chip groups that are open; all closed at first.
+  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
   const [error, setError] = useState<string | null>(null);
   const [outcome, setOutcome] = useState<Outcome | null>(null);
   // Step 1 (spec gốc §6.6): prefilled from a temperature logged in the last 6 hours, editable.
@@ -83,6 +86,10 @@ export function TriageScreen({ baby }: { baby: Baby }) {
     });
   }
 
+  function toggleGroup(code: string) {
+    setOpenGroups((prev) => toggled(prev, code));
+  }
+
   function submit() {
     const parsed = parseCelsius(temperature);
     if (parsed === "bad") {
@@ -133,6 +140,7 @@ export function TriageScreen({ baby }: { baby: Baby }) {
             setOutcome(null);
             setChecked(new Set());
             setSymptoms(new Set());
+            setOpenGroups(new Set());
             setCelsius(null);
             setError(null);
             window.scrollTo({ top: 0 });
@@ -170,14 +178,18 @@ export function TriageScreen({ baby }: { baby: Baby }) {
             <h2 className="text-xl leading-[26px] font-bold text-ink">
               Bé đang có gì?
             </h2>
-            <p className="text-sm text-muted">Chạm để chọn, chọn được nhiều.</p>
+            <p className="text-sm text-muted">
+              Mở nhóm rồi chạm để chọn, chọn được nhiều.
+            </p>
           </div>
           <SymptomChips
             groups={TRIAGE.groups}
             symptoms={chips}
             selected={symptoms}
             feverLocked={feverLocked}
+            openGroups={openGroups}
             onToggle={toggleSymptom}
+            onToggleGroup={toggleGroup}
           />
           <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
             Có dấu hiệu nào dưới đây?
diff --git a/lib/rules/symptoms.ts b/lib/rules/symptoms.ts
index 15da5c8..ced3d49 100644
--- a/lib/rules/symptoms.ts
+++ b/lib/rules/symptoms.ts
@@ -46,6 +46,26 @@ export function effectiveSymptoms(
   return out;
 }
 
+// Spec 2026-11-19 §6: how many of these chips show as picked, the fever chip
+// locked by the temperature included.
+export function pickedSymptomCount(
+  chips: TriageSymptom[],
+  selected: ReadonlySet<string>,
+  feverLocked: boolean,
+): number {
+  return chips.filter(
+    (chip) =>
+      selected.has(chip.code) || (feverLocked && chip.code === FEVER_SYMPTOM),
+  ).length;
+}
+
+// A copy of the set with the item added, or removed if it was there.
+export function toggled<T>(set: ReadonlySet<T>, item: T): Set<T> {
+  const next = new Set(set);
+  if (!next.delete(item)) next.add(item);
+  return next;
+}
+
 // Spec 2026-11-17 §5.2: each selected symptom gives 1/n to each of its n articles.
 export function suggestConditions(input: {
   symptoms: TriageSymptom[];
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/triage/triage.test.tsx lib/rules/symptoms.test.ts && bun run typecheck`
Expected: `Tests  24 passed (24)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add -- components/triage/SymptomChips.tsx components/triage/TriageScreen.tsx lib/rules/symptoms.ts components/triage/triage.test.tsx lib/rules/symptoms.test.ts
git commit -m "feat(triage): symptom chips in groups that open and close" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm giữa chừng M4a

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m4a.md` (tick các ô)

**Interfaces:**

- Consumes: mọi thứ Task 1–2 tạo ra.
- Produces: nhánh `feat/kim-bun-ux-mobile-m4a` làm nền cho M4b. Nhánh này không lên `main` trước khi M4b xong.

- [x] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  158 passed (158)`, `Tests  1138 passed (1138)`.

- [x] **Step 2: Commit phần tick**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m4a.md
git commit -m "docs(plan): tick the M4a steps" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```
