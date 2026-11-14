# Kim Bun UI — Đợt 3 / M3 (Hoàn tác và rung) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Sau khi lưu một bản ghi tức thời hoặc bấm Dừng một timer, hiện Toast "Đã ghi <mô tả> lúc HH:mm" có nút "Hoàn tác" trong 5 giây (spec §7.4). Rung 10 ms khi bấm nút bấm giờ trên máy có `navigator.vibrate`. Thêm checklist bước 26 cho cả Đợt 3.

**Architecture:**

- Quyết định "có Hoàn tác hay không" và chữ trên Toast là hàm thuần trong `lib/rules/undo.ts`, test đủ trường hợp.
- `QuickActionsProvider` (nơi mọi nút bấm giờ, nút Dừng và sheet ghi nhanh đã đi qua) gọi `useToast()` để hiện Toast. Khi bấm Hoàn tác, nó gọi `useDeleteLog` hoặc `useSaveLog` có sẵn. Mọi thao tác vẫn đi qua outbox.
- `useAddInstant` trả về id của bản ghi vừa tạo, để Hoàn tác xóa đúng bản ghi đó.
- Rung là hàm `tapFeedback` trong `lib/ui/haptics.ts`. iOS Safari không có `navigator.vibrate` nên hàm không làm gì.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 3:** M1 (thẻ chính) và M2 (các khối Trang chủ) đã xong trên nhánh `feat/kim-bun-dot3-m2`. **M3 (plan này)** là mốc cuối; xong M3 là xong Đợt 3.

**Khi nào có Hoàn tác (spec §7.4):**

| Thao tác                                                                                                    | Toast                                         | Hoàn tác làm gì                                                          |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| Lưu sheet Bú bình / Thay tã / Thuốc / Nhiệt độ (kể cả Vitamin D)                                            | "Đã ghi <mô tả> lúc <giờ của bản ghi>"        | `useDeleteLog(id vừa tạo)`                                               |
| Dừng ở thẻ chính, hàng timer phụ hoặc nút bấm giờ đang chạy; bấm nút timer đang chạy trong bảng 9 hành động | "Đã ghi <mô tả có thời lượng> lúc <giờ dừng>" | `useSaveLog` đặt `ended_at = null` (giữ `started_at`, `details`, `note`) |
| Bắt đầu timer; "Đổi bên"; bấm nút bấm giờ làm dừng timer khác rồi bắt đầu timer mới                         | Không có                                      | —                                                                        |

- Hoàn tác lỗi: Toast "Không hoàn tác được: <toVietnameseError>".
- Dừng Hút sữa mà sheet hỏi ml mở ra: Toast đợi sheet đóng mới hiện.

**Quyết định cho chỗ spec chưa nói rõ:**

- "<mô tả>" là `describeLog` của bản ghi: bản tức thời như "Bình 90 ml sữa công thức"; timer vừa dừng như "Bú trái · 12 phút".
- "lúc HH:mm": giờ của bản ghi với bản tức thời (có thể là giờ đã chọn lùi lại), giờ dừng với timer.
- Người không có quyền sửa log (không phải chủ nhà, không phải người tạo log) vẫn dừng được timer (`stop_timer`), nhưng RLS `logs_update` không cho đặt lại `ended_at`. Khi đó Toast chỉ có chữ "Đã ghi …", không có nút Hoàn tác (`canResume`).
- Bảng `logs` chỉ cho một timer đang chạy mỗi loại (`logs_one_running_timer`). Nếu lúc bấm Hoàn tác đã có timer cùng loại đang chạy (vd. dừng Bú trái rồi bấm Bú trái lại trong 5 giây), không chạy lại timer cũ mà hiện "Không hoàn tác được: đang có timer cùng loại chạy" (`resumeBlocked`).
- "Không hoàn tác được: …" hiện khi ghi vào outbox lỗi. Nếu máy chủ từ chối sau đó, thông báo "Không lưu được: …" của `SyncBar` hiện như mọi thao tác ghi khác.
- Nút "Dừng" (thẻ chính, hàng timer phụ) không rung vì spec chỉ nói "nút bấm giờ".
- Rung khi gọi `pressTimer`. Lệnh này dùng cho mọi nút bấm giờ: 5 nút tròn, Bú trái / Bú phải / Đổi bên ở thẻ chính, và nút timer trong bảng 9 hành động.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies` (không thêm jsdom hay testing-library; test chạy môi trường `node`).
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- `lib/themeGuard.test.ts` giữ nguyên và phải xanh.
- Logic nghiệp vụ là hàm thuần trong `lib/rules/`, có unit test.
- Mọi ghi dữ liệu vẫn qua outbox (`enqueueLogChange`) bằng các hook có sẵn: `useTimerPress`, `useStopTimer`, `useAddInstant`, `useDeleteLog`, `useSaveLog`, `useSetPumpAmounts`. Không đổi bảng, RLS, outbox.
- Hành vi hiện có phải giữ: dừng Hút sữa vẫn hỏi ml (chỉ người có quyền sửa, `shouldAskPumpAmounts`); lỗi bấm nút vẫn hiện ở `actions.error`.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay, **không bấm** nút bấm giờ, Ghi nhanh, Bú trái, Bú phải, Đổi bên, Dừng, Ghi Vitamin D, và không lưu sheet nào. Hoàn tác chỉ kiểm bằng unit test và checklist trên iPhone thật.
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot3-m2`):

