# Kim Bun — Đợt ốm M2a: bảng illness_episodes và outbox Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§4.1; §4.2 trừ `fetchLogsBetween` và `useRangeLogs`; phần "Outbox" của §10.1; `017_illness_episodes.test.sql` của §10.2)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** DB có bảng `illness_episodes`, và app biết xếp hàng chờ, gửi lên server và đọc về một đợt ốm. Chưa có gì mới trên màn hình.

**Architecture:**

- **DB:** một migration tạo bảng, ràng buộc không cho hai đợt của một bé chồng giờ (`exclude using gist`, cần extension `btree_gist`), hai trigger và bốn policy; có test pgTAP riêng.
- **Outbox:** bảng mới đi cùng đường với `growth`: phần thuần ở `lib/data/outboxCore.ts`, hàng chờ ở `lib/data/outbox.ts`, phần gửi ở `lib/data/outboxDeps.ts`, và việc tải lại sau khi gửi ở `components/sync/OutboxSync.tsx`. Mã lỗi `23P01` của ràng buộc được bỏ với một câu riêng.
- **Lớp dữ liệu:** file mới `lib/data/illness.ts` có `useEpisodes` và `useEpisodeActions`.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, TanStack Query, Dexie, Supabase (Postgres, pgTAP), Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m2a`, cắt từ `main` @ `4f50586`. Baseline: 1695 test vitest xanh (186 file), typecheck sạch, pgTAP 001–016 (16 file, 166 test). (Dòng cuối của Global Constraints ghi baseline lúc viết spec; con số ở đây là của `main` hiện tại.)

**Các mốc của spec này:**

| Mốc | Nội dung                                                                                                                                   | Plan                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| M1a | §3.1, §3.2, phần luật của §3.3 và §3.4: loại bản ghi `symptom`                                                                             | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md` (đã ở `main`) |
| M1b | phần còn lại của §3: phiếu Triệu chứng                                                                                                     | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1b.md` (đã ở `main`) |
| M2a | §4.1 và §4.2 trừ phần đọc bản ghi theo khoảng: bảng `illness_episodes`, pgTAP 017, outbox, `useEpisodes`. Chưa có gì hiện ra màn hình.     | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md`               |
| M2b | §4.3, §5.1–5.3, §5.7: luật thuần trong `lib/rules/illness.ts`. Chưa có gì hiện ra màn hình.                                                | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2b.md`               |
| M2c | §6.5: mô hình và hình vẽ biểu đồ sốt. Chỉ thấy trên trang tạm.                                                                             | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2c.md`               |
| M2d | chữ của §6.2 và §6.3; thẻ kết luận, ba nút ghi nhanh, danh sách từng ngày; `EmptyState` có dòng phụ và đường dẫn. Chỉ thấy trên trang tạm. | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2d.md`               |
| M2e | phần còn lại của §4.2 (`useRangeLogs`) và §6.4: luật và phiếu "Sửa đợt ốm". Chỉ thấy trên trang tạm.                                       | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2e.md`               |
| M2f | §6.1–6.3: trang `/dot-om` và `/dot-om/chi-tiet`. Mở được bằng địa chỉ, chưa có lối vào.                                                    | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2f.md`               |
| M2g | lối vào: dòng "Đợt ốm" ở Sức khỏe, hai trang trong service worker, Bước 38 của checklist                                                   | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2g.md`               |
| M3  | §5.5, §5.6, §7: tab Hôm nay                                                                                                                | chưa viết                                                             |
| M4  | §5.4, §9: so sánh và Báo cáo                                                                                                               | chưa viết                                                             |
| M5  | §8: lần khám                                                                                                                               | chưa viết                                                             |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M2 cắt làm bảy plan** (M2a đến M2g, bảng trên) vì một plan sẽ dài gần 9.000 dòng. Sau mỗi plan app vẫn chạy như cũ và đẩy lên `main` được riêng; M2f có hai trang nhưng chỉ mở được bằng địa chỉ, M2g mới đưa lối vào ra cho người dùng.
2. **Phần đọc bản ghi theo khoảng của §4.2** (`fetchLogsBetween`, `useRangeLogs`) nằm ở M2e, để plan này không quá dài. Plan này không cần tới nó.
3. **`useEpisodeActions().start` nhận `{ startedAt }`, tự tạo `id` bằng `crypto.randomUUID()` và trả `id` đó về**, để trang danh sách mở được trang chi tiết của đợt vừa tạo (§6.2). `update` nhận `{ id, patch }`, patch chỉ gồm cột đổi; `ended_at: null` là mở lại.
4. **Lớp dữ liệu không kiểm giờ.** Các kiểm của §5.7 là luật (M2b) và do màn hình gọi trước khi ghi; server là nơi quyết định cuối.
5. **Khóa cache là `["illness-episodes", babyId]`.** Spec chỉ đặt tên hàm `episodesKey`.
6. **Thêm mới là upsert `ignoreDuplicates` theo `id`**, như `growth`: gửi lại sau khi mất phản hồi không ghi đè hàng đã có.
7. **Sửa mà server trả 0 hàng** (đợt đã bị xóa ở máy khác): thay đổi bị bỏ với câu chung của outbox "Bạn không có quyền thực hiện thao tác này", như `growth`. Spec không có câu riêng cho trường hợp này.
8. **Sau mỗi lần outbox gửi xong, danh sách đợt ốm được tải lại** như `logs`, `growth` và các danh sách khác; nhờ vậy một đợt bị server từ chối (trùng thời gian) biến khỏi màn hình ngay, không chờ lần tải lại sau 60 giây. Spec không nhắc tới chỗ này. Danh sách khóa được gom thành hằng `REFRESH_AFTER_FLUSH` để có test; `OutboxSync` chỉ đổi từ năm dòng gọi sang một vòng lặp.
9. **Không có index riêng.** Ràng buộc `exclude` tự tạo một index GiST trên `(baby_id, khoảng thời gian)`; bảng chỉ có vài hàng mỗi bé.
10. **Không có bước trình duyệt.** Plan này không đổi gì trên màn hình; kiểm bằng test, typecheck, build và pgTAP.
11. **pgTAP có ba kiểm ngoài danh sách của §10.2:** bảng không nằm trong realtime (§4.1), bé khác của cùng gia đình có đợt mở cùng lúc được, và xóa bé thì đợt ốm mất theo.
12. **Áp migration lên Supabase thật.** Global Constraints (chép nguyên văn spec) ghi plan dừng lại cho người dùng tự chạy. Theo lời đồng ý trước ngày 2026-11-26, phiên thực thi tự chạy `--dry-run`, và chỉ khi nó liệt kê đúng một migration mong đợi thì tự chạy `db push`; bị chặn hoặc bị hỏi mật khẩu thì quay về đúng cách của spec: đưa lệnh cho người dùng (Task 4 Step 4).
13. **Nếu ràng buộc `exclude using gist` không tạo được** thì dừng và báo, không đổi cách (spec §4.1).

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `4f50586`; bản sao đó dùng `node_modules` của repo qua một symlink, và symlink ấy không nằm trong patch nào. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. pgTAP của Task 1 đã chạy đỏ rồi xanh trên Supabase local. `bun run build` đã chạy xanh một lần trên bản sao có đủ cả bảy plan của M2, chưa chạy riêng cho plan này. Chưa chạy: `supabase db push` lên DB thật.
- **pgTAP cần Docker.** Trên máy này Docker là OrbStack và mặc định không chạy: `open -a OrbStack`, chờ `docker info` trả về, rồi mới `bun run db:start`. Volume của Supabase local dùng chung cho mọi bản sao của repo (project id `bun-kid`), nên bước đỏ phải chạy `bun run db:reset` trước. Xong thì `bunx supabase stop` và tắt OrbStack nếu chính phiên này đã bật nó.
- **Không chạy prettier lên `lib/supabase/types.ts`.** File đó là đầu ra nguyên dạng của `bun run db:types`.
- **Người dùng muốn màn hình gọn, ít số.** Không thêm chữ nào ngoài plan.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm màu, token hay icon. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bấm "Bắt đầu đợt ốm", "Bé đã khỏi", "Mở lại đợt ốm", "Xóa đợt ốm", không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `content/triage.vi.json` và `docs/device-checklist.md`.** Hai file đó từ trước đã không theo prettier.
- **Các file plan của M2 chưa được commit.** `git status` sẽ thấy các file `…-dot-om-m2a.md` đến `…-m2g.md` chưa chạy là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng đầu của M2. M2b không dùng gì của plan này (luật thuần). M2e, M2f và M3 dùng lớp dữ liệu dưới mục Produces; M5 dùng `unique (id, baby_id)` cho khóa ngoại của `illness_visits`.

**Consumes (đã ở `main`):** `OutboxEntry`, `OutboxOp`, `entriesFor`, `classifyFailure`, `overlayPending` (`lib/data/outboxCore.ts`); `localDb` (`lib/data/localDb.ts`); `flushRequests` (`lib/data/outboxEvents.ts`); `outboxDeps` (`lib/data/outboxDeps.ts`); `supabase` (`lib/supabase/client.ts`); các hàm SQL `set_updated_at`, `forbid_immutable_change`, `is_member`, `is_owner`, `baby_family`.

**Produces:**

