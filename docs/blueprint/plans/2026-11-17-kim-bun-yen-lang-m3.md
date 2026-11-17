# Kim Bun — M3 Cài đặt thông báo và giờ yên lặng Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md` (§4.1 toàn bộ; §4.4 trừ hàng "Lịch nhắc thuốc"; phần giờ yên lặng và "bé đang ngủ" của §4.3; phần tương ứng của §6.1, §6.2, §6.3).

**Status:** approved 2026-11-17

**Goal:** DB có các cột cài đặt nhắc mới, hai loại thông báo mới và bảng lịch thuốc; mỗi người bật được giờ yên lặng và công tắc "Không nhắc bú khi bé đang ngủ" trong Cài đặt › Thông báo; bộ gửi push giữ lại nhắc bú và nhắc thức theo hai cài đặt đó.

**Architecture:**

- **DB:** một migration chỉ thêm (`20261117000200_reminders.sql`) cho cả M3 và M4: 6 cột của `notification_prefs`, nới check `kind` của `notification_log`, bảng `medicine_schedules` kèm RLS. Bảng lịch thuốc được tạo ở đây nhưng tới M4 mới có code dùng.
- **Luật thuần:** giờ yên lặng nằm trong `lib/rules/notifications.ts`; `lib/rules/pushSelection.ts` lọc người nhận nhắc bú và nhắc thức theo giờ yên lặng, và nhắc bú theo "bé đang ngủ". Thông báo bị giữ không được claim, nên lần cron sau khi hết điều kiện sẽ gửi.
- **Server:** `lib/server/dispatchDeps.ts` nạp thêm 6 cột và danh sách timer đang chạy.
- **Giao diện:** `NotificationsGroup` thêm 2 công tắc, công tắc "bé đang ngủ" kèm ghi chú, hàng và sheet "Giờ yên lặng".
- Chưa làm ở plan này (thuộc M4): trang `/cai-dat/nhac-thuoc` và hàng "Lịch nhắc thuốc", luật push cho `medicine` và `timer`.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Supabase (Postgres, pgTAP), Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-yen-lang-m3`, cắt từ `main` @ `4707b34`. Baseline: 866 test vitest xanh (143 file), typecheck sạch, pgTAP 001–012 (119 test).

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1a, M1b, M2 | Bốn loại bản ghi mới; canh timer trong app | đã xong, đã lên `main` |
| **M3 (plan này)** | Migration `reminders`, §4.4, giờ yên lặng, `hold_feed_while_asleep` | `2026-11-17-kim-bun-yen-lang-m3.md` |
| M4 | §4.2 lịch thuốc, nhắc thuốc, nhắc hạ sốt, push timer, checklist §6.4 | chưa viết |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M3 không lên `main` một mình.** Spec §7: M3 có sẵn hai công tắc `medicine` và `timer_alert` nhưng hai loại thông báo đó chỉ có từ M4, nên M3 và M4 chỉ được deploy cùng nhau. Nhánh của plan này nằm yên ở máy cho tới khi M4 xong.
2. **Hàng "Lịch nhắc thuốc"** (§4.4 mục 5) để cho M4, vì trang đích `/cai-dat/nhac-thuoc` chưa có. Thứ tự các hàng còn lại đúng như §4.4.
3. **Tạm tắt (snooze).** Ở M3 chỉ đổi dòng chú thích. Việc snooze chặn `medicine` và `timer` thuộc M4, khi hai loại đó có luật gửi.
4. **Trường mới của `Recipient.prefs` là tuỳ chọn.** Thiếu trường nghĩa là lấy default của §4.1, cùng luật với `prefs: null`.
5. **`runningTimers` và kiểu `RunningTimer`** được thêm ngay ở M3, vì luật "bé đang ngủ" cần giờ bắt đầu của timer Ngủ. M4 dùng lại cho push timer.
6. **"Bé đang ngủ" chỉ giữ nhắc bú,** không giữ nhắc thức (nhắc thức vốn không gửi khi timer Ngủ đang chạy). Timer Ngủ chạy từ 840 phút trở lên không còn giữ.
7. **Hàm phụ trong `lib/rules/notifications.ts`:** `minutesToTime`, `timeToMinutes`, `quietHoursValue`, `quietHoursPatch`. Khi ô giờ trống hoặc không đọc được, sheet báo "Chọn giờ bắt đầu và giờ kết thúc" (spec chỉ cho câu của trường hợp hai giờ bằng nhau).
8. **Sheet "Giờ yên lặng"** chỉ được mount khi mở, nên luôn bắt đầu từ giá trị đã lưu; công tắc trong sheet chỉ ghi vào DB khi bấm Lưu.
9. **Ghi chú của công tắc "bé đang ngủ"** dùng prop `detail` có sẵn của `ListRow`, nằm ngay dưới nhãn.
10. **pgTAP không kiểm `updated_at`.** Trong một transaction `now()` đứng yên, nên `updated_at` sau khi sửa vẫn bằng `created_at`.
11. **`lib/supabase/types.ts`** được sinh lại từ Supabase local sau khi áp migration; patch mang đúng kết quả đó, nên áp patch tương đương với chạy `bun run db:types`.
12. **Kiểm tay (§6.3).** Phiên chính làm, bằng trình duyệt có sẵn trong app Claude ở 375×812, cần người dùng đồng ý mỗi lần. Không gạt công tắc nào của Cài đặt › Thông báo (chúng ghi thẳng vào DB); mở sheet "Giờ yên lặng" để xem thì được, không bấm Lưu.

## Global Constraints

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

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Baseline thật.** Dòng "803 test" ở trên chép nguyên từ spec; trên `main` @ `4707b34` con số hiện tại là 866 test, 143 file, và pgTAP 001–012 (119 test).
- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-17-kim-bun-yen-lang-m3.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao của `main` @ `4707b34` ở ngoài repo: `tsc --noEmit` sạch sau mỗi task, số test vitest đỏ và xanh đúng như ghi; pgTAP 013 đã chạy đỏ rồi xanh trên Supabase local (13 file, 135 test). Chưa chạy trong lúc viết plan: `bun run build`, kiểm trên trình duyệt, `db push` lên project thật.
- **pgTAP cần Docker.** `bun run db:start`, `db:reset`, `db:test` chỉ chạm Supabase **local** trong Docker (OrbStack). Nếu Docker không chạy được, ô của bước đó để **chưa tick**, ghi "pgTAP 013 chưa chạy: Docker không chạy" vào báo cáo, rồi làm tiếp. Không bao giờ đánh dấu đạt một bước chưa chạy.
- **Supabase thật.** Chỉ Task 1 Step 6 chạm vào project thật, và chỉ sau khi người dùng đồng ý. `bun run dev` chỉ chạy ở Task 4 Step 3.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Next.js.** Không task nào thêm route hay đổi lời gọi API của Next.
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **Git.** Mọi commit nằm trên nhánh, ở máy. Plan này không push nhánh, không merge, không push `main`.

## Contracts with Other Plans

Plan này đứng sau M1a, M1b, M2 (đã ở trên `main`) và trước M4 (chưa viết).

**Consumes (từ `main` @ `4707b34`):**

- **DB:** `public.notification_prefs` (cột `feed_reminder`, `wake_window`, `vaccine`, `snooze_until`), `public.notification_log` với check `notification_log_kind_check`, `public.babies`, các hàm `public.is_member`, `public.baby_family`, `public.set_updated_at`, `public.forbid_immutable_change`.
- **`lib/rules/timer.ts` (M2):** `TIMER_LIMIT_MIN.sleep` = 840.
- **`lib/rules/pushSelection.ts`:** `BabyDispatchState` (có `breastRunningSince`, `wake.sleepRunning`), `Recipient`, `selectDueNotifications`.
- **`lib/rules/notifications.ts`:** `PrefKey`, `PREF_OPTIONS` (3 mục), `snoozeText`, `snoozeUntil`. **`lib/data/notificationPrefs.ts`:** `NotificationPrefs`, `DEFAULT_PREFS`, `useNotificationPrefs`, `useSavePrefs`.
- **Giao diện:** `ListRow` (prop `detail`, `value`, `trailing`), `Switch`, `Sheet` (prop `footer`), `Button`, `FIELD_INPUT`, `FIELD_LABEL` (`components/quick/styles.ts`).

**Produces** (M4 được dựa vào đúng những tên này):

- **DB (sau `20261117000200_reminders.sql`):** `notification_prefs` thêm `medicine`, `timer_alert`, `quiet_enabled`, `quiet_start_min`, `quiet_end_min`, `hold_feed_while_asleep`; `notification_log.kind` nhận thêm `'medicine'`, `'timer'`; bảng `public.medicine_schedules (id, baby_id, name, remind_at_min, enabled, created_by, created_at, updated_at)` với unique index `(baby_id, lower(btrim(name)))` và RLS cho mọi thành viên. pgTAP `013_reminders.test.sql`. Trạng thái "đã áp lên project thật hay chưa" nằm ở ô Task 1 Step 6 của file này.
- **`lib/supabase/types.ts`:** có `medicine_schedules` và 6 cột mới.
- **`lib/rules/notifications.ts`:** `PrefKey` thêm `"medicine"` và `"timer_alert"`; `PREF_OPTIONS` 5 mục; `QuietPrefs`, `DEFAULT_QUIET`, `inQuietHours(prefs: QuietPrefs, now: Date): boolean`, `minutesToTime(minutes: number): string`, `timeToMinutes(value: string): number | null`, `quietHoursValue`, `quietHoursPatch`.
- **`lib/rules/pushSelection.ts`:** `Recipient.prefs` có thêm 6 trường tuỳ chọn; `RunningTimer = { id; type: "breast" | "sleep" | "pump" | "tummy"; startedAt; side: "left" | "right" | null }`; `BabyDispatchState.runningTimers: RunningTimer[]`.
- **`lib/server/dispatchDeps.ts`:** nạp 6 cột mới và `runningTimers` cho mỗi bé.
- **`lib/data/notificationPrefs.ts`:** `NotificationPrefs` và `DEFAULT_PREFS` có 6 trường mới.
- **`components/settings/NotificationsGroup.tsx`:** `NotificationsGroupView` (prop mới `holdFeed`, `quiet`, `onToggleHold`, `onOpenQuiet`), `QuietHoursSheet`, `SNOOZE_HINT` (export). M4 thêm hàng "Lịch nhắc thuốc" giữa "Giờ yên lặng" và "Tạm tắt nhắc".
- **Nhánh:** `feat/kim-bun-yen-lang-m3`. **Vitest sau M3:** 883 test, 143 file. **pgTAP sau M3:** 13 file, 135 test.

---

### Task 1: Migration `reminders`, pgTAP 013 và kiểu dữ liệu

**Files:**

- Create: `supabase/migrations/20261117000200_reminders.sql`, `supabase/tests/013_reminders.test.sql`
- Modify: `lib/supabase/types.ts` (sinh lại)

**Interfaces:**

- Consumes: bảng và hàm SQL liệt kê ở Contracts.
- Produces: schema ở mục Produces của Contracts; `Database["public"]["Tables"]["medicine_schedules"]` trong `lib/supabase/types.ts`.

- [x] **Step 0: Tạo nhánh và đo baseline**

Run: `git checkout main && git status --short && git checkout -b feat/kim-bun-yen-lang-m3 && bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  143 passed (143)`, `Tests  866 passed (866)`. Nếu khác, dừng và báo lại.

- [x] **Step 1: Viết test pgTAP hỏng (Patch 1)**

Run: `kb_patch 1 | git apply --verbose`
Expected: `Applied patch supabase/tests/013_reminders.test.sql cleanly.`

```diff
diff --git a/supabase/tests/013_reminders.test.sql b/supabase/tests/013_reminders.test.sql
new file mode 100644
index 0000000..84b4d1b
--- /dev/null
+++ b/supabase/tests/013_reminders.test.sql
@@ -0,0 +1,104 @@
+begin;
+create extension if not exists pgtap with schema extensions;
+select plan(16);
+
+insert into auth.users (id, email) values
+  ('aaaaaaaa-0000-0000-0000-000000000013', 'ra@example.com'),
+  ('bbbbbbbb-0000-0000-0000-000000000013', 'rb@example.com'),
+  ('cccccccc-0000-0000-0000-000000000013', 'rc@example.com');
+insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000013', 'Nhà R');
+insert into public.family_members (family_id, email, user_id, role, display_name) values
+  ('f0000000-0000-0000-0000-000000000013', 'ra@example.com', 'aaaaaaaa-0000-0000-0000-000000000013', 'owner', 'Mẹ'),
+  ('f0000000-0000-0000-0000-000000000013', 'rb@example.com', 'bbbbbbbb-0000-0000-0000-000000000013', 'member', 'Bà');
+insert into public.babies (id, family_id, name, dob, sex)
+  values ('ba000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000013', 'Bé', '2026-05-01', 'female');
+
+-- Spec 2026-11-17 §4.1: new notification_prefs columns and their defaults.
+insert into public.notification_prefs (user_id) values ('aaaaaaaa-0000-0000-0000-000000000013');
+select is(
+  (select row(medicine, timer_alert, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep)::text
+     from public.notification_prefs where user_id = 'aaaaaaaa-0000-0000-0000-000000000013'),
+  '(t,t,f,1320,360,f)',
+  'new prefs default to: medicine on, timer alert on, quiet hours off 22:00-06:00, no hold while asleep');
+select throws_ok(
+  $$ update public.notification_prefs set quiet_start_min = 1440
+     where user_id = 'aaaaaaaa-0000-0000-0000-000000000013' $$,
+  '23514', null, 'quiet_start_min stays within 0-1439');
+select throws_ok(
+  $$ update public.notification_prefs set quiet_end_min = -1
+     where user_id = 'aaaaaaaa-0000-0000-0000-000000000013' $$,
+  '23514', null, 'quiet_end_min stays within 0-1439');
+
+-- notification_log accepts the two new kinds.
+select lives_ok(
+  $$ insert into public.notification_log (user_id, kind, ref_key)
+     values ('aaaaaaaa-0000-0000-0000-000000000013', 'medicine', 'med:x:2026-11-17:540') $$,
+  'kind medicine is accepted');
+select lives_ok(
+  $$ insert into public.notification_log (user_id, kind, ref_key)
+     values ('aaaaaaaa-0000-0000-0000-000000000013', 'timer', 'timer:x') $$,
+  'kind timer is accepted');
+select throws_ok(
+  $$ insert into public.notification_log (user_id, kind, ref_key)
+     values ('aaaaaaaa-0000-0000-0000-000000000013', 'abc', 'abc:x') $$,
+  '23514', null, 'an unknown kind is still refused');
+
+-- medicine_schedules checks.
+select throws_ok(
+  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min, created_by)
+     values ('ba000000-0000-0000-0000-000000000013', '  ', 540, 'aaaaaaaa-0000-0000-0000-000000000013') $$,
+  '23514', null, 'a blank name is refused');
+select throws_ok(
+  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min, created_by)
+     values ('ba000000-0000-0000-0000-000000000013', 'DHA', 1440, 'aaaaaaaa-0000-0000-0000-000000000013') $$,
+  '23514', null, 'remind_at_min stays within 0-1439');
+
+-- As C (outsider)
+select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000013","email":"rc@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select throws_ok(
+  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min)
+     values ('ba000000-0000-0000-0000-000000000013', 'Vitamin D', 540) $$,
+  '42501', null, 'an outsider cannot add a schedule');
+reset role;
+
+-- As B (member)
+select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000013","email":"rb@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select lives_ok(
+  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min)
+     values ('ba000000-0000-0000-0000-000000000013', 'Vitamin D', 540) $$,
+  'a member adds a schedule (enabled and created_by default)');
+select throws_ok(
+  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min)
+     values ('ba000000-0000-0000-0000-000000000013', ' vitamin d ', 600) $$,
+  '23505', null, 'the same name in another case is refused for the same baby');
+select lives_ok(
+  $$ update public.medicine_schedules set remind_at_min = 1170, enabled = false where name = 'Vitamin D' $$,
+  'a member changes the time and turns it off');
+select throws_ok(
+  $$ update public.medicine_schedules set baby_id = 'ba000000-0000-0000-0000-000000000099' where name = 'Vitamin D' $$,
+  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');
+reset role;
+select is(
+  (select row(remind_at_min, enabled, created_by)::text
+     from public.medicine_schedules where name = 'Vitamin D'),
+  '(1170,f,bbbbbbbb-0000-0000-0000-000000000013)',
+  'the change took effect and created_by is the member');
+
+-- As C (outsider)
+select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000013","email":"rc@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select is_empty('select id from public.medicine_schedules', 'an outsider sees no schedules');
+reset role;
+
+-- As A (owner)
+select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000013","email":"ra@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select lives_ok(
+  $$ delete from public.medicine_schedules where name = 'Vitamin D' $$,
+  'another member deletes the schedule');
+reset role;
+
+select * from finish();
+rollback;
```

- [x] **Step 2: Chạy pgTAP trên Supabase local, thấy 013 hỏng**

Run: `open -a OrbStack; for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 2; done; bun run db:start && bun run db:test`
Expected: `001`…`012` `ok`; `013_reminders.test.sql` hỏng với `Bad plan.  You planned 16 tests but ran 0.`; `Result: FAIL`. Nếu Docker không chạy được: để ô Step 2 và Step 4 chưa tick, ghi "pgTAP 013 chưa chạy: Docker không chạy" vào báo cáo, rồi làm tiếp Step 3.

- [x] **Step 3: Viết migration và sinh lại kiểu dữ liệu (Patch 2)**

Run: `kb_patch 2 | git apply --verbose`
Expected: `Applied patch lib/supabase/types.ts cleanly.` và `Applied patch supabase/migrations/20261117000200_reminders.sql cleanly.`

```diff
diff --git a/lib/supabase/types.ts b/lib/supabase/types.ts
index 8d7d61a..f3fcc44 100644
--- a/lib/supabase/types.ts
+++ b/lib/supabase/types.ts
@@ -114,6 +114,26 @@ isOneToOne: false
                     {
       foreignKeyName: "logs_baby_id_fkey"
       columns: ["baby_id"]
+isOneToOne: false
+      referencedRelation: "babies"
+      referencedColumns: ["id"]
+    }
+                  ]
+                },"medicine_schedules": {
+                  Row: {
+                    "baby_id": string,"created_at": string,"created_by": string,"enabled": boolean,"id": string,"name": string,"remind_at_min": number,"updated_at": string
+                  }
+                  ComputedFields: never
+                  Insert: {
+                    "baby_id": string,"created_at"?: string,"created_by"?: string,"enabled"?: boolean,"id"?: string,"name": string,"remind_at_min": number,"updated_at"?: string
+                  }
+                  Update: {
+                    "baby_id"?: string,"created_at"?: string,"created_by"?: string,"enabled"?: boolean,"id"?: string,"name"?: string,"remind_at_min"?: number,"updated_at"?: string
+                  }
+                  Relationships: [
+                    {
+      foreignKeyName: "medicine_schedules_baby_id_fkey"
+      columns: ["baby_id"]
 isOneToOne: false
       referencedRelation: "babies"
       referencedColumns: ["id"]
@@ -181,14 +201,14 @@ isOneToOne: false
                   ]
                 },"notification_prefs": {
                   Row: {
-                    "feed_reminder": boolean,"snooze_until": string | null,"updated_at": string,"user_id": string,"vaccine": boolean,"wake_window": boolean
+                    "feed_reminder": boolean,"hold_feed_while_asleep": boolean,"medicine": boolean,"quiet_enabled": boolean,"quiet_end_min": number,"quiet_start_min": number,"snooze_until": string | null,"timer_alert": boolean,"updated_at": string,"user_id": string,"vaccine": boolean,"wake_window": boolean
                   }
                   ComputedFields: never
                   Insert: {
-                    "feed_reminder"?: boolean,"snooze_until"?: string | null,"updated_at"?: string,"user_id": string,"vaccine"?: boolean,"wake_window"?: boolean
+                    "feed_reminder"?: boolean,"hold_feed_while_asleep"?: boolean,"medicine"?: boolean,"quiet_enabled"?: boolean,"quiet_end_min"?: number,"quiet_start_min"?: number,"snooze_until"?: string | null,"timer_alert"?: boolean,"updated_at"?: string,"user_id": string,"vaccine"?: boolean,"wake_window"?: boolean
                   }
                   Update: {
-                    "feed_reminder"?: boolean,"snooze_until"?: string | null,"updated_at"?: string,"user_id"?: string,"vaccine"?: boolean,"wake_window"?: boolean
+                    "feed_reminder"?: boolean,"hold_feed_while_asleep"?: boolean,"medicine"?: boolean,"quiet_enabled"?: boolean,"quiet_end_min"?: number,"quiet_start_min"?: number,"snooze_until"?: string | null,"timer_alert"?: boolean,"updated_at"?: string,"user_id"?: string,"vaccine"?: boolean,"wake_window"?: boolean
                   }
                   Relationships: [
                     
diff --git a/supabase/migrations/20261117000200_reminders.sql b/supabase/migrations/20261117000200_reminders.sql
new file mode 100644
index 0000000..b042253
--- /dev/null
+++ b/supabase/migrations/20261117000200_reminders.sql
@@ -0,0 +1,45 @@
+-- Spec 2026-11-17 §4.1: reminder switches and quiet hours per user, two more
+-- notification kinds, and one reminder time per medicine per baby.
+alter table public.notification_prefs
+  add column medicine boolean not null default true,
+  add column timer_alert boolean not null default true,
+  add column quiet_enabled boolean not null default false,
+  add column quiet_start_min int not null default 1320 check (quiet_start_min between 0 and 1439),
+  add column quiet_end_min int not null default 360 check (quiet_end_min between 0 and 1439),
+  add column hold_feed_while_asleep boolean not null default false;
+
+alter table public.notification_log drop constraint notification_log_kind_check;
+alter table public.notification_log add constraint notification_log_kind_check
+  check (kind in ('feed', 'wake', 'vaccine', 'medicine', 'timer'));
+
+create table public.medicine_schedules (
+  id uuid primary key default gen_random_uuid(),
+  baby_id uuid not null references public.babies (id) on delete cascade,
+  name text not null check (length(btrim(name)) between 1 and 80),
+  -- Minutes after 00:00 Vietnam time.
+  remind_at_min int not null check (remind_at_min between 0 and 1439),
+  enabled boolean not null default true,
+  created_by uuid not null default auth.uid() references auth.users (id),
+  created_at timestamptz not null default now(),
+  updated_at timestamptz not null default now()
+);
+create unique index medicine_schedules_baby_name_idx
+  on public.medicine_schedules (baby_id, lower(btrim(name)));
+
+create trigger medicine_schedules_set_updated_at before update on public.medicine_schedules
+  for each row execute function public.set_updated_at();
+create trigger medicine_schedules_immutable before update on public.medicine_schedules
+  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');
+
+alter table public.medicine_schedules enable row level security;
+
+-- Every member of the baby's family reads, adds, edits and deletes (like emergency_contacts).
+create policy medicine_schedules_select on public.medicine_schedules for select to authenticated
+  using (public.is_member(public.baby_family(baby_id)));
+create policy medicine_schedules_insert on public.medicine_schedules for insert to authenticated
+  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
+create policy medicine_schedules_update on public.medicine_schedules for update to authenticated
+  using (public.is_member(public.baby_family(baby_id)))
+  with check (public.is_member(public.baby_family(baby_id)));
+create policy medicine_schedules_delete on public.medicine_schedules for delete to authenticated
+  using (public.is_member(public.baby_family(baby_id)));
```

- [x] **Step 4: Áp migration lên Supabase local, chạy lại pgTAP**

Run: `bun run db:reset && bun run db:test`
Expected: `001`…`013` `ok`, `All tests successful.`, `Files=13, Tests=135`, `Result: PASS`. Rồi chạy `bun run db:types && git diff --stat lib/supabase/types.ts`: không in gì thêm (file đã khớp với DB local).

- [x] **Step 5: Typecheck, toàn bộ test, commit**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  143 passed (143)`, `Tests  866 passed (866)` (task này không thêm test vitest).

```bash
git add supabase/tests/013_reminders.test.sql lib/supabase/types.ts supabase/migrations/20261117000200_reminders.sql
git commit -m "feat(db): reminder prefs, medicine and timer kinds, medicine schedules" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [ ] **Step 6: Hỏi người dùng, rồi mới áp migration lên project thật**

Đây là bước duy nhất của plan chạm vào Supabase thật. Migration chỉ thêm cột có default, nới một check và tạo một bảng mới, nên bản web đang chạy không bị ảnh hưởng. Hỏi người dùng đúng câu sau và chờ trả lời trong phiên:

> Migration `20261117000200_reminders.sql` thêm 6 cột có default vào `notification_prefs`, cho `notification_log.kind` nhận thêm `medicine` và `timer`, và tạo bảng `medicine_schedules` kèm RLS (không xoá, không đổi cột nào). pgTAP 013 trên Supabase local: [đạt / chưa chạy được vì Docker]. Tôi chạy `bunx supabase db push` lên project thật bây giờ được không?

**Người dùng không đồng ý, hoặc chưa trả lời:** dừng bước này, không chạy lệnh nào bên dưới, để ô này chưa tick và ghi "Chờ người dùng: db push `20261117000200_reminders.sql`" vào báo cáo. Task 2–4 chỉ sửa code trên nhánh nên vẫn làm tiếp được. Code của M3 và M4 không được lên `main` khi bước này chưa xong. Nếu người dùng đồng ý muộn: chạy các lệnh lúc đó, tick ô này trên nhánh đang đứng và commit file plan này.

**Người dùng đồng ý:**

Run: `bunx supabase db push --dry-run`
Expected: danh sách migration sẽ áp chỉ có `20261117000200_reminders.sql`. Nếu có thêm migration nào khác, dừng và báo người dùng, không push.

Run: `bunx supabase db push --yes`
Expected: `Applying migration 20261117000200_reminders.sql...`, rồi `Finished supabase db push.` Nếu CLI đòi mật khẩu DB hoặc báo chưa link project: dừng, không tự nhập mật khẩu, ghi vào báo cáo là việc người dùng tự làm.

---

### Task 2: Giờ yên lặng và "bé đang ngủ" trong bộ chọn thông báo

**Files:**

- Modify: `lib/rules/notifications.ts` (thêm các hàm giờ yên lặng vào cuối file), `lib/rules/pushSelection.ts`, `lib/server/dispatchDeps.ts`
- Test: `lib/rules/notifications.test.ts`, `lib/rules/pushSelection.test.ts`, `lib/server/dispatch.test.ts` (chỉ thêm `runningTimers: []` vào fixture)

**Interfaces:**

- Consumes: `TIMER_LIMIT_MIN.sleep` (M2); `formatVnTime` (`lib/rules/time.ts`); các cột mới của Task 1 qua `lib/supabase/types.ts`.
- Produces: `QuietPrefs`, `DEFAULT_QUIET`, `inQuietHours`, `minutesToTime`, `timeToMinutes`, `quietHoursValue`, `quietHoursPatch` (`lib/rules/notifications.ts`); `RunningTimer`, `BabyDispatchState.runningTimers`, 6 trường tuỳ chọn của `Recipient.prefs` (`lib/rules/pushSelection.ts`); `dispatchDeps` nạp các dữ liệu đó.

Luật: người nhận trong giờ yên lặng không nhận nhắc bú và nhắc thức; người bật `hold_feed_while_asleep` không nhận nhắc bú khi có timer Ngủ chạy dưới 840 phút. Nhắc tiêm không bị ảnh hưởng. Thông báo bị giữ không được claim, nên `refKey` giữ nguyên và lần cron kế tiếp sau khi hết điều kiện sẽ gửi.

- [x] **Step 1: Viết test hỏng (Patch 3)**

Run: `kb_patch 3 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/lib/rules/notifications.test.ts b/lib/rules/notifications.test.ts
index 65d7e4a..32e7b33 100644
--- a/lib/rules/notifications.test.ts
+++ b/lib/rules/notifications.test.ts
@@ -1,5 +1,14 @@
 import { describe, expect, it } from "vitest";
-import { snoozeText, snoozeUntil, SNOOZE_HOURS } from "./notifications";
+import {
+  inQuietHours,
+  minutesToTime,
+  quietHoursPatch,
+  quietHoursValue,
+  snoozeText,
+  snoozeUntil,
+  SNOOZE_HOURS,
+  timeToMinutes,
+} from "./notifications";
 
 const now = new Date("2026-11-14T13:00:00Z"); // 20:00 on 14/11 in VN
 
@@ -26,3 +35,85 @@ describe("notification snooze", () => {
     expect(snoozeText("2026-11-14T12:59:00Z", now)).toBeNull();
   });
 });
+
+describe("quiet hours (spec 2026-11-17 §4.3)", () => {
+  // VN time is UTC+7: 15:30Z is 22:30, 23:00Z is 06:00 the next day.
+  const at = (iso: string) => new Date(iso);
+  const night = {
+    quiet_enabled: true,
+    quiet_start_min: 1320,
+    quiet_end_min: 360,
+  };
+
+  it("a range across midnight covers the evening and the early morning", () => {
+    expect(inQuietHours(night, at("2026-11-14T15:00:00Z"))).toBe(true); // 22:00
+    expect(inQuietHours(night, at("2026-11-14T18:30:00Z"))).toBe(true); // 01:30
+    expect(inQuietHours(night, at("2026-11-14T22:59:00Z"))).toBe(true); // 05:59
+    expect(inQuietHours(night, at("2026-11-14T23:00:00Z"))).toBe(false); // 06:00
+    expect(inQuietHours(night, at("2026-11-14T14:59:00Z"))).toBe(false); // 21:59
+  });
+
+  it("a range inside one day covers start up to, not including, end", () => {
+    const nap = {
+      quiet_enabled: true,
+      quiet_start_min: 780,
+      quiet_end_min: 900,
+    };
+    expect(inQuietHours(nap, at("2026-11-14T06:00:00Z"))).toBe(true); // 13:00
+    expect(inQuietHours(nap, at("2026-11-14T07:59:00Z"))).toBe(true); // 14:59
+    expect(inQuietHours(nap, at("2026-11-14T08:00:00Z"))).toBe(false); // 15:00
+    expect(inQuietHours(nap, at("2026-11-14T05:59:00Z"))).toBe(false); // 12:59
+  });
+
+  it("is never quiet when switched off or when start equals end", () => {
+    const evening = at("2026-11-14T16:00:00Z");
+    expect(inQuietHours({ ...night, quiet_enabled: false }, evening)).toBe(
+      false,
+    );
+    expect(
+      inQuietHours(
+        { quiet_enabled: true, quiet_start_min: 600, quiet_end_min: 600 },
+        evening,
+      ),
+    ).toBe(false);
+  });
+
+  it("converts between minutes and HH:mm", () => {
+    expect(minutesToTime(0)).toBe("00:00");
+    expect(minutesToTime(1320)).toBe("22:00");
+    expect(minutesToTime(1439)).toBe("23:59");
+    expect(timeToMinutes("06:00")).toBe(360);
+    expect(timeToMinutes("23:59")).toBe(1439);
+    expect(timeToMinutes("24:00")).toBeNull();
+    expect(timeToMinutes("6:00")).toBeNull();
+    expect(timeToMinutes("")).toBeNull();
+  });
+
+  it("quietHoursValue is Tắt or the two times", () => {
+    expect(quietHoursValue(night)).toBe("22:00–06:00");
+    expect(quietHoursValue({ ...night, quiet_enabled: false })).toBe("Tắt");
+  });
+
+  it("quietHoursPatch refuses equal or unreadable times", () => {
+    expect(quietHoursPatch(true, "22:00", "06:00")).toEqual({
+      ok: true,
+      patch: night,
+    });
+    expect(quietHoursPatch(false, "21:30", "05:15")).toEqual({
+      ok: true,
+      patch: {
+        quiet_enabled: false,
+        quiet_start_min: 1290,
+        quiet_end_min: 315,
+      },
+    });
+    expect(quietHoursPatch(true, "22:00", "22:00")).toEqual({
+      ok: false,
+      message: "Giờ bắt đầu và kết thúc phải khác nhau",
+    });
+    expect(quietHoursPatch(true, "", "06:00")).toEqual({
+      ok: false,
+      message: "Chọn giờ bắt đầu và giờ kết thúc",
+    });
+  });
+});
diff --git a/lib/rules/pushSelection.test.ts b/lib/rules/pushSelection.test.ts
index 45a08a8..cb82e25 100644
--- a/lib/rules/pushSelection.test.ts
+++ b/lib/rules/pushSelection.test.ts
@@ -17,6 +17,7 @@ function baby(over: Partial<BabyDispatchState> = {}): BabyDispatchState {
     feedIntervalMin: 180,
     lastFeed: { id: "L1", startedAt: minutesAgo(190) },
     breastRunningSince: null,
+    runningTimers: [],
     wake: null,
     vaccine: null,
     recipients: [{ userId: "u1", prefs: null }],
@@ -510,3 +511,142 @@ describe("selectDueNotifications — wake (spec §8.3)", () => {
     expect(due.map((d) => d.userId)).toEqual(["on"]);
   });
 });