- `components/ui/Toast.tsx`: `ToastProvider` (đã bọc toàn app trong `components/Providers.tsx`), `useToast(): (message: string, action?: { label: string; onAction: () => void }) => void`; `lib/ui/toast.ts`: `TOAST_MS = 5000`.
- `components/actions/QuickActions.tsx`: `QuickActionsProvider({ baby, member, userId, children })`, `useQuickActions()`, `type QuickActionsValue` (giữ nguyên chữ ký).
- `lib/data/logs.ts`: `useTimerPress`, `useStopTimer`, `useAddInstant`, `useDeleteLog(babyId, userId)` (`mutate(id)`), `useSaveLog(babyId, userId)` (`mutate({ id, type, patch })`), `toRunning`, `useRecentLogs`.
- `lib/rules/logForm.ts`: `type LogPatch = { started_at: string; ended_at: string | null; details: Record<string, unknown>; note: string | null }`.
- `lib/rules/timer.ts`: `planTimerPress`, `RunningLog`, `TimerButton`; `lib/rules/describeLog.ts`: `describeLog`, `LogLike`; `lib/rules/time.ts`: `formatVnTime`; `lib/rules/quickActions.ts`: `shouldAskPumpAmounts`; `lib/data/errors.ts`: `toVietnameseError`.
- `components/home/QuickEntrySheet.tsx`, `components/home/PumpSheet.tsx` (giao diện cũ, Đợt 4 làm lại).

**Produces** (Đợt 4 dùng khi làm lại các sheet):

- `lib/rules/undo.ts`: `UNDO_LABEL`, `type StoppedLog`, `type UndoToast`, `savedMessage(log: LogLike, at: Date): string`, `undoFailedMessage(reason: string): string`, `stoppedOnly(running: RunningLog[], button: TimerButton): string | null`, `instantToast(saved: { id: string; type: string; details: Record<string, unknown>; at: Date }): UndoToast`, `stopToast(log: StoppedLog, at: Date): UndoToast`, `resumePatch(log: StoppedLog): LogPatch`, `canResume(log: { created_by: string }, member: { role: string }, userId: string): boolean`, `resumeBlocked(running: RunningLog[], log: { type: string }): boolean`, `RESUME_BLOCKED = "đang có timer cùng loại chạy"`.
- `lib/ui/haptics.ts`: `tapFeedback(nav?: { vibrate?: (pattern: number) => boolean }): void`.
- `lib/data/logs.ts`: `useAddInstant(...).mutate` trả id bản ghi mới (`mutateAsync` resolve `string`; `onSuccess` nhận `id`).
- `components/home/QuickEntrySheet.tsx`: prop mới `onSaved?: (saved: { id: string; type: InstantType; details: Record<string, unknown>; at: Date }) => void`.
- `QuickActionsProvider` cần nằm trong `ToastProvider`.

---

### Task 1: Luật Hoàn tác (`lib/rules/undo.ts`)

**Files:**

- Create: `lib/rules/undo.ts`, `lib/rules/undo.test.ts`

**Interfaces:**

- Consumes: `describeLog`, `LogLike`; `formatVnTime`; `planTimerPress`, `RunningLog`, `TimerButton`; `LogPatch`.
- Produces: các export ở Contracts.

- [ ] **Step 1: Viết test hỏng**

