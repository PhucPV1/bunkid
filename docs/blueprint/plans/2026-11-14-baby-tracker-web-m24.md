# Baby Tracker Web — M24 (Ảnh) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/anh` (spec §6.14): chọn ảnh từ máy, nén trên máy (cạnh dài tối đa 1600 px, JPEG 0.8, bỏ EXIF), tải vào bucket Storage riêng tư `photos`, xem lưới ảnh theo tháng tuổi bằng signed URL 1 giờ, hiện dung lượng đã dùng so với 1 GB (cảnh báo từ 900 MB, chặn tải từ 1000 MB), xóa ảnh theo quyền.

**Architecture:**
- **Dữ liệu (§5, §5.2):** migration `20261114000800_photos.sql` tạo bảng `photos` (`id` do client sinh, trùng tên file), bucket `photos` (private, chỉ `image/jpeg`, tối đa 5 MB/file) và policy trên `storage.objects` theo thư mục `<family_id>/<baby_id>/`; pgTAP `010`.
- **Quy tắc thuần** (`lib/rules/photos.ts`): kích thước sau thu nhỏ, đường dẫn, mức dung lượng, tháng tuổi và nhóm ảnh, ngày chụp mặc định, kiểm form.
- **Nén ảnh** (`lib/photoCompress.ts`): `createImageBitmap(file, { imageOrientation: "from-image" })` → canvas → `toBlob("image/jpeg", 0.8)`; vẽ lại nên mất EXIF.
- **Giao diện:** `components/photos/PhotosScreen.tsx` (thanh dung lượng, form tải lên trong `OnlineOnly`, lưới 3 cột theo tháng tuổi, xem ảnh lớn, xóa).

**Tech Stack:** như M1–M23. Không thêm gói nào.

**Milestones của đợt phát hành 3:**
- M22, M23: xong.
- **M24 (plan này):** ảnh; checklist bước 17.
- M25: mốc phát triển (đánh dấu đã đạt, gắn ảnh từ M24). M26: báo cáo cho bác sĩ, chốt đợt 3.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Bảng `photos`:** đúng cột §5 (`id, baby_id, storage_path unique, taken_on, caption, size_bytes, created_by, created_at`). `id` không có default: client sinh `crypto.randomUUID()` và dùng làm tên file. Ràng buộc thêm: `storage_path` khớp `<uuid>/<uuid>/<uuid>.jpg`, `caption` 1–200 ký tự, `size_bytes` 1–5 242 880, `taken_on` bắt buộc. Trigger `forbid_immutable_change('id', 'baby_id', 'created_by', 'storage_path')`.
- **RLS bảng (§5.2, cùng dòng với `logs`):** select M; insert M và Mine, thêm điều kiện `storage_path` nằm trong thư mục `<family_id của bé>/<baby_id>/`; update, delete: O hoặc (M và Mine).
- **Storage (§5.2):** bucket `photos` private. Policy trên `storage.objects` với `bucket_id = 'photos'`: select khi là thành viên của gia đình ở thư mục 1; insert như vậy và thư mục 2 phải là bé của chính gia đình đó; delete khi là chủ gia đình hoặc (thành viên và `owner_id = auth.uid()::text`). Thư mục được đọc qua hai hàm `public.object_family(name)`, `public.object_baby(name)` trả `null` khi không phải uuid, để policy không bao giờ lỗi ép kiểu.
- **Test xóa object:** Supabase chặn `delete` trực tiếp trên `storage.objects` bằng trigger, trừ khi đặt `storage.allow_delete_query = 'true'` (Storage API làm vậy). pgTAP đặt cờ này trong transaction để kiểm policy xóa.
- **Tải lên:** nén → upload `contentType: image/jpeg`, `upsert: false` → thêm dòng `photos` với `size_bytes` = kích thước file đã nén. Thêm dòng lỗi thì xóa lại object vừa tải (để không có file mồ côi). Ảnh chỉ tải khi có mạng (§9).
- **Ngày chụp:** iOS đặt `lastModified` của ảnh chọn từ thư viện thành lúc chọn, nên trước khi nén app đọc 128 KB đầu của file và lấy `DateTimeOriginal` (hoặc `DateTime`) trong EXIF bằng `exifDate` (bộ đọc nhỏ, không thêm gói). Không có EXIF thì dùng ngày của `lastModified`. Kết quả kẹp trong khoảng ngày sinh..hôm nay; sửa được. Ghi chú không bắt buộc.
- **Lưới ảnh:** 1000 ảnh mới nhất (giới hạn một lần đọc của PostgREST), nhóm theo tháng tuổi tại ngày chụp ("Dưới 1 tháng tuổi", "N tháng tuổi"), nhóm và ảnh mới nhất trước. Mỗi nhóm lấy link riêng bằng `createSignedUrls(paths, 3600)`, giữ 50 phút rồi tự lấy lại, và giữ link cũ trong lúc tải link mới (thêm hoặc xóa ảnh không làm trắng cả lưới).
- **Dung lượng:** tổng tính trên server bằng `public.photos_total_bytes()` (security invoker, nên chỉ cộng ảnh người gọi thấy được — ảnh của gia đình), không phụ thuộc giới hạn 1000 dòng; hiện "Đã dùng N MB / 1 GB"; từ 900 MB thêm "Sắp đầy dung lượng."; từ 1000 MB form tải lên ẩn đi và hiện "Đã đầy, không tải thêm ảnh được; xóa bớt ảnh cũ.".
- **Xóa (§5.2):** xóa object Storage trước, rồi xóa dòng. Storage trả 0 object (object đã mất sau một lần xóa dở dang, hoặc không có quyền) thì vẫn xóa dòng; bảng trả 0 dòng → "Bạn không có quyền thực hiện thao tác này". Nút "Xóa ảnh" chỉ hiện với chủ gia đình hoặc người đã tải ảnh lên, có hộp xác nhận.
- **Ảnh không đọc được:** nén lỗi (định dạng lạ, ảnh quá lớn với bộ nhớ máy) báo "Không đọc được ảnh này, thử ảnh khác.". Ảnh 48 MP được giải mã đầy đủ trước khi thu nhỏ; nếu máy cũ thiếu bộ nhớ thì gặp đúng câu báo này.
- **`db push`:** người dùng đã cho phép trước chạy `bunx supabase db push --linked --yes` cho migration chỉ thêm bảng, bucket và policy mới đã duyệt.
- **Bước của người dùng:** checklist bước 17 cần điện thoại thật; ghi là đang chờ.

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

