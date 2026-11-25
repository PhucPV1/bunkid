# Kim Bun — Mục tiêu chiều cao, Tăng trưởng làm lại, tab Sức khỏe và Tiện ích

**Status:** approved 2026-11-25
**Ngày:** 2026-11-25
**Unit:** `web` (PWA Next.js trên Vercel, kèm migration Supabase của chính nó). Một unit. Có 2 migration.
**Liên quan:** spec gốc `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (gọi tắt "spec gốc"), spec UI `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md` (gọi tắt "spec UI"), spec `docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md` (gọi tắt "spec 17/11"), spec `docs/blueprint/specs/2026-11-19-kim-bun-ux-mobile-design.md` (gọi tắt "spec 19/11"). Code nền: `main` tại commit `573bdc4`. Bản vẽ Claude Design: https://claude.ai/artifact/YY5Poyt6o8QEzWtc83mb7N.

Bản vẽ chỉ để xem hình; số liệu trên bản vẽ là số bịa cho một bé trai 2 tháng 15 ngày. Chỗ nào bản vẽ khác spec này thì spec này đúng. Các chỗ khác đã biết: vùng xanh của biểu đồ (§5.4), câu "94 trong 100" (§5.4), câu "3–4 cm mỗi tháng" (§6.3), tên tab "Sổ bé" trên các bảng Tăng trưởng và Chiều cao (§3.1).

**Thay thế:** spec UI §6.1 (danh sách tab); spec 19/11 §4 (độ rộng ô timer và dòng chữ nhỏ của nó) và §9 (hai thẻ số liệu ở Khám phá, nay nằm ở trang Sức khỏe); spec gốc §7.3 và §9 phần Tăng trưởng (5 đường bách phân vị, chip "z · P", danh sách lần đo).

## 1. Mục tiêu

Người dùng muốn con cao 180 cm hoặc hơn và muốn app theo dõi, hỗ trợ việc đó. Cùng lúc, màn Tăng trưởng hiện "hơi khó đọc và khó hiểu", và tab "Khám phá" nghe như phần phụ trong khi chứa nhiều chức năng quan trọng.

1. **Tab.** Thanh tab có 4 tab: Hôm nay · Nhật ký · Sức khỏe · Tiện ích. Trang Sức khỏe mở đầu bằng mục "Cần chú ý".
2. **Tăng trưởng.** Người đọc biết ngay bé có bình thường không, bằng lời, không cần hiểu "z" hay "P". Có cảnh báo khi số đo lệch chuẩn hoặc đi lệch hướng.
3. **Chiều cao (gói A).** Nhập chiều cao bố mẹ và mục tiêu; app cho khoảng di truyền dự kiến, đường mục tiêu trên biểu đồ, tốc độ tăng.
4. **Thói quen và dinh dưỡng (gói B).** Trung bình 7 ngày của giấc ngủ, nằm sấp, vitamin D từ nhật ký đã có; lời khuyên dinh dưỡng theo giai đoạn tuổi.
5. **Push.** Cảnh báo tăng trưởng gửi cho cả nhà; nhắc đo định kỳ.

Bốn quyết định của người dùng ngày 2026-11-25:

- Tab: 4 tab "Sức khỏe" + "Tiện ích" (bảng "Tab · B").
- Tăng trưởng: kiểu "Kết luận trước" (bảng "Tăng trưởng · A").
- Mục tiêu chiều cao nằm trong Tăng trưởng: một thẻ mở trang Chiều cao, không có ô riêng ở tab.
- Cảnh báo lệch chuẩn: báo trong app và thêm push cho cả nhà.

Bốn quyết định bổ sung cùng ngày, sau khi người dùng xem thẻ kết luận với số đo thật của bé (§5.6):

- Số chuẩn hiện ngay dưới thanh vị trí (bảng "Gần ranh · A").
- "Gần ranh" là khi bé còn trong chuẩn nhưng thuộc nhóm 16 bé thấp nhất hoặc 16 bé cao nhất trong 100.
- Trạng thái gần ranh hiện ở màn Tăng trưởng và ở chip của trang Sức khỏe; không vào "Cần chú ý", không gửi push.
- Làm sau biểu đồ (§5.4) và danh sách (§5.5).

Ngoài phạm vi: bé trên 5 tuổi hoặc cao trên 130 cm (bảng WHO 5–19 tuổi, dậy thì, tuổi xương — "gói C"); dự đoán chiều cao lúc lớn từ số đo của bé; gợi ý thực phẩm chức năng; ghi bữa ăn dặm; cân nặng theo chiều dài, BMI; đổi luật đánh giá 24 giờ, luật nhắc cữ bú, luật tiêm chủng; token màu mới; đổi nội dung các trang Triệu chứng, Bệnh thường gặp, Bồng bế, Ồn trắng, Nhạc, Ảnh, Báo cáo ngoài nút quay lại (§3.2).

## 2. Global Constraints

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

## 3. Thanh tab, trang Sức khỏe, trang Tiện ích

### 3.1 Tab và đường dẫn

`lib/nav.ts`:

| `key`     | `href`      | `label`  | `icon`  |
| --------- | ----------- | -------- | ------- |
| `home`    | `/`         | Hôm nay  | `home`  |
| `history` | `/nhat-ky`  | Nhật ký  | `list`  |
| `health`  | `/suc-khoe` | Sức khỏe | `pulse` |
| `tools`   | `/tien-ich` | Tiện ích | `grid`  |

`TabKey` = `"home" | "history" | "health" | "tools"`. Key `explore` và icon `explore` không còn chỗ dùng thì xóa.

`activeTab(pathname)`:

- `health`: `/suc-khoe`, `/kham-pha`, `/cam-nang`, `/khan-cap`, `/thong-ke`, `/tang-truong` (gồm `/tang-truong/chieu-cao`), `/tiem-chung`, `/phat-trien`, `/trieu-chung`, `/benh-thuong-gap`, `/bao-cao`.
- `tools`: `/tien-ich`, `/on-trang`, `/nhac`, `/anh`, `/bong-be`.
- `home`, `history`: như cũ.

Trang:

- `/suc-khoe`: trang mới, vẽ `HealthScreen` (§3.4).
- `/tien-ich`: thôi chuyển hướng, vẽ `ToolsScreen` (§3.5).
- `/kham-pha` và `/cam-nang`: `RedirectTo href="/suc-khoe"`.
- `components/explore/ExploreScreen.tsx` và test của nó bị thay bằng hai màn mới.
- Service worker: danh sách `PAGES` trong `sw/sw.template.js` thêm `/suc-khoe` và `/tang-truong/chieu-cao`; `/tien-ich`, `/kham-pha`, `/cam-nang` giữ nguyên trong danh sách (hai trang sau vẫn là trang chuyển hướng). `scripts/sw.test.ts` sửa theo.

### 3.2 Nút quay lại

Mọi `PageHeader` đang có `back={{ href: "/kham-pha", label: "Khám phá" }}` đổi như sau:

- `{ href: "/suc-khoe", label: "Sức khỏe" }`: Khẩn cấp, Thống kê, Tăng trưởng, Tiêm chủng, Phát triển, Triệu chứng, Bệnh thường gặp, Báo cáo.
- `{ href: "/tien-ich", label: "Tiện ích" }`: Ồn trắng, Nhạc, Ảnh, Bồng bế.

### 3.3 Ô timer khi có 4 tab

Thay spec 19/11 §4 ở hai điểm, phần còn lại của §4 giữ nguyên:

- Ô timer của tab Hôm nay rộng `flex-[2.2]` (trước là `flex-[1.7]`); ba tab kia `flex-1`.
- Dòng chữ nhỏ là `Hôm nay` khi không còn timer khác, `Hôm nay +{n}` khi còn `n` timer khác (bỏ dấu " · "). Tên cho trình đọc màn hình không đổi.

Tiêu chí ở bề ngang 375 px, có timer đang chạy: ô timer không cắt chữ ở cả hai dạng đồng hồ (`52:04` và `1g 05p`) và dạng `Hôm nay +1`; nhãn ba tab kia không cắt, không xuống dòng; mỗi tab rộng ≥ 44 px. Nếu đo thật không đạt, thu vòng tròn icon của ô timer từ 36 px xuống 32 px; không đổi gì khác.

### 3.4 Trang Sức khỏe

`components/health/HealthScreen.tsx`. `PageHeader title="Sức khỏe"`, không có nút quay lại. Các khối cách nhau 22 px, theo thứ tự:

1. **Cần chú ý** (§4). Không có dòng nào thì cả khối, kể cả tiêu đề, không vẽ.
2. **Theo dõi** (tiêu đề 20 px đậm):
   - Thẻ **Tăng trưởng** rộng hết hàng, `glass` bo 26 px, là một `Link` tới `/tang-truong`:
     - Hàng trên: icon `ruler` trong vòng 36 px màu `cat-tummy`; tên "Tăng trưởng"; dòng phụ `Đo gần nhất {dd/mm}`; rồi chip trạng thái, hoặc mũi tên phải khi thẻ chưa có chip. Chip đứng thay chỗ mũi tên vì ở 375 px chip "Gần ranh chuẩn" cùng mũi tên không chừa đủ chỗ cho tên thẻ và dòng phụ. (Bổ sung 2026-11-25 khi viết plan M2g, người dùng duyệt cùng ngày; bản đầu ghi có cả chip lẫn mũi tên.)
     - Chip trạng thái theo cảnh báo của lần đo gần nhất (§5.1): không có cảnh báo → nền `good-soft` "Lớn đều"; có cảnh báo vàng → nền `warn-soft` "Cần chú ý"; có cảnh báo đỏ → nền `danger-soft` "Nên đi khám". Không có cảnh báo nhưng có chỉ số gần ranh ở lần đo gần nhất của chính chỉ số đó (§5.6) → nền `warn-soft`: "Gần mức thấp" khi mọi chỉ số gần ranh đều gần mức thấp, "Gần mức cao" khi đều gần mức cao, "Gần ranh chuẩn" khi có cả hai.
     - Hàng giữa: 3 cột Cân nặng · Chiều dài · Vòng đầu, mỗi cột là số đo gần nhất có giá trị của chỉ số đó (định dạng `formatGrowthValue`), chưa có thì "—".
     - Hàng dưới, chỉ khi `target_height_cm` khác null: icon `flag` màu `accent-text` và câu `Mục tiêu {t} cm: {trạng thái}` (§6.3). (Sửa 2026-11-25 sau lần kiểm trình duyệt của M3d: bản đầu ghi màu `accent`; ở theme Ban đêm `accent` là màu nền của nút, lá cờ gần như chìm vào nền thẻ.)
     - Chưa có lần đo nào hoặc dữ liệu chưa tải: chỉ hàng trên, dòng phụ là "Cân nặng, chiều dài theo chuẩn WHO", không có chip.
   - Lưới 2 cột: thẻ **Tiêm chủng** (dòng số liệu như spec 19/11 §9, dùng `vaccineCardText`) và thẻ **Phát triển** ("Các mốc theo tháng tuổi"). Cao tối thiểu 112 px.
   - Một `ListGroup` một hàng: **Thống kê**, "Biểu đồ ngủ, bú, tã 7 và 14 ngày".
3. **Khi bé ốm** (tiêu đề 20 px đậm): thẻ Khẩn cấp như hiện tại; dưới là `ListGroup` 3 hàng: Triệu chứng, Bệnh thường gặp, Báo cáo cho bác sĩ (nhãn, mô tả, icon, màu như `lib/nav.ts` hiện có).

`growthCardText` (`lib/rules/exploreCards.ts`) không còn dùng thì xóa cùng test của nó; `vaccineCardText` giữ.

### 3.5 Trang Tiện ích

`components/tools/ToolsScreen.tsx`. `PageHeader title="Tiện ích"`, không có nút quay lại. Một lưới 2 cột, 4 thẻ `glass` bo 26 px, cao tối thiểu 128 px, cùng kiểu thẻ "Theo dõi" của Khám phá hiện tại (vòng icon 36 px, tên 16 px đậm, mô tả 13 px `text-muted`):

| Tên      | `href`      | Icon    | Màu          | Mô tả                       |
| -------- | ----------- | ------- | ------------ | --------------------------- |
| Ồn trắng | `/on-trang` | `wave`  | `cat-sleep`  | Tiếng ồn đều giúp bé dễ ngủ |
| Nhạc     | `/nhac`     | `music` | `cat-feed`   | Danh sách nhạc cho bé       |
| Ảnh      | `/anh`      | `image` | `cat-diaper` | Ảnh của bé                  |
| Bồng bế  | `/bong-be`  | `hands` | `cat-tummy`  | Tư thế bế, ợ hơi, cho bú    |

### 3.6 Icon mới

Thêm vào `lib/ui/icons.ts` 5 icon nét, cùng khung 24×24 và kiểu nét với các icon đang có: `pulse` (tab Sức khỏe), `grid` (tab Tiện ích), `flag` (mục tiêu), `alert` (tam giác cảnh báo), `pencil` (sửa).

## 4. Mục "Cần chú ý"

`lib/rules/attention.ts`, hàm thuần `attentionItems(input): AttentionItem[]`. `AttentionItem` = `{ key, icon, color, title, detail, tone: "normal" | "warn" | "danger", href }`. Trả về tối đa 4 dòng, theo đúng thứ tự ưu tiên dưới đây; dòng thứ 5 trở đi bị bỏ.

| Thứ tự | Nguồn                                                             | Điều kiện                           | `title`              | `detail`                                                           | `tone`                       | `href`                   |
| ------ | ----------------------------------------------------------------- | ----------------------------------- | -------------------- | ------------------------------------------------------------------ | ---------------------------- | ------------------------ |
| 1      | Cảnh báo tăng trưởng (§5.1), mỗi cảnh báo một dòng, đỏ trước vàng | Lần đo gần nhất có cảnh báo         | Tiêu đề cảnh báo     | Lời khuyên của cảnh báo                                            | đỏ → `danger`, vàng → `warn` | `/tang-truong`           |
| 2      | Tiêm chủng (`nextDose`)                                           | `state === "overdue"`               | `Quá hạn: {tên mũi}` | `Hẹn {dd/mm}`                                                      | `warn`                       | `/tiem-chung`            |
| 3      | Tiêm chủng (`nextDose`)                                           | Hạn trong 14 ngày tới, chưa quá hạn | `{tên mũi}`          | `Hẹn {dd/mm} · còn {n} ngày`; khi `n = 0` cả dòng là `Hẹn hôm nay` | `normal`                     | `/tiem-chung`            |
| 4      | Kỳ đo (§8.3)                                                      | `measureDue` đúng                   | `Đến kỳ đo`          | `Lần đo gần nhất {dd/mm}`; chưa đo lần nào → `Chưa có lần đo nào`  | `normal`                     | `/tang-truong`           |
| 5      | Giấc ngủ (§7.1)                                                   | Chip là "Ít hơn chuẩn"              | `Ngủ ít hơn chuẩn`   | `{x} giờ mỗi ngày · nên {min}–{max} giờ`                           | `warn`                       | `/thong-ke`              |
| 6      | Nằm sấp (§7.1)                                                    | Chip là "Còn thiếu"                 | `Nằm sấp còn ít`     | `{n} phút mỗi ngày · nên từ 30 phút`                               | `warn`                       | `/tang-truong/chieu-cao` |

Vẽ: `ListGroup`, mỗi dòng là `ListRow` có icon trong vòng 36 px, mũi tên phải. `detail` của dòng `warn` dùng `text-warn` đậm 600; của dòng `danger` dùng `text-danger` đậm 600. Icon và màu: tăng trưởng `ruler` / `cat-tummy`; tiêm chủng `syringe` / `cat-temp`; kỳ đo `ruler` / `cat-tummy`; giấc ngủ `moon` / `cat-sleep`; nằm sấp `smile` / `cat-tummy`.

Dữ liệu nào chưa tải xong (mất mạng, đang tải, lỗi) thì các dòng của nguồn đó không hiện; không vẽ khung chờ cho khối này.

## 5. Tăng trưởng

### 5.1 Luật cảnh báo

`lib/rules/growthAlerts.ts`, hàm thuần `growthAlerts({ rows, tables, dob, sex, babyName }): GrowthAlert[]`. `tables` là 3 bảng LMS của giới tính đó. Chỉ **lần đo gần nhất của từng chỉ số** (theo `measured_on`, rồi `created_at`) mới sinh cảnh báo. "z" tính bằng `assess` có sẵn. Lần đo có ngày tuổi ngoài 0–1856 bị loại trước khi chọn lần gần nhất và không bao giờ làm lần so sánh.

Trên màn hình, ba bảng của giới tính đó tải bằng `useWhoTable` có sẵn (trang Sức khỏe và trang Tăng trưởng đều tải cả ba); bảng nào chưa tải xong thì chỉ số đó chưa có chip và chưa sinh cảnh báo.

Các loại cảnh báo, theo từng chỉ số:

| Loại                   | Chỉ số       | Điều kiện                                                                                                                                                                                            | Mức  |
| ---------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `veryLow` / `veryHigh` | cả ba        | z < −3 / z > 3                                                                                                                                                                                       | đỏ   |
| `loss`                 | cân nặng     | Lấy lần đo cân gần nhất trong số các lần thỏa cả hai: cách lần gần nhất ≥ 14 ngày, và ngày tuổi của chính nó ≥ 14 (không so với cân lúc sinh). Có lần như vậy và cân gần nhất nhỏ hơn cân của lần đó | vàng |
| `falling`              | cả ba        | Trong các lần đo cùng chỉ số có `measured_on` cách lần gần nhất từ 14 đến 183 ngày (tính cả 14 và 183), lấy z lớn nhất `zRef`; `zRef − z ≥ 1,33`                                                     | vàng |
| `rising`               | chỉ vòng đầu | Cùng cửa sổ, lấy z nhỏ nhất `zMin`; `z − zMin ≥ 1,33`                                                                                                                                                | vàng |
| `low` / `high`         | cả ba        | −3 ≤ z < −2 / 2 < z ≤ 3                                                                                                                                                                              | vàng |

Mỗi chỉ số tối đa một cảnh báo, chọn theo thứ tự ưu tiên: `veryLow`/`veryHigh` → `loss` → `falling`/`rising` (nếu vòng đầu thỏa cả hai thì lấy `falling`) → `low`/`high`. Danh sách trả về xếp đỏ trước vàng, rồi cân nặng, chiều dài, vòng đầu.

Ngưỡng ±2 và ±3 là ngưỡng `rateZ` đang dùng. 1,33 là hai dải bách phân vị (mỗi dải 0,67 z).

Chữ của cảnh báo. `{Chỉ số}` là "Cân nặng", "Chiều dài", "Vòng đầu"; `{giới}` là "bé trai" hoặc "bé gái"; `{d}` là số ngày giữa lần gần nhất và lần so sánh. "Lần so sánh" của `loss` là lần đo cân nêu ở bảng trên; của `falling` là lần đo đã cho `zRef`; của `rising` là lần đo đã cho `zMin` (nhiều lần cùng z thì lấy lần mới nhất).

| Loại                            | Tiêu đề                         | Nội dung                                                                                                     | Lời khuyên                     | Chip       |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------ | ---------- |
| `veryLow`                       | `{Chỉ số} thấp hơn chuẩn nhiều` | `{giá trị} lúc {tuổi}, thấp hơn gần như mọi {giới} cùng tuổi.`                                               | Nên cho bé đi khám.            | Rất thấp   |
| `veryHigh`                      | `{Chỉ số} cao hơn chuẩn nhiều`  | `{giá trị} lúc {tuổi}, cao hơn gần như mọi {giới} cùng tuổi.`                                                | Nên cho bé đi khám.            | Rất cao    |
| `loss`                          | `Cân nặng giảm`                 | `{Tên bé} nhẹ hơn {Δ} g so với lần đo {dd/mm}.`                                                              | Nên hỏi bác sĩ ở lần khám tới. | Giảm cân   |
| `falling` (cân nặng)            | `Cân nặng tăng chậm lại`        | `{Tên bé} tăng {Δ} g trong {d} ngày, khoảng {a} g mỗi ngày. Bé cùng tuổi thường tăng khoảng {e} g mỗi ngày.` | Nên hỏi bác sĩ ở lần khám tới. | Tăng chậm  |
| `falling` (chiều dài, vòng đầu) | `{Chỉ số} tăng chậm lại`        | `{Tên bé} tăng {Δ} cm trong {d} ngày. Bé cùng tuổi thường tăng khoảng {e} cm trong cùng thời gian.`          | Nên hỏi bác sĩ ở lần khám tới. | Tăng chậm  |
| `rising`                        | `Vòng đầu tăng nhanh`           | `{Tên bé} tăng {Δ} cm trong {d} ngày. Bé cùng tuổi thường tăng khoảng {e} cm trong cùng thời gian.`          | Nên hỏi bác sĩ ở lần khám tới. | Tăng nhanh |
| `low`                           | `{Chỉ số} thấp hơn chuẩn`       | `{giá trị} lúc {tuổi}.`                                                                                      | Nên hỏi bác sĩ ở lần khám tới. | Thấp       |
| `high`                          | `{Chỉ số} cao hơn chuẩn`        | `{giá trị} lúc {tuổi}.`                                                                                      | Nên hỏi bác sĩ ở lần khám tới. | Cao        |

`{Δ}` và `{a}` tính so với lần so sánh; `{a}` = Δ g chia `d`, làm tròn số nguyên. `{e}` là mức tăng của đường giữa WHO giữa hai ngày tuổi đó: `M(ngày sau) − M(ngày trước)`; với cân nặng chia thêm cho `d` và đổi ra g, làm tròn số nguyên. cm làm tròn 1 chữ số thập phân, dấu phẩy. Mọi phép làm tròn trong spec này là làm tròn nửa lên (`Math.round` sau khi nhân hệ số). Nếu `falling` hoặc `rising` không có lần so sánh nào (không thể xảy ra theo điều kiện, nhưng phòng dữ liệu sửa giữa chừng) thì nội dung chỉ còn câu `{giá trị} lúc {tuổi}.`.

Không có cảnh báo thì chip của chỉ số là "Bình thường" (nền `good-soft`), trừ khi chỉ số đó gần ranh: khi ấy chip là "Gần mức thấp" hoặc "Gần mức cao" (§5.6).

### 5.2 Câu so sánh

**Bỏ ngày 2026-11-25, theo người dùng** ("không cần nặng hơn ... trong 100 hoặc dài hơn, quá nhiều thông tin gây rối"). Bản đầu có câu `Nặng hơn {n} trong 100 {giới} cùng tuổi` (`Dài hơn`, `Cao hơn`, `Lớn hơn` cho chiều dài và vòng đầu), do `comparePhrase` trong `lib/rules/growthForm.ts` viết, dùng ở bốn chỗ: dòng dưới thanh của thẻ kết luận (§5.3), nội dung thẻ cảnh báo `low` và `high` (§5.1), `aria-label` của thanh vị trí (§5.6) và câu `trước đó là {n} trong 100` của chỉ số có cảnh báo `falling` hoặc `rising` (§5.3). Người dùng chọn bỏ ở cả bốn chỗ. `comparePhrase` và `outOf100` xóa cùng test; trường `previousPercentile` của `GrowthAlert` và trường `compare` của `IndicatorSummary` cũng bỏ. Hai câu nói về chuẩn chứ không nói về bé thì giữ: "95 trong 100 bé khỏe mạnh nằm trong vùng xanh." dưới biểu đồ (§5.4) và câu trong popup "Vì sao có cảnh báo này?" (§5.3). Nội dung thẻ `veryLow`, `veryHigh` ("… hơn gần như mọi {giới} cùng tuổi") không đổi.

`formatZ` và `formatPercentile` không còn chỗ dùng thì xóa cùng test.

### 5.3 Bố cục màn Tăng trưởng

`GrowthScreen`, các khối cách nhau 18 px, theo thứ tự:

1. `PageHeader title="Tăng trưởng"`, quay lại Sức khỏe, nút `+` "Thêm lần đo" (như cũ).
2. **Thẻ cảnh báo**, mỗi cảnh báo một thẻ, theo thứ tự của `growthAlerts`. Vàng: nền `warn-soft`, viền `warn` 35%, chữ `warn-ink`. Đỏ: nền `danger-soft`, viền `danger` 35%, chữ `danger-ink`. Trong thẻ: vòng tròn 44 px nền đặc (`warn` hoặc `danger-solid`) có icon `alert`; tiêu đề 20 px đậm; nội dung; lời khuyên đậm 700; hai nút cao 44 px: "Báo cáo cho bác sĩ" (`Link` tới `/bao-cao`, nền đặc cùng màu vòng tròn) và "Vì sao có cảnh báo này?" (nút chữ gạch chân, mở popup giữa màn hình theo kiểu popup của spec `2026-11-15-kim-bun-hong-diu-thuoc-popup-design.md`). Popup có tiêu đề "Vì sao có cảnh báo này?" và đúng một đoạn theo loại:
   - `veryLow`, `veryHigh`, `low`, `high`: "App so số đo của bé với chuẩn tăng trưởng của WHO cho trẻ cùng tuổi, cùng giới. Số đo này nằm ngoài vùng của 95 trong 100 bé khỏe mạnh. Có bé vẫn khỏe dù nằm ngoài vùng này, nên bác sĩ là người kết luận."
   - `falling`, `rising`: "App so vị trí của bé trên biểu đồ WHO giữa các lần đo trong 6 tháng gần đây. Vị trí đã đổi hai dải trở lên. Đo lệch tay cũng có thể gây ra điều này, nên hãy đo lại rồi hỏi bác sĩ."
   - `loss`: "Sau hai tuần đầu, cân nặng của bé thường chỉ tăng. Lần cân này thấp hơn lần trước. Cân khác nhau hoặc cân lúc bé vừa bú cũng có thể gây lệch, nên hãy cân lại rồi hỏi bác sĩ."
3. **Thẻ kết luận** (`glass` bo 26 px, đệm 16 px):
   - Không có cảnh báo: vòng tròn 44 px nền `good-soft` có icon `check`, tiêu đề 20 px đậm `{Tên bé} đang lớn đều`, dòng phụ `Đo gần nhất {dd/mm} · {tuổi}`. Có cảnh báo: chỉ dòng phụ.
   - Mỗi chỉ số từng có số đo (ngày tuổi trong 0–1856) một khối, theo thứ tự Cân nặng, Chiều dài, Vòng đầu: hàng tên · giá trị đậm (`formatGrowthValue`) · chip (§5.1); thanh vị trí; dòng `{chênh}`. `{chênh}` là `+{Δ} sau {d} ngày` so với lần đo cùng chỉ số liền trước (dấu − khi giảm), kể cả khi chỉ số đang có cảnh báo; không có lần trước thì không có dòng này. (Sửa 2026-11-25: bản đầu ghi `{so sánh} · {chênh}`, và `trước đó là {n} trong 100` khi có cảnh báo `falling` hoặc `rising`; xem §5.2.)
   - Thanh vị trí: chấm 20 px màu `ink` viền 3 px `glass-solid`, đặt ở `clamp((z + 3) / 6, 0, 1) × 100%`. Ba vùng, canh giữa theo chiều dọc: 0–16,7% là một vạch cao 6 px màu `warn` 35%; 16,7–83,3% (z từ −2 đến +2) là một viên bo tròn cao 10 px màu `good` 45%; 83,3–100% là một vạch cao 6 px màu `warn` 35%. Hai loại vùng phải khác nhau về chiều cao, không chỉ về màu. (Sửa 2026-11-25: bản đầu ghi cả ba vùng cao 10 px, màu 35%; theme Ban đêm đặt `good` và `warn` cùng một màu nên hai loại vùng trùng nhau.) Thanh là `role="img"`; `aria-label` của nó ghi ở §5.6.
   - Cuối thẻ, sau đường kẻ: chú giải 12 px hai mục "Bình thường" và "Thấp hoặc cao hơn chuẩn", mỗi mục kèm một ô màu của vùng tương ứng.
4. **Thẻ mục tiêu chiều cao** (§6.4).
5. **Thanh chọn chỉ số** (`Segmented`): Cân nặng · Chiều dài · Vòng đầu. Chỉ số đang có cảnh báo có thêm chấm 8 px (`warn` hoặc `danger`) cạnh nhãn, kèm `aria-label="có cảnh báo"`. Chỉ số chọn sẵn khi mở trang: chỉ số đầu tiên có cảnh báo; không có thì Cân nặng.
6. **Thẻ biểu đồ** (§5.4).
7. **Các lần đo** (§5.5).

Chưa có lần đo nào: chỉ có mục 1, `EmptyState` hiện có, và thẻ mục tiêu chiều cao. Các trạng thái chờ mạng, đang tải, lỗi giữ như hiện tại.

### 5.4 Biểu đồ

`GrowthChart` (recharts có sẵn), cao 288 px, tiêu đề 15 px đậm 600 `{Chỉ số} theo tháng tuổi`:

- Thay 5 đường P3–P97 bằng: một **vùng tô** giữa z = −2 và z = +2 (màu `good` 14%) và một **đường giữa** z = 0 nét đứt màu `good-ink` dày 1,5 px. `PERCENTILE_LINES` đổi thành `BAND_LINES` = z −2, 0, +2; `curve()` trả 3 giá trị đó.
- Ba nhãn chữ 11 px trong biểu đồ: "Cao hơn chuẩn" ở góc trên trái (phía trên vùng tô), "Bình thường" ở mép phải trong vùng tô (màu `good-ink`, đậm 600), "Thấp hơn chuẩn" ở góc dưới phải (phía dưới vùng tô).
- Số đo của bé: các chấm bán kính 4,5 px màu `accent`, nối nhau bằng đường `accent` dày 2,5 px. Chấm của lần gần nhất bán kính 6,5 px, viền `glass-solid`, có nhãn 13 px đậm: giá trị, hoặc `{giá trị} · {chip}` khi chỉ số đang có cảnh báo; khi ấy chấm đổi màu `warn` (vàng) hoặc `danger` (đỏ). Nhãn có viền 4 px màu `glass-solid` quanh chữ để đọc được ở chỗ nó chạm đường của bé, vùng tô hay lưới.
- Chỗ đặt nhãn của chấm mới nhất (sửa 2026-11-25 sau lần kiểm trình duyệt của M2d: nhãn canh giữa theo chấm bị đường của bé cắt và đè lên trục dọc). `chartLabelPlace({ day, to, alert, change })` trong `lib/rules/growthView.ts`, với `change` là số đo mới nhất trừ số đo ngay trước (null khi chỉ có một lần đo):
  - Chiều ngang: chấm ở nửa trái của trục (`day × 2 ≤ to`) thì nhãn bắt đầu tại tâm chấm và chạy sang phải; ở nửa phải thì nhãn kết thúc tại tâm chấm và chạy sang trái.
  - Chiều dọc, nửa trái: trên chấm khi bình thường, dưới chấm khi có cảnh báo.
  - Chiều dọc, nửa phải: nhãn nằm phía đường của bé không đi tới: `change > 0` thì trên chấm, `change < 0` thì dưới chấm (kể cả nhãn cảnh báo); `change` bằng 0 hoặc null thì như nửa trái.
  - Vùng vẽ có thêm 20 px trống phía trên (lề trên 28 px) để nhãn nằm trên một chấm sát đỉnh trục không bị cắt.
  - Chữ "Bình thường" trong vùng tô ẩn khi `day > 0,7 × to`. Chữ "Cao hơn chuẩn" ẩn khi nhãn cảnh báo nằm trên chấm và chạy sang trái.
- Trục: đơn vị ("kg" hoặc "cm") ở đầu trục dọc; trục ngang theo tháng, nhãn cuối là `{n} tháng`. Khoảng trục ngang dùng `chartRange` hiện có.
- Dưới biểu đồ: chú giải 12 px (chấm `accent` + tên bé; ô màu vùng tô + "Vùng bình thường"; nét đứt + "Mức giữa"; khi có cảnh báo thêm chấm `warn`/`danger` + "Lần đo có cảnh báo"), rồi đoạn 13 px `text-muted`: "95 trong 100 bé khỏe mạnh nằm trong vùng xanh. Nguồn: WHO Child Growth Standards." Khi chỉ số đang có cảnh báo `falling` hoặc `rising`, thêm câu: "App cảnh báo theo hướng đi của bé, không chỉ theo vị trí."
- Biểu đồ có `role="img"` và `aria-label` mô tả: tên chỉ số, số lần đo, chip của lần gần nhất.

Bản vẽ tô thêm dải P15–P85 và ghi "94 trong 100": không làm dải trong, và con số đúng là 95 vì vùng tô theo z ±2.

### 5.5 Các lần đo

`GrowthList`, tiêu đề "Các lần đo", mỗi lần đo một hàng (chạm để sửa như cũ):

- Dòng 1, 16 px đậm 600: `{dd/mm} · {tuổi}`; lần đo vào đúng ngày sinh ghi `{dd/mm} · lúc sinh`.
- Dòng 2: các số đo có giá trị, cách nhau " · ": `{kg} · {cm} · vòng đầu {cm}`.
- Dòng 3, 13 px `text-muted`: chênh so với hàng liền dưới, chỉ các chỉ số có ở cả hai hàng: `+1,5 kg · +6,3 cm so với lần trước`. Hàng cũ nhất, hoặc không có chỉ số chung, thì không có dòng 3.
- Chip (hoặc chữ "Ngoài bảng WHO") nằm bên phải dòng 1 và chỉ chia bề ngang với dòng 1; dòng 2 và dòng 3 dùng hết bề ngang của hàng. Lý do: ở 375 px, chip đứng cạnh cả ba dòng làm dòng 2 của hàng đủ ba chỉ số bị ngắt giữa số và đơn vị.
- Dòng 1 không bao giờ bị ngắt giữa chừng. Khi chip quá dài để đứng cùng dòng với nó (ví dụ "Gần mức thấp" cạnh "25/11 · 11 tháng 29 ngày" ở 375 px), chip xuống ngay dưới dòng 1, canh trái. (Bổ sung 2026-11-25 khi viết plan M2g, người dùng duyệt cùng ngày.)
- `PendingMark` đứng sau các số đo ở dòng 2, là dòng có trọn bề ngang. Trước đó nó đứng sau chữ của dòng 1 và rớt xuống một dòng riêng khi dòng 1 dài. (Bổ sung 2026-11-25 khi viết plan M2g, người dùng duyệt cùng ngày.)
- Nội dung chip: với hàng là lần gần nhất của một chỉ số đang có cảnh báo, lấy chip của cảnh báo đứng trước trong thứ tự `growthAlerts` trả về (đỏ trước vàng, rồi cân nặng, chiều dài, vòng đầu); các hàng khác xét theo vị trí z của từng chỉ số trong hàng: có |z| > 3 → "Rất thấp" hoặc "Rất cao" (nền `danger-soft`); có 2 < |z| ≤ 3 → "Thấp" hoặc "Cao" (nền `warn-soft`); còn lại "Bình thường" (nền `good-soft`). Ngày tuổi ngoài 0–1856 → chữ "Ngoài bảng WHO" như cũ. Chip không còn phụ thuộc chỉ số đang chọn ở thanh chọn. Trước khi ghi "Bình thường", xét thêm gần ranh (§5.6) theo vị trí z của từng chỉ số trong hàng, theo thứ tự cân nặng, chiều dài, vòng đầu: chỉ số đầu tiên gần ranh cho chip "Gần mức thấp" hoặc "Gần mức cao" (nền `warn-soft`).

### 5.6 Bình thường nhưng gần ranh, và số chuẩn

Bổ sung ngày 2026-11-25. Người dùng thấy bé dài hơn 6 trong 100 bé mà thẻ chỉ ghi "Bình thường", và muốn biết chuẩn là bao nhiêu để tự so.

**Gần ranh.** `nearKind(z)` trong `lib/rules/growthAlerts.ts`:

| Kết quả    | Điều kiện   |
| ---------- | ----------- |
| `nearLow`  | −2 ≤ z < −1 |
| `nearHigh` | 1 < z ≤ 2   |
| `null`     | còn lại     |

z = −1 là mức bé nặng hoặc dài hơn 16 trong 100 bé cùng tuổi, cùng giới; z = +1 là hơn 84 trong 100. Gần ranh chỉ xét cho lần đo gần nhất của từng chỉ số (như §5.1) và chỉ khi chỉ số đó **không có cảnh báo**: cảnh báo luôn thắng. Gần ranh không phải cảnh báo: không có thẻ cảnh báo, không có dòng "Cần chú ý", không có push, không có chấm trên thanh chọn chỉ số, không đổi màu chấm của biểu đồ.

Chip của chỉ số gần ranh: "Gần mức thấp" hoặc "Gần mức cao", nền `warn-soft`, chữ `warn-ink`.

**Số chuẩn.** `standardRange(lms)` = `{ low: valueAtZ(lms, −2), mid: lms.m, high: valueAtZ(lms, +2) }`, lấy `lms` tại ngày tuổi của lần đo gần nhất của chỉ số đó. Cả ba số luôn viết đúng 1 chữ số thập phân, dấu phẩy, kể cả khi là số tròn: "4,7", "6,0", "56,0". Hai ranh làm tròn **vào trong**: `low` làm tròn lên, `high` làm tròn xuống (55,945 viết "56,0"; 7,59 viết "7,5"); `mid` làm tròn nửa lên. Lý do: cảnh báo ở §5.1 xét theo ranh chính xác, nên nếu ranh làm tròn nửa lên thì bé dài 55,9 cm bị báo "Thấp" trong khi nhãn lại ghi mức thấp nhất của chuẩn là "55,9 cm". (Sửa 2026-11-25 sau lần đọc của reviewer, người dùng duyệt cùng ngày; bản đầu ghi cả ba số làm tròn nửa lên.)

Trong mỗi khối chỉ số của thẻ kết luận (§5.3), ngay dưới thanh vị trí, thêm một hàng cao 16 px gồm ba nhãn 12 px `text-muted`, mỗi nhãn canh giữa theo đúng điểm của nó trên thanh:

| Vị trí | Chữ               |
| ------ | ----------------- |
| 16,7%  | `{low} {đơn vị}`  |
| 50%    | `giữa {mid}`      |
| 83,3%  | `{high} {đơn vị}` |

`{đơn vị}` là "kg" hoặc "cm". Khi chỉ số gần mức thấp, nhãn ở 16,7% đậm 700 màu `warn`; gần mức cao thì nhãn ở 83,3%. Hàng nhãn có mặt ở mọi chỉ số, kể cả khi đang có cảnh báo. `aria-label` của thanh vị trí là `{chip}. Chuẩn từ {low} đến {high} {đơn vị}, giữa {mid}.` (sửa 2026-11-25: bỏ câu so sánh, §5.2); hàng nhãn là `aria-hidden`.

Chỉ số gần ranh có thêm một dòng 13 px đậm 600 màu `warn`, nằm giữa hàng nhãn và dòng chênh:

- gần mức thấp: `Cách mức thấp nhất của chuẩn {d} {đơn vị}`;
- gần mức cao: `Cách mức cao nhất của chuẩn {d} {đơn vị}`.

`{d}` là khoảng từ giá trị đã làm tròn 1 chữ số thập phân (nửa lên) tới ranh như đã viết trên nhãn, viết 1 chữ số thập phân, để người đọc tự trừ hai số trên màn ra đúng `{d}`. Khi `{d}` bằng 0, hoặc giá trị đã làm tròn nằm quá ranh đã viết (chỉ xảy ra với cân nặng, trong khoảng dưới 0,1 kg): `Sát mức thấp nhất của chuẩn` hoặc `Sát mức cao nhất của chuẩn`. Cân nặng trên thẻ có thể viết tới 2 chữ số thập phân ("5,72 kg"); khi đó phép trừ của người đọc lệch tối đa 0,05 kg so với `{d}`.

**Tiêu đề và dòng nhắc của thẻ kết luận.**

- Không có cảnh báo và không có chỉ số gần ranh: như §5.3, "{Tên bé} đang lớn đều".
- Không có cảnh báo, có ít nhất một chỉ số gần ranh: vẫn có vòng tròn dấu tích, tiêu đề là `{Tên bé} phát triển bình thường`.
- Có cảnh báo: như §5.3, không có tiêu đề.

Hễ có chỉ số gần ranh (dù có cảnh báo ở chỉ số khác hay không), ngay dưới phần tiêu đề là một đoạn nền `warn-soft`, chữ `warn-ink`, bo 16 px, đệm 10×12 px, chữ 14/20:

- câu thứ nhất đậm 700, cho các chỉ số gần mức thấp: `{danh sách} đang gần mức thấp của chuẩn.`;
- câu thứ hai đậm 700, cho các chỉ số gần mức cao: `{danh sách} đang gần mức cao của chuẩn.`;
- câu cuối, chữ thường: `Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới.`

Chỉ có câu nào có chỉ số. `{danh sách}` theo thứ tự cân nặng, chiều dài, vòng đầu; chỉ chữ đầu câu viết hoa: "Chiều dài", "Cân nặng và chiều dài", "Cân nặng, chiều dài và vòng đầu".

Câu "nên theo dõi ở các lần đo tới" là lời khuyên mới, người dùng duyệt ngày 2026-11-25.

**Chỗ khác dùng trạng thái này:** chip của thẻ Tăng trưởng ở trang Sức khỏe (§3.4), tính từ lần đo gần nhất của từng chỉ số (như thẻ kết luận, không phải chỉ hàng mới nhất); và chip của từng hàng trong danh sách các lần đo (§5.5), ở đó `nearKind` được xét theo vị trí z của chính hàng đó, kể cả hàng cũ.

## 6. Chiều cao (gói A)

### 6.1 Dữ liệu

Migration `supabase/migrations/20261125000100_height_goal.sql`:

```sql
alter table public.babies
  add column father_height_cm numeric(4, 1)
    check (father_height_cm is null or father_height_cm between 120 and 220),
  add column mother_height_cm numeric(4, 1)
    check (mother_height_cm is null or mother_height_cm between 120 and 220),
  add column target_height_cm numeric(4, 1)
    check (target_height_cm is null or target_height_cm between 120 and 220);