`lib/rules/undo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { RunningLog } from "./timer";
import {
  canResume,
  instantToast,
  RESUME_BLOCKED,
  resumeBlocked,
  resumePatch,
  savedMessage,
  stopToast,
  stoppedOnly,
  UNDO_LABEL,
  undoFailedMessage,
} from "./undo";

const AT = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const left: RunningLog = {
  id: "l1",
  type: "breast",
  details: { side: "left" },
};
const sleep: RunningLog = { id: "s1", type: "sleep", details: {} };
const breastLog = {
  id: "l1",
  type: "breast",
  started_at: "2026-11-14T04:48:00.000Z",
  details: { side: "left" },
  note: "bé bú ngoan",
};

describe("stoppedOnly", () => {
  it("is the timer a press only stops", () => {
    expect(stoppedOnly([left], { type: "breast", side: "left" })).toBe("l1");
    expect(stoppedOnly([sleep, left], { type: "sleep" })).toBe("s1");
  });

  it("is null when the press starts a timer or switches sides", () => {
    expect(stoppedOnly([], { type: "sleep" })).toBeNull();
    expect(stoppedOnly([left], { type: "breast", side: "right" })).toBeNull();
    expect(stoppedOnly([left], { type: "pump" })).toBeNull();
  });
});

describe("undo toasts", () => {
  it("an instant log: describes it at its own time, undo deletes it", () => {
    expect(
      instantToast({
        id: "n1",
        type: "bottle",
        details: { ml: 90, milk: "formula" },
        at: AT,
      }),
    ).toEqual({
      message: "Đã ghi Bình 90 ml sữa công thức lúc 12:00",
      undo: { kind: "delete", id: "n1" },
    });
  });

  it("a stopped timer: describes the duration at the stop time, undo resumes it", () => {
    expect(stopToast(breastLog, AT)).toEqual({
      message: "Đã ghi Bú trái · 12 phút lúc 12:00",
      undo: { kind: "resume", log: breastLog },
    });
  });

  it("resuming clears ended_at and keeps everything else", () => {
    expect(resumePatch(breastLog)).toEqual({
      started_at: "2026-11-14T04:48:00.000Z",
      ended_at: null,
      details: { side: "left" },
      note: "bé bú ngoan",
    });
  });

  it("only the owner or the log's creator can resume a stopped timer", () => {
    expect(canResume({ created_by: "u2" }, { role: "owner" }, "u1")).toBe(true);
    expect(canResume({ created_by: "u1" }, { role: "member" }, "u1")).toBe(true);
    expect(canResume({ created_by: "u2" }, { role: "member" }, "u1")).toBe(false);
  });

  it("cannot resume while a timer of the same type runs", () => {
    expect(resumeBlocked([left], breastLog)).toBe(true);
    expect(resumeBlocked([sleep], breastLog)).toBe(false);
    expect(resumeBlocked([], breastLog)).toBe(false);
    expect(RESUME_BLOCKED).toBe("đang có timer cùng loại chạy");
  });

  it("texts", () => {
    expect(UNDO_LABEL).toBe("Hoàn tác");
    expect(
      savedMessage(
        {
          type: "diaper",
          started_at: AT.toISOString(),
          ended_at: AT.toISOString(),
          details: { wet: true, dirty: false },
        },
        AT,
      ),
    ).toBe("Đã ghi Tã ướt lúc 12:00");
    expect(undoFailedMessage("Mất kết nối")).toBe(
      "Không hoàn tác được: Mất kết nối",
    );
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/undo.test.ts`
Expected: FAIL — `Cannot find module './undo'`.

- [ ] **Step 3: Viết `lib/rules/undo.ts`**

