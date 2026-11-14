# Kim Bun UI — Đợt 2 / M1 (tab bar, PageHeader, Khám phá) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-14

**Goal:** Thay tab bar 5 tab emoji bằng tab bar kính nổi 3 tab (Hôm nay · Nhật ký · Khám phá) có icon SVG, thêm `PageHeader` tiêu đề lớn kiểu iOS, tạo trang `/kham-pha` gom Cẩm nang và Tiện ích, và chuyển `/cam-nang`, `/tien-ich` về đó.

**Architecture:**

- `lib/nav.ts` giữ cấu hình điều hướng: 3 tab, các mục của Khám phá, `activeTab`. Tab bar và màn Khám phá chỉ đọc cấu hình này.
- Component có hook được tách thành phần "View" thuần nhận props (`TabBarView`, `PageHeaderView`) để test bằng `renderToStaticMarkup`; phần bọc ngoài đọc `usePathname` / vị trí cuộn.
- Tab bar nhận `onPlus?` tùy chọn: mốc này chưa truyền nên chưa có nút "+"; Đợt 2 / M2 gắn nút "+" và bảng 9 hành động.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, Vitest 5 (`react-dom/server`), Bun. Không thêm gói nào.

**Các mốc của Đợt 2 (spec §12):**

- **M1 (plan này):** spec §6.1 (tab bar, chưa có nút "+"), §6.2, §6.4, `PageHeader` ở §5; checklist bước 4 phần tab và route.
- **M2 (plan sau):** nút "+" và `ActionSheet` (§6.3), dùng chung luồng bấm giờ và sheet nhập nhanh cho mọi trang.
- **M3 (plan sau):** header Trang chủ có nút trăng (§6.5), màn Cài đặt kiểu iOS và 3 trang con (§6.8); checklist bước 2 và 3.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI; icon dùng `components/ui/Icon.tsx`.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Mọi trang là client-rendered shell; không thêm middleware, không kiểm tra đăng nhập phía server.
- Route cũ phải còn chạy: `/cam-nang`, `/tien-ich` chuyển hướng về `/kham-pha` bằng `router.replace`, không trả 404.
- Chiều rộng thiết kế 375–440 pt; vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`.
- Tôn trọng `prefers-reduced-motion: reduce` và `prefers-reduced-transparency: reduce` (M2 của Đợt 1 đã xử lý ở CSS chung).
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".

## Contracts with Other Plans

**Consumes** (từ Đợt 1, đã có trong code trên nhánh `feat/kim-bun-dot1-m5`):

- `components/ui/Icon.tsx`: `<Icon name size? strokeWidth? filled? className? />`; `lib/ui/icons.ts`: `type IconName` (có `home`, `list`, `explore`, `plus`, `close`, `chevronLeft`, `chevronRight`, `phone`, `chart`, `ruler`, `syringe`, `star`, `thermo`, `book`, `hands`, `wave`, `music`, `image`, `doc`).
- `lib/ui/categories.ts`: `type CategoryToken`.
- `lib/ui/cx.ts`: `cx(...)`.
- `components/ui/ListGroup.tsx`: `<ListGroup title? className?>`, `<ListRow label detail? value? icon? iconColor? href? onClick? trailing? chevron? />`.
- Token/class: `glass`, `glass-strong`, `bg-accent`, `text-on-accent`, `text-accent-text`, `bg-accent-tint`, `text-ink`, `text-muted`, `bg-ink`, `text-bg`, `bg-cat-*`, `text-cat-*`, `bg-danger-soft`, `text-danger-ink`, `border-danger`, `bg-danger-solid`, `text-on-danger`.

**Produces** (Đợt 2 / M2, M3 và Đợt 3–5 dùng):

- `lib/nav.ts`: `type TabKey = "home" | "history" | "explore"`, `type Tab = { key: TabKey; href: string; label: string; icon: IconName }`, `TABS: Tab[]`, `type ExploreItem = { label: string; href: string; icon: IconName; color: CategoryToken; detail?: string }`, `EXPLORE_EMERGENCY: { label: string; href: string; detail: string }`, `EXPLORE_TRACK`, `EXPLORE_GUIDES`, `EXPLORE_SOOTHE: ExploreItem[]`, `EXPLORE_REPORT: ExploreItem`, `activeTab(pathname: string): TabKey | null`.
- `components/nav/TabBar.tsx`: `<TabBarView current: TabKey | null onPlus? plusOpen? />`, `<TabBar onPlus? plusOpen? />`. Khi có `onPlus`, nút "+" tròn 62 bên phải, `aria-label` "Ghi lại" (mở) / "Đóng" (đang mở), `aria-expanded`.
- `components/AuthGate.tsx`: nội dung trang có `pb-[120px]` để không bị tab bar che.
- `lib/hooks/useScrolledPast.ts`: `useScrolledPast(px: number): boolean`.
- `components/ui/PageHeader.tsx`: `COMPACT_AFTER_PX = 40`, `<PageHeaderView title back? action? compact />`, `<PageHeader title back?: { href: string; label: string } action?: ReactNode />`.
- `components/nav/RedirectTo.tsx`: `<RedirectTo href />`.
- Trang `/kham-pha` (`components/explore/ExploreScreen.tsx`); `/cam-nang`, `/tien-ich` chuyển về đó; service worker cache thêm `/kham-pha`.

---

### Task 1: Cấu hình điều hướng mới (`lib/nav.ts`)

**Files:**

- Modify: `lib/nav.ts` (viết lại), `lib/nav.test.ts` (viết lại)

**Interfaces:**

- Consumes: `IconName` (`lib/ui/icons.ts`), `CategoryToken` (`lib/ui/categories.ts`).
- Produces: `TabKey`, `Tab`, `TABS`, `ExploreItem`, `EXPLORE_EMERGENCY`, `EXPLORE_TRACK`, `EXPLORE_GUIDES`, `EXPLORE_SOOTHE`, `EXPLORE_REPORT`, `activeTab` (chữ ký ở Contracts). Spec §6.4 gọi chung là `EXPLORE_SECTIONS`; plan tách thành 5 hằng theo từng khối cho dễ dùng và test, đây là chủ ý. Bỏ `MenuItem`, `GUIDE_ITEMS`, `TOOL_ITEMS` (chỉ `components/nav/MenuScreen.tsx`, `app/cam-nang/page.tsx`, `app/tien-ich/page.tsx` dùng; Task 4 thay các file đó).

- [ ] **Step 1: Viết lại test (hỏng)**

`lib/nav.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  activeTab,
  EXPLORE_EMERGENCY,
  EXPLORE_GUIDES,
  EXPLORE_REPORT,
  EXPLORE_SOOTHE,
  EXPLORE_TRACK,
  TABS,
} from "./nav";

