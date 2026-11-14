# Baby Tracker Web — M8 (Cài đặt: hồ sơ bé, khoảng cách cữ bú, thành viên) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/cai-dat` có thêm ba phần của spec §6.16:
- **Hồ sơ bé:** owner sửa được; member chỉ xem.
- **Khoảng cách cữ bú** `feed_interval_min`: 60–360 phút, bước 15, chỉ owner đổi được.
- **Thành viên:** danh sách Gmail, tên hiển thị và vai trò; owner thêm, xóa và đổi vai trò. Quyền theo §4.1; gia đình luôn còn ít nhất một owner.

**Architecture:**
- **Hàm thuần có Vitest:** kiểm tra form thành viên, danh sách khoảng cách cữ bú, đổi bé đã lưu thành giá trị form.
- **Ghi dữ liệu:** client gọi thẳng Supabase. RLS và trigger `keep_last_owner` (đã có từ M1) là chốt chặn thật.
- **Báo lỗi:** mọi `update`/`delete` dùng `.select()`; trả về 0 dòng thì báo "không có quyền" (§5.2).
- **Làm mới:** sau khi ghi, làm mới query `["family-context"]` và `["members", familyId]`, để trang chủ và thanh tiêu đề thấy ngay thay đổi.

**Tech Stack:** như M1–M7 (Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, supabase-js 2.118.0, React Query 5.105.0, zod 4.6.7, recharts 3.10.1, Vitest 5.0.5). Không thêm thư viện, không đổi database.

**Milestones của đợt phát hành 1:**
- M1–M7: xong (nền tảng, khai báo bé, trang chủ, đánh giá + Realtime, `/nhat-ky`, `/thong-ke`, thanh tab + theme + `/cai-dat` + `/cai-app`).
- **M8:** `/cai-dat` hồ sơ bé, khoảng cách cữ bú, thành viên.
- M9: service worker, offline outbox, Web Push, pg_cron, tạm tắt, phần Thông báo của `/cai-dat`, nút "Bật thông báo" của `/cai-app`. Lập plan sau khi M8 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Hồ sơ bé:**
  - Owner sửa được đúng các trường của form khai báo (§6.1): tên, ngày sinh, giới tính, cân nặng, chiều dài và vòng đầu lúc sinh. Form dùng lại `BabyForm` và quy tắc `parseBabyForm` của M2.
  - Nhóm máu, dị ứng và ghi chú thuộc Thông tin khẩn cấp (đợt 2), không có ở M8.
  - Member chỉ thấy tên, ngày sinh (kèm tuổi) và giới tính.
  - Đổi ngày sinh thì tuổi và mọi ngưỡng đánh giá theo `ageDays` đổi theo.
- **Khoảng cách cữ bú:**
  - Chọn trong danh sách 1 giờ, 1 giờ 15 phút, …, 6 giờ (21 lựa chọn), rồi bấm Lưu.
  - Giá trị này dùng cho dòng "Cữ bú tiếp theo khoảng HH:mm" ở trang chủ (M4) và nhắc bú (M9).
  - Member chỉ thấy giá trị hiện tại.
- **Thành viên:**
  - **Thêm người:** chỉ ghi một dòng `family_members` (Gmail viết thường, tên hiển thị, vai trò). Người đó mở Bé Yêu và đăng nhập Google đúng Gmail ấy là RPC `claim_membership` (M1) tự gắn tài khoản. App không gửi email mời.
  - **Kiểm tra ô Gmail:** chỉ cần đúng dạng địa chỉ email, vì tài khoản Google Workspace không có đuôi `@gmail.com`.
  - **Dòng "(bạn)" không có nút đổi vai trò hay xóa,** để người dùng không tự khóa mình ra ngoài. Muốn rời gia đình hoặc hạ quyền mình thì một owner khác làm. Nhờ vậy, từ giao diện không thể gặp lỗi "mất owner cuối cùng". Lỗi `last_owner` của trigger vẫn được đổi sang tiếng Việt cho chắc.
  - **Câu báo lỗi:**
    - Thêm trùng Gmail (`23505`): "Gmail này đã có trong gia đình."
    - Bị RLS chặn: "Bạn không có quyền thực hiện thao tác này".
  - Người chưa từng đăng nhập (`user_id` rỗng) có ghi chú "chưa đăng nhập lần nào".
  - Member thấy danh sách và câu "Chỉ chủ gia đình mới thêm, xóa hoặc đổi vai trò thành viên.", không có form thêm.
- **Thứ tự các phần của `/cai-dat`:** Hồ sơ bé · Khoảng cách cữ bú · Thành viên · Giao diện · Ứng dụng · Tài khoản. Phần Thông báo thuộc M9.

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

