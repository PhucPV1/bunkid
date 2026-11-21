# Kim Bun — UX mobile M5c: thẻ Tăng trưởng và Tiêm chủng ở Khám phá hiện số liệu thật Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (§9; phần tương ứng của §11.1 và §11.2)

**Status:** approved 2026-11-19 (người dùng: "tôi duyệt hết, tự chạy cho tới khi xong luôn đi, plan nào xong phần nào thì commit push main luôn")

**Goal:** Ở Khám phá, thẻ Tăng trưởng hiện cân nặng mới nhất và thẻ Tiêm chủng hiện mũi cần làm trước; khi chưa có dữ liệu thì vẫn hiện mô tả cũ.

**Architecture:**

- **Luật thuần:** file mới `lib/rules/exploreCards.ts` với `growthCardText` và `vaccineCardText`.
- **Giao diện:** `ExploreScreen` thành client component nhận `baby`, gọi `useGrowth` và `useVaccineDoses`, rồi dựng lịch bằng `buildSchedule` như `VaccineScreen`. `app/kham-pha/page.tsx` truyền `ctx.baby`.
- Không sửa `lib/nav.ts`. Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ux-mobile-m5c`, cắt từ `main` sau khi M5b đã lên (`main` lúc đó bằng `feat/kim-bun-ux-mobile-m5b`). Baseline: 1076 test vitest xanh (157 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1 | §5.1, §5.2, §5.3, §10, đổi chữ "Tummy" của §8 | đã xong, đã lên `main` @ `5c4ea5f` |
| M2a, M2b, M2c | §3 trang Hôm nay | đã xong, đã lên `main` @ `e1e729f` |
| M6 | phần còn lại của §8 Thống kê | đã xong, đã lên `main` @ `34f18f6` |
| M5a | §7.1 thẻ "cần làm trước", luật của §7.2 | `2026-11-19-kim-bun-ux-mobile-m5a.md` |
| M5b | §7.2 bảng vắc xin × mũi, §7.3 | `2026-11-19-kim-bun-ux-mobile-m5b.md` |
| **M5c (plan này)** | §9 Khám phá | `2026-11-19-kim-bun-ux-mobile-m5c.md` |
| M3a, M3b | §4 timer trong tab, §5.4 sheet "+" | đã chạy thử, chưa viết plan |
| M4 | §6 Triệu chứng | chưa viết |
| Kết | §11.3 bước 36 của checklist thiết bị | làm sau cùng |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **`line-clamp-2`** chỉ đặt ở dòng mô tả của hai thẻ có số liệu thật, kể cả khi chúng đang hiện mô tả tĩnh. Markup của thẻ Thống kê và Phát triển giữ nguyên từng ký tự.
2. **"Đang tải, mất mạng, lỗi"** được đọc là "query chưa có `data`". Có dữ liệu trong cache mà lần tải lại nền bị lỗi thì vẫn hiện số liệu, cùng luật với `VaccineScreen`.
3. **Thẻ nào có số liệu thật** được chọn theo `href` (`/tang-truong`, `/tiem-chung`), để không phải sửa `lib/nav.ts`.
4. **Khám phá không xét bước thiết lập lịch tiêm.** Chủ gia đình chưa thiết lập vẫn có thể thấy "Quá hạn: …" ở đây, trong khi trang Tiêm chủng giấu thẻ của nó. §9 không nhắc tới bước thiết lập.
5. **`vaccineCardText` nhận kết quả của `nextDose`** (`ScheduleItem | null`), vì component cũng cần chính phần tử đó để chọn màu cảnh báo.
6. **Hai lần cân cùng ngày:** hàng đứng trước thắng (query trả hàng tạo sau trước), giống `latestWeightG` đang có.
7. **"Hôm nay"** là `vnDateString(new Date())` lúc render, như `VaccineScreen`.
8. **Kiểm trình duyệt** do phiên chính làm bằng khung Browser trong app ở 375×812; người dùng đã đăng nhập lại ở khung này ngày 2026-11-21.

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
    on' docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên bản sao đã có M5a và M5b ở ngoài repo; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code, số test đỏ và xanh của từng task đúng như ghi; tổng cả bộ đã được đo lại trên `main` @ `34f18f6`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Người dùng đã đồng ý trước cho cả 6 mốc của spec này (xem dòng Status).
- **Next.js.** Task 2 đổi `app/kham-pha/page.tsx` theo đúng mẫu của `app/trieu-chung/page.tsx` (hàm con của `AuthGate` nhận `{ ctx }`); không thêm route, không dùng API nào của Next mà repo chưa dùng.

## Contracts with Other Plans

Plan này đứng ngay sau M5b. M3 và M4 chưa lên `main` và không dùng gì của plan này.

**Consumes (từ M5a, `2026-11-19-kim-bun-ux-mobile-m5a.md`):**

- `lib/rules/vaccines.ts`: `nextDose(items): ScheduleItem | null`.

**Produces:**

- `lib/rules/exploreCards.ts`: `growthCardText`, `vaccineCardText`.
- `components/explore/ExploreScreen.tsx`: `ExploreScreen({ baby })`, client component.
- **Vitest sau M5:** 1094 test, 158 file.

---

### Task 1: Luật: chữ của thẻ Tăng trưởng và thẻ Tiêm chủng ở Khám phá (§9)

**Files:**

- Create: `lib/rules/exploreCards.ts`
- Test: `lib/rules/exploreCards.test.ts` (mới)

**Interfaces:**

- Consumes: `formatDayShort` (`lib/rules/days.ts`); `GrowthInput` (`lib/rules/growthForm.ts`); `ScheduleItem` (`lib/rules/vaccines.ts`).
- Produces: `growthCardText(rows: Pick<GrowthInput, "measured_on" | "weight_g">[]): string | null` và `vaccineCardText(next: ScheduleItem | null): string | null` trong file mới `lib/rules/exploreCards.ts`.

- [ ] **Step 0: Tạo nhánh**

```bash
git checkout -b feat/kim-bun-ux-mobile-m5c main
```

- [ ] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/exploreCards.test.ts b/lib/rules/exploreCards.test.ts
new file mode 100644
index 0000000..d94b15d
--- /dev/null
+++ b/lib/rules/exploreCards.test.ts
@@ -0,0 +1,88 @@
+import { describe, expect, it } from "vitest";
+import { growthCardText, vaccineCardText } from "./exploreCards";
+import type { DoseState, ScheduleItem } from "./vaccines";
+
+const measure = (measured_on: string, weight_g: number | null) => ({
+  measured_on,
+  weight_g,
+  length_cm: 58.5,
+  head_cm: null,
+});
+
+// Spec 2026-11-19 §9.
+describe("growthCardText", () => {
+  it("shows the latest weight in grams with a thousands dot, then its day", () => {
+    expect(growthCardText([measure("2026-11-15", 5500)])).toBe(
+      "Cân nặng 5.500 g · 15/11",
+    );
+    expect(growthCardText([measure("2026-09-10", 950)])).toBe(
+      "Cân nặng 950 g · 10/09",
+    );
+    expect(growthCardText([measure("2027-03-01", 10250)])).toBe(
+      "Cân nặng 10.250 g · 01/03",
+    );
+  });
+
+  it("takes the newest measurement that has a weight, whatever the row order", () => {
+    const rows = [
+      measure("2026-10-14", 4300),
+      measure("2026-11-20", null),
+      measure("2026-11-15", 5500),
+    ];
+    expect(growthCardText(rows)).toBe("Cân nặng 5.500 g · 15/11");
+    expect(growthCardText([...rows].reverse())).toBe(
+      "Cân nặng 5.500 g · 15/11",
+    );
+    // The rows keep the order they came in.
+    expect(rows.map((row) => row.measured_on)).toEqual([
+      "2026-10-14",
+      "2026-11-20",
+      "2026-11-15",
+    ]);
+  });
+
+  it("two weights on one day: the first row wins, as the query lists the newest first", () => {
+    expect(
+      growthCardText([
+        measure("2026-11-15", 5600),
+        measure("2026-11-15", 5500),
+      ]),
+    ).toBe("Cân nặng 5.600 g · 15/11");
+  });
+
+  it("returns null when no measurement has a weight", () => {
+    expect(growthCardText([])).toBeNull();
+    expect(growthCardText([measure("2026-11-20", null)])).toBeNull();
+  });
+});
+
+const next = (state: DoseState, due: string) =>
+  ({
+    dose: { code: "bexsero", doseNo: 2, name: "Bexsero mũi 2" },
+    due,
+    state,
+    record: null,
+    unchosen: false,
+    pastMaxAge: false,
+  }) as ScheduleItem;
+
+describe("vaccineCardText", () => {
+  it("overdue: Quá hạn and the dose name, no date", () => {
+    expect(vaccineCardText(next("overdue", "2026-11-10"))).toBe(
+      "Quá hạn: Bexsero mũi 2",
+    );
+  });
+
+  it("upcoming or later: the due day first, then the dose name", () => {
+    expect(vaccineCardText(next("upcoming", "2026-12-10"))).toBe(
+      "10/12 · Bexsero mũi 2",
+    );
+    expect(vaccineCardText(next("later", "2027-06-05"))).toBe(
+      "05/06 · Bexsero mũi 2",
+    );
+  });
+
+  it("returns null when there is no next dose", () => {
+    expect(vaccineCardText(null)).toBeNull();
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run lib/rules/exploreCards.test.ts`
Expected: FAIL, `Test Files  1 failed (1)`, không test nào chạy được (`Cannot find module './exploreCards'`).

