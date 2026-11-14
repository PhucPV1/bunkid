# Kim Bun UI — Đợt 3 / M1 (Thẻ chính Trang chủ) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Thay hai dòng trạng thái và các thẻ "đang chạy" ở Trang chủ bằng thẻ chính kiểu iOS (spec §7.2: 4 trạng thái `running` / `overdue` / `next` / `empty`, vòng `TimerRing`, đồng hồ, nút Đổi bên / Dừng / Bú trái / Bú phải) và hàng kính cho timer phụ (spec §7.1 bước 5).

**Architecture:**

- Chọn trạng thái là hàm thuần `heroState` trong `lib/rules/hero.ts`, dùng chung mốc "cữ bú dự kiến" với `homeStatusLines` qua hàm mới `feedDue` trong `lib/rules/status.ts`.
- `sleepStatusLine` được export từ `lib/rules/status.ts`; `homeStatusLines` giữ nguyên kết quả.
- `TimerRing` là component ui không gọi dữ liệu. `HeroCardView` và `TimerRow` không có hook, test bằng `renderToStaticMarkup` và duyệt cây (`findElements`).
- `HomeScreen` chỉ tính trạng thái rồi truyền xuống; bấm nút vẫn đi qua `useQuickActions()` có sẵn (`pressTimer`, `stopTimer`), không đổi luồng ghi.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, Vitest 5 (`react-dom/server`), Bun. Không thêm gói nào.

**Các mốc của Đợt 3 (spec §12: mục 7, `TimerRing`, `heroState`, `sleepStatusLine`, Hoàn tác):**

| Mốc               | Nội dung                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1 (plan này)** | `feedDue`, `sleepStatusLine`, `heroState`, `TimerRing`, thẻ chính, hàng timer phụ, nút Vitamin D chỉ hiện khi chưa uống, dấu "chờ đồng bộ" bằng icon thay emoji   |
| M2                | Banner cảnh báo kiểu mới, dòng đồng bộ dạng viên thuốc, 5 nút bấm giờ tròn 58, lưới Ghi nhanh 2×2, 3 `StatTile` 24 giờ (mục 7.3), thẻ Gần đây; bỏ `ActionGrid` cũ |
| M3                | Hoàn tác (mục 7.4) cho bản ghi tức thời và khi Dừng timer; rung 10 ms trên Android; checklist bước 26                                                             |

**Quyết định cho chỗ spec chưa nói rõ (ghi lại để reviewer và người làm biết):**

- `TimerRing` (spec §5: "vòng 200, nét 12, màu loại sự kiện đầy vòng, nền vòng màu đó 12%"): cung màu loại chạy đầy một vòng mỗi 60 phút (`ringProgress`), nền vòng là màu đó ở độ đục 12%.
- Đồng hồ trong vòng: "M:SS" dưới 1 giờ, "H:MM:SS" từ 1 giờ. Cỡ 48/52 khi chuỗi dài ≤ 5 ký tự, 38/44 khi dài hơn để vừa lòng vòng (đường kính trong 176).
- Số phút trễ và "còn N phút": dưới 60 là "25 phút", từ 60 là "1 giờ 05 phút" (`formatMinutes`). Số trễ cỡ 48 khi dưới 60 phút, 38 khi từ 60 phút.
- Trạng thái `next` không có nút (spec không ghi nút).

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI; icon dùng `components/ui/Icon.tsx`.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Logic nghiệp vụ là hàm thuần trong `lib/rules/`, có unit test. Component trong `components/ui/` không gọi dữ liệu, chỉ nhận props.
- Không đổi luồng ghi dữ liệu: bấm giờ và dừng vẫn qua `useQuickActions()` (`pressTimer`, `stopTimer`) → outbox như hiện nay. Không đổi bảng, RLS, outbox.
- `homeStatusLines` giữ nguyên kết quả (test cũ của nó phải xanh không sửa).
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`. Mọi giờ và số đo dùng `tabular-nums`.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay, **không bấm** Bú trái, Bú phải, Đổi bên, Dừng, nút bấm giờ, Ghi Vitamin D, và không lưu sheet nào. Chỉ nhìn.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot2-m4`):

- `components/ui/`: `Glass` (`strong? radius? as? className`), `Button` (`variant` primary/secondary/ghost/danger, `size` md/lg, `block`, `busy`, mọi thuộc tính `<button>`), `Icon` (`name size strokeWidth filled className`); `components/ui/testTree.ts` (`findElements`, `type TreeProps`).
- `lib/ui/categories.ts`: `CATEGORIES: Record<LogType, { token: CategoryToken; icon: IconName; label: string }>`, `type CategoryToken`.
- `lib/rules/describeLog.ts`: `type LogLike`; `lib/rules/time.ts`: `formatVnTime`, `formatDuration`; `lib/rules/timer.ts`: `type TimerButton`; `lib/rules/logDetails.ts`: `type LogType`; `lib/rules/alerts.ts`: `vitaminDToday` (trả "HH:mm" hoặc `null`).
- `components/actions/QuickActions.tsx`: `useQuickActions(): { running; busy; error; pressTimer(button); stopTimer(log); openInstant(type, initial?) }`.
- `components/home/HomeHeader.tsx` (Đợt 2 / M3).

**Produces** (M2, M3 dùng):