- Migration `supabase/migrations/20261126000200_illness_episodes.sql`: bảng `public.illness_episodes (id uuid, baby_id uuid, started_at timestamptz, ended_at timestamptz null, created_by uuid, created_at, updated_at)`, `unique (id, baby_id)`, ràng buộc `illness_episodes_no_overlap` (mã `23P01`), RLS: mọi thành viên đọc, thêm, sửa; chủ gia đình hoặc người tạo xóa.
- `lib/supabase/rows.ts`: `EpisodeRow` = `{ id: string; baby_id: string; started_at: string; ended_at: string | null; created_by: string; created_at: string; updated_at: string }`.
- `lib/data/outboxCore.ts`: `OutboxEntry["table"]` có `"illness_episodes"`; `applyEpisodeChange(rows: EpisodeRow[], entry: OutboxEntry, nowIso: string): EpisodeRow[]`; `overlayPendingEpisodes(rows: EpisodeRow[], entries: OutboxEntry[], nowIso: string): EpisodeRow[]`; mã `23P01` bị bỏ với câu "Trùng thời gian với một đợt ốm khác".
- `lib/data/outbox.ts`: `EpisodeChange`; `episodesKey(babyId: string)` = `["illness-episodes", babyId]`; `enqueueEpisodeChange(queryClient: QueryClient, change: EpisodeChange): Promise<void>`; `withPendingEpisodes(babyId: string, rows: EpisodeRow[]): Promise<EpisodeRow[]>`; `REFRESH_AFTER_FLUSH` có `["illness-episodes"]`.
- `lib/data/illness.ts`: `EpisodePatch` = `{ started_at?: string; ended_at?: string | null }`; `fetchEpisodes(babyId: string): Promise<EpisodeRow[]>`; `useEpisodes(babyId: string)` (kết quả `useQuery`, `data: EpisodeRow[]` xếp `started_at` giảm dần); `useEpisodeActions(babyId: string, userId: string)` = `{ start, update, remove }` (ba kết quả `useMutation`: `start` nhận `{ startedAt: string }` và trả `id: string`; `update` nhận `{ id: string; patch: EpisodePatch }`; `remove` nhận `id: string`).
- **Vitest sau M2a:** 1721 test, 190 file. **pgTAP sau M2a:** 17 file, 194 test.

---

### Task 1: Bảng `illness_episodes` (§4.1, §10.2)

**Files:**

- Create: `supabase/migrations/20261126000200_illness_episodes.sql`
- Modify: `lib/supabase/types.ts` (sinh lại), `lib/supabase/rows.ts`
- Test: `supabase/tests/017_illness_episodes.test.sql`

**Interfaces:**

- Consumes: `public.babies`, `public.set_updated_at()`, `public.forbid_immutable_change()`, `public.is_member(uuid)`, `public.is_owner(uuid)`, `public.baby_family(uuid)` (các migration `20261113000100_schema.sql` và `20261113000200_rls.sql`).
- Produces: bảng `public.illness_episodes`; ràng buộc `illness_episodes_no_overlap` (mã lỗi `23P01`); `unique (id, baby_id)` cho khóa ngoại của M5; kiểu `EpisodeRow`.

- [x] **Step 0: Tạo nhánh, kiểm điểm xuất phát**

```bash
git checkout main && git pull --ff-only
git rev-parse --short HEAD
git checkout -b feat/kim-bun-dot-om-m2a
bunx vitest run
```

Expected: `Test Files  186 passed (186)`, `Tests  1695 passed (1695)`. `main` đã đi quá `4f50586` (có commit mới) thì vẫn làm tiếp, nhưng mọi con số test trong plan sẽ lệch đi đúng bằng số test mới của các commit đó: ghi lại số xuất phát thật.

- [x] **Step 1: Viết test pgTAP đỏ (Patch 1)**

28 kiểm: bảng và các ràng buộc (chạy bằng quyền chủ DB), rồi RLS với ba người: C ngoài gia đình, B là thành viên, A là chủ gia đình.

```diff
diff --git a/supabase/tests/017_illness_episodes.test.sql b/supabase/tests/017_illness_episodes.test.sql
new file mode 100644
index 0000000..fe09f88
--- /dev/null
+++ b/supabase/tests/017_illness_episodes.test.sql
@@ -0,0 +1,146 @@
+begin;
+create extension if not exists pgtap with schema extensions;
+select plan(28);
+
+insert into auth.users (id, email) values
+  ('aaaaaaaa-0000-0000-0000-000000000017', 'ia@example.com'),
+  ('bbbbbbbb-0000-0000-0000-000000000017', 'ib@example.com'),
+  ('cccccccc-0000-0000-0000-000000000017', 'ic@example.com');
+insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000017', 'Nhà I');
+insert into public.family_members (family_id, email, user_id, role, display_name) values
+  ('f0000000-0000-0000-0000-000000000017', 'ia@example.com', 'aaaaaaaa-0000-0000-0000-000000000017', 'owner', 'Mẹ'),
+  ('f0000000-0000-0000-0000-000000000017', 'ib@example.com', 'bbbbbbbb-0000-0000-0000-000000000017', 'member', 'Bố');
+insert into public.babies (id, family_id, name, dob, sex) values
+  ('ba000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000017', 'Bé', '2026-05-01', 'female'),
+  ('ba000000-0000-0000-0000-000000000117', 'f0000000-0000-0000-0000-000000000017', 'Em', '2026-05-01', 'male');
+
+-- Spec 2026-11-26 §4.1: the table, its checks and the no-overlap constraint.
+select has_table('public', 'illness_episodes', 'illness_episodes exists');
+select lives_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
+     values ('e0000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000017',
+             '2026-11-01 08:00+07', '2026-11-03 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  'a closed episode is accepted');
+select throws_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
+     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
+             '2026-10-01 08:00+07', '2026-10-01 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  '23514', null, 'ended_at equal to started_at is refused');
+select throws_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
+     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
+             '2026-10-02 08:00+07', '2026-10-01 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  '23514', null, 'ended_at before started_at is refused');
+select throws_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
+     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
+             '2026-11-02 08:00+07', '2026-11-04 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  '23P01', null, 'two episodes that overlap are refused');
+select lives_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
+     values ('e0000000-0000-0000-0000-000000000002', 'ba000000-0000-0000-0000-000000000017',
+             '2026-11-03 08:00+07', '2026-11-05 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  'an episode may start at the moment another one ends');
+select lives_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, created_by)
+     values ('e0000000-0000-0000-0000-000000000003', 'ba000000-0000-0000-0000-000000000017',
+             '2026-11-10 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  'an open episode is accepted');
+select throws_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, created_by)
+     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
+             '2026-11-20 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  '23P01', null, 'a second open episode is refused');
+select throws_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
+     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
+             '2026-11-12 08:00+07', '2026-11-13 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  '23P01', null, 'a closed episode after the start of the open one is refused');
+select throws_ok(
+  $$ update public.illness_episodes set ended_at = null
+     where id = 'e0000000-0000-0000-0000-000000000001' $$,
+  '23P01', null, 'reopening an episode that has a later one is refused');
+select lives_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, created_by)
+     values ('e0000000-0000-0000-0000-000000000004', 'ba000000-0000-0000-0000-000000000117',
+             '2026-11-10 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  'another baby may have an open episode at the same time');
+select is_empty(
+  $$ select 1 from pg_publication_tables
+     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'illness_episodes' $$,
+  'illness_episodes is not published to realtime');
+
+-- As C (outsider)
+select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000017","email":"ic@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select is_empty('select id from public.illness_episodes', 'outsider sees no episodes');
+select throws_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at)
+     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017', '2026-09-01 08:00+07', '2026-09-02 08:00+07') $$,
+  '42501', null, 'outsider cannot add an episode');
+select is_empty(
+  $$ update public.illness_episodes set ended_at = '2026-11-11 08:00+07'
+     where id = 'e0000000-0000-0000-0000-000000000003' returning id $$,
+  'outsider cannot edit an episode');
+select is_empty(
+  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000001' returning id $$,
+  'outsider cannot delete an episode');
+reset role;
+
+-- As B (member, not the owner)
+select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000017","email":"ib@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select is((select count(*)::int from public.illness_episodes), 4, 'member sees the family''s episodes');
+select lives_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at) values
+       ('e0000000-0000-0000-0000-000000000005', 'ba000000-0000-0000-0000-000000000017', '2026-09-01 08:00+07', '2026-09-02 08:00+07'),
+       ('e0000000-0000-0000-0000-000000000006', 'ba000000-0000-0000-0000-000000000017', '2026-09-05 08:00+07', '2026-09-06 08:00+07') $$,
+  'member adds episodes with client ids');
+select throws_ok(
+  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
+     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017', '2026-08-01 08:00+07', '2026-08-02 08:00+07',
+             'aaaaaaaa-0000-0000-0000-000000000017') $$,
+  '42501', null, 'member cannot add an episode in someone else''s name');
+select isnt_empty(
+  $$ update public.illness_episodes set ended_at = '2026-11-11 08:00+07'
+     where id = 'e0000000-0000-0000-0000-000000000003' returning id $$,
+  'member closes the episode the owner opened');
+select is_empty(
+  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000001' returning id $$,
+  'member cannot delete the owner''s episode');
+select isnt_empty(
+  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000005' returning id $$,
+  'member deletes the episode they created');
+reset role;
+
+-- As A (owner)
+select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000017","email":"ia@example.com","role":"authenticated"}', true);
+set local role authenticated;
+select isnt_empty(
+  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000006' returning id $$,
+  'owner deletes the member''s episode');
+select throws_ok(
+  $$ update public.illness_episodes set baby_id = 'ba000000-0000-0000-0000-000000000117'
+     where id = 'e0000000-0000-0000-0000-000000000002' $$,
+  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');
+select throws_ok(
+  $$ update public.illness_episodes set created_by = 'bbbbbbbb-0000-0000-0000-000000000017'
+     where id = 'e0000000-0000-0000-0000-000000000002' $$,
+  'P0001', 'immutable_column: created_by', 'created_by is immutable');
+select throws_ok(
+  $$ update public.illness_episodes set id = 'e0000000-0000-0000-0000-000000000099'
+     where id = 'e0000000-0000-0000-0000-000000000002' $$,
+  'P0001', 'immutable_column: id', 'id is immutable');
+reset role;
+
+select is(
+  (select count(*)::int from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000001'),
+  1,
+  'the outsider''s and the member''s delete of the owner''s episode had no effect');
+delete from public.babies where id = 'ba000000-0000-0000-0000-000000000117';
+select is_empty(
+  $$ select id from public.illness_episodes where baby_id = 'ba000000-0000-0000-0000-000000000117' $$,
+  'deleting a baby removes its episodes');
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

Expected: file `017_illness_episodes.test.sql` báo `Failed 27/28 subtests` và `Parse errors: Bad plan.  You planned 28 tests but ran 12.` (bảng chưa có nên file dừng ở kiểm thứ 12); dòng cuối `Files=17, Tests=178` và `Result: FAIL`. Mười sáu file kia xanh.

- [x] **Step 3: Viết migration, sinh lại kiểu, thêm `EpisodeRow` (Patch 2)**

Phần `lib/supabase/types.ts` của patch là đúng thứ `bun run db:types` sinh ra sau khi DB local có bảng mới (20 dòng thêm). Patch đó dùng một dòng ngữ cảnh mỗi bên: nếu `git apply` từ chối riêng file này thì bỏ qua phần đó và chạy `bun run db:types` ở Step 4.

```diff
diff --git a/lib/supabase/rows.ts b/lib/supabase/rows.ts
index cbcd00d..ee38f09 100644
--- a/lib/supabase/rows.ts
+++ b/lib/supabase/rows.ts
@@ -13,3 +13,4 @@ export type MusicLinkRow = Tables["music_links"]["Row"];
 export type PhotoRow = Tables["photos"]["Row"];
 export type MilestoneRow = Tables["milestones_achieved"]["Row"];
 export type MedicineScheduleRow = Tables["medicine_schedules"]["Row"];
