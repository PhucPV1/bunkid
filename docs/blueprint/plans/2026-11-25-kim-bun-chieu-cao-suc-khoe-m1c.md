# Kim Bun — Sức khỏe M1c: thanh 4 tab, bỏ Khám phá, nút quay lại Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§3.1, §3.2, §3.3; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng: "Duyệt ba plan"; chưa có lệnh chạy, mỗi lần lên `main` vẫn phải hỏi)

**Goal:** Thanh tab có 4 tab Hôm nay · Nhật ký · Sức khỏe · Tiện ích; trang Khám phá bị bỏ và địa chỉ cũ tự chuyển sang Sức khỏe; mọi trang con quay lại đúng tab của nó.

**Architecture:**

- **Ba bước, bước nào xong app cũng chạy được.** Task 1 cho `/kham-pha` và `/cam-nang` chuyển hướng sang `/suc-khoe` và xóa màn Khám phá (tab "Khám phá" lúc này dẫn tới trang chuyển hướng). Task 2 đổi `TABS`, `activeTab` và ô timer. Task 3 đổi nút quay lại của 12 màn.
- **`lib/nav.ts`** là nơi duy nhất định nghĩa tab và trang nào thuộc tab nào; các tên `EXPLORE_*` bị xóa ở Task 2.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m1c`, cắt từ `main` sau khi M1b đã lên (`main` lúc đó bằng `feat/kim-bun-suc-khoe-m1b`). Baseline: 1203 test vitest xanh (164 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                 | Plan                                           |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| M1a                | §3.6; danh mục của §3.4 và §3.5; luật của §4 dòng 2 và 3 | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1a.md` |
| M1b                | §3.4 trang Sức khỏe, §3.5 trang Tiện ích, §4 dòng 2 và 3 | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1b.md` |
| **M1c (plan này)** | §3.1, §3.2, §3.3: 4 tab, chuyển hướng, nút quay lại      | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1c.md` |
| M2                 | §5 Tăng trưởng, chip trên thẻ, dòng 1 của §4             | chưa viết                                      |
| M3                 | §6 Chiều cao                                             | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4           | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                             | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **`/tang-truong/chieu-cao` vào danh sách `PAGES` của service worker ngay ở plan này**, đúng như §3.1 ghi, dù trang đó tới M3 mới có. Bước cài của worker dùng `Promise.allSettled` cho `PAGES`, nên một trang chưa tồn tại chỉ bị bỏ qua.
2. **Icon `explore` bị xóa** vì không còn chỗ dùng (§3.1). Tổng số icon từ 48 xuống 47.
3. **`growthCardText` bị xóa** cùng test của nó (§3.4); `lib/rules/exploreCards.ts` giữ tên file và chỉ còn `vaccineCardText`.
4. **Test của nút quay lại đọc mã nguồn** của 12 màn và tìm đúng chuỗi `back={{ href: …, label: … }}`. 5 màn (Khẩn cấp, Thống kê, Tăng trưởng, Tiêm chủng, Phát triển) hiện không có test nào dựng cả màn để kiểm nút này.
5. **`components/ui/pageheader.test.tsx`** dùng "Khám phá" làm chữ mẫu cho tiêu đề; đổi thành "Sức khỏe" để trong repo không còn chữ "Khám phá" ngoài hai trang chuyển hướng.
6. **Tiêu chí 375 px của ô timer (§3.3)** được đo ở Task 4 trên một trang fixture tạm, vì không được bắt đầu timer trên dữ liệu thật. Nếu đo không đạt thì **dừng và báo người dùng**; việc thu vòng icon xuống 32 px mà §3.3 cho phép là một thay đổi code ngoài các patch đã chạy thử, cần một task mới.
7. **Tên của ô timer cho trình đọc màn hình không đổi** (§3.3): vẫn là "…, còn {n} timer khác đang chạy".
8. **Kiểm trình duyệt** ở Task 4 chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m1c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Xóa file.** Patch 2 không chứa nội dung của hai file bị xóa trong `components/explore/`; Step 3 của Task 1 xóa chúng bằng `git rm` trước khi áp patch.
- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `573bdc4` và nối tiếp các plan trước của mốc M1; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 4 dừng lại hỏi, không tự push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Next.js.** Hai trang chuyển hướng dùng `RedirectTo` có sẵn, đúng như `app/cam-nang/page.tsx` đang làm; không dùng API nào của Next mà repo chưa dùng.

## Contracts with Other Plans

Plan này đứng ngay sau M1b. M2 trở đi dùng thanh 4 tab và các tên dưới đây.

**Consumes:**

- Từ M1a (`2026-11-25-kim-bun-chieu-cao-suc-khoe-m1a.md`): `lib/nav.ts` có `NavItem`, `HEALTH_EMERGENCY`, `HEALTH_GROWTH`, `HEALTH_CARDS`, `HEALTH_STATS`, `HEALTH_SICK`, `TOOLS`, cùng các tên `EXPLORE_*` và `type ExploreItem` (bị xóa ở đây); icon `pulse`, `grid`; `latestGrowth` (`lib/rules/growthForm.ts`), đã thay chỗ của `growthCardText`.
- Từ M1b (`2026-11-25-kim-bun-chieu-cao-suc-khoe-m1b.md`): trang `/suc-khoe` (`HealthScreen`) và `/tien-ich` (`ToolsScreen`).

**Produces:**

- `lib/nav.ts`: `TabKey = "home" | "history" | "health" | "tools"`; `TABS` gồm 4 tab; `activeTab(pathname)` trả `"health"` cho `/suc-khoe`, `/kham-pha`, `/cam-nang`, `/khan-cap`, `/thong-ke`, `/tang-truong` (gồm trang con), `/tiem-chung`, `/phat-trien`, `/trieu-chung`, `/benh-thuong-gap`, `/bao-cao`, và `"tools"` cho `/tien-ich`, `/on-trang`, `/nhac`, `/anh`, `/bong-be`. Không còn tên nào chứa `EXPLORE` hay `ExploreItem`.
- `components/nav/TabBar.tsx`: ô timer `flex-[2.2]`; dòng nhỏ `Hôm nay` hoặc `Hôm nay +{n}`.
- `/kham-pha` và `/cam-nang` chuyển hướng tới `/suc-khoe`. `components/explore/` không còn.
- `lib/rules/exploreCards.ts` chỉ còn `vaccineCardText`. `lib/ui/icons.ts` không còn `explore` (47 icon).
- `sw/sw.template.js`: `PAGES` có thêm `/suc-khoe` và `/tang-truong/chieu-cao`.
- Nút quay lại: 8 màn về `{ href: "/suc-khoe", label: "Sức khỏe" }`, 4 màn về `{ href: "/tien-ich", label: "Tiện ích" }`.
- **Vitest sau M1c:** 1201 test, 165 file.

---

### Task 1: Khám phá và Cẩm nang chuyển hướng sang Sức khỏe; bỏ màn Khám phá (§3.1, §3.4)

**Files:**

- Modify: `app/kham-pha/page.tsx`, `app/cam-nang/page.tsx`, `lib/rules/exploreCards.ts`, `sw/sw.template.js`
- Delete: `components/explore/ExploreScreen.tsx`, `components/explore/explore.test.tsx`
- Test: `components/nav/redirects.test.tsx` (mới), `lib/rules/exploreCards.test.ts`, `scripts/sw.test.ts`

**Interfaces:**

- Consumes: `RedirectTo` (`components/nav/RedirectTo.tsx`); trang `/suc-khoe` của M1b.
- Produces: hai trang chuyển hướng; `lib/rules/exploreCards.ts` chỉ còn `vaccineCardText(next: ScheduleItem | null): string | null`; `PAGES` của service worker có `/suc-khoe` và `/tang-truong/chieu-cao`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m1c
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/nav/redirects.test.tsx b/components/nav/redirects.test.tsx
new file mode 100644
index 0000000..4ef1831
--- /dev/null
+++ b/components/nav/redirects.test.tsx
@@ -0,0 +1,20 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import CamNang from "@/app/cam-nang/page";
+import KhamPha from "@/app/kham-pha/page";
+
+const RedirectTo = vi.hoisted(() => vi.fn((_props: { href: string }) => null));
+vi.mock("@/components/nav/RedirectTo", () => ({ RedirectTo }));
+
+// Spec 2026-11-25 §3.1: old links and installed shortcuts still land somewhere.
+describe("pages that moved into Sức khỏe", () => {
+  it.each([
+    ["/kham-pha", KhamPha],
+    ["/cam-nang", CamNang],
+  ])("%s redirects to /suc-khoe", (_, Page) => {
+    RedirectTo.mockClear();
+    renderToStaticMarkup(<Page />);
+    expect(RedirectTo).toHaveBeenCalledOnce();
+    expect(RedirectTo.mock.calls[0][0]).toEqual({ href: "/suc-khoe" });
+  });
+});
diff --git a/lib/rules/exploreCards.test.ts b/lib/rules/exploreCards.test.ts
index d94b15d..ea63f9a 100644
--- a/lib/rules/exploreCards.test.ts
+++ b/lib/rules/exploreCards.test.ts
@@ -1,58 +1,12 @@
 import { describe, expect, it } from "vitest";
