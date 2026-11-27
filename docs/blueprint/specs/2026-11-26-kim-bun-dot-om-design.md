# Kim Bun — Đợt ốm

**Status:** approved 2026-11-26
**Ngày:** 2026-11-26
**Unit:** `web` (PWA Next.js trên Vercel, kèm migration Supabase của chính nó). Một unit. Có 3 migration.
**Liên quan:** spec gốc `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (gọi tắt "spec gốc"), spec UI `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md` (gọi tắt "spec UI"), spec `docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md` (gọi tắt "spec 17/11"), spec `docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-popup-design.md` (gọi tắt "spec triệu chứng"), spec `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (gọi tắt "spec 25/11"). Code nền: `main` tại commit `cf52200`. Bản vẽ Claude Design: https://claude.ai/artifact/6ov2jQFZo64Fxxb75fKAc4.

Bản vẽ chỉ để xem hình; số liệu trên bản vẽ là số bịa. Chỗ nào bản vẽ khác spec này thì spec này đúng. Các chỗ khác đã biết ghi ở §11.

## 1. Mục tiêu

Khi bé ốm, nhiệt độ, thuốc và triệu chứng đang nằm rải trong Nhật ký. Bố mẹ không thấy được cả đợt, và không có gì gọn để đưa bác sĩ xem.

1. **Bản ghi Triệu chứng.** Một loại bản ghi mới, bấm chip, có giờ.
2. **Đợt ốm.** Một khoảng thời gian có bắt đầu và kết thúc. Mọi bản ghi rơi vào khoảng đó thuộc về đợt ốm. Trang của đợt ốm cho biết bé còn sốt không, biểu đồ sốt kèm liều hạ sốt, từng ngày, bú-tã-ngủ so với thường ngày, các lần khám.
3. **Tab Hôm nay.** Khi có đợt đang mở: một thẻ có ba nút ghi nhanh. App mời bắt đầu khi bé sốt và nhắc đóng khi bé hết sốt.
4. **Báo cáo cho bác sĩ.** Trang Báo cáo có thêm kỳ "Đợt ốm".
5. **Lần khám.** Ngày giờ, nơi khám, kết luận, lời dặn, ảnh đơn thuốc.

Quyết định của người dùng ngày 2026-11-26:

- Bắt đầu và kết thúc: app gợi ý, bố mẹ bấm. Mở bằng tay được khi bé ốm không sốt.
- Triệu chứng: bản ghi có giờ, dùng chung danh sách với trang Phân loại triệu chứng.
- Trang đợt ốm có đủ bốn phần: biểu đồ sốt kèm mốc thuốc, triệu chứng theo ngày, bú-tã-ngủ so với thường ngày, lần khám.
- Bản in: thêm kỳ "Đợt ốm" vào trang Báo cáo có sẵn, không làm trang in riêng.
- Lần khám có ảnh đơn thuốc; không có hẹn tái khám.
- Không thêm thông báo đẩy nào.
- Bản vẽ: trang đợt ốm theo bảng "Đợt ốm · A", tab Hôm nay theo bảng "Hôm nay · C", phiếu triệu chứng theo bảng "Triệu chứng · E".

Ngoài phạm vi: thông báo đẩy mới; hẹn tái khám; sổ khám ngoài đợt ốm; lưu kết quả của trang Phân loại triệu chứng; chẩn đoán hay gợi ý bệnh từ đợt ốm; câu khuyên y tế mới; đổi ngưỡng của các banner sốt (`lib/rules/alerts.ts`); đổi luật đánh giá 24 giờ; ảnh thu nhỏ; token màu mới; icon mới; dependency mới.