Từ spec §2.2 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component (`'use client'`), tự kiểm tra phiên ở client.
- `supabase-js` khởi tạo với `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.
- Toàn bộ logic nghiệp vụ là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Tuổi của bé tính bằng số ngày: `ageDays = (ngày hiện tại theo giờ VN) − dob`.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Cột `created_by` có `default auth.uid()`; client không bao giờ gửi `created_by`.
- Mọi lệnh `update`/`delete` ở client dùng `.select()` và coi 0 dòng trả về là "bị từ chối quyền" (spec §5.2).
- Gia đình luôn phải còn ≥ 1 owner: chặn bằng trigger khi xóa hoặc hạ quyền owner cuối cùng (spec §4.1, trigger `keep_last_owner` đã có).
- Tên route: `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`, `/`, `/nhat-ky`, `/thong-ke`, `/cam-nang`, `/tien-ich`, `/cai-dat`, `/cai-app`.
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`).
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x. Thêm thư viện khác phải ghi lý do trong plan.
- Không dùng Workbox, Serwist, `next-pwa`: service worker viết tay ở `public/sw.js` (M9).
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.

Từ M7:

- File `.tsx` trong `app/` và `components/` chỉ dùng màu theo vai trò (`bg-surface`, `text-ink`, `text-muted`, `bg-accent`, `text-on-accent`, `text-danger`, `text-good-ink`, `border-accent-line`…). Không dùng lớp màu bảng Tailwind (trừ `bg-black/40`) và không viết mã hex trong `components/`. Test `lib/themeGuard.test.ts` khóa quy tắc này.

Riêng M8:

- Trước khi viết code Next.js, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/familySettings.ts`, `lib/data/errors.ts` và các component mới phải đúng từng ký tự như plan này.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`9da2997`):

- **Bảng `family_members`:**
  - Ràng buộc: `email = lower(email)`, `unique(family_id, email)`, `display_name` 1–40 ký tự, `role` là `owner` hoặc `member`.
  - RLS §4.1: chỉ owner thêm, sửa, xóa.
  - Trigger `keep_last_owner` raise `last_owner` (mã `P0001`).
- **Bảng `babies`:** RLS chỉ owner sửa; `feed_interval_min` có `check between 60 and 360`.
- **Quy tắc bé** (`lib/rules/babyInput.ts`): `BabyFormRaw`, `BabyInput`, `parseBabyForm`.
- **Dữ liệu:**
  - `createBaby` (`lib/data/baby.ts`)
  - `useMembers(familyId)` với key `["members", familyId]`, và `useFamilyContext` với key `["family-context", userId]` (`lib/data/family.ts`)
  - `PermissionDeniedError`, `toVietnameseError` (`lib/data/errors.ts`)
- **Component:**
  - `BabyForm({ familyId })` (`components/baby/BabyForm.tsx`)
  - `SettingsScreen({ member, email })` (`components/settings/SettingsScreen.tsx`, M7)
  - `app/cai-dat/page.tsx`
  - `AuthGate need="baby"` (gắn sẵn thanh tab)
- **Khác:** `formatAgeVi` (`lib/rules/time.ts`); các màu theo vai trò của M7.

**Produces** (M9 và đợt 2 dùng):

- `lib/rules/babyInput.ts`: thêm `babyToRaw(baby): BabyFormRaw`
- `lib/rules/familySettings.ts`: `Role`, `ROLE_LABEL`, `roleLabel`, `MemberFormRaw`, `MemberInput`, `parseMemberForm`, `FEED_INTERVAL_OPTIONS`, `formatInterval`
- `lib/data/errors.ts`: `toVietnameseError` đổi được thêm lỗi `last_owner`; thêm `memberErrorText(e)`
- `lib/data/baby.ts`: `updateBaby(id, patch)`
- `lib/data/family.ts`: `addMember`, `setMemberRole`, `removeMember`, `useMemberActions(familyId)`
- `BabyForm({ familyId, baby? })` (có `baby` thì là form sửa)
- `BabyProfileSection`, `FeedIntervalSection`, `MembersSection` (`components/settings/`)
- `SettingsScreen({ member, baby, email })`; M9 chèn phần Thông báo sau phần Thành viên

## File Structure

```
lib/rules/babyInput.ts (+ test)          # thêm babyToRaw
lib/rules/familySettings.ts (+ test)     # form thành viên, vai trò, khoảng cách cữ bú
lib/data/errors.ts (+ test)              # lỗi last_owner, trùng Gmail
lib/data/baby.ts                         # thêm updateBaby
lib/data/family.ts                       # thêm thêm/đổi vai trò/xóa thành viên
components/baby/BabyForm.tsx             # sửa: chế độ sửa bé
components/settings/BabyProfileSection.tsx, FeedIntervalSection.tsx, MembersSection.tsx
components/settings/SettingsScreen.tsx   # sửa: ráp các phần mới
app/cai-dat/page.tsx                     # sửa: truyền baby
```

## Tasks

1. Quy tắc: form thành viên, khoảng cách cữ bú, bé đã lưu vào form, câu lỗi
2. Hồ sơ bé và khoảng cách cữ bú trong Cài đặt
3. Thành viên trong Cài đặt

---

### Task 1: Quy tắc: form thành viên, khoảng cách cữ bú, bé đã lưu vào form, câu lỗi

**Files:**

- Create: `lib/rules/familySettings.ts`
- Modify: `lib/rules/babyInput.ts` (thêm ở cuối), `lib/data/errors.ts` (thêm 1 nhánh, thêm hàm ở cuối)
- Test: `lib/rules/familySettings.test.ts`; thêm test vào `lib/rules/babyInput.test.ts`, `lib/data/errors.test.ts`

**Interfaces:**

- Consumes: `BabyFormRaw`, `parseBabyForm` (`lib/rules/babyInput.ts`); `toVietnameseError` (`lib/data/errors.ts`)
- Produces:
  - `babyToRaw(baby: { name: string; dob: string; sex: string; birth_weight_g: number | null; birth_length_cm: number | null; birth_head_cm: number | null }): BabyFormRaw`
  - `type Role = "owner" | "member"`; `ROLE_LABEL: Record<Role, string>`; `roleLabel(role: string): string`
  - `type MemberFormRaw = { email: string; displayName: string; role: string }`; `type MemberInput = { email: string; display_name: string; role: Role }`
  - `parseMemberForm(raw: MemberFormRaw): { ok: true; value: MemberInput } | { ok: false; errors: Partial<Record<keyof MemberFormRaw, string>> }`
  - `FEED_INTERVAL_OPTIONS: number[]` (60, 75, …, 360); `formatInterval(minutes: number): string`
  - `toVietnameseError` trả "Gia đình phải còn ít nhất một chủ gia đình." khi lỗi có chữ `last_owner`
  - `memberErrorText(e: unknown): string` — mã `23505` → "Gmail này đã có trong gia đình.", còn lại như `toVietnameseError`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m8.md` (file plan này, đi chung commit của Task 1); commit mới nhất là `9da2997 feat(settings): /cai-dat with theme picker and sign-out, /cai-app install guide`.

