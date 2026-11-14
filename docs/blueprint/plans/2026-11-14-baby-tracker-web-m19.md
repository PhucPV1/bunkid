# Baby Tracker Web — M19 (Trang tăng trưởng, lần đo qua outbox) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/tang-truong` (spec §6.5): nhập lần đo, ba biểu đồ cân nặng / chiều dài / vòng đầu theo tuổi với đường WHO P3–P97 theo giới tính và chấm của bé, mỗi lần đo có z-score, phân vị và nhãn (§7.3). Lần đo đi qua outbox (§9) nên thêm, sửa, xóa được khi offline. Thẻ hồ sơ ở Khẩn cấp dùng cân nặng đo gần nhất.

**Architecture:**
- **Quy tắc form** (`lib/rules/growthForm.ts`): đọc số kiểu Việt ("5,2"), đổi kg → gram, kiểm khoảng như ràng buộc DB; hàm hiển thị giá trị, z, phân vị; `latestWeightG`; khoảng trục X của biểu đồ.
- **Outbox (M12, M16) thêm bảng `growth`:** cùng cách của `logs` vì `growth.id` do client sinh: `insert` (upsert theo `id`, `ignoreDuplicates`), `update`, `delete` (đọc lại khi 0 dòng). `applyGrowthChange`/`overlayPendingGrowth` có test; `OutboxSync` làm mới `["growth"]` sau mỗi lần xả.
- **Dữ liệu** (`lib/data/growth.ts`): `useGrowth` (key `["growth", babyId]`, phủ mục chờ), `useWhoTable` (key `["who", indicator, sex]`, `staleTime`/`gcTime` vô hạn, `networkMode: "always"` vì chỉ là nạp chunk; được lưu cùng cache nên biểu đồ chạy offline sau lần mở đầu, còn offline lần đầu thì báo "Biểu đồ cần mạng để tải lần đầu."), `useGrowthActions`.
- **Giao diện** (`components/growth/`): `GrowthScreen` (nút thêm, ba tab chỉ số, biểu đồ, danh sách lần đo có ⏳), `GrowthChart` (recharts `ComposedChart`: 5 `Line` + `Scatter`, nạp động như biểu đồ Thống kê), `GrowthSheet` (thêm/sửa/xóa).

**Tech Stack:** như M1–M18. Không thêm gói nào.

**Milestones của đợt phát hành 2:**
- M14–M18: xong.
- **M19 (plan này):** trang tăng trưởng.
- Sau đó: phân loại triệu chứng và bài bệnh thường gặp (hết đợt 2).

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Nhập số:** nhận cả "," và "." làm dấu thập phân. Cân nặng nhập kg (0,3–40), lưu gram (làm tròn). Chiều dài 20–130 cm, vòng đầu 20–60 cm, làm tròn 1 chữ số thập phân. Cần ít nhất một số đo. Ngày đo từ ngày sinh đến hôm nay (giờ VN). Câu báo lỗi đúng như `parseGrowthForm`.
- **Ai sửa được:** theo RLS của `growth` (§5.2): chủ gia đình sửa/xóa mọi lần đo; thành viên chỉ sửa/xóa lần đo mình tạo. Dòng không sửa được thì không bấm được. Mọi thành viên thêm được lần đo.
- **Biểu đồ:**
  - Trục X là ngày tuổi, nhãn theo tháng (mỗi 1, 3 hoặc 6 tháng tùy độ dài). Trục X từ 0 tới ít nhất 365 ngày và tới tuổi hiện tại + 60 ngày (làm tròn lên bội 30), tối đa 1856; điểm đường WHO cách 7 ngày, hoặc 30 ngày khi trục dài hơn 730.
  - P50 vẽ đậm màu `good-ink`, P3/P97 nét đứt, P15/P85 nét liền mảnh, màu `muted`; chấm của bé màu `accent`.
  - Bảng tra theo `whoSex(baby.sex)`; dưới biểu đồ ghi "Nguồn: WHO Child Growth Standards".
  - Nạp `GrowthChart` bằng `next/dynamic` với `ssr: false`; lỗi tải (offline lần đầu) thì hiện "Biểu đồ cần mạng để tải lần đầu." như trang Thống kê.
- **Danh sách lần đo:** mới nhất trước. Mỗi dòng: ngày đo dd/MM/yyyy và tuổi lúc đo; từng chỉ số có giá trị; chỉ số đang chọn ở tab có thêm huy hiệu "z ±x,x · Pxx" (+ câu của `rateZ` khi vàng/đỏ) tô màu xanh/vàng/đỏ theo vai trò; ngoài 0..1856 ngày thì "Ngoài bảng WHO". Khi bảng WHO chưa tải xong thì không hiện huy hiệu nào. Chưa có lần đo thì chỉ hiện "Chưa có lần đo nào."; khi có thì thêm dòng "z-score và phân vị là của chỉ số đang chọn (…)."
- **Đơn vị:** `assess`/`curve` theo đơn vị của bảng, nên cân nặng truyền `weight_g / 1000` (`indicatorValue`).
- **Khẩn cấp:** `EmergencyScreen` gọi `useGrowth` và truyền `latestWeightG(growth.data ?? [])` vào `ProfileCard` (lần đo mới nhất có cân nặng).
- **Service worker:** thêm `/tang-truong` vào `PAGES` để trang mở được khi offline.
- **Bước của người dùng:** checklist bước 12 cần điện thoại thật; ghi là đang chờ.

## Global Constraints

Từ spec §2.1 (nguyên văn):

