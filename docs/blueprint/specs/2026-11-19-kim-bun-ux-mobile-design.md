# Kim Bun — Tối ưu trải nghiệm mobile sau đợt đánh giá 2026-11-19

**Status:** approved 2026-11-19
**Ngày:** 2026-11-19
**Unit:** `web` (PWA Next.js trên Vercel). Một unit. Không có migration.
**Liên quan:** spec UI `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md` (gọi tắt "spec UI"), spec `docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md` (gọi tắt "spec 17/11"), spec `docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-popup-design.md`. Code nền: `main` tại commit `ceb4878`. Bản vẽ Claude Design: https://claude.ai/artifact/8dVoiBTHKWwHCS2WgKVXZc. Người dùng chọn Hôm nay A và Timer A ngày 2026-11-19, rồi trả lời thêm 4 câu cùng ngày (ghi ở §1).

Bản vẽ chỉ để xem hình. Chỗ nào bản vẽ khác spec này thì spec này đúng.

**Thay thế:** spec UI §6.1 (thanh tab), §6.5 (header Trang chủ), §7.1–7.3 (thứ tự, thẻ chính, ô 24 giờ), §8.1 (chip thời điểm); spec 17/11 §3.3 (thứ tự nhóm trong sheet "+") và §5.2 (viên timer); spec triệu chứng §6.1 mục 3 và 4 (dòng hướng dẫn, cách bày nhóm chip) cùng các nút ở cuối form.

## 1. Mục tiêu

1. **Hôm nay.** Luôn thấy giờ cữ bú tiếp, lần bú gần nhất và lần tã gần nhất, kể cả khi có timer chạy. Thẻ lớn thấp lại để hàng "24 giờ qua" nằm trong màn hình đầu tiên.
2. **Timer ngoài trang Hôm nay.** Bỏ viên timer nổi. Timer đang chạy hiện ngay trong tab "Hôm nay" của thanh tab.
3. **Sheet ghi nhanh.** Hàng "Lúc nào?" hiện đủ 4 lựa chọn không cần cuộn. Nhiệt độ có 6 mốc chọn sẵn. Bú bình điền sẵn lượng gần nhất. Sheet "+" xếp nhóm hay dùng gần ngón cái.
4. **Triệu chứng.** Chip triệu chứng gập theo nhóm. Nút "Xem kết quả" dính đáy màn hình.
5. **Tiêm chủng.** Có thẻ "cần làm trước" ở đầu trang. Mũi của nhóm chưa chọn loại không còn lẫn trong "Quá hạn".
6. **Thống kê.** Biểu đồ có đơn vị, vùng chuẩn theo tuổi, cột hôm nay nhạt hơn.
7. **Khám phá.** Thẻ Tăng trưởng và thẻ Tiêm chủng hiện số liệu thật.
8. **Chữ.** Hết "Tummy". Nút lịch ở Nhật ký đổi thành nút chữ "Ghi bù".

Bốn quyết định của người dùng ngày 2026-11-19:

- Sheet Thay tã giữ nguyên cách lưu (bản vẽ "chạm Ướt là lưu" không giảm số chạm nên bỏ).
- Triệu chứng chỉ gập chip triệu chứng. 32 công tắc dấu hiệu nguy hiểm luôn mở.
- Khi không có timer và chưa trễ cữ bú, thẻ lớn hiện bé thức bao lâu.
- Khám phá làm 2 thẻ: Tăng trưởng và Tiêm chủng.

Ngoài phạm vi: đổi số tab hay tên tab; ghi tã một chạm; đổi luật nhắc, luật đánh giá 24 giờ, luật phân loại triệu chứng; đổi nội dung y khoa; thẻ Thống kê và Phát triển ở Khám phá; token màu mới; migration; các màn chưa soi (Phát triển, Bệnh thường gặp, Bồng bế, Ồn trắng, Nhạc, Ảnh, Báo cáo).

## 2. Global Constraints

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

## 3. Trang Hôm nay

### 3.1 Header

`HomeHeaderView` có 3 nút tròn 44 px, theo thứ tự: trăng (như cũ), **Cài đặt** (mới), Khẩn cấp (như cũ). Nút Cài đặt là `Link` tới `/cai-dat`, lớp `glass`, icon `sliders` cỡ 20, `aria-label="Cài đặt"`. Avatar và tên bé vẫn là link tới `/cai-dat`.

