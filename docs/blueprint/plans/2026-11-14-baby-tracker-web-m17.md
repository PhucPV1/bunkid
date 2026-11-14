# Baby Tracker Web — M17 (Thông tin khẩn cấp và nhắc khi bé thức quá lâu) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/khan-cap` (spec §6.7): nút gọi 115 cố định ở đầu, danh bạ khẩn cấp của gia đình theo thứ tự, thẻ hồ sơ bé (tên, tuổi, nhóm máu, dị ứng, cân nặng gần nhất), mở được khi offline. Cùng milestone: push `wake` (§8.3) báo "Bé thức đã X phút" khi bé thức quá ngưỡng `W(ageDays)`.

**Architecture:**
- **Dữ liệu:** migration `20261114000500_emergency_contacts.sql` tạo bảng `emergency_contacts` với RLS đúng §5.2 (mọi thành viên đọc, thêm, sửa, xóa); pgTAP `007`. Ghi trực tiếp, cần mạng (§9), nên phần sửa nằm trong `OnlineOnly`.
- **Quy tắc thuần** (`lib/rules/emergency.ts`): chuẩn hóa và kiểm số điện thoại, thứ tự danh bạ, đổi chỗ, các dòng của thẻ hồ sơ.
- **Giao diện** (`components/emergency/`): `CallList` (115 + danh bạ, link `tel:`), `ContactsEditor`, `ProfileCard` (owner sửa nhóm máu, dị ứng qua `updateBaby`), `EmergencyScreen`; mở từ Tiện ích → Khẩn cấp. Dữ liệu đọc nằm trong cache React Query đã lưu (M9); `/khan-cap` đã có trong service worker.
- **Nhắc thức:** `selectDueNotifications` thêm luật `wake` và `wakeWindowMin(ageDays)`; `dispatchDeps.loadState` nạp giấc ngủ kết thúc gần nhất và đồng hồ ngủ đang chạy. Route, cron, chống gửi trùng của M11 giữ nguyên.

**Tech Stack:** như M1–M16. Không thêm gói nào.

**Milestones của đợt phát hành 2:**
- M14–M16: xong (tiêm chủng và nhắc tiêm).
- **M17 (plan này):** khẩn cấp + push `wake`.
- Sau đó: tăng trưởng WHO (bảng `growth`, bảng LMS, biểu đồ; khi xong thì thẻ hồ sơ ở M17 dùng cân nặng đo gần nhất); phân loại triệu chứng và bài bệnh thường gặp.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Bảng `emergency_contacts`:** đúng cột §5 (`id, family_id, label, phone, sort default 0, created_by, created_at`). Thêm ràng buộc: `label` 1–60 ký tự (sau khi bỏ khoảng trắng), `phone` khớp `^\+?[0-9]{3,15}$`, index `(family_id, sort)`, trigger `forbid_immutable_change('id', 'family_id', 'created_by')`. RLS: select, update, delete khi là thành viên; insert khi là thành viên và `created_by = auth.uid()`.
- **Số điện thoại:** người dùng gõ có khoảng trắng, dấu chấm, gạch, ngoặc thì tự bỏ trước khi kiểm. Câu báo lỗi đúng như `parseContactForm`.
- **Thứ tự:** sắp theo `sort`, rồi `created_at`. Số mới thêm vào cuối (`sort` lớn nhất + 1). Nút ↑/↓ đổi chỗ hai số liền nhau và chỉ cập nhật những dòng có `sort` thay đổi (đánh lại 0..n−1).
- **Mở được khi offline:** trang chủ cũng gọi `useEmergencyContacts`, nên danh bạ có sẵn trong cache đã lưu (M9) dù chưa từng mở `/khan-cap` lúc có mạng. `staleTime` 60 giây như lịch tiêm, để máy thứ hai thấy thay đổi khi mở lại trang.
- **Xóa** có hộp xác nhận `window.confirm` "Xóa "<tên>" khỏi danh bạ?".
- **Thẻ hồ sơ:** "Cân nặng gần nhất" chưa có nguồn đo (bảng `growth` làm ở milestone tăng trưởng), nên ở M17 hiện cân nặng lúc sinh kèm "(lúc sinh)", hoặc "Chưa ghi". `EmergencyScreen` truyền `latestWeightG={null}`; milestone tăng trưởng thay bằng lần đo mới nhất. Nhóm máu chọn trong A+, A-, B+, B-, AB+, AB-, O+, O- hoặc "Chưa biết"; dị ứng tối đa 300 ký tự. Chỉ chủ gia đình sửa được (§4.1, hồ sơ bé).
- **Luật `wake` (§8.3):**
  - Không có giấc `sleep` đang chạy; `S` = giấc `sleep` có `ended_at` mới nhất trong 12 giờ qua (đúng 12 giờ vẫn tính).
  - Gửi khi `now − S.ended_at ≥ W(ageDays)` phút, `ageDays` tính theo ngày VN hôm nay.
  - `W`: 0–27 → 60; 28–90 → 90; 91–150 → 120; 151–240 → 180; 241–365 → 210; trên 365 → 240.
  - Người nhận: công tắc "Nhắc khi bé thức quá lâu" bật và không tạm tắt (không có dòng `notification_prefs` = bật).
  - `title` = "Bé thức đã X phút" với X = số phút đã thức (làm tròn xuống) lúc gửi; `body` = "Bé có thể đang mệt, thử cho bé ngủ."; `refKey` = `wake:<S.id>`; `url` = `/`; `tag` = `wake:<babyId>`.
  - Mỗi giấc ngủ chỉ gửi một lần (`notification_log`), dù cron chạy mỗi phút sau đó.
- **Công tắc:** bỏ dòng "Có từ đợt 2" dưới "Nhắc khi bé thức quá lâu".
- **`db push`:** người dùng đã cho phép trước chạy `bunx supabase db push --linked` cho migration chỉ thêm bảng mới đã duyệt.
- **Bước của người dùng:** checklist bước 10, 11 cần điện thoại thật; ghi là đang chờ, không đánh dấu Đạt.

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

