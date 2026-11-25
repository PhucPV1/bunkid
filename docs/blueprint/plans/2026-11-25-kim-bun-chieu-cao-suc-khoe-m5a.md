# Kim Bun — Sức khỏe M5a: dữ liệu và hai công tắc của thông báo tăng trưởng Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§8.1: migration, pgTAP 015, `PrefKey`, `PREF_OPTIONS`; phần "hai công tắc mới" của §9.1)

**Status:** approved 2026-11-25 (người dùng duyệt trước mọi plan còn lại của spec này: "duyệt hết, làm cho tới lúc xong và đẩy lên main, giữa chừng có bug gì thì fix luôn, mở trình duyệt thì dùng browser trong app nếu khi implement có hỏi")

**Goal:** Mỗi người có hai công tắc mới trong Cài đặt, "Cảnh báo tăng trưởng" và "Nhắc đo định kỳ", bật sẵn và lưu được; DB nhận hai loại thông báo mới.

**Architecture:**

- **DB:** migration `20261125000200_growth_push.sql` thêm hai cột `boolean not null default true` vào `notification_prefs` và nới ràng buộc `kind` của `notification_log`. Chỉ thêm, không xóa hay đổi cột nào, không đổi policy.
- **Luật và dữ liệu:** `PrefKey` và `PREF_OPTIONS` (`lib/rules/notifications.ts`) thêm hai khóa; `DEFAULT_PREFS` và câu `select` của `fetchPrefs` (`lib/data/notificationPrefs.ts`) thêm hai cột. Trang Cài đặt vẽ công tắc từ `PREF_OPTIONS` nên tự có thêm hai hàng; chỉ cần thêm icon.
- Plan này chưa gửi thông báo nào: luật chọn người nhận và nội dung là của M5b.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun; Supabase CLI 2.122.0 và pgTAP trên Supabase local (Docker qua OrbStack). Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m5a`, cắt từ `main` @ `68021b9` (đã có M4a và M4c). Baseline: 1593 test vitest xanh (180 file), typecheck sạch; pgTAP `Files=14, Tests=156`.

**Các mốc của spec này:**

| Mốc                  | Nội dung                                               | Plan                                                           |
| -------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| M1, M2, M3, M4a, M4c | §3, §4 dòng 1 đến 3 và 5, 6, §5, §6, §7.1, §7.2        | đã xong, ở `main` @ `68021b9`                                  |
| **M5a (plan này)**   | §8.1: migration 015, hai công tắc                      | file này                                                       |
| M5b                  | §8.2, §8.3: luật của hai loại push, dữ liệu cho bộ gửi | viết ngay sau plan này                                         |
| M5c                  | hàng nhắc đo trên trang Chiều cao, dòng 4 của §4, §9.3 | chưa viết                                                      |
| M4b                  | §7.3: dinh dưỡng theo giai đoạn                        | chờ người dùng quyết các dòng mà nguồn không nói đúng như spec |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M5 chia ba plan.** Spec §10 ghi M5 là một mốc. Dữ liệu và công tắc (plan này), luật gửi (M5b), giao diện nhắc đo (M5c) tách được và mỗi phần tự chạy được.
2. **Icon của hai hàng mới** spec không ghi: "Cảnh báo tăng trưởng" dùng `alert`, "Nhắc đo định kỳ" dùng `ruler`, cùng màu `cat-diaper` như các hàng thông báo khác. Không thêm icon mới.
3. **Chưa có thông báo nào được gửi sau plan này.** Hai công tắc đã lưu được nhưng phải tới M5b mới có tác dụng. Hai plan chạy liền nhau nên khoảng trống này ngắn.
4. **Câu gợi ý của "Tạm tắt nhắc"** (`SNOOZE_HINT`) giữ nguyên: spec không đổi nó và người dùng muốn màn hình ít chữ. Ghi vào báo cáo cuối để người dùng biết: cảnh báo tăng trưởng cũng bị tạm tắt theo (§8.2), nhắc đo thì không (§8.3), còn câu gợi ý chỉ kể bốn loại cũ.
5. **`Recipient.prefs` và `NotificationKind`** (§8.1, §8.2) thêm trường ở M5b, cùng lúc với luật đọc chúng.
6. **Migration lên DB thật trước, code lên `main` sau.** `fetchPrefs` sau plan này đọc hai cột mới; nếu `main` có code trước khi DB thật có cột thì trang Cài đặt báo lỗi tải. Vì vậy Task 3 áp migration lên project thật trước khi kiểm trình duyệt và trước khi push. Migration chỉ thêm cột có default nên bản đang chạy không bị ảnh hưởng. Người dùng đã cho phép trước việc này trong lệnh "duyệt hết… đẩy lên main"; lần trước (M3a) họ cũng đồng ý đúng cách làm này. **Không áp được migration thì không đẩy code lên `main`.**
7. **Kiểm trình duyệt** chỉ xem, không gạt công tắc. Dùng khung Browser trong app ở 375×812, không hỏi lại.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`; mã hex trong bản vẽ không được chép vào component.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (hotfix 7822c90): lớp trong chỉ còn màu nền và viền.
- Mọi ngày giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString`, `ageDays`, `ageOnDay` có sẵn.
- Số đo (`growth`) vẫn ghi qua outbox như hiện tại. Hồ sơ bé (`babies`) vẫn ghi bằng `updateBaby` (`lib/data/baby.ts`), chỉ chủ gia đình ghi được (policy `babies_update` hiện có); spec này không đổi policy nào.
- Chữ về sức khỏe: chỉ dùng đúng các câu ghi trong spec này. App không chẩn đoán, không nêu tên bệnh, không nêu liều thuốc, không gợi ý thực phẩm chức năng, không dùng câu nào cam kết đạt chiều cao mục tiêu.
- Mọi con số y khoa mới phải lấy từ nguồn ghi ở §6.2, §7.1, §7.3 và ghi `source`, `reviewedAt` trong file nội dung; không lấy số từ trí nhớ.
- Bảng WHO trong app chỉ có ngày tuổi 0–1856. Ngoài khoảng đó không đánh giá, không cảnh báo, không vẽ đường mục tiêu.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề và nội dung thẻ cảnh báo, dòng chênh dưới thanh vị trí, các đoạn chú thích `text-muted`, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), các dòng dinh dưỡng.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay dừng đồng hồ, không bật tắt công tắc. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Tải file từ `cdn.who.int` (§6.2) cần người dùng đồng ý trước khi chạy.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 1153 test vitest, pgTAP 001–013, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m5a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `68021b9`. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh là số đo thật trên cả bộ test. pgTAP đã chạy trên Supabase local trong Docker: đỏ rồi xanh đúng như Task 1 ghi; `bun run db:types` sau migration ra đúng nội dung của Patch 2. Chưa chạy trong lúc viết plan: `bun run build`, `bunx supabase db push` và bước kiểm trình duyệt.
- **pgTAP cần Docker.** `bun run db:start`, `db:reset`, `db:test`, `db:types` chỉ chạm Supabase **local** trong Docker (OrbStack); `db:reset` chỉ dựng lại DB local. Nếu Docker không chạy được: để ô của bước đó chưa tick, ghi "pgTAP 015 chưa chạy: Docker không chạy" vào báo cáo cuối, và **không** áp migration lên DB thật khi pgTAP chưa xanh.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không gạt công tắc nào, không bắt đầu hay dừng đồng hồ, không thêm bản ghi. Thứ duy nhất plan này ghi lên DB thật là migration ở Task 3.
- **Không gõ mật khẩu hay secret.** Nếu Supabase CLI đòi mật khẩu DB, đòi đăng nhập, hoặc báo project chưa link: dừng, không nhập gì, ghi lại là việc người dùng tự làm, và không đẩy code lên `main`.
- **Lên `main` không cần hỏi**, với điều kiện ở mục 6 của Diễn giải spec. Bước trình duyệt lộ ra lỗi thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan; **không đẩy một thay đổi còn lỗi đã biết**. Chỗ nào cần người dùng quyết thì dừng lại và báo.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng sau M4c (đã ở `main` @ `68021b9`). M5b đọc hai cột mới trong bộ gửi; M5c vẽ công tắc `growth_measure` trên trang Chiều cao.

**Consumes (đã ở `main`):** `PrefKey`, `PREF_OPTIONS` (`lib/rules/notifications.ts`); `NotificationPrefs`, `DEFAULT_PREFS`, `fetchPrefs`, `savePrefs` (`lib/data/notificationPrefs.ts`); `NotificationsGroupView` (`components/settings/NotificationsGroup.tsx`); bảng `notification_prefs`, `notification_log` (migration `20261114000200_push.sql`, `20261117000200_reminders.sql`).

**Produces:**

- Migration `supabase/migrations/20261125000200_growth_push.sql`: cột `notification_prefs.growth_alert` và `notification_prefs.growth_measure` (`boolean not null default true`); `notification_log.kind` nhận thêm `'growth_alert'`, `'growth_measure'`. Đã ở DB thật sau Task 3.
- `lib/supabase/types.ts`: hai cột mới trong `notification_prefs`.
- `PrefKey` thêm `"growth_alert" | "growth_measure"`; `PREF_OPTIONS` thêm hai dòng cuối `{ key: "growth_alert", label: "Cảnh báo tăng trưởng", note: null }` và `{ key: "growth_measure", label: "Nhắc đo định kỳ", note: null }`.
- `NotificationPrefs` (là `Record<PrefKey, boolean> & …`) có hai trường mới; `DEFAULT_PREFS` cho cả hai là `true`; `fetchPrefs` đọc hai cột.
- **Vitest sau M5a:** 1593 test, 180 file (không thêm test, chỉ sửa test cũ). **pgTAP sau M5a:** `Files=15, Tests=163`.

---

### Task 1: Migration 015 và pgTAP (§8.1)

**Files:**

- Create: `supabase/migrations/20261125000200_growth_push.sql`
- Modify: `lib/supabase/types.ts`
- Test: `supabase/tests/015_growth_push.test.sql` (mới)

**Interfaces:**

- Consumes: bảng `notification_prefs`, `notification_log`.
- Produces: hai cột và hai `kind` mới; kiểu của chúng trong `lib/supabase/types.ts`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m5a
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/supabase/tests/015_growth_push.test.sql b/supabase/tests/015_growth_push.test.sql
new file mode 100644
index 0000000..8ca557a
--- /dev/null
+++ b/supabase/tests/015_growth_push.test.sql
@@ -0,0 +1,37 @@
+begin;
+create extension if not exists pgtap with schema extensions;
+select plan(7);
+
+insert into auth.users (id, email) values
+  ('aaaaaaaa-0000-0000-0000-000000000015', 'ga@example.com');
+
+-- Spec 2026-11-25 §8.1: two more switches, both on by default.
+select col_not_null('public', 'notification_prefs', 'growth_alert', 'growth_alert is never null');
+select col_not_null('public', 'notification_prefs', 'growth_measure', 'growth_measure is never null');
+insert into public.notification_prefs (user_id) values ('aaaaaaaa-0000-0000-0000-000000000015');
+select is(
+  (select row(growth_alert, growth_measure)::text
+     from public.notification_prefs where user_id = 'aaaaaaaa-0000-0000-0000-000000000015'),
+  '(t,t)',
+  'new prefs default to: growth alert on, measure reminder on');
+
+-- notification_log accepts the two new kinds and keeps the older ones.
+select lives_ok(
+  $$ insert into public.notification_log (user_id, kind, ref_key)
+     values ('aaaaaaaa-0000-0000-0000-000000000015', 'growth_alert', 'growth:x') $$,
+  'kind growth_alert is accepted');
+select lives_ok(
+  $$ insert into public.notification_log (user_id, kind, ref_key)
+     values ('aaaaaaaa-0000-0000-0000-000000000015', 'growth_measure', 'measure:x:2026-11-25') $$,
+  'kind growth_measure is accepted');
+select lives_ok(
+  $$ insert into public.notification_log (user_id, kind, ref_key)
+     values ('aaaaaaaa-0000-0000-0000-000000000015', 'timer', 'timer:x') $$,
+  'an older kind is still accepted');
+select throws_ok(
+  $$ insert into public.notification_log (user_id, kind, ref_key)
+     values ('aaaaaaaa-0000-0000-0000-000000000015', 'growth', 'growth:x') $$,
+  '23514', null, 'an unknown kind is still refused');
+
+select * from finish();
+rollback;
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `open -a OrbStack; for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 2; done; bun run db:start && bun run db:reset && bun run db:test`
Expected: FAIL. `001`…`014` `ok`; `015_growth_push.test.sql` hỏng với `Failed 7/7 subtests` và `Bad plan.  You planned 7 tests but ran 2.` (chưa có hai cột); `Files=15, Tests=158`, `Result: FAIL`.

(`open` trả về trước khi Docker sẵn sàng, nên vòng lặp chờ tối đa 60 giây cho `docker info` chạy được rồi mới khởi động Supabase local. Nếu `db:start` báo Supabase local đang chạy sẵn thì chạy tiếp hai lệnh sau nó. `db:reset` ở đây là bắt buộc: DB local có thể còn giữ hai cột từ lần chạy thử lúc viết plan, và khi đó test sẽ xanh ngay từ đầu. Nó chỉ dựng lại DB local theo các migration đang có trong thư mục làm việc.)

- [x] **Step 3: Viết migration và cập nhật kiểu (Patch 2)**

```diff
diff --git a/lib/supabase/types.ts b/lib/supabase/types.ts
index 549d3e5..af24589 100644
--- a/lib/supabase/types.ts
+++ b/lib/supabase/types.ts
@@ -203,3 +203,3 @@ isOneToOne: false
                   Row: {
-                    "feed_reminder": boolean,"hold_feed_while_asleep": boolean,"medicine": boolean,"quiet_enabled": boolean,"quiet_end_min": number,"quiet_start_min": number,"snooze_until": string | null,"timer_alert": boolean,"updated_at": string,"user_id": string,"vaccine": boolean,"wake_window": boolean
+                    "feed_reminder": boolean,"growth_alert": boolean,"growth_measure": boolean,"hold_feed_while_asleep": boolean,"medicine": boolean,"quiet_enabled": boolean,"quiet_end_min": number,"quiet_start_min": number,"snooze_until": string | null,"timer_alert": boolean,"updated_at": string,"user_id": string,"vaccine": boolean,"wake_window": boolean
                   }
