# Baby Tracker Web — M13 (Hiển thị đồng bộ, nút cần mạng, chốt đợt 1) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Hoàn tất phần còn lại của spec §9 và chốt đợt phát hành 1 (§11):
- **Chờ đồng bộ:** dòng nào còn chờ gửi có dấu ⏳; đầu trang có chip "N mục chờ đồng bộ".
- **Bị từ chối:** thao tác bị server từ chối hiện "Không lưu được: <lý do>.".
- **Cần mạng:** khi offline, các phần ghi không qua outbox bị tắt, kèm câu "Cần kết nối mạng". Gồm hồ sơ bé, khoảng cách cữ bú, thành viên, thông báo, bật thông báo.
- **Checklist thiết bị:** đủ các bước 0–4 và 7 của §10.3, rồi ghi kết luận đợt 1.

**Architecture:**
- **Đọc trạng thái chờ:** dấu ⏳ và chip lấy dữ liệu từ bảng Dexie `outbox` (M12) qua `liveQuery`. Thông báo lỗi nghe tín hiệu `droppedWrites` (M12).
- **Trạng thái mạng:** lấy từ `onlineManager` của React Query, cái mà M9 đã cho bám `navigator.onLine`, đọc qua `useSyncExternalStore`.
- **Tắt khi offline:** các phần cần mạng được bọc trong `<fieldset disabled>`. Trình duyệt tự tắt mọi nút, ô nhập và ô chọn bên trong, nên không phải sửa từng component.

**Tech Stack:** như M1–M12. Không thêm thư viện, không đổi database.

**Milestones của đợt phát hành 1:**
- M1–M12: xong.
- **M13:** hiển thị đồng bộ, nút cần mạng, checklist thiết bị bước 1 và 3, kết luận đợt 1.
- Đợt 2 và 3 cần chạy `blueprint` riêng cho từng đợt rồi lập plan.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Dấu ⏳ (§9):** hiện cạnh mô tả của mỗi dòng có `logs.id` còn mục trong outbox của người đang đăng nhập.
  - Áp dụng ở danh sách "24 giờ qua" trên trang chủ, ở thẻ đồng hồ đang chạy, và ở các dòng của Nhật ký.
  - Dấu có `aria-label="Chờ đồng bộ"`.
- **Chip (§9):**
  - Chữ là "⏳ N mục chờ đồng bộ"; nằm trong `AuthGate need="baby"`, ngay trên nội dung trang.
  - Khi N = 0 thì ẩn.
  - N đếm số mục trong outbox, không đếm số dòng. Ví dụ: bấm Ngủ rồi Dừng là 2 mục.
- **Thông báo bị từ chối (§9):**
  - Chữ là "Không lưu được: <lý do>.", với lý do lấy từ `classifyFailure` của M12.
  - Hiện bên dưới chip với `role="alert"` và tự ẩn sau 6 giây.
  - Mục bị bỏ kéo theo (thay đổi sau của một insert bị từ chối, M12) không báo thêm.
  - Lý do bị từ chối gần nhất được giữ 60 giây (`takeRecentDrop`). Vì vậy một lần bị từ chối xảy ra khi chip chưa hiện vẫn được báo một lần khi trang hiện ra, ví dụ lúc mở app đang có mạng và bộ xả chạy trong màn "Đang tải…".
- **Nút cần mạng (§9 gạch cuối):**
  - Đợt 1 có các thao tác ghi không qua outbox:
    - Trang Cài đặt: hồ sơ bé, khoảng cách cữ bú, thành viên, công tắc và tạm tắt thông báo, bật/tắt thông báo trên máy.
    - Trang khai báo bé lần đầu.
    - Nút bật thông báo ở `/cai-app`.
  - Khi offline, các phần này bị tắt, và đầu khối có dòng "Cần kết nối mạng để thay đổi các mục dưới đây.".
  - Preflight của Tailwind bỏ hiệu ứng mờ mặc định của ô nhập bị tắt, nên `OnlineOnly` tự làm mờ `input`, `select`, `textarea` bị tắt (`opacity-50`). Nút có sẵn `disabled:opacity-50`.
  - Phần Giao diện (lưu trên máy) và Đăng xuất không bị tắt.
