# Baby Tracker Web — M15 (Trang tiêm chủng và bước chọn vaccine) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Cha mẹ mở Cẩm nang → Tiêm chủng (`/tiem-chung`) để xem lịch tiêm của bé chia theo Quá hạn / Sắp tới / Đã tiêm / Đã bỏ qua / Sau này, chọn loại vaccine cho từng nhóm, và đánh dấu từng mũi Đã tiêm / Bỏ qua / Đổi ngày hẹn (spec §6.8). Khai báo bé mới có thêm bước chọn vaccine và tick nhanh mũi đã tiêm (§6.1).

**Architecture:**
- **Quy tắc thuần** (`lib/rules/vaccineForm.ts`): đọc `vaccine_choices` từ `jsonb`, làm sạch lựa chọn, chuyển dòng `vaccine_doses` thành `DoseRecord`, kiểm form đánh dấu, liệt kê mũi tick nhanh, định dạng ngày.
- **Dữ liệu** (`lib/data/vaccines.ts`): React Query đọc `vaccine_doses` của bé; ghi bằng upsert theo khóa tự nhiên `(baby_id, vaccine_code, dose_no)` và không gửi `id` (§9), xóa đánh dấu bằng `delete … select`, lưu lựa chọn qua `updateBaby`.
- **Giao diện** (`components/vaccines/`): `VaccineScreen` dựng danh sách từ `buildSchedule` (M14); `DoseSheet` là bottom sheet đánh dấu; `VaccineSetup` (chọn loại + tick nhanh) dùng chung cho trang tiêm chủng (khi chưa chọn gì) và bước 2 của khai báo bé.
- **Mạng:** ở M15 mọi thao tác ghi đi thẳng lên Supabase nên bọc trong `OnlineOnly` (M13). M16 chuyển việc đánh dấu mũi sang outbox.

**Tech Stack:** như M1–M14. Không thêm gói nào.

**Milestones của đợt phát hành 2:**
- M14: xong (nội dung lịch tiêm, quy tắc ngày hẹn, bảng `vaccine_doses`; commit `f447aad`..`e14f473`).
- **M15 (plan này):** trang `/tiem-chung`, chọn loại vaccine, đánh dấu mũi, bước vaccine khi khai báo bé.
- M16: đánh dấu mũi đi qua outbox (§9), push `vaccine` (§8.3), checklist bước 7 phần nhắc tiêm.
- Sau đó: thông tin khẩn cấp và push `wake`; tăng trưởng WHO; phân loại triệu chứng và bài bệnh thường gặp.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Ai làm gì (§4.1, §5.2):** mọi thành viên đánh dấu được mũi tiêm. Chỉ chủ gia đình (owner) đổi loại vaccine (`babies.vaccine_choices`); thành viên khác thấy dòng "Chỉ chủ gia đình đổi được loại vaccine." khi còn nhóm chưa chọn. "Xóa đánh dấu" theo RLS delete (owner, hoặc người đã tạo dòng); bị từ chối thì hiện "Bạn không có quyền thực hiện thao tác này".
- **Lựa chọn mỗi nhóm:** "Chưa chọn" (không lưu khóa), từng series, hoặc "Không tiêm" (`"none"`, M14). `cleanChoices` bỏ khóa lạ và giá trị không khớp nội dung trước khi lưu.
- **Thiết lập lần đầu:** trang `/tiem-chung` hiện khối "Thiết lập lịch tiêm" (`VaccineSetup`) khi người xem là owner và `vaccine_choices` rỗng (`{}`), đúng trường hợp của bé đã khai báo ở đợt 1. "Lưu" hoặc "Để sau" đều ẩn khối này cho tới khi rời trang; sau đó nút "Chọn loại vaccine" mở lại phần chọn.
- **Tick nhanh (§6.1):** danh sách là các mũi Quá hạn (hạn trước hôm nay, chưa đánh dấu) thuộc series đã chọn hoặc không thuộc nhóm nào, tính lại theo lựa chọn đang sửa. Mặc định tick `bcg#1` và `hepb_birth#1`. Lưu thành `status = 'done'`, `given_on = null`; upsert với `ignoreDuplicates`, nên mũi ai đó đã đánh dấu giữ nguyên. Tick được lưu **trước** lựa chọn: lưu lựa chọn xong thì khối thiết lập biến mất, nên lỗi xảy ra sau đó sẽ không ai thấy.
- **Bước 2 của khai báo bé:** sau khi tạo bé, `/khai-bao-be` đổi sang "Lịch tiêm của bé" với `VaccineSetup`; "Lưu" hoặc "Để sau" tải lại `family-context` rồi mới về trang chủ (để trang chủ không đẩy ngược lại `/khai-bao-be`). Vì `AuthGate` tự chuyển trang khi thấy bé đã có, thêm prop `keep` để giữ trang ở bước 2, và `BabyForm` báo `onCreated` **trước** khi tải lại `family-context`.
- **Form đánh dấu:**
  - Đã tiêm: ngày tiêm (mặc định hôm nay, từ ngày sinh đến hôm nay), nơi tiêm ≤ 120 ký tự, ghi chú ≤ 500 ký tự.
  - Bỏ qua: chỉ ghi chú (đổi sang Bỏ qua hoặc Đổi ngày hẹn thì xóa nơi tiêm đang nhập).
  - Đổi ngày hẹn: ngày hẹn mới từ hôm nay trở đi (mặc định là ngày hẹn hiện tại).
  - Câu báo lỗi đúng như `parseDoseForm`.
- **Hiển thị một mũi:** tên mũi (đã có số mũi trong tên); "Hẹn <Thứ, dd/MM/yyyy>" hoặc "Đã tiêm <Thứ, dd/MM/yyyy>" / "Đã tiêm" (tick nhanh) / "Đã bỏ qua"; "Tiêm chủng mở rộng" hoặc "Dịch vụ"; nhãn "Chưa chọn loại"; cờ `pastMaxAge` hiện "Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ."; `note` của mũi khi chưa tiêm. Đầu trang luôn hiện `disclaimer` của nội dung.
- **Offline:** dữ liệu đọc được qua cache React Query đã lưu (M9). Phần ghi nằm trong `OnlineOnly`, nút "Đóng" / "Để sau" nằm ngoài để vẫn thoát được khi mất mạng.
- **Service worker:** `/tiem-chung` đã có trong danh sách `GUIDES` của `sw/sw.template.js` từ M9, không cần sửa.
- **Kiểm tra trên trình duyệt:** người lập plan đã chạy đúng các lệnh supabase-js của Task 2 trên Supabase local bằng tài khoản thử. Kết quả: upsert lần hai giữ nguyên `id`, tick nhanh không ghi đè mũi đã có, đổi ngày thiếu `due_on_override` bị DB chặn (`23514`). Phần giao diện cần mắt người: implementer xem bằng Claude in Chrome; nếu Chrome không kết nối được thì ghi "chờ người dùng" vào checklist, không thay bằng trình duyệt khác.

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

