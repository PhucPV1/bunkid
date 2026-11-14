# Kim Bun UI — Đợt 2 / M2 (nút "+" và bảng 9 hành động) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-14

**Goal:** Thêm nút "+" cạnh tab bar ở mọi trang có bé, mở bảng 9 hành động (bấm giờ và ghi nhanh) dùng chung đúng luồng của Trang chủ, và sửa lỗi tab bar mới đè lên đáy các sheet nhập cũ.

**Architecture:**

- Luồng bấm giờ, dừng giờ (kèm hỏi số ml khi dừng hút sữa) và mở sheet nhập nhanh được nhấc từ `HomeScreen` ra `QuickActionsProvider` (context) gắn trong `AuthGate` cho mọi trang có bé; Trang chủ và bảng 9 hành động cùng gọi `useQuickActions()`. Sheet nhập nhanh và sheet số ml giờ do provider vẽ, sau tab bar trong DOM.
- Phần thuần (danh sách 9 hành động, nhãn "Dừng …", khi nào hỏi số ml) ở `lib/rules/quickActions.ts`, có unit test.
- Bảng 9 hành động dùng `Sheet` biến thể `floating` của Đợt 1; lưới 9 ô là component không hook (`QuickActionGrid`) để test bằng cây phần tử.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`), Bun. Không thêm gói nào.

**Các mốc của Đợt 2 (spec §12):**

- **M1:** tab bar 3 tab, `PageHeader`, `/kham-pha`, chuyển hướng route cũ — đã làm xong trên nhánh `feat/kim-bun-dot2-m1`.
- **M2 (plan này):** spec §6.3 và hàng `ActionSheet` ở §5; sửa lớp chồng của tab bar và `PageHeader`.
- **M3 (plan sau):** header Trang chủ có nút trăng (§6.5), Cài đặt kiểu iOS và 3 trang con (§6.8).

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI; icon dùng `components/ui/Icon.tsx`.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Không đổi luồng dữ liệu: vẫn dùng `useTimerPress`, `useStopTimer`, `useRecentLogs`, `QuickEntrySheet`, `PumpSheet` như hiện nay; không đổi `lib/data/`, outbox, Supabase.
- Chỉ người được sửa log mới được hỏi số ml (owner hoặc người tạo log), giữ đúng luật RLS hiện tại.
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay trên trình duyệt, không bấm Lưu, không bấm ô bấm giờ; chỉ mở rồi đóng.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".

## Contracts with Other Plans

**Consumes:**

- Từ Đợt 2 / M1: `components/nav/TabBar.tsx` `<TabBarView current onPlus? plusOpen? />`, `<TabBar onPlus? plusOpen? />` (đang ở `z-20`, Task 1 hạ xuống `z-10`); `components/ui/PageHeader.tsx` (`z-30`, Task 1 hạ xuống `z-10`); `components/AuthGate.tsx` (bọc nội dung `pb-[120px]`, vẽ `TabBar`).
- Từ Đợt 1: `components/ui/Sheet.tsx` `<Sheet open onClose title icon? iconColor? dirty? footer? variant? children />` với `variant="floating"`; `components/ui/Icon.tsx`; `lib/ui/categories.ts` `CATEGORIES`, `CategoryToken`; `lib/ui/cx.ts`; `components/ui/testTree.ts` `hostElements`.
- Có sẵn trong app: `lib/data/logs.ts` `useRecentLogs(babyId)`, `useTimerPress(babyId, userId)` (mutate `{ running: RunningLog[]; button: TimerButton }`), `useStopTimer(babyId, userId)` (mutate `id: string`), `toRunning(rows: LogRow[]): RunningLog[]`; `lib/rules/timer.ts` `TimerButton`, `RunningLog`; `lib/rules/quickEntry.ts` `InstantType`, `QuickValues`; `lib/rules/logDetails.ts` `LogType`; `components/home/QuickEntrySheet.tsx` `<QuickEntrySheet type babyId userId onClose initial? recentLogs? />`; `components/home/PumpSheet.tsx` `<PumpSheet logId babyId userId onClose />`; `lib/supabase/rows.ts` `Baby`, `FamilyMember`, `LogRow`.

**Produces** (Đợt 2 / M3 và Đợt 3 dùng):

- `lib/rules/quickActions.ts`: `type QuickAction`, `QUICK_ACTIONS: QuickAction[]` (9 mục, thứ tự spec §6.3), `isActionRunning(action, running): boolean`, `actionLabel(action, running): string`, `shouldAskPumpAmounts(log: { type: string; created_by: string }, member: { role: string }, userId: string): boolean`.
- `components/actions/QuickActions.tsx`: `type QuickActionsValue = { running: RunningLog[]; busy: boolean; error: Error | null; pressTimer(button: TimerButton): void; stopTimer(log: LogRow): void; openInstant(type: InstantType, initial?: QuickValues): void }`, `<QuickActionsProvider baby member userId>`, `useQuickActions(): QuickActionsValue`.
- `components/actions/ActionSheet.tsx`: `<QuickActionGrid running onPick />`, `<ActionSheetView open onClose babyName running onPick />`, `<ActionSheet open onClose babyName />`.
- `AuthGate` (trang có bé): bọc mọi thứ trong `QuickActionsProvider`, tab bar có nút "+", bảng 9 hành động.
- Lớp chồng: tab bar và thanh `PageHeader` thu gọn ở `z-10`, dưới các sheet cũ (`z-20`), `Toast` (`z-40`) và mọi `<dialog>` (top layer).

---

### Task 1: Sửa lớp chồng của tab bar và `PageHeader`; tab bar mờ khi bảng mở

**Files:**

- Modify: `components/nav/TabBar.tsx`, `components/nav/tabbar.test.tsx`, `components/ui/PageHeader.tsx`, `components/ui/pageheader.test.tsx`

**Interfaces:**

- Consumes: `TabBarView`, `PageHeaderView` (Đợt 2 / M1).
- Produces: tab bar `z-10`, `ul` của tab bar có `opacity-60` khi `plusOpen`; thanh `PageHeader` thu gọn `z-10`.

Vì sao: các sheet cũ (`QuickEntrySheet`, `PumpSheet`, `LogEditSheet`, `GrowthSheet`, `DoseSheet`, `MilestoneSheet`, khung xem ảnh) là `fixed inset-0 z-20`. Tab bar M1 cũng `z-20` và được vẽ sau nội dung trang nên đè lên nút "Lưu" ở đáy các sheet đó.

- [ ] **Step 1: Thêm test hỏng**

Trong `components/nav/tabbar.test.tsx`, thêm vào `describe("TabBarView", …)`:

```tsx
it("sits below the old z-20 sheets and dims while the action sheet is open", () => {
  const closed = renderToStaticMarkup(
    <TabBarView current="home" onPlus={() => {}} />,
  );
  expect(closed).toContain(" z-10 ");
  expect(closed).not.toContain("z-20");
  expect(closed).not.toContain("opacity-60");
  const open = renderToStaticMarkup(
    <TabBarView current="home" onPlus={() => {}} plusOpen />,
  );
  expect(open).toContain("opacity-60");
});
```

Trong `components/ui/pageheader.test.tsx`, thêm vào `describe("PageHeaderView", …)`:

```tsx
it("keeps the compact bar below the old z-20 sheets", () => {
  const html = renderToStaticMarkup(
    <PageHeaderView title="Khám phá" compact />,
  );
  expect(html).toContain(" z-10 ");
  expect(html).not.toContain("z-30");
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/nav/tabbar.test.tsx components/ui/pageheader.test.tsx`
Expected: FAIL — 2 test mới: chuỗi `" z-10 "` không có (đang là `z-20` / `z-30`), `opacity-60` không có.

- [ ] **Step 3: Sửa `components/nav/TabBar.tsx`**

Trong `className` của `<nav>`, đổi `z-20` thành `z-10`:

```tsx
className =
  "fixed inset-x-4 bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)] z-10 mx-auto flex max-w-md items-center gap-2.5 print:hidden";
```

Đổi `className` của `<ul>` từ chuỗi tĩnh sang `cx(...)`:

```tsx
      <ul
        className={cx(
          "glass-strong grid h-[62px] flex-1 grid-cols-3 rounded-full p-1 shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=dark]:shadow-[0_10px_30px_rgb(0_0_0/0.25)] in-data-[theme=night]:shadow-none",
          plusOpen && "opacity-60",
        )}
      >
```

- [ ] **Step 4: Sửa `components/ui/PageHeader.tsx`**

Trong `className` của thanh thu gọn, đổi `z-30` thành `z-10` (giữ nguyên phần còn lại của chuỗi).

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/nav/tabbar.test.tsx components/ui/pageheader.test.tsx lib/themeGuard.test.ts`
Expected: PASS (tabbar 5, pageheader 5, themeGuard 1).

- [ ] **Step 6: Commit**

```bash
git add components/nav/TabBar.tsx components/nav/tabbar.test.tsx components/ui/PageHeader.tsx components/ui/pageheader.test.tsx
git commit -m "fix(nav): keep tab bar and compact header below sheets"
```

---

### Task 2: Luật thuần của 9 hành động (`lib/rules/quickActions.ts`)

**Files:**

- Create: `lib/rules/quickActions.ts`, `lib/rules/quickActions.test.ts`

**Interfaces:**

- Consumes: `TimerButton`, `RunningLog` (`lib/rules/timer.ts`); `InstantType` (`lib/rules/quickEntry.ts`); `LogType` (`lib/rules/logDetails.ts`).
- Produces: `QuickAction`, `QUICK_ACTIONS`, `isActionRunning`, `actionLabel`, `shouldAskPumpAmounts` (chữ ký ở Contracts).

- [ ] **Step 1: Viết test hỏng**

`lib/rules/quickActions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  actionLabel,
  isActionRunning,
  QUICK_ACTIONS,
  shouldAskPumpAmounts,
} from "./quickActions";
import type { RunningLog } from "./timer";

const byKey = (key: string) => QUICK_ACTIONS.find((a) => a.key === key)!;
const leftFeed: RunningLog = {
  id: "l1",
  type: "breast",
  details: { side: "left" },
};

describe("QUICK_ACTIONS", () => {
  it("lists the nine actions of spec §6.3 in grid order", () => {
    expect(QUICK_ACTIONS.map((a) => a.label)).toEqual([
      "Bú trái",
      "Bú phải",
      "Bú bình",
      "Ngủ",
      "Thay tã",
      "Hút sữa",
      "Thuốc",
      "Nhiệt độ",
      "Nằm sấp",
    ]);
  });

  it("marks timers and instant entries", () => {
    expect(
      QUICK_ACTIONS.filter((a) => a.kind === "timer").map((a) => a.key),
    ).toEqual(["breast-left", "breast-right", "sleep", "pump", "tummy"]);
    expect(byKey("breast-right")).toMatchObject({
      kind: "timer",
      category: "breast",
      button: { type: "breast", side: "right" },
    });
    expect(byKey("diaper")).toMatchObject({
      kind: "instant",
      category: "diaper",
      instant: "diaper",
    });
    expect(byKey("temperature")).toMatchObject({
      kind: "instant",
      category: "temperature",
      instant: "temperature",
    });
  });
});

describe("running state", () => {
  it("a breast timer is running only for its own side", () => {
    expect(isActionRunning(byKey("breast-left"), [leftFeed])).toBe(true);
    expect(isActionRunning(byKey("breast-right"), [leftFeed])).toBe(false);
    expect(
      isActionRunning(byKey("sleep"), [
        { id: "s", type: "sleep", details: {} },
      ]),
    ).toBe(true);
    expect(isActionRunning(byKey("diaper"), [leftFeed])).toBe(false);
  });

  it("a running timer reads Dừng …", () => {
    expect(actionLabel(byKey("breast-left"), [leftFeed])).toBe("Dừng bú trái");
    expect(actionLabel(byKey("breast-right"), [leftFeed])).toBe("Bú phải");
    expect(
      actionLabel(byKey("tummy"), [{ id: "t", type: "tummy", details: {} }]),
    ).toBe("Dừng nằm sấp");
  });
});

describe("shouldAskPumpAmounts", () => {
  const pump = { type: "pump", created_by: "u1" };
  it("asks the owner or the person who started the pump", () => {
    expect(shouldAskPumpAmounts(pump, { role: "owner" }, "u2")).toBe(true);
    expect(shouldAskPumpAmounts(pump, { role: "member" }, "u1")).toBe(true);
  });
  it("does not ask anyone else, nor for other timers", () => {
    expect(shouldAskPumpAmounts(pump, { role: "member" }, "u2")).toBe(false);
    expect(
      shouldAskPumpAmounts(
        { type: "sleep", created_by: "u1" },
        { role: "owner" },
        "u1",
      ),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/quickActions.test.ts`
Expected: FAIL — `Cannot find module './quickActions'`.

- [ ] **Step 3: Viết `lib/rules/quickActions.ts`**

```ts
import type { LogType } from "./logDetails";
import type { InstantType } from "./quickEntry";
import type { RunningLog, TimerButton } from "./timer";

export type QuickAction =
  | {
      key: string;
      label: string;
      kind: "timer";
      category: LogType;
      button: TimerButton;
    }
  | {
      key: string;
      label: string;
      kind: "instant";
      category: LogType;
      instant: InstantType;
    };

// Spec §6.3: 3×3 grid, row by row.
export const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "breast-left",
    label: "Bú trái",
    kind: "timer",
    category: "breast",
    button: { type: "breast", side: "left" },
  },
  {
    key: "breast-right",
    label: "Bú phải",
    kind: "timer",
    category: "breast",
    button: { type: "breast", side: "right" },
  },
  {
    key: "bottle",
    label: "Bú bình",
    kind: "instant",
    category: "bottle",
    instant: "bottle",
  },
  {
    key: "sleep",
    label: "Ngủ",
    kind: "timer",
    category: "sleep",
    button: { type: "sleep" },
  },
  {
    key: "diaper",
    label: "Thay tã",
    kind: "instant",
    category: "diaper",
    instant: "diaper",
  },
  {
    key: "pump",
    label: "Hút sữa",
    kind: "timer",
    category: "pump",
    button: { type: "pump" },
  },
  {
    key: "medicine",
    label: "Thuốc",
    kind: "instant",
    category: "medicine",
    instant: "medicine",
  },
  {
    key: "temperature",
    label: "Nhiệt độ",
    kind: "instant",
    category: "temperature",
    instant: "temperature",
  },
  {
    key: "tummy",
    label: "Nằm sấp",
    kind: "timer",
    category: "tummy",
    button: { type: "tummy" },
  },
];

export function isActionRunning(
  action: QuickAction,
  running: RunningLog[],
): boolean {
  if (action.kind !== "timer") return false;
  const button = action.button;
  return running.some(
    (log) =>
      log.type === button.type &&
      (button.type !== "breast" || log.details.side === button.side),
  );
}

export function actionLabel(
  action: QuickAction,
  running: RunningLog[],
): string {
  return isActionRunning(action, running)
    ? `Dừng ${action.label.toLowerCase()}`
    : action.label;
}

// Only whoever may edit the log is asked for ml (RLS: the owner or the log's creator).
export function shouldAskPumpAmounts(
  log: { type: string; created_by: string },
  member: { role: string },
  userId: string,
): boolean {
  return (
    log.type === "pump" &&
    (member.role === "owner" || log.created_by === userId)
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/quickActions.test.ts`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add lib/rules/quickActions.ts lib/rules/quickActions.test.ts
git commit -m "feat(actions): the nine quick actions and pump prompt rule"
```

---

### Task 3: `QuickActionsProvider` dùng chung

**Files:**

- Create: `components/actions/QuickActions.tsx`, `components/actions/quickactions.test.tsx`

**Interfaces:**

- Consumes: `shouldAskPumpAmounts` (Task 2); `useRecentLogs`, `useTimerPress`, `useStopTimer`, `toRunning` (`lib/data/logs.ts`); `QuickEntrySheet`, `PumpSheet` (`components/home/`).
- Produces: `QuickActionsValue`, `QuickActionsProvider`, `useQuickActions` (chữ ký ở Contracts). Provider vẽ `QuickEntrySheet` (khi `openInstant`) và `PumpSheet` (khi dừng hút sữa và người dùng được phép sửa log) **sau** `children`.

- [ ] **Step 1: Đọc docs**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (phần Context providers).

- [ ] **Step 2: Viết test hỏng**

`components/actions/quickactions.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { QuickActionsProvider, useQuickActions } from "./QuickActions";

const baby = { id: "b1", family_id: "f1", name: "Bun" } as Baby;
const member = {
  role: "owner",
  user_id: "u1",
  display_name: "Ba",
} as FamilyMember;

function Probe() {
  const actions = useQuickActions();
  return (
    <span>
      {[
        typeof actions.pressTimer,
        typeof actions.stopTimer,
        typeof actions.openInstant,
        actions.running.length,
        String(actions.busy),
      ].join(",")}
    </span>
  );
}

describe("QuickActionsProvider", () => {
  it("gives every page the shared timer and quick-entry actions", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <QuickActionsProvider baby={baby} member={member} userId="u1">
          <Probe />
        </QuickActionsProvider>
      </QueryClientProvider>,
    );
    expect(html).toContain("<span>function,function,function,0,false</span>");
    expect(html).not.toContain("<form");
  });

  it("useQuickActions throws outside the provider", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      "useQuickActions must be used inside QuickActionsProvider",
    );
  });
});
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test components/actions/quickactions.test.tsx`
Expected: FAIL — `Cannot find module './QuickActions'`.

- [ ] **Step 4: Viết `components/actions/QuickActions.tsx`**

```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { PumpSheet } from "@/components/home/PumpSheet";
import { QuickEntrySheet } from "@/components/home/QuickEntrySheet";
import {
  toRunning,
  useRecentLogs,
  useStopTimer,
  useTimerPress,
} from "@/lib/data/logs";
import { shouldAskPumpAmounts } from "@/lib/rules/quickActions";
import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
import type { RunningLog, TimerButton } from "@/lib/rules/timer";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";

