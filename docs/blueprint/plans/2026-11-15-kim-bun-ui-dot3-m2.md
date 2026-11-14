# Kim Bun UI — Đợt 3 / M2 (Các khối còn lại của Trang chủ) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm nốt Trang chủ theo spec §7.1 và §7.3: banner cảnh báo kiểu mới, dòng đồng bộ dạng viên thuốc kính, 5 nút bấm giờ tròn 58, lưới Ghi nhanh 2×2, 3 ô `StatTile` "24 giờ qua", thẻ kính "Gần đây"; bỏ lưới nút cũ `ActionGrid`, `SummaryCard`, `RecentList`.

**Architecture:**

- Chữ và màu của 3 ô 24 giờ là hàm thuần `homeStatTiles` trong `lib/rules/summaryText.ts`. Hàm này thay `metricText` và `RATING_LABEL`, vốn chỉ `SummaryCard` dùng.
- Số đếm lấy thẳng từ `sleepMinutesInWindow`, `countFeedsInWindow`, `wetDiapersInWindow` nên luôn có, kể cả khi chưa có rating.
- Mọi khối mới là component không hook, test bằng `renderToStaticMarkup` và duyệt cây (`findElements`).
- `SyncBar` tách phần vẽ thành `SyncBarView` để test được; phần hook giữ nguyên.
- `HomeScreen` chỉ ráp; bấm nút vẫn đi qua `useQuickActions()` có sẵn.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, Vitest 5 (`react-dom/server`), Bun. Không thêm gói nào.

**Các mốc của Đợt 3:** M1 (thẻ chính, `TimerRing`, hàng timer phụ) — đã xong trên nhánh `feat/kim-bun-dot3-m1`. **M2 (plan này).** M3: Hoàn tác (mục 7.4), rung 10 ms trên Android, checklist bước 26.

**Quyết định cho chỗ spec chưa nói rõ:**

- Ô "Giấc ngủ" ghi gọn "Xg Yp" (như tóm tắt ngày ở Nhật ký, spec §9) để vừa ô hẹp; "Cữ bú" và "Tã ướt" là số trơn ("8", "6").
- Dòng phụ của ô:
  - Có rating: "Bình thường" / "Cần chú ý" / "Báo bác sĩ", màu `good` / `warn` / `danger`.
  - Chưa đủ 24 giờ dữ liệu (`no-data`): "Đánh giá sau 24 giờ đầu", màu `muted`.
  - Tuổi ngoài bảng đánh giá (`not-rated`): "Không đánh giá ở tuổi này", màu `muted`. Spec không phân biệt trường hợp này, nhưng ghi "sau 24 giờ đầu" thì sai sự thật.
- Nút bấm giờ đang chạy: nhãn hiển thị giữ nguyên, `aria-label` đổi thành "Dừng <nhãn>" (cùng chữ với bảng 9 hành động). Không dùng `aria-pressed`, vì nhãn đã nói trạng thái (WAI-ARIA: nút bật/tắt không đổi nhãn theo trạng thái).
- Hai khối "Bấm giờ" và "Ghi nhanh" có nhãn nhóm chữ hoa 13/600 `--color-muted` như nhãn nhóm ở Cài đặt. "24 giờ qua" và "Gần đây" có tiêu đề nhóm 20/700.
- Hàng "Gần đây": dòng trên là `describeLog` (đã gồm chi tiết, nên không có phần "meta" riêng), dòng dưới là người ghi và dấu chờ đồng bộ, giờ ở bên phải.
- `SyncBar` vẫn ở chỗ cũ: `AuthGate` vẽ nó phía trên trang. Đưa nó xuống dưới header của từng trang cần đổi bố cục mọi trang, để Đợt 5 làm cùng phần còn lại của §9. M2 chỉ đổi kiểu và bỏ emoji.
- Banner cảnh báo giữ đúng luật hiện nay: banner đỏ luôn có "Gọi 115" và "Phân loại triệu chứng"; banner vàng chỉ có "Phân loại triệu chứng" khi `key === "fever"`.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI; icon dùng `components/ui/Icon.tsx`.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Logic nghiệp vụ là hàm thuần trong `lib/rules/`, có unit test. Component trong `components/ui/` không gọi dữ liệu.
- Không đổi luồng ghi dữ liệu: bấm giờ, mở sheet ghi nhanh, dừng đều qua `useQuickActions()` như hiện nay. Không đổi `rateLast24h`, `homeAlerts`, `windowTotals` và các hàm đếm trong `lib/rules/ratings.ts`.
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`. Mọi giờ và số đo dùng `tabular-nums`. Nút có `:active { scale(0.97) }` 120 ms (spec §4.7).
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay, **không bấm** nút bấm giờ, nút Ghi nhanh, Bú trái, Bú phải, Đổi bên, Dừng, Ghi Vitamin D, "Gọi 115", và không lưu sheet nào. Chỉ nhìn; được bấm link "Tất cả" (chỉ chuyển trang).
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot3-m1`):