```

Không đổi RLS: mọi thành viên đọc, chỉ chủ gia đình sửa. pgTAP `supabase/tests/014_height_goal.test.sql`: 3 cột tồn tại và nullable; giá trị 119,9 và 220,1 bị từ chối, 120 và 220 được nhận; thành viên không phải chủ không sửa được 3 cột. Chạy `bun run db:types` sau migration.

### 6.2 Luật

`lib/rules/heightGoal.ts`, mọi hàm thuần:

- **Khoảng di truyền** `midParental(father, mother, sex)`: `mid = (father + mother + 13) / 2` cho bé trai, `(father + mother − 13) / 2` cho bé gái; `low = round(mid − 8,5)`, `high = round(mid + 8,5)`, là số nguyên. `mid` giữ nguyên, hiển thị 1 chữ số thập phân. Mọi chỗ hiển thị và mọi phép so sánh với khoảng đều dùng `low`, `high` đã làm tròn này. Ví dụ bố 175, mẹ 160, bé trai: `mid` = 174, `low` = 166 (165,5 làm tròn lên), `high` = 183 (182,5 làm tròn lên).
- **Chuẩn người lớn**: file `content/who/adult_height.json` = `{ "source": <url>, "reviewedAt": "YYYY-MM-DD", "boys": { "l", "m", "s" }, "girls": { "l", "m", "s" } }`, là L, M, S của WHO Growth Reference 2007, chiều cao theo tuổi, tại 228 tháng (19 tuổi). Sinh bằng cách mở rộng `scripts/build-who.ts` đọc file z-score chiều cao theo tuổi 5–19 của WHO cho bé trai và bé gái (trang "Growth reference data for 5–19 years › Height-for-age" trên who.int; URL chính xác ghi vào `source`). Script phải tự kiểm: M bé trai trong 176,0–177,0 cm, M bé gái trong 162,7–163,7 cm; lệch thì dừng và báo người dùng. Có schema zod và test như `WhoTableSchema`.
- **z mục tiêu** `targetZ(target, sex)` = `zScore(adult[sex], target)`.
- **Đường mục tiêu** `targetCurve(lhfaRows, z, toDay, step)`: mỗi ngày tuổi một điểm `valueAtZ(lmsAt(day), z)`.
- **Trạng thái** `goalStatus(length, day, z)`: `diff = length − valueAtZ(lmsAt(day), z)`, làm tròn 1 chữ số thập phân.
  - `|diff| < 1,0` → câu "Sát đường mục tiêu", chip `good-soft` "Đang đúng hướng".
  - `diff ≥ 1,0` → câu `Trên đường mục tiêu {diff} cm`, chip `good-soft` "Đang đúng hướng".
  - `diff ≤ −1,0` → câu `Dưới đường mục tiêu {|diff|} cm`, chip nền `line` chữ `ink` "Dưới đường mục tiêu". Đây không phải cảnh báo: không dùng màu vàng, đỏ.
  - Chưa có lần đo chiều dài trong 0–1856 ngày tuổi → câu "Chưa có lần đo chiều dài", không có chip.
- **Mục tiêu so với khoảng di truyền** `targetVsRange(target, range)`:
  - `target > high` → "Mục tiêu {t} cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt."
  - `target < low` → "Mục tiêu {t} cm thấp hơn khoảng dự kiến."
  - còn lại → `Mục tiêu {t} cm nằm trong khoảng, ở nửa {trên|dưới}.` ("trên" khi `target ≥ mid`).
- **Tốc độ tăng** `lengthVelocity(rows, lhfaRows, dob)`: lấy lần đo chiều dài gần nhất và lần đo chiều dài gần nhất cách nó ≥ 14 ngày. `rate = Δcm / d × 30,4375` (cm mỗi tháng); `expected = (M(ngày sau) − M(ngày trước)) / d × 30,4375`. Cả hai làm tròn 1 chữ số thập phân khi hiển thị; phép so sánh của chip dùng giá trị chưa làm tròn. Chip: `rate ≥ 0,75 × expected` → `good-soft` "Tăng tốt"; ngược lại nền `line` chữ `ink` "Chậm hơn thường gặp". Không đủ hai lần đo → trả null.

### 6.3 Trang Chiều cao

Đường dẫn `/tang-truong/chieu-cao`, `components/height/HeightScreen.tsx`. Các khối cách nhau 18 px:

1. `PageHeader title="Chiều cao"`, quay lại `{ href: "/tang-truong", label: "Tăng trưởng" }`. Nút tròn icon `pencil`, `aria-label="Sửa mục tiêu và chiều cao bố mẹ"`, mở sheet §6.5; chỉ chủ gia đình thấy.
2. **Thẻ mục tiêu**: nhãn viết hoa "Mục tiêu lúc trưởng thành" đứng riêng một dòng; số `{t}` cỡ 44 px đậm kèm "cm", cùng hàng bên phải là chip của `goalStatus` (bổ sung 2026-11-25 sau lần kiểm trình duyệt của M3b, người dùng duyệt cùng ngày: chip đứng cạnh nhãn thì ở 375 px nhãn bị xuống hai dòng; khi số và chip không vừa một hàng thì chip xuống ngay dưới số, canh trái, không tràn khỏi thẻ); câu `{Tên bé} dài {x} cm lúc {tuổi}. {câu trạng thái}.` Chưa có mục tiêu: chữ "Chưa có mục tiêu chiều cao" và, với chủ gia đình, nút chính "Đặt mục tiêu" mở sheet §6.5; với thành viên khác, dòng "Chủ gia đình chưa đặt mục tiêu chiều cao."
3. **Thẻ "Di truyền dự kiến"**: bên phải tiêu đề là `Bố {f} cm · Mẹ {m} cm`. Thanh ngang thang đo từ `low − 6` đến `high + 7` cm: đoạn `low`–`high` tô `good` 35%; vạch `good` tại `mid`; vạch `accent` dày 4 px và nhãn nền `accent` "Mục tiêu {t}" tại mục tiêu (mục tiêu ngoài thang thì ghim ở mép thang); ba số `low`, `mid`, `high` dưới thanh. Thanh là `role="img"` có `aria-label` nêu ba số và mục tiêu. Dưới thanh: câu `Khoảng dự kiến {low}–{high} cm.` nối câu của `targetVsRange` (bỏ khi chưa có mục tiêu); rồi dòng `text-muted` "Tính từ chiều cao bố mẹ. Đây là ước lượng, phần lớn trẻ nằm trong khoảng này." Chưa nhập bố mẹ: thẻ chỉ có dòng "Nhập chiều cao bố mẹ để xem khoảng dự kiến."
4. **Thẻ "Đường tới {t} cm"** (chỉ khi có mục tiêu): biểu đồ chiều dài như §5.4 nhưng không có đường giữa và không có ba nhãn vùng; thêm đường mục tiêu nét đứt màu `cat-sleep` dày 2 px, nhãn "Đường mục tiêu" cùng màu ở mép phải. Nhãn này ẩn khi chấm mới nhất của bé nằm quá 60% bề ngang của trục (`day > 0,6 × to`), vì khi đó chấm hoặc nhãn của chấm nằm ngay dưới nó; chú giải dưới biểu đồ vẫn gọi tên đường. (Bổ sung 2026-11-25 sau lần đọc của reviewer plan M3b, người dùng duyệt cùng ngày.) Nhãn số đo của chấm mới nhất tránh đường mục tiêu: trong bốn chỗ quanh chấm (chỗ thường lệ của §5.4, phía bên kia của chấm, rồi hai chỗ đó chạy theo hướng ngược lại) lấy chỗ đầu tiên nằm trọn trong khung vẽ mà đường mục tiêu, đường của bé và nhãn "Đường mục tiêu" đều không đi qua, tính cả 3 px quanh chữ. Cả bốn đều vướng thì thử lại bốn chỗ đó, mỗi lần xa chấm thêm 4 px, tới 24 px; khi đó đường mục tiêu có thể nằm giữa chấm và nhãn. Vẫn không có chỗ thì nhãn giữ chỗ thường lệ. Luật tính trên khung vẽ của màn 375 px (`chartLabelPlace`, tham số `around`). (Bổ sung 2026-11-25 sau bước kiểm trình duyệt của M3b, khi nhãn nằm đè lên đường mục tiêu lúc bé đi sát đường; người dùng bảo sửa trước khi lên `main`.) Chú giải: tên bé, "Đường mục tiêu", "Vùng bình thường". Đoạn `text-muted`: `Đường mục tiêu là chiều dài ở từng tháng tuổi của một {giới} sẽ cao {t} cm khi lớn, nếu giữ nguyên vị trí trên biểu đồ WHO. Dưới 2 tuổi vị trí này còn thay đổi nhiều.`
5. **Thẻ "Tốc độ tăng"**: nhãn viết hoa "Tốc độ tăng"; chip; `{rate} cm mỗi tháng` 20 px đậm; dòng `text-muted` `Từ {dd/mm} đến {dd/mm} · bé cùng tuổi thường tăng khoảng {expected} cm mỗi tháng`. `lengthVelocity` trả null: dòng "Cần hai lần đo chiều dài cách nhau từ 14 ngày."
6. **Thói quen 7 ngày qua** (§7.1).
7. **Dinh dưỡng** (§7.3).
8. **Hàng nhắc đo** (§8.3).
9. Đoạn `text-muted`: "Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và nhắc việc, không thay lời khuyên của bác sĩ."

Bé quá 1856 ngày tuổi: mục 4 và 5 thay bằng một dòng "Bảng WHO trong app tới 5 tuổi."

Bản vẽ ghi "bé cùng tuổi thường tăng 3–4 cm mỗi tháng": app hiện một số `{expected}` tính từ bảng WHO, không hiện khoảng.

### 6.4 Thẻ mục tiêu trong màn Tăng trưởng

Một `Link` tới `/tang-truong/chieu-cao`, `glass` bo 26 px: vòng 40 px nền `accent-tint` có icon `flag`; mũi tên phải.

- Có mục tiêu: tên `Mục tiêu chiều cao {t} cm`; dòng phụ là câu trạng thái của `goalStatus` (màu `good` đậm 600 khi chip là "Đang đúng hướng", `text-muted` trong các trường hợp khác).
- Chưa có mục tiêu, chưa có chiều cao bố mẹ: tên "Mục tiêu chiều cao"; dòng phụ "Nhập chiều cao bố mẹ để xem khoảng dự kiến".
- Chưa có mục tiêu, đã có chiều cao bố mẹ: tên "Mục tiêu chiều cao"; dòng phụ `Chưa đặt mục tiêu · khoảng dự kiến {low}–{high} cm`.

Câu `{trạng thái}` trên thẻ Tăng trưởng của trang Sức khỏe (§3.4): "đang đúng hướng" khi chip là "Đang đúng hướng"; `dưới đường mục tiêu {|diff|} cm` khi dưới; "chưa có lần đo chiều dài" khi chưa đo.

### 6.5 Sheet "Mục tiêu chiều cao"

`Sheet` có sẵn, chỉ chủ gia đình mở được. Tiêu đề "Mục tiêu chiều cao" (sửa 2026-11-25 sau lần kiểm trình duyệt của M3c: tiêu đề cũ "Mục tiêu và chiều cao bố mẹ" xuống hai dòng ở 375 px; tên đọc của nút bút chì ở §6.3 mục 1 giữ nguyên); dòng phụ `Nhập một lần. App dùng để tính khoảng chiều cao dự kiến của {Tên bé}.` Ba ô nhập số (`inputMode="decimal"`, nhận cả "," và "." như `parseGrowthForm`), đơn vị "cm" bên phải: "Bố", "Mẹ", "Mục tiêu của con". Không có giá trị mặc định.

`parseHeightGoal(raw)` trong `lib/rules/heightGoal.ts`:

- Mỗi ô: trống hoặc số trong 120–220, sai → lỗi "Chiều cao từ 120 đến 220 cm."
- Bố và mẹ phải cùng trống hoặc cùng có → lỗi ở ô trống "Nhập cả bố và mẹ."
- Mục tiêu được để trống độc lập. Ba ô cùng trống là hợp lệ (xóa mục tiêu).
- Làm tròn 1 chữ số thập phân khi lưu.

Khi bố và mẹ hợp lệ, một hộp nền `good-soft` hiện ngay: `Khoảng dự kiến {low}–{high} cm` và, nếu có mục tiêu hợp lệ, câu của `targetVsRange`. Dưới hộp, dòng `text-muted`: "Nếu mục tiêu nằm ngoài khoảng dự kiến, app vẫn theo dõi nhưng sẽ nói rõ là khó đạt." Nút "Lưu" gọi `updateBaby`; lỗi mạng hiện bằng `toVietnameseError` như các sheet khác; không qua outbox.

## 7. Thói quen và dinh dưỡng (gói B)

### 7.1 Thói quen 7 ngày qua

`lib/rules/habits.ts`, hàm thuần `habitStats(logs, dob, now)`. Cửa sổ là 7 ngày Việt Nam trọn vẹn ngay trước hôm nay (không tính hôm nay). Phút ngủ và phút nằm sấp mỗi ngày tính bằng cách cắt theo nửa đêm của `lib/rules/dailyStats.ts` hiện có.

| Hàng      | Hiện khi        | Giá trị                                                                                                                                  | Chuẩn                                                             | Chip                                                                                                                |
| --------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Giấc ngủ  | luôn            | Trung bình phút ngủ mỗi ngày, viết `{g} giờ {pp} phút mỗi ngày`                                                                          | `dailyNorm("sleep", ageDays)` hiện có, viết `nên {min}–{max} giờ` | Trong khoảng → `good-soft` "Đủ"; dưới `min` → `warn-soft` "Ít hơn chuẩn"; trên `max` → nền `line` "Nhiều hơn chuẩn" |
| Nằm sấp   | ngày tuổi < 365 | Trung bình phút nằm sấp mỗi ngày, viết `{n} phút mỗi ngày`                                                                               | `nên từ 30 phút`                                                  | ≥ 30 → `good-soft` "Đủ"; < 30 → `warn-soft` "Còn thiếu"                                                             |
| Vitamin D | ngày tuổi < 730 | Số ngày trong 7 ngày có ít nhất một bản ghi thuốc có tên khớp `VITAMIN_D` (`lib/rules/medicineNames.ts`), viết `Đã uống {n} trên 7 ngày` | không                                                             | `n ≥ 6` → `good-soft` "Đều"; còn lại → nền `line` `Sót {7 − n} ngày`                                                |

Cách tính trung bình: chỉ chia cho **số ngày có dữ liệu** trong 7 ngày, không chia cho 7. Giấc ngủ: tổng phút ngủ của các ngày có phút ngủ > 0, chia cho số ngày đó. Nằm sấp: tổng phút nằm sấp của các ngày có bản ghi nằm sấp, chia cho số ngày đó. Làm tròn phút nguyên. Chip, thanh tiến độ và dòng "Cần chú ý" (§4) đều dùng đúng số trung bình này. Lý do: ngày không có bản ghi thường là ngày quên ghi, không phải ngày bé không ngủ hay không nằm sấp.

Đủ dữ liệu mới đánh giá:

- Giấc ngủ: ít nhất 5 trong 7 ngày có phút ngủ > 0. Không đủ → hàng chỉ có dòng "Chưa đủ dữ liệu ngủ 7 ngày", không có chip, không có thanh.
- Nằm sấp: ít nhất 3 trong 7 ngày có bản ghi nằm sấp. Không đủ → dòng "Tuần này chưa ghi nằm sấp", không có chip, không có thanh.

Nguồn của mốc 30 phút: WHO, "Guidelines on physical activity, sedentary behaviour and sleep for children under 5 years of age" (2019), mục trẻ dưới 1 tuổi. Chuẩn giấc ngủ là `SLEEP_BANDS` đang dùng ở Thống kê; spec này không đổi nó.

Vẽ trong trang Chiều cao: tiêu đề "Thói quen 7 ngày qua"; một nhóm `glass` bo 26 px, mỗi hàng: vòng icon 36 px (ngủ `moon` / `cat-sleep`; nằm sấp `smile` / `cat-tummy`; vitamin D `sun` / `cat-med`), tên 16 px đậm, dòng `{giá trị} · {chuẩn}` 13 px `text-muted`, chip; dưới là thanh tiến độ cao 6 px màu của hàng: ngủ `min(1, trung bình / (max × 60))`, nằm sấp `min(1, trung bình / 30)`, vitamin D `n / 7`. Thanh là trang trí (`aria-hidden`). Dưới nhóm: dòng `text-muted` "Chuẩn giấc ngủ như trang Thống kê. Nằm sấp: WHO 2019."; câu "Nằm sấp: WHO 2019." chỉ có khi hàng Nằm sấp đang hiện (bổ sung 2026-11-25 khi viết plan M4a, người dùng duyệt cùng ngày). Câu "Nằm sấp: WHO 2019." không ngắt giữa chừng (`whitespace-nowrap`): ở 375 và 390 px cả dòng dài hơn chỗ chứa vài px, nên cả câu xuống dòng hai thay vì để riêng chữ "2019." rớt xuống (sửa 2026-11-25 sau lần kiểm trình duyệt M4a; chữ không đổi). Chip đứng cùng dòng với tên của hàng; dòng `{giá trị} · {chuẩn}` nằm dưới và dùng hết bề ngang còn lại, vì ở 375 px chip "Nhiều hơn chuẩn" đứng cạnh dòng đó sẽ làm nó xuống ba dòng (bổ sung cùng lúc, người dùng duyệt cùng ngày).

### 7.2 Dữ liệu cho thói quen

Cần bản ghi `sleep`, `tummy`, `medicine` của 8 ngày gần nhất. Dùng lại hook đang tải bản ghi cho trang Thống kê (14 ngày); không thêm truy vấn mới nếu hook đó đã đủ.

### 7.3 Dinh dưỡng theo giai đoạn

File `content/nutrition.vi.json`, schema zod `lib/content/nutrition.ts` (`.strict()`, có test như các file nội dung khác):

```json
{
  "reviewedAt": "YYYY-MM-DD",
  "sources": [{ "name": "…", "url": "https://…" }],
  "stages": [
    {
      "id": "0-6m",
      "fromDay": 0,
      "toDay": 182,
      "title": "0–6 tháng",
      "items": ["…"]
    }
  ]
}
```

Bốn giai đoạn, `items` đúng từng chữ:

| `id`    | Ngày tuổi | `title`    | `items`                                                                                                                                                                                                                                                                     |
| ------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0-6m`  | 0–182     | 0–6 tháng  | "Bú mẹ hoàn toàn nếu có thể, bú theo nhu cầu của bé; nếu không, dùng sữa công thức." · "Vitamin D mỗi ngày theo chỉ định của bác sĩ." · "Chưa ăn dặm, chưa cần uống thêm nước."                                                                                             |
| `6-12m` | 183–364   | 6–12 tháng | "Bắt đầu ăn dặm từ khoảng 6 tháng, vẫn bú mẹ hoặc sữa công thức." · "Mỗi ngày có thức ăn giàu đạm và sắt: thịt, cá, trứng, đậu." · "Tăng dần độ đặc và số bữa: 2–3 bữa lúc 6–8 tháng, 3–4 bữa lúc 9–11 tháng." · "Không thêm muối, đường; không dùng mật ong trước 1 tuổi." |
| `1-2y`  | 365–729   | 1–2 tuổi   | "Ăn 3–4 bữa chính và 1–2 bữa phụ mỗi ngày." · "Mỗi ngày đủ bốn nhóm: tinh bột, đạm, chất béo, rau quả." · "Tiếp tục bú mẹ nếu có thể." · "Hạn chế đồ ngọt và nước ngọt."                                                                                                    |
| `2-5y`  | 730–1856  | 2–5 tuổi   | "Ăn cùng bữa với gia đình, mỗi ngày đủ đạm, rau quả, sữa." · "Hạn chế đồ ngọt, nước ngọt, đồ chiên rán và thức ăn nhanh." · "Khám và đo chiều cao định kỳ."                                                                                                                 |