- **Trạng thái mạng:** dùng chung `onlineManager` với React Query. Nhờ vậy nút tắt đúng lúc query tạm dừng, và khi prerender coi như đang online.
- **Checklist (§10.3):**
  - File `docs/device-checklist.md` đã có bước 0, 2, 4, 7. M13 thêm bước 1 (cài PWA, chạy standalone) và bước 3 (hai máy thấy đồng hồ trong ≤ 3 giây).
  - Thêm bước 4b cho phần hiển thị và nút cần mạng của M13.
  - Bước 7 phần "nhắc tiêm vẫn đến" thuộc đợt 2.
- **Kết luận đợt 1 (§11):** đợt 1 đạt khi test tự động xanh, và bước 0–4 cùng bước 7 (phần nhắc bú) đạt trên cả 3 máy.
  - iPhone 11 cần iOS 16.4 trở lên. Theo M5, máy này đang ở iOS 16.3, trong khi bảng bước 0 ghi 16.4.
  - Hỏi người dùng phiên bản thật rồi ghi đúng vào bảng.
  - Nếu iPhone 11 chưa thể lên 16.4, ghi rõ trong kết luận rằng đợt 1 đạt trên 2/3 máy, kèm lý do. Việc chấp nhận kết quả đó do người dùng quyết định.

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

Riêng M13:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `components/sync/SyncBar.tsx`, `components/sync/PendingMark.tsx`, `components/OnlineOnly.tsx` phải đúng từng ký tự như plan này.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`914ec9c`):

- `localDb().outbox` (`"id, createdAt, userId, babyId"`), `OutboxEntry` (`lib/data/outboxCore.ts`), `droppedWrites` (`lib/data/outboxEvents.ts`) — M12
- `trackBrowserOnline` (`lib/data/onlineStatus.ts`), gọi trong `Providers` trước khi tạo `QueryClient` — M9
- `AuthGate` (gắn thanh tab cho `need="baby"`), `HomeScreen`/`HistoryScreen` (có prop `userId` từ M12), `RecentList`, `RunningCard`, `SettingsScreen` (các phần của M8, M10), `InstallGuide` (có `DevicePushControl` từ M10), `app/khai-bao-be/page.tsx`
- `docs/device-checklist.md` với bước 0, 2, 4, 7 (M1, M11, M12)

**Produces** (đợt 2–3 dùng):

- `pendingRowIds(entries): Set<string>` (`lib/data/outboxCore.ts`); `takeRecentDrop()` (`lib/data/outboxEvents.ts`); `useOutboxEntries(userId): OutboxEntry[]` (`lib/hooks/useOutboxEntries.ts`)
- `SyncBar({ userId })`, `PendingMark({ pending })` (`components/sync/`)
- `onlineStore` (`lib/data/onlineStatus.ts`), `useOnline(): boolean` (`lib/hooks/useOnline.ts`)
- `OnlineOnly({ children })` (`components/OnlineOnly.tsx`). Đợt 2–3 bọc các phần ảnh, nhạc, danh bạ khẩn cấp bằng component này.
- `RecentList` nhận thêm `pending: Set<string>`, `RunningCard` nhận thêm `pending: boolean`
- `docs/device-checklist.md` đủ bước 0, 1, 2, 3, 4, 4b, 7 và dòng kết luận đợt 1

## File Structure

```
lib/data/outboxCore.ts (+ test)          # sửa: thêm pendingRowIds
lib/hooks/useOutboxEntries.ts            # outbox của người đang đăng nhập, cập nhật trực tiếp
components/sync/SyncBar.tsx              # chip + thông báo bị từ chối
components/sync/PendingMark.tsx          # dấu ⏳
components/AuthGate.tsx, components/home/HomeScreen.tsx, components/home/RecentList.tsx, components/home/RunningCard.tsx, components/history/HistoryScreen.tsx   # sửa
lib/data/onlineStatus.ts (+ test)        # sửa: thêm onlineStore
lib/hooks/useOnline.ts                   # trạng thái mạng cho React
components/OnlineOnly.tsx                # fieldset tắt khi offline + "Cần kết nối mạng"
components/settings/SettingsScreen.tsx, app/khai-bao-be/page.tsx, components/install/InstallGuide.tsx   # sửa: bọc OnlineOnly
docs/device-checklist.md                 # sửa: bước 1, 3, 4b, kết luận
```

