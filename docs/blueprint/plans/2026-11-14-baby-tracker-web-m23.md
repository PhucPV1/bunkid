# Baby Tracker Web — M23 (Nhạc YouTube và bồng bế) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/nhac` (spec §6.11): hai tab "Thư giãn / ru ngủ" và "Phát triển trí não" với mục có sẵn (mở YouTube bằng trang tìm kiếm), link YouTube gia đình tự dán (`music_links`), ẩn/hiện mục; bấm một mục thì mở app YouTube, không mở được thì mở web YouTube. Trang `/bong-be` (§6.10): tư thế bế và địu theo giai đoạn, có bước làm, lưu ý an toàn và nút "Xem video".

**Architecture:**
- **Dữ liệu:** migration `20261114000700_music_links.sql` (bảng `music_links`, RLS §5.2: mọi thành viên sửa/ẩn được; xóa chỉ chủ gia đình hoặc người tạo), pgTAP `009`. Ghi trực tiếp, cần mạng (§9).
- **Quy tắc thuần:** `lib/rules/youtube.ts` (`parseYouTubeUrl`, `youtubePath`, `openYouTube` nhận dependencies nên test được hẹn giờ 1,5 giây và việc hủy khi trang mất focus); `lib/rules/music.ts` (ghép mục có sẵn với các dòng `music_links`).
- **Nội dung:** `content/music.vi.json` (8 mục có sẵn), `content/holding.vi.json` (3 giai đoạn, 9 tư thế, mỗi tư thế có nguồn), kiểm bằng zod.
- **Giao diện:** `components/music/MusicScreen.tsx`, `components/holding/HoldingScreen.tsx`.

**Tech Stack:** như M1–M22. Không thêm gói nào.

**Milestones của đợt phát hành 3:**
- M22: xong (hút sữa, tummy time, tiếng ồn trắng).
- **M23 (plan này):** nhạc YouTube và bồng bế; checklist bước 5 và 16.
- M24: ảnh. M25: mốc phát triển. M26: báo cáo cho bác sĩ, chốt đợt 3.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **`parseYouTubeUrl` (§6.11):** nhận `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/` (và `/live/`), `m.youtube.com`, `music.youtube.com`, `youtube.com/playlist?list=`; link thiếu `https://` vẫn nhận. Link `watch` có cả `list=` thì mở video. Id video đúng 11 ký tự `[A-Za-z0-9_-]`, id playlist 10–64 ký tự. Host khác (kể cả `youtube.com.evil.example`) hoặc thiếu id → không hợp lệ; ô nhập báo "Link YouTube không hợp lệ." ngay khi gõ. Form dùng `noValidate`, nên Safari không tự chặn link thiếu `https://`.
- **Mở app YouTube (§6.11):** gán `location.href = youtube://www.youtube.com/<path>`, hẹn 1500 ms; nếu trước đó có `visibilitychange` sang `hidden`, `pagehide` hoặc `blur` thì hủy hẹn giờ. Hẹn giờ chạy hết thì `location.href = https://www.youtube.com/<path>` (cùng tab, không `window.open`). Mỗi mục có thêm link "Mở trên web" (`target="_blank" rel="noopener"`).
- **Bảng `music_links`:** đúng cột §5; thêm ràng buộc `title` 1–80 ký tự, id video/playlist đúng dạng, `unique (family_id, preset_code)` (NULL không đụng nhau, nên link tự dán không bị giới hạn) để ẩn mục có sẵn là một upsert `onConflict: "family_id,preset_code"`. Trigger `forbid_immutable_change('id', 'family_id', 'created_by')`. pgTAP khóa đúng câu §10.2: thành viên sửa được `music_links` của người khác nhưng không xóa được.
- **Ẩn mục có sẵn:** tạo/cập nhật dòng `{ preset_code, category, hidden }`; "Hiện lại" đặt `hidden = false`. Link tự dán ẩn bằng `hidden = true`. Mục đã ẩn chỉ hiện khi bấm "Hiện các mục đã ẩn (n)". Nút "Xóa" chỉ hiện cho link tự dán của chính mình, hoặc với chủ gia đình.
- **Mạng:** đọc từ cache khi offline; nút Ẩn/Hiện lại/Xóa bị tắt khi offline (`useOnline`) kèm dòng "Cần kết nối mạng để ẩn, hiện lại hoặc xóa." phía trên danh sách; form thêm link nằm trong `OnlineOnly`.
- **Tab "Phát triển trí não"** có dòng đúng nguyên văn spec: "Chỉ cho bé nghe, không cho bé xem màn hình. WHO khuyến nghị trẻ dưới 2 tuổi không xem màn hình."
- **Bồng bế (§6.10):** ba giai đoạn 0–3 tháng, 3–6 tháng, trên 6 tháng; tab mặc định theo tuổi bé (dưới 91 ngày, dưới 183 ngày, còn lại). Mỗi tư thế: tên, các bước, lưu ý an toàn, nút "Xem video" (tìm kiếm YouTube, mở như mục nhạc), link nguồn. Không có hình minh họa.
- **Nguồn bồng bế:** CDC "Learn the Signs. Act Early." (bé giữ vững đầu khi được bế vào khoảng 4 tháng), NHS (ợ hơi, giữ bé thẳng sau bú; quy tắc địu T.I.C.K.S., không cho bú trong địu), tài liệu T.I.C.K.S. của UK Sling Consortium. Địu hướng ra ngoài (trên 6 tháng) có lưu ý riêng: chỉ với địu cho phép, thời gian ngắn, quay vào khi bé mệt; các quy tắc nhìn thấy mặt, chân chữ M ghi rõ là cho lúc bé hướng vào trong. Tư thế "Bế hông" chưa có trang nguồn riêng đọc được; nguồn ghi là tài liệu T.I.C.K.S. cho phần giữ bé sát người. Tư thế chân chữ M khi địu là yêu cầu của spec §6.10; các trang của Viện Loạn sản khớp háng quốc tế (IHDI) không đọc tự động được lúc lập plan, nên dòng này chưa có trang nguồn riêng.
- **Bước của người dùng:** checklist bước 5 (spec §10.3 bước 5) và 16 cần điện thoại thật; ghi là đang chờ.

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

Riêng M23:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier). Không chạy prettier trên `content/music.vi.json`, `content/holding.vi.json`.
- Câu chữ tiếng Việt trong `content/*.vi.json` mới, `lib/rules/music.ts` và `components/music/`, `components/holding/` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, tới commit cuối của M22):

- M1: `families`, `is_member`, `is_owner`, `forbid_immutable_change`; M13: `OnlineOnly`, `useOnline`; `PermissionDeniedError`, `toVietnameseError`
- `GUIDE_ITEMS`, `TOOL_ITEMS` (`lib/nav.ts`); `sw/sw.template.js` (`/bong-be` đã có trong `GUIDES`); `ageDays` (`lib/rules/time.ts`); checklist tới bước 15

**Produces** (M25, M26 dùng):

- Bảng `music_links`, `MusicLinkRow`
- `lib/rules/youtube.ts`: `YouTubeTarget`, `parseYouTubeUrl`, `youtubePath`, `appUrl`, `webUrl`, `OpenDeps`, `FALLBACK_MS`, `openYouTube`, `browserOpenDeps`
- `lib/rules/music.ts`: `MusicLinkLike`, `MusicItem`, `BRAIN_NOTE`, `musicItems`, `parseLinkTitle`
- `lib/content/music.ts` (`MusicCategory`, `MusicPreset`, `MUSIC_PRESETS`), `lib/content/holding.ts` (`HoldingPosition`, `HOLDING`)
- `lib/data/music.ts`: `useMusicLinks(familyId)`, `useMusicActions(familyId) → { add, setPresetHidden, setLinkHidden, remove }`
- Trang `/nhac`, `/bong-be`; checklist bước 5 và 16

