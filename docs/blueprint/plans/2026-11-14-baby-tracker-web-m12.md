# Baby Tracker Web — M12 (Ghi offline qua outbox) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Mọi thao tác ghi bản ghi `logs` (bấm đồng hồ, Dừng, nhập nhanh, thêm/sửa/xóa ở Nhật ký) chạy được cả khi mất mạng, theo spec §9:
- Thao tác được lưu vào outbox trên máy và hiện ngay.
- Outbox được gửi lên Supabase theo đúng thứ tự khi có mạng lại.
- Lỗi được phân loại: lỗi tạm thời thì giữ lại thử tiếp, lỗi vĩnh viễn thì bỏ.

**Architecture:**
- **Phần thuần (Vitest):** `lib/data/outboxCore.ts` phân loại lỗi, áp một thay đổi lên danh sách bản ghi, và phát lại các thay đổi còn chờ. `lib/data/outboxFlush.ts` xả outbox, nhận dependencies qua tham số.
- **Lưu trên máy:** outbox nằm trong bảng Dexie `outbox` (database `be-yeu`, `version(2)`).
- **Ghi:** hook ghi gọi `enqueueLogChange`. Hàm này lưu outbox, sửa ngay mọi cache React Query dưới `["logs", babyId]`, rồi gọi bộ xả.
- **Đọc:** hàm tải log phát lại các thay đổi còn chờ lên dữ liệu server, để lần tải lại không làm mất chúng.
- **Bộ xả:** component `OutboxSync` trong `Providers` chạy bộ xả khi khởi động, khi có sự kiện `online`, mỗi 30 giây, và ngay sau mỗi lần ghi.

**Tech Stack:** như M1–M11 (Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, supabase-js 2.118.0, React Query 5.105.0, Dexie 4.4.7…). Không thêm thư viện.

**Milestones của đợt phát hành 1:**
- M1–M11: xong.
- **M12:** outbox cho `logs` (ghi offline, gửi lại theo thứ tự, phân loại lỗi), checklist bước 4.
- M13: hiển thị đồng bộ (chip "N mục chờ đồng bộ", dấu ⏳ trên từng bản ghi còn chờ, thông báo "Không lưu được: …"); tắt các nút ghi cần mạng (hồ sơ bé, thành viên, khoảng cách cữ bú, thông báo) kèm "Cần kết nối mạng"; chốt checklist đợt 1.
- M13 lập plan sau khi M12 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Phạm vi:** đợt 1 chỉ có bảng `logs` đi qua outbox. `growth`, `vaccine_doses`, `milestones_achieved` (đợt 2–3) sẽ thêm vào cùng outbox. Trường `table` của mỗi mục đã có sẵn cho việc đó.
- **Một mục outbox:** `{ id, table: "logs", op, rowId, babyId, userId, row, createdAt, attempts }`.
  - `id` là mã riêng của mục; `rowId` là `logs.id` do client sinh (§2.1).
  - `createdAt` luôn tăng: hai thao tác trong cùng một mili giây (Dừng rồi Bắt đầu khi đổi bên bú) vẫn giữ đúng thứ tự.
  - `userId` là người ghi. Bộ xả chỉ gửi mục của người đang đăng nhập; mục của người khác trên cùng máy nằm chờ tới khi người đó đăng nhập lại.
- **Bốn loại thao tác:**
  - `insert`: dùng `upsert` theo `id` với `ignoreDuplicates`, tức `on conflict (id) do nothing`. Gửi lại sau khi mất phản hồi sẽ không tạo bản trùng và không ghi đè thay đổi của người khác.
  - `update`: dùng `update(...).eq("id").select("id")`, không dùng upsert. Upsert một phần cột sẽ lỗi ràng buộc `not null` ở nhánh insert. 0 dòng thì coi là bị RLS chặn (§5.2).
  - `delete`: 0 dòng thì `select` lại theo `id`. Không còn dòng thì coi là thành công (§9).
  - `stop`: gọi RPC `stop_timer(p_log_id, p_ended_at)` như M3, vì member được dừng đồng hồ của người khác mà RLS không cho `update`. Đây là thao tác thứ tư ngoài insert/update/delete của §9.
- **Phân loại lỗi (§9):** dựa trên `status` HTTP và `code` mà supabase-js trả về. Lỗi mạng có `status = 0`.
  - `401`, `PGRST301` hoặc `PGRST303` → làm mới phiên rồi thử lại lần xả sau. Làm mới thất bại → chuyển `/dang-nhap` và giữ outbox. Ưu tiên cao nhất, kể cả khi đi kèm `42501`.
  - Mã `42501`, `23505`, `23514`, `23503`, `22P02`, hoặc HTTP 403/400, hoặc update/delete 0 dòng → bỏ mục và báo "Không lưu được: <lý do>.". Lý do lần lượt là "Bạn không có quyền thực hiện thao tác này", "Đã có người bắt đầu trước", "Dữ liệu không hợp lệ", "Bản ghi liên quan không còn".
  - Mọi lỗi khác (mạng, 408, 429, 5xx, mã lạ) → tạm thời: `attempts + 1`, dừng lượt xả ở đây để giữ thứ tự.
- **"Rollback cache" (§9):** bỏ mục xong thì làm mới mọi query `["logs"]`. Dữ liệu server thay chỗ thay đổi lạc quan đã bị bỏ, không cần tự viết phép đảo ngược.
- **Thay đổi lạc quan:**
  - Danh sách thường được sửa ngay.
  - Với trang Nhật ký (infinite query), bản ghi mới chỉ thêm vào trang đầu.
  - Khi tải lại từ server, các mục còn chờ được phát lại. Bản ghi mới chỉ hiện nếu `started_at` nằm trong khoảng của truy vấn đó (hoặc đang chạy).
- **Hook ghi:** dùng `networkMode: "always"` để chạy cả khi React Query biết đang offline (M9 bật theo dõi offline). Hook không còn tự làm mới query; `OutboxSync` làm việc đó sau khi gửi xong.
- **Lỗi khi lưu xuống máy:** IndexedDB lỗi thì mutation báo lỗi như trước (`toVietnameseError`). Lỗi từ server không hiện trong sheet nữa, vì khi lỗi tới thì sheet đã đóng.
- **Báo mục bị bỏ:**
  - M12 phát tín hiệu `droppedWrites` kèm lý do, và ghi `console.warn`.
  - Chip "N mục chờ đồng bộ" và thông báo "Không lưu được: <lý do>." trên màn hình thuộc M13. Trong lúc chưa có M13, mục bị bỏ chỉ thấy qua việc dữ liệu được làm mới.
- **Thay đổi tiếp theo của bản ghi có insert bị từ chối** (ví dụ Dừng một đồng hồ mà insert gặp `23505`): bị bỏ luôn mà không báo thêm, vì chắc chắn sẽ lỗi với lý do gây hiểu lầm.
- **Một lượt xả mỗi lúc:**
  - Ghi trong lúc đang xả thì xả thêm một lượt ngay sau, trừ khi lượt trước dừng vì lỗi tạm thời.
  - Nhiều tab dùng chung một khóa Web Locks (`be-yeu-outbox`, Safari 15.4+), tab nào thấy khóa bận thì bỏ lượt đó.