### 3.2 Thẻ lớn

`heroState` (`lib/rules/hero.ts`) trả về một trong 5 trạng thái, xét theo thứ tự:

| Thứ tự | `kind`    | Điều kiện                                                                                   |
| ------ | --------- | ------------------------------------------------------------------------------------------- |
| 1      | `running` | Có bản ghi `ended_at === null`. Lấy bản ghi bắt đầu muộn nhất (như cũ).                     |
| 2      | `empty`   | `feedDue` trả `null` (12 giờ qua không có cữ bú nào).                                       |
| 3      | `overdue` | `now ≥ due` (như cũ).                                                                       |
| 4      | `awake`   | Có giấc ngủ đã kết thúc trong 12 giờ qua. `since` = `ended_at` của giấc kết thúc muộn nhất. |
| 5      | `none`    | Còn lại.                                                                                    |

Trạng thái `next` bị bỏ: giờ cữ bú tiếp chuyển sang ô trạng thái (§3.3).

`HeroCardView` vẽ một thẻ `Glass radius="hero"`, padding 14 px, gồm hàng trên và hàng nút (nếu có), cách nhau 10 px. Hàng trên: ô tròn 56 px, cột chữ, nút bên phải (nếu có), khoảng cách 12 px. Cột chữ gồm nhãn 13/18 đậm 600 viết hoa, số lớn, dòng phụ 13/18 `text-muted`.

| `kind`    | Ô tròn 56 px                                             | Nhãn                                                                       | Số lớn                                                | Dòng phụ                             | Nút                                                                                                              |
| --------- | -------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `running` | Nền màu loại, icon `text-bg`, viền `ring-4` màu loại 30% | "Đang ngủ", "Đang bú trái", "Đang bú phải", "Đang hút sữa", "Đang nằm sấp" | `formatClock`. 40/44 khi ≤ 5 ký tự, 32/38 khi dài hơn | "{tên} · từ {HH:MM}" + `PendingMark` | Không phải bú: nút "Dừng" (primary, `lg`) bên phải. Bú: hàng nút 2 cột "Đổi bên" (secondary) và "Dừng" (primary) |
| `overdue` | `bg-warn-soft text-warn-ink`, icon `clock`               | "Trễ cữ bú", `text-warn`                                                   | `formatMinutes(lateMinutes)`, 32/38                   | "Dự kiến lúc {HH:MM}"                | Hàng nút 2 cột "Bú trái", "Bú phải" có nhãn "Nên bú" và dòng "Lần trước: …" như cũ. Viền thẻ `border-warn!`      |
| `awake`   | Nền màu `cat-sleep` 15%, icon `sun` màu `cat-sleep`      | "Đang thức"                                                                | `formatMinutes` số phút từ `since` tới `now`, 32/38   | "từ {HH:MM}"                         | Không có                                                                                                         |
| `empty`   | Không có                                                 | Không có                                                                   | "Chưa có cữ bú nào gần đây", 17/22 đậm 600            | Không có                             | Hàng nút 2 cột "Bú trái", "Bú phải" như cũ                                                                       |
| `none`    | Không vẽ thẻ                                             |                                                                            |                                                       |                                      |                                                                                                                  |

Trong dòng phụ của `running`, {tên} là tên hiển thị của thành viên đã bấm giờ (`who`), cắt bằng `truncate` khi dài.

Bỏ dòng `sub` trong thẻ. Xoá `components/ui/TimerRing.tsx`, `ringProgress` và test của chúng.

### 3.3 Ba ô trạng thái

Hàm thuần mới `statusTiles({ logs, feedIntervalMin, now })` trong `lib/rules/status.ts` trả về đúng 3 ô `{ label, value, note, tone }`, `tone` là `"good" | "warn" | "muted"`. Component mới `components/home/StatusTiles.tsx` vẽ lưới 3 cột, khoảng cách 8 px, mỗi ô là `Glass radius="tile"`, padding 10×12 px: nhãn 12/16 `text-muted`, giá trị 20/26 đậm 700 `tabular-nums`, ghi chú 12/16 đậm 600 theo `tone`. Cả ba dòng `whitespace-nowrap`.

