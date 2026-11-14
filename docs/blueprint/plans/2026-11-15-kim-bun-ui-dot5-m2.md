# Kim Bun UI — Đợt 5 / M2 (Tăng trưởng, Tiêm chủng, Phát triển) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm lại ba màn Tăng trưởng, Tiêm chủng, Phát triển theo spec §9 và §10.

- Mỗi màn có `PageHeader` với nút "‹ Khám phá".
- Thẻ kính và `ListGroup` thay khung viền; `Icon` thay emoji ("✓"); `Skeleton` / `ErrorCard` / `EmptyState` thay "Đang tải…" và câu lỗi trơn.
- Danh sách mũi tiêm và danh sách mốc là `ListGroup`.
- Khung cảnh báo nguồn của Tiêm chủng thu thành hàng "Nguồn lịch tiêm" (icon `book`), bấm mở `Sheet` chứa nguyên văn cảnh báo.

**Architecture:**

- Mỗi màn tách phần danh sách thành view không hook, test bằng `renderToStaticMarkup` và duyệt cây. Màn bọc ngoài giữ nguyên hook dữ liệu và luật nghiệp vụ. Các view:
  - `GrowthList`
  - `DoseSections` và `DoseLine` (đổi kiểu)
  - `VaccineSourceRow`
  - `MilestoneItem`
- Không đổi dữ liệu, quyền sửa (`canEdit`), luật lịch tiêm (`buildSchedule`, `quickTickCandidates`, `cleanChoices`), luật mốc (`motorStatus`, `visibleGroups`), biểu đồ WHO (`GrowthChart` giữ nguyên).

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, recharts (đã có), Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 5:**

| Mốc               | Nội dung                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| M1                | `EmptyState`, `ErrorCard`, mở bảng 9 hành động từ mọi trang, Nhật ký, Thống kê. Đã xong trên nhánh `feat/kim-bun-dot5-m1` |
| **M2 (plan này)** | Tăng trưởng, Tiêm chủng, Phát triển                                                                                       |
| M3                | Triệu chứng, Bệnh thường gặp, Bồng bế, Khẩn cấp                                                                           |
| M4                | Nhạc, Ồn trắng, Ảnh, Báo cáo                                                                                              |
| M5                | Đăng nhập, Khai báo bé, Chưa được mời, Cài app, Offline, `AuthGate`; bên trong 3 trang con Cài đặt                        |
| M6                | Trang chủ đang tải / lỗi, dòng đồng bộ dưới header, nhãn `Segmented` xuống dòng, xóa token cũ, checklist cuối             |

**Quyết định cho chỗ spec chưa nói rõ:**

- **Nút thêm:** "+ Thêm lần đo" thành `IconButton` `plus` ở slot phải của `PageHeader`, nhãn "Thêm lần đo". Danh sách trống thì `EmptyState` có nút "Thêm lần đo".
- **Chọn chỉ số:** Cân nặng / Chiều dài / Vòng đầu là `Segmented` (3 lựa chọn), thay nhóm tab cũ.
- **Phần dữ liệu đang tải:** Tăng trưởng và Tiêm chủng hiện 4 `Skeleton` cao 60 (spec §10: 4 hàng list).
- **Ô tick "mũi đã tiêm" ở bước thiết lập Tiêm chủng** đổi thành hàng kính có `Switch`, đúng luật checkbox → `Switch` của §8.3.
- **Ô chọn loại vaccine** (nhiều hơn 4 lựa chọn) giữ `<select>` native với `accent-color`.
- **Dấu đã đạt mốc:** vòng tròn 24 nền `--color-good`, icon `check` màu `--color-bg`. Chưa đạt thì vòng viền 2 px `--color-muted` độ đục 50%.
- **Nhãn trạng thái mốc vận động:** "early" dùng `bg-muted/15 text-ink` thay `bg-soft text-muted` (`text-muted` trên nền này ở Ban đêm chỉ đạt 4,22:1, dưới mức 4,5) (token cũ sẽ bị xóa ở M6).
- **Tiêu đề nhóm:** dùng nhãn nhóm chữ hoa của `ListGroup`:
  - Tiêm chủng: "Quá hạn (2)"…
  - Phát triển: "Mốc vận động lớn" và tên lĩnh vực.

  Tiêu đề "Mốc N tháng" của Phát triển là tiêu đề nhóm 20/700.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Không đổi luồng dữ liệu, quyền sửa, nội dung (`VACCINES`, `MILESTONES`, bảng WHO) và các sheet đã làm ở Đợt 4 (`GrowthSheet`, `DoseSheet`, `MilestoneSheet`).
- Phần cần mạng giữ `OnlineOnly` (chọn loại vaccine, thiết lập lịch tiêm).
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`. Mọi ngày giờ và số đo dùng `tabular-nums`.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay **không bấm Lưu**, không đổi loại vaccine, không đánh dấu mũi hay mốc. "Để sau" ở bước thiết lập chỉ đổi trạng thái trên trang nên được bấm. Mở rồi đóng sheet là được.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot5-m1`):

- Đợt 5 / M1: `EmptyState({ icon, text, action? })`, `ErrorCard({ message, onRetry })`.
- `components/ui/`:
  - `PageHeader({ title, back?, action? })`, `IconButton`, `Button`, `Glass`, `Icon`.
  - `ListGroup({ title?, children })` (vẽ `<section>` + nhãn nhóm `<h2>` chữ hoa + `<ul class="glass …">`).
  - `ListRow`, `Segmented`, `Switch`, `Sheet`, `Skeleton`; `components/ui/testTree.ts` (`findElements`).
