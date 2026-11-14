# Kim Bun UI — Đợt 2 / M3 (header Trang chủ và nút trăng) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-14

**Goal:** Thay header Trang chủ ("tên bé · Xin chào …") bằng header kiểu iOS theo spec §6.5: avatar bé (bấm vào ra Cài đặt) với tên và tuổi, nút trăng bật/tắt Ban đêm một chạm, nút Khẩn cấp.

**Architecture:**

- `useNightMode()` (thêm vào `lib/hooks/useTheme.ts`) theo dõi `data-theme` trên `<html>` và bật/tắt Ban đêm bằng cách ghi override đến mốc lịch kế tiếp (luật `toggleNightOverride` đã có từ Đợt 1 / M3), rồi gọi `applyTheme()`.
- `HomeHeaderView` (không hook, test bằng `renderToStaticMarkup`) + `HomeHeader` (bọc ngoài, dùng `useNightMode`). Màu avatar lấy từ `lib/brand/logo.ts` qua `style`, không viết mã hex trong `.tsx`.
- `HomeScreen` đặt header lên đầu (trên banner cảnh báo, đúng thứ tự spec §7.1) và bỏ dòng "Xin chào …".

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, Vitest 5 (`react-dom/server`), Bun. Không thêm gói nào.

**Các mốc của Đợt 2 (spec §12):**

- **M1:** tab bar, `PageHeader`, `/kham-pha` — xong. **M2:** nút "+" và bảng 9 hành động — xong (nhánh `feat/kim-bun-dot2-m2`).
- **M3 (plan này):** spec §6.5; checklist bước 3 phần nút trăng.
- **M4 (plan sau):** Cài đặt kiểu iOS và 3 trang con (spec §6.8); checklist bước 2 và bước 4 phần Cài đặt.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI; icon dùng `components/ui/Icon.tsx`.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Không đổi `localStorage` key (`be-yeu-theme`, `be-yeu-night-schedule`, `be-yeu-night-override`).
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay, không bấm Lưu, không bấm ô bấm giờ. (Nút trăng chỉ ghi `localStorage` của trình duyệt, bấm thoải mái.)
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".

## Contracts with Other Plans

**Consumes** (đã có trong code trên nhánh `feat/kim-bun-dot2-m2`):

- `lib/hooks/useTheme.ts`: `applyTheme(): ThemeName`, các hàm nội bộ `storageGet(key)`, `storageSet(key, value)`.
- `lib/theme.ts`: `NIGHT_OVERRIDE_KEY`, `readThemeState(get, now): ThemeState` (`ThemeState.schedule: NightSchedule`).
- `lib/rules/theme.ts`: `toggleNightOverride(current: ThemeName, schedule: NightSchedule, now: Date): { on: boolean; until: string }`.
- `lib/ui/tokens.ts`: `type ThemeName`.
- `lib/brand/logo.ts`: `LOGO_GRADIENT: { from: "#FFD9C7"; to: "#EE7AA3" }`.
- `components/ui/IconButton.tsx`: `<IconButton label icon variant? small? filled? …ButtonHTMLAttributes>` (truyền `aria-pressed` qua props còn lại); `components/ui/Icon.tsx`.
- `components/home/HomeScreen.tsx` (đã dùng `useQuickActions` từ M2), `app/page.tsx`.

**Produces** (Đợt 2 / M4 và Đợt 3 dùng):

- `lib/brand/logo.ts`: `LOGO_INK = "#2B1B22"` (màu chữ trên nền gradient logo).
- `lib/hooks/useTheme.ts`: `useNightMode(): { night: boolean; toggle: () => void }`.
- `components/home/HomeHeader.tsx`: `<HomeHeaderView name age night onToggleNight />`, `<HomeHeader name age />`.
- `HomeScreen` nhận `{ baby, userId }` (bỏ `member`); header nằm trên cùng Trang chủ.

---

