# Kim Bun UI — Đợt 5 / M7 (Dọn dẹp cuối) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Khép lại Đợt 5 và cả đợt làm lại giao diện:

- **Dòng đồng bộ** nằm ngay dưới header của từng trang (spec §7.1 bước 3).
- **Trang chủ** có `Skeleton` lúc đang tải và `ErrorCard` lúc lỗi tải (spec §10).
- **Mấy chỗ hiển thị còn lỗi:**
  - Nhãn `Segmented` bị xuống dòng.
  - Nút "Phân loại triệu chứng" bị xuống dòng.
  - Ô chọn ảnh hiện chữ tiếng Anh "Choose File".
  - Thanh dung lượng ảnh gần như không thấy ở Ban đêm.
- **Token màu cũ** không còn dùng thì xóa (spec §4.1, §12 đợt 5).
- **Checklist trên máy:** thêm bước 29 (spec §11.2 bước 7, 8).

**Architecture:**

- **Dòng đồng bộ:**
  - `components/sync/SyncSlot.tsx` mới, gồm context `SyncBarProvider` (giữ `userId`) và `SyncBarSlot`. `SyncBarSlot` vẽ `SyncBar` khi có provider, không có provider thì không vẽ gì.
  - `AuthGate` bọc trang bằng provider thay vì vẽ `SyncBar` phía trên trang.
  - `PageHeader` và `HomeScreen` (ngay dưới `HomeHeader`) đặt slot. Các trang không có bé (Đăng nhập, Offline, Cài app, Khai báo bé) không có provider, nên không thấy gì, giống hôm nay.
- **Trang chủ:**
  - `components/home/HomeSkeleton.tsx` mới: thẻ chính 300, 3 ô số, 4 hàng list. `GateLoading` của `AuthGate` dùng lại nó.
  - `HomeScreen` hiện `HomeSkeleton` khi `logs` đang tải thật (`fetchStatus === "fetching"`). Khi mất mạng lúc mở app (`paused`), trang vẫn hiện đủ nút để ghi offline vào outbox như hôm nay.
  - Lỗi tải mà chưa có dữ liệu: `ErrorCard` thế chỗ thẻ chính, các nút ghi vẫn còn.
- **Xóa token:**
  - Các alias `surface`, `accent-soft`, `accent-ink`, `alarm`; token `soft`, `accent-line`.
  - Xóa ở `app/globals.css`, `lib/ui/tokens.ts`, test.
  - Thay 4 chỗ còn dùng bằng token mới cùng giá trị.
  - Thêm test chặn dùng lại các class cũ.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 5:**

| Mốc               | Nội dung                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1–M6             | Mọi màn trong spec §9, Đăng nhập, Chưa được mời, Khai báo bé, cổng `AuthGate`, ruột Cài đặt, Offline, Cài app. Đã xong trên nhánh `feat/kim-bun-dot5-m6` |
| **M7 (plan này)** | Dòng đồng bộ dưới header, Trang chủ đang tải / lỗi, sửa hiển thị, xóa token cũ, checklist bước 29                                                        |

**Quyết định cho chỗ spec chưa nói rõ:**

- **`Segmented`:**
  - Mỗi nút chỉ một dòng (`truncate`).
  - Có 3–4 lựa chọn thì chữ 13 px, như control gạt của iOS. Có 2 lựa chọn thì giữ 15 px.
  - Đệm ngang giảm từ `px-2` xuống `px-1.5`.
  - Ba nhãn bị xuống dòng: "Hậu môn" (Nhiệt độ, 4 lựa chọn), "Đổi ngày hẹn" (mũi tiêm, 3 lựa chọn), "30 phút" (Ồn trắng, 4 lựa chọn). Ở 375 px, chữ 13 px vừa một dòng cả ba.
- **Bệnh thường gặp:** hai nút "Phân loại triệu chứng" và "Gọi 115" xếp dọc, mỗi nút rộng hết hàng, thay vì chia đôi một hàng.
- **Ô chọn ảnh:**
  - Thẻ `<input type="file">` ẩn bằng `sr-only`, bọc trong một `<label>` trông như `Button` `secondary` (icon `image`). Nhãn là "Chọn ảnh", đã chọn rồi thì là "Chọn ảnh khác".
  - Tên file đã chọn hiện ở dòng nhỏ bên dưới.
  - Khi ô ẩn được focus bằng bàn phím, nhãn có viền focus (`has-[:focus-visible]:`).
  - Nhãn nhỏ "Chọn ảnh" phía trên bị bỏ, vì nút đã mang chữ đó.
- **Thanh dung lượng ảnh** ở mức bình thường dùng `bg-accent-text` thay `bg-accent`. Ở Ban đêm `--color-accent` là nâu đậm `#6B2A12`, trên rãnh `bg-line` chỉ đạt 1.69:1. `--color-accent-text` là cam sáng `#F4A070`. Ở Sáng hai màu bằng nhau; ở Tối `accent-text` sáng hơn một chút.
- **`DevicePushControl`** (nằm trong Cài đặt › Thông báo và Cài app) còn kiểu cũ: viền `rounded-xl border`, link gạch chân `text-accent-ink`.
  - Đổi sang `Button` `md` rộng hết (Bật: `primary`; Tắt: `secondary`) và link chữ `text-accent-text` đậm.
  - Chữ giữ nguyên.
- **Trang `/auth/callback`** (lỗi đăng nhập) còn kiểu cũ. Đổi thành thẻ kính giữa màn có câu báo và nút "Thử lại" dạng `Button`; chữ giữ nguyên.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`. Không tải font web.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- **Màu:**
  - Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`.
  - `lib/themeGuard.test.ts` giữ nguyên và phải xanh: không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test.
  - `lib/ui/tokens.test.ts` và `lib/ui/contrast.test.ts` phải xanh sau khi xóa token.
