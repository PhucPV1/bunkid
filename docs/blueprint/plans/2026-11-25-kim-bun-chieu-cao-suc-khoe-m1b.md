# Kim Bun — Sức khỏe M1b: trang Sức khỏe và trang Tiện ích Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§3.4, §3.5, §4 dòng 2 và 3; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng: "Duyệt ba plan"; chưa có lệnh chạy, mỗi lần lên `main` vẫn phải hỏi)

**Goal:** Có trang Sức khỏe ở `/suc-khoe` (mở đầu bằng "Cần chú ý" khi có mũi tiêm quá hạn hoặc sắp tới) và trang Tiện ích ở `/tien-ich`, trong khi thanh tab vẫn còn 3 tab như cũ.

**Architecture:**

- **Chỉ thêm hai trang, chưa đổi thanh tab.** Sau plan này app vẫn có 3 tab và trang Khám phá vẫn chạy. Hai trang mới mở được bằng địa chỉ và làm sáng tab Khám phá. M1c mới đổi thanh tab và bỏ Khám phá.
- **`components/health/HealthScreen.tsx`** ghép các khối của M1a: `attentionItems`, `NavCard`, `ListRow`, `latestGrowth`. **`components/tools/ToolsScreen.tsx`** là một lưới `NavCard`.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m1b`, cắt từ `main` sau khi M1a đã lên (`main` lúc đó bằng `feat/kim-bun-suc-khoe-m1a`). Baseline: 1181 test vitest xanh (162 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                 | Plan                                           |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| M1a                | §3.6; danh mục của §3.4 và §3.5; luật của §4 dòng 2 và 3 | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1a.md` |
| **M1b (plan này)** | §3.4 trang Sức khỏe, §3.5 trang Tiện ích, §4 dòng 2 và 3 | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1b.md` |
| M1c                | §3.1, §3.2, §3.3: 4 tab, chuyển hướng, nút quay lại      | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1c.md` |
| M2                 | §5 Tăng trưởng, chip trên thẻ, dòng 1 của §4             | chưa viết                                      |
| M3                 | §6 Chiều cao                                             | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4           | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                             | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M1 chia ba plan.** Spec §10 ghi M1 là một mốc. Bản dựng thử cho thấy M1 dài quá một plan, nên cắt ở ba chỗ app vẫn chạy trọn vẹn: M1a thêm phần nền (màn hình chưa đổi), M1b thêm hai trang mới (thanh tab chưa đổi), M1c đổi thanh tab và bỏ Khám phá.
2. **Hàng "Cần chú ý" dùng `ListRow` hiện có** (ô icon 30 px bo góc, không phải vòng 36 px của §4); lý do ghi ở M1a, Diễn giải spec mục 2. **Đây là chỗ plan lệch spec có chủ ý; người dùng cần biết khi duyệt.**
3. **Thẻ Tăng trưởng ở M1 chưa có chip trạng thái và chưa có hàng mục tiêu** (§10 ghi rõ). M2 và M3 thêm vào.
4. **"Chưa tải xong"** được đọc là "query chưa có `data`". Khi đó không có dòng "Cần chú ý", thẻ Tiêm chủng giữ mô tả tĩnh, thẻ Tăng trưởng giữ mô tả tĩnh và không có 3 cột số.
5. **`/tien-ich`** bọc `AuthGate need="baby"` như mọi trang con khác, dù `ToolsScreen` không đọc dữ liệu của bé. **`vaccineCardText`** vẫn lấy từ `lib/rules/exploreCards.ts`.
6. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m1b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `573bdc4` và nối tiếp các plan trước của mốc M1; trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 3 dừng lại hỏi, không tự push.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Next.js.** `app/suc-khoe/page.tsx` và `app/tien-ich/page.tsx` theo đúng mẫu của `app/kham-pha/page.tsx` (hàm con của `AuthGate`); không dùng API nào của Next mà repo chưa dùng.

## Contracts with Other Plans

Plan này đứng ngay sau M1a. M1c đứng ngay sau và dùng hai trang dưới đây.

**Consumes (từ M1a, `2026-11-25-kim-bun-chieu-cao-suc-khoe-m1a.md`):**

