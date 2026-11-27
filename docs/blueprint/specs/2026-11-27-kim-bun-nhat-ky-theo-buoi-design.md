# Kim Bun — Nhật ký gom theo buổi

**Status:** approved 2026-11-27
**Ngày:** 2026-11-27
**Unit:** `web` (PWA Next.js trên Vercel). Một unit. Không có migration.
**Liên quan:** code nền `main` tại commit `e6fffab` (219 file test / 2114 test vitest). Bản vẽ Claude Design: https://claude.ai/artifact/Dyqqw7xSA72q7NXHXJ1a6L, artboard **C — Gom theo buổi**.

Bản vẽ chỉ để xem hình; số liệu trên bản vẽ là số bịa. Chỗ nào bản vẽ khác spec này thì spec này đúng.

## 1. Mục tiêu

Người dùng báo ngày 2026-11-27: Nhật ký quá dài. Hiện tại (`components/history/HistoryScreen.tsx`, `HistoryList.tsx`) mỗi trang tải 7 ngày, ngày nào cũng bày hết mọi bản ghi, mỗi dòng cao ít nhất 60 px.

Quyết định của người dùng ngày 2026-11-27 (chọn kiểu **C** trên bản vẽ):

- Trong mỗi ngày, bản ghi chia theo **buổi**: Đêm 0–6, Sáng 6–12, Chiều 12–18, Tối 18–24.
- Mỗi buổi gập/mở được; buổi đang gập hiện một dòng tóm tắt "cữ · tã · ngủ".
- Mở sẵn: **chỉ buổi mới nhất có bản ghi của hôm nay**. Mọi buổi khác, kể cả các ngày cũ, gập.
- Buổi không có bản ghi: hiện **dòng mờ**. Hôm nay chỉ hiện tới buổi đang diễn ra (trừ §3.2 điều 2); ngày cũ luôn đủ 4 buổi. (Buổi chỉ có giấc ngủ kéo dài từ buổi trước hiện tóm tắt ngủ thay cho dòng mờ, §3.2.)
- Khi đang lọc (Bú, Tã…): **mọi buổi tự mở**, buổi không có bản ghi khớp thì **ẩn**.
- Buổi người dùng tự bấm gập/mở **không được nhớ**: rời Nhật ký rồi quay lại là về mặc định.
- Triệu chứng "Cả ngày" nằm **trên các buổi**, không gập.

Ngoài phạm vi: đổi cách tải trang (vẫn 7 ngày một trang, nút "Xem thêm 7 ngày trước"); đổi chip lọc, nút "Ghi bù", `LogEditSheet`, `SymptomDaySheet`; đổi "Gần đây" ở màn Hôm nay; lưu trạng thái gập vào bộ nhớ máy hay server; nút "gập/mở tất cả"; icon, token màu, dependency mới.

## 2. Global Constraints

- Không migration, không đổi bảng `logs`, không đổi RLS, không ghi dữ liệu mới. Màn Nhật ký vẫn chỉ đọc qua `useHistoryLogs`.
- Giờ và ngày luôn theo giờ Việt Nam (UTC+7, không đổi giờ theo mùa): ngày bằng `vnDateString` (`lib/rules/time.ts`), mốc đầu ngày bằng `vnDayStartMs` (`lib/rules/days.ts`).
- Buổi của một bản ghi tính theo **`started_at`** của nó, giờ VN: giờ 0–5 → Đêm, 6–11 → Sáng, 12–17 → Chiều, 18–23 → Tối.
- Mốc giờ là hằng số trong code, không cấu hình.
- Không icon mới: mũi tên dùng `chevronDown` / `chevronUp` có sẵn trong `lib/ui/icons.ts`. Dấu chờ đồng bộ dùng `PendingMark` có sẵn. Không token màu mới.
- Vùng bấm tối thiểu 44 px, như mọi nút của app.
- Chữ trên màn hình viết đúng như spec này ghi trong ngoặc kép; dấu gạch nối giờ là en dash "–" (U+2013).
- Rules thuần nằm trong `lib/rules/`, có test vitest; component có test render như các file `*.test.tsx` hiện có.
- Hết spec: `bun run typecheck` sạch, toàn bộ vitest xanh, `bun run build` thoát 0.

## 3. Luật

### 3.1 Buổi

| Khóa        | Nhãn hiển thị       | Giờ VN                |
| ----------- | ------------------- | --------------------- |
| `night`     | "Đêm · 0–6 giờ"     | 00:00 tới trước 06:00 |
| `morning`   | "Sáng · 6–12 giờ"   | 06:00 tới trước 12:00 |
| `afternoon` | "Chiều · 12–18 giờ" | 12:00 tới trước 18:00 |
| `evening`   | "Tối · 18–24 giờ"   | 18:00 tới hết ngày    |

