# Baby Tracker — Web (PWA) Design

**Status:** approved 2026-11-13
**Date:** 2026-11-13
**Overview:** [2026-11-13-baby-tracker-overview.md](2026-11-13-baby-tracker-overview.md)
**Unit:** `web` (unit 1/2, build trước)

## 1. Mục tiêu

Một PWA cài lên Màn hình chính iPhone, cho nhiều người trong gia đình cùng ghi và xem dữ liệu chăm sóc một bé. Server gửi Web Push để nhắc cữ bú, nhắc bé thức quá lâu và nhắc lịch tiêm. App có cẩm nang (tiêm chủng, mốc phát triển, bồng bế, phân loại triệu chứng) và tiện ích (nhạc YouTube, tiếng ồn trắng, ảnh, báo cáo cho bác sĩ).

Ngoài phạm vi: app iOS native (unit 2), nhiều bé trên giao diện (DB đã hỗ trợ, UI chỉ một bé), chẩn đoán bằng AI, tính liều thuốc, đa ngôn ngữ.

## 2. Global Constraints

### 2.1 Từ overview (copy nguyên văn)

- Ngôn ngữ giao diện và nội dung: chỉ tiếng Việt (`vi-VN`).
- Múi giờ nghiệp vụ: `Asia/Ho_Chi_Minh` (ranh giới ngày, giờ gửi nhắc tiêm 08:00).
- Lưu thời gian trong DB: `timestamptz` (UTC). Ngày không có giờ: `date`.
- Đơn vị: gram (cân nặng), cm (chiều dài, vòng đầu), °C (nhiệt độ), ml (sữa).
- Mọi khóa chính là UUID v4. Bản ghi `logs` sinh UUID ở client để gửi lại offline không bị trùng.
- Chỉ dùng gói miễn phí: Vercel Hobby, Supabase Free. Không thêm dịch vụ trả phí.
- Bí mật không bao giờ xuống client: `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
- An toàn y tế: app **không** đặt tên bệnh, **không** tính liều thuốc. Mọi màn kết quả triệu chứng có nút gọi `115` và dòng "Thông tin tham khảo, không thay thế bác sĩ."
- Nội dung y tế (lịch tiêm, triệu chứng, mốc phát triển, chuẩn đánh giá) mỗi mục phải ghi `source` (URL) và `reviewedAt` (ngày).
- Đăng nhập chỉ bằng Google (Supabase Auth). Quyền truy cập dữ liệu do danh sách Gmail trong `family_members` quyết định.

### 2.2 Riêng unit `web`

- Next.js 16.x (App Router), React 19.x, TypeScript 5.x với `strict: true`. Ghim phiên bản chính xác trong `package.json` lúc lập plan.
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). Runtime trên Vercel: Node.js 22.x. Mọi API route khai báo `export const runtime = 'nodejs'`.
- Thư viện được phép: `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên. Dev-only: `exceljs` 4.x (chỉ dùng trong `scripts/build-who.ts`). Không dùng `@supabase/ssr`. Thêm thư viện khác phải có lý do ghi trong plan.
- Mô hình render và phiên đăng nhập: **mọi trang là client-rendered shell** (`'use client'`, không kiểm tra đăng nhập phía server, không có `proxy.ts`/middleware). Trang tự kiểm tra phiên ở client và chuyển `/dang-nhap` khi chưa đăng nhập. Phiên lưu trong `localStorage` bởi `supabase-js` (`flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`). Dữ liệu được bảo vệ bởi RLS, không bởi việc chặn trang.
- API route nhận người dùng qua header `Authorization: Bearer <access_token>` và xác thực bằng `supabase.auth.getUser(token)`. Không dùng cookie.
- Không dùng Workbox, Serwist, `next-pwa`: service worker viết tay ở `public/sw.js`.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Mức hỗ trợ: Safari iOS 16.4 trở lên (mức tối thiểu cho Web Push của PWA). Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Toàn bộ logic nghiệp vụ (đánh giá, ngưỡng, chọn thông báo, z-score, lịch tiêm, phân loại triệu chứng, tách link YouTube) là **hàm thuần** trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Tuổi của bé tính bằng **số ngày**: `ageDays = (ngày hiện tại theo giờ VN) − dob`. Mọi bảng ngưỡng dưới đây dùng `ageDays`.

## 3. Kiến trúc

```
iPhone (PWA standalone)
  ├─ Next.js pages (React) ──► Supabase (supabase-js, JWT người dùng, RLS)
  │     └─ Dexie: cache đọc + outbox ghi offline
  ├─ public/sw.js: push, notificationclick, cache app shell + content
  └─ Supabase Realtime: nhận thay đổi `logs` của người khác

Vercel (Next.js)
  ├─ POST /api/push/subscribe     (JWT người dùng) lưu đăng ký push
  ├─ POST /api/push/unsubscribe   (JWT người dùng)
  └─ POST /api/push/dispatch      (Bearer CRON_SECRET) chọn + gửi thông báo, dùng service role

Supabase
  ├─ Postgres + RLS (schema bên dưới)
  ├─ Auth: Google provider
  ├─ Storage: bucket `photos` (private)
  └─ pg_cron mỗi phút → pg_net POST /api/push/dispatch
```

- Đọc/ghi dữ liệu nghiệp vụ: client gọi thẳng Supabase. **RLS là ranh giới bảo mật duy nhất**, không có API trung gian.
- Next.js chỉ có 3 API route ở trên. Không thêm API CRUD.
- OAuth callback là trang client `/auth/callback` (không phải API route): `supabase-js` tự đổi `code` lấy phiên nhờ `detectSessionInUrl`, sau đó trang gọi `claim_membership()` rồi điều hướng theo mục 4.
- **Rủi ro cần xử lý sớm nhất ở đợt 1:** đăng nhập Google từ bên trong PWA standalone trên iOS (storage của PWA tách khỏi Safari). Task đầu tiên của đợt 1 là spike kiểm tra luồng này trên iPhone thật (mục 10.3 bước 0) trước khi xây tiếp.
- Cron: Vercel Hobby chỉ cho cron 1 lần/ngày nên **không dùng Vercel Cron**. Dùng `pg_cron` + `pg_net` trong Supabase:
  `select cron.schedule('push-dispatch', '* * * * *', $$ select net.http_post(url := <APP_URL>/api/push/dispatch, headers := jsonb_build_object('Authorization', 'Bearer ' || <CRON_SECRET>)) $$);`
  `APP_URL` và `CRON_SECRET` đọc từ Supabase Vault (secret tên `app_url` và `cron_secret`, đọc qua `vault.decrypted_secrets`), không viết cứng trong migration.
- Lưu ý gói free: Supabase tạm dừng project sau 7 ngày không có hoạt động API. Ghi vào README phần vận hành.

