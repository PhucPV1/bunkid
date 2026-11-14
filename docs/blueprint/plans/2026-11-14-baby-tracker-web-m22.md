# Baby Tracker Web — M22 (Hút sữa, tummy time, tiếng ồn trắng) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Mở đầu đợt 3: hàng nút phụ "Hút sữa · Tummy time" ở trang chủ (spec §6.2, §6.13) — dừng hút sữa thì hỏi ml trái/phải; Thống kê có thêm tổng ml hút/ngày và tổng phút tummy/ngày; trang `/on-trang` phát tiếng ồn trắng, hồng, nâu bằng Web Audio với hẹn giờ tắt (§6.12).

**Architecture:**
- **Hút sữa, tummy:** loại `pump`/`tummy` và `planTimerPress` đã có từ đợt 1; M22 thêm nút, `PumpSheet` (hỏi ml sau khi dừng), `useSetPumpAmounts` (ghi `details` qua outbox bằng thao tác `update`), và quy tắc thuần `parsePumpAmounts`.
- **Thống kê:** `dailyStats` thêm `pumpMl`, `tummyMinutes` (tummy cắt theo nửa đêm VN như giờ ngủ); hai tab mới "Hút sữa", "Tummy".
- **Tiếng ồn trắng:** quy tắc thuần `lib/rules/noise.ts` sinh mẫu âm (white; pink theo bộ lọc Paul Kellet; brown theo tích phân rò) vào buffer 2 giây và nối vòng không tiếng "tách" (sinh dư một đoạn rồi trộn vào đầu buffer). `NoiseScreen` dựng `AudioContext` → `AudioBufferSourceNode` (lặp) → `GainNode`; hẹn giờ tắt và nhỏ dần được lên lịch trên đồng hồ âm thanh (`linearRampToValueAtTime`, `source.stop(end)`), nên vẫn chạy khi trang bị iOS tạm dừng lúc khóa màn hình.

**Tech Stack:** như M1–M21. Không thêm gói nào.

**Milestones của đợt phát hành 3 (spec §11):**
- **M22 (plan này):** hút sữa, tummy time, tiếng ồn trắng, checklist bước 6.
- M23: nhạc YouTube (`music_links`, `parseYouTubeUrl`, mở app YouTube) và bồng bế; checklist bước 5.
- M24: ảnh (`photos`, bucket Storage, nén ảnh trên máy).
- M25: mốc phát triển (`milestones_achieved` qua outbox, gắn ảnh).
- M26: báo cáo cho bác sĩ, chốt đợt 3.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Hỏi ml khi dừng hút sữa (§6.13):** dừng ở nút "Dừng hút sữa" hoặc nút "Dừng" của thẻ Đang chạy đều kết thúc đồng hồ ngay (như các loại khác), rồi — nếu người bấm sửa được bản ghi đó (chủ gia đình hoặc người đã bắt đầu, theo RLS `logs`) — mở sheet "Đã hút được bao nhiêu?" với ô Bên trái, Bên phải (ml, số nguyên 0–500, để trống được). "Lưu" ghi `details = { mlLeft?, mlRight? }` bằng thao tác `update` của outbox (chạy offline); "Bỏ qua" để `details` rỗng. Sửa lại sau đó trong Nhật ký như mọi bản ghi.
- **Thống kê:** "Sữa hút (ml)" = tổng `mlLeft + mlRight` của các lần hút bắt đầu trong ngày VN; "Tummy" = số phút tummy giao với ngày VN (lần đang chạy tính tới hiện tại), như cách tính giờ ngủ. Thanh tab Thống kê thành lưới 5 cột, chữ nhỏ hơn, để vừa màn hình 375 pt.
- **Tiếng ồn trắng (§6.12):** buffer 2 giây, 1 kênh, `loop = true`; sinh thêm 50 ms rồi trộn dần vào 50 ms đầu, nên mẫu cuối nối liền mẫu đầu (không có tiếng "tách" khi lặp). `AudioContext` tạo và `resume()` ngay trong lần bấm Phát; khi trạng thái không còn `running` (iOS ngắt âm) thì hiện "Âm đang bị ngắt. Bấm Dừng rồi Phát để chạy lại.". Âm lượng 5–100% (mặc định 50%). Hẹn giờ Không / 15 / 30 / 60 phút (mặc định 30); 10 giây cuối giảm âm lượng tuyến tính rồi dừng; cả hai được lên lịch trên đồng hồ âm thanh, còn `setInterval` chỉ cập nhật dòng "Tắt sau m:ss". Đổi âm lượng thì lên lịch lại. Bấm Phát thì đặt `navigator.audioSession.type = 'playback'` nếu có. Đổi loại âm hoặc hẹn giờ khi đang phát thì phát lại ngay với lựa chọn mới. Không dùng file âm thanh, không dùng Media Session. Rời trang thì dừng.
- **Giới hạn iOS:** iOS có thể dừng Web Audio khi khóa màn hình; checklist bước 6 ghi kết quả từng máy và nếu dừng thì ghi vào README (không chặn phát hành).
- **Bước của người dùng:** checklist bước 6 và 15 cần điện thoại thật; ghi là đang chờ.

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

Riêng M22:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `components/home/PumpSheet.tsx`, `components/noise/NoiseScreen.tsx`, `lib/rules/pumpForm.ts`, `lib/rules/noise.ts` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, tới commit `b67710b` của M21):