- `components/quick/styles.ts`: `FIELD_LABEL`, `FIELD_INPUT`.
- `components/sync/PendingMark.tsx`; `components/OnlineOnly.tsx`.
- `lib/rules/growthForm.ts`: `INDICATORS`, `indicatorValue`, `formatGrowthValue`, `formatZ`, `formatPercentile`, `chartRange`.
- `lib/rules/growth.ts`: `assess`, `curve`, `Assessment`.
- `lib/content/who.ts`: `whoSex`, `LmsRow`, `WhoIndicator`.
- `lib/data/growth.ts`: `useGrowth`, `useWhoTable`.
- `lib/content/vaccines.ts`: `VACCINES`.
- `lib/rules/vaccines.ts`: `STATE_SECTIONS`, `buildSchedule`, `ScheduleItem`, `DoseRecord`, `NOT_TAKING`.
- `lib/rules/vaccineForm.ts`: `cleanChoices`, `doseKey`, `parseChoices`, `toDoseRecords`, `formatDueDate`, `quickTickCandidates`, `DEFAULT_TICKED`.
- `lib/data/vaccines.ts`: `useVaccineDoses`, `useUpdateChoices`, `useVaccineSetup`.
- `lib/content/milestones.ts`: `MILESTONES`.
- `lib/rules/milestones.ts`: `ageInMonths`, `motorStatus`, `visibleGroups`, `MotorState`.
- `lib/data/milestones.ts`: `useMilestones`.
- `lib/rules/time.ts`: `ageDays`, `formatAgeVi`, `vnDateString`.

**Produces:**

- `components/growth/GrowthList.tsx`: `GrowthList({ rows, lms, indicator, dob, pending, canEdit, onOpen })`.
- `components/vaccines/DoseSections.tsx`: `DoseSections({ items, pending, onOpen })`.
- `components/vaccines/VaccineSourceRow.tsx`: `VaccineSourceRow({ text })`.
- `components/vaccines/DoseLine.tsx`, `ChoiceFields.tsx`, `VaccineSetup.tsx`: cùng chữ ký, kiểu mới.
- `components/milestones/MilestoneItem.tsx`: `MilestoneItem({ title, row, pending, disabled, extra?, onOpen })`.
- `GrowthScreen`, `VaccineScreen`, `MilestonesScreen`: cùng chữ ký.

---

### Task 1: Màn Tăng trưởng

**Files:**

- Create: `components/growth/GrowthList.tsx`, `components/growth/growthlist.test.tsx`
- Modify: `components/growth/GrowthScreen.tsx` (viết lại toàn file)

**Interfaces:**

- Consumes: `ListGroup`, `PendingMark`; `INDICATORS`, `indicatorValue`, `formatGrowthValue`, `formatZ`, `formatPercentile`; `assess`, `Assessment`; `LmsRow`, `WhoIndicator`; `formatAgeVi`; `PageHeader`, `IconButton`, `Segmented`, `Glass`, `Skeleton`, `EmptyState`, `ErrorCard`.
- Produces: `GrowthList({ rows: GrowthRow[]; lms: LmsRow[] | undefined; indicator: WhoIndicator; dob: string; pending: Set<string>; canEdit: (row: GrowthRow) => boolean; onOpen: (row: GrowthRow) => void })`.

- [ ] **Step 1: Viết test hỏng**

`components/growth/growthlist.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { formatGrowthValue } from "@/lib/rules/growthForm";
import type { GrowthRow } from "@/lib/supabase/rows";
import { GrowthList } from "./GrowthList";

const row = (id: string, by: string): GrowthRow =>
  ({
    id,
    baby_id: "b1",
    measured_on: "2026-11-01",
    weight_g: 5200,
    length_cm: 58.5,
    head_cm: null,
    created_by: by,
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
  }) as GrowthRow;

const props = (over: Partial<Parameters<typeof GrowthList>[0]> = {}) => ({
  rows: [row("g1", "u1"), row("g2", "u2")],
  lms: undefined,
  indicator: "wfa" as const,
  dob: "2026-09-10",
  pending: new Set(["g1"]),
  canEdit: (r: GrowthRow) => r.created_by === "u1",
  onOpen: () => {},
  ...over,
});

describe("GrowthList", () => {
  it("a glass list titled Các lần đo: date, age and each measured value", () => {
    const html = renderToStaticMarkup(<GrowthList {...props()} />);
    expect(html).toContain(">Các lần đo</h2>");
    expect(html).toContain("glass");
    expect(html).toContain("01/11/2026 · ");
    expect(html).toContain(">Cân nặng:</span>");
    expect(html).toContain(`>${formatGrowthValue("wfa", 5.2)}</span>`);
    expect(html).toContain(`>${formatGrowthValue("lhfa", 58.5)}</span>`);
    expect(html).not.toContain(">Vòng đầu:</span>");
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
    expect(html.match(/disabled=""/g)).toHaveLength(1);
  });

  it("opens a row its owner may edit", () => {
    const onOpen = vi.fn();
    const p = props({ onOpen });
    const [first] = findElements(GrowthList(p), (el) => el.type === "button");
    (first.props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledWith(p.rows[0]);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/growth/growthlist.test.tsx`
Expected: FAIL — `Cannot find module './GrowthList'`.

- [ ] **Step 3: Viết `components/growth/GrowthList.tsx`**

