# Kim Bun — Sức khỏe M3b: luật hiển thị và các thẻ của trang Chiều cao Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§6.3 mục 2 đến 5: chữ, số và thẻ; đường mục tiêu của biểu đồ; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng duyệt cả luật ẩn nhãn "Đường mục tiêu" nêu ở Diễn giải spec, mục 6)

**Goal:** Có sẵn mọi thứ trang Chiều cao sẽ hiện: luật tính chữ và số của bốn thẻ, bốn thẻ đó, và đường mục tiêu trên biểu đồ chiều dài. Chưa trang nào của app dùng chúng; chúng được xem trên một trang tạm.

**Architecture:**

- **Luật thuần:** `lib/rules/heightView.ts`. `heightView` nhận hồ sơ bé, các lần đo và bảng chiều dài WHO, trả về toàn bộ chữ và số của trang (thẻ mục tiêu, thẻ di truyền, đường tới mục tiêu, tốc độ tăng); `rangeBar` tính vị trí trên thanh di truyền. Các thẻ chỉ vẽ.
- **Khối giao diện:** `components/height/HeightCards.tsx` có bốn thẻ `HeightGoalCard`, `ParentalRangeCard`, `TargetPathCard`, `VelocityCard`. `GrowthChart` nhận thêm `target` (đường mục tiêu); có `target` thì bỏ đường giữa và ba nhãn vùng.
- Chưa có trang, sheet hay lối vào nào: đó là M3c. Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m3b`, cắt từ `main` @ `f2b5bcd` (đã có M3a; migration `20261125000100_height_goal.sql` đã ở DB thật). Baseline: 1431 test vitest xanh (174 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1, M2 | §3, §4 dòng 1 đến 3, §5 | đã xong, ở `main` |
| M3a | §6.1 dữ liệu, §6.2 luật, form của §6.5 | đã xong, ở `main` @ `f2b5bcd` |
| **M3b (plan này)** | §6.3: luật hiển thị, bốn thẻ, đường mục tiêu trên biểu đồ | file này |
| M3c | §6.3 trang Chiều cao (đầu trang, trạng thái tải, bé quá 5 tuổi, đoạn cuối), §6.5 sheet, §6.4 thẻ mục tiêu ở màn Tăng trưởng, hàng mục tiêu ở trang Sức khỏe (§3.4) | chưa viết |
| M4 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4 | chưa viết |
| M5 | §8 Push, dòng 4 của §4, §9.3 | chưa viết |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Chỗ cắt giữa M3b và M3c khác với dự tính ghi trong plan M3a.** Plan M3a ghi M3b là "trang Chiều cao và sheet". Bản dựng thử cho thấy riêng trang cùng bốn thẻ đã dài quá một plan, nên M3b chỉ gồm luật hiển thị và bốn thẻ, xem trên trang tạm; M3c ghép chúng thành trang, thêm sheet và lối vào. Cắt vậy có một cái lợi: người dùng xem được bốn thẻ với số liệu WHO thật trước khi trang được nối vào app, còn kịp bỏ bớt chữ.
2. **Với số đo thật của bé nhà mình** (56,9 cm lúc 2 tháng 15 ngày) và mục tiêu 180 cm, thẻ mục tiêu sẽ ghi "Dưới đường mục tiêu 4,0 cm" trong một chip nền xám. Đây là kết quả của luật ở §6.2, không phải lỗi; trường hợp `?c=0` của trang tạm cho thấy đúng cảnh này.
3. **Câu của thẻ mục tiêu** là `{Tên bé} dài {x} cm lúc {tuổi}. {câu trạng thái}.`, luôn dùng chữ "dài" (kể cả bé từ 2 tuổi), đúng như §6.3. Chưa có lần đo chiều dài thì thẻ chỉ ghi "Chưa có lần đo chiều dài."
4. **Trên thanh di truyền**, `mid` luôn viết 1 chữ số thập phân ("174,0"), hai đầu là số nguyên, đúng như §6.2. `aria-label` của thanh: `Khoảng dự kiến từ {low} đến {high} cm, giữa là {mid} cm, mục tiêu {t} cm.` (bỏ phần mục tiêu khi chưa có).
5. **Mục tiêu nằm ngoài thang** thì vạch ghim ở mép thang như §6.3 ghi; riêng nhãn "Mục tiêu {t}" (rộng tới khoảng 118 px với "Mục tiêu 190,5") được giữ trọn trong thẻ bằng `clamp(60px, …, calc(100% - 60px))`, nên ở hai mép nhãn lệch khỏi vạch tối đa 60 px.
6. **Biểu đồ của thẻ "Đường tới {t} cm"** là `GrowthChart` có thêm `target`: không vẽ đường giữa, không có ba chữ vùng; đường mục tiêu nét đứt màu `cat-sleep` dày 2 px; nhãn "Đường mục tiêu" cùng màu ở đầu phải của đường. Chấm của bé luôn màu `accent` và mang nhãn là số đo (thẻ này không nói về cảnh báo). **Một luật thêm vào spec sau lần đọc của reviewer; người dùng đã duyệt cùng plan này ngày 2026-11-25 (§6.3 mục 4 đã ghi, có đánh dấu):** nhãn "Đường mục tiêu" ẩn khi chấm mới nhất của bé nằm quá 60% bề ngang của trục. Nhãn rộng khoảng 85 px và kết thúc ở mép phải; với bé từ khoảng 8 tháng, chấm mới nhất luôn nằm trong vùng đó, và nếu bé đi sát đường thì nhãn đè lên chấm hoặc lên nhãn của chấm. Chú giải dưới biểu đồ vẫn gọi tên đường.
7. **Hình vẽ của biểu đồ không có unit test** (Recharts không vẽ gì khi dựng tĩnh, như plan M2d đã ghi). Phép tính nằm ở `heightView` (có test), khung quanh biểu đồ ở `TargetPathCard` (có test), còn hình vẽ được xem ở Task 3 trên trang tạm. **Nếu hình vẽ sai ở bước đó thì dừng và báo người dùng**, không tự sửa ngoài patch.
8. **`HeightGoalCard` nhận `onSet` tùy chọn.** Có `onSet` thì chủ gia đình thấy nút "Đặt mục tiêu"; M3c mới truyền nó (mở sheet). Trang tạm truyền một hàm rỗng để nhìn thấy nút.
9. **Bé quá 1856 ngày tuổi:** `heightView` trả `beyondTable: true`, `path` và `velocity` là null; dòng "Bảng WHO trong app tới 5 tuổi." do trang của M3c viết.
10. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề và nội dung thẻ cảnh báo, dòng chênh dưới thanh vị trí, các đoạn chú thích `text-muted`, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), các dòng dinh dưỡng.
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
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m3b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `f2b5bcd`. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang tạm của Task 3 đã qua `tsc --noEmit`, và các trường hợp có số đo của nó đã được chạy qua `heightView` với bảng WHO thật (chữ kỳ vọng ở bước trình duyệt lấy từ lần chạy đó). Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt, tức là chưa ai nhìn thấy bốn thẻ và đường mục tiêu trên màn hình.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn hoặc `var(--color-…)`. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 3 dừng lại hỏi, không tự push. Người dùng không muốn đẩy một thay đổi còn lỗi đã biết: nếu bước trình duyệt lộ ra lỗi thì nêu lỗi và cách sửa trước, rồi mới hỏi.
- **Người dùng muốn màn hình gọn.** Ở lần kiểm M2f họ đã cho bỏ các câu "… hơn {n} trong 100 bé …". Không thêm chữ nào ngoài plan; nếu người dùng muốn bỏ bớt chữ của một thẻ thì ghi lại yêu cầu và sửa theo, kèm test.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn).

## Contracts with Other Plans

Plan này đứng sau M3a (đã ở `main` @ `f2b5bcd`). M3c ghép mọi thứ dưới đây thành trang.

**Consumes (từ M3a):** `formatCm`, `midParental`, `ParentalRange`, `targetZ`, `targetCurve`, `goalStatus`, `GoalStatus`, `targetVsRange`, `lengthVelocity`, `LengthVelocity` (`lib/rules/heightGoal.ts`). **Từ các mốc trước:** `readings`, `GrowthMeasure` (`lib/rules/growthAlerts.ts`); `chartView`, `ChartView` (`lib/rules/growthView.ts`); `chartRange`, `formatGrowthValue`, `sexLabel` (`lib/rules/growthForm.ts`); `curve`, `CurvePoint` (`lib/rules/growth.ts`); `ageDays`, `formatAgeVi`; `formatDayShort`; `WHO_LAST_DAY`, `LmsRow`, `WhoSex`; `StatusChip` (tone `good`, `neutral`), `Button`, `GrowthChart`.

**Produces:**

- `lib/rules/heightView.ts`:
  - `RangeBar = { low: { at: number; text: string }; mid: { at; text }; high: { at; text }; target: { at: number; text: string } | null; label: string }` (`at` là vị trí 0–100 trên thanh), `rangeBar(range: ParentalRange, target: number | null): RangeBar`;
  - `HeightView = { goal: { target: string; chip: GoalStatus["chip"]; sentence: string } | null; parents: { line: string; bar: RangeBar; sentence: string } | null; path: { title: string; note: string; ariaLabel: string; to: number; band: CurvePoint[]; target: { day: number; value: number }[]; points: ChartView["points"]; last: ChartView["last"] } | null; velocity: { rate: string; line: string; chip: LengthVelocity["chip"] } | null; beyondTable: boolean }`;
  - `heightView(input: { baby: { name: string; dob: string; sex: WhoSex; father_height_cm: number | null; mother_height_cm: number | null; target_height_cm: number | null }; rows: GrowthMeasure[]; table: LmsRow[]; today: Date }): HeightView` (`table` là bảng chiều dài theo tuổi của giới tính đó).
- `components/height/HeightCards.tsx`: `HeightGoalCard({ goal: HeightView["goal"]; isOwner: boolean; onSet?: () => void })`, `ParentalRangeCard({ parents: HeightView["parents"] })`, `TargetPathCard({ title: string; babyName: string; note: string; children: ReactNode })`, `VelocityCard({ velocity: HeightView["velocity"] })`.
- `components/growth/GrowthChart.tsx`: prop tùy chọn `target?: { day: number; value: number }[]`; các prop khác không đổi.
- `lib/rules/growthView.ts`: `ChartLabelPlace` có thêm `targetCaption: boolean` (`day <= 0,6 × to`).
- **Vitest sau M3b:** 1471 test, 176 file.
- **Ghi chú cho M3c:** phải truyền `onSet` cho chủ gia đình, không thì nút "Đặt mục tiêu" của §6.3 mục 2 không bao giờ hiện; `heightView` cần bảng `lhfa` đã tải, nên trang của M3c lo trạng thái đang tải, chờ mạng và lỗi; `GrowthChart` phải tải lười bằng `dynamic(...)` như `GrowthScreen` đang làm.

---

### Task 1: Luật hiển thị của trang Chiều cao (§6.3)

**Files:**

- Create: `lib/rules/heightView.ts`
- Test: `lib/rules/heightView.test.ts` (mới)

**Interfaces:**

- Consumes: mọi tên ở mục Consumes của Contracts.
- Produces: `RangeBar`, `rangeBar`, `HeightView`, `heightView`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m3b
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/heightView.test.ts b/lib/rules/heightView.test.ts
new file mode 100644
index 0000000..5ef8007
--- /dev/null
+++ b/lib/rules/heightView.test.ts
@@ -0,0 +1,241 @@
+import { describe, expect, it } from "vitest";
+import type { LmsRow } from "@/lib/content/who";
+import { addDays } from "./days";
+import type { GrowthMeasure } from "./growthAlerts";
+import { heightView, rangeBar } from "./heightView";
+
+const DOB = "2026-01-01";
+// The baby is 76 days old "today".
+const TODAY = new Date(`${addDays(DOB, 76)}T05:00:00Z`);
+// L = 1, M = 16, S = 1/8 on every day: the length at z is 16 + 2z.
+const FLAT: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+  d,
+  1,
+  16,
+  0.125,
+]);
+// The median grows 1/8 cm a day from 50.
+const GROWING: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+  d,
+  1,
+  50 + d / 8,
+  0.1,
+]);
+const length = (age: number, cm: number): GrowthMeasure => ({
+  measured_on: addDays(DOB, age),
+  weight_g: null,
+  length_cm: cm,
+  head_cm: null,
+});
+const baby = (
+  over: Partial<Parameters<typeof heightView>[0]["baby"]> = {},
+): Parameters<typeof heightView>[0]["baby"] => ({
+  name: "Bun",
+  dob: DOB,
+  sex: "boys",
+  father_height_cm: 172,
+  mother_height_cm: 164,
+  target_height_cm: 180,
+  ...over,
+});
+const view = (
+  over: Partial<Parameters<typeof heightView>[0]["baby"]> = {},
+  rows: GrowthMeasure[] = [length(76, 17.5), length(40, 16.5)],
+  table: LmsRow[] = FLAT,
+  today: Date = TODAY,
+) => heightView({ baby: baby(over), rows, table, today });
+
+// Spec 2026-11-25 §6.3, item 3.
+describe("rangeBar", () => {
+  const range = { mid: 174.5, low: 166, high: 183 };
+
+  it("the scale runs from 6 cm under the range to 7 cm over it", () => {
+    const bar = rangeBar(range, 180);
+    expect(bar.low).toEqual({ at: 20, text: "166" });
+    expect(bar.high.text).toBe("183");
+    expect(bar.high.at).toBeCloseTo(76.667, 2);
+    expect(bar.mid.text).toBe("174,5");
+    expect(bar.mid.at).toBeCloseTo(48.333, 2);
+    expect(bar.target?.text).toBe("Mục tiêu 180");
+    expect(bar.target?.at).toBeCloseTo(66.667, 2);
+  });
+
+  it("the middle always carries one decimal", () => {
+    expect(rangeBar({ mid: 174, low: 166, high: 183 }, null).mid.text).toBe(
+      "174,0",
+    );
+  });
+
+  it("a target outside the scale is pinned to its end", () => {
+    expect(rangeBar(range, 150).target).toEqual({
+      at: 0,
+      text: "Mục tiêu 150",
+    });
+    expect(rangeBar(range, 200.5).target).toEqual({
+      at: 100,
+      text: "Mục tiêu 200,5",
+    });
+  });
+
+  it("names the three numbers and the target for a screen reader", () => {
+    expect(rangeBar(range, 180).label).toBe(
+      "Khoảng dự kiến từ 166 đến 183 cm, giữa là 174,5 cm, mục tiêu 180 cm.",
+    );
+    expect(rangeBar(range, null)).toMatchObject({
+      target: null,
+      label: "Khoảng dự kiến từ 166 đến 183 cm, giữa là 174,5 cm.",
+    });
+  });
+});
+
+describe("heightView: the goal card", () => {
+  it("the target, the status chip, and the newest length with the status in words", () => {
+    // 180 cm is z +0,47 for a man: the line is at 16,9. 17,5 is 0,6 above.
+    expect(view().goal).toEqual({
+      target: "180",
+      chip: { text: "Đang đúng hướng", tone: "good" },
+      sentence: "Bun dài 17,5 cm lúc 2 tháng 17 ngày. Sát đường mục tiêu.",
+    });
+  });
+
+  it("below the line: the neutral chip and how far", () => {
+    expect(view({}, [length(76, 15)]).goal).toEqual({
+      target: "180",
+      chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
+      sentence:
+        "Bun dài 15 cm lúc 2 tháng 17 ngày. Dưới đường mục tiêu 1,9 cm.",
+    });
+  });
+
+  it("no length yet: only the status, no chip", () => {
+    expect(view({}, []).goal).toEqual({
+      target: "180",
+      chip: null,
+      sentence: "Chưa có lần đo chiều dài.",
+    });
+  });
+
+  it("no target: no goal", () => {
+    expect(view({ target_height_cm: null }).goal).toBeNull();
+  });
+
+  it("a girl's target is read against the women's reference", () => {
+    // 163,2 cm is the median woman: the line is the median, 16.
+    expect(
+      view({ sex: "girls", target_height_cm: 163.2 }, [length(76, 17.5)]).goal
+        ?.sentence,
+    ).toBe("Bun dài 17,5 cm lúc 2 tháng 17 ngày. Trên đường mục tiêu 1,5 cm.");
+  });
+});
+
+describe("heightView: the parents' card", () => {
+  it("the parents' heights, the bar, the range and where the target sits in it", () => {
+    const { parents } = view();
+    expect(parents?.line).toBe("Bố 172 cm · Mẹ 164 cm");
+    expect(parents?.bar.low.text).toBe("166");
+    expect(parents?.bar.target?.text).toBe("Mục tiêu 180");
+    expect(parents?.sentence).toBe(
+      "Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.",
+    );
+  });
+
+  it("without a target: the range alone", () => {
+    const { parents } = view({ target_height_cm: null });
+    expect(parents?.bar.target).toBeNull();
+    expect(parents?.sentence).toBe("Khoảng dự kiến 166–183 cm.");
+  });
+
+  it("a girl's range sits 13 cm lower", () => {
+    expect(view({ sex: "girls" }).parents?.sentence).toContain("153–170 cm");
+  });
+
+  it("without both parents: no card content", () => {
+    expect(view({ father_height_cm: null }).parents).toBeNull();
+    expect(view({ mother_height_cm: null }).parents).toBeNull();
+  });
+});
+
+describe("heightView: the path to the target", () => {
+  it("the title, the band, the target line, the baby's lengths and the note", () => {
+    const { path } = view();
+    expect(path?.title).toBe("Đường tới 180 cm");
+    expect(path?.note).toBe(
+      "Đường mục tiêu là chiều dài ở từng tháng tuổi của một bé trai sẽ cao 180 cm khi lớn, nếu giữ nguyên vị trí trên biểu đồ WHO. Dưới 2 tuổi vị trí này còn thay đổi nhiều.",
+    );
+    // chartRange at 76 days: the first year, a point a week.
+    expect(path?.to).toBe(365);
+    expect(path?.band[0]).toEqual({ day: 0, low: 12, mid: 16, high: 20 });
+    expect(path?.band).toHaveLength(53);
+    expect(path?.target).toHaveLength(53);
+    expect(path?.target[0].value).toBeCloseTo(16.947, 2);
+    expect(path?.points).toEqual([
+      { day: 40, value: 16.5 },
+      { day: 76, value: 17.5 },
+    ]);
+    expect(path?.last).toEqual({
+      day: 76,
+      value: 17.5,
+      label: "17,5 cm",
+      tone: "accent",
+    });
+    expect(path?.ariaLabel).toBe("Đường tới 180 cm. 2 lần đo chiều dài.");
+  });
+
+  it("the note names the baby's sex", () => {
+    expect(view({ sex: "girls" }).path?.note).toContain("một bé gái sẽ cao");
+  });
+
+  it("no length yet: the line is still drawn", () => {
+    const { path } = view({}, []);
+    expect(path?.points).toEqual([]);
+    expect(path?.last).toBeNull();
+    expect(path?.ariaLabel).toBe("Đường tới 180 cm. Chưa có lần đo chiều dài.");
+  });
+
+  it("without a target there is no path", () => {
+    expect(view({ target_height_cm: null }).path).toBeNull();
+  });
+});
+
+describe("heightView: the speed card", () => {
+  it("cm a month, the two days compared, and what is usual", () => {
+    // 2 cm in 16 days on the growing table is exactly what is usual.
+    expect(
+      view({}, [length(56, 59), length(40, 57)], GROWING).velocity,
+    ).toEqual({
+      rate: "3,8 cm mỗi tháng",
+      line: "Từ 10/02 đến 26/02 · bé cùng tuổi thường tăng khoảng 3,8 cm mỗi tháng",
+      chip: { text: "Tăng tốt", tone: "good" },
+    });
+  });
+
+  it("is null without two lengths at least 14 days apart", () => {
+    expect(view({}, [length(76, 17.5)]).velocity).toBeNull();
+  });
+});
+
+describe("heightView: past the WHO table", () => {
+  const LATE = new Date(`${addDays(DOB, 1857)}T05:00:00Z`);
+
+  it("after day 1856 the path and the speed give way", () => {
+    const late = view({}, [length(1800, 17.5), length(1700, 16.5)], FLAT, LATE);
+    expect(late.beyondTable).toBe(true);
+    expect(late.path).toBeNull();
+    expect(late.velocity).toBeNull();
+    // The goal and the parents' range are still shown.
+    expect(late.goal?.target).toBe("180");
+    expect(late.parents).not.toBeNull();
+  });
+
+  it("on day 1856 nothing gives way yet", () => {
+    const edge = view(
+      {},
+      [length(1800, 17.5), length(1700, 16.5)],
+      FLAT,
+      new Date(`${addDays(DOB, 1856)}T05:00:00Z`),
+    );
+    expect(edge.beyondTable).toBe(false);
+    expect(edge.path).not.toBeNull();
+    expect(edge.velocity).not.toBeNull();
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 174 passed (175)`, `Tests  1431 passed (1431)`. File test mới không chạy được test nào vì chưa có `./heightView`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/rules/heightView.ts b/lib/rules/heightView.ts
new file mode 100644
index 0000000..06c3009
--- /dev/null
+++ b/lib/rules/heightView.ts
@@ -0,0 +1,184 @@
+import { type LmsRow, WHO_LAST_DAY, type WhoSex } from "@/lib/content/who";
+import { formatDayShort } from "./days";
+import { curve, type CurvePoint } from "./growth";
+import { type GrowthMeasure, readings } from "./growthAlerts";
+import { chartRange, formatGrowthValue, sexLabel } from "./growthForm";
+import { type ChartView, chartView } from "./growthView";
+import {
+  formatCm,
+  type GoalStatus,
+  goalStatus,
+  type LengthVelocity,
+  lengthVelocity,
+  midParental,
+  type ParentalRange,
+  targetCurve,
+  targetVsRange,
+  targetZ,
+} from "./heightGoal";
+import { ageDays, formatAgeVi } from "./time";
+
+const oneDecimal = new Intl.NumberFormat("vi-VN", {
+  minimumFractionDigits: 1,
+  maximumFractionDigits: 1,
+});
+
+// Spec 2026-11-25 §6.3, item 3: the bar of the card "Di truyền dự kiến".
+// `at` is a position along the bar, 0–100.
+export type RangeBar = {
+  low: { at: number; text: string };
+  mid: { at: number; text: string };
+  high: { at: number; text: string };
+  // Null without a target. Outside the scale it is pinned to the end.
+  target: { at: number; text: string } | null;
+  // What the bar says to a screen reader.
+  label: string;
+};
+
+// The scale leaves room either side of the range.
+const SCALE_UNDER = 6;
+const SCALE_OVER = 7;
+
+export function rangeBar(
+  range: ParentalRange,
+  target: number | null,
+): RangeBar {
+  const from = range.low - SCALE_UNDER;
+  const span = range.high + SCALE_OVER - from;
+  const at = (cm: number) => Math.min(1, Math.max(0, (cm - from) / span)) * 100;
+  const mid = oneDecimal.format(range.mid);
+  return {
+    low: { at: at(range.low), text: String(range.low) },
+    mid: { at: at(range.mid), text: mid },
+    high: { at: at(range.high), text: String(range.high) },
+    target:
+      target === null
+        ? null
+        : { at: at(target), text: `Mục tiêu ${formatCm(target)}` },
+    label: `Khoảng dự kiến từ ${range.low} đến ${range.high} cm, giữa là ${mid} cm${
+      target === null ? "" : `, mục tiêu ${formatCm(target)} cm`
+    }.`,
+  };
+}
+
+// Spec 2026-11-25 §6.3: everything the Chiều cao page writes, worked out from
+// the profile, the measurements and the WHO length table of the baby's sex.
+export type HeightView = {
+  // Item 2. Null without a target.
+  goal: {
+    target: string;
+    chip: GoalStatus["chip"];
+    // "{Tên bé} dài {x} cm lúc {tuổi}. {trạng thái}."
+    sentence: string;
+  } | null;
+  // Item 3. Null until both parents' heights are entered.
+  parents: { line: string; bar: RangeBar; sentence: string } | null;
+  // Item 4. Null without a target, and past the WHO table.
+  path: {
+    title: string;
+    note: string;
+    ariaLabel: string;
+    to: number;
+    band: CurvePoint[];
+    target: { day: number; value: number }[];
+    points: ChartView["points"];
+    last: ChartView["last"];
+  } | null;
+  // Item 5. Null without two lengths far enough apart, and past the WHO table.
+  velocity: {
+    rate: string;
+    line: string;
+    chip: LengthVelocity["chip"];
+  } | null;
+  // The baby is older than the WHO table: items 4 and 5 give way to one line.
+  beyondTable: boolean;
+};
+
+export function heightView(input: {
+  baby: {
+    name: string;
+    dob: string;
+    sex: WhoSex;
+    father_height_cm: number | null;
+    mother_height_cm: number | null;
+    target_height_cm: number | null;
+  };
+  rows: GrowthMeasure[];
+  // Length-for-age of the baby's sex.
+  table: LmsRow[];
+  today: Date;
+}): HeightView {
+  const { baby, rows, table } = input;
+  const target = baby.target_height_cm;
+  const ageNow = ageDays(baby.dob, input.today);
+  const beyondTable = ageNow > WHO_LAST_DAY;
+  const z = target === null ? null : targetZ(target, baby.sex);
+
+  let goal: HeightView["goal"] = null;
+  if (target !== null && z !== null) {
+    const [reading] = readings(rows, table, baby.dob, "lhfa");
+    const status = goalStatus({ reading: reading ?? null, z, table });
+    goal = {
+      target: formatCm(target),
+      chip: status.chip,
+      sentence: reading
+        ? `${baby.name} dài ${formatGrowthValue("lhfa", reading.value)} lúc ${formatAgeVi(baby.dob, new Date(`${reading.day}T05:00:00Z`))}. ${status.text}.`
+        : `${status.text}.`,
+    };
+  }
+
+  let parents: HeightView["parents"] = null;
+  if (baby.father_height_cm !== null && baby.mother_height_cm !== null) {
+    const range = midParental(
+      baby.father_height_cm,
+      baby.mother_height_cm,
+      baby.sex,
+    );
+    const span = `Khoảng dự kiến ${range.low}–${range.high} cm.`;
+    parents = {
+      line: `Bố ${formatCm(baby.father_height_cm)} cm · Mẹ ${formatCm(baby.mother_height_cm)} cm`,
+      bar: rangeBar(range, target),
+      sentence:
+        target === null ? span : `${span} ${targetVsRange(target, range)}`,
+    };
+  }
+
+  let path: HeightView["path"] = null;
+  if (target !== null && z !== null && !beyondTable) {
+    const range = chartRange(ageNow);
+    const chart = chartView({
+      indicator: "lhfa",
+      rows,
+      dob: baby.dob,
+      alerts: [],
+      summaries: [],
+    });
+    const title = `Đường tới ${formatCm(target)} cm`;
+    path = {
+      title,
+      note: `Đường mục tiêu là chiều dài ở từng tháng tuổi của một ${sexLabel(baby.sex)} sẽ cao ${formatCm(target)} cm khi lớn, nếu giữ nguyên vị trí trên biểu đồ WHO. Dưới 2 tuổi vị trí này còn thay đổi nhiều.`,
+      ariaLabel:
+        chart.points.length === 0
+          ? `${title}. Chưa có lần đo chiều dài.`
+          : `${title}. ${chart.points.length} lần đo chiều dài.`,
+      to: range.to,
+      band: curve(table, 0, range.to, range.step),
+      target: targetCurve(table, z, range.to, range.step),
+      points: chart.points,
+      last: chart.last,
+    };
+  }
+
+  const speed = beyondTable ? null : lengthVelocity(rows, table, baby.dob);
+  return {
+    goal,
+    parents,
+    path,
+    velocity: speed && {
+      rate: `${speed.rate} cm mỗi tháng`,
+      line: `Từ ${formatDayShort(speed.from)} đến ${formatDayShort(speed.to)} · bé cùng tuổi thường tăng khoảng ${speed.expected} cm mỗi tháng`,
+      chip: speed.chip,
+    },
+    beyondTable,
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  175 passed (175)`, `Tests  1452 passed (1452)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/heightView.ts lib/rules/heightView.test.ts
git commit -m "feat(height): what the Chiều cao page shows" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Bốn thẻ của trang Chiều cao và đường mục tiêu trên biểu đồ (§6.3 mục 2 đến 5)

**Files:**

- Create: `components/height/HeightCards.tsx`
- Modify: `components/growth/GrowthChart.tsx`, `lib/rules/growthView.ts`
- Test: `components/height/heightcards.test.tsx` (mới), `components/growth/growthparts.test.tsx`, `lib/rules/growthView.test.ts`

**Interfaces:**

- Consumes: `HeightView`, `rangeBar` (Task 1); `StatusChip`, `Button`; `GrowthChart` và `chartLabelPlace` hiện có.
- Produces: `HeightGoalCard`, `ParentalRangeCard`, `TargetPathCard`, `VelocityCard`; prop `target` của `GrowthChart`; `ChartLabelPlace.targetCaption`. Hình vẽ trong `GrowthChart.tsx` không có unit test (Diễn giải spec, mục 7), chỉ hai chữ vùng nằm ngoài khung vẽ là test được; phần còn lại xem ở Task 3.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/growth/growthparts.test.tsx b/components/growth/growthparts.test.tsx
index e69e672..fa3ae72 100644
--- a/components/growth/growthparts.test.tsx
+++ b/components/growth/growthparts.test.tsx
@@ -5,6 +5,7 @@ import type { GrowthAlert } from "@/lib/rules/growthAlerts";
 import type { IndicatorSummary, VerdictHead } from "@/lib/rules/growthView";
 import { ICON_PATHS } from "@/lib/ui/icons";
 import { GrowthAlertCard } from "./GrowthAlertCard";
+import { GrowthChart } from "./GrowthChart";
 import { GrowthChartCard } from "./GrowthChartCard";
 import { GrowthVerdict } from "./GrowthVerdict";
 import {
@@ -311,6 +312,39 @@ describe("GrowthVerdict", () => {
   });
 });
 
+// The plot itself is not drawn in a static render; the two captions outside
+// it are, and they tell the two uses of the chart apart.
+describe("GrowthChart", () => {
+  const chart = (target?: { day: number; value: number }[]) =>
+    renderToStaticMarkup(
+      <GrowthChart
+        band={[{ day: 0, low: 46, mid: 50, high: 54 }]}
+        points={[]}
+        last={null}
+        to={365}
+        unit="cm"
+        label="Chiều dài theo tháng tuổi. Chưa có lần đo."
+        target={target}
+      />,
+    );
+
+  it("on the growth page: named for a screen reader, with the captions of the zones", () => {
+    const html = chart();
+    expect(html).toContain(
+      'role="img" aria-label="Chiều dài theo tháng tuổi. Chưa có lần đo."',
+    );
+    expect(html).toContain("Cao hơn chuẩn");
+    expect(html).toContain("Thấp hơn chuẩn");
+  });
+
+  // Spec 2026-11-25 §6.3, item 4.
+  it("with a target line: the captions of the zones are gone", () => {
+    const html = chart([{ day: 0, value: 51 }]);
+    expect(html).not.toContain("Cao hơn chuẩn");
+    expect(html).not.toContain("Thấp hơn chuẩn");
+  });
+});
+
 describe("GrowthAlertCard", () => {
   it("yellow: warn colours, the alert icon, title, body, bold advice", () => {
     const html = renderToStaticMarkup(
diff --git a/components/height/heightcards.test.tsx b/components/height/heightcards.test.tsx
new file mode 100644
index 0000000..9cf420e
--- /dev/null
+++ b/components/height/heightcards.test.tsx
@@ -0,0 +1,243 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import { rangeBar, type HeightView } from "@/lib/rules/heightView";
+import {
+  HeightGoalCard,
+  ParentalRangeCard,
+  TargetPathCard,
+  VelocityCard,
+} from "./HeightCards";
+
+const CHIP = "font-semibold whitespace-nowrap";
+
+// Spec 2026-11-25 §6.3, item 2.
+describe("HeightGoalCard", () => {
+  const goal: NonNullable<HeightView["goal"]> = {
+    target: "180",
+    chip: { text: "Đang đúng hướng", tone: "good" },
+    sentence: "Bun dài 61,5 cm lúc 2 tháng 15 ngày. Sát đường mục tiêu.",
+  };
+
+  it("the label, the status chip, the target in large figures and the sentence", () => {
+    const html = renderToStaticMarkup(<HeightGoalCard goal={goal} isOwner />);
+    expect(html).toContain(">Mục tiêu lúc trưởng thành</span>");
+    expect(html).toContain("uppercase");
+    expect(html).toContain(
+      `${CHIP} bg-good-soft text-good-ink">Đang đúng hướng</span>`,
+    );
+    expect(html).toContain(
+      '<span class="text-[44px] leading-[48px] font-bold tracking-[-0.02em] text-ink tabular-nums">180</span>',
+    );
+    expect(html).toContain(">cm</span>");
+    expect(html).toContain(
+      ">Bun dài 61,5 cm lúc 2 tháng 15 ngày. Sát đường mục tiêu.</p>",
+    );
+  });
+
+  it("below the line is said in a neutral chip, never in warn or danger", () => {
+    const html = renderToStaticMarkup(
+      <HeightGoalCard
+        goal={{
+          ...goal,
+          chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
+        }}
+        isOwner
+      />,
+    );
+    expect(html).toContain(
+      `${CHIP} bg-line text-ink">Dưới đường mục tiêu</span>`,
+    );
+    expect(html).not.toMatch(/warn|danger/);
+  });
+
+  it("no length yet: no chip", () => {
+    const html = renderToStaticMarkup(
+      <HeightGoalCard
+        goal={{ ...goal, chip: null, sentence: "Chưa có lần đo chiều dài." }}
+        isOwner
+      />,
+    );
+    expect(html).not.toContain(CHIP);
+    expect(html).toContain(">Chưa có lần đo chiều dài.</p>");
+  });
+
+  it("no goal, the owner: says so and offers to set one", () => {
+    const onSet = vi.fn();
+    const card = HeightGoalCard({ goal: null, isOwner: true, onSet });
+    const html = renderToStaticMarkup(card);
+    expect(html).toContain(">Chưa có mục tiêu chiều cao</p>");
+    expect(html).toContain(">Đặt mục tiêu</button>");
+    expect(html).not.toContain("Chủ gia đình");
+    const [button] = findElements(card, (el) => el.props.onClick === onSet);
+    expect(button).toBeDefined();
+  });
+
+  it("no goal, the owner, before the sheet exists: no button", () => {
+    const html = renderToStaticMarkup(<HeightGoalCard goal={null} isOwner />);
+    expect(html).toContain(">Chưa có mục tiêu chiều cao</p>");
+    expect(html).not.toContain("<button");
+  });
+
+  it("no goal, another member: told that the owner has not set one", () => {
+    const html = renderToStaticMarkup(
+      <HeightGoalCard goal={null} isOwner={false} onSet={() => {}} />,
+    );
+    expect(html).toContain(">Chủ gia đình chưa đặt mục tiêu chiều cao.</p>");
+    expect(html).not.toContain("<button");
+  });
+});
+
+// Item 3.
+describe("ParentalRangeCard", () => {
+  const range = { mid: 174.5, low: 166, high: 183 };
+  const parents = (
+    target: number | null,
+  ): NonNullable<HeightView["parents"]> => ({
+    line: "Bố 172 cm · Mẹ 164 cm",
+    bar: rangeBar(range, target),
+    sentence:
+      target === null
+        ? "Khoảng dự kiến 166–183 cm."
+        : "Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.",
+  });
+
+  it("the parents' heights, the bar with its three numbers and the target, the two sentences", () => {
+    const html = renderToStaticMarkup(
+      <ParentalRangeCard parents={parents(180)} />,
+    );
+    expect(html).toContain(">Di truyền dự kiến</h2>");
+    expect(html).toContain(">Bố 172 cm · Mẹ 164 cm</span>");
+    expect(html).toContain(
+      'role="img" aria-label="Khoảng dự kiến từ 166 đến 183 cm, giữa là 174,5 cm, mục tiêu 180 cm."',
+    );
+    for (const text of ["166", "174,5", "183", "Mục tiêu 180"])
+      expect(html).toContain(`>${text}</span>`);
+    expect(html).toContain(
+      ">Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.</p>",
+    );
+    expect(html).toContain(
+      ">Tính từ chiều cao bố mẹ. Đây là ước lượng, phần lớn trẻ nằm trong khoảng này.</p>",
+    );
+  });
+
+  it("the range is a good-coloured stretch from its low end to its high end, the middle a mark", () => {
+    const html = renderToStaticMarkup(
+      <ParentalRangeCard parents={parents(180)} />,
+    );
+    expect(html).toMatch(
+      /class="absolute top-9 h-3 rounded-full bg-good\/35" style="left:20%;width:56\.66666666666\d*%"/,
+    );
+    expect(html).toMatch(/bg-good" style="left:48\.3333333333\d*%"/);
+  });
+
+  it("the target is an accent mark with its label, kept inside the card at either end", () => {
+    const html = renderToStaticMarkup(
+      <ParentalRangeCard parents={parents(200)} />,
+    );
+    expect(html).toContain(">Mục tiêu 200</span>");
+    expect(html).toContain("bg-accent");
+    expect(html).toContain('style="left:clamp(60px, 100%, calc(100% - 60px))"');
+  });
+
+  it("without a target: no accent mark and no label", () => {
+    const html = renderToStaticMarkup(
+      <ParentalRangeCard parents={parents(null)} />,
+    );
+    expect(html).not.toContain("Mục tiêu");
+    expect(html).not.toContain("bg-accent");
+  });
+
+  it("before the parents' heights are entered: one line asking for them", () => {
+    const html = renderToStaticMarkup(<ParentalRangeCard parents={null} />);
+    expect(html).toContain(">Di truyền dự kiến</h2>");
+    expect(html).toContain(">Nhập chiều cao bố mẹ để xem khoảng dự kiến.</p>");
+    expect(html).not.toContain('role="img"');
+    expect(html).not.toContain("Tính từ chiều cao bố mẹ");
+  });
+});
+
+// Item 4.
+describe("TargetPathCard", () => {
+  const html = renderToStaticMarkup(
+    <TargetPathCard
+      title="Đường tới 180 cm"
+      babyName="Bun"
+      note="Đường mục tiêu là chiều dài ở từng tháng tuổi của một bé trai sẽ cao 180 cm khi lớn."
+    >
+      <div data-chart="" />
+    </TargetPathCard>,
+  );
+
+  it("the title, the chart and the note", () => {
+    expect(html).toContain(">Đường tới 180 cm</h2>");
+    expect(html).toContain('<div data-chart=""></div>');
+    expect(html).toContain(
+      ">Đường mục tiêu là chiều dài ở từng tháng tuổi của một bé trai sẽ cao 180 cm khi lớn.</p>",
+    );
+    expect(html.indexOf("data-chart")).toBeGreaterThan(html.indexOf("</h2>"));
+  });
+
+  it("a legend of three: the baby, the target line in the sleep colour, the normal band; no median", () => {
+    expect(html).toContain(
+      '<span class="size-2.5 rounded-full bg-accent"></span>Bun',
+    );
+    expect(html).toContain(
+      '<span class="w-4 border-t-2 border-dashed border-cat-sleep"></span>Đường mục tiêu',
+    );
+    expect(html).toContain(
+      '<span class="h-2.5 w-3.5 rounded-[3px] bg-good/25"></span>Vùng bình thường',
+    );
+    expect(html).not.toContain("Mức giữa");
+  });
+});
+
+// Item 5.
+describe("VelocityCard", () => {
+  it("the label, the chip, the speed and the line under it", () => {
+    const html = renderToStaticMarkup(
+      <VelocityCard
+        velocity={{
+          rate: "4,2 cm mỗi tháng",
+          line: "Từ 10/10 đến 25/11 · bé cùng tuổi thường tăng khoảng 3,6 cm mỗi tháng",
+          chip: { text: "Tăng tốt", tone: "good" },
+        }}
+      />,
+    );
+    expect(html).toContain(">Tốc độ tăng</span>");
+    expect(html).toContain(
+      `${CHIP} bg-good-soft text-good-ink">Tăng tốt</span>`,
+    );
+    expect(html).toContain(
+      '<span class="text-xl leading-[26px] font-bold text-ink tabular-nums">4,2 cm mỗi tháng</span>',
+    );
+    expect(html).toContain(
+      ">Từ 10/10 đến 25/11 · bé cùng tuổi thường tăng khoảng 3,6 cm mỗi tháng</span>",
+    );
+  });
+
+  it("slower than usual is a neutral chip", () => {
+    const html = renderToStaticMarkup(
+      <VelocityCard
+        velocity={{
+          rate: "2,7 cm mỗi tháng",
+          line: "Từ 10/02 đến 26/02 · bé cùng tuổi thường tăng khoảng 3,8 cm mỗi tháng",
+          chip: { text: "Chậm hơn thường gặp", tone: "neutral" },
+        }}
+      />,
+    );
+    expect(html).toContain(
+      `${CHIP} bg-line text-ink">Chậm hơn thường gặp</span>`,
+    );
+    expect(html).not.toMatch(/warn|danger/);
+  });
+
+  it("without two lengths far enough apart: says what is needed", () => {
+    const html = renderToStaticMarkup(<VelocityCard velocity={null} />);
+    expect(html).toContain(">Tốc độ tăng</span>");
+    expect(html).toContain(
+      ">Cần hai lần đo chiều dài cách nhau từ 14 ngày.</p>",
+    );
+    expect(html).not.toContain(CHIP);
+  });
+});
diff --git a/lib/rules/growthView.test.ts b/lib/rules/growthView.test.ts
index e088975..2a1ac70 100644
--- a/lib/rules/growthView.test.ts
+++ b/lib/rules/growthView.test.ts
@@ -278,9 +278,7 @@ describe("indicatorSummaries: near the edge of the norm", () => {
       mid: "giữa 16,0",
       high: "20,0 kg",
     });
-    expect(weight.barLabel).toBe(
-      "Thấp. Chuẩn từ 12,0 đến 20,0 kg, giữa 16,0.",
-    );
+    expect(weight.barLabel).toBe("Thấp. Chuẩn từ 12,0 đến 20,0 kg, giữa 16,0.");
   });
 
   it("the norm is read on the day of the newest measurement of that indicator", () => {
@@ -441,6 +439,16 @@ describe("chartLabelPlace", () => {
     expect(place(76, true, 1).normalCaption).toBe(true);
   });
 
+  // Spec 2026-11-25 §6.3, item 4: the chart of the Chiều cao page.
+  it("the caption of the target line makes way once the point is past 60% of the axis", () => {
+    // The caption ends at the right edge and is about 85 px wide; the newest
+    // point of an older baby sits right under it.
+    expect(place(219, false, 1).targetCaption).toBe(true);
+    expect(place(220, false, 1).targetCaption).toBe(false);
+    expect(place(76, false, 1).targetCaption).toBe(true);
+    expect(place(1700, false, 1, 1770).targetCaption).toBe(false);
+  });
+
   it("the caption above the band makes way for an alert label that runs left above its point", () => {
     expect(place(300, true, 4.4).highCaption).toBe(false);
     expect(place(300, false, 1.7).highCaption).toBe(true);
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  3 failed | 173 passed (176)`, `Tests  2 failed | 1453 passed (1455)`. Lý do đỏ: file test mới không chạy được test nào vì chưa có `./HeightCards`; `chartLabelPlace` chưa có `targetCaption`; `GrowthChart` có `target` vẫn in hai chữ vùng.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/growth/GrowthChart.tsx b/components/growth/GrowthChart.tsx
index 17151bc..cd04226 100644
--- a/components/growth/GrowthChart.tsx
+++ b/components/growth/GrowthChart.tsx
@@ -27,6 +27,9 @@ const TONE = {
 
 // Spec 2026-11-25 §5.4: the normal band (z −2 to +2) by sex, its median, and
 // the baby's measurements joined by a line.
+//
+// With `target` (§6.3, item 4) it is the chart of the Chiều cao page: the
+// median and the three zone captions give way to the target line.
 export function GrowthChart({
   band,
   points,
@@ -34,6 +37,7 @@ export function GrowthChart({
   to,
   unit,
   label,
+  target,
 }: {
   band: CurvePoint[];
   points: ChartView["points"];
@@ -41,6 +45,8 @@ export function GrowthChart({
   to: number;
   unit: string;
   label: string;
+  // The length on each day of a child who will reach the family's target.
+  target?: { day: number; value: number }[];
 }) {
   const months = Math.round(to / DAYS_PER_MONTH);
   const every = months > 24 ? 6 : months > 12 ? 3 : 1;
@@ -53,6 +59,7 @@ export function GrowthChart({
     mid: point.mid,
   }));
   const end = band.at(-1);
+  const targetEnd = target?.at(-1);
   // `points` is oldest first, so the one before the newest is second to last.
   const before = points.at(-2);
   const place = last
@@ -116,15 +123,29 @@ export function GrowthChart({
             activeDot={false}
             isAnimationActive={false}
           />
-          <Line
-            dataKey="mid"
-            dot={false}
-            activeDot={false}
-            isAnimationActive={false}
-            stroke="var(--color-good-ink)"
-            strokeWidth={1.5}
-            strokeDasharray="4 4"
-          />
+          {!target && (
+            <Line
+              dataKey="mid"
+              dot={false}
+              activeDot={false}
+              isAnimationActive={false}
+              stroke="var(--color-good-ink)"
+              strokeWidth={1.5}
+              strokeDasharray="4 4"
+            />
+          )}
+          {target && (
+            <Line
+              data={target}
+              dataKey="value"
+              dot={false}
+              activeDot={false}
+              isAnimationActive={false}
+              stroke="var(--color-cat-sleep)"
+              strokeWidth={2}
+              strokeDasharray="6 4"
+            />
+          )}
           <Line
             data={points}
             dataKey="value"
@@ -134,7 +155,26 @@ export function GrowthChart({
             strokeWidth={2.5}
             dot={{ r: 4.5, fill: TONE.accent, strokeWidth: 0 }}
           />
-          {end && place?.normalCaption !== false && (
+          {targetEnd && place?.targetCaption !== false && (
+            <ReferenceDot
+              x={targetEnd.day}
+              y={targetEnd.value}
+              r={0}
+              label={{
+                value: "Đường mục tiêu",
+                // It ends at the right edge, just above the end of the line.
+                position: "insideBottomRight",
+                fontSize: 11,
+                fontWeight: 600,
+                fill: "var(--color-cat-sleep)",
+                stroke: "var(--color-glass-solid)",
+                strokeWidth: 4,
+                strokeLinejoin: "round",
+                paintOrder: "stroke",
+              }}
+            />
+          )}
+          {!target && end && place?.normalCaption !== false && (
             <ReferenceDot
               x={end.day}
               y={(end.mid + end.high) / 2}
@@ -176,15 +216,17 @@ export function GrowthChart({
           )}
         </ComposedChart>
       </ResponsiveContainer>
-      {place?.highCaption !== false && (
+      {!target && place?.highCaption !== false && (
         // top-8 is just inside the plot, which starts HEADROOM px down.
         <span className="pointer-events-none absolute top-8 left-11 text-[11px] leading-none text-muted">
           Cao hơn chuẩn
         </span>
       )}
-      <span className="pointer-events-none absolute right-3 bottom-11 text-[11px] leading-none text-muted">
-        Thấp hơn chuẩn
-      </span>
+      {!target && (
+        <span className="pointer-events-none absolute right-3 bottom-11 text-[11px] leading-none text-muted">
+          Thấp hơn chuẩn
+        </span>
+      )}
     </div>
   );
 }
diff --git a/components/height/HeightCards.tsx b/components/height/HeightCards.tsx
new file mode 100644
index 0000000..36b8c9f
--- /dev/null
+++ b/components/height/HeightCards.tsx
@@ -0,0 +1,206 @@
+import type { ReactNode } from "react";
+import { Button } from "@/components/ui/Button";
+import { StatusChip } from "@/components/ui/StatusChip";
+import type { HeightView } from "@/lib/rules/heightView";
+
+const CARD = "glass flex flex-col rounded-[26px] p-4";
+const LABEL =
+  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] text-muted uppercase";
+const BODY = "text-[15px] leading-[22px] text-ink";
+const MUTED = "text-[13px] leading-[18px] text-muted";
+
+// Spec 2026-11-25 §6.3, item 2: the target and where the baby stands against
+// its line.
+export function HeightGoalCard({
+  goal,
+  isOwner,
+  onSet,
+}: {
+  goal: HeightView["goal"];
+  isOwner: boolean;
+  // Opens the sheet of §6.5. Without it the owner sees no button.
+  onSet?: () => void;
+}) {
+  if (!goal)
+    return (
+      <section className={`${CARD} gap-3`}>
+        <p className="text-xl leading-[26px] font-bold text-ink">
+          Chưa có mục tiêu chiều cao
+        </p>
+        {isOwner ? (
+          onSet && (
+            <Button block onClick={onSet}>
+              Đặt mục tiêu
+            </Button>
+          )
+        ) : (
+          <p className={MUTED}>Chủ gia đình chưa đặt mục tiêu chiều cao.</p>
+        )}
+      </section>
+    );
+  return (
+    <section className={`${CARD} gap-2`}>
+      <div className="flex items-center justify-between gap-2">
+        <span className={LABEL}>Mục tiêu lúc trưởng thành</span>
+        {goal.chip && (
+          <StatusChip tone={goal.chip.tone}>{goal.chip.text}</StatusChip>
+        )}
+      </div>
+      <div className="flex items-baseline gap-2">
+        <span className="text-[44px] leading-[48px] font-bold tracking-[-0.02em] text-ink tabular-nums">
+          {goal.target}
+        </span>
+        <span className="text-xl leading-[26px] font-bold text-ink">cm</span>
+      </div>
+      <p className={BODY}>{goal.sentence}</p>
+    </section>
+  );
+}
+
+// The label over the target mark is up to about 118 px wide ("Mục tiêu
+// 190,5"): at either end of the bar it stays inside the card.
+const labelLeft = (at: number) => `clamp(60px, ${at}%, calc(100% - 60px))`;
+const NUMBER = "absolute top-[58px] -translate-x-1/2 text-xs tabular-nums";
+
+// Item 3: the range expected from the parents' heights, and the target on it.
+export function ParentalRangeCard({
+  parents,
+}: {
+  parents: HeightView["parents"];
+}) {
+  return (
+    <section className={`${CARD} gap-3`}>
+      <div className="flex items-baseline justify-between gap-2">
+        <h2 className="text-base font-bold text-ink">Di truyền dự kiến</h2>
+        {parents && <span className={MUTED}>{parents.line}</span>}
+      </div>
+      {parents ? (
+        <>
+          <div
+            role="img"
+            aria-label={parents.bar.label}
+            className="relative h-[76px]"
+          >
+            {parents.bar.target && (
+              <span
+                className="absolute top-0 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap text-on-accent"
+                style={{ left: labelLeft(parents.bar.target.at) }}
+              >
+                {parents.bar.target.text}
+              </span>
+            )}
+            <span className="absolute inset-x-0 top-9 h-3 rounded-full bg-line" />
+            <span
+              className="absolute top-9 h-3 rounded-full bg-good/35"
+              style={{
+                left: `${parents.bar.low.at}%`,
+                width: `${parents.bar.high.at - parents.bar.low.at}%`,
+              }}
+            />
+            <span
+              className="absolute top-8 h-5 w-0.5 -translate-x-1/2 bg-good"
+              style={{ left: `${parents.bar.mid.at}%` }}
+            />
+            {parents.bar.target && (
+              <span
+                className="absolute top-[26px] h-[30px] w-1 -translate-x-1/2 rounded-sm bg-accent"
+                style={{ left: `${parents.bar.target.at}%` }}
+              />
+            )}
+            <span
+              className={`${NUMBER} text-muted`}
+              style={{ left: `${parents.bar.low.at}%` }}
+            >
+              {parents.bar.low.text}
+            </span>
+            <span
+              className={`${NUMBER} font-semibold text-ink`}
+              style={{ left: `${parents.bar.mid.at}%` }}
+            >
+              {parents.bar.mid.text}
+            </span>
+            <span
+              className={`${NUMBER} text-muted`}
+              style={{ left: `${parents.bar.high.at}%` }}
+            >
+              {parents.bar.high.text}
+            </span>
+          </div>
+          <p className={BODY}>{parents.sentence}</p>
+          <p className={MUTED}>
+            Tính từ chiều cao bố mẹ. Đây là ước lượng, phần lớn trẻ nằm trong
+            khoảng này.
+          </p>
+        </>
+      ) : (
+        <p className={MUTED}>Nhập chiều cao bố mẹ để xem khoảng dự kiến.</p>
+      )}
+    </section>
+  );
+}
+
+// Item 4: the frame round the chart of the length against the target line.
+// The chart itself is loaded lazily and passed in as children.
+export function TargetPathCard({
+  title,
+  babyName,
+  note,
+  children,
+}: {
+  title: string;
+  babyName: string;
+  note: string;
+  children: ReactNode;
+}) {
+  return (
+    <section className="glass flex flex-col gap-2.5 rounded-[26px] p-3">
+      <h2 className="px-1 text-base font-bold text-ink">{title}</h2>
+      {children}
+      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1 text-xs text-muted">
+        <span className="flex items-center gap-1.5">
+          <span className="size-2.5 rounded-full bg-accent" />
+          {babyName}
+        </span>
+        <span className="flex items-center gap-1.5">
+          <span className="w-4 border-t-2 border-dashed border-cat-sleep" />
+          Đường mục tiêu
+        </span>
+        <span className="flex items-center gap-1.5">
+          <span className="h-2.5 w-3.5 rounded-[3px] bg-good/25" />
+          Vùng bình thường
+        </span>
+      </div>
+      <p className={`px-1 ${MUTED}`}>{note}</p>
+    </section>
+  );
+}
+
+// Item 5: how fast the length grows, against what is usual at that age.
+export function VelocityCard({
+  velocity,
+}: {
+  velocity: HeightView["velocity"];
+}) {
+  return (
+    <section className={`${CARD} gap-1.5`}>
+      <div className="flex items-center justify-between gap-2">
+        <span className={LABEL}>Tốc độ tăng</span>
+        {velocity && (
+          <StatusChip tone={velocity.chip.tone}>
+            {velocity.chip.text}
+          </StatusChip>
+        )}
+      </div>
+      {velocity ? (
+        <>
+          <span className="text-xl leading-[26px] font-bold text-ink tabular-nums">
+            {velocity.rate}
+          </span>
+          <span className={MUTED}>{velocity.line}</span>
+        </>
+      ) : (
+        <p className={MUTED}>Cần hai lần đo chiều dài cách nhau từ 14 ngày.</p>
+      )}
+    </section>
+  );
+}
diff --git a/lib/rules/growthView.ts b/lib/rules/growthView.ts
index a2450f5..92a92a2 100644
--- a/lib/rules/growthView.ts
+++ b/lib/rules/growthView.ts
@@ -242,6 +242,8 @@ export type ChartLabelPlace = {
   normalCaption: boolean;
   // "Cao hơn chuẩn" in the top left corner.
   highCaption: boolean;
+  // "Đường mục tiêu" at the right end of the target line (§6.3, item 4).
+  targetCaption: boolean;
 };
 
 export function chartLabelPlace(input: {
@@ -272,6 +274,10 @@ export function chartLabelPlace(input: {
     normalCaption: day <= 0.7 * to,
     // An alert label is long enough to reach the corner caption.
     highCaption: !(alert && anchor === "end" && side === "top"),
+    // The caption ends at the right edge and is about 85 px wide: past 60% of
+    // the axis the newest point, or its label, would lie under it. The legend
+    // below the chart still names the line.
+    targetCaption: day <= 0.6 * to,
   };
 }
 
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  176 passed (176)`, `Tests  1471 passed (1471)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/height components/growth/GrowthChart.tsx components/growth/growthparts.test.tsx lib/rules/growthView.ts lib/rules/growthView.test.ts
git commit -m "feat(height): the four cards of the Chiều cao page; the chart draws a target line" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M3b và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-height/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  176 passed (176)`, `Tests  1471 passed (1471)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm để xem bốn thẻ**

Trang này chỉ đọc bảng WHO (file nội dung của app), không đọc hay ghi dữ liệu của gia đình. Tạo `app/fixture-height/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { GrowthChart } from "@/components/growth/GrowthChart";
import {
  HeightGoalCard,
  ParentalRangeCard,
  TargetPathCard,
  VelocityCard,
} from "@/components/height/HeightCards";
import type { LmsRow, WhoSex } from "@/lib/content/who";
import { useWhoTable } from "@/lib/data/growth";
import { addDays } from "@/lib/rules/days";
import type { GrowthMeasure } from "@/lib/rules/growthAlerts";
import { heightView } from "@/lib/rules/heightView";

// Bé sinh 10/09/2026; "hôm nay" là ngày bé được `age` ngày tuổi.
const DOB = "2026-09-10";
type Case = {
  age: number;
  sex: WhoSex;
  father: number | null;
  mother: number | null;
  target: number | null;
  // [ngày tuổi, chiều dài cm]
  lengths: [number, number][];
  owner: boolean;
};
// ?c=0 dưới đường mục tiêu (số đo như của Bun) · 1 sát đường · 2 trên đường ·
// 3 chưa có mục tiêu (chủ gia đình) · 4 chưa nhập bố mẹ · 5 mục tiêu ngoài khoảng ·
// 6 bé gái · 7 chưa có lần đo · 8 chưa có mục tiêu (thành viên khác) ·
// 9 bé gần 10 tháng, sát đường (chấm mới nhất nằm bên phải biểu đồ) ·
// 10 bé hơn 6 tháng, sát đường (chấm mới nhất còn bên trái mốc 60%).
const CASES: Case[] = [
  { age: 76, sex: "boys", father: 172, mother: 164, target: 180, lengths: [[0, 47.5], [30, 52], [76, 56.9]], owner: true },
  { age: 76, sex: "boys", father: 172, mother: 164, target: 180, lengths: [[0, 50.5], [30, 55.6], [76, 61.5]], owner: true },
  { age: 76, sex: "boys", father: 172, mother: 164, target: 180, lengths: [[0, 51], [30, 57], [76, 63]], owner: true },
  { age: 76, sex: "boys", father: 172, mother: 164, target: null, lengths: [[0, 50.5], [30, 55.6], [76, 61.5]], owner: true },
  { age: 76, sex: "boys", father: null, mother: null, target: 180, lengths: [[0, 50.5], [30, 55.6], [76, 61.5]], owner: true },
  { age: 76, sex: "boys", father: 172, mother: 164, target: 190.5, lengths: [[0, 50.5], [30, 55.6], [76, 61.5]], owner: true },
  { age: 76, sex: "girls", father: 172, mother: 164, target: 165, lengths: [[0, 49], [30, 53.5], [76, 59]], owner: true },
  { age: 76, sex: "boys", father: 172, mother: 164, target: 180, lengths: [], owner: true },
  { age: 76, sex: "boys", father: 172, mother: 164, target: null, lengths: [[0, 50.5], [30, 55.6], [76, 61.5]], owner: false },
  { age: 300, sex: "boys", father: 172, mother: 164, target: 180, lengths: [[200, 68.6], [250, 71.4], [300, 73.6]], owner: true },
  { age: 200, sex: "boys", father: 172, mother: 164, target: 180, lengths: [[100, 62.5], [150, 66], [200, 68.9]], owner: true },
];

export default function Page() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(Number(new URLSearchParams(window.location.search).get("c") ?? 0));
  }, []);
  const item = CASES[index] ?? CASES[0];
  const table = useWhoTable("lhfa", item.sex);
  if (!table.data) return <p>Đang tải bảng WHO…</p>;

  const rows: GrowthMeasure[] = item.lengths.map(([age, cm]) => ({
    measured_on: addDays(DOB, age),
    weight_g: null,
    length_cm: cm,
    head_cm: null,
  }));
  const view = heightView({
    baby: {
      name: "Bun",
      dob: DOB,
      sex: item.sex,
      father_height_cm: item.father,
      mother_height_cm: item.mother,
      target_height_cm: item.target,
    },
    rows,
    table: table.data.rows as LmsRow[],
    today: new Date(`${addDays(DOB, item.age)}T05:00:00Z`),
  });

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture chiều cao, trường hợp {index}</p>
      <HeightGoalCard goal={view.goal} isOwner={item.owner} onSet={() => {}} />
      <ParentalRangeCard parents={view.parents} />
      {view.path && (
        <TargetPathCard
          title={view.path.title}
          babyName="Bun"
          note={view.path.note}
        >
          <GrowthChart
            band={view.path.band}
            points={view.path.points}
            last={view.path.last}
            to={view.path.to}
            unit="cm"
            label={view.path.ariaLabel}
            target={view.path.target}
          />
        </TargetPathCard>
      )}
      <VelocityCard velocity={view.velocity} />
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 10). Chạy `bun run dev`. Cỡ 375×812.

Trên trang tạm `http://localhost:3000/fixture-height?c=0` (số đo như của bé nhà mình, mục tiêu 180 cm):

1. **Thẻ mục tiêu:** nhãn viết hoa "Mục tiêu lúc trưởng thành"; bên phải là chip "Dưới đường mục tiêu" nền xám (không vàng, không đỏ); số "180" cỡ lớn kèm "cm"; câu "Bun dài 56,9 cm lúc 2 tháng 15 ngày. Dưới đường mục tiêu 4,0 cm."
2. **Thẻ "Di truyền dự kiến":** bên phải tiêu đề là "Bố 172 cm · Mẹ 164 cm". Thanh: một đoạn xanh nhạt giữa hai số "166" và "183", một vạch xanh mảnh ở "174,5", một vạch màu nhấn dày hơn nằm trong đoạn xanh gần đầu phải, phía trên vạch đó là nhãn "Mục tiêu 180". Ba số dưới thanh không đè nhau, nhãn không bị cắt. Dưới thanh: "Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên." rồi dòng xám "Tính từ chiều cao bố mẹ. Đây là ước lượng, phần lớn trẻ nằm trong khoảng này."
3. **Thẻ "Đường tới 180 cm":** biểu đồ có vùng tô xanh nhạt; một đường nét đứt màu tím chạy từ trái sang phải trong nửa trên của vùng tô, cuối đường có nhãn "Đường mục tiêu" cùng màu, không bị cắt ở mép phải; ba chấm của bé nối nhau, nằm dưới đường nét đứt, chấm cuối to hơn và có nhãn "56,9 cm". Không có đường giữa, không có các chữ "Cao hơn chuẩn", "Bình thường", "Thấp hơn chuẩn". Chú giải đủ ba mục: "Bun", "Đường mục tiêu", "Vùng bình thường". Đoạn chú thích bắt đầu bằng "Đường mục tiêu là chiều dài ở từng tháng tuổi của một bé trai sẽ cao 180 cm khi lớn".
4. **Thẻ "Tốc độ tăng":** chip "Tăng tốt" (nền xanh); "3,2 cm mỗi tháng"; dòng "Từ 10/10 đến 25/11 · bé cùng tuổi thường tăng khoảng 3,5 cm mỗi tháng".

Lần lượt các trường hợp còn lại:

5. `?c=1`: chip "Đang đúng hướng" (nền xanh); câu kết thúc bằng "Sát đường mục tiêu."; chấm cuối của bé nằm sát đường nét đứt; "3,9 cm mỗi tháng".
6. `?c=2`: câu kết thúc bằng "Trên đường mục tiêu 2,1 cm."; chấm cuối nằm trên đường nét đứt.
7. `?c=3` (chưa có mục tiêu, chủ gia đình): thẻ đầu ghi "Chưa có mục tiêu chiều cao" và có nút "Đặt mục tiêu" (nút chưa làm gì, đừng coi là lỗi). Không có thẻ "Đường tới". Thanh di truyền không có vạch màu nhấn và nhãn; câu dưới thanh chỉ còn "Khoảng dự kiến 166–183 cm."
8. `?c=4` (chưa nhập bố mẹ): thẻ di truyền chỉ có tiêu đề và dòng "Nhập chiều cao bố mẹ để xem khoảng dự kiến."
9. `?c=5` (mục tiêu 190,5 cm, ngoài khoảng): vạch màu nhấn ở tận mép phải của thanh; nhãn "Mục tiêu 190,5" nằm trọn trong thẻ, không bị cắt; câu "Khoảng dự kiến 166–183 cm. Mục tiêu 190,5 cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt."; thẻ mục tiêu ghi "Dưới đường mục tiêu 2,4 cm."; đường nét đứt chạy sát mép trên của vùng tô.
10. `?c=6` (bé gái, mục tiêu 165 cm): ba số "153", "161,5", "170"; câu "Mục tiêu 165 cm nằm trong khoảng, ở nửa trên."; đoạn chú thích ghi "một bé gái sẽ cao 165 cm khi lớn".
11. `?c=7` (chưa có lần đo): thẻ mục tiêu ghi "Chưa có lần đo chiều dài.", không có chip; biểu đồ chỉ có vùng tô và đường mục tiêu; thẻ tốc độ ghi "Cần hai lần đo chiều dài cách nhau từ 14 ngày.", không có chip.
12. `?c=8` (chưa có mục tiêu, thành viên khác): "Chủ gia đình chưa đặt mục tiêu chiều cao.", không có nút.
13. `?c=9` (bé gần 10 tháng, đi sát đường): câu "Bun dài 73,6 cm lúc 9 tháng 27 ngày. Sát đường mục tiêu."; trên biểu đồ chấm mới nhất nằm ở phần tư bên phải, sát đường nét đứt, nhãn "73,6 cm" đọc rõ; **trong biểu đồ không có chữ "Đường mục tiêu"** (chú giải bên dưới vẫn có). Không chữ nào đè lên chấm hay lên chữ khác.
14. `?c=10` (bé hơn 6 tháng, đi sát đường): câu "Bun dài 68,9 cm lúc 6 tháng 19 ngày. Sát đường mục tiêu."; chữ "Đường mục tiêu" **có** ở đầu phải của đường và không chạm vào chấm mới nhất hay nhãn "68,9 cm" của chấm. Nếu chạm thì ghi lại khoảng cách và báo người dùng: mốc 60% cần chỉnh.
15. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở `?c=0` và `?c=5`.
16. Lặp mục 1 đến 4 (ở `?c=0`) và mục 9 (ở `?c=5`) với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: chip xám, vạch và nhãn màu nhấn, đường nét đứt và nhãn của nó đều đọc rõ trên nền của từng theme.

Nếu mục 3, 13 hoặc 14 cho thấy biểu đồ vẽ sai (không có đường nét đứt, đường nằm ngoài khung, nhãn "Đường mục tiêu" bị cắt hoặc đè lên chấm của bé, vẫn còn đường giữa hay ba chữ vùng): **dừng, không sửa gì, báo người dùng** kèm mô tả và ảnh chụp (Diễn giải spec, mục 7).

Trang thật (chỉ xem):

17. `http://localhost:3000/tang-truong`: biểu đồ của màn Tăng trưởng không đổi so với trước M3b: vẫn có đường giữa nét đứt và ba chữ vùng, không có đường màu tím.
18. `http://localhost:3000/tang-truong/chieu-cao`: chưa có trang (404); M3c mới thêm.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả kiểm (2026-11-25).** Người dùng chọn khung Browser trong app (question card). 375×812, DPR 2. Trang tạm mở sẵn ở theme `night`; `dark`, `rose`, `light` đặt tạm bằng `document.documentElement.dataset.theme`. Ngoài nhìn ảnh, mỗi trường hợp được đo bằng script chạy trong trang (khung bao của chữ, chấm, thẻ; 600 điểm lấy mẫu dọc đường mục tiêu). Ảnh: thư mục `m3b-screens/` trong thư mục ghi chú chung của nhóm phiên (39 ảnh; ảnh có tiền tố `LOI-` là chỗ chưa đẹp nêu ở cuối).

- **Step 1:** `tsc --noEmit` sạch; `Test Files  176 passed (176)`, `Tests  1471 passed (1471)`.
- **Step 2:** `bun run build` lần đầu thoát mã 1 vì `SecurityFatalError` của Next.js 16.4.3 (đã biết; không chạy `next upgrade`), lần hai thoát mã 0, 39/39 trang tĩnh.
- **Mục 1 đến 4 (`?c=0`): đạt** ở `night`, `dark`, `rose`, `light`. Chữ đúng từng câu. Chip "Dưới đường mục tiêu" nền xám, không vàng, không đỏ. Thanh: ba số cách nhau 58,4 px; nhãn "Mục tiêu 180" rộng 101,3 px, canh giữa vạch, vạch nằm trong đoạn xanh. Biểu đồ: đường nét đứt `6 4` dày 2 px ở 62% chiều cao của vùng tô; chữ "Đường mục tiêu" rộng 86,3 px, cách mép phải của khung vẽ 5,7 px, không bị cắt; ba chấm, chấm cuối nằm dưới đường 25 px, nhãn "56,9 cm"; không có đường giữa, không có ba chữ vùng; chú giải ba mục trên một dòng. Đường mục tiêu màu tím ở `dark` (`rgb(169,155,255)`), `rose` và `light` (`rgb(91,75,196)`); ở `night` token `cat-sleep` cùng tông hổ phách với vùng tô, vẫn tách rõ vì vùng tô chỉ đậm 14%. Thẻ tốc độ: "Tăng tốt", "3,2 cm mỗi tháng", dòng dưới đúng.
- **Mục 5 (`?c=1`): đạt về chữ và vị trí** ("Đang đúng hướng", "Sát đường mục tiêu.", "3,9 cm mỗi tháng"; tâm chấm cuối cách đường 3,4 px). Xem chỗ chưa đẹp A.
- **Mục 6 (`?c=2`): đạt** ("Trên đường mục tiêu 2,1 cm.", chấm cuối trên đường 12,6 px). Xem A.
- **Mục 7 (`?c=3`): đạt.** "Chưa có mục tiêu chiều cao", nút "Đặt mục tiêu" (không bấm); không có thẻ "Đường tới"; thanh không có vạch và nhãn màu nhấn; câu chỉ còn "Khoảng dự kiến 166–183 cm."
- **Mục 8 (`?c=4`): đạt.**
- **Mục 9 (`?c=5`): đạt.** Vạch màu nhấn ở tận mép phải của thanh. Nhãn "Mục tiêu 190,5" rộng 112,8 px, **nằm trọn trong thẻ, còn cách mép phải của thẻ 20,6 px**, lệch khỏi vạch đúng 60 px. Câu đúng. "Dưới đường mục tiêu 2,4 cm." Đường nét đứt ở 97–98% chiều cao của vùng tô. Chữ "Đường mục tiêu" nằm cao hơn khung vẽ 10,8 px (trong lề trên 28 px của biểu đồ), không bị cắt.
- **Mục 10 (`?c=6`): đạt** ("153", "161,5", "170"; "một bé gái sẽ cao 165 cm khi lớn"). Xem A.
- **Mục 11 (`?c=7`): đạt.** Nhãn thẻ mục tiêu ở đây nằm trên một dòng (không có chip).
- **Mục 12 (`?c=8`): đạt.**
- **Mục 13 (`?c=9`): đạt.** Trong biểu đồ **không có** chữ "Đường mục tiêu" (chú giải vẫn có). Chấm mới nhất ở 82,2% bề ngang, dưới đường 3,5 px; nhãn "73,6 cm" nằm bên trái phía trên chấm; không điểm nào của đường mục tiêu hay đường của bé đi qua nhãn; không chữ nào chồng nhau.
- **Mục 14 (`?c=10`): đạt.** Chấm mới nhất ở 54,8% bề ngang. Chữ "Đường mục tiêu" **cách chấm 51,3 px** (ngang 24,8, dọc 44,9) và **cách nhãn "68,9 cm" 41,6 px** (ngang 31,3, dọc 27,4). Mốc 60% không cần chỉnh theo trường hợp này.
- **Mục 15: đạt**, `scrollWidth <= innerWidth` là `true` ở cả 11 trường hợp.
- **Mục 16: đạt** ở `rose`, `light`, `dark`, `night` cho `?c=0` và `?c=5`.
- **Mục 17: đạt.** `/tang-truong` (trang thật, `night`, chỉ xem; có bấm thanh chọn chỉ số sang "Chiều dài", không ghi gì): biểu đồ Cân nặng và Chiều dài vẫn có đường giữa nét đứt và ba chữ vùng, không có đường mục tiêu.
- **Mục 18: đạt.** `/tang-truong/chieu-cao` trả 404.
- Console của trình duyệt chỉ có lỗi 404 của mục 18; log của `next dev` không có lỗi.

**Chỗ chưa đẹp, chưa sửa (chờ người dùng quyết):**

- **A. Nhãn số đo của chấm mới nhất nằm đè lên đường mục tiêu** khi chấm ở nửa trái của biểu đồ (bé dưới khoảng 6 tháng trên trục 12 tháng) và bé ở sát hoặc trên đường. Nhãn chạy sang phải phía trên chấm, đúng hướng đường mục tiêu đi lên. Số điểm lấy mẫu của đường (trên 600) rơi vào khung của nhãn: `?c=1` và `?c=4` 52, `?c=6` 54, `?c=5` 28 (chạm góc trên trái), `?c=2` 22 (cắt đuôi nhãn). Chữ vẫn đọc được nhờ viền; đường mục tiêu mất một đoạn khoảng 50 px sau nhãn, ở `night` nhìn như nhãn bị gạch ngang. `?c=0` (số đo như của bé nhà mình) không bị, nhưng đường đi sát mép trên của nhãn khoảng 1 px. `?c=9`, `?c=10` (nửa phải) không bị. Plan chỉ nêu chữ "Đường mục tiêu" trong danh sách phải dừng, nên việc kiểm vẫn làm hết; không sửa gì ngoài patch. Ảnh: `LOI-c01-*`, `LOI-c05-*`, `LOI-c06-*`.
- **B. Nhãn "MỤC TIÊU LÚC TRƯỞNG THÀNH" xuống hai dòng** ở 375 px mỗi khi thẻ có chip (mọi trường hợp trừ `?c=7`). Không bị cắt "…".

**Chưa kiểm:** theme `peach`, `lavender`, `sea`; bé trên 1 tuổi (trục 2 năm và 5 năm) và bé chỉ có lần đo lúc sinh (trang tạm của plan không có các trường hợp này); bề ngang 440 px; nút "Đặt mục tiêu" (chưa nối vào đâu); trình đọc màn hình; iPhone thật và PWA.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-height
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m3b.md
git commit -m "docs(plan): record the M3b check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang tạm, mục nào chưa; chỗ nào chưa đẹp thì nêu trước, kèm cách sửa. Nói rõ chưa trang nào của app dùng bốn thẻ này. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m3b
git push origin main
```