`sources`: (1) WHO, "Infant and young child feeding" (trang fact sheet trên who.int); (2) WHO, "Guideline for complementary feeding of infants and young children 6–23 months of age" (2023); (3) Viện Dinh dưỡng Quốc gia (viendinhduong.vn). Người làm phải mở từng nguồn, đối chiếu từng dòng `items` trước khi commit, ghi URL thật vào `sources` và ngày đối chiếu vào `reviewedAt`. Dòng nào nguồn không nói như vậy thì dừng và báo người dùng, không tự sửa câu.

Đã đối chiếu 2026-11-25 khi viết plan M4b. Ba dòng được sửa theo nguồn, người dùng duyệt cùng ngày ("Dùng câu đề xuất"): dòng đầu của `0-6m` (WHO nói "theo nhu cầu" cho bú mẹ, không nguồn nào nói vậy cho sữa công thức); dòng "Mỗi ngày đủ bốn nhóm…" của `1-2y` (Viện Dinh dưỡng kể bốn nhóm bột đường, đạm, béo, vitamin và khoáng; không có nhóm "sữa"); dòng "Hạn chế đồ ngọt…" của `2-5y` (Viện nêu kẹo, nước ngọt, đồ chiên rán, thức ăn nhanh). Ba dòng chỉ khớp nguồn một phần được người dùng cho giữ nguyên: "Vitamin D mỗi ngày theo chỉ định của bác sĩ.", "Không thêm muối, đường; không dùng mật ong trước 1 tuổi.", "Ăn cùng bữa với gia đình, mỗi ngày đủ đạm, rau quả, sữa." Hướng dẫn WHO 2023 được đối chiếu qua bản tóm tắt của ENN (Field Exchange 72), không phải bản gốc.