- Ngôn ngữ giao diện và nội dung: chỉ tiếng Việt (`vi-VN`).
- Múi giờ nghiệp vụ: `Asia/Ho_Chi_Minh` (ranh giới ngày, giờ gửi nhắc tiêm 08:00).
- Lưu thời gian trong DB: `timestamptz` (UTC). Ngày không có giờ: `date`.
- Đơn vị: gram (cân nặng), cm (chiều dài, vòng đầu), °C (nhiệt độ), ml (sữa).
- Mọi khóa chính là UUID v4. Bản ghi `logs` sinh UUID ở client để gửi lại offline không bị trùng.
- Chỉ dùng gói miễn phí: Vercel Hobby, Supabase Free. Không thêm dịch vụ trả phí.
- Bí mật không bao giờ xuống client: `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
- An toàn y tế: app **không** đặt tên bệnh, **không** tính liều thuốc. Mọi màn kết quả triệu chứng có nút gọi `115` và dòng "Thông tin tham khảo, không thay thế bác sĩ."
- Nội dung y tế (lịch tiêm, triệu chứng, mốc phát triển, chuẩn đánh giá) mỗi mục phải ghi `source` (URL) và `reviewedAt` (ngày).
- Đăng nhập chỉ bằng Google (Supabase Auth). Quyền truy cập dữ liệu do danh sách Gmail trong `family_members` quyết định.

Từ spec §2.2, §9 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `@tanstack/react-query-persist-client` 5.105.0, `dexie` 4.4.7, `web-push` 3.6.7, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `@types/web-push` 3.6.4, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x. TypeScript `strict: true`.
- Mọi trang là client component, tự kiểm tra phiên ở client.
- Bản ghi còn trong outbox hiện biểu tượng ⏳. Đầu trang có chip "N mục chờ đồng bộ". Bỏ mục: toast "Không lưu được: <lý do>" (§9).
- Các thao tác ghi không qua outbox cần online: ảnh, thành viên, hồ sơ bé (`babies`), `music_links`, `emergency_contacts`, `notification_prefs`, đăng ký push. Offline thì nút bị tắt kèm chú thích "Cần kết nối mạng" (§9).
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.
- Runtime: Node.js 22.x.

Từ M7:

- File `.tsx` trong `app/` và `components/` chỉ dùng màu theo vai trò (`bg-warn-soft`, `text-warn-ink`, `bg-danger-soft`, `text-danger-ink`…). `lib/themeGuard.test.ts` khóa quy tắc này.

Riêng M19:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/growthForm.ts` và `components/growth/` phải đúng từng ký tự như plan này.
- Code của app không import gì từ `scripts/`.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, tới commit cuối của M18):

- M18: `loadWhoTable`, `whoSex`, `LmsRow`, `WhoIndicator`, `WhoSex` (`lib/content/who.ts`); `assess`, `curve`, `PERCENTILE_LINES`, `Assessment`, `CurvePoint` (`lib/rules/growth.ts`); bảng `growth`, `GrowthRow`
- M12, M16: `OutboxEntry`, `entriesFor`, `pendingRowIds`, `nextCreatedAt`, `flushRequests`, `outboxDeps` (`failed`, `UNSUPPORTED`), `OutboxSync`
- M13: `PendingMark`, `useOutboxEntries`; M17: `EmergencyScreen`, `ProfileCard({ latestWeightG })`
- M7 trang Thống kê: cách nạp biểu đồ bằng `next/dynamic`; `formatAgeVi`, `ageDays`, `vnDateString` (`lib/rules/time.ts`)

**Produces** (đợt 3 — báo cáo cho bác sĩ — dùng):

- `lib/rules/growthForm.ts`: `GrowthFormRaw`, `GrowthInput`, `parseGrowthForm`, `growthToRaw`, `formatGrowthValue`, `formatZ`, `formatPercentile`, `INDICATORS`, `indicatorValue`, `latestWeightG`, `chartRange`
- `OutboxEntry.table` thêm `"growth"`; `applyGrowthChange`, `overlayPendingGrowth` (`outboxCore`); `GrowthChange`, `growthKey`, `enqueueGrowthChange`, `withPendingGrowth` (`outbox`)
- `lib/data/growth.ts`: `useGrowth(babyId)`, `useWhoTable(indicator, sex)`, `useGrowthActions(babyId, userId)`
- `components/growth/`: `GrowthScreen({ baby, userId, isOwner })`, `GrowthChart`, `GrowthSheet`; trang `/tang-truong`; checklist bước 12

## File Structure

```
lib/rules/growthForm.ts (+ test)         # nhập số, hiển thị, khoảng biểu đồ
lib/data/outboxCore.ts (+ outboxGrowth.test.ts), lib/data/outbox.ts, lib/data/outboxDeps.ts, components/sync/OutboxSync.tsx   # growth qua outbox
lib/data/growth.ts                       # đọc lần đo, bảng WHO, thao tác ghi
components/growth/GrowthSheet.tsx, GrowthChart.tsx, GrowthScreen.tsx; app/tang-truong/page.tsx
lib/nav.ts (+ test), sw/sw.template.js, components/emergency/EmergencyScreen.tsx   # menu, cache trang, cân nặng mới nhất
docs/device-checklist.md                 # bước 12
```

## Tasks

1. Quy tắc nhập lần đo
2. Lần đo qua outbox
3. Trang `/tang-truong`
4. Checklist bước 12 và deploy

---

### Task 1: Quy tắc nhập lần đo

**Files:**

- Create: `lib/rules/growthForm.ts`
- Test: `lib/rules/growthForm.test.ts`

**Interfaces:**

- Consumes: `WhoIndicator` (M18)
- Produces: `GrowthFormRaw`, `GrowthInput = { measured_on; weight_g; length_cm; head_cm }`, `parseGrowthForm(raw, { dob, today })`, `growthToRaw(row)`, `formatGrowthValue(indicator, value)`, `formatZ(z)`, `formatPercentile(p)`, `INDICATORS`, `indicatorValue(row, indicator)`, `latestWeightG(rows)`, `chartRange(ageNow): { to; step }`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m19.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `feat(growth): growth table with RLS` của M18.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/rules/growthForm.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  chartRange,
  formatGrowthValue,
  formatPercentile,
  formatZ,
  growthToRaw,
  indicatorValue,
  latestWeightG,
  parseGrowthForm,
} from "./growthForm";

const ctx = { dob: "2026-09-14", today: "2026-11-14" };
const raw = {
  measuredOn: "2026-11-14",
  weightKg: "",
  lengthCm: "",
  headCm: "",
};