### 3.1 Biến môi trường (Vercel)

| Tên                             | Phía   | Ghi chú                                                        |
| ------------------------------- | ------ | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client |                                                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | publishable/anon key                                           |
| `SUPABASE_SERVICE_ROLE_KEY` | server | chỉ dùng trong `/api/push/subscribe` và `/api/push/dispatch`. `/api/push/unsubscribe` dùng client tạo từ token của người dùng (RLS cho phép xóa dòng của chính mình) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`  | client |                                                                |
| `VAPID_PRIVATE_KEY`             | server |                                                                |
| `VAPID_SUBJECT`                 | server | dạng `mailto:<email chủ app>`                                  |
| `CRON_SECRET`                   | server | chuỗi ngẫu nhiên ≥ 32 byte, trùng giá trị trong Supabase Vault |

### 3.2 Việc người dùng phải tự làm (ghi thành checklist trong README)

1. Tạo repo GitHub, kết nối Vercel.
2. Tạo Supabase project (Singapore), bật extension `pg_cron`, `pg_net`.
3. Tạo OAuth Client (Web) trên Google Cloud Console, thêm redirect URI callback của Supabase, nhập Client ID/Secret vào Supabase Auth → Google. Trong Supabase Auth → URL Configuration: Site URL = `<APP_URL>`, Redirect URLs gồm `<APP_URL>/auth/callback` và `http://localhost:3000/auth/callback`.
4. Sinh cặp khóa VAPID (`bunx web-push generate-vapid-keys`), nhập vào Vercel.
5. Lưu `APP_URL` và `CRON_SECRET` vào Supabase Vault với tên `app_url` và `cron_secret`.
6. Đăng nhập app lần đầu bằng Gmail của người lập (người đầu tiên trong toàn hệ thống sẽ được tạo gia đình, mục 4).

## 4. Đăng nhập và phân quyền

- Trang `/dang-nhap`: một nút "Đăng nhập bằng Google" (Supabase OAuth).
- Sau khi đăng nhập, client gọi RPC `claim_membership()` (security definer): với mọi dòng `family_members` có `lower(email) = lower(auth.jwt()->>'email')` và `user_id is null`, gán `user_id = auth.uid()`. Trả về danh sách gia đình.
- Không thuộc gia đình nào → trang `/chua-duoc-moi`: hiện email đang đăng nhập, câu "Nhờ ba/mẹ của bé thêm Gmail này vào gia đình", nút "Đăng xuất".
- **Khởi tạo lần đầu:** RPC `create_family(name text, display_name text)` (security definer, chạy `lock table families in exclusive mode` trước khi kiểm tra) chỉ thành công khi bảng `families` **đang trống**; nếu không thì raise lỗi `family_exists`. Nó tạo `families` + dòng `family_members` role `owner` với email và `user_id` của người gọi. RPC `can_create_family()` trả `true` khi `families` trống. Trang `/chua-duoc-moi` chỉ hiện form "Tạo gia đình" khi `can_create_family()` là `true`. Như vậy chỉ người lập đầu tiên tạo được gia đình, sau đó mọi Gmail khác phải được owner thêm vào danh sách.
- Thuộc ≥ 1 gia đình: dùng gia đình đầu tiên theo `created_at` (UI một gia đình, một bé).
- Gia đình chưa có bé → trang khai báo bé (mục 6.1).

### 4.1 Quyền

| Hành động                                                                  | owner | member |
| -------------------------------------------------------------------------- | ----- | ------ |
| Xem mọi dữ liệu của gia đình                                               | ✓     | ✓      |
| Ghi mới `logs`, `growth`, `milestones_achieved`, `photos`, `vaccine_doses` | ✓     | ✓      |
| Sửa/xóa bản ghi do mình tạo                                                | ✓     | ✓      |
| Sửa/xóa bản ghi của người khác                                             | ✓     | ✗      |
| Thêm/bớt Gmail, đổi role                                                   | ✓     | ✗      |
| Sửa hồ sơ bé, `feed_interval_min`, lựa chọn vaccine                        | ✓     | ✗      |
| Thêm/ẩn nhạc, sửa danh bạ khẩn cấp                                         | ✓     | ✓      |

- Gia đình luôn phải còn ≥ 1 owner: chặn bằng trigger khi xóa hoặc hạ quyền owner cuối cùng.
- Owner không tự xóa chính mình nếu là owner cuối cùng.

## 5. Mô hình dữ liệu

Mọi bảng có `id uuid primary key default gen_random_uuid()` (trừ chỗ ghi khác), `created_at timestamptz default now()`. Bảng có `updated_at` thì cập nhật bằng trigger.

```
families(id, name text not null, created_at)

family_members(
  id, family_id → families on delete cascade,
  email text not null,               -- lưu lowercase
  user_id uuid null → auth.users,
  role text check in ('owner','member'),
  display_name text not null,        -- "Mẹ", "Ba", "Bà nội"
  created_at,
  unique(family_id, email))

babies(
  id, family_id → families on delete cascade,
  name text not null, dob date not null,
  sex text check in ('male','female'),
  birth_weight_g int null, birth_length_cm numeric(4,1) null, birth_head_cm numeric(4,1) null,
  blood_type text null, allergies text null, notes text null,
  feed_interval_min int not null default 180 check between 60 and 360,
  vaccine_choices jsonb not null default '{}',   -- { "<group>": "<series>" }
  created_at, updated_at)

logs(
  id uuid primary key,               -- client sinh
  baby_id → babies on delete cascade,
  type text check in ('breast','bottle','sleep','diaper','medicine','temperature','pump','tummy'),
  started_at timestamptz not null,
  ended_at timestamptz null,         -- null = đồng hồ đang chạy
  details jsonb not null default '{}',
  note text null,
  created_by uuid not null → auth.users,
  created_at, updated_at,
  check (ended_at is null or ended_at >= started_at))
  index (baby_id, started_at desc)
  unique index (baby_id, type) where ended_at is null   -- tối đa 1 đồng hồ chạy mỗi loại

growth(id, baby_id, measured_on date, weight_g int null, length_cm numeric(4,1) null,
       head_cm numeric(4,1) null, created_by, created_at, updated_at,
       check (weight_g is not null or length_cm is not null or head_cm is not null))

vaccine_doses(id, baby_id, vaccine_code text, dose_no int,
       status text check in ('done','skipped','rescheduled'),
       given_on date null, due_on_override date null, place text null, note text null,
       created_by, created_at, updated_at,
       unique(baby_id, vaccine_code, dose_no))

milestones_achieved(id, baby_id, milestone_code text, achieved_on date, note text null,
       photo_id uuid null → photos on delete set null, created_by, created_at, unique(baby_id, milestone_code))

photos(id, baby_id, storage_path text unique, taken_on date, caption text null,
       size_bytes int, created_by, created_at)

music_links(id, family_id, category text check in ('relax','brain'),
       title text null, youtube_video_id text null, youtube_playlist_id text null,
       preset_code text null, hidden boolean not null default false, created_by, created_at,
       check (preset_code is not null or youtube_video_id is not null or youtube_playlist_id is not null))

emergency_contacts(id, family_id, label text, phone text, sort int default 0, created_by, created_at)

push_subscriptions(id, user_id → auth.users on delete cascade, endpoint text unique,
       p256dh text, auth text, user_agent text, created_at, last_success_at timestamptz null)

notification_prefs(user_id uuid primary key → auth.users,
       feed_reminder boolean default true, wake_window boolean default true,
       vaccine boolean default true, snooze_until timestamptz null, updated_at)

notification_log(id, user_id, kind text check in ('feed','wake','vaccine'),
       ref_key text, sent_at timestamptz default now(), unique(user_id, kind, ref_key))
```

