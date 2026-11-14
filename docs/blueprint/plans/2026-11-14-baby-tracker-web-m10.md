# Baby Tracker Web — M10 (Đăng ký thông báo đẩy) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Mỗi người bật được thông báo trên iPhone của mình, theo spec §8.1, §6.16, §6.17:
- **Bật thông báo:** bấm "Bật thông báo trên máy này" (ở `/cai-dat`, hoặc ở `/cai-app` khi app chạy từ màn hình chính) → iOS hỏi quyền → máy đăng ký Web Push → `/api/push/subscribe` lưu đăng ký.
- **Tùy chỉnh:** mỗi người tự bật/tắt 3 loại nhắc và tạm tắt 2/4/8 giờ.
- **Tự làm mới:** mỗi lần mở app, đăng ký được gửi lại.
- **Bảng mới:** M10 tạo ba bảng `push_subscriptions`, `notification_prefs`, `notification_log` theo §5 và §5.2.
- M10 chưa gửi thông báo nào; việc gửi thuộc M11.

**Architecture:**
- **Migration:** thêm ba bảng và RLS, kèm test pgTAP.
- **API route:** hai route Next.js `runtime = "nodejs"`. Mỗi route chỉ nối một handler thuần (`handleSubscribe`, `handleUnsubscribe`) với các hàm Supabase thật.
  - Handler nhận dependencies qua tham số, nên Vitest thử được 401/400/200/500 mà không cần mạng.
  - `subscribe` dùng service role: §3.1 cho phép, vì người dùng không được tự ghi bảng này.
  - `unsubscribe` dùng client tạo từ token của chính người dùng, nên RLS chỉ cho xóa dòng của họ.
- **Phía trình duyệt:**
  - Quy tắc thuần ở `lib/push/support.ts` và `lib/rules/notifications.ts`.
  - Phần gọi API trình duyệt ở `lib/push/browser.ts`.
  - Lựa chọn thông báo ghi thẳng vào Supabase, chịu RLS.

**Tech Stack:** như M1–M9 (Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, supabase-js 2.118.0, React Query 5.105.0, zod 4.6.7, recharts 3.10.1, dexie 4.4.7, Vitest 5.0.5, Supabase CLI 2.122.0). Không thêm thư viện. Thư viện `web-push` 3.x thuộc M11, nơi gửi thông báo. Ở M10 người dùng chỉ chạy `bunx web-push@3.6.7 generate-vapid-keys` một lần để tạo khóa.

**Milestones của đợt phát hành 1:**
- M1–M9: xong.
- **M10:** bảng thông báo, `/api/push/subscribe` và `/api/push/unsubscribe`, bật/tắt trên máy, 3 công tắc, tạm tắt.
- M11: `/api/push/dispatch`, luật chọn nhắc bú §8.3, pg_cron + Vault, checklist thiết bị bước 2 và 7.
- M12: outbox ghi offline §9.
- M11 và M12 lập plan sau khi M10 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Ba bảng mới:** M1 chưa tạo các bảng thông báo của §5, nên M10 tạo `push_subscriptions`, `notification_prefs`, `notification_log`. Thêm vài chi tiết spec chưa ghi:
  - `push_subscriptions.endpoint` phải bắt đầu bằng `https://`, `user_id` có index.
  - Khóa ngoại tới `auth.users` đều `on delete cascade`.
  - `notification_prefs.updated_at` cập nhật bằng trigger `set_updated_at` (đã có từ M1).
- **RLS theo §5.2:**
  - `push_subscriptions`: người dùng chỉ xem và xóa dòng của mình; không ai tự thêm hay sửa (chỉ API dùng service role).
  - `notification_prefs`: người dùng xem, thêm, sửa dòng của mình; không xóa.
  - `notification_log`: bật RLS, không có policy, và thu hồi mọi quyền của `anon`/`authenticated`. Đọc bảng này sẽ báo lỗi quyền (`42501`), đúng câu "không truy cập được" của §10.2.
- **`/api/push/subscribe`:**
  - Nhận `Authorization: Bearer <access_token>` và kiểm token bằng `auth.getUser(token)`; token thiếu hoặc sai → `401 {"error":"unauthorized"}`.
  - Body sai → `400 {"error":"invalid_body"}`. Endpoint phải là `https://`; `p256dh` và `auth` dài 1–256 ký tự.
  - Upsert theo `endpoint`, luôn gán `user_id` là người gọi (§8.1: máy đổi người dùng thì đăng ký chuyển sang người mới), kèm `user_agent` (tối đa 300 ký tự).
  - Lỗi khác → `500 {"error":"server_error"}` và `console.error`.