## 2. Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu, không thêm icon. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`; mã hex trong bản vẽ không được chép vào component.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`. Theme `night` chỉ có một tông màu: không trạng thái nào được phân biệt chỉ bằng màu, phải khác cả chữ, icon hoặc hình dạng.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (hotfix 7822c90).
- Mọi ngày giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString`, `vnDayStartMs`, `formatDayShort` có sẵn.
- Ngưỡng sốt là 38,0°C, dùng `hasFever` (`lib/rules/triage.ts`). Số thập phân viết dấu phẩy, tối đa 1 chữ số lẻ.
- Chữ về sức khỏe: chỉ dùng đúng các câu ghi trong spec này. App không chẩn đoán, không nêu liều thuốc. "Kết luận" của lần khám là chữ bố mẹ gõ lại lời bác sĩ, luôn hiện kèm nhãn nói rõ điều đó.
- Đợt ốm không được che, đổi chữ hay hạ mức bất kỳ banner nào của `homeAlerts`.
- Bản ghi (`logs`) vẫn ghi qua outbox như hiện tại. Bảng `logs` chỉ đổi ràng buộc `logs_type_check`; không thêm cột.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề thẻ kết luận, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), lời dặn của lần khám, hàng chip.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay đóng đợt ốm, không tải ảnh. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Áp migration lên Supabase thật: plan dừng lại, đưa lệnh `bunx supabase db push --linked` cho người dùng tự chạy. Code cần một migration không được đẩy lên `main` trước khi migration đó đã áp.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 1659 test vitest (184 file), pgTAP 001–015, `bun run typecheck`, `bun run build`.

## 3. Bản ghi Triệu chứng

Làm theo cách spec 17/11 §3 đã thêm bốn loại bản ghi.

### 3.1 Dữ liệu

Migration `supabase/migrations/20261126000100_symptom_log.sql`: chỉ nới `logs_type_check`, thêm `'symptom'` vào cuối danh sách 12 loại đang có.

`lib/rules/logDetails.ts`: `LOG_TYPES` thêm `"symptom"` ở cuối. Schema:

```ts
const symptom = z
  .object({
    codes: z
      .array(z.string().regex(/^[a-z0-9_]{1,40}$/))
      .min(1)
      .max(30),
    note: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine((d) => new Set(d.codes).size === d.codes.length);
```

Ghi chú trống thì bỏ khóa `note`, không lưu `""`. Schema không kiểm mã có trong nội dung hay không: mã lạ (nội dung đổi sau này) được bỏ qua khi hiển thị; bản ghi chỉ còn toàn mã lạ thì hiện "Triệu chứng" không kèm tên.

### 3.2 Nội dung

`content/triage.vi.json`, mỗi phần tử của `symptoms` thêm `short` (bắt buộc, 1–16 ký tự) và `common` (boolean, tùy chọn). `TriageSymptomSchema` (`lib/content/triage.ts`) thêm hai trường này. Trang Phân loại triệu chứng không đổi, vẫn dùng `text`.

| `code`             | `short`          | `common` |
| ------------------ | ---------------- | -------- |
| `fever`            | Sốt              | có       |
| `runny_nose`       | Sổ mũi           | có       |
| `cough`            | Ho               | có       |
| `barking_cough`    | Ho ông ổng       |          |
| `wheeze`           | Khò khè          | có       |
| `spit_up`          | Trớ sữa          | có       |
| `vomit`            | Nôn              | có       |
| `diarrhoea`        | Tiêu chảy        | có       |
| `hard_stool`       | Phân cứng        |          |
| `gassy`            | Đầy hơi          |          |
| `diaper_rash`      | Đỏ vùng tã       |          |
| `dry_red_skin`     | Da khô đỏ        |          |
| `heat_rash`        | Nốt đỏ li ti     |          |
| `rash_after_fever` | Ban sau sốt      |          |
| `hand_foot_spots`  | Nốt ở tay chân   |          |
| `yellow_skin`      | Vàng da          |          |
| `white_mouth`      | Mảng trắng miệng |          |
| `mouth_sores`      | Loét miệng       |          |
| `ear_rub`          | Dụi tai          |          |
| `sticky_eye`       | Mắt đỏ, ghèn     |          |
| `drooling`         | Chảy dãi         |          |
| `long_crying`      | Khóc nhiều       |          |
| `fussy`            | Quấy             | có       |

Một unit test khẳng định: đủ 23 mã có `short`, không `short` nào trùng nhau, đúng 8 mã `common`.

### 3.3 Hiển thị

- `lib/ui/categories.ts`: `symptom: { token: "cat-med", icon: "pulse", label: "Triệu chứng" }`.
- `describeLog`: `Triệu chứng: {các short, nối bằng ", ", theo thứ tự của nội dung}`; có ghi chú thì thêm ` · {note}`.
- `FILTER_TYPES.temperature` (`lib/rules/history.ts`) thành `["temperature", "symptom"]`; nhãn "Nhiệt độ" của bộ lọc giữ nguyên.
- `QUICK_ACTIONS`: thêm `{ key: "symptom", label: "Triệu chứng", kind: "instant", group: "other", category: "symptom", instant: "symptom" }` ngay trước `solids`, tức đứng đầu nhóm "Khác". `InstantType` thêm `"symptom"`. Lưới ghi nhanh và hàng timer trên tab Hôm nay không đổi; "Triệu chứng" mở được từ nút "Khác" của Hôm nay và từ phiếu "+".
- Nhãn của các ô 84 px trong phiếu "+" (nhóm "Khác" và "Ghi nhanh") là chữ 11/16 đậm 600, một dòng; trước đó là 12/16. Lý do: ở 375 px nhãn "Triệu chứng" cỡ 12 px rộng 70,1 px trong ô 73,3 px, chỉ hở 1,6 px mỗi bên; ở 11 px nó rộng 65 px, hở 4,1 px. Nhãn của hàng "Bấm giờ" giữ 12/16. (Người dùng chọn ngày 2026-11-26, sau bước kiểm trình duyệt của M1b.)
- `isFeed`, `dailyStats`, ô thống kê 24 giờ, realtime: không đổi.

### 3.4 Giá trị của phiếu

`QuickValues` chỉ chứa chuỗi và boolean, nên:

- Khóa `codes`: các mã nối bằng `","`, theo thứ tự của nội dung; chuỗi rỗng là chưa chọn. Khóa `note`: chuỗi.
- `QuickField.kind` thêm giá trị `"symptoms"`. `QUICK_FIELDS.symptom` = `[{ key: "codes", label: "Triệu chứng", kind: "symptoms" }, { key: "note", label: "Ghi chú (không bắt buộc)", kind: "textarea", maxLength: 200 }]`.
- `DEFAULTS.symptom` = `{ codes: "", note: "" }`. `MESSAGES.symptom` = `"Chọn ít nhất một triệu chứng"`.
- `MANUAL_TYPES` (`lib/rules/logForm.ts`) thêm `{ value: "symptom", label: "Triệu chứng" }` ngay sau `temperature`.
- `hasNoteField("symptom")` trả `false`: ghi chú của bản ghi triệu chứng là `details.note`, cột `logs.note` không dùng cho loại này.

### 3.5 Phiếu nhập (bảng "Triệu chứng · E")

Một component chọn chip `components/quick/SymptomPicker.tsx` dùng ở hai nơi: `components/quick/SymptomFields.tsx` trong `QuickEntrySheet` (thêm mới), và `FieldList` khi gặp `kind: "symptoms"` trong `LogEditSheet` (sửa, và thêm tay từ Nhật ký). `LogEditSheet` chuyền ngày tuổi của bé xuống `FieldList` cho việc lọc tuổi.

- Tiêu đề "Triệu chứng". Dòng phụ: "Bấm những gì bé đang có." Khi đã chọn ít nhất một: thêm " Đã chọn {n}."
- Nhãn "Hay gặp", rồi các chip `common` qua `visibleSymptoms(symptoms, ageDays)`, theo thứ tự của nội dung. Chip là nút bật tắt (`aria-pressed`), cao ≥ 44 px, chữ là `short`.
- Nút "Xem tất cả {n} triệu chứng" ({n} = số triệu chứng còn lại sau lọc tuổi cộng số `common`). Bấm thì mở ngay tại chỗ các chip còn lại, chia theo `groups` của nội dung, nhãn nhóm là `name`; nút đổi thành "Thu gọn". Chip đã chọn mà không `common` thì luôn hiện, kể cả khi thu gọn.
- Chip "Sốt" là chip thường, không khóa theo nhiệt độ.
- Ô "Ghi chú (không bắt buộc)", tối đa 200 ký tự, ngay dưới các chip triệu chứng.
- Giờ: `TimeChips` có sẵn, không đổi, ở cuối như mọi loại bản ghi trong `QuickEntrySheet`.
- Nút "Lưu" tắt khi chưa chọn chip nào. Lưu xong có toast Hoàn tác như mọi bản ghi tức thời.
- Trong `LogEditSheet`: cùng các chip và ô ghi chú đó, giờ và nút theo cách sheet ấy đang làm cho mọi loại; không có tiêu đề và dòng phụ riêng. Mã đã lưu mà nội dung không còn thì giữ nguyên trong `codes` khi lưu lại, không hiện thành chip. Mã đã lưu còn trong nội dung nhưng nay ngoài tuổi của bé thì vẫn hiện thành chip đang chọn và bỏ chọn được.

## 4. Đợt ốm: dữ liệu

### 4.1 Migration `supabase/migrations/20261126000200_illness_episodes.sql`

```sql
create extension if not exists btree_gist with schema extensions;

create table public.illness_episodes (
  id uuid primary key,
  baby_id uuid not null references public.babies (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at),
  unique (id, baby_id)
);
```

- Ràng buộc `illness_episodes_no_overlap`: `exclude using gist (baby_id with =, tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&)`. Nó cũng bảo đảm mỗi bé chỉ có một đợt đang mở. Nếu trên Supabase local ràng buộc này không tạo được, plan dừng và hỏi; không tự đổi sang cách khác.
- Trigger `set_updated_at` và `forbid_immutable_change('id', 'baby_id', 'created_by')` như bảng `growth`.
- RLS: `select`, `insert`, `update` cho mọi thành viên gia đình của bé (`is_member(baby_family(baby_id))`; `insert` thêm `created_by = auth.uid()`). `delete`: chủ gia đình hoặc người tạo. Khác `logs` ở `update`: bố mở đợt ốm thì mẹ vẫn bấm "Bé đã khỏi" được.
- `id` do client tạo (`crypto.randomUUID()`).
- Không thêm vào realtime.

### 4.2 Lớp dữ liệu

- `lib/supabase/types.ts` tạo lại bằng `bun run db:types`; `lib/supabase/rows.ts` thêm `EpisodeRow`.
- Outbox: `OutboxEntry["table"]` thêm `"illness_episodes"`, các thao tác `insert`, `update`, `delete` theo `rowId`. Thêm `enqueueEpisodeChange`, `withPendingEpisodes`, `episodesKey(babyId)` theo mẫu của `growth`.
- `DROP_CODES` thêm `"23P01": "Trùng thời gian với một đợt ốm khác"`.
- `lib/data/illness.ts`: `useEpisodes(babyId)` đọc mọi đợt của bé, xếp `started_at` giảm dần, `staleTime` 60 giây, `refetchInterval` 60 giây; `useEpisodeActions(babyId, userId)` có `start`, `update`, `remove`.
- Sau mỗi lần outbox gửi xong mà có ít nhất một thay đổi được gửi đi hoặc bị bỏ, danh sách đợt ốm được tải lại cùng `logs`, `growth` và các danh sách khác: khóa `["illness-episodes"]` nằm trong hằng `REFRESH_AFTER_FLUSH` (`lib/data/outbox.ts`) mà `OutboxSync` làm mới. Nhờ vậy một đợt bị server từ chối (trùng thời gian) biến khỏi màn hình ngay, không chờ lần tải lại sau 60 giây. (Khác bản đã duyệt ngày 2026-11-26, vốn không nhắc tới chỗ này. Thêm ở M2a ngày 2026-11-27 theo lời duyệt trước của người dùng; ghi vào spec ở M2f.)
- Bản ghi của một khoảng: thêm vào `lib/data/logs.ts` hàm `fetchLogsBetween(babyId, from, to)` và hook `useRangeLogs(babyId, from, to)`, khóa `[...logsKey(babyId), "range", from, to ?? "open"]`. Lọc `started_at >= from`, và `started_at < to` khi `to` khác `null`; xếp `started_at` tăng dần rồi `id`; đọc từng trang 1000 hàng cho tới khi một trang về thiếu (như `usePhotos`), vì server trả tối đa 1000 hàng mỗi lần. Phủ thay đổi đang chờ bằng `withPending` với cùng điều kiện khoảng. Mọi chỗ trong spec này cần bản ghi của đợt ốm đều dùng hook này, không dùng `useStatsLogs`.
- Thứ tự tăng dần ở trên chỉ để việc đọc từng trang ổn định. Lớp phủ đang chờ và ghi lạc quan (`applyLogChange`) xếp lại mảng theo chiều giảm dần, nên dữ liệu của hook không có thứ tự bảo đảm: mọi hàm trong `lib/rules/illness.ts` tự tìm "mới nhất", "cuối cùng", "sớm nhất" theo `started_at`, không dựa vào vị trí trong mảng.
- `useRangeLogs` nhận thêm `enabled`: Hôm nay khi không có đợt mở và Báo cáo ở kỳ 7, 14 ngày không tải gì.

### 4.3 Bản ghi thuộc về đợt ốm

Một bản ghi thuộc đợt ốm khi `started_at` của nó ≥ `started_at` của đợt và ≤ `ended_at` của đợt (đợt đang mở: ≤ lúc này). Không có khóa ngoại nào từ `logs` sang đợt ốm. Sửa giờ của đợt là đổi luôn tập bản ghi của nó.

Với đợt đang mở, "≤ lúc này" được nới thêm 2 phút (`OPEN_SLACK_MS` trong `lib/rules/illness.ts`): bản ghi thuộc đợt khi `started_at` của nó ≤ lúc này cộng 2 phút. Đồng hồ của màn hình (`useNow`) chỉ nhích mỗi phút, nên một lần đo vừa lưu mang giờ mới hơn đồng hồ đó; so sát chữ thì thẻ không đổi cho tới phút sau. App cũng cho một bản ghi mang giờ đi trước giờ thật tối đa 1 phút. Không bản ghi nào mang giờ xa hơn thế, nên nới 2 phút không nhận nhầm bản ghi nào. Đợt đã đóng vẫn dừng đúng ở `ended_at`. (Khác bản đã duyệt ngày 2026-11-26, vốn ghi "≤ lúc này" không nới. Đổi ở M2b ngày 2026-11-27 theo lời duyệt trước của người dùng; ghi vào spec ở M2f.)

## 5. Đợt ốm: luật

Tất cả là hàm thuần trong `lib/rules/illness.ts`.

### 5.1 Ngày của đợt

- Ngày thứ `n` = số ngày lịch Việt Nam từ ngày của `started_at` tới ngày đang xét, cộng 1.
- Số ngày của một đợt đã đóng = ngày thứ của `ended_at`.

### 5.2 Trạng thái sốt

"Lần đo" là bản ghi `temperature` hợp lệ theo schema, thuộc đợt ốm.

| `kind`       | Điều kiện                                                     | Tiêu đề thẻ kết luận      | Tông                                | Icon     |
| ------------ | ------------------------------------------------------------- | ------------------------- | ----------------------------------- | -------- |
| `unmeasured` | không có lần đo nào                                           | Chưa đo nhiệt độ          | trung tính                          | `thermo` |
| `fever`      | lần đo mới nhất ≥ 38,0 và cách lúc này ≤ 6 giờ                | {tên} đang sốt {x}°C      | `danger` khi ≥ 39,0; còn lại `warn` | `thermo` |
| `stale`      | lần đo mới nhất ≥ 38,0 và cách lúc này > 6 giờ                | Chưa đo lại sau {x}°C     | `warn`                              | `clock`  |
| `cleared`    | lần đo mới nhất < 38,0 và trong đợt có lần đo ≥ 38,0 trước đó | {tên} đã hết sốt {khoảng} | `good`                              | `check`  |
| `none`       | mọi lần đo < 38,0                                             | {tên} không sốt           | `good`                              | `check`  |

- {x} và mọi nhiệt độ khác trên các màn Đợt ốm (thẻ kết luận, danh sách từng ngày, nhãn giá trị và `aria-label` của biểu đồ) viết bằng `formatCelsius` (`lib/rules/illness.ts`): dấu phẩy, tối đa 1 chữ số lẻ, không thêm số 0 ở cuối, như trang Báo cáo. 38,0 viết "38"; 38,6 viết "38,6". (Khác bản đã duyệt ngày 2026-11-26, vốn chỉ ghi "tối đa 1 chữ số lẻ" ở mục 2 và không nói số tròn viết thế nào. Code làm vậy từ M2b ngày 2026-11-27; ghi vào spec ở M2f.)
- {khoảng} tính từ lần đo ≥ 38,0 cuối cùng tới lúc này: dưới 1 giờ là "chưa đầy 1 giờ"; từ 1 tới dưới 48 giờ là "{h} giờ" (làm tròn xuống); từ 48 giờ là "{d} ngày" (làm tròn xuống).
- Đợt đã đóng: tiêu đề luôn là "Đã khỏi sau {n} ngày", tông `good`, icon `check`.
- 6 giờ là cùng cửa sổ với banner sốt của `temperatureAlert`.
- Ngoại lệ của `none` và `cleared`: lần đo mới nhất dưới 35,5 thì tông trung tính, icon `thermo` (banner thân nhiệt thấp đang hiện ở Hôm nay); tiêu đề giữ nguyên.

### 5.3 Nhãn của từng ngày

Theo lần đo cao nhất trong ngày: ≥ 39,0 là "Sốt cao" (`danger`); 38,0–38,9 là "Sốt" (`warn`); dưới 38,0 là "Hết sốt" nếu một ngày trước đó của đợt có lần đo ≥ 38,0, không thì "Không sốt" (cả hai `good`). Ngày không có lần đo: không có nhãn.

### 5.4 So với thường ngày

Dùng `dailyStats` có sẵn.

- Ngày so sánh `D`: đợt đang mở thì là hôm qua; đợt đã đóng thì là ngày trước ngày của `ended_at`. `D` trước ngày bắt đầu thì không so, thẻ ghi "Chưa có ngày trọn nào của đợt ốm để so."
- Nền: 7 ngày lịch ngay trước ngày bắt đầu. Chỉ tính ngày có ít nhất một bản ghi `breast`, `bottle`, `sleep` hoặc `diaper`. Dưới 3 ngày như vậy thì thẻ ghi "Chưa đủ dữ liệu trước khi ốm để so."
- Ba hàng: Bú (`feeds`), Tã ướt (`wetDiapers`), Ngủ (`sleepMinutes`). Tỷ lệ = giá trị ngày `D` chia trung bình nền. Trung bình nền bằng 0 thì ẩn hàng đó.
- Bú và Tã ướt: tỷ lệ ≤ 0,75 là "Ít hơn" (`warn`), còn lại "Như thường" (`good`).
- Ngủ: ≤ 0,75 là "Ít hơn" (`warn`); ≥ 1,25 là "Nhiều hơn" (trung tính); còn lại "Như thường" (`good`).
- Dòng số: "{giá trị} cữ · thường {nền} cữ", "{giá trị} lần · thường {nền} lần", "{giá trị} giờ · thường {nền} giờ". Nền làm tròn tới số nguyên gần nhất; giờ ngủ làm tròn tới giờ gần nhất.
- Thẻ không có câu khuyên nào.
- Ngày `D` được là chính ngày bắt đầu, và khi đó vẫn tính trọn ngày lịch như bảng "Theo ngày" của Báo cáo, kể cả phần trước `started_at`. Một ngày nền được tính khi có ít nhất một bản ghi `breast`, `bottle`, `sleep` hoặc `diaper` bắt đầu trong ngày đó. Cả ba hàng đều ẩn (trung bình nền bằng 0) thì thẻ ghi "Chưa đủ dữ liệu trước khi ốm để so.". Khi thẻ chỉ có một câu ("Chưa có ngày trọn …" hay "Chưa đủ dữ liệu …"), thẻ không có dòng phụ của §6.3 mục 5; đường dẫn "Phân loại triệu chứng" vẫn ở cuối thẻ. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bốn chỗ này. Chọn ở M4a ngày 2026-11-27 theo lời duyệt trước của người dùng.)

### 5.5 Lời mời bắt đầu

Hiện khi đủ cả bốn: bé không có đợt đang mở; `homeAlerts` đang có alert `fever`, `fever-infant` hoặc `fever-high`; lần đo mới nhất trong 6 giờ qua (lần đo sinh ra alert đó) nằm sau `ended_at` muộn nhất trong các đợt của bé; trên máy này lời mời chưa bị từ chối trong 24 giờ qua. Điều kiện thứ ba để vừa bấm "Bé đã khỏi" thì lời mời không hiện lại ngay.

- "Bắt đầu đợt ốm": tạo đợt với `started_at` = giờ của lần đo ≥ 38,0 sớm nhất trong 48 giờ qua (lấy từ `useRecentLogs`), chỉ xét các lần đo sau `ended_at` muộn nhất trong các đợt của bé. Không còn lần đo nào như vậy thì `started_at` = lúc này.
- "Không": ghi giờ từ chối vào `localStorage` khóa `kb.illness.inviteDismissedAt.{babyId}`; lời mời ẩn 24 giờ trên máy đó.

### 5.6 Nhắc đóng

Chỉ khi có đợt đang mở. Ba trường hợp, mỗi trường hợp một mốc cuối và một tiêu đề (§7.3):

| Trường hợp  | Điều kiện theo §5.2      | Mốc cuối                                                                                                |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `no-fever`  | `cleared`                | giờ của lần đo ≥ 38,0 cuối cùng                                                                         |
| `unchecked` | `fever` hoặc `stale`     | giờ của lần đo mới nhất                                                                                 |
| `quiet`     | `none` hoặc `unmeasured` | giờ muộn nhất trong ba thứ: `started_at`, bản ghi `symptom` cuối, liều `medicine` có `antipyretic` cuối |

Nhắc khi lúc này − mốc cuối ≥ 48 giờ và trên máy này lời nhắc chưa bị hoãn trong 24 giờ qua (`localStorage` khóa `kb.illness.closeSnoozedAt.{episodeId}`). Lời nhắc không bao giờ nói bé hết sốt khi lần đo mới nhất còn ≥ 38,0.

### 5.7 Kiểm khi lưu

- `started_at` không được sau lúc này quá 1 phút: "Giờ bắt đầu ở tương lai."
- `ended_at` phải sau `started_at`: "Giờ kết thúc phải sau giờ bắt đầu."
- `ended_at` không được sau lúc này quá 1 phút: "Giờ kết thúc ở tương lai."
- Khoảng `[started_at, ended_at)` (đợt đang mở: tới vô cùng) không được giao với khoảng của đợt khác của bé (so với `useEpisodes`): "Trùng thời gian với một đợt ốm khác." Đợt này bắt đầu đúng lúc đợt kia kết thúc là hợp lệ, giống ràng buộc ở server.
- Trong sheet (§6.4) câu lỗi hiện dưới ô liên quan. Với thao tác một chạm (lời mời, nút "Bắt đầu đợt ốm", "Mở lại đợt ốm", "Bé đã khỏi") câu lỗi hiện bằng `Toast` và không có thay đổi nào được xếp vào outbox. Riêng "Mở lại đợt ốm" được bấm trong sheet §6.4: bị từ chối thì câu lỗi hiện ngay trong sheet, ở dòng báo phía trên các nút, không bằng `Toast`. (Khác bản đã duyệt ngày 2026-11-26, vốn ghi câu lỗi của "Mở lại đợt ốm" cũng hiện bằng `Toast`. Đổi ở M2e ngày 2026-11-27 theo lời duyệt trước của người dùng: `Toast` nằm ngoài hộp thoại của sheet đang mở và dưới lớp nền mờ của nó, nên không đọc được.)
- Server vẫn là nơi quyết định; outbox bỏ thay đổi bị từ chối với câu ở §4.2.

## 6. Đợt ốm: màn hình

### 6.1 Đường dẫn

- `/dot-om`: danh sách. `/dot-om/chi-tiet?id={uuid}`: một đợt. Mã đợt nằm ở tham số để cả hai là trang tĩnh, lưu ngoại tuyến được.
- `sw/sw.template.js`: `PAGES` thêm `"/dot-om"` và `"/dot-om/chi-tiet"`.
- `lib/nav.ts`: `HEALTH_SICK` thêm ở đầu `{ label: "Đợt ốm", href: "/dot-om", icon: "calendar", color: "cat-temp", detail: "Gom sốt, thuốc, triệu chứng theo từng đợt" }`. Tab `health` sáng ở cả hai đường dẫn.
- Nút quay lại: danh sách về `/suc-khoe` ("Sức khỏe"); chi tiết về `/dot-om` ("Đợt ốm").

### 6.2 Danh sách (bảng "Danh sách đợt ốm")

- Mục "Đang diễn ra": có đợt mở thì là một thẻ dẫn tới trang chi tiết, tiêu đề "Từ {dd/mm} · ngày thứ {n}", dưới tiêu đề là chip theo §5.2 (`fever`: "Đang sốt"; `stale`: "Chưa đo lại"; `cleared`: "Hết sốt"; `none`: "Không sốt"; `unmeasured`: không chip), bên phải thẻ luôn có mũi tên. (Khác bản đã duyệt ngày 2026-11-26, vốn ghi chip ở bên phải tiêu đề. Đổi ở M2f ngày 2026-11-27 theo lời duyệt trước của người dùng: ở 375 px thẻ còn 247 px cho tiêu đề và chip, tiêu đề rộng 160–169 px và chip rộng 66–91 px, nên đặt cạnh nhau thì tiêu đề bị đẩy xuống hai dòng; đặt chip dưới tiêu đề thì mọi trạng thái đều một dòng.) Không có đợt mở thì là nút "Bắt đầu đợt ốm": tạo đợt với `started_at` = lúc này rồi mở trang chi tiết. Lần bấm thứ hai trong lúc lần đầu còn đang được xếp vào hàng chờ bị bỏ qua, để không tạo hai đợt. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói gì về lần bấm thứ hai. Làm ở M2f ngày 2026-11-27 theo lời duyệt trước của người dùng; ghi vào spec ở M2g.)
- Mục "Đã qua": mỗi đợt một hàng, mới nhất trước, "{dd/mm} – {dd/mm} · {n} ngày". Ngày thuộc năm khác năm hiện tại viết `dd/mm/yyyy`. Không có đợt nào đã đóng thì ẩn mục.
- Chưa có đợt nào: `EmptyState` "Chưa có đợt ốm nào" với dòng "Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ." và nút "Bắt đầu đợt ốm" (cùng việc với nút ở mục "Đang diễn ra"); trang không có tiêu đề mục "Đang diễn ra" hay "Đã qua". Có đợt đã qua mà không có đợt mở thì mục "Đang diễn ra" chứa nút đó như ở trên. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói trạng thái trống có nút hay tiêu đề mục. Làm ở M2f ngày 2026-11-27 theo lời duyệt trước của người dùng; ghi vào spec ở M2g.)
- Thẻ đợt đang mở cần bản ghi của đợt: `useRangeLogs(babyId, started_at, null)`.
- Trang này và trang chi tiết (§6.3) theo realtime của bản ghi (`useLogsRealtime`): máy khác ghi một lần đo thì chip của thẻ "Đang diễn ra" và thẻ kết luận đổi theo, không chờ lần tải lại. Bảng đợt ốm vẫn không nằm trong realtime (§4.1): máy khác thấy một đợt mới, đã đóng hay đã xóa nhờ lần tải lại mỗi 60 giây. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói hai trang có theo realtime hay không. Làm ở M2f ngày 2026-11-27 theo lời duyệt trước của người dùng; ghi vào spec ở M2g.)

### 6.3 Trang chi tiết (bảng "Đợt ốm · A")

Bản ghi tải bằng `useRangeLogs` với `from` = đầu ngày thứ 8 trước ngày bắt đầu (7 ngày nền của §5.4, thêm 1 ngày để giấc ngủ bắt đầu từ tối hôm trước vẫn được tính, như `statsFetchSince`), `to` = đầu ngày sau ngày của `ended_at` (đợt đang mở: `null`). Thứ tự các khối:

1. **Đầu trang.** Tiêu đề "Đợt ốm", nút quay lại, nút bút chì "Sửa đợt ốm" (§6.4).
2. **Thẻ kết luận.**
   - Icon tròn, tiêu đề và tông theo §5.2. Tiêu đề dài hơn một dòng thì chia đều thành hai dòng (`text-wrap: balance`), để không chữ nào đứng một mình ở dòng dưới: ở 375 px "{tên} đã hết sốt chưa đầy 1 giờ" thành "{tên} đã hết sốt" / "chưa đầy 1 giờ". (Thêm ở M2d ngày 2026-11-27, sau bước kiểm trình duyệt.)
   - Dòng phụ, đợt đang mở: "Ngày thứ {n} · bắt đầu {dd/mm} lúc {HH:mm}". Đợt đã đóng: "{dd/mm} – {dd/mm}".
   - Ba hàng, mỗi hàng nhãn bên trái, giờ chữ nhỏ, giá trị đậm bên phải:
     - "Đo gần nhất": giờ và "{x}°C". Chưa đo: giá trị "Chưa đo", không có giờ.
     - "Sốt cao nhất": giờ và "{x}°C" của lần đo cao nhất khi nó ≥ 38,0. Đã đo mà chưa lần nào ≥ 38,0: giá trị "Không sốt", không có giờ. Đợt chưa có lần đo nào: giá trị "Chưa đo", không có giờ. (Khác bản đã duyệt ngày 2026-11-26, vốn ghi "Không thì giá trị 'Không sốt'", tức đợt chưa đo cũng ghi "Không sốt". Đổi ở M2d ngày 2026-11-27 theo lời duyệt trước của người dùng: app không khẳng định "Không sốt" khi chưa ai đo.)
     - "Thuốc hạ sốt": "gần nhất {giờ}" và "{n} liều" (bản ghi `medicine` có `antipyretic`). Không có: giá trị "Chưa dùng".
   - Giờ viết "{HH:mm} hôm nay" khi cùng ngày, không thì "{dd/mm} {HH:mm}".
   - Đợt đang mở: ba nút "Nhiệt độ", "Thuốc", "Triệu chứng", mỗi nút mở `QuickEntrySheet` của loại đó. Đợt đã đóng: không có ba nút.
3. **Thẻ biểu đồ** "Nhiệt độ và thuốc hạ sốt" (§6.5).
4. **Từng ngày.** Mỗi ngày một hàng, mới nhất trước. Tiêu đề "Hôm nay · ngày {n}" hoặc "{dd/mm} · ngày {n}". Dòng dưới: "Cao nhất {x}°C · {n} liều hạ sốt"; không có liều: "… · không dùng thuốc"; không có lần đo: "Chưa đo · …". Hàng chip triệu chứng: gộp mọi bản ghi `symptom` của ngày, mỗi mã một chip `short`, theo thứ tự của nội dung; không có thì không có hàng chip. Bên phải là nhãn §5.3. Hàng không bấm được.
5. **Thẻ "So với thường ngày"** (§5.4). Dòng phụ: "Hôm qua, so với trung bình 7 ngày trước khi ốm" (đợt đã đóng: "{dd/mm}, so với …"). Cuối thẻ là đường dẫn "Phân loại triệu chứng" tới `/trieu-chung`.
6. **Thẻ "Lần khám"** (§8).
7. **Nút.** "Báo cáo cho bác sĩ" dẫn tới `/bao-cao?dot={id}` (§9). Đợt đang mở thêm nút "Bé đã khỏi": đặt `ended_at` = lúc này, không hỏi lại, hiện toast "Đã đóng đợt ốm".

Mã không có trong `useEpisodes`: `EmptyState` "Không tìm thấy đợt ốm này" với đường dẫn "Về danh sách".

Trang theo realtime của bản ghi như danh sách (xem §6.2; khác bản đã duyệt ngày 2026-11-26).

### 6.4 Sheet "Sửa đợt ốm"

- Ô "Bắt đầu" (ngày giờ). Đợt đã đóng có thêm ô "Kết thúc".
- Lỗi theo §5.7 hiện dưới ô liên quan. Ô bị xóa trống: "Nhập giờ bắt đầu" hoặc "Nhập giờ kết thúc" dưới ô đó, là hai câu sẵn có của phiếu bản ghi. (Khác bản đã duyệt ngày 2026-11-26, vốn không có câu nào cho ô bị xóa trống. Thêm ở M2e ngày 2026-11-27 theo lời duyệt trước của người dùng.)
- Nút "Mở lại đợt ốm" (xóa `ended_at`) chỉ hiện khi đợt đã đóng, bé không có đợt nào đang mở, và đây là đợt có `started_at` muộn nhất của bé. Bị từ chối theo §5.7 thì câu lỗi hiện trong sheet, phía trên các nút (xem §5.7; khác bản đã duyệt ngày 2026-11-26).
- Nút "Xóa đợt ốm", chỉ hiện với chủ gia đình hoặc người tạo. Hỏi lại một lần: "Xóa đợt ốm này? Các bản ghi nhiệt độ, thuốc, triệu chứng vẫn giữ nguyên."
- Xóa xong, trang chuyển về `/dot-om` bằng `router.replace` (thay địa chỉ hiện tại, không thêm vào lịch sử), để nút quay lại của trình duyệt không dẫn về một đợt đã xóa. Giữa lúc đợt biến khỏi danh sách và lúc trang chuyển xong, dòng "Không tìm thấy đợt ốm này" có thể chớp lên một nhịp. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói xóa xong trang đi đâu. Làm ở M2f ngày 2026-11-27 theo lời duyệt trước của người dùng; ghi vào spec ở M2g.)
- Từ M5: đợt còn lần khám thì nút "Xóa đợt ốm" tắt, kèm dòng "Xóa các lần khám trước."; khi `useVisits` chưa có dữ liệu (mất mạng, chưa từng tải) nút cũng tắt, kèm dòng "Cần mạng để kiểm các lần khám."
- Nút "Lưu".

### 6.5 Biểu đồ sốt

Hàm thuần `feverChartModel` trong `lib/rules/illness.ts` trả về điểm, mốc, vạch chia; component chỉ vẽ.

- Trục ngang: từ đầu ngày bắt đầu tới cuối ngày cuối (đợt đang mở: cuối hôm nay). Đợt dài hơn 7 ngày chỉ vẽ 7 ngày cuối và ghi dưới biểu đồ "7 ngày gần nhất". Mỗi ngày một nhãn ở giữa ngày: "{dd/mm}", riêng hôm nay là "Hôm nay". Vạch dọc mảnh ở ranh giới ngày.
- Trục dọc: từ `min(36, ⌊thấp nhất⌋)` tới `max(40, ⌈cao nhất⌉)`, nhãn mỗi 1°C.
- Vùng từ 38,0 trở lên tô `danger` nhạt, có chữ "Sốt"; đường 38,0 nét đứt.
- Lần đo: chấm tròn nối bằng đường liền, màu `cat-temp`. Chấm mới nhất to hơn, có nhãn giá trị. Lần đo cao nhất ≥ 38,0 cũng có nhãn giá trị (trùng chấm mới nhất thì một nhãn).
- Liều hạ sốt: hình thoi màu `cat-med` trên một hàng riêng dưới vùng vẽ.
- Lần khám (từ M5): vạch dọc nét đứt có chữ "Khám" phía trên.
- Chú thích: "Nhiệt độ", "Liều hạ sốt", "Từ 38°C là sốt".
- Không có lần đo: thẻ chỉ ghi "Chưa có lần đo nào trong đợt này."
- `role="img"` với `aria-label` nêu số lần đo, giá trị cao nhất và số liều.

Ba chỗ dưới đây khác bản đã duyệt ngày 2026-11-26, vốn không nói chỗ đặt nhãn, chỗ của chữ "Sốt" và câu của `aria-label`. Chọn ở M2c ngày 2026-11-27 theo lời duyệt trước của người dùng (cách đặt nhãn của chấm mới nhất sửa sau bước kiểm trình duyệt của M2c); ghi vào spec ở M2f.

- Nhãn giá trị không kèm "°C" (đơn vị đã ghi ở trục) và có một viền màu nền thẻ, để đọc được khi đường nối chạy qua. Hai lần đo cao nhất bằng nhau: nhãn thuộc lần sau. Nhãn của chấm cao nhất luôn nằm trên chấm (khi chấm đó cũng là chấm mới nhất thì theo mục dưới). Chấm cách mép trái hoặc mép phải dưới 10% bề ngang thì nhãn neo đầu hoặc cuối chữ vào chấm, để không tràn khỏi vùng vẽ.
- Nhãn của chấm mới nhất lấy chỗ đầu tiên không che một chấm khác, không chạm nhãn của chấm cao nhất và không nằm trên đường 38,0, theo thứ tự: trên chấm; bên phải chấm (khi chấm chưa quá 85% bề ngang); dưới chấm (khi chấm cao hơn 20% bề cao); bên trái chấm (khi chấm đã quá 85% bề ngang). Không chỗ nào trống (mấy lần đo cuối chỉ cách nhau vài pixel) thì chọn theo ba bậc: bỏ mọi chỗ chạm nhãn của chấm cao nhất khi còn chỗ khác; trong số còn lại, bỏ mọi chỗ nằm trên đường 38,0 khi còn chỗ khác; rồi lấy chỗ che các chấm khác ít nhất.
- Đường 38,0 nằm trên hộp của nhãn khi nó chạy qua giữa đỉnh và chân của chữ (viền nền tính vào chữ). Ví dụ trên trục một ngày, lần đo mới nhất từ 37,2 tới 37,7 có nhãn bên phải chấm thay vì trên chấm; 38,1 ngay sau 38,6 có nhãn dưới chấm thay vì bên phải. Các chỗ trên, cạnh, dưới nằm ở ba độ cao không chồng lên nhau và luôn có ít nhất hai chỗ để chọn, nên đường 38,0 chạm nhiều nhất một chỗ và bậc thứ hai luôn chọn được. (Khác bản đã duyệt ngày 2026-11-26 và cách chọn ở M2c, vốn chỉ tránh chấm khác và nhãn kia. Đổi ở M2g ngày 2026-11-27 theo lời duyệt trước của người dùng: nhãn "37,6" nằm trên đường nét đứt thì một gạch của đường ló ra ngay sau con số, nhìn thoáng như "37,6-". Viền nền của chữ chỉ che phần đường nằm ngay sau nét chữ; gạch kế bên vẫn ló ra sát con số. Đo trên 600 đợt ngẫu nhiên ở 375 px: nhãn nằm trên đường từ 47 đợt xuống 0; nhãn chạm một phần một chấm trước từ 22 lên 31 đợt, ở cụm đo dày, cùng loại giới hạn M2c đã nhận; chữ đè chữ và chữ ra ngoài hình vẫn 0.)
- Chữ "Sốt" nằm ở góc trên phải của vùng tô; một chấm hay một nhãn chạm tới chỗ đó thì chữ sang góc trên trái, rồi tới giữa; cả ba chỗ đều vướng thì ở lại bên phải.
- `aria-label`: "Biểu đồ nhiệt độ: {n} lần đo, cao nhất {x}°C, {m} liều hạ sốt." Đợt dài hơn 7 ngày: "Biểu đồ nhiệt độ, 7 ngày gần nhất: …", và ba con số chỉ tính 7 ngày được vẽ.

## 7. Tab Hôm nay

Khi bé có đợt đang mở, `HomeScreen` tải thêm `useRangeLogs(baby.id, started_at, null)` cho đợt đó.

### 7.1 Thẻ đợt ốm (bảng "Hôm nay · C")

Nằm ngay dưới `AlertBanners` và `LongTimerBanner`, trên `HeroCardView`. Chỉ hiện khi có đợt đang mở.

- Hàng trên bấm được, dẫn tới trang chi tiết: icon `thermo` nền `cat-temp` nhạt, tiêu đề "Đang ốm · ngày {n}", dòng phụ theo §5.2, mũi tên phải.

  | `kind`       | Dòng phụ                           |
  | ------------ | ---------------------------------- |
  | `unmeasured` | Chưa đo nhiệt độ                   |
  | `fever`      | Đang sốt · {x}°C lúc {giờ}         |
  | `stale`      | Chưa đo lại · {x}°C lúc {giờ}      |
  | `cleared`    | Hết sốt {khoảng} · {x}°C lúc {giờ} |
  | `none`       | Không sốt · {x}°C lúc {giờ}        |

  "{x}°C lúc {giờ}" luôn là lần đo mới nhất. {giờ} là "{HH:mm}" khi cùng ngày, không thì "{dd/mm} {HH:mm}".

  Dòng phụ dài hơn một dòng thì xuống dòng sau dấu "·", không bao giờ giữa "{x}°C lúc {giờ}". (Làm ở M3a ngày 2026-11-27, sau bước nhìn thử lúc viết plan M3: ở 375 px "Hết sốt 23 giờ · 37,4°C lúc 25/11 23:59" từng bị tách giữa "25/11" và "23:59"; ghi vào spec ở M3b.)

- Ba nút "Nhiệt độ", "Thuốc", "Triệu chứng" như ở thẻ kết luận.

### 7.2 Lời mời (bảng "Lời mời bắt đầu và lời nhắc đóng", nửa trên)

Khi §5.5 đúng, banner của alert sốt đang hiện (vàng hay đỏ) có thêm, sau các nút sẵn có của nó: câu "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?" và hai nút "Bắt đầu đợt ốm", "Không". Chữ và các nút sẵn có của banner giữ nguyên, đứng trước.

Bấm "Bắt đầu đợt ốm" thì ở lại Hôm nay, không có toast: lời mời biến mất và thẻ đợt ốm (§7.1) hiện ngay dưới banner. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bấm xong thì đi đâu. Chọn ở M3b ngày 2026-11-27 theo lời duyệt trước của người dùng.)

### 7.3 Nhắc đóng (cùng bảng, nửa dưới)

Khi §5.6 đúng, một thẻ `Glass` ngay dưới thẻ đợt ốm:

- Tiêu đề theo trường hợp của §5.6. `no-fever`: "{tên} đã 48 giờ không sốt". `unchecked`: "48 giờ qua chưa đo lại nhiệt độ". `quiet`: "48 giờ qua không có triệu chứng hay liều hạ sốt nào".
- Dòng phụ: "Đợt ốm bắt đầu {dd/mm} xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa."
- Nút "Bé đã khỏi" (như §6.3 mục 7) và "Chưa" (hoãn 24 giờ theo §5.6).
- Bên trái tiêu đề là icon tròn theo §5.2 của trạng thái lúc đó, cùng tông và icon với thẻ kết luận, để ba dạng khác nhau cả ở theme `night`. Ở 375 px tiêu đề của `quiet` dài hai dòng và dòng phụ dài ba dòng; không chữ nào bị cắt. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói icon, và mục 2 chỉ cho dòng mô tả của thẻ tối đa hai dòng. Chọn ở M3b ngày 2026-11-27 theo lời duyệt trước của người dùng.)

## 8. Lần khám

### 8.1 Migration `supabase/migrations/20261126000300_illness_visits.sql`

```sql
create table public.illness_visits (
  id uuid primary key,
  episode_id uuid not null,
  baby_id uuid not null references public.babies (id) on delete cascade,
  visited_at timestamptz not null,
  place text check (place is null or length(btrim(place)) between 1 and 80),
  conclusion text check (conclusion is null or length(btrim(conclusion)) between 1 and 120),
  advice text check (advice is null or length(btrim(advice)) between 1 and 500),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (episode_id, baby_id) references public.illness_episodes (id, baby_id),
  unique (id, baby_id)
);

alter table public.photos add column visit_id uuid;
alter table public.photos add foreign key (visit_id, baby_id)
  references public.illness_visits (id, baby_id);
```

- Hai khóa ngoại mới không có `on delete cascade`: còn lần khám thì không xóa được đợt ốm; còn ảnh thì không xóa được lần khám. Xóa bé vẫn xóa hết qua `baby_id`.
- Index `illness_visits (episode_id, visited_at)` và `photos (visit_id) where visit_id is not null`.
- Trigger `set_updated_at`; `forbid_immutable_change('id', 'episode_id', 'baby_id', 'created_by')`. Trigger `photos_immutable` thêm `'visit_id'`.
- RLS của `illness_visits`: như `illness_episodes` (§4.1). Policy của `photos` và của kho `photos` không đổi.
- Lần khám thuộc đợt ốm theo `episode_id`, không theo giờ: sửa giờ của đợt không làm lần khám rời khỏi đợt.
- `photos_total_bytes()` không đổi: ảnh đơn thuốc tính chung dung lượng với trang Ảnh.

### 8.2 Lớp dữ liệu

- Lần khám và ảnh của nó ghi thẳng lên server, cần mạng, không qua outbox, theo mẫu `usePhotoActions`. Mất mạng thì nút "Thêm" và "Lưu" tắt, kèm `NeedsNetwork`.
- `lib/data/illness.ts`: `useVisits(babyId)` đọc mọi lần khám của bé; `useVisitActions` có `add`, `update`, `remove`.
- Ảnh: dùng lại `compressPhoto`, `photoPath`, kho `photos`. Hàng `photos` của ảnh đơn thuốc có `visit_id`, `taken_on` = ngày của `visited_at`, `caption` = null.
- `usePhotos` (trang Ảnh, chọn ảnh cho mốc phát triển) thêm lọc `visit_id is null`.
- Xóa lần khám: xóa từng ảnh bằng thao tác `remove` có sẵn (object trước, hàng sau), rồi mới xóa hàng lần khám. Một bước lỗi thì dừng, báo lỗi, phần còn lại giữ nguyên để bấm lại.
- Quyền xóa ảnh theo policy sẵn có của `photos`: chủ gia đình hoặc người đã thêm ảnh đó.
- Dung lượng: khi `usage(totalBytes).level === "full"` (`lib/rules/photos.ts`) thì không thêm được ảnh đơn thuốc, giống trang Ảnh.
- Lưu lần khám mới: lưu hàng lần khám trước, rồi tải từng ảnh. Ảnh nào lỗi thì bỏ qua và tải tiếp ảnh sau; lần khám đã lưu vẫn giữ.
- `useVisits(babyId, enabled = true)` trả mỗi lần khám kèm các ảnh của nó, cũ trước; khóa `["illness-visits", babyId]`, `staleTime` 60 giây, không đọc từng trang (mỗi bé chỉ vài lần khám, mỗi lần tối đa 6 ảnh). `useVisitActions(babyId, familyId)` có thêm `removePhoto` (xóa một ảnh đã lưu, §8.4); `add` và `update` trả mã lần khám và các ảnh chưa tải được. Phần tải ảnh và xóa ảnh của trang Ảnh tách thành `uploadPhoto`, `deletePhoto` dùng chung; trang Ảnh không đổi gì. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói mấy chỗ này. Chọn ở M5b ngày 2026-11-27 theo lời duyệt trước của người dùng.)

### 8.3 Thẻ "Lần khám" trên trang chi tiết

- Tiêu đề "Lần khám", bên phải nút "Thêm".
- Mỗi lần khám, cũ trước: dòng "{dd/mm} {HH:mm} · {nơi khám}" (không có nơi khám thì chỉ ngày giờ); nhãn nhỏ "Bác sĩ kết luận" rồi `conclusion` đậm; `advice` chữ nhỏ; các ảnh thành ô 60×78 bấm để xem lớn. Bấm vào lần khám mở sheet sửa.
- Chưa có lần khám: dòng "Chưa có lần khám nào."

### 8.4 Sheet "Lần khám" (bảng "Lần khám — phiếu nhập")

- Dòng phụ: "Chỉ cần ngày giờ. Các ô khác điền được sau."
- "Lúc khám" (ngày giờ, mặc định lúc này; không sau lúc này quá 1 phút; phải nằm trong khoảng của đợt, sai thì "Lúc khám nằm ngoài đợt ốm.").
- Một câu cho cả hai lỗi của "Lúc khám": giờ sau lúc này quá 1 phút cũng nằm ngoài đợt (đợt đang mở chỉ tới lúc này). Hai đầu của đợt tính vào đợt: đúng `started_at` hay đúng `ended_at` đều hợp lệ. Ô để nguyên như lúc mở sheet thì giữ giờ đã có tới từng giây. Một lần khám đã nằm ngoài đợt vì đợt bị sửa giờ (§8.1) thì phải chọn lại "Lúc khám" mới lưu được, kể cả khi chỉ sửa ô khác. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bốn chỗ này. Chọn ở M5b ngày 2026-11-27 theo lời duyệt trước của người dùng.)
- "Nơi khám" (tối đa 80), "Bác sĩ kết luận" (tối đa 120), "Lời dặn" (3 dòng, tối đa 500). Ô trống lưu `null`.
- "Ảnh đơn thuốc, giấy khám": các ảnh đã có, mỗi ảnh có nút xóa; ô "Thêm" mở chọn ảnh (`accept="image/*"`). Tối đa 6 ảnh một lần khám; đủ 6 thì ẩn ô "Thêm". Ảnh chọn khi đang thêm mới được tải lên sau khi hàng lần khám đã lưu.
- Nút xóa của một ảnh chỉ hiện với chủ gia đình hoặc người đã thêm ảnh đó. Bấm thì hỏi lại một lần "Xóa ảnh này?" rồi xóa ngay, không chờ "Lưu". Ảnh thêm vào khi đang sửa thì tải lên khi bấm "Lưu".
- Kho ảnh đã đầy (§8.2): ẩn ô "Thêm", hiện dòng "Kho ảnh đã đầy. Xóa bớt ảnh ở trang Ảnh để thêm ảnh mới."
- Có ảnh tải lỗi: sheet ở lại, chuyển sang sửa lần khám vừa lưu, hiện `ErrorCard` "Lần khám đã lưu, còn {k} ảnh chưa tải được." Các ảnh lỗi vẫn nằm trong phiếu; bấm "Lưu" lần nữa chỉ tải các ảnh đó.
- Nút "Lưu". Khi sửa có thêm "Xóa lần khám" (chủ gia đình hoặc người tạo lần khám), hỏi lại một lần: "Xóa lần khám này và các ảnh của nó?" Lần khám còn ảnh mà người đang dùng không xóa được (không phải chủ gia đình, không phải người thêm ảnh) thì nút tắt, kèm dòng "Còn ảnh do người khác thêm. Nhờ người đó hoặc chủ gia đình xóa trước."

## 9. Báo cáo cho bác sĩ

- `Segmented` "Khoảng thời gian" thêm lựa chọn thứ ba "Đợt ốm" khi bé có ít nhất một đợt.
- Mở bằng `/bao-cao?dot={id}`: chọn sẵn "Đợt ốm" với đợt đó. Chọn "Đợt ốm" bằng tay: đợt đang mở, không có thì đợt có `started_at` muộn nhất. Mã không tồn tại thì coi như không có tham số.
- Khi kỳ là "Đợt ốm":
  - Các ngày của báo cáo: từ ngày bắt đầu tới ngày của `ended_at` (đợt đang mở: hôm nay); đợt dài hơn 14 ngày chỉ lấy 14 ngày cuối và ghi "14 ngày cuối của đợt ốm".
  - Bản ghi tải bằng `useRangeLogs` với `from` = đầu ngày trước ngày đầu tiên của báo cáo, `to` = đầu ngày sau ngày cuối (đợt đang mở: `null`).
  - Bảng "Theo ngày" tính trọn từng ngày lịch, kể cả phần của ngày đầu trước `started_at`.
  - Bảng nhiệt độ, bảng thuốc, bảng "Triệu chứng" chỉ lấy bản ghi thuộc đợt (§4.3) và nằm trong các ngày của báo cáo.
  - Dòng "{range} ngày, từ … đến …" sẵn có được thay bằng "Đợt ốm {dd/mm} – {dd/mm} · {n} ngày"; đợt đang mở: "Đợt ốm từ {dd/mm} · ngày thứ {n}". Phần " · in ngày {dd/mm/yyyy}" ở cuối dòng giữ nguyên.
  - Biểu đồ §6.5 đứng trước bảng nhiệt độ và in ra giấy.
  - Dòng "14 ngày cuối của đợt ốm" là một dòng riêng, ngay dưới dòng "Đợt ốm …". Biểu đồ nằm trong mục "Nhiệt độ", giữa tiêu đề và các dòng đo, và chỉ có khi 7 ngày nó vẽ có lần đo (không in một khung trống). Trên giấy, biểu đồ mang màu của theme sáng (đường, chấm, hình thoi, vùng sốt, chữ "38" và "Sốt"), kể cả khi app đang ở theme tối. Mở bằng `?dot=` khi danh sách đợt ốm chưa tải xong thì trang chờ (khung chờ; mất mạng: "Cần mạng để tải báo cáo. …"; lỗi: thẻ lỗi "Đợt ốm: …"), không hiện tạm kỳ 7 ngày. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bốn chỗ này. Chọn ở M4c ngày 2026-11-27 theo lời duyệt trước của người dùng.)
  - Sau bảng thuốc có bảng "Lần khám" (từ M5): Lúc khám, Nơi khám, Bác sĩ kết luận, Lời dặn. Không in ảnh.
- Với mọi kỳ: khi kỳ có bản ghi `symptom`, sau bảng thuốc có bảng "Triệu chứng": Giờ, Triệu chứng (các `short`), Ghi chú.
- Kỳ 7 và 14 ngày: ngoài bảng "Triệu chứng", không đổi gì.
- Bảng "Triệu chứng": mỗi bản ghi một hàng, cũ trước; Giờ viết "{dd/mm} {HH:mm}" như các dòng nhiệt độ. Mã không còn trong nội dung thì bỏ; bản ghi chỉ còn mã lạ thì ô Triệu chứng để trống. Không có ghi chú thì ô Ghi chú để trống. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói ba chỗ này. Chọn ở M4b ngày 2026-11-27 theo lời duyệt trước của người dùng.)

## 10. Kiểm thử

### 10.1 Unit test (vitest)

- `logDetails`: `symptom` nhận mảng 1–30 mã không trùng, từ chối mảng rỗng, mã trùng, `note` rỗng.
- Nội dung: bảng §3.2 (23 `short`, không trùng, 8 `common`).
- `describeLog`, `HISTORY_FILTERS`, `QUICK_ACTIONS` với `symptom`.
- `SymptomFields`: lọc tuổi, "Xem tất cả", chip đã chọn vẫn hiện khi thu gọn, "Lưu" tắt khi chưa chọn.
- `lib/rules/illness.ts`: mọi hàm cho cùng kết quả với mảng bản ghi xếp tăng dần, giảm dần và xáo trộn; ngày thứ `n` qua nửa đêm giờ Việt Nam; đủ 5 `kind` của §5.2 và ranh 6 giờ, 38,0, 39,0; ba dạng {khoảng}; nhãn ngày §5.3; §5.4 gồm ranh 0,75 và 1,25, nền dưới 3 ngày, nền bằng 0, `D` trước ngày bắt đầu; §5.5 gồm lần đo nằm trong một đợt đã đóng; §5.6 cho cả ba trường hợp và ranh 48 giờ; §5.7 gồm hai đợt chung một mốc giờ và `ended_at` ở tương lai; `feverChartModel` gồm đợt dài hơn 7 ngày và đợt không có lần đo.
- Outbox: `illness_episodes` insert, update, delete; lớp phủ `withPendingEpisodes`; mã `23P01`.
- `fetchLogsBetween`: đọc tiếp khi trang đủ 1000 hàng, dừng khi trang thiếu; có và không có `to`; lớp phủ đang chờ chỉ lấy bản ghi trong khoảng.
- `logForm`, `quickEntry` với `symptom`: `codes` rỗng bị từ chối với câu của `MESSAGES.symptom`; chuỗi `codes` đổi sang mảng và ngược lại; `hasNoteField("symptom")` là `false`.
- Màn hình: danh sách (ba trạng thái), trang chi tiết (đang mở, đã đóng, mã lạ), sheet sửa, thẻ Hôm nay, lời mời trong banner vàng và đỏ, nhắc đóng, thẻ và sheet lần khám, Báo cáo với kỳ "Đợt ốm".
- `nav`: `/dot-om` và `/dot-om/chi-tiet` sáng tab `health`. `sw`: hai trang có trong `PAGES`.

### 10.2 pgTAP

- `016_symptom_log.test.sql`: `logs` nhận `symptom`, vẫn từ chối loại lạ.
- `017_illness_episodes.test.sql`: thành viên đọc, thêm, sửa được; người ngoài gia đình không; chỉ chủ hoặc người tạo xóa được; hai đợt chồng giờ bị từ chối với mã `23P01`; đợt mở thứ hai bị từ chối; `ended_at` ≤ `started_at` bị từ chối; cột bất biến.
- `018_illness_visits.test.sql`: RLS như trên; lần khám phải cùng bé với đợt; không xóa được đợt còn lần khám, lần khám còn ảnh; `photos.visit_id` phải cùng bé và không sửa được; xóa một bé đang có đợt ốm, lần khám và ảnh của lần khám thì cả ba cùng mất, không lỗi.

### 10.3 Kiểm trong trình duyệt

Ở 375×812, bốn theme `rose`, `light`, `dark`, `night`. Trang thật chỉ xem. Trang fixture tạm (không commit) cho: phiếu triệu chứng thu gọn và mở hết; thẻ kết luận đủ 5 `kind` và đợt đã đóng; biểu đồ với 1 ngày, 3 ngày, hơn 7 ngày, không có lần đo; danh sách ba trạng thái; thẻ Hôm nay; lời mời trong banner vàng và đỏ; nhắc đóng ba dạng; nhóm "Khác" của phiếu "+" với năm ô, chữ "Triệu chứng" không bị cắt; thẻ lần khám có 0, 1 và 6 ảnh; Báo cáo kỳ "Đợt ốm" ở màn hình và ở bản xem trước khi in. Ghi lại trong plan trạng thái nào đã thấy thật, trạng thái nào chỉ thấy trên fixture.

### 10.4 Checklist thiết bị

`docs/device-checklist.md` thêm "Bước 38 — Đợt ốm (spec 2026-11-26)". M1 tạo bước này với phần của mình; mỗi mốc sau thêm phần của nó. Đủ năm mốc thì bước gồm: ghi một triệu chứng; bắt đầu đợt từ lời mời và bằng tay; thẻ Hôm nay và ba nút; đóng và mở lại; bắt đầu khi mất mạng rồi có mạng lại; máy thứ hai đang mở app thấy đợt ốm sau tối đa 2 phút; thêm lần khám có ảnh; in Báo cáo kỳ "Đợt ốm".

## 11. Chỗ bản vẽ khác spec

- Lời mời nằm trong banner sốt sẵn có (vàng hoặc đỏ), không phải thẻ riêng màu hồng; không có icon riêng.
- Phiếu triệu chứng dùng `TimeChips` sẵn có ("Bây giờ", "5p trước", "15p trước", "Giờ khác"), không phải ba chip trên bản vẽ.
- Hàng "Đã qua" của danh sách chỉ có ngày và số ngày; thẻ "Đang diễn ra" không có dòng "Cao nhất … · …".
- Tab Hôm nay trên bản vẽ chỉ vẽ phỏng các khối sẵn có; ngoài thẻ đợt ốm, lời mời và nhắc đóng, tab này không đổi.
- Kết luận của lần khám luôn có nhãn "Bác sĩ kết luận" phía trên.
- Bảng "Đợt ốm · B", "Hôm nay · D", "Triệu chứng · F" là phương án không được chọn.

## 12. Thứ tự làm

Mỗi mốc là một plan riêng, tự xanh và đẩy lên `main` được riêng.

1. **M1 — Bản ghi Triệu chứng** (§3): migration 1, pgTAP 016, nội dung, phiếu nhập, Nhật ký, phiếu "+".
2. **M2 — Đợt ốm** (§4, §5.1–5.3, §5.7, §6): migration 2, pgTAP 017, outbox, `useRangeLogs`, luật, danh sách, trang chi tiết; dòng "Đợt ốm" ở tab Sức khỏe; hai trang trong service worker. Ở mốc này trang chi tiết chưa có ba thứ: thẻ "So với thường ngày" (M4), nút "Báo cáo cho bác sĩ" (M4), thẻ "Lần khám" (M5).
3. **M3 — Tab Hôm nay** (§5.5, §5.6, §7): thẻ đợt ốm, lời mời, nhắc đóng.
4. **M4 — So sánh và Báo cáo** (§5.4, §9): thẻ "So với thường ngày", nút "Báo cáo cho bác sĩ", kỳ "Đợt ốm", bảng "Triệu chứng".
5. **M5 — Lần khám** (§8): migration 3, pgTAP 018, thẻ và sheet lần khám, ảnh, mốc "Khám" trên biểu đồ, bảng "Lần khám" trong Báo cáo, luật tắt nút "Xóa đợt ốm" (§6.4).