- Đợt 3 / M1: `CATEGORY_CHIP` (`lib/ui/categories.ts`), `PendingMark` (vẽ icon `clock`), `HeroCardView`, `TimerRow`, `VitaminDButton`, `heroState`, `sleepStatusLine`; `HomeScreen` hiện tại (thứ tự: header → banner → thẻ chính → timer phụ → `ActionGrid` → lỗi → Vitamin D → "24 giờ qua").
- `components/ui/`: `Glass` (`strong? radius? as? className` + thuộc tính HTML), `StatTile` (`label value note? tone?`, `type StatTone = "good" | "warn" | "danger" | "muted"`), `Icon`; `components/ui/testTree.ts` (`findElements`).
- `lib/ui/categories.ts`: `CATEGORIES`, `type CategoryToken`.
- `lib/rules/quickActions.ts`: `QUICK_ACTIONS`, `type QuickAction`, `isActionRunning`, `actionLabel`.
- `lib/rules/ratings.ts`: `type DayRatings`, `type MetricResult`, `type Rating`, `sleepMinutesInWindow`, `countFeedsInWindow`, `wetDiapersInWindow`, `rateLast24h`, `windowTotals`, `WINDOW_MS`.
- `lib/rules/alerts.ts`: `type HomeAlert = { key: string; level: "red" | "yellow"; message: string }`.
- `lib/rules/describeLog.ts`: `describeLog`, `type LogLike`; `lib/rules/time.ts`: `formatVnTime`; `lib/rules/timer.ts`: `RunningLog`, `TimerButton`; `lib/rules/quickEntry.ts`: `InstantType`.
- `lib/data/outboxEvents.ts`: `droppedWrites`, `takeRecentDrop`; `lib/hooks/useOutboxEntries.ts`.

**Produces** (M3 dùng):

- `lib/rules/summaryText.ts`: `type HomeStatTile = { label: string; value: string; note: string; tone: "good" | "warn" | "danger" | "muted" }`, `homeStatTiles(input: { ratings: DayRatings; logs: LogLike[]; now: Date }): HomeStatTile[]`, `shortDuration(minutes: number): string`, `totalsLine(totals: { bottleMl: number; dirtyDiapers: number }): string`. Xóa `metricText`, `RATING_LABEL`.
- `components/home/StatsSection.tsx`: `StatsSection({ tiles: HomeStatTile[]; totals: string })`.
- `components/home/RecentCard.tsx`: `RecentCard({ logs: LogRow[]; now: Date; nameOf: (userId: string) => string; pending: Set<string> })`.
- `components/home/TimerButtons.tsx`: `TimerButtons({ running: RunningLog[]; busy: boolean; onTimer: (button: TimerButton) => void })`.
- `components/home/QuickLogGrid.tsx`: `QuickLogGrid({ onInstant: (type: InstantType) => void })`.
- `components/home/AlertBanners.tsx`: `AlertBanners({ alerts: HomeAlert[] })` (cùng chữ ký, kiểu mới).
- `components/sync/SyncBar.tsx`: `SyncBarView({ count: number; dropped: string | null })`, `SyncBar({ userId })` (cùng chữ ký).
- `components/home/sectionTitle.ts`: `SECTION_TITLE`, `GROUP_LABEL` (chuỗi class dùng chung).
- Xóa: `components/home/ActionGrid.tsx`, `components/home/SummaryCard.tsx`, `components/home/RecentList.tsx`.

---

### Task 1: Chữ và màu của 3 ô "24 giờ qua" (`homeStatTiles`)

**Files:**

- Modify: `lib/rules/summaryText.ts` (viết lại toàn file), `lib/rules/summaryText.test.ts` (viết lại toàn file)

**Interfaces:**

- Consumes: `DayRatings`, `MetricResult`, `Rating`, `sleepMinutesInWindow`, `countFeedsInWindow`, `wetDiapersInWindow` (`lib/rules/ratings.ts`); `LogLike`.
- Produces: `HomeStatTile`, `homeStatTiles`, `shortDuration`, `totalsLine` (chữ ký ở Contracts).

Spec §7.3: số đếm luôn hiện, dùng cả khi chưa có rating; nhãn "Bình thường" / "Cần chú ý" / "Báo bác sĩ" và màu `good` / `warn` / `danger` chỉ khi có rating; chưa có rating thì "Đánh giá sau 24 giờ đầu" màu `muted`. Spec §7.1 bước 9: dòng phụ "Bình X ml · Tã bẩn Y".

- [ ] **Step 1: Viết test hỏng**

Trong `lib/rules/summaryText.test.ts`, thay hai dòng import đầu file bằng 4 dòng import dưới đây, rồi thêm phần còn lại (từ `const NOW` trở xuống) vào cuối file, sau khối `describe("metricText", …)` cũ:

