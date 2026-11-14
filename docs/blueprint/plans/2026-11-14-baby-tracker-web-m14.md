# Baby Tracker Web — M14 (Lịch tiêm: nội dung, quy tắc, bảng `vaccine_doses`) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Đặt nền cho tính năng tiêm chủng của đợt 2 (spec §6.8, §5, §5.2, §12): lịch tiêm tham khảo 0–24 tháng trong `content/vaccines.vi.json` (kiểm bằng zod), các hàm thuần tính ngày hẹn và chia nhóm trạng thái, và bảng `vaccine_doses` có RLS. Chưa có giao diện; M15 dựng trang `/tiem-chung` trên nền này.

**Architecture:**
- **Nội dung:** `content/vaccines.vi.json` liệt kê từng mũi (58 mũi) và các nhóm lựa chọn (`groups`). `lib/content/vaccineSchema.ts` định nghĩa schema zod; `lib/content/vaccines.ts` import JSON lúc build và `parse` một lần, nên file sai thì test và build đều đỏ.
- **Phục vụ tĩnh (§12):** `scripts/copy-content.ts` chạy trong `prebuild`, chép `content/*.vi.json` sang `public/content/` (gitignore) để có URL `/content/vaccines.vi.json`.
- **Quy tắc:** `lib/rules/vaccines.ts` là hàm thuần: lọc mũi theo `babies.vaccine_choices`, tính ngày hẹn theo đúng công thức §6.8, gán trạng thái Quá hạn / Sắp tới / Đã tiêm / Đã bỏ qua / Sau này.
- **Dữ liệu:** migration `20261114000400_vaccine_doses.sql` tạo bảng, trigger và policy đúng bảng §5.2; pgTAP `006_vaccine_doses.test.sql` khóa lại.

**Tech Stack:** như M1–M13. Không thêm gói nào.

**Milestones của đợt phát hành 2 (spec §11):**
- **M14 (plan này):** nội dung lịch tiêm, quy tắc ngày hẹn, bảng `vaccine_doses`.
- M15: trang `/tiem-chung` (danh sách theo nhóm trạng thái, chọn loại vaccine, đánh dấu Đã tiêm / Bỏ qua / Đổi ngày hẹn), bước chọn vaccine và tick nhanh mũi đã tiêm trong khai báo bé (§6.1). Lập plan sau khi M14 xong.
- M16: `vaccine_doses` đi qua outbox (§9, upsert theo khóa tự nhiên, không gửi `id`), push `vaccine` (§8.3), checklist bước 7 phần nhắc tiêm.
- Sau đó: thông tin khẩn cấp và push `wake`; tăng trưởng WHO; phân loại triệu chứng và bài bệnh thường gặp.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Trường của mỗi mũi:** đúng danh sách §6.8 (`code`, `name`, `protects`, `program`, `group?`, `series?`, `doseNo`, `recommendedAgeDays`, `minAgeDays`, `minIntervalDaysFromPrev?`, `source`, `reviewedAt`), thêm hai trường tùy chọn:
  - `maxAgeDays`: tuổi tối đa nhà sản xuất cho phép (Rotarix 168 ngày, RotaTeq liều 3 là 224 ngày, …). Quy tắc dùng nó để gắn cờ `pastMaxAge`; M15 hiện "Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ".
  - `note`: một câu giải thích ngắn hiện dưới tên mũi.
- **Đầu file:** `title`, `disclaimer` (M15 hiện nguyên văn ở đầu trang), `reviewedAt`, và `groups` (tên nhóm và tên từng series, để M15 vẽ ô chọn). Spec chỉ nêu trường của mũi; các trường này cần cho giao diện.
- **Nguồn nội dung:** Thông tư 52/2025/TT-BYT là văn bản cuối cùng ghi tuổi tiêm của Tiêm chủng mở rộng (TCMR). Thông tư 13/2026/TT-BYT (hiệu lực 01/07/2026) giao lịch TCMR cho hướng dẫn của Cục Phòng bệnh, chưa công bố bản tra cứu được; vì vậy `disclaimer` nói rõ "lịch tham khảo" và "Hỏi cán bộ y tế trước mỗi lần tiêm". Vaccine dịch vụ theo tờ hướng dẫn của nhà sản xuất (EMA, SmPC) và trang VNVC. Mỗi mũi ghi URL nguồn riêng.
- **Nhóm lựa chọn (`group`):** `dtp_combo` (`tcmr_5in1` | `6in1`), `rota` (`rotavin` | `rotarix` | `rotateq`), `pneumo` (`tcmr_pcv` | `synflorix` | `prevenar13` | `vaxneuvance`), `menb` (`bexsero`), `flu` (`flu`), `measles_tcmr` (`tcmr_measles`), `mmr` (`mmr_ii` | `priorix`), `varicella` (`varilrix` | `varivax`), `hepa` (`avaxim`), `je` (`jevax` | `imojev`). Mũi không có `group` (BCG, viêm gan B sơ sinh) luôn hiện.
  - Sởi TCMR và MMR dịch vụ không loại trừ nhau nên là hai nhóm riêng; gia đình chọn "Không tiêm" ở nhóm không dùng.
- **"Không tiêm" (`NOT_TAKING = "none"`):** spec chỉ có "đã chọn series" và "chưa chọn". Nhiều vaccine dịch vụ là tùy chọn, nên thêm giá trị `"none"` cho `vaccine_choices[group]`: ẩn mọi mũi của nhóm, không nhắc. Không cần đổi schema DB (`vaccine_choices` là `jsonb`).
- **Ngày hẹn (§6.8):** `due` = `due_on_override` nếu có; nếu không thì = max(`dob + recommendedAgeDays`, `P + minIntervalDaysFromPrev`). `P` = `given_on` của mũi trước cùng `code` khi mũi trước `done` và có ngày; còn lại (tick nhanh không ngày, chưa tiêm, bỏ qua, đổi ngày) `P` = ngày hẹn đã tính của mũi trước. "Mũi trước cùng series" ở spec ứng với mũi cùng `code`, `doseNo − 1` ở đây: một series có thể gồm nhiều `code` (series `tcmr_5in1` gồm `dpt_vgb_hib`, `opv`, `ipv`), nhưng các mũi nối tiếp nhau luôn cùng `code`.
- **Viêm não Nhật Bản TCMR mũi 3:** Thông tư 52 ghi "cách lần 1 ít nhất 1 năm và cách lần 2 ít nhất 1 tháng". Quy tắc chỉ đo khoảng cách từ mũi liền trước, nên dùng 358 ngày sau mũi 2 (mũi 2 cách mũi 1 ít nhất 7 ngày, nên luôn ≥ 1 năm sau mũi 1) và tuổi khuyến nghị 725 ngày.
- **Lựa chọn lạ:** `vaccine_choices[group]` không khớp series nào trong nội dung (ví dụ nội dung đổi sau này) được coi như chưa chọn, để mũi không biến mất âm thầm.
- **Trạng thái:** `done`/`skipped` theo bản ghi; mũi còn mở thì `due < today` là Quá hạn, `due ≤ today + 30` là Sắp tới, còn lại là Sau này. Danh sách sắp theo `due`, rồi `code`, rồi `doseNo`.
- **Bảng `vaccine_doses`:** đúng cột §5. Thêm ràng buộc để dữ liệu sạch: `vaccine_code` khớp `^[a-z0-9_]{1,40}$`, `dose_no` 1–10, `place` ≤ 120 ký tự, `note` ≤ 500 ký tự, và `status = 'rescheduled'` thì phải có `due_on_override`. `done` không bắt buộc `given_on` (tick nhanh ở §6.1).
- **RLS (§5.2, dòng `vaccine_doses`):** select M; insert M và Mine; update M (mọi thành viên đánh dấu được); delete O hoặc (M và Mine). Có trigger `set_updated_at` và `forbid_immutable_change('id', 'baby_id', 'created_by')` như các bảng khác.
- **Realtime:** §5.3 chỉ đăng ký `logs`, nên `vaccine_doses` không vào publication. M15 tải lại khi mở trang.
- **`db push`:** người dùng đã cho phép trước (2026-11-14) chạy `bunx supabase db push` cho migration chỉ thêm bảng mới đã duyệt; Task 4 chạy lệnh này.
- **Định dạng JSON:** `content/vaccines.vi.json` để mỗi nhóm, mỗi mũi trên một dòng cho dễ đọc khi so lịch. Không chạy prettier trên file này (repo không có bước kiểm định dạng).

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

