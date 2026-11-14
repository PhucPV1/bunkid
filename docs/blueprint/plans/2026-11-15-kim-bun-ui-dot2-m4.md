# Kim Bun UI — Đợt 2 / M4 (Cài đặt kiểu iOS) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm lại `/cai-dat` thành trang Cài đặt kiểu iOS theo spec §6.8 (thẻ hồ sơ bé, nhóm Gia đình, Thông báo, Giao diện, Ứng dụng, Tài khoản; công tắc iOS; sheet chọn giờ) và tách 3 trang con `/cai-dat/ho-so`, `/cai-dat/thanh-vien`, `/cai-dat/cu-bu`.

**Architecture:**

- Chữ hiển thị (dòng phụ hồ sơ, "N người", "Đến HH:mm", "21:00–06:00") là hàm thuần trong `lib/rules/settingsText.ts`.
- Nhóm Thông báo và nhóm Giao diện mỗi nhóm có phần "View" không hook (test bằng `renderToStaticMarkup` và duyệt cây phần tử) và phần bọc ngoài gọi hook dữ liệu sẵn có (`useNotificationPrefs`, `useSavePrefs`, `useThemePref`, `useNightSchedule`).
- 3 trang con dùng lại nguyên `BabyProfileSection`, `MembersSection`, `FeedIntervalSection` bên trong khung `SettingsSubpage` (`PageHeader` có nút "‹ Cài đặt" + `OnlineOnly`). `NotificationsSection` cũ bị thay bởi nhóm Thông báo mới và bị xóa.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`), Bun. Không thêm gói nào.

**Các mốc của Đợt 2 (spec §12):** M1 tab bar và Khám phá, M2 nút "+", M3 header Trang chủ — đã xong (nhánh `feat/kim-bun-dot2-m3`). **M4 (plan này):** spec §6.8; checklist bước 2 (giảm trong suốt) và bước 4 phần Cài đặt. Xong M4 là xong Đợt 2.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI; icon dùng `components/ui/Icon.tsx`.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Không đổi luồng dữ liệu: dùng nguyên `useNotificationPrefs`, `useSavePrefs`, `useMembers`, `updateBaby` và các section có sẵn; không đổi bảng, RLS, push.
- Quyền sửa giữ như hiện nay: chỉ owner sửa hồ sơ và cữ bú; người không có quyền thấy giá trị, thẻ hồ sơ và hàng Cữ bú không có chevron và không mở trang con.
- Phần cần mạng (Gia đình, Thông báo, các trang con) vẫn bọc `OnlineOnly`.
- Không hiện email đầy đủ ở Tài khoản (spec §6.8): chỉ "Đăng nhập bằng Google".
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay, không gạt công tắc thông báo, không bấm Tạm tắt, không đổi cữ bú hay hồ sơ, không thêm/xóa thành viên. Đổi Sáng/Tối/Tự động và lịch Ban đêm chỉ ghi `localStorage`, được phép (nhớ đặt lại như cũ).
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".

## Contracts with Other Plans

**Consumes** (đã có trong code trên nhánh `feat/kim-bun-dot2-m3`):

- `components/ui/`: `PageHeader` (`title`, `back?: { href; label }`, `action?`), `ListGroup` (`title?`), `ListRow` (`label detail? value? icon? iconColor? href? onClick? trailing? chevron?`), `Switch` (`checked onChange label disabled?`), `Segmented<T>` (`label options value onChange`), `Sheet` (`open onClose title …`), `Button` (`variant size block busy`), `Icon`; `components/ui/testTree.ts` (`hostElements`, `type TreeProps`).
- `lib/hooks/useTheme.ts`: `useThemePref(): [ThemePref, (next) => void]`, `useNightSchedule(): [NightSchedule, (next) => void]`.
- `lib/theme.ts`: `THEME_OPTIONS: { value: ThemePref; label: string }[]` (Sáng / Tối / Tự động); `lib/rules/theme.ts`: `HALF_HOURS`, `type NightSchedule`, `type ThemePref`.
- `lib/rules/notifications.ts`: `PREF_OPTIONS`, `type PrefKey`, `SNOOZE_HOURS`, `snoozeUntil`, `snoozeText`; `lib/data/notificationPrefs.ts`: `DEFAULT_PREFS`, `useNotificationPrefs`, `useSavePrefs`.
- `lib/rules/familySettings.ts`: `roleLabel`, `formatInterval`; `lib/data/family.ts`: `useMembers`; `lib/rules/time.ts`: `formatVnTime`.
- `lib/brand/logo.ts`: `LOGO_GRADIENT`, `LOGO_INK`.
- `components/settings/BabyProfileSection.tsx` (`baby isOwner`), `MembersSection.tsx` (`me`), `FeedIntervalSection.tsx` (`baby isOwner`); `components/push/DevicePushControl.tsx`; `components/OnlineOnly.tsx`; `components/AuthGate.tsx`.

**Produces:**

- `lib/rules/settingsText.ts`: `babySubtitle(baby: { sex: string; dob: string; birth_weight_g: number | null }): string`, `memberCountText(count: number): string`, `snoozeValue(until: string | null, now: Date): string`, `nightHoursText(schedule: NightSchedule): string`.
- `components/ui/testTree.ts`: thêm `findElements(node, predicate): ReactElement<TreeProps>[]` (duyệt cả phần tử trong mọi prop, kể cả component).
- `components/settings/SettingsSubpage.tsx`: `<SettingsSubpage title>`.
- `components/settings/NotificationsGroup.tsx`: `<NotificationsGroupView …>`, `<SnoozeSheet …>`, `<NotificationsGroup userId />`.
- `components/settings/AppearanceGroup.tsx`: `<AppearanceGroupView …>`, `<NightHoursSheet …>`, `<AppearanceGroup />`.
- `SettingsScreen({ member, baby, userId })` (bỏ prop `email`); route `/cai-dat/ho-so`, `/cai-dat/thanh-vien`, `/cai-dat/cu-bu` (được service worker cache).

---

### Task 1: Chữ hiển thị của Cài đặt (`lib/rules/settingsText.ts`)

**Files:**

- Create: `lib/rules/settingsText.ts`, `lib/rules/settingsText.test.ts`

**Interfaces:**

- Consumes: `formatVnTime` (`lib/rules/time.ts`), `NightSchedule` (`lib/rules/theme.ts`).
- Produces: `babySubtitle`, `memberCountText`, `snoozeValue`, `nightHoursText` (chữ ký ở Contracts).

- [ ] **Step 1: Viết test hỏng**

`lib/rules/settingsText.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  babySubtitle,
  memberCountText,
  nightHoursText,
  snoozeValue,
} from "./settingsText";