| Ô             | Trường hợp                      | `value`         | `note`                                          | `tone`  |
| ------------- | ------------------------------- | --------------- | ----------------------------------------------- | ------- |
| "Cữ bú tiếp"  | Có timer bú đang chạy           | "Đang bú"       | "từ {HH:MM}"                                    | `muted` |
|               | `feedDue` trả `null`            | "—"             | "chưa ghi"                                      | `muted` |
|               | `now < due`                     | HH:MM của `due` | "còn {shortDuration}"                           | `good`  |
|               | `now ≥ due`                     | HH:MM của `due` | "trễ {shortDuration}", ô có viền `border-warn!` | `warn`  |
| "Bú gần nhất" | Không có cữ bú nào trong `logs` | "—"             | "chưa ghi"                                      | `muted` |
|               | Bú mẹ đã xong                   | HH:MM bắt đầu   | "{trái \| phải} · {shortDuration}"              | `muted` |
|               | Bú mẹ đang chạy                 | HH:MM bắt đầu   | "đang bú {trái \| phải}"                        | `muted` |
|               | Bú bình                         | HH:MM           | "bình · {ml} ml"                                | `muted` |
| "Tã gần nhất" | Không có tã nào trong `logs`    | "—"             | "chưa ghi"                                      | `muted` |
|               | Có                              | HH:MM           | "ướt", "bẩn" hoặc "ướt + bẩn"                   | `muted` |

"Gần nhất" là bản ghi có `started_at` muộn nhất. `shortDuration` là hàm có sẵn trong `lib/rules/summaryText.ts` ("2g 5p", "45p"). Ghi chú ngắn hơn bản vẽ vì ô chỉ rộng 85 px ở 375 px.

- Làm tròn: "còn" dùng `Math.ceil` số phút, "trễ" dùng `Math.floor`, giống `heroState`, để thẻ lớn và ô không lệch nhau. Số phút của cữ bú lấy đúng cách `describeLog` tính cho cùng bản ghi.
- Ô "Bú gần nhất" và "Tã gần nhất" chỉ xét bản ghi có `started_at` trong 24 giờ qua (`WINDOW_MS`). Có bản ghi nhưng cũ hơn 24 giờ thì `value` là "—", `note` là "hơn 24 giờ".
- `StatusTiles` chỉ vẽ khi `logs.data` có, cùng điều kiện với `StatsSection`.

Ngay dưới 3 ô, khi `vitaminDToday` trả về giờ: một dòng 13/18 `text-muted`, `px-1`: "Vitamin D đã uống {HH:MM}". Khi trả `null`: không có dòng này, nút `VitaminDButton` vẫn ở chỗ cũ.

### 3.4 Hàng Bấm giờ và Ghi nhanh

- "Bấm giờ" (`TimerButtons`): không đổi.
- "Ghi nhanh" (`QuickLogGrid`): đổi từ lưới 2×2 nút dài sang **một hàng 5 nút tròn**, cùng kích thước với hàng Bấm giờ (ô tròn 58 px, nhãn 12/16 đậm 500, lưới 5 cột, khoảng cách 4 px). Thứ tự: Thay tã, Bú bình, Thuốc, Nhiệt độ, Khác.
- Bốn nút đầu: ô tròn dùng `CATEGORY_CHIP` của loại (nền màu loại 15%, icon màu loại), không có `glass`. Nhờ vậy khác hàng Bấm giờ (ô `glass`).
- Nút "Khác": ô tròn `bg-muted/15 text-ink`, icon mới `more` thêm vào `lib/ui/icons.ts` với path `M5 12h.01M12 12h.01M19 12h.01`, `strokeWidth` 3. Chạm mở sheet "+" chỉ gồm nhóm "Khác" (§5.4).

### 3.5 Khối "24 giờ qua"