### Task 1: `LOGO_INK` và hook `useNightMode`

**Files:**

- Modify: `lib/brand/logo.ts`, `lib/brand/logo.test.ts`, `lib/hooks/useTheme.ts`
- Create: `components/home/nightmode.test.tsx`

**Interfaces:**

- Consumes: `applyTheme`, `storageGet`, `storageSet` (cùng file `lib/hooks/useTheme.ts`); `readThemeState`, `NIGHT_OVERRIDE_KEY` (`lib/theme.ts`); `toggleNightOverride` (`lib/rules/theme.ts`).
- Produces: `LOGO_INK`, `useNightMode` (chữ ký ở Contracts). `toggle()` ghi `be-yeu-night-override` = `toggleNightOverride(<theme hiện tại>, schedule, now)` rồi `applyTheme()`; `night` cập nhật theo `data-theme` của `<html>` (kể cả khi lịch tự chuyển).

- [ ] **Step 1: Viết test hỏng**

Thêm vào cuối `describe("logo", …)` trong `lib/brand/logo.test.ts` (và thêm `LOGO_INK` vào dòng import từ `"./logo"`):

```ts
it("exports the face colour used for text on the logo gradient", () => {
  expect(LOGO_INK).toBe("#2B1B22");
  expect(LOGO_SVG_ROUNDED).toContain(`stroke="${LOGO_INK}"`);
});
```

`components/home/nightmode.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useNightMode } from "@/lib/hooks/useTheme";

function Probe() {
  const { night, toggle } = useNightMode();
  return <span>{`${night},${typeof toggle}`}</span>;
}

describe("useNightMode", () => {
  it("starts as day on the server and exposes a toggle", () => {
    expect(renderToStaticMarkup(<Probe />)).toBe("<span>false,function</span>");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/brand/logo.test.ts components/home/nightmode.test.tsx`
Expected: FAIL — `LOGO_INK` không được export (`expected undefined to be '#2B1B22'`); `useNightMode is not a function` (hoặc không được export).

- [ ] **Step 3: Thêm `LOGO_INK` vào `lib/brand/logo.ts`**

Ngay dưới dòng `export const LOGO_GRADIENT = …`, thêm:

```ts
// The bun's face colour; also the text colour on the logo gradient (e.g. the baby's avatar).
export const LOGO_INK = "#2B1B22";
```