- `lib/rules/status.ts`: `feedDue(logs: LogLike[], feedIntervalMin: number, now: Date): Date | null`, `sleepStatusLine(logs: LogLike[], now: Date): string | null`.
- `lib/rules/hero.ts`: `type HeroState<T extends LogLike>`, `heroState<T extends LogLike>(input: { logs: T[]; feedIntervalMin: number; now: Date }): HeroState<T>`, `timerLabel(log: { type: string; details: unknown }): string`, `formatClock(ms: number): string`, `formatMinutes(minutes: number): string`, `ringProgress(ms: number): number`.
- `lib/ui/categories.ts`: `CATEGORY_CHIP: Record<CategoryToken, string>` (nền màu loại 15% + chữ màu loại).
- `components/ui/TimerRing.tsx`: `TimerRing({ token, progress, children })`, `RING_CIRCUMFERENCE`.
- `components/home/HeroCard.tsx`: `HeroCardView({ state, now, who, sub, pending, busy, onTimer, onStop })`.
- `components/home/TimerRow.tsx`: `TimerRow({ log, who, now, busy, pending, onStop })`.
- `components/home/VitaminDButton.tsx`: `VitaminDButton({ onRecord })` (thay `VitaminDRow`).
- `components/sync/PendingMark.tsx`: cùng chữ ký, vẽ icon `clock` thay emoji.
- Xóa: `components/home/RunningCard.tsx`, `components/home/StatusLines.tsx`, `components/home/VitaminDRow.tsx`.

---

### Task 1: `feedDue` và `sleepStatusLine`

**Files:**

- Modify: `lib/rules/status.ts` (viết lại toàn file), `lib/rules/status.test.ts`

**Interfaces:**

- Consumes: `LogLike` (`lib/rules/describeLog.ts`), `formatDuration`, `formatVnTime` (`lib/rules/time.ts`).
- Produces: `feedDue`, `sleepStatusLine` (chữ ký ở Contracts); `homeStatusLines` không đổi kết quả.

- [ ] **Step 1: Viết test hỏng**

Trong `lib/rules/status.test.ts`, đổi dòng import thành:

```ts
import { feedDue, homeStatusLines, sleepStatusLine } from "@/lib/rules/status";
```

Thêm cuối file:

```ts
describe("sleepStatusLine", () => {
  it("is the sleep line of homeStatusLines", () => {
    expect(sleepStatusLine([log("sleep", 2, 0.75)], NOW)).toBe(
      "Bé đã thức 45 phút",
    );
    expect(sleepStatusLine([log("sleep", 1.5, null)], NOW)).toBe(
      "Bé đang ngủ 1 giờ 30 phút",
    );
    expect(sleepStatusLine([log("sleep", 14, 13)], NOW)).toBeNull();
    expect(sleepStatusLine([bottle(1)], NOW)).toBeNull();
  });
});

describe("feedDue", () => {
  it("is the last feed start plus the interval, unless that feed is older than 12 hours", () => {
    expect(feedDue([bottle(2), bottle(1)], 180, NOW)?.toISOString()).toBe(
      "2026-11-14T07:00:00.000Z",
    );
    expect(feedDue([bottle(12)], 180, NOW)?.toISOString()).toBe(
      "2026-11-13T20:00:00.000Z",
    );
    expect(feedDue([bottle(12.01)], 180, NOW)).toBeNull();
    expect(feedDue([log("sleep", 1, 0.5)], 180, NOW)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/status.test.ts`
Expected: FAIL — `feedDue is not a function` (hoặc `sleepStatusLine is not a function`); 5 test cũ của `homeStatusLines` vẫn xanh.

- [ ] **Step 3: Viết lại `lib/rules/status.ts`**

```ts
import type { LogLike } from "./describeLog";
import { formatDuration, formatVnTime } from "./time";

const STALE_MS = 12 * 3_600_000;
const ms = (iso: string) => Date.parse(iso);

function latestBy(
  logs: LogLike[],
  key: (log: LogLike) => number,
): LogLike | null {
  let best: LogLike | null = null;
  for (const log of logs) if (!best || key(log) > key(best)) best = log;
  return best;
}

// When the next feed is expected: last feed start (breast or bottle) plus the interval.
// null when there is no feed in the last 12 hours.
export function feedDue(
  logs: LogLike[],
  feedIntervalMin: number,
  now: Date,
): Date | null {
  const feeds = logs.filter((l) => l.type === "breast" || l.type === "bottle");
  const last = latestBy(feeds, (l) => ms(l.started_at));
  if (!last || now.getTime() - ms(last.started_at) > STALE_MS) return null;
  return new Date(ms(last.started_at) + feedIntervalMin * 60_000);
}

function feedLine(
  logs: LogLike[],
  feedIntervalMin: number,
  now: Date,
): string | null {
  if (logs.some((l) => l.type === "breast" && l.ended_at === null))
    return "Đang bú";
  const due = feedDue(logs, feedIntervalMin, now);
  if (!due) return null;
  return now.getTime() >= due.getTime()
    ? `Đã đến giờ bú (từ ${formatVnTime(due)})`
    : `Cữ bú tiếp theo khoảng ${formatVnTime(due)}`;
}

export function sleepStatusLine(logs: LogLike[], now: Date): string | null {
  const sleeps = logs.filter((l) => l.type === "sleep");
  const running = sleeps.find((l) => l.ended_at === null);
  if (running)
    return `Bé đang ngủ ${formatDuration(now.getTime() - ms(running.started_at))}`;
  const last = latestBy(sleeps, (l) => ms(l.ended_at as string));
  if (!last || now.getTime() - ms(last.ended_at as string) > STALE_MS)
    return null;
  return `Bé đã thức ${formatDuration(now.getTime() - ms(last.ended_at as string))}`;
}

export function homeStatusLines(input: {
  logs: LogLike[];
  feedIntervalMin: number;
  now: Date;
}): string[] {
  const { logs, feedIntervalMin, now } = input;
  return [
    feedLine(logs, feedIntervalMin, now),
    sleepStatusLine(logs, now),
  ].filter((line): line is string => line !== null);
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/status.test.ts`
Expected: PASS (7 test: 5 cũ + `sleepStatusLine` + `feedDue`).

- [ ] **Step 5: Commit**