### 5.1 `logs.details` theo `type` (validate bằng zod ở client)

| type          | Kiểu ghi | details                                                                                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `breast`      | đồng hồ  | `{ side: 'left' \| 'right' }`                                                                                                                     |
| `bottle`      | tức thời | `{ ml: int 1–400, milk: 'breast_milk' \| 'formula' }`                                                                                             |
| `sleep`       | đồng hồ  | `{}`                                                                                                                                              |
| `diaper`      | tức thời | `{ wet: bool, dirty: bool, stoolColor?: 'yellow' \| 'green' \| 'brown' \| 'black' \| 'pale' \| 'red' }` (ít nhất một trong `wet`/`dirty` là true) |
| `medicine`    | tức thời | `{ name: string, amount: number, unit: 'ml' \| 'mg' \| 'giọt' \| 'viên', antipyretic: bool }`                                                     |
| `temperature` | tức thời | `{ celsius: number 34.0–43.0, method: 'nach' \| 'tran' \| 'tai' \| 'hau_mon' }`                                                                   |
| `pump`        | đồng hồ  | `{ mlLeft?: int, mlRight?: int }` (nhập khi kết thúc)                                                                                             |
| `tummy`       | đồng hồ  | `{}`                                                                                                                                              |

Bản ghi "tức thời" lưu `ended_at = started_at`.

### 5.2 RLS

Hàm trợ giúp (security definer, `stable`, `search_path = ''`): `is_member(family_id)`, `is_owner(family_id)` tra `family_members` theo `auth.uid()`; `baby_family(baby_id)` trả `family_id` của bé. Ký hiệu dưới đây: **M** = `is_member(fam)`, **O** = `is_owner(fam)`, **Mine** = `created_by = auth.uid()`; `fam` là `family_id` của dòng (hoặc `baby_family(baby_id)`).

| Bảng | select | insert | update | delete |
|------|--------|--------|--------|--------|
| `families` | M | ✗ (chỉ qua RPC `create_family`) | O | ✗ |
| `family_members` | M | O | O | O (trigger chặn mất owner cuối cùng) |
| `babies` | M | O | O | O |
| `logs`, `growth`, `milestones_achieved`, `photos` | M | M và Mine | O hoặc (M và Mine) | O hoặc (M và Mine) |
| `vaccine_doses` | M | M và Mine | M (mọi thành viên đều đánh dấu được mũi tiêm) | O hoặc (M và Mine) |
| `music_links` | M | M và Mine | M (mọi thành viên đều được ẩn/bỏ ẩn, sửa) | O hoặc (M và Mine) |
| `emergency_contacts` | M | M và Mine | M | M |
| `push_subscriptions` | `user_id = auth.uid()` | ✗ (chỉ qua API, service role) | ✗ | `user_id = auth.uid()` |
| `notification_prefs` | `user_id = auth.uid()` | `user_id = auth.uid()` | `user_id = auth.uid()` | ✗ |
| `notification_log` | ✗ | ✗ | ✗ | ✗ (chỉ service role) |

- Mọi policy `update` có cả `using` và `with check` giống nhau.
- Trigger `BEFORE UPDATE` trên mọi bảng có các cột `created_by`, `baby_id`, `family_id`, `id`: raise lỗi `immutable_column` nếu `NEW.<cột> is distinct from OLD.<cột>` (RLS `with check` không thấy dòng cũ nên không chặn được việc này).
- Cột `created_by` có `default auth.uid()`; client **không bao giờ gửi** `created_by`.
- RPC security definer: `claim_membership()`, `can_create_family()`, `create_family(name, display_name)`.
- `notification_prefs`: không có dòng nghĩa là **cả 3 công tắc bật**, `snooze_until = null`. Dòng được tạo (upsert) lần đầu người dùng đổi công tắc hoặc bấm tạm tắt.
- Storage bucket `photos` (private), đường dẫn `<family_id>/<baby_id>/<uuid>.jpg`. Policy trên `storage.objects` với `bucket_id = 'photos'`: select và insert khi `is_member(((storage.foldername(name))[1])::uuid)`; delete khi `is_owner(...)` hoặc `owner_id = auth.uid()::text`. Xóa ảnh: xóa object Storage trước, rồi xóa dòng `photos`.
- PostgREST trả **thành công với 0 dòng** (không báo lỗi) khi RLS chặn `update`/`delete`. Mọi lệnh `update`/`delete` ở client phải dùng `.select()` và coi 0 dòng trả về là "bị từ chối quyền" (lỗi vĩnh viễn, mục 9).

### 5.3 Realtime

- Migration thêm `logs` vào publication `supabase_realtime`.
- Client đăng ký Postgres Changes trên `logs`: `INSERT`/`UPDATE` lọc `baby_id=eq.<id>`; `DELETE` không lọc được nên đăng ký không lọc và bỏ qua sự kiện có id không nằm trong cache. Mỗi sự kiện thì invalidate query liên quan. Đồng hồ đang chạy hiện trên mọi máy trong ≤ 3 giây.

## 6. Tính năng

### 6.1 Khai báo bé (owner, lần đầu)

Nhập tên, ngày sinh, giới tính, số đo lúc sinh (tùy chọn), chọn series vaccine cho từng `group` (mục 6.8), và đánh dấu nhanh các mũi đã tiêm có hạn trước hôm nay (mặc định tick sẵn mũi sơ sinh BCG và Viêm gan B).

### 6.2 Trang chủ `/`