## Tasks

1. Dấu ⏳, chip chờ đồng bộ, thông báo bị từ chối
2. Tắt các phần cần mạng khi offline
3. Chốt checklist thiết bị đợt 1

---

### Task 1: Dấu ⏳, chip chờ đồng bộ, thông báo bị từ chối

**Files:**

- Create: `lib/hooks/useOutboxEntries.ts`, `components/sync/SyncBar.tsx`, `components/sync/PendingMark.tsx`
- Modify: `lib/data/outboxCore.ts`, `lib/data/outboxEvents.ts` (thêm ở cuối), `components/AuthGate.tsx`, `components/home/RecentList.tsx`, `components/home/RunningCard.tsx`, `components/home/HomeScreen.tsx`, `components/history/HistoryScreen.tsx`
- Test: thêm vào `lib/data/outboxCore.test.ts`; tạo `lib/data/outboxEvents.test.ts`

**Interfaces:**

- Consumes: `OutboxEntry`, `localDb().outbox`, `droppedWrites` (M12)
- Produces: `pendingRowIds(entries: OutboxEntry[]): Set<string>`; `takeRecentDrop(now?, withinMs = 60_000): string | null`; `useOutboxEntries(userId: string): OutboxEntry[]`; `SyncBar({ userId })`; `PendingMark({ pending: boolean })`; props mới `RecentList.pending: Set<string>`, `RunningCard.pending: boolean`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m13.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `914ec9c docs: device checklist results for offline writes`, hoặc một commit `docs:` ghi kết quả checklist của M11 nếu người dùng đã gửi.

- [ ] **Step 2: Viết test thất bại**

Trong `lib/data/outboxCore.test.ts`, thêm `pendingRowIds,` vào danh sách import từ `"./outboxCore"` (ngay sau `overlayPending,`), rồi thêm vào cuối file:

```ts
describe("pendingRowIds", () => {
  it("collects each waiting row once", () => {
    const ids = pendingRowIds([
      entry("insert", "a", diaper, 1),
      entry("stop", "a", { ended_at: NOW }, 2),
      entry("delete", "b", null, 3),
    ]);
    expect([...ids].sort()).toEqual(["a", "b"]);
  });
});
```

Tạo `lib/data/outboxEvents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { droppedWrites, takeRecentDrop } from "./outboxEvents";

describe("takeRecentDrop", () => {
  it("hands over the last refused write once, and only while it is recent", () => {
    droppedWrites.emit("Đã có người bắt đầu trước");
    expect(takeRecentDrop()).toBe("Đã có người bắt đầu trước");
    expect(takeRecentDrop()).toBeNull();
    droppedWrites.emit("Dữ liệu không hợp lệ");
    expect(takeRecentDrop(Date.now() + 61_000)).toBeNull();
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bun run test lib/data/outboxCore.test.ts lib/data/outboxEvents.test.ts`
Expected: FAIL — `TypeError: pendingRowIds is not a function` và `TypeError: takeRecentDrop is not a function`.

- [ ] **Step 4: Thêm vào cuối `lib/data/outboxCore.ts` và `lib/data/outboxEvents.ts`**

Cuối `lib/data/outboxCore.ts`:

```ts
// Ids of log rows that still have a change waiting in the outbox.
export function pendingRowIds(entries: OutboxEntry[]): Set<string> {
  return new Set(entries.map((entry) => entry.rowId));
}
```

Cuối `lib/data/outboxEvents.ts`:

```ts
// The last refused write, kept briefly so a notice raised while SyncBar was not
// on screen (cold start, "Đang tải…") still reaches the user once.
let lastDrop: { reason: string; at: number } | null = null;
droppedWrites.listen((reason) => {
  lastDrop = { reason, at: Date.now() };
});

export function takeRecentDrop(
  now: number = Date.now(),
  withinMs = 60_000,
): string | null {
  const drop = lastDrop;
  lastDrop = null;
  return drop && now - drop.at <= withinMs ? drop.reason : null;
}
```

