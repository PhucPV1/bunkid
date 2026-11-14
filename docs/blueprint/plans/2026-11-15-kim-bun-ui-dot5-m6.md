# Kim Bun UI — Đợt 5 / M6 (Bên trong Cài đặt, Offline, Cài app) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm lại phần ruột của 3 trang con Cài đặt (Hồ sơ bé, Khoảng cách cữ bú, Thành viên) và 2 màn Offline, Cài app theo spec §6.8, §9, §10 và §3.4. Bỏ tiêu đề `h2` bị lặp với `PageHeader`. Dùng thẻ kính, `ListGroup`, ô nhập kiểu mới, `Segmented`. Thay "Đang tải…" bằng `Skeleton`, lỗi tải bằng `ErrorCard`. Màn Cài app có logo 64 kèm wordmark 28.

**Architecture:**

- Ba section Cài đặt giữ nguyên chữ ký, dữ liệu và luật:
  - `updateBaby`, `useMembers`, `useMemberActions`, `parseMemberForm`.
  - Câu hỏi xác nhận xóa thành viên giữ nguyên.
  - Quyền giữ nguyên: chỉ owner được sửa.
- `app/offline/page.tsx` chỉ còn giữ phần dò cache. Giao diện tách ra `components/offline/OfflineView.tsx` để test được, vì file `page.tsx` của App Router không được export thêm gì.
- `InstallGuide` tách phần giao diện thành `InstallGuideView({ standalone })` để test. Phần dò `standalone` vẫn chạy trong `useEffect` như cũ.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 5:**

| Mốc               | Nội dung                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1–M5             | Mọi màn trong Khám phá, Nhật ký, Thống kê, Đăng nhập, Chưa được mời, Khai báo bé, màn chờ / lỗi của `AuthGate`. Đã xong trên nhánh `feat/kim-bun-dot5-m5`                    |
| **M6 (plan này)** | Bên trong 3 trang con Cài đặt, Offline, Cài app                                                                                                                              |
| M7                | Trang chủ lúc đang tải / lỗi, dòng đồng bộ dưới header, nhãn bị xuống dòng, ô chọn ảnh tiếng Anh, thanh dung lượng ở Ban đêm, xóa token cũ, checklist cuối (§11.2 bước 7, 8) |

**Quyết định cho chỗ spec chưa nói rõ:**

- **Hồ sơ bé:**
  - Owner thấy `BabyForm` (đã làm lại ở M5) trong thẻ kính.
  - Người khác thấy `ListGroup` 3 hàng, chỉ đọc, không có chevron:
    - "Tên": tên bé.
    - "Ngày sinh": dd/mm/yyyy, tuổi để ở dòng phụ.
    - "Giới tính".
- **Cữ bú:**
  - Owner thấy thẻ kính gồm:
    - ô chọn `select` kiểu `FIELD_INPUT` (21 lựa chọn, `Segmented` không chứa nổi);
    - câu gợi ý;
    - nút "Lưu" lớn, bị tắt khi giá trị chưa đổi (như cũ).
  - Người khác thấy một hàng `ListGroup` (icon `clock`, màu `cat-feed`, giá trị "X giờ"), câu gợi ý nằm dưới.
- **Thành viên:**
  - **Danh sách:** `ListGroup`. Mỗi thành viên một hàng: tên · vai trò, Gmail ở dòng phụ.
  - **Nút của owner** (trong cùng hàng):
    - "Đổi thành …": `Button` `secondary` `md`.
    - "Xóa": `Button` `ghost` `md`, chữ `--color-danger`.
  - **Đang tải:** 3 khối `Skeleton` cao 60.
  - **Lỗi tải:** `ErrorCard` với `memberErrorText` và nút "Thử lại" (gọi `refetch`).
  - **Form thêm người:** thẻ kính. Vai trò chọn bằng `Segmented` Thành viên / Chủ gia đình, thay `select`.