- Tiêu đề dùng `GROUP_LABEL`. Bên phải có link "Thống kê" kèm icon `chevronRight` cỡ 14, 13 px đậm 600 `text-accent-text`, tới `/thong-ke`, vùng chạm cao 44 px.
- `StatTile`: giá trị đổi sang 20/26 và `whitespace-nowrap`, để "14g 38p" nằm một dòng ở 375 px.
- Dưới 3 ô: với mỗi chỉ số có `status === "rated"` và `rating` là `yellow` hoặc `red`, hiện một dòng 13/18 là câu `explain` của chỉ số đó. `yellow` dùng `text-warn`, `red` dùng `text-danger`. Thứ tự: giấc ngủ, cữ bú, tã ướt.
- `totalsLine` chỉ ghép phần khác 0: "Bình {ml} ml" khi `bottleMl > 0`, "Tã bẩn {n}" khi `dirtyDiapers > 0`. Cả hai bằng 0 thì trả `null` và không vẽ dòng.

### 3.6 Thứ tự khối và chiều cao

Thứ tự trong `HomeScreen`: header, `SyncBarSlot`, `AlertBanners`, `LongTimerBanner`, thẻ lớn, `TimerRow` của các timer khác, `StatusTiles` (kèm dòng Vitamin D), `TimerButtons`, `QuickLogGrid`, lỗi thao tác, `VitaminDButton`, `StatsSection`, `RecentCard`. Khoảng cách giữa các khối đổi từ 18 px xuống 14 px.

Tiêu chí: ở 375×812, có một timer ngủ đang chạy, không có banner, đã uống Vitamin D, thì mép dưới của hàng 3 ô "24 giờ qua" có `bottom ≤ 724 px` (mép trên của thanh tab).

## 4. Timer trong thanh tab

Thay §5.2 của spec 17/11.

- Xoá `components/nav/TimerPill.tsx` và test của nó. Xoá biến `--pill-offset` và thuộc tính `data-timer-pill` ở `app/globals.css`, `components/ui/Toast.tsx`, `components/AuthGate.tsx`. Toast và phần đệm đáy trang quay về vị trí khi không có viên timer.
- Hàm `showsTimerPill` trong `lib/nav.ts` đổi tên thành `showsTabTimer`, luật giữ nguyên: `pathname !== "/"`.
- Khi `showsTabTimer` đúng và `pillTimer(runningRows)` có bản ghi, tab "Hôm nay" trong `TabBarView` vẽ thành **ô timer**:
  - `flex: 1.7`, hai tab còn lại `flex: 1`. Nền màu loại 15%, bo tròn hết cỡ.
  - Ô tròn 36 px nền màu loại, icon `text-bg` cỡ 18.
  - Cột chữ: đồng hồ 17/20 đậm 700 `tabular-nums`, dưới là "Hôm nay" 10/12 đậm 600 `text-ink` (`text-muted` trên nền này chỉ đạt khoảng 4,1:1 ở theme `night`).
  - Ở `/cai-dat`, nơi tab "Hôm nay" đang là tab hiện tại, ô timer vẫn dùng nền màu loại thay cho `bg-accent-tint` và giữ `aria-current="page"`.
  - Đồng hồ dùng hàm mới `formatTabClock(ms)` trong `lib/rules/hero.ts`: dưới 1 giờ ra "M:SS" như `formatClock` ("54:38"); từ 1 giờ ra "{h}g {mm}p" ("1g 05p").
  - Có thêm `n` timer khác thì dòng dưới thành "Hôm nay · +{n}". Không có nhãn tròn riêng vì ô chỉ rộng 121 px ở 375 px.
  - Vẫn là `Link` tới `/`. `aria-label`: "Hôm nay, {timerLabel} đã chạy {formatClock}".
  - Chỉ ô này cập nhật mỗi giây, và chỉ khi đang hiện.
- Ngoài trang Hôm nay không còn nút "Dừng". Muốn dừng thì chạm ô timer để về Hôm nay.
- Ở trang Hôm nay, tab "Hôm nay" vẽ như cũ.

## 5. Sheet ghi nhanh

### 5.1 Hàng "Lúc nào?"

`TimeChips` dùng `Segmented` thay `ChipGroup`. Nhãn trong `TIME_CHIPS` đổi thành: "Bây giờ", "5p trước", "15p trước", "Giờ khác". Giá trị (`now`, `5m`, `15m`, `custom`) và luật thời gian không đổi. Chọn "Giờ khác" vẫn hiện ô `datetime-local` như cũ. Áp dụng cho mọi sheet dùng `TimeChips`. Nếu ở 375 px nhãn "15p trước" bị cắt, giảm padding ngang của nút trong `Segmented` từ `px-1.5` xuống `px-1`.