```ts
import { describeLog, type LogLike } from "./describeLog";
import type { LogPatch } from "./logForm";
import { formatVnTime } from "./time";
import { planTimerPress, type RunningLog, type TimerButton } from "./timer";

export const UNDO_LABEL = "Hoàn tác";

export type StoppedLog = {
  id: string;
  type: string;
  started_at: string;
  details: unknown;
  note: string | null;
};

export type UndoToast = {
  message: string;
  undo: { kind: "delete"; id: string } | { kind: "resume"; log: StoppedLog };
};

export function savedMessage(log: LogLike, at: Date): string {
  return `Đã ghi ${describeLog(log, at)} lúc ${formatVnTime(at)}`;
}

export function undoFailedMessage(reason: string): string {
  return `Không hoàn tác được: ${reason}`;
}

// Spec §7.4: Undo follows a press that only stops a timer, never one that
// starts a timer or switches breast sides.
export function stoppedOnly(
  running: RunningLog[],
  button: TimerButton,
): string | null {
  const plan = planTimerPress(running, button);
  return plan.length === 1 && plan[0].kind === "stop" ? plan[0].id : null;
}

export function instantToast(saved: {
  id: string;
  type: string;
  details: Record<string, unknown>;
  at: Date;
}): UndoToast {
  const iso = saved.at.toISOString();
  return {
    message: savedMessage(
      {
        type: saved.type,
        started_at: iso,
        ended_at: iso,
        details: saved.details,
      },
      saved.at,
    ),
    undo: { kind: "delete", id: saved.id },
  };
}

export function stopToast(log: StoppedLog, at: Date): UndoToast {
  return {
    message: savedMessage({ ...log, ended_at: at.toISOString() }, at),
    undo: { kind: "resume", log },
  };
}

// RLS logs_update: only the owner or the log's creator may set ended_at back to null.
export function canResume(
  log: { created_by: string },
  member: { role: string },
  userId: string,
): boolean {
  return member.role === "owner" || log.created_by === userId;
}

export const RESUME_BLOCKED = "đang có timer cùng loại chạy";

// logs_one_running_timer: one running timer per type, so a resume would be refused.
export function resumeBlocked(
  running: RunningLog[],
  log: { type: string },
): boolean {
  return running.some((other) => other.type === log.type);
}

export function resumePatch(log: StoppedLog): LogPatch {
  return {
    started_at: log.started_at,
    ended_at: null,
    details: (log.details ?? {}) as Record<string, unknown>,
    note: log.note,
  };
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/undo.test.ts && bun run typecheck`
Expected: PASS (8 test: `stoppedOnly` 2, undo toasts 6); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/undo.ts lib/rules/undo.test.ts
git commit -m "feat(home): undo rules for the saved-log toast"
```

---

### Task 2: Rung khi bấm giờ (`lib/ui/haptics.ts`)

**Files:**

- Create: `lib/ui/haptics.ts`, `lib/ui/haptics.test.ts`

**Interfaces:**

- Produces: `tapFeedback(nav?: { vibrate?: (pattern: number) => boolean }): void`. Mặc định dùng `navigator` của trình duyệt; khi không có `navigator` (server, test) hoặc không có `vibrate` (iOS Safari) thì không làm gì.

- [ ] **Step 1: Viết test hỏng**

`lib/ui/haptics.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { tapFeedback } from "./haptics";