## File Structure

```
supabase/migrations/20261114000700_music_links.sql, supabase/tests/009_music_links.test.sql
lib/supabase/types.ts, lib/supabase/rows.ts   # sinh lại; MusicLinkRow
lib/rules/youtube.ts (+ test)            # tách link, dựng đường dẫn, mở app rồi web
content/music.vi.json, content/holding.vi.json, lib/content/music.ts, lib/content/holding.ts (+ guides.test.ts)
lib/rules/music.ts (+ test)              # ghép mục có sẵn và link gia đình
lib/data/music.ts; components/music/MusicScreen.tsx; app/nhac/page.tsx
components/holding/HoldingScreen.tsx; app/bong-be/page.tsx
lib/nav.ts (+ test), sw/sw.template.js, docs/device-checklist.md
```

## Tasks

1. Bảng `music_links`
2. Link YouTube và mở app
3. Nội dung nhạc, bồng bế và danh sách nhạc
4. Trang `/nhac` và `/bong-be`
5. Checklist bước 5, 16 và deploy

---

### Task 1: Bảng `music_links`

**Files:**

- Create: `supabase/migrations/20261114000700_music_links.sql`
- Modify: `lib/supabase/types.ts` (sinh lại), `lib/supabase/rows.ts`
- Test: `supabase/tests/009_music_links.test.sql`

**Interfaces:**

- Consumes: `public.families`, `is_member`, `is_owner`, `forbid_immutable_change` (M1)
- Produces: bảng `public.music_links(id, family_id, category, title, youtube_video_id, youtube_playlist_id, preset_code, hidden, created_by, created_at)`, `unique (family_id, preset_code)`; `MusicLinkRow`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m23.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `docs: device checklist steps 6 and 15` của M22.

- [ ] **Step 2: Viết test pgTAP thất bại**

Tạo `supabase/tests/009_music_links.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000009', 'ma@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000009', 'mb@example.com'),
  ('cccccccc-0000-0000-0000-000000000009', 'mc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000009', 'Nhà M');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000009', 'ma@example.com', 'aaaaaaaa-0000-0000-0000-000000000009', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000009', 'mb@example.com', 'bbbbbbbb-0000-0000-0000-000000000009', 'member', 'Bà');
insert into public.music_links (id, family_id, category, title, youtube_video_id, created_by) values
  ('a1000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000009', 'relax', 'Ru con', 'dQw4w9WgXcQ', 'aaaaaaaa-0000-0000-0000-000000000009');

select throws_ok(
  $$ insert into public.music_links (family_id, category, created_by)
     values ('f0000000-0000-0000-0000-000000000009', 'relax', 'aaaaaaaa-0000-0000-0000-000000000009') $$,
  '23514', null, 'a link needs a preset, a video or a playlist');
select throws_ok(
  $$ insert into public.music_links (family_id, category, youtube_video_id, created_by)
     values ('f0000000-0000-0000-0000-000000000009', 'relax', 'bad id', 'aaaaaaaa-0000-0000-0000-000000000009') $$,
  '23514', null, 'video id must look like a YouTube id');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000009","email":"mc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.music_links', 'outsider sees no music links');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000009","email":"mb@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.music_links (family_id, category, preset_code, hidden)
     values ('f0000000-0000-0000-0000-000000000009', 'brain', 'brain_mozart', true)
     on conflict (family_id, preset_code)
     do update set hidden = excluded.hidden $$,
  'member hides a preset with an upsert');
select isnt_empty(
  $$ update public.music_links set hidden = true where id = 'a1000000-0000-0000-0000-000000000009' returning id $$,
  'member hides a link the owner added (spec §10.2)');
select is_empty(
  $$ delete from public.music_links where id = 'a1000000-0000-0000-0000-000000000009' returning id $$,
  'member cannot delete a link the owner added (spec §10.2)');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000009","email":"ma@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ delete from public.music_links where preset_code = 'brain_mozart' returning id $$,
  'owner deletes the member''s row');
select throws_ok(
  $$ update public.music_links set family_id = 'f0000000-0000-0000-0000-000000000099' where id = 'a1000000-0000-0000-0000-000000000009' $$,
  'P0001', 'immutable_column: family_id', 'family_id is immutable');
reset role;
select is(
  (select hidden from public.music_links where id = 'a1000000-0000-0000-0000-000000000009'),
  true,
  'the member''s hide was saved and the row still exists');

select * from finish();
rollback;
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `009_music_links.test.sql` báo `relation "public.music_links" does not exist`; `001`…`008` vẫn `ok`.

- [ ] **Step 4: Viết migration**

Tạo `supabase/migrations/20261114000700_music_links.sql`:

```sql
create table public.music_links (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  category text not null check (category in ('relax', 'brain')),
  title text check (title is null or length(btrim(title)) between 1 and 80),
  youtube_video_id text check (youtube_video_id is null or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  youtube_playlist_id text check (youtube_playlist_id is null or youtube_playlist_id ~ '^[A-Za-z0-9_-]{10,64}$'),
  preset_code text check (preset_code is null or preset_code ~ '^[a-z0-9_]{1,40}$'),
  hidden boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  check (preset_code is not null or youtube_video_id is not null or youtube_playlist_id is not null),
  -- One row per preset per family, so hiding a preset is an upsert. NULLs never clash,
  -- so pasted links (preset_code null) are not limited.
  unique (family_id, preset_code)
);
create index music_links_family_idx on public.music_links (family_id, created_at);

create trigger music_links_immutable before update on public.music_links
  for each row execute function public.forbid_immutable_change('id', 'family_id', 'created_by');

alter table public.music_links enable row level security;

-- Spec §5.2: every member hides, unhides and edits; delete only your own row, or any row as owner.
create policy music_links_select on public.music_links for select to authenticated
  using (public.is_member(family_id));
create policy music_links_insert on public.music_links for insert to authenticated
  with check (public.is_member(family_id) and created_by = auth.uid());
create policy music_links_update on public.music_links for update to authenticated
  using (public.is_member(family_id))
  with check (public.is_member(family_id));
create policy music_links_delete on public.music_links for delete to authenticated
  using (
    public.is_owner(family_id)
    or (public.is_member(family_id) and created_by = auth.uid())
  );
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001`…`008` `ok`, `009_music_links.test.sql .. ok`, `All tests successful.`

- [ ] **Step 6: Sinh lại kiểu, thêm `MusicLinkRow`**

Run: `bun run db:types && grep -c '"music_links"' lib/supabase/types.ts`
Expected: số đếm ≥ 1.

Thêm dòng cuối vào `lib/supabase/rows.ts`:

```ts
export type MusicLinkRow = Tables["music_links"]["Row"];
```

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; `Tests  274 passed (274)`.

- [ ] **Step 7: Commit và đưa migration lên cloud**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m23.md supabase/migrations/20261114000700_music_links.sql supabase/tests/009_music_links.test.sql lib/supabase/types.ts lib/supabase/rows.ts && git commit -m "feat(music): music_links table with RLS"
```

Run: `bunx supabase db push --linked --yes`
Expected: `Applying migration 20261114000700_music_links.sql...`, `Finished supabase db push.` Nếu CLI cần mật khẩu DB hoặc báo chưa link project, dừng bước này và ghi vào báo cáo cuối như việc người dùng tự làm.

---

### Task 2: Link YouTube và mở app

**Files:**

- Create: `lib/rules/youtube.ts`
- Test: `lib/rules/youtube.test.ts`

**Interfaces:**

- Produces: `YouTubeTarget = { kind: "video" | "playlist"; id }`, `parseYouTubeUrl(raw): YouTubeTarget | null`, `youtubePath(target | { kind: "search"; query })`, `appUrl(path)`, `webUrl(path)`, `OpenDeps = { go; setTimer; clearTimer; onLeave }`, `FALLBACK_MS = 1500`, `openYouTube(path, deps)`, `browserOpenDeps()`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/youtube.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  FALLBACK_MS,
  openYouTube,
  parseYouTubeUrl,
  youtubePath,
  type OpenDeps,
} from "./youtube";