describe("parseGrowthForm", () => {
  it("accepts a comma or a dot and converts kg to grams", () => {
    expect(
      parseGrowthForm(
        { ...raw, weightKg: "5,125", lengthCm: "58.46", headCm: " 39 " },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: {
        measured_on: "2026-11-14",
        weight_g: 5125,
        length_cm: 58.5,
        head_cm: 39,
      },
    });
  });

  it("needs a date between birth and today and at least one value", () => {
    expect(
      parseGrowthForm({ ...raw, measuredOn: "2026-11-15", headCm: "39" }, ctx),
    ).toEqual({
      ok: false,
      errors: { measuredOn: "Ngày đo phải từ ngày sinh đến hôm nay." },
    });
    expect(parseGrowthForm(raw, ctx)).toEqual({
      ok: false,
      errors: { weightKg: "Nhập ít nhất một số đo." },
    });
  });

  it("rejects values outside the ranges or that are not numbers", () => {
    expect(
      parseGrowthForm(
        { ...raw, weightKg: "41", lengthCm: "abc", headCm: "19,9" },
        ctx,
      ),
    ).toEqual({
      ok: false,
      errors: {
        weightKg: "Cân nặng từ 0,3 đến 40 kg.",
        lengthCm: "Chiều dài từ 20 đến 130 cm.",
        headCm: "Vòng đầu từ 20 đến 60 cm.",
      },
    });
  });
});

describe("display helpers", () => {
  const row = {
    measured_on: "2026-11-14",
    weight_g: 5125,
    length_cm: 58.5,
    head_cm: null,
  };

  it("growthToRaw writes commas back for editing", () => {
    expect(growthToRaw(row)).toEqual({
      measuredOn: "2026-11-14",
      weightKg: "5,125",
      lengthCm: "58,5",
      headCm: "",
    });
  });

  it("formats values, z and percentiles the Vietnamese way", () => {
    expect(formatGrowthValue("wfa", 5.125)).toBe("5,13 kg");
    expect(formatGrowthValue("hcfa", 39)).toBe("39 cm");
    expect(formatZ(0.456)).toBe("+0,5");
    expect(formatZ(-2.04)).toBe("-2,0");
    expect(formatZ(0)).toBe("0,0");
    expect(formatPercentile(67.04)).toBe("P67");
    expect(formatPercentile(2.27)).toBe("P2,3");
    expect(formatPercentile(0.05)).toBe("dưới P0,1");
    expect(formatPercentile(99.95)).toBe("trên P99,9");
  });

  it("indicatorValue gives kg for weight and cm otherwise", () => {
    expect(indicatorValue(row, "wfa")).toBe(5.125);
    expect(indicatorValue(row, "lhfa")).toBe(58.5);
    expect(indicatorValue(row, "hcfa")).toBeNull();
  });

  it("latestWeightG takes the newest measurement that has a weight", () => {
    expect(
      latestWeightG([
        { ...row, measured_on: "2026-10-14", weight_g: 4300 },
        { ...row, measured_on: "2026-11-20", weight_g: null },
        row,
      ]),
    ).toBe(5125);
    expect(latestWeightG([])).toBeNull();
  });

  it("chartRange covers the first year and two months past today", () => {
    expect(chartRange(61)).toEqual({ to: 365, step: 7 });
    expect(chartRange(400)).toEqual({ to: 480, step: 7 });
    expect(chartRange(1000)).toEqual({ to: 1080, step: 30 });
    expect(chartRange(1850)).toEqual({ to: 1856, step: 30 });
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/growthForm.test.ts`
Expected: FAIL — `Error: Cannot find module './growthForm' imported from …/lib/rules/growthForm.test.ts`

- [ ] **Step 4: Viết quy tắc**

Tạo `lib/rules/growthForm.ts`:

```ts
import type { WhoIndicator } from "@/lib/content/who";

export type GrowthFormRaw = {
  measuredOn: string;
  weightKg: string;
  lengthCm: string;
  headCm: string;
};

export type GrowthInput = {
  measured_on: string;
  weight_g: number | null;
  length_cm: number | null;
  head_cm: number | null;
};

type Errors = Partial<Record<keyof GrowthFormRaw, string>>;

// Vietnamese keyboards type "4,35"; both "," and "." are accepted.
function decimal(raw: string): number | null | "bad" {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  if (!/^\d+(\.\d+)?$/.test(text)) return "bad";
  return Number(text);
}

const RANGES = {
  weightKg: { min: 0.3, max: 40, message: "Cân nặng từ 0,3 đến 40 kg." },
  lengthCm: { min: 20, max: 130, message: "Chiều dài từ 20 đến 130 cm." },
  headCm: { min: 20, max: 60, message: "Vòng đầu từ 20 đến 60 cm." },
} as const;

export function parseGrowthForm(
  raw: GrowthFormRaw,
  ctx: { dob: string; today: string },
): { ok: true; value: GrowthInput } | { ok: false; errors: Errors } {
  const errors: Errors = {};
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.measuredOn) ||
    raw.measuredOn < ctx.dob ||
    raw.measuredOn > ctx.today
  )
    errors.measuredOn = "Ngày đo phải từ ngày sinh đến hôm nay.";
  const values: Partial<Record<keyof typeof RANGES, number | null>> = {};
  for (const key of Object.keys(RANGES) as (keyof typeof RANGES)[]) {
    const n = decimal(raw[key]);
    const range = RANGES[key];
    if (n === "bad" || (n !== null && (n < range.min || n > range.max)))
      errors[key] = range.message;
    else values[key] = n;
  }
  if (
    !errors.weightKg &&
    !errors.lengthCm &&
    !errors.headCm &&
    values.weightKg == null &&
    values.lengthCm == null &&
    values.headCm == null
  )
    errors.weightKg = "Nhập ít nhất một số đo.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const oneDecimal = (n: number | null | undefined) =>
    n == null ? null : Math.round(n * 10) / 10;
  return {
    ok: true,
    value: {
      measured_on: raw.measuredOn,
      weight_g:
        values.weightKg == null ? null : Math.round(values.weightKg * 1000),
      length_cm: oneDecimal(values.lengthCm),
      head_cm: oneDecimal(values.headCm),
    },
  };
}

const comma = (n: number) => String(n).replace(".", ",");

export function growthToRaw(row: GrowthInput): GrowthFormRaw {
  return {
    measuredOn: row.measured_on,
    weightKg: row.weight_g === null ? "" : comma(row.weight_g / 1000),
    lengthCm: row.length_cm === null ? "" : comma(row.length_cm),
    headCm: row.head_cm === null ? "" : comma(row.head_cm),
  };
}

const decimals = (digits: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits });

export function formatGrowthValue(
  indicator: WhoIndicator,
  value: number,
): string {
  return indicator === "wfa"
    ? `${decimals(2).format(value)} kg`
    : `${decimals(1).format(value)} cm`;
}

export function formatZ(z: number): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(z);
}

