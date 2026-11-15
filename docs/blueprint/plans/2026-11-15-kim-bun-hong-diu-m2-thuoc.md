# Kim Bun — M2 Chip thuốc nhanh và đơn vị gói/ống Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-15-kim-bun-hong-diu-thuoc-popup-design.md` (§4, §6)

**Status:** approved 2026-11-15

**Goal:** Sheet "Cho uống thuốc" có 3 chip chọn nhanh Vitamin D, DHA, Men tiêu hoá. Bấm chip (chọn nhanh hay gần đây) là điền tên kèm liều của lần ghi trước. Có thêm đơn vị **gói** và **ống**.

**Architecture:**

- **Luật thuần** (`lib/rules/quickEntry.ts`):
  - `MEDICINE_PRESETS`.
  - `recentMedicineNames(logs, exclude)`: lọc các tên trùng chip chọn nhanh.
  - `medicinePrefill(name, logs)`: lấy liều lần trước của đúng thuốc đó.
- **Đơn vị:** `MEDICINE_UNITS` (6 đơn vị) là nguồn duy nhất, cho cả schema zod (`lib/rules/logDetails.ts`) lẫn `QUICK_FIELDS`.
- **`Segmented` nhận 2–6 lựa chọn.** `FieldList` dùng Segmented tới 6 lựa chọn, nên ô đơn vị trong `LogEditSheet` không bị rơi về `<select>`.
- **Giao diện:**
  - `MedicineFields` vẽ nhóm "Chọn nhanh" và nhóm "Gần đây", rồi gọi `onPick(name)`.
  - `QuickEntrySheet` nối `onPick` với `medicinePrefill`.
  - `HomeScreen` bỏ hằng `VITAMIN_D`, dùng `medicinePrefill("Vitamin D", rows)`.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, zod, Vitest (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-hong-diu-m2`, cắt từ `feat/kim-bun-hong-diu-m1`. Baseline: 669 test xanh (sau M1).

**Các mốc của spec này:**

| Mốc               | Nội dung                                     |
| ----------------- | -------------------------------------------- |
| M1                | §5 popup giữa màn hình                       |
| **M2 (plan này)** | §4 chip thuốc, đơn vị gói/ống, Segmented 2–6 |
| M3                | §3 bốn nền sáng (Hồng dịu, Đào mơ, Oải hương, Biển sương), checklist bước 30         |

**Quyết định cho chỗ spec chưa nói rõ:**

- **`MedicineFields` nhận `onPick(name)`, không nhận `logs`.** Lý do: component giữ hook-free để test gọi thẳng như hàm, và luật nằm ở `lib/rules/`. Prop `names` giữ tên cũ, nhưng từ nay là danh sách "Gần đây" đã lọc.
- **Tên điền vào là chữ trên chip**, không phải chữ của log cũ. Ví dụ log cũ "dha" thì bấm chip vẫn điền "DHA".
- **So "Vitamin D" không phân biệt hoa thường.** Ví dụ "vitamin d" chưa từng ghi thì vẫn điền 1 giọt.
- **Lượng thập phân dùng dấu phẩy**, ví dụ `2.5` → `"2,5"`, giống `stepAmount`. `buildDetails` đã đọc được dấu phẩy.
- **Nhãn hai nhóm** dùng `FIELD_LABEL` sẵn có, nằm ngay trên mỗi nhóm.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json`: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào.** Không tải font web. Không dùng emoji làm icon.
- **Màu:**
  - Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`.
  - Ngoại lệ, đúng như spec: lớp tối và bóng `rgb(0 0 0/0.3)` của hộp thoại, và `#E9DBDB` trong `public/manifest.webmanifest`.
  - `lib/themeGuard.test.ts` phải xanh.
- Vùng chạm tối thiểu 44×44 pt. Chip dùng `min-h-11`. Không thêm `env(safe-area-inset-*)` trong màn hình.
- Không lồng `glass` trong `glass` nếu chưa có quy tắc tắt blur (hotfix `7822c90` giữ nguyên).
- Logic thuần đặt trong `lib/rules/` và có unit test.
- **Không migration DB.** Cột `details` là jsonb, chỉ client kiểm. Rủi ro đã chấp nhận: máy còn chạy bản cũ đã cache sẽ thấy log "gói"/"ống" ở dạng dự phòng cho tới khi service worker cập nhật.
- Không đổi khoá localStorage `be-yeu-*`, tên package, URL `bunkid.vercel.app`.
- **Dev dùng chung Supabase thật của gia đình.** Khi kiểm tay chỉ được mở sheet, bấm chip, rồi đóng (chọn "Bỏ thay đổi"). Không bấm "Lưu".
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".
- Trước khi dùng API mới của Next/React, đọc docs trong `node_modules/next/dist/docs/` (AGENTS.md).
- Các đoạn "thay X bằng Y" có thể bị formatter làm lệch thụt lề: so khớp theo nội dung từng dòng, **bỏ qua thụt lề**.

## Contracts with Other Plans

**Consumes:**

- M1: `Sheet` với popup giữa màn hình. M2 không gọi API nào mới của M1.
- `main`: `lib/rules/quickEntry.ts` (`QUICK_FIELDS`, `recentMedicineNames`, `UNIT_OPTIONS`, `QuickValues`, `byNewest` nội bộ); `lib/rules/logDetails.ts` (`detailsSchemas`); `lib/rules/describeLog.ts` (`LogLike`); `components/quick/styles.ts` (`FIELD_LABEL`, `VALUE_CHIP`).

**Produces** (M3 không dùng; ghi lại cho đủ):

- `lib/rules/logDetails.ts`: `export const MEDICINE_UNITS = ["ml", "mg", "giọt", "viên", "gói", "ống"] as const`.
- `lib/rules/quickEntry.ts`:
  - `export const MEDICINE_PRESETS = ["Vitamin D", "DHA", "Men tiêu hoá"] as const`
  - `recentMedicineNames(logs: LogLike[], exclude: readonly string[] = []): string[]`
  - `medicinePrefill(name: string, logs: LogLike[]): QuickValues`
- `components/ui/Segmented.tsx`: nhận 2–6 lựa chọn.
- `components/quick/MedicineFields.tsx`: props `{ values, onChange, names, onPick, warnings }`.

---

### Task 1: `Segmented` và `FieldList` nhận tới 6 lựa chọn

**Files:**

- Modify: `components/ui/Segmented.tsx:18-19` (điều kiện ném lỗi), comment ở dòng `// One line like iOS's segmented control; 13 px once there are 3–4 options.`
- Modify: `components/quick/FieldList.tsx:7` (comment), `components/quick/FieldList.tsx:43` (điều kiện)
- Test: `components/ui/segmented.test.tsx`, `components/ui/choices.test.tsx` (sửa test chặn số lựa chọn)

**Interfaces:**

- Consumes: không có.
- Produces: `Segmented` nhận 2–6 lựa chọn; `FieldList` vẽ select 2–6 lựa chọn bằng `Segmented`.

- [ ] **Step 1: Viết test hỏng cho `Segmented`**

Thêm vào trong `describe("Segmented label size", …)` của `components/ui/segmented.test.tsx`:

```tsx
it("5–6 options: still 13 px, one line each", () => {
  const html = renderToStaticMarkup(
    <Segmented
      label="Đơn vị"
      options={["ml", "mg", "giọt", "viên", "gói", "ống"].map((u) => ({
        value: u,
        label: u,
      }))}
      value="ml"
      onChange={noop}
    />,
  );
  expect(html.match(/text-\[13px\]/g)).toHaveLength(6);
  expect(html.match(/truncate/g)).toHaveLength(6);
  expect(html).toContain("repeat(6, minmax(0, 1fr))");
});

it("refuses more than 6 options", () => {
  const seven = ["a", "b", "c", "d", "e", "f", "g"].map((v) => ({
    value: v,
    label: v,
  }));
  expect(() =>
    renderToStaticMarkup(
      <Segmented label="x" options={seven} value="a" onChange={noop} />,
    ),
  ).toThrow("Segmented needs 2–6 options, got 7");
});
```

- [ ] **Step 2: Sửa test cũ chặn 5 lựa chọn**

`components/ui/choices.test.tsx` có test `"refuses fewer than 2 or more than 4 options"`, dựng `Segmented` 5 lựa chọn và chờ nó ném lỗi. Với giới hạn mới, 5 lựa chọn hợp lệ nên test này sẽ đỏ. Thay cả test đó bằng:

```tsx
it("refuses fewer than 2 or more than 6 options", () => {
  expect(() =>
    Segmented({
      label: "x",
      options: KINDS.slice(0, 1),
      value: "wet",
      onChange: () => {},
    }),
  ).toThrow();
  const seven = [
    ...KINDS,
    { value: "wet", label: "a" },
    { value: "dirty", label: "b" },
    { value: "wet", label: "c" },
    { value: "dirty", label: "d" },
  ] as ChoiceOption<Kind>[];
  expect(seven).toHaveLength(7);
  expect(() =>
    Segmented({
      label: "x",
      options: seven,
      value: "wet",
      onChange: () => {},
    }),
  ).toThrow();
});
```

`KINDS` có 3 lựa chọn, cộng thêm 4 thành 7. Số test không đổi vì đây là sửa test có sẵn.

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test components/ui/segmented.test.tsx components/ui/choices.test.tsx`
Expected: FAIL.

- "5–6 options" hỏng vì `Segmented` ném `Segmented needs 2–4 options, got 6`.
- "refuses more than 6" hỏng vì thông báo lỗi còn ghi `2–4`.
- Test 7 lựa chọn trong `choices.test.tsx` vẫn xanh (7 vẫn ném lỗi).

- [ ] **Step 4: Sửa `Segmented`**

Trong `components/ui/Segmented.tsx`, thay:

```tsx
if (options.length < 2 || options.length > 4)
  throw new Error(`Segmented needs 2–4 options, got ${options.length}`);
```

bằng:

```tsx
if (options.length < 2 || options.length > 6)
  throw new Error(`Segmented needs 2–6 options, got ${options.length}`);
```

và thay comment:

```tsx
// One line like iOS's segmented control; 13 px once there are 3–4 options.
```

bằng:

```tsx
// One line like iOS's segmented control; 13 px once there are 3–6 options.
```

- [ ] **Step 5: Sửa `FieldList`**

Trong `components/quick/FieldList.tsx`, thay comment:

```tsx
// Switch, a select with 2–4 options a Segmented, a longer select stays native.
```

bằng:

```tsx
// Switch, a select with 2–6 options a Segmented, a longer select stays native.
```

và thay:

```tsx
            if (options.length >= 2 && options.length <= 4)
```

bằng:

```tsx
            if (options.length >= 2 && options.length <= 6)
```

- [ ] **Step 6: Chạy test**

Run: `bun run test`
Expected: PASS hết, 669 + 2 = **671 test**. Màu phân có 7 lựa chọn nên trong `FieldList` vẫn là `<select>`; `components/quick/fieldlist.test.tsx` xanh.

- [ ] **Step 7: Commit**

```bash
git add components/ui/Segmented.tsx components/ui/segmented.test.tsx components/ui/choices.test.tsx components/quick/FieldList.tsx
git commit -m "feat(ui): segmented control takes up to 6 options"
```

---

### Task 2: Luật thuốc: đơn vị gói/ống, chip chọn nhanh, liều lần trước

**Files:**

- Modify: `lib/rules/logDetails.ts` (schema `medicine`), `lib/rules/logDetails.test.ts`
- Modify: `lib/rules/quickEntry.ts` (`QUICK_FIELDS.medicine`, `recentMedicineNames`, hàm mới), `lib/rules/quickEntry.test.ts`
- Test: `components/quick/fieldlist.test.tsx` (thêm 1 test)

**Interfaces:**

- Consumes: `detailsSchemas`, `LogLike`, `byNewest` (nội bộ `quickEntry.ts`).
- Produces: `MEDICINE_UNITS`, `MEDICINE_PRESETS`, `recentMedicineNames(logs, exclude)`, `medicinePrefill(name, logs): QuickValues`.

- [ ] **Step 1: Viết test hỏng cho schema**

Thêm vào cuối `describe` chứa test `"rejects out-of-range or unknown values"` trong `lib/rules/logDetails.test.ts` một test mới. Đổi import đầu file để có thêm `MEDICINE_UNITS` từ `./logDetails`, theo cùng dòng import đang lấy `detailsSchemas`.

```ts
it("medicine takes the six units, gói and ống included, and nothing else", () => {
  expect(MEDICINE_UNITS).toEqual(["ml", "mg", "giọt", "viên", "gói", "ống"]);
  const dose = (unit: string) =>
    detailsSchemas.medicine.safeParse({
      name: "Men tiêu hoá",
      amount: 1,
      unit,
      antipyretic: false,
    }).success;
  expect(dose("gói")).toBe(true);
  expect(dose("ống")).toBe(true);
  expect(dose("thìa")).toBe(false);
});
```

- [ ] **Step 2: Viết test hỏng cho luật thuốc**

Trong `lib/rules/quickEntry.test.ts`, thêm `MEDICINE_PRESETS` và `medicinePrefill` vào khối import từ `@/lib/rules/quickEntry`. Thêm helper ngay dưới `medLog`:

```ts
const medDose = (
  minutesAgo: number,
  name: string,
  amount: number,
  unit: string,
  antipyretic = false,
): LogLike => ({
  type: "medicine",
  started_at: at(minutesAgo),
  ended_at: at(minutesAgo),
  details: { name, amount, unit, antipyretic },
});
```

Thêm vào trong `describe("recent suggestions", …)`:

```ts
it("MEDICINE_PRESETS: Vitamin D, DHA, Men tiêu hoá in that order", () => {
  expect(MEDICINE_PRESETS).toEqual(["Vitamin D", "DHA", "Men tiêu hoá"]);
});

it("recentMedicineNames skips the presets before counting to 4", () => {
  expect(
    recentMedicineNames(
      [
        medLog(5, "DHA"),
        medLog(10, "Paracetamol"),
        medLog(15, "dha "),
        medLog(20, "Men tiêu hoá"),
        medLog(25, "Siro ho"),
        medLog(30, "vitamin d"),
        medLog(35, "Kẽm"),
        medLog(40, "Thuốc X"),
        medLog(45, "Cuối"),
      ],
      MEDICINE_PRESETS,
    ),
  ).toEqual(["Paracetamol", "Siro ho", "Kẽm", "Thuốc X"]);
});

it("medicinePrefill copies the latest dose of the same medicine, any case", () => {
  expect(
    medicinePrefill("DHA", [
      medDose(10, "dha", 2.5, "ml"),
      medDose(60, "DHA", 5, "giọt"),
      medDose(5, "Paracetamol", 2.5, "ml", true),
    ]),
  ).toEqual({ name: "DHA", amount: "2,5", unit: "ml", antipyretic: false });
  expect(
    medicinePrefill("Paracetamol", [
      medDose(5, "Paracetamol", 120, "mg", true),
    ]),
  ).toEqual({
    name: "Paracetamol",
    amount: "120",
    unit: "mg",
    antipyretic: true,
  });
});

it("medicinePrefill: Vitamin D never logged is 1 giọt", () => {
  expect(medicinePrefill("Vitamin D", [medDose(5, "DHA", 5, "giọt")])).toEqual({
    name: "Vitamin D",
    amount: "1",
    unit: "giọt",
    antipyretic: false,
  });
  expect(medicinePrefill("vitamin d", [])).toEqual({
    name: "Vitamin D",
    amount: "1",
    unit: "giọt",
    antipyretic: false,
  });
});

it("medicinePrefill: anything else never logged clears the amount and keeps the unit", () => {
  expect(medicinePrefill("Men tiêu hoá", [])).toEqual({
    name: "Men tiêu hoá",
    amount: "",
    antipyretic: false,
  });
});
```

- [ ] **Step 2b: Viết test hỏng cho ô đơn vị khi sửa log**

Thêm vào trong `describe("FieldList", …)` của `components/quick/fieldlist.test.tsx`:

```tsx
it("the 6 medicine units are a segmented control, not a native select", () => {
  const med = html({
    fields: LOG_FIELDS.medicine,
    values: { name: "Men", amount: "1", unit: "gói", antipyretic: false },
    onChange: () => {},
  });
  expect(med).toContain('aria-label="Đơn vị"');
  expect(med).toMatch(/aria-pressed="true"[^>]*>gói<\/button>/);
  expect(med).toContain(">ống</button>");
  expect(med).not.toContain("<select");
});
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/logDetails.test.ts lib/rules/quickEntry.test.ts components/quick/fieldlist.test.tsx`
Expected: FAIL. Chưa export `MEDICINE_UNITS`, `MEDICINE_PRESETS`, `medicinePrefill`. Test FieldList hỏng vì chưa có nút `gói`.

- [ ] **Step 4: Thêm `MEDICINE_UNITS` vào schema**

Trong `lib/rules/logDetails.ts`, ngay trên `const medicine = z`, thêm:

```ts
export const MEDICINE_UNITS = [
  "ml",
  "mg",
  "giọt",
  "viên",
  "gói",
  "ống",
] as const;
```

và trong schema `medicine`, thay:

```ts
    unit: z.enum(["ml", "mg", "giọt", "viên"]),
```

bằng:

```ts
    unit: z.enum(MEDICINE_UNITS),
```

- [ ] **Step 5: Sửa `QUICK_FIELDS.medicine` và viết luật mới**

Trong `lib/rules/quickEntry.ts`:

1. Đổi dòng import thành:

```ts
import { detailsSchemas, MEDICINE_UNITS, type StoolColor } from "./logDetails";
```

2. Trong `QUICK_FIELDS.medicine`, thay:

```ts
      options: ["ml", "mg", "giọt", "viên"].map((u) => ({
```

bằng:

```ts
      options: MEDICINE_UNITS.map((u) => ({
```

3. Thay cả hàm `recentMedicineNames` (kể cả comment phía trên) bằng:

```ts
// Spec §4.1: the quick chips, always shown, in this order.
export const MEDICINE_PRESETS = ["Vitamin D", "DHA", "Men tiêu hoá"] as const;

const medicineKey = (name: string) => name.trim().toLocaleLowerCase("vi");

// Spec §2.3 (spec gốc) and §4.1: up to 4 different medicine names, case-insensitive,
// latest spelling kept; names in `exclude` (the quick chips) are skipped before counting.
export function recentMedicineNames(
  logs: LogLike[],
  exclude: readonly string[] = [],
): string[] {
  const names: string[] = [];
  const seen = new Set(exclude.map(medicineKey));
  for (const log of byNewest(logs)) {
    if (log.type !== "medicine") continue;
    const parsed = detailsSchemas.medicine.safeParse(log.details);
    if (!parsed.success) continue;
    const name = parsed.data.name.trim();
    const key = medicineKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length === 4) break;
  }
  return names;
}

// Spec §4.1: a chip fills the name plus the dose from the latest log of that medicine.
// Never logged: Vitamin D is 1 giọt; anything else clears the amount and keeps the unit.
export function medicinePrefill(name: string, logs: LogLike[]): QuickValues {
  const key = medicineKey(name);
  for (const log of byNewest(logs)) {
    if (log.type !== "medicine") continue;
    const parsed = detailsSchemas.medicine.safeParse(log.details);
    if (!parsed.success || medicineKey(parsed.data.name) !== key) continue;
    return {
      name,
      amount: String(parsed.data.amount).replace(".", ","),
      unit: parsed.data.unit,
      antipyretic: parsed.data.antipyretic,
    };
  }
  if (key === medicineKey("Vitamin D"))
    return { name: "Vitamin D", amount: "1", unit: "giọt", antipyretic: false };
  return { name, amount: "", antipyretic: false };
}
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test lib/rules/logDetails.test.ts lib/rules/quickEntry.test.ts components/quick/fieldlist.test.tsx components/quick/choices.test.tsx components/home/quickentry.test.tsx`
Expected: PASS hết. Test cũ `recentMedicineNames: up to 4 names…` vẫn xanh vì `exclude` mặc định rỗng. `MedicineFields` giờ có 6 nút đơn vị, `Segmented` nhận được.

- [ ] **Step 7: Commit**

```bash
git add lib/rules/logDetails.ts lib/rules/logDetails.test.ts lib/rules/quickEntry.ts lib/rules/quickEntry.test.ts components/quick/fieldlist.test.tsx
git commit -m "feat(medicine): gói and ống units, quick presets and last-dose prefill rules"
```

---

### Task 3: Chip "Chọn nhanh" / "Gần đây" trong sheet Thuốc

**Files:**

- Modify: `components/quick/MedicineFields.tsx` (thay cả file)
- Modify: `components/home/QuickEntrySheet.tsx` (import và prop của `MedicineFields`)
- Modify: `components/home/HomeScreen.tsx` (xoá `VITAMIN_D`, dòng `openInstant` của Vitamin D, import)
- Test: `components/quick/choices.test.tsx` (thay `describe("MedicineFields")`), `components/home/quickentry.test.tsx` (thêm 1 test)

**Interfaces:**

- Consumes: `MEDICINE_PRESETS`, `recentMedicineNames(logs, exclude)`, `medicinePrefill(name, logs)` (Task 2); `FIELD_LABEL`, `VALUE_CHIP`.
- Produces: `MedicineFields({ values, onChange, names, onPick, warnings })`.

- [ ] **Step 1: Viết test hỏng cho `MedicineFields`**

Trong `components/quick/choices.test.tsx`, thay cả khối `describe("MedicineFields", () => { … });` bằng:

```tsx
describe("MedicineFields", () => {
  const values = { name: "", amount: "", unit: "ml", antipyretic: true };
  const props = {
    values,
    onChange: () => {},
    names: ["Paracetamol"],
    onPick: () => {},
    warnings: [] as string[],
  };

  it("name, quick chips, recent chips, decimal amount, 6 units, fever switch and warnings", () => {
    const html = renderToStaticMarkup(
      <MedicineFields
        {...props}
        warnings={["Chưa đủ 4 giờ từ liều hạ sốt trước (09:00)."]}
      />,
    );
    expect(html).toContain(">Tên thuốc</span>");
    expect(html).toContain('aria-label="Chọn nhanh"');
    expect(html).toContain(">Vitamin D</button>");
    expect(html).toContain(">DHA</button>");
    expect(html).toContain(">Men tiêu hoá</button>");
    expect(html.indexOf(">Vitamin D</button>")).toBeLessThan(
      html.indexOf(">Men tiêu hoá</button>"),
    );
    expect(html).toContain('aria-label="Thuốc gần đây"');
    expect(html).toContain(">Paracetamol</button>");
    expect(html.indexOf(">Men tiêu hoá</button>")).toBeLessThan(
      html.indexOf(">Paracetamol</button>"),
    );
    expect(html).toContain('inputMode="decimal"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>ml<\/button>/);
    expect(html).toContain(">gói</button>");
    expect(html).toContain(">ống</button>");
    expect(html).toContain('role="switch"');
    expect(html).toContain("bg-warn-soft");
    expect(html).toContain("Chưa đủ 4 giờ từ liều hạ sốt trước (09:00).");
  });

  it("hides Gần đây when there is nothing left after the presets", () => {
    const html = renderToStaticMarkup(<MedicineFields {...props} names={[]} />);
    expect(html).toContain('aria-label="Chọn nhanh"');
    expect(html).not.toContain("Gần đây");
  });

  it("the chip matching the typed name is pressed and filled, any case", () => {
    const html = renderToStaticMarkup(
      <MedicineFields {...props} values={{ ...values, name: "dha " }} />,
    );
    expect(html).toMatch(/aria-pressed="true"[^>]*>DHA<\/button>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>Vitamin D<\/button>/);
    expect(html).toMatch(/bg-accent text-on-accent[^>]*>DHA<\/button>/);
  });

  it("quick and recent chips both hand their name to onPick", () => {
    const onPick = vi.fn();
    const tree = MedicineFields({ ...props, onPick });
    const [dha] = findElements(tree, (el) => el.props.children === "DHA");
    const [recent] = findElements(
      tree,
      (el) => el.props.children === "Paracetamol",
    );
    (dha.props.onClick as () => void)();
    (recent.props.onClick as () => void)();
    expect(onPick.mock.calls).toEqual([["DHA"], ["Paracetamol"]]);
  });
});
```

- [ ] **Step 2: Viết test hỏng cho `QuickEntrySheet`**

Thêm vào cuối `describe` chứa test `"keeps the Vitamin D prefill"` trong `components/home/quickentry.test.tsx`:

```tsx
it("shows the quick chips and leaves the presets out of Gần đây", () => {
  const dha = {
    ...bottle,
    id: "m1",
    type: "medicine",
    details: { name: "DHA", amount: 5, unit: "giọt", antipyretic: false },
  } as LogRow;
  const para = {
    ...bottle,
    id: "m2",
    type: "medicine",
    started_at: "2026-11-14T03:00:00.000Z",
    details: {
      name: "Paracetamol",
      amount: 2.5,
      unit: "ml",
      antipyretic: true,
    },
  } as LogRow;
  const html = render({ type: "medicine", recentLogs: [dha, para] });
  expect(html).toContain('aria-label="Chọn nhanh"');
  const recent = html.slice(html.indexOf('aria-label="Thuốc gần đây"'));
  expect(recent).toContain(">Paracetamol</button>");
  expect(recent).not.toContain(">DHA</button>");
});
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test components/quick/choices.test.tsx components/home/quickentry.test.tsx`
Expected: FAIL. Chưa có nhóm "Chọn nhanh", chưa có prop `onPick`. Lỗi type `onPick` chỉ hiện ở `bun run typecheck`; vitest vẫn chạy và hỏng ở các `expect`.

- [ ] **Step 4: Viết lại `MedicineFields`**

Thay cả nội dung `components/quick/MedicineFields.tsx` bằng:

```tsx
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import {
  MEDICINE_PRESETS,
  UNIT_OPTIONS,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { FIELD_INPUT, FIELD_LABEL, VALUE_CHIP } from "./styles";

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase("vi") === b.trim().toLocaleLowerCase("vi");

// The picked chip drops `glass`: its background shorthand would fight bg-accent.
// The transparent 1 px border keeps it the same size as the unpicked glass chips.
const PICKED_CHIP =
  "min-h-11 rounded-full border border-transparent bg-accent text-on-accent px-4 text-[15px] font-semibold transition-transform duration-[120ms] active:scale-[0.97]";

function ChipGroup({
  title,
  groupLabel,
  names,
  typed,
  onPick,
}: {
  title: string;
  groupLabel: string;
  names: readonly string[];
  typed: string;
  onPick: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{title}</span>
      <div
        role="group"
        aria-label={groupLabel}
        className="flex flex-wrap gap-2"
      >
        {names.map((name) => {
          const picked = sameName(name, typed);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={picked}
              onClick={() => onPick(name)}
              className={picked ? PICKED_CHIP : VALUE_CHIP}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MedicineFields({
  values,
  onChange,
  names,
  onPick,
  warnings,
}: {
  values: QuickValues;
  onChange: (next: QuickValues) => void;
  names: string[];
  onPick: (name: string) => void;
  warnings: string[];
}) {
  const set = (key: string, next: string | boolean) =>
    onChange({ ...values, [key]: next });
  const typed = String(values.name ?? "");
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Tên thuốc</span>
        <input
          className={FIELD_INPUT}
          value={typed}
          onChange={(event) => set("name", event.target.value)}
        />
      </label>
      {ChipGroup({
        title: "Chọn nhanh",
        groupLabel: "Chọn nhanh",
        names: MEDICINE_PRESETS,
        typed,
        onPick,
      })}
      {names.length > 0 &&
        ChipGroup({
          title: "Gần đây",
          groupLabel: "Thuốc gần đây",
          names,
          typed,
          onPick,
        })}
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

`ChipGroup` được gọi như hàm, không phải `<ChipGroup />`. Như vậy `findElements` trong test thấy được các nút chip mà không phải chạy component con. `bg-accent text-on-accent` phải đứng liền nhau trong `PICKED_CHIP`, vì test so khớp đúng chuỗi đó.

- [ ] **Step 5: Nối `onPick` trong `QuickEntrySheet`**

Trong `components/home/QuickEntrySheet.tsx`:

1. Trong khối import từ `@/lib/rules/quickEntry`, thêm `MEDICINE_PRESETS` và `medicinePrefill` (giữ thứ tự chữ cái như các dòng đang có).
2. Thay:

```tsx
<MedicineFields
  values={values}
  onChange={setValues}
  names={recentMedicineNames(recentLogs)}
  warnings={warnings}
/>
```

bằng:

```tsx
<MedicineFields
  values={values}
  onChange={setValues}
  names={recentMedicineNames(recentLogs, MEDICINE_PRESETS)}
  onPick={(name) =>
    setValues((current) => ({
      ...current,
      ...medicinePrefill(name, recentLogs),
    }))
  }
  warnings={warnings}
/>
```

- [ ] **Step 6: `HomeScreen` lấy liều Vitamin D lần trước**

Trong `components/home/HomeScreen.tsx`:

1. Xoá cả khối:

```tsx
const VITAMIN_D: QuickValues = {
  name: "Vitamin D",
  amount: "1",
  unit: "giọt",
  antipyretic: false,
};
```

2. Thay:

```tsx
              onRecord={() => actions.openInstant("medicine", VITAMIN_D)}
```

bằng:

```tsx
              onRecord={() =>
                actions.openInstant(
                  "medicine",
                  medicinePrefill("Vitamin D", rows),
                )
              }
```

3. `HomeScreen.tsx` hiện có dòng `import type { QuickValues } from "@/lib/rules/quickEntry";`. Sau khi xoá `VITAMIN_D`, không còn chỗ nào dùng `QuickValues`. Thay **cả dòng đó** bằng `import { medicinePrefill } from "@/lib/rules/quickEntry";`. Không gộp vào `import type`, vì như thế `medicinePrefill` thành import chỉ có type và typecheck sẽ lỗi.

- [ ] **Step 7: Chạy toàn bộ test và typecheck**

Run: `bun run test && bun run typecheck`
Expected: PASS hết. Số test: 669 + 2 (Task 1: 2 `Segmented`) + 7 (Task 2: 1 schema + 5 luật + 1 `FieldList`) + 4 (Task 3: `describe("MedicineFields")` từ 1 test thành 4, cộng 1 test `quickentry`) = **682 test**. Nếu số lệch, đếm lại các `it(` đã thêm, đừng sửa test cho khớp số. Typecheck không lỗi.

- [ ] **Step 8: Kiểm trong Chrome (Claude in Chrome, mở tab mới)** (không bấm Lưu)

Chạy `bun run dev`, mở `http://localhost:3000` ở 375×812:

1. Bấm "+" → "Thuốc". Kỳ vọng:
   - nhóm "Chọn nhanh" có Vitamin D, DHA, Men tiêu hoá;
   - "Gần đây" không lặp lại 3 tên đó;
   - 6 nút đơn vị ml · mg · giọt · viên · gói · ống nằm trên một dòng, không nút nào bị cắt chữ.
2. Bấm DHA: tên điền "DHA", chip DHA đổi màu accent. Đã từng ghi DHA thì lượng và đơn vị đúng lần trước; chưa ghi thì lượng trống.
3. Bấm Vitamin D: chưa từng ghi thì điền 1 giọt.
4. Bấm X → hộp "Bỏ thay đổi?" (M1) → "Bỏ thay đổi".
5. Mở Nhật ký, bấm một log thuốc bất kỳ để mở sheet sửa. Ô đơn vị là 6 nút trên một dòng, không phải ô chọn native. Đóng bằng X, không lưu.
6. Bật Ban đêm (mặt trăng ở Trang chủ) và lặp lại bước 1: chip đang chọn đọc rõ.

- [ ] **Step 9: Commit**

```bash
git add components/quick/MedicineFields.tsx components/quick/choices.test.tsx components/home/QuickEntrySheet.tsx components/home/HomeScreen.tsx components/home/quickentry.test.tsx
git commit -m "feat(medicine): quick chips for Vitamin D, DHA and Men tiêu hoá with last-dose prefill"
```
