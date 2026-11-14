# Kim Bun UI — Đợt 4 / M2 (Sheet Hút sữa và Sửa bản ghi) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Chuyển `PumpSheet` (hỏi ml sau khi dừng Hút sữa) và `LogEditSheet` (thêm/sửa/xóa bản ghi ở Nhật ký) sang `Sheet` kính và component ui theo spec §8 và §8.3: trường và logic giữ nguyên; checkbox bật/tắt đổi thành `Switch`; `select` có ≤ 4 lựa chọn đổi thành `Segmented`; `select` nhiều hơn giữ native với `accent-color`. Bỏ `components/form/QuickFields.tsx` cũ.

**Architecture:**

- Component mới `components/quick/FieldList.tsx` vẽ một danh sách `QuickField` theo luật §8.3:
  - `checkbox` → hàng kính có `Switch`.
  - `select` 2–4 lựa chọn → `Segmented`.
  - `select` dài hơn → `<select>` native.
  - `number` → ô `inputMode="decimal"`; `text` → ô chữ.
  - `showIf` giữ nguyên.

  `FieldList` thay `QuickFields` cho `LogEditSheet`. Nó không có hook, test bằng `renderToStaticMarkup` và duyệt cây.

- `PumpSheet`, `LogEditSheet` giữ nguyên chữ ký và mọi lời gọi dữ liệu:
  - `PumpSheet` dùng `useSetPumpAmounts` và `parsePumpAmounts`.
  - `LogEditSheet` dùng `useSaveLog`, `useDeleteLog`, `buildLogPatch` và `window.confirm` trước khi xóa.
- Cả hai đổi khung sang `Sheet` (`open` luôn bật vì nơi gọi chỉ mount khi cần), `footer` có nút Lưu cao 56 `type="submit" form=<id>`, lỗi `role="alert"` ngay trên Lưu.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 4:**

| Mốc               | Nội dung                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| M1                | 4 sheet ghi nhanh (§8–8.2) — đã xong trên nhánh `feat/kim-bun-dot4-m1`                          |
| **M2 (plan này)** | §8.3 phần bản ghi: `FieldList`, `PumpSheet`, `LogEditSheet`; xóa `QuickFields`                  |
| M3                | §8.3 phần còn lại: `GrowthSheet`, `DoseSheet`, `MilestoneSheet`; checklist bước 28 cho M2 và M3 |

**Quyết định cho chỗ spec chưa nói rõ:**

- **Đầu sheet:**
  - `PumpSheet`: chip `cup` màu `cat-pump`.
  - `LogEditSheet`: chip theo loại đang chọn (`CATEGORIES[type]`); chip đổi khi đổi "Loại" lúc thêm bản ghi mới.
- **Nút phụ trong `footer`, dưới nút Lưu, kiểu `ghost`:**
  - `PumpSheet`: "Bỏ qua" (đóng ngay, không hỏi).
  - `LogEditSheet`: "Xóa bản ghi" chữ `--color-danger`, vẫn hỏi `window.confirm("Xóa bản ghi này?")` như cũ.
  - Nút "Hủy" / "Đóng" cũ bỏ đi vì `Sheet` đã có nút đóng tròn.
- **Đang nhập dở** (để `Sheet` hỏi "Bỏ thay đổi?"):
  - `PumpSheet`: khi một trong hai ô ml khác rỗng.
  - `LogEditSheet`: khi loại, các ô, giờ hoặc ghi chú khác lúc mở. Chế độ chỉ xem thì không bao giờ dở.
