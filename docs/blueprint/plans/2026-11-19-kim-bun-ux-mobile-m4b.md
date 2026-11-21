# Kim Bun — UX mobile M4b: thanh kết quả dính đáy của Triệu chứng Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§6: thanh kết quả, bỏ hai nút cuối form, ẩn thanh tab, đệm đáy, cuộn về đầu khi nhiệt độ sai; phần tương ứng của §11.1 và §11.2)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Nút "Xem kết quả" và nút gọi 115 luôn nằm trong tầm ngón cái trên một thanh dính đáy thay cho thanh tab, khung chờ của trang Hôm nay khớp với trang, rồi cả M4 lên `main`.

**Architecture:**

- **Luật thuần** (`lib/rules/symptoms.ts`): `triageAnswerCount` cho số trên nút kết quả.
- **Giao diện:** `ResultBar` là thanh `fixed` cùng chỗ với thanh tab; `TriageScreen` bật cờ ẩn thanh tab khi chưa có kết quả và bỏ hai nút cuối form.
- **Sửa kèm (Task 2):** khung chờ của trang Hôm nay vẽ theo trang sau M2.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m4b`, cắt từ `feat/kim-bun-ux-mobile-m4a`. Baseline: 1138 test vitest xanh (158 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a, M2b, M2c | §3 trang Hôm nay | đã xong, đã lên `main` @ `e1e729f` |
| M6 | phần còn lại của §8 Thống kê | đã xong, đã lên `main` @ `34f18f6` |
| M5a, M5b, M5c | §7 Tiêm chủng (bảng vắc xin × mũi), §9 Khám phá | đã xong, đã lên `main` @ `2448528` |
| M3a, M3b | §4 timer trong thanh tab, §5.4 sheet "+" | đã xong, đã lên `main` @ `4a443df` |
| M4a | §6: cờ ẩn thanh tab, nhóm chip gập mở | `2026-11-19-kim-bun-ux-mobile-m4a.md` |
| **M4b (plan này)** | §6: thanh kết quả dính đáy; khung chờ của trang Hôm nay | `2026-11-19-kim-bun-ux-mobile-m4b.md` |
| Kết | §11.3 bước 36 của checklist thiết bị | làm sau cùng |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Số trên nút kết quả** chỉ tính chip và công tắc đang được hiện cho tuổi của bé (`visibleSymptoms`, `visibleQuestions`). Chip sốt bị khoá tính một lần dù người dùng cũng đã chọn nó trước đó.
2. **Thanh kết quả:** `z-10` và bóng đổ như thanh tab, `print:hidden`; icon điện thoại 24 px; chữ trên nút không xuống dòng. Thanh cao 70 px (nút 56 px, padding 6 px, viền 1 px của `glass-strong`), cao hơn thanh tab (62 px) 8 px. Toast nằm cách đáy thanh 74 px nên còn hở 4 px phía trên thanh kết quả.
3. **Phần đệm đáy:** không thêm đệm mới. 120 px của `AuthGate` cộng 16 px của trang là 136 px, lớn hơn mép trên của thanh (26 + 70 = 96 px; trên máy có tai thỏ là 44 + 70 = 114 px).
4. **Cuộn về đầu khi nhiệt độ sai** dùng `window.scrollTo({ top: 0 })`, không có hiệu ứng trượt, giống lúc hiện kết quả.
5. **Nút 115 ở đầu trang** (`Call115Button` trong thẻ đầu) giữ nguyên; chỉ nút 115 ở cuối form bị bỏ.
6. **Chưa có unit test cho việc thanh tab hiện lại khi đã có kết quả** (`useHideChrome` nhận `false`). Test của repo dựng HTML tĩnh, không dựng lại sau khi state đổi. Phần có unit test: lúc chưa có kết quả hook nhận `true`; `holdChromeHidden(false, …)` không đụng cờ và hàm dọn dẹp hạ cờ. Phần còn lại kiểm trên trình duyệt ở Step 3 mục 6 và ở bước 36 của checklist thiết bị.
7. **Task 2 không thuộc §6 và spec không nhắc tới khung chờ.** Sau M2 (§3) thẻ lớn của trang Hôm nay thấp hơn nhiều, nhưng `HomeSkeleton` vẫn vẽ thẻ 300 px và thiếu hàng ô trạng thái cùng hai hàng nút, nên trang nhảy khi tải xong. Task này vẽ lại khung chờ theo số đo trên trang thật. Khung chờ không thể khớp mọi trạng thái: thẻ lớn thật cao 104 px lúc bé thức, khoảng 110 px lúc timer chạy và 192 px lúc trễ cữ bú; khung chờ dùng mức thấp nhất. Việc này đã được ghi là "làm kèm M4" từ lúc kiểm M2; báo cho người dùng trong báo cáo cuối.
8. **Kiểm trình duyệt** do phiên chính làm bằng khung Browser trong app ở 375×812. §11.2 yêu cầu hỏi người dùng trước mỗi phiên dùng khung này: người dùng đã chọn khung này cho phiên làm việc hiện tại (2026-11-19) và đã đăng nhập lại ở đó ngày 2026-11-21. Nếu plan được làm ở một phiên khác thì phải hỏi lại trước khi mở khung; người dùng từ chối thì ghi "chưa kiểm" cho cả Step 3.

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
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m4b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên bản sao của `main` @ `4a443df` đã có M4a, ở ngoài repo; trong bản chạy thử mỗi task là hai commit (test trước, code sau). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task và tổng cả bộ ở Task 3 đều đo trên bản sao đó. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status).
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.
- **Lên `main` một lần.** M4a nằm trên nhánh cho tới khi M4b xong; `main` nhận cả hai ở cuối M4b. Lý do: sau M4a trang Triệu chứng vẫn còn hai nút ở cuối form và chưa có thanh kết quả, và phần kiểm trình duyệt của cả mốc nằm ở cuối M4b. Người dùng nói "plan nào xong phần nào thì commit push main luôn"; ở đây "phần" được hiểu là cả mốc M4. Báo lại điều này trong báo cáo cuối.
- **Quyền đẩy `main`.** Mục Global Constraints bên trên chép nguyên văn §2 của spec, trong đó mỗi lần đẩy `main` cần người dùng đồng ý. Với 6 mốc của spec này, lời đồng ý trước ở dòng Status thay cho việc hỏi từng lần. Mọi việc đẩy khác vẫn theo §2.
- **Đã qua một vòng review.** Bản chạy thử đầu được một reviewer độc lập đọc; các sửa đổi theo góp ý đó (layout effect, hàng tiêu đề trong `h3`, hàm `toggled`, test chặt hơn, khung chờ có hàng tiêu đề) đã nằm trong các patch của hai plan này.

## Contracts with Other Plans

Plan này đứng ngay sau M4a và là plan code cuối của spec; sau nó chỉ còn bước 36 của checklist thiết bị.

**Consumes:**

- Từ M4a: `useHideChrome`; `pickedSymptomCount`; `SymptomChips` với `openGroups`.
- Từ M3a: `components/nav/TabBar.tsx`: `TabBarView`, `nav` có `aria-label="Điều hướng chính"` và lớp vị trí `fixed inset-x-4 bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)] z-10 mx-auto … max-w-md`.
- `components/AuthGate.tsx`: nội dung có `pb-[120px]`; `GateLoading`. `lib/rules/triage.ts`: `visibleQuestions`, `evaluateTriage`, `parseCelsius`.
- Từ M2: bố cục trang Hôm nay.

**Produces:**

- `lib/rules/symptoms.ts`: `triageAnswerCount`.
- `components/triage/ResultBar.tsx`: `ResultBar`.
- `components/home/HomeSkeleton.tsx` và `GateLoading` theo kích thước trang hiện tại.
- **Vitest sau M4:** 1149 test, 158 file.

---

### Task 1: Thanh kết quả dính đáy thay cho thanh tab (§6)

**Files:**

- Create: `components/triage/ResultBar.tsx`
- Modify: `components/triage/TriageScreen.tsx`
- Modify: `lib/rules/symptoms.ts`
- Test: `components/triage/triage.test.tsx` (sửa)
- Test: `lib/rules/symptoms.test.ts` (sửa)

**Interfaces:**

- Consumes: `useHideChrome` (M4a); `pickedSymptomCount` (M4a); `visibleQuestions`; `TabBarView` (`components/nav/TabBar.tsx`, test đọc lớp vị trí từ markup của nó).
- Produces: `triageAnswerCount(input): number` trong `lib/rules/symptoms.ts`; `components/triage/ResultBar.tsx` với `ResultBar({ count, onSubmit })`; `TriageScreen` gọi `useHideChrome(outcome === null)`, bỏ hai nút cuối form, cuộn về đầu trang khi nhiệt độ sai.

- [ ] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m4b feat/kim-bun-ux-mobile-m4a
```