```bash
git add lib/rules/status.ts lib/rules/status.test.ts
git commit -m "feat(home): export feedDue and sleepStatusLine"
```

---

### Task 2: `heroState` và các hàm định dạng của thẻ chính

**Files:**

- Create: `lib/rules/hero.ts`, `lib/rules/hero.test.ts`

**Interfaces:**

- Consumes: `feedDue` (Task 1); `LogLike`.
- Produces: `HeroState<T>`, `heroState`, `timerLabel`, `formatClock`, `formatMinutes`, `ringProgress` (chữ ký ở Contracts).

Spec §7.2: `running` khi có timer đang chạy (lấy timer có `started_at` muộn nhất); không thì `overdue` khi cữ bú gần nhất trong 12 giờ và `now` ≥ giờ dự kiến; `next` khi chưa đến giờ; `empty` khi không có cữ bú trong 12 giờ. Biên 12 giờ giống `homeStatusLines` (đúng 12 giờ vẫn tính).

- [ ] **Step 1: Viết test hỏng**

`lib/rules/hero.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import {
  formatClock,
  formatMinutes,
  heroState,
  ringProgress,
  timerLabel,
} from "./hero";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (
  type: string,
  start: number,
  end: number | null,
  details: unknown = {},
): LogLike => ({
  type,
  started_at: ago(start),
  ended_at: end === null ? null : ago(end),
  details,
});
const bottle = (h: number) => log("bottle", h, h, { ml: 90, milk: "formula" });
const state = (logs: LogLike[]) =>
  heroState({ logs, feedIntervalMin: 180, now: NOW });

describe("heroState", () => {
  it("running: the timer that started last wins", () => {
    const sleep = log("sleep", 2, null);
    const breast = log("breast", 0.5, null, { side: "left" });
    expect(state([sleep, breast, bottle(1)])).toEqual({
      kind: "running",
      log: breast,
    });
  });

  it("running beats an overdue feed", () => {
    const tummy = log("tummy", 0.1, null);
    expect(state([bottle(5), tummy])).toEqual({ kind: "running", log: tummy });
  });

  it("next: before the expected feed time", () => {
    expect(state([bottle(1)])).toEqual({
      kind: "next",
      due: new Date("2026-11-14T07:00:00Z"),
      minutesLeft: 120,
    });
    expect(state([log("breast", 1, 0.5, { side: "right" })])).toEqual({
      kind: "next",
      due: new Date("2026-11-14T07:00:00Z"),
      minutesLeft: 120,
    });
  });

  it("overdue: at or after the expected feed time", () => {
    expect(state([bottle(3)])).toEqual({
      kind: "overdue",
      due: new Date("2026-11-14T05:00:00Z"),
      lateMinutes: 0,
    });
    expect(state([bottle(3.5)])).toEqual({
      kind: "overdue",
      due: new Date("2026-11-14T04:30:00Z"),
      lateMinutes: 30,
    });
  });

  it("empty: no feed in the last 12 hours", () => {
    expect(state([])).toEqual({ kind: "empty" });
    expect(state([bottle(12.5), log("sleep", 3, 1)])).toEqual({
      kind: "empty",
    });
  });

  it("a feed exactly 12 hours old still counts", () => {
    expect(state([bottle(12)]).kind).toBe("overdue");
  });
});

describe("hero text helpers", () => {
  it("timerLabel names each timer", () => {
    expect(timerLabel(log("breast", 1, null, { side: "left" }))).toBe(
      "Bú trái",
    );
    expect(timerLabel(log("breast", 1, null, { side: "right" }))).toBe(
      "Bú phải",
    );
    expect(timerLabel(log("sleep", 1, null))).toBe("Ngủ");
    expect(timerLabel(log("pump", 1, null))).toBe("Hút sữa");
    expect(timerLabel(log("tummy", 1, null))).toBe("Nằm sấp");
  });

  it("formatClock shows M:SS, then H:MM:SS from one hour", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65_000)).toBe("1:05");
    expect(formatClock(59 * 60_000 + 59_999)).toBe("59:59");
    expect(formatClock(3_725_000)).toBe("1:02:05");
    expect(formatClock(-5_000)).toBe("0:00");
  });

  it("formatMinutes switches to hours from 60 minutes", () => {
    expect(formatMinutes(0)).toBe("0 phút");
    expect(formatMinutes(25)).toBe("25 phút");
    expect(formatMinutes(60)).toBe("1 giờ 00 phút");
    expect(formatMinutes(125)).toBe("2 giờ 05 phút");
  });

  it("ringProgress fills the ring once an hour", () => {
    expect(ringProgress(0)).toBe(0);
    expect(ringProgress(15 * 60_000)).toBe(0.25);
    expect(ringProgress(75 * 60_000)).toBe(0.25);
    expect(ringProgress(-1_000)).toBe(0);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/hero.test.ts`
Expected: FAIL — `Cannot find module './hero'`.

- [ ] **Step 3: Viết `lib/rules/hero.ts`**