- **`/api/push/unsubscribe`:** cũng kiểm token (401). Body `{ endpoint }` (400 nếu thiếu). Cả bước kiểm token lẫn bước xóa đều dùng client mang token của chính người gọi, không dùng service role (§3.1).
- **Kiểm token:** `auth.getUser(token)` gọi từ client anon key mang token người dùng (`supabaseForUser`). Service role chỉ dùng cho lệnh upsert của `/api/push/subscribe`.
- **Trạng thái thông báo trên máy, theo thứ tự kiểm:**
  1. iPhone mà chưa chạy từ màn hình chính → "Cài Bé Yêu lên màn hình chính rồi mở từ biểu tượng để nhận thông báo." kèm link `/cai-app`. Lý do: Safari iOS chỉ cho Web Push trong PWA đã cài.
  2. Thiếu API push → "Trình duyệt này không nhận được thông báo."
  3. Chưa có `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, hoặc đang chạy `bun run dev` (không có service worker) → "Thông báo chưa được thiết lập trên máy chủ."
  4. Quyền bị chặn → câu hướng dẫn mở lại trong Cài đặt iOS (§10.1).
  5. Có quyền và có đăng ký → "Máy này đang nhận thông báo." và nút "Tắt thông báo trên máy này". Ngược lại → nút "Bật thông báo trên máy này".
- **Nút bật:** chỉ gọi `Notification.requestPermission()` từ cú bấm của người dùng (§6.17).
  - Ở `/cai-dat`, nút nằm trong phần Thông báo.
  - Ở `/cai-app`, nút chỉ hiện khi đang chạy `standalone`, ngay dưới câu "đã được cài".
  - Bấm khi chưa đăng nhập → báo "Bạn cần đăng nhập lại.".
- **Làm mới đăng ký (§8.1):** mỗi lần mở app bản production, nếu máy đang ở trạng thái "đang nhận" thì gửi lại đăng ký hiện có lên `/api/push/subscribe`. Lỗi chỉ `console.warn`.
- **Ba công tắc (§6.16):** "Nhắc cữ bú", "Nhắc khi bé thức quá lâu", "Nhắc lịch tiêm".
  - Đợt 1 chỉ gửi nhắc bú (M11), nên hai công tắc sau có ghi chú "Có từ đợt 2".
  - Không có dòng `notification_prefs` nghĩa là cả ba đang bật (§5.2). Dòng được tạo bằng upsert lần đầu người dùng đổi công tắc hoặc tạm tắt.
- **Tạm tắt:**
  - Nút 2 giờ / 4 giờ / 8 giờ đặt `snooze_until = bây giờ + N giờ`; nút "Bật lại" đặt `snooze_until = null`.
  - Tạm tắt áp dụng cho mọi máy của người đó.
  - Câu trạng thái ghi giờ VN, kèm "ngày mai" hoặc `dd/MM` khi giờ kết thúc không phải hôm nay.
  - Khi không tạm tắt, ghi rõ: tạm tắt chỉ chặn nhắc bú và nhắc thức, nhắc tiêm vẫn gửi (§8.3).
- **Chờ service worker tối đa 5 giây.** Nếu không có, trạng thái thành "Trình duyệt này không nhận được thông báo." thay vì treo ở "Đang kiểm tra…".
- **Khi offline,** M10 chưa tắt các công tắc và nút thông báo kèm "Cần kết nối mạng" (§9). Việc này làm chung cho mọi nút cần mạng ở M12.
- **Đăng xuất không hủy đăng ký push của máy.** Người khác đăng nhập trên máy đó thì lần mở app kế tiếp đăng ký tự chuyển sang họ (§8.1).
- **Bảo mật:** `SUPABASE_SERVICE_ROLE_KEY` chỉ được đọc trong `lib/server/`, và chỉ API route import thư mục này. Bước kiểm tra build xác nhận chuỗi này không có trong `.next/static`.
- **Khóa công khai VAPID** được Next.js chép thẳng vào code lúc build. Vì vậy phải đặt `NEXT_PUBLIC_VAPID_PUBLIC_KEY` trên Vercel **trước** lần deploy cuối của M10.

## Global Constraints

Từ spec §2.1 (nguyên văn):

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

Từ spec §2.2, §3 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `@tanstack/react-query-persist-client` 5.105.0, `dexie` 4.4.7, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component (`'use client'`), tự kiểm tra phiên ở client.
- Mọi API route khai báo `export const runtime = 'nodejs'`. API route nhận người dùng qua header `Authorization: Bearer <access_token>` và xác thực bằng `supabase.auth.getUser(token)`. Không dùng cookie.
- Next.js chỉ có 3 API route: `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/dispatch` (M11). Không thêm API CRUD.
- `SUPABASE_SERVICE_ROLE_KEY`: server, chỉ dùng trong `/api/push/subscribe` và `/api/push/dispatch`. `/api/push/unsubscribe` dùng client tạo từ token của người dùng (RLS cho phép xóa dòng của chính mình).
- Biến môi trường (Vercel):
  - `NEXT_PUBLIC_SUPABASE_URL` (client), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client)
  - `SUPABASE_SERVICE_ROLE_KEY` (server)
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client), `VAPID_PRIVATE_KEY` (server), `VAPID_SUBJECT` (server, dạng `mailto:<email chủ app>`)
  - `CRON_SECRET` (server, M11)
- `supabase-js` khởi tạo với `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true` (client trình duyệt); client phía server dùng `persistSession: false`, `autoRefreshToken: false`.
- Mọi lệnh `update`/`delete` ở client dùng `.select()` và coi 0 dòng trả về là "bị từ chối quyền" (spec §5.2).
- Toàn bộ logic nghiệp vụ là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Mức hỗ trợ: Safari iOS 16.4 trở lên (mức tối thiểu cho Web Push của PWA). Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Tên route: `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`, `/`, `/nhat-ky`, `/thong-ke`, `/cam-nang`, `/tien-ich`, `/cai-dat`, `/cai-app`, `/offline`; API `/api/push/subscribe`, `/api/push/unsubscribe`.
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`).
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x.

Từ M7–M9:

- File `.tsx` trong `app/` và `components/` chỉ dùng màu theo vai trò (`bg-surface`, `text-ink`, `text-muted`, `bg-accent`, `text-on-accent`, `text-good-ink`, `text-danger`, `bg-soft`…). `lib/themeGuard.test.ts` khóa quy tắc này.
- Service worker (`public/sw.js`, M9) đã có sự kiện `push` và `notificationclick`, nên M10 không sửa nó.

Riêng M10:

- Trước khi viết code Next.js, đọc (yêu cầu của `AGENTS.md`):
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/runtime.md`
  - `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`, mục "2. Implementing Web Push Notifications"
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Không đọc, không in, không commit giá trị bí mật nào (`.env*`, khóa VAPID riêng, service role). Người dùng tự tạo khóa và tự dán vào Vercel.
- Câu chữ tiếng Việt trong `lib/rules/notifications.ts`, `lib/push/browser.ts`, `components/push/DevicePushControl.tsx`, `components/settings/NotificationsSection.tsx` phải đúng từng ký tự như plan này.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`6084ae5`):

- Hàm `public.set_updated_at()` (M1); local Supabase qua `bun run db:start`, `db:reset`, `db:test`, `db:types`; cloud đã link (`bunx supabase db push`)
- `publicEnv()` (`lib/env.ts`); `supabase()` (`lib/supabase/client.ts`); `Database` (`lib/supabase/types.ts`, sinh bằng `bun run db:types`)
- `PermissionDeniedError`, `toVietnameseError` (`lib/data/errors.ts`); `useNow` (`lib/hooks/useNow.ts`)
- `addDays` (`lib/rules/days.ts`); `formatVnTime`, `vnDateString` (`lib/rules/time.ts`)
- `SettingsScreen({ member, baby, email })` và `app/cai-dat/page.tsx` (M8); `InstallGuide` (M7); `Providers` (M9, có `useServiceWorker()`)
- Service worker `public/sw.js` (M9): đăng ký ở production; `push` đọc `{ title, body, tag, url }`

**Produces** (M11 dùng):

- Bảng `push_subscriptions(id, user_id, endpoint unique https, p256dh, auth, user_agent, created_at, last_success_at)`, `notification_prefs(user_id pk, feed_reminder, wake_window, vaccine, snooze_until, updated_at)`, `notification_log(id, user_id, kind in feed|wake|vaccine, ref_key, sent_at, unique(user_id, kind, ref_key))` với RLS §5.2 (migration `20261114000200_push.sql`, test `004_push.test.sql`)
- `lib/server/env.ts`: `serverEnv()`, `parseServerEnv()` (M11 thêm `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`)
- `lib/server/supabaseServer.ts`: `supabaseServiceRole()`, `supabaseForUser(token)`
- `lib/server/pushSubscriptions.ts`: `bearerToken`, `handleSubscribe`, `handleUnsubscribe`, `PushSubscriptionDeps`, `SubscriptionRow`; `lib/server/pushSubscriptionDeps.ts`: `supabasePushSubscriptionDeps()`
- `lib/push/support.ts`: `pushSupport`, `urlBase64ToUint8Array`, `subscriptionBody`; `lib/push/browser.ts`: `DeviceState`, `deviceState`, `enablePush`, `disablePush`, `refreshPushSubscription`
- `lib/rules/notifications.ts`: `SNOOZE_HOURS`, `PrefKey`, `PREF_OPTIONS`, `snoozeUntil`, `snoozeText`
- `lib/data/notificationPrefs.ts`: `NotificationPrefs`, `DEFAULT_PREFS`, `fetchPrefs`, `savePrefs`, `useNotificationPrefs`, `useSavePrefs` (key `["notification-prefs", userId]`)
- `DevicePushControl`, `NotificationsSection({ userId })`; `SettingsScreen({ member, baby, email, userId })`
- `usePushRefresh()` gọi trong `Providers`

## File Structure

```
supabase/migrations/20261114000200_push.sql   # 3 bảng thông báo + RLS
supabase/tests/004_push.test.sql              # pgTAP cho RLS và ràng buộc
lib/supabase/types.ts                         # sinh lại bằng bun run db:types
lib/server/env.ts                             # đọc SUPABASE_SERVICE_ROLE_KEY (chỉ server)
lib/server/supabaseServer.ts                  # client service role, client theo token người dùng
lib/server/pushSubscriptions.ts (+ test)      # handler subscribe / unsubscribe
lib/server/pushSubscriptionDeps.ts            # nối handler với Supabase thật
app/api/push/subscribe/route.ts, app/api/push/unsubscribe/route.ts
lib/push/support.ts (+ test)                  # máy có nhận push được không, đổi khóa VAPID
lib/push/browser.ts                           # xin quyền, đăng ký, hủy, làm mới
lib/rules/notifications.ts (+ test)           # tạm tắt, danh sách công tắc
lib/data/notificationPrefs.ts                 # đọc/ghi notification_prefs
lib/hooks/usePushRefresh.ts                   # gửi lại đăng ký mỗi lần mở app
components/push/DevicePushControl.tsx         # nút bật/tắt trên máy này
components/settings/NotificationsSection.tsx  # phần Thông báo trong Cài đặt
components/settings/SettingsScreen.tsx, app/cai-dat/page.tsx, components/install/InstallGuide.tsx, components/Providers.tsx  # sửa
README.md                                     # sửa: thiết lập khóa VAPID, service role
```

## Tasks

1. Bảng thông báo và RLS
2. API đăng ký và hủy đăng ký push
3. Bật thông báo trên máy, công tắc và tạm tắt

---

### Task 1: Bảng thông báo và RLS

**Files:**

- Create: `supabase/migrations/20261114000200_push.sql`
- Modify: `lib/supabase/types.ts` (sinh lại)
- Test: `supabase/tests/004_push.test.sql`

**Interfaces:**

- Consumes: `public.set_updated_at()`; bảng `auth.users`
- Produces: ba bảng và policy như ở Contracts; kiểu `Database["public"]["Tables"]["push_subscriptions" | "notification_prefs" | "notification_log"]`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m10.md` (file plan này, đi chung commit của Task 1); commit mới nhất là `6084ae5 feat(offline): keep the saved sign-in offline and show cached data over errors`.

