# Kim Bun — Sức khỏe M3a: dữ liệu và luật của mục tiêu chiều cao Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§6.1, §6.2, `parseHeightGoal` của §6.5; phần tương ứng của §9.1)

**Status:** approved 2026-11-25

**Goal:** Hồ sơ bé lưu được chiều cao bố, chiều cao mẹ và mục tiêu; app có số liệu chiều cao người lớn của WHO và mọi luật của mục tiêu chiều cao. Chưa màn hình nào đổi.

**Architecture:**

- **DB:** migration `20261125000100_height_goal.sql` thêm 3 cột nullable vào `public.babies`, kèm pgTAP 014. RLS không đổi. `lib/supabase/types.ts` được sinh lại; `updateBaby` nhận thêm 3 cột.
- **Số liệu:** `content/who/adult_height.json` là L, M, S của WHO Growth Reference 2007 tại 228 tháng, sinh bằng `bun scripts/build-who.ts adult`; `lib/content/adultHeight.ts` đọc và kiểm bằng zod.
- **Luật thuần:** `lib/rules/heightGoal.ts` (khoảng di truyền, z mục tiêu, đường mục tiêu, trạng thái so với đường, mục tiêu so với khoảng, tốc độ tăng, form mục tiêu).
- Không màn hình nào dùng các thứ này cho tới M3b. Không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Zod, Vitest, Bun; Supabase CLI và pgTAP trên Supabase local (Docker qua OrbStack); ExcelJS (đã có, chỉ `scripts/build-who.ts` dùng). Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m3a`, cắt từ `main` @ `ae0d47f` (đã có trọn mốc M2). Baseline: 1389 test vitest xanh (171 file), typecheck sạch, pgTAP `Files=13, Tests=135`.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                                   | Plan                          |
| ------------------ | -------------------------------------------------------------------------- | ----------------------------- |
| M1, M2             | §3, §4 dòng 1 đến 3, §5                                                    | đã xong, ở `main` @ `ae0d47f` |
| **M3a (plan này)** | §6.1 dữ liệu, §6.2 luật, form của §6.5                                     | file này                      |
| M3b                | §6.3 trang Chiều cao (mục 1 đến 5 và 9), §6.5 sheet                        | chưa viết                     |
| M3c                | §6.4 thẻ mục tiêu ở màn Tăng trưởng, hàng mục tiêu ở trang Sức khỏe (§3.4) | chưa viết                     |
| M4                 | §7 Thói quen và dinh dưỡng, dòng 5 và 6 của §4                             | chưa viết                     |
| M5                 | §8 Push, dòng 4 của §4, §9.3                                               | chưa viết                     |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M3 chia ba plan.** Spec §10 ghi M3 là một mốc; làm một plan thì quá dài. M3a không đổi gì trên màn hình, nên an toàn để lên `main` trước. M3b và M3c được viết sau khi M3a chạy xong, từ đúng các tên và kiểu mà M3a để lại.
2. **Số liệu người lớn đã có sẵn trong patch; phiên chạy plan không tải gì.** Ngày 2026-11-25, với sự đồng ý của người dùng, hai file của WHO được tải về một thư mục tạm ngoài repo và đọc bằng chính script của Task 2:
   - `hfa-boys-z-who-2007-exp.xlsx`, 30.017 byte, SHA-256 `d78fa8cafcab77dcb5f03d71506d92bdcb28f89c642816b6bb0eef466b007466`: tháng 228 có L = 1, M = 176,5432, S = 0,04134.
   - `hfa-girls-z-who-2007-exp.xlsx`, 29.837 byte, SHA-256 `df07ee16d3d2916569f1d869b7c874d7b880a41321d871215ed0254cb16679b3`: tháng 228 có L = 1, M = 163,1548, S = 0,04009.

   Cả hai M nằm trong khoảng spec bắt script tự kiểm. Muốn sinh lại file thì phải tải lại hai file đó, và việc tải cần người dùng đồng ý (Global Constraints).

3. **`source` của `adult_height.json`** là địa chỉ trang "Height-for-age (5-19 years)" trên who.int, vì schema của spec chỉ có một `source` trong khi số liệu đến từ hai file. Địa chỉ hai file nằm ở `ADULT_HEIGHT_FILES` trong `scripts/build-who.ts`.
4. **`scripts/build-who.ts` có thêm lệnh con `adult`:** `bun scripts/build-who.ts adult <thư mục có hai file hfa> <YYYY-MM-DD>`. Cách gọi cũ cho sáu bảng 0–5 tuổi không đổi.
5. **`sex` trong các luật là `"boys"` hoặc `"girls"`** (kiểu `WhoSex` các màn đang dùng).
6. **`goalStatus` nhận một object** `{ reading, z, table }` thay cho `(length, day, z)` của spec, vì nó cần bảng chiều dài của WHO; `reading` là lần đo chiều dài gần nhất nằm trong bảng (phần tử đầu của `readings(rows, table, dob, "lhfa")`), hoặc null. Nó trả thêm `short`, là câu đứng sau "Mục tiêu {t} cm: " ở trang Sức khỏe (§6.4), để M3c không phải viết lại.
7. **Số trong câu trạng thái viết đúng 1 chữ số thập phân** ("Trên đường mục tiêu 1,0 cm"). **Mục tiêu `{t}` viết tối đa 1 chữ số** ("180", "165,5").
8. **`lengthVelocity` trả `rate` và `expected` đã viết thành chữ** (1 chữ số thập phân) cùng ngày của hai lần đo; phép so sánh của chip làm trên số chưa làm tròn. Nó chỉ xét các lần đo chiều dài nằm trong bảng WHO (0–1856 ngày tuổi).
9. **`parseHeightGoal`:** khoảng 120–220 xét trước khi làm tròn. **Một chỗ spec không nói, người dùng cần biết khi duyệt:** khi ô của bố sai khoảng còn ô của mẹ trống (hoặc ngược lại), form chỉ báo lỗi khoảng ở ô sai, không báo thêm "Nhập cả bố và mẹ." ở ô trống. Có thêm `heightGoalRaw` (spec không ghi) để sheet của M3b điền sẵn giá trị đang lưu.
10. **Số làm tròn ra −0 được viết là 0** ("0,0 cm", không phải "-0,0 cm"), ở trạng thái so với đường mục tiêu và ở tốc độ tăng.
11. **`bunx supabase db push`** lên project thật chỉ chạy khi người dùng đồng ý trong phiên chạy plan (Task 5), sau một lần `--dry-run`. Ba cột đều nullable và không có default, nên áp sớm không ảnh hưởng app đang chạy. **M3b không được lên `main` trước khi migration này đã ở DB thật.** Riêng M3a thì lên `main` được cả khi người dùng chưa cho áp migration, vì chưa đoạn code nào đọc ba cột mới.
12. **Không có bước kiểm trình duyệt**, vì plan này không đổi gì trên màn hình.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 8** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m3a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 8 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `ae0d47f`. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. pgTAP đã chạy trên Supabase local trong Docker: đỏ rồi xanh đúng như Task 1 ghi; `bun run db:types` sau migration ra đúng nội dung của patch. Chưa chạy trong lúc viết plan: `bun run build` và `bunx supabase db push`.
- **pgTAP cần Docker.** `bun run db:start`, `db:reset`, `db:test`, `db:types` chỉ chạm Supabase **local** trong Docker (OrbStack); `db:reset` chỉ dựng lại DB local. Nếu Docker không chạy được: để ô của bước đó chưa tick, ghi "pgTAP 014 chưa chạy: Docker không chạy" vào báo cáo cuối, rồi làm tiếp bước sau. Không đánh dấu một bước chưa chạy là đã xong.
- **`bun run build`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không tải file nào từ mạng.** `content/who/adult_height.json` đi theo Patch 4 (Diễn giải spec, mục 2).
- **Lên `main` và `db push`.** Mỗi việc cần người dùng đồng ý riêng. Task 5 dừng lại hỏi từng việc, không tự làm.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn).

## Contracts with Other Plans

Plan này đứng sau M2g (đã ở `main` @ `ae0d47f`). M3b và M3c dùng mọi thứ dưới đây.

**Consumes (đã ở `main`):** `zScore`, `valueAtZ`, `lmsAt` (`lib/rules/growth.ts`); `readings`, `GrowthMeasure` (`lib/rules/growthAlerts.ts`); `LmsRow`, `WhoSex` (`lib/content/who.ts`); `updateBaby` (`lib/data/baby.ts`); `readLmsRows` và cách gọi hiện có của `scripts/build-who.ts`.

**Produces:**

- DB: `public.babies` có `father_height_cm`, `mother_height_cm`, `target_height_cm`, đều `numeric(4, 1)`, nullable, trong 120–220. `Baby` (`lib/supabase/rows.ts`) có ba trường đó kiểu `number | null`.
- `lib/data/baby.ts`: `updateBaby(id, patch)` nhận thêm `father_height_cm?`, `mother_height_cm?`, `target_height_cm?` (`number | null`).
- `lib/content/adultHeight.ts`: `AdultHeightSchema`, `AdultHeight = { source: string; reviewedAt: string; boys: { l; m; s }; girls: { l; m; s } }`, `ADULT_HEIGHT`.
- `scripts/build-who.ts`: `ADULT_HEIGHT_FILES`, `ADULT_MONTH = 228`, `adultLms(rows: number[][], sex: WhoSex)`, `readMonthRows(path)`; lệnh con `adult`.
- `lib/rules/heightGoal.ts`:
  - `formatCm(cm: number): string`;
  - `ParentalRange = { mid: number; low: number; high: number }`, `midParental(father: number, mother: number, sex: WhoSex): ParentalRange`;
  - `targetZ(target: number, sex: WhoSex): number`;
  - `targetCurve(table: LmsRow[], z: number, toDay: number, step: number): { day: number; value: number }[]`;
  - `GoalStatus = { text: string; short: string; chip: { text: string; tone: "good" | "neutral" } | null; diff: number | null }`, `goalStatus(input: { reading: { value: number; ageDays: number } | null; z: number; table: LmsRow[] }): GoalStatus`;
  - `targetVsRange(target: number, range: ParentalRange): string`;
  - `LengthVelocity = { rate: string; expected: string; from: string; to: string; chip: { text: string; tone: "good" | "neutral" } }`, `lengthVelocity(rows: GrowthMeasure[], table: LmsRow[], dob: string): LengthVelocity | null`;
  - `HeightGoalRaw = { father: string; mother: string; target: string }`, `HeightGoalInput = { father_height_cm: number | null; mother_height_cm: number | null; target_height_cm: number | null }`, `HeightGoalErrors = Partial<Record<"father" | "mother" | "target", string>>`;
  - `parseHeightGoal(raw: HeightGoalRaw): { ok: true; value: HeightGoalInput } | { ok: false; errors: HeightGoalErrors }`, `heightGoalRaw(baby: HeightGoalInput): HeightGoalRaw`.
- **Sau M3a:** vitest 1431 test, 174 file; pgTAP `Files=14, Tests=156`.

---

### Task 1: Ba cột chiều cao trên hồ sơ bé (§6.1)

**Files:**

- Create: `supabase/migrations/20261125000100_height_goal.sql`
- Modify: `lib/supabase/types.ts` (sinh lại), `lib/data/baby.ts`
- Test: `supabase/tests/014_height_goal.test.sql` (mới)

**Interfaces:**

- Consumes: bảng `public.babies` và policy `babies_update` hiện có; `updateBaby`.
- Produces: ba cột ở mục Produces của Contracts; `updateBaby` nhận ba cột đó.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m3a
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/supabase/tests/014_height_goal.test.sql b/supabase/tests/014_height_goal.test.sql
new file mode 100644
index 0000000..c878a78
--- /dev/null
+++ b/supabase/tests/014_height_goal.test.sql
@@ -0,0 +1,85 @@
+begin;
+create extension if not exists pgtap with schema extensions;
+select plan(21);
+
+insert into auth.users (id, email) values
+  ('aaaaaaaa-0000-0000-0000-000000000014', 'ha@example.com'),
+  ('bbbbbbbb-0000-0000-0000-000000000014', 'hb@example.com');
+insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000014', 'Nhà H');
+insert into public.family_members (family_id, email, user_id, role, display_name) values
+  ('f0000000-0000-0000-0000-000000000014', 'ha@example.com', 'aaaaaaaa-0000-0000-0000-000000000014', 'owner', 'Mẹ'),
+  ('f0000000-0000-0000-0000-000000000014', 'hb@example.com', 'bbbbbbbb-0000-0000-0000-000000000014', 'member', 'Bà');
+insert into public.babies (id, family_id, name, dob, sex)
+  values ('ba000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000014', 'Bé', '2026-09-14', 'male');
+
+-- Spec 2026-11-25 §6.1: three optional heights on the baby's profile.
+select has_column('public', 'babies', 'father_height_cm', 'babies has father_height_cm');
+select has_column('public', 'babies', 'mother_height_cm', 'babies has mother_height_cm');
+select has_column('public', 'babies', 'target_height_cm', 'babies has target_height_cm');
+select col_is_null('public', 'babies', 'father_height_cm', 'father_height_cm is optional');
+select col_is_null('public', 'babies', 'mother_height_cm', 'mother_height_cm is optional');
+select col_is_null('public', 'babies', 'target_height_cm', 'target_height_cm is optional');
+
+-- Each height stays within 120–220 cm.
+select throws_ok(
+  $$ update public.babies set father_height_cm = 119.9 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  '23514', null, 'father_height_cm below 120 is rejected');
+select throws_ok(
+  $$ update public.babies set father_height_cm = 220.1 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  '23514', null, 'father_height_cm above 220 is rejected');
+select lives_ok(
+  $$ update public.babies set father_height_cm = 120 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  'father_height_cm 120 is accepted');
+select lives_ok(
+  $$ update public.babies set father_height_cm = 220 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  'father_height_cm 220 is accepted');
+select throws_ok(
+  $$ update public.babies set mother_height_cm = 119.9 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  '23514', null, 'mother_height_cm below 120 is rejected');
+select throws_ok(
+  $$ update public.babies set mother_height_cm = 220.1 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  '23514', null, 'mother_height_cm above 220 is rejected');
+select lives_ok(
+  $$ update public.babies set mother_height_cm = 120 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  'mother_height_cm 120 is accepted');
+select lives_ok(
+  $$ update public.babies set mother_height_cm = 220 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  'mother_height_cm 220 is accepted');
+select throws_ok(
+  $$ update public.babies set target_height_cm = 119.9 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  '23514', null, 'target_height_cm below 120 is rejected');
+select throws_ok(
+  $$ update public.babies set target_height_cm = 220.1 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  '23514', null, 'target_height_cm above 220 is rejected');
+select lives_ok(
+  $$ update public.babies set target_height_cm = 120 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  'target_height_cm 120 is accepted');
+select lives_ok(
+  $$ update public.babies set target_height_cm = 220 where id = 'ba000000-0000-0000-0000-000000000014' $$,
+  'target_height_cm 220 is accepted');
+
+-- As B (member): reads the heights, cannot change them.
+select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000014","email":"hb@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select is(
+  (select row(father_height_cm, mother_height_cm, target_height_cm)::text from public.babies
+    where id = 'ba000000-0000-0000-0000-000000000014'),
+  '(220.0,220.0,220.0)',
+  'a member reads the three heights');
+select is_empty(
+  $$ update public.babies set father_height_cm = 175, mother_height_cm = 160, target_height_cm = 180
+     where id = 'ba000000-0000-0000-0000-000000000014' returning id $$,
+  'a member who is not the owner cannot change the heights');
+reset role;
+
+-- As A (owner)
+select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000014","email":"ha@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select isnt_empty(
+  $$ update public.babies set father_height_cm = 175, mother_height_cm = 160.5, target_height_cm = null
+     where id = 'ba000000-0000-0000-0000-000000000014' returning id $$,
+  'the owner changes the heights and clears the goal');
+reset role;
+
+select * from finish();
+rollback;
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `open -a OrbStack; for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 2; done; bun run db:start && bun run db:reset && bun run db:test`
Expected: FAIL. `001`…`013` `ok`; `014_height_goal.test.sql` hỏng với `Failed 21/21 subtests` và `Bad plan.  You planned 21 tests but ran 18.` (chưa có ba cột); `Files=14, Tests=153`, `Result: FAIL`.

(`open` trả về trước khi Docker sẵn sàng, nên vòng lặp chờ tối đa 60 giây cho `docker info` chạy được rồi mới khởi động Supabase local. Nếu `db:start` báo Supabase local đang chạy sẵn thì chạy tiếp hai lệnh sau nó. `db:reset` ở đây là bắt buộc: DB local có thể còn giữ ba cột từ lần chạy thử lúc viết plan, và khi đó test sẽ xanh ngay từ đầu. Nó chỉ dựng lại DB local theo các migration đang có trong thư mục làm việc.)

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/data/baby.ts b/lib/data/baby.ts
index 79c1cf7..516f2a3 100644
--- a/lib/data/baby.ts
+++ b/lib/data/baby.ts
@@ -23,6 +23,10 @@ export async function updateBaby(
     vaccine_choices?: Record<string, string>;
     blood_type?: string | null;
     allergies?: string | null;
+    // Spec 2026-11-25 §6.1.
+    father_height_cm?: number | null;
+    mother_height_cm?: number | null;
+    target_height_cm?: number | null;
   },
 ): Promise<void> {
   const { data, error } = await supabase()
diff --git a/lib/supabase/types.ts b/lib/supabase/types.ts
index f3fcc44..549d3e5 100644
--- a/lib/supabase/types.ts
+++ b/lib/supabase/types.ts
@@ -7,14 +7,14 @@ export type Database = {
           Tables: {
             "babies": {
                   Row: {
-                    "allergies": string | null,"birth_head_cm": number | null,"birth_length_cm": number | null,"birth_weight_g": number | null,"blood_type": string | null,"created_at": string,"dob": string,"family_id": string,"feed_interval_min": number,"id": string,"name": string,"notes": string | null,"sex": string,"updated_at": string,"vaccine_choices": NonNullable<Json>
+                    "allergies": string | null,"birth_head_cm": number | null,"birth_length_cm": number | null,"birth_weight_g": number | null,"blood_type": string | null,"created_at": string,"dob": string,"family_id": string,"father_height_cm": number | null,"feed_interval_min": number,"id": string,"mother_height_cm": number | null,"name": string,"notes": string | null,"sex": string,"target_height_cm": number | null,"updated_at": string,"vaccine_choices": NonNullable<Json>
                   }
                   ComputedFields: never
                   Insert: {
-                    "allergies"?: string | null,"birth_head_cm"?: number | null,"birth_length_cm"?: number | null,"birth_weight_g"?: number | null,"blood_type"?: string | null,"created_at"?: string,"dob": string,"family_id": string,"feed_interval_min"?: number,"id"?: string,"name": string,"notes"?: string | null,"sex": string,"updated_at"?: string,"vaccine_choices"?: NonNullable<Json>
+                    "allergies"?: string | null,"birth_head_cm"?: number | null,"birth_length_cm"?: number | null,"birth_weight_g"?: number | null,"blood_type"?: string | null,"created_at"?: string,"dob": string,"family_id": string,"father_height_cm"?: number | null,"feed_interval_min"?: number,"id"?: string,"mother_height_cm"?: number | null,"name": string,"notes"?: string | null,"sex": string,"target_height_cm"?: number | null,"updated_at"?: string,"vaccine_choices"?: NonNullable<Json>
                   }
                   Update: {
-                    "allergies"?: string | null,"birth_head_cm"?: number | null,"birth_length_cm"?: number | null,"birth_weight_g"?: number | null,"blood_type"?: string | null,"created_at"?: string,"dob"?: string,"family_id"?: string,"feed_interval_min"?: number,"id"?: string,"name"?: string,"notes"?: string | null,"sex"?: string,"updated_at"?: string,"vaccine_choices"?: NonNullable<Json>
+                    "allergies"?: string | null,"birth_head_cm"?: number | null,"birth_length_cm"?: number | null,"birth_weight_g"?: number | null,"blood_type"?: string | null,"created_at"?: string,"dob"?: string,"family_id"?: string,"father_height_cm"?: number | null,"feed_interval_min"?: number,"id"?: string,"mother_height_cm"?: number | null,"name"?: string,"notes"?: string | null,"sex"?: string,"target_height_cm"?: number | null,"updated_at"?: string,"vaccine_choices"?: NonNullable<Json>
                   }
                   Relationships: [
                     {
diff --git a/supabase/migrations/20261125000100_height_goal.sql b/supabase/migrations/20261125000100_height_goal.sql
new file mode 100644
index 0000000..d963eb7
--- /dev/null
+++ b/supabase/migrations/20261125000100_height_goal.sql
@@ -0,0 +1,10 @@
+-- Spec 2026-11-25 §6.1: the parents' heights and the adult height the family
+-- aims for. All three are optional. RLS is unchanged: every member reads,
+-- only the owner writes (babies_update).
+alter table public.babies
+  add column father_height_cm numeric(4, 1)
+    check (father_height_cm is null or father_height_cm between 120 and 220),
+  add column mother_height_cm numeric(4, 1)
+    check (mother_height_cm is null or mother_height_cm between 120 and 220),
+  add column target_height_cm numeric(4, 1)
+    check (target_height_cm is null or target_height_cm between 120 and 220);
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bun run db:reset && bun run db:test`
Expected: PASS. `001`…`014` `ok`, `All tests successful.`, `Files=14, Tests=156`, `Result: PASS`.