```tsx
import { PendingMark } from "@/components/sync/PendingMark";
import { ListGroup } from "@/components/ui/ListGroup";
import type { LmsRow, WhoIndicator } from "@/lib/content/who";
import { assess, type Assessment } from "@/lib/rules/growth";
import {
  formatGrowthValue,
  formatPercentile,
  formatZ,
  indicatorValue,
  INDICATORS,
} from "@/lib/rules/growthForm";
import { formatAgeVi } from "@/lib/rules/time";
import type { GrowthRow } from "@/lib/supabase/rows";

const LEVEL_CLASS = {
  green: "bg-good-soft text-good-ink",
  yellow: "bg-warn-soft text-warn-ink",
  red: "bg-danger-soft text-danger-ink",
} as const;

function MeasureLine({
  title,
  text,
  result,
  shown,
}: {
  title: string;
  text: string;
  result: Assessment | null | undefined;
  shown: boolean;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-[15px]">
      <span className="text-muted">{title}:</span>
      <span className="text-ink tabular-nums">{text}</span>
      {shown &&
        result !== undefined &&
        (result ? (
          <span
            className={`rounded-full px-2 text-[13px] font-semibold tabular-nums ${LEVEL_CLASS[result.level]}`}
          >
            z {formatZ(result.z)} · {formatPercentile(result.percentile)}
            {result.text ? ` · ${result.text}` : ""}
          </span>
        ) : (
          <span className="text-[13px] text-muted">Ngoài bảng WHO</span>
        ))}
    </span>
  );
}

// Spec §9 Tăng trưởng: the measurements as a glass list.
export function GrowthList({
  rows,
  lms,
  indicator,
  dob,
  pending,
  canEdit,
  onOpen,
}: {
  rows: GrowthRow[];
  lms: LmsRow[] | undefined;
  indicator: WhoIndicator;
  dob: string;
  pending: Set<string>;
  canEdit: (row: GrowthRow) => boolean;
  onOpen: (row: GrowthRow) => void;
}) {
  return (
    <ListGroup title="Các lần đo">
      {rows.map((row) => (
        <li key={row.id} className="border-b border-line last:border-b-0">
          <button
            type="button"
            disabled={!canEdit(row)}
            onClick={() => onOpen(row)}
            className="flex min-h-[52px] w-full flex-col gap-1 px-4 py-2.5 text-left disabled:opacity-100"
          >
            <span className="text-base font-semibold text-ink tabular-nums">
              {row.measured_on.split("-").reverse().join("/")} ·{" "}
              {formatAgeVi(dob, new Date(`${row.measured_on}T05:00:00Z`))}{" "}
              <PendingMark pending={pending.has(row.id)} />
            </span>
            {INDICATORS.map((item) => {
              const value = indicatorValue(row, item.key);
              if (value === null) return null;
              // undefined: table not loaded yet; null: outside 0..1856 days.
              const result = lms
                ? assess(lms, dob, row.measured_on, value)
                : undefined;
              return (
                <MeasureLine
                  key={item.key}
                  title={item.title}
                  text={formatGrowthValue(item.key, value)}
                  result={result}
                  shown={item.key === indicator}
                />
              );
            })}
          </button>
        </li>
      ))}
    </ListGroup>
  );
}
```

- [ ] **Step 4: Viết lại `components/growth/GrowthScreen.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Glass } from "@/components/ui/Glass";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { whoSex, type LmsRow, type WhoIndicator } from "@/lib/content/who";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { curve } from "@/lib/rules/growth";
import { chartRange, indicatorValue, INDICATORS } from "@/lib/rules/growthForm";
import { ageDays } from "@/lib/rules/time";
import type { Baby, GrowthRow } from "@/lib/supabase/rows";
import { GrowthList } from "./GrowthList";
import { GrowthSheet } from "./GrowthSheet";

function ChartUnavailable() {
  return <p className="h-72 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
}

const GrowthChart = dynamic(
  () =>
    import("./GrowthChart")
      .then((m) => m.GrowthChart)
      .catch(() => ChartUnavailable),
  { ssr: false, loading: () => <div className="h-72" /> },
);

const INDICATOR_OPTIONS = INDICATORS.map((item) => ({
  value: item.key,
  label: item.title,
}));

export function GrowthScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const growth = useGrowth(baby.id);
  const sex = whoSex(baby.sex);
  const [indicator, setIndicator] = useState<WhoIndicator>("wfa");
  const table = useWhoTable(indicator, sex);
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "growth"));
  const [sheet, setSheet] = useState<{ row: GrowthRow | null } | null>(null);

  const rows = growth.data ?? [];
  const lms = table.data?.rows as LmsRow[] | undefined;
  const range = chartRange(ageDays(baby.dob, new Date()));
  const current = INDICATORS.find((i) => i.key === indicator)!;
  const points = rows.flatMap((row) => {
    const value = indicatorValue(row, indicator);
    const days = Math.round(
      (Date.parse(row.measured_on) - Date.parse(baby.dob)) / 86_400_000,
    );
    return value === null ? [] : [{ day: days, value }];
  });
  const canEdit = (row: GrowthRow) => isOwner || row.created_by === userId;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Tăng trưởng"
        back={{ href: "/kham-pha", label: "Khám phá" }}
        action={
          <IconButton
            label="Thêm lần đo"
            icon="plus"
            onClick={() => setSheet({ row: null })}
          />
        }
      />
      <Segmented
        label="Chỉ số"
        options={INDICATOR_OPTIONS}
        value={indicator}
        onChange={setIndicator}
      />
      <Glass className="p-3">
        {lms ? (
          <GrowthChart
            curve={curve(lms, 0, range.to, range.step)}
            points={points}
            to={range.to}
            unit={indicator === "wfa" ? "kg" : "cm"}
          />
        ) : table.isError ? (
          <ChartUnavailable />
        ) : (
          <Skeleton className="h-72" />
        )}
      </Glass>
      <p className="px-1 text-[13px] text-muted">
        Đường WHO P3, P15, P50 (đậm), P85, P97 cho{" "}
        {sex === "girls" ? "bé gái" : "bé trai"}; chấm là các lần đo của bé.
        Nguồn: WHO Child Growth Standards.
      </p>
      {growth.isPending ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[60px]" />
          ))}
        </div>
      ) : growth.isError && !growth.data ? (
        <ErrorCard
          message={toVietnameseError(growth.error)}
          onRetry={() => void growth.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="ruler"
          text="Chưa có lần đo nào."
          action={{
            label: "Thêm lần đo",
            onClick: () => setSheet({ row: null }),
          }}
        />
      ) : (
        <>
          <GrowthList
            rows={rows}
            lms={lms}
            indicator={indicator}
            dob={baby.dob}
            pending={pending}
            canEdit={canEdit}
            onOpen={(row) => setSheet({ row })}
          />
          <p className="px-1 text-[13px] text-muted">
            z-score và phân vị là của chỉ số đang chọn (
            {current.title.toLowerCase()}).
          </p>
        </>
      )}
      {sheet && (
        <GrowthSheet
          babyId={baby.id}
          userId={userId}
          dob={baby.dob}
          row={sheet.row}
          canDelete={sheet.row ? canEdit(sheet.row) : false}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/growth lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (growthlist 2, growthsheet giữ nguyên 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/growth/GrowthList.tsx components/growth/growthlist.test.tsx components/growth/GrowthScreen.tsx
git commit -m "feat(growth): glass Tăng trưởng with list states"
```

