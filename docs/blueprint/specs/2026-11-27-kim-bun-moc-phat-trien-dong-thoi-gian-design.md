# Kim Bun — Mốc phát triển theo dòng thời gian

**Status:** approved 2026-11-27
**Ngày:** 2026-11-27
**Unit:** `web` (PWA Next.js trên Vercel). Một unit. Không có migration.
**Liên quan:** code nền `main` tại commit `b1f1bdd` (220 file test / 2140 test vitest). Bản vẽ Claude Design: https://claude.ai/artifact/URZjMRE1GPGbbc5TaYgZWH, hàng hai "Đã chọn D: bản chốt", artboard **D′ — D theo các lựa chọn của cưng** (màn chính, bấm dòng "Vận động lớn" để thấy sheet) và **D′ — Sheet Vận động lớn**.

Bản vẽ chỉ để xem hình; số liệu trên bản vẽ là số bịa (bé 5 tháng, ngày đạt 12/11/2026). Chỗ nào bản vẽ khác spec này thì spec này đúng.

## 1. Mục tiêu

Người dùng báo ngày 2026-11-27: màn Mốc phát triển (`/phat-trien`, `components/milestones/MilestonesScreen.tsx`) "hơi khó nhìn". Hiện tại màn có: một đoạn giới thiệu dài; khối "Mốc vận động lớn" 7 dòng, mỗi dòng một chip dài và xuống hàng (ví dụ "Đang trong khoảng bình thường (3,8–9,2 tháng)"); rồi với tháng hiện tại và tháng kế tiếp, mỗi tháng 4 nhóm lĩnh vực tách rời, một thẻ cam "Khi nào nên hỏi bác sĩ" và một link "Nguồn: CDC"; cuối cùng nút "Xem tất cả các mốc".

Quyết định của người dùng ngày 2026-11-27 (chọn kiểu **D**, dòng thời gian, rồi trả lời các câu hỏi):

- Dòng thời gian dọc hiện **đủ 8 mốc tháng** (2, 4, 6, 9, 12, 15, 18, 24). Các mốc sau mốc kế tiếp vẽ **mờ bằng màu chữ**, không làm trong suốt, và **vẫn bấm mở và đánh dấu được**.
- Mở sẵn: **mốc tháng bé đang ở**. **Chỉ mở một mốc** một lúc.
- Mốc đã qua mà còn mục chưa đánh dấu: **nút tròn và chữ màu cam**, ghi "Còn N mốc chưa đạt · nên hỏi bác sĩ".
- Trong mốc đang mở: **một thẻ**, các lĩnh vực ngăn bằng **tiêu đề nhỏ có chấm màu**.
- 7 mốc vận động lớn: **một dòng tóm tắt** trên đầu màn, ghi **tên mốc, không ghi số**; bấm mở **sheet** có thanh khoảng tuổi (như biểu đồ của phương án B trên bản vẽ).
- Bấm một mốc trong sheet vận động: sheet vận động đóng, **sheet nhập ngày đạt** mở; lưu hoặc đóng xong thì **sheet vận động mở lại**.
- "Khi nào nên hỏi bác sĩ": **một dòng cuối màn**, bấm mở sheet.
- Bỏ đoạn giới thiệu đầu màn; cuối màn **một dòng** nguồn và lưu ý.

Ngoài phạm vi: đổi `MilestoneSheet` (ngày đạt, ghi chú, gắn ảnh, "Bỏ đánh dấu"); đổi bảng `milestones_achieved`, RLS, outbox; đổi nội dung các mốc (chữ, mã, khoảng tuổi, nguồn); thêm ô Vận động lớn vào tab Sức khỏe; thông báo đẩy; nhớ mốc đang mở; nút "mở tất cả"; icon mới, token màu mới, dependency mới.

## 2. Global Constraints