Run: `bun run test lib/data/outboxCore.test.ts lib/data/outboxEvents.test.ts`
Expected: PASS — outboxCore 8 test, outboxEvents 1 test.

- [ ] **Step 5: Tạo `lib/hooks/useOutboxEntries.ts`, `components/sync/SyncBar.tsx`, `components/sync/PendingMark.tsx`**

`lib/hooks/useOutboxEntries.ts`:

```ts
"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { localDb } from "@/lib/data/localDb";
import type { OutboxEntry } from "@/lib/data/outboxCore";

// The signed-in user's queued writes, updated live as the outbox changes.
export function useOutboxEntries(userId: string): OutboxEntry[] {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  useEffect(() => {
    const subscription = liveQuery(() =>
      localDb().outbox.where("userId").equals(userId).sortBy("createdAt"),
    ).subscribe({ next: setEntries, error: () => setEntries([]) });
    return () => subscription.unsubscribe();
  }, [userId]);
  return entries;
}
```

`components/sync/SyncBar.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { droppedWrites, takeRecentDrop } from "@/lib/data/outboxEvents";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";

const NOTICE_MS = 6000;

export function SyncBar({ userId }: { userId: string }) {
  const count = useOutboxEntries(userId).length;
  const [dropped, setDropped] = useState<string | null>(null);

  useEffect(() => {
    setDropped(takeRecentDrop());
    return droppedWrites.listen((reason) => {
      takeRecentDrop();
      setDropped(reason);
    });
  }, []);
  useEffect(() => {
    if (!dropped) return;
    const timer = window.setTimeout(() => setDropped(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [dropped]);

  if (count === 0 && !dropped) return null;
  return (
    <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pt-4">
      {count > 0 && (
        <p
          role="status"
          className="self-start rounded-full bg-warn-soft px-3 py-1 text-sm text-warn-ink"
        >
          ⏳ {count} mục chờ đồng bộ
        </p>
      )}
      {dropped && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft p-3 text-danger-ink"
        >
          Không lưu được: {dropped}.
        </p>
      )}
    </div>
  );
}
```

`components/sync/PendingMark.tsx`:

```tsx
export function PendingMark({ pending }: { pending: boolean }) {
  if (!pending) return null;
  return (
    <span role="img" aria-label="Chờ đồng bộ" title="Chờ đồng bộ">
      ⏳
    </span>
  );
}
```

- [ ] **Step 6: Gắn vào các màn hình**

Mỗi khối dưới đây là một chỗ sửa: dòng `-` là dòng cũ (khớp đúng một lần trong file), dòng `+` là dòng mới, dòng có dấu cách đầu giữ nguyên:

1. `components/AuthGate.tsx`:

```diff
 import { TabBar } from "@/components/nav/TabBar";
+import { SyncBar } from "@/components/sync/SyncBar";
```

2. `components/AuthGate.tsx`:

```diff
+      {session && <SyncBar userId={session.user.id} />}
       <div className="pb-16">{content}</div>
```

3. `components/home/RecentList.tsx`:

```diff
+import { PendingMark } from "@/components/sync/PendingMark";
 import { describeLog } from "@/lib/rules/describeLog";
```

4. `components/home/RecentList.tsx`:

```diff
   logs,
   now,
   nameOf,
+  pending,
 }: {
   logs: LogRow[];
   now: Date;
   nameOf: (userId: string) => string;
+  pending: Set<string>;
 }) {
```

5. `components/home/RecentList.tsx`:

```diff
-          <span className="flex-1">{describeLog(log, now)}</span>
+          <span className="flex-1">
+            {describeLog(log, now)}{" "}
+            <PendingMark pending={pending.has(log.id)} />
+          </span>
```

6. `components/home/RunningCard.tsx`:

```diff
+import { PendingMark } from "@/components/sync/PendingMark";
 import { describeLog } from "@/lib/rules/describeLog";
```

7. `components/home/RunningCard.tsx`:

```diff
   busy,
   onStop,
+  pending,
 }: {
   log: LogRow;
   who: string;
   now: Date;
   busy: boolean;
   onStop: () => void;
+  pending: boolean;
 }) {
```

