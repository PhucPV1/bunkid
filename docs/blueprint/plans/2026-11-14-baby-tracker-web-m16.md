# Baby Tracker Web — M16 (Đánh dấu mũi tiêm qua outbox và nhắc lịch tiêm) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Đánh dấu mũi tiêm chạy được khi mất mạng như nhật ký (spec §9: `vaccine_doses` đi qua outbox, có ⏳), và server gửi push "Sắp tới lịch tiêm" 3 ngày và 1 ngày trước mỗi mũi lúc 08:00–08:59 giờ VN (spec §8.3 dòng `vaccine`). Xong M16 là xong phần tiêm chủng của đợt 2 (§11: "nhận push vaccine thật trên ít nhất 1 máy").

**Architecture:**
- **Outbox (M12) thêm bảng thứ hai:** `OutboxEntry.table` nhận `"vaccine_doses"`. Mỗi mục mũi tiêm có `rowId = "code#doseNo"` (khóa tự nhiên, vì `id` do server sinh) và một trong ba thao tác: `upsert` (đánh dấu), `insert` (tick nhanh, giữ dòng đã có), `delete` (xóa đánh dấu). Không đổi schema Dexie: `table` không phải cột index.
- **Hiển thị lạc quan:** `applyDoseChange`/`overlayPendingDoses` (thuần, có test) cập nhật cache `["vaccine-doses", babyId]` ngay khi xếp hàng và phủ lại mục còn chờ sau mỗi lần tải. Các hàm của `logs` lọc theo `table` để hai bảng không lẫn.
- **Gửi:** `outboxDeps.send` rẽ theo `table`. Mũi tiêm dùng upsert theo `(baby_id, vaccine_code, dose_no)`, không gửi `id`. Bộ xả, phân loại lỗi và Web Locks của M12 giữ nguyên.
- **Nhắc tiêm:** `selectDueNotifications` thêm luật `vaccine` dùng `buildSchedule` (M14). `dispatchDeps.loadState` nạp thêm `dob`, `vaccine_choices`, `vaccine_doses` và công tắc `vaccine`. Route, cron và chống gửi trùng của M11 giữ nguyên.

**Tech Stack:** như M1–M15. Không thêm gói nào.

**Milestones của đợt phát hành 2:**
- M14, M15: xong (nội dung, quy tắc, bảng; trang `/tiem-chung`, bước vaccine khi khai báo bé).
- **M16 (plan này):** outbox cho mũi tiêm, push `vaccine`, checklist bước 9.
- Sau đó: thông tin khẩn cấp và push `wake`; tăng trưởng WHO; phân loại triệu chứng và bài bệnh thường gặp.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Thao tác nào đi qua outbox:** "Lưu" và "Xóa đánh dấu" trong `DoseSheet`, và các mũi tick nhanh trong `VaccineSetup`. Lựa chọn loại vaccine vẫn ghi thẳng vào `babies` và cần mạng (§9: hồ sơ bé không qua outbox), nên `VaccineSetup` và phần chọn loại vẫn nằm trong `OnlineOnly`; `DoseSheet` bỏ `OnlineOnly`.
- **Thứ tự trong thiết lập:** xếp các mũi tick nhanh vào outbox trước, rồi mới lưu lựa chọn (như M15, để lỗi lưu lựa chọn vẫn hiện trong khối thiết lập).
- **Gửi một mục mũi tiêm:**
  - `upsert`: `upsert({ baby_id, vaccine_code, dose_no, status, given_on, due_on_override, place, note }, { onConflict: "baby_id,vaccine_code,dose_no" }).select("id")`; 0 dòng → lỗi vĩnh viễn "Bạn không có quyền thực hiện thao tác này".
  - `insert`: như trên với `ignoreDuplicates: true` và chỉ `status`, nên mũi đã có người đánh dấu giữ nguyên.
  - `delete`: xóa theo khóa tự nhiên kèm `.select("id")`; 0 dòng thì đọc lại, dòng đã không còn (máy khác xóa rồi) coi là xong, còn thì báo lỗi quyền — giống `logs` ở M12.
  - Mục có `op` không hợp lệ cho bảng (ví dụ `upsert` của `logs`) trả lỗi 400 → bị bỏ với lý do "Dữ liệu không hợp lệ". Thực tế không xảy ra.
- **Dòng tạm trong cache:** mũi mới đánh dấu khi chưa đồng bộ có `id` = id của mục outbox. Khi tải lại, dòng thật từ server thay thế (overlay khớp theo `code#doseNo`, không theo `id`).
- **Làm mới sau khi xả:** `OutboxSync` (M12) tải lại `["vaccine-doses"]` cùng `["logs"]` mỗi khi có mục được gửi hoặc bị bỏ, nên mục bị từ chối được hoàn tác trên màn hình. Trang chủ và Nhật ký chỉ lấy dấu ⏳ từ mục `logs`.
- **Tag riêng mỗi mũi** là chỗ cố ý khác spec, ghi ở dòng `tag` bên dưới.
- **Dấu ⏳:** `VaccineScreen` lấy `useOutboxEntries(userId)`, lọc `table = "vaccine_doses"`, rồi dùng `pendingRowIds` (M13) với khóa `code#doseNo`. Chip "N mục chờ đồng bộ" của M13 đếm mọi mục, nên tự tính cả mũi tiêm.
- **Luật `vaccine` (§8.3):**
  - Chỉ chạy khi giờ VN là 08 (`formatVnTime(now)` bắt đầu bằng `"08"`).
  - Mũi chưa `done`/`skipped`, không thuộc nhóm chưa chọn loại, và `due` = hôm nay + 3 (`D3`) hoặc hôm nay + 1 (`D1`) theo ngày VN; `due` lấy từ `buildSchedule`, nên ngày đã đổi (`rescheduled`) được dùng.
  - Người nhận: thành viên có đăng ký push và công tắc "Nhắc lịch tiêm" bật (không có dòng `notification_prefs` = bật). Bỏ qua tạm tắt.
  - `refKey` = `vax:<babyId>:<code>:<doseNo>:D3` hoặc `:D1`. `title` = "Sắp tới lịch tiêm". `body` = "`<dose.name>` vào `<Thứ, dd/MM>`." — tên mũi trong nội dung đã có số mũi (ví dụ "6 trong 1 mũi 2"), nên không ghép thêm "mũi <n>". `url` = `/tiem-chung`.
  - `tag` = `vaccine:<babyId>:<code>:<doseNo>` (spec ghi `<kind>:<babyId>`): mốc 2 tháng có tới 4 mũi cùng ngày, tag chung sẽ làm thông báo sau đè mất thông báo trước.
  - Cron chạy mỗi phút từ 08:00 đến 08:59; `notification_log` (M11) giữ mỗi `refKey` chỉ gửi một lần.
- **Công tắc:** bỏ dòng "Có từ đợt 2" dưới "Nhắc lịch tiêm" trong Cài đặt. "Nhắc khi bé thức quá lâu" vẫn ghi "Có từ đợt 2" (push `wake` làm sau).
- **Bước của người dùng:** checklist bước 9 cần điện thoại thật và đợi tới 08:00 hôm sau; người dùng đã cho phép trước rằng việc chỉ họ làm được thì ghi là đang chờ, không đánh dấu Đạt.

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

Riêng M16:

- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/pushSelection.ts` (tiêu đề, nội dung nhắc tiêm) phải đúng từng ký tự như plan này (có test khóa lại).
- Không đổi schema Dexie (`version(2)` giữ nguyên). Không thêm migration.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410` tới commit cuối của M15):