+export type EpisodeRow = Tables["illness_episodes"]["Row"];
diff --git a/supabase/migrations/20261126000200_illness_episodes.sql b/supabase/migrations/20261126000200_illness_episodes.sql
new file mode 100644
index 0000000..7d30aec
--- /dev/null
+++ b/supabase/migrations/20261126000200_illness_episodes.sql
@@ -0,0 +1,45 @@
+-- Spec 2026-11-26 §4.1: an illness episode is a stretch of time with a start and
+-- an end. id comes from the client (crypto.randomUUID()) so outbox retries never
+-- duplicate a row. Logs belong to an episode by their time; there is no foreign
+-- key from logs.
+create extension if not exists btree_gist with schema extensions;
+
+create table public.illness_episodes (
+  id uuid primary key,
+  baby_id uuid not null references public.babies (id) on delete cascade,
+  started_at timestamptz not null,
+  ended_at timestamptz,
+  created_by uuid not null default auth.uid() references auth.users (id),
+  created_at timestamptz not null default now(),
+  updated_at timestamptz not null default now(),
+  check (ended_at is null or ended_at > started_at),
+  unique (id, baby_id),
+  -- No two episodes of one baby share a moment. An open episode runs to
+  -- infinity, so this also allows only one open episode per baby.
+  constraint illness_episodes_no_overlap exclude using gist (
+    baby_id with =,
+    tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&
+  )
+);
+
+create trigger illness_episodes_set_updated_at before update on public.illness_episodes
+  for each row execute function public.set_updated_at();
+create trigger illness_episodes_immutable before update on public.illness_episodes
+  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');
+
+alter table public.illness_episodes enable row level security;
+
+-- Unlike logs, any member may update: one parent opens the episode, the other
+-- may close it. Delete stays with the owner of the family or the creator.
+create policy illness_episodes_select on public.illness_episodes for select to authenticated
+  using (public.is_member(public.baby_family(baby_id)));
+create policy illness_episodes_insert on public.illness_episodes for insert to authenticated
+  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
+create policy illness_episodes_update on public.illness_episodes for update to authenticated
+  using (public.is_member(public.baby_family(baby_id)))
+  with check (public.is_member(public.baby_family(baby_id)));
+create policy illness_episodes_delete on public.illness_episodes for delete to authenticated
+  using (
+    public.is_owner(public.baby_family(baby_id))
+    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
+  );
diff --git a/lib/supabase/types.ts b/lib/supabase/types.ts
index af24589..735c49d 100644
--- a/lib/supabase/types.ts
+++ b/lib/supabase/types.ts
@@ -96,2 +96,22 @@ isOneToOne: false
       columns: ["baby_id"]