@@ -207,6 +207,6 @@ isOneToOne: false
                   Insert: {
-                    "feed_reminder"?: boolean,"hold_feed_while_asleep"?: boolean,"medicine"?: boolean,"quiet_enabled"?: boolean,"quiet_end_min"?: number,"quiet_start_min"?: number,"snooze_until"?: string | null,"timer_alert"?: boolean,"updated_at"?: string,"user_id": string,"vaccine"?: boolean,"wake_window"?: boolean
+                    "feed_reminder"?: boolean,"growth_alert"?: boolean,"growth_measure"?: boolean,"hold_feed_while_asleep"?: boolean,"medicine"?: boolean,"quiet_enabled"?: boolean,"quiet_end_min"?: number,"quiet_start_min"?: number,"snooze_until"?: string | null,"timer_alert"?: boolean,"updated_at"?: string,"user_id": string,"vaccine"?: boolean,"wake_window"?: boolean
                   }
                   Update: {
-                    "feed_reminder"?: boolean,"hold_feed_while_asleep"?: boolean,"medicine"?: boolean,"quiet_enabled"?: boolean,"quiet_end_min"?: number,"quiet_start_min"?: number,"snooze_until"?: string | null,"timer_alert"?: boolean,"updated_at"?: string,"user_id"?: string,"vaccine"?: boolean,"wake_window"?: boolean
+                    "feed_reminder"?: boolean,"growth_alert"?: boolean,"growth_measure"?: boolean,"hold_feed_while_asleep"?: boolean,"medicine"?: boolean,"quiet_enabled"?: boolean,"quiet_end_min"?: number,"quiet_start_min"?: number,"snooze_until"?: string | null,"timer_alert"?: boolean,"updated_at"?: string,"user_id"?: string,"vaccine"?: boolean,"wake_window"?: boolean
                   }