- [ ] **Step 2: Viết test thất bại cho `familySettings.ts`**

Tạo `lib/rules/familySettings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  FEED_INTERVAL_OPTIONS,
  formatInterval,
  parseMemberForm,
  roleLabel,
} from "./familySettings";

describe("familySettings", () => {
  it("parseMemberForm trims and lowercases the Gmail", () => {
    expect(
      parseMemberForm({
        email: "  Ba.Be@Gmail.COM ",
        displayName: " Ba ",
        role: "member",
      }),
    ).toEqual({
      ok: true,
      value: { email: "ba.be@gmail.com", display_name: "Ba", role: "member" },
    });
  });

  it("parseMemberForm reports every invalid field", () => {
    expect(
      parseMemberForm({ email: "ba@", displayName: " ", role: "admin" }),
    ).toEqual({
      ok: false,
      errors: {
        email: "Nhập Gmail hợp lệ",
        displayName: "Nhập tên hiển thị (tối đa 40 ký tự)",
        role: "Chọn vai trò",
      },
    });
    expect(
      parseMemberForm({
        email: "a@b.c",
        displayName: "x".repeat(41),
        role: "owner",
      }),
    ).toMatchObject({ ok: false, errors: { displayName: expect.any(String) } });
  });

  it("roleLabel names both roles and passes unknown values through", () => {
    expect(roleLabel("owner")).toBe("Chủ gia đình");
    expect(roleLabel("member")).toBe("Thành viên");
    expect(roleLabel("guest")).toBe("guest");
  });

  it("feed interval options go from 60 to 360 minutes in steps of 15", () => {
    expect(FEED_INTERVAL_OPTIONS).toHaveLength(21);
    expect(FEED_INTERVAL_OPTIONS[0]).toBe(60);
    expect(FEED_INTERVAL_OPTIONS.at(-1)).toBe(360);
    expect(FEED_INTERVAL_OPTIONS).toContain(195);
  });

  it("formatInterval writes hours and minutes", () => {
    expect(formatInterval(60)).toBe("1 giờ");
    expect(formatInterval(180)).toBe("3 giờ");
    expect(formatInterval(135)).toBe("2 giờ 15 phút");
  });
});
```

- [ ] **Step 3: Thêm test thất bại cho `babyToRaw`**

Trong `lib/rules/babyInput.test.ts`, thay dòng import:

```ts
import { parseBabyForm, type BabyFormRaw } from "@/lib/rules/babyInput";
```

bằng:

```ts
import {
  babyToRaw,
  parseBabyForm,
  type BabyFormRaw,
} from "@/lib/rules/babyInput";
```

Rồi chèn test sau `it("accepts a baby born today (VN)", ...)`, trước dấu `});` cuối file:

```ts
  it("babyToRaw fills the form from a saved baby and parses back unchanged", () => {
    const saved = {
      name: "Bông",
      dob: "2026-09-13",
      sex: "female",
      birth_weight_g: 3200,
      birth_length_cm: 49.5,
      birth_head_cm: null,
    };
    const raw = babyToRaw(saved);
    expect(raw).toEqual({
      name: "Bông",
      dob: "2026-09-13",
      sex: "female",
      birthWeightG: "3200",
      birthLengthCm: "49.5",
      birthHeadCm: "",
    });
    expect(parseBabyForm(raw, now)).toEqual({ ok: true, value: saved });
  });
```