Trong một ngày, buổi muộn nhất đứng trên (Tối, Chiều, Sáng, Đêm), giống thứ tự mới-nhất-trước của Nhật ký. Trong một buổi, bản ghi vẫn mới nhất trước như `groupByVnDay` đang làm.

Bản ghi triệu chứng (`type = 'symptom'`) không thuộc buổi nào (§3.4).

### 3.2 Buổi nào hiện

Một hàm thuần mới trong `lib/rules/history.ts`, ví dụ:

```ts
type DayPeriodKey = "night" | "morning" | "afternoon" | "evening";
type DayPeriod<T> = {
  key: DayPeriodKey;
  label: string; // §3.1
  summary: string; // §3.3, rỗng khi kind = "empty"
  logs: T[]; // bản ghi của buổi đã qua bộ lọc, mới nhất trước
  kind: "logs" | "sleepOnly" | "empty"; // xem dưới, không tính bộ lọc
};
function dayPeriods<T extends LogLike>(input: {
  day: string; // "YYYY-MM-DD"
  logs: T[]; // mọi bản ghi bắt đầu trong ngày (chưa lọc)
  all: T[]; // mọi bản ghi đã tải, để tính giấc ngủ từ hôm trước
  filter: HistoryFilter;
  now: Date;
}): { symptoms: T[]; periods: DayPeriod<T>[] };
```

Tên và chữ ký cụ thể do plan chốt; hành vi phải đúng như sau.

Loại của một buổi (`kind`), luôn tính trên mọi bản ghi, không tính bộ lọc:

- `"logs"`: có ít nhất một bản ghi (không tính triệu chứng) bắt đầu trong buổi.
- `"sleepOnly"`: không bản ghi nào bắt đầu trong buổi, nhưng phút ngủ của buổi (§3.3) > 0, tức một giấc bắt đầu từ buổi trước còn kéo dài sang. Ví dụ bé ngủ 21:00–06:30: Đêm là `"sleepOnly"`, tóm tắt "ngủ 6g".
- `"empty"`: không bản ghi nào bắt đầu trong buổi và phút ngủ bằng 0.

Buổi nào có trong danh sách:

1. Ngày trước hôm nay: đủ 4 buổi.
2. Hôm nay: buổi đã bắt đầu (giờ bắt đầu của buổi ≤ `now`), **cộng** mọi buổi `"logs"` dù giờ bắt đầu của buổi > `now`. Lý do: form ghi cho phép giờ bắt đầu tới 60 giây sau hiện tại (`FUTURE_SLACK_MS`), `useNow` chỉ cập nhật 30 giây một lần, và đồng hồ máy khác trong nhà có thể nhanh hơn; bản ghi không được biến mất. Ví dụ lúc 10:00: Sáng, Đêm. Lúc 12:00 đúng: Chiều, Sáng, Đêm. Lúc 11:59:40 có cữ bú bắt đầu 12:00:20: Chiều, Sáng, Đêm.
3. Lọc "Tất cả" (`filter === "all"`): buổi `"sleepOnly"` và `"empty"` vẫn có trong danh sách, `logs: []`.
4. Lọc khác "Tất cả": chỉ giữ buổi có ít nhất một bản ghi khớp lọc (`matchesFilter`). Mọi buổi khác bị bỏ, kể cả `"sleepOnly"` và `"empty"`.
5. Ngày không có bản ghi nào khớp lọc vẫn bị ẩn cả ngày như hiện nay (không đổi luật ở `HistoryScreen`). Ngày không có bản ghi nào bắt đầu trong ngày thì không hiện, kể cả khi có giấc ngủ từ hôm trước kéo sang: ví dụ 01:00, bé ngủ từ 22:00 hôm qua, hôm nay chưa ghi gì → chưa có mục "Hôm nay", giấc ngủ nằm ở Tối của hôm qua. Cố ý, không sửa. Ngày chỉ có bản ghi triệu chứng, ở lọc "Tất cả", vẫn hiện các buổi theo điều 1–3.

### 3.3 Tóm tắt một buổi

Tóm tắt luôn tính trên **mọi** bản ghi của buổi, không tính bộ lọc (giống `daySummary`: bộ lọc chỉ ẩn dòng).

