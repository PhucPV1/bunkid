# Kim Bun — Đợt ốm M5a: bảng illness_visits và photos.visit_id Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§8.1; `018_illness_visits.test.sql` của §10.2)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** DB có bảng `illness_visits` (lần khám của một đợt ốm) và cột `photos.visit_id`, đã áp lên Supabase thật; app có kiểu `VisitRow`. Chưa có gì mới trên màn hình.

**Architecture:**

- **DB:** một migration theo đúng §8.1: bảng mới với ba ràng buộc độ dài chữ, khóa ngoại kép `(episode_id, baby_id)` sang `illness_episodes` (không cascade: còn lần khám thì không xóa được đợt), cột `photos.visit_id` với khóa ngoại kép `(visit_id, baby_id)` (không cascade: còn ảnh thì không xóa được lần khám), hai index, hai trigger, bốn policy; trigger `photos_immutable` được tạo lại để thêm `visit_id`. Có test pgTAP riêng.
- **Kiểu:** `lib/supabase/types.ts` sinh lại bằng `bun run db:types`; `lib/supabase/rows.ts` thêm `VisitRow`.
- Plan này đứng đầu M5 để migration lên Supabase thật trước mọi code đọc hay ghi bảng mới.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Supabase (Postgres, RLS, pgTAP), TypeScript 5.9.3 `strict`, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m5a`, cắt từ `main` sau khi M4c đã lên. Baseline: 1981 test (208 file) vitest xanh, typecheck sạch, pgTAP 001–017 (17 file, 194 test).

**Các mốc của spec này:**

| Mốc      | Nội dung                                                                                                   | Plan                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| M1a, M1b | §3: bản ghi Triệu chứng                                                                                    | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md`, `…-m1b.md` (đã ở `main`)  |
| M2a–M2g  | §4, §5.1–5.3, §5.7, §6: đợt ốm, hai trang, lối vào ở Sức khỏe                                              | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md` … `…-m2g.md` (đã ở `main`) |
| M3a, M3b | §5.5, §5.6, §7: tab Hôm nay                                                                                | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3a.md`, `…-m3b.md` (đã ở `main`)  |
| M4a–M4c  | §5.4, §9: so sánh và Báo cáo                                                                               | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4a.md` … `…-m4c.md`               |
| M5a      | §8.1: migration `20261126000300_illness_visits.sql`, pgTAP 018, kiểu `VisitRow`; áp lên Supabase thật      | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5a.md`                            |
| M5b      | §8.2 và phần luật của §8.4, §6.4: `useVisits`, `useVisitActions`, `lib/rules/visits.ts`                    | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5b.md`                            |
| M5c      | §8.4: sheet "Lần khám". Chỉ thấy trên trang tạm                                                            | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5c.md`                            |
| M5d      | §8.3, §6.3 mục 6, §6.4 từ M5: thẻ "Lần khám" trên trang chi tiết, luật tắt "Xóa đợt ốm"; Bước 38 mục 29–33 | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5d.md`                            |
| M5e      | §6.5 và §9 từ M5: vạch "Khám" trên biểu đồ, bảng "Lần khám" của Báo cáo; Bước 38 mục 34–35                 | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5e.md`                            |

Chạy theo thứ tự M5a → M5b → M5c → M5d → M5e, mỗi plan một phiên, mỗi plan lên `main` riêng. Chỉ M5a có migration; bốn plan sau cần migration đó đã áp lên Supabase thật (M5a không lên `main` được trước lúc đó).

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Mốc M5 cắt làm năm plan** (bảng trên): một plan sẽ dài gần 5.000 dòng. Sau mỗi plan app vẫn chạy và đẩy lên `main` được riêng. Migration và RLS nằm ở plan đầu (plan này) để lên Supabase thật trước mọi code dùng chúng.
2. **Migration đúng như §8.1.** Tên hai index là `illness_visits_episode_idx` và `photos_visit_idx`. Postgres không sửa được tham số của một trigger, nên `photos_immutable` bị xóa rồi tạo lại với thêm `'visit_id'`, trong cùng giao dịch của migration.
3. **`visit_id` không sửa được, kể cả từ `null`:** một ảnh của trang Ảnh không gắn được vào lần khám về sau, ảnh đơn thuốc luôn được tải lên kèm `visit_id` ngay từ đầu (§8.2).
4. **Bảng không nằm trong realtime**, như `illness_episodes` (§4.1); spec không nói gì về realtime của lần khám.
5. **pgTAP có thêm các kiểm ngoài danh sách của §10.2:** ba ràng buộc độ dài (ô trống, quá dài), thành viên sửa được lần khám của chủ gia đình, bảng không nằm trong realtime, hai index, và xóa ảnh trước thì xóa được lần khám. Kiểm "`updated_at` đổi khi sửa" không có: trong một giao dịch `now()` không đổi, nên không đo được bằng pgTAP.
6. **Áp migration lên Supabase thật.** Global Constraints (chép nguyên văn spec) ghi plan dừng lại cho người dùng tự chạy. Theo lời đồng ý trước ngày 2026-11-26, phiên thực thi tự chạy `--dry-run`, và chỉ khi nó liệt kê đúng một migration mong đợi thì tự chạy `db push`; bị chặn hoặc bị hỏi mật khẩu thì quay về đúng cách của spec: đưa lệnh cho người dùng (Task 2 Step 4). Lần M2a lệnh đẩy bị bộ kiểm quyền chặn và người dùng đã tự chạy.
7. **Không có bước trình duyệt.** Plan này không đổi gì trên màn hình; kiểm bằng pgTAP, typecheck, vitest và build.