- Hàng nút lớn: **Bú trái · Bú phải · Bình · Ngủ · Tã · Thuốc · Nhiệt độ**. Hàng phụ (đợt 3): **Hút sữa · Tummy time**.
- Nút đồng hồ (Bú trái/phải, Ngủ, Hút sữa, Tummy): bấm lần một tạo `logs` có `ended_at = null`, bấm lần hai kết thúc. Đang bú trái mà bấm Bú phải thì kết thúc trái và bắt đầu phải ngay.
- Thẻ "Đang chạy": loại, người bấm, thời gian đã trôi (tính từ `started_at`), nút Dừng.
- Nút tức thời mở sheet nhập nhanh (ml, loại sữa / ướt-bẩn-màu phân / tên thuốc, lượng / nhiệt độ).
- Thẻ "24 giờ qua" (cửa sổ trượt 24 giờ đến hiện tại): tổng giờ ngủ, số cữ bú, tổng ml bình, số tã ướt/bẩn, kèm nhãn đánh giá (mục 7).
- Dòng "Cữ bú tiếp theo khoảng HH:mm", "Bé đã thức X phút".
- Ô tick "Vitamin D hôm nay" (tạo `logs` `medicine` với `name = 'Vitamin D'`, `antipyretic = false`). Ô tự tick nếu hôm nay (giờ VN) đã có bản ghi Vitamin D.
- Banner cảnh báo (mục 7.4) hiện trên cùng.

### 6.3 Lịch sử `/nhat-ky`

Dòng thời gian theo ngày (giờ VN), lọc theo loại. Bấm vào bản ghi để sửa giờ bắt đầu/kết thúc, details, ghi chú, hoặc xóa (theo quyền mục 4.1). Có nút "+ Thêm bản ghi" để nhập tay đủ giờ.

### 6.4 Biểu đồ `/thong-ke`

Tab Ngủ / Bú / Tã: biểu đồ cột 7 hoặc 14 ngày theo ngày lịch giờ VN. Giấc ngủ vắt qua nửa đêm thì chia phần cho từng ngày.

### 6.5 Tăng trưởng `/tang-truong` (đợt 2)

Nhập lần đo. Ba biểu đồ (cân nặng, chiều dài, vòng đầu theo tuổi) vẽ các đường P3, P15, P50, P85, P97 của WHO theo giới tính, chấm điểm của bé. Mỗi lần đo hiện z-score, phân vị và nhãn (mục 7.3).

### 6.6 Phân loại triệu chứng `/trieu-chung` (đợt 2)

- Bước 1: tự điền tuổi; tự điền nhiệt độ gần nhất nếu ghi trong 6 giờ qua (cho sửa).
- Bước 2: danh sách câu hỏi có/không theo nhóm (Sốt, Hô hấp, Tiêu hóa, Da, Hành vi/ăn bú, Khác), định nghĩa trong `content/triage.vi.json`.
- Kết quả: rule đỏ đầu tiên khớp → 🔴 **Đi cấp cứu ngay**. Không có đỏ nhưng có vàng → 🟡 **Cho bé đi khám trong 24 giờ**. Còn lại → 🟢 **Theo dõi tại nhà**, kèm hướng dẫn chăm và "Đi khám ngay nếu xuất hiện: …".
- Màn kết quả luôn có nút `tel:115`, nút gọi bác sĩ (danh bạ khẩn cấp) và dòng miễn trừ trong Global Constraints.
- Rule đỏ bắt buộc (nguồn: WHO IMCI danger signs, Bộ Y tế): bú kém/bỏ bú; co giật; li bì, khó đánh thức; thở nhanh (≥ 60 lần/phút khi `ageDays < 60`, ≥ 50 khi 60 ≤ `ageDays` < 365, ≥ 40 khi `ageDays` ≥ 365); rút lõm lồng ngực; tím môi/da; nôn ra tất cả mọi thứ; thóp phồng; nhiệt độ ≥ 38.0°C khi `ageDays < 91`; nhiệt độ < 35.5°C; nhiệt độ ≥ 40.0°C ở mọi tuổi; vàng da lan tới lòng bàn tay/chân; phân bạc màu; tiêu chảy có máu; dưới 4 tã ướt trong 24 giờ.
- Không có kết quả nào hiện tên bệnh như một kết luận. Phần cẩm nang "Bệnh thường gặp" (cảm lạnh, sổ mũi, nôn trớ, táo bón, hăm tã, chàm sữa, nấm miệng, vàng da sinh lý, viêm tiểu phế quản, tiêu chảy) là bài đọc riêng, mỗi bài có mục "Khi nào đi khám ngay".

### 6.7 Thông tin khẩn cấp `/khan-cap` (đợt 2)

Thẻ hồ sơ: tên, tuổi, nhóm máu, dị ứng, cân nặng gần nhất. Nút gọi: `115` cố định ở đầu, sau đó `emergency_contacts` theo `sort`. Trang được cache để mở được khi offline.

### 6.8 Tiêm chủng `/tiem-chung` (đợt 2)

- Lịch mẫu trong `content/vaccines.vi.json`, mỗi mục: `{ code, name, protects: string[], program: 'tcmr' | 'dich_vu', group?: string, series?: string, doseNo, recommendedAgeDays, minAgeDays, minIntervalDaysFromPrev?, source, reviewedAt }`.
- `group` gom các lựa chọn loại trừ nhau, ví dụ `dtp_combo` (`tcmr_5in1` / `6in1`), `rota` (`rotarix` / `rotateq`), `pneumo` (theo loại vaccine phế cầu). Chỉ hiện series đã chọn trong `babies.vaccine_choices`. Group chưa chọn thì hiện mọi series kèm nhãn "Chưa chọn loại".
- Ngày hẹn của một mũi = `due_on_override` nếu có. Nếu không thì = max(`dob + recommendedAgeDays`, `P + minIntervalDaysFromPrev`), trong đó `P` = `given_on` của mũi trước cùng series; nếu mũi trước `done` mà `given_on` là null (tick nhanh ở 6.1) thì `P` = ngày hẹn tính được của mũi trước; nếu mũi trước chưa tiêm thì `P` = ngày hẹn của mũi trước.
- Mũi thuộc `group` chưa chọn series **không** sinh thông báo `vaccine` (chỉ hiện trong danh sách với nhãn "Chưa chọn loại").
- Danh sách nhóm theo trạng thái: Quá hạn · Sắp tới (≤ 30 ngày) · Đã tiêm · Đã bỏ qua · Sau này.
- Đánh dấu: Đã tiêm (ngày, nơi tiêm, ghi chú) / Bỏ qua / Đổi ngày hẹn.

### 6.9 Mốc phát triển `/phat-trien` (đợt 3)