- **Offline:**
  - `PageHeader` "Bạn đang offline", không có nút quay lại.
  - Thẻ kính chứa câu hướng dẫn và nút "Thử lại" lớn.
  - Các trang đã lưu nằm trong `ListGroup` tiêu đề **"Xem được khi offline"** (chữ mới, spec §9 đòi `ListGroup`). Mỗi hàng là thẻ `<a>` thường, không dùng `Link`, để trình duyệt tải hẳn trang từ cache của service worker như cũ.
- **Cài app:**
  - `PageHeader` "Cài Kim Bun" với nút quay lại về `/`, nhãn "Quay lại", giống link cũ. Màn này mở được cả khi chưa đăng nhập (từ màn Đăng nhập). Vì vậy cố ý không dùng nhãn "Cài đặt" như các trang con khác.
  - Dưới header là `BrandMark size="md" heading={false}`: logo 64, wordmark 28. Không dùng `h1` thứ hai.
  - Câu báo đã cài: thẻ kính có icon `check` màu `--color-good`.
  - Câu báo phải cài: thẻ kính có icon `bell` màu `--color-warn`.
  - 3 bước cài là `ListGroup` tiêu đề **"Cách cài"** (chữ mới), số thứ tự nằm trong vòng tròn `bg-accent`. Vì đã có số trong vòng tròn, các tiền tố "1. ", "2. ", "3. " được bỏ khỏi câu.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`. Không tải font web.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI. Mũi tên chữ "←" cũng thay bằng nút quay lại của `PageHeader` (icon `chevronLeft`).
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh: không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test.
- Không dùng `ListRow iconColor="accent"`: ở Ban đêm chỉ đạt 1.88:1. Chữ thường trên kính dùng `text-ink` / `text-muted`; chữ lỗi `text-danger`.
- **Không đổi dữ liệu, luật, quyền:**
  - Không đổi cách lưu hồ sơ bé, cữ bú, thêm / đổi vai trò / xóa thành viên.
  - Câu xác nhận xóa giữ nguyên.
  - Quyền giữ nguyên: chỉ owner sửa.
  - `OnlineOnly` của `SettingsSubpage` giữ nguyên.
- **Chữ người dùng thấy giữ nguyên**, trừ chỗ plan ghi rõ:
  - Bỏ `h2` lặp: "Hồ sơ bé", "Khoảng cách cữ bú", "Thành viên".
  - "Đang tải…" thành `Skeleton`.
  - Thêm 2 tiêu đề nhóm "Xem được khi offline" và "Cách cài".
  - Bỏ tiền tố số "1. ", "2. ", "3. " ở bước cài.
  - Hồ sơ bé (người xem): tuổi chuyển từ trong ngoặc sau ngày sinh xuống dòng phụ.
  - Cữ bú: `aria-label` của ô chọn thành nhãn hiện ra, chữ "Khoảng cách cữ bú".
  - "← Quay lại" thành nút quay lại "Quay lại" của `PageHeader`.
- Vùng chạm tối thiểu 44×44 pt. Khoảng an toàn tai thỏ đã do `body` lo; màn hình chỉ dùng padding thường (`px-4 pt-2 pb-4`), **không** thêm `env(safe-area-inset-*)`.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình.** Khi kiểm tay **không bấm "Lưu", "Thêm", "Đổi thành …", "Xóa", "Đăng xuất"**, không bật / tắt thông báo.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot5-m5`):

- `components/ui/`: `PageHeader`, `Button`, `Glass`, `Segmented`, `Skeleton`, `ErrorCard`, `ListGroup`, `ListRow`, `Icon`.
- `components/quick/styles.ts`: `FIELD_LABEL`, `FIELD_INPUT`.
- `components/brand/BrandMark.tsx`: `BrandMark({ size?: "lg" | "md"; tagline?: string; heading?: boolean })` (Đợt 5 / M5).
- `components/baby/BabyForm.tsx` (Đợt 5 / M5), `components/OnlineOnly.tsx`, `components/push/DevicePushControl.tsx`.
- `lib/data/baby.ts`: `updateBaby`. `lib/data/errors.ts`: `toVietnameseError`, `memberErrorText`. `lib/data/family.ts`: `useMembers`, `useMemberActions`. `lib/rules/familySettings.ts`: `FEED_INTERVAL_OPTIONS`, `formatInterval`, `parseMemberForm`, `roleLabel`, `MemberFormRaw`. `lib/rules/time.ts`: `formatAgeVi`.