Từ spec §2.2, §9 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `@tanstack/react-query-persist-client` 5.105.0, `dexie` 4.4.7, `web-push` 3.6.7, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `@types/web-push` 3.6.4, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x. TypeScript `strict: true`.
- Mọi trang là client component, tự kiểm tra phiên ở client.
- Bản ghi còn trong outbox hiện biểu tượng ⏳. Đầu trang có chip "N mục chờ đồng bộ". Bỏ mục: toast "Không lưu được: <lý do>" (§9).
- Các thao tác ghi không qua outbox cần online: ảnh, thành viên, hồ sơ bé (`babies`), `music_links`, `emergency_contacts`, `notification_prefs`, đăng ký push. Offline thì nút bị tắt kèm chú thích "Cần kết nối mạng" (§9).
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.
- Runtime: Node.js 22.x.

Từ M7:

- File `.tsx` trong `app/` và `components/` chỉ dùng màu theo vai trò (`bg-warn-soft`, `text-warn-ink`, `bg-danger-soft`, `text-danger-ink`…). `lib/themeGuard.test.ts` khóa quy tắc này.

Riêng M24:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/photos.ts` và `components/photos/` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, tới commit cuối của M23):

- M1: `babies`, `is_member`, `is_owner`, `baby_family`, `forbid_immutable_change`; M13: `OnlineOnly`; `PermissionDeniedError`, `toVietnameseError`; `vnDateString` (`lib/rules/time.ts`)
- `TOOL_ITEMS` (`lib/nav.ts`), `sw/sw.template.js`, checklist tới bước 16

**Produces** (M25 — mốc phát triển gắn ảnh — và M26 dùng):

- Bảng `photos`, bucket `photos`, hàm `public.object_family`, `public.object_baby`; `PhotoRow`
- `public.photos_total_bytes()`; `lib/rules/exifDate.ts`: `exifDate(bytes)`
- `lib/rules/photos.ts`: `MAX_SIDE`, `JPEG_QUALITY`, `QUOTA_BYTES`, `WARN_BYTES`, `BLOCK_BYTES`, `fitWithin`, `photoPath`, `Usage`, `usage`, `ageMonthsOn`, `monthLabel`, `groupByAgeMonth`, `defaultTakenOn`, `parsePhotoForm`
- `lib/photoCompress.ts`: `compressPhoto(file): Promise<Blob>`, `PhotoReadError`, `readHead(file)`
- `lib/data/photos.ts`: `usePhotos(babyId)` (key `["photos", babyId]`), `usePhotosUsage(familyId)`, `usePhotoUrls(paths)`, `usePhotoActions(babyId, familyId) → { upload, remove }`
- `PhotosScreen({ baby, userId, isOwner })`; trang `/anh`; checklist bước 17

## File Structure

```
supabase/migrations/20261114000800_photos.sql, supabase/tests/010_photos.test.sql
lib/supabase/types.ts, lib/supabase/rows.ts   # sinh lại; PhotoRow
lib/rules/photos.ts (+ test)             # thu nhỏ, đường dẫn, dung lượng, tháng tuổi, form
lib/rules/exifDate.ts (+ test)           # ngày chụp trong EXIF
lib/photoCompress.ts                     # canvas → JPEG 0.8
lib/data/photos.ts; components/photos/PhotosScreen.tsx; app/anh/page.tsx
lib/nav.ts (+ test), sw/sw.template.js, docs/device-checklist.md
```

## Tasks

1. Bảng `photos`, bucket và policy Storage
2. Quy tắc ảnh
3. Trang `/anh`
4. Checklist bước 17 và deploy

---

### Task 1: Bảng `photos`, bucket và policy Storage

**Files:**

- Create: `supabase/migrations/20261114000800_photos.sql`
- Modify: `lib/supabase/types.ts` (sinh lại), `lib/supabase/rows.ts`
- Test: `supabase/tests/010_photos.test.sql`

**Interfaces:**

- Consumes: `public.babies`, `is_member`, `is_owner`, `baby_family`, `forbid_immutable_change` (M1); `storage.buckets`, `storage.objects`, `storage.foldername` (Supabase)
- Produces: bảng `public.photos`; bucket `photos`; `public.object_family(text)`, `public.object_baby(text)`; policy `photos_objects_select/insert/delete`; `PhotoRow`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m24.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `docs: device checklist steps 5 and 16` của M23.

- [ ] **Step 2: Viết test pgTAP thất bại**

Tạo `supabase/tests/010_photos.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000010', 'pa@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000010', 'pb@example.com'),
  ('cccccccc-0000-0000-0000-000000000010', 'pc@example.com');
insert into public.families (id, name) values
  ('f0000000-0000-0000-0000-000000000010', 'Nhà P'),
  ('f0000000-0000-0000-0000-000000000011', 'Nhà khác');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000010', 'pa@example.com', 'aaaaaaaa-0000-0000-0000-000000000010', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000010', 'pb@example.com', 'bbbbbbbb-0000-0000-0000-000000000010', 'member', 'Bà'),
  ('f0000000-0000-0000-0000-000000000011', 'pc@example.com', 'cccccccc-0000-0000-0000-000000000010', 'owner', 'Khác');
insert into public.babies (id, family_id, name, dob, sex) values
  ('ba000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000010', 'Bé', '2026-09-14', 'female'),
  ('ba000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', 'Bé khác', '2026-09-14', 'male');
insert into storage.objects (bucket_id, name, owner_id) values
  ('photos', 'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/a0000000-0000-0000-0000-000000000010.jpg', 'aaaaaaaa-0000-0000-0000-000000000010');
insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by) values
  ('a0000000-0000-0000-0000-000000000010', 'ba000000-0000-0000-0000-000000000010',
   'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/a0000000-0000-0000-0000-000000000010.jpg',
   '2026-11-01', 250000, 'aaaaaaaa-0000-0000-0000-000000000010');