- [ ] **Step 2: Viết test pgTAP thất bại**

Tạo `supabase/tests/004_push.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'pa@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'pb@example.com');
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'https://push.example/a', 'ka', 'aa'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'https://push.example/b', 'kb', 'ab');
insert into public.notification_log (user_id, kind, ref_key)
  values ('bbbbbbbb-0000-0000-0000-000000000002', 'feed', 'feed:x');

select throws_ok(
  $$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
     values ('aaaaaaaa-0000-0000-0000-000000000002', 'http://push.example/c', 'k', 'a') $$,
  '23514', null, 'push endpoint must be https');
select throws_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('bbbbbbbb-0000-0000-0000-000000000002', 'feed', 'feed:x') $$,
  '23505', null, 'notification_log refuses the same (user, kind, ref_key) twice');

-- As A
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","email":"pa@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.push_subscriptions), 1, 'a user sees only their own push subscriptions');
select throws_ok(
  $$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
     values ('aaaaaaaa-0000-0000-0000-000000000002', 'https://push.example/a2', 'k', 'a') $$,
  '42501', null, 'users cannot insert push subscriptions directly');
select lives_ok(
  $$ delete from public.push_subscriptions where endpoint = 'https://push.example/b' $$,
  'deleting someone else''s subscription runs but matches nothing');
select lives_ok(
  $$ insert into public.notification_prefs (user_id, feed_reminder) values ('aaaaaaaa-0000-0000-0000-000000000002', false) $$,
  'a user creates their own prefs');
select lives_ok(
  $$ update public.notification_prefs set snooze_until = now() + interval '2 hours' $$,
  'a user updates their own prefs');
select throws_ok(
  $$ insert into public.notification_prefs (user_id) values ('bbbbbbbb-0000-0000-0000-000000000002') $$,
  '42501', null, 'a user cannot create prefs for someone else');
select throws_ok(
  $$ select * from public.notification_log $$,
  '42501', null, 'notification_log is not readable by signed-in users');
select lives_ok(
  $$ delete from public.push_subscriptions where endpoint = 'https://push.example/a' $$,
  'a user deletes their own subscription');
reset role;

select is(
  (select array_agg(endpoint order by endpoint) from public.push_subscriptions where endpoint like 'https://push.example/%'),
  array['https://push.example/b'],
  'only the own subscription was deleted');

set local role anon;
select throws_ok(
  $$ select * from public.notification_log $$,
  '42501', null, 'notification_log is not readable anonymously');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `004_push.test.sql` báo lỗi `relation "public.push_subscriptions" does not exist`; ba file test cũ vẫn `ok`.

- [ ] **Step 4: Viết migration**

Tạo `supabase/migrations/20261114000200_push.sql`:

```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%'),
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  feed_reminder boolean not null default true,
  wake_window boolean not null default true,
  vaccine boolean not null default true,
  snooze_until timestamptz,
  updated_at timestamptz not null default now()
);
create trigger notification_prefs_set_updated_at before update on public.notification_prefs
  for each row execute function public.set_updated_at();

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('feed', 'wake', 'vaccine')),
  ref_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, ref_key)
);

alter table public.push_subscriptions enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.notification_log enable row level security;

-- push_subscriptions: rows are written only by /api/push/subscribe with the service role.
create policy push_subscriptions_select on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid());
create policy push_subscriptions_delete on public.push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

-- notification_prefs: each user manages their own row; no row means every switch is on.
create policy notification_prefs_select on public.notification_prefs for select to authenticated
  using (user_id = auth.uid());
create policy notification_prefs_insert on public.notification_prefs for insert to authenticated
  with check (user_id = auth.uid());
create policy notification_prefs_update on public.notification_prefs for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notification_log: service role only.
revoke all on public.notification_log from anon, authenticated;
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001_schema.test.sql .. ok`, `002_rls.test.sql .. ok`, `003_realtime.test.sql .. ok`, `004_push.test.sql .. ok`, `All tests successful.`

- [ ] **Step 6: Sinh lại kiểu TypeScript**

Run: `bun run db:types && grep -c '"push_subscriptions"\|"notification_prefs"\|"notification_log"' lib/supabase/types.ts && bun run typecheck`
Expected: số đếm lớn hơn hoặc bằng 3; không lỗi type.

- [ ] **Step 7: 👤 Đẩy migration lên Supabase cloud**

Nhờ người dùng tự chạy (không chạy thay):

Run: `bunx supabase db push`
Expected: `Applying migration 20261114000200_push.sql...` và `Finished supabase db push.`

Chờ người dùng xác nhận rồi mới làm tiếp.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(db): push subscriptions, notification prefs and notification log with RLS"
```

`git add -A` lần này đưa cả file plan M10 vào commit.

---

### Task 2: API đăng ký và hủy đăng ký push