Riêng M15:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/vaccineForm.ts` và `components/vaccines/` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`e14f473`):

- M14: `VACCINES` (`lib/content/vaccines.ts`), `VaccineDose`, `VaccineGroup` (`lib/content/vaccineSchema.ts`); `NOT_TAKING`, `DoseRecord`, `ScheduleItem`, `STATE_SECTIONS`, `buildSchedule` (`lib/rules/vaccines.ts`); bảng `vaccine_doses` và khối `vaccine_doses` trong `lib/supabase/types.ts`
- M1–M13: `AuthGate`, `BabyForm`, `OnlineOnly`, `updateBaby`/`createBaby` (`lib/data/baby.ts`), `PermissionDeniedError`/`toVietnameseError` (`lib/data/errors.ts`), `vnDateString` (`lib/rules/time.ts`), `GUIDE_ITEMS` (`lib/nav.ts`), `docs/device-checklist.md`

**Produces** (M16 dùng):

- `lib/rules/vaccineForm.ts`: `doseKey`, `parseChoices`, `cleanChoices`, `toDoseRecords`, `formatDueDate`, `DEFAULT_TICKED`, `quickTickCandidates`, `DoseAction`, `DoseFormRaw`, `DosePatch`, `parseDoseForm`; `WEEKDAYS` được export từ `lib/rules/days.ts`
- `lib/data/vaccines.ts`: `DoseRef`, `useVaccineDoses`, `saveDose`, `clearDose`, `tickDoses`, `useDoseActions(babyId) → { save, clear }`, `useVaccineSetup`, `useUpdateChoices`. M16 chuyển phần ghi của `useDoseActions` sang outbox (thêm tham số `userId`).
- `VaccineDoseRow` (`lib/supabase/rows.ts`)
- `components/vaccines/`: `VaccineScreen({ baby, isOwner })`, `DoseSheet`, `DoseLine`, `ChoiceFields`, `VaccineSetup`
- `AuthGate` có prop `keep?: boolean`; `BabyForm` có prop `onCreated?: (baby) => void`
- Trang `/tiem-chung`; checklist bước 8

## File Structure

```
lib/rules/vaccineForm.ts (+ test)        # lựa chọn, form đánh dấu, tick nhanh, định dạng ngày
lib/rules/days.ts                        # sửa: export WEEKDAYS
lib/data/vaccines.ts                     # đọc/ghi vaccine_doses, lựa chọn vaccine
lib/supabase/rows.ts, lib/data/baby.ts   # sửa: VaccineDoseRow, patch vaccine_choices
lib/nav.ts (+ test)                      # sửa: Cẩm nang → /tiem-chung
components/vaccines/ChoiceFields.tsx     # ô chọn loại cho từng nhóm
components/vaccines/DoseLine.tsx         # một dòng mũi tiêm
components/vaccines/DoseSheet.tsx        # bottom sheet đánh dấu
components/vaccines/VaccineSetup.tsx     # chọn loại + tick nhanh
components/vaccines/VaccineScreen.tsx    # trang tiêm chủng
app/tiem-chung/page.tsx
components/AuthGate.tsx, components/baby/BabyForm.tsx, app/khai-bao-be/page.tsx   # sửa: bước 2 khai báo bé
docs/device-checklist.md                 # sửa: bước 8
```

## Tasks

1. Quy tắc lựa chọn và form đánh dấu
2. Đọc, ghi mũi tiêm và lối vào từ Cẩm nang
3. Trang `/tiem-chung`
4. Bước lịch tiêm khi khai báo bé
5. Checklist bước 8 và deploy

---

### Task 1: Quy tắc lựa chọn và form đánh dấu

**Files:**

- Create: `lib/rules/vaccineForm.ts`
- Modify: `lib/rules/days.ts` (export `WEEKDAYS`)
- Test: `lib/rules/vaccineForm.test.ts`

**Interfaces:**

- Consumes: `NOT_TAKING`, `DoseRecord`, `ScheduleItem` (`lib/rules/vaccines.ts`, M14); `VaccineGroup` (M14); `WEEKDAYS` (`lib/rules/days.ts`)
- Produces:
  - `doseKey(code, doseNo): string` → `"code#doseNo"`
  - `parseChoices(value: unknown): Record<string, string>`; `cleanChoices(groups, draft): Record<string, string>`
  - `toDoseRecords(rows): DoseRecord[]` (bỏ dòng có `status` lạ)
  - `formatDueDate("YYYY-MM-DD"): string` → `"Thứ Hai, 16/11/2026"`
  - `DEFAULT_TICKED: string[]`; `quickTickCandidates(items: ScheduleItem[]): ScheduleItem[]`
  - `type DoseAction = "done" | "skipped" | "rescheduled"`, `type DoseFormRaw = { action; date; place; note }`, `type DosePatch = { status; given_on; due_on_override; place; note }`
  - `parseDoseForm(raw, { dob, today }): { ok: true; value: DosePatch } | { ok: false; message: string }`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m15.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `e14f473 feat(vaccines): vaccine_doses table with RLS`.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/rules/vaccineForm.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { VaccineDose, VaccineGroup } from "@/lib/content/vaccineSchema";
import {
  cleanChoices,
  formatDueDate,
  parseChoices,
  parseDoseForm,
  quickTickCandidates,
  toDoseRecords,
} from "./vaccineForm";
import { NOT_TAKING, type ScheduleItem } from "./vaccines";

const groups: VaccineGroup[] = [
  {
    code: "rota",
    name: "Rota",
    series: [
      { code: "rotarix", name: "Rotarix", program: "dich_vu" },
      { code: "rotavin", name: "Rotavin", program: "tcmr" },
    ],
  },
  {
    code: "flu",
    name: "Cúm",
    series: [{ code: "flu", name: "Cúm", program: "dich_vu" }],
  },
];

describe("parseChoices", () => {
  it("accepts a map of strings and treats anything else as nothing chosen", () => {
    expect(parseChoices({ rota: "rotarix" })).toEqual({ rota: "rotarix" });
    expect(parseChoices({ rota: 1 })).toEqual({});
    expect(parseChoices(null)).toEqual({});
    expect(parseChoices([])).toEqual({});
  });
});

describe("cleanChoices", () => {
  it("keeps known series and 'none', drops unset and unknown values", () => {
    expect(
      cleanChoices(groups, {
        rota: "rotarix",
        flu: "",
        old: "x",
      }),
    ).toEqual({ rota: "rotarix" });
    expect(cleanChoices(groups, { rota: "bogus", flu: NOT_TAKING })).toEqual({
      flu: NOT_TAKING,
    });
  });
});

describe("toDoseRecords", () => {
  it("keeps the schedule fields and drops rows with an unknown status", () => {
    const row = {
      id: "r1",
      vaccine_code: "bcg",
      dose_no: 1,
      given_on: null,
      due_on_override: null,
      place: "Trạm y tế",
    };
    expect(
      toDoseRecords([
        { ...row, status: "done" },
        { ...row, status: "weird" },
      ]),
    ).toEqual([
      {
        vaccine_code: "bcg",
        dose_no: 1,
        status: "done",
        given_on: null,
        due_on_override: null,
      },
    ]);
  });
});

describe("formatDueDate", () => {
  it("writes the weekday and the full date", () => {
    expect(formatDueDate("2026-11-16")).toBe("Thứ Hai, 16/11/2026");
    expect(formatDueDate("2026-11-15")).toBe("Chủ nhật, 15/11/2026");
  });
});

describe("quickTickCandidates", () => {
  const item = (
    code: string,
    state: ScheduleItem["state"],
    unchosen = false,
  ): ScheduleItem => ({
    dose: { code, doseNo: 1 } as VaccineDose,
    due: "2026-10-01",
    state,
    record: null,
    unchosen,
    pastMaxAge: false,
  });
  it("lists overdue doses of known series only", () => {
    const items = [
      item("bcg", "overdue"),
      item("rotarix", "overdue", true),
      item("opv", "upcoming"),
      item("hepb_birth", "done"),
    ];
    expect(quickTickCandidates(items).map((i) => i.dose.code)).toEqual(["bcg"]);
  });
});

describe("parseDoseForm", () => {
  const ctx = { dob: "2026-09-14", today: "2026-11-14" };
  const raw = { date: "", place: "", note: "" };

  it("done needs a date between birth and today, keeps place and note", () => {
    expect(parseDoseForm({ ...raw, action: "done" }, ctx)).toEqual({
      ok: false,
      message: "Chọn ngày tiêm.",
    });
    expect(
      parseDoseForm({ ...raw, action: "done", date: "2026-11-15" }, ctx),
    ).toEqual({
      ok: false,
      message: "Ngày tiêm phải từ ngày sinh đến hôm nay.",
    });
    expect(
      parseDoseForm({ ...raw, action: "done", date: "2026-09-13" }, ctx),
    ).toEqual({
      ok: false,
      message: "Ngày tiêm phải từ ngày sinh đến hôm nay.",
    });
    expect(
      parseDoseForm(
        {
          action: "done",
          date: "2026-11-14",
          place: "  VNVC  ",
          note: "",
        },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: {
        status: "done",
        given_on: "2026-11-14",
        due_on_override: null,
        place: "VNVC",
        note: null,
      },
    });
  });

  it("rescheduled needs a date from today on and clears given_on", () => {
    expect(parseDoseForm({ ...raw, action: "rescheduled" }, ctx)).toEqual({
      ok: false,
      message: "Chọn ngày hẹn mới.",
    });
    expect(
      parseDoseForm({ ...raw, action: "rescheduled", date: "2026-11-13" }, ctx),
    ).toEqual({ ok: false, message: "Ngày hẹn mới phải từ hôm nay trở đi." });
    expect(
      parseDoseForm({ ...raw, action: "rescheduled", date: "2026-11-14" }, ctx),
    ).toEqual({
      ok: true,
      value: {
        status: "rescheduled",
        given_on: null,
        due_on_override: "2026-11-14",
        place: null,
        note: null,
      },
    });
  });

  it("skipped ignores the date; place and note have length limits", () => {
    expect(
      parseDoseForm(
        { ...raw, action: "skipped", date: "bad", note: "sốt" },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: {
        status: "skipped",
        given_on: null,
        due_on_override: null,
        place: null,
        note: "sốt",
      },
    });
    expect(
      parseDoseForm({ ...raw, action: "skipped", place: "x".repeat(121) }, ctx),
    ).toEqual({ ok: false, message: "Nơi tiêm tối đa 120 ký tự." });
    expect(
      parseDoseForm({ ...raw, action: "skipped", note: "x".repeat(501) }, ctx),
    ).toEqual({ ok: false, message: "Ghi chú tối đa 500 ký tự." });
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/vaccineForm.test.ts`
Expected: FAIL — `Error: Cannot find module './vaccineForm' imported from …/lib/rules/vaccineForm.test.ts`.

