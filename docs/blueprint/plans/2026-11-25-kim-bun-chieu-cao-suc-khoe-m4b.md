# Kim Bun — Sức khỏe M4b: dinh dưỡng theo giai đoạn Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§7.3 dinh dưỡng theo giai đoạn; mục 7 của §6.3; dòng `content/nutrition.vi.json` của §9.1)

**Status:** approved 2026-11-25 (người dùng duyệt trước mọi plan còn lại của spec này: "duyệt hết, làm cho tới lúc xong và đẩy lên main, giữa chừng có bug gì thì fix luôn, mở trình duyệt thì dùng browser trong app nếu khi implement có hỏi"; và chọn "Dùng câu đề xuất" cho các dòng dinh dưỡng sau lần đối chiếu nguồn)

**Goal:** Trang Chiều cao có khối "Dinh dưỡng {giai đoạn}": vài dòng nên làm ở tuổi của bé, hàng mở xem giai đoạn kế, và tên các nguồn.

**Architecture:**

- **Nội dung:** `content/nutrition.vi.json` (bốn giai đoạn, ba nguồn, ngày đối chiếu), đọc qua `lib/content/nutrition.ts` với schema zod `.strict()` như các file nội dung khác; `nutritionStage(ageDays)` trả giai đoạn hiện tại và giai đoạn kế.
- **Giao diện:** `components/height/NutritionCard.tsx` có phần chỉ vẽ (`NutritionCardView`), popup của giai đoạn kế (`NextStagePopup`, dùng `Popup` giữa màn hình sẵn có) và phần giữ trạng thái mở/đóng (`NutritionCard`). `HeightScreen` vẽ nó sau khối thói quen, trước hàng nhắc đo.
- Không có migration, không thêm gói, không thêm token màu. `scripts/copy-content.ts` tự chép file `.vi.json` mới ra `public/content/`.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Zod, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m4b`, cắt từ `main` @ `8dacdf5` (đã có trọn M5). Baseline: 1642 test vitest xanh (182 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                          | Nội dung                        | Plan                          |
| ---------------------------- | ------------------------------- | ----------------------------- |
| M1 đến M4a, M4c, M5a đến M5c | §3 đến §7.2, §8, §9.3           | đã xong, ở `main` @ `8dacdf5` |
| **M4b (plan này)**           | §7.3: dinh dưỡng theo giai đoạn | file này, plan cuối của spec  |

**Đối chiếu nguồn (làm ngày 2026-11-25, trước khi viết plan này; §7.3 bắt buộc):**

Các trang đã đọc: (W1) WHO, fact sheet "Infant and young child feeding", https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding; (W2) WHO, "Guideline for complementary feeding of infants and young children 6–23 months of age" (2023), trang xuất bản https://www.who.int/publications/i/item/9789240081864. Trang này chỉ có phần giới thiệu; các khuyến nghị được đọc qua bản tóm tắt của ENN, Field Exchange 72: https://ennonline.net/fex/72/who-guideline-for-complementary-feeding-of-infants-and-young-children. Bản HTML trên NCBI chặn truy cập tự động và bản PDF là tải file nên chưa đọc bản gốc; (V) Viện Dinh dưỡng Quốc gia, năm bài: [A](https://viendinhduong.vn/vi/proper-nutrition-and-health/tre-tu-0-den-5-tuoi/an-dam-cho-be-hieu-dung-de-chon-cach-phu-hop-nhat-6937f0bc844252e735012564) ăn dặm, [B](https://viendinhduong.vn/vi/article/tin-tuc/6937eb9d7e3ec15ff6030992) váng sữa và sữa chua, [C](https://viendinhduong.vn/vi/article/tin-tuc/67e7e2edd932331be114a063) phòng còi xương, [D](https://viendinhduong.vn/vi/professional-activities/pho-bien-kien-thuc-dinh-duong/nuoi-con-thong-minh-thoi-40-bo-sung-vi-chat-hop-ly-cho-con-6905b7616c155bdd440452b2) bổ sung vi chất, [F](https://viendinhduong.vn/vi/article/tin-tuc/nhung-luu-y-ve-che-do-dinh-duong-cho-tre-3-den-5-tuoi-68a83bdd91ebf8f4150968a3) trẻ 3 đến 5 tuổi.

| Giai đoạn  | Dòng                                                                               | Nguồn nói                                                                                                                                      | Kết luận                                               |
| ---------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 0–6 tháng  | Bú mẹ hoàn toàn nếu có thể, bú theo nhu cầu của bé; nếu không, dùng sữa công thức. | W1: bú mẹ hoàn toàn 6 tháng đầu, bú theo nhu cầu. V-A: 6 tháng đầu chỉ cần bú mẹ hoàn toàn hoặc sữa công thức.                                 | khớp (câu đã sửa theo nguồn, người dùng duyệt)         |
| 0–6 tháng  | Vitamin D mỗi ngày theo chỉ định của bác sĩ.                                       | V-C: 400 IU mỗi ngày từ tuần thứ hai; "theo chỉ định của bác sĩ" chỉ nói cho liều điều trị.                                                    | khớp một phần; người dùng cho giữ (không nêu liều)     |
| 0–6 tháng  | Chưa ăn dặm, chưa cần uống thêm nước.                                              | W1: không cho thức ăn hay đồ uống nào khác, kể cả nước.                                                                                        | khớp                                                   |
| 6–12 tháng | Bắt đầu ăn dặm từ khoảng 6 tháng, vẫn bú mẹ hoặc sữa công thức.                    | W1 và W2: ăn bổ sung từ 6 tháng, tiếp tục bú mẹ; W2: 6–11 tháng không bú mẹ thì sữa công thức hoặc sữa động vật.                               | khớp                                                   |
| 6–12 tháng | Mỗi ngày có thức ăn giàu đạm và sắt: thịt, cá, trứng, đậu.                         | W2 (qua ENN): thức ăn nguồn động vật (thịt, cá, trứng) mỗi ngày; đậu, hạt thường xuyên.                                                        | khớp (đọc qua bản tóm tắt)                             |
| 6–12 tháng | Tăng dần độ đặc và số bữa: 2–3 bữa lúc 6–8 tháng, 3–4 bữa lúc 9–11 tháng.          | W1: tăng dần độ đặc; 2–3 bữa lúc 6–8 tháng, 3–4 bữa lúc 9–23 tháng.                                                                            | khớp                                                   |
| 6–12 tháng | Không thêm muối, đường; không dùng mật ong trước 1 tuổi.                           | V-A: dưới 1 tuổi không thêm đường, gia vị; dùng thực phẩm tự nhiên thay vì thêm muối. V-B: tránh thêm đường hoặc mật ong, nhất là dưới 1 tuổi. | khớp một phần; người dùng cho giữ                      |
| 1–2 tuổi   | Ăn 3–4 bữa chính và 1–2 bữa phụ mỗi ngày.                                          | W1: 9–23 tháng 3–4 bữa, thêm 1–2 bữa phụ khi cần.                                                                                              | khớp                                                   |
| 1–2 tuổi   | Mỗi ngày đủ bốn nhóm: tinh bột, đạm, chất béo, rau quả.                            | V-A: bốn nhóm bột đường, đạm, rau củ quả, chất béo.                                                                                            | khớp (câu đã sửa theo nguồn, người dùng duyệt)         |
| 1–2 tuổi   | Tiếp tục bú mẹ nếu có thể.                                                         | W1: tiếp tục bú mẹ tới 2 tuổi hoặc lâu hơn.                                                                                                    | khớp                                                   |
| 1–2 tuổi   | Hạn chế đồ ngọt và nước ngọt.                                                      | W2 (qua ENN): tránh thức ăn, đồ uống nhiều đường, kể cả nước ngọt.                                                                             | khớp; nguồn nói mạnh hơn ("tránh"), người dùng đã biết |
| 2–5 tuổi   | Ăn cùng bữa với gia đình, mỗi ngày đủ đạm, rau quả, sữa.                           | V-F (3–5 tuổi): lượng thịt cá, rau, quả, sữa mỗi ngày. V-A: cho trẻ ăn cùng gia đình (bài ăn dặm).                                             | khớp một phần; người dùng cho giữ                      |
| 2–5 tuổi   | Hạn chế đồ ngọt, nước ngọt, đồ chiên rán và thức ăn nhanh.                         | V-F: hạn chế kẹo, nước ngọt, đồ chiên rán, thức ăn nhanh.                                                                                      | khớp (câu đã sửa theo nguồn, người dùng duyệt)         |
| 2–5 tuổi   | Khám và đo chiều cao định kỳ.                                                      | V-D, V-A: khám sức khỏe định kỳ, theo dõi cân nặng và tăng trưởng.                                                                             | khớp                                                   |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Ba dòng đã đổi chữ so với bản spec đầu** và ba dòng "khớp một phần" được giữ: xem bảng trên; §7.3 của spec đã ghi lại, người dùng duyệt ngày 2026-11-25.
2. **`sources` trong file nội dung** có đúng ba mục như §7.3, mỗi mục một URL thật: fact sheet của WHO, trang xuất bản hướng dẫn 2023 của WHO, trang chủ Viện Dinh dưỡng (các bài cụ thể nằm trong bảng trên). Bản tóm tắt của ENN không đứng tên trong `sources`: nó chỉ là đường đọc hướng dẫn của WHO.
3. **Tên nguồn hiện trên màn hình** viết ngắn để dòng "Nguồn: …" gọn: "WHO – Infant and young child feeding", "WHO – Guideline for complementary feeding 6–23 months (2023)", "Viện Dinh dưỡng Quốc gia". Trong tên không có dấu phẩy, vì các tên được nối bằng dấu phẩy. Ở 375 px dòng này dài khoảng ba dòng chữ nhỏ; Task 4 ghi lại số dòng thật.
4. **Tiêu đề popup của giai đoạn kế** là `Dinh dưỡng {title kế}` (spec chỉ nói popup liệt kê `items`); các dòng canh trái trong popup; nút đóng là "Đã hiểu" của `Popup` sẵn có.
5. **Khối dinh dưỡng không chờ bản ghi hay tùy chọn tải xong**: nó chỉ cần ngày sinh. Nó vẫn nằm trong phần trang hiện sau khi các lần đo và bảng WHO tải xong, như mọi khối khác của trang.
6. **Hàng "Giai đoạn kế"** là nút duy nhất của khối; các dòng nội dung không bấm được. Mở popup không ghi gì lên dữ liệu.
7. **Bé quá 1856 ngày tuổi, hoặc ngày tuổi âm:** `nutritionStage` trả cả hai null và khối không vẽ.
8. **Kiểm trình duyệt** chỉ xem. Dùng khung Browser trong app ở 375×812, không hỏi lại.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m4b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, trên nền M5c. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh là số đo thật trên cả bộ test. Trang tạm của Task 4 đã qua `tsc --noEmit`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **Không đổi chữ nào của `items`.** Từng dòng đã được đối chiếu nguồn và người dùng duyệt; test của Task 1 khóa từng chữ. Nếu thấy một dòng cần sửa: dừng và báo người dùng, không tự sửa (§7.3).
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không gạt công tắc, không bấm "Lưu", không thêm hay sửa lần đo, không bắt đầu hay dừng đồng hồ. Bấm hàng "Giai đoạn kế" để mở popup thì được: nó không ghi gì.
- **Lên `main` không cần hỏi.** Khi mọi bước kiểm xanh và không còn lỗi đã biết thì merge và push. Bước trình duyệt lộ ra lỗi về bố cục thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan; **không đẩy một thay đổi còn lỗi đã biết**. Chỗ nào cần người dùng quyết (nhất là chữ của nội dung) thì dừng lại và báo.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng sau M5c (đã ở `main` @ `8dacdf5`) và là plan cuối của spec.

**Consumes (đã ở `main`):** `HeightScreen` với `HabitsCard` và `MeasureReminderRow` (M4a, M5c); `Popup` (`components/ui/Popup.tsx`); `Icon`; `ageDays` (`lib/rules/time.ts`); `scripts/copy-content.ts`.

**Produces:**

- `content/nutrition.vi.json`: `{ reviewedAt, sources: [{ name, url }], stages: [{ id, fromDay, toDay, title, items }] }`.
- `lib/content/nutrition.ts`: `NutritionStageSchema`, `NutritionContentSchema`, `NutritionStage`, `NutritionContent`, `NUTRITION`, `nutritionStage(ageDays: number, stages?: NutritionStage[]): { current: NutritionStage | null; next: NutritionStage | null }`.
- `components/height/NutritionCard.tsx`: `NutritionCardView({ current, next, sources, onOpenNext })`, `NextStagePopup({ stage, onClose })`, `NutritionCard({ ageDays })`.
- `HeightScreen` vẽ `NutritionCard` sau khối thói quen, trước hàng nhắc đo.
- **Vitest sau M4b:** 1659 test, 184 file.

---

### Task 1: Nội dung dinh dưỡng và hàm chọn giai đoạn (§7.3)

**Files:**

- Create: `content/nutrition.vi.json`, `lib/content/nutrition.ts`
- Test: `lib/content/nutrition.test.ts` (mới)

**Interfaces:**

- Consumes: `zod`.
- Produces: `NUTRITION`, `NutritionContentSchema`, `NutritionStageSchema`, `NutritionStage`, `NutritionContent`, `nutritionStage(ageDays, stages?)`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m4b
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/content/nutrition.test.ts b/lib/content/nutrition.test.ts
new file mode 100644
index 0000000..dd7f7e3
--- /dev/null
+++ b/lib/content/nutrition.test.ts
@@ -0,0 +1,99 @@
+import { describe, expect, it } from "vitest";
+import { NUTRITION, NutritionContentSchema, nutritionStage } from "./nutrition";
+
+// Spec 2026-11-25 §7.3.
+describe("content/nutrition.vi.json", () => {
+  it("says when it was checked and names three sources with their addresses", () => {
+    expect(NUTRITION.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
+    expect(NUTRITION.sources).toHaveLength(3);
+    for (const source of NUTRITION.sources) {
+      expect(source.name.length).toBeGreaterThan(0);
+      expect(source.url).toMatch(/^https:\/\//);
+    }
+    expect(NUTRITION.sources.map((source) => new URL(source.url).host)).toEqual(
+      ["www.who.int", "www.who.int", "viendinhduong.vn"],
+    );
+  });
+
+  it("has four stages that cover days 0 to 1856 with no gap and no overlap", () => {
+    expect(
+      NUTRITION.stages.map((stage) => [
+        stage.id,
+        stage.fromDay,
+        stage.toDay,
+        stage.title,
+      ]),
+    ).toEqual([
+      ["0-6m", 0, 182, "0–6 tháng"],
+      ["6-12m", 183, 364, "6–12 tháng"],
+      ["1-2y", 365, 729, "1–2 tuổi"],
+      ["2-5y", 730, 1856, "2–5 tuổi"],
+    ]);
+  });
+
+  it("holds the lines of the spec, word for word", () => {
+    expect(NUTRITION.stages.map((stage) => stage.items)).toEqual([
+      [
+        "Bú mẹ hoàn toàn nếu có thể, bú theo nhu cầu của bé; nếu không, dùng sữa công thức.",
+        "Vitamin D mỗi ngày theo chỉ định của bác sĩ.",
+        "Chưa ăn dặm, chưa cần uống thêm nước.",
+      ],
+      [
+        "Bắt đầu ăn dặm từ khoảng 6 tháng, vẫn bú mẹ hoặc sữa công thức.",
+        "Mỗi ngày có thức ăn giàu đạm và sắt: thịt, cá, trứng, đậu.",
+        "Tăng dần độ đặc và số bữa: 2–3 bữa lúc 6–8 tháng, 3–4 bữa lúc 9–11 tháng.",
+        "Không thêm muối, đường; không dùng mật ong trước 1 tuổi.",
+      ],
+      [
+        "Ăn 3–4 bữa chính và 1–2 bữa phụ mỗi ngày.",
+        "Mỗi ngày đủ bốn nhóm: tinh bột, đạm, chất béo, rau quả.",
+        "Tiếp tục bú mẹ nếu có thể.",
+        "Hạn chế đồ ngọt và nước ngọt.",
+      ],
+      [
+        "Ăn cùng bữa với gia đình, mỗi ngày đủ đạm, rau quả, sữa.",
+        "Hạn chế đồ ngọt, nước ngọt, đồ chiên rán và thức ăn nhanh.",
+        "Khám và đo chiều cao định kỳ.",
+      ],
+    ]);
+  });
+
+  it("the schema refuses a key it does not know", () => {
+    expect(
+      NutritionContentSchema.safeParse({ ...NUTRITION, note: "x" }).success,
+    ).toBe(false);
+    const [first, ...rest] = NUTRITION.stages;
+    expect(
+      NutritionContentSchema.safeParse({
+        ...NUTRITION,
+        stages: [{ ...first, dose: "400 IU" }, ...rest],
+      }).success,
+    ).toBe(false);
+  });
+});
+
+describe("nutritionStage", () => {
+  const ids = (age: number) => {
+    const { current, next } = nutritionStage(age);
+    return [current?.id ?? null, next?.id ?? null];
+  };
+
+  it("gives the stage of the age and the one after it", () => {
+    expect(ids(0)).toEqual(["0-6m", "6-12m"]);
+    expect(ids(182)).toEqual(["0-6m", "6-12m"]);
+    expect(ids(183)).toEqual(["6-12m", "1-2y"]);
+    expect(ids(364)).toEqual(["6-12m", "1-2y"]);
+    expect(ids(365)).toEqual(["1-2y", "2-5y"]);
+    expect(ids(729)).toEqual(["1-2y", "2-5y"]);
+  });
+
+  it("the last stage has no next one", () => {
+    expect(ids(730)).toEqual(["2-5y", null]);
+    expect(ids(1856)).toEqual(["2-5y", null]);
+  });
+
+  it("past day 1856 there is no stage at all", () => {
+    expect(ids(1857)).toEqual([null, null]);
+    expect(ids(-1)).toEqual([null, null]);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 182 passed (183)`, `Tests  1642 passed (1642)`. File test mới không chạy được test nào vì chưa có `./nutrition`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/content/nutrition.vi.json b/content/nutrition.vi.json
new file mode 100644
index 0000000..6b5f1cc
--- /dev/null
+++ b/content/nutrition.vi.json
@@ -0,0 +1,65 @@
+{
+  "reviewedAt": "2026-11-25",
+  "sources": [
+    {
+      "name": "WHO – Infant and young child feeding",
+      "url": "https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding"
+    },
+    {
+      "name": "WHO – Guideline for complementary feeding 6–23 months (2023)",
+      "url": "https://www.who.int/publications/i/item/9789240081864"
+    },
+    {
+      "name": "Viện Dinh dưỡng Quốc gia",
+      "url": "https://viendinhduong.vn/"
+    }
+  ],
+  "stages": [
+    {
+      "id": "0-6m",
+      "fromDay": 0,
+      "toDay": 182,
+      "title": "0–6 tháng",
+      "items": [
+        "Bú mẹ hoàn toàn nếu có thể, bú theo nhu cầu của bé; nếu không, dùng sữa công thức.",
+        "Vitamin D mỗi ngày theo chỉ định của bác sĩ.",
+        "Chưa ăn dặm, chưa cần uống thêm nước."
+      ]
+    },
+    {
+      "id": "6-12m",
+      "fromDay": 183,
+      "toDay": 364,
+      "title": "6–12 tháng",
+      "items": [
+        "Bắt đầu ăn dặm từ khoảng 6 tháng, vẫn bú mẹ hoặc sữa công thức.",
+        "Mỗi ngày có thức ăn giàu đạm và sắt: thịt, cá, trứng, đậu.",
+        "Tăng dần độ đặc và số bữa: 2–3 bữa lúc 6–8 tháng, 3–4 bữa lúc 9–11 tháng.",
+        "Không thêm muối, đường; không dùng mật ong trước 1 tuổi."
+      ]
+    },
+    {
+      "id": "1-2y",
+      "fromDay": 365,
+      "toDay": 729,
+      "title": "1–2 tuổi",
+      "items": [
+        "Ăn 3–4 bữa chính và 1–2 bữa phụ mỗi ngày.",
+        "Mỗi ngày đủ bốn nhóm: tinh bột, đạm, chất béo, rau quả.",
+        "Tiếp tục bú mẹ nếu có thể.",
+        "Hạn chế đồ ngọt và nước ngọt."
+      ]
+    },
+    {
+      "id": "2-5y",
+      "fromDay": 730,
+      "toDay": 1856,
+      "title": "2–5 tuổi",
+      "items": [
+        "Ăn cùng bữa với gia đình, mỗi ngày đủ đạm, rau quả, sữa.",
+        "Hạn chế đồ ngọt, nước ngọt, đồ chiên rán và thức ăn nhanh.",
+        "Khám và đo chiều cao định kỳ."
+      ]
+    }
+  ]
+}
diff --git a/lib/content/nutrition.ts b/lib/content/nutrition.ts
new file mode 100644
index 0000000..9f43c60
--- /dev/null
+++ b/lib/content/nutrition.ts
@@ -0,0 +1,45 @@
+import { z } from "zod";
+import data from "@/content/nutrition.vi.json";
+
+export const NutritionStageSchema = z
+  .object({
+    id: z.string().regex(/^[a-z0-9-]{1,20}$/),
+    // Days of age, both ends included.
+    fromDay: z.number().int().min(0),
+    toDay: z.number().int().min(0),
+    title: z.string().min(1),
+    items: z.array(z.string().min(1)).min(1),
+  })
+  .strict();
+
+export type NutritionStage = z.infer<typeof NutritionStageSchema>;
+
+// Spec 2026-11-25 §7.3: what to feed at each stage, with the sources each
+// line was checked against and the day of that check.
+export const NutritionContentSchema = z
+  .object({
+    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
+    sources: z
+      .array(z.object({ name: z.string().min(1), url: z.url() }).strict())
+      .min(1),
+    stages: z.array(NutritionStageSchema).min(1),
+  })
+  .strict();
+
+export type NutritionContent = z.infer<typeof NutritionContentSchema>;
+
+// Parsed once at import: a malformed content file fails loudly in tests and builds.
+export const NUTRITION: NutritionContent = NutritionContentSchema.parse(data);
+
+// The stage of a baby of that age and the one after it. The last stage has no
+// next one; outside every stage both are null.
+export function nutritionStage(
+  ageDays: number,
+  stages: NutritionStage[] = NUTRITION.stages,
+): { current: NutritionStage | null; next: NutritionStage | null } {
+  const index = stages.findIndex(
+    (stage) => ageDays >= stage.fromDay && ageDays <= stage.toDay,
+  );
+  if (index === -1) return { current: null, next: null };
+  return { current: stages[index], next: stages[index + 1] ?? null };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  183 passed (183)`, `Tests  1649 passed (1649)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add content/nutrition.vi.json lib/content/nutrition.ts lib/content/nutrition.test.ts
git commit -m "feat(nutrition): the lines by stage and their sources" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Thẻ dinh dưỡng và popup giai đoạn kế (§7.3)

**Files:**

- Create: `components/height/NutritionCard.tsx`
- Test: `components/height/nutritioncard.test.tsx` (mới)

**Interfaces:**

- Consumes: `NUTRITION`, `NutritionStage`, `NutritionContent`, `nutritionStage` (Task 1); `Popup`, `Icon`.
- Produces: `NutritionCardView`, `NextStagePopup`, `NutritionCard({ ageDays })`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/height/nutritioncard.test.tsx b/components/height/nutritioncard.test.tsx
new file mode 100644
index 0000000..091c44d
--- /dev/null
+++ b/components/height/nutritioncard.test.tsx
@@ -0,0 +1,88 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import { NUTRITION } from "@/lib/content/nutrition";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import {
+  NextStagePopup,
+  NutritionCard,
+  NutritionCardView,
+} from "./NutritionCard";
+
+const [FIRST, SECOND, , LAST] = NUTRITION.stages;
+const view = (over: Partial<Parameters<typeof NutritionCardView>[0]> = {}) => ({
+  current: FIRST,
+  next: SECOND,
+  sources: NUTRITION.sources,
+  onOpenNext: () => {},
+  ...over,
+});
+
+// Spec 2026-11-25 §7.3.
+describe("NutritionCardView", () => {
+  it("is titled with the stage and lists its lines, each with a green check", () => {
+    const html = renderToStaticMarkup(<NutritionCardView {...view()} />);
+    expect(html).toContain(">Dinh dưỡng 0–6 tháng</h2>");
+    expect(html).toContain("glass");
+    for (const item of FIRST.items) expect(html).toContain(`>${item}</span>`);
+    expect(html.split(`d="${ICON_PATHS.check}"`)).toHaveLength(
+      FIRST.items.length + 1,
+    );
+    expect(html).toContain("text-good");
+  });
+
+  it("the lines are not buttons; the only button opens the next stage", () => {
+    const onOpenNext = vi.fn();
+    const html = renderToStaticMarkup(<NutritionCardView {...view()} />);
+    expect(html.match(/<button/g)).toHaveLength(1);
+    expect(html).not.toContain("<a ");
+    expect(html).toContain(">Giai đoạn kế: 6–12 tháng</span>");
+    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
+    const [button] = findElements(
+      NutritionCardView(view({ onOpenNext })),
+      (el) => el.type === "button",
+    );
+    (button.props.onClick as () => void)();
+    expect(onOpenNext).toHaveBeenCalledOnce();
+  });
+
+  it("the last stage has no next row", () => {
+    const html = renderToStaticMarkup(
+      <NutritionCardView {...view({ current: LAST, next: null })} />,
+    );
+    expect(html).toContain(">Dinh dưỡng 2–5 tuổi</h2>");
+    expect(html).not.toContain("Giai đoạn kế");
+    expect(html).not.toContain("<button");
+  });
+
+  it("names the sources under the group, separated by commas", () => {
+    const html = renderToStaticMarkup(<NutritionCardView {...view()} />);
+    expect(html).toContain(
+      ">Nguồn: WHO – Infant and young child feeding, WHO – Guideline for complementary feeding 6–23 months (2023), Viện Dinh dưỡng Quốc gia.</p>",
+    );
+  });
+});
+
+describe("NextStagePopup", () => {
+  it("is titled with the next stage and lists its lines", () => {
+    const html = renderToStaticMarkup(
+      <NextStagePopup stage={SECOND} onClose={() => {}} />,
+    );
+    expect(html).toContain(">Dinh dưỡng 6–12 tháng</h2>");
+    for (const item of SECOND.items) expect(html).toContain(`>${item}</li>`);
+    expect(html).toContain(">Đã hiểu</button>");
+  });
+});
+
+describe("NutritionCard", () => {
+  it("draws the stage of the age, with the popup closed", () => {
+    const html = renderToStaticMarkup(<NutritionCard ageDays={67} />);
+    expect(html).toContain(">Dinh dưỡng 0–6 tháng</h2>");
+    expect(html).toContain(">Giai đoạn kế: 6–12 tháng</span>");
+    expect(html).not.toContain("<dialog");
+  });
+
+  it("past day 1856 it draws nothing", () => {
+    expect(renderToStaticMarkup(<NutritionCard ageDays={1857} />)).toBe("");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 183 passed (184)`, `Tests  1649 passed (1649)`. File test mới không chạy được test nào vì chưa có `./NutritionCard`.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/height/NutritionCard.tsx b/components/height/NutritionCard.tsx
new file mode 100644
index 0000000..81f40dc
--- /dev/null
+++ b/components/height/NutritionCard.tsx
@@ -0,0 +1,103 @@
+"use client";
+
+import { useState } from "react";
+import { Icon } from "@/components/ui/Icon";
+import { Popup } from "@/components/ui/Popup";
+import {
+  NUTRITION,
+  type NutritionContent,
+  type NutritionStage,
+  nutritionStage,
+} from "@/lib/content/nutrition";
+
+// Spec 2026-11-25 §7.3: what to feed at the baby's stage. The lines are read,
+// not tapped; the last row opens the lines of the next stage.
+export function NutritionCardView({
+  current,
+  next,
+  sources,
+  onOpenNext,
+}: {
+  current: NutritionStage;
+  next: NutritionStage | null;
+  sources: NutritionContent["sources"];
+  onOpenNext: () => void;
+}) {
+  return (
+    <section className="flex flex-col gap-2.5">
+      <h2 className="mx-1 text-xl leading-[26px] font-bold text-ink">
+        Dinh dưỡng {current.title}
+      </h2>
+      <ul className="glass overflow-hidden rounded-[26px]">
+        {current.items.map((item) => (
+          <li
+            key={item}
+            className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
+          >
+            <Icon
+              name="check"
+              size={18}
+              strokeWidth={2.4}
+              // 18 px in a 20 px line: level with the first line of the text.
+              className="mt-px shrink-0 text-good"
+            />
+            <span className="text-[15px] leading-5 text-ink">{item}</span>
+          </li>
+        ))}
+        {next && (
+          <li>
+            <button
+              type="button"
+              onClick={onOpenNext}
+              className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-[15px] leading-5 font-semibold text-accent-text"
+            >
+              <span className="min-w-0 flex-1">Giai đoạn kế: {next.title}</span>
+              <Icon name="chevronRight" size={16} className="text-muted" />
+            </button>
+          </li>
+        )}
+      </ul>
+      <p className="px-1 text-[13px] leading-[18px] text-muted">
+        Nguồn: {sources.map((source) => source.name).join(", ")}.
+      </p>
+    </section>
+  );
+}
+
+export function NextStagePopup({
+  stage,
+  onClose,
+}: {
+  stage: NutritionStage;
+  onClose: () => void;
+}) {
+  return (
+    <Popup title={`Dinh dưỡng ${stage.title}`} onClose={onClose}>
+      <ul className="flex flex-col gap-2 text-left">
+        {stage.items.map((item) => (
+          <li key={item}>{item}</li>
+        ))}
+      </ul>
+    </Popup>
+  );
+}
+
+// Nothing is drawn for a child past the last stage (day 1856).
+export function NutritionCard({ ageDays }: { ageDays: number }) {
+  const [open, setOpen] = useState(false);
+  const { current, next } = nutritionStage(ageDays);
+  if (!current) return null;
+  return (
+    <>
+      <NutritionCardView
+        current={current}
+        next={next}
+        sources={NUTRITION.sources}
+        onOpenNext={() => setOpen(true)}
+      />
+      {open && next && (
+        <NextStagePopup stage={next} onClose={() => setOpen(false)} />
+      )}
+    </>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  184 passed (184)`, `Tests  1656 passed (1656)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/height/NutritionCard.tsx components/height/nutritioncard.test.tsx
git commit -m "feat(nutrition): the card of the stage and the popup of the next one" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Trang Chiều cao hiện dinh dưỡng (§6.3 mục 7)

**Files:**

- Modify: `components/height/HeightScreen.tsx`
- Test: `components/height/heightscreen.test.tsx`

**Interfaces:**

- Consumes: `NutritionCard` (Task 2); `ageDays`.
- Produces: `HeightScreen` vẽ `NutritionCard` sau `HabitsCard`, trước `MeasureReminderRow`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/height/heightscreen.test.tsx b/components/height/heightscreen.test.tsx
index 1970ebc..b5c04c1 100644
--- a/components/height/heightscreen.test.tsx
+++ b/components/height/heightscreen.test.tsx
@@ -222,6 +222,32 @@ describe("HeightScreen", () => {
     }
   });

+  // Spec 2026-11-25 §7.3 and §6.3 item 7. The baby is 67 days old.
+  it("the nutrition of the baby's stage: after the habits, before the measure reminder", () => {
+    const html = render();
+    const order = [
+      ">Thói quen 7 ngày qua</h2>",
+      ">Dinh dưỡng 0–6 tháng</h2>",
+      ">Chưa ăn dặm, chưa cần uống thêm nước.</span>",
+      ">Giai đoạn kế: 6–12 tháng</span>",
+      ">Nguồn: WHO – Infant and young child feeding,",
+      ">Nhắc đo mỗi tháng</span>",
+      "Chiều cao lúc lớn phần lớn do di truyền.",
+    ].map((text) => html.indexOf(text));
+    expect(order.every((i) => i >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+  });
+
+  it("the nutrition follows the age: a child of two has the last stage and no next row", () => {
+    const html = render({}, baby({ dob: "2024-11-20" }));
+    expect(html).toContain(">Dinh dưỡng 2–5 tuổi</h2>");
+    expect(html).not.toContain("Giai đoạn kế");
+  });
+
+  it("the nutrition does not wait for the logs", () => {
+    expect(render({ logs: LOADING })).toContain(">Dinh dưỡng 0–6 tháng</h2>");
+  });
+
   // Spec 2026-11-25 §8.3. The newest measurement is of 15/11 and the baby is
   // under one year: the next one is due on 15/12.
   it("the measure reminder: after the habits, before the closing note, with the viewer's switch", () => {
@@ -312,6 +338,8 @@ describe("HeightScreen", () => {
     expect(html).not.toContain("Nằm sấp");
     expect(html).not.toContain("Vitamin D");
     expect(html).toContain(">Chuẩn giấc ngủ như trang Thống kê.</p>");
+    // Past the last stage there is no nutrition block either.
+    expect(html).not.toContain("Dinh dưỡng");
     // Past the WHO table nothing is due, so there is no reminder row.
     expect(html).not.toContain("Nhắc đo");
     expect(html).toContain(">Di truyền dự kiến</h2>");
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 183 passed (184)`, `Tests  3 failed | 1656 passed (1659)`. Lý do đỏ: trang chưa vẽ khối dinh dưỡng.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/components/height/HeightScreen.tsx b/components/height/HeightScreen.tsx
index 2f4f94a..2221de0 100644
--- a/components/height/HeightScreen.tsx
+++ b/components/height/HeightScreen.tsx
@@ -16,7 +16,7 @@ import { vnDayRange } from "@/lib/rules/days";
 import { habitStats } from "@/lib/rules/habits";
 import { heightView } from "@/lib/rules/heightView";
 import { latestDay, measureReminder } from "@/lib/rules/measureSchedule";
-import { vnDateString } from "@/lib/rules/time";
+import { ageDays, vnDateString } from "@/lib/rules/time";
 import type { Baby } from "@/lib/supabase/rows";
 import {
   HeightGoalCard,
@@ -27,6 +27,7 @@ import {
 import { HabitsCard } from "./HabitsCard";
 import { HeightGoalSheet } from "./HeightGoalSheet";
 import { MeasureReminderRow } from "./MeasureReminderRow";
+import { NutritionCard } from "./NutritionCard";

 const NOTE = "px-1 text-[13px] leading-[18px] text-muted";

@@ -134,6 +135,7 @@ export function HeightScreen({
             </>
           )}
           {habits && <HabitsCard rows={habits.rows} />}
+          <NutritionCard ageDays={ageDays(baby.dob, now)} />
           {reminder && (
             <MeasureReminderRow userId={userId} reminder={reminder} />
           )}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  184 passed (184)`, `Tests  1659 passed (1659)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/height/HeightScreen.tsx components/height/heightscreen.test.tsx
git commit -m "feat(height): the Chiều cao page shows the nutrition of the baby's stage" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M4b rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-height/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M4b.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  184 passed (184)`, `Tests  1659 passed (1659)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0. Sau build, `public/content/nutrition.vi.json` phải có (script chép nội dung chạy trong bước build; nếu không thấy thì chạy `bun scripts/copy-content.ts` và ghi lại). Thư mục `public/content/` không nằm trong git.

- [x] **Step 3: Tạo trang fixture tạm cho các giai đoạn dữ liệu thật không có**

Trang này không đọc hay ghi dữ liệu của gia đình. Tạo `app/fixture-height/page.tsx`:

```tsx
"use client";

import { NutritionCard } from "@/components/height/NutritionCard";

// Bốn giai đoạn theo ngày tuổi: 67 (0–6 tháng), 200 (6–12 tháng),
// 400 (1–2 tuổi), 800 (2–5 tuổi, không có hàng "Giai đoạn kế").
const AGES = [67, 200, 400, 800];

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture dinh dưỡng theo giai đoạn</p>
      {AGES.map((age) => (
        <NutritionCard key={age} ageDays={age} />
      ))}
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Dùng khung Browser trong app, cỡ 375×812. Chạy `bun run dev`.

Trên trang tạm `http://localhost:3000/fixture-height` (bốn khối):

1. **Tiêu đề** lần lượt "Dinh dưỡng 0–6 tháng", "Dinh dưỡng 6–12 tháng", "Dinh dưỡng 1–2 tuổi", "Dinh dưỡng 2–5 tuổi". Mỗi khối là một nhóm bo tròn; mỗi dòng có dấu tích xanh bên trái, chữ không bị cắt và không tràn ra ngoài nhóm; dòng dài xuống dòng gọn, dấu tích ngang hàng dòng chữ đầu. Đối chiếu từng dòng chữ với bảng "Đối chiếu nguồn" ở đầu plan: phải trùng từng chữ.
2. Ba khối đầu có hàng cuối "Giai đoạn kế: 6–12 tháng", "Giai đoạn kế: 1–2 tuổi", "Giai đoạn kế: 2–5 tuổi" kèm mũi tên; khối cuối không có hàng này.
3. Bấm "Giai đoạn kế: 6–12 tháng": một popup hiện giữa màn hình, tiêu đề "Dinh dưỡng 6–12 tháng", bốn dòng của giai đoạn đó canh trái, nút "Đã hiểu". Bốn dòng phải đọc ra là bốn ý tách nhau (popup không có dấu đầu dòng); nếu chúng dính thành một đoạn thì đó là lỗi bố cục: sửa trong phiên (ví dụ tăng khoảng cách giữa các dòng), có test, không đổi chữ. Popup không cao quá màn hình và không tràn ngang. Bấm "Đã hiểu": popup đóng. Mở lại rồi bấm ra ngoài popup: popup đóng.
4. Dưới mỗi nhóm có dòng chữ nhỏ màu xám "Nguồn: WHO – Infant and young child feeding, WHO – Guideline for complementary feeding 6–23 months (2023), Viện Dinh dưỡng Quốc gia." Ghi lại nó chiếm mấy dòng ở 375 px.
5. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
6. Lặp mục 1 và 3 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"peach"`, `"lavender"`, `"sea"`, `"dark"`, `"night"`: dấu tích, chữ, hàng "Giai đoạn kế" và popup đọc rõ; ở `night` dấu tích theo tông hổ phách.

Trang thật `http://localhost:3000/tang-truong/chieu-cao` (dữ liệu thật của gia đình: chỉ xem, không gạt công tắc):

7. Khối "Dinh dưỡng …" nằm sau "Thói quen 7 ngày qua", trước hàng nhắc đo. Giai đoạn đúng với tuổi của bé (xem tuổi ở trang Hôm nay hoặc Hồ sơ): dưới 183 ngày là "0–6 tháng". Ghi lại tiêu đề và các dòng đang thấy.
8. Bấm hàng "Giai đoạn kế": popup mở với các dòng của giai đoạn kế; đóng lại. Không bấm gì khác.
9. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả kiểm (2026-11-26, khung Browser trong app, 375×812; theme đang lưu của máy là `night`):**

- **Step 1:** `tsc --noEmit` mã 0; `Test Files  184 passed (184)`, `Tests  1659 passed (1659)`. Chạy lại sau khi xóa trang tạm: cùng kết quả.
- **Step 2:** `bun run build` lần đầu mã 1 (thông báo bảo mật Next.js 16.4.3; không chạy `next upgrade`), lần hai mã 0, `✓ Generating static pages (40/40)`. `public/content/nutrition.vi.json` có, giống hệt file trong `content/`. Build lại sau khi xóa trang tạm: lần đầu mã 1 vì cùng thông báo, lần hai mã 0, 40/40.
- **Số đỏ và xanh của Task 1 đến 3** khớp plan từng số; 6 patch áp sạch bằng `kb_patch`, không sửa tay.

Trang tạm `/fixture-height`:

1. Đạt. Bốn tiêu đề đúng thứ tự. Mỗi nhóm bo 26 px, rộng 343 px; mọi dòng nằm trong nhóm, không dòng nào bị cắt; dòng dài xuống 2 hoặc 3 dòng; tâm dấu tích lệch 0 px so với tâm dòng chữ đầu. Chữ trên trang trùng từng chữ với bảng "Đối chiếu nguồn" (14 dòng).
2. Đạt. Ba khối đầu có "Giai đoạn kế: 6–12 tháng", "Giai đoạn kế: 1–2 tuổi", "Giai đoạn kế: 2–5 tuổi" kèm mũi tên, hàng cao 44 px; khối cuối không có hàng này.
3. Đạt. Popup "Dinh dưỡng 6–12 tháng" nằm giữa màn hình: thẻ 300×340 px, từ 236 tới 576 trên 812 px, không tràn ngang. Bốn dòng canh trái, chữ 15/20 px, cách nhau 8 px (trong một dòng là 20 px, giữa hai dòng là 28 px): đọc ra bốn ý tách nhau, không dính thành một đoạn, nên không sửa gì. Nút "Đã hiểu" đóng popup; mở lại rồi bấm ra ngoài cũng đóng. Chỉ mở popup của 6–12 tháng (popup dài nhất); hai popup còn lại chưa mở.
4. Dòng "Nguồn: …" chiếm **3 dòng** ở 375 px (54 px, chữ 13/18 px), màu `text-muted`.
5. `true` (`scrollWidth` 375, `innerWidth` 375).
6. Đạt ở cả 7 theme (`rose`, `light`, `peach`, `lavender`, `sea`, `dark`, `night`): dấu tích, chữ, hàng "Giai đoạn kế" và popup đọc rõ; không tràn ngang ở theme nào. Dấu tích xanh lá ở sáu theme, ở `night` là hổ phách `rgb(217, 137, 92)`. Tương phản của chữ trong popup so với nền thẻ: `rose` 6,03; `light` 6,71; `peach` 6,24; `lavender` 6,16; `sea` 6,02; `dark` 7,24; `night` 5,00. Console không có lỗi.

Trang thật `/tang-truong/chieu-cao` (chỉ xem, theme `night`):

7. Đạt. Thứ tự: "Thói quen 7 ngày qua", "Dinh dưỡng 0–6 tháng", hàng "Nhắc đo mỗi tháng" (Lần tới 25/12 · 08:00), đoạn cuối. Trang ghi bé 2 tháng 15 ngày, tức dưới 183 ngày: đúng giai đoạn. Các dòng đang thấy: "Bú mẹ hoàn toàn nếu có thể, bú theo nhu cầu của bé; nếu không, dùng sữa công thức." (3 dòng), "Vitamin D mỗi ngày theo chỉ định của bác sĩ." (2 dòng), "Chưa ăn dặm, chưa cần uống thêm nước." (2 dòng), "Giai đoạn kế: 6–12 tháng"; "Nguồn: …" 3 dòng.
8. Đạt. Bấm "Giai đoạn kế: 6–12 tháng": popup mở với bốn dòng của 6–12 tháng và nút "Đã hiểu"; bấm "Đã hiểu" thì đóng. Không bấm gì khác trên trang thật: không gạt công tắc, không ghi gì.
9. `true`. Console không có lỗi.

Ghi chú: khung Browser bị bộ kiểm quyền chặn ở lần thử đầu; người dùng đồng ý trong phiên rồi mới kiểm. Trên trang tạm có hai cú bấm theo tọa độ bị lệch khung, trúng chữ thường nên không có gì xảy ra; sau đó bấm bằng `ref`.

**Chưa kiểm:** trang thật ở theme ngoài `night`; bề ngang 440 px; iPhone thật, PWA, VoiceOver; popup của "1–2 tuổi" và "2–5 tuổi".

**Sửa sau lần kiểm:** không có. Spec không đổi.

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả**

```bash
rm -r app/fixture-height
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m4b.md
git commit -m "docs(plan): record the M4b check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 6: Đưa lên `main`**

Chỉ khi Step 1, 2 và 4 đều đạt và không còn lỗi đã biết:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m4b
git push origin main
git rev-parse --short main origin/main   # hai dòng phải giống nhau
```

Nếu `git merge --ff-only` không được vì `main` đã đổi, hoặc `git push` bị từ chối: `git checkout feat/kim-bun-suc-khoe-m4b && git rebase origin/main`, chạy lại Step 1, rồi thử lại. Không bao giờ force-push.

Báo cáo: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; lỗi nào đã sửa trong phiên; nhắc lại rằng hướng dẫn WHO 2023 mới được đối chiếu qua bản tóm tắt của ENN.