- M12–M13: `OutboxEntry`, `applyLogChange`, `overlayPending`, `pendingRowIds` (`lib/data/outboxCore.ts`); `enqueueLogChange`, `withPending`, `nextCreatedAt` (`lib/data/outbox.ts`); `outboxDeps` (`lib/data/outboxDeps.ts`); `flushOutbox`; `useOutboxEntries`; `PendingMark`
- M11: `selectDueNotifications`, `BabyDispatchState`, `Recipient`, `DueNotification` (`lib/rules/pushSelection.ts`); `supabaseDispatchDeps` (`lib/server/dispatchDeps.ts`); job `push-dispatch`
- M14: `VACCINES`, `VaccineDose`, `buildSchedule`, `DoseRecord`
- M15: `parseChoices`, `toDoseRecords`, `DosePatch` (`lib/rules/vaccineForm.ts`); `lib/data/vaccines.ts`; `components/vaccines/*`; `/tiem-chung`; `/khai-bao-be` bước 2; `WEEKDAYS` (`lib/rules/days.ts`); checklist bước 8

**Produces** (các milestone sau dùng):

- `OutboxEntry.table: "logs" | "vaccine_doses"`, `OutboxOp` thêm `"upsert"`; `entriesFor(entries, table)`, `applyDoseChange`, `overlayPendingDoses` (`lib/data/outboxCore.ts`)
- `DoseChange`, `vaccineDosesKey(babyId)`, `enqueueDoseChange(queryClient, change)`, `withPendingDoses(babyId, rows)` (`lib/data/outbox.ts`). M17+ dùng cùng cách cho `growth` và `milestones_achieved`.
- `useDoseActions(babyId, userId)`, `useVaccineSetup(babyId, userId)`; `VaccineScreen({ baby, userId, isOwner })`, `VaccineSetup` thêm prop `userId`, `DoseSheet` thêm prop `userId`, `DoseLine` thêm prop `pending`
- `BabyDispatchState.vaccine: { dob, choices, records } | null`, `Recipient.prefs.vaccine: boolean`; `selectDueNotifications(babies, now, vaccineDoses = VACCINES.doses)`. Push `wake` sẽ thêm luật vào cùng hàm.
- Checklist bước 9; bước 7 trỏ phần nhắc tiêm sang bước 9

## File Structure

```
lib/data/outboxCore.ts (+ outboxDoses.test.ts)   # bảng vaccine_doses trong outbox, overlay mũi tiêm
lib/data/outbox.ts                       # enqueueDoseChange, withPendingDoses
lib/data/outboxDeps.ts                   # gửi mục mũi tiêm
lib/data/vaccines.ts                     # đánh dấu và tick nhanh qua outbox
components/vaccines/DoseSheet.tsx, DoseLine.tsx, VaccineSetup.tsx, VaccineScreen.tsx   # userId, ⏳, bỏ OnlineOnly ở sheet
app/tiem-chung/page.tsx, app/khai-bao-be/page.tsx   # truyền userId
lib/rules/pushSelection.ts (+ test)      # luật vaccine §8.3
lib/server/dispatchDeps.ts, lib/server/dispatch.test.ts   # nạp dữ liệu tiêm cho dispatch
lib/rules/notifications.ts               # bỏ "Có từ đợt 2" ở nhắc tiêm
docs/device-checklist.md                 # bước 7 sửa, thêm bước 9
```

## Tasks

1. Outbox hiểu mũi tiêm
2. Đánh dấu mũi tiêm qua outbox
3. Luật nhắc tiêm và dữ liệu cho dispatch
4. Checklist bước 9 và deploy

---

### Task 1: Outbox hiểu mũi tiêm

**Files:**

- Modify: `lib/data/outboxCore.ts`
- Test: `lib/data/outboxDoses.test.ts`

**Interfaces:**

- Consumes: `VaccineDoseRow` (`lib/supabase/rows.ts`, M15); `OutboxEntry`, `applyLogChange`, `overlayPending` (M12)
- Produces:
  - `type OutboxOp = "insert" | "update" | "delete" | "stop" | "upsert"`; `OutboxEntry.table: "logs" | "vaccine_doses"`
  - `entriesFor(entries, table): OutboxEntry[]`
  - `applyDoseChange(rows: VaccineDoseRow[], entry, nowIso): VaccineDoseRow[]` — khớp dòng theo `"vaccine_code#dose_no"` = `entry.rowId`
  - `overlayPendingDoses(rows, entries, nowIso): VaccineDoseRow[]` — chỉ dùng mục `vaccine_doses`, theo `createdAt`
  - `overlayPending` (logs) bỏ qua mục `vaccine_doses`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m16.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là commit `docs:` checklist bước 8 của M15.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/data/outboxDoses.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
