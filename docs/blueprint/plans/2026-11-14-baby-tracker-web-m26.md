# Baby Tracker Web — M26 (Báo cáo cho bác sĩ, chốt đợt 3) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/bao-cao` (spec §6.15): chọn 7 hoặc 14 ngày; in khổ A4 dọc thông tin bé và tuổi, bảng theo ngày (giờ ngủ, số cữ bú, ml bình, tã ướt/bẩn), các lần đo nhiệt độ, thuốc đã dùng (giờ, tên, lượng), lần đo tăng trưởng gần nhất kèm phân vị, mũi tiêm gần nhất và mũi sắp tới; nút "In / Lưu PDF" gọi `window.print()`. Sau đó ghi kết luận đợt 3 vào checklist.

**Architecture:**
- **Quy tắc thuần** (`lib/rules/report.ts`): dòng nhiệt độ, dòng thuốc, tóm tắt tăng trưởng (dùng `assess` của M18), tóm tắt tiêm chủng (dùng `buildSchedule` của M14). Bảng theo ngày dùng lại `dailyStats` (M7).
- **Giao diện:** `components/report/ReportScreen.tsx` đọc nhật ký (`useStatsLogs`), lần đo (`useGrowth`), bảng WHO (`useWhoTable`), mũi tiêm (`useVaccineDoses`). Phần chọn ngày và nút in có `print:hidden`.
- **In:** `app/globals.css` thêm `@media print` (A4 dọc, lề 12 mm, màu đen trên trắng ở mọi giao diện); `TabBar` và `SyncBar` có `print:hidden`.

**Tech Stack:** như M1–M25. Không thêm gói nào.

**Milestones của đợt phát hành 3:**
- M22–M25: xong.
- **M26 (plan này):** báo cáo cho bác sĩ, checklist bước 19, kết luận đợt 3.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Khoảng ngày:** 7 hoặc 14 ngày lịch giờ VN, kết thúc hôm nay (hôm nay tính đến hiện tại), giống trang Thống kê. Nhiệt độ và thuốc lấy các bản ghi bắt đầu từ 00:00 ngày đầu tiên.
- **Bảng theo ngày:** giờ ngủ (1 chữ số thập phân), số cữ bú (gom theo §7.1), tổng ml bình, tã ướt / tã bẩn — đúng số liệu của `dailyStats`.
- **Nhiệt độ:** mỗi lần đo một dòng "dd/MM HH:mm: 38,4°C (nách)", cũ trước mới sau; từ 38°C in đậm. **Thuốc:** "dd/MM HH:mm: tên (hạ sốt nếu có) — lượng đơn vị". Báo cáo chỉ chép lại những gì gia đình đã ghi, không tính liều (§2.1).
- **Tăng trưởng:** với mỗi chỉ số (cân nặng, chiều dài, vòng đầu), lần đo mới nhất có chỉ số đó, kèm phân vị WHO theo tuổi tại ngày đo; chưa tải được bảng WHO thì bỏ phân vị.
- **Tiêm chủng:** "Mũi gần nhất" là mũi đã tiêm có ngày tiêm muộn nhất (tick nhanh không có ngày thì ghi tên, không ngày); "Mũi sắp tới" là mũi chưa tiêm, chưa bỏ qua, không thuộc nhóm chưa chọn loại, có ngày hẹn sớm nhất; mũi đã quá hạn ghi "quá hạn từ dd/MM/yyyy", mũi quá tuổi tối đa của loại vaccine ghi thêm "— đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ".
- **In:** `window.print()`; trên iPhone, hộp in cho "Lưu vào Tệp" thành PDF. Bản in khổ A4 dọc, chữ đen nền trắng kể cả khi đang ở giao diện Tối hoặc Ban đêm; ẩn thanh tab, chip đồng bộ, nút chọn ngày và nút in. Dòng cuối: "Số liệu do gia đình ghi bằng ứng dụng Bé Yêu. Thông tin tham khảo, không thay thế bác sĩ."
- **Chỉ in khi đủ dữ liệu:** nội dung báo cáo và nút "In / Lưu PDF" chỉ hiện/bật khi nhật ký, lần đo và mũi tiêm đã tải xong (bảng WHO không bắt buộc — thiếu thì bỏ phân vị); lúc đang tải hiện "Đang tải dữ liệu…", tải lỗi thì hiện lỗi của từng phần (Nhật ký / Tăng trưởng / Tiêm chủng). Như vậy bản in không bao giờ ghi "không có" chỉ vì dữ liệu chưa về. Bản in có tiêu đề "Báo cáo cho bác sĩ".
- **Kết luận đợt 3:** phần tự động chạy được ngay; phần điện thoại do người dùng làm ("Chờ người dùng", không đánh dấu Đạt).

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