- `content/milestones.vi.json`: mốc theo tháng (2, 4, 6, 9, 12, 15, 18, 24) chia lĩnh vực Vận động / Ngôn ngữ / Nhận thức / Xã hội (nguồn CDC "Learn the Signs. Act Early."), cộng 6 mốc vận động lớn của WHO kèm khoảng tuổi bình thường: ngồi không cần đỡ, bò bằng tay và gối, đứng có người đỡ, đi có người dắt, tự đứng, tự đi.
- Mốc có thêm "lật" (khoảng 4–6 tháng) và mục "Khi nào nên hỏi bác sĩ" cho từng mốc tháng.
- Hiện mốc của nhóm tuổi hiện tại và kế tiếp. Đánh dấu đã đạt (ngày, ghi chú, gắn ảnh).

### 6.10 Bồng bế `/bong-be` (đợt 3)

`content/holding.vi.json` theo giai đoạn 0–3 tháng, 3–6 tháng, trên 6 tháng. Mỗi tư thế có: tên, các bước, lưu ý an toàn (ví dụ luôn đỡ đầu-cổ khi bé dưới 3 tháng, địu giữ tư thế chân chữ M), nút "Xem video" mở YouTube bằng từ khóa tìm kiếm. Không có hình minh họa.

### 6.11 Nhạc `/nhac` (đợt 3)

- Hai tab: **Thư giãn / ru ngủ** và **Phát triển trí não**.
- Mục có sẵn trong `content/music.vi.json`: `{ presetCode, category, title, searchQuery }`. Mở YouTube bằng trang kết quả tìm kiếm.
- Bố mẹ dán link YouTube → `parseYouTubeUrl` tách `videoId` / `playlistId` từ các dạng `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `m.youtube.com`, `music.youtube.com`, `youtube.com/playlist?list=`. Link không hợp lệ thì báo lỗi ngay ở ô nhập.
- Ẩn mục có sẵn: tạo `music_links` với `preset_code` và `hidden = true`.
- Đầu tab "Phát triển trí não" có dòng: "Chỉ cho bé nghe, không cho bé xem màn hình. WHO khuyến nghị trẻ dưới 2 tuổi không xem màn hình."
- **Mở app YouTube:** dựng `youtube://www.youtube.com/<path>` rồi gán `location.href`. Đặt hẹn giờ 1500 ms và **hủy hẹn giờ** ngay khi có sự kiện `visibilitychange` (sang `hidden`), `pagehide` hoặc `blur`. Hẹn giờ chạy hết (nghĩa là trang chưa từng mất focus) thì gán `location.href = 'https://www.youtube.com/<path>'` (cùng tab, không dùng `window.open` vì bị chặn popup khi đã quá thời gian user-activation). Mỗi mục còn có link phụ hiển thị "Mở trên web" (`<a href="https://www.youtube.com/<path>" target="_blank" rel="noopener">`) để người dùng tự bấm nếu cả hai cách trên không chạy. `<path>` là `watch?v=<id>`, `playlist?list=<id>` hoặc `results?search_query=<encoded>`. Phải kiểm tra trên thiết bị thật (mục 10.3).

### 6.12 Tiếng ồn trắng `/on-trang` (đợt 3)

Web Audio API tạo white, pink, brown noise bằng `AudioBufferSourceNode` lặp vòng, buffer 2 giây. Có thanh âm lượng, hẹn giờ tắt Không / 15 / 30 / 60 phút (giảm dần âm lượng trong 10 giây cuối). Khi bấm phát, đặt `navigator.audioSession.type = 'playback'` nếu có (Safari 16.4+) để vẫn kêu khi gạt công tắc im lặng. Không dùng file âm thanh, không dùng Media Session. Giới hạn đã biết: iOS có thể dừng Web Audio khi khóa màn hình; kết quả đo ghi theo mục 10.3 bước 6.

### 6.13 Hút sữa và tummy time (đợt 3)

Dùng nút đồng hồ ở trang chủ (mục 6.2). Hút sữa: kết thúc thì hỏi ml trái/phải. Thống kê: tổng ml hút/ngày, tổng phút tummy/ngày. Không có quản lý túi sữa trữ đông.

### 6.14 Ảnh `/anh` (đợt 3)

Chọn ảnh từ máy (`<input type="file" accept="image/*">`). Nén trên client: cạnh dài tối đa 1600 px, JPEG chất lượng 0.8, bỏ EXIF. Upload vào bucket `photos`. Lưới ảnh theo tháng tuổi, xem bằng signed URL (hết hạn 1 giờ). Hiện tổng `size_bytes` so với 1 GB. Tổng ≥ 900 MB thì cảnh báo và chặn upload mới khi ≥ 1000 MB.

### 6.15 Báo cáo cho bác sĩ `/bao-cao` (đợt 3)

Chọn 7 hoặc 14 ngày. Trang có CSS `@media print`, A4 dọc, gồm: thông tin bé, tuổi; bảng theo ngày (giờ ngủ, số cữ bú, ml bình, tã ướt/bẩn); các lần đo nhiệt độ; thuốc đã dùng (giờ, tên, lượng); lần đo tăng trưởng gần nhất kèm phân vị; mũi tiêm gần nhất và mũi sắp tới. Nút "In / Lưu PDF" gọi `window.print()`.

### 6.16 Cài đặt `/cai-dat`

- Hồ sơ bé, khoảng cách cữ bú `feed_interval_min` (60–360, bước 15) (owner).
- Thành viên: danh sách Gmail, tên hiển thị, role; thêm/bớt/đổi role (owner).
- Thông báo (mỗi người): nút "Bật thông báo trên máy này", 3 công tắc loại, nút **Tạm tắt 2 giờ / 4 giờ / 8 giờ / Bật lại**.
- Giao diện: Sáng / Tối / Ban đêm / Theo hệ thống (lưu `localStorage`).
- Đăng xuất.

### 6.17 Cài PWA `/cai-app`

`display-mode` khác `standalone` thì hiện hướng dẫn 3 bước "Chia sẻ → Thêm vào MH chính → Mở từ biểu tượng" và nói rõ phải cài mới nhận được thông báo. Nút "Bật thông báo" chỉ hiện trong standalone và chỉ gọi `Notification.requestPermission()` từ một lần bấm của người dùng.

### 6.18 Giao diện

- Theme Sáng, Tối, **Ban đêm** (nền `#0b0b0b`, chữ và nhấn màu đỏ cam độ sáng thấp, không có trắng thuần).
- Thanh tab dưới: Trang chủ · Nhật ký · Cẩm nang · Tiện ích · Cài đặt. Cẩm nang gồm Tiêm chủng, Triệu chứng, Phát triển, Bồng bế, Bệnh thường gặp. Tiện ích gồm Nhạc, Ồn trắng, Ảnh, Báo cáo, Khẩn cấp, Tăng trưởng, Thống kê.
- `manifest.webmanifest`: `name` "Bé Yêu", `display` `standalone`, icon 192/512 và `apple-touch-icon` 180.

## 7. Quy tắc đánh giá (`lib/rules/`)