import {
  applyDoseChange,
  entriesFor,
  overlayPending,
  overlayPendingDoses,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-15T03:00:00.000Z";

function dose(
  op: OutboxEntry["op"],
  key: string,
  data: Record<string, unknown>,
  createdAt = 1,
): OutboxEntry {
  return {
    id: `e-${key}-${createdAt}`,
    table: "vaccine_doses",
    op,
    rowId: key,
    babyId: "b1",
    userId: "u1",
    row: data,
    createdAt,
    attempts: 0,
  };
}

const server: VaccineDoseRow = {
  id: "server-1",
  baby_id: "b1",
  vaccine_code: "bcg",
  dose_no: 1,
  status: "done",
  given_on: "2026-09-14",
  due_on_override: null,
  place: "Bệnh viện",
  note: null,
  created_by: "u0",
  created_at: "2026-09-14T03:00:00.000Z",
  updated_at: "2026-09-14T03:00:00.000Z",
};

const marked = {
  vaccine_code: "hexa",
  dose_no: 1,
  status: "done",
  given_on: "2026-11-14",
  due_on_override: null,
  place: null,
  note: null,
};

describe("applyDoseChange", () => {
  it("upsert adds a new row, then merges into it", () => {
    const added = applyDoseChange(
      [server],
      dose("upsert", "hexa#1", marked),
      NOW,
    );
    expect(added).toHaveLength(2);
    expect(added[1]).toMatchObject({
      id: "e-hexa#1-1",
      baby_id: "b1",
      vaccine_code: "hexa",
      dose_no: 1,
      status: "done",
      created_by: "u1",
    });
    const skipped = applyDoseChange(
      [server],
      dose("upsert", "bcg#1", {
        vaccine_code: "bcg",
        dose_no: 1,
        status: "skipped",
        given_on: null,
      }),
      NOW,
    );
    expect(skipped).toEqual([
      { ...server, status: "skipped", given_on: null, updated_at: NOW },
    ]);
  });

  it("insert (quick tick) keeps a row that already exists", () => {
    const tick = dose("insert", "bcg#1", {
      vaccine_code: "bcg",
      dose_no: 1,
      status: "done",
    });
    expect(applyDoseChange([server], tick, NOW)).toEqual([server]);
    expect(applyDoseChange([], tick, NOW)[0]).toMatchObject({
      vaccine_code: "bcg",
      status: "done",
      given_on: null,
    });
  });

  it("delete removes the row by its dose key", () => {
    expect(
      applyDoseChange(
        [server],
        dose("delete", "bcg#1", { vaccine_code: "bcg", dose_no: 1 }),
        NOW,
      ),
    ).toEqual([]);
  });
});

describe("overlays keep tables apart", () => {
  it("overlayPendingDoses applies dose entries in order and ignores log entries", () => {
    const log: OutboxEntry = {
      ...dose("delete", "bcg#1", {}, 0),
      table: "logs",
    };
    const rows = overlayPendingDoses(
      [server],
      [
        dose("delete", "bcg#1", { vaccine_code: "bcg", dose_no: 1 }, 3),
        dose("upsert", "bcg#1", { ...marked, vaccine_code: "bcg" }, 2),
        log,
      ],
      NOW,
    );
    expect(rows).toEqual([]);
  });

  it("overlayPending for logs ignores vaccine entries", () => {
    const logRow = { id: "bcg#1" } as LogRow;
    const vaccine = dose("delete", "bcg#1", {
      vaccine_code: "bcg",
      dose_no: 1,
    });
    expect(overlayPending([logRow], [vaccine], () => true, NOW)).toEqual([
      logRow,
    ]);
    expect(entriesFor([vaccine], "logs")).toEqual([]);
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/data/outboxDoses.test.ts`
Expected: FAIL — 5 test hỏng: 4 test báo `TypeError: applyDoseChange is not a function` (hoặc `overlayPendingDoses`), test "overlayPending for logs ignores vaccine entries" báo `AssertionError: expected [] to deeply equal [ { id: 'bcg#1' } ]`.

- [ ] **Step 4: Sửa `lib/data/outboxCore.ts`**

```diff
--- a/lib/data/outboxCore.ts
+++ b/lib/data/outboxCore.ts
@@ -1,15 +1,19 @@
-import type { LogRow } from "@/lib/supabase/rows";
-
-export type OutboxOp = "insert" | "update" | "delete" | "stop";
+import type { LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
+
+// logs: insert / update / delete / stop by row id.
+// vaccine_doses: upsert (mark a dose) / insert (quick tick, keeps an existing row) /
+// delete (clear the mark), keyed by "code#doseNo" because the row id is the server's.
+export type OutboxOp = "insert" | "update" | "delete" | "stop" | "upsert";
 
 export type OutboxEntry = {
   id: string;
-  table: "logs";
+  table: "logs" | "vaccine_doses";
   op: OutboxOp;
   rowId: string;
   babyId: string;
   userId: string;
-  // insert: the new row; update: the changed columns; stop: { ended_at }; delete: null
+  // logs — insert: the new row; update: the changed columns; stop: { ended_at }; delete: null.
+  // vaccine_doses — always { vaccine_code, dose_no, ... } plus the marked columns.
   row: Record<string, unknown> | null;
   createdAt: number;
   attempts: number;
@@ -83,6 +87,9 @@
         .sort(byNewest);
     case "delete":
       return rows.filter((r) => r.id !== entry.rowId);
+    case "upsert":
+      // Only vaccine_doses entries use upsert.
+      return rows;
     case "stop": {
       const endedAt = String(entry.row?.ended_at);
       return rows.map((r) =>
@@ -136,7 +143,7 @@
   inRange: (row: LogRow) => boolean,
   nowIso: string,
 ): LogRow[] {
-  return [...entries]
+  return [...entriesFor(entries, "logs")]
     .sort((a, b) => a.createdAt - b.createdAt)
     .reduce(
       (acc, entry) =>
@@ -151,3 +158,58 @@
 export function pendingRowIds(entries: OutboxEntry[]): Set<string> {
   return new Set(entries.map((entry) => entry.rowId));
 }
+
+// Entries of one table, for overlays and pending marks that must not mix tables.
+export function entriesFor(
+  entries: OutboxEntry[],
+  table: OutboxEntry["table"],
+): OutboxEntry[] {
+  return entries.filter((entry) => entry.table === table);
+}
+
+const doseKeyOf = (row: { vaccine_code: string; dose_no: number }) =>
+  `${row.vaccine_code}#${row.dose_no}`;
+
+export function applyDoseChange(
+  rows: VaccineDoseRow[],
+  entry: OutboxEntry,
+  nowIso: string,
+): VaccineDoseRow[] {
+  const existing = rows.find((row) => doseKeyOf(row) === entry.rowId);
+  if (entry.op === "delete")
+    return rows.filter((row) => doseKeyOf(row) !== entry.rowId);
+  if (entry.op === "insert" && existing) return rows;
+  const patch = (entry.row ?? {}) as Partial<VaccineDoseRow>;
+  if (existing)
+    return rows.map((row) =>
+      row === existing ? { ...row, ...patch, updated_at: nowIso } : row,
+    );
+  return [
+    ...rows,
+    {
+      id: entry.id,
+      baby_id: entry.babyId,
+      vaccine_code: String(patch.vaccine_code),
+      dose_no: Number(patch.dose_no),
+      status: String(patch.status),
+      given_on: patch.given_on ?? null,
+      due_on_override: patch.due_on_override ?? null,
+      place: patch.place ?? null,
+      note: patch.note ?? null,
+      created_by: entry.userId,
+      created_at: nowIso,
+      updated_at: nowIso,
+    },
+  ];
+}
+
+// Fresh server rows plus the dose marks still waiting in the outbox.
+export function overlayPendingDoses(
+  rows: VaccineDoseRow[],
+  entries: OutboxEntry[],
+  nowIso: string,
+): VaccineDoseRow[] {
+  return [...entriesFor(entries, "vaccine_doses")]
+    .sort((a, b) => a.createdAt - b.createdAt)
+    .reduce((acc, entry) => applyDoseChange(acc, entry, nowIso), rows);
+}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/data && bun run typecheck`
Expected: PASS — mọi test trong `lib/data` xanh (có 5 test mới của `outboxDoses.test.ts`). `tsc --noEmit` báo đúng một lỗi ở `lib/data/outboxDeps.ts` (`Function lacks ending return statement…`, vì `send` chưa có nhánh `upsert`); Task 2 sửa lỗi này.

- [ ] **Step 6: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m16.md lib/data/outboxCore.ts lib/data/outboxDoses.test.ts && git commit -m "feat(offline): outbox entries for vaccine doses with optimistic overlay"
```

---

### Task 2: Đánh dấu mũi tiêm qua outbox

**Files:**

- Modify: `lib/data/outboxDeps.ts`, `lib/data/outbox.ts`, `lib/data/vaccines.ts`, `components/sync/OutboxSync.tsx`, `components/home/HomeScreen.tsx`, `components/history/HistoryScreen.tsx`, `components/vaccines/DoseSheet.tsx`, `components/vaccines/DoseLine.tsx`, `components/vaccines/VaccineSetup.tsx`, `components/vaccines/VaccineScreen.tsx`, `app/tiem-chung/page.tsx`, `app/khai-bao-be/page.tsx`

**Interfaces:**

- Consumes: Task 1; `nextCreatedAt`, `flushRequests` (M12); `useOutboxEntries`, `PendingMark`, `pendingRowIds` (M13)
- Produces:
  - `type DoseChange = { op: "upsert" | "insert" | "delete"; babyId; userId; code; doseNo; marks? }`
  - `vaccineDosesKey(babyId) = ["vaccine-doses", babyId]`; `enqueueDoseChange(queryClient, change): Promise<void>`; `withPendingDoses(babyId, rows): Promise<VaccineDoseRow[]>`
  - `useDoseActions(babyId, userId)`, `useVaccineSetup(babyId, userId)` (mutation `networkMode: "always"` cho đánh dấu)
  - Props mới: `VaccineScreen.userId`, `DoseSheet.userId`, `VaccineSetup.userId`, `DoseLine.pending`

- [ ] **Step 1: Gửi mục mũi tiêm (`lib/data/outboxDeps.ts`)**

```diff
--- a/lib/data/outboxDeps.ts
+++ b/lib/data/outboxDeps.ts
@@ -23,7 +23,12 @@
   };
 }
 
-async function send(entry: OutboxEntry): Promise<SendOutcome> {
+const UNSUPPORTED: SendOutcome = {
+  ok: false,
+  failure: { status: 400, code: null, message: "unsupported outbox entry" },
+};
+
+async function sendLog(entry: OutboxEntry): Promise<SendOutcome> {
   const sb = supabase();
   const row = entry.row ?? {};
   switch (entry.op) {
@@ -76,7 +81,80 @@
       });
       return result.error ? failed(result) : { ok: true };
     }
+    case "upsert":
+      return UNSUPPORTED;
   }
+}
+
+const DOSE_CONFLICT = "baby_id,vaccine_code,dose_no";
+
+// Spec §9: upsert on the natural key and never send id, so the update branch
+// keeps the server's primary key.
+async function sendDose(entry: OutboxEntry): Promise<SendOutcome> {
+  const sb = supabase();
+  const row = entry.row ?? {};
+  const key = {
+    baby_id: entry.babyId,
+    vaccine_code: String(row.vaccine_code),
+    dose_no: Number(row.dose_no),
+  };
+  const marks = {
+    status: String(row.status),
+    given_on: (row.given_on as string | null | undefined) ?? null,
+    due_on_override: (row.due_on_override as string | null | undefined) ?? null,
+    place: (row.place as string | null | undefined) ?? null,
+    note: (row.note as string | null | undefined) ?? null,
+  };
+  switch (entry.op) {
+    case "upsert": {
+      const result = await sb
+        .from("vaccine_doses")
+        .upsert({ ...key, ...marks }, { onConflict: DOSE_CONFLICT })
+        .select("id");
+      if (result.error) return failed(result);
+      return result.data.length > 0
+        ? { ok: true }
+        : { ok: false, failure: { zeroRows: true } };
+    }
+    case "insert": {
+      // Quick tick: a dose someone already marked keeps its mark.
+      const result = await sb
+        .from("vaccine_doses")
+        .upsert(
+          { ...key, status: marks.status },
+          { onConflict: DOSE_CONFLICT, ignoreDuplicates: true },
+        );
+      return result.error ? failed(result) : { ok: true };
+    }
+    case "delete": {
+      const result = await sb
+        .from("vaccine_doses")
+        .delete()
+        .eq("baby_id", key.baby_id)
+        .eq("vaccine_code", key.vaccine_code)
+        .eq("dose_no", key.dose_no)
+        .select("id");
+      if (result.error) return failed(result);
+      if (result.data.length > 0) return { ok: true };
+      // 0 rows: already cleared on another device counts as done.
+      const check = await sb
+        .from("vaccine_doses")
+        .select("id")
+        .eq("baby_id", key.baby_id)
+        .eq("vaccine_code", key.vaccine_code)
+        .eq("dose_no", key.dose_no);
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
+function send(entry: OutboxEntry): Promise<SendOutcome> {
+  return entry.table === "vaccine_doses" ? sendDose(entry) : sendLog(entry);
 }
 
 export function outboxDeps(): FlushDeps {
```

- [ ] **Step 2: Xếp hàng và phủ mục chờ (`lib/data/outbox.ts`)**

```diff
--- a/lib/data/outbox.ts
+++ b/lib/data/outbox.ts
@@ -1,9 +1,15 @@
 "use client";
 
 import type { QueryClient } from "@tanstack/react-query";
-import type { LogRow } from "@/lib/supabase/rows";
+import type { LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
 import { localDb } from "./localDb";
-import { applyToCache, overlayPending, type OutboxEntry } from "./outboxCore";
+import {
+  applyDoseChange,
+  applyToCache,
+  overlayPending,
+  overlayPendingDoses,
+  type OutboxEntry,
+} from "./outboxCore";
 import { flushRequests } from "./outboxEvents";
 
 export type LogChange = Pick<
@@ -62,3 +68,53 @@
     return rows;
   }
 }
+
+export type DoseChange = Pick<OutboxEntry, "babyId" | "userId"> & {
+  op: "upsert" | "insert" | "delete";
+  code: string;
+  doseNo: number;
+  marks?: Record<string, unknown>;
+};
+
+export const vaccineDosesKey = (babyId: string) =>
+  ["vaccine-doses", babyId] as const;
+
+export async function enqueueDoseChange(
+  queryClient: QueryClient,
+  change: DoseChange,
+): Promise<void> {
+  const entry: OutboxEntry = {
+    id: crypto.randomUUID(),
+    table: "vaccine_doses",
+    op: change.op,
+    rowId: `${change.code}#${change.doseNo}`,
+    babyId: change.babyId,
+    userId: change.userId,
+    row: { vaccine_code: change.code, dose_no: change.doseNo, ...change.marks },
+    createdAt: await nextCreatedAt(),
+    attempts: 0,
+  };
+  await localDb().outbox.add(entry);
+  const key = vaccineDosesKey(change.babyId);
+  await queryClient.cancelQueries({ queryKey: key });
+  const nowIso = new Date().toISOString();
+  queryClient.setQueryData<VaccineDoseRow[]>(key, (rows) =>
+    rows ? applyDoseChange(rows, entry, nowIso) : rows,
+  );
+  flushRequests.emit();
+}
+
+export async function withPendingDoses(
+  babyId: string,
+  rows: VaccineDoseRow[],
+): Promise<VaccineDoseRow[]> {
+  try {
+    const entries = await localDb()
+      .outbox.where("babyId")
+      .equals(babyId)
+      .toArray();
+    return overlayPendingDoses(rows, entries, new Date().toISOString());
+  } catch {
+    return rows;
+  }
+}
```

- [ ] **Step 3: Làm mới cache mũi tiêm sau mỗi lần xả, tách dấu ⏳ của nhật ký**

Sau mỗi lần xả có mục được gửi hoặc bị bỏ, `OutboxSync` tải lại cả `["vaccine-doses"]`: mục bị server từ chối được hoàn tác trên màn hình (§9), dòng tạm được thay bằng dòng thật.

```diff
--- a/components/sync/OutboxSync.tsx
+++ b/components/sync/OutboxSync.tsx
@@ -44,6 +44,8 @@
         if (result && result.sent + result.dropped > 0) {
           void queryClient.invalidateQueries({ queryKey: ["logs"] });
           void queryClient.invalidateQueries({ queryKey: ["first-log"] });
+          // Also rolls back a refused dose mark (spec §9) and drops temporary rows.
+          void queryClient.invalidateQueries({ queryKey: ["vaccine-doses"] });
         }
       } catch (error) {
         console.warn("Không gửi được dữ liệu chờ đồng bộ", error);
```

```diff
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -11,7 +11,7 @@
   useTimerPress,
 } from "@/lib/data/logs";
 import { useLogsRealtime } from "@/lib/data/realtime";
-import { pendingRowIds } from "@/lib/data/outboxCore";
+import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
 import { useNow } from "@/lib/hooks/useNow";
 import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
 import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
@@ -54,7 +54,7 @@
   const members = useMembers(baby.family_id);
   const press = useTimerPress(baby.id, userId);
   const stop = useStopTimer(baby.id, userId);
-  const pending = pendingRowIds(useOutboxEntries(userId));
+  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
   const [sheet, setSheet] = useState<SheetState>(null);
 
   const rows = logs.data ?? [];
```

```diff
--- a/components/history/HistoryScreen.tsx
+++ b/components/history/HistoryScreen.tsx
@@ -6,7 +6,7 @@
 import { useHistoryLogs } from "@/lib/data/logs";
 import { useLogsRealtime } from "@/lib/data/realtime";
 import { PendingMark } from "@/components/sync/PendingMark";
-import { pendingRowIds } from "@/lib/data/outboxCore";
+import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
 import { useNow } from "@/lib/hooks/useNow";
 import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
 import { vnDayLabel } from "@/lib/rules/days";
@@ -37,7 +37,7 @@
   useLogsRealtime(baby.id);
   const history = useHistoryLogs(baby.id, baby.dob);
   const members = useMembers(baby.family_id);
-  const pending = pendingRowIds(useOutboxEntries(userId));
+  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
   const [filter, setFilter] = useState<HistoryFilter>("all");
   const [sheet, setSheet] = useState<SheetState>(null);
 
```

- [ ] **Step 4: Thay toàn bộ `lib/data/vaccines.ts`**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DosePatch } from "@/lib/rules/vaccineForm";
import { supabase } from "@/lib/supabase/client";
import type { VaccineDoseRow } from "@/lib/supabase/rows";
import { updateBaby } from "./baby";
import { enqueueDoseChange, vaccineDosesKey, withPendingDoses } from "./outbox";

export type DoseRef = { code: string; doseNo: number };

export function useVaccineDoses(babyId: string) {
  return useQuery({
    queryKey: vaccineDosesKey(babyId),
    queryFn: async (): Promise<VaccineDoseRow[]> => {
      const { data, error } = await supabase()
        .from("vaccine_doses")
        .select("*")
        .eq("baby_id", babyId);
      if (error) throw error;
      return withPendingDoses(babyId, data);
    },
    staleTime: 60_000,
  });
}

// Spec §9: dose marks go through the outbox, so they work offline and show ⏳.
// networkMode "always" lets these run offline.
export function useDoseActions(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return {
    save: useMutation({
      networkMode: "always",
      mutationFn: ({ ref, patch }: { ref: DoseRef; patch: DosePatch }) =>
        enqueueDoseChange(queryClient, {
          op: "upsert",
          babyId,
          userId,
          code: ref.code,
          doseNo: ref.doseNo,
          marks: patch,
        }),
    }),
    clear: useMutation({
      networkMode: "always",
      mutationFn: (ref: DoseRef) =>
        enqueueDoseChange(queryClient, {
          op: "delete",
          babyId,
          userId,
          code: ref.code,
          doseNo: ref.doseNo,
        }),
    }),
  };
}

// Owner only (spec §4.1). The quick-ticked doses ("done" without a date, spec
// §6.1) go through the outbox first; the series choices then need the network.
export function useVaccineSetup(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      choices: Record<string, string>;
      ticked: DoseRef[];
    }) => {
      for (const ref of input.ticked)
        await enqueueDoseChange(queryClient, {
          op: "insert",
          babyId,
          userId,
          code: ref.code,
          doseNo: ref.doseNo,
          marks: { status: "done" },
        });
      await updateBaby(babyId, { vaccine_choices: input.choices });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });
}

// Owner only (spec §4.1).
export function useUpdateChoices(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (choices: Record<string, string>) =>
      updateBaby(babyId, { vaccine_choices: choices }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });
}
```

- [ ] **Step 5: Sửa các component và trang**

```diff
--- a/components/vaccines/DoseSheet.tsx
+++ b/components/vaccines/DoseSheet.tsx
@@ -1,7 +1,6 @@
 "use client";
 
 import { useState, type FormEvent } from "react";
-import { OnlineOnly } from "@/components/OnlineOnly";
 import { toVietnameseError } from "@/lib/data/errors";
 import { useDoseActions } from "@/lib/data/vaccines";
 import { vnDateString } from "@/lib/rules/time";
@@ -24,16 +23,18 @@
   item,
   row,
   babyId,
+  userId,
   dob,
   onClose,
 }: {
   item: ScheduleItem;
   row: VaccineDoseRow | null;
   babyId: string;
+  userId: string;
   dob: string;
   onClose: () => void;
 }) {
-  const actions = useDoseActions(babyId);
+  const actions = useDoseActions(babyId, userId);
   const today = vnDateString(new Date());
   const ref = { code: item.dose.code, doseNo: item.dose.doseNo };
   const [raw, setRaw] = useState<DoseFormRaw>(() => {
@@ -106,77 +107,75 @@
         <p className="text-muted">
           Phòng: {item.dose.protects.join(", ")}. Hẹn {formatDueDate(item.due)}.
         </p>
-        <OnlineOnly>
-          <div className="flex flex-col gap-3">
-            <div role="radiogroup" className="flex gap-2">
-              {ACTIONS.map((action) => (
-                <label
-                  key={action.value}
-                  className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border px-2 text-center has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
-                >
-                  <input
-                    type="radio"
-                    name="dose-action"
-                    className="sr-only"
-                    checked={raw.action === action.value}
-                    onChange={() => chooseAction(action.value)}
-                  />
-                  {action.label}
-                </label>
-              ))}
-            </div>
-            {raw.action !== "skipped" && (
-              <label className="flex flex-col gap-1">
-                {raw.action === "done" ? "Ngày tiêm" : "Ngày hẹn mới"}
+        <div className="flex flex-col gap-3">
+          <div role="radiogroup" className="flex gap-2">
+            {ACTIONS.map((action) => (
+              <label
+                key={action.value}
+                className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border px-2 text-center has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
+              >
                 <input
-                  type="date"
-                  className={input}
-                  min={raw.action === "done" ? dob : today}
-                  max={raw.action === "done" ? today : undefined}
-                  value={raw.date}
-                  onChange={(e) => set("date", e.target.value)}
+                  type="radio"
+                  name="dose-action"
+                  className="sr-only"
+                  checked={raw.action === action.value}
+                  onChange={() => chooseAction(action.value)}
                 />
+                {action.label}
               </label>
-            )}
-            {raw.action === "done" && (
-              <label className="flex flex-col gap-1">
-                Nơi tiêm (không bắt buộc)
-                <input
-                  className={input}
-                  maxLength={120}
-                  value={raw.place}
-                  onChange={(e) => set("place", e.target.value)}
-                />
-              </label>
-            )}
+            ))}
+          </div>
+          {raw.action !== "skipped" && (
             <label className="flex flex-col gap-1">
-              Ghi chú (không bắt buộc)
-              <textarea
-                className="min-h-20 rounded-xl border p-3"
-                maxLength={500}
-                value={raw.note}
-                onChange={(e) => set("note", e.target.value)}
+              {raw.action === "done" ? "Ngày tiêm" : "Ngày hẹn mới"}
+              <input
+                type="date"
+                className={input}
+                min={raw.action === "done" ? dob : today}
+                max={raw.action === "done" ? today : undefined}
+                value={raw.date}
+                onChange={(e) => set("date", e.target.value)}
               />
             </label>
+          )}
+          {raw.action === "done" && (
+            <label className="flex flex-col gap-1">
+              Nơi tiêm (không bắt buộc)
+              <input
+                className={input}
+                maxLength={120}
+                value={raw.place}
+                onChange={(e) => set("place", e.target.value)}
+              />
+            </label>
+          )}
+          <label className="flex flex-col gap-1">
+            Ghi chú (không bắt buộc)
+            <textarea
+              className="min-h-20 rounded-xl border p-3"
+              maxLength={500}
+              value={raw.note}
+              onChange={(e) => set("note", e.target.value)}
+            />
+          </label>
+          <button
+            type="submit"
+            disabled={busy}
+            className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
+          >
+            Lưu
+          </button>
+          {row && (
             <button
-              type="submit"
+              type="button"
               disabled={busy}
-              className="min-h-12 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
+              onClick={clear}
+              className="min-h-11 rounded-2xl text-danger disabled:opacity-50"
             >
-              Lưu
+              Xóa đánh dấu
             </button>
-            {row && (
-              <button
-                type="button"
-                disabled={busy}
-                onClick={clear}
-                className="min-h-11 rounded-2xl text-danger disabled:opacity-50"
-              >
-                Xóa đánh dấu
-              </button>
-            )}
-          </div>
-        </OnlineOnly>
+          )}
+        </div>
         {message && (
           <p role="alert" className="text-danger">
             {message}
```

```diff
--- a/components/vaccines/DoseLine.tsx
+++ b/components/vaccines/DoseLine.tsx
@@ -1,7 +1,14 @@
+import { PendingMark } from "@/components/sync/PendingMark";
 import { formatDueDate } from "@/lib/rules/vaccineForm";
 import type { ScheduleItem } from "@/lib/rules/vaccines";
 
-export function DoseLine({ item }: { item: ScheduleItem }) {
+export function DoseLine({
+  item,
+  pending,
+}: {
+  item: ScheduleItem;
+  pending: boolean;
+}) {
   const { dose, record } = item;
   const when =
     item.state === "done"
@@ -13,7 +20,9 @@
         : `Hẹn ${formatDueDate(item.due)}`;
   return (
     <>
-      <span className="font-medium">{dose.name}</span>
+      <span className="font-medium">
+        {dose.name} <PendingMark pending={pending} />
+      </span>
       <span className="text-sm text-muted">
         {when} · {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
       </span>
```

```diff
--- a/components/vaccines/VaccineSetup.tsx
+++ b/components/vaccines/VaccineSetup.tsx
@@ -20,18 +20,20 @@
 // Spec §6.1: pick a series per group, then tick the doses already given.
 export function VaccineSetup({
   baby,
+  userId,
   records,
   initialChoices,
   onDone,
   onLater,
 }: {
   baby: Baby;
+  userId: string;
   records: DoseRecord[];
   initialChoices: Record<string, string>;
   onDone: () => void;
   onLater: () => void;
 }) {
-  const setup = useVaccineSetup(baby.id);
+  const setup = useVaccineSetup(baby.id, userId);
   const [draft, setDraft] = useState(initialChoices);
   const [ticked, setTicked] = useState(() => new Set(DEFAULT_TICKED));
   const candidates = quickTickCandidates(
```

```diff
--- a/components/vaccines/VaccineScreen.tsx
+++ b/components/vaccines/VaccineScreen.tsx
@@ -4,7 +4,9 @@
 import { OnlineOnly } from "@/components/OnlineOnly";
 import { VACCINES } from "@/lib/content/vaccines";
 import { toVietnameseError } from "@/lib/data/errors";
+import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
 import { useUpdateChoices, useVaccineDoses } from "@/lib/data/vaccines";
+import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
 import { vnDateString } from "@/lib/rules/time";
 import {
   cleanChoices,
@@ -25,12 +27,17 @@
 
 export function VaccineScreen({
   baby,
+  userId,
   isOwner,
 }: {
   baby: Baby;
+  userId: string;
   isOwner: boolean;
 }) {
   const doses = useVaccineDoses(baby.id);
+  const pending = pendingRowIds(
+    entriesFor(useOutboxEntries(userId), "vaccine_doses"),
+  );
   const choices = parseChoices(baby.vaccine_choices);
   const [setupLater, setSetupLater] = useState(false);
   const [editing, setEditing] = useState(false);
@@ -84,6 +91,7 @@
           <h2 className="text-lg font-medium">Thiết lập lịch tiêm</h2>
           <VaccineSetup
             baby={baby}
+            userId={userId}
             records={records}
             initialChoices={choices}
             onDone={() => setSetupLater(true)}
@@ -116,7 +124,12 @@
                     onClick={() => setOpen(item)}
                     className="flex min-h-12 w-full flex-col items-start gap-0.5 px-4 py-2 text-left"
                   >
-                    <DoseLine item={item} />
+                    <DoseLine
+                      item={item}
+                      pending={pending.has(
+                        doseKey(item.dose.code, item.dose.doseNo),
+                      )}
+                    />
                   </button>
                 </li>
               ))}
@@ -129,6 +142,7 @@
           item={open}
           row={rowFor(open)}
           babyId={baby.id}
+          userId={userId}
           dob={baby.dob}
           onClose={() => setOpen(null)}
         />
```

```diff
--- a/app/tiem-chung/page.tsx
+++ b/app/tiem-chung/page.tsx
@@ -6,10 +6,11 @@
 export default function Page() {
   return (
     <AuthGate need="baby">
-      {({ ctx }) =>
-        ctx?.baby ? (
+      {({ session, ctx }) =>
+        ctx?.baby && session ? (
           <VaccineScreen
             baby={ctx.baby}
+            userId={session.user.id}
             isOwner={ctx.member.role === "owner"}
           />
         ) : null
```

```diff
--- a/app/khai-bao-be/page.tsx
+++ b/app/khai-bao-be/page.tsx
@@ -21,14 +21,15 @@
   }
   return (
     <AuthGate need="family" keep={created !== null}>
-      {({ ctx }) => (
+      {({ session, ctx }) => (
         <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
           <h1 className="text-2xl font-semibold">
             {created ? "Lịch tiêm của bé" : "Khai báo bé"}
           </h1>
-          {created ? (
+          {created && session ? (
             <VaccineSetup
               baby={created}
+              userId={session.user.id}
               records={[]}
               initialChoices={{}}
               onDone={finish}
```

- [ ] **Step 6: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  201 passed (201)` (196 của M15 + 5 của Task 1); build thành công, có `○ /tiem-chung`.

- [ ] **Step 7: Commit**

```bash
git add lib/data components/sync components/home components/history components/vaccines app/tiem-chung app/khai-bao-be && git commit -m "feat(vaccines): mark doses through the outbox with pending marks"
```

---

### Task 3: Luật nhắc tiêm và dữ liệu cho dispatch

**Files:**

- Modify: `lib/rules/pushSelection.ts`, `lib/server/dispatchDeps.ts`, `lib/server/dispatch.test.ts`, `lib/rules/notifications.ts`
- Test: `lib/rules/pushSelection.test.ts`

**Interfaces:**

- Consumes: `VACCINES`, `VaccineDose`, `buildSchedule`, `DoseRecord` (M14); `addDays`, `formatDayShort`, `WEEKDAYS` (`lib/rules/days.ts`); `formatVnTime`, `vnDateString` (`lib/rules/time.ts`); `parseChoices`, `toDoseRecords` (M15)
- Produces: `Recipient.prefs = { feed_reminder; vaccine; snooze_until } | null`; `BabyDispatchState.vaccine: { dob: string; choices: Record<string, string>; records: DoseRecord[] } | null`; `selectDueNotifications(babies, now, vaccineDoses = VACCINES.doses)`

- [ ] **Step 1: Viết test thất bại**

Sửa `lib/rules/pushSelection.test.ts` (thêm `vaccine` vào dữ liệu mẫu cũ, thêm khối test nhắc tiêm):

```diff
--- a/lib/rules/pushSelection.test.ts
+++ b/lib/rules/pushSelection.test.ts
@@ -1,4 +1,5 @@
 import { describe, expect, it } from "vitest";
+import type { VaccineDose } from "@/lib/content/vaccineSchema";
 import {
   agoText,
   selectDueNotifications,
@@ -15,6 +16,7 @@
     feedIntervalMin: 180,
     lastFeed: { id: "L1", startedAt: minutesAgo(190) },
     breastRunning: false,
+    vaccine: null,
     recipients: [{ userId: "u1", prefs: null }],
     ...over,
   };
@@ -91,19 +93,31 @@
           recipients: [
             {
               userId: "off",
-              prefs: { feed_reminder: false, snooze_until: null },
+              prefs: {
+                feed_reminder: false,
+                vaccine: true,
+                snooze_until: null,
+              },
             },
             {
               userId: "snoozed",
-              prefs: { feed_reminder: true, snooze_until: minutesAgo(-30) },
+              prefs: {
+                feed_reminder: true,
+                vaccine: true,
+                snooze_until: minutesAgo(-30),
+              },
             },
             {
               userId: "woke",
-              prefs: { feed_reminder: true, snooze_until: minutesAgo(1) },
+              prefs: {
+                feed_reminder: true,
+                vaccine: true,
+                snooze_until: minutesAgo(1),
+              },
             },
             {
               userId: "plain",
-              prefs: { feed_reminder: true, snooze_until: null },
+              prefs: { feed_reminder: true, vaccine: true, snooze_until: null },
             },
           ],
         }),
@@ -133,3 +147,147 @@
     expect(agoText(45 * 60_000 + 59_000)).toBe("45 phút trước");
   });
 });
+
+describe("selectDueNotifications — vaccine (spec §8.3)", () => {
+  // Monday 16/11/2026 08:30 in VN. D3 = Thursday 19/11, D1 = Tuesday 17/11.
+  const at = (iso: string) => new Date(iso);
+  const morning = at("2026-11-16T01:30:00Z");
+  const dob = "2026-09-14"; // 19/11 is day 66, 17/11 is day 64
+  const vaxDose = (
+    code: string,
+    rec: number,
+    extra: Partial<VaccineDose> = {},
+  ): VaccineDose => ({
+    code,
+    doseNo: 1,
+    name: `${code} mũi 1`,
+    protects: ["X"],
+    program: "dich_vu",
+    recommendedAgeDays: rec,
+    minAgeDays: rec,
+    source: "https://example.org",
+    reviewedAt: "2026-11-14",
+    ...extra,
+  });
+  const doses = [
+    vaxDose("hexa", 66, { group: "dtp_combo", series: "6in1" }),
+    vaxDose("opv", 64),
+    vaxDose("rotarix", 64, { group: "rota", series: "rotarix" }),
+    vaxDose("bcg", 64),
+    vaxDose("later", 65),
+  ];
+  const vaxBaby = (over: Partial<BabyDispatchState> = {}) =>
+    baby({
+      lastFeed: null,
+      vaccine: {
+        dob,
+        choices: { dtp_combo: "6in1" },
+        records: [
+          {
+            vaccine_code: "bcg",
+            dose_no: 1,
+            status: "done",
+            given_on: null,
+            due_on_override: null,
+          },
+        ],
+      },
+      ...over,
+    });
+
+  it("reminds 3 days and 1 day before open doses of chosen series, 08:00–08:59 VN", () => {
+    expect(selectDueNotifications([vaxBaby()], morning, doses)).toEqual([
+      {
+        userId: "u1",
+        kind: "vaccine",
+        refKey: "vax:b1:opv:1:D1",
+        title: "Sắp tới lịch tiêm",
+        body: "opv mũi 1 vào Thứ Ba, 17/11.",
+        url: "/tiem-chung",
+        tag: "vaccine:b1:opv:1",
+      },
+      {
+        userId: "u1",
+        kind: "vaccine",
+        refKey: "vax:b1:hexa:1:D3",
+        title: "Sắp tới lịch tiêm",
+        body: "hexa mũi 1 vào Thứ Năm, 19/11.",
+        url: "/tiem-chung",
+        tag: "vaccine:b1:hexa:1",
+      },
+    ]);
+  });
+
+  it("sends nothing outside 08:00–08:59 VN or without vaccine data", () => {
+    for (const iso of ["2026-11-16T00:59:00Z", "2026-11-16T02:00:00Z"])
+      expect(selectDueNotifications([vaxBaby()], at(iso), doses)).toEqual([]);
+    expect(
+      selectDueNotifications([vaxBaby({ vaccine: null })], morning, doses),
+    ).toEqual([]);
+  });
+
+  it("uses a rescheduled date and skips doses marked skipped", () => {
+    const due = selectDueNotifications(
+      [
+        vaxBaby({
+          vaccine: {
+            dob,
+            choices: { dtp_combo: "6in1" },
+            records: [
+              {
+                vaccine_code: "hexa",
+                dose_no: 1,
+                status: "rescheduled",
+                given_on: null,
+                due_on_override: "2026-11-17",
+              },
+              {
+                vaccine_code: "opv",
+                dose_no: 1,
+                status: "skipped",
+                given_on: null,
+                due_on_override: null,
+              },
+            ],
+          },
+        }),
+      ],
+      morning,
+      doses,
+    );
+    expect(due.map((d) => d.refKey)).toEqual([
+      "vax:b1:bcg:1:D1",
+      "vax:b1:hexa:1:D1",
+    ]);
+  });
+
+  it("follows the vaccine switch and ignores snooze", () => {
+    const due = selectDueNotifications(
+      [
+        vaxBaby({
+          recipients: [
+            {
+              userId: "off",
+              prefs: {
+                feed_reminder: true,
+                vaccine: false,
+                snooze_until: null,
+              },
+            },
+            {
+              userId: "snoozed",
+              prefs: {
+                feed_reminder: true,
+                vaccine: true,
+                snooze_until: "2026-11-16T05:00:00Z",
+              },
+            },
+          ],
+        }),
+      ],
+      morning,
+      doses,
+    );
+    expect(new Set(due.map((d) => d.userId))).toEqual(new Set(["snoozed"]));
+  });
+});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/pushSelection.test.ts`
Expected: FAIL — `Tests  3 failed | 8 passed (11)`; ví dụ `AssertionError: expected [] to deeply equal [ { userId: 'u1', …(6) }, …(1) ]`.

- [ ] **Step 3: Viết luật nhắc tiêm**

```diff
--- a/lib/rules/pushSelection.ts
+++ b/lib/rules/pushSelection.ts
@@ -1,11 +1,19 @@
-import { formatVnTime } from "./time";
+import { VACCINES } from "@/lib/content/vaccines";
+import type { VaccineDose } from "@/lib/content/vaccineSchema";
+import { addDays, formatDayShort, WEEKDAYS } from "./days";
+import { formatVnTime, vnDateString } from "./time";
+import { buildSchedule, type DoseRecord } from "./vaccines";
 
 export type NotificationKind = "feed" | "wake" | "vaccine";
 
 export type Recipient = {
   userId: string;
   // null: the user never saved preferences, so every switch is on (spec §5.2).
-  prefs: { feed_reminder: boolean; snooze_until: string | null } | null;
+  prefs: {
+    feed_reminder: boolean;
+    vaccine: boolean;
+    snooze_until: string | null;
+  } | null;
 };
 
 export type BabyDispatchState = {
@@ -14,6 +22,12 @@
   // Latest breast/bottle log by started_at, or null when there is none.
   lastFeed: { id: string; startedAt: string } | null;
   breastRunning: boolean;
+  // null: vaccine reminders are not evaluated for this baby.
+  vaccine: {
+    dob: string;
+    choices: Record<string, string>;
+    records: DoseRecord[];
+  } | null;
   // Members with a user_id and at least one push subscription.
   recipients: Recipient[];
 };
@@ -70,10 +84,63 @@
     }));
 }
 