- [ ] **Step 4: Thêm test thất bại cho lỗi thành viên**

Trong `lib/data/errors.test.ts`, thay dòng import:

```ts
import { PermissionDeniedError, toVietnameseError } from "@/lib/data/errors";
```

bằng:

```ts
import {
  memberErrorText,
  PermissionDeniedError,
  toVietnameseError,
} from "@/lib/data/errors";
```

Rồi thêm vào cuối file:

```ts
describe("member errors", () => {
  it("maps the last-owner guard", () => {
    expect(toVietnameseError({ code: "P0001", message: "last_owner" })).toBe(
      "Gia đình phải còn ít nhất một chủ gia đình.",
    );
  });
  it("maps a duplicate Gmail only for member changes", () => {
    expect(memberErrorText({ code: "23505", message: "duplicate key" })).toBe(
      "Gmail này đã có trong gia đình.",
    );
    expect(memberErrorText({ code: "42501", message: "x" })).toBe(
      "Bạn không có quyền thực hiện thao tác này",
    );
  });
});
```

- [ ] **Step 5: Chạy test để thấy thất bại**

Run: `bun run test lib/rules/familySettings.test.ts lib/rules/babyInput.test.ts lib/data/errors.test.ts`
Expected: FAIL:
- `familySettings.test.ts`: `Cannot find module './familySettings'`
- `babyInput.test.ts`: `TypeError: babyToRaw is not a function`
- `errors.test.ts`: `maps the last-owner guard` nhận `Có lỗi xảy ra: last_owner`, và `TypeError: memberErrorText is not a function`

- [ ] **Step 6: Viết `lib/rules/familySettings.ts`**

```ts
export type Role = "owner" | "member";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Chủ gia đình",
  member: "Thành viên",
};

export function roleLabel(role: string): string {
  return role === "owner" || role === "member" ? ROLE_LABEL[role] : role;
}

export type MemberFormRaw = {
  email: string;
  displayName: string;
  role: string;
};
export type MemberInput = { email: string; display_name: string; role: Role };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseMemberForm(
  raw: MemberFormRaw,
):
  | { ok: true; value: MemberInput }
  | { ok: false; errors: Partial<Record<keyof MemberFormRaw, string>> } {
  const errors: Partial<Record<keyof MemberFormRaw, string>> = {};
  const email = raw.email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254)
    errors.email = "Nhập Gmail hợp lệ";
  const displayName = raw.displayName.trim();
  if (displayName.length < 1 || displayName.length > 40)
    errors.displayName = "Nhập tên hiển thị (tối đa 40 ký tự)";
  if (raw.role !== "owner" && raw.role !== "member")
    errors.role = "Chọn vai trò";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { email, display_name: displayName, role: raw.role as Role },
  };
}

export const FEED_INTERVAL_OPTIONS: number[] = Array.from(
  { length: (360 - 60) / 15 + 1 },
  (_, i) => 60 + i * 15,
);

export function formatInterval(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}
```

- [ ] **Step 7: Thêm `babyToRaw` vào cuối `lib/rules/babyInput.ts`**

```ts
const text = (n: number | null) => (n === null ? "" : String(n));

export function babyToRaw(baby: {
  name: string;
  dob: string;
  sex: string;
  birth_weight_g: number | null;
  birth_length_cm: number | null;
  birth_head_cm: number | null;
}): BabyFormRaw {
  return {
    name: baby.name,
    dob: baby.dob,
    sex: baby.sex,
    birthWeightG: text(baby.birth_weight_g),
    birthLengthCm: text(baby.birth_length_cm),
    birthHeadCm: text(baby.birth_head_cm),
  };
}
```

- [ ] **Step 8: Sửa `lib/data/errors.ts`**

Trong `toVietnameseError`, chèn hai dòng ngay trước dòng `if (typeof e === "object" && e !== null && "code" in e) {`:

```ts
  if (/last_owner/.test(message))
    return "Gia đình phải còn ít nhất một chủ gia đình.";
```

Rồi thêm vào cuối file:

```ts
export function memberErrorText(e: unknown): string {
  if (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "23505"
  )
    return "Gmail này đã có trong gia đình.";
  return toVietnameseError(e);
}
```

- [ ] **Step 9: Chạy test để thấy đạt**