```ts
import type { LogLike } from "./describeLog";
import { feedDue } from "./status";

export type HeroState<T extends LogLike> =
  | { kind: "running"; log: T }
  | { kind: "overdue"; due: Date; lateMinutes: number }
  | { kind: "next"; due: Date; minutesLeft: number }
  | { kind: "empty" };

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

// Spec §7.2: which state the home hero card shows.
export function heroState<T extends LogLike>(input: {
  logs: T[];
  feedIntervalMin: number;
  now: Date;
}): HeroState<T> {
  const { logs, feedIntervalMin, now } = input;
  let running: T | null = null;
  for (const log of logs)
    if (
      log.ended_at === null &&
      (!running || Date.parse(log.started_at) > Date.parse(running.started_at))
    )
      running = log;
  if (running) return { kind: "running", log: running };
  const due = feedDue(logs, feedIntervalMin, now);
  if (!due) return { kind: "empty" };
  const diff = now.getTime() - due.getTime();
  return diff >= 0
    ? { kind: "overdue", due, lateMinutes: Math.floor(diff / MINUTE_MS) }
    : { kind: "next", due, minutesLeft: Math.ceil(-diff / MINUTE_MS) };
}

const TIMER_LABEL: Record<string, string> = {
  sleep: "Ngủ",
  pump: "Hút sữa",
  tummy: "Nằm sấp",
};

export function timerLabel(log: { type: string; details: unknown }): string {
  if (log.type === "breast") {
    const side = (log.details as { side?: unknown } | null)?.side;
    return side === "left" ? "Bú trái" : "Bú phải";
  }
  return TIMER_LABEL[log.type] ?? "Đang chạy";
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  return `${Math.floor(minutes / 60)} giờ ${String(minutes % 60).padStart(2, "0")} phút`;
}

// The ring fills once every 60 minutes, then starts again.
export function ringProgress(ms: number): number {
  return (Math.max(0, ms) % HOUR_MS) / HOUR_MS;
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/hero.test.ts`
Expected: PASS (10 test: `heroState` 6, helpers 4).

- [ ] **Step 5: Commit**

```bash
git add lib/rules/hero.ts lib/rules/hero.test.ts
git commit -m "feat(home): heroState picks the hero card state"
```

---

### Task 3: `TimerRing` và bảng màu chip loại sự kiện

**Files:**

- Create: `components/ui/TimerRing.tsx`, `components/ui/timerring.test.tsx`
- Modify: `lib/ui/categories.ts` (thêm `CATEGORY_CHIP`)

**Interfaces:**

- Consumes: `CategoryToken` (`lib/ui/categories.ts`), `cx` (`lib/ui/cx.ts`).
- Produces: `TimerRing({ token: CategoryToken; progress: number; children: ReactNode })`, `RING_CIRCUMFERENCE: number`, `CATEGORY_CHIP: Record<CategoryToken, string>`.

Spec §5: vòng 200, nét 12, cung màu loại, nền vòng màu đó 12%. `progress` từ 0 đến 1 (ngoài khoảng thì kẹp lại).

- [ ] **Step 1: Viết test hỏng**

`components/ui/timerring.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CATEGORY_CHIP } from "@/lib/ui/categories";
import { RING_CIRCUMFERENCE, TimerRing } from "./TimerRing";

describe("TimerRing", () => {
  it("draws a 200 px ring in the category colour over a 12% track", () => {
    const html = renderToStaticMarkup(
      <TimerRing token="cat-sleep" progress={0.25}>
        <span>12:00</span>
      </TimerRing>,
    );
    expect(html).toContain('width="200"');
    expect(html.match(/<circle/g)).toHaveLength(2);
    expect(html).toContain('stroke-width="12"');
    expect(html).toContain("stroke-cat-sleep/12");
    expect(html).toContain('class="stroke-cat-sleep"');
    expect(html).toContain(`stroke-dasharray="${RING_CIRCUMFERENCE}"`);
    expect(html).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE * 0.75}"`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<span>12:00</span>");
  });

  it("clamps progress to the ring", () => {
    const full = renderToStaticMarkup(
      <TimerRing token="cat-feed" progress={2}>
        x
      </TimerRing>,
    );
    expect(full).toContain('stroke-dashoffset="0"');
    const none = renderToStaticMarkup(
      <TimerRing token="cat-feed" progress={-1}>
        x
      </TimerRing>,
    );
    expect(none).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE}"`);
  });
});