Riêng M14:

- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `content/vaccines.vi.json` và `STATE_SECTIONS` (`lib/rules/vaccines.ts`) phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`240f0aa`):

- `babies(id, family_id, dob, vaccine_choices jsonb default '{}')` (M1, `20261113000100_schema.sql`)
- Hàm SQL `public.is_member(uuid)`, `public.is_owner(uuid)`, `public.baby_family(uuid)` (M1, `20261113000200_rls.sql`); trigger function `public.set_updated_at()`, `public.forbid_immutable_change()` (M1)
- `addDays(day: string, n: number): string` (`lib/rules/days.ts`)
- Script `prebuild` đang chạy `bun scripts/build-sw.ts` (M9)

**Produces** (M15, M16 dùng):

- `content/vaccines.vi.json`; phục vụ tại `/content/vaccines.vi.json` sau `prebuild`
- `lib/content/vaccineSchema.ts`: `VaccineSeriesSchema`, `VaccineGroupSchema`, `VaccineDoseSchema`, `VaccineContentSchema`, các kiểu `VaccineSeries`, `VaccineGroup`, `VaccineDose`, `VaccineContent`
- `lib/content/vaccines.ts`: `VACCINES: VaccineContent`
- `scripts/copy-content.ts`: `copyContent(fromDir, toDir): string[]`
- `lib/rules/vaccines.ts`: `NOT_TAKING`, `DoseRecord`, `DoseState`, `ScheduleItem`, `UPCOMING_DAYS`, `STATE_SECTIONS`, `visibleDoses(doses, choices)`, `dueDates(doses, dob, records)`, `buildSchedule({ doses, choices, dob, records, today })`
- Bảng `public.vaccine_doses` (local và cloud) với RLS §5.2; `lib/supabase/types.ts` có `vaccine_doses`

## File Structure

```
content/vaccines.vi.json                 # lịch tiêm tham khảo 0–24 tháng
lib/content/vaccineSchema.ts             # schema zod của file nội dung
lib/content/vaccines.ts (+ test)         # nạp và kiểm nội dung
scripts/copy-content.ts (+ test)         # prebuild: content/*.vi.json → public/content/
package.json, .gitignore                 # sửa: prebuild, bỏ qua public/content/
lib/rules/vaccines.ts (+ test)           # lọc theo lựa chọn, ngày hẹn, trạng thái
supabase/migrations/20261114000400_vaccine_doses.sql, supabase/tests/006_vaccine_doses.test.sql
lib/supabase/types.ts                    # sinh lại bằng db:types
```

## Tasks

1. Nội dung lịch tiêm và schema zod
2. Phục vụ nội dung tại `/content/`
3. Quy tắc lịch tiêm
4. Bảng `vaccine_doses`, RLS và đưa lên cloud

---

### Task 1: Nội dung lịch tiêm và schema zod

**Files:**

- Create: `lib/content/vaccineSchema.ts`, `content/vaccines.vi.json`, `lib/content/vaccines.ts`
- Test: `lib/content/vaccines.test.ts`

**Interfaces:**

- Consumes: `zod` 4.6.7 (`z.url()`, `.strict()`)
- Produces: `VaccineDose` và các schema/kiểu khác ở `lib/content/vaccineSchema.ts`; `VACCINES: VaccineContent` ở `lib/content/vaccines.ts`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/content/vaccines.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { VACCINES } from "./vaccines";

const { groups, doses } = VACCINES;