- **Trước khi sửa cache lạc quan,** `cancelQueries` hủy lần tải đang chạy, để lần tải đó không ghi đè thay đổi vừa thêm.
- **`createdAt`** lấy lớn hơn mục mới nhất đang có trong outbox, nên đồng hồ máy lùi sau khi tải lại trang cũng không làm sai thứ tự.
- **Hai máy cùng bấm một đồng hồ khi offline:** máy gửi sau gặp `23505` (unique index `logs_one_running_timer`), nên mục bị bỏ với lý do "Đã có người bắt đầu trước" (§9).

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

Từ spec §2.2, §5.2, §9 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `@tanstack/react-query-persist-client` 5.105.0, `dexie` 4.4.7, `web-push` 3.6.7, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `@types/web-push` 3.6.4, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x. TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component, tự kiểm tra phiên ở client.
- Cột `created_by` có `default auth.uid()`; client không bao giờ gửi `created_by`.
- Mọi lệnh `update`/`delete` ở client dùng `.select()` và coi 0 dòng trả về là "bị từ chối quyền" (§5.2).
- Outbox (§9): ghi vào cache ngay (optimistic) và vào bảng Dexie `outbox`. Bộ xả chạy khi app khởi động, khi có `online`, và mỗi 30 giây khi có mạng. Xả theo thứ tự `createdAt`. Bộ xả chỉ chạy khi `supabase.auth.getSession()` trả về phiên. Dừng ở lỗi tạm thời đầu tiên. Xung đột: ghi sau cùng thắng.
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Runtime: Node.js 22.x.
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x.

Từ M7–M9:

- File `.tsx` trong `app/` và `components/` chỉ dùng màu theo vai trò. Không dùng lớp màu bảng Tailwind (trừ `bg-black/40`). `lib/themeGuard.test.ts` khóa quy tắc này.
- Dexie database `be-yeu` đã có `version(1)` với bảng `kv` (cache React Query). M12 thêm `version(2)` và giữ nguyên `kv`.

Riêng M12:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`). Mọi file mới gọi IndexedDB hoặc `window` đều có `"use client"`, và chỉ chạm IndexedDB trong effect hoặc khi người dùng bấm.
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/data/outboxCore.ts` phải đúng từng ký tự như plan này (có test khóa lại).

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`a8813b7`):

- `localDb()` với `version(1).stores({ kv: "key" })` (`lib/data/localDb.ts`, M9); `PersistQueryClientProvider` trong `components/Providers.tsx` (M9)
- `logsKey`, `fetchLogsSince`, `fetchHistoryPage`, các hook ghi `useTimerPress`, `useStopTimer`, `useAddInstant`, `useSaveLog`, `useDeleteLog` (`lib/data/logs.ts`, M3–M6). M12 đổi chữ ký các hook ghi: thêm `userId`.
- RPC `stop_timer(p_log_id uuid, p_ended_at timestamptz)` và unique index `logs_one_running_timer` (M1)
- `planTimerPress`, `RunningLog`, `TimerButton` (`lib/rules/timer.ts`); `LogPatch` (`lib/rules/logForm.ts`); `LogRow` (`lib/supabase/rows.ts`)
- `AuthGate` (gắn thanh tab cho `need="baby"`, M7); `HomeScreen`, `QuickEntrySheet`, `HistoryScreen`, `LogEditSheet`, `app/page.tsx`, `app/nhat-ky/page.tsx`
- `toVietnameseError` (`lib/data/errors.ts`)

**Produces** (M13 và đợt 2–3 dùng):

- `lib/data/outboxCore.ts`: `OutboxOp`, `OutboxEntry`, `Failure`, `FailureClass`, `classifyFailure`, `applyLogChange`, `applyToCache`, `overlayPending`
- `lib/data/outboxFlush.ts`: `SendOutcome`, `FlushDeps`, `FlushResult`, `flushOutbox`
- `lib/data/localDb.ts`: `version(2)` thêm bảng `outbox` (`"id, createdAt, userId, babyId"`)
- `lib/data/outboxEvents.ts`: `flushRequests`, `droppedWrites`
- `lib/data/outbox.ts`: `LogChange`, `enqueueLogChange(queryClient, change)`, `withPending(babyId, rows, inRange)`
- `lib/data/outboxDeps.ts`: `outboxDeps(): FlushDeps`
- `components/sync/OutboxSync.tsx`. M13 đọc `localDb().outbox` (theo `userId`) để vẽ chip và dấu ⏳, và nghe `droppedWrites` để hiện thông báo.
- Hook ghi mới: `useTimerPress(babyId, userId)`, `useStopTimer(babyId, userId)`, `useAddInstant(babyId, userId)`, `useSaveLog(babyId, userId)`, `useDeleteLog(babyId, userId)`. Đã bỏ `insertLog`, `stopTimer`, `updateLog`, `deleteLog`.
- `HomeScreen`, `HistoryScreen`, `QuickEntrySheet`, `LogEditSheet` nhận thêm prop `userId`
- `docs/device-checklist.md` bước 4

## File Structure

```
lib/data/outboxCore.ts (+ test)       # phân loại lỗi, áp / phát lại thay đổi (thuần)
lib/data/outboxFlush.ts (+ test)      # xả outbox theo thứ tự (thuần, nhận deps)
lib/data/localDb.ts                   # sửa: version(2) thêm bảng outbox
lib/data/outboxEvents.ts              # tín hiệu "xả ngay" và "bị bỏ"
lib/data/outbox.ts                    # thêm vào outbox + sửa cache; phát lại khi tải
lib/data/outboxDeps.ts                # gửi thật lên Supabase, làm mới phiên
components/sync/OutboxSync.tsx        # chạy bộ xả
components/Providers.tsx              # sửa: gắn OutboxSync
lib/data/logs.ts                      # sửa: hook ghi qua outbox, phát lại khi tải
components/home/*, components/history/*, app/page.tsx, app/nhat-ky/page.tsx          # sửa: truyền userId
docs/device-checklist.md              # sửa: bước 4
```

## Tasks

1. Lõi outbox: phân loại lỗi, áp thay đổi, xả theo thứ tự
2. Lưu outbox trên máy và gửi lên Supabase
3. Mọi thao tác ghi đi qua outbox, thử trên iPhone

---

### Task 1: Lõi outbox: phân loại lỗi, áp thay đổi, xả theo thứ tự

**Files:**

- Create: `lib/data/outboxCore.ts`, `lib/data/outboxFlush.ts`
- Test: `lib/data/outboxCore.test.ts`, `lib/data/outboxFlush.test.ts`

**Interfaces:**