- [ ] **Step 3: Sửa code (Patch 2)**

```diff
diff --git a/lib/rules/exploreCards.ts b/lib/rules/exploreCards.ts
new file mode 100644
index 0000000..0c2883a
--- /dev/null
+++ b/lib/rules/exploreCards.ts
@@ -0,0 +1,29 @@
+import { formatDayShort } from "./days";
+import type { GrowthInput } from "./growthForm";
+import type { ScheduleItem } from "./vaccines";
+
+const grams = new Intl.NumberFormat("vi-VN");
+
+// Spec 2026-11-19 §9: the line on the Tăng trưởng card of Khám phá, from the
+// latest measurement that has a weight. On the same day the first row wins.
+export function growthCardText(
+  rows: Pick<GrowthInput, "measured_on" | "weight_g">[],
+): string | null {
+  let latest: { day: string; weightG: number } | null = null;
+  for (const row of rows) {
+    if (row.weight_g === null) continue;
+    if (latest === null || row.measured_on > latest.day)
+      latest = { day: row.measured_on, weightG: row.weight_g };
+  }
+  if (latest === null) return null;
+  return `Cân nặng ${grams.format(latest.weightG)} g · ${formatDayShort(latest.day)}`;
+}
+
+// Spec 2026-11-19 §9: the line on the Tiêm chủng card, for the dose nextDose
+// returned. The day comes first so a long dose name cannot cut it off.
+export function vaccineCardText(next: ScheduleItem | null): string | null {
+  if (next === null) return null;
+  return next.state === "overdue"
+    ? `Quá hạn: ${next.dose.name}`
+    : `${formatDayShort(next.due)} · ${next.dose.name}`;
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run lib/rules/exploreCards.test.ts && bun run typecheck`
Expected: `Tests  7 passed (7)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- lib/rules/exploreCards.ts lib/rules/exploreCards.test.ts
git commit -m "feat(explore): the live lines of the growth and vaccine cards" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Khám phá: hai thẻ hiện số liệu thật (§9)

**Files:**

- Modify: `app/kham-pha/page.tsx`
- Modify: `components/explore/ExploreScreen.tsx`
- Test: `components/explore/explore.test.tsx` (sửa)

**Interfaces:**

- Consumes: `growthCardText`, `vaccineCardText` (Task 1); `nextDose` (M5a); `useGrowth` (`lib/data/growth.ts`), `useVaccineDoses` (`lib/data/vaccines.ts`); `buildSchedule`, `parseChoices`, `toDoseRecords`, `VACCINES`.
- Produces: `ExploreScreen({ baby }: { baby: Baby })`, giờ là client component (`"use client"`); `app/kham-pha/page.tsx` truyền `ctx.baby`. Thẻ `/tang-truong` và `/tiem-chung` hiện dòng số liệu thật, tối đa 2 dòng; chưa có dữ liệu thì hiện mô tả tĩnh.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/explore/explore.test.tsx b/components/explore/explore.test.tsx
index 8c2fa18..5e6299d 100644
--- a/components/explore/explore.test.tsx
+++ b/components/explore/explore.test.tsx
@@ -1,5 +1,5 @@
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it } from "vitest";
+import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
 import {
   EXPLORE_EMERGENCY,
   EXPLORE_GUIDES,
@@ -7,48 +7,301 @@ import {
   EXPLORE_SOOTHE,
   EXPLORE_TRACK,
 } from "@/lib/nav";
+import type { Baby, GrowthRow, VaccineDoseRow } from "@/lib/supabase/rows";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { ExploreScreen } from "./ExploreScreen";
 
-const html = renderToStaticMarkup(<ExploreScreen />);
+const state = vi.hoisted(() => ({
+  growth: {} as Record<string, unknown>,
+  doses: {} as Record<string, unknown>,
+}));
+const useGrowth = vi.hoisted(() => vi.fn());
+const useVaccineDoses = vi.hoisted(() => vi.fn());
+// Four doses: one at birth, two at two months (one of them in a group), one late.
+const content = vi.hoisted(() => {
+  const base = {
+    protects: ["X"],
+    source: "https://example.org",
+    reviewedAt: "2026-11-14",
+  };
+  return {
+    title: "Lịch tiêm",
+    disclaimer: "Lịch tham khảo.",
+    reviewedAt: "2026-11-14",
+    groups: [
+      {
+        code: "dtp_combo",
+        name: "Bạch hầu, ho gà, uốn ván",
+        series: [
+          { code: "6in1", name: "6 trong 1", program: "dich_vu" },
+          { code: "tcmr_5in1", name: "5 trong 1", program: "tcmr" },
+        ],
+      },
+    ],
+    doses: [
+      {
+        ...base,
+        code: "bcg",
+        doseNo: 1,
+        name: "Lao (BCG)",
+        program: "tcmr",
+        recommendedAgeDays: 0,
+        minAgeDays: 0,
+      },
+      {
+        ...base,
+        code: "hexa",
+        doseNo: 1,
+        name: "6 trong 1 mũi 1",
+        program: "dich_vu",
+        group: "dtp_combo",
+        series: "6in1",
+        recommendedAgeDays: 60,
+        minAgeDays: 42,
+      },
+      {
+        ...base,
+        code: "pcv",
+        doseNo: 1,
+        name: "Phế cầu mũi 1",
+        program: "dich_vu",
+        recommendedAgeDays: 60,
+        minAgeDays: 42,
+      },
+      {
+        ...base,
+        code: "mmr",
+        doseNo: 1,
+        name: "Sởi mũi 1",
+        program: "tcmr",
+        recommendedAgeDays: 270,
+        minAgeDays: 270,
+      },
+    ],
+  };
+});
+
+vi.mock("@/lib/content/vaccines", () => ({ VACCINES: content }));
+vi.mock("@/lib/data/growth", () => ({ useGrowth }));
+vi.mock("@/lib/data/vaccines", () => ({ useVaccineDoses }));
+
+const LOADING = {
+  data: undefined,
+  isPending: true,
+  isError: false,
+  error: null,
+  fetchStatus: "fetching",
+};
+const OFFLINE = { ...LOADING, fetchStatus: "paused" };
+const FAILED = {
+  ...LOADING,
+  isPending: false,
+  isError: true,
+  error: new Error("boom"),
+  fetchStatus: "idle",
+};
+const loaded = (data: unknown[]) => ({
+  data,
+  isPending: false,
+  isError: false,
+  error: null,
+  fetchStatus: "idle",
+});
+
+const CHOSEN = { dtp_combo: "6in1" };
+const [STATS, GROWTH, VACCINE, MILESTONES] = EXPLORE_TRACK;
+const STATIC_LINE = "text-[13px] leading-[18px] text-muted";
+const LIVE_LINE = "line-clamp-2 text-[13px] leading-[18px] text-muted";
+const WARN_LINE =
+  "line-clamp-2 text-[13px] leading-[18px] font-semibold text-warn";
+
+const measure = (measured_on: string, weight_g: number | null) =>
+  ({
+    id: `g-${measured_on}`,
+    baby_id: "b1",
+    measured_on,
+    weight_g,
+    length_cm: 58.5,
+    head_cm: null,
+  }) as GrowthRow;
+
+const done = (code: string) =>
+  ({
+    id: `row-${code}`,
+    baby_id: "b1",
+    vaccine_code: code,
+    dose_no: 1,
+    status: "done",
+    given_on: "2026-11-15",
+    due_on_override: null,
+  }) as VaccineDoseRow;
+
+function render(
+  query: { growth?: unknown; doses?: unknown } = {},
+  choices: Record<string, string> = CHOSEN,
+) {
+  state.growth = (query.growth ?? LOADING) as Record<string, unknown>;
+  state.doses = (query.doses ?? LOADING) as Record<string, unknown>;
+  const baby = {
+    id: "b1",
+    family_id: "f1",
+    name: "Bun",
+    dob: "2026-09-14",
+    vaccine_choices: choices,
+  } as Baby;
+  return renderToStaticMarkup(<ExploreScreen baby={baby} />);
+}
+
+// One Theo dõi card: from its link to the end of the link.
+function card(html: string, href: string) {
+  const from = html.indexOf(`href="${href}"`);
+  expect(from, href).toBeGreaterThan(-1);
+  return html.slice(from, html.indexOf("</a>", from));
+}
+
+beforeAll(() => {
+  useGrowth.mockImplementation(() => state.growth);
+  useVaccineDoses.mockImplementation(() => state.doses);
+  vi.useFakeTimers({ toFake: ["Date"] });
+  vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
+});
+afterAll(() => vi.useRealTimers());
 
 describe("ExploreScreen", () => {
+  const html = () => render();
+
   it("has a large title and the four section headings in spec order", () => {
-    expect(html).toContain(">Khám phá</h1>");
+    const page = html();
+    expect(page).toContain(">Khám phá</h1>");
     const order = [
       "Khẩn cấp",
       "Theo dõi",
       "Cẩm nang",
       "Dỗ bé và kỷ niệm",
       "Báo cáo cho bác sĩ",
-    ].map((t) => html.indexOf(t));
+    ].map((t) => page.indexOf(t));
     expect(order.every((i) => i >= 0)).toBe(true);
     expect([...order].sort((a, b) => a - b)).toEqual(order);
   });
 
   it("starts with the red emergency card", () => {
-    expect(html).toContain(`href="${EXPLORE_EMERGENCY.href}"`);
-    expect(html).toContain(EXPLORE_EMERGENCY.detail);
-    expect(html).toContain("bg-danger-solid text-on-danger");
-    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
+    const page = html();
+    expect(page).toContain(`href="${EXPLORE_EMERGENCY.href}"`);
+    expect(page).toContain(EXPLORE_EMERGENCY.detail);
+    expect(page).toContain("bg-danger-solid text-on-danger");
+    expect(page).toContain(`d="${ICON_PATHS.phone}"`);
   });
 
   it("links every item with its icon", () => {
+    const page = html();
     for (const item of [
       ...EXPLORE_TRACK,
       ...EXPLORE_GUIDES,
       ...EXPLORE_SOOTHE,
       EXPLORE_REPORT,
     ]) {
-      expect(html).toContain(`href="${item.href}"`);
-      expect(html).toContain(`d="${ICON_PATHS[item.icon]}"`);
-      expect(html).toContain(`>${item.label}<`);
+      expect(page).toContain(`href="${item.href}"`);
+      expect(page).toContain(`d="${ICON_PATHS[item.icon]}"`);
+      expect(page).toContain(`>${item.label}<`);
     }
   });
 
   it("track cards are a two-column grid of glass cards with tinted icons", () => {
-    expect(html).toContain("grid grid-cols-2");
-    expect(html).toContain("bg-cat-sleep/15 text-cat-sleep");
-    expect(html).toContain("min-h-32");
+    const page = html();
+    expect(page).toContain("grid grid-cols-2");
+    expect(page).toContain("bg-cat-sleep/15 text-cat-sleep");
+    expect(page).toContain("min-h-32");
+  });
+});
+
+// Spec 2026-11-19 §9.
+describe("ExploreScreen: live Tăng trưởng and Tiêm chủng cards", () => {
+  it("reads the growth and the vaccine doses of this baby", () => {
+    useGrowth.mockClear();
+    useVaccineDoses.mockClear();
+    render();
+    expect(useGrowth).toHaveBeenCalledExactlyOnceWith("b1");
+    expect(useVaccineDoses).toHaveBeenCalledExactlyOnceWith("b1");
+  });
+
+  it.each([
+    ["loading", LOADING],
+    ["offline", OFFLINE],
+    ["after an error", FAILED],
+  ])("%s: the static descriptions, no skeleton and no error card", (_, q) => {
+    const page = render({ growth: q, doses: q });
+    for (const item of EXPLORE_TRACK)
+      expect(card(page, item.href)).toContain(`>${item.detail}</span>`);
+    expect(page).not.toContain("kb-pulse");
+    expect(page).not.toContain('role="alert"');
+    expect(page).not.toContain('role="status"');
+    expect(page).not.toContain("text-warn");
+  });
+
+  it("Tăng trưởng: the latest weight and its day, at most two lines", () => {
+    const page = render({
+      growth: loaded([
+        measure("2026-11-18", null),
+        measure("2026-11-15", 5500),
+        measure("2026-10-14", 4300),
+      ]),
+    });
+    expect(card(page, GROWTH.href)).toContain(
+      `<span class="${LIVE_LINE}">Cân nặng 5.500 g · 15/11</span>`,
+    );
+    expect(card(page, GROWTH.href)).not.toContain(GROWTH.detail);
+    expect(card(page, VACCINE.href)).toContain(`>${VACCINE.detail}</span>`);
+  });
+
+  it("Tăng trưởng: no weight yet keeps the static description", () => {
+    for (const rows of [[], [measure("2026-11-18", null)]])
+      expect(card(render({ growth: loaded(rows) }), GROWTH.href)).toContain(
+        `<span class="${LIVE_LINE}">${GROWTH.detail}</span>`,
+      );
+  });
+
+  it("Tiêm chủng overdue: Quá hạn and the dose name in warn, semibold", () => {
+    const page = render({ doses: loaded([]) });
+    expect(card(page, VACCINE.href)).toContain(
+      `<span class="${WARN_LINE}">Quá hạn: Lao (BCG)</span>`,
+    );
+    expect(page.match(/text-warn/g)).toHaveLength(1);
+    expect(card(page, GROWTH.href)).toContain(`>${GROWTH.detail}</span>`);
+  });
+
+  it("Tiêm chủng not overdue: the due day first, then the dose name", () => {
+    const page = render({
+      doses: loaded([done("bcg"), done("hexa"), done("pcv")]),
+    });
+    expect(card(page, VACCINE.href)).toContain(
+      `<span class="${LIVE_LINE}">14/06 · Sởi mũi 1</span>`,
+    );
+    expect(page).not.toContain("text-warn");
+  });
+
+  it("Tiêm chủng: passes over the doses of a group with no series chosen", () => {
+    const page = render({ doses: loaded([done("bcg")]) }, {});
+    expect(card(page, VACCINE.href)).toContain(">Quá hạn: Phế cầu mũi 1<");
+  });
+
+  it("Tiêm chủng: nothing left to do keeps the static description", () => {
+    const page = render({
+      doses: loaded(["bcg", "hexa", "pcv", "mmr"].map(done)),
+    });
+    expect(card(page, VACCINE.href)).toContain(
+      `<span class="${LIVE_LINE}">${VACCINE.detail}</span>`,
+    );
+  });
+
+  it("Thống kê and Phát triển stay as they were", () => {
+    const page = render({
+      growth: loaded([measure("2026-11-15", 5500)]),
+      doses: loaded([]),
+    });
+    for (const item of [STATS, MILESTONES])
+      expect(card(page, item.href)).toContain(
+        `<span class="${STATIC_LINE}">${item.detail}</span>`,
+      );
+    expect(page.match(/line-clamp-2/g)).toHaveLength(2);
   });
 });
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run components/explore/explore.test.tsx`
Expected: FAIL, `Tests  8 failed | 7 passed (15)`. Lý do đỏ: hook chưa được gọi với id của bé, chưa có `line-clamp-2`, chưa có dòng số liệu thật.