const V = "dQw4w9WgXcQ";
const L = "PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG";

describe("parseYouTubeUrl (spec §6.11)", () => {
  it("reads every supported form", () => {
    const video = { kind: "video", id: V };
    for (const url of [
      `https://www.youtube.com/watch?v=${V}`,
      `https://youtube.com/watch?v=${V}&list=${L}`,
      `https://youtu.be/${V}?si=abc`,
      `https://www.youtube.com/shorts/${V}`,
      `https://www.youtube.com/live/${V}?feature=share`,
      `https://m.youtube.com/watch?v=${V}`,
      `https://music.youtube.com/watch?v=${V}`,
      `youtu.be/${V}`,
      `  https://www.youtube.com/watch?feature=share&v=${V}  `,
    ])
      expect(parseYouTubeUrl(url), url).toEqual(video);
    expect(
      parseYouTubeUrl(`https://www.youtube.com/playlist?list=${L}`),
    ).toEqual({ kind: "playlist", id: L });
    for (const host of ["music.youtube.com", "m.youtube.com"])
      expect(parseYouTubeUrl(`https://${host}/playlist?list=${L}`)).toEqual({
        kind: "playlist",
        id: L,
      });
  });

  it("rejects other sites, missing ids and malformed links", () => {
    for (const url of [
      "",
      "không phải link",
      `https://vimeo.com/${V}`,
      `https://youtube.com.evil.example/watch?v=${V}`,
      "https://www.youtube.com/watch",
      "https://www.youtube.com/watch?v=short",
      "https://youtu.be/",
      "https://www.youtube.com/playlist",
      "https://www.youtube.com/@kenh",
    ])
      expect(parseYouTubeUrl(url), url).toBeNull();
  });
});

describe("youtubePath", () => {
  it("builds watch, playlist and search paths", () => {
    expect(youtubePath({ kind: "video", id: V })).toBe(`watch?v=${V}`);
    expect(youtubePath({ kind: "playlist", id: L })).toBe(`playlist?list=${L}`);
    expect(youtubePath({ kind: "search", query: "nhạc ru ngủ cho bé" })).toBe(
      "results?search_query=nh%E1%BA%A1c%20ru%20ng%E1%BB%A7%20cho%20b%C3%A9",
    );
  });
});