- Consumes: `LogRow`
- Produces:
  - `type OutboxEntry` (xem "Diễn giải spec"); `type OutboxOp = "insert" | "update" | "delete" | "stop"`
  - `type Failure = { zeroRows: true } | { status: number; code: string | null; message: string }`
  - `classifyFailure(failure): { kind: "retry" } | { kind: "refresh" } | { kind: "drop"; reason: string }`
  - `applyLogChange(rows: LogRow[], entry, nowIso): LogRow[]`, `applyToCache(data: unknown, entry, nowIso): unknown`, `overlayPending(rows, entries, inRange, nowIso): LogRow[]`
  - `type SendOutcome = { ok: true } | { ok: false; failure: Failure }`; `type FlushDeps = { currentUserId; pending; send; remove; bumpAttempts; refreshSession; onDropped; onSignedOut }`
  - `flushOutbox(deps): Promise<{ sent: number; dropped: number; blocked: boolean }>`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m12.md` (file plan này, đi chung commit của Task 1); commit mới nhất là `a8813b7 feat(push): pg_cron job calling dispatch every minute via Vault secrets`, hoặc một commit `docs: device checklist results …` của M11 nếu người dùng đã gửi kết quả iPhone.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/data/outboxCore.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { LogRow } from "@/lib/supabase/rows";
import {
  applyLogChange,
  applyToCache,
  classifyFailure,
  overlayPending,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-15T03:00:00.000Z";

function row(id: string, started_at: string, ended_at: string | null): LogRow {
  return {
    id,
    baby_id: "b1",
    type: "sleep",
    started_at,
    ended_at,
    details: {},
    note: null,
    created_by: "u0",
    created_at: started_at,
    updated_at: started_at,
  };
}

function entry(
  op: OutboxEntry["op"],
  rowId: string,
  data: Record<string, unknown> | null,
  createdAt = 1,
): OutboxEntry {
  return {
    id: `e-${rowId}-${createdAt}`,
    table: "logs",
    op,
    rowId,
    babyId: "b1",
    userId: "u1",
    row: data,
    createdAt,
    attempts: 0,
  };
}

const diaper = {
  type: "diaper",
  started_at: "2026-11-15T02:00:00.000Z",
  ended_at: "2026-11-15T02:00:00.000Z",
  details: { wet: true, dirty: false },
};

describe("classifyFailure (spec §9)", () => {
  it("treats 401 as temporary even with an RLS code", () => {
    expect(
      classifyFailure({ status: 401, code: "42501", message: "" }),
    ).toEqual({ kind: "refresh" });
    expect(
      classifyFailure({
        status: 401,
        code: "PGRST303",
        message: "jwt expired",
      }),
    ).toEqual({ kind: "refresh" });
  });

  it("retries network errors, timeouts, rate limits, server errors and unknowns", () => {
    for (const status of [0, 408, 429, 500, 503, 409])
      expect(classifyFailure({ status, code: null, message: "" })).toEqual({
        kind: "retry",
      });
  });

  it("drops permanent errors with a reason", () => {
    expect(
      classifyFailure({ status: 409, code: "23505", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Đã có người bắt đầu trước",
    });
    expect(
      classifyFailure({ status: 403, code: "42501", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Bạn không có quyền thực hiện thao tác này",
    });
    expect(
      classifyFailure({ status: 400, code: "22P02", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Dữ liệu không hợp lệ",
    });
    expect(
      classifyFailure({ status: 400, code: "PGRST204", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Dữ liệu không hợp lệ",
    });
    expect(classifyFailure({ zeroRows: true })).toEqual({
      kind: "drop",
      reason: "Bạn không có quyền thực hiện thao tác này",
    });
  });
});

describe("applyLogChange", () => {
  const rows = [
    row("a", "2026-11-15T01:00:00.000Z", null),
    row("b", "2026-11-14T20:00:00.000Z", "2026-11-14T21:00:00.000Z"),
  ];

  it("inserts a new row in started_at order, once", () => {
    const next = applyLogChange(rows, entry("insert", "c", diaper), NOW);
    expect(next.map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(next[0]).toMatchObject({
      type: "diaper",
      created_by: "u1",
      note: null,
    });
    expect(applyLogChange(next, entry("insert", "c", diaper), NOW)).toBe(next);
  });

  it("updates, deletes and stops rows", () => {
    expect(
      applyLogChange(rows, entry("update", "b", { note: "x" }), NOW)[1].note,
    ).toBe("x");
    expect(
      applyLogChange(rows, entry("delete", "a", null), NOW).map((r) => r.id),
    ).toEqual(["b"]);
    expect(
      applyLogChange(rows, entry("stop", "a", { ended_at: NOW }), NOW)[0]
        .ended_at,
    ).toBe(NOW);
    expect(
      applyLogChange(
        rows,
        entry("stop", "a", { ended_at: "2026-11-15T00:00:00.000Z" }),
        NOW,
      )[0].ended_at,
    ).toBe("2026-11-15T01:00:00.000Z");
  });

  it("applyToCache handles lists and infinite pages, new rows only on the first page", () => {
    const data = { pages: [[rows[0]], [rows[1]]], pageParams: [0, 1] };
    const inserted = applyToCache(
      data,
      entry("insert", "c", diaper),
      NOW,
    ) as typeof data;
    expect(inserted.pages.map((p) => p.map((r) => r.id))).toEqual([
      ["c", "a"],
      ["b"],
    ]);
    const deleted = applyToCache(
      data,
      entry("delete", "b", null),
      NOW,
    ) as typeof data;
    expect(deleted.pages[1]).toEqual([]);
    expect(
      applyToCache(undefined, entry("delete", "b", null), NOW),
    ).toBeUndefined();
  });

  it("overlayPending replays queued changes in order and filters inserts by range", () => {
    const queued = [
      entry("stop", "a", { ended_at: NOW }, 3),
      entry("insert", "c", diaper, 1),
      entry(
        "insert",
        "old",
        { ...diaper, started_at: "2026-11-01T00:00:00.000Z" },
        2,
      ),
    ];
    const result = overlayPending(
      rows,
      queued,
      (r) => r.started_at >= "2026-11-14T00:00:00.000Z",
      NOW,
    );
    expect(result.map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(result[1].ended_at).toBe(NOW);
  });
});
```