select is((select public from storage.buckets where id = 'photos'), false, 'the photos bucket is private');

-- The Storage API deletes objects with this flag set; tests delete directly the same way.
select set_config('storage.allow_delete_query', 'true', true);

-- As C (other family)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000010","email":"pc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.photos', 'outsider sees no photo rows');
select is_empty($$ select name from storage.objects where bucket_id = 'photos' and name like 'f0000000-0000-0000-0000-000000000010/%' $$,
  'outsider sees no photo objects of another family');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000010","email":"pb@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ select name from storage.objects where name like '%/a0000000-0000-0000-0000-000000000010.jpg' $$,
  'member can read the owner''s object (needed for signed URLs)');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('photos', 'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/b0000000-0000-0000-0000-000000000010.jpg', 'bbbbbbbb-0000-0000-0000-000000000010') $$,
  'member uploads into the family folder');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('photos', 'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/e0000000-0000-0000-0000-000000000010.jpg', 'bbbbbbbb-0000-0000-0000-000000000010') $$,
  'member uploads a second object');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('photos', 'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000011/c0000000-0000-0000-0000-000000000010.jpg', 'bbbbbbbb-0000-0000-0000-000000000010') $$,
  '42501', null, 'member cannot upload under a baby of another family');
select lives_ok(
  $$ insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes) values
     ('b0000000-0000-0000-0000-000000000010', 'ba000000-0000-0000-0000-000000000010',
      'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/b0000000-0000-0000-0000-000000000010.jpg',
      '2026-11-14', 180000) $$,
  'member adds the photo row');
select throws_ok(
  $$ insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes) values
     ('d0000000-0000-0000-0000-000000000010', 'ba000000-0000-0000-0000-000000000010',
      'f0000000-0000-0000-0000-000000000011/ba000000-0000-0000-0000-000000000011/d0000000-0000-0000-0000-000000000010.jpg',
      '2026-11-14', 180000) $$,
  '42501', null, 'a photo row cannot point into another family''s folder');
select is_empty(
  $$ delete from storage.objects where name like '%/a0000000-0000-0000-0000-000000000010.jpg' returning name $$,
  'member cannot delete the owner''s object');
select is_empty(
  $$ delete from public.photos where id = 'a0000000-0000-0000-0000-000000000010' returning id $$,
  'member cannot delete the owner''s photo row');
select isnt_empty(
  $$ delete from storage.objects where name like '%/e0000000-0000-0000-0000-000000000010.jpg' returning name $$,
  'member deletes an object they uploaded (upload rollback)');
select is(public.photos_total_bytes(), 430000::bigint, 'member sees the family''s total bytes');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000010","email":"pa@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ delete from storage.objects where name like '%/b0000000-0000-0000-0000-000000000010.jpg' returning name $$,
  'owner deletes the member''s object');
select isnt_empty(
  $$ delete from public.photos where id = 'b0000000-0000-0000-0000-000000000010' returning id $$,
  'owner deletes the member''s photo row');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `010_photos.test.sql` báo lỗi (bucket `photos` chưa có hoặc `relation "public.photos" does not exist`); `001`…`009` vẫn `ok`.

- [ ] **Step 4: Viết migration**

Tạo `supabase/migrations/20261114000800_photos.sql`:

```sql
-- Spec §5, §5.2, §6.14: photo rows plus the private Storage bucket "photos",
-- objects stored at <family_id>/<baby_id>/<uuid>.jpg.
create table public.photos (
  id uuid primary key,
  baby_id uuid not null references public.babies (id) on delete cascade,
  storage_path text not null unique
    check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'),
  taken_on date not null,
  caption text check (caption is null or length(btrim(caption)) between 1 and 200),
  size_bytes int not null check (size_bytes between 1 and 5242880),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create index photos_baby_taken_idx on public.photos (baby_id, taken_on desc);

create trigger photos_immutable before update on public.photos
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by', 'storage_path');

alter table public.photos enable row level security;

create policy photos_select on public.photos for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
-- The row must point at an object inside its own family's and baby's folder.
create policy photos_insert on public.photos for insert to authenticated
  with check (
    public.is_member(public.baby_family(baby_id))
    and created_by = auth.uid()
    and storage_path like public.baby_family(baby_id)::text || '/' || baby_id::text || '/%'
  );
create policy photos_update on public.photos for update to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  )
  with check (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
create policy photos_delete on public.photos for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );

-- Spec §6.14: bytes used by the photos the caller can see (their family's). An
-- aggregate, so the quota stays right past the 1000-row page limit.
create function public.photos_total_bytes() returns bigint
language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(size_bytes), 0)::bigint from public.photos
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

-- Folder 1 of an object name as a family id, or null when it is not a uuid
-- (so a malformed name never raises inside a policy).
create function public.object_family(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case
    when (storage.foldername(object_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(object_name))[1])::uuid
  end
$$;

create function public.object_baby(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case
    when (storage.foldername(object_name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(object_name))[2])::uuid
  end
$$;

create policy photos_objects_select on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_member(public.object_family(name)));
create policy photos_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and public.is_member(public.object_family(name))
    and public.baby_family(public.object_baby(name)) = public.object_family(name)
  );
create policy photos_objects_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (
      public.is_owner(public.object_family(name))
      or (public.is_member(public.object_family(name)) and owner_id = auth.uid()::text)
    )
  );
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001`…`009` `ok`, `010_photos.test.sql .. ok`, `All tests successful.`

- [ ] **Step 6: Sinh lại kiểu, thêm `PhotoRow`**

Run: `bun run db:types && grep -c '"photos"' lib/supabase/types.ts`
Expected: số đếm ≥ 1.

Thêm dòng cuối vào `lib/supabase/rows.ts`:

```ts
export type PhotoRow = Tables["photos"]["Row"];
```

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; `Tests  287 passed (287)`.

