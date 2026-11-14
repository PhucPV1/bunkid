# Kim Bun UI — Đợt 5 / M1 (Nhật ký, Thống kê và trạng thái trống / lỗi) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm lại màn Nhật ký và Thống kê theo spec §9 và áp các trạng thái của §10 cho hai màn này (đang tải, trống, lỗi tải). Có thêm hai khối ui dùng chung `EmptyState`, `ErrorCard`. Cho bảng 9 hành động mở được từ bất kỳ trang nào, để nút "Ghi bản đầu tiên" của Nhật ký trống dùng được.

**Architecture:**

- Hàm thuần mới:
  - `daySummary` trong `lib/rules/history.ts`: tóm tắt một ngày "N cữ · N tã · ngủ Xg Yp".
  - `hasStatsData`, `emptyStatsText` trong `lib/rules/dailyStats.ts`.
- `components/ui/EmptyState.tsx`, `components/ui/ErrorCard.tsx` là khối hiển thị không gọi dữ liệu (spec §5, §10).
- Trạng thái mở của bảng 9 hành động chuyển từ `AuthGate` vào `QuickActionsProvider` (`actionSheetOpen`, `openActionSheet`, `toggleActionSheet`, `closeActionSheet`). `components/actions/ActionChrome.tsx` vẽ tab bar có nút "+" và bảng 9 hành động.
- `HistoryScreen` và `StatsScreen` tách phần danh sách / bảng thành view không hook:
  - `HistoryList`, `StatsTable` test bằng `renderToStaticMarkup` và duyệt cây.
  - Màn bọc ngoài giữ nguyên hook dữ liệu.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, recharts (đã có), Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 5 (spec §12: mục 9, 10; xóa token cũ không còn dùng; checklist 7, 8):**

| Mốc               | Nội dung                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **M1 (plan này)** | `EmptyState`, `ErrorCard`; mở bảng 9 hành động từ mọi trang; Nhật ký; Thống kê                                                                                                                         |
| M2                | Tăng trưởng, Tiêm chủng (hàng "Nguồn lịch tiêm" mở `Sheet`), Phát triển                                                                                                                                |
| M3                | Triệu chứng, Bệnh thường gặp, Bồng bế, Khẩn cấp                                                                                                                                                        |
| M4                | Nhạc, Ồn trắng, Ảnh, Báo cáo (bản in đen trắng A4)                                                                                                                                                     |
| M5                | Đăng nhập (nút Google theo `GOOGLE_BUTTON`), Khai báo bé, Chưa được mời, Cài app, Offline, màn chờ/lỗi của `AuthGate`; bên trong 3 trang con Cài đặt                                                   |
| M6                | Trang chủ đang tải / lỗi (§10), dời dòng đồng bộ xuống dưới header trang, sửa nhãn `Segmented` bị xuống dòng ("Hậu môn", "Đổi ngày hẹn"), xóa token cũ không còn dùng, checklist bước 7 và 8 của §11.2 |

**Quyết định cho chỗ spec chưa nói rõ:**

- **Tóm tắt ngày ở Nhật ký:**
  - Số cữ đếm theo phiên bú (`groupFeedSessions`, bú mẹ và bú bình cách nhau ≤ 30 phút tính một cữ).
  - Số tã đếm mọi bản ghi tã.
  - Giờ ngủ cộng các giấc của ngày đó; giấc đang chạy tính đến hiện tại. Ghi dạng `shortDuration` ("2g 15p", "0p").
  - Phần tóm tắt luôn đủ ba mục.
- **Hàng Nhật ký:**
  - Dòng chính là `describeLog`. Dòng meta 13 là ghi chú (nếu có).
  - Dấu chờ đồng bộ nằm sau dòng chính.
  - Bên phải là giờ 15/600, người ghi 12 ở dưới.
- **Nhật ký trống:**
  - Bộ lọc "Tất cả": icon `list`, câu "Chưa có bản ghi nào.", nút "Ghi bản đầu tiên" mở bảng 9 hành động (spec §10).
  - Bộ lọc khác: câu "Không có bản ghi nào cho mục này.", không có nút.
  - "Tất cả" mà trang mới nhất trống nhưng còn trang cũ hơn: câu "Chưa có bản ghi nào trong 7 ngày qua.", không có nút; nút "Xem thêm 7 ngày trước" vẫn hiện.
  - Tóm tắt ngày luôn tính trên mọi log của ngày đó, kể cả khi đang lọc.
- **Thống kê:**
  - Cột biểu đồ màu theo loại: Ngủ `cat-sleep`, Bú `cat-feed`, Tã ướt `cat-diaper`, Tã bẩn `--color-muted`, Hút sữa `cat-pump`, Tummy `cat-tummy`.
  - Câu khi trống: "Chưa có giấc ngủ / cữ bú / tã / lần hút sữa / lần nằm sấp nào trong N ngày". Câu này thay biểu đồ; bảng số theo ngày vẫn hiện.
- **Đang tải:**
  - Nhật ký: 4 khối `Skeleton` cao 60.
  - Thống kê: một khối `Skeleton` cao 240 thay biểu đồ.
- **Lỗi tải:** `ErrorCard` với lời của `toVietnameseError` và nút "Thử lại" gọi `refetch()`.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test). Màu trong biểu đồ dùng `var(--color-…)`.
- Logic là hàm thuần trong `lib/rules/`, có unit test. Component trong `components/ui/` không gọi dữ liệu.
- Không đổi luồng dữ liệu: `useHistoryLogs`, `useStatsLogs`, `LogEditSheet`, `canModifyLog`, `dailyStats`, `chartRows`, `STATS_TABS`, `HISTORY_FILTERS` giữ nguyên.
- Nút "+" và bảng 9 hành động phải chạy như cũ trên mọi trang có bé (bấm "+" mở/đóng, chọn hành động thì đóng bảng).
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`. Mọi giờ và số đo dùng `tabular-nums`.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay **không bấm Lưu, không xóa, không chọn hành động trong bảng 9 hành động**. Mở rồi đóng sheet là được.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot4-m3`):

