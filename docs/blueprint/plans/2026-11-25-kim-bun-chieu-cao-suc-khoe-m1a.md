# Kim Bun — Sức khỏe M1a: danh mục, luật "Cần chú ý" và khối giao diện dùng chung Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§3.6; danh mục của §3.4 và §3.5; luật của §4 dòng 2 và 3; phần tương ứng của §9.1)

**Status:** approved 2026-11-25 (người dùng: "Duyệt ba plan"; chưa có lệnh chạy, mỗi lần lên `main` vẫn phải hỏi)

**Goal:** Có sẵn danh mục của hai trang mới, 5 icon, luật "Cần chú ý" cho mũi tiêm, thẻ `NavCard`, màu dòng phụ của `ListRow` và hàm `latestGrowth`; trên màn hình app chưa đổi gì.

**Architecture:**

- **Chỉ thêm phần nền.** Không màn nào đổi. Trang Khám phá vẫn chạy và không đổi một ký tự markup.
- **Luật thuần:** `lib/rules/attention.ts` (các dòng "Cần chú ý") và `latestGrowth` trong `lib/rules/growthForm.ts`.
- **Giao diện dùng chung:** `components/ui/NavCard.tsx`; `ListRow` nhận thêm `detailTone`.
- **Danh mục:** `lib/nav.ts` thêm `HEALTH_*` và `TOOLS`; các tên `EXPLORE_*` tạm dẫn xuất từ đó.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m1a`, cắt từ `main` @ `573bdc4`. Baseline: 1153 test vitest xanh (158 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                 | Plan                                           |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| **M1a (plan này)** | §3.6; danh mục của §3.4 và §3.5; luật của §4 dòng 2 và 3 | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1a.md` |
| M1b                | §3.4 trang Sức khỏe, §3.5 trang Tiện ích, §4 dòng 2 và 3 | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1b.md` |
| M1c                | §3.1, §3.2, §3.3: 4 tab, chuyển hướng, nút quay lại      | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1c.md` |
| M2                 | §5 Tăng trưởng, chip trên thẻ, dòng 1 của §4             | chưa viết                                      |
| M3                 | §6 Chiều cao                                             | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4           | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                             | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M1 chia ba plan.** Spec §10 ghi M1 là một mốc. Bản dựng thử cho thấy M1 dài quá một plan, nên cắt ở ba chỗ app vẫn chạy trọn vẹn: M1a thêm phần nền (màn hình chưa đổi), M1b thêm hai trang mới (thanh tab chưa đổi), M1c đổi thanh tab và bỏ Khám phá.
2. **Hàng "Cần chú ý" sẽ dùng `ListRow` hiện có**, tức ô icon vuông bo góc 30 px nền đặc như mọi danh sách khác của app, không phải vòng tròn 36 px như §4 ghi. Con số 36 px đến từ bản vẽ; làm một kiểu hàng riêng cho đúng 36 px sẽ khiến trang Sức khỏe có hai kiểu hàng danh sách. Plan này chỉ thêm `detailTone` vào `ListRow` để dòng phụ đổi màu. **Đây là chỗ plan lệch spec có chủ ý; người dùng cần biết khi duyệt.**
3. **`latestGrowth`:** `measuredOn` là `measured_on` lớn nhất trong mọi lần đo. Số của từng chỉ số là giá trị khác null mới nhất của chỉ số đó; hai lần đo cùng ngày thì hàng đứng trước thắng (query trả hàng tạo sau trước), giống `latestWeightG`.
4. **Dòng 3 của §4, "trong 14 ngày tới"**, tính cả ngày thứ 14 và cả hôm nay. Chỉ xét số ngày, không xét `state` của mũi (`upcoming` hay `later`).
5. **Dòng mô tả của `NavCard` luôn có `line-clamp-2`**, kể cả khi là mô tả tĩnh (§2 cho phép tối đa 2 dòng).
6. **`activeTab("/suc-khoe")` tạm trả `"explore"`** cho tới M1c, để trang mới của M1b có tab sáng.
7. **Không có bước kiểm trình duyệt**, vì plan này không đổi gì trên màn hình.

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
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m1a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `573bdc4` và nối tiếp các plan trước của mốc M1; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 4 dừng lại hỏi, không tự push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.

## Contracts with Other Plans

Plan này là plan đầu của spec. M1b và M1c dùng mọi thứ dưới đây.

**Consumes:** không có gì từ plan khác. Từ code đang có: `ScheduleItem` (`lib/rules/vaccines.ts`); `formatDayShort`, `vnDayStartMs` (`lib/rules/days.ts`); `CATEGORY_CHIP` (`lib/ui/categories.ts`); `GrowthInput` (`lib/rules/growthForm.ts`).

**Produces:**