Tạo `lib/data/outboxFlush.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { OutboxEntry } from "./outboxCore";
import { flushOutbox, type FlushDeps, type SendOutcome } from "./outboxFlush";

const entry = (id: string, createdAt: number): OutboxEntry => ({
  id,
  table: "logs",
  op: "insert",
  rowId: `row-${id}`,
  babyId: "b1",
  userId: "u1",
  row: {},
  createdAt,
  attempts: 0,
});

function deps(
  outcomes: Record<string, SendOutcome>,
  over: Partial<FlushDeps> = {},
  queue: OutboxEntry[] = [entry("1", 1), entry("2", 2), entry("3", 3)],
) {
  const d = {
    currentUserId: async () => "u1",
    pending: async () => queue,
    send: vi.fn(
      async (e: OutboxEntry) => outcomes[e.id] ?? { ok: true as const },
    ),
    remove: vi.fn(async () => undefined),
    bumpAttempts: vi.fn(async () => undefined),
    refreshSession: vi.fn(async () => true),
    onDropped: vi.fn(),
    onSignedOut: vi.fn(),
    ...over,
  };
  return d;
}

describe("flushOutbox (spec §9)", () => {
  it("sends everything oldest first", async () => {
    const d = deps({});
    expect(await flushOutbox(d)).toEqual({
      sent: 3,
      dropped: 0,
      blocked: false,
    });
    expect(vi.mocked(d.send).mock.calls.map(([e]) => e.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(d.remove).toHaveBeenCalledTimes(3);
  });

  it("does nothing without a signed-in user", async () => {
    const d = deps({}, { currentUserId: async () => null });
    expect(await flushOutbox(d)).toEqual({
      sent: 0,
      dropped: 0,
      blocked: false,
    });
    expect(d.send).not.toHaveBeenCalled();
  });

  it("drops a permanent error, reports it and keeps going", async () => {
    const d = deps({
      "2": { ok: false, failure: { status: 409, code: "23505", message: "" } },
    });
    expect(await flushOutbox(d)).toEqual({
      sent: 2,
      dropped: 1,
      blocked: false,
    });
    expect(d.onDropped).toHaveBeenCalledWith(
      expect.objectContaining({ id: "2" }),
      "Đã có người bắt đầu trước",
    );
  });

  it("stops at the first temporary error and keeps the rest", async () => {
    const d = deps({
      "2": {
        ok: false,
        failure: { status: 0, code: null, message: "Failed to fetch" },
      },
    });
    expect(await flushOutbox(d)).toEqual({
      sent: 1,
      dropped: 0,
      blocked: true,
    });
    expect(d.send).toHaveBeenCalledTimes(2);
    expect(d.bumpAttempts).toHaveBeenCalledWith("2");
    expect(d.remove).toHaveBeenCalledTimes(1);
  });

  it("on 401 refreshes the session; if that fails it signs out but keeps the outbox", async () => {
    const expired = {
      ok: false as const,
      failure: { status: 401, code: "PGRST303", message: "" },
    };
    const ok = deps({ "1": expired });
    expect(await flushOutbox(ok)).toEqual({
      sent: 0,
      dropped: 0,
      blocked: true,
    });
    expect(ok.refreshSession).toHaveBeenCalled();
    expect(ok.onSignedOut).not.toHaveBeenCalled();

    const failed = deps(
      { "1": expired },
      { refreshSession: vi.fn(async () => false) },
    );
    await flushOutbox(failed);
    expect(failed.onSignedOut).toHaveBeenCalled();
    expect(failed.remove).not.toHaveBeenCalled();
  });

  it("quietly drops later changes to a row whose insert was refused", async () => {
    const stop: OutboxEntry = { ...entry("2", 2), op: "stop", rowId: "row-1" };
    const d = deps(
      {
        "1": {
          ok: false,
          failure: { status: 409, code: "23505", message: "" },
        },
      },
      {},
      [entry("1", 1), stop, entry("3", 3)],
    );
    expect(await flushOutbox(d)).toEqual({
      sent: 1,
      dropped: 2,
      blocked: false,
    });
    expect(vi.mocked(d.send).mock.calls.map(([e]) => e.id)).toEqual(["1", "3"]);
    expect(d.onDropped).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bun run test lib/data/outboxCore.test.ts lib/data/outboxFlush.test.ts`
Expected: FAIL — `Cannot find module './outboxCore'` và `Cannot find module './outboxFlush'`.

- [ ] **Step 4: Viết `lib/data/outboxCore.ts`**

```ts
import type { LogRow } from "@/lib/supabase/rows";

export type OutboxOp = "insert" | "update" | "delete" | "stop";

export type OutboxEntry = {
  id: string;
  table: "logs";
  op: OutboxOp;
  rowId: string;
  babyId: string;
  userId: string;
  // insert: the new row; update: the changed columns; stop: { ended_at }; delete: null
  row: Record<string, unknown> | null;
  createdAt: number;
  attempts: number;
};

export type Failure =
  { zeroRows: true } | { status: number; code: string | null; message: string };

export type FailureClass =
  { kind: "retry" } | { kind: "refresh" } | { kind: "drop"; reason: string };

const PERMISSION = "Bạn không có quyền thực hiện thao tác này";
const INVALID = "Dữ liệu không hợp lệ";
const DROP_CODES: Record<string, string> = {
  "42501": PERMISSION,
  "23505": "Đã có người bắt đầu trước",
  "23514": INVALID,
  "23503": "Bản ghi liên quan không còn",
  "22P02": INVALID,
};

// Spec §9: 401 is always temporary; known permanent errors are dropped; anything
// else is retried on the next flush.
export function classifyFailure(failure: Failure): FailureClass {
  if ("zeroRows" in failure) return { kind: "drop", reason: PERMISSION };
  const { status, code } = failure;
  if (status === 401 || code === "PGRST301" || code === "PGRST303")
    return { kind: "refresh" };
  if (code && code in DROP_CODES)
    return { kind: "drop", reason: DROP_CODES[code] };
  if (status === 403) return { kind: "drop", reason: PERMISSION };
  if (status === 400) return { kind: "drop", reason: INVALID };
  return { kind: "retry" };
}

function newRow(entry: OutboxEntry, nowIso: string): LogRow {
  const row = entry.row ?? {};
  return {
    id: entry.rowId,
    baby_id: entry.babyId,
    type: String(row.type),
    started_at: String(row.started_at),
    ended_at: (row.ended_at as string | null | undefined) ?? null,
    details: (row.details ?? {}) as LogRow["details"],
    note: (row.note as string | null | undefined) ?? null,
    created_by: entry.userId,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

const byNewest = (a: LogRow, b: LogRow) =>
  Date.parse(b.started_at) - Date.parse(a.started_at);

export function applyLogChange(
  rows: LogRow[],
  entry: OutboxEntry,
  nowIso: string,
): LogRow[] {
  switch (entry.op) {
    case "insert":
      if (rows.some((r) => r.id === entry.rowId)) return rows;
      return [newRow(entry, nowIso), ...rows].sort(byNewest);
    case "update":
      return rows
        .map((r) =>
          r.id === entry.rowId
            ? ({ ...r, ...entry.row, updated_at: nowIso } as LogRow)
            : r,
        )
        .sort(byNewest);
    case "delete":
      return rows.filter((r) => r.id !== entry.rowId);
    case "stop": {
      const endedAt = String(entry.row?.ended_at);
      return rows.map((r) =>
        r.id === entry.rowId && r.ended_at === null
          ? {
              ...r,
              ended_at:
                Date.parse(endedAt) < Date.parse(r.started_at)
                  ? r.started_at
                  : endedAt,
            }
          : r,
      );
    }
  }
}

// Applies a queued change to whatever React Query holds under logsKey:
// a plain list, or infinite-query pages (new rows go to the newest page).
export function applyToCache(
  data: unknown,
  entry: OutboxEntry,
  nowIso: string,
): unknown {
  if (Array.isArray(data))
    return applyLogChange(data as LogRow[], entry, nowIso);
  if (
    typeof data === "object" &&
    data !== null &&
    "pages" in data &&
    Array.isArray(data.pages)
  ) {
    const pages = data.pages as LogRow[][];
    return {
      ...data,
      pages: pages.map((page, index) =>
        entry.op === "insert" && index > 0
          ? page
          : applyLogChange(page, entry, nowIso),
      ),
    };
  }
  return data;
}

// Re-applies changes still waiting in the outbox on top of fresh server rows,
// so a refetch never hides them. Inserts are kept only when `inRange` accepts them.
export function overlayPending(
  rows: LogRow[],
  entries: OutboxEntry[],
  inRange: (row: LogRow) => boolean,
  nowIso: string,
): LogRow[] {
  return [...entries]
    .sort((a, b) => a.createdAt - b.createdAt)
    .reduce(
      (acc, entry) =>
        entry.op === "insert" && !inRange(newRow(entry, nowIso))
          ? acc
          : applyLogChange(acc, entry, nowIso),
      rows,
    );
}
```