- [ ] **Step 3: Sửa code (Patch 4)**

```diff
diff --git a/app/kham-pha/page.tsx b/app/kham-pha/page.tsx
index 874c4f1..91bd463 100644
--- a/app/kham-pha/page.tsx
+++ b/app/kham-pha/page.tsx
@@ -4,5 +4,9 @@ import { AuthGate } from "@/components/AuthGate";
 import { ExploreScreen } from "@/components/explore/ExploreScreen";
 
 export default function Page() {
-  return <AuthGate need="baby">{() => <ExploreScreen />}</AuthGate>;
+  return (
+    <AuthGate need="baby">
+      {({ ctx }) => (ctx?.baby ? <ExploreScreen baby={ctx.baby} /> : null)}
+    </AuthGate>
+  );
 }
diff --git a/components/explore/ExploreScreen.tsx b/components/explore/ExploreScreen.tsx
index 9f5ca11..e41973f 100644
--- a/components/explore/ExploreScreen.tsx
+++ b/components/explore/ExploreScreen.tsx
@@ -1,7 +1,12 @@
+"use client";
+
 import Link from "next/link";
 import { Icon } from "@/components/ui/Icon";
 import { ListGroup, ListRow } from "@/components/ui/ListGroup";
 import { PageHeader } from "@/components/ui/PageHeader";
+import { VACCINES } from "@/lib/content/vaccines";
+import { useGrowth } from "@/lib/data/growth";
+import { useVaccineDoses } from "@/lib/data/vaccines";
 import {
   EXPLORE_EMERGENCY,
   EXPLORE_GUIDES,
@@ -9,6 +14,11 @@ import {
   EXPLORE_SOOTHE,
   EXPLORE_TRACK,
 } from "@/lib/nav";
+import { growthCardText, vaccineCardText } from "@/lib/rules/exploreCards";
+import { vnDateString } from "@/lib/rules/time";
+import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
+import { buildSchedule, nextDose } from "@/lib/rules/vaccines";
+import type { Baby } from "@/lib/supabase/rows";
 import type { CategoryToken } from "@/lib/ui/categories";
 import { cx } from "@/lib/ui/cx";
 
@@ -38,7 +48,53 @@ function SectionTitle({ children }: { children: string }) {
   return <h2 className="mx-1 text-xl font-bold text-ink">{children}</h2>;
 }
 
-export function ExploreScreen() {
+type LiveLine = { text: string | null; warn: boolean };
+
+// Spec 2026-11-19 §9: a card with a live line shows it in at most two lines
+// and falls back to the static description; the other cards stay as they were.
+function TrackDetail({ detail, live }: { detail?: string; live?: LiveLine }) {
+  if (!live)
+    return (
+      <span className="text-[13px] leading-[18px] text-muted">{detail}</span>
+    );
+  return (
+    <span
+      className={cx(
+        "line-clamp-2 text-[13px] leading-[18px]",
+        live.warn ? "font-semibold text-warn" : "text-muted",
+      )}
+    >
+      {live.text ?? detail}
+    </span>
+  );
+}
+
+export function ExploreScreen({ baby }: { baby: Baby }) {
+  const growth = useGrowth(baby.id);
+  const doses = useVaccineDoses(baby.id);
+  // No data yet (loading, offline, error) leaves the static descriptions.
+  const next = doses.data
+    ? nextDose(
+        buildSchedule({
+          doses: VACCINES.doses,
+          choices: parseChoices(baby.vaccine_choices),
+          dob: baby.dob,
+          records: toDoseRecords(doses.data),
+          today: vnDateString(new Date()),
+        }),
+      )
+    : null;
+  const live: Partial<Record<string, LiveLine>> = {
+    "/tang-truong": {
+      text: growth.data ? growthCardText(growth.data) : null,
+      warn: false,
+    },
+    "/tiem-chung": {
+      text: vaccineCardText(next),
+      warn: next?.state === "overdue",
+    },
+  };
+
   return (
     <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
       <PageHeader title="Khám phá" />
@@ -77,9 +133,7 @@ export function ExploreScreen() {
                 <Icon name={item.icon} size={18} strokeWidth={2.2} />
               </span>
               <span className="text-base font-bold">{item.label}</span>
-              <span className="text-[13px] leading-[18px] text-muted">
-                {item.detail}
-              </span>
+              <TrackDetail detail={item.detail} live={live[item.href]} />
             </Link>
           ))}
         </div>
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run components/explore/explore.test.tsx && bun run typecheck`
Expected: `Tests  15 passed (15)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add -- app/kham-pha/page.tsx components/explore/ExploreScreen.tsx components/explore/explore.test.tsx
git commit -m "feat(explore): show the latest weight and the next dose on Khám phá" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M5c và lên `main`

**Files:**

- Modify: `docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5c.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ của M5a, M5b và Task 1–2.
- Produces: `main` có M5c; các mốc sau cắt nhánh từ `main`.