- Đợt 1: `LogType` gồm `pump`, `tummy`; `detailsSchemas.pump` (`mlLeft?`, `mlRight?` 0–500); `TimerButton`/`planTimerPress` (`lib/rules/timer.ts`); `useTimerPress`, `useStopTimer`, `enqueueLogChange` (op `update`); `ActionGrid`, `RunningCard`, `HomeScreen`; `dailyStats`, `chartRows`, `STATS_TABS`, `StatsScreen`; `describeLog` (đã hiện "Hút sữa · … · N ml")
- `TOOL_ITEMS` (`lib/nav.ts`), `sw/sw.template.js`, `docs/device-checklist.md`

**Produces** (M26 — báo cáo — dùng):

- `parsePumpAmounts` (`lib/rules/pumpForm.ts`); `useSetPumpAmounts(babyId, userId)` (`lib/data/logs.ts`); `PumpSheet`
- `DayStat.pumpMl`, `DayStat.tummyMinutes`; `StatsTab` thêm `"pump" | "tummy"`
- `lib/rules/noise.ts`: `NoiseColor`, `NOISE_OPTIONS`, `TIMER_OPTIONS`, `FADE_MS`, `BUFFER_SECONDS`, `fillNoise`, `seamlessNoise`, `formatRemaining`; `NoiseScreen`; trang `/on-trang`
- Checklist bước 6 và 15

## File Structure

```
lib/rules/pumpForm.ts (+ test)           # ml hút mỗi bên
lib/data/logs.ts                         # sửa: useSetPumpAmounts
components/home/ActionGrid.tsx, PumpSheet.tsx, HomeScreen.tsx   # hàng nút phụ, hỏi ml
lib/rules/dailyStats.ts (+ test), components/stats/StatsScreen.tsx   # tab Hút sữa, Tummy
lib/rules/noise.ts (+ test)              # sinh âm, nối vòng
components/noise/NoiseScreen.tsx; app/on-trang/page.tsx
lib/nav.ts (+ test), sw/sw.template.js
docs/device-checklist.md                 # bước 6, 15
```

## Tasks

1. Hút sữa và tummy time ở trang chủ
2. Thống kê hút sữa và tummy
3. Tiếng ồn trắng
4. Checklist bước 6, 15 và deploy

---

### Task 1: Hút sữa và tummy time ở trang chủ

**Files:**

- Create: `lib/rules/pumpForm.ts`, `components/home/PumpSheet.tsx`
- Modify: `lib/data/logs.ts`, `components/home/ActionGrid.tsx`, `components/home/HomeScreen.tsx`
- Test: `lib/rules/pumpForm.test.ts`

**Interfaces:**

- Consumes: `enqueueLogChange` (op `update`, `row = { details }`), `planTimerPress`, `RunningLog`
- Produces: `parsePumpAmounts({ left, right }): { ok: true; details } | { ok: false; message }`; `useSetPumpAmounts(babyId, userId)` — mutation `{ id, details }`; `PumpSheet({ logId, babyId, userId, onClose })`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m22.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `b67710b docs: device checklist step 14 and release 2 status`.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/rules/pumpForm.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parsePumpAmounts } from "./pumpForm";

describe("parsePumpAmounts (spec §6.13)", () => {
  it("keeps the sides that were filled in", () => {
    expect(parsePumpAmounts({ left: "60", right: " " })).toEqual({
      ok: true,
      details: { mlLeft: 60 },
    });
    expect(parsePumpAmounts({ left: "", right: "" })).toEqual({
      ok: true,
      details: {},
    });
    expect(parsePumpAmounts({ left: "0", right: "500" })).toEqual({
      ok: true,
      details: { mlLeft: 0, mlRight: 500 },
    });
  });

  it("rejects decimals, text and more than 500 ml", () => {
    for (const bad of ["12.5", "abc", "501", "-5"])
      expect(parsePumpAmounts({ left: bad, right: "" })).toEqual({
        ok: false,
        message: "Mỗi bên từ 0 đến 500 ml.",
      });
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/pumpForm.test.ts`
Expected: FAIL — `Error: Cannot find module './pumpForm' imported from …/lib/rules/pumpForm.test.ts`

- [ ] **Step 4: Viết quy tắc**

Tạo `lib/rules/pumpForm.ts`:

```ts
// Spec §6.13: when a pumping timer ends, ask for ml per side (both optional).
export function parsePumpAmounts(raw: {
  left: string;
  right: string;
}):
  | { ok: true; details: { mlLeft?: number; mlRight?: number } }
  | { ok: false; message: string } {
  const details: { mlLeft?: number; mlRight?: number } = {};
  for (const [key, text] of [
    ["mlLeft", raw.left],
    ["mlRight", raw.right],
  ] as const) {
    const value = text.trim();
    if (value === "") continue;
    const n = Number(value);
    if (!/^\d+$/.test(value) || n > 500)
      return { ok: false, message: "Mỗi bên từ 0 đến 500 ml." };
    details[key] = n;
  }
  return { ok: true, details };
}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/pumpForm.test.ts`
Expected: PASS — `Tests  2 passed (2)`.

- [ ] **Step 6: Thêm `useSetPumpAmounts`, hàng nút phụ và sheet**

```diff
--- a/lib/data/logs.ts
+++ b/lib/data/logs.ts
@@ -250,3 +250,25 @@
       }),
   });
 }
