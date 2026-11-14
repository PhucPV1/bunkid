# Kim Bun UI — Đợt 5 / M3 (Khẩn cấp, Triệu chứng, Bệnh thường gặp, Bồng bế) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm lại bốn màn Khẩn cấp, Triệu chứng, Bệnh thường gặp, Bồng bế theo spec §9:

- `PageHeader` có nút "‹ Khám phá".
- Thẻ kính thay khung viền; `Icon` thay emoji (📞, 🔴🟡🟢) và mũi tên chữ (↑ ↓).
- Câu hỏi và bài đọc nằm trong thẻ kính; nút trả lời là `Button` `lg`.
- Khẩn cấp:
  - Nút "Gọi 115" nền `--color-danger-solid`, chữ `--color-on-danger`, cao 64.
  - Danh bạ là `ListGroup`.
  - Hồ sơ bé là thẻ kính.

**Architecture:**

- `components/emergency/CallList.tsx` có thêm `Call115Button` dùng chung cho Khẩn cấp, Triệu chứng và kết quả phân loại.
- Các màn giữ nguyên dữ liệu, nội dung (`TRIAGE`, `CONDITIONS`, `HOLDING`) và luật:
  - `evaluateTriage`, `visibleQuestions`, `parseCelsius`, `recentCelsius`, `goNowIf`;
  - `sortContacts`, `moveContact`, `parseContactForm`, `nextSort`, `profileLines`.
- Thêm 2 icon `chevronUp`, `chevronDown` vào `lib/ui/icons.ts` cho nút đổi thứ tự danh bạ.
- Mỗi màn có test SSR bằng `renderToStaticMarkup`. Màn nào có hook dữ liệu thì bọc trong `QueryClientProvider`.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 5:**

| Mốc               | Nội dung                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| M1                | `EmptyState`, `ErrorCard`, bảng 9 hành động mở từ mọi trang, Nhật ký, Thống kê. Đã xong                       |
| M2                | Tăng trưởng, Tiêm chủng, Phát triển. Đã xong trên nhánh `feat/kim-bun-dot5-m2`                                |
| **M3 (plan này)** | Khẩn cấp, Triệu chứng, Bệnh thường gặp, Bồng bế                                                               |
| M4                | Nhạc, Ồn trắng, Ảnh, Báo cáo                                                                                  |
| M5                | Đăng nhập, Khai báo bé, Chưa được mời, Cài app, Offline, `AuthGate`; bên trong 3 trang con Cài đặt            |
| M6                | Trang chủ đang tải / lỗi, dòng đồng bộ dưới header, nhãn `Segmented` xuống dòng, xóa token cũ, checklist cuối |

**Quyết định cho chỗ spec chưa nói rõ:**

- **Nút gọi 115** là viên thuốc cao 64, có icon `phone`. Chữ:
  - Khẩn cấp: "Cấp cứu 115".
  - Triệu chứng: "Gọi cấp cứu 115".
  - Bệnh thường gặp: nút nhỏ cao 44 kiểu `danger` "Gọi 115", đặt cạnh "Phân loại triệu chứng".
- **Danh bạ:**
  - `ListGroup` tiêu đề "Danh bạ". Mỗi hàng là `ListRow` có `href="tel:…"`, icon `phone` nền `cat-med` (nền `accent` chỉ đạt 1,88:1 ở Ban đêm), số điện thoại ở dòng phụ, không có chevron.
  - Khi chưa có số nào thì không vẽ nhóm này.
- **Câu hỏi phân loại triệu chứng:**
  - Mỗi nhóm là `ListGroup`, mỗi câu là một hàng có `Switch` (luật checkbox → `Switch` như §8.3).
  - Ô nhiệt độ nằm trong thẻ kính cùng dòng tuổi của bé.
- **Kết quả phân loại:**
  - Thẻ bo 28. Đỏ dùng nền `--color-danger-solid` chữ `--color-on-danger` (như banner đỏ ở Trang chủ). Vàng dùng `warn-soft`/`warn-ink`, xanh dùng `good-soft`/`good-ink`.
  - Chấm màu emoji bỏ đi, tiêu đề vẫn nói rõ mức.