Riêng M17:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/emergency.ts`, `lib/rules/pushSelection.ts` và `components/emergency/` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`427ab7e`):

- M1: `families`, `family_members`, `babies(blood_type, allergies, birth_weight_g)`, `is_member`, `forbid_immutable_change`
- M11, M16: `selectDueNotifications`, `BabyDispatchState`, `Recipient`, `supabaseDispatchDeps`; `notification_prefs.wake_window`
- M13: `OnlineOnly`; M7: màu theo vai trò (`bg-alarm`, `text-on-accent`, …)
- `formatAgeVi`, `ageDays` (`lib/rules/time.ts`); `updateBaby` (`lib/data/baby.ts`); `TOOL_ITEMS` (`lib/nav.ts`); `/khan-cap` trong `GUIDES` của `sw/sw.template.js` (M9)

**Produces** (milestone tăng trưởng và triệu chứng dùng):

- Bảng `emergency_contacts`, kiểu `EmergencyContactRow`
- `lib/rules/emergency.ts`: `BLOOD_TYPES`, `ALLERGIES_MAX`, `Contact`, `ContactInput`, `normalizePhone`, `parseContactForm`, `sortContacts`, `nextSort`, `moveContact`, `profileLines(baby, latestWeightG, now)`
- `lib/data/emergency.ts`: `useEmergencyContacts(familyId)` (key `["emergency-contacts", familyId]`), `useContactActions(familyId)`, `useSaveMedicalInfo(babyId)`
- `components/emergency/`: `CallList({ contacts })` (trang triệu chứng dùng cho nút gọi bác sĩ), `ProfileCard({ baby, isOwner, latestWeightG })`, `ContactsEditor`, `EmergencyScreen({ baby, isOwner })`
- `wakeWindowMin(days)`; `BabyDispatchState.wake: { dob, lastSleep, sleepRunning } | null`; `Recipient.prefs.wake_window`
- Checklist bước 10, 11

## File Structure

```
supabase/migrations/20261114000500_emergency_contacts.sql, supabase/tests/007_emergency_contacts.test.sql
lib/supabase/types.ts                    # sinh lại; lib/supabase/rows.ts: EmergencyContactRow
lib/rules/emergency.ts (+ test)          # số điện thoại, thứ tự, thẻ hồ sơ
lib/data/emergency.ts                    # đọc/ghi danh bạ, lưu nhóm máu và dị ứng
lib/data/baby.ts                         # sửa: patch nhận blood_type, allergies
components/emergency/CallList.tsx, ContactsEditor.tsx, ProfileCard.tsx, EmergencyScreen.tsx
app/khan-cap/page.tsx; lib/nav.ts (+ test)   # Tiện ích → Khẩn cấp
lib/rules/pushSelection.ts (+ test), lib/server/dispatchDeps.ts, lib/server/dispatch.test.ts, lib/rules/notifications.ts   # push wake
docs/device-checklist.md                 # bước 10, 11; bước 7 ghi thêm nhắc thức
```

## Tasks

1. Bảng `emergency_contacts`
2. Quy tắc danh bạ và thẻ hồ sơ
3. Trang `/khan-cap`
4. Nhắc khi bé thức quá lâu
5. Checklist bước 10, 11 và deploy

---

### Task 1: Bảng `emergency_contacts`

**Files:**

- Create: `supabase/migrations/20261114000500_emergency_contacts.sql`
- Modify: `lib/supabase/types.ts` (sinh lại), `lib/supabase/rows.ts`
- Test: `supabase/tests/007_emergency_contacts.test.sql`

**Interfaces:**

- Consumes: `public.families`, `public.is_member`, `public.forbid_immutable_change` (M1)
- Produces: bảng `public.emergency_contacts(id, family_id, label, phone, sort, created_by, created_at)`; `EmergencyContactRow`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m17.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `427ab7e docs: device checklist step 9 for offline dose marks and vaccine reminders`.

- [ ] **Step 2: Viết test pgTAP thất bại**

Tạo `supabase/tests/007_emergency_contacts.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000007', 'ea@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'eb@example.com'),
  ('cccccccc-0000-0000-0000-000000000007', 'ec@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000007', 'Nhà E');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000007', 'ea@example.com', 'aaaaaaaa-0000-0000-0000-000000000007', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000007', 'eb@example.com', 'bbbbbbbb-0000-0000-0000-000000000007', 'member', 'Bà');
insert into public.emergency_contacts (id, family_id, label, phone, sort, created_by) values
  ('e0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000007', 'Bác sĩ Lan', '0901234567', 1, 'aaaaaaaa-0000-0000-0000-000000000007');

select throws_ok(
  $$ insert into public.emergency_contacts (family_id, label, phone, created_by)
     values ('f0000000-0000-0000-0000-000000000007', 'Sai số', '09-01', 'aaaaaaaa-0000-0000-0000-000000000007') $$,
  '23514', null, 'phone must be digits with an optional leading +');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000007","email":"ec@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.emergency_contacts', 'outsider sees no contacts');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000007","email":"eb@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.emergency_contacts (family_id, label, phone, sort)
     values ('f0000000-0000-0000-0000-000000000007', 'Ông bà nội', '+84912345678', 2) $$,
  'member adds a contact (created_by defaults to them)');
select lives_ok(
  $$ update public.emergency_contacts set phone = '0907654321' where label = 'Bác sĩ Lan' $$,
  'member edits a contact the owner added');
select throws_ok(
  $$ update public.emergency_contacts set family_id = 'f0000000-0000-0000-0000-000000000099' where label = 'Bác sĩ Lan' $$,
  'P0001', 'immutable_column: family_id', 'family_id is immutable');
select lives_ok(
  $$ delete from public.emergency_contacts where label = 'Bác sĩ Lan' $$,
  'member deletes a contact the owner added');
reset role;
select is(
  (select array_agg(label order by sort) from public.emergency_contacts where family_id = 'f0000000-0000-0000-0000-000000000007'),
  array['Ông bà nội'],
  'member edits and deletes took effect');
select is(
  (select created_by from public.emergency_contacts where label = 'Ông bà nội'),
  'bbbbbbbb-0000-0000-0000-000000000007'::uuid,
  'created_by is the member');

select * from finish();
rollback;
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `007_emergency_contacts.test.sql` báo `relation "public.emergency_contacts" does not exist`; `001`…`006` vẫn `ok`.

- [ ] **Step 4: Viết migration**

Tạo `supabase/migrations/20261114000500_emergency_contacts.sql`:

```sql
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 60),
  phone text not null check (phone ~ '^\+?[0-9]{3,15}$'),
  sort int not null default 0,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create index emergency_contacts_family_idx on public.emergency_contacts (family_id, sort);

create trigger emergency_contacts_immutable before update on public.emergency_contacts
  for each row execute function public.forbid_immutable_change('id', 'family_id', 'created_by');

alter table public.emergency_contacts enable row level security;

-- Spec §5.2: every member reads, adds, edits and deletes the family's contacts.
create policy emergency_contacts_select on public.emergency_contacts for select to authenticated
  using (public.is_member(family_id));
create policy emergency_contacts_insert on public.emergency_contacts for insert to authenticated
  with check (public.is_member(family_id) and created_by = auth.uid());
create policy emergency_contacts_update on public.emergency_contacts for update to authenticated
  using (public.is_member(family_id))
  with check (public.is_member(family_id));
create policy emergency_contacts_delete on public.emergency_contacts for delete to authenticated
  using (public.is_member(family_id));
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001`…`006` `ok`, `007_emergency_contacts.test.sql .. ok`, `All tests successful.`

- [ ] **Step 6: Sinh lại kiểu và thêm `EmergencyContactRow`**

Run: `bun run db:types && grep -c "emergency_contacts" lib/supabase/types.ts`
Expected: số đếm ≥ 1 (khối `emergency_contacts` có `Row`, `Insert`, `Update`).

```diff
--- a/lib/supabase/rows.ts
+++ b/lib/supabase/rows.ts
@@ -7,3 +7,4 @@
 export type Baby = Tables["babies"]["Row"];
 export type LogRow = Tables["logs"]["Row"];
 export type VaccineDoseRow = Tables["vaccine_doses"]["Row"];
+export type EmergencyContactRow = Tables["emergency_contacts"]["Row"];
```

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; `Tests  205 passed (205)`.