- [ ] **Step 4: Export `WEEKDAYS`**

1. `lib/rules/days.ts`:

```diff
-const WEEKDAYS = [
+export const WEEKDAYS = [
```

- [ ] **Step 5: Viết quy tắc**

Tạo `lib/rules/vaccineForm.ts`:

```ts
import { z } from "zod";
import type { VaccineGroup } from "@/lib/content/vaccineSchema";
import { WEEKDAYS } from "./days";
import { NOT_TAKING, type DoseRecord, type ScheduleItem } from "./vaccines";

export const doseKey = (code: string, doseNo: number) => `${code}#${doseNo}`;

// babies.vaccine_choices is free-form jsonb: anything that is not a
// { group: series } map of strings counts as "nothing chosen yet".
export function parseChoices(value: unknown): Record<string, string> {
  const parsed = z.record(z.string(), z.string()).safeParse(value);
  return parsed.success ? parsed.data : {};
}

// Keeps only known groups with a known series (or NOT_TAKING); "" means unset.
export function cleanChoices(
  groups: VaccineGroup[],
  draft: Record<string, string>,
): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const group of groups) {
    const value = draft[group.code];
    if (
      value === NOT_TAKING ||
      group.series.some((series) => series.code === value)
    )
      clean[group.code] = value;
  }
  return clean;
}

export function toDoseRecords(
  rows: {
    vaccine_code: string;
    dose_no: number;
    status: string;
    given_on: string | null;
    due_on_override: string | null;
  }[],
): DoseRecord[] {
  return rows.flatMap((row): DoseRecord[] =>
    row.status === "done" ||
    row.status === "skipped" ||
    row.status === "rescheduled"
      ? [
          {
            vaccine_code: row.vaccine_code,
            dose_no: row.dose_no,
            status: row.status,
            given_on: row.given_on,
            due_on_override: row.due_on_override,
          },
        ]
      : [],
  );
}