### 5.2 Đo nhiệt độ

- `placeholder` của ô số đổi từ "37,0" thành "––,–".
- Giữa ô số và `Segmented` "Đo ở" thêm một hàng 6 nút, lưới 6 cột, khoảng cách 6 px, `role="group"`, `aria-label="Mốc nhiệt độ"`: 36,5 · 37,0 · 37,5 · 38,0 · 38,5 · 39,0. Mỗi nút cao tối thiểu 44 px, bo tròn hết cỡ, 15 px đậm 600. Chạm thì đặt giá trị ô số đúng bằng chuỗi của nút. Nút có chuỗi trùng giá trị đang nhập thì `aria-pressed="true"` và dùng `bg-ink text-bg`; còn lại dùng `glass`.
- Nút −0,1 và +0,1 không đổi.

### 5.3 Bú bình

Khi mở `QuickEntrySheet` loại `bottle` mà `initial` không có `ml`: `ml` khởi đầu là phần tử đầu của `recentBottleAmounts(recentLogs)`. Không có thì để trống với `placeholder` "0". Giá trị khởi đầu này là mốc so sánh của `dirty`, nên mở rồi đóng ngay không hỏi "Bỏ thay đổi?". `LogEditSheet` không đổi.

### 5.4 Sheet "+"

- Thứ tự nhóm trong sheet, từ trên xuống: "Khác", "Ghi nhanh", "Bấm giờ". Đổi thứ tự phần tử của `QUICK_ACTION_GROUPS` thành `other`, `quick`, `timer`. Thứ tự của `QUICK_ACTIONS` không đổi vì `TimerButtons` dùng nó.
- Nhóm "Bấm giờ" vẽ thành lưới 5 cột nút tròn 58 px như hàng Bấm giờ ở Hôm nay (nhãn 12/16 là tên thường như "Ngủ", "Hút sữa"; timer đang chạy thì ô tròn tô màu loại, nhãn đậm 700, còn "Dừng …" chỉ nằm trong `aria-label`, giống `TimerButtons`; nhãn "Nên bú" như cũ). Hai nhóm kia giữ ô 84 px, lưới 4 cột.
- Nhãn ô ở cả ba nhóm nằm trên một dòng ở 375 px (hiện "Uống nước" bị xuống dòng).
- `ActionSheet` nhận thêm tham số tuỳ chọn `groups`. `QuickActionsValue.openActionSheet(groups?)` truyền xuống. `components/history/HistoryScreen.tsx` đang truyền thẳng `actions.openActionSheet` làm `onClick`: đổi thành `() => actions.openActionSheet()` để sự kiện click không bị nhận làm `groups`. Nút "Khác" ở Hôm nay gọi với `["other"]`. Nút "+" gọi không tham số và hiện đủ 3 nhóm.

### 5.5 Không đổi

Cách lưu của sheet Thay tã, Thuốc, Ăn dặm, Uống nước, Tắm, Ghi chú, Hút sữa.

## 6. Triệu chứng

- **Chip triệu chứng** (`SymptomChips`): các nhóm nằm trong một danh sách `glass` bo 22 px. Mỗi nhóm có hàng tiêu đề là `button` cao tối thiểu 52 px: tên nhóm 16 px, nhãn "{n} đã chọn" (nền `accent-tint`, chữ `accent-text`, 12 px đậm 700) khi `n > 0`, icon `chevronDown` khi đóng và `chevronUp` khi mở, có `aria-expanded`. Chip của nhóm chỉ vẽ khi nhóm mở. `n` tính cả chip sốt bị khoá theo nhiệt độ.
- Lúc mở trang mọi nhóm đều đóng. Dòng hướng dẫn đổi thành "Mở nhóm rồi chạm để chọn, chọn được nhiều." Mở được nhiều nhóm cùng lúc. Bấm "Làm lại" thì mọi nhóm đóng lại. Chip giữ nguyên lớp hiện tại (`glass` khi chưa chọn, `bg-ink text-bg` khi đã chọn).
- **Dấu hiệu nguy hiểm** (các `ListGroup` công tắc): không đổi, luôn mở.
- **Thanh kết quả dính đáy**, chỉ khi chưa có kết quả: `fixed`, cùng vị trí và bề ngang với thanh tab, `glass-strong`, bo tròn hết cỡ, padding 6 px, hai nút cách nhau 8 px, gồm:
  - Nút tròn 56 px `bg-danger-solid text-on-danger`, icon `phone`, là link `tel:115`, `aria-label="Gọi cấp cứu 115"`.
  - Nút primary chiếm phần còn lại, cao 56 px: "Xem kết quả" khi chưa chọn gì, "Xem kết quả · đã chọn {n}" khi `n > 0`. `n` = số chip đang chọn (tính cả chip sốt bị khoá) + số công tắc đang bật.