**Produces** (M7 dùng):

- `BabyProfileSection({ baby, isOwner })`, `FeedIntervalSection({ baby, isOwner })`, `MembersSection({ me })`: cùng chữ ký, giao diện mới.
- `components/offline/OfflineView.tsx`: `type Guide = { href: string; label: string }`, `GUIDES: Guide[]`, `OfflineView({ cached: Guide[]; onRetry: () => void })`.
- `components/install/InstallGuide.tsx`: `InstallGuide()` (như cũ) và `InstallGuideView({ standalone: boolean | null })`.

---

### Task 1: Hồ sơ bé và Khoảng cách cữ bú

**Files:**

- Modify: `components/settings/BabyProfileSection.tsx`, `components/settings/FeedIntervalSection.tsx` (viết lại toàn file)
- Create: `components/settings/sections.test.tsx`

**Interfaces:**

- Consumes: `BabyForm`; `Glass`, `Button`, `ListGroup`, `ListRow`; `FIELD_LABEL`, `FIELD_INPUT`; `updateBaby`, `toVietnameseError`, `FEED_INTERVAL_OPTIONS`, `formatInterval`, `formatAgeVi`.
- Produces: `BabyProfileSection({ baby, isOwner })`, `FeedIntervalSection({ baby, isOwner })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/settings/sections.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby } from "@/lib/supabase/rows";
import { BabyProfileSection } from "./BabyProfileSection";
import { FeedIntervalSection } from "./FeedIntervalSection";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
  sex: "male",
  birth_weight_g: 3200,
  birth_length_cm: null,
  birth_head_cm: null,
  feed_interval_min: 180,
} as Baby;

const render = (node: ReactNode) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {node}
    </QueryClientProvider>,
  );

describe("BabyProfileSection", () => {
  it("owner: the baby form in a glass card, no repeated heading", () => {
    const html = render(<BabyProfileSection baby={baby} isOwner />);
    expect(html).not.toContain("<h2");
    expect(html).toMatch(/class="glass[^"]*p-4"/);
    expect(html).toContain('value="Bun"');
    expect(html).toMatch(/type="submit"[^>]*>Lưu<\/button>/);
  });

  it("viewer: a read-only list with name, birth date and sex, no chevrons", () => {
    const html = render(<BabyProfileSection baby={baby} isOwner={false} />);
    expect(html).not.toContain("<h2");
    expect(html).toContain("glass overflow-hidden rounded-[22px]");
    expect(html).toContain(">Tên</span>");
    expect(html).toContain(">Bun</span>");
    expect(html).toContain(">10/09/2026</span>");
    expect(html).toContain(">Bé trai</span>");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<a ");
  });
});

describe("FeedIntervalSection", () => {
  it("owner: a field-styled select, the hint and a large Lưu that starts disabled", () => {
    const html = render(<FeedIntervalSection baby={baby} isOwner />);
    expect(html).not.toContain("<h2");
    expect(html).toContain(">Khoảng cách cữ bú</span>");
    expect(html).toMatch(/<select[^>]*class="glass min-h-11/);
    expect(html).toContain('<option value="180" selected="">3 giờ</option>');
    expect(html).toContain("Cữ bú tiếp theo khoảng");
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*min-h-\[50px\][^>]*>Lưu<\/button>/,
    );
  });

  it("viewer: one list row with the clock icon and the value", () => {
    const html = render(<FeedIntervalSection baby={baby} isOwner={false} />);
    expect(html).not.toContain("<select");
    expect(html).toContain("bg-cat-feed");
    expect(html).toContain(">Khoảng cách cữ bú</span>");
    expect(html).toContain(">3 giờ</span>");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/settings/sections.test.tsx`
Expected: FAIL cả 4 test. 3 test đầu hỏng vì bản cũ có `<h2`. Test thứ 4 (người xem cữ bú) hỏng ở `bg-cat-feed`, vì bản cũ chỉ in chữ trần.

- [ ] **Step 3: Viết lại `components/settings/BabyProfileSection.tsx`**