export function formatPercentile(p: number): string {
  if (p < 0.1) return "dưới P0,1";
  if (p > 99.9) return "trên P99,9";
  return `P${decimals(1).format(p)}`;
}

export const INDICATORS: {
  key: WhoIndicator;
  title: string;
  column: "weight_g" | "length_cm" | "head_cm";
}[] = [
  { key: "wfa", title: "Cân nặng", column: "weight_g" },
  { key: "lhfa", title: "Chiều dài", column: "length_cm" },
  { key: "hcfa", title: "Vòng đầu", column: "head_cm" },
];

// The value the WHO table expects: kg for weight, cm for the others.
export function indicatorValue(
  row: GrowthInput,
  indicator: WhoIndicator,
): number | null {
  if (indicator === "wfa")
    return row.weight_g === null ? null : row.weight_g / 1000;
  return indicator === "lhfa" ? row.length_cm : row.head_cm;
}

export function latestWeightG(rows: GrowthInput[]): number | null {
  const withWeight = rows.filter((r) => r.weight_g !== null);
  withWeight.sort((a, b) => b.measured_on.localeCompare(a.measured_on));
  return withWeight[0]?.weight_g ?? null;
}

// Chart x range in days: at least the first year, and two months past today.
export function chartRange(ageNow: number): { to: number; step: number } {
  const to = Math.min(1856, Math.max(365, Math.ceil((ageNow + 60) / 30) * 30));
  return { to, step: to > 730 ? 30 : 7 };
}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/growthForm.test.ts && bun run typecheck`
Expected: PASS — `Tests  8 passed (8)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 6: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m19.md lib/rules/growthForm.ts lib/rules/growthForm.test.ts && git commit -m "feat(growth): measurement form parsing and display helpers"
```

---

### Task 2: Lần đo qua outbox

**Files:**

- Modify: `lib/data/outboxCore.ts`, `lib/data/outbox.ts`, `lib/data/outboxDeps.ts`, `components/sync/OutboxSync.tsx`
- Test: `lib/data/outboxGrowth.test.ts`

**Interfaces:**

- Consumes: `GrowthRow` (M18); outbox của M12/M16
- Produces: `OutboxEntry.table: "logs" | "vaccine_doses" | "growth"`; `applyGrowthChange(rows, entry, nowIso)`, `overlayPendingGrowth(rows, entries, nowIso)`; `GrowthChange`, `growthKey(babyId) = ["growth", babyId]`, `enqueueGrowthChange(queryClient, change)`, `withPendingGrowth(babyId, rows)`; `sendGrowth` trong `outboxDeps`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/data/outboxGrowth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { GrowthRow } from "@/lib/supabase/rows";
import {
  applyGrowthChange,
  overlayPending,
  overlayPendingGrowth,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-15T03:00:00.000Z";

const entry = (
  op: OutboxEntry["op"],
  rowId: string,
  row: Record<string, unknown> | null,
  createdAt = 1,
): OutboxEntry => ({
  id: `e-${rowId}-${createdAt}`,
  table: "growth",
  op,
  rowId,
  babyId: "b1",
  userId: "u1",
  row,
  createdAt,
  attempts: 0,
});

const october: GrowthRow = {
  id: "g1",
  baby_id: "b1",
  measured_on: "2026-10-14",
  weight_g: 4300,
  length_cm: 54.5,
  head_cm: null,
  created_by: "u0",
  created_at: "2026-10-14T03:00:00.000Z",
  updated_at: "2026-10-14T03:00:00.000Z",
};

describe("applyGrowthChange", () => {
  it("insert adds the measurement newest first and ignores a repeat", () => {
    const add = entry("insert", "g2", {
      measured_on: "2026-11-14",
      weight_g: 5125,
    });
    const rows = applyGrowthChange([october], add, NOW);
    expect(rows.map((r) => r.id)).toEqual(["g2", "g1"]);
    expect(rows[0]).toMatchObject({
      baby_id: "b1",
      weight_g: 5125,
      length_cm: null,
      created_by: "u1",
    });
    expect(applyGrowthChange(rows, add, NOW)).toBe(rows);
  });

  it("update merges the changed columns and keeps the order by date", () => {
    const rows = applyGrowthChange(
      [october],
      entry("update", "g1", { head_cm: 38.2 }),
      NOW,
    );
    expect(rows).toEqual([{ ...october, head_cm: 38.2, updated_at: NOW }]);
  });

  it("delete removes the row", () => {
    expect(
      applyGrowthChange([october], entry("delete", "g1", null), NOW),
    ).toEqual([]);
  });
});

describe("growth overlays stay apart from logs", () => {
  it("overlayPendingGrowth uses growth entries only, oldest first", () => {
    const logEntry: OutboxEntry = {
      ...entry("delete", "g1", null, 0),
      table: "logs",
    };
    const rows = overlayPendingGrowth(
      [october],
      [
        entry("update", "g1", { weight_g: 4400 }, 3),
        entry("update", "g1", { weight_g: 4350 }, 2),
        logEntry,
      ],
      NOW,
    );
    expect(rows[0].weight_g).toBe(4400);
  });

  it("overlayPending (logs) ignores growth entries", () => {
    const logRow = { id: "g1" } as unknown as Parameters<
      typeof overlayPending
    >[0][number];
    expect(
      overlayPending([logRow], [entry("delete", "g1", null)], () => true, NOW),
    ).toEqual([logRow]);
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/data/outboxGrowth.test.ts`
Expected: FAIL — `Tests  4 failed | 1 passed (5)`, với `TypeError: applyGrowthChange is not a function` và `TypeError: overlayPendingGrowth is not a function`.