+
+describe("selectDueNotifications — quiet hours and a sleeping baby (spec 2026-11-17 §4.3)", () => {
+  // `now` is 10:00 in VN; a quiet range of 09:00–11:00 covers it.
+  const quiet = {
+    feed_reminder: true,
+    wake_window: true,
+    vaccine: true,
+    snooze_until: null,
+    quiet_enabled: true,
+    quiet_start_min: 540,
+    quiet_end_min: 660,
+  };
+  const wakeDue = {
+    dob: "2026-09-14",
+    lastSleep: { id: "S1", endedAt: minutesAgo(200) },
+    sleepRunning: false,
+  };
+
+  it("holds feed and wake reminders during a recipient's quiet hours", () => {
+    const due = selectDueNotifications(
+      [
+        baby({
+          wake: wakeDue,
+          recipients: [
+            { userId: "quiet", prefs: quiet },
+            { userId: "off", prefs: { ...quiet, quiet_enabled: false } },
+            { userId: "none", prefs: null },
+          ],
+        }),
+      ],
+      now,
+    );
+    expect(due.map((d) => `${d.userId}:${d.kind}`)).toEqual([
+      "off:feed",
+      "none:feed",
+      "off:wake",
+      "none:wake",
+    ]);
+  });
+
+  it("sends the held reminder once quiet hours are over, with the same key", () => {
+    const after = new Date(now.getTime() + 61 * 60_000); // 11:01
+    const due = selectDueNotifications(
+      [baby({ recipients: [{ userId: "quiet", prefs: quiet }] })],
+      after,
+    );
+    expect(due.map((d) => d.refKey)).toEqual(["feed:L1"]);
+  });
+
+  it("does not hold vaccine reminders", () => {
+    const morning = new Date("2026-11-16T01:30:00Z"); // 08:30 in VN
+    const due = selectDueNotifications(
+      [
+        baby({
+          lastFeed: null,
+          vaccine: { dob: "2026-09-14", choices: {}, records: [] },
+          recipients: [
+            {
+              userId: "quiet",
+              prefs: { ...quiet, quiet_start_min: 480, quiet_end_min: 540 },
+            },
+          ],
+        }),
+      ],
+      morning,
+      [
+        {
+          code: "opv",
+          doseNo: 1,
+          name: "opv mũi 1",
+          protects: ["X"],
+          program: "dich_vu",
+          recommendedAgeDays: 64,
+          minAgeDays: 64,
+          source: "https://example.org",
+          reviewedAt: "2026-11-14",
+        },
+      ],
+    );
+    expect(due.map((d) => d.kind)).toEqual(["vaccine"]);
+  });
+
+  it("holds the feed reminder while the baby sleeps, only for who asked", () => {
+    const hold = {
+      ...quiet,
+      quiet_enabled: false,
+      hold_feed_while_asleep: true,
+    };
+    const sleeping = [
+      {
+        id: "S9",
+        type: "sleep" as const,
+        startedAt: minutesAgo(40),
+        side: null,
+      },
+    ];
+    const recipients = [
+      { userId: "hold", prefs: hold },
+      { userId: "plain", prefs: null },
+    ];
+    expect(
+      selectDueNotifications(
+        [baby({ runningTimers: sleeping, recipients })],
+        now,
+      ).map((d) => d.userId),
+    ).toEqual(["plain"]);
+    // The baby woke up: the reminder goes out on the next run.
+    expect(
+      selectDueNotifications([baby({ recipients })], now).map((d) => d.userId),
+    ).toEqual(["hold", "plain"]);
+  });
+
+  it("a sleep timer left running for 14 hours no longer holds the reminder", () => {
+    const hold = {
+      ...quiet,
+      quiet_enabled: false,
+      hold_feed_while_asleep: true,
+    };
+    const forgotten = [
+      {
+        id: "S9",
+        type: "sleep" as const,
+        startedAt: minutesAgo(840),
+        side: null,
+      },
+    ];
+    expect(
+      selectDueNotifications(
+        [
+          baby({
+            runningTimers: forgotten,
+            recipients: [{ userId: "hold", prefs: hold }],
+          }),
+        ],
+        now,
+      ).map((d) => d.userId),
+    ).toEqual(["hold"]);
+  });
+});
diff --git a/lib/server/dispatch.test.ts b/lib/server/dispatch.test.ts
index 362fce6..4cdc006 100644
--- a/lib/server/dispatch.test.ts
+++ b/lib/server/dispatch.test.ts
@@ -15,6 +15,7 @@ const dueBaby: BabyDispatchState = {
   feedIntervalMin: 180,
   lastFeed: { id: "L1", startedAt: "2026-11-14T23:00:00Z" }, // 4 hours ago
   breastRunningSince: null,
+  runningTimers: [],
   wake: null,
   vaccine: null,
   recipients: [{ userId: "u1", prefs: null }],
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run lib/rules/notifications.test.ts lib/rules/pushSelection.test.ts lib/server/dispatch.test.ts`
Expected: `Test Files  2 failed | 1 passed (3)`, `Tests  8 failed | 30 passed (38)`.

- [x] **Step 3: Viết code (Patch 4)**

Run: `kb_patch 4 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/lib/rules/notifications.ts b/lib/rules/notifications.ts
index 6914495..3f0f93c 100644
--- a/lib/rules/notifications.ts
+++ b/lib/rules/notifications.ts
@@ -31,3 +31,71 @@ export function snoozeText(until: string | null, now: Date): string | null {
   const [, month, date] = day.split("-");
   return `Đang tạm tắt nhắc đến ${time} ngày ${date}/${month}`;
 }
+
+// Spec 2026-11-17 §4.1 and §4.3: each user's quiet hours, in minutes after
+// 00:00 Vietnam time.
+export type QuietPrefs = {
+  quiet_enabled: boolean;
+  quiet_start_min: number;
+  quiet_end_min: number;
+};
+
+export const DEFAULT_QUIET: QuietPrefs = {
+  quiet_enabled: false,
+  quiet_start_min: 1320,
+  quiet_end_min: 360,
+};
+
+function vnMinuteOfDay(now: Date): number {
+  const [hours, minutes] = formatVnTime(now).split(":").map(Number);
+  return hours * 60 + minutes;
+}
+
+// Off when the switch is off or both ends are the same minute. A range whose
+// start is after its end runs across midnight.
+export function inQuietHours(prefs: QuietPrefs, now: Date): boolean {
+  const { quiet_enabled, quiet_start_min: start, quiet_end_min: end } = prefs;
+  if (!quiet_enabled || start === end) return false;
+  const m = vnMinuteOfDay(now);
+  return start < end ? m >= start && m < end : m >= start || m < end;
+}
+
+export function minutesToTime(minutes: number): string {
+  const pad = (n: number) => String(n).padStart(2, "0");
+  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
+}
+
+// Reads the value of an <input type="time">; null when it is not HH:mm.
+export function timeToMinutes(value: string): number | null {
+  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
+  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
+}
+
+// Spec §4.4: the value shown on the "Giờ yên lặng" row.
+export function quietHoursValue(prefs: QuietPrefs): string {
+  return prefs.quiet_enabled
+    ? `${minutesToTime(prefs.quiet_start_min)}–${minutesToTime(prefs.quiet_end_min)}`
+    : "Tắt";
+}
+
+// Spec §4.4: what the quiet-hours sheet saves, or why it cannot.
+export function quietHoursPatch(
+  enabled: boolean,
+  from: string,
+  to: string,
+): { ok: true; patch: QuietPrefs } | { ok: false; message: string } {
+  const start = timeToMinutes(from);
+  const end = timeToMinutes(to);
+  if (start === null || end === null)
+    return { ok: false, message: "Chọn giờ bắt đầu và giờ kết thúc" };
+  if (start === end)
+    return { ok: false, message: "Giờ bắt đầu và kết thúc phải khác nhau" };
+  return {
+    ok: true,
+    patch: {
+      quiet_enabled: enabled,
+      quiet_start_min: start,
+      quiet_end_min: end,
+    },
+  };
+}
diff --git a/lib/rules/pushSelection.ts b/lib/rules/pushSelection.ts
index cfb2d6d..08610f5 100644
--- a/lib/rules/pushSelection.ts
+++ b/lib/rules/pushSelection.ts
@@ -1,8 +1,10 @@
 import { VACCINES } from "@/lib/content/vaccines";
 import type { VaccineDose } from "@/lib/content/vaccineSchema";
 import { addDays, formatDayShort, WEEKDAYS } from "./days";
+import { DEFAULT_QUIET, inQuietHours } from "./notifications";
 import { FORGOTTEN_BREAST_MS } from "./ratings";
 import { ageDays, formatVnTime, vnDateString } from "./time";
+import { TIMER_LIMIT_MIN } from "./timer";
 import { buildSchedule, type DoseRecord } from "./vaccines";
 
 export type NotificationKind = "feed" | "wake" | "vaccine";
@@ -15,9 +17,25 @@ export type Recipient = {
     wake_window: boolean;
     vaccine: boolean;
     snooze_until: string | null;
+    // Spec 2026-11-17 §4.1. A missing field means its default there, the same
+    // rule as `prefs: null`.
+    medicine?: boolean;
+    timer_alert?: boolean;
+    quiet_enabled?: boolean;
+    quiet_start_min?: number;
+    quiet_end_min?: number;
+    hold_feed_while_asleep?: boolean;
   } | null;
 };
 