```tsx
"use client";

import { BabyForm } from "@/components/baby/BabyForm";
import { Glass } from "@/components/ui/Glass";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { formatAgeVi } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";

export function BabyProfileSection({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  if (isOwner)
    return (
      <Glass className="p-4">
        <BabyForm familyId={baby.family_id} baby={baby} />
      </Glass>
    );
  const [y, m, d] = baby.dob.split("-");
  return (
    <ListGroup>
      <ListRow label="Tên" value={baby.name} />
      <ListRow
        label="Ngày sinh"
        detail={formatAgeVi(baby.dob, new Date())}
        value={`${d}/${m}/${y}`}
      />
      <ListRow
        label="Giới tính"
        value={baby.sex === "female" ? "Bé gái" : "Bé trai"}
      />
    </ListGroup>
  );
}
```

- [ ] **Step 4: Viết lại `components/settings/FeedIntervalSection.tsx`**

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { updateBaby } from "@/lib/data/baby";
import { toVietnameseError } from "@/lib/data/errors";
import {
  FEED_INTERVAL_OPTIONS,
  formatInterval,
} from "@/lib/rules/familySettings";
import type { Baby } from "@/lib/supabase/rows";

const HINT = 'Dùng để tính "Cữ bú tiếp theo khoảng …" ở trang chủ.';

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
    <div className="flex flex-col gap-3">
      {isOwner ? (
        <Glass className="flex flex-col gap-3 p-4">
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Khoảng cách cữ bú</span>
            <select
              className={`${FIELD_INPUT} tabular-nums accent-accent`}
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
          </label>
          <p className="text-[13px] text-muted">{HINT}</p>
          <Button
            size="lg"
            block
            busy={save.isPending}
            disabled={minutes === baby.feed_interval_min}
            onClick={() => save.mutate()}
          >
            Lưu
          </Button>
        </Glass>
      ) : (
        <>
          <ListGroup>
            <ListRow
              icon="clock"
              iconColor="cat-feed"
              label="Khoảng cách cữ bú"
              value={formatInterval(baby.feed_interval_min)}
            />
          </ListGroup>
          <p className="px-4 text-[13px] text-muted">{HINT}</p>
        </>
      )}
      {save.isSuccess && (
        <p role="status" className="px-1 text-[15px] text-good-ink">
          Đã lưu.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {toVietnameseError(save.error)}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/settings lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS: sections 4, cùng các test có sẵn trong `components/settings` (appearance, notifications, subpage) và themeGuard 1. Typecheck không lỗi. Nếu React 19 in thuộc tính `<option>` khác `value="180" selected=""`, sửa assertion cho khớp đúng chuỗi React in ra, và ghi lại trong báo cáo.

- [ ] **Step 6: Commit**

```bash
git add components/settings/BabyProfileSection.tsx components/settings/FeedIntervalSection.tsx components/settings/sections.test.tsx
git commit -m "feat(settings): glass Hồ sơ bé and Cữ bú without repeated headings"
```

---

### Task 2: Thành viên

**Files:**

- Modify: `components/settings/MembersSection.tsx` (viết lại toàn file)
- Create: `components/settings/members.test.tsx`

**Interfaces:**

- Consumes: `Button`, `ListGroup`, `Segmented`, `Skeleton`, `ErrorCard`; `FIELD_LABEL`, `FIELD_INPUT`; `useMembers`, `useMemberActions`, `memberErrorText`, `parseMemberForm`, `roleLabel`, `MemberFormRaw`.
- Produces: `MembersSection({ me })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/settings/members.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FamilyMember } from "@/lib/supabase/rows";
import { MembersSection } from "./MembersSection";

const owner: FamilyMember = {
  id: "m1",
  family_id: "f1",
  user_id: "u1",
  display_name: "Mẹ",
  email: "me@example.com",
  role: "owner",
  created_at: "2026-09-10T00:00:00Z",
};
const grandma: FamilyMember = {
  id: "m2",
  family_id: "f1",
  user_id: null,
  display_name: "Bà nội",
  email: "ba@example.com",
  role: "member",
  created_at: "2026-09-11T00:00:00Z",
};

function render(me: FamilyMember, members?: FamilyMember[]) {
  const client = new QueryClient();
  if (members) client.setQueryData(["members", "f1"], members);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <MembersSection me={me} />
    </QueryClientProvider>,
  );
}

describe("MembersSection", () => {
  it("loading shows skeleton rows, not text", () => {
    const html = render(owner);
    expect(html).toContain('aria-busy="true"');
    expect(html.match(/kb-pulse/g)).toHaveLength(3);
    expect(html).not.toContain("Đang tải…");
    // The add form's own h2 is expected; only the old repeated page heading must be gone.
    expect(html).not.toContain(">Thành viên</h2>");
  });

  it("owner: a glass member list with role and remove buttons, and a glass add form", () => {
    const html = render(owner, [owner, grandma]);
    expect(html).toContain("glass overflow-hidden rounded-[22px]");
    expect(html).toContain(">Mẹ (bạn) · Chủ gia đình</span>");
    expect(html).toContain(">ba@example.com · chưa đăng nhập lần nào</span>");
    expect(html).toContain(">Đổi thành Chủ gia đình</button>");
    expect(html).toMatch(/class="[^"]*text-danger![^"]*"[^>]*>Xóa<\/button>/);
    expect(html).toMatch(/<form[^>]*novalidate=""[^>]*class="glass/i);
    expect(html).toContain(">Thêm người vào gia đình</h2>");
    expect(html).toContain('aria-label="Vai trò"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Thành viên<\/button>/);
    expect(html).not.toContain("<select");
    expect(html).toMatch(
      /type="submit"[^>]*min-h-\[50px\][^>]*>Thêm<\/button>/,
    );
  });

  it("member: the list without buttons and the owner-only note", () => {
    const html = render(grandma, [owner, grandma]);
    expect(html).not.toContain("Đổi thành");
    expect(html).not.toContain("<form");
    expect(html).toContain(
      "Chỉ chủ gia đình mới thêm, xóa hoặc đổi vai trò thành viên.",
    );
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/settings/members.test.tsx`
Expected: 2 test FAIL. Lúc chờ, bản cũ in "Đang tải…". Danh sách thì nằm trong `<ul className="divide-y rounded-2xl border">`. Test "member" đã xanh ngay trên bản cũ, như vậy là đúng.

- [ ] **Step 3: Viết lại `components/settings/MembersSection.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { ListGroup } from "@/components/ui/ListGroup";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { memberErrorText } from "@/lib/data/errors";
import { useMemberActions, useMembers } from "@/lib/data/family";
import {
  parseMemberForm,
  roleLabel,
  type MemberFormRaw,
} from "@/lib/rules/familySettings";
import type { FamilyMember } from "@/lib/supabase/rows";

const EMPTY: MemberFormRaw = { email: "", displayName: "", role: "member" };

const ROLES = [
  { value: "member", label: "Thành viên" },
  { value: "owner", label: "Chủ gia đình" },
];

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
    <div className="flex flex-col gap-6">
      {members.isPending && (
        <div aria-busy="true" className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[60px]" />
          ))}
        </div>
      )}
      {members.isError && (
        <ErrorCard
          message={memberErrorText(members.error)}
          onRetry={() => void members.refetch()}
        />
      )}
      {members.data && (
        <ListGroup>
          {members.data.map((member) => {
            const self = member.id === me.id;
            return (
              <li
                key={member.id}
                className="flex flex-col gap-2 border-b border-line px-4 py-3 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="text-base font-medium text-ink">
                    {member.display_name}
                    {self && " (bạn)"} · {roleLabel(member.role)}
                  </span>
                  <span className="text-[13px] text-muted">
                    {member.email}
                    {member.user_id === null && " · chưa đăng nhập lần nào"}
                  </span>
                </div>
                {isOwner && !self && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      disabled={busy}
                      onClick={() => {
                        clearErrors();
                        setRole.mutate({
                          id: member.id,
                          role: member.role === "owner" ? "member" : "owner",
                        });
                      }}
                    >
                      {member.role === "owner"
                        ? "Đổi thành Thành viên"
                        : "Đổi thành Chủ gia đình"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      className="text-danger!"
                      disabled={busy}
                      onClick={() => confirmRemove(member)}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ListGroup>
      )}
      {failure && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {memberErrorText(failure)}
        </p>
      )}
      {isOwner ? (
        // Glass's prop type has no noValidate, so the form carries the glass class itself.
        <form
          noValidate
          onSubmit={submit}
          className="glass flex flex-col gap-3 rounded-[22px] p-4"
        >
          <h2 className="text-[17px] font-semibold text-ink">
            Thêm người vào gia đình
          </h2>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Gmail</span>
            <input
              type="email"
              autoCapitalize="none"
              className={FIELD_INPUT}
              value={raw.email}
              onChange={(e) => setRaw({ ...raw, email: e.target.value })}
            />
            {errors.email && (
              <span className="text-[13px] text-danger">{errors.email}</span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Tên hiển thị (ví dụ Bà nội)</span>
            <input
              className={FIELD_INPUT}
              maxLength={40}
              value={raw.displayName}
              onChange={(e) => setRaw({ ...raw, displayName: e.target.value })}
            />
            {errors.displayName && (
              <span className="text-[13px] text-danger">
                {errors.displayName}
              </span>
            )}
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Vai trò</span>
            <Segmented
              label="Vai trò"
              options={ROLES}
              value={raw.role}
              onChange={(role) => setRaw({ ...raw, role })}
            />
          </div>
          <Button type="submit" size="lg" block busy={busy}>
            Thêm
          </Button>
          <p className="text-[13px] text-muted">
            Người được thêm chỉ cần mở Kim Bun và đăng nhập Google bằng đúng
            Gmail này.
          </p>
        </form>
      ) : (
        <p className="px-4 text-[13px] text-muted">
          Chỉ chủ gia đình mới thêm, xóa hoặc đổi vai trò thành viên.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/settings lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS: members 3, sections 4, cùng các test có sẵn của `components/settings` và themeGuard 1. Typecheck không lỗi. Nếu React 19 in `noValidate` thành chuỗi khác `novalidate=""`, sửa regex (đã để cờ `i`) cho khớp đúng chuỗi React in ra, và ghi lại trong báo cáo.

- [ ] **Step 5: Commit**

```bash
git add components/settings/MembersSection.tsx components/settings/members.test.tsx
git commit -m "feat(settings): glass Thành viên with skeleton, retry card and a role picker"
```

---

### Task 3: Offline và Cài app; kiểm toàn bộ

**Files:**

- Create: `components/offline/OfflineView.tsx`, `components/offline/offline.test.tsx`, `components/install/install.test.tsx`
- Modify: `app/offline/page.tsx`, `components/install/InstallGuide.tsx` (viết lại toàn file)

**Interfaces:**

- Consumes: `PageHeader`, `Glass`, `Button`, `ListGroup`, `Icon`; `BrandMark`; `OnlineOnly`, `DevicePushControl`.
- Produces: `Guide`, `GUIDES`, `OfflineView({ cached, onRetry })`; `InstallGuide()`, `InstallGuideView({ standalone })`.

- [ ] **Step 1: Viết test hỏng**

`components/offline/offline.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GUIDES, OfflineView } from "./OfflineView";

describe("OfflineView", () => {
  it("a large title, a glass retry card and the cached guides as plain links", () => {
    const html = renderToStaticMarkup(
      <OfflineView cached={GUIDES.slice(0, 2)} onRetry={() => {}} />,
    );
    expect(html).toContain(">Bạn đang offline</h1>");
    expect(html).toContain("Những trang đã mở trước đó vẫn xem được.");
    expect(html).toMatch(/min-h-\[50px\][^>]*>Thử lại<\/button>/);
    expect(html).toContain(">Xem được khi offline</h2>");
    expect(html).toContain('<a href="/khan-cap"');
    expect(html).toContain("Thông tin khẩn cấp");
    expect(html).not.toContain('href="/trieu-chung"');
    expect(html).not.toContain("divide-y");
  });

  it("no list when nothing is cached", () => {
    const html = renderToStaticMarkup(
      <OfflineView cached={[]} onRetry={() => {}} />,
    );
    expect(html).not.toContain("Xem được khi offline");
  });
});
```

`components/install/install.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InstallGuideView } from "./InstallGuide";