- [ ] **Step 7: Commit và đưa migration lên cloud**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m24.md supabase/migrations/20261114000800_photos.sql supabase/tests/010_photos.test.sql lib/supabase/types.ts lib/supabase/rows.ts && git commit -m "feat(photos): photos table, private bucket and storage policies"
```

Run: `bunx supabase db push --linked --yes`
Expected: `Applying migration 20261114000800_photos.sql...`, `Finished supabase db push.` Nếu CLI cần mật khẩu DB, báo chưa link project, hoặc báo lỗi quyền trên schema `storage`, dừng bước này và ghi vào báo cáo cuối như việc người dùng tự làm (người dùng chạy được migration đó trong Supabase SQL Editor).

---

### Task 2: Quy tắc ảnh

**Files:**

- Create: `lib/rules/photos.ts`, `lib/rules/exifDate.ts`
- Test: `lib/rules/photos.test.ts`, `lib/rules/exifDate.test.ts`

**Interfaces:**

- Consumes: `vnDateString` (`lib/rules/time.ts`)
- Produces: `exifDate(bytes: Uint8Array): string | null`; `fitWithin(width, height, max?)`, `photoPath(familyId, babyId, id)`, `usage(totalBytes): { level: "ok" | "warn" | "full"; text; percent }`, `ageMonthsOn(dob, day)`, `monthLabel(months)`, `groupByAgeMonth(photos, dob)`, `defaultTakenOn(exifDay, lastModified, dob, now)`, `parsePhotoForm({ takenOn, caption }, { dob, today })`; các hằng `MAX_SIDE`, `JPEG_QUALITY`, `QUOTA_BYTES`, `WARN_BYTES`, `BLOCK_BYTES`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/photos.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  ageMonthsOn,
  defaultTakenOn,
  fitWithin,
  groupByAgeMonth,
  parsePhotoForm,
  photoPath,
  usage,
} from "./photos";

const MB = 1024 ** 2;

describe("fitWithin (spec §6.14)", () => {
  it("keeps small images and scales the longest side down to 1600 px", () => {
    expect(fitWithin(1200, 800)).toEqual({ width: 1200, height: 800 });
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(1600, 900)).toEqual({ width: 1600, height: 900 });
  });
});

describe("photoPath", () => {
  it("uses <family_id>/<baby_id>/<uuid>.jpg", () => {
    expect(photoPath("f", "b", "p")).toBe("f/b/p.jpg");
  });
});

describe("usage (spec §6.14)", () => {
  it("warns from 900 MB and blocks from 1000 MB", () => {
    expect(usage(250 * MB)).toEqual({
      level: "ok",
      percent: (250 / 1024) * 100,
      text: "Đã dùng 250 MB / 1 GB",
    });
    expect(usage(900 * MB).level).toBe("warn");
    expect(usage(900 * MB).text).toBe(
      "Đã dùng 900 MB / 1 GB. Sắp đầy dung lượng.",
    );
    expect(usage(1000 * MB).level).toBe("full");
    expect(usage(2000 * MB).percent).toBe(100);
  });
});

describe("months of age", () => {
  it("counts whole months between dob and the day", () => {
    expect(ageMonthsOn("2026-09-14", "2026-10-13")).toBe(0);
    expect(ageMonthsOn("2026-09-14", "2026-10-14")).toBe(1);
    expect(ageMonthsOn("2026-01-31", "2026-03-01")).toBe(1);
    expect(ageMonthsOn("2026-09-14", "2026-09-01")).toBe(0);
  });

  it("groups photos by month of age, newest group and photo first", () => {
    const p = (
      id: string,
      taken_on: string,
      created_at = "2026-11-14T00:00:00Z",
    ) => ({
      id,
      taken_on,
      created_at,
    });
    const groups = groupByAgeMonth(
      [
        p("a", "2026-09-20"),
        p("b", "2026-11-14"),
        p("c", "2026-10-20"),
        p("d", "2026-11-14", "2026-11-14T05:00:00Z"),
      ],
      "2026-09-14",
    );
    expect(groups.map((g) => [g.label, g.photos.map((x) => x.id)])).toEqual([
      ["2 tháng tuổi", ["d", "b"]],
      ["1 tháng tuổi", ["c"]],
      ["Dưới 1 tháng tuổi", ["a"]],
    ]);
  });
});

describe("photo form", () => {
  const now = new Date("2026-11-14T03:00:00Z");
  it("defaults the day to the EXIF day, else the file date, within dob..today", () => {
    const picked = Date.parse("2026-11-14T02:00:00Z");
    expect(defaultTakenOn("2026-10-05", picked, "2026-09-14", now)).toBe(
      "2026-10-05",
    );
    expect(
      defaultTakenOn(null, Date.parse("2026-11-10T20:00:00Z"), "2026-09-14", now),
    ).toBe("2026-11-11");
    expect(defaultTakenOn("2025-01-01", picked, "2026-09-14", now)).toBe(
      "2026-09-14",
    );
    expect(
      defaultTakenOn(null, Date.parse("2027-01-01T00:00:00Z"), "2026-09-14", now),
    ).toBe("2026-11-14");
  });

  it("checks the day and the caption", () => {
    const ctx = { dob: "2026-09-14", today: "2026-11-14" };
    expect(
      parsePhotoForm(
        { takenOn: "2026-11-14", caption: "  Lần đầu cười " },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: { taken_on: "2026-11-14", caption: "Lần đầu cười" },
    });
    expect(parsePhotoForm({ takenOn: "2026-11-15", caption: "" }, ctx)).toEqual(
      {
        ok: false,
        message: "Ngày chụp phải từ ngày sinh đến hôm nay.",
      },
    );
    expect(
      parsePhotoForm({ takenOn: "2026-11-14", caption: "x".repeat(201) }, ctx),
    ).toEqual({
      ok: false,
      message: "Ghi chú tối đa 200 ký tự.",
    });
  });
});
```