- **Cữ:** tính phiên bú bằng `groupFeedSessions` trên mọi bản ghi của **cả ngày** (không phải của riêng buổi), rồi đếm phiên vào buổi chứa thời điểm bắt đầu của phiên. Nhờ vậy bú trái 11:55 + bú phải 12:05 là một cữ, nằm ở Sáng, và tổng cữ các buổi bằng số cữ của ngày.
- **Tã:** số bản ghi `diaper` của buổi.
- **Ngủ:** số phút ngủ nằm trong khung `[đầu buổi, min(cuối buổi, now))`, cắt ở mốc buổi giống `daySummary` cắt ở nửa đêm; lấy giấc ngủ từ `all`, nên giấc 23:00 hôm trước tới 05:00 tính 5 giờ vào Đêm. Giấc đang chạy tính tới `now`. Định dạng bằng `shortDuration` (`lib/rules/summaryText.ts`): "45p", "2g", "2g 10p".
- Chuỗi: các phần khác 0 theo thứ tự "{n} cữ", "{n} tã", "ngủ {thời lượng}", nối bằng " · ". Ví dụ "3 cữ · 2 tã · ngủ 2g 10p", "1 tã", "ngủ 4g 20p".
- Cả ba phần đều 0 nhưng buổi có bản ghi (ví dụ chỉ có thuốc): "{n} mục", n là số bản ghi của buổi. Ví dụ "1 mục". Cố ý: một cữ vắt qua mốc (bú trái 11:55, bú phải 12:05) tính ở Sáng, nên Chiều chỉ có dòng bú phải sẽ ghi "1 mục".
- Buổi `"sleepOnly"`: tóm tắt chỉ có phần ngủ, ví dụ "ngủ 6g".
- Buổi `"empty"`: không có tóm tắt; hiện "Không có bản ghi" (§4.3).
- Nhờ phần ngủ tính cả buổi `"sleepOnly"`, tổng phút ngủ các buổi của một ngày bằng phút ngủ của `daySummary` ngày đó.

### 3.4 Triệu chứng "Cả ngày"

Bản ghi triệu chứng của ngày (đã đứng đầu ngày nhờ `groupByVnDay`) tách khỏi các buổi, đi vào `symptoms`. Chúng qua bộ lọc như cũ (`matchesFilter`, lọc "Nhiệt độ" có triệu chứng). Chúng không đổi `kind` của buổi nào và không tính vào tóm tắt buổi.

### 3.5 Buổi nào đang mở

Trạng thái mở của một buổi, khóa là `${day}|${periodKey}`:

1. **Lọc khác "Tất cả":** mặc định mọi buổi mở.
2. **Lọc "Tất cả":** mặc định chỉ buổi `defaultOpen` mở: buổi `"logs"` muộn nhất của **hôm nay**. `defaultOpen` là một hàm thuần riêng trong `lib/rules/history.ts` (không phải trường của kết quả `dayPeriods`), có test riêng. Hôm nay chưa có bản ghi nào thì không buổi nào mở sẵn. Ngày cũ không có buổi mở sẵn.
3. `defaultOpen` tính lại mỗi lần render. Ví dụ: đang ở Sáng (mở), 12:30 có cữ bú đầu tiên của Chiều (qua realtime hoặc tự ghi) → Chiều mở, Sáng gập; trừ khi người dùng đã tự bấm Sáng (điều 4).
4. Người dùng bấm hàng tiêu đề một buổi: đảo trạng thái đang thấy của buổi đó và ghi lại thành lựa chọn riêng của buổi đó, đè lên mặc định.
5. Lựa chọn riêng sống trong state của `HistoryScreen`; không lưu vào `localStorage`, `sessionStorage` hay server. Màn Nhật ký unmount (rời tab) là mất. Đổi chip lọc cũng xóa hết lựa chọn riêng, để mặc định của chế độ mới áp dụng.
6. Buổi `"sleepOnly"` và `"empty"` không mở được, không có trạng thái.

## 4. Giao diện

### 4.1 Bố cục một ngày, từ trên xuống