---

### Task 2: Danh sách mũi tiêm và hàng "Nguồn lịch tiêm"

**Files:**

- Create: `components/vaccines/DoseSections.tsx`, `components/vaccines/VaccineSourceRow.tsx`, `components/vaccines/doses.test.tsx`
- Modify: `components/vaccines/DoseLine.tsx` (viết lại toàn file)

**Interfaces:**

- Consumes: `ListGroup`, `ListRow`, `Sheet`; `PendingMark`; `STATE_SECTIONS`, `ScheduleItem`; `doseKey`, `formatDueDate`; `findElements`.
- Produces: `DoseSections({ items: ScheduleItem[]; pending: Set<string>; onOpen: (item: ScheduleItem) => void })`, `VaccineSourceRow({ text: string })`, `DoseLine({ item, pending })` (cùng chữ ký).

Spec §9: danh sách mũi tiêm là `ListGroup`. Khung cảnh báo nguồn thu thành hàng "Nguồn lịch tiêm" (icon `book`), bấm thì mở `Sheet` chứa nguyên văn cảnh báo.

- [ ] **Step 1: Viết test hỏng**

`components/vaccines/doses.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import { ICON_PATHS } from "@/lib/ui/icons";
import { DoseSections } from "./DoseSections";
import { VaccineSourceRow } from "./VaccineSourceRow";

const item = (code: string, state: string, over: Partial<ScheduleItem> = {}) =>
  ({
    dose: {
      code,
      doseNo: 1,
      name: `Mũi ${code}`,
      protects: ["X"],
      program: "tcmr",
    },
    due: "2026-11-20",
    state,
    record: null,
    unchosen: false,
    pastMaxAge: false,
    ...over,
  }) as unknown as ScheduleItem;

describe("DoseSections", () => {
  it("one glass group per state with a count, rows with name, date and labels", () => {
    const items = [
      item("bcg", "overdue"),
      item("rota", "overdue", { unchosen: true, pastMaxAge: true }),
      item("mmr", "later"),
    ];
    const html = renderToStaticMarkup(
      <DoseSections
        items={items}
        pending={new Set(["bcg#1"])}
        onOpen={() => {}}
      />,
    );
    expect(html).toContain(">Quá hạn (2)</h2>");
    expect(html).toContain(">Sau này (1)</h2>");
    expect(html).not.toContain("Đã tiêm (");
    expect(html.match(/class="glass/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain(">Mũi bcg ");
    expect(html).toContain("Hẹn ");
    expect(html).toContain("Tiêm chủng mở rộng");
    expect(html).toContain(">Chưa chọn loại</span>");
    expect(html).toContain("Đã quá tuổi khuyến cáo");
    expect(html.match(/aria-label="Chờ đồng bộ"/g)).toHaveLength(1);
  });

  it("opens the tapped dose", () => {
    const onOpen = vi.fn();
    const items = [item("bcg", "upcoming")];
    const [row] = findElements(
      DoseSections({ items, pending: new Set(), onOpen }),
      (el) => el.type === "button",
    );
    (row.props.onClick as () => void)();
    expect(onOpen).toHaveBeenCalledWith(items[0]);
  });
});

describe("VaccineSourceRow", () => {
  it("a book row that opens a sheet with the full source note", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <VaccineSourceRow text="Lịch tham khảo theo Thông tư." />
      </QueryClientProvider>,
    );
    expect(html).toContain(">Nguồn lịch tiêm</span>");
    expect(html).toContain(`d="${ICON_PATHS.book}"`);
    expect(html).toContain("<dialog");
    expect(html).toContain(">Lịch tham khảo theo Thông tư.</p>");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/vaccines/doses.test.tsx`
Expected: FAIL — `Cannot find module './DoseSections'`.

- [ ] **Step 3: Viết lại `components/vaccines/DoseLine.tsx`**

```tsx
import { PendingMark } from "@/components/sync/PendingMark";
import { formatDueDate } from "@/lib/rules/vaccineForm";
import type { ScheduleItem } from "@/lib/rules/vaccines";

export function DoseLine({
  item,
  pending,
}: {
  item: ScheduleItem;
  pending: boolean;
}) {
  const { dose, record } = item;
  const when =
    item.state === "done"
      ? record?.given_on
        ? `Đã tiêm ${formatDueDate(record.given_on)}`
        : "Đã tiêm"
      : item.state === "skipped"
        ? "Đã bỏ qua"
        : `Hẹn ${formatDueDate(item.due)}`;
  return (
    <>
      <span className="text-base font-medium text-ink">
        {dose.name} <PendingMark pending={pending} />
      </span>
      <span className="text-[13px] text-muted tabular-nums">
        {when} · {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
      </span>
      {item.unchosen && (
        <span className="mt-0.5 rounded-full bg-muted/15 px-2 text-[13px] text-ink">
          Chưa chọn loại
        </span>
      )}
      {item.pastMaxAge && (
        <span className="text-[13px] text-danger">
          Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ.
        </span>
      )}
      {dose.note && item.state !== "done" && (
        <span className="text-[13px] text-muted">{dose.note}</span>
      )}
    </>
  );
}
```

- [ ] **Step 4: Viết `components/vaccines/DoseSections.tsx`**