describe("InstallGuideView", () => {
  it("not installed: header with a back pill, logo 64, warning card and numbered steps", () => {
    const html = renderToStaticMarkup(<InstallGuideView standalone={false} />);
    expect(html).toContain(">Cài Kim Bun</h1>");
    expect(html).toContain('href="/"');
    expect(html).toContain("Quay lại</a>");
    expect(html).not.toContain("←");
    expect(html).toContain('width="64"');
    expect(html).toMatch(/<p[^>]*text-\[28px\][^>]*>Kim Bun<\/p>/);
    expect(html).toContain("thì iPhone mới nhận được thông báo.");
    expect(html).toContain(">Cách cài</h2>");
    expect(html).toContain("<strong>Thêm vào MH chính</strong>");
    expect(html).toMatch(/bg-accent[^>]*>3<\/span>/);
    expect(html).not.toContain("1. Mở trang");
  });

  it("before the check runs: only the header and the brand", () => {
    const html = renderToStaticMarkup(<InstallGuideView standalone={null} />);
    expect(html).toContain(">Cài Kim Bun</h1>");
    expect(html).not.toContain("Cách cài");
    expect(html).not.toContain("đã được cài");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/offline components/install`
Expected: FAIL. Chưa có module `./OfflineView`, và `InstallGuideView` chưa được export (import ra `undefined`, nên React báo `Element type is invalid`).

- [ ] **Step 3: Viết `components/offline/OfflineView.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";

export type Guide = { href: string; label: string };

export const GUIDES: Guide[] = [
  { href: "/khan-cap", label: "Thông tin khẩn cấp" },
  { href: "/tiem-chung", label: "Tiêm chủng" },
  { href: "/trieu-chung", label: "Triệu chứng" },
  { href: "/bong-be", label: "Bồng bế" },
  { href: "/phat-trien", label: "Phát triển" },
];

export function OfflineView({
  cached,
  onRetry,
}: {
  cached: Guide[];
  onRetry: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader title="Bạn đang offline" />
      <Glass className="flex flex-col gap-4 p-4">
        <p className="text-base text-ink">
          Kết nối mạng rồi bấm Thử lại. Những trang đã mở trước đó vẫn xem được.
        </p>
        <Button size="lg" block onClick={onRetry}>
          Thử lại
        </Button>
      </Glass>
      {cached.length > 0 && (
        <ListGroup title="Xem được khi offline">
          {cached.map((guide) => (
            <li
              key={guide.href}
              className="border-b border-line last:border-b-0"
            >
              {/* A plain link, so the browser loads the page the service worker cached. */}
              <a
                href={guide.href}
                className="flex min-h-[52px] items-center gap-3 px-4 text-base text-ink"
              >
                {guide.label}
                <Icon
                  name="chevronRight"
                  size={16}
                  className="ml-auto text-muted"
                />
              </a>
            </li>
          ))}
        </ListGroup>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Viết lại `app/offline/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  GUIDES,
  OfflineView,
  type Guide,
} from "@/components/offline/OfflineView";

export default function Page() {
  const [cached, setCached] = useState<Guide[]>([]);

  useEffect(() => {
    if (!("caches" in window)) return;
    void Promise.all(
      GUIDES.map(async (guide) =>
        (await caches.match(guide.href)) ? guide : null,
      ),
    ).then((found) => setCached(found.filter((g): g is Guide => g !== null)));
  }, []);

  return (
    <OfflineView cached={cached} onRetry={() => window.location.reload()} />
  );
}
```

- [ ] **Step 5: Viết lại `components/install/InstallGuide.tsx`**

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { OnlineOnly } from "@/components/OnlineOnly";
import { DevicePushControl } from "@/components/push/DevicePushControl";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const STEPS: ReactNode[] = [
  <>
    Mở trang này bằng Safari, bấm nút <strong>Chia sẻ</strong> (hình vuông có
    mũi tên đi lên).
  </>,
  <>
    Chọn <strong>Thêm vào MH chính</strong>, rồi bấm <strong>Thêm</strong>.
  </>,
  <>Mở Kim Bun từ biểu tượng mới trên màn hình chính và đăng nhập lại.</>,
];

export function InstallGuideView({
  standalone,
}: {
  standalone: boolean | null;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader title="Cài Kim Bun" back={{ href: "/", label: "Quay lại" }} />
      <BrandMark size="md" heading={false} />
      {standalone === true && (
        <>
          <Glass className="flex items-start gap-3 p-4">
            <Icon
              name="check"
              size={22}
              className="mt-0.5 shrink-0 text-good"
            />
            <p className="text-base text-ink">
              Kim Bun đã được cài và đang chạy từ màn hình chính.
            </p>
          </Glass>
          <OnlineOnly>
            <DevicePushControl />
          </OnlineOnly>
        </>
      )}
      {standalone === false && (
        <>
          <Glass className="flex items-start gap-3 p-4">
            <Icon name="bell" size={22} className="mt-0.5 shrink-0 text-warn" />
            <p className="text-base text-ink">
              Phải cài Kim Bun lên màn hình chính thì iPhone mới nhận được thông
              báo.
            </p>
          </Glass>
          <ListGroup title="Cách cài">
            {STEPS.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-on-accent">
                  {i + 1}
                </span>
                <p className="pt-1 text-base text-ink">{step}</p>
              </li>
            ))}
          </ListGroup>
        </>
      )}
    </main>
  );
}

export function InstallGuide() {
  const [standalone, setStandalone] = useState<boolean | null>(null);
  useEffect(() => setStandalone(isStandalone()), []);
  return <InstallGuideView standalone={standalone} />;
}
```

- [ ] **Step 6: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected:

- Typecheck không lỗi.
- Mọi test xanh. Số test là 644 có sẵn + 4 sections + 3 members + 2 offline + 2 install = 655.
- Build xong.

- [ ] **Step 7: Kiểm trên trình duyệt (không lưu, không thêm, không xóa)**

Run: `bun run dev`. Mở ở bề rộng 375 px.

**Không bấm** "Lưu", "Thêm", "Đổi thành …", "Xóa", "Đăng xuất", không bật / tắt thông báo.

Expected:

- `/cai-dat/ho-so`: không còn tiêu đề "Hồ sơ bé" thứ hai. Owner thấy form trong thẻ kính, giới tính là nút gạt.
- `/cai-dat/cu-bu`: thẻ kính có ô chọn, câu gợi ý, nút "Lưu" mờ vì chưa đổi giá trị.
- `/cai-dat/thanh-vien`:
  - Lúc tải lại trang có 3 khối xám nháy, rồi hiện danh sách kính.
  - Nút "Xóa" chữ đỏ.
  - Form "Thêm người vào gia đình" có nút gạt Vai trò.
- `/cai-app`:
  - Header "Cài Kim Bun" có nút "Quay lại".
  - Logo 64 kèm chữ "Kim Bun" tròn.
  - Trên trình duyệt (không phải app đã cài) thấy thẻ cảnh báo và 3 bước có số tròn.
- `/offline`: header "Bạn đang offline", thẻ kính với nút "Thử lại". Nếu cache chưa có trang nào thì không có danh sách. Ở dev thường chưa có service worker, nên chỉ kiểm phần trên và ghi rõ.
- Coi `/cai-dat/thanh-vien` và `/cai-app` ở cả 3 theme: đổi `localStorage` `be-yeu-theme` sang `light` / `dark`, tắt lịch ban đêm. Sau đó **trả lại như cũ**: `be-yeu-theme` = `system`, `be-yeu-night-schedule` = `{"enabled":true,"start":"21:00","end":"06:00"}`, không có `be-yeu-night-override`.
- Tắt dev server.

- [ ] **Step 8: Commit**

```bash
git add components/offline app/offline/page.tsx components/install
git commit -m "feat(install): glass Offline and Cài app with the 64 px brand mark"
```

---

## Kết thúc M6 (Đợt 5)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 655 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 5 / M7 (dọn dẹp cuối, xem bảng mốc ở đầu plan).