- **`LogEditSheet` chỉ xem** (người không có quyền sửa): thân sheet có dòng mô tả, ghi chú (nếu có) và câu "Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được."; không có `footer`.
- **"Loại"** khi thêm bản ghi mới có 6 lựa chọn (`MANUAL_TYPES`) nên giữ `<select>` native.
- **Trong `LogEditSheet`, Thay tã dùng 2 `Switch` "Ướt" và "Bẩn"** (luật §8.3 đổi checkbox sang `Switch`), còn màu phân giữ `<select>` native (7 lựa chọn). Khác với sheet ghi nhanh có `Segmented` và `Swatch` ở M1, vì §8.3 yêu cầu giữ nguyên trường.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Spec §8.3: trường và logic giữ nguyên. Không đổi `LOG_FIELDS`, `MANUAL_TYPES`, `buildLogPatch`, `parsePumpAmounts`, các hook dữ liệu, quyền sửa (`canModify`), câu hỏi xác nhận xóa.
- `PumpSheet` và `LogEditSheet` giữ nguyên props. `PumpSheet.onClose` vẫn được gọi khi Lưu xong và khi bấm "Bỏ qua" (Đợt 3 / M3 dùng nó để hiện Toast Hoàn tác đang đợi).
- Vùng chạm tối thiểu 44×44 pt; ô số có `inputMode` số; tôn trọng `safe-area-inset-*`. Không tắt viền focus.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay chỉ mở sheet, gõ thử, đổi lựa chọn rồi **đóng không lưu**. **Không bấm Lưu, không bấm "Xóa bản ghi"**, không bấm nút bấm giờ.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot4-m1`):

- Đợt 4 / M1: `components/quick/styles.ts` (`FIELD_LABEL`, `FIELD_INPUT`); cách dựng sheet trong `components/home/QuickEntrySheet.tsx` (mẫu `Sheet` + `form id` + `footer`).
- `components/ui/`:
  - `Sheet({ open, onClose, title, icon?, iconColor?, dirty?, footer?, children })`.
  - `Button` (`variant` primary/secondary/ghost/danger, `block`, `busy`, thuộc tính `<button>`).
  - `Segmented`, `Switch`; `components/ui/testTree.ts` (`findElements`).
- `lib/rules/quickEntry.ts`: `QuickField`, `QuickValues`; `lib/rules/logForm.ts`: `LOG_FIELDS`, `MANUAL_TYPES`, `buildLogPatch`, `defaultLogValues`, `valuesFromDetails`; `lib/rules/logDetails.ts`: `isTimerType`, `LogType`; `lib/rules/pumpForm.ts`: `parsePumpAmounts`; `lib/rules/alerts.ts`: `medicineWarnings`; `lib/rules/describeLog.ts`: `describeLog`; `lib/rules/time.ts`: `formatVnTime`, `fromVnLocalInput`, `toVnLocalInput`; `lib/ui/categories.ts`: `CATEGORIES`.
- `lib/data/logs.ts`: `useSaveLog`, `useDeleteLog`, `useSetPumpAmounts`; `lib/data/errors.ts`: `toVietnameseError`.
- Nơi gọi: `components/actions/QuickActions.tsx` (`PumpSheet`), `components/history/HistoryScreen.tsx` (`LogEditSheet`). Không sửa hai file này.

**Produces** (M3 dùng):

- `components/quick/FieldList.tsx`: `FieldList({ fields: QuickField[]; values: QuickValues; onChange: (next: QuickValues) => void })`.
- `components/home/PumpSheet.tsx`, `components/history/LogEditSheet.tsx`: cùng chữ ký, giao diện mới.
- Xóa: `components/form/QuickFields.tsx`.

---

### Task 1: `FieldList` — ô nhập chung theo luật §8.3

**Files:**

- Create: `components/quick/FieldList.tsx`, `components/quick/fieldlist.test.tsx`

**Interfaces:**

- Consumes: `QuickField`, `QuickValues`; `LOG_FIELDS` (test); `Segmented`, `Switch`; `FIELD_LABEL`, `FIELD_INPUT`; `findElements`.
- Produces: `FieldList` (chữ ký ở Contracts).

- [ ] **Step 1: Viết test hỏng**

`components/quick/fieldlist.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { LOG_FIELDS } from "@/lib/rules/logForm";
import { FieldList } from "./FieldList";

const html = (props: Parameters<typeof FieldList>[0]) =>
  renderToStaticMarkup(<FieldList {...props} />);