- [ ] **Step 3: Sửa `lib/data/outboxCore.ts`**

```diff
--- a/lib/data/outboxCore.ts
+++ b/lib/data/outboxCore.ts
@@ -1,4 +1,4 @@
-import type { LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
+import type { GrowthRow, LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
 
 // logs: insert / update / delete / stop by row id.
 // vaccine_doses: upsert (mark a dose) / insert (quick tick, keeps an existing row) /
@@ -7,13 +7,14 @@
 
 export type OutboxEntry = {
   id: string;
-  table: "logs" | "vaccine_doses";
+  table: "logs" | "vaccine_doses" | "growth";
   op: OutboxOp;
   rowId: string;
   babyId: string;
   userId: string;
   // logs — insert: the new row; update: the changed columns; stop: { ended_at }; delete: null.
   // vaccine_doses — always { vaccine_code, dose_no, ... } plus the marked columns.
+  // growth — insert: the measurement; update: the changed columns; delete: null.
   row: Record<string, unknown> | null;
   createdAt: number;
   attempts: number;
@@ -213,3 +214,54 @@
     .sort((a, b) => a.createdAt - b.createdAt)
     .reduce((acc, entry) => applyDoseChange(acc, entry, nowIso), rows);
 }
+
+const byMeasuredOn = (a: GrowthRow, b: GrowthRow) =>
+  b.measured_on.localeCompare(a.measured_on) ||
+  b.created_at.localeCompare(a.created_at);
+
+// growth rows use a client id, so entries match rows by id (like logs).
+export function applyGrowthChange(
+  rows: GrowthRow[],
+  entry: OutboxEntry,
+  nowIso: string,
+): GrowthRow[] {
+  const patch = (entry.row ?? {}) as Partial<GrowthRow>;
+  switch (entry.op) {
+    case "insert":
+      if (rows.some((r) => r.id === entry.rowId)) return rows;
+      return [
+        ...rows,
+        {
+          id: entry.rowId,
+          baby_id: entry.babyId,
+          measured_on: String(patch.measured_on),
+          weight_g: patch.weight_g ?? null,
+          length_cm: patch.length_cm ?? null,
+          head_cm: patch.head_cm ?? null,
+          created_by: entry.userId,
+          created_at: nowIso,
+          updated_at: nowIso,
+        },
+      ].sort(byMeasuredOn);
+    case "update":
+      return rows
+        .map((r) =>
+          r.id === entry.rowId ? { ...r, ...patch, updated_at: nowIso } : r,
+        )
+        .sort(byMeasuredOn);
+    case "delete":
+      return rows.filter((r) => r.id !== entry.rowId);
+    default:
+      return rows;
+  }
+}
+
+export function overlayPendingGrowth(
+  rows: GrowthRow[],
+  entries: OutboxEntry[],
+  nowIso: string,
+): GrowthRow[] {
+  return [...entriesFor(entries, "growth")]
+    .sort((a, b) => a.createdAt - b.createdAt)
+    .reduce((acc, entry) => applyGrowthChange(acc, entry, nowIso), rows);
+}
```

- [ ] **Step 4: Sửa `lib/data/outbox.ts`, `lib/data/outboxDeps.ts`, `components/sync/OutboxSync.tsx`**

```diff
--- a/lib/data/outbox.ts
+++ b/lib/data/outbox.ts
@@ -1,13 +1,15 @@
 "use client";
 
 import type { QueryClient } from "@tanstack/react-query";
-import type { LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
+import type { GrowthRow, LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
 import { localDb } from "./localDb";
 import {
   applyDoseChange,
+  applyGrowthChange,
   applyToCache,
   overlayPending,
   overlayPendingDoses,
+  overlayPendingGrowth,
   type OutboxEntry,
 } from "./outboxCore";
 import { flushRequests } from "./outboxEvents";
@@ -118,3 +120,46 @@
     return rows;
   }
 }
+
+export type GrowthChange = Pick<
+  OutboxEntry,
+  "rowId" | "babyId" | "userId" | "row"
+> & { op: "insert" | "update" | "delete" };
+
+export const growthKey = (babyId: string) => ["growth", babyId] as const;
+
+export async function enqueueGrowthChange(
+  queryClient: QueryClient,
+  change: GrowthChange,
+): Promise<void> {
+  const entry: OutboxEntry = {
+    ...change,
+    id: crypto.randomUUID(),
+    table: "growth",
+    createdAt: await nextCreatedAt(),
+    attempts: 0,
+  };
+  await localDb().outbox.add(entry);
+  const key = growthKey(change.babyId);
+  await queryClient.cancelQueries({ queryKey: key });
+  const nowIso = new Date().toISOString();
+  queryClient.setQueryData<GrowthRow[]>(key, (rows) =>
+    rows ? applyGrowthChange(rows, entry, nowIso) : rows,
+  );
+  flushRequests.emit();
+}
+
+export async function withPendingGrowth(
+  babyId: string,
+  rows: GrowthRow[],
+): Promise<GrowthRow[]> {
+  try {
+    const entries = await localDb()
+      .outbox.where("babyId")
+      .equals(babyId)
+      .toArray();
+    return overlayPendingGrowth(rows, entries, new Date().toISOString());
+  } catch {
+    return rows;
+  }
+}
```