**Files:**

- Create: `lib/server/env.ts`, `lib/server/supabaseServer.ts`, `lib/server/pushSubscriptions.ts`, `lib/server/pushSubscriptionDeps.ts`, `app/api/push/subscribe/route.ts`, `app/api/push/unsubscribe/route.ts`
- Test: `lib/server/pushSubscriptions.test.ts`

**Interfaces:**

- Consumes: bảng `push_subscriptions` (Task 1); `publicEnv()`; `Database`
- Produces:
  - `parseServerEnv(raw): { SUPABASE_SERVICE_ROLE_KEY: string }` (thiếu → ném `Thiếu hoặc sai biến môi trường: …`), `serverEnv()`
  - `supabaseServiceRole(): SupabaseClient<Database>`, `supabaseForUser(accessToken: string): SupabaseClient<Database>`
  - `bearerToken(header: string | null): string | null`
  - `type SubscriptionRow = { user_id; endpoint; p256dh; auth; user_agent: string | null }`
  - `type PushSubscriptionDeps = { userIdForToken(token): Promise<string | null>; upsertSubscription(row): Promise<void>; deleteOwnSubscription(token, endpoint): Promise<void> }`
  - `handleSubscribe(request: Request, deps): Promise<Response>`, `handleUnsubscribe(request: Request, deps): Promise<Response>` — mã trả về như ở "Diễn giải spec"
  - `supabasePushSubscriptionDeps(): PushSubscriptionDeps`
  - `POST /api/push/subscribe`, `POST /api/push/unsubscribe` (`runtime = "nodejs"`)

- [ ] **Step 1: Đọc tài liệu Next.js**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` (hàm `POST(request: Request)`, `Response.json`) và `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/runtime.md`.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/server/pushSubscriptions.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  bearerToken,
  handleSubscribe,
  handleUnsubscribe,
  type PushSubscriptionDeps,
} from "./pushSubscriptions";

function fakeDeps(): PushSubscriptionDeps & {
  upsertSubscription: ReturnType<typeof vi.fn>;
  deleteOwnSubscription: ReturnType<typeof vi.fn>;
} {
  return {
    userIdForToken: async (token) => (token === "good" ? "user-1" : null),
    upsertSubscription: vi.fn(async () => undefined),
    deleteOwnSubscription: vi.fn(async () => undefined),
  };
}

const post = (path: string, body: unknown, token?: string) =>
  new Request(`https://bunkid.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "iPhone",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const subscription = {
  endpoint: "https://web.push.apple.com/abc",
  keys: { p256dh: "BPkey", auth: "authsecret" },
};