- Không dùng `ListRow iconColor="accent"`: ở Ban đêm chỉ đạt 1.88:1.
- **Không đổi gì ngoài giao diện:**
  - Dữ liệu, luật, quyền giữ nguyên.
  - Hành vi outbox giữ nguyên: ghi khi offline vẫn được, "N mục chờ đồng bộ" và "Không lưu được: …" giữ chữ.
  - Thứ tự và nội dung các khối Trang chủ khi đã có dữ liệu giữ nguyên.
- **Chữ người dùng thấy giữ nguyên**, trừ chỗ plan ghi rõ:
  - Nút chọn ảnh đổi chữ ("Chọn ảnh" / "Chọn ảnh khác"), bỏ nhãn nhỏ "Chọn ảnh".
  - Lỗi tải Trang chủ nằm trong `ErrorCard` có nút "Thử lại".
  - Dưới nút chọn ảnh có thêm dòng nhỏ ghi tên file đã chọn.
  - Link "Cách cài Kim Bun lên màn hình chính" trong `DevicePushControl` bỏ gạch chân, chữ đậm.
- Các đoạn "thay X bằng Y" trong plan có thể bị formatter của plan làm lệch thụt lề: so khớp theo nội dung từng dòng, **bỏ qua thụt lề**.
- Vùng chạm tối thiểu 44×44 pt. Không thêm `env(safe-area-inset-*)` trong màn hình (`body` đã lo).
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình.** Khi kiểm tay:
  - Không bấm "Lưu", "Xóa", "Tải ảnh lên", "Bật / Tắt thông báo trên máy này".
  - Không bắt đầu timer, không chọn file ảnh.
  - Được mở sheet rồi đóng bằng nút đóng.
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot5-m6`):

- `components/ui/`: `PageHeader`, `PageHeaderView`, `Button`, `buttonClass`, `Glass`, `Segmented`, `Skeleton`, `ErrorCard`, `Icon`.
- `components/sync/SyncBar.tsx`: `SyncBar({ userId })`, `SyncBarView({ count, dropped })`.
- `components/AuthGate.tsx`: `AuthGate`, `GateLoading`, `GateError` (Đợt 5 / M5).
- `components/home/HomeScreen.tsx`, `HomeHeader`, `HeroCardView`, `RecentCard`, `StatsSection`, `TimerButtons`, `QuickLogGrid`, `VitaminDButton`, `TimerRow`, `AlertBanners`.
- `components/actions/QuickActions.tsx`: `useQuickActions(): QuickActionsValue` (`running`, `busy`, `error`, `pressTimer`, `stopTimer`, `openInstant`).
- `lib/data/logs.ts`: `useRecentLogs`, `useFirstLogAt`. `lib/data/errors.ts`: `toVietnameseError`.
- `lib/ui/tokens.ts`: `THEME_NAMES`, `THEMES`, `TOKEN_NAMES`, `ALIASES` (bị xóa trong plan này).

**Produces** (không plan nào sau dùng; ghi lại cho đủ):

- `components/sync/SyncSlot.tsx`: `SyncBarProvider({ userId: string; children: ReactNode })`, `SyncBarSlot()`.
- `components/home/HomeSkeleton.tsx`: `HomeSkeleton()`.
- `lib/ui/tokens.ts`: không còn `ALIASES`; `TOKEN_NAMES` không còn `"soft"`, `"accent-line"`.

---

### Task 1: Dòng đồng bộ ngay dưới header

**Files:**

- Create: `components/sync/SyncSlot.tsx`, `components/sync/syncslot.test.tsx`
- Modify: `components/sync/SyncBar.tsx` (1 dòng), `components/ui/PageHeader.tsx` (hàm `PageHeader`), `components/AuthGate.tsx` (import và nhánh có bé), `components/home/HomeScreen.tsx` (import và 1 dòng)

**Interfaces:**

- Consumes: `SyncBar`, `SyncBarView`, `PageHeader`, `PageHeaderView`.
- Produces: `SyncBarProvider({ userId, children })`, `SyncBarSlot()`.

- [ ] **Step 1: Viết test hỏng**

`components/sync/syncslot.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "@/components/ui/PageHeader";
import { SyncBarProvider, SyncBarSlot } from "./SyncSlot";

// The real SyncBar reads the outbox from IndexedDB; a stub shows where it lands.
vi.mock("@/components/sync/SyncBar", () => ({
  SyncBar: ({ userId }: { userId: string }) => <p>sync:{userId}</p>,
}));