- Bỏ nút "Xem kết quả" và nút "Gọi cấp cứu 115" ở cuối form. Nút 115 ở đầu trang giữ nguyên.
- Khi thanh kết quả hiện, thanh tab và nút "+" ẩn. Có kết quả hoặc rời trang thì chúng hiện lại. Cách làm: context mới `components/actions/ChromeVisibility.tsx` (theo mẫu `components/sync/SyncSlot.tsx`); `ActionChrome` đọc cờ ẩn, `TriageScreen` bật cờ khi `outcome === null` và tắt khi có kết quả hoặc unmount.
- Phần đệm đáy của trang đủ để công tắc cuối cùng không bị thanh che khi cuộn hết.
- Khi bấm "Xem kết quả" mà nhiệt độ sai, trang cuộn về đầu để thấy dòng lỗi.

## 7. Tiêm chủng

- Hàm thuần mới `nextDose(items)` trong `lib/rules/vaccines.ts`: trả về phần tử đầu tiên của `items` (đã sắp theo `due`) có `unchosen === false`, `pastMaxAge === false` và `state` là `overdue`, `upcoming` hoặc `later`; không có thì `null`. Mũi đã quá tuổi khuyến cáo (`pastMaxAge`) bị bỏ qua, giống `lib/rules/pushSelection.ts`; nó vẫn nằm trong danh sách với dòng "hỏi bác sĩ" đang có. Không đổi `vaccineSummary` trong `lib/rules/report.ts`.
- **Thẻ "cần làm trước"**: ngay dưới `PageHeader`, chỉ khi không ở bước thiết lập (`needsSetup === false`) và `nextDose` khác `null`. Thẻ là `button` `glass` bo 28 px, padding 16 px, chạm mở `DoseSheet` của mũi đó. Nội dung:
  - Nhãn 13/18 đậm 600 viết hoa: "Quá hạn {n} ngày" (`text-warn`, thẻ có `border-warn!`) khi `overdue`; "Sắp tới · còn {n} ngày" khi `upcoming` (hạn là hôm nay thì "Sắp tới · hôm nay"); "Mũi tiếp theo" khi `later`.
  - `n` là số ngày lịch giữa `due` và hôm nay theo giờ Việt Nam (`vnDateString`).
  - Tên mũi 20/26 đậm 700.
  - Dòng 13/18 `text-muted`: "Hẹn {formatDueDate(due)} · {Tiêm chủng mở rộng | Dịch vụ}".
- **Danh sách**: các mục "Quá hạn", "Sắp tới (≤ 30 ngày)", "Sau này" chỉ đếm và liệt kê mũi có `unchosen === false`. Mọi mũi còn mở (`overdue`, `upcoming`, `later`) có `unchosen === true` gom vào một mục mới "Chưa chọn loại ({n})", đặt sau "Sắp tới" và trước "Đã tiêm". Mục này đóng lúc mở trang: chỉ có một hàng `button` cao 52 px "Xem {n} mũi của nhóm chưa chọn loại" kèm chevron; chạm thì hiện danh sách `DoseLine` như cũ, chạm lần nữa thì đóng. Hàng có `aria-expanded`, icon `chevronDown` khi đóng và `chevronUp` khi mở.
- Đoạn chữ "Còn {n} nhóm chưa chọn loại vaccine…" và nút "Chọn loại vaccine" không đổi.

## 8. Thống kê