describe("settings text", () => {
  it("babySubtitle shows sex, birth date and birth weight in kg", () => {
    expect(
      babySubtitle({ sex: "male", dob: "2026-09-10", birth_weight_g: 3200 }),
    ).toBe("Bé trai · sinh 10/09/2026 · 3,2 kg");
    expect(
      babySubtitle({ sex: "female", dob: "2026-01-01", birth_weight_g: 3400 }),
    ).toBe("Bé gái · sinh 01/01/2026 · 3,4 kg");
  });

  it("babySubtitle leaves out an unknown birth weight", () => {
    expect(
      babySubtitle({ sex: "female", dob: "2026-01-01", birth_weight_g: null }),
    ).toBe("Bé gái · sinh 01/01/2026");
  });

  it("memberCountText counts people", () => {
    expect(memberCountText(3)).toBe("3 người");
    expect(memberCountText(1)).toBe("1 người");
  });

  it("snoozeValue says Không unless reminders are paused for later", () => {
    const now = new Date("2026-11-14T12:00:00.000Z"); // 19:00 VN
    expect(snoozeValue(null, now)).toBe("Không");
    expect(snoozeValue("2026-11-14T11:00:00.000Z", now)).toBe("Không");
    expect(snoozeValue("2026-11-14T15:00:00.000Z", now)).toBe("Đến 22:00");
  });

  it("nightHoursText joins start and end with an en dash", () => {
    expect(
      nightHoursText({ enabled: true, start: "21:00", end: "06:00" }),
    ).toBe("21:00–06:00");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/settingsText.test.ts`
Expected: FAIL — `Cannot find module './settingsText'`.

- [ ] **Step 3: Viết `lib/rules/settingsText.ts`**

```ts
import type { NightSchedule } from "./theme";
import { formatVnTime } from "./time";

export function babySubtitle(baby: {
  sex: string;
  dob: string;
  birth_weight_g: number | null;
}): string {
  const [y, m, d] = baby.dob.split("-");
  const parts = [
    baby.sex === "female" ? "Bé gái" : "Bé trai",
    `sinh ${d}/${m}/${y}`,
  ];
  if (baby.birth_weight_g !== null)
    parts.push(
      `${(baby.birth_weight_g / 1000).toFixed(1).replace(".", ",")} kg`,
    );
  return parts.join(" · ");
}

export function memberCountText(count: number): string {
  return `${count} người`;
}

export function snoozeValue(until: string | null, now: Date): string {
  if (!until || Date.parse(until) <= now.getTime()) return "Không";
  return `Đến ${formatVnTime(new Date(until))}`;
}

export function nightHoursText(schedule: NightSchedule): string {
  return `${schedule.start}–${schedule.end}`;
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/settingsText.test.ts`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add lib/rules/settingsText.ts lib/rules/settingsText.test.ts
git commit -m "feat(settings): display text for the new settings rows"
```

---

### Task 2: Khung trang con và 3 trang con

**Files:**

- Create: `components/settings/SettingsSubpage.tsx`, `components/settings/subpage.test.tsx`, `app/cai-dat/ho-so/page.tsx`, `app/cai-dat/thanh-vien/page.tsx`, `app/cai-dat/cu-bu/page.tsx`
- Modify: `sw/sw.template.js` (mảng `PAGES`), `scripts/sw.test.ts`

**Interfaces:**

- Consumes: `PageHeader` (Đợt 2 / M1); `OnlineOnly`, `AuthGate`, `BabyProfileSection`, `MembersSection`, `FeedIntervalSection` (có sẵn).
- Produces: `SettingsSubpage({ title, children })`; 3 route trang con.

- [ ] **Step 1: Viết test hỏng**

`components/settings/subpage.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SettingsSubpage } from "./SettingsSubpage";

describe("SettingsSubpage", () => {
  it("has a large title, a back pill to Cài đặt and an online-only body", () => {
    const html = renderToStaticMarkup(
      <SettingsSubpage title="Thành viên">
        <p>Nội dung</p>
      </SettingsSubpage>,
    );
    expect(html).toContain(">Thành viên</h1>");
    expect(html).toContain('href="/cai-dat"');
    expect(html).toContain("Cài đặt</a>");
    expect(html).toContain("<fieldset");
    expect(html).toContain("<p>Nội dung</p>");
  });
});
```

Trong `scripts/sw.test.ts`, test "install caches the shell, every page and the static files each page links", thêm `"/cai-dat/thanh-vien",` vào mảng `expect.arrayContaining([...])` ngay sau `"/kham-pha",`.

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/settings/subpage.test.tsx scripts/sw.test.ts`
Expected: FAIL — `Cannot find module './SettingsSubpage'`; test service worker báo thiếu `/cai-dat/thanh-vien`.

- [ ] **Step 3: Viết `components/settings/SettingsSubpage.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { PageHeader } from "@/components/ui/PageHeader";

export function SettingsSubpage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-2">
      <PageHeader title={title} back={{ href: "/cai-dat", label: "Cài đặt" }} />
      <OnlineOnly>{children}</OnlineOnly>
    </main>
  );
}
```

- [ ] **Step 4: Tạo 3 trang con**

`app/cai-dat/ho-so/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { BabyProfileSection } from "@/components/settings/BabyProfileSection";
import { SettingsSubpage } from "@/components/settings/SettingsSubpage";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <SettingsSubpage title="Hồ sơ bé">
            <BabyProfileSection
              baby={ctx.baby}
              isOwner={ctx.member.role === "owner"}
            />
          </SettingsSubpage>
        ) : null
      }
    </AuthGate>
  );
}
```

`app/cai-dat/thanh-vien/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { MembersSection } from "@/components/settings/MembersSection";
import { SettingsSubpage } from "@/components/settings/SettingsSubpage";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <SettingsSubpage title="Thành viên">
            <MembersSection me={ctx.member} />
          </SettingsSubpage>
        ) : null
      }
    </AuthGate>
  );
}
```

`app/cai-dat/cu-bu/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { FeedIntervalSection } from "@/components/settings/FeedIntervalSection";
import { SettingsSubpage } from "@/components/settings/SettingsSubpage";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <SettingsSubpage title="Khoảng cách cữ bú">
            <FeedIntervalSection
              baby={ctx.baby}
              isOwner={ctx.member.role === "owner"}
            />
          </SettingsSubpage>
        ) : null
      }
    </AuthGate>
  );
}
```

(Các section giữ tiêu đề `<h2>` riêng của chúng; Đợt 5 làm lại giao diện bên trong.)

- [ ] **Step 5: Thêm 3 trang vào service worker**

Trong mảng `PAGES` của `sw/sw.template.js`, ngay sau dòng `"/cai-dat",`, thêm:

```js
  "/cai-dat/ho-so",
  "/cai-dat/thanh-vien",
  "/cai-dat/cu-bu",
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components/settings/subpage.test.tsx scripts/sw.test.ts lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (subpage 1, service worker xanh, themeGuard 1); typecheck không lỗi.