+isOneToOne: false
+      referencedRelation: "babies"
+      referencedColumns: ["id"]
+    }
+                  ]
+                },"illness_episodes": {
+                  Row: {
+                    "baby_id": string,"created_at": string,"created_by": string,"ended_at": string | null,"id": string,"started_at": string,"updated_at": string
+                  }
+                  ComputedFields: never
+                  Insert: {
+                    "baby_id": string,"created_at"?: string,"created_by"?: string,"ended_at"?: string | null,"id": string,"started_at": string,"updated_at"?: string
+                  }
+                  Update: {
+                    "baby_id"?: string,"created_at"?: string,"created_by"?: string,"ended_at"?: string | null,"id"?: string,"started_at"?: string,"updated_at"?: string
+                  }
+                  Relationships: [
+                    {
+      foreignKeyName: "illness_episodes_baby_id_fkey"
+      columns: ["baby_id"]
 isOneToOne: false
```

- [x] **Step 4: Chạy để thấy xanh**

```bash
bun run db:reset
bun run db:test
bun run db:types
git status --short lib/supabase/types.ts
bun run typecheck
```

Expected: `bun run db:reset` in `Applying migration 20261126000200_illness_episodes.sql...` và không báo lỗi; `bun run db:test` in `All tests successful.`, `Files=17, Tests=194`, `Result: PASS`; sau `bun run db:types` file `lib/supabase/types.ts` vẫn đúng như patch (lệnh `git status --short` chỉ in ` M lib/supabase/types.ts` một lần, và `git diff --stat lib/supabase/types.ts` vẫn là 20 dòng thêm); `tsc --noEmit` không báo lỗi.

**Nếu `bun run db:reset` báo lỗi ở dòng `exclude using gist` hoặc ở `create extension … btree_gist`:** dừng lại và báo người dùng, kèm nguyên văn lỗi. Không tự đổi sang trigger, unique index hay cách nào khác (spec §4.1). Trong bản chạy thử ràng buộc này tạo được trên Supabase local.

Để Supabase local chạy tiếp cho Task 4, hoặc tắt bằng `bunx supabase stop` và bật lại khi tới đó.

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20261126000200_illness_episodes.sql supabase/tests/017_illness_episodes.test.sql lib/supabase/types.ts lib/supabase/rows.ts
git commit -m "feat(db): the illness_episodes table" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: `illness_episodes` trong lõi outbox (§4.2, §10.1)

**Files:**

- Modify: `lib/data/outboxCore.ts`
- Test: `lib/data/outboxEpisodes.test.ts` (mới)

**Interfaces:**

- Consumes: `EpisodeRow` (Task 1); `OutboxEntry`, `entriesFor`, `classifyFailure`, `overlayPending` (`lib/data/outboxCore.ts`).
- Produces:
  - `OutboxEntry["table"]` có thêm `"illness_episodes"`. `row` của một entry: insert `{ started_at, ended_at? }`; update: các cột đổi (`ended_at: null` là mở lại đợt); delete: `null`. `rowId` là `id` của đợt.
  - `applyEpisodeChange(rows: EpisodeRow[], entry: OutboxEntry, nowIso: string): EpisodeRow[]` (luôn xếp `started_at` giảm dần)
  - `overlayPendingEpisodes(rows: EpisodeRow[], entries: OutboxEntry[], nowIso: string): EpisodeRow[]`
  - `classifyFailure` bỏ mã `23P01` với câu `"Trùng thời gian với một đợt ốm khác"`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/data/outboxEpisodes.test.ts b/lib/data/outboxEpisodes.test.ts
new file mode 100644
index 0000000..3d41240
--- /dev/null
+++ b/lib/data/outboxEpisodes.test.ts
@@ -0,0 +1,159 @@
+import { describe, expect, it } from "vitest";
+import type { EpisodeRow } from "@/lib/supabase/rows";
+import {
+  applyEpisodeChange,
+  classifyFailure,
+  overlayPending,
+  overlayPendingEpisodes,
+  type OutboxEntry,
+} from "./outboxCore";
+
+const NOW = "2026-11-26T03:00:00.000Z";
+
+const entry = (
+  op: OutboxEntry["op"],
+  rowId: string,
+  row: Record<string, unknown> | null,
+  createdAt = 1,
+): OutboxEntry => ({
+  id: `e-${rowId}-${createdAt}`,
+  table: "illness_episodes",
+  op,
+  rowId,
+  babyId: "b1",
+  userId: "u1",
+  row,
+  createdAt,
+  attempts: 0,
+});
+
+const october: EpisodeRow = {
+  id: "ep1",
+  baby_id: "b1",
+  started_at: "2026-10-10T01:00:00.000Z",
+  ended_at: "2026-10-13T02:00:00.000Z",
+  created_by: "u0",
+  created_at: "2026-10-10T01:00:00.000Z",
+  updated_at: "2026-10-13T02:00:00.000Z",
+};
+
+// Spec 2026-11-26 §4.2.
+describe("applyEpisodeChange", () => {
+  it("insert adds an open episode newest first and ignores a repeat", () => {
+    const start = entry("insert", "ep2", {
+      started_at: "2026-11-25T02:00:00.000Z",
+    });
+    const rows = applyEpisodeChange([october], start, NOW);
+    expect(rows.map((r) => r.id)).toEqual(["ep2", "ep1"]);
+    expect(rows[0]).toEqual({
+      id: "ep2",
+      baby_id: "b1",
+      started_at: "2026-11-25T02:00:00.000Z",
+      ended_at: null,
+      created_by: "u1",
+      created_at: NOW,
+      updated_at: NOW,
+    });
+    expect(applyEpisodeChange(rows, start, NOW)).toBe(rows);
+  });
+
+  it("insert keeps an end that came with it", () => {
+    const rows = applyEpisodeChange(
+      [],
+      entry("insert", "ep3", {
+        started_at: "2026-09-01T02:00:00.000Z",
+        ended_at: "2026-09-02T02:00:00.000Z",
+      }),
+      NOW,
+    );
+    expect(rows[0].ended_at).toBe("2026-09-02T02:00:00.000Z");
+  });
+
+  it("update merges the changed columns and sorts again by start", () => {
+    const newer: EpisodeRow = {
+      ...october,
+      id: "ep2",
+      started_at: "2026-11-25T02:00:00.000Z",
+      ended_at: null,
+    };
+    const closed = applyEpisodeChange(
+      [newer, october],
+      entry("update", "ep2", { ended_at: "2026-11-26T02:00:00.000Z" }),
+      NOW,
+    );
+    expect(closed[0]).toEqual({
+      ...newer,
+      ended_at: "2026-11-26T02:00:00.000Z",
+      updated_at: NOW,
+    });
+    expect(closed[1]).toBe(october);
+    const moved = applyEpisodeChange(
+      [newer, october],
+      entry("update", "ep2", { started_at: "2026-10-01T02:00:00.000Z" }),
+      NOW,
+    );
+    expect(moved.map((r) => r.id)).toEqual(["ep1", "ep2"]);
+    // Reopening sends ended_at: null, which must win over the stored end.
+    expect(
+      applyEpisodeChange(
+        [october],
+        entry("update", "ep1", { ended_at: null }),
+        NOW,
+      )[0].ended_at,
+    ).toBeNull();
+  });
+
+  it("delete removes the row; other ops leave the list alone", () => {
+    expect(
+      applyEpisodeChange([october], entry("delete", "ep1", null), NOW),
+    ).toEqual([]);
+    const rows = [october];
+    expect(applyEpisodeChange(rows, entry("stop", "ep1", {}), NOW)).toBe(rows);
+    expect(applyEpisodeChange(rows, entry("upsert", "ep1", {}), NOW)).toBe(
+      rows,
+    );
+  });
+});
+
+describe("episode overlays stay apart from the other tables", () => {
+  it("overlayPendingEpisodes uses illness_episodes entries only, oldest first", () => {
+    const growthEntry: OutboxEntry = {
+      ...entry("delete", "ep1", null, 0),
+      table: "growth",
+    };
+    const rows = overlayPendingEpisodes(
+      [october],
+      [
+        entry("update", "ep1", { ended_at: "2026-10-15T02:00:00.000Z" }, 3),
+        entry("update", "ep1", { ended_at: "2026-10-14T02:00:00.000Z" }, 2),
+        entry("insert", "ep2", { started_at: "2026-11-25T02:00:00.000Z" }, 4),
+        growthEntry,
+      ],
+      NOW,
+    );
+    expect(rows.map((r) => [r.id, r.ended_at])).toEqual([
+      ["ep2", null],
+      ["ep1", "2026-10-15T02:00:00.000Z"],
+    ]);
+  });
+
+  it("overlayPending (logs) ignores illness_episodes entries", () => {
+    const logRow = { id: "ep1" } as unknown as Parameters<
+      typeof overlayPending
+    >[0][number];
+    expect(
+      overlayPending([logRow], [entry("delete", "ep1", null)], () => true, NOW),
+    ).toEqual([logRow]);
+  });
+});
+
+describe("classifyFailure for an overlapping episode", () => {
+  it("drops 23P01 with the sentence of spec §4.2", () => {
+    expect(
+      classifyFailure({ status: 409, code: "23P01", message: "" }),
+    ).toEqual({
+      kind: "drop",
+      reason: "Trùng thời gian với một đợt ốm khác",
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 186 passed (187)`, `Tests  6 failed | 1696 passed (1702)`. 6 test đỏ: hàm `applyEpisodeChange`, `overlayPendingEpisodes` chưa có và mã `23P01` chưa được nhận. Test "overlayPending (logs) ignores illness_episodes entries" xanh ngay vì `entriesFor` đã lọc theo bảng.

- [x] **Step 3: Thêm bảng mới vào lõi outbox (Patch 4)**

```diff
diff --git a/lib/data/outboxCore.ts b/lib/data/outboxCore.ts
index 9af6143..ce7a155 100644
--- a/lib/data/outboxCore.ts
+++ b/lib/data/outboxCore.ts
@@ -1,4 +1,5 @@
 import type {
+  EpisodeRow,
   GrowthRow,
   LogRow,
   MilestoneRow,
@@ -12,7 +13,12 @@ export type OutboxOp = "insert" | "update" | "delete" | "stop" | "upsert";

 export type OutboxEntry = {
   id: string;
-  table: "logs" | "vaccine_doses" | "growth" | "milestones_achieved";
+  table:
+    | "logs"
+    | "vaccine_doses"
+    | "growth"
+    | "milestones_achieved"
+    | "illness_episodes";
   op: OutboxOp;
   rowId: string;
   babyId: string;
@@ -22,6 +28,8 @@ export type OutboxEntry = {
   // growth — insert: the measurement; update: the changed columns; delete: null.
   // milestones_achieved — upsert: { milestone_code, achieved_on, note, photo_id };
   // delete: { milestone_code }. rowId is the milestone code.
+  // illness_episodes — insert: { started_at, ended_at? }; update: the changed
+  // columns (ended_at: null reopens the episode); delete: null.
   row: Record<string, unknown> | null;
   createdAt: number;
   attempts: number;
@@ -41,6 +49,8 @@ const DROP_CODES: Record<string, string> = {
   "23514": INVALID,
   "23503": "Bản ghi liên quan không còn",
   "22P02": INVALID,
+  // Spec 2026-11-26 §4.2: the no-overlap constraint of illness_episodes.
+  "23P01": "Trùng thời gian với một đợt ốm khác",
 };

 // How many flushes an entry may fail with an unknown 4xx before it is given up.
@@ -325,3 +335,52 @@ export function overlayPendingMilestones(
     .sort((a, b) => a.createdAt - b.createdAt)
     .reduce((acc, entry) => applyMilestoneChange(acc, entry, nowIso), rows);
 }
+
+const byStartedAt = (a: EpisodeRow, b: EpisodeRow) =>
+  Date.parse(b.started_at) - Date.parse(a.started_at);
+
+// Spec 2026-11-26 §4.2: illness episodes use a client id, so entries match
+// rows by id (like growth). The list stays newest start first.
+export function applyEpisodeChange(
+  rows: EpisodeRow[],
+  entry: OutboxEntry,
+  nowIso: string,
+): EpisodeRow[] {
+  const patch = (entry.row ?? {}) as Partial<EpisodeRow>;
+  switch (entry.op) {
+    case "insert":
+      if (rows.some((r) => r.id === entry.rowId)) return rows;
+      return [
+        ...rows,
+        {
+          id: entry.rowId,
+          baby_id: entry.babyId,
+          started_at: String(patch.started_at),
+          ended_at: patch.ended_at ?? null,
+          created_by: entry.userId,
+          created_at: nowIso,
+          updated_at: nowIso,
+        },
+      ].sort(byStartedAt);
+    case "update":
+      return rows
+        .map((r) =>
+          r.id === entry.rowId ? { ...r, ...patch, updated_at: nowIso } : r,
+        )
+        .sort(byStartedAt);
+    case "delete":
+      return rows.filter((r) => r.id !== entry.rowId);
+    default:
+      return rows;
+  }
+}
+
+export function overlayPendingEpisodes(
+  rows: EpisodeRow[],
+  entries: OutboxEntry[],
+  nowIso: string,
+): EpisodeRow[] {
+  return [...entriesFor(entries, "illness_episodes")]
+    .sort((a, b) => a.createdAt - b.createdAt)
+    .reduce((acc, entry) => applyEpisodeChange(acc, entry, nowIso), rows);
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  187 passed (187)`, `Tests  1702 passed (1702)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/data/outboxCore.ts lib/data/outboxEpisodes.test.ts
git commit -m "feat(outbox): illness_episodes in the outbox core" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Xếp hàng chờ, gửi lên server và đọc đợt ốm (§4.2, §10.1)

**Files:**

- Create: `lib/data/illness.ts`
- Modify: `lib/data/outbox.ts`, `lib/data/outboxDeps.ts`, `components/sync/OutboxSync.tsx`
- Test: `lib/data/outboxEpisodesSend.test.ts`, `lib/data/outboxEpisodesQueue.test.ts`, `lib/data/illness.test.ts` (đều mới)

**Interfaces:**

- Consumes: `applyEpisodeChange`, `overlayPendingEpisodes` (Task 2); `EpisodeRow` (Task 1); `localDb`, `flushRequests`, `supabase`, `outboxDeps` sẵn có.
- Produces:
  - `lib/data/outbox.ts`: `type EpisodeChange = Pick<OutboxEntry, "rowId" | "babyId" | "userId" | "row"> & { op: "insert" | "update" | "delete" }`; `episodesKey(babyId: string): readonly ["illness-episodes", string]`; `enqueueEpisodeChange(queryClient: QueryClient, change: EpisodeChange): Promise<void>`; `withPendingEpisodes(babyId: string, rows: EpisodeRow[]): Promise<EpisodeRow[]>`; `REFRESH_AFTER_FLUSH`: các khóa cache được tải lại sau mỗi lần outbox gửi xong, nay có thêm `["illness-episodes"]`
  - `components/sync/OutboxSync.tsx`: tải lại đúng các khóa của `REFRESH_AFTER_FLUSH` (trước đó là năm dòng gọi viết tay; hành vi với năm khóa cũ không đổi).
  - `lib/data/outboxDeps.ts`: `send` gửi entry của `illness_episodes` (insert là upsert `ignoreDuplicates` theo `id`).
  - `lib/data/illness.ts`: `type EpisodePatch = { started_at?: string; ended_at?: string | null }`; `fetchEpisodes(babyId: string): Promise<EpisodeRow[]>`; `useEpisodes(babyId: string)` (`staleTime` và `refetchInterval` đều 60 giây); `useEpisodeActions(babyId: string, userId: string)` trả `{ start, update, remove }`: `start.mutate({ startedAt: string })` trả về `id` của đợt mới, `update.mutate({ id: string, patch: EpisodePatch })`, `remove.mutate(id: string)`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

Ba file test. Hai file đầu thay Supabase và IndexedDB bằng vật thế: mọi lệnh gọi được ghi lại để so. File thứ ba gọi thẳng hai hook ngoài React (ba hàm của `@tanstack/react-query` được thay bằng hàm trả lại chính tham số).

```diff
diff --git a/lib/data/illness.test.ts b/lib/data/illness.test.ts
new file mode 100644
index 0000000..bd1b7ca
--- /dev/null
+++ b/lib/data/illness.test.ts
@@ -0,0 +1,147 @@
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { EpisodeRow } from "@/lib/supabase/rows";
+import { fetchEpisodes, useEpisodeActions, useEpisodes } from "./illness";
+
+type Result = { data: unknown; error: unknown };
+
+const db = vi.hoisted(() => ({
+  calls: [] as unknown[][],
+  result: { data: [], error: null } as Result,
+}));
+const queryClient = vi.hoisted(() => ({ name: "query client" }));
+const enqueueEpisodeChange = vi.hoisted(() => vi.fn(async () => undefined));
+const withPendingEpisodes = vi.hoisted(() =>
+  vi.fn(async (_babyId: string, rows: unknown[]) => [...rows, "pending"]),
+);
+
+vi.mock("@/lib/supabase/client", () => ({
+  supabase: () => ({
+    from: (table: string) => {
+      const chain: Record<string, unknown> = {};
+      for (const name of ["select", "eq", "order"])
+        chain[name] = (...args: unknown[]) => {
+          db.calls.push([table, name, ...args]);
+          return chain;
+        };
+      chain.then = (resolve: (value: Result) => void) => resolve(db.result);
+      return chain;
+    },
+  }),
+}));
+// The hooks are called outside React here: each returns the options it was given.
+vi.mock("@tanstack/react-query", () => ({
+  useQuery: (options: unknown) => options,
+  useMutation: (options: unknown) => options,
+  useQueryClient: () => queryClient,
+}));
+vi.mock("./outbox", () => ({
+  enqueueEpisodeChange,
+  withPendingEpisodes,
+  episodesKey: (babyId: string) => ["illness-episodes", babyId],
+}));
+
+const row = { id: "ep1" } as EpisodeRow;
+
+beforeEach(() => {
+  db.calls = [];
+  db.result = { data: [row], error: null };
+  enqueueEpisodeChange.mockClear();
+  withPendingEpisodes.mockClear();
+});
+
+// Spec 2026-11-26 §4.2.
+describe("fetchEpisodes", () => {
+  it("reads every episode of the baby, newest start first, under the waiting changes", async () => {
+    expect(await fetchEpisodes("b1")).toEqual([row, "pending"]);
+    expect(db.calls).toEqual([
+      ["illness_episodes", "select", "*"],
+      ["illness_episodes", "eq", "baby_id", "b1"],
+      ["illness_episodes", "order", "started_at", { ascending: false }],
+    ]);
+    expect(withPendingEpisodes).toHaveBeenCalledWith("b1", [row]);
+  });
+
+  it("throws the server's error", async () => {
+    const error = { code: "42501", message: "denied" };
+    db.result = { data: null, error };
+    await expect(fetchEpisodes("b1")).rejects.toBe(error);
+  });
+});
+
+type QueryOptions = {
+  queryKey: unknown[];
+  queryFn: () => Promise<unknown>;
+  staleTime: number;
+  refetchInterval: number;
+};
+type MutationOptions<T> = {
+  networkMode: string;
+  mutationFn: (value: T) => Promise<unknown>;
+};
+
+describe("useEpisodes", () => {
+  it("is fresh for a minute and asks again every minute", async () => {
+    const options = useEpisodes("b1") as unknown as QueryOptions;
+    expect(options.queryKey).toEqual(["illness-episodes", "b1"]);
+    expect(options.staleTime).toBe(60_000);
+    expect(options.refetchInterval).toBe(60_000);
+    expect(await options.queryFn()).toEqual([row, "pending"]);
+  });
+});
+
+describe("useEpisodeActions", () => {
+  const actions = () =>
+    useEpisodeActions("b1", "u1") as unknown as {
+      start: MutationOptions<{ startedAt: string }>;
+      update: MutationOptions<{
+        id: string;
+        patch: { started_at?: string; ended_at?: string | null };
+      }>;
+      remove: MutationOptions<string>;
+    };
+
+  it("start queues an open episode under a new id and resolves to that id", async () => {
+    const id = await actions().start.mutationFn({
+      startedAt: "2026-11-25T02:00:00.000Z",
+    });
+    expect(id).toMatch(/^[0-9a-f-]{36}$/);
+    expect(enqueueEpisodeChange).toHaveBeenCalledWith(queryClient, {
+      babyId: "b1",
+      userId: "u1",
+      op: "insert",
+      rowId: id,
+      row: { started_at: "2026-11-25T02:00:00.000Z", ended_at: null },
+    });
+  });
+
+  it("update queues only the columns it was given", async () => {
+    await actions().update.mutationFn({
+      id: "ep1",
+      patch: { ended_at: null },
+    });
+    expect(enqueueEpisodeChange).toHaveBeenCalledWith(queryClient, {
+      babyId: "b1",
+      userId: "u1",
+      op: "update",
+      rowId: "ep1",
+      row: { ended_at: null },
+    });
+  });
+
+  it("remove queues a delete", async () => {
+    await actions().remove.mutationFn("ep1");
+    expect(enqueueEpisodeChange).toHaveBeenCalledWith(queryClient, {
+      babyId: "b1",
+      userId: "u1",
+      op: "delete",
+      rowId: "ep1",
+      row: null,
+    });
+  });
+
+  it("every action also runs offline", () => {
+    const all = actions();
+    for (const action of [all.start, all.update, all.remove])
+      expect(action.networkMode).toBe("always");
+  });
+});
diff --git a/lib/data/outboxEpisodesQueue.test.ts b/lib/data/outboxEpisodesQueue.test.ts
new file mode 100644
index 0000000..7636766
--- /dev/null
+++ b/lib/data/outboxEpisodesQueue.test.ts
@@ -0,0 +1,141 @@
+import { QueryClient } from "@tanstack/react-query";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { EpisodeRow } from "@/lib/supabase/rows";
+import {
+  enqueueEpisodeChange,
+  episodesKey,
+  REFRESH_AFTER_FLUSH,
+  withPendingEpisodes,
+} from "./outbox";
+import type { OutboxEntry } from "./outboxCore";
+import { flushRequests } from "./outboxEvents";
+
+// A stand-in for the device's IndexedDB outbox table.
+const store = vi.hoisted(() => ({
+  entries: [] as OutboxEntry[],
+  broken: false,
+}));
+
+vi.mock("./localDb", () => ({
+  localDb: () => ({
+    outbox: {
+      add: async (entry: OutboxEntry) => {
+        store.entries.push(entry);
+      },
+      orderBy: () => ({ last: async () => store.entries.at(-1) }),
+      where: (field: keyof OutboxEntry) => ({
+        equals: (value: unknown) => ({
+          toArray: async () => {
+            if (store.broken) throw new Error("IndexedDB is not available");
+            return store.entries.filter((entry) => entry[field] === value);
+          },
+        }),
+      }),
+    },
+  }),
+}));
+
+const october: EpisodeRow = {
+  id: "ep1",
+  baby_id: "b1",
+  started_at: "2026-10-10T01:00:00.000Z",
+  ended_at: "2026-10-13T02:00:00.000Z",
+  created_by: "u0",
+  created_at: "2026-10-10T01:00:00.000Z",
+  updated_at: "2026-10-13T02:00:00.000Z",
+};
+const START = "2026-11-25T02:00:00.000Z";
+const start = (babyId = "b1") => ({
+  op: "insert" as const,
+  rowId: `ep-${babyId}`,
+  babyId,
+  userId: "u1",
+  row: { started_at: START },
+});
+
+beforeEach(() => {
+  store.entries = [];
+  store.broken = false;
+});
+
+// Spec 2026-11-26 §4.2.
+describe("enqueueEpisodeChange", () => {
+  it("has its own query key per baby", () => {
+    expect(episodesKey("b1")).toEqual(["illness-episodes", "b1"]);
+  });
+
+  it("queues the change, shows it at once and asks for a flush", async () => {
+    const queryClient = new QueryClient();
+    queryClient.setQueryData(episodesKey("b1"), [october]);
+    const flushed = vi.fn();
+    const stop = flushRequests.listen(flushed);
+    await enqueueEpisodeChange(queryClient, start());
+    stop();
+    expect(store.entries).toHaveLength(1);
+    expect(store.entries[0]).toMatchObject({
+      table: "illness_episodes",
+      op: "insert",
+      rowId: "ep-b1",
+      babyId: "b1",
+      userId: "u1",
+      row: { started_at: START },
+      attempts: 0,
+    });
+    expect(
+      queryClient
+        .getQueryData<EpisodeRow[]>(episodesKey("b1"))
+        ?.map((row) => [row.id, row.ended_at]),
+    ).toEqual([
+      ["ep-b1", null],
+      ["ep1", "2026-10-13T02:00:00.000Z"],
+    ]);
+    expect(flushed).toHaveBeenCalledTimes(1);
+  });
+
+  it("leaves a list that never loaded alone, and keeps the order of two quick changes", async () => {
+    const queryClient = new QueryClient();
+    await enqueueEpisodeChange(queryClient, start());
+    await enqueueEpisodeChange(queryClient, {
+      op: "update",
+      rowId: "ep-b1",
+      babyId: "b1",
+      userId: "u1",
+      row: { ended_at: "2026-11-26T02:00:00.000Z" },
+    });
+    expect(queryClient.getQueryData(episodesKey("b1"))).toBeUndefined();
+    expect(store.entries[1].createdAt).toBeGreaterThan(
+      store.entries[0].createdAt,
+    );
+  });
+});
+
+describe("REFRESH_AFTER_FLUSH", () => {
+  it("refreshes the episodes after a flush, so a refused change does not stay on screen", () => {
+    expect(REFRESH_AFTER_FLUSH).toContainEqual([episodesKey("b1")[0]]);
+    // The lists that were refreshed before still are.
+    expect(REFRESH_AFTER_FLUSH.map((key) => key[0])).toEqual([
+      "logs",
+      "first-log",
+      "vaccine-doses",
+      "growth",
+      "milestones",
+      "illness-episodes",
+    ]);
+  });
+});
+
+describe("withPendingEpisodes", () => {
+  it("lays this baby's waiting changes over the server's rows", async () => {
+    const queryClient = new QueryClient();
+    await enqueueEpisodeChange(queryClient, start());
+    await enqueueEpisodeChange(queryClient, start("b2"));
+    const rows = await withPendingEpisodes("b1", [october]);
+    expect(rows.map((row) => row.id)).toEqual(["ep-b1", "ep1"]);
+  });
+
+  it("returns the server's rows when the device store cannot be read", async () => {
+    store.broken = true;
+    const rows = [october];
+    expect(await withPendingEpisodes("b1", rows)).toBe(rows);
+  });
+});
diff --git a/lib/data/outboxEpisodesSend.test.ts b/lib/data/outboxEpisodesSend.test.ts
new file mode 100644
index 0000000..355cb19
--- /dev/null
+++ b/lib/data/outboxEpisodesSend.test.ts
@@ -0,0 +1,156 @@
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { OutboxEntry } from "./outboxCore";
+import { outboxDeps } from "./outboxDeps";
+
+type Result = { data?: unknown; error: unknown; status: number };
+
+// A stand-in for the Supabase client: every builder call is recorded, and each
+// awaited request takes the next prepared result.
+const db = vi.hoisted(() => ({
+  calls: [] as unknown[][],
+  results: [] as Result[],
+}));
+
+vi.mock("@/lib/supabase/client", () => ({
+  supabase: () => ({
+    from: (table: string) => {
+      const chain: Record<string, unknown> = {};
+      for (const name of ["upsert", "update", "delete", "select", "eq"])
+        chain[name] = (...args: unknown[]) => {
+          db.calls.push([table, name, ...args]);
+          return chain;
+        };
+      chain.then = (resolve: (value: Result) => void) =>
+        resolve(db.results.shift() ?? { data: [], error: null, status: 200 });
+      return chain;
+    },
+  }),
+}));
+
+const entry = (
+  op: OutboxEntry["op"],
+  row: Record<string, unknown> | null,
+  table: OutboxEntry["table"] = "illness_episodes",
+): OutboxEntry => ({
+  id: "e1",
+  table,
+  op,
+  rowId: "ep1",
+  babyId: "b1",
+  userId: "u1",
+  row,
+  createdAt: 1,
+  attempts: 0,
+});
+
+const send = (e: OutboxEntry) => outboxDeps().send(e);
+const START = "2026-11-25T02:00:00.000Z";
+const END = "2026-11-26T02:00:00.000Z";
+
+beforeEach(() => {
+  db.calls = [];
+  db.results = [];
+});
+
+// Spec 2026-11-26 §4.2.
+describe("sending an illness_episodes entry", () => {
+  it("insert is an upsert on id that never overwrites, open unless an end came with it", async () => {
+    db.results = [{ error: null, status: 201 }];
+    expect(await send(entry("insert", { started_at: START }))).toEqual({
+      ok: true,
+    });
+    expect(db.calls).toEqual([
+      [
+        "illness_episodes",
+        "upsert",
+        { id: "ep1", baby_id: "b1", started_at: START, ended_at: null },
+        { onConflict: "id", ignoreDuplicates: true },
+      ],
+    ]);
+    db.calls = [];
+    await send(entry("insert", { started_at: START, ended_at: END }));
+    expect(db.calls[0][2]).toMatchObject({ ended_at: END });
+  });
+
+  it("an overlap refused by the server comes back with its code", async () => {
+    db.results = [
+      {
+        error: { code: "23P01", message: "conflicting key value" },
+        status: 409,
+      },
+    ];
+    expect(await send(entry("insert", { started_at: START }))).toEqual({
+      ok: false,
+      failure: {
+        status: 409,
+        code: "23P01",
+        message: "conflicting key value",
+      },
+    });
+  });
+
+  it("update sends only the changed columns; no row changed means it was refused", async () => {
+    db.results = [{ data: [{ id: "ep1" }], error: null, status: 200 }];
+    expect(await send(entry("update", { ended_at: null }))).toEqual({
+      ok: true,
+    });
+    expect(db.calls).toEqual([
+      ["illness_episodes", "update", { ended_at: null }],
+      ["illness_episodes", "eq", "id", "ep1"],
+      ["illness_episodes", "select", "id"],
+    ]);
+    db.results = [{ data: [], error: null, status: 200 }];
+    expect(await send(entry("update", { ended_at: END }))).toEqual({
+      ok: false,
+      failure: { zeroRows: true },
+    });
+  });
+
+  it("delete: a row already gone counts as done, a row still there was refused", async () => {
+    db.results = [{ data: [{ id: "ep1" }], error: null, status: 200 }];
+    expect(await send(entry("delete", null))).toEqual({ ok: true });
+    expect(db.calls).toEqual([
+      ["illness_episodes", "delete"],
+      ["illness_episodes", "eq", "id", "ep1"],
+      ["illness_episodes", "select", "id"],
+    ]);
+    db.results = [
+      { data: [], error: null, status: 200 },
+      { data: [], error: null, status: 200 },
+    ];
+    expect(await send(entry("delete", null))).toEqual({ ok: true });
+    db.results = [
+      { data: [], error: null, status: 200 },
+      { data: [{ id: "ep1" }], error: null, status: 200 },
+    ];
+    expect(await send(entry("delete", null))).toEqual({
+      ok: false,
+      failure: { zeroRows: true },
+    });
+  });
+
+  it("an op episodes do not have is refused without a request", async () => {
+    expect(await send(entry("stop", { ended_at: END }))).toEqual({
+      ok: false,
+      failure: { status: 400, code: null, message: "unsupported outbox entry" },
+    });
+    expect(db.calls).toEqual([]);
+  });
+
+  it("the other tables still go where they went", async () => {
+    await send(entry("delete", null, "growth"));
+    await send(entry("delete", null, "logs"));
+    expect(db.calls.map((call) => call[0])).toEqual([
+      "growth",
+      "growth",
+      "growth",
+      "growth",
+      "growth",
+      "logs",
+      "logs",
+      "logs",
+      "logs",
+      "logs",
+    ]);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  3 failed | 187 passed (190)`, `Tests  10 failed | 1704 passed (1714)`. Ba file test đỏ. `lib/data/illness.test.ts` không nạp được vì `./illness` chưa có (7 test của nó chưa được đếm); bốn test của file gửi và sáu test của file hàng chờ đỏ. Hai test của file gửi xanh ngay: một lỗi `23P01` và các bảng cũ đã đi đúng đường từ trước.

- [x] **Step 3: Viết hàng chờ, phần gửi và lớp dữ liệu (Patch 6)**

```diff
diff --git a/components/sync/OutboxSync.tsx b/components/sync/OutboxSync.tsx
index d550717..bcb7e94 100644
--- a/components/sync/OutboxSync.tsx
+++ b/components/sync/OutboxSync.tsx
@@ -2,6 +2,7 @@

 import { useQueryClient } from "@tanstack/react-query";
 import { useEffect } from "react";
+import { REFRESH_AFTER_FLUSH } from "@/lib/data/outbox";
 import { outboxDeps } from "@/lib/data/outboxDeps";
 import { flushRequests } from "@/lib/data/outboxEvents";
 import { flushOutbox } from "@/lib/data/outboxFlush";
@@ -42,12 +43,8 @@ export function OutboxSync() {
         const result = await withOutboxLock(() => flushOutbox(deps));
         blocked = result?.blocked ?? false;
         if (result && result.sent + result.dropped > 0) {
-          void queryClient.invalidateQueries({ queryKey: ["logs"] });
-          void queryClient.invalidateQueries({ queryKey: ["first-log"] });
-          // Also rolls back a refused dose mark (spec §9) and drops temporary rows.
-          void queryClient.invalidateQueries({ queryKey: ["vaccine-doses"] });
-          void queryClient.invalidateQueries({ queryKey: ["growth"] });
-          void queryClient.invalidateQueries({ queryKey: ["milestones"] });
+          for (const queryKey of REFRESH_AFTER_FLUSH)
+            void queryClient.invalidateQueries({ queryKey });
         }
       } catch (error) {
         console.warn("Không gửi được dữ liệu chờ đồng bộ", error);
diff --git a/lib/data/illness.ts b/lib/data/illness.ts
new file mode 100644
index 0000000..5d9f7f7
--- /dev/null
+++ b/lib/data/illness.ts
@@ -0,0 +1,82 @@
+"use client";
+
+import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
+import { supabase } from "@/lib/supabase/client";
+import type { EpisodeRow } from "@/lib/supabase/rows";
+import {
+  enqueueEpisodeChange,
+  episodesKey,
+  withPendingEpisodes,
+} from "./outbox";
+
+export type EpisodePatch = { started_at?: string; ended_at?: string | null };
+
+export async function fetchEpisodes(babyId: string): Promise<EpisodeRow[]> {
+  const { data, error } = await supabase()
+    .from("illness_episodes")
+    .select("*")
+    .eq("baby_id", babyId)
+    .order("started_at", { ascending: false });
+  if (error) throw error;
+  return withPendingEpisodes(babyId, data);
+}
+
+// Spec 2026-11-26 §4.2: every episode of the baby, newest start first. The
+// table is not in realtime, so the list asks again every minute: a second
+// phone sees a new episode after two minutes at most.
+export function useEpisodes(babyId: string) {
+  return useQuery({
+    queryKey: episodesKey(babyId),
+    queryFn: () => fetchEpisodes(babyId),
+    staleTime: 60_000,
+    refetchInterval: 60_000,
+  });
+}
+
+// Episodes go through the outbox with a client id, so they also work offline.
+// Nothing is checked here: the caller checks the times first (spec §5.7), and
+// the server has the last word.
+export function useEpisodeActions(babyId: string, userId: string) {
+  const queryClient = useQueryClient();
+  const base = { babyId, userId };
+  return {
+    // Resolves to the new episode's id, so the caller can open its page.
+    start: useMutation({
+      networkMode: "always",
+      mutationFn: async ({
+        startedAt,
+      }: {
+        startedAt: string;
+      }): Promise<string> => {
+        const rowId = crypto.randomUUID();
+        await enqueueEpisodeChange(queryClient, {
+          ...base,
+          op: "insert",
+          rowId,
+          row: { started_at: startedAt, ended_at: null },
+        });
+        return rowId;
+      },
+    }),
+    update: useMutation({
+      networkMode: "always",
+      mutationFn: ({ id, patch }: { id: string; patch: EpisodePatch }) =>
+        enqueueEpisodeChange(queryClient, {
+          ...base,
+          op: "update",
+          rowId: id,
+          row: patch,
+        }),
+    }),
+    remove: useMutation({
+      networkMode: "always",
+      mutationFn: (id: string) =>
+        enqueueEpisodeChange(queryClient, {
+          ...base,
+          op: "delete",
+          rowId: id,
+          row: null,
+        }),
+    }),
+  };
+}
diff --git a/lib/data/outbox.ts b/lib/data/outbox.ts
index 3e869f0..2799a28 100644
--- a/lib/data/outbox.ts
+++ b/lib/data/outbox.ts
@@ -2,6 +2,7 @@

 import type { QueryClient } from "@tanstack/react-query";
 import type {
+  EpisodeRow,
   GrowthRow,
   LogRow,
   MilestoneRow,
@@ -10,11 +11,13 @@ import type {
 import { localDb } from "./localDb";
 import {
   applyDoseChange,
+  applyEpisodeChange,
   applyGrowthChange,
   applyMilestoneChange,
   applyToCache,
   overlayPending,
   overlayPendingDoses,
+  overlayPendingEpisodes,
   overlayPendingGrowth,
   overlayPendingMilestones,
   type OutboxEntry,
@@ -219,3 +222,60 @@ export async function withPendingMilestones(
     return rows;
   }
 }
+
+// The caches refreshed after a flush that sent or dropped something: fresh
+// server rows take the place of the optimistic ones. This is also what rolls
+// back a change the server refused (spec §9) and drops temporary rows.
+export const REFRESH_AFTER_FLUSH = [
+  ["logs"],
+  ["first-log"],
+  ["vaccine-doses"],
+  ["growth"],
+  ["milestones"],
+  ["illness-episodes"],
+] as const;
+
+// Spec 2026-11-26 §4.2: illness episodes, by row id like growth.
+export type EpisodeChange = Pick<
+  OutboxEntry,
+  "rowId" | "babyId" | "userId" | "row"
+> & { op: "insert" | "update" | "delete" };
+
+export const episodesKey = (babyId: string) =>
+  ["illness-episodes", babyId] as const;
+
+export async function enqueueEpisodeChange(
+  queryClient: QueryClient,
+  change: EpisodeChange,
+): Promise<void> {
+  const entry: OutboxEntry = {
+    ...change,
+    id: crypto.randomUUID(),
+    table: "illness_episodes",
+    createdAt: await nextCreatedAt(),
+    attempts: 0,
+  };
+  await localDb().outbox.add(entry);
+  const key = episodesKey(change.babyId);
+  await queryClient.cancelQueries({ queryKey: key });
+  const nowIso = new Date().toISOString();
+  queryClient.setQueryData<EpisodeRow[]>(key, (rows) =>
+    rows ? applyEpisodeChange(rows, entry, nowIso) : rows,
+  );
+  flushRequests.emit();
+}
+
+export async function withPendingEpisodes(
+  babyId: string,
+  rows: EpisodeRow[],
+): Promise<EpisodeRow[]> {
+  try {
+    const entries = await localDb()
+      .outbox.where("babyId")
+      .equals(babyId)
+      .toArray();
+    return overlayPendingEpisodes(rows, entries, new Date().toISOString());
+  } catch {
+    return rows;
+  }
+}
diff --git a/lib/data/outboxDeps.ts b/lib/data/outboxDeps.ts
index 5ba1a76..5178abf 100644
--- a/lib/data/outboxDeps.ts
+++ b/lib/data/outboxDeps.ts
@@ -210,6 +210,61 @@ async function sendGrowth(entry: OutboxEntry): Promise<SendOutcome> {
   }
 }

+type EpisodeColumns = { started_at?: string; ended_at?: string | null };
+
+// Spec 2026-11-26 §4.2. An overlap with another episode comes back as 23P01
+// and is dropped with its own sentence (DROP_CODES).
+async function sendEpisode(entry: OutboxEntry): Promise<SendOutcome> {
+  const sb = supabase();
+  const row = (entry.row ?? {}) as EpisodeColumns;
+  switch (entry.op) {
+    case "insert": {
+      // ignoreDuplicates: a retry after a lost response must not overwrite the row.
+      const result = await sb.from("illness_episodes").upsert(
+        {
+          id: entry.rowId,
+          baby_id: entry.babyId,
+          started_at: String(row.started_at),
+          ended_at: row.ended_at ?? null,
+        },
+        { onConflict: "id", ignoreDuplicates: true },
+      );
+      return result.error ? failed(result) : { ok: true };
+    }
+    case "update": {
+      const result = await sb
+        .from("illness_episodes")
+        .update(row)
+        .eq("id", entry.rowId)
+        .select("id");
+      if (result.error) return failed(result);
+      return result.data.length > 0
+        ? { ok: true }
+        : { ok: false, failure: { zeroRows: true } };
+    }
+    case "delete": {
+      const result = await sb
+        .from("illness_episodes")
+        .delete()
+        .eq("id", entry.rowId)
+        .select("id");
+      if (result.error) return failed(result);
+      if (result.data.length > 0) return { ok: true };
+      // 0 rows: gone already (another device deleted it) counts as done.
+      const check = await sb
+        .from("illness_episodes")
+        .select("id")
+        .eq("id", entry.rowId);
+      if (check.error) return failed(check);
+      return check.data.length === 0
+        ? { ok: true }
+        : { ok: false, failure: { zeroRows: true } };
+    }
+    default:
+      return UNSUPPORTED;
+  }
+}
+
 // Spec §9: upsert on (baby_id, milestone_code) without sending id.
 async function sendMilestone(entry: OutboxEntry): Promise<SendOutcome> {
   const sb = supabase();
@@ -261,6 +316,7 @@ function send(entry: OutboxEntry): Promise<SendOutcome> {
   if (entry.table === "milestones_achieved") return sendMilestone(entry);
   if (entry.table === "vaccine_doses") return sendDose(entry);
   if (entry.table === "growth") return sendGrowth(entry);
+  if (entry.table === "illness_episodes") return sendEpisode(entry);
   return sendLog(entry);
 }

```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  190 passed (190)`, `Tests  1721 passed (1721)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/data/illness.ts lib/data/outbox.ts lib/data/outboxDeps.ts components/sync/OutboxSync.tsx lib/data/outboxEpisodesSend.test.ts lib/data/outboxEpisodesQueue.test.ts lib/data/illness.test.ts
git commit -m "feat(illness): episodes through the outbox, useEpisodes" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M2a, áp migration, rồi đưa lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; migration `20261126000200_illness_episodes.sql` đã áp lên Supabase thật; `main` có M2a.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  190 passed (190)`, `Tests  1721 passed (1721)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: pgTAP trên DB dựng lại từ đầu**

```bash
docker info >/dev/null 2>&1 || { open -a OrbStack; until docker info >/dev/null 2>&1; do sleep 2; done; }
bun run db:start
bun run db:reset
bun run db:test
bunx supabase stop
```

Expected: `All tests successful.`, `Files=17, Tests=194`, `Result: PASS`. Sau đó tắt OrbStack nếu chính phiên này đã bật nó.

- [ ] **Step 4: Áp migration lên Supabase thật**

Code của plan này chưa đọc hay ghi bảng mới ở đâu trên màn hình, nhưng `main` không được có code cần một migration trước khi migration đó đã áp (Global Constraints). Làm bước này trước Step 7.

```bash
bunx supabase db push --linked --dry-run
```

Expected: lệnh chỉ liệt kê, và liệt kê **đúng một** migration: `20261126000200_illness_episodes.sql`. Thấy migration nào khác, hoặc không thấy migration nào, thì dừng và báo người dùng.

Chỉ khi dry-run đúng như trên:

```bash
bunx supabase db push --linked --yes
```

Expected: `Applying migration 20261126000200_illness_episodes.sql...` rồi `Finished supabase db push.` (`--yes` chỉ trả lời câu hỏi xác nhận của CLI, để lệnh không treo chờ gõ phím.)

- Lệnh bị bộ kiểm quyền của app chặn, hoặc CLI hỏi mật khẩu của DB: **dừng lại**, không tìm đường vòng, không gõ mật khẩu. Đưa người dùng hai lệnh `bunx supabase db push --linked --dry-run` và `bunx supabase db push --linked` (mỗi lệnh một khối `bash`), nói rõ lệnh đầu phải liệt kê đúng một migration, và chờ họ báo đã chạy xong.
- Lệnh báo lỗi khi tạo `btree_gist` hay ràng buộc `exclude`: dừng và báo người dùng kèm nguyên văn lỗi (spec §4.1). Migration chạy trong một giao dịch nên DB thật không đổi gì.

Xong thì chạy lại `bunx supabase db push --linked --dry-run`: phải báo không còn migration nào chờ. Ghi vào plan giờ áp và ai chạy lệnh.

- [x] **Step 5: Không có bước trình duyệt**

Plan này không đổi gì trên màn hình (Diễn giải spec mục 10). Chưa có trang nào đọc `illness_episodes`.

- [x] **Step 6: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1 đến Step 4 (kèm dòng cuối của pgTAP, hai lần dry-run và giờ áp migration). Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này hiện là untracked (??); các file plan khác của M2 chưa chạy cũng vậy, không add chúng
git add docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md
git commit -m "docs(plan): the M2a plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

**Kết quả kiểm (2026-11-27, phiên thực thi M2a, nhánh `feat/kim-bun-dot-om-m2a` cắt từ `main` @ `4f50586`)**

Mọi con số đỏ và xanh đo được đều khớp plan; 6 patch áp sạch bằng `kb_patch`, không patch nào phải sửa tay.

| Chỗ đo                             | Plan ghi                                                           | Đo được                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Step 0, vitest xuất phát           | 186 file / 1695 test                                               | 1695 test xanh                                                                                             |
| Task 1 đỏ (pgTAP)                  | `Failed 27/28`, `planned 28 … ran 12`, `Files=17, Tests=178`, FAIL | đúng như plan                                                                                              |
| Task 1 xanh (pgTAP)                | `Files=17, Tests=194`, PASS                                        | đúng như plan                                                                                              |
| Task 1, `db:types`                 | file trùng patch, 20 dòng thêm                                     | trùng từng byte                                                                                            |
| Task 2 đỏ                          | 1 file đỏ / 187; 6 đỏ, 1696 xanh (1702)                            | đúng như plan                                                                                              |
| Task 2 xanh                        | 187 file / 1702 test                                               | đúng như plan                                                                                              |
| Task 3 đỏ                          | 3 file đỏ / 190; 10 đỏ, 1704 xanh (1714)                           | đúng như plan                                                                                              |
| Task 3 xanh                        | 190 file / 1721 test                                               | đúng như plan                                                                                              |
| Task 4 Step 1                      | `tsc --noEmit` sạch; 190 file / 1721 test                          | đúng như plan                                                                                              |
| Task 4 Step 2, `bun run build`     | lần đầu có thể dừng, lần hai qua                                   | lần 1 dừng (mã 1) vì thông báo bảo mật của Next.js 16.4.3; lần 2 mã 0, `✓ Generating static pages (40/40)` |
| Task 4 Step 3 (pgTAP, DB dựng lại) | `Files=17, Tests=194`, PASS                                        | `All tests successful.`, `Files=17, Tests=194`, `Result: PASS`                                             |

- `exclude using gist` và `btree_gist` tạo được trên Supabase local (`Applying migration 20261126000200_illness_episodes.sql...`, không lỗi).
- Step 0 chỉ giữ lại dòng `Tests  1695 passed (1695)`; dòng `Test Files` của lần đo đó không được ghi lại. Các lần đo sau đều có cả hai dòng.
- Supabase local đã `bunx supabase stop`; OrbStack do phiên này bật và đã tắt lại.
- Không lỗi nào lộ ra khi kiểm; không sửa gì ngoài plan.
- Thông báo bảo mật của Next.js 16.4.3 gợi ý chạy `next upgrade --agent=security …`: không chạy (Ghi chú khi thực thi). Việc nâng Next vẫn là mục mở từ trước.

**Step 4 — migration CHƯA áp lên Supabase thật.**

- 09:33:56 (+07) `bunx supabase db push --linked --dry-run`: `Would push these migrations: • 20261126000200_illness_episodes.sql`, đúng một migration.
- Ngay sau đó `bunx supabase db push --linked --yes` bị bộ kiểm quyền của app chặn trước khi chạy ("Permission for this action was denied by the Claude Code auto mode classifier"). Không tìm đường vòng, không nhờ phiên khác.
- 09:34:18 (+07) dry-run lần hai: vẫn liệt kê đúng một migration đó, tức DB thật chưa đổi gì.
- Theo mục 12 của Diễn giải spec, quay về cách của spec: người dùng tự chạy `bunx supabase db push --linked --dry-run` (phải liệt kê đúng một migration `20261126000200_illness_episodes.sql`), rồi `bunx supabase db push --linked`. Chưa ai chạy.

**Step 7 — CHƯA lên `main`.** Code cần một migration không được lên `main` trước khi migration đó đã áp (Global Constraints). Nhánh `feat/kim-bun-dot-om-m2a` giữ nguyên ở máy, chưa merge, chưa push. Sau khi người dùng áp migration: chạy lại dry-run (phải báo không còn gì chờ), ghi giờ áp vào đây, rồi làm Step 7.

**Chưa kiểm:** `supabase db push` lên DB thật; bảng `illness_episodes` và ràng buộc `exclude` trên Supabase thật; gửi thật một đợt ốm qua outbox lên server (chưa có màn hình nào gọi, và dev nối dữ liệu thật).

- [ ] **Step 7: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m2a
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build, pgTAP; migration đã áp lúc nào và do ai chạy; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