describe("FieldList", () => {
  it("checkboxes become switches; a long select stays native and follows showIf", () => {
    const fields = LOG_FIELDS.diaper;
    const wetOnly = html({
      fields,
      values: { wet: true, dirty: false, stoolColor: "" },
      onChange: () => {},
    });
    expect(wetOnly.match(/role="switch"/g)).toHaveLength(2);
    expect(wetOnly).toContain('aria-label="Ướt"');
    expect(wetOnly).not.toContain("<select");
    const dirty = html({
      fields,
      values: { wet: false, dirty: true, stoolColor: "green" },
      onChange: () => {},
    });
    expect(dirty).toContain(">Màu phân</span>");
    expect(dirty).toContain("<select");
    expect(dirty).toContain("accent-accent");
    expect(dirty.match(/<option/g)).toHaveLength(7);
    expect(dirty).not.toContain('type="checkbox"');
  });

  it("selects with 2 to 4 options become a segmented control", () => {
    const side = html({
      fields: LOG_FIELDS.breast,
      values: { side: "left" },
      onChange: () => {},
    });
    expect(side).toContain('aria-label="Bên"');
    expect(side).toMatch(/aria-pressed="true"[^>]*>Trái<\/button>/);
    const method = html({
      fields: LOG_FIELDS.temperature,
      values: { celsius: "37,5", method: "tai" },
      onChange: () => {},
    });
    expect(method).toMatch(/aria-pressed="true"[^>]*>Tai<\/button>/);
    expect(method).not.toContain("<select");
  });

  it("numbers use the decimal keyboard, text fields the normal one", () => {
    const med = html({
      fields: LOG_FIELDS.medicine,
      values: {
        name: "Paracetamol",
        amount: "2,5",
        unit: "ml",
        antipyretic: false,
      },
      onChange: () => {},
    });
    expect(med).toContain('value="Paracetamol"');
    expect(med).toContain('inputMode="decimal"');
    expect(med).toContain('value="2,5"');
    expect(med).toContain(">Tên thuốc</span>");
  });

  it("reports changes with the field's key", () => {
    const onChange = vi.fn();
    const values = { wet: true, dirty: false, stoolColor: "" };
    const tree = FieldList({ fields: LOG_FIELDS.diaper, values, onChange });
    const [dirtySwitch] = findElements(tree, (el) => el.props.label === "Bẩn");
    (dirtySwitch.props.onChange as (v: boolean) => void)(true);
    expect(onChange).toHaveBeenLastCalledWith({ ...values, dirty: true });
    const sideTree = FieldList({
      fields: LOG_FIELDS.breast,
      values: { side: "left" },
      onChange,
    });
    const [segmented] = findElements(
      sideTree,
      (el) => el.props.options !== undefined,
    );
    (segmented.props.onChange as (v: string) => void)("right");
    expect(onChange).toHaveBeenLastCalledWith({ side: "right" });
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/quick/fieldlist.test.tsx`
Expected: FAIL — `Cannot find module './FieldList'`.

- [ ] **Step 3: Viết `components/quick/FieldList.tsx`**

```tsx
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import type { QuickField, QuickValues } from "@/lib/rules/quickEntry";
import { FIELD_INPUT, FIELD_LABEL } from "./styles";

// Spec §8.3: same fields as before, drawn with ui components. A checkbox becomes a
// Switch, a select with 2–4 options a Segmented, a longer select stays native.
export function FieldList({
  fields,
  values,
  onChange,
}: {
  fields: QuickField[];
  values: QuickValues;
  onChange: (next: QuickValues) => void;
}) {
  return (
    <>
      {fields
        .filter((field) => !field.showIf || field.showIf(values))
        .map((field) => {
          const value = values[field.key];
          const set = (next: string | boolean) =>
            onChange({ ...values, [field.key]: next });

          if (field.kind === "checkbox")
            return (
              <div
                key={field.key}
                className="glass flex min-h-[52px] items-center justify-between gap-3 rounded-[22px] px-4"
              >
                <span className="text-base text-ink">{field.label}</span>
                <Switch
                  checked={value === true}
                  label={field.label}
                  onChange={set}
                />
              </div>
            );

          if (field.kind === "select") {
            const options = field.options ?? [];
            if (options.length >= 2 && options.length <= 4)
              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <span className={FIELD_LABEL}>{field.label}</span>
                  <Segmented
                    label={field.label}
                    options={options}
                    value={String(value)}
                    onChange={set}
                  />
                </div>
              );
            return (
              <label key={field.key} className="flex flex-col gap-1.5">
                <span className={FIELD_LABEL}>{field.label}</span>
                <select
                  className={`${FIELD_INPUT} accent-accent`}
                  value={String(value)}
                  onChange={(event) => set(event.target.value)}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label key={field.key} className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>{field.label}</span>
              <input
                className={
                  field.kind === "number"
                    ? `${FIELD_INPUT} tabular-nums`
                    : FIELD_INPUT
                }
                inputMode={field.kind === "number" ? "decimal" : "text"}
                value={String(value ?? "")}
                onChange={(event) => set(event.target.value)}
              />
            </label>
          );
        })}
    </>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/quick/fieldlist.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (FieldList 4, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/quick/FieldList.tsx components/quick/fieldlist.test.tsx
git commit -m "feat(entry): FieldList draws log fields with switches and segmented controls"
```

---

### Task 2: `PumpSheet` trên `Sheet` kính

**Files:**

- Modify: `components/home/PumpSheet.tsx` (viết lại toàn file)
- Create: `components/home/pumpsheet.test.tsx`

**Interfaces:**

- Consumes: `Sheet`, `Button`; `FIELD_INPUT`, `FIELD_LABEL`; `useSetPumpAmounts`; `parsePumpAmounts`; `toVietnameseError`.
- Produces: `PumpSheet({ logId, babyId, userId, onClose })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/home/pumpsheet.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { PumpSheet } from "./PumpSheet";

describe("PumpSheet", () => {
  it("asks ml per side in a glass sheet with Lưu and Bỏ qua", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <PumpSheet logId="p1" babyId="b1" userId="u1" onClose={() => {}} />
      </QueryClientProvider>,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain(">Đã hút được bao nhiêu?</h2>");
    expect(html).toContain("bg-cat-pump/15 text-cat-pump");
    expect(html).toContain(`d="${ICON_PATHS.cup}"`);
    expect(html).toContain(">Bên trái (ml)</span>");
    expect(html).toContain(">Bên phải (ml)</span>");
    expect(html.match(/inputMode="numeric"/g)).toHaveLength(2);
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(formId).toBeTruthy();
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).toContain(">Bỏ qua</button>");
    expect(html).not.toContain("rounded-2xl border");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/home/pumpsheet.test.tsx`
Expected: FAIL — sheet cũ không có `<dialog`.

- [ ] **Step 3: Viết lại `components/home/PumpSheet.tsx`**

```tsx
"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useSetPumpAmounts } from "@/lib/data/logs";
import { parsePumpAmounts } from "@/lib/rules/pumpForm";

export function PumpSheet({
  logId,
  babyId,
  userId,
  onClose,
}: {
  logId: string;
  babyId: string;
  userId: string;
  onClose: () => void;
}) {
  const save = useSetPumpAmounts(babyId, userId);
  const formId = useId();
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePumpAmounts({ left, right });
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    save.mutate(
      { id: logId, details: parsed.details },
      {
        onSuccess: onClose,
        onError: (error) => setMessage(toVietnameseError(error)),
      },
    );
  }

  const field = (
    label: string,
    value: string,
    setValue: (next: string) => void,
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        inputMode="numeric"
        className={`${FIELD_INPUT} tabular-nums`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </label>
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title="Đã hút được bao nhiêu?"
      icon="cup"
      iconColor="cat-pump"
      dirty={left !== "" || right !== ""}
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
            busy={save.isPending}
            className="min-h-14!"
          >
            Lưu
          </Button>
          <Button variant="ghost" block onClick={onClose}>
            Bỏ qua
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={submit}
        className="grid grid-cols-2 gap-3 pt-1"
      >
        {field("Bên trái (ml)", left, setLeft)}
        {field("Bên phải (ml)", right, setRight)}
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/home/pumpsheet.test.tsx components/actions lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (pumpsheet 1, components/actions giữ nguyên số test, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/home/PumpSheet.tsx components/home/pumpsheet.test.tsx
git commit -m "feat(entry): pumping ml sheet on the glass sheet"
```

---

### Task 3: `LogEditSheet` trên `Sheet` kính; xóa `QuickFields`

**Files:**

- Modify: `components/history/LogEditSheet.tsx` (viết lại toàn file)
- Create: `components/history/logedit.test.tsx`
- Delete: `components/form/QuickFields.tsx`

**Interfaces:**

- Consumes: `FieldList` (Task 1); `Sheet`, `Button`; `FIELD_INPUT`, `FIELD_LABEL`; `CATEGORIES`; `useSaveLog`, `useDeleteLog`; `buildLogPatch`, `defaultLogValues`, `LOG_FIELDS`, `MANUAL_TYPES`, `valuesFromDetails`; `isTimerType`, `LogType`; `medicineWarnings`; `describeLog`; `formatVnTime`, `fromVnLocalInput`, `toVnLocalInput`; `toVietnameseError`.
- Produces: `LogEditSheet({ babyId, userId, log, canModify, who, recentLogs, onClose })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/history/logedit.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LogRow } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { LogEditSheet } from "./LogEditSheet";

const diaper = {
  id: "d1",
  baby_id: "b1",
  type: "diaper",
  started_at: "2026-11-14T04:00:00.000Z",
  ended_at: "2026-11-14T04:00:00.000Z",
  details: { wet: true, dirty: false },
  note: "bé quấy",
  created_by: "u2",
  created_at: "2026-11-14T04:00:00.000Z",
  updated_at: "2026-11-14T04:00:00.000Z",
} as LogRow;

const render = (props: Partial<ComponentProps<typeof LogEditSheet>>) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <LogEditSheet
        babyId="b1"
        userId="u1"
        log={null}
        canModify
        who="Mẹ"
        recentLogs={[]}
        onClose={() => {}}
        {...props}
      />
    </QueryClientProvider>,
  );

describe("LogEditSheet", () => {
  it("new log: type picker, fields, start and end, Lưu, no delete", () => {
    const html = render({});
    expect(html).toContain("<dialog");
    expect(html).toContain(">Thêm bản ghi</h2>");
    expect(html).toContain("bg-cat-feed/15 text-cat-feed");
    expect(html).toContain(">Loại</span>");
    expect(html).toContain('<option value="temperature">Nhiệt độ</option>');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Trái<\/button>/);
    expect(html).toContain(">Bắt đầu</span>");
    expect(html).toContain(">Kết thúc</span>");
    expect(html.match(/type="datetime-local"/g)).toHaveLength(2);
    expect(html).toContain(">Ghi chú</span>");
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Xóa bản ghi");
    expect(html).not.toContain("Hủy");
  });

  it("own log: description, switches for the diaper, Lưu and Xóa bản ghi", () => {
    const html = render({ log: diaper });
    expect(html).toContain(">Bản ghi</h2>");
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain(`d="${ICON_PATHS.drop}"`);
    expect(html).toContain("11:00 · Tã ướt · Mẹ");
    expect(html.match(/role="switch"/g)).toHaveLength(2);
    expect(html).toContain(">Thời điểm</span>");
    expect(html).not.toContain(">Loại</span>");
    expect(html).toContain(">Xóa bản ghi</button>");
    expect(html).toContain("text-danger!");
  });

  it("someone else's log without rights: read only, no footer", () => {
    const html = render({ log: diaper, canModify: false });
    expect(html).toContain("<dialog");
    expect(html).toContain(
      "Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được.",
    );
    expect(html).toContain("Ghi chú: bé quấy");
    expect(html).not.toContain('type="submit"');
    expect(html).not.toContain("<input");
    expect(html).not.toContain("Xóa bản ghi");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/history/logedit.test.tsx`
Expected: FAIL — sheet cũ không có `<dialog` (3 test hỏng).

- [ ] **Step 3: Viết lại `components/history/LogEditSheet.tsx`**

```tsx
"use client";

import { useId, useState, type FormEvent } from "react";
import { FieldList } from "@/components/quick/FieldList";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useDeleteLog, useSaveLog } from "@/lib/data/logs";
import { medicineWarnings } from "@/lib/rules/alerts";
import { describeLog } from "@/lib/rules/describeLog";
import { isTimerType, type LogType } from "@/lib/rules/logDetails";
import {
  buildLogPatch,
  defaultLogValues,
  LOG_FIELDS,
  MANUAL_TYPES,
  valuesFromDetails,
} from "@/lib/rules/logForm";
import type { QuickValues } from "@/lib/rules/quickEntry";
import {
  formatVnTime,
  fromVnLocalInput,
  toVnLocalInput,
} from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES } from "@/lib/ui/categories";

export function LogEditSheet({
  babyId,
  userId,
  log,
  canModify,
  who,
  recentLogs,
  onClose,
}: {
  babyId: string;
  userId: string;
  log: LogRow | null;
  canModify: boolean;
  who: string;
  recentLogs: LogRow[];
  onClose: () => void;
}) {
  const save = useSaveLog(babyId, userId);
  const remove = useDeleteLog(babyId, userId);
  const formId = useId();
  const [type, setType] = useState<LogType>(
    () => (log?.type as LogType | undefined) ?? "breast",
  );
  const [values, setValues] = useState<QuickValues>(() =>
    log ? valuesFromDetails(type, log.details) : defaultLogValues(type),
  );
  const [start, setStart] = useState(() =>
    toVnLocalInput(log ? new Date(log.started_at) : new Date()),
  );
  const [end, setEnd] = useState(() => {
    if (!log) return toVnLocalInput(new Date());
    return log.ended_at ? toVnLocalInput(new Date(log.ended_at)) : "";
  });
  const [note, setNote] = useState(log?.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  // What the form held when it opened, to tell whether the user has changed anything.
  const [opened] = useState(() =>
    JSON.stringify({ type, values, start, end, note }),
  );

  const readOnly = log !== null && !canModify;
  const timer = isTimerType(type);
  const allowOpenEnd = log !== null && log.ended_at === null;
  const startAt = fromVnLocalInput(start);
  const warnings =
    !log &&
    type === "medicine" &&
    values.antipyretic === true &&
    !Number.isNaN(startAt.getTime())
      ? medicineWarnings({ logs: recentLogs, at: startAt })
      : [];
  const busy = save.isPending || remove.isPending;
  const dirty =
    !readOnly && JSON.stringify({ type, values, start, end, note }) !== opened;
  const category = CATEGORIES[type];

  function submit(event: FormEvent) {
    event.preventDefault();
    const built = buildLogPatch({
      type,
      values,
      start,
      end,
      note,
      allowOpenEnd,
      now: new Date(),
    });
    if (!built.ok) {
      setMessage(built.message);
      return;
    }
    save.mutate(
      { id: log?.id ?? null, type, patch: built.patch },
      {
        onSuccess: onClose,
        onError: (error) => setMessage(toVietnameseError(error)),
      },
    );
  }

  function confirmDelete() {
    if (!log || !window.confirm("Xóa bản ghi này?")) return;
    remove.mutate(log.id, {
      onSuccess: onClose,
      onError: (error) => setMessage(toVietnameseError(error)),
    });
  }

  const dateField = (
    label: string,
    value: string,
    setValue: (next: string) => void,
    hint?: string,
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        type="datetime-local"
        className={FIELD_INPUT}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </label>
  );

  return (
    <Sheet
      open
      onClose={onClose}
      title={log ? "Bản ghi" : "Thêm bản ghi"}
      icon={category.icon}
      iconColor={category.token}
      dirty={dirty}
      footer={
        readOnly ? undefined : (
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
              busy={save.isPending}
              disabled={remove.isPending}
              className="min-h-14!"
            >
              Lưu
            </Button>
            {log && (
              <Button
                variant="ghost"
                block
                disabled={busy}
                onClick={confirmDelete}
                className="text-danger!"
              >
                Xóa bản ghi
              </Button>
            )}
          </div>
        )
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        {log && (
          <p className="text-[15px] text-muted tabular-nums">
            {formatVnTime(new Date(log.started_at))} ·{" "}
            {describeLog(log, new Date())} · {who}
          </p>
        )}
        {readOnly ? (
          <>
            {log?.note && (
              <p className="text-[15px] text-muted">Ghi chú: {log.note}</p>
            )}
            <p className="rounded-[16px] bg-muted/15 p-3 text-[15px] text-ink">
              Chỉ người ghi bản ghi này hoặc chủ gia đình mới sửa hoặc xóa được.
            </p>
          </>
        ) : (
          <>
            {!log && (
              <label className="flex flex-col gap-1.5">
                <span className={FIELD_LABEL}>Loại</span>
                <select
                  className={`${FIELD_INPUT} accent-accent`}
                  value={type}
                  onChange={(event) => {
                    const next = event.target.value as LogType;
                    setType(next);
                    setValues(defaultLogValues(next));
                  }}
                >
                  {MANUAL_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <FieldList
              fields={LOG_FIELDS[type]}
              values={values}
              onChange={setValues}
            />
            {dateField(timer ? "Bắt đầu" : "Thời điểm", start, setStart)}
            {timer &&
              dateField(
                "Kết thúc",
                end,
                setEnd,
                allowOpenEnd ? "Để trống nếu vẫn đang chạy." : undefined,
              )}
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>Ghi chú</span>
              <textarea
                className={`${FIELD_INPUT} min-h-20 py-2.5`}
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            {warnings.map((warning) => (
              <p
                key={warning}
                role="status"
                className="rounded-[16px] bg-warn-soft p-3 text-[15px] text-warn-ink"
              >
                {warning}
              </p>
            ))}
          </>
        )}
      </form>
    </Sheet>
  );
}
```


- [ ] **Step 4: Xóa `QuickFields` cũ**

Run: `git rm components/form/QuickFields.tsx && ! grep -rnw "QuickFields" app components lib`
Expected: `git rm` báo 1 file; `grep` không in gì (lệnh trả mã 0).

- [ ] **Step 5: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 587 có sẵn + 4 FieldList + 1 PumpSheet + 3 LogEditSheet = 595. Build xong.

- [ ] **Step 6: Kiểm trên trình duyệt (không lưu, không xóa)**

Run: `bun run dev`, mở `http://localhost:3000/nhat-ky` ở bề rộng 375 px, đăng nhập. **Không bấm Lưu, không bấm "Xóa bản ghi", không bấm nút bấm giờ** (dữ liệu thật).
Expected:

- Bấm một bản ghi do chính tài khoản đang đăng nhập ghi. Sheet kính "Bản ghi" mở ra:
  - có chip icon màu loại, dòng "HH:mm · mô tả · người";
  - có các ô theo loại: Thay tã có 2 công tắc Ướt / Bẩn; Bú mẹ có `Segmented` Trái / Phải;
  - có giờ, ghi chú, nút "Lưu" to và "Xóa bản ghi" chữ đỏ.

  Đổi một công tắc rồi bấm nút đóng: hỏi "Bỏ thay đổi?". Bấm "Bỏ" để đóng.

- Nút thêm bản ghi cũ ("+ Thêm" / "Thêm bản ghi"): sheet "Thêm bản ghi" có ô "Loại". Đổi "Loại" sang Nhiệt độ: chip đổi màu, các ô đổi theo. Đóng, rồi bấm "Bỏ".
- `PumpSheet` chỉ hiện sau khi dừng Hút sữa nên không kiểm tay được ở đây; nó có test SSR và nằm trong checklist bước 28 (M3).
- Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 7: Commit**

```bash
git add components/history
git commit -m "feat(entry): log edit sheet on the glass sheet; drop QuickFields"
```

---

## Kết thúc M2 (Đợt 4)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 595 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 4 / M3 (`GrowthSheet`, `DoseSheet`, `MilestoneSheet`; checklist bước 28).