- [ ] **Step 7: Commit**

```bash
git add components/settings/SettingsSubpage.tsx components/settings/subpage.test.tsx app/cai-dat/ho-so app/cai-dat/thanh-vien app/cai-dat/cu-bu sw/sw.template.js scripts/sw.test.ts
git commit -m "feat(settings): profile, members and feed interval sub-pages"
```

---

### Task 3: Nhóm Thông báo với công tắc iOS và sheet Tạm tắt nhắc

**Files:**

- Create: `components/settings/NotificationsGroup.tsx`, `components/settings/notifications.test.tsx`
- Modify: `components/ui/testTree.ts` (thêm `findElements`)

**Interfaces:**

- Consumes: `snoozeValue` (Task 1); `ListGroup`, `ListRow`, `Switch`, `Sheet`, `Button` (Đợt 1); `PREF_OPTIONS`, `PrefKey`, `SNOOZE_HOURS`, `snoozeUntil`, `snoozeText`; `DEFAULT_PREFS`, `useNotificationPrefs`, `useSavePrefs`; `DevicePushControl`; `useNow`; `toVietnameseError`.
- Produces:
  - `findElements(node: ReactNode, predicate: (el: ReactElement<TreeProps>) => boolean): ReactElement<TreeProps>[]` — duyệt `children` và mọi prop là phần tử (vd. `trailing`), không gọi component.
  - `NotificationsGroupView({ prefs: Record<PrefKey, boolean>; disabled: boolean; snooze: string; device: ReactNode; onToggle: (key: PrefKey, value: boolean) => void; onOpenSnooze: () => void })`.
  - `SnoozeSheet({ open: boolean; onClose: () => void; status: string; snoozed: boolean; busy: boolean; onPick: (hours: number) => void; onResume: () => void })`.
  - `NotificationsGroup({ userId: string })`.

Spec §6.8 nhóm THÔNG BÁO: `DevicePushControl` ở đầu nhóm; Nhắc cữ bú (`bell`), Nhắc khi bé thức lâu (`sun`), Nhắc lịch tiêm (`syringe`) là `Switch`, icon nền `cat-diaper`; Tạm tắt nhắc (`pause`, nền `muted`, giá trị "Không" hoặc "Đến HH:mm" ›) mở sheet 2 / 4 / 8 giờ hoặc "Bật lại ngay".