- **Bài đọc Bệnh thường gặp:** `<details>` kính bo 22, đầu mục có icon `chevronRight` xoay 90° khi mở. Khung "Khi nào đi khám ngay" dùng `danger-soft`/`danger-ink`.
- **Bồng bế:** ba giai đoạn là `Segmented`; mỗi tư thế là thẻ kính; "Xem video" là `Button` `secondary` có icon `play`.
- **Lỗi tải danh bạ:** `ErrorCard` với câu "Không tải được danh bạ: <lỗi>" và nút "Thử lại".

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Không đổi dữ liệu, nội dung, luật, quyền (sửa hồ sơ y tế chỉ chủ gia đình; mọi thành viên sửa danh bạ), các câu xác nhận xóa, và các chữ người dùng thấy, trừ chỗ plan ghi rõ.
- Phần cần mạng giữ `OnlineOnly` (sửa danh bạ, sửa nhóm máu/dị ứng).
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:**
  - Khi kiểm tay **không bấm Lưu, Xóa, nút đổi thứ tự danh bạ**, và không bấm link `tel:` (sẽ gọi điện).
  - Màn Triệu chứng chỉ tính trên máy nên được bấm "Xem kết quả" và "Làm lại".
  - Mở form sửa rồi bấm "Xong" / "Đóng" là được.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot5-m2`):

- `components/ui/`: `PageHeader`, `Button`, `buttonClass({ variant?, size?, block? })`, `IconButton({ label, icon, small?, variant? })`, `Glass`, `Icon`, `ListGroup`, `ListRow`, `Segmented`, `Switch`, `ErrorCard` (Đợt 5 / M1); `components/ui/testTree.ts`.
- `components/quick/styles.ts`: `FIELD_LABEL`, `FIELD_INPUT`.
- `components/OnlineOnly.tsx`.
- `lib/ui/icons.ts`: `ICON_PATHS`, `IconName`.
- `lib/rules/emergency.ts`: `sortContacts`, `moveContact`, `nextSort`, `parseContactForm`, `profileLines`, `BLOOD_TYPES`, `ALLERGIES_MAX`, `ContactInput`.
- `lib/data/emergency.ts`: `useEmergencyContacts`, `useContactActions`, `useSaveMedicalInfo`.
- `lib/data/growth.ts`: `useGrowth`.
- `lib/rules/growthForm.ts`: `latestWeightG`.
- `lib/content/triage.ts`: `TRIAGE`.
- `lib/rules/triage.ts`: `evaluateTriage`, `parseCelsius`, `questionText`, `recentCelsius`, `visibleQuestions`, `goNowIf`, `RESULT_TITLE`, `TriageResult`.
- `lib/data/logs.ts`: `useRecentLogs`.
- `lib/rules/time.ts`: `ageDays`, `formatAgeVi`.
- `lib/rules/ratings.ts`: `wetDiapersInWindow`.
- `lib/content/conditions.ts`: `CONDITIONS`, `ConditionArticle`.
- `lib/content/holding.ts`: `HOLDING`.
- `lib/hooks/useYouTubeOpener.ts`; `lib/rules/youtube.ts`: `youtubePath`.

**Produces:**

- `lib/ui/icons.ts`: icon `chevronUp`, `chevronDown` (tổng 39 icon).
- `components/emergency/CallList.tsx`: `CallList({ contacts })`, `Call115Button({ label })`.
- `ProfileCard`, `ContactsEditor`, `EmergencyScreen`, `TriageScreen`, `TriageResult`, `ConditionsScreen`, `HoldingScreen`: cùng chữ ký, kiểu mới.

---

### Task 1: Nút 115, danh bạ, hồ sơ bé; 2 icon mũi tên

**Files:**

- Modify: `lib/ui/icons.ts` (thêm 2 icon), `lib/ui/categories.test.ts` (đổi số icon), `components/emergency/CallList.tsx`, `components/emergency/ProfileCard.tsx` (viết lại cả hai)
- Create: `components/emergency/emergency.test.tsx`

**Interfaces:**

- Consumes: `ListGroup`, `ListRow`, `Icon`, `Glass`, `Button`; `FIELD_LABEL`, `FIELD_INPUT`; `OnlineOnly`; `sortContacts`, `profileLines`, `BLOOD_TYPES`, `ALLERGIES_MAX`; `useSaveMedicalInfo`.
- Produces: `Call115Button({ label: string })`, `CallList({ contacts: EmergencyContactRow[] })`, `ProfileCard({ baby, isOwner, latestWeightG })`; icon `chevronUp`, `chevronDown`.

- [ ] **Step 1: Viết test hỏng**

`components/emergency/emergency.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby, EmergencyContactRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { CallList } from "./CallList";
import { ProfileCard } from "./ProfileCard";

const contact = (id: string, label: string, sort: number) =>
  ({
    id,
    family_id: "f1",
    label,
    phone: `09${sort}`,
    sort,
    created_by: "u1",
    created_at: "x",
  }) as EmergencyContactRow;

describe("CallList", () => {
  it("a 64 px solid danger 115 button, then the family's numbers as a glass list", () => {
    const html = renderToStaticMarkup(
      <CallList
        contacts={[contact("b", "Bà nội", 2), contact("a", "Bác sĩ", 1)]}
      />,
    );
    expect(html).toContain('href="tel:115"');
    expect(html).toContain("min-h-16");
    expect(html).toContain("bg-danger-solid");
    expect(html).toContain("text-on-danger");
    expect(html).toContain(">Cấp cứu 115</span>");
    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
    expect(html).not.toContain("📞");
    expect(html).toContain(">Danh bạ</h2>");
    expect(html.indexOf(">Bác sĩ</span>")).toBeLessThan(
      html.indexOf(">Bà nội</span>"),
    );
    expect(html).toContain('href="tel:091"');
    expect(html).toContain(">091</span>");
  });

  it("no list without contacts", () => {
    expect(renderToStaticMarkup(<CallList contacts={[]} />)).not.toContain(
      "Danh bạ",
    );
  });
});

describe("ProfileCard", () => {
  it("a glass card with the profile lines and, for the owner, the edit button", () => {
    const baby = {
      id: "b1",
      name: "Bun",
      dob: "2026-09-10",
      blood_type: null,
      allergies: null,
      birth_weight_g: 3200,
    } as Baby;
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ProfileCard baby={baby} isOwner latestWeightG={null} />
      </QueryClientProvider>,
    );
    expect(html).toContain("glass");
    expect(html).toContain(">Hồ sơ của bé</h2>");
    expect(html).toContain(">Nhóm máu</dt>");
    expect(html).toContain(">Sửa nhóm máu, dị ứng</button>");
    expect(html).not.toContain("bg-soft");
  });
});
```

Trong `lib/ui/categories.test.ts`, đổi `expect(Object.keys(ICON_PATHS)).toHaveLength(37);` thành `toHaveLength(39);` và đổi tên test `"has the 37 icons the spec lists, each a non-empty path"` thành `"has the 39 icons the app uses, each a non-empty path"`.

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/emergency/emergency.test.tsx lib/ui/categories.test.ts`
Expected: FAIL — `CallList` cũ không có `min-h-16`/`bg-danger-solid` (có 📞); `ProfileCard` cũ có `bg-soft`; số icon đang là 37.

