# Baby Tracker Web — M18 (Tăng trưởng: bảng WHO, z-score, bảng `growth`) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Đặt nền cho tính năng tăng trưởng (spec §6.5, §7.3, §5): bảng LMS của WHO Child Growth Standards theo ngày tuổi 0–1856 (cân nặng, chiều dài, vòng đầu; trai, gái) trong `content/who/*.json`, các hàm thuần tính z-score, phân vị, nhãn và đường P3–P97, và bảng `growth` có RLS. Chưa có giao diện; M19 dựng trang `/tang-truong`, đưa lần đo qua outbox và nối cân nặng mới nhất vào trang Khẩn cấp.

**Architecture:**
- **Bảng WHO:** `scripts/build-who.ts` (dùng `exceljs`, chỉ ở dev) đọc 6 file "expanded tables" z-score tải từ who.int và ghi `content/who/{wfa,lhfa,hcfa}_{boys,girls}.json` dạng `{ indicator, sex, unit, source, reviewedAt, rows: [[day, L, M, S], …] }`. JSON được commit; file .xlsx thì không.
- **Nạp bảng:** `lib/content/who.ts` kiểm bằng zod và nạp từng bảng bằng dynamic import, nên mỗi bảng (~50 KB) là một chunk riêng, chỉ tải khi trang cần.
- **Quy tắc** (`lib/rules/growth.ts`): `zScore`, `valueAtZ`, `normalCdf`, `percentile`, `rateZ`, `ageOnDay`, `assess`, `curve` — đúng công thức §7.3, test đối chiếu với cột SD của chính bảng WHO.
- **Dữ liệu:** migration `20261114000600_growth.sql` tạo bảng `growth` với `id` do client sinh (để outbox gửi lại không trùng, §9) và RLS giống `logs` (§5.2); pgTAP `008`.

**Tech Stack:** như M1–M17. Thêm dev `exceljs` 4.4.0 (có trong danh sách §2.2: "dev-only `exceljs` 4.x").

**Milestones của đợt phát hành 2:**
- M14–M17: xong (tiêm chủng, nhắc tiêm, khẩn cấp, nhắc thức).
- **M18 (plan này):** bảng WHO, quy tắc tăng trưởng, bảng `growth`.
- M19: trang `/tang-truong` (nhập lần đo, ba biểu đồ, z-score và nhãn), lần đo đi qua outbox, cân nặng gần nhất ở Khẩn cấp.
- Sau đó: phân loại triệu chứng và bài bệnh thường gặp.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Tải file WHO:** người dùng đã đồng ý (2026-11-14) cho tải 6 file .xlsx từ `cdn.who.int`. Tải vào thư mục tạm ngoài repo, không commit. Link chiều dài/chiều cao nằm ở thư mục `expandable-tables` (khác hai loại kia là `expanded-tables`), đúng như trang WHO đang dẫn.
- **Định dạng file JSON:** một dòng, `rows` là mảng `[day, L, M, S]` cho từng ngày 0..1856 (số đọc từ Excel, in bằng `JSON.stringify`). `source` là URL của file .xlsx; `reviewedAt` là ngày chạy script (truyền vào làm tham số). Đơn vị: `wfa` tính kg, `lhfa`/`hcfa` tính cm. Bảng `lhfa` của WHO dùng chiều dài nằm tới 730 ngày và chiều cao đứng từ 731 ngày; app dùng nguyên bảng.
- **Đọc file .xlsx:** sheet đầu tiên, dòng 1 phải bắt đầu `Day, L, M, S`, mỗi dòng sau là một ngày liên tiếp từ 0; sai thì script dừng với lỗi.
- **z-score (§7.3):** `z = ((X / M)^L − 1) / (L · S)`, `L = 0` thì `z = ln(X / M) / S`; không dùng bản "restricted" của WHO cho |z| > 3. Phân vị = `Φ(z)·100`, `Φ` tính bằng hàm erf xấp xỉ Abramowitz & Stegun 7.1.26 (sai số < 1,5·10⁻⁷).
- **Nhãn:** |z| ≤ 2 xanh; 2 < |z| ≤ 3 vàng "Nên hỏi bác sĩ ở lần khám tới"; |z| > 3 đỏ "Nên cho bé đi khám".
- **Tuổi tra bảng:** `measured_on − dob` theo ngày. Ngoài 0..1856 (đo trước ngày sinh hoặc sau 5 tuổi) thì `assess` trả `null` (M19 hiện "Ngoài bảng WHO").
- **Đường biểu đồ:** P3/P15/P50/P85/P97 tại z = −1,881 / −1,036 / 0 / 1,036 / 1,881, tính bằng `valueAtZ` (nghịch đảo của `zScore`).
- **Bảng `growth`:** đúng cột §5. `id` không có default (client sinh). Thêm ràng buộc: `weight_g` 300–40000, `length_cm` 20–130, `head_cm` 20–60, ít nhất một giá trị khác null; index `(baby_id, measured_on desc)`; trigger `set_updated_at` và `forbid_immutable_change('id', 'baby_id', 'created_by')`.
- **RLS (§5.2, cùng dòng với `logs`):** select M; insert M và Mine; update và delete: O hoặc (M và Mine).
- **`db push`:** người dùng đã cho phép trước chạy `bunx supabase db push --linked --yes` cho migration chỉ thêm bảng mới đã duyệt.

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