`nutritionStage(ageDays)` trả giai đoạn hiện tại và giai đoạn kế (null ở giai đoạn cuối, và cả hai null khi quá 1856 ngày).

Vẽ trong trang Chiều cao: tiêu đề `Dinh dưỡng {title}`; nhóm `glass`: mỗi `item` một hàng có icon `check` màu `good` (không bấm được); hàng cuối là nút `Giai đoạn kế: {title kế}` kèm mũi tên, mở popup giữa màn hình liệt kê `items` của giai đoạn kế; giai đoạn cuối không có hàng này. Dưới nhóm: dòng `text-muted` `Nguồn: {tên các nguồn, cách nhau dấu phẩy}.` Quá 1856 ngày tuổi: cả khối không vẽ.

`scripts/copy-content.ts` tự chép file `.vi.json` này ra `public/content/` như các file khác; không cần sửa script.

## 8. Push

### 8.1 Dữ liệu

Migration `supabase/migrations/20261125000200_growth_push.sql`:

```sql
alter table public.notification_prefs
  add column growth_alert boolean not null default true,
  add column growth_measure boolean not null default true;

alter table public.notification_log drop constraint notification_log_kind_check;
alter table public.notification_log add constraint notification_log_kind_check
  check (kind in ('feed', 'wake', 'vaccine', 'medicine', 'timer', 'growth_alert', 'growth_measure'));
```

