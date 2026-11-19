# Kim Bun — UX mobile M2b: thẻ lớn gọn và ô trạng thái của trang Hôm nay Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§3.2 phần vẽ; §3.3 phần component; phần tương ứng của §11.1)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Thẻ lớn của trang Hôm nay được vẽ lại thành thẻ gọn một hàng với năm trạng thái, và có sẵn component ba ô trạng thái kèm dòng Vitamin D để M2c nối vào trang.

**Architecture:**

- **Giao diện:** `HeroCardView` vẽ lại theo bảng §3.2; `TimerRing` bị xoá; component mới `StatusTiles`.
- **Luật thuần:** `runningLabel` cho nhãn "Đang …". Map lớp của timer đang chạy chuyển về `lib/ui/categories.ts`.
- **Chưa làm ở plan này (thuộc M2c):** nối `StatusTiles` vào `HomeScreen`, hàng Ghi nhanh, khối "24 giờ qua".

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m2b`, cắt từ `feat/kim-bun-ux-mobile-m2a`. Baseline: 972 test vitest xanh (151 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a | luật của §3.2, §3.3, §3.5; §3.1 header | `2026-11-19-kim-bun-ux-mobile-m2a.md` |
| **M2b (plan này)** | §3.2 thẻ lớn; §3.3 component ô trạng thái | `2026-11-19-kim-bun-ux-mobile-m2b.md` |
| M2c | §3.4, §3.5, §3.6; kiểm cuối M2 và lên `main` | `2026-11-19-kim-bun-ux-mobile-m2c.md` |
| M3 | §4 timer trong tab, §5.4 sheet "+" | chưa viết |
| M4 | §6 Triệu chứng | chưa viết |
| M5 | §7 Tiêm chủng, §9 Khám phá | chưa viết |
| M6 | phần còn lại của §8 Thống kê, §11.3 | chưa viết |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Số phút thức** làm tròn xuống, không âm, tính trong `HeroCardView`.
2. **Nhãn timer đang chạy** là hàm thuần mới `runningLabel` trong `lib/rules/hero.ts`. Loại timer lạ cho ra "Đang chạy".
3. **Lớp của ô tròn đang chạy:** map `RUNNING` chuyển từ `TimerButtons.tsx` sang `lib/ui/categories.ts` thành `CATEGORY_RUNNING`. Markup của `TimerButtons` không đổi.
4. **Thẻ lớn** canh trái ở mọi trạng thái; nhãn, số lớn và dòng phụ đều `whitespace-nowrap`; nhãn của `running` và `awake` dùng `text-muted`; icon trong ô tròn cỡ 24, nét 2,2; số lớn giữ độ đậm 600.
5. **Test của `TimerRing`** bị xoá cùng component. Ca kiểm `CATEGORY_CHIP` của nó chuyển sang `lib/ui/categories.test.ts`.
6. **Padding "10×12" của ô trạng thái** là 10 px dọc, 12 px ngang. Ba dòng trong ô không có khoảng cách thêm.
7. **Dòng Vitamin D** nằm trong `StatusTiles` (prop `vitaminD`), cách hàng ô 8 px.
8. **Trạng thái trung gian.** Sau Task 1, trang Hôm nay tạm thiếu giờ cữ bú tiếp và dòng Vitamin D cho tới khi M2c nối `StatusTiles`.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (quy tắc CSS của hotfix 7822c90): lớp trong chỉ còn màu nền và viền. Không thiết kế gì dựa vào blur của lớp trong. Màn hình không tự cộng `env(safe-area-inset-*)`, trừ các thanh `fixed` ở đáy đang dùng công thức `max(calc(env(safe-area-inset-bottom)+10px),26px)`.
- Mọi giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString` có sẵn.
- Mọi ghi bản ghi (`logs`) đi qua outbox như hiện tại. Spec này không thêm đường ghi mới.
- Chữ về sức khoẻ: không thêm ngưỡng hay câu khuyên mới. Chỉ dùng lại ngưỡng và câu `explain` đang có trong `lib/rules/ratings.ts`.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị xuống dòng hoặc bị cắt "…", trừ tên bé, tên thành viên, tên mũi tiêm và dòng mô tả của thẻ ở Khám phá (§9, tối đa 2 dòng).
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
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên bản sao đã có M2a ở ngoài repo, trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5): `tsc --noEmit` sạch sau mỗi commit code, số test đỏ và xanh đúng như ghi; cả bộ sau Task 2 là 984 test trong 151 file.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Next.js.** Không task nào thêm route. Chỗ dùng API của Next duy nhất là `next/link` trong `StatsSection.tsx` (M2c), dùng y như `HomeHeader.tsx` và `RecentCard.tsx` đang dùng.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status). Ba plan M2a, M2b, M2c chỉ lên `main` cùng nhau, ở cuối M2c: giữa chừng trang Hôm nay tạm thiếu giờ cữ bú tiếp và dòng Vitamin D.

## Contracts with Other Plans

Plan này đứng ngay sau M2a và ngay trước M2c.

**Consumes (từ M2a, `2026-11-19-kim-bun-ux-mobile-m2a.md`):**

- `lib/rules/hero.ts`: `HeroState<T>` = `running | empty | overdue | awake | none`.
- `lib/rules/status.ts`: `StatusTile`.

**Produces** (M2c và các mốc sau được dựa vào đúng những tên này):

- `components/home/HeroCard.tsx`: `HeroCardView` không có prop `sub`, trả `null` cho `none`.
- `lib/rules/hero.ts`: `runningLabel(log)`. `lib/ui/categories.ts`: `CATEGORY_RUNNING`.
- `components/home/StatusTiles.tsx`: `StatusTiles({ tiles, vitaminD })`.
- **Vitest sau M2b:** 984 test, 151 file.

---

### Task 1: Thẻ lớn gọn với năm trạng thái, xoá `TimerRing` (§3.2)

**Files:**

- Modify: `components/home/HeroCard.tsx`
- Modify: `components/home/HomeScreen.tsx`
- Modify: `components/home/TimerButtons.tsx`
- Delete: `components/ui/TimerRing.tsx`
- Modify: `lib/rules/hero.ts`
- Modify: `lib/ui/categories.ts`
- Test: `components/home/herocard.test.tsx` (sửa)
- Test: `components/ui/timerring.test.tsx` (xoá)
- Test: `lib/rules/hero.test.ts` (sửa)
- Test: `lib/ui/categories.test.ts` (sửa)