Trong chuỗi `ART` của file, thay hai chỗ `stroke="#2B1B22"` bằng `stroke="${LOGO_INK}"` và đổi hai chuỗi đó từ nháy đơn sang template string (dấu `` ` ``), ví dụ:

```ts
  `<path d="M43 67c2.5 3 7.5 3 10 0M67 67c2.5 3 7.5 3 10 0" fill="none" stroke="${LOGO_INK}" stroke-width="3.6" stroke-linecap="round"/>` +
  `<path d="M55 76c3 2.4 7 2.4 10 0" fill="none" stroke="${LOGO_INK}" stroke-width="3" stroke-linecap="round"/>` +
```

(`LOGO_INK` phải khai báo trước `ART`. Nội dung SVG không đổi, các test logo cũ vẫn xanh.)

- [ ] **Step 4: Thêm `useNightMode` vào cuối `lib/hooks/useTheme.ts`**

Sửa import từ `@/lib/rules/theme` thành:

```ts
import {
  DEFAULT_NIGHT_SCHEDULE,
  resolveActiveTheme,
  toggleNightOverride,
  type NightSchedule,
} from "@/lib/rules/theme";
```

Thêm cuối file:

```ts
function currentTheme(): ThemeName {
  const value = document.documentElement.dataset.theme;
  return value === "dark" || value === "night" ? value : "light";
}

// Spec §6.6: the moon button turns Ban đêm on/off until the next schedule boundary.
export function useNightMode(): { night: boolean; toggle: () => void } {
  const [night, setNight] = useState(false);
  useEffect(() => {
    const sync = () => setNight(currentTheme() === "night");
    sync();
    // applyTheme() (schedule tick, system change, settings) rewrites data-theme; follow it.
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  function toggle() {
    const now = new Date();
    const { schedule } = readThemeState(storageGet, now);
    storageSet(
      NIGHT_OVERRIDE_KEY,
      JSON.stringify(toggleNightOverride(currentTheme(), schedule, now)),
    );
    applyTheme();
  }
  return { night, toggle };
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test lib/brand/logo.test.ts components/home/nightmode.test.tsx lib/theme.test.ts && bun run typecheck`
Expected: PASS (logo 8, nightmode 1, theme 19); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add lib/brand/logo.ts lib/brand/logo.test.ts lib/hooks/useTheme.ts components/home/nightmode.test.tsx
git commit -m "feat(theme): one-tap night mode hook and logo ink colour"
```

---

### Task 2: `HomeHeader`

**Files:**

- Create: `components/home/HomeHeader.tsx`, `components/home/homeheader.test.tsx`

**Interfaces:**

- Consumes: `useNightMode` (Task 1); `LOGO_GRADIENT`, `LOGO_INK` (`lib/brand/logo.ts`); `IconButton`, `Icon` (Đợt 1).
- Produces: `HomeHeaderView`, `HomeHeader` (chữ ký ở Contracts).

Spec §6.5: trái là avatar tròn 44 (chữ cái đầu tên bé, nền gradient logo) + tên 20/700 + tuổi 13 `--color-muted`, cả khối là link `/cai-dat`; phải là nút trăng (`moon`, `filled` khi Ban đêm, `aria-pressed`) và nút Khẩn cấp (`phone`, `--color-danger`) → `/khan-cap`.

Nút Khẩn cấp là `<Link>` (điều hướng nên dùng thẻ liên kết) mang đúng kiểu của `IconButton` biến thể `danger` (`glass … text-danger`, 44 pt), thay vì `<IconButton>` như spec viết.

- [ ] **Step 1: Viết test hỏng**

`components/home/homeheader.test.tsx`:

```tsx
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LOGO_GRADIENT, LOGO_INK } from "@/lib/brand/logo";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HomeHeader, HomeHeaderView } from "./HomeHeader";

type AnyProps = Record<string, unknown> & { children?: ReactNode };

// Finds an element (host or component, e.g. <IconButton />) by its `label` or `aria-label` prop.
function findByLabel(
  node: ReactNode,
  label: string,
): ReactElement<AnyProps> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findByLabel(child, label);
      if (found) return found;
    }
    return undefined;
  }
  if (!isValidElement<AnyProps>(node)) return undefined;
  if (node.props.label === label || node.props["aria-label"] === label)
    return node;
  return findByLabel(node.props.children, label);
}

const day = renderToStaticMarkup(
  <HomeHeaderView
    name="bun"
    age="2 tháng 4 ngày"
    night={false}
    onToggleNight={() => {}}
  />,
);

describe("HomeHeaderView", () => {
  it("links the avatar, name and age to Cài đặt", () => {
    expect(day).toContain('href="/cai-dat"');
    expect(day).toContain(">B</span>");
    expect(day).toContain(
      `linear-gradient(140deg, ${LOGO_GRADIENT.from}, ${LOGO_GRADIENT.to})`,
    );
    expect(day).toContain(`color:${LOGO_INK}`);
    expect(day).toContain("size-11 shrink-0 items-center");
    expect(day).toContain(">bun</span>");
    expect(day).toContain(">2 tháng 4 ngày</span>");
    expect(day).not.toContain("Xin chào");
  });

  it("has an emergency button that opens /khan-cap", () => {
    expect(day).toContain('href="/khan-cap"');
    expect(day).toContain('aria-label="Khẩn cấp"');
    expect(day).toContain("text-danger");
    expect(day).toContain(`d="${ICON_PATHS.phone}"`);
  });

  it("the moon button says what it will do and shows the state", () => {
    expect(day).toContain('aria-label="Bật chế độ ban đêm"');
    expect(day).toContain('aria-pressed="false"');
    expect(day.match(/<button/g)).toHaveLength(1);
    const night = renderToStaticMarkup(
      <HomeHeaderView name="Bun" age="x" night onToggleNight={() => {}} />,
    );
    expect(night).toContain('aria-label="Tắt chế độ ban đêm"');
    expect(night).toContain('aria-pressed="true"');
    expect(night).toContain('fill="currentColor"');
    expect(night).toContain(`d="${ICON_PATHS.moon}"`);
  });

  it("pressing the moon calls onToggleNight", () => {
    const onToggleNight = vi.fn();
    const tree = HomeHeaderView({
      name: "Bun",
      age: "x",
      night: false,
      onToggleNight,
    });
    const moon = findByLabel(tree, "Bật chế độ ban đêm");
    (moon?.props.onClick as () => void)();
    expect(onToggleNight).toHaveBeenCalledOnce();
  });
});

describe("HomeHeader", () => {
  it("renders the day state on the server", () => {
    const html = renderToStaticMarkup(<HomeHeader name="Bun" age="2 tháng" />);
    expect(html).toContain('aria-label="Bật chế độ ban đêm"');
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/homeheader.test.tsx`
Expected: FAIL — `Cannot find module './HomeHeader'`.

- [ ] **Step 3: Viết `components/home/HomeHeader.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { LOGO_GRADIENT, LOGO_INK } from "@/lib/brand/logo";
import { useNightMode } from "@/lib/hooks/useTheme";

export function HomeHeaderView({
  name,
  age,
  night,
  onToggleNight,
}: {
  name: string;
  age: string;
  night: boolean;
  onToggleNight: () => void;
}) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <header className="flex items-center justify-between gap-3">
      <Link
        href="/cai-dat"
        className="flex min-h-11 min-w-0 items-center gap-2.5 text-ink"
      >
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold in-data-[theme=night]:opacity-60"
          style={{
            backgroundImage: `linear-gradient(140deg, ${LOGO_GRADIENT.from}, ${LOGO_GRADIENT.to})`,
            color: LOGO_INK,
          }}
        >
          {initial}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xl leading-6 font-bold">{name}</span>
          <span className="text-[13px] text-muted">{age}</span>
        </span>
      </Link>
      <div className="flex shrink-0 gap-2">
        <IconButton
          label={night ? "Tắt chế độ ban đêm" : "Bật chế độ ban đêm"}
          icon="moon"
          filled={night}
          aria-pressed={night}
          onClick={onToggleNight}
        />
        <Link
          href="/khan-cap"
          aria-label="Khẩn cấp"
          className="glass inline-flex size-11 items-center justify-center rounded-full text-danger"
        >
          <Icon name="phone" size={20} />
        </Link>
      </div>
    </header>
  );
}

export function HomeHeader({ name, age }: { name: string; age: string }) {
  const { night, toggle } = useNightMode();
  return (
    <HomeHeaderView
      name={name}
      age={age}
      night={night}
      onToggleNight={toggle}
    />
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/home/homeheader.test.tsx lib/themeGuard.test.ts`
Expected: PASS (HomeHeaderView 4, HomeHeader 1, themeGuard 1).

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeHeader.tsx components/home/homeheader.test.tsx
git commit -m "feat(home): iOS-style header with avatar, moon and emergency buttons"
```

---
### Task 3: Trang chủ dùng header mới

**Files:**

- Modify: `components/home/HomeScreen.tsx`, `app/page.tsx`, `docs/device-checklist.md`

**Interfaces:**

- Consumes: `HomeHeader` (Task 2).
- Produces: `HomeScreen({ baby, userId })`; header là phần tử đầu tiên của `<main>`, trên `AlertBanners`.

- [ ] **Step 1: Sửa `components/home/HomeScreen.tsx`**

Thêm import (cạnh các import `./…`):

```tsx
import { HomeHeader } from "./HomeHeader";
```

Xóa `FamilyMember` khỏi dòng `import type { Baby, FamilyMember } from "@/lib/supabase/rows";` (còn `import type { Baby } from "@/lib/supabase/rows";`).

Đổi chữ ký hàm:

```tsx
export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
```

Thay đoạn mở đầu JSX:

```tsx
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <AlertBanners alerts={alerts} />

      <header>
        <h1 className="text-2xl font-semibold">{baby.name}</h1>
        <p className="text-muted">
          {formatAgeVi(baby.dob, now)} · Xin chào {member.display_name}
        </p>
      </header>
```

bằng:

```tsx
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <HomeHeader name={baby.name} age={formatAgeVi(baby.dob, now)} />

      <AlertBanners alerts={alerts} />
```

- [ ] **Step 2: Sửa `app/page.tsx`**

Bỏ prop `member`:

```tsx
<HomeScreen baby={ctx.baby} userId={session.user.id} />
```

- [ ] **Step 3: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh (497 có sẵn + 1 logo + 1 nightmode + 5 homeheader = 504); build xong.

Run: `grep -n "Xin chào\|member" components/home/HomeScreen.tsx`
Expected: chỉ còn các dòng `members` (danh sách thành viên dùng cho `nameOf`), không còn `Xin chào` hay prop `member`.

- [ ] **Step 4: Thêm checklist bước 24 vào cuối `docs/device-checklist.md`**

```markdown
## Bước 24 — Header Trang chủ và nút trăng (UI đợt 2)

1. Mở Trang chủ. Kỳ vọng: trên cùng là avatar tròn chữ cái đầu tên bé (nền đào–hồng), tên bé và tuổi; bên phải nút trăng và nút điện thoại đỏ. Không còn dòng "Xin chào …".
2. Bấm avatar hoặc tên bé. Kỳ vọng: mở Cài đặt. Bấm nút điện thoại. Kỳ vọng: mở Khẩn cấp.
3. Ban ngày, bấm nút trăng. Kỳ vọng: app chuyển ngay sang tông hổ phách, trăng tô đặc. Bấm lại: về giao diện ban ngày.
4. Sau 21:00 (lịch đang bật), bấm nút trăng. Kỳ vọng: tắt Ban đêm đến 06:00 sáng; đóng mở lại app vẫn giữ.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 5: Kiểm trên trình duyệt**

Run: `bun run dev`, mở `http://localhost:3000` ở bề rộng 375 px, đăng nhập. (Không bấm Lưu, không bấm nút bấm giờ.)
Expected:

- Dòng "N mục chờ đồng bộ" (`SyncBar`, do `AuthGate` vẽ) vẫn nằm trên header khi có mục chờ; spec §7.1 muốn nó nằm dưới header, việc này thuộc Đợt 3, không sửa ở đây.
- Header mới ở trên cùng, đúng bố cục Step 4 / mục 1; tên dài bị cắt bằng dấu "…" chứ không đẩy nút trăng ra ngoài.
- Bấm nút trăng: `document.documentElement.dataset.theme` thành `"night"` (kiểm bằng console), trăng tô đặc; bấm lại về theme ban ngày. Cài đặt → Giao diện vẫn hiển thị đúng lựa chọn cũ.
- Bấm avatar → `/cai-dat`; bấm nút điện thoại → `/khan-cap`.
  Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 6: Commit**

```bash
git add components/home/HomeScreen.tsx app/page.tsx docs/device-checklist.md
git commit -m "feat(home): new header on top of Trang chủ; checklist step 24"
```

---

## Kết thúc M3 (Đợt 2)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 504 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: plan Đợt 2 / M4 (Cài đặt kiểu iOS và 3 trang con, spec §6.8).
