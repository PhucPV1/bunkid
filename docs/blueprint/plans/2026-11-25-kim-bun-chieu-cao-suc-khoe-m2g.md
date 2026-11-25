# Kim Bun — Sức khỏe M2g: hàng danh sách khi chip dài, và chip gần ranh trên trang Sức khỏe Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§5.5 (chỗ đặt chip và dấu chờ đồng bộ); chip của thẻ Tăng trưởng ở §3.4 theo §5.6; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng duyệt cả các chỗ sửa spec nêu ở mục Diễn giải spec; sinh lại cùng ngày trên nền nhánh M2f, nội dung patch không đổi)

**Goal:** Hàng của danh sách các lần đo không bao giờ ngắt tiêu đề hay đẩy dấu chờ đồng bộ xuống một dòng riêng, kể cả với chip dài; thẻ Tăng trưởng ở trang Sức khỏe ghi "Gần mức thấp", "Gần mức cao" hoặc "Gần ranh chuẩn" khi bé gần ranh.

**Architecture:**

- **Danh sách:** `GrowthList` cho tiêu đề của hàng không ngắt dòng và cho hàng đầu được xuống dòng theo khối (chip rớt xuống dưới tiêu đề khi không đủ chỗ); dấu chờ đồng bộ chuyển xuống sau các số đo.
- **Trang Sức khỏe:** `HealthScreen` gọi `indicatorSummaries` để biết chỉ số nào gần ranh rồi đưa vào `growthStatus`; trên thẻ, chip đứng thay chỗ mũi tên. `GrowthCard` được export để trang tạm dựng được.
- Không đổi luật nào. Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Recharts 3.10.1, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m2g`, cắt từ nhánh `feat/kim-bun-suc-khoe-m2f` @ `8a16015`, **không phải từ `main`**: người dùng đã chọn giữ M2f trên nhánh để đẩy M2f và M2g một lần. Ở Step 0 của Task 1 dùng `git checkout feat/kim-bun-suc-khoe-m2f && git checkout -b feat/kim-bun-suc-khoe-m2g` thay cho lệnh ghi ở đó (không `git pull`: nhánh M2f chưa có trên remote). Lệnh đưa lên `main` ở task cuối dùng được nguyên vì nhánh này chứa cả M2f. Baseline: 1381 test vitest xanh (171 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                 | Plan                                           |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| M1a, M1b, M1c      | §3, §4 dòng 2 và 3                                       | đã xong, ở `main`                              |
| M2a đến M2e        | §5.1 đến §5.5, chip và dòng 1 của §4 trên trang Sức khỏe | đã xong, ở `main` @ `da04808`                  |
| M2f                | §5.6: luật gần ranh, số chuẩn, thẻ kết luận              | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2f.md` |
| **M2g (plan này)** | §5.5 hàng danh sách khi chip dài; chip gần ranh của §3.4 | `2026-11-25-kim-bun-chieu-cao-suc-khoe-m2g.md` |
| M3                 | §6 Chiều cao, thẻ mục tiêu của §5.3                      | chưa viết                                      |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4           | chưa viết                                      |
| M5                 | §8 Push, dòng 4 của §4, §9.3                             | chưa viết                                      |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **§5.6 chia hai plan** (spec §10 đã ghi lại). Làm một plan thì bản dựng thử ra khoảng 1.900 dòng, quá sức đọc, nên cắt ở chỗ app vẫn chạy trọn vẹn: **M2f** có luật gần ranh, số chuẩn và thẻ kết luận của màn Tăng trưởng (điều người dùng hỏi: ghi "bình thường nhưng gần mức thấp" và cho thấy chuẩn là bao nhiêu); **M2g** lo hàng của danh sách khi chip dài và chip gần ranh trên trang Sức khỏe.
2. **Ba chỗ bố cục dưới đây không có trong bản spec đã duyệt.** Chúng được ghi thêm vào spec ngày 2026-11-25 lúc viết plan này (§3.4 và §5.5, có đánh dấu); người dùng đã duyệt cùng plan này ngày 2026-11-25. Lý do là bề ngang: ở 375 px, hàng danh sách và thẻ đều còn 311 px cho nội dung. Các con số dưới là ước lượng từ số đo chữ của font hệ thống, chưa đo trong trình duyệt; Task 3 xem lại trên trang tạm.
   - **Tiêu đề hàng không ngắt; chip dài thì xuống dưới tiêu đề.** Chip "Gần mức thấp" rộng khoảng 111 px, chừa 188 px cho tiêu đề; "25/11 · 11 tháng 29 ngày" cần khoảng 189 px. Cách khác đã cân nhắc: để tiêu đề ngắt làm hai dòng (chữ "ngày" rớt riêng), hoặc rút chữ của chip.
   - **Dấu chờ đồng bộ đứng sau các số đo** (dòng 2, có trọn bề ngang) thay vì sau tiêu đề. Đây là chỗ lần kiểm trình duyệt của M2e để lại: dấu rớt xuống một dòng riêng khi tiêu đề dài.
   - **Trên thẻ Tăng trưởng của trang Sức khỏe, chip đứng thay chỗ mũi tên.** Chip "Gần ranh chuẩn" rộng khoảng 122 px; cùng mũi tên thì cột tên thẻ chỉ còn khoảng 99 px, mà "Đo gần nhất 25/11" cần khoảng 110 px. Thẻ chưa có chip vẫn có mũi tên. Cách khác đã cân nhắc: giữ mũi tên và rút chữ của chip (ví dụ "Gần ranh"), tức là đổi chữ người dùng đã duyệt.