describe("push subscription API", () => {
  it("bearerToken reads only a Bearer header", () => {
    expect(bearerToken("Bearer abc.def")).toBe("abc.def");
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });

  it("subscribe rejects a missing or unknown token with 401", async () => {
    const deps = fakeDeps();
    expect((await handleSubscribe(post("/s", subscription), deps)).status).toBe(
      401,
    );
    expect(
      (await handleSubscribe(post("/s", subscription, "bad"), deps)).status,
    ).toBe(401);
    expect(deps.upsertSubscription).not.toHaveBeenCalled();
  });

  it("subscribe rejects a bad body with 400", async () => {
    const deps = fakeDeps();
    for (const body of [
      "not json",
      { endpoint: "http://insecure.example/x", keys: subscription.keys },
      { endpoint: subscription.endpoint, keys: { p256dh: "", auth: "a" } },
    ])
      expect(
        (await handleSubscribe(post("/s", body, "good"), deps)).status,
      ).toBe(400);
    expect(deps.upsertSubscription).not.toHaveBeenCalled();
  });

  it("subscribe stores the subscription for the caller", async () => {
    const deps = fakeDeps();
    const response = await handleSubscribe(
      post("/s", subscription, "good"),
      deps,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(deps.upsertSubscription).toHaveBeenCalledWith({
      user_id: "user-1",
      endpoint: "https://web.push.apple.com/abc",
      p256dh: "BPkey",
      auth: "authsecret",
      user_agent: "iPhone",
    });
  });

  it("subscribe answers 500 when storing fails", async () => {
    const deps = fakeDeps();
    deps.upsertSubscription.mockRejectedValueOnce(new Error("db down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      (await handleSubscribe(post("/s", subscription, "good"), deps)).status,
    ).toBe(500);
    error.mockRestore();
  });

  it("unsubscribe deletes with the caller's own token", async () => {
    const deps = fakeDeps();
    expect(
      (await handleUnsubscribe(post("/u", { endpoint: "x" }), deps)).status,
    ).toBe(401);
    expect((await handleUnsubscribe(post("/u", {}, "good"), deps)).status).toBe(
      400,
    );
    const response = await handleUnsubscribe(
      post("/u", { endpoint: subscription.endpoint }, "good"),
      deps,
    );
    expect(response.status).toBe(200);
    expect(deps.deleteOwnSubscription).toHaveBeenCalledWith(
      "good",
      subscription.endpoint,
    );
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bun run test lib/server/pushSubscriptions.test.ts`
Expected: FAIL — `Cannot find module './pushSubscriptions'`.

- [ ] **Step 4: Viết `lib/server/pushSubscriptions.ts`**

```ts
import { z } from "zod";

const SubscribeBody = z.object({
  endpoint: z.url().startsWith("https://").max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});
const UnsubscribeBody = z.object({ endpoint: z.string().min(1).max(2048) });

export type SubscriptionRow = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
};

export type PushSubscriptionDeps = {
  userIdForToken(token: string): Promise<string | null>;
  upsertSubscription(row: SubscriptionRow): Promise<void>;
  deleteOwnSubscription(token: string, endpoint: string): Promise<void>;
};

export function bearerToken(header: string | null): string | null {
  const match = /^Bearer (\S+)$/.exec(header ?? "");
  return match ? match[1] : null;
}

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status });

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function authenticate(
  request: Request,
  deps: PushSubscriptionDeps,
): Promise<{ token: string; userId: string } | null> {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const userId = await deps.userIdForToken(token);
  return userId ? { token, userId } : null;
}

export async function handleSubscribe(
  request: Request,
  deps: PushSubscriptionDeps,
): Promise<Response> {
  try {
    const auth = await authenticate(request, deps);
    if (!auth) return json(401, { error: "unauthorized" });
    const body = SubscribeBody.safeParse(await readJson(request));
    if (!body.success) return json(400, { error: "invalid_body" });
    // Upsert by endpoint and always take the caller as owner: a phone that
    // changes user moves its subscription to the new user (spec §8.1).
    await deps.upsertSubscription({
      user_id: auth.userId,
      endpoint: body.data.endpoint,
      p256dh: body.data.keys.p256dh,
      auth: body.data.keys.auth,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    return json(200, { ok: true });
  } catch (error) {
    console.error("push subscribe failed", error);
    return json(500, { error: "server_error" });
  }
}

export async function handleUnsubscribe(
  request: Request,
  deps: PushSubscriptionDeps,
): Promise<Response> {
  try {
    const auth = await authenticate(request, deps);
    if (!auth) return json(401, { error: "unauthorized" });
    const body = UnsubscribeBody.safeParse(await readJson(request));
    if (!body.success) return json(400, { error: "invalid_body" });
    await deps.deleteOwnSubscription(auth.token, body.data.endpoint);
    return json(200, { ok: true });
  } catch (error) {
    console.error("push unsubscribe failed", error);
    return json(500, { error: "server_error" });
  }
}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bun run test lib/server/pushSubscriptions.test.ts`
Expected: PASS — 6 test.

- [ ] **Step 6: Viết `lib/server/env.ts` và `lib/server/supabaseServer.ts`**

`lib/server/env.ts`:

```ts
import { z } from "zod";

// Server-only secrets. Never import this file from a "use client" module.
const ServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export function parseServerEnv(
  raw: Record<string, string | undefined>,
): ServerEnv {
  const result = ServerEnvSchema.safeParse(raw);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Thiếu hoặc sai biến môi trường: ${names.join(", ")}`);
  }
  return result.data;
}

export function serverEnv(): ServerEnv {
  return parseServerEnv({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
```

`lib/server/supabaseServer.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";
import { serverEnv } from "./env";

const NO_SESSION = { persistSession: false, autoRefreshToken: false };

// Bypasses RLS. Only API routes use it, and only for the rows spec §3.1 allows.
export function supabaseServiceRole(): SupabaseClient<Database> {
  return createClient<Database>(
    publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    { auth: NO_SESSION },
  );
}

// Acts as the signed-in user, so RLS applies.
export function supabaseForUser(accessToken: string): SupabaseClient<Database> {
  const env = publicEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: NO_SESSION,
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
}
```

- [ ] **Step 7: Viết `lib/server/pushSubscriptionDeps.ts` và hai route**

`lib/server/pushSubscriptionDeps.ts`:

```ts
import type { PushSubscriptionDeps } from "./pushSubscriptions";
import { supabaseForUser, supabaseServiceRole } from "./supabaseServer";

export function supabasePushSubscriptionDeps(): PushSubscriptionDeps {
  return {
    async userIdForToken(token) {
      // The anon-key client is enough to check a token; the service role is
      // kept for the one write that needs it (spec §3.1).
      const { data, error } = await supabaseForUser(token).auth.getUser(token);
      return error ? null : (data.user?.id ?? null);
    },
    async upsertSubscription(row) {
      const { error } = await supabaseServiceRole()
        .from("push_subscriptions")
        .upsert(row, { onConflict: "endpoint" });
      if (error) throw error;
    },
    async deleteOwnSubscription(token, endpoint) {
      // The user's own token: RLS only lets them delete their own row.
      const { error } = await supabaseForUser(token)
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
      if (error) throw error;
    },
  };
}
```

`app/api/push/subscribe/route.ts`:

```ts
import { supabasePushSubscriptionDeps } from "@/lib/server/pushSubscriptionDeps";
import { handleSubscribe } from "@/lib/server/pushSubscriptions";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleSubscribe(request, supabasePushSubscriptionDeps());
}
```

`app/api/push/unsubscribe/route.ts`:

```ts
import { supabasePushSubscriptionDeps } from "@/lib/server/pushSubscriptionDeps";
import { handleUnsubscribe } from "@/lib/server/pushSubscriptions";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleUnsubscribe(request, supabasePushSubscriptionDeps());
}
```

- [ ] **Step 8: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  138 passed (138)` (132 của M1–M9 + 6); `next build` thành công, danh sách route có thêm `ƒ /api/push/subscribe` và `ƒ /api/push/unsubscribe` (ký hiệu `ƒ` là chạy theo yêu cầu).

Run: `grep -rl 'SUPABASE_SERVICE_ROLE_KEY' .next/static | wc -l`
Expected: `0` (khóa service role không nằm trong code gửi xuống trình duyệt).

- [ ] **Step 9: Thử API bằng bản production ở máy**

Run: `bun run start` (chạy nền; cổng 3000 bận thì `PORT=3100 bun run start` và đổi cổng bên dưới), rồi `curl -s -w ' %{http_code}\n' -X POST http://localhost:3000/api/push/subscribe -H 'content-type: application/json' -d '{}'`, rồi tắt server.
Expected: `{"error":"unauthorized"} 401`. Thiếu token thì handler trả 401 trước khi đụng tới biến môi trường, nên lệnh này chạy được cả khi máy chưa có service role.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(push): subscribe and unsubscribe API routes"
```

---

### Task 3: Bật thông báo trên máy, công tắc và tạm tắt

**Files:**

- Create: `lib/push/support.ts`, `lib/push/browser.ts`, `lib/rules/notifications.ts`, `lib/data/notificationPrefs.ts`, `lib/hooks/usePushRefresh.ts`, `components/push/DevicePushControl.tsx`, `components/settings/NotificationsSection.tsx`
- Modify: `components/settings/SettingsScreen.tsx` (import, props, 1 dòng JSX), `app/cai-dat/page.tsx` (thân `AuthGate`), `components/install/InstallGuide.tsx` (import, khối `standalone === true`), `components/Providers.tsx` (import, 1 dòng), `README.md` (thêm mục)
- Test: `lib/push/support.test.ts`, `lib/rules/notifications.test.ts`

**Interfaces:**

- Consumes:
  - `/api/push/subscribe`, `/api/push/unsubscribe` (Task 2); bảng `notification_prefs` (Task 1)
  - `supabase()`, `PermissionDeniedError`, `toVietnameseError`, `useNow`, `addDays`, `formatVnTime`, `vnDateString`
  - `navigator.serviceWorker.ready` (service worker của M9)
- Produces:
  - `type PushSupport = "ok" | "needs-install" | "unsupported"`; `pushSupport(env: PushEnvironment): PushSupport`
  - `urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer>`
  - `subscriptionBody(json): { endpoint; keys: { p256dh; auth } } | null`
  - `type DeviceState = PushSupport | "not-configured" | "denied" | "on" | "off"`
  - `deviceState()`, `enablePush()`, `disablePush()`: `Promise<DeviceState>`; `refreshPushSubscription(): Promise<void>`
  - `SNOOZE_HOURS = [2, 4, 8]`; `type PrefKey = "feed_reminder" | "wake_window" | "vaccine"`; `PREF_OPTIONS`
  - `snoozeUntil(now: Date, hours: number): string`; `snoozeText(until: string | null, now: Date): string | null`
  - `NotificationPrefs`, `DEFAULT_PREFS`, `fetchPrefs`, `savePrefs`, `useNotificationPrefs(userId)`, `useSavePrefs(userId)`
  - `DevicePushControl()`, `NotificationsSection({ userId })`, `usePushRefresh()`
  - `SettingsScreen({ member, baby, email, userId })`

- [ ] **Step 1: Đọc tài liệu**

Đọc `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`, mục "2. Implementing Web Push Notifications" (xin quyền, `pushManager.subscribe`, đổi khóa VAPID bằng `urlBase64ToUint8Array`).

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/push/support.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  pushSupport,
  subscriptionBody,
  urlBase64ToUint8Array,
} from "./support";

const full = {
  standalone: true,
  isIOS: true,
  hasServiceWorker: true,
  hasPushManager: true,
  hasNotification: true,
};

describe("push support", () => {
  it("asks iPhone users to install the app first", () => {
    expect(
      pushSupport({ ...full, standalone: false, hasPushManager: false }),
    ).toBe("needs-install");
    expect(pushSupport(full)).toBe("ok");
  });

  it("reports browsers without the push APIs", () => {
    expect(pushSupport({ ...full, isIOS: false, hasPushManager: false })).toBe(
      "unsupported",
    );
    expect(pushSupport({ ...full, isIOS: false, standalone: false })).toBe(
      "ok",
    );
  });

  it("urlBase64ToUint8Array decodes URL-safe base64 without padding", () => {
    expect([...urlBase64ToUint8Array("AQID-_8")]).toEqual([1, 2, 3, 251, 255]);
  });

  it("subscriptionBody keeps only the endpoint and both keys", () => {
    expect(
      subscriptionBody({
        endpoint: "https://web.push.apple.com/x",
        keys: { p256dh: "p", auth: "a" },
      }),
    ).toEqual({
      endpoint: "https://web.push.apple.com/x",
      keys: { p256dh: "p", auth: "a" },
    });
    expect(
      subscriptionBody({ endpoint: "https://x", keys: { p256dh: "p" } }),
    ).toBeNull();
  });
});
```

Tạo `lib/rules/notifications.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { snoozeText, snoozeUntil, SNOOZE_HOURS } from "./notifications";

const now = new Date("2026-11-14T13:00:00Z"); // 20:00 on 14/11 in VN

describe("notification snooze", () => {
  it("offers 2, 4 and 8 hours", () => {
    expect([...SNOOZE_HOURS]).toEqual([2, 4, 8]);
    expect(snoozeUntil(now, 2)).toBe("2026-11-14T15:00:00.000Z");
  });

  it("snoozeText shows the VN end time, with the day when it is not today", () => {
    expect(snoozeText(snoozeUntil(now, 2), now)).toBe(
      "Đang tạm tắt nhắc đến 22:00",
    );
    expect(snoozeText(snoozeUntil(now, 8), now)).toBe(
      "Đang tạm tắt nhắc đến 04:00 ngày mai",
    );
    expect(snoozeText("2026-11-16T01:00:00Z", now)).toBe(
      "Đang tạm tắt nhắc đến 08:00 ngày 16/11",
    );
  });

  it("snoozeText is null when not snoozed or already over", () => {
    expect(snoozeText(null, now)).toBeNull();
    expect(snoozeText("2026-11-14T12:59:00Z", now)).toBeNull();
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bun run test lib/push/support.test.ts lib/rules/notifications.test.ts`
Expected: FAIL — `Cannot find module './support'` và `Cannot find module './notifications'`.

- [ ] **Step 4: Viết `lib/push/support.ts` và `lib/rules/notifications.ts`**

`lib/push/support.ts`:

```ts
export type PushSupport = "ok" | "needs-install" | "unsupported";

export type PushEnvironment = {
  standalone: boolean;
  isIOS: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
};

// iPhone Safari only offers Web Push to an app opened from the Home Screen.
export function pushSupport(env: PushEnvironment): PushSupport {
  if (env.isIOS && !env.standalone) return "needs-install";
  if (!env.hasServiceWorker || !env.hasPushManager || !env.hasNotification)
    return "unsupported";
  return "ok";
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function subscriptionBody(json: {
  endpoint?: string;
  keys?: Record<string, string>;
}): { endpoint: string; keys: { p256dh: string; auth: string } } | null {
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) return null;
  return { endpoint: json.endpoint, keys: { p256dh, auth } };
}
```

`lib/rules/notifications.ts`:

```ts
import { addDays } from "./days";
import { formatVnTime, vnDateString } from "./time";

export const SNOOZE_HOURS = [2, 4, 8] as const;

export type PrefKey = "feed_reminder" | "wake_window" | "vaccine";

export const PREF_OPTIONS: {
  key: PrefKey;
  label: string;
  note: string | null;
}[] = [
  { key: "feed_reminder", label: "Nhắc cữ bú", note: null },
  {
    key: "wake_window",
    label: "Nhắc khi bé thức quá lâu",
    note: "Có từ đợt 2",
  },
  { key: "vaccine", label: "Nhắc lịch tiêm", note: "Có từ đợt 2" },
];

export function snoozeUntil(now: Date, hours: number): string {
  return new Date(now.getTime() + hours * 3_600_000).toISOString();
}

export function snoozeText(until: string | null, now: Date): string | null {
  if (!until || Date.parse(until) <= now.getTime()) return null;
  const end = new Date(until);
  const day = vnDateString(end);
  const today = vnDateString(now);
  const time = formatVnTime(end);
  if (day === today) return `Đang tạm tắt nhắc đến ${time}`;
  if (day === addDays(today, 1))
    return `Đang tạm tắt nhắc đến ${time} ngày mai`;
  const [, month, date] = day.split("-");
  return `Đang tạm tắt nhắc đến ${time} ngày ${date}/${month}`;
}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bun run test lib/push/support.test.ts lib/rules/notifications.test.ts`
Expected: PASS — support 4 test, notifications 3 test.

- [ ] **Step 6: Viết `lib/push/browser.ts`**

```ts
"use client";

import { supabase } from "@/lib/supabase/client";
import {
  pushSupport,
  subscriptionBody,
  urlBase64ToUint8Array,
  type PushSupport,
} from "./support";

export type DeviceState =
  PushSupport | "not-configured" | "denied" | "on" | "off";

// Inlined at build time; empty when the VAPID key is not set on Vercel.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function environment() {
  return {
    standalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasNotification: "Notification" in window,
  };
}

async function accessToken(): Promise<string> {
  const { data } = await supabase().auth.getSession();
  if (!data.session) throw new Error("Bạn cần đăng nhập lại.");
  return data.session.access_token;
}

async function post(path: string, body: unknown): Promise<void> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${await accessToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Máy chủ trả lỗi ${response.status}.`);
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const body = subscriptionBody(subscription.toJSON());
  if (!body) throw new Error("Trình duyệt không trả khóa thông báo.");
  await post("/api/push/subscribe", body);
}

// `ready` never settles when the service worker failed to register.
function registration(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Service worker chưa sẵn sàng. Mở lại app.")),
        5000,
      ),
    ),
  ]);
}