8. `components/home/RunningCard.tsx`:

```diff
-        <p className="font-medium">{describeLog(log, now)}</p>
+        <p className="font-medium">
+          {describeLog(log, now)} <PendingMark pending={pending} />
+        </p>
```

9. `components/home/HomeScreen.tsx`:

```diff
+import { pendingRowIds } from "@/lib/data/outboxCore";
 import { useNow } from "@/lib/hooks/useNow";
+import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
```

10. `components/home/HomeScreen.tsx`:

```diff
   const stop = useStopTimer(baby.id, userId);
+  const pending = pendingRowIds(useOutboxEntries(userId));
```

11. `components/home/HomeScreen.tsx`:

```diff
           onStop={() => stop.mutate(log.id)}
+          pending={pending.has(log.id)}
```

12. `components/home/HomeScreen.tsx`:

```diff
-          <RecentList logs={recentRows} now={now} nameOf={nameOf} />
+          <RecentList
+            logs={recentRows}
+            now={now}
+            nameOf={nameOf}
+            pending={pending}
+          />
```

13. `components/history/HistoryScreen.tsx`:

```diff
+import { PendingMark } from "@/components/sync/PendingMark";
+import { pendingRowIds } from "@/lib/data/outboxCore";
 import { useNow } from "@/lib/hooks/useNow";
+import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
```

14. `components/history/HistoryScreen.tsx`:

```diff
   const members = useMembers(baby.family_id);
+  const pending = pendingRowIds(useOutboxEntries(userId));
   const [filter, setFilter] = useState<HistoryFilter>("all");
```

15. `components/history/HistoryScreen.tsx`:

```diff
                   <span className="flex-1">
-                    {describeLog(log, now)}
+                    {describeLog(log, now)}{" "}
+                    <PendingMark pending={pending.has(log.id)} />
```


- [ ] **Step 7: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  172 passed (172)` (170 của M1–M12 + 2, gồm test chặn màu cứng); build thành công.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(offline): pending marks, sync chip and refused-write notice"
```

`git add -A` lần này đưa cả file plan M13 vào commit. Nếu `git status` có thay đổi không do mình làm (ví dụ session M11 ghi kết quả checklist), chỉ `git add` các file của task này và báo người dùng.

---

### Task 2: Tắt các phần cần mạng khi offline

**Files:**

- Create: `lib/hooks/useOnline.ts`, `components/OnlineOnly.tsx`
- Modify: `lib/data/onlineStatus.ts` (thêm ở cuối), `components/settings/SettingsScreen.tsx`, `app/khai-bao-be/page.tsx`, `components/install/InstallGuide.tsx`
- Test: thêm vào `lib/data/onlineStatus.test.ts`

**Interfaces:**

- Consumes: `onlineManager` (React Query, đã được `trackBrowserOnline` của M9 cho bám `navigator.onLine`)
- Produces:
  - `onlineStore = { subscribe(onChange): () => void; getSnapshot(): boolean; getServerSnapshot(): true }`
  - `useOnline(): boolean`
  - `OnlineOnly({ children })`

- [ ] **Step 1: Viết test thất bại**

Trong `lib/data/onlineStatus.test.ts`, đổi dòng import vitest thành `import { afterEach, describe, expect, it, vi } from "vitest";` và dòng import thứ ba thành `import { onlineStore, trackBrowserOnline } from "./onlineStatus";`, rồi thêm vào cuối file:

```ts
describe("onlineStore", () => {
  it("reports React Query's online state and tells subscribers when it changes", () => {
    const onChange = vi.fn();
    const unsubscribe = onlineStore.subscribe(onChange);
    onlineManager.setOnline(false);
    expect(onlineStore.getSnapshot()).toBe(false);
    expect(onChange).toHaveBeenCalled();
    unsubscribe();
    expect(onlineStore.getServerSnapshot()).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bun run test lib/data/onlineStatus.test.ts`
Expected: FAIL — `TypeError: Cannot read properties of undefined (reading 'subscribe')` (vì `onlineStore` chưa có).

- [ ] **Step 3: Thêm `onlineStore` vào cuối `lib/data/onlineStatus.ts`**