Nhãn: `green` / `yellow` / `red`, kèm câu giải thích tiếng Việt và khoảng chuẩn.

### 7.1 Gom cữ bú

Các bản ghi `breast`/`bottle` sắp theo `started_at`. Bản ghi bắt đầu trong vòng 30 phút sau `ended_at` của bản ghi trước thì cùng một cữ. "Số cữ bú" = số cữ trong cửa sổ.

### 7.2 Chuẩn theo tuổi (cửa sổ trượt 24 giờ)

| Chỉ số   | Khoảng `ageDays` | Green          | Yellow       | Red |
| -------- | ---------------- | -------------- | ------------ | --- |
| Giờ ngủ  | 0–90             | 14–17 giờ      | ngoài khoảng | —   |
| Giờ ngủ  | 91–364           | 12–15 giờ      | ngoài khoảng | —   |
| Giờ ngủ  | 365–729          | 11–14 giờ      | ngoài khoảng | —   |
| Giờ ngủ  | ≥ 730            | 10–13 giờ      | ngoài khoảng | —   |
| Số cữ bú | 0–30             | ≥ 8            | < 8          | —   |
| Số cữ bú | 31–180           | ≥ 6            | < 6          | —   |
| Số cữ bú | > 180            | không đánh giá |              |     |
| Tã ướt   | 0–5              | không đánh giá |              |     |
| Tã ướt   | ≥ 6              | ≥ 6            | 4–5          | < 4 |

- Giờ ngủ tính phần giao của mỗi giấc với cửa sổ; giấc đang chạy tính đến hiện tại.
- Chỉ đánh giá khi cửa sổ 24 giờ có ít nhất một bản ghi loại đó **và** bản ghi sớm nhất của bé cũ hơn 24 giờ. Nếu không thì hiện "Chưa đủ dữ liệu".

### 7.3 Tăng trưởng (WHO)

- Bảng LMS theo ngày tuổi 0–1856 của WHO Child Growth Standards (weight-for-age, length/height-for-age, head-circumference-for-age; nam, nữ). Lưu tại `content/who/{wfa,lhfa,hcfa}_{boys,girls}.json`, tạo một lần từ các file "expanded tables" (.xlsx) của WHO bằng script `scripts/build-who.ts` (dùng `exceljs`). Ghi URL nguồn trong file.
- Tuổi dùng để tra bảng là tuổi tại ngày đo: `measured_on − dob` (ngày), không phải tuổi hôm nay.
- Hiển thị z-score theo công thức LMS chuẩn ở dòng dưới cho cả ba chỉ số (không áp dụng bản "restricted" của WHO cho |z| > 3); phân loại không đổi vì hàm đơn điệu.
- `z = ((X / M)^L − 1) / (L · S)` (khi `L = 0` thì `z = ln(X / M) / S`). Phân vị = `Φ(z)·100`.
- |z| ≤ 2 → green. 2 < |z| ≤ 3 → yellow ("Nên hỏi bác sĩ ở lần khám tới"). |z| > 3 → red ("Nên cho bé đi khám").
- Đường biểu đồ P3/P15/P50/P85/P97 = z ≈ −1.881 / −1.036 / 0 / 1.036 / 1.881.

### 7.4 Cảnh báo tức thời (banner trang chủ)

| Điều kiện                                                           | Mức                                                           | Nội dung                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| `temperature.celsius ≥ 38.0` và `ageDays < 91`, ghi trong 6 giờ qua | red                                                           | "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay." |
| `celsius ≥ 40.0` (mọi tuổi), ghi trong 6 giờ qua                    | red                                                           | "Sốt rất cao: cần đi khám ngay."                |
| `celsius ≥ 38.0` và `ageDays ≥ 91`, ghi trong 6 giờ qua             | yellow                                                        | "Bé đang sốt — xem Phân loại triệu chứng."      |
| `celsius < 35.5`, ghi trong 6 giờ qua                               | red                                                           | "Thân nhiệt thấp: cần đi khám ngay."            |
| `diaper.stoolColor = 'pale'`, ghi trong 72 giờ qua                  | red                                                           | "Phân bạc màu: cần đi khám ngay."               |
| `diaper.stoolColor = 'red'`, ghi trong 72 giờ qua                   | red                                                           | "Phân có máu: cần đi khám ngay."                |
| Tã ướt 24 giờ < 4 và `ageDays ≥ 6` (đủ dữ liệu theo 7.2)            | red                                                           | "Ít tã ướt: nguy cơ mất nước."                  |
| Thêm thuốc `antipyretic = true` mà liều antipyretic trước < 4 giờ   | yellow (cảnh báo trong sheet nhập trước khi lưu, vẫn cho lưu) | "Chưa đủ 4 giờ từ liều hạ sốt trước (HH:mm)."   |
| Thêm thuốc antipyretic mà đã có ≥ 4 liều antipyretic trong 24 giờ   | yellow (như trên)                                             | "Đã đủ 4 liều hạ sốt trong 24 giờ."             |

Banner red có nút gọi `115` và nút mở `/trieu-chung`. Ở đợt 1 (chưa có `/trieu-chung`), nút này ẩn và câu yellow về sốt đổi thành "Bé đang sốt — theo dõi sát, hỏi bác sĩ nếu sốt kéo dài."

## 8. Thông báo

### 8.1 Đăng ký

- Bấm "Bật thông báo" → `Notification.requestPermission()` → `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` → `POST /api/push/subscribe` với header `Authorization: Bearer <access_token>`, body `{ endpoint, keys: { p256dh, auth } }`. Server xác thực token, rồi upsert bằng service role theo `endpoint` và **gán `user_id` = người gọi** (máy đổi người dùng thì subscription chuyển sang người mới).
- Mỗi lần mở app trong standalone: nếu đã có quyền thì lấy lại subscription và upsert (tự sửa khi subscription bị đổi).
- Tắt trên máy: `unsubscribe()` + `POST /api/push/unsubscribe`.

### 8.2 `/api/push/dispatch`

- Chỉ chấp nhận `Authorization: Bearer <CRON_SECRET>` (so sánh thời gian hằng định). Sai thì trả 401.
- Lấy dữ liệu bằng service role, gọi hàm thuần `selectDueNotifications(state, now)` trả `{ userId, kind, refKey, title, body, url }[]`.
- Mỗi mục: `insert into notification_log … on conflict do nothing returning id`. Chỉ gửi khi insert thành công (idempotent khi cron chạy trùng).
- Gửi tới mọi `push_subscriptions` của user bằng `web-push`, TTL 3600 giây, `urgency: 'high'` cho `feed`/`wake`, `'normal'` cho `vaccine`.
- Phản hồi 404/410 thì xóa subscription. Thành công thì cập nhật `last_success_at`. Lỗi khác thì ghi `console.error` và bỏ qua.
- Trả `200 { selected, sent, failed }`.

