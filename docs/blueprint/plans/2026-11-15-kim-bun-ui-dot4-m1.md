# Kim Bun UI — Đợt 4 / M1 (4 sheet ghi nhanh) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm lại sheet ghi nhanh (Bú bình, Thay tã, Thuốc, Nhiệt độ, kể cả Vitamin D) theo spec §8, §8.1, §8.2:

- Dùng `Sheet` kính (chip icon màu loại, nút đóng tròn, kéo xuống để đóng, hỏi "Bỏ thay đổi?" khi đang nhập dở).
- Có chip thời điểm "Lúc nào?".
- Mỗi loại có cách nhập riêng: ô số lớn với nút −/+, chip giá trị gần đây, `Segmented`, `Swatch` màu phân, `Switch`.
- Nút "Lưu" cao 56 dính đáy.

**Architecture:**

- Hàm thuần mới trong `lib/rules/`:
  - `timeChipToDate` (`timeChips.ts`).
  - `recentBottleAmounts`, `recentMedicineNames`, `stepAmount`, `diaperKind`, `withDiaperKind` cùng các danh sách lựa chọn (`quickEntry.ts`).
- Giữ nguyên `QUICK_FIELDS`, `buildDetails`, `defaultQuickValues` và thông báo lỗi. Giá trị vẫn là `QuickValues` dạng chuỗi/boolean, nên `buildDetails` kiểm tra như cũ.
- Thư mục mới `components/quick/` chứa các khối nhập theo loại. Các khối này không có hook, test bằng `renderToStaticMarkup` và duyệt cây (`findElements`).
- `QuickEntrySheet` giữ chữ ký cũ, kể cả `onSaved` của Đợt 3 / M3. Bên trong nó dùng `Sheet` với `footer` là nút Lưu `type="submit" form=<id>`.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 4 (spec §12: mục 8; test timeChips, quickEntry, themeGuard; checklist 6):**

| Mốc               | Nội dung                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1 (plan này)** | §8, §8.1, §8.2: 4 sheet ghi nhanh, chip thời điểm, hàm `timeChipToDate`, `recentBottleAmounts`, `recentMedicineNames`; checklist bước 27                                        |
| M2                | §8.3: `PumpSheet`, `LogEditSheet`, `GrowthSheet`, `DoseSheet`, `MilestoneSheet` chuyển sang `Sheet` và component ui; bỏ `components/form/QuickFields.tsx` khi không còn ai dùng |

**Quyết định cho chỗ spec chưa nói rõ:**

- "Bây giờ" là lúc bấm Lưu. "5 phút trước" và "15 phút trước" tính lùi từ lúc bấm Lưu.
- "Chọn giờ…" hiện ô `datetime-local`, giá trị đầu là lúc mở sheet. Ô rỗng hoặc sai thì báo "Chọn giờ hợp lệ" ngay trên nút Lưu, sheet giữ mở.
- Nút −10 / +10 của Bú bình: ô rỗng tính từ 0; không xuống dưới 0.
- Nút −0,1 / +0,1 của Nhiệt độ: ô rỗng thì lấy 37,0 rồi cộng/trừ (bấm +0,1 lần đầu ra "37,1"). Số hiện bằng dấu phẩy.
- "Đang nhập dở" (để `Sheet` hỏi "Bỏ thay đổi?"): giá trị khác giá trị lúc mở sheet, hoặc chip thời điểm khác "Bây giờ".
- Nhãn màu phân lấy từ `QUICK_FIELDS` hiện có ("Bạc màu / trắng", "Có máu / đỏ") để giữ một nguồn chữ.
- Thứ tự trong sheet: các ô của loại → cảnh báo thuốc (nếu có) → "Lúc nào?".
- Lưu xong thì sheet biến mất ngay, không chạy hiệu ứng trượt xuống (cha bỏ `<dialog>` khỏi trang). Chấp nhận ở M1; muốn có hiệu ứng thì `Sheet` cần thêm cách đóng chủ động, để sau.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. Component lấy màu ô phân bằng cách import `STOOL_SWATCHES` từ `lib/ui/tokens.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Giữ `QUICK_FIELDS`, `buildDetails`, `defaultQuickValues` và thông báo lỗi trong `lib/rules/quickEntry.ts` (spec §8.2); chỉ đổi cách nhập. Test cũ của `lib/rules/quickEntry.test.ts` phải xanh không sửa.
- Logic là hàm thuần trong `lib/rules/`, có unit test.
- Ghi dữ liệu vẫn qua `useAddInstant` (outbox). `QuickEntrySheet` giữ props `type babyId userId onClose onSaved? initial? recentLogs?`; Hoàn tác của Đợt 3 / M3 phải còn chạy (`onSaved` gọi với `{ id, type, details, at }`).
- Vùng chạm tối thiểu 44×44 pt; ô nhập có `inputMode="decimal"` cho số; tôn trọng `safe-area-inset-*`. Mọi số đo dùng `tabular-nums`. Không tắt viền focus (`:focus-visible` trong `app/globals.css`).
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay chỉ mở sheet, gõ thử, đổi lựa chọn rồi **đóng không lưu**. **Không bấm Lưu**, không bấm nút bấm giờ.
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot3-m3`):

- `components/ui/`:
  - `Sheet({ open, onClose, title, icon?, iconColor?, dirty?, footer?, variant?, children })`.
  - `Button` (`variant size block busy` + thuộc tính `<button>`).
  - `Segmented<T>({ label, options: { value: T; label: string }[], value, onChange })` (2–4 lựa chọn).
  - `ChipGroup<T>` (cùng props).
  - `Swatch({ color: string | null; label; selected; onSelect; outlined? })`.
  - `Switch({ checked, onChange, label, disabled? })`.
  - `components/ui/testTree.ts` (`findElements`).
- `lib/ui/tokens.ts`: `STOOL_SWATCHES`; `lib/ui/categories.ts`: `CATEGORIES`.
- `lib/rules/quickEntry.ts`: `InstantType`, `QuickValues`, `QUICK_FIELDS`, `buildDetails`, `defaultQuickValues`.
- `lib/rules/logDetails.ts`: `detailsSchemas`, `type StoolColor`; `lib/rules/describeLog.ts`: `LogLike`; `lib/rules/time.ts`: `fromVnLocalInput`, `toVnLocalInput`; `lib/rules/alerts.ts`: `medicineWarnings`.
- `lib/data/logs.ts`: `useAddInstant` (`mutate` → `onSuccess(id: string)`), Đợt 3 / M3.
- `components/actions/QuickActions.tsx` mở `QuickEntrySheet` với `initial` (Vitamin D), `recentLogs`, `onSaved`, `onClose`.