Tạo `lib/rules/exifDate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { exifDate } from "./exifDate";

// Builds a minimal JPEG: SOI, APP1 "Exif" with IFD0 (DateTime, ExifIFD pointer)
// and an Exif IFD holding DateTimeOriginal.
function jpeg(little: boolean, original: string | null, dateTime: string) {
  const tiff: number[] = [];
  const u16 = (n: number) => (little ? [n & 0xff, n >> 8] : [n >> 8, n & 0xff]);
  const u32 = (n: number) =>
    little
      ? [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, n >>> 24]
      : [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  const text = (s: string) => [...s].map((c) => c.charCodeAt(0)).concat(0);
  // Layout: header(8) | IFD0 at 8: 2 entries (2+24+4=30) | ExifIFD at 38: 1 entry (2+12+4=18)
  // | DateTime string at 56 (20 bytes) | DateTimeOriginal at 76 (20 bytes)
  tiff.push(...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8));
  tiff.push(...u16(2));
  tiff.push(...u16(0x0132), ...u16(2), ...u32(20), ...u32(56));
  tiff.push(...u16(0x8769), ...u16(4), ...u32(1), ...u32(original ? 38 : 0));
  tiff.push(...u32(0));
  tiff.push(...u16(original ? 1 : 0));
  if (original) tiff.push(...u16(0x9003), ...u16(2), ...u32(20), ...u32(76));
  else tiff.push(...new Array(12).fill(0));
  tiff.push(...u32(0));
  tiff.push(...text(dateTime));
  tiff.push(...text(original ?? "0000:00:00 00:00:00"));
  const body = [...text("Exif"), 0, ...tiff];
  const size = body.length + 2;
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe1,
    size >> 8,
    size & 0xff,
    ...body,
    0xff,
    0xd9,
  ]);
}

describe("exifDate", () => {
  it("reads DateTimeOriginal in both byte orders", () => {
    expect(
      exifDate(jpeg(true, "2026:10:05 08:30:00", "2026:11:01 10:00:00")),
    ).toBe("2026-10-05");
    expect(
      exifDate(jpeg(false, "2026:09:20 22:10:00", "2026:11:01 10:00:00")),
    ).toBe("2026-09-20");
  });

  it("falls back to DateTime, and returns null for files without EXIF", () => {
    expect(exifDate(jpeg(true, null, "2026:11:01 10:00:00"))).toBe(
      "2026-11-01",
    );
    expect(exifDate(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
    expect(exifDate(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
    expect(exifDate(new Uint8Array(0))).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/photos.test.ts lib/rules/exifDate.test.ts`
Expected: FAIL — `Error: Cannot find module './photos' imported from …/lib/rules/photos.test.ts` và `Error: Cannot find module './exifDate' imported from …/lib/rules/exifDate.test.ts`

- [ ] **Step 3: Viết quy tắc**

Tạo `lib/rules/photos.ts`:

```ts
import { vnDateString } from "./time";

// Spec §6.14: longest side at most 1600 px, JPEG quality 0.8.
export const MAX_SIDE = 1600;
export const JPEG_QUALITY = 0.8;
export const QUOTA_BYTES = 1024 ** 3;
export const WARN_BYTES = 900 * 1024 ** 2;
export const BLOCK_BYTES = 1000 * 1024 ** 2;

export function fitWithin(
  width: number,
  height: number,
  max: number = MAX_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

// Spec §5.2: <family_id>/<baby_id>/<uuid>.jpg.
export function photoPath(
  familyId: string,
  babyId: string,
  id: string,
): string {
  return `${familyId}/${babyId}/${id}.jpg`;
}

export type Usage = {
  level: "ok" | "warn" | "full";
  text: string;
  percent: number;
};

const mb = (bytes: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(
    bytes / 1024 ** 2,
  );

export function usage(totalBytes: number): Usage {
  const percent = Math.min(100, (totalBytes / QUOTA_BYTES) * 100);
  const text = `Đã dùng ${mb(totalBytes)} MB / 1 GB`;
  if (totalBytes >= BLOCK_BYTES)
    return {
      level: "full",
      percent,
      text: `${text}. Đã đầy, không tải thêm ảnh được; xóa bớt ảnh cũ.`,
    };
  if (totalBytes >= WARN_BYTES)
    return { level: "warn", percent, text: `${text}. Sắp đầy dung lượng.` };
  return { level: "ok", percent, text };
}

// Whole months of age on a given day (VN dates), never below 0.
export function ageMonthsOn(dob: string, day: string): number {
  const [y1, m1, d1] = dob.split("-").map(Number);
  const [y2, m2, d2] = day.split("-").map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) months -= 1;
  return Math.max(0, months);
}

export function monthLabel(months: number): string {
  if (months === 0) return "Dưới 1 tháng tuổi";
  return `${months} tháng tuổi`;
}

// Spec §6.14: grid grouped by month of age, newest first.
export function groupByAgeMonth<
  T extends { taken_on: string; created_at: string },
>(photos: T[], dob: string): { months: number; label: string; photos: T[] }[] {
  const groups = new Map<number, T[]>();
  for (const photo of photos) {
    const months = ageMonthsOn(dob, photo.taken_on);
    groups.set(months, [...(groups.get(months) ?? []), photo]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([months, list]) => ({
      months,
      label: monthLabel(months),
      photos: list.sort(
        (a, b) =>
          b.taken_on.localeCompare(a.taken_on) ||
          b.created_at.localeCompare(a.created_at),
      ),
    }));
}

// Default "Ngày chụp": the EXIF capture day if the photo has one, otherwise the
// file's last-modified day (VN time), kept within dob..today.
export function defaultTakenOn(
  exifDay: string | null,
  lastModified: number,
  dob: string,
  now: Date,
): string {
  const day = exifDay ?? vnDateString(new Date(lastModified));
  const today = vnDateString(now);
  if (day < dob) return dob;
  return day > today ? today : day;
}

export function parsePhotoForm(
  raw: { takenOn: string; caption: string },
  ctx: { dob: string; today: string },
):
  | { ok: true; value: { taken_on: string; caption: string | null } }
  | {
      ok: false;
      message: string;
    } {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.takenOn) ||
    raw.takenOn < ctx.dob ||
    raw.takenOn > ctx.today
  )
    return { ok: false, message: "Ngày chụp phải từ ngày sinh đến hôm nay." };
  const caption = raw.caption.trim();
  if (caption.length > 200)
    return { ok: false, message: "Ghi chú tối đa 200 ký tự." };
  return {
    ok: true,
    value: { taken_on: raw.takenOn, caption: caption || null },
  };
}
```