1. Tiêu đề ngày, không đổi: nhãn `vnDayLabel` bên trái, tóm tắt ngày `daySummary` bên phải.
2. Một khối kính (`Glass as="ul"`, như hiện nay) cho cả ngày. Cấu trúc HTML cố định như sau:

   ```html
   <ul class="glass …">
     <!-- mỗi bản ghi triệu chứng: một <li> dòng bản ghi như hiện nay -->
     <li>…dòng triệu chứng "Cả ngày"…</li>
     <!-- mỗi buổi "logs": một <li> chứa nút tiêu đề, và khi mở thì một <ul> lồng -->
     <li>
       <button
         type="button"
         aria-expanded="true"
         aria-controls="p-2026-11-27-afternoon"
       >
         …
       </button>
       <ul id="p-2026-11-27-afternoon">
         <li>…dòng bản ghi như hiện nay…</li>
       </ul>
     </li>
     <!-- mỗi buổi "sleepOnly" hoặc "empty": một <li> không có nút -->
     <li>…nhãn buổi · tóm tắt hoặc "Không có bản ghi"…</li>
   </ul>
   ```

   - Dòng bản ghi giữ nguyên kiểu hiện nay (icon tròn, mô tả, ghi chú, giờ, người ghi, `PendingMark`), cả dòng triệu chứng.
   - `id` của `<ul>` lồng: `p-{day}-{periodKey}`, ví dụ `p-2026-11-27-afternoon`.
   - Đường kẻ giữa các hàng: mỗi `<li>` ngoài có `border-b border-line`, `<li>` ngoài cuối cùng không có (`last:border-b-0`). Trong `<ul>` lồng, mỗi dòng có `border-t border-line` để tách với nút tiêu đề và với nhau; không có đường kẻ đôi.

3. Buổi đang gập: **không render** `<ul>` lồng và các dòng bản ghi của nó (không chỉ ẩn bằng CSS).

### 4.2 Hàng tiêu đề buổi

- Chỉ buổi `"logs"` có hàng này. Là một `<button type="button">` chiếm cả hàng, cao tối thiểu 52 px, padding ngang 16 px, nền `bg-line` (token có sẵn, đổi theo theme, nên tách được với dòng bản ghi ở mọi theme kể cả Tối và Ban đêm). Không dùng màu thô.
- Trái: nhãn buổi (§3.1), chữ 16 px đậm (`font-bold`), màu `text-ink`.
- Phải: tóm tắt (§3.3), 13 px `text-muted`, số `tabular-nums`; rồi `PendingMark` (chỉ khi buổi **đang gập** và có ít nhất một bản ghi trong `logs` của buổi, tức bản ghi đã qua bộ lọc hiện tại, nằm trong tập `pending`); rồi icon `chevronDown` khi gập, `chevronUp` khi mở, 18 px.
- `aria-expanded` đúng trạng thái. `aria-controls` chỉ có khi đang mở, bằng `id` của `<ul>` lồng (§4.1); khi gập thì bỏ thuộc tính này, như `components/triage/SymptomChips.tsx` đang làm.
- Tóm tắt dài không được đẩy nhãn xuống dòng: nhãn `shrink-0 whitespace-nowrap`; tóm tắt được xuống dòng hoặc cắt bớt bằng `truncate` (plan chọn một, đo ở 375 px).

### 4.3 Hàng không bấm được (buổi `"sleepOnly"` và `"empty"`, chỉ ở lọc "Tất cả")

- Là `<li>` thường, **không** phải nút, không mũi tên, không nền `bg-line`; cao tối thiểu 52 px, padding ngang 16 px như hàng tiêu đề buổi.
- Buổi `"empty"` (dòng mờ): trái là nhãn buổi, 16 px đậm, `text-muted`; phải là "Không có bản ghi", 13 px `text-muted`.
- Buổi `"sleepOnly"`: trái là nhãn buổi, 16 px đậm, `text-ink`; phải là tóm tắt (ví dụ "ngủ 6g"), 13 px `text-muted`, `tabular-nums`.
- Không làm mờ bằng `opacity` (giữ tương phản chữ ≥ 4.5:1 như `text-muted` đang đạt).

### 4.4 Không đổi

Header "Nhật ký" và nút "Ghi bù"; hàng chip "Lọc nhật ký"; skeleton, lỗi, "cần mạng", các trạng thái rỗng và chữ của chúng; nút "Xem thêm 7 ngày trước"; bấm một dòng bản ghi mở `LogEditSheet`, bấm dòng triệu chứng mở `SymptomDaySheet` ngày đó; `content-visibility` theo từng ngày.

### 4.5 Hiệu năng

`firstScreen` (`lib/rules/history.ts`) hiện cắt theo số dòng bản ghi của ngày. Sau thay đổi, lần render đầu sau khi chuyển tab vẫn không render quá `FIRST_SCREEN_ROWS` (12) dòng **bản ghi**; hàng tiêu đề buổi và hàng không bấm được (§4.3) không tính vào giới hạn đó. Buổi gập không đóng góp dòng nào. Plan chốt cách làm (cắt sau khi tính buổi và trạng thái mở).