## Global Constraints

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

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 2** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 2 patch đã được áp lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `864a3ea` cộng 18 patch của M4a, M4b, M4c trích từ ba file plan đó (nền tạm trong lúc M4 chưa lên `main`); bản sao dùng `node_modules` của repo qua một bản chép, không nằm trong patch nào. pgTAP đã chạy đỏ rồi xanh trên Supabase local; `bun run db:types` sinh đúng phần `types.ts` của Patch 2; `tsc --noEmit` sạch; vitest và build như ghi ở Task 2. Chưa chạy: `supabase db push` lên DB thật.
- **Đo lại trên `main` thật.** Sau khi M4c lên, `main` @ `88caf0b` (cây code trùng khít nền tạm ở trên, chỉ khác các file plan) được chép ra một bản sao sạch; mọi patch của M5 trích từ chính các file plan được áp lần lượt lên đó và đo lại: vitest 208/1981 không đổi sau hai patch; pgTAP đỏ `Files=18, Tests=210` FAIL, xanh `Files=18, Tests=234` PASS; `bun run db:types` không đổi `types.ts`; build 42/42. Cây cuối trùng bản chạy thử.
- **pgTAP cần Docker.** Trên máy này Docker là OrbStack và mặc định không chạy: `open -a OrbStack`, chờ `docker info` trả về, rồi mới `bun run db:start`. Volume của Supabase local dùng chung cho mọi bản sao của repo (project id `bun-kid`), nên bước đỏ phải chạy `bun run db:reset` trước. Xong thì `bunx supabase stop` và tắt OrbStack nếu chính phiên này đã bật nó.
- **Không chạy prettier lên `lib/supabase/types.ts`.** File đó là đầu ra nguyên dạng của `bun run db:types`.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **`bun run build`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Các file plan chưa chạy chưa được commit.** `git status` có thể thấy các file plan khác là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện migration đã áp, mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng đầu M5 và sau M4c. M5b–M5e dùng bảng và kiểu dưới mục Produces.

**Consumes (M2a):** bảng `public.illness_episodes` với `unique (id, baby_id)`; pgTAP 017.

**Consumes (đã ở `main` từ trước):** bảng `public.photos`, trigger `photos_immutable`, các hàm SQL `set_updated_at`, `forbid_immutable_change`, `is_member`, `is_owner`, `baby_family`; `lib/supabase/rows.ts`.

**Produces:**

- Migration `supabase/migrations/20261126000300_illness_visits.sql`: bảng `public.illness_visits (id uuid, episode_id uuid, baby_id uuid, visited_at timestamptz, place text null, conclusion text null, advice text null, created_by uuid, created_at, updated_at)`; khóa ngoại `(episode_id, baby_id)` → `illness_episodes (id, baby_id)` và `(visit_id, baby_id)` của `photos` → `illness_visits (id, baby_id)`, cả hai không cascade (xóa bị từ chối với mã `23503`); RLS: mọi thành viên đọc, thêm (với `created_by = auth.uid()`), sửa; chủ gia đình hoặc người tạo xóa; `episode_id`, `baby_id`, `created_by`, `id` và `photos.visit_id` không sửa được (mã `P0001`).
- `lib/supabase/rows.ts`: `VisitRow` = `{ id: string; episode_id: string; baby_id: string; visited_at: string; place: string | null; conclusion: string | null; advice: string | null; created_by: string; created_at: string; updated_at: string }`; `PhotoRow` có thêm `visit_id: string | null`.
- Supabase thật đã có migration này.
- **Vitest sau M5a:** 1981 test, 208 file (không đổi). **pgTAP sau M5a:** 18 file, 234 test.

---

### Task 1: Bảng `illness_visits` và `photos.visit_id` (§8.1, §10.2)

**Files:**

- Create: `supabase/migrations/20261126000300_illness_visits.sql`
- Modify: `lib/supabase/types.ts` (sinh lại), `lib/supabase/rows.ts`
- Test: `supabase/tests/018_illness_visits.test.sql`

**Interfaces:**