diff --git a/supabase/migrations/20261125000200_growth_push.sql b/supabase/migrations/20261125000200_growth_push.sql
new file mode 100644
index 0000000..7cbb9be
--- /dev/null
+++ b/supabase/migrations/20261125000200_growth_push.sql
@@ -0,0 +1,9 @@
+-- Spec 2026-11-25 §8.1: two more reminder switches per user, both on by
+-- default, and two more notification kinds.
+alter table public.notification_prefs
+  add column growth_alert boolean not null default true,
+  add column growth_measure boolean not null default true;
+
+alter table public.notification_log drop constraint notification_log_kind_check;
+alter table public.notification_log add constraint notification_log_kind_check
+  check (kind in ('feed', 'wake', 'vaccine', 'medicine', 'timer', 'growth_alert', 'growth_measure'));
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bun run db:reset && bun run db:test`
Expected: PASS. `001`…`015` `ok`, `All tests successful.`, `Files=15, Tests=163`, `Result: PASS`.

Run: `bun run db:types && git diff --stat lib/supabase/types.ts`
Expected: `1 file changed, 3 insertions(+), 3 deletions(-)`, tức đúng 3 dòng mà Patch 2 đã đổi: file sinh lại từ DB local trùng với file của patch.

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  180 passed (180)`, `Tests  1593 passed (1593)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20261125000200_growth_push.sql supabase/tests/015_growth_push.test.sql lib/supabase/types.ts
git commit -m "feat(db): two growth switches and two growth notification kinds" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Hai công tắc trong Cài đặt (§8.1)

**Files:**

- Modify: `lib/rules/notifications.ts`, `lib/data/notificationPrefs.ts`, `components/settings/NotificationsGroup.tsx`
- Test: `lib/rules/notifications.test.ts`, `components/settings/notifications.test.tsx`

**Interfaces:**

- Consumes: hai cột của Task 1 (kiểu trong `lib/supabase/types.ts`); `PREF_OPTIONS`, `NotificationsGroupView`.
- Produces: `PrefKey` và `PREF_OPTIONS` có `growth_alert`, `growth_measure`; `DEFAULT_PREFS` và `fetchPrefs` có hai cột; hai hàng công tắc mới trong nhóm "Thông báo".

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/settings/notifications.test.tsx b/components/settings/notifications.test.tsx
index 1284e83..91dcd67 100644
--- a/components/settings/notifications.test.tsx
+++ b/components/settings/notifications.test.tsx
@@ -15,6 +15,8 @@ const prefs = {
   vaccine: true,
   medicine: true,
   timer_alert: false,
+  growth_alert: true,
+  growth_measure: false,
 };
 const view = (
   overrides: Partial<Parameters<typeof NotificationsGroupView>[0]> = {},
@@ -34,17 +36,19 @@ const view = (
 });

 describe("NotificationsGroupView", () => {
-  it("lists the device control, six switches, quiet hours and the snooze row", () => {
+  it("lists the device control, eight switches, quiet hours and the snooze row", () => {
     const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
     expect(html).toContain(">Thông báo</h2>");
     expect(html).toContain("<p>Thiết bị</p>");
-    expect(html.match(/role="switch"/g)).toHaveLength(6);
+    expect(html.match(/role="switch"/g)).toHaveLength(8);
     expect(html.match(/aria-checked="(true|false)"/g)).toEqual([
       'aria-checked="true"',
       'aria-checked="false"',
       'aria-checked="true"',
       'aria-checked="true"',
       'aria-checked="false"',
+      'aria-checked="true"',
+      'aria-checked="false"',
       'aria-checked="false"',
     ]);
     for (const label of [
@@ -53,6 +57,8 @@ describe("NotificationsGroupView", () => {
       "Nhắc lịch tiêm",
       "Nhắc thuốc",
       "Nhắc timer chạy quá lâu",
+      "Cảnh báo tăng trưởng",
+      "Nhắc đo định kỳ",
       "Không nhắc bú khi bé đang ngủ",
       "Giờ yên lặng",
       "Tạm tắt nhắc",
@@ -70,9 +76,14 @@ describe("NotificationsGroupView", () => {
       NotificationsGroupView(view({ onToggle })),
       (el) => el.props.checked !== undefined,
     );
-    expect(switches).toHaveLength(6);
+    expect(switches).toHaveLength(8);
     (switches[1].props.onChange as (v: boolean) => void)(true);
     expect(onToggle).toHaveBeenCalledWith("wake_window", true);
+    // Spec 2026-11-25 §8.1: the two growth switches save their own keys.
+    (switches[5].props.onChange as (v: boolean) => void)(false);
+    expect(onToggle).toHaveBeenLastCalledWith("growth_alert", false);
+    (switches[6].props.onChange as (v: boolean) => void)(true);
+    expect(onToggle).toHaveBeenLastCalledWith("growth_measure", true);
   });

   it("opens the snooze sheet from its row, unless disabled", () => {
@@ -100,6 +111,8 @@ describe("NotificationsGroupView — spec 2026-11-17 §4.4", () => {
       "Nhắc lịch tiêm",
       "Nhắc thuốc",
       "Nhắc timer chạy quá lâu",
+      "Cảnh báo tăng trưởng",
+      "Nhắc đo định kỳ",
       "Không nhắc bú khi bé đang ngủ",
       "Giờ yên lặng",
       "Lịch nhắc thuốc",
@@ -109,6 +122,8 @@ describe("NotificationsGroupView — spec 2026-11-17 §4.4", () => {
     expect([...order].sort((a, b) => a - b)).toEqual(order);
     expect(html).toContain(`d="${ICON_PATHS.pill}"`);
     expect(html).toContain(`d="${ICON_PATHS.clock}"`);
+    expect(html).toContain(`d="${ICON_PATHS.alert}"`);
+    expect(html).toContain(`d="${ICON_PATHS.ruler}"`);
     expect(html).toContain(`d="${ICON_PATHS.bottle}"`);
     expect(html).toContain(`d="${ICON_PATHS.moon}"`);
   });
@@ -124,8 +139,8 @@ describe("NotificationsGroupView — spec 2026-11-17 §4.4", () => {
       NotificationsGroupView(view({ onToggleHold, onToggle })),
       (el) => el.props.checked !== undefined,
     );
-    expect(switches[5].props.label).toBe("Không nhắc bú khi bé đang ngủ");
-    (switches[5].props.onChange as (v: boolean) => void)(true);
+    expect(switches[7].props.label).toBe("Không nhắc bú khi bé đang ngủ");
+    (switches[7].props.onChange as (v: boolean) => void)(true);
     expect(onToggleHold).toHaveBeenCalledWith(true);
     expect(onToggle).not.toHaveBeenCalled();
     (switches[3].props.onChange as (v: boolean) => void)(false);
diff --git a/lib/rules/notifications.test.ts b/lib/rules/notifications.test.ts
index 23be7a8..ad18401 100644
--- a/lib/rules/notifications.test.ts
+++ b/lib/rules/notifications.test.ts
@@ -119,14 +119,17 @@ describe("quiet hours (spec 2026-11-17 §4.3)", () => {
   });
 });

-describe("PREF_OPTIONS (spec 2026-11-17 §4.4)", () => {
-  it("lists five switches, the two new ones last", () => {
+describe("PREF_OPTIONS (spec 2026-11-17 §4.4, spec 2026-11-25 §8.1)", () => {
+  it("lists seven switches, the two growth ones last", () => {
     expect(PREF_OPTIONS.map((o) => [o.key, o.label])).toEqual([
       ["feed_reminder", "Nhắc cữ bú"],
       ["wake_window", "Nhắc khi bé thức quá lâu"],
       ["vaccine", "Nhắc lịch tiêm"],
       ["medicine", "Nhắc thuốc"],
       ["timer_alert", "Nhắc timer chạy quá lâu"],
+      ["growth_alert", "Cảnh báo tăng trưởng"],
+      ["growth_measure", "Nhắc đo định kỳ"],
     ]);
+    expect(PREF_OPTIONS.every((o) => o.note === null)).toBe(true);
   });
 });
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  2 failed | 178 passed (180)`, `Tests  5 failed | 1588 passed (1593)`. Lý do đỏ: `PREF_OPTIONS` mới có 5 dòng nên nhóm "Thông báo" mới có 6 công tắc.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/settings/NotificationsGroup.tsx b/components/settings/NotificationsGroup.tsx
index 30069e9..5ff5c57 100644
--- a/components/settings/NotificationsGroup.tsx
+++ b/components/settings/NotificationsGroup.tsx
@@ -36,6 +36,8 @@ const PREF_ICON: Record<PrefKey, IconName> = {
   vaccine: "syringe",
   medicine: "pill",
   timer_alert: "clock",
+  growth_alert: "alert",
+  growth_measure: "ruler",
 };

 export const SNOOZE_HINT =