```tsx
import { ListGroup } from "@/components/ui/ListGroup";
import { doseKey } from "@/lib/rules/vaccineForm";
import { STATE_SECTIONS, type ScheduleItem } from "@/lib/rules/vaccines";
import { DoseLine } from "./DoseLine";

// Spec §9 Tiêm chủng: one ListGroup per state, in STATE_SECTIONS order.
export function DoseSections({
  items,
  pending,
  onOpen,
}: {
  items: ScheduleItem[];
  pending: Set<string>;
  onOpen: (item: ScheduleItem) => void;
}) {
  return (
    <>
      {STATE_SECTIONS.map((section) => {
        const list = items.filter((item) => item.state === section.state);
        if (list.length === 0) return null;
        return (
          <ListGroup
            key={section.state}
            title={`${section.title} (${list.length})`}
          >
            {list.map((item) => {
              const key = doseKey(item.dose.code, item.dose.doseNo);
              return (
                <li key={key} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className="flex min-h-[52px] w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left"
                  >
                    <DoseLine item={item} pending={pending.has(key)} />
                  </button>
                </li>
              );
            })}
          </ListGroup>
        );
      })}
    </>
  );
}
```

- [ ] **Step 5: Viết `components/vaccines/VaccineSourceRow.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { Sheet } from "@/components/ui/Sheet";

// Spec §9: the source disclaimer folds into one row that opens a sheet with the full text.
export function VaccineSourceRow({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListGroup>
        <ListRow
          label="Nguồn lịch tiêm"
          icon="book"
          iconColor="muted"
          onClick={() => setOpen(true)}
        />
      </ListGroup>
      <Sheet open={open} onClose={() => setOpen(false)} title="Nguồn lịch tiêm">
        <p className="pb-2 text-base leading-6 text-ink">{text}</p>
      </Sheet>
    </>
  );
}
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components/vaccines lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (doses 3, dosesheet giữ nguyên 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 7: Commit**

```bash
git add components/vaccines/DoseLine.tsx components/vaccines/DoseSections.tsx components/vaccines/VaccineSourceRow.tsx components/vaccines/doses.test.tsx
git commit -m "feat(vaccines): dose list groups and source row"
```

---

### Task 3: Thiết lập và chọn loại vaccine; màn Tiêm chủng

**Files:**

- Create: `components/vaccines/setup.test.tsx`
- Modify: `components/vaccines/ChoiceFields.tsx`, `components/vaccines/VaccineSetup.tsx`, `components/vaccines/VaccineScreen.tsx` (viết lại cả ba file)

**Interfaces:**

- Consumes: `DoseSections`, `VaccineSourceRow` (Task 2); `PageHeader`, `Button`, `Switch`, `Skeleton`, `ErrorCard`; `FIELD_LABEL`, `FIELD_INPUT`; `OnlineOnly`; dữ liệu và luật vaccine có sẵn.
- Produces: `ChoiceFields`, `VaccineSetup`, `VaccineScreen` cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/vaccines/setup.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { VACCINES } from "@/lib/content/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";
import { VaccineSetup } from "./VaccineSetup";

describe("ChoiceFields", () => {
  it("one native select per group with the field styles", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <ChoiceFields groups={VACCINES.groups} value={{}} onChange={onChange} />,
    );
    expect(html.match(/<select/g)).toHaveLength(VACCINES.groups.length);
    expect(html).toContain("accent-accent");
    expect(html).toContain(">Chưa chọn</option>");
    expect(html).toContain(">Không tiêm</option>");
    expect(html).not.toContain("rounded-xl border");
  });
});

describe("VaccineSetup", () => {
  it("switch rows for doses already due, Lưu and Để sau", () => {
    const baby = {
      id: "b1",
      family_id: "f1",
      name: "Bun",
      dob: "2026-01-01",
    } as Baby;
    const onLater = vi.fn();
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <VaccineSetup
          baby={baby}
          userId="u1"
          records={[]}
          initialChoices={{}}
          onDone={() => {}}
          onLater={onLater}
        />
      </QueryClientProvider>,
    );
    expect(html).toContain('role="switch"');
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain(">Lưu</button>");
    expect(html).toContain(">Để sau</button>");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/vaccines/setup.test.tsx`
Expected: FAIL — `ChoiceFields` cũ có `rounded-xl border`, không có `accent-accent`; `VaccineSetup` cũ dùng `type="checkbox"` (2 test hỏng).

- [ ] **Step 3: Viết lại `components/vaccines/ChoiceFields.tsx`**

```tsx
"use client";

import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import type { VaccineGroup } from "@/lib/content/vaccineSchema";
import { NOT_TAKING } from "@/lib/rules/vaccines";

export function ChoiceFields({
  groups,
  value,
  onChange,
}: {
  groups: VaccineGroup[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <label key={group.code} className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>{group.name}</span>
          <select
            className={`${FIELD_INPUT} accent-accent`}
            value={value[group.code] ?? ""}
            onChange={(event) =>
              onChange({ ...value, [group.code]: event.target.value })
            }
          >
            <option value="">Chưa chọn</option>
            {group.series.map((series) => (
              <option key={series.code} value={series.code}>
                {series.name}
              </option>
            ))}
            <option value={NOT_TAKING}>Không tiêm</option>
          </select>
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Viết lại `components/vaccines/VaccineSetup.tsx`**

```tsx
"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { VACCINES } from "@/lib/content/vaccines";
import { toVietnameseError } from "@/lib/data/errors";
import { useVaccineSetup } from "@/lib/data/vaccines";
import { vnDateString } from "@/lib/rules/time";
import {
  cleanChoices,
  DEFAULT_TICKED,
  doseKey,
  formatDueDate,
  quickTickCandidates,
} from "@/lib/rules/vaccineForm";
import { buildSchedule, type DoseRecord } from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";