Riêng M18:

- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier). Không chạy prettier trên `content/who/*.json`.
- Câu chữ tiếng Việt trong `rateZ` (`lib/rules/growth.ts`) phải đúng từng ký tự như plan này.
- `exceljs` chỉ được import trong `scripts/`; code của app không import nó.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`af1674a`):

- M1: `babies(dob, sex)`, `is_member`, `is_owner`, `baby_family`, `set_updated_at`, `forbid_immutable_change`
- Cách viết migration/pgTAP của M14, M17; `bun run db:types`

**Produces** (M19 dùng):

- `content/who/{wfa,lhfa,hcfa}_{boys,girls}.json`; `scripts/build-who.ts` (`WHO_FILES`, `readLmsRows`) chỉ dùng ở dev — code của app không import gì từ `scripts/` (sẽ kéo `exceljs` vào bundle); nguồn hiển thị lấy từ trường `source` của JSON
- `lib/content/who.ts`: `WhoIndicator`, `WhoSex`, `WHO_LAST_DAY`, `LmsRow`, `WhoTableSchema`, `WhoTable`, `loadWhoTable(indicator, sex)`, `whoSex(babySex)`
- Đơn vị: `assess`, `curve` làm việc theo đơn vị của bảng (`unit`: kg cho `wfa`, cm cho hai bảng kia); `growth.weight_g` lưu gram nên M19 truyền `weight_g / 1000`.
- `lib/rules/growth.ts`: `Lms`, `GrowthLevel`, `PERCENTILE_LINES`, `lmsAt`, `zScore`, `valueAtZ`, `normalCdf`, `percentile`, `rateZ`, `ageOnDay`, `Assessment`, `assess(rows, dob, measuredOn, value)`, `CurvePoint`, `curve(rows, fromDay, toDay, step)`
- Bảng `public.growth` (local và cloud), `GrowthRow` (`lib/supabase/rows.ts`)

## File Structure

```
package.json, bun.lock                   # thêm dev exceljs 4.4.0
scripts/build-who.ts                     # .xlsx của WHO → content/who/*.json
content/who/*.json                       # 6 bảng LMS (sinh ra, có commit)
lib/content/who.ts (+ test)              # schema và nạp bảng
lib/rules/growth.ts (+ test)             # z-score, phân vị, nhãn, đường P3–P97
supabase/migrations/20261114000600_growth.sql, supabase/tests/008_growth.test.sql
lib/supabase/types.ts, lib/supabase/rows.ts   # sinh lại; GrowthRow
README.md                                # cách tạo lại bảng WHO
```

## Tasks

1. Bảng LMS của WHO
2. Quy tắc tăng trưởng
3. Bảng `growth` và đưa lên cloud

---

### Task 1: Bảng LMS của WHO

**Files:**

- Create: `scripts/build-who.ts`, `lib/content/who.ts`, `content/who/*.json` (sinh ra)
- Modify: `package.json`, `bun.lock` (thêm `exceljs`), `README.md`
- Test: `lib/content/who.test.ts`

**Interfaces:**

- Consumes: `zod` 4.6.7
- Produces: `WHO_FILES`, `readLmsRows(path): Promise<LmsRow[]>`; `LmsRow = [day, l, m, s]`, `WHO_LAST_DAY = 1856`, `WhoTableSchema`, `WhoTable`, `loadWhoTable(indicator, sex): Promise<WhoTable>`, `whoSex(sex): WhoSex`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m18.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `af1674a docs: device checklist steps 10 and 11 for emergency info and wake reminders`.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/content/who.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadWhoTable, WHO_LAST_DAY, whoSex } from "./who";