- Không migration, không đổi bảng `milestones_achieved`, không đổi RLS. Đọc và ghi vẫn qua `useMilestones` / `useMilestoneActions` (`lib/data/milestones.ts`) như hiện tại.
- Tuổi theo tháng: `ageInMonths(ageDays(baby.dob, now))` (`lib/rules/milestones.ts`, `lib/rules/time.ts`), 30,4375 ngày một tháng, như hiện tại. `now` là `new Date()` lúc render.
- Nội dung chỉ đọc từ `content/milestones.vi.json` qua `MILESTONES` (`lib/content/milestones.ts`). Thay đổi nội dung duy nhất: thêm trường `short` cho 7 mốc vận động (§3.4). `public/content/milestones.vi.json` là bản sao bị git bỏ qua, do `scripts/copy-content.ts` tạo lại ở `prebuild`; không sửa tay, không commit. Trường `short` chỉ thêm vào, không đổi trường cũ, nên nơi khác đọc `/content/*.vi.json` không bị ảnh hưởng.
- Không icon mới: dùng `star`, `check`, `alert`, `chevronDown`, `chevronUp`, `chevronRight`, `close` có sẵn trong `lib/ui/icons.ts`. Dấu chờ đồng bộ dùng `PendingMark` có sẵn (qua `MilestoneItem`). Không token màu mới.
- Vùng bấm tối thiểu 44 px, như mọi nút của app.
- Chữ trên màn hình viết đúng như spec này ghi trong ngoặc kép. Dấu gạch nối khoảng số là en dash "–" (U+2013). Dấu chấm giữa là "·" (U+00B7) có một khoảng trắng mỗi bên. Số thập phân dùng dấu phẩy ("3,8"), như `motorStatus` đang làm.
- Không thêm câu thống kê kiểu "… trong 100 bé" (ghi chú người dùng 2026-11-25).
- Rules thuần nằm trong `lib/rules/`, có test vitest; component hiển thị có test render bằng `renderToStaticMarkup` như các file `*.test.tsx` hiện có.
- Hết spec: `bun run typecheck` sạch, toàn bộ vitest xanh, `bun run build` thoát 0.

## 3. Luật

### 3.1 Vị trí của bé trên dòng thời gian

Gọi `groups = MILESTONES.groups` (thứ tự tăng dần theo `months`) và `age = ageInMonths(...)`.

- **Mốc hiện tại**: mốc cuối cùng có `months <= age`. Nếu `age < groups[0].months` (bé dưới 2 tháng) thì **không có** mốc hiện tại.
- **Mốc kế tiếp**: mốc ngay sau mốc hiện tại; nếu không có mốc hiện tại thì là `groups[0]`; nếu mốc hiện tại là mốc cuối (24 tháng) thì không có mốc kế tiếp.
- **Mốc đã qua**: mọi mốc đứng trước mốc hiện tại.
- **Mốc xa**: mọi mốc đứng sau mốc kế tiếp.

Ví dụ: 0,5 tháng → hiện tại không có, kế tiếp 2. 2 tháng → hiện tại 2, kế tiếp 4. 5 tháng → đã qua 2, hiện tại 4, kế tiếp 6, xa 9–24. 30 tháng → đã qua 2–18, hiện tại 24, không kế tiếp.

### 3.2 Trạng thái và dòng tóm tắt của mỗi mốc tháng

Với mỗi mốc: `total` = số mục của mốc, `done` = số mục có bản ghi trong `milestones_achieved` (theo `milestone_code`). Bản ghi đang chờ đồng bộ (outbox) cũng tính là có, như `useMilestones` đang trả về.