- [ ] **Step 5: Viết `lib/data/outboxFlush.ts`**

```ts
import { classifyFailure, type Failure, type OutboxEntry } from "./outboxCore";

export type SendOutcome = { ok: true } | { ok: false; failure: Failure };

export type FlushDeps = {
  currentUserId(): Promise<string | null>;
  pending(userId: string): Promise<OutboxEntry[]>;
  send(entry: OutboxEntry): Promise<SendOutcome>;
  remove(id: string): Promise<void>;
  bumpAttempts(id: string): Promise<void>;
  refreshSession(): Promise<boolean>;
  onDropped(entry: OutboxEntry, reason: string): void;
  onSignedOut(): void;
};

export type FlushResult = { sent: number; dropped: number; blocked: boolean };

// Spec §9: oldest first; stop at the first temporary error so order is kept.
export async function flushOutbox(deps: FlushDeps): Promise<FlushResult> {
  const result: FlushResult = { sent: 0, dropped: 0, blocked: false };
  const userId = await deps.currentUserId();
  if (!userId) return result;
  // Rows whose insert was refused: later changes to them can only fail, so
  // they are dropped quietly instead of reporting a misleading reason.
  const refusedRows = new Set<string>();
  for (const entry of await deps.pending(userId)) {
    if (refusedRows.has(entry.rowId)) {
      await deps.remove(entry.id);
      result.dropped += 1;
      continue;
    }
    const outcome = await deps.send(entry);
    if (outcome.ok) {
      await deps.remove(entry.id);
      result.sent += 1;
      continue;
    }
    const verdict = classifyFailure(outcome.failure);
    if (verdict.kind === "drop") {
      await deps.remove(entry.id);
      if (entry.op === "insert") refusedRows.add(entry.rowId);
      deps.onDropped(entry, verdict.reason);
      result.dropped += 1;
      continue;
    }
    await deps.bumpAttempts(entry.id);
    result.blocked = true;
    if (verdict.kind === "refresh" && !(await deps.refreshSession()))
      deps.onSignedOut();
    break;
  }
  return result;
}
```

- [ ] **Step 6: Chạy test để thấy đạt**

Run: `bun run test lib/data/outboxCore.test.ts lib/data/outboxFlush.test.ts && bun run typecheck`
Expected: PASS — outboxCore 7 test, outboxFlush 6 test; không lỗi type.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(offline): outbox core with spec 9 error classes and ordered flush"
```

`git add -A` lần này đưa cả file plan M12 vào commit.

---

### Task 2: Lưu outbox trên máy và gửi lên Supabase

**Files:**

- Create: `lib/data/outboxEvents.ts`, `lib/data/outbox.ts`, `lib/data/outboxDeps.ts`, `components/sync/OutboxSync.tsx`
- Modify: `lib/data/localDb.ts` (toàn bộ), `components/Providers.tsx` (import, 1 dòng JSX)

**Interfaces:**

- Consumes: Task 1; `supabase()`; `localDb()`; RPC `stop_timer`
- Produces:
  - `localDb().outbox: Table<OutboxEntry, string>`
  - `flushRequests`, `droppedWrites` (mỗi cái có `emit(value)` và `listen(listener): () => void`)
  - `type LogChange = Pick<OutboxEntry, "op" | "rowId" | "babyId" | "userId" | "row">`
  - `enqueueLogChange(queryClient: QueryClient, change: LogChange): Promise<void>`
  - `withPending(babyId: string, rows: LogRow[], inRange: (row: LogRow) => boolean): Promise<LogRow[]>`
  - `outboxDeps(): FlushDeps`; `OutboxSync()` (không vẽ gì)

- [ ] **Step 1: Đọc tài liệu Next.js**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.

- [ ] **Step 2: Thay `lib/data/localDb.ts`**

```ts
import Dexie, { type Table } from "dexie";
import type { OutboxEntry } from "./outboxCore";

export type KvRow = { key: string; value: unknown };

class LocalDb extends Dexie {
  kv!: Table<KvRow, string>;
  outbox!: Table<OutboxEntry, string>;

  constructor() {
    super("be-yeu");
    this.version(1).stores({ kv: "key" });
    this.version(2).stores({
      kv: "key",
      outbox: "id, createdAt, userId, babyId",
    });
  }
}

let db: LocalDb | null = null;

// Created on first use so server-side prerendering never touches IndexedDB.
export function localDb(): LocalDb {
  db ??= new LocalDb();
  return db;
}
```

Dexie tự nâng database cũ (chỉ có `kv`) lên `version(2)` mà giữ nguyên dữ liệu `kv`.

- [ ] **Step 3: Tạo `lib/data/outboxEvents.ts`**

```ts
type Listener<T> = (value: T) => void;