Run: `bun run test && bun run typecheck`
Expected: `Tests  119 passed (119)` (111 của M1–M7, 5 của `familySettings`, 1 của `babyInput`, 2 của `errors`); không lỗi type.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(rules): member form, feed interval options, baby form prefill, member errors"
```

`git add -A` lần này đưa cả file plan M8 vào commit.

---

### Task 2: Hồ sơ bé và khoảng cách cữ bú trong Cài đặt

**Files:**

- Create: `components/settings/BabyProfileSection.tsx`, `components/settings/FeedIntervalSection.tsx`
- Modify: `lib/data/baby.ts` (toàn bộ), `components/baby/BabyForm.tsx` (import, chữ ký hàm, state, `mutationFn`, thông báo), `components/settings/SettingsScreen.tsx` (toàn bộ), `app/cai-dat/page.tsx` (thân `AuthGate`)

**Interfaces:**

- Consumes: `babyToRaw`, `FEED_INTERVAL_OPTIONS`, `formatInterval`, `roleLabel` (Task 1); `PermissionDeniedError`, `toVietnameseError`; `formatAgeVi`
- Produces:
  - `updateBaby(id: string, patch: Partial<BabyInput> & { feed_interval_min?: number }): Promise<void>` — 0 dòng thì ném `PermissionDeniedError`
  - `BabyForm({ familyId: string; baby?: Baby })`
  - `BabyProfileSection({ baby: Baby; isOwner: boolean })`, `FeedIntervalSection({ baby: Baby; isOwner: boolean })`
  - `SettingsScreen({ member: FamilyMember; baby: Baby; email: string })`

- [ ] **Step 1: Đọc tài liệu Next.js**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`. Mọi component mới có `"use client"` vì dùng state và React Query.

- [ ] **Step 2: Thay `lib/data/baby.ts`**

```ts
import type { BabyInput } from "@/lib/rules/babyInput";
import { supabase } from "@/lib/supabase/client";
import type { Baby } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";

export async function createBaby(
  familyId: string,
  input: BabyInput,
): Promise<Baby> {
  const { data, error } = await supabase()
    .from("babies")
    .insert({ family_id: familyId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBaby(
  id: string,
  patch: Partial<BabyInput> & { feed_interval_min?: number },
): Promise<void> {
  const { data, error } = await supabase()
    .from("babies")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}
```

- [ ] **Step 3: Cho `BabyForm` sửa được bé đã có**

Trong `components/baby/BabyForm.tsx`:

1. Thay ba dòng import

```tsx
import { createBaby } from "@/lib/data/baby";
import { parseBabyForm, type BabyFormRaw } from "@/lib/rules/babyInput";
import { vnDateString } from "@/lib/rules/time";
```

bằng:

```tsx
import { createBaby, updateBaby } from "@/lib/data/baby";
import { toVietnameseError } from "@/lib/data/errors";
import {
  babyToRaw,
  parseBabyForm,
  type BabyFormRaw,
  type BabyInput,
} from "@/lib/rules/babyInput";
import { vnDateString } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
```

2. Thay

```tsx
export function BabyForm({ familyId }: { familyId: string }) {
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState<BabyFormRaw>(EMPTY);
```

bằng:

```tsx
export function BabyForm({
  familyId,
  baby,
}: {
  familyId: string;
  baby?: Baby;
}) {
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState<BabyFormRaw>(() =>
    baby ? babyToRaw(baby) : EMPTY,
  );
```

3. Thay dòng

```tsx
    mutationFn: createBaby.bind(null, familyId),
```

bằng:

```tsx
    mutationFn: async (value: BabyInput) => {
      if (baby) await updateBaby(baby.id, value);
      else await createBaby(familyId, value);
    },
```

4. Thay dòng

```tsx
    setRaw((prev) => ({ ...prev, [key]: value }));
```

bằng (sửa lại ô nào thì chữ "Đã lưu." cũ biến mất):

```tsx
    setRaw((prev) => ({ ...prev, [key]: value }));
    save.reset();
```

5. Thay khối báo lỗi cuối form

```tsx
      {save.isError && (
        <p role="alert" className="text-danger">
          Không lưu được. Thử lại sau.
        </p>
      )}
```

bằng:

```tsx
      {save.isError && (
        <p role="alert" className="text-danger">
          {baby
            ? toVietnameseError(save.error)
            : "Không lưu được. Thử lại sau."}
        </p>
      )}
      {baby && save.isSuccess && (
        <p role="status" className="text-good-ink">
          Đã lưu.
        </p>
      )}
```

Trang `/khai-bao-be` vẫn gọi `BabyForm` không có `baby`, nên hành vi khai báo lần đầu giữ nguyên. `onSuccess` sẵn có vẫn làm mới `["family-context"]`, nên trang chủ thấy tên và tuổi mới.

Run: `bun run typecheck`
Expected: không lỗi type.

- [ ] **Step 4: Tạo `components/settings/BabyProfileSection.tsx`**