| Loại           | Điều kiện                | Nút tròn                                                                            | Dòng tóm tắt                                                                                                                    |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `past-done`    | đã qua, `done === total` | nền `bg-good`, icon `check` màu `text-bg`                                           | "Đạt đủ {total} mốc"                                                                                                            |
| `past-missing` | đã qua, `done < total`   | nền `bg-warn`, ký tự "!" đậm màu `text-bg`                                          | "Còn {total − done} mốc chưa đạt · nên hỏi bác sĩ", màu `text-warn font-semibold`                                               |
| `current`      | mốc hiện tại             | nền `bg-accent`, số tháng màu `text-on-accent`, viền sáng `ring-5 ring-accent-tint` | "{tên bé} đang ở đây · đạt {done}/{total}"                                                                                      |
| `next`         | mốc kế tiếp              | nền `bg-glass-solid`, viền 2 px `border-muted/50`, số tháng `text-muted`            | "Sắp tới" nếu `done = 0`, ngược lại "Sắp tới · đạt {done}/{total}"                                                              |
| `later`        | mốc xa                   | như `next`                                                                          | "Sau này" nếu `done = 0`, ngược lại "Đạt {done}/{total}"; **tiêu đề** "Mốc {months} tháng" màu `text-muted` thay cho `text-ink` |

Tên bé là `baby.name`.

**Khi chưa có dữ liệu** (`marks.data === undefined`: đang tải lần đầu hoặc lỗi chưa có cache): không được hiện màu cam. Mốc đã qua vẽ như `next` (nút rỗng có số), dòng tóm tắt của **mọi** mốc để trống (không render), dòng tóm tắt Vận động lớn (§3.4) cũng để trống. Khi dữ liệu về thì vẽ lại theo bảng trên.

### 3.3 Mốc nào mở

- Lúc vào màn: mở **mốc hiện tại**; nếu không có mốc hiện tại thì mở `groups[0]`.
- Bấm tiêu đề một mốc đang gập: mốc đó mở, mốc đang mở (nếu có) gập lại.
- Bấm tiêu đề mốc đang mở: gập lại; khi đó không mốc nào mở.
- Trạng thái mở không được nhớ: rời màn rồi quay lại là về mặc định.
- Mọi mốc (kể cả `later`) đều bấm mở được, và mục trong đó bấm đánh dấu được như mục của mốc hiện tại.

### 3.4 Vận động lớn

**Nội dung:** thêm trường `short` (chuỗi khác rỗng, chữ thường) cho từng mốc vận động trong `content/milestones.vi.json` và `MotorMilestoneSchema`:

| `code`       | `short`      |
| ------------ | ------------ |
| `lat`        | "lật"        |
| `ngoi`       | "ngồi"       |
| `dung_co_do` | "đứng có đỡ" |
| `bo`         | "bò"         |
| `di_co_dat`  | "đi có dắt"  |
| `tu_dung`    | "tự đứng"    |
| `tu_di`      | "tự đi"      |

**Trạng thái từng mốc** (`motorStatus`, giữ tên hàm, giữ luật hiện tại, đổi chữ):

| `state`  | Điều kiện (như hiện tại)        | `text` mới       |
| -------- | ------------------------------- | ---------------- |
| `done`   | đã có bản ghi                   | "Đã đạt"         |
| `early`  | `age < fromMonths`              | "Sắp tới"        |
| `window` | `fromMonths <= age <= toMonths` | "Đang tới tuổi"  |
| `late`   | `age > toMonths`                | "Nên hỏi bác sĩ" |

Thêm hàm thuần `motorRange(m)` trả về "Thường trong khoảng {from}–{to} tháng" (định dạng số như `motorStatus` đang làm, ví dụ "Thường trong khoảng 3,8–9,2 tháng", "Thường trong khoảng 4–6 tháng").

**Dòng tóm tắt** (hàm thuần `motorSummary(motor, age, achievedCodes)` trả về `{ tone: "muted" | "warn", text }`), xét theo thứ tự trong `MILESTONES.motor`:

1. Có mốc `late`: `tone = "warn"`, `text` = các `short` của mọi mốc `late`, nối bằng ", ", viết hoa chữ đầu của cả chuỗi, rồi ": nên hỏi bác sĩ". Ví dụ "Bò, đi có dắt: nên hỏi bác sĩ".
2. Ngược lại, nếu cả 7 mốc `done`: `tone = "muted"`, "Đã đạt đủ 7 mốc".
3. Ngược lại, ghép các phần sau bằng " · ", bỏ phần rỗng, rồi viết hoa chữ đầu của cả chuỗi (`tone = "muted"`):
   - Phần đạt: nếu có mốc `done`, "đã {short}" của mốc `done` **đứng sau cùng** trong danh sách. Ví dụ "đã lật".
   - Phần đang tới tuổi: nếu có mốc `window`, "đang tới tuổi " + các `short` của mọi mốc `window` nối bằng ", ". Ví dụ "đang tới tuổi ngồi, đứng có đỡ".
   - Nếu cả hai phần trên đều rỗng: "sắp tới tuổi {short}" của mốc `early` đầu tiên.

Ví dụ: bé 5 tháng đã lật → "Đã lật · đang tới tuổi ngồi, đứng có đỡ". Bé 1 tháng → "Sắp tới tuổi lật". Bé 3,9 tháng chưa gì → "Đang tới tuổi ngồi".

Số chữ "7" trong luật 2 lấy từ `MILESTONES.motor.length`, không viết cứng.

### 3.5 Thanh khoảng tuổi trong sheet Vận động lớn

- Trục từ 0 tới 18 tháng (hằng số `MOTOR_AXIS_MONTHS = 18`).
- Đoạn màu của một mốc: bắt đầu `fromMonths / 18`, rộng `(min(toMonths, 18) − fromMonths) / 18`, tính theo phần trăm chiều rộng thanh, làm tròn 1 chữ số thập phân.
- Chuỗi CSS dùng **dấu chấm** thập phân (khác chữ trên màn hình), dạng `Number(x.toFixed(1)) + "%"`: ví dụ `ngoi` (3,8–9,2) cho `left = "21.1%"`, `width = "30%"`; `lat` (4–6) cho `left = "22.2%"`, `width = "11.1%"`; tuổi 0 cho `"0%"`.
- Màu đoạn: `done` → `bg-good`; `window` → `bg-accent`; `early` → `bg-muted/45`; `late` → `bg-warn`.
- Vạch "hôm nay": tại `min(age, 18) / 18`, làm tròn và viết như đoạn màu (tuổi đúng 5 tháng: `"27.8%"`).

## 4. Màn hình

### 4.1 Bố cục màn `/phat-trien`

Từ trên xuống, trong `<main>` hiện có (`max-w-md`, `px-4`, `gap-[18px]`):

1. `PageHeader` như hiện tại (title "Mốc phát triển", nút về "Sức khỏe"). **Bỏ** đoạn `MILESTONES.intro`.
2. `ErrorCard` khi lỗi và chưa có dữ liệu, như hiện tại.
3. **Dòng Vận động lớn** (§4.2).
4. **Dòng thời gian** (§4.3).
5. **Dòng "Khi nào nên hỏi bác sĩ"** (§4.5).
6. **Dòng nguồn** (§4.6).

**Bỏ**: khối `ListGroup` "Mốc vận động lớn", các `<section>` theo tháng cùng thẻ cam và link "Nguồn: CDC" của từng tháng, nút "Xem tất cả các mốc" / "Chỉ xem tháng hiện tại và kế tiếp" cùng state `showAll`. Hàm `visibleGroups` và test của nó bị xóa (không còn ai dùng).

### 4.2 Dòng Vận động lớn

- Một `<ul className="glass overflow-hidden rounded-[22px]">` chứa đúng một `<li>` với một `<button type="button" aria-haspopup="dialog">` rộng hết, `min-h-14`, `px-4 py-2.5`, `flex items-center gap-3`.
- Bên trái: vòng tròn 34 px `rounded-full bg-accent-tint text-accent-text` chứa icon `star` cỡ 18.
- Giữa: "Vận động lớn" (`text-base font-semibold text-ink`), dưới là dòng tóm tắt §3.4 (`text-[13px]`; `tone = "muted"` → `text-muted`, `tone = "warn"` → `text-warn font-semibold`). Khi chưa có dữ liệu (§3.2) dòng tóm tắt không render.
- Bên phải: icon `chevronRight` cỡ 16 `text-muted`.
- Bấm: mở sheet Vận động lớn (§4.4).