+
+// Spec §6.13: ml per side, asked after a pumping timer has been stopped.
+export function useSetPumpAmounts(babyId: string, userId: string) {
+  const queryClient = useQueryClient();
+  return useMutation({
+    networkMode: "always",
+    mutationFn: ({
+      id,
+      details,
+    }: {
+      id: string;
+      details: { mlLeft?: number; mlRight?: number };
+    }) =>
+      enqueueLogChange(queryClient, {
+        op: "update",
+        rowId: id,
+        babyId,
+        userId,
+        row: { details },
+      }),
+  });
+}
```

```diff
--- a/components/home/ActionGrid.tsx
+++ b/components/home/ActionGrid.tsx
@@ -7,6 +7,12 @@
   { label: "Bú trái", button: { type: "breast", side: "left" } },
   { label: "Bú phải", button: { type: "breast", side: "right" } },
   { label: "Ngủ", button: { type: "sleep" } },
+];
+
+// Spec §6.2: second row (release 3).
+const EXTRA_TIMERS: { label: string; button: TimerButton }[] = [
+  { label: "Hút sữa", button: { type: "pump" } },
+  { label: "Tummy time", button: { type: "tummy" } },
 ];
 
 const INSTANTS: { label: string; type: InstantType }[] = [
@@ -36,32 +42,36 @@
   onInstant: (type: InstantType) => void;
 }) {
   const base = "min-h-16 rounded-2xl text-lg font-medium disabled:opacity-50";
+  const timer = ({ label, button }: { label: string; button: TimerButton }) => {
+    const active = isActive(running, button);
+    return (
+      <button
+        key={label}
+        type="button"
+        disabled={busy}
+        onClick={() => onTimer(button)}
+        className={`${base} ${active ? "bg-accent text-on-accent" : "bg-accent-soft text-accent-ink"}`}
+      >
+        {active ? `Dừng ${label.toLowerCase()}` : label}
+      </button>
+    );
+  };
   return (
-    <section className="grid grid-cols-3 gap-3">
-      {TIMERS.map(({ label, button }) => {
-        const active = isActive(running, button);
-        return (
+    <section className="flex flex-col gap-3">
+      <div className="grid grid-cols-3 gap-3">
+        {TIMERS.map(timer)}
+        {INSTANTS.map(({ label, type }) => (
           <button
-            key={label}
+            key={type}
             type="button"
-            disabled={busy}
-            onClick={() => onTimer(button)}
-            className={`${base} ${active ? "bg-accent text-on-accent" : "bg-accent-soft text-accent-ink"}`}
+            onClick={() => onInstant(type)}
+            className={`${base} bg-soft`}
           >
-            {active ? `Dừng ${label.toLowerCase()}` : label}
+            {label}
           </button>
-        );
-      })}
-      {INSTANTS.map(({ label, type }) => (
-        <button
-          key={type}
-          type="button"
-          onClick={() => onInstant(type)}
-          className={`${base} bg-soft`}
-        >
-          {label}
-        </button>
-      ))}
+        ))}
+      </div>
+      <div className="grid grid-cols-2 gap-3">{EXTRA_TIMERS.map(timer)}</div>
     </section>
   );
 }
```

```diff
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -23,6 +23,7 @@
 import type { Baby, FamilyMember } from "@/lib/supabase/rows";
 import { ActionGrid } from "./ActionGrid";
 import { AlertBanners } from "./AlertBanners";
+import { PumpSheet } from "./PumpSheet";
 import { QuickEntrySheet } from "./QuickEntrySheet";
 import { RecentList } from "./RecentList";
 import { RunningCard } from "./RunningCard";
@@ -59,6 +60,13 @@
   const stop = useStopTimer(baby.id, userId);
   const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
   const [sheet, setSheet] = useState<SheetState>(null);
+  // Id of a pumping log that was just stopped: ask for ml (spec §6.13).
+  const [pumpStopped, setPumpStopped] = useState<string | null>(null);
+  // Only whoever may edit the log is asked (RLS: owner or the log's creator).
+  const askPumpAmounts = (log: { id: string; created_by: string }) => {
+    if (member.role === "owner" || log.created_by === userId)
+      setPumpStopped(log.id);
+  };
 
   const rows = logs.data ?? [];
   const age = ageDays(baby.dob, now);
@@ -109,7 +117,16 @@
       <ActionGrid
         running={running}
         busy={press.isPending}
-        onTimer={(button) => press.mutate({ running, button })}
+        onTimer={(button) => {
+          const pump =
+            button.type === "pump"
+              ? runningRows.find((r) => r.type === "pump")
+              : undefined;
+          press.mutate(
+            { running, button },
+            { onSuccess: () => pump && askPumpAmounts(pump) },
+          );
+        }}
         onInstant={(type) => setSheet({ type })}
       />
 
@@ -126,7 +143,11 @@
           who={nameOf(log.created_by)}
           now={now}
           busy={stop.isPending}
-          onStop={() => stop.mutate(log.id)}
+          onStop={() =>
+            stop.mutate(log.id, {
+              onSuccess: () => log.type === "pump" && askPumpAmounts(log),
+            })
+          }
           pending={pending.has(log.id)}
         />
       ))}
@@ -161,6 +182,14 @@
           onClose={() => setSheet(null)}
         />
       )}
+      {pumpStopped && (
+        <PumpSheet
+          logId={pumpStopped}
+          babyId={baby.id}
+          userId={userId}
+          onClose={() => setPumpStopped(null)}
+        />
+      )}
     </main>
   );
 }