### 8.3 Luật chọn (hàm thuần, theo từng bé)

Người nhận = thành viên có `user_id`, có ≥ 1 subscription, có công tắc loại đó bật. Với `feed` và `wake` thì thêm điều kiện `snooze_until is null or snooze_until < now`. `vaccine` bỏ qua snooze.

| kind      | Điều kiện                                                                                                                                                                | refKey                              | Nội dung                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | --------------------------------------------------------------- |
| `feed`    | `L` = bản ghi `breast`/`bottle` có `started_at` mới nhất; `L.started_at` trong 12 giờ qua; không có đồng hồ `breast` đang chạy; `now ≥ L.started_at + feed_interval_min` | `feed:<L.id>`                       | "Đến giờ bú rồi" / "Cữ trước lúc HH:mm (X giờ Y phút trước)."   |
| `wake`    | Không có `sleep` đang chạy; `S` = `sleep` có `ended_at` mới nhất, `S.ended_at` trong 12 giờ qua; `now − S.ended_at ≥ W(ageDays)`                                         | `wake:<S.id>`                       | "Bé thức đã X phút" / "Bé có thể đang mệt, thử cho bé ngủ."     |
| `vaccine` | Giờ VN trong khoảng 08:00–08:59; mũi chưa `done`/`skipped`; `due = today + 3` hoặc `today + 1` (ngày VN)                                                                 | `vax:<babyId>:<code>:<doseNo>:D3` hoặc `:D1` | "Sắp tới lịch tiêm" / "<tên vaccine> mũi <n> vào <thứ, dd/MM>." |

`W(ageDays)`, ngưỡng thức (phút): 0–27 → 60; 28–90 → 90; 91–150 → 120; 151–240 → 180; 241–365 → 210; > 365 → 240.

`url` khi bấm: `feed` → `/`, `wake` → `/`, `vaccine` → `/tiem-chung`. Payload gửi `tag = <kind>:<babyId>` để thông báo mới thay thông báo cũ cùng loại.

### 8.4 Service worker `public/sw.js`

- `push`: **luôn** gọi `self.registration.showNotification(title, { body, tag, data: { url } })`. Payload hỏng thì vẫn hiện "Bé Yêu có thông báo mới".
- `notificationclick`: đóng thông báo, focus cửa sổ đang mở rồi `navigate(url)`, hoặc `clients.openWindow(url)`.
- `install`: precache **bắt buộc** app shell (`/`, `/offline`, `/manifest.webmanifest`, icon) bằng `cache.addAll`. Precache **tùy chọn** các route cẩm nang `/khan-cap`, `/tiem-chung`, `/trieu-chung`, `/bong-be`, `/phat-trien` bằng `cache.add` từng URL trong `Promise.allSettled`, bỏ qua URL lỗi, để SW vẫn cài được khi route chưa có ở đợt hiện tại. Các trang là client shell không chuyển hướng (mục 2.2), nên không cache phải response redirect.
- `fetch`: điều hướng HTML dùng network-first; response 200 không redirect được ghi vào cache; mất mạng thì fallback cache rồi `/offline`. Trang `/offline` là trang tĩnh: "Bạn đang offline", nút Thử lại, và link tới các trang cẩm nang đã cache. `/_next/static/*` dùng cache-first. Request tới Supabase không qua cache của SW.
- Phiên bản cache: hằng `CACHE_VERSION`. File nguồn là `sw/sw.template.js`; script `scripts/build-sw.ts` chạy trong `prebuild` thay `__CACHE_VERSION__` bằng `process.env.VERCEL_GIT_COMMIT_SHA` (local: `'dev'`) và ghi ra `public/sw.js` (file này nằm trong `.gitignore`). `activate` xóa mọi cache khác `CACHE_VERSION` và gọi `clients.claim()`.

## 9. Offline và đồng bộ

- `@tanstack/react-query` với `@tanstack/react-query-persist-client` và một persister tự viết lưu vào IndexedDB qua Dexie. Khi mất mạng vẫn xem được dữ liệu đã tải.
- Mọi bảng đi qua outbox (`logs`, `growth`, `vaccine_doses`, `milestones_achieved`) đều có `id` UUID **do client sinh** (`crypto.randomUUID()`), để gửi lại không tạo bản trùng. Với `vaccine_doses` và `milestones_achieved`, upsert dùng `onConflict` theo khóa unique tự nhiên (`baby_id, vaccine_code, dose_no` / `baby_id, milestone_code`) và **không gửi `id`** trong payload (dòng mới lấy `id` mặc định), để nhánh update không đổi khóa chính.
- Ghi (`insert`/`update`/`delete` trên các bảng trên): áp vào cache ngay (optimistic), đồng thời đưa vào bảng Dexie `outbox { id, table, op, row, createdAt, attempts }`.
- Bộ xả outbox chạy khi app khởi động, khi có sự kiện `online`, và mỗi 30 giây khi có mạng. Xả theo thứ tự `createdAt`. `insert`/`update` dùng `upsert` theo `id`.
- Phân loại lỗi khi xả outbox:
  - **Tạm thời, giữ lại** (`attempts++`, thử lại lần xả sau): lỗi mạng/`fetch` throw, HTTP 401 (JWT hết hạn, mã `PGRST301` / `PGRST303`), 408, 429, 5xx. Gặp 401 thì gọi `supabase.auth.refreshSession()` trước lần thử tiếp; refresh thất bại thì chuyển `/dang-nhap` và **giữ nguyên outbox**.
  - **Vĩnh viễn, bỏ mục**: HTTP 400 hoặc 403; mã Postgres `42501` (RLS insert), `23505` (unique, ví dụ đồng hồ trùng), `23514` (check), `23503` (khóa ngoại), `22P02` (dữ liệu sai kiểu); và `update`/`delete` trả 0 dòng (RLS chặn, mục 5.2). Bỏ mục khỏi outbox, rollback cache, toast "Không lưu được: <lý do>".
  - Lỗi khác không nằm trong hai danh sách trên: coi là tạm thời.
  - **Thứ tự ưu tiên:** HTTP 401 **luôn** là tạm thời, bất kể mã lỗi đi kèm (kể cả `42501`). Bộ xả chỉ chạy khi `supabase.auth.getSession()` trả về phiên.
  - Bộ xả **dừng ở lỗi tạm thời đầu tiên** của mỗi lượt, không gửi các mục phía sau, để giữ đúng thứ tự.
  - `delete` trả 0 dòng mà một `select` theo `id` ngay sau đó cũng không thấy dòng → coi là thành công (máy khác đã xóa). Chỉ khi dòng vẫn còn mới coi là bị RLS chặn.