### 4.3 Dòng thời gian

- `<ol>` không dấu đầu dòng; mỗi mốc tháng một `<li className="flex gap-3">`.
- Cột trái rộng 28 px: nút tròn 28 px (§3.2) với `aria-hidden="true"`, bên dưới là đường dọc 2 px `bg-ink/15` kéo hết chiều cao `<li>`. Mốc cuối vẫn có đường (như bản vẽ).
- Cột phải `flex-1 min-w-0 flex flex-col gap-2 pb-3.5`:
  - Tiêu đề là `<button type="button">` rộng hết, `min-h-11`, `aria-expanded`, `aria-controls` trỏ tới id của thẻ bên dưới. Trong nút: "Mốc {months} tháng" (`text-base font-bold`, màu theo §3.2), dưới là dòng tóm tắt §3.2 (`text-[13px]`, mặc định `text-muted`), bên phải icon `chevronDown` (gập) hoặc `chevronUp` (mở) cỡ 18 `text-muted`.
  - Khi mở: một thẻ `<ul className="glass overflow-hidden rounded-[22px]">` có id ở trên. Mỗi lĩnh vực có mục trong mốc là một `<li>` theo thứ tự `social`, `language`, `cognitive`, `movement` (bỏ lĩnh vực rỗng). Trong `<li>`: tiêu đề `<h3>` (`flex items-center gap-2 px-4 pt-3 pb-1 text-[13px] font-semibold tracking-[0.04em] text-muted uppercase`) gồm chấm tròn 8 px `aria-hidden` rồi tên lĩnh vực từ `MILESTONES.domains`; rồi một `<ul>` các dòng `MilestoneItem` của lĩnh vực đó, giữ thứ tự trong nội dung.
  - Màu chấm: `social` → `bg-cat-feed`, `language` → `bg-cat-temp`, `cognitive` → `bg-cat-sleep`, `movement` → `bg-cat-diaper`.
- `MilestoneItem` dùng y như hiện tại (vòng tick, "Đạt ngày dd/mm/yyyy · ghi chú · có ảnh", `PendingMark`, `disabled` khi không có quyền sửa). Không truyền `extra`. Đường kẻ giữa các dòng giữ `border-b border-line last:border-b-0`; giữa hai lĩnh vực thêm `border-t border-line` ở `<li>` lĩnh vực thứ hai trở đi.
- Bấm một dòng: mở `MilestoneSheet` như hiện tại. Đóng xong là về màn, mốc đang mở giữ nguyên.

### 4.4 Sheet Vận động lớn

- Dùng `Sheet` có sẵn (`components/ui/Sheet.tsx`, `variant` mặc định), title "Vận động lớn", không `footer`, `dirty` false.
- Dòng đầu: vạch dọc 2×14 px `bg-ink rounded` (`aria-hidden`) rồi "{tên bé} hôm nay: {formatAgeVi(baby.dob, now)}" (`text-[13px] text-muted`). Ví dụ "Bun hôm nay: 5 tháng 3 ngày".
- Một `<ul className="glass overflow-hidden rounded-[22px]">`, mỗi mốc vận động một `<li>` có `border-b border-line`, theo thứ tự nội dung:
  - Một `<button type="button">` rộng hết, `min-h-[60px] px-4 py-3 flex flex-col gap-2`, `disabled` theo cùng luật `canEdit` của màn.
  - Hàng trên `flex items-center gap-2.5`: vòng 22 px (đạt: `bg-good text-bg` với icon `check` 13; chưa: viền 2 px `border-muted/50`), tên đầy đủ `m.name` (`text-base text-ink flex-1`, được xuống hàng), `PendingMark` nếu đang chờ đồng bộ, rồi chip trạng thái (`rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap shrink-0`):
    - `done`: "Đạt {dd/mm/yyyy}" từ `achieved_on`, `bg-good-soft text-good-ink`.
    - `window`: "Đang tới tuổi", `bg-accent-tint text-accent-text`.
    - `early`: "Sắp tới", `bg-ink/7 text-ink`.
    - `late`: "Nên hỏi bác sĩ", `bg-warn-soft text-warn-ink`.
  - Hàng dưới: thanh `relative h-2.5 rounded-full bg-ink/7 w-full` có `aria-hidden="true"`, trong đó đoạn màu và vạch hôm nay (`absolute -top-1 -bottom-1 w-0.5 -ml-px rounded bg-ink`) theo §3.5 (vị trí bằng `style={{ left, width }}`).
  - Một `<span className="sr-only">` chứa `motorRange(m)` để trình đọc màn hình có khoảng tuổi.