- Consumes: `public.illness_episodes (id, baby_id)`, `public.photos`, `public.set_updated_at()`, `public.forbid_immutable_change()`, `public.is_member(uuid)`, `public.is_owner(uuid)`, `public.baby_family(uuid)`.
- Produces: bảng `public.illness_visits`; cột `public.photos.visit_id`; kiểu `VisitRow`; `PhotoRow.visit_id`.

- [x] **Step 0: Kiểm M4c đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
git log --oneline -20 main | grep "the M4c plan and its check results"
git checkout -b feat/kim-bun-dot-om-m5a
bunx vitest run
```

Expected: lệnh `grep` in đúng một dòng (M4c đã lên `main`; không thấy thì dừng và báo người dùng); `Test Files  208 passed (208)`, `Tests  1981 passed (1981)`. `main` đã có thêm commit khác thì mọi con số test trong plan lệch đúng bằng số test mới của các commit đó: ghi lại số xuất phát thật.

- [x] **Step 1: Viết test pgTAP đỏ (Patch 1)**

40 kiểm: bảng, ràng buộc và trigger (chạy bằng quyền chủ DB), rồi RLS với ba người: C ngoài gia đình, B là thành viên, A là chủ gia đình; cuối cùng xóa một bé có đủ đợt ốm, lần khám và ảnh của lần khám.

```diff
diff --git a/supabase/tests/018_illness_visits.test.sql b/supabase/tests/018_illness_visits.test.sql
new file mode 100644
index 0000000..24e423f
--- /dev/null
+++ b/supabase/tests/018_illness_visits.test.sql
@@ -0,0 +1,202 @@
+begin;
+create extension if not exists pgtap with schema extensions;
+select plan(40);
+
+insert into auth.users (id, email) values
+  ('aaaaaaaa-0000-0000-0000-000000000018', 'va@example.com'),
+  ('bbbbbbbb-0000-0000-0000-000000000018', 'vb@example.com'),
+  ('cccccccc-0000-0000-0000-000000000018', 'vc@example.com');
+insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000018', 'Nhà V');
+insert into public.family_members (family_id, email, user_id, role, display_name) values
+  ('f0000000-0000-0000-0000-000000000018', 'va@example.com', 'aaaaaaaa-0000-0000-0000-000000000018', 'owner', 'Mẹ'),
+  ('f0000000-0000-0000-0000-000000000018', 'vb@example.com', 'bbbbbbbb-0000-0000-0000-000000000018', 'member', 'Bố');
+insert into public.babies (id, family_id, name, dob, sex) values
+  ('ba000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000018', 'Bé', '2026-05-01', 'female'),
+  ('ba000000-0000-0000-0000-000000000118', 'f0000000-0000-0000-0000-000000000018', 'Em', '2026-05-01', 'male');
+insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by) values
+  ('e0000000-0000-0000-0000-000000000018', 'ba000000-0000-0000-0000-000000000018',
+   '2026-11-01 08:00+07', '2026-11-05 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000018'),
+  ('e0000000-0000-0000-0000-000000000118', 'ba000000-0000-0000-0000-000000000118',
+   '2026-11-02 08:00+07', null, 'aaaaaaaa-0000-0000-0000-000000000018');
+-- A photo of the Photos page: no visit.
+insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by) values
+  ('a0000000-0000-0000-0000-000000000018', 'ba000000-0000-0000-0000-000000000018',
+   'f0000000-0000-0000-0000-000000000018/ba000000-0000-0000-0000-000000000018/a0000000-0000-0000-0000-000000000018.jpg',
+   '2026-11-01', 250000, 'aaaaaaaa-0000-0000-0000-000000000018');
+
+-- Spec 2026-11-26 §8.1: the table, its checks and the two new foreign keys.
+select has_table('public', 'illness_visits', 'illness_visits exists');
+select lives_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, place, conclusion, advice, created_by)
+     values ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000018', '2026-11-02 09:00+07', 'Phòng khám Nhi',
+             'Viêm họng', 'Uống nhiều nước', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
+  'a visit with every field is accepted');
+select lives_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, created_by)
+     values ('d0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
+  'a visit with only its time is accepted');
+select throws_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, created_by)
+     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000118', '2026-11-03 09:00+07', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
+  '23503', null, 'a visit must belong to the baby of its episode');
+select throws_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, place, created_by)
+     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', '   ', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
+  '23514', null, 'a blank place is refused');
+select throws_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, place, created_by)
+     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', repeat('a', 81), 'aaaaaaaa-0000-0000-0000-000000000018') $$,
+  '23514', null, 'a place of 81 characters is refused');
+select throws_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, conclusion, created_by)
+     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', repeat('a', 121), 'aaaaaaaa-0000-0000-0000-000000000018') $$,
+  '23514', null, 'a conclusion of 121 characters is refused');
+select throws_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, advice, created_by)
+     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', repeat('a', 501), 'aaaaaaaa-0000-0000-0000-000000000018') $$,
+  '23514', null, 'advice of 501 characters is refused');
+select lives_ok(
+  $$ insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by, visit_id)
+     values ('a0000000-0000-0000-0000-000000000118', 'ba000000-0000-0000-0000-000000000018',
+             'f0000000-0000-0000-0000-000000000018/ba000000-0000-0000-0000-000000000018/a0000000-0000-0000-0000-000000000118.jpg',
+             '2026-11-02', 200000, 'bbbbbbbb-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000001') $$,
+  'a photo may belong to a visit of its baby');
+select throws_ok(
+  $$ insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by, visit_id)
+     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000118',
+             'f0000000-0000-0000-0000-000000000018/ba000000-0000-0000-0000-000000000118/a0000000-0000-0000-0000-000000000218.jpg',
+             '2026-11-02', 200000, 'bbbbbbbb-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000001') $$,
+  '23503', null, 'a photo cannot belong to a visit of another baby');
+select throws_ok(
+  $$ update public.photos set visit_id = 'd0000000-0000-0000-0000-000000000002'
+     where id = 'a0000000-0000-0000-0000-000000000118' $$,
+  'P0001', 'immutable_column: visit_id', 'the visit of a photo cannot change');
+select throws_ok(
+  $$ update public.photos set visit_id = 'd0000000-0000-0000-0000-000000000002'
+     where id = 'a0000000-0000-0000-0000-000000000018' $$,
+  'P0001', 'immutable_column: visit_id', 'a photo of the Photos page cannot join a visit');
+select throws_ok(
+  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000018' $$,
+  '23503', null, 'an episode with a visit cannot be deleted');
+select throws_ok(
+  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000001' $$,
+  '23503', null, 'a visit with a photo cannot be deleted');
+select throws_ok(
+  $$ update public.illness_visits set episode_id = 'e0000000-0000-0000-0000-000000000118'
+     where id = 'd0000000-0000-0000-0000-000000000002' $$,
+  'P0001', 'immutable_column: episode_id', 'the episode of a visit cannot change');
+select is_empty(
+  $$ select 1 from pg_publication_tables
+     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'illness_visits' $$,
+  'illness_visits is not published to realtime');
+
+-- As C (outsider)
+select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000018","email":"vc@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select is_empty('select id from public.illness_visits', 'outsider sees no visits');
+select throws_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at)
+     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000018', '2026-11-03 10:00+07') $$,
+  '42501', null, 'outsider cannot add a visit');
+select is_empty(
+  $$ update public.illness_visits set place = 'Nhà'
+     where id = 'd0000000-0000-0000-0000-000000000002' returning id $$,
+  'outsider cannot edit a visit');
+select is_empty(
+  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000002' returning id $$,
+  'outsider cannot delete a visit');
+reset role;
+
+-- As B (member, not the owner)
+select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000018","email":"vb@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select is((select count(*)::int from public.illness_visits), 2, 'member sees the family''s visits');
+select lives_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at) values
+       ('d0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000018',
+        'ba000000-0000-0000-0000-000000000018', '2026-11-04 09:00+07'),
+       ('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000118',
+        'ba000000-0000-0000-0000-000000000118', '2026-11-04 10:00+07') $$,
+  'member adds visits with client ids');
+select throws_ok(
+  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, created_by)
+     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
+             'ba000000-0000-0000-0000-000000000018', '2026-11-04 11:00+07', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
+  '42501', null, 'member cannot add a visit in someone else''s name');
+select isnt_empty(
+  $$ update public.illness_visits set conclusion = 'Viêm họng cấp'
+     where id = 'd0000000-0000-0000-0000-000000000001' returning id $$,
+  'member edits the visit the owner added');
+select is_empty(
+  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000002' returning id $$,
+  'member cannot delete the owner''s visit');
+select isnt_empty(
+  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000003' returning id $$,
+  'member deletes the visit they added');
+reset role;
+
+-- As A (owner)
+select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000018","email":"va@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select isnt_empty(
+  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000004' returning id $$,
+  'owner deletes the member''s visit');
+select throws_ok(
+  $$ update public.illness_visits set baby_id = 'ba000000-0000-0000-0000-000000000118'
+     where id = 'd0000000-0000-0000-0000-000000000002' $$,
+  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');
+select throws_ok(
+  $$ update public.illness_visits set created_by = 'bbbbbbbb-0000-0000-0000-000000000018'
+     where id = 'd0000000-0000-0000-0000-000000000002' $$,
+  'P0001', 'immutable_column: created_by', 'created_by is immutable');
+select throws_ok(
+  $$ update public.illness_visits set id = 'd0000000-0000-0000-0000-000000000099'
+     where id = 'd0000000-0000-0000-0000-000000000002' $$,
+  'P0001', 'immutable_column: id', 'id is immutable');
+select isnt_empty(
+  $$ update public.illness_visits set visited_at = '2026-11-03 10:30+07', place = null
+     where id = 'd0000000-0000-0000-0000-000000000002' returning id $$,
+  'owner edits the time and clears the place');
+reset role;
+
+select is(
+  (select count(*)::int from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000002'),
+  1,
+  'the outsider''s and the member''s delete of the owner''s visit had no effect');
+select has_index('public', 'illness_visits', 'illness_visits_episode_idx', array['episode_id', 'visited_at'],
+  'visits are indexed by episode and time');
+select has_index('public', 'photos', 'photos_visit_idx', array['visit_id'], 'photos are indexed by visit');
+select lives_ok(
+  $$ delete from public.photos where id = 'a0000000-0000-0000-0000-000000000118' $$,
+  'the photo of a visit can be deleted');
+select lives_ok(
+  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000001' $$,
+  'then its visit can be deleted');
+-- Put a visit with a photo back, so deleting the baby meets all three.
+insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by, visit_id) values
+  ('a0000000-0000-0000-0000-000000000318', 'ba000000-0000-0000-0000-000000000018',
+   'f0000000-0000-0000-0000-000000000018/ba000000-0000-0000-0000-000000000018/a0000000-0000-0000-0000-000000000318.jpg',
+   '2026-11-03', 200000, 'aaaaaaaa-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000002');
+select lives_ok(
+  $$ delete from public.babies where id = 'ba000000-0000-0000-0000-000000000018' $$,
+  'a baby with an episode, a visit and a visit''s photo can be deleted');
+select is_empty(
+  $$ select id from public.illness_episodes where baby_id = 'ba000000-0000-0000-0000-000000000018' $$,
+  'deleting a baby removes its episodes');
+select is_empty(
+  $$ select id from public.illness_visits where baby_id = 'ba000000-0000-0000-0000-000000000018' $$,
+  'deleting a baby removes its visits');
+select is_empty(
+  $$ select id from public.photos where baby_id = 'ba000000-0000-0000-0000-000000000018' $$,
+  'deleting a baby removes its photos, those of visits too');
+
+select * from finish();
+rollback;
```

- [x] **Step 2: Chạy để thấy đỏ**

```bash
docker info >/dev/null 2>&1 || { open -a OrbStack; until docker info >/dev/null 2>&1; do sleep 2; done; }
bun run db:start
bun run db:reset
bun run db:test
```

Expected: file `018_illness_visits.test.sql` báo `Failed 39/40 subtests` và `Parse errors: Bad plan.  You planned 40 tests but ran 16.` (16 kiểm chạy, chỉ kiểm realtime qua; kiểm thứ 17 ném lỗi vì bảng chưa có nên file dừng ở đó); dòng cuối `Files=18, Tests=210` và `Result: FAIL`. Mười bảy file kia xanh.

- [x] **Step 3: Viết migration, sinh lại kiểu, thêm `VisitRow` (Patch 2)**

Phần `lib/supabase/types.ts` của patch là đúng thứ `bun run db:types` sinh ra sau khi DB local có migration mới (35 dòng thêm, 3 dòng bỏ). `git apply` áp cả patch hoặc không áp gì: nếu nó từ chối vì `types.ts`, chạy `kb_patch 2 | git apply --verbose --exclude=lib/supabase/types.ts` rồi sinh lại file đó bằng `bun run db:types` ở Step 4.

```diff
diff --git a/lib/supabase/rows.ts b/lib/supabase/rows.ts
index ee38f09..6b33409 100644
--- a/lib/supabase/rows.ts
+++ b/lib/supabase/rows.ts
@@ -14,3 +14,4 @@ export type PhotoRow = Tables["photos"]["Row"];
 export type MilestoneRow = Tables["milestones_achieved"]["Row"];
 export type MedicineScheduleRow = Tables["medicine_schedules"]["Row"];
 export type EpisodeRow = Tables["illness_episodes"]["Row"];
+export type VisitRow = Tables["illness_visits"]["Row"];
diff --git a/lib/supabase/types.ts b/lib/supabase/types.ts
index 735c49d..076ea08 100644
--- a/lib/supabase/types.ts
+++ b/lib/supabase/types.ts
@@ -117,6 +117,32 @@ isOneToOne: false
 isOneToOne: false
       referencedRelation: "babies"
       referencedColumns: ["id"]
+    }
+                  ]
+                },"illness_visits": {
+                  Row: {
+                    "advice": string | null,"baby_id": string,"conclusion": string | null,"created_at": string,"created_by": string,"episode_id": string,"id": string,"place": string | null,"updated_at": string,"visited_at": string
+                  }
+                  ComputedFields: never
+                  Insert: {
+                    "advice"?: string | null,"baby_id": string,"conclusion"?: string | null,"created_at"?: string,"created_by"?: string,"episode_id": string,"id": string,"place"?: string | null,"updated_at"?: string,"visited_at": string
+                  }
+                  Update: {
+                    "advice"?: string | null,"baby_id"?: string,"conclusion"?: string | null,"created_at"?: string,"created_by"?: string,"episode_id"?: string,"id"?: string,"place"?: string | null,"updated_at"?: string,"visited_at"?: string
+                  }
+                  Relationships: [
+                    {
+      foreignKeyName: "illness_visits_baby_id_fkey"
+      columns: ["baby_id"]
+isOneToOne: false
+      referencedRelation: "babies"
+      referencedColumns: ["id"]
+    },{
+      foreignKeyName: "illness_visits_episode_id_baby_id_fkey"
+      columns: ["episode_id","baby_id"]
+isOneToOne: false
+      referencedRelation: "illness_episodes"
+      referencedColumns: ["id","baby_id"]
     }
                   ]
                 },"logs": {
@@ -235,14 +261,14 @@ isOneToOne: false
                   ]
                 },"photos": {
                   Row: {
-                    "baby_id": string,"caption": string | null,"created_at": string,"created_by": string,"id": string,"size_bytes": number,"storage_path": string,"taken_on": string
+                    "baby_id": string,"caption": string | null,"created_at": string,"created_by": string,"id": string,"size_bytes": number,"storage_path": string,"taken_on": string,"visit_id": string | null
                   }
                   ComputedFields: never
                   Insert: {
-                    "baby_id": string,"caption"?: string | null,"created_at"?: string,"created_by"?: string,"id": string,"size_bytes": number,"storage_path": string,"taken_on": string
+                    "baby_id": string,"caption"?: string | null,"created_at"?: string,"created_by"?: string,"id": string,"size_bytes": number,"storage_path": string,"taken_on": string,"visit_id"?: string | null
                   }
                   Update: {
-                    "baby_id"?: string,"caption"?: string | null,"created_at"?: string,"created_by"?: string,"id"?: string,"size_bytes"?: number,"storage_path"?: string,"taken_on"?: string
+                    "baby_id"?: string,"caption"?: string | null,"created_at"?: string,"created_by"?: string,"id"?: string,"size_bytes"?: number,"storage_path"?: string,"taken_on"?: string,"visit_id"?: string | null
                   }
                   Relationships: [
                     {
@@ -251,6 +277,12 @@ isOneToOne: false
 isOneToOne: false
       referencedRelation: "babies"
       referencedColumns: ["id"]
+    },{
+      foreignKeyName: "photos_visit_id_baby_id_fkey"
+      columns: ["visit_id","baby_id"]
+isOneToOne: false
+      referencedRelation: "illness_visits"
+      referencedColumns: ["id","baby_id"]
     }
                   ]
                 },"push_subscriptions": {
diff --git a/supabase/migrations/20261126000300_illness_visits.sql b/supabase/migrations/20261126000300_illness_visits.sql
new file mode 100644
index 0000000..f4160ed
--- /dev/null
+++ b/supabase/migrations/20261126000300_illness_visits.sql
@@ -0,0 +1,55 @@
+-- Spec 2026-11-26 §8.1: a doctor's visit during an illness episode, and the
+-- photos of its prescription. A visit belongs to its episode by episode_id,
+-- not by time: moving the episode's times never moves a visit out of it.
+-- Visits and their photos are written straight to the server (no outbox); the
+-- id still comes from the client (crypto.randomUUID()).
+create table public.illness_visits (
+  id uuid primary key,
+  episode_id uuid not null,
+  baby_id uuid not null references public.babies (id) on delete cascade,
+  visited_at timestamptz not null,
+  place text check (place is null or length(btrim(place)) between 1 and 80),
+  conclusion text check (conclusion is null or length(btrim(conclusion)) between 1 and 120),
+  advice text check (advice is null or length(btrim(advice)) between 1 and 500),
+  created_by uuid not null default auth.uid() references auth.users (id),
+  created_at timestamptz not null default now(),
+  updated_at timestamptz not null default now(),
+  -- No cascade: an episode with a visit cannot be deleted. Deleting the baby
+  -- still removes everything through baby_id.
+  foreign key (episode_id, baby_id) references public.illness_episodes (id, baby_id),
+  unique (id, baby_id)
+);
+create index illness_visits_episode_idx on public.illness_visits (episode_id, visited_at);
+
+create trigger illness_visits_set_updated_at before update on public.illness_visits
+  for each row execute function public.set_updated_at();
+create trigger illness_visits_immutable before update on public.illness_visits
+  for each row execute function public.forbid_immutable_change('id', 'episode_id', 'baby_id', 'created_by');
+
+alter table public.illness_visits enable row level security;
+
+-- As illness_episodes: any member reads, adds and edits; the owner of the
+-- family or whoever added the visit deletes it.
+create policy illness_visits_select on public.illness_visits for select to authenticated
+  using (public.is_member(public.baby_family(baby_id)));
+create policy illness_visits_insert on public.illness_visits for insert to authenticated
+  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
+create policy illness_visits_update on public.illness_visits for update to authenticated
+  using (public.is_member(public.baby_family(baby_id)))
+  with check (public.is_member(public.baby_family(baby_id)));
+create policy illness_visits_delete on public.illness_visits for delete to authenticated
+  using (
+    public.is_owner(public.baby_family(baby_id))
+    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
+  );
+
+-- A photo of a prescription points at its visit, of the same baby. No cascade:
+-- a visit with a photo cannot be deleted. A photo never changes visit.
+alter table public.photos add column visit_id uuid;
+alter table public.photos add foreign key (visit_id, baby_id)
+  references public.illness_visits (id, baby_id);
+create index photos_visit_idx on public.photos (visit_id) where visit_id is not null;
+
+drop trigger photos_immutable on public.photos;
+create trigger photos_immutable before update on public.photos
+  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by', 'storage_path', 'visit_id');
```

- [x] **Step 4: Chạy để thấy xanh**

```bash
bun run db:reset
bun run db:test
bun run db:types
git diff --stat lib/supabase/types.ts
bun run typecheck
```

Expected: `bun run db:reset` in `Applying migration 20261126000300_illness_visits.sql...` và không báo lỗi; `bun run db:test` in `All tests successful.`, `Files=18, Tests=234`, `Result: PASS`; sau `bun run db:types` file `lib/supabase/types.ts` vẫn đúng như patch (`git diff --stat` in `1 file changed, 35 insertions(+), 3 deletions(-)`); `tsc --noEmit` không báo lỗi.

Để Supabase local chạy tiếp cho Task 2, hoặc tắt bằng `bunx supabase stop` và bật lại khi tới đó.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20261126000300_illness_visits.sql supabase/tests/018_illness_visits.test.sql lib/supabase/types.ts lib/supabase/rows.ts
git commit -m "feat(db): the illness_visits table and photos.visit_id" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Kiểm cuối M5a, áp migration, rồi đưa lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của Task 1.
- Produces: kết quả kiểm, ghi ngay trong plan; migration `20261126000300_illness_visits.sql` đã áp lên Supabase thật; `main` có M5a.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  208 passed (208)`, `Tests  1981 passed (1981)` (plan này không thêm test vitest; `PhotoRow` có thêm một cột mà không chỗ nào cần sửa).

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages using 9 workers (42/42)` và thoát mã 0.

- [x] **Step 3: pgTAP trên DB dựng lại từ đầu**

```bash
docker info >/dev/null 2>&1 || { open -a OrbStack; until docker info >/dev/null 2>&1; do sleep 2; done; }
bun run db:start
bun run db:reset
bun run db:test
bunx supabase stop
```

Expected: `All tests successful.`, `Files=18, Tests=234`, `Result: PASS`. Sau đó tắt OrbStack nếu chính phiên này đã bật nó.

- [x] **Step 4: Áp migration lên Supabase thật**

`main` không được có code cần một migration trước khi migration đó đã áp (Global Constraints): `types.ts` của plan này đã mô tả bảng mới. Làm bước này trước Step 7.

```bash
bunx supabase db push --linked --dry-run
```

Expected: lệnh chỉ liệt kê, và liệt kê **đúng một** migration: `20261126000300_illness_visits.sql`. Thấy migration nào khác, hoặc không thấy migration nào, thì dừng và báo người dùng.

Lần M2a lệnh đẩy dưới đây bị bộ kiểm quyền của app chặn (người dùng đã tự chạy); nhiều khả năng lần này cũng vậy, nên đừng thử lại hay tìm đường vòng: chuyển ngay sang đoạn "bị chặn" bên dưới.

Chỉ khi dry-run đúng như trên:

```bash
bunx supabase db push --linked --yes
```

Expected: `Applying migration 20261126000300_illness_visits.sql...` rồi `Finished supabase db push.` (`--yes` chỉ trả lời câu hỏi xác nhận của CLI, để lệnh không treo chờ gõ phím.)

- Lệnh bị bộ kiểm quyền của app chặn, hoặc CLI hỏi mật khẩu của DB: **dừng lại**, không tìm đường vòng, không gõ mật khẩu, không nhờ phiên khác. Giữ code trên nhánh, không gộp. Đưa người dùng hai lệnh `bunx supabase db push --linked --dry-run` và `bunx supabase db push --linked` (mỗi lệnh một khối `bash`), nói rõ lệnh đầu phải liệt kê đúng một migration `20261126000300_illness_visits.sql`, và chờ họ báo đã chạy xong.
- Lệnh báo lỗi khi tạo bảng, khóa ngoại hay trigger: dừng và báo người dùng kèm nguyên văn lỗi. Migration chạy trong một giao dịch nên DB thật không đổi gì.

Xong thì chạy lại `bunx supabase db push --linked --dry-run`: phải báo `Remote database is up to date.`. Ghi vào plan giờ áp và ai chạy lệnh.

- [x] **Step 5: Không có bước trình duyệt**

Plan này không đổi gì trên màn hình (Diễn giải spec mục 7). Chưa có trang nào đọc `illness_visits`.

- [x] **Step 6: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của Task 1 có khớp plan không; kết quả Step 1 đến Step 4 (kèm dòng cuối của pgTAP, hai lần dry-run và giờ áp migration). Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này là untracked (??), hoặc đã được commit lúc duyệt thì là M; các file plan khác chưa chạy: không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5a.md
git commit -m "docs(plan): the M5a plan and its check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

**Kết quả thực thi (2026-11-27, phiên thực thi M5a, nhánh `feat/kim-bun-dot-om-m5a`):**

- **Xuất phát (Task 1 Step 0):** `main` = `origin/main` = `88caf0b`, `grep` in đúng một dòng M4c. Vitest `Test Files  208 passed (208)`, `Tests  1981 passed (1981)`: khớp plan.
- **Đỏ (Task 1 Step 2), khớp plan từng chữ:** `018_illness_visits.test.sql` báo `Failed 39/40 subtests`, `Parse errors: Bad plan.  You planned 40 tests but ran 16.` (lỗi `relation "public.illness_visits" does not exist` ở dòng 103); mười bảy file kia `ok`; `Files=18, Tests=210`, `Result: FAIL`.
- **Xanh (Task 1 Step 4), khớp plan:** cả hai patch áp sạch; `db:reset` in `Applying migration 20261126000300_illness_visits.sql...` không lỗi; `All tests successful.`, `Files=18, Tests=234`, `Result: PASS`. Sau `bun run db:types`, `git diff --stat lib/supabase/types.ts` in `1 file changed, 35 insertions(+), 3 deletions(-)` và các dòng `+`/`-` trùng từng byte phần `types.ts` của Patch 2. `tsc --noEmit` exit 0. Commit `98371f0`.
- **Task 2 Step 1:** `tsc --noEmit` exit 0; vitest `208 passed (208)` / `1981 passed (1981)`.
- **Task 2 Step 2:** `bun run build` lần 1 thoát 1 vì thông báo bảo mật của Next.js 16.4.3 (không chạy `next upgrade`); lần 2 exit 0, `✓ Generating static pages using 9 workers (42/42)`.
- **Task 2 Step 3:** `db:reset` rồi `db:test`: `All tests successful.`, `Files=18, Tests=234`, `Result: PASS`. Đã `bunx supabase stop`; OrbStack do phiên này bật nên đã tắt.
- **Task 2 Step 4: đã áp, do người dùng chạy.** 16:34:15 +07 dry-run lần 1 (phiên thực thi): `Would push these migrations: • 20261126000300_illness_visits.sql` (đúng một). `bunx supabase db push --linked --yes` của phiên bị bộ kiểm quyền của app chặn; không thử đường vòng. 16:34:35 +07 dry-run lần 2: vẫn đúng một migration đó (`"upToDate":false`). Người dùng tự chạy trong terminal của app (khoảng 16:35 +07): dry-run ra đúng một migration đó; `bunx supabase db push --linked`, trả lời Yes, `Applying migration 20261126000300_illness_visits.sql...`, `Finished supabase db push.` 16:36:00 +07 dry-run cuối (phiên thực thi): `Remote database is up to date.`
- **Task 2 Step 7:** gộp `--ff-only` vào `main` và đẩy `origin/main` sau khi dry-run cuối báo up to date.
- **Lỗi:** không lỗi nào lộ ra; không sửa gì ngoài hai patch.
- **Chưa kiểm:** bảng, RLS và trigger trên Supabase thật (chỉ biết migration chạy xong không lỗi); pgTAP chỉ chạy local.
- Bốn plan M5b–M5e được commit nguyên trạng (`440e418`) để cây sạch.

- [x] **Step 7: Đưa lên `main`**

Chỉ khi migration đã áp (Step 4, dry-run cuối báo `Remote database is up to date.`), mọi bước trên đều đạt và không còn lỗi đã biết. Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m5a
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase. Thư mục repo đang ở nhánh khác của một phiên đang chạy thì không `git checkout main`: dùng `git fetch . feat/kim-bun-dot-om-m5a:main` (chỉ nhận fast-forward) rồi `git push origin main`.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build, pgTAP; migration đã áp lúc nào và do ai chạy; lỗi nào đã sửa trong phiên; mục nào chưa kiểm; và rằng M5b chạy được từ lúc này.
