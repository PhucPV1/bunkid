# Kim Bun — Sức khỏe M3d: lối vào trang Chiều cao Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§6.4 thẻ ở màn Tăng trưởng và câu trạng thái ở trang Sức khỏe; §5.3 mục 4; hàng mục tiêu của §3.4; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25

**Goal:** Trang Chiều cao có lối vào: một thẻ "Mục tiêu chiều cao" trên màn Tăng trưởng, và một hàng `Mục tiêu {t} cm: {trạng thái}` ở chân thẻ Tăng trưởng của trang Sức khỏe. Đây là plan cuối của mốc M3.

**Architecture:**

- **Luật thuần** trong `lib/rules/heightView.ts`: `goalLink` (tên và dòng phụ của thẻ ở màn Tăng trưởng) và `goalLine` (hàng ở trang Sức khỏe). Cả hai dùng `goalStatus` của M3a, nên ba nơi (trang Chiều cao, màn Tăng trưởng, trang Sức khỏe) luôn nói cùng một trạng thái.
- **Khối giao diện:** `HeightGoalLink` trong `components/height/HeightCards.tsx`; `GrowthScreen` vẽ nó sau thẻ kết luận; `GrowthCard` của `HealthScreen` nhận thêm `goal`.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m3d`, cắt từ `main` @ `91162ee` (đã có M3c và bản sửa tiêu đề sheet). Baseline: 1521 test vitest xanh (178 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                       | Plan                          |
| ------------------ | ---------------------------------------------- | ----------------------------- |
| M1, M2             | §3, §4 dòng 1 đến 3, §5                        | đã xong, ở `main`             |
| M3a, M3b, M3c      | §6.1, §6.2, §6.3, §6.5                         | đã xong, ở `main` @ `91162ee` |
| **M3d (plan này)** | §6.4; hàng mục tiêu của §3.4                   | file này                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4 | chưa viết                     |
| M5                 | §8 Push, dòng 4 của §4, §9.3                   | chưa viết                     |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Thẻ "Mục tiêu chiều cao" ở màn Tăng trưởng** nằm sau thẻ kết luận, trước thanh chọn chỉ số, và có cả khi chưa có lần đo nào (§5.3). Khi đã có mục tiêu mà các lần đo hoặc bảng chiều dài WHO chưa tải xong, thẻ chỉ ghi tên, chưa ghi trạng thái, để không hiện "Chưa có lần đo chiều dài" rồi đổi.
2. **Dòng phụ của thẻ** màu `good` đậm 600 khi bé sát hoặc trên đường mục tiêu (chip của `goalStatus` là "Đang đúng hướng"), màu xám trong mọi trường hợp khác. Dưới đường mục tiêu không dùng màu vàng hay đỏ.
3. **Hàng mục tiêu ở trang Sức khỏe** chỉ hiện khi đã có mục tiêu, đã có ít nhất một lần đo, và các lần đo cùng ba bảng WHO đã tải xong (cùng lúc với chip của thẻ). Chưa có lần đo nào thì thẻ chỉ có hàng trên, như §3.4 ghi. Câu sau dấu hai chấm viết thường: "đang đúng hướng", "dưới đường mục tiêu {d} cm", "chưa có lần đo chiều dài" (§6.4).
4. **Hàng mục tiêu dài thì được xuống hai dòng.** "Mục tiêu 190,5 cm: dưới đường mục tiêu 12,4 cm" ước chừng dài hơn bề ngang thẻ ở 375 px; §2 cho dòng mô tả của thẻ xuống tối đa 2 dòng. Trang tạm có trường hợp này.
5. **Test "no measurement…" của màn Tăng trưởng được đổi tên** vì trang chưa có lần đo giờ có thêm thẻ này.
6. **Bé quá 1856 ngày tuổi** (thừa hưởng từ M3a): cả hai nơi vẫn xét lần đo chiều dài gần nhất nằm trong bảng WHO, có thể đã cũ. Với bé nhà mình còn gần 5 năm nữa mới tới; ghi lại cho M4.
7. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m3d.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `91162ee`. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang tạm của Task 3 đã qua `tsc --noEmit`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Không bấm "Lưu".** Dev nối vào Supabase thật của gia đình. Nếu mở sheet ở trang Chiều cao thì chỉ xem rồi đóng.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 3 dừng lại hỏi, không tự push. Người dùng không muốn đẩy một thay đổi còn lỗi đã biết: nếu bước trình duyệt lộ ra lỗi thì nêu lỗi và cách sửa trước, rồi mới hỏi.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan; nếu người dùng muốn bỏ bớt chữ thì ghi lại yêu cầu và sửa theo, kèm test và sửa spec.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng sau M3c (đã ở `main` @ `91162ee`) và là plan cuối của M3. M4 thêm thói quen và dinh dưỡng vào trang Chiều cao.

**Consumes (từ M3a, M3b, M3c):** `goalStatus` (trả `text`, `short`, `chip`), `targetZ`, `midParental`, `formatCm` (`lib/rules/heightGoal.ts`); kiểu `baby` của `heightView` (`lib/rules/heightView.ts`); `HeightCards.tsx` và hằng `MUTED` của nó; đường dẫn `/tang-truong/chieu-cao`. **Từ các mốc trước:** `readings`, `GrowthMeasure`; `LmsRow`; `Icon` (icon `flag`, `chevronRight`); `GrowthScreen` và các biến `growth`, `tables`, `sex` của nó; `HealthScreen`, `GrowthCard` và biến `measured` của nó.

**Produces:**

- `lib/rules/heightView.ts`:
  - `GoalLink = { title: string; detail: string | null; onTrack: boolean }`, `goalLink(input: { baby: Parameters<typeof heightView>[0]["baby"]; rows: GrowthMeasure[] | undefined; table: LmsRow[] | undefined }): GoalLink`;
  - `goalLine(input: { baby: Parameters<typeof heightView>[0]["baby"]; rows: GrowthMeasure[]; table: LmsRow[] }): string | null`.
- `components/height/HeightCards.tsx`: `HeightGoalLink({ link: GoalLink })`.
- `GrowthScreen` vẽ `HeightGoalLink` sau thẻ kết luận, cả khi chưa có lần đo.
- `components/health/HealthScreen.tsx`: `GrowthCard` nhận thêm `goal?: string | null`.
- **Vitest sau M3d:** 1540 test, 178 file.

---

### Task 1: Thẻ "Mục tiêu chiều cao" ở màn Tăng trưởng (§6.4, §5.3 mục 4)

**Files:**

- Modify: `lib/rules/heightView.ts`, `components/height/HeightCards.tsx`, `components/growth/GrowthScreen.tsx`
- Test: `lib/rules/heightView.test.ts`, `components/height/heightcards.test.tsx`, `components/growth/growthscreen.test.tsx`

**Interfaces:**

- Consumes: `goalStatus`, `targetZ`, `midParental`, `formatCm`, `readings`; `Icon`; các biến `growth`, `tables`, `sex` của `GrowthScreen`.
- Produces: `GoalLink`, `goalLink`; `HeightGoalLink({ link })`; `GrowthScreen` vẽ thẻ này sau thẻ kết luận, cả khi chưa có lần đo.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m3d
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/growth/growthscreen.test.tsx b/components/growth/growthscreen.test.tsx
index bec28b5..f410600 100644
--- a/components/growth/growthscreen.test.tsx
+++ b/components/growth/growthscreen.test.tsx
@@ -84,6 +84,9 @@ const baby = {
   name: "Bun",
   dob: "2026-09-14",
   sex: "male",
+  father_height_cm: null,
+  mother_height_cm: null,
+  target_height_cm: null,
 } as unknown as Baby;

 function render(
@@ -226,9 +229,7 @@ describe("GrowthScreen", () => {
     expect(html).not.toContain(">Cân nặng thấp hơn chuẩn</h2>");
     // The weight block of the verdict card is not there yet.
     expect(html).not.toContain(" kg, giữa ");
-    expect(html.match(/role="img" aria-label="[^"]*Chuẩn từ/g)).toHaveLength(
-      1,
-    );
+    expect(html.match(/role="img" aria-label="[^"]*Chuẩn từ/g)).toHaveLength(1);
   });

   it("no table yet: no verdict card and no alert", () => {
@@ -237,7 +238,7 @@ describe("GrowthScreen", () => {
     expect(html).not.toContain(ICON_PATHS.alert);
   });

-  it("no measurement: only the header and the empty state", () => {
+  it("no measurement: the header and the empty state; no verdict, picker or chart", () => {
     const html = render([]);
     expect(html).toContain("Chưa có lần đo nào.");
     expect(html).not.toContain("Đo gần nhất");
@@ -297,6 +298,24 @@ describe("GrowthScreen", () => {
     expect(list).toContain('bg-warn-soft text-warn-ink">Thấp</span>');
   });

+  // Spec 2026-11-25 §5.3 item 4 and §6.4.
+  it("the height goal card links to Chiều cao, between the verdict and the picker", () => {
+    const html = render([measure("2026-11-15", 5500)]);
+    const card = html.indexOf('href="/tang-truong/chieu-cao"');
+    expect(card).toBeGreaterThan(html.indexOf(">Đo gần nhất 15/11"));
+    expect(card).toBeLessThan(html.indexOf('aria-label="Chỉ số"'));
+    expect(html).toContain(">Mục tiêu chiều cao</span>");
+    expect(html).toContain(
+      ">Nhập chiều cao bố mẹ để xem khoảng dự kiến</span>",
+    );
+  });
+
+  it("the height goal card is there with no measurement too", () => {
+    const html = render([]);
+    expect(html).toContain('href="/tang-truong/chieu-cao"');
+    expect(html).toContain(">Chưa có lần đo nào.</p>");
+  });
+
   it("the why popup is closed until asked for", () => {
     expect(render([measure("2026-11-15", 4000)])).not.toContain("<dialog");
   });
diff --git a/components/height/heightcards.test.tsx b/components/height/heightcards.test.tsx
index cf2e370..cb3ef9b 100644
--- a/components/height/heightcards.test.tsx
+++ b/components/height/heightcards.test.tsx
@@ -2,8 +2,10 @@ import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
 import { findElements } from "@/components/ui/testTree";
 import { rangeBar, type HeightView } from "@/lib/rules/heightView";
+import { ICON_PATHS } from "@/lib/ui/icons";
 import {
   HeightGoalCard,
+  HeightGoalLink,
   ParentalRangeCard,
   TargetPathCard,
   VelocityCard,
@@ -256,3 +258,60 @@ describe("VelocityCard", () => {
     expect(html).not.toContain(CHIP);
   });
 });
+
+// Spec 2026-11-25 §6.4.
+describe("HeightGoalLink", () => {
+  const render = (link: Parameters<typeof HeightGoalLink>[0]["link"]) =>
+    renderToStaticMarkup(<HeightGoalLink link={link} />);
+
+  it("is one link to the Chiều cao page: a flag in an accent-tinted circle, the title, an arrow", () => {
+    const html = render({
+      title: "Mục tiêu chiều cao 180 cm",
+      detail: "Sát đường mục tiêu",
+      onTrack: true,
+    });
+    expect(html).toMatch(/^<a [^>]*href="\/tang-truong\/chieu-cao"/);
+    expect(html.match(/<a /g)).toHaveLength(1);
+    expect(html).toContain("glass");
+    expect(html).toContain("rounded-[26px]");
+    expect(html).toContain("size-10");
+    expect(html).toContain("bg-accent-tint");
+    expect(html).toContain(`d="${ICON_PATHS.flag}"`);
+    expect(html).toContain(">Mục tiêu chiều cao 180 cm</span>");
+    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
+  });
+
+  it("on track: the status in good, semibold", () => {
+    expect(
+      render({
+        title: "Mục tiêu chiều cao 180 cm",
+        detail: "Sát đường mục tiêu",
+        onTrack: true,
+      }),
+    ).toContain(
+      '<span class="text-[13px] leading-[18px] font-semibold text-good">Sát đường mục tiêu</span>',
+    );
+  });
+
+  it("otherwise the line under the title is muted", () => {
+    expect(
+      render({
+        title: "Mục tiêu chiều cao",
+        detail: "Nhập chiều cao bố mẹ để xem khoảng dự kiến",
+        onTrack: false,
+      }),
+    ).toContain(
+      '<span class="text-[13px] leading-[18px] text-muted">Nhập chiều cao bố mẹ để xem khoảng dự kiến</span>',
+    );
+  });
+
+  it("no line under the title while the status is not known yet", () => {
+    const html = render({
+      title: "Mục tiêu chiều cao 180 cm",
+      detail: null,
+      onTrack: false,
+    });
+    expect(html).toContain(">Mục tiêu chiều cao 180 cm</span>");
+    expect(html).not.toContain("text-[13px]");
+  });
+});
diff --git a/lib/rules/heightView.test.ts b/lib/rules/heightView.test.ts
index 6520f71..02d00ca 100644
--- a/lib/rules/heightView.test.ts
+++ b/lib/rules/heightView.test.ts
@@ -2,7 +2,7 @@ import { describe, expect, it } from "vitest";
 import type { LmsRow } from "@/lib/content/who";
 import { addDays } from "./days";
 import type { GrowthMeasure } from "./growthAlerts";
-import { goalPreview, heightView, rangeBar } from "./heightView";
+import { goalLink, goalPreview, heightView, rangeBar } from "./heightView";

 const DOB = "2026-01-01";
 // The baby is 76 days old "today".
@@ -291,3 +291,80 @@ describe("goalPreview", () => {
       expect(goalPreview(raw, "boys"), JSON.stringify(raw)).toBeNull();
   });
 });
+
+// Spec 2026-11-25 §6.4: the card on the Tăng trưởng page that opens Chiều cao.
+describe("goalLink", () => {
+  const link = (
+    over: Partial<Parameters<typeof heightView>[0]["baby"]> = {},
+    rows: GrowthMeasure[] = [length(76, 17.5)],
+  ) => goalLink({ baby: baby(over), rows, table: FLAT });
+
+  it("with a target, on track: the target in the title, the status in good", () => {
+    expect(link()).toEqual({
+      title: "Mục tiêu chiều cao 180 cm",
+      detail: "Sát đường mục tiêu",
+      onTrack: true,
+    });
+    expect(link({}, [length(76, 19)])).toEqual({
+      title: "Mục tiêu chiều cao 180 cm",
+      detail: "Trên đường mục tiêu 2,1 cm",
+      onTrack: true,
+    });
+  });
+
+  it("with a target, below the line or not measured: the status, not in good", () => {
+    expect(link({}, [length(76, 15)])).toEqual({
+      title: "Mục tiêu chiều cao 180 cm",
+      detail: "Dưới đường mục tiêu 1,9 cm",
+      onTrack: false,
+    });
+    expect(link({}, [])).toEqual({
+      title: "Mục tiêu chiều cao 180 cm",
+      detail: "Chưa có lần đo chiều dài",
+      onTrack: false,
+    });
+  });
+
+  it("with a target, while the measurements or the table load: the title alone", () => {
+    // Called directly: an `undefined` argument would take the helper's default.
+    for (const waiting of [
+      goalLink({ baby: baby(), rows: undefined, table: FLAT }),
+      goalLink({ baby: baby(), rows: [], table: undefined }),
+    ])
+      expect(waiting).toEqual({
+        title: "Mục tiêu chiều cao 180 cm",
+        detail: null,
+        onTrack: false,
+      });
+  });
+
+  it("no target and no parents' heights: asks for the heights", () => {
+    expect(
+      link({
+        target_height_cm: null,
+        father_height_cm: null,
+        mother_height_cm: null,
+      }),
+    ).toEqual({
+      title: "Mục tiêu chiều cao",
+      detail: "Nhập chiều cao bố mẹ để xem khoảng dự kiến",
+      onTrack: false,
+    });
+  });
+
+  it("no target, parents' heights entered: the expected range", () => {
+    expect(link({ target_height_cm: null })).toEqual({
+      title: "Mục tiêu chiều cao",
+      detail: "Chưa đặt mục tiêu · khoảng dự kiến 166–183 cm",
+      onTrack: false,
+    });
+    // It needs neither the measurements nor the table.
+    expect(
+      goalLink({
+        baby: baby({ target_height_cm: null }),
+        rows: undefined,
+        table: undefined,
+      }).detail,
+    ).toBe("Chưa đặt mục tiêu · khoảng dự kiến 166–183 cm");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  3 failed | 175 passed (178)`, `Tests  11 failed | 1521 passed (1532)`. Lý do đỏ: chưa có `goalLink`, `HeightGoalLink`; màn Tăng trưởng chưa có thẻ.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/growth/GrowthScreen.tsx b/components/growth/GrowthScreen.tsx
index ff6dc71..64dd390 100644
--- a/components/growth/GrowthScreen.tsx
+++ b/components/growth/GrowthScreen.tsx
@@ -32,6 +32,7 @@ import {
   listRows,
   verdictHead,
 } from "@/lib/rules/growthView";