diff --git a/lib/data/notificationPrefs.ts b/lib/data/notificationPrefs.ts
index fb9b7ed..c408bf8 100644
--- a/lib/data/notificationPrefs.ts
+++ b/lib/data/notificationPrefs.ts
@@ -23,6 +23,9 @@ export const DEFAULT_PREFS: NotificationPrefs = {
   // Spec 2026-11-17 §4.1: the column defaults.
   medicine: true,
   timer_alert: true,
+  // Spec 2026-11-25 §8.1: the column defaults.
+  growth_alert: true,
+  growth_measure: true,
   ...DEFAULT_QUIET,
   hold_feed_while_asleep: false,
   snooze_until: null,
@@ -34,7 +37,7 @@ export async function fetchPrefs(userId: string): Promise<NotificationPrefs> {
   const { data, error } = await supabase()
     .from("notification_prefs")
     .select(
-      "feed_reminder, wake_window, vaccine, snooze_until, medicine, timer_alert, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep",
+      "feed_reminder, wake_window, vaccine, snooze_until, medicine, timer_alert, growth_alert, growth_measure, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep",
     )
     .eq("user_id", userId)
     .maybeSingle();
diff --git a/lib/rules/notifications.ts b/lib/rules/notifications.ts
index e871da1..de761de 100644
--- a/lib/rules/notifications.ts
+++ b/lib/rules/notifications.ts
@@ -4,7 +4,13 @@ import { formatVnTime, vnDateString } from "./time";
 export const SNOOZE_HOURS = [2, 4, 8] as const;

 export type PrefKey =
-  "feed_reminder" | "wake_window" | "vaccine" | "medicine" | "timer_alert";
+  | "feed_reminder"
+  | "wake_window"
+  | "vaccine"
+  | "medicine"
+  | "timer_alert"
+  | "growth_alert"
+  | "growth_measure";

 export const PREF_OPTIONS: {
   key: PrefKey;
@@ -17,6 +23,9 @@ export const PREF_OPTIONS: {
   // Spec 2026-11-17 §4.4.
   { key: "medicine", label: "Nhắc thuốc", note: null },
   { key: "timer_alert", label: "Nhắc timer chạy quá lâu", note: null },
+  // Spec 2026-11-25 §8.1.
+  { key: "growth_alert", label: "Cảnh báo tăng trưởng", note: null },
+  { key: "growth_measure", label: "Nhắc đo định kỳ", note: null },
 ];

 export function snoozeUntil(now: Date, hours: number): string {
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  180 passed (180)`, `Tests  1593 passed (1593)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/notifications.ts lib/rules/notifications.test.ts lib/data/notificationPrefs.ts components/settings/NotificationsGroup.tsx components/settings/notifications.test.tsx
git commit -m "feat(settings): switches for growth alerts and measure reminders" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M5a, áp migration lên DB thật, rồi đưa lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: migration ở DB thật; kết quả kiểm, ghi ngay trong plan; `main` có M5a.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run && bun run db:reset && bun run db:test`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  180 passed (180)`, `Tests  1593 passed (1593)`; pgTAP `Files=15, Tests=163`, `Result: PASS`. Sau đó `bunx supabase stop` và thoát OrbStack (`osascript -e 'quit app "OrbStack"'`) nếu chính phiên này đã mở nó.

**Kết quả (2026-11-25):** đạt. `tsc --noEmit` mã 0; `Test Files  180 passed (180)`, `Tests  1593 passed (1593)`; pgTAP `Files=15, Tests=163`, `Result: PASS`. Trước đó Task 1 đỏ đúng như ghi (`Failed 7/7 subtests`, `You planned 7 tests but ran 2`, `Files=15, Tests=158`, `Result: FAIL`), Task 2 đỏ `2 failed | 178 passed (180)`, `5 failed | 1588 passed (1593)`; `bun run db:types` ra file trùng SHA-256 với file của Patch 2. 4 patch áp sạch bằng `kb_patch`, không sửa tay. Supabase local đã dừng, OrbStack đã thoát.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0. Nếu lần thứ hai vẫn hỏng: sửa cho build được (hoặc dừng và báo) trước khi sang Step 3; không áp migration khi build còn đỏ.

**Kết quả (2026-11-25):** đạt. Lần đầu mã 1 (`SecurityFatalError` của Next.js 16.4.3; không chạy `next upgrade`), lần hai mã 0, `✓ Generating static pages using 9 workers (40/40)`.

- [x] **Step 3: Áp migration lên DB thật**

Đây là bước duy nhất của plan chạm vào Supabase thật. Chỉ làm khi Step 1 có pgTAP xanh và Step 2 build được.

Run: `bunx supabase db push --dry-run`
Expected: danh sách migration sẽ áp chỉ có `20261125000200_growth_push.sql`. Nếu có thêm migration nào khác, hoặc CLI đòi mật khẩu, đòi đăng nhập hay báo chưa link project: dừng, không nhập gì, không push; ghi "Chờ người dùng: db push `20261125000200_growth_push.sql`" vào báo cáo và **bỏ qua Step 4 và Step 6** (không đẩy code lên `main`).

Run: `bunx supabase db push --yes`
Expected: `Applying migration 20261125000200_growth_push.sql...`, rồi `Finished supabase db push.`

Run: `bunx supabase db push --dry-run`
Expected: `Remote database is up to date.`

(Supabase CLI 2.122.0 có thể cảnh báo rằng bản major tới `db push` sẽ mặc định nhắm DB local; với bản đang cài thì lệnh trên vẫn nhắm project đã link.)

**Kết quả (2026-11-25):** đạt. Dry-run lần đầu: `Would push these migrations:` chỉ có `20261125000200_growth_push.sql`, CLI không đòi mật khẩu hay đăng nhập. Lệnh `bunx supabase db push --yes` của phiên bị bộ kiểm quyền chặn trước khi chạy; phiên dừng và báo, rồi người dùng tự chạy `bunx supabase db push --linked --yes` trong phiên: `Applying migration 20261125000200_growth_push.sql...`, `Finished supabase db push.` Dry-run lần hai (`--linked --dry-run`): `Remote database is up to date.`

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem, không gạt công tắc)**

Dùng khung Browser trong app, cỡ 375×812. Chạy `bun run dev`. Mở `http://localhost:3000/cai-dat` (dữ liệu thật của gia đình).

1. Nhóm "Thông báo" tải xong, không có dòng lỗi màu đỏ dưới nhóm (nếu có "không tải được" thì migration chưa tới DB thật: dừng, quay lại Step 3).
2. Thứ tự các hàng: "Nhắc cữ bú", "Nhắc khi bé thức quá lâu", "Nhắc lịch tiêm", "Nhắc thuốc", "Nhắc timer chạy quá lâu", **"Cảnh báo tăng trưởng"**, **"Nhắc đo định kỳ"**, "Không nhắc bú khi bé đang ngủ", "Giờ yên lặng", "Lịch nhắc thuốc", "Tạm tắt nhắc".
3. Hai hàng mới: icon tam giác cảnh báo và icon thước trong ô cùng màu với các hàng trên; tên nằm trên một dòng; công tắc ở bên phải và đang **bật** (người dùng chưa từng lưu hai tùy chọn này). Ghi lại trạng thái đang thấy; nếu máy chưa bật thông báo mà các công tắc bị mờ thì ghi đúng như vậy.
4. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
5. Lặp mục 2 và 3 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: hai hàng mới đọc rõ như các hàng cạnh nó.

Không gạt công tắc nào: gạt là ghi vào tùy chọn thật của người dùng. Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả (2026-11-25), khung Browser trong app, 375×812, trang thật, chỉ xem, không gạt công tắc nào:**

1. Đạt. Nhóm "Thông báo" tải xong, không có dòng `role="alert"` nào. Request `notification_prefs` với `select` có `growth_alert,growth_measure` trả về 200. Dòng "Thông báo chưa được thiết lập trên máy chủ." ở hàng Thiết bị là trạng thái `not-configured` của bản dev (có từ trước, không phải lỗi tải).
2. Đạt. Thứ tự đúng: "Nhắc cữ bú", "Nhắc khi bé thức quá lâu", "Nhắc lịch tiêm", "Nhắc thuốc", "Nhắc timer chạy quá lâu", "Cảnh báo tăng trưởng", "Nhắc đo định kỳ", "Không nhắc bú khi bé đang ngủ", "Giờ yên lặng", "Lịch nhắc thuốc", "Tạm tắt nhắc".
3. Đạt. Hai hàng mới: icon `alert` và `ruler` trong ô 30×30 cùng màu nền và màu nét với hàng "Nhắc timer chạy quá lâu"; tên trên một dòng, không bị cắt; hàng cao 52 px; công tắc sát phải (mép phải 342 px như các hàng khác), `aria-checked="true"`, không mờ (opacity 1, không `disabled`). Cả tám công tắc của nhóm đang bật.
4. Đạt. `scrollWidth` 375 = `innerWidth` 375.
5. Đạt ở `night` (theme đang dùng), `rose`, `light`, `dark`: đã chụp và đo, hai hàng mới đọc rõ như các hàng cạnh nó. Đo thêm `peach`, `lavender`, `sea` (không chụp): cùng màu ô và màu chữ với hàng bên cạnh, một dòng, không tràn ngang. Theme đổi bằng `dataset.theme`, đã trả về `night`, không lưu.

Console không có lỗi. Dev đã dừng (cổng 3000 trống), cỡ khung đã trả về mặc định. Không tạo `.claude/launch.json`. Chưa kiểm: gạt thử hai công tắc và lưu (không được ghi lên dữ liệu thật), trạng thái công tắc mờ khi máy chưa bật thông báo, phía thành viên, iPhone thật, PWA.

**Sửa sau lần kiểm:** không có. Spec không đổi.

- [x] **Step 5: Commit phần ghi kết quả**

```bash
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m5a.md
git commit -m "docs(plan): record the M5a check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 6: Đưa lên `main`**

Chỉ khi Step 1 đến Step 4 đều đạt, migration đã ở DB thật, và không còn lỗi đã biết:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m5a
git push origin main
git rev-parse --short main origin/main   # hai dòng phải giống nhau
```

Nếu `git merge --ff-only` không được vì `main` đã đổi, hoặc `git push` bị từ chối: `git checkout feat/kim-bun-suc-khoe-m5a && git rebase origin/main`, chạy lại Step 1, rồi thử lại. Không bao giờ force-push.

Báo cáo: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, pgTAP, build; kết quả `db push` (dry-run trước và sau); mục nào của bước trình duyệt đã thấy, mục nào chưa; lỗi nào đã sửa trong phiên; việc gì còn chờ người dùng (ví dụ: gạt thử hai công tắc trên máy của họ); và ghi chú ở mục 4 của Diễn giải spec (câu gợi ý của "Tạm tắt nhắc" chỉ kể bốn loại cũ).