- [ ] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/triage/triage.test.tsx b/components/triage/triage.test.tsx
index c08e1fc..f2dfe44 100644
--- a/components/triage/triage.test.tsx
+++ b/components/triage/triage.test.tsx
@@ -1,20 +1,69 @@
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it, vi } from "vitest";
+import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
+import { TabBarView } from "@/components/nav/TabBar";
 import { findElements } from "@/components/ui/testTree";
 import { CONDITIONS } from "@/lib/content/conditions";
 import { TRIAGE } from "@/lib/content/triage";
+import { logsKey } from "@/lib/data/logs";
 import {
   visibleQuestions,
   type TriageResult as Result,
 } from "@/lib/rules/triage";
 import { visibleSymptoms } from "@/lib/rules/symptoms";
 import { ageDays } from "@/lib/rules/time";
-import type { Baby } from "@/lib/supabase/rows";
+import type { Baby, LogRow } from "@/lib/supabase/rows";
 import { SymptomChips } from "./SymptomChips";
 import { TriageResult } from "./TriageResult";
 import { TriageScreen } from "./TriageScreen";
 
+// Spec 2026-11-19 §6: what TriageScreen asks of the chrome and gives the bar.
+const state = vi.hoisted(() => ({
+  hideChrome: undefined as boolean | undefined,
+  bar: null as { count: number; onSubmit: () => void } | null,
+  // Makes the temperature field read as invalid.
+  badTemperature: false,
+  // How many times a result was worked out.
+  evaluated: 0,
+}));
+vi.mock("@/components/actions/ChromeVisibility", () => ({
+  useHideChrome: (hide: boolean) => {
+    state.hideChrome = hide;
+  },
+}));
+vi.mock("./ResultBar", async (importOriginal) => {
+  const actual = await importOriginal<typeof import("./ResultBar")>();
+  type Props = Parameters<typeof actual.ResultBar>[0];
+  return {
+    ResultBar: (props: Props) => {
+      state.bar = props;
+      return actual.ResultBar(props);
+    },
+  };
+});
+vi.mock("@/lib/rules/triage", async (importOriginal) => {
+  const actual = await importOriginal<typeof import("@/lib/rules/triage")>();
+  return {
+    ...actual,
+    parseCelsius: (raw: string) =>
+      state.badTemperature ? "bad" : actual.parseCelsius(raw),
+    evaluateTriage: (...args: Parameters<typeof actual.evaluateTriage>) => {
+      state.evaluated += 1;
+      return actual.evaluateTriage(...args);
+    },
+  };
+});
+
+beforeEach(() => {
+  state.hideChrome = undefined;
+  state.bar = null;
+  state.badTemperature = false;
+  state.evaluated = 0;
+});
+afterEach(() => {
+  vi.unstubAllGlobals();
+});
+
 const baby = {
   id: "b1",
   family_id: "f1",
@@ -22,13 +71,19 @@ const baby = {
   dob: "2026-09-10",
 } as Baby;
 
+function renderScreen(logs: LogRow[] = []) {
+  const client = new QueryClient();
+  client.setQueryData(logsKey("b1"), logs);
+  return renderToStaticMarkup(
+    <QueryClientProvider client={client}>
+      <TriageScreen baby={baby} />
+    </QueryClientProvider>,
+  );
+}
+
 describe("TriageScreen", () => {
-  it("a glass temperature card, one switch per visible question, a large Xem kết quả and the 115 pill", () => {
-    const html = renderToStaticMarkup(
-      <QueryClientProvider client={new QueryClient()}>
-        <TriageScreen baby={baby} />
-      </QueryClientProvider>,
-    );
+  it("a glass temperature card, one switch per visible question and the 115 pill", () => {
+    const html = renderScreen();
     const visible = visibleQuestions(
       TRIAGE.questions,
       ageDays(baby.dob, new Date()),
@@ -37,7 +92,6 @@ describe("TriageScreen", () => {
     expect(html.match(/role="switch"/g)).toHaveLength(visible.length);
     expect(html).not.toContain('type="checkbox"');
     expect(html).toContain('inputMode="decimal"');
-    expect(html).toMatch(/min-h-\[50px\][^>]*>Xem kết quả<\/button>/);
     expect(html).toContain("bg-danger-solid");
     expect(html).not.toContain("bg-alarm");
     const age = ageDays(baby.dob, new Date());
@@ -56,6 +110,122 @@ describe("TriageScreen", () => {
     );
     expect(html).not.toContain("Đánh dấu những gì bé đang có:");
   });
+
+  // Spec 2026-11-19 §6.
+  it("the result bar replaces the buttons at the end of the form", () => {
+    const html = renderScreen();
+    expect(state.bar?.count).toBe(0);
+    expect(html).not.toContain("min-h-[50px]");
+    expect(html.match(/>Xem kết quả<\/button>/g)).toHaveLength(1);
+    // The 115 pill at the top and the round 115 button of the bar.
+    expect(html.match(/href="tel:115"/g)).toHaveLength(2);
+    expect(html.match(/>Gọi cấp cứu 115<\/span>/g)).toHaveLength(1);
+    expect(html.indexOf(">Gọi cấp cứu 115</span>")).toBeLessThan(
+      html.indexOf(">Có dấu hiệu nào dưới đây?</h2>"),
+    );
+    expect(html.match(/aria-label="Gọi cấp cứu 115"/g)).toHaveLength(1);
+  });
+
+  it("hides the tab bar and + while there is no result", () => {
+    renderScreen();
+    expect(state.hideChrome).toBe(true);
+  });
+
+  it("the bar counts the fever chip locked by a logged temperature", () => {
+    const at = new Date(Date.now() - 3_600_000).toISOString();
+    const fever = {
+      id: "c1",
+      baby_id: "b1",
+      type: "temperature",
+      started_at: at,
+      ended_at: at,
+      details: { celsius: 38.5, method: "nach" },
+      note: null,
+      created_by: "u1",
+      created_at: at,
+      updated_at: at,
+    } as LogRow;
+    const html = renderScreen([fever]);
+    expect(state.bar?.count).toBe(1);
+    expect(html).toContain(">Xem kết quả · đã chọn 1</button>");
+  });
+
+  it("Xem kết quả with a bad temperature scrolls to the top and works out nothing", () => {
+    const scrollTo = vi.fn();
+    vi.stubGlobal("window", { scrollTo });
+    state.badTemperature = true;
+    renderScreen();
+    state.bar?.onSubmit();
+    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 });
+    expect(state.evaluated).toBe(0);
+  });
+
+  it("Xem kết quả with a valid temperature works out the result", () => {
+    const scrollTo = vi.fn();
+    vi.stubGlobal("window", { scrollTo });
+    renderScreen();
+    state.bar?.onSubmit();
+    expect(state.evaluated).toBe(1);
+    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0 });
+  });
+});
+
+// Spec 2026-11-19 §6.
+describe("ResultBar", () => {
+  const bar = async (count: number) => {
+    const { ResultBar } =
+      await vi.importActual<typeof import("./ResultBar")>("./ResultBar");
+    return renderToStaticMarkup(
+      <ResultBar count={count} onSubmit={() => {}} />,
+    );
+  };
+
+  it("sits where the tab bar sits, a fully round glass-strong bar", async () => {
+    const html = await bar(0);
+    const outer = html.slice(0, html.indexOf(">")).split(/[" ]/);
+    // The classes that place the tab bar, read from its own markup.
+    const nav = renderToStaticMarkup(<TabBarView current={null} />);
+    const place = (/<nav[^>]* class="([^"]*)"/.exec(nav)?.[1] ?? "")
+      .split(" ")
+      .filter((name) =>
+        /^(fixed|inset-|bottom-|z-|mx-auto|max-w-|print:)/.test(name),
+      );
+    expect(place).toEqual([
+      "fixed",
+      "inset-x-4",
+      "bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)]",
+      "z-10",
+      "mx-auto",
+      "max-w-md",
+      "print:hidden",
+    ]);
+    for (const name of [
+      ...place,
+      "glass-strong",
+      "rounded-full",
+      "p-1.5",
+      "gap-2",
+    ])
+      expect(outer).toContain(name);
+  });
+
+  it("a round 56 px 115 link, then the primary button", async () => {
+    const html = await bar(0);
+    expect(html).toMatch(
+      /<a href="tel:115" aria-label="Gọi cấp cứu 115" class="[^"]*\bsize-14\b[^"]*\brounded-full\b[^"]*\bbg-danger-solid text-on-danger\b[^"]*">/,
+    );
+    expect(html).toContain('d="M22 16.9v3');
+    expect(html.indexOf('href="tel:115"')).toBeLessThan(
+      html.indexOf("<button"),
+    );
+    expect(html).toMatch(
+      /<button type="button" class="[^"]*\bh-14\b[^"]*\bflex-1\b[^"]*\bbg-accent text-on-accent\b[^"]*">Xem kết quả<\/button>/,
+    );
+  });
+
+  it("says how many answers are picked once there are some", async () => {
+    expect(await bar(3)).toContain(">Xem kết quả · đã chọn 3</button>");
+  });
 });
 
 describe("TriageResult", () => {
diff --git a/lib/rules/symptoms.test.ts b/lib/rules/symptoms.test.ts
index e8e46d9..9ba8da6 100644
--- a/lib/rules/symptoms.test.ts
+++ b/lib/rules/symptoms.test.ts
@@ -11,6 +11,7 @@ import {
   pickedSymptomCount,
   suggestConditions,
   toggled,
+  triageAnswerCount,
   visibleSymptoms,
 } from "./symptoms";
 
@@ -199,3 +200,35 @@ describe("toggled", () => {
     expect([...start]).toEqual(["fever"]);
   });
 });
+
+describe("triageAnswerCount (spec 2026-11-19 §6)", () => {
+  const chips = [s("fever", []), s("cough", [])];
+  const questions = [q("convulsion"), q("blue_lips")];
+  const count = (
+    selected: string[],
+    feverLocked: boolean,
+    checked: string[],
+  ) =>
+    triageAnswerCount({
+      chips,
+      selected: new Set(selected),
+      feverLocked,
+      questions,
+      checked: new Set(checked),
+    });
+
+  it("is 0 with nothing picked", () => {
+    expect(count([], false, [])).toBe(0);
+  });
+
+  it("adds the picked chips, the locked fever chip and the switches on", () => {
+    expect(count(["cough"], false, [])).toBe(1);
+    expect(count([], true, [])).toBe(1);
+    expect(count([], false, ["convulsion", "blue_lips"])).toBe(2);
+    expect(count(["cough"], true, ["convulsion"])).toBe(3);
+  });
+
+  it("ignores codes that are not among the chips or questions shown", () => {
+    expect(count(["rash"], false, ["infant_hot"])).toBe(0);
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/triage/triage.test.tsx lib/rules/symptoms.test.ts`
Expected: FAIL, `Tests  11 failed | 24 passed (35)`.

- [ ] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/triage/ResultBar.tsx b/components/triage/ResultBar.tsx
new file mode 100644
index 0000000..c536d36
--- /dev/null
+++ b/components/triage/ResultBar.tsx
@@ -0,0 +1,31 @@
+import { Icon } from "@/components/ui/Icon";
+
+// Spec 2026-11-19 §6: in place of the tab bar while there is no result, with
+// the same position, width and shadow.
+export function ResultBar({
+  count,
+  onSubmit,
+}: {
+  // Picked chips (the locked fever chip included) plus switches that are on.
+  count: number;
+  onSubmit: () => void;
+}) {
+  return (
+    <div className="glass-strong fixed inset-x-4 bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)] z-10 mx-auto flex max-w-md items-center gap-2 rounded-full p-1.5 shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=dark]:shadow-[0_10px_30px_rgb(0_0_0/0.25)] in-data-[theme=night]:shadow-none print:hidden">
+      <a
+        href="tel:115"
+        aria-label="Gọi cấp cứu 115"
+        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-danger-solid text-on-danger transition-transform duration-[120ms] active:scale-[0.97]"
+      >
+        <Icon name="phone" size={24} />
+      </a>
+      <button
+        type="button"
+        onClick={onSubmit}
+        className="flex h-14 min-w-0 flex-1 items-center justify-center rounded-full bg-accent text-on-accent px-5 text-base font-semibold whitespace-nowrap transition-transform duration-[120ms] active:scale-[0.97]"
+      >
+        {count > 0 ? `Xem kết quả · đã chọn ${count}` : "Xem kết quả"}
+      </button>
+    </div>
+  );
+}
diff --git a/components/triage/TriageScreen.tsx b/components/triage/TriageScreen.tsx
index b3b7044..afb3c7d 100644
--- a/components/triage/TriageScreen.tsx
+++ b/components/triage/TriageScreen.tsx
@@ -1,9 +1,9 @@
 "use client";
 
 import { useState } from "react";
+import { useHideChrome } from "@/components/actions/ChromeVisibility";
 import { Call115Button } from "@/components/emergency/CallList";
 import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
-import { Button } from "@/components/ui/Button";
 import { Glass } from "@/components/ui/Glass";
 import { ListGroup } from "@/components/ui/ListGroup";
 import { PageHeader } from "@/components/ui/PageHeader";
@@ -19,6 +19,7 @@ import {
   type Suggestion,
   suggestConditions,
   toggled,
+  triageAnswerCount,
   visibleSymptoms,
 } from "@/lib/rules/symptoms";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
@@ -32,6 +33,7 @@ import {
   type TriageResult as Result,
 } from "@/lib/rules/triage";
 import type { Baby } from "@/lib/supabase/rows";
+import { ResultBar } from "./ResultBar";
 import { SymptomChips } from "./SymptomChips";
 import { TriageResult } from "./TriageResult";
 
@@ -54,6 +56,9 @@ export function TriageScreen({ baby }: { baby: Baby }) {
   const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
   const [error, setError] = useState<string | null>(null);
   const [outcome, setOutcome] = useState<Outcome | null>(null);
+  // Spec 2026-11-19 §6: the result bar takes the tab bar's place until there
+  // is a result; leaving the page shows the tab bar again.
+  useHideChrome(outcome === null);
   // Step 1 (spec gốc §6.6): prefilled from a temperature logged in the last 6 hours, editable.
   const temperature =
     celsius ?? (logged === null ? "" : String(logged).replace(".", ","));
@@ -61,6 +66,13 @@ export function TriageScreen({ baby }: { baby: Baby }) {
   const feverLocked = parsedNow !== "bad" && hasFever(parsedNow);
   const questions = visibleQuestions(TRIAGE.questions, age);
   const chips = visibleSymptoms(TRIAGE.symptoms, age);
+  const answers = triageAnswerCount({
+    chips,
+    selected: symptoms,
+    feverLocked,
+    questions,
+    checked,
+  });
   const wet = wetDiapersInWindow(logs.data ?? [], now);
   const diapersLogged = (logs.data ?? []).some(
     (log) =>
@@ -94,6 +106,8 @@ export function TriageScreen({ baby }: { baby: Baby }) {
     const parsed = parseCelsius(temperature);
     if (parsed === "bad") {
       setError("Nhiệt độ từ 30 đến 43°C, ví dụ 38,5.");
+      // Spec 2026-11-19 §6: the error line is in the first card.
+      window.scrollTo({ top: 0 });
       return;
     }
     setError(null);
@@ -121,6 +135,9 @@ export function TriageScreen({ baby }: { baby: Baby }) {
     window.scrollTo({ top: 0 });
   }
 
+  // Bottom room for the result bar (Spec 2026-11-19 §6): AuthGate's 120 px
+  // plus pb-4 clear its 70 px (56 px buttons, 6 px padding, 1 px border), also
+  // when it sits 44 px above the bottom on a notched phone.
   return (
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
@@ -226,10 +243,7 @@ export function TriageScreen({ baby }: { baby: Baby }) {
               </ListGroup>
             );
           })}
-          <Button size="lg" block onClick={submit}>
-            Xem kết quả
-          </Button>
-          <Call115Button label="Gọi cấp cứu 115" />
+          <ResultBar count={answers} onSubmit={submit} />
         </>
       )}
     </main>
diff --git a/lib/rules/symptoms.ts b/lib/rules/symptoms.ts
index ced3d49..7bbb246 100644
--- a/lib/rules/symptoms.ts
+++ b/lib/rules/symptoms.ts
@@ -59,6 +59,22 @@ export function pickedSymptomCount(
   ).length;
 }
 
+// Spec 2026-11-19 §6: n on the result bar, the picked chips (the locked fever
+// chip included) plus the switches that are on, among those shown.
+export function triageAnswerCount(input: {
+  chips: TriageSymptom[];
+  selected: ReadonlySet<string>;
+  feverLocked: boolean;
+  questions: TriageQuestion[];
+  checked: ReadonlySet<string>;
+}): number {
+  const { chips, selected, feverLocked, questions, checked } = input;
+  return (
+    pickedSymptomCount(chips, selected, feverLocked) +
+    questions.filter((question) => checked.has(question.code)).length
+  );
+}
+
 // A copy of the set with the item added, or removed if it was there.
 export function toggled<T>(set: ReadonlySet<T>, item: T): Set<T> {
   const next = new Set(set);
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/triage/triage.test.tsx lib/rules/symptoms.test.ts && bun run typecheck`
Expected: `Tests  35 passed (35)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- components/triage/ResultBar.tsx components/triage/TriageScreen.tsx lib/rules/symptoms.ts components/triage/triage.test.tsx lib/rules/symptoms.test.ts
git commit -m "feat(triage): a result bar pinned to the bottom in place of the tab bar" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Khung chờ của trang Hôm nay theo đúng trang hiện tại (ngoài §6, xem Diễn giải 7)

**Files:**

- Modify: `components/AuthGate.tsx`
- Modify: `components/home/HomeSkeleton.tsx`
- Test: `components/auth/gate.test.tsx` (sửa)
- Test: `components/home/homescreen.test.tsx` (sửa)

**Interfaces:**

- Consumes: Kích thước trang Hôm nay đo trên trang thật ngày 2026-11-21 ở 375 px: khoảng cách 14 px; thẻ lớn 104 px ở dạng thấp nhất; ba ô trạng thái 80 px; hai hàng nút (nhãn 18 px, cách 10 px, hàng nút 80 px); mục "24 giờ qua" và "Gần đây" mỗi mục có hàng tiêu đề 44 px; ba ô số 96,5 px. `Skeleton`.
- Produces: `HomeSkeleton` vẽ: thẻ lớn 104 px, ba ô 80 px, hai hàng (nhãn 18 px và 5 ô tròn 58 px trong ô cao 80 px), rồi hai mục có hàng tiêu đề 44 px: ba ô số 96 px, và bốn hàng danh sách 60 px. `GateLoading` dùng khoảng cách 14 px.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/auth/gate.test.tsx b/components/auth/gate.test.tsx
index cca81eb..01c7b50 100644
--- a/components/auth/gate.test.tsx
+++ b/components/auth/gate.test.tsx
@@ -7,9 +7,16 @@ import { NotInvited } from "./NotInvited";
 describe("AuthGate states", () => {
   it("loading draws the home page's shapes, not text", () => {
     const html = renderToStaticMarkup(<GateLoading />);
-    expect(html).toContain('aria-busy="true"');
-    expect(html).toContain("h-[300px]");
-    expect(html.match(/kb-pulse/g)?.length).toBeGreaterThanOrEqual(9);
+    expect(html).toMatch(/^<main aria-busy="true" class="[^"]*\bgap-3\.5\b/);
+    expect(html).not.toContain("gap-[18px]");
+    // The header bar, then the shapes of the current home page.
+    expect(html.indexOf("h-11 w-48 rounded-full")).toBeGreaterThan(-1);
+    expect(html.indexOf("h-11 w-48 rounded-full")).toBeLessThan(
+      html.indexOf("h-[104px] rounded-[32px]"),
+    );
+    expect(html).not.toContain("h-[300px]");
+    expect(html.match(/size-\[58px\] rounded-full/g)).toHaveLength(10);
+    expect(html.match(/kb-pulse/g)).toHaveLength(26);
     expect(html).not.toContain("Đang tải…");
   });
 
diff --git a/components/home/homescreen.test.tsx b/components/home/homescreen.test.tsx
index bbae64e..ed0213d 100644
--- a/components/home/homescreen.test.tsx
+++ b/components/home/homescreen.test.tsx
@@ -120,6 +120,42 @@ beforeEach(() => {
   openActionSheet.mockClear();
 });
 
+// The loading shapes follow the page of spec 2026-11-19 §3: hero 104, three
+// 80 px tiles, two rows of five 58 px circles under a label, then two sections
+// with a 44 px title row each: three 96 px stat tiles, and four list rows.
+// 25 pulsing blocks in all.
+function expectHomeShapes(html: string) {
+  expect(html).toContain(
+    '<div aria-busy="true" class="flex flex-col gap-3.5">',
+  );
+  expect(html).not.toContain("h-[300px]");
+  expect(html.match(/h-\[104px\] rounded-\[32px\]/g)).toHaveLength(1);
+  expect(html.match(/h-20 rounded-\[24px\]/g)).toHaveLength(3);
+  expect(html).toContain("grid grid-cols-3 gap-2");
+  expect(html.match(/h-\[18px\]/g)).toHaveLength(2);
+  expect(html.match(/size-\[58px\] rounded-full/g)).toHaveLength(10);
+  expect(html.match(/grid grid-cols-5 gap-1/g)).toHaveLength(2);
+  expect(html).not.toContain("h-[92px]");
+  expect(html.match(/h-24 rounded-\[24px\]/g)).toHaveLength(3);
+  expect(html.match(/h-\[60px\]/g)).toHaveLength(4);
+  // A 44 px title row opens "24 giờ qua" and "Gần đây".
+  const title = '<div class="flex h-11 items-center px-1">';
+  expect(html.split(title)).toHaveLength(3);
+  expect(html.indexOf(title)).toBeLessThan(html.indexOf("h-24 rounded-[24px]"));
+  expect(html.lastIndexOf(title)).toBeGreaterThan(
+    html.lastIndexOf("h-24 rounded-[24px]"),
+  );
+  expect(html.lastIndexOf(title)).toBeLessThan(html.indexOf("h-[60px]"));
+  expect(html.match(/kb-pulse/g)).toHaveLength(25);
+  expectInOrder(html, [
+    "h-[104px]",
+    "h-20 rounded-[24px]",
+    "size-[58px]",
+    "h-24 rounded-[24px]",
+    "h-[60px]",
+  ]);
+}
+
 describe("HomeScreen", () => {
   it("while logs load: header, sync line, then the home shapes and nothing else", () => {
     const html = render({
@@ -132,9 +168,8 @@ describe("HomeScreen", () => {
       html.indexOf("</header>"),
     );
     expect(html).toContain('aria-busy="true"');
-    expect(html).toContain("h-[300px]");
-    expect(html.match(/kb-pulse/g)).toHaveLength(8);
     expect(html).not.toContain("Thay tã");
+    expectHomeShapes(html);
   });
 
   it("a load error replaces the hero with a retry card; logging buttons stay", () => {
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/home/homescreen.test.tsx components/auth/gate.test.tsx`
Expected: FAIL, `Tests  2 failed | 10 passed (12)`.

- [ ] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/AuthGate.tsx b/components/AuthGate.tsx
index 210fc4e..d5f3215 100644
--- a/components/AuthGate.tsx
+++ b/components/AuthGate.tsx
@@ -18,12 +18,13 @@ import { gateRedirect, resolveLanding, type GateNeed } from "@/lib/routing";
 
 export type GateState = { session: Session | null; ctx: FamilyContext };
 
-// Spec §10: the gate waits with the home page's shapes under a header-sized bar.
+// Spec §10: the gate waits with the home page's shapes under a header-sized
+// bar, with the home page's 14 px gap.
 export function GateLoading() {
   return (
     <main
       aria-busy="true"
-      className="mx-auto flex max-w-md flex-col gap-[18px] p-4"
+      className="mx-auto flex max-w-md flex-col gap-3.5 p-4"
     >
       <Skeleton className="h-11 w-48 rounded-full" />
       <HomeSkeleton />
diff --git a/components/home/HomeSkeleton.tsx b/components/home/HomeSkeleton.tsx
index 2bb20fe..7ddd25d 100644
--- a/components/home/HomeSkeleton.tsx
+++ b/components/home/HomeSkeleton.tsx
@@ -1,18 +1,50 @@
 import { Skeleton } from "@/components/ui/Skeleton";
 
-// Spec §10: loading draws the home page's shapes — hero 300, 3 number tiles, 4 list rows.
+// The loading shapes of the home page (spec 2026-11-19 §3), at its sizes so
+// little moves when the data lands: the hero at its shortest (a late feed makes
+// the real one taller), three status tiles, the Bấm giờ and Ghi nhanh rows of
+// five 58 px circles under their labels, then "24 giờ qua" and "Gần đây", each
+// a 44 px title row over its stat tiles or list rows.
 export function HomeSkeleton() {
   return (
-    <div aria-busy="true" className="flex flex-col gap-[18px]">
-      <Skeleton className="h-[300px] rounded-[32px]" />
-      <div className="grid grid-cols-3 gap-2.5">
+    <div aria-busy="true" className="flex flex-col gap-3.5">
+      <Skeleton className="h-[104px] rounded-[32px]" />
+      <div className="grid grid-cols-3 gap-2">
         {[0, 1, 2].map((i) => (
-          <Skeleton key={i} className="h-[92px] rounded-[24px]" />
+          <Skeleton key={i} className="h-20 rounded-[24px]" />
         ))}
       </div>
-      {[0, 1, 2, 3].map((i) => (
-        <Skeleton key={i} className="h-[60px]" />
+      {[0, 1].map((row) => (
+        <div key={row} className="flex flex-col gap-2.5">
+          <Skeleton className="mx-1 h-[18px] w-24 rounded-full" />
+          <div className="grid grid-cols-5 gap-1">
+            {/* 80 px: the circle, its gap and the one-line label under it. */}
+            {[0, 1, 2, 3, 4].map((i) => (
+              <div key={i} className="flex h-20 justify-center">
+                <Skeleton className="size-[58px] rounded-full" />
+              </div>
+            ))}
+          </div>
+        </div>
       ))}
+      <div className="flex flex-col gap-2.5">
+        <div className="flex h-11 items-center px-1">
+          <Skeleton className="h-[22px] w-28 rounded-full" />
+        </div>
+        <div className="grid grid-cols-3 gap-2.5">
+          {[0, 1, 2].map((i) => (
+            <Skeleton key={i} className="h-24 rounded-[24px]" />
+          ))}
+        </div>
+      </div>
+      <div className="flex flex-col gap-2.5">
+        <div className="flex h-11 items-center px-1">
+          <Skeleton className="h-[22px] w-24 rounded-full" />
+        </div>
+        {[0, 1, 2, 3].map((i) => (
+          <Skeleton key={i} className="h-[60px]" />
+        ))}
+      </div>
     </div>
   );
 }
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/home/homescreen.test.tsx components/auth/gate.test.tsx && bun run typecheck`
Expected: `Tests  12 passed (12)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- components/AuthGate.tsx components/home/HomeSkeleton.tsx components/auth/gate.test.tsx components/home/homescreen.test.tsx
git commit -m "fix(home): loading shapes match the current home page" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M4 và lên `main`

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m4b.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ của M4a và Task 1–2.
- Produces: `main` có cả M4a và M4b; cả 6 mốc của spec đã ở trên `main`.

- [ ] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  158 passed (158)`, `Tests  1149 passed (1149)`.

- [ ] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [ ] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không bấm Lưu, không đụng timer)**

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Dùng khung Browser của app ở cỡ 375×812. Đóng mọi sheet bằng phím Esc.

Trang Triệu chứng không ghi dữ liệu nào (`components/triage/` chỉ đọc, qua `useRecentLogs` và `useEmergencyContacts`), nên được chạm chip, bật công tắc, gõ nhiệt độ và bấm "Xem kết quả". Không bấm link `tel:115`. Ở các trang khác vẫn không bấm Lưu và không đụng timer.

1. Mở `http://localhost:3000/trieu-chung`. Mọi nhóm chip đều đóng, nằm trong một danh sách; dòng hướng dẫn là "Mở nhóm rồi chạm để chọn, chọn được nhiều.". Chạy bằng javascript tool: `(() => { const bar = document.querySelector('a[href="tel:115"][aria-label="Gọi cấp cứu 115"]')?.parentElement; const r = bar?.getBoundingClientRect(); return { nav: document.querySelectorAll('nav[aria-label="Điều hướng chính"]').length, groups: [...document.querySelectorAll("main button[aria-expanded]")].map((b) => [b.textContent, b.getAttribute("aria-expanded")]), bar: r && { left: Math.round(r.left), width: Math.round(r.width), fromBottom: Math.round(innerHeight - r.bottom), height: Math.round(r.height) }, text: bar?.querySelector("button")?.textContent }; })()`. Kỳ vọng: `nav` là 0 (thanh tab và "+" ẩn), mọi nhóm `"false"`, `bar.height` là 70. `text` là "Xem kết quả"; nếu trong 6 giờ qua có một lần ghi nhiệt độ ở mức sốt thì chip sốt bị khoá được tính và `text` là "Xem kết quả · đã chọn 1". Ghi lại `bar`.
2. Mở `/nhat-ky` và đo thanh tab: `(() => { const r = document.querySelector('nav[aria-label="Điều hướng chính"]').getBoundingClientRect(); return { left: Math.round(r.left), width: Math.round(r.width), fromBottom: Math.round(innerHeight - r.bottom) }; })()`. Kỳ vọng: `left`, `width`, `fromBottom` bằng của thanh kết quả ở mục 1. Quay lại `/trieu-chung`.
3. Mở hai nhóm: cả hai cùng mở, icon đổi chiều. Chọn hai chip: hàng tiêu đề của nhóm có nhãn "{n} đã chọn", số trên nút tăng 2. Bật một công tắc dấu hiệu nguy hiểm: số tăng thêm 1. Chữ trên nút nằm một dòng và nằm trong nút: `(() => { const b = document.querySelector('a[href="tel:115"][aria-label="Gọi cấp cứu 115"]').parentElement.querySelector("button"); const range = document.createRange(); range.selectNodeContents(b); const t = range.getBoundingClientRect(); const box = b.getBoundingClientRect(); return { text: b.textContent, lines: range.getClientRects().length, spare: Math.round(box.width - t.width) }; })()`. Kỳ vọng: `lines` là 1, `spare` lớn hơn 0.
4. Cuộn hết trang: `(() => { scrollTo(0, document.documentElement.scrollHeight); const bar = document.querySelector('a[href="tel:115"][aria-label="Gọi cấp cứu 115"]').parentElement.getBoundingClientRect(); const sw = [...document.querySelectorAll('main [role="switch"]')].at(-1).getBoundingClientRect(); return { lastSwitchBottom: Math.round(sw.bottom), barTop: Math.round(bar.top) }; })()`. Kỳ vọng: `lastSwitchBottom <= barTop`.
5. Gõ `50` vào ô nhiệt độ rồi bấm "Xem kết quả": trang cuộn về đầu (`scrollY` là 0), có dòng "Nhiệt độ từ 30 đến 43°C, ví dụ 38,5." và chưa có kết quả (thanh kết quả vẫn còn). Xoá ô nhiệt độ.
6. Bấm "Xem kết quả": hiện kết quả; thanh kết quả biến mất; thanh tab và "+" hiện lại (`nav` là 1). Bấm "Làm lại": mọi nhóm đóng, thanh kết quả hiện lại với số đã về 0, thanh tab ẩn. Hai việc này không có unit test (Diễn giải 8 của M4a, Diễn giải 6 của plan này), nên mục này là chỗ kiểm chính.
7. Bấm link "Khám phá" ở đầu trang: thanh tab hiện ở trang Khám phá.
8. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở `/trieu-chung`.
9. Lặp mục 1 và 3 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`: chữ và icon đọc rõ, nút 115 đỏ.
10. Khung chờ của trang Hôm nay: mở `/` và chụp ngay khi trang đang tải, nếu bắt được thì ghi lại. Việc đo trang đã tải xong chỉ để đối chiếu kích thước, không xác nhận được khung chờ; không bắt được thì ghi "chưa nhìn tận mắt khung chờ".

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được thì ghi "chưa kiểm".

- [ ] **Step 4: Commit phần ghi kết quả, đưa lên `main`, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m4b.md
git commit -m "docs(plan): record the M4 check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-ux-mobile-m4b
git push origin main
```

Báo cáo cho người dùng: `git log --oneline 4a443df..main`; kết quả typecheck, vitest, build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa.