describe("SyncBarSlot", () => {
  it("PageHeader draws the sync line right after the header inside the provider", () => {
    const html = renderToStaticMarkup(
      <SyncBarProvider userId="u1">
        <PageHeader title="Nhật ký" />
        <p>body</p>
      </SyncBarProvider>,
    );
    const header = html.indexOf("</header>");
    const sync = html.indexOf("<p>sync:u1</p>");
    expect(header).toBeGreaterThan(-1);
    expect(sync).toBeGreaterThan(header);
    expect(sync).toBeLessThan(html.indexOf("<p>body</p>"));
  });

  it("draws nothing outside the provider (sign-in, offline, install pages)", () => {
    expect(renderToStaticMarkup(<SyncBarSlot />)).toBe("");
    expect(
      renderToStaticMarkup(<PageHeader title="Cài Kim Bun" />),
    ).not.toContain("sync:");
  });

  it("the sync line has no page padding of its own any more", async () => {
    const { SyncBarView } =
      await vi.importActual<typeof import("./SyncBar")>("./SyncBar");
    const html = renderToStaticMarkup(<SyncBarView count={2} dropped={null} />);
    expect(html).toContain(">2 mục chờ đồng bộ</span>");
    expect(html).not.toContain("max-w-md");
    expect(html).not.toContain("pt-4");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/sync/syncslot.test.tsx`
Expected: FAIL. Chưa có module `./SyncSlot`.

- [ ] **Step 3: Viết `components/sync/SyncSlot.tsx`**

```tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SyncBar } from "./SyncBar";

// Spec §7.1 step 3: AuthGate owns the outbox user; each page header shows the line under itself.
const SyncUser = createContext<string | null>(null);

export function SyncBarProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return <SyncUser.Provider value={userId}>{children}</SyncUser.Provider>;
}

export function SyncBarSlot() {
  const userId = useContext(SyncUser);
  return userId ? <SyncBar userId={userId} /> : null;
}
```

- [ ] **Step 4: Bỏ phần đệm trang của `SyncBarView`**

Trong `components/sync/SyncBar.tsx`, thay dòng

```tsx
    <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pt-4 print:hidden">
```

bằng

```tsx
    <div className="flex flex-col gap-2 print:hidden">
```

- [ ] **Step 5: Đặt slot trong `PageHeader`**

Trong `components/ui/PageHeader.tsx`:

1. Thêm import ngay dưới `import { cx } from "@/lib/ui/cx";`:

```tsx
import { SyncBarSlot } from "@/components/sync/SyncSlot";
```

2. Thay hàm

```tsx
export function PageHeader(props: HeaderProps) {
  const compact = useScrolledPast(COMPACT_AFTER_PX);
  return <PageHeaderView {...props} compact={compact} />;
}
```

bằng

```tsx
export function PageHeader(props: HeaderProps) {
  const compact = useScrolledPast(COMPACT_AFTER_PX);
  return (
    <>
      <PageHeaderView {...props} compact={compact} />
      <SyncBarSlot />
    </>
  );
}
```

- [ ] **Step 6: `AuthGate` cấp provider thay vì vẽ `SyncBar`**

Trong `components/AuthGate.tsx`:

1. Thay dòng `import { SyncBar } from "@/components/sync/SyncBar";` bằng:

```tsx
import { SyncBarProvider } from "@/components/sync/SyncSlot";
```

2. Thay khối cuối hàm `AuthGate`

```tsx
return (
  <QuickActionsProvider baby={baby} member={member} userId={session.user.id}>
    <SyncBar userId={session.user.id} />
    <div className="pb-[120px]">{content}</div>
    <ActionChrome babyName={baby.name} />
  </QuickActionsProvider>
);
```

bằng

```tsx
return (
  <QuickActionsProvider baby={baby} member={member} userId={session.user.id}>
    <SyncBarProvider userId={session.user.id}>
      <div className="pb-[120px]">{content}</div>
    </SyncBarProvider>
    <ActionChrome babyName={baby.name} />
  </QuickActionsProvider>
);
```

- [ ] **Step 7: Đặt slot dưới header Trang chủ**

Trong `components/home/HomeScreen.tsx`:

1. Thêm import ngay dưới `import { useQuickActions } from "@/components/actions/QuickActions";`:

```tsx
import { SyncBarSlot } from "@/components/sync/SyncSlot";
```

2. Ngay sau dòng `<HomeHeader name={baby.name} age={formatAgeVi(baby.dob, now)} />` thêm dòng:

```tsx
<SyncBarSlot />
```

- [ ] **Step 8: Chạy test để thấy xanh**

Run: `bun run test components/sync components/ui components/home components/auth lib/themeGuard.test.ts && bun run typecheck`
Expected:

- PASS: syncslot 3, cùng các test có sẵn của `components/ui`, `components/home` (gồm `SyncBarView` trong `alerts.test.tsx`), `components/auth` và themeGuard 1.
- Typecheck không lỗi.
- Kiểm thêm bằng `grep -rn "SyncBar" components/AuthGate.tsx`: chỉ còn `SyncBarProvider`.

- [ ] **Step 9: Commit**

```bash
git add components/sync components/ui/PageHeader.tsx components/AuthGate.tsx components/home/HomeScreen.tsx
git commit -m "feat(sync): sync line sits under each page header"
```

---

### Task 2: Trang chủ lúc đang tải và lúc lỗi

**Files:**

- Create: `components/home/HomeSkeleton.tsx`, `components/home/homescreen.test.tsx`
- Modify: `components/home/HomeScreen.tsx` (viết lại toàn file), `components/AuthGate.tsx` (hàm `GateLoading` và import)

**Interfaces:**

- Consumes: `Skeleton`, `ErrorCard`, `SyncBarSlot` (Task 1); các component Trang chủ; `useRecentLogs` (kết quả `useQuery`: `data`, `isPending`, `isError`, `error`, `fetchStatus`, `refetch`).
- Produces: `HomeSkeleton()`; `HomeScreen({ baby, userId })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/home/homescreen.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SyncBarProvider } from "@/components/sync/SyncSlot";
import type { Baby } from "@/lib/supabase/rows";
import { HomeScreen } from "./HomeScreen";

const state = vi.hoisted(() => ({ logs: {} as Record<string, unknown> }));

vi.mock("@/lib/data/logs", () => ({
  useRecentLogs: () => state.logs,
  useFirstLogAt: () => ({ data: null }),
}));
vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime: () => {} }));
vi.mock("@/lib/data/family", () => ({ useMembers: () => ({ data: [] }) }));
vi.mock("@/lib/data/emergency", () => ({ useEmergencyContacts: () => {} }));
vi.mock("@/lib/hooks/useOutboxEntries", () => ({ useOutboxEntries: () => [] }));
vi.mock("@/components/actions/QuickActions", () => ({
  useQuickActions: () => ({
    running: [],
    busy: false,
    error: null,
    pressTimer: () => {},
    stopTimer: () => {},
    openInstant: () => {},
  }),
}));
vi.mock("@/components/sync/SyncBar", () => ({
  SyncBar: ({ userId }: { userId: string }) => <p>sync:{userId}</p>,
}));

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
  feed_interval_min: 180,
} as Baby;

function render(logs: Record<string, unknown>) {
  state.logs = { refetch: () => {}, error: null, ...logs };
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <SyncBarProvider userId="u1">
        <HomeScreen baby={baby} userId="u1" />
      </SyncBarProvider>
    </QueryClientProvider>,
  );
}

