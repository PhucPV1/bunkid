# Kim Bun UI — Đợt 4 / M3 (Sheet Tăng trưởng, Mũi tiêm, Mốc phát triển) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Chuyển `GrowthSheet`, `MilestoneSheet`, `DoseSheet` sang `Sheet` kính và component ui theo spec §8 và §8.3. Trường và logic giữ nguyên; riêng lựa chọn Đã tiêm / Bỏ qua / Đổi ngày hẹn (3 lựa chọn) đổi thành `Segmented`. Thêm checklist bước 28 cho 5 sheet của §8.3. Xong M3 là xong Đợt 4.

**Architecture:**

- Mỗi sheet giữ nguyên chữ ký, các hook dữ liệu và hàm kiểm tra:
  - `GrowthSheet`: `useGrowthActions`, `parseGrowthForm`, `growthToRaw`.
  - `MilestoneSheet`: `useMilestoneActions`, `usePhotos`, `usePhotoUrls`, `parseMilestoneForm`.
  - `DoseSheet`: `useDoseActions`, `parseDoseForm`, `formatDueDate`.
- Khung đổi theo mẫu của Đợt 4 / M1–M2:
  - `Sheet` với `open` luôn bật, vì nơi gọi chỉ mount khi cần.
  - `form id` trong thân sheet.
  - `footer` có lỗi `role="alert"`, nút Lưu cao 56 `type="submit" form=<id>`, và nút phụ `ghost` chữ đỏ cho thao tác xóa / bỏ đánh dấu.
- Ô nhập dùng `FIELD_LABEL` / `FIELD_INPUT` từ `components/quick/styles.ts`.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 4:** M1 (4 sheet ghi nhanh) và M2 (`FieldList`, `PumpSheet`, `LogEditSheet`) đã xong trên nhánh `feat/kim-bun-dot4-m2`. **M3 (plan này)** là mốc cuối của Đợt 4.

**Quyết định cho chỗ spec chưa nói rõ:**

- Ba sheet này không gắn với một loại sự kiện (`CATEGORIES`), nên đầu sheet không có chip icon màu, chỉ có tiêu đề và nút đóng tròn.
- Nút "Hủy" / "Đóng" cũ bỏ đi vì `Sheet` đã có nút đóng tròn. Nút phụ nằm trong `footer`, dưới Lưu, kiểu `ghost` chữ `--color-danger`:
  - "Xóa lần đo" vẫn hỏi `window.confirm("Xóa lần đo này?")` như cũ.
  - "Bỏ đánh dấu" và "Xóa đánh dấu" vẫn không hỏi, như cũ.