- `lib/nav.ts`: `NavItem`, `HEALTH_EMERGENCY`, `HEALTH_GROWTH`, `HEALTH_CARDS`, `HEALTH_STATS`, `HEALTH_SICK`, `TOOLS`; `activeTab("/suc-khoe")` và `activeTab("/tien-ich")` trả `"explore"`.
- `lib/rules/attention.ts`: `attentionItems(input: { vaccine: ScheduleItem | null; today: string }): AttentionItem[]`.
- `lib/rules/growthForm.ts`: `latestGrowth(rows): LatestGrowth | null`, `type LatestGrowth`.
- `components/ui/NavCard.tsx`: `NavCard({ item, live?, short? })`, `type LiveLine`.
- `components/ui/ListGroup.tsx`: `ListRow` có `detailTone?: "muted" | "warn" | "danger"`.

Từ code đang có: `nextDose`, `buildSchedule` (`lib/rules/vaccines.ts`); `vaccineCardText` (`lib/rules/exploreCards.ts`); `parseChoices`, `toDoseRecords` (`lib/rules/vaccineForm.ts`); `formatGrowthValue`; `useGrowth`, `useVaccineDoses`.

**Produces:**

- `components/health/HealthScreen.tsx`: `HealthScreen({ baby }: { baby: Baby })`, client component.
- `components/tools/ToolsScreen.tsx`: `ToolsScreen()`.
- Trang `/suc-khoe` (mới) và `/tien-ich` (thôi chuyển hướng tới `/kham-pha`).
- **Vitest sau M1b:** 1203 test, 164 file.

---

### Task 1: Trang Sức khỏe (§3.4, §4)

**Files:**

- Create: `components/health/HealthScreen.tsx`, `app/suc-khoe/page.tsx`
- Test: `components/health/health.test.tsx` (mới)

**Interfaces:**