async function currentSubscription(): Promise<PushSubscription | null> {
  return (await registration()).pushManager.getSubscription();
}

export async function deviceState(): Promise<DeviceState> {
  const support = pushSupport(environment());
  if (support !== "ok") return support;
  if (!VAPID_PUBLIC_KEY || process.env.NODE_ENV !== "production")
    return "not-configured";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  return (await currentSubscription()) ? "on" : "off";
}

// Must run from a tap: iOS only shows the permission prompt for a user gesture.
export async function enablePush(): Promise<DeviceState> {
  const permission = await Notification.requestPermission();
  if (permission === "denied") return "denied";
  if (permission !== "granted") return "off";
  const sw = await registration();
  const subscription =
    (await sw.pushManager.getSubscription()) ??
    (await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  await saveSubscription(subscription);
  return "on";
}

export async function disablePush(): Promise<DeviceState> {
  const subscription = await currentSubscription();
  if (subscription) {
    await post("/api/push/unsubscribe", { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  }
  return "off";
}

// Spec §8.1: on every launch with permission, re-send the subscription so a
// rotated endpoint or a different signed-in user is picked up.
export async function refreshPushSubscription(): Promise<void> {
  if ((await deviceState()) !== "on") return;
  const subscription = await currentSubscription();
  if (subscription) await saveSubscription(subscription);
}
```

- [ ] **Step 7: Viết `lib/data/notificationPrefs.ts` và `lib/hooks/usePushRefresh.ts`**

`lib/data/notificationPrefs.ts`:

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PrefKey } from "@/lib/rules/notifications";
import { supabase } from "@/lib/supabase/client";
import { PermissionDeniedError } from "./errors";

export type NotificationPrefs = Record<PrefKey, boolean> & {
  snooze_until: string | null;
};

// Spec §5.2: no row means every switch is on and nothing is snoozed.
export const DEFAULT_PREFS: NotificationPrefs = {
  feed_reminder: true,
  wake_window: true,
  vaccine: true,
  snooze_until: null,
};

const prefsKey = (userId: string) => ["notification-prefs", userId] as const;

export async function fetchPrefs(userId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase()
    .from("notification_prefs")
    .select("feed_reminder, wake_window, vaccine, snooze_until")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? DEFAULT_PREFS;
}

export async function savePrefs(
  userId: string,
  patch: Partial<NotificationPrefs>,
): Promise<void> {
  // Upsert writes only the patched columns; a new row gets defaults for the rest.
  const { data, error } = await supabase()
    .from("notification_prefs")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select("user_id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

export function useNotificationPrefs(userId: string) {
  return useQuery({
    queryKey: prefsKey(userId),
    queryFn: () => fetchPrefs(userId),
  });
}

export function useSavePrefs(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => savePrefs(userId, patch),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: prefsKey(userId) }),
  });
}
```

`lib/hooks/usePushRefresh.ts`:

```ts
"use client";

import { useEffect } from "react";
import { refreshPushSubscription } from "@/lib/push/browser";

export function usePushRefresh(): void {
  useEffect(() => {
    // Push needs the service worker, which only exists in production builds.
    if (process.env.NODE_ENV !== "production") return;
    refreshPushSubscription().catch((error: unknown) => {
      console.warn("Không làm mới được đăng ký thông báo", error);
    });
  }, []);
}
```

- [ ] **Step 8: Tạo `components/push/DevicePushControl.tsx` và `components/settings/NotificationsSection.tsx`**

`components/push/DevicePushControl.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deviceState,
  disablePush,
  enablePush,
  type DeviceState,
} from "@/lib/push/browser";

const MESSAGE: Partial<Record<DeviceState, string>> = {
  "needs-install":
    "Cài Bé Yêu lên màn hình chính rồi mở từ biểu tượng để nhận thông báo.",
  unsupported: "Trình duyệt này không nhận được thông báo.",
  "not-configured": "Thông báo chưa được thiết lập trên máy chủ.",
  denied:
    "Bạn đã chặn thông báo. Mở Cài đặt iOS → Thông báo → Bé Yêu, bật Cho phép thông báo.",
  on: "Máy này đang nhận thông báo.",
};

export function DevicePushControl() {
  const [state, setState] = useState<DeviceState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    deviceState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);

  async function run(action: () => Promise<DeviceState>) {
    setBusy(true);
    setError(null);
    try {
      setState(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không bật được thông báo.");
    } finally {
      setBusy(false);
    }
  }

  if (state === null) return <p className="text-muted">Đang kiểm tra…</p>;
  return (
    <div className="flex flex-col gap-2">
      {MESSAGE[state] && (
        <p className={state === "on" ? "text-good-ink" : "text-muted"}>
          {MESSAGE[state]}
        </p>
      )}
      {state === "needs-install" && (
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center text-accent-ink underline"
        >
          Cách cài Bé Yêu lên màn hình chính
        </Link>
      )}
      {state === "off" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(enablePush)}
          className="min-h-11 rounded-xl bg-accent text-on-accent disabled:opacity-50"
        >
          Bật thông báo trên máy này
        </button>
      )}
      {state === "on" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(disablePush)}
          className="min-h-11 rounded-xl border disabled:opacity-50"
        >
          Tắt thông báo trên máy này
        </button>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
```

`components/settings/NotificationsSection.tsx`:

```tsx
"use client";

import { DevicePushControl } from "@/components/push/DevicePushControl";
import { toVietnameseError } from "@/lib/data/errors";
import {
  DEFAULT_PREFS,
  useNotificationPrefs,
  useSavePrefs,
} from "@/lib/data/notificationPrefs";
import { useNow } from "@/lib/hooks/useNow";
import {
  PREF_OPTIONS,
  SNOOZE_HOURS,
  snoozeText,
  snoozeUntil,
} from "@/lib/rules/notifications";

export function NotificationsSection({ userId }: { userId: string }) {
  const now = useNow(60_000);
  const prefs = useNotificationPrefs(userId);
  const save = useSavePrefs(userId);
  const values = prefs.data ?? DEFAULT_PREFS;
  const snoozed = snoozeText(values.snooze_until, now);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Thông báo</h2>
      <DevicePushControl />

      <div className="flex flex-col divide-y rounded-2xl border">
        {PREF_OPTIONS.map((option) => (
          <label
            key={option.key}
            className="flex min-h-12 items-center justify-between gap-3 px-4"
          >
            <span>
              {option.label}
              {option.note && (
                <span className="block text-sm text-muted">{option.note}</span>
              )}
            </span>
            <input
              type="checkbox"
              className="size-5"
              disabled={!prefs.isSuccess || save.isPending}
              checked={values[option.key]}
              onChange={(e) => save.mutate({ [option.key]: e.target.checked })}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted">
          {snoozed ??
            "Tạm tắt nhắc bú và nhắc thức trên mọi máy của bạn. Nhắc tiêm vẫn gửi."}
        </p>
        <div className="flex gap-2">
          {SNOOZE_HOURS.map((hours) => (
            <button
              key={hours}
              type="button"
              disabled={!prefs.isSuccess || save.isPending}
              onClick={() =>
                save.mutate({ snooze_until: snoozeUntil(new Date(), hours) })
              }
              className="min-h-11 flex-1 rounded-xl bg-soft disabled:opacity-50"
            >
              {hours} giờ
            </button>
          ))}
        </div>
        {snoozed && (
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate({ snooze_until: null })}
            className="min-h-11 rounded-xl border disabled:opacity-50"
          >
            Bật lại
          </button>
        )}
      </div>

      {(prefs.isError || save.isError) && (
        <p role="alert" className="text-danger">
          {toVietnameseError(prefs.error ?? save.error)}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 9: Gắn vào Cài đặt, Cài app và `Providers`**

1. `components/settings/SettingsScreen.tsx`:
   - Thêm import ngay sau dòng `import { MembersSection } from "./MembersSection";`:

     ```tsx
     import { NotificationsSection } from "./NotificationsSection";
     ```

   - Thay chữ ký hàm

```tsx
  baby,
  email,
}: {
  member: FamilyMember;
  baby: Baby;
  email: string;
}) {
```

   bằng

```tsx
  baby,
  email,
  userId,
}: {
  member: FamilyMember;
  baby: Baby;
  email: string;
  userId: string;
}) {
```

   - Thêm một dòng JSX ngay sau `<MembersSection me={member} />`:

     ```text
           <NotificationsSection userId={userId} />
     ```

2. `app/cai-dat/page.tsx`: thay

```tsx
        ctx?.baby ? (
          <SettingsScreen
            member={ctx.member}
            baby={ctx.baby}
            email={session?.user.email ?? ""}
          />
        ) : null
```

   bằng

```tsx
        ctx?.baby && session ? (
          <SettingsScreen
            member={ctx.member}
            baby={ctx.baby}
            email={session.user.email ?? ""}
            userId={session.user.id}
          />
        ) : null
```

3. `components/install/InstallGuide.tsx`: thêm `import { DevicePushControl } from "@/components/push/DevicePushControl";` ngay sau dòng `import Link from "next/link";`. Rồi thay

```tsx
      {standalone === true && (
        <p className="rounded-2xl bg-good-soft p-4 text-good-ink">
          Bé Yêu đã được cài và đang chạy từ màn hình chính.
        </p>
      )}
```

   bằng

```tsx
      {standalone === true && (
        <>
          <p className="rounded-2xl bg-good-soft p-4 text-good-ink">
            Bé Yêu đã được cài và đang chạy từ màn hình chính.
          </p>
          <DevicePushControl />
        </>
      )}
```

4. `components/Providers.tsx`: thêm `import { usePushRefresh } from "@/lib/hooks/usePushRefresh";` ngay trước dòng `import { useServiceWorker } from "@/lib/hooks/useServiceWorker";`. Rồi thêm dòng `usePushRefresh();` ngay sau dòng `useServiceWorker();`.

- [ ] **Step 10: Ghi hướng dẫn thiết lập vào `README.md`**

Thêm vào cuối mục "## Thiết lập lần đầu" (sau bước 6):

```markdown
7. Thông báo đẩy (M10):
   - Chạy `bunx web-push@3.6.7 generate-vapid-keys` một lần. Giữ kín Private Key.
   - Trên Vercel → Settings → Environment Variables, thêm:
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = Public Key
     - `VAPID_PRIVATE_KEY` = Private Key
     - `VAPID_SUBJECT` = `mailto:<email của bạn>`
     - `SUPABASE_SERVICE_ROLE_KEY` = khóa `service_role` ở Supabase → Project Settings → API Keys
   - Deploy lại để Vercel chép khóa công khai vào app.
```

- [ ] **Step 11: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  145 passed (145)` (138 + support 4 + notifications 3; gồm test chặn màu cứng); build thành công.

Run: `grep -rl 'SUPABASE_SERVICE_ROLE_KEY' .next/static | wc -l`
Expected: `0`.

- [ ] **Step 12: 👤 Kiểm tra tay trên localhost**

Chạy `bun run dev`. Ở dev không có service worker, nên phần bật thông báo chỉ kiểm được trên iPhone ở Step 14. Mở `http://localhost:3000/cai-dat` trong Claude in Chrome: bắt đầu bằng `tabs_context_mcp`, mở tab mới bằng `tabs_create_mcp`. Nếu Chrome không kết nối được, hỏi người dùng dùng trình duyệt nào trước khi đổi. Nhờ người dùng tự đăng nhập Google nếu cần. Kiểm tra cùng người dùng:

1. "Cài đặt" có phần "Thông báo" (sau Thành viên). Dòng đầu là "Thông báo chưa được thiết lập trên máy chủ." (vì đang chạy dev).
2. Có 3 công tắc đều đang bật. "Nhắc khi bé thức quá lâu" và "Nhắc lịch tiêm" có ghi chú "Có từ đợt 2".
3. Tắt "Nhắc cữ bú" → tải lại trang → vẫn tắt. Bật lại.
4. Bấm "2 giờ" → câu đổi thành "Đang tạm tắt nhắc đến HH:mm" (giờ hiện tại cộng 2 giờ) và hiện nút "Bật lại". Bấm "Bật lại" → câu trở về "Tạm tắt nhắc bú và nhắc thức trên mọi máy của bạn. Nhắc tiêm vẫn gửi.".
5. Trong Supabase dashboard → Table Editor → `notification_prefs` có đúng một dòng của người dùng với `snooze_until` rỗng.

- [ ] **Step 13: 👤 Thiết lập khóa trên Vercel**

Nhờ người dùng làm bước 7 của README (tự tạo khóa, tự dán vào Vercel). Không đọc hay in các khóa này. Chờ người dùng xác nhận đã thêm đủ 4 biến.

- [ ] **Step 14: Commit, deploy, kiểm tra trên iPhone**

```bash
git add -A && git commit -m "feat(push): enable notifications per device, preference switches and snooze"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app. Nhờ người dùng thử trên iPhone 16 hoặc 17 Pro (iPhone 11 đang iOS 16.3, chưa đủ 16.4 cho Web Push):

1. Mở Bé Yêu từ màn hình chính (đóng hẳn rồi mở lại một lần để service worker mới tiếp quản), vào "Cài đặt" → phần "Thông báo" có nút "Bật thông báo trên máy này".
2. Bấm nút → iOS hỏi quyền → "Cho phép" → dòng đổi thành "Máy này đang nhận thông báo.".
3. Supabase → Table Editor → `push_subscriptions` có một dòng mới với `user_id` của người dùng, `endpoint` bắt đầu bằng `https://web.push.apple.com/`.
4. Vào "Cài app" → thấy "Bé Yêu đã được cài…" và cùng dòng "Máy này đang nhận thông báo.".
5. Quay lại "Cài đặt" bấm "Tắt thông báo trên máy này" → dòng biến mất khỏi `push_subscriptions`. Bấm "Bật thông báo trên máy này" lần nữa để giữ đăng ký cho M11.
6. Mở Safari thường (không phải app đã cài) vào bunkid.vercel.app/cai-dat → phần Thông báo ghi "Cài Bé Yêu lên màn hình chính rồi mở từ biểu tượng để nhận thông báo.".

Nhờ người dùng xác nhận đạt.

---

## Ngoài phạm vi M10

- **M11: gửi nhắc bú.**
  - Route `/api/push/dispatch`:
    - Xác thực `CRON_SECRET` (so sánh thời gian hằng định).
    - Luật chọn §8.3 cho `feed`.
    - `notification_log` để không gửi trùng.
    - Gửi bằng `web-push`, TTL 3600 giây, `urgency: 'high'`.
    - Gặp lỗi 404/410 thì xóa đăng ký; gửi được thì cập nhật `last_success_at`.
  - pg_cron + pg_net gọi route mỗi phút, đọc `app_url`/`cron_secret` từ Vault.
  - Checklist thiết bị bước 2 và 7.
- **Đợt 2:** nhắc `wake` và `vaccine` (đã có công tắc, chưa gửi).
  - Ghi chú cho M11: nếu `/api/push/unsubscribe` xóa 0 dòng (máy vừa đổi người dùng mà chưa làm mới đăng ký), dòng cũ chỉ bị dọn khi gửi push gặp lỗi 404/410.
- **M12:** outbox ghi offline §9; tắt các nút cần mạng (gồm phần Thông báo) kèm "Cần kết nối mạng" khi offline.