- [ ] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  158 passed (158)`, `Tests  1094 passed (1094)`.

- [ ] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [ ] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không bấm Lưu, không đụng timer)**

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Dùng khung Browser của app ở cỡ 375×812. Đóng mọi sheet bằng phím Esc.

Mở `http://localhost:3000/kham-pha`.

1. Thẻ Tăng trưởng: dòng mô tả là "Cân nặng {gam} g · {dd/mm}" của lần cân mới nhất (nếu chưa có lần cân nào thì vẫn là mô tả cũ). Ghi lại nội dung đang thấy.
2. Thẻ Tiêm chủng: "Quá hạn: {tên mũi}" màu cảnh báo, đậm; hoặc "{dd/mm} · {tên mũi}" màu nhạt. Nội dung phải khớp với thẻ "cần làm trước" ở `/tiem-chung`. Ghi lại.
3. Hai dòng trên không quá 2 dòng. Chạy bằng javascript tool: `[...document.querySelectorAll("main a .line-clamp-2")].map((el) => [el.textContent, Math.round(el.getBoundingClientRect().height)])`. Kỳ vọng: mỗi chiều cao ≤ 36.
4. Thẻ Thống kê và Phát triển vẫn như cũ.
5. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
6. Lặp mục 1–2 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`: chữ đọc rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được thì ghi "chưa kiểm".

- [ ] **Step 4: Commit phần ghi kết quả, đưa lên `main`, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-19-kim-bun-ux-mobile-m5c.md
git commit -m "docs(plan): record the M5c check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git checkout main
git merge --ff-only feat/kim-bun-ux-mobile-m5c
git push origin main
```

Báo cáo cho người dùng: `git log --oneline 34f18f6..main`; kết quả typecheck, vitest, build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa.