```tsx
"use client";

import { BabyForm } from "@/components/baby/BabyForm";
import { formatAgeVi } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";

export function BabyProfileSection({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  const [y, m, d] = baby.dob.split("-");
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Hồ sơ bé</h2>
      {isOwner ? (
        <BabyForm familyId={baby.family_id} baby={baby} />
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted">Tên</dt>
          <dd>{baby.name}</dd>
          <dt className="text-muted">Ngày sinh</dt>
          <dd>
            {d}/{m}/{y} ({formatAgeVi(baby.dob, new Date())})
          </dd>
          <dt className="text-muted">Giới tính</dt>
          <dd>{baby.sex === "female" ? "Bé gái" : "Bé trai"}</dd>
        </dl>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Tạo `components/settings/FeedIntervalSection.tsx`**

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateBaby } from "@/lib/data/baby";
import { toVietnameseError } from "@/lib/data/errors";
import {
  FEED_INTERVAL_OPTIONS,
  formatInterval,
} from "@/lib/rules/familySettings";
import type { Baby } from "@/lib/supabase/rows";

export function FeedIntervalSection({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [minutes, setMinutes] = useState(baby.feed_interval_min);
  const save = useMutation({
    mutationFn: () => updateBaby(baby.id, { feed_interval_min: minutes }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Khoảng cách cữ bú</h2>
      <p className="text-muted">
        Dùng để tính "Cữ bú tiếp theo khoảng …" ở trang chủ.
      </p>
      {isOwner ? (
        <div className="flex gap-3">
          <select
            aria-label="Khoảng cách cữ bú"
            className="min-h-11 flex-1 rounded-xl border px-3"
            value={minutes}
            onChange={(e) => {
              setMinutes(Number(e.target.value));
              save.reset();
            }}
          >
            {FEED_INTERVAL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatInterval(option)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={save.isPending || minutes === baby.feed_interval_min}
            onClick={() => save.mutate()}
            className="min-h-11 rounded-xl bg-accent px-4 text-on-accent disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      ) : (
        <p>{formatInterval(baby.feed_interval_min)}</p>
      )}
      {save.isSuccess && (
        <p role="status" className="text-good-ink">
          Đã lưu.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(save.error)}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Thay `components/settings/SettingsScreen.tsx`**

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useThemePref } from "@/lib/hooks/useTheme";
import { roleLabel } from "@/lib/rules/familySettings";
import { supabase } from "@/lib/supabase/client";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { THEME_OPTIONS } from "@/lib/theme";
import { BabyProfileSection } from "./BabyProfileSection";
import { FeedIntervalSection } from "./FeedIntervalSection";

export function SettingsScreen({
  member,
  baby,
  email,
}: {
  member: FamilyMember;
  baby: Baby;
  email: string;
}) {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useThemePref();
  const [signingOut, setSigningOut] = useState(false);
  const isOwner = member.role === "owner";

  async function signOut() {
    setSigningOut(true);
    try {
      await supabase().auth.signOut();
      queryClient.clear();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Cài đặt</h1>

      <BabyProfileSection baby={baby} isOwner={isOwner} />
      <FeedIntervalSection baby={baby} isOwner={isOwner} />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Giao diện</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={`min-h-11 rounded-xl px-3 ${theme === option.value ? "bg-accent text-on-accent" : "bg-soft"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Ứng dụng</h2>
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center justify-between rounded-xl border px-4"
        >
          Cài Bé Yêu lên màn hình chính
          <span aria-hidden="true">›</span>
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tài khoản</h2>
        <p>
          {member.display_name} · {roleLabel(member.role)}
        </p>
        <p className="text-muted">{email}</p>
        <button
          type="button"
          disabled={signingOut}
          onClick={signOut}
          className="min-h-11 rounded-xl border disabled:opacity-50"
        >
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Truyền `baby` trong `app/cai-dat/page.tsx`**

Thay

```tsx
      {({ session, ctx }) =>
        ctx ? (
          <SettingsScreen
            member={ctx.member}
            email={session?.user.email ?? ""}
          />
        ) : null
      }
```

bằng:

```tsx
      {({ session, ctx }) =>
        ctx?.baby ? (
          <SettingsScreen
            member={ctx.member}
            baby={ctx.baby}
            email={session?.user.email ?? ""}
          />
        ) : null
      }
```

- [ ] **Step 8: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  119 passed (119)` (gồm test chặn màu cứng); `next build` thành công với 12 route như M7.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(settings): edit baby profile and feed interval"
```

---

### Task 3: Thành viên trong Cài đặt

**Files:**

- Create: `components/settings/MembersSection.tsx`
- Modify: `lib/data/family.ts` (import, thêm hàm ở cuối), `components/settings/SettingsScreen.tsx` (1 import, 1 dòng JSX)

**Interfaces:**

- Consumes: `parseMemberForm`, `roleLabel`, `MemberFormRaw`, `MemberInput`, `Role` (Task 1); `memberErrorText`, `PermissionDeniedError`; `useMembers`
- Produces:
  - `addMember(familyId: string, input: MemberInput): Promise<void>`
  - `setMemberRole(id: string, role: Role): Promise<void>` — 0 dòng thì ném `PermissionDeniedError`
  - `removeMember(id: string): Promise<void>` — 0 dòng thì ném `PermissionDeniedError`
  - `useMemberActions(familyId: string): { add; setRole; remove }` — ba `useMutation`; xong thì làm mới `["members", familyId]` và `["family-context"]`
  - `MembersSection({ me: FamilyMember })`

- [ ] **Step 1: Sửa phần import của `lib/data/family.ts`**

Thay

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Baby, Family, FamilyMember } from "@/lib/supabase/rows";
```

bằng:

```ts
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { MemberInput, Role } from "@/lib/rules/familySettings";
import { supabase } from "@/lib/supabase/client";
import type { Baby, Family, FamilyMember } from "@/lib/supabase/rows";
import { PermissionDeniedError } from "./errors";
```

- [ ] **Step 2: Thêm vào cuối `lib/data/family.ts`**

```ts
export async function addMember(
  familyId: string,
  input: MemberInput,
): Promise<void> {
  const { error } = await supabase()
    .from("family_members")
    .insert({ family_id: familyId, ...input });
  if (error) throw error;
}