**Produces** (M2 dùng):

- `lib/rules/timeChips.ts`: `type TimeChip = "now" | "5m" | "15m" | "custom"`, `TIME_CHIPS: { value: TimeChip; label: string }[]`, `timeChipToDate(chip: TimeChip, now: Date, custom?: string): Date` (giờ sai → `Invalid Date`).
- `lib/rules/quickEntry.ts`:
  - `recentBottleAmounts(logs: LogLike[]): number[]`, `recentMedicineNames(logs: LogLike[]): string[]`.
  - `type StepRule = { start: number; min: number; decimals: number }`, `ML_STEP`, `TEMP_STEP`, `stepAmount(value: string, delta: number, rule: StepRule): string`.
  - `type DiaperKind = "wet" | "dirty" | "both"`, `diaperKind(values: QuickValues): DiaperKind`, `withDiaperKind(values: QuickValues, kind: DiaperKind): QuickValues`.
  - `MILK_OPTIONS`, `UNIT_OPTIONS`, `METHOD_OPTIONS`: `{ value: string; label: string }[]`.
  - `DIAPER_KIND_OPTIONS: { value: DiaperKind; label: string }[]`, `STOOL_OPTIONS: { value: "" | StoolColor; label: string }[]`.
- `components/quick/styles.ts`: `FIELD_LABEL`, `FIELD_INPUT`, `VALUE_CHIP`.
- `components/quick/NumberStepper.tsx`: `NumberStepper({ label, value, unit, placeholder?, minus, plus, onChange })` với `minus`/`plus`: `{ text: string; label: string; onPress: () => void }`.
- `components/quick/BottleFields.tsx`, `TemperatureFields.tsx`, `DiaperFields.tsx`, `MedicineFields.tsx`, `TimeChips.tsx` (chữ ký ở từng task).
- `components/home/QuickEntrySheet.tsx`: cùng chữ ký, giao diện mới.

---

### Task 1: Chip thời điểm (`lib/rules/timeChips.ts`)

**Files:**

- Create: `lib/rules/timeChips.ts`, `lib/rules/timeChips.test.ts`

**Interfaces:**

- Consumes: `fromVnLocalInput` (`lib/rules/time.ts`).
- Produces: `TimeChip`, `TIME_CHIPS`, `timeChipToDate` (chữ ký ở Contracts).

Spec §8.1: nhóm "Lúc nào?": `Bây giờ` (mặc định) · `5 phút trước` · `15 phút trước` · `Chọn giờ…`; `timeChipToDate(chip, now, custom?)` trả `Date`.

- [ ] **Step 1: Viết test hỏng**

`lib/rules/timeChips.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TIME_CHIPS, timeChipToDate } from "./timeChips";

const NOW = new Date("2026-11-14T05:00:00.000Z"); // 12:00 giờ VN

describe("timeChipToDate", () => {
  it("now, 5 and 15 minutes ago count back from now", () => {
    expect(timeChipToDate("now", NOW).toISOString()).toBe(
      "2026-11-14T05:00:00.000Z",
    );
    expect(timeChipToDate("5m", NOW).toISOString()).toBe(
      "2026-11-14T04:55:00.000Z",
    );
    expect(timeChipToDate("15m", NOW).toISOString()).toBe(
      "2026-11-14T04:45:00.000Z",
    );
  });

  it("Chọn giờ… reads the datetime-local value in Vietnam time", () => {
    expect(
      timeChipToDate("custom", NOW, "2026-11-14T08:30").toISOString(),
    ).toBe("2026-11-14T01:30:00.000Z");
    expect(Number.isNaN(timeChipToDate("custom", NOW, "").getTime())).toBe(
      true,
    );
    expect(Number.isNaN(timeChipToDate("custom", NOW).getTime())).toBe(true);
  });

  it("lists the four chips in spec order", () => {
    expect(TIME_CHIPS).toEqual([
      { value: "now", label: "Bây giờ" },
      { value: "5m", label: "5 phút trước" },
      { value: "15m", label: "15 phút trước" },
      { value: "custom", label: "Chọn giờ…" },
    ]);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/timeChips.test.ts`
Expected: FAIL — `Cannot find module './timeChips'`.

- [ ] **Step 3: Viết `lib/rules/timeChips.ts`**

```ts
import { fromVnLocalInput } from "./time";

export type TimeChip = "now" | "5m" | "15m" | "custom";

export const TIME_CHIPS: { value: TimeChip; label: string }[] = [
  { value: "now", label: "Bây giờ" },
  { value: "5m", label: "5 phút trước" },
  { value: "15m", label: "15 phút trước" },
  { value: "custom", label: "Chọn giờ…" },
];

const MINUTES_AGO: Record<Exclude<TimeChip, "custom">, number> = {
  now: 0,
  "5m": 5,
  "15m": 15,
};

// Spec §8.1. An empty or broken custom value gives an Invalid Date for the caller to reject.
export function timeChipToDate(
  chip: TimeChip,
  now: Date,
  custom?: string,
): Date {
  if (chip === "custom")
    return custom ? fromVnLocalInput(custom) : new Date(Number.NaN);
  return new Date(now.getTime() - MINUTES_AGO[chip] * 60_000);
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/timeChips.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add lib/rules/timeChips.ts lib/rules/timeChips.test.ts
git commit -m "feat(entry): time chips for quick entry"
```

---

### Task 2: Gợi ý gần đây, nút −/+ và loại tã (`lib/rules/quickEntry.ts`)

**Files:**

- Modify: `lib/rules/quickEntry.ts` (thêm import và thêm code cuối file), `lib/rules/quickEntry.test.ts` (thêm test cuối file)

**Interfaces:**

- Consumes: `LogLike` (`lib/rules/describeLog.ts`), `detailsSchemas`, `StoolColor` (`lib/rules/logDetails.ts`), `QUICK_FIELDS` (cùng file).
- Produces: các export `lib/rules/quickEntry.ts` ở Contracts.

Spec §2.3: `recentBottleAmounts` trả tối đa 3 giá trị ml khác nhau gần nhất từ log `bottle`, mới nhất trước. `recentMedicineNames` trả tối đa 4 tên thuốc khác nhau gần nhất (so sánh không phân biệt hoa thường, giữ cách viết lần gần nhất). Spec §8.2: Thay tã `Segmented` Ướt / Bẩn / Cả hai → (`wet`, `dirty`) = (true, false) / (false, true) / (true, true).

- [ ] **Step 1: Viết test hỏng**

Trong `lib/rules/quickEntry.test.ts`, thay khối import đầu file bằng:

```ts
import { describe, expect, it } from "vitest";
import type { LogLike } from "@/lib/rules/describeLog";
import {
  buildDetails,
  defaultQuickValues,
  DIAPER_KIND_OPTIONS,
  diaperKind,
  ML_STEP,
  QUICK_FIELDS,
  recentBottleAmounts,
  recentMedicineNames,
  stepAmount,
  STOOL_OPTIONS,
  TEMP_STEP,
  withDiaperKind,
} from "@/lib/rules/quickEntry";
```

Thêm cuối file:

```ts
const at = (minutesAgo: number) =>
  new Date(Date.UTC(2026, 10, 14, 5) - minutesAgo * 60_000).toISOString();
const bottleLog = (minutesAgo: number, ml: number): LogLike => ({
  type: "bottle",
  started_at: at(minutesAgo),
  ended_at: at(minutesAgo),
  details: { ml, milk: "formula" },
});
const medLog = (minutesAgo: number, name: string): LogLike => ({
  type: "medicine",
  started_at: at(minutesAgo),
  ended_at: at(minutesAgo),
  details: { name, amount: 1, unit: "ml", antipyretic: false },
});

describe("recent suggestions", () => {
  it("recentBottleAmounts: up to 3 different amounts, newest first", () => {
    expect(
      recentBottleAmounts([
        bottleLog(300, 60),
        bottleLog(10, 90),
        bottleLog(60, 120),
        bottleLog(30, 90),
        bottleLog(200, 100),
        medLog(5, "Vitamin D"),
      ]),
    ).toEqual([90, 120, 100]);
    expect(recentBottleAmounts([bottleLog(10, 90)])).toEqual([90]);
    expect(recentBottleAmounts([])).toEqual([]);
  });

  it("recentMedicineNames: up to 4 names, case-insensitive, latest spelling", () => {
    expect(
      recentMedicineNames([
        medLog(100, "paracetamol"),
        medLog(10, "Paracetamol "),
        medLog(20, "Vitamin D"),
        medLog(30, "Men vi sinh"),
        medLog(40, "Siro ho"),
        medLog(50, "Kẽm"),
        bottleLog(1, 90),
      ]),
    ).toEqual(["Paracetamol", "Vitamin D", "Men vi sinh", "Siro ho"]);
  });
});

describe("number steppers", () => {
  it("ml: ±10 from empty as 0, never below 0", () => {
    expect(stepAmount("", 10, ML_STEP)).toBe("10");
    expect(stepAmount("90", 10, ML_STEP)).toBe("100");
    expect(stepAmount("5", -10, ML_STEP)).toBe("0");
    expect(stepAmount("", -10, ML_STEP)).toBe("0");
  });

  it("temperature: ±0,1 from empty as 37,0, comma decimals", () => {
    expect(stepAmount("", 0.1, TEMP_STEP)).toBe("37,1");
    expect(stepAmount("", -0.1, TEMP_STEP)).toBe("36,9");
    expect(stepAmount("38,5", 0.1, TEMP_STEP)).toBe("38,6");
    expect(stepAmount("38.5", -0.1, TEMP_STEP)).toBe("38,4");
  });
});

describe("diaper kind", () => {
  it("maps Ướt / Bẩn / Cả hai to wet and dirty, and back", () => {
    expect(DIAPER_KIND_OPTIONS.map((o) => o.label)).toEqual([
      "Ướt",
      "Bẩn",
      "Cả hai",
    ]);
    expect(diaperKind(defaultQuickValues("diaper"))).toBe("wet");
    const both = withDiaperKind(
      { wet: true, dirty: false, stoolColor: "" },
      "both",
    );
    expect(both).toEqual({ wet: true, dirty: true, stoolColor: "" });
    expect(diaperKind(both)).toBe("both");
    const dirty = withDiaperKind({ ...both, stoolColor: "green" }, "dirty");
    expect(dirty).toEqual({ wet: false, dirty: true, stoolColor: "green" });
    expect(withDiaperKind(dirty, "wet")).toEqual({
      wet: true,
      dirty: false,
      stoolColor: "",
    });
    expect(STOOL_OPTIONS.map((o) => o.value)).toEqual([
      "",
      "yellow",
      "green",
      "brown",
      "black",
      "pale",
      "red",
    ]);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/quickEntry.test.ts`
Expected: FAIL — `recentBottleAmounts is not a function` (hoặc lỗi import tương tự); 4 test cũ vẫn chạy.

- [ ] **Step 3: Sửa `lib/rules/quickEntry.ts`**

Thay dòng `import { detailsSchemas } from "./logDetails";` ở đầu file bằng:

```ts
import type { LogLike } from "./describeLog";
import { detailsSchemas, type StoolColor } from "./logDetails";
```

Thêm cuối file:

```ts
const byNewest = (logs: LogLike[]) =>
  [...logs].sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));

// Spec §2.3: up to 3 different ml amounts from bottle logs, newest first.
export function recentBottleAmounts(logs: LogLike[]): number[] {
  const amounts: number[] = [];
  for (const log of byNewest(logs)) {
    if (log.type !== "bottle") continue;
    const parsed = detailsSchemas.bottle.safeParse(log.details);
    if (!parsed.success || amounts.includes(parsed.data.ml)) continue;
    amounts.push(parsed.data.ml);
    if (amounts.length === 3) break;
  }
  return amounts;
}

// Spec §2.3: up to 4 different medicine names, case-insensitive, latest spelling kept.
export function recentMedicineNames(logs: LogLike[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const log of byNewest(logs)) {
    if (log.type !== "medicine") continue;
    const parsed = detailsSchemas.medicine.safeParse(log.details);
    if (!parsed.success) continue;
    const name = parsed.data.name.trim();
    const key = name.toLocaleLowerCase("vi");
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length === 4) break;
  }
  return names;
}

export type StepRule = { start: number; min: number; decimals: number };
export const ML_STEP: StepRule = { start: 0, min: 0, decimals: 0 };
export const TEMP_STEP: StepRule = { start: 37, min: 0, decimals: 1 };

// The −/+ buttons next to a number field. An empty or unreadable field starts at `rule.start`.
export function stepAmount(
  value: string,
  delta: number,
  rule: StepRule,
): string {
  const current = toNumber(value);
  const base = Number.isNaN(current) ? rule.start : current;
  const scale = 10 ** rule.decimals;
  const next = Math.max(rule.min, Math.round((base + delta) * scale) / scale);
  return rule.decimals === 0
    ? String(next)
    : next.toFixed(rule.decimals).replace(".", ",");
}

export type DiaperKind = "wet" | "dirty" | "both";

export function diaperKind(values: QuickValues): DiaperKind {
  if (values.dirty === true) return values.wet === true ? "both" : "dirty";
  return "wet";
}

export function withDiaperKind(
  values: QuickValues,
  kind: DiaperKind,
): QuickValues {
  return {
    ...values,
    wet: kind !== "dirty",
    dirty: kind !== "wet",
    stoolColor: kind === "wet" ? "" : (values.stoolColor ?? ""),
  };
}

function optionsOf(type: InstantType, key: string) {
  return QUICK_FIELDS[type].find((field) => field.key === key)?.options ?? [];
}

export const MILK_OPTIONS = optionsOf("bottle", "milk");
export const UNIT_OPTIONS = optionsOf("medicine", "unit");
export const METHOD_OPTIONS = optionsOf("temperature", "method");
export const STOOL_OPTIONS = optionsOf("diaper", "stoolColor") as {
  value: "" | StoolColor;
  label: string;
}[];
export const DIAPER_KIND_OPTIONS: { value: DiaperKind; label: string }[] = [
  { value: "wet", label: "Ướt" },
  { value: "dirty", label: "Bẩn" },
  { value: "both", label: "Cả hai" },
];
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/quickEntry.test.ts && bun run typecheck`
Expected: PASS (9 test: 4 cũ + 2 recent + 2 stepper + 1 diaper); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/quickEntry.ts lib/rules/quickEntry.test.ts
git commit -m "feat(entry): recent amounts and names, steppers, diaper kind"
```

---

### Task 3: Ô số lớn có nút −/+, khối Bú bình và Nhiệt độ

**Files:**

- Create: `components/quick/styles.ts`, `components/quick/NumberStepper.tsx`, `components/quick/BottleFields.tsx`, `components/quick/TemperatureFields.tsx`, `components/quick/numbers.test.tsx`

**Interfaces:**

- Consumes: `stepAmount`, `ML_STEP`, `TEMP_STEP`, `MILK_OPTIONS`, `METHOD_OPTIONS`, `QuickValues` (Task 2); `Segmented`; `findElements`.
- Produces:
  - `FIELD_LABEL`, `FIELD_INPUT`, `VALUE_CHIP` (chuỗi class).
  - `NumberStepper` (chữ ký ở Contracts).
  - `BottleFields({ values: QuickValues; onChange: (next: QuickValues) => void; recent: number[] })`.
  - `TemperatureFields({ values: QuickValues; onChange: (next: QuickValues) => void })`.

Spec §8.2:

- **Bú bình:** ô số ml cỡ 34/700 `inputMode="decimal"` với nút −10 và +10 (không xuống dưới 0); chip từ `recentBottleAmounts` (bấm thì điền số); `Segmented` Sữa mẹ / Sữa công thức.
- **Nhiệt độ:** ô số °C cỡ 34/700 `inputMode="decimal"`, rỗng, placeholder "37,0"; nút −0,1 và +0,1; `Segmented` Nách / Trán / Tai / Hậu môn.

- [ ] **Step 1: Viết test hỏng**

`components/quick/numbers.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { BottleFields } from "./BottleFields";
import { TemperatureFields } from "./TemperatureFields";

type Step = { text: string; label: string; onPress: () => void };
const stepperOf = (tree: ReturnType<typeof BottleFields>) =>
  findElements(tree, (el) => el.props.plus !== undefined)[0].props as {
    minus: Step;
    plus: Step;
    onChange: (v: string) => void;
  };

describe("BottleFields", () => {
  it("big ml field with −10 / +10, recent amounts and milk type", () => {
    const html = renderToStaticMarkup(
      <BottleFields
        values={{ ml: "90", milk: "breast_milk" }}
        onChange={() => {}}
        recent={[90, 120]}
      />,
    );
    expect(html).toContain('inputMode="decimal"');
    expect(html).toContain('value="90"');
    expect(html).toContain("text-[34px]");
    expect(html).toContain('aria-label="Bớt 10 ml"');
    expect(html).toContain('aria-label="Thêm 10 ml"');
    expect(html).toContain(">−10</button>");
    expect(html).toContain(">90 ml</button>");
    expect(html).toContain(">120 ml</button>");
    expect(html).toMatch(/aria-pressed="true"[^>]*>Sữa mẹ<\/button>/);
  });

  it("steps by 10 and fills a recent amount", () => {
    const onChange = vi.fn();
    const values = { ml: "90", milk: "formula" };
    const tree = BottleFields({ values, onChange, recent: [120] });
    stepperOf(tree).plus.onPress();
    expect(onChange).toHaveBeenLastCalledWith({ ml: "100", milk: "formula" });
    stepperOf(tree).minus.onPress();
    expect(onChange).toHaveBeenLastCalledWith({ ml: "80", milk: "formula" });
    const [chip] = findElements(tree, (el) => el.props.children === "120 ml");
    (chip.props.onClick as () => void)();
    expect(onChange).toHaveBeenLastCalledWith({ ml: "120", milk: "formula" });
  });
});

