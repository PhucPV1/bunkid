# Kim Bun — Triệu chứng theo ngày

**Status:** approved 2026-11-27
**Ngày:** 2026-11-27
**Unit:** `web` (PWA Next.js trên Vercel). Một unit. Không có migration.
**Liên quan:** spec `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (gọi tắt "spec Đợt ốm"). Code nền: `main` tại commit `5b90853` (215 file test / 2062 test vitest). Bản vẽ Claude Design: https://claude.ai/artifact/Hrih6GnW3c3nkpx8iXEb9L.

Bản vẽ chỉ để xem hình; số liệu trên bản vẽ là số bịa. Chỗ nào bản vẽ khác spec này thì spec này đúng.

## 1. Mục tiêu

Người dùng báo ngày 2026-11-27: triệu chứng trong đợt ốm khó dùng.

1. Trang đợt ốm không cho sửa triệu chứng của từng ngày. Hàng "Từng ngày" (`components/illness/EpisodeDayList.tsx`) không mở gì; muốn sửa phải vào Nhật ký mở từng bản ghi.
2. Lúc thêm triệu chứng không chọn được ngày. Sheet (`components/home/QuickEntrySheet.tsx`) chỉ có "Bây giờ · 5p trước · 15p trước · Giờ khác"; ngày nằm ẩn trong ô `datetime-local` của "Giờ khác".

Quyết định của người dùng ngày 2026-11-27:

- Triệu chứng ghi **theo ngày**. Giờ vẫn lưu nhưng không hỏi.
- Mỗi ngày **một** bản ghi triệu chứng (trừ khi có bản ghi người dùng không sửa được, xem §3.3). Ghi thêm cho ngày đã có thì mở sẵn chip của ngày đó; Lưu là sửa bản ghi đó. Ngày có sẵn nhiều bản ghi cũ được gộp khi Lưu.
- Sheet Triệu chứng, mở ở đâu cũng vậy, thay "Lúc nào?" bằng chọn ngày, kiểu **B** của bản vẽ: dải ngày vuốt ngang.
- Trang đợt ốm: mỗi hàng ngày có nút nhỏ **"Sửa"** (ngày đã có triệu chứng) hoặc **"+ Ghi triệu chứng"** (ngày chưa có), kiểu **E** của bản vẽ. Hàng không bấm được.
- Nút đó mở **sheet của một ngày**, đúng như bảng "Sheet của một ngày": ngày cố định, không đổi được.
- Bỏ hết chip thì Lưu tắt; có nút riêng "Xóa triệu chứng ngày này", hỏi lại trước khi xóa.
- Nhật ký hiện "Cả ngày" thay cho giờ; bấm vào mở sheet của ngày đó.
- Một ghi chú cho mỗi ngày.
- Thành viên thường mở ngày có chip do người khác ghi: **thêm được, bỏ không**.

Ngoài phạm vi: đổi các loại bản ghi khác (bú, tã, thuốc, nhiệt độ… giữ "Lúc nào?" như cũ); migration; đổi luật quyền (RLS); đổi trang Phân loại triệu chứng (`/trieu-chung`); thông báo mới; icon, token màu, dependency mới.

## 2. Global Constraints

- Không migration, không đổi bảng `logs`, không đổi RLS. Bản ghi triệu chứng vẫn là `type = 'symptom'`, `details = { codes: string[], note?: string }` theo `lib/rules/logDetails.ts` (codes 1–30, không trùng; note 1–200 ký tự sau khi trim).
- "Ngày" luôn là ngày lịch giờ Việt Nam: `vnDateString` trong `lib/rules/time.ts`, dạng `YYYY-MM-DD`.
- Giờ lưu của bản ghi mới: ngày hôm nay → thời điểm bấm Lưu; ngày trước hôm nay → 12:00 giờ VN của ngày đó.
- Ghi dữ liệu chỉ qua `useSaveLog` và `useDeleteLog` (`lib/data/logs.ts`), để mất mạng vẫn chạy qua outbox. Không gọi Supabase trực tiếp.
- Quyền sửa một bản ghi: `canModifyLog(member, log.created_by)` trong `lib/rules/history.ts` (chủ gia đình: mọi bản ghi; thành viên: bản ghi của mình).
- Không icon mới: chỉ dùng tên có trong `lib/ui/icons.ts` (`calendar`, `pencil`, `plus`, `close`, `chevronLeft`, `chevronRight`…). Không token màu mới.
- Vùng bấm tối thiểu 44 px (`min-h-11`), như mọi nút của app.
- Chữ trên màn hình viết đúng như spec này ghi trong ngoặc kép.
- Rules thuần nằm trong `lib/rules/`, có test vitest; component có test render như các file `*.test.tsx` hiện có.
- Hết spec: `bun run typecheck` (hoặc `tsc --noEmit`) sạch, toàn bộ vitest xanh, `bun run build` thoát 0.

## 3. Dữ liệu và luật

### 3.1 Triệu chứng của một ngày

Một hàm thuần mới trong `lib/rules/symptomDay.ts`:

```ts
type SymptomDay = {
  day: string; // "YYYY-MM-DD", giờ VN
  logs: LogRow[]; // bản ghi symptom hợp lệ của ngày, cũ trước
  own: LogRow[]; // phần của `logs` mà người đang dùng sửa được
  locked: string[]; // codes chỉ có trong bản ghi người đó KHÔNG sửa được
  codes: string[]; // mọi codes của ngày, mỗi code một lần, theo thứ tự nội dung
  ownNote: string; // ghi chú của `own`, nối bằng " · ", bỏ ghi chú rỗng
  otherNotes: string[]; // ghi chú của bản ghi không sửa được
};
function symptomDay(logs, day, canModify: (createdBy) => boolean): SymptomDay;
```

- Bản ghi hợp lệ: `type === "symptom"` và `detailsSchemas.symptom.safeParse(details)` thành công. Bản ghi không hợp lệ bị bỏ qua (không hiện, không bị gộp, không bị xóa).
- `locked`: code có trong ít nhất một bản ghi không sửa được. Một code vừa có trong bản ghi sửa được vừa có trong bản ghi không sửa được vẫn là `locked`.
- Chủ gia đình: `own = logs`, `locked = []`, `otherNotes = []`.

### 3.2 Lưu một ngày

Hàm thuần `symptomDaySave(input)` trả về danh sách thao tác, component chạy lần lượt bằng `useSaveLog` / `useDeleteLog`:

- Đầu vào: `SymptomDay`, `picked: string[]` (chip đang bật), `note: string` (ô ghi chú), `today: string`, `now: Date`.
- `ownCodes = picked` trừ `locked`, theo thứ tự nội dung (dùng `joinCodes` của `lib/rules/symptomForm.ts`).
- Ghi chú lưu: `note.trim()`; rỗng thì không có khóa `note`. Dài hơn 200 ký tự thì **không lưu**, báo lỗi "Ghi chú dài quá 200 ký tự" (không tự cắt).
- `ownCodes` có ít nhất một code:
  - `own` rỗng → một `insert` (`id: null`). `LogPatch` đủ bốn trường: `started_at` theo §2 (hôm nay: `now`; ngày cũ: 12:00 VN), `ended_at` = chính `started_at` (như `useAddInstant`; `ended_at = null` là đồng hồ đang chạy), `details` = `{ codes: ownCodes, note? }`, cột `note` = `null`.
  - `own` có bản ghi → `update` bản ghi đầu tiên của `own` (cũ nhất): `details` mới; `started_at`, `ended_at` và cột `note` giữ nguyên giá trị của bản ghi đó. Rồi `delete` các bản ghi còn lại của `own`.
- `ownCodes` rỗng và `own` có bản ghi → `delete` mọi bản ghi của `own` (chỉ xảy ra khi còn chip `locked`).
- `ownCodes` rỗng và `own` rỗng → không có thao tác.
- **Không đổi gì**: `own` có đúng một bản ghi, `ownCodes` bằng codes của bản ghi đó trừ `locked` (so như **tập hợp**, không theo thứ tự), và ghi chú đã trim bằng `note` trong `details` của nó (hoặc cùng rỗng). Hoặc `own` rỗng và `ownCodes` rỗng. Khi đó không có thao tác.
- Thứ tự gửi: insert/update trước, delete sau, mỗi thao tác chờ thao tác trước được đưa vào outbox. Rủi ro chấp nhận: máy khác đã xóa bản ghi đang được update thì update không đổi dòng nào mà các delete vẫn chạy; ngày đó mất triệu chứng của người này. Hiếm (cần hai người cùng sửa một ngày lúc mất mạng), không xử lý thêm.

**Nút Lưu và ô ghi chú (luật duy nhất, cho cả hai chế độ):**

- Lưu tắt khi: đang tải; lỗi tải; hoặc không có chip nào được bật (`picked` rỗng). Vì vậy Lưu không bao giờ xóa trọn một ngày: thao tác delete-hết-own của Lưu chỉ xảy ra khi còn chip `locked`. Muốn xóa cả ngày thì dùng nút xóa (§5.2).
- Trường hợp `ownCodes` rỗng và `own` rỗng (chỉ còn chip khóa) rơi vào "không đổi gì": bấm Lưu chỉ đóng sheet.
- Ô ghi chú tắt (disabled) khi `ownCodes` rỗng, kèm dòng muted dưới ô "Bật ít nhất một triệu chứng để ghi chú." Ghi chú phải đi cùng một bản ghi có code, nên không có ghi chú nào bị bỏ mà không báo.
- Lưu bật mà không đổi gì: bấm Lưu chỉ đóng sheet, không toast.

### 3.3 Xóa một ngày

`symptomDayDelete(day)` trả về `delete` cho mọi bản ghi của `own`. Nút xóa chỉ hiện khi `own` không rỗng **và** `locked` rỗng (xem §5.2), nên xóa xong ngày không còn triệu chứng.

Một ngày có thể có nhiều bản ghi: một của mỗi người không sửa được bản ghi của nhau, hoặc hai máy cùng lưu lúc mất mạng. Mọi chỗ đọc (§6) gộp theo ngày nên vẫn hiện đúng; lần Lưu sau của người sửa được sẽ gộp lại.

### 3.4 Triệu chứng thuộc đợt ốm theo ngày

Đổi `symptomEntries` trong `lib/rules/illness.ts`: một bản ghi triệu chứng thuộc đợt ốm khi **ngày VN** của nó nằm từ ngày bắt đầu đến ngày kết thúc của đợt (đợt đang mở: đến hôm nay), thay cho so `started_at` với giờ bắt đầu/kết thúc (`belongsTo`). Nhiệt độ và thuốc giữ `belongsTo` như cũ.

Lý do: bản ghi ngày cũ lưu 12:00; đợt bắt đầu 18:00 ngày đó vẫn phải thấy nó ở "ngày 1".

Viết thành một hàm dùng chung `symptomInEpisode(log, episode, now)` (trong `lib/rules/illness.ts`), để `symptomEntries` và báo cáo (§6.3) dùng cùng một luật.

Hệ quả, chấp nhận:

- `closeReminder` (trường hợp `quiet`) lấy mốc là giờ lưu của bản ghi triệu chứng cuối, có thể là 12:00 của một ngày cũ. Mốc không sớm hơn giờ bắt đầu đợt vì hàm lấy `max` với `started_at`.
- Ngày mà một đợt kết thúc và đợt sau bắt đầu: triệu chứng của ngày đó thuộc cả hai đợt.

## 4. Sheet Triệu chứng có dải ngày (kiểu B)

### 4.1 Chỗ mở

Mọi chỗ đang mở `QuickEntrySheet` với `type === "symptom"`: ô "Triệu chứng" trong sheet "+" và nút "Triệu chứng" trên thẻ của trang đợt ốm (`EpisodeVerdict`). Thẻ đợt ốm trên tab Hôm nay (`EpisodeHomeCards`) cũng vậy. Cả ba đi qua `openInstant("symptom")` trong `components/actions/QuickActions.tsx`. Khi `type === "symptom"`, `QuickActions` mở component mới `SymptomDaySheet` (§4.2) thay cho `QuickEntrySheet`. `QuickEntrySheet` không còn nhánh symptom.

**"Ghi bù" trong Nhật ký** (`HistoryScreen` mở `LogEditSheet` với `log: null`): bỏ `{ value: "symptom", label: "Triệu chứng" }` khỏi `MANUAL_TYPES` (`lib/rules/logForm.ts`). Ghi bù triệu chứng cho ngày cũ làm bằng dải ngày (ô "Khác"). Sau thay đổi này `LogEditSheet` không còn mở bản ghi symptom nào; nhánh symptom của nó, của `FieldList` (kind `"symptoms"`) và `QUICK_FIELDS.symptom` được bỏ nếu không còn ai dùng, giữ nếu còn (người lập plan kiểm bằng `grep`).

### 4.2 Bố cục, từ trên xuống

`components/quick/SymptomDaySheet.tsx`, dùng `Sheet` của `components/ui`:

1. Tiêu đề "Triệu chứng", nút đóng.
2. Nhãn "Ngày nào?" và **dải ngày** (§4.3). Chỉ có ở chế độ chọn ngày; chế độ ngày cố định (§5) không có dải.
3. Khi ngày đang chọn đã có triệu chứng: một dòng nền accent-tint "Ngày này đã ghi {tên ngắn, nối ", "}. Bấm để thêm hoặc bỏ rồi Lưu." Khi chưa có: dòng "Bấm những gì bé có trong ngày." như bây giờ.
4. Chip picker có sẵn (`SymptomPicker`, "Hay gặp" + "Xem tất cả {n} triệu chứng"), bật sẵn `codes` của ngày. Chip trong `locked` theo §5.3, ở **cả hai chế độ**.
5. Ô "Ghi chú (không bắt buộc)", sẵn `ownNote`. Có `otherNotes` thì dưới ô là dòng chữ nhỏ màu muted "Người khác ghi: {otherNotes nối " · "}".
6. Nút "Lưu" (§3.2). Ở chế độ ngày cố định có thêm nút xóa (§5.2).

Đổi ngày trong dải: chip và ghi chú nạp lại theo ngày mới; những gì đang bấm dở của ngày cũ bị bỏ, không hỏi.

### 4.3 Dải ngày

- Mỗi ô rộng 64 px, cao tối thiểu 64 px, bo 18 px: dòng trên đậm, dòng dưới "dd/MM" (`formatDayShort`). Ô đang chọn nền accent, chữ trắng. Ô của ngày đã có triệu chứng có chấm tròn 6 px màu accent (trắng khi ô đang chọn) dưới hai dòng chữ.
- **Có đợt ốm đang mở** (đợt có `ended_at === null` của bé, `useEpisodes`): một ô cho mỗi ngày từ ngày bắt đầu đến hôm nay, dòng trên "Ngày {n}", riêng ô hôm nay ghi "Hôm nay". Trên dải, nhãn "Ngày nào? · đợt ốm từ {dd/MM}".
- **Không có đợt ốm đang mở**: 7 ô, 6 ngày trước và hôm nay, bỏ những ngày trước ngày sinh của bé (bé mới 2 ngày tuổi thì chỉ có 3 ô); dòng trên là "Hôm nay", "Hôm qua", rồi thứ viết tắt ("T2"…"T7", "CN"). Nhãn "Ngày nào?".
- Cuối dải là ô "Khác" (icon `calendar`, dòng dưới "Khác"). Bấm vào mở `<input type="date">` của trình duyệt; `max` = hôm nay, `min` = ngày sinh của bé. Ngày chọn được mà nằm trong dải thì chọn ô đó; ngoài dải thì ô "Khác" được chọn và dòng dưới đổi thành "dd/MM" của ngày đó.
- Mở sheet: chọn sẵn ô hôm nay; dải cuộn ngang (không thanh cuộn) và cuộn sẵn để ô hôm nay nằm trong khung.
- Đọc bản ghi cho dải: `useRangeLogs(babyId, startOfDayIso(ngày đầu dải), null)`. `startOfDayIso` hiện là hàm riêng trong `lib/rules/illness.ts`: chuyển ra `lib/rules/days.ts` (cạnh `vnDayStartMs`) và export; không đặt trong `time.ts` để tránh import vòng. Ngày "Khác" ngoài dải: thêm một `useRangeLogs` cho đúng ngày đó. Đang tải: chip tắt, Lưu tắt, dòng §4.2 mục 3 là "Đang tải…". Lỗi tải: dòng "Không tải được triệu chứng đã ghi" và Lưu tắt (không cho ghi đè mù).

### 4.4 Sau khi Lưu

Chạy thao tác của §3.2 theo thứ tự (update/insert trước, delete sau). Thành công: đóng sheet, toast "Đã lưu triệu chứng {Hôm nay | dd/MM}". Không có nút Hoàn tác cho triệu chứng. Lỗi: giữ sheet, hiện lỗi bằng `toVietnameseError`.

## 5. Sheet của một ngày (ngày cố định)

### 5.1 Chỗ mở

`SymptomDaySheet` với prop `day` cố định:

- Nút "Sửa" / "+ Ghi triệu chứng" trên hàng ngày của trang đợt ốm (§6.1).
- Bấm một bản ghi triệu chứng trong Nhật ký (§6.2).

Đầu sheet: tiêu đề "Triệu chứng · {dd/MM}"; dòng phụ "Ngày {n} của đợt ốm · cả ngày" khi mở từ trang đợt ốm, "Cả ngày" khi mở từ Nhật ký. Không có dải ngày. Phần còn lại như §4.2 mục 3–6.

Đọc bản ghi: `useRangeLogs(babyId, startOfDayIso(day), startOfDayIso(day + 1))`, cùng trạng thái đang tải / lỗi tải như §4.3.

### 5.2 Nút xóa

- Chữ "Xóa triệu chứng ngày này", màu danger, không nền, cao 44 px, dưới nút Lưu. Không icon.
- Hiện khi `own` không rỗng và `locked` rỗng.
- Bấm: `window.confirm("Xóa triệu chứng ngày {dd/MM}?")`, đồng ý thì chạy §3.3, toast "Đã xóa triệu chứng {dd/MM}", đóng sheet.

### 5.3 Chip bị khóa

Áp dụng cho cả chế độ dải ngày (§4) và ngày cố định. Chip trong `locked` bật sẵn và không tắt được (`aria-disabled="true"`, độ mờ như chip tắt của app). Có chip khóa thì dưới chip picker có dòng muted "Chip mờ do người khác ghi, chỉ họ hoặc chủ gia đình bỏ được."

Nút Lưu và ô ghi chú theo luật duy nhất ở cuối §3.2.

## 6. Những chỗ khác đổi theo

### 6.1 Trang đợt ốm, hàng "Từng ngày" (kiểu E)

`EpisodeDayList` nhận thêm `onEdit(day: string)`. Mỗi hàng:

- Ngày có chip triệu chứng: sau các chip là nút "Sửa" (icon `pencil` 14 px, nền accent-tint, chữ accent, 13 px đậm, cao 44 px, `aria-label="Sửa triệu chứng ngày {dd/MM}"`).
- Ngày chưa có: dòng chip là một nút chữ "Ghi triệu chứng" có icon `plus` phía trước (cùng kiểu, `aria-label="Ghi triệu chứng ngày {dd/MM}"`). "+ Ghi triệu chứng" ở §1 và §5.1 là nút này.
- Hàng vẫn không bấm được. Đợt đã đóng vẫn có nút (sửa được ngày cũ).
- `EpisodeScreen` mở `SymptomDaySheet` cố định ngày đó.

`dayRows` lấy chip của ngày từ §3.4 (theo ngày lịch).

### 6.2 Nhật ký

- Dòng của bản ghi triệu chứng hiện "Cả ngày" ở chỗ giờ (`components/history/HistoryList.tsx`).
- Trong một ngày, bản ghi triệu chứng xếp đầu ngày, trước mọi bản ghi khác; nhiều bản ghi triệu chứng trong một ngày giữ thứ tự cũ trước (`groupByVnDay` trong `lib/rules/history.ts`).
- Bấm vào mở `SymptomDaySheet` cố định ngày của bản ghi đó (§5), không mở `LogEditSheet`. Các loại khác vẫn mở `LogEditSheet`.
- Thẻ "Gần đây" trên tab Hôm nay (`components/home/RecentCard.tsx`): bản ghi triệu chứng cũng hiện "Cả ngày" thay cho giờ.

### 6.3 Báo cáo

`symptomRows` trong `lib/rules/report.ts` gộp theo ngày: một hàng mỗi ngày, cột đầu chỉ có "dd/MM", triệu chứng là tên ngắn của mọi codes trong ngày, ghi chú là các ghi chú nối " · ". Đầu cột trong `ReportScreen` đổi "Giờ" thành "Ngày".

Kỳ "Đợt ốm" của báo cáo: `ReportScreen` hiện lọc bản ghi bằng `belongsTo(episode, log.started_at, now)` trước khi gọi `symptomRows`. Đưa phần lọc này ra một hàm thuần `episodeReportLogs(logs, episode, now)` trong `lib/rules/report.ts` (có test). Với bản ghi triệu chứng, lọc bằng `symptomInEpisode` (§3.4) thay cho `belongsTo`, để báo cáo và trang đợt ốm thấy cùng một tập triệu chứng. Các loại khác giữ `belongsTo`.

## 7. Test và kiểm tra

- `lib/rules/symptomDay.test.ts`: `symptomDay` (một bản ghi, nhiều bản ghi, bản ghi không hợp lệ, chủ vs thành viên, code vừa khóa vừa không), `symptomDaySave` (insert hôm nay = `now`, insert ngày cũ = 12:00 VN, update + delete khi gộp, nối ghi chú, ghi chú > 200 báo lỗi, chỉ còn chip khóa → delete của own, không đổi gì → rỗng), `symptomDayDelete`.
- `lib/rules/illness.test.ts`: bản ghi 12:00 của ngày bắt đầu đợt (đợt mở 18:00) thuộc đợt; bản ghi của ngày sau ngày kết thúc không thuộc.
- `lib/rules/report.test.ts`: `episodeReportLogs` giữ bản ghi triệu chứng 12:00 đó; nhiệt độ/thuốc vẫn theo `belongsTo`.
- Lưu tắt khi bỏ hết chip (không có chip khóa); Lưu không bao giờ sinh delete-hết khi không có chip khóa.
- Insert có `ended_at === started_at` và cột `note === null`; update giữ `started_at`, `ended_at`, cột `note`. Bản ghi symptom mới không hiện như đồng hồ đang chạy.
- Ô ghi chú tắt khi `ownCodes` rỗng; thành viên chỉ có chip khóa không lưu được ghi chú suông.
- `MANUAL_TYPES` không còn "Triệu chứng".
- Dải ngày: hàm thuần `dayStrip({ episode, today, dob })` trong `lib/rules/symptomDay.ts`, test cả hai trường hợp và nhãn.
- Test render: `SymptomDaySheet` (hai chế độ, dòng đã ghi, chip khóa, nút xóa ẩn/hiện, Lưu tắt), `EpisodeDayList` (nút "Sửa" và "Ghi triệu chứng"), `HistoryList` ("Cả ngày"), `report` (hàng theo ngày).
- Trình duyệt (pane trong app, 375 × 812, theme hồng dịu và dark): sheet chọn ngày có đợt và không có đợt, ô "Khác", sheet ngày cố định, hàng E. Không tràn ngang, chữ không bị cắt.
- Checklist thiết bị `docs/device-checklist.md`: thêm bước cho iPhone (lưu thật một ngày, gộp, xóa, thành viên thêm vào ngày của người khác, `<input type="date">` trên iOS).