export function formatDueDate(day: string): string {
  const [year, month, date] = day.split("-");
  const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
  return `${weekday}, ${date}/${month}/${year}`;
}

// Spec §6.1: newborn doses are ticked by default in the quick-tick list.
export const DEFAULT_TICKED = ["bcg#1", "hepb_birth#1"];

// Doses already past due whose series is known: the ones a parent can tick as given.
export function quickTickCandidates(items: ScheduleItem[]): ScheduleItem[] {
  return items.filter((item) => item.state === "overdue" && !item.unchosen);
}

export type DoseAction = "done" | "skipped" | "rescheduled";

export type DoseFormRaw = {
  action: DoseAction;
  date: string;
  place: string;
  note: string;
};

export type DosePatch = {
  status: DoseAction;
  given_on: string | null;
  due_on_override: string | null;
  place: string | null;
  note: string | null;
};

export function parseDoseForm(
  raw: DoseFormRaw,
  ctx: { dob: string; today: string },
): { ok: true; value: DosePatch } | { ok: false; message: string } {
  const place = raw.place.trim();
  const note = raw.note.trim();
  if (place.length > 120)
    return { ok: false, message: "Nơi tiêm tối đa 120 ký tự." };
  if (note.length > 500)
    return { ok: false, message: "Ghi chú tối đa 500 ký tự." };
  const base = { place: place || null, note: note || null };
  if (raw.action === "skipped")
    return {
      ok: true,
      value: {
        status: "skipped",
        given_on: null,
        due_on_override: null,
        ...base,
      },
    };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.date))
    return {
      ok: false,
      message: raw.action === "done" ? "Chọn ngày tiêm." : "Chọn ngày hẹn mới.",
    };
  if (raw.action === "done") {
    if (raw.date < ctx.dob || raw.date > ctx.today)
      return {
        ok: false,
        message: "Ngày tiêm phải từ ngày sinh đến hôm nay.",
      };
    return {
      ok: true,
      value: {
        status: "done",
        given_on: raw.date,
        due_on_override: null,
        ...base,
      },
    };
  }
  if (raw.date < ctx.today)
    return { ok: false, message: "Ngày hẹn mới phải từ hôm nay trở đi." };
  return {
    ok: true,
    value: {
      status: "rescheduled",
      given_on: null,
      due_on_override: raw.date,
      ...base,
    },
  };
}
```

- [ ] **Step 6: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/vaccineForm.test.ts && bun run typecheck`
Expected: PASS — `Tests  8 passed (8)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 7: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m15.md lib/rules/days.ts lib/rules/vaccineForm.ts lib/rules/vaccineForm.test.ts && git commit -m "feat(vaccines): choice cleanup, dose form and quick-tick rules"
```

---

### Task 2: Đọc, ghi mũi tiêm và lối vào từ Cẩm nang

**Files:**

- Create: `lib/data/vaccines.ts`
- Modify: `lib/supabase/rows.ts`, `lib/data/baby.ts`, `lib/nav.ts`
- Test: `lib/nav.test.ts`

**Interfaces:**

- Consumes: `DosePatch` (Task 1); `updateBaby` (`lib/data/baby.ts`); `PermissionDeniedError`; `supabase()` (`lib/supabase/client.ts`)
- Produces:
  - `VaccineDoseRow = Tables["vaccine_doses"]["Row"]`
  - `type DoseRef = { code: string; doseNo: number }`
  - `useVaccineDoses(babyId)` — query key `["vaccine-doses", babyId]`, trả `VaccineDoseRow[]`
  - `saveDose(babyId, ref, patch)`, `clearDose(babyId, ref)` (0 dòng → `PermissionDeniedError`), `tickDoses(babyId, refs)`
  - `useDoseActions(babyId) → { save: mutation<{ ref, patch }>, clear: mutation<DoseRef> }`
  - `useVaccineSetup(babyId) → mutation<{ choices, ticked: DoseRef[] }>`, `useUpdateChoices(babyId) → mutation<Record<string, string>>`
  - `updateBaby` nhận thêm `vaccine_choices?: Record<string, string>`; `GUIDE_ITEMS` "Tiêm chủng" trỏ tới `/tiem-chung`

- [ ] **Step 1: Viết test thất bại**

1. `lib/nav.test.ts`:

```diff
+  it("Cẩm nang opens the vaccine page", () => {
+    expect(GUIDE_ITEMS.find((i) => i.label === "Tiêm chủng")?.href).toBe(
+      "/tiem-chung",
+    );
+  });
+
   it("every menu link opens under its own tab", () => {
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `Cẩm nang opens the vaccine page`: `expected null to be '/tiem-chung'`.

- [ ] **Step 3: Sửa kiểu, `updateBaby` và menu**

1. `lib/supabase/rows.ts`:

```diff
 export type LogRow = Tables["logs"]["Row"];
+export type VaccineDoseRow = Tables["vaccine_doses"]["Row"];
```

2. `lib/data/baby.ts`:

```diff
-  patch: Partial<BabyInput> & { feed_interval_min?: number },
+  patch: Partial<BabyInput> & {
+    feed_interval_min?: number;
+    vaccine_choices?: Record<string, string>;
+  },
```

3. `lib/nav.ts`:

```diff
-  { label: "Tiêm chủng", href: null },
+  { label: "Tiêm chủng", href: "/tiem-chung" },
```

- [ ] **Step 4: Viết lớp dữ liệu**

Tạo `lib/data/vaccines.ts`:

```ts
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { DosePatch } from "@/lib/rules/vaccineForm";
import { supabase } from "@/lib/supabase/client";
import type { VaccineDoseRow } from "@/lib/supabase/rows";
import { updateBaby } from "./baby";
import { PermissionDeniedError } from "./errors";

export type DoseRef = { code: string; doseNo: number };

const dosesKey = (babyId: string) => ["vaccine-doses", babyId] as const;
const CONFLICT = "baby_id,vaccine_code,dose_no";