Riêng M26:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/report.ts` và `components/report/ReportScreen.tsx` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, tới commit cuối của M25):

- `useStatsLogs`, `dailyStats`, `sleepHours`, `statsFetchSince` (M7, M22); `vnDayRange`, `vnDayStartMs`, `formatDayShort` (`lib/rules/days.ts`)
- `useGrowth`, `useWhoTable` (M19); `assess` (M18); `INDICATORS`, `indicatorValue`, `formatGrowthValue`, `formatPercentile` (M19)
- `useVaccineDoses` (M16); `VACCINES`, `buildSchedule` (M14); `parseChoices`, `toDoseRecords` (M15)
- `detailsSchemas` (`lib/rules/logDetails.ts`); `TabBar`, `SyncBar`; `TOOL_ITEMS`; `sw/sw.template.js`; checklist tới bước 18

**Produces:**

- `lib/rules/report.ts`: `REPORT_DAYS`, `temperatureRows`, `medicineRows`, `growthSummary`, `vaccineSummary`
- `ReportScreen({ baby })`; trang `/bao-cao`; CSS in trong `app/globals.css`
- Checklist bước 19 và dòng "Kết luận đợt 3"

## File Structure

```
lib/rules/report.ts (+ test)             # nhiệt độ, thuốc, tăng trưởng, tiêm chủng cho báo cáo
components/report/ReportScreen.tsx; app/bao-cao/page.tsx
app/globals.css                          # @media print A4
components/nav/TabBar.tsx, components/sync/SyncBar.tsx   # print:hidden
lib/nav.ts (+ test), sw/sw.template.js, docs/device-checklist.md
```

## Tasks

1. Quy tắc báo cáo
2. Trang `/bao-cao` và bản in
3. Checklist bước 19, kết luận đợt 3 và deploy

---

### Task 1: Quy tắc báo cáo

**Files:**

- Create: `lib/rules/report.ts`
- Test: `lib/rules/report.test.ts`

**Interfaces:**

- Consumes: `detailsSchemas`, `formatDayShort`, `formatVnTime`, `vnDateString`, `assess`, `INDICATORS`, `indicatorValue`, `formatGrowthValue`, `formatPercentile`, `ScheduleItem`, `LmsRow`, `WhoIndicator`
- Produces: `REPORT_DAYS = [7, 14]`, `temperatureRows(logs, fromMs): { at; text; high }[]`, `medicineRows(logs, fromMs): { at; name; amount }[]`, `growthSummary(rows, tables, dob): { title; value; day; percentile }[]`, `vaccineSummary(items): { last; next }`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m26.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `docs: device checklist step 18 for milestones` của M25.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/rules/report.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LmsRow } from "@/lib/content/who";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import {
  growthSummary,
  medicineRows,
  temperatureRows,
  vaccineSummary,
} from "./report";
import type { ScheduleItem } from "./vaccines";

const from = Date.parse("2026-11-08T17:00:00Z"); // 00:00 on 09/11 in VN
const log = (type: string, started_at: string, details: unknown) => ({
  type,
  started_at,
  details,
});

describe("temperatureRows and medicineRows (spec §6.15)", () => {
  const logs = [
    log("temperature", "2026-11-14T01:00:00Z", {
      celsius: 38.4,
      method: "nach",
    }),
    log("temperature", "2026-11-08T10:00:00Z", { celsius: 39, method: "tai" }),
    log("temperature", "2026-11-10T13:30:00Z", {
      celsius: 37.2,
      method: "tran",
    }),
    log("medicine", "2026-11-14T01:10:00Z", {
      name: "Paracetamol",
      amount: 2.5,
      unit: "ml",
      antipyretic: true,
    }),
    log("medicine", "2026-11-12T00:00:00Z", {
      name: "Vitamin D",
      amount: 1,
      unit: "giọt",
      antipyretic: false,
    }),
    log("medicine", "2026-11-12T01:00:00Z", { broken: true }),
  ];

  it("lists readings in the period, oldest first, with VN time", () => {
    expect(temperatureRows(logs, from)).toEqual([
      { at: "10/11 20:30", text: "37,2°C (trán)", high: false },
      { at: "14/11 08:00", text: "38,4°C (nách)", high: true },
    ]);
  });

  it("lists medicines with name and amount, marking fever medicine", () => {
    expect(medicineRows(logs, from)).toEqual([
      { at: "12/11 07:00", name: "Vitamin D", amount: "1 giọt" },
      { at: "14/11 08:10", name: "Paracetamol (hạ sốt)", amount: "2,5 ml" },
    ]);
  });
});

describe("growthSummary", () => {
  const table: LmsRow[] = Array.from({ length: 80 }, (_, d) => [d, 1, 5, 0.1]);
  const row = (
    measured_on: string,
    weight_g: number | null,
    head_cm: number | null,
  ) => ({
    measured_on,
    weight_g,
    length_cm: null,
    head_cm,
  });

  it("takes the latest measurement of each indicator with its percentile", () => {
    expect(
      growthSummary(
        [row("2026-11-01", 4300, 38), row("2026-11-14", 5000, null)],
        { wfa: table },
        "2026-09-14",
      ),
    ).toEqual([
      {
        title: "Cân nặng",
        value: "5 kg",
        day: "14/11/2026",
        percentile: "P50",
      },
      {
        title: "Vòng đầu",
        value: "38 cm",
        day: "01/11/2026",
        percentile: null,
      },
    ]);
  });
});

describe("vaccineSummary", () => {
  const item = (
    name: string,
    due: string,
    state: ScheduleItem["state"],
    given_on: string | null = null,
    unchosen = false,
  ): ScheduleItem => ({
    dose: { name } as VaccineDose,
    due,
    state,
    record:
      state === "done"
        ? {
            vaccine_code: name,
            dose_no: 1,
            status: "done",
            given_on,
            due_on_override: null,
          }
        : null,
    unchosen,
    pastMaxAge: false,
  });

  it("finds the last dose given and the next one due", () => {
    expect(
      vaccineSummary([
        item("BCG", "2026-09-14", "done", "2026-09-15"),
        item("6 trong 1 mũi 1", "2026-11-13", "done", "2026-11-13"),
        item("Rota", "2026-11-13", "overdue", null, true),
        item("6 trong 1 mũi 2", "2026-12-13", "later"),
        item("Phế cầu", "2026-12-01", "upcoming"),
      ]),
    ).toEqual({
      last: { name: "6 trong 1 mũi 1", day: "13/11/2026" },
      next: {
        name: "Phế cầu",
        day: "01/12/2026",
        overdue: false,
        pastMaxAge: false,
      },
    });
    expect(
      vaccineSummary([item("Rota", "2026-11-01", "overdue")]).next,
    ).toEqual({
      name: "Rota",
      day: "01/11/2026",
      overdue: true,
      pastMaxAge: false,
    });
    expect(vaccineSummary([])).toEqual({ last: null, next: null });
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/report.test.ts`
Expected: FAIL — `Error: Cannot find module './report' imported from …/lib/rules/report.test.ts`