- Nút Lưu bị khóa khi đang lưu hoặc đang xóa, để tránh bấm hai lần. Sheet cũ của Tăng trưởng và Mốc phát triển không khóa.
- "Đang nhập dở" (để `Sheet` hỏi "Bỏ thay đổi?") là khi các ô khác lúc mở sheet.
- Lỗi từng ô của Tăng trưởng (`parseGrowthForm` trả lỗi theo ô) vẫn hiện ngay dưới ô đó như cũ; chỉ lỗi lưu chung mới hiện trên nút Lưu. Ngoại lệ có chủ ý với §8 để giữ logic.
- `Segmented` gọi `onChange` cả khi bấm lại lựa chọn đang chọn, còn nhóm radio cũ thì không. Vì vậy `chooseAction` bỏ qua lần bấm lại, để không đặt lại ngày.
- Lưới chọn ảnh của Mốc phát triển:
  - Ô "Không" khi chọn có nền `--color-ink`, chữ `--color-bg` (như chip đang chọn). Khi không chọn thì là kính.
  - Ảnh khi chọn có vòng 2 px `--color-accent-text` cách 2 px (như `Swatch`).

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Spec §8.3: trường và logic giữ nguyên. Không đổi `parseGrowthForm`, `growthToRaw`, `parseMilestoneForm`, `parseDoseForm`, các hook dữ liệu, `min`/`max` của ô ngày, độ dài tối đa của ô chữ, luật "nơi tiêm chỉ lưu khi Đã tiêm".
- Ba sheet giữ nguyên props; nơi gọi (`GrowthScreen`, `MilestonesScreen`, `VaccineScreen`) không sửa.
- Vùng chạm tối thiểu 44×44 pt; ô số có `inputMode="decimal"`; tôn trọng `safe-area-inset-*`. Không tắt viền focus.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay chỉ mở sheet, gõ thử, đổi lựa chọn rồi **đóng không lưu**. **Không bấm Lưu, "Xóa lần đo", "Bỏ đánh dấu", "Xóa đánh dấu".**
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot4-m2`):

- `components/quick/styles.ts`: `FIELD_LABEL`, `FIELD_INPUT`.
- `components/ui/`:
  - `Sheet({ open, onClose, title, dirty?, footer?, children })`.
  - `Button` (`variant`, `block`, `busy`, thuộc tính `<button>`).
  - `Segmented<T>({ label, options, value, onChange })`.
- `lib/data/growth.ts`: `useGrowthActions(babyId, userId)` → `{ add, update, remove }`.
- `lib/data/milestones.ts`: `useMilestoneActions` → `{ mark, unmark }`.
- `lib/data/photos.ts`: `usePhotos`, `usePhotoUrls`.
- `lib/data/vaccines.ts`: `useDoseActions` → `{ save, clear }`.
- `lib/rules/growthForm.ts`: `growthToRaw`, `parseGrowthForm`, `GrowthFormRaw`.
- `lib/rules/milestones.ts`: `parseMilestoneForm`.
- `lib/rules/vaccineForm.ts`: `formatDueDate`, `parseDoseForm`, `DoseAction`, `DoseFormRaw`.
- `lib/rules/vaccines.ts`: `ScheduleItem`.
- `lib/rules/time.ts`: `vnDateString`.
- `lib/data/errors.ts`: `toVietnameseError`.

**Produces:**

- `components/growth/GrowthSheet.tsx`, `components/milestones/MilestoneSheet.tsx`, `components/vaccines/DoseSheet.tsx`: cùng chữ ký, giao diện mới.
- `docs/device-checklist.md`: bước 28.

---

### Task 1: `GrowthSheet` trên `Sheet` kính

**Files:**

- Modify: `components/growth/GrowthSheet.tsx` (viết lại toàn file)
- Create: `components/growth/growthsheet.test.tsx`

**Interfaces:**

- Consumes: `Sheet`, `Button`; `FIELD_LABEL`, `FIELD_INPUT`; `useGrowthActions`; `growthToRaw`, `parseGrowthForm`, `GrowthFormRaw`; `vnDateString`; `toVietnameseError`.
- Produces: `GrowthSheet({ babyId, userId, dob, row, canDelete, onClose })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/growth/growthsheet.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GrowthRow } from "@/lib/supabase/rows";
import { GrowthSheet } from "./GrowthSheet";

const row = {
  id: "g1",
  baby_id: "b1",
  measured_on: "2026-11-01",
  weight_g: 5200,
  length_cm: 58.5,
  head_cm: null,
  created_by: "u1",
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z",
} as GrowthRow;

const render = (props: Partial<ComponentProps<typeof GrowthSheet>>) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <GrowthSheet
        babyId="b1"
        userId="u1"
        dob="2026-09-10"
        row={null}
        canDelete={false}
        onClose={() => {}}
        {...props}
      />
    </QueryClientProvider>,
  );