3. **Trang Sức khỏe gọi `indicatorSummaries`** chỉ để lấy `near` của từng chỉ số, để luật "có cảnh báo thì không gần ranh" chỉ nằm ở một chỗ.
4. **`GrowthCard` được export** từ `components/health/HealthScreen.tsx` để trang tạm của Task 3 dựng được thẻ ở mọi trạng thái; ngoài ra không ai dùng.
5. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2g.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ nhánh `feat/kim-bun-suc-khoe-m2f` @ `8a16015`. **Sinh lại ngày 2026-11-25, sau khi plan đã được duyệt:** trong lúc kiểm M2f người dùng cho bỏ câu "… hơn {n} trong 100 bé …" khỏi các màn (commit `163040c`), nên M2f kết thúc ở 1381 test, 171 file thay vì 1383 test, 172 file. Bốn patch của plan này không đổi nội dung và vẫn áp sạch; chỉ số test được đo lại. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang tạm của task cuối đã qua `tsc --noEmit`, và các trường hợp của nó đã được chạy qua luật với bảng WHO thật (chữ kỳ vọng ở bước trình duyệt lấy từ lần chạy đó). Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 3 dừng lại hỏi, không tự push. Người dùng không muốn đẩy một thay đổi còn lỗi đã biết: nếu bước trình duyệt lộ ra lỗi thì nêu lỗi và cách sửa trước, rồi mới hỏi.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn).

## Contracts with Other Plans

Plan này đứng ngay sau M2f (đang ở nhánh `feat/kim-bun-suc-khoe-m2f`, chưa lên `main`) và là plan cuối của mốc M2. M3 dùng màn Tăng trưởng và trang Sức khỏe này để thêm mục tiêu chiều cao.

**Consumes (từ M2f):** `growthStatus(alerts, near?)`, `NearKind` (`lib/rules/growthAlerts.ts`); `indicatorSummaries(input: { rows; tables; dob; alerts })` (sau commit `163040c` không còn nhận `sex`; truyền thừa `sex` trong object trải ra vẫn biên dịch được) và trường `near` của `IndicatorSummary` (`lib/rules/growthView.ts`). Từ các plan trước: `GrowthList`, `GrowthListItem`, `PendingMark`, `StatusChip`; `HealthScreen`, `growthAlerts`, `latestGrowth`.

**Produces:**

- `components/growth/GrowthList.tsx`: prop không đổi; hàng đầu của mỗi hàng là `flex flex-wrap`, tiêu đề `whitespace-nowrap`, dấu chờ đồng bộ nằm trong dòng số đo.
- `components/health/HealthScreen.tsx`: `export function GrowthCard({ latest: LatestGrowth | null; status: { text: string; tone: GrowthTone } | null })`; chip của thẻ có thêm ba dạng "Gần mức thấp", "Gần mức cao", "Gần ranh chuẩn"; thẻ có chip thì không có mũi tên.
- **Vitest sau M2g:** 1389 test, 171 file.

---

### Task 1: Hàng danh sách: chip dài xuống dưới tiêu đề, dấu chờ đồng bộ theo số đo (§5.5)