describe("tapFeedback", () => {
  it("vibrates 10 ms where the browser can", () => {
    const vibrate = vi.fn(() => true);
    tapFeedback({ vibrate });
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it("does nothing without vibrate (iOS Safari) or without a navigator", () => {
    expect(() => tapFeedback({})).not.toThrow();
    expect(() => tapFeedback()).not.toThrow();
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/haptics.test.ts`
Expected: FAIL — `Cannot find module './haptics'`.

- [ ] **Step 3: Viết `lib/ui/haptics.ts`**

```ts
type Vibrator = { vibrate?: (pattern: number) => boolean };

const TAP_MS = 10;

// Spec §7.4: a 10 ms buzz on timer buttons. Safari on iOS has no vibrate, so nothing happens there.
export function tapFeedback(
  nav: Vibrator | undefined = typeof navigator === "undefined"
    ? undefined
    : (navigator as Vibrator),
): void {
  if (typeof nav?.vibrate === "function") nav.vibrate(TAP_MS);
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/ui/haptics.test.ts`
Expected: PASS (2 test). Ghi chú: trong Node, `navigator` hoặc không có (Node 20) hoặc không có `vibrate` (Node 21 trở lên), nên lời gọi `tapFeedback()` không tham số luôn chạy nhánh "không làm gì".

- [ ] **Step 5: Commit**

```bash
git add lib/ui/haptics.ts lib/ui/haptics.test.ts
git commit -m "feat(home): 10 ms tap vibration where supported"
```

---

### Task 3: Nối Hoàn tác và rung vào luồng ghi; checklist bước 26

**Files:**

- Modify: `lib/data/logs.ts` (hàm `useAddInstant`), `components/home/QuickEntrySheet.tsx` (prop `onSaved`, hàm `submit`), `components/actions/QuickActions.tsx` (viết lại toàn file), `components/actions/quickactions.test.tsx` (viết lại toàn file), `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 1 (`instantToast`, `stopToast`, `resumePatch`, `stoppedOnly`, `UNDO_LABEL`, `undoFailedMessage`, `UndoToast`); Task 2 (`tapFeedback`); `useToast`, `ToastProvider`; `useDeleteLog`, `useSaveLog`; `shouldAskPumpAmounts`; `toVietnameseError`.
- Produces: `useAddInstant` trả id; `QuickEntrySheet` có `onSaved`; `QuickActionsProvider` hiện Toast Hoàn tác và rung; phải nằm trong `ToastProvider`.

- [ ] **Step 1: Viết test hỏng**

Ghi đè `components/actions/quickactions.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
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

const withQuery = (node: ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>
);

describe("QuickActionsProvider", () => {
  it("gives every page the shared timer and quick-entry actions", () => {
    const html = renderToStaticMarkup(
      withQuery(
        <ToastProvider>
          <QuickActionsProvider baby={baby} member={member} userId="u1">
            <Probe />
          </QuickActionsProvider>
        </ToastProvider>,
      ),
    );
    expect(html).toContain("<span>function,function,function,0,false</span>");
    expect(html).not.toContain("<form");
  });

  it("shows its Undo toasts, so it needs the ToastProvider", () => {
    expect(() =>
      renderToStaticMarkup(
        withQuery(
          <QuickActionsProvider baby={baby} member={member} userId="u1">
            <Probe />
          </QuickActionsProvider>,
        ),
      ),
    ).toThrow("useToast must be used inside ToastProvider");
  });

  it("useQuickActions throws outside the provider", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      "useQuickActions must be used inside QuickActionsProvider",
    );
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/actions/quickactions.test.tsx`
Expected: FAIL — test "shows its Undo toasts, so it needs the ToastProvider" báo hàm không ném lỗi; 2 test còn lại xanh.

- [ ] **Step 3: `useAddInstant` trả id bản ghi mới**

Trong `lib/data/logs.ts`, thay toàn bộ hàm `useAddInstant` bằng:

```ts
export function useAddInstant(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    // Resolves to the new row's id so the Undo toast can delete exactly that row.
    mutationFn: async ({
      type,
      details,
      at,
    }: {
      type: LogType;
      details: Record<string, unknown>;
      at: Date;
    }): Promise<string> => {
      const iso = at.toISOString();
      const rowId = crypto.randomUUID();
      await enqueueLogChange(queryClient, {
        op: "insert",
        rowId,
        babyId,
        userId,
        row: { type, started_at: iso, ended_at: iso, details },
      });
      return rowId;
    },
  });
}
```

- [ ] **Step 4: `QuickEntrySheet` báo bản ghi vừa lưu**

Trong `components/home/QuickEntrySheet.tsx`:

1. Thêm `onSaved` vào props. Thay khối khai báo props bằng:

```tsx
export function QuickEntrySheet({
  type,
  babyId,
  userId,
  onClose,
  onSaved,
  initial,
  recentLogs = [],
}: {
  type: InstantType;
  babyId: string;
  userId: string;
  onClose: () => void;
  onSaved?: (saved: {
    id: string;
    type: InstantType;
    details: Record<string, unknown>;
    at: Date;
  }) => void;
  initial?: QuickValues;
  recentLogs?: LogRow[];
}) {
```

2. Thay toàn bộ hàm `submit` bằng:

```tsx
function submit(event: FormEvent) {
  event.preventDefault();
  const built = buildDetails(type, values);
  if (!built.ok) {
    setMessage(built.message);
    return;
  }
  const when = fromVnLocalInput(at);
  add.mutate(
    { type, details: built.details, at: when },
    {
      onSuccess: (id) => {
        onSaved?.({ id, type, details: built.details, at: when });
        onClose();
      },
      onError: (e) => setMessage(toVietnameseError(e)),
    },
  );
}
```


- [ ] **Step 5: Viết lại `components/actions/QuickActions.tsx`**

```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PumpSheet } from "@/components/home/PumpSheet";
import { QuickEntrySheet } from "@/components/home/QuickEntrySheet";
import { useToast } from "@/components/ui/Toast";
import { toVietnameseError } from "@/lib/data/errors";
import {
  toRunning,
  useDeleteLog,
  useRecentLogs,
  useSaveLog,
  useStopTimer,
  useTimerPress,
} from "@/lib/data/logs";
import type { LogType } from "@/lib/rules/logDetails";
import { shouldAskPumpAmounts } from "@/lib/rules/quickActions";
import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
import type { RunningLog, TimerButton } from "@/lib/rules/timer";
import {
  canResume,
  instantToast,
  RESUME_BLOCKED,
  resumeBlocked,
  resumePatch,
  stopToast,
  stoppedOnly,
  UNDO_LABEL,
  undoFailedMessage,
  type UndoToast,
} from "@/lib/rules/undo";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { tapFeedback } from "@/lib/ui/haptics";

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
  const remove = useDeleteLog(baby.id, userId);
  const resume = useSaveLog(baby.id, userId);
  const toast = useToast();
  const [sheet, setSheet] = useState<{
    type: InstantType;
    initial?: QuickValues;
  } | null>(null);
  // Id of a pumping log that was just stopped: ask for ml (spec gốc §6.13).
  const [pumpStopped, setPumpStopped] = useState<string | null>(null);
  // Spec §7.4: the Undo toast for that stop waits until the ml sheet closes.
  const [heldToast, setHeldToast] = useState<UndoToast | null>(null);

  const rows = logs.data ?? [];
  const running = toRunning(rows);
  // Timers running when Undo is pressed, which can be later than when the toast appeared.
  const runningNow = useRef(running);
  useEffect(() => {
    runningNow.current = running;
  });

  function showUndo(item: UndoToast) {
    const undo = item.undo;
    toast(item.message, {
      label: UNDO_LABEL,
      onAction: () => {
        const onError = (error: unknown) =>
          toast(undoFailedMessage(toVietnameseError(error)));
        if (undo.kind === "delete") remove.mutate(undo.id, { onError });
        else if (resumeBlocked(runningNow.current, undo.log))
          toast(undoFailedMessage(RESUME_BLOCKED));
        else
          resume.mutate(
            {
              id: undo.log.id,
              type: undo.log.type as LogType,
              patch: resumePatch(undo.log),
            },
            { onError },
          );
      },
    });
  }

  function afterStop(log: LogRow) {
    const item = stopToast(log, new Date());
    if (shouldAskPumpAmounts(log, member, userId)) {
      setPumpStopped(log.id);
      setHeldToast(item);
    } else if (canResume(log, member, userId)) showUndo(item);
    else toast(item.message);
  }

  const value: QuickActionsValue = {
    running,
    busy: press.isPending || stop.isPending,
    error: press.error ?? stop.error,
    pressTimer: (button) => {
      tapFeedback();
      // Undo only when this press just stops a timer (spec §7.4).
      const stoppedId = stoppedOnly(running, button);
      const stopped = rows.find((row) => row.id === stoppedId);
      press.mutate(
        { running, button },
        {
          onSuccess: () => {
            if (stopped) afterStop(stopped);
          },
        },
      );
    },
    stopTimer: (log) =>
      stop.mutate(log.id, { onSuccess: () => afterStop(log) }),
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
          onSaved={(saved) => showUndo(instantToast(saved))}
          onClose={() => setSheet(null)}
        />
      )}
      {pumpStopped && (
        <PumpSheet
          logId={pumpStopped}
          babyId={baby.id}
          userId={userId}
          onClose={() => {
            setPumpStopped(null);
            if (heldToast) {
              showUndo(heldToast);
              setHeldToast(null);
            }
          }}
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

So với bản cũ: Hút sữa vẫn được hỏi ml khi bị dừng bằng nút (khi đó `stoppedOnly` trả id của log Hút sữa đang chạy, rồi `afterStop` gọi `shouldAskPumpAmounts`) hoặc bằng Dừng. Không còn biến `pump` và hàm `askPumpAmounts` riêng.

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components/actions && bun run typecheck`
Expected: PASS (quickactions 3, actionsheet giữ nguyên số test cũ); typecheck không lỗi.

- [ ] **Step 7: Thêm checklist bước 26 vào cuối `docs/device-checklist.md`**

```markdown
## Bước 26 — Trang chủ mới và Hoàn tác (UI đợt 3)

1. Thẻ chính, đủ 4 trạng thái:
   - Bấm "Ngủ". Kỳ vọng: vòng màu tím chạy, đồng hồ "0:05"… tăng từng giây, dòng "<tên> · từ HH:mm", một nút "Dừng" rộng.
   - Bấm "Bú trái". Kỳ vọng: thẻ chính đổi sang bú trái (timer mới nhất), giấc ngủ xuống hàng kính bên dưới có nút "Dừng".
   - Bấm "Đổi bên". Kỳ vọng: thành bú phải, không hiện Toast.
   - Dừng hết. Kỳ vọng: thẻ chính là "Cữ bú tiếp theo" (giờ to, "còn …").
   - Chờ quá giờ dự kiến (hoặc đổi cữ bú ngắn trong Cài đặt). Kỳ vọng: "Trễ cữ bú" viền vàng.
   - Khi không có cữ bú nào trong 12 giờ: "Chưa có cữ bú nào gần đây".
2. Bấm "Dừng" một timer. Kỳ vọng: Toast "Đã ghi … lúc HH:mm" có nút "Hoàn tác" hiện 5 giây phía trên tab bar. Bấm "Hoàn tác". Kỳ vọng: timer chạy tiếp từ giờ cũ.
3. Ghi nhanh "Thay tã" → Lưu. Kỳ vọng: Toast "Đã ghi Tã … lúc HH:mm". Bấm "Hoàn tác". Kỳ vọng: bản ghi biến mất khỏi "Gần đây". Làm lại khi tắt mạng: vẫn hoàn tác được, "N mục chờ đồng bộ" về 0 sau khi có mạng.
4. Bắt đầu một timer. Kỳ vọng: không có Toast.
5. Dừng "Hút sữa" (tài khoản có quyền sửa). Kỳ vọng: sheet hỏi ml mở ra trước; Toast chỉ hiện sau khi đóng sheet. Nếu bấm Hoàn tác lúc này, số ml vừa nhập bị bỏ (lần dừng sau sẽ hỏi lại).
6. Tài khoản thành viên thường dừng timer do người khác bắt đầu. Kỳ vọng: Toast "Đã ghi …" không có nút Hoàn tác.
7. Dừng "Bú trái", bấm "Bú trái" lại ngay, rồi bấm "Hoàn tác" trên Toast cũ. Kỳ vọng: "Không hoàn tác được: đang có timer cùng loại chạy"; chỉ một timer bú trái chạy.
8. Android (nếu có): bấm nút bấm giờ thấy rung nhẹ. iPhone: không rung, không lỗi.
9. "24 giờ qua": 3 ô luôn có số; nhãn "Bình thường" / "Cần chú ý" / "Báo bác sĩ" chỉ khi đã đủ 24 giờ dữ liệu. "Gần đây" tối đa 6 hàng, "Tất cả" mở Nhật ký.
10. Lặp lại mục 1–2 ở theme Sáng, Tối, Ban đêm: chữ rõ, vòng đúng màu (Ban đêm: tông hổ phách).

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 8: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 558 có sẵn + 8 undo + 2 haptics + 1 quickactions = 569. Build xong.

- [ ] **Step 9: Kiểm trên trình duyệt (chỉ nhìn)**

Run: `bun run dev`, mở `http://localhost:3000/` ở bề rộng 375 px, đăng nhập. **Không bấm nút bấm giờ, Ghi nhanh, Bú trái, Bú phải, Đổi bên, Dừng, Ghi Vitamin D; không lưu sheet nào** (dữ liệu thật).
Expected:

- Trang chủ, Nhật ký, Khám phá mở bình thường, không lỗi trong console (nhất là không có "useToast must be used inside ToastProvider").
- Bấm "+" mở bảng 9 hành động; đóng bảng mà không chọn gì.
- Tắt dev server. Hoàn tác và rung được kiểm bằng unit test và checklist bước 26 trên máy thật.

- [ ] **Step 10: Commit**

```bash
git add lib/data/logs.ts components/home/QuickEntrySheet.tsx components/actions/QuickActions.tsx components/actions/quickactions.test.tsx docs/device-checklist.md
git commit -m "feat(home): undo toast after saving or stopping; tap vibration; checklist step 26"
```

---

## Kết thúc M3 (Đợt 3)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 569 test xanh, typecheck không lỗi, build xong.
- [ ] Đợt 3 xong. Bước tiếp theo: lập plan Đợt 4 (Nhập liệu: các sheet theo spec §8).