+// Spec 2026-11-17 §4.3: a timer that is running now.
+export type RunningTimer = {
+  id: string;
+  type: "breast" | "sleep" | "pump" | "tummy";
+  startedAt: string;
+  side: "left" | "right" | null;
+};
+
 export type BabyDispatchState = {
   babyId: string;
   feedIntervalMin: number;
@@ -25,6 +43,8 @@ export type BabyDispatchState = {
   lastFeed: { id: string; startedAt: string } | null;
   // started_at of the running breast timer, or null when none is running.
   breastRunningSince: string | null;
+  // Every running timer; empty when none runs.
+  runningTimers: RunningTimer[];
   // null: wake reminders are not evaluated for this baby.
   wake: {
     dob: string;
@@ -75,16 +95,44 @@ function notSnoozed(
   );
 }
 
-function wantsFeed(recipient: Recipient, now: Date): boolean {
+// Spec 2026-11-17 §4.3: inside this recipient's quiet hours. A reminder held
+// here is not claimed, so the next cron run after the range sends it.
+function isQuiet(prefs: NonNullable<Recipient["prefs"]>, now: Date): boolean {
+  return inQuietHours(
+    {
+      quiet_enabled: prefs.quiet_enabled ?? DEFAULT_QUIET.quiet_enabled,
+      quiet_start_min: prefs.quiet_start_min ?? DEFAULT_QUIET.quiet_start_min,
+      quiet_end_min: prefs.quiet_end_min ?? DEFAULT_QUIET.quiet_end_min,
+    },
+    now,
+  );
+}
+
+// A sleep timer under its limit; past it the timer counts as forgotten.
+function babyAsleep(baby: BabyDispatchState, now: Date): boolean {
+  const limit = TIMER_LIMIT_MIN.sleep * 60_000;
+  return baby.runningTimers.some(
+    (timer) =>
+      timer.type === "sleep" &&
+      now.getTime() - Date.parse(timer.startedAt) < limit,
+  );
+}
+
+function wantsFeed(recipient: Recipient, now: Date, asleep: boolean): boolean {
   const prefs = recipient.prefs;
   if (!prefs) return true;
-  return prefs.feed_reminder && notSnoozed(prefs, now);
+  return (
+    prefs.feed_reminder &&
+    notSnoozed(prefs, now) &&
+    !isQuiet(prefs, now) &&
+    !(asleep && (prefs.hold_feed_while_asleep ?? false))
+  );
 }
 
 function wantsWake(recipient: Recipient, now: Date): boolean {
   const prefs = recipient.prefs;
   if (!prefs) return true;
-  return prefs.wake_window && notSnoozed(prefs, now);
+  return prefs.wake_window && notSnoozed(prefs, now) && !isQuiet(prefs, now);
 }
 
 // Spec §8.3: W(ageDays), the awake time in minutes after which a reminder is due.
@@ -133,8 +181,9 @@ function feedReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
   if (since > RECENT_MS) return [];
   if (since < baby.feedIntervalMin * 60_000) return [];
   const body = `Cữ trước lúc ${formatVnTime(new Date(last.startedAt))} (${agoText(since)}).`;
+  const asleep = babyAsleep(baby, now);
   return baby.recipients
-    .filter((recipient) => wantsFeed(recipient, now))
+    .filter((recipient) => wantsFeed(recipient, now, asleep))
     .map((recipient) => ({
       userId: recipient.userId,
       kind: "feed",
diff --git a/lib/server/dispatchDeps.ts b/lib/server/dispatchDeps.ts
index ef01f42..0e1e182 100644
--- a/lib/server/dispatchDeps.ts
+++ b/lib/server/dispatchDeps.ts
@@ -1,11 +1,19 @@
 import webpush from "web-push";
-import type { BabyDispatchState } from "@/lib/rules/pushSelection";
+import type {
+  BabyDispatchState,
+  RunningTimer,
+} from "@/lib/rules/pushSelection";
 import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
 import type { DispatchDeps } from "./dispatch";
 import { pushEnv } from "./pushEnv";
 import { supabaseServiceRole } from "./supabaseServer";
 
 const TWELVE_HOURS_MS = 12 * 3_600_000;
+
+function sideOf(details: unknown): RunningTimer["side"] {
+  const side = (details as { side?: unknown } | null)?.side;
+  return side === "left" || side === "right" ? side : null;
+}
 const VACCINE_TTL_S = 12 * 3600;
 
 async function loadState(now: Date): Promise<BabyDispatchState[]> {
@@ -35,12 +43,12 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
         .gte("ended_at", since)
         .order("ended_at", { ascending: false })
         .limit(1),
-      // Running timers: at most one per type (unique index), so two rows at most.
+      // Running timers: at most one per type (unique index), so four rows at most.
       db
         .from("logs")
-        .select("type, started_at")
+        .select("id, type, started_at, details")
         .eq("baby_id", baby.id)
-        .in("type", ["breast", "sleep"])
+        .in("type", ["breast", "sleep", "pump", "tummy"])
         .is("ended_at", null),
       db
         .from("family_members")
@@ -62,7 +70,9 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
       db.from("push_subscriptions").select("user_id").in("user_id", userIds),
       db
         .from("notification_prefs")
-        .select("user_id, feed_reminder, wake_window, vaccine, snooze_until")
+        .select(
+          "user_id, feed_reminder, wake_window, vaccine, snooze_until, medicine, timer_alert, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep",
+        )
         .in("user_id", userIds),
     ]);
     if (subscribed.error) throw subscribed.error;
@@ -79,6 +89,12 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
       lastFeed: last ? { id: last.id, startedAt: last.started_at } : null,
       breastRunningSince:
         runningRows.find((r) => r.type === "breast")?.started_at ?? null,
+      runningTimers: runningRows.map((r): RunningTimer => ({
+        id: r.id,
+        type: r.type as RunningTimer["type"],
+        startedAt: r.started_at,
+        side: sideOf(r.details),
+      })),
       wake: {
         dob: baby.dob,
         lastSleep: lastSleep?.ended_at
@@ -103,6 +119,12 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
                   wake_window: row.wake_window,
                   vaccine: row.vaccine,
                   snooze_until: row.snooze_until,
+                  medicine: row.medicine,
+                  timer_alert: row.timer_alert,
+                  quiet_enabled: row.quiet_enabled,
+                  quiet_start_min: row.quiet_start_min,
+                  quiet_end_min: row.quiet_end_min,
+                  hold_feed_while_asleep: row.hold_feed_while_asleep,
                 }
               : null,
           };
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  143 passed (143)`, `Tests  877 passed (877)`.

- [x] **Step 5: Commit**

```bash
git add lib/rules/notifications.test.ts lib/rules/pushSelection.test.ts lib/server/dispatch.test.ts lib/rules/notifications.ts lib/rules/pushSelection.ts lib/server/dispatchDeps.ts
git commit -m "feat(push): quiet hours and hold-while-asleep for feed and wake reminders" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 3: Cài đặt › Thông báo: công tắc mới, "bé đang ngủ", giờ yên lặng (§4.4)

**Files:**

- Modify: `lib/rules/notifications.ts` (`PrefKey`, `PREF_OPTIONS`), `lib/data/notificationPrefs.ts`, `components/settings/NotificationsGroup.tsx`
- Test: `lib/rules/notifications.test.ts`, `components/settings/notifications.test.tsx`

**Interfaces:**

- Consumes: `QuietPrefs`, `DEFAULT_QUIET`, `minutesToTime`, `quietHoursPatch`, `quietHoursValue` (Task 2); các cột mới (Task 1); `ListRow`, `Switch`, `Sheet`, `Button`, `FIELD_INPUT`, `FIELD_LABEL`.
- Produces: `PrefKey` 5 giá trị, `PREF_OPTIONS` 5 mục; `NotificationPrefs` / `DEFAULT_PREFS` có `medicine`, `timer_alert`, `quiet_enabled`, `quiet_start_min`, `quiet_end_min`, `hold_feed_while_asleep`; `NotificationsGroupView` nhận thêm `holdFeed: boolean`, `quiet: string`, `onToggleHold: (value: boolean) => void`, `onOpenQuiet: () => void`; `QuietHoursSheet({ value: QuietPrefs, busy: boolean, onClose, onSave: (patch: QuietPrefs) => void })`; `SNOOZE_HINT`.

Thứ tự hàng sau task này: trạng thái máy; 5 công tắc; "Không nhắc bú khi bé đang ngủ" kèm ghi chú; "Giờ yên lặng"; "Tạm tắt nhắc". Hàng "Lịch nhắc thuốc" là của M4.

- [x] **Step 1: Viết test hỏng (Patch 5)**

Run: `kb_patch 5 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/components/settings/notifications.test.tsx b/components/settings/notifications.test.tsx
index a1d5ead..f7d96d2 100644
--- a/components/settings/notifications.test.tsx
+++ b/components/settings/notifications.test.tsx
@@ -2,36 +2,58 @@ import { renderToStaticMarkup } from "react-dom/server";
 import { describe, expect, it, vi } from "vitest";
 import { findElements } from "@/components/ui/testTree";
 import { ICON_PATHS } from "@/lib/ui/icons";
-import { NotificationsGroupView, SnoozeSheet } from "./NotificationsGroup";
+import {
+  NotificationsGroupView,
+  QuietHoursSheet,
+  SNOOZE_HINT,
+  SnoozeSheet,
+} from "./NotificationsGroup";
 
-const prefs = { feed_reminder: true, wake_window: false, vaccine: true };
+const prefs = {
+  feed_reminder: true,
+  wake_window: false,
+  vaccine: true,
+  medicine: true,
+  timer_alert: false,
+};
 const view = (
   overrides: Partial<Parameters<typeof NotificationsGroupView>[0]> = {},
 ) => ({
   prefs,
+  holdFeed: false,
+  quiet: "Tắt",
   disabled: false,
   snooze: "Không",
   device: <p>Thiết bị</p>,
   onToggle: () => {},
+  onToggleHold: () => {},
+  onOpenQuiet: () => {},
   onOpenSnooze: () => {},
   ...overrides,
 });
 
 describe("NotificationsGroupView", () => {
-  it("lists the device control, three switches and the snooze row", () => {
+  it("lists the device control, six switches, quiet hours and the snooze row", () => {
     const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
     expect(html).toContain(">Thông báo</h2>");
     expect(html).toContain("<p>Thiết bị</p>");
-    expect(html.match(/role="switch"/g)).toHaveLength(3);
+    expect(html.match(/role="switch"/g)).toHaveLength(6);
     expect(html.match(/aria-checked="(true|false)"/g)).toEqual([
       'aria-checked="true"',
       'aria-checked="false"',
       'aria-checked="true"',
+      'aria-checked="true"',
+      'aria-checked="false"',
+      'aria-checked="false"',
     ]);
     for (const label of [
       "Nhắc cữ bú",
       "Nhắc khi bé thức quá lâu",
       "Nhắc lịch tiêm",
+      "Nhắc thuốc",
+      "Nhắc timer chạy quá lâu",
+      "Không nhắc bú khi bé đang ngủ",
+      "Giờ yên lặng",
       "Tạm tắt nhắc",
     ])
       expect(html).toContain(`>${label}</span>`);
@@ -47,7 +69,7 @@ describe("NotificationsGroupView", () => {
       NotificationsGroupView(view({ onToggle })),
       (el) => el.props.checked !== undefined,
     );
-    expect(switches).toHaveLength(3);
+    expect(switches).toHaveLength(6);
     (switches[1].props.onChange as (v: boolean) => void)(true);
     expect(onToggle).toHaveBeenCalledWith("wake_window", true);
   });
@@ -68,6 +90,105 @@ describe("NotificationsGroupView", () => {
   });
 });
 
+describe("NotificationsGroupView — spec 2026-11-17 §4.4", () => {
+  it("keeps the rows in the spec's order", () => {
+    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
+    const order = [
+      "Nhắc cữ bú",
+      "Nhắc khi bé thức quá lâu",
+      "Nhắc lịch tiêm",
+      "Nhắc thuốc",
+      "Nhắc timer chạy quá lâu",
+      "Không nhắc bú khi bé đang ngủ",
+      "Giờ yên lặng",
+      "Tạm tắt nhắc",
+    ].map((label) => html.indexOf(`>${label}</span>`));
+    expect(order.every((at) => at >= 0)).toBe(true);
+    expect([...order].sort((a, b) => a - b)).toEqual(order);
+    expect(html).toContain(`d="${ICON_PATHS.pill}"`);
+    expect(html).toContain(`d="${ICON_PATHS.clock}"`);
+    expect(html).toContain(`d="${ICON_PATHS.bottle}"`);
+    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
+  });
+
+  it("the hold switch carries the newborn note and saves its own value", () => {
+    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
+    expect(html).toContain(
+      "Bé sơ sinh những tuần đầu thường cần đánh thức để bú. Hỏi bác sĩ trước khi bật.",
+    );
+    const onToggleHold = vi.fn();
+    const onToggle = vi.fn();
+    const switches = findElements(
+      NotificationsGroupView(view({ onToggleHold, onToggle })),
+      (el) => el.props.checked !== undefined,
+    );
+    expect(switches[5].props.label).toBe("Không nhắc bú khi bé đang ngủ");
+    (switches[5].props.onChange as (v: boolean) => void)(true);
+    expect(onToggleHold).toHaveBeenCalledWith(true);
+    expect(onToggle).not.toHaveBeenCalled();
+    (switches[3].props.onChange as (v: boolean) => void)(false);
+    expect(onToggle).toHaveBeenCalledWith("medicine", false);
+  });
+
+  it("the quiet-hours row shows its value and opens the sheet, unless disabled", () => {
+    const html = renderToStaticMarkup(
+      <NotificationsGroupView {...view({ quiet: "22:00–06:00" })} />,
+    );
+    expect(html).toContain(">22:00–06:00</span>");
+    const onOpenQuiet = vi.fn();
+    const [row] = findElements(
+      NotificationsGroupView(view({ onOpenQuiet })),
+      (el) => el.props.label === "Giờ yên lặng",
+    );
+    (row.props.onClick as () => void)();
+    expect(onOpenQuiet).toHaveBeenCalledOnce();
+    const [locked] = findElements(
+      NotificationsGroupView(view({ disabled: true })),
+      (el) => el.props.label === "Giờ yên lặng",
+    );
+    expect(locked.props.onClick).toBeUndefined();
+  });
+
+  it("the snooze hint names the four reminders it pauses", () => {
+    expect(SNOOZE_HINT).toBe(
+      "Tạm tắt nhắc bú, nhắc thức, nhắc thuốc và nhắc timer trên mọi máy của bạn. Nhắc tiêm vẫn gửi.",
+    );
+  });
+});
+
+describe("QuietHoursSheet", () => {
+  it("shows the switch, both times, the three notes and Lưu", () => {
+    const html = renderToStaticMarkup(
+      <QuietHoursSheet
+        value={{
+          quiet_enabled: true,
+          quiet_start_min: 1320,
+          quiet_end_min: 360,
+        }}
+        busy={false}
+        onClose={() => {}}
+        onSave={() => {}}
+      />,
+    );
+    expect(html).toContain(">Giờ yên lặng</h2>");
+    expect(html).toContain('aria-label="Bật giờ yên lặng"');
+    expect(html).toMatch(/role="switch"[^>]*aria-checked="true"/);
+    expect(html.match(/type="time"/g)).toHaveLength(2);
+    expect(html).toContain('value="22:00"');
+    expect(html).toContain('value="06:00"');
+    expect(html).toContain(">Từ</label>");
+    expect(html).toContain(">Đến</label>");
+    expect(html).toContain(
+      "nhắc bú, nhắc thức, nhắc thuốc hằng ngày, nhắc timer.",
+    );
+    expect(html).toContain("nhắc tiêm và nhắc sau liều hạ sốt.");
+    expect(html).toContain(
+      "Hết giờ yên lặng mà vẫn quá giờ bú thì nhắc ngay lúc đó.",
+    );
+    expect(html).toContain(">Lưu</button>");
+  });
+});
+
 describe("SnoozeSheet", () => {
   it("offers 2, 4 and 8 hours and explains the current state", () => {
     const html = renderToStaticMarkup(
diff --git a/lib/rules/notifications.test.ts b/lib/rules/notifications.test.ts
index 32e7b33..23be7a8 100644
--- a/lib/rules/notifications.test.ts
+++ b/lib/rules/notifications.test.ts
@@ -2,6 +2,7 @@ import { describe, expect, it } from "vitest";
 import {
   inQuietHours,
   minutesToTime,
+  PREF_OPTIONS,
   quietHoursPatch,
   quietHoursValue,
   snoozeText,
@@ -117,3 +118,15 @@ describe("quiet hours (spec 2026-11-17 §4.3)", () => {
     });
   });
 });
+
+describe("PREF_OPTIONS (spec 2026-11-17 §4.4)", () => {
+  it("lists five switches, the two new ones last", () => {
+    expect(PREF_OPTIONS.map((o) => [o.key, o.label])).toEqual([
+      ["feed_reminder", "Nhắc cữ bú"],
+      ["wake_window", "Nhắc khi bé thức quá lâu"],
+      ["vaccine", "Nhắc lịch tiêm"],
+      ["medicine", "Nhắc thuốc"],
+      ["timer_alert", "Nhắc timer chạy quá lâu"],
+    ]);
+  });
+});
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run lib/rules/notifications.test.ts components/settings/notifications.test.tsx`
Expected: `Test Files  2 failed (2)`, `Tests  8 failed | 12 passed (20)`.

- [x] **Step 3: Viết code (Patch 6)**

Run: `kb_patch 6 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/components/settings/NotificationsGroup.tsx b/components/settings/NotificationsGroup.tsx
index 64de552..b1d3b65 100644
--- a/components/settings/NotificationsGroup.tsx
+++ b/components/settings/NotificationsGroup.tsx
@@ -4,6 +4,7 @@ import { useState, type ReactNode } from "react";
 import { DevicePushControl } from "@/components/push/DevicePushControl";
 import { Button } from "@/components/ui/Button";
 import { ListGroup, ListRow } from "@/components/ui/ListGroup";
+import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
 import { Sheet } from "@/components/ui/Sheet";
 import { Switch } from "@/components/ui/Switch";
 import { toVietnameseError } from "@/lib/data/errors";
@@ -14,11 +15,15 @@ import {
 } from "@/lib/data/notificationPrefs";
 import { useNow } from "@/lib/hooks/useNow";
 import {
+  minutesToTime,
   PREF_OPTIONS,
+  quietHoursPatch,
+  quietHoursValue,
   SNOOZE_HOURS,
   snoozeText,
   snoozeUntil,
   type PrefKey,
+  type QuietPrefs,
 } from "@/lib/rules/notifications";
 import { snoozeValue } from "@/lib/rules/settingsText";
 import type { IconName } from "@/lib/ui/icons";
@@ -27,24 +32,40 @@ const PREF_ICON: Record<PrefKey, IconName> = {
   feed_reminder: "bell",
   wake_window: "sun",
   vaccine: "syringe",
+  medicine: "pill",
+  timer_alert: "clock",
 };
 
-const SNOOZE_HINT =
-  "Tạm tắt nhắc bú và nhắc thức trên mọi máy của bạn. Nhắc tiêm vẫn gửi.";
+export const SNOOZE_HINT =
+  "Tạm tắt nhắc bú, nhắc thức, nhắc thuốc và nhắc timer trên mọi máy của bạn. Nhắc tiêm vẫn gửi.";
+
+// Spec 2026-11-17 §4.4: this switch never appears without its note.
+const HOLD_FEED_LABEL = "Không nhắc bú khi bé đang ngủ";
+const HOLD_FEED_NOTE =
+  "Bé sơ sinh những tuần đầu thường cần đánh thức để bú. Hỏi bác sĩ trước khi bật.";
 
 export function NotificationsGroupView({
   prefs,
+  holdFeed,
+  quiet,
   disabled,
   snooze,
   device,
   onToggle,
+  onToggleHold,
+  onOpenQuiet,
   onOpenSnooze,
 }: {
   prefs: Record<PrefKey, boolean>;
+  holdFeed: boolean;
+  // "Tắt" or "HH:mm–HH:mm".
+  quiet: string;
   disabled: boolean;
   snooze: string;
   device: ReactNode;
   onToggle: (key: PrefKey, value: boolean) => void;
+  onToggleHold: (value: boolean) => void;
+  onOpenQuiet: () => void;
   onOpenSnooze: () => void;
 }) {
   return (
@@ -66,6 +87,28 @@ export function NotificationsGroupView({
           }
         />
       ))}
+      <ListRow
+        label={HOLD_FEED_LABEL}
+        detail={HOLD_FEED_NOTE}
+        icon="bottle"
+        iconColor="cat-diaper"
+        trailing={
+          <Switch
+            checked={holdFeed}
+            label={HOLD_FEED_LABEL}
+            disabled={disabled}
+            onChange={onToggleHold}
+          />
+        }
+      />
+      <ListRow
+        label="Giờ yên lặng"
+        icon="moon"
+        iconColor="cat-diaper"
+        value={quiet}
+        onClick={disabled ? undefined : onOpenQuiet}
+        chevron={!disabled}
+      />
       <ListRow
         label="Tạm tắt nhắc"
         icon="pause"
@@ -78,6 +121,104 @@ export function NotificationsGroupView({
   );
 }
 
+// Spec 2026-11-17 §4.4. Mounted only while open, so it starts from the saved value.
+export function QuietHoursSheet({
+  value,
+  busy,
+  onClose,
+  onSave,
+}: {
+  value: QuietPrefs;
+  busy: boolean;
+  onClose: () => void;
+  onSave: (patch: QuietPrefs) => void;
+}) {
+  const [enabled, setEnabled] = useState(value.quiet_enabled);
+  const [from, setFrom] = useState(minutesToTime(value.quiet_start_min));
+  const [to, setTo] = useState(minutesToTime(value.quiet_end_min));
+  const [message, setMessage] = useState<string | null>(null);
+
+  function save() {
+    const built = quietHoursPatch(enabled, from, to);
+    if (!built.ok) {
+      setMessage(built.message);
+      return;
+    }
+    setMessage(null);
+    onSave(built.patch);
+  }
+
+  return (
+    <Sheet
+      open
+      onClose={onClose}
+      title="Giờ yên lặng"
+      footer={
+        <div className="flex flex-col gap-2">
+          {message && (
+            <p role="alert" className="text-[15px] text-danger">
+              {message}
+            </p>
+          )}
+          <Button block busy={busy} className="min-h-14!" onClick={save}>
+            Lưu
+          </Button>
+        </div>
+      }
+    >
+      <div className="flex flex-col gap-5 pt-1">
+        <div className="flex min-h-11 items-center gap-3">
+          <span className="flex-1 text-base font-semibold text-ink">
+            Bật giờ yên lặng
+          </span>
+          <Switch
+            checked={enabled}
+            label="Bật giờ yên lặng"
+            onChange={setEnabled}
+          />
+        </div>
+        <div className="grid grid-cols-2 gap-3">
+          <div className="flex flex-col gap-2">
+            <label htmlFor="quiet-from" className={FIELD_LABEL}>
+              Từ
+            </label>
+            <input
+              id="quiet-from"
+              type="time"
+              className={FIELD_INPUT}
+              value={from}
+              onChange={(event) => setFrom(event.target.value)}
+            />
+          </div>
+          <div className="flex flex-col gap-2">
+            <label htmlFor="quiet-to" className={FIELD_LABEL}>
+              Đến
+            </label>
+            <input
+              id="quiet-to"
+              type="time"
+              className={FIELD_INPUT}
+              value={to}
+              onChange={(event) => setTo(event.target.value)}
+            />
+          </div>
+        </div>
+        <div className="glass flex flex-col gap-2 rounded-[16px] p-3 text-[13px] leading-[18px] text-muted">
+          <p>
+            <strong className="text-ink">Không gửi:</strong> nhắc bú, nhắc thức,
+            nhắc thuốc hằng ngày, nhắc timer.
+          </p>
+          <p>
+            <strong className="text-ink">Vẫn gửi:</strong> nhắc tiêm và nhắc sau
+            liều hạ sốt.
+          </p>
+          <p>Hết giờ yên lặng mà vẫn quá giờ bú thì nhắc ngay lúc đó.</p>
+        </div>
+      </div>
+    </Sheet>
+  );
+}
+
 export function SnoozeSheet({
   open,
   onClose,
@@ -130,18 +271,33 @@ export function NotificationsGroup({ userId }: { userId: string }) {
   const prefs = useNotificationPrefs(userId);
   const save = useSavePrefs(userId);
   const [open, setOpen] = useState(false);
+  const [quietOpen, setQuietOpen] = useState(false);
   const values = prefs.data ?? DEFAULT_PREFS;
   const paused = snoozeText(values.snooze_until, now);
   return (
     <>
       <NotificationsGroupView
         prefs={values}
+        holdFeed={values.hold_feed_while_asleep}
+        quiet={quietHoursValue(values)}
         disabled={!prefs.isSuccess || save.isPending}
         snooze={snoozeValue(values.snooze_until, now)}
         device={<DevicePushControl />}
         onToggle={(key, value) => save.mutate({ [key]: value })}
+        onToggleHold={(value) => save.mutate({ hold_feed_while_asleep: value })}
+        onOpenQuiet={() => setQuietOpen(true)}
         onOpenSnooze={() => setOpen(true)}
       />
+      {quietOpen && (
+        <QuietHoursSheet
+          value={values}
+          busy={save.isPending}
+          onClose={() => setQuietOpen(false)}
+          onSave={(patch) =>
+            save.mutate(patch, { onSuccess: () => setQuietOpen(false) })
+          }
+        />
+      )}
       <SnoozeSheet
         open={open}
         onClose={() => setOpen(false)}
diff --git a/lib/data/notificationPrefs.ts b/lib/data/notificationPrefs.ts
index 3a8c6de..fb9b7ed 100644
--- a/lib/data/notificationPrefs.ts
+++ b/lib/data/notificationPrefs.ts
@@ -1,19 +1,30 @@
 "use client";
 
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
-import type { PrefKey } from "@/lib/rules/notifications";
+import {
+  DEFAULT_QUIET,
+  type PrefKey,
+  type QuietPrefs,
+} from "@/lib/rules/notifications";
 import { supabase } from "@/lib/supabase/client";
 import { PermissionDeniedError } from "./errors";
 
-export type NotificationPrefs = Record<PrefKey, boolean> & {
-  snooze_until: string | null;
-};
+export type NotificationPrefs = Record<PrefKey, boolean> &
+  QuietPrefs & {
+    hold_feed_while_asleep: boolean;
+    snooze_until: string | null;
+  };
 
 // Spec §5.2: no row means every switch is on and nothing is snoozed.
 export const DEFAULT_PREFS: NotificationPrefs = {
   feed_reminder: true,
   wake_window: true,
   vaccine: true,
+  // Spec 2026-11-17 §4.1: the column defaults.
+  medicine: true,
+  timer_alert: true,
+  ...DEFAULT_QUIET,
+  hold_feed_while_asleep: false,
   snooze_until: null,
 };
 
@@ -22,7 +33,9 @@ const prefsKey = (userId: string) => ["notification-prefs", userId] as const;
 export async function fetchPrefs(userId: string): Promise<NotificationPrefs> {
   const { data, error } = await supabase()
     .from("notification_prefs")
-    .select("feed_reminder, wake_window, vaccine, snooze_until")
+    .select(
+      "feed_reminder, wake_window, vaccine, snooze_until, medicine, timer_alert, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep",
+    )
     .eq("user_id", userId)
     .maybeSingle();
   if (error) throw error;
diff --git a/lib/rules/notifications.ts b/lib/rules/notifications.ts
index 3f0f93c..6ac4a84 100644
--- a/lib/rules/notifications.ts
+++ b/lib/rules/notifications.ts
@@ -3,7 +3,8 @@ import { formatVnTime, vnDateString } from "./time";
 
 export const SNOOZE_HOURS = [2, 4, 8] as const;
 
-export type PrefKey = "feed_reminder" | "wake_window" | "vaccine";
+export type PrefKey =
+  "feed_reminder" | "wake_window" | "vaccine" | "medicine" | "timer_alert";
 
 export const PREF_OPTIONS: {
   key: PrefKey;
@@ -13,6 +14,9 @@ export const PREF_OPTIONS: {
   { key: "feed_reminder", label: "Nhắc cữ bú", note: null },
   { key: "wake_window", label: "Nhắc khi bé thức quá lâu", note: null },
   { key: "vaccine", label: "Nhắc lịch tiêm", note: null },
+  // Spec 2026-11-17 §4.4.
+  { key: "medicine", label: "Nhắc thuốc", note: null },
+  { key: "timer_alert", label: "Nhắc timer chạy quá lâu", note: null },
 ];
 
 export function snoozeUntil(now: Date, hours: number): string {
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  143 passed (143)`, `Tests  883 passed (883)`.

- [x] **Step 5: Commit**

```bash
git add components/settings/notifications.test.tsx lib/rules/notifications.test.ts components/settings/NotificationsGroup.tsx lib/data/notificationPrefs.ts lib/rules/notifications.ts
git commit -m "feat(settings): medicine and timer switches, hold-while-asleep and quiet hours" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 4: Kiểm cuối M3

**Files:**

- Modify: `docs/blueprint/plans/2026-11-17-kim-bun-yen-lang-m3.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ Task 1–3 tạo ra.
- Produces: nhánh `feat/kim-bun-yen-lang-m3` sẵn sàng làm nền cho M4. Nhánh này không lên `main` trước khi M4 xong.

- [x] **Step 1: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  143 passed (143)`, `Tests  883 passed (883)`.

- [x] **Step 2: Build production**

Run: `bun run build`
Expected: lần đầu dừng với `SecurityFatalError` của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

> **Kết quả 2026-11-17 (Task 1–3, Task 4 Step 1–2).** Trên nhánh `feat/kim-bun-yen-lang-m3`: cả 6 patch áp sạch. pgTAP trên Supabase local: 013 đỏ với `Bad plan.  You planned 16 tests but ran 0.`, sau `db:reset` thì `Files=13, Tests=135`, `Result: PASS`; `db:types` cho ra đúng nội dung của patch. Vitest đỏ ở Task 2 và 3 đúng như ghi (8/38 và 8/20); cuối cùng `tsc --noEmit` sạch, `143 passed (143)` file, `883 passed (883)` test. `bun run build` dừng lần đầu với `SecurityFatalError`, lần hai `✓ Generating static pages (37/37)`, thoát mã 0.

- [ ] **Step 3: Kiểm trên trình duyệt (phiên chính làm, không gạt công tắc, không bấm Lưu)**

Bước này do **phiên chính** làm, bằng trình duyệt có sẵn trong app Claude, và cần người dùng đồng ý trước mỗi lần. Người thực thi là subagent thì để ô này chưa tick.

App dev nối vào Supabase thật của gia đình, và **chỉ kiểm được sau khi Task 1 Step 6 đã xong** (trang đọc 6 cột mới; thiếu migration thì nhóm Thông báo báo lỗi tải). Trong cả bước này:

- Không gạt công tắc nào trong nhóm Thông báo: mỗi lần gạt là ghi thẳng vào DB.
- Trong sheet "Giờ yên lặng" được gạt công tắc và đổi giờ để xem, nhưng **không bấm Lưu**; đóng bằng X.
- Không bấm "Tạm tắt nhắc" › 2/4/8 giờ, không bấm Đăng xuất, không đụng nhóm khác của Cài đặt.

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Mở `http://localhost:3000/cai-dat` ở cỡ 375×812.

1. Nhóm Thông báo có, từ trên xuống: trạng thái máy; "Nhắc cữ bú", "Nhắc khi bé thức quá lâu", "Nhắc lịch tiêm", "Nhắc thuốc", "Nhắc timer chạy quá lâu"; "Không nhắc bú khi bé đang ngủ" với dòng "Bé sơ sinh những tuần đầu thường cần đánh thức để bú. Hỏi bác sĩ trước khi bật."; "Giờ yên lặng" với giá trị `Tắt` (hoặc hai giờ nếu đã bật); "Tạm tắt nhắc". Không có lỗi tải.
2. Bấm "Giờ yên lặng": sheet có công tắc "Bật giờ yên lặng", hai ô giờ "Từ" 22:00 và "Đến" 06:00 đặt cạnh nhau, khối ba dòng chú thích, nút Lưu. Đóng bằng X, không lưu.
3. Chạy bằng javascript tool: `document.documentElement.scrollWidth <= window.innerWidth` ở trang, và khi sheet mở thì thêm `(() => { const el = document.querySelector("dialog[open] .overflow-y-auto"); return el ? el.scrollWidth <= el.clientWidth : "không tìm thấy thân sheet"; })()`. Kỳ vọng `true`.
4. Lặp lại mục 1–2 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`. Kỳ vọng: chữ và icon đọc rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này.

- [ ] **Step 4: Commit phần ghi kết quả, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-17-kim-bun-yen-lang-m3.md
git commit -m "docs(plan): record the M3 check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: nhánh và `git log --oneline main..HEAD`; kết quả typecheck, vitest, pgTAP, build; migration đã áp lên project thật chưa; mục nào của Step 3 đã thấy tận mắt. Nhắc lại: nhánh này chờ M4, chưa lên `main`.