- Consumes: `HEALTH_*` (M1a); `attentionItems` (M1a); `NavCard`, `LiveLine`, `ListRow.detailTone`, `latestGrowth`, `LatestGrowth` (M1a); `vaccineCardText`; `nextDose`, `buildSchedule`; `parseChoices`, `toDoseRecords` (`lib/rules/vaccineForm.ts`); `formatGrowthValue`; `useGrowth`, `useVaccineDoses`.
- Produces: `HealthScreen({ baby }: { baby: Baby })`; trang `/suc-khoe`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m1b
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/health/health.test.tsx b/components/health/health.test.tsx
new file mode 100644
index 0000000..205e1d9
--- /dev/null
+++ b/components/health/health.test.tsx
@@ -0,0 +1,351 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
+import {
+  HEALTH_CARDS,
+  HEALTH_EMERGENCY,
+  HEALTH_GROWTH,
+  HEALTH_SICK,
+  HEALTH_STATS,
+  TOOLS,
+} from "@/lib/nav";
+import type { Baby, GrowthRow, VaccineDoseRow } from "@/lib/supabase/rows";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { HealthScreen } from "./HealthScreen";
+
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
+const [VACCINE, MILESTONES] = HEALTH_CARDS;
+const LINE = "line-clamp-2 text-[13px] leading-[18px]";
+
+const measure = (
+  measured_on: string,
+  weight_g: number | null,
+  length_cm: number | null = 58.5,
+) =>
+  ({
+    id: `g-${measured_on}`,
+    baby_id: "b1",
+    measured_on,
+    weight_g,
+    length_cm,
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
+  dob = "2026-09-14",
+) {
+  state.growth = (query.growth ?? LOADING) as Record<string, unknown>;
+  state.doses = (query.doses ?? LOADING) as Record<string, unknown>;
+  const baby = {
+    id: "b1",
+    family_id: "f1",
+    name: "Bun",
+    dob,
+    vaccine_choices: CHOSEN,
+  } as unknown as Baby;
+  return renderToStaticMarkup(<HealthScreen baby={baby} />);
+}
+
+// One link of the page: from its href to the end of the link.
+function link(html: string, href: string) {
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
+
+// Spec 2026-11-25 §3.4.
+describe("HealthScreen", () => {
+  it("has the large title, no back link, and the two sections in order", () => {
+    const page = render();
+    expect(page).toContain(">Sức khỏe</h1>");
+    expect(page).not.toContain(ICON_PATHS.chevronLeft);
+    const order = [
+      "Theo dõi",
+      "Tăng trưởng",
+      "Tiêm chủng",
+      "Phát triển",
+      "Thống kê",
+      "Khi bé ốm",
+      "Khẩn cấp",
+      "Triệu chứng",
+      "Bệnh thường gặp",
+      "Báo cáo cho bác sĩ",
+    ].map((t) => page.indexOf(`>${t}<`));
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+  });
+
+  it("links every item with its icon, and none of the Tiện ích pages", () => {
+    const page = render();
+    for (const item of [
+      HEALTH_GROWTH,
+      ...HEALTH_CARDS,
+      HEALTH_STATS,
+      ...HEALTH_SICK,
+    ]) {
+      expect(page).toContain(`href="${item.href}"`);
+      expect(page).toContain(`d="${ICON_PATHS[item.icon]}"`);
+    }
+    for (const item of TOOLS) expect(page).not.toContain(`href="${item.href}"`);
+  });
+
+  it("keeps the red emergency card", () => {
+    const page = render();
+    expect(link(page, HEALTH_EMERGENCY.href)).toContain(
+      HEALTH_EMERGENCY.detail,
+    );
+    expect(page).toContain("bg-danger-solid text-on-danger");
+    expect(page).toContain(`d="${ICON_PATHS.phone}"`);
+  });
+
+  it("reads the growth and the vaccine doses of this baby", () => {
+    useGrowth.mockClear();
+    useVaccineDoses.mockClear();
+    render();
+    expect(useGrowth).toHaveBeenCalledExactlyOnceWith("b1");
+    expect(useVaccineDoses).toHaveBeenCalledExactlyOnceWith("b1");
+  });
+});
+
+// Spec 2026-11-25 §4, rows 2 and 3.
+describe("HealthScreen: Cần chú ý", () => {
+  it.each([
+    ["loading", LOADING],
+    ["offline", OFFLINE],
+    ["after an error", FAILED],
+  ])("%s: the section is not drawn, and nothing pulses", (_, q) => {
+    const page = render({ growth: q, doses: q });
+    expect(page).not.toContain("Cần chú ý");
+    expect(page).not.toContain("kb-pulse");
+    expect(page).not.toContain('role="alert"');
+    expect(page).not.toContain("text-warn");
+  });
+
+  it("an overdue dose is the first block of the page, in warn", () => {
+    const page = render({ doses: loaded([]) });
+    expect(page.indexOf(">Cần chú ý<")).toBeGreaterThan(-1);
+    expect(page.indexOf(">Cần chú ý<")).toBeLessThan(
+      page.indexOf(">Theo dõi<"),
+    );
+    const row = link(page, "/tiem-chung");
+    expect(row).toContain(">Quá hạn: Lao (BCG)</span>");
+    expect(row).toContain(
+      '<span class="text-[13px] font-semibold text-warn">Hẹn 14/09</span>',
+    );
+    expect(row).toContain(`d="${ICON_PATHS.syringe}"`);
+  });
+
+  it("a dose due within 14 days is listed with the days left, not in warn", () => {
+    const page = render({ doses: loaded([done("bcg")]) }, "2026-09-28");
+    const row = link(page, "/tiem-chung");
+    expect(row).toContain(">6 trong 1 mũi 1</span>");
+    expect(row).toContain(
+      '<span class="text-[13px] text-muted">Hẹn 28/11 · còn 8 ngày</span>',
+    );
+    expect(page).not.toContain("text-warn");
+  });
+
+  it("a dose further away gives no section", () => {
+    const page = render({
+      doses: loaded([done("bcg"), done("hexa"), done("pcv")]),
+    });
+    expect(page).not.toContain("Cần chú ý");
+  });
+});
+
+describe("HealthScreen: the Tăng trưởng card", () => {
+  it.each([
+    ["loading", LOADING],
+    ["no measurement", loaded([])],
+  ])("%s: the static description and no values", (_, q) => {
+    const card = link(render({ growth: q }), HEALTH_GROWTH.href);
+    expect(card).toContain(`>${HEALTH_GROWTH.detail}</span>`);
+    expect(card).not.toContain("Cân nặng</span>");
+    expect(card).not.toContain("Đo gần nhất");
+  });
+
+  it("shows the day of the newest measurement and the newest value of each indicator", () => {
+    const card = link(
+      render({
+        growth: loaded([
+          measure("2026-11-18", null, 59),
+          measure("2026-11-15", 5500),
+        ]),
+      }),
+      HEALTH_GROWTH.href,
+    );
+    expect(card).toContain(">Đo gần nhất 18/11</span>");
+    expect(card).not.toContain(HEALTH_GROWTH.detail);
+    for (const [title, value] of [
+      ["Cân nặng", "5,5 kg"],
+      ["Chiều dài", "59 cm"],
+      ["Vòng đầu", "—"],
+    ])
+      expect(card).toContain(
+        `<span class="text-xs text-muted">${title}</span><span class="text-xl leading-[26px] font-bold tabular-nums">${value}</span>`,
+      );
+  });
+
+  it("has no status chip and no goal line yet", () => {
+    const card = link(
+      render({ growth: loaded([measure("2026-11-15", 5500)]) }),
+      HEALTH_GROWTH.href,
+    );
+    expect(card).not.toContain("Lớn đều");
+    expect(card).not.toContain("Mục tiêu");
+  });
+});
+
+describe("HealthScreen: the Tiêm chủng and Phát triển cards", () => {
+  it("are short cards in a two-column grid", () => {
+    const page = render();
+    expect(page).toContain("grid grid-cols-2 gap-2.5");
+    expect(page.match(/min-h-28/g)).toHaveLength(2);
+    expect(page).not.toContain("min-h-32");
+  });
+
+  it("Tiêm chủng overdue: Quá hạn and the dose name in warn", () => {
+    const card = link(
+      render({ doses: loaded([]) }).split(">Theo dõi<")[1],
+      VACCINE.href,
+    );
+    expect(card).toContain(
+      `<span class="${LINE} font-semibold text-warn">Quá hạn: Lao (BCG)</span>`,
+    );
+  });
+
+  it("Tiêm chủng not overdue: the due day first, then the dose name", () => {
+    const page = render({
+      doses: loaded([done("bcg"), done("hexa"), done("pcv")]),
+    });
+    expect(link(page, VACCINE.href)).toContain(
+      `<span class="${LINE} text-muted">14/06 · Sởi mũi 1</span>`,
+    );
+  });
+
+  it("Phát triển and Thống kê keep their descriptions", () => {
+    const page = render({ doses: loaded([]) });
+    expect(link(page, MILESTONES.href)).toContain(
+      `>${MILESTONES.detail}</span>`,
+    );
+    expect(link(page, HEALTH_STATS.href)).toContain(
+      `>${HEALTH_STATS.detail}</span>`,
+    );
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 162 passed (163)`, `Tests  1181 passed (1181)`. File test mới không chạy được test nào vì chưa có `./HealthScreen`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/app/suc-khoe/page.tsx b/app/suc-khoe/page.tsx
new file mode 100644
index 0000000..10c5024
--- /dev/null
+++ b/app/suc-khoe/page.tsx
@@ -0,0 +1,12 @@
+"use client";
+
+import { AuthGate } from "@/components/AuthGate";
+import { HealthScreen } from "@/components/health/HealthScreen";
+
+export default function Page() {
+  return (
+    <AuthGate need="baby">
+      {({ ctx }) => (ctx?.baby ? <HealthScreen baby={ctx.baby} /> : null)}
+    </AuthGate>
+  );
+}
diff --git a/components/health/HealthScreen.tsx b/components/health/HealthScreen.tsx
new file mode 100644
index 0000000..34fcc79
--- /dev/null
+++ b/components/health/HealthScreen.tsx
@@ -0,0 +1,199 @@
+"use client";
+
+import Link from "next/link";
+import { Icon } from "@/components/ui/Icon";
+import { ListGroup, ListRow } from "@/components/ui/ListGroup";
+import { type LiveLine, NavCard } from "@/components/ui/NavCard";
+import { PageHeader } from "@/components/ui/PageHeader";
+import { VACCINES } from "@/lib/content/vaccines";
+import { useGrowth } from "@/lib/data/growth";
+import { useVaccineDoses } from "@/lib/data/vaccines";
+import {
+  HEALTH_CARDS,
+  HEALTH_EMERGENCY,
+  HEALTH_GROWTH,
+  HEALTH_SICK,
+  HEALTH_STATS,
+} from "@/lib/nav";
+import { attentionItems } from "@/lib/rules/attention";
+import { formatDayShort } from "@/lib/rules/days";
+import { vaccineCardText } from "@/lib/rules/exploreCards";
+import {
+  formatGrowthValue,
+  type LatestGrowth,
+  latestGrowth,
+} from "@/lib/rules/growthForm";
+import { vnDateString } from "@/lib/rules/time";
+import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
+import { buildSchedule, nextDose } from "@/lib/rules/vaccines";
+import type { Baby } from "@/lib/supabase/rows";
+import { CATEGORY_CHIP } from "@/lib/ui/categories";
+import { cx } from "@/lib/ui/cx";
+
+function SectionTitle({ children }: { children: string }) {
+  return <h2 className="mx-1 text-xl font-bold text-ink">{children}</h2>;
+}
+
+// Spec 2026-11-25 §3.4: the newest value of each indicator, "—" when the
+// indicator was never measured.
+function growthCells(latest: LatestGrowth): [title: string, value: string][] {
+  return [
+    [
+      "Cân nặng",
+      latest.weightG === null
+        ? "—"
+        : formatGrowthValue("wfa", latest.weightG / 1000),
+    ],
+    [
+      "Chiều dài",
+      latest.lengthCm === null
+        ? "—"
+        : formatGrowthValue("lhfa", latest.lengthCm),
+    ],
+    [
+      "Vòng đầu",
+      latest.headCm === null ? "—" : formatGrowthValue("hcfa", latest.headCm),
+    ],
+  ];
+}
+
+function GrowthCard({ latest }: { latest: LatestGrowth | null }) {
+  return (
+    <Link
+      href={HEALTH_GROWTH.href}
+      className="glass flex flex-col gap-3.5 rounded-[26px] p-4 text-ink"
+    >
+      <span className="flex items-center gap-3">
+        <span
+          className={cx(
+            "flex size-9 shrink-0 items-center justify-center rounded-full",
+            CATEGORY_CHIP[HEALTH_GROWTH.color],
+          )}
+        >
+          <Icon name={HEALTH_GROWTH.icon} size={18} strokeWidth={2.2} />
+        </span>
+        <span className="flex min-w-0 flex-1 flex-col">
+          <span className="text-base font-bold">{HEALTH_GROWTH.label}</span>
+          <span className="text-[13px] leading-[18px] text-muted">
+            {latest
+              ? `Đo gần nhất ${formatDayShort(latest.measuredOn)}`
+              : HEALTH_GROWTH.detail}
+          </span>
+        </span>
+        <Icon name="chevronRight" size={18} className="text-muted" />
+      </span>
+      {latest && (
+        <span className="grid grid-cols-3 gap-2">
+          {growthCells(latest).map(([title, value]) => (
+            <span key={title} className="flex flex-col">
+              <span className="text-xs text-muted">{title}</span>
+              <span className="text-xl leading-[26px] font-bold tabular-nums">
+                {value}
+              </span>
+            </span>
+          ))}
+        </span>
+      )}
+    </Link>
+  );
+}
+
+export function HealthScreen({ baby }: { baby: Baby }) {
+  const growth = useGrowth(baby.id);
+  const doses = useVaccineDoses(baby.id);
+  const today = vnDateString(new Date());
+  // No data yet (loading, offline, error): no row and the static description.
+  const next = doses.data
+    ? nextDose(
+        buildSchedule({
+          doses: VACCINES.doses,
+          choices: parseChoices(baby.vaccine_choices),
+          dob: baby.dob,
+          records: toDoseRecords(doses.data),
+          today,
+        }),
+      )
+    : null;
+  const attention = attentionItems({ vaccine: next, today });
+  const live: Partial<Record<string, LiveLine>> = {
+    "/tiem-chung": {
+      text: vaccineCardText(next),
+      warn: next?.state === "overdue",
+    },
+  };
+
+  return (
+    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
+      <PageHeader title="Sức khỏe" />
+
+      {attention.length > 0 && (
+        <section className="flex flex-col gap-2.5">
+          <SectionTitle>Cần chú ý</SectionTitle>
+          <ListGroup>
+            {attention.map((item) => (
+              <ListRow
+                key={item.key}
+                label={item.title}
+                detail={item.detail}
+                detailTone={item.tone === "normal" ? "muted" : item.tone}
+                icon={item.icon}
+                iconColor={item.color}
+                href={item.href}
+              />
+            ))}
+          </ListGroup>
+        </section>
+      )}
+
+      <section className="flex flex-col gap-2.5">
+        <SectionTitle>Theo dõi</SectionTitle>
+        <GrowthCard latest={growth.data ? latestGrowth(growth.data) : null} />
+        <div className="grid grid-cols-2 gap-2.5">
+          {HEALTH_CARDS.map((item) => (
+            <NavCard key={item.href} item={item} live={live[item.href]} short />
+          ))}
+        </div>
+        <ListGroup>
+          <ListRow
+            label={HEALTH_STATS.label}
+            detail={HEALTH_STATS.detail}
+            icon={HEALTH_STATS.icon}
+            iconColor={HEALTH_STATS.color}
+            href={HEALTH_STATS.href}
+          />
+        </ListGroup>
+      </section>
+
+      <section className="flex flex-col gap-2.5">
+        <SectionTitle>Khi bé ốm</SectionTitle>
+        <Link
+          href={HEALTH_EMERGENCY.href}
+          className="flex items-center gap-3.5 rounded-[26px] border border-danger/30 bg-danger-soft/75 p-4 text-danger-ink backdrop-blur-xl"
+        >
+          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-danger-solid text-on-danger">
+            <Icon name="phone" size={22} />
+          </span>
+          <span className="flex flex-1 flex-col gap-0.5">
+            <span className="text-[17px] font-bold">
+              {HEALTH_EMERGENCY.label}
+            </span>
+            <span className="text-[13px]">{HEALTH_EMERGENCY.detail}</span>
+          </span>
+          <Icon name="chevronRight" size={18} />
+        </Link>
+        <ListGroup>
+          {HEALTH_SICK.map((item) => (
+            <ListRow
+              key={item.href}
+              label={item.label}
+              detail={item.detail}
+              icon={item.icon}
+              iconColor={item.color}
+              href={item.href}
+            />
+          ))}
+        </ListGroup>
+      </section>
+    </main>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  163 passed (163)`, `Tests  1199 passed (1199)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/health app/suc-khoe
git commit -m "feat(health): the Sức khỏe page at /suc-khoe" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Trang Tiện ích (§3.5)

**Files:**

- Create: `components/tools/ToolsScreen.tsx`
- Modify: `app/tien-ich/page.tsx` (thôi chuyển hướng)
- Test: `components/tools/tools.test.tsx` (mới)

**Interfaces:**

- Consumes: `TOOLS`, `HEALTH_CARDS`, `HEALTH_SICK` (M1a); `NavCard` (M1a).
- Produces: `ToolsScreen()`; trang `/tien-ich` vẽ `ToolsScreen`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/tools/tools.test.tsx b/components/tools/tools.test.tsx
new file mode 100644
index 0000000..82f1dfb
--- /dev/null
+++ b/components/tools/tools.test.tsx
@@ -0,0 +1,36 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import { HEALTH_CARDS, HEALTH_SICK, TOOLS } from "@/lib/nav";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { ToolsScreen } from "./ToolsScreen";
+
+// Spec 2026-11-25 §3.5.
+describe("ToolsScreen", () => {
+  const html = renderToStaticMarkup(<ToolsScreen />);
+
+  it("has the large title and no back link", () => {
+    expect(html).toContain(">Tiện ích</h1>");
+    expect(html).not.toContain(ICON_PATHS.chevronLeft);
+  });
+
+  it("is one two-column grid of four tall cards, in spec order", () => {
+    expect(html.match(/grid grid-cols-2 gap-2\.5/g)).toHaveLength(1);
+    expect(html.match(/min-h-32/g)).toHaveLength(4);
+    const order = TOOLS.map((item) => html.indexOf(`href="${item.href}"`));
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+  });
+
+  it("each card has its icon, name and description", () => {
+    for (const item of TOOLS) {
+      expect(html).toContain(`d="${ICON_PATHS[item.icon]}"`);
+      expect(html).toContain(`>${item.label}</span>`);
+      expect(html).toContain(`>${item.detail}</span>`);
+    }
+  });
+
+  it("links none of the Sức khỏe pages", () => {
+    for (const item of [...HEALTH_CARDS, ...HEALTH_SICK])
+      expect(html).not.toContain(`href="${item.href}"`);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 163 passed (164)`, `Tests  1199 passed (1199)`. File test mới không chạy được test nào vì chưa có `./ToolsScreen`.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/app/tien-ich/page.tsx b/app/tien-ich/page.tsx
index fe0a978..5047444 100644
--- a/app/tien-ich/page.tsx
+++ b/app/tien-ich/page.tsx
@@ -1,8 +1,8 @@
 "use client";

-import { RedirectTo } from "@/components/nav/RedirectTo";
+import { AuthGate } from "@/components/AuthGate";
+import { ToolsScreen } from "@/components/tools/ToolsScreen";

-// Spec §6.2: Cẩm nang and Tiện ích are now sections of Khám phá.
 export default function Page() {
-  return <RedirectTo href="/kham-pha" />;
+  return <AuthGate need="baby">{() => <ToolsScreen />}</AuthGate>;
 }
diff --git a/components/tools/ToolsScreen.tsx b/components/tools/ToolsScreen.tsx
new file mode 100644
index 0000000..83ead8c
--- /dev/null
+++ b/components/tools/ToolsScreen.tsx
@@ -0,0 +1,17 @@
+import { NavCard } from "@/components/ui/NavCard";
+import { PageHeader } from "@/components/ui/PageHeader";
+import { TOOLS } from "@/lib/nav";
+
+// Spec 2026-11-25 §3.5: the Tiện ích tab.
+export function ToolsScreen() {
+  return (
+    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
+      <PageHeader title="Tiện ích" />
+      <div className="grid grid-cols-2 gap-2.5">
+        {TOOLS.map((item) => (
+          <NavCard key={item.href} item={item} />
+        ))}
+      </div>
+    </main>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  164 passed (164)`, `Tests  1203 passed (1203)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/tools app/tien-ich/page.tsx
git commit -m "feat(tools): the Tiện ích page at /tien-ich" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M1b và hỏi người dùng trước khi lên `main`

**Files:**

- Modify: file plan này (ghi kết quả dưới Step 3)

**Interfaces:**

- Consumes: mọi thứ của Task 1–2 và của M1a.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  164 passed (164)`, `Tests  1203 passed (1203)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0. Danh sách trang có `/suc-khoe` và `/tien-ich`.

- [x] **Step 3: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 6). Chạy `bun run dev`. Cỡ 375×812.

Mở `http://localhost:3000/suc-khoe`:

1. Tiêu đề "Sức khỏe", không có nút quay lại. Tab Khám phá đang sáng.
2. Nếu bé có mũi tiêm quá hạn hoặc hẹn trong 14 ngày: khối "Cần chú ý" đứng đầu trang, một dòng, chữ khớp với thẻ "cần làm trước" ở `/tiem-chung`. Nếu không có: không có khối này. Ghi lại đang thấy trường hợp nào.
3. Thẻ Tăng trưởng: "Đo gần nhất {dd/mm}" và 3 cột số khớp với `/tang-truong`. Không cột nào bị cắt chữ hay xuống dòng.
4. Thẻ Tiêm chủng và Phát triển cao bằng nhau; hàng Thống kê; khối "Khi bé ốm" có thẻ Khẩn cấp và 3 hàng.
5. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
6. Lặp mục 1–4 ở `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: chữ đọc rõ.

Mở `http://localhost:3000/tien-ich`:

7. Tiêu đề "Tiện ích", 4 thẻ theo thứ tự Ồn trắng, Nhạc, Ảnh, Bồng bế, mỗi thẻ mở đúng trang.
8. Mô tả của 4 thẻ không quá 2 dòng: `[...document.querySelectorAll("main a .line-clamp-2")].map((el) => [el.textContent, Math.round(el.getBoundingClientRect().height)])`, mỗi chiều cao ≤ 36.

Mở `http://localhost:3000/kham-pha`: trang Khám phá vẫn như trước.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào dữ liệu thật không cho thấy được thì ghi "chưa kiểm".

**Kết quả (2026-11-25, nhánh `feat/kim-bun-suc-khoe-m1b` @ `86c98e3`):**

Step 1 và Step 2:

- `bun run typecheck`: `tsc --noEmit` thoát mã 0, không báo lỗi.
- `bunx vitest run`: `Test Files  164 passed (164)`, `Tests  1203 passed (1203)`.
- `bun run build`: lần đầu dừng với `SecurityFatalError` (cảnh báo bảo mật của Next.js 16.4.3), mã 1; chạy lại đúng lệnh đó thì `✓ Generating static pages using 9 workers (39/39)`, mã 0. Danh sách trang có `○ /suc-khoe` và `○ /tien-ich` (và `○ /kham-pha`). Không chạy `next upgrade`.

Step 3. Người dùng chọn khung Browser trong app (hỏi bằng thẻ câu hỏi) và tự đăng nhập lại ở đó vì phiên cũ đã hết hạn. Xem ở 375×812 trong một tab nền, dữ liệu thật của gia đình, theme đang lưu là `dark`. Chỉ xem và bấm liên kết điều hướng; không bấm Lưu, không đụng đồng hồ hay công tắc. `bun run dev` chạy được ngay lần đầu, đã dừng khi xong.

`/suc-khoe`:

1. **Đạt.** Tiêu đề lớn "Sức khỏe", không có nút quay lại. Tab Khám phá sáng (`aria-current="page"`).
2. **Đạt cho trường hợp "hẹn trong 14 ngày"; hai trường hợp còn lại chưa kiểm.** Hôm nay bé có mũi hẹn đúng ngày: khối "Cần chú ý" đứng đầu trang, một dòng "Prevenar 13 mũi 1" / "Hẹn hôm nay", chữ `text-muted`, mở `/tiem-chung`. Thẻ "cần làm trước" ở `/tiem-chung` ghi "SẮP TỚI · HÔM NAY", "Prevenar 13 mũi 1", "Hẹn Thứ Tư, 25/11/2026 · Dịch vụ": cùng mũi, cùng ngày. Thẻ Tiêm chủng ghi "25/11 · Prevenar 13 mũi 1". **Chưa kiểm:** hàng quá hạn (chữ warn "Quá hạn: …") và trường hợp không có khối "Cần chú ý", vì dữ liệu thật hôm nay không có; cũng chưa kiểm dạng "Hẹn dd/mm · còn N ngày". Ba dạng này mới chỉ có unit test.
3. **Đạt.** "Đo gần nhất 25/11"; Cân nặng "5,7 kg", Chiều dài "56,9 cm", Vòng đầu "—". `/tang-truong` ghi lần đo 25/11/2026: 5,7 kg và 56,9 cm, chưa có vòng đầu. Ba cột mỗi cột rộng 98 px, nhãn cao 16 px, số cao 26 px (một dòng), `scrollWidth` bằng `clientWidth`: không cắt chữ, không xuống dòng.
4. **Đạt.** Thẻ Tiêm chủng và Phát triển cùng 167×142 px; hàng Thống kê; khối "Khi bé ốm" có thẻ Khẩn cấp và 3 hàng Triệu chứng, Bệnh thường gặp, Báo cáo cho bác sĩ.
5. **Đạt.** `document.documentElement.scrollWidth <= window.innerWidth` là `true` (375 và 375).
6. **Đạt cho `rose`, `light`, `dark`, `night`**: xem cả nửa trên và nửa dưới trang ở từng theme, chữ đọc rõ, thẻ Khẩn cấp giữ màu đỏ. Ở `night`, ảnh chụp ngay sau khi cuộn bắt trúng lúc thanh tiêu đề thu gọn đang chuyển cảnh; chờ 2 giây thì thanh hiện đủ (hành vi của `PageHeader` có sẵn). **Chưa kiểm:** `peach`, `lavender`, `sea` (Step 3 không yêu cầu).

`/tien-ich` (chỉ xem ở theme `dark`):

7. **Đạt.** Tiêu đề lớn "Tiện ích", không có nút quay lại, tab Khám phá sáng. 4 thẻ theo thứ tự Ồn trắng, Nhạc, Ảnh, Bồng bế, mỗi thẻ 167×142 px. Bấm từng thẻ: mở `/on-trang` ("Tiếng ồn trắng"), `/nhac` ("Nhạc cho bé"), `/anh` ("Ảnh của bé"), `/bong-be` ("Bồng bế theo giai đoạn").
8. **Đạt.** Chiều cao mô tả: "Tiếng ồn đều giúp bé dễ ngủ" 36, "Danh sách nhạc cho bé" 36, "Ảnh của bé" 18, "Tư thế bế, ợ hơi, cho bú" 36. Không trang nào tràn ngang.

`/kham-pha`: **Đạt.** Trang vẽ đủ tiêu đề "Khám phá", thẻ Khẩn cấp, ba khối "Theo dõi", "Cẩm nang", "Dỗ bé và kỷ niệm" với 12 liên kết; không tràn ngang; console không có lỗi. M1b không sửa file nào của trang này. Không có ảnh chụp trước M1b trong phiên này để so từng điểm ảnh.

**Chưa kiểm ngoài các mục trên:** trạng thái đang tải, mất mạng, lỗi của `/suc-khoe`; thẻ Tăng trưởng khi chưa có lần đo nào; máy thật (iPhone, Safari). Không dựng trang fixture nào.

- [x] **Step 4: Commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m1b.md
git commit -m "docs(plan): record the M1b check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của Step 3 đã thấy tận mắt, mục nào chưa. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m1b
git push origin main
```