-import { growthCardText, vaccineCardText } from "./exploreCards";
+import * as cards from "./exploreCards";
+import { vaccineCardText } from "./exploreCards";
 import type { DoseState, ScheduleItem } from "./vaccines";

-const measure = (measured_on: string, weight_g: number | null) => ({
-  measured_on,
-  weight_g,
-  length_cm: 58.5,
-  head_cm: null,
-});
-
-// Spec 2026-11-19 §9.
+// Spec 2026-11-25 §3.4: the growth card reads latestGrowth now.
 describe("growthCardText", () => {
-  it("shows the latest weight in grams with a thousands dot, then its day", () => {
-    expect(growthCardText([measure("2026-11-15", 5500)])).toBe(
-      "Cân nặng 5.500 g · 15/11",
-    );
-    expect(growthCardText([measure("2026-09-10", 950)])).toBe(
-      "Cân nặng 950 g · 10/09",
-    );
-    expect(growthCardText([measure("2027-03-01", 10250)])).toBe(
-      "Cân nặng 10.250 g · 01/03",
-    );
-  });
-
-  it("takes the newest measurement that has a weight, whatever the row order", () => {
-    const rows = [
-      measure("2026-10-14", 4300),
-      measure("2026-11-20", null),
-      measure("2026-11-15", 5500),
-    ];
-    expect(growthCardText(rows)).toBe("Cân nặng 5.500 g · 15/11");
-    expect(growthCardText([...rows].reverse())).toBe(
-      "Cân nặng 5.500 g · 15/11",
-    );
-    // The rows keep the order they came in.
-    expect(rows.map((row) => row.measured_on)).toEqual([
-      "2026-10-14",
-      "2026-11-20",
-      "2026-11-15",
-    ]);
-  });
-
-  it("two weights on one day: the first row wins, as the query lists the newest first", () => {
-    expect(
-      growthCardText([
-        measure("2026-11-15", 5600),
-        measure("2026-11-15", 5500),
-      ]),
-    ).toBe("Cân nặng 5.600 g · 15/11");
-  });
-
-  it("returns null when no measurement has a weight", () => {
-    expect(growthCardText([])).toBeNull();
-    expect(growthCardText([measure("2026-11-20", null)])).toBeNull();
+  it("is gone", () => {
+    expect(Object.keys(cards)).toEqual(["vaccineCardText"]);
   });
 });

diff --git a/scripts/sw.test.ts b/scripts/sw.test.ts
index c46dae5..d30a3a4 100644
--- a/scripts/sw.test.ts
+++ b/scripts/sw.test.ts
@@ -103,6 +103,9 @@ describe("service worker", () => {
         "/nhat-ky",
         "/thong-ke",
         "/kham-pha",
+        "/suc-khoe",
+        "/tien-ich",
+        "/tang-truong/chieu-cao",
         "/cai-dat/thanh-vien",
         "/cai-dat/nhac-thuoc",
         "/dang-nhap",
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  3 failed | 162 passed (165)`, `Tests  4 failed | 1198 passed (1202)`. Lý do đỏ: `/kham-pha` còn vẽ màn Khám phá, `/cam-nang` còn chuyển tới `/kham-pha`, `growthCardText` còn đó, worker chưa lưu `/suc-khoe`.

- [x] **Step 3: Xóa màn Khám phá rồi viết code (Patch 2)**

```bash
git rm -r -q components/explore
```

```diff
diff --git a/app/cam-nang/page.tsx b/app/cam-nang/page.tsx
index fe0a978..2175188 100644
--- a/app/cam-nang/page.tsx
+++ b/app/cam-nang/page.tsx
@@ -2,7 +2,7 @@

 import { RedirectTo } from "@/components/nav/RedirectTo";

-// Spec §6.2: Cẩm nang and Tiện ích are now sections of Khám phá.
+// Spec 2026-11-25 §3.1: Khám phá and Cẩm nang are now the Sức khỏe tab.
 export default function Page() {
-  return <RedirectTo href="/kham-pha" />;
+  return <RedirectTo href="/suc-khoe" />;
 }
diff --git a/app/kham-pha/page.tsx b/app/kham-pha/page.tsx
index 91bd463..2175188 100644
--- a/app/kham-pha/page.tsx
+++ b/app/kham-pha/page.tsx
@@ -1,12 +1,8 @@
 "use client";

-import { AuthGate } from "@/components/AuthGate";
-import { ExploreScreen } from "@/components/explore/ExploreScreen";
+import { RedirectTo } from "@/components/nav/RedirectTo";

+// Spec 2026-11-25 §3.1: Khám phá and Cẩm nang are now the Sức khỏe tab.
 export default function Page() {
-  return (
-    <AuthGate need="baby">
-      {({ ctx }) => (ctx?.baby ? <ExploreScreen baby={ctx.baby} /> : null)}
-    </AuthGate>
-  );
+  return <RedirectTo href="/suc-khoe" />;
 }
diff --git a/lib/rules/exploreCards.ts b/lib/rules/exploreCards.ts
index 0c2883a..bac9963 100644
--- a/lib/rules/exploreCards.ts
+++ b/lib/rules/exploreCards.ts
@@ -1,25 +1,7 @@
 import { formatDayShort } from "./days";
-import type { GrowthInput } from "./growthForm";
 import type { ScheduleItem } from "./vaccines";

-const grams = new Intl.NumberFormat("vi-VN");
-
-// Spec 2026-11-19 §9: the line on the Tăng trưởng card of Khám phá, from the
-// latest measurement that has a weight. On the same day the first row wins.
-export function growthCardText(
-  rows: Pick<GrowthInput, "measured_on" | "weight_g">[],
-): string | null {
-  let latest: { day: string; weightG: number } | null = null;
-  for (const row of rows) {
-    if (row.weight_g === null) continue;
-    if (latest === null || row.measured_on > latest.day)
-      latest = { day: row.measured_on, weightG: row.weight_g };
-  }
-  if (latest === null) return null;
-  return `Cân nặng ${grams.format(latest.weightG)} g · ${formatDayShort(latest.day)}`;
-}
-
-// Spec 2026-11-19 §9: the line on the Tiêm chủng card, for the dose nextDose
+// Spec 2026-11-19 §9: the line on the Tiêm chủng card of Sức khỏe, for the dose nextDose
 // returned. The day comes first so a long dose name cannot cut it off.
 export function vaccineCardText(next: ScheduleItem | null): string | null {
   if (next === null) return null;
diff --git a/sw/sw.template.js b/sw/sw.template.js
index bf5d1b1..056b1f1 100644
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -16,6 +16,7 @@ const PAGES = [
   "/nhat-ky",
   "/thong-ke",
   "/tang-truong",
+  "/tang-truong/chieu-cao",
   "/on-trang",
   "/nhac",
   "/anh",
@@ -23,6 +24,7 @@ const PAGES = [
   "/cam-nang",
   "/tien-ich",
   "/kham-pha",
+  "/suc-khoe",
   "/cai-dat",
   "/cai-dat/ho-so",
   "/cai-dat/thanh-vien",
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  164 passed (164)`, `Tests  1187 passed (1187)`; `tsc --noEmit` không báo lỗi. Số test giảm vì 15 test của màn Khám phá đã bị xóa cùng màn đó.

- [x] **Step 5: Commit**

```bash
git add -A app/kham-pha app/cam-nang components/explore components/nav/redirects.test.tsx lib/rules/exploreCards.ts lib/rules/exploreCards.test.ts sw/sw.template.js scripts/sw.test.ts
git commit -m "feat(nav): Khám phá and Cẩm nang redirect to Sức khỏe; the Khám phá screen is removed" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

> Ghi chú thực thi 2026-11-25: lệnh `git add` trên dừng với `fatal: pathspec 'components/explore' did not match any files`, vì `git rm` ở Step 3 đã đưa việc xóa vào index và thư mục không còn. Đã chạy lại đúng lệnh đó, chỉ bỏ `components/explore` khỏi danh sách. Commit `35c2951` gồm đủ 9 file, kể cả hai file bị xóa.

### Task 2: Thanh 4 tab và ô timer rộng hơn (§3.1, §3.3)

**Files:**

- Modify: `lib/nav.ts`, `lib/ui/icons.ts`, `components/nav/TabBar.tsx`
- Test: `lib/nav.test.ts`, `components/nav/tabbar.test.tsx`, `components/actions/actionchrome.test.tsx`, `lib/ui/categories.test.ts`

**Interfaces:**

- Consumes: `HEALTH_*`, `TOOLS`, icon `pulse`, `grid` (M1a).
- Produces: `TabKey = "home" | "history" | "health" | "tools"`, `TABS` 4 tab, `activeTab` như ghi ở Contracts; ô timer `flex-[2.2]` và dòng nhỏ `Hôm nay +{n}`; không còn `EXPLORE_*`, `ExploreItem`, icon `explore`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/actions/actionchrome.test.tsx b/components/actions/actionchrome.test.tsx
index f4753ce..7cc018e 100644
--- a/components/actions/actionchrome.test.tsx
+++ b/components/actions/actionchrome.test.tsx
@@ -120,7 +120,7 @@ describe("ActionChrome with a running timer", () => {
       'aria-label="Hôm nay, Ngủ đã chạy 12:34, còn 1 timer khác đang chạy"',
     );
     expect(home).toContain(">12:34</span>");
-    expect(home).toContain(">Hôm nay · +1</span>");
+    expect(home).toContain(">Hôm nay +1</span>");
     expect(home).not.toContain("aria-current");
   });

@@ -137,7 +137,7 @@ describe("ActionChrome with a running timer", () => {
     const html = render(TIMERS);
     expect(html).toContain(">Hôm nay</a>");
     expect(html).not.toContain("đã chạy");
-    expect(html).not.toContain("flex-[1.7]");
+    expect(html).not.toContain("flex-[2.2]");
     expect(homeTab(html)).toContain("bg-accent-tint text-accent-text");
   });

diff --git a/components/nav/tabbar.test.tsx b/components/nav/tabbar.test.tsx
index 722ecd8..6fa5985 100644
--- a/components/nav/tabbar.test.tsx
+++ b/components/nav/tabbar.test.tsx
@@ -32,7 +32,7 @@ beforeEach(() => {
 });

 describe("TabBarView", () => {
-  it("is a floating glass pill with three icon tabs", () => {
+  it("is a floating glass pill with four icon tabs", () => {
     const html = renderToStaticMarkup(<TabBarView current="history" />);
     expect(html).toContain('aria-label="Điều hướng chính"');
     expect(html).toContain("glass-strong");
@@ -41,11 +41,13 @@ describe("TabBarView", () => {
       "bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)]",
     );
     expect(html).toContain("print:hidden");
-    expect(html.match(/<a /g)).toHaveLength(3);
-    for (const name of ["home", "list", "explore"] as const)
+    expect(html.match(/<a /g)).toHaveLength(4);
+    for (const name of ["home", "list", "pulse", "grid"] as const)
       expect(html).toContain(`d="${ICON_PATHS[name]}"`);
     expect(html).toContain(">Hôm nay</a>");
-    expect(html).toContain(">Khám phá</a>");
+    expect(html).toContain(">Sức khỏe</a>");
+    expect(html).toContain(">Tiện ích</a>");
+    expect(html).not.toContain("Khám phá");
   });

   it("marks only the current tab", () => {
@@ -56,6 +58,7 @@ describe("TabBarView", () => {
       false,
       true,
       false,
+      false,
     ]);
     expect(anchors[1]).toContain("bg-accent-tint text-accent-text");
     expect(anchors[0]).not.toContain("bg-accent-tint");
@@ -110,7 +113,7 @@ describe("TabBarView timer tile", () => {
   const itemsOf = (html: string) =>
     [...html.matchAll(/<li class="([^"]*)">/g)].map((m) => m[1]);

-  it("without a timer the three tabs share the bar equally and nothing ticks", () => {
+  it("without a timer the four tabs share the bar equally and nothing ticks", () => {
     for (const html of [
       renderToStaticMarkup(<TabBarView current="history" />),
       renderToStaticMarkup(<TabBarView current="history" timer={null} />),
@@ -119,6 +122,7 @@ describe("TabBarView timer tile", () => {
         "flex flex-1",
         "flex flex-1",
         "flex flex-1",
+        "flex flex-1",
       ]);
       expect(html).toContain(">Hôm nay</a>");
       expect(html).not.toContain("tabular-nums");
@@ -134,13 +138,15 @@ describe("TabBarView timer tile", () => {
         timer={{ log: row({}), more: 0 }}
       />,
     );
+    // Spec 2026-11-25 §3.3: with four tabs the tile takes 2.2 shares.
     expect(itemsOf(html)).toEqual([
-      "flex flex-[1.7]",
+      "flex flex-[2.2]",
+      "flex flex-1",
       "flex flex-1",
       "flex flex-1",
     ]);
     const anchors = anchorsOf(html);
-    expect(anchors).toHaveLength(3);
+    expect(anchors).toHaveLength(4);
     const [home, history] = anchors;
     // Still a link to Hôm nay, where the timer can be stopped.
     expect(home).toContain('href="/"');
@@ -160,11 +166,12 @@ describe("TabBarView timer tile", () => {
     expect(home).toContain(
       '<span class="text-[10px] leading-3 font-semibold whitespace-nowrap text-ink">Hôm nay</span>',
     );
-    // The other two tabs are drawn as before.
+    // The other three tabs are drawn as before.
     expect(history).toContain('aria-current="page"');
     expect(history).toContain("bg-accent-tint text-accent-text");
     expect(history).toContain(">Nhật ký</a>");
-    expect(html).toContain(">Khám phá</a>");
+    expect(html).toContain(">Sức khỏe</a>");
+    expect(html).toContain(">Tiện ích</a>");
     // Nothing stops the timer from here: the only button is "+".
     expect(html).not.toContain("Dừng");
     expect(html.match(/<button/g)).toHaveLength(1);
@@ -180,7 +187,7 @@ describe("TabBarView timer tile", () => {
   it("shows hours and minutes past one hour and counts the other timers", () => {
     const html = renderToStaticMarkup(
       <TabBarView
-        current="explore"
+        current="health"
         timer={{
           log: row({
             type: "sleep",
@@ -192,12 +199,13 @@ describe("TabBarView timer tile", () => {
       />,
     );
     const [home] = anchorsOf(html);
-    // A screen reader hears the count that sighted users read as "· +2".
+    // A screen reader hears the count that sighted users read as "+2".
     expect(home).toContain(
       'aria-label="Hôm nay, Ngủ đã chạy 1:30:05, còn 2 timer khác đang chạy"',
     );
     expect(home).toContain(">1g 30p</span>");
-    expect(home).toContain(">Hôm nay · +2</span>");
+    expect(home).toContain(">Hôm nay +2</span>");
+    expect(home).not.toContain(" · ");
     expect(home).toContain("bg-cat-sleep/15");
     expect(home).toContain("rounded-full bg-cat-sleep text-bg");
     expect(home).toContain(`d="${ICON_PATHS.moon}"`);
@@ -230,11 +238,11 @@ describe("TabBarView timer tile", () => {
       true,
       false,
       false,
+      false,
     ]);
     expect(anchors[0]).toContain("bg-cat-feed/15");
     expect(anchors.join("")).not.toContain("bg-accent-tint");
   });
-
 });

 // Spec 2026-11-19 §4: the floating pill is gone, and so is the room it took.
diff --git a/lib/nav.test.ts b/lib/nav.test.ts
index bdfd69d..cec1610 100644
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -1,105 +1,85 @@
 import { describe, expect, it } from "vitest";
 import * as nav from "./nav";
-import {
-  activeTab,
-  EXPLORE_EMERGENCY,
-  EXPLORE_GUIDES,
-  EXPLORE_REPORT,
-  EXPLORE_SOOTHE,
-  EXPLORE_TRACK,
-  showsTabTimer,
-  TABS,
-} from "./nav";
+import { activeTab, showsTabTimer, TABS } from "./nav";

-const ALL_EXPLORE = [
-  ...EXPLORE_TRACK,
-  ...EXPLORE_GUIDES,
-  ...EXPLORE_SOOTHE,
-  EXPLORE_REPORT,
+const HEALTH_PAGES = [
+  nav.HEALTH_EMERGENCY,
+  nav.HEALTH_GROWTH,
+  ...nav.HEALTH_CARDS,
+  nav.HEALTH_STATS,
+  ...nav.HEALTH_SICK,
 ];

+// Spec 2026-11-25 §3.1.
 describe("nav", () => {
-  it("has the three tabs of spec §6.1 with SVG icons", () => {
+  it("has four tabs with SVG icons", () => {
     expect(TABS).toEqual([
       { key: "home", href: "/", label: "Hôm nay", icon: "home" },
       { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "list" },
-      { key: "explore", href: "/kham-pha", label: "Khám phá", icon: "explore" },
+      { key: "health", href: "/suc-khoe", label: "Sức khỏe", icon: "pulse" },
+      { key: "tools", href: "/tien-ich", label: "Tiện ích", icon: "grid" },
     ]);
   });

-  it("Khám phá lists the sections of spec §6.4 in order", () => {
-    expect(EXPLORE_EMERGENCY).toEqual({
-      label: "Khẩn cấp",
-      href: "/khan-cap",
-      detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
-    });
-    expect(
-      EXPLORE_TRACK.map((i) => [i.label, i.href, i.icon, i.color]),
-    ).toEqual([
-      ["Thống kê", "/thong-ke", "chart", "cat-sleep"],
-      ["Tăng trưởng", "/tang-truong", "ruler", "cat-tummy"],
-      ["Tiêm chủng", "/tiem-chung", "syringe", "cat-temp"],
-      ["Phát triển", "/phat-trien", "star", "cat-diaper"],
-    ]);
-    expect(
-      EXPLORE_GUIDES.map((i) => [i.label, i.href, i.icon, i.color]),
-    ).toEqual([
-      ["Triệu chứng", "/trieu-chung", "thermo", "cat-med"],
-      ["Bệnh thường gặp", "/benh-thuong-gap", "book", "cat-feed"],
-      ["Bồng bế", "/bong-be", "hands", "cat-tummy"],
-    ]);
-    expect(
-      EXPLORE_SOOTHE.map((i) => [i.label, i.href, i.icon, i.color]),
-    ).toEqual([
-      ["Ồn trắng", "/on-trang", "wave", "cat-sleep"],
-      ["Nhạc", "/nhac", "music", "cat-feed"],
-      ["Ảnh", "/anh", "image", "cat-diaper"],
-    ]);
-    expect(EXPLORE_REPORT).toEqual({
-      label: "Báo cáo cho bác sĩ",
-      href: "/bao-cao",
-      icon: "doc",
-      color: "cat-temp",
-      detail: "In A4 tóm tắt 14 ngày gần nhất",
-    });
+  it("Hôm nay and Nhật ký light up as before", () => {
+    expect(activeTab("/")).toBe("home");
+    expect(activeTab("/cai-dat")).toBe("home");
+    expect(activeTab("/cai-dat/thanh-vien")).toBe("home");
+    expect(activeTab("/nhat-ky")).toBe("history");
   });

-  it("track and guide cards carry the spec's one-line descriptions", () => {
-    expect(EXPLORE_TRACK.map((i) => i.detail)).toEqual([
-      "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
-      "Cân nặng, chiều dài theo chuẩn WHO",
-      "Mũi tiếp theo và lịch đã tiêm",
-      "Các mốc theo tháng tuổi",
+  it("Sức khỏe lights up on its page, its sub-pages and the two old addresses", () => {
+    for (const path of [
+      "/suc-khoe",
+      "/kham-pha",
+      "/cam-nang",
+      "/tang-truong/chieu-cao",
+      ...HEALTH_PAGES.map((item) => item.href),
+    ])
+      expect(activeTab(path), path).toBe("health");
+    expect(HEALTH_PAGES.map((item) => item.href)).toEqual([
+      "/khan-cap",
+      "/tang-truong",
+      "/tiem-chung",
+      "/phat-trien",
+      "/thong-ke",
+      "/trieu-chung",
+      "/benh-thuong-gap",
+      "/bao-cao",
     ]);
-    expect(EXPLORE_GUIDES.map((i) => i.detail)).toEqual([
-      "Hỏi từng bước, biết khi nào đi khám",
-      "10 bài theo NHS",
-      "Tư thế bế, ợ hơi, cho bú",
+  });
+
+  it("Tiện ích lights up on its page and its four sub-pages", () => {
+    for (const path of ["/tien-ich", ...nav.TOOLS.map((item) => item.href)])
+      expect(activeTab(path), path).toBe("tools");
+    expect(nav.TOOLS.map((item) => item.href)).toEqual([
+      "/on-trang",
+      "/nhac",
+      "/anh",
+      "/bong-be",
     ]);
   });

-  it("activeTab maps pages to the three tabs", () => {
-    expect(activeTab("/")).toBe("home");
-    expect(activeTab("/cai-dat")).toBe("home");
-    expect(activeTab("/cai-dat/thanh-vien")).toBe("home");
-    expect(activeTab("/nhat-ky")).toBe("history");
-    expect(activeTab("/kham-pha")).toBe("explore");
-    expect(activeTab("/cam-nang")).toBe("explore");
-    expect(activeTab("/tien-ich")).toBe("explore");
-    expect(activeTab(EXPLORE_EMERGENCY.href)).toBe("explore");
-    for (const item of ALL_EXPLORE)
-      expect(activeTab(item.href)).toBe("explore");
+  it("other pages light no tab, and a prefix alone is not a match", () => {
     expect(activeTab("/nhat-ky-cu")).toBeNull();
+    expect(activeTab("/suc-khoe-cu")).toBeNull();
     expect(activeTab("/dang-nhap")).toBeNull();
     expect(activeTab("/cai-app")).toBeNull();
   });
+
+  it("the Khám phá names are gone", () => {
+    expect(Object.keys(nav).filter((name) => /explore/i.test(name))).toEqual(
+      [],
+    );
+  });
 });

 describe("showsTabTimer (spec 2026-11-19 §4)", () => {
   it("is off on Hôm nay, which already has the hero card, and on elsewhere", () => {
     expect(showsTabTimer("/")).toBe(false);
     expect(showsTabTimer("/nhat-ky")).toBe(true);
-    expect(showsTabTimer("/kham-pha")).toBe(true);
+    expect(showsTabTimer("/suc-khoe")).toBe(true);
+    expect(showsTabTimer("/tien-ich")).toBe(true);
     expect(showsTabTimer("/cai-dat")).toBe(true);
     expect(showsTabTimer("/cai-dat/cu-bu")).toBe(true);
   });
@@ -194,9 +174,4 @@ describe("Sức khỏe and Tiện ích items", () => {
       ["Bồng bế", "/bong-be", "hands", "cat-tummy", "Tư thế bế, ợ hơi, cho bú"],
     ]);
   });
-
-  it("until the tab bar changes, the two new pages light the Khám phá tab", () => {
-    expect(activeTab("/suc-khoe")).toBe("explore");
-    expect(activeTab("/tien-ich")).toBe("explore");
-  });
 });
diff --git a/lib/ui/categories.test.ts b/lib/ui/categories.test.ts
index 23eb3b5..6f67547 100644
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -80,8 +80,8 @@ describe("category class maps", () => {
 });

 describe("icon paths", () => {
-  it("has the 48 icons the app uses, each a non-empty path", () => {
-    expect(Object.keys(ICON_PATHS)).toHaveLength(48);
+  it("has the 47 icons the app uses, each a non-empty path", () => {
+    expect(Object.keys(ICON_PATHS)).toHaveLength(47);
     for (const d of Object.values(ICON_PATHS)) expect(d).toMatch(/^[Mm]/);
   });

```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  4 failed | 160 passed (164)`, `Tests  12 failed | 1176 passed (1188)`. Lý do đỏ: `TABS` còn 3 tab, `activeTab` còn trả `"explore"`, ô timer còn `flex-[1.7]` và " · +n", còn icon `explore`.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/nav/TabBar.tsx b/components/nav/TabBar.tsx
index 6407595..2334626 100644
--- a/components/nav/TabBar.tsx
+++ b/components/nav/TabBar.tsx
@@ -35,7 +35,7 @@ function TimerTab({
   const category = categoryOf(log.type);
   const ms = now.getTime() - Date.parse(log.started_at);
   // The name a screen reader says; it also carries the count that the small
-  // line shows as "· +n".
+  // line shows as "+n".
   const name = `${tab.label}, ${timerLabel(log)} đã chạy ${formatClock(ms)}`;
   return (
     <Link
@@ -61,7 +61,7 @@ function TimerTab({
         </span>
         {/* text-ink: text-muted is too faint on the tint in Ban đêm. */}
         <span className="text-[10px] leading-3 font-semibold whitespace-nowrap text-ink">
-          {more > 0 ? `${tab.label} · +${more}` : tab.label}
+          {more > 0 ? `${tab.label} +${more}` : tab.label}
         </span>
       </span>
     </Link>
@@ -97,7 +97,7 @@ export function TabBarView({
           return (
             <li
               key={tab.key}
-              className={cx("flex", tile ? "flex-[1.7]" : "flex-1")}
+              className={cx("flex", tile ? "flex-[2.2]" : "flex-1")}
             >
               {tile ? (
                 <TimerTab tab={tab} timer={tile} current={active} />
diff --git a/lib/nav.ts b/lib/nav.ts
index bd0d50d..808fa1b 100644
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -1,13 +1,14 @@
 import type { CategoryToken } from "@/lib/ui/categories";
 import type { IconName } from "@/lib/ui/icons";

-export type TabKey = "home" | "history" | "explore";
+export type TabKey = "home" | "history" | "health" | "tools";
 export type Tab = { key: TabKey; href: string; label: string; icon: IconName };

 export const TABS: Tab[] = [
   { key: "home", href: "/", label: "Hôm nay", icon: "home" },
   { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "list" },
-  { key: "explore", href: "/kham-pha", label: "Khám phá", icon: "explore" },
+  { key: "health", href: "/suc-khoe", label: "Sức khỏe", icon: "pulse" },
+  { key: "tools", href: "/tien-ich", label: "Tiện ích", icon: "grid" },
 ];

 export type NavItem = {
@@ -17,8 +18,6 @@ export type NavItem = {
   color: CategoryToken;
   detail?: string;
 };
-// The old name, until the Khám phá page is gone.
-export type ExploreItem = NavItem;

 // Spec 2026-11-25 §3.4: the Sức khỏe page.
 export const HEALTH_EMERGENCY = {
@@ -116,36 +115,20 @@ export const TOOLS: NavItem[] = [
   },
 ];

-// The Khám phá page reads the same items under its own grouping.
-export const EXPLORE_EMERGENCY = HEALTH_EMERGENCY;
-export const EXPLORE_TRACK: NavItem[] = [
-  HEALTH_STATS,
-  HEALTH_GROWTH,
-  ...HEALTH_CARDS,
-];
-export const EXPLORE_GUIDES: NavItem[] = [
-  HEALTH_SICK[0],
-  HEALTH_SICK[1],
-  TOOLS[3],
-];
-export const EXPLORE_SOOTHE: NavItem[] = TOOLS.slice(0, 3);
-export const EXPLORE_REPORT: NavItem = HEALTH_SICK[2];
-
-// Pages that light up the Khám phá tab; /cam-nang and /tien-ich now redirect there.
-const EXPLORE_PREFIXES = [
-  "/kham-pha",
+// Spec 2026-11-25 §3.1: the pages that light up the Sức khỏe tab. /kham-pha
+// and /cam-nang redirect to it.
+const HEALTH_PREFIXES = [
   "/suc-khoe",
+  "/kham-pha",
   "/cam-nang",
-  "/tien-ich",
-  EXPLORE_EMERGENCY.href,
-  ...[
-    ...EXPLORE_TRACK,
-    ...EXPLORE_GUIDES,
-    ...EXPLORE_SOOTHE,
-    EXPLORE_REPORT,
-  ].map((item) => item.href),
+  HEALTH_EMERGENCY.href,
+  HEALTH_GROWTH.href,
+  HEALTH_STATS.href,
+  ...[...HEALTH_CARDS, ...HEALTH_SICK].map((item) => item.href),
 ];

+const TOOLS_PREFIXES = ["/tien-ich", ...TOOLS.map((item) => item.href)];
+
 function under(pathname: string, prefix: string): boolean {
   return pathname === prefix || pathname.startsWith(`${prefix}/`);
 }
@@ -153,8 +136,9 @@ function under(pathname: string, prefix: string): boolean {
 export function activeTab(pathname: string): TabKey | null {
   if (pathname === "/" || under(pathname, "/cai-dat")) return "home";
   if (under(pathname, "/nhat-ky")) return "history";
-  if (EXPLORE_PREFIXES.some((prefix) => under(pathname, prefix)))
-    return "explore";
+  if (HEALTH_PREFIXES.some((prefix) => under(pathname, prefix)))
+    return "health";
+  if (TOOLS_PREFIXES.some((prefix) => under(pathname, prefix))) return "tools";
   return null;
 }

diff --git a/lib/ui/icons.ts b/lib/ui/icons.ts
index f31a28b..2deadaa 100644
--- a/lib/ui/icons.ts
+++ b/lib/ui/icons.ts
@@ -19,7 +19,6 @@ export const ICON_PATHS = {
     "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
   home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
   list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
-  explore: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5-2 5-5 2 2-5z",
   chart: "M3 3v18h18M7 15l4-4 3 3 6-6",
   ruler:
     "M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0L21.3 10.1a1 1 0 0 0 0-1.4zM7.5 10.5l2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2",
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  164 passed (164)`, `Tests  1188 passed (1188)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/nav.ts lib/nav.test.ts lib/ui/icons.ts lib/ui/categories.test.ts components/nav/TabBar.tsx components/nav/tabbar.test.tsx components/actions/actionchrome.test.tsx
git commit -m "feat(nav): four tabs Hôm nay, Nhật ký, Sức khỏe, Tiện ích; the timer tile takes 2.2 shares" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Nút quay lại của 12 màn (§3.2)

**Files:**

- Modify: `components/emergency/EmergencyScreen.tsx`, `components/stats/StatsScreen.tsx`, `components/growth/GrowthScreen.tsx`, `components/vaccines/VaccineScreen.tsx`, `components/milestones/MilestonesScreen.tsx`, `components/triage/TriageScreen.tsx`, `components/conditions/ConditionsScreen.tsx`, `components/report/ReportScreen.tsx`, `components/noise/NoiseScreen.tsx`, `components/music/MusicScreen.tsx`, `components/photos/PhotosScreen.tsx`, `components/holding/HoldingScreen.tsx`
- Test: `components/nav/backlinks.test.tsx` (mới), `components/ui/pageheader.test.tsx`, và test của 7 màn: `triage`, `conditions`, `report`, `noise`, `music`, `photos`, `holding`

**Interfaces:**

- Consumes: `PageHeader` với prop `back?: { href: string; label: string }` (không đổi).
- Produces: 8 màn có `back={{ href: "/suc-khoe", label: "Sức khỏe" }}`, 4 màn có `back={{ href: "/tien-ich", label: "Tiện ích" }}`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/conditions/conditions.test.tsx b/components/conditions/conditions.test.tsx
index facd5c7..e346e6e 100644
--- a/components/conditions/conditions.test.tsx
+++ b/components/conditions/conditions.test.tsx
@@ -5,9 +5,9 @@ import { ICON_PATHS } from "@/lib/ui/icons";
 import { ConditionsScreen } from "./ConditionsScreen";

 describe("ConditionsScreen", () => {
-  it("a header back to Khám phá, triage and 115 buttons, and one glass article per condition", () => {
+  it("a header back to Sức khỏe, triage and 115 buttons, and one glass article per condition", () => {
     const html = renderToStaticMarkup(<ConditionsScreen />);
-    expect(html).toContain('href="/kham-pha"');
+    expect(html).toContain('href="/suc-khoe"');
     expect(html).toContain(`>${CONDITIONS.title}</h1>`);
     expect(html).toContain('href="/trieu-chung"');
     expect(html).toContain('href="tel:115"');
diff --git a/components/holding/holding.test.tsx b/components/holding/holding.test.tsx
index 73a5183..c5478b8 100644
--- a/components/holding/holding.test.tsx
+++ b/components/holding/holding.test.tsx
@@ -8,7 +8,7 @@ describe("HoldingScreen", () => {
   it("a stage picker, one glass card per position, Xem video with a play icon", () => {
     const html = renderToStaticMarkup(<HoldingScreen ageDays={30} />);
     const stage = HOLDING.stages.find((s) => s.code === "0_3")!;
-    expect(html).toContain('href="/kham-pha"');
+    expect(html).toContain('href="/tien-ich"');
     expect(html).toContain('aria-label="Giai đoạn"');
     const name = stage.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
     expect(html).toMatch(
diff --git a/components/music/music.test.tsx b/components/music/music.test.tsx
index 324d755..59c84e7 100644
--- a/components/music/music.test.tsx
+++ b/components/music/music.test.tsx
@@ -7,13 +7,13 @@ import { MusicScreen } from "./MusicScreen";
 import { YouTubeModePicker } from "./YouTubeModePicker";

 describe("MusicScreen", () => {
-  it("a header back to Khám phá, two segmented pickers, a glass list with play icons and the add form", () => {
+  it("a header back to Tiện ích, two segmented pickers, a glass list with play icons and the add form", () => {
     const html = renderToStaticMarkup(
       <QueryClientProvider client={new QueryClient()}>
         <MusicScreen familyId="f1" userId="u1" isOwner />
       </QueryClientProvider>,
     );
-    expect(html).toContain('href="/kham-pha"');
+    expect(html).toContain('href="/tien-ich"');
     expect(html).toContain(">Nhạc cho bé</h1>");
     expect(html).toContain('aria-label="Loại nhạc"');
     expect(html).toMatch(
diff --git a/components/nav/backlinks.test.tsx b/components/nav/backlinks.test.tsx
new file mode 100644
index 0000000..59b03c6
--- /dev/null
+++ b/components/nav/backlinks.test.tsx
@@ -0,0 +1,52 @@
+import { readdirSync, readFileSync, statSync } from "node:fs";
+import { join } from "node:path";
+import { describe, expect, it } from "vitest";
+
+const read = (path: string) => readFileSync(path, "utf8");
+
+const HEALTH = [
+  "components/emergency/EmergencyScreen.tsx",
+  "components/stats/StatsScreen.tsx",
+  "components/growth/GrowthScreen.tsx",
+  "components/vaccines/VaccineScreen.tsx",
+  "components/milestones/MilestonesScreen.tsx",
+  "components/triage/TriageScreen.tsx",
+  "components/conditions/ConditionsScreen.tsx",
+  "components/report/ReportScreen.tsx",
+];
+const TOOLS = [
+  "components/noise/NoiseScreen.tsx",
+  "components/music/MusicScreen.tsx",
+  "components/photos/PhotosScreen.tsx",
+  "components/holding/HoldingScreen.tsx",
+];
+
+function sources(dir: string): string[] {
+  return readdirSync(dir).flatMap((name) => {
+    const path = join(dir, name);
+    if (statSync(path).isDirectory()) return sources(path);
+    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
+  });
+}
+
+// Spec 2026-11-25 §3.2.
+describe("back links after the Khám phá tab was split", () => {
+  it.each(HEALTH)("%s goes back to Sức khỏe", (path) => {
+    expect(read(path)).toContain(
+      'back={{ href: "/suc-khoe", label: "Sức khỏe" }}',
+    );
+  });
+
+  it.each(TOOLS)("%s goes back to Tiện ích", (path) => {
+    expect(read(path)).toContain(
+      'back={{ href: "/tien-ich", label: "Tiện ích" }}',
+    );
+  });
+
+  it("no component links to Khám phá or names it any more", () => {
+    const stale = sources("components").filter((path) =>
+      /kham-pha|Khám phá/.test(read(path)),
+    );
+    expect(stale).toEqual([]);
+  });
+});
diff --git a/components/noise/noise.test.tsx b/components/noise/noise.test.tsx
index fafe01c..3f5700b 100644
--- a/components/noise/noise.test.tsx
+++ b/components/noise/noise.test.tsx
@@ -6,7 +6,7 @@ import { NoiseScreen } from "./NoiseScreen";
 describe("NoiseScreen", () => {
   it("segmented sound and timer pickers, a glass volume card and a 64 px play button", () => {
     const html = renderToStaticMarkup(<NoiseScreen />);
-    expect(html).toContain('href="/kham-pha"');
+    expect(html).toContain('href="/tien-ich"');
     expect(html).toContain('aria-label="Loại âm"');
     expect(html).toMatch(/aria-pressed="true"[^>]*>Trắng<\/button>/);
     expect(html).toContain('aria-label="Hẹn giờ tắt"');
diff --git a/components/photos/photos.test.tsx b/components/photos/photos.test.tsx
index df21b0c..29b9c09 100644
--- a/components/photos/photos.test.tsx
+++ b/components/photos/photos.test.tsx
@@ -21,7 +21,7 @@ const wrap = (node: ReactNode) =>
 describe("PhotosScreen", () => {
   it("a header, a usage bar on the line colour, a glass upload card and skeletons while loading", () => {
     const html = wrap(<PhotosScreen baby={baby} userId="u1" isOwner />);
-    expect(html).toContain('href="/kham-pha"');
+    expect(html).toContain('href="/tien-ich"');
     expect(html).toContain(">Ảnh của bé</h1>");
     expect(html).toContain("bg-line");
     expect(html).not.toContain("bg-soft");
diff --git a/components/report/report.test.tsx b/components/report/report.test.tsx
index 8af7e31..28f29aa 100644
--- a/components/report/report.test.tsx
+++ b/components/report/report.test.tsx
@@ -22,12 +22,14 @@ describe("ReportScreen", () => {
       </QueryClientProvider>,
     );
     expect(html).toContain("print:hidden");
-    expect(html).toContain('href="/kham-pha"');
+    expect(html).toContain('href="/suc-khoe"');
     expect(html).toContain(">Báo cáo cho bác sĩ</h1>");
     expect(html).toContain('aria-label="Khoảng thời gian"');
     expect(html).toMatch(/aria-pressed="true"[^>]*>7 ngày<\/button>/);
     expect(html).toContain(`d="${ICON_PATHS.doc}"`);
-    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>(?:(?!<button)[\s\S])*In \/ Lưu PDF<\/button>/);
+    expect(html).toMatch(
+      /<button[^>]*disabled=""[^>]*>(?:(?!<button)[\s\S])*In \/ Lưu PDF<\/button>/,
+    );
     expect(html).toContain("kb-pulse");
     expect(html).not.toContain("bg-soft");
     expect(html).not.toContain("Đang tải dữ liệu…");
diff --git a/components/triage/triage.test.tsx b/components/triage/triage.test.tsx
index f2dfe44..6cdd049 100644
--- a/components/triage/triage.test.tsx
+++ b/components/triage/triage.test.tsx
@@ -88,7 +88,7 @@ describe("TriageScreen", () => {
       TRIAGE.questions,
       ageDays(baby.dob, new Date()),
     );
-    expect(html).toContain('href="/kham-pha"');
+    expect(html).toContain('href="/suc-khoe"');
     expect(html.match(/role="switch"/g)).toHaveLength(visible.length);
     expect(html).not.toContain('type="checkbox"');
     expect(html).toContain('inputMode="decimal"');
diff --git a/components/ui/pageheader.test.tsx b/components/ui/pageheader.test.tsx
index cb42aef..bec0138 100644
--- a/components/ui/pageheader.test.tsx
+++ b/components/ui/pageheader.test.tsx
@@ -6,10 +6,10 @@ import { COMPACT_AFTER_PX, PageHeader, PageHeaderView } from "./PageHeader";
 describe("PageHeaderView", () => {
   it("shows a 34 pt large title and hides the compact bar at the top", () => {
     const html = renderToStaticMarkup(
-      <PageHeaderView title="Khám phá" compact={false} />,
+      <PageHeaderView title="Sức khỏe" compact={false} />,
     );
     expect(html).toContain(
-      '<h1 class="text-[34px] leading-[41px] font-bold text-ink">Khám phá</h1>',
+      '<h1 class="text-[34px] leading-[41px] font-bold text-ink">Sức khỏe</h1>',
     );
     expect(html).toContain("pointer-events-none opacity-0");
     expect(html).toContain('aria-hidden="true"');
@@ -18,12 +18,12 @@ describe("PageHeaderView", () => {

   it("shows the compact glass bar once scrolled", () => {
     const html = renderToStaticMarkup(
-      <PageHeaderView title="Khám phá" compact />,
+      <PageHeaderView title="Sức khỏe" compact />,
     );
     expect(html).toContain("glass-strong");
     expect(html).toContain("opacity-100");
     expect(html).toContain("h-[calc(env(safe-area-inset-top)+44px)]");
-    expect(html).toContain(">Khám phá</span>");
+    expect(html).toContain(">Sức khỏe</span>");
     expect(html).toContain("duration-[160ms]");
   });

@@ -44,7 +44,7 @@ describe("PageHeaderView", () => {
   });
   it("keeps the compact bar below the old z-20 sheets", () => {
     const html = renderToStaticMarkup(
-      <PageHeaderView title="Khám phá" compact />,
+      <PageHeaderView title="Sức khỏe" compact />,
     );
     expect(html).toContain(" z-10 ");
     expect(html).not.toContain("z-30");
@@ -54,7 +54,7 @@ describe("PageHeaderView", () => {
 describe("PageHeader", () => {
   it("starts expanded and compacts after 40 px", () => {
     expect(COMPACT_AFTER_PX).toBe(40);
-    expect(renderToStaticMarkup(<PageHeader title="Khám phá" />)).toContain(
+    expect(renderToStaticMarkup(<PageHeader title="Sức khỏe" />)).toContain(
       "opacity-0",
     );
   });
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  8 failed | 157 passed (165)`, `Tests  20 failed | 1181 passed (1201)`. Lý do đỏ: 12 màn còn quay lại `/kham-pha`.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/components/conditions/ConditionsScreen.tsx b/components/conditions/ConditionsScreen.tsx
index 22d5d34..ead343c 100644
--- a/components/conditions/ConditionsScreen.tsx
+++ b/components/conditions/ConditionsScreen.tsx
@@ -15,7 +15,7 @@ export function ConditionsScreen() {
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title={CONDITIONS.title}
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
       />
       <p className="px-1 text-base text-ink">{CONDITIONS.intro}</p>
       <div className="flex flex-col gap-2.5">
@@ -31,7 +31,11 @@ export function ConditionsScreen() {
         </Link>
         <a
           href="tel:115"
-          className={buttonClass({ variant: "danger", size: "md", block: true })}
+          className={buttonClass({
+            variant: "danger",
+            size: "md",
+            block: true,
+          })}
         >
           <Icon name="phone" size={18} />
           Gọi 115
diff --git a/components/emergency/EmergencyScreen.tsx b/components/emergency/EmergencyScreen.tsx
index d087979..7503b42 100644
--- a/components/emergency/EmergencyScreen.tsx
+++ b/components/emergency/EmergencyScreen.tsx
@@ -29,7 +29,7 @@ export function EmergencyScreen({
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title="Khẩn cấp"
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
       />
       <CallList contacts={rows} />
       {contacts.isError && !contacts.data && (
diff --git a/components/growth/GrowthScreen.tsx b/components/growth/GrowthScreen.tsx
index 2bb6611..af20392 100644
--- a/components/growth/GrowthScreen.tsx
+++ b/components/growth/GrowthScreen.tsx
@@ -72,7 +72,7 @@ export function GrowthScreen({
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title="Tăng trưởng"
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
         action={
           <IconButton
             label="Thêm lần đo"
diff --git a/components/holding/HoldingScreen.tsx b/components/holding/HoldingScreen.tsx
index 4db8310..423a5f7 100644
--- a/components/holding/HoldingScreen.tsx
+++ b/components/holding/HoldingScreen.tsx
@@ -23,7 +23,7 @@ export function HoldingScreen({ ageDays }: { ageDays: number }) {
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title={HOLDING.title}
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/tien-ich", label: "Tiện ích" }}
       />
       <p className="px-1 text-base text-ink">{HOLDING.intro}</p>
       <Segmented
diff --git a/components/milestones/MilestonesScreen.tsx b/components/milestones/MilestonesScreen.tsx
index c1de2a4..2886813 100644
--- a/components/milestones/MilestonesScreen.tsx
+++ b/components/milestones/MilestonesScreen.tsx
@@ -72,7 +72,7 @@ export function MilestonesScreen({
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title={MILESTONES.title}
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
       />
       <p className="px-1 text-[15px] text-muted">{MILESTONES.intro}</p>
       {marks.isError && !marks.data && (
diff --git a/components/music/MusicScreen.tsx b/components/music/MusicScreen.tsx
index cc478f6..7cfaba0 100644
--- a/components/music/MusicScreen.tsx
+++ b/components/music/MusicScreen.tsx
@@ -77,7 +77,7 @@ export function MusicScreen({
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title="Nhạc cho bé"
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/tien-ich", label: "Tiện ích" }}
       />
       <Segmented
         label="Loại nhạc"
diff --git a/components/noise/NoiseScreen.tsx b/components/noise/NoiseScreen.tsx
index 39fe16f..615e0f0 100644
--- a/components/noise/NoiseScreen.tsx
+++ b/components/noise/NoiseScreen.tsx
@@ -131,7 +131,7 @@ export function NoiseScreen() {
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title="Tiếng ồn trắng"
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/tien-ich", label: "Tiện ích" }}
       />
       <Glass as="section" className="flex flex-col gap-4 p-4">
         <div className="flex flex-col gap-2">
diff --git a/components/photos/PhotosScreen.tsx b/components/photos/PhotosScreen.tsx
index 2f4d7bb..676e322 100644
--- a/components/photos/PhotosScreen.tsx
+++ b/components/photos/PhotosScreen.tsx
@@ -61,7 +61,7 @@ export function PhotosScreen({
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title="Ảnh của bé"
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/tien-ich", label: "Tiện ích" }}
       />
       <section className="flex flex-col gap-1.5 px-1">
         <div className="h-2 overflow-hidden rounded-full bg-line">
diff --git a/components/report/ReportScreen.tsx b/components/report/ReportScreen.tsx
index c5f127d..76256e7 100644
--- a/components/report/ReportScreen.tsx
+++ b/components/report/ReportScreen.tsx
@@ -90,7 +90,7 @@ export function ReportScreen({ baby }: { baby: Baby }) {
       <div className="flex flex-col gap-[18px] print:hidden">
         <PageHeader
           title="Báo cáo cho bác sĩ"
-          back={{ href: "/kham-pha", label: "Khám phá" }}
+          back={{ href: "/suc-khoe", label: "Sức khỏe" }}
         />
         <Segmented
           label="Khoảng thời gian"
diff --git a/components/stats/StatsScreen.tsx b/components/stats/StatsScreen.tsx
index 056ef63..cadf887 100644
--- a/components/stats/StatsScreen.tsx
+++ b/components/stats/StatsScreen.tsx
@@ -119,7 +119,7 @@ export function StatsScreen({ baby }: { baby: Baby }) {
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title="Thống kê"
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
         action={
           <Segmented
             label="Khoảng thời gian"
diff --git a/components/triage/TriageScreen.tsx b/components/triage/TriageScreen.tsx
index afb3c7d..9094bb8 100644
--- a/components/triage/TriageScreen.tsx
+++ b/components/triage/TriageScreen.tsx
@@ -142,7 +142,7 @@ export function TriageScreen({ baby }: { baby: Baby }) {
     <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
       <PageHeader
         title={TRIAGE.title}
-        back={{ href: "/kham-pha", label: "Khám phá" }}
+        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
       />
       <p className="px-1 text-[13px] text-muted">{TRIAGE.disclaimer}</p>
       {!outcome && <Call115Button label="Gọi cấp cứu 115" />}
diff --git a/components/vaccines/VaccineScreen.tsx b/components/vaccines/VaccineScreen.tsx
index d934178..0386456 100644
--- a/components/vaccines/VaccineScreen.tsx
+++ b/components/vaccines/VaccineScreen.tsx
@@ -54,7 +54,7 @@ export function VaccineScreen({
   const header = (
     <PageHeader
       title="Tiêm chủng"
-      back={{ href: "/kham-pha", label: "Khám phá" }}
+      back={{ href: "/suc-khoe", label: "Sức khỏe" }}
     />
   );

```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  165 passed (165)`, `Tests  1201 passed (1201)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components
git commit -m "feat(nav): sub-pages go back to Sức khỏe or Tiện ích" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M1c và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-tab/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả dưới Step 4)

**Interfaces:**

- Consumes: `TabBarView({ current, onPlus, timer })` và `TabTimer = { log: LogRow; more: number }` (`components/nav/TabBar.tsx`).
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  165 passed (165)`, `Tests  1201 passed (1201)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm cho ô timer**

Không được bắt đầu timer trên dữ liệu thật, nên ô timer xem trên trang tạm này. Tạo `app/fixture-tab/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { TabBarView, type TabTimer } from "@/components/nav/TabBar";
import type { LogRow } from "@/lib/supabase/rows";

const running = (type: string, minutesAgo: number) =>
  ({
    id: type,
    baby_id: "fixture",
    type,
    started_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    ended_at: null,
    details: type === "breast" ? { side: "left" } : {},
    note: null,
    created_by: "fixture",
    created_at: "",
    updated_at: "",
  }) as LogRow;

// ?c=0: đồng hồ phút:giây · ?c=1: đồng hồ giờ, phút · ?c=2: còn 1 timer khác.
const CASES: TabTimer[] = [
  { log: running("breast", 52), more: 0 },
  { log: running("sleep", 65), more: 0 },
  { log: running("sleep", 65), more: 1 },
];

export default function Page() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(Number(new URLSearchParams(window.location.search).get("c") ?? 0));
  }, []);
  return (
    <main className="p-4 text-ink">
      <p>Fixture thanh tab, trường hợp {index}</p>
      <TabBarView
        current="health"
        onPlus={() => {}}
        timer={CASES[index] ?? CASES[0]}
      />
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 8). Chạy `bun run dev`. Cỡ 375×812.

Ô timer, trên `http://localhost:3000/fixture-tab?c=0`, rồi `?c=1`, rồi `?c=2`:

1. Chạy bằng javascript tool: `[...document.querySelectorAll('nav[aria-label="Điều hướng chính"] li')].map((li) => { const a = li.firstElementChild; return [a.textContent, Math.round(li.getBoundingClientRect().width), a.scrollWidth <= a.clientWidth]; })`. Kỳ vọng ở cả ba trường hợp: 4 phần tử; phần tử thứ ba của mỗi mục là `true` (không tràn chữ); bề rộng của ba tab thường ≥ 44. Ghi lại bề rộng đo được.
2. Nhìn bằng mắt: đồng hồ và dòng nhỏ (`Hôm nay`, `Hôm nay +1`) không bị cắt; nhãn "Nhật ký", "Sức khỏe", "Tiện ích" không xuống dòng.
3. Nếu mục 1 hoặc 2 không đạt: **dừng, không sửa gì, báo người dùng** kèm số đo (Diễn giải spec, mục 6).

Trang thật:

4. `http://localhost:3000/`: thanh có 4 tab, "Hôm nay" sáng. Chạm "Sức khỏe" mở `/suc-khoe` và tab đó sáng; chạm "Tiện ích" mở `/tien-ich` và tab đó sáng.
5. `http://localhost:3000/kham-pha` và `/cam-nang`: tự chuyển sang `/suc-khoe`.
6. Mở lần lượt `/tang-truong`, `/tiem-chung`, `/trieu-chung`, `/bao-cao`: nút quay lại ghi "Sức khỏe", chạm về `/suc-khoe`, tab Sức khỏe sáng trong lúc ở trang con.
7. Mở lần lượt `/on-trang`, `/nhac`, `/anh`, `/bong-be`: nút quay lại ghi "Tiện ích", chạm về `/tien-ich`, tab Tiện ích sáng trong lúc ở trang con.
8. `/cai-dat`: tab "Hôm nay" sáng như trước.
9. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở `/` và `/suc-khoe`.
10. Lặp mục 1, 2 và 4 ở `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: chữ đọc rõ, tab đang chọn phân biệt được.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả (2026-11-25).** Step 1: `tsc --noEmit` sạch; `Test Files  165 passed (165)`, `Tests  1201 passed (1201)`. Step 2: `bun run build` lần đầu dừng với cảnh báo bảo mật của Next.js 16.4.3 (mã 1), lần hai `✓ Generating static pages (39/39)` và thoát mã 0; không chạy `next upgrade`. Step 4: người dùng chọn khung Browser trong app; cỡ 375×812 (`window.innerWidth` = 375); dev nối Supabase thật, chỉ xem, chỉ chạm tab và nút quay lại. Theme đang lưu trên máy là `dark`, nên các mục 1–9 dưới đây là ở `dark`.

1. **Đạt, trên trang tạm.** Bề rộng `li` ở cả `?c=0`, `?c=1`, `?c=2`: ô timer 110 px, Nhật ký 50 px, Sức khỏe 50 px, Tiện ích 50 px; phần tử thứ ba của cả 4 mục là `true`. Chữ đo được: `52:02` + `Hôm nay`, `1g 05p` + `Hôm nay`, `1g 05p` + `Hôm nay +1`. Đo thêm ở `?c=2`: ô timer chiếm x từ 21 tới 131, đệm phải 4 px, cột chữ kết thúc ở x = 126,4, tức còn dư 0,6 px trước mép trong của ô.
2. **Đạt, trên trang tạm.** Đồng hồ và dòng nhỏ `Hôm nay`, `Hôm nay +1` hiện đủ, không bị cắt; "Nhật ký", "Sức khỏe", "Tiện ích" nằm trên một dòng.
3. Không phải dừng: mục 1 và 2 đều đạt.
4. **Đạt, trên trang thật.** `/` có 4 tab, mỗi tab 65 px, "Hôm nay" có `aria-current="page"`. Chạm "Sức khỏe" mở `/suc-khoe`, tab Sức khỏe sáng; chạm "Tiện ích" mở `/tien-ich`, tab Tiện ích sáng.
5. **Đạt, trên trang thật.** `/kham-pha` và `/cam-nang` đều tự chuyển sang `/suc-khoe`, tab Sức khỏe sáng.
6. **Đạt, trên trang thật**, trừ một ý của `/trieu-chung`. `/tang-truong`, `/tiem-chung`, `/bao-cao`: nút quay lại ghi "Sức khỏe", chạm về `/suc-khoe`, tab Sức khỏe sáng lúc ở trang con. `/trieu-chung`: nút quay lại ghi "Sức khỏe" và chạm về `/suc-khoe`; còn "tab Sức khỏe sáng lúc ở trang con" thì **chưa kiểm**, vì màn này ẩn cả thanh tab khi chưa có kết quả (`useHideChrome(outcome === null)` trong `TriageScreen`, có từ trước M1c), muốn thấy thanh tab phải bật công tắc trả lời. Phần này chỉ có test `activeTab("/trieu-chung")` trong `lib/nav.test.ts` che.
7. **Đạt, trên trang thật.** `/on-trang`, `/nhac`, `/anh`, `/bong-be`: nút quay lại ghi "Tiện ích", chạm về `/tien-ich`, tab Tiện ích sáng lúc ở trang con.
8. **Đạt, trên trang thật.** `/cai-dat`: tab "Hôm nay" sáng.
9. **Đạt, trên trang thật.** `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở `/`, `/suc-khoe` và `/tien-ich`.
10. **Đạt** ở `rose`, `light`, `night` (và `dark` ở các mục trên). Mục 1 và 2 trên trang tạm: cả ba trường hợp, cùng số đo 110 / 50 / 50 / 50 và đều `true`; chữ đọc rõ, tab Sức khỏe đang chọn phân biệt được. Mục 4 trên trang thật: mở thẳng `/`, `/suc-khoe`, `/tien-ich` rồi đổi `dataset.theme`, tab đang chọn phân biệt được và nhãn đọc rõ ở cả ba theme; việc chạm tab để chuyển trang chỉ làm ở `dark`. Ở `night` vòng icon của ô timer có cùng màu hổ phách cho cả Bú và Ngủ. `peach`, `lavender`, `sea` không nằm trong mục 10: **chưa kiểm**.

Ghi chú của lần kiểm:

- Trang tạm báo lỗi hydration trong console (đồng hồ `52:00` phía server, `52:02` phía client) vì `CASES` gọi `Date.now()` lúc nạp module; chỉ có ở trang tạm. Số đo lấy sau khi React vẽ lại phía client.
- Console của trang tạm còn dòng "Encountered a script tag while rendering React component"; `app/layout.tsx` dòng 32 có thẻ `<script>` khởi tạo theme và M1c không sửa file này. Chưa xem dòng này có hiện ở trang thật không.
- Huy hiệu công cụ dev của Next che góc trái thanh tab; đã ẩn nó bằng `display: none` trong trang trước khi chụp.
- Khung Browser cần `.claude/launch.json` để chạy `bun run dev`; file này được tạo tạm và đã xóa cùng trang tạm.
- Sau khi xóa trang tạm, `bun run typecheck` báo `.next/dev/types/validator.ts: Cannot find module '../../../app/fixture-tab/page.js'`: `next dev` đã sinh file kiểu cho trang tạm và `tsconfig.json` có đọc `.next/dev/types`. Đã xóa thư mục sinh tự động `.next/dev/types` (nằm trong `.gitignore`), chạy lại thì `tsc --noEmit` sạch và vitest vẫn 165 file, 1201 test.
- **Chưa kiểm:** iPhone thật và PWA đã cài; danh sách `PAGES` của service worker trong trình duyệt (chỉ có `scripts/sw.test.ts`); ô timer với timer thật đang chạy.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-tab
git status --short   # chỉ còn file plan này thay đổi
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m1c.md
git commit -m "docs(plan): record the M1c check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của Step 4 đã thấy tận mắt, mục nào chỉ thấy trên fixture, mục nào chưa. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m1c
git push origin main
```