- `lib/ui/icons.ts`: 5 icon mới `pulse`, `grid`, `flag`, `alert`, `pencil` (tổng 48 icon).
- `lib/nav.ts`: `type NavItem`; `HEALTH_EMERGENCY`, `HEALTH_GROWTH: NavItem`, `HEALTH_CARDS: NavItem[]` (Tiêm chủng, Phát triển), `HEALTH_STATS: NavItem`, `HEALTH_SICK: NavItem[]` (Triệu chứng, Bệnh thường gặp, Báo cáo cho bác sĩ), `TOOLS: NavItem[]` (Ồn trắng, Nhạc, Ảnh, Bồng bế). `EXPLORE_*` và `type ExploreItem` vẫn còn, dẫn xuất từ các tên trên. `activeTab("/suc-khoe")` trả `"explore"`.
- `lib/rules/attention.ts`: `type AttentionItem = { key; icon; color; title; detail; tone: "normal" | "warn" | "danger"; href }`, `ATTENTION_MAX = 4`, `vaccineAttention(next: ScheduleItem | null, today: string): AttentionItem | null`, `attentionItems(input: { vaccine: ScheduleItem | null; today: string }): AttentionItem[]`. Các mốc sau thêm trường vào `input`.
- `lib/rules/growthForm.ts`: `type LatestGrowth = { measuredOn: string; weightG: number | null; lengthCm: number | null; headCm: number | null }`, `latestGrowth(rows: GrowthInput[]): LatestGrowth | null`.
- `components/ui/NavCard.tsx`: `NavCard({ item: NavItem; live?: LiveLine; short?: boolean })`, `type LiveLine = { text: string | null; warn: boolean }`.
- `components/ui/ListGroup.tsx`: `ListRow` nhận thêm `detailTone?: "muted" | "warn" | "danger"`.
- **Vitest sau M1a:** 1181 test, 162 file.

---

### Task 1: Danh mục của hai trang và 5 icon mới (§3.4, §3.5, §3.6)

**Files:**

- Modify: `lib/ui/icons.ts`, `lib/nav.ts`
- Test: `lib/nav.test.ts`, `lib/ui/categories.test.ts`, `lib/ui/icons.test.ts` (mới)

**Interfaces:**

- Consumes: `IconName` (`lib/ui/icons.ts`), `CategoryToken` (`lib/ui/categories.ts`).
- Produces: `NavItem`, `HEALTH_EMERGENCY`, `HEALTH_GROWTH`, `HEALTH_CARDS`, `HEALTH_STATS`, `HEALTH_SICK`, `TOOLS` trong `lib/nav.ts`; icon `pulse`, `grid`, `flag`, `alert`, `pencil`. `EXPLORE_TRACK`, `EXPLORE_GUIDES`, `EXPLORE_SOOTHE`, `EXPLORE_REPORT`, `EXPLORE_EMERGENCY` giữ nguyên giá trị các trường `label`, `href`, `icon`, `color`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m1a
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/nav.test.ts b/lib/nav.test.ts
index 0d7e901..bdfd69d 100644
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -108,3 +108,95 @@ describe("showsTabTimer (spec 2026-11-19 §4)", () => {
     expect(Object.keys(nav)).not.toContain("showsTimerPill");
   });
 });
