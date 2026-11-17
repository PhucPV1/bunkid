# Kim Bun — Nhắc thuốc, giờ yên lặng, canh timer, bốn loại bản ghi mới

**Status:** approved 2026-11-17 (cập nhật cùng ngày theo bản vẽ: người dùng chọn A1, B1, C2)
**Ngày:** 2026-11-17
**Unit:** `web` (PWA Next.js trên Vercel, kèm migration Supabase của chính nó). Một unit.
**Liên quan:** spec gốc `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (gọi tắt "spec gốc"), spec UI `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md` (gọi tắt "spec UI"). Code nền: `main` tại commit `213cc41`. Bản vẽ Claude Design "Kim Bun – nhắc thuốc, canh timer, bản ghi mới" (https://claude.ai/artifact/5fiQTwVS3GzzDGuYj24wyD), vẽ bằng token theme Hồng dịu. Phương án đã chọn: **A1** (viên timer trên thanh tab), **B1** (nhãn "Nên bú" trên nút), **C2** (bảng "+" chia 3 nhóm). Mọi giá trị cần để code nằm trong spec này; canvas chỉ để xem hình. Nhãn "Mới" trên bảng Cài đặt của canvas chỉ để chỉ chỗ mới, không làm.

## 1. Mục tiêu

1. **Nhắc thuốc.** Mỗi thuốc uống hằng ngày có một giờ nhắc riêng; tới giờ mà hôm nay chưa ghi thuốc đó thì gửi push. Sau một liều hạ sốt, đúng 4 giờ thì gửi push nhắc đo lại nhiệt độ.
2. **Giờ yên lặng.** Mỗi người tự đặt một khung giờ không nhận nhắc bú, nhắc thức, nhắc thuốc hằng ngày và nhắc timer. Thêm công tắc "Không nhắc bú khi bé đang ngủ".
3. **Canh timer.** Timer chạy quá lâu thì gửi push và hiện banner. Timer đang chạy hiện ở mọi tab. Nút bú bên ngược với lần trước được gắn nhãn "Nên bú".
4. **Bốn loại bản ghi mới:** Ăn dặm, Uống nước, Tắm, Ghi chú.

Ngoài phạm vi: tính liều thuốc hay khuyên uống tiếp; nhắc một thuốc nhiều lần trong ngày; thêm 4 loại mới vào lưới nhập nhanh trang chủ; thêm 4 loại mới vào Báo cáo bác sĩ; token màu mới; ghi bù Hút sữa và Nằm sấp; đổi luật nhắc bú, nhắc thức, nhắc tiêm ngoài những gì §4 nêu; nhiều bé.

## 2. Global Constraints

- Giữ Global Constraints của `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md` (chỉ dùng gói miễn phí, secret không bao giờ nằm ở client, không tính liều thuốc).
- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Giữ prefix khoá localStorage `be-yeu-*`, tên package và URL `bunkid.vercel.app`.
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Không lồng `glass` trong `glass` (hotfix 7822c90). Màn hình không tự cộng `env(safe-area-inset-*)`, vì `body` đã pad sẵn.
- Mọi giờ trong luật tính theo giờ Việt Nam (UTC+7), dùng `vnDateString`, `formatVnTime`, `vnDayStartMs` có sẵn. Không dùng múi giờ của máy.
- Migration chỉ được thêm (thêm bảng, thêm cột có default, nới check constraint). Không xoá hay đổi kiểu cột đang có.
- Migration phải được áp lên Supabase thật **trước** khi bản web mới được deploy. Nếu ngược lại, bản ghi loại mới bị từ chối với mã `23514` và outbox bỏ nó.
- Chạy `bunx supabase db push` lên project thật chỉ khi người dùng đồng ý trong phiên triển khai. Push lên `main` cũng cần người dùng đồng ý từng lần.
- Mọi ghi bản ghi (`logs`) đi qua outbox như hiện tại. Lịch thuốc và cài đặt thông báo cần mạng (bọc `OnlineOnly`), không qua outbox.
- Chữ về sức khoẻ: nhắc hạ sốt không bao giờ nói nên uống tiếp hay không; công tắc "Không nhắc bú khi bé đang ngủ" luôn đi kèm ghi chú ở §4.4.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không được bắt đầu đồng hồ, không được bật tắt công tắc nào ở Cài đặt › Thông báo và Cài đặt › Nhắc thuốc (công tắc ghi thẳng vào DB).
- Test hiện có phải xanh: 803 test vitest, pgTAP 001–011, `bun run typecheck`, `bun run build`.

## 3. Bốn loại bản ghi mới

### 3.1 Dữ liệu

`LOG_TYPES` trong `lib/rules/logDetails.ts` thêm 4 giá trị, theo thứ tự: `"solids"`, `"water"`, `"bath"`, `"note"`. Cả 4 là bản ghi tức thời (`ended_at = started_at`), không phải timer.

Schema `details` (zod, `.strict()`):

| Loại     | `details`                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `solids` | `food`: chuỗi đã trim, 1–80 ký tự. `amount`: `"little"` \| `"some"` \| `"lots"`. `isNew`: boolean. `reaction`: chuỗi đã trim, 1–200 ký tự, không bắt buộc (ô trống thì bỏ khoá). |
| `water`  | `ml`: số nguyên 1–500.                                                                                                                                                           |
| `bath`   | `{}`                                                                                                                                                                             |
| `note`   | `text`: chuỗi đã trim, 1–500 ký tự.                                                                                                                                              |

Migration `supabase/migrations/20261117000100_log_types.sql`: bỏ constraint `logs_type_check` trên `public.logs` và tạo lại với 12 giá trị (8 cũ + 4 mới). Test pgTAP `supabase/tests/012_log_types.test.sql`: chèn được 4 loại mới; loại `"abc"` vẫn bị từ chối.

### 3.2 Hiển thị

`describeLog` (`lib/rules/describeLog.ts`):

- `solids`: `Ăn dặm · <food> · <ít|vừa|nhiều>`, thêm ` · món mới` khi `isNew`, thêm ` · <reaction>` khi có.
- `water`: `Uống nước · <ml> ml`.
- `bath`: `Tắm`.
- `note`: `Ghi chú · <text>`.

`CATEGORIES` (`lib/ui/categories.ts`) dùng lại token có sẵn:

| Loại     | token        | icon          | label       |
| -------- | ------------ | ------------- | ----------- |
| `solids` | `cat-bottle` | `bowl` (mới)  | `Ăn dặm`    |
| `water`  | `cat-pump`   | `glass` (mới) | `Uống nước` |
| `bath`   | `cat-diaper` | `bath` (mới)  | `Tắm`       |
| `note`   | `cat-tummy`  | `doc`         | `Ghi chú`   |

Ba icon mới thêm vào `lib/ui/icons.ts`, cùng kiểu với icon đang có (viewBox 24×24, nét, không tô).

Máy còn chạy bundle cũ gặp loại mới: `describeLog` trả `Bản ghi không hợp lệ` và `categoryOf` trả hình trung tính (đã có từ commit `213cc41`). Không cần làm thêm.

### 3.3 Nhập

- `InstantType` (`lib/rules/quickEntry.ts`) thêm 4 loại. `buildDetails` kiểm theo schema §3.1. Thông báo lỗi: `solids` "Nhập tên món"; `water` "Nhập số ml từ 1 đến 500"; `note` "Nhập ghi chú"; `bath` không có lỗi riêng. Các ô chữ có `maxLength` đúng bằng giới hạn của schema (món 80, phản ứng 200, ghi chú 500) nên không cần thông báo riêng cho quá dài.
- `QuickField.kind` thêm giá trị `"textarea"` (`FieldList` vẽ `textarea` 3 dòng). `QUICK_FIELDS` thêm:
  - `solids`: `food` (`text`, nhãn "Món"); `amount` (`select`, nhãn "Lượng", lựa chọn `little` "Ít", `some` "Vừa", `lots` "Nhiều"); `isNew` (`checkbox`, nhãn "Món mới"); `reaction` (`text`, nhãn "Phản ứng (nếu có)").
  - `water`: `ml` (`number`, nhãn "Số ml").
  - `bath`: `[]`.
  - `note`: `text` (`textarea`, nhãn "Nội dung").
- `TITLES` của `QuickEntrySheet`: `solids` "Ăn dặm", `water` "Uống nước", `bath` "Tắm", `note` "Ghi chú".
- Giá trị mặc định: `solids` `{ food: "", amount: "some", isNew: false, reaction: "" }`; `water` `{ ml: "" }`; `bath` `{}`; `note` `{ text: "" }`.
- `QuickEntrySheet` cho 4 loại giữ thứ tự hiện tại: các ô trước, chip giờ sau (kể cả luật cấm giờ tương lai). Mỗi loại có component ô riêng trong `components/quick/`, như `BottleFields` hiện có:
  - `solids`: ô chữ "Món" kèm tối đa 4 chip tên món gần nhất (hàm mới `recentFoodNames(logs)`, cùng luật với `recentMedicineNames`: không phân biệt hoa thường, giữ cách viết mới nhất); `Segmented` "Lượng" với Ít / Vừa / Nhiều; `Switch` "Món mới" với dòng phụ "Đánh dấu lần đầu bé ăn món này"; ô chữ "Phản ứng (nếu có)" với placeholder "Ví dụ: nổi mẩn quanh miệng". Bản vẽ: bảng "Sheet Ăn dặm".
  - `water`: `NumberStepper` "Số ml", bước 10. Bản vẽ (cùng `bath` và `note`): bảng "Uống nước · Ghi chú · Tắm".
  - `bath`: không có ô nào.
  - `note`: `textarea` 3 dòng "Nội dung", tối đa 500 ký tự.
- Bảng của nút "+" chia 3 nhóm (bản vẽ: bảng "C2 · Bảng + chia 3 nhóm"). `QuickAction` (`lib/rules/quickActions.ts`) thêm trường `group: "timer" | "quick" | "other"`, và `QUICK_ACTIONS` có 13 mục theo đúng thứ tự sau:
  - `timer`: Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp.
  - `quick`: Bú bình, Thay tã, Thuốc, Nhiệt độ.
  - `other`: Ăn dặm, Uống nước, Tắm, Ghi chú.
- Hằng mới `QUICK_ACTION_GROUPS`: `[{ group: "timer", title: "Bấm giờ" }, { group: "quick", title: "Ghi nhanh" }, { group: "other", title: "Khác" }]`.
- `QuickActionGrid` (`components/actions/ActionSheet.tsx`) vẽ từng nhóm: tiêu đề nhóm (13 px, đậm, màu `muted`), dưới là lưới 4 cột, khoảng cách 8 px. Mỗi ô cao 84 px, bo 20 px, vòng icon 38 px, icon 20 px, nhãn 12 px đậm. Nhóm "Bấm giờ" có 5 ô nên xuống hàng thứ hai. Bỏ icon đồng hồ nhỏ ở góc ô timer (tiêu đề nhóm đã nói thay); viền đậm của ô đang chạy giữ nguyên.
- Hàng nút timer trên trang chủ (`TimerButtons`) lấy các mục `kind: "timer"` theo thứ tự trên, nên thứ tự hiện tại không đổi. `QuickLogGrid` trên trang chủ giữ nguyên 4 ô.
- `LogEditSheet`: `MANUAL_TYPES` (`lib/rules/logForm.ts`) thêm 4 mục cuối danh sách với nhãn "Ăn dặm", "Uống nước", "Tắm", "Ghi chú". Sheet vẽ các ô bằng `FieldList` từ `LOG_FIELDS` như hiện tại, nên 4 loại mới lấy ô từ `QUICK_FIELDS` ở trên (không có chip món, `Segmented` hay `NumberStepper` trong sheet này). Với loại `note`, ô "Ghi chú" sẵn có của sheet (cột `logs.note`) bị ẩn, chỉ còn ô "Nội dung". Quyền sửa xoá không đổi.

### 3.4 Nhật ký và Thống kê

- `HISTORY_FILTERS` (`lib/rules/history.ts`) thêm 2 bộ lọc sau "Nhiệt độ": `{ value: "solids", label: "Ăn dặm" }` gồm `solids` và `water`; `{ value: "other", label: "Khác" }` gồm `bath`, `note`, `pump`, `tummy`.
- `daySummary` không đổi.
- `DayStat` (`lib/rules/dailyStats.ts`) thêm `solidsMeals` (số bản ghi `solids` bắt đầu trong ngày) và `waterMl` (tổng `ml` của `water` bắt đầu trong ngày).
- `STATS_TABS` thêm `{ value: "solids", label: "Ăn dặm" }` ở cuối.
  - Biểu đồ chỉ vẽ số bữa, giống tab Bú: `chartRows` trả `primary = solidsMeals`, `secondary = null`; `SERIES.solids` = `{ primary: "Bữa ăn dặm", secondary: null, color: "var(--color-cat-bottle)", secondaryColor: null }`.
  - Bảng (`STATS_COLUMNS.solids`) có 2 cột: "Bữa ăn dặm" = `solidsMeals`, "Nước (ml)" = `waterMl`.
  - `EMPTY_NOUN.solids` = `"bữa ăn dặm"`, nên chữ khi trống là `Chưa có bữa ăn dặm nào trong <n> ngày` (không có dấu chấm, theo mẫu chung).

### 3.5 Không đổi

`solids` và `water` không phải cữ bú: `isFeed` trong `lib/rules/ratings.ts` giữ nguyên, nhắc bú và số cữ không tính chúng. Ô thống kê 24 giờ trên trang chủ, Báo cáo bác sĩ và realtime không đổi.

Một thay đổi nhỏ đi kèm: chữ của toast Hoàn tác bị cắt ở 60 ký tự và thêm `…` khi dài hơn (hàm `toastText` trong `lib/rules/undo.ts`, áp trong `savedMessage`, cho mọi loại bản ghi). Lý do: ghi chú tới 500 ký tự và phản ứng tới 200 ký tự sẽ làm toast cao nhiều dòng. Danh sách ở Nhật ký và trang chủ vẫn hiện đủ chữ.

## 4. Thông báo: thuốc, timer, giờ yên lặng

Hướng làm: mở rộng bộ gửi hiện có (cron mỗi phút gọi `POST /api/push/dispatch`, luật trong `lib/rules/pushSelection.ts`, chống trùng bằng `notification_log`). Không thêm endpoint hay cron.

### 4.1 Migration `supabase/migrations/20261117000200_reminders.sql`

`public.notification_prefs` thêm cột:

| Cột                      | Kiểu                       | Default        |
| ------------------------ | -------------------------- | -------------- |
| `medicine`               | boolean not null           | `true`         |
| `timer_alert`            | boolean not null           | `true`         |
| `quiet_enabled`          | boolean not null           | `false`        |
| `quiet_start_min`        | int not null, check 0–1439 | `1320` (22:00) |
| `quiet_end_min`          | int not null, check 0–1439 | `360` (06:00)  |
| `hold_feed_while_asleep` | boolean not null           | `false`        |

`public.notification_log`: bỏ constraint `notification_log_kind_check`, tạo lại với `('feed', 'wake', 'vaccine', 'medicine', 'timer')`.

Bảng mới `public.medicine_schedules`:

- `id uuid` khoá chính, default `gen_random_uuid()`.
- `baby_id uuid not null` tham chiếu `public.babies (id)`, `on delete cascade`.
- `name text not null`, check `length(btrim(name)) between 1 and 80`.
- `remind_at_min int not null`, check 0–1439 (phút tính từ 00:00 giờ VN).
- `enabled boolean not null default true`.
- `created_by uuid not null default auth.uid()` tham chiếu `auth.users (id)`.
- `created_at`, `updated_at` như bảng `logs` (trigger `set_updated_at`).
- Unique index trên `(baby_id, lower(btrim(name)))`.
- Trigger `forbid_immutable_change('id', 'baby_id', 'created_by')`.
- RLS: mọi thành viên của gia đình có bé đó được select, insert (`created_by = auth.uid()`), update, delete. Cùng mẫu với `emergency_contacts`, dùng `public.is_member(public.baby_family(baby_id))`.

Test pgTAP `supabase/tests/013_reminders.test.sql`: cột mới có đúng default; `kind` nhận `medicine` và `timer`, từ chối giá trị khác; thành viên đọc ghi được lịch thuốc của bé nhà mình, người ngoài không thấy; hai dòng trùng tên (khác hoa thường) cho một bé bị từ chối.

`lib/supabase/types.ts` cập nhật theo đúng schema mới (chạy `bun run db:types` khi có Supabase local; nếu không thì sửa tay cho khớp).

### 4.2 Lịch thuốc: màn Cài đặt › Nhắc thuốc

- Trang mới `app/cai-dat/nhac-thuoc/page.tsx`, dùng `SettingsSubpage` với tiêu đề "Nhắc thuốc", bọc `AuthGate need="baby"`. Thêm hàng "Lịch nhắc thuốc" vào nhóm Thông báo ở `/cai-dat` (§4.4), và thêm `/cai-dat/nhac-thuoc` vào mảng `PAGES` của `sw/sw.template.js`.
- Bản vẽ: bảng "Cài đặt › Nhắc thuốc". Dưới tiêu đề có dòng: "Tới giờ mà hôm nay chưa ghi thuốc đó thì Kim Bun gửi một thông báo."
- Danh sách luôn có 3 dòng cố định theo `MEDICINE_PRESETS` (Vitamin D, DHA, Men tiêu hoá), rồi tới các thuốc tự thêm theo thứ tự tạo. Dòng cố định chưa có trong DB hiện ở trạng thái tắt.
- Mỗi dòng: tên thuốc, `Switch` bật/tắt, và khi bật thì hiện `<input type="time">` chọn giờ nhắc. Bật một dòng chưa có trong DB thì tạo dòng với giờ mặc định 09:00 (`remind_at_min = 540`). Tắt thì ghi `enabled = false`, giữ giờ.
- Giờ nhắc được ghi ngay ở sự kiện `change` của ô giờ khi giá trị là `HH:mm` hợp lệ; không có nút Lưu.
- Dưới danh sách có dòng chú thích: "Lịch vừa bật hoặc vừa đổi sau giờ nhắc của hôm nay sẽ bắt đầu nhắc từ ngày mai."
- Dòng tự thêm có nút "Xóa" (hỏi lại bằng `window.confirm("Xóa nhắc thuốc này?")`). Dòng cố định không xoá được.
- Cuối danh sách: ô chữ "Tên thuốc khác" (`maxLength` 80, placeholder "Ví dụ: Canxi") và nút "Thêm". Thêm tạo một dòng đang bật với giờ 09:00. Tên trống thì báo "Nhập tên thuốc". Tên trùng với dòng đang có theo `sameMedicine` (§4.3) thì báo "Thuốc này đã có trong danh sách".
- Mọi thành viên sửa được. Offline thì các nút mờ (`OnlineOnly`).
- Lớp dữ liệu: `lib/data/medicineSchedules.ts` (query key `["medicine-schedules", babyId]`, đọc và ghi thẳng qua Supabase, lỗi qua `toVietnameseError`).

### 4.3 Luật chọn thông báo (hàm thuần trong `lib/rules/`)

`BabyDispatchState` thêm:

- `runningTimers: { id: string; type: "breast" | "sleep" | "pump" | "tummy"; startedAt: string; side: "left" | "right" | null }[]`.
- `medicine: { schedules: { id: string; name: string; remindAtMin: number; updatedAt: string }[]; loggedToday: string[]; lastAntipyretic: { id: string; startedAt: string } | null }` (không bao giờ `null`; bé không có lịch thì `schedules` rỗng). `schedules` chỉ gồm dòng `enabled`; `updatedAt` là cột `updated_at` của dòng. `loggedToday` là tên của mọi bản ghi `medicine` bắt đầu từ 00:00 giờ VN hôm nay. `lastAntipyretic` là bản ghi `medicine` có `antipyretic = true` mới nhất trong 6 giờ qua.
- `Recipient.prefs` thêm 6 trường của §4.1. `prefs = null` nghĩa là mọi default của §4.1.

Hai trường hiện có `breastRunningSince` và `wake.sleepRunning` giữ nguyên ý nghĩa; luật nhắc bú và nhắc thức hiện tại không đổi ngoài hai bộ lọc người nhận mới (giờ yên lặng, bé đang ngủ).

`NotificationKind` thêm `"medicine"` và `"timer"`.

**Trùng tên thuốc** (`sameMedicine(scheduleName, logName)`, file mới `lib/rules/medicineNames.ts`; chuyển regex Vitamin D từ `lib/rules/alerts.ts` sang đây và `alerts.ts` import lại): nếu `scheduleName` khớp regex Vitamin D thì `logName` cũng phải khớp regex đó; ngược lại hai tên được so bằng sau khi chuẩn hoá: `trim()`, `toLocaleLowerCase("vi")`, bỏ dấu (`normalize("NFD")` rồi xoá ký tự `\p{M}`, đổi `đ` thành `d`). Nhờ vậy "Men tiêu hóa" và "Men tiêu hoá" là một.

**Nhắc thuốc hằng ngày.** Với mỗi lịch: gọi `m` là số phút từ 00:00 giờ VN của `now`, và `T` là thời điểm nhắc của hôm nay (`vnDayStartMs(hôm nay) + remindAtMin × 60 000`). Gửi khi cả ba điều sau đúng: `m >= remindAtMin`; `updatedAt <= T` (lịch tạo, bật lại hoặc đổi giờ **sau** giờ nhắc của hôm nay thì bắt đầu từ ngày mai; đổi giờ sang một lúc còn ở phía trước trong hôm nay thì hôm nay vẫn nhắc); không có tên nào trong `loggedToday` trùng với tên lịch theo `sameMedicine`. Người nhận: `prefs.medicine`, không đang tạm tắt (snooze), không trong giờ yên lặng.

- `refKey`: `med:<scheduleId>:<YYYY-MM-DD giờ VN>:<remindAtMin>`. Giờ nhắc nằm trong khoá để lịch đã nhắc lúc sáng, rồi được dời sang chiều, vẫn nhắc lại lúc chiều. `tag`: `medicine:<scheduleId>`. `url`: `/`.
- `title`: `Đến giờ uống <name>`. `body`: `Hôm nay chưa ghi <name>.`

**Nhắc sau liều hạ sốt.** Gọi `since = now − lastAntipyretic.startedAt`. Gửi khi `4 giờ <= since < 6 giờ`. Người nhận: `prefs.medicine`, không đang tạm tắt. Giờ yên lặng **không** chặn loại này.

- `kind`: `medicine`. `refKey`: `fever:<logId>`. `tag`: `fever:<babyId>`. `url`: `/`.
- `title`: `Đã đủ 4 giờ từ liều hạ sốt`. `body`: `Liều trước lúc <HH:mm>. Đo lại nhiệt độ cho bé.`

**Nhắc timer chạy quá lâu.** Ngưỡng (`TIMER_LIMIT_MIN` trong `lib/rules/timer.ts`): `breast` 60, `pump` 60, `tummy` 30, `sleep` 840 (14 giờ). `FORGOTTEN_BREAST_MS` trong `lib/rules/ratings.ts` lấy từ ngưỡng `breast` này. Với mỗi timer trong `runningTimers` có `now − startedAt >= ngưỡng`: gửi cho người nhận có `prefs.timer_alert`, không đang tạm tắt, không trong giờ yên lặng.

- `kind`: `timer`. `refKey`: `timer:<logId>`. `tag`: `timer:<logId>`. `url`: `/`.
- `title`: `Timer <nhãn> đã chạy quá <ngưỡng>` (đúng cả khi thông báo bị giờ yên lặng làm trễ), nhãn là `Bú trái`, `Bú phải`, `Ngủ`, `Hút sữa`, `Nằm sấp`; ngưỡng viết `60 phút`, `30 phút`, `14 giờ`. `body`: `Nếu đã xong, mở Kim Bun để dừng.`

**Giờ yên lặng** (`inQuietHours(prefs, now)`): `false` khi `quiet_enabled` là `false` hoặc `quiet_start_min == quiet_end_min`. Gọi `m` như trên. Nếu `start < end`: yên lặng khi `start <= m < end`. Nếu `start > end` (qua nửa đêm): yên lặng khi `m >= start` hoặc `m < end`. Áp cho: nhắc bú, nhắc thức, nhắc thuốc hằng ngày, nhắc timer. Không áp cho: nhắc tiêm, nhắc sau liều hạ sốt. Thông báo bị chặn không được claim, nên hết giờ yên lặng mà điều kiện còn đúng thì lần cron kế tiếp gửi nó.

**Không nhắc bú khi bé đang ngủ.** Người nhận có `hold_feed_while_asleep = true` không nhận nhắc bú khi `runningTimers` có timer `sleep` chạy chưa tới ngưỡng 840 phút. Bé dậy (timer dừng) mà còn quá giờ bú thì lần cron kế tiếp gửi.

**Tạm tắt (snooze)** chặn thêm `medicine` (cả hai loại) và `timer`. Nhắc tiêm vẫn không bị chặn.

`lib/server/dispatchDeps.ts` nạp thêm dữ liệu cho các trường trên. `TTL` và `urgency` của `medicine` và `timer` giống `feed` (3600 giây, `high`).

### 4.4 Cài đặt › Thông báo

Bản vẽ: bảng "Cài đặt › Thông báo". Thứ tự các hàng trong nhóm Thông báo, từ trên xuống:

1. Hàng trạng thái máy này (không đổi).
2. Năm công tắc theo `PREF_OPTIONS` (`lib/rules/notifications.ts`): ba cái cũ, rồi `medicine` "Nhắc thuốc" (icon `pill`), `timer_alert` "Nhắc timer chạy quá lâu" (icon `clock`).
3. Công tắc "Không nhắc bú khi bé đang ngủ" (icon `bottle`, cột `hold_feed_while_asleep`), chú thích ngay dưới: "Bé sơ sinh những tuần đầu thường cần đánh thức để bú. Hỏi bác sĩ trước khi bật."
4. Hàng "Giờ yên lặng" (icon `moon`): giá trị bên phải là `Tắt` hoặc `<HH:mm>–<HH:mm>`.
5. Hàng "Lịch nhắc thuốc" (icon `calendar`, có mũi tên) dẫn tới `/cai-dat/nhac-thuoc`. Giá trị bên phải là `<n> thuốc` với `n` là số lịch đang bật, hoặc `Tắt` khi `n = 0`; khi chưa tải được danh sách thì để trống.
6. Hàng "Tạm tắt nhắc" (không đổi vị trí, cuối nhóm).

- Bấm "Giờ yên lặng" mở sheet "Giờ yên lặng" gồm `Switch` "Bật giờ yên lặng", hai `<input type="time">` "Từ" và "Đến" đặt cạnh nhau, một khối chú thích ba dòng, rồi nút Lưu (bản vẽ: bảng "Sheet Giờ yên lặng"). Ba dòng chú thích: "**Không gửi:** nhắc bú, nhắc thức, nhắc thuốc hằng ngày, nhắc timer."; "**Vẫn gửi:** nhắc tiêm và nhắc sau liều hạ sốt."; "Hết giờ yên lặng mà vẫn quá giờ bú thì nhắc ngay lúc đó." Bấm Lưu khi "Từ" bằng "Đến" thì không lưu và báo "Giờ bắt đầu và kết thúc phải khác nhau".
- Chú thích của Tạm tắt đổi thành: "Tạm tắt nhắc bú, nhắc thức, nhắc thuốc và nhắc timer trên mọi máy của bạn. Nhắc tiêm vẫn gửi."
- `lib/data/notificationPrefs.ts`: `NotificationPrefs`, `DEFAULT_PREFS` và câu select thêm 6 trường.

## 5. Canh timer trong app

### 5.1 Banner timer chạy quá lâu

- Hàm thuần `overdueTimers(logs, now)` (`lib/rules/timer.ts`): các bản ghi đang chạy có thời gian chạy `>=` ngưỡng §4.3, cũ nhất trước.
- Bản vẽ: banner vàng ở đầu bảng "B1". Nền `warn-soft`, chữ `warn-ink`, icon `clock` bên trái, nút "Dừng" viền mảnh bên phải.
- Trang chủ hiện mỗi timer quá ngưỡng một banner vàng ngay dưới `AlertBanners`: chữ `<nhãn> đã chạy <thời gian>. Còn đang <bú|ngủ|hút sữa|nằm sấp> không?` và nút "Dừng". Thời gian viết bằng `formatDuration` có sẵn.
- Nút "Dừng" gọi `useStopTimer` như nút Dừng hiện có (`ended_at` = lúc bấm). Người dùng sửa giờ kết thúc trong Nhật ký nếu cần.

### 5.2 Viên timer ở mọi tab

- Bản vẽ: bảng "A1 · Viên timer trên thanh tab".
- Component mới `components/nav/TimerPill.tsx`, do `ActionChrome` vẽ, lấy bản ghi đang chạy từ `useRecentLogs(baby.id)`.
- Hiện khi có ít nhất một timer đang chạy **và** đường dẫn hiện tại khác `/`. Trang Hôm nay đã có thẻ hero nên không hiện.
- Vị trí: `fixed`, canh giữa, cao 44 px, ngay trên thanh tab và cách nó 8 px: `bottom: calc(max(env(safe-area-inset-bottom) + 10px, 26px) + 70px)` (thanh tab cao 62 px). `z-10`, ẩn khi in (`print:hidden`).
- Nội dung, từ trái sang: vòng icon 32 px theo màu loại, `<nhãn> · <đồng hồ mm:ss hoặc h:mm:ss>` (chữ đậm 15 px, số `tabular-nums`), rồi một vạch dọc mảnh và nút "Dừng" (chữ màu `accent-text`, rộng tối thiểu 64 px, cao bằng viên). Viên bo tròn hoàn toàn, có bóng nhẹ. Có từ 2 timer trở lên thì hiện timer bắt đầu gần nhất và thêm `+<n>` (số timer còn lại). Chỉ viên này tick mỗi giây.
- Bấm vào phần chữ chuyển về `/`. Bấm "Dừng" dừng timer đang hiện. Cả hai vùng chạm ≥ 44×44 pt.
- Chỗ cho viên: `app/globals.css` khai `:root { --pill-offset: 0px }` và `:root[data-timer-pill="on"] { --pill-offset: 52px }`. `TimerPill` đặt `data-timer-pill="on"` lên `<html>` khi đang hiện và gỡ khi ẩn hoặc unmount. Hai chỗ dùng biến này:
  - Vùng đệm đáy của nội dung trang trong `components/AuthGate.tsx` đổi từ `pb-[120px]` thành `pb-[calc(120px+var(--pill-offset))]`.
  - `components/ui/Toast.tsx` cộng thêm `var(--pill-offset)` vào `bottom`, để toast Hoàn tác nổi lên trên viên thay vì đè lên nó.
- Viên dùng một lớp `glass-strong`, không nằm trong phần tử `glass` nào.

### 5.3 Gợi ý bên bú

- Hàm thuần `nextBreastSide(logs, now)` (`lib/rules/timer.ts`): lấy bản ghi `breast` đã kết thúc có `started_at` mới nhất trong 24 giờ qua; trả `{ suggest: bên ngược lại, last: bên đó, lastAt: started_at }`. Không có bản ghi như vậy, hoặc đang có timer `breast` chạy, thì trả `null`.
- Bản vẽ: bảng "B1". Nhãn là viên nhỏ nền `accent`, chữ `on-accent` 11 px đậm, nằm đè lên góc trên bên phải của nút; nút không đổi màu hay kích thước.
- Khi có gợi ý: nút của bên được gợi ý mang nhãn nhỏ "Nên bú" ở ba chỗ: hai nút bắt đầu trong thẻ hero (`HeroCard`), hàng nút timer trang chủ (`TimerButtons`), và bảng của nút "+" (`QuickActionGrid`). Thẻ hero chỉ vẽ hai nút bắt đầu ở trạng thái `overdue` và `empty`; nhãn và dòng `Lần trước: <trái|phải> lúc <HH:mm>` (ngay dưới hai nút) chỉ có ở hai trạng thái đó, trạng thái `next` không đổi.
- Nhãn "Nên bú" chỉ là gợi ý: cả hai nút vẫn bấm được như cũ.

## 6. Kiểm thử

### 6.1 Unit test (vitest)

- `logDetails`: schema 4 loại mới nhận giá trị biên và từ chối ngoài biên (tên món 0 và 81 ký tự, `ml` 0 và 501, ghi chú 501 ký tự, khoá thừa).
- `describeLog`: 4 loại mới, kể cả `solids` có và không có `isNew`, `reaction`.
- `quickEntry`: `buildDetails` và giá trị mặc định cho 4 loại; `recentFoodNames` (không phân biệt hoa thường, tối đa 4).
- `categories`: 12 loại đều có token và icon tồn tại.
- `history`: hai bộ lọc mới. `dailyStats`: `solidsMeals`, `waterMl`, tab `solids`.
- `medicineNames`: `sameMedicine` với Vitamin D3, khác hoa thường, "hóa" và "hoá", tên khác.
- `pushSelection`: nhắc thuốc hằng ngày (trước giờ, sau giờ, đã ghi, sang ngày mới thì khoá mới, lịch sửa sau giờ nhắc thì hôm nay không nhắc, đổi giờ sang lúc còn ở phía trước thì nhắc lại với khoá mới); nhắc hạ sốt (3 giờ 59, 4 giờ, 6 giờ, liều mới thay liều cũ); nhắc timer (dưới và trên ngưỡng của cả 4 loại); giờ yên lặng (khung thường, khung qua nửa đêm, `start == end`, tắt); loại nào bị và không bị giờ yên lặng chặn; `hold_feed_while_asleep` (bé ngủ, bé dậy, timer ngủ quá 14 giờ); snooze chặn `medicine` và `timer`.
- `timer`: `overdueTimers`, `nextBreastSide` (không có cữ nào, cữ quá 24 giờ, đang có timer bú chạy).
- `notifications`: `PREF_OPTIONS` có 5 công tắc đúng thứ tự.
- Component (SSR như test hiện có): `TimerPill` ẩn ở `/` và khi không có timer; màn Nhắc thuốc vẽ 3 dòng cố định; sheet Giờ yên lặng; nhãn "Nên bú".

### 6.2 pgTAP

`012_log_types.test.sql` và `013_reminders.test.sql` như §3.1 và §4.1. Chạy `bun run db:test` cùng 001–011.

### 6.3 Kiểm trong Chrome (Claude in Chrome, mở tab mới, không bấm Lưu)

Mở từng sheet của 4 loại mới từ nút "+"; mở Nhật ký với hai bộ lọc mới; mở Thống kê tab Ăn dặm; mở Cài đặt › Nhắc thuốc và sheet Giờ yên lặng. Kiểm ở 375 px không tràn ngang, ở theme Hồng dịu, Tối và Ban đêm.

### 6.4 Checklist thiết bị (thêm vào `docs/device-checklist.md`, chờ người dùng)

- Bước 31: ghi một bản ghi mỗi loại mới, thấy trong Nhật ký và trên máy thứ hai.
- Bước 32: bật nhắc Vitamin D rồi đổi giờ nhắc thành giờ hiện tại cộng 2 phút, không ghi thuốc, nhận push; ghi Vitamin D rồi thì hôm sau mới nhắc lại.
- Bước 33: bật giờ yên lặng trùm lên giờ hiện tại, tạo điều kiện nhắc bú, không nhận push; tắt giờ yên lặng thì nhận trong 2 phút.
- Bước 34: bắt đầu timer Nằm sấp, sang tab Nhật ký thấy viên timer, bấm Dừng; để một timer chạy quá ngưỡng thì nhận push và thấy banner.

## 7. Thứ tự làm

1. **M1 — Bản ghi mới:** migration `log_types`, §3 toàn bộ.
2. **M2 — Canh timer trong app:** §5 toàn bộ và `TIMER_LIMIT_MIN`.
3. **M3 — Cài đặt thông báo và giờ yên lặng:** migration `reminders`, §4.4, phần giờ yên lặng, `hold_feed_while_asleep` và snooze của §4.3.
4. **M4 — Nhắc thuốc và push timer:** §4.2, phần nhắc thuốc, nhắc hạ sốt và nhắc timer của §4.3, checklist §6.4.

M3 đã có hai công tắc `medicine` và `timer_alert` nhưng hai loại thông báo đó chỉ có từ M4, nên M3 và M4 chỉ được deploy cùng nhau.

Mỗi mốc kết thúc với typecheck, vitest và build xanh.