- [ ] **Step 1: Thêm `findElements` vào `components/ui/testTree.ts`**

Thêm cuối file:

```ts
// Like hostElements, but matches any element (host or component) and also looks inside
// element-valued props such as ListRow's `trailing`. Components are still not called.
export function findElements(
  node: ReactNode,
  predicate: (element: ReactElement<TreeProps>) => boolean,
): ReactElement<TreeProps>[] {
  const found: ReactElement<TreeProps>[] = [];
  const visit = (n: unknown): void => {
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (!isValidElement<TreeProps>(n)) return;
    if (predicate(n)) found.push(n);
    for (const value of Object.values(n.props)) visit(value);
  };
  visit(node);
  return found;
}
```

- [ ] **Step 2: Viết test hỏng**

`components/settings/notifications.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { ICON_PATHS } from "@/lib/ui/icons";
import { NotificationsGroupView, SnoozeSheet } from "./NotificationsGroup";

const prefs = { feed_reminder: true, wake_window: false, vaccine: true };
const view = (
  overrides: Partial<Parameters<typeof NotificationsGroupView>[0]> = {},
) => ({
  prefs,
  disabled: false,
  snooze: "Không",
  device: <p>Thiết bị</p>,
  onToggle: () => {},
  onOpenSnooze: () => {},
  ...overrides,
});

describe("NotificationsGroupView", () => {
  it("lists the device control, three switches and the snooze row", () => {
    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
    expect(html).toContain(">Thông báo</h2>");
    expect(html).toContain("<p>Thiết bị</p>");
    expect(html.match(/role="switch"/g)).toHaveLength(3);
    expect(html.match(/aria-checked="(true|false)"/g)).toEqual([
      'aria-checked="true"',
      'aria-checked="false"',
      'aria-checked="true"',
    ]);
    for (const label of [
      "Nhắc cữ bú",
      "Nhắc khi bé thức quá lâu",
      "Nhắc lịch tiêm",
      "Tạm tắt nhắc",
    ])
      expect(html).toContain(`>${label}</span>`);
    expect(html).toContain(">Không</span>");
    expect(html).toContain("bg-cat-diaper");
    expect(html).toContain(`d="${ICON_PATHS.bell}"`);
    expect(html).toContain(`d="${ICON_PATHS.pause}"`);
  });

  it("saves a switch change for its preference", () => {
    const onToggle = vi.fn();
    const switches = findElements(
      NotificationsGroupView(view({ onToggle })),
      (el) => el.props.checked !== undefined,
    );
    expect(switches).toHaveLength(3);
    (switches[1].props.onChange as (v: boolean) => void)(true);
    expect(onToggle).toHaveBeenCalledWith("wake_window", true);
  });

  it("opens the snooze sheet from its row, unless disabled", () => {
    const onOpenSnooze = vi.fn();
    const [row] = findElements(
      NotificationsGroupView(view({ onOpenSnooze })),
      (el) => el.props.label === "Tạm tắt nhắc",
    );
    (row.props.onClick as () => void)();
    expect(onOpenSnooze).toHaveBeenCalledOnce();
    const [locked] = findElements(
      NotificationsGroupView(view({ disabled: true })),
      (el) => el.props.label === "Tạm tắt nhắc",
    );
    expect(locked.props.onClick).toBeUndefined();
  });
});

describe("SnoozeSheet", () => {
  it("offers 2, 4 and 8 hours and explains the current state", () => {
    const html = renderToStaticMarkup(
      <SnoozeSheet
        open
        onClose={() => {}}
        status="Tạm tắt nhắc bú và nhắc thức trên mọi máy của bạn. Nhắc tiêm vẫn gửi."
        snoozed={false}
        busy={false}
        onPick={() => {}}
        onResume={() => {}}
      />,
    );
    expect(html).toContain(">Tạm tắt nhắc</h2>");
    for (const hours of [2, 4, 8])
      expect(html).toContain(`>${hours} giờ</button>`);
    expect(html).toContain("Nhắc tiêm vẫn gửi.");
    expect(html).not.toContain("Bật lại ngay");
  });

  it("offers Bật lại ngay while paused", () => {
    const html = renderToStaticMarkup(
      <SnoozeSheet
        open
        onClose={() => {}}
        status="Đang tạm tắt nhắc đến 22:00"
        snoozed
        busy={false}
        onPick={() => {}}
        onResume={() => {}}
      />,
    );
    expect(html).toContain(">Bật lại ngay</button>");
  });
});
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test components/settings/notifications.test.tsx`
Expected: FAIL — `Cannot find module './NotificationsGroup'`.

- [ ] **Step 4: Viết `components/settings/NotificationsGroup.tsx`**

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { DevicePushControl } from "@/components/push/DevicePushControl";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { toVietnameseError } from "@/lib/data/errors";
import {
  DEFAULT_PREFS,
  useNotificationPrefs,
  useSavePrefs,
} from "@/lib/data/notificationPrefs";
import { useNow } from "@/lib/hooks/useNow";
import {
  PREF_OPTIONS,
  SNOOZE_HOURS,
  snoozeText,
  snoozeUntil,
  type PrefKey,
} from "@/lib/rules/notifications";
import { snoozeValue } from "@/lib/rules/settingsText";
import type { IconName } from "@/lib/ui/icons";