Tạo `lib/rules/exifDate.ts`:

```ts
// Reads DateTimeOriginal (or DateTime) from the EXIF block of a JPEG and returns
// "YYYY-MM-DD", or null. iOS gives picked photos a lastModified of "now", so this is
// how "Ngày chụp" can default to the real capture day (spec §6.14).
export function exifDate(bytes: Uint8Array): string | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && isExifHeader(bytes, offset + 4))
      return readTiff(view, offset + 10, offset + 2 + size);
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return null;
    offset += 2 + size;
  }
  return null;
}

function isExifHeader(bytes: Uint8Array, at: number): boolean {
  const text = String.fromCharCode(...bytes.slice(at, at + 4));
  return text === "Exif" && bytes[at + 4] === 0 && bytes[at + 5] === 0;
}

function readTiff(view: DataView, tiff: number, end: number): string | null {
  if (tiff + 8 > end) return null;
  const little = view.getUint16(tiff) === 0x4949;
  const u16 = (at: number) => view.getUint16(at, little);
  const u32 = (at: number) => view.getUint32(at, little);
  const entries = (ifd: number) => {
    const list: { tag: number; count: number; value: number }[] = [];
    if (ifd + 2 > end) return list;
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const at = ifd + 2 + i * 12;
      if (at + 12 > end) break;
      list.push({ tag: u16(at), count: u32(at + 4), value: u32(at + 8) });
    }
    return list;
  };
  const ascii = (entry: { count: number; value: number }) => {
    const start = tiff + entry.value;
    if (entry.count < 10 || start + 10 > end) return null;
    let text = "";
    for (let i = 0; i < 10; i++)
      text += String.fromCharCode(view.getUint8(start + i));
    const match = /^(\d{4}):(\d{2}):(\d{2})$/.exec(text);
    if (!match || match[1] === "0000") return null;
    return `${match[1]}-${match[2]}-${match[3]}`;
  };
  const ifd0 = entries(tiff + u32(tiff + 4));
  const exifPointer = ifd0.find((e) => e.tag === 0x8769);
  if (exifPointer) {
    const original = entries(tiff + exifPointer.value).find(
      (e) => e.tag === 0x9003,
    );
    if (original) {
      const day = ascii(original);
      if (day) return day;
    }
  }
  const dateTime = ifd0.find((e) => e.tag === 0x0132);
  return dateTime ? ascii(dateTime) : null;
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/photos.test.ts lib/rules/exifDate.test.ts && bun run test`
Expected: PASS — `Tests  9 passed (9)` (7 + 2); cả bộ `Tests  296 passed (296)`.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/photos.ts lib/rules/photos.test.ts lib/rules/exifDate.ts lib/rules/exifDate.test.ts && git commit -m "feat(photos): resize, quota, months-of-age grouping and form rules"
```

---

### Task 3: Trang `/anh`

**Files:**

- Create: `lib/photoCompress.ts`, `lib/data/photos.ts`, `components/photos/PhotosScreen.tsx`, `app/anh/page.tsx`
- Modify: `lib/nav.ts`, `sw/sw.template.js`
- Test: `lib/nav.test.ts`, `lib/themeGuard.test.ts`, `scripts/sw.test.ts` (đã có)

**Interfaces:**

- Consumes: Task 1, Task 2; `OnlineOnly`, `AuthGate`; Supabase Storage (`upload`, `createSignedUrls`, `remove`)
- Produces: `compressPhoto`, `usePhotos`, `usePhotoUrls`, `usePhotoActions`; `PhotosScreen`; trang `/anh`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -66,6 +66,10 @@
     expect(TOOL_ITEMS.find((i) => i.label === "Nhạc")?.href).toBe("/nhac");
   });
 
+  it("Tiện ích opens photos", () => {
+    expect(TOOL_ITEMS.find((i) => i.label === "Ảnh")?.href).toBe("/anh");
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `AssertionError: expected null to be '/anh'`; `Tests  1 failed | 10 passed (11)`.

- [ ] **Step 3: Sửa menu và service worker**

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -29,7 +29,7 @@
   { label: "Khẩn cấp", href: "/khan-cap" },
   { label: "Nhạc", href: "/nhac" },
   { label: "Ồn trắng", href: "/on-trang" },
-  { label: "Ảnh", href: null },
+  { label: "Ảnh", href: "/anh" },
   { label: "Báo cáo", href: null },
 ];
 
```

```diff
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -16,6 +16,7 @@
   "/tang-truong",
   "/on-trang",
   "/nhac",
+  "/anh",
   "/cam-nang",
   "/tien-ich",
   "/cai-dat",
```

- [ ] **Step 4: Tạo `lib/photoCompress.ts` và `lib/data/photos.ts`**

```ts
import { fitWithin, JPEG_QUALITY } from "@/lib/rules/photos";

// Spec §6.14: draw on a canvas at most 1600 px on the longest side and re-encode
// as JPEG 0.8. Re-encoding drops EXIF (location, camera); "from-image" applies the
// EXIF rotation first so the photo stays upright.
// The photo could not be decoded or re-encoded (unsupported format, too large).
export class PhotoReadError extends Error {
  constructor() {
    super("Không đọc được ảnh này, thử ảnh khác.");
    this.name = "PhotoReadError";
  }
}

export async function compressPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  }).catch(() => {
    throw new PhotoReadError();
  });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new PhotoReadError();
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new PhotoReadError())),
        "image/jpeg",
        JPEG_QUALITY,
      ),
    );
  } finally {
    bitmap.close();
  }
}

// The first 128 KB holds the EXIF block of a camera JPEG.
export async function readHead(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, 128 * 1024).arrayBuffer());
}
```