- Xung đột: ghi sau cùng thắng (không merge từng trường).
- Bản ghi còn trong outbox hiện biểu tượng ⏳. Đầu trang có chip "N mục chờ đồng bộ".
- Đồng hồ bấm khi offline: tạo bản ghi `ended_at = null` vào outbox như thường. Nếu khi xả bị unique index từ chối (máy khác đã chạy đồng hồ cùng loại) thì bỏ mục và báo "Đã có người bắt đầu trước".
- Các thao tác ghi không qua outbox cần online: ảnh, thành viên, hồ sơ bé (`babies`), `music_links`, `emergency_contacts`, `notification_prefs`, đăng ký push. Offline thì nút bị tắt kèm chú thích "Cần kết nối mạng".

## 10. Xử lý lỗi và kiểm thử

### 10.1 Lỗi

| Tình huống                            | Hành vi                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| Phiên đăng nhập hết hạn               | `supabase-js` tự refresh (`autoRefreshToken`). Thất bại thì chuyển `/dang-nhap`, giữ outbox |
| Bị RLS từ chối (403/`42501`, hoặc update/delete trả 0 dòng) | toast "Bạn không có quyền thực hiện thao tác này" |
| Chưa cấp quyền thông báo / bị từ chối | Cài đặt hiện trạng thái và hướng dẫn mở lại trong Cài đặt iOS → Thông báo → Bé Yêu |
| Gửi push lỗi                          | ghi log server, 404/410 thì xóa subscription                                       |
| Supabase project bị tạm dừng          | trang lỗi "Máy chủ đang ngủ, vào Supabase bấm Restore"                             |

### 10.2 Tự động

- Vitest cho `lib/rules/`: tính tuổi theo giờ VN (biên nửa đêm), gom cữ bú, giờ ngủ vắt qua cửa sổ, mọi ô trong bảng 7.2, z-score với ít nhất 3 giá trị đối chiếu từ bảng WHO cho mỗi bảng, ngày hẹn tiêm (có/không override, có khoảng cách tối thiểu), mọi dòng bảng 7.4, mọi dòng bảng 8.3 kể cả snooze và các biên 12 giờ, `W(ageDays)` tại các biên, `parseYouTubeUrl` với mọi dạng ở 6.11 cùng link sai, đánh giá cây triệu chứng (đỏ thắng vàng).
- Kiểm tra `content/*.vi.json` bằng zod: mọi mục y tế có `source` và `reviewedAt`.
- pgTAP (`supabase test db`, Supabase CLI local): người ngoài gia đình không đọc được dòng nào; member không sửa/xóa được bản ghi của người khác; member không thêm được Gmail; không xóa được owner cuối cùng; `notification_log` không truy cập được bằng anon/authenticated; `claim_membership` chỉ gắn email trùng khớp; `create_family` thành công khi `families` trống và raise `family_exists` khi đã có gia đình; member cập nhật được `music_links` và `emergency_contacts` của người khác nhưng không xóa được `music_links` của người khác.
- Route `/api/push/dispatch`: test 401 khi sai secret; test gọi 2 lần liên tiếp chỉ gửi 1 lần (mock `web-push`).

### 10.3 Thủ công trên iPhone 11, 16, 17 Pro (checklist trong `docs/device-checklist.md`)

0. (Spike đầu đợt 1) Cài PWA, mở từ biểu tượng, đăng nhập Google **bên trong PWA standalone**, đóng hẳn app rồi mở lại vẫn còn đăng nhập. Nếu thất bại thì dừng và báo lại trước khi xây tiếp.
1. Cài PWA từ Safari, mở từ biểu tượng, chạy standalone.
2. Bật thông báo; tạo cữ bú với `feed_interval_min = 60` bằng giờ lùi 59 phút; nhận push trong ≤ 2 phút; bấm vào thì mở `/`.
3. Hai máy: máy A bấm Ngủ, máy B thấy đồng hồ chạy trong ≤ 3 giây.
4. Bật chế độ máy bay, ghi 2 tã, tắt chế độ máy bay, thấy đồng bộ.
5. Bấm nhạc có sẵn và link tự thêm: mở được app YouTube; khi gỡ app YouTube thì mở được web YouTube.
6. Tiếng ồn trắng chạy tiếp khi khóa màn hình ít nhất 5 phút (ghi kết quả từng máy; nếu iOS dừng thì ghi giới hạn vào README, không chặn phát hành).
7. Tạm tắt 2 giờ: không nhận nhắc bú; nhắc tiêm vẫn đến.

## 11. Các đợt phát hành

Mỗi đợt deploy được và dùng được độc lập.

| Đợt | Phạm vi                                                                                                                                                                                                                                                                                                                 | Điều kiện xong                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Hạ tầng (Next.js, Supabase, migration, RLS, SW, manifest), đăng nhập Google, gia đình và thành viên, khai báo bé (chưa có phần vaccine), trang chủ với Bú/Bình/Ngủ/Tã/Thuốc/Nhiệt độ/Vitamin D, nhật ký, thống kê, đánh giá 7.1–7.2, cảnh báo 7.4, Realtime, offline 9, push `feed`, tạm tắt, theme Ban đêm, `/cai-app` | Test 10.2 phần liên quan xanh; checklist 10.3 bước 0–4 và 7 (phần nhắc bú) đạt trên 3 máy             |
| 2   | Tăng trưởng WHO, tiêm chủng (kèm bước chọn vaccine ở 6.1), push `vaccine`, push `wake`, phân loại triệu chứng và bài bệnh thường gặp, thông tin khẩn cấp                                                                                                                                                                | Test 10.2 phần liên quan xanh; nhận push vaccine thật trên ít nhất 1 máy; checklist bước 7 đạt đầy đủ |
| 3   | Nhạc YouTube, bồng bế, mốc phát triển, hút sữa, tummy time, ảnh, tiếng ồn trắng, báo cáo                                                                                                                                                                                                                                | Test 10.2 phần liên quan xanh; checklist bước 5–6 đạt                                                 |

## 12. Cấu trúc thư mục

```
app/                     # route Next.js (tên route tiếng Việt không dấu như trên)
app/api/push/{subscribe,unsubscribe,dispatch}/route.ts
components/
lib/rules/               # hàm thuần + *.test.ts
lib/data/                # supabase client, query hooks, outbox (Dexie)
content/*.vi.json        # nội dung tĩnh; prebuild copy sang public/content/ (gitignore) để phục vụ tại /content/<tên>.vi.json
content/who/*.json       # bảng LMS WHO
scripts/build-who.ts, scripts/build-sw.ts
sw/sw.template.js
public/sw.js, public/manifest.webmanifest, public/icons/
supabase/migrations/     # schema, RLS, functions, cron
supabase/tests/          # pgTAP
docs/device-checklist.md
```