- [ ] **Step 4: Viết quy tắc**

Tạo `lib/rules/report.ts`:

```ts
import type { LmsRow, WhoIndicator } from "@/lib/content/who";
import { formatDayShort } from "./days";
import { assess } from "./growth";
import {
  formatGrowthValue,
  formatPercentile,
  indicatorValue,
  INDICATORS,
  type GrowthInput,
} from "./growthForm";
import { detailsSchemas } from "./logDetails";
import { formatVnTime, vnDateString } from "./time";
import type { ScheduleItem } from "./vaccines";

export const REPORT_DAYS = [7, 14] as const;

type LogLike = { type: string; started_at: string; details: unknown };

const METHOD: Record<string, string> = {
  nach: "nách",
  tran: "trán",
  tai: "tai",
  hau_mon: "hậu môn",
};

const when = (iso: string) => {
  const at = new Date(iso);
  return `${formatDayShort(vnDateString(at))} ${formatVnTime(at)}`;
};

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

// Spec §6.15: every temperature reading in the period, oldest first.
export function temperatureRows(
  logs: LogLike[],
  fromMs: number,
): { at: string; text: string; high: boolean }[] {
  return logs
    .filter((log) => log.type === "temperature")
    .filter((log) => Date.parse(log.started_at) >= fromMs)
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .flatMap((log) => {
      const parsed = detailsSchemas.temperature.safeParse(log.details);
      if (!parsed.success) return [];
      const { celsius, method } = parsed.data;
      return [
        {
          at: when(log.started_at),
          text: `${decimal.format(celsius)}°C (${METHOD[method]})`,
          high: celsius >= 38,
        },
      ];
    });
}

// Spec §6.15: medicines given (time, name, amount), oldest first.
export function medicineRows(
  logs: LogLike[],
  fromMs: number,
): { at: string; name: string; amount: string }[] {
  return logs
    .filter((log) => log.type === "medicine")
    .filter((log) => Date.parse(log.started_at) >= fromMs)
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .flatMap((log) => {
      const parsed = detailsSchemas.medicine.safeParse(log.details);
      if (!parsed.success) return [];
      const d = parsed.data;
      return [
        {
          at: when(log.started_at),
          name: d.antipyretic ? `${d.name} (hạ sốt)` : d.name,
          amount: `${decimal.format(d.amount)} ${d.unit}`,
        },
      ];
    });
}

// Spec §6.15: the latest measurement of each indicator, with its WHO percentile.
export function growthSummary(
  rows: (GrowthInput & { created_at?: string })[],
  tables: Partial<Record<WhoIndicator, LmsRow[]>>,
  dob: string,
): { title: string; value: string; day: string; percentile: string | null }[] {
  return INDICATORS.flatMap((indicator) => {
    const latest = [...rows]
      .filter((row) => indicatorValue(row, indicator.key) !== null)
      .sort((a, b) => b.measured_on.localeCompare(a.measured_on))[0];
    if (!latest) return [];
    const value = indicatorValue(latest, indicator.key) as number;
    const table = tables[indicator.key];
    const result = table ? assess(table, dob, latest.measured_on, value) : null;
    return [
      {
        title: indicator.title,
        value: formatGrowthValue(indicator.key, value),
        day: latest.measured_on.split("-").reverse().join("/"),
        percentile: result ? formatPercentile(result.percentile) : null,
      },
    ];
  });
}

// Spec §6.15: last dose given and the next one due.
export function vaccineSummary(items: ScheduleItem[]): {
  last: { name: string; day: string | null } | null;
  next: {
    name: string;
    day: string;
    overdue: boolean;
    pastMaxAge: boolean;
  } | null;
} {
  const done = items
    .filter((item) => item.state === "done")
    .sort((a, b) =>
      (b.record?.given_on ?? b.due).localeCompare(a.record?.given_on ?? a.due),
    )[0];
  const next = items
    .filter(
      (item) =>
        !item.unchosen && item.state !== "done" && item.state !== "skipped",
    )
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  const dmy = (day: string) => day.split("-").reverse().join("/");
  return {
    last: done
      ? {
          name: done.dose.name,
          day: done.record?.given_on ? dmy(done.record.given_on) : null,
        }
      : null,
    next: next
      ? {
          name: next.dose.name,
          day: dmy(next.due),
          overdue: next.state === "overdue",
          pastMaxAge: next.pastMaxAge,
        }
      : null,
  };
}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/report.test.ts && bun run test && bun run typecheck`
Expected: PASS — `Tests  4 passed (4)`; cả bộ `Tests  312 passed (312)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 6: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m26.md lib/rules/report.ts lib/rules/report.test.ts && git commit -m "feat(report): temperature, medicine, growth and vaccine summaries"
```