```ts
"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { compressPhoto } from "@/lib/photoCompress";
import { photoPath } from "@/lib/rules/photos";
import { supabase } from "@/lib/supabase/client";
import type { PhotoRow } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";

const BUCKET = "photos";
const URL_SECONDS = 3600;
const photosKey = (babyId: string) => ["photos", babyId] as const;

export function usePhotos(babyId: string) {
  return useQuery({
    queryKey: photosKey(babyId),
    queryFn: async (): Promise<PhotoRow[]> => {
      const { data, error } = await supabase()
        .from("photos")
        .select("*")
        .eq("baby_id", babyId)
        .order("taken_on", { ascending: false })
        .order("created_at", { ascending: false })
        // PostgREST returns at most 1000 rows; the quota uses photos_total_bytes().
        .range(0, 999);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

// Spec §6.14: total bytes of the family's photos, as an aggregate on the server.
export function usePhotosUsage(familyId: string) {
  return useQuery({
    queryKey: ["photos-usage", familyId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase().rpc("photos_total_bytes");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

// Spec §6.14: signed URLs valid for 1 hour, refreshed before they expire.
// One query per month group, so an upload does not blank every thumbnail.
export function usePhotoUrls(paths: string[]) {
  return useQuery({
    queryKey: ["photo-urls", ...paths],
    queryFn: async (): Promise<Record<string, string>> => {
      if (paths.length === 0) return {};
      const { data, error } = await supabase()
        .storage.from(BUCKET)
        .createSignedUrls(paths, URL_SECONDS);
      if (error) throw error;
      const urls: Record<string, string> = {};
      for (const item of data)
        if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
      return urls;
    },
    staleTime: 50 * 60_000,
    gcTime: 55 * 60_000,
    refetchInterval: 50 * 60_000,
    placeholderData: keepPreviousData,
    enabled: paths.length > 0,
  });
}

// Spec §9: photos need the network (OnlineOnly in the UI).
export function usePhotoActions(babyId: string, familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = async () => {
    await queryClient.invalidateQueries({ queryKey: photosKey(babyId) });
    await queryClient.invalidateQueries({
      queryKey: ["photos-usage", familyId],
    });
  };
  return {
    upload: useMutation({
      mutationFn: async (input: {
        file: File;
        takenOn: string;
        caption: string | null;
      }) => {
        const blob = await compressPhoto(input.file);
        const id = crypto.randomUUID();
        const path = photoPath(familyId, babyId, id);
        const storage = supabase().storage.from(BUCKET);
        const uploaded = await storage.upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });
        if (uploaded.error) throw uploaded.error;
        const { error } = await supabase().from("photos").insert({
          id,
          baby_id: babyId,
          storage_path: path,
          taken_on: input.takenOn,
          caption: input.caption,
          size_bytes: blob.size,
        });
        if (error) {
          // No row means nobody can see or delete the object: remove it again.
          await storage.remove([path]);
          throw error;
        }
      },
      onSettled,
    }),
    // Spec §5.2: delete the Storage object first, then the row.
    remove: useMutation({
      mutationFn: async (photo: PhotoRow) => {
        const removed = await supabase()
          .storage.from(BUCKET)
          .remove([photo.storage_path]);
        // 0 objects: already removed by an earlier, half-finished delete (or not
        // allowed); the row delete below applies the same rule and decides.
        if (removed.error) throw removed.error;
        const { data, error } = await supabase()
          .from("photos")
          .delete()
          .eq("id", photo.id)
          .select("id");
        if (error) throw error;
        if (data.length === 0) throw new PermissionDeniedError();
      },
      onSettled,
    }),
  };
}
```