```diff
--- a/lib/data/outboxDeps.ts
+++ b/lib/data/outboxDeps.ts
@@ -153,8 +153,67 @@
   }
 }
 
+type GrowthColumns = {
+  measured_on?: string;
+  weight_g?: number | null;
+  length_cm?: number | null;
+  head_cm?: number | null;
+};
+
+async function sendGrowth(entry: OutboxEntry): Promise<SendOutcome> {
+  const sb = supabase();
+  const row = (entry.row ?? {}) as GrowthColumns;
+  switch (entry.op) {
+    case "insert": {
+      // ignoreDuplicates: a retry after a lost response must not overwrite the row.
+      const result = await sb.from("growth").upsert(
+        {
+          id: entry.rowId,
+          baby_id: entry.babyId,
+          measured_on: String(row.measured_on),
+          weight_g: row.weight_g ?? null,
+          length_cm: row.length_cm ?? null,
+          head_cm: row.head_cm ?? null,
+        },
+        { onConflict: "id", ignoreDuplicates: true },
+      );
+      return result.error ? failed(result) : { ok: true };
+    }
+    case "update": {
+      const result = await sb
+        .from("growth")
+        .update(row)
+        .eq("id", entry.rowId)
+        .select("id");
+      if (result.error) return failed(result);
+      return result.data.length > 0
+        ? { ok: true }
+        : { ok: false, failure: { zeroRows: true } };
+    }
+    case "delete": {
+      const result = await sb
+        .from("growth")
+        .delete()
+        .eq("id", entry.rowId)
+        .select("id");
+      if (result.error) return failed(result);
+      if (result.data.length > 0) return { ok: true };
+      // 0 rows: gone already (another device deleted it) counts as done.
+      const check = await sb.from("growth").select("id").eq("id", entry.rowId);
+      if (check.error) return failed(check);
+      return check.data.length === 0
+        ? { ok: true }
+        : { ok: false, failure: { zeroRows: true } };
+    }
+    default:
+      return UNSUPPORTED;
+  }
+}
+
 function send(entry: OutboxEntry): Promise<SendOutcome> {
-  return entry.table === "vaccine_doses" ? sendDose(entry) : sendLog(entry);
+  if (entry.table === "vaccine_doses") return sendDose(entry);
+  if (entry.table === "growth") return sendGrowth(entry);
+  return sendLog(entry);
 }
 
 export function outboxDeps(): FlushDeps {
```

```diff
--- a/components/sync/OutboxSync.tsx
+++ b/components/sync/OutboxSync.tsx
@@ -46,6 +46,7 @@
           void queryClient.invalidateQueries({ queryKey: ["first-log"] });
           // Also rolls back a refused dose mark (spec §9) and drops temporary rows.
           void queryClient.invalidateQueries({ queryKey: ["vaccine-doses"] });
+          void queryClient.invalidateQueries({ queryKey: ["growth"] });
         }
       } catch (error) {
         console.warn("Không gửi được dữ liệu chờ đồng bộ", error);
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/data && bun run typecheck && bun run test`
Expected: PASS — `outboxGrowth.test.ts` 5 test xanh; không lỗi type; cả bộ `Tests  244 passed (244)` (231 + 8 + 5).

- [ ] **Step 6: Commit**

```bash
git add lib/data/outboxCore.ts lib/data/outbox.ts lib/data/outboxDeps.ts lib/data/outboxGrowth.test.ts components/sync/OutboxSync.tsx && git commit -m "feat(offline): growth measurements through the outbox"
```

---

### Task 3: Trang `/tang-truong`

**Files:**

- Create: `lib/data/growth.ts`, `components/growth/GrowthSheet.tsx`, `components/growth/GrowthChart.tsx`, `components/growth/GrowthScreen.tsx`, `app/tang-truong/page.tsx`
- Modify: `lib/nav.ts`, `sw/sw.template.js`, `components/emergency/EmergencyScreen.tsx`
- Test: `lib/nav.test.ts`, `lib/themeGuard.test.ts`, `scripts/sw.test.ts` (đã có)

**Interfaces:**

- Consumes: Task 1, Task 2; M18; `PendingMark`, `useOutboxEntries`, `AuthGate`
- Produces: `useGrowth`, `useWhoTable`, `useGrowthActions`; `GrowthSheet`, `GrowthChart`, `GrowthScreen`; trang `/tang-truong`; `TOOL_ITEMS` "Tăng trưởng" → `/tang-truong`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -35,6 +35,12 @@
     );
   });
 
+  it("Tiện ích opens the growth page", () => {
+    expect(TOOL_ITEMS.find((i) => i.label === "Tăng trưởng")?.href).toBe(
+      "/tang-truong",
+    );
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `AssertionError: expected null to be '/tang-truong'`; `Tests  1 failed | 5 passed (6)`.

- [ ] **Step 3: Sửa menu, service worker và trang Khẩn cấp**

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -25,7 +25,7 @@
 
 export const TOOL_ITEMS: MenuItem[] = [
   { label: "Thống kê", href: "/thong-ke" },
-  { label: "Tăng trưởng", href: null },
+  { label: "Tăng trưởng", href: "/tang-truong" },
   { label: "Khẩn cấp", href: "/khan-cap" },
   { label: "Nhạc", href: null },
   { label: "Ồn trắng", href: null },
```

```diff
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -13,6 +13,7 @@
 const PAGES = [
   "/nhat-ky",
   "/thong-ke",
+  "/tang-truong",
   "/cam-nang",
   "/tien-ich",
   "/cai-dat",
```

```diff
--- a/components/emergency/EmergencyScreen.tsx
+++ b/components/emergency/EmergencyScreen.tsx
@@ -2,7 +2,9 @@
 
 import { useState } from "react";
 import { useEmergencyContacts } from "@/lib/data/emergency";
+import { useGrowth } from "@/lib/data/growth";
 import { toVietnameseError } from "@/lib/data/errors";
+import { latestWeightG } from "@/lib/rules/growthForm";
 import type { Baby } from "@/lib/supabase/rows";
 import { CallList } from "./CallList";
 import { ContactsEditor } from "./ContactsEditor";
@@ -16,6 +18,7 @@
   isOwner: boolean;
 }) {
   const contacts = useEmergencyContacts(baby.family_id);
+  const growth = useGrowth(baby.id);
   const [editing, setEditing] = useState(false);
   const rows = contacts.data ?? [];
 
@@ -43,7 +46,11 @@
           {rows.length === 0 ? "Thêm số bác sĩ, người thân" : "Sửa danh bạ"}
         </button>
       )}
-      <ProfileCard baby={baby} isOwner={isOwner} latestWeightG={null} />
+      <ProfileCard
+        baby={baby}
+        isOwner={isOwner}
+        latestWeightG={latestWeightG(growth.data ?? [])}
+      />
     </main>
   );
 }