**Files:**

- Modify: `components/growth/GrowthList.tsx`
- Test: `components/growth/growthlist.test.tsx`

**Interfaces:**

- Consumes: `GrowthListItem`, `StatusChip`, `PendingMark`.
- Produces: bố cục hàng mới; prop của `GrowthList` không đổi.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m2g
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/growth/growthlist.test.tsx b/components/growth/growthlist.test.tsx
index 4975015..4456eeb 100644
--- a/components/growth/growthlist.test.tsx
+++ b/components/growth/growthlist.test.tsx
@@ -72,12 +72,63 @@ describe("GrowthList", () => {
     const [head, values, delta] = Children.toArray(
       button.props.children,
     ) as ReactElement<TreeProps>[];
-    expect(head.props.className).toBe("flex items-start gap-3");
+    expect(head.props.className).toContain("flex ");
     expect(findElements(head, (el) => el.type === StatusChip)).toHaveLength(1);
-    expect(values.props.children).toBe("5,2 kg · 58,5 cm");
+    expect(renderToStaticMarkup(values)).toContain(">5,2 kg · 58,5 cm");
     expect(delta.props.children).toBe("+0,8 kg · +3,5 cm so với lần trước");
   });

+  // Spec 2026-11-25 §5.5. At 375 px "Gần mức thấp" leaves the title 188 px,
+  // and "25/11 · 11 tháng 29 ngày" needs 189.
+  it("the title is never broken: a chip too long to share its line drops under it", () => {
+    const [button] = findElements(
+      GrowthList(
+        props({
+          items: [
+            item("g1", "u1", {
+              title: "25/11 · 11 tháng 29 ngày",
+              chip: { text: "Gần mức thấp", tone: "warn" },
+            }),
+          ],
+        }),
+      ),
+      (el) => el.type === "button",
+    );
+    const [head] = Children.toArray(
+      button.props.children,
+    ) as ReactElement<TreeProps>[];
+    expect(head.props.className).toBe(
+      "flex flex-wrap items-start gap-x-3 gap-y-1",
+    );
+    const [title] = Children.toArray(
+      head.props.children,
+    ) as ReactElement<TreeProps>[];
+    expect(title.props.className).toContain("whitespace-nowrap");
+    expect(title.props.className).toContain("flex-1");
+    expect(title.props.className).not.toContain("min-w-0");
+    expect(title.props.children).toBe("25/11 · 11 tháng 29 ngày");
+  });
+
+  // Beside the title the mark took the room the chip needs and dropped to a
+  // line of its own; the values line has the full width.
+  it("the waiting-to-sync mark follows the values, not the title", () => {
+    const [button] = findElements(
+      GrowthList(props()),
+      (el) => el.type === "button",
+    );
+    const [head, values] = Children.toArray(
+      button.props.children,
+    ) as ReactElement<TreeProps>[];
+    expect(renderToStaticMarkup(head)).not.toContain("Chờ đồng bộ");
+    expect(renderToStaticMarkup(values)).toContain(
+      '>5,2 kg · 58,5 cm <span role="img" aria-label="Chờ đồng bộ"',
+    );
+    // A row that is not waiting keeps its values line as it was.
+    expect(renderToStaticMarkup(<GrowthList {...props()} />)).toContain(
+      '<span class="text-[15px] text-ink tabular-nums">5,2 kg · 58,5 cm</span>',
+    );
+  });
+
   it("the words Ngoài bảng WHO sit beside the title too", () => {
     const [button] = findElements(
       GrowthList(
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 170 passed (171)`, `Tests  2 failed | 1381 passed (1383)`. Lý do đỏ: hàng đầu chưa `flex-wrap`, tiêu đề chưa `whitespace-nowrap`, dấu chờ đồng bộ còn nằm sau tiêu đề.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/components/growth/GrowthList.tsx b/components/growth/GrowthList.tsx
index 2732e00..0dfdaab 100644
--- a/components/growth/GrowthList.tsx
+++ b/components/growth/GrowthList.tsx
@@ -29,10 +29,12 @@ export function GrowthList({
           >
             {/* The chip shares a line with the title only: beside the whole
                 row it left the values too narrow at 375 px and they broke
-                between a number and its unit. */}
-            <span className="flex items-start gap-3">
-              <span className="min-w-0 flex-1 text-base font-semibold text-ink tabular-nums">
-                {title} <PendingMark pending={pending.has(row.id)} />
+                between a number and its unit. The title is never broken: a
+                chip too long to share its line ("Gần mức thấp" beside
+                "25/11 · 11 tháng 29 ngày") drops under it. */}
+            <span className="flex flex-wrap items-start gap-x-3 gap-y-1">
+              <span className="flex-1 text-base font-semibold whitespace-nowrap text-ink tabular-nums">
+                {title}
               </span>
               {chip ? (
                 <StatusChip tone={chip.tone}>{chip.text}</StatusChip>
@@ -44,7 +46,17 @@ export function GrowthList({
                 )
               )}
             </span>
-            <span className="text-[15px] text-ink tabular-nums">{values}</span>
+            {/* The waiting-to-sync mark follows the values: that line has the
+                full width, so the mark never pushes the chip or the title. */}
+            <span className="text-[15px] text-ink tabular-nums">
+              {values}
+              {pending.has(row.id) && (
+                <>
+                  {" "}
+                  <PendingMark pending />
+                </>
+              )}
+            </span>
             {delta && (
               <span className="text-[13px] leading-[18px] text-muted">
                 {delta}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  171 passed (171)`, `Tests  1383 passed (1383)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/growth/GrowthList.tsx components/growth/growthlist.test.tsx
git commit -m "fix(growth): a long chip drops under the title of its row; the sync mark follows the values" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Trang Sức khỏe: chip gần ranh, chip thay chỗ mũi tên (§3.4, §5.6)

**Files:**

- Modify: `components/health/HealthScreen.tsx`
- Test: `components/health/health.test.tsx`

**Interfaces:**

- Consumes: `growthStatus(alerts, near?)` (M2f); `indicatorSummaries` (M2f); `growthAlerts`; `StatusChip`.
- Produces: `GrowthCard` được export; chip gần ranh trên thẻ; thẻ có chip thì không có mũi tên.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/health/health.test.tsx b/components/health/health.test.tsx
index c8722c9..3681d96 100644
--- a/components/health/health.test.tsx
+++ b/components/health/health.test.tsx
@@ -413,6 +413,78 @@ describe("HealthScreen: growth alerts", () => {
       '<span class="text-[13px] font-semibold text-danger">Nên cho bé đi khám.</span>',
     );
   });
+
+  // Spec 2026-11-25 §5.6: near the edge of the norm is said on the chip, and
+  // never in "Cần chú ý".
+  it("near the low edge: the chip Gần mức thấp and no growth row", () => {
+    // 4,6 kg against a 5,5 kg median is z −1,31.
+    const page = render({
+      growth: loaded([measure("2026-11-15", 4600)]),
+      doses: loaded([]),
+      tables: true,
+    });
+    expect(growthCard(page)).toContain(
+      `${CHIP} bg-warn-soft text-warn-ink">Gần mức thấp</span>`,
+    );
+    expect(growthRow(page)).toBeNull();
+  });
+
+  it("near the high edge: the chip Gần mức cao", () => {
+    // 6,5 kg is z +1,45.
+    const page = render({
+      growth: loaded([measure("2026-11-15", 6500)]),
+      tables: true,
+    });
+    expect(growthCard(page)).toContain(
+      `${CHIP} bg-warn-soft text-warn-ink">Gần mức cao</span>`,
+    );
+  });
+
+  it("one indicator near each edge: the chip Gần ranh chuẩn", () => {
+    // 50 cm against a 58,5 cm median is z −1,16.
+    const page = render({
+      growth: loaded([measure("2026-11-15", 6500, 50)]),
+      tables: true,
+    });
+    expect(growthCard(page)).toContain(
+      `${CHIP} bg-warn-soft text-warn-ink">Gần ranh chuẩn</span>`,
+    );
+  });
+
+  it("an alert on another indicator wins over near the edge", () => {
+    const page = render({
+      growth: loaded([measure("2026-11-15", 4000, 50)]),
+      tables: true,
+    });
+    expect(growthCard(page)).toContain(">Cần chú ý</span>");
+    expect(growthCard(page)).not.toContain("Gần");
+  });
+
+  it("only the newest measurement of an indicator can be near the edge", () => {
+    const page = render({
+      growth: loaded([
+        measure("2026-11-15", 5500),
+        measure("2026-10-14", 4600),
+      ]),
+      tables: true,
+    });
+    expect(growthCard(page)).toContain(">Lớn đều</span>");
+  });
+
+  // At 375 px "Gần ranh chuẩn" and the arrow together leave the name of the
+  // card less room than it needs.
+  it("the chip takes the place of the arrow; a card with no chip keeps the arrow", () => {
+    const withChip = growthCard(
+      render({ growth: loaded([measure("2026-11-15", 5500)]), tables: true }),
+    );
+    expect(withChip).toContain(">Lớn đều</span>");
+    expect(withChip).not.toContain(ICON_PATHS.chevronRight);
+    for (const page of [
+      render({ growth: loaded([measure("2026-11-15", 5500)]) }),
+      render({ growth: loaded([]), tables: true }),
+    ])
+      expect(growthCard(page)).toContain(`d="${ICON_PATHS.chevronRight}"`);
+  });
 });

 describe("HealthScreen: the Tiêm chủng and Phát triển cards", () => {
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 170 passed (171)`, `Tests  4 failed | 1385 passed (1389)`. Lý do đỏ: thẻ chưa đọc trạng thái gần ranh và còn vẽ mũi tên cạnh chip.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/health/HealthScreen.tsx b/components/health/HealthScreen.tsx
index ac0815c..1671f4e 100644
--- a/components/health/HealthScreen.tsx
+++ b/components/health/HealthScreen.tsx
@@ -30,6 +30,7 @@ import {
   type LatestGrowth,
   latestGrowth,
 } from "@/lib/rules/growthForm";
+import { indicatorSummaries } from "@/lib/rules/growthView";
 import { vnDateString } from "@/lib/rules/time";
 import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
 import { buildSchedule, nextDose } from "@/lib/rules/vaccines";
@@ -64,7 +65,8 @@ function growthCells(latest: LatestGrowth): [title: string, value: string][] {
   ];
 }

-function GrowthCard({
+// Exported for the temporary fixture pages of the browser checks.
+export function GrowthCard({
   latest,
   status,
 }: {
@@ -94,10 +96,13 @@ function GrowthCard({
               : HEALTH_GROWTH.detail}
           </span>
         </span>
-        {latest && status && (
+        {/* The chip takes the place of the arrow: at 375 px "Gần ranh chuẩn"
+            and the arrow together leave the name less room than it needs. */}
+        {latest && status ? (
           <StatusChip tone={status.tone}>{status.text}</StatusChip>
+        ) : (
+          <Icon name="chevronRight" size={18} className="text-muted" />
         )}
-        <Icon name="chevronRight" size={18} className="text-muted" />
       </span>
       {latest && (
         <span className="grid grid-cols-3 gap-2">
@@ -137,9 +142,9 @@ export function HealthScreen({ baby }: { baby: Baby }) {
   const hcfa = useWhoTable("hcfa", sex);
   // Spec 2026-11-25 §3.4: the alerts wait for the measurements and all three
   // tables, so the chip never shows a verdict that a late table would change.
-  const alerts =
+  const measured =
     growth.data && wfa.data && lhfa.data && hcfa.data
-      ? growthAlerts({
+      ? {
           rows: growth.data,
           tables: {
             wfa: wfa.data.rows as LmsRow[],
@@ -148,8 +153,19 @@ export function HealthScreen({ baby }: { baby: Baby }) {
           },
           dob: baby.dob,
           sex,
-          babyName: baby.name,
-        })
+        }
+      : null;
+  const alerts = measured
+    ? growthAlerts({ ...measured, babyName: baby.name })
+    : null;
+  // Spec §5.6: with no alert, the chip says when the newest value of an
+  // indicator is near the edge of the norm.
+  const status =
+    measured && alerts
+      ? growthStatus(
+          alerts,
+          indicatorSummaries({ ...measured, alerts }).map((item) => item.near),
+        )
       : null;
   const attention = attentionItems({ growth: alerts, vaccine: next, today });
   const live: Partial<Record<string, LiveLine>> = {
@@ -186,7 +202,7 @@ export function HealthScreen({ baby }: { baby: Baby }) {
         <SectionTitle>Theo dõi</SectionTitle>
         <GrowthCard
           latest={growth.data ? latestGrowth(growth.data) : null}
-          status={alerts ? growthStatus(alerts) : null}
+          status={status}
         />
         <div className="grid grid-cols-2 gap-2.5">
           {HEALTH_CARDS.map((item) => (
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  171 passed (171)`, `Tests  1389 passed (1389)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/health/HealthScreen.tsx components/health/health.test.tsx
git commit -m "feat(health): the growth card says when a value is near the edge of the norm" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M2g và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-growth/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  171 passed (171)`, `Tests  1389 passed (1389)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm cho các trạng thái dữ liệu thật không có**

Trang này chỉ đọc bảng WHO (file nội dung của app), không đọc hay ghi dữ liệu của gia đình. Tạo `app/fixture-growth/page.tsx`:

```tsx
"use client";

import { GrowthList } from "@/components/growth/GrowthList";
import { GrowthCard } from "@/components/health/HealthScreen";
import type { LmsRow } from "@/lib/content/who";
import { useWhoTable } from "@/lib/data/growth";
import { addDays } from "@/lib/rules/days";
import {
  growthAlerts,
  type GrowthTables,
  type GrowthTone,
} from "@/lib/rules/growthAlerts";
import { listRows } from "@/lib/rules/growthView";
import type { GrowthRow } from "@/lib/supabase/rows";

// Bé sinh 06/12/2025, để tiêu đề hàng dài nhất có thể: "{dd/mm} · 11 tháng 19 ngày".
const DOB = "2025-12-06";
// [ngày tuổi, kg, cm, vòng đầu cm]. Danh sách 1: cả ba chỉ số gần mức thấp.
// Danh sách 2: cùng các ngày đo, số đo ở giữa chuẩn.
const NEAR: [number, number, number, number][] = [
  [284, 7.6, 69.5, 43.4],
  [318, 7.9, 70.6, 43.8],
  [354, 8.3, 72, 44.3],
];
const NORMAL: [number, number, number, number][] = [
  [284, 8.9, 72.5, 45.2],
  [318, 9.3, 74, 45.6],
  [354, 9.6, 75.3, 46],
];
// Thẻ Tăng trưởng của trang Sức khỏe ở từng trạng thái; null là chưa có chip.
const STATUSES: ({ text: string; tone: GrowthTone } | null)[] = [
  { text: "Gần mức thấp", tone: "warn" },
  { text: "Gần mức cao", tone: "warn" },
  { text: "Gần ranh chuẩn", tone: "warn" },
  { text: "Lớn đều", tone: "good" },
  { text: "Cần chú ý", tone: "warn" },
  { text: "Nên đi khám", tone: "danger" },
  null,
];

export default function Page() {
  const wfa = useWhoTable("wfa", "boys");
  const lhfa = useWhoTable("lhfa", "boys");
  const hcfa = useWhoTable("hcfa", "boys");
  if (!wfa.data || !lhfa.data || !hcfa.data) return <p>Đang tải bảng WHO…</p>;
  const tables: GrowthTables = {
    wfa: wfa.data.rows as LmsRow[],
    lhfa: lhfa.data.rows as LmsRow[],
    hcfa: hcfa.data.rows as LmsRow[],
  };
  const list = (name: string, measured: typeof NEAR) => {
    const rows = measured.map(
      ([age, kg, cm, head]) =>
        ({
          id: `${name}-${age}`,
          baby_id: "fixture",
          measured_on: addDays(DOB, age),
          weight_g: Math.round(kg * 1000),
          length_cm: cm,
          head_cm: head,
          created_by: "fixture",
          created_at: addDays(DOB, age),
          updated_at: addDays(DOB, age),
        }) as GrowthRow,
    );
    const alerts = growthAlerts({
      rows,
      tables,
      dob: DOB,
      sex: "boys",
      babyName: "Bun",
    });
    return (
      <GrowthList
        items={listRows({ rows, tables, dob: DOB, alerts })}
        // Hai hàng mới nhất đang chờ đồng bộ; hàng cũ nhất thì không.
        pending={new Set(rows.slice(1).map((row) => row.id))}
        canEdit={() => false}
        onOpen={() => {}}
      />
    );
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture hàng danh sách và thẻ Sức khỏe</p>
      {list("near", NEAR)}
      {list("normal", NORMAL)}
      {STATUSES.map((status, index) => (
        <GrowthCard
          key={index}
          latest={{
            measuredOn: "2026-11-25",
            weightG: 5700,
            lengthCm: 56.9,
            headCm: 39.9,
          }}
          status={status}
        />
      ))}
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem, không bấm Lưu)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 5). Chạy `bun run dev`. Cỡ 375×812.

Trên trang tạm `http://localhost:3000/fixture-growth`:

1. Danh sách thứ nhất, 3 hàng, chip "Gần mức thấp": tiêu đề "25/11 · 11 tháng 19 ngày", "20/10 · 10 tháng 14 ngày", "16/09 · 9 tháng 10 ngày", mỗi tiêu đề nằm trọn trên một dòng. Ghi lại ở từng hàng chip đứng cùng dòng với tiêu đề (bên phải) hay nằm dưới tiêu đề (canh trái): cả hai đều đúng. Sai là khi tiêu đề bị ngắt giữa chừng, chip bị cắt, hoặc chip tràn ra ngoài thẻ.
2. Hai hàng trên có dấu đồng hồ "chờ đồng bộ" đứng ngay sau số đo, cùng dòng với số đo; hàng cuối không có dấu. Dòng số đo ("8,3 kg · 72 cm · vòng đầu 44,3 cm") nằm trên một dòng.
3. Danh sách thứ hai, chip "Bình thường": chip đứng bên phải tiêu đề, cùng dòng, ở cả ba hàng.
4. Bảy thẻ Tăng trưởng: sáu thẻ đầu có chip theo thứ tự "Gần mức thấp", "Gần mức cao", "Gần ranh chuẩn" (nền vàng), "Lớn đều" (nền xanh), "Cần chú ý" (nền vàng), "Nên đi khám" (nền đỏ) và không có mũi tên; thẻ thứ bảy không có chip, có mũi tên. Ở cả bảy thẻ, "Tăng trưởng" và "Đo gần nhất 25/11" mỗi chữ nằm trên một dòng, không bị ngắt hay cắt.
5. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
6. Lặp mục 1, 2 và 4 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: chip và dấu đồng hồ đọc rõ.

Trang thật (chỉ xem):

7. `http://localhost:3000/suc-khoe`: ghi lại chip của thẻ Tăng trưởng. Với số đo ngày 25/11 của bé, kỳ vọng "Gần mức thấp", không có mũi tên; khối "Cần chú ý" không có dòng tăng trưởng. Nếu số đo thật đã khác thì ghi cái đang thấy.
8. `http://localhost:3000/tang-truong`: mỗi hàng của danh sách có tiêu đề trên một dòng và chip của nó; chạm một hàng mình tạo thì sheet sửa mở ra như trước (đóng lại, không lưu).

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả kiểm (2026-11-25).** Người dùng chọn khung Browser trong app. Cỡ 375×812, còn đăng nhập, theme đã lưu là `dark`. Chỉ xem: không bấm Lưu, không sửa lần đo, không bật tắt công tắc; theme khác chỉ đặt tạm trên `dataset.theme` của trang tạm, không lưu. Bề ngang thật của phần nội dung một hàng và một thẻ là **309 px** (plan ước lượng 311 px).

Trước đó: Step 1 `tsc --noEmit` sạch, `Test Files  171 passed (171)`, `Tests  1389 passed (1389)`. Step 2 `bun run build` lần đầu dừng với cảnh báo bảo mật của Next.js 16.4.3 (mã 1), lần hai `✓ Generating static pages using 9 workers (39/39)` và mã 0; không chạy `next upgrade`.

Trang tạm `/fixture-growth`:

1. **Đúng.** Cả ba tiêu đề của danh sách thứ nhất nằm trọn trên một dòng; chip "Gần mức thấp" rộng 107,5 px, không bị cắt, không tràn khỏi hàng.

   | Hàng | Tiêu đề                  | Bề ngang tiêu đề | Chip     | Chỗ của chip                                             |
   | ---- | ------------------------ | ---------------- | -------- | -------------------------------------------------------- |
   | 1    | 25/11 · 11 tháng 19 ngày | 192,0 px         | 107,5 px | dưới tiêu đề, canh trái (192 + 12 + 107,5 = 311,5 > 309) |
   | 2    | 20/10 · 10 tháng 14 ngày | 192,0 px         | 107,5 px | dưới tiêu đề, canh trái                                  |
   | 3    | 16/09 · 9 tháng 10 ngày  | 181,8 px         | 107,5 px | cùng dòng, bên phải (181,8 + 12 + 107,5 = 301,3)         |

   Trong cùng một danh sách có hàng chip nằm dưới, có hàng chip nằm bên phải: đúng theo plan, nhưng nhìn không đều. Chip "Gần mức thấp" rớt xuống khi tiêu đề rộng hơn 189,5 px, tức là khi tuổi có cả tháng và ngày hai chữ số.

2. **Đúng.** Hai hàng trên của mỗi danh sách có dấu đồng hồ đứng ngay sau số đo, cách chữ 4 px, cùng dòng; hàng cuối không có dấu; không dấu nào còn ở dòng tiêu đề. Dòng số đo nằm trên một dòng ở cả sáu hàng (rộng nhất 248,7 px, cộng dấu là 266,7 px). Dòng chênh ("… so với lần trước") xuống hai dòng ở bốn hàng có nó, như trước M2g.
3. **Đúng.** Chip "Bình thường" (96,6 px) đứng bên phải tiêu đề, cùng dòng, ở cả ba hàng.
4. **Đúng.** Sáu thẻ đầu có chip đúng thứ tự và đúng nền (vàng, vàng, vàng, xanh, vàng, đỏ), không có mũi tên; thẻ thứ bảy không có chip, có mũi tên. Ở cả bảy thẻ "Tăng trưởng" (93,8 px) và "Đo gần nhất 25/11" (108,9 px) mỗi chữ nằm trên một dòng, không bị cắt. Bề ngang chip và cột tên còn lại: "Gần mức thấp" 107,5 / 141,5 px; "Gần mức cao" 101,6 / 147,4; "Gần ranh chuẩn" 118,9 / 130,1; "Lớn đều" 70,4 / 178,6; "Cần chú ý" 82,3 / 166,7; "Nên đi khám" 98,8 / 150,3; không chip 231 px.
5. **Đúng.** `scrollWidth` 375, `innerWidth` 375.
6. **Đúng** ở `rose`, `light`, `dark`, `night`: bố cục và số đo của mục 1, 2, 4 giống hệt nhau ở cả bốn theme; chip và dấu đồng hồ đọc rõ. Độ tương phản chữ trên nền chip: `rose` 6,2–7,4; `light` 6,8–8,0; `dark` 11,0–12,1; `night` 5,7–6,7. Ở `night` mọi chip cùng một màu chữ (theme một màu, như các màn khác).

Trang thật (theme `dark`):

7. **Đúng.** `/suc-khoe`: thẻ Tăng trưởng ghi "Gần mức thấp" (nền vàng), không có mũi tên, "Tăng trưởng" và "Đo gần nhất 25/11" mỗi chữ một dòng; cả trang không có khối "Cần chú ý"; không tràn ngang.
8. **Đúng.** `/tang-truong`: hai hàng "25/11 · 2 tháng 15 ngày" (181,8 px) và "15/11 · 2 tháng 5 ngày" (171,6 px), tiêu đề một dòng, chip "Gần mức thấp" cùng dòng bên phải; không hàng nào đang chờ đồng bộ. Chạm hàng 25/11 thì sheet "Sửa lần đo" mở ra như trước; đã đóng bằng nút "Đóng", không lưu, hai hàng vẫn như cũ.

Chưa kiểm: bề ngang 440 px; theme `peach`, `lavender`, `sea`; hàng đang chờ đồng bộ trên dữ liệu thật (chỉ thấy trên trang tạm); chip nằm dưới tiêu đề trên dữ liệu thật (bé chưa tới tuổi có tháng hai chữ số); VoiceOver; iPhone thật và PWA.

Ảnh chụp: thư mục `m2g-screens/` trong thư mục ghi chú chung của nhóm phiên (ngoài repo). Trang tạm, `.claude/launch.json` tạm và `bun run dev` đã dọn; sau khi xóa trang tạm, `tsc` đỏ vì `.next/dev/types/validator.ts` còn trỏ tới nó, đã xóa `.next/dev/types` (git-ignored) và `tsc` sạch lại, vitest vẫn 1389.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-growth
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec và file plan khác có thể hiện là untracked: không commit chúng
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m2g.md
git commit -m "docs(plan): record the M2g check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; chỗ nào chưa đẹp thì nêu trước, kèm cách sửa. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m2g
git push origin main
```