describe("GrowthSheet", () => {
  it("new measurement: date and three decimal fields, Lưu, nothing to delete", () => {
    const html = render({});
    expect(html).toContain("<dialog");
    expect(html).toContain(">Thêm lần đo</h2>");
    expect(html).toContain(">Ngày đo</span>");
    expect(html).toContain('min="2026-09-10"');
    expect(html).toContain(">Cân nặng (kg, ví dụ 5,2)</span>");
    expect(html).toContain(">Vòng đầu (cm)</span>");
    expect(html.match(/inputMode="decimal"/g)).toHaveLength(3);
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(formId).toBeTruthy();
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Xóa lần đo");
    expect(html).not.toContain("Hủy");
  });

  it("editing: values filled in, and Xóa lần đo for whoever may delete", () => {
    const html = render({ row, canDelete: true });
    expect(html).toContain(">Sửa lần đo</h2>");
    expect(html).toContain('value="2026-11-01"');
    expect(html).toContain('value="5,2"');
    expect(html).toContain('value="58,5"');
    expect(html).toContain(">Xóa lần đo</button>");
    expect(html).toContain("text-danger!");
    expect(render({ row, canDelete: false })).not.toContain("Xóa lần đo");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/growth/growthsheet.test.tsx`
Expected: FAIL — 2 test hỏng (sheet cũ không có `<dialog`, không có kiểu mới).

- [ ] **Step 3: Viết lại `components/growth/GrowthSheet.tsx`**

```tsx
"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowthActions } from "@/lib/data/growth";
import {
  growthToRaw,
  parseGrowthForm,
  type GrowthFormRaw,
} from "@/lib/rules/growthForm";
import { vnDateString } from "@/lib/rules/time";
import type { GrowthRow } from "@/lib/supabase/rows";

const FIELDS: {
  key: Exclude<keyof GrowthFormRaw, "measuredOn">;
  label: string;
}[] = [
  { key: "weightKg", label: "Cân nặng (kg, ví dụ 5,2)" },
  { key: "lengthCm", label: "Chiều dài (cm)" },
  { key: "headCm", label: "Vòng đầu (cm)" },
];

export function GrowthSheet({
  babyId,
  userId,
  dob,
  row,
  canDelete,
  onClose,
}: {
  babyId: string;
  userId: string;
  dob: string;
  row: GrowthRow | null;
  canDelete: boolean;
  onClose: () => void;
}) {
  const actions = useGrowthActions(babyId, userId);
  const formId = useId();
  const today = vnDateString(new Date());
  const [opened] = useState<GrowthFormRaw>(() =>
    row
      ? growthToRaw(row)
      : { measuredOn: today, weightKg: "", lengthCm: "", headCm: "" },
  );
  const [raw, setRaw] = useState<GrowthFormRaw>(opened);
  const [errors, setErrors] = useState<
    Partial<Record<keyof GrowthFormRaw, string>>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = actions.add.isPending || actions.update.isPending;
  const deleting = actions.remove.isPending;
  const done = {
    onSuccess: onClose,
    onError: (error: unknown) => setMessage(toVietnameseError(error)),
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseGrowthForm(raw, { dob, today });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    if (row) actions.update.mutate({ id: row.id, input: parsed.value }, done);
    else actions.add.mutate(parsed.value, done);
  }

  const error = (key: keyof GrowthFormRaw) =>
    errors[key] ? (
      <span className="text-[13px] text-danger">{errors[key]}</span>
    ) : null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={row ? "Sửa lần đo" : "Thêm lần đo"}
      dirty={JSON.stringify(raw) !== JSON.stringify(opened)}
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
            busy={saving}
            disabled={deleting}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {row && canDelete && (
            <Button
              variant="ghost"
              block
              disabled={saving || deleting}
              className="text-danger!"
              onClick={() => {
                if (window.confirm("Xóa lần đo này?"))
                  actions.remove.mutate(row.id, done);
              }}
            >
              Xóa lần đo
            </Button>
          )}
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ngày đo</span>
          <input
            type="date"
            className={FIELD_INPUT}
            min={dob}
            max={today}
            value={raw.measuredOn}
            onChange={(event) =>
              setRaw({ ...raw, measuredOn: event.target.value })
            }
          />
          {error("measuredOn")}
        </label>
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>{field.label}</span>
            <input
              inputMode="decimal"
              className={`${FIELD_INPUT} tabular-nums`}
              value={raw[field.key]}
              onChange={(event) =>
                setRaw({ ...raw, [field.key]: event.target.value })
              }
            />
            {error(field.key)}
          </label>
        ))}
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/growth/growthsheet.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (GrowthSheet 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/growth/GrowthSheet.tsx components/growth/growthsheet.test.tsx
git commit -m "feat(entry): growth sheet on the glass sheet"
```

---

### Task 2: `MilestoneSheet` trên `Sheet` kính

**Files:**

- Modify: `components/milestones/MilestoneSheet.tsx` (viết lại toàn file)
- Create: `components/milestones/milestonesheet.test.tsx`

**Interfaces:**

- Consumes: `Sheet`, `Button`; `FIELD_LABEL`, `FIELD_INPUT`; `useMilestoneActions`; `usePhotos`, `usePhotoUrls`; `parseMilestoneForm`; `vnDateString`; `toVietnameseError`; `cx`.
- Produces: `MilestoneSheet({ code, title, row, baby, userId, onClose })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/milestones/milestonesheet.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { MilestoneSheet } from "./MilestoneSheet";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;
const row = {
  id: "m1",
  baby_id: "b1",
  milestone_code: "smile",
  achieved_on: "2026-11-01",
  note: "cười với mẹ",
  photo_id: null,
  created_by: "u1",
  created_at: "2026-11-01T00:00:00.000Z",
} as MilestoneRow;

const render = (r: MilestoneRow | null) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <MilestoneSheet
        code="smile"
        title="Cười đáp lại"
        row={r}
        baby={baby}
        userId="u1"
        onClose={() => {}}
      />
    </QueryClientProvider>,
  );

describe("MilestoneSheet", () => {
  it("new: date and note in a glass sheet with Lưu, nothing to unmark", () => {
    const html = render(null);
    expect(html).toContain("<dialog");
    expect(html).toContain(">Cười đáp lại</h2>");
    expect(html).toContain(">Ngày đạt</span>");
    expect(html).toContain('min="2026-09-10"');
    expect(html).toContain(">Ghi chú (không bắt buộc)</span>");
    expect(html).toContain("<textarea");
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Bỏ đánh dấu");
    expect(html).not.toContain("Hủy");
  });

  it("already marked: keeps date and note, offers Bỏ đánh dấu", () => {
    const html = render(row);
    expect(html).toContain('value="2026-11-01"');
    expect(html).toContain(">cười với mẹ</textarea>");
    expect(html).toContain(">Bỏ đánh dấu</button>");
    expect(html).toContain("text-danger!");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/milestones/milestonesheet.test.tsx`
Expected: FAIL — 2 test hỏng (sheet cũ không có `<dialog`, không có kiểu mới).

- [ ] **Step 3: Viết lại `components/milestones/MilestoneSheet.tsx`**

```tsx
"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useMilestoneActions } from "@/lib/data/milestones";
import { usePhotos, usePhotoUrls } from "@/lib/data/photos";
import { parseMilestoneForm } from "@/lib/rules/milestones";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, MilestoneRow } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";

export function MilestoneSheet({
  code,
  title,
  row,
  baby,
  userId,
  onClose,
}: {
  code: string;
  title: string;
  row: MilestoneRow | null;
  baby: Baby;
  userId: string;
  onClose: () => void;
}) {
  const actions = useMilestoneActions(baby.id, userId);
  const formId = useId();
  const today = vnDateString(new Date());
  const photos = usePhotos(baby.id);
  // Recent photos first; the milestone keeps at most one (spec gốc §6.9).
  const choices = (photos.data ?? []).slice(0, 12);
  const urls = usePhotoUrls(choices.map((p) => p.storage_path));
  const [achievedOn, setAchievedOn] = useState(row?.achieved_on ?? today);
  const [note, setNote] = useState(row?.note ?? "");
  const [photoId, setPhotoId] = useState<string | null>(row?.photo_id ?? null);
  const [opened] = useState(() =>
    JSON.stringify({ achievedOn, note, photoId }),
  );
  const [message, setMessage] = useState<string | null>(null);
  const saving = actions.mark.isPending;
  const unmarking = actions.unmark.isPending;
  const done = {
    onSuccess: onClose,
    onError: (error: unknown) => setMessage(toVietnameseError(error)),
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseMilestoneForm(
      { achievedOn, note },
      { dob: baby.dob, today },
    );
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.mark.mutate({ code, ...parsed.value, photo_id: photoId }, done);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      dirty={JSON.stringify({ achievedOn, note, photoId }) !== opened}
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
            busy={saving}
            disabled={unmarking}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {row && (
            <Button
              variant="ghost"
              block
              disabled={saving || unmarking}
              className="text-danger!"
              onClick={() => actions.unmark.mutate(code, done)}
            >
              Bỏ đánh dấu
            </Button>
          )}
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ngày đạt</span>
          <input
            type="date"
            className={FIELD_INPUT}
            min={baby.dob}
            max={today}
            value={achievedOn}
            onChange={(event) => setAchievedOn(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ghi chú (không bắt buộc)</span>
          <textarea
            className={`${FIELD_INPUT} min-h-20 py-2.5`}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        {choices.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className={`${FIELD_LABEL} mb-2`}>
              Gắn ảnh (không bắt buộc)
            </legend>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                aria-pressed={photoId === null}
                onClick={() => setPhotoId(null)}
                className={cx(
                  "aspect-square rounded-[12px] text-[13px] font-semibold",
                  photoId === null ? "bg-ink text-bg" : "glass text-ink",
                )}
              >
                Không
              </button>
              {choices.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  aria-pressed={photoId === photo.id}
                  aria-label={photo.caption ?? `Ảnh ngày ${photo.taken_on}`}
                  onClick={() => setPhotoId(photo.id)}
                  className={cx(
                    "aspect-square overflow-hidden rounded-[12px] bg-muted/15",
                    photoId === photo.id &&
                      "ring-2 ring-accent-text ring-offset-2 ring-offset-bg",
                  )}
                >
                  {urls.data?.[photo.storage_path] && (
                    <img
                      src={urls.data[photo.storage_path]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/milestones/milestonesheet.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (MilestoneSheet 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/milestones/MilestoneSheet.tsx components/milestones/milestonesheet.test.tsx
git commit -m "feat(entry): milestone sheet on the glass sheet"
```

---

### Task 3: `DoseSheet` trên `Sheet` kính; checklist bước 28

**Files:**

- Modify: `components/vaccines/DoseSheet.tsx` (viết lại toàn file), `docs/device-checklist.md`
- Create: `components/vaccines/dosesheet.test.tsx`

**Interfaces:**

- Consumes: `Sheet`, `Button`, `Segmented`; `FIELD_LABEL`, `FIELD_INPUT`; `useDoseActions`; `formatDueDate`, `parseDoseForm`, `DoseAction`, `DoseFormRaw`; `ScheduleItem`; `vnDateString`; `toVietnameseError`.
- Produces: `DoseSheet({ item, row, babyId, userId, dob, onClose })`, cùng chữ ký.

Spec §8.3: lựa chọn Đã tiêm / Bỏ qua / Đổi ngày hẹn (3 lựa chọn, trước là nhóm radio) đổi thành `Segmented`. Cách đổi giữ nguyên `chooseAction`: đặt lại ngày (`today` cho Đã tiêm, `item.due` cho Đổi ngày hẹn, rỗng cho Bỏ qua) và xóa nơi tiêm khi không phải Đã tiêm.

- [ ] **Step 1: Viết test hỏng**

`components/vaccines/dosesheet.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import type { VaccineDoseRow } from "@/lib/supabase/rows";
import { DoseSheet } from "./DoseSheet";

const item = {
  dose: { code: "bcg", doseNo: 1, name: "Lao (BCG)", protects: ["Lao"] },
  due: "2026-11-20",
  state: "upcoming",
  record: null,
  unchosen: false,
  pastMaxAge: false,
} as unknown as ScheduleItem;

const rescheduled = {
  id: "v1",
  baby_id: "b1",
  vaccine_code: "bcg",
  dose_no: 1,
  status: "rescheduled",
  given_on: null,
  due_on_override: "2026-11-25",
  place: null,
  note: null,
  created_by: "u1",
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-01T00:00:00.000Z",
} as VaccineDoseRow;

const render = (row: VaccineDoseRow | null) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <DoseSheet
        item={item}
        row={row}
        babyId="b1"
        userId="u1"
        dob="2026-09-10"
        onClose={() => {}}
      />
    </QueryClientProvider>,
  );

describe("DoseSheet", () => {
  it("new: dose name, what it protects, a three-way choice, date and place, Lưu", () => {
    const html = render(null);
    expect(html).toContain("<dialog");
    expect(html).toContain(">Lao (BCG)</h2>");
    expect(html).toContain("Phòng: Lao. Hẹn ");
    expect(html).toContain("20/11/2026");
    expect(html).toContain('aria-label="Trạng thái mũi tiêm"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Đã tiêm<\/button>/);
    expect(html).toContain(">Đổi ngày hẹn</button>");
    expect(html).not.toContain('type="radio"');
    expect(html).toContain(">Ngày tiêm</span>");
    expect(html).toContain(">Nơi tiêm (không bắt buộc)</span>");
    const formId = /<form id="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain(`form="${formId}"`);
    expect(html).toMatch(/type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/);
    expect(html).not.toContain("Xóa đánh dấu");
    expect(html).not.toContain(">Đóng</button>");
  });

  it("rescheduled: new date, no place, and Xóa đánh dấu", () => {
    const html = render(rescheduled);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Đổi ngày hẹn<\/button>/);
    expect(html).toContain(">Ngày hẹn mới</span>");
    expect(html).toContain('value="2026-11-25"');
    expect(html).not.toContain("Nơi tiêm");
    expect(html).toContain(">Xóa đánh dấu</button>");
    expect(html).toContain("text-danger!");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/vaccines/dosesheet.test.tsx`
Expected: FAIL — 2 test hỏng (sheet cũ không có `<dialog`, không có kiểu mới).

- [ ] **Step 3: Viết lại `components/vaccines/DoseSheet.tsx`**

```tsx
"use client";

import { useId, useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { toVietnameseError } from "@/lib/data/errors";
import { useDoseActions } from "@/lib/data/vaccines";
import { vnDateString } from "@/lib/rules/time";
import {
  formatDueDate,
  parseDoseForm,
  type DoseAction,
  type DoseFormRaw,
} from "@/lib/rules/vaccineForm";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import type { VaccineDoseRow } from "@/lib/supabase/rows";

const ACTIONS: { value: DoseAction; label: string }[] = [
  { value: "done", label: "Đã tiêm" },
  { value: "skipped", label: "Bỏ qua" },
  { value: "rescheduled", label: "Đổi ngày hẹn" },
];

export function DoseSheet({
  item,
  row,
  babyId,
  userId,
  dob,
  onClose,
}: {
  item: ScheduleItem;
  row: VaccineDoseRow | null;
  babyId: string;
  userId: string;
  dob: string;
  onClose: () => void;
}) {
  const actions = useDoseActions(babyId, userId);
  const formId = useId();
  const today = vnDateString(new Date());
  const ref = { code: item.dose.code, doseNo: item.dose.doseNo };
  const [opened] = useState<DoseFormRaw>(() => {
    const action: DoseAction =
      row?.status === "skipped" || row?.status === "rescheduled"
        ? row.status
        : "done";
    return {
      action,
      date:
        action === "rescheduled"
          ? (row?.due_on_override ?? "")
          : (row?.given_on ?? today),
      place: row?.place ?? "",
      note: row?.note ?? "",
    };
  });
  const [raw, setRaw] = useState<DoseFormRaw>(opened);
  const [message, setMessage] = useState<string | null>(null);
  const saving = actions.save.isPending;
  const clearing = actions.clear.isPending;

  function set<K extends keyof DoseFormRaw>(key: K, value: DoseFormRaw[K]) {
    setRaw((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function chooseAction(action: DoseAction) {
    // Segmented fires on every tap; the old radios only fired on a real change.
    // Tapping the option already chosen keeps the date and place as they are.
    if (action === raw.action) return;
    setRaw((prev) => ({
      ...prev,
      action,
      date:
        action === "done" ? today : action === "rescheduled" ? item.due : "",
      // The place field is only shown for "done"; never save a hidden value.
      place: action === "done" ? prev.place : "",
    }));
    setMessage(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseDoseForm(raw, { dob, today });
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.save.mutate(
      { ref, patch: parsed.value },
      {
        onSuccess: onClose,
        onError: (error) => setMessage(toVietnameseError(error)),
      },
    );
  }

  function clear() {
    actions.clear.mutate(ref, {
      onSuccess: onClose,
      onError: (error) => setMessage(toVietnameseError(error)),
    });
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={item.dose.name}
      dirty={JSON.stringify(raw) !== JSON.stringify(opened)}
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
            busy={saving}
            disabled={clearing}
            className="min-h-14!"
          >
            Lưu
          </Button>
          {row && (
            <Button
              variant="ghost"
              block
              disabled={saving || clearing}
              className="text-danger!"
              onClick={clear}
            >
              Xóa đánh dấu
            </Button>
          )}
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4 pt-1">
        <p className="text-[15px] text-muted">
          Phòng: {item.dose.protects.join(", ")}. Hẹn {formatDueDate(item.due)}.
        </p>
        <Segmented
          label="Trạng thái mũi tiêm"
          options={ACTIONS}
          value={raw.action}
          onChange={chooseAction}
        />
        {raw.action !== "skipped" && (
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>
              {raw.action === "done" ? "Ngày tiêm" : "Ngày hẹn mới"}
            </span>
            <input
              type="date"
              className={FIELD_INPUT}
              min={raw.action === "done" ? dob : today}
              max={raw.action === "done" ? today : undefined}
              value={raw.date}
              onChange={(event) => set("date", event.target.value)}
            />
          </label>
        )}
        {raw.action === "done" && (
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Nơi tiêm (không bắt buộc)</span>
            <input
              className={FIELD_INPUT}
              maxLength={120}
              value={raw.place}
              onChange={(event) => set("place", event.target.value)}
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Ghi chú (không bắt buộc)</span>
          <textarea
            className={`${FIELD_INPUT} min-h-20 py-2.5`}
            maxLength={500}
            value={raw.note}
            onChange={(event) => set("note", event.target.value)}
          />
        </label>
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/vaccines/dosesheet.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (DoseSheet 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Thêm checklist bước 28 vào cuối `docs/device-checklist.md`**

```markdown
## Bước 28 — Các sheet còn lại (UI đợt 4)

1. Nhật ký → bấm một bản ghi của mình. Kỳ vọng:
   - sheet kính "Bản ghi" có chip icon màu loại, công tắc thay cho ô tick, ô chọn Trái/Phải hoặc chỗ đo dạng nút liền;
   - nút "Lưu" to và "Xóa bản ghi" chữ đỏ (bấm Xóa vẫn hỏi lại).

   Bản ghi của người khác (tài khoản thành viên): chỉ xem, không có nút.

2. Nhật ký → "+ Thêm". Đổi "Loại". Kỳ vọng: chip và các ô đổi theo; Lưu tạo bản ghi đúng giờ đã chọn.
3. Dừng "Hút sữa". Kỳ vọng:
   - sheet "Đã hút được bao nhiêu?" có chip cốc, 2 ô ml, "Lưu" và "Bỏ qua";
   - Lưu ghi ml vào bản ghi;
   - Toast "Đã ghi …" hiện sau khi sheet đóng.
4. Tăng trưởng → thêm lần đo. Kỳ vọng: bàn phím số khi gõ cân nặng; nhập sai thì báo đỏ ngay dưới ô; "Xóa lần đo" hỏi lại.
5. Tiêm chủng → bấm một mũi. Kỳ vọng:
   - ba nút liền "Đã tiêm / Bỏ qua / Đổi ngày hẹn";
   - đổi lựa chọn thì ô ngày đổi theo, ô "Nơi tiêm" chỉ hiện khi Đã tiêm;
   - bấm lại lựa chọn đang chọn thì ngày không đổi;
   - "Xóa đánh dấu" chỉ có khi mũi đã được đánh dấu.
6. Phát triển → bấm một mốc. Kỳ vọng: ngày đạt, ghi chú, lưới ảnh (nếu có ảnh) với ô "Không"; ảnh được chọn có vòng viền; "Bỏ đánh dấu" cho mốc đã đánh dấu.
7. Với mọi sheet trên:
   - kéo tay nắm xuống thì đóng;
   - đang nhập dở mà đóng thì hỏi "Bỏ thay đổi?";
   - trên iPhone 11 khi bàn phím bật vẫn cuộn tới nút Lưu;
   - ở 3 theme chữ đều rõ.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 6: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 595 có sẵn + 2 GrowthSheet + 2 MilestoneSheet + 2 DoseSheet = 601. Build xong.

- [ ] **Step 7: Kiểm trên trình duyệt (không lưu, không xóa)**

Run: `bun run dev`, mở `http://localhost:3000` ở bề rộng 375 px, đăng nhập. **Không bấm Lưu, "Xóa lần đo", "Bỏ đánh dấu", "Xóa đánh dấu"** (dữ liệu thật).
Expected:

- **Khám phá → Tăng trưởng → nút thêm lần đo:** sheet kính "Thêm lần đo" có ô ngày và 3 ô số. Gõ "5" vào cân nặng rồi bấm nút đóng tròn: hỏi "Bỏ thay đổi?". Bấm "Bỏ".
- **Khám phá → Tiêm chủng → bấm một mũi:** sheet có tên mũi, dòng "Phòng: …", 3 nút liền.
  - Bấm "Bỏ qua": ô ngày ẩn. Bấm "Đổi ngày hẹn": ô "Ngày hẹn mới" hiện, điền sẵn ngày hẹn.
  - Đóng, rồi bấm "Bỏ".
- **Khám phá → Phát triển → bấm một mốc:** sheet có "Ngày đạt", ghi chú, lưới ảnh nếu nhà có ảnh. Đóng mà không đổi gì: sheet đóng ngay, không hỏi.
- Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 8: Commit**

```bash
git add components/vaccines/DoseSheet.tsx components/vaccines/dosesheet.test.tsx docs/device-checklist.md
git commit -m "feat(entry): vaccine dose sheet on the glass sheet; checklist step 28"
```

---

## Kết thúc M3 (Đợt 4)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 601 test xanh, typecheck không lỗi, build xong.
- [ ] Đợt 4 xong. Bước tiếp theo: lập plan Đợt 5 (các màn còn lại theo spec §9, §10; xóa token cũ không còn dùng; dời dòng đồng bộ xuống dưới header trang; sửa nhãn "Hậu môn" bị xuống dòng).