export type QuickActionsValue = {
  running: RunningLog[];
  busy: boolean;
  error: Error | null;
  pressTimer: (button: TimerButton) => void;
  stopTimer: (log: LogRow) => void;
  openInstant: (type: InstantType, initial?: QuickValues) => void;
};

const QuickActionsContext = createContext<QuickActionsValue | null>(null);

export function QuickActionsProvider({
  baby,
  member,
  userId,
  children,
}: {
  baby: Baby;
  member: FamilyMember;
  userId: string;
  children: ReactNode;
}) {
  const logs = useRecentLogs(baby.id);
  const press = useTimerPress(baby.id, userId);
  const stop = useStopTimer(baby.id, userId);
  const [sheet, setSheet] = useState<{
    type: InstantType;
    initial?: QuickValues;
  } | null>(null);
  // Id of a pumping log that was just stopped: ask for ml (spec gốc §6.13).
  const [pumpStopped, setPumpStopped] = useState<string | null>(null);

  const rows = logs.data ?? [];
  const running = toRunning(rows);

  function askPumpAmounts(log: {
    id: string;
    type: string;
    created_by: string;
  }) {
    if (shouldAskPumpAmounts(log, member, userId)) setPumpStopped(log.id);
  }

  const value: QuickActionsValue = {
    running,
    busy: press.isPending || stop.isPending,
    error: press.error ?? stop.error,
    pressTimer: (button) => {
      // Pressing Hút sữa while it runs stops it, so remember which log to ask ml for.
      const pump =
        button.type === "pump"
          ? rows.find((row) => row.type === "pump" && row.ended_at === null)
          : undefined;
      press.mutate(
        { running, button },
        {
          onSuccess: () => {
            if (pump) askPumpAmounts(pump);
          },
        },
      );
    },
    stopTimer: (log) =>
      stop.mutate(log.id, { onSuccess: () => askPumpAmounts(log) }),
    openInstant: (type, initial) => setSheet({ type, initial }),
  };

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
      {sheet && (
        <QuickEntrySheet
          type={sheet.type}
          initial={sheet.initial}
          recentLogs={rows}
          babyId={baby.id}
          userId={userId}
          onClose={() => setSheet(null)}
        />
      )}
      {pumpStopped && (
        <PumpSheet
          logId={pumpStopped}
          babyId={baby.id}
          userId={userId}
          onClose={() => setPumpStopped(null)}
        />
      )}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions(): QuickActionsValue {
  const value = useContext(QuickActionsContext);
  if (!value)
    throw new Error("useQuickActions must be used inside QuickActionsProvider");
  return value;
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/actions/quickactions.test.tsx lib/themeGuard.test.ts`
Expected: PASS (provider 2, themeGuard 1). Nếu test đầu lỗi vì một module dữ liệu chạm Supabase hoặc IndexedDB lúc import, đừng mock lại cả module: báo rõ lỗi và dừng, vì `useRecentLogs` chỉ gọi mạng trong effect (không chạy khi render phía server).

- [ ] **Step 6: Commit**

```bash
git add components/actions/QuickActions.tsx components/actions/quickactions.test.tsx
git commit -m "feat(actions): shared quick-action provider for timers and quick entry"
```

---

### Task 4: Trang chủ dùng `useQuickActions`

**Files:**

- Modify: `components/home/HomeScreen.tsx` (viết lại toàn file), `components/AuthGate.tsx`

**Interfaces:**

- Consumes: `QuickActionsProvider`, `useQuickActions` (Task 3).
- Produces: `HomeScreen` không còn tự giữ `useTimerPress`, `useStopTimer`, state sheet, state hút sữa; `AuthGate` (trang có bé) bọc nội dung và tab bar trong `QuickActionsProvider`. Hành vi Trang chủ không đổi, trừ một điểm có chủ ý: `busy` giờ là `press.isPending || stop.isPending`, nên lưới nút và nút Dừng cùng khóa khi đang bấm hoặc đang dừng giờ (trước đây khóa riêng).

- [ ] **Step 1: Bọc trang có bé trong provider (`components/AuthGate.tsx`)**

Thêm import:

```tsx
import { QuickActionsProvider } from "@/components/actions/QuickActions";
```

Thay khối cuối của hàm:

```tsx
if (need !== "baby") return <>{content}</>;
return (
  <>
    {session && <SyncBar userId={session.user.id} />}
    <div className="pb-[120px]">{content}</div>
    <TabBar />
  </>
);
```

bằng:

```tsx
if (need !== "baby") return <>{content}</>;
const baby = family.data?.baby;
const member = family.data?.member;
if (!session || !baby || !member)
  return (
    <>
      <div className="pb-[120px]">{content}</div>
      <TabBar />
    </>
  );
return (
  <QuickActionsProvider baby={baby} member={member} userId={session.user.id}>
    <SyncBar userId={session.user.id} />
    <div className="pb-[120px]">{content}</div>
    <TabBar />
  </QuickActionsProvider>
);
```

- [ ] **Step 2: Viết lại `components/home/HomeScreen.tsx`**

Nội dung đầy đủ (bố cục và chữ giữ nguyên; chỉ thay nguồn hành động):

```tsx
"use client";

import { useQuickActions } from "@/components/actions/QuickActions";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import { useFirstLogAt, useRecentLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useNow } from "@/lib/hooks/useNow";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
import type { QuickValues } from "@/lib/rules/quickEntry";
import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
import { homeStatusLines } from "@/lib/rules/status";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { ActionGrid } from "./ActionGrid";
import { AlertBanners } from "./AlertBanners";
import { RecentList } from "./RecentList";
import { RunningCard } from "./RunningCard";
import { StatusLines } from "./StatusLines";
import { SummaryCard } from "./SummaryCard";
import { VitaminDRow } from "./VitaminDRow";

const VITAMIN_D: QuickValues = {
  name: "Vitamin D",
  amount: "1",
  unit: "giọt",
  antipyretic: false,
};

export function HomeScreen({
  baby,
  member,
  userId,
}: {
  baby: Baby;
  member: FamilyMember;
  userId: string;
}) {
  const now = useNow(1000);
  useLogsRealtime(baby.id);
  const logs = useRecentLogs(baby.id);
  const firstLogAt = useFirstLogAt(baby.id);
  const members = useMembers(baby.family_id);
  // Loaded here too so /khan-cap has the family's numbers even when first opened offline.
  useEmergencyContacts(baby.family_id);
  const actions = useQuickActions();
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));

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
  const statusLines = homeStatusLines({
    logs: rows,
    feedIntervalMin: baby.feed_interval_min,
    now,
  });
  const totals = windowTotals(rows, now);
  const vitaminD = vitaminDToday(rows, now);
  const runningRows = rows.filter((row) => row.ended_at === null);
  const recentRows = rows.filter(
    (row) =>
      row.ended_at !== null &&
      Date.parse(row.started_at) >= now.getTime() - WINDOW_MS,
  );
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <AlertBanners alerts={alerts} />

      <header>
        <h1 className="text-2xl font-semibold">{baby.name}</h1>
        <p className="text-muted">
          {formatAgeVi(baby.dob, now)} · Xin chào {member.display_name}
        </p>
      </header>

      <StatusLines lines={statusLines} />

      <ActionGrid
        running={actions.running}
        busy={actions.busy}
        onTimer={actions.pressTimer}
        onInstant={(type) => actions.openInstant(type)}
      />

      {actions.error && (
        <p role="alert" className="text-danger">
          {toVietnameseError(actions.error)}
        </p>
      )}

      {runningRows.map((log) => (
        <RunningCard
          key={log.id}
          log={log}
          who={nameOf(log.created_by)}
          now={now}
          busy={actions.busy}
          onStop={() => actions.stopTimer(log)}
          pending={pending.has(log.id)}
        />
      ))}

      <VitaminDRow
        doneAt={vitaminD}
        onRecord={() => actions.openInstant("medicine", VITAMIN_D)}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">24 giờ qua</h2>
        <SummaryCard ratings={ratings} totals={totals} />
        {logs.isError && !logs.data ? (
          <p className="text-danger">{toVietnameseError(logs.error)}</p>
        ) : (
          <RecentList
            logs={recentRows}
            now={now}
            nameOf={nameOf}
            pending={pending}
          />
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Typecheck, test và build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh (482 có sẵn + 2 của Task 1 + 6 của Task 2 + 2 của Task 3 = 492); build xong.

Run: `grep -n "useTimerPress\|useStopTimer\|QuickEntrySheet\|PumpSheet\|setPumpStopped" components/home/HomeScreen.tsx`
Expected: không có kết quả.

- [ ] **Step 4: Commit**

```bash
git add components/home/HomeScreen.tsx components/AuthGate.tsx
git commit -m "refactor(home): use the shared quick-action provider"
```

---

### Task 5: Bảng 9 hành động và nút "+"

**Files:**

- Create: `components/actions/ActionSheet.tsx`, `components/actions/actionsheet.test.tsx`
- Modify: `components/AuthGate.tsx`

**Interfaces:**

- Consumes: `QUICK_ACTIONS`, `QuickAction`, `isActionRunning`, `actionLabel` (Task 2); `useQuickActions` (Task 3); `Sheet` (`variant="floating"`), `Icon`, `CATEGORIES`, `CategoryToken`, `cx`, `hostElements` (Đợt 1); `TabBar onPlus plusOpen` (Đợt 2 / M1).
- Produces: `QuickActionGrid`, `ActionSheetView`, `ActionSheet` (chữ ký ở Contracts). Chọn ô: đóng bảng trước, rồi `pressTimer(button)` (ô bấm giờ) hoặc `openInstant(type)` (ô ghi nhanh).

- [ ] **Step 1: Viết test hỏng**

`components/actions/actionsheet.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hostElements } from "@/components/ui/testTree";
import { QUICK_ACTIONS } from "@/lib/rules/quickActions";
import type { RunningLog } from "@/lib/rules/timer";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ActionSheetView, QuickActionGrid } from "./ActionSheet";

const leftFeed: RunningLog = {
  id: "l1",
  type: "breast",
  details: { side: "left" },
};

describe("QuickActionGrid", () => {
  it("is a 3×3 grid of 100 pt tiles with category icons", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} />,
    );
    expect(html).toContain("grid grid-cols-3");
    expect(html.match(/<button/g)).toHaveLength(9);
    expect(html).toContain("h-[100px]");
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain(`d="${ICON_PATHS.drop}"`);
    for (const action of QUICK_ACTIONS)
      expect(html).toContain(`>${action.label}</span>`);
  });

  it("badges the five timers with a clock", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[]} onPick={() => {}} />,
    );
    expect(html.split(`d="${ICON_PATHS.clock}"`).length - 1).toBe(5);
    expect(html.split("bấm giờ").length - 1).toBe(5);
  });

  it("a running timer is outlined and reads Dừng …", () => {
    const html = renderToStaticMarkup(
      <QuickActionGrid running={[leftFeed]} onPick={() => {}} />,
    );
    expect(html).toContain(">Dừng bú trái</span>");
    expect(html.split("border-2 border-accent-text").length - 1).toBe(1);
  });

  it("reports the picked action", () => {
    const onPick = vi.fn();
    const buttons = hostElements(
      QuickActionGrid({ running: [], onPick }),
      "button",
    );
    (buttons[4].props.onClick as () => void)();
    expect(onPick).toHaveBeenCalledWith(QUICK_ACTIONS[4]);
    expect(QUICK_ACTIONS[4].label).toBe("Thay tã");
  });
});

describe("ActionSheetView", () => {
  it("is a floating sheet titled for the baby with the clock legend", () => {
    const html = renderToStaticMarkup(
      <ActionSheetView
        open
        babyName="Bun"
        running={[]}
        onClose={() => {}}
        onPick={() => {}}
      />,
    );
    expect(html).toContain(">Ghi lại cho Bun</h2>");
    expect(html).toContain("rounded-[34px]");
    expect(html).not.toContain("data-sheet-handle");
    expect(html).toContain("= bấm giờ");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/actions/actionsheet.test.tsx`
Expected: FAIL — `Cannot find module './ActionSheet'`.

- [ ] **Step 3: Viết `components/actions/ActionSheet.tsx`**

```tsx
"use client";

import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import {
  actionLabel,
  isActionRunning,
  QUICK_ACTIONS,
  type QuickAction,
} from "@/lib/rules/quickActions";
import type { RunningLog } from "@/lib/rules/timer";
import { CATEGORIES, type CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { useQuickActions } from "./QuickActions";

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

export function QuickActionGrid({
  running,
  onPick,
}: {
  running: RunningLog[];
  onPick: (action: QuickAction) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {QUICK_ACTIONS.map((action) => {
        const on = isActionRunning(action, running);
        const category = CATEGORIES[action.category];
        return (
          <button
            key={action.key}
            type="button"
            onClick={() => onPick(action)}
            className={cx(
              "relative flex h-[100px] flex-col items-center justify-center gap-2 rounded-[24px] bg-glass-solid/75 text-ink transition-transform duration-[120ms] active:scale-[0.97]",
              on ? "border-2 border-accent-text" : "border border-edge",
            )}
          >
            {action.kind === "timer" && (
              <span className="absolute top-2 right-2 text-muted">
                <Icon name="clock" size={14} strokeWidth={2.2} />
                <span className="sr-only">, bấm giờ</span>
              </span>
            )}
            <span
              className={cx(
                "flex size-11 items-center justify-center rounded-full",
                TINT[category.token],
              )}
            >
              <Icon name={category.icon} size={22} />
            </span>
            <span className="text-sm font-semibold">
              {actionLabel(action, running)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ActionSheetView({
  open,
  onClose,
  babyName,
  running,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  babyName: string;
  running: RunningLog[];
  onPick: (action: QuickAction) => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Ghi lại cho ${babyName}`}
      variant="floating"
    >
      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <Icon name="clock" size={14} strokeWidth={2.2} />= bấm giờ
      </p>
      <QuickActionGrid running={running} onPick={onPick} />
    </Sheet>
  );
}