const PREF_ICON: Record<PrefKey, IconName> = {
  feed_reminder: "bell",
  wake_window: "sun",
  vaccine: "syringe",
};

const SNOOZE_HINT =
  "Tạm tắt nhắc bú và nhắc thức trên mọi máy của bạn. Nhắc tiêm vẫn gửi.";

export function NotificationsGroupView({
  prefs,
  disabled,
  snooze,
  device,
  onToggle,
  onOpenSnooze,
}: {
  prefs: Record<PrefKey, boolean>;
  disabled: boolean;
  snooze: string;
  device: ReactNode;
  onToggle: (key: PrefKey, value: boolean) => void;
  onOpenSnooze: () => void;
}) {
  return (
    <ListGroup title="Thông báo">
      <li className="border-b border-line px-4 py-3">{device}</li>
      {PREF_OPTIONS.map((option) => (
        <ListRow
          key={option.key}
          label={option.label}
          icon={PREF_ICON[option.key]}
          iconColor="cat-diaper"
          trailing={
            <Switch
              checked={prefs[option.key]}
              label={option.label}
              disabled={disabled}
              onChange={(value) => onToggle(option.key, value)}
            />
          }
        />
      ))}
      <ListRow
        label="Tạm tắt nhắc"
        icon="pause"
        iconColor="muted"
        value={snooze}
        onClick={disabled ? undefined : onOpenSnooze}
        chevron={!disabled}
      />
    </ListGroup>
  );
}

export function SnoozeSheet({
  open,
  onClose,
  status,
  snoozed,
  busy,
  onPick,
  onResume,
}: {
  open: boolean;
  onClose: () => void;
  status: string;
  snoozed: boolean;
  busy: boolean;
  onPick: (hours: number) => void;
  onResume: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Tạm tắt nhắc">
      <p className="mb-4 text-[15px] text-muted">{status}</p>
      <div className="grid grid-cols-3 gap-2">
        {SNOOZE_HOURS.map((hours) => (
          <Button
            key={hours}
            variant="secondary"
            disabled={busy}
            onClick={() => onPick(hours)}
          >
            {`${hours} giờ`}
          </Button>
        ))}
      </div>
      {snoozed && (
        <Button
          variant="ghost"
          block
          disabled={busy}
          className="mt-3"
          onClick={onResume}
        >
          Bật lại ngay
        </Button>
      )}
    </Sheet>
  );
}