```ts
import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import type { DayRatings } from "./ratings";
import { homeStatTiles, metricText, RATING_LABEL, shortDuration, totalsLine } from "./summaryText";

const NOW = new Date("2026-11-14T05:00:00Z");
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (
  type: string,
  start: number,
  end: number,
  details: unknown,
): LogLike => ({
  type,
  started_at: ago(start),
  ended_at: ago(end),
  details,
});
const LOGS: LogLike[] = [
  log("sleep", 5, 2.5, {}),
  log("bottle", 1, 1, { ml: 90, milk: "formula" }),
  log("breast", 4, 3.8, { side: "left" }),
  log("diaper", 2, 2, { wet: true, dirty: false }),
  log("diaper", 6, 6, { wet: true, dirty: true }),
  log("diaper", 7, 7, { wet: false, dirty: true }),
];
const rated = (rating: "green" | "yellow" | "red", value: number) => ({
  status: "rated" as const,
  rating,
  value,
  explain: "x",
});

describe("homeStatTiles", () => {
  it("always shows the counts from the last 24 hours", () => {
    const ratings: DayRatings = {
      sleepMinutes: { status: "no-data" },
      feeds: { status: "no-data" },
      wetDiapers: { status: "no-data" },
    };
    expect(homeStatTiles({ ratings, logs: LOGS, now: NOW })).toEqual([
      {
        label: "Giấc ngủ",
        value: "2g 30p",
        note: "Đánh giá sau 24 giờ đầu",
        tone: "muted",
      },
      {
        label: "Cữ bú",
        value: "2",
        note: "Đánh giá sau 24 giờ đầu",
        tone: "muted",
      },
      {
        label: "Tã ướt",
        value: "2",
        note: "Đánh giá sau 24 giờ đầu",
        tone: "muted",
      },
    ]);
  });

  it("labels and colours each rating", () => {
    const ratings: DayRatings = {
      sleepMinutes: rated("green", 150),
      feeds: rated("yellow", 2),
      wetDiapers: rated("red", 2),
    };
    expect(
      homeStatTiles({ ratings, logs: LOGS, now: NOW }).map((t) => [
        t.note,
        t.tone,
      ]),
    ).toEqual([
      ["Bình thường", "good"],
      ["Cần chú ý", "warn"],
      ["Báo bác sĩ", "danger"],
    ]);
  });

  it("says when the age is not rated", () => {
    const ratings: DayRatings = {
      sleepMinutes: { status: "not-rated", value: 150 },
      feeds: { status: "not-rated", value: 2 },
      wetDiapers: { status: "not-rated", value: 2 },
    };
    expect(homeStatTiles({ ratings, logs: LOGS, now: NOW })[0]).toEqual({
      label: "Giấc ngủ",
      value: "2g 30p",
      note: "Không đánh giá ở tuổi này",
      tone: "muted",
    });
  });
});

describe("short texts", () => {
  it("shortDuration writes hours and minutes as Xg Yp", () => {
    expect(shortDuration(0)).toBe("0p");
    expect(shortDuration(45)).toBe("45p");
    expect(shortDuration(120)).toBe("2g");
    expect(shortDuration(785)).toBe("13g 5p");
  });

  it("totalsLine shows bottle ml and dirty diapers", () => {
    expect(totalsLine({ bottleMl: 180, dirtyDiapers: 2 })).toBe(
      "Bình 180 ml · Tã bẩn 2",
    );
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/summaryText.test.ts`
Expected: FAIL — `homeStatTiles is not a function` (hoặc lỗi import tương tự).

- [ ] **Step 3: Sửa `lib/rules/summaryText.ts`**

Thay dòng `import type { MetricResult, Rating } from "./ratings";` bằng hai import đầu của khối dưới (giữ nguyên dòng `import { formatDuration } from "./time";` và code cũ `RATING_LABEL`, `metricText`), rồi thêm phần từ `export type HomeStatTile` trở xuống vào cuối file:

```ts
import type { LogLike } from "./describeLog";
import {
  countFeedsInWindow,
  sleepMinutesInWindow,
  wetDiapersInWindow,
  type DayRatings,
  type MetricResult,
  type Rating,
} from "./ratings";

export type HomeStatTile = {
  label: string;
  value: string;
  note: string;
  tone: "good" | "warn" | "danger" | "muted";
};

const RATED: Record<Rating, Pick<HomeStatTile, "note" | "tone">> = {
  green: { note: "Bình thường", tone: "good" },
  yellow: { note: "Cần chú ý", tone: "warn" },
  red: { note: "Báo bác sĩ", tone: "danger" },
};

function noteFor(result: MetricResult): Pick<HomeStatTile, "note" | "tone"> {
  if (result.status === "rated") return RATED[result.rating];
  if (result.status === "not-rated")
    return { note: "Không đánh giá ở tuổi này", tone: "muted" };
  return { note: "Đánh giá sau 24 giờ đầu", tone: "muted" };
}

export function shortDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}p`;
  return rest === 0 ? `${hours}g` : `${hours}g ${rest}p`;
}

// Spec §7.3: counts always show; the rating line only when there is a rating.
export function homeStatTiles(input: {
  ratings: DayRatings;
  logs: LogLike[];
  now: Date;
}): HomeStatTile[] {
  const { ratings, logs, now } = input;
  return [
    {
      label: "Giấc ngủ",
      value: shortDuration(sleepMinutesInWindow(logs, now)),
      ...noteFor(ratings.sleepMinutes),
    },
    {
      label: "Cữ bú",
      value: String(countFeedsInWindow(logs, now)),
      ...noteFor(ratings.feeds),
    },
    {
      label: "Tã ướt",
      value: String(wetDiapersInWindow(logs, now)),
      ...noteFor(ratings.wetDiapers),
    },
  ];
}