```

Tạo `components/home/PumpSheet.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
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
      { onSuccess: onClose, onError: (e) => setMessage(toVietnameseError(e)) },
    );
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-3 rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">Đã hút được bao nhiêu?</h2>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            Bên trái (ml)
            <input
              inputMode="numeric"
              className={input}
              value={left}
              onChange={(e) => setLeft(e.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            Bên phải (ml)
            <input
              inputMode="numeric"
              className={input}
              value={right}
              onChange={(e) => setRight(e.target.value)}
            />
          </label>
        </div>
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
            Bỏ qua
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="min-h-12 flex-1 rounded-2xl bg-accent text-on-accent disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 7: Kiểm tra type và test**

Run: `bun run typecheck && bun run test`
Expected: không lỗi type; `Tests  267 passed (267)` (265 + 2).

- [ ] **Step 8: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m22.md lib/rules/pumpForm.ts lib/rules/pumpForm.test.ts lib/data/logs.ts components/home/ActionGrid.tsx components/home/PumpSheet.tsx components/home/HomeScreen.tsx && git commit -m "feat(home): pumping and tummy time timers, ml asked when pumping stops"
```

---

### Task 2: Thống kê hút sữa và tummy

**Files:**

- Modify: `lib/rules/dailyStats.ts`, `components/stats/StatsScreen.tsx`
- Test: `lib/rules/dailyStats.test.ts`

**Interfaces:**

- Consumes: `detailsSchemas.pump`
- Produces: `DayStat.pumpMl: number`, `DayStat.tummyMinutes: number`; `StatsTab = "sleep" | "feed" | "diaper" | "pump" | "tummy"`; `chartRows(stats, "pump" | "tummy")`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/rules/dailyStats.test.ts
+++ b/lib/rules/dailyStats.test.ts
@@ -84,6 +84,8 @@
         bottleMl: 0,
         wetDiapers: 0,
         dirtyDiapers: 0,
+        pumpMl: 0,
+        tummyMinutes: 0,
       },
       {
         day: "2026-11-14",
@@ -92,6 +94,8 @@
         bottleMl: 0,
         wetDiapers: 1,
         dirtyDiapers: 1,
+        pumpMl: 0,
+        tummyMinutes: 0,
       },
     ]);
   });
@@ -112,6 +116,8 @@
       bottleMl: 120,
       wetDiapers: 6,
       dirtyDiapers: 2,
+      pumpMl: 150,
+      tummyMinutes: 25,
     };
     expect(chartRows([stat], "sleep")).toEqual([
       { label: "9", primary: 14, secondary: null },
@@ -120,5 +126,28 @@
     expect(chartRows([stat], "diaper")).toEqual([
       { label: "9", primary: 6, secondary: 2 },
     ]);
+    expect(chartRows([stat], "pump")[0].primary).toBe(150);
+    expect(chartRows([stat], "tummy")[0].primary).toBe(25);
+  });
+
+  it("adds pumped ml of both sides and tummy minutes per VN day (spec §6.13)", () => {
+    const stats = dailyStats(
+      [
+        log("pump", "2026-11-13T02:00:00Z", "2026-11-13T02:20:00Z", {
+          mlLeft: 60,
+          mlRight: 45,
+        }),
+        log("pump", "2026-11-14T01:00:00Z", "2026-11-14T01:15:00Z", {
+          mlRight: 70,
+        }),
+        log("pump", "2026-11-14T02:00:00Z", null, {}),
+        log("tummy", "2026-11-13T16:55:00Z", "2026-11-13T17:05:00Z"), // 23:55 → 00:05
+        log("tummy", "2026-11-14T02:50:00Z", null), // 09:50, running at 10:00
+      ],
+      days,
+      now,
+    );
+    expect(stats.map((s) => s.pumpMl)).toEqual([105, 70]);
+    expect(stats.map((s) => s.tummyMinutes)).toEqual([5, 15]);
   });
 });
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/dailyStats.test.ts`
Expected: FAIL — `Tests  3 failed | 4 passed (7)`; có `AssertionError: expected [ undefined, undefined ] to deeply equal [ 105, 70 ]` và `AssertionError: expected 6 to be 150`.

- [ ] **Step 3: Sửa `lib/rules/dailyStats.ts` và `components/stats/StatsScreen.tsx`**

```diff
--- a/lib/rules/dailyStats.ts
+++ b/lib/rules/dailyStats.ts
@@ -11,17 +11,22 @@
   bottleMl: number;
   wetDiapers: number;
   dirtyDiapers: number;
+  pumpMl: number;
+  tummyMinutes: number;
 };
 
-export type StatsTab = "sleep" | "feed" | "diaper";
+export type StatsTab = "sleep" | "feed" | "diaper" | "pump" | "tummy";
 
 export const STATS_TABS: { value: StatsTab; label: string }[] = [
   { value: "sleep", label: "Ngủ" },
   { value: "feed", label: "Bú" },
   { value: "diaper", label: "Tã" },
+  { value: "pump", label: "Hút sữa" },
+  { value: "tummy", label: "Tummy" },
 ];
 
-function sleepMinutesBetween(
+function minutesBetween(
+  type: "sleep" | "tummy",
   logs: LogLike[],
   from: number,
   to: number,
@@ -29,7 +34,7 @@
 ): number {
   let total = 0;
   for (const log of logs) {
-    if (log.type !== "sleep") continue;
+    if (log.type !== type) continue;
     const start = Math.max(Date.parse(log.started_at), from);
     const end = Math.min(
       log.ended_at ? Date.parse(log.ended_at) : now.getTime(),
@@ -45,19 +50,21 @@
   days: string[],
   now: Date,
 ): DayStat[] {
-  const result: DayStat[] = days.map((day) => ({
-    day,
-    sleepMinutes: sleepMinutesBetween(
-      logs,
-      vnDayStartMs(day),
-      Math.min(vnDayStartMs(addDays(day, 1)), now.getTime()),
-      now,
-    ),
-    feeds: 0,
-    bottleMl: 0,
-    wetDiapers: 0,
-    dirtyDiapers: 0,
-  }));
+  const result: DayStat[] = days.map((day) => {
+    const from = vnDayStartMs(day);
+    const to = Math.min(vnDayStartMs(addDays(day, 1)), now.getTime());
+    return {
+      day,
+      sleepMinutes: minutesBetween("sleep", logs, from, to, now),
+      feeds: 0,
+      bottleMl: 0,
+      wetDiapers: 0,
+      dirtyDiapers: 0,
+      pumpMl: 0,
+      // Spec §6.13: tummy minutes per day, split at midnight like sleep.
+      tummyMinutes: minutesBetween("tummy", logs, from, to, now),
+    };
+  });
   const byDay = new Map(result.map((stat) => [stat.day, stat]));
   for (const session of groupFeedSessions(logs, now)) {
     const stat = byDay.get(vnDateString(new Date(session.start)));
@@ -74,6 +81,11 @@
       const p = detailsSchemas.diaper.safeParse(log.details);
       if (p.success && p.data.wet) stat.wetDiapers += 1;
       if (p.success && p.data.dirty) stat.dirtyDiapers += 1;
+    }
+    if (log.type === "pump") {
+      const p = detailsSchemas.pump.safeParse(log.details);
+      if (p.success)
+        stat.pumpMl += (p.data.mlLeft ?? 0) + (p.data.mlRight ?? 0);
     }
   }
   return result;
@@ -98,7 +110,11 @@
         ? sleepHours(stat.sleepMinutes)
         : tab === "feed"
           ? stat.feeds
-          : stat.wetDiapers,
+          : tab === "pump"
+            ? stat.pumpMl
+            : tab === "tummy"
+              ? stat.tummyMinutes
+              : stat.wetDiapers,
     secondary: tab === "diaper" ? stat.dirtyDiapers : null,
   }));
 }
```

```diff
--- a/components/stats/StatsScreen.tsx
+++ b/components/stats/StatsScreen.tsx
@@ -37,6 +37,8 @@
     sleep: { primary: "Giờ ngủ", secondary: null },
     feed: { primary: "Số cữ bú", secondary: null },
     diaper: { primary: "Tã ướt", secondary: "Tã bẩn" },
+    pump: { primary: "Sữa hút (ml)", secondary: null },
+    tummy: { primary: "Tummy (phút)", secondary: null },
   };
 
 const COLUMNS: Record<
@@ -57,6 +59,14 @@
   diaper: [
     { label: "Ướt", value: (s) => String(s.wetDiapers) },
     { label: "Bẩn", value: (s) => String(s.dirtyDiapers) },
+  ],
+  pump: [{ label: "Sữa hút (ml)", value: (s) => String(s.pumpMl) }],
+  tummy: [
+    {
+      label: "Tummy",
+      value: (s) =>
+        s.tummyMinutes === 0 ? "—" : formatDuration(s.tummyMinutes * 60_000),
+    },
   ],
 };
 
@@ -85,14 +95,14 @@
         <span className="w-16" />
       </header>
 
-      <nav className="flex gap-2">
+      <nav className="grid grid-cols-5 gap-1">
         {STATS_TABS.map((t) => (
           <button
             key={t.value}
             type="button"
             aria-pressed={tab === t.value}
             onClick={() => setTab(t.value)}
-            className={pill(tab === t.value)}
+            className={`min-h-11 rounded-full px-1 text-sm ${tab === t.value ? "bg-accent text-on-accent" : "bg-soft"}`}
           >
             {t.label}
           </button>
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/dailyStats.test.ts && bun run typecheck && bun run test`
Expected: PASS — `Tests  7 passed (7)` cho file này; không lỗi type; cả bộ `Tests  268 passed (268)`.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/dailyStats.ts lib/rules/dailyStats.test.ts components/stats/StatsScreen.tsx && git commit -m "feat(stats): daily pumped ml and tummy minutes"
```

---

### Task 3: Tiếng ồn trắng

**Files:**

- Create: `lib/rules/noise.ts`, `components/noise/NoiseScreen.tsx`, `app/on-trang/page.tsx`
- Modify: `lib/nav.ts`, `sw/sw.template.js`
- Test: `lib/rules/noise.test.ts`, `lib/nav.test.ts`, `lib/themeGuard.test.ts`, `scripts/sw.test.ts` (đã có)

**Interfaces:**

- Consumes: Web Audio API (`AudioContext`, `AudioBufferSourceNode`, `GainNode`); `AuthGate`
- Produces: `fillNoise(color, out, random?)`, `seamlessNoise(color, length, blend, random?): Float32Array`, `formatRemaining(ms)`, `NOISE_OPTIONS`, `TIMER_OPTIONS`, `FADE_MS`, `BUFFER_SECONDS`; `NoiseScreen()`; trang `/on-trang`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/noise.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  fillNoise,
  formatRemaining,
  seamlessNoise,
  type NoiseColor,
} from "./noise";

// Small deterministic generator so the test is repeatable.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const meanStep = (a: Float32Array) => {
  let sum = 0;
  for (let i = 1; i < a.length; i++) sum += Math.abs(a[i] - a[i - 1]);
  return sum / (a.length - 1);
};

describe("fillNoise (spec §6.12)", () => {
  const make = (color: NoiseColor) => {
    const out = new Float32Array(48_000);
    fillNoise(color, out, seeded(7));
    return out;
  };

  it("keeps every sample within [-1, 1] and is not silent", () => {
    for (const color of ["white", "pink", "brown"] as const) {
      const out = make(color);
      expect(Math.max(...out)).toBeLessThanOrEqual(1);
      expect(Math.min(...out)).toBeGreaterThanOrEqual(-1);
      expect(Math.max(...out.map(Math.abs))).toBeGreaterThan(0.05);
    }
  });

  it("pink and brown change more slowly than white (less high pitch)", () => {
    const white = meanStep(make("white"));
    const pink = meanStep(make("pink"));
    const brown = meanStep(make("brown"));
    expect(pink).toBeLessThan(white);
    expect(brown).toBeLessThan(pink);
  });
});

describe("seamlessNoise", () => {
  it("continues the generated stream across the loop point", () => {
    const length = 1000;
    const blend = 100;
    const full = new Float32Array(length + blend);
    fillNoise("brown", full, seeded(3));
    const out = seamlessNoise("brown", length, blend, seeded(3));
    expect(out.length).toBe(length);
    // The loop jumps from out[length-1] (= full[length-1]) to out[0] (= full[length]).
    expect(out[length - 1]).toBe(full[length - 1]);
    expect(out[0]).toBeCloseTo(full[length], 6);
    expect(out[blend]).toBe(full[blend]);
  });

  it("makes the jump at the loop point as small as a normal step", () => {
    const out = seamlessNoise("brown", 96_000, 2_400, seeded(11));
    expect(Math.abs(out[0] - out[out.length - 1])).toBeLessThan(
      3 * meanStep(out),
    );
  });
});

describe("sleep timer", () => {
  it("formats the time left as m:ss", () => {
    expect(formatRemaining(15 * 60_000)).toBe("15:00");
    expect(formatRemaining(61_500)).toBe("1:02");
    expect(formatRemaining(-5)).toBe("0:00");
  });
});
```

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -53,6 +53,12 @@
     );
   });
 