Run: `bun run db:types && git diff --stat lib/supabase/types.ts`
Expected: `1 file changed, 3 insertions(+), 3 deletions(-)`, tức đúng 3 dòng mà Patch 2 đã đổi: file sinh lại từ DB local trùng từng byte với file của patch (đã kiểm bằng SHA-256 lúc viết plan).

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  171 passed (171)`, `Tests  1389 passed (1389)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20261125000100_height_goal.sql supabase/tests/014_height_goal.test.sql lib/supabase/types.ts lib/data/baby.ts
git commit -m "feat(db): three optional heights on the baby's profile" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Số liệu chiều cao người lớn của WHO (§6.2)

**Files:**

- Create: `content/who/adult_height.json`, `lib/content/adultHeight.ts`
- Modify: `scripts/build-who.ts`
- Test: `lib/content/adultHeight.test.ts` (mới), `scripts/build-who.test.ts` (mới)

**Interfaces:**

- Consumes: `WhoSex`; `num` và `ExcelJS` trong `scripts/build-who.ts`.
- Produces: `AdultHeightSchema`, `AdultHeight`, `ADULT_HEIGHT`; `ADULT_HEIGHT_FILES`, `ADULT_MONTH`, `adultLms`, `readMonthRows`, lệnh con `adult`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/content/adultHeight.test.ts b/lib/content/adultHeight.test.ts
new file mode 100644
index 0000000..7bb4973
--- /dev/null
+++ b/lib/content/adultHeight.test.ts
@@ -0,0 +1,45 @@
+import { describe, expect, it } from "vitest";
+import raw from "@/content/who/adult_height.json";
+import { ADULT_HEIGHT, AdultHeightSchema } from "./adultHeight";
+
+// Spec 2026-11-25 §6.2: WHO Growth Reference 2007, height-for-age at 19 years.
+describe("content/who/adult_height.json", () => {
+  it("passes its schema and names its source and review day", () => {
+    expect(AdultHeightSchema.parse(raw)).toEqual(ADULT_HEIGHT);
+    expect(ADULT_HEIGHT.source).toMatch(
+      /^https:\/\/www\.who\.int\/.+height-for-age$/,
+    );
+    expect(ADULT_HEIGHT.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
+  });
+
+  it("the median adult is where the WHO reference puts it", () => {
+    expect(ADULT_HEIGHT.boys.m).toBeGreaterThanOrEqual(176.0);
+    expect(ADULT_HEIGHT.boys.m).toBeLessThanOrEqual(177.0);
+    expect(ADULT_HEIGHT.girls.m).toBeGreaterThanOrEqual(162.7);
+    expect(ADULT_HEIGHT.girls.m).toBeLessThanOrEqual(163.7);
+  });
+
+  it("S is a small positive spread for both sexes", () => {
+    for (const sex of ["boys", "girls"] as const) {
+      expect(ADULT_HEIGHT[sex].s).toBeGreaterThan(0.03);
+      expect(ADULT_HEIGHT[sex].s).toBeLessThan(0.05);
+    }
+  });
+
+  it("rejects a file with a missing sex, an unknown key or a bad source", () => {
+    const { girls: _girls, ...noGirls } = ADULT_HEIGHT;
+    expect(AdultHeightSchema.safeParse(noGirls).success).toBe(false);
+    expect(
+      AdultHeightSchema.safeParse({ ...ADULT_HEIGHT, extra: 1 }).success,
+    ).toBe(false);
+    expect(
+      AdultHeightSchema.safeParse({ ...ADULT_HEIGHT, source: "who" }).success,
+    ).toBe(false);
+    expect(
+      AdultHeightSchema.safeParse({
+        ...ADULT_HEIGHT,
+        boys: { ...ADULT_HEIGHT.boys, m: 0 },
+      }).success,
+    ).toBe(false);
+  });
+});
diff --git a/scripts/build-who.test.ts b/scripts/build-who.test.ts
new file mode 100644
index 0000000..b323035
--- /dev/null
+++ b/scripts/build-who.test.ts
@@ -0,0 +1,40 @@
+import { describe, expect, it } from "vitest";
+import { ADULT_HEIGHT_FILES, ADULT_MONTH, adultLms } from "./build-who";
+
+// Spec 2026-11-25 §6.2: the adult constants come from the WHO 5–19 tables,
+// and the script checks them before it writes anything.
+describe("build-who: adult height", () => {
+  const rows = [
+    [227, 1, 176.5211, 0.04142],
+    [228, 1, 176.5432, 0.04134],
+  ];
+
+  it("reads the row at 228 months", () => {
+    expect(ADULT_MONTH).toBe(228);
+    expect(adultLms(rows, "boys")).toEqual({ l: 1, m: 176.5432, s: 0.04134 });
+  });
+
+  it("stops when the table has no row for 228 months", () => {
+    expect(() => adultLms(rows.slice(0, 1), "boys")).toThrow(/228/);
+  });
+
+  it("stops when the median is outside the range the spec expects", () => {
+    // A girls' median in the boys' file, and the other way round.
+    expect(() => adultLms([[228, 1, 163.1548, 0.04009]], "boys")).toThrow(
+      /176–177/,
+    );
+    expect(() => adultLms(rows, "girls")).toThrow(/162.7–163.7/);
+    expect(adultLms([[228, 1, 163.1548, 0.04009]], "girls").m).toBe(163.1548);
+  });
+
+  it("names one WHO file per sex", () => {
+    expect(ADULT_HEIGHT_FILES.map((file) => file.sex)).toEqual([
+      "boys",
+      "girls",
+    ]);
+    for (const file of ADULT_HEIGHT_FILES)
+      expect(file.url).toMatch(
+        /^https:\/\/cdn\.who\.int\/.+\/hfa-(boys|girls)-z-who-2007-exp\.xlsx$/,
+      );
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  2 failed | 171 passed (173)`, `Tests  4 failed | 1389 passed (1393)`. Lý do đỏ: chưa có `lib/content/adultHeight.ts` và file JSON (file test đó không chạy được test nào); `scripts/build-who.ts` chưa có `adultLms`, `ADULT_MONTH`, `ADULT_HEIGHT_FILES`.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/content/who/adult_height.json b/content/who/adult_height.json
new file mode 100644
index 0000000..2c56708
--- /dev/null
+++ b/content/who/adult_height.json
@@ -0,0 +1,14 @@
+{
+  "source": "https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/height-for-age",
+  "reviewedAt": "2026-11-25",
+  "boys": {
+    "l": 1,
+    "m": 176.5432,
+    "s": 0.04134
+  },
+  "girls": {
+    "l": 1,
+    "m": 163.1548,
+    "s": 0.04009
+  }
+}
diff --git a/lib/content/adultHeight.ts b/lib/content/adultHeight.ts
new file mode 100644
index 0000000..97f353e
--- /dev/null
+++ b/lib/content/adultHeight.ts
@@ -0,0 +1,27 @@
+import data from "@/content/who/adult_height.json";
+import { z } from "zod";
+
+const AdultLmsSchema = z
+  .object({
+    l: z.number(),
+    m: z.number().positive(),
+    s: z.number().positive(),
+  })
+  .strict();
+
+// Spec 2026-11-25 §6.2: L, M, S of the WHO Growth Reference 2007,
+// height-for-age, at 228 months (19 years), where the reference ends. Written
+// by `bun scripts/build-who.ts adult`.
+export const AdultHeightSchema = z
+  .object({
+    source: z.url(),
+    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
+    boys: AdultLmsSchema,
+    girls: AdultLmsSchema,
+  })
+  .strict();
+
+export type AdultHeight = z.infer<typeof AdultHeightSchema>;
+
+// Parsed once at import: a malformed content file fails loudly in tests and builds.
+export const ADULT_HEIGHT: AdultHeight = AdultHeightSchema.parse(data);
diff --git a/scripts/build-who.ts b/scripts/build-who.ts
index a672378..bb81f54 100644
--- a/scripts/build-who.ts
+++ b/scripts/build-who.ts
@@ -1,7 +1,8 @@
 import { mkdirSync, writeFileSync } from "node:fs";
 import { join } from "node:path";
 import ExcelJS from "exceljs";
-import type { LmsRow } from "@/lib/content/who";
+import type { AdultHeight } from "@/lib/content/adultHeight";
+import type { LmsRow, WhoSex } from "@/lib/content/who";

 // Spec §7.3: WHO Child Growth Standards, expanded LMS tables by day of age 0–1856.
 const CDN =
@@ -72,15 +73,88 @@ export async function readLmsRows(path: string): Promise<LmsRow[]> {
   return rows;
 }

-// Usage: bun scripts/build-who.ts <folder with the six .xlsx files> <reviewedAt YYYY-MM-DD>
+// Spec 2026-11-25 §6.2: WHO Growth Reference 2007, height-for-age 5–19 years,
+// expanded z-score tables by month of age 61–228.
+const REFERENCE_PAGE =
+  "https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/height-for-age";
+const REFERENCE_CDN =
+  "https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/height-for-age-(5-19-years)";
+
+export const ADULT_HEIGHT_FILES = [
+  { sex: "boys", url: `${REFERENCE_CDN}/hfa-boys-z-who-2007-exp.xlsx` },
+  { sex: "girls", url: `${REFERENCE_CDN}/hfa-girls-z-who-2007-exp.xlsx` },
+] as const;
+
+// 19 years: the last month of the reference.
+export const ADULT_MONTH = 228;
+// The median the reference is known to end at. A table that gives anything
+// else is the wrong file or a changed one.
+const ADULT_M_RANGE: Record<WhoSex, [min: number, max: number]> = {
+  boys: [176, 177],
+  girls: [162.7, 163.7],
+};
+
+// `rows` are [month, L, M, S]. Throws instead of writing a wrong constant.
+export function adultLms(rows: number[][], sex: WhoSex): AdultHeight[WhoSex] {
+  const row = rows.find(([month]) => month === ADULT_MONTH);
+  if (!row) throw new Error(`${sex}: no row for month ${ADULT_MONTH}`);
+  const [, l, m, s] = row;
+  const [min, max] = ADULT_M_RANGE[sex];
+  if (m < min || m > max)
+    throw new Error(
+      `${sex}: M at ${ADULT_MONTH} months is ${m}, outside ${min}–${max} cm. Stop and tell the user.`,
+    );
+  return { l, m, s };
+}
+
+// Reads the first sheet: header "Month, L, M, S, …", one row per month.
+export async function readMonthRows(path: string): Promise<number[][]> {
+  const workbook = new ExcelJS.Workbook();
+  await workbook.xlsx.readFile(path);
+  const sheet = workbook.worksheets[0];
+  const header = (sheet.getRow(1).values as unknown[]).slice(1, 5);
+  if (header.join(",") !== "Month,L,M,S")
+    throw new Error(`${path}: unexpected header ${header.join(",")}`);
+  const rows: number[][] = [];
+  sheet.eachRow((row, index) => {
+    if (index === 1) return;
+    rows.push((row.values as unknown[]).slice(1, 5).map(num));
+  });
+  return rows;
+}
+
+// Usage:
+//   bun scripts/build-who.ts <folder with the six .xlsx files> <reviewedAt YYYY-MM-DD>
+//   bun scripts/build-who.ts adult <folder with the two hfa .xlsx files> <reviewedAt YYYY-MM-DD>
 if (process.argv[1]?.endsWith("build-who.ts")) {
-  const [from, reviewedAt] = process.argv.slice(2);
+  const args = process.argv.slice(2);
+  const adult = args[0] === "adult";
+  const [from, reviewedAt] = adult ? args.slice(1) : args;
   if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt ?? ""))
     throw new Error(
-      "usage: bun scripts/build-who.ts <xlsx folder> <YYYY-MM-DD>",
+      "usage: bun scripts/build-who.ts [adult] <xlsx folder> <YYYY-MM-DD>",
     );
   mkdirSync("content/who", { recursive: true });
-  for (const file of WHO_FILES) {
+  if (adult) {
+    const [boys, girls] = await Promise.all(
+      ADULT_HEIGHT_FILES.map(async (file) =>
+        adultLms(
+          await readMonthRows(join(from, file.url.split("/").pop() as string)),
+          file.sex,
+        ),
+      ),
+    );
+    const out = "content/who/adult_height.json";
+    const table: AdultHeight = {
+      source: REFERENCE_PAGE,
+      reviewedAt,
+      boys,
+      girls,
+    };
+    writeFileSync(out, `${JSON.stringify(table, null, 2)}\n`);
+    console.log(`${out}: boys M ${boys.m}, girls M ${girls.m}`);
+  }
+  for (const file of adult ? [] : WHO_FILES) {
     const rows = await readLmsRows(
       join(from, file.url.split("/").pop() as string),
     );
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  173 passed (173)`, `Tests  1397 passed (1397)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add content/who/adult_height.json lib/content/adultHeight.ts lib/content/adultHeight.test.ts scripts/build-who.ts scripts/build-who.test.ts
git commit -m "feat(content): adult_height.json from the WHO 2007 reference, written and checked by build-who" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Luật: khoảng di truyền, đường mục tiêu, trạng thái (§6.2)

**Files:**

- Create: `lib/rules/heightGoal.ts`
- Test: `lib/rules/heightGoal.test.ts` (mới)

**Interfaces:**

- Consumes: `ADULT_HEIGHT` (Task 2); `zScore`, `valueAtZ`, `lmsAt`; `LmsRow`, `WhoSex`.
- Produces: `formatCm`, `ParentalRange`, `midParental`, `targetZ`, `targetCurve`, `GoalStatus`, `goalStatus`, `targetVsRange`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/lib/rules/heightGoal.test.ts b/lib/rules/heightGoal.test.ts
new file mode 100644
index 0000000..19df534
--- /dev/null
+++ b/lib/rules/heightGoal.test.ts
@@ -0,0 +1,199 @@
+import { describe, expect, it } from "vitest";
+import type { LmsRow } from "@/lib/content/who";
+import {
+  goalStatus,
+  midParental,
+  targetCurve,
+  targetVsRange,
+  targetZ,
+} from "./heightGoal";
+
+// L = 1, M = 16, S = 1/8 on every day: the value at z is 16 + 2z.
+const FLAT: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+  d,
+  1,
+  16,
+  0.125,
+]);
+
+// Spec 2026-11-25 §6.2.
+describe("midParental", () => {
+  it("a boy: the parents' mean plus 6,5, and a range of 8,5 either side, in whole cm", () => {
+    expect(midParental(175, 160, "boys")).toEqual({
+      mid: 174,
+      low: 166,
+      high: 183,
+    });
+  });
+
+  it("a girl: the parents' mean minus 6,5", () => {
+    expect(midParental(175, 160, "girls")).toEqual({
+      mid: 161,
+      low: 153,
+      high: 170,
+    });
+  });
+
+  it("keeps the middle as it is and rounds the two ends half up", () => {
+    // mid 174,25: 165,75 → 166 and 182,75 → 183.
+    expect(midParental(175.5, 160, "boys")).toEqual({
+      mid: 174.25,
+      low: 166,
+      high: 183,
+    });
+    // mid 173,5: 165 and 182 exactly.
+    expect(midParental(174, 160, "boys")).toEqual({
+      mid: 173.5,
+      low: 165,
+      high: 182,
+    });
+  });
+});
+
+describe("targetZ", () => {
+  it("is 0 at the median adult of the WHO reference", () => {
+    expect(targetZ(176.5432, "boys")).toBeCloseTo(0, 9);
+    expect(targetZ(163.1548, "girls")).toBeCloseTo(0, 9);
+  });
+
+  it("180 cm is about half a deviation above the median man, far above the median woman", () => {
+    expect(targetZ(180, "boys")).toBeCloseTo(0.4737, 3);
+    expect(targetZ(180, "girls")).toBeCloseTo(2.5756, 3);
+  });
+
+  it("a target below the median is negative", () => {
+    expect(targetZ(170, "boys")).toBeLessThan(0);
+  });
+});
+
+describe("targetCurve", () => {
+  it("is the length at that z on each day, from birth, one point per step", () => {
+    expect(targetCurve(FLAT, 1, 21, 7)).toEqual([
+      { day: 0, value: 18 },
+      { day: 7, value: 18 },
+      { day: 14, value: 18 },
+      { day: 21, value: 18 },
+    ]);
+  });
+
+  it("follows the table as the median grows", () => {
+    const growing: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+      d,
+      1,
+      50 + d,
+      0.1,
+    ]);
+    expect(targetCurve(growing, -1, 10, 10)).toEqual([
+      { day: 0, value: 45 },
+      { day: 10, value: 54 },
+    ]);
+  });
+
+  it("stops where the WHO table stops", () => {
+    const points = targetCurve(FLAT, 0, 3000, 500);
+    expect(points.map((point) => point.day)).toEqual([0, 500, 1000, 1500]);
+  });
+});
+
+describe("goalStatus", () => {
+  // The target line sits at 16 on every day (z 0).
+  const at = (value: number) =>
+    goalStatus({ reading: { value, ageDays: 76 }, z: 0, table: FLAT });
+
+  it("within 1 cm of the line: close to it, on track", () => {
+    for (const value of [15.1, 16, 16.9])
+      expect(at(value)).toEqual({
+        text: "Sát đường mục tiêu",
+        short: "đang đúng hướng",
+        chip: { text: "Đang đúng hướng", tone: "good" },
+        diff: Math.round((value - 16) * 10) / 10,
+      });
+  });
+
+  it("a hair under the line is a difference of 0, never minus zero", () => {
+    expect(Object.is(at(15.96).diff, 0)).toBe(true);
+  });
+
+  it("1 cm or more above the line: says by how much, on track", () => {
+    expect(at(17)).toEqual({
+      text: "Trên đường mục tiêu 1,0 cm",
+      short: "đang đúng hướng",
+      chip: { text: "Đang đúng hướng", tone: "good" },
+      diff: 1,
+    });
+    expect(at(18.25).text).toBe("Trên đường mục tiêu 2,3 cm");
+  });
+
+  it("1 cm or more below the line: says by how much, in a neutral chip, never a warning", () => {
+    expect(at(15)).toEqual({
+      text: "Dưới đường mục tiêu 1,0 cm",
+      short: "dưới đường mục tiêu 1,0 cm",
+      chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
+      diff: -1,
+    });
+    expect(at(12.6).text).toBe("Dưới đường mục tiêu 3,4 cm");
+  });
+
+  it("reads the line at the z of the target and the age of the measurement", () => {
+    const growing: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+      d,
+      1,
+      50 + d,
+      0.1,
+    ]);
+    // Day 10, z +1: 60 × 1,1 = 66.
+    expect(
+      goalStatus({
+        reading: { value: 64.5, ageDays: 10 },
+        z: 1,
+        table: growing,
+      }).text,
+    ).toBe("Dưới đường mục tiêu 1,5 cm");
+  });
+
+  it("no length inside the WHO table yet: says so, with no chip", () => {
+    expect(goalStatus({ reading: null, z: 0, table: FLAT })).toEqual({
+      text: "Chưa có lần đo chiều dài",
+      short: "chưa có lần đo chiều dài",
+      chip: null,
+      diff: null,
+    });
+    expect(
+      goalStatus({ reading: { value: 110, ageDays: 1857 }, z: 0, table: FLAT })
+        .chip,
+    ).toBeNull();
+  });
+});
+
+describe("targetVsRange", () => {
+  const range = { mid: 174, low: 166, high: 183 };
+
+  it("above the range: still followed, but hard to reach", () => {
+    expect(targetVsRange(185, range)).toBe(
+      "Mục tiêu 185 cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt.",
+    );
+  });
+
+  it("below the range", () => {
+    expect(targetVsRange(165.5, range)).toBe(
+      "Mục tiêu 165,5 cm thấp hơn khoảng dự kiến.",
+    );
+  });
+
+  it("inside the range: the upper half from the middle up, the lower half below it", () => {
+    expect(targetVsRange(180, range)).toBe(
+      "Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.",
+    );
+    expect(targetVsRange(174, range)).toBe(
+      "Mục tiêu 174 cm nằm trong khoảng, ở nửa trên.",
+    );
+    expect(targetVsRange(173.9, range)).toBe(
+      "Mục tiêu 173,9 cm nằm trong khoảng, ở nửa dưới.",
+    );
+  });
+
+  it("the two ends of the range are inside it", () => {
+    expect(targetVsRange(183, range)).toContain("nằm trong khoảng");
+    expect(targetVsRange(166, range)).toContain("nằm trong khoảng");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 173 passed (174)`, `Tests  1397 passed (1397)`. File test mới không chạy được test nào vì chưa có `./heightGoal`.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/lib/rules/heightGoal.ts b/lib/rules/heightGoal.ts
new file mode 100644
index 0000000..3260031
--- /dev/null
+++ b/lib/rules/heightGoal.ts
@@ -0,0 +1,115 @@
+import { ADULT_HEIGHT } from "@/lib/content/adultHeight";
+import type { LmsRow, WhoSex } from "@/lib/content/who";
+import { lmsAt, valueAtZ, zScore } from "./growth";
+
+// Spec 2026-11-25 §6.2. Every function here is pure.
+
+const upToOneDecimal = new Intl.NumberFormat("vi-VN", {
+  maximumFractionDigits: 1,
+});
+const oneDecimal = new Intl.NumberFormat("vi-VN", {
+  minimumFractionDigits: 1,
+  maximumFractionDigits: 1,
+});
+// To one decimal, half up. The `+ 0` turns a rounded −0 into 0, which would
+// otherwise be written "-0,0".
+const tenth = (n: number) => Math.round(n * 10) / 10 + 0;
+
+// "180", "165,5": a height as the family typed it.
+export const formatCm = (cm: number) => upToOneDecimal.format(cm);
+
+// The range a child's adult height is expected to fall in, from the parents'
+// heights. `mid` is kept as it is; the two ends are whole centimetres, and
+// every comparison with the range uses these rounded ends.
+export type ParentalRange = { mid: number; low: number; high: number };
+
+export function midParental(
+  father: number,
+  mother: number,
+  sex: WhoSex,
+): ParentalRange {
+  const mid = (father + mother + (sex === "boys" ? 13 : -13)) / 2;
+  return { mid, low: Math.round(mid - 8.5), high: Math.round(mid + 8.5) };
+}
+
+// Where an adult of that height stands in the WHO reference at 19 years.
+export function targetZ(target: number, sex: WhoSex): number {
+  return zScore(ADULT_HEIGHT[sex], target);
+}
+
+// The length, on each day of age, of a child who keeps that position on the
+// WHO chart. Stops where the table stops.
+export function targetCurve(
+  table: LmsRow[],
+  z: number,
+  toDay: number,
+  step: number,
+): { day: number; value: number }[] {
+  const points: { day: number; value: number }[] = [];
+  const every = Math.max(1, Math.floor(step));
+  for (let day = 0; day <= toDay; day += every) {
+    const lms = lmsAt(table, day);
+    if (!lms) break;
+    points.push({ day, value: valueAtZ(lms, z) });
+  }
+  return points;
+}
+
+export type GoalStatus = {
+  // "Sát đường mục tiêu", "Trên đường mục tiêu 1,2 cm", …
+  text: string;
+  // The same after "Mục tiêu {t} cm: " on the Sức khỏe page (§6.4).
+  short: string;
+  // Below the line is said in a neutral chip: it is not a warning.
+  chip: { text: string; tone: "good" | "neutral" } | null;
+  // The newest length minus the target line on that day, to one decimal; null
+  // without a length the WHO table can place.
+  diff: number | null;
+};
+
+const NO_LENGTH = "Chưa có lần đo chiều dài";
+const ON_TRACK = { text: "Đang đúng hướng", tone: "good" } as const;
+
+export function goalStatus(input: {
+  // The newest length inside the WHO table (see `readings`), or null.
+  reading: { value: number; ageDays: number } | null;
+  z: number;
+  table: LmsRow[];
+}): GoalStatus {
+  const lms = input.reading ? lmsAt(input.table, input.reading.ageDays) : null;
+  if (!input.reading || !lms)
+    return {
+      text: NO_LENGTH,
+      short: NO_LENGTH.toLocaleLowerCase("vi"),
+      chip: null,
+      diff: null,
+    };
+  const diff = tenth(input.reading.value - valueAtZ(lms, input.z));
+  if (diff <= -1) {
+    const text = `Dưới đường mục tiêu ${oneDecimal.format(-diff)} cm`;
+    return {
+      text,
+      short: text.toLocaleLowerCase("vi"),
+      chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
+      diff,
+    };
+  }
+  return {
+    text:
+      diff >= 1
+        ? `Trên đường mục tiêu ${oneDecimal.format(diff)} cm`
+        : "Sát đường mục tiêu",
+    short: "đang đúng hướng",
+    chip: ON_TRACK,
+    diff,
+  };
+}
+
+// How the family's target compares with the range from the parents' heights.
+export function targetVsRange(target: number, range: ParentalRange): string {
+  const t = formatCm(target);
+  if (target > range.high)
+    return `Mục tiêu ${t} cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt.`;
+  if (target < range.low) return `Mục tiêu ${t} cm thấp hơn khoảng dự kiến.`;
+  return `Mục tiêu ${t} cm nằm trong khoảng, ở nửa ${target >= range.mid ? "trên" : "dưới"}.`;
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  174 passed (174)`, `Tests  1416 passed (1416)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/heightGoal.ts lib/rules/heightGoal.test.ts
git commit -m "feat(height): the parents' range, the target line and where the baby stands against it" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Luật: tốc độ tăng chiều dài và form mục tiêu (§6.2, §6.5)

**Files:**

- Modify: `lib/rules/heightGoal.ts`
- Test: `lib/rules/heightGoal.test.ts`

**Interfaces:**

- Consumes: `readings`, `GrowthMeasure` (`lib/rules/growthAlerts.ts`); `formatCm` (Task 3).
- Produces: `LengthVelocity`, `lengthVelocity`, `HeightGoalRaw`, `HeightGoalInput`, `HeightGoalErrors`, `parseHeightGoal`, `heightGoalRaw`.

- [x] **Step 1: Viết test đỏ (Patch 7)**

```diff
diff --git a/lib/rules/heightGoal.test.ts b/lib/rules/heightGoal.test.ts
index 19df534..538d140 100644
--- a/lib/rules/heightGoal.test.ts
+++ b/lib/rules/heightGoal.test.ts
@@ -1,8 +1,13 @@
 import { describe, expect, it } from "vitest";
 import type { LmsRow } from "@/lib/content/who";
+import { addDays } from "./days";
+import type { GrowthMeasure } from "./growthAlerts";
 import {
   goalStatus,
+  heightGoalRaw,
+  lengthVelocity,
   midParental,
+  parseHeightGoal,
   targetCurve,
   targetVsRange,
   targetZ,
@@ -197,3 +202,160 @@ describe("targetVsRange", () => {
     expect(targetVsRange(166, range)).toContain("nằm trong khoảng");
   });
 });
+
+describe("lengthVelocity", () => {
+  const DOB = "2026-01-01";
+  // The median grows 1/8 cm a day from 50: 3,8 cm a month.
+  const GROWING: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
+    d,
+    1,
+    50 + d / 8,
+    0.1,
+  ]);
+  const length = (age: number, cm: number | null): GrowthMeasure => ({
+    measured_on: addDays(DOB, age),
+    weight_g: 5000,
+    length_cm: cm,
+    head_cm: null,
+  });
+  const run = (rows: GrowthMeasure[]) => lengthVelocity(rows, GROWING, DOB);
+
+  it("cm a month between the newest length and the nearest one at least 14 days before", () => {
+    // 2 cm in 16 days is 3,8 cm a month, exactly what is usual.
+    expect(run([length(56, 59), length(40, 57), length(10, 52)])).toEqual({
+      rate: "3,8",
+      expected: "3,8",
+      from: addDays(DOB, 40),
+      to: addDays(DOB, 56),
+      chip: { text: "Tăng tốt", tone: "good" },
+    });
+  });
+
+  it("a length less than 14 days before is skipped for an older one", () => {
+    const speed = run([length(56, 59), length(43, 58.5), length(40, 57)]);
+    expect(speed?.from).toBe(addDays(DOB, 40));
+    expect(run([length(56, 59), length(42, 58)])?.from).toBe(addDays(DOB, 42));
+  });
+
+  it("at three quarters of the usual speed it is still good; just under, slower than usual", () => {
+    // Usual over 16 days: 2 cm. Three quarters of that: 1,5 cm.
+    expect(run([length(56, 58.5), length(40, 57)])?.chip).toEqual({
+      text: "Tăng tốt",
+      tone: "good",
+    });
+    expect(run([length(56, 58.4), length(40, 57)])).toMatchObject({
+      rate: "2,7",
+      expected: "3,8",
+      chip: { text: "Chậm hơn thường gặp", tone: "neutral" },
+    });
+  });
+
+  it("a length that barely moved reads 0,0, never minus zero", () => {
+    expect(run([length(56, 56.98), length(40, 57)])).toMatchObject({
+      rate: "0,0",
+      chip: { text: "Chậm hơn thường gặp", tone: "neutral" },
+    });
+  });
+
+  it("rows without a length are not measurements of length", () => {
+    expect(
+      run([length(56, null), length(50, 59), length(30, 56)]),
+    ).toMatchObject({ from: addDays(DOB, 30), to: addDays(DOB, 50) });
+  });
+
+  it("is null without two lengths at least 14 days apart", () => {
+    expect(run([])).toBeNull();
+    expect(run([length(56, 59)])).toBeNull();
+    expect(run([length(56, 59), length(43, 58)])).toBeNull();
+  });
+
+  it("a length outside the WHO table is left out", () => {
+    expect(run([length(1857, 110), length(1800, 108)])).toBeNull();
+  });
+});
+
+describe("parseHeightGoal", () => {
+  const RANGE = "Chiều cao từ 120 đến 220 cm.";
+
+  it("three heights, with a comma or a point", () => {
+    expect(
+      parseHeightGoal({ father: "175", mother: "160,5", target: "180.0" }),
+    ).toEqual({
+      ok: true,
+      value: {
+        father_height_cm: 175,
+        mother_height_cm: 160.5,
+        target_height_cm: 180,
+      },
+    });
+  });
+
+  it("all three empty is valid: it clears the goal", () => {
+    expect(parseHeightGoal({ father: " ", mother: "", target: "" })).toEqual({
+      ok: true,
+      value: {
+        father_height_cm: null,
+        mother_height_cm: null,
+        target_height_cm: null,
+      },
+    });
+  });
+
+  it("the target may be set or left empty on its own", () => {
+    expect(
+      parseHeightGoal({ father: "", mother: "", target: "180" }),
+    ).toMatchObject({ ok: true, value: { target_height_cm: 180 } });
+    expect(
+      parseHeightGoal({ father: "175", mother: "160", target: "" }),
+    ).toMatchObject({ ok: true, value: { target_height_cm: null } });
+  });
+
+  it("father and mother go together: the empty one carries the error", () => {
+    expect(parseHeightGoal({ father: "175", mother: "", target: "" })).toEqual({
+      ok: false,
+      errors: { mother: "Nhập cả bố và mẹ." },
+    });
+    expect(
+      parseHeightGoal({ father: "", mother: "160", target: "180" }),
+    ).toEqual({ ok: false, errors: { father: "Nhập cả bố và mẹ." } });
+  });
+
+  it("each height stays within 120–220 cm", () => {
+    expect(
+      parseHeightGoal({ father: "119,9", mother: "220,1", target: "abc" }),
+    ).toEqual({
+      ok: false,
+      errors: { father: RANGE, mother: RANGE, target: RANGE },
+    });
+    expect(
+      parseHeightGoal({ father: "120", mother: "220", target: "120" }).ok,
+    ).toBe(true);
+  });
+
+  it("a height out of range is not also asked for its partner", () => {
+    expect(parseHeightGoal({ father: "300", mother: "", target: "" })).toEqual({
+      ok: false,
+      errors: { father: RANGE },
+    });
+  });
+
+  it("rounds to one decimal", () => {
+    expect(
+      parseHeightGoal({ father: "175,25", mother: "160,04", target: "" }),
+    ).toMatchObject({
+      value: { father_height_cm: 175.3, mother_height_cm: 160 },
+    });
+  });
+});
+
+describe("heightGoalRaw", () => {
+  it("fills the form from the profile, with a comma, empty where nothing is stored", () => {
+    expect(
+      heightGoalRaw({
+        father_height_cm: 175,
+        mother_height_cm: 160.5,
+        target_height_cm: null,
+      }),
+    ).toEqual({ father: "175", mother: "160,5", target: "" });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 173 passed (174)`, `Tests  15 failed | 1416 passed (1431)`. Lý do đỏ: chưa có `lengthVelocity`, `parseHeightGoal`, `heightGoalRaw`.

- [x] **Step 3: Viết code (Patch 8)**

```diff
diff --git a/lib/rules/heightGoal.ts b/lib/rules/heightGoal.ts
index 3260031..137cfaa 100644
--- a/lib/rules/heightGoal.ts
+++ b/lib/rules/heightGoal.ts
@@ -1,6 +1,7 @@
 import { ADULT_HEIGHT } from "@/lib/content/adultHeight";
 import type { LmsRow, WhoSex } from "@/lib/content/who";
 import { lmsAt, valueAtZ, zScore } from "./growth";
+import { type GrowthMeasure, readings } from "./growthAlerts";

 // Spec 2026-11-25 §6.2. Every function here is pure.

@@ -113,3 +114,110 @@ export function targetVsRange(target: number, range: ParentalRange): string {
   if (target < range.low) return `Mục tiêu ${t} cm thấp hơn khoảng dự kiến.`;
   return `Mục tiêu ${t} cm nằm trong khoảng, ở nửa ${target >= range.mid ? "trên" : "dưới"}.`;
 }
+
+const DAYS_PER_MONTH = 30.4375;
+const VELOCITY_MIN_DAYS = 14;
+// Below three quarters of what is usual the chip says so, in a neutral tone.
+const VELOCITY_GOOD_SHARE = 0.75;
+
+export type LengthVelocity = {
+  // cm a month, to one decimal: the baby, and the WHO median over the same days.
+  rate: string;
+  expected: string;
+  // measured_on of the two lengths compared.
+  from: string;
+  to: string;
+  chip: { text: string; tone: "good" | "neutral" };
+};
+
+// The newest length against the nearest one at least 14 days before it. Null
+// without two such lengths inside the WHO table.
+export function lengthVelocity(
+  rows: GrowthMeasure[],
+  table: LmsRow[],
+  dob: string,
+): LengthVelocity | null {
+  const [latest, ...older] = readings(rows, table, dob, "lhfa");
+  const before = older.find(
+    (reading) => latest.ageDays - reading.ageDays >= VELOCITY_MIN_DAYS,
+  );
+  if (!latest || !before) return null;
+  const days = latest.ageDays - before.ageDays;
+  const rate = ((latest.value - before.value) / days) * DAYS_PER_MONTH;
+  const expected = ((latest.median - before.median) / days) * DAYS_PER_MONTH;
+  return {
+    rate: oneDecimal.format(tenth(rate)),
+    expected: oneDecimal.format(tenth(expected)),
+    from: before.day,
+    to: latest.day,
+    // Compared before rounding.
+    chip:
+      rate >= VELOCITY_GOOD_SHARE * expected
+        ? { text: "Tăng tốt", tone: "good" }
+        : { text: "Chậm hơn thường gặp", tone: "neutral" },
+  };
+}
+
+// Spec §6.5: the sheet "Mục tiêu và chiều cao bố mẹ".
+export type HeightGoalRaw = { father: string; mother: string; target: string };
+
+export type HeightGoalInput = {
+  father_height_cm: number | null;
+  mother_height_cm: number | null;
+  target_height_cm: number | null;
+};
+
+export type HeightGoalErrors = Partial<Record<keyof HeightGoalRaw, string>>;
+
+const HEIGHT_MIN = 120;
+const HEIGHT_MAX = 220;
+const HEIGHT_RANGE = "Chiều cao từ 120 đến 220 cm.";
+const BOTH_PARENTS = "Nhập cả bố và mẹ.";
+
+// Vietnamese keyboards type "175,5"; both "," and "." are accepted.
+function height(raw: string): number | null | "bad" {
+  const text = raw.trim().replace(",", ".");
+  if (text === "") return null;
+  if (!/^\d+(\.\d+)?$/.test(text)) return "bad";
+  const value = Number(text);
+  return value < HEIGHT_MIN || value > HEIGHT_MAX ? "bad" : tenth(value);
+}
+
+export function parseHeightGoal(
+  raw: HeightGoalRaw,
+):
+  | { ok: true; value: HeightGoalInput }
+  | { ok: false; errors: HeightGoalErrors } {
+  const father = height(raw.father);
+  const mother = height(raw.mother);
+  const target = height(raw.target);
+  const errors: HeightGoalErrors = {};
+  if (father === "bad") errors.father = HEIGHT_RANGE;
+  if (mother === "bad") errors.mother = HEIGHT_RANGE;
+  if (target === "bad") errors.target = HEIGHT_RANGE;
+  // Father and mother are entered together or not at all.
+  if (typeof father === "number" && mother === null)
+    errors.mother = BOTH_PARENTS;
+  if (typeof mother === "number" && father === null)
+    errors.father = BOTH_PARENTS;
+  if (father === "bad" || mother === "bad" || target === "bad")
+    return { ok: false, errors };
+  if (Object.keys(errors).length > 0) return { ok: false, errors };
+  return {
+    ok: true,
+    value: {
+      father_height_cm: father,
+      mother_height_cm: mother,
+      target_height_cm: target,
+    },
+  };
+}
+
+export function heightGoalRaw(baby: HeightGoalInput): HeightGoalRaw {
+  const text = (cm: number | null) => (cm === null ? "" : formatCm(cm));
+  return {
+    father: text(baby.father_height_cm),
+    mother: text(baby.mother_height_cm),
+    target: text(baby.target_height_cm),
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  174 passed (174)`, `Tests  1431 passed (1431)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/heightGoal.ts lib/rules/heightGoal.test.ts
git commit -m "feat(height): the speed of growth in length, and the goal form" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 5: Kiểm cuối M3a, hỏi người dùng về migration và về `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; migration ở DB thật nếu người dùng đồng ý.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  174 passed (174)`, `Tests  1431 passed (1431)`.

Run: `bun run db:reset && bun run db:test`
Expected: `Files=14, Tests=156`, `Result: PASS`. Nếu Docker không chạy được thì ghi lại như mục "pgTAP cần Docker".

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Hỏi người dùng rồi mới áp migration lên DB thật**

Đây là bước duy nhất của plan chạm vào Supabase thật. Migration chỉ thêm 3 cột nullable, không có default, nên bản web đang chạy không bị ảnh hưởng. Hỏi người dùng đúng câu sau và chờ trả lời trong phiên:

> Migration `20261125000100_height_goal.sql` thêm 3 cột nullable vào bảng `babies` (chiều cao bố, chiều cao mẹ, mục tiêu; không xóa, không đổi cột nào, không đổi policy). pgTAP 014 trên Supabase local: [đạt / chưa chạy được vì Docker]. Tôi chạy `bunx supabase db push` lên project thật bây giờ được không?

**Người dùng không đồng ý, hoặc chưa trả lời:** dừng bước này, không chạy lệnh nào bên dưới, để ô này chưa tick và ghi "Chờ người dùng: db push `20261125000100_height_goal.sql`" vào báo cáo cuối. Step 4 vẫn làm được. Nếu người dùng đồng ý muộn: chạy các lệnh lúc đó, tick ô này trên nhánh đang đứng và commit file plan này.

**Người dùng đồng ý:**

Run: `bunx supabase db push --dry-run`
Expected: danh sách migration sẽ áp chỉ có `20261125000100_height_goal.sql`. Nếu có thêm migration nào khác, dừng và báo người dùng, không push.

Run: `bunx supabase db push --yes`
Expected: `Applying migration 20261125000100_height_goal.sql...`, rồi `Finished supabase db push.` Nếu CLI đòi mật khẩu DB hoặc báo chưa link project: dừng, không tự nhập mật khẩu, ghi vào báo cáo là việc người dùng tự làm.

Run: `bunx supabase db push --dry-run`
Expected: `Remote database is up to date.`

- [x] **Step 4: Commit phần ghi kết quả rồi dừng lại hỏi người dùng về `main`**

Ghi kết quả của Step 1 đến Step 3 ngay dưới bước này, rồi:

```bash
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m3a.md
git commit -m "docs(plan): record the M3a check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, pgTAP, build; migration đã ở DB thật hay còn chờ; nói rõ plan này không đổi gì trên màn hình nên không có bước kiểm trình duyệt. Hỏi người dùng có đưa nhánh lên `main` không (được cả khi migration còn chờ: Diễn giải spec, mục 11). Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m3a
git push origin main
```

**Kết quả kiểm M3a (2026-11-25, nhánh `feat/kim-bun-suc-khoe-m3a` @ `eef1cf2`):**

- **Patch:** cả 8 patch áp sạch bằng `kb_patch`, không sửa tay. Số đỏ và xanh của Task 1 đến Task 4 đúng từng dòng `Expected`.
- **Step 1, typecheck và vitest:** `tsc --noEmit` không báo lỗi; `Test Files  174 passed (174)`, `Tests  1431 passed (1431)`.
- **Step 1, pgTAP (Supabase local trong OrbStack):** đỏ ở Task 1 Step 2 (`Failed 21/21 subtests`, `Bad plan.  You planned 21 tests but ran 18.`, `Files=14, Tests=153`, `Result: FAIL`); xanh sau migration và xanh lại ở Task 5 (`001`…`014` `ok`, `All tests successful.`, `Files=14, Tests=156`, `Result: PASS`). `bun run db:types` ra file trùng SHA-256 với file của Patch 2 (`1 file changed, 3 insertions(+), 3 deletions(-)`). Sau đó đã chạy `bunx supabase stop` và thoát OrbStack.
- **Step 2, build:** lần đầu dừng với `SecurityFatalError` của Next.js 16.4.3 (cảnh báo bảo mật đã biết; không chạy `next upgrade`). Lần hai: `✓ Compiled successfully`, `✓ Generating static pages using 9 workers (39/39)`, thoát mã 0.
- **Step 3, migration ở DB thật:** người dùng đồng ý trong phiên ("Được, chạy db push"). `bunx supabase db push --dry-run` chỉ liệt kê `20261125000100_height_goal.sql`; `bunx supabase db push --yes` in `Applying migration 20261125000100_height_goal.sql...` rồi `Finished supabase db push.`; dry-run lần hai: `Remote database is up to date.` CLI không đòi mật khẩu. Ngoài migration này không ghi gì lên dữ liệu thật.
- **Ghi chú cho plan sau:** Supabase CLI 2.122.0 cảnh báo `db push` sẽ mặc định nhắm DB local ở bản major tới; khi đó phải thêm `--linked` để vẫn nhắm project thật.
- **Step 4:** không có bước kiểm trình duyệt (plan này không đổi gì trên màn hình). Việc đưa nhánh lên `main` chờ người dùng trả lời; ba lệnh `git checkout main`, `merge --ff-only`, `push origin main` chưa chạy lúc ghi dòng này.