describe("content/vaccines.vi.json (spec §6.8, §10.2)", () => {
  it("every dose carries a source URL and a review date", () => {
    for (const dose of doses) {
      expect(dose.source, dose.code).toMatch(/^https:\/\//);
      expect(dose.reviewedAt, dose.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("each vaccine code numbers its doses 1..n once, with intervals after dose 1", () => {
    const byCode = new Map<string, number[]>();
    for (const dose of doses)
      byCode.set(dose.code, [...(byCode.get(dose.code) ?? []), dose.doseNo]);
    for (const [code, numbers] of byCode)
      expect(numbers, code).toEqual(numbers.map((_, i) => i + 1));
    for (const dose of doses)
      expect(dose.minIntervalDaysFromPrev !== undefined, dose.code).toBe(
        dose.doseNo > 1,
      );
  });

  it("group and series always come together and point at a declared series", () => {
    const series = new Map(
      groups.flatMap((g) =>
        g.series.map((s) => [`${g.code}/${s.code}`, s] as const),
      ),
    );
    for (const dose of doses) {
      expect(dose.group === undefined, dose.code).toBe(
        dose.series === undefined,
      );
      if (dose.group) {
        const declared = series.get(`${dose.group}/${dose.series}`);
        expect(
          declared,
          `${dose.code} ${dose.group}/${dose.series}`,
        ).toBeDefined();
        expect(declared?.program, dose.code).toBe(dose.program);
      }
    }
  });

  it("ages are consistent: min ≤ recommended ≤ max", () => {
    for (const dose of doses) {
      expect(dose.minAgeDays, dose.code).toBeLessThanOrEqual(
        dose.recommendedAgeDays,
      );
      if (dose.maxAgeDays !== undefined)
        expect(dose.recommendedAgeDays, dose.code).toBeLessThanOrEqual(
          dose.maxAgeDays,
        );
    }
  });

  it("covers the TCMR doses due at 2 months", () => {
    const atTwoMonths = doses
      .filter((d) => d.program === "tcmr" && d.recommendedAgeDays === 60)
      .map((d) => `${d.code}#${d.doseNo}`);
    expect(atTwoMonths).toEqual(
      expect.arrayContaining([
        "dpt_vgb_hib#1",
        "opv#1",
        "rotavin#1",
        "pcv_tcmr#1",
      ]),
    );
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/content/vaccines.test.ts`
Expected: FAIL — `Error: Cannot find module './vaccines' imported from …/lib/content/vaccines.test.ts`.

- [ ] **Step 3: Viết schema**

Tạo `lib/content/vaccineSchema.ts`:

```ts
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const VaccineSeriesSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    program: z.enum(["tcmr", "dich_vu"]),
  })
  .strict();

export const VaccineGroupSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    series: z.array(VaccineSeriesSchema).min(1),
  })
  .strict();

// Spec §6.8, plus optional maxAgeDays / note for products with a hard age limit.
export const VaccineDoseSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    doseNo: z.number().int().min(1).max(10),
    name: z.string().min(1),
    protects: z.array(z.string().min(1)).min(1),
    program: z.enum(["tcmr", "dich_vu"]),
    group: z.string().min(1).optional(),
    series: z.string().min(1).optional(),
    recommendedAgeDays: z.number().int().min(0),
    minAgeDays: z.number().int().min(0),
    minIntervalDaysFromPrev: z.number().int().min(1).optional(),
    maxAgeDays: z.number().int().min(0).optional(),
    note: z.string().min(1).optional(),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const VaccineContentSchema = z
  .object({
    title: z.string().min(1),
    disclaimer: z.string().min(1),
    reviewedAt: isoDate,
    groups: z.array(VaccineGroupSchema),
    doses: z.array(VaccineDoseSchema),
  })
  .strict();

export type VaccineSeries = z.infer<typeof VaccineSeriesSchema>;
export type VaccineGroup = z.infer<typeof VaccineGroupSchema>;
export type VaccineDose = z.infer<typeof VaccineDoseSchema>;
export type VaccineContent = z.infer<typeof VaccineContentSchema>;
```

- [ ] **Step 4: Viết file nội dung**

Tạo `content/vaccines.vi.json` đúng từng ký tự như dưới (mỗi nhóm, mỗi mũi một dòng; không chạy prettier trên file này):

```json
{
  "title": "Lịch tiêm chủng tham khảo cho trẻ 0–24 tháng",
  "disclaimer": "Lịch tham khảo theo Thông tư 52/2025/TT-BYT và hướng dẫn của nhà sản xuất. Từ 01/07/2026 lịch Tiêm chủng mở rộng theo hướng dẫn của Cục Phòng bệnh (Thông tư 13/2026/TT-BYT). Hỏi cán bộ y tế trước mỗi lần tiêm.",
  "reviewedAt": "2026-11-14",
  "groups": [
    {"code": "dtp_combo", "name": "Bạch hầu, ho gà, uốn ván, bại liệt, Hib, viêm gan B", "series": [{"code": "tcmr_5in1", "name": "Tiêm chủng mở rộng: 5 trong 1, bại liệt uống và tiêm", "program": "tcmr"}, {"code": "6in1", "name": "6 trong 1 (Hexaxim hoặc Infanrix Hexa)", "program": "dich_vu"}]},
    {"code": "rota", "name": "Tiêu chảy do Rota", "series": [{"code": "rotavin", "name": "Rotavin (Tiêm chủng mở rộng)", "program": "tcmr"}, {"code": "rotarix", "name": "Rotarix", "program": "dich_vu"}, {"code": "rotateq", "name": "RotaTeq", "program": "dich_vu"}]},
    {"code": "pneumo", "name": "Phế cầu", "series": [{"code": "tcmr_pcv", "name": "Phế cầu (Tiêm chủng mở rộng, chỉ ở một số địa phương)", "program": "tcmr"}, {"code": "synflorix", "name": "Synflorix (PCV10)", "program": "dich_vu"}, {"code": "prevenar13", "name": "Prevenar 13", "program": "dich_vu"}, {"code": "vaxneuvance", "name": "Vaxneuvance (PCV15)", "program": "dich_vu"}]},
    {"code": "menb", "name": "Não mô cầu nhóm B", "series": [{"code": "bexsero", "name": "Bexsero", "program": "dich_vu"}]},
    {"code": "flu", "name": "Cúm mùa", "series": [{"code": "flu", "name": "Cúm mùa (từ 6 tháng tuổi)", "program": "dich_vu"}]},
    {"code": "measles_tcmr", "name": "Sởi, Sởi – Rubella (Tiêm chủng mở rộng)", "series": [{"code": "tcmr_measles", "name": "Sởi 9 tháng, Sởi – Rubella 18 tháng", "program": "tcmr"}]},
    {"code": "mmr", "name": "Sởi – Quai bị – Rubella (dịch vụ)", "series": [{"code": "mmr_ii", "name": "MMR II", "program": "dich_vu"}, {"code": "priorix", "name": "Priorix", "program": "dich_vu"}]},
    {"code": "varicella", "name": "Thủy đậu", "series": [{"code": "varilrix", "name": "Varilrix", "program": "dich_vu"}, {"code": "varivax", "name": "Varivax", "program": "dich_vu"}]},
    {"code": "hepa", "name": "Viêm gan A", "series": [{"code": "avaxim", "name": "Avaxim 80U", "program": "dich_vu"}]},
    {"code": "je", "name": "Viêm não Nhật Bản", "series": [{"code": "jevax", "name": "Viêm não Nhật Bản (Tiêm chủng mở rộng)", "program": "tcmr"}, {"code": "imojev", "name": "Imojev", "program": "dich_vu"}]}
  ],
  "doses": [
    {"code": "bcg", "doseNo": 1, "name": "Vắc xin lao (BCG)", "protects": ["Lao"], "program": "tcmr", "recommendedAgeDays": 0, "minAgeDays": 0, "maxAgeDays": 360, "note": "Tiêm trong tháng đầu sau sinh; nếu lỡ, tiêm bù trước 12 tháng tuổi.", "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "hepb_birth", "doseNo": 1, "name": "Viêm gan B liều sơ sinh", "protects": ["Viêm gan B"], "program": "tcmr", "recommendedAgeDays": 0, "minAgeDays": 0, "maxAgeDays": 28, "note": "Tiêm trong 24 giờ đầu; nếu lỡ, tiêm càng sớm càng tốt trong 28 ngày.", "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "dpt_vgb_hib", "doseNo": 1, "name": "DPT-VGB-Hib (5 trong 1) mũi 1", "protects": ["Bạch hầu", "Ho gà", "Uốn ván", "Viêm gan B", "Hib"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 60, "minAgeDays": 60, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "dpt_vgb_hib", "doseNo": 2, "name": "DPT-VGB-Hib (5 trong 1) mũi 2", "protects": ["Bạch hầu", "Ho gà", "Uốn ván", "Viêm gan B", "Hib"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 90, "minAgeDays": 88, "minIntervalDaysFromPrev": 28, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "dpt_vgb_hib", "doseNo": 3, "name": "DPT-VGB-Hib (5 trong 1) mũi 3", "protects": ["Bạch hầu", "Ho gà", "Uốn ván", "Viêm gan B", "Hib"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 120, "minAgeDays": 116, "minIntervalDaysFromPrev": 28, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "dpt_vgb_hib", "doseNo": 4, "name": "DPT nhắc lại (18 tháng)", "protects": ["Bạch hầu", "Ho gà", "Uốn ván"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 540, "minAgeDays": 540, "minIntervalDaysFromPrev": 180, "note": "Mũi nhắc phòng bạch hầu, ho gà, uốn ván.", "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "opv", "doseNo": 1, "name": "Uống bại liệt (OPV) lần 1", "protects": ["Bại liệt"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 60, "minAgeDays": 60, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "opv", "doseNo": 2, "name": "Uống bại liệt (OPV) lần 2", "protects": ["Bại liệt"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 90, "minAgeDays": 88, "minIntervalDaysFromPrev": 28, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "opv", "doseNo": 3, "name": "Uống bại liệt (OPV) lần 3", "protects": ["Bại liệt"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 120, "minAgeDays": 116, "minIntervalDaysFromPrev": 28, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "ipv", "doseNo": 1, "name": "Tiêm bại liệt (IPV) mũi 1", "protects": ["Bại liệt"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 150, "minAgeDays": 150, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "ipv", "doseNo": 2, "name": "Tiêm bại liệt (IPV) mũi 2", "protects": ["Bại liệt"], "program": "tcmr", "group": "dtp_combo", "series": "tcmr_5in1", "recommendedAgeDays": 270, "minAgeDays": 270, "minIntervalDaysFromPrev": 28, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "hexa", "doseNo": 1, "name": "6 trong 1 mũi 1", "protects": ["Bạch hầu", "Ho gà", "Uốn ván", "Bại liệt", "Viêm gan B", "Hib"], "program": "dich_vu", "group": "dtp_combo", "series": "6in1", "recommendedAgeDays": 60, "minAgeDays": 42, "source": "https://vnvc.vn/vac-xin-6-trong-1-tiem-may-mui/", "reviewedAt": "2026-11-14"},
    {"code": "hexa", "doseNo": 2, "name": "6 trong 1 mũi 2", "protects": ["Bạch hầu", "Ho gà", "Uốn ván", "Bại liệt", "Viêm gan B", "Hib"], "program": "dich_vu", "group": "dtp_combo", "series": "6in1", "recommendedAgeDays": 90, "minAgeDays": 70, "minIntervalDaysFromPrev": 28, "source": "https://vnvc.vn/vac-xin-6-trong-1-tiem-may-mui/", "reviewedAt": "2026-11-14"},
    {"code": "hexa", "doseNo": 3, "name": "6 trong 1 mũi 3", "protects": ["Bạch hầu", "Ho gà", "Uốn ván", "Bại liệt", "Viêm gan B", "Hib"], "program": "dich_vu", "group": "dtp_combo", "series": "6in1", "recommendedAgeDays": 120, "minAgeDays": 98, "minIntervalDaysFromPrev": 28, "source": "https://vnvc.vn/vac-xin-6-trong-1-tiem-may-mui/", "reviewedAt": "2026-11-14"},
    {"code": "hexa", "doseNo": 4, "name": "6 trong 1 mũi 4 (nhắc)", "protects": ["Bạch hầu", "Ho gà", "Uốn ván", "Bại liệt", "Viêm gan B", "Hib"], "program": "dich_vu", "group": "dtp_combo", "series": "6in1", "recommendedAgeDays": 450, "minAgeDays": 278, "minIntervalDaysFromPrev": 180, "note": "Nên tiêm nhắc trước 18 tháng tuổi.", "source": "https://vnvc.vn/vac-xin-6-trong-1-tiem-may-mui/", "reviewedAt": "2026-11-14"},
    {"code": "rotavin", "doseNo": 1, "name": "Rotavin (uống) lần 1", "protects": ["Tiêu chảy do Rota"], "program": "tcmr", "group": "rota", "series": "rotavin", "recommendedAgeDays": 60, "minAgeDays": 60, "maxAgeDays": 179, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "rotavin", "doseNo": 2, "name": "Rotavin (uống) lần 2", "protects": ["Tiêu chảy do Rota"], "program": "tcmr", "group": "rota", "series": "rotavin", "recommendedAgeDays": 90, "minAgeDays": 88, "minIntervalDaysFromPrev": 28, "maxAgeDays": 179, "note": "Phải uống xong trước 6 tháng tuổi.", "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "rotarix", "doseNo": 1, "name": "Rotarix (uống) lần 1", "protects": ["Tiêu chảy do Rota"], "program": "dich_vu", "group": "rota", "series": "rotarix", "recommendedAgeDays": 60, "minAgeDays": 42, "maxAgeDays": 168, "source": "https://www.ema.europa.eu/en/documents/product-information/rotarix-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "rotarix", "doseNo": 2, "name": "Rotarix (uống) lần 2", "protects": ["Tiêu chảy do Rota"], "program": "dich_vu", "group": "rota", "series": "rotarix", "recommendedAgeDays": 90, "minAgeDays": 70, "minIntervalDaysFromPrev": 28, "maxAgeDays": 168, "note": "Phải uống xong trước 24 tuần tuổi.", "source": "https://www.ema.europa.eu/en/documents/product-information/rotarix-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "rotateq", "doseNo": 1, "name": "RotaTeq (uống) lần 1", "protects": ["Tiêu chảy do Rota"], "program": "dich_vu", "group": "rota", "series": "rotateq", "recommendedAgeDays": 60, "minAgeDays": 42, "maxAgeDays": 84, "note": "Lần 1 không muộn hơn 12 tuần tuổi.", "source": "https://www.ema.europa.eu/en/documents/product-information/rotateq-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "rotateq", "doseNo": 2, "name": "RotaTeq (uống) lần 2", "protects": ["Tiêu chảy do Rota"], "program": "dich_vu", "group": "rota", "series": "rotateq", "recommendedAgeDays": 90, "minAgeDays": 70, "minIntervalDaysFromPrev": 28, "source": "https://www.ema.europa.eu/en/documents/product-information/rotateq-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "rotateq", "doseNo": 3, "name": "RotaTeq (uống) lần 3", "protects": ["Tiêu chảy do Rota"], "program": "dich_vu", "group": "rota", "series": "rotateq", "recommendedAgeDays": 120, "minAgeDays": 98, "minIntervalDaysFromPrev": 28, "maxAgeDays": 224, "note": "Phải uống xong trước 32 tuần tuổi.", "source": "https://www.ema.europa.eu/en/documents/product-information/rotateq-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "pcv_tcmr", "doseNo": 1, "name": "Phế cầu (Tiêm chủng mở rộng) mũi 1", "protects": ["Bệnh do phế cầu"], "program": "tcmr", "group": "pneumo", "series": "tcmr_pcv", "recommendedAgeDays": 60, "minAgeDays": 60, "note": "Chỉ triển khai ở một số địa phương; hỏi trạm y tế xã.", "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "pcv_tcmr", "doseNo": 2, "name": "Phế cầu (Tiêm chủng mở rộng) mũi 2", "protects": ["Bệnh do phế cầu"], "program": "tcmr", "group": "pneumo", "series": "tcmr_pcv", "recommendedAgeDays": 120, "minAgeDays": 116, "minIntervalDaysFromPrev": 56, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "synflorix", "doseNo": 1, "name": "Synflorix mũi 1", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "synflorix", "recommendedAgeDays": 60, "minAgeDays": 42, "source": "https://www.ema.europa.eu/en/documents/product-information/synflorix-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "synflorix", "doseNo": 2, "name": "Synflorix mũi 2", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "synflorix", "recommendedAgeDays": 90, "minAgeDays": 70, "minIntervalDaysFromPrev": 28, "source": "https://www.ema.europa.eu/en/documents/product-information/synflorix-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "synflorix", "doseNo": 3, "name": "Synflorix mũi 3", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "synflorix", "recommendedAgeDays": 120, "minAgeDays": 98, "minIntervalDaysFromPrev": 28, "source": "https://www.ema.europa.eu/en/documents/product-information/synflorix-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "synflorix", "doseNo": 4, "name": "Synflorix mũi 4 (nhắc)", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "synflorix", "recommendedAgeDays": 360, "minAgeDays": 278, "minIntervalDaysFromPrev": 180, "source": "https://www.ema.europa.eu/en/documents/product-information/synflorix-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "prevenar13", "doseNo": 1, "name": "Prevenar 13 mũi 1", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "prevenar13", "recommendedAgeDays": 60, "minAgeDays": 42, "source": "https://www.medicines.org.uk/emc/product/453/smpc", "reviewedAt": "2026-11-14"},
    {"code": "prevenar13", "doseNo": 2, "name": "Prevenar 13 mũi 2", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "prevenar13", "recommendedAgeDays": 90, "minAgeDays": 70, "minIntervalDaysFromPrev": 28, "source": "https://www.medicines.org.uk/emc/product/453/smpc", "reviewedAt": "2026-11-14"},
    {"code": "prevenar13", "doseNo": 3, "name": "Prevenar 13 mũi 3", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "prevenar13", "recommendedAgeDays": 120, "minAgeDays": 98, "minIntervalDaysFromPrev": 28, "source": "https://www.medicines.org.uk/emc/product/453/smpc", "reviewedAt": "2026-11-14"},
    {"code": "prevenar13", "doseNo": 4, "name": "Prevenar 13 mũi 4 (nhắc)", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "prevenar13", "recommendedAgeDays": 360, "minAgeDays": 330, "minIntervalDaysFromPrev": 56, "source": "https://www.medicines.org.uk/emc/product/453/smpc", "reviewedAt": "2026-11-14"},
    {"code": "vaxneuvance", "doseNo": 1, "name": "Vaxneuvance mũi 1", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "vaxneuvance", "recommendedAgeDays": 60, "minAgeDays": 42, "source": "https://www.ema.europa.eu/en/documents/product-information/vaxneuvance-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "vaxneuvance", "doseNo": 2, "name": "Vaxneuvance mũi 2", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "vaxneuvance", "recommendedAgeDays": 90, "minAgeDays": 70, "minIntervalDaysFromPrev": 28, "source": "https://www.ema.europa.eu/en/documents/product-information/vaxneuvance-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "vaxneuvance", "doseNo": 3, "name": "Vaxneuvance mũi 3", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "vaxneuvance", "recommendedAgeDays": 120, "minAgeDays": 98, "minIntervalDaysFromPrev": 28, "source": "https://www.ema.europa.eu/en/documents/product-information/vaxneuvance-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "vaxneuvance", "doseNo": 4, "name": "Vaxneuvance mũi 4 (nhắc)", "protects": ["Bệnh do phế cầu"], "program": "dich_vu", "group": "pneumo", "series": "vaxneuvance", "recommendedAgeDays": 360, "minAgeDays": 330, "minIntervalDaysFromPrev": 56, "source": "https://www.ema.europa.eu/en/documents/product-information/vaxneuvance-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "bexsero", "doseNo": 1, "name": "Bexsero mũi 1", "protects": ["Não mô cầu nhóm B"], "program": "dich_vu", "group": "menb", "series": "bexsero", "recommendedAgeDays": 60, "minAgeDays": 56, "source": "https://www.ema.europa.eu/en/documents/product-information/bexsero-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "bexsero", "doseNo": 2, "name": "Bexsero mũi 2", "protects": ["Não mô cầu nhóm B"], "program": "dich_vu", "group": "menb", "series": "bexsero", "recommendedAgeDays": 120, "minAgeDays": 112, "minIntervalDaysFromPrev": 56, "source": "https://www.ema.europa.eu/en/documents/product-information/bexsero-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "bexsero", "doseNo": 3, "name": "Bexsero mũi 3 (nhắc)", "protects": ["Não mô cầu nhóm B"], "program": "dich_vu", "group": "menb", "series": "bexsero", "recommendedAgeDays": 360, "minAgeDays": 360, "minIntervalDaysFromPrev": 180, "maxAgeDays": 720, "note": "Mũi nhắc không muộn hơn 24 tháng tuổi.", "source": "https://www.ema.europa.eu/en/documents/product-information/bexsero-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "flu", "doseNo": 1, "name": "Cúm mùa mũi 1", "protects": ["Cúm"], "program": "dich_vu", "group": "flu", "series": "flu", "recommendedAgeDays": 180, "minAgeDays": 180, "source": "https://cdn.who.int/media/docs/default-source/immunization/immunization_schedules/immunization-summary-table-2.pdf", "reviewedAt": "2026-11-14"},
    {"code": "flu", "doseNo": 2, "name": "Cúm mùa mũi 2", "protects": ["Cúm"], "program": "dich_vu", "group": "flu", "series": "flu", "recommendedAgeDays": 210, "minAgeDays": 208, "minIntervalDaysFromPrev": 28, "note": "Sau đó tiêm nhắc mỗi năm một lần.", "source": "https://cdn.who.int/media/docs/default-source/immunization/immunization_schedules/immunization-summary-table-2.pdf", "reviewedAt": "2026-11-14"},
    {"code": "tcmr_measles", "doseNo": 1, "name": "Sởi (9 tháng)", "protects": ["Sởi"], "program": "tcmr", "group": "measles_tcmr", "series": "tcmr_measles", "recommendedAgeDays": 270, "minAgeDays": 270, "note": "Phòng sởi.", "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "tcmr_measles", "doseNo": 2, "name": "Sởi – Rubella (MR, 18 tháng)", "protects": ["Sởi", "Rubella"], "program": "tcmr", "group": "measles_tcmr", "series": "tcmr_measles", "recommendedAgeDays": 540, "minAgeDays": 540, "minIntervalDaysFromPrev": 28, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "mmr_ii", "doseNo": 1, "name": "MMR II mũi 1", "protects": ["Sởi", "Quai bị", "Rubella"], "program": "dich_vu", "group": "mmr", "series": "mmr_ii", "recommendedAgeDays": 360, "minAgeDays": 360, "source": "https://www.ema.europa.eu/en/documents/product-information/m-m-rvaxpro-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "mmr_ii", "doseNo": 2, "name": "MMR II mũi 2", "protects": ["Sởi", "Quai bị", "Rubella"], "program": "dich_vu", "group": "mmr", "series": "mmr_ii", "recommendedAgeDays": 450, "minAgeDays": 388, "minIntervalDaysFromPrev": 28, "source": "https://www.ema.europa.eu/en/documents/product-information/m-m-rvaxpro-epar-product-information_en.pdf", "reviewedAt": "2026-11-14"},
    {"code": "priorix", "doseNo": 1, "name": "Priorix mũi 1", "protects": ["Sởi", "Quai bị", "Rubella"], "program": "dich_vu", "group": "mmr", "series": "priorix", "recommendedAgeDays": 270, "minAgeDays": 270, "source": "https://vnvc.vn/lich-tiem-chung-day-du-nhat-cho-tre-theo-tung-thang-tuoi/", "reviewedAt": "2026-11-14"},
    {"code": "priorix", "doseNo": 2, "name": "Priorix mũi 2", "protects": ["Sởi", "Quai bị", "Rubella"], "program": "dich_vu", "group": "mmr", "series": "priorix", "recommendedAgeDays": 360, "minAgeDays": 298, "minIntervalDaysFromPrev": 28, "source": "https://vnvc.vn/lich-tiem-chung-day-du-nhat-cho-tre-theo-tung-thang-tuoi/", "reviewedAt": "2026-11-14"},
    {"code": "varilrix", "doseNo": 1, "name": "Varilrix mũi 1", "protects": ["Thủy đậu"], "program": "dich_vu", "group": "varicella", "series": "varilrix", "recommendedAgeDays": 270, "minAgeDays": 270, "source": "https://vnvc.vn/mui-tiem-khong-co-trong-tiem-chung-mo-rong/", "reviewedAt": "2026-11-14"},
    {"code": "varilrix", "doseNo": 2, "name": "Varilrix mũi 2", "protects": ["Thủy đậu"], "program": "dich_vu", "group": "varicella", "series": "varilrix", "recommendedAgeDays": 360, "minAgeDays": 360, "minIntervalDaysFromPrev": 90, "source": "https://vnvc.vn/mui-tiem-khong-co-trong-tiem-chung-mo-rong/", "reviewedAt": "2026-11-14"},
    {"code": "varivax", "doseNo": 1, "name": "Varivax mũi 1", "protects": ["Thủy đậu"], "program": "dich_vu", "group": "varicella", "series": "varivax", "recommendedAgeDays": 360, "minAgeDays": 360, "source": "https://vnvc.vn/mui-tiem-khong-co-trong-tiem-chung-mo-rong/", "reviewedAt": "2026-11-14"},
    {"code": "varivax", "doseNo": 2, "name": "Varivax mũi 2", "protects": ["Thủy đậu"], "program": "dich_vu", "group": "varicella", "series": "varivax", "recommendedAgeDays": 450, "minAgeDays": 450, "minIntervalDaysFromPrev": 90, "source": "https://vnvc.vn/mui-tiem-khong-co-trong-tiem-chung-mo-rong/", "reviewedAt": "2026-11-14"},
    {"code": "avaxim", "doseNo": 1, "name": "Viêm gan A (Avaxim 80U) mũi 1", "protects": ["Viêm gan A"], "program": "dich_vu", "group": "hepa", "series": "avaxim", "recommendedAgeDays": 360, "minAgeDays": 360, "source": "https://vnvc.vn/mui-tiem-khong-co-trong-tiem-chung-mo-rong/", "reviewedAt": "2026-11-14"},
    {"code": "avaxim", "doseNo": 2, "name": "Viêm gan A (Avaxim 80U) mũi 2", "protects": ["Viêm gan A"], "program": "dich_vu", "group": "hepa", "series": "avaxim", "recommendedAgeDays": 540, "minAgeDays": 540, "minIntervalDaysFromPrev": 180, "source": "https://vnvc.vn/mui-tiem-khong-co-trong-tiem-chung-mo-rong/", "reviewedAt": "2026-11-14"},
    {"code": "jevax", "doseNo": 1, "name": "Viêm não Nhật Bản mũi 1", "protects": ["Viêm não Nhật Bản"], "program": "tcmr", "group": "je", "series": "jevax", "recommendedAgeDays": 360, "minAgeDays": 360, "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "jevax", "doseNo": 2, "name": "Viêm não Nhật Bản mũi 2", "protects": ["Viêm não Nhật Bản"], "program": "tcmr", "group": "je", "series": "jevax", "recommendedAgeDays": 367, "minAgeDays": 367, "minIntervalDaysFromPrev": 7, "note": "Cách mũi 1 từ 1 đến 2 tuần.", "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "jevax", "doseNo": 3, "name": "Viêm não Nhật Bản mũi 3", "protects": ["Viêm não Nhật Bản"], "program": "tcmr", "group": "je", "series": "jevax", "recommendedAgeDays": 725, "minAgeDays": 725, "minIntervalDaysFromPrev": 358, "note": "Cách mũi 1 ít nhất 1 năm và cách mũi 2 ít nhất 1 tháng.", "source": "https://ketoananpha.vn/uploads/files/Van-ban-luat/The-thao-Y-te/Thong-tu-52_2025_TT-BYT.docx", "reviewedAt": "2026-11-14"},
    {"code": "imojev", "doseNo": 1, "name": "Imojev mũi 1", "protects": ["Viêm não Nhật Bản"], "program": "dich_vu", "group": "je", "series": "imojev", "recommendedAgeDays": 270, "minAgeDays": 270, "source": "https://sanofi.com/assets/countries/singapore/docs/143-Imojev-SD-PI-SG-IMOSD-0517-CCDSV10.pdf", "reviewedAt": "2026-11-14"},
    {"code": "imojev", "doseNo": 2, "name": "Imojev mũi 2", "protects": ["Viêm não Nhật Bản"], "program": "dich_vu", "group": "je", "series": "imojev", "recommendedAgeDays": 630, "minAgeDays": 630, "minIntervalDaysFromPrev": 360, "source": "https://sanofi.com/assets/countries/singapore/docs/143-Imojev-SD-PI-SG-IMOSD-0517-CCDSV10.pdf", "reviewedAt": "2026-11-14"}
  ]
}
```

- [ ] **Step 5: Viết phần nạp nội dung**

Tạo `lib/content/vaccines.ts`:

```ts
import data from "@/content/vaccines.vi.json";
import { VaccineContentSchema, type VaccineContent } from "./vaccineSchema";

// Parsed once at import: a malformed content file fails loudly in tests and builds.
export const VACCINES: VaccineContent = VaccineContentSchema.parse(data);
```

- [ ] **Step 6: Chạy test để thấy đạt**

Run: `bunx vitest run lib/content/vaccines.test.ts && bun run typecheck`
Expected: PASS — `Tests  5 passed (5)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 7: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m14.md content/vaccines.vi.json lib/content && git commit -m "feat(vaccines): reference schedule content with zod checks"
```

---

### Task 2: Phục vụ nội dung tại `/content/`

**Files:**

- Create: `scripts/copy-content.ts`
- Modify: `package.json` (script `prebuild`), `.gitignore`
- Test: `scripts/copy-content.test.ts`

**Interfaces:**

- Consumes: `content/vaccines.vi.json` (Task 1)
- Produces: `copyContent(fromDir: string, toDir: string): string[]` (trả tên các file đã chép); `bun run prebuild` tạo `public/content/vaccines.vi.json`

- [ ] **Step 1: Viết test thất bại**

Tạo `scripts/copy-content.test.ts`:

```ts
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copyContent } from "./copy-content";

describe("copyContent", () => {
  it("copies only *.vi.json files into a fresh folder", () => {
    const from = mkdtempSync(join(tmpdir(), "content-"));
    const to = join(mkdtempSync(join(tmpdir(), "public-")), "content");
    writeFileSync(join(from, "vaccines.vi.json"), '{"a":1}');
    writeFileSync(join(from, "notes.md"), "skip me");
    expect(copyContent(from, to)).toEqual(["vaccines.vi.json"]);
    expect(readdirSync(to)).toEqual(["vaccines.vi.json"]);
    expect(readFileSync(join(to, "vaccines.vi.json"), "utf8")).toBe('{"a":1}');
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run scripts/copy-content.test.ts`
Expected: FAIL — `Error: Cannot find module './copy-content' imported from …/scripts/copy-content.test.ts`.

- [ ] **Step 3: Viết script**

Tạo `scripts/copy-content.ts`:

```ts
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Spec §12: content/*.vi.json is served at /content/<name>.vi.json (the iOS unit reads it there).
export function copyContent(fromDir: string, toDir: string): string[] {
  mkdirSync(toDir, { recursive: true });
  const files = readdirSync(fromDir).filter((name) =>
    name.endsWith(".vi.json"),
  );
  for (const name of files)
    copyFileSync(join(fromDir, name), join(toDir, name));
  return files;
}

if (process.argv[1]?.endsWith("copy-content.ts")) {
  const files = copyContent("content", "public/content");
  console.log(`public/content: ${files.join(", ")}`);
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bunx vitest run scripts/copy-content.test.ts`
Expected: PASS — `Tests  1 passed (1)`.

- [ ] **Step 5: Gắn vào `prebuild` và bỏ qua thư mục sinh ra**

`package.json`:

```diff
-    "prebuild": "bun scripts/build-sw.ts",
+    "prebuild": "bun scripts/build-sw.ts && bun scripts/copy-content.ts",
```

`.gitignore` (thêm dòng cuối):

```diff
 node_modules/
 .next/
 next-env.d.ts
 *.tsbuildinfo
 .env*.local
 .vercel/
 supabase/.branches/
 supabase/.temp/
 .idea/
 public/sw.js
+public/content/
```

- [ ] **Step 6: Chạy prebuild**

Run: `bun run prebuild && git status --short`
Expected: dòng cuối của prebuild là `public/content: vaccines.vi.json`; `git status --short` chỉ liệt kê `package.json`, `.gitignore`, `scripts/copy-content.ts`, `scripts/copy-content.test.ts` (không có `public/content/`).

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore scripts/copy-content.ts scripts/copy-content.test.ts && git commit -m "build: copy content JSON to public/content in prebuild"
```

---

### Task 3: Quy tắc lịch tiêm

**Files:**

- Create: `lib/rules/vaccines.ts`
- Test: `lib/rules/vaccines.test.ts`

**Interfaces:**

- Consumes: `VaccineDose` (Task 1); `addDays` (`lib/rules/days.ts`)
- Produces:
  - `NOT_TAKING = "none"`; `UPCOMING_DAYS = 30`
  - `type DoseRecord = { vaccine_code: string; dose_no: number; status: "done" | "skipped" | "rescheduled"; given_on: string | null; due_on_override: string | null }` (đúng tên cột `vaccine_doses`; kiểu sinh ra cho cột `status` là `string`, nên M15 phải thu hẹp `status` trước khi truyền dòng đọc từ Supabase)
  - `type DoseState = "overdue" | "upcoming" | "done" | "skipped" | "later"`
  - `type ScheduleItem = { dose; due: string; state; record: DoseRecord | null; unchosen: boolean; pastMaxAge: boolean }`
  - `STATE_SECTIONS: { state: DoseState; title: string }[]` theo thứ tự hiển thị
  - `visibleDoses(doses, choices): { dose, unchosen }[]`, `dueDates(doses, dob, records): Map<"code#doseNo", "YYYY-MM-DD">`, `buildSchedule({ doses, choices, dob, records, today }): ScheduleItem[]`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/vaccines.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import {
  buildSchedule,
  dueDates,
  NOT_TAKING,
  visibleDoses,
  type DoseRecord,
} from "./vaccines";

const base = {
  protects: ["X"],
  source: "https://example.org",
  reviewedAt: "2026-11-14",
};
const dose = (
  code: string,
  doseNo: number,
  rec: number,
  extra: Partial<VaccineDose> = {},
): VaccineDose => ({
  ...base,
  code,
  doseNo,
  name: `${code} ${doseNo}`,
  program: "tcmr",
  recommendedAgeDays: rec,
  minAgeDays: rec,
  ...(doseNo > 1 ? { minIntervalDaysFromPrev: 28 } : {}),
  ...extra,
});

const six = { group: "dtp_combo", series: "6in1", program: "dich_vu" as const };
const five = { group: "dtp_combo", series: "tcmr_5in1" };
const doses: VaccineDose[] = [
  dose("bcg", 1, 0),
  dose("hexa", 1, 60, six),
  dose("hexa", 2, 90, six),
  dose("dpt", 1, 60, five),
];
const record = (
  code: string,
  doseNo: number,
  extra: Partial<DoseRecord>,
): DoseRecord => ({
  vaccine_code: code,
  dose_no: doseNo,
  status: "done",
  given_on: null,
  due_on_override: null,
  ...extra,
});

describe("visibleDoses", () => {
  it("shows every series of an unchosen or unknown choice, only the chosen series otherwise, nothing for 'none'", () => {
    const codes = (choices: Record<string, string>) =>
      visibleDoses(doses, choices).map(
        (v) => `${v.dose.code}${v.unchosen ? "?" : ""}`,
      );
    expect(codes({})).toEqual(["bcg", "hexa?", "hexa?", "dpt?"]);
    expect(codes({ dtp_combo: "6in1" })).toEqual(["bcg", "hexa", "hexa"]);
    expect(codes({ dtp_combo: NOT_TAKING })).toEqual(["bcg"]);
    expect(codes({ dtp_combo: "retired_series" })).toEqual([
      "bcg",
      "hexa?",
      "hexa?",
      "dpt?",
    ]);
  });
});

describe("dueDates (spec §6.8)", () => {
  const dob = "2026-09-14";
  const hexa = doses.filter((d) => d.code === "hexa");

  it("uses dob + recommended age when nothing is recorded", () => {
    const due = dueDates(hexa, dob, []);
    expect(due.get("hexa#1")).toBe("2026-11-13");
    expect(due.get("hexa#2")).toBe("2026-12-13");
  });

  it("pushes a dose back to keep the minimum interval after a late previous dose", () => {
    const due = dueDates(hexa, dob, [
      record("hexa", 1, { given_on: "2026-12-01" }),
    ]);
    expect(due.get("hexa#2")).toBe("2026-12-29");
  });

  it("anchors on the previous due date when it was ticked done without a date", () => {
    const due = dueDates(hexa, dob, [record("hexa", 1, { given_on: null })]);
    expect(due.get("hexa#2")).toBe("2026-12-13");
  });

  it("anchors on the previous due date when the previous dose is still open", () => {
    const due = dueDates(hexa, dob, [
      record("hexa", 1, {
        status: "rescheduled",
        due_on_override: "2026-12-10",
      }),
    ]);
    expect(due.get("hexa#1")).toBe("2026-12-10");
    expect(due.get("hexa#2")).toBe("2027-01-07");
  });

  it("an override wins over everything", () => {
    const due = dueDates(hexa, dob, [
      record("hexa", 2, {
        status: "rescheduled",
        due_on_override: "2026-12-20",
      }),
    ]);
    expect(due.get("hexa#2")).toBe("2026-12-20");
  });
});

describe("buildSchedule", () => {
  it("sorts by due date and assigns overdue / upcoming / done / skipped / later", () => {
    const items = buildSchedule({
      doses: [...doses, dose("late", 1, 300), dose("skip", 1, 10)],
      choices: { dtp_combo: "6in1" },
      dob: "2026-09-14",
      records: [
        record("bcg", 1, { given_on: "2026-09-14" }),
        record("skip", 1, { status: "skipped" }),
      ],
      today: "2026-11-20",
    });
    expect(
      items.map((i) => `${i.dose.code}#${i.dose.doseNo}:${i.state}`),
    ).toEqual([
      "bcg#1:done",
      "skip#1:skipped",
      "hexa#1:overdue",
      "hexa#2:upcoming",
      "late#1:later",
    ]);
  });

  it("flags an open dose whose due date is past the product's age limit", () => {
    const rotarix = [
      dose("rotarix", 1, 60, { maxAgeDays: 168 }),
      dose("rotarix", 2, 90, { maxAgeDays: 168 }),
    ];
    const items = buildSchedule({
      doses: rotarix,
      choices: {},
      dob: "2026-05-01",
      records: [record("rotarix", 1, { given_on: "2026-10-10" })],
      today: "2026-11-14",
    });
    expect(items.map((i) => [i.state, i.pastMaxAge])).toEqual([
      ["done", false],
      ["overdue", true],
    ]);
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/vaccines.test.ts`
Expected: FAIL — `Error: Cannot find module './vaccines' imported from …/lib/rules/vaccines.test.ts`.

- [ ] **Step 3: Viết quy tắc**

Tạo `lib/rules/vaccines.ts`:

```ts
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import { addDays } from "./days";

// vaccine_choices[group] = series code, or NOT_TAKING when the family skips that group.
export const NOT_TAKING = "none";

export type DoseRecord = {
  vaccine_code: string;
  dose_no: number;
  status: "done" | "skipped" | "rescheduled";
  given_on: string | null;
  due_on_override: string | null;
};

export type DoseState = "overdue" | "upcoming" | "done" | "skipped" | "later";

export type ScheduleItem = {
  dose: VaccineDose;
  due: string;
  state: DoseState;
  record: DoseRecord | null;
  // Group has no chosen series yet: listed with "Chưa chọn loại", never reminded.
  unchosen: boolean;
  // Still open after the product's age limit (e.g. rotavirus): ask a doctor.
  pastMaxAge: boolean;
};

export const UPCOMING_DAYS = 30;

export const STATE_SECTIONS: { state: DoseState; title: string }[] = [
  { state: "overdue", title: "Quá hạn" },
  { state: "upcoming", title: "Sắp tới (≤ 30 ngày)" },
  { state: "done", title: "Đã tiêm" },
  { state: "skipped", title: "Đã bỏ qua" },
  { state: "later", title: "Sau này" },
];

export function visibleDoses(
  doses: VaccineDose[],
  choices: Record<string, string>,
): { dose: VaccineDose; unchosen: boolean }[] {
  const known = new Set(doses.map((d) => `${d.group}/${d.series}`));
  return doses.flatMap((dose): { dose: VaccineDose; unchosen: boolean }[] => {
    if (!dose.group) return [{ dose, unchosen: false }];
    const chosen = choices[dose.group];
    // A stored choice that names no known series (old content) counts as unchosen.
    if (
      chosen === undefined ||
      (chosen !== NOT_TAKING && !known.has(`${dose.group}/${chosen}`))
    )
      return [{ dose, unchosen: true }];
    return chosen === dose.series ? [{ dose, unchosen: false }] : [];
  });
}

const key = (code: string, doseNo: number) => `${code}#${doseNo}`;
const later = (a: string, b: string) => (a > b ? a : b);

// Spec §6.8: due = override, else max(dob + recommended age, P + min interval),
// where P is the previous dose's given_on when it was given on a known day,
// otherwise the previous dose's own due date.
export function dueDates(
  doses: VaccineDose[],
  dob: string,
  records: DoseRecord[],
): Map<string, string> {
  const byKey = new Map(
    records.map((r) => [key(r.vaccine_code, r.dose_no), r]),
  );
  const sorted = [...doses].sort(
    (a, b) => a.code.localeCompare(b.code) || a.doseNo - b.doseNo,
  );
  const due = new Map<string, string>();
  for (const dose of sorted) {
    const record = byKey.get(key(dose.code, dose.doseNo));
    if (record?.due_on_override) {
      due.set(key(dose.code, dose.doseNo), record.due_on_override);
      continue;
    }
    let date = addDays(dob, dose.recommendedAgeDays);
    const prevKey = key(dose.code, dose.doseNo - 1);
    const prevDue = due.get(prevKey);
    if (dose.minIntervalDaysFromPrev !== undefined && prevDue !== undefined) {
      const prev = byKey.get(prevKey);
      const anchor =
        prev?.status === "done" && prev.given_on ? prev.given_on : prevDue;
      date = later(date, addDays(anchor, dose.minIntervalDaysFromPrev));
    }
    due.set(key(dose.code, dose.doseNo), date);
  }
  return due;
}

export function buildSchedule(input: {
  doses: VaccineDose[];
  choices: Record<string, string>;
  dob: string;
  records: DoseRecord[];
  today: string;
}): ScheduleItem[] {
  const { doses, choices, dob, records, today } = input;
  const visible = visibleDoses(doses, choices);
  const due = dueDates(
    visible.map((v) => v.dose),
    dob,
    records,
  );
  const byKey = new Map(
    records.map((r) => [key(r.vaccine_code, r.dose_no), r]),
  );
  const soon = addDays(today, UPCOMING_DAYS);
  return visible
    .map(({ dose, unchosen }) => {
      const record = byKey.get(key(dose.code, dose.doseNo)) ?? null;
      const date = due.get(key(dose.code, dose.doseNo)) as string;
      const state: DoseState =
        record?.status === "done"
          ? "done"
          : record?.status === "skipped"
            ? "skipped"
            : date < today
              ? "overdue"
              : date <= soon
                ? "upcoming"
                : "later";
      const open = state !== "done" && state !== "skipped";
      const pastMaxAge =
        open &&
        dose.maxAgeDays !== undefined &&
        date > addDays(dob, dose.maxAgeDays);
      return { dose, due: date, state, record, unchosen, pastMaxAge };
    })
    .sort(
      (a, b) =>
        a.due.localeCompare(b.due) ||
        a.dose.code.localeCompare(b.dose.code) ||
        a.dose.doseNo - b.dose.doseNo,
    );
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/vaccines.test.ts && bun run test && bun run typecheck`
Expected: PASS — file này `Tests  8 passed (8)`; cả bộ `Tests  187 passed (187)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/vaccines.ts lib/rules/vaccines.test.ts && git commit -m "feat(vaccines): due-date and status rules for the schedule"
```

---

### Task 4: Bảng `vaccine_doses`, RLS và đưa lên cloud

**Files:**

- Create: `supabase/migrations/20261114000400_vaccine_doses.sql`
- Modify: `lib/supabase/types.ts` (sinh lại)
- Test: `supabase/tests/006_vaccine_doses.test.sql`

**Interfaces:**

- Consumes: `public.babies`, `public.is_member`, `public.is_owner`, `public.baby_family`, `public.set_updated_at`, `public.forbid_immutable_change` (M1)
- Produces: bảng `public.vaccine_doses(id, baby_id, vaccine_code, dose_no, status, given_on, due_on_override, place, note, created_by, created_at, updated_at)`, `unique (baby_id, vaccine_code, dose_no)`; kiểu `Database["public"]["Tables"]["vaccine_doses"]` trong `lib/supabase/types.ts`

- [ ] **Step 1: Viết test pgTAP thất bại**

Tạo `supabase/tests/006_vaccine_doses.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000006', 'va@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'vb@example.com'),
  ('cccccccc-0000-0000-0000-000000000006', 'vc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000006', 'Nhà V');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000006', 'va@example.com', 'aaaaaaaa-0000-0000-0000-000000000006', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000006', 'vb@example.com', 'bbbbbbbb-0000-0000-0000-000000000006', 'member', 'Bà');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000006', 'Bé', '2026-09-14', 'female');
insert into public.vaccine_doses (baby_id, vaccine_code, dose_no, status, given_on, created_by)
  values ('ba000000-0000-0000-0000-000000000006', 'bcg', 1, 'done', '2026-09-14', 'aaaaaaaa-0000-0000-0000-000000000006');

select throws_ok(
  $$ insert into public.vaccine_doses (baby_id, vaccine_code, dose_no, status, created_by)
     values ('ba000000-0000-0000-0000-000000000006', 'hexa', 1, 'rescheduled', 'aaaaaaaa-0000-0000-0000-000000000006') $$,
  '23514', null, 'rescheduled needs due_on_override');
select throws_ok(
  $$ insert into public.vaccine_doses (baby_id, vaccine_code, dose_no, status, created_by)
     values ('ba000000-0000-0000-0000-000000000006', 'bcg', 1, 'skipped', 'aaaaaaaa-0000-0000-0000-000000000006') $$,
  '23505', null, 'one row per (baby, vaccine, dose)');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000006","email":"vc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.vaccine_doses', 'outsider sees no vaccine doses');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000006","email":"vb@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.vaccine_doses), 1, 'member sees the family''s doses');
select lives_ok(
  $$ insert into public.vaccine_doses (baby_id, vaccine_code, dose_no, status, given_on)
     values ('ba000000-0000-0000-0000-000000000006', 'hexa', 1, 'done', '2026-11-13') $$,
  'member marks a dose done (created_by defaults to them)');
select lives_ok(
  $$ update public.vaccine_doses set note = 'tiêm ở trạm' where vaccine_code = 'bcg' $$,
  'member updates a dose someone else recorded');
select lives_ok(
  $$ delete from public.vaccine_doses where vaccine_code = 'bcg' $$,
  'member delete of someone else''s row runs but matches nothing');
reset role;
select is((select note from public.vaccine_doses where vaccine_code = 'bcg'), 'tiêm ở trạm', 'member update applied, row still there');

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000006","email":"va@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ delete from public.vaccine_doses where vaccine_code = 'hexa' $$,
  'owner deletes a row the member recorded');
reset role;
select is(
  (select array_agg(vaccine_code order by vaccine_code) from public.vaccine_doses where baby_id = 'ba000000-0000-0000-0000-000000000006'),
  array['bcg'],
  'only the owner delete took effect');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `006_vaccine_doses.test.sql` báo `relation "public.vaccine_doses" does not exist`; `001`…`005` vẫn `ok`.

- [ ] **Step 3: Viết migration**

Tạo `supabase/migrations/20261114000400_vaccine_doses.sql`:

```sql
create table public.vaccine_doses (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  vaccine_code text not null check (vaccine_code ~ '^[a-z0-9_]{1,40}$'),
  dose_no int not null check (dose_no between 1 and 10),
  status text not null check (status in ('done', 'skipped', 'rescheduled')),
  given_on date,
  due_on_override date,
  place text check (place is null or length(place) <= 120),
  note text check (note is null or length(note) <= 500),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (baby_id, vaccine_code, dose_no),
  check (status <> 'rescheduled' or due_on_override is not null)
);

create trigger vaccine_doses_set_updated_at before update on public.vaccine_doses
  for each row execute function public.set_updated_at();
create trigger vaccine_doses_immutable before update on public.vaccine_doses
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');

alter table public.vaccine_doses enable row level security;

-- Spec §5.2: every member reads and marks doses; delete only your own row, or any row as owner.
create policy vaccine_doses_select on public.vaccine_doses for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy vaccine_doses_insert on public.vaccine_doses for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy vaccine_doses_update on public.vaccine_doses for update to authenticated
  using (public.is_member(public.baby_family(baby_id)))
  with check (public.is_member(public.baby_family(baby_id)));
create policy vaccine_doses_delete on public.vaccine_doses for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001`…`005` `ok`, `006_vaccine_doses.test.sql .. ok`, `All tests successful.`

- [ ] **Step 5: Sinh lại kiểu TypeScript**

Run: `bun run db:types && grep -c "vaccine_doses" lib/supabase/types.ts && bun run typecheck && bun run test`
Expected: số đếm `vaccine_doses` ≥ 1; `tsc --noEmit` không in lỗi; `Tests  187 passed (187)`. `git diff --stat lib/supabase/types.ts` chỉ thêm khối `vaccine_doses` (cùng quan hệ tới `babies`).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261114000400_vaccine_doses.sql supabase/tests/006_vaccine_doses.test.sql lib/supabase/types.ts && git commit -m "feat(vaccines): vaccine_doses table with RLS"
```

- [ ] **Step 7: Đưa migration lên Supabase cloud**

Run: `bunx supabase db push`
Expected: `Applying migration 20261114000400_vaccine_doses.sql...`, `Finished supabase db push.` Nếu CLI hỏi xác nhận thì trả lời `Y`. Nếu CLI báo chưa link project hoặc cần mật khẩu DB, dừng và ghi việc này vào báo cáo cuối như bước người dùng tự làm (không tự nhập mật khẩu).

- [ ] **Step 8: Deploy và kiểm file nội dung**

Run: `git push`, chờ Vercel deploy Ready, rồi `curl -s https://bunkid.vercel.app/content/vaccines.vi.json | head -n 2`
Expected: in ra `{` và dòng `"title": "Lịch tiêm chủng tham khảo cho trẻ 0–24 tháng",` (Vercel chạy `prebuild` trước `next build`, nên file có mặt).

---

## Ngoài phạm vi M14

- **M15:** trang `/tiem-chung`, chọn loại vaccine (kể cả "Không tiêm"), đánh dấu Đã tiêm / Bỏ qua / Đổi ngày hẹn, hiện `disclaimer` và cờ `pastMaxAge`, bước vaccine trong khai báo bé (§6.1, tick sẵn BCG và viêm gan B sơ sinh).
- **M16:** `vaccine_doses` qua outbox, push `vaccine` (08:00–08:59 giờ VN, `D3`/`D1`, bỏ qua tạm tắt, không nhắc nhóm chưa chọn), checklist bước 7 phần nhắc tiêm.
- Không có thay đổi giao diện hay checklist thiết bị ở M14.