describe("openYouTube (spec §6.11)", () => {
  function fakeDeps() {
    const visits: string[] = [];
    let leave: (() => void) | null = null;
    let pending: (() => void) | null = null;
    const deps: OpenDeps = {
      go: (href) => visits.push(href),
      setTimer: vi.fn((fn: () => void, ms: number) => {
        expect(ms).toBe(FALLBACK_MS);
        pending = fn;
        return 1;
      }),
      clearTimer: vi.fn(() => {
        pending = null;
      }),
      onLeave: (fn) => {
        leave = fn;
        return () => {
          leave = null;
        };
      },
    };
    return {
      deps,
      visits,
      leave: () => leave?.(),
      fire: () => pending?.(),
    };
  }

  it("opens the app and stays there when the page loses focus", () => {
    const t = fakeDeps();
    openYouTube(`watch?v=${V}`, t.deps);
    t.leave();
    t.fire();
    expect(t.visits).toEqual([`youtube://www.youtube.com/watch?v=${V}`]);
  });

  it("falls back to the web page in the same tab when nothing happened in 1.5 s", () => {
    const t = fakeDeps();
    openYouTube(`watch?v=${V}`, t.deps);
    t.fire();
    expect(t.visits).toEqual([
      `youtube://www.youtube.com/watch?v=${V}`,
      `https://www.youtube.com/watch?v=${V}`,
    ]);
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/youtube.test.ts`
Expected: FAIL — `Error: Cannot find module './youtube' imported from …/lib/rules/youtube.test.ts`

- [ ] **Step 3: Viết quy tắc**

Tạo `lib/rules/youtube.ts`:

```ts
export type YouTubeTarget =
  { kind: "video"; id: string } | { kind: "playlist"; id: string };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const LIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

// Spec §6.11: watch?v=, youtu.be/, shorts/, m., music., playlist?list=.
// A watch link that also carries list= opens the video.
export function parseYouTubeUrl(raw: string): YouTubeTarget | null {
  let url: URL;
  try {
    const text = raw.trim();
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!HOSTS.has(host)) return null;
  const video = (id: string | null | undefined): YouTubeTarget | null =>
    id && VIDEO_ID.test(id) ? { kind: "video", id } : null;
  if (host === "youtu.be") return video(url.pathname.split("/")[1]);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "watch") return video(url.searchParams.get("v"));
  if (parts[0] === "shorts" || parts[0] === "live") return video(parts[1]);
  if (parts[0] === "playlist") {
    const list = url.searchParams.get("list");
    return list && LIST_ID.test(list) ? { kind: "playlist", id: list } : null;
  }
  return null;
}

// "<path>" of spec §6.11.
export function youtubePath(
  target: YouTubeTarget | { kind: "search"; query: string },
): string {
  if (target.kind === "video") return `watch?v=${target.id}`;
  if (target.kind === "playlist") return `playlist?list=${target.id}`;
  return `results?search_query=${encodeURIComponent(target.query)}`;
}

export const appUrl = (path: string) => `youtube://www.youtube.com/${path}`;
export const webUrl = (path: string) => `https://www.youtube.com/${path}`;

export type OpenDeps = {
  go: (href: string) => void;
  setTimer: (fn: () => void, ms: number) => number;
  clearTimer: (id: number) => void;
  // Registers a one-shot "the page lost focus" listener; returns an unsubscribe.
  onLeave: (fn: () => void) => () => void;
};

export const FALLBACK_MS = 1500;

// Spec §6.11: try the app; if the page never loses focus within 1.5 s, open the
// web page in the same tab.
export function openYouTube(path: string, deps: OpenDeps): void {
  let timer = 0;
  const stopListening = deps.onLeave(() => {
    deps.clearTimer(timer);
    stopListening();
  });
  timer = deps.setTimer(() => {
    stopListening();
    deps.go(webUrl(path));
  }, FALLBACK_MS);
  deps.go(appUrl(path));
}

export function browserOpenDeps(): OpenDeps {
  return {
    go: (href) => {
      window.location.href = href;
    },
    setTimer: (fn, ms) => window.setTimeout(fn, ms),
    clearTimer: (id) => window.clearTimeout(id),
    onLeave: (fn) => {
      const onVisibility = () => {
        if (document.visibilityState === "hidden") fn();
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("pagehide", fn);
      window.addEventListener("blur", fn);
      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pagehide", fn);
        window.removeEventListener("blur", fn);
      };
    },
  };
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/youtube.test.ts && bun run typecheck`
Expected: PASS — `Tests  5 passed (5)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/youtube.ts lib/rules/youtube.test.ts && git commit -m "feat(music): parse YouTube links and open the app, falling back to the web"
```

---

### Task 3: Nội dung nhạc, bồng bế và danh sách nhạc

**Files:**

- Create: `content/music.vi.json`, `content/holding.vi.json`, `lib/content/music.ts`, `lib/content/holding.ts`, `lib/rules/music.ts`
- Test: `lib/content/guides.test.ts`, `lib/rules/music.test.ts`

**Interfaces:**

- Consumes: `YouTubeTarget` (Task 2)
- Produces: `MusicCategory`, `MusicPreset`, `MUSIC_PRESETS`; `HoldingPosition`, `HOLDING`; `MusicLinkLike`, `MusicItem`, `BRAIN_NOTE`, `musicItems({ presets, links, category })`, `parseLinkTitle(raw)`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/content/guides.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { HOLDING } from "./holding";
import { MUSIC_PRESETS } from "./music";

describe("content/holding.vi.json (spec §6.10)", () => {
  it("has the three stages in order, each with sourced positions", () => {
    expect(HOLDING.stages.map((s) => s.name)).toEqual([
      "0–3 tháng",
      "3–6 tháng",
      "Trên 6 tháng",
    ]);
    const codes = HOLDING.stages.flatMap((s) => s.positions.map((p) => p.code));
    expect(new Set(codes).size).toBe(codes.length);
    for (const p of HOLDING.stages.flatMap((s) => s.positions)) {
      expect(p.source, p.code).toMatch(/^https:\/\//);
      expect(p.reviewedAt, p.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("tells parents of babies under 3 months to support the head and neck", () => {
    for (const p of HOLDING.stages[0].positions.filter(
      (x) => !x.code.startsWith("carrier"),
    ))
      expect(p.safety.join(" "), p.code).toMatch(/đỡ (đầu và cổ|cằm)/);
  });

  it("every carrier position keeps the M position and the TICKS points", () => {
    const carriers = HOLDING.stages
      .flatMap((s) => s.positions)
      .filter((p) => p.code.startsWith("carrier"));
    expect(carriers.length).toBe(3);
    for (const p of carriers) {
      const text = p.safety.join(" ");
      expect(text, p.code).toContain("chữ M");
      expect(text, p.code).toContain("một ngón tay dưới cằm");
      expect(text, p.code).toContain("nhìn thấy mặt bé");
    }
  });
});

describe("content/music.vi.json (spec §6.11)", () => {
  it("has presets in both tabs with unique codes", () => {
    const codes = MUSIC_PRESETS.map((p) => p.presetCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(MUSIC_PRESETS.map((p) => p.category))).toEqual(
      new Set(["relax", "brain"]),
    );
  });
});
```

Tạo `lib/rules/music.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { MusicPreset } from "@/lib/content/music";
import { musicItems, parseLinkTitle, type MusicLinkLike } from "./music";

const presets: MusicPreset[] = [
  { presetCode: "relax_a", category: "relax", title: "A", searchQuery: "ru a" },
  { presetCode: "relax_b", category: "relax", title: "B", searchQuery: "ru b" },
  { presetCode: "brain_c", category: "brain", title: "C", searchQuery: "c" },
];
const link = (over: Partial<MusicLinkLike>): MusicLinkLike => ({
  id: "l1",
  category: "relax",
  title: null,
  youtube_video_id: null,
  youtube_playlist_id: null,
  preset_code: null,
  hidden: false,
  created_by: "u1",
  ...over,
});

describe("musicItems (spec §6.11)", () => {
  it("lists the tab's presets, then the family's links, with hidden flags", () => {
    const items = musicItems({
      presets,
      category: "relax",
      links: [
        link({ id: "h", preset_code: "relax_b", hidden: true }),
        link({ id: "v", title: " Ru con ", youtube_video_id: "dQw4w9WgXcQ" }),
        link({
          id: "p",
          youtube_playlist_id: "PLx0sYbCqOb8TBPRdmB",
          hidden: true,
        }),
        link({ id: "x", category: "brain", youtube_video_id: "dQw4w9WgXcQ" }),
      ],
    });
    expect(items.map((i) => [i.key, i.title, i.hidden])).toEqual([
      ["preset:relax_a", "A", false],
      ["preset:relax_b", "B", true],
      ["link:v", "Ru con", false],
      ["link:p", "Link YouTube", true],
    ]);
    expect(items[0].target).toEqual({ kind: "search", query: "ru a" });
    expect(items[3].target).toEqual({
      kind: "playlist",
      id: "PLx0sYbCqOb8TBPRdmB",
    });
  });

  it("an unhidden preset row does not hide the preset", () => {
    const items = musicItems({
      presets,
      category: "brain",
      links: [
        link({ preset_code: "brain_c", category: "brain", hidden: false }),
      ],
    });
    expect(items).toHaveLength(1);
    expect(items[0].hidden).toBe(false);
  });
});

describe("parseLinkTitle", () => {
  it("trims, allows empty and caps at 80 characters", () => {
    expect(parseLinkTitle("  Ru  ")).toBe("Ru");
    expect(parseLinkTitle(" ")).toBeNull();
    expect(parseLinkTitle("x".repeat(81))).toBe("too_long");
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/content/guides.test.ts lib/rules/music.test.ts`
Expected: FAIL — `Error: Cannot find module './holding' imported from …/lib/content/guides.test.ts` và `Error: Cannot find module './music' imported from …/lib/rules/music.test.ts`

- [ ] **Step 3: Viết hai file nội dung**

Tạo `content/music.vi.json` đúng từng ký tự:

```json
{
  "presets": [
    {"presetCode": "relax_hat_ru", "category": "relax", "title": "Hát ru Việt Nam", "searchQuery": "hát ru con ngủ dân ca Việt Nam"},
    {"presetCode": "relax_nhac_hop", "category": "relax", "title": "Nhạc hộp ru ngủ", "searchQuery": "nhạc hộp ru ngủ cho bé"},
    {"presetCode": "relax_piano", "category": "relax", "title": "Piano nhẹ ru ngủ", "searchQuery": "nhạc piano nhẹ ru ngủ cho em bé"},
    {"presetCode": "relax_mua", "category": "relax", "title": "Tiếng mưa êm", "searchQuery": "tiếng mưa êm ru ngủ em bé"},
    {"presetCode": "brain_mozart", "category": "brain", "title": "Mozart cho bé", "searchQuery": "Mozart cho trẻ sơ sinh"},
    {"presetCode": "brain_co_dien", "category": "brain", "title": "Nhạc cổ điển nhẹ nhàng", "searchQuery": "nhạc cổ điển nhẹ nhàng cho em bé"},
    {"presetCode": "brain_thieu_nhi", "category": "brain", "title": "Bài hát thiếu nhi Việt Nam", "searchQuery": "bài hát thiếu nhi Việt Nam cho bé"},
    {"presetCode": "brain_dong_dao", "category": "brain", "title": "Đồng dao cho bé", "searchQuery": "đồng dao Việt Nam cho bé"}
  ]
}
```

Tạo `content/holding.vi.json` đúng từng ký tự (mỗi tư thế một dòng):

```json
{
  "title": "Bồng bế theo giai đoạn",
  "intro": "Các tư thế bế và địu theo tuổi của bé. Bấm \"Xem video\" để tìm video hướng dẫn trên YouTube.",
  "reviewedAt": "2026-11-14",
  "stages": [
    {"code": "0_3", "name": "0–3 tháng", "positions": [
      {"code": "cradle", "name": "Bế nằm ngang trong vòng tay", "steps": ["Luồn một tay dưới đầu và cổ bé, tay kia đỡ mông.", "Nhấc bé lên sát ngực bạn.", "Để đầu bé tựa vào khuỷu tay, cao hơn bụng một chút; tay còn lại đỡ mông và lưng."], "safety": ["Luôn đỡ đầu và cổ bé: khoảng 4 tháng tuổi bé mới tự giữ vững đầu khi được bế.", "Không bế bé khi đang cầm đồ nóng hoặc đang nấu ăn."], "searchQuery": "cách bế trẻ sơ sinh tư thế nằm ngang", "source": "https://www.cdc.gov/act-early/milestones/4-months.html", "reviewedAt": "2026-11-14"},
      {"code": "shoulder", "name": "Bế áp vai (giúp bé ợ hơi)", "steps": ["Đặt bé dựa thẳng vào ngực, cằm bé tựa lên vai bạn.", "Một tay đỡ mông, tay kia đỡ đầu và cổ.", "Nhẹ nhàng xoa hoặc vỗ lưng bé sau mỗi cữ bú."], "safety": ["Luôn đỡ đầu và cổ bé: khoảng 4 tháng tuổi bé mới tự giữ vững đầu khi được bế.", "Kiểm tra mũi và miệng bé không bị vai hay áo che kín.", "Giữ bé thẳng người một lúc sau khi bú giúp bé đỡ trớ."], "searchQuery": "cách bế vác vai cho trẻ sơ sinh ợ hơi", "source": "https://www.nhs.uk/conditions/reflux-in-babies/", "reviewedAt": "2026-11-14"},
      {"code": "sit_burp", "name": "Bế ngồi trên đùi để ợ hơi", "steps": ["Đặt bé ngồi trên đùi bạn, hơi nghiêng về phía trước.", "Một bàn tay đỡ ngực bé, các ngón tay đỡ nhẹ dưới cằm (không đè vào cổ họng).", "Tay kia xoa hoặc vỗ nhẹ lưng."], "safety": ["Đỡ cằm bằng đầu ngón tay, không bóp cổ.", "Luôn đỡ đầu và cổ bé: khoảng 4 tháng tuổi bé mới tự giữ vững đầu khi được bế."], "searchQuery": "cách cho trẻ sơ sinh ợ hơi tư thế ngồi", "source": "https://www.nhs.uk/conditions/reflux-in-babies/", "reviewedAt": "2026-11-14"},
      {"code": "carrier_front_in", "name": "Địu trước, mặt bé hướng vào người", "steps": ["Chọn địu phù hợp cân nặng của bé, đọc kỹ hướng dẫn của nhà sản xuất.", "Đặt bé áp ngực bạn, mặt hướng vào người, chân dạng hai bên.", "Kéo chặt địu theo các quy tắc an toàn bên dưới."], "safety": ["Địu chặt vừa đủ để ôm sát bé vào người, không để vải chùng làm bé tụt xuống.", "Luôn nhìn thấy mặt bé khi cúi xuống; vải địu không che đầu, mặt bé.", "Đầu bé đủ gần để bạn cúi xuống hôn được lên đầu.", "Cằm bé không gập vào ngực: luôn còn ít nhất một ngón tay dưới cằm.", "Lưng bé được đỡ thẳng tự nhiên, bụng và ngực bé áp vào người bạn.", "Không cho bé bú khi đang ở trong địu.", "Đặt chân bé ở tư thế chữ M: hai đầu gối cao hơn mông, đùi được đỡ tới khoeo."], "searchQuery": "cách địu trẻ sơ sinh an toàn tư thế chữ M", "source": "https://www.nhs.uk/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/", "reviewedAt": "2026-11-14"}
    ]},
    {"code": "3_6", "name": "3–6 tháng", "positions": [
      {"code": "arm_sit", "name": "Bế ngồi trên cẳng tay, hướng vào người", "steps": ["Cho bé ngồi trên cẳng tay bạn, mặt và ngực bé hướng vào người bạn.", "Tay kia đỡ ngang lưng bé."], "safety": ["Đến khoảng 4 tháng bé mới giữ vững đầu; trước đó vẫn đỡ sau gáy.", "Đổi tay thường xuyên để bạn không mỏi."], "searchQuery": "cách bế em bé 3 tháng tuổi", "source": "https://www.cdc.gov/act-early/milestones/4-months.html", "reviewedAt": "2026-11-14"},
      {"code": "facing_out", "name": "Bế hướng mặt ra ngoài", "steps": ["Chỉ bế kiểu này khi bé đã giữ vững đầu (khoảng 4 tháng).", "Lưng bé áp vào ngực bạn; một tay đỡ dưới mông, tay kia vòng qua ngực bé.", "Bế trong thời gian ngắn để bé ngắm xung quanh."], "safety": ["Quay bé vào người khi bé mệt, quấy hoặc buồn ngủ.", "Không để bé ngửa người ra sau."], "searchQuery": "cách bế em bé hướng mặt ra ngoài", "source": "https://www.cdc.gov/act-early/milestones/4-months.html", "reviewedAt": "2026-11-14"},
      {"code": "carrier_front_in_3_6", "name": "Địu trước, mặt bé hướng vào người", "steps": ["Như giai đoạn 0–3 tháng; điều chỉnh địu theo cân nặng mới của bé.", "Kiểm tra lại các quy tắc an toàn mỗi lần địu."], "safety": ["Địu chặt vừa đủ để ôm sát bé vào người, không để vải chùng làm bé tụt xuống.", "Luôn nhìn thấy mặt bé khi cúi xuống; vải địu không che đầu, mặt bé.", "Đầu bé đủ gần để bạn cúi xuống hôn được lên đầu.", "Cằm bé không gập vào ngực: luôn còn ít nhất một ngón tay dưới cằm.", "Lưng bé được đỡ thẳng tự nhiên, bụng và ngực bé áp vào người bạn.", "Không cho bé bú khi đang ở trong địu.", "Giữ chân bé ở tư thế chữ M: đầu gối cao hơn mông."], "searchQuery": "cách địu em bé 4 tháng an toàn", "source": "https://www.nhs.uk/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/", "reviewedAt": "2026-11-14"}
    ]},
    {"code": "6_plus", "name": "Trên 6 tháng", "positions": [
      {"code": "hip", "name": "Bế hông", "steps": ["Cho bé ngồi lên một bên hông bạn, hai chân dạng ôm quanh eo bạn.", "Một tay vòng qua lưng và đỡ mông bé.", "Đầu gối bé hơi cao hơn mông."], "safety": ["Đổi bên thường xuyên để tránh đau lưng, mỏi hông.", "Không bế hông khi đang làm việc cần hai tay."], "searchQuery": "cách bế em bé ngồi hông đúng cách", "source": "https://babyslingsafety.co.uk/ticks.pdf", "reviewedAt": "2026-11-14"},
      {"code": "carrier_6_plus", "name": "Địu trước (hướng vào trong hoặc ra ngoài)", "steps": ["Chỉ địu hướng ra ngoài với loại địu cho phép, khi bé giữ vững đầu và thân.", "Thời gian địu hướng ra ngoài nên ngắn; quay bé vào khi bé buồn ngủ."], "safety": ["Địu chặt vừa đủ để ôm sát bé vào người, không để vải chùng làm bé tụt xuống.", "Cằm bé không gập vào ngực: luôn còn ít nhất một ngón tay dưới cằm.", "Khi bé hướng vào trong: luôn nhìn thấy mặt bé khi cúi xuống, đầu bé đủ gần để hôn, lưng được đỡ thẳng, bụng và ngực áp vào người bạn; chân bé ở tư thế chữ M (đầu gối cao hơn mông).", "Khi bé hướng ra ngoài: chỉ dùng địu cho phép kiểu này, địu trong thời gian ngắn và quay bé vào trong khi bé mệt hoặc buồn ngủ.", "Không cho bé bú khi đang ở trong địu."], "searchQuery": "cách địu em bé trên 6 tháng an toàn", "source": "https://www.nhs.uk/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/", "reviewedAt": "2026-11-14"}
    ]}
  ]
}
```

- [ ] **Step 4: Viết schema, phần nạp và quy tắc**

Tạo `lib/content/music.ts`:

```ts
import { z } from "zod";
import data from "@/content/music.vi.json";

export const MusicCategorySchema = z.enum(["relax", "brain"]);
export type MusicCategory = z.infer<typeof MusicCategorySchema>;

// Spec §6.11: { presetCode, category, title, searchQuery }.
export const MusicPresetSchema = z
  .object({
    presetCode: z.string().regex(/^[a-z0-9_]{1,40}$/),
    category: MusicCategorySchema,
    title: z.string().min(1),
    searchQuery: z.string().min(1),
  })
  .strict();

export type MusicPreset = z.infer<typeof MusicPresetSchema>;

export const MUSIC_PRESETS: MusicPreset[] = z
  .object({ presets: z.array(MusicPresetSchema).min(1) })
  .strict()
  .parse(data).presets;
```

Tạo `lib/content/holding.ts`:

```ts
import { z } from "zod";
import data from "@/content/holding.vi.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const lines = z.array(z.string().min(1)).min(1);

export const HoldingPositionSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    name: z.string().min(1),
    steps: lines,
    safety: lines,
    searchQuery: z.string().min(1),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const HoldingContentSchema = z
  .object({
    title: z.string().min(1),
    intro: z.string().min(1),
    reviewedAt: isoDate,
    stages: z
      .array(
        z
          .object({
            code: z.string().regex(/^[a-z0-9_]+$/),
            name: z.string().min(1),
            positions: z.array(HoldingPositionSchema).min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type HoldingPosition = z.infer<typeof HoldingPositionSchema>;

export const HOLDING = HoldingContentSchema.parse(data);
```

Tạo `lib/rules/music.ts`:

```ts
import type { MusicCategory, MusicPreset } from "@/lib/content/music";
import type { YouTubeTarget } from "./youtube";

export type MusicLinkLike = {
  id: string;
  category: string;
  title: string | null;
  youtube_video_id: string | null;
  youtube_playlist_id: string | null;
  preset_code: string | null;
  hidden: boolean;
  created_by: string;
};

export type MusicItem =
  | {
      kind: "preset";
      key: string;
      title: string;
      target: { kind: "search"; query: string };
      hidden: boolean;
      preset: MusicPreset;
    }
  | {
      kind: "link";
      key: string;
      title: string;
      target: YouTubeTarget;
      hidden: boolean;
      link: MusicLinkLike;
    };

export const BRAIN_NOTE =
  "Chỉ cho bé nghe, không cho bé xem màn hình. WHO khuyến nghị trẻ dưới 2 tuổi không xem màn hình.";

// Presets first (in content order), then the family's links oldest first.
// A preset row in music_links only carries the hidden flag (spec §6.11).
export function musicItems(input: {
  presets: MusicPreset[];
  links: MusicLinkLike[];
  category: MusicCategory;
}): MusicItem[] {
  const { presets, links, category } = input;
  const hiddenPresets = new Set(
    links.filter((l) => l.preset_code && l.hidden).map((l) => l.preset_code),
  );
  const presetItems: MusicItem[] = presets
    .filter((p) => p.category === category)
    .map((preset) => ({
      kind: "preset",
      key: `preset:${preset.presetCode}`,
      title: preset.title,
      target: { kind: "search", query: preset.searchQuery },
      hidden: hiddenPresets.has(preset.presetCode),
      preset,
    }));
  const linkItems = links
    .filter((l) => l.category === category && !l.preset_code)
    .flatMap((link): MusicItem[] => {
      const target: YouTubeTarget | null = link.youtube_video_id
        ? { kind: "video", id: link.youtube_video_id }
        : link.youtube_playlist_id
          ? { kind: "playlist", id: link.youtube_playlist_id }
          : null;
      if (!target) return [];
      return [
        {
          kind: "link",
          key: `link:${link.id}`,
          title: link.title?.trim() || "Link YouTube",
          target,
          hidden: link.hidden,
          link,
        },
      ];
    });
  return [...presetItems, ...linkItems];
}

export function parseLinkTitle(raw: string): string | null | "too_long" {
  const title = raw.trim();
  if (title === "") return null;
  return title.length > 80 ? "too_long" : title;
}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/content/guides.test.ts lib/rules/music.test.ts && bun run typecheck && bun run test`
Expected: PASS — `Tests  7 passed (7)` (4 + 3); không lỗi type; cả bộ `Tests  286 passed (286)` (274 + 5 + 7).

- [ ] **Step 6: Commit**

```bash
git add content/music.vi.json content/holding.vi.json lib/content/music.ts lib/content/holding.ts lib/content/guides.test.ts lib/rules/music.ts lib/rules/music.test.ts && git commit -m "feat(guide): music presets, holding guide content and music list rules"
```

---

### Task 4: Trang `/nhac` và `/bong-be`

**Files:**

- Create: `lib/data/music.ts`, `components/music/MusicScreen.tsx`, `app/nhac/page.tsx`, `components/holding/HoldingScreen.tsx`, `app/bong-be/page.tsx`
- Modify: `lib/nav.ts`, `sw/sw.template.js`
- Test: `lib/nav.test.ts`, `lib/themeGuard.test.ts`, `scripts/sw.test.ts` (đã có)

**Interfaces:**

- Consumes: Task 1–3; `OnlineOnly`, `useOnline`, `AuthGate`, `ageDays`
- Produces: `useMusicLinks`, `useMusicActions`; `MusicScreen({ familyId, userId, isOwner })`, `HoldingScreen({ ageDays })`; trang `/nhac`, `/bong-be`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -59,6 +59,13 @@
     );
   });
 
+  it("opens the holding guide and music", () => {
+    expect(GUIDE_ITEMS.find((i) => i.label === "Bồng bế")?.href).toBe(
+      "/bong-be",
+    );
+    expect(TOOL_ITEMS.find((i) => i.label === "Nhạc")?.href).toBe("/nhac");
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `AssertionError: expected null to be '/bong-be'`; `Tests  1 failed | 9 passed (10)`

- [ ] **Step 3: Sửa menu và service worker**

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -19,7 +19,7 @@
   { label: "Tiêm chủng", href: "/tiem-chung" },
   { label: "Triệu chứng", href: "/trieu-chung" },
   { label: "Phát triển", href: null },
-  { label: "Bồng bế", href: null },
+  { label: "Bồng bế", href: "/bong-be" },
   { label: "Bệnh thường gặp", href: "/benh-thuong-gap" },
 ];
 
@@ -27,7 +27,7 @@
   { label: "Thống kê", href: "/thong-ke" },
   { label: "Tăng trưởng", href: "/tang-truong" },
   { label: "Khẩn cấp", href: "/khan-cap" },
-  { label: "Nhạc", href: null },
+  { label: "Nhạc", href: "/nhac" },
   { label: "Ồn trắng", href: "/on-trang" },
   { label: "Ảnh", href: null },
   { label: "Báo cáo", href: null },
```

```diff
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -15,6 +15,7 @@
   "/thong-ke",
   "/tang-truong",
   "/on-trang",
+  "/nhac",
   "/cam-nang",
   "/tien-ich",
   "/cai-dat",
```

- [ ] **Step 4: Tạo `lib/data/music.ts`**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MusicCategory } from "@/lib/content/music";
import type { YouTubeTarget } from "@/lib/rules/youtube";
import { supabase } from "@/lib/supabase/client";
import type { MusicLinkRow } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";

const musicKey = (familyId: string) => ["music-links", familyId] as const;

export function useMusicLinks(familyId: string) {
  return useQuery({
    queryKey: musicKey(familyId),
    queryFn: async (): Promise<MusicLinkRow[]> => {
      const { data, error } = await supabase()
        .from("music_links")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

async function expectRows(
  query: PromiseLike<{ data: { id: string }[] | null; error: unknown }>,
) {
  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) throw new PermissionDeniedError();
}

// Spec §9: music_links are written online only (OnlineOnly in the UI).
export function useMusicActions(familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () =>
    queryClient.invalidateQueries({ queryKey: musicKey(familyId) });
  return {
    add: useMutation({
      mutationFn: async (input: {
        category: MusicCategory;
        title: string | null;
        target: YouTubeTarget;
      }) => {
        const { error } = await supabase()
          .from("music_links")
          .insert({
            family_id: familyId,
            category: input.category,
            title: input.title,
            youtube_video_id:
              input.target.kind === "video" ? input.target.id : null,
            youtube_playlist_id:
              input.target.kind === "playlist" ? input.target.id : null,
          });
        if (error) throw error;
      },
      onSettled,
    }),
    // Hiding a preset stores a row with its preset_code (spec §6.11).
    setPresetHidden: useMutation({
      mutationFn: (input: {
        presetCode: string;
        category: MusicCategory;
        hidden: boolean;
      }) =>
        expectRows(
          supabase()
            .from("music_links")
            .upsert(
              {
                family_id: familyId,
                category: input.category,
                preset_code: input.presetCode,
                hidden: input.hidden,
              },
              { onConflict: "family_id,preset_code" },
            )
            .select("id"),
        ),
      onSettled,
    }),
    setLinkHidden: useMutation({
      mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
        expectRows(
          supabase()
            .from("music_links")
            .update({ hidden })
            .eq("id", id)
            .select("id"),
        ),
      onSettled,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        expectRows(
          supabase().from("music_links").delete().eq("id", id).select("id"),
        ),
      onSettled,
    }),
  };
}
```

- [ ] **Step 5: Tạo `components/music/MusicScreen.tsx` và `app/nhac/page.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { MUSIC_PRESETS, type MusicCategory } from "@/lib/content/music";
import { toVietnameseError } from "@/lib/data/errors";
import { useMusicActions, useMusicLinks } from "@/lib/data/music";
import { useOnline } from "@/lib/hooks/useOnline";
import {
  BRAIN_NOTE,
  musicItems,
  parseLinkTitle,
  type MusicItem,
} from "@/lib/rules/music";
import {
  browserOpenDeps,
  openYouTube,
  parseYouTubeUrl,
  webUrl,
  youtubePath,
} from "@/lib/rules/youtube";

const TABS: { value: MusicCategory; label: string }[] = [
  { value: "relax", label: "Thư giãn / ru ngủ" },
  { value: "brain", label: "Phát triển trí não" },
];

export function MusicScreen({
  familyId,
  userId,
  isOwner,
}: {
  familyId: string;
  userId: string;
  isOwner: boolean;
}) {
  const links = useMusicLinks(familyId);
  const actions = useMusicActions(familyId);
  // Hiding and deleting need the network (spec §9); the add form says so once.
  const online = useOnline();
  const [tab, setTab] = useState<MusicCategory>("relax");
  const [showHidden, setShowHidden] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const items = musicItems({
    presets: MUSIC_PRESETS,
    links: links.data ?? [],
    category: tab,
  });
  const hiddenCount = items.filter((item) => item.hidden).length;
  const showing = showHidden && hiddenCount > 0;
  const visible = items.filter((item) => showing || !item.hidden);
  const onError = (e: unknown) => setMessage(toVietnameseError(e));

  function toggleHidden(item: MusicItem) {
    setMessage(null);
    if (item.kind === "preset")
      actions.setPresetHidden.mutate(
        {
          presetCode: item.preset.presetCode,
          category: item.preset.category,
          hidden: !item.hidden,
        },
        { onError },
      );
    else
      actions.setLinkHidden.mutate(
        { id: item.link.id, hidden: !item.hidden },
        { onError },
      );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Nhạc cho bé</h1>
      <div role="tablist" className="grid grid-cols-2 gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`min-h-11 rounded-xl border px-2 ${tab === t.value ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "brain" && (
        <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
          {BRAIN_NOTE}
        </p>
      )}
      {!online && (
        <p role="status" className="text-sm text-muted">
          Cần kết nối mạng để ẩn, hiện lại hoặc xóa.
        </p>
      )}
      <ul className="divide-y rounded-2xl border">
        {visible.map((item) => {
          const path = youtubePath(item.target);
          const canDelete =
            item.kind === "link" &&
            (isOwner || item.link.created_by === userId);
          return (
            <li key={item.key} className="flex flex-col gap-1 px-4 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openYouTube(path, browserOpenDeps())}
                  className={`flex min-h-12 flex-1 items-center text-left font-medium ${item.hidden ? "text-muted" : ""}`}
                >
                  ▶ {item.title}
                </button>
                <a
                  href={webUrl(path)}
                  target="_blank"
                  rel="noopener"
                  className="flex min-h-11 items-center px-2 text-sm text-accent-ink underline"
                >
                  Mở trên web
                </a>
              </div>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  disabled={!online}
                  onClick={() => toggleHidden(item)}
                  className="min-h-11 rounded-xl border px-3 disabled:opacity-50"
                >
                  {item.hidden ? "Hiện lại" : "Ẩn"}
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Xóa "${item.title}"?`)) {
                        setMessage(null);
                        actions.remove.mutate(item.link.id, { onError });
                      }
                    }}
                    disabled={!online}
                    className="min-h-11 rounded-xl border px-3 text-danger disabled:opacity-50"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowHidden(!showing)}
          className="min-h-11 rounded-xl border px-4"
        >
          {showing ? "Ẩn các mục đã ẩn" : `Hiện các mục đã ẩn (${hiddenCount})`}
        </button>
      )}
      {message && (
        <p role="alert" className="text-danger">
          {message}
        </p>
      )}
      <AddLinkForm category={tab} familyId={familyId} />
      {links.isError && !links.data && (
        <p role="alert" className="text-danger">
          {toVietnameseError(links.error)}
        </p>
      )}
    </main>
  );
}

function AddLinkForm({
  category,
  familyId,
}: {
  category: MusicCategory;
  familyId: string;
}) {
  const actions = useMusicActions(familyId);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const target = url.trim() === "" ? null : parseYouTubeUrl(url);
  // Spec §6.11: an invalid link is reported right at the input.
  const urlError =
    url.trim() !== "" && !target ? "Link YouTube không hợp lệ." : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsedTitle = parseLinkTitle(title);
    if (!target) {
      setError("Dán link YouTube của bài hát hoặc danh sách phát.");
      return;
    }
    if (parsedTitle === "too_long") {
      setError("Tên tối đa 80 ký tự.");
      return;
    }
    setError(null);
    actions.add.mutate(
      { category, title: parsedTitle, target },
      {
        onSuccess: () => {
          setUrl("");
          setTitle("");
        },
        onError: (e) => setError(toVietnameseError(e)),
      },
    );
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <OnlineOnly>
      {/* noValidate: links without https:// are accepted (spec §6.11). */}
      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Thêm link YouTube</h2>
        <label className="flex flex-col gap-1">
          Link
          <input
            type="url"
            inputMode="url"
            className={input}
            placeholder="https://youtu.be/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {urlError && <span className="text-sm text-danger">{urlError}</span>}
        </label>
        <label className="flex flex-col gap-1">
          Tên (không bắt buộc)
          <input
            className={input}
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={actions.add.isPending}
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          Thêm vào {category === "relax" ? "Thư giãn" : "Phát triển trí não"}
        </button>
      </form>
    </OnlineOnly>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { MusicScreen } from "@/components/music/MusicScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx && session ? (
          <MusicScreen
            familyId={ctx.family.id}
            userId={session.user.id}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
```

- [ ] **Step 6: Tạo `components/holding/HoldingScreen.tsx` và `app/bong-be/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { HOLDING } from "@/lib/content/holding";
import { browserOpenDeps, openYouTube, youtubePath } from "@/lib/rules/youtube";

// Spec §6.10: stage picked by the baby's age, positions as text, no pictures.
export function HoldingScreen({ ageDays }: { ageDays: number }) {
  const initial = ageDays < 91 ? "0_3" : ageDays < 183 ? "3_6" : "6_plus";
  const [stage, setStage] = useState(initial);
  const current = HOLDING.stages.find((s) => s.code === stage)!;
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{HOLDING.title}</h1>
      <p>{HOLDING.intro}</p>
      <div role="tablist" className="grid grid-cols-3 gap-2">
        {HOLDING.stages.map((s) => (
          <button
            key={s.code}
            type="button"
            role="tab"
            aria-selected={stage === s.code}
            onClick={() => setStage(s.code)}
            className={`min-h-11 rounded-xl border px-1 text-sm ${stage === s.code ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      {current.positions.map((position) => (
        <section
          key={position.code}
          className="flex flex-col gap-2 rounded-2xl border p-4"
        >
          <h2 className="text-lg font-medium">{position.name}</h2>
          <ol className="list-decimal pl-5">
            {position.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
            <p className="font-medium">Lưu ý an toàn</p>
            <ul className="list-disc pl-5">
              {position.safety.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() =>
              openYouTube(
                youtubePath({ kind: "search", query: position.searchQuery }),
                browserOpenDeps(),
              )
            }
            className="min-h-11 rounded-xl border px-3"
          >
            Xem video
          </button>
          <a
            href={position.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm text-muted underline"
          >
            Nguồn
          </a>
        </section>
      ))}
    </main>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { HoldingScreen } from "@/components/holding/HoldingScreen";
import { ageDays } from "@/lib/rules/time";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <HoldingScreen ageDays={ageDays(ctx.baby.dob, new Date())} />
        ) : null
      }
    </AuthGate>
  );
}
```

- [ ] **Step 7: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  287 passed (287)`; build thành công, có `○ /bong-be` và `○ /nhac`.

- [ ] **Step 8: Commit**

```bash
git add lib/data/music.ts components/music components/holding app/nhac app/bong-be lib/nav.ts lib/nav.test.ts sw/sw.template.js && git commit -m "feat(guide): /nhac with YouTube links and /bong-be holding guide"
```

---

### Task 5: Checklist bước 5, 16 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 4
- Produces: checklist bước 5 (trước bước 6) và bước 16 (cuối file)

- [ ] **Step 1: Thêm bước 5 và 16**

```diff
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -78,6 +78,21 @@
 | iPhone 11     | 16.3 | Bỏ qua  | Máy đang iOS 16.3, cần 16.4 trở lên       |
 | iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14)                          |
 | iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14)                          |
+
+## Bước 5 — Nhạc mở app YouTube (M23)
+
+1. Tiện ích → Nhạc → tab "Thư giãn / ru ngủ" → bấm "▶ Hát ru Việt Nam". Kỳ vọng: app YouTube mở trang kết quả tìm kiếm "hát ru con ngủ dân ca Việt Nam".
+2. Quay lại Bé Yêu → tab "Phát triển trí não". Kỳ vọng: dòng "Chỉ cho bé nghe, không cho bé xem màn hình. WHO khuyến nghị trẻ dưới 2 tuổi không xem màn hình."
+3. Dán một link YouTube (ví dụ copy từ nút Chia sẻ của app YouTube) → "Thêm vào …". Bấm mục vừa thêm. Kỳ vọng: app YouTube mở đúng video. Dán chữ "abc". Kỳ vọng: "Link YouTube không hợp lệ." ngay dưới ô.
+4. Bấm "Ẩn" ở một mục có sẵn. Kỳ vọng: mục biến mất, có nút "Hiện các mục đã ẩn (1)"; máy thứ hai cũng không thấy mục đó.
+5. Gỡ app YouTube (hoặc dùng máy không cài) → bấm một mục. Kỳ vọng: sau khoảng 1,5 giây trang web YouTube mở trong Bé Yêu; link "Mở trên web" cũng mở được.
+6. Dọn dẹp: "Hiện lại" mục đã ẩn; xóa link thử.
+
+| Máy           | iOS | Kết quả | Ghi chú (có / không cài app YouTube) |
+| ------------- | --- | ------- | ------------------------------------ |
+| iPhone 11     |     |         |                                      |
+| iPhone 16     |     |         |                                      |
+| iPhone 17 Pro |     |         |                                      |
 
 ## Bước 6 — Tiếng ồn trắng khi khóa màn hình (M22)
 
@@ -224,3 +239,15 @@
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 16 — Bồng bế (M23)
+
+1. Cẩm nang → Bồng bế. Kỳ vọng: tab đúng nhóm tuổi của bé đang được chọn (0–3 tháng, 3–6 tháng hoặc Trên 6 tháng); mỗi tư thế có các bước, khung "Lưu ý an toàn", nút "Xem video", link "Nguồn".
+2. Bấm "Xem video" ở một tư thế. Kỳ vọng: app YouTube mở trang tìm kiếm tư thế đó.
+3. Bật chế độ máy bay, đóng hẳn app rồi mở lại → Cẩm nang → Bồng bế. Kỳ vọng: vẫn đọc được.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

Run: `grep '^## ' docs/device-checklist.md`
Expected: `## Bước 5 — Nhạc mở app YouTube (M23)` nằm ngay trước `## Bước 6 — Tiếng ồn trắng khi khóa màn hình (M22)`; tiêu đề cuối là `## Bước 16 — Bồng bế (M23)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist steps 5 and 16" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/nhac`
Expected: `200`.

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bảng kết quả bước 5, 16 để trống. Trong báo cáo cuối ghi: "Checklist bước 5 và 16 chờ người dùng."

---

## Ngoài phạm vi M23

- M24: ảnh (`photos`, bucket Storage). M25: mốc phát triển (`milestones_achieved`, gắn ảnh). M26: báo cáo cho bác sĩ, chốt đợt 3.