```ts
// useSyncExternalStore source for React Query's online state; prerender counts as online.
export const onlineStore = {
  subscribe: (onChange: () => void) =>
    onlineManager.subscribe(() => onChange()),
  getSnapshot: () => onlineManager.isOnline(),
  getServerSnapshot: () => true,
};
```

Run: `bun run test lib/data/onlineStatus.test.ts`
Expected: PASS — 2 test.

- [ ] **Step 4: Tạo `lib/hooks/useOnline.ts` và `components/OnlineOnly.tsx`**

`lib/hooks/useOnline.ts`:

```ts
"use client";

import { useSyncExternalStore } from "react";
import { onlineStore } from "@/lib/data/onlineStatus";

export function useOnline(): boolean {
  return useSyncExternalStore(
    onlineStore.subscribe,
    onlineStore.getSnapshot,
    onlineStore.getServerSnapshot,
  );
}
```

`components/OnlineOnly.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { useOnline } from "@/lib/hooks/useOnline";

// Spec §9: writes that skip the outbox need the network. A disabled fieldset
// turns off every button, input and select inside it at once.
export function OnlineOnly({ children }: { children: ReactNode }) {
  const online = useOnline();
  return (
    <fieldset
      disabled={!online}
      className="flex min-w-0 flex-col gap-6 [&_:is(input,select,textarea):disabled]:opacity-50"
    >
      {!online && (
        <p role="status" className="rounded-xl bg-warn-soft p-3 text-warn-ink">
          Cần kết nối mạng để thay đổi các mục dưới đây.
        </p>
      )}
      {children}
    </fieldset>
  );
}
```

- [ ] **Step 5: Bọc các phần cần mạng**

Mỗi khối dưới đây là một chỗ sửa (cùng cách đọc như Task 1 Step 6):

1. `components/settings/SettingsScreen.tsx`:

```diff
+import { OnlineOnly } from "@/components/OnlineOnly";
 import { BabyProfileSection } from "./BabyProfileSection";
```

2. `components/settings/SettingsScreen.tsx`:

```diff
+      <OnlineOnly>
-      <BabyProfileSection baby={baby} isOwner={isOwner} />
+        <BabyProfileSection baby={baby} isOwner={isOwner} />
-      <FeedIntervalSection baby={baby} isOwner={isOwner} />
+        <FeedIntervalSection baby={baby} isOwner={isOwner} />
-      <MembersSection me={member} />
+        <MembersSection me={member} />
-      <NotificationsSection userId={userId} />
+        <NotificationsSection userId={userId} />
+      </OnlineOnly>
```

3. `app/khai-bao-be/page.tsx`:

```diff
 import { BabyForm } from "@/components/baby/BabyForm";
+import { OnlineOnly } from "@/components/OnlineOnly";
```

4. `app/khai-bao-be/page.tsx`:

```diff
+            <OnlineOnly>
-            <BabyForm familyId={ctx.family.id} />
+              <BabyForm familyId={ctx.family.id} />
+            </OnlineOnly>
```

5. `components/install/InstallGuide.tsx`:

```diff
+import { OnlineOnly } from "@/components/OnlineOnly";
 import { DevicePushControl } from "@/components/push/DevicePushControl";
```

6. `components/install/InstallGuide.tsx`:

```diff
+          <OnlineOnly>
-          <DevicePushControl />
+            <DevicePushControl />
+          </OnlineOnly>
```


- [ ] **Step 6: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  173 passed (173)`; build thành công.

- [ ] **Step 7: 👤 Kiểm tra tay trên localhost**

Run: `bun run dev`. Mở `http://localhost:3000/` trong Claude in Chrome: bắt đầu bằng `tabs_context_mcp`, mở tab mới bằng `tabs_create_mcp`. Nếu Chrome không kết nối được, hỏi người dùng dùng trình duyệt nào trước khi đổi. Nhờ người dùng tự đăng nhập Google nếu cần. Kiểm tra cùng người dùng:

1. **Đang online:** không có chip, không có dấu ⏳. Cài đặt bấm và sửa được bình thường.
2. **Chuyển offline** (DevTools → Network → Offline):
   - Bấm "Tã" → Lưu → dòng tã mới có ⏳, đầu trang có chip "⏳ 1 mục chờ đồng bộ".
   - Bấm "Ngủ" → thẻ đang chạy có ⏳, chip "⏳ 2 mục chờ đồng bộ".
   - Bấm Dừng → chip "⏳ 3 mục chờ đồng bộ".
   - Vào Nhật ký → các dòng mới có ⏳.
3. **Vẫn offline, vào Cài đặt:**
   - Đầu khối có "Cần kết nối mạng để thay đổi các mục dưới đây.".
   - Ô tên bé, nút Lưu, ô chọn khoảng cách cữ bú, form thêm thành viên, công tắc và nút tạm tắt thông báo đều mờ, và không bấm hay sửa được.
   - Phần Giao diện đổi được (bấm "Tối" rồi "Theo hệ thống").
4. **Bật mạng lại** → trong ≤ 30 giây chip và mọi dấu ⏳ biến mất, các nút Cài đặt bấm lại được.
5. **Thông báo bị từ chối:**
   - Cửa sổ A chuyển offline rồi bấm "Ngủ".
   - Một cửa sổ ẩn danh B (cùng tài khoản, online) bấm "Ngủ".
   - A bật mạng lại → A hiện "Không lưu được: Đã có người bắt đầu trước." trong vài giây rồi tự ẩn.
   - Dừng đồng hồ ở B.
6. **Dọn dẹp:** xóa các bản ghi thử ở Nhật ký.

- [ ] **Step 8: Commit và deploy**

```bash
git add -A && git commit -m "feat(offline): disable network-only settings while offline"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app.

---

### Task 3: Chốt checklist thiết bị đợt 1

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: bản deploy của Task 2; kết quả iPhone của M11 (bước 2, 7) và M12 (bước 4) nếu đã có trong file
- Produces: checklist đủ bước 0, 1, 2, 3, 4, 4b, 7 và dòng kết luận đợt 1

- [ ] **Step 1: Thêm bước 1, 3, 4b vào `docs/device-checklist.md`**

Chèn bước 1 ngay trước dòng `## Bước 2 — Nhắc bú (M11)`, cách một dòng trống:

```markdown
## Bước 1 — Cài PWA và chạy standalone (M13)

1. Safari mở `https://bunkid.vercel.app` → Chia sẻ → Thêm vào MH chính → mở từ biểu tượng.
2. Kỳ vọng: app mở toàn màn hình, không có thanh địa chỉ Safari; Cài đặt → "Cài Bé Yêu lên màn hình chính" ghi "Bé Yêu đã được cài và đang chạy từ màn hình chính."

| Máy           | iOS | Kết quả | Ghi chú                         |
| ------------- | --- | ------- | ------------------------------- |
| iPhone 11     |     |         | Chỉ khi đã lên iOS 16.4 trở lên |
| iPhone 16     |     |         |                                 |
| iPhone 17 Pro |     |         |                                 |
```

Chèn bước 3 ngay trước dòng `## Bước 4 — Ghi khi offline rồi đồng bộ (M12)`:

```markdown
## Bước 3 — Hai máy thấy nhau trong 3 giây (M13)

1. Mở Bé Yêu trên hai máy cùng gia đình (hai iPhone, hoặc iPhone và máy tính).
2. Máy A bấm "Ngủ". Kỳ vọng: máy B hiện thẻ "Ngủ · … (đang chạy)" trong ≤ 3 giây.
3. Máy B bấm "Dừng". Kỳ vọng: thẻ trên máy A biến mất trong ≤ 3 giây. Xóa bản ghi ngủ thử ở Nhật ký.

| Máy           | iOS | Kết quả | Ghi chú                         |
| ------------- | --- | ------- | ------------------------------- |
| iPhone 11     |     |         | Chỉ khi đã lên iOS 16.4 trở lên |
| iPhone 16     |     |         |                                 |
| iPhone 17 Pro |     |         |                                 |
```

Chèn bước 4b ngay trước dòng `## Bước 7 — Tạm tắt (M11, phần nhắc bú)`:

```markdown
## Bước 4b — Hiển thị chờ đồng bộ và nút cần mạng (M13)

1. Bật chế độ máy bay. Trang chủ → "Tã" → Lưu. Kỳ vọng: dòng tã mới có dấu ⏳; đầu trang có chip "⏳ 1 mục chờ đồng bộ".
2. Vẫn chế độ máy bay, vào Cài đặt. Kỳ vọng: dòng "Cần kết nối mạng để thay đổi các mục dưới đây."; nút Lưu của hồ sơ bé, khoảng cách cữ bú, thêm thành viên, công tắc thông báo đều mờ, bấm không được. Phần Giao diện vẫn đổi được.
3. Tắt chế độ máy bay. Kỳ vọng: trong ≤ 30 giây chip và dấu ⏳ biến mất, các nút trong Cài đặt bấm lại được. Xóa bản ghi tã thử.

| Máy           | iOS | Kết quả | Ghi chú                         |
| ------------- | --- | ------- | ------------------------------- |
| iPhone 11     |     |         | Chỉ khi đã lên iOS 16.4 trở lên |
| iPhone 16     |     |         |                                 |
| iPhone 17 Pro |     |         |                                 |
```

Không xóa hay đổi kết quả đã ghi trong các bảng cũ.

Run: `grep -n '^## ' docs/device-checklist.md`
Expected: các tiêu đề theo thứ tự Bước 0, 1, 2, 3, 4, 4b, 7.

- [ ] **Step 2: 👤 Hỏi người dùng phiên bản iOS và chạy các bước còn trống**

Hỏi người dùng phiên bản iOS hiện tại của từng máy (Cài đặt → Cài đặt chung → Giới thiệu). Nhờ người dùng làm trên iPhone 16 và iPhone 17 Pro, và cả iPhone 11 nếu đã lên iOS 16.4 trở lên:
- Bước 1, 3, 4b.
- Bước nào còn trống trong file. Bước 2 và 7 là của M11, nếu người dùng chưa gửi kết quả.
- Với iPhone 11 đã lên 16.4: làm lại cả những bước đang ghi "Bỏ qua" (ví dụ bước 4 của M12).

Ghi kết quả từng máy vào đúng bảng. Được thay ô "Bỏ qua" bằng kết quả mới; các kết quả "Đạt"/"Không đạt" đã có thì giữ nguyên. Không tự điền "Đạt" khi người dùng chưa xác nhận.

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: `All tests successful.` (pgTAP `001`–`005`). §11 cần cả test pgTAP của §10.2 xanh; ghi kết quả này vào kết luận.

- [ ] **Step 3: Ghi kết luận đợt 1**

Thêm ngay dưới dòng "Thiết bị: iPhone 11, …" ở đầu file một đoạn theo đúng kết quả thật, thay `<…>` bằng giá trị thật:

```markdown
**Kết luận đợt 1 (<ngày>):** <Đạt | Chưa đạt> — Vitest <số> test và pgTAP 001–005 xanh; bước 0–4 và 7 (nhắc bú) đạt trên <các máy>. <Ghi chú, ví dụ: iPhone 11 đang iOS 16.3, chưa nhận được Web Push; người dùng chấp nhận / sẽ cập nhật sau.>
```

- [ ] **Step 4: Commit và push**

```bash
git add docs/device-checklist.md && git commit -m "docs: release 1 device checklist and conclusion" && git push
```

Expected: commit lên `origin/main`. Đợt phát hành 1 của unit `web` hoàn tất. Đợt 2 bắt đầu bằng `blueprint` cho phần tăng trưởng, tiêm chủng, triệu chứng và khẩn cấp.

---

## Ngoài phạm vi M13

- **Đợt 2 (§11):**
  - Tăng trưởng WHO; tiêm chủng (kèm chọn vaccine ở §6.1); push `vaccine` và `wake`.
  - Phân loại triệu chứng và bài bệnh thường gặp; thông tin khẩn cấp (bọc bằng `OnlineOnly`).
  - Bảng `growth`, `vaccine_doses`, `milestones_achieved` đi qua outbox.
- **Đợt 3:** nhạc YouTube, bồng bế, mốc phát triển, hút sữa, tummy time, ảnh, tiếng ồn trắng, báo cáo.
- **Unit `ios`:** chạy `blueprint` riêng.