export function ActionSheet({
  open,
  onClose,
  babyName,
}: {
  open: boolean;
  onClose: () => void;
  babyName: string;
}) {
  const actions = useQuickActions();
  return (
    <ActionSheetView
      open={open}
      onClose={onClose}
      babyName={babyName}
      running={actions.running}
      onPick={(action) => {
        onClose();
        if (action.kind === "timer") actions.pressTimer(action.button);
        else actions.openInstant(action.instant);
      }}
    />
  );
}
```

Ghi chú: chú thích "= bấm giờ" đặt đầu thân sheet vì góc phải đầu sheet đã có nút "Đóng". Ô có `sr-only` ", bấm giờ" để trình đọc màn hình biết ô nào là bấm giờ (test đếm 5 lần chữ "bấm giờ" trong lưới; chú thích "= bấm giờ" nằm ngoài lưới).

- [ ] **Step 4: Gắn nút "+" trong `components/AuthGate.tsx`**

Thêm import:

```tsx
import { ActionSheet } from "@/components/actions/ActionSheet";
```

Đổi dòng import React thành:

```tsx
import { useEffect, useState, type ReactNode } from "react";
```

Ngay sau dòng `const router = useRouter();` ở đầu hàm `AuthGate`, thêm:

```tsx
// The + button's action sheet (spec §6.3); hooks stay above the early returns.
const [plusOpen, setPlusOpen] = useState(false);
```

Trong khối `return (<QuickActionsProvider …>…)` của Task 4, thay `<TabBar />` bằng:

```tsx
      <TabBar onPlus={() => setPlusOpen((open) => !open)} plusOpen={plusOpen} />
      <ActionSheet open={plusOpen} onClose={() => setPlusOpen(false)} babyName={baby.name} />
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/actions lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (actionsheet 5, quickactions 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/actions/ActionSheet.tsx components/actions/actionsheet.test.tsx components/AuthGate.tsx
git commit -m "feat(actions): + button opens the nine-action sheet on every tab"
```

---

## Kết thúc M2 (Đợt 2)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 497 test xanh (482 + 15), typecheck không lỗi, build xong.
- [ ] Kiểm trên trình duyệt (**không bấm Lưu, không bấm ô bấm giờ** — dev dùng dữ liệu thật): `bun run dev`, mở `http://localhost:3000` (375 px), đăng nhập.
  - Tab bar có nút "+" tròn hồng bên phải. Bấm "+": bảng nổi "Ghi lại cho <tên bé>" hiện phía trên tab bar, lưới 3×3, 5 ô có huy hiệu đồng hồ; tab bar mờ đi và nút đổi thành "×".
  - Bấm vùng tối hoặc nút "Đóng": bảng đóng. Khi bảng mở, tab bar nằm dưới lớp tối nên nút "×" không nhận chạm riêng; chạm vào chỗ "×" vẫn đóng bảng vì trúng lớp tối — đây là đúng thiết kế, không phải lỗi. Mở lại từ tab Nhật ký và Khám phá: giống hệt.
  - Bấm ô "Thay tã": bảng đóng, sheet Thay tã cũ mở; **nút Lưu không bị tab bar che**. Bấm Hủy.
  - Ở Trang chủ, bấm nút "Tã" cũ: sheet mở như trước, Lưu không bị che. Bấm Hủy. Mở Nhật ký → "+ Thêm": sheet sửa log không bị tab bar che. Bấm Hủy.
  - Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.
- [ ] Thêm vào `docs/device-checklist.md` (cuối file) rồi commit `docs: device checklist step 23 for the + button`:

```markdown
## Bước 23 — Nút "+" và bảng 9 hành động (UI đợt 2)

1. Ở mỗi tab (Hôm nay, Nhật ký, Khám phá) bấm nút "+". Kỳ vọng: bảng "Ghi lại cho <tên bé>" nổi trên tab bar, 9 ô, 5 ô có đồng hồ; nút "+" thành "×".
2. Chọn "Bú trái". Kỳ vọng: bảng đóng, timer bú trái chạy (thấy ở Trang chủ). Mở lại "+": ô Bú trái có viền và chữ "Dừng bú trái"; bấm để dừng.
3. Chọn "Hút sữa", đợi vài giây, mở "+" chọn lại để dừng. Kỳ vọng: hiện sheet nhập số ml như khi dừng ở Trang chủ.
4. Chọn "Thay tã" từ tab Nhật ký. Kỳ vọng: sheet Thay tã mở, nút Lưu không bị tab bar che; lưu xong bản ghi hiện ở Nhật ký.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] Bước tiếp theo: plan Đợt 2 / M3 (header Trang chủ, Cài đặt).