- `STATS_TABS`: nhãn `tummy` thành "Nằm sấp". `SERIES.tummy.primary` thành "Nằm sấp (phút)". Cột của `StatsTable` thành "Nằm sấp".
- `StatsChart` nhận thêm `unit` và vẽ nó thành chú thích 12 px `text-muted` ở góc trên trái biểu đồ: Ngủ "giờ", Bú "cữ", Tã "tã", Hút sữa "ml", Nằm sấp "phút", Ăn dặm "bữa".
- Hàm thuần mới `dailyNorm(tab, ageDays)` trong `lib/rules/ratings.ts`, dùng lại đúng các ngưỡng đang có:
  - `sleep`: `{ min, max }` theo `SLEEP_BANDS` (giờ).
  - `feed`: `{ min: 8 }` khi `ageDays ≤ 30`, `{ min: 6 }` khi `31 ≤ ageDays ≤ 180`, `null` khi lớn hơn.
  - `diaper`: `{ min: 6 }` khi `ageDays > 5`, `null` khi nhỏ hơn. Áp cho chuỗi tã ướt.
  - Các tab khác: `null`.
  - `ageDays` tính tại `now`, dùng chung cho cả khoảng 7 hoặc 14 ngày.
- Khi có `max`: vẽ `ReferenceArea` từ `min` tới `max`, tô `var(--color-good)` độ đục 0,12. Khi chỉ có `min`: vẽ `ReferenceLine` nét đứt tại `min`, màu `var(--color-good)`. Trục Y luôn chứa hết vùng hoặc đường chuẩn.
- Cột của hôm nay (hàng cuối) có `fillOpacity` 0,45.
- Dòng chú thích dưới bảng thêm, khi có chuẩn: "Vùng tô nhạt: chuẩn {min}–{max} giờ mỗi ngày." hoặc "Đường kẻ: chuẩn từ {min} {cữ | tã ướt} mỗi ngày." Thêm nữa: "Cột nhạt là hôm nay, chưa hết ngày." Các câu này chỉ hiện khi biểu đồ được vẽ. Không gọi là "vùng xanh" vì ở theme `night` màu `good` là màu hổ phách.

## 9. Khám phá

- `app/kham-pha/page.tsx` truyền `ctx.baby` vào `ExploreScreen` (theo mẫu `app/trieu-chung/page.tsx`).
- Thẻ **Tăng trưởng**: dùng `useGrowth(baby.id)`. Lấy lần đo mới nhất có cân nặng (đọc cùng các trường mà `components/growth/GrowthList.tsx` đang đọc). Có thì dòng mô tả thành "Cân nặng {gam} g · {ngày}", ví dụ "Cân nặng 5.500 g · 15/11": gam định dạng bằng `Intl.NumberFormat("vi-VN")` như `profileLines` trong `lib/rules/emergency.ts`, ngày định dạng bằng `formatDayShort` trong `lib/rules/days.ts`.
- Thẻ **Tiêm chủng**: dùng `useVaccineDoses(baby.id)` và `buildSchedule` như `VaccineScreen`, rồi `nextDose`. `overdue`: "Quá hạn: {tên mũi}", `text-warn` đậm 600. `upcoming` hoặc `later`: "{formatDayShort(due)} · {tên mũi}", ví dụ "10/12 · Bexsero mũi 2". Ngày đứng trước để không bị cắt mất khi tên mũi dài.
- Hai hàm thuần `growthCardText` và `vaccineCardText` đặt trong `lib/rules/`, trả `string | null`.
- Đang tải, mất mạng, lỗi, hoặc hàm trả `null`: hiện dòng mô tả tĩnh như hiện nay. Không có skeleton, không có thẻ lỗi.
- Dòng mô tả tối đa 2 dòng (`line-clamp-2`). Thẻ Thống kê và Phát triển không đổi.

## 10. Nhật ký và chữ

- `HistoryScreen`: nút icon `calendar` đổi thành `Button` `size="md"` `variant="secondary"` có chữ "Ghi bù", `aria-label="Thêm bản ghi cũ"`. Hành vi không đổi.
- `lib/rules/describeLog.ts`: "Tummy time" thành "Nằm sấp".
- Sau thay đổi, `grep -ri "tummy"` trong `components/` và `lib/` không còn chuỗi hiển thị nào chứa "Tummy" (tên biến, khoá `tummy` thì giữ).

