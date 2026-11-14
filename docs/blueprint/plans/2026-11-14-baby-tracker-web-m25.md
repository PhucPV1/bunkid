# Baby Tracker Web — M25 (Mốc phát triển) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/phat-trien` (spec §6.9): mốc theo tháng 2, 4, 6, 9, 12, 15, 18, 24 chia 4 lĩnh vực (nguồn CDC "Learn the Signs. Act Early."), mỗi tháng có mục "Khi nào nên hỏi bác sĩ"; 6 mốc vận động lớn của WHO kèm khoảng tuổi bình thường, cộng "lật" (4–6 tháng). Hiện tháng hiện tại và kế tiếp; đánh dấu đã đạt (ngày, ghi chú, gắn ảnh), đi qua outbox (§9).

**Architecture:**
- **Nội dung:** `content/milestones.vi.json` (8 nhóm tháng, 100 mốc, 7 mốc vận động lớn), kiểm bằng zod (`lib/content/milestones.ts`).
- **Dữ liệu:** migration `20261114000900_milestones_achieved.sql` (một dòng mỗi bé và mốc; RLS như `logs`; `photo_id` chỉ được trỏ tới ảnh của chính bé, xóa ảnh thì tự bỏ liên kết), pgTAP `011`.
- **Outbox (M12, M16, M19) thêm bảng thứ tư:** `milestones_achieved` với `upsert` / `delete` theo mã mốc (không gửi `id`, §9); `applyMilestoneChange`/`overlayPendingMilestones` có test; `OutboxSync` làm mới `["milestones"]`.
- **Quy tắc thuần** (`lib/rules/milestones.ts`): tuổi theo tháng, nhóm tháng hiện tại và kế tiếp, trạng thái mốc vận động (chưa tới / trong khoảng / quá khoảng / đã đạt), kiểm form.
- **Giao diện:** `components/milestones/MilestonesScreen.tsx`, `MilestoneSheet.tsx` (chọn ảnh từ M24).

**Tech Stack:** như M1–M24. Không thêm gói nào.

**Milestones của đợt phát hành 3:**
- M22–M24: xong.
- **M25 (plan này):** mốc phát triển; checklist bước 18.
- M26: báo cáo cho bác sĩ, chốt đợt 3.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Nguồn:** mốc theo tháng dịch ý từ 8 trang CDC "Learn the Signs. Act Early." (2 tháng … 2 tuổi, xem lại 16/05/2026). "Khi nào nên hỏi bác sĩ" dịch ý phần "Act early" của CDC: bé chưa làm được mốc của tháng, mất kỹ năng đã có, hoặc cha mẹ lo lắng. Khoảng tuổi 6 mốc vận động lấy từ bảng "Windows of achievement" của WHO (Acta Paediatrica 2006; ngồi 3,8–9,2; đứng có đỡ 4,8–11,4; bò 5,2–13,5; đi có dắt 6,0–13,7 (bảng PDF của WHO ghi 6,0; phần tóm tắt bài báo làm tròn 5,9 — app theo bảng đang trích); tự đứng 6,9–16,9; tự đi 8,2–17,6 tháng). "Lật" (khoảng 4–6 tháng) theo spec §6.9, nguồn trang 6 tháng của CDC.
- **Mốc trùng nhau:** vài mốc vận động lớn trùng ý với mốc theo tháng (lật — 6 tháng, ngồi vững — 9 tháng, tự đi — 15 tháng). Hai nơi đánh dấu riêng, có chủ ý: mốc vận động lớn theo khoảng tuổi WHO, mốc theo tháng theo danh sách CDC.
- **Không chẩn đoán:** trang chỉ ghi "Đã quá khoảng bình thường (…), nên hỏi bác sĩ" cho mốc vận động quá khoảng; không có kết luận bệnh. Lời dẫn đầu trang nói danh sách không thay cho khám sàng lọc.
- **Hiện mốc:** nhóm hiện tại là nhóm có số tháng lớn nhất ≤ tuổi bé (tính theo `ageDays / 30,4375`), cộng nhóm kế tiếp; bé dưới 2 tháng thấy nhóm 2 và 4 tháng. Nút "Xem tất cả các mốc" hiện đủ 8 nhóm.
- **Đánh dấu:** ngày đạt (từ ngày sinh tới hôm nay, mặc định hôm nay), ghi chú ≤ 500 ký tự, gắn tối đa một ảnh chọn trong 12 ảnh mới nhất của bé (hoặc "Không"). Sửa hoặc "Bỏ đánh dấu" theo RLS `logs` (chủ gia đình hoặc người đã đánh dấu); mốc chưa đánh dấu thì ai cũng đánh dấu được. Chạy offline, có ⏳.
- **Bảng `milestones_achieved`:** đúng cột §5 (`id` mặc định `gen_random_uuid()`, `unique (baby_id, milestone_code)`); thêm ràng buộc `milestone_code` dạng `[a-z0-9_]{1,40}`, `note` 1–500 ký tự, `achieved_on` bắt buộc; trigger `forbid_immutable_change('id', 'baby_id', 'created_by', 'milestone_code')`; hàm `public.photo_matches_baby(photo, baby)` (security invoker: người gọi chỉ thấy ảnh của gia đình mình qua `photos_select`) dùng trong `with check`. Xóa ảnh thì `photo_id` của mốc thành `null` (`on delete set null`), có pgTAP kiểm.
- **`db push`:** người dùng đã cho phép trước chạy `bunx supabase db push --linked --yes` cho migration chỉ thêm bảng mới đã duyệt.
- **Bước của người dùng:** checklist bước 18 cần điện thoại thật; ghi là đang chờ.

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

Riêng M25:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier). Không chạy prettier trên `content/milestones.vi.json`.
- Câu chữ tiếng Việt trong `content/milestones.vi.json`, `lib/rules/milestones.ts` và `components/milestones/` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, tới commit cuối của M24):

- M24: bảng `photos`, `usePhotos`, `usePhotoUrls`; M12/M16/M19: outbox (`OutboxEntry`, `entriesFor`, `pendingRowIds`, `nextCreatedAt`, `flushRequests`, `outboxDeps` với `failed`/`UNSUPPORTED`, `OutboxSync`); M13: `PendingMark`, `useOutboxEntries`
- M1: `babies`, `is_member`, `is_owner`, `baby_family`, `forbid_immutable_change`; `ageDays`, `vnDateString`; `GUIDE_ITEMS`; `/phat-trien` đã có trong `GUIDES` của service worker (M9)

**Produces** (M26 — báo cáo — có thể dùng):

- `content/milestones.vi.json`; `lib/content/milestones.ts`: `Domain`, `MilestoneGroup`, `MotorMilestone`, `MILESTONES`
- Bảng `milestones_achieved`, hàm `photo_matches_baby`, `MilestoneRow`
- Outbox: `OutboxEntry.table` thêm `"milestones_achieved"`; `applyMilestoneChange`, `overlayPendingMilestones`; `MilestoneChange`, `milestonesKey`, `enqueueMilestoneChange`, `withPendingMilestones`
- `lib/rules/milestones.ts`: `ageInMonths`, `visibleGroups`, `MotorState`, `motorStatus`, `parseMilestoneForm`
- `lib/data/milestones.ts`: `useMilestones(babyId)`, `useMilestoneActions(babyId, userId) → { mark, unmark }`
- `MilestonesScreen`, `MilestoneSheet`; trang `/phat-trien`; checklist bước 18

## File Structure

```
content/milestones.vi.json, lib/content/milestones.ts (+ test)
supabase/migrations/20261114000900_milestones_achieved.sql, supabase/tests/011_milestones_achieved.test.sql
lib/supabase/types.ts, lib/supabase/rows.ts   # sinh lại; MilestoneRow
lib/data/outboxCore.ts (+ outboxMilestones.test.ts), lib/data/outbox.ts, lib/data/outboxDeps.ts, components/sync/OutboxSync.tsx
lib/rules/milestones.ts (+ test)
lib/data/milestones.ts; components/milestones/MilestonesScreen.tsx, MilestoneSheet.tsx; app/phat-trien/page.tsx
lib/nav.ts (+ test), docs/device-checklist.md
```