- [ ] **Step 5: Tạo `components/photos/PhotosScreen.tsx` và `app/anh/page.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { toVietnameseError } from "@/lib/data/errors";
import {
  usePhotoActions,
  usePhotos,
  usePhotosUsage,
  usePhotoUrls,
} from "@/lib/data/photos";
import { PhotoReadError, readHead } from "@/lib/photoCompress";
import { exifDate } from "@/lib/rules/exifDate";
import {
  defaultTakenOn,
  groupByAgeMonth,
  parsePhotoForm,
  usage,
} from "@/lib/rules/photos";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, PhotoRow } from "@/lib/supabase/rows";

const BAR = {
  ok: "bg-accent",
  warn: "bg-warn-ink",
  full: "bg-danger",
} as const;

export function PhotosScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const photos = usePhotos(baby.id);
  const rows = photos.data ?? [];
  const total = usePhotosUsage(baby.family_id);
  const [open, setOpen] = useState<{ photo: PhotoRow; url?: string } | null>(
    null,
  );
  const used = usage(total.data ?? 0);
  const groups = groupByAgeMonth(rows, baby.dob);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Ảnh của bé</h1>
      <section className="flex flex-col gap-1">
        <div className="h-2 overflow-hidden rounded-full bg-soft">
          <div
            className={`h-full ${BAR[used.level]}`}
            style={{ width: `${used.percent}%` }}
          />
        </div>
        <p
          role={used.level === "ok" ? undefined : "status"}
          className={`text-sm ${used.level === "ok" ? "text-muted" : "text-danger-ink"}`}
        >
          {used.text}
        </p>
      </section>
      {used.level !== "full" && <UploadForm baby={baby} />}
      {photos.isError && !photos.data && (
        <p role="alert" className="text-danger">
          {toVietnameseError(photos.error)}
        </p>
      )}
      {photos.data && rows.length === 0 && (
        <p className="text-muted">Chưa có ảnh nào.</p>
      )}
      {groups.map((group) => (
        <PhotoGroup
          key={group.months}
          label={group.label}
          photos={group.photos}
          onOpen={(photo, url) => setOpen({ photo, url })}
        />
      ))}
      {open && (
        <PhotoViewer
          photo={open.photo}
          url={open.url}
          baby={baby}
          canDelete={isOwner || open.photo.created_by === userId}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}

function UploadForm({ baby }: { baby: Baby }) {
  const actions = usePhotoActions(baby.id, baby.family_id);
  const [file, setFile] = useState<File | null>(null);
  const [takenOn, setTakenOn] = useState("");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  // Changing the key clears the file input after an upload.
  const [inputKey, setInputKey] = useState(0);
  const today = vnDateString(new Date());

  async function pick(next: File | null) {
    setFile(next);
    setMessage(null);
    if (!next) return;
    const day = exifDate(await readHead(next).catch(() => new Uint8Array()));
    setTakenOn(defaultTakenOn(day, next.lastModified, baby.dob, new Date()));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("Chọn một ảnh trước.");
      return;
    }
    const parsed = parsePhotoForm(
      { takenOn, caption },
      { dob: baby.dob, today },
    );
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.upload.mutate(
      { file, takenOn: parsed.value.taken_on, caption: parsed.value.caption },
      {
        onSuccess: () => {
          setFile(null);
          setCaption("");
          setInputKey((k) => k + 1);
          setMessage("Đã tải ảnh lên.");
        },
        onError: (e) =>
          setMessage(
            e instanceof PhotoReadError ? e.message : toVietnameseError(e),
          ),
      },
    );
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <OnlineOnly>
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-2xl border p-4"
      >
        <label className="flex flex-col gap-1">
          Chọn ảnh
          <input
            key={inputKey}
            type="file"
            accept="image/*"
            className="min-h-11"
            onChange={(e) => void pick(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <>
            <label className="flex flex-col gap-1">
              Ngày chụp
              <input
                type="date"
                className={input}
                min={baby.dob}
                max={today}
                value={takenOn}
                onChange={(e) => setTakenOn(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              Ghi chú (không bắt buộc)
              <input
                className={input}
                maxLength={200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>
          </>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={!file || actions.upload.isPending}
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          {actions.upload.isPending ? "Đang tải lên…" : "Tải ảnh lên"}
        </button>
      </form>
    </OnlineOnly>
  );
}

function PhotoViewer({
  photo,
  url,
  baby,
  canDelete,
  onClose,
}: {
  photo: PhotoRow;
  url: string | undefined;
  baby: Baby;
  canDelete: boolean;
  onClose: () => void;
}) {
  const actions = usePhotoActions(baby.id, baby.family_id);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div
      className="fixed inset-0 z-20 flex flex-col bg-black/40 p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={onClose}
    >
      <div
        className="m-auto flex max-h-full w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl bg-surface p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {url ? (
          <img
            src={url}
            alt={photo.caption ?? ""}
            className="w-full rounded-xl"
          />
        ) : (
          <p className="text-muted">Cần mạng để xem ảnh.</p>
        )}
        <p className="text-sm text-muted">
          {photo.taken_on.split("-").reverse().join("/")}
        </p>
        {photo.caption && <p>{photo.caption}</p>}
        {message && (
          <p role="alert" className="text-danger">
            {message}
          </p>
        )}
        {canDelete && (
          <OnlineOnly>
            <button
              type="button"
              disabled={actions.remove.isPending}
              onClick={() => {
                if (window.confirm("Xóa ảnh này? Không khôi phục được."))
                  actions.remove.mutate(photo, {
                    onSuccess: onClose,
                    onError: (e) => setMessage(toVietnameseError(e)),
                  });
              }}
              className="min-h-12 rounded-2xl border text-danger disabled:opacity-50"
            >
              Xóa ảnh
            </button>
          </OnlineOnly>
        )}
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-2xl border"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

function PhotoGroup({
  label,
  photos,
  onOpen,
}: {
  label: string;
  photos: PhotoRow[];
  onOpen: (photo: PhotoRow, url: string | undefined) => void;
}) {
  const urls = usePhotoUrls(photos.map((p) => p.storage_path));
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">{label}</h2>
      <div className="grid grid-cols-3 gap-1">
        {photos.map((photo) => {
          const url = urls.data?.[photo.storage_path];
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpen(photo, url)}
              className="aspect-square overflow-hidden rounded-lg bg-soft"
              aria-label={photo.caption ?? `Ảnh ngày ${photo.taken_on}`}
            >
              {url && (
                <img
                  src={url}
                  alt={photo.caption ?? ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { PhotosScreen } from "@/components/photos/PhotosScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <PhotosScreen
            baby={ctx.baby}
            userId={session.user.id}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
```

- [ ] **Step 6: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  297 passed (297)`; build thành công, có `○ /anh`.

- [ ] **Step 7: Commit**

```bash
git add lib/photoCompress.ts lib/data/photos.ts components/photos app/anh lib/nav.ts lib/nav.test.ts sw/sw.template.js && git commit -m "feat(photos): /anh with on-device compression, grid by month and quota"
```

---

### Task 4: Checklist bước 17 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 3
- Produces: checklist bước 17

- [ ] **Step 1: Thêm bước 17 vào cuối file**

```diff
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -251,3 +251,18 @@
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 17 — Ảnh (M24)
+
+1. Tiện ích → Ảnh. Kỳ vọng: thanh dung lượng "Đã dùng … MB / 1 GB".
+2. "Chọn ảnh" → chọn một ảnh chụp bằng camera iPhone từ vài ngày trước. Kỳ vọng: "Ngày chụp" tự điền đúng ngày chụp (đọc từ thông tin ảnh; ảnh không có thông tin này thì là hôm nay, sửa được); thêm ghi chú → "Tải ảnh lên". Kỳ vọng: "Đã tải ảnh lên."; ảnh hiện trong nhóm "N tháng tuổi", không bị xoay ngang.
+3. Bấm ảnh. Kỳ vọng: xem ảnh lớn, ngày, ghi chú. Máy thứ hai mở Ảnh cũng thấy ảnh này.
+4. Tải ảnh về máy tính từ Supabase → Storage → photos và xem thông tin ảnh. Kỳ vọng: cạnh dài tối đa 1600 px, không còn vị trí GPS hay thông tin máy chụp.
+5. Bật chế độ máy bay → Ảnh. Kỳ vọng: form tải lên mờ kèm "Cần kết nối mạng".
+6. Tắt máy bay, mở ảnh thử → "Xóa ảnh" → xác nhận. Kỳ vọng: ảnh biến mất; tài khoản thành viên khác không thấy nút xóa ảnh của chủ gia đình.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

Run: `grep '^## ' docs/device-checklist.md | tail -1`
Expected: `## Bước 17 — Ảnh (M24)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist step 17 for photos" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/anh`
Expected: `200`.

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bảng kết quả bước 17 để trống. Trong báo cáo cuối ghi: "Checklist bước 17 chờ người dùng."

---

## Ngoài phạm vi M24

- M25: mốc phát triển, đánh dấu đã đạt và gắn một ảnh từ `photos`. M26: báo cáo cho bác sĩ, chốt đợt 3.