describe("CATEGORY_CHIP", () => {
  it("tints every category with its own colour", () => {
    expect(CATEGORY_CHIP["cat-feed"]).toBe("bg-cat-feed/15 text-cat-feed");
    expect(Object.keys(CATEGORY_CHIP)).toHaveLength(8);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/ui/timerring.test.tsx`
Expected: FAIL — `Cannot find module './TimerRing'` (và `CATEGORY_CHIP` chưa có).

- [ ] **Step 3: Thêm `CATEGORY_CHIP` vào cuối `lib/ui/categories.ts`**

```ts
// Chip behind a category icon: the category colour at 15% under the icon in full colour.
export const CATEGORY_CHIP: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed/15 text-cat-feed",
  "cat-bottle": "bg-cat-bottle/15 text-cat-bottle",
  "cat-sleep": "bg-cat-sleep/15 text-cat-sleep",
  "cat-diaper": "bg-cat-diaper/15 text-cat-diaper",
  "cat-pump": "bg-cat-pump/15 text-cat-pump",
  "cat-tummy": "bg-cat-tummy/15 text-cat-tummy",
  "cat-med": "bg-cat-med/15 text-cat-med",
  "cat-temp": "bg-cat-temp/15 text-cat-temp",
};
```

- [ ] **Step 4: Viết `components/ui/TimerRing.tsx`**

```tsx
import type { ReactNode } from "react";
import type { CategoryToken } from "@/lib/ui/categories";

const RING: Record<CategoryToken, { arc: string; track: string }> = {
  "cat-feed": { arc: "stroke-cat-feed", track: "stroke-cat-feed/12" },
  "cat-bottle": { arc: "stroke-cat-bottle", track: "stroke-cat-bottle/12" },
  "cat-sleep": { arc: "stroke-cat-sleep", track: "stroke-cat-sleep/12" },
  "cat-diaper": { arc: "stroke-cat-diaper", track: "stroke-cat-diaper/12" },
  "cat-pump": { arc: "stroke-cat-pump", track: "stroke-cat-pump/12" },
  "cat-tummy": { arc: "stroke-cat-tummy", track: "stroke-cat-tummy/12" },
  "cat-med": { arc: "stroke-cat-med", track: "stroke-cat-med/12" },
  "cat-temp": { arc: "stroke-cat-temp", track: "stroke-cat-temp/12" },
};

const SIZE = 200;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({
  token,
  progress,
  children,
}: {
  token: CategoryToken;
  progress: number;
  children: ReactNode;
}) {
  const filled = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative size-[200px] shrink-0">
      <svg
        aria-hidden="true"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className={RING[token].track}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - filled)}
          className={RING[token].arc}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/ui/timerring.test.tsx lib/themeGuard.test.ts`
Expected: PASS (TimerRing 2, CATEGORY_CHIP 1, themeGuard 1).

- [ ] **Step 6: Commit**

```bash
git add components/ui/TimerRing.tsx components/ui/timerring.test.tsx lib/ui/categories.ts
git commit -m "feat(ui): TimerRing and shared category chip colours"
```

---

### Task 4: Thẻ chính `HeroCardView` và dấu chờ đồng bộ bằng icon

**Files:**

- Create: `components/home/HeroCard.tsx`, `components/home/herocard.test.tsx`
- Modify: `components/sync/PendingMark.tsx` (viết lại toàn file)

**Interfaces:**

- Consumes: `HeroState`, `timerLabel`, `formatClock`, `formatMinutes`, `ringProgress` (Task 2); `TimerRing`, `RING_CIRCUMFERENCE` (Task 3); `Glass`, `Button`, `Icon`; `CATEGORIES`; `formatVnTime`; `TimerButton`; `LogRow`; `findElements`.
- Produces: `HeroCardView({ state: HeroState<LogRow>; now: Date; who: string; sub: string | null; pending: boolean; busy: boolean; onTimer: (button: TimerButton) => void; onStop: (log: LogRow) => void })`; `PendingMark({ pending })` vẽ icon `clock`.

Spec §7.2:

| Trạng thái | Hiển thị                                                                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `running`  | `TimerRing` màu loại; trong vòng: nhãn loại chữ hoa 13/600, đồng hồ, "<người> · từ HH:mm". Bú mẹ: nút "Đổi bên" (`secondary`, bấm = bấm nút bên còn lại) và "Dừng" (`primary`); loại khác chỉ "Dừng" rộng hết |
| `overdue`  | Viền thẻ và nhãn `--color-warn`; nhãn "TRỄ CỮ BÚ", số phút trễ cỡ 48, dòng "Dự kiến lúc HH:mm"; nút "Bú trái", "Bú phải"                                                                                      |
| `next`     | Nhãn "CỮ BÚ TIẾP THEO", giờ dự kiến cỡ 48, dòng "còn N phút"                                                                                                                                                  |
| `empty`    | "Chưa có cữ bú nào gần đây" + nút "Bú trái", "Bú phải"                                                                                                                                                        |

Dòng phụ `sub` (đã nối sẵn bằng " · " ở `HomeScreen`) hiện dưới cùng ở mọi trạng thái khi khác `null`. Thẻ bo 32, bóng `0 10px 40px` độ đục 0.10 (Sáng) / 0.40 (Tối), Ban đêm không bóng (spec §4.3). Nhãn chữ hoa dùng class `uppercase`.

- [ ] **Step 1: Viết test hỏng**

`components/home/herocard.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PendingMark } from "@/components/sync/PendingMark";
import { RING_CIRCUMFERENCE } from "@/components/ui/TimerRing";
import { findElements } from "@/components/ui/testTree";
import type { HeroState } from "@/lib/rules/hero";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { HeroCardView } from "./HeroCard";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const row = (over: Partial<LogRow>): LogRow =>
  ({
    id: "l1",
    baby_id: "b1",
    type: "breast",
    started_at: "2026-11-14T04:30:00.000Z",
    ended_at: null,
    details: { side: "left" },
    note: null,
    created_by: "u1",
    created_at: "2026-11-14T04:30:00.000Z",
    updated_at: "2026-11-14T04:30:00.000Z",
    ...over,
  }) as LogRow;

const props = (
  state: HeroState<LogRow>,
  over: Partial<Parameters<typeof HeroCardView>[0]> = {},
) => ({
  state,
  now: NOW,
  who: "Mẹ",
  sub: null,
  pending: false,
  busy: false,
  onTimer: () => {},
  onStop: () => {},
  ...over,
});
const html = (p: Parameters<typeof HeroCardView>[0]) =>
  renderToStaticMarkup(<HeroCardView {...p} />);
const byText = (p: Parameters<typeof HeroCardView>[0], text: string) =>
  findElements(HeroCardView(p), (el) => el.props.children === text);

describe("HeroCardView running", () => {
  const breast = row({});

  it("shows the ring, label, clock and who started it", () => {
    const out = html(props({ kind: "running", log: breast }));
    expect(out).toContain("stroke-cat-feed");
    expect(out).toContain(`stroke-dashoffset="${RING_CIRCUMFERENCE * 0.5}"`);
    expect(out).toContain(">Bú trái");
    expect(out).toContain("uppercase");
    expect(out).toContain(">30:00</span>");
    expect(out).toContain(">Mẹ · từ 11:30</span>");
    expect(out).toContain(">Đổi bên</button>");
    expect(out).toContain(">Dừng</button>");
    expect(out).toContain("rounded-[32px]");
  });

  it("Đổi bên presses the other side, Dừng stops this log", () => {
    const onTimer = vi.fn();
    const onStop = vi.fn();
    const p = props({ kind: "running", log: breast }, { onTimer, onStop });
    (byText(p, "Đổi bên")[0].props.onClick as () => void)();
    expect(onTimer).toHaveBeenCalledWith({ type: "breast", side: "right" });
    (byText(p, "Dừng")[0].props.onClick as () => void)();
    expect(onStop).toHaveBeenCalledWith(breast);
  });

  it("other timers get one full-width Dừng and a smaller clock after an hour", () => {
    const sleep = row({
      type: "sleep",
      details: {},
      started_at: "2026-11-14T03:57:55.000Z",
    });
    const out = html(props({ kind: "running", log: sleep }));
    expect(out).toContain("stroke-cat-sleep");
    expect(out).toContain(">Ngủ");
    expect(out).toContain(">1:02:05</span>");
    expect(out).toContain("text-[38px]");
    expect(out).not.toContain("Đổi bên");
    expect(out.match(/<button/g)).toHaveLength(1);
    expect(out).toContain("w-full");
  });
});

describe("HeroCardView feed states", () => {
  it("overdue: warn border and label, minutes late, expected time, two feed buttons", () => {
    const onTimer = vi.fn();
    const p = props(
      {
        kind: "overdue",
        due: new Date("2026-11-14T04:35:00Z"),
        lateMinutes: 25,
      },
      { onTimer },
    );
    const out = html(p);
    expect(out).toContain("border-warn!");
    expect(out).toContain("text-warn");
    expect(out).toContain(">Trễ cữ bú</span>");
    expect(out).toContain(">25 phút</span>");
    expect(out).toContain(">Dự kiến lúc 11:35</span>");
    expect(out).toContain(">Bú trái</button>");
    (byText(p, "Bú phải")[0].props.onClick as () => void)();
    expect(onTimer).toHaveBeenCalledWith({ type: "breast", side: "right" });
  });

  it("next: expected time large, time left, no buttons", () => {
    const out = html(
      props({
        kind: "next",
        due: new Date("2026-11-14T07:00:00Z"),
        minutesLeft: 120,
      }),
    );
    expect(out).toContain(">Cữ bú tiếp theo</span>");
    expect(out).toContain(">14:00</span>");
    expect(out).toContain(">còn 2 giờ 00 phút</span>");
    expect(out).not.toContain("<button");
  });

  it("empty: a sentence, two feed buttons and the sub line", () => {
    const out = html(
      props(
        { kind: "empty" },
        { sub: "Bé đã thức 45 phút · Vitamin D đã uống 08:10" },
      ),
    );
    expect(out).toContain(">Chưa có cữ bú nào gần đây</span>");
    expect(out).toContain(">Bú phải</button>");
    expect(out).toContain(">Bé đã thức 45 phút · Vitamin D đã uống 08:10</p>");
  });

  it("busy disables every button", () => {
    const out = html(props({ kind: "empty" }, { busy: true }));
    expect(out.match(/disabled=""/g)).toHaveLength(2);
  });
});

describe("PendingMark", () => {
  it("is a clock icon, not an emoji", () => {
    const out = renderToStaticMarkup(<PendingMark pending />);
    expect(out).toContain('aria-label="Chờ đồng bộ"');
    expect(out).toContain(`d="${ICON_PATHS.clock}"`);
    expect(out).not.toContain("⏳");
    expect(renderToStaticMarkup(<PendingMark pending={false} />)).toBe("");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/herocard.test.tsx`
Expected: FAIL — `Cannot find module './HeroCard'`.

- [ ] **Step 3: Viết lại `components/sync/PendingMark.tsx`**

```tsx
import { Icon } from "@/components/ui/Icon";

export function PendingMark({ pending }: { pending: boolean }) {
  if (!pending) return null;
  return (
    <span
      role="img"
      aria-label="Chờ đồng bộ"
      title="Chờ đồng bộ"
      className="inline-flex align-middle text-muted"
    >
      <Icon name="clock" size={14} />
    </span>
  );
}
```

- [ ] **Step 4: Viết `components/home/HeroCard.tsx`**

```tsx
import type { ReactNode } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { TimerRing } from "@/components/ui/TimerRing";
import {
  formatClock,
  formatMinutes,
  ringProgress,
  timerLabel,
  type HeroState,
} from "@/lib/rules/hero";
import type { LogType } from "@/lib/rules/logDetails";
import type { TimerButton } from "@/lib/rules/timer";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

const LABEL =
  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] uppercase";
const BIG =
  "text-[48px] leading-[52px] font-semibold tracking-[-0.02em] text-ink tabular-nums";
const BIG_LONG =
  "text-[38px] leading-[44px] font-semibold tracking-[-0.02em] text-ink tabular-nums";
const META = "text-[15px] text-muted tabular-nums";
const LEFT: TimerButton = { type: "breast", side: "left" };
const RIGHT: TimerButton = { type: "breast", side: "right" };

export function HeroCardView({
  state,
  now,
  who,
  sub,
  pending,
  busy,
  onTimer,
  onStop,
}: {
  state: HeroState<LogRow>;
  now: Date;
  who: string;
  sub: string | null;
  pending: boolean;
  busy: boolean;
  onTimer: (button: TimerButton) => void;
  onStop: (log: LogRow) => void;
}) {
  const feedButtons = (
    <div className="grid w-full grid-cols-2 gap-2.5">
      <Button disabled={busy} onClick={() => onTimer(LEFT)}>
        Bú trái
      </Button>
      <Button disabled={busy} onClick={() => onTimer(RIGHT)}>
        Bú phải
      </Button>
    </div>
  );

  let body: ReactNode;
  if (state.kind === "running") {
    const log = state.log;
    const elapsed = now.getTime() - Date.parse(log.started_at);
    const clock = formatClock(elapsed);
    const side = (log.details as { side?: unknown } | null)?.side;
    body = (
      <>
        <TimerRing
          token={CATEGORIES[log.type as LogType].token}
          progress={ringProgress(elapsed)}
        >
          <span className={cx(LABEL, "text-muted")}>
            {timerLabel(log)} <PendingMark pending={pending} />
          </span>
          <span className={clock.length > 5 ? BIG_LONG : BIG}>{clock}</span>
          <span className="text-[13px] leading-[18px] text-muted">
            {who} · từ {formatVnTime(new Date(log.started_at))}
          </span>
        </TimerRing>
        {log.type === "breast" ? (
          <div className="grid w-full grid-cols-2 gap-2.5">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onTimer(side === "left" ? RIGHT : LEFT)}
            >
              Đổi bên
            </Button>
            <Button disabled={busy} onClick={() => onStop(log)}>
              Dừng
            </Button>
          </div>
        ) : (
          <Button block disabled={busy} onClick={() => onStop(log)}>
            Dừng
          </Button>
        )}
      </>
    );
  } else if (state.kind === "overdue") {
    body = (
      <>
        <span className={cx(LABEL, "text-warn")}>Trễ cữ bú</span>
        <span className={state.lateMinutes < 60 ? BIG : BIG_LONG}>
          {formatMinutes(state.lateMinutes)}
        </span>
        <span className={META}>Dự kiến lúc {formatVnTime(state.due)}</span>
        {feedButtons}
      </>
    );
  } else if (state.kind === "next") {
    body = (
      <>
        <span className={cx(LABEL, "text-muted")}>Cữ bú tiếp theo</span>
        <span className={BIG}>{formatVnTime(state.due)}</span>
        <span className={META}>còn {formatMinutes(state.minutesLeft)}</span>
      </>
    );
  } else {
    body = (
      <>
        <span className="text-[17px] leading-[22px] font-semibold text-ink">
          Chưa có cữ bú nào gần đây
        </span>
        {feedButtons}
      </>
    );
  }

  return (
    <Glass
      as="section"
      radius="hero"
      className={cx(
        "flex flex-col items-center gap-2.5 p-4 text-center shadow-[0_10px_40px_rgb(0_0_0/0.10)] in-data-[theme=dark]:shadow-[0_10px_40px_rgb(0_0_0/0.40)] in-data-[theme=night]:shadow-none",
        state.kind === "overdue" && "border-warn!",
      )}
    >
      {body}
      {sub && <p className="text-[13px] leading-[18px] text-muted">{sub}</p>}
    </Glass>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/home/herocard.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (running 3, feed states 4, PendingMark 1, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/home/HeroCard.tsx components/home/herocard.test.tsx components/sync/PendingMark.tsx
git commit -m "feat(home): hero card with four states; pending mark as an icon"
```

---

### Task 5: Hàng timer phụ, nút Vitamin D và ráp vào `HomeScreen`

**Files:**

- Create: `components/home/TimerRow.tsx`, `components/home/VitaminDButton.tsx`, `components/home/timerrow.test.tsx`
- Modify: `components/home/HomeScreen.tsx` (viết lại toàn file)
- Delete: `components/home/RunningCard.tsx`, `components/home/StatusLines.tsx`, `components/home/VitaminDRow.tsx`

**Interfaces:**

- Consumes: `heroState`, `timerLabel` (Task 2); `sleepStatusLine` (Task 1); `CATEGORY_CHIP` (Task 3); `HeroCardView`, `PendingMark` (Task 4); `Glass`, `Button`, `Icon`, `CATEGORIES`, `formatDuration`, `vitaminDToday`, `useQuickActions`.
- Produces: `TimerRow({ log: LogRow; who: string; now: Date; busy: boolean; pending: boolean; onStop: () => void })`, `VitaminDButton({ onRecord: () => void })`; Trang chủ mới.

Spec §7.1: thứ tự Header → banner cảnh báo → (dòng đồng bộ do `AuthGate` vẽ) → thẻ chính → timer phụ (mỗi cái một hàng kính "<loại> · <thời gian chạy> · <người>" + nút "Dừng") → nút bấm giờ và ghi nhanh (M2 làm lại, giữ `ActionGrid` cũ ở M1) → Vitamin D (chưa uống thì nút kính viền đứt; đã uống thì không có nút, dòng phụ thẻ chính có "Vitamin D đã uống HH:mm") → 24 giờ qua. Khoảng cách giữa các khối 18.

- [ ] **Step 1: Viết test hỏng**

`components/home/timerrow.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { TimerRow } from "./TimerRow";
import { VitaminDButton } from "./VitaminDButton";

const NOW = new Date("2026-11-14T05:00:00Z");
const sleep = {
  id: "s1",
  baby_id: "b1",
  type: "sleep",
  started_at: "2026-11-14T03:30:00.000Z",
  ended_at: null,
  details: {},
  note: null,
  created_by: "u1",
  created_at: "2026-11-14T03:30:00.000Z",
  updated_at: "2026-11-14T03:30:00.000Z",
} as LogRow;

describe("TimerRow", () => {
  it("names the timer, how long it has run and who started it", () => {
    const html = renderToStaticMarkup(
      <TimerRow
        log={sleep}
        who="Ba"
        now={NOW}
        busy={false}
        pending={false}
        onStop={() => {}}
      />,
    );
    expect(html).toContain(">Ngủ · 1 giờ 30 phút · Ba");
    expect(html).toContain("bg-cat-sleep/15 text-cat-sleep");
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
    expect(html).toContain(">Dừng</button>");
    expect(html).toContain("glass");
  });

  it("Dừng calls onStop, and is disabled while busy", () => {
    const onStop = vi.fn();
    const tree = TimerRow({
      log: sleep,
      who: "Ba",
      now: NOW,
      busy: true,
      pending: false,
      onStop,
    });
    const [stop] = findElements(tree, (el) => el.props.children === "Dừng");
    expect(stop.props.disabled).toBe(true);
    (stop.props.onClick as () => void)();
    expect(onStop).toHaveBeenCalledOnce();
  });
});

describe("VitaminDButton", () => {
  it("is a dashed glass button without a tick emoji", () => {
    const onRecord = vi.fn();
    const html = renderToStaticMarkup(<VitaminDButton onRecord={onRecord} />);
    expect(html).toContain("Ghi Vitamin D hôm nay");
    expect(html).toContain("border-dashed!");
    expect(html).toContain(`d="${ICON_PATHS.pill}"`);
    expect(html).not.toContain("✓");
    (VitaminDButton({ onRecord }).props.onClick as () => void)();
    expect(onRecord).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/timerrow.test.tsx`
Expected: FAIL — `Cannot find module './TimerRow'`.

- [ ] **Step 3: Viết `components/home/TimerRow.tsx`**

```tsx
import { PendingMark } from "@/components/sync/PendingMark";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { timerLabel } from "@/lib/rules/hero";
import type { LogType } from "@/lib/rules/logDetails";
import { formatDuration } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

// Spec §7.1 step 5: a running timer that is not on the hero card.
export function TimerRow({
  log,
  who,
  now,
  busy,
  pending,
  onStop,
}: {
  log: LogRow;
  who: string;
  now: Date;
  busy: boolean;
  pending: boolean;
  onStop: () => void;
}) {
  const category = CATEGORIES[log.type as LogType];
  return (
    <Glass radius="tile" className="flex items-center gap-3 py-2 pr-2 pl-3">
      <span
        className={cx(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          CATEGORY_CHIP[category.token],
        )}
      >
        <Icon name={category.icon} size={17} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1 text-[15px] text-ink tabular-nums">
        {timerLabel(log)} ·{" "}
        {formatDuration(now.getTime() - Date.parse(log.started_at))} · {who}{" "}
        <PendingMark pending={pending} />
      </span>
      <Button size="md" variant="secondary" disabled={busy} onClick={onStop}>
        Dừng
      </Button>
    </Glass>
  );
}
```


- [ ] **Step 4: Viết `components/home/VitaminDButton.tsx`**

```tsx
import { Icon } from "@/components/ui/Icon";

// Spec §7.1 step 8: only shown until today's dose is logged.
export function VitaminDButton({ onRecord }: { onRecord: () => void }) {
  return (
    <button
      type="button"
      onClick={onRecord}
      className="glass flex min-h-[50px] items-center justify-center gap-2 rounded-full border-dashed! border-muted! text-[15px] font-semibold text-ink"
    >
      <Icon name="pill" size={18} className="text-cat-med" />
      Ghi Vitamin D hôm nay
    </button>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/home/timerrow.test.tsx lib/themeGuard.test.ts`
Expected: PASS (TimerRow 2, VitaminDButton 1, themeGuard 1).

- [ ] **Step 6: Viết lại `components/home/HomeScreen.tsx`**

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
import { heroState } from "@/lib/rules/hero";
import type { QuickValues } from "@/lib/rules/quickEntry";
import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
import { sleepStatusLine } from "@/lib/rules/status";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import { ActionGrid } from "./ActionGrid";
import { AlertBanners } from "./AlertBanners";
import { HeroCardView } from "./HeroCard";
import { HomeHeader } from "./HomeHeader";
import { RecentList } from "./RecentList";
import { SummaryCard } from "./SummaryCard";
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
  const totals = windowTotals(rows, now);
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

      <AlertBanners alerts={alerts} />

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

      {vitaminD === null && (
        <VitaminDButton
          onRecord={() => actions.openInstant("medicine", VITAMIN_D)}
        />
      )}

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

- [ ] **Step 7: Xóa 3 component cũ**

Run: `git rm components/home/RunningCard.tsx components/home/StatusLines.tsx components/home/VitaminDRow.tsx && ! grep -rnwE "RunningCard|StatusLines|VitaminDRow" app components lib`
Expected: `git rm` báo 3 file; `grep` không có kết quả.

- [ ] **Step 8: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh (519 có sẵn + 2 status + 10 hero + 3 TimerRing/chip + 8 HeroCard/PendingMark + 3 TimerRow/VitaminD = 545); build xong.

- [ ] **Step 9: Kiểm trên trình duyệt**

Run: `bun run dev`, mở `http://localhost:3000/` ở bề rộng 375 px, đăng nhập. **Không bấm Bú trái, Bú phải, Đổi bên, Dừng, nút bấm giờ, Ghi Vitamin D; không lưu sheet nào** (dữ liệu thật).
Expected:

- Ngay dưới header (và banner cảnh báo nếu có) là thẻ chính kính bo 32, đúng một trong 4 trạng thái theo dữ liệu hiện có: vòng màu loại + đồng hồ chạy từng giây khi có timer; "Trễ cữ bú" viền vàng; "Cữ bú tiếp theo" giờ to; hoặc "Chưa có cữ bú nào gần đây".
- Dòng phụ dưới thẻ có câu ngủ/thức và "Vitamin D đã uống HH:mm" nếu hôm nay đã uống; khi đó không còn nút "Ghi Vitamin D hôm nay".
- Không còn hai dòng trạng thái chữ thường cũ, không còn thẻ viền "đang chạy" cũ, không còn emoji ⏳ hay ✓.
- Đổi qua Tối và Ban đêm (Cài đặt → Giao diện), nhìn lại thẻ: chữ đọc rõ, Ban đêm không có bóng. Đặt lại lựa chọn giao diện như ban đầu. Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 10: Commit**

```bash
git add -A components/home
git commit -m "feat(home): hero card and running-timer rows on Trang chủ"
```

---

## Kết thúc M1 (Đợt 3)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 545 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 3 / M2 (banner, dòng đồng bộ, nút bấm giờ tròn, Ghi nhanh, 24 giờ, Gần đây).