## Tasks

1. Nội dung mốc phát triển
2. Bảng `milestones_achieved`
3. Mốc qua outbox và quy tắc mốc
4. Trang `/phat-trien`
5. Checklist bước 18 và deploy

---

### Task 1: Nội dung mốc phát triển

**Files:**

- Create: `content/milestones.vi.json`, `lib/content/milestones.ts`
- Test: `lib/content/milestones.test.ts`

**Interfaces:**

- Consumes: `zod` 4.6.7
- Produces: `DomainSchema`, `Domain`, `MilestoneGroupSchema`, `MilestoneGroup`, `MotorMilestoneSchema`, `MotorMilestone`, `MilestonesContentSchema`, `MILESTONES`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m25.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `docs: device checklist step 17 for photos` của M24.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/content/milestones.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MILESTONES } from "./milestones";

describe("content/milestones.vi.json (spec §6.9, §10.2)", () => {
  it("has the CDC month groups of spec §6.9 with all four domains", () => {
    expect(MILESTONES.groups.map((g) => g.months)).toEqual([
      2, 4, 6, 9, 12, 15, 18, 24,
    ]);
    for (const group of MILESTONES.groups) {
      expect(new Set(group.items.map((i) => i.domain))).toEqual(
        new Set(["social", "language", "cognitive", "movement"]),
      );
      expect(group.source).toMatch(/^https:\/\/www\.cdc\.gov\/act-early\//);
      expect(group.askDoctor.length).toBeGreaterThan(0);
    }
  });

  it("uses every milestone code once", () => {
    const codes = [
      ...MILESTONES.groups.flatMap((g) => g.items.map((i) => i.code)),
      ...MILESTONES.motor.map((m) => m.code),
    ];
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("has rolling plus the six WHO gross motor milestones with their windows", () => {
    expect(
      MILESTONES.motor.map((m) => [m.code, m.fromMonths, m.toMonths]),
    ).toEqual([
      ["lat", 4, 6],
      ["ngoi", 3.8, 9.2],
      ["dung_co_do", 4.8, 11.4],
      ["bo", 5.2, 13.5],
      ["di_co_dat", 6, 13.7],
      ["tu_dung", 6.9, 16.9],
      ["tu_di", 8.2, 17.6],
    ]);
    for (const m of MILESTONES.motor) expect(m.source).toMatch(/^https:\/\//);
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/content/milestones.test.ts`
Expected: FAIL — `Error: Cannot find module './milestones' imported from …/lib/content/milestones.test.ts`

- [ ] **Step 4: Viết file nội dung**

Tạo `content/milestones.vi.json` đúng từng ký tự (mỗi nhóm tháng, mỗi mốc vận động một dòng):

```json
{
  "title": "Mốc phát triển",
  "intro": "Mốc theo tháng của CDC (\"Learn the Signs. Act Early.\") và 6 mốc vận động lớn của WHO. Mỗi bé phát triển theo nhịp riêng; danh sách này không thay cho khám sàng lọc.",
  "domains": {"social": "Xã hội, cảm xúc", "language": "Ngôn ngữ, giao tiếp", "cognitive": "Nhận thức", "movement": "Vận động"},
  "reviewedAt": "2026-11-14",
  "groups": [
    {"months": 2, "items": [{"code": "m2_social_1", "domain": "social", "text": "Bình tĩnh lại khi được nói chuyện hoặc bế lên"}, {"code": "m2_social_2", "domain": "social", "text": "Nhìn mặt bạn"}, {"code": "m2_social_3", "domain": "social", "text": "Có vẻ vui khi thấy bạn đến gần"}, {"code": "m2_social_4", "domain": "social", "text": "Cười khi bạn nói chuyện hoặc cười với bé"}, {"code": "m2_language_1", "domain": "language", "text": "Phát ra âm thanh khác ngoài tiếng khóc"}, {"code": "m2_language_2", "domain": "language", "text": "Phản ứng với tiếng động lớn"}, {"code": "m2_cognitive_1", "domain": "cognitive", "text": "Nhìn theo khi bạn di chuyển"}, {"code": "m2_cognitive_2", "domain": "cognitive", "text": "Nhìn một món đồ chơi vài giây"}, {"code": "m2_movement_1", "domain": "movement", "text": "Ngẩng đầu khi nằm sấp"}, {"code": "m2_movement_2", "domain": "movement", "text": "Cử động cả hai tay và hai chân"}, {"code": "m2_movement_3", "domain": "movement", "text": "Thỉnh thoảng mở bàn tay"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/2-months.html", "reviewedAt": "2026-11-14"},
    {"months": 4, "items": [{"code": "m4_social_1", "domain": "social", "text": "Tự cười để gây chú ý"}, {"code": "m4_social_2", "domain": "social", "text": "Cười khúc khích khi bạn trêu"}, {"code": "m4_social_3", "domain": "social", "text": "Nhìn, cử động hoặc phát âm để bạn chú ý tới bé"}, {"code": "m4_language_1", "domain": "language", "text": "Ê a (\"ô ô\", \"a a\")"}, {"code": "m4_language_2", "domain": "language", "text": "Phát âm đáp lại khi bạn nói chuyện"}, {"code": "m4_language_3", "domain": "language", "text": "Quay đầu về phía giọng của bạn"}, {"code": "m4_cognitive_1", "domain": "cognitive", "text": "Há miệng khi đói và thấy ti mẹ hoặc bình"}, {"code": "m4_cognitive_2", "domain": "cognitive", "text": "Nhìn bàn tay mình thích thú"}, {"code": "m4_movement_1", "domain": "movement", "text": "Giữ vững đầu khi được bế, không cần đỡ"}, {"code": "m4_movement_2", "domain": "movement", "text": "Cầm món đồ chơi đặt vào tay"}, {"code": "m4_movement_3", "domain": "movement", "text": "Vung tay đập vào đồ chơi"}, {"code": "m4_movement_4", "domain": "movement", "text": "Đưa tay lên miệng"}, {"code": "m4_movement_5", "domain": "movement", "text": "Chống khuỷu tay, cẳng tay khi nằm sấp"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/4-months.html", "reviewedAt": "2026-11-14"},
    {"months": 6, "items": [{"code": "m6_social_1", "domain": "social", "text": "Nhận ra người quen"}, {"code": "m6_social_2", "domain": "social", "text": "Thích nhìn mình trong gương"}, {"code": "m6_social_3", "domain": "social", "text": "Cười thành tiếng"}, {"code": "m6_language_1", "domain": "language", "text": "Thay phiên phát âm với bạn"}, {"code": "m6_language_2", "domain": "language", "text": "Thổi phì phì (chu môi rung)"}, {"code": "m6_language_3", "domain": "language", "text": "Ré lên thích thú"}, {"code": "m6_cognitive_1", "domain": "cognitive", "text": "Đưa đồ vào miệng để khám phá"}, {"code": "m6_cognitive_2", "domain": "cognitive", "text": "Với lấy món đồ chơi bé muốn"}, {"code": "m6_cognitive_3", "domain": "cognitive", "text": "Mím môi khi không muốn ăn thêm"}, {"code": "m6_movement_1", "domain": "movement", "text": "Lật từ sấp sang ngửa"}, {"code": "m6_movement_2", "domain": "movement", "text": "Chống thẳng tay khi nằm sấp"}, {"code": "m6_movement_3", "domain": "movement", "text": "Chống tay đỡ người khi ngồi"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/6-months.html", "reviewedAt": "2026-11-14"},
    {"months": 9, "items": [{"code": "m9_social_1", "domain": "social", "text": "Ngại, bám người hoặc sợ người lạ"}, {"code": "m9_social_2", "domain": "social", "text": "Có nhiều nét mặt: vui, buồn, giận, ngạc nhiên"}, {"code": "m9_social_3", "domain": "social", "text": "Nhìn khi bạn gọi tên"}, {"code": "m9_social_4", "domain": "social", "text": "Phản ứng khi bạn rời đi: nhìn theo, với theo hoặc khóc"}, {"code": "m9_social_5", "domain": "social", "text": "Cười khi chơi ú òa"}, {"code": "m9_language_1", "domain": "language", "text": "Bập bẹ nhiều âm như \"mamama\", \"bababa\""}, {"code": "m9_language_2", "domain": "language", "text": "Giơ tay đòi bế"}, {"code": "m9_cognitive_1", "domain": "cognitive", "text": "Tìm đồ vật rơi khuất tầm nhìn"}, {"code": "m9_cognitive_2", "domain": "cognitive", "text": "Đập hai đồ vật vào nhau"}, {"code": "m9_movement_1", "domain": "movement", "text": "Tự ngồi dậy được"}, {"code": "m9_movement_2", "domain": "movement", "text": "Chuyển đồ từ tay này sang tay kia"}, {"code": "m9_movement_3", "domain": "movement", "text": "Dùng ngón tay cào thức ăn về phía mình"}, {"code": "m9_movement_4", "domain": "movement", "text": "Ngồi vững không cần đỡ"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/9-months.html", "reviewedAt": "2026-11-14"},
    {"months": 12, "items": [{"code": "m12_social_1", "domain": "social", "text": "Chơi trò chơi với bạn, như vỗ tay"}, {"code": "m12_language_1", "domain": "language", "text": "Vẫy tay \"bye bye\""}, {"code": "m12_language_2", "domain": "language", "text": "Gọi bố mẹ là \"ba\", \"mẹ\" hoặc một tên riêng"}, {"code": "m12_language_3", "domain": "language", "text": "Hiểu \"không\" (dừng lại khi bạn nói không)"}, {"code": "m12_cognitive_1", "domain": "cognitive", "text": "Bỏ đồ vào hộp, như khối gỗ vào cốc"}, {"code": "m12_cognitive_2", "domain": "cognitive", "text": "Tìm đồ bé thấy bạn giấu đi"}, {"code": "m12_movement_1", "domain": "movement", "text": "Vịn để đứng lên"}, {"code": "m12_movement_2", "domain": "movement", "text": "Vịn đồ đạc để đi"}, {"code": "m12_movement_3", "domain": "movement", "text": "Uống bằng cốc không nắp khi bạn cầm cốc"}, {"code": "m12_movement_4", "domain": "movement", "text": "Nhặt đồ nhỏ bằng ngón cái và ngón trỏ"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/1-year.html", "reviewedAt": "2026-11-14"},
    {"months": 15, "items": [{"code": "m15_social_1", "domain": "social", "text": "Bắt chước trẻ khác khi chơi"}, {"code": "m15_social_2", "domain": "social", "text": "Đưa cho bạn xem món đồ bé thích"}, {"code": "m15_social_3", "domain": "social", "text": "Vỗ tay khi thích thú"}, {"code": "m15_social_4", "domain": "social", "text": "Ôm búp bê hoặc thú bông"}, {"code": "m15_social_5", "domain": "social", "text": "Thể hiện tình cảm: ôm, rúc vào, hôn"}, {"code": "m15_language_1", "domain": "language", "text": "Cố nói một hai từ ngoài \"ba\", \"mẹ\""}, {"code": "m15_language_2", "domain": "language", "text": "Nhìn đồ vật quen khi bạn gọi tên"}, {"code": "m15_language_3", "domain": "language", "text": "Làm theo lời dặn có kèm cử chỉ"}, {"code": "m15_language_4", "domain": "language", "text": "Chỉ tay để đòi hoặc nhờ giúp"}, {"code": "m15_cognitive_1", "domain": "cognitive", "text": "Dùng đồ vật đúng cách: điện thoại, cốc, sách"}, {"code": "m15_cognitive_2", "domain": "cognitive", "text": "Chồng ít nhất hai đồ vật nhỏ"}, {"code": "m15_movement_1", "domain": "movement", "text": "Tự đi vài bước"}, {"code": "m15_movement_2", "domain": "movement", "text": "Dùng ngón tay bốc thức ăn ăn"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/15-months.html", "reviewedAt": "2026-11-14"},
    {"months": 18, "items": [{"code": "m18_social_1", "domain": "social", "text": "Đi ra xa nhưng ngoái lại xem bạn có gần không"}, {"code": "m18_social_2", "domain": "social", "text": "Chỉ cho bạn thấy điều thú vị"}, {"code": "m18_social_3", "domain": "social", "text": "Chìa tay cho bạn rửa"}, {"code": "m18_social_4", "domain": "social", "text": "Cùng bạn xem vài trang sách"}, {"code": "m18_social_5", "domain": "social", "text": "Giúp bạn mặc đồ: luồn tay vào tay áo, nhấc chân"}, {"code": "m18_language_1", "domain": "language", "text": "Cố nói ba từ trở lên ngoài \"ba\", \"mẹ\""}, {"code": "m18_language_2", "domain": "language", "text": "Làm theo lời dặn một bước không cần cử chỉ"}, {"code": "m18_cognitive_1", "domain": "cognitive", "text": "Bắt chước bạn làm việc nhà, như quét nhà"}, {"code": "m18_cognitive_2", "domain": "cognitive", "text": "Chơi đồ chơi đơn giản, như đẩy xe"}, {"code": "m18_movement_1", "domain": "movement", "text": "Tự đi không cần vịn"}, {"code": "m18_movement_2", "domain": "movement", "text": "Vẽ nguệch ngoạc"}, {"code": "m18_movement_3", "domain": "movement", "text": "Uống bằng cốc không nắp (có thể đổ)"}, {"code": "m18_movement_4", "domain": "movement", "text": "Tự bốc ăn"}, {"code": "m18_movement_5", "domain": "movement", "text": "Tập dùng thìa"}, {"code": "m18_movement_6", "domain": "movement", "text": "Tự leo lên, xuống ghế"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/18-months.html", "reviewedAt": "2026-11-14"},
    {"months": 24, "items": [{"code": "m24_social_1", "domain": "social", "text": "Nhận ra khi người khác đau hoặc buồn"}, {"code": "m24_social_2", "domain": "social", "text": "Nhìn mặt bạn để biết phản ứng thế nào trong tình huống mới"}, {"code": "m24_language_1", "domain": "language", "text": "Chỉ vào hình trong sách khi được hỏi"}, {"code": "m24_language_2", "domain": "language", "text": "Nói được ít nhất hai từ ghép nhau, như \"thêm sữa\""}, {"code": "m24_language_3", "domain": "language", "text": "Chỉ được ít nhất hai bộ phận cơ thể khi được hỏi"}, {"code": "m24_language_4", "domain": "language", "text": "Dùng cử chỉ ngoài vẫy và chỉ, như hôn gió, gật đầu"}, {"code": "m24_cognitive_1", "domain": "cognitive", "text": "Cầm đồ một tay, dùng tay kia làm việc khác (như cầm hộp, mở nắp)"}, {"code": "m24_cognitive_2", "domain": "cognitive", "text": "Thử bấm công tắc, núm, nút trên đồ chơi"}, {"code": "m24_cognitive_3", "domain": "cognitive", "text": "Chơi nhiều đồ chơi cùng lúc"}, {"code": "m24_movement_1", "domain": "movement", "text": "Đá bóng"}, {"code": "m24_movement_2", "domain": "movement", "text": "Chạy"}, {"code": "m24_movement_3", "domain": "movement", "text": "Bước lên vài bậc cầu thang (có hoặc không cần giúp)"}, {"code": "m24_movement_4", "domain": "movement", "text": "Ăn bằng thìa"}], "askDoctor": ["Bé chưa làm được một hoặc nhiều mốc trong tháng này", "Bé mất kỹ năng đã từng làm được", "Bạn có điều lo lắng khác về sự phát triển của bé"], "source": "https://www.cdc.gov/act-early/milestones/2-years.html", "reviewedAt": "2026-11-14"}
  ],
  "motor": [
    {"code": "lat", "name": "Lật (từ sấp sang ngửa)", "fromMonths": 4, "toMonths": 6, "source": "https://www.cdc.gov/act-early/milestones/6-months.html", "reviewedAt": "2026-11-14"},
    {"code": "ngoi", "name": "Ngồi không cần đỡ", "fromMonths": 3.8, "toMonths": 9.2, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
    {"code": "dung_co_do", "name": "Đứng có người đỡ", "fromMonths": 4.8, "toMonths": 11.4, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
    {"code": "bo", "name": "Bò bằng tay và gối", "fromMonths": 5.2, "toMonths": 13.5, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
    {"code": "di_co_dat", "name": "Đi có người dắt", "fromMonths": 6.0, "toMonths": 13.7, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
    {"code": "tu_dung", "name": "Tự đứng", "fromMonths": 6.9, "toMonths": 16.9, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"},
    {"code": "tu_di", "name": "Tự đi", "fromMonths": 8.2, "toMonths": 17.6, "source": "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/motor-development-milestones/mm_windows_table.pdf", "reviewedAt": "2026-11-14"}
  ]
}
```

- [ ] **Step 5: Viết schema và phần nạp**

Tạo `lib/content/milestones.ts`:

```ts
import { z } from "zod";
import data from "@/content/milestones.vi.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const code = z.string().regex(/^[a-z0-9_]{1,40}$/);

export const DomainSchema = z.enum([
  "social",
  "language",
  "cognitive",
  "movement",
]);
export type Domain = z.infer<typeof DomainSchema>;

export const MilestoneGroupSchema = z
  .object({
    months: z.number().int().min(1).max(36),
    items: z
      .array(
        z
          .object({ code, domain: DomainSchema, text: z.string().min(1) })
          .strict(),
      )
      .min(1),
    // Spec §6.9: "Khi nào nên hỏi bác sĩ" for every month group.
    askDoctor: z.array(z.string().min(1)).min(1),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const MotorMilestoneSchema = z
  .object({
    code,
    name: z.string().min(1),
    // Normal age window in months: WHO 1st–99th percentile for the six WHO
    // milestones; "lat" (rolling) uses the 4–6 months of spec §6.9 / CDC.
    fromMonths: z.number().min(0),
    toMonths: z.number().min(0),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict()
  .refine((m) => m.fromMonths < m.toMonths, "fromMonths < toMonths");

export const MilestonesContentSchema = z
  .object({
    title: z.string().min(1),
    intro: z.string().min(1),
    domains: z.record(DomainSchema, z.string().min(1)),
    reviewedAt: isoDate,
    groups: z.array(MilestoneGroupSchema).min(1),
    motor: z.array(MotorMilestoneSchema).min(1),
  })
  .strict();

export type MilestoneGroup = z.infer<typeof MilestoneGroupSchema>;
export type MotorMilestone = z.infer<typeof MotorMilestoneSchema>;

export const MILESTONES = MilestonesContentSchema.parse(data);
```

- [ ] **Step 6: Chạy test để thấy đạt**

Run: `bunx vitest run lib/content/milestones.test.ts && bun run typecheck`
Expected: PASS — `Tests  3 passed (3)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 7: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m25.md content/milestones.vi.json lib/content/milestones.ts lib/content/milestones.test.ts && git commit -m "feat(milestones): CDC month milestones and WHO motor windows content"
```

---

### Task 2: Bảng `milestones_achieved`

**Files:**

- Create: `supabase/migrations/20261114000900_milestones_achieved.sql`
- Modify: `lib/supabase/types.ts` (sinh lại), `lib/supabase/rows.ts`
- Test: `supabase/tests/011_milestones_achieved.test.sql`

**Interfaces:**

- Consumes: `public.babies`, `public.photos` (M24), `is_member`, `is_owner`, `baby_family`, `forbid_immutable_change`
- Produces: bảng `public.milestones_achieved(id, baby_id, milestone_code, achieved_on, note, photo_id, created_by, created_at)`, `unique (baby_id, milestone_code)`; `public.photo_matches_baby(uuid, uuid)`; `MilestoneRow`

- [ ] **Step 1: Viết test pgTAP thất bại**

Tạo `supabase/tests/011_milestones_achieved.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000011', 'sa@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000011', 'sb@example.com'),
  ('cccccccc-0000-0000-0000-000000000011', 'sc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000012', 'Nhà S');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000012', 'sa@example.com', 'aaaaaaaa-0000-0000-0000-000000000011', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000012', 'sb@example.com', 'bbbbbbbb-0000-0000-0000-000000000011', 'member', 'Bà');
insert into public.babies (id, family_id, name, dob, sex) values
  ('ba000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000012', 'Bé', '2026-09-14', 'female'),
  ('ba000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000012', 'Bé hai', '2026-09-14', 'male');
insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by) values
  ('a0000000-0000-0000-0000-000000000012', 'ba000000-0000-0000-0000-000000000012',
   'f0000000-0000-0000-0000-000000000012/ba000000-0000-0000-0000-000000000012/a0000000-0000-0000-0000-000000000012.jpg',
   '2026-11-01', 1000, 'aaaaaaaa-0000-0000-0000-000000000011'),
  ('a0000000-0000-0000-0000-000000000013', 'ba000000-0000-0000-0000-000000000013',
   'f0000000-0000-0000-0000-000000000012/ba000000-0000-0000-0000-000000000013/a0000000-0000-0000-0000-000000000013.jpg',
   '2026-11-01', 1000, 'aaaaaaaa-0000-0000-0000-000000000011');
insert into public.milestones_achieved (baby_id, milestone_code, achieved_on, photo_id, created_by) values
  ('ba000000-0000-0000-0000-000000000012', 'm2_social_4', '2026-11-10', 'a0000000-0000-0000-0000-000000000012', 'aaaaaaaa-0000-0000-0000-000000000011');

select throws_ok(
  $$ insert into public.milestones_achieved (baby_id, milestone_code, achieved_on, created_by)
     values ('ba000000-0000-0000-0000-000000000012', 'm2_social_4', '2026-11-11', 'aaaaaaaa-0000-0000-0000-000000000011') $$,
  '23505', null, 'one row per baby and milestone');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000011","email":"sc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.milestones_achieved', 'outsider sees no milestones');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000011","email":"sb@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.milestones_achieved (baby_id, milestone_code, achieved_on, photo_id)
     values ('ba000000-0000-0000-0000-000000000012', 'lat', '2026-11-14', 'a0000000-0000-0000-0000-000000000012')
     on conflict (baby_id, milestone_code) do update set achieved_on = excluded.achieved_on $$,
  'member marks a milestone with a photo of the same baby (upsert)');
select throws_ok(
  $$ insert into public.milestones_achieved (baby_id, milestone_code, achieved_on, photo_id)
     values ('ba000000-0000-0000-0000-000000000012', 'ngoi', '2026-11-14', 'a0000000-0000-0000-0000-000000000013') $$,
  '42501', null, 'a photo of another baby cannot be attached');
select is_empty(
  $$ update public.milestones_achieved set note = 'sửa' where milestone_code = 'm2_social_4' returning id $$,
  'member cannot edit the owner''s mark');
select is_empty(
  $$ delete from public.milestones_achieved where milestone_code = 'm2_social_4' returning id $$,
  'member cannot delete the owner''s mark');
select isnt_empty(
  $$ delete from public.milestones_achieved where milestone_code = 'lat' returning id $$,
  'member deletes their own mark');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000011","email":"sa@example.com","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ update public.milestones_achieved set milestone_code = 'ngoi' where milestone_code = 'm2_social_4' $$,
  'P0001', 'immutable_column: milestone_code', 'milestone_code is immutable');
reset role;

delete from public.photos where id = 'a0000000-0000-0000-0000-000000000012';
select is(
  (select photo_id from public.milestones_achieved where milestone_code = 'm2_social_4'),
  null,
  'deleting a photo clears it from the milestone that showed it');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `011_milestones_achieved.test.sql` báo `relation "public.milestones_achieved" does not exist`; `001`…`010` vẫn `ok`.

- [ ] **Step 3: Viết migration**

Tạo `supabase/migrations/20261114000900_milestones_achieved.sql`:

```sql
-- Spec §5: one row per (baby, milestone). Spec §9: written through the outbox as an
-- upsert on (baby_id, milestone_code) without sending id.
create table public.milestones_achieved (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  milestone_code text not null check (milestone_code ~ '^[a-z0-9_]{1,40}$'),
  achieved_on date not null,
  note text check (note is null or length(btrim(note)) between 1 and 500),
  photo_id uuid references public.photos (id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  unique (baby_id, milestone_code)
);

create trigger milestones_achieved_immutable before update on public.milestones_achieved
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by', 'milestone_code');

-- A milestone may only show a photo of the same baby. Security invoker: the caller
-- already sees their family's photos through photos_select, and outsiders see none.
create function public.photo_matches_baby(p_photo uuid, p_baby uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_photo is null
    or exists (select 1 from public.photos where id = p_photo and baby_id = p_baby)
$$;

alter table public.milestones_achieved enable row level security;

-- Spec §5.2: same rules as logs.
create policy milestones_achieved_select on public.milestones_achieved for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy milestones_achieved_insert on public.milestones_achieved for insert to authenticated
  with check (
    public.is_member(public.baby_family(baby_id))
    and created_by = auth.uid()
    and public.photo_matches_baby(photo_id, baby_id)
  );
create policy milestones_achieved_update on public.milestones_achieved for update to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  )
  with check (
    (
      public.is_owner(public.baby_family(baby_id))
      or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
    )
    and public.photo_matches_baby(photo_id, baby_id)
  );
create policy milestones_achieved_delete on public.milestones_achieved for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001`…`010` `ok`, `011_milestones_achieved.test.sql .. ok`, `All tests successful.`

- [ ] **Step 5: Sinh lại kiểu, thêm `MilestoneRow`**

Run: `bun run db:types && grep -c '"milestones_achieved"' lib/supabase/types.ts`
Expected: số đếm ≥ 1.

Thêm dòng cuối vào `lib/supabase/rows.ts`:

```ts
export type MilestoneRow = Tables["milestones_achieved"]["Row"];
```

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; `Tests  300 passed (300)` (297 + 3 của Task 1).

- [ ] **Step 6: Commit và đưa migration lên cloud**

```bash
git add supabase/migrations/20261114000900_milestones_achieved.sql supabase/tests/011_milestones_achieved.test.sql lib/supabase/types.ts lib/supabase/rows.ts && git commit -m "feat(milestones): milestones_achieved table with RLS and same-baby photos"
```

Run: `bunx supabase db push --linked --yes`
Expected: `Applying migration 20261114000900_milestones_achieved.sql...`, `Finished supabase db push.` Nếu CLI cần mật khẩu DB hoặc báo chưa link project, dừng bước này và ghi vào báo cáo cuối như việc người dùng tự làm.

---

### Task 3: Mốc qua outbox và quy tắc mốc

**Files:**

- Create: `lib/rules/milestones.ts`
- Modify: `lib/data/outboxCore.ts`, `lib/data/outbox.ts`, `lib/data/outboxDeps.ts`, `components/sync/OutboxSync.tsx`
- Test: `lib/data/outboxMilestones.test.ts`, `lib/rules/milestones.test.ts`

**Interfaces:**

- Consumes: `MilestoneRow` (Task 2); `MilestoneGroup`, `MotorMilestone` (Task 1); outbox của M12/M16/M19
- Produces: `OutboxEntry.table` thêm `"milestones_achieved"`; `applyMilestoneChange(rows, entry, nowIso)`, `overlayPendingMilestones(rows, entries, nowIso)`; `MilestoneChange`, `milestonesKey(babyId) = ["milestones", babyId]`, `enqueueMilestoneChange(queryClient, change)`, `withPendingMilestones(babyId, rows)`; `sendMilestone` trong `outboxDeps`; `ageInMonths`, `visibleGroups`, `motorStatus`, `parseMilestoneForm`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/data/outboxMilestones.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { MilestoneRow } from "@/lib/supabase/rows";
import {
  applyMilestoneChange,
  overlayPendingMilestones,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-15T03:00:00.000Z";
const entry = (
  op: OutboxEntry["op"],
  code: string,
  row: Record<string, unknown>,
  createdAt = 1,
): OutboxEntry => ({
  id: `e-${code}-${createdAt}`,
  table: "milestones_achieved",
  op,
  rowId: code,
  babyId: "b1",
  userId: "u1",
  row: { milestone_code: code, ...row },
  createdAt,
  attempts: 0,
});
const server: MilestoneRow = {
  id: "s1",
  baby_id: "b1",
  milestone_code: "lat",
  achieved_on: "2026-11-10",
  note: null,
  photo_id: null,
  created_by: "u0",
  created_at: "2026-11-10T03:00:00.000Z",
};

describe("applyMilestoneChange", () => {
  it("upsert adds a mark, then updates it in place", () => {
    const added = applyMilestoneChange(
      [server],
      entry("upsert", "ngoi", {
        achieved_on: "2026-11-14",
        note: "Ngồi vững",
        photo_id: "p1",
      }),
      NOW,
    );
    expect(added[1]).toMatchObject({
      id: "e-ngoi-1",
      milestone_code: "ngoi",
      achieved_on: "2026-11-14",
      note: "Ngồi vững",
      photo_id: "p1",
      created_by: "u1",
    });
    const edited = applyMilestoneChange(
      [server],
      entry("upsert", "lat", {
        achieved_on: "2026-11-09",
        note: null,
        photo_id: null,
      }),
      NOW,
    );
    expect(edited).toEqual([{ ...server, achieved_on: "2026-11-09" }]);
  });

  it("delete removes the mark by code", () => {
    expect(
      applyMilestoneChange([server], entry("delete", "lat", {}), NOW),
    ).toEqual([]);
  });
});

describe("overlayPendingMilestones", () => {
  it("applies milestone entries oldest first and ignores other tables", () => {
    const other: OutboxEntry = {
      ...entry("delete", "lat", {}, 0),
      table: "growth",
    };
    const rows = overlayPendingMilestones(
      [server],
      [
        entry(
          "upsert",
          "lat",
          { achieved_on: "2026-11-12", note: null, photo_id: null },
          3,
        ),
        entry("delete", "lat", {}, 2),
        other,
      ],
      NOW,
    );
    expect(rows.map((r) => [r.milestone_code, r.achieved_on])).toEqual([
      ["lat", "2026-11-12"],
    ]);
  });
});
```

Tạo `lib/rules/milestones.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { MilestoneGroup, MotorMilestone } from "@/lib/content/milestones";
import {
  ageInMonths,
  motorStatus,
  parseMilestoneForm,
  visibleGroups,
} from "./milestones";

const group = (months: number) => ({ months }) as MilestoneGroup;
const groups = [2, 4, 6, 9, 12].map(group);

describe("visibleGroups (spec §6.9)", () => {
  it("shows the current age group and the next one", () => {
    const at = (m: number) => visibleGroups(groups, m).map((g) => g.months);
    expect(at(0.5)).toEqual([2, 4]);
    expect(at(2)).toEqual([2, 4]);
    expect(at(3.9)).toEqual([2, 4]);
    expect(at(4)).toEqual([4, 6]);
    expect(at(13)).toEqual([12]);
  });
});

describe("motorStatus", () => {
  const sitting = {
    code: "ngoi",
    fromMonths: 3.8,
    toMonths: 9.2,
  } as MotorMilestone;
  it("is early, in the window, late, or done", () => {
    expect(motorStatus(sitting, 2, false)).toEqual({
      state: "early",
      text: "Thường trong khoảng 3,8–9,2 tháng",
    });
    expect(motorStatus(sitting, 6, false).state).toBe("window");
    expect(motorStatus(sitting, 9.2, false).state).toBe("window");
    expect(motorStatus(sitting, 9.3, false)).toEqual({
      state: "late",
      text: "Đã quá khoảng bình thường (3,8–9,2 tháng), nên hỏi bác sĩ",
    });
    expect(motorStatus(sitting, 12, true)).toEqual({
      state: "done",
      text: "Đã đạt",
    });
  });

  it("converts days to months", () => {
    expect(ageInMonths(30.4375 * 6)).toBe(6);
  });
});

describe("parseMilestoneForm", () => {
  const ctx = { dob: "2026-09-14", today: "2026-11-14" };
  it("needs a day between birth and today and a short note", () => {
    expect(
      parseMilestoneForm(
        { achievedOn: "2026-11-14", note: " Lật lần đầu " },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: { achieved_on: "2026-11-14", note: "Lật lần đầu" },
    });
    expect(
      parseMilestoneForm({ achievedOn: "2026-09-13", note: "" }, ctx),
    ).toEqual({
      ok: false,
      message: "Ngày đạt phải từ ngày sinh đến hôm nay.",
    });
    expect(
      parseMilestoneForm(
        { achievedOn: "2026-11-14", note: "x".repeat(501) },
        ctx,
      ),
    ).toEqual({
      ok: false,
      message: "Ghi chú tối đa 500 ký tự.",
    });
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/data/outboxMilestones.test.ts lib/rules/milestones.test.ts`
Expected: FAIL — `Tests  3 failed (3)` ở `outboxMilestones.test.ts` với `TypeError: applyMilestoneChange is not a function` (và `overlayPendingMilestones`); và `Error: Cannot find module './milestones' imported from …/lib/rules/milestones.test.ts`

- [ ] **Step 3: Sửa outbox**

```diff
--- a/lib/data/outboxCore.ts
+++ b/lib/data/outboxCore.ts
@@ -1,4 +1,9 @@
-import type { GrowthRow, LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
+import type {
+  GrowthRow,
+  LogRow,
+  MilestoneRow,
+  VaccineDoseRow,
+} from "@/lib/supabase/rows";
 
 // logs: insert / update / delete / stop by row id.
 // vaccine_doses: upsert (mark a dose) / insert (quick tick, keeps an existing row) /
@@ -7,7 +12,7 @@
 
 export type OutboxEntry = {
   id: string;
-  table: "logs" | "vaccine_doses" | "growth";
+  table: "logs" | "vaccine_doses" | "growth" | "milestones_achieved";
   op: OutboxOp;
   rowId: string;
   babyId: string;
@@ -15,6 +20,8 @@
   // logs — insert: the new row; update: the changed columns; stop: { ended_at }; delete: null.
   // vaccine_doses — always { vaccine_code, dose_no, ... } plus the marked columns.
   // growth — insert: the measurement; update: the changed columns; delete: null.
+  // milestones_achieved — upsert: { milestone_code, achieved_on, note, photo_id };
+  // delete: { milestone_code }. rowId is the milestone code.
   row: Record<string, unknown> | null;
   createdAt: number;
   attempts: number;
@@ -265,3 +272,44 @@
     .sort((a, b) => a.createdAt - b.createdAt)
     .reduce((acc, entry) => applyGrowthChange(acc, entry, nowIso), rows);
 }
+
+// Marks keyed by milestone code (the server's id is never sent, spec §9).
+export function applyMilestoneChange(
+  rows: MilestoneRow[],
+  entry: OutboxEntry,
+  nowIso: string,
+): MilestoneRow[] {
+  if (entry.op === "delete")
+    return rows.filter((row) => row.milestone_code !== entry.rowId);
+  if (entry.op !== "upsert") return rows;
+  const patch = (entry.row ?? {}) as Partial<MilestoneRow>;
+  const existing = rows.find((row) => row.milestone_code === entry.rowId);
+  const marks = {
+    achieved_on: String(patch.achieved_on),
+    note: patch.note ?? null,
+    photo_id: patch.photo_id ?? null,
+  };
+  if (existing)
+    return rows.map((row) => (row === existing ? { ...row, ...marks } : row));
+  return [
+    ...rows,
+    {
+      id: entry.id,
+      baby_id: entry.babyId,
+      milestone_code: entry.rowId,
+      ...marks,
+      created_by: entry.userId,
+      created_at: nowIso,
+    },
+  ];
+}
+
+export function overlayPendingMilestones(
+  rows: MilestoneRow[],
+  entries: OutboxEntry[],
+  nowIso: string,
+): MilestoneRow[] {
+  return [...entriesFor(entries, "milestones_achieved")]
+    .sort((a, b) => a.createdAt - b.createdAt)
+    .reduce((acc, entry) => applyMilestoneChange(acc, entry, nowIso), rows);
+}
```

```diff
--- a/lib/data/outbox.ts
+++ b/lib/data/outbox.ts
@@ -1,15 +1,22 @@
 "use client";
 
 import type { QueryClient } from "@tanstack/react-query";
-import type { GrowthRow, LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
+import type {
+  GrowthRow,
+  LogRow,
+  MilestoneRow,
+  VaccineDoseRow,
+} from "@/lib/supabase/rows";
 import { localDb } from "./localDb";
 import {
   applyDoseChange,
   applyGrowthChange,
+  applyMilestoneChange,
   applyToCache,
   overlayPending,
   overlayPendingDoses,
   overlayPendingGrowth,
+  overlayPendingMilestones,
   type OutboxEntry,
 } from "./outboxCore";
 import { flushRequests } from "./outboxEvents";
@@ -163,3 +170,52 @@
     return rows;
   }
 }
+
+export type MilestoneChange = Pick<OutboxEntry, "babyId" | "userId"> & {
+  op: "upsert" | "delete";
+  code: string;
+  marks?: { achieved_on: string; note: string | null; photo_id: string | null };
+};
+
+export const milestonesKey = (babyId: string) =>
+  ["milestones", babyId] as const;
+
+export async function enqueueMilestoneChange(
+  queryClient: QueryClient,
+  change: MilestoneChange,
+): Promise<void> {
+  const entry: OutboxEntry = {
+    id: crypto.randomUUID(),
+    table: "milestones_achieved",
+    op: change.op,
+    rowId: change.code,
+    babyId: change.babyId,
+    userId: change.userId,
+    row: { milestone_code: change.code, ...change.marks },
+    createdAt: await nextCreatedAt(),
+    attempts: 0,
+  };
+  await localDb().outbox.add(entry);
+  const key = milestonesKey(change.babyId);
+  await queryClient.cancelQueries({ queryKey: key });
+  const nowIso = new Date().toISOString();
+  queryClient.setQueryData<MilestoneRow[]>(key, (rows) =>
+    rows ? applyMilestoneChange(rows, entry, nowIso) : rows,
+  );
+  flushRequests.emit();
+}
+
+export async function withPendingMilestones(
+  babyId: string,
+  rows: MilestoneRow[],
+): Promise<MilestoneRow[]> {
+  try {
+    const entries = await localDb()
+      .outbox.where("babyId")
+      .equals(babyId)
+      .toArray();
+    return overlayPendingMilestones(rows, entries, new Date().toISOString());
+  } catch {
+    return rows;
+  }
+}
```

```diff
--- a/lib/data/outboxDeps.ts
+++ b/lib/data/outboxDeps.ts
@@ -210,7 +210,55 @@
   }
 }
 
+// Spec §9: upsert on (baby_id, milestone_code) without sending id.
+async function sendMilestone(entry: OutboxEntry): Promise<SendOutcome> {
+  const sb = supabase();
+  const row = entry.row ?? {};
+  const code = String(row.milestone_code);
+  if (entry.op === "upsert") {
+    const result = await sb
+      .from("milestones_achieved")
+      .upsert(
+        {
+          baby_id: entry.babyId,
+          milestone_code: code,
+          achieved_on: String(row.achieved_on),
+          note: (row.note as string | null | undefined) ?? null,
+          photo_id: (row.photo_id as string | null | undefined) ?? null,
+        },
+        { onConflict: "baby_id,milestone_code" },
+      )
+      .select("id");
+    if (result.error) return failed(result);
+    return result.data.length > 0
+      ? { ok: true }
+      : { ok: false, failure: { zeroRows: true } };
+  }
+  if (entry.op === "delete") {
+    const result = await sb
+      .from("milestones_achieved")
+      .delete()
+      .eq("baby_id", entry.babyId)
+      .eq("milestone_code", code)
+      .select("id");
+    if (result.error) return failed(result);
+    if (result.data.length > 0) return { ok: true };
+    // 0 rows: already cleared on another device counts as done.
+    const check = await sb
+      .from("milestones_achieved")
+      .select("id")
+      .eq("baby_id", entry.babyId)
+      .eq("milestone_code", code);
+    if (check.error) return failed(check);
+    return check.data.length === 0
+      ? { ok: true }
+      : { ok: false, failure: { zeroRows: true } };
+  }
+  return UNSUPPORTED;
+}
+
 function send(entry: OutboxEntry): Promise<SendOutcome> {
+  if (entry.table === "milestones_achieved") return sendMilestone(entry);
   if (entry.table === "vaccine_doses") return sendDose(entry);
   if (entry.table === "growth") return sendGrowth(entry);
   return sendLog(entry);
```

```diff
--- a/components/sync/OutboxSync.tsx
+++ b/components/sync/OutboxSync.tsx
@@ -47,6 +47,7 @@
           // Also rolls back a refused dose mark (spec §9) and drops temporary rows.
           void queryClient.invalidateQueries({ queryKey: ["vaccine-doses"] });
           void queryClient.invalidateQueries({ queryKey: ["growth"] });
+          void queryClient.invalidateQueries({ queryKey: ["milestones"] });
         }
       } catch (error) {
         console.warn("Không gửi được dữ liệu chờ đồng bộ", error);
```

- [ ] **Step 4: Viết quy tắc mốc**

Tạo `lib/rules/milestones.ts`:

```ts
import type { MilestoneGroup, MotorMilestone } from "@/lib/content/milestones";

const DAYS_PER_MONTH = 30.4375;

export const ageInMonths = (ageDays: number) => ageDays / DAYS_PER_MONTH;

// Spec §6.9: show the current age group and the next one.
export function visibleGroups(
  groups: MilestoneGroup[],
  ageMonths: number,
): MilestoneGroup[] {
  let current = 0;
  groups.forEach((group, index) => {
    if (group.months <= ageMonths) current = index;
  });
  return groups.slice(current, current + 2);
}

export type MotorState = "done" | "early" | "window" | "late";

const months = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export function motorStatus(
  milestone: MotorMilestone,
  ageMonths: number,
  achieved: boolean,
): { state: MotorState; text: string } {
  const range = `${months.format(milestone.fromMonths)}–${months.format(milestone.toMonths)} tháng`;
  if (achieved) return { state: "done", text: "Đã đạt" };
  if (ageMonths < milestone.fromMonths)
    return { state: "early", text: `Thường trong khoảng ${range}` };
  if (ageMonths <= milestone.toMonths)
    return {
      state: "window",
      text: `Đang trong khoảng bình thường (${range})`,
    };
  return {
    state: "late",
    text: `Đã quá khoảng bình thường (${range}), nên hỏi bác sĩ`,
  };
}

export function parseMilestoneForm(
  raw: { achievedOn: string; note: string },
  ctx: { dob: string; today: string },
):
  | { ok: true; value: { achieved_on: string; note: string | null } }
  | { ok: false; message: string } {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.achievedOn) ||
    raw.achievedOn < ctx.dob ||
    raw.achievedOn > ctx.today
  )
    return { ok: false, message: "Ngày đạt phải từ ngày sinh đến hôm nay." };
  const note = raw.note.trim();
  if (note.length > 500)
    return { ok: false, message: "Ghi chú tối đa 500 ký tự." };
  return {
    ok: true,
    value: { achieved_on: raw.achievedOn, note: note || null },
  };
}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/data/outboxMilestones.test.ts lib/rules/milestones.test.ts && bun run typecheck && bun run test`
Expected: PASS — `Tests  7 passed (7)`; không lỗi type; cả bộ `Tests  307 passed (307)`.

- [ ] **Step 6: Commit**

```bash
git add lib/rules/milestones.ts lib/rules/milestones.test.ts lib/data/outboxCore.ts lib/data/outbox.ts lib/data/outboxDeps.ts lib/data/outboxMilestones.test.ts components/sync/OutboxSync.tsx && git commit -m "feat(offline): milestone marks through the outbox, milestone status rules"
```

---

### Task 4: Trang `/phat-trien`

**Files:**

- Create: `lib/data/milestones.ts`, `components/milestones/MilestoneSheet.tsx`, `components/milestones/MilestonesScreen.tsx`, `app/phat-trien/page.tsx`
- Modify: `lib/nav.ts`
- Test: `lib/nav.test.ts`, `lib/themeGuard.test.ts` (đã có)

**Interfaces:**

- Consumes: Task 1–3; `usePhotos`, `usePhotoUrls` (M24); `PendingMark`, `useOutboxEntries`, `AuthGate`
- Produces: `useMilestones`, `useMilestoneActions`; `MilestoneSheet`, `MilestonesScreen({ baby, userId, isOwner })`; trang `/phat-trien`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -70,6 +70,12 @@
     expect(TOOL_ITEMS.find((i) => i.label === "Ảnh")?.href).toBe("/anh");
   });
 
+  it("Cẩm nang opens development milestones", () => {
+    expect(GUIDE_ITEMS.find((i) => i.label === "Phát triển")?.href).toBe(
+      "/phat-trien",
+    );
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `AssertionError: expected null to be '/phat-trien'`; `Tests  1 failed | 11 passed (12)`

- [ ] **Step 3: Sửa menu**

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -18,7 +18,7 @@
 export const GUIDE_ITEMS: MenuItem[] = [
   { label: "Tiêm chủng", href: "/tiem-chung" },
   { label: "Triệu chứng", href: "/trieu-chung" },
-  { label: "Phát triển", href: null },
+  { label: "Phát triển", href: "/phat-trien" },
   { label: "Bồng bế", href: "/bong-be" },
   { label: "Bệnh thường gặp", href: "/benh-thuong-gap" },
 ];
```

- [ ] **Step 4: Tạo `lib/data/milestones.ts`**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { MilestoneRow } from "@/lib/supabase/rows";
import {
  enqueueMilestoneChange,
  milestonesKey,
  withPendingMilestones,
} from "./outbox";

export function useMilestones(babyId: string) {
  return useQuery({
    queryKey: milestonesKey(babyId),
    queryFn: async (): Promise<MilestoneRow[]> => {
      const { data, error } = await supabase()
        .from("milestones_achieved")
        .select("*")
        .eq("baby_id", babyId);
      if (error) throw error;
      return withPendingMilestones(babyId, data);
    },
    staleTime: 60_000,
  });
}

// Spec §9: marks go through the outbox, so they work offline and show ⏳.
export function useMilestoneActions(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return {
    mark: useMutation({
      networkMode: "always",
      mutationFn: (input: {
        code: string;
        achieved_on: string;
        note: string | null;
        photo_id: string | null;
      }) =>
        enqueueMilestoneChange(queryClient, {
          op: "upsert",
          babyId,
          userId,
          code: input.code,
          marks: {
            achieved_on: input.achieved_on,
            note: input.note,
            photo_id: input.photo_id,
          },
        }),
    }),
    unmark: useMutation({
      networkMode: "always",
      mutationFn: (code: string) =>
        enqueueMilestoneChange(queryClient, {
          op: "delete",
          babyId,
          userId,
          code,
        }),
    }),
  };
}
```

- [ ] **Step 5: Tạo `components/milestones/MilestoneSheet.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useMilestoneActions } from "@/lib/data/milestones";
import { usePhotos, usePhotoUrls } from "@/lib/data/photos";
import { parseMilestoneForm } from "@/lib/rules/milestones";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";

export function MilestoneSheet({
  code,
  title,
  row,
  baby,
  userId,
  onClose,
}: {
  code: string;
  title: string;
  row: MilestoneRow | null;
  baby: Baby;
  userId: string;
  onClose: () => void;
}) {
  const actions = useMilestoneActions(baby.id, userId);
  const today = vnDateString(new Date());
  const photos = usePhotos(baby.id);
  // Recent photos first; the milestone keeps at most one (spec §6.9).
  const choices = (photos.data ?? []).slice(0, 12);
  const urls = usePhotoUrls(choices.map((p) => p.storage_path));
  const [achievedOn, setAchievedOn] = useState(row?.achieved_on ?? today);
  const [note, setNote] = useState(row?.note ?? "");
  const [photoId, setPhotoId] = useState<string | null>(row?.photo_id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const done = {
    onSuccess: onClose,
    onError: (e: unknown) => setMessage(toVietnameseError(e)),
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseMilestoneForm(
      { achievedOn, note },
      { dob: baby.dob, today },
    );
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.mark.mutate({ code, ...parsed.value, photo_id: photoId }, done);
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col gap-3 overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        <label className="flex flex-col gap-1">
          Ngày đạt
          <input
            type="date"
            className="min-h-11 rounded-xl border px-3"
            min={baby.dob}
            max={today}
            value={achievedOn}
            onChange={(e) => setAchievedOn(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Ghi chú (không bắt buộc)
          <textarea
            className="min-h-20 rounded-xl border p-3"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        {choices.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1">Gắn ảnh (không bắt buộc)</legend>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                aria-pressed={photoId === null}
                onClick={() => setPhotoId(null)}
                className={`aspect-square rounded-lg border text-sm ${photoId === null ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
              >
                Không
              </button>
              {choices.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  aria-pressed={photoId === photo.id}
                  aria-label={photo.caption ?? `Ảnh ngày ${photo.taken_on}`}
                  onClick={() => setPhotoId(photo.id)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${photoId === photo.id ? "border-accent" : "border-transparent"}`}
                >
                  {urls.data?.[photo.storage_path] && (
                    <img
                      src={urls.data[photo.storage_path]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {message && (
          <p role="alert" className="text-danger">
            {message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-2xl border"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent"
          >
            Lưu
          </button>
        </div>
        {row && (
          <button
            type="button"
            onClick={() => actions.unmark.mutate(code, done)}
            className="min-h-11 rounded-2xl text-danger"
          >
            Bỏ đánh dấu
          </button>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Tạo `components/milestones/MilestonesScreen.tsx` và `app/phat-trien/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { MILESTONES } from "@/lib/content/milestones";
import { useMilestones } from "@/lib/data/milestones";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import {
  ageInMonths,
  motorStatus,
  visibleGroups,
  type MotorState,
} from "@/lib/rules/milestones";
import { ageDays } from "@/lib/rules/time";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { MilestoneSheet } from "./MilestoneSheet";

const STATE_CLASS: Record<MotorState, string> = {
  done: "bg-good-soft text-good-ink",
  early: "bg-soft text-muted",
  window: "bg-accent-soft text-accent-ink",
  late: "bg-warn-soft text-warn-ink",
};

export function MilestonesScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const marks = useMilestones(baby.id);
  const pending = pendingRowIds(
    entriesFor(useOutboxEntries(userId), "milestones_achieved"),
  );
  const months = ageInMonths(ageDays(baby.dob, new Date()));
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<{ code: string; title: string } | null>(
    null,
  );
  const byCode = new Map((marks.data ?? []).map((m) => [m.milestone_code, m]));
  const groups = showAll
    ? MILESTONES.groups
    : visibleGroups(MILESTONES.groups, months);
  const canEdit = (row: MilestoneRow | undefined) =>
    !row || isOwner || row.created_by === userId;

  const item = (code: string, title: string, extra?: React.ReactNode) => {
    const row = byCode.get(code);
    return (
      <li key={code}>
        <button
          type="button"
          disabled={!canEdit(row)}
          onClick={() => setOpen({ code, title })}
          className="flex min-h-12 w-full items-start gap-3 px-4 py-2 text-left disabled:opacity-100"
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border ${row ? "border-accent bg-accent text-on-accent" : ""}`}
          >
            {row ? "✓" : ""}
          </span>
          <span className="flex flex-col">
            <span>
              {title} <PendingMark pending={pending.has(code)} />
            </span>
            {row && (
              <span className="text-sm text-muted">
                Đạt ngày {row.achieved_on.split("-").reverse().join("/")}
                {row.note ? ` · ${row.note}` : ""}
                {row.photo_id ? " · có ảnh" : ""}
              </span>
            )}
            {extra}
          </span>
        </button>
      </li>
    );
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{MILESTONES.title}</h1>
      <p className="text-sm text-muted">{MILESTONES.intro}</p>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Mốc vận động lớn</h2>
        <ul className="divide-y rounded-2xl border">
          {MILESTONES.motor.map((m) => {
            const status = motorStatus(m, months, byCode.has(m.code));
            return item(
              m.code,
              m.name,
              status.state === "done" ? null : (
                <span
                  className={`mt-1 self-start rounded-full px-2 text-sm ${STATE_CLASS[status.state]}`}
                >
                  {status.text}
                </span>
              ),
            );
          })}
        </ul>
      </section>
      {groups.map((group) => (
        <section key={group.months} className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Mốc {group.months} tháng</h2>
          {(["social", "language", "cognitive", "movement"] as const).map(
            (domain) => {
              const list = group.items.filter((i) => i.domain === domain);
              if (list.length === 0) return null;
              return (
                <div key={domain} className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-muted">
                    {MILESTONES.domains[domain]}
                  </h3>
                  <ul className="divide-y rounded-2xl border">
                    {list.map((i) => item(i.code, i.text))}
                  </ul>
                </div>
              );
            },
          )}
          <div className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
            <p className="font-medium">Khi nào nên hỏi bác sĩ</p>
            <ul className="list-disc pl-5">
              {group.askDoctor.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <a
            href={group.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm text-muted underline"
          >
            Nguồn: CDC
          </a>
        </section>
      ))}
      <button
        type="button"
        onClick={() => setShowAll(!showAll)}
        className="min-h-11 rounded-xl border px-4"
      >
        {showAll ? "Chỉ xem tháng hiện tại và kế tiếp" : "Xem tất cả các mốc"}
      </button>
      {open && (
        <MilestoneSheet
          code={open.code}
          title={open.title}
          row={byCode.get(open.code) ?? null}
          baby={baby}
          userId={userId}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { MilestonesScreen } from "@/components/milestones/MilestonesScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <MilestonesScreen
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

- [ ] **Step 7: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  308 passed (308)`; build thành công, có `○ /phat-trien`.

- [ ] **Step 8: Commit**

```bash
git add lib/data/milestones.ts components/milestones app/phat-trien lib/nav.ts lib/nav.test.ts && git commit -m "feat(milestones): /phat-trien with month groups, motor windows and photo marks"
```

---

### Task 5: Checklist bước 18 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 4
- Produces: checklist bước 18

- [ ] **Step 1: Thêm bước 18 vào cuối file**

```diff
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -266,3 +266,16 @@
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 18 — Mốc phát triển (M25)
+
+1. Cẩm nang → Phát triển. Kỳ vọng: phần "Mốc vận động lớn" (Lật, Ngồi không cần đỡ, … Tự đi) có nhãn khoảng tuổi; tiếp theo là mốc của tháng hiện tại và tháng kế tiếp, chia 4 lĩnh vực, mỗi tháng có khung "Khi nào nên hỏi bác sĩ" và link "Nguồn: CDC".
+2. Bấm một mốc bé đã làm được → chọn ngày, ghi chú, chọn một ảnh (nếu đã có ảnh ở Tiện ích → Ảnh) → Lưu. Kỳ vọng: mốc có dấu ✓ và dòng "Đạt ngày … · có ảnh"; máy thứ hai thấy giống vậy.
+3. Bật chế độ máy bay, đánh dấu thêm một mốc. Kỳ vọng: hiện ngay với ⏳ và chip chờ đồng bộ. Tắt máy bay. Kỳ vọng: ⏳ biến mất trong ≤ 30 giây.
+4. "Xem tất cả các mốc" hiện đủ các tháng 2 đến 24. Mở lại mốc thử → "Bỏ đánh dấu".
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

Run: `grep '^## ' docs/device-checklist.md | tail -1`
Expected: `## Bước 18 — Mốc phát triển (M25)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist step 18 for milestones" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/phat-trien`
Expected: `200`.

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bảng kết quả bước 18 để trống. Trong báo cáo cuối ghi: "Checklist bước 18 chờ người dùng."

---

## Ngoài phạm vi M25

- M26: báo cáo cho bác sĩ (`/bao-cao`), chốt đợt 3.