**Interfaces:**

- Consumes: `HeroState` (M2a); `formatClock`, `formatMinutes` (`lib/rules/hero.ts`); `CATEGORY_CHIP`, `categoryOf` (`lib/ui/categories.ts`); `Glass`, `Button`, `HintBadge`, `Icon`, `PendingMark`.
- Produces: `HeroCardView` không còn prop `sub`, trả `null` khi `state.kind === "none"`; `runningLabel(log: { type: string; details: unknown }): string` trong `lib/rules/hero.ts`; `CATEGORY_RUNNING: Record<CategoryToken, string>` trong `lib/ui/categories.ts` (chuyển từ map `RUNNING` của `TimerButtons.tsx`); `components/ui/TimerRing.tsx` và test của nó bị xoá.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m2b feat/kim-bun-ux-mobile-m2a
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/home/herocard.test.tsx b/components/home/herocard.test.tsx
index de8476f..505e98b 100644
--- a/components/home/herocard.test.tsx
+++ b/components/home/herocard.test.tsx
@@ -1,7 +1,6 @@
 import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
 import { PendingMark } from "@/components/sync/PendingMark";
-import { RING_CIRCUMFERENCE } from "@/components/ui/TimerRing";
 import { findElements } from "@/components/ui/testTree";
 import type { HeroState } from "@/lib/rules/hero";
 import type { LogRow } from "@/lib/supabase/rows";