const ALL_EXPLORE = [
  ...EXPLORE_TRACK,
  ...EXPLORE_GUIDES,
  ...EXPLORE_SOOTHE,
  EXPLORE_REPORT,
];

describe("nav", () => {
  it("has the three tabs of spec §6.1 with SVG icons", () => {
    expect(TABS).toEqual([
      { key: "home", href: "/", label: "Hôm nay", icon: "home" },
      { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "list" },
      { key: "explore", href: "/kham-pha", label: "Khám phá", icon: "explore" },
    ]);
  });

  it("Khám phá lists the sections of spec §6.4 in order", () => {
    expect(EXPLORE_EMERGENCY).toEqual({
      label: "Khẩn cấp",
      href: "/khan-cap",
      detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
    });
    expect(
      EXPLORE_TRACK.map((i) => [i.label, i.href, i.icon, i.color]),
    ).toEqual([
      ["Thống kê", "/thong-ke", "chart", "cat-sleep"],
      ["Tăng trưởng", "/tang-truong", "ruler", "cat-tummy"],
      ["Tiêm chủng", "/tiem-chung", "syringe", "cat-temp"],
      ["Phát triển", "/phat-trien", "star", "cat-diaper"],
    ]);
    expect(
      EXPLORE_GUIDES.map((i) => [i.label, i.href, i.icon, i.color]),
    ).toEqual([
      ["Triệu chứng", "/trieu-chung", "thermo", "cat-med"],
      ["Bệnh thường gặp", "/benh-thuong-gap", "book", "cat-feed"],
      ["Bồng bế", "/bong-be", "hands", "cat-tummy"],
    ]);
    expect(
      EXPLORE_SOOTHE.map((i) => [i.label, i.href, i.icon, i.color]),
    ).toEqual([
      ["Ồn trắng", "/on-trang", "wave", "cat-sleep"],
      ["Nhạc", "/nhac", "music", "cat-feed"],
      ["Ảnh", "/anh", "image", "cat-diaper"],
    ]);
    expect(EXPLORE_REPORT).toEqual({
      label: "Báo cáo cho bác sĩ",
      href: "/bao-cao",
      icon: "doc",
      color: "cat-temp",
      detail: "In A4 tóm tắt 14 ngày gần nhất",
    });
  });

  it("track and guide cards carry the spec's one-line descriptions", () => {
    expect(EXPLORE_TRACK.map((i) => i.detail)).toEqual([
      "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
      "Cân nặng, chiều dài theo chuẩn WHO",
      "Mũi tiếp theo và lịch đã tiêm",
      "Các mốc theo tháng tuổi",
    ]);
    expect(EXPLORE_GUIDES.map((i) => i.detail)).toEqual([
      "Hỏi từng bước, biết khi nào đi khám",
      "10 bài theo NHS",
      "Tư thế bế, ợ hơi, cho bú",
    ]);
  });

  it("activeTab maps pages to the three tabs", () => {
    expect(activeTab("/")).toBe("home");
    expect(activeTab("/cai-dat")).toBe("home");
    expect(activeTab("/cai-dat/thanh-vien")).toBe("home");
    expect(activeTab("/nhat-ky")).toBe("history");
    expect(activeTab("/kham-pha")).toBe("explore");
    expect(activeTab("/cam-nang")).toBe("explore");
    expect(activeTab("/tien-ich")).toBe("explore");
    expect(activeTab(EXPLORE_EMERGENCY.href)).toBe("explore");
    for (const item of ALL_EXPLORE)
      expect(activeTab(item.href)).toBe("explore");
    expect(activeTab("/nhat-ky-cu")).toBeNull();
    expect(activeTab("/dang-nhap")).toBeNull();
    expect(activeTab("/cai-app")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/nav.test.ts`
Expected: FAIL — `EXPLORE_TRACK` (và các export mới) không được export; `TABS` còn 5 tab.

- [ ] **Step 3: Viết lại `lib/nav.ts`**

```ts
import type { CategoryToken } from "@/lib/ui/categories";
import type { IconName } from "@/lib/ui/icons";

export type TabKey = "home" | "history" | "explore";
export type Tab = { key: TabKey; href: string; label: string; icon: IconName };

export const TABS: Tab[] = [
  { key: "home", href: "/", label: "Hôm nay", icon: "home" },
  { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "list" },
  { key: "explore", href: "/kham-pha", label: "Khám phá", icon: "explore" },
];

export type ExploreItem = {
  label: string;
  href: string;
  icon: IconName;
  color: CategoryToken;
  detail?: string;
};

export const EXPLORE_EMERGENCY = {
  label: "Khẩn cấp",
  href: "/khan-cap",
  detail: "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng",
};

export const EXPLORE_TRACK: ExploreItem[] = [
  {
    label: "Thống kê",
    href: "/thong-ke",
    icon: "chart",
    color: "cat-sleep",
    detail: "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
  },
  {
    label: "Tăng trưởng",
    href: "/tang-truong",
    icon: "ruler",
    color: "cat-tummy",
    detail: "Cân nặng, chiều dài theo chuẩn WHO",
  },
  {
    label: "Tiêm chủng",
    href: "/tiem-chung",
    icon: "syringe",
    color: "cat-temp",
    detail: "Mũi tiếp theo và lịch đã tiêm",
  },
  {
    label: "Phát triển",
    href: "/phat-trien",
    icon: "star",
    color: "cat-diaper",
    detail: "Các mốc theo tháng tuổi",
  },
];

export const EXPLORE_GUIDES: ExploreItem[] = [
  {
    label: "Triệu chứng",
    href: "/trieu-chung",
    icon: "thermo",
    color: "cat-med",
    detail: "Hỏi từng bước, biết khi nào đi khám",
  },
  {
    label: "Bệnh thường gặp",
    href: "/benh-thuong-gap",
    icon: "book",
    color: "cat-feed",
    detail: "10 bài theo NHS",
  },
  {
    label: "Bồng bế",
    href: "/bong-be",
    icon: "hands",
    color: "cat-tummy",
    detail: "Tư thế bế, ợ hơi, cho bú",
  },
];

export const EXPLORE_SOOTHE: ExploreItem[] = [
  { label: "Ồn trắng", href: "/on-trang", icon: "wave", color: "cat-sleep" },
  { label: "Nhạc", href: "/nhac", icon: "music", color: "cat-feed" },
  { label: "Ảnh", href: "/anh", icon: "image", color: "cat-diaper" },
];

export const EXPLORE_REPORT: ExploreItem = {
  label: "Báo cáo cho bác sĩ",
  href: "/bao-cao",
  icon: "doc",
  color: "cat-temp",
  detail: "In A4 tóm tắt 14 ngày gần nhất",
};

// Pages that light up the Khám phá tab; /cam-nang and /tien-ich now redirect there.
const EXPLORE_PREFIXES = [
  "/kham-pha",
  "/cam-nang",
  "/tien-ich",
  EXPLORE_EMERGENCY.href,
  ...[
    ...EXPLORE_TRACK,
    ...EXPLORE_GUIDES,
    ...EXPLORE_SOOTHE,
    EXPLORE_REPORT,
  ].map((item) => item.href),
];

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function activeTab(pathname: string): TabKey | null {
  if (pathname === "/" || under(pathname, "/cai-dat")) return "home";
  if (under(pathname, "/nhat-ky")) return "history";
  if (EXPLORE_PREFIXES.some((prefix) => under(pathname, prefix)))
    return "explore";
  return null;
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/nav.test.ts`
Expected: PASS (4 test). `bun run typecheck` lúc này còn báo lỗi ở `components/nav/MenuScreen.tsx`, `app/cam-nang/page.tsx`, `app/tien-ich/page.tsx` (import `MenuItem`/`GUIDE_ITEMS`/`TOOL_ITEMS` không còn) — Task 2 và Task 4 sửa; đừng sửa ở task này.

- [ ] **Step 5: Commit**

```bash
git add lib/nav.ts lib/nav.test.ts
git commit -m "feat(nav): three tabs and Khám phá sections"
```

---

### Task 2: Tab bar kính nổi 3 tab

**Files:**

- Modify: `components/nav/TabBar.tsx` (viết lại), `components/AuthGate.tsx:72` (`pb-16` → `pb-[120px]`)
- Create: `components/nav/tabbar.test.tsx`

**Interfaces:**

- Consumes: `TABS`, `TabKey`, `activeTab` (Task 1); `Icon`, `cx` (Đợt 1).
- Produces: `TabBarView`, `TabBar` (chữ ký ở Contracts).

- [ ] **Step 1: Viết test hỏng**

`components/nav/tabbar.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hostElements } from "@/components/ui/testTree";
import { ICON_PATHS } from "@/lib/ui/icons";
import { TabBarView } from "./TabBar";

describe("TabBarView", () => {
  it("is a floating glass pill with three icon tabs", () => {
    const html = renderToStaticMarkup(<TabBarView current="history" />);
    expect(html).toContain('aria-label="Điều hướng chính"');
    expect(html).toContain("glass-strong");
    expect(html).toContain("h-[62px]");
    expect(html).toContain(
      "bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)]",
    );
    expect(html).toContain("print:hidden");
    expect(html.match(/<a /g)).toHaveLength(3);
    for (const name of ["home", "list", "explore"] as const)
      expect(html).toContain(`d="${ICON_PATHS[name]}"`);
    expect(html).toContain(">Hôm nay</a>");
    expect(html).toContain(">Khám phá</a>");
  });

  it("marks only the current tab", () => {
    // <Link> is a component, not an <a> host element, so read the rendered HTML instead.
    const anchors = renderToStaticMarkup(<TabBarView current="history" />)
      .split("<a ")
      .slice(1);
    expect(anchors.map((a) => a.includes('aria-current="page"'))).toEqual([
      false,
      true,
      false,
    ]);
    expect(anchors[1]).toContain("bg-accent-tint text-accent-text");
    expect(anchors[0]).not.toContain("bg-accent-tint");
  });

  it("has no + button until a handler is given", () => {
    expect(renderToStaticMarkup(<TabBarView current="home" />)).not.toContain(
      "<button",
    );
  });

  it("shows + to open and × to close, and reports presses", () => {
    const onPlus = vi.fn();
    const closed = renderToStaticMarkup(
      <TabBarView current="home" onPlus={onPlus} />,
    );
    expect(closed).toContain('aria-label="Ghi lại"');
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("size-[62px]");
    expect(closed).toContain("bg-accent text-on-accent");
    expect(closed).toContain(`d="${ICON_PATHS.plus}"`);
    const open = renderToStaticMarkup(
      <TabBarView current="home" onPlus={onPlus} plusOpen />,
    );
    expect(open).toContain('aria-label="Đóng"');
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain("bg-ink text-bg");
    expect(open).toContain(`d="${ICON_PATHS.close}"`);
    const [button] = hostElements(
      TabBarView({ current: "home", onPlus }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onPlus).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/nav/tabbar.test.tsx`
Expected: FAIL — `TabBarView` không được export (`"TabBarView" is not exported` hoặc `TabBarView is not a function`).

- [ ] **Step 3: Viết lại `components/nav/TabBar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { activeTab, TABS, type TabKey } from "@/lib/nav";
import { cx } from "@/lib/ui/cx";

export function TabBarView({
  current,
  onPlus,
  plusOpen = false,
}: {
  current: TabKey | null;
  onPlus?: () => void;
  plusOpen?: boolean;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-4 bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)] z-20 mx-auto flex max-w-md items-center gap-2.5 print:hidden"
    >
      <ul className="glass-strong grid h-[62px] flex-1 grid-cols-3 rounded-full p-1 shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=dark]:shadow-[0_10px_30px_rgb(0_0_0/0.25)] in-data-[theme=night]:shadow-none">
        {TABS.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key} className="flex">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] leading-3 font-semibold",
                  active ? "bg-accent-tint text-accent-text" : "text-ink/80",
                )}
              >
                <Icon name={tab.icon} size={22} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {onPlus && (
        <button
          type="button"
          onClick={onPlus}
          aria-label={plusOpen ? "Đóng" : "Ghi lại"}
          aria-expanded={plusOpen}
          className={cx(
            "flex size-[62px] shrink-0 items-center justify-center rounded-full shadow-[0_10px_26px_rgb(0_0_0/0.2)] transition-transform duration-[120ms] active:scale-[0.97] in-data-[theme=night]:shadow-none",
            plusOpen ? "bg-ink text-bg" : "bg-accent text-on-accent",
          )}
        >
          <Icon
            name={plusOpen ? "close" : "plus"}
            size={26}
            strokeWidth={2.4}
          />
        </button>
      )}
    </nav>
  );
}

export function TabBar({
  onPlus,
  plusOpen,
}: {
  onPlus?: () => void;
  plusOpen?: boolean;
}) {
  return (
    <TabBarView
      current={activeTab(usePathname())}
      onPlus={onPlus}
      plusOpen={plusOpen}
    />
  );
}
```

- [ ] **Step 4: Nới khoảng trống đáy trang trong `components/AuthGate.tsx`**

Thay `<div className="pb-16">{content}</div>` bằng:

```tsx
<div className="pb-[120px]">{content}</div>
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/nav/tabbar.test.tsx lib/themeGuard.test.ts`
Expected: PASS (TabBarView 4, themeGuard 1).

- [ ] **Step 6: Commit**

```bash
git add components/nav/TabBar.tsx components/nav/tabbar.test.tsx components/AuthGate.tsx
git commit -m "feat(nav): floating glass tab bar with three tabs"
```

---

### Task 3: `PageHeader` tiêu đề lớn

**Files:**

- Create: `lib/hooks/useScrolledPast.ts`, `components/ui/PageHeader.tsx`, `components/ui/pageheader.test.tsx`

**Interfaces:**

- Consumes: `Icon`, `cx` (Đợt 1).
- Produces: `useScrolledPast`, `COMPACT_AFTER_PX`, `PageHeaderView`, `PageHeader` (chữ ký ở Contracts). Thanh thu gọn: `.glass-strong` cố định trên cùng, cao `env(safe-area-inset-top) + 44px`, tiêu đề 17/600 giữa, hiện khi cuộn quá 40 px, mờ dần 160 ms.

- [ ] **Step 1: Viết test hỏng**

`components/ui/pageheader.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { COMPACT_AFTER_PX, PageHeader, PageHeaderView } from "./PageHeader";

describe("PageHeaderView", () => {
  it("shows a 34 pt large title and hides the compact bar at the top", () => {
    const html = renderToStaticMarkup(
      <PageHeaderView title="Khám phá" compact={false} />,
    );
    expect(html).toContain(
      '<h1 class="text-[34px] leading-[41px] font-bold text-ink">Khám phá</h1>',
    );
    expect(html).toContain("pointer-events-none opacity-0");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<a ");
  });

  it("shows the compact glass bar once scrolled", () => {
    const html = renderToStaticMarkup(
      <PageHeaderView title="Khám phá" compact />,
    );
    expect(html).toContain("glass-strong");
    expect(html).toContain("opacity-100");
    expect(html).toContain("h-[calc(env(safe-area-inset-top)+44px)]");
    expect(html).toContain(">Khám phá</span>");
    expect(html).toContain("duration-[160ms]");
  });

  it("a child page has a back pill and a right-side action", () => {
    const html = renderToStaticMarkup(
      <PageHeaderView
        title="Cài đặt"
        back={{ href: "/", label: "Hôm nay" }}
        action={<button type="button">Thêm</button>}
        compact={false}
      />,
    );
    expect(html).toContain('href="/"');
    expect(html).toContain(`d="${ICON_PATHS.chevronLeft}"`);
    expect(html).toContain("Hôm nay</a>");
    expect(html).toContain("min-h-11");
    expect(html).toContain('<button type="button">Thêm</button>');
  });
});

describe("PageHeader", () => {
  it("starts expanded and compacts after 40 px", () => {
    expect(COMPACT_AFTER_PX).toBe(40);
    expect(renderToStaticMarkup(<PageHeader title="Khám phá" />)).toContain(
      "opacity-0",
    );
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/ui/pageheader.test.tsx`
Expected: FAIL — `Cannot find module './PageHeader'`.

- [ ] **Step 3: Viết `lib/hooks/useScrolledPast.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

export function useScrolledPast(px: number): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const update = () => setPast(window.scrollY > px);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [px]);
  return past;
}
```

- [ ] **Step 4: Viết `components/ui/PageHeader.tsx`**

```tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useScrolledPast } from "@/lib/hooks/useScrolledPast";
import { cx } from "@/lib/ui/cx";
import { Icon } from "./Icon";

export const COMPACT_AFTER_PX = 40;

type HeaderProps = {
  title: string;
  back?: { href: string; label: string };
  action?: ReactNode;
};

export function PageHeaderView({
  title,
  back,
  action,
  compact,
}: HeaderProps & { compact: boolean }) {
  return (
    <>
      <div
        aria-hidden={!compact}
        className={cx(
          "glass-strong fixed inset-x-0 top-0 z-30 flex h-[calc(env(safe-area-inset-top)+44px)] items-end justify-center rounded-none border-x-0! border-t-0! pb-2.5 transition-opacity duration-[160ms] print:hidden",
          compact ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <span className="text-[17px] font-semibold text-ink">{title}</span>
      </div>
      <header className="flex flex-col gap-1.5 pt-2">
        {back && (
          <Link
            href={back.href}
            className="glass inline-flex min-h-11 items-center gap-0.5 self-start rounded-full pr-3.5 pl-2 text-base font-medium text-accent-text"
          >
            <Icon name="chevronLeft" size={18} strokeWidth={2.4} />
            {back.label}
          </Link>
        )}
        <div className="flex items-end justify-between gap-3 px-1">
          <h1 className="text-[34px] leading-[41px] font-bold text-ink">
            {title}
          </h1>
          {action}
        </div>
      </header>
    </>
  );
}

export function PageHeader(props: HeaderProps) {
  const compact = useScrolledPast(COMPACT_AFTER_PX);
  return <PageHeaderView {...props} compact={compact} />;
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/ui/pageheader.test.tsx lib/themeGuard.test.ts`
Expected: PASS (PageHeaderView 3, PageHeader 1, themeGuard 1). Nếu chuỗi `<h1 class="…">` lệch do bạn đổi thứ tự class, sửa code về đúng như Step 4, không sửa test.

- [ ] **Step 6: Commit**

```bash
git add lib/hooks/useScrolledPast.ts components/ui/PageHeader.tsx components/ui/pageheader.test.tsx
git commit -m "feat(ui): iOS large-title page header that compacts on scroll"
```

---

### Task 4: Trang Khám phá, chuyển hướng route cũ

**Files:**

- Create: `components/explore/ExploreScreen.tsx`, `components/explore/explore.test.tsx`, `components/nav/RedirectTo.tsx`, `app/kham-pha/page.tsx`
- Modify: `app/cam-nang/page.tsx` (viết lại), `app/tien-ich/page.tsx` (viết lại), `components/stats/StatsScreen.tsx:88-93` (link quay lại), `sw/sw.template.js:24` (thêm `/kham-pha`), `scripts/sw.test.ts` (thêm `/kham-pha` vào danh sách cache mong đợi)
- Delete: `components/nav/MenuScreen.tsx`

**Interfaces:**

- Consumes: `EXPLORE_*`, `ExploreItem` (Task 1); `PageHeader` (Task 3); `ListGroup`, `ListRow`, `Icon`, `cx`, `CategoryToken` (Đợt 1); `AuthGate` (đã có).
- Produces: `ExploreScreen`, `RedirectTo`; route `/kham-pha`.

- [ ] **Step 1: Đọc docs**

Đọc `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` (mục `router.replace`).

- [ ] **Step 2: Viết test hỏng**

`components/explore/explore.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EXPLORE_EMERGENCY,
  EXPLORE_GUIDES,
  EXPLORE_REPORT,
  EXPLORE_SOOTHE,
  EXPLORE_TRACK,
} from "@/lib/nav";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ExploreScreen } from "./ExploreScreen";

const html = renderToStaticMarkup(<ExploreScreen />);

describe("ExploreScreen", () => {
  it("has a large title and the four section headings in spec order", () => {
    expect(html).toContain(">Khám phá</h1>");
    const order = [
      "Khẩn cấp",
      "Theo dõi",
      "Cẩm nang",
      "Dỗ bé và kỷ niệm",
      "Báo cáo cho bác sĩ",
    ].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("starts with the red emergency card", () => {
    expect(html).toContain(`href="${EXPLORE_EMERGENCY.href}"`);
    expect(html).toContain(EXPLORE_EMERGENCY.detail);
    expect(html).toContain("bg-danger-solid text-on-danger");
    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
  });

  it("links every item with its icon", () => {
    for (const item of [
      ...EXPLORE_TRACK,
      ...EXPLORE_GUIDES,
      ...EXPLORE_SOOTHE,
      EXPLORE_REPORT,
    ]) {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(`d="${ICON_PATHS[item.icon]}"`);
      expect(html).toContain(`>${item.label}<`);
    }
  });

  it("track cards are a two-column grid of glass cards with tinted icons", () => {
    expect(html).toContain("grid grid-cols-2");
    expect(html).toContain("bg-cat-sleep/15 text-cat-sleep");
    expect(html).toContain("min-h-32");
  });
});
```

Trong `scripts/sw.test.ts`, test "install caches the shell, every page and the static files each page links", thêm `"/kham-pha",` vào mảng `expect.arrayContaining([...])` ngay sau `"/thong-ke",`.

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test components/explore/explore.test.tsx scripts/sw.test.ts`
Expected: FAIL — `Cannot find module './ExploreScreen'`; test service worker báo thiếu `/kham-pha` trong cache.

- [ ] **Step 4: Viết `components/explore/ExploreScreen.tsx`**

```tsx
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  EXPLORE_EMERGENCY,
  EXPLORE_GUIDES,
  EXPLORE_REPORT,
  EXPLORE_SOOTHE,
  EXPLORE_TRACK,
} from "@/lib/nav";
import type { CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

const TINT: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed/15 text-cat-feed",
  "cat-bottle": "bg-cat-bottle/15 text-cat-bottle",
  "cat-sleep": "bg-cat-sleep/15 text-cat-sleep",
  "cat-diaper": "bg-cat-diaper/15 text-cat-diaper",
  "cat-pump": "bg-cat-pump/15 text-cat-pump",
  "cat-tummy": "bg-cat-tummy/15 text-cat-tummy",
  "cat-med": "bg-cat-med/15 text-cat-med",
  "cat-temp": "bg-cat-temp/15 text-cat-temp",
};

const TEXT: Record<CategoryToken, string> = {
  "cat-feed": "text-cat-feed",
  "cat-bottle": "text-cat-bottle",
  "cat-sleep": "text-cat-sleep",
  "cat-diaper": "text-cat-diaper",
  "cat-pump": "text-cat-pump",
  "cat-tummy": "text-cat-tummy",
  "cat-med": "text-cat-med",
  "cat-temp": "text-cat-temp",
};

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mx-1 text-xl font-bold text-ink">{children}</h2>;
}

export function ExploreScreen() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2">
      <PageHeader title="Khám phá" />

      <Link
        href={EXPLORE_EMERGENCY.href}
        className="flex items-center gap-3.5 rounded-[26px] border border-danger/30 bg-danger-soft/75 p-4 text-danger-ink backdrop-blur-xl"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-danger-solid text-on-danger">
          <Icon name="phone" size={22} />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[17px] font-bold">
            {EXPLORE_EMERGENCY.label}
          </span>
          <span className="text-[13px]">{EXPLORE_EMERGENCY.detail}</span>
        </span>
        <Icon name="chevronRight" size={18} />
      </Link>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Theo dõi</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {EXPLORE_TRACK.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glass flex min-h-32 flex-col gap-1.5 rounded-[26px] p-4 text-ink"
            >
              <span
                className={cx(
                  "flex size-9 items-center justify-center rounded-full",
                  TINT[item.color],
                )}
              >
                <Icon name={item.icon} size={18} strokeWidth={2.2} />
              </span>
              <span className="text-base font-bold">{item.label}</span>
              <span className="text-[13px] leading-[18px] text-muted">
                {item.detail}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Cẩm nang</SectionTitle>
        <ListGroup>
          {EXPLORE_GUIDES.map((item) => (
            <ListRow
              key={item.href}
              label={item.label}
              detail={item.detail}
              icon={item.icon}
              iconColor={item.color}
              href={item.href}
            />
          ))}
        </ListGroup>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionTitle>Dỗ bé và kỷ niệm</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {EXPLORE_SOOTHE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 text-ink"
            >
              <span
                className={cx(
                  "glass flex size-16 items-center justify-center rounded-[22px]",
                  TEXT[item.color],
                )}
              >
                <Icon name={item.icon} size={24} />
              </span>
              <span className="text-[13px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <ListGroup>
        <ListRow
          label={EXPLORE_REPORT.label}
          detail={EXPLORE_REPORT.detail}
          icon={EXPLORE_REPORT.icon}
          iconColor={EXPLORE_REPORT.color}
          href={EXPLORE_REPORT.href}
        />
      </ListGroup>
    </main>
  );
}
```

- [ ] **Step 5: Viết `components/nav/RedirectTo.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RedirectTo({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return null;
}
```

- [ ] **Step 6: Tạo `app/kham-pha/page.tsx` và viết lại 2 trang cũ**

`app/kham-pha/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { ExploreScreen } from "@/components/explore/ExploreScreen";

export default function Page() {
  return <AuthGate need="baby">{() => <ExploreScreen />}</AuthGate>;
}
```

`app/cam-nang/page.tsx` và `app/tien-ich/page.tsx` (cùng nội dung):

```tsx
"use client";

import { RedirectTo } from "@/components/nav/RedirectTo";

// Spec §6.2: Cẩm nang and Tiện ích are now sections of Khám phá.
export default function Page() {
  return <RedirectTo href="/kham-pha" />;
}
```

Run: `git rm components/nav/MenuScreen.tsx`

- [ ] **Step 7: Sửa link quay lại ở `components/stats/StatsScreen.tsx`**

Thay khối:

```tsx
<Link href="/tien-ich" className="flex min-h-11 items-center text-accent-ink">
  ← Tiện ích
</Link>
```

bằng:

```tsx
<Link href="/kham-pha" className="flex min-h-11 items-center text-accent-ink">
  ← Khám phá
</Link>
```

(Trong file thật, thẻ `<Link>` xuống dòng từng thuộc tính, `href="/tien-ich"` nằm ở dòng 89: chỉ đổi `href` thành `"/kham-pha"` và chữ thành `← Khám phá`. Màn Thống kê được làm lại bằng `PageHeader` ở Đợt 5; ở đây chỉ sửa đích đến.)

- [ ] **Step 8: Thêm `/kham-pha` vào service worker**

Trong mảng `PAGES` của `sw/sw.template.js`, thêm dòng ngay sau `"/tien-ich",`:

```js
  "/kham-pha",
```

- [ ] **Step 9: Chạy test để thấy xanh**

Run: `bun run test components/explore/explore.test.tsx scripts/sw.test.ts lib/themeGuard.test.ts`
Expected: PASS (ExploreScreen 4, service worker giữ nguyên số test và xanh, themeGuard 1).

- [ ] **Step 10: Typecheck và build**

Run: `bun run typecheck && bun run build`
Expected: typecheck không lỗi (các import `GUIDE_ITEMS`/`TOOL_ITEMS`/`MenuScreen` đã hết); build xong, bảng route có `/kham-pha`.

Run: `grep -rn "GUIDE_ITEMS\|TOOL_ITEMS\|MenuScreen" app components lib`
Expected: không có kết quả.

- [ ] **Step 11: Kiểm trên trình duyệt**

Run: `bun run dev`, mở `http://localhost:3000` ở bề rộng 375 px, đăng nhập.
Expected:

- Tab bar kính nổi cách đáy, 3 tab Hôm nay · Nhật ký · Khám phá, icon nét (không emoji); tab đang mở có nền hồng nhạt; nội dung cuối trang không bị tab bar che.
- Bấm Khám phá: tiêu đề lớn "Khám phá", thẻ Khẩn cấp đỏ, 4 thẻ Theo dõi 2 cột, danh sách Cẩm nang, 3 ô Dỗ bé, hàng Báo cáo; cuộn xuống hơn 40 px thì thanh kính nhỏ có chữ "Khám phá" hiện ở trên cùng.
- Mở `http://localhost:3000/cam-nang` và `/tien-ich`: tự chuyển sang `/kham-pha`.
- Mở Thống kê từ Khám phá: link "← Khám phá" đưa về đúng trang.
- Đổi sang theme Tối và Ban đêm (Cài đặt → Giao diện): tab bar và icon đổi màu theo theme, không còn màu emoji.

Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm trong báo cáo.

- [ ] **Step 12: Commit**

```bash
git add -A components/explore components/nav app/kham-pha app/cam-nang/page.tsx app/tien-ich/page.tsx components/stats/StatsScreen.tsx sw/sw.template.js scripts/sw.test.ts
git commit -m "feat(nav): Khám phá page; Cẩm nang and Tiện ích redirect there"
```

---

## Kết thúc M1 (Đợt 2)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: xanh.
- [ ] Thêm vào `docs/device-checklist.md` (cuối file) và commit cùng message `docs: device checklist step 22 for the new tab bar`:

```markdown
## Bước 22 — Tab bar mới và Khám phá (UI đợt 2)

1. Mở app trên iPhone. Kỳ vọng: tab bar kính nổi 3 tab Hôm nay · Nhật ký · Khám phá, icon nét, không emoji; không che nội dung cuối trang; không đè lên thanh home của iPhone.
2. Khám phá: thẻ Khẩn cấp đỏ, Theo dõi, Cẩm nang, Dỗ bé và kỷ niệm, Báo cáo; mỗi mục mở đúng trang; cuộn xuống thì thanh tiêu đề nhỏ hiện trên cùng, không đè lên giờ/pin.
3. Mở link cũ `…/cam-nang` và `…/tien-ich`. Kỳ vọng: tự sang Khám phá.
4. Bật Ban đêm: tab bar và icon tông hổ phách, không còn màu xanh/trắng.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] Bước tiếp theo: plan Đợt 2 / M2 (nút "+" và `ActionSheet`), dùng `TabBar onPlus plusOpen` của plan này.