-// Spec §8.3. Release 1 sends only "feed"; "wake" and "vaccine" come in release 2.
+// Vaccine reminders ignore snooze (spec §8.3); only the "Nhắc lịch tiêm" switch counts.
+const wantsVaccine = (recipient: Recipient) =>
+  recipient.prefs === null || recipient.prefs.vaccine;
+
+function weekdayDate(day: string): string {
+  const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
+  return `${weekday}, ${formatDayShort(day)}`;
+}
+
+// Spec §8.3 row "vaccine": 08:00–08:59 VN time, open doses of a chosen series
+// due in 3 days (D3) or tomorrow (D1).
+function vaccineReminders(
+  baby: BabyDispatchState,
+  now: Date,
+  doses: VaccineDose[],
+): DueNotification[] {
+  if (!baby.vaccine || formatVnTime(now).slice(0, 2) !== "08") return [];
+  const today = vnDateString(now);
+  const marks: Record<string, "D3" | "D1"> = {
+    [addDays(today, 3)]: "D3",
+    [addDays(today, 1)]: "D1",
+  };
+  const items = buildSchedule({
+    doses,
+    choices: baby.vaccine.choices,
+    dob: baby.vaccine.dob,
+    records: baby.vaccine.records,
+    today,
+  }).filter(
+    (item) =>
+      !item.unchosen &&
+      item.state !== "done" &&
+      item.state !== "skipped" &&
+      marks[item.due] !== undefined,
+  );
+  return items.flatMap((item) =>
+    baby.recipients.filter(wantsVaccine).map((recipient): DueNotification => ({
+      userId: recipient.userId,
+      kind: "vaccine",
+      refKey: `vax:${baby.babyId}:${item.dose.code}:${item.dose.doseNo}:${marks[item.due]}`,
+      title: "Sắp tới lịch tiêm",
+      body: `${item.dose.name} vào ${weekdayDate(item.due)}.`,
+      url: "/tiem-chung",
+      // One tag per dose: several doses often fall on the same day.
+      tag: `vaccine:${baby.babyId}:${item.dose.code}:${item.dose.doseNo}`,
+    })),
+  );
+}
+
+// Spec §8.3: "feed" and "vaccine". "wake" comes later in release 2.
 export function selectDueNotifications(
   babies: BabyDispatchState[],
   now: Date,
+  vaccineDoses: VaccineDose[] = VACCINES.doses,
 ): DueNotification[] {
-  return babies.flatMap((baby) => feedReminders(baby, now));
+  return babies.flatMap((baby) => [
+    ...feedReminders(baby, now),
+    ...vaccineReminders(baby, now, vaccineDoses),
+  ]);
 }