export function NotificationsGroup({ userId }: { userId: string }) {
  const now = useNow(60_000);
  const prefs = useNotificationPrefs(userId);
  const save = useSavePrefs(userId);
  const [open, setOpen] = useState(false);
  const values = prefs.data ?? DEFAULT_PREFS;
  const paused = snoozeText(values.snooze_until, now);
  return (
    <>
      <NotificationsGroupView
        prefs={values}
        disabled={!prefs.isSuccess || save.isPending}
        snooze={snoozeValue(values.snooze_until, now)}
        device={<DevicePushControl />}
        onToggle={(key, value) => save.mutate({ [key]: value })}
        onOpenSnooze={() => setOpen(true)}
      />
      <SnoozeSheet
        open={open}
        onClose={() => setOpen(false)}
        status={paused ?? SNOOZE_HINT}
        snoozed={paused !== null}
        busy={save.isPending}
        onPick={(hours) =>
          save.mutate(
            { snooze_until: snoozeUntil(new Date(), hours) },
            { onSuccess: () => setOpen(false) },
          )
        }
        onResume={() =>
          save.mutate(
            { snooze_until: null },
            { onSuccess: () => setOpen(false) },
          )
        }
      />
      {(prefs.isError || save.isError) && (
        <p role="alert" className="mx-4 text-danger">
          {toVietnameseError(prefs.error ?? save.error)}
        </p>
      )}
    </>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/settings/notifications.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (NotificationsGroupView 3, SnoozeSheet 2, themeGuard 1); typecheck không lỗi. Nếu typecheck báo `save.mutate({ [key]: value })` sai kiểu, sửa thành `save.mutate({ [key]: value } as Partial<Record<PrefKey, boolean>>)` (chính `NotificationsSection` cũ đang gọi cùng dạng).

- [ ] **Step 6: Commit**

```bash
git add components/ui/testTree.ts components/settings/NotificationsGroup.tsx components/settings/notifications.test.tsx
git commit -m "feat(settings): notification switches and snooze sheet"
```

---

### Task 4: Nhóm Giao diện và sheet Giờ ban đêm

**Files:**

- Create: `components/settings/AppearanceGroup.tsx`, `components/settings/appearance.test.tsx`

**Interfaces:**

- Consumes: `nightHoursText` (Task 1); `findElements` (Task 3); `Segmented`, `ListGroup`, `ListRow`, `Switch`, `Sheet` (Đợt 1); `useThemePref`, `useNightSchedule` (`lib/hooks/useTheme.ts`); `THEME_OPTIONS` (`lib/theme.ts`); `HALF_HOURS`, `NightSchedule`, `ThemePref` (`lib/rules/theme.ts`).
- Produces:
  - `AppearanceGroupView({ pref: ThemePref; onPref: (next: ThemePref) => void; schedule: NightSchedule; onSchedule: (next: NightSchedule) => void; onOpenHours: () => void })`.
  - `NightHoursSheet({ open: boolean; onClose: () => void; schedule: NightSchedule; onSchedule: (next: NightSchedule) => void })`.
  - `AppearanceGroup()`.

Spec §6.8 nhóm GIAO DIỆN: `Segmented` Sáng / Tối / Tự động; hàng "Ban đêm theo lịch" (`moon`, nền `cat-diaper`, `Switch`); hàng "Giờ ban đêm" (giá trị "21:00–06:00" ›) mở sheet chọn giờ bắt đầu và kết thúc theo bước 30 phút.

- [ ] **Step 1: Viết test hỏng**

`components/settings/appearance.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { DEFAULT_NIGHT_SCHEDULE } from "@/lib/rules/theme";
import { ICON_PATHS } from "@/lib/ui/icons";
import { AppearanceGroupView, NightHoursSheet } from "./AppearanceGroup";

const base = {
  pref: "system" as const,
  onPref: () => {},
  schedule: DEFAULT_NIGHT_SCHEDULE,
  onSchedule: () => {},
  onOpenHours: () => {},
};

describe("AppearanceGroupView", () => {
  it("shows the three-way theme control, the night switch and the night hours", () => {
    const html = renderToStaticMarkup(<AppearanceGroupView {...base} />);
    expect(html).toContain(">Giao diện</h2>");
    expect(html).toContain('aria-label="Giao diện"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Tự động<\/button>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Sáng<\/button>/);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain(">Giờ ban đêm</span>");
    expect(html).toContain(">21:00–06:00</span>");
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
  });

  it("changes theme and toggles the schedule", () => {
    const onPref = vi.fn();
    const onSchedule = vi.fn();
    const tree = AppearanceGroupView({ ...base, onPref, onSchedule });
    const [segmented] = findElements(
      tree,
      (el) => el.props.options !== undefined,
    );
    (segmented.props.onChange as (v: string) => void)("dark");
    expect(onPref).toHaveBeenCalledWith("dark");
    const [nightSwitch] = findElements(
      tree,
      (el) => el.props.checked !== undefined,
    );
    (nightSwitch.props.onChange as (v: boolean) => void)(false);
    expect(onSchedule).toHaveBeenCalledWith({
      ...DEFAULT_NIGHT_SCHEDULE,
      enabled: false,
    });
  });

  it("night hours open a sheet only while the schedule is on", () => {
    const onOpenHours = vi.fn();
    const [row] = findElements(
      AppearanceGroupView({ ...base, onOpenHours }),
      (el) => el.props.label === "Giờ ban đêm",
    );
    (row.props.onClick as () => void)();
    expect(onOpenHours).toHaveBeenCalledOnce();
    const off = { ...DEFAULT_NIGHT_SCHEDULE, enabled: false };
    const [locked] = findElements(
      AppearanceGroupView({ ...base, schedule: off }),
      (el) => el.props.label === "Giờ ban đêm",
    );
    expect(locked.props.onClick).toBeUndefined();
  });
});

describe("NightHoursSheet", () => {
  it("picks start and end in 30-minute steps", () => {
    const html = renderToStaticMarkup(
      <NightHoursSheet
        open
        onClose={() => {}}
        schedule={DEFAULT_NIGHT_SCHEDULE}
        onSchedule={() => {}}
      />,
    );
    expect(html).toContain(">Giờ ban đêm</h2>");
    expect(html.match(/<select/g)).toHaveLength(2);
    expect(html.match(/<option/g)).toHaveLength(96);
    expect(html).toContain('<option value="21:00" selected="">21:00</option>');
    expect(html).toContain('<option value="06:00" selected="">06:00</option>');
    expect(html).toContain(">Bắt đầu");
    expect(html).toContain(">Kết thúc");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/settings/appearance.test.tsx`
Expected: FAIL — `Cannot find module './AppearanceGroup'`.

- [ ] **Step 3: Viết `components/settings/AppearanceGroup.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useNightSchedule, useThemePref } from "@/lib/hooks/useTheme";
import { nightHoursText } from "@/lib/rules/settingsText";
import {
  HALF_HOURS,
  type NightSchedule,
  type ThemePref,
} from "@/lib/rules/theme";
import { THEME_OPTIONS } from "@/lib/theme";

export function AppearanceGroupView({
  pref,
  onPref,
  schedule,
  onSchedule,
  onOpenHours,
}: {
  pref: ThemePref;
  onPref: (next: ThemePref) => void;
  schedule: NightSchedule;
  onSchedule: (next: NightSchedule) => void;
  onOpenHours: () => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="mx-4 text-[13px] font-semibold tracking-[0.04em] text-muted uppercase">
        Giao diện
      </h2>
      <Segmented
        label="Giao diện"
        options={THEME_OPTIONS}
        value={pref}
        onChange={onPref}
      />
      <ListGroup>
        <ListRow
          label="Ban đêm theo lịch"
          detail="Tông hổ phách dịu mắt khi cho bé bú đêm"
          icon="moon"
          iconColor="cat-diaper"
          trailing={
            <Switch
              checked={schedule.enabled}
              label="Ban đêm theo lịch"
              onChange={(enabled) => onSchedule({ ...schedule, enabled })}
            />
          }
        />
        <ListRow
          label="Giờ ban đêm"
          icon="clock"
          iconColor="muted"
          value={nightHoursText(schedule)}
          onClick={schedule.enabled ? onOpenHours : undefined}
          chevron={schedule.enabled}
        />
      </ListGroup>
    </section>
  );
}

const SELECT = "glass min-h-11 rounded-[16px] px-3 text-base text-ink";

export function NightHoursSheet({
  open,
  onClose,
  schedule,
  onSchedule,
}: {
  open: boolean;
  onClose: () => void;
  schedule: NightSchedule;
  onSchedule: (next: NightSchedule) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Giờ ban đêm">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-muted">
          Bắt đầu
          <select
            className={SELECT}
            value={schedule.start}
            onChange={(e) => onSchedule({ ...schedule, start: e.target.value })}
          >
            {HALF_HOURS.map((hm) => (
              <option key={hm} value={hm}>
                {hm}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-muted">
          Kết thúc
          <select
            className={SELECT}
            value={schedule.end}
            onChange={(e) => onSchedule({ ...schedule, end: e.target.value })}
          >
            {HALF_HOURS.map((hm) => (
              <option key={hm} value={hm}>
                {hm}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Sheet>
  );
}

export function AppearanceGroup() {
  const [pref, setPref] = useThemePref();
  const [schedule, setSchedule] = useNightSchedule();
  const [open, setOpen] = useState(false);
  return (
    <>
      <AppearanceGroupView
        pref={pref}
        onPref={setPref}
        schedule={schedule}
        onSchedule={setSchedule}
        onOpenHours={() => setOpen(true)}
      />
      <NightHoursSheet
        open={open}
        onClose={() => setOpen(false)}
        schedule={schedule}
        onSchedule={setSchedule}
      />
    </>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/settings/appearance.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (AppearanceGroupView 3, NightHoursSheet 1, themeGuard 1); typecheck không lỗi. Nếu React in thuộc tính `selected` khác dạng `selected=""`, sửa assertion ở test cho khớp đúng chuỗi React 19 in ra (giữ ý nghĩa: đúng 21:00 và 06:00 được chọn) và ghi lại trong báo cáo.

- [ ] **Step 5: Commit**

```bash
git add components/settings/AppearanceGroup.tsx components/settings/appearance.test.tsx
git commit -m "feat(settings): theme control, night schedule switch and hours sheet"
```

---

### Task 5: Ráp màn Cài đặt mới

**Files:**

- Modify: `components/settings/SettingsScreen.tsx` (viết lại toàn file), `app/cai-dat/page.tsx`, `docs/device-checklist.md`
- Delete: `components/settings/NotificationsSection.tsx`

**Interfaces:**

- Consumes: `babySubtitle`, `memberCountText` (Task 1); `NotificationsGroup` (Task 3); `AppearanceGroup` (Task 4); `PageHeader`, `ListGroup`, `ListRow`, `Icon` (Đợt 1–2); `useMembers`, `formatInterval`, `roleLabel`, `LOGO_GRADIENT`, `LOGO_INK`, `supabase`, `OnlineOnly`.
- Produces: `SettingsScreen({ member, baby, userId })`.

- [ ] **Step 1: Viết lại `components/settings/SettingsScreen.tsx`**

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { LOGO_GRADIENT, LOGO_INK } from "@/lib/brand/logo";
import { useMembers } from "@/lib/data/family";
import { formatInterval, roleLabel } from "@/lib/rules/familySettings";
import { babySubtitle, memberCountText } from "@/lib/rules/settingsText";
import { supabase } from "@/lib/supabase/client";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { AppearanceGroup } from "./AppearanceGroup";
import { NotificationsGroup } from "./NotificationsGroup";

const PROFILE_CARD = "glass flex items-center gap-3.5 rounded-[26px] p-4 text-ink";

export function SettingsScreen({
  member,
  baby,
  userId,
}: {
  member: FamilyMember;
  baby: Baby;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const members = useMembers(baby.family_id);
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

  const profile = (
    <>
      <span
        aria-hidden="true"
        className="flex size-[60px] shrink-0 items-center justify-center rounded-full text-2xl font-bold in-data-[theme=night]:opacity-60"
        style={{
          backgroundImage: `linear-gradient(140deg, ${LOGO_GRADIENT.from}, ${LOGO_GRADIENT.to})`,
          color: LOGO_INK,
        }}
      >
        {baby.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-xl font-bold">{baby.name}</span>
        <span className="text-sm text-muted">{babySubtitle(baby)}</span>
      </span>
    </>
  );

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
      <PageHeader title="Cài đặt" back={{ href: "/", label: "Hôm nay" }} />

      {isOwner ? (
        <Link href="/cai-dat/ho-so" className={PROFILE_CARD}>
          {profile}
          <Icon name="chevronRight" size={16} className="text-muted" />
        </Link>
      ) : (
        <div className={PROFILE_CARD}>{profile}</div>
      )}

      <OnlineOnly>
        <ListGroup title="Gia đình">
          <ListRow
            label="Thành viên"
            icon="users"
            iconColor="cat-sleep"
            value={
              members.data ? memberCountText(members.data.length) : undefined
            }
            href="/cai-dat/thanh-vien"
          />
          <ListRow
            label="Khoảng cách cữ bú"
            icon="clock"
            iconColor="cat-feed"
            value={formatInterval(baby.feed_interval_min)}
            href={isOwner ? "/cai-dat/cu-bu" : undefined}
          />
        </ListGroup>
        <NotificationsGroup userId={userId} />
      </OnlineOnly>

      <AppearanceGroup />

      <ListGroup title="Ứng dụng">
        <ListRow
          label="Cài Kim Bun lên màn hình chính"
          icon="phoneApp"
          iconColor="cat-temp"
          href="/cai-app"
        />
      </ListGroup>

      <ListGroup title="Tài khoản">
        <ListRow
          label={`${member.display_name} · ${roleLabel(member.role)}`}
          detail="Đăng nhập bằng Google"
        />
        <li>
          <button
            type="button"
            disabled={signingOut}
            onClick={signOut}
            className="flex min-h-[52px] w-full items-center justify-center text-base font-semibold text-danger disabled:opacity-50"
          >
            Đăng xuất
          </button>
        </li>
      </ListGroup>
    </main>
  );
}
```

- [ ] **Step 2: Sửa `app/cai-dat/page.tsx` và xóa section cũ**

Trong `app/cai-dat/page.tsx`, bỏ prop `email`:

```tsx
<SettingsScreen member={ctx.member} baby={ctx.baby} userId={session.user.id} />
```

Run: `git rm components/settings/NotificationsSection.tsx`

- [ ] **Step 3: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh (504 có sẵn + 5 settingsText + 1 subpage + 5 notifications + 4 appearance = 519); build xong, bảng route có `/cai-dat/ho-so`, `/cai-dat/thanh-vien`, `/cai-dat/cu-bu`.

Run: `grep -rn "NotificationsSection\|email" components/settings/SettingsScreen.tsx app/cai-dat/page.tsx; grep -rn "NotificationsSection" app components`
Expected: không có kết quả.

- [ ] **Step 4: Thêm checklist bước 25 vào cuối `docs/device-checklist.md`**

```markdown
## Bước 25 — Cài đặt kiểu iOS (UI đợt 2)

1. Bấm avatar ở Trang chủ. Kỳ vọng: trang Cài đặt có nút "‹ Hôm nay", tiêu đề lớn, thẻ hồ sơ bé (tên, giới tính, ngày sinh, cân nặng lúc sinh), rồi các nhóm GIA ĐÌNH, THÔNG BÁO, GIAO DIỆN, ỨNG DỤNG, TÀI KHOẢN. Không hiện email.
2. Bấm thẻ hồ sơ, Thành viên, Khoảng cách cữ bú (chủ nhà). Kỳ vọng: mỗi trang con có nút "‹ Cài đặt" và nội dung như trước. Tài khoản thành viên thường: thẻ hồ sơ và hàng Cữ bú không có "›", không mở được. Trang con đang hiện tiêu đề hai lần (tiêu đề lớn và tiêu đề cũ của form): đã biết, Đợt 5 làm lại.
3. Thông báo: gạt một công tắc nhắc; đóng mở lại app vẫn giữ. Bấm "Tạm tắt nhắc" → chọn 2 giờ. Kỳ vọng: hàng hiện "Đến HH:mm"; mở lại sheet có "Bật lại ngay".
4. Giao diện: đổi Sáng / Tối / Tự động; tắt bật "Ban đêm theo lịch"; đổi "Giờ ban đêm" trong sheet. Kỳ vọng: app đổi theme ngay, giá trị hàng Giờ ban đêm cập nhật.
5. Bật "Giảm độ trong suốt" (Cài đặt iOS → Trợ năng → Màn hình & cỡ chữ). Kỳ vọng: các khối kính thành nền đặc, chữ vẫn rõ ở cả 3 theme.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 5: Kiểm trên trình duyệt**

Run: `bun run dev`, mở `http://localhost:3000/cai-dat` ở bề rộng 375 px, đăng nhập. **Không gạt công tắc thông báo, không bấm Tạm tắt, không lưu hồ sơ/cữ bú, không thêm/xóa thành viên** (dữ liệu thật).
Expected:

- Đúng thứ tự nhóm như checklist bước 25 mục 1; nút "Đăng xuất" chữ đỏ ở cuối; không có email.
- Mở 3 trang con: có nút "‹ Cài đặt", form cũ hiện bên trong; bấm "‹ Cài đặt" quay về.
- Đổi Sáng → Tối → Tự động: theme đổi ngay. Tắt rồi bật lại "Ban đêm theo lịch". Mở "Giờ ban đêm": sheet có 2 ô chọn giờ, đóng sheet không đổi gì.
- Đặt lại lựa chọn giao diện như ban đầu. Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 6: Commit**

```bash
git add -A components/settings app/cai-dat/page.tsx docs/device-checklist.md
git commit -m "feat(settings): iOS-style settings page; checklist step 25"
```

---

## Kết thúc M4 (Đợt 2)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 519 test xanh, typecheck không lỗi, build xong.
- [ ] Đợt 2 xong. Bước tiếp theo: lập plan Đợt 3 (Trang chủ mới: thẻ chính 4 trạng thái, bấm giờ, 24 giờ, Hoàn tác — spec §7).