describe("TemperatureFields", () => {
  it("empty field with 37,0 placeholder, ±0,1 and where it was measured", () => {
    const onChange = vi.fn();
    const values = { celsius: "", method: "nach" };
    const html = renderToStaticMarkup(
      <TemperatureFields values={values} onChange={onChange} />,
    );
    expect(html).toContain('placeholder="37,0"');
    expect(html).toContain(">°C</span>");
    expect(html).toContain('aria-label="Thêm 0,1 độ"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Nách<\/button>/);
    expect(html).toContain(">Hậu môn</button>");
    const tree = TemperatureFields({ values, onChange });
    stepperOf(tree as ReturnType<typeof BottleFields>).plus.onPress();
    expect(onChange).toHaveBeenLastCalledWith({
      celsius: "37,1",
      method: "nach",
    });
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/quick/numbers.test.tsx`
Expected: FAIL — `Cannot find module './BottleFields'`.

- [ ] **Step 3: Viết `components/quick/styles.ts`**

```ts
// Shared look of quick-entry fields (spec §4.4–4.5).
export const FIELD_LABEL =
  "text-[13px] leading-[18px] font-semibold text-muted";
export const FIELD_INPUT =
  "glass min-h-11 w-full rounded-[16px] px-3 text-base text-ink";
export const VALUE_CHIP =
  "glass min-h-11 rounded-full px-4 text-[15px] font-semibold text-ink tabular-nums transition-transform duration-[120ms] active:scale-[0.97]";
```

- [ ] **Step 4: Viết `components/quick/NumberStepper.tsx`**

```tsx
type Step = { text: string; label: string; onPress: () => void };

const STEP_BUTTON =
  "flex size-14 shrink-0 items-center justify-center rounded-full bg-muted/15 text-[17px] font-semibold text-ink tabular-nums transition-transform duration-[120ms] active:scale-[0.97]";

// Spec §8.2: a 34/700 number field between a minus and a plus button.
export function NumberStepper({
  label,
  value,
  unit,
  placeholder,
  minus,
  plus,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  placeholder?: string;
  minus: Step;
  plus: Step;
  onChange: (next: string) => void;
}) {
  return (
    <div className="glass flex items-center gap-2 rounded-[24px] p-2.5">
      <button
        type="button"
        aria-label={minus.label}
        onClick={minus.onPress}
        className={STEP_BUTTON}
      >
        {minus.text}
      </button>
      <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5">
        <span className="sr-only">{label}</span>
        <input
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-28 min-w-0 rounded-[12px] bg-transparent text-center text-[34px] leading-[41px] font-bold text-ink tabular-nums placeholder:text-muted"
        />
        <span className="text-[17px] font-semibold text-muted">{unit}</span>
      </label>
      <button
        type="button"
        aria-label={plus.label}
        onClick={plus.onPress}
        className={STEP_BUTTON}
      >
        {plus.text}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Viết `components/quick/BottleFields.tsx`**

```tsx
import { Segmented } from "@/components/ui/Segmented";
import {
  MILK_OPTIONS,
  ML_STEP,
  stepAmount,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { NumberStepper } from "./NumberStepper";
import { VALUE_CHIP } from "./styles";

export function BottleFields({
  values,
  onChange,
  recent,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
  recent: number[];
}) {
  const ml = String(values.ml ?? "");
  const setMl = (next: string) => onChange({ ...values, ml: next });
  return (
    <div className="flex flex-col gap-4">
      <NumberStepper
        label="Số ml"
        value={ml}
        unit="ml"
        minus={{
          text: "−10",
          label: "Bớt 10 ml",
          onPress: () => setMl(stepAmount(ml, -10, ML_STEP)),
        }}
        plus={{
          text: "+10",
          label: "Thêm 10 ml",
          onPress: () => setMl(stepAmount(ml, 10, ML_STEP)),
        }}
        onChange={setMl}
      />
      {recent.length > 0 && (
        <div
          role="group"
          aria-label="Lượng gần đây"
          className="flex flex-wrap gap-2"
        >
          {recent.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setMl(String(amount))}
              className={VALUE_CHIP}
            >
              {`${amount} ml`}
            </button>
          ))}
        </div>
      )}
      <Segmented
        label="Loại sữa"
        options={MILK_OPTIONS}
        value={String(values.milk)}
        onChange={(milk) => onChange({ ...values, milk })}
      />
    </div>
  );
}
```

- [ ] **Step 6: Viết `components/quick/TemperatureFields.tsx`**

```tsx
import { Segmented } from "@/components/ui/Segmented";
import {
  METHOD_OPTIONS,
  stepAmount,
  TEMP_STEP,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { NumberStepper } from "./NumberStepper";

export function TemperatureFields({
  values,
  onChange,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  const celsius = String(values.celsius ?? "");
  const setCelsius = (next: string) => onChange({ ...values, celsius: next });
  return (
    <div className="flex flex-col gap-4">
      <NumberStepper
        label="Nhiệt độ"
        value={celsius}
        unit="°C"
        placeholder="37,0"
        minus={{
          text: "−0,1",
          label: "Bớt 0,1 độ",
          onPress: () => setCelsius(stepAmount(celsius, -0.1, TEMP_STEP)),
        }}
        plus={{
          text: "+0,1",
          label: "Thêm 0,1 độ",
          onPress: () => setCelsius(stepAmount(celsius, 0.1, TEMP_STEP)),
        }}
        onChange={setCelsius}
      />
      <Segmented
        label="Đo ở"
        options={METHOD_OPTIONS}
        value={String(values.method)}
        onChange={(method) => onChange({ ...values, method })}
      />
    </div>
  );
}
```

- [ ] **Step 7: Chạy test để thấy xanh**

Run: `bun run test components/quick/numbers.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (BottleFields 2, TemperatureFields 1, themeGuard 1); typecheck không lỗi.

- [ ] **Step 8: Commit**

```bash
git add components/quick
git commit -m "feat(entry): number stepper, bottle and temperature fields"
```

---

### Task 4: Khối Thay tã và Thuốc

**Files:**

- Create: `components/quick/DiaperFields.tsx`, `components/quick/MedicineFields.tsx`, `components/quick/choices.test.tsx`

**Interfaces:**

- Consumes: `diaperKind`, `withDiaperKind`, `DIAPER_KIND_OPTIONS`, `STOOL_OPTIONS`, `UNIT_OPTIONS`, `QuickValues` (Task 2); `FIELD_LABEL`, `FIELD_INPUT`, `VALUE_CHIP` (Task 3); `Segmented`, `Swatch`, `Switch`; `STOOL_SWATCHES`; `findElements`.
- Produces:
  - `DiaperFields({ values: QuickValues; onChange: (next: QuickValues) => void })`.
  - `MedicineFields({ values: QuickValues; onChange: (next: QuickValues) => void; names: string[]; warnings: string[] })`.

Spec §8.2:

- **Thay tã:** `Segmented` Ướt / Bẩn / Cả hai, mặc định Ướt. Khi chọn Bẩn hoặc Cả hai thì hiện nhóm "Màu phân" gồm 7 `Swatch` theo thứ tự Không ghi, Vàng, Xanh, Nâu, Đen, Bạc màu/trắng, Có máu/đỏ, mặc định Không ghi. Ô `black` và `pale` có viền.
- **Thuốc:** ô tên thuốc + chip từ `recentMedicineNames` (bấm thì điền tên); ô lượng `inputMode="decimal"`; `Segmented` ml / mg / giọt / viên; `Switch` "Thuốc hạ sốt"; cảnh báo `medicineWarnings` là thẻ nền `--color-warn-soft` chữ `--color-warn-ink`.

- [ ] **Step 1: Viết test hỏng**

`components/quick/choices.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { STOOL_SWATCHES } from "@/lib/ui/tokens";
import { DiaperFields } from "./DiaperFields";
import { MedicineFields } from "./MedicineFields";

const wet = { wet: true, dirty: false, stoolColor: "" };

describe("DiaperFields", () => {
  it("wet only: three-way choice, no stool colours", () => {
    const html = renderToStaticMarkup(
      <DiaperFields values={wet} onChange={() => {}} />,
    );
    expect(html).toMatch(/aria-pressed="true"[^>]*>Ướt<\/button>/);
    expect(html).toContain(">Cả hai</button>");
    expect(html).not.toContain("Màu phân");
  });

  it("dirty: seven stool swatches in spec order, black and pale outlined", () => {
    const html = renderToStaticMarkup(
      <DiaperFields
        values={{ wet: false, dirty: true, stoolColor: "green" }}
        onChange={() => {}}
      />,
    );
    expect(html).toContain(">Màu phân</legend>");
    expect(html.match(/class="size-11 rounded-full/g)).toHaveLength(7);
    const labels = [
      ...html.matchAll(/<span class="text-xs font-medium">([^<]+)<\/span>/g),
    ].map((m) => m[1]);
    expect(labels).toEqual([
      "Không ghi",
      "Vàng",
      "Xanh",
      "Nâu",
      "Đen",
      "Bạc màu / trắng",
      "Có máu / đỏ",
    ]);
    expect(html).toContain(`background:${STOOL_SWATCHES.green}`);
    expect(html.match(/border border-muted/g)).toHaveLength(2);
  });

  it("switches kind and picks a colour", () => {
    const onChange = vi.fn();
    const tree = DiaperFields({ values: wet, onChange });
    const [segmented] = findElements(
      tree,
      (el) => el.props.options !== undefined,
    );
    (segmented.props.onChange as (v: string) => void)("both");
    expect(onChange).toHaveBeenLastCalledWith({
      wet: true,
      dirty: true,
      stoolColor: "",
    });
    const dirtyTree = DiaperFields({
      values: { wet: false, dirty: true, stoolColor: "" },
      onChange,
    });
    const [black] = findElements(dirtyTree, (el) => el.props.label === "Đen");
    (black.props.onSelect as () => void)();
    expect(onChange).toHaveBeenLastCalledWith({
      wet: false,
      dirty: true,
      stoolColor: "black",
    });
  });
});

describe("MedicineFields", () => {
  const values = { name: "", amount: "", unit: "ml", antipyretic: true };

  it("name with recent chips, decimal amount, unit, fever switch and warnings", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <MedicineFields
        values={values}
        onChange={onChange}
        names={["Paracetamol", "Vitamin D"]}
        warnings={["Chưa đủ 4 giờ từ liều hạ sốt trước (09:00)."]}
      />,
    );
    expect(html).toContain(">Tên thuốc</span>");
    expect(html).toContain(">Paracetamol</button>");
    expect(html).toContain('inputMode="decimal"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>ml<\/button>/);
    expect(html).toContain(">giọt</button>");
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain("bg-warn-soft");
    expect(html).toContain("text-warn-ink");
    expect(html).toContain("Chưa đủ 4 giờ từ liều hạ sốt trước (09:00).");
    const [chip] = findElements(
      MedicineFields({ values, onChange, names: ["Vitamin D"], warnings: [] }),
      (el) => el.props.children === "Vitamin D",
    );
    (chip.props.onClick as () => void)();
    expect(onChange).toHaveBeenLastCalledWith({ ...values, name: "Vitamin D" });
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/quick/choices.test.tsx`
Expected: FAIL — `Cannot find module './DiaperFields'`.

- [ ] **Step 3: Viết `components/quick/DiaperFields.tsx`**

```tsx
import { Segmented } from "@/components/ui/Segmented";
import { Swatch } from "@/components/ui/Swatch";
import {
  DIAPER_KIND_OPTIONS,
  diaperKind,
  STOOL_OPTIONS,
  withDiaperKind,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { STOOL_SWATCHES } from "@/lib/ui/tokens";
import { FIELD_LABEL } from "./styles";

export function DiaperFields({
  values,
  onChange,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  const kind = diaperKind(values);
  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Loại tã"
        options={DIAPER_KIND_OPTIONS}
        value={kind}
        onChange={(next) => onChange(withDiaperKind(values, next))}
      />
      {kind !== "wet" && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className={`${FIELD_LABEL} mb-2.5`}>Màu phân</legend>
          <div className="flex flex-wrap gap-x-3 gap-y-3">
            {STOOL_OPTIONS.map((option) => (
              <Swatch
                key={option.value || "none"}
                color={
                  option.value === "" ? null : STOOL_SWATCHES[option.value]
                }
                label={option.label}
                outlined={option.value === "black" || option.value === "pale"}
                selected={(values.stoolColor ?? "") === option.value}
                onSelect={() =>
                  onChange({ ...values, stoolColor: option.value })
                }
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Viết `components/quick/MedicineFields.tsx`**

```tsx
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { UNIT_OPTIONS, type QuickValues } from "@/lib/rules/quickEntry";
import { FIELD_INPUT, FIELD_LABEL, VALUE_CHIP } from "./styles";

export function MedicineFields({
  values,
  onChange,
  names,
  warnings,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
  names: string[];
  warnings: string[];
}) {
  const set = (key: string, next: string | boolean) =>
    onChange({ ...values, [key]: next });
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Tên thuốc</span>
        <input
          className={FIELD_INPUT}
          value={String(values.name ?? "")}
          onChange={(event) => set("name", event.target.value)}
        />
      </label>
      {names.length > 0 && (
        <div
          role="group"
          aria-label="Thuốc gần đây"
          className="flex flex-wrap gap-2"
        >
          {names.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => set("name", name)}
              className={VALUE_CHIP}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Lượng</span>
        <input
          className={`${FIELD_INPUT} tabular-nums`}
          inputMode="decimal"
          value={String(values.amount ?? "")}
          onChange={(event) => set("amount", event.target.value)}
        />
      </label>
      <Segmented
        label="Đơn vị"
        options={UNIT_OPTIONS}
        value={String(values.unit)}
        onChange={(unit) => set("unit", unit)}
      />
      <div className="glass flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] px-4">
        <span className="text-base text-ink">Thuốc hạ sốt</span>
        <Switch
          checked={values.antipyretic === true}
          label="Thuốc hạ sốt"
          onChange={(next) => set("antipyretic", next)}
        />
      </div>
      {warnings.map((warning) => (
        <p
          key={warning}
          role="status"
          className="rounded-[16px] bg-warn-soft p-3 text-[15px] text-warn-ink"
        >
          {warning}
        </p>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/quick/choices.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (DiaperFields 3, MedicineFields 1, themeGuard 1); typecheck không lỗi. Nếu React in `style` của `Swatch` khác dạng `background:#7C9A3A` (vd. có khoảng trắng), sửa assertion cho khớp đúng chuỗi React 19 in ra và ghi lại trong báo cáo.

- [ ] **Step 6: Commit**

```bash
git add components/quick/DiaperFields.tsx components/quick/MedicineFields.tsx components/quick/choices.test.tsx
git commit -m "feat(entry): diaper and medicine fields"
```

---

### Task 5: Chip "Lúc nào?" và sheet ghi nhanh mới; checklist bước 27

**Files:**

- Create: `components/quick/TimeChips.tsx`, `components/home/quickentry.test.tsx`
- Modify: `components/home/QuickEntrySheet.tsx` (viết lại toàn file), `docs/device-checklist.md`

**Interfaces:**

- Consumes: `TimeChip`, `TIME_CHIPS`, `timeChipToDate` (Task 1); `recentBottleAmounts`, `recentMedicineNames` (Task 2); `BottleFields`, `TemperatureFields`, `FIELD_LABEL`, `FIELD_INPUT` (Task 3); `DiaperFields`, `MedicineFields` (Task 4); `Sheet`, `Button`, `ChipGroup`; `CATEGORIES`; `useAddInstant`; `buildDetails`, `defaultQuickValues`; `medicineWarnings`; `toVnLocalInput`; `toVietnameseError`.
- Produces:
  - `TimeChips({ chip: TimeChip; custom: string; onChip: (next: TimeChip) => void; onCustom: (next: string) => void })`.
  - `QuickEntrySheet`, cùng chữ ký cũ.

Spec §8: đầu sheet là chip icon màu loại 36 + tiêu đề 22/700 + nút đóng tròn 36 (do `Sheet` vẽ). Đáy là nút "Lưu" `primary` cao 56, rộng hết. Lỗi kiểm tra (`buildDetails` trả `message`) hoặc lỗi lưu hiện ngay trên nút Lưu, màu `--color-danger`, `role="alert"`; sheet giữ mở.

- [ ] **Step 1: Viết test hỏng**

`components/home/quickentry.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { QuickEntrySheet } from "./QuickEntrySheet";

const bottle = {
  id: "b1",
  baby_id: "b",
  type: "bottle",
  started_at: "2026-11-14T04:00:00.000Z",
  ended_at: "2026-11-14T04:00:00.000Z",
  details: { ml: 120, milk: "formula" },
  note: null,
  created_by: "u1",
  created_at: "2026-11-14T04:00:00.000Z",
  updated_at: "2026-11-14T04:00:00.000Z",
} as LogRow;

const render = (
  props: Partial<ComponentProps<typeof QuickEntrySheet>> & {
    type: ComponentProps<typeof QuickEntrySheet>["type"];
  },
) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <QuickEntrySheet babyId="b" userId="u1" onClose={() => {}} {...props} />
    </QueryClientProvider>,
  );

describe("QuickEntrySheet", () => {
  it("is a glass sheet with the category chip, time chips and a 56 px Lưu that submits the form", () => {
    const html = render({ type: "bottle", recentLogs: [bottle] });
    expect(html).toContain("<dialog");
    expect(html).toContain(">Bú bình</h2>");
    expect(html).toContain("bg-cat-bottle/15 text-cat-bottle");
    expect(html).toContain(`d="${ICON_PATHS.bottle}"`);
    expect(html).toContain(">120 ml</button>");
    expect(html).toContain(">Lúc nào?</span>");
    expect(html).toMatch(/aria-pressed="true"[^>]*>Bây giờ<\/button>/);
    expect(html).not.toContain('type="datetime-local"');
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(formId).toBeTruthy();
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Hủy");
    expect(html).not.toContain("rounded-xl border");
  });

  it("opens each type with its own fields", () => {
    expect(render({ type: "diaper" })).toMatch(
      /aria-pressed="true"[^>]*>Ướt<\/button>/,
    );
    expect(render({ type: "temperature" })).toContain('placeholder="37,0"');
    const medicine = render({ type: "medicine" });
    expect(medicine).toContain(">Cho uống thuốc</h2>");
    expect(medicine).toContain(">Thuốc hạ sốt</span>");
  });

  it("keeps the Vitamin D prefill", () => {
    const html = render({
      type: "medicine",
      initial: {
        name: "Vitamin D",
        amount: "1",
        unit: "giọt",
        antipyretic: false,
      },
    });
    expect(html).toContain('value="Vitamin D"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>giọt<\/button>/);
    expect(html).toContain('aria-checked="false"');
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/quickentry.test.tsx`
Expected: FAIL — sheet cũ không có `<dialog`, không có chip "Bây giờ" (2–3 test hỏng).

- [ ] **Step 3: Viết `components/quick/TimeChips.tsx`**

```tsx
import { ChipGroup } from "@/components/ui/ChipGroup";
import { TIME_CHIPS, type TimeChip } from "@/lib/rules/timeChips";
import { FIELD_INPUT, FIELD_LABEL } from "./styles";

// Spec §8.1: "Lúc nào?" — Bây giờ · 5 phút trước · 15 phút trước · Chọn giờ…
export function TimeChips({
  chip,
  custom,
  onChip,
  onCustom,
}: {
  chip: TimeChip;
  custom: string;
  onChip: (next: TimeChip) => void;
  onCustom: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={FIELD_LABEL}>Lúc nào?</span>
      <ChipGroup
        label="Lúc nào?"
        options={TIME_CHIPS}
        value={chip}
        onChange={onChip}
      />
      {chip === "custom" && (
        <input
          type="datetime-local"
          aria-label="Chọn giờ"
          className={FIELD_INPUT}
          value={custom}
          onChange={(event) => onCustom(event.target.value)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Viết lại `components/home/QuickEntrySheet.tsx`**

```tsx
"use client";

import { useId, useState, type FormEvent } from "react";
import { BottleFields } from "@/components/quick/BottleFields";
import { DiaperFields } from "@/components/quick/DiaperFields";
import { MedicineFields } from "@/components/quick/MedicineFields";
import { TemperatureFields } from "@/components/quick/TemperatureFields";
import { TimeChips } from "@/components/quick/TimeChips";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useAddInstant } from "@/lib/data/logs";
import { medicineWarnings } from "@/lib/rules/alerts";
import {
  buildDetails,
  defaultQuickValues,
  recentBottleAmounts,
  recentMedicineNames,
  type InstantType,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { timeChipToDate, type TimeChip } from "@/lib/rules/timeChips";
import { toVnLocalInput } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES } from "@/lib/ui/categories";

const TITLES: Record<InstantType, string> = {
  bottle: "Bú bình",
  diaper: "Thay tã",
  medicine: "Cho uống thuốc",
  temperature: "Đo nhiệt độ",
};

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
  const add = useAddInstant(babyId, userId);
  const formId = useId();
  const [start] = useState<QuickValues>(() => ({
    ...defaultQuickValues(type),
    ...initial,
  }));
  const [values, setValues] = useState<QuickValues>(start);
  const [chip, setChip] = useState<TimeChip>("now");
  const [custom, setCustom] = useState(() => toVnLocalInput(new Date()));
  const [message, setMessage] = useState<string | null>(null);

  const dirty =
    chip !== "now" || JSON.stringify(values) !== JSON.stringify(start);
  const warnings =
    type === "medicine" && values.antipyretic === true
      ? medicineWarnings({
          logs: recentLogs,
          at: timeChipToDate(chip, new Date(), custom),
        })
      : [];

  function submit(event: FormEvent) {
    event.preventDefault();
    const built = buildDetails(type, values);
    if (!built.ok) {
      setMessage(built.message);
      return;
    }
    const when = timeChipToDate(chip, new Date(), custom);
    if (Number.isNaN(when.getTime())) {
      setMessage("Chọn giờ hợp lệ");
      return;
    }
    setMessage(null);
    add.mutate(
      { type, details: built.details, at: when },
      {
        onSuccess: (id) => {
          onSaved?.({ id, type, details: built.details, at: when });
          onClose();
        },
        onError: (error) => setMessage(toVietnameseError(error)),
      },
    );
  }

  const fields = {
    bottle: (
      <BottleFields
        values={values}
        onChange={setValues}
        recent={recentBottleAmounts(recentLogs)}
      />
    ),
    diaper: <DiaperFields values={values} onChange={setValues} />,
    medicine: (
      <MedicineFields
        values={values}
        onChange={setValues}
        names={recentMedicineNames(recentLogs)}
        warnings={warnings}
      />
    ),
    temperature: <TemperatureFields values={values} onChange={setValues} />,
  }[type];

  return (
    <Sheet
      open
      onClose={onClose}
      title={TITLES[type]}
      icon={CATEGORIES[type].icon}
      iconColor={CATEGORIES[type].token}
      dirty={dirty}
      footer={
        <div className="flex flex-col gap-2">
          {message && (
            <p role="alert" className="text-[15px] text-danger">
              {message}
            </p>
          )}
          <Button
            type="submit"
            form={formId}
            block
            busy={add.isPending}
            className="min-h-14!"
          >
            Lưu
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5 pt-1">
        {fields}
        <TimeChips
          chip={chip}
          custom={custom}
          onChip={setChip}
          onCustom={setCustom}
        />
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/home/quickentry.test.tsx components/actions lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (quickentry 3, components/actions giữ nguyên số test, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Thêm checklist bước 27 vào cuối `docs/device-checklist.md`**

```markdown
## Bước 27 — 4 sheet ghi nhanh (UI đợt 4)

1. Mở "Thay tã" từ Trang chủ và từ nút "+". Kỳ vọng: sheet kính trượt lên, đầu sheet có chip icon màu, tiêu đề, nút đóng tròn; đáy có nút "Lưu" to rộng hết.
2. Thay tã: chọn "Bẩn" → hiện 7 ô màu phân (ô Đen và Bạc màu có viền); chọn "Cả hai" giữ màu đã chọn; chọn "Ướt" thì ẩn màu phân. Lưu → Toast "Đã ghi Tã …".
3. Bú bình: bấm +10 ba lần → 30; −10 không xuống dưới 0; chip ml gần đây điền số; chọn Sữa mẹ / Sữa công thức. Lưu.
4. Thuốc: chip tên thuốc gần đây điền tên; bàn phím số khi gõ lượng; chọn đơn vị; bật "Thuốc hạ sốt" khi vừa cho uống hạ sốt dưới 4 giờ → thẻ cảnh báo vàng. Nút "Ghi Vitamin D hôm nay" mở sheet Thuốc điền sẵn Vitamin D 1 giọt.
5. Nhiệt độ: ô rỗng, bấm +0,1 → 37,1; chọn chỗ đo. Gõ 45 rồi Lưu → báo "Nhập nhiệt độ từ 34 đến 43°C" ngay trên nút Lưu, sheet không đóng.
6. "Lúc nào?": chọn "15 phút trước" rồi Lưu → bản ghi trong "Gần đây" lùi 15 phút. Chọn "Chọn giờ…" → hiện ô chọn ngày giờ.
7. Trên iPhone 11: bấm vào ô nhập, bàn phím hiện mà vẫn cuộn tới được nút Lưu.
8. Kéo tay nắm xuống: sheet đóng. Đang nhập dở mà đóng: hỏi "Bỏ thay đổi?" với "Bỏ" và "Tiếp tục nhập".
9. Lặp lại ở theme Sáng, Tối, Ban đêm: chữ và ô màu đọc rõ.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 7: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 569 có sẵn + 3 timeChips + 5 quickEntry + 3 numbers + 4 choices + 3 quickentry = 587. Build xong.

- [ ] **Step 8: Kiểm trên trình duyệt (không lưu)**

Run: `bun run dev`, mở `http://localhost:3000/` ở bề rộng 375 px, đăng nhập. **Không bấm Lưu, không bấm nút bấm giờ** (dữ liệu thật).
Expected:

- Bấm "Thay tã" (Ghi nhanh). Sheet kính mở, có chip icon màu tã, tiêu đề "Thay tã", nút đóng tròn, nút "Lưu" to ở đáy. Chọn "Bẩn": hiện 7 ô màu phân. Bấm nút đóng: hỏi "Bỏ thay đổi?". Bấm "Bỏ": sheet đóng.
- Mở "Bú bình". Bấm +10 hai lần: ô hiện "20". Đóng, rồi bấm "Bỏ".
- Mở "Nhiệt độ". Bấm +0,1: ô hiện "37,1". Chọn "Chọn giờ…": hiện ô ngày giờ. Đóng, rồi bấm "Bỏ".
- Mở "Thuốc": có chip tên thuốc gần đây (nếu có), công tắc "Thuốc hạ sốt". Đóng mà không đổi gì: sheet đóng ngay, không hỏi.
- Nút "Ghi Vitamin D hôm nay" (nếu đang hiện): sheet Thuốc điền sẵn "Vitamin D", "1", "giọt". Đóng mà không đổi gì.
- Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 9: Commit**

```bash
git add components/quick/TimeChips.tsx components/home/QuickEntrySheet.tsx components/home/quickentry.test.tsx docs/device-checklist.md
git commit -m "feat(entry): glass quick-entry sheets with time chips; checklist step 27"
```

---

## Kết thúc M1 (Đợt 4)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 587 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 4 / M2 (§8.3: `PumpSheet`, `LogEditSheet`, `GrowthSheet`, `DoseSheet`, `MilestoneSheet`).