+  it("Tiện ích opens white noise", () => {
+    expect(TOOL_ITEMS.find((i) => i.label === "Ồn trắng")?.href).toBe(
+      "/on-trang",
+    );
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/noise.test.ts lib/nav.test.ts`
Expected: FAIL — `Error: Cannot find module './noise' imported from …/lib/rules/noise.test.ts`; và `AssertionError: expected null to be '/on-trang'` (`1 failed | 8 passed` ở `nav.test.ts`).

- [ ] **Step 3: Viết quy tắc sinh âm**

Tạo `lib/rules/noise.ts`:

```ts
export type NoiseColor = "white" | "pink" | "brown";

export const NOISE_OPTIONS: {
  value: NoiseColor;
  label: string;
  hint: string;
}[] = [
  { value: "white", label: "Trắng", hint: "Đều như tiếng quạt, xì xì" },
  { value: "pink", label: "Hồng", hint: "Êm hơn, như mưa rơi" },
  { value: "brown", label: "Nâu", hint: "Trầm, như sóng biển xa" },
];

// Spec §6.12: sleep timer off / 15 / 30 / 60 minutes, fading out over the last 10 s.
export const TIMER_OPTIONS = [0, 15, 30, 60] as const;
export const FADE_MS = 10_000;
export const BUFFER_SECONDS = 2;

const clamp = (x: number) => Math.max(-1, Math.min(1, x));

// Fills `out` with noise of the given colour, every sample in [-1, 1].
export function fillNoise(
  color: NoiseColor,
  out: Float32Array,
  random: () => number = Math.random,
): void {
  // Pink: Paul Kellet's economy filter. Brown: leaky integrator of white noise.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let last = 0;
  for (let i = 0; i < out.length; i++) {
    const white = random() * 2 - 1;
    if (color === "white") out[i] = white;
    else if (color === "pink") {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      out[i] = clamp((b0 + b1 + b2 + white * 0.1848) * 0.2);
    } else {
      last = (last + 0.02 * white) / 1.02;
      out[i] = clamp(last * 3.5);
    }
  }
}

// A loopable buffer: `length + blend` samples are generated and the extra tail is
// cross-faded into the head, so the last sample flows into the first with no click.
export function seamlessNoise(
  color: NoiseColor,
  length: number,
  blend: number,
  random: () => number = Math.random,
): Float32Array {
  const n = Math.max(1, Math.min(blend, Math.floor(length / 2)));
  const full = new Float32Array(length + n);
  fillNoise(color, full, random);
  const out = full.slice(0, length);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    out[i] = full[i] * t + full[length + i] * (1 - t);
  }
  return out;
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Viết màn hình, trang, menu, service worker**

Tạo `components/noise/NoiseScreen.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  BUFFER_SECONDS,
  FADE_MS,
  formatRemaining,
  NOISE_OPTIONS,
  seamlessNoise,
  TIMER_OPTIONS,
  type NoiseColor,
} from "@/lib/rules/noise";

type Player = {
  context: AudioContext;
  gain: GainNode;
  // Audio-clock time (s) when the sleep timer ends, or null without a timer.
  end: number | null;
};

// Safari 16.4+: "playback" keeps sound on when the silent switch is on (spec §6.12).
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

const FADE_S = FADE_MS / 1000;

// Holds `volume` until 10 s before the end, then ramps to 0 on the audio clock,
// so the fade still happens while the page's own timers are paused (locked screen).
function scheduleVolume(player: Player, volume: number) {
  const { context, gain, end } = player;
  const now = context.currentTime;
  gain.gain.cancelScheduledValues(now);
  if (end === null || end - now > FADE_S) {
    gain.gain.setValueAtTime(volume, now);
    if (end !== null) {
      gain.gain.setValueAtTime(volume, end - FADE_S);
      gain.gain.linearRampToValueAtTime(0, end);
    }
  } else {
    gain.gain.setValueAtTime(volume * ((end - now) / FADE_S), now);
    gain.gain.linearRampToValueAtTime(0, end);
  }
}

export function NoiseScreen() {
  const [color, setColor] = useState<NoiseColor>("white");
  const [volume, setVolume] = useState(0.5);
  const [minutes, setMinutes] = useState<number>(30);
  const [playing, setPlaying] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const player = useRef<Player | null>(null);
  const endsAt = useRef<number | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  function stop() {
    const current = player.current;
    player.current = null;
    endsAt.current = null;
    setPlaying(false);
    setRemaining(null);
    if (current) void current.context.close();
  }

  function start(nextColor: NoiseColor, nextMinutes: number) {
    stop();
    const nav = navigator as AudioSessionNavigator;
    if (nav.audioSession) nav.audioSession.type = "playback";
    const context = new AudioContext();
    // Inside the tap, so iOS lets it start even if it was created suspended.
    void context.resume();
    const length = context.sampleRate * BUFFER_SECONDS;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    buffer
      .getChannelData(0)
      .set(
        seamlessNoise(nextColor, length, Math.floor(context.sampleRate * 0.05)),
      );
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = context.createGain();
    source.connect(gain).connect(context.destination);
    const end = nextMinutes > 0 ? context.currentTime + nextMinutes * 60 : null;
    const next: Player = { context, gain, end };
    scheduleVolume(next, volumeRef.current);
    source.start();
    if (end !== null) source.stop(end);
    source.onended = () => {
      if (player.current === next) stop();
    };
    context.onstatechange = () => {
      if (player.current === next) setInterrupted(context.state !== "running");
    };
    player.current = next;
    endsAt.current = nextMinutes > 0 ? Date.now() + nextMinutes * 60_000 : null;
    setRemaining(nextMinutes > 0 ? nextMinutes * 60_000 : null);
    setInterrupted(false);
    setPlaying(true);
  }

  // Countdown text only; the fade and stop are scheduled on the audio clock.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const end = endsAt.current;
      if (end === null) return;
      const left = end - Date.now();
      if (left <= 0) stop();
      else setRemaining(left);
    }, 250);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (player.current) scheduleVolume(player.current, volume);
  }, [volume]);

  useEffect(() => stop, []);

  const pill = (active: boolean) =>
    `min-h-11 flex-1 rounded-xl border px-2 ${active ? "border-accent bg-accent-soft text-accent-ink" : ""}`;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-4">
      <h1 className="text-2xl font-semibold">Tiếng ồn trắng</h1>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Loại âm</h2>
        <div className="flex gap-2">
          {NOISE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={color === option.value}
              onClick={() => {
                setColor(option.value);
                if (playing) start(option.value, minutes);
              }}
              className={pill(color === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">
          {NOISE_OPTIONS.find((o) => o.value === color)?.hint}
        </p>
      </section>
      <label className="flex flex-col gap-2">
        <span className="text-lg font-medium">Âm lượng</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="min-h-11 accent-accent"
        />
      </label>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Hẹn giờ tắt</h2>
        <div className="flex gap-2">
          {TIMER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={minutes === option}
              onClick={() => {
                setMinutes(option);
                if (playing) start(color, option);
              }}
              className={pill(minutes === option)}
            >
              {option === 0 ? "Không" : `${option} phút`}
            </button>
          ))}
        </div>
      </section>
      <button
        type="button"
        onClick={() => (playing ? stop() : start(color, minutes))}
        className={`min-h-14 rounded-2xl text-lg font-semibold ${playing ? "bg-soft" : "bg-accent text-on-accent"}`}
      >
        {playing ? "Dừng" : "Phát"}
      </button>
      {playing && (
        <p role="status" className="text-center text-muted">
          {interrupted
            ? "Âm đang bị ngắt. Bấm Dừng rồi Phát để chạy lại."
            : remaining === null
              ? "Đang phát, không hẹn giờ tắt."
              : `Tắt sau ${formatRemaining(remaining)}`}
        </p>
      )}
      <p className="text-sm text-muted">
        Đặt điện thoại cách xa bé ít nhất 2 m, để âm lượng vừa đủ nghe. iPhone
        có thể dừng âm khi khóa màn hình; nếu vậy, để màn hình sáng với độ sáng
        thấp.
      </p>
    </main>
  );
}
```

Tạo `app/on-trang/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { NoiseScreen } from "@/components/noise/NoiseScreen";

export default function Page() {
  return <AuthGate need="baby">{() => <NoiseScreen />}</AuthGate>;
}
```

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -28,7 +28,7 @@
   { label: "Tăng trưởng", href: "/tang-truong" },
   { label: "Khẩn cấp", href: "/khan-cap" },
   { label: "Nhạc", href: null },
-  { label: "Ồn trắng", href: null },
+  { label: "Ồn trắng", href: "/on-trang" },
   { label: "Ảnh", href: null },
   { label: "Báo cáo", href: null },
 ];
```

```diff
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -14,6 +14,7 @@
   "/nhat-ky",
   "/thong-ke",
   "/tang-truong",
+  "/on-trang",
   "/cam-nang",
   "/tien-ich",
   "/cai-dat",
```

- [ ] **Step 5: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  274 passed (274)` (268 + 5 + 1); build thành công, có `○ /on-trang`.

- [ ] **Step 6: Commit**

```bash
git add lib/rules/noise.ts lib/rules/noise.test.ts components/noise app/on-trang lib/nav.ts lib/nav.test.ts sw/sw.template.js && git commit -m "feat(noise): white, pink and brown noise with a fading sleep timer"
```

---

### Task 4: Checklist bước 6, 15 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 1, Task 3
- Produces: checklist bước 6 (trước bước 7) và bước 15 (cuối file)

- [ ] **Step 1: Thêm bước 6 và 15**

```diff
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -78,6 +78,22 @@
 | iPhone 11     | 16.3 | Bỏ qua  | Máy đang iOS 16.3, cần 16.4 trở lên       |
 | iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14)                          |
 | iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14)                          |
+
+## Bước 6 — Tiếng ồn trắng khi khóa màn hình (M22)
+
+1. Tiện ích → Ồn trắng → chọn "Trắng", âm lượng vừa, "Hẹn giờ tắt" = "Không" → "Phát". Kỳ vọng: nghe tiếng xì đều, không có tiếng "tách" lặp lại mỗi 2 giây.
+2. Gạt công tắc im lặng của iPhone. Kỳ vọng: vẫn nghe.
+3. Khóa màn hình, chờ 5 phút. Ghi lại: âm còn chạy hết 5 phút / dừng sau khoảng bao lâu.
+4. Mở lại, chọn "Nâu" rồi "Hồng" khi đang phát. Kỳ vọng: âm đổi ngay. Chọn "15 phút". Kỳ vọng: dòng "Tắt sau 15:00" đếm lùi.
+5. Khóa màn hình và để yên khoảng 16 phút. Kỳ vọng (nếu âm còn chạy khi khóa màn hình): khoảng phút thứ 15 âm nhỏ dần trong 10 giây rồi tự tắt.
+
+Nếu iOS dừng âm khi khóa màn hình (spec §10.3 bước 6), ghi giới hạn đó vào README; không chặn phát hành.
+
+| Máy           | iOS | Kết quả | Ghi chú (chạy bao lâu khi khóa màn hình) |
+| ------------- | --- | ------- | ---------------------------------------- |
+| iPhone 11     |     |         |                                          |
+| iPhone 16     |     |         |                                          |
+| iPhone 17 Pro |     |         |                                          |
 
 ## Bước 7 — Tạm tắt (M11, phần nhắc bú)
 
@@ -193,3 +209,18 @@
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 15 — Hút sữa và tummy time (M22)
+
+1. Trang chủ: dưới hàng nút chính có hàng "Hút sữa · Tummy time". Bấm "Hút sữa". Kỳ vọng: nút đổi thành "Dừng hút sữa", thẻ "Đang chạy" hiện Hút sữa.
+2. Bấm "Dừng hút sữa". Kỳ vọng: hiện "Đã hút được bao nhiêu?" với ô trái, phải (ml). Nhập 60 và 45 → Lưu. Nhật ký có dòng "Hút sữa · … · 105 ml".
+3. Lần nữa: bắt đầu rồi bấm "Dừng" ở thẻ "Đang chạy" → "Bỏ qua". Kỳ vọng: bản ghi kết thúc, không có ml.
+4. Bấm "Tummy time", chờ 1–2 phút, bấm lại để dừng.
+5. Tiện ích → Thống kê → tab "Hút sữa": hôm nay 105 ml; tab "Tummy": hôm nay có số phút vừa ghi.
+6. Dọn dẹp: xóa các bản ghi thử trong Nhật ký.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

Run: `grep '^## ' docs/device-checklist.md`
Expected: `## Bước 6 — Tiếng ồn trắng khi khóa màn hình (M22)` nằm ngay trước `## Bước 7 — Tạm tắt (M11, phần nhắc bú)`; tiêu đề cuối là `## Bước 15 — Hút sữa và tummy time (M22)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist steps 6 and 15" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/on-trang`
Expected: `200`.

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bảng kết quả bước 6, 15 để trống. Trong báo cáo cuối ghi: "Checklist bước 6 và 15 chờ người dùng."

---

## Ngoài phạm vi M22

- M23: nhạc YouTube và bồng bế; M24: ảnh; M25: mốc phát triển; M26: báo cáo cho bác sĩ (dùng `pumpMl`, `tummyMinutes` nếu cần).