- [ ] **Step 3: Thêm 2 icon vào `lib/ui/icons.ts`**

Ngay sau dòng `chevronRight: "m9 6 6 6-6 6",`, thêm:

```ts
  chevronUp: "m6 15 6-6 6 6",
  chevronDown: "m6 9 6 6 6-6",
```

- [ ] **Step 4: Viết lại `components/emergency/CallList.tsx`**

```tsx
import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { sortContacts } from "@/lib/rules/emergency";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

// Spec §9 Khẩn cấp: a 64 px solid danger pill.
export function Call115Button({ label }: { label: string }) {
  return (
    <a
      href="tel:115"
      className="flex min-h-16 items-center justify-center gap-2 rounded-full bg-danger-solid px-5 text-lg font-semibold text-on-danger transition-transform duration-[120ms] active:scale-[0.97]"
    >
      <Icon name="phone" size={22} />
      <span>{label}</span>
    </a>
  );
}

// Spec gốc §6.7: 115 always first, then the family's contacts by sort.
export function CallList({ contacts }: { contacts: EmergencyContactRow[] }) {
  const list = sortContacts(contacts);
  return (
    <div className="flex flex-col gap-[18px]">
      <Call115Button label="Cấp cứu 115" />
      {list.length > 0 && (
        <ListGroup title="Danh bạ">
          {list.map((contact) => (
            <ListRow
              key={contact.id}
              label={contact.label}
              detail={contact.phone}
              icon="phone"
              iconColor="cat-med"
              href={`tel:${contact.phone}`}
              chevron={false}
            />
          ))}
        </ListGroup>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Viết lại `components/emergency/ProfileCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { useSaveMedicalInfo } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import {
  ALLERGIES_MAX,
  BLOOD_TYPES,
  profileLines,
} from "@/lib/rules/emergency";
import type { Baby } from "@/lib/supabase/rows";

export function ProfileCard({
  baby,
  isOwner,
  latestWeightG,
}: {
  baby: Baby;
  isOwner: boolean;
  latestWeightG: number | null;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <Glass as="section" className="flex flex-col gap-3 p-4">
      <h2 className="text-xl leading-[26px] font-bold text-ink">
        Hồ sơ của bé
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
        {profileLines(baby, latestWeightG, new Date()).map((line) => (
          <div key={line.label} className="contents">
            <dt className="text-muted">{line.label}</dt>
            <dd className="font-semibold text-ink tabular-nums">
              {line.value}
            </dd>
          </div>
        ))}
      </dl>
      {isOwner &&
        (editing ? (
          <MedicalInfoForm baby={baby} onClose={() => setEditing(false)} />
        ) : (
          <Button
            variant="secondary"
            size="md"
            onClick={() => setEditing(true)}
          >
            Sửa nhóm máu, dị ứng
          </Button>
        ))}
    </Glass>
  );
}