- `components/ui/`:
  - `PageHeader({ title, back?, action? })`, `IconButton({ label, icon, ... })`, `Button`, `Glass`, `Icon`.
  - `ChipGroup<T>({ label, options, value, onChange })`, `Segmented<T>`, `Skeleton({ className })`.
  - `components/ui/testTree.ts` (`findElements`).
- `components/actions/QuickActions.tsx`: `QuickActionsProvider`, `useQuickActions`, `type QuickActionsValue` (Đợt 3 / M3); `components/actions/ActionSheet.tsx`: `ActionSheet({ open, onClose, babyName })`; `components/nav/TabBar.tsx`: `TabBar({ onPlus?, plusOpen? })`.
- `components/history/LogEditSheet.tsx` (Đợt 4 / M2); `components/sync/PendingMark.tsx`.
- `lib/rules/history.ts`: `HISTORY_FILTERS`, `matchesFilter`, `groupByVnDay`, `canModifyLog`, `type HistoryFilter`; `lib/rules/ratings.ts`: `groupFeedSessions`; `lib/rules/summaryText.ts`: `shortDuration`; `lib/rules/dailyStats.ts`: `DayStat`, `StatsTab`, `STATS_TABS`, `dailyStats`, `chartRows`, `statsFetchSince`; `lib/rules/days.ts`: `vnDayLabel`, `vnDayRange`; `lib/rules/describeLog.ts`; `lib/rules/time.ts`: `formatVnTime`, `formatDuration`.
- `lib/ui/categories.ts`: `CATEGORIES`, `CATEGORY_CHIP`.

**Produces** (M2–M6 dùng):

- `lib/rules/history.ts`: `daySummary(logs: LogLike[], now: Date): string`.
- `lib/rules/dailyStats.ts`: `hasStatsData(stats: DayStat[], tab: StatsTab): boolean`, `emptyStatsText(tab: StatsTab, days: number): string`.
- `components/ui/EmptyState.tsx`: `EmptyState({ icon: IconName; text: string; action?: { label: string; onClick: () => void } })`.
- `components/ui/ErrorCard.tsx`: `ErrorCard({ message: string; onRetry: () => void })`.
- `QuickActionsValue` thêm `actionSheetOpen: boolean`, `openActionSheet(): void`, `toggleActionSheet(): void`, `closeActionSheet(): void`.
- `components/actions/ActionChrome.tsx`: `ActionChrome({ babyName: string })`.
- `components/history/HistoryList.tsx`: `HistoryList({ groups, now, nameOf, pending, onOpen })`, mỗi `group` là `{ day: string; summary: string; logs: LogRow[] }`.
- `components/stats/StatsTable.tsx`: `StatsTable({ stats, tab, now })`, `STATS_COLUMNS`.
- `components/stats/StatsChart.tsx`: thêm props `color: string`, `secondaryColor: string | null`.

---

### Task 1: Tóm tắt ngày và câu "chưa có dữ liệu"

**Files:**

- Modify: `lib/rules/history.ts` (thêm import và hàm cuối file), `lib/rules/history.test.ts` (thêm test), `lib/rules/dailyStats.ts` (thêm hàm cuối file), `lib/rules/dailyStats.test.ts` (thêm test)

**Interfaces:**

- Consumes: `LogLike`; `groupFeedSessions`; `shortDuration`; `chartRows`, `DayStat`, `StatsTab`.
- Produces: `daySummary`, `hasStatsData`, `emptyStatsText`.

- [ ] **Step 1: Viết test hỏng**

Trong `lib/rules/history.test.ts`, thêm `daySummary,` vào danh sách import từ `"./history"` (giữ thứ tự chữ cái: ngay sau `canModifyLog,`), rồi thêm cuối file:

```ts
describe("daySummary", () => {
  const at = (hhmm: string) => `2026-11-14T${hhmm}:00.000Z`; // UTC; VN = UTC+7
  const entry = (
    type: string,
    start: string,
    end: string | null,
    details: unknown = {},
  ) => ({
    type,
    started_at: at(start),
    ended_at: end === null ? null : at(end),
    details,
  });

  it("counts feed sessions, diapers and sleep of one day", () => {
    const logs = [
      entry("breast", "01:00", "01:20", { side: "left" }),
      entry("bottle", "01:30", "01:30", { ml: 60, milk: "formula" }),
      entry("bottle", "05:00", "05:00", { ml: 90, milk: "formula" }),
      entry("diaper", "02:00", "02:00", { wet: true, dirty: false }),
      entry("diaper", "06:00", "06:00", { wet: true, dirty: true }),
      entry("sleep", "02:00", "03:30"),
      entry("sleep", "06:00", "06:45"),
    ];
    expect(daySummary(logs, new Date(at("08:00")))).toBe(
      "2 cữ · 2 tã · ngủ 2g 15p",
    );
  });

  it("counts a running sleep up to now, and says 0 when nothing happened", () => {
    expect(
      daySummary([entry("sleep", "07:00", null)], new Date(at("07:30"))),
    ).toBe("0 cữ · 0 tã · ngủ 30p");
    expect(daySummary([], new Date(at("07:30")))).toBe("0 cữ · 0 tã · ngủ 0p");
  });
});
```

Trong `lib/rules/dailyStats.test.ts`, thêm `emptyStatsText,` và `hasStatsData,` vào danh sách import từ `"./dailyStats"` (theo thứ tự chữ cái), rồi thêm cuối file:

```ts
describe("empty stats", () => {
  const stat = (day: string, over: Partial<DayStat> = {}): DayStat => ({
    day,
    sleepMinutes: 0,
    feeds: 0,
    bottleMl: 0,
    wetDiapers: 0,
    dirtyDiapers: 0,
    pumpMl: 0,
    tummyMinutes: 0,
    ...over,
  });

  it("hasStatsData looks at the series the tab draws, including dirty diapers", () => {
    const stats = [stat("2026-11-13"), stat("2026-11-14", { dirtyDiapers: 1 })];
    expect(hasStatsData(stats, "diaper")).toBe(true);
    expect(hasStatsData(stats, "sleep")).toBe(false);
    expect(hasStatsData([stat("2026-11-14", { pumpMl: 40 })], "pump")).toBe(
      true,
    );
  });

  it("emptyStatsText names what is missing and the range", () => {
    expect(emptyStatsText("sleep", 7)).toBe(
      "Chưa có giấc ngủ nào trong 7 ngày",
    );
    expect(emptyStatsText("pump", 14)).toBe(
      "Chưa có lần hút sữa nào trong 14 ngày",
    );
    expect(emptyStatsText("tummy", 7)).toBe(
      "Chưa có lần nằm sấp nào trong 7 ngày",
    );
  });
});
```

Thêm luôn `type DayStat,` vào cùng danh sách import đó (không thêm dòng import thứ hai).

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/history.test.ts lib/rules/dailyStats.test.ts`
Expected: FAIL — `daySummary is not a function`, `hasStatsData is not a function`; các test cũ vẫn xanh.

- [ ] **Step 3: Thêm `daySummary` vào `lib/rules/history.ts`**

Thêm vào đầu file, dưới các import có sẵn:

```ts
import type { LogLike } from "./describeLog";
import { groupFeedSessions } from "./ratings";
import { shortDuration } from "./summaryText";
```

Thêm cuối file:

```ts
// Spec §9 Nhật ký: "N cữ · N tã · ngủ Xg Yp" for the logs of one VN day.
export function daySummary(logs: LogLike[], now: Date): string {
  const feeds = groupFeedSessions(logs, now).length;
  const diapers = logs.filter((log) => log.type === "diaper").length;
  let sleepMs = 0;
  for (const log of logs) {
    if (log.type !== "sleep") continue;
    const end = log.ended_at ? Date.parse(log.ended_at) : now.getTime();
    sleepMs += Math.max(0, end - Date.parse(log.started_at));
  }
  return `${feeds} cữ · ${diapers} tã · ngủ ${shortDuration(Math.round(sleepMs / 60_000))}`;
}
```

- [ ] **Step 4: Thêm `hasStatsData`, `emptyStatsText` vào cuối `lib/rules/dailyStats.ts`**

```ts
export function hasStatsData(stats: DayStat[], tab: StatsTab): boolean {
  return chartRows(stats, tab).some(
    (row) => row.primary > 0 || (row.secondary ?? 0) > 0,
  );
}

const EMPTY_NOUN: Record<StatsTab, string> = {
  sleep: "giấc ngủ",
  feed: "cữ bú",
  diaper: "tã",
  pump: "lần hút sữa",
  tummy: "lần nằm sấp",
};