+
+// Spec 2026-11-25 §3.4 and §3.5.
+describe("Sức khỏe and Tiện ích items", () => {
+  const brief = (i: nav.NavItem) => [
+    i.label,
+    i.href,
+    i.icon,
+    i.color,
+    i.detail,
+  ];
+
+  it("Sức khỏe: the growth card, two cards, the stats row and three sick-day rows", () => {
+    expect(nav.HEALTH_EMERGENCY).toEqual({
+      label: "Khẩn cấp",
+      href: "/khan-cap",
+      detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
+    });
+    expect(brief(nav.HEALTH_GROWTH)).toEqual([
+      "Tăng trưởng",
+      "/tang-truong",
+      "ruler",
+      "cat-tummy",
+      "Cân nặng, chiều dài theo chuẩn WHO",
+    ]);
+    expect(nav.HEALTH_CARDS.map(brief)).toEqual([
+      [
+        "Tiêm chủng",
+        "/tiem-chung",
+        "syringe",
+        "cat-temp",
+        "Mũi tiếp theo và lịch đã tiêm",
+      ],
+      [
+        "Phát triển",
+        "/phat-trien",
+        "star",
+        "cat-diaper",
+        "Các mốc theo tháng tuổi",
+      ],
+    ]);
+    expect(brief(nav.HEALTH_STATS)).toEqual([
+      "Thống kê",
+      "/thong-ke",
+      "chart",
+      "cat-sleep",
+      "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
+    ]);
+    expect(nav.HEALTH_SICK.map(brief)).toEqual([
+      [
+        "Triệu chứng",
+        "/trieu-chung",
+        "thermo",
+        "cat-med",
+        "Hỏi từng bước, biết khi nào đi khám",
+      ],
+      [
+        "Bệnh thường gặp",
+        "/benh-thuong-gap",
+        "book",
+        "cat-feed",
+        "10 bài theo NHS",
+      ],
+      [
+        "Báo cáo cho bác sĩ",
+        "/bao-cao",
+        "doc",
+        "cat-temp",
+        "In A4 tóm tắt 14 ngày gần nhất",
+      ],
+    ]);
+  });
+
+  it("Tiện ích: four cards with a one-line description each", () => {
+    expect(nav.TOOLS.map(brief)).toEqual([
+      [
+        "Ồn trắng",
+        "/on-trang",
+        "wave",
+        "cat-sleep",
+        "Tiếng ồn đều giúp bé dễ ngủ",
+      ],
+      ["Nhạc", "/nhac", "music", "cat-feed", "Danh sách nhạc cho bé"],
+      ["Ảnh", "/anh", "image", "cat-diaper", "Ảnh của bé"],
+      ["Bồng bế", "/bong-be", "hands", "cat-tummy", "Tư thế bế, ợ hơi, cho bú"],
+    ]);
+  });
+
+  it("until the tab bar changes, the two new pages light the Khám phá tab", () => {
+    expect(activeTab("/suc-khoe")).toBe("explore");
+    expect(activeTab("/tien-ich")).toBe("explore");
+  });
+});
diff --git a/lib/ui/categories.test.ts b/lib/ui/categories.test.ts
index 8c114d5..23eb3b5 100644
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -80,8 +80,8 @@ describe("category class maps", () => {
 });

 describe("icon paths", () => {
-  it("has the 43 icons the app uses, each a non-empty path", () => {
-    expect(Object.keys(ICON_PATHS)).toHaveLength(43);
+  it("has the 48 icons the app uses, each a non-empty path", () => {
+    expect(Object.keys(ICON_PATHS)).toHaveLength(48);
     for (const d of Object.values(ICON_PATHS)) expect(d).toMatch(/^[Mm]/);
   });

diff --git a/lib/ui/icons.test.ts b/lib/ui/icons.test.ts
new file mode 100644
index 0000000..99b07b2
--- /dev/null
+++ b/lib/ui/icons.test.ts
@@ -0,0 +1,18 @@
+import { describe, expect, it } from "vitest";
+import { ICON_PATHS } from "./icons";
+
+// Spec 2026-11-25 §3.6.
+describe("icons of the Sức khỏe and Tiện ích work", () => {
+  it.each(["pulse", "grid", "flag", "alert", "pencil"] as const)(
+    "%s is a stroke path that starts with a move",
+    (name) => {
+      expect(ICON_PATHS[name]).toMatch(/^[Mm]/);
+      expect(ICON_PATHS[name].length).toBeGreaterThan(10);
+    },
+  );
+
+  it("keeps every path unique", () => {
+    const paths = Object.values(ICON_PATHS);
+    expect(new Set(paths).size).toBe(paths.length);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  3 failed | 156 passed (159)`, `Tests  9 failed | 1153 passed (1162)`. Lý do đỏ: chưa có `HEALTH_*`, `TOOLS`, 5 icon mới; `/suc-khoe` chưa làm sáng tab nào; số icon vẫn là 43.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/nav.ts b/lib/nav.ts
index e6c6ed8..bd0d50d 100644
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -10,35 +10,32 @@ export const TABS: Tab[] = [
   { key: "explore", href: "/kham-pha", label: "Khám phá", icon: "explore" },
 ];

-export type ExploreItem = {
+export type NavItem = {
   label: string;
   href: string;
   icon: IconName;
   color: CategoryToken;
   detail?: string;
 };
+// The old name, until the Khám phá page is gone.
+export type ExploreItem = NavItem;

-export const EXPLORE_EMERGENCY = {
+// Spec 2026-11-25 §3.4: the Sức khỏe page.
+export const HEALTH_EMERGENCY = {
   label: "Khẩn cấp",
   href: "/khan-cap",
   detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
 };

-export const EXPLORE_TRACK: ExploreItem[] = [
-  {
-    label: "Thống kê",
-    href: "/thong-ke",
-    icon: "chart",
-    color: "cat-sleep",
-    detail: "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
-  },
-  {
-    label: "Tăng trưởng",
-    href: "/tang-truong",
-    icon: "ruler",
-    color: "cat-tummy",
-    detail: "Cân nặng, chiều dài theo chuẩn WHO",
-  },
+export const HEALTH_GROWTH: NavItem = {
+  label: "Tăng trưởng",
+  href: "/tang-truong",
+  icon: "ruler",
+  color: "cat-tummy",
+  detail: "Cân nặng, chiều dài theo chuẩn WHO",
+};
+
+export const HEALTH_CARDS: NavItem[] = [
   {
     label: "Tiêm chủng",
     href: "/tiem-chung",
@@ -55,7 +52,15 @@ export const EXPLORE_TRACK: ExploreItem[] = [
   },
 ];

-export const EXPLORE_GUIDES: ExploreItem[] = [
+export const HEALTH_STATS: NavItem = {
+  label: "Thống kê",
+  href: "/thong-ke",
+  icon: "chart",
+  color: "cat-sleep",
+  detail: "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
+};
+
+export const HEALTH_SICK: NavItem[] = [
   {
     label: "Triệu chứng",
     href: "/trieu-chung",
@@ -70,6 +75,38 @@ export const EXPLORE_GUIDES: ExploreItem[] = [
     color: "cat-feed",
     detail: "10 bài theo NHS",
   },
+  {
+    label: "Báo cáo cho bác sĩ",
+    href: "/bao-cao",
+    icon: "doc",
+    color: "cat-temp",
+    detail: "In A4 tóm tắt 14 ngày gần nhất",
+  },
+];
+
+// Spec 2026-11-25 §3.5: the Tiện ích page.
+export const TOOLS: NavItem[] = [
+  {
+    label: "Ồn trắng",
+    href: "/on-trang",
+    icon: "wave",
+    color: "cat-sleep",
+    detail: "Tiếng ồn đều giúp bé dễ ngủ",
+  },
+  {
+    label: "Nhạc",
+    href: "/nhac",
+    icon: "music",
+    color: "cat-feed",
+    detail: "Danh sách nhạc cho bé",
+  },
+  {
+    label: "Ảnh",
+    href: "/anh",
+    icon: "image",
+    color: "cat-diaper",
+    detail: "Ảnh của bé",
+  },
   {
     label: "Bồng bế",
     href: "/bong-be",
@@ -79,23 +116,25 @@ export const EXPLORE_GUIDES: ExploreItem[] = [
   },
 ];

-export const EXPLORE_SOOTHE: ExploreItem[] = [
-  { label: "Ồn trắng", href: "/on-trang", icon: "wave", color: "cat-sleep" },
-  { label: "Nhạc", href: "/nhac", icon: "music", color: "cat-feed" },
-  { label: "Ảnh", href: "/anh", icon: "image", color: "cat-diaper" },
+// The Khám phá page reads the same items under its own grouping.
+export const EXPLORE_EMERGENCY = HEALTH_EMERGENCY;
+export const EXPLORE_TRACK: NavItem[] = [
+  HEALTH_STATS,
+  HEALTH_GROWTH,
+  ...HEALTH_CARDS,
 ];
-
-export const EXPLORE_REPORT: ExploreItem = {
-  label: "Báo cáo cho bác sĩ",
-  href: "/bao-cao",
-  icon: "doc",
-  color: "cat-temp",
-  detail: "In A4 tóm tắt 14 ngày gần nhất",
-};
+export const EXPLORE_GUIDES: NavItem[] = [
+  HEALTH_SICK[0],
+  HEALTH_SICK[1],
+  TOOLS[3],
+];
+export const EXPLORE_SOOTHE: NavItem[] = TOOLS.slice(0, 3);
+export const EXPLORE_REPORT: NavItem = HEALTH_SICK[2];

 // Pages that light up the Khám phá tab; /cam-nang and /tien-ich now redirect there.
 const EXPLORE_PREFIXES = [
   "/kham-pha",
+  "/suc-khoe",
   "/cam-nang",
   "/tien-ich",
   EXPLORE_EMERGENCY.href,
diff --git a/lib/ui/icons.ts b/lib/ui/icons.ts
index 1fc1597..f31a28b 100644
--- a/lib/ui/icons.ts
+++ b/lib/ui/icons.ts
@@ -54,6 +54,12 @@ export const ICON_PATHS = {
     "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
   stop: "M7 7h10v10H7z",
   play: "M7 4v16l13-8z",
+  // Spec 2026-11-25 §3.6.
+  pulse: "M3 12h4l2.5-6 4 12 2.5-6h5",
+  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
+  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
+  alert: "M12 3 2 20h20zM12 10v4M12 17h.01",
+  pencil: "M4 20h4L20 8l-4-4L4 16z",
 } as const;

 export type IconName = keyof typeof ICON_PATHS;
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  159 passed (159)`, `Tests  1162 passed (1162)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/nav.ts lib/nav.test.ts lib/ui/icons.ts lib/ui/icons.test.ts lib/ui/categories.test.ts
git commit -m "feat(nav): items of the Sức khỏe and Tiện ích pages, five new icons" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Luật "Cần chú ý" cho mũi tiêm (§4 dòng 2 và 3)

**Files:**

- Create: `lib/rules/attention.ts`
- Test: `lib/rules/attention.test.ts` (mới)

**Interfaces:**

- Consumes: `ScheduleItem` (`lib/rules/vaccines.ts`); `formatDayShort`, `vnDayStartMs` (`lib/rules/days.ts`); `IconName`; `CategoryToken`.
- Produces: `AttentionTone`, `AttentionItem`, `ATTENTION_MAX`, `VACCINE_SOON_DAYS`, `vaccineAttention(next, today)`, `attentionItems({ vaccine, today })` như ghi ở Contracts.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/rules/attention.test.ts b/lib/rules/attention.test.ts
new file mode 100644
index 0000000..5318e1d
--- /dev/null
+++ b/lib/rules/attention.test.ts
@@ -0,0 +1,89 @@
+import { describe, expect, it } from "vitest";
+import {
+  ATTENTION_MAX,
+  attentionItems,
+  vaccineAttention,
+  type AttentionItem,
+} from "./attention";
+import type { DoseState, ScheduleItem } from "./vaccines";
+
+const TODAY = "2026-11-25";
+
+const dose = (state: DoseState, due: string) =>
+  ({
+    dose: { code: "hexa", doseNo: 2, name: "6 trong 1 mũi 2" },
+    due,
+    state,
+    record: null,
+    unchosen: false,
+    pastMaxAge: false,
+  }) as ScheduleItem;
+
+// Spec 2026-11-25 §4, rows 2 and 3.
+describe("vaccineAttention", () => {
+  it("no next dose: no row", () => {
+    expect(vaccineAttention(null, TODAY)).toBeNull();
+  });
+
+  it("overdue: Quá hạn with the dose name, the due day, warn", () => {
+    expect(vaccineAttention(dose("overdue", "2026-11-10"), TODAY)).toEqual({
+      key: "vaccine",
+      icon: "syringe",
+      color: "cat-temp",
+      title: "Quá hạn: 6 trong 1 mũi 2",
+      detail: "Hẹn 10/11",
+      tone: "warn",
+      href: "/tiem-chung",
+    });
+  });
+
+  it("due within 14 days: the dose name, the due day and the days left", () => {
+    expect(vaccineAttention(dose("upcoming", "2026-12-10"), TODAY)).toBeNull();
+    expect(vaccineAttention(dose("upcoming", "2026-12-09"), TODAY)).toEqual({
+      key: "vaccine",
+      icon: "syringe",
+      color: "cat-temp",
+      title: "6 trong 1 mũi 2",
+      detail: "Hẹn 09/12 · còn 14 ngày",
+      tone: "normal",
+      href: "/tiem-chung",
+    });
+    expect(
+      vaccineAttention(dose("upcoming", "2026-11-26"), TODAY)?.detail,
+    ).toBe("Hẹn 26/11 · còn 1 ngày");
+  });
+
+  it("due today: the whole detail is Hẹn hôm nay", () => {
+    expect(vaccineAttention(dose("upcoming", TODAY), TODAY)?.detail).toBe(
+      "Hẹn hôm nay",
+    );
+  });
+
+  it("a dose further away than 14 days gives no row, whatever its state", () => {
+    expect(vaccineAttention(dose("later", "2027-06-14"), TODAY)).toBeNull();
+    expect(vaccineAttention(dose("upcoming", "2026-12-20"), TODAY)).toBeNull();
+  });
+});
+
+describe("attentionItems", () => {
+  it("is empty when nothing needs attention", () => {
+    expect(attentionItems({ vaccine: null, today: TODAY })).toEqual([]);
+    expect(
+      attentionItems({ vaccine: dose("later", "2027-06-14"), today: TODAY }),
+    ).toEqual([]);
+  });
+
+  it("lists the vaccine row", () => {
+    const items = attentionItems({
+      vaccine: dose("overdue", "2026-11-10"),
+      today: TODAY,
+    });
+    expect(items.map((item: AttentionItem) => item.title)).toEqual([
+      "Quá hạn: 6 trong 1 mũi 2",
+    ]);
+  });
+
+  it("never returns more than four rows", () => {
+    expect(ATTENTION_MAX).toBe(4);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 159 passed (160)`, `Tests  1162 passed (1162)`. File test mới không chạy được test nào vì chưa có `./attention`.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/lib/rules/attention.ts b/lib/rules/attention.ts
new file mode 100644
index 0000000..e75ec47
--- /dev/null
+++ b/lib/rules/attention.ts
@@ -0,0 +1,69 @@
+import type { CategoryToken } from "@/lib/ui/categories";
+import type { IconName } from "@/lib/ui/icons";
+import { formatDayShort, vnDayStartMs } from "./days";
+import type { ScheduleItem } from "./vaccines";
+
+export type AttentionTone = "normal" | "warn" | "danger";
+
+// Spec 2026-11-25 §4: one row of "Cần chú ý" on the Sức khỏe page.
+export type AttentionItem = {
+  key: string;
+  icon: IconName;
+  color: CategoryToken;
+  title: string;
+  detail: string;
+  tone: AttentionTone;
+  href: string;
+};
+
+export const ATTENTION_MAX = 4;
+// A dose due later than this many days from today is not listed yet.
+export const VACCINE_SOON_DAYS = 14;
+
+const DAY_MS = 86_400_000;
+
+// Rows 2 and 3 of the table: `next` is what nextDose returned.
+export function vaccineAttention(
+  next: ScheduleItem | null,
+  today: string,
+): AttentionItem | null {
+  if (next === null) return null;
+  const base = {
+    key: "vaccine",
+    icon: "syringe",
+    color: "cat-temp",
+    href: "/tiem-chung",
+  } as const;
+  if (next.state === "overdue")
+    return {
+      ...base,
+      title: `Quá hạn: ${next.dose.name}`,
+      detail: `Hẹn ${formatDayShort(next.due)}`,
+      tone: "warn",
+    };
+  const days = Math.round(
+    (vnDayStartMs(next.due) - vnDayStartMs(today)) / DAY_MS,
+  );
+  if (days < 0 || days > VACCINE_SOON_DAYS) return null;
+  return {
+    ...base,
+    title: next.dose.name,
+    detail:
+      days === 0
+        ? "Hẹn hôm nay"
+        : `Hẹn ${formatDayShort(next.due)} · còn ${days} ngày`,
+    tone: "normal",
+  };
+}
+
+// The rows in priority order, at most ATTENTION_MAX. A source whose data has
+// not loaded is passed as null and gives no row.
+export function attentionItems(input: {
+  vaccine: ScheduleItem | null;
+  today: string;
+}): AttentionItem[] {
+  const rows = [vaccineAttention(input.vaccine, input.today)];
+  return rows
+    .filter((row): row is AttentionItem => row !== null)
+    .slice(0, ATTENTION_MAX);
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  160 passed (160)`, `Tests  1170 passed (1170)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/attention.ts lib/rules/attention.test.ts
git commit -m "feat(attention): the vaccine rows of Cần chú ý" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Thẻ dùng chung, màu dòng phụ của hàng danh sách, số đo mới nhất (§3.4, §3.5, §4)

**Files:**

- Create: `components/ui/NavCard.tsx`
- Modify: `components/ui/ListGroup.tsx`, `lib/rules/growthForm.ts`
- Test: `components/ui/navcard.test.tsx` (mới), `components/ui/lists.test.tsx`, `lib/rules/latestGrowth.test.ts` (mới)

**Interfaces:**

- Consumes: `NavItem`, `HEALTH_CARDS`, `TOOLS` (Task 1); `CATEGORY_CHIP`; `GrowthInput` (`lib/rules/growthForm.ts`).
- Produces: `NavCard({ item, live?, short? })` và `LiveLine`; `ListRow` có `detailTone?: "muted" | "warn" | "danger"` (mặc định `"muted"`, markup mặc định không đổi); `LatestGrowth` và `latestGrowth(rows)`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/ui/lists.test.tsx b/components/ui/lists.test.tsx
index ae1beda..cb48f4a 100644
--- a/components/ui/lists.test.tsx
+++ b/components/ui/lists.test.tsx
@@ -109,3 +109,26 @@ describe("Skeleton", () => {
     expect(html).toContain("h-20");
   });
 });
+
+// Spec 2026-11-25 §4: the detail line of a "Cần chú ý" row.
+describe("ListRow detail tone", () => {
+  const row = (tone?: "warn" | "danger") =>
+    renderToStaticMarkup(
+      <ListRow label="Tiêm" detail="Hẹn 10/11" detailTone={tone} href="/x" />,
+    );
+
+  it("is muted unless a tone is given", () => {
+    expect(row()).toContain(
+      '<span class="text-[13px] text-muted">Hẹn 10/11</span>',
+    );
+  });
+
+  it("warn and danger are semibold in their colour", () => {
+    expect(row("warn")).toContain(
+      '<span class="text-[13px] font-semibold text-warn">Hẹn 10/11</span>',
+    );
+    expect(row("danger")).toContain(
+      '<span class="text-[13px] font-semibold text-danger">Hẹn 10/11</span>',
+    );
+  });
+});
diff --git a/components/ui/navcard.test.tsx b/components/ui/navcard.test.tsx
new file mode 100644
index 0000000..247599c
--- /dev/null
+++ b/components/ui/navcard.test.tsx
@@ -0,0 +1,60 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import { HEALTH_CARDS, TOOLS } from "@/lib/nav";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { NavCard } from "./NavCard";
+
+const [VACCINE] = HEALTH_CARDS;
+const LINE = "line-clamp-2 text-[13px] leading-[18px]";
+
+// Spec 2026-11-25 §3.4 and §3.5.
+describe("NavCard", () => {
+  it("is a glass link with a tinted round icon, the name and the description", () => {
+    const html = renderToStaticMarkup(<NavCard item={TOOLS[0]} />);
+    expect(html).toContain(
+      '<a class="glass flex flex-col gap-1.5 rounded-[26px] p-4 text-ink min-h-32" href="/on-trang">',
+    );
+    expect(html).toContain(
+      "flex size-9 items-center justify-center rounded-full bg-cat-sleep/15 text-cat-sleep",
+    );
+    expect(html).toContain(`d="${ICON_PATHS.wave}"`);
+    expect(html).toContain('<span class="text-base font-bold">Ồn trắng</span>');
+    expect(html).toContain(
+      `<span class="${LINE} text-muted">Tiếng ồn đều giúp bé dễ ngủ</span>`,
+    );
+  });
+
+  it("short cards are 112 px tall at least", () => {
+    const html = renderToStaticMarkup(<NavCard item={VACCINE} short />);
+    expect(html).toContain("p-4 text-ink min-h-28");
+    expect(html).not.toContain("min-h-32");
+  });
+
+  it("a live line replaces the description", () => {
+    const html = renderToStaticMarkup(
+      <NavCard item={VACCINE} live={{ text: "10/12 · Sởi", warn: false }} />,
+    );
+    expect(html).toContain(
+      `<span class="${LINE} text-muted">10/12 · Sởi</span>`,
+    );
+    expect(html).not.toContain(VACCINE.detail);
+  });
+
+  it("a warning live line is semibold in the warn colour", () => {
+    const html = renderToStaticMarkup(
+      <NavCard item={VACCINE} live={{ text: "Quá hạn: Sởi", warn: true }} />,
+    );
+    expect(html).toContain(
+      `<span class="${LINE} font-semibold text-warn">Quá hạn: Sởi</span>`,
+    );
+  });
+
+  it("a live line with no text yet keeps the description", () => {
+    const html = renderToStaticMarkup(
+      <NavCard item={VACCINE} live={{ text: null, warn: false }} />,
+    );
+    expect(html).toContain(
+      `<span class="${LINE} text-muted">${VACCINE.detail}</span>`,
+    );
+  });
+});
diff --git a/lib/rules/latestGrowth.test.ts b/lib/rules/latestGrowth.test.ts
new file mode 100644
index 0000000..50695b8
--- /dev/null
+++ b/lib/rules/latestGrowth.test.ts
@@ -0,0 +1,59 @@
+import { describe, expect, it } from "vitest";
+import { latestGrowth } from "./growthForm";
+
+const row = (
+  measured_on: string,
+  weight_g: number | null,
+  length_cm: number | null,
+  head_cm: number | null,
+) => ({ measured_on, weight_g, length_cm, head_cm });
+
+// Spec 2026-11-25 §3.4: the growth card of the Sức khỏe page.
+describe("latestGrowth", () => {
+  it("returns null without measurements", () => {
+    expect(latestGrowth([])).toBeNull();
+  });
+
+  it("takes the newest day and, per indicator, the newest value that exists", () => {
+    const rows = [
+      row("2026-10-10", 4600, 55.2, 37.4),
+      row("2026-11-25", 6100, null, null),
+      row("2026-11-01", null, 58, null),
+    ];
+    expect(latestGrowth(rows)).toEqual({
+      measuredOn: "2026-11-25",
+      weightG: 6100,
+      lengthCm: 58,
+      headCm: 37.4,
+    });
+    // The rows keep the order they came in.
+    expect(rows.map((r) => r.measured_on)).toEqual([
+      "2026-10-10",
+      "2026-11-25",
+      "2026-11-01",
+    ]);
+  });
+
+  it("an indicator never measured stays null", () => {
+    expect(latestGrowth([row("2026-11-25", 6100, null, null)])).toEqual({
+      measuredOn: "2026-11-25",
+      weightG: 6100,
+      lengthCm: null,
+      headCm: null,
+    });
+  });
+
+  it("two rows on one day: the first row wins, as the query lists the newest first", () => {
+    expect(
+      latestGrowth([
+        row("2026-11-25", 6200, null, null),
+        row("2026-11-25", 6100, 61.5, null),
+      ]),
+    ).toEqual({
+      measuredOn: "2026-11-25",
+      weightG: 6200,
+      lengthCm: 61.5,
+      headCm: null,
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  3 failed | 159 passed (162)`, `Tests  5 failed | 1171 passed (1176)`. File `navcard.test.tsx` không chạy được test nào vì chưa có `./NavCard`.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/components/ui/ListGroup.tsx b/components/ui/ListGroup.tsx
index 4decee2..f93898b 100644
--- a/components/ui/ListGroup.tsx
+++ b/components/ui/ListGroup.tsx
@@ -43,9 +43,17 @@ export function ListGroup({
   );
 }

+// Spec 2026-11-25 §4: a "Cần chú ý" row whose detail is a warning.
+const DETAIL_TONE = {
+  muted: "text-[13px] text-muted",
+  warn: "text-[13px] font-semibold text-warn",
+  danger: "text-[13px] font-semibold text-danger",
+} as const;
+
 export function ListRow({
   label,
   detail,
+  detailTone = "muted",
   value,
   icon,
   iconColor = "muted",
@@ -56,6 +64,7 @@ export function ListRow({
 }: {
   label: string;
   detail?: string;
+  detailTone?: keyof typeof DETAIL_TONE;
   value?: string;
   icon?: IconName;
   iconColor?: ListRowIconColor;
@@ -78,7 +87,7 @@ export function ListRow({
       )}
       <span className="flex min-w-0 flex-1 flex-col">
         <span className="text-base text-ink">{label}</span>
-        {detail && <span className="text-[13px] text-muted">{detail}</span>}
+        {detail && <span className={DETAIL_TONE[detailTone]}>{detail}</span>}
       </span>
       {value && <span className="text-[15px] text-muted">{value}</span>}
       {trailing}
diff --git a/components/ui/NavCard.tsx b/components/ui/NavCard.tsx
new file mode 100644
index 0000000..1eb1b46
--- /dev/null
+++ b/components/ui/NavCard.tsx
@@ -0,0 +1,48 @@
+import Link from "next/link";
+import type { NavItem } from "@/lib/nav";
+import { CATEGORY_CHIP } from "@/lib/ui/categories";
+import { cx } from "@/lib/ui/cx";
+import { Icon } from "./Icon";
+
+// The line a card shows from live data. `text: null` means there is nothing
+// to show yet, so the card keeps its description.
+export type LiveLine = { text: string | null; warn: boolean };
+
+// Spec 2026-11-25 §3.4 and §3.5: a card of the Sức khỏe and Tiện ích pages.
+export function NavCard({
+  item,
+  live,
+  short = false,
+}: {
+  item: NavItem;
+  live?: LiveLine;
+  short?: boolean;
+}) {
+  return (
+    <Link
+      href={item.href}
+      className={cx(
+        "glass flex flex-col gap-1.5 rounded-[26px] p-4 text-ink",
+        short ? "min-h-28" : "min-h-32",
+      )}
+    >
+      <span
+        className={cx(
+          "flex size-9 items-center justify-center rounded-full",
+          CATEGORY_CHIP[item.color],
+        )}
+      >
+        <Icon name={item.icon} size={18} strokeWidth={2.2} />
+      </span>
+      <span className="text-base font-bold">{item.label}</span>
+      <span
+        className={cx(
+          "line-clamp-2 text-[13px] leading-[18px]",
+          live?.warn ? "font-semibold text-warn" : "text-muted",
+        )}
+      >
+        {live?.text ?? item.detail}
+      </span>
+    </Link>
+  );
+}
diff --git a/lib/rules/growthForm.ts b/lib/rules/growthForm.ts
index efaa177..5e339e1 100644
--- a/lib/rules/growthForm.ts
+++ b/lib/rules/growthForm.ts
@@ -130,6 +130,30 @@ export function indicatorValue(
   return indicator === "lhfa" ? row.length_cm : row.head_cm;
 }

+export type LatestGrowth = {
+  measuredOn: string;
+  weightG: number | null;
+  lengthCm: number | null;
+  headCm: number | null;
+};
+
+// Spec 2026-11-25 §3.4: the day of the newest measurement and, for each
+// indicator, its newest value. On the same day the first row wins.
+export function latestGrowth(rows: GrowthInput[]): LatestGrowth | null {
+  if (rows.length === 0) return null;
+  const sorted = [...rows].sort((a, b) =>
+    b.measured_on.localeCompare(a.measured_on),
+  );
+  const newest = (column: "weight_g" | "length_cm" | "head_cm") =>
+    sorted.find((row) => row[column] !== null)?.[column] ?? null;
+  return {
+    measuredOn: sorted[0].measured_on,
+    weightG: newest("weight_g"),
+    lengthCm: newest("length_cm"),
+    headCm: newest("head_cm"),
+  };
+}
+
 export function latestWeightG(rows: GrowthInput[]): number | null {
   const withWeight = rows.filter((r) => r.weight_g !== null);
   withWeight.sort((a, b) => b.measured_on.localeCompare(a.measured_on));
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  162 passed (162)`, `Tests  1181 passed (1181)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/ui/NavCard.tsx components/ui/navcard.test.tsx components/ui/ListGroup.tsx components/ui/lists.test.tsx lib/rules/growthForm.ts lib/rules/latestGrowth.test.ts
git commit -m "feat(ui): NavCard, the detail tone of ListRow, latestGrowth" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M1a và hỏi người dùng trước khi lên `main`

**Files:**

- Modify: file plan này (ghi kết quả dưới Step 2)

**Interfaces:**

- Consumes: mọi thứ của Task 1–3.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  162 passed (162)`, `Tests  1181 passed (1181)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0. Ghi kết quả ngay dưới bước này.

**Kết quả (2026-11-25, nhánh `feat/kim-bun-suc-khoe-m1a`, sau commit `9a4c6ee`):**

- Cả 6 patch áp sạch bằng `kb_patch`; số test đỏ và xanh của Task 1–3 đúng như dòng `Expected` của từng step.
- Step 1: `bun run typecheck` (`tsc --noEmit`) không báo lỗi; `bunx vitest run` ra `Test Files  162 passed (162)`, `Tests  1181 passed (1181)`.
- Step 2: `bun run build` lần 1 thoát mã 1 với `SecurityFatalError` (cảnh báo bảo mật của Next.js 16.4.3) sau khi đã in xong bảng route; lần 2 cùng lệnh: `✓ Compiled successfully`, `✓ Generating static pages using 9 workers (38/38)`, thoát mã 0. Không chạy `next upgrade`.
- Không chạy `bun run dev`, không mở trình duyệt, không chạy pgTAP (plan không đổi màn hình, không đụng DB).
- Chưa push, chưa merge vào `main`; chờ người dùng trả lời.

- [x] **Step 3: Commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m1a.md
git commit -m "docs(plan): record the M1a check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline 573bdc4..HEAD`; kết quả typecheck, vitest, build; nói rõ plan này không đổi gì trên màn hình nên không có bước kiểm trình duyệt. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m1a
git push origin main
```