export function totalsLine(totals: {
  bottleMl: number;
  dirtyDiapers: number;
}): string {
  return `Bình ${totals.bottleMl} ml · Tã bẩn ${totals.dirtyDiapers}`;
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/summaryText.test.ts`
Expected: PASS (9 test: 4 cũ của `metricText`/`RATING_LABEL`, `homeStatTiles` 3, short texts 2).

`metricText` và `RATING_LABEL` ở lại tới Task 5 vì `SummaryCard` vẫn dùng.

Run: `bun run typecheck`
Expected: không lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/summaryText.ts lib/rules/summaryText.test.ts
git commit -m "feat(home): homeStatTiles for the 24-hour tiles"
```

---

### Task 2: Khối "24 giờ qua" và thẻ "Gần đây"

**Files:**

- Create: `components/home/sectionTitle.ts`, `components/home/StatsSection.tsx`, `components/home/RecentCard.tsx`, `components/home/stats.test.tsx`

**Interfaces:**

- Consumes: `HomeStatTile` (Task 1); `StatTile`, `Glass`, `Icon`; `CATEGORIES`, `CATEGORY_CHIP`; `PendingMark`; `describeLog`; `formatVnTime`; `LogRow`.
- Produces: `SECTION_TITLE`, `GROUP_LABEL`, `StatsSection`, `RecentCard` (chữ ký ở Contracts).

Spec §7.1 bước 9–10: 3 `StatTile` + dòng phụ; "Gần đây" là thẻ kính, tối đa 6 bản ghi đã kết thúc trong 24 giờ (danh sách đầu vào đã lọc và xếp mới nhất trước ở `HomeScreen`); mỗi hàng chip màu loại 32 + mô tả 16/500 + dòng 13 + giờ; link "Tất cả" → `/nhat-ky`.

- [ ] **Step 1: Viết test hỏng**

`components/home/stats.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { HomeStatTile } from "@/lib/rules/summaryText";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { RecentCard } from "./RecentCard";
import { StatsSection } from "./StatsSection";

const NOW = new Date("2026-11-14T05:00:00Z");
const tiles: HomeStatTile[] = [
  { label: "Giấc ngủ", value: "13g 5p", note: "Bình thường", tone: "good" },
  { label: "Cữ bú", value: "8", note: "Cần chú ý", tone: "warn" },
  {
    label: "Tã ướt",
    value: "6",
    note: "Đánh giá sau 24 giờ đầu",
    tone: "muted",
  },
];
const bottle = (i: number): LogRow =>
  ({
    id: `b${i}`,
    baby_id: "b1",
    type: "bottle",
    started_at: new Date(NOW.getTime() - i * 3_600_000).toISOString(),
    ended_at: new Date(NOW.getTime() - i * 3_600_000).toISOString(),
    details: { ml: 90, milk: "formula" },
    note: null,
    created_by: "u1",
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
  }) as LogRow;

describe("StatsSection", () => {
  it("shows a titled row of three tiles and the totals line", () => {
    const html = renderToStaticMarkup(
      <StatsSection tiles={tiles} totals="Bình 180 ml · Tã bẩn 2" />,
    );
    expect(html).toContain(">24 giờ qua</h2>");
    expect(html).toContain("grid-cols-3");
    expect(html).toContain(">13g 5p</span>");
    expect(html).toContain(">Bình thường</span>");
    expect(html).toContain("text-good");
    expect(html).toContain("text-warn");
    expect(html).toContain(">Bình 180 ml · Tã bẩn 2</p>");
  });
});

describe("RecentCard", () => {
  it("lists at most six records with chip, description, who and time", () => {
    const logs = [1, 2, 3, 4, 5, 6, 7].map(bottle);
    const html = renderToStaticMarkup(
      <RecentCard
        logs={logs}
        now={NOW}
        nameOf={() => "Ba"}
        pending={new Set(["b1"])}
      />,
    );
    expect(html).toContain(">Gần đây</h2>");
    expect(html).toContain('href="/nhat-ky"');
    expect(html).toContain(">Tất cả</a>");
    expect(html.match(/<li/g)).toHaveLength(6);
    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
    expect(html).toContain(`d="${ICON_PATHS.bottle}"`);
    expect(html).toContain(">Bình 90 ml sữa công thức</span>");
    expect(html).toContain(">11:00</span>");
    expect(html).toContain("Ba");
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
  });

  it("says so when nothing was logged", () => {
    const html = renderToStaticMarkup(
      <RecentCard
        logs={[]}
        now={NOW}
        nameOf={() => "Ba"}
        pending={new Set()}
      />,
    );
    expect(html).toContain("Chưa có ghi chép nào trong 24 giờ qua.");
    expect(html).not.toContain("<li");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/stats.test.tsx`
Expected: FAIL — `Cannot find module './RecentCard'`.

- [ ] **Step 3: Viết `components/home/sectionTitle.ts`**

```ts
// Spec §4.4: group title 20/700 and uppercase group label 13/600.
export const SECTION_TITLE = "px-1 text-xl leading-[26px] font-bold text-ink";
export const GROUP_LABEL =
  "px-1 text-[13px] leading-[18px] font-semibold tracking-[0.04em] text-muted uppercase";
```

- [ ] **Step 4: Viết `components/home/StatsSection.tsx`**

```tsx
import { StatTile } from "@/components/ui/StatTile";
import type { HomeStatTile } from "@/lib/rules/summaryText";
import { SECTION_TITLE } from "./sectionTitle";

export function StatsSection({
  tiles,
  totals,
}: {
  tiles: HomeStatTile[];
  totals: string;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={SECTION_TITLE}>24 giờ qua</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <StatTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            note={tile.note}
            tone={tile.tone}
          />
        ))}
      </div>
      <p className="px-1 text-[13px] leading-[18px] text-muted tabular-nums">
        {totals}
      </p>
    </section>
  );
}
```

- [ ] **Step 5: Viết `components/home/RecentCard.tsx`**

```tsx
import Link from "next/link";
import { PendingMark } from "@/components/sync/PendingMark";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { describeLog } from "@/lib/rules/describeLog";
import type { LogType } from "@/lib/rules/logDetails";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { SECTION_TITLE } from "./sectionTitle";

const MAX_ROWS = 6;

// Spec §7.1 step 10. `logs` arrive filtered (finished, last 24 hours) and newest first.
export function RecentCard({
  logs,
  now,
  nameOf,
  pending,
}: {
  logs: LogRow[];
  now: Date;
  nameOf: (userId: string) => string;
  pending: Set<string>;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className={SECTION_TITLE}>Gần đây</h2>
        <Link
          href="/nhat-ky"
          className="inline-flex min-h-11 items-center px-1 text-[15px] font-semibold text-accent-text"
        >
          Tất cả
        </Link>
      </div>
      {logs.length === 0 ? (
        <Glass className="p-4 text-[15px] text-muted">
          Chưa có ghi chép nào trong 24 giờ qua.
        </Glass>
      ) : (
        <Glass as="ul" className="overflow-hidden">
          {logs.slice(0, MAX_ROWS).map((log) => {
            const category = CATEGORIES[log.type as LogType];
            return (
              <li
                key={log.id}
                className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
              >
                {category && (
                  <span
                    className={cx(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      CATEGORY_CHIP[category.token],
                    )}
                  >
                    <Icon name={category.icon} size={17} strokeWidth={2.2} />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base font-medium text-ink">
                    {describeLog(log, now)}
                  </span>
                  <span className="text-[13px] leading-[18px] text-muted">
                    {nameOf(log.created_by)}{" "}
                    <PendingMark pending={pending.has(log.id)} />
                  </span>
                </span>
                <span className="text-[15px] font-semibold text-ink tabular-nums">
                  {formatVnTime(new Date(log.started_at))}
                </span>
              </li>
            );
          })}
        </Glass>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components/home/stats.test.tsx lib/themeGuard.test.ts`
Expected: PASS (StatsSection 1, RecentCard 2, themeGuard 1).

- [ ] **Step 7: Commit**

```bash
git add components/home/sectionTitle.ts components/home/StatsSection.tsx components/home/RecentCard.tsx components/home/stats.test.tsx
git commit -m "feat(home): 24-hour tiles and recent card"
```

---

### Task 3: 5 nút bấm giờ tròn và lưới Ghi nhanh

**Files:**

- Create: `components/home/TimerButtons.tsx`, `components/home/QuickLogGrid.tsx`, `components/home/buttons.test.tsx`

**Interfaces:**

- Consumes: `GROUP_LABEL` (Task 2); `QUICK_ACTIONS`, `QuickAction`, `isActionRunning`, `actionLabel` (`lib/rules/quickActions.ts`); `CATEGORIES`, `CATEGORY_CHIP`, `CategoryToken`; `Icon`; `RunningLog`, `TimerButton`, `InstantType`; `findElements`.
- Produces: `TimerButtons`, `QuickLogGrid` (chữ ký ở Contracts).

Spec §7.1:

- Bước 6 **Bấm giờ**: 5 nút tròn 58 (Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp), nhãn 12/500 dưới. Đang chạy: nền màu loại, icon `--color-bg`, quầng 4 px màu loại độ đục 0.3.
- Bước 7 **Ghi nhanh**: lưới 2×2 nút viên thuốc kính cao 56 (Thay tã, Bú bình, Thuốc, Nhiệt độ), chip icon màu loại 32.

- [ ] **Step 1: Viết test hỏng**

`components/home/buttons.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { RunningLog } from "@/lib/rules/timer";
import { ICON_PATHS } from "@/lib/ui/icons";
import { QuickLogGrid } from "./QuickLogGrid";
import { TimerButtons } from "./TimerButtons";

const leftFeed: RunningLog = {
  id: "l1",
  type: "breast",
  details: { side: "left" },
};

describe("TimerButtons", () => {
  it("shows five 58 px round buttons with labels, in spec order", () => {
    const html = renderToStaticMarkup(
      <TimerButtons running={[]} busy={false} onTimer={() => {}} />,
    );
    expect(html).toContain(">Bấm giờ</h2>");
    expect(html.match(/<button/g)).toHaveLength(5);
    expect(html.match(/size-\[58px\]/g)).toHaveLength(5);
    const labels = [
      ...html.matchAll(/text-xs leading-4 font-medium text-ink">([^<]+)</g),
    ].map((m) => m[1]);
    expect(labels).toEqual(["Bú trái", "Bú phải", "Ngủ", "Hút sữa", "Nằm sấp"]);
    expect(html).toContain(`d="${ICON_PATHS.moon}"`);
    expect(html).not.toContain("Dừng");
  });

  it("fills a running timer with its colour and a halo, and offers to stop it", () => {
    const html = renderToStaticMarkup(
      <TimerButtons running={[leftFeed]} busy={false} onTimer={() => {}} />,
    );
    expect(html.match(/aria-label="Dừng /g)).toHaveLength(1);
    expect(html).toContain('aria-label="Dừng bú trái"');
    expect(html).toContain("bg-cat-feed ring-4 ring-cat-feed/30 text-bg");
    expect(html).toContain('aria-label="Bú phải"');
  });

  it("presses the timer's button, and is disabled while busy", () => {
    const onTimer = vi.fn();
    const buttons = findElements(
      TimerButtons({ running: [], busy: true, onTimer }),
      (el) => el.type === "button",
    );
    expect(buttons).toHaveLength(5);
    expect(buttons.every((b) => b.props.disabled === true)).toBe(true);
    (buttons[2].props.onClick as () => void)();
    expect(onTimer).toHaveBeenCalledWith({ type: "sleep" });
  });
});

describe("QuickLogGrid", () => {
  it("is a 2×2 grid of glass pills with a coloured chip, in spec order", () => {
    const onInstant = vi.fn();
    const html = renderToStaticMarkup(<QuickLogGrid onInstant={onInstant} />);
    expect(html).toContain(">Ghi nhanh</h2>");
    expect(html).toContain("grid-cols-2");
    expect(html.match(/min-h-14/g)).toHaveLength(4);
    const labels = [...html.matchAll(/<span>([^<]+)<\/span><\/button>/g)].map(
      (m) => m[1],
    );
    expect(labels).toEqual(["Thay tã", "Bú bình", "Thuốc", "Nhiệt độ"]);
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain(`d="${ICON_PATHS.thermo}"`);
    const buttons = findElements(
      QuickLogGrid({ onInstant }),
      (el) => el.type === "button",
    );
    (buttons[0].props.onClick as () => void)();
    expect(onInstant).toHaveBeenCalledWith("diaper");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/buttons.test.tsx`
Expected: FAIL — `Cannot find module './QuickLogGrid'`.

- [ ] **Step 3: Viết `components/home/TimerButtons.tsx`**

```tsx
import { Icon } from "@/components/ui/Icon";
import {
  actionLabel,
  isActionRunning,
  QUICK_ACTIONS,
  type QuickAction,
} from "@/lib/rules/quickActions";
import type { RunningLog, TimerButton } from "@/lib/rules/timer";
import { CATEGORIES, type CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { GROUP_LABEL } from "./sectionTitle";

type TimerAction = Extract<QuickAction, { kind: "timer" }>;

// Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp: the order of QUICK_ACTIONS.
const TIMER_ACTIONS = QUICK_ACTIONS.filter(
  (action): action is TimerAction => action.kind === "timer",
);

const RUNNING: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed ring-4 ring-cat-feed/30",
  "cat-bottle": "bg-cat-bottle ring-4 ring-cat-bottle/30",
  "cat-sleep": "bg-cat-sleep ring-4 ring-cat-sleep/30",
  "cat-diaper": "bg-cat-diaper ring-4 ring-cat-diaper/30",
  "cat-pump": "bg-cat-pump ring-4 ring-cat-pump/30",
  "cat-tummy": "bg-cat-tummy ring-4 ring-cat-tummy/30",
  "cat-med": "bg-cat-med ring-4 ring-cat-med/30",
  "cat-temp": "bg-cat-temp ring-4 ring-cat-temp/30",
};

const IDLE: Record<CategoryToken, string> = {
  "cat-feed": "text-cat-feed",
  "cat-bottle": "text-cat-bottle",
  "cat-sleep": "text-cat-sleep",
  "cat-diaper": "text-cat-diaper",
  "cat-pump": "text-cat-pump",
  "cat-tummy": "text-cat-tummy",
  "cat-med": "text-cat-med",
  "cat-temp": "text-cat-temp",
};

export function TimerButtons({
  running,
  busy,
  onTimer,
}: {
  running: RunningLog[];
  busy: boolean;
  onTimer: (button: TimerButton) => void;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={GROUP_LABEL}>Bấm giờ</h2>
      <div className="grid grid-cols-5 gap-1">
        {TIMER_ACTIONS.map((action) => {
          const on = isActionRunning(action, running);
          const token = CATEGORIES[action.category].token;
          return (
            <button
              key={action.key}
              type="button"
              disabled={busy}
              aria-label={actionLabel(action, running)}
              onClick={() => onTimer(action.button)}
              className="flex flex-col items-center gap-1.5 transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50"
            >
              <span
                className={cx(
                  "flex size-[58px] items-center justify-center rounded-full",
                  on ? `${RUNNING[token]} text-bg` : `glass ${IDLE[token]}`,
                )}
              >
                <Icon
                  name={CATEGORIES[action.category].icon}
                  size={24}
                  strokeWidth={2.2}
                />
              </span>
              <span className="text-xs leading-4 font-medium text-ink">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Viết `components/home/QuickLogGrid.tsx`**

```tsx
import { Icon } from "@/components/ui/Icon";
import type { InstantType } from "@/lib/rules/quickEntry";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { GROUP_LABEL } from "./sectionTitle";

const INSTANTS: { type: InstantType; label: string }[] = [
  { type: "diaper", label: "Thay tã" },
  { type: "bottle", label: "Bú bình" },
  { type: "medicine", label: "Thuốc" },
  { type: "temperature", label: "Nhiệt độ" },
];

export function QuickLogGrid({
  onInstant,
}: {
  onInstant: (type: InstantType) => void;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={GROUP_LABEL}>Ghi nhanh</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {INSTANTS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onInstant(type)}
            className="glass flex min-h-14 items-center gap-3 rounded-full pr-4 pl-3 text-base font-semibold text-ink transition-transform duration-[120ms] active:scale-[0.97]"
          >
            <span
              className={cx(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                CATEGORY_CHIP[CATEGORIES[type].token],
              )}
            >
              <Icon name={CATEGORIES[type].icon} size={17} strokeWidth={2.2} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/home/buttons.test.tsx lib/themeGuard.test.ts`
Expected: PASS (TimerButtons 3, QuickLogGrid 1, themeGuard 1).

- [ ] **Step 6: Commit**

```bash
git add components/home/TimerButtons.tsx components/home/QuickLogGrid.tsx components/home/buttons.test.tsx
git commit -m "feat(home): round timer buttons and quick-log grid"
```

---

### Task 4: Banner cảnh báo và dòng đồng bộ kiểu mới

**Files:**

- Modify: `components/home/AlertBanners.tsx` (viết lại toàn file), `components/sync/SyncBar.tsx` (viết lại toàn file)
- Create: `components/home/alerts.test.tsx`

**Interfaces:**

- Consumes: `HomeAlert`; `Glass`, `Icon`; `droppedWrites`, `takeRecentDrop`, `useOutboxEntries`.
- Produces: `AlertBanners({ alerts })`, `SyncBarView({ count, dropped })`, `SyncBar({ userId })`.

Spec §7.1 bước 2: mức đỏ là thẻ bo 28 nền `--color-danger-solid` chữ `--color-on-danger`, nút "Gọi 115" (nền `--color-bg`, chữ `--color-danger`) và "Phân loại triệu chứng" (viền `--color-on-danger`); mức vàng là thẻ kính viền `--color-warn`, chữ `--color-warn-ink`. Bước 3: dòng đồng bộ kiểu viên thuốc kính nhỏ "N mục chờ đồng bộ" với icon `clock`.

- [ ] **Step 1: Viết test hỏng**

`components/home/alerts.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SyncBarView } from "@/components/sync/SyncBar";
import type { HomeAlert } from "@/lib/rules/alerts";
import { ICON_PATHS } from "@/lib/ui/icons";
import { AlertBanners } from "./AlertBanners";

const red: HomeAlert = {
  key: "few-wet",
  level: "red",
  message: "Rất ít tã ướt",
};
const fever: HomeAlert = {
  key: "fever",
  level: "yellow",
  message: "Bé sốt nhẹ",
};
const pale: HomeAlert = {
  key: "stool-pale",
  level: "yellow",
  message: "Phân bạc màu",
};

describe("AlertBanners", () => {
  it("red: solid danger card with Gọi 115 and triage", () => {
    const html = renderToStaticMarkup(<AlertBanners alerts={[red]} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("rounded-[28px] bg-danger-solid");
    expect(html).toContain("text-on-danger");
    expect(html).toContain('href="tel:115"');
    expect(html).toContain("bg-bg");
    expect(html).toContain("text-danger");
    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
    expect(html).toContain("Gọi 115</a>");
    expect(html).toContain("border-on-danger");
    expect(html).toContain('href="/trieu-chung"');
  });

  it("yellow: glass card with a warn border; triage only for fever", () => {
    const html = renderToStaticMarkup(<AlertBanners alerts={[fever, pale]} />);
    expect(html.match(/border-warn!/g)).toHaveLength(2);
    expect(html).toContain("text-warn-ink");
    expect(html).toContain(">Bé sốt nhẹ</p>");
    expect(html.match(/href="\/trieu-chung"/g)).toHaveLength(1);
    expect(html).not.toContain("tel:115");
  });

  it("renders nothing without alerts", () => {
    expect(renderToStaticMarkup(<AlertBanners alerts={[]} />)).toBe("");
  });
});

describe("SyncBarView", () => {
  it("is a small glass pill with a clock, no emoji", () => {
    const html = renderToStaticMarkup(<SyncBarView count={3} dropped={null} />);
    expect(html).toContain(">3 mục chờ đồng bộ</span>");
    expect(html).toContain("glass");
    expect(html).toContain("rounded-full");
    expect(html).toContain(`d="${ICON_PATHS.clock}"`);
    expect(html).not.toContain("⏳");
  });

  it("shows a refused write, and nothing when all is synced", () => {
    expect(
      renderToStaticMarkup(<SyncBarView count={0} dropped="hết quyền" />),
    ).toContain("Không lưu được: hết quyền.");
    expect(renderToStaticMarkup(<SyncBarView count={0} dropped={null} />)).toBe(
      "",
    );
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/alerts.test.tsx`
Expected: FAIL — `SyncBarView` không phải là component (import `undefined`), và các assertion về class mới hỏng.

- [ ] **Step 3: Viết lại `components/home/AlertBanners.tsx`**

```tsx
import Link from "next/link";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import type { HomeAlert } from "@/lib/rules/alerts";

const PILL =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-transform duration-[120ms] active:scale-[0.97]";

export function AlertBanners({ alerts }: { alerts: HomeAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      {alerts.map((alert) =>
        alert.level === "red" ? (
          <div
            key={alert.key}
            role="alert"
            className="rounded-[28px] bg-danger-solid p-4 text-on-danger"
          >
            <p className="text-base font-semibold">{alert.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="tel:115" className={`${PILL} bg-bg text-danger`}>
                <Icon name="phone" size={18} />
                Gọi 115
              </a>
              {/* Spec §7.4 (spec gốc): red banners also open symptom triage. */}
              <Link
                href="/trieu-chung"
                className={`${PILL} border border-on-danger`}
              >
                Phân loại triệu chứng
              </Link>
            </div>
          </div>
        ) : (
          <Glass
            key={alert.key}
            role="alert"
            className="border-warn! p-4 text-warn-ink"
          >
            <p className="text-base font-semibold">{alert.message}</p>
            {alert.key === "fever" && (
              <Link
                href="/trieu-chung"
                className={`${PILL} mt-3 border border-warn`}
              >
                Phân loại triệu chứng
              </Link>
            )}
          </Glass>
        ),
      )}
    </div>
  );
}
```

- [ ] **Step 4: Viết lại `components/sync/SyncBar.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { droppedWrites, takeRecentDrop } from "@/lib/data/outboxEvents";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";

const NOTICE_MS = 6000;

export function SyncBarView({
  count,
  dropped,
}: {
  count: number;
  dropped: string | null;
}) {
  if (count === 0 && !dropped) return null;
  return (
    <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pt-4 print:hidden">
      {count > 0 && (
        <p
          role="status"
          className="glass inline-flex min-h-8 items-center gap-1.5 self-start rounded-full px-3 text-[13px] font-medium text-ink"
        >
          <Icon name="clock" size={14} className="text-muted" />
          <span>{count} mục chờ đồng bộ</span>
        </p>
      )}
      {dropped && (
        <p
          role="alert"
          className="rounded-[16px] bg-danger-soft p-3 text-[15px] text-danger-ink"
        >
          Không lưu được: {dropped}.
        </p>
      )}
    </div>
  );
}

export function SyncBar({ userId }: { userId: string }) {
  const count = useOutboxEntries(userId).length;
  const [dropped, setDropped] = useState<string | null>(null);

  useEffect(() => {
    setDropped(takeRecentDrop());
    return droppedWrites.listen((reason) => {
      takeRecentDrop();
      setDropped(reason);
    });
  }, []);
  useEffect(() => {
    if (!dropped) return;
    const timer = window.setTimeout(() => setDropped(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [dropped]);

  return <SyncBarView count={count} dropped={dropped} />;
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/home/alerts.test.tsx lib/themeGuard.test.ts`
Expected: PASS (AlertBanners 3, SyncBarView 2, themeGuard 1).

- [ ] **Step 6: Commit**

```bash
git add components/home/AlertBanners.tsx components/sync/SyncBar.tsx components/home/alerts.test.tsx
git commit -m "feat(home): new alert banners and sync pill"
```

---

### Task 5: Ráp Trang chủ, xóa khối cũ, kiểm tay

**Files:**

- Modify: `components/home/HomeScreen.tsx` (viết lại toàn file), `lib/rules/summaryText.ts`, `lib/rules/summaryText.test.ts` (bỏ chữ cũ)
- Delete: `components/home/ActionGrid.tsx`, `components/home/SummaryCard.tsx`, `components/home/RecentList.tsx`

**Interfaces:**

- Consumes: `homeStatTiles`, `totalsLine` (Task 1); `StatsSection`, `RecentCard` (Task 2); `TimerButtons`, `QuickLogGrid` (Task 3); `AlertBanners` (Task 4); `HeroCardView`, `TimerRow`, `VitaminDButton`, `heroState`, `sleepStatusLine` (Đợt 3 / M1).
- Produces: Trang chủ theo đúng thứ tự spec §7.1.

Thứ tự spec §7.1: Header → banner cảnh báo → (dòng đồng bộ do `AuthGate` vẽ) → thẻ chính → timer phụ → Bấm giờ → Ghi nhanh → Vitamin D → 24 giờ qua → Gần đây. Lỗi bấm nút (`actions.error`) hiện ngay dưới Ghi nhanh. Khối "24 giờ qua" chỉ hiện khi đã có dữ liệu log, để không hiện "0p / 0 / 0" lúc đang tải (Đợt 5 thêm `Skeleton`). Lỗi tải log khi chưa có dữ liệu: câu lỗi `role="alert"` thay cho thẻ Gần đây (Đợt 5 làm thẻ lỗi có "Thử lại" theo §10).

- [ ] **Step 1: Viết lại `components/home/HomeScreen.tsx`**

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
import { homeStatTiles, totalsLine } from "@/lib/rules/summaryText";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import { AlertBanners } from "./AlertBanners";
import { HeroCardView } from "./HeroCard";
import { HomeHeader } from "./HomeHeader";
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

      {logs.isError && !logs.data ? (
        <p role="alert" className="px-1 text-danger">
          {toVietnameseError(logs.error)}
        </p>
      ) : (
        <RecentCard
          logs={recentRows}
          now={now}
          nameOf={nameOf}
          pending={pending}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Xóa khối cũ và chữ cũ**

Trong `lib/rules/summaryText.ts`: xóa dòng `import { formatDuration } from "./time";` và toàn bộ code cũ có từ trước Task 1 (`RATING_LABEL`, hằng `LABEL`, hàm `valueText`, hàm `metricText`). File chỉ còn hai import của Task 1 và phần từ `export type HomeStatTile` đến `totalsLine`.

Trong `lib/rules/summaryText.test.ts`: xóa khối `describe("metricText", () => { … });` và đổi dòng import thành:

```ts
import { homeStatTiles, shortDuration, totalsLine } from "./summaryText";
```

Run: `git rm components/home/ActionGrid.tsx components/home/SummaryCard.tsx components/home/RecentList.tsx && ! grep -rnwE "ActionGrid|SummaryCard|RecentList|metricText|RATING_LABEL" app components lib`
Expected: `git rm` báo 3 file; `grep` không in gì (lệnh trả mã 0).

- [ ] **Step 3: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 545 có sẵn − 4 test `metricText` cũ + 5 summaryText + 3 stats + 4 buttons + 5 alerts/sync = 558. Build xong.

- [ ] **Step 4: Kiểm trên trình duyệt**

Run: `bun run dev`, mở `http://localhost:3000/` ở bề rộng 375 px, đăng nhập. **Không bấm nút bấm giờ, nút Ghi nhanh, Bú trái, Bú phải, Đổi bên, Dừng, Ghi Vitamin D, Gọi 115; không lưu sheet nào** (dữ liệu thật).
Expected:

- Thứ tự từ trên xuống: header → (banner nếu có) → thẻ chính → (timer phụ nếu có) → nhãn "BẤM GIỜ" và 5 nút tròn có nhãn dưới → nhãn "GHI NHANH" và lưới 2×2 viên thuốc kính → nút Vitamin D (nếu hôm nay chưa uống) → "24 giờ qua" với 3 ô số và dòng "Bình … ml · Tã bẩn …" → "Gần đây" với link "Tất cả" và tối đa 6 hàng.
- 5 nút tròn nằm vừa một hàng ở 375 px, không tràn ngang; nhãn không bị cắt.
- Bấm "Tất cả" mở `/nhat-ky`; quay lại Trang chủ.
- Không còn lưới nút chữ cũ (Bình, Tã, Tummy time…), không còn emoji.
- Đổi qua Sáng và Tối (Cài đặt → Giao diện, tắt "Ban đêm theo lịch" nếu đang trong giờ đêm), nhìn lại: chữ đọc rõ, ô số có màu đúng. Đặt lại lựa chọn giao diện như ban đầu. Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 5: Commit**

```bash
git add -A components/home lib/rules/summaryText.ts lib/rules/summaryText.test.ts
git commit -m "feat(home): assemble the new Trang chủ blocks"
```

---

## Kết thúc M2 (Đợt 3)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 558 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 3 / M3 (Hoàn tác, rung, checklist bước 26).