```

- [ ] **Step 4: Nạp dữ liệu tiêm cho dispatch và sửa dữ liệu mẫu**

```diff
--- a/lib/server/dispatchDeps.ts
+++ b/lib/server/dispatchDeps.ts
@@ -1,5 +1,6 @@
 import webpush from "web-push";
 import type { BabyDispatchState } from "@/lib/rules/pushSelection";
+import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
 import type { DispatchDeps } from "./dispatch";
 import { pushEnv } from "./pushEnv";
 import { supabaseServiceRole } from "./supabaseServer";
@@ -10,13 +11,13 @@
   const db = supabaseServiceRole();
   const { data: babies, error } = await db
     .from("babies")
-    .select("id, family_id, feed_interval_min");
+    .select("id, family_id, feed_interval_min, dob, vaccine_choices");
   if (error) throw error;
 
   const states: BabyDispatchState[] = [];
   for (const baby of babies) {
     const since = new Date(now.getTime() - TWELVE_HOURS_MS).toISOString();
-    const [feeds, running, members] = await Promise.all([
+    const [feeds, running, members, doses] = await Promise.all([
       db
         .from("logs")
         .select("id, started_at")
@@ -37,8 +38,12 @@
         .select("user_id")
         .eq("family_id", baby.family_id)
         .not("user_id", "is", null),
+      db
+        .from("vaccine_doses")
+        .select("vaccine_code, dose_no, status, given_on, due_on_override")
+        .eq("baby_id", baby.id),
     ]);
-    for (const result of [feeds, running, members])
+    for (const result of [feeds, running, members, doses])
       if (result.error) throw result.error;
 
     const userIds = (members.data ?? []).flatMap((m) =>
@@ -48,7 +53,7 @@
       db.from("push_subscriptions").select("user_id").in("user_id", userIds),
       db
         .from("notification_prefs")
-        .select("user_id, feed_reminder, snooze_until")
+        .select("user_id, feed_reminder, vaccine, snooze_until")
         .in("user_id", userIds),
     ]);
     if (subscribed.error) throw subscribed.error;
@@ -61,6 +66,11 @@
       feedIntervalMin: baby.feed_interval_min,
       lastFeed: last ? { id: last.id, startedAt: last.started_at } : null,
       breastRunning: (running.data ?? []).length > 0,
+      vaccine: {
+        dob: baby.dob,
+        choices: parseChoices(baby.vaccine_choices),
+        records: toDoseRecords(doses.data ?? []),
+      },
       recipients: userIds
         .filter((id) => withSubscription.has(id))
         .map((userId) => {
@@ -70,6 +80,7 @@
             prefs: row
               ? {
                   feed_reminder: row.feed_reminder,
+                  vaccine: row.vaccine,
                   snooze_until: row.snooze_until,
                 }
               : null,
```

```diff
--- a/lib/server/dispatch.test.ts
+++ b/lib/server/dispatch.test.ts
@@ -15,6 +15,7 @@
   feedIntervalMin: 180,
   lastFeed: { id: "L1", startedAt: "2026-11-14T23:00:00Z" }, // 4 hours ago
   breastRunning: false,
+  vaccine: null,
   recipients: [{ userId: "u1", prefs: null }],
 };
 
```

```diff
--- a/lib/rules/notifications.ts
+++ b/lib/rules/notifications.ts
@@ -16,7 +16,7 @@
     label: "Nhắc khi bé thức quá lâu",
     note: "Có từ đợt 2",
   },
-  { key: "vaccine", label: "Nhắc lịch tiêm", note: "Có từ đợt 2" },
+  { key: "vaccine", label: "Nhắc lịch tiêm", note: null },
 ];
 
 export function snoozeUntil(now: Date, hours: number): string {
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/pushSelection.test.ts && bun run typecheck && bun run test && bun run build`
Expected: PASS — `Tests  11 passed (11)` cho file này; không lỗi type; cả bộ `Tests  205 passed (205)`; build thành công.

- [ ] **Step 6: Commit**

```bash
git add lib/rules/pushSelection.ts lib/rules/pushSelection.test.ts lib/server/dispatchDeps.ts lib/server/dispatch.test.ts lib/rules/notifications.ts && git commit -m "feat(push): vaccine reminders 3 days and 1 day ahead at 08:00 VN"
```

---

### Task 4: Checklist bước 9 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 2, Task 3
- Produces: checklist bước 9; bản deploy có nhắc tiêm

- [ ] **Step 1: Sửa bước 7 và thêm bước 9**

Trong `## Bước 7 — Tạm tắt (M11, phần nhắc bú)`:

```diff
-5. Phần "nhắc tiêm vẫn đến khi tạm tắt" kiểm ở đợt 2.
+5. Nhắc tiêm vẫn đến khi tạm tắt: kiểm ở bước 9, mục 4.
```

Thêm vào cuối file (sau bước 8 của M15):

````markdown
## Bước 9 — Tiêm chủng khi offline và nhắc lịch tiêm (M16)

1. Bật chế độ máy bay. Tiêm chủng → bấm một mũi "Sắp tới" → Đã tiêm → Lưu. Kỳ vọng: mũi chuyển sang "Đã tiêm" ngay, có dấu ⏳; đầu trang có chip "⏳ 1 mục chờ đồng bộ".
2. Tắt chế độ máy bay, giữ app mở. Kỳ vọng: trong ≤ 30 giây ⏳ và chip biến mất; máy thứ hai mở Tiêm chủng thấy mũi đó "Đã tiêm". Mở lại mũi → "Xóa đánh dấu".
3. Cài đặt → Thông báo: công tắc "Nhắc lịch tiêm" đang bật, không còn dòng "Có từ đợt 2". Tiêm chủng → bấm một mũi chưa tiêm **không** có nhãn "Chưa chọn loại" → Đổi ngày hẹn → **ngày kia** (hôm nay + 2) → Lưu.
4. Sáng hôm sau, khoảng 07:50, Cài đặt → Thông báo → "Tạm tắt 2 giờ".
5. Kỳ vọng: trong khoảng 08:00–08:59 mọi máy đã bật thông báo nhận "Sắp tới lịch tiêm" / "<tên mũi> vào <Thứ, dd/MM>." dù đang tạm tắt; bấm vào thì mở trang Tiêm chủng.
6. Dọn dẹp: "Bật lại" thông báo; mở lại mũi ở bước 3 → "Xóa đánh dấu".

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
````

Run: `grep -n '^## ' docs/device-checklist.md`
Expected: tiêu đề cuối cùng là `## Bước 9 — Tiêm chủng khi offline và nhắc lịch tiêm (M16)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist step 9 for offline dose marks and vaccine reminders" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/tiem-chung`
Expected: `200`. Cron `push-dispatch` (M11) đã chạy mỗi phút, nên từ 08:00 sáng hôm sau luật mới tự có hiệu lực, không cần thiết lập thêm.

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bảng kết quả bước 9 để trống. Trong báo cáo cuối ghi rõ: "Checklist bước 8 và 9 chờ người dùng; tiêu chí §11 'nhận push vaccine thật trên ít nhất 1 máy' sẽ đạt khi bước 9 mục 5 đạt."

---

## Ngoài phạm vi M16

- Push `wake` và luật `W(ageDays)`; trang thông tin khẩn cấp.
- Tăng trưởng WHO (bảng `growth` sẽ dùng cùng cách xếp hàng outbox như mũi tiêm).
- Phân loại triệu chứng và bài bệnh thường gặp.