function MedicalInfoForm({
  baby,
  onClose,
}: {
  baby: Baby;
  onClose: () => void;
}) {
  const save = useSaveMedicalInfo(baby.id);
  const [bloodType, setBloodType] = useState(baby.blood_type ?? "");
  const [allergies, setAllergies] = useState(baby.allergies ?? "");
  return (
    <div className="flex flex-col gap-3">
      <OnlineOnly>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Nhóm máu</span>
          <select
            className={`${FIELD_INPUT} accent-accent`}
            value={bloodType}
            onChange={(event) => setBloodType(event.target.value)}
          >
            <option value="">Chưa biết</option>
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Dị ứng (thuốc, thức ăn…)</span>
          <textarea
            className={`${FIELD_INPUT} min-h-20 py-2.5`}
            maxLength={ALLERGIES_MAX}
            value={allergies}
            onChange={(event) => setAllergies(event.target.value)}
          />
        </label>
        <Button
          block
          busy={save.isPending}
          onClick={() =>
            save.mutate(
              {
                blood_type: bloodType || null,
                allergies: allergies.trim() || null,
              },
              { onSuccess: onClose },
            )
          }
        >
          Lưu
        </Button>
      </OnlineOnly>
      {save.isError && (
        <p role="alert" className="text-[15px] text-danger">
          {toVietnameseError(save.error)}
        </p>
      )}
      <Button variant="secondary" size="md" block onClick={onClose}>
        Đóng
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components/emergency lib/ui/categories.test.ts lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (emergency 3, categories giữ nguyên số test, themeGuard 1); typecheck không lỗi.

- [ ] **Step 7: Commit**

```bash
git add lib/ui/icons.ts lib/ui/categories.test.ts components/emergency/CallList.tsx components/emergency/ProfileCard.tsx components/emergency/emergency.test.tsx
git commit -m "feat(emergency): 115 pill, contact list group and glass profile card"
```

---

### Task 2: Sửa danh bạ và màn Khẩn cấp

**Files:**

- Modify: `components/emergency/ContactsEditor.tsx`, `components/emergency/EmergencyScreen.tsx` (viết lại cả hai), `components/emergency/emergency.test.tsx` (thêm test)

**Interfaces:**

- Consumes: `CallList` (Task 1), `ProfileCard` (Task 1); `ListGroup`, `IconButton`, `Button`, `PageHeader`, `ErrorCard`; `FIELD_LABEL`, `FIELD_INPUT`; `OnlineOnly`; `useContactActions`, `useEmergencyContacts`, `useGrowth`; `moveContact`, `nextSort`, `parseContactForm`, `sortContacts`; `latestWeightG`.
- Produces: `ContactsEditor({ familyId, contacts, onClose })`, `EmergencyScreen({ baby, isOwner })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

Thêm vào `components/emergency/emergency.test.tsx`: thêm `import { ContactsEditor } from "./ContactsEditor";` vào khối import, rồi thêm cuối file:

```tsx
describe("ContactsEditor", () => {
  it("a glass list with icon arrows, Sửa / Xóa, then the add form with Lưu and Xong", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ContactsEditor
          familyId="f1"
          contacts={[contact("a", "Bác sĩ", 1), contact("b", "Bà nội", 2)]}
          onClose={() => {}}
        />
      </QueryClientProvider>,
    );
    expect(html).toContain('aria-label="Đưa Bác sĩ lên"');
    expect(html).toContain('aria-label="Đưa Bà nội xuống"');
    expect(html).toContain(`d="${ICON_PATHS.chevronUp}"`);
    expect(html).toContain(`d="${ICON_PATHS.chevronDown}"`);
    expect(html).not.toContain("↑");
    expect(html).toContain(">Sửa</button>");
    expect(html).toContain("text-danger!");
    expect(html).toContain(">Thêm số điện thoại</h3>");
    expect(html).toContain('inputMode="tel"');
    expect(html).toContain(">Lưu</button>");
    expect(html).toContain(">Xong</button>");
    expect(html).not.toContain("rounded-2xl border");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/emergency/emergency.test.tsx`
Expected: FAIL — test `ContactsEditor` hỏng (bản cũ dùng chữ "↑", không có icon, có `rounded-2xl border`); 3 test của Task 1 vẫn xanh.

- [ ] **Step 3: Viết lại `components/emergency/ContactsEditor.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ListGroup } from "@/components/ui/ListGroup";
import { useContactActions } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import {
  moveContact,
  nextSort,
  parseContactForm,
  sortContacts,
  type ContactInput,
} from "@/lib/rules/emergency";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

const EMPTY: ContactInput = { label: "", phone: "" };

// Spec gốc §5.2: every member adds, edits, reorders and deletes contacts.
export function ContactsEditor({
  familyId,
  contacts,
  onClose,
}: {
  familyId: string;
  contacts: EmergencyContactRow[];
  onClose: () => void;
}) {
  const actions = useContactActions(familyId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContactInput>(EMPTY);
  const [message, setMessage] = useState<string | null>(null);
  const list = sortContacts(contacts);
  const onError = (e: unknown) => setMessage(toVietnameseError(e));
  const busy =
    actions.add.isPending ||
    actions.edit.isPending ||
    actions.reorder.isPending ||
    actions.remove.isPending;

  function startEdit(contact: EmergencyContactRow | null) {
    setEditingId(contact?.id ?? null);
    setDraft(contact ? { label: contact.label, phone: contact.phone } : EMPTY);
    setMessage(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseContactForm(draft);
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    const done = { onSuccess: () => startEdit(null), onError };
    setMessage(null);
    if (editingId)
      actions.edit.mutate({ id: editingId, input: parsed.value }, done);
    else
      actions.add.mutate({ ...parsed.value, sort: nextSort(contacts) }, done);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
        Sửa danh bạ
      </h2>
      <OnlineOnly>
        {list.length > 0 && (
          <ListGroup>
            {list.map((contact, index) => (
              <li
                key={contact.id}
                className="flex items-center gap-1 border-b border-line py-1 pr-2 pl-4 last:border-b-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-ink">
                    {contact.label}
                  </span>
                  <span className="block text-[13px] text-muted tabular-nums">
                    {contact.phone}
                  </span>
                </span>
                <IconButton
                  label={`Đưa ${contact.label} lên`}
                  icon="chevronUp"
                  variant="plain"
                  disabled={busy || index === 0}
                  onClick={() =>
                    actions.reorder.mutate(moveContact(list, contact.id, -1), {
                      onError,
                    })
                  }
                />
                <IconButton
                  label={`Đưa ${contact.label} xuống`}
                  icon="chevronDown"
                  variant="plain"
                  disabled={busy || index === list.length - 1}
                  onClick={() =>
                    actions.reorder.mutate(moveContact(list, contact.id, 1), {
                      onError,
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="md"
                  disabled={busy}
                  onClick={() => startEdit(contact)}
                >
                  Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  disabled={busy}
                  className="text-danger!"
                  onClick={() => {
                    if (!window.confirm(`Xóa "${contact.label}" khỏi danh bạ?`))
                      return;
                    if (contact.id === editingId) startEdit(null);
                    setMessage(null);
                    actions.remove.mutate(contact.id, { onError });
                  }}
                >
                  Xóa
                </Button>
              </li>
            ))}
          </ListGroup>
        )}
        <form onSubmit={submit} className="flex flex-col gap-3">
          <h3 className="px-1 text-[17px] font-semibold text-ink">
            {editingId ? "Sửa số điện thoại" : "Thêm số điện thoại"}
          </h3>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>
              Tên (ví dụ: Bác sĩ nhi, Bệnh viện Nhi Đồng 1)
            </span>
            <input
              className={FIELD_INPUT}
              maxLength={60}
              value={draft.label}
              onChange={(event) =>
                setDraft({ ...draft, label: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Số điện thoại</span>
            <input
              type="tel"
              inputMode="tel"
              className={`${FIELD_INPUT} tabular-nums`}
              value={draft.phone}
              onChange={(event) =>
                setDraft({ ...draft, phone: event.target.value })
              }
            />
          </label>
          <div className="flex gap-3">
            {editingId && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => startEdit(null)}
              >
                Hủy sửa
              </Button>
            )}
            <Button type="submit" busy={busy} className="flex-1">
              Lưu
            </Button>
          </div>
        </form>
      </OnlineOnly>
      {message && (
        <p role="alert" className="text-[15px] text-danger">
          {message}
        </p>
      )}
      <Button variant="secondary" block onClick={onClose}>
        Xong
      </Button>
    </section>
  );
}
```

- [ ] **Step 4: Viết lại `components/emergency/EmergencyScreen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth } from "@/lib/data/growth";
import { latestWeightG } from "@/lib/rules/growthForm";
import type { Baby } from "@/lib/supabase/rows";
import { CallList } from "./CallList";
import { ContactsEditor } from "./ContactsEditor";
import { ProfileCard } from "./ProfileCard";

export function EmergencyScreen({
  baby,
  isOwner,
}: {
  baby: Baby;
  isOwner: boolean;
}) {
  const contacts = useEmergencyContacts(baby.family_id);
  const growth = useGrowth(baby.id);
  const [editing, setEditing] = useState(false);
  const rows = contacts.data ?? [];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Khẩn cấp"
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <CallList contacts={rows} />
      {contacts.isError && !contacts.data && (
        <ErrorCard
          message={`Không tải được danh bạ: ${toVietnameseError(contacts.error)}`}
          onRetry={() => void contacts.refetch()}
        />
      )}
      {editing ? (
        <ContactsEditor
          familyId={baby.family_id}
          contacts={rows}
          onClose={() => setEditing(false)}
        />
      ) : (
        <Button variant="secondary" block onClick={() => setEditing(true)}>
          {rows.length === 0 ? "Thêm số bác sĩ, người thân" : "Sửa danh bạ"}
        </Button>
      )}
      <ProfileCard
        baby={baby}
        isOwner={isOwner}
        latestWeightG={latestWeightG(growth.data ?? [])}
      />
    </main>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/emergency lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (emergency 4, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/emergency/ContactsEditor.tsx components/emergency/EmergencyScreen.tsx components/emergency/emergency.test.tsx
git commit -m "feat(emergency): glass contact editor and Khẩn cấp page"
```

---

### Task 3: Phân loại triệu chứng

**Files:**

- Modify: `components/triage/TriageScreen.tsx`, `components/triage/TriageResult.tsx` (viết lại cả hai)
- Create: `components/triage/triage.test.tsx`

**Interfaces:**

- Consumes: `Call115Button`, `CallList` (Task 1); `PageHeader`, `Button`, `Glass`, `ListGroup`, `Switch`; `FIELD_LABEL`, `FIELD_INPUT`; `TRIAGE`; luật triage; `useRecentLogs`, `useEmergencyContacts`; `wetDiapersInWindow`; `ageDays`, `formatAgeVi`.
- Produces: `TriageScreen({ baby })`, `TriageResult({ result, ageDays, contacts, onRestart })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/triage/triage.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TRIAGE } from "@/lib/content/triage";
import {
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import { ageDays } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import { TriageResult } from "./TriageResult";
import { TriageScreen } from "./TriageScreen";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;

describe("TriageScreen", () => {
  it("a glass temperature card, one switch per visible question, a large Xem kết quả and the 115 pill", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <TriageScreen baby={baby} />
      </QueryClientProvider>,
    );
    const visible = visibleQuestions(
      TRIAGE.questions,
      ageDays(baby.dob, new Date()),
    );
    expect(html).toContain('href="/kham-pha"');
    expect(html.match(/role="switch"/g)).toHaveLength(visible.length);
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain('inputMode="decimal"');
    expect(html).toMatch(/min-h-\[50px\][^>]*>Xem kết quả<\/button>/);
    expect(html).toContain("bg-danger-solid");
    expect(html).not.toContain("bg-alarm");
  });
});

describe("TriageResult", () => {
  it("a solid danger card without emoji, the call list and a large Làm lại", () => {
    const result = {
      level: "red",
      findings: [{ text: "Bé khó thở" }],
    } as unknown as Result;
    const html = renderToStaticMarkup(
      <TriageResult
        result={result}
        ageDays={30}
        contacts={[]}
        onRestart={() => {}}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("rounded-[28px] p-4 bg-danger-solid text-on-danger");
    expect(html).not.toMatch(/🔴|🟡|🟢/);
    expect(html).toContain(">Bé khó thở</li>");
    expect(html).toContain('href="tel:115"');
    expect(html).toMatch(/min-h-\[50px\][^>]*>Làm lại<\/button>/);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/triage/triage.test.tsx`
Expected: FAIL — bản cũ dùng checkbox, `bg-alarm`, emoji 🔴 (2 test hỏng).

- [ ] **Step 3: Viết lại `components/triage/TriageResult.tsx`**

```tsx
import { CallList } from "@/components/emergency/CallList";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { TRIAGE } from "@/lib/content/triage";
import {
  goNowIf,
  RESULT_TITLE,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

const CARD = {
  red: "bg-danger-solid text-on-danger",
  yellow: "bg-warn-soft text-warn-ink",
  green: "bg-good-soft text-good-ink",
} as const;

// Spec gốc §6.6: every result shows 115, the family's doctor numbers and the disclaimer.
export function TriageResult({
  result,
  ageDays,
  contacts,
  onRestart,
}: {
  result: Result;
  ageDays: number;
  contacts: EmergencyContactRow[];
  onRestart: () => void;
}) {
  return (
    <section className="flex flex-col gap-[18px]">
      <div
        role="alert"
        className={`flex flex-col gap-2 rounded-[28px] p-4 ${CARD[result.level]}`}
      >
        <p className="text-xl leading-[26px] font-bold">
          {RESULT_TITLE[result.level]}
        </p>
        {result.findings.length > 0 && (
          <ul className="list-disc pl-5 text-base">
            {result.findings.map((finding) => (
              <li key={finding.text}>{finding.text}</li>
            ))}
          </ul>
        )}
      </div>
      {result.level === "green" && (
        <Glass className="flex flex-col gap-2 p-4">
          <h2 className="text-[17px] font-semibold text-ink">
            Chăm bé tại nhà
          </h2>
          <ul className="list-disc pl-5 text-base text-ink">
            {TRIAGE.homeCare.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Glass>
      )}
      {result.level !== "red" && (
        <p className="px-1 text-base font-semibold text-ink">
          {goNowIf(TRIAGE.questions, ageDays)}
        </p>
      )}
      <CallList contacts={contacts} />
      <p className="px-1 text-[13px] text-muted">{TRIAGE.disclaimer}</p>
      <Button variant="secondary" size="lg" block onClick={onRestart}>
        Làm lại
      </Button>
    </section>
  );
}
```

- [ ] **Step 4: Viết lại `components/triage/TriageScreen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Call115Button } from "@/components/emergency/CallList";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { Switch } from "@/components/ui/Switch";
import { TRIAGE } from "@/lib/content/triage";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { useRecentLogs } from "@/lib/data/logs";
import { wetDiapersInWindow } from "@/lib/rules/ratings";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import {
  evaluateTriage,
  parseCelsius,
  questionText,
  recentCelsius,
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { Baby } from "@/lib/supabase/rows";
import { TriageResult } from "./TriageResult";

export function TriageScreen({ baby }: { baby: Baby }) {
  const now = new Date();
  const age = ageDays(baby.dob, now);
  const logs = useRecentLogs(baby.id);
  const contacts = useEmergencyContacts(baby.family_id);
  const logged = recentCelsius(logs.data ?? [], now);
  const [celsius, setCelsius] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  // Step 1 (spec gốc §6.6): prefilled from a temperature logged in the last 6 hours, editable.
  const temperature =
    celsius ?? (logged === null ? "" : String(logged).replace(".", ","));
  const questions = visibleQuestions(TRIAGE.questions, age);
  const wet = wetDiapersInWindow(logs.data ?? [], now);
  const diapersLogged = (logs.data ?? []).some(
    (log) =>
      log.type === "diaper" &&
      now.getTime() - Date.parse(log.started_at) <= 24 * 3_600_000,
  );

  function toggle(code: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  function submit() {
    const parsed = parseCelsius(temperature);
    if (parsed === "bad") {
      setError("Nhiệt độ từ 30 đến 43°C, ví dụ 38,5.");
      return;
    }
    setError(null);
    setResult(
      evaluateTriage({
        questions: TRIAGE.questions,
        checked,
        celsius: parsed,
        ageDays: age,
      }),
    );
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={TRIAGE.title}
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <p className="px-1 text-[13px] text-muted">{TRIAGE.disclaimer}</p>
      {!result && <Call115Button label="Gọi cấp cứu 115" />}
      {result ? (
        <TriageResult
          result={result}
          ageDays={age}
          contacts={contacts.data ?? []}
          onRestart={() => {
            setResult(null);
            setChecked(new Set());
            setCelsius(null);
            setError(null);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <>
          <Glass as="section" className="flex flex-col gap-3 p-4">
            <p className="text-base text-ink">
              Tuổi của bé: <strong>{formatAgeVi(baby.dob, now)}</strong>
            </p>
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>
                Nhiệt độ gần nhất (°C, để trống nếu chưa đo)
              </span>
              <input
                inputMode="decimal"
                className={`${FIELD_INPUT} tabular-nums`}
                value={temperature}
                onChange={(event) => setCelsius(event.target.value)}
              />
            </label>
            {logged !== null && celsius === null && (
              <p className="text-[13px] text-muted">
                Lấy từ nhật ký trong 6 giờ qua.
              </p>
            )}
            {error && (
              <p role="alert" className="text-[15px] text-danger">
                {error}
              </p>
            )}
          </Glass>
          <p className="px-1 text-base text-ink">
            Đánh dấu những gì bé đang có:
          </p>
          {TRIAGE.groups.map((group) => {
            const list = questions.filter((q) => q.group === group.code);
            if (list.length === 0) return null;
            return (
              <ListGroup key={group.code} title={group.name}>
                {list.map((question) => (
                  <li
                    key={question.code}
                    className="flex min-h-[52px] items-center justify-between gap-3 border-b border-line px-4 py-2 last:border-b-0"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base text-ink">
                        {questionText(question, age)}
                      </span>
                      {question.code === "few_wet_diapers" && logs.data && (
                        <span className="text-[13px] text-muted">
                          {diapersLogged
                            ? `Nhật ký ghi ${wet} tã ướt trong 24 giờ qua.`
                            : "Nhật ký chưa ghi tã nào trong 24 giờ qua."}
                        </span>
                      )}
                    </span>
                    <Switch
                      checked={checked.has(question.code)}
                      label={questionText(question, age)}
                      onChange={(on) => toggle(question.code, on)}
                    />
                  </li>
                ))}
              </ListGroup>
            );
          })}
          <Button size="lg" block onClick={submit}>
            Xem kết quả
          </Button>
          <Call115Button label="Gọi cấp cứu 115" />
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/triage lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (triage 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/triage
git commit -m "feat(triage): glass questions with switches and solid result cards"
```

---

### Task 4: Bệnh thường gặp

**Files:**

- Modify: `components/conditions/ConditionsScreen.tsx` (viết lại toàn file)
- Create: `components/conditions/conditions.test.tsx`

**Interfaces:**

- Consumes: `PageHeader`, `buttonClass`, `Icon`; `CONDITIONS`, `ConditionArticle`; `cx`.
- Produces: `ConditionsScreen()`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/conditions/conditions.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONDITIONS } from "@/lib/content/conditions";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ConditionsScreen } from "./ConditionsScreen";

describe("ConditionsScreen", () => {
  it("a header back to Khám phá, triage and 115 buttons, and one glass article per condition", () => {
    const html = renderToStaticMarkup(<ConditionsScreen />);
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain(`>${CONDITIONS.title}</h1>`);
    expect(html).toContain('href="/trieu-chung"');
    expect(html).toContain('href="tel:115"');
    expect(html).toContain("bg-danger-solid");
    expect(html.match(/<details[^>]*class="group glass/g)).toHaveLength(
      CONDITIONS.articles.length,
    );
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    expect(html).toContain(">Khi nào đi khám ngay</h3>");
    expect(html).not.toContain("rounded-2xl border");
    expect(html).not.toContain("bg-alarm");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/conditions/conditions.test.tsx`
Expected: FAIL — bản cũ không có `PageHeader`, có `rounded-2xl border`, `bg-alarm`.

- [ ] **Step 3: Viết lại `components/conditions/ConditionsScreen.tsx`**

```tsx
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { CONDITIONS, type ConditionArticle } from "@/lib/content/conditions";
import { cx } from "@/lib/ui/cx";

const SECTIONS: { key: "signs" | "homeCare" | "seeDoctor"; title: string }[] = [
  { key: "signs", title: "Dấu hiệu" },
  { key: "homeCare", title: "Chăm bé tại nhà" },
  { key: "seeDoctor", title: "Nên cho bé đi khám" },
];

export function ConditionsScreen() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={CONDITIONS.title}
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <p className="px-1 text-base text-ink">{CONDITIONS.intro}</p>
      <div className="flex gap-2.5">
        <Link
          href="/trieu-chung"
          className={cx(
            buttonClass({ variant: "secondary", size: "md" }),
            "flex-1",
          )}
        >
          Phân loại triệu chứng
        </Link>
        <a
          href="tel:115"
          className={cx(
            buttonClass({ variant: "danger", size: "md" }),
            "flex-1",
          )}
        >
          <Icon name="phone" size={18} />
          Gọi 115
        </a>
      </div>
      <div className="flex flex-col gap-2.5">
        {CONDITIONS.articles.map((article) => (
          <Article key={article.code} article={article} />
        ))}
      </div>
      <p className="px-1 text-[13px] text-muted">{CONDITIONS.disclaimer}</p>
    </main>
  );
}

function Article({ article }: { article: ConditionArticle }) {
  return (
    <details
      id={article.code}
      className="group glass overflow-hidden rounded-[22px]"
    >
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {article.title}
        <Icon
          name="chevronRight"
          size={16}
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-90"
        />
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 text-base text-ink">
        <p>{article.summary}</p>
        {SECTIONS.map((section) => (
          <section key={section.key}>
            <h3 className="text-[15px] font-semibold">{section.title}</h3>
            <ul className="list-disc pl-5">
              {article[section.key].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <section className="rounded-[16px] bg-danger-soft p-3 text-danger-ink">
          <h3 className="font-semibold">Khi nào đi khám ngay</h3>
          <ul className="list-disc pl-5">
            {article.goNow.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <p className="text-[13px] text-muted">
          Thường kéo dài: {article.usualCourse}
        </p>
        <p className="text-[13px] text-muted">
          Nguồn:{" "}
          <a
            href={article.source}
            className="inline-flex min-h-11 items-center underline"
            target="_blank"
            rel="noreferrer"
          >
            NHS
          </a>{" "}
          (xem lại {article.reviewedAt.split("-").reverse().join("/")})
        </p>
      </div>
    </details>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/conditions lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (conditions 1, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/conditions
git commit -m "feat(conditions): glass articles and danger 115 button"
```

---

### Task 5: Bồng bế; kiểm toàn bộ

**Files:**

- Modify: `components/holding/HoldingScreen.tsx` (viết lại toàn file)
- Create: `components/holding/holding.test.tsx`

**Interfaces:**

- Consumes: `PageHeader`, `Segmented`, `Glass`, `Button`, `Icon`; `HOLDING`; `useYouTubeOpener`; `youtubePath`.
- Produces: `HoldingScreen({ ageDays })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/holding/holding.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HOLDING } from "@/lib/content/holding";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HoldingScreen } from "./HoldingScreen";

describe("HoldingScreen", () => {
  it("a stage picker, one glass card per position, Xem video with a play icon", () => {
    const html = renderToStaticMarkup(<HoldingScreen ageDays={30} />);
    const stage = HOLDING.stages.find((s) => s.code === "0_3")!;
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain('aria-label="Giai đoạn"');
    const name = stage.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    expect(html).toMatch(
      new RegExp(`aria-pressed="true"[^>]*>${name}</button>`),
    );
    expect(html.match(/<section class="glass/g)).toHaveLength(
      stage.positions.length,
    );
    expect(html.match(/>Xem video</g)).toHaveLength(stage.positions.length);
    expect(html).toContain(`d="${ICON_PATHS.play}"`);
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("rounded-2xl border");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/holding/holding.test.tsx`
Expected: FAIL — bản cũ dùng `role="tablist"` và `rounded-2xl border`.

- [ ] **Step 3: Viết lại `components/holding/HoldingScreen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { HOLDING } from "@/lib/content/holding";
import { useYouTubeOpener } from "@/lib/hooks/useYouTubeOpener";
import { youtubePath } from "@/lib/rules/youtube";

const STAGES = HOLDING.stages.map((s) => ({ value: s.code, label: s.name }));

// Spec gốc §6.10: stage picked by the baby's age, positions as text, no pictures.
export function HoldingScreen({ ageDays }: { ageDays: number }) {
  const initial = ageDays < 91 ? "0_3" : ageDays < 183 ? "3_6" : "6_plus";
  const [stage, setStage] = useState(initial);
  // Same per-device choice as the music page (app or browser).
  const youtube = useYouTubeOpener();
  const current = HOLDING.stages.find((s) => s.code === stage)!;
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={HOLDING.title}
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <p className="px-1 text-base text-ink">{HOLDING.intro}</p>
      <Segmented
        label="Giai đoạn"
        options={STAGES}
        value={stage}
        onChange={setStage}
      />
      {current.positions.map((position) => (
        <Glass
          as="section"
          key={position.code}
          className="flex flex-col gap-3 p-4"
        >
          <h2 className="text-[17px] font-semibold text-ink">
            {position.name}
          </h2>
          <ol className="list-decimal pl-5 text-base text-ink">
            {position.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="rounded-[16px] bg-warn-soft p-3 text-[15px] text-warn-ink">
            <p className="font-semibold">Lưu ý an toàn</p>
            <ul className="list-disc pl-5">
              {position.safety.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              youtube.open(
                youtubePath({ kind: "search", query: position.searchQuery }),
              )
            }
          >
            <Icon name="play" size={16} filled />
            Xem video
          </Button>
          <a
            href={position.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-[13px] text-muted underline"
          >
            Nguồn
          </a>
        </Glass>
      ))}
    </main>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/holding lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (holding 1, themeGuard 1); typecheck không lỗi. Nếu `<section class="glass` không khớp vì thứ tự thuộc tính React in ra, đổi regex thành `/<section[^>]*class="glass/g` và ghi lại trong báo cáo.

- [ ] **Step 5: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 621 có sẵn + 3 emergency (Task 1) + 1 emergency (Task 2) + 2 triage + 1 conditions + 1 holding = 629. Build xong.

- [ ] **Step 6: Kiểm trên trình duyệt (không ghi dữ liệu, không gọi điện)**

Run: `bun run dev`, mở `http://localhost:3000` ở bề rộng 375 px, đăng nhập. **Không bấm Lưu, Xóa, nút đổi thứ tự danh bạ, link gọi điện.**
Expected:

- **Khám phá → Khẩn cấp:**
  - Có nút "‹ Khám phá" và nút "Cấp cứu 115" màu đỏ đặc, cao, có icon điện thoại (không phải emoji).
  - "DANH BẠ" là danh sách kính nếu nhà có số.
  - Thẻ kính "Hồ sơ của bé".
  - Bấm "Sửa danh bạ" / "Thêm số…": hiện danh sách có nút mũi tên icon, "Sửa", "Xóa" đỏ, form thêm số; bấm "Xong" để đóng.
  - Nếu là chủ nhà: bấm "Sửa nhóm máu, dị ứng" rồi "Đóng".
- **Khám phá → Triệu chứng:**
  - Thẻ kính nhiệt độ; mỗi nhóm câu hỏi là danh sách kính có công tắc.
  - Bật một câu (ví dụ "Bé bú kém"), bấm "Xem kết quả": thẻ kết quả bo tròn đúng màu mức, không có chấm emoji, có nút 115 và danh bạ.
  - Bấm "Làm lại": về bảng câu hỏi, công tắc đã tắt.
- **Khám phá → Bệnh thường gặp:** hai nút "Phân loại triệu chứng" và "Gọi 115" đỏ; mỗi bệnh là thẻ kính; bấm mở một thẻ thì chevron xoay, có khung đỏ nhạt "Khi nào đi khám ngay".
- **Khám phá → Bồng bế:** `Segmented` 3 giai đoạn đúng tuổi bé; mỗi tư thế là thẻ kính có khung vàng "Lưu ý an toàn" và nút "Xem video" có icon (không bấm).
- Đổi qua theme Sáng, nhìn lại 4 màn: chữ rõ. Đặt lại lựa chọn giao diện như ban đầu. Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 7: Commit**

```bash
git add components/holding
git commit -m "feat(holding): stage picker and glass position cards"
```

---

## Kết thúc M3 (Đợt 5)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 629 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 5 / M4 (Nhạc, Ồn trắng, Ảnh, Báo cáo).