function channel<T>() {
  const listeners = new Set<Listener<T>>();
  return {
    emit: (value: T) => listeners.forEach((listener) => listener(value)),
    listen: (listener: Listener<T>) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// Asks the outbox runner to flush now (after a new write, for example).
export const flushRequests = channel<void>();
// A queued write the server refused for good; the text is shown to the user.
export const droppedWrites = channel<string>();
```

- [ ] **Step 4: Tạo `lib/data/outbox.ts`**

```ts
"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { LogRow } from "@/lib/supabase/rows";
import { localDb } from "./localDb";
import { applyToCache, overlayPending, type OutboxEntry } from "./outboxCore";
import { flushRequests } from "./outboxEvents";

export type LogChange = Pick<
  OutboxEntry,
  "op" | "rowId" | "babyId" | "userId" | "row"
>;

let lastCreatedAt = 0;

// Strictly increasing, so a stop and a start queued in the same millisecond keep
// their order; seeded from the outbox so a clock that moved back after a reload
// cannot sort a new entry before older ones.
async function nextCreatedAt(): Promise<number> {
  const newest = await localDb().outbox.orderBy("createdAt").last();
  lastCreatedAt = Math.max(
    Date.now(),
    lastCreatedAt + 1,
    (newest?.createdAt ?? 0) + 1,
  );
  return lastCreatedAt;
}

export async function enqueueLogChange(
  queryClient: QueryClient,
  change: LogChange,
): Promise<void> {
  const entry: OutboxEntry = {
    ...change,
    id: crypto.randomUUID(),
    table: "logs",
    createdAt: await nextCreatedAt(),
    attempts: 0,
  };
  await localDb().outbox.add(entry);
  // A refetch already in flight would overwrite the optimistic change below.
  await queryClient.cancelQueries({ queryKey: ["logs", change.babyId] });
  const nowIso = new Date().toISOString();
  queryClient.setQueriesData({ queryKey: ["logs", change.babyId] }, (data) =>
    applyToCache(data, entry, nowIso),
  );
  flushRequests.emit();
}

export async function withPending(
  babyId: string,
  rows: LogRow[],
  inRange: (row: LogRow) => boolean,
): Promise<LogRow[]> {
  try {
    const entries = await localDb()
      .outbox.where("babyId")
      .equals(babyId)
      .toArray();
    return overlayPending(rows, entries, inRange, new Date().toISOString());
  } catch {
    return rows;
  }
}
```

- [ ] **Step 5: Tạo `lib/data/outboxDeps.ts`**

```ts
"use client";

import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { localDb } from "./localDb";
import type { Failure, OutboxEntry } from "./outboxCore";
import { droppedWrites } from "./outboxEvents";
import type { FlushDeps, SendOutcome } from "./outboxFlush";

type Result = {
  error: { code?: string; message: string } | null;
  status: number;
};

function failed(result: Result): SendOutcome {
  return {
    ok: false,
    failure: {
      status: result.status,
      code: result.error?.code ?? null,
      message: result.error?.message ?? "",
    } satisfies Failure,
  };
}

async function send(entry: OutboxEntry): Promise<SendOutcome> {
  const sb = supabase();
  const row = entry.row ?? {};
  switch (entry.op) {
    case "insert": {
      // ignoreDuplicates: a retry after a lost response must not overwrite the row.
      const result = await sb.from("logs").upsert(
        {
          id: entry.rowId,
          baby_id: entry.babyId,
          type: String(row.type),
          started_at: String(row.started_at),
          ended_at: (row.ended_at as string | null | undefined) ?? null,
          details: (row.details ?? {}) as NonNullable<Json>,
          note: (row.note as string | null | undefined) ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      return result.error ? failed(result) : { ok: true };
    }
    case "update": {
      const result = await sb
        .from("logs")
        .update(row as { details?: NonNullable<Json> })
        .eq("id", entry.rowId)
        .select("id");
      if (result.error) return failed(result);
      return result.data.length > 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    case "delete": {
      const result = await sb
        .from("logs")
        .delete()
        .eq("id", entry.rowId)
        .select("id");
      if (result.error) return failed(result);
      if (result.data.length > 0) return { ok: true };
      // 0 rows: gone already (another device deleted it) counts as done.
      const check = await sb.from("logs").select("id").eq("id", entry.rowId);
      if (check.error) return failed(check);
      return check.data.length === 0
        ? { ok: true }
        : { ok: false, failure: { zeroRows: true } };
    }
    case "stop": {
      const result = await sb.rpc("stop_timer", {
        p_log_id: entry.rowId,
        p_ended_at: String(row.ended_at),
      });
      return result.error ? failed(result) : { ok: true };
    }
  }
}

export function outboxDeps(): FlushDeps {
  return {
    async currentUserId() {
      const { data } = await supabase().auth.getSession();
      return data.session?.user.id ?? null;
    },
    pending: (userId) =>
      localDb().outbox.where("userId").equals(userId).sortBy("createdAt"),
    send,
    async remove(id) {
      await localDb().outbox.delete(id);
    },
    async bumpAttempts(id) {
      await localDb()
        .outbox.where("id")
        .equals(id)
        .modify((entry) => {
          entry.attempts += 1;
        });
    },
    async refreshSession() {
      const { error } = await supabase().auth.refreshSession();
      return !error;
    },
    onDropped: (entry, reason) => {
      console.warn(
        "Bỏ một thao tác chờ đồng bộ",
        entry.op,
        entry.rowId,
        reason,
      );
      droppedWrites.emit(reason);
    },
    onSignedOut: () => window.location.assign("/dang-nhap"),
  };
}
```

- [ ] **Step 6: Tạo `components/sync/OutboxSync.tsx`**

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { outboxDeps } from "@/lib/data/outboxDeps";
import { flushRequests } from "@/lib/data/outboxEvents";
import { flushOutbox } from "@/lib/data/outboxFlush";

const FLUSH_EVERY_MS = 30_000;

// One flush at a time across tabs (Web Locks, Safari 15.4+); a tab that finds
// the lock taken skips this round.
async function withOutboxLock<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!("locks" in navigator)) return fn();
  return navigator.locks.request(
    "be-yeu-outbox",
    { ifAvailable: true },
    async (lock) => (lock ? fn() : null),
  );
}

// Sends queued writes at start-up, when the network comes back, every 30 s
// while online, and right after each new write (spec §9).
export function OutboxSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const deps = outboxDeps();
    let running = false;
    let again = false;

    async function run() {
      if (!navigator.onLine) return;
      // A write queued during a flush is not in that flush's snapshot: run again after.
      if (running) {
        again = true;
        return;
      }
      running = true;
      let blocked = false;
      try {
        const result = await withOutboxLock(() => flushOutbox(deps));
        blocked = result?.blocked ?? false;
        if (result && result.sent + result.dropped > 0) {
          void queryClient.invalidateQueries({ queryKey: ["logs"] });
          void queryClient.invalidateQueries({ queryKey: ["first-log"] });
        }
      } catch (error) {
        console.warn("Không gửi được dữ liệu chờ đồng bộ", error);
      } finally {
        running = false;
        const rerun = again && !blocked;
        again = false;
        if (rerun) void run();
      }
    }

    void run();
    const timer = window.setInterval(() => void run(), FLUSH_EVERY_MS);
    const onOnline = () => void run();
    window.addEventListener("online", onOnline);
    const stopListening = flushRequests.listen(() => void run());
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      stopListening();
    };
  }, [queryClient]);

  return null;
}
```

- [ ] **Step 7: Gắn `OutboxSync` vào `components/Providers.tsx`**

Thêm `import { OutboxSync } from "@/components/sync/OutboxSync";` ngay sau dòng `import { useState, type ReactNode } from "react";`. Rồi thay

```tsx
      {children}
    </PersistQueryClientProvider>
```

bằng

```tsx
      <OutboxSync />
      {children}
    </PersistQueryClientProvider>
```

`OutboxSync` phải nằm trong `PersistQueryClientProvider` để dùng được `useQueryClient`.

- [ ] **Step 8: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  170 passed (170)` (157 của M1–M11 + 13); build thành công.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(offline): Dexie outbox table, Supabase sender and background flush"
```

---

### Task 3: Mọi thao tác ghi đi qua outbox, thử trên iPhone

**Files:**

- Modify:
  - `lib/data/logs.ts` (toàn bộ)
  - `components/home/HomeScreen.tsx`, `components/home/QuickEntrySheet.tsx`, `components/history/HistoryScreen.tsx`, `components/history/LogEditSheet.tsx`, `app/page.tsx`, `app/nhat-ky/page.tsx` (truyền `userId`)
  - `docs/device-checklist.md` (thêm bước 4)

**Interfaces:**

- Consumes: `enqueueLogChange`, `withPending` (Task 2)
- Produces:
  - Hook ghi `(babyId, userId)` như ở "Contracts".
  - `fetchLogsSince` và `fetchHistoryPage` phát lại mục còn chờ.

- [ ] **Step 1: Thay `lib/data/logs.ts`**

```ts
"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { historyPageRange, nextHistoryPage } from "@/lib/rules/history";
import type { LogType } from "@/lib/rules/logDetails";
import type { LogPatch } from "@/lib/rules/logForm";
import {
  planTimerPress,
  type RunningLog,
  type TimerButton,
} from "@/lib/rules/timer";
import { supabase } from "@/lib/supabase/client";
import type { LogRow } from "@/lib/supabase/rows";
import { enqueueLogChange, withPending } from "./outbox";

export const logsKey = (babyId: string) => ["logs", babyId] as const;

export async function fetchLogsSince(
  babyId: string,
  since: string,
): Promise<LogRow[]> {
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .or(`started_at.gte.${since},ended_at.is.null`)
    .order("started_at", { ascending: false });
  if (error) throw error;
  const from = Date.parse(since);
  return withPending(
    babyId,
    data,
    (row) => row.ended_at === null || Date.parse(row.started_at) >= from,
  );
}

export async function fetchRecentLogs(
  babyId: string,
  now: Date = new Date(),
  hours = 72,
): Promise<LogRow[]> {
  return fetchLogsSince(
    babyId,
    new Date(now.getTime() - hours * 3_600_000).toISOString(),
  );
}

export function useRecentLogs(babyId: string) {
  return useQuery({
    queryKey: logsKey(babyId),
    queryFn: () => fetchRecentLogs(babyId),
    refetchInterval: 30_000,
  });
}

export async function fetchFirstLogAt(babyId: string): Promise<string | null> {
  const { data, error } = await supabase()
    .from("logs")
    .select("started_at")
    .eq("baby_id", babyId)
    .order("started_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return data[0]?.started_at ?? null;
}

export function useFirstLogAt(babyId: string) {
  return useQuery({
    queryKey: ["first-log", babyId],
    queryFn: () => fetchFirstLogAt(babyId),
    staleTime: 10 * 60_000,
  });
}

export function toRunning(rows: LogRow[]): RunningLog[] {
  return rows
    .filter((row) => row.ended_at === null)
    .map((row) => ({
      id: row.id,
      type: row.type as LogType,
      details: (row.details ?? {}) as Record<string, unknown>,
    }));
}

// Every write goes through the outbox (spec §9): saved on the device first,
// shown at once, sent to Supabase by the outbox runner when online.
// networkMode "always" lets these run offline.
export function useTimerPress(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: async ({
      running,
      button,
    }: {
      running: RunningLog[];
      button: TimerButton;
    }) => {
      const now = new Date().toISOString();
      for (const action of planTimerPress(running, button)) {
        if (action.kind === "stop")
          await enqueueLogChange(queryClient, {
            op: "stop",
            rowId: action.id,
            babyId,
            userId,
            row: { ended_at: now },
          });
        else
          await enqueueLogChange(queryClient, {
            op: "insert",
            rowId: crypto.randomUUID(),
            babyId,
            userId,
            row: {
              type: action.type,
              started_at: now,
              ended_at: null,
              details: action.details,
            },
          });
      }
    },
  });
}

export function useStopTimer(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: (id: string) =>
      enqueueLogChange(queryClient, {
        op: "stop",
        rowId: id,
        babyId,
        userId,
        row: { ended_at: new Date().toISOString() },
      }),
  });
}

export function useAddInstant(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: ({
      type,
      details,
      at,
    }: {
      type: LogType;
      details: Record<string, unknown>;
      at: Date;
    }) => {
      const iso = at.toISOString();
      return enqueueLogChange(queryClient, {
        op: "insert",
        rowId: crypto.randomUUID(),
        babyId,
        userId,
        row: { type, started_at: iso, ended_at: iso, details },
      });
    },
  });
}

export async function fetchHistoryPage(
  babyId: string,
  page: number,
  now: Date,
): Promise<LogRow[]> {
  const range = historyPageRange(now, page);
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .gte("started_at", range.from)
    .lt("started_at", range.to)
    .order("started_at", { ascending: false });
  if (error) throw error;
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  return withPending(babyId, data, (row) => {
    const at = Date.parse(row.started_at);
    return at >= from && at < to;
  });
}

export function useHistoryLogs(babyId: string, dob: string) {
  return useInfiniteQuery({
    queryKey: [...logsKey(babyId), "history"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchHistoryPage(babyId, pageParam, new Date()),
    getNextPageParam: (_last, pages) =>
      nextHistoryPage(dob, new Date(), pages.length),
  });
}

export function useStatsLogs(babyId: string, since: string) {
  return useQuery({
    queryKey: [...logsKey(babyId), "stats", since],
    queryFn: () => fetchLogsSince(babyId, since),
  });
}

export function useSaveLog(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: ({
      id,
      type,
      patch,
    }: {
      id: string | null;
      type: LogType;
      patch: LogPatch;
    }) =>
      enqueueLogChange(
        queryClient,
        id
          ? { op: "update", rowId: id, babyId, userId, row: patch }
          : {
              op: "insert",
              rowId: crypto.randomUUID(),
              babyId,
              userId,
              row: { type, ...patch },
            },
      ),
  });
}

export function useDeleteLog(babyId: string, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: (id: string) =>
      enqueueLogChange(queryClient, {
        op: "delete",
        rowId: id,
        babyId,
        userId,
        row: null,
      }),
  });
}
```

Run: `bun run typecheck`
Expected: FAIL — 5 lỗi `Expected 2 arguments, but got 1` ở `LogEditSheet.tsx` (2), `HomeScreen.tsx` (2), `QuickEntrySheet.tsx` (1). Step 2 sửa các lỗi này.

- [ ] **Step 2: Truyền `userId` tới các hook ghi**

Mỗi khối dưới đây là một chỗ sửa: dòng `-` là dòng cũ (khớp đúng một lần trong file), dòng `+` là dòng mới, dòng có dấu cách đầu giữ nguyên:

1. `components/home/HomeScreen.tsx`:

```diff
 export function HomeScreen({
   baby,
   member,
+  userId,
 }: {
   baby: Baby;
   member: FamilyMember;
+  userId: string;
 }) {
```

2. `components/home/HomeScreen.tsx`:

```diff
-  const press = useTimerPress(baby.id);
+  const press = useTimerPress(baby.id, userId);
-  const stop = useStopTimer(baby.id);
+  const stop = useStopTimer(baby.id, userId);
```

3. `components/home/HomeScreen.tsx`:

```diff
           babyId={baby.id}
+          userId={userId}
           onClose={() => setSheet(null)}
```

4. `components/home/QuickEntrySheet.tsx`:

```diff
   type,
   babyId,
+  userId,
   onClose,
   initial,
   recentLogs = [],
 }: {
   type: InstantType;
   babyId: string;
+  userId: string;
```

5. `components/home/QuickEntrySheet.tsx`:

```diff
-  const add = useAddInstant(babyId);
+  const add = useAddInstant(babyId, userId);
```

6. `components/history/HistoryScreen.tsx`:

```diff
 export function HistoryScreen({
   baby,
   member,
+  userId,
 }: {
   baby: Baby;
   member: FamilyMember;
+  userId: string;
 }) {
```

7. `components/history/HistoryScreen.tsx`:

```diff
         <LogEditSheet
           babyId={baby.id}
+          userId={userId}
```

8. `components/history/LogEditSheet.tsx`:

```diff
 export function LogEditSheet({
   babyId,
+  userId,
   log,
```

9. `components/history/LogEditSheet.tsx`:

```diff
 }: {
   babyId: string;
+  userId: string;
   log: LogRow | null;
```

10. `components/history/LogEditSheet.tsx`:

```diff
-  const save = useSaveLog(babyId);
+  const save = useSaveLog(babyId, userId);
-  const remove = useDeleteLog(babyId);
+  const remove = useDeleteLog(babyId, userId);
```

11. `app/page.tsx`:

```diff
-      {({ ctx }) =>
+      {({ ctx, session }) =>
-        ctx?.baby ? <HomeScreen baby={ctx.baby} member={ctx.member} /> : null
+        ctx?.baby && session ? (
+          <HomeScreen
+            baby={ctx.baby}
+            member={ctx.member}
+            userId={session.user.id}
+          />
+        ) : null
       }
```

12. `app/nhat-ky/page.tsx`:

```diff
-      {({ ctx }) =>
+      {({ ctx, session }) =>
-        ctx?.baby ? <HistoryScreen baby={ctx.baby} member={ctx.member} /> : null
+        ctx?.baby && session ? (
+          <HistoryScreen
+            baby={ctx.baby}
+            member={ctx.member}
+            userId={session.user.id}
+          />
+        ) : null
       }
```


Run: `bun run typecheck`
Expected: không lỗi type.

- [ ] **Step 3: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  170 passed (170)` (gồm test chặn màu cứng); build thành công.

- [ ] **Step 4: 👤 Kiểm tra tay trên localhost**

Run: `bun run dev`. Mở `http://localhost:3000/` trong Claude in Chrome: bắt đầu bằng `tabs_context_mcp`, mở tab mới bằng `tabs_create_mcp`. Nếu Chrome không kết nối được, hỏi người dùng dùng trình duyệt nào trước khi đổi. Nhờ người dùng tự đăng nhập Google nếu cần. Mở thêm một cửa sổ ẩn danh cùng tài khoản (cửa sổ B) để xem phía "máy khác". Kiểm tra cùng người dùng:

1. **Online:** bấm "Bình", nhập 30 → Lưu → dòng "Bình 30 ml…" hiện ngay. Cửa sổ B thấy nó trong ≤ 3 giây.
2. **Chuyển offline** (DevTools → Network → Offline):
   - Bấm "Tã" → Lưu, làm hai lần → hai dòng tã hiện ngay. Cửa sổ B chưa thấy gì.
   - Bấm "Ngủ" → thẻ đang chạy hiện ngay. Bấm "Dừng" → thẻ biến mất, dòng "Ngủ · …" vào danh sách.
   - Trong console chạy `(await indexedDB.databases()).map((d) => d.name)` → có `be-yeu` (outbox nằm trong đó).
3. **Vẫn offline**, vào "Nhật ký":
   - Thấy các dòng vừa ghi.
   - Mở một dòng tã → thêm Ghi chú `offline` → Lưu → dòng có ghi chú.
   - Mở dòng tã còn lại → "Xóa bản ghi" → dòng biến mất.
   - Tải lại trang (vẫn offline; nếu trình duyệt không tải được trang dev khi offline thì bỏ qua bước tải lại) → các thay đổi vẫn còn.
4. **Bật mạng lại** (bỏ Offline) → trong ≤ 30 giây cửa sổ B thấy: 1 tã có ghi chú `offline`, 1 giấc ngủ đã kết thúc, tã kia đã bị xóa, đúng giờ đã bấm lúc offline.
5. **Xung đột:**
   - Cửa sổ A chuyển offline rồi bấm "Ngủ".
   - Cửa sổ B (online) cũng bấm "Ngủ".
   - Cửa sổ A bật mạng lại → console của A có `Bỏ một thao tác chờ đồng bộ insert … Đã có người bắt đầu trước`, rồi thẻ ngủ của A được thay bằng đồng hồ của B.
   - Dừng đồng hồ ngủ ở B.
6. **Dọn dẹp:** xóa các bản ghi thử ở Nhật ký.

- [ ] **Step 5: Thêm bước 4 vào `docs/device-checklist.md`**

Chèn ngay trước dòng `## Bước 7 — Tạm tắt (M11, phần nhắc bú)` (để các bước theo thứ tự 0, 2, 4, 7), cách một dòng trống:

```markdown
## Bước 4 — Ghi khi offline rồi đồng bộ (M12)

1. Mở Bé Yêu từ màn hình chính khi có mạng, rồi bật chế độ máy bay.
2. Trang chủ → "Tã" → Lưu, làm hai lần. Kỳ vọng: hai dòng tã hiện ngay trong "24 giờ qua".
3. Tắt chế độ máy bay, giữ app mở. Kỳ vọng: trong ≤ 30 giây máy thứ hai (hoặc Supabase → Table Editor → `logs`) thấy đủ hai tã, đúng giờ đã ghi lúc offline.
4. Xóa hai bản ghi tã thử ở Nhật ký.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         | Chỉ khi đã lên iOS 16.4 trở lên |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 6: Commit, deploy, thử trên iPhone**

```bash
git add -A && git commit -m "feat(offline): every log write goes through the outbox"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app.

Nhờ người dùng:
1. Đóng hẳn Bé Yêu rồi mở lại (để service worker và code mới tiếp quản).
2. Làm checklist bước 4 trên iPhone 16 và 17 Pro. Thêm iPhone 11 nếu đã lên iOS 16.4 trở lên.
3. Báo kết quả.

Ghi kết quả vào bảng bước 4, rồi chạy:

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist results for offline writes" && git push
```

---

## Ngoài phạm vi M12

- **M13:**
  - Chip "N mục chờ đồng bộ" ở đầu trang và thông báo "Không lưu được: <lý do>." (nghe `droppedWrites`).
  - Dấu ⏳ trên từng dòng còn chờ: trang chủ, Nhật ký, thẻ đang chạy.
  - Tắt các nút ghi cần mạng khi offline, kèm "Cần kết nối mạng": hồ sơ bé, khoảng cách cữ bú, thành viên, công tắc/tạm tắt/bật thông báo (§9 gạch cuối).
  - Chốt bảng checklist đợt 1 (bước 0–4 và 7) trên 3 máy.
- **Đợt 2–3:** `growth`, `vaccine_doses`, `milestones_achieved` đi qua cùng outbox. Hai bảng `vaccine_doses` và `milestones_achieved` upsert theo khóa tự nhiên và không gửi `id` (§9).