```

- [ ] **Step 4: Tạo `lib/data/growth.ts`**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loadWhoTable,
  type WhoIndicator,
  type WhoSex,
} from "@/lib/content/who";
import type { GrowthInput } from "@/lib/rules/growthForm";
import { supabase } from "@/lib/supabase/client";
import type { GrowthRow } from "@/lib/supabase/rows";
import { enqueueGrowthChange, growthKey, withPendingGrowth } from "./outbox";

export function useGrowth(babyId: string) {
  return useQuery({
    queryKey: growthKey(babyId),
    queryFn: async (): Promise<GrowthRow[]> => {
      const { data, error } = await supabase()
        .from("growth")
        .select("*")
        .eq("baby_id", babyId)
        .order("measured_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return withPendingGrowth(babyId, data);
    },
    staleTime: 60_000,
  });
}

// The WHO tables never change: kept forever, and persisted like other queries,
// so the charts also work offline once they were opened online. A fix to
// content/who/*.json reaches devices only after PERSIST_BUSTER is bumped.
// networkMode "always": the loader is a chunk import, which the service worker
// may already hold; offline without it the import fails and the page says so.
export function useWhoTable(indicator: WhoIndicator, sex: WhoSex) {
  return useQuery({
    queryKey: ["who", indicator, sex],
    queryFn: () => loadWhoTable(indicator, sex),
    networkMode: "always",
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// Spec §9: measurements go through the outbox with a client id.
export function useGrowthActions(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  const base = { babyId, userId };
  return {
    add: useMutation({
      networkMode: "always",
      mutationFn: (input: GrowthInput) =>
        enqueueGrowthChange(queryClient, {
          ...base,
          op: "insert",
          rowId: crypto.randomUUID(),
          row: input,
        }),
    }),
    update: useMutation({
      networkMode: "always",
      mutationFn: ({ id, input }: { id: string; input: GrowthInput }) =>
        enqueueGrowthChange(queryClient, {
          ...base,
          op: "update",
          rowId: id,
          row: input,
        }),
    }),
    remove: useMutation({
      networkMode: "always",
      mutationFn: (id: string) =>
        enqueueGrowthChange(queryClient, {
          ...base,
          op: "delete",
          rowId: id,
          row: null,
        }),
    }),
  };
}
```

- [ ] **Step 5: Tạo `components/growth/GrowthSheet.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
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
  const today = vnDateString(new Date());
  const [raw, setRaw] = useState<GrowthFormRaw>(() =>
    row
      ? growthToRaw(row)
      : { measuredOn: today, weightKg: "", lengthCm: "", headCm: "" },
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof GrowthFormRaw, string>>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const done = {
    onSuccess: onClose,
    onError: (e: unknown) => setMessage(toVietnameseError(e)),
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

  const input = "min-h-11 rounded-xl border px-3";
  const error = (key: keyof GrowthFormRaw) =>
    errors[key] ? (
      <span className="text-sm text-danger">{errors[key]}</span>
    ) : null;
  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full flex-col gap-3 overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">
          {row ? "Sửa lần đo" : "Thêm lần đo"}
        </h2>
        <label className="flex flex-col gap-1">
          Ngày đo
          <input
            type="date"
            className={input}
            min={dob}
            max={today}
            value={raw.measuredOn}
            onChange={(e) => setRaw({ ...raw, measuredOn: e.target.value })}
          />
          {error("measuredOn")}
        </label>
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            {field.label}
            <input
              inputMode="decimal"
              className={input}
              value={raw[field.key]}
              onChange={(e) => setRaw({ ...raw, [field.key]: e.target.value })}
            />
            {error(field.key)}
          </label>
        ))}
        {message && (
          <p role="alert" className="text-danger">
            {message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-2xl border"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent"
          >
            Lưu
          </button>
        </div>
        {row && canDelete && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Xóa lần đo này?"))
                actions.remove.mutate(row.id, done);
            }}
            className="min-h-11 rounded-2xl text-danger"
          >
            Xóa lần đo
          </button>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Tạo `components/growth/GrowthChart.tsx`**

```tsx
"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { PERCENTILE_LINES, type CurvePoint } from "@/lib/rules/growth";

const DAYS_PER_MONTH = 30.4375;
const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