describe("HomeScreen", () => {
  it("while logs load: header, sync line, then the home shapes and nothing else", () => {
    const html = render({
      data: undefined,
      isPending: true,
      isError: false,
      fetchStatus: "fetching",
    });
    expect(html.indexOf("<p>sync:u1</p>")).toBeGreaterThan(
      html.indexOf("</header>"),
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("h-[300px]");
    expect(html.match(/kb-pulse/g)).toHaveLength(8);
    expect(html).not.toContain("Thay tã");
  });

  it("a load error replaces the hero with a retry card; logging buttons stay", () => {
    const html = render({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("boom"),
      fetchStatus: "idle",
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain(">Thử lại</button>");
    expect(html).toContain("Thay tã");
    expect(html).not.toContain("Gần đây");
    expect(html).not.toContain('aria-busy="true"');
  });

  it("offline at start (paused fetch) keeps the full page so logs can go to the outbox", () => {
    const html = render({
      data: undefined,
      isPending: true,
      isError: false,
      fetchStatus: "paused",
    });
    expect(html).not.toContain('aria-busy="true"');
    expect(html).toContain("Thay tã");
    expect(html).toContain("Gần đây");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/homescreen.test.tsx`
Expected: FAIL.

- Test "while logs load": bản cũ vẽ đủ trang (có "Thay tã"), không có `aria-busy`.
- Test lỗi: bản cũ chỉ in câu lỗi trơn, không có nút "Thử lại".
- Test "paused" đã xanh trên bản cũ, như vậy là đúng.

- [ ] **Step 3: Viết `components/home/HomeSkeleton.tsx`**

```tsx
import { Skeleton } from "@/components/ui/Skeleton";

// Spec §10: loading draws the home page's shapes — hero 300, 3 number tiles, 4 list rows.
export function HomeSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-[18px]">
      <Skeleton className="h-[300px] rounded-[32px]" />
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[92px] rounded-[24px]" />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[60px]" />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: `GateLoading` dùng lại `HomeSkeleton`**

Trong `components/AuthGate.tsx`:

1. Thêm import ngay dưới `import { QuickActionsProvider } from "@/components/actions/QuickActions";`:

```tsx
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
```

2. Thay toàn bộ hàm `GateLoading` (kể cả dòng chú thích `// Spec §10: the gate waits with …` ngay trên nó) bằng:

```tsx
// Spec §10: the gate waits with the home page's shapes under a header-sized bar.
export function GateLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex max-w-md flex-col gap-[18px] p-4"
    >
      <Skeleton className="h-11 w-48 rounded-full" />
      <HomeSkeleton />
    </main>
  );
}
```

`Skeleton` vẫn được `GateLoading` dùng, giữ import của nó.

- [ ] **Step 5: Viết lại `components/home/HomeScreen.tsx`**

```tsx
"use client";

import { useQuickActions } from "@/components/actions/QuickActions";
import { SyncBarSlot } from "@/components/sync/SyncSlot";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import { useFirstLogAt, useRecentLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useNow } from "@/lib/hooks/useNow";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
import { heroState } from "@/lib/rules/hero";
import type { QuickValues } from "@/lib/rules/quickEntry";
import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
import { sleepStatusLine } from "@/lib/rules/status";
import { homeStatTiles, totalsLine } from "@/lib/rules/summaryText";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import { AlertBanners } from "./AlertBanners";
import { HeroCardView } from "./HeroCard";
import { HomeHeader } from "./HomeHeader";
import { HomeSkeleton } from "./HomeSkeleton";
import { QuickLogGrid } from "./QuickLogGrid";
import { RecentCard } from "./RecentCard";
import { StatsSection } from "./StatsSection";
import { TimerButtons } from "./TimerButtons";
import { TimerRow } from "./TimerRow";
import { VitaminDButton } from "./VitaminDButton";

const VITAMIN_D: QuickValues = {
  name: "Vitamin D",
  amount: "1",
  unit: "giọt",
  antipyretic: false,
};

export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
  const now = useNow(1000);
  useLogsRealtime(baby.id);
  const logs = useRecentLogs(baby.id);
  const firstLogAt = useFirstLogAt(baby.id);
  const members = useMembers(baby.family_id);
  // Loaded here too so /khan-cap has the family's numbers even when first opened offline.
  useEmergencyContacts(baby.family_id);
  const actions = useQuickActions();
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
  // Offline at start the fetch is "paused", not "fetching": keep the page so logs go to the outbox.
  const loading = logs.isPending && logs.fetchStatus === "fetching";
  const failed = logs.isError && !logs.data;

  const rows = logs.data ?? [];
  const age = ageDays(baby.dob, now);
  const ratings = rateLast24h({
    logs: rows,
    ageDays: age,
    firstLogAt: firstLogAt.data ?? null,
    now,
  });
  const alerts = homeAlerts({
    logs: rows,
    ageDays: age,
    wetDiapers: ratings.wetDiapers,
    triageAvailable: true,
    now,
  });
  const hero = heroState({
    logs: rows,
    feedIntervalMin: baby.feed_interval_min,
    now,
  });
  const heroLog = hero.kind === "running" ? hero.log : null;
  const vitaminD = vitaminDToday(rows, now);
  const sub =
    [sleepStatusLine(rows, now), vitaminD && `Vitamin D đã uống ${vitaminD}`]
      .filter(Boolean)
      .join(" · ") || null;
  const otherTimers = rows.filter(
    (row) => row.ended_at === null && row.id !== heroLog?.id,
  );
  const recentRows = rows.filter(
    (row) =>
      row.ended_at !== null &&
      Date.parse(row.started_at) >= now.getTime() - WINDOW_MS,
  );
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] p-4">
      <HomeHeader name={baby.name} age={formatAgeVi(baby.dob, now)} />
      <SyncBarSlot />

      {loading ? (
        <HomeSkeleton />
      ) : (
        <>
          <AlertBanners alerts={alerts} />

          {failed ? (
            <ErrorCard
              message={toVietnameseError(logs.error)}
              onRetry={() => void logs.refetch()}
            />
          ) : (
            <HeroCardView
              state={hero}
              now={now}
              who={heroLog ? nameOf(heroLog.created_by) : ""}
              sub={sub}
              pending={heroLog ? pending.has(heroLog.id) : false}
              busy={actions.busy}
              onTimer={actions.pressTimer}
              onStop={actions.stopTimer}
            />
          )}

          {otherTimers.map((log) => (
            <TimerRow
              key={log.id}
              log={log}
              who={nameOf(log.created_by)}
              now={now}
              busy={actions.busy}
              pending={pending.has(log.id)}
              onStop={() => actions.stopTimer(log)}
            />
          ))}

          <TimerButtons
            running={actions.running}
            busy={actions.busy}
            onTimer={actions.pressTimer}
          />

          <QuickLogGrid onInstant={(type) => actions.openInstant(type)} />

          {actions.error && (
            <p role="alert" className="px-1 text-danger">
              {toVietnameseError(actions.error)}
            </p>
          )}

          {vitaminD === null && (
            <VitaminDButton
              onRecord={() => actions.openInstant("medicine", VITAMIN_D)}
            />
          )}

          {logs.data && (
            <StatsSection
              tiles={homeStatTiles({ ratings, logs: rows, now })}
              totals={totalsLine(windowTotals(rows, now))}
            />
          )}

          {!failed && (
            <RecentCard
              logs={recentRows}
              now={now}
              nameOf={nameOf}
              pending={pending}
            />
          )}
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components/home components/auth lib/themeGuard.test.ts && bun run typecheck`
Expected:

- PASS: homescreen 3, cùng các test có sẵn của `components/home` và `components/auth`. Test `gate.test.tsx` của M5 vẫn xanh: có `aria-busy`, `h-[300px]`, ít nhất 9 `kb-pulse` (1 thanh header + 8 khối của `HomeSkeleton`). Cùng themeGuard 1.
- Typecheck không lỗi.

- [ ] **Step 7: Commit**

```bash
git add components/home/HomeSkeleton.tsx components/home/HomeScreen.tsx components/home/homescreen.test.tsx components/AuthGate.tsx
git commit -m "feat(home): skeleton while logs load and a retry card when they fail"
```

---

### Task 3: Nhãn một dòng, nút Bệnh thường gặp, nút chọn ảnh, thanh dung lượng

**Files:**

- Create: `components/ui/segmented.test.tsx`, `components/conditions/buttons.test.tsx`
- Modify: `components/ui/Segmented.tsx` (class của nút), `components/conditions/ConditionsScreen.tsx` (import và khối 2 nút), `components/photos/PhotosScreen.tsx` (`BAR` và ô chọn file), `components/photos/photos.test.tsx` (1 assertion)

**Interfaces:**

- Consumes: `Segmented`, `buttonClass`, `Icon`, `cx`.
- Produces: `Segmented` cùng chữ ký; giao diện mới.

- [ ] **Step 1: Viết test hỏng**

`components/ui/segmented.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Segmented } from "./Segmented";

const noop = () => {};

describe("Segmented label size", () => {
  it("3–4 options: 13 px on one line", () => {
    const html = renderToStaticMarkup(
      <Segmented
        label="Đo ở"
        options={[
          { value: "nach", label: "Nách" },
          { value: "tran", label: "Trán" },
          { value: "tai", label: "Tai" },
          { value: "hau_mon", label: "Hậu môn" },
        ]}
        value="nach"
        onChange={noop}
      />,
    );
    expect(html.match(/text-\[13px\]/g)).toHaveLength(4);
    expect(html.match(/truncate/g)).toHaveLength(4);
    expect(html).not.toContain("text-[15px]");
  });

  it("2 options keep 15 px", () => {
    const html = renderToStaticMarkup(
      <Segmented
        label="Sữa"
        options={[
          { value: "a", label: "Sữa mẹ" },
          { value: "b", label: "Sữa công thức" },
        ]}
        value="a"
        onChange={noop}
      />,
    );
    expect(html.match(/text-\[15px\]/g)).toHaveLength(2);
    expect(html).toContain("truncate");
  });
});
```

`components/conditions/buttons.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConditionsScreen } from "./ConditionsScreen";

describe("ConditionsScreen buttons", () => {
  it("triage and 115 stack as two full-width buttons", () => {
    const html = renderToStaticMarkup(<ConditionsScreen />);
    expect(html).toMatch(
      /<div class="flex flex-col gap-2\.5"><a [^>]*href="\/trieu-chung"/,
    );
    expect(html).toMatch(
      /class="[^"]*w-full[^"]*" href="\/trieu-chung"|href="\/trieu-chung" class="[^"]*w-full/,
    );
    expect(html).toMatch(/href="tel:115" class="[^"]*w-full/);
    expect(html).not.toContain("flex-1");
  });
});
```

Trong `components/photos/photos.test.tsx`, thay dòng

```tsx
expect(html).toContain(">Chọn ảnh</span>");
```

bằng

```tsx
expect(html).toMatch(
  /<label class="[^"]*rounded-full[^"]*">.*Chọn ảnh<input type="file" accept="image\/\*" class="sr-only"/,
);
expect(html).not.toContain(">Chọn ảnh</span>");
expect(html).toContain("bg-accent-text");
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/ui/segmented.test.tsx components/conditions/buttons.test.tsx components/photos/photos.test.tsx`
Expected: FAIL.

- `segmented`: bản cũ dùng `text-[15px]` cho mọi nút, không có `truncate`.
- `buttons`: bản cũ để hai nút cùng một hàng với `flex-1`.
- `photos`: bản cũ có nhãn `<span>` "Chọn ảnh" và ô file hiện rõ.

- [ ] **Step 3: Sửa class nút trong `components/ui/Segmented.tsx`**

Thay đoạn

```tsx
            className={cx(
              "min-h-11 rounded-[18px] px-2 text-[15px] text-ink transition-colors",
              on
```

bằng

```tsx
            className={cx(
              // One line like iOS's segmented control; 13 px once there are 3–4 options.
              "min-h-11 truncate rounded-[18px] px-1.5 text-ink transition-colors",
              options.length >= 3 ? "text-[13px]" : "text-[15px]",
              on
```

- [ ] **Step 4: Xếp dọc 2 nút ở `components/conditions/ConditionsScreen.tsx`**

1. Xóa dòng `import { cx } from "@/lib/ui/cx";` (sau bước 2 không còn chỗ nào dùng `cx`).
2. Thay khối

```tsx
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
```

bằng

```tsx
      <div className="flex flex-col gap-2.5">
        <Link
          href="/trieu-chung"
          className={buttonClass({
            variant: "secondary",
            size: "md",
            block: true,
          })}
        >
          Phân loại triệu chứng
        </Link>
        <a
          href="tel:115"
          className={buttonClass({ variant: "danger", size: "md", block: true })}
        >
```

Phần còn lại của khối (icon `phone`, chữ "Gọi 115", `</a>`, `</div>`) giữ nguyên.

- [ ] **Step 5: Sửa `components/photos/PhotosScreen.tsx`**

1. Trong hằng `BAR`, đổi `ok: "bg-accent",` thành:

```tsx
  // accent is dark brown at night (1.69:1 on the track); accent-text stays visible in every theme.
  ok: "bg-accent-text",
```

2. Trong `UploadForm`, thay khối

```tsx
<label className="flex flex-col gap-1.5">
  <span className={FIELD_LABEL}>Chọn ảnh</span>
  <input
    key={inputKey}
    type="file"
    accept="image/*"
    className="min-h-11 text-[15px] text-ink"
    onChange={(e) => void pick(e.target.files?.[0] ?? null)}
  />
</label>
```

bằng

```tsx
<>
  {/* The native file input shows English ("Choose File"), so it hides behind a Vietnamese button. */}
  <label
    className={cx(
      buttonClass({ variant: "secondary", block: true }),
      "cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-text",
    )}
  >
    <Icon name="image" size={20} />
    {file ? "Chọn ảnh khác" : "Chọn ảnh"}
    <input
      key={inputKey}
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={(e) => void pick(e.target.files?.[0] ?? null)}
    />
  </label>
  {file && (
    <p className="truncate px-1 text-[13px] text-muted">{file.name}</p>
  )}
</>
```

Chỉ dán phần **bên trong** `<>` … `</>` (cặp này chỉ để khối code trong plan là JSX hợp lệ). Thụt lề cho khớp các dòng xung quanh trong `UploadForm`. Sau khi dán, không được có dấu `;` sau `</label>`.

3. Kiểm import đầu file. `buttonClass`, `Icon`, `cx` phải được import. Thiếu cái nào thì thêm đúng dòng tương ứng, giữ thứ tự abc của các import:

```tsx
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cx } from "@/lib/ui/cx";
```

Nếu file đã import `Button` từ `@/components/ui/Button`, gộp thành `import { Button, buttonClass } from "@/components/ui/Button";`. `FIELD_LABEL` vẫn được ô "Ngày chụp" và "Ghi chú" dùng, giữ import.

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components lib/themeGuard.test.ts && bun run typecheck`
Expected:

- PASS: segmented 2, buttons 1, photos (đã sửa), cùng mọi test có sẵn trong `components/` (nhiều màn dùng `Segmented`) và themeGuard 1.
- Typecheck không lỗi.
- Nếu một test có sẵn hỏng chỉ vì nó khẳng định `text-[15px]` hoặc `px-2` trên nút `Segmented` có 3–4 lựa chọn, sửa assertion đó theo class mới và ghi lại trong báo cáo.

- [ ] **Step 7: Commit**

```bash
git add components/ui/Segmented.tsx components/ui/segmented.test.tsx components/conditions components/photos
git commit -m "fix(ui): one-line segmented labels, stacked triage buttons, Vietnamese photo picker, visible usage bar"
```

---

### Task 4: Xóa token cũ, `DevicePushControl`, `/auth/callback`; checklist bước 29; kiểm toàn bộ

**Files:**

- Modify: `app/globals.css`, `lib/ui/tokens.ts`, `lib/ui/tokens.test.ts`, `lib/ui/contrast.test.ts`, `app/layout.tsx` (1 class), `components/milestones/MilestonesScreen.tsx` (1 dòng), `components/push/DevicePushControl.tsx` (viết lại toàn file), `app/auth/callback/page.tsx` (viết lại toàn file), `docs/device-checklist.md`

**Interfaces:**

- Consumes: `Button`, `buttonClass`, `Glass`; `AuthGate`.
- Produces: `lib/ui/tokens.ts` không còn `ALIASES`, không còn token `soft`, `accent-line`.

- [ ] **Step 1: Viết test hỏng**

Trong `lib/ui/tokens.test.ts`:

1. Đổi dòng import

```ts
import { ALIASES, THEME_NAMES, THEMES, TOKEN_NAMES } from "./tokens";
```

thành

```ts
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { THEME_NAMES, THEMES, TOKEN_NAMES } from "./tokens";
```

Dòng `import { readFileSync } from "node:fs";` ở đầu file gộp lại thành `import { readdirSync, readFileSync } from "node:fs";`, không để hai dòng import cùng module.

2. Thay test

```ts
it("the light block declares the legacy aliases", () => {
  const vars = block(OPENERS.light);
  for (const [alias, target] of Object.entries(ALIASES))
    expect(vars[alias], `--color-${alias}`).toBe(`var(--color-${target})`);
});
```

bằng

```ts
it("the legacy tokens are gone", () => {
  for (const name of LEGACY)
    expect(css, `--color-${name}`).not.toMatch(
      new RegExp(`--color-${name}\\s*:`),
    );
});
```

3. Thêm vào cuối file:

```ts
const LEGACY = [
  "surface",
  "soft",
  "accent-soft",
  "accent-ink",
  "accent-line",
  "alarm",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

describe("no legacy colour classes", () => {
  it("app and components use only current tokens", () => {
    const pattern = new RegExp(
      `\\b(?:bg|text|border|from|to|via|ring|outline|fill|stroke|decoration|divide|accent)-(?:${LEGACY.join("|")})\\b(?!-)`,
    );
    const problems = [...sourceFiles("app"), ...sourceFiles("components")]
      .filter((file) => pattern.test(readFileSync(file, "utf8")))
      .map(
        (file) => `${file}: ${readFileSync(file, "utf8").match(pattern)?.[0]}`,
      );
    expect(problems).toEqual([]);
  });
});
```

(`(?!-)` để `bg-danger-soft`, `text-good-ink`… không bị bắt: chúng có chữ trước `-soft`, nên không khớp `bg-soft`. Còn `bg-soft-…` thì không tồn tại.)

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/tokens.test.ts`
Expected: FAIL.

- "the legacy tokens are gone": `app/globals.css` còn `--color-soft:`, `--color-surface:`…
- "no legacy colour classes" liệt kê:
  - `app/layout.tsx: bg-surface`
  - `app/auth/callback/page.tsx: text-accent-ink`
  - `components/push/DevicePushControl.tsx: text-accent-ink`
  - `components/milestones/MilestonesScreen.tsx: bg-accent-soft`

- [ ] **Step 3: Thay các chỗ còn dùng token cũ**

1. `app/layout.tsx`: trong `<body className="min-h-dvh bg-surface text-ink antialiased">` đổi `bg-surface` thành `bg-bg`.
2. `components/milestones/MilestonesScreen.tsx`: đổi dòng `window: "bg-accent-soft text-accent-ink",` thành:

```tsx
  window: "bg-accent-tint text-accent-text",
```

3. Viết lại `components/push/DevicePushControl.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  deviceState,
  disablePush,
  enablePush,
  type DeviceState,
} from "@/lib/push/browser";

const MESSAGE: Partial<Record<DeviceState, string>> = {
  "needs-install":
    "Cài Kim Bun lên màn hình chính rồi mở từ biểu tượng để nhận thông báo.",
  unsupported: "Trình duyệt này không nhận được thông báo.",
  "not-configured": "Thông báo chưa được thiết lập trên máy chủ.",
  denied:
    "Bạn đã chặn thông báo. Mở Cài đặt iOS → Thông báo → Kim Bun, bật Cho phép thông báo.",
  on: "Máy này đang nhận thông báo.",
};

export function DevicePushControl() {
  const [state, setState] = useState<DeviceState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    deviceState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);

  async function run(action: () => Promise<DeviceState>) {
    setBusy(true);
    setError(null);
    try {
      setState(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không bật được thông báo.");
    } finally {
      setBusy(false);
    }
  }

  if (state === null)
    return <p className="text-[15px] text-muted">Đang kiểm tra…</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {MESSAGE[state] && (
        <p
          className={
            state === "on"
              ? "text-[15px] text-good-ink"
              : "text-[15px] text-muted"
          }
        >
          {MESSAGE[state]}
        </p>
      )}
      {state === "needs-install" && (
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center text-[15px] font-semibold text-accent-text"
        >
          Cách cài Kim Bun lên màn hình chính
        </Link>
      )}
      {state === "off" && (
        <Button size="md" block busy={busy} onClick={() => run(enablePush)}>
          Bật thông báo trên máy này
        </Button>
      )}
      {state === "on" && (
        <Button
          variant="secondary"
          size="md"
          block
          busy={busy}
          onClick={() => run(disablePush)}
        >
          Tắt thông báo trên máy này
        </Button>
      )}
      {error && (
        <p role="alert" className="text-[15px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
```

4. Viết lại `app/auth/callback/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { buttonClass } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";

export default function Page() {
  return (
    <AuthGate need="anonymous">
      {() => (
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-6">
          <Glass className="flex flex-col items-center gap-4 p-5 text-center">
            <p className="text-base text-ink">Đăng nhập không thành công.</p>
            <Link href="/dang-nhap" className={buttonClass({ block: true })}>
              Thử lại
            </Link>
          </Glass>
        </main>
      )}
    </AuthGate>
  );
}
```

- [ ] **Step 4: Xóa token cũ khỏi `app/globals.css`, `lib/ui/tokens.ts`, `lib/ui/contrast.test.ts`**

1. `app/globals.css`:
   - **Khối `@theme`:** xóa 2 dòng `--color-soft: #f3e8e4;` và `--color-accent-line: #e9b9cb;`. Xóa luôn 4 dòng alias ở cuối khối, cùng dòng trống ngay trước chúng:

```css
--color-surface: var(--color-bg);
--color-accent-soft: var(--color-accent-tint);
--color-accent-ink: var(--color-accent-text);
--color-alarm: var(--color-danger-solid);
```

- **Khối `:root[data-theme="dark"]`:** xóa `--color-soft: #221f25;` và `--color-accent-line: #5a2340;`.
- **Khối `:root[data-theme="night"]`:** xóa `--color-soft: #160f0a;` và `--color-accent-line: #4a1d0e;`.

2. `lib/ui/tokens.ts`:
   - Trong `TOKEN_NAMES`, xóa 2 phần tử `"soft",` và `"accent-line",`.
   - Xóa nguyên khối `ALIASES` cùng dòng chú thích `// Legacy token names kept …` ngay trên nó.
   - Trong cả 3 theme của `THEMES`, xóa 2 khóa `soft:` và `"accent-line":`:
     - `light`: `soft: "#F3E8E4"`, `"accent-line": "#E9B9CB"`
     - `dark`: `soft: "#221F25"`, `"accent-line": "#5A2340"`
     - `night`: `soft: "#160F0A"`, `"accent-line": "#4A1D0E"`
3. `lib/ui/contrast.test.ts`: trong mảng `PAIRS`, xóa 2 dòng `["ink", "soft"],` và `["muted", "soft"],`.
4. Kiểm không còn chỗ nào dùng:

Run: `grep -rnE --exclude=tokens.test.ts "ALIASES|--color-(surface|soft|accent-soft|accent-ink|accent-line|alarm)[:)]|\"accent-line\"|[ {]soft:" app components lib scripts`
Expected: không có dòng nào (bỏ qua `lib/ui/tokens.test.ts`, vì danh sách `LEGACY` trong đó cố ý chứa các tên cũ). `--color-danger-soft:` và `"danger-soft":` không bị bắt: mẫu chỉ khớp `soft:` đứng sau dấu cách hoặc `{` (khóa `soft:` trong `tokens.ts`), và `--color-soft` phải đi liền với `:` hoặc `)`.

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test lib components/push lib/themeGuard.test.ts && bun run typecheck`
Expected:

- PASS:
  - `tokens.test.ts`: 3 theme, cộng "the legacy tokens are gone", cộng "no legacy colour classes".
  - `contrast.test.ts`: mỗi theme còn 5 cặp `PAIRS`.
  - Mọi test `lib/` khác và themeGuard 1.
- Typecheck không lỗi.

- [ ] **Step 6: Thêm bước 29 vào `docs/device-checklist.md`**

1. Dòng cuối của file hiện là một dấu đóng khối code ` ``` ` thừa, không có dấu mở. Xóa dòng đó.
2. Thêm vào cuối file (trước đó một dòng trống):

```markdown
## Bước 29 — Các màn còn lại, dòng đồng bộ và bản in (UI đợt 5)

1. Mở lần lượt mọi màn trong Khám phá, Nhật ký, Thống kê, Cài đặt và 3 trang con, Cài app, Đăng nhập (sau khi đăng xuất), Offline (bật chế độ máy bay rồi mở một trang chưa từng mở). Kỳ vọng:
   - không còn khung viền đen hoặc trắng kiểu cũ, mọi khối là thẻ kính;
   - không có emoji làm icon;
   - nhãn nút gạt ("Hậu môn", "Đổi ngày hẹn", "30 phút", "Tự động") nằm trên một dòng;
   - ô chọn ảnh là nút "Chọn ảnh" tiếng Việt;
   - thanh dung lượng ảnh nhìn thấy rõ ở cả 3 theme.
2. Tắt mạng, ghi một lần "Thay tã" (tài khoản thật, sau đó Hoàn tác hoặc xóa). Kỳ vọng: viên "1 mục chờ đồng bộ" nằm ngay dưới header Trang chủ; mở Nhật ký thấy viên này dưới tiêu đề "Nhật ký". Bật mạng lại: viên biến mất.
3. Mở app khi mạng chậm (Cài đặt nhà phát triển → Network Link Conditioner "3G", nếu có). Kỳ vọng: Trang chủ hiện các khối xám nhấp nháy theo hình thẻ chính, 3 ô số, 4 hàng rồi mới hiện dữ liệu.
4. In `/bao-cao` (Chia sẻ → In, hoặc lưu PDF). Kỳ vọng: khổ A4, chữ đen trên nền trắng, không có vệt màu nền, không có tab bar, nút "+" hay viên đồng bộ.
5. Lặp lại mục 1 ở theme Sáng, Tối, Ban đêm: chữ đọc rõ.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 7: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected:

- Typecheck không lỗi.
- Mọi test xanh. Số test là 655 có sẵn + 3 syncslot + 3 homescreen + 2 segmented + 1 buttons + 1 "no legacy colour classes" − 6 (`contrast.test.ts` mất 2 cặp × 3 theme) = **659**. Test alias được thay bằng "the legacy tokens are gone", nên không đổi số.
- Build xong.

- [ ] **Step 8: Kiểm trên trình duyệt (không lưu, không ghi, không chọn file)**

Run: `bun run dev`. Mở ở bề rộng 375 px.

**Không bấm** "Lưu", "Xóa", "Tải ảnh lên", "Bật / Tắt thông báo trên máy này"; không bắt đầu timer; không chọn file.

Expected:

- **Trang chủ:** tải lại trang. Lúc chờ có các khối xám đúng hình, rồi hiện trang đủ như trước. Viên đồng bộ chỉ hiện khi outbox có mục, nên thường không thấy; ghi rõ là không thấy.
- **`/on-trang`:** "30 phút" nằm một dòng.
- **`/cai-dat`:** "Sáng / Tối / Tự động" một dòng. Phần Thông báo: nút "Bật/Tắt thông báo trên máy này" kiểu mới, hoặc câu báo trạng thái.
- **Nhiệt độ:** nút "+" → Nhiệt độ. "Hậu môn" một dòng. Đóng sheet bằng nút đóng.
- **Tiêm chủng:** bấm một mũi, "Đổi ngày hẹn" một dòng. Đóng sheet bằng nút đóng.
- **`/benh-thuong-gap`:** 2 nút xếp dọc, "Phân loại triệu chứng" một dòng.
- **`/anh`:** nút "Chọn ảnh" có icon, không còn "Choose File". Thanh dung lượng thấy rõ ở Ban đêm.
- **`/phat-trien`:** chip trạng thái "đang trong khoảng" vẫn đọc rõ.
- **3 theme:** coi `/anh` và `/benh-thuong-gap` ở Sáng, Tối, Ban đêm bằng cách đổi `localStorage` `be-yeu-theme` sang `light` / `dark` và tắt lịch ban đêm. Sau đó **trả lại như cũ**: `be-yeu-theme` = `system`, `be-yeu-night-schedule` = `{"enabled":true,"start":"21:00","end":"06:00"}`, không có `be-yeu-night-override`.
- Tắt dev server.

- [ ] **Step 9: Commit**

```bash
git add app/globals.css lib/ui app/layout.tsx components/milestones/MilestonesScreen.tsx components/push/DevicePushControl.tsx app/auth/callback/page.tsx docs/device-checklist.md
git commit -m "chore(theme): drop legacy tokens, restyle push control and sign-in error, checklist step 29"
```

---

## Kết thúc M7 (Đợt 5) — hết đợt làm lại giao diện

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 659 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo:
  - Người dùng kiểm checklist bước 20–29 trên iPhone thật.
  - Quyết định push và merge chuỗi nhánh `feat/kim-bun-dot1-m1` … `feat/kim-bun-dot5-m7` vào `main`.