+import { goalLink } from "@/lib/rules/heightView";
 import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import type { Baby, GrowthRow } from "@/lib/supabase/rows";
 import { GrowthAlertCard } from "./GrowthAlertCard";
@@ -39,6 +40,7 @@ import { GrowthChartCard } from "./GrowthChartCard";
 import { GrowthList } from "./GrowthList";
 import { GrowthSheet } from "./GrowthSheet";
 import { GrowthVerdict } from "./GrowthVerdict";
+import { HeightGoalLink } from "@/components/height/HeightCards";

 function ChartUnavailable() {
   return <p className="h-72 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
@@ -129,6 +131,21 @@ export function GrowthScreen({
           summaries={summaries}
         />
       )}
+      {/* Spec 2026-11-25 §5.3 item 4: also shown with no measurement yet. */}
+      <HeightGoalLink
+        link={goalLink({
+          baby: {
+            name: baby.name,
+            dob: baby.dob,
+            sex,
+            father_height_cm: baby.father_height_cm,
+            mother_height_cm: baby.mother_height_cm,
+            target_height_cm: baby.target_height_cm,
+          },
+          rows: growth.data,
+          table: tables.lhfa,
+        })}
+      />
       {!empty && (
         <>
           <Segmented
diff --git a/components/height/HeightCards.tsx b/components/height/HeightCards.tsx
index 5b79a40..29daa40 100644
--- a/components/height/HeightCards.tsx
+++ b/components/height/HeightCards.tsx
@@ -1,7 +1,9 @@
+import Link from "next/link";
 import type { ReactNode } from "react";
 import { Button } from "@/components/ui/Button";
+import { Icon } from "@/components/ui/Icon";
 import { StatusChip } from "@/components/ui/StatusChip";
-import type { HeightView } from "@/lib/rules/heightView";
+import type { GoalLink, HeightView } from "@/lib/rules/heightView";

 const CARD = "glass flex flex-col rounded-[26px] p-4";
 const LABEL =
@@ -207,3 +209,32 @@ export function VelocityCard({
     </section>
   );
 }
+
+// Spec 2026-11-25 §6.4: the card on the Tăng trưởng page that opens Chiều cao.
+export function HeightGoalLink({ link }: { link: GoalLink }) {
+  return (
+    <Link
+      href="/tang-truong/chieu-cao"
+      className="glass flex min-h-[64px] items-center gap-3 rounded-[26px] p-3 text-ink"
+    >
+      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-text">
+        <Icon name="flag" size={20} strokeWidth={2.2} />
+      </span>
+      <span className="flex min-w-0 flex-1 flex-col">
+        <span className="text-base font-bold">{link.title}</span>
+        {link.detail && (
+          <span
+            className={
+              link.onTrack
+                ? "text-[13px] leading-[18px] font-semibold text-good"
+                : MUTED
+            }
+          >
+            {link.detail}
+          </span>
+        )}
+      </span>
+      <Icon name="chevronRight" size={18} className="text-muted" />
+    </Link>
+  );
+}
diff --git a/lib/rules/heightView.ts b/lib/rules/heightView.ts
index df60700..91faa91 100644
--- a/lib/rules/heightView.ts
+++ b/lib/rules/heightView.ts
@@ -211,3 +211,54 @@ export function goalPreview(
     target: target === null ? null : targetVsRange(target, range),
   };
 }
+
+// Spec 2026-11-25 §6.4: the card on the Tăng trưởng page that opens Chiều cao.
+export type GoalLink = {
+  title: string;
+  // Null while the status cannot be worked out yet.
+  detail: string | null;
+  // The detail is written in good: the baby is on the target line or above it.
+  onTrack: boolean;
+};
+
+export function goalLink(input: {
+  baby: Parameters<typeof heightView>[0]["baby"];
+  // Undefined while they load.
+  rows: GrowthMeasure[] | undefined;
+  table: LmsRow[] | undefined;
+}): GoalLink {
+  const { baby, rows, table } = input;
+  const target = baby.target_height_cm;
+  if (target !== null) {
+    const title = `Mục tiêu chiều cao ${formatCm(target)} cm`;
+    if (!rows || !table) return { title, detail: null, onTrack: false };
+    const [reading] = readings(rows, table, baby.dob, "lhfa");
+    const status = goalStatus({
+      reading: reading ?? null,
+      z: targetZ(target, baby.sex),
+      table,
+    });
+    return {
+      title,
+      detail: status.text,
+      onTrack: status.chip?.tone === "good",
+    };
+  }
+  const title = "Mục tiêu chiều cao";
+  if (baby.father_height_cm === null || baby.mother_height_cm === null)
+    return {
+      title,
+      detail: "Nhập chiều cao bố mẹ để xem khoảng dự kiến",
+      onTrack: false,
+    };
+  const range = midParental(
+    baby.father_height_cm,
+    baby.mother_height_cm,
+    baby.sex,
+  );
+  return {
+    title,
+    detail: `Chưa đặt mục tiêu · khoảng dự kiến ${range.low}–${range.high} cm`,
+    onTrack: false,
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  178 passed (178)`, `Tests  1532 passed (1532)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/heightView.ts lib/rules/heightView.test.ts components/height/HeightCards.tsx components/height/heightcards.test.tsx components/growth/GrowthScreen.tsx components/growth/growthscreen.test.tsx
git commit -m "feat(height): the height goal card on the Tăng trưởng page opens Chiều cao" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Hàng mục tiêu ở chân thẻ Tăng trưởng của trang Sức khỏe (§3.4, §6.4)

**Files:**

- Modify: `lib/rules/heightView.ts`, `components/health/HealthScreen.tsx`
- Test: `lib/rules/heightView.test.ts`, `components/health/health.test.tsx`

**Interfaces:**

- Consumes: `goalStatus`, `targetZ`, `formatCm`, `readings`; `GrowthCard` và biến `measured` của `HealthScreen`; `Icon`.
- Produces: `goalLine(input)`; prop `goal` của `GrowthCard`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/health/health.test.tsx b/components/health/health.test.tsx
index 3681d96..695ce08 100644
--- a/components/health/health.test.tsx
+++ b/components/health/health.test.tsx
@@ -156,6 +156,7 @@ const done = (code: string) =>
 function render(
   query: { growth?: unknown; doses?: unknown; tables?: boolean } = {},
   dob = "2026-09-14",
+  target: number | null = null,
 ) {
   state.growth = (query.growth ?? LOADING) as Record<string, unknown>;
   state.doses = (query.doses ?? LOADING) as Record<string, unknown>;
@@ -166,6 +167,9 @@ function render(
     name: "Bun",
     dob,
     vaccine_choices: CHOSEN,
+    father_height_cm: null,
+    mother_height_cm: null,
+    target_height_cm: target,
   } as unknown as Baby;
   return renderToStaticMarkup(<HealthScreen baby={baby} />);
 }
@@ -321,12 +325,53 @@ describe("HealthScreen: the Tăng trưởng card", () => {
       );
   });

-  it("has no goal line yet", () => {
-    const card = link(
-      render({ growth: loaded([measure("2026-11-15", 5500)]), tables: true }),
-      HEALTH_GROWTH.href,
+  // Spec 2026-11-25 §3.4 and §6.4: the line at the foot of the card.
+  const goalCard = (growth: unknown, target: number | null, tables = true) =>
+    link(render({ growth, tables }, "2026-09-14", target), HEALTH_GROWTH.href);
+
+  it("no target: no goal line", () => {
+    expect(goalCard(loaded([measure("2026-11-15", 5500)]), null)).not.toContain(
+      "Mục tiêu",
+    );
+  });
+
+  it("a target: a flag, the target and where the baby stands against its line", () => {
+    // 180 cm is z +0,47 for a man: the line is at 61,96 cm. 58,5 cm is 3,5 under.
+    const card = goalCard(loaded([measure("2026-11-15", 5500)]), 180);
+    expect(card).toContain(`d="${ICON_PATHS.flag}"`);
+    expect(card).toContain(
+      ">Mục tiêu 180 cm: dưới đường mục tiêu 3,5 cm</span>",
+    );
+    // A long line wraps onto two: the flag stays level with the first.
+    expect(card).toContain(
+      '<span class="flex items-start gap-2 border-t border-line pt-3 text-[13px] leading-[18px] text-ink">',
     );
-    expect(card).not.toContain("Mục tiêu");
+    expect(card).toContain("mt-px shrink-0 text-accent");
+    // It is the last thing in the card, under the three values.
+    expect(card.indexOf("Mục tiêu 180 cm")).toBeGreaterThan(
+      card.indexOf(">Vòng đầu</span>"),
+    );
+  });
+
+  it("a target, on the line: says on track", () => {
+    expect(goalCard(loaded([measure("2026-11-15", 5500, 62)]), 180)).toContain(
+      ">Mục tiêu 180 cm: đang đúng hướng</span>",
+    );
+  });
+
+  it("a target, no length measured yet: says so", () => {
+    expect(
+      goalCard(loaded([measure("2026-11-15", 5500, null)]), 180),
+    ).toContain(">Mục tiêu 180 cm: chưa có lần đo chiều dài</span>");
+  });
+
+  it("no goal line until the measurements and the tables have loaded, or with no measurement", () => {
+    for (const card of [
+      goalCard(loaded([measure("2026-11-15", 5500)]), 180, false),
+      goalCard(LOADING, 180),
+      goalCard(loaded([]), 180),
+    ])
+      expect(card).not.toContain("Mục tiêu 180");
   });
 });

diff --git a/lib/rules/heightView.test.ts b/lib/rules/heightView.test.ts
index 02d00ca..a7d9a0e 100644
--- a/lib/rules/heightView.test.ts
+++ b/lib/rules/heightView.test.ts
@@ -2,7 +2,13 @@ import { describe, expect, it } from "vitest";
 import type { LmsRow } from "@/lib/content/who";
 import { addDays } from "./days";
 import type { GrowthMeasure } from "./growthAlerts";
-import { goalLink, goalPreview, heightView, rangeBar } from "./heightView";
+import {
+  goalLine,
+  goalLink,
+  goalPreview,
+  heightView,
+  rangeBar,
+} from "./heightView";

 const DOB = "2026-01-01";
 // The baby is 76 days old "today".
@@ -368,3 +374,33 @@ describe("goalLink", () => {
     ).toBe("Chưa đặt mục tiêu · khoảng dự kiến 166–183 cm");
   });
 });
+
+// Spec 2026-11-25 §3.4: the line at the foot of the growth card on Sức khỏe.
+describe("goalLine", () => {
+  const line = (
+    over: Partial<Parameters<typeof heightView>[0]["baby"]> = {},
+    rows: GrowthMeasure[] = [length(76, 17.5)],
+  ) => goalLine({ baby: baby(over), rows, table: FLAT });
+
+  it("the target and, in lower case, where the baby stands", () => {
+    expect(line()).toBe("Mục tiêu 180 cm: đang đúng hướng");
+    expect(line({}, [length(76, 19)])).toBe("Mục tiêu 180 cm: đang đúng hướng");
+    expect(line({}, [length(76, 15)])).toBe(
+      "Mục tiêu 180 cm: dưới đường mục tiêu 1,9 cm",
+    );
+  });
+
+  it("no length inside the WHO table yet: says so", () => {
+    expect(line({}, [])).toBe("Mục tiêu 180 cm: chưa có lần đo chiều dài");
+  });
+
+  it("a target with a decimal keeps it", () => {
+    expect(line({ target_height_cm: 165.5 }, [])).toBe(
+      "Mục tiêu 165,5 cm: chưa có lần đo chiều dài",
+    );
+  });
+
+  it("no target: no line, whatever the parents' heights", () => {
+    expect(line({ target_height_cm: null })).toBeNull();
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  2 failed | 176 passed (178)`, `Tests  7 failed | 1533 passed (1540)`. Lý do đỏ: chưa có `goalLine`; thẻ chưa có hàng mục tiêu.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/health/HealthScreen.tsx b/components/health/HealthScreen.tsx
index 1671f4e..741b218 100644
--- a/components/health/HealthScreen.tsx
+++ b/components/health/HealthScreen.tsx
@@ -31,6 +31,7 @@ import {
   latestGrowth,
 } from "@/lib/rules/growthForm";
 import { indicatorSummaries } from "@/lib/rules/growthView";
+import { goalLine } from "@/lib/rules/heightView";
 import { vnDateString } from "@/lib/rules/time";
 import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
 import { buildSchedule, nextDose } from "@/lib/rules/vaccines";
@@ -69,10 +70,14 @@ function growthCells(latest: LatestGrowth): [title: string, value: string][] {
 export function GrowthCard({
   latest,
   status,
+  goal = null,
 }: {
   latest: LatestGrowth | null;
   // null: the alerts are not worked out yet, so there is no chip.
   status: { text: string; tone: GrowthTone } | null;
+  // Spec §3.4: "Mục tiêu {t} cm: {trạng thái}"; null without a target, and
+  // until the status can be worked out.
+  goal?: string | null;
 }) {
   return (
     <Link
@@ -116,6 +121,19 @@ export function GrowthCard({
           ))}
         </span>
       )}
+      {latest && goal && (
+        <span className="flex items-start gap-2 border-t border-line pt-3 text-[13px] leading-[18px] text-ink">
+          <Icon
+            name="flag"
+            size={16}
+            strokeWidth={2.2}
+            // 16 px in an 18 px line: level with the first line when the
+            // text wraps onto two.
+            className="mt-px shrink-0 text-accent"
+          />
+          <span>{goal}</span>
+        </span>
+      )}
     </Link>
   );
 }
@@ -167,6 +185,20 @@ export function HealthScreen({ baby }: { baby: Baby }) {
           indicatorSummaries({ ...measured, alerts }).map((item) => item.near),
         )
       : null;
+  const goal = measured
+    ? goalLine({
+        baby: {
+          name: baby.name,
+          dob: baby.dob,
+          sex,
+          father_height_cm: baby.father_height_cm,
+          mother_height_cm: baby.mother_height_cm,
+          target_height_cm: baby.target_height_cm,
+        },
+        rows: measured.rows,
+        table: measured.tables.lhfa,
+      })
+    : null;
   const attention = attentionItems({ growth: alerts, vaccine: next, today });
   const live: Partial<Record<string, LiveLine>> = {
     "/tiem-chung": {
@@ -203,6 +235,7 @@ export function HealthScreen({ baby }: { baby: Baby }) {
         <GrowthCard
           latest={growth.data ? latestGrowth(growth.data) : null}
           status={status}
+          goal={goal}
         />
         <div className="grid grid-cols-2 gap-2.5">
           {HEALTH_CARDS.map((item) => (
diff --git a/lib/rules/heightView.ts b/lib/rules/heightView.ts
index 91faa91..b6ade6d 100644
--- a/lib/rules/heightView.ts
+++ b/lib/rules/heightView.ts
@@ -262,3 +262,22 @@ export function goalLink(input: {
     onTrack: false,
   };
 }
+
+// Spec 2026-11-25 §3.4: the line at the foot of the growth card on the Sức
+// khỏe page. Null without a target.
+export function goalLine(input: {
+  baby: Parameters<typeof heightView>[0]["baby"];
+  rows: GrowthMeasure[];
+  table: LmsRow[];
+}): string | null {
+  const { baby, rows, table } = input;
+  const target = baby.target_height_cm;
+  if (target === null) return null;
+  const [reading] = readings(rows, table, baby.dob, "lhfa");
+  const status = goalStatus({
+    reading: reading ?? null,
+    z: targetZ(target, baby.sex),
+    table,
+  });
+  return `Mục tiêu ${formatCm(target)} cm: ${status.short}`;
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  178 passed (178)`, `Tests  1540 passed (1540)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/heightView.ts lib/rules/heightView.test.ts components/health/HealthScreen.tsx components/health/health.test.tsx
git commit -m "feat(health): the height goal line at the foot of the growth card" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M3d và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-height/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  178 passed (178)`, `Tests  1540 passed (1540)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm cho các trạng thái dữ liệu thật chưa có**

Trang này không đọc hay ghi dữ liệu của gia đình; nó dựng hai khối từ chữ cho sẵn. Tạo `app/fixture-height/page.tsx`:

```tsx
"use client";

import { GrowthCard } from "@/components/health/HealthScreen";
import { HeightGoalLink } from "@/components/height/HeightCards";
import type { GoalLink } from "@/lib/rules/heightView";

// Thẻ lối vào ở màn Tăng trưởng, ở mọi trạng thái của §6.4.
const LINKS: GoalLink[] = [
  {
    title: "Mục tiêu chiều cao 180 cm",
    detail: "Sát đường mục tiêu",
    onTrack: true,
  },
  {
    title: "Mục tiêu chiều cao 190,5 cm",
    detail: "Trên đường mục tiêu 12,4 cm",
    onTrack: true,
  },
  {
    title: "Mục tiêu chiều cao 180 cm",
    detail: "Dưới đường mục tiêu 4,0 cm",
    onTrack: false,
  },
  {
    title: "Mục tiêu chiều cao 180 cm",
    detail: "Chưa có lần đo chiều dài",
    onTrack: false,
  },
  { title: "Mục tiêu chiều cao 180 cm", detail: null, onTrack: false },
  {
    title: "Mục tiêu chiều cao",
    detail: "Nhập chiều cao bố mẹ để xem khoảng dự kiến",
    onTrack: false,
  },
  {
    title: "Mục tiêu chiều cao",
    detail: "Chưa đặt mục tiêu · khoảng dự kiến 166–183 cm",
    onTrack: false,
  },
];

// Thẻ Tăng trưởng của trang Sức khỏe với hàng mục tiêu ở chân thẻ.
const LATEST = {
  measuredOn: "2026-11-25",
  weightG: 5700,
  lengthCm: 56.9,
  headCm: 39.9,
};
const GOALS: (string | null)[] = [
  "Mục tiêu 180 cm: đang đúng hướng",
  "Mục tiêu 190,5 cm: dưới đường mục tiêu 12,4 cm",
  "Mục tiêu 180 cm: chưa có lần đo chiều dài",
  null,
];

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture lối vào trang Chiều cao</p>
      {LINKS.map((link, index) => (
        <HeightGoalLink key={index} link={link} />
      ))}
      {GOALS.map((goal, index) => (
        <GrowthCard
          key={index}
          latest={LATEST}
          status={{ text: "Gần mức thấp", tone: "warn" }}
          goal={goal}
        />
      ))}
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 7). Chạy `bun run dev`. Cỡ 375×812.

Trên trang tạm `http://localhost:3000/fixture-height`:

1. **Bảy thẻ lối vào.** Mỗi thẻ có vòng tròn lá cờ bên trái, mũi tên bên phải, không chữ nào bị cắt hay tràn. Hai thẻ đầu có dòng phụ màu xanh, đậm ("Sát đường mục tiêu", "Trên đường mục tiêu 12,4 cm"). Thẻ thứ ba và thứ tư có dòng phụ màu xám ("Dưới đường mục tiêu 4,0 cm", "Chưa có lần đo chiều dài"). Thẻ thứ năm chỉ có tên. Thẻ thứ sáu và thứ bảy ghi "Mục tiêu chiều cao" với dòng phụ xám; ghi lại dòng phụ của hai thẻ này nằm trên một hay hai dòng.
2. **Bốn thẻ Tăng trưởng của trang Sức khỏe.** Ba thẻ đầu có, dưới ba số đo, một đường kẻ rồi hàng có lá cờ màu nhấn: "Mục tiêu 180 cm: đang đúng hướng"; "Mục tiêu 190,5 cm: dưới đường mục tiêu 12,4 cm" (ghi lại một hay hai dòng; hai dòng thì lá cờ đứng ở dòng đầu, chữ dòng hai thẳng hàng với chữ dòng một); "Mục tiêu 180 cm: chưa có lần đo chiều dài". Thẻ thứ tư không có hàng này và không có đường kẻ thừa.
3. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
4. Lặp mục 1 và 2 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: dòng phụ xanh, lá cờ và các dòng xám đọc rõ. Ở `night` màu xanh và màu cảnh báo trùng nhau: dòng "đang đúng hướng" vẫn phải nhận ra được nhờ chữ đậm.

Trang thật (dữ liệu thật của gia đình: chỉ xem):

5. `http://localhost:3000/tang-truong`: giữa thẻ kết luận và thanh chọn chỉ số có thẻ "Mục tiêu chiều cao". Ghi lại dòng phụ đang thấy; khi gia đình chưa nhập gì, kỳ vọng "Nhập chiều cao bố mẹ để xem khoảng dự kiến". Chạm thẻ: tới `/tang-truong/chieu-cao`; nút quay lại đưa về `/tang-truong`.
6. `http://localhost:3000/suc-khoe`: ghi lại thẻ Tăng trưởng có hàng mục tiêu hay không. Khi gia đình chưa đặt mục tiêu, kỳ vọng không có hàng đó và thẻ giống hệt trước M3d.
7. Nếu gia đình đã tự nhập mục tiêu trước lúc kiểm: ghi lại câu của thẻ ở màn Tăng trưởng và của hàng ở trang Sức khỏe, và kiểm hai nơi cùng nói một trạng thái với thẻ mục tiêu của trang Chiều cao.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả kiểm (2026-11-25).** Bốn patch áp sạch bằng `kb_patch`, không sửa tay. Đỏ và xanh đúng `Expected`: Task 1 đỏ `3 failed | 175 passed (178)`, `11 failed | 1521 passed (1532)`, xanh 178 / 1532; Task 2 đỏ `2 failed | 176 passed (178)`, `7 failed | 1533 passed (1540)`, xanh 178 / 1540. Cuối: `bun run typecheck` sạch; `Test Files  178 passed (178)`, `Tests  1540 passed (1540)`; `bun run build` lần đầu mã 1 (thông báo bảo mật của Next.js 16.4.3, không chạy `next upgrade`), lần hai mã 0, 40/40 trang.

Trình duyệt: người dùng chọn khung Browser trong app; 375×812; còn đăng nhập; theme mở sẵn là `night`. Trên trang thật chỉ mở trang, chạm thẻ lối vào và nút quay lại; không mở sheet, không bấm "Lưu", không đổi gì.

Trang tạm (thẻ rộng 343 px):

1. **Đạt.** Bảy thẻ lối vào đều có vòng lá cờ 40 px, mũi tên, tên một dòng, không chữ nào bị cắt hay tràn (mép phải xa nhất 346 px, thẻ tới 359 px). Hai thẻ đầu: dòng phụ màu `good`, đậm 600. Thẻ ba và bốn: dòng phụ xám, đậm 400. Thẻ năm chỉ có tên (cao 66 px; thẻ có dòng phụ một dòng cao 68 px). Thẻ sáu "Nhập chiều cao bố mẹ để xem khoảng dự kiến" và thẻ bảy "Chưa đặt mục tiêu · khoảng dự kiến 166–183 cm": dòng phụ nằm **hai dòng** (chỗ cho chữ khoảng 237 px), thẻ cao 86 px.
2. **Đạt, có hai chỗ ghi ở dưới.** Ba thẻ đầu có đường kẻ rồi hàng lá cờ. "Mục tiêu 180 cm: đang đúng hướng" và "Mục tiêu 180 cm: chưa có lần đo chiều dài": một dòng. "Mục tiêu 190,5 cm: dưới đường mục tiêu 12,4 cm": **hai dòng**, dòng hai chỉ có chữ "cm". Khi hai dòng: mép trên lá cờ cao hơn mép trên chữ dòng đầu 0,5 px, tâm lá cờ trùng tâm dòng đầu (lệch 0 px), chữ dòng hai thẳng hàng với chữ dòng một (lệch 0 px). Thẻ thứ tư không có hàng này, không có đường kẻ, cao 132 px.
3. **Đạt.** `scrollWidth` 375, `innerWidth` 375, ở cả 7 theme.
4. **Đạt ở `rose`, `light`, `dark`; ở `night` có chỗ A.** Số dòng và vị trí giống nhau ở cả 7 theme (`peach`, `lavender`, `sea` chỉ đo, không chụp). Dòng phụ xanh, dòng xám, lá cờ trong vòng tròn đọc rõ ở bốn theme đã chụp. Ở `night` dòng "Sát đường mục tiêu" cùng màu với tên thẻ, nhận ra nhờ chữ đậm.

Trang thật (`night`):

5. **Đạt.** `/tang-truong`: thẻ "Mục tiêu chiều cao" nằm ngay sau thẻ kết luận và ngay trước thanh chọn chỉ số (cách mỗi bên 18 px), dòng phụ "Nhập chiều cao bố mẹ để xem khoảng dự kiến" (xám, hai dòng). Chạm thẻ: tới `/tang-truong/chieu-cao`. Nút "Tăng trưởng" ở đầu trang đó: về `/tang-truong`.
6. **Đạt.** `/suc-khoe`: thẻ Tăng trưởng không có hàng mục tiêu, không có đường kẻ, cao 132 px như thẻ thứ tư của trang tạm.
7. **Chưa kiểm.** Gia đình chưa đặt mục tiêu và chưa nhập chiều cao bố mẹ (trang Chiều cao ghi "Chưa có mục tiêu chiều cao"), nên chưa thấy trạng thái "đã có mục tiêu" trên dữ liệu thật.

Chỗ chưa đẹp, chưa sửa:

- **A. Lá cờ của hàng mục tiêu ở trang Sức khỏe quá tối ở theme `night`.** Hàng này tô lá cờ bằng `text-accent` (spec §3.4 ghi "màu `accent`"). Ở `night`, `accent` là màu nền của nút (`#6b2a12`), không phải màu cho nét vẽ: đo trên ảnh chụp, lá cờ so với nền thẻ chỉ đạt tương phản khoảng 1,65:1 (chữ bên cạnh 7,8:1). Ở sáu theme còn lại lá cờ đọc rõ. Trong app, đây là chỗ duy nhất dùng `text-accent`; 12 chỗ khác dùng `text-accent-text`. Đề xuất: đổi lá cờ sang `text-accent-text` (token có sẵn; năm theme sáng không đổi màu vì hai token bằng nhau, `dark` sáng hơn một chút, `night` lên khoảng 8:1), siết test cho đúng tên lớp, sửa §3.4 của spec.
- **B. Chữ "cm" đứng một mình ở dòng hai** khi hàng mục tiêu dài hơn 285 px. Đo ở 375 px: "Mục tiêu 180 cm: dưới đường mục tiêu 12,4 cm" rộng 282,8 px, vừa một dòng; "Mục tiêu 185,5 cm: dưới đường mục tiêu 9,9 cm" rộng 287,5 px, xuống dòng. Nghĩa là chỉ mục tiêu có phần lẻ mới gặp; mục tiêu 180 cm thì không. Plan cho phép hai dòng. Nếu muốn sửa: dùng dấu cách không ngắt trước "cm" để "12,4 cm" xuống dòng cùng nhau.

Chưa kiểm: trạng thái "đã có mục tiêu" trên trang thật (mục 7); lúc đang tải, mất mạng; phía thành viên; bé quá 5 tuổi; ảnh chụp `peach`, `lavender`, `sea`; 440 px; trình đọc màn hình; iPhone thật, PWA.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-height
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m3d.md
git commit -m "docs(plan): record the M3d check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; chỗ nào chưa đẹp thì nêu trước, kèm cách sửa. Nói rõ: sau khi nhánh này lên `main`, cả nhà sẽ thấy thẻ "Mục tiêu chiều cao" trên màn Tăng trưởng. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m3d
git push origin main
```