// Spec §9 Thống kê: shown instead of the chart when the range has nothing.
export function emptyStatsText(tab: StatsTab, days: number): string {
  return `Chưa có ${EMPTY_NOUN[tab]} nào trong ${days} ngày`;
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test lib/rules/history.test.ts lib/rules/dailyStats.test.ts && bun run typecheck`
Expected: PASS (history thêm 2, dailyStats thêm 2); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add lib/rules/history.ts lib/rules/history.test.ts lib/rules/dailyStats.ts lib/rules/dailyStats.test.ts
git commit -m "feat(history): day summary and empty stats text"
```

---

### Task 2: `EmptyState` và `ErrorCard`

**Files:**

- Create: `components/ui/EmptyState.tsx`, `components/ui/ErrorCard.tsx`, `components/ui/states.test.tsx`

**Interfaces:**

- Consumes: `Icon`, `Button`, `Glass`; `IconName`; `findElements`.
- Produces: `EmptyState`, `ErrorCard` (chữ ký ở Contracts).

Spec §10:

- **Trống:** icon 40 `--color-muted` + một câu + nút hành động.
- **Lỗi tải:** thẻ kính viền `--color-danger`, lời lỗi `toVietnameseError`, nút "Thử lại".

- [ ] **Step 1: Viết test hỏng**

`components/ui/states.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { EmptyState } from "./EmptyState";
import { ErrorCard } from "./ErrorCard";
import { findElements } from "./testTree";

describe("EmptyState", () => {
  it("a 40 px muted icon, one sentence and an optional action", () => {
    const onClick = vi.fn();
    const html = renderToStaticMarkup(
      <EmptyState
        icon="list"
        text="Chưa có bản ghi nào."
        action={{ label: "Ghi bản đầu tiên", onClick }}
      />,
    );
    expect(html).toContain('width="40"');
    expect(html).toContain("text-muted");
    expect(html).toContain(`d="${ICON_PATHS.list}"`);
    expect(html).toContain(">Chưa có bản ghi nào.</p>");
    expect(html).toContain(">Ghi bản đầu tiên</button>");
    const [button] = findElements(
      EmptyState({
        icon: "list",
        text: "x",
        action: { label: "Ghi bản đầu tiên", onClick },
      }),
      (el) => el.props.children === "Ghi bản đầu tiên",
    );
    (button.props.onClick as () => void)();
    expect(onClick).toHaveBeenCalledOnce();
    expect(
      renderToStaticMarkup(<EmptyState icon="list" text="Trống." />),
    ).not.toContain("<button");
  });
});

describe("ErrorCard", () => {
  it("a glass card with a danger border, the message and Thử lại", () => {
    const onRetry = vi.fn();
    const html = renderToStaticMarkup(
      <ErrorCard message="Mất kết nối" onRetry={onRetry} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("glass");
    expect(html).toContain("border-danger!");
    expect(html).toContain(">Mất kết nối</p>");
    expect(html).toContain(">Thử lại</button>");
    const [retry] = findElements(
      ErrorCard({ message: "x", onRetry }),
      (el) => el.props.children === "Thử lại",
    );
    (retry.props.onClick as () => void)();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/ui/states.test.tsx`
Expected: FAIL — `Cannot find module './EmptyState'`.

- [ ] **Step 3: Viết `components/ui/EmptyState.tsx`**

```tsx
import type { IconName } from "@/lib/ui/icons";
import { Button } from "./Button";
import { Icon } from "./Icon";

// Spec §10: an empty list — a 40 px muted icon, one sentence, and an action.
export function EmptyState({
  icon,
  text,
  action,
}: {
  icon: IconName;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Icon name={icon} size={40} strokeWidth={1.6} className="text-muted" />
      <p className="text-base text-muted">{text}</p>
      {action && (
        <Button variant="secondary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Viết `components/ui/ErrorCard.tsx`**

```tsx
import { Button } from "./Button";
import { Glass } from "./Glass";

// Spec §10: loading failed — a glass card with a danger border and a retry button.
export function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Glass
      role="alert"
      className="flex flex-col items-start gap-3 border-danger! p-4"
    >
      <p className="text-[15px] text-ink">{message}</p>
      <Button variant="secondary" size="md" onClick={onRetry}>
        Thử lại
      </Button>
    </Glass>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/ui/states.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (EmptyState 1, ErrorCard 1, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/ui/EmptyState.tsx components/ui/ErrorCard.tsx components/ui/states.test.tsx
git commit -m "feat(ui): empty state and load error card"
```

---

### Task 3: Bảng 9 hành động mở được từ mọi trang

**Files:**

- Create: `components/actions/ActionChrome.tsx`, `components/actions/actionchrome.test.tsx`
- Modify: `components/actions/QuickActions.tsx` (3 chỗ), `components/AuthGate.tsx` (3 chỗ)

**Interfaces:**

- Consumes: `TabBar`, `ActionSheet`, `useQuickActions`, `QuickActionsProvider`, `ToastProvider`.
- Produces: các trường mới của `QuickActionsValue`; `ActionChrome({ babyName })`.

Hôm nay trạng thái mở bảng nằm trong `AuthGate` (`plusOpen`). Task này chuyển nó vào `QuickActionsProvider`, để trang nào trong provider cũng gọi `openActionSheet()` được. Hành vi nút "+" giữ nguyên.

- [ ] **Step 1: Viết test hỏng**

`components/actions/actionchrome.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { ActionChrome } from "./ActionChrome";
import { QuickActionsProvider } from "./QuickActions";

// TabBar reads the current path; outside the Next router there is none.
vi.mock("next/navigation", () => ({ usePathname: () => "/nhat-ky" }));

const baby = { id: "b1", family_id: "f1", name: "Bun" } as Baby;
const member = {
  role: "owner",
  user_id: "u1",
  display_name: "Ba",
} as FamilyMember;

describe("ActionChrome", () => {
  it("draws the tab bar with + and the closed action sheet from the shared state", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <QuickActionsProvider baby={baby} member={member} userId="u1">
            <ActionChrome babyName="Bun" />
          </QuickActionsProvider>
        </ToastProvider>
      </QueryClientProvider>,
    );
    expect(html).toContain('href="/nhat-ky"');
    expect(html).toContain('aria-label="Ghi lại"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain(">Ghi lại cho Bun</h2>");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/actions/actionchrome.test.tsx`
Expected: FAIL — `Cannot find module …ActionChrome`.

- [ ] **Step 3: Thêm trạng thái bảng vào `components/actions/QuickActions.tsx`**

1. Trong `export type QuickActionsValue = { … }`, thêm 4 dòng ngay sau dòng `openInstant: (type: InstantType, initial?: QuickValues) => void;`:

```ts
  // The "+" action sheet (spec §6.3), open from any page inside the provider.
  actionSheetOpen: boolean;
  openActionSheet: () => void;
  toggleActionSheet: () => void;
  closeActionSheet: () => void;
```

2. Ngay trên dòng `const [pumpStopped, setPumpStopped] = useState<string | null>(null);` (và chú thích ngay trên nó), thêm:

```ts
const [actionSheetOpen, setActionSheetOpen] = useState(false);
```

3. Trong object `const value: QuickActionsValue = { … }`, ngay sau dòng `openInstant: (type, initial) => setSheet({ type, initial }),`, thêm:

```ts
    actionSheetOpen,
    openActionSheet: () => setActionSheetOpen(true),
    toggleActionSheet: () => setActionSheetOpen((open) => !open),
    closeActionSheet: () => setActionSheetOpen(false),
```

- [ ] **Step 4: Viết `components/actions/ActionChrome.tsx`**

```tsx
"use client";

import { TabBar } from "@/components/nav/TabBar";
import { ActionSheet } from "./ActionSheet";
import { useQuickActions } from "./QuickActions";

// The tab bar with its "+" button and the 9-action sheet. Whether the sheet is open lives in
// QuickActionsProvider, so a page (e.g. an empty Nhật ký) can open it too.
export function ActionChrome({ babyName }: { babyName: string }) {
  const actions = useQuickActions();
  return (
    <>
      <TabBar
        onPlus={actions.toggleActionSheet}
        plusOpen={actions.actionSheetOpen}
      />
      <ActionSheet
        open={actions.actionSheetOpen}
        onClose={actions.closeActionSheet}
        babyName={babyName}
      />
    </>
  );
}
```

- [ ] **Step 5: Dùng `ActionChrome` trong `components/AuthGate.tsx`**

1. Đổi dòng `import { useEffect, useState, type ReactNode } from "react";` thành:

```ts
import { useEffect, type ReactNode } from "react";
```

2. Đổi dòng `import { ActionSheet } from "@/components/actions/ActionSheet";` thành:

```ts
import { ActionChrome } from "@/components/actions/ActionChrome";
```

3. Xóa hai dòng:

```ts
// The + button's action sheet (spec §6.3); hooks stay above the early returns.
const [plusOpen, setPlusOpen] = useState(false);
```

4. Trong nhánh `return ( <QuickActionsProvider …> … )` cuối hàm, thay khối:

```tsx
      <TabBar onPlus={() => setPlusOpen((open) => !open)} plusOpen={plusOpen} />
      <ActionSheet
        open={plusOpen}
        onClose={() => setPlusOpen(false)}
        babyName={baby.name}
      />
```

bằng:

```tsx
<ActionChrome babyName={baby.name} />
```

(`TabBar` vẫn được dùng ở nhánh chưa có bé, nên giữ import của nó.)


- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components/actions components/nav lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (actionchrome 1, các test cũ trong `components/actions` và `components/nav` giữ nguyên số); typecheck không lỗi.

- [ ] **Step 7: Commit**

```bash
git add components/actions/ActionChrome.tsx components/actions/actionchrome.test.tsx components/actions/QuickActions.tsx components/AuthGate.tsx
git commit -m "feat(actions): open the + action sheet from any page"
```

---

### Task 4: Màn Nhật ký

**Files:**

- Create: `components/history/HistoryList.tsx`, `components/history/historylist.test.tsx`
- Modify: `components/history/HistoryScreen.tsx` (viết lại toàn file)

**Interfaces:**

- Consumes: `daySummary` (Task 1); `EmptyState`, `ErrorCard` (Task 2); `openActionSheet` (Task 3); `PageHeader`, `IconButton`, `ChipGroup`, `Skeleton`, `Button`, `Glass`, `Icon`; `PendingMark`; `CATEGORIES`, `CATEGORY_CHIP`; `vnDayLabel`; `describeLog`; `formatVnTime`; `LogEditSheet`; các hook dữ liệu có sẵn.
- Produces: `HistoryList({ groups: { day: string; summary: string; logs: LogRow[] }[]; now: Date; nameOf: (userId: string) => string; pending: Set<string>; onOpen: (log: LogRow) => void })`. Tóm tắt ngày tính trên mọi log của ngày đó (spec §9), trước khi lọc, nên `HistoryScreen` tính sẵn và truyền vào.

Spec §9 Nhật ký:

- Tiêu đề lớn và `IconButton` `calendar` "Thêm bản ghi cũ", mở `LogEditSheet` trống như nút "+ Thêm" cũ.
- `ChipGroup` lọc theo `HISTORY_FILTERS`.
- Mỗi ngày một nhóm: tiêu đề 20/700, tóm tắt bên phải.
- Mỗi hàng có chip màu loại 34, mô tả 16/500, meta 13, giờ 15/600 bên phải, người ghi 12 dưới giờ.

- [ ] **Step 1: Viết test hỏng**

`components/history/historylist.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HistoryList } from "./HistoryList";

const NOW = new Date("2026-11-14T05:00:00.000Z"); // 12:00 VN
const log = (
  id: string,
  type: string,
  start: string,
  end: string | null,
  details: unknown,
  note: string | null = null,
) =>
  ({
    id,
    baby_id: "b1",
    type,
    started_at: start,
    ended_at: end,
    details,
    note,
    created_by: "u1",
    created_at: start,
    updated_at: start,
  }) as LogRow;

const bottle = log(
  "b1",
  "bottle",
  "2026-11-14T04:00:00.000Z",
  "2026-11-14T04:00:00.000Z",
  { ml: 90, milk: "formula" },
  "uống hết",
);
const sleep = log(
  "s1",
  "sleep",
  "2026-11-14T02:00:00.000Z",
  "2026-11-14T03:00:00.000Z",
  {},
);
const groups = [{ day: "2026-11-14", summary: "1 cữ · 0 tã · ngủ 1g", logs: [bottle, sleep] }];

describe("HistoryList", () => {
  it("groups by day with a 20/700 title and the day summary, rows with chip, text, time and who", () => {
    const html = renderToStaticMarkup(
      <HistoryList
        groups={groups}
        now={NOW}
        nameOf={() => "Ba"}
        pending={new Set(["b1"])}
        onOpen={() => {}}
      />,
    );
    expect(html).toContain(">Hôm nay</h2>");
    expect(html).toContain("text-xl");
    expect(html).toContain(">1 cữ · 0 tã · ngủ 1g</span>");
    expect(html).toContain("size-[34px]");
    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
    expect(html).toContain("Bình 90 ml sữa công thức");
    expect(html).toContain(">uống hết</span>");
    expect(html).toContain(">11:00</span>");
    expect(html).toContain(">09:00</span>");
    expect(html.match(/>Ba<\/span>/g)).toHaveLength(2);
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
    expect(html).toContain("glass");
  });

  it("opens the row's log", () => {
    const onOpen = vi.fn();
    const rows = findElements(
      HistoryList({
        groups,
        now: NOW,
        nameOf: () => "Ba",
        pending: new Set(),
        onOpen,
      }),
      (el) => el.type === "button",
    );
    expect(rows).toHaveLength(2);
    (rows[1].props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledWith(sleep);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/history/historylist.test.tsx`
Expected: FAIL — `Cannot find module './HistoryList'`.

- [ ] **Step 3: Viết `components/history/HistoryList.tsx`**

```tsx
import { PendingMark } from "@/components/sync/PendingMark";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { vnDayLabel } from "@/lib/rules/days";
import { describeLog } from "@/lib/rules/describeLog";
import type { LogType } from "@/lib/rules/logDetails";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

// Spec §9 Nhật ký: one glass list per VN day.
export function HistoryList({
  groups,
  now,
  nameOf,
  pending,
  onOpen,
}: {
  groups: { day: string; summary: string; logs: LogRow[] }[];
  now: Date;
  nameOf: (userId: string) => string;
  pending: Set<string>;
  onOpen: (log: LogRow) => void;
}) {
  return (
    <>
      {groups.map((group) => (
        <section key={group.day} className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-xl leading-[26px] font-bold text-ink">
              {vnDayLabel(group.day, now)}
            </h2>
            <span className="text-[13px] text-muted tabular-nums">
              {group.summary}
            </span>
          </div>
          <Glass as="ul" className="overflow-hidden">
            {group.logs.map((log) => {
              const category = CATEGORIES[log.type as LogType];
              return (
                <li
                  key={log.id}
                  className="border-b border-line last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => onOpen(log)}
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left"
                  >
                    {category && (
                      <span
                        className={cx(
                          "flex size-[34px] shrink-0 items-center justify-center rounded-full",
                          CATEGORY_CHIP[category.token],
                        )}
                      >
                        <Icon
                          name={category.icon}
                          size={18}
                          strokeWidth={2.2}
                        />
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-base font-medium text-ink">
                        {describeLog(log, now)}{" "}
                        <PendingMark pending={pending.has(log.id)} />
                      </span>
                      {log.note && (
                        <span className="truncate text-[13px] text-muted">
                          {log.note}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="text-[15px] font-semibold text-ink tabular-nums">
                        {formatVnTime(new Date(log.started_at))}
                      </span>
                      <span className="text-xs text-muted">
                        {nameOf(log.created_by)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </Glass>
        </section>
      ))}
    </>
  );
}
```

- [ ] **Step 4: Viết lại `components/history/HistoryScreen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useQuickActions } from "@/components/actions/QuickActions";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import { useHistoryLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useNow } from "@/lib/hooks/useNow";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import {
  canModifyLog,
  daySummary,
  groupByVnDay,
  HISTORY_FILTERS,
  matchesFilter,
  type HistoryFilter,
} from "@/lib/rules/history";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { HistoryList } from "./HistoryList";
import { LogEditSheet } from "./LogEditSheet";

type SheetState = { log: LogRow | null } | null;

export function HistoryScreen({
  baby,
  member,
  userId,
}: {
  baby: Baby;
  member: FamilyMember;
  userId: string;
}) {
  const now = useNow(30_000);
  useLogsRealtime(baby.id);
  const history = useHistoryLogs(baby.id, baby.dob);
  const members = useMembers(baby.family_id);
  const actions = useQuickActions();
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sheet, setSheet] = useState<SheetState>(null);

  const rows = history.data?.pages.flat() ?? [];
  // The day summary counts every log of the day; the filter only hides rows (spec §9).
  const groups = groupByVnDay(rows)
    .map((group) => ({
      day: group.day,
      summary: daySummary(group.logs, now),
      logs: group.logs.filter((row) => matchesFilter(row, filter)),
    }))
    .filter((group) => group.logs.length > 0);
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Nhật ký"
        action={
          <IconButton
            label="Thêm bản ghi cũ"
            icon="calendar"
            onClick={() => setSheet({ log: null })}
          />
        }
      />

      <ChipGroup
        label="Lọc nhật ký"
        options={HISTORY_FILTERS}
        value={filter}
        onChange={setFilter}
      />

      {history.isPending ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[60px]" />
          ))}
        </div>
      ) : history.isError && !history.data ? (
        <ErrorCard
          message={toVietnameseError(history.error)}
          onRetry={() => void history.refetch()}
        />
      ) : groups.length === 0 ? (
        filter === "all" && !history.hasNextPage ? (
          <EmptyState
            icon="list"
            text="Chưa có bản ghi nào."
            action={{
              label: "Ghi bản đầu tiên",
              onClick: actions.openActionSheet,
            }}
          />
        ) : (
          <EmptyState
            icon="list"
            text={
              filter === "all"
                ? "Chưa có bản ghi nào trong 7 ngày qua."
                : "Không có bản ghi nào cho mục này."
            }
          />
        )
      ) : (
        <HistoryList
          groups={groups}
          now={now}
          nameOf={nameOf}
          pending={pending}
          onOpen={(log) => setSheet({ log })}
        />
      )}

      {history.hasNextPage && (
        <Button
          variant="secondary"
          block
          disabled={history.isFetchingNextPage}
          onClick={() => void history.fetchNextPage()}
        >
          {history.isFetchingNextPage ? "Đang tải…" : "Xem thêm 7 ngày trước"}
        </Button>
      )}

      {sheet && (
        <LogEditSheet
          babyId={baby.id}
          userId={userId}
          log={sheet.log}
          canModify={
            sheet.log === null || canModifyLog(member, sheet.log.created_by)
          }
          who={sheet.log ? nameOf(sheet.log.created_by) : ""}
          recentLogs={rows}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/history lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (historylist 2, logedit giữ nguyên 3, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/history/HistoryList.tsx components/history/historylist.test.tsx components/history/HistoryScreen.tsx
git commit -m "feat(history): iOS-style Nhật ký with day summaries and states"
```

---

### Task 5: Màn Thống kê; kiểm toàn bộ

**Files:**

- Create: `components/stats/StatsTable.tsx`, `components/stats/statstable.test.tsx`
- Modify: `components/stats/StatsScreen.tsx` (viết lại toàn file), `components/stats/StatsChart.tsx` (viết lại toàn file)

**Interfaces:**

- Consumes: `hasStatsData`, `emptyStatsText` (Task 1); `ErrorCard` (Task 2); `PageHeader`, `ChipGroup`, `Segmented`, `Skeleton`, `Glass`; `DayStat`, `StatsTab`, `STATS_TABS`, `dailyStats`, `chartRows`, `statsFetchSince`; `vnDayLabel`, `vnDayRange`; `formatDuration`.
- Produces: `StatsTable({ stats: DayStat[]; tab: StatsTab; now: Date })`, `STATS_COLUMNS`; `StatsChart({ rows, primaryName, secondaryName, decimals, color, secondaryColor })`.

Spec §9 Thống kê:

- Loại dữ liệu là `ChipGroup`; 7/14 ngày là `Segmented` nhỏ bên phải tiêu đề.
- Cột biểu đồ màu theo loại.
- Không có dữ liệu thì thay biểu đồ bằng câu "Chưa có <loại> nào trong N ngày".

Trang con của Khám phá nên `PageHeader` có nút "‹ Khám phá" (spec §9 đầu mục).

- [ ] **Step 1: Viết test hỏng**

`components/stats/statstable.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DayStat } from "@/lib/rules/dailyStats";
import { StatsTable } from "./StatsTable";

const NOW = new Date("2026-11-14T05:00:00.000Z");
const stat = (day: string, over: Partial<DayStat> = {}): DayStat => ({
  day,
  sleepMinutes: 0,
  feeds: 0,
  bottleMl: 0,
  wetDiapers: 0,
  dirtyDiapers: 0,
  pumpMl: 0,
  tummyMinutes: 0,
  ...over,
});
const stats = [
  stat("2026-11-13", { wetDiapers: 5, dirtyDiapers: 2 }),
  stat("2026-11-14", { wetDiapers: 3, sleepMinutes: 90 }),
];

describe("StatsTable", () => {
  it("a glass table, newest day first, with the tab's columns", () => {
    const html = renderToStaticMarkup(
      <StatsTable stats={stats} tab="diaper" now={NOW} />,
    );
    expect(html).toContain("glass");
    expect(html).toContain(">Ngày</th>");
    expect(html).toContain(">Ướt</th>");
    expect(html).toContain(">Bẩn</th>");
    expect(html.indexOf(">Hôm nay</td>")).toBeLessThan(
      html.indexOf(">Hôm qua</td>"),
    );
    expect(html).toContain(">5</td>");
    expect(html).toContain("tabular-nums");
  });

  it("shows a dash for no sleep and the duration otherwise", () => {
    const html = renderToStaticMarkup(
      <StatsTable stats={stats} tab="sleep" now={NOW} />,
    );
    expect(html).toContain(">Giờ ngủ</th>");
    expect(html).toContain(">1 giờ 30 phút</td>");
    expect(html).toContain(">—</td>");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/stats/statstable.test.tsx`
Expected: FAIL — `Cannot find module './StatsTable'`.

- [ ] **Step 3: Viết `components/stats/StatsTable.tsx`**

```tsx
import { Glass } from "@/components/ui/Glass";
import type { DayStat, StatsTab } from "@/lib/rules/dailyStats";
import { vnDayLabel } from "@/lib/rules/days";
import { formatDuration } from "@/lib/rules/time";

export const STATS_COLUMNS: Record<
  StatsTab,
  { label: string; value: (s: DayStat) => string }[]
> = {
  sleep: [
    {
      label: "Giờ ngủ",
      value: (s) =>
        s.sleepMinutes === 0 ? "—" : formatDuration(s.sleepMinutes * 60_000),
    },
  ],
  feed: [
    { label: "Cữ bú", value: (s) => String(s.feeds) },
    { label: "Bình (ml)", value: (s) => String(s.bottleMl) },
  ],
  diaper: [
    { label: "Ướt", value: (s) => String(s.wetDiapers) },
    { label: "Bẩn", value: (s) => String(s.dirtyDiapers) },
  ],
  pump: [{ label: "Sữa hút (ml)", value: (s) => String(s.pumpMl) }],
  tummy: [
    {
      label: "Tummy",
      value: (s) =>
        s.tummyMinutes === 0 ? "—" : formatDuration(s.tummyMinutes * 60_000),
    },
  ],
};

export function StatsTable({
  stats,
  tab,
  now,
}: {
  stats: DayStat[];
  tab: StatsTab;
  now: Date;
}) {
  const columns = STATS_COLUMNS[tab];
  return (
    <Glass className="overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[13px] text-muted">
            <th className="px-4 py-2.5 font-medium">Ngày</th>
            {columns.map((column) => (
              <th
                key={column.label}
                className="px-4 py-2.5 text-right font-medium"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...stats].reverse().map((s) => (
            <tr key={s.day} className="border-t border-line">
              <td className="px-4 py-2.5 text-[15px] text-ink">
                {vnDayLabel(s.day, now)}
              </td>
              {columns.map((column) => (
                <td
                  key={column.label}
                  className="px-4 py-2.5 text-right text-[15px] text-ink tabular-nums"
                >
                  {column.value(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Glass>
  );
}
```

- [ ] **Step 4: Viết lại `components/stats/StatsChart.tsx`**

```tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Colours come in as var(--color-…) strings so the chart follows the active theme.
export function StatsChart({
  rows,
  primaryName,
  secondaryName,
  decimals,
  color,
  secondaryColor,
}: {
  rows: { label: string; primary: number; secondary: number | null }[];
  primaryName: string;
  secondaryName: string | null;
  decimals: boolean;
  color: string;
  secondaryColor: string | null;
}) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--color-muted)"
            strokeOpacity={0.4}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
            interval={0}
          />
          <YAxis
            allowDecimals={decimals}
            width={32}
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
          />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString("vi-VN")}
            contentStyle={{
              background: "var(--color-glass-solid)",
              borderColor: "var(--color-line)",
              borderRadius: 16,
              color: "var(--color-ink)",
            }}
            itemStyle={{ color: "var(--color-ink)" }}
            cursor={{ fill: "var(--color-line)" }}
          />
          {secondaryName && (
            <Legend
              formatter={(value) => (
                <span style={{ color: "var(--color-ink)" }}>{value}</span>
              )}
            />
          )}
          <Bar
            dataKey="primary"
            name={primaryName}
            fill={color}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          {secondaryName && secondaryColor && (
            <Bar
              dataKey="secondary"
              name={secondaryName}
              fill={secondaryColor}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: Viết lại `components/stats/StatsScreen.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Glass } from "@/components/ui/Glass";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { toVietnameseError } from "@/lib/data/errors";
import { useStatsLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import {
  chartRows,
  dailyStats,
  emptyStatsText,
  hasStatsData,
  STATS_TABS,
  statsFetchSince,
  type StatsTab,
} from "@/lib/rules/dailyStats";
import { vnDayRange } from "@/lib/rules/days";
import type { Baby } from "@/lib/supabase/rows";
import { StatsTable } from "./StatsTable";

function ChartUnavailable() {
  return <p className="h-60 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
}

const StatsChart = dynamic(
  () =>
    import("./StatsChart")
      .then((m) => m.StatsChart)
      // Offline before the chart was ever loaded: keep the table, skip the chart.
      .catch(() => ChartUnavailable),
  { ssr: false, loading: () => <div className="h-60" /> },
);

const SERIES: Record<
  StatsTab,
  {
    primary: string;
    secondary: string | null;
    color: string;
    secondaryColor: string | null;
  }
> = {
  sleep: {
    primary: "Giờ ngủ",
    secondary: null,
    color: "var(--color-cat-sleep)",
    secondaryColor: null,
  },
  feed: {
    primary: "Số cữ bú",
    secondary: null,
    color: "var(--color-cat-feed)",
    secondaryColor: null,
  },
  diaper: {
    primary: "Tã ướt",
    secondary: "Tã bẩn",
    color: "var(--color-cat-diaper)",
    secondaryColor: "var(--color-muted)",
  },
  pump: {
    primary: "Sữa hút (ml)",
    secondary: null,
    color: "var(--color-cat-pump)",
    secondaryColor: null,
  },
  tummy: {
    primary: "Tummy (phút)",
    secondary: null,
    color: "var(--color-cat-tummy)",
    secondaryColor: null,
  },
};

const RANGES = [
  { value: "7", label: "7 ngày" },
  { value: "14", label: "14 ngày" },
];

export function StatsScreen({ baby }: { baby: Baby }) {
  const now = useNow(60_000);
  useLogsRealtime(baby.id);
  const [tab, setTab] = useState<StatsTab>("sleep");
  const [range, setRange] = useState<7 | 14>(7);
  const days = vnDayRange(now, range);
  const logs = useStatsLogs(baby.id, statsFetchSince(days));
  const stats = dailyStats(logs.data ?? [], days, now);
  const series = SERIES[tab];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Thống kê"
        back={{ href: "/kham-pha", label: "Khám phá" }}
        action={
          <Segmented
            label="Khoảng thời gian"
            options={RANGES}
            value={String(range)}
            onChange={(value) => setRange(value === "14" ? 14 : 7)}
            className="w-[168px] shrink-0"
          />
        }
      />

      <ChipGroup
        label="Loại dữ liệu"
        options={STATS_TABS}
        value={tab}
        onChange={setTab}
      />

      {logs.isPending ? (
        <Skeleton className="h-60" />
      ) : logs.isError && !logs.data ? (
        <ErrorCard
          message={toVietnameseError(logs.error)}
          onRetry={() => void logs.refetch()}
        />
      ) : (
        <>
          {hasStatsData(stats, tab) ? (
            <Glass className="p-3">
              <StatsChart
                rows={chartRows(stats, tab)}
                primaryName={series.primary}
                secondaryName={series.secondary}
                decimals={tab === "sleep"}
                color={series.color}
                secondaryColor={series.secondaryColor}
              />
            </Glass>
          ) : (
            <Glass className="p-6 text-center text-[15px] text-muted">
              {emptyStatsText(tab, range)}
            </Glass>
          )}
          <StatsTable stats={stats} tab={tab} now={now} />
          <p className="px-1 text-[13px] text-muted">
            Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.
          </p>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 601 có sẵn + 2 history + 2 dailyStats + 2 states + 1 actionchrome + 2 historylist + 2 statstable = 612. Build xong.

- [ ] **Step 7: Kiểm trên trình duyệt (không ghi dữ liệu)**

Run: `bun run dev`, mở `http://localhost:3000/nhat-ky` ở bề rộng 375 px, đăng nhập. **Không bấm Lưu, không xóa, không chọn hành động trong bảng 9 hành động.**
Expected:

- **Nhật ký:**
  - Tiêu đề lớn "Nhật ký", nút tròn lịch bên phải, hàng chip lọc cuộn ngang.
  - Mỗi ngày có tiêu đề to và tóm tắt "N cữ · N tã · ngủ …" bên phải.
  - Hàng có chip icon màu, mô tả, giờ đậm bên phải, người ghi dưới giờ.
  - Bấm nút lịch: sheet "Thêm bản ghi" mở; đóng nó.
  - Chọn chip "Nhiệt độ": nếu không có bản ghi thì hiện icon to và "Không có bản ghi nào cho mục này.".
- **Nút "+" ở tab bar:** bấm thì bảng 9 hành động mở; bấm "+" lần nữa (hoặc nút đóng) thì đóng. Không chọn hành động.
- **Khám phá → Thống kê:**
  - Có nút "‹ Khám phá", tiêu đề "Thống kê", `Segmented` 7 ngày / 14 ngày bên phải tiêu đề, hàng chip loại.
  - Biểu đồ có cột màu theo loại (Ngủ tím, Bú hồng, Tã vàng ở theme Sáng/Tối).
  - Loại không có dữ liệu thì hiện câu "Chưa có … nào trong 7 ngày".
  - Bảng số theo ngày trong thẻ kính.
- Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 8: Commit**

```bash
git add components/stats
git commit -m "feat(stats): iOS-style Thống kê with category colours and empty state"
```

---

## Kết thúc M1 (Đợt 5)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 612 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 5 / M2 (Tăng trưởng, Tiêm chủng, Phát triển).