export function useVaccineDoses(babyId: string) {
  return useQuery({
    queryKey: dosesKey(babyId),
    queryFn: async (): Promise<VaccineDoseRow[]> => {
      const { data, error } = await supabase()
        .from("vaccine_doses")
        .select("*")
        .eq("baby_id", babyId);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

// Spec §9: upsert on the natural key and never send id, so the update branch
// keeps the row's primary key.
export async function saveDose(
  babyId: string,
  ref: DoseRef,
  patch: DosePatch,
): Promise<void> {
  const { data, error } = await supabase()
    .from("vaccine_doses")
    .upsert(
      {
        baby_id: babyId,
        vaccine_code: ref.code,
        dose_no: ref.doseNo,
        ...patch,
      },
      { onConflict: CONFLICT },
    )
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

export async function clearDose(babyId: string, ref: DoseRef): Promise<void> {
  const { data, error } = await supabase()
    .from("vaccine_doses")
    .delete()
    .eq("baby_id", babyId)
    .eq("vaccine_code", ref.code)
    .eq("dose_no", ref.doseNo)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

// Quick tick (spec §6.1): "done" without a date; rows someone already marked stay as they are.
export async function tickDoses(
  babyId: string,
  refs: DoseRef[],
): Promise<void> {
  if (refs.length === 0) return;
  const { error } = await supabase()
    .from("vaccine_doses")
    .upsert(
      refs.map((ref) => ({
        baby_id: babyId,
        vaccine_code: ref.code,
        dose_no: ref.doseNo,
        status: "done",
      })),
      { onConflict: CONFLICT, ignoreDuplicates: true },
    );
  if (error) throw error;
}

function invalidateDoses(queryClient: QueryClient, babyId: string) {
  return queryClient.invalidateQueries({ queryKey: dosesKey(babyId) });
}

export function useDoseActions(babyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () => invalidateDoses(queryClient, babyId);
  return {
    save: useMutation({
      mutationFn: ({ ref, patch }: { ref: DoseRef; patch: DosePatch }) =>
        saveDose(babyId, ref, patch),
      onSettled,
    }),
    clear: useMutation({
      mutationFn: (ref: DoseRef) => clearDose(babyId, ref),
      onSettled,
    }),
  };
}

// Owner only (spec §4.1). Ticks first: once the choices are saved the setup block
// disappears, so a failure after that point would go unseen.
export function useVaccineSetup(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      choices: Record<string, string>;
      ticked: DoseRef[];
    }) => {
      await tickDoses(babyId, input.ticked);
      await updateBaby(babyId, { vaccine_choices: input.choices });
    },
    onSettled: async () => {
      await invalidateDoses(queryClient, babyId);
      await queryClient.invalidateQueries({ queryKey: ["family-context"] });
    },
  });
}

// Owner only (spec §4.1).
export function useUpdateChoices(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choices: Record<string, string>) =>
      updateBaby(babyId, { vaccine_choices: choices }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });
}
```

- [ ] **Step 5: Chạy test và kiểm tra type**

Run: `bunx vitest run lib/nav.test.ts && bun run typecheck`
Expected: PASS — `Tests  4 passed (4)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 6: Commit**

```bash
git add lib/data/vaccines.ts lib/supabase/rows.ts lib/data/baby.ts lib/nav.ts lib/nav.test.ts && git commit -m "feat(vaccines): read and write vaccine doses, link from Cẩm nang"
```

---

### Task 3: Trang `/tiem-chung`

**Files:**

- Create: `components/vaccines/ChoiceFields.tsx`, `components/vaccines/DoseLine.tsx`, `components/vaccines/DoseSheet.tsx`, `components/vaccines/VaccineSetup.tsx`, `components/vaccines/VaccineScreen.tsx`, `app/tiem-chung/page.tsx`
- Test: `lib/themeGuard.test.ts` (đã có, quét cả thư mục mới)

**Interfaces:**

- Consumes: Task 1, Task 2; `VACCINES`, `buildSchedule`, `STATE_SECTIONS` (M14); `OnlineOnly`, `AuthGate`
- Produces: `ChoiceFields({ groups, value, onChange })`, `DoseLine({ item })`, `DoseSheet({ item, row, babyId, dob, onClose })`, `VaccineSetup({ baby, records, initialChoices, onDone, onLater })`, `VaccineScreen({ baby, isOwner })`, trang `/tiem-chung`

- [ ] **Step 1: Tạo `components/vaccines/ChoiceFields.tsx`**

```tsx
"use client";

import type { VaccineGroup } from "@/lib/content/vaccineSchema";
import { NOT_TAKING } from "@/lib/rules/vaccines";

export function ChoiceFields({
  groups,
  value,
  onChange,
}: {
  groups: VaccineGroup[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <label key={group.code} className="flex flex-col gap-1">
          {group.name}
          <select
            className="min-h-11 rounded-xl border px-3"
            value={value[group.code] ?? ""}
            onChange={(e) =>
              onChange({ ...value, [group.code]: e.target.value })
            }
          >
            <option value="">Chưa chọn</option>
            {group.series.map((series) => (
              <option key={series.code} value={series.code}>
                {series.name}
              </option>
            ))}
            <option value={NOT_TAKING}>Không tiêm</option>
          </select>
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Tạo `components/vaccines/DoseLine.tsx`**

```tsx
import { formatDueDate } from "@/lib/rules/vaccineForm";
import type { ScheduleItem } from "@/lib/rules/vaccines";