`MemoHistoryList` vẫn memo; props mới (trạng thái mở, hàm bấm) phải ổn định giữa các lần render khi không đổi (dùng `useCallback` / `useMemo`), để đổi outbox không vẽ lại cả tuần.

## 5. Test và kiểm tra

### 5.1 Unit test (`lib/rules/history.test.ts` hoặc file test rules tương ứng)

- Bản ghi lúc 05:59, 06:00, 11:59, 12:00, 17:59, 18:00, 23:59 giờ VN rơi đúng buổi.
- Ngày cũ có đủ 4 buổi theo thứ tự Tối, Chiều, Sáng, Đêm; buổi không bản ghi và không phút ngủ có `kind: "empty"`.
- Hôm nay lúc 10:00 chỉ có Sáng, Đêm; lúc 12:00 đúng có thêm Chiều.
- Hôm nay lúc 11:59:40 có bản ghi bắt đầu 12:00:20 → Chiều có trong danh sách, `kind: "logs"`.
- Lọc "Bú": chỉ còn buổi có bản ghi bú; buổi `"sleepOnly"` và `"empty"` bị bỏ.
- Giấc 21:00 hôm trước tới 06:30: Đêm là `"sleepOnly"`, tóm tắt "ngủ 6g"; tổng phút ngủ các buổi bằng phút ngủ của `daySummary`.
- Tóm tắt: "3 cữ · 2 tã · ngủ 2g 10p"; bỏ phần bằng 0; chỉ có thuốc → "1 mục"; bú 11:55 + 12:05 là một cữ ở Sáng; giấc 23:00 hôm trước tới 05:00 cho Đêm "ngủ 5g"; giấc đang chạy tính tới `now`.
- Triệu chứng nằm trong `symptoms`, không đổi `kind` của buổi, không vào tóm tắt.
- Chiều chỉ có dòng bú phải 12:05 (bú trái 11:55 ở Sáng) → Chiều "1 mục", Sáng có cữ đó.
- `defaultOpen`: buổi muộn nhất có bản ghi của hôm nay; hôm nay lúc 12:05 mà Chiều chưa có bản ghi → Sáng; hôm nay chưa có bản ghi → không buổi nào; ngày cũ → không buổi nào.
- `firstScreen` mới: không quá 12 dòng bản ghi, không đếm hàng tiêu đề.

### 5.2 Component test (`components/history/historylist.test.tsx`, `historyscreen.test.tsx`)

- Lọc "Tất cả": chỉ buổi mặc định có dòng bản ghi; các buổi `"logs"` khác có hàng tiêu đề với `aria-expanded="false"` và tóm tắt.
- Bấm hàng tiêu đề buổi gập → dòng bản ghi hiện, `aria-expanded="true"`; bấm lại → mất.
- Buổi `"empty"` hiện "Không có bản ghi", không có nút. Buổi `"sleepOnly"` hiện tóm tắt ngủ, không có nút.
- Buổi mở: nút có `aria-controls` bằng `id` của `<ul>` lồng; buổi gập: không có `aria-controls`, không có `<ul>` lồng.
- Đổi lọc sang "Bú" → mọi buổi còn lại đều mở; đổi về "Tất cả" → về mặc định, lựa chọn riêng bị xóa.
- Buổi gập chứa bản ghi đang chờ đồng bộ → hàng tiêu đề có "Chờ đồng bộ"; mở ra thì dấu nằm ở dòng bản ghi, không ở hàng tiêu đề.
- Dòng triệu chứng nằm trên các buổi và bấm vẫn mở sheet của ngày.

### 5.3 Kiểm trên trình duyệt

Ở 375 × 812 và 390 px, theme Hồng dịu (`rose`) và Oải hương (`lavender`), trên trang fixture tạm (không commit) và trang `/nhat-ky` thật (chỉ xem, không bấm Lưu):

- Hàng tiêu đề buổi không xuống dòng nhãn; tóm tắt dài nhất ("10 cữ · 12 tã · ngủ 11g 55p") vừa hoặc cắt gọn đúng §4.2.
- Bấm gập/mở mượt, không nhảy cuộn trang.
- Dòng mờ, hàng `"sleepOnly"` và nền `bg-line` của hàng tiêu đề buổi đọc được, tách được với dòng bản ghi ở cả hai theme đó và ở theme Tối (`dark`), Ban đêm (`data-theme="night"`). Đo tương phản chữ tóm tắt 13 px `text-muted` trên nền `bg-line` ở theme Ban đêm: phải ≥ 4.5:1.
- Thêm vào `docs/device-checklist.md` một bước mới, Bước 40, liệt kê các mục người dùng tự kiểm trên iPhone.