---

### Task 2: Trang `/bao-cao` và bản in

**Files:**

- Create: `components/report/ReportScreen.tsx`, `app/bao-cao/page.tsx`
- Modify: `app/globals.css`, `components/nav/TabBar.tsx`, `components/sync/SyncBar.tsx`, `lib/nav.ts`, `sw/sw.template.js`
- Test: `lib/nav.test.ts`, `lib/themeGuard.test.ts`, `scripts/sw.test.ts` (đã có)

**Interfaces:**

- Consumes: Task 1 và các hook ở mục Consumes
- Produces: `ReportScreen({ baby })`; trang `/bao-cao`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -76,6 +76,12 @@
     );
   });
 
+  it("Tiện ích opens the doctor report", () => {
+    expect(TOOL_ITEMS.find((i) => i.label === "Báo cáo")?.href).toBe(
+      "/bao-cao",
+    );
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `AssertionError: expected null to be '/bao-cao'`; `Tests  1 failed | 12 passed (13)`.

- [ ] **Step 3: Sửa menu, service worker, CSS in, thanh tab và chip đồng bộ**

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -30,7 +30,7 @@
   { label: "Nhạc", href: "/nhac" },
   { label: "Ồn trắng", href: "/on-trang" },
   { label: "Ảnh", href: "/anh" },
-  { label: "Báo cáo", href: null },
+  { label: "Báo cáo", href: "/bao-cao" },
 ];
 
 const OWNERS: { tab: TabKey; prefixes: string[] }[] = [
```

```diff
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -17,6 +17,7 @@
   "/on-trang",
   "/nhac",
   "/anh",
+  "/bao-cao",
   "/cam-nang",
   "/tien-ich",
   "/cai-dat",
```

```diff
--- a/app/globals.css
+++ b/app/globals.css
@@ -70,3 +70,21 @@
   padding: env(safe-area-inset-top) env(safe-area-inset-right)
     env(safe-area-inset-bottom) env(safe-area-inset-left);
 }
+
+/* Spec §6.15: the doctor report prints on A4 portrait, black on white whatever the theme. */
+@media print {
+  @page {
+    size: A4 portrait;
+    margin: 12mm;
+  }
+  :root,
+  :root[data-theme] {
+    color-scheme: light;
+    --color-surface: #ffffff;
+    --color-ink: #000000;
+    --color-muted: #444444;
+  }
+  body {
+    background: #ffffff;
+  }
+}
```

```diff
--- a/components/nav/TabBar.tsx
+++ b/components/nav/TabBar.tsx
@@ -7,7 +7,7 @@
 export function TabBar() {
   const current = activeTab(usePathname());
   return (
-    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-surface pb-[env(safe-area-inset-bottom)]">
+    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-surface pb-[env(safe-area-inset-bottom)] print:hidden">
       <ul className="mx-auto flex max-w-md">
         {TABS.map((tab) => {
           const active = tab.key === current;
```

```diff
--- a/components/sync/SyncBar.tsx
+++ b/components/sync/SyncBar.tsx
@@ -25,7 +25,7 @@
 
   if (count === 0 && !dropped) return null;
   return (
-    <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pt-4">
+    <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pt-4 print:hidden">
       {count > 0 && (
         <p
           role="status"
```

- [ ] **Step 4: Tạo `components/report/ReportScreen.tsx` và `app/bao-cao/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { VACCINES } from "@/lib/content/vaccines";
import { whoSex, type LmsRow } from "@/lib/content/who";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { useStatsLogs } from "@/lib/data/logs";
import { useNow } from "@/lib/hooks/useNow";
import { useVaccineDoses } from "@/lib/data/vaccines";
import {
  dailyStats,
  sleepHours,
  statsFetchSince,
} from "@/lib/rules/dailyStats";
import { formatDayShort, vnDayRange, vnDayStartMs } from "@/lib/rules/days";
import {
  growthSummary,
  medicineRows,
  REPORT_DAYS,
  temperatureRows,
  vaccineSummary,
} from "@/lib/rules/report";
import { formatAgeVi, vnDateString } from "@/lib/rules/time";
import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
import { buildSchedule } from "@/lib/rules/vaccines";
import type { Baby } from "@/lib/supabase/rows";

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const dmy = (day: string) => day.split("-").reverse().join("/");

export function ReportScreen({ baby }: { baby: Baby }) {
  const [range, setRange] = useState<(typeof REPORT_DAYS)[number]>(7);
  const now = useNow(60_000);
  const days = vnDayRange(now, range);
  const fromMs = vnDayStartMs(days[0]);
  const logs = useStatsLogs(baby.id, statsFetchSince(days));
  const growth = useGrowth(baby.id);
  const doses = useVaccineDoses(baby.id);
  const sex = whoSex(baby.sex);
  const wfa = useWhoTable("wfa", sex);
  const lhfa = useWhoTable("lhfa", sex);
  const hcfa = useWhoTable("hcfa", sex);

  const rows = logs.data ?? [];
  const stats = dailyStats(rows, days, now);
  const temperatures = temperatureRows(rows, fromMs);
  const medicines = medicineRows(rows, fromMs);
  const measures = growthSummary(
    growth.data ?? [],
    {
      wfa: wfa.data?.rows as LmsRow[] | undefined,
      lhfa: lhfa.data?.rows as LmsRow[] | undefined,
      hcfa: hcfa.data?.rows as LmsRow[] | undefined,
    },
    baby.dob,
  );
  const vaccines = vaccineSummary(
    buildSchedule({
      doses: VACCINES.doses,
      choices: parseChoices(baby.vaccine_choices),
      dob: baby.dob,
      records: toDoseRecords(doses.data ?? []),
      today: vnDateString(now),
    }),
  );
  const cell = "border px-2 py-1";
  // A report for a doctor must never print "nothing recorded" while data is
  // still loading or failed to load (offline without a cache).
  const ready = Boolean(logs.data && growth.data && doses.data);
  const failures = [
    { label: "Nhật ký", query: logs },
    { label: "Tăng trưởng", query: growth },
    { label: "Tiêm chủng", query: doses },
  ].filter(({ query }) => query.isError && !query.data);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4 print:max-w-none print:p-0 print:text-sm">
      <div className="flex flex-col gap-3 print:hidden">
        <h1 className="text-2xl font-semibold">Báo cáo cho bác sĩ</h1>
        <div className="grid grid-cols-2 gap-2">
          {REPORT_DAYS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={range === n}
              onClick={() => setRange(n)}
              className={`min-h-11 rounded-full ${range === n ? "bg-accent text-on-accent" : "bg-soft"}`}
            >
              {n} ngày
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!ready}
          onClick={() => window.print()}
          className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
        >
          In / Lưu PDF
        </button>
        {failures.map(({ label, query }) => (
          <p key={label} role="alert" className="text-danger">
            {label}: {toVietnameseError(query.error)}
          </p>
        ))}
        {!ready && failures.length === 0 && (
          <p className="text-muted">Đang tải dữ liệu…</p>
        )}
      </div>

      {ready && (
        <>
          <h1 className="hidden text-xl font-semibold print:block">
            Báo cáo cho bác sĩ
          </h1>
          <section>
            <h2 className="text-xl font-semibold">
              {baby.name} — {formatAgeVi(baby.dob, now)}
            </h2>
            <p>
              Ngày sinh {dmy(baby.dob)} ·{" "}
              {baby.sex === "female" ? "Bé gái" : "Bé trai"}
              {baby.blood_type ? ` · Nhóm máu ${baby.blood_type}` : ""}
              {baby.allergies ? ` · Dị ứng: ${baby.allergies}` : ""}
            </p>
            <p className="text-muted">
              {range} ngày, từ {formatDayShort(days[0])} đến{" "}
              {formatDayShort(days[days.length - 1])} · in ngày{" "}
              {dmy(vnDateString(now))}
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Theo ngày</h3>
            <table className="w-full border-collapse text-left tabular-nums">
              <thead>
                <tr>
                  <th className={cell}>Ngày</th>
                  <th className={cell}>Ngủ (giờ)</th>
                  <th className={cell}>Cữ bú</th>
                  <th className={cell}>Bình (ml)</th>
                  <th className={cell}>Tã ướt / bẩn</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.day} className="break-inside-avoid">
                    <td className={cell}>{formatDayShort(s.day)}</td>
                    <td className={cell}>
                      {decimal.format(sleepHours(s.sleepMinutes))}
                    </td>
                    <td className={cell}>{s.feeds}</td>
                    <td className={cell}>{s.bottleMl}</td>
                    <td className={cell}>
                      {s.wetDiapers} / {s.dirtyDiapers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="font-semibold">Nhiệt độ</h3>
            {temperatures.length === 0 ? (
              <p className="text-muted">Không đo trong khoảng này.</p>
            ) : (
              <ul>
                {temperatures.map((t, i) => (
                  <li key={i} className={t.high ? "font-semibold" : ""}>
                    {t.at}: {t.text}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-semibold">Thuốc đã dùng</h3>
            {medicines.length === 0 ? (
              <p className="text-muted">Không dùng thuốc trong khoảng này.</p>
            ) : (
              <ul>
                {medicines.map((m, i) => (
                  <li key={i}>
                    {m.at}: {m.name} — {m.amount}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-semibold">Tăng trưởng (lần đo gần nhất)</h3>
            {measures.length === 0 ? (
              <p className="text-muted">Chưa có lần đo.</p>
            ) : (
              <ul>
                {measures.map((m) => (
                  <li key={m.title}>
                    {m.title}: {m.value} ({m.day})
                    {m.percentile ? ` · ${m.percentile} theo WHO` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-semibold">Tiêm chủng</h3>
            <p>
              Mũi gần nhất:{" "}
              {vaccines.last
                ? `${vaccines.last.name}${vaccines.last.day ? ` (${vaccines.last.day})` : ""}`
                : "chưa ghi"}
            </p>
            <p>
              Mũi sắp tới:{" "}
              {vaccines.next
                ? `${vaccines.next.name} (${vaccines.next.overdue ? "quá hạn từ" : "hẹn"} ${vaccines.next.day})${vaccines.next.pastMaxAge ? " — đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ" : ""}`
                : "chưa có"}
            </p>
          </section>

          <p className="text-sm text-muted">
            Số liệu do gia đình ghi bằng ứng dụng Bé Yêu. Thông tin tham khảo,
            không thay thế bác sĩ.
          </p>
        </>
      )}
    </main>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { ReportScreen } from "@/components/report/ReportScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) => (ctx?.baby ? <ReportScreen baby={ctx.baby} /> : null)}
    </AuthGate>
  );
}
```

- [ ] **Step 5: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  313 passed (313)`; build thành công, có `○ /bao-cao`.

- [ ] **Step 6: Commit**

```bash
git add components/report app/bao-cao app/globals.css components/nav/TabBar.tsx components/sync/SyncBar.tsx lib/nav.ts lib/nav.test.ts sw/sw.template.js && git commit -m "feat(report): /bao-cao printable A4 doctor report"
```

---

### Task 3: Checklist bước 19, kết luận đợt 3 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 2; checklist bước 5, 6, 15–18
- Produces: bước 19; dòng "Kết luận đợt 3"

- [ ] **Step 1: Thêm bước 19 vào cuối file**

```diff
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -279,3 +279,14 @@
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 19 — Báo cáo cho bác sĩ (M26)
+
+1. Tiện ích → Báo cáo → "7 ngày". Kỳ vọng: tên, tuổi, ngày sinh, giới tính (nhóm máu, dị ứng nếu đã ghi); bảng 7 ngày (giờ ngủ, cữ bú, ml bình, tã ướt / bẩn); nhiệt độ; thuốc đã dùng; lần đo tăng trưởng gần nhất kèm phân vị; mũi tiêm gần nhất và mũi sắp tới. Đổi sang "14 ngày" thì bảng có 14 dòng.
+2. Bấm "In / Lưu PDF" → Chia sẻ → Lưu vào Tệp (hoặc In). Kỳ vọng: khổ A4 dọc, chữ đen nền trắng kể cả khi đang dùng giao diện Tối hoặc Ban đêm; không có thanh tab, nút chọn ngày hay nút In trong bản in.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

Run: `grep '^## ' docs/device-checklist.md | tail -1`
Expected: `## Bước 19 — Báo cáo cho bác sĩ (M26)`.

- [ ] **Step 2: Chạy toàn bộ kiểm thử tự động**

Run: `bun run test && open -a OrbStack && bun run db:start && bun run db:test`
Expected: `Tests  313 passed (313)`; pgTAP `001`…`011` `ok`, `All tests successful.`

- [ ] **Step 3: Ghi kết luận đợt 3**

Thêm ngay dưới dòng "**Kết luận đợt 2 (2026-11-14):** …" ở đầu file (cách một dòng trống):

```markdown
**Kết luận đợt 3 (2026-11-14):** Chờ người dùng. Phần tự động đạt: Vitest 313 test và pgTAP 001–011 xanh. Tiêu chí §11 còn chờ trên điện thoại thật: checklist bước 5 (nhạc mở app YouTube, kể cả khi gỡ app) và bước 6 (tiếng ồn trắng khi khóa màn hình), cùng các bước 15–19.
```

- [ ] **Step 4: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist step 19 and release 3 status" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/bao-cao`
Expected: `200`.

- [ ] **Step 5: 👤 Ghi bước của người dùng**

Bảng kết quả bước 19 để trống. Trong báo cáo cuối ghi: "Checklist bước 5, 6, 15–19 và tiêu chí §11 của đợt 3 chờ người dùng."

---

## Ngoài phạm vi M26

- Spec không còn hạng mục nào sau đợt 3. Việc còn lại là kiểm trên điện thoại thật (checklist bước 1–19) và sửa lỗi người dùng phát hiện.