- `<li>` cuối (không phải nút): hàng nhãn trục `flex justify-between px-4 pt-2 pb-3 text-[13px] text-muted` với "0", "6", "12", "18 tháng", `aria-hidden="true"`.
- Dưới thẻ: "Thanh màu là khoảng tuổi bé thường làm được. Bấm một mốc để ghi ngày đạt." (`text-[13px] text-muted px-1`).
- Bấm một mốc: đóng sheet Vận động lớn, mở `MilestoneSheet` của mốc đó (title là `m.name`). Khi `MilestoneSheet` đóng (lưu, bỏ đánh dấu, hay đóng không lưu), **sheet Vận động lớn mở lại**. Mở `MilestoneSheet` từ dòng thời gian thì khi đóng **không** mở sheet Vận động lớn.
- Một lúc chỉ có một sheet mở (không chồng `<dialog>`). Đổi sheet là **đổi ngay** trong cùng một lần đặt state: `MotorSheet` bị gỡ và `MilestoneSheet` được gắn cùng lúc, không chờ hiệu ứng đóng. Chiều ngược lại cũng vậy.

### 4.5 Khi nào nên hỏi bác sĩ

- Một `<button type="button" aria-haspopup="dialog">` rộng hết, `min-h-[52px] rounded-[22px] bg-warn-soft text-warn-ink px-4 py-2.5 flex items-center gap-3`: icon `alert` cỡ 20, "Khi nào nên hỏi bác sĩ" (`font-semibold flex-1 text-left`), icon `chevronRight` cỡ 16.
- Bấm: `Sheet` title "Khi nào nên hỏi bác sĩ", không footer; nội dung là danh sách `<ul className="list-disc pl-5 text-base text-ink">` các dòng `askDoctor` của **mốc hiện tại** (không có mốc hiện tại thì `groups[0]`).

### 4.6 Dòng nguồn

- `<p className="px-1 text-[13px] text-muted">` "Theo CDC và WHO, không thay cho khám sàng lọc."
- Ngay dưới, một hàng `flex gap-4 px-1` hai link `target="_blank" rel="noreferrer"`, mỗi link `inline-flex min-h-11 items-center text-[13px] text-muted underline`:
  - "Nguồn CDC" → `source` của mốc đang mở; không mốc nào mở thì của mốc hiện tại; không có mốc hiện tại thì `groups[0]`.
  - "Nguồn WHO" → `source` của mốc vận động `ngoi` (bản PDF của WHO).

## 5. Cấu trúc code