pgTAP `supabase/tests/015_growth_push.test.sql`: hai cột mặc định `true`; hai `kind` mới được nhận; `kind` lạ bị từ chối.

`lib/rules/notifications.ts`: `PrefKey` thêm `growth_alert`, `growth_measure`; `PREF_OPTIONS` thêm hai dòng cuối `{ key: "growth_alert", label: "Cảnh báo tăng trưởng", note: null }` và `{ key: "growth_measure", label: "Nhắc đo định kỳ", note: null }`. `Recipient.prefs` (`lib/rules/pushSelection.ts`) thêm hai trường tùy chọn; thiếu trường hoặc `prefs: null` nghĩa là bật.

### 8.2 Cảnh báo tăng trưởng (`growth_alert`)

`BabyDispatchState` thêm `name: string` và `growth: { dob: string; sex: "male" | "female"; rows: { id, measuredOn, weightG, lengthCm, headCm, createdBy, createdAt }[] }` (mọi dòng `growth` của bé, có thể rỗng; không bao giờ null — cả hai loại push ở §8.2 và §8.3 đều đọc từ đây). `lib/server/dispatchDeps.ts` tải thêm bảng `growth` và tên, giới tính của bé. Luật chạy trên server dùng cùng `growthAlerts` (§5.1) với 6 bảng WHO nhập từ `content/who/`.

