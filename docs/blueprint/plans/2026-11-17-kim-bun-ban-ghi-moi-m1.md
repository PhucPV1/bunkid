# Kim Bun — M1a Bốn loại bản ghi mới: dữ liệu, nhập nhanh, bảng "+" Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md` (§3.1, §3.2, §3.3 trừ đoạn `LogEditSheet`, §3.5; phần tương ứng của §6.1, §6.2, §6.3). Plan theo bản spec đã cập nhật ngày 2026-11-17 với phương án C2: bảng "+" chia 3 nhóm.

**Status:** approved 2026-11-17

**Goal:** DB nhận đủ 12 loại bản ghi. Từ nút "+", bảng chia 3 nhóm 13 ô, ghi được bốn loại tức thời mới (Ăn dặm, Uống nước, Tắm, Ghi chú); chúng hiện đúng tên, icon và mô tả ở Nhật ký và trang chủ.

**Architecture:**

- **DB:** migration `20261117000100_log_types.sql` nới check `logs_type_check` từ 8 lên 12 giá trị, kèm pgTAP 012. `lib/supabase/types.ts` không đổi vì cột `type` là `text`.
- **Luật thuần (`lib/rules/`):** `LOG_TYPES` và `detailsSchemas`, `describeLog`, `InstantType` cùng `QUICK_FIELDS` / `buildDetails` / `recentFoodNames`, `toastText` (cắt chữ của toast Hoàn tác), `QUICK_ACTIONS` (thêm `group`, xếp lại theo nhóm) và `QUICK_ACTION_GROUPS`.
- **Giao diện:** ba icon mới, bốn mục `CATEGORIES`, ba component ô nhập mới trong `components/quick/`, `QuickEntrySheet`, `QuickActionGrid` (vẽ lại theo nhóm).
- **Không phải sửa:** luồng lưu (`useAddInstant`, outbox), `QuickActionsProvider`, `HistoryList`, `RecentCard`, `TimerButtons`, `QuickLogGrid`. Chúng nhận loại qua `InstantType` / `LogType` / `CATEGORIES` nên tự chạy với loại mới.
- **Vì sao thứ tự task khác thứ tự mục của spec:** `detailsSchemas`, `CATEGORIES`, `LOG_FIELDS`, `QUICK_FIELDS`, `TITLES` và `switch` của `describeLog` đều bắt buộc đủ khoá cho mọi `LogType` / `InstantType`. Chỉ thêm 4 giá trị vào `LOG_TYPES` là typecheck đỏ ở `logDetails.ts`, `describeLog.ts`, `categories.ts` và `logForm.ts`; chữa `logForm.ts` cần `InstantType` rộng ra, kéo theo `quickEntry.ts` và `QuickEntrySheet.tsx`. Vì vậy phần đó nằm trong một task (Task 4). Icon và component ô nhập không phụ thuộc kiểu nên làm trước (Task 2, 3), để Task 4 nối dây ở dạng cuối cùng.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, zod 4, Vitest (`react-dom/server`, môi trường `node`), Supabase (Postgres, pgTAP), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-ban-ghi-moi-m1a`, cắt từ `main` (HEAD `213cc41`). Baseline: 803 test vitest xanh (140 file), pgTAP 001–011.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                             | Plan                                    |
| ------------------ | -------------------------------------------------------------------- | --------------------------------------- |
| **M1a (plan này)** | Migration `log_types`, §3.1, §3.2, §3.3 (nhập nhanh, bảng "+"), §3.5 | `2026-11-17-kim-bun-ban-ghi-moi-m1.md`  |
| M1b                | §3.3 (`LogEditSheet`), §3.4 (bộ lọc Nhật ký, Thống kê)               | `2026-11-17-kim-bun-ban-ghi-moi-m1b.md` |
| M2                 | §5 canh timer trong app, `TIMER_LIMIT_MIN`                           | chưa viết                               |
| M3                 | Migration `reminders`, §4.4, giờ yên lặng, `hold_feed_while_asleep`  | chưa viết                               |
| M4                 | §4.2 lịch thuốc, nhắc thuốc, nhắc hạ sốt, push timer, checklist §6.4 | chưa viết                               |

Mốc M1 của spec (§7 mục 1) được chia thành M1a và M1b để mỗi plan vừa một phiên làm. Sau M1a app đã ghi được bốn loại mới từ đầu tới cuối. Những chỗ còn ở dạng cũ cho tới M1b: sheet sửa bản ghi vẽ "Nội dung" của Ghi chú bằng ô một dòng và vẫn hiện ô "Ghi chú" riêng; "Thêm bản ghi cũ" chưa có bốn loại mới trong ô "Loại"; Nhật ký chưa có chip lọc "Ăn dặm" và "Khác" (bốn loại mới vẫn hiện dưới "Tất cả"); Thống kê chưa có tab Ăn dặm.

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc; chỉ gồm những mục thuộc task của plan này):

1. **`QuickField.maxLength`.** §3.3 nói các ô chữ có `maxLength` nhưng không nói khai ở đâu. Plan thêm `maxLength?: number` vào `QuickField` và điền 80 / 200 / 500 trong `QUICK_FIELDS`. Ba component nhập nhanh ghi thẳng con số đó. `FieldList` bắt đầu dùng trường này ở M1b.
2. **`bath` "không có lỗi riêng".** `buildDetails("bath", …)` luôn trả `{ ok: true, details: {} }`, và `MESSAGES` không có khoá `bath`.
3. **`reaction` trống.** `buildDetails` bỏ khoá `reaction` khi ô chỉ có khoảng trắng. Schema từ chối `reaction: ""`.
4. **Chip món gần đây** chạy như chip thuốc gần đây đang có: lấy từ `recentLogs` của sheet (72 giờ gần nhất), bấm chip chỉ điền ô "Món", và không có trạng thái "đang chọn".
5. **Dòng phụ và placeholder của Ăn dặm** ("Đánh dấu lần đầu bé ăn món này", "Ví dụ: nổi mẩn quanh miệng") nằm trong `SolidsFields` (sheet nhập nhanh). `Segmented` "Lượng" có nhãn chữ "Lượng" phía trên, như bản vẽ.
6. **Ba icon mới** dùng đúng ba path của bản vẽ (bát có ba vạch hơi, cốc có vạch nước, bồn tắm có vòi), vì đó là hình người dùng đã xem. Chúng cùng kiểu với icon đang có.
7. **Bảng "+".** Chữ "đậm" là `font-semibold` (600), như mọi nhãn 13 px đang có của app. Nhãn ô được phép xuống 2 dòng và canh giữa: ô rộng khoảng 74 px ở màn 375 px, không đủ một dòng cho "Dừng nằm sấp". Dòng chú giải "= bấm giờ" (có icon đồng hồ) dưới tiêu đề sheet bị bỏ cùng với icon đồng hồ ở góc ô, vì nó chỉ giải thích icon đó. Tiêu đề sheet giữ `Ghi lại cho <tên bé>`. Nhãn "Nên bú" trên bản vẽ thuộc M2 (§5.3).
8. **Toast Hoàn tác được cắt ở 60 ký tự** (quyết định của phiên chính, 2026-11-17). Toast dùng `describeLog`, nên một ghi chú dài, hoặc một bản ghi Ăn dặm có phản ứng dài, sẽ cho toast nhiều dòng. Hàm mới `toastText` giữ 60 ký tự đầu của phần mô tả và thêm "…" khi nó dài hơn. Chỉ chữ của toast bị cắt; Nhật ký và danh sách "Gần đây" giữ nguyên văn. Hàm áp trong `savedMessage`, nên toast của mọi loại đều qua nó.
9. **Test cũ phải đổi dữ liệu:** `categoryOf("solids")` (dùng `solids` làm ví dụ "loại lạ") đổi sang `"vaccine"`; test đếm icon đổi từ 39 sang 42; các test khẳng định thứ tự cũ của `QUICK_ACTIONS` được viết lại ở Task 5.
10. **`bunx supabase db push`.** Plan chạy thêm `--dry-run` ngay trước để thấy đúng một migration sẽ được áp. Người dùng không đồng ý thì chỉ bước đó dừng: các task code vẫn làm tiếp trên nhánh, và không có gì được lên `main` (Task 5, Step 8).
11. **§6.3, đổi theme khi kiểm tay.** Plan đổi `data-theme` của `<html>` bằng javascript tool, không bấm gì trong Cài đặt. Cách này không ghi gì vào DB hay localStorage.

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

- **Patch.** Mọi thay đổi code nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 8** theo thứ tự xuất hiện trong file này (M1b đánh số lại từ 1 trong file của nó). Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell, vì hàm không sống qua lần gọi sau), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm, dấu cách là ngữ cảnh, `@@ -a,b +c,d @@` cho số dòng trước và sau khi sửa.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 8 patch đã được áp lần lượt lên một bản sao của `main` @ `213cc41`: sau mỗi task `tsc --noEmit` sạch và số test đúng như ghi ở task đó. Chưa chạy trong lúc viết plan: pgTAP, `bun run build`, kiểm Chrome. Ba việc đó thuộc người thực thi.
- **Formatter.** Code trong patch đã đúng định dạng prettier. Nếu sửa tay bằng công cụ Edit, hook prettier có thể xuống dòng lại vài dòng không liên quan (ví dụ một dòng `medicinePrefill` trong `lib/rules/quickEntry.test.ts`). Việc đó bình thường, cứ commit kèm.
- **Next.js.** Không task nào thêm route, thêm `import` từ `next/*`, hay đổi một lời gọi API của Next. Nếu thấy cần, dừng lại và đọc trang tương ứng trong `node_modules/next/dist/docs/01-app/` trước (AGENTS.md).
- **Màu.** Không patch nào thêm màu. Bốn loại mới dùng lại `cat-bottle`, `cat-pump`, `cat-diaper`, `cat-tummy`. `lib/themeGuard.test.ts` chạy trong `bunx vitest run` và phải xanh.
- **pgTAP cần Docker.** `bun run db:start`, `db:reset`, `db:test` chỉ chạm Supabase **local** trong Docker (OrbStack). Nếu Docker không chạy được, ô của bước đó để **chưa tick**, ghi "pgTAP 012 chưa chạy: Docker không chạy" vào báo cáo cuối, rồi làm tiếp. Không bao giờ đánh dấu đạt một bước chưa chạy.
- **Supabase thật.** Chỉ Task 1 Step 8 chạm vào project thật, và chỉ sau khi người dùng đồng ý. `bun run dev` chỉ chạy ở Task 5 Step 6.
- **Git.** Mọi commit nằm trên nhánh, ở máy. Plan này không push nhánh, không merge, không push `main`.

## Contracts with Other Plans

Plan này là mốc đầu. M1b (`docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1b.md`) làm tiếp ngay trên nhánh này. M2, M3, M4 chưa có plan; chúng dựa vào cả M1a lẫn M1b.

**Consumes:**

- Từ M1b, M2–M4: không có gì.
- Từ `main` @ `213cc41`: `describeLog` trả `Bản ghi không hợp lệ` và `categoryOf` trả mục trung tính cho loại lạ (§3.2); `useAddInstant`, outbox; `QuickActionsValue.openInstant(type: InstantType, initial?: QuickValues)`; `savedMessage`, `instantToast`, `stopToast` (`lib/rules/undo.ts`); `Sheet`, `Segmented` (2–6 lựa chọn), `Switch`, `NumberStepper`; `FIELD_INPUT`, `FIELD_LABEL`, `VALUE_CHIP`; `ML_STEP`, `stepAmount`; `findElements`, `hostElements` (`components/ui/testTree.ts`).

**Produces** (M1b và M2–M4 được dựa vào đúng những tên này):

- **DB:** `logs_type_check` trên `public.logs` nhận 12 giá trị: 8 giá trị cũ và `'solids'`, `'water'`, `'bath'`, `'note'`. File `supabase/migrations/20261117000100_log_types.sql`, test `supabase/tests/012_log_types.test.sql`. M3 dùng `20261117000200_reminders.sql` và `013`. Trạng thái "đã áp lên project thật hay chưa" nằm ở ô Task 1 Step 8 của file này.
- **`lib/rules/logDetails.ts`:**
  - `LOG_TYPES = ["breast", "bottle", "sleep", "diaper", "medicine", "temperature", "pump", "tummy", "solids", "water", "bath", "note"]`, và `LogType` theo đó.
  - `TIMER_TYPES` không đổi: `breast`, `sleep`, `pump`, `tummy`.
  - `detailsSchemas.solids`, `.water`, `.bath`, `.note`, với `LogDetails["solids"] = { food: string; amount: "little" | "some" | "lots"; isNew: boolean; reaction?: string }`; `LogDetails["water"] = { ml: number }`; `LogDetails["bath"] = {}`; `LogDetails["note"] = { text: string }`.
- **`lib/rules/describeLog.ts`:** `Ăn dặm · <food> · <ít|vừa|nhiều>[ · món mới][ · <reaction>]`, `Uống nước · <ml> ml`, `Tắm`, `Ghi chú · <text>`.
- **`lib/rules/quickEntry.ts`:**
  - `InstantType = "bottle" | "diaper" | "medicine" | "temperature" | "solids" | "water" | "bath" | "note"`.
  - `QuickField.kind` thêm `"textarea"`; `QuickField.maxLength?: number`.
  - `QUICK_FIELDS.solids` = `food` (`text`, `maxLength: 80`), `amount` (`select`, 3 lựa chọn), `isNew` (`checkbox`), `reaction` (`text`, `maxLength: 200`); `QUICK_FIELDS.water` = `ml` (`number`); `QUICK_FIELDS.bath = []`; `QUICK_FIELDS.note` = `text` (`textarea`, `maxLength: 500`).
  - `defaultQuickValues(type: InstantType): QuickValues` và `buildDetails(type: InstantType, values: QuickValues)` nhận đủ 8 loại; thông báo của `note` là "Nhập ghi chú".
  - `SOLIDS_AMOUNT_OPTIONS: { value: string; label: string }[]`.
  - `recentFoodNames(logs: LogLike[]): string[]`.
- **`lib/rules/undo.ts`:** `TOAST_TEXT_MAX = 60`; `toastText(text: string): string`; `savedMessage` cắt phần mô tả bằng `toastText`.
- **`lib/ui/icons.ts`:** 42 icon; mới: `bowl`, `glass`, `bath`.
- **`lib/ui/categories.ts`:** `CATEGORIES` có 12 mục; mới: `solids` (`cat-bottle`, `bowl`, "Ăn dặm"), `water` (`cat-pump`, `glass`, "Uống nước"), `bath` (`cat-diaper`, `bath`, "Tắm"), `note` (`cat-tummy`, `doc`, "Ghi chú").
- **`lib/rules/quickActions.ts`:**
  - `QuickActionGroup = "timer" | "quick" | "other"`; mọi `QuickAction` có thêm `group: QuickActionGroup`.
  - `QUICK_ACTION_GROUPS = [{ group: "timer", title: "Bấm giờ" }, { group: "quick", title: "Ghi nhanh" }, { group: "other", title: "Khác" }]`.
  - `QUICK_ACTIONS` có 13 mục, key theo đúng thứ tự: `breast-left`, `breast-right`, `sleep`, `pump`, `tummy` (nhóm `timer`, đều `kind: "timer"`); `bottle`, `diaper`, `medicine`, `temperature` (nhóm `quick`); `solids`, `water`, `bath`, `note` (nhóm `other`). Thứ tự này **khác** `main` (9 mục cũ bị xếp lại); đừng dựa vào chỉ số cũ.
- **`components/actions/ActionSheet.tsx`:** `QuickActionGrid({ running, onPick })` giữ nguyên props; mỗi nhóm là một `<section>` có `<h3>` và lưới 4 cột; ô là `<button>` cao 84 px, không còn `relative` và không còn icon đồng hồ. M2 gắn nhãn "Nên bú" lên ô `breast-left` / `breast-right` tại đây.
- **`components/quick/`:** `SolidsFields({ values, onChange, recent })`, `WaterFields({ values, onChange })`, `NoteFields({ values, onChange })`.
- **Nhánh:** `feat/kim-bun-ban-ghi-moi-m1a` với 5 commit của plan này. M1b cắt nhánh của nó từ đây.
- **Vitest sau M1a:** 827 test, 141 file.

**M1a không đụng tới:**

- Để M1b sửa: `lib/rules/logForm.ts`, `components/quick/FieldList.tsx`, `components/history/LogEditSheet.tsx`, `lib/rules/history.ts`, `lib/rules/dailyStats.ts`, `components/stats/StatsTable.tsx`, `components/stats/StatsScreen.tsx`.
- Để M2–M4 sửa: `lib/rules/timer.ts`, `lib/rules/ratings.ts` (`isFeed` giữ nguyên, §3.5), `lib/rules/pushSelection.ts`, `lib/rules/notifications.ts`, `lib/rules/alerts.ts`, `components/home/HeroCard.tsx`, `TimerButtons.tsx` (vẫn 5 nút, đúng thứ tự cũ), `QuickLogGrid.tsx` (giữ 4 ô), `HomeScreen.tsx`, `components/AuthGate.tsx`, `components/ui/Toast.tsx`, `sw/sw.template.js`, `docs/device-checklist.md` (bước 31–34 thuộc M4).

---

### Task 1: Migration `log_types` và pgTAP 012

**Files:**

- Create: `supabase/tests/012_log_types.test.sql`
- Create: `supabase/migrations/20261117000100_log_types.sql`

**Interfaces:**

- Consumes: check nội dòng trên cột `type` ở `supabase/migrations/20261113000100_schema.sql:41`. Postgres tự đặt tên nó là `logs_type_check`.
- Produces: `logs_type_check` nhận 12 giá trị (xem Contracts). Không có thay đổi TypeScript.

- [x] **Step 1: Tạo nhánh**

Run: `git switch -c feat/kim-bun-ban-ghi-moi-m1a && git log --oneline -1`
Expected: `Switched to a new branch 'feat/kim-bun-ban-ghi-moi-m1a'`, và dòng log bắt đầu bằng `213cc41`.

- [x] **Step 2: Viết test pgTAP hỏng**

Tạo `supabase/tests/012_log_types.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000012', 'la@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000022', 'Nhà L');
insert into public.family_members (family_id, email, user_id, role, display_name)
  values ('f0000000-0000-0000-0000-000000000022', 'la@example.com', 'aaaaaaaa-0000-0000-0000-000000000012', 'owner', 'Mẹ');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000022', 'Bé', '2026-05-01', 'female');

-- Spec 2026-11-17 §3.1: four more instant types (ended_at = started_at).
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1e000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000022', 'solids', now(), now(),
             '{"food": "Cháo bí đỏ", "amount": "some", "isNew": true}', 'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'solids is accepted');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1e000000-0000-0000-0000-000000000002', 'ba000000-0000-0000-0000-000000000022', 'water', now(), now(),
             '{"ml": 30}', 'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'water is accepted');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1e000000-0000-0000-0000-000000000003', 'ba000000-0000-0000-0000-000000000022', 'bath', now(), now(),
             '{}', 'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'bath is accepted');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1e000000-0000-0000-0000-000000000004', 'ba000000-0000-0000-0000-000000000022', 'note', now(), now(),
             '{"text": "Bé cười nhiều"}', 'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'note is accepted');

select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('1e000000-0000-0000-0000-000000000005', 'ba000000-0000-0000-0000-000000000022', 'abc', now(), now(),
             'aaaaaaaa-0000-0000-0000-000000000012') $$,
  '23514', null, 'an unknown type is still refused');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('1e000000-0000-0000-0000-000000000006', 'ba000000-0000-0000-0000-000000000022', 'tummy', now(), now(),
             'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'an old type still passes');

select * from finish();
rollback;
```

- [x] **Step 3: Chạy test để thấy hỏng**

Run: `open -a OrbStack; for i in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 2; done; bun run db:start && bun run db:test`

(`open` trả về trước khi Docker sẵn sàng, nên vòng lặp chờ tối đa 60 giây cho `docker info` chạy được rồi mới khởi động Supabase local.)
Expected: FAIL. `012_log_types.test.sql` hỏng 4 test đầu với `new row for relation "logs" violates check constraint "logs_type_check"` và báo `Failed 4/6 subtests`. `001`…`011` vẫn `ok`.

Nếu Docker không chạy được (OrbStack không mở, `db:start` báo không nối được Docker): để ô Step 3 và Step 5 **chưa tick**, ghi "pgTAP 012 chưa chạy: Docker không chạy" vào báo cáo cuối, rồi làm tiếp Step 4. Không đánh dấu đạt.

- [x] **Step 4: Viết migration**

Tạo `supabase/migrations/20261117000100_log_types.sql`:

```sql
-- Spec 2026-11-17 §3.1: four more instant log types. Only widens the check on logs.type.
alter table public.logs drop constraint logs_type_check;
alter table public.logs add constraint logs_type_check
  check (type in ('breast', 'bottle', 'sleep', 'diaper', 'medicine', 'temperature', 'pump', 'tummy',
                  'solids', 'water', 'bath', 'note'));
```

- [x] **Step 5: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS. `001`…`011` `ok`, `012_log_types.test.sql .. ok`, `All tests successful.` (`db:reset` chỉ dựng lại DB local trong Docker.)

- [x] **Step 6: Kiểm code không đổi**

Run: `bun run typecheck && bunx vitest run`
Expected: typecheck không lỗi; `Test Files  140 passed (140)`, `Tests  803 passed (803)`.

- [x] **Step 7: Commit**

```bash
git add supabase/migrations/20261117000100_log_types.sql supabase/tests/012_log_types.test.sql docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1.md docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1b.md
git commit -m "feat(db): logs accept solids, water, bath and note"
```

- [ ] **Step 8: Hỏi người dùng, rồi mới áp migration lên project thật**

Đây là bước duy nhất của plan chạm vào Supabase thật. Migration chỉ nới check nên bản web cũ vẫn chạy bình thường sau khi áp; ngược lại, bản web mới mà thiếu migration thì bản ghi loại mới bị từ chối với mã `23514` và outbox bỏ nó. Hỏi người dùng đúng câu sau và chờ trả lời trong phiên:

> Migration `20261117000100_log_types.sql` chỉ nới check `logs_type_check` của bảng `logs` (thêm `solids`, `water`, `bath`, `note`; không xoá, không đổi cột nào). pgTAP 012 trên Supabase local: [đạt / chưa chạy được vì Docker]. Tôi chạy `bunx supabase db push` lên project thật bây giờ được không?

**Người dùng không đồng ý, hoặc chưa trả lời:** dừng bước này. Không chạy lệnh nào bên dưới. Để ô này chưa tick và ghi "Chờ người dùng: db push `20261117000100_log_types.sql`" vào báo cáo cuối. Chỉ bước này dừng: Task 2–5, và cả plan M1b, chỉ sửa code trên nhánh nên vẫn làm tiếp được. Nhưng không có gì được lên `main` khi bước này chưa xong (Task 5, Step 8). Nếu người dùng đồng ý muộn (trong lúc làm M1b hoặc sau đó): chạy các lệnh của bước này lúc đó, tick ô này ngay trên nhánh đang đứng và commit thay đổi của file plan này, để việc "đã áp migration" không nằm trong một sửa đổi chưa commit.

**Người dùng đồng ý:**

Run: `bunx supabase db push --dry-run`
Expected: danh sách migration sẽ áp chỉ có `20261117000100_log_types.sql`. Nếu có thêm migration nào khác, dừng và báo người dùng, không push.

Run: `bunx supabase db push`
Expected: `Applying migration 20261117000100_log_types.sql...`, rồi `Finished supabase db push.` Nếu CLI hỏi `[Y/n]` thì trả lời `Y`; nếu shell không nhập được, chạy lại với `--yes`. Nếu CLI đòi mật khẩu DB hoặc báo chưa link project: dừng, không tự nhập mật khẩu, và ghi vào báo cáo cuối là việc người dùng tự làm.

---

### Task 2: Ba icon mới `bowl`, `glass`, `bath`

**Files:**

- Modify: `lib/ui/icons.ts:12` (thêm 3 dòng ngay sau `thermo`)
- Test: `lib/ui/categories.test.ts:43-48` (`describe("icon paths")`)

**Interfaces:**

- Consumes: không có.
- Produces: `ICON_PATHS.bowl`, `ICON_PATHS.glass`, `ICON_PATHS.bath`; `IconName` có thêm ba tên đó; `ICON_PATHS` có 42 khoá.

Icon ở repo này là một chuỗi `d` cho một `<path>` trong viewBox 24×24, nét 2 px, đầu bo tròn, không tô (`components/ui/Icon.tsx`). Ba path mới lấy từ bản vẽ: `bowl` là bát có đế và ba vạch hơi; `glass` là cốc thuôn có vạch mực nước; `bath` là bồn có hai chân choãi và một vòi cong bên trái.

- [x] **Step 1: Viết test hỏng (Patch 1)**

```diff
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -43,6 +43,14 @@ describe("log categories", () => {
 describe("icon paths", () => {
-  it("has the 39 icons the app uses, each a non-empty path", () => {
-    expect(Object.keys(ICON_PATHS)).toHaveLength(39);
+  it("has the 42 icons the app uses, each a non-empty path", () => {
+    expect(Object.keys(ICON_PATHS)).toHaveLength(42);
     for (const d of Object.values(ICON_PATHS)) expect(d).toMatch(/^[Mm]/);
   });
+
+  it("has bowl, glass and bath, each a closed shape plus detail strokes", () => {
+    const paths: Record<string, string> = ICON_PATHS;
+    for (const name of ["bowl", "glass", "bath"]) {
+      expect(paths[name], name).toMatch(/^M[^z]+z(M[^z]+)+$/);
+      expect(paths[name]).not.toMatch(/[^MmLlHhVvAaZz0-9 .-]/);
+    }
+  });
 });
```

- [x] **Step 2: Chạy test để thấy hỏng**

Run: `bunx vitest run lib/ui/categories.test.ts`
Expected: FAIL, `Tests  2 failed | 4 passed (6)`. "has the 42 icons…" báo `to have a length of 42 but got 39`; "has bowl, glass and bath…" báo `.toMatch() expects to receive a string, but got undefined`.

- [x] **Step 3: Thêm ba path (Patch 2)**

```diff
--- a/lib/ui/icons.ts
+++ b/lib/ui/icons.ts
@@ -12,2 +12,5 @@ export const ICON_PATHS = {
   thermo: "M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z",
+  bowl: "M3 11h18a9 9 0 0 1-18 0zM8 21h8M12 3v4M8 4v3M16 4v3",
+  glass: "M6 3h12l-1.5 17a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1L6 3zM7 10h10",
+  bath: "M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2",
   phone:
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: typecheck không lỗi; `Tests  804 passed (804)` (803 + 1).

- [x] **Step 5: Commit**

```bash
git add lib/ui/icons.ts lib/ui/categories.test.ts
git commit -m "feat(ui): bowl, glass and bath icons"
```

Hình dạng ba icon được nhìn bằng mắt ở Task 5 Step 6.

---

### Task 3: Component ô nhập cho Ăn dặm, Uống nước, Ghi chú

**Files:**

- Create: `components/quick/SolidsFields.tsx`
- Create: `components/quick/WaterFields.tsx`
- Create: `components/quick/NoteFields.tsx`
- Modify: `lib/rules/quickEntry.ts:13-14` (thêm `SOLIDS_AMOUNT_OPTIONS` ngay trên `QUICK_FIELDS`)
- Test (Create): `components/quick/newfields.test.tsx`

**Interfaces:**

- Consumes: `Segmented`, `Switch` (`components/ui/`); `NumberStepper`, `FIELD_INPUT`, `FIELD_LABEL`, `VALUE_CHIP` (`components/quick/`); `ML_STEP`, `stepAmount`, `QuickValues` (`lib/rules/quickEntry.ts`); `findElements`, `hostElements` (`components/ui/testTree.ts`).
- Produces:
  - `SOLIDS_AMOUNT_OPTIONS: { value: string; label: string }[]` = Ít / Vừa / Nhiều với giá trị `little` / `some` / `lots`.
  - `SolidsFields({ values, onChange, recent }: { values: QuickValues; onChange: (next: QuickValues) => void; recent: string[] })`. Đọc và ghi các khoá `food`, `amount`, `isNew`, `reaction`. Hàng "Món mới" có dòng phụ "Đánh dấu lần đầu bé ăn món này"; ô "Phản ứng (nếu có)" có placeholder "Ví dụ: nổi mẩn quanh miệng".
  - `WaterFields({ values, onChange })`. Khoá `ml`.
  - `NoteFields({ values, onChange })`. Khoá `text`.

Ba component này hook-free như `BottleFields`, để test gọi thẳng như hàm. Chưa nơi nào dùng chúng: Task 4 nối vào `QuickEntrySheet`. `SOLIDS_AMOUNT_OPTIONS` phải đứng **trên** `QUICK_FIELDS` trong file, vì Task 4 dùng nó ngay trong `QUICK_FIELDS`.

- [x] **Step 1: Viết test hỏng (Patch 3: file mới)**

```diff
--- /dev/null
+++ b/components/quick/newfields.test.tsx
@@ -0,0 +1,110 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements, hostElements } from "@/components/ui/testTree";
+import { NoteFields } from "./NoteFields";
+import { SolidsFields } from "./SolidsFields";
+import { WaterFields } from "./WaterFields";
+
+const typing = (value: string) => ({ target: { value } });
+
+describe("SolidsFields", () => {
+  const values = { food: "Cháo", amount: "some", isNew: false, reaction: "" };
+
+  it("food with recent chips, amount, new-food switch and reaction", () => {
+    const html = renderToStaticMarkup(
+      <SolidsFields
+        values={values}
+        onChange={() => {}}
+        recent={["Bí đỏ", "Chuối"]}
+      />,
+    );
+    expect(html).toContain(">Món</span>");
+    expect(html).toContain('value="Cháo"');
+    expect(html).toContain('maxLength="80"');
+    expect(html).toContain('aria-label="Món gần đây"');
+    expect(html).toContain(">Bí đỏ</button>");
+    expect(html).toContain(">Chuối</button>");
+    expect(html).toContain('aria-label="Lượng"');
+    expect(html).toMatch(/aria-pressed="true"[^>]*>Vừa<\/button>/);
+    expect(html).toContain(">Ít</button>");
+    expect(html).toContain(">Nhiều</button>");
+    expect(html).toMatch(
+      /role="switch" aria-checked="false" aria-label="Món mới"/,
+    );
+    expect(html).toContain(">Đánh dấu lần đầu bé ăn món này</span>");
+    expect(html).toContain(">Phản ứng (nếu có)</span>");
+    expect(html).toContain('maxLength="200"');
+    expect(html).toContain('placeholder="Ví dụ: nổi mẩn quanh miệng"');
+  });
+
+  it("hides the chip row when nothing was logged before", () => {
+    const html = renderToStaticMarkup(
+      <SolidsFields values={values} onChange={() => {}} recent={[]} />,
+    );
+    expect(html).not.toContain("Món gần đây");
+  });
+
+  it("a chip fills the food; amount, switch and reaction report their own key", () => {
+    const onChange = vi.fn();
+    const tree = SolidsFields({ values, onChange, recent: ["Bí đỏ"] });
+    const [chip] = findElements(tree, (el) => el.props.children === "Bí đỏ");
+    (chip.props.onClick as () => void)();
+    expect(onChange).toHaveBeenLastCalledWith({ ...values, food: "Bí đỏ" });
+    const [amount] = findElements(tree, (el) => el.props.options !== undefined);
+    (amount.props.onChange as (v: string) => void)("lots");
+    expect(onChange).toHaveBeenLastCalledWith({ ...values, amount: "lots" });
+    const [isNew] = findElements(tree, (el) => el.props.label === "Món mới");
+    (isNew.props.onChange as (v: boolean) => void)(true);
+    expect(onChange).toHaveBeenLastCalledWith({ ...values, isNew: true });
+    const [, reaction] = hostElements(tree, "input");
+    (reaction.props.onChange as (e: unknown) => void)(typing("nổi mẩn"));
+    expect(onChange).toHaveBeenLastCalledWith({
+      ...values,
+      reaction: "nổi mẩn",
+    });
+  });
+});
+
+describe("WaterFields", () => {
+  it("one big ml field stepped by 10", () => {
+    const onChange = vi.fn();
+    const html = renderToStaticMarkup(
+      <WaterFields values={{ ml: "30" }} onChange={onChange} />,
+    );
+    expect(html).toContain(">Số ml</span>");
+    expect(html).toContain('value="30"');
+    expect(html).toContain('aria-label="Bớt 10 ml"');
+    expect(html).toContain('aria-label="Thêm 10 ml"');
+    const [stepper] = findElements(
+      WaterFields({ values: { ml: "30" }, onChange }),
+      (el) => el.props.plus !== undefined,
+    );
+    const { minus, plus } = stepper.props as {
+      minus: { onPress: () => void };
+      plus: { onPress: () => void };
+    };
+    plus.onPress();
+    expect(onChange).toHaveBeenLastCalledWith({ ml: "40" });
+    minus.onPress();
+    expect(onChange).toHaveBeenLastCalledWith({ ml: "20" });
+  });
+});
+
+describe("NoteFields", () => {
+  it("a three-line textarea capped at 500 characters", () => {
+    const onChange = vi.fn();
+    const html = renderToStaticMarkup(
+      <NoteFields values={{ text: "Bé cười nhiều" }} onChange={onChange} />,
+    );
+    expect(html).toContain(">Nội dung</span>");
+    expect(html).toMatch(/<textarea[^>]*rows="3"/);
+    expect(html).toMatch(/<textarea[^>]*maxLength="500"/);
+    expect(html).toContain(">Bé cười nhiều</textarea>");
+    const [area] = hostElements(
+      NoteFields({ values: { text: "" }, onChange }),
+      "textarea",
+    );
+    (area.props.onChange as (e: unknown) => void)(typing("Mọc răng"));
+    expect(onChange).toHaveBeenLastCalledWith({ text: "Mọc răng" });
+  });
+});
```

- [x] **Step 2: Chạy test để thấy hỏng**

Run: `bunx vitest run components/quick/newfields.test.tsx`
Expected: FAIL, `Test Files  1 failed (1)`, lỗi `Cannot find module './NoteFields'`.

- [x] **Step 3: Viết hằng và ba component (Patch 4: ba file mới và một hằng trong `quickEntry.ts`)**

```diff
--- /dev/null
+++ b/components/quick/NoteFields.tsx
@@ -0,0 +1,24 @@
+import type { QuickValues } from "@/lib/rules/quickEntry";
+import { FIELD_INPUT, FIELD_LABEL } from "./styles";
+
+// Spec 2026-11-17 §3.3: the note itself, three lines tall, at most 500 characters.
+export function NoteFields({
+  values,
+  onChange,
+}: {
+  values: QuickValues;
+  onChange: (next: QuickValues) => void;
+}) {
+  return (
+    <label className="flex flex-col gap-1.5">
+      <span className={FIELD_LABEL}>Nội dung</span>
+      <textarea
+        rows={3}
+        maxLength={500}
+        className={`${FIELD_INPUT} py-2.5`}
+        value={String(values.text ?? "")}
+        onChange={(event) => onChange({ ...values, text: event.target.value })}
+      />
+    </label>
+  );
+}
--- /dev/null
+++ b/components/quick/SolidsFields.tsx
@@ -0,0 +1,84 @@
+import { Segmented } from "@/components/ui/Segmented";
+import { Switch } from "@/components/ui/Switch";
+import {
+  SOLIDS_AMOUNT_OPTIONS,
+  type QuickValues,
+} from "@/lib/rules/quickEntry";
+import { FIELD_INPUT, FIELD_LABEL, VALUE_CHIP } from "./styles";
+
+// Spec 2026-11-17 §3.3: food name with recent-food chips, amount, "new food" and reaction.
+export function SolidsFields({
+  values,
+  onChange,
+  recent,
+}: {
+  values: QuickValues;
+  onChange: (next: QuickValues) => void;
+  recent: string[];
+}) {
+  const set = (key: string, next: string | boolean) =>
+    onChange({ ...values, [key]: next });
+  return (
+    <div className="flex flex-col gap-4">
+      <label className="flex flex-col gap-1.5">
+        <span className={FIELD_LABEL}>Món</span>
+        <input
+          className={FIELD_INPUT}
+          maxLength={80}
+          value={String(values.food ?? "")}
+          onChange={(event) => set("food", event.target.value)}
+        />
+      </label>
+      {recent.length > 0 && (
+        <div
+          role="group"
+          aria-label="Món gần đây"
+          className="flex flex-wrap gap-2"
+        >
+          {recent.map((name) => (
+            <button
+              key={name}
+              type="button"
+              onClick={() => set("food", name)}
+              className={VALUE_CHIP}
+            >
+              {name}
+            </button>
+          ))}
+        </div>
+      )}
+      <div className="flex flex-col gap-1.5">
+        <span className={FIELD_LABEL}>Lượng</span>
+        <Segmented
+          label="Lượng"
+          options={SOLIDS_AMOUNT_OPTIONS}
+          value={String(values.amount)}
+          onChange={(amount) => set("amount", amount)}
+        />
+      </div>
+      <div className="glass flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] px-4 py-2">
+        <span className="flex flex-col">
+          <span className="text-base text-ink">Món mới</span>
+          <span className="text-[13px] leading-[18px] text-muted">
+            Đánh dấu lần đầu bé ăn món này
+          </span>
+        </span>
+        <Switch
+          checked={values.isNew === true}
+          label="Món mới"
+          onChange={(next) => set("isNew", next)}
+        />
+      </div>
+      <label className="flex flex-col gap-1.5">
+        <span className={FIELD_LABEL}>Phản ứng (nếu có)</span>
+        <input
+          className={`${FIELD_INPUT} placeholder:text-muted`}
+          maxLength={200}
+          placeholder="Ví dụ: nổi mẩn quanh miệng"
+          value={String(values.reaction ?? "")}
+          onChange={(event) => set("reaction", event.target.value)}
+        />
+      </label>
+    </div>
+  );
+}
--- /dev/null
+++ b/components/quick/WaterFields.tsx
@@ -0,0 +1,32 @@
+import { ML_STEP, stepAmount, type QuickValues } from "@/lib/rules/quickEntry";
+import { NumberStepper } from "./NumberStepper";
+
+// Spec 2026-11-17 §3.3: one ml field stepped by 10, like the bottle's.
+export function WaterFields({
+  values,
+  onChange,
+}: {
+  values: QuickValues;
+  onChange: (next: QuickValues) => void;
+}) {
+  const ml = String(values.ml ?? "");
+  const setMl = (next: string) => onChange({ ...values, ml: next });
+  return (
+    <NumberStepper
+      label="Số ml"
+      value={ml}
+      unit="ml"
+      minus={{
+        text: "−10",
+        label: "Bớt 10 ml",
+        onPress: () => setMl(stepAmount(ml, -10, ML_STEP)),
+      }}
+      plus={{
+        text: "+10",
+        label: "Thêm 10 ml",
+        onPress: () => setMl(stepAmount(ml, 10, ML_STEP)),
+      }}
+      onChange={setMl}
+    />
+  );
+}
--- a/lib/rules/quickEntry.ts
+++ b/lib/rules/quickEntry.ts
@@ -13,2 +13,9 @@ export type QuickField = {

+// Spec 2026-11-17 §3.3: how much the baby ate. Declared above QUICK_FIELDS, which uses it.
+export const SOLIDS_AMOUNT_OPTIONS: { value: string; label: string }[] = [
+  { value: "little", label: "Ít" },
+  { value: "some", label: "Vừa" },
+  { value: "lots", label: "Nhiều" },
+];
+
 export const QUICK_FIELDS: Record<InstantType, QuickField[]> = {
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: typecheck không lỗi; `Test Files  141 passed (141)`, `Tests  809 passed (809)` (804 + 5).

- [x] **Step 5: Commit**

```bash
git add lib/rules/quickEntry.ts components/quick/SolidsFields.tsx components/quick/WaterFields.tsx components/quick/NoteFields.tsx components/quick/newfields.test.tsx
git commit -m "feat(quick): field components for solids, water and note"
```

---

### Task 4: Bốn loại mới trong kiểu dữ liệu, mô tả, danh mục, sheet nhập nhanh và toast

**Files:**

- Modify: `lib/rules/logDetails.ts:3-12` (`LOG_TYPES`), `:79-89` (schema mới, `detailsSchemas`)
- Modify: `lib/rules/describeLog.ts:31` (`AMOUNT`), `:80-84` (4 `case` mới)
- Modify: `lib/ui/categories.ts:18-19` (4 mục `CATEGORIES`)
- Modify: `lib/rules/quickEntry.ts` (`InstantType`, `QuickField`, `QUICK_FIELDS`, `DEFAULTS`, `MESSAGES`, `rawDetails`, `buildDetails`, hàm mới `recentFoodNames`)
- Modify: `components/home/QuickEntrySheet.tsx:6-8` và `:20` (import), `:33-38` (`TITLES`), `:133-134` (`fields`)
- Modify: `lib/rules/undo.ts:21-23` (hàm mới `toastText`, dùng trong `savedMessage`)
- Test: `lib/rules/logDetails.test.ts`, `lib/rules/describeLog.test.ts`, `lib/ui/categories.test.ts`, `lib/rules/quickEntry.test.ts`, `components/home/quickentry.test.tsx`, `lib/rules/undo.test.ts`

**Interfaces:**

- Consumes: `ICON_PATHS.bowl` / `.glass` / `.bath` (Task 2); `SolidsFields`, `WaterFields`, `NoteFields`, `SOLIDS_AMOUNT_OPTIONS` (Task 3).
- Produces:
  - `LOG_TYPES` có 12 giá trị; `detailsSchemas.solids`, `.water`, `.bath`, `.note`.
  - `describeLog` cho 4 loại mới.
  - `CATEGORIES.solids`, `.water`, `.bath`, `.note`.
  - `InstantType` có 8 giá trị; `QuickField.kind` thêm `"textarea"`; `QuickField.maxLength?: number`.
  - `QUICK_FIELDS`, `defaultQuickValues(type)`, `buildDetails(type, values)` cho 4 loại mới. Thông báo lỗi: `solids` "Nhập tên món", `water` "Nhập số ml từ 1 đến 500", `note` "Nhập ghi chú".
  - `recentFoodNames(logs: LogLike[]): string[]`.
  - `QuickEntrySheet` mở được `type="solids" | "water" | "bath" | "note"`.
  - `TOAST_TEXT_MAX = 60` và `toastText(text: string): string` trong `lib/rules/undo.ts`: trả nguyên `text` khi nó có tối đa 60 ký tự, ngược lại trả 60 ký tự đầu cộng "…". `savedMessage(log, at)` trả `Đã ghi <toastText(describeLog(log, at))> lúc <HH:mm>`.

Task này lớn hơn các task khác vì một lý do: 5 file nguồn đầu tiên bắt buộc phải đổi cùng lúc thì typecheck mới xanh (xem Architecture). Không tách commit giữa chừng.

`toastText` nằm ở task này vì đây là lúc toast của Ghi chú và của Ăn dặm có phản ứng dài trở nên có thể xảy ra (Diễn giải spec, mục 8). `savedMessage` là nơi duy nhất dựng chữ của toast Hoàn tác (`instantToast` và `stopToast` đều gọi nó), và không nơi nào khác dùng nó, nên Nhật ký và danh sách "Gần đây" vẫn hiện nguyên văn.

Không sửa `isFeed` (`lib/rules/ratings.ts`) và `QuickLogGrid`: `solids` và `water` không phải cữ bú, và lưới trang chủ giữ 4 ô (§3.3, §3.5).

- [x] **Step 1: Viết test hỏng (Patch 5: 6 file test)**

```diff
--- a/components/home/quickentry.test.tsx
+++ b/components/home/quickentry.test.tsx
@@ -61,2 +61,39 @@ describe("QuickEntrySheet", () => {

+  it("solids: bowl chip, its fields with a recent-food chip, then the time chips", () => {
+    const chao = {
+      ...bottle,
+      id: "s1",
+      type: "solids",
+      details: { food: "Cháo bí đỏ", amount: "some", isNew: false },
+    } as LogRow;
+    const html = render({ type: "solids", recentLogs: [chao] });
+    expect(html).toContain(">Ăn dặm</h2>");
+    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
+    expect(html).toContain(`d="${ICON_PATHS.bowl}"`);
+    expect(html).toContain(">Cháo bí đỏ</button>");
+    expect(html.indexOf(">Phản ứng (nếu có)</span>")).toBeLessThan(
+      html.indexOf(">Lúc nào?</span>"),
+    );
+  });
+
+  it("water, bath and note: own title and icon; bath has no field at all", () => {
+    const water = render({ type: "water" });
+    expect(water).toContain(">Uống nước</h2>");
+    expect(water).toContain("bg-cat-pump/15 text-cat-pump");
+    expect(water).toContain(`d="${ICON_PATHS.glass}"`);
+    expect(water).toContain('aria-label="Thêm 10 ml"');
+    const bath = render({ type: "bath" });
+    expect(bath).toContain(">Tắm</h2>");
+    expect(bath).toContain("bg-cat-diaper/15 text-cat-diaper");
+    expect(bath).toContain(`d="${ICON_PATHS.bath}"`);
+    expect(bath).not.toContain("<input");
+    expect(bath).not.toContain("<textarea");
+    expect(bath).toContain(">Lúc nào?</span>");
+    const note = render({ type: "note" });
+    expect(note).toContain(">Ghi chú</h2>");
+    expect(note).toContain("bg-cat-tummy/15 text-cat-tummy");
+    expect(note).toContain(`d="${ICON_PATHS.doc}"`);
+    expect(note).toMatch(/<textarea[^>]*maxLength="500"/);
+  });
+
   it("keeps the Vitamin D prefill", () => {
--- a/lib/rules/describeLog.test.ts
+++ b/lib/rules/describeLog.test.ts
@@ -85,2 +85,34 @@ describe("describeLog", () => {
   });
+  const instant = (type: string, details: unknown) =>
+    describeLog(
+      {
+        type,
+        started_at: "2026-11-13T02:00:00Z",
+        ended_at: "2026-11-13T02:00:00Z",
+        details,
+      },
+      now,
+    );
+  it("describes solids with its amount, new-food mark and reaction", () => {
+    const solids = { food: "Cháo bí đỏ", amount: "some", isNew: false };
+    expect(instant("solids", solids)).toBe("Ăn dặm · Cháo bí đỏ · vừa");
+    expect(
+      instant("solids", { ...solids, amount: "little", isNew: true }),
+    ).toBe("Ăn dặm · Cháo bí đỏ · ít · món mới");
+    expect(
+      instant("solids", { ...solids, amount: "lots", reaction: "nổi mẩn" }),
+    ).toBe("Ăn dặm · Cháo bí đỏ · nhiều · nổi mẩn");
+    expect(
+      instant("solids", { ...solids, isNew: true, reaction: "nổi mẩn" }),
+    ).toBe("Ăn dặm · Cháo bí đỏ · vừa · món mới · nổi mẩn");
+  });
+  it("describes water, bath and note", () => {
+    expect(instant("water", { ml: 30 })).toBe("Uống nước · 30 ml");
+    expect(instant("bath", {})).toBe("Tắm");
+    expect(instant("note", { text: "Bé cười nhiều" })).toBe(
+      "Ghi chú · Bé cười nhiều",
+    );
+    expect(instant("water", { ml: 0 })).toBe("Bản ghi không hợp lệ");
+    expect(instant("vaccine", {})).toBe("Bản ghi không hợp lệ");
+  });
   it("falls back for invalid details", () => {
--- a/lib/rules/logDetails.test.ts
+++ b/lib/rules/logDetails.test.ts
@@ -4,2 +4,3 @@ import {
   isTimerType,
+  LOG_TYPES,
   MEDICINE_UNITS,
@@ -79,2 +80,57 @@ describe("detailsSchemas", () => {

+describe("solids, water, bath and note (spec 2026-11-17 §3.1)", () => {
+  const solids = { food: "Cháo bí đỏ", amount: "some", isNew: false };
+  const ok = (type: "solids" | "water" | "bath" | "note", details: unknown) =>
+    detailsSchemas[type].safeParse(details).success;
+
+  it("LOG_TYPES ends with the four new types, none of them a timer", () => {
+    expect(LOG_TYPES).toHaveLength(12);
+    expect(LOG_TYPES.slice(8)).toEqual(["solids", "water", "bath", "note"]);
+    for (const type of ["solids", "water", "bath", "note"] as const)
+      expect(isTimerType(type)).toBe(false);
+  });
+
+  it("solids: food of 1–80 characters, three amounts, isNew, optional reaction up to 200", () => {
+    expect(ok("solids", solids)).toBe(true);
+    expect(ok("solids", { ...solids, food: "a".repeat(80) })).toBe(true);
+    expect(ok("solids", { ...solids, food: "a".repeat(81) })).toBe(false);
+    expect(ok("solids", { ...solids, food: "" })).toBe(false);
+    expect(ok("solids", { ...solids, food: "   " })).toBe(false);
+    for (const amount of ["little", "some", "lots"])
+      expect(ok("solids", { ...solids, amount })).toBe(true);
+    expect(ok("solids", { ...solids, amount: "half" })).toBe(false);
+    expect(ok("solids", { food: "Cháo", amount: "some" })).toBe(false);
+    expect(ok("solids", { ...solids, reaction: "r".repeat(200) })).toBe(true);
+    expect(ok("solids", { ...solids, reaction: "r".repeat(201) })).toBe(false);
+    expect(ok("solids", { ...solids, reaction: "" })).toBe(false);
+    expect(ok("solids", { ...solids, extra: 1 })).toBe(false);
+    expect(
+      detailsSchemas.solids.parse({ ...solids, food: "  Cháo  " }).food,
+    ).toBe("Cháo");
+  });
+
+  it("water: a whole number of ml from 1 to 500", () => {
+    expect(ok("water", { ml: 1 })).toBe(true);
+    expect(ok("water", { ml: 500 })).toBe(true);
+    expect(ok("water", { ml: 0 })).toBe(false);
+    expect(ok("water", { ml: 501 })).toBe(false);
+    expect(ok("water", { ml: 12.5 })).toBe(false);
+    expect(ok("water", { ml: 30, milk: "formula" })).toBe(false);
+  });
+
+  it("bath: only the empty object", () => {
+    expect(ok("bath", {})).toBe(true);
+    expect(ok("bath", { minutes: 10 })).toBe(false);
+  });
+
+  it("note: text of 1–500 characters after trimming", () => {
+    expect(ok("note", { text: "Bé cười nhiều" })).toBe(true);
+    expect(ok("note", { text: "a".repeat(500) })).toBe(true);
+    expect(ok("note", { text: "a".repeat(501) })).toBe(false);
+    expect(ok("note", { text: "" })).toBe(false);
+    expect(ok("note", { text: "  " })).toBe(false);
+    expect(ok("note", { text: "a", extra: 1 })).toBe(false);
+  });
+});
+
 describe("isTimerType", () => {
--- a/lib/rules/quickEntry.test.ts
+++ b/lib/rules/quickEntry.test.ts
@@ -12,2 +12,3 @@ import {
   recentBottleAmounts,
+  recentFoodNames,
   recentMedicineNames,
@@ -86,2 +87,6 @@ describe("buildDetails", () => {
       "temperature",
+      "solids",
+      "water",
+      "bath",
+      "note",
     ] as const) {
@@ -94,2 +99,88 @@ describe("buildDetails", () => {

+describe("solids, water, bath and note (spec 2026-11-17 §3.3)", () => {
+  it("fields: labels, kinds and the schema's length limits", () => {
+    expect(
+      QUICK_FIELDS.solids.map((f) => [f.key, f.label, f.kind, f.maxLength]),
+    ).toEqual([
+      ["food", "Món", "text", 80],
+      ["amount", "Lượng", "select", undefined],
+      ["isNew", "Món mới", "checkbox", undefined],
+      ["reaction", "Phản ứng (nếu có)", "text", 200],
+    ]);
+    expect(QUICK_FIELDS.solids[1].options).toEqual([
+      { value: "little", label: "Ít" },
+      { value: "some", label: "Vừa" },
+      { value: "lots", label: "Nhiều" },
+    ]);
+    expect(QUICK_FIELDS.water).toEqual([
+      { key: "ml", label: "Số ml", kind: "number" },
+    ]);
+    expect(QUICK_FIELDS.bath).toEqual([]);
+    expect(QUICK_FIELDS.note).toEqual([
+      { key: "text", label: "Nội dung", kind: "textarea", maxLength: 500 },
+    ]);
+  });
+
+  it("defaults: a medium portion of nothing yet, empty ml, empty note", () => {
+    expect(defaultQuickValues("solids")).toEqual({
+      food: "",
+      amount: "some",
+      isNew: false,
+      reaction: "",
+    });
+    expect(defaultQuickValues("water")).toEqual({ ml: "" });
+    expect(defaultQuickValues("bath")).toEqual({});
+    expect(defaultQuickValues("note")).toEqual({ text: "" });
+  });
+
+  it("solids: trims, leaves out an empty reaction, needs a food name", () => {
+    const values = {
+      food: " Cháo bí đỏ ",
+      amount: "little",
+      isNew: true,
+      reaction: "  ",
+    };
+    expect(buildDetails("solids", values)).toEqual({
+      ok: true,
+      details: { food: "Cháo bí đỏ", amount: "little", isNew: true },
+    });
+    expect(
+      buildDetails("solids", { ...values, reaction: " nổi mẩn " }),
+    ).toEqual({
+      ok: true,
+      details: {
+        food: "Cháo bí đỏ",
+        amount: "little",
+        isNew: true,
+        reaction: "nổi mẩn",
+      },
+    });
+    expect(buildDetails("solids", { ...values, food: "  " })).toEqual({
+      ok: false,
+      message: "Nhập tên món",
+    });
+  });
+
+  it("water, bath and note: details and messages", () => {
+    expect(buildDetails("water", { ml: "30" })).toEqual({
+      ok: true,
+      details: { ml: 30 },
+    });
+    for (const ml of ["", "0", "501", "12,5"])
+      expect(buildDetails("water", { ml })).toEqual({
+        ok: false,
+        message: "Nhập số ml từ 1 đến 500",
+      });
+    expect(buildDetails("bath", {})).toEqual({ ok: true, details: {} });
+    expect(buildDetails("note", { text: " Bé cười nhiều " })).toEqual({
+      ok: true,
+      details: { text: "Bé cười nhiều" },
+    });
+    expect(buildDetails("note", { text: "   " })).toEqual({
+      ok: false,
+      message: "Nhập ghi chú",
+    });
+  });
+});
+
 const at = (minutesAgo: number) =>
@@ -151,2 +242,24 @@ describe("recent suggestions", () => {

+  it("recentFoodNames: up to 4 names, case-insensitive, latest spelling", () => {
+    const food = (minutesAgo: number, name: string): LogLike => ({
+      type: "solids",
+      started_at: at(minutesAgo),
+      ended_at: at(minutesAgo),
+      details: { food: name, amount: "some", isNew: false },
+    });
+    expect(
+      recentFoodNames([
+        food(100, "cháo bí đỏ"),
+        food(10, "Cháo bí đỏ "),
+        food(20, "Chuối"),
+        food(30, "Bơ"),
+        food(40, "Khoai lang"),
+        food(50, "Táo"),
+        medLog(1, "Vitamin D"),
+        { ...food(5, "Hỏng"), details: { food: "Hỏng" } },
+      ]),
+    ).toEqual(["Cháo bí đỏ", "Chuối", "Bơ", "Khoai lang"]);
+    expect(recentFoodNames([])).toEqual([]);
+  });
+
   it("MEDICINE_PRESETS: Vitamin D, DHA, Men tiêu hoá in that order", () => {
--- a/lib/rules/undo.test.ts
+++ b/lib/rules/undo.test.ts
@@ -11,2 +11,3 @@ import {
   stoppedOnly,
+  toastText,
   UNDO_LABEL,
@@ -58,2 +59,36 @@ describe("undo toasts", () => {

+  it("toastText keeps up to 60 characters and marks a cut with …", () => {
+    expect(toastText("Tắm")).toBe("Tắm");
+    expect(toastText("ă".repeat(60))).toBe("ă".repeat(60));
+    expect(toastText("ă".repeat(61))).toBe(`${"ă".repeat(60)}…`);
+  });
+
+  it("a long note or a long reaction is cut in the toast only", () => {
+    const note = instantToast({
+      id: "n2",
+      type: "note",
+      details: { text: "a".repeat(500) },
+      at: AT,
+    });
+    expect(note.message).toBe(`Đã ghi Ghi chú · ${"a".repeat(50)}… lúc 12:00`);
+    expect(note.undo).toEqual({ kind: "delete", id: "n2" });
+    const solids = instantToast({
+      id: "n3",
+      type: "solids",
+      details: {
+        food: "Cháo bí đỏ",
+        amount: "some",
+        isNew: true,
+        reaction: "r".repeat(200),
+      },
+      at: AT,
+    });
+    expect(solids.message).toBe(
+      `Đã ghi Ăn dặm · Cháo bí đỏ · vừa · món mới · ${"r".repeat(22)}… lúc 12:00`,
+    );
+    expect(
+      instantToast({ id: "n4", type: "bath", details: {}, at: AT }).message,
+    ).toBe("Đã ghi Tắm lúc 12:00");
+  });
+
   it("a stopped timer: describes the duration at the stop time, undo resumes it", () => {
--- a/lib/ui/categories.test.ts
+++ b/lib/ui/categories.test.ts
@@ -21,2 +21,6 @@ describe("log categories", () => {
       temperature: { token: "cat-temp", icon: "thermo", label: "Nhiệt độ" },
+      solids: { token: "cat-bottle", icon: "bowl", label: "Ăn dặm" },
+      water: { token: "cat-pump", icon: "glass", label: "Uống nước" },
+      bath: { token: "cat-diaper", icon: "bath", label: "Tắm" },
+      note: { token: "cat-tummy", icon: "doc", label: "Ghi chú" },
     });
@@ -26,3 +30,3 @@ describe("log categories", () => {
     expect(categoryOf("sleep")).toBe(CATEGORIES.sleep);
-    expect(categoryOf("solids")).toEqual({
+    expect(categoryOf("vaccine")).toEqual({
       token: "cat-med",
```

- [x] **Step 2: Chạy test để thấy hỏng**

Run: `bunx vitest run lib/rules/logDetails.test.ts lib/rules/describeLog.test.ts lib/ui/categories.test.ts lib/rules/quickEntry.test.ts components/home/quickentry.test.tsx lib/rules/undo.test.ts`
Expected: FAIL, `Test Files  6 failed (6)`, `Tests  18 failed | 38 passed (56)`. Vài lỗi tiêu biểu: `to have a length of 12 but got 8`, `expected 'Bản ghi không hợp lệ' to be 'Ăn dặm · Cháo bí đỏ · vừa'`, `recentFoodNames is not a function`, `toastText is not a function`.

- [x] **Step 3: Viết code (Patch 6: 6 file nguồn)**

```diff
--- a/components/home/QuickEntrySheet.tsx
+++ b/components/home/QuickEntrySheet.tsx
@@ -6,4 +6,7 @@ import { DiaperFields } from "@/components/quick/DiaperFields";
 import { MedicineFields } from "@/components/quick/MedicineFields";
+import { NoteFields } from "@/components/quick/NoteFields";
+import { SolidsFields } from "@/components/quick/SolidsFields";
 import { TemperatureFields } from "@/components/quick/TemperatureFields";
 import { TimeChips } from "@/components/quick/TimeChips";
+import { WaterFields } from "@/components/quick/WaterFields";
 import { Button } from "@/components/ui/Button";
@@ -19,2 +22,3 @@ import {
   recentBottleAmounts,
+  recentFoodNames,
   recentMedicineNames,
@@ -37,2 +41,6 @@ const TITLES: Record<InstantType, string> = {
   temperature: "Đo nhiệt độ",
+  solids: "Ăn dặm",
+  water: "Uống nước",
+  bath: "Tắm",
+  note: "Ghi chú",
 };
@@ -133,2 +141,13 @@ export function QuickEntrySheet({
     temperature: <TemperatureFields values={values} onChange={setValues} />,
+    solids: (
+      <SolidsFields
+        values={values}
+        onChange={setValues}
+        recent={recentFoodNames(recentLogs)}
+      />
+    ),
+    water: <WaterFields values={values} onChange={setValues} />,
+    // Tắm has no fields: the sheet is just the time chips and Lưu.
+    bath: null,
+    note: <NoteFields values={values} onChange={setValues} />,
   }[type];
--- a/lib/rules/describeLog.ts
+++ b/lib/rules/describeLog.ts
@@ -30,2 +30,3 @@ const METHOD = {
 } as const;
+const AMOUNT = { little: "ít", some: "vừa", lots: "nhiều" } as const;
 const TIMER_LABEL = {
@@ -83,2 +84,16 @@ export function describeLog(log: LogLike, now: Date): string {
     }
+    case "solids": {
+      const d = parsed.data as LogDetails["solids"];
+      return `Ăn dặm · ${d.food} · ${AMOUNT[d.amount]}${d.isNew ? " · món mới" : ""}${d.reaction ? ` · ${d.reaction}` : ""}`;
+    }
+    case "water": {
+      const d = parsed.data as LogDetails["water"];
+      return `Uống nước · ${d.ml} ml`;
+    }
+    case "bath":
+      return "Tắm";
+    case "note": {
+      const d = parsed.data as LogDetails["note"];
+      return `Ghi chú · ${d.text}`;
+    }
   }
--- a/lib/rules/logDetails.ts
+++ b/lib/rules/logDetails.ts
@@ -11,2 +11,6 @@ export const LOG_TYPES = [
   "tummy",
+  "solids",
+  "water",
+  "bath",
+  "note",
 ] as const;
@@ -78,2 +82,13 @@ const pump = z
   .strict();
+// Spec 2026-11-17 §3.1: four instant types. An empty reaction is left out, not stored as "".
+const solids = z
+  .object({
+    food: z.string().trim().min(1).max(80),
+    amount: z.enum(["little", "some", "lots"]),
+    isNew: z.boolean(),
+    reaction: z.string().trim().min(1).max(200).optional(),
+  })
+  .strict();
+const water = z.object({ ml: z.number().int().min(1).max(500) }).strict();
+const note = z.object({ text: z.string().trim().min(1).max(500) }).strict();

@@ -88,2 +103,6 @@ export const detailsSchemas = {
   tummy: empty,
+  solids,
+  water,
+  bath: empty,
+  note,
 } satisfies Record<LogType, z.ZodType>;
--- a/lib/rules/quickEntry.ts
+++ b/lib/rules/quickEntry.ts
@@ -3,3 +3,11 @@ import { detailsSchemas, MEDICINE_UNITS, type StoolColor } from "./logDetails";

-export type InstantType = "bottle" | "diaper" | "medicine" | "temperature";
+export type InstantType =
+  | "bottle"
+  | "diaper"
+  | "medicine"
+  | "temperature"
+  | "solids"
+  | "water"
+  | "bath"
+  | "note";
 export type QuickValues = Record<string, string | boolean>;
@@ -8,5 +16,7 @@ export type QuickField = {
   label: string;
-  kind: "number" | "text" | "select" | "checkbox";
+  kind: "number" | "text" | "textarea" | "select" | "checkbox";
   options?: { value: string; label: string }[];
   showIf?: (values: QuickValues) => boolean;
+  // Same limit as the schema, so a text field cannot be typed past it.
+  maxLength?: number;
 };
@@ -80,2 +90,21 @@ export const QUICK_FIELDS: Record<InstantType, QuickField[]> = {
   ],
+  solids: [
+    { key: "food", label: "Món", kind: "text", maxLength: 80 },
+    {
+      key: "amount",
+      label: "Lượng",
+      kind: "select",
+      options: SOLIDS_AMOUNT_OPTIONS,
+    },
+    { key: "isNew", label: "Món mới", kind: "checkbox" },
+    {
+      key: "reaction",
+      label: "Phản ứng (nếu có)",
+      kind: "text",
+      maxLength: 200,
+    },
+  ],
+  water: [{ key: "ml", label: "Số ml", kind: "number" }],
+  bath: [],
+  note: [{ key: "text", label: "Nội dung", kind: "textarea", maxLength: 500 }],
 };
@@ -87,5 +116,12 @@ const DEFAULTS: Record<InstantType, QuickValues> = {
   temperature: { celsius: "", method: "nach" },
+  solids: { food: "", amount: "some", isNew: false, reaction: "" },
+  water: { ml: "" },
+  bath: {},
+  note: { text: "" },
 };

-const MESSAGES: Record<InstantType, string> = {
+// Tắm has no fields, so it has nothing to get wrong and no message.
+type CheckedType = Exclude<InstantType, "bath">;
+
+const MESSAGES: Record<CheckedType, string> = {
   bottle: "Nhập số ml từ 1 đến 400",
@@ -94,2 +130,5 @@ const MESSAGES: Record<InstantType, string> = {
   temperature: "Nhập nhiệt độ từ 34 đến 43°C",
+  solids: "Nhập tên món",
+  water: "Nhập số ml từ 1 đến 500",
+  note: "Nhập ghi chú",
 };
@@ -106,3 +145,3 @@ function toNumber(value: string | boolean | undefined): number {
 function rawDetails(
-  type: InstantType,
+  type: CheckedType,
   v: QuickValues,
@@ -131,2 +170,15 @@ function rawDetails(
       return { celsius: toNumber(v.celsius), method: v.method };
+    case "solids": {
+      const reaction = typeof v.reaction === "string" ? v.reaction.trim() : "";
+      return {
+        food: typeof v.food === "string" ? v.food.trim() : "",
+        amount: v.amount,
+        isNew: v.isNew === true,
+        ...(reaction === "" ? {} : { reaction }),
+      };
+    }
+    case "water":
+      return { ml: toNumber(v.ml) };
+    case "note":
+      return { text: typeof v.text === "string" ? v.text.trim() : "" };
   }
@@ -140,2 +192,3 @@ export function buildDetails(
   | { ok: false; message: string } {
+  if (type === "bath") return { ok: true, details: {} };
   const result = detailsSchemas[type].safeParse(rawDetails(type, values));
@@ -189,2 +242,21 @@ export function recentMedicineNames(

+// Spec 2026-11-17 §3.3: up to 4 different food names from solids logs, same rule as
+// recentMedicineNames: case-insensitive, latest spelling kept.
+export function recentFoodNames(logs: LogLike[]): string[] {
+  const names: string[] = [];
+  const seen = new Set<string>();
+  for (const log of byNewest(logs)) {
+    if (log.type !== "solids") continue;
+    const parsed = detailsSchemas.solids.safeParse(log.details);
+    if (!parsed.success) continue;
+    const name = parsed.data.food.trim();
+    const key = medicineKey(name);
+    if (seen.has(key)) continue;
+    seen.add(key);
+    names.push(name);
+    if (names.length === 4) break;
+  }
+  return names;
+}
+
 // Spec §4.1: a chip fills the name plus the dose from the latest log of that medicine.
--- a/lib/rules/undo.ts
+++ b/lib/rules/undo.ts
@@ -20,4 +20,15 @@ export type UndoToast = {

+// A toast is one or two lines. A long note, or a long reaction on a solids log,
+// is cut here; Nhật ký and the home list keep the full text.
+export const TOAST_TEXT_MAX = 60;
+
+export function toastText(text: string): string {
+  const chars = Array.from(text);
+  return chars.length > TOAST_TEXT_MAX
+    ? `${chars.slice(0, TOAST_TEXT_MAX).join("")}…`
+    : text;
+}
+
 export function savedMessage(log: LogLike, at: Date): string {
-  return `Đã ghi ${describeLog(log, at)} lúc ${formatVnTime(at)}`;
+  return `Đã ghi ${toastText(describeLog(log, at))} lúc ${formatVnTime(at)}`;
 }
--- a/lib/ui/categories.ts
+++ b/lib/ui/categories.ts
@@ -18,2 +18,6 @@ export const CATEGORIES: Record<
   temperature: { token: "cat-temp", icon: "thermo", label: "Nhiệt độ" },
+  solids: { token: "cat-bottle", icon: "bowl", label: "Ăn dặm" },
+  water: { token: "cat-pump", icon: "glass", label: "Uống nước" },
+  bath: { token: "cat-diaper", icon: "bath", label: "Tắm" },
+  note: { token: "cat-tummy", icon: "doc", label: "Ghi chú" },
 };
```

Bốn điều dễ làm sai khi sửa tay:

- `rawDetails` nhận `CheckedType` (mọi `InstantType` trừ `bath`), và `buildDetails` trả về sớm cho `bath`. Nhờ dòng trả về sớm đó, TypeScript thu hẹp `type` trước khi nó dùng để lấy `detailsSchemas[type]` và `MESSAGES[type]`.
- `reaction` chỉ có mặt trong `details` khi ô không trống (§3.1).
- Trong `QuickEntrySheet`, `bath: null` là cố ý: sheet Tắm chỉ có chip giờ và nút Lưu.
- `toastText` đếm ký tự bằng `Array.from`, để không cắt đôi một ký tự ghép. Nó chỉ cắt phần mô tả; "Đã ghi" và "lúc HH:mm" luôn còn đủ.

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: typecheck không lỗi; `Tests  825 passed (825)` (809 + 16: `logDetails` 5, `describeLog` 2, `quickEntry` 5, `quickentry` 2, `undo` 2; `categories` chỉ sửa test có sẵn).

- [x] **Step 5: Commit**

```bash
git add lib/rules/logDetails.ts lib/rules/logDetails.test.ts lib/rules/describeLog.ts lib/rules/describeLog.test.ts lib/ui/categories.ts lib/ui/categories.test.ts lib/rules/quickEntry.ts lib/rules/quickEntry.test.ts components/home/QuickEntrySheet.tsx components/home/quickentry.test.tsx lib/rules/undo.ts lib/rules/undo.test.ts
git commit -m "feat(logs): solids, water, bath and note log types with quick entry"
```

---

### Task 5: Bảng "+" chia 3 nhóm, 13 ô, rồi kiểm cuối M1a

**Files:**

- Modify: `lib/rules/quickActions.ts:5-86` (kiểu `QuickAction`, hằng mới `QUICK_ACTION_GROUPS`, `QUICK_ACTIONS` xếp lại và thêm 4 mục)
- Modify: `components/actions/ActionSheet.tsx:5-10` (import), `:27-71` (`QuickActionGrid` viết lại), `:93-95` (bỏ dòng chú giải)
- Modify: `components/actions/ActionChrome.tsx:7` (comment "9-action" thành "13-action")
- Test: `lib/rules/quickActions.test.ts`, `components/actions/actionsheet.test.tsx`
- Không sửa, nhưng phải còn xanh: `components/home/TimerButtons.tsx` và `components/home/buttons.test.tsx`

**Interfaces:**

- Consumes: `InstantType` và `LogType` có 4 loại mới, `CATEGORIES` 12 mục (Task 4).
- Produces:
  - `QuickActionGroup = "timer" | "quick" | "other"`; `QuickAction` thêm trường `group: QuickActionGroup`.
  - `QUICK_ACTION_GROUPS: { group: QuickActionGroup; title: string }[]` = Bấm giờ, Ghi nhanh, Khác.
  - `QUICK_ACTIONS` có 13 mục theo đúng thứ tự: `timer` = Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp; `quick` = Bú bình, Thay tã, Thuốc, Nhiệt độ; `other` = Ăn dặm, Uống nước, Tắm, Ghi chú.
  - `QuickActionGrid({ running, onPick })`: props không đổi; vẽ 3 nhóm.

Thứ tự của 9 mục cũ đổi (trước đây là Bú trái, Bú phải, Bú bình, Ngủ, Thay tã, Hút sữa, Thuốc, Nhiệt độ, Nằm sấp). Hai chỗ dựa vào thứ tự:

- `TimerButtons` (`components/home/TimerButtons.tsx:16-18`) lọc các mục `kind: "timer"` của `QUICK_ACTIONS`. Năm mục đó vẫn đứng theo thứ tự Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp, nên hàng nút trang chủ **không đổi**. Không sửa file này. Test "shows five 58 px round buttons with labels, in spec order" trong `components/home/buttons.test.tsx` phải xanh mà không sửa.
- Hai file test của task này khẳng định thứ tự cũ (`QUICK_ACTIONS[4]` là "Thay tã", danh sách 9 nhãn). Patch 7 viết lại chúng.

Kích thước theo §3.3: tiêu đề nhóm 13 px, đậm, màu `muted`; lưới 4 cột, khoảng cách 8 px (`gap-2`); ô cao 84 px, bo 20 px; vòng icon 38 px; icon 20 px; nhãn 12 px đậm. Icon đồng hồ ở góc ô timer và dòng chú giải "= bấm giờ" bị bỏ. Viền đậm của ô đang chạy (`border-2 border-accent-text`) giữ nguyên. Không vẽ nhãn "Nên bú": nó thuộc M2.

`ActionSheet`, `QuickActionsProvider` và `QuickLogGrid` không cần sửa. `ActionSheet` gọi `actions.openInstant(action.instant)`, provider mở `QuickEntrySheet` với `type` đó, và sau khi lưu thì `instantToast` dựng toast (đã cắt 60 ký tự). Cả chuỗi đã chạy với loại mới từ Task 4.

- [x] **Step 1: Viết test hỏng (Patch 7)**

```diff
--- a/components/actions/actionsheet.test.tsx
+++ b/components/actions/actionsheet.test.tsx
@@ -15,3 +15,3 @@ const leftFeed: RunningLog = {
 describe("QuickActionGrid", () => {
-  it("is a 3×3 grid of 100 pt tiles with category icons", () => {
+  it("draws three titled groups, each a 4-column grid of 84 px tiles", () => {
     const html = renderToStaticMarkup(
@@ -19,7 +19,19 @@ describe("QuickActionGrid", () => {
     );
-    expect(html).toContain("grid grid-cols-3");
-    expect(html.match(/<button/g)).toHaveLength(9);
-    expect(html).toContain("h-[100px]");
+    const titles = [...html.matchAll(/<h3 class="([^"]*)">([^<]+)<\/h3>/g)];
+    expect(titles.map((m) => m[2])).toEqual(["Bấm giờ", "Ghi nhanh", "Khác"]);
+    expect(titles[0][1]).toBe(
+      "text-[13px] leading-[18px] font-semibold text-muted",
+    );
+    expect(html.match(/grid grid-cols-4 gap-2/g)).toHaveLength(3);
+    const tiles = html.split("<section").slice(1);
+    expect(tiles.map((part) => part.match(/<button/g)?.length)).toEqual([
+      5, 4, 4,
+    ]);
+    expect(html.match(/h-\[84px\][^"]*rounded-\[20px\]/g)).toHaveLength(13);
+    expect(html.match(/size-\[38px\]/g)).toHaveLength(13);
+    expect(html.match(/width="20" height="20"/g)).toHaveLength(13);
+    expect(html.match(/text-xs leading-4 font-semibold/g)).toHaveLength(13);
     expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
-    expect(html).toContain(`d="${ICON_PATHS.drop}"`);
+    for (const icon of ["drop", "bowl", "glass", "bath", "doc"] as const)
+      expect(html).toContain(`d="${ICON_PATHS[icon]}"`);
     for (const action of QUICK_ACTIONS)
@@ -28,3 +40,3 @@ describe("QuickActionGrid", () => {

-  it("badges the five timers with a clock", () => {
+  it("timer tiles carry no clock badge: the group title says it", () => {
     const html = renderToStaticMarkup(
@@ -32,4 +44,4 @@ describe("QuickActionGrid", () => {
     );
-    expect(html.split(`d="${ICON_PATHS.clock}"`).length - 1).toBe(5);
-    expect(html.split("bấm giờ").length - 1).toBe(5);
+    expect(html).not.toContain(`d="${ICON_PATHS.clock}"`);
+    expect(html).not.toContain("bấm giờ");
   });
@@ -50,5 +62,8 @@ describe("QuickActionGrid", () => {
     );
-    (buttons[4].props.onClick as () => void)();
-    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[4]);
-    expect(QUICK_ACTIONS[4].label).toBe("Thay tã");
+    (buttons[6].props.onClick as () => void)();
+    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[6]);
+    expect(QUICK_ACTIONS[6].label).toBe("Thay tã");
+    (buttons[12].props.onClick as () => void)();
+    expect(onPick).toHaveBeenLastCalledWith(QUICK_ACTIONS[12]);
+    expect(QUICK_ACTIONS[12]).toMatchObject({ instant: "note" });
   });
@@ -57,3 +72,3 @@ describe("QuickActionGrid", () => {
 describe("ActionSheetView", () => {
-  it("is a floating sheet titled for the baby with the clock legend", () => {
+  it("is a floating sheet titled for the baby, without the old clock legend", () => {
     const html = renderToStaticMarkup(
@@ -70,3 +85,4 @@ describe("ActionSheetView", () => {
     expect(html).not.toContain("data-sheet-handle");
-    expect(html).toContain("= bấm giờ");
+    expect(html).not.toContain("= bấm giờ");
+    expect(html).toContain(">Bấm giờ</h3>");
   });
--- a/lib/rules/quickActions.test.ts
+++ b/lib/rules/quickActions.test.ts
@@ -4,2 +4,3 @@ import {
   isActionRunning,
+  QUICK_ACTION_GROUPS,
   QUICK_ACTIONS,
@@ -17,14 +18,51 @@ const leftFeed: RunningLog = {
 describe("QUICK_ACTIONS", () => {
-  it("lists the nine actions of spec §6.3 in grid order", () => {
-    expect(QUICK_ACTIONS.map((a) => a.label)).toEqual([
+  const labelsOf = (group: string) =>
+    QUICK_ACTIONS.filter((a) => a.group === group).map((a) => a.label);
+
+  it("lists thirteen actions group by group: timers, quick entries, the rest", () => {
+    expect(QUICK_ACTIONS.map((a) => a.group)).toEqual([
+      ...Array(5).fill("timer"),
+      ...Array(4).fill("quick"),
+      ...Array(4).fill("other"),
+    ]);
+    expect(labelsOf("timer")).toEqual([
       "Bú trái",
       "Bú phải",
-      "Bú bình",
       "Ngủ",
-      "Thay tã",
       "Hút sữa",
+      "Nằm sấp",
+    ]);
+    expect(labelsOf("quick")).toEqual([
+      "Bú bình",
+      "Thay tã",
       "Thuốc",
       "Nhiệt độ",
-      "Nằm sấp",
     ]);
+    expect(labelsOf("other")).toEqual([
+      "Ăn dặm",
+      "Uống nước",
+      "Tắm",
+      "Ghi chú",
+    ]);
+    expect(new Set(QUICK_ACTIONS.map((a) => a.key)).size).toBe(13);
+  });
+
+  it("QUICK_ACTION_GROUPS titles the three groups; the timer group is exactly the timers", () => {
+    expect(QUICK_ACTION_GROUPS).toEqual([
+      { group: "timer", title: "Bấm giờ" },
+      { group: "quick", title: "Ghi nhanh" },
+      { group: "other", title: "Khác" },
+    ]);
+    for (const action of QUICK_ACTIONS)
+      expect(action.group === "timer").toBe(action.kind === "timer");
+  });
+
+  it("the four new actions are instant entries of their own category", () => {
+    for (const type of ["solids", "water", "bath", "note"] as const)
+      expect(byKey(type)).toMatchObject({
+        kind: "instant",
+        group: "other",
+        category: type,
+        instant: type,
+      });
   });
```

- [x] **Step 2: Chạy test để thấy hỏng**

Run: `bunx vitest run lib/rules/quickActions.test.ts components/actions/actionsheet.test.tsx`
Expected: FAIL, `Tests  7 failed | 6 passed (13)`. Ví dụ: `expected [] to deeply equal [ 'Bấm giờ', 'Ghi nhanh', 'Khác' ]`, `expected 'Thuốc' to be 'Thay tã'`.

- [x] **Step 3: Viết code (Patch 8)**

```diff
--- a/components/actions/ActionChrome.tsx
+++ b/components/actions/ActionChrome.tsx
@@ -6,3 +6,3 @@ import { useQuickActions } from "./QuickActions";

-// The tab bar with its "+" button and the 9-action sheet. Whether the sheet is open lives in
+// The tab bar with its "+" button and the 13-action sheet. Whether the sheet is open lives in
 // QuickActionsProvider, so a page (e.g. an empty Nhật ký) can open it too.
--- a/components/actions/ActionSheet.tsx
+++ b/components/actions/ActionSheet.tsx
@@ -7,2 +7,3 @@ import {
   isActionRunning,
+  QUICK_ACTION_GROUPS,
   QUICK_ACTIONS,
@@ -26,2 +27,3 @@ const TINT: Record<CategoryToken, string> = {

+// Spec 2026-11-17 §3.3: one titled block per group, four 84 px tiles to a row.
 export function QuickActionGrid({
@@ -34,36 +36,41 @@ export function QuickActionGrid({
   return (
-    <div className="grid grid-cols-3 gap-2.5">
-      {QUICK_ACTIONS.map((action) => {
-        const on = isActionRunning(action, running);
-        const category = CATEGORIES[action.category];
-        return (
-          <button
-            key={action.key}
-            type="button"
-            onClick={() => onPick(action)}
-            className={cx(
-              "relative flex h-[100px] flex-col items-center justify-center gap-2 rounded-[24px] bg-glass-solid/75 text-ink transition-transform duration-[120ms] active:scale-[0.97]",
-              on ? "border-2 border-accent-text" : "border border-edge",
+    <div className="flex flex-col gap-4">
+      {QUICK_ACTION_GROUPS.map(({ group, title }) => (
+        <section key={group} className="flex flex-col gap-2">
+          <h3 className="text-[13px] leading-[18px] font-semibold text-muted">
+            {title}
+          </h3>
+          <div className="grid grid-cols-4 gap-2">
+            {QUICK_ACTIONS.filter((action) => action.group === group).map(
+              (action) => {
+                const on = isActionRunning(action, running);
+                const category = CATEGORIES[action.category];
+                return (
+                  <button
+                    key={action.key}
+                    type="button"
+                    onClick={() => onPick(action)}
+                    className={cx(
+                      "flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-[20px] bg-glass-solid/75 px-1 text-ink transition-transform duration-[120ms] active:scale-[0.97]",
+                      on ? "border-2 border-accent-text" : "border border-edge",
+                    )}
+                  >
+                    <span
+                      className={cx(
+                        "flex size-[38px] shrink-0 items-center justify-center rounded-full",
+                        TINT[category.token],
+                      )}
+                    >
+                      <Icon name={category.icon} size={20} />
+                    </span>
+                    <span className="text-center text-xs leading-4 font-semibold">
+                      {actionLabel(action, running)}
+                    </span>
+                  </button>
+                );
+              },
             )}
-          >
-            {action.kind === "timer" && (
-              <span className="absolute top-2 right-2 text-muted">
-                <Icon name="clock" size={14} strokeWidth={2.2} />
-                <span className="sr-only">, bấm giờ</span>
-              </span>
-            )}
-            <span
-              className={cx(
-                "flex size-11 items-center justify-center rounded-full",
-                TINT[category.token],
-              )}
-            >
-              <Icon name={category.icon} size={22} />
-            </span>
-            <span className="text-sm font-semibold">
-              {actionLabel(action, running)}
-            </span>
-          </button>
-        );
-      })}
+          </div>
+        </section>
+      ))}
     </div>
@@ -92,5 +99,2 @@ export function ActionSheetView({
     >
-      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
-        <Icon name="clock" size={14} strokeWidth={2.2} />= bấm giờ
-      </p>
       <QuickActionGrid running={running} onPick={onPick} />
--- a/lib/rules/quickActions.ts
+++ b/lib/rules/quickActions.ts
@@ -4,2 +4,4 @@ import type { RunningLog, TimerButton } from "./timer";

+export type QuickActionGroup = "timer" | "quick" | "other";
+
 export type QuickAction =
@@ -9,2 +11,3 @@ export type QuickAction =
       kind: "timer";
+      group: QuickActionGroup;
       category: LogType;
@@ -16,2 +19,3 @@ export type QuickAction =
       kind: "instant";
+      group: QuickActionGroup;
       category: LogType;
@@ -20,3 +24,12 @@ export type QuickAction =

-// Spec §6.3: 3×3 grid, row by row.
+// Spec 2026-11-17 §3.3: the "+" sheet draws one titled block per group, in this order.
+export const QUICK_ACTION_GROUPS: { group: QuickActionGroup; title: string }[] =
+  [
+    { group: "timer", title: "Bấm giờ" },
+    { group: "quick", title: "Ghi nhanh" },
+    { group: "other", title: "Khác" },
+  ];
+
+// Group by group, in the order the "+" sheet shows them. The home page's timer row
+// (TimerButtons) takes the kind "timer" entries in this same order.
 export const QUICK_ACTIONS: QuickAction[] = [
@@ -26,2 +39,3 @@ export const QUICK_ACTIONS: QuickAction[] = [
     kind: "timer",
+    group: "timer",
     category: "breast",
@@ -33,2 +47,3 @@ export const QUICK_ACTIONS: QuickAction[] = [
     kind: "timer",
+    group: "timer",
     category: "breast",
@@ -36,9 +51,2 @@ export const QUICK_ACTIONS: QuickAction[] = [
   },
-  {
-    key: "bottle",
-    label: "Bú bình",
-    kind: "instant",
-    category: "bottle",
-    instant: "bottle",
-  },
   {
@@ -47,2 +55,3 @@ export const QUICK_ACTIONS: QuickAction[] = [
     kind: "timer",
+    group: "timer",
     category: "sleep",
@@ -50,9 +59,2 @@ export const QUICK_ACTIONS: QuickAction[] = [
   },
-  {
-    key: "diaper",
-    label: "Thay tã",
-    kind: "instant",
-    category: "diaper",
-    instant: "diaper",
-  },
   {
@@ -61,2 +63,3 @@ export const QUICK_ACTIONS: QuickAction[] = [
     kind: "timer",
+    group: "timer",
     category: "pump",
@@ -64,2 +67,26 @@ export const QUICK_ACTIONS: QuickAction[] = [
   },
+  {
+    key: "tummy",
+    label: "Nằm sấp",
+    kind: "timer",
+    group: "timer",
+    category: "tummy",
+    button: { type: "tummy" },
+  },
+  {
+    key: "bottle",
+    label: "Bú bình",
+    kind: "instant",
+    group: "quick",
+    category: "bottle",
+    instant: "bottle",
+  },
+  {
+    key: "diaper",
+    label: "Thay tã",
+    kind: "instant",
+    group: "quick",
+    category: "diaper",
+    instant: "diaper",
+  },
   {
@@ -68,2 +95,3 @@ export const QUICK_ACTIONS: QuickAction[] = [
     kind: "instant",
+    group: "quick",
     category: "medicine",
@@ -75,2 +103,3 @@ export const QUICK_ACTIONS: QuickAction[] = [
     kind: "instant",
+    group: "quick",
     category: "temperature",
@@ -79,7 +108,32 @@ export const QUICK_ACTIONS: QuickAction[] = [
   {
-    key: "tummy",
-    label: "Nằm sấp",
-    kind: "timer",
-    category: "tummy",
-    button: { type: "tummy" },
+    key: "solids",
+    label: "Ăn dặm",
+    kind: "instant",
+    group: "other",
+    category: "solids",
+    instant: "solids",
+  },
+  {
+    key: "water",
+    label: "Uống nước",
+    kind: "instant",
+    group: "other",
+    category: "water",
+    instant: "water",
+  },
+  {
+    key: "bath",
+    label: "Tắm",
+    kind: "instant",
+    group: "other",
+    category: "bath",
+    instant: "bath",
+  },
+  {
+    key: "note",
+    label: "Ghi chú",
+    kind: "instant",
+    group: "other",
+    category: "note",
+    instant: "note",
   },
```

Sau patch, `ActionSheetView` chỉ còn `<QuickActionGrid … />` bên trong `Sheet`. `Icon` vẫn được import vì ô vẫn vẽ icon của loại.

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck`
Expected: không lỗi.

Run: `bunx vitest run`
Expected: `Test Files  141 passed (141)`, `Tests  827 passed (827)`. `components/home/buttons.test.tsx` xanh, không sửa. Cách đếm: 803 + 1 (Task 2) + 5 (Task 3) + 16 (Task 4) + 2 (Task 5). Nếu số lệch, đếm lại các `it(` đã thêm; không sửa test cho khớp số.

- [x] **Step 5: Build**

Run: `bun run build`
Expected: build xong, không lỗi. Hiện tại lần chạy đầu có thể dừng với một thông báo security advisory của Next.js 16.4.3; chạy lại lệnh lần thứ hai thì qua. Thông báo đó đã biết trước và không phải việc của plan này: không nâng Next, không sửa gì vì nó.

- [ ] **Step 6: Kiểm trong Chrome (Claude in Chrome, mở tab mới)** (không bấm Lưu, không bắt đầu timer)

App dev nối vào Supabase thật của gia đình. Trong cả bước này:

- Không bấm "Lưu" ở bất kỳ sheet nào.
- Trong bảng của nút "+", **không bấm** 5 ô của nhóm "Bấm giờ" (Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp): bấm là bắt đầu timer thật.
- Không vào Cài đặt.

Chạy `bun run dev`. Dùng Claude in Chrome: `tabs_context_mcp`, rồi `tabs_create_mcp` để mở tab mới (không dùng lại tab của người dùng) tới `http://localhost:3000`, cửa sổ 375×812.

1. Bấm "+". Kỳ vọng: ba nhóm có tiêu đề "Bấm giờ" (5 ô, hai hàng), "Ghi nhanh" (4 ô), "Khác" (4 ô), mỗi hàng 4 ô; không còn icon đồng hồ ở góc ô và không còn dòng "= bấm giờ"; bốn ô nhóm "Khác" có icon bát, cốc, bồn tắm, tờ giấy và nhìn ra đúng hình; nhãn không bị cắt; bảng cuộn dọc được nếu cao hơn màn hình.
2. Bấm "Ăn dặm". Kỳ vọng: tiêu đề "Ăn dặm"; ô "Món"; "Lượng" với Ít / Vừa / Nhiều, đang chọn Vừa; công tắc "Món mới" có dòng phụ "Đánh dấu lần đầu bé ăn món này"; ô "Phản ứng (nếu có)" có chữ mờ "Ví dụ: nổi mẩn quanh miệng"; rồi tới "Lúc nào?". Gõ vài chữ vào "Món", bấm X, chọn "Bỏ thay đổi".
3. "+" rồi "Uống nước": ô số lớn với −10 / +10. Bấm +10 thấy 10. Đóng bằng X, "Bỏ thay đổi".
4. "+" rồi "Tắm": chỉ có "Lúc nào?" và nút Lưu. Đóng bằng X.
5. "+" rồi "Ghi chú": ô "Nội dung" cao 3 dòng. Đóng bằng X.
6. Về trang chủ: hàng "Bấm giờ" vẫn là Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp (chỉ nhìn, không bấm); "Ghi nhanh" vẫn 4 ô.
7. Ở bảng "+" và ở từng sheet trên, chạy bằng javascript tool: `document.documentElement.scrollWidth <= window.innerWidth`. Kỳ vọng `true` (không tràn ngang ở 375 px). Câu này không thấy được phần nằm trong `<dialog>`, nên khi một sheet đang mở thì chạy thêm: `(() => { const el = document.querySelector("dialog[open] .overflow-y-auto"); return el ? el.scrollWidth <= el.clientWidth : "không tìm thấy thân sheet"; })()`. Kỳ vọng `true`; nếu ra chuỗi "không tìm thấy thân sheet" thì ghi vào báo cáo là chưa kiểm được tràn ngang trong sheet, không ghi đạt.
8. Lặp lại mục 1–7 ở hai theme nữa. Đổi theme bằng javascript tool: `document.documentElement.dataset.theme = "dark"` (Tối), rồi `"night"` (Ban đêm); `"rose"` là Hồng dịu. Lệnh này chỉ đổi giao diện của tab đang mở và mất khi tải lại trang; nếu app tự đặt lại theme thì chạy lại lệnh. Kỳ vọng: chữ và icon đọc rõ ở cả ba theme.

Toast Hoàn tác không kiểm được ở đây vì nó chỉ hiện sau khi bấm Lưu; unit test của `toastText` thay cho việc đó. Nhật ký và Thống kê được kiểm ở M1b.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục vào báo cáo cuối. Nếu Claude in Chrome không nối được, để ô này chưa tick và ghi rõ trong báo cáo; không thay bằng trình duyệt khác khi người dùng chưa cho phép. Nếu tab bị chuyển sang `/dang-nhap`, cũng để ô này chưa tick và ghi rõ trong báo cáo; không tự đăng nhập.

- [x] **Step 7: Commit**

```bash
git add lib/rules/quickActions.ts lib/rules/quickActions.test.ts components/actions/ActionSheet.tsx components/actions/ActionChrome.tsx components/actions/actionsheet.test.tsx docs/blueprint/plans/2026-11-17-kim-bun-ban-ghi-moi-m1.md
git commit -m "feat(actions): + sheet in three groups with four new tiles"
```

- [ ] **Step 8: Báo cáo, và cổng trước khi lên `main`**

Báo cáo cuối gồm: 5 commit của nhánh; số test (827); kết quả build; kết quả kiểm Chrome từng mục; và mọi ô còn chưa tick kèm lý do (pgTAP nếu thiếu Docker, `db push` nếu người dùng chưa đồng ý).

Plan này dừng ở đây. Không merge, không push. M1b làm tiếp trên nhánh cắt từ nhánh này. Đưa code lên `main` là việc người dùng quyết từng lần, và chỉ được làm khi **Task 1 Step 8 đã tick** (migration đã có trên project thật). Nếu bước đó chưa xong, nói rõ trong báo cáo: "Chưa được push `main`: migration `log_types` chưa áp lên project thật."