export async function setMemberRole(id: string, role: Role): Promise<void> {
  const { data, error } = await supabase()
    .from("family_members")
    .update({ role })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

export async function removeMember(id: string): Promise<void> {
  const { data, error } = await supabase()
    .from("family_members")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

function invalidateFamily(queryClient: QueryClient, familyId: string) {
  void queryClient.invalidateQueries({ queryKey: ["members", familyId] });
  void queryClient.invalidateQueries({ queryKey: ["family-context"] });
}

export function useMemberActions(familyId: string) {
  const queryClient = useQueryClient();
  const onSettled = () => invalidateFamily(queryClient, familyId);
  return {
    add: useMutation({
      mutationFn: (input: MemberInput) => addMember(familyId, input),
      onSettled,
    }),
    setRole: useMutation({
      mutationFn: ({ id, role }: { id: string; role: Role }) =>
        setMemberRole(id, role),
      onSettled,
    }),
    remove: useMutation({ mutationFn: removeMember, onSettled }),
  };
}
```

`addMember` không cần `.select()`. Khi RLS chặn một lệnh `insert`, PostgREST trả lỗi `42501` chứ không trả 0 dòng.

Run: `bun run typecheck`
Expected: không lỗi type.

- [ ] **Step 3: Tạo `components/settings/MembersSection.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { memberErrorText } from "@/lib/data/errors";
import { useMemberActions, useMembers } from "@/lib/data/family";
import {
  parseMemberForm,
  roleLabel,
  type MemberFormRaw,
} from "@/lib/rules/familySettings";
import type { FamilyMember } from "@/lib/supabase/rows";

const EMPTY: MemberFormRaw = { email: "", displayName: "", role: "member" };
const FIELD = "min-h-11 rounded-xl border px-3";

export function MembersSection({ me }: { me: FamilyMember }) {
  const members = useMembers(me.family_id);
  const { add, setRole, remove } = useMemberActions(me.family_id);
  const [raw, setRaw] = useState<MemberFormRaw>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof MemberFormRaw, string>>
  >({});
  const isOwner = me.role === "owner";
  const failure = add.error ?? setRole.error ?? remove.error;
  const busy = add.isPending || setRole.isPending || remove.isPending;

  function clearErrors() {
    add.reset();
    setRole.reset();
    remove.reset();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    clearErrors();
    const result = parseMemberForm(raw);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    add.mutate(result.value, { onSuccess: () => setRaw(EMPTY) });
  }

  function confirmRemove(member: FamilyMember) {
    if (
      window.confirm(
        `Xóa ${member.display_name} (${member.email}) khỏi gia đình?`,
      )
    ) {
      clearErrors();
      remove.mutate(member.id);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Thành viên</h2>
      {members.isPending && <p className="text-muted">Đang tải…</p>}
      {members.isError && (
        <p role="alert" className="text-danger">
          {memberErrorText(members.error)}
        </p>
      )}
      <ul className="divide-y rounded-2xl border">
        {(members.data ?? []).map((member) => {
          const self = member.id === me.id;
          return (
            <li key={member.id} className="flex flex-col gap-2 p-3">
              <div>
                <p className="font-medium">
                  {member.display_name}
                  {self && " (bạn)"} · {roleLabel(member.role)}
                </p>
                <p className="text-sm text-muted">
                  {member.email}
                  {member.user_id === null && " · chưa đăng nhập lần nào"}
                </p>
              </div>
              {isOwner && !self && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      clearErrors();
                      setRole.mutate({
                        id: member.id,
                        role: member.role === "owner" ? "member" : "owner",
                      });
                    }}
                    className="min-h-11 flex-1 rounded-xl border disabled:opacity-50"
                  >
                    {member.role === "owner"
                      ? "Đổi thành Thành viên"
                      : "Đổi thành Chủ gia đình"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirmRemove(member)}
                    className="min-h-11 rounded-xl px-4 text-danger disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {failure && (
        <p role="alert" className="text-danger">
          {memberErrorText(failure)}
        </p>
      )}
      {isOwner ? (
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-2xl border border-accent-line p-4"
        >
          <h3 className="font-medium">Thêm người vào gia đình</h3>
          <label className="flex flex-col gap-1">
            Gmail
            <input
              type="email"
              autoCapitalize="none"
              className={FIELD}
              value={raw.email}
              onChange={(e) => setRaw({ ...raw, email: e.target.value })}
            />
            {errors.email && (
              <span className="text-sm text-danger">{errors.email}</span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            Tên hiển thị (ví dụ Bà nội)
            <input
              className={FIELD}
              maxLength={40}
              value={raw.displayName}
              onChange={(e) => setRaw({ ...raw, displayName: e.target.value })}
            />
            {errors.displayName && (
              <span className="text-sm text-danger">{errors.displayName}</span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            Vai trò
            <select
              className={FIELD}
              value={raw.role}
              onChange={(e) => setRaw({ ...raw, role: e.target.value })}
            >
              <option value="member">Thành viên</option>
              <option value="owner">Chủ gia đình</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-xl bg-accent text-on-accent disabled:opacity-50"
          >
            Thêm
          </button>
          <p className="text-sm text-muted">
            Người được thêm chỉ cần mở Bé Yêu và đăng nhập Google bằng đúng
            Gmail này.
          </p>
        </form>
      ) : (
        <p className="text-sm text-muted">
          Chỉ chủ gia đình mới thêm, xóa hoặc đổi vai trò thành viên.
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Gắn phần Thành viên vào `SettingsScreen`**

Trong `components/settings/SettingsScreen.tsx`, thêm import ngay sau dòng `import { FeedIntervalSection } from "./FeedIntervalSection";`:

```tsx
import { MembersSection } from "./MembersSection";
```

Rồi thêm một dòng ngay sau `<FeedIntervalSection baby={baby} isOwner={isOwner} />`:

```text
      <MembersSection me={member} />
```

(Dòng JSX, không có dấu `;`.)

- [ ] **Step 5: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  119 passed (119)`; `next build` thành công với 12 route.

- [ ] **Step 6: 👤 Kiểm tra tay trên localhost**

Run: `bun run dev`. Mở `http://localhost:3000/cai-dat` trong Claude in Chrome: bắt đầu bằng `tabs_context_mcp`, mở tab mới bằng `tabs_create_mcp`. Nếu Chrome không kết nối được, hỏi người dùng dùng trình duyệt nào trước khi đổi. Nhờ người dùng tự đăng nhập Google nếu cần, bằng tài khoản owner. Kiểm tra cùng người dùng:

1. "Cài đặt" hiện lần lượt Hồ sơ bé (form đã điền sẵn tên, ngày sinh, giới tính, số đo), Khoảng cách cữ bú, Thành viên, Giao diện, Ứng dụng, Tài khoản.
2. Thêm ` thử` vào cuối tên bé → Lưu → hiện "Đã lưu."; tab "Trang chủ" hiện tên mới. Quay lại, sửa về tên cũ → Lưu.
3. Xóa trống ô tên → Lưu → hiện "Nhập tên bé (tối đa 60 ký tự)", không lưu. Tải lại trang để bỏ thay đổi.
4. Khoảng cách cữ bú: ghi lại giá trị hiện tại (thường "3 giờ"), chọn "2 giờ 30 phút" → Lưu → "Đã lưu.". Trang chủ: "Cữ bú tiếp theo khoảng HH:mm" bằng giờ cữ gần nhất cộng 2 giờ 30 phút. Đặt lại giá trị cũ → Lưu.
5. Thành viên: dòng của mình ghi "(bạn) · Chủ gia đình", không có nút.
6. Thêm Gmail `thu.m8@example.com`, tên `Khách thử`, vai trò Thành viên → Thêm → danh sách có dòng mới "Khách thử · Thành viên", dưới là "thu.m8@example.com · chưa đăng nhập lần nào"; form trống lại.
7. Thêm lại đúng Gmail đó → hiện "Gmail này đã có trong gia đình.". Nhập `abc` vào ô Gmail → "Nhập Gmail hợp lệ" và câu lỗi trùng Gmail biến mất.
8. Ở dòng "Khách thử" bấm "Đổi thành Chủ gia đình" → vai trò đổi; bấm "Đổi thành Thành viên" → đổi lại.
9. Bấm "Xóa" ở dòng "Khách thử" → xác nhận → dòng biến mất.
10. (Chỉ khi gia đình có tài khoản member khác) Đăng nhập bằng member → Hồ sơ bé chỉ là bảng thông tin, Khoảng cách cữ bú chỉ có chữ, Thành viên không có nút và không có form thêm.

- [ ] **Step 7: Commit và deploy**

```bash
git add -A && git commit -m "feat(settings): manage family members"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app. Nhờ người dùng mở PWA trên iPhone 16 hoặc 17 Pro, vào "Cài đặt", lặp lại bước 4 và 6–9 của Step 6, rồi xác nhận đạt.

---

## Ngoài phạm vi M8

- M9: service worker §8.4, offline outbox §9, push `feed` §8, pg_cron + Vault, phần Thông báo của `/cai-dat` (bật trên máy này, 3 công tắc, Tạm tắt 2/4/8 giờ), nút "Bật thông báo" của `/cai-app`, checklist thiết bị bước 1–4 và 7.
- M9 (§9): khi offline, các nút ghi hồ sơ bé, khoảng cách cữ bú và thành viên bị tắt kèm chú thích "Cần kết nối mạng". M8 chỉ báo lỗi mạng khi bấm.
- Đợt 2: Thông tin khẩn cấp (nhóm máu, dị ứng, ghi chú của bé), chọn vaccine ở hồ sơ bé §6.1/§6.8.