`growthAlertNotifications(baby, now)`:

1. Lấy `latest` = dòng có `measured_on` lớn nhất (bằng nhau thì `created_at` lớn nhất).
2. Chỉ xét khi `now − latest.createdAt` < 24 giờ. Nhập bù một ngày cũ không phải lần gần nhất thì không có push.
3. `alerts` = các cảnh báo của `growthAlerts` mà chỉ số đó có giá trị trong chính dòng `latest`. Rỗng → không gửi.
4. Gửi cho mọi `recipient` thỏa cả ba: `growth_alert` bật; không phải `latest.createdBy`; không đang tạm tắt nhắc (`snooze_until`) và không đang trong giờ yên lặng, theo đúng cách nhắc thuốc đang xét. Đang yên lặng hay tạm tắt thì phút sau xét lại; quá 24 giờ thì thôi.

Thông báo:

- `kind: "growth_alert"`, `refKey: "growth:{latest.id}"` (mỗi người mỗi lần đo một lần; sửa lần đo không gửi lại), `tag: "growth:{babyId}"`, `url: "/tang-truong"`.
- `title`: `Tăng trưởng của {Tên bé} cần chú ý`.
- `body`: một cảnh báo → `{Tiêu đề cảnh báo}. {Lời khuyên}`; từ hai trở lên → `{n} chỉ số cần chú ý. Mở app để xem.`