// Spec gốc §6.1: pick a series per group, then tick the doses already given.
export function VaccineSetup({
  baby,
  userId,
  records,
  initialChoices,
  onDone,
  onLater,
}: {
  baby: Baby;
  userId: string;
  records: DoseRecord[];
  initialChoices: Record<string, string>;
  onDone: () => void;
  onLater: () => void;
}) {
  const setup = useVaccineSetup(baby.id, userId);
  const [draft, setDraft] = useState(initialChoices);
  const [ticked, setTicked] = useState(() => new Set(DEFAULT_TICKED));
  const candidates = quickTickCandidates(
    buildSchedule({
      doses: VACCINES.doses,
      choices: cleanChoices(VACCINES.groups, draft),
      dob: baby.dob,
      records,
      today: vnDateString(new Date()),
    }),
  );

  function toggle(key: string, on: boolean) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function save() {
    setup.mutate(
      {
        choices: cleanChoices(VACCINES.groups, draft),
        ticked: candidates
          .filter((item) =>
            ticked.has(doseKey(item.dose.code, item.dose.doseNo)),
          )
          .map((item) => ({ code: item.dose.code, doseNo: item.dose.doseNo })),
      },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <OnlineOnly>
        <p className="text-[15px] text-muted">
          Chọn loại vaccine gia đình định tiêm cho từng nhóm. Chọn "Không tiêm"
          nếu không tiêm nhóm đó; để "Chưa chọn" nếu chưa quyết định.
        </p>
        <ChoiceFields
          groups={VACCINES.groups}
          value={draft}
          onChange={setDraft}
        />
        {candidates.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 px-1 text-[13px] font-semibold text-muted">
              Mũi đã đến hạn trước hôm nay, đánh dấu mũi bé đã tiêm
            </legend>
            {candidates.map((item) => {
              const key = doseKey(item.dose.code, item.dose.doseNo);
              return (
                <div
                  key={key}
                  className="glass flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] px-4 py-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base text-ink">{item.dose.name}</span>
                    <span className="text-[13px] text-muted tabular-nums">
                      Hẹn {formatDueDate(item.due)}
                    </span>
                  </span>
                  <Switch
                    checked={ticked.has(key)}
                    label={item.dose.name}
                    onChange={(on) => toggle(key, on)}
                  />
                </div>
              );
            })}
          </fieldset>
        )}
        <Button block busy={setup.isPending} onClick={save}>
          Lưu
        </Button>
      </OnlineOnly>
      {setup.isError && (
        <p role="alert" className="text-[15px] text-danger">
          {toVietnameseError(setup.error)}
        </p>
      )}
      <Button variant="secondary" block onClick={onLater}>
        Để sau
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Viết lại `components/vaccines/VaccineScreen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { VACCINES } from "@/lib/content/vaccines";
import { toVietnameseError } from "@/lib/data/errors";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useUpdateChoices, useVaccineDoses } from "@/lib/data/vaccines";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { vnDateString } from "@/lib/rules/time";
import {
  cleanChoices,
  parseChoices,
  toDoseRecords,
} from "@/lib/rules/vaccineForm";
import { buildSchedule, type ScheduleItem } from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";
import { ChoiceFields } from "./ChoiceFields";
import { DoseSections } from "./DoseSections";
import { DoseSheet } from "./DoseSheet";
import { VaccineSetup } from "./VaccineSetup";
import { VaccineSourceRow } from "./VaccineSourceRow";

const SECTION_TITLE = "px-1 text-xl leading-[26px] font-bold text-ink";

export function VaccineScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const doses = useVaccineDoses(baby.id);
  const pending = pendingRowIds(
    entriesFor(useOutboxEntries(userId), "vaccine_doses"),
  );
  const choices = parseChoices(baby.vaccine_choices);
  const [setupLater, setSetupLater] = useState(false);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<ScheduleItem | null>(null);

  const header = (
    <PageHeader
      title="Tiêm chủng"
      back={{ href: "/kham-pha", label: "Khám phá" }}
    />
  );

  if (doses.data === undefined)
    return (
      <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
        {header}
        {doses.isError ? (
          <ErrorCard
            message={toVietnameseError(doses.error)}
            onRetry={() => void doses.refetch()}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[60px]" />
            ))}
          </div>
        )}
      </main>
    );

  const rows = doses.data;
  const records = toDoseRecords(rows);
  const items = buildSchedule({
    doses: VACCINES.doses,
    choices,
    dob: baby.dob,
    records,
    today: vnDateString(new Date()),
  });
  const unchosen = VACCINES.groups.filter(
    (group) => cleanChoices([group], choices)[group.code] === undefined,
  ).length;
  const needsSetup =
    isOwner && Object.keys(choices).length === 0 && !setupLater;
  const rowFor = (item: ScheduleItem) =>
    rows.find(
      (row) =>
        row.vaccine_code === item.dose.code && row.dose_no === item.dose.doseNo,
    ) ?? null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      {header}
      <VaccineSourceRow text={VACCINES.disclaimer} />
      {needsSetup ? (
        <section className="flex flex-col gap-3">
          <h2 className={SECTION_TITLE}>Thiết lập lịch tiêm</h2>
          <VaccineSetup
            baby={baby}
            userId={userId}
            records={records}
            initialChoices={choices}
            onDone={() => setSetupLater(true)}
            onLater={() => setSetupLater(true)}
          />
        </section>
      ) : (
        <ChoicesSection
          baby={baby}
          choices={choices}
          isOwner={isOwner}
          unchosen={unchosen}
          editing={editing}
          setEditing={setEditing}
        />
      )}
      <DoseSections
        items={items}
        pending={pending}
        onOpen={(item) => setOpen(item)}
      />
      {open && (
        <DoseSheet
          item={open}
          row={rowFor(open)}
          babyId={baby.id}
          userId={userId}
          dob={baby.dob}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}

function ChoicesSection({
  baby,
  choices,
  isOwner,
  unchosen,
  editing,
  setEditing,
}: {
  baby: Baby;
  choices: Record<string, string>;
  isOwner: boolean;
  unchosen: number;
  editing: boolean;
  setEditing: (on: boolean) => void;
}) {
  const update = useUpdateChoices(baby.id);
  const [draft, setDraft] = useState(choices);

  if (!editing)
    return (
      <section className="flex flex-col gap-2.5">
        {unchosen > 0 && (
          <p className="px-1 text-[15px] text-muted">
            Còn {unchosen} nhóm chưa chọn loại vaccine. Mũi của các nhóm này
            hiện nhãn "Chưa chọn loại" và không có nhắc lịch.
          </p>
        )}
        {isOwner ? (
          <Button
            variant="secondary"
            block
            onClick={() => {
              setDraft(choices);
              setEditing(true);
            }}
          >
            Chọn loại vaccine
          </Button>
        ) : (
          unchosen > 0 && (
            <p className="px-1 text-[15px] text-muted">
              Chỉ chủ gia đình đổi được loại vaccine.
            </p>
          )
        )}
      </section>
    );

  return (
    <section className="flex flex-col gap-3">
      <h2 className={SECTION_TITLE}>Loại vaccine</h2>
      <OnlineOnly>
        <ChoiceFields
          groups={VACCINES.groups}
          value={draft}
          onChange={setDraft}
        />
        <Button
          block
          busy={update.isPending}
          onClick={() =>
            update.mutate(cleanChoices(VACCINES.groups, draft), {
              onSuccess: () => setEditing(false),
            })
          }
        >
          Lưu
        </Button>
      </OnlineOnly>
      {update.isError && (
        <p role="alert" className="text-[15px] text-danger">
          {toVietnameseError(update.error)}
        </p>
      )}
      <Button variant="secondary" block onClick={() => setEditing(false)}>
        Đóng
      </Button>
    </section>
  );
}
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test components/vaccines lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (setup 2, doses 3, dosesheet 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 7: Commit**

```bash
git add components/vaccines
git commit -m "feat(vaccines): glass Tiêm chủng, setup switches and choice fields"
```

---

### Task 4: Màn Phát triển; kiểm toàn bộ

**Files:**

- Create: `components/milestones/MilestoneItem.tsx`, `components/milestones/milestoneitem.test.tsx`
- Modify: `components/milestones/MilestonesScreen.tsx` (viết lại toàn file)

**Interfaces:**

- Consumes: `ListGroup`, `PageHeader`, `Button`, `ErrorCard`, `Icon`, `PendingMark`; `MILESTONES`; `ageInMonths`, `motorStatus`, `visibleGroups`, `MotorState`; `useMilestones`; `ageDays`; `toVietnameseError`.
- Produces: `MilestoneItem({ title: string; row: MilestoneRow | undefined; pending: boolean; disabled: boolean; extra?: ReactNode; onOpen: () => void })`.

Spec §9: danh sách mốc là `ListGroup`; `Icon` thay emoji ("✓").

- [ ] **Step 1: Viết test hỏng**

`components/milestones/milestoneitem.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { MilestoneRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { MilestoneItem } from "./MilestoneItem";

const row = {
  id: "m1",
  baby_id: "b1",
  milestone_code: "smile",
  achieved_on: "2026-11-01",
  note: "cười với mẹ",
  photo_id: "p1",
  created_by: "u1",
  created_at: "2026-11-01T00:00:00.000Z",
} as MilestoneRow;

describe("MilestoneItem", () => {
  it("achieved: a filled check icon, no emoji, and the date with note and photo", () => {
    const html = renderToStaticMarkup(
      <ul>
        <MilestoneItem
          title="Cười đáp lại"
          row={row}
          pending
          disabled={false}
          onOpen={() => {}}
        />
      </ul>,
    );
    expect(html).toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain("bg-good");
    expect(html).not.toContain("✓");
    expect(html).toContain(">Cười đáp lại ");
    expect(html).toContain("Đạt ngày 01/11/2026 · cười với mẹ · có ảnh");
    expect(html).toContain('aria-label="Chờ đồng bộ"');
  });

  it("not yet: an empty ring, extra content, and a tap opens the sheet", () => {
    const onOpen = vi.fn();
    const html = renderToStaticMarkup(
      <ul>
        <MilestoneItem
          title="Lật"
          row={undefined}
          pending={false}
          disabled={false}
          extra={<span>Thường 4–6 tháng</span>}
          onOpen={onOpen}
        />
      </ul>,
    );
    expect(html).not.toContain(`d="${ICON_PATHS.check}"`);
    expect(html).toContain("border-muted");
    expect(html).toContain("<span>Thường 4–6 tháng</span>");
    const element = MilestoneItem({
      title: "Lật",
      row: undefined,
      pending: false,
      disabled: false,
      onOpen,
    });
    const button = element.props.children as { props: { onClick: () => void } };
    button.props.onClick();
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/milestones/milestoneitem.test.tsx`
Expected: FAIL — `Cannot find module './MilestoneItem'`.

- [ ] **Step 3: Viết `components/milestones/MilestoneItem.tsx`**

```tsx
import type { ReactNode } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { Icon } from "@/components/ui/Icon";
import type { MilestoneRow } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";

// One milestone row inside a ListGroup (spec §9 Phát triển). The check is an icon, not "✓".
export function MilestoneItem({
  title,
  row,
  pending,
  disabled,
  extra,
  onOpen,
}: {
  title: string;
  row: MilestoneRow | undefined;
  pending: boolean;
  disabled: boolean;
  extra?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        className="flex min-h-[52px] w-full items-start gap-3 px-4 py-2.5 text-left disabled:opacity-100"
      >
        <span
          aria-hidden="true"
          className={cx(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
            row ? "bg-good text-bg" : "border-2 border-muted/50",
          )}
        >
          {row && <Icon name="check" size={14} strokeWidth={3} />}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-base text-ink">
            {title} <PendingMark pending={pending} />
          </span>
          {row && (
            <span className="text-[13px] text-muted tabular-nums">
              Đạt ngày {row.achieved_on.split("-").reverse().join("/")}
              {row.note ? ` · ${row.note}` : ""}
              {row.photo_id ? " · có ảnh" : ""}
            </span>
          )}
          {extra}
        </span>
      </button>
    </li>
  );
}
```

- [ ] **Step 4: Viết lại `components/milestones/MilestonesScreen.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { MILESTONES } from "@/lib/content/milestones";
import { toVietnameseError } from "@/lib/data/errors";
import { useMilestones } from "@/lib/data/milestones";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import {
  ageInMonths,
  motorStatus,
  visibleGroups,
  type MotorState,
} from "@/lib/rules/milestones";
import { ageDays } from "@/lib/rules/time";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { MilestoneItem } from "./MilestoneItem";
import { MilestoneSheet } from "./MilestoneSheet";

const STATE_CLASS: Record<MotorState, string> = {
  done: "bg-good-soft text-good-ink",
  early: "bg-muted/15 text-ink",
  window: "bg-accent-soft text-accent-ink",
  late: "bg-warn-soft text-warn-ink",
};

export function MilestonesScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const marks = useMilestones(baby.id);
  const pending = pendingRowIds(
    entriesFor(useOutboxEntries(userId), "milestones_achieved"),
  );
  const months = ageInMonths(ageDays(baby.dob, new Date()));
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<{ code: string; title: string } | null>(
    null,
  );
  const byCode = new Map((marks.data ?? []).map((m) => [m.milestone_code, m]));
  const groups = showAll
    ? MILESTONES.groups
    : visibleGroups(MILESTONES.groups, months);
  const canEdit = (row: MilestoneRow | undefined) =>
    !row || isOwner || row.created_by === userId;

  const item = (code: string, title: string, extra?: React.ReactNode) => {
    const row = byCode.get(code);
    return (
      <MilestoneItem
        key={code}
        title={title}
        row={row}
        pending={pending.has(code)}
        disabled={!canEdit(row)}
        extra={extra}
        onOpen={() => setOpen({ code, title })}
      />
    );
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title={MILESTONES.title}
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <p className="px-1 text-[15px] text-muted">{MILESTONES.intro}</p>
      {marks.isError && !marks.data && (
        <ErrorCard
          message={toVietnameseError(marks.error)}
          onRetry={() => void marks.refetch()}
        />
      )}
      <ListGroup title="Mốc vận động lớn">
        {MILESTONES.motor.map((m) => {
          const status = motorStatus(m, months, byCode.has(m.code));
          return item(
            m.code,
            m.name,
            status.state === "done" ? null : (
              <span
                className={`mt-1 self-start rounded-full px-2 text-[13px] font-semibold ${STATE_CLASS[status.state]}`}
              >
                {status.text}
              </span>
            ),
          );
        })}
      </ListGroup>
      {groups.map((group) => (
        <section key={group.months} className="flex flex-col gap-3">
          <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
            Mốc {group.months} tháng
          </h2>
          {(["social", "language", "cognitive", "movement"] as const).map(
            (domain) => {
              const list = group.items.filter((i) => i.domain === domain);
              if (list.length === 0) return null;
              return (
                <ListGroup key={domain} title={MILESTONES.domains[domain]}>
                  {list.map((i) => item(i.code, i.text))}
                </ListGroup>
              );
            },
          )}
          <div className="rounded-[22px] bg-warn-soft p-4 text-[15px] text-warn-ink">
            <p className="font-semibold">Khi nào nên hỏi bác sĩ</p>
            <ul className="mt-1 list-disc pl-5">
              {group.askDoctor.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <a
            href={group.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center px-1 text-[13px] text-muted underline"
          >
            Nguồn: CDC
          </a>
        </section>
      ))}
      <Button variant="secondary" block onClick={() => setShowAll(!showAll)}>
        {showAll ? "Chỉ xem tháng hiện tại và kế tiếp" : "Xem tất cả các mốc"}
      </Button>
      {open && (
        <MilestoneSheet
          code={open.code}
          title={open.title}
          row={byCode.get(open.code) ?? null}
          baby={baby}
          userId={userId}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 612 có sẵn + 2 growthlist + 3 doses + 2 setup + 2 milestoneitem = 621. Build xong.

- [ ] **Step 6: Kiểm trên trình duyệt (không ghi dữ liệu)**

Run: `bun run dev`, mở `http://localhost:3000` ở bề rộng 375 px, đăng nhập. **Không bấm Lưu, không đổi loại vaccine, không đánh dấu mũi hay mốc.**
Expected:

- **Khám phá → Tăng trưởng:**
  - Có nút "‹ Khám phá", tiêu đề lớn, nút tròn "+" bên phải.
  - Có `Segmented` Cân nặng / Chiều dài / Vòng đầu; bấm đổi được, biểu đồ đổi theo.
  - Biểu đồ nằm trong thẻ kính.
  - "CÁC LẦN ĐO" là danh sách kính, hoặc icon thước kẻ và "Chưa có lần đo nào." kèm nút "Thêm lần đo".
  - Bấm nút "+": sheet "Thêm lần đo" mở; đóng nó.
- **Khám phá → Tiêm chủng:**
  - Có nút "‹ Khám phá" và hàng "Nguồn lịch tiêm" có icon sách. Bấm hàng đó: sheet chứa nguyên văn cảnh báo; đóng nó.
  - Nếu hiện bước thiết lập: các ô chọn loại vaccine có viền kính, các mũi đến hạn là hàng có công tắc, có "Lưu" và "Để sau". Bấm "Để sau" (chỉ đổi trên trang).
  - Danh sách mũi chia nhóm "QUÁ HẠN (N)", "SẮP TỚI …"; bấm một mũi mở sheet mũi tiêm, rồi đóng.
- **Khám phá → Phát triển:**
  - Có nút "‹ Khám phá" và nhóm "MỐC VẬN ĐỘNG LỚN" dạng kính.
  - Mốc đã đạt có vòng xanh với dấu tích (icon, không phải ký tự "✓"); mốc chưa đạt là vòng rỗng.
  - Có tiêu đề "Mốc N tháng" và thẻ "Khi nào nên hỏi bác sĩ".
  - Bấm một mốc mở sheet; đóng nó.
- Đổi qua theme Sáng và Tối, nhìn lại ba màn: chữ rõ. Đặt lại lựa chọn giao diện như ban đầu. Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 7: Commit**

```bash
git add components/milestones/MilestoneItem.tsx components/milestones/milestoneitem.test.tsx components/milestones/MilestonesScreen.tsx
git commit -m "feat(milestones): glass Phát triển with icon checks"
```

---

## Kết thúc M2 (Đợt 5)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 621 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 5 / M3 (Triệu chứng, Bệnh thường gặp, Bồng bế, Khẩn cấp).