export function DoseLine({ item }: { item: ScheduleItem }) {
  const { dose, record } = item;
  const when =
    item.state === "done"
      ? record?.given_on
        ? `Đã tiêm ${formatDueDate(record.given_on)}`
        : "Đã tiêm"
      : item.state === "skipped"
        ? "Đã bỏ qua"
        : `Hẹn ${formatDueDate(item.due)}`;
  return (
    <>
      <span className="font-medium">{dose.name}</span>
      <span className="text-sm text-muted">
        {when} · {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
      </span>
      {item.unchosen && (
        <span className="rounded-full bg-soft px-2 text-sm">
          Chưa chọn loại
        </span>
      )}
      {item.pastMaxAge && (
        <span className="text-sm text-danger-ink">
          Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ.
        </span>
      )}
      {dose.note && item.state !== "done" && (
        <span className="text-sm text-muted">{dose.note}</span>
      )}
    </>
  );
}
```

- [ ] **Step 3: Tạo `components/vaccines/DoseSheet.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { toVietnameseError } from "@/lib/data/errors";
import { useDoseActions } from "@/lib/data/vaccines";
import { vnDateString } from "@/lib/rules/time";
import {
  formatDueDate,
  parseDoseForm,
  type DoseAction,
  type DoseFormRaw,
} from "@/lib/rules/vaccineForm";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import type { VaccineDoseRow } from "@/lib/supabase/rows";

const ACTIONS: { value: DoseAction; label: string }[] = [
  { value: "done", label: "Đã tiêm" },
  { value: "skipped", label: "Bỏ qua" },
  { value: "rescheduled", label: "Đổi ngày hẹn" },
];

export function DoseSheet({
  item,
  row,
  babyId,
  dob,
  onClose,
}: {
  item: ScheduleItem;
  row: VaccineDoseRow | null;
  babyId: string;
  dob: string;
  onClose: () => void;
}) {
  const actions = useDoseActions(babyId);
  const today = vnDateString(new Date());
  const ref = { code: item.dose.code, doseNo: item.dose.doseNo };
  const [raw, setRaw] = useState<DoseFormRaw>(() => {
    const action: DoseAction =
      row?.status === "skipped" || row?.status === "rescheduled"
        ? row.status
        : "done";
    return {
      action,
      date:
        action === "rescheduled"
          ? (row?.due_on_override ?? "")
          : (row?.given_on ?? today),
      place: row?.place ?? "",
      note: row?.note ?? "",
    };
  });
  const [message, setMessage] = useState<string | null>(null);
  const busy = actions.save.isPending || actions.clear.isPending;

  function set<K extends keyof DoseFormRaw>(key: K, value: DoseFormRaw[K]) {
    setRaw((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function chooseAction(action: DoseAction) {
    setRaw((prev) => ({
      ...prev,
      action,
      date:
        action === "done" ? today : action === "rescheduled" ? item.due : "",
      // The place field is only shown for "done"; never save a hidden value.
      place: action === "done" ? prev.place : "",
    }));
    setMessage(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseDoseForm(raw, { dob, today });
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.save.mutate(
      { ref, patch: parsed.value },
      { onSuccess: onClose, onError: (e) => setMessage(toVietnameseError(e)) },
    );
  }

  function clear() {
    actions.clear.mutate(ref, {
      onSuccess: onClose,
      onError: (e) => setMessage(toVietnameseError(e)),
    });
  }

  const input = "min-h-11 rounded-xl border px-3";
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
        <h2 className="text-xl font-semibold">{item.dose.name}</h2>
        <p className="text-muted">
          Phòng: {item.dose.protects.join(", ")}. Hẹn {formatDueDate(item.due)}.
        </p>
        <OnlineOnly>
          <div className="flex flex-col gap-3">
            <div role="radiogroup" className="flex gap-2">
              {ACTIONS.map((action) => (
                <label
                  key={action.value}
                  className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border px-2 text-center has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
                >
                  <input
                    type="radio"
                    name="dose-action"
                    className="sr-only"
                    checked={raw.action === action.value}
                    onChange={() => chooseAction(action.value)}
                  />
                  {action.label}
                </label>
              ))}
            </div>
            {raw.action !== "skipped" && (
              <label className="flex flex-col gap-1">
                {raw.action === "done" ? "Ngày tiêm" : "Ngày hẹn mới"}
                <input
                  type="date"
                  className={input}
                  min={raw.action === "done" ? dob : today}
                  max={raw.action === "done" ? today : undefined}
                  value={raw.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </label>
            )}
            {raw.action === "done" && (
              <label className="flex flex-col gap-1">
                Nơi tiêm (không bắt buộc)
                <input
                  className={input}
                  maxLength={120}
                  value={raw.place}
                  onChange={(e) => set("place", e.target.value)}
                />
              </label>
            )}
            <label className="flex flex-col gap-1">
              Ghi chú (không bắt buộc)
              <textarea
                className="min-h-20 rounded-xl border p-3"
                maxLength={500}
                value={raw.note}
                onChange={(e) => set("note", e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
            >
              Lưu
            </button>
            {row && (
              <button
                type="button"
                disabled={busy}
                onClick={clear}
                className="min-h-11 rounded-2xl text-danger disabled:opacity-50"
              >
                Xóa đánh dấu
              </button>
            )}
          </div>
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
          Đóng
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Tạo `components/vaccines/VaccineSetup.tsx`**

```tsx
"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { toVietnameseError } from "@/lib/data/errors";
import { useVaccineSetup } from "@/lib/data/vaccines";
import { VACCINES } from "@/lib/content/vaccines";
import { vnDateString } from "@/lib/rules/time";
import {
  cleanChoices,
  DEFAULT_TICKED,
  doseKey,
  formatDueDate,
  quickTickCandidates,
} from "@/lib/rules/vaccineForm";
import { buildSchedule, type DoseRecord } from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";

// Spec §6.1: pick a series per group, then tick the doses already given.
export function VaccineSetup({
  baby,
  records,
  initialChoices,
  onDone,
  onLater,
}: {
  baby: Baby;
  records: DoseRecord[];
  initialChoices: Record<string, string>;
  onDone: () => void;
  onLater: () => void;
}) {
  const setup = useVaccineSetup(baby.id);
  const [draft, setDraft] = useState(initialChoices);
  const [ticked, setTicked] = useState(() => new Set(DEFAULT_TICKED));
  const candidates = quickTickCandidates(
    buildSchedule({
      doses: VACCINES.doses,
      choices: cleanChoices(VACCINES.groups, draft),
      dob: baby.dob,
      records,
      today: vnDateString(new Date()),
    }),
  );

  function toggle(key: string, on: boolean) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function save() {
    setup.mutate(
      {
        choices: cleanChoices(VACCINES.groups, draft),
        ticked: candidates
          .filter((item) =>
            ticked.has(doseKey(item.dose.code, item.dose.doseNo)),
          )
          .map((item) => ({ code: item.dose.code, doseNo: item.dose.doseNo })),
      },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <OnlineOnly>
        <p className="text-muted">
          Chọn loại vaccine gia đình định tiêm cho từng nhóm. Chọn "Không tiêm"
          nếu không tiêm nhóm đó; để "Chưa chọn" nếu chưa quyết định.
        </p>
        <ChoiceFields
          groups={VACCINES.groups}
          value={draft}
          onChange={setDraft}
        />
        {candidates.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-medium">
              Mũi đã đến hạn trước hôm nay, đánh dấu mũi bé đã tiêm
            </legend>
            {candidates.map((item) => {
              const key = doseKey(item.dose.code, item.dose.doseNo);
              return (
                <label key={key} className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-5"
                    checked={ticked.has(key)}
                    onChange={(e) => toggle(key, e.target.checked)}
                  />
                  <span>
                    {item.dose.name}
                    <span className="block text-sm text-muted">
                      Hẹn {formatDueDate(item.due)}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}
        <button
          type="button"
          disabled={setup.isPending}
          onClick={save}
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          Lưu
        </button>
      </OnlineOnly>
      {setup.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(setup.error)}
        </p>
      )}
      <button
        type="button"
        onClick={onLater}
        className="min-h-12 rounded-2xl border"
      >
        Để sau
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Tạo `components/vaccines/VaccineScreen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { VACCINES } from "@/lib/content/vaccines";
import { toVietnameseError } from "@/lib/data/errors";
import { useUpdateChoices, useVaccineDoses } from "@/lib/data/vaccines";
import { vnDateString } from "@/lib/rules/time";
import {
  cleanChoices,
  doseKey,
  parseChoices,
  toDoseRecords,
} from "@/lib/rules/vaccineForm";
import {
  buildSchedule,
  STATE_SECTIONS,
  type ScheduleItem,
} from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";
import { DoseLine } from "./DoseLine";
import { DoseSheet } from "./DoseSheet";
import { VaccineSetup } from "./VaccineSetup";

export function VaccineScreen({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  const doses = useVaccineDoses(baby.id);
  const choices = parseChoices(baby.vaccine_choices);
  const [setupLater, setSetupLater] = useState(false);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<ScheduleItem | null>(null);

  if (doses.data === undefined) {
    if (doses.isError)
      return (
        <main className="p-6 text-center">
          <p className="mb-4">{toVietnameseError(doses.error)}</p>
          <button
            type="button"
            className="min-h-11 rounded-xl bg-accent px-4 text-on-accent"
            onClick={() => doses.refetch()}
          >
            Thử lại
          </button>
        </main>
      );
    return <main className="p-6 text-center text-muted">Đang tải…</main>;
  }

  const rows = doses.data;
  const records = toDoseRecords(rows);
  const items = buildSchedule({
    doses: VACCINES.doses,
    choices,
    dob: baby.dob,
    records,
    today: vnDateString(new Date()),
  });
  const unchosen = VACCINES.groups.filter(
    (group) => cleanChoices([group], choices)[group.code] === undefined,
  ).length;
  const needsSetup =
    isOwner && Object.keys(choices).length === 0 && !setupLater;
  const rowFor = (item: ScheduleItem) =>
    rows.find(
      (row) =>
        row.vaccine_code === item.dose.code && row.dose_no === item.dose.doseNo,
    ) ?? null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Tiêm chủng</h1>
      <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
        {VACCINES.disclaimer}
      </p>
      {needsSetup ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Thiết lập lịch tiêm</h2>
          <VaccineSetup
            baby={baby}
            records={records}
            initialChoices={choices}
            onDone={() => setSetupLater(true)}
            onLater={() => setSetupLater(true)}
          />
        </section>
      ) : (
        <ChoicesSection
          baby={baby}
          choices={choices}
          isOwner={isOwner}
          unchosen={unchosen}
          editing={editing}
          setEditing={setEditing}
        />
      )}
      {STATE_SECTIONS.map((section) => {
        const list = items.filter((item) => item.state === section.state);
        if (list.length === 0) return null;
        return (
          <section key={section.state} className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">
              {section.title} ({list.length})
            </h2>
            <ul className="divide-y rounded-2xl border">
              {list.map((item) => (
                <li key={doseKey(item.dose.code, item.dose.doseNo)}>
                  <button
                    type="button"
                    onClick={() => setOpen(item)}
                    className="flex min-h-12 w-full flex-col items-start gap-0.5 px-4 py-2 text-left"
                  >
                    <DoseLine item={item} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {open && (
        <DoseSheet
          item={open}
          row={rowFor(open)}
          babyId={baby.id}
          dob={baby.dob}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}

function ChoicesSection({
  baby,
  choices,
  isOwner,
  unchosen,
  editing,
  setEditing,
}: {
  baby: Baby;
  choices: Record<string, string>;
  isOwner: boolean;
  unchosen: number;
  editing: boolean;
  setEditing: (on: boolean) => void;
}) {
  const update = useUpdateChoices(baby.id);
  const [draft, setDraft] = useState(choices);

  if (!editing)
    return (
      <section className="flex flex-col gap-2">
        {unchosen > 0 && (
          <p className="text-muted">
            Còn {unchosen} nhóm chưa chọn loại vaccine. Mũi của các nhóm này
            hiện nhãn "Chưa chọn loại" và không có nhắc lịch.
          </p>
        )}
        {isOwner ? (
          <button
            type="button"
            onClick={() => {
              setDraft(choices);
              setEditing(true);
            }}
            className="min-h-11 rounded-xl border px-4"
          >
            Chọn loại vaccine
          </button>
        ) : (
          unchosen > 0 && (
            <p className="text-muted">
              Chỉ chủ gia đình đổi được loại vaccine.
            </p>
          )
        )}
      </section>
    );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Loại vaccine</h2>
      <OnlineOnly>
        <ChoiceFields
          groups={VACCINES.groups}
          value={draft}
          onChange={setDraft}
        />
        <button
          type="button"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(cleanChoices(VACCINES.groups, draft), {
              onSuccess: () => setEditing(false),
            })
          }
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          Lưu
        </button>
      </OnlineOnly>
      {update.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(update.error)}
        </p>
      )}
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="min-h-12 rounded-2xl border"
      >
        Đóng
      </button>
    </section>
  );
}
```

- [ ] **Step 6: Tạo `app/tiem-chung/page.tsx`**

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { VaccineScreen } from "@/components/vaccines/VaccineScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <VaccineScreen
            baby={ctx.baby}
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
Expected: không lỗi type; `Tests  196 passed (196)` (187 + 8 của Task 1 + 1 của Task 2; test chặn màu cứng vẫn xanh); build thành công, danh sách route có `○ /tiem-chung`.

- [ ] **Step 8: Xem trên localhost bằng Claude in Chrome**

Run: `bun run dev`. Mở `http://localhost:3000/tiem-chung` trong Claude in Chrome: bắt đầu bằng `tabs_context_mcp`, mở tab mới bằng `tabs_create_mcp`. Nhờ người dùng tự đăng nhập Google nếu trang chuyển về `/dang-nhap`. Ứng dụng local dùng Supabase cloud, nên **chỉ xem, không bấm Lưu** trên dữ liệu thật của bé.
Expected: thấy tiêu đề "Tiêm chủng", khung lưu ý, khối "Thiết lập lịch tiêm" (nếu là owner và chưa chọn loại) và các nhóm "Quá hạn (n)", "Sắp tới (≤ 30 ngày) (n)", "Sau này (n)"; bấm một mũi mở bottom sheet có ba lựa chọn Đã tiêm / Bỏ qua / Đổi ngày hẹn; bấm "Đóng" thì sheet tắt. Nếu Chrome không kết nối được thì bỏ qua bước này, ghi lại trong báo cáo cuối; bước 8 của checklist (Task 5) sẽ do người dùng kiểm.

- [ ] **Step 9: Commit**

```bash
git add components/vaccines app/tiem-chung && git commit -m "feat(vaccines): /tiem-chung page with choices, quick tick and dose sheet"
```

---

### Task 4: Bước lịch tiêm khi khai báo bé

**Files:**

- Modify: `components/AuthGate.tsx`, `components/baby/BabyForm.tsx`, `app/khai-bao-be/page.tsx`

**Interfaces:**

- Consumes: `VaccineSetup` (Task 3)
- Produces: `AuthGate({ need, keep?, children })` — `keep` bỏ qua việc tự chuyển trang; `BabyForm({ familyId, baby?, onCreated? })` — gọi `onCreated(baby)` sau khi tạo bé, trước khi tải lại `family-context`

- [ ] **Step 1: Sửa `AuthGate` và `BabyForm`**

1. `components/AuthGate.tsx`:

```diff
 export function AuthGate({
   need,
+  keep = false,
   children,
 }: {
   need: GateNeed;
+  // Stay on this page even when the landing page changes (onboarding step 2).
+  keep?: boolean;
   children: (state: GateState) => ReactNode;
 }) {
```

2. `components/AuthGate.tsx`:

```diff
-  const redirect = landing ? gateRedirect(need, landing) : null;
+  const redirect = landing && !keep ? gateRedirect(need, landing) : null;
```

3. `components/baby/BabyForm.tsx`:

```diff
 export function BabyForm({
   familyId,
   baby,
+  onCreated,
 }: {
   familyId: string;
   baby?: Baby;
+  onCreated?: (created: Baby) => void;
 }) {
```

4. `components/baby/BabyForm.tsx`:

```diff
   const save = useMutation({
-    mutationFn: async (value: BabyInput) => {
+    mutationFn: async (value: BabyInput): Promise<Baby | null> => {
+      if (!baby) return createBaby(familyId, value);
-      if (baby) await updateBaby(baby.id, value);
+      await updateBaby(baby.id, value);
-      else await createBaby(familyId, value);
+      return null;
     },
-    onSuccess: () =>
+    onSuccess: async (created) => {
+      // Tell the page first, so it can hold the gate before the refetch sees the baby.
+      if (created) onCreated?.(created);
-      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
+      await queryClient.invalidateQueries({ queryKey: ["family-context"] });
+    },
   });
```

- [ ] **Step 2: Thay `app/khai-bao-be/page.tsx`**

Thay toàn bộ file bằng:

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BabyForm } from "@/components/baby/BabyForm";
import { OnlineOnly } from "@/components/OnlineOnly";
import { VaccineSetup } from "@/components/vaccines/VaccineSetup";
import type { Baby } from "@/lib/supabase/rows";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [created, setCreated] = useState<Baby | null>(null);

  // Home must already see the new baby, or its gate sends us back here.
  async function finish() {
    await queryClient.refetchQueries({ queryKey: ["family-context"] });
    router.replace("/");
  }
  return (
    <AuthGate need="family" keep={created !== null}>
      {({ ctx }) => (
        <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
          <h1 className="text-2xl font-semibold">
            {created ? "Lịch tiêm của bé" : "Khai báo bé"}
          </h1>
          {created ? (
            <VaccineSetup
              baby={created}
              records={[]}
              initialChoices={{}}
              onDone={finish}
              onLater={finish}
            />
          ) : ctx?.member.role === "owner" ? (
            <OnlineOnly>
              <BabyForm familyId={ctx.family.id} onCreated={setCreated} />
            </OnlineOnly>
          ) : (
            <p className="text-muted">
              Chờ ba/mẹ của bé khai báo thông tin bé.
            </p>
          )}
        </main>
      )}
    </AuthGate>
  );
}
```

- [ ] **Step 3: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  196 passed (196)`; build thành công.

- [ ] **Step 4: Commit**

```bash
git add components/AuthGate.tsx components/baby/BabyForm.tsx app/khai-bao-be/page.tsx && git commit -m "feat(vaccines): vaccine step after creating a baby"
```

---

### Task 5: Checklist bước 8 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: trang `/tiem-chung` (Task 3), bước 2 khai báo bé (Task 4)
- Produces: bước 8 trong checklist, bản deploy có `/tiem-chung`

- [ ] **Step 1: Thêm bước 8 vào cuối `docs/device-checklist.md`**

````markdown
## Bước 8 — Tiêm chủng (M15)

1. Cẩm nang → Tiêm chủng. Kỳ vọng: khung lưu ý "Lịch tham khảo theo Thông tư 52/2025/TT-BYT…"; nếu chưa chọn loại vaccine (tài khoản chủ gia đình) thì có khối "Thiết lập lịch tiêm".
2. Chọn loại cho các nhóm theo sổ tiêm của bé ("Không tiêm" cho nhóm không định tiêm). Phần "Mũi đã đến hạn trước hôm nay" đã tick sẵn BCG và Viêm gan B sơ sinh; tick thêm mũi bé đã tiêm → Lưu. Kỳ vọng: các mũi đã tick nằm trong "Đã tiêm", nhóm "Quá hạn" chỉ còn mũi chưa tiêm.
3. Bấm một mũi "Sắp tới" → "Đổi ngày hẹn" → chọn ngày khác → Lưu. Kỳ vọng: dòng đó hiện "Hẹn <ngày mới>". Mở lại → "Xóa đánh dấu". Kỳ vọng: về ngày hẹn cũ.
4. Trên máy thứ hai (tài khoản thành viên khác) mở Tiêm chủng. Kỳ vọng: thấy đúng các đánh dấu ở bước 2; không có nút "Chọn loại vaccine".

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
````

Run: `grep -n '^## ' docs/device-checklist.md`
Expected: tiêu đề cuối cùng là `## Bước 8 — Tiêm chủng (M15)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist step 8 for vaccinations" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/tiem-chung`
Expected: `200`.

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bước 8 cần điện thoại thật và tài khoản Google của gia đình, nên để trống bảng kết quả. Trong báo cáo cuối, ghi rõ "Checklist bước 8 chờ người dùng" (người dùng đã cho phép trước: việc chỉ người dùng làm được thì ghi là đang chờ, không đánh dấu Đạt).

---

## Ngoài phạm vi M15

- **M16:** đánh dấu mũi và tick nhanh đi qua outbox (Dexie, ⏳, chạy offline), push `vaccine` 08:00–08:59 giờ VN (`D3`/`D1`, bỏ qua tạm tắt, không nhắc nhóm chưa chọn), checklist bước 7 phần nhắc tiêm.
- Lựa chọn vaccine (`babies`) vẫn cần mạng như mọi thay đổi hồ sơ bé (§9).
- Báo cáo cho bác sĩ (mũi gần nhất, mũi sắp tới) thuộc đợt 3.