const TABLES = [
  ["wfa", "boys"],
  ["wfa", "girls"],
  ["lhfa", "boys"],
  ["lhfa", "girls"],
  ["hcfa", "boys"],
  ["hcfa", "girls"],
] as const;

describe("content/who/*.json (spec §7.3, §10.2)", () => {
  it("each table has its source, review date and one LMS row per day 0..1856", async () => {
    for (const [indicator, sex] of TABLES) {
      const table = await loadWhoTable(indicator, sex);
      expect(table.indicator).toBe(indicator);
      expect(table.sex).toBe(sex);
      expect(table.source).toMatch(/^https:\/\/cdn\.who\.int\/.+\.xlsx$/);
      expect(table.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(table.rows.map((r) => r[0])).toEqual(
        Array.from({ length: WHO_LAST_DAY + 1 }, (_, i) => i),
      );
    }
  });

  it("maps babies.sex to the table names", () => {
    expect(whoSex("female")).toBe("girls");
    expect(whoSex("male")).toBe("boys");
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/content/who.test.ts`
Expected: FAIL — `Error: Cannot find module './who' imported from …/lib/content/who.test.ts`.

- [ ] **Step 4: Thêm `exceljs` (dev)**

Run: `bun add -d --exact exceljs@4.4.0 && grep -n '"exceljs"' package.json`
Expected: `installed exceljs@4.4.0`; `package.json` có `"exceljs": "4.4.0",` trong `devDependencies`.

- [ ] **Step 5: Viết `lib/content/who.ts`**

```ts
import { z } from "zod";

export type WhoIndicator = "wfa" | "lhfa" | "hcfa";
export type WhoSex = "boys" | "girls";

export const WHO_LAST_DAY = 1856;

export type LmsRow = [day: number, l: number, m: number, s: number];

export const WhoTableSchema = z
  .object({
    indicator: z.enum(["wfa", "lhfa", "hcfa"]),
    sex: z.enum(["boys", "girls"]),
    unit: z.enum(["kg", "cm"]),
    source: z.url(),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    // [day, L, M, S] for every day 0..1856.
    rows: z
      .array(
        z.tuple([
          z.number().int().min(0),
          z.number(),
          z.number().positive(),
          z.number().positive(),
        ]),
      )
      .length(WHO_LAST_DAY + 1),
  })
  .strict();

export type WhoTable = z.infer<typeof WhoTableSchema>;

// One chunk per table, loaded only by the pages that draw it (each is ~50 KB).
const LOADERS: Record<`${WhoIndicator}_${WhoSex}`, () => Promise<unknown>> = {
  wfa_boys: () => import("@/content/who/wfa_boys.json"),
  wfa_girls: () => import("@/content/who/wfa_girls.json"),
  lhfa_boys: () => import("@/content/who/lhfa_boys.json"),
  lhfa_girls: () => import("@/content/who/lhfa_girls.json"),
  hcfa_boys: () => import("@/content/who/hcfa_boys.json"),
  hcfa_girls: () => import("@/content/who/hcfa_girls.json"),
};

export async function loadWhoTable(
  indicator: WhoIndicator,
  sex: WhoSex,
): Promise<WhoTable> {
  const mod = (await LOADERS[`${indicator}_${sex}`]()) as { default: unknown };
  return WhoTableSchema.parse(mod.default);
}

// babies.sex is "male" | "female"; the WHO tables are named boys / girls.
export const whoSex = (sex: string): WhoSex =>
  sex === "female" ? "girls" : "boys";
```

- [ ] **Step 6: Viết `scripts/build-who.ts`**

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { LmsRow } from "@/lib/content/who";

// Spec §7.3: WHO Child Growth Standards, expanded LMS tables by day of age 0–1856.
const CDN =
  "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators";

export const WHO_FILES = [
  {
    indicator: "wfa",
    sex: "boys",
    unit: "kg",
    url: `${CDN}/weight-for-age/expanded-tables/wfa-boys-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "wfa",
    sex: "girls",
    unit: "kg",
    url: `${CDN}/weight-for-age/expanded-tables/wfa-girls-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "lhfa",
    sex: "boys",
    unit: "cm",
    url: `${CDN}/length-height-for-age/expandable-tables/lhfa-boys-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "lhfa",
    sex: "girls",
    unit: "cm",
    url: `${CDN}/length-height-for-age/expandable-tables/lhfa-girls-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "hcfa",
    sex: "boys",
    unit: "cm",
    url: `${CDN}/head-circumference-for-age/expanded-tables/hcfa-boys-zscore-expanded-tables.xlsx`,
  },
  {
    indicator: "hcfa",
    sex: "girls",
    unit: "cm",
    url: `${CDN}/head-circumference-for-age/expanded-tables/hcfa-girls-zscore-expanded-tables.xlsx`,
  },
] as const;

const num = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new Error(`not a number: ${String(value)}`);
  return n;
};

// Reads the first sheet: header "Day, L, M, S, …", one row per day.
export async function readLmsRows(path: string): Promise<LmsRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const sheet = workbook.worksheets[0];
  const header = (sheet.getRow(1).values as unknown[]).slice(1, 5);
  if (header.join(",") !== "Day,L,M,S")
    throw new Error(`${path}: unexpected header ${header.join(",")}`);
  const rows: LmsRow[] = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const [day, l, m, s] = (row.values as unknown[]).slice(1, 5).map(num);
    rows.push([day, l, m, s]);
  });
  rows.forEach(([day], i) => {
    if (day !== i) throw new Error(`${path}: day ${day} at row ${i}`);
  });
  return rows;
}

// Usage: bun scripts/build-who.ts <folder with the six .xlsx files> <reviewedAt YYYY-MM-DD>
if (process.argv[1]?.endsWith("build-who.ts")) {
  const [from, reviewedAt] = process.argv.slice(2);
  if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt ?? ""))
    throw new Error(
      "usage: bun scripts/build-who.ts <xlsx folder> <YYYY-MM-DD>",
    );
  mkdirSync("content/who", { recursive: true });
  for (const file of WHO_FILES) {
    const rows = await readLmsRows(
      join(from, file.url.split("/").pop() as string),
    );
    const out = `content/who/${file.indicator}_${file.sex}.json`;
    const { indicator, sex, unit, url } = file;
    const table = { indicator, sex, unit, source: url, reviewedAt, rows };
    writeFileSync(out, `${JSON.stringify(table)}\n`);
    console.log(`${out}: ${rows.length} days`);
  }
}
```

- [ ] **Step 7: Tải 6 file của WHO (ngoài repo)**

```bash
mkdir -p /private/tmp/claude-501/who-xlsx && cd /private/tmp/claude-501/who-xlsx
B=https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators
for u in $B/weight-for-age/expanded-tables/wfa-{boys,girls}-zscore-expanded-tables.xlsx \
         $B/length-height-for-age/expandable-tables/lhfa-{boys,girls}-zscore-expanded-tables.xlsx \
         $B/head-circumference-for-age/expanded-tables/hcfa-{boys,girls}-zscore-expanded-tables.xlsx; do
  curl -sfL -o "$(basename "$u")" "$u" && echo "ok $(basename "$u") $(wc -c < "$(basename "$u")")"
done
cd -
```

Expected: 6 dòng `ok …`, mỗi file khoảng 185–200 KB (`wfa-boys…` 198984, `wfa-girls…` 197671, `lhfa-boys…` 200151, `lhfa-girls…` 199890, `hcfa-boys…` 185962, `hcfa-girls…` 186723 byte). Nếu một link trả lỗi, dừng và báo lại; không tìm file từ nguồn khác.

- [ ] **Step 8: Sinh bảng JSON**

Run: `bun scripts/build-who.ts /private/tmp/claude-501/who-xlsx 2026-11-14 && shasum -a 256 content/who/*.json`
Expected: 6 dòng `content/who/<bảng>.json: 1857 days`, rồi đúng các mã băm sau (cùng file WHO thì ra cùng kết quả):

```
f049da425c52413cb9ea54bcf5ac7669b75c96286ac0c5bdee2503cb4e050cd2  content/who/hcfa_boys.json
8fad89e1d0cac9a9cfa120e56ee68a89c004c9a2b0b797ad4ded8091492ca6af  content/who/hcfa_girls.json
3611a2d566632a704eb7a386534d023c7161eb1dfc51a303997e487daeacfc14  content/who/lhfa_boys.json
696a4762b5c2d9ec13c3878a5481cf36ce4951bcafd40816a438ad72514a1a2b  content/who/lhfa_girls.json
128646455a185e73c9f3e7d66e1c668eb269ac0a317116da635e0eb9a38cbccb  content/who/wfa_boys.json
14d46c834c520bfe51b2b5ffdd7ad43acf7c3e154a9eab16fad4413e5d2a94a5  content/who/wfa_girls.json
```

- [ ] **Step 9: Chạy test để thấy đạt**

Run: `bunx vitest run lib/content/who.test.ts && bun run typecheck`
Expected: PASS — `Tests  2 passed (2)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 10: Ghi cách tạo lại bảng vào `README.md`**

```diff
--- a/README.md
+++ b/README.md
@@ -16,6 +16,15 @@
 bun run test        # Vitest cho lib/rules và scripts
 bun run db:start    # cần OrbStack/Docker đang chạy
 bun run db:test     # pgTAP cho schema và RLS
+```
+
+## Bảng tăng trưởng WHO
+
+`content/who/*.json` (bảng LMS theo ngày tuổi 0–1856) được tạo một lần từ 6 file "expanded tables" z-score của WHO, link trong `WHO_FILES` (`scripts/build-who.ts`). Chỉ cần tạo lại khi WHO đổi bảng:
+
+```bash
+mkdir -p /tmp/who-xlsx   # tải 6 file .xlsx theo link trong WHO_FILES vào đây
+bun scripts/build-who.ts /tmp/who-xlsx 2026-11-14   # ngày rà soát ghi vào reviewedAt
 ```
 
 ## Thiết lập lần đầu
```

- [ ] **Step 11: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m18.md package.json bun.lock scripts/build-who.ts content/who lib/content/who.ts lib/content/who.test.ts README.md && git commit -m "feat(growth): WHO LMS tables by day of age with build script"
```

---

### Task 2: Quy tắc tăng trưởng

**Files:**

- Create: `lib/rules/growth.ts`
- Test: `lib/rules/growth.test.ts`

**Interfaces:**

- Consumes: `LmsRow`, `loadWhoTable`, `WhoIndicator`, `WhoSex` (Task 1)
- Produces: `Lms`, `GrowthLevel`, `PERCENTILE_LINES`, `lmsAt(rows, day): Lms | null`, `zScore(lms, x)`, `valueAtZ(lms, z)`, `normalCdf(z)`, `percentile(z)`, `rateZ(z): { level; text }`, `ageOnDay(dob, day)`, `Assessment`, `assess(rows, dob, measuredOn, value): Assessment | null`, `CurvePoint`, `curve(rows, fromDay, toDay, step): CurvePoint[]`; `LmsRow` được export lại

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/growth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  loadWhoTable,
  type WhoIndicator,
  type WhoSex,
} from "@/lib/content/who";
import {
  ageOnDay,
  assess,
  curve,
  lmsAt,
  normalCdf,
  percentile,
  rateZ,
  valueAtZ,
  zScore,
  type LmsRow,
} from "./growth";

// Reference values copied from the SD columns of the WHO expanded tables:
// [day, z, value] — the z-score of that value must come back as z.
const REFERENCES: Record<
  `${WhoIndicator}_${WhoSex}`,
  [number, number, number][]
> = {
  wfa_boys: [
    [0, 2, 4.419],
    [183, -2, 6.357],
    [365, 1, 10.755],
  ],
  wfa_girls: [
    [0, 2, 4.23],
    [183, -2, 5.733],
    [365, 1, 10.129],
  ],
  lhfa_boys: [
    [0, 2, 53.67],
    [183, -2, 63.362],
    [365, 1, 78.115],
  ],
  lhfa_girls: [
    [0, 2, 52.873],
    [183, -2, 61.217],
    [365, 1, 76.58],
  ],
  hcfa_boys: [
    [0, 2, 37.002],
    [183, -2, 40.898],
    [365, 1, 47.348],
  ],
  hcfa_girls: [
    [0, 2, 36.247],
    [183, -2, 39.602],
    [365, 1, 46.253],
  ],
};

describe("zScore against WHO reference values (spec §10.2)", () => {
  for (const [key, cases] of Object.entries(REFERENCES)) {
    it(key, async () => {
      const [indicator, sex] = key.split("_") as [WhoIndicator, WhoSex];
      const { rows } = await loadWhoTable(indicator, sex);
      for (const [day, z, value] of cases) {
        const lms = lmsAt(rows as LmsRow[], day);
        expect(lms).not.toBeNull();
        expect(zScore(lms!, value)).toBeCloseTo(z, 2);
        expect(valueAtZ(lms!, z)).toBeCloseTo(value, 2);
      }
    });
  }
});

describe("LMS helpers", () => {
  it("handles L = 0 and round-trips valueAtZ", () => {
    const lms = { l: 0, m: 10, s: 0.1 };
    expect(zScore(lms, 10 * Math.exp(0.1))).toBeCloseTo(1, 10);
    expect(valueAtZ(lms, -1)).toBeCloseTo(10 * Math.exp(-0.1), 10);
    const skewed = { l: -0.3, m: 7.5, s: 0.12 };
    expect(zScore(skewed, valueAtZ(skewed, 1.7))).toBeCloseTo(1.7, 10);
  });

  it("lmsAt returns null outside 0..1856 and for fractional days", () => {
    const rows: LmsRow[] = [
      [0, 1, 3, 0.1],
      [1, 1, 3.1, 0.1],
    ];
    expect(lmsAt(rows, 1)).toEqual({ l: 1, m: 3.1, s: 0.1 });
    expect(lmsAt(rows, 2)).toBeNull();
    expect(lmsAt(rows, -1)).toBeNull();
    expect(lmsAt(rows, 0.5)).toBeNull();
  });

  it("percentile = Φ(z)·100", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(percentile(1.881)).toBeCloseTo(97, 1);
    expect(percentile(-1.036)).toBeCloseTo(15, 1);
    expect(percentile(-2)).toBeCloseTo(2.275, 2);
  });
});

describe("rateZ (spec §7.3)", () => {
  it("green to |z| = 2, yellow to 3, red beyond", () => {
    expect(rateZ(2)).toEqual({ level: "green", text: null });
    expect(rateZ(-2)).toEqual({ level: "green", text: null });
    expect(rateZ(2.01)).toEqual({
      level: "yellow",
      text: "Nên hỏi bác sĩ ở lần khám tới",
    });
    expect(rateZ(-3)).toEqual({
      level: "yellow",
      text: "Nên hỏi bác sĩ ở lần khám tới",
    });
    expect(rateZ(3.01)).toEqual({ level: "red", text: "Nên cho bé đi khám" });
  });
});

describe("assess", () => {
  const rows: LmsRow[] = Array.from({ length: 70 }, (_, day) => [
    day,
    1,
    5,
    0.1,
  ]);

  it("uses the age on the measurement day", () => {
    expect(ageOnDay("2026-09-14", "2026-11-14")).toBe(61);
    expect(assess(rows, "2026-09-14", "2026-11-14", 6)).toEqual({
      ageDays: 61,
      z: expect.closeTo(2, 10),
      percentile: expect.closeTo(97.725, 2),
      level: "green",
      text: null,
    });
  });

  it("returns null before birth, past the table, or for an empty value", () => {
    expect(assess(rows, "2026-09-14", "2026-09-13", 5)).toBeNull();
    expect(assess(rows, "2026-09-14", "2026-12-14", 5)).toBeNull();
    expect(assess(rows, "2026-09-14", "2026-10-14", 0)).toBeNull();
  });
});

describe("curve", () => {
  it("gives the five percentile lines every `step` days within the table", () => {
    const rows: LmsRow[] = Array.from({ length: 11 }, (_, day) => [
      day,
      1,
      10 + day,
      0.1,
    ]);
    const points = curve(rows, 0, 20, 5);
    expect(points.map((p) => p.day)).toEqual([0, 5, 10]);
    expect(points[1].P50).toBeCloseTo(15, 10);
    expect(points[1].P97).toBeCloseTo(15 * (1 + 0.1 * 1.881), 10);
    expect(points[1].P3).toBeCloseTo(15 * (1 - 0.1 * 1.881), 10);
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/growth.test.ts`
Expected: FAIL — `Error: Cannot find module './growth' imported from …/lib/rules/growth.test.ts`.

- [ ] **Step 3: Viết quy tắc**

Tạo `lib/rules/growth.ts`:

```ts
import type { LmsRow } from "@/lib/content/who";

export type { LmsRow };
export type Lms = { l: number; m: number; s: number };
export type GrowthLevel = "green" | "yellow" | "red";

const DAY_MS = 86_400_000;

// Spec §7.3: P3 / P15 / P50 / P85 / P97 lines.
export const PERCENTILE_LINES = [
  { label: "P3", z: -1.881 },
  { label: "P15", z: -1.036 },
  { label: "P50", z: 0 },
  { label: "P85", z: 1.036 },
  { label: "P97", z: 1.881 },
] as const;

export function lmsAt(rows: LmsRow[], day: number): Lms | null {
  const row = Number.isInteger(day) ? rows[day] : undefined;
  if (!row || row[0] !== day) return null;
  return { l: row[1], m: row[2], s: row[3] };
}

// z = ((X / M)^L − 1) / (L · S); when L = 0, z = ln(X / M) / S.
export function zScore(lms: Lms, x: number): number {
  if (lms.l === 0) return Math.log(x / lms.m) / lms.s;
  return ((x / lms.m) ** lms.l - 1) / (lms.l * lms.s);
}

// Inverse of zScore: the measurement at a given z (for the percentile lines).
export function valueAtZ(lms: Lms, z: number): number {
  if (lms.l === 0) return lms.m * Math.exp(lms.s * z);
  return lms.m * (1 + lms.l * lms.s * z) ** (1 / lms.l);
}

// Standard normal CDF via erf (Abramowitz & Stegun 7.1.26, error < 1.5e-7).
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export function percentile(z: number): number {
  return normalCdf(z) * 100;
}

export function rateZ(z: number): { level: GrowthLevel; text: string | null } {
  const size = Math.abs(z);
  if (size <= 2) return { level: "green", text: null };
  if (size <= 3)
    return { level: "yellow", text: "Nên hỏi bác sĩ ở lần khám tới" };
  return { level: "red", text: "Nên cho bé đi khám" };
}

// Spec §7.3: the table is read at the age on the measurement day, not today.
export function ageOnDay(dob: string, day: string): number {
  return Math.round(
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${dob}T00:00:00Z`)) / DAY_MS,
  );
}

export type Assessment = {
  ageDays: number;
  z: number;
  percentile: number;
  level: GrowthLevel;
  text: string | null;
};

export function assess(
  rows: LmsRow[],
  dob: string,
  measuredOn: string,
  value: number,
): Assessment | null {
  const days = ageOnDay(dob, measuredOn);
  const lms = lmsAt(rows, days);
  if (!lms || !(value > 0)) return null;
  const z = zScore(lms, value);
  return { ageDays: days, z, percentile: percentile(z), ...rateZ(z) };
}

export type CurvePoint = { day: number } & Record<
  (typeof PERCENTILE_LINES)[number]["label"],
  number
>;

export function curve(
  rows: LmsRow[],
  fromDay: number,
  toDay: number,
  step: number,
): CurvePoint[] {
  const points: CurvePoint[] = [];
  const every = Math.max(1, Math.floor(step));
  for (let day = Math.max(0, fromDay); day <= toDay; day += every) {
    const lms = lmsAt(rows, day);
    if (!lms) break;
    const point = { day } as CurvePoint;
    for (const line of PERCENTILE_LINES)
      point[line.label] = valueAtZ(lms, line.z);
    points.push(point);
  }
  return points;
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/growth.test.ts && bun run test && bun run typecheck`
Expected: PASS — file này `Tests  13 passed (13)`; cả bộ `Tests  231 passed (231)` (216 + 2 của Task 1 + 13); `tsc --noEmit` không in lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/growth.ts lib/rules/growth.test.ts && git commit -m "feat(growth): z-score, percentile, rating and percentile curves"
```

---

### Task 3: Bảng `growth` và đưa lên cloud

**Files:**

- Create: `supabase/migrations/20261114000600_growth.sql`
- Modify: `lib/supabase/types.ts` (sinh lại), `lib/supabase/rows.ts`
- Test: `supabase/tests/008_growth.test.sql`

**Interfaces:**

- Consumes: `public.babies`, `is_member`, `is_owner`, `baby_family`, `set_updated_at`, `forbid_immutable_change` (M1)
- Produces: bảng `public.growth(id, baby_id, measured_on, weight_g, length_cm, head_cm, created_by, created_at, updated_at)`; `GrowthRow = Tables["growth"]["Row"]`

- [ ] **Step 1: Viết test pgTAP thất bại**

Tạo `supabase/tests/008_growth.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000008', 'ga@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000008', 'gb@example.com'),
  ('cccccccc-0000-0000-0000-000000000008', 'gc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000008', 'Nhà G');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000008', 'ga@example.com', 'aaaaaaaa-0000-0000-0000-000000000008', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000008', 'gb@example.com', 'bbbbbbbb-0000-0000-0000-000000000008', 'member', 'Bà');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000008', 'Bé', '2026-09-14', 'female');
insert into public.growth (id, baby_id, measured_on, weight_g, created_by) values
  ('a0000000-0000-0000-0000-000000000008', 'ba000000-0000-0000-0000-000000000008', '2026-10-14', 4300, 'aaaaaaaa-0000-0000-0000-000000000008');

select throws_ok(
  $$ insert into public.growth (id, baby_id, measured_on, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000008', '2026-11-01', 'aaaaaaaa-0000-0000-0000-000000000008') $$,
  '23514', null, 'a measurement needs at least one value');
select throws_ok(
  $$ insert into public.growth (id, baby_id, measured_on, weight_g, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000008', '2026-11-01', 100, 'aaaaaaaa-0000-0000-0000-000000000008') $$,
  '23514', null, 'weight below 300 g is rejected');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000008","email":"gc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.growth', 'outsider sees no measurements');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000008","email":"gb@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.growth), 1, 'member sees the family''s measurements');
select lives_ok(
  $$ insert into public.growth (id, baby_id, measured_on, length_cm, head_cm)
     values ('b0000000-0000-0000-0000-000000000008', 'ba000000-0000-0000-0000-000000000008', '2026-11-14', 58.5, 39.0) $$,
  'member adds a measurement with a client id');
select is_empty(
  $$ update public.growth set weight_g = 4400 where id = 'a0000000-0000-0000-0000-000000000008' returning id $$,
  'member cannot edit the owner''s measurement');
select is_empty(
  $$ delete from public.growth where id = 'a0000000-0000-0000-0000-000000000008' returning id $$,
  'member cannot delete the owner''s measurement');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000008","email":"ga@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ update public.growth set head_cm = 39.5 where id = 'b0000000-0000-0000-0000-000000000008' returning id $$,
  'owner edits the member''s measurement');
select throws_ok(
  $$ update public.growth set baby_id = 'ba000000-0000-0000-0000-000000000099' where id = 'b0000000-0000-0000-0000-000000000008' $$,
  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');
reset role;
select is(
  (select weight_g from public.growth where id = 'a0000000-0000-0000-0000-000000000008'),
  4300,
  'the member''s edit and delete of the owner''s row had no effect');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `008_growth.test.sql` báo `relation "public.growth" does not exist`; `001`…`007` vẫn `ok`.

- [ ] **Step 3: Viết migration**

Tạo `supabase/migrations/20261114000600_growth.sql`:

```sql
-- Spec §5: id comes from the client (crypto.randomUUID()) so outbox retries never duplicate a row.
create table public.growth (
  id uuid primary key,
  baby_id uuid not null references public.babies (id) on delete cascade,
  measured_on date not null,
  weight_g int check (weight_g is null or weight_g between 300 and 40000),
  length_cm numeric(4, 1) check (length_cm is null or length_cm between 20 and 130),
  head_cm numeric(4, 1) check (head_cm is null or head_cm between 20 and 60),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (weight_g is not null or length_cm is not null or head_cm is not null)
);
create index growth_baby_measured_idx on public.growth (baby_id, measured_on desc);

create trigger growth_set_updated_at before update on public.growth
  for each row execute function public.set_updated_at();
create trigger growth_immutable before update on public.growth
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');

alter table public.growth enable row level security;

-- Spec §5.2: same rules as logs.
create policy growth_select on public.growth for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy growth_insert on public.growth for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy growth_update on public.growth for update to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  )
  with check (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
create policy growth_delete on public.growth for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001`…`007` `ok`, `008_growth.test.sql .. ok`, `All tests successful.`

- [ ] **Step 5: Sinh lại kiểu, thêm `GrowthRow`**

Run: `bun run db:types && grep -c '"growth"' lib/supabase/types.ts`
Expected: số đếm ≥ 1.

Thêm dòng cuối vào `lib/supabase/rows.ts`:

```ts
export type GrowthRow = Tables["growth"]["Row"];
```

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; `Tests  231 passed (231)`.

- [ ] **Step 6: Commit, đưa migration lên cloud, push**

```bash
git add supabase/migrations/20261114000600_growth.sql supabase/tests/008_growth.test.sql lib/supabase/types.ts lib/supabase/rows.ts && git commit -m "feat(growth): growth table with RLS"
```

Run: `bunx supabase db push --linked --yes && git push`
Expected: `Applying migration 20261114000600_growth.sql...`, `Finished supabase db push.`; push lên `origin/main`. Nếu CLI cần mật khẩu DB hoặc báo chưa link project, bỏ qua `db push`, vẫn `git push`, và ghi vào báo cáo cuối như việc người dùng tự làm. Không có thay đổi giao diện nên không cần kiểm deploy.

---

## Ngoài phạm vi M18

- **M19:** trang `/tang-truong` (nhập lần đo, ba biểu đồ P3–P97 có điểm của bé, z-score/phân vị/nhãn từng lần đo), lần đo đi qua outbox (§9), cân nặng gần nhất trong thẻ hồ sơ ở Khẩn cấp, checklist thiết bị.