- [ ] **Step 7: Commit và đưa migration lên cloud**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m17.md supabase/migrations/20261114000500_emergency_contacts.sql supabase/tests/007_emergency_contacts.test.sql lib/supabase/types.ts lib/supabase/rows.ts && git commit -m "feat(emergency): emergency_contacts table with RLS"
```

Run: `bunx supabase db push --linked --yes`
Expected: `Applying migration 20261114000500_emergency_contacts.sql...`, `Finished supabase db push.` Nếu CLI cần mật khẩu DB hoặc báo chưa link project, dừng bước này và ghi vào báo cáo cuối như việc người dùng tự làm (không tự nhập mật khẩu).

---

### Task 2: Quy tắc danh bạ và thẻ hồ sơ

**Files:**

- Create: `lib/rules/emergency.ts`
- Test: `lib/rules/emergency.test.ts`

**Interfaces:**

- Consumes: `formatAgeVi` (`lib/rules/time.ts`)
- Produces:
  - `BLOOD_TYPES: string[]`, `ALLERGIES_MAX = 300`
  - `type Contact = { id; label; phone; sort; created_at }`, `type ContactInput = { label; phone }`
  - `normalizePhone(raw): string`; `parseContactForm(raw): { ok: true; value: ContactInput } | { ok: false; message }`
  - `sortContacts<T extends Contact>(contacts: T[]): T[]`; `nextSort(contacts): number`; `moveContact(contacts, id, -1 | 1): { id; sort }[]`
  - `profileLines(baby, latestWeightG: number | null, now): { label; value }[]`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/emergency.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  moveContact,
  nextSort,
  normalizePhone,
  parseContactForm,
  profileLines,
  sortContacts,
  type Contact,
} from "./emergency";

const contact = (
  id: string,
  sort: number,
  created_at = "2026-11-14T00:00:00Z",
): Contact => ({
  id,
  label: id,
  phone: "0901234567",
  sort,
  created_at,
});

describe("parseContactForm", () => {
  it("trims the label and strips spaces, dots, dashes and brackets from the phone", () => {
    expect(normalizePhone(" (+84) 912.345-678 ")).toBe("+84912345678");
    expect(
      parseContactForm({ label: "  Bác sĩ Lan ", phone: "090 123 4567" }),
    ).toEqual({
      ok: true,
      value: { label: "Bác sĩ Lan", phone: "0901234567" },
    });
  });

  it("rejects an empty or long label and a malformed phone", () => {
    expect(parseContactForm({ label: " ", phone: "0901234567" })).toEqual({
      ok: false,
      message: "Nhập tên người hoặc nơi cần gọi.",
    });
    expect(
      parseContactForm({ label: "x".repeat(61), phone: "0901234567" }),
    ).toEqual({
      ok: false,
      message: "Tên tối đa 60 ký tự.",
    });
    for (const phone of ["12", "09a1234567", "+", "1234567890123456"])
      expect(parseContactForm({ label: "A", phone })).toEqual({
        ok: false,
        message: "Số điện thoại chỉ gồm chữ số, có thể bắt đầu bằng +.",
      });
  });
});

describe("contact order", () => {
  it("sorts by sort then creation time, and appends after the last", () => {
    const list = [
      contact("b", 1),
      contact("a2", 0, "2026-11-14T02:00:00Z"),
      contact("a1", 0, "2026-11-14T01:00:00Z"),
    ];
    expect(sortContacts(list).map((c) => c.id)).toEqual(["a1", "a2", "b"]);
    expect(nextSort(list)).toBe(2);
    expect(nextSort([])).toBe(0);
  });

  it("moveContact swaps neighbours and renumbers only what changed", () => {
    const list = [contact("x", 0), contact("y", 1), contact("z", 2)];
    expect(moveContact(list, "z", -1)).toEqual([
      { id: "z", sort: 1 },
      { id: "y", sort: 2 },
    ]);
    expect(moveContact(list, "x", -1)).toEqual([]);
    expect(moveContact(list, "z", 1)).toEqual([]);
    const tied = [
      contact("p", 0, "2026-11-14T01:00:00Z"),
      contact("q", 0, "2026-11-14T02:00:00Z"),
    ];
    expect(moveContact(tied, "q", -1)).toEqual([{ id: "p", sort: 1 }]);
  });
});

describe("profileLines (spec §6.7)", () => {
  const baby = {
    name: "Bé Na",
    dob: "2026-09-14",
    blood_type: null,
    allergies: null,
    birth_weight_g: 3200,
  };
  const now = new Date("2026-11-14T03:00:00Z");

  it("falls back to the birth weight and 'Chưa ghi'", () => {
    expect(profileLines(baby, null, now)).toEqual([
      { label: "Tên", value: "Bé Na" },
      { label: "Tuổi", value: "2 tháng" },
      { label: "Nhóm máu", value: "Chưa ghi" },
      { label: "Dị ứng", value: "Chưa ghi" },
      { label: "Cân nặng gần nhất", value: "3.200 g (lúc sinh)" },
    ]);
  });

  it("prefers the latest measured weight", () => {
    const lines = profileLines(
      {
        ...baby,
        blood_type: "O+",
        allergies: "Đạm sữa bò",
        birth_weight_g: null,
      },
      5150,
      now,
    );
    expect(lines.slice(2)).toEqual([
      { label: "Nhóm máu", value: "O+" },
      { label: "Dị ứng", value: "Đạm sữa bò" },
      { label: "Cân nặng gần nhất", value: "5.150 g" },
    ]);
    expect(
      profileLines({ ...baby, birth_weight_g: null }, null, now)[4].value,
    ).toBe("Chưa ghi");
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/emergency.test.ts`
Expected: FAIL — `Error: Cannot find module './emergency' imported from …/lib/rules/emergency.test.ts`.

- [ ] **Step 3: Viết quy tắc**

Tạo `lib/rules/emergency.ts`:

```ts
import { formatAgeVi } from "./time";

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const ALLERGIES_MAX = 300;

export type Contact = {
  id: string;
  label: string;
  phone: string;
  sort: number;
  created_at: string;
};

export type ContactInput = { label: string; phone: string };

// Spaces, dots, dashes and brackets are typing aids; the stored number keeps only
// digits and an optional leading "+" (the DB check is ^\+?[0-9]{3,15}$).
export function normalizePhone(raw: string): string {
  return raw.trim().replace(/[\s.\-()]/g, "");
}

export function parseContactForm(
  raw: ContactInput,
): { ok: true; value: ContactInput } | { ok: false; message: string } {
  const label = raw.label.trim();
  const phone = normalizePhone(raw.phone);
  if (label.length === 0)
    return { ok: false, message: "Nhập tên người hoặc nơi cần gọi." };
  if (label.length > 60) return { ok: false, message: "Tên tối đa 60 ký tự." };
  if (!/^\+?[0-9]{3,15}$/.test(phone))
    return {
      ok: false,
      message: "Số điện thoại chỉ gồm chữ số, có thể bắt đầu bằng +.",
    };
  return { ok: true, value: { label, phone } };
}

export function sortContacts<T extends Contact>(contacts: T[]): T[] {
  return [...contacts].sort(
    (a, b) => a.sort - b.sort || a.created_at.localeCompare(b.created_at),
  );
}

export function nextSort(contacts: Contact[]): number {
  return contacts.reduce((max, c) => Math.max(max, c.sort), -1) + 1;
}

// Moving one place up or down: the two neighbours take each other's position.
// Positions are renumbered 0..n-1 so equal sort values cannot get stuck.
export function moveContact(
  contacts: Contact[],
  id: string,
  direction: -1 | 1,
): { id: string; sort: number }[] {
  const list = sortContacts(contacts);
  const from = list.findIndex((c) => c.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return [];
  [list[from], list[to]] = [list[to], list[from]];
  return list.flatMap((c, index) =>
    c.sort === index ? [] : [{ id: c.id, sort: index }],
  );
}

const grams = new Intl.NumberFormat("vi-VN");

export function profileLines(
  baby: {
    name: string;
    dob: string;
    blood_type: string | null;
    allergies: string | null;
    birth_weight_g: number | null;
  },
  latestWeightG: number | null,
  now: Date,
): { label: string; value: string }[] {
  const weight =
    latestWeightG !== null
      ? `${grams.format(latestWeightG)} g`
      : baby.birth_weight_g !== null
        ? `${grams.format(baby.birth_weight_g)} g (lúc sinh)`
        : "Chưa ghi";
  return [
    { label: "Tên", value: baby.name },
    { label: "Tuổi", value: formatAgeVi(baby.dob, now) },
    { label: "Nhóm máu", value: baby.blood_type || "Chưa ghi" },
    { label: "Dị ứng", value: baby.allergies || "Chưa ghi" },
    { label: "Cân nặng gần nhất", value: weight },
  ];
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/emergency.test.ts`
Expected: PASS — `Tests  6 passed (6)`.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/emergency.ts lib/rules/emergency.test.ts && git commit -m "feat(emergency): phone, ordering and profile card rules"
```

---

### Task 3: Trang `/khan-cap`

**Files:**

- Create: `lib/data/emergency.ts`, `components/emergency/CallList.tsx`, `components/emergency/ProfileCard.tsx`, `components/emergency/ContactsEditor.tsx`, `components/emergency/EmergencyScreen.tsx`, `app/khan-cap/page.tsx`
- Modify: `lib/data/baby.ts`, `lib/nav.ts`, `components/home/HomeScreen.tsx` (tải sẵn danh bạ)
- Test: `lib/nav.test.ts`, `lib/themeGuard.test.ts` (đã có)

**Interfaces:**

- Consumes: Task 1, Task 2; `updateBaby`, `PermissionDeniedError`, `toVietnameseError`, `OnlineOnly`, `AuthGate`
- Produces: `useEmergencyContacts`, `useContactActions(familyId) → { add, edit, reorder, remove }`, `useSaveMedicalInfo(babyId)`; `CallList`, `ProfileCard`, `ContactsEditor`, `EmergencyScreen`; trang `/khan-cap`; `TOOL_ITEMS` "Khẩn cấp" → `/khan-cap`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -29,6 +29,12 @@
     );
   });
 
+  it("Tiện ích opens the emergency page", () => {
+    expect(TOOL_ITEMS.find((i) => i.label === "Khẩn cấp")?.href).toBe(
+      "/khan-cap",
+    );
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `AssertionError: expected null to be '/khan-cap'`; `Tests  1 failed | 4 passed (5)`.

- [ ] **Step 3: Sửa menu và kiểu của `updateBaby`**

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -26,7 +26,7 @@
 export const TOOL_ITEMS: MenuItem[] = [
   { label: "Thống kê", href: "/thong-ke" },
   { label: "Tăng trưởng", href: null },
-  { label: "Khẩn cấp", href: null },
+  { label: "Khẩn cấp", href: "/khan-cap" },
   { label: "Nhạc", href: null },
   { label: "Ồn trắng", href: null },
   { label: "Ảnh", href: null },
```

```diff
--- a/lib/data/baby.ts
+++ b/lib/data/baby.ts
@@ -21,6 +21,8 @@
   patch: Partial<BabyInput> & {
     feed_interval_min?: number;
     vaccine_choices?: Record<string, string>;
+    blood_type?: string | null;
+    allergies?: string | null;
   },
 ): Promise<void> {
   const { data, error } = await supabase()
```

- [ ] **Step 4: Tạo `lib/data/emergency.ts`**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContactInput } from "@/lib/rules/emergency";
import { supabase } from "@/lib/supabase/client";
import type { EmergencyContactRow } from "@/lib/supabase/rows";
import { updateBaby } from "./baby";
import { PermissionDeniedError } from "./errors";

const contactsKey = (familyId: string) =>
  ["emergency-contacts", familyId] as const;