@@ -31,7 +30,6 @@ const props = (
   state,
   now: NOW,
   who: "Mẹ",
-  sub: null,
   pending: false,
   busy: false,
   onTimer: () => {},
@@ -42,21 +40,54 @@ const html = (p: Parameters<typeof HeroCardView>[0]) =>
   renderToStaticMarkup(<HeroCardView {...p} />);
 const byText = (p: Parameters<typeof HeroCardView>[0], text: string) =>
   findElements(HeroCardView(p), (el) => el.props.children === text);
+const BIG_40 = "text-[40px] leading-[44px]";
+const BIG_32 = "text-[32px] leading-[38px]";
+// The class of the element whose whole content is `text`.
+const classOf = (out: string, text: string) =>
+  out.match(new RegExp(`class="([^"]*)">${text}</`))?.[1] ?? "";
 
+// Spec 2026-11-19 §3.2: the compact card.
 describe("HeroCardView running", () => {
   const breast = row({});
+  const sleep = row({
+    type: "sleep",
+    details: {},
+    started_at: "2026-11-14T03:57:55.000Z",
+  });
+
+  it("is a hero glass card: 14 px padding, rows 10 px apart, top row 12 px", () => {
+    const out = html(props({ kind: "running", log: breast }));
+    expect(out).toMatch(/^<section class="glass rounded-\[32px\] [^"]*">/);
+    expect(out).toContain("flex flex-col gap-2.5 p-3.5");
+    expect(out).toContain('<div class="flex items-center gap-3">');
+    expect(out).not.toContain("<circle");
+  });
 
-  it("shows the ring, label, clock and who started it", () => {
+  it("shows a filled 56 px circle, label, clock and who started it", () => {
     const out = html(props({ kind: "running", log: breast }));
-    expect(out).toContain("stroke-cat-feed");
-    expect(out).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE * 0.5}"`);
-    expect(out).toContain(">Bú trái");
-    expect(out).toContain("uppercase");
-    expect(out).toContain(">30:00</span>");
-    expect(out).toContain(">Mẹ · từ 11:30</span>");
-    expect(out).toContain(">Đổi bên</button>");
-    expect(out).toContain(">Dừng</button>");
-    expect(out).toContain("rounded-[32px]");
+    expect(out).toContain("size-14");
+    expect(out).toContain("bg-cat-feed ring-4 ring-cat-feed/30 text-bg");
+    expect(out).toContain(`d="${ICON_PATHS.heart}"`);
+    expect(classOf(out, "Đang bú trái")).toContain("uppercase");
+    expect(classOf(out, "30:00")).toContain(BIG_40);
+    expect(classOf(out, "Mẹ")).toBe("truncate");
+    expect(out).toContain(">· từ 11:30</span>");
+    expect(out).not.toContain('aria-label="Chờ đồng bộ"');
+  });
+
+  it("marks a timer that still waits to sync", () => {
+    const out = html(
+      props({ kind: "running", log: breast }, { pending: true }),
+    );
+    expect(out.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
+  });
+
+  it("breast: a row of two buttons, Đổi bên secondary and Dừng primary", () => {
+    const out = html(props({ kind: "running", log: breast }));
+    expect(out).toContain("grid-cols-2");
+    expect(classOf(out, "Đổi bên")).toContain("glass");
+    expect(classOf(out, "Dừng")).toContain("bg-accent");
+    expect(out.match(/<button/g)).toHaveLength(2);
   });
 
   it("Đổi bên presses the other side, Dừng stops this log", () => {
@@ -69,25 +100,43 @@ describe("HeroCardView running", () => {
     expect(onStop).toHaveBeenCalledWith(breast);
   });
 
-  it("other timers get one full-width Dừng and a smaller clock after an hour", () => {
-    const sleep = row({
-      type: "sleep",
-      details: {},
-      started_at: "2026-11-14T03:57:55.000Z",
-    });
-    const out = html(props({ kind: "running", log: sleep }));
-    expect(out).toContain("stroke-cat-sleep");
-    expect(out).toContain(">Ngủ");
-    expect(out).toContain(">1:02:05</span>");
-    expect(out).toContain("text-[38px]");
+  it("other timers: one large Dừng at the right of the top row, no button row", () => {
+    const onStop = vi.fn();
+    const p = props({ kind: "running", log: sleep }, { onStop });
+    const out = html(p);
+    expect(out).toContain("bg-cat-sleep ring-4 ring-cat-sleep/30 text-bg");
+    expect(out).toContain(`d="${ICON_PATHS.moon}"`);
+    expect(out).toContain(">Đang ngủ</span>");
     expect(out).not.toContain("Đổi bên");
+    expect(out).not.toContain("grid-cols-2");
     expect(out.match(/<button/g)).toHaveLength(1);
-    expect(out).toContain("w-full");
+    expect(classOf(out, "Dừng")).toContain("bg-accent");
+    expect(classOf(out, "Dừng")).toContain("min-h-[50px]");
+    expect(classOf(out, "Dừng")).toContain("shrink-0");
+    expect(out).toMatch(/<\/button><\/div><\/section>$/);
+    (byText(p, "Dừng")[0].props.onClick as () => void)();
+    expect(onStop).toHaveBeenCalledWith(sleep);
+  });
+
+  it("names every timer", () => {
+    const label = (over: Partial<LogRow>) =>
+      html(props({ kind: "running", log: row(over) }));
+    expect(label({ details: { side: "right" } })).toContain(">Đang bú phải<");
+    expect(label({ type: "pump", details: {} })).toContain(">Đang hút sữa<");
+    expect(label({ type: "tummy", details: {} })).toContain(">Đang nằm sấp<");
+  });
+
+  it("the clock is 40/44 up to five characters, 32/38 beyond", () => {
+    const clock = (started_at: string, text: string) =>
+      classOf(html(props({ kind: "running", log: row({ started_at }) })), text);
+    expect(clock("2026-11-14T04:00:01.000Z", "59:59")).toContain(BIG_40);
+    expect(clock("2026-11-14T04:00:00.000Z", "1:00:00")).toContain(BIG_32);
+    expect(clock("2026-11-14T03:57:55.000Z", "1:02:05")).toContain(BIG_32);
   });
 });
 
-describe("HeroCardView feed states", () => {
-  it("overdue: warn border and label, minutes late, expected time, two feed buttons", () => {
+describe("HeroCardView other states", () => {
+  it("overdue: warn border, circle and label, minutes late, expected time, two feed buttons", () => {
     const onTimer = vi.fn();
     const p = props(
       {
@@ -99,30 +148,58 @@ describe("HeroCardView feed states", () => {
     );
     const out = html(p);
     expect(out).toContain("border-warn!");
-    expect(out).toContain("text-warn");
-    expect(out).toContain(">Trễ cữ bú</span>");
-    expect(out).toContain(">25 phút</span>");
+    expect(out).toContain("size-14");
+    expect(out).toContain("bg-warn-soft text-warn-ink");
+    expect(out).toContain(`d="${ICON_PATHS.clock}"`);
+    expect(classOf(out, "Trễ cữ bú")).toMatch(/\btext-warn\b(?!-)/);
+    expect(classOf(out, "Trễ cữ bú")).toContain("uppercase");
+    expect(classOf(out, "25 phút")).toContain(BIG_32);
     expect(out).toContain(">Dự kiến lúc 11:35</span>");
+    expect(out).toContain("grid-cols-2");
     expect(out).toContain(">Bú trái</button>");
     (byText(p, "Bú phải")[0].props.onClick as () => void)();
     expect(onTimer).toHaveBeenCalledWith({ type: "breast", side: "right" });
   });
 
-  it("empty: a sentence, two feed buttons and the sub line", () => {
+  it("awake: a sun on the sleep tint, whole minutes awake, since when, no buttons", () => {
     const out = html(
-      props(
-        { kind: "empty" },
-        { sub: "Bé đã thức 45 phút · Vitamin D đã uống 08:10" },
-      ),
+      props({ kind: "awake", since: new Date("2026-11-14T03:34:20Z") }),
     );
-    expect(out).toContain(">Chưa có cữ bú nào gần đây</span>");
+    expect(out).toContain("size-14");
+    expect(out).toContain("bg-cat-sleep/15 text-cat-sleep");
+    expect(out).toContain(`d="${ICON_PATHS.sun}"`);
+    expect(classOf(out, "Đang thức")).toContain("uppercase");
+    expect(classOf(out, "1 giờ 25 phút")).toContain(BIG_32);
+    expect(out).toContain(">từ 10:34</span>");
+    expect(out).not.toContain("<button");
+    expect(out).not.toContain("border-warn!");
+  });
+
+  it("empty: only a sentence and two feed buttons", () => {
+    const out = html(props({ kind: "empty" }));
+    expect(classOf(out, "Chưa có cữ bú nào gần đây")).toContain(
+      "text-[17px] leading-[22px] font-semibold",
+    );
+    expect(out).not.toContain("size-14");
+    expect(out).not.toContain("uppercase");
+    expect(out).not.toContain("<svg");
+    expect(out).toContain("grid-cols-2");
+    expect(out).toContain(">Bú trái</button>");
     expect(out).toContain(">Bú phải</button>");
-    expect(out).toContain(">Bé đã thức 45 phút · Vitamin D đã uống 08:10</p>");
+  });
+
+  it("none: draws nothing", () => {
+    expect(html(props({ kind: "none" }))).toBe("");
   });
 
   it("busy disables every button", () => {
-    const out = html(props({ kind: "empty" }, { busy: true }));
-    expect(out.match(/disabled=""/g)).toHaveLength(2);
+    const disabled = (state: HeroState<LogRow>) =>
+      html(props(state, { busy: true })).match(/disabled=""/g);
+    expect(disabled({ kind: "empty" })).toHaveLength(2);
+    expect(disabled({ kind: "running", log: row({}) })).toHaveLength(2);
+    expect(
+      disabled({ kind: "running", log: row({ type: "sleep", details: {} }) }),
+    ).toHaveLength(1);
   });
 });
 
@@ -171,8 +248,16 @@ describe("HeroCardView next-side hint (spec 2026-11-17 §5.3)", () => {
     ]);
   });
 
-  it("shows nothing without a hint", () => {
+  it("shows nothing without a hint, and nothing while the baby is awake", () => {
     expect(html(props(overdue))).not.toContain("Nên bú");
     expect(html(props(overdue))).not.toContain("Lần trước");
+    const awake = html(
+      props(
+        { kind: "awake", since: new Date("2026-11-14T04:00:00Z") },
+        { nextSide },
+      ),
+    );
+    expect(awake).not.toContain("Nên bú");
+    expect(awake).not.toContain("Lần trước");
   });
 });
diff --git a/components/ui/timerring.test.tsx b/components/ui/timerring.test.tsx
deleted file mode 100644
index 84b3e4f..0000000
--- a/components/ui/timerring.test.tsx
+++ /dev/null
@@ -1,45 +0,0 @@
-import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it } from "vitest";
-import { CATEGORY_CHIP } from "@/lib/ui/categories";
-import { RING_CIRCUMFERENCE, TimerRing } from "./TimerRing";
-
-describe("TimerRing", () => {
-  it("draws a 200 px ring in the category colour over a 12% track", () => {
-    const html = renderToStaticMarkup(
-      <TimerRing token="cat-sleep" progress={0.25}>
-        <span>12:00</span>
-      </TimerRing>,
-    );
-    expect(html).toContain('width="200"');
-    expect(html.match(/<circle/g)).toHaveLength(2);
-    expect(html).toContain('stroke-width="12"');
-    expect(html).toContain("stroke-cat-sleep/12");
-    expect(html).toContain('class="stroke-cat-sleep"');
-    expect(html).toContain(`stroke-dasharray="${RING_CIRCUMFERENCE}"`);
-    expect(html).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE * 0.75}"`);
-    expect(html).toContain('aria-hidden="true"');
-    expect(html).toContain("<span>12:00</span>");
-  });
-
-  it("clamps progress to the ring", () => {
-    const full = renderToStaticMarkup(
-      <TimerRing token="cat-feed" progress={2}>
-        x
-      </TimerRing>,
-    );
-    expect(full).toContain('stroke-dashoffset="0"');
-    const none = renderToStaticMarkup(
-      <TimerRing token="cat-feed" progress={-1}>
-        x
-      </TimerRing>,
-    );
-    expect(none).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE}"`);
-  });
-});
-
-describe("CATEGORY_CHIP", () => {
-  it("tints every category with its own colour", () => {
-    expect(CATEGORY_CHIP["cat-feed"]).toBe("bg-cat-feed/15 text-cat-feed");
-    expect(Object.keys(CATEGORY_CHIP)).toHaveLength(8);
-  });
-});
diff --git a/lib/rules/hero.test.ts b/lib/rules/hero.test.ts
index 4d2433e..66afcac 100644
--- a/lib/rules/hero.test.ts
+++ b/lib/rules/hero.test.ts
@@ -5,6 +5,7 @@ import {
   formatMinutes,
   heroState,
   longTimerText,
+  runningLabel,
   timerLabel,
 } from "./hero";
 
@@ -123,6 +124,18 @@ describe("hero text helpers", () => {
     expect(timerLabel(log("tummy", 1, null))).toBe("Nằm sấp");
   });
 
+  // Spec 2026-11-19 §3.2: the label on the hero card of a running timer.
+  it("runningLabel says what the baby is doing", () => {
+    const label = (type: string, details: unknown = {}) =>
+      runningLabel(log(type, 1, null, details));
+    expect(label("sleep")).toBe("Đang ngủ");
+    expect(label("breast", { side: "left" })).toBe("Đang bú trái");
+    expect(label("breast", { side: "right" })).toBe("Đang bú phải");
+    expect(label("pump")).toBe("Đang hút sữa");
+    expect(label("tummy")).toBe("Đang nằm sấp");
+    expect(label("vaccine")).toBe("Đang chạy");
+  });
+
   it("formatClock shows M:SS, then H:MM:SS from one hour", () => {
     expect(formatClock(0)).toBe("0:00");
     expect(formatClock(65_000)).toBe("1:05");
diff --git a/lib/ui/categories.test.ts b/lib/ui/categories.test.ts
index 48535d9..6f42f96 100644
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -1,6 +1,11 @@
 import { describe, expect, it } from "vitest";
 import { LOG_TYPES } from "@/lib/rules/logDetails";
-import { CATEGORIES, categoryOf } from "./categories";
+import {
+  CATEGORIES,
+  CATEGORY_CHIP,
+  CATEGORY_RUNNING,
+  categoryOf,
+} from "./categories";
 import { ICON_PATHS } from "./icons";
 import { TOKEN_NAMES } from "./tokens";
 
@@ -44,6 +49,20 @@ describe("log categories", () => {
   });
 });
 
+describe("category class maps", () => {
+  it("CATEGORY_CHIP tints every category with its own colour", () => {
+    expect(CATEGORY_CHIP["cat-feed"]).toBe("bg-cat-feed/15 text-cat-feed");
+    expect(Object.keys(CATEGORY_CHIP)).toHaveLength(8);
+  });
+
+  it("CATEGORY_RUNNING fills every category with its colour inside a halo", () => {
+    expect(CATEGORY_RUNNING["cat-sleep"]).toBe(
+      "bg-cat-sleep ring-4 ring-cat-sleep/30",
+    );
+    expect(Object.keys(CATEGORY_RUNNING)).toHaveLength(8);
+  });
+});
+
 describe("icon paths", () => {
   it("has the 43 icons the app uses, each a non-empty path", () => {
     expect(Object.keys(ICON_PATHS)).toHaveLength(43);
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/home/herocard.test.tsx lib/rules/hero.test.ts lib/ui/categories.test.ts components/home/buttons.test.tsx components/home/homescreen.test.tsx`
Expected: FAIL, `Tests  9 failed | 40 passed (49)`. Lý do đỏ: markup cũ, `runningLabel is not a function`, `CATEGORY_RUNNING` chưa có.

- [x] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/components/home/HeroCard.tsx b/components/home/HeroCard.tsx
index ba5b2dd..6eb9f1e 100644
--- a/components/home/HeroCard.tsx
+++ b/components/home/HeroCard.tsx
@@ -3,36 +3,72 @@ import { PendingMark } from "@/components/sync/PendingMark";
 import { Button } from "@/components/ui/Button";
 import { Glass } from "@/components/ui/Glass";
 import { HintBadge } from "@/components/ui/HintBadge";
-import { TimerRing } from "@/components/ui/TimerRing";
+import { Icon } from "@/components/ui/Icon";
 import {
   formatClock,
   formatMinutes,
-  timerLabel,
+  runningLabel,
   type HeroState,
 } from "@/lib/rules/hero";
 import { NEXT_SIDE_LABEL } from "@/lib/rules/quickActions";
 import type { BreastSide, NextSide, TimerButton } from "@/lib/rules/timer";
 import { formatVnTime } from "@/lib/rules/time";
 import type { LogRow } from "@/lib/supabase/rows";
-import { categoryOf } from "@/lib/ui/categories";
+import {
+  CATEGORY_CHIP,
+  CATEGORY_RUNNING,
+  categoryOf,
+} from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
+import type { IconName } from "@/lib/ui/icons";
 
 const LABEL =
-  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] uppercase";
+  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase";
 const BIG =
-  "text-[48px] leading-[52px] font-semibold tracking-[-0.02em] text-ink tabular-nums";
-const BIG_LONG =
-  "text-[38px] leading-[44px] font-semibold tracking-[-0.02em] text-ink tabular-nums";
-const META = "text-[15px] text-muted tabular-nums";
-const HOUR_MS = 3_600_000;
+  "font-semibold tracking-[-0.02em] whitespace-nowrap text-ink tabular-nums";
+const BIG_40 = "text-[40px] leading-[44px]";
+const BIG_32 = "text-[32px] leading-[38px]";
+const SUB =
+  "text-[13px] leading-[18px] whitespace-nowrap text-muted tabular-nums";
+const MINUTE_MS = 60_000;
 const LEFT: TimerButton = { type: "breast", side: "left" };
 const RIGHT: TimerButton = { type: "breast", side: "right" };
 
+// Spec 2026-11-19 §3.2: 56 px circle, three lines of text, a button if any.
+function topRow(parts: {
+  circle: string;
+  icon: IconName;
+  label: string;
+  labelTone: string;
+  big: string;
+  bigSize: string;
+  sub: ReactNode;
+  action?: ReactNode;
+}) {
+  return (
+    <div className="flex items-center gap-3">
+      <span
+        className={cx(
+          "flex size-14 shrink-0 items-center justify-center rounded-full",
+          parts.circle,
+        )}
+      >
+        <Icon name={parts.icon} size={24} strokeWidth={2.2} />
+      </span>
+      <div className="flex min-w-0 flex-1 flex-col">
+        <span className={cx(LABEL, parts.labelTone)}>{parts.label}</span>
+        <span className={cx(parts.bigSize, BIG)}>{parts.big}</span>
+        {parts.sub}
+      </div>
+      {parts.action}
+    </div>
+  );
+}
+
 export function HeroCardView({
   state,
   now,
   who,
-  sub,
   pending,
   busy,
   onTimer,
@@ -42,7 +78,6 @@ export function HeroCardView({
   state: HeroState<LogRow>;
   now: Date;
   who: string;
-  sub: string | null;
   pending: boolean;
   busy: boolean;
   onTimer: (button: TimerButton) => void;
@@ -50,7 +85,8 @@ export function HeroCardView({
   // Spec 2026-11-17 §5.3: which side to offer first; null shows no hint.
   nextSide?: NextSide | null;
 }) {
-  if (state.kind === "awake" || state.kind === "none") return null;
+  if (state.kind === "none") return null;
+
   // Without a hint the button's only child stays the plain label.
   const feedButton = (button: TimerButton, side: BreastSide, text: string) => (
     <Button
@@ -70,12 +106,12 @@ export function HeroCardView({
   );
   const feedButtons = (
     <>
-      <div className="grid w-full grid-cols-2 gap-2.5">
+      <div className="grid grid-cols-2 gap-2.5">
         {feedButton(LEFT, "left", "Bú trái")}
         {feedButton(RIGHT, "right", "Bú phải")}
       </div>
       {nextSide && (
-        <span className="text-[13px] leading-[18px] text-muted tabular-nums">
+        <span className="text-center text-[13px] leading-[18px] text-muted tabular-nums">
           Lần trước: {nextSide.last === "left" ? "trái" : "phải"} lúc{" "}
           {formatVnTime(new Date(nextSide.lastAt))}
         </span>
@@ -83,66 +119,79 @@ export function HeroCardView({
     </>
   );
 
-  let body: ReactNode;
+  let top: ReactNode;
+  let buttons: ReactNode = null;
   if (state.kind === "running") {
     const log = state.log;
-    const elapsed = now.getTime() - Date.parse(log.started_at);
-    const clock = formatClock(elapsed);
+    const breast = log.type === "breast";
+    const category = categoryOf(log.type);
+    const clock = formatClock(now.getTime() - Date.parse(log.started_at));
     const side = (log.details as { side?: unknown } | null)?.side;
-    body = (
-      <>
-        <TimerRing
-          token={categoryOf(log.type).token}
-          progress={(Math.max(0, elapsed) % HOUR_MS) / HOUR_MS}
-        >
-          <span className={cx(LABEL, "text-muted")}>
-            {timerLabel(log)} <PendingMark pending={pending} />
-          </span>
-          <span className={clock.length > 5 ? BIG_LONG : BIG}>{clock}</span>
-          <span className="text-[13px] leading-[18px] text-muted">
-            {who} · từ {formatVnTime(new Date(log.started_at))}
+    const stop = (
+      <Button className="shrink-0" disabled={busy} onClick={() => onStop(log)}>
+        Dừng
+      </Button>
+    );
+    top = topRow({
+      circle: cx(CATEGORY_RUNNING[category.token], "text-bg"),
+      icon: category.icon,
+      label: runningLabel(log),
+      labelTone: "text-muted",
+      big: clock,
+      bigSize: clock.length > 5 ? BIG_32 : BIG_40,
+      sub: (
+        <span className={cx("flex items-center gap-1", SUB)}>
+          <span className="truncate">{who}</span>
+          <span className="shrink-0">
+            · từ {formatVnTime(new Date(log.started_at))}
           </span>
-        </TimerRing>
-        {log.type === "breast" ? (
-          <div className="grid w-full grid-cols-2 gap-2.5">
-            <Button
-              variant="secondary"
-              disabled={busy}
-              onClick={() => onTimer(side === "left" ? RIGHT : LEFT)}
-            >
-              Đổi bên
-            </Button>
-            <Button disabled={busy} onClick={() => onStop(log)}>
-              Dừng
-            </Button>
-          </div>
-        ) : (
-          <Button block disabled={busy} onClick={() => onStop(log)}>
-            Dừng
+          <PendingMark pending={pending} />
+        </span>
+      ),
+      action: breast ? null : stop,
+    });
+    if (breast)
+      buttons = (
+        <div className="grid grid-cols-2 gap-2.5">
+          <Button
+            variant="secondary"
+            disabled={busy}
+            onClick={() => onTimer(side === "left" ? RIGHT : LEFT)}
+          >
+            Đổi bên
           </Button>
-        )}
-      </>
-    );
+          {stop}
+        </div>
+      );
   } else if (state.kind === "overdue") {
-    body = (
-      <>
-        <span className={cx(LABEL, "text-warn")}>Trễ cữ bú</span>
-        <span className={state.lateMinutes < 60 ? BIG : BIG_LONG}>
-          {formatMinutes(state.lateMinutes)}
-        </span>
-        <span className={META}>Dự kiến lúc {formatVnTime(state.due)}</span>
-        {feedButtons}
-      </>
-    );
+    top = topRow({
+      circle: "bg-warn-soft text-warn-ink",
+      icon: "clock",
+      label: "Trễ cữ bú",
+      labelTone: "text-warn",
+      big: formatMinutes(state.lateMinutes),
+      bigSize: BIG_32,
+      sub: <span className={SUB}>Dự kiến lúc {formatVnTime(state.due)}</span>,
+    });
+    buttons = feedButtons;
+  } else if (state.kind === "awake") {
+    const awake = now.getTime() - state.since.getTime();
+    top = topRow({
+      circle: CATEGORY_CHIP["cat-sleep"],
+      icon: "sun",
+      label: "Đang thức",
+      labelTone: "text-muted",
+      big: formatMinutes(Math.max(0, Math.floor(awake / MINUTE_MS))),
+      bigSize: BIG_32,
+      sub: <span className={SUB}>từ {formatVnTime(state.since)}</span>,
+    });
   } else {
-    body = (
-      <>
-        <span className="text-[17px] leading-[22px] font-semibold text-ink">
-          Chưa có cữ bú nào gần đây
-        </span>
-        {feedButtons}
-      </>
+    top = (
+      <span className="text-[17px] leading-[22px] font-semibold whitespace-nowrap text-ink">
+        Chưa có cữ bú nào gần đây
+      </span>
     );
+    buttons = feedButtons;
   }
 
   return (
@@ -150,12 +199,12 @@ export function HeroCardView({
       as="section"
       radius="hero"
       className={cx(
-        "flex flex-col items-center gap-2.5 p-4 text-center shadow-[0_10px_40px_rgb(0_0_0/0.10)] in-data-[theme=dark]:shadow-[0_10px_40px_rgb(0_0_0/0.40)] in-data-[theme=night]:shadow-none",
+        "flex flex-col gap-2.5 p-3.5 shadow-[0_10px_40px_rgb(0_0_0/0.10)] in-data-[theme=dark]:shadow-[0_10px_40px_rgb(0_0_0/0.40)] in-data-[theme=night]:shadow-none",
         state.kind === "overdue" && "border-warn!",
       )}
     >
-      {body}
-      {sub && <p className="text-[13px] leading-[18px] text-muted">{sub}</p>}
+      {top}
+      {buttons}
     </Glass>
   );
 }
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index 47ec5b6..62c8a54 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -15,7 +15,6 @@ import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
 import { heroState } from "@/lib/rules/hero";
 import { medicinePrefill } from "@/lib/rules/quickEntry";
 import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
-import { sleepStatusLine } from "@/lib/rules/status";
 import { homeStatTiles, totalsLine } from "@/lib/rules/summaryText";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import { nextBreastSide, overdueTimers } from "@/lib/rules/timer";
@@ -69,10 +68,6 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
   const heroLog = hero.kind === "running" ? hero.log : null;
   const nextSide = nextBreastSide(rows, now);
   const vitaminD = vitaminDToday(rows, now);
-  const sub =
-    [sleepStatusLine(rows, now), vitaminD && `Vitamin D đã uống ${vitaminD}`]
-      .filter(Boolean)
-      .join(" · ") || null;
   const otherTimers = rows.filter(
     (row) => row.ended_at === null && row.id !== heroLog?.id,
   );
@@ -115,7 +110,6 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
               state={hero}
               now={now}
               who={heroLog ? nameOf(heroLog.created_by) : ""}
-              sub={sub}
               pending={heroLog ? pending.has(heroLog.id) : false}
               busy={actions.busy}
               onTimer={actions.pressTimer}
diff --git a/components/home/TimerButtons.tsx b/components/home/TimerButtons.tsx
index a1ba4a0..35ad92c 100644
--- a/components/home/TimerButtons.tsx
+++ b/components/home/TimerButtons.tsx
@@ -9,7 +9,11 @@ import {
   type QuickAction,
 } from "@/lib/rules/quickActions";
 import type { BreastSide, RunningLog, TimerButton } from "@/lib/rules/timer";
-import { CATEGORIES, type CategoryToken } from "@/lib/ui/categories";
+import {
+  CATEGORIES,
+  CATEGORY_RUNNING,
+  type CategoryToken,
+} from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 import { GROUP_LABEL } from "./sectionTitle";
 
@@ -20,17 +24,6 @@ const TIMER_ACTIONS = QUICK_ACTIONS.filter(
   (action): action is TimerAction => action.kind === "timer",
 );
 
-const RUNNING: Record<CategoryToken, string> = {
-  "cat-feed": "bg-cat-feed ring-4 ring-cat-feed/30",
-  "cat-bottle": "bg-cat-bottle ring-4 ring-cat-bottle/30",
-  "cat-sleep": "bg-cat-sleep ring-4 ring-cat-sleep/30",
-  "cat-diaper": "bg-cat-diaper ring-4 ring-cat-diaper/30",
-  "cat-pump": "bg-cat-pump ring-4 ring-cat-pump/30",
-  "cat-tummy": "bg-cat-tummy ring-4 ring-cat-tummy/30",
-  "cat-med": "bg-cat-med ring-4 ring-cat-med/30",
-  "cat-temp": "bg-cat-temp ring-4 ring-cat-temp/30",
-};
-
 const IDLE: Record<CategoryToken, string> = {
   "cat-feed": "text-cat-feed",
   "cat-bottle": "text-cat-bottle",
@@ -77,7 +70,9 @@ export function TimerButtons({
               <span
                 className={cx(
                   "relative flex size-[58px] items-center justify-center rounded-full",
-                  on ? `${RUNNING[token]} text-bg` : `glass ${IDLE[token]}`,
+                  on
+                    ? `${CATEGORY_RUNNING[token]} text-bg`
+                    : `glass ${IDLE[token]}`,
                 )}
               >
                 <Icon
diff --git a/components/ui/TimerRing.tsx b/components/ui/TimerRing.tsx
deleted file mode 100644
index f0b0287..0000000
--- a/components/ui/TimerRing.tsx
+++ /dev/null
@@ -1,64 +0,0 @@
-import type { ReactNode } from "react";
-import type { CategoryToken } from "@/lib/ui/categories";
-
-const RING: Record<CategoryToken, { arc: string; track: string }> = {
-  "cat-feed": { arc: "stroke-cat-feed", track: "stroke-cat-feed/12" },
-  "cat-bottle": { arc: "stroke-cat-bottle", track: "stroke-cat-bottle/12" },
-  "cat-sleep": { arc: "stroke-cat-sleep", track: "stroke-cat-sleep/12" },
-  "cat-diaper": { arc: "stroke-cat-diaper", track: "stroke-cat-diaper/12" },
-  "cat-pump": { arc: "stroke-cat-pump", track: "stroke-cat-pump/12" },
-  "cat-tummy": { arc: "stroke-cat-tummy", track: "stroke-cat-tummy/12" },
-  "cat-med": { arc: "stroke-cat-med", track: "stroke-cat-med/12" },
-  "cat-temp": { arc: "stroke-cat-temp", track: "stroke-cat-temp/12" },
-};
-
-const SIZE = 200;
-const STROKE = 12;
-const RADIUS = (SIZE - STROKE) / 2;
-export const RING_CIRCUMFERENCE = 2 * Math.PI * RADIUS;
-
-export function TimerRing({
-  token,
-  progress,
-  children,
-}: {
-  token: CategoryToken;
-  progress: number;
-  children: ReactNode;
-}) {
-  const filled = Math.min(1, Math.max(0, progress));
-  return (
-    <div className="relative size-[200px] shrink-0">
-      <svg
-        aria-hidden="true"
-        width={SIZE}
-        height={SIZE}
-        viewBox={`0 0 ${SIZE} ${SIZE}`}
-        className="-rotate-90"
-      >
-        <circle
-          cx={SIZE / 2}
-          cy={SIZE / 2}
-          r={RADIUS}
-          fill="none"
-          strokeWidth={STROKE}
-          className={RING[token].track}
-        />
-        <circle
-          cx={SIZE / 2}
-          cy={SIZE / 2}
-          r={RADIUS}
-          fill="none"
-          strokeWidth={STROKE}
-          strokeLinecap="round"
-          strokeDasharray={RING_CIRCUMFERENCE}
-          strokeDashoffset={RING_CIRCUMFERENCE * (1 - filled)}
-          className={RING[token].arc}
-        />
-      </svg>
-      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
-        {children}
-      </div>
-    </div>
-  );
-}
diff --git a/lib/rules/hero.ts b/lib/rules/hero.ts
index 9a48769..826318b 100644
--- a/lib/rules/hero.ts
+++ b/lib/rules/hero.ts
@@ -75,6 +75,14 @@ export function longTimerText(
   return `${timerLabel(log)} đã chạy ${ran}. Còn đang ${STILL[log.type] ?? "chạy"} không?`;
 }
 
+// Spec 2026-11-19 §3.2: the label over a running timer on the hero card.
+export function runningLabel(log: { type: string; details: unknown }): string {
+  const doing = `Đang ${STILL[log.type] ?? "chạy"}`;
+  if (log.type !== "breast") return doing;
+  const side = (log.details as { side?: unknown } | null)?.side;
+  return `${doing} ${side === "left" ? "trái" : "phải"}`;
+}
+
 export function formatClock(ms: number): string {
   const total = Math.max(0, Math.floor(ms / 1000));
   const hours = Math.floor(total / 3600);
diff --git a/lib/ui/categories.ts b/lib/ui/categories.ts
index 80c84f5..d84470d 100644
--- a/lib/ui/categories.ts
+++ b/lib/ui/categories.ts
@@ -47,3 +47,15 @@ export const CATEGORY_CHIP: Record<CategoryToken, string> = {
   "cat-med": "bg-cat-med/15 text-cat-med",
   "cat-temp": "bg-cat-temp/15 text-cat-temp",
 };
+
+// Circle of a running timer: the category colour, solid, inside a 30% halo.
+export const CATEGORY_RUNNING: Record<CategoryToken, string> = {
+  "cat-feed": "bg-cat-feed ring-4 ring-cat-feed/30",
+  "cat-bottle": "bg-cat-bottle ring-4 ring-cat-bottle/30",
+  "cat-sleep": "bg-cat-sleep ring-4 ring-cat-sleep/30",
+  "cat-diaper": "bg-cat-diaper ring-4 ring-cat-diaper/30",
+  "cat-pump": "bg-cat-pump ring-4 ring-cat-pump/30",
+  "cat-tummy": "bg-cat-tummy ring-4 ring-cat-tummy/30",
+  "cat-med": "bg-cat-med ring-4 ring-cat-med/30",
+  "cat-temp": "bg-cat-temp ring-4 ring-cat-temp/30",
+};
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/home/herocard.test.tsx lib/rules/hero.test.ts lib/ui/categories.test.ts components/home/buttons.test.tsx components/home/homescreen.test.tsx && bun run typecheck`
Expected: `Tests  49 passed (49)`; `tsc --noEmit` không báo lỗi.

Patch này cũng bỏ `sub` và import `sleepStatusLine` khỏi `HomeScreen.tsx`. Từ đây tới Task 3 của M2c, trang Hôm nay tạm không có dòng "Vitamin D đã uống" và không có giờ cữ bú tiếp.

- [x] **Step 5: Commit**

```bash
git add -- components/home/HeroCard.tsx components/home/HomeScreen.tsx components/home/TimerButtons.tsx components/ui/TimerRing.tsx lib/rules/hero.ts lib/ui/categories.ts components/home/herocard.test.tsx components/ui/timerring.test.tsx lib/rules/hero.test.ts lib/ui/categories.test.ts
git commit -m "feat(home): compact hero card in five states" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Component `StatusTiles` kèm dòng Vitamin D (§3.3)

**Files:**

- Create: `components/home/StatusTiles.tsx`
- Test: `components/home/statustiles.test.tsx` (mới)

**Interfaces:**

- Consumes: `StatusTile` (M2a, `lib/rules/status.ts`); `Glass` với `radius="tile"`; `cx`.
- Produces: `StatusTiles({ tiles, vitaminD }: { tiles: StatusTile[]; vitaminD: string | null })` trong `components/home/StatusTiles.tsx`. Ô có `tone === "warn"` nhận thêm `border-warn!`. Khi `vitaminD` có giá trị, dưới hàng ô có dòng "Vitamin D đã uống {vitaminD}".

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/home/statustiles.test.tsx b/components/home/statustiles.test.tsx
new file mode 100644
index 0000000..f3fe166
--- /dev/null
+++ b/components/home/statustiles.test.tsx
@@ -0,0 +1,76 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import type { StatusTile } from "@/lib/rules/status";
+import { StatusTiles } from "./StatusTiles";
+
+const tiles: StatusTile[] = [
+  { label: "Cữ bú tiếp", value: "14:00", note: "còn 2g", tone: "good" },
+  { label: "Bú gần nhất", value: "11:00", note: "trái · 15p", tone: "muted" },
+  { label: "Tã gần nhất", value: "—", note: "chưa ghi", tone: "muted" },
+];
+const html = (list: StatusTile[], vitaminD: string | null = null) =>
+  renderToStaticMarkup(<StatusTiles tiles={list} vitaminD={vitaminD} />);
+// The class of the element whose whole content is `text`.
+const classOf = (out: string, text: string) =>
+  out.match(new RegExp(`class="([^"]*)">${text}</`))?.[1] ?? "";
+
+// Spec 2026-11-19 §3.3.
+describe("StatusTiles", () => {
+  it("draws three glass tiles in a 3-column grid, 8 px apart", () => {
+    const out = html(tiles);
+    expect(out).toContain('<div class="grid grid-cols-3 gap-2">');
+    expect(out.match(/class="glass rounded-\[24px\] [^"]*"/g)).toHaveLength(3);
+    expect(out.match(/px-3 py-2\.5/g)).toHaveLength(3);
+    const labels = [...out.matchAll(/text-muted">([^<]+)<\/span><span/g)];
+    expect(labels.map((m) => m[1])).toEqual([
+      "Cữ bú tiếp",
+      "Bú gần nhất",
+      "Tã gần nhất",
+    ]);
+  });
+
+  it("sets label 12/16 muted, value 20/26 bold, note 12/16 semibold, none wrapping", () => {
+    const out = html(tiles);
+    expect(classOf(out, "Cữ bú tiếp")).toBe(
+      "text-xs leading-4 whitespace-nowrap text-muted",
+    );
+    expect(classOf(out, "14:00")).toBe(
+      "text-xl leading-[26px] font-bold whitespace-nowrap text-ink tabular-nums",
+    );
+    expect(classOf(out, "còn 2g")).toContain(
+      "text-xs leading-4 font-semibold whitespace-nowrap",
+    );
+    expect(out.match(/whitespace-nowrap/g)).toHaveLength(9);
+  });
+
+  it("colours the note by tone", () => {
+    const out = html(tiles);
+    expect(classOf(out, "còn 2g")).toContain("text-good");
+    expect(classOf(out, "trái · 15p")).toContain("text-muted");
+    expect(out).not.toContain("text-warn");
+    expect(out).not.toContain("border-warn!");
+  });
+
+  it("a late feed gets a warn note and a warn border on its tile only", () => {
+    const late: StatusTile[] = [
+      { label: "Cữ bú tiếp", value: "11:30", note: "trễ 30p", tone: "warn" },
+      tiles[1],
+      tiles[2],
+    ];
+    const out = html(late);
+    expect(classOf(out, "trễ 30p")).toContain("text-warn");
+    expect(out.match(/border-warn!/g)).toHaveLength(1);
+    expect(out).toMatch(
+      /class="glass [^"]*border-warn![^"]*"><span[^>]*>Cữ bú/,
+    );
+  });
+
+  it("adds the Vitamin D line right under the tiles once today's dose is logged", () => {
+    const out = html(tiles, "08:10");
+    expect(out).toContain(
+      '</div><p class="px-1 text-[13px] leading-[18px] text-muted">Vitamin D đã uống 08:10</p></div>',
+    );
+    expect(html(tiles, null)).not.toContain("Vitamin D");
+    expect(html(tiles, null)).not.toContain("<p");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/home/statustiles.test.tsx`
Expected: FAIL, `Test Files  1 failed (1)`, không test nào chạy được (`Cannot find module './StatusTiles'`).

- [x] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/components/home/StatusTiles.tsx b/components/home/StatusTiles.tsx
new file mode 100644
index 0000000..b70e57d
--- /dev/null
+++ b/components/home/StatusTiles.tsx
@@ -0,0 +1,56 @@
+import { Glass } from "@/components/ui/Glass";
+import type { StatusTile } from "@/lib/rules/status";
+import { cx } from "@/lib/ui/cx";
+
+const TONE: Record<StatusTile["tone"], string> = {
+  good: "text-good",
+  warn: "text-warn",
+  muted: "text-muted",
+};
+
+// Spec 2026-11-19 §3.3: next feed, last feed and last diaper, then the time of
+// today's Vitamin D once it is logged. Only a late feed has the warn tone.
+export function StatusTiles({
+  tiles,
+  vitaminD,
+}: {
+  tiles: StatusTile[];
+  vitaminD: string | null;
+}) {
+  return (
+    <div className="flex flex-col gap-2">
+      <div className="grid grid-cols-3 gap-2">
+        {tiles.map((tile) => (
+          <Glass
+            key={tile.label}
+            radius="tile"
+            className={cx(
+              "flex flex-col px-3 py-2.5",
+              tile.tone === "warn" && "border-warn!",
+            )}
+          >
+            <span className="text-xs leading-4 whitespace-nowrap text-muted">
+              {tile.label}
+            </span>
+            <span className="text-xl leading-[26px] font-bold whitespace-nowrap text-ink tabular-nums">
+              {tile.value}
+            </span>
+            <span
+              className={cx(
+                "text-xs leading-4 font-semibold whitespace-nowrap",
+                TONE[tile.tone],
+              )}
+            >
+              {tile.note}
+            </span>
+          </Glass>
+        ))}
+      </div>
+      {vitaminD && (
+        <p className="px-1 text-[13px] leading-[18px] text-muted">
+          Vitamin D đã uống {vitaminD}
+        </p>
+      )}
+    </div>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/home/statustiles.test.tsx && bun run typecheck`
Expected: `Tests  5 passed (5)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add -- components/home/StatusTiles.tsx components/home/statustiles.test.tsx
git commit -m "feat(home): status tiles with the Vitamin D line" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm giữa chừng M2b

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2b.md` (tick các ô)

**Interfaces:**

- Consumes: mọi thứ Task 1–2 tạo ra.
- Produces: nhánh của plan này làm nền cho M2c. Nhánh không lên `main` trước khi M2c xong.

- [x] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  151 passed (151)`, `Tests  984 passed (984)`.

- [x] **Step 2: Commit phần tick**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m2b.md
git commit -m "docs(plan): tick the M2b steps" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```