Thêm vào `selectDueNotifications` sau `timerReminders`.

### 8.3 Nhắc đo (`growth_measure`)

`lib/rules/measureSchedule.ts`, hàm thuần `nextMeasureDue({ dob, lastMeasuredOn, today })`:

- `interval` = 30 ngày khi ngày tuổi hôm nay < 365, ngược lại 90 ngày.
- `due` = `lastMeasuredOn + interval`; chưa có lần đo nào → `dob + interval`.
- `measureDue` = `today ≥ due` và ngày tuổi hôm nay ≤ 1856.

`lastMeasuredOn` là `measured_on` lớn nhất trong bảng `growth` của bé, bất kể chỉ số nào.

`growthMeasureNotifications(baby, now)`: chỉ trong 08:00–08:59 giờ Việt Nam; khi `measureDue` đúng và `(today − due)` chia hết cho 7 và `today − due ≤ 21` (tối đa 4 lần: ngày đến hạn và 7, 14, 21 ngày sau). Gửi cho `recipient` có `growth_measure` bật; như nhắc tiêm, không xét tạm tắt nhắc và giờ yên lặng.

- `kind: "growth_measure"`, `refKey: "measure:{babyId}:{today}"`, `tag: "measure:{babyId}"`, `url: "/tang-truong"`.
- `title`: `Đến kỳ đo cho {Tên bé}`.
- `body`: `Lần đo gần nhất {dd/mm}. Cân, đo chiều dài và vòng đầu rồi ghi vào Tăng trưởng.`; chưa đo lần nào → `Chưa có lần đo nào. Cân, đo chiều dài và vòng đầu rồi ghi vào Tăng trưởng.`