- `lib/rules/milestones.ts`: bỏ `visibleGroups`; sửa chữ trong `motorStatus`; thêm `MOTOR_AXIS_MONTHS`, `motorRange`, `motorSummary`, `timelineSteps(groups, age, achievedCodes, loaded, babyName)` trả về mỗi mốc `{ group, kind, summary, summaryTone }` theo §3.1–§3.2, trong đó `group` là chính `MilestoneGroup` (component lấy `months`, `items`, `source`, `askDoctor` từ đó) và `summaryTone` là `"muted"` hoặc `"warn"` (khi `loaded = false`: mọi mốc đã qua có `kind = "next"` cho phần vẽ, và **mọi** mốc, kể cả mốc hiện tại, có `summary = null`), `defaultOpenMonths(groups, age)` theo §3.3, `motorBar(m, age)` trả về `{ left, width, today }` dạng chuỗi phần trăm theo §3.5. Mọi hàm có test trong `lib/rules/milestones.test.ts`, gồm ít nhất các tuổi 0,5 / 2 / 3,9 / 5 / 13 / 30 tháng và trường hợp `loaded = false`.
- `lib/content/milestones.ts` + `content/milestones.vi.json`: thêm `short` (§3.4); test nội dung kiểm `short` đúng bảng §3.4.
- `components/milestones/MilestoneTimeline.tsx` (mới): hiển thị §4.3, nhận props thuần (danh sách bước, mốc đang mở, map mã → bản ghi, tập chờ đồng bộ, hàm `canEdit`, `onToggle`, `onOpenItem`), không gọi hook dữ liệu.
- `components/milestones/MotorSheet.tsx` (mới): hiển thị §4.4 bằng props thuần, không gọi hook dữ liệu.
- `components/milestones/AskDoctorSheet.tsx` (mới): §4.5.
- `components/milestones/MilestonesScreen.tsx`: giữ hook dữ liệu như hiện tại; giữ state mốc đang mở, sheet nào đang mở (`motor`, `askDoctor`, `item` với cờ `fromMotor`); ghép các phần §4.1. Vẫn có nút về "Sức khỏe" (test `components/nav/backlinks.test.tsx` phải xanh).
- `MilestoneItem.tsx`, `MilestoneSheet.tsx`: không đổi.
- Test render mới: `milestonetimeline.test.tsx` (mốc hiện tại mở, `aria-expanded`, chữ cam của mốc đã qua còn thiếu, mốc xa có tiêu đề `text-muted`, tiêu đề lĩnh vực theo thứ tự, không render tóm tắt khi chưa có dữ liệu), `motorsheet.test.tsx` (chip từng trạng thái, `style` left/width của đoạn màu, `sr-only` khoảng tuổi, nhãn trục).

## 6. Kiểm tra trên trình duyệt

Như các spec trước: một trang fixture tạm `app/chk/page.tsx` (không commit, xóa trước `git add`) render `MilestoneTimeline` và `MotorSheet` với dữ liệu giả cho bé 0,5 / 5 / 13 / 30 tháng, có mốc đã qua còn thiếu, mốc vận động trễ, một dòng chờ đồng bộ. Xem ở 375 px và 390 px, chủ đề Hồng dịu, Tím oải hương, Tối và Ban đêm:

1. Không chữ nào bị cắt "…"; chip trạng thái trong sheet không xuống hàng; tên mốc vận động dài ("Lật (từ sấp sang ngửa)") được xuống hàng mà không đè chip.
2. Tương phản ≥ 4,5:1 cho: tóm tắt cam trên nền trang, tiêu đề mốc xa `text-muted`, tiêu đề lĩnh vực, chữ chip `early` trên `bg-ink/7`, ở cả bốn chủ đề.
3. Trang thật `/phat-trien` (chỉ xem, không bấm Lưu): mốc hiện tại mở sẵn, bấm mốc khác thì mốc cũ gập; mở sheet Vận động lớn, bấm một mốc, bấm Esc ở sheet nhập ngày, sheet Vận động lớn mở lại; 0 lỗi console.

## 7. Danh sách kiểm trên máy

Thêm vào `docs/device-checklist.md` mục **Bước 41 — Mốc phát triển theo dòng thời gian (spec 2026-11-27)**, cùng khuôn với Bước 40: các mục xem màn, gập/mở mốc, sheet Vận động lớn và quay lại sau khi nhập ngày, sheet "Khi nào nên hỏi bác sĩ", chủ đề Ban đêm, VoiceOver đọc "Mốc … tháng", tóm tắt và trạng thái mở rộng/thu gọn. "Kết quả: Chờ người dùng." và bảng ba máy iPhone 11, iPhone 16, iPhone 17 Pro.