// Spec §6.5: WHO P3–P97 lines by sex, with the baby's measurements as dots.
export function GrowthChart({
  curve,
  points,
  to,
  unit,
}: {
  curve: CurvePoint[];
  points: { day: number; value: number }[];
  to: number;
  unit: string;
}) {
  const months = Math.round(to / DAYS_PER_MONTH);
  const every = months > 24 ? 6 : months > 12 ? 3 : 1;
  const ticks = Array.from({ length: Math.floor(months / every) + 1 }, (_, i) =>
    Math.round(i * every * DAYS_PER_MONTH),
  );
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-muted)"
            strokeOpacity={0.3}
          />
          <XAxis
            type="number"
            dataKey="day"
            domain={[0, to]}
            ticks={ticks}
            tickFormatter={(day: number) =>
              `${Math.round(day / DAYS_PER_MONTH)}`
            }
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
            label={{
              value: "tháng",
              position: "insideBottomRight",
              offset: -4,
              fontSize: 12,
              fill: "var(--color-muted)",
            }}
          />
          <YAxis
            type="number"
            domain={["auto", "auto"]}
            width={36}
            tickFormatter={(value: number) => number.format(value)}
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
            label={{
              value: unit,
              angle: -90,
              position: "insideLeft",
              fontSize: 12,
              fill: "var(--color-muted)",
            }}
          />
          {PERCENTILE_LINES.map((line) => (
            <Line
              key={line.label}
              data={curve}
              dataKey={line.label}
              dot={false}
              isAnimationActive={false}
              stroke={
                line.z === 0 ? "var(--color-good-ink)" : "var(--color-muted)"
              }
              strokeWidth={line.z === 0 ? 2 : 1}
              strokeDasharray={Math.abs(line.z) > 1.5 ? "4 3" : undefined}
            />
          ))}
          <Scatter
            data={points}
            dataKey="value"
            fill="var(--color-accent)"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 7: Tạo `components/growth/GrowthScreen.tsx` và `app/tang-truong/page.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { whoSex, type LmsRow, type WhoIndicator } from "@/lib/content/who";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { assess, curve, type Assessment } from "@/lib/rules/growth";
import {
  chartRange,
  formatGrowthValue,
  formatPercentile,
  formatZ,
  indicatorValue,
  INDICATORS,
} from "@/lib/rules/growthForm";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby, GrowthRow } from "@/lib/supabase/rows";
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

const LEVEL_CLASS = {
  green: "bg-good-soft text-good-ink",
  yellow: "bg-warn-soft text-warn-ink",
  red: "bg-danger-soft text-danger-ink",
} as const;

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
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Tăng trưởng</h1>
      <button
        type="button"
        onClick={() => setSheet({ row: null })}
        className="min-h-12 rounded-2xl bg-accent text-on-accent"
      >
        + Thêm lần đo
      </button>
      <div role="tablist" className="flex gap-2">
        {INDICATORS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={item.key === indicator}
            onClick={() => setIndicator(item.key)}
            className={`min-h-11 flex-1 rounded-xl border ${item.key === indicator ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
          >
            {item.title}
          </button>
        ))}
      </div>
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
        <div className="h-72" />
      )}
      <p className="text-sm text-muted">
        Đường WHO P3, P15, P50 (đậm), P85, P97 cho{" "}
        {sex === "girls" ? "bé gái" : "bé trai"}; chấm là các lần đo của bé.
        Nguồn: WHO Child Growth Standards.
      </p>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Các lần đo</h2>
        {growth.isError && !growth.data && (
          <p role="alert" className="text-danger">
            {toVietnameseError(growth.error)}
          </p>
        )}
        {growth.data && rows.length === 0 && (
          <p className="text-muted">Chưa có lần đo nào.</p>
        )}
        {rows.length > 0 && (
          <ul className="divide-y rounded-2xl border">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={!canEdit(row)}
                  onClick={() => setSheet({ row })}
                  className="flex min-h-12 w-full flex-col gap-1 px-4 py-2 text-left disabled:opacity-100"
                >
                  <span className="font-medium">
                    {row.measured_on.split("-").reverse().join("/")} ·{" "}
                    {formatAgeVi(
                      baby.dob,
                      new Date(`${row.measured_on}T05:00:00Z`),
                    )}{" "}
                    <PendingMark pending={pending.has(row.id)} />
                  </span>
                  {INDICATORS.map((item) => {
                    const value = indicatorValue(row, item.key);
                    if (value === null) return null;
                    // undefined: table not loaded yet; null: outside 0..1856 days.
                    const result = lms
                      ? assess(lms, baby.dob, row.measured_on, value)
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
          </ul>
        )}
        {rows.length > 0 && (
          <p className="text-sm text-muted">
            z-score và phân vị là của chỉ số đang chọn (
            {current.title.toLowerCase()}).
          </p>
        )}
      </section>
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
    <span className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">{title}:</span>
      <span>{text}</span>
      {shown &&
        result !== undefined &&
        (result ? (
          <span className={`rounded-full px-2 ${LEVEL_CLASS[result.level]}`}>
            z {formatZ(result.z)} · {formatPercentile(result.percentile)}
            {result.text ? ` · ${result.text}` : ""}
          </span>
        ) : (
          <span className="text-muted">Ngoài bảng WHO</span>
        ))}
    </span>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { GrowthScreen } from "@/components/growth/GrowthScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <GrowthScreen
            baby={ctx.baby}
            userId={session.user.id}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
```

- [ ] **Step 8: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  245 passed (245)`; build thành công, có `○ /tang-truong`. Mỗi bảng WHO là một chunk riêng khoảng 55 KB: `grep -l '"indicator":"wfa"' .next/static/chunks/*.js | wc -l` in `2` (trai, gái).

- [ ] **Step 9: Commit**

```bash
git add lib/data/growth.ts components/growth app/tang-truong lib/nav.ts lib/nav.test.ts sw/sw.template.js components/emergency/EmergencyScreen.tsx && git commit -m "feat(growth): /tang-truong with WHO percentile charts and z-scores"
```

---

### Task 4: Checklist bước 12 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 3
- Produces: checklist bước 12

- [ ] **Step 1: Thêm bước 12 vào cuối `docs/device-checklist.md`**

````markdown
## Bước 12 — Tăng trưởng (M19)

1. Tiện ích → Tăng trưởng → "+ Thêm lần đo": ngày đo, cân nặng (ví dụ "5,2"), chiều dài, vòng đầu theo sổ khám gần nhất → Lưu. Kỳ vọng: lần đo hiện ngay trong "Các lần đo"; biểu đồ Cân nặng có chấm của bé giữa các đường P3–P97 của đúng giới tính; dòng đo có nhãn "z … · P…".
2. Bấm "Chiều dài" rồi "Vòng đầu". Kỳ vọng: biểu đồ và nhãn z đổi theo chỉ số.
3. Bật chế độ máy bay, thêm một lần đo thử. Kỳ vọng: hiện ngay, có ⏳ và chip "⏳ 1 mục chờ đồng bộ". Tắt máy bay. Kỳ vọng: trong ≤ 30 giây ⏳ biến mất; máy thứ hai mở Tăng trưởng thấy lần đo đó.
4. Tiện ích → Khẩn cấp. Kỳ vọng: "Cân nặng gần nhất" là cân nặng của lần đo mới nhất.
5. Bấm lần đo thử → "Xóa lần đo" → xác nhận. Kỳ vọng: dòng biến mất.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
````

Run: `grep -n '^## ' docs/device-checklist.md | tail -1`
Expected: `## Bước 12 — Tăng trưởng (M19)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist step 12 for growth" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/tang-truong`
Expected: `200`.

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bảng kết quả bước 12 để trống. Trong báo cáo cuối ghi: "Checklist bước 12 chờ người dùng."

---

## Ngoài phạm vi M19

- Phân loại triệu chứng (`/trieu-chung`) và bài bệnh thường gặp.
- Báo cáo cho bác sĩ (đợt 3) sẽ dùng `latestWeightG`, `assess` cho "lần đo tăng trưởng gần nhất kèm phân vị".