**Hàng nhắc đo trên trang Chiều cao**: `glass` bo 26 px, vòng 36 px nền `accent-tint` có icon `bell`; tên `Nhắc đo mỗi tháng` (ngày tuổi < 365) hoặc `Nhắc đo ba tháng một lần`; dòng phụ `Lần tới {dd/mm} · 08:00`, hoặc "Đã đến kỳ đo" khi `measureDue` đúng; bên phải là `Switch` của chính tùy chọn `growth_measure` của người đang xem (cùng dữ liệu với công tắc "Nhắc đo định kỳ" ở Cài đặt, ghi bằng đường ghi tùy chọn thông báo hiện có). Máy chưa bật thông báo thì xử lý như `MedicineScheduleSection` đang làm với công tắc nhắc thuốc.

## 9. Kiểm thử

### 9.1 Unit test (vitest)

- `lib/nav.test.ts`: 4 tab; `activeTab` cho mọi đường dẫn ở §3.1; `/kham-pha` thuộc `health`.
- `components/nav/tabbar.test.tsx`: 4 tab; ô timer `flex-[2.2]`; dòng nhỏ `Hôm nay` và `Hôm nay +2`.
- `HealthScreen`, `ToolsScreen`: các khối và đường dẫn ở §3.4, §3.5; thẻ Tăng trưởng ở 4 trạng thái (chưa có dữ liệu, lớn đều, vàng, đỏ) và có/không có mục tiêu.
- Các test đang nhắc "/kham-pha" hoặc "Khám phá" (danh sách: `music`, `pageheader`, `triage`, `explore`, `noise`, `conditions`, `tabbar`, `report`, `photos`, `holding`, `scripts/sw.test.ts`, `lib/nav.test.ts`) sửa theo §3.1–§3.2.
- `lib/rules/attention.test.ts`: từng dòng của bảng §4, thứ tự ưu tiên, cắt ở 4 dòng, rỗng.
- `lib/rules/growthAlerts.test.ts`: từng loại ở §5.1 tại đúng ngưỡng (z = −2, −2,01, −3, −3,01, +2, +3; chênh 1,32 và 1,33; khoảng cách 13 và 14 ngày; cửa sổ 183 và 184 ngày); ưu tiên khi thỏa nhiều loại; chỉ lần gần nhất sinh cảnh báo; ngày tuổi 1857 bị bỏ qua; đúng từng chữ của tiêu đề, nội dung, lời khuyên, chip.
- `comparePhrase`, `outOf100`: đã xóa (§5.2); test chỉ kiểm rằng `growthForm` không còn export hai tên này. `sexLabel`: bé trai, bé gái.
- §5.6: `nearKind` tại z = −2, −1,01, −1, 0, +1, +1,01, +2 và ngoài ±2; chỉ số có cảnh báo không bao giờ gần ranh; `standardRange` ra đúng 3 số và 1 chữ số thập phân; dòng "Cách mức … của chuẩn" tính từ hai số đã làm tròn, và dạng "Sát mức …" khi bằng 0; tiêu đề và dòng nền vàng của thẻ kết luận với một, hai, ba chỉ số gần ranh và khi vừa gần thấp vừa gần cao; ba nhãn dưới thanh và nhãn đậm ở ranh; chip trang Sức khỏe ở 3 dạng; chip của hàng trong danh sách.
- `GrowthScreen`, `GrowthChart`, `GrowthList`: thứ tự khối; chỉ số chọn sẵn; chấm cảnh báo trên thanh chọn; vị trí chấm của thanh vị trí tại z = −3, 0, +3 và ngoài khoảng; dòng chênh; chip của hàng cũ.
- `lib/rules/heightGoal.test.ts`: `midParental` cho trai, gái; `targetZ`; `goalStatus` tại ±0,9 và ±1,0; `targetVsRange` ba nhánh và biên; `lengthVelocity` (đủ, không đủ, biên 0,75); `parseHeightGoal` mọi lỗi và làm tròn.
- `content/who/adult_height.json` qua schema; `content/nutrition.vi.json` qua schema, 4 giai đoạn phủ kín 0–1856 không chồng nhau.
- `lib/rules/habits.test.ts`: cửa sổ không tính hôm nay; cắt qua nửa đêm; ngưỡng 5/7 và 3/7 ngày; các chip tại biên; ẩn nằm sấp từ 365 ngày, vitamin D từ 730 ngày.
- `lib/rules/measureSchedule.test.ts`: 30 và 90 ngày tại biên 364/365; chưa đo lần nào; quá 1856 ngày.
- `lib/rules/pushSelection.test.ts`: `growth_alert` (người nhập không nhận; tắt công tắc; quá 24 giờ; nhập bù ngày cũ; giờ yên lặng; hai cảnh báo; `refKey`); `growth_measure` (chỉ giờ 08; ngày 0, 7, 14, 21 có, ngày 1 và 28 không; tắt công tắc).
- `components/settings/notifications.test.tsx`: hai công tắc mới.

### 9.2 Kiểm trong trình duyệt

Ở 375×812, bốn theme `rose`, `light`, `dark`, `night`. Trang thật (chỉ xem): Sức khỏe, Tiện ích, Tăng trưởng, Chiều cao, thanh tab. Trang fixture tạm (không commit) cho: thẻ cảnh báo vàng và đỏ; cả 8 loại chip; ô timer trong thanh 4 tab ở ba dạng chữ (§3.3); trang Chiều cao khi chưa có mục tiêu, mục tiêu ngoài khoảng, bé gái, chưa đủ dữ liệu thói quen; 4 dòng "Cần chú ý". Ghi lại trong plan trạng thái nào đã thấy thật, trạng thái nào chỉ thấy trên fixture.

### 9.3 Checklist thiết bị

Thêm "Bước 37" vào `docs/device-checklist.md`, trạng thái "Chờ người dùng": 4 tab trên iPhone; ô timer khi có timer; nhập chiều cao bố mẹ thật; một lần đo thật hiện đúng kết luận; push cảnh báo tới máy thứ hai; push nhắc đo lúc 08:00.

## 10. Thứ tự làm

Mỗi mốc là một plan riêng, tự chạy được, push `main` khi người dùng đồng ý.

| Mốc | Nội dung                                                                                                                                                      | Phụ thuộc |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| M1  | §3 (4 tab, hai trang tab, nút quay lại, icon) và §4 với hai nguồn tiêm chủng (dòng 2, 3). Thẻ Tăng trưởng ở trang Sức khỏe tạm chưa có chip và hàng mục tiêu. | không     |
| M2  | §5 (luật cảnh báo, màn Tăng trưởng kiểu A); chip trên thẻ Tăng trưởng của trang Sức khỏe; dòng 1 của "Cần chú ý".                                             | M1        |
| M3  | §6 (migration 014, luật, trang Chiều cao tới mục 5 và mục 9, sheet, thẻ mục tiêu); hàng mục tiêu trên thẻ Tăng trưởng của trang Sức khỏe.                     | M2        |
| M4  | §7 (thói quen, dinh dưỡng); dòng 5, 6 của "Cần chú ý".                                                                                                        | M3        |
| M5  | §8 (migration 015, hai loại push, hai công tắc, hàng nhắc đo); dòng 4 của "Cần chú ý"; §9.3.                                                                  | M3        |

Mốc M2 được làm thành các plan M2a–M2e. §5.6 làm thành hai plan, chạy sau M2e: M2f (luật gần ranh, số chuẩn, thẻ kết luận) và M2g (hàng của danh sách khi chip dài, chip gần ranh trên trang Sức khỏe).