export function useEmergencyContacts(familyId: string) {
  return useQuery({
    queryKey: contactsKey(familyId),
    queryFn: async (): Promise<EmergencyContactRow[]> => {
      const { data, error } = await supabase()
        .from("emergency_contacts")
        .select("*")
        .eq("family_id", familyId)
        .order("sort")
        .order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

async function updateContact(
  id: string,
  patch: Partial<ContactInput> & { sort?: number },
): Promise<void> {
  const { data, error } = await supabase()
    .from("emergency_contacts")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

// Spec §9: emergency_contacts are written online only (OnlineOnly in the UI).
export function useContactActions(familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () =>
    queryClient.invalidateQueries({ queryKey: contactsKey(familyId) });
  return {
    add: useMutation({
      mutationFn: async (input: ContactInput & { sort: number }) => {
        const { error } = await supabase()
          .from("emergency_contacts")
          .insert({ family_id: familyId, ...input });
        if (error) throw error;
      },
      onSettled,
    }),
    edit: useMutation({
      mutationFn: ({ id, input }: { id: string; input: ContactInput }) =>
        updateContact(id, input),
      onSettled,
    }),
    reorder: useMutation({
      mutationFn: async (moves: { id: string; sort: number }[]) => {
        for (const move of moves)
          await updateContact(move.id, { sort: move.sort });
      },
      onSettled,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { data, error } = await supabase()
          .from("emergency_contacts")
          .delete()
          .eq("id", id)
          .select("id");
        if (error) throw error;
        if (data.length === 0) throw new PermissionDeniedError();
      },
      onSettled,
    }),
  };
}

// Owner only (spec §4.1: the baby profile).
export function useSaveMedicalInfo(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      blood_type: string | null;
      allergies: string | null;
    }) => updateBaby(babyId, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });
}
```

- [ ] **Step 5: Tạo `components/emergency/CallList.tsx`**

```tsx
import { sortContacts } from "@/lib/rules/emergency";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

// Spec §6.7: 115 always first, then the family's contacts by sort.
export function CallList({ contacts }: { contacts: EmergencyContactRow[] }) {
  return (
    <ul className="flex flex-col gap-2">
      <li>
        <a
          href="tel:115"
          className="flex min-h-14 items-center justify-between rounded-2xl bg-alarm px-4 text-lg font-semibold text-on-accent"
        >
          Cấp cứu 115
          <span aria-hidden="true">📞</span>
        </a>
      </li>
      {sortContacts(contacts).map((contact) => (
        <li key={contact.id}>
          <a
            href={`tel:${contact.phone}`}
            className="flex min-h-12 items-center justify-between rounded-2xl border px-4"
          >
            <span>
              <span className="block font-medium">{contact.label}</span>
              <span className="block text-sm text-muted">{contact.phone}</span>
            </span>
            <span aria-hidden="true">📞</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 6: Tạo `components/emergency/ProfileCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { useSaveMedicalInfo } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import {
  ALLERGIES_MAX,
  BLOOD_TYPES,
  profileLines,
} from "@/lib/rules/emergency";
import type { Baby } from "@/lib/supabase/rows";

export function ProfileCard({
  baby,
  isOwner,
  latestWeightG,
}: {
  baby: Baby;
  isOwner: boolean;
  latestWeightG: number | null;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-soft p-4">
      <h2 className="text-lg font-medium">Hồ sơ của bé</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {profileLines(baby, latestWeightG, new Date()).map((line) => (
          <div key={line.label} className="contents">
            <dt className="text-muted">{line.label}</dt>
            <dd className="font-medium">{line.value}</dd>
          </div>
        ))}
      </dl>
      {isOwner &&
        (editing ? (
          <MedicalInfoForm baby={baby} onClose={() => setEditing(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-11 rounded-xl border px-4"
          >
            Sửa nhóm máu, dị ứng
          </button>
        ))}
    </section>
  );
}

function MedicalInfoForm({
  baby,
  onClose,
}: {
  baby: Baby;
  onClose: () => void;
}) {
  const save = useSaveMedicalInfo(baby.id);
  const [bloodType, setBloodType] = useState(baby.blood_type ?? "");
  const [allergies, setAllergies] = useState(baby.allergies ?? "");
  return (
    <div className="flex flex-col gap-3">
      <OnlineOnly>
        <label className="flex flex-col gap-1">
          Nhóm máu
          <select
            className="min-h-11 rounded-xl border px-3"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
          >
            <option value="">Chưa biết</option>
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Dị ứng (thuốc, thức ăn…)
          <textarea
            className="min-h-20 rounded-xl border p-3"
            maxLength={ALLERGIES_MAX}
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={save.isPending}
          onClick={() =>
            save.mutate(
              {
                blood_type: bloodType || null,
                allergies: allergies.trim() || null,
              },
              { onSuccess: onClose },
            )
          }
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          Lưu
        </button>
      </OnlineOnly>
      {save.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(save.error)}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="min-h-11 rounded-xl border"
      >
        Đóng
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Tạo `components/emergency/ContactsEditor.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { useContactActions } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import {
  moveContact,
  nextSort,
  parseContactForm,
  sortContacts,
  type ContactInput,
} from "@/lib/rules/emergency";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

const EMPTY: ContactInput = { label: "", phone: "" };

// Spec §5.2: every member adds, edits, reorders and deletes contacts.
export function ContactsEditor({
  familyId,
  contacts,
  onClose,
}: {
  familyId: string;
  contacts: EmergencyContactRow[];
  onClose: () => void;
}) {
  const actions = useContactActions(familyId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContactInput>(EMPTY);
  const [message, setMessage] = useState<string | null>(null);
  const list = sortContacts(contacts);
  const onError = (e: unknown) => setMessage(toVietnameseError(e));
  const busy =
    actions.add.isPending ||
    actions.edit.isPending ||
    actions.reorder.isPending ||
    actions.remove.isPending;

  function startEdit(contact: EmergencyContactRow | null) {
    setEditingId(contact?.id ?? null);
    setDraft(contact ? { label: contact.label, phone: contact.phone } : EMPTY);
    setMessage(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseContactForm(draft);
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    const done = { onSuccess: () => startEdit(null), onError };
    setMessage(null);
    if (editingId)
      actions.edit.mutate({ id: editingId, input: parsed.value }, done);
    else
      actions.add.mutate({ ...parsed.value, sort: nextSort(contacts) }, done);
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Sửa danh bạ</h2>
      <OnlineOnly>
        <ul className="divide-y rounded-2xl border">
          {list.map((contact, index) => (
            <li key={contact.id} className="flex items-center gap-1 px-2 py-1">
              <span className="min-w-0 flex-1 px-2">
                <span className="block truncate font-medium">
                  {contact.label}
                </span>
                <span className="block text-sm text-muted">
                  {contact.phone}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Đưa ${contact.label} lên`}
                disabled={busy || index === 0}
                onClick={() =>
                  actions.reorder.mutate(moveContact(list, contact.id, -1), {
                    onError,
                  })
                }
                className="min-h-11 min-w-11 rounded-xl disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Đưa ${contact.label} xuống`}
                disabled={busy || index === list.length - 1}
                onClick={() =>
                  actions.reorder.mutate(moveContact(list, contact.id, 1), {
                    onError,
                  })
                }
                className="min-h-11 min-w-11 rounded-xl disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => startEdit(contact)}
                className="min-h-11 min-w-11 rounded-xl px-2"
              >
                Sửa
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`Xóa "${contact.label}" khỏi danh bạ?`))
                    return;
                  if (contact.id === editingId) startEdit(null);
                  setMessage(null);
                  actions.remove.mutate(contact.id, { onError });
                }}
                className="min-h-11 min-w-11 rounded-xl px-2 text-danger"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <h3 className="font-medium">
            {editingId ? "Sửa số điện thoại" : "Thêm số điện thoại"}
          </h3>
          <label className="flex flex-col gap-1">
            Tên (ví dụ: Bác sĩ nhi, Bệnh viện Nhi Đồng 1)
            <input
              className={input}
              maxLength={60}
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            Số điện thoại
            <input
              type="tel"
              inputMode="tel"
              className={input}
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </label>
          <div className="flex gap-3">
            {editingId && (
              <button
                type="button"
                onClick={() => startEdit(null)}
                className="min-h-12 flex-1 rounded-2xl border"
              >
                Hủy sửa
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </form>
      </OnlineOnly>
      {message && (
        <p role="alert" className="text-danger">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="min-h-12 rounded-2xl border"
      >
        Xong
      </button>
    </section>
  );
}
```

- [ ] **Step 8: Tạo `components/emergency/EmergencyScreen.tsx` và `app/khan-cap/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import type { Baby } from "@/lib/supabase/rows";
import { CallList } from "./CallList";
import { ContactsEditor } from "./ContactsEditor";
import { ProfileCard } from "./ProfileCard";

export function EmergencyScreen({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  const contacts = useEmergencyContacts(baby.family_id);
  const [editing, setEditing] = useState(false);
  const rows = contacts.data ?? [];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Khẩn cấp</h1>
      <CallList contacts={rows} />
      {contacts.isError && !contacts.data && (
        <p role="alert" className="text-danger">
          Không tải được danh bạ: {toVietnameseError(contacts.error)}
        </p>
      )}
      {editing ? (
        <ContactsEditor
          familyId={baby.family_id}
          contacts={rows}
          onClose={() => setEditing(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 rounded-xl border px-4"
        >
          {rows.length === 0 ? "Thêm số bác sĩ, người thân" : "Sửa danh bạ"}
        </button>
      )}
      <ProfileCard baby={baby} isOwner={isOwner} latestWeightG={null} />
    </main>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { EmergencyScreen } from "@/components/emergency/EmergencyScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <EmergencyScreen
            baby={ctx.baby}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
```

- [ ] **Step 9: Tải sẵn danh bạ ở trang chủ**

```diff
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -1,6 +1,7 @@
 "use client";
 
 import { useState } from "react";
+import { useEmergencyContacts } from "@/lib/data/emergency";
 import { toVietnameseError } from "@/lib/data/errors";
 import { useMembers } from "@/lib/data/family";
 import {
@@ -52,6 +53,8 @@
   const logs = useRecentLogs(baby.id);
   const firstLogAt = useFirstLogAt(baby.id);
   const members = useMembers(baby.family_id);
+  // Loaded here too so /khan-cap has the family's numbers even when first opened offline.
+  useEmergencyContacts(baby.family_id);
   const press = useTimerPress(baby.id, userId);
   const stop = useStopTimer(baby.id, userId);
   const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
```

- [ ] **Step 10: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  212 passed (212)` (205 + 6 của Task 2 + 1 test menu); build thành công, có `○ /khan-cap`.

- [ ] **Step 11: Commit**

```bash
git add lib/data/emergency.ts lib/data/baby.ts lib/nav.ts lib/nav.test.ts components/emergency components/home/HomeScreen.tsx app/khan-cap && git commit -m "feat(emergency): /khan-cap with 115, family contacts and profile card"
```

---

### Task 4: Nhắc khi bé thức quá lâu

**Files:**

- Modify: `lib/rules/pushSelection.ts`, `lib/server/dispatchDeps.ts`, `lib/server/dispatch.test.ts`, `lib/rules/notifications.ts`
- Test: `lib/rules/pushSelection.test.ts`

**Interfaces:**

- Consumes: `ageDays` (`lib/rules/time.ts`); `selectDueNotifications`, `BabyDispatchState`, `Recipient` (M11, M16)
- Produces: `wakeWindowMin(days): number`; `BabyDispatchState.wake: { dob: string; lastSleep: { id; endedAt } | null; sleepRunning: boolean } | null`; `Recipient.prefs.wake_window: boolean`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/rules/pushSelection.test.ts
+++ b/lib/rules/pushSelection.test.ts
@@ -3,6 +3,7 @@
 import {
   agoText,
   selectDueNotifications,
+  wakeWindowMin,
   type BabyDispatchState,
 } from "./pushSelection";
 
@@ -16,6 +17,7 @@
     feedIntervalMin: 180,
     lastFeed: { id: "L1", startedAt: minutesAgo(190) },
     breastRunning: false,
+    wake: null,
     vaccine: null,
     recipients: [{ userId: "u1", prefs: null }],
     ...over,
@@ -95,6 +97,7 @@
               userId: "off",
               prefs: {
                 feed_reminder: false,
+                wake_window: true,
                 vaccine: true,
                 snooze_until: null,
               },
@@ -103,6 +106,7 @@
               userId: "snoozed",
               prefs: {
                 feed_reminder: true,
+                wake_window: true,
                 vaccine: true,
                 snooze_until: minutesAgo(-30),
               },
@@ -111,13 +115,19 @@
               userId: "woke",
               prefs: {
                 feed_reminder: true,
+                wake_window: true,
                 vaccine: true,
                 snooze_until: minutesAgo(1),
               },
             },
             {
               userId: "plain",
-              prefs: { feed_reminder: true, vaccine: true, snooze_until: null },
+              prefs: {
+                feed_reminder: true,
+                wake_window: true,
+                vaccine: true,
+                snooze_until: null,
+              },
             },
           ],
         }),
@@ -270,6 +280,7 @@
               userId: "off",
               prefs: {
                 feed_reminder: true,
+                wake_window: true,
                 vaccine: false,
                 snooze_until: null,
               },
@@ -278,6 +289,7 @@
               userId: "snoozed",
               prefs: {
                 feed_reminder: true,
+                wake_window: true,
                 vaccine: true,
                 snooze_until: "2026-11-16T05:00:00Z",
               },
@@ -291,3 +303,118 @@
     expect(new Set(due.map((d) => d.userId))).toEqual(new Set(["snoozed"]));
   });
 });
+
+describe("selectDueNotifications — wake (spec §8.3)", () => {
+  // 10:00 on 15/11 in VN; dob 2026-09-14 → 62 days old → W = 90 minutes.
+  const wakeBaby = (
+    over: Partial<NonNullable<BabyDispatchState["wake"]>> = {},
+  ) =>
+    baby({
+      lastFeed: null,
+      wake: {
+        dob: "2026-09-14",
+        lastSleep: { id: "S1", endedAt: minutesAgo(90) },
+        sleepRunning: false,
+        ...over,
+      },
+    });
+
+  it("W(ageDays) follows the table at every boundary", () => {
+    const cases: [number, number][] = [
+      [0, 60],
+      [27, 60],
+      [28, 90],
+      [90, 90],
+      [91, 120],
+      [150, 120],
+      [151, 180],
+      [240, 180],
+      [241, 210],
+      [365, 210],
+      [366, 240],
+    ];
+    for (const [days, minutes] of cases)
+      expect(wakeWindowMin(days)).toBe(minutes);
+  });
+
+  it("reminds once the baby has been awake W minutes", () => {
+    expect(selectDueNotifications([wakeBaby()], now)).toEqual([
+      {
+        userId: "u1",
+        kind: "wake",
+        refKey: "wake:S1",
+        title: "Bé thức đã 90 phút",
+        body: "Bé có thể đang mệt, thử cho bé ngủ.",
+        url: "/",
+        tag: "wake:b1",
+      },
+    ]);
+    expect(
+      selectDueNotifications(
+        [wakeBaby({ lastSleep: { id: "S1", endedAt: minutesAgo(89) } })],
+        now,
+      ),
+    ).toEqual([]);
+  });
+
+  it("stays quiet while asleep, without a recent sleep, or past 12 hours", () => {
+    for (const over of [
+      { sleepRunning: true },
+      { lastSleep: null },
+      { lastSleep: { id: "S1", endedAt: minutesAgo(12 * 60 + 1) } },
+    ])
+      expect(selectDueNotifications([wakeBaby(over)], now)).toEqual([]);
+    expect(
+      selectDueNotifications(
+        [wakeBaby({ lastSleep: { id: "S1", endedAt: minutesAgo(12 * 60) } })],
+        now,
+      ),
+    ).toHaveLength(1);
+  });
+
+  it("respects the wake switch and snooze", () => {
+    const due = selectDueNotifications(
+      [
+        baby({
+          lastFeed: null,
+          wake: {
+            dob: "2026-09-14",
+            lastSleep: { id: "S1", endedAt: minutesAgo(100) },
+            sleepRunning: false,
+          },
+          recipients: [
+            {
+              userId: "off",
+              prefs: {
+                feed_reminder: true,
+                wake_window: false,
+                vaccine: true,
+                snooze_until: null,
+              },
+            },
+            {
+              userId: "snoozed",
+              prefs: {
+                feed_reminder: true,
+                wake_window: true,
+                vaccine: true,
+                snooze_until: minutesAgo(-30),
+              },
+            },
+            {
+              userId: "on",
+              prefs: {
+                feed_reminder: true,
+                wake_window: true,
+                vaccine: true,
+                snooze_until: minutesAgo(1),
+              },
+            },
+          ],
+        }),
+      ],
+      now,
+    );
+    expect(due.map((d) => d.userId)).toEqual(["on"]);
+  });
+});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/pushSelection.test.ts`
Expected: FAIL — `Tests  4 failed | 11 passed (15)`; có `TypeError: wakeWindowMin is not a function` và `AssertionError: expected [] to deeply equal [ Array(1) ]`.

- [ ] **Step 3: Viết luật `wake`**

```diff
--- a/lib/rules/pushSelection.ts
+++ b/lib/rules/pushSelection.ts
@@ -1,7 +1,7 @@
 import { VACCINES } from "@/lib/content/vaccines";
 import type { VaccineDose } from "@/lib/content/vaccineSchema";
 import { addDays, formatDayShort, WEEKDAYS } from "./days";
-import { formatVnTime, vnDateString } from "./time";
+import { ageDays, formatVnTime, vnDateString } from "./time";
 import { buildSchedule, type DoseRecord } from "./vaccines";
 
 export type NotificationKind = "feed" | "wake" | "vaccine";
@@ -11,6 +11,7 @@
   // null: the user never saved preferences, so every switch is on (spec §5.2).
   prefs: {
     feed_reminder: boolean;
+    wake_window: boolean;
     vaccine: boolean;
     snooze_until: string | null;
   } | null;
@@ -22,6 +23,13 @@
   // Latest breast/bottle log by started_at, or null when there is none.
   lastFeed: { id: string; startedAt: string } | null;
   breastRunning: boolean;
+  // null: wake reminders are not evaluated for this baby.
+  wake: {
+    dob: string;
+    // Latest sleep log with ended_at, or null when there is none.
+    lastSleep: { id: string; endedAt: string } | null;
+    sleepRunning: boolean;
+  } | null;
   // null: vaccine reminders are not evaluated for this baby.
   vaccine: {
     dob: string;
@@ -43,7 +51,8 @@
 };
 
 const HOUR_MS = 3_600_000;
-const RECENT_FEED_MS = 12 * HOUR_MS;
+// Feed and wake reminders only look back 12 hours.
+const RECENT_MS = 12 * HOUR_MS;
 
 export function agoText(ms: number): string {
   const totalMinutes = Math.floor(ms / 60_000);
@@ -54,21 +63,65 @@
   return `${hours} giờ ${minutes} phút trước`;
 }
 
-function wantsFeed(recipient: Recipient, now: Date): boolean {
-  const prefs = recipient.prefs;
-  if (!prefs) return true;
-  if (!prefs.feed_reminder) return false;
+function notSnoozed(
+  prefs: { snooze_until: string | null },
+  now: Date,
+): boolean {
   return (
     prefs.snooze_until === null ||
     Date.parse(prefs.snooze_until) < now.getTime()
   );
 }
 
+function wantsFeed(recipient: Recipient, now: Date): boolean {
+  const prefs = recipient.prefs;
+  if (!prefs) return true;
+  return prefs.feed_reminder && notSnoozed(prefs, now);
+}
+
+function wantsWake(recipient: Recipient, now: Date): boolean {
+  const prefs = recipient.prefs;
+  if (!prefs) return true;
+  return prefs.wake_window && notSnoozed(prefs, now);
+}
+
+// Spec §8.3: W(ageDays), the awake time in minutes after which a reminder is due.
+export function wakeWindowMin(days: number): number {
+  if (days <= 27) return 60;
+  if (days <= 90) return 90;
+  if (days <= 150) return 120;
+  if (days <= 240) return 180;
+  if (days <= 365) return 210;
+  return 240;
+}
+
+// Spec §8.3 row "wake".
+function wakeReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
+  const wake = baby.wake;
+  if (!wake || wake.sleepRunning || !wake.lastSleep) return [];
+  const since = now.getTime() - Date.parse(wake.lastSleep.endedAt);
+  if (since > RECENT_MS) return [];
+  if (since < wakeWindowMin(ageDays(wake.dob, now)) * 60_000) return [];
+  const minutes = Math.floor(since / 60_000);
+  const sleepId = wake.lastSleep.id;
+  return baby.recipients
+    .filter((recipient) => wantsWake(recipient, now))
+    .map((recipient) => ({
+      userId: recipient.userId,
+      kind: "wake",
+      refKey: `wake:${sleepId}`,
+      title: `Bé thức đã ${minutes} phút`,
+      body: "Bé có thể đang mệt, thử cho bé ngủ.",
+      url: "/",
+      tag: `wake:${baby.babyId}`,
+    }));
+}
+
 function feedReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
   const last = baby.lastFeed;
   if (!last || baby.breastRunning) return [];
   const since = now.getTime() - Date.parse(last.startedAt);
-  if (since > RECENT_FEED_MS) return [];
+  if (since > RECENT_MS) return [];
   if (since < baby.feedIntervalMin * 60_000) return [];
   const body = `Cữ trước lúc ${formatVnTime(new Date(last.startedAt))} (${agoText(since)}).`;
   return baby.recipients
@@ -133,7 +186,7 @@
   );
 }
 
-// Spec §8.3: "feed" and "vaccine". "wake" comes later in release 2.
+// Spec §8.3: "feed", "wake" and "vaccine".
 export function selectDueNotifications(
   babies: BabyDispatchState[],
   now: Date,
@@ -141,6 +194,7 @@
 ): DueNotification[] {
   return babies.flatMap((baby) => [
     ...feedReminders(baby, now),
+    ...wakeReminders(baby, now),
     ...vaccineReminders(baby, now, vaccineDoses),
   ]);
 }
```

- [ ] **Step 4: Nạp giấc ngủ cho dispatch, sửa dữ liệu mẫu và công tắc**

```diff
--- a/lib/server/dispatchDeps.ts
+++ b/lib/server/dispatchDeps.ts
@@ -17,7 +17,7 @@
   const states: BabyDispatchState[] = [];
   for (const baby of babies) {
     const since = new Date(now.getTime() - TWELVE_HOURS_MS).toISOString();
-    const [feeds, running, members, doses] = await Promise.all([
+    const [feeds, sleeps, running, members, doses] = await Promise.all([
       db
         .from("logs")
         .select("id, started_at")
@@ -28,11 +28,19 @@
         .limit(1),
       db
         .from("logs")
-        .select("id")
+        .select("id, ended_at")
         .eq("baby_id", baby.id)
-        .eq("type", "breast")
-        .is("ended_at", null)
+        .eq("type", "sleep")
+        .gte("ended_at", since)
+        .order("ended_at", { ascending: false })
         .limit(1),
+      // Running timers: at most one per type (unique index), so two rows at most.
+      db
+        .from("logs")
+        .select("type")
+        .eq("baby_id", baby.id)
+        .in("type", ["breast", "sleep"])
+        .is("ended_at", null),
       db
         .from("family_members")
         .select("user_id")
@@ -43,7 +51,7 @@
         .select("vaccine_code, dose_no, status, given_on, due_on_override")
         .eq("baby_id", baby.id),
     ]);
-    for (const result of [feeds, running, members, doses])
+    for (const result of [feeds, sleeps, running, members, doses])
       if (result.error) throw result.error;
 
     const userIds = (members.data ?? []).flatMap((m) =>
@@ -53,19 +61,28 @@
       db.from("push_subscriptions").select("user_id").in("user_id", userIds),
       db
         .from("notification_prefs")
-        .select("user_id, feed_reminder, vaccine, snooze_until")
+        .select("user_id, feed_reminder, wake_window, vaccine, snooze_until")
         .in("user_id", userIds),
     ]);
     if (subscribed.error) throw subscribed.error;
     if (prefs.error) throw prefs.error;
     const withSubscription = new Set(subscribed.data.map((s) => s.user_id));
     const last = feeds.data?.[0];
+    const lastSleep = sleeps.data?.[0];
+    const runningTypes = new Set((running.data ?? []).map((r) => r.type));
 
     states.push({
       babyId: baby.id,
       feedIntervalMin: baby.feed_interval_min,
       lastFeed: last ? { id: last.id, startedAt: last.started_at } : null,
-      breastRunning: (running.data ?? []).length > 0,
+      breastRunning: runningTypes.has("breast"),
+      wake: {
+        dob: baby.dob,
+        lastSleep: lastSleep?.ended_at
+          ? { id: lastSleep.id, endedAt: lastSleep.ended_at }
+          : null,
+        sleepRunning: runningTypes.has("sleep"),
+      },
       vaccine: {
         dob: baby.dob,
         choices: parseChoices(baby.vaccine_choices),
@@ -80,6 +97,7 @@
             prefs: row
               ? {
                   feed_reminder: row.feed_reminder,
+                  wake_window: row.wake_window,
                   vaccine: row.vaccine,
                   snooze_until: row.snooze_until,
                 }
```

```diff
--- a/lib/server/dispatch.test.ts
+++ b/lib/server/dispatch.test.ts
@@ -15,6 +15,7 @@
   feedIntervalMin: 180,
   lastFeed: { id: "L1", startedAt: "2026-11-14T23:00:00Z" }, // 4 hours ago
   breastRunning: false,
+  wake: null,
   vaccine: null,
   recipients: [{ userId: "u1", prefs: null }],
 };
```

```diff
--- a/lib/rules/notifications.ts
+++ b/lib/rules/notifications.ts
@@ -11,11 +11,7 @@
   note: string | null;
 }[] = [
   { key: "feed_reminder", label: "Nhắc cữ bú", note: null },
-  {
-    key: "wake_window",
-    label: "Nhắc khi bé thức quá lâu",
-    note: "Có từ đợt 2",
-  },
+  { key: "wake_window", label: "Nhắc khi bé thức quá lâu", note: null },
   { key: "vaccine", label: "Nhắc lịch tiêm", note: null },
 ];
 
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/pushSelection.test.ts && bun run typecheck && bun run test && bun run build`
Expected: PASS — `Tests  15 passed (15)` cho file này; không lỗi type; cả bộ `Tests  216 passed (216)`; build thành công.

- [ ] **Step 6: Commit**

```bash
git add lib/rules/pushSelection.ts lib/rules/pushSelection.test.ts lib/server/dispatchDeps.ts lib/server/dispatch.test.ts lib/rules/notifications.ts && git commit -m "feat(push): wake reminders after W(ageDays) awake"
```

---

### Task 5: Checklist bước 10, 11 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 3, Task 4
- Produces: checklist bước 10, 11

- [ ] **Step 1: Sửa bước 7 và thêm bước 10, 11**

Trong `## Bước 7 — Tạm tắt (M11, phần nhắc bú)`, thêm một dòng ngay dưới tiêu đề (trước mục 1):

```markdown
Nhắc thức cũng bị tạm tắt chặn: kiểm ở bước 11, mục 5.
```

Thêm vào cuối file (sau bước 9 của M16):

````markdown
## Bước 10 — Khẩn cấp (M17)

1. Tiện ích → Khẩn cấp. Kỳ vọng: nút đỏ "Cấp cứu 115" ở đầu; thẻ "Hồ sơ của bé" có tên, tuổi, nhóm máu, dị ứng, cân nặng (lúc sinh nếu chưa có lần đo).
2. "Thêm số bác sĩ, người thân" → thêm hai số (ví dụ bác sĩ nhi và ông bà) → Lưu từng số. Bấm ↑ ở số thứ hai. Kỳ vọng: thứ tự đổi; máy thứ hai thấy cùng thứ tự sau khi mở lại trang.
3. Bấm một số trong danh sách. Kỳ vọng: iPhone hỏi gọi đúng số đó (bấm Hủy).
4. Chủ gia đình: "Sửa nhóm máu, dị ứng" → chọn nhóm máu, ghi dị ứng → Lưu. Kỳ vọng: thẻ hồ sơ hiện giá trị mới.
5. Bật chế độ máy bay, đóng hẳn app rồi mở lại → Tiện ích → Khẩn cấp. Kỳ vọng: vẫn thấy nút 115, danh bạ và hồ sơ; nút Lưu trong phần sửa bị mờ kèm "Cần kết nối mạng".

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 11 — Nhắc khi bé thức quá lâu (M17)

1. Cài đặt → Thông báo: công tắc "Nhắc khi bé thức quá lâu" đang bật, không còn dòng "Có từ đợt 2".
2. Tra ngưỡng theo tuổi bé hôm nay: 0–27 ngày 60 phút; 28–90 ngày 90 phút; 91–150 ngày 120 phút; 151–240 ngày 180 phút; 241–365 ngày 210 phút; trên 365 ngày 240 phút. Gọi ngưỡng là W.
3. Nhật ký → "+ Thêm" → Ngủ, kết thúc lúc bây giờ trừ (W − 1) phút → Lưu. Đảm bảo không có giấc ngủ nào đang chạy và không có giấc ngủ thật nào kết thúc muộn hơn giấc thử. Khóa màn hình.
4. Kỳ vọng: trong ≤ 3 phút nhận "Bé thức đã W phút" (có thể là W + 1 hoặc W + 2 tùy lúc cron chạy) / "Bé có thể đang mệt, thử cho bé ngủ." trên mọi máy đã bật thông báo; bấm vào mở trang chủ.
5. Lặp lại bước 3 với một giấc ngủ khác sau khi bấm Cài đặt → Thông báo → "2 giờ". Kỳ vọng: không có nhắc thức trong 5 phút. Bấm "Bật lại". Kỳ vọng: nhắc đến trong ≤ 2 phút.
6. Dọn dẹp: xóa các giấc ngủ thử.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
````

Run: `grep -n '^## ' docs/device-checklist.md`
Expected: hai tiêu đề cuối là `## Bước 10 — Khẩn cấp (M17)` và `## Bước 11 — Nhắc khi bé thức quá lâu (M17)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist steps 10 and 11 for emergency info and wake reminders" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/khan-cap`
Expected: `200`. Lưu ý trong báo cáo: phút cron đầu tiên sau deploy có thể gửi một nhắc "Bé thức đã N phút" cho giấc ngủ thật kết thúc trong 12 giờ qua (đúng luật §8.3, chỉ một lần cho mỗi giấc).

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bảng kết quả bước 10, 11 để trống. Trong báo cáo cuối ghi: "Checklist bước 10 và 11 chờ người dùng."

---

## Ngoài phạm vi M17

- Tăng trưởng WHO (`growth`, bảng LMS, biểu đồ); thẻ hồ sơ khi đó dùng cân nặng đo gần nhất.
- Phân loại triệu chứng (nút gọi bác sĩ dùng lại `CallList`) và bài bệnh thường gặp.