## 11. Kiểm thử

### 11.1 Unit test (vitest)

- `heroState`: 5 trạng thái theo đúng thứ tự ưu tiên; `awake` lấy giấc kết thúc muộn nhất; giấc kết thúc quá 12 giờ thì `none`.
- `statusTiles`: mọi hàng của bảng §3.3, cách làm tròn "còn" và "trễ", và ngưỡng 24 giờ.
- `formatTabClock`: 0 giây, 59:59, đúng 1 giờ, 1 giờ 5 phút.
- `totalsLine`: 4 tổ hợp 0 và khác 0.
- `nextDose`: bỏ qua `unchosen`, `pastMaxAge`, `done`, `skipped`; danh sách rỗng.
- `dailyNorm`: biên tuổi 5, 6, 30, 31, 90, 91, 180, 181 ngày.
- `growthCardText`, `vaccineCardText`: có dữ liệu, không dữ liệu, quá hạn.
- Component: `HeroCardView` 5 trạng thái; `StatusTiles`; `QuickLogGrid` 5 nút và nút "Khác" gọi `openActionSheet(["other"])`; `TabBarView` có và không có ô timer; `TimeChips` 4 ô; `TemperatureFields` 6 mốc; `SymptomChips` đóng mở và đếm; `TriageScreen` có thanh kết quả, đếm đúng `n`; `DoseSections` có mục "Chưa chọn loại"; `ActionSheet` với `groups`.
- Test của `TimerPill`, `TimerRing`, `ringProgress`, trạng thái `next` bị xoá cùng code.

### 11.2 Kiểm trong trình duyệt

Ở 375×812, cả theme `rose` và `night`, không bấm Lưu, không đụng timer. Chrome không thu nhỏ dưới 455 px, nên phần này dùng khung Browser trong app và phải hỏi người dùng trước mỗi phiên. Kiểm: tiêu chí §3.6; không chữ nào bị cắt hay xuống dòng ở §3.3, §4, §5.1, §5.4; ô timer trong tab ở Nhật ký; thanh kết quả ở Triệu chứng và thanh tab hiện lại sau khi có kết quả; thẻ "cần làm trước" ở Tiêm chủng; vùng chuẩn ở Thống kê.

Không tạo dữ liệu để kiểm. Tiêu chí §3.6 đo khi dữ liệu thật đang ở trạng thái `running` (không phải bú), không có banner và đã uống Vitamin D. Nếu dữ liệu đang ở `awake` với cùng điều kiện thì ngưỡng là `bottom ≤ 718 px`, vì thẻ `awake` thấp hơn 6 px. Ô timer trong tab chỉ kiểm được khi đang có timer chạy sẵn. Dữ liệu không ở các trạng thái đó thì ghi "chưa kiểm" trong plan và để bước 36 (§11.3) xác nhận.

### 11.3 Checklist thiết bị

Thêm bước 36 vào `docs/device-checklist.md`, chờ người dùng thử trên iPhone: Hôm nay khi có và không có timer, ô timer trong tab, hàng "Lúc nào?", mốc nhiệt độ, thanh kết quả Triệu chứng, Tiêm chủng, Thống kê. Bước này ghi "chờ", không tự đánh "Đạt". Trong M3, sửa các mục của bước 34 đang tả viên timer và nút "Dừng" của nó thành ô timer trong tab.

## 12. Thứ tự làm

Mỗi mốc một plan riêng, làm theo thứ tự. Mốc sau cắt nhánh từ mốc trước.

1. **M1 — Sheet và chữ:** §5.1, §5.2, §5.3, §10, và gạch đầu dòng thứ nhất của §8 (đổi chữ "Tummy").
2. **M2 — Hôm nay:** §3 (nút "Khác" tạm gọi `openActionSheet()` không tham số cho tới M3).
3. **M3 — Timer trong tab và sheet "+":** §4, §5.4.
4. **M4 — Triệu chứng:** §6.
5. **M5 — Tiêm chủng và Khám phá:** §7, §9.
6. **M6 — Thống kê:** phần còn lại của §8, rồi §11.3.
