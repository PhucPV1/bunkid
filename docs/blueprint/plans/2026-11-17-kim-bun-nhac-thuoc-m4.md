# Kim Bun — M4 Nhắc thuốc và push timer Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-17-kim-bun-nhac-thuoc-yen-lang-timer-ban-ghi-design.md` (§4.2 toàn bộ; phần nhắc thuốc hằng ngày, nhắc sau liều hạ sốt, nhắc timer và snooze của §4.3; hàng "Lịch nhắc thuốc" của §4.4; §6.4; phần tương ứng của §6.1 và §6.3). Đây là mốc cuối của spec.

**Status:** approved 2026-11-17

**Goal:** Gia đình đặt được giờ nhắc cho từng thuốc ở Cài đặt › Nhắc thuốc; bộ gửi push nhắc thuốc hằng ngày khi chưa ghi, nhắc đo lại nhiệt độ 4 giờ sau liều hạ sốt, và báo khi một timer chạy quá ngưỡng.

**Architecture:**

- **Luật thuần:** `lib/rules/medicineNames.ts` (hai tên thuốc có là một không), `lib/rules/medicineSchedule.ts` (các dòng của màn Nhắc thuốc), và ba hàm chọn thông báo mới trong `lib/rules/pushSelection.ts` cùng `buildMedicineState`.
- **Server:** `lib/server/dispatchDeps.ts` nạp lịch thuốc đang bật và các bản ghi thuốc gần đây của mỗi bé. Không thêm endpoint hay cron; `lib/server/dispatch.ts` không đổi (loại mới dùng `TTL` 3600 và `urgency` `high` như nhắc bú).
- **Dữ liệu và giao diện:** `lib/data/medicineSchedules.ts` đọc ghi thẳng qua Supabase (cần mạng, không qua outbox); trang mới `/cai-dat/nhac-thuoc`; hàng "Lịch nhắc thuốc" trong nhóm Thông báo.
- **DB:** không có migration. Bảng `medicine_schedules` và hai loại `kind` mới đã có từ M3 và đã được áp lên project thật.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Supabase, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-nhac-thuoc-m4`, cắt từ `feat/kim-bun-yen-lang-m3` (M3 chưa lên `main`; hai mốc lên cùng nhau). Baseline: 883 test vitest xanh (143 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung | Plan |
| --- | --- | --- |
| M1a, M1b, M2 | Bốn loại bản ghi mới; canh timer trong app | đã xong, đã lên `main` |
| M3 | Migration `reminders`, §4.4, giờ yên lặng, `hold_feed_while_asleep` | đã xong trên nhánh `feat/kim-bun-yen-lang-m3`, chờ plan này |
| **M4 (plan này)** | §4.2 lịch thuốc, nhắc thuốc, nhắc hạ sốt, push timer, checklist §6.4 | `2026-11-17-kim-bun-nhac-thuoc-m4.md` |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **`medicineKey`** (`trim`, chữ thường, bỏ dấu, `đ` thành `d`) là hàm phụ của `sameMedicine`. `MEDICINE_PRESETS` và hàm `medicineKey` riêng của `lib/rules/quickEntry.ts` (chip thuốc gần đây) giữ nguyên.
2. **Tên trùng với một dòng cố định cũng bị từ chối.** Gõ "vitamin D3" hay "men tiêu hóa" vào "Tên thuốc khác" thì báo "Thuốc này đã có trong danh sách", kể cả khi dòng cố định đó chưa có trong DB.
3. **Dòng cố định khớp theo `sameMedicine`.** Một lịch tên "vitamin d3" trong DB hiện ở dòng "Vitamin D", không thành dòng riêng.
4. **Ô giờ không điều khiển (`defaultValue`),** được tạo lại khi giờ đã lưu đổi, và ghi ngay ở `change` khi giá trị là `HH:mm` hợp lệ. Như vậy chữ đang gõ không bị giật về giá trị cũ trong lúc chờ lưu.
5. **`buildMedicineState`** là hàm thuần dựng `medicine` của `BabyDispatchState` từ các dòng DB; `dispatchDeps` chỉ nạp dữ liệu rồi gọi nó. Bản ghi thuốc có `details` hỏng hoặc có giờ ở tương lai bị bỏ qua.
6. **`medicine` không bao giờ `null`** (đúng spec); fixture của các test cũ được thêm `medicine` rỗng.
7. **Chữ ngưỡng trong tiêu đề push timer:** `60 phút`, `30 phút`, `14 giờ` (số phút chia hết cho 60 và lớn hơn 60 thì viết bằng giờ).
8. **Timer bú không rõ bên** (dữ liệu hỏng) được gọi là "Bú trái" trong tiêu đề push.
9. **Một test của M3 đổi kỳ vọng.** Timer Ngủ chạy 14 giờ giờ sinh thêm một nhắc timer, nên test "a sleep timer left running for 14 hours…" mong cả `hold:feed` và `hold:timer`.
10. **Giá trị của hàng "Lịch nhắc thuốc"** để trống khi danh sách chưa tải xong hoặc tải lỗi; trang Cài đặt không vì thế mà báo lỗi.
11. **Checklist §6.4** được viết thành bước 31–34 trong `docs/device-checklist.md`, mỗi bước có phần dọn dẹp như các bước cũ. Bước 31 gồm cả việc xem toast bị cắt ở 60 ký tự.
12. **Kiểm tay (§6.3).** Phiên chính làm, bằng trình duyệt có sẵn trong app Claude ở 375×812, cần người dùng đồng ý mỗi lần. Ở màn Nhắc thuốc **mọi thao tác đều ghi thẳng vào DB** (gạt công tắc, đổi giờ, Thêm, Xóa), nên chỉ được nhìn.

## Global Constraints

- Giữ Global Constraints của `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md` (chỉ dùng gói miễn phí, secret không bao giờ nằm ở client, không tính liều thuốc).
- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Giữ prefix khoá localStorage `be-yeu-*`, tên package và URL `bunkid.vercel.app`.
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Không lồng `glass` trong `glass` (hotfix 7822c90). Màn hình không tự cộng `env(safe-area-inset-*)`, vì `body` đã pad sẵn.
- Mọi giờ trong luật tính theo giờ Việt Nam (UTC+7), dùng `vnDateString`, `formatVnTime`, `vnDayStartMs` có sẵn. Không dùng múi giờ của máy.
- Migration chỉ được thêm (thêm bảng, thêm cột có default, nới check constraint). Không xoá hay đổi kiểu cột đang có.
- Migration phải được áp lên Supabase thật **trước** khi bản web mới được deploy. Nếu ngược lại, bản ghi loại mới bị từ chối với mã `23514` và outbox bỏ nó.
- Chạy `bunx supabase db push` lên project thật chỉ khi người dùng đồng ý trong phiên triển khai. Push lên `main` cũng cần người dùng đồng ý từng lần.
- Mọi ghi bản ghi (`logs`) đi qua outbox như hiện tại. Lịch thuốc và cài đặt thông báo cần mạng (bọc `OnlineOnly`), không qua outbox.
- Chữ về sức khoẻ: nhắc hạ sốt không bao giờ nói nên uống tiếp hay không; công tắc "Không nhắc bú khi bé đang ngủ" luôn đi kèm ghi chú ở §4.4.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không được bắt đầu đồng hồ, không được bật tắt công tắc nào ở Cài đặt › Thông báo và Cài đặt › Nhắc thuốc (công tắc ghi thẳng vào DB).
- Test hiện có phải xanh: 803 test vitest, pgTAP 001–011, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Baseline thật.** Dòng "803 test" ở trên chép nguyên từ spec; trên nhánh `feat/kim-bun-yen-lang-m3` con số hiện tại là 883 test, 143 file, và pgTAP 001–013 (135 test).
- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 7** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-17-kim-bun-nhac-thuoc-m4.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** Các patch đã được áp lần lượt lên một bản sao của nhánh `feat/kim-bun-yen-lang-m3` ở ngoài repo: `tsc --noEmit` sạch sau mỗi task, số test đỏ và xanh ở mỗi task là số đo được. Chưa chạy trong lúc viết plan: `bun run build`, kiểm trên trình duyệt, và việc nhận push thật trên điện thoại.
- **Supabase.** Plan này không có migration và không chạy lệnh nào ghi vào project thật. `bun run dev` chỉ chạy ở Task 4 Step 4.
- **`bun run build` và `bun run dev`** dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Next.js.** Task 3 thêm một route (`app/cai-dat/nhac-thuoc/page.tsx`) theo đúng mẫu của `app/cai-dat/cu-bu/page.tsx`: một Client Component bọc `AuthGate`. Trước khi làm, đọc `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` (AGENTS.md).
- **Màu.** Không patch nào thêm màu hay token. `lib/themeGuard.test.ts` và `lib/ui/glassNesting.test.ts` phải xanh.
- **Git.** Mọi commit nằm trên nhánh, ở máy. Plan này không push nhánh, không merge, không push `main`. Việc đưa M3 và M4 lên `main` chờ người dùng đồng ý.

## Contracts with Other Plans

Plan này đứng sau M1a, M1b, M2 (đã ở trên `main`) và M3 (nhánh `feat/kim-bun-yen-lang-m3`). Không còn plan nào sau nó.

**Consumes:**

- **DB (M3, đã áp lên project thật):** bảng `public.medicine_schedules (id, baby_id, name, remind_at_min, enabled, created_by, created_at, updated_at)`; `notification_log.kind` nhận `'medicine'` và `'timer'`; cột `notification_prefs.medicine`, `timer_alert`.
- **`lib/supabase/types.ts` (M3):** `Database["public"]["Tables"]["medicine_schedules"]`.
- **`lib/rules/notifications.ts` (M3):** `inQuietHours`, `DEFAULT_QUIET`, `minutesToTime`, `timeToMinutes`, và hàm riêng `vnMinuteOfDay` (plan này export nó).
- **`lib/rules/pushSelection.ts` (M3):** `Recipient` với các trường tuỳ chọn `medicine`, `timer_alert`, `quiet_*`; `RunningTimer`; `BabyDispatchState.runningTimers`; các hàm riêng `notSnoozed`, `isQuiet`.
- **`lib/rules/timer.ts` (M2):** `TIMER_LIMIT_MIN`. **`lib/rules/quickEntry.ts`:** `MEDICINE_PRESETS`. **`lib/rules/logDetails.ts`:** `detailsSchemas.medicine`.
- **`lib/rules/alerts.ts`:** hằng riêng `VITAMIN_D` (plan này chuyển nó sang `medicineNames.ts`).
- **`components/settings/NotificationsGroup.tsx` (M3):** `NotificationsGroupView`, `NotificationsGroup({ userId })`. **Giao diện chung:** `SettingsSubpage`, `Switch`, `Button`, `Icon`, `ErrorCard`, `Skeleton`, `NeedsNetwork`, `waitingForNetwork`, `FIELD_INPUT`, `FIELD_LABEL`.
- **Nhánh:** `feat/kim-bun-yen-lang-m3`; vitest 883 test, 143 file.

**Produces:**

- **`lib/rules/medicineNames.ts`:** `VITAMIN_D`, `medicineKey(name: string): string`, `sameMedicine(scheduleName: string, logName: string): boolean`.
- **`lib/rules/medicineSchedule.ts`:** `ScheduleLike`, `ScheduleRow`, `DEFAULT_REMIND_MIN = 540`, `scheduleRows`, `newScheduleError`, `enabledCountText`.
- **`lib/rules/pushSelection.ts`:** `NotificationKind` thêm `"medicine"` và `"timer"`; `MedicineState`; `BabyDispatchState.medicine: MedicineState`; `buildMedicineState`; `selectDueNotifications` trả thêm ba loại thông báo với `refKey` `med:<scheduleId>:<YYYY-MM-DD>:<remindAtMin>`, `fever:<logId>`, `timer:<logId>`.
- **`lib/rules/notifications.ts`:** `vnMinuteOfDay` được export.
- **`lib/data/medicineSchedules.ts`:** `useMedicineSchedules(babyId)`, `useScheduleActions(babyId)` (`add`, `setEnabled`, `setTime`, `remove`). **`lib/supabase/rows.ts`:** `MedicineScheduleRow`.
- **Giao diện:** `MedicineScheduleView`, `AddMedicineForm`, `MedicineScheduleSection`; trang `/cai-dat/nhac-thuoc`; `NotificationsGroupView` nhận thêm `medicine: string`; `NotificationsGroup` nhận thêm `babyId: string`.
- **`sw/sw.template.js`:** `PAGES` có `/cai-dat/nhac-thuoc`. **`docs/device-checklist.md`:** bước 31–34.
- **Nhánh:** `feat/kim-bun-nhac-thuoc-m4`. **Vitest sau M4:** 909 test, 146 file.

---

### Task 1: Tên thuốc và các dòng của màn Nhắc thuốc (luật thuần)

**Files:**

- Create: `lib/rules/medicineNames.ts`, `lib/rules/medicineSchedule.ts`
- Modify: `lib/rules/alerts.ts` (bỏ hằng `VITAMIN_D` riêng, import từ `medicineNames.ts`)
- Test: `lib/rules/medicineNames.test.ts` (mới), `lib/rules/medicineSchedule.test.ts` (mới)

**Interfaces:**

- Consumes: `MEDICINE_PRESETS` (`lib/rules/quickEntry.ts`).
- Produces: `VITAMIN_D`, `medicineKey`, `sameMedicine` (`lib/rules/medicineNames.ts`); `ScheduleLike = { id; name; remind_at_min; enabled; created_at }`, `ScheduleRow = { key: string; name: string; preset: boolean; schedule: ScheduleLike | null }`, `DEFAULT_REMIND_MIN`, `scheduleRows(schedules: ScheduleLike[]): ScheduleRow[]`, `newScheduleError(name: string, schedules: ScheduleLike[]): string | null`, `enabledCountText(schedules: { enabled: boolean }[]): string` (`lib/rules/medicineSchedule.ts`).

- [x] **Step 0: Tạo nhánh từ M3 và đo baseline**

Run: `git checkout feat/kim-bun-yen-lang-m3 && git status --short && git checkout -b feat/kim-bun-nhac-thuoc-m4 && bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  143 passed (143)`, `Tests  883 passed (883)`. Nếu khác, dừng và báo lại.

- [x] **Step 1: Viết test hỏng (Patch 1)**

Run: `kb_patch 1 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/lib/rules/medicineNames.test.ts b/lib/rules/medicineNames.test.ts
new file mode 100644
index 0000000..85f73c4
--- /dev/null
+++ b/lib/rules/medicineNames.test.ts
@@ -0,0 +1,27 @@
+import { describe, expect, it } from "vitest";
+import { medicineKey, sameMedicine, VITAMIN_D } from "./medicineNames";
+
+describe("sameMedicine (spec 2026-11-17 §4.3)", () => {
+  it("treats every way of writing Vitamin D as the same drops", () => {
+    expect(sameMedicine("Vitamin D", "vitamin d3")).toBe(true);
+    expect(sameMedicine("Vitamin D", "VitaminD3 K2")).toBe(true);
+    expect(sameMedicine("Vitamin D3", "Vitamin D")).toBe(true);
+    expect(sameMedicine("Vitamin D", "Vitamin DHA")).toBe(false);
+    expect(sameMedicine("Vitamin D", "DHA")).toBe(false);
+    expect(VITAMIN_D.test("vitamin d (Aquadetrim)")).toBe(true);
+  });
+
+  it("ignores case, outer spaces and tone marks for other names", () => {
+    expect(sameMedicine("Men tiêu hoá", " men tiêu hóa ")).toBe(true);
+    expect(sameMedicine("DHA", "dha")).toBe(true);
+    expect(sameMedicine("Siro sắt", "SIRO SAT")).toBe(true);
+    expect(sameMedicine("Đạm sữa", "dam sua")).toBe(true);
+    expect(sameMedicine("DHA", "DHA 2")).toBe(false);
+    expect(sameMedicine("Canxi", "Kẽm")).toBe(false);
+  });
+
+  it("medicineKey is the form two names are compared in", () => {
+    expect(medicineKey("  Men Tiêu Hoá ")).toBe("men tieu hoa");
+    expect(medicineKey("Đường")).toBe("duong");
+  });
+});
diff --git a/lib/rules/medicineSchedule.test.ts b/lib/rules/medicineSchedule.test.ts
new file mode 100644
index 0000000..7dcf5d8
--- /dev/null
+++ b/lib/rules/medicineSchedule.test.ts
@@ -0,0 +1,90 @@
+import { describe, expect, it } from "vitest";
+import {
+  DEFAULT_REMIND_MIN,
+  enabledCountText,
+  newScheduleError,
+  scheduleRows,
+  type ScheduleLike,
+} from "./medicineSchedule";
+
+const row = (over: Partial<ScheduleLike>): ScheduleLike => ({
+  id: "s1",
+  name: "Vitamin D",
+  remind_at_min: 540,
+  enabled: true,
+  created_at: "2026-11-17T01:00:00Z",
+  ...over,
+});
+
+describe("scheduleRows (spec 2026-11-17 §4.2)", () => {
+  it("always lists the three presets first, off when not in the database", () => {
+    const rows = scheduleRows([]);
+    expect(rows.map((r) => [r.name, r.preset, r.schedule])).toEqual([
+      ["Vitamin D", true, null],
+      ["DHA", true, null],
+      ["Men tiêu hoá", true, null],
+    ]);
+    expect(DEFAULT_REMIND_MIN).toBe(540);
+  });
+
+  it("attaches a saved preset to its row and lists other medicines by creation time", () => {
+    const d3 = row({ id: "d", name: "vitamin d3", remind_at_min: 600 });
+    const iron = row({
+      id: "i",
+      name: "Siro sắt",
+      created_at: "2026-11-17T03:00:00Z",
+    });
+    const zinc = row({
+      id: "z",
+      name: "Kẽm",
+      enabled: false,
+      created_at: "2026-11-17T02:00:00Z",
+    });
+    const rows = scheduleRows([iron, d3, zinc]);
+    expect(rows.map((r) => [r.name, r.preset, r.schedule?.id ?? null])).toEqual(
+      [
+        ["Vitamin D", true, "d"],
+        ["DHA", true, null],
+        ["Men tiêu hoá", true, null],
+        ["Kẽm", false, "z"],
+        ["Siro sắt", false, "i"],
+      ],
+    );
+    expect(new Set(rows.map((r) => r.key)).size).toBe(5);
+  });
+});
+
+describe("newScheduleError", () => {
+  const saved = [row({ name: "Siro sắt" })];
+  it("asks for a name", () => {
+    expect(newScheduleError("   ", saved)).toBe("Nhập tên thuốc");
+  });
+  it("refuses a name already in the list, presets included", () => {
+    expect(newScheduleError("siro sat", saved)).toBe(
+      "Thuốc này đã có trong danh sách",
+    );
+    expect(newScheduleError("Men tiêu hóa", saved)).toBe(
+      "Thuốc này đã có trong danh sách",
+    );
+    expect(newScheduleError("vitamin D3", [])).toBe(
+      "Thuốc này đã có trong danh sách",
+    );
+  });
+  it("accepts a new name", () => {
+    expect(newScheduleError("Canxi", saved)).toBeNull();
+  });
+});
+
+describe("enabledCountText (spec §4.4)", () => {
+  it("counts the schedules that are on, or says Tắt", () => {
+    expect(enabledCountText([])).toBe("Tắt");
+    expect(enabledCountText([row({ enabled: false })])).toBe("Tắt");
+    expect(
+      enabledCountText([
+        row({}),
+        row({ id: "s2", name: "DHA" }),
+        row({ id: "s3", name: "Kẽm", enabled: false }),
+      ]),
+    ).toBe("2 thuốc");
+  });
+});
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run lib/rules/medicineNames.test.ts lib/rules/medicineSchedule.test.ts`
Expected: `Test Files  2 failed (2)`, `Tests  no tests`; lỗi `Cannot find module './medicineNames'` và `'./medicineSchedule'`.

- [x] **Step 3: Viết code (Patch 2)**

Run: `kb_patch 2 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/lib/rules/alerts.ts b/lib/rules/alerts.ts
index 7cd5be8..e84f024 100644
--- a/lib/rules/alerts.ts
+++ b/lib/rules/alerts.ts
@@ -1,5 +1,6 @@
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
+import { VITAMIN_D } from "./medicineNames";
 import type { MetricResult } from "./ratings";
 import { formatVnTime, vnDateString } from "./time";
 
@@ -158,10 +159,6 @@ export function medicineWarnings(input: {
   return warnings;
 }
 
-// "Vitamin D", "vitamin d3", "VitaminD3 K2": the same drops under the names
-// people type; "vitamin dha" is something else.
-const VITAMIN_D = /^vitamin\s*d(?![a-z])/i;
-
 export function vitaminDToday(logs: LogLike[], now: Date): string | null {
   const today = vnDateString(now);
   const times = logs
diff --git a/lib/rules/medicineNames.ts b/lib/rules/medicineNames.ts
new file mode 100644
index 0000000..9665551
--- /dev/null
+++ b/lib/rules/medicineNames.ts
@@ -0,0 +1,21 @@
+// "Vitamin D", "vitamin d3", "VitaminD3 K2": the same drops under the names
+// people type; "vitamin dha" is something else.
+export const VITAMIN_D = /^vitamin\s*d(?![a-z])/i;
+
+// The form two medicine names are compared in: no outer spaces, lower case,
+// no tone marks ("hoá" and "hóa" differ only in where the mark sits), đ as d.
+export function medicineKey(name: string): string {
+  return name
+    .trim()
+    .toLocaleLowerCase("vi")
+    .normalize("NFD")
+    .replace(/\p{M}/gu, "")
+    .replace(/đ/g, "d");
+}
+
+// Spec 2026-11-17 §4.3: does a logged medicine count for this schedule?
+export function sameMedicine(scheduleName: string, logName: string): boolean {
+  if (VITAMIN_D.test(scheduleName.trim()))
+    return VITAMIN_D.test(logName.trim());
+  return medicineKey(scheduleName) === medicineKey(logName);
+}
diff --git a/lib/rules/medicineSchedule.ts b/lib/rules/medicineSchedule.ts
new file mode 100644
index 0000000..83d263a
--- /dev/null
+++ b/lib/rules/medicineSchedule.ts
@@ -0,0 +1,63 @@
+import { sameMedicine } from "./medicineNames";
+import { MEDICINE_PRESETS } from "./quickEntry";
+
+// The columns of medicine_schedules the settings screen works with.
+export type ScheduleLike = {
+  id: string;
+  name: string;
+  remind_at_min: number;
+  enabled: boolean;
+  created_at: string;
+};
+
+// One line of Cài đặt › Nhắc thuốc. `schedule` is null for a preset that has
+// never been switched on, so it has no row in the database yet.
+export type ScheduleRow = {
+  key: string;
+  name: string;
+  preset: boolean;
+  schedule: ScheduleLike | null;
+};
+
+// Spec 2026-11-17 §4.2: a schedule that is switched on for the first time reminds at 09:00.
+export const DEFAULT_REMIND_MIN = 540;
+
+const isPreset = (name: string) =>
+  MEDICINE_PRESETS.some((preset) => sameMedicine(preset, name));
+
+// The three presets first, in their own order, then the other medicines oldest first.
+export function scheduleRows(schedules: ScheduleLike[]): ScheduleRow[] {
+  const presets = MEDICINE_PRESETS.map((name): ScheduleRow => ({
+    key: `preset:${name}`,
+    name,
+    preset: true,
+    schedule: schedules.find((s) => sameMedicine(name, s.name)) ?? null,
+  }));
+  const others = schedules
+    .filter((s) => !isPreset(s.name))
+    .sort((a, b) => a.created_at.localeCompare(b.created_at))
+    .map((s): ScheduleRow => ({
+      key: s.id,
+      name: s.name,
+      preset: false,
+      schedule: s,
+    }));
+  return [...presets, ...others];
+}
+
+// Why "Thêm" cannot add this name, or null when it can.
+export function newScheduleError(
+  name: string,
+  schedules: ScheduleLike[],
+): string | null {
+  if (name.trim() === "") return "Nhập tên thuốc";
+  const taken =
+    isPreset(name) || schedules.some((s) => sameMedicine(s.name, name));
+  return taken ? "Thuốc này đã có trong danh sách" : null;
+}
+
+// Spec §4.4: the value on the "Lịch nhắc thuốc" row of Cài đặt.
+export function enabledCountText(schedules: { enabled: boolean }[]): string {
+  const count = schedules.filter((s) => s.enabled).length;
+  return count === 0 ? "Tắt" : `${count} thuốc`;
+}
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  145 passed (145)`, `Tests  892 passed (892)`.

- [x] **Step 5: Commit**

```bash
git add lib/rules/medicineNames.test.ts lib/rules/medicineSchedule.test.ts lib/rules/alerts.ts lib/rules/medicineNames.ts lib/rules/medicineSchedule.ts
git commit -m "feat(medicine): name matching and schedule rows for reminders" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 2: Nhắc thuốc hằng ngày, nhắc sau liều hạ sốt, nhắc timer (§4.3)

**Files:**

- Modify: `lib/rules/pushSelection.ts`, `lib/rules/notifications.ts` (export `vnMinuteOfDay`), `lib/server/dispatchDeps.ts`
- Test: `lib/rules/pushSelection.test.ts`, `lib/server/dispatch.test.ts` (chỉ thêm `medicine` rỗng vào fixture)

**Interfaces:**

- Consumes: `sameMedicine` (Task 1); `TIMER_LIMIT_MIN` (M2); `inQuietHours` qua `isQuiet`, `notSnoozed`, `RunningTimer`, `runningTimers` (M3); `vnDayStartMs` (`lib/rules/days.ts`); `detailsSchemas.medicine`.
- Produces: `NotificationKind` thêm `"medicine"` | `"timer"`; `MedicineState`; `BabyDispatchState.medicine`; `buildMedicineState(input: { schedules: { id; name; remind_at_min; enabled; updated_at }[]; medicineLogs: { id; started_at; details }[]; now: Date }): MedicineState`; ba loại thông báo mới từ `selectDueNotifications`; `dispatchDeps` nạp `medicine_schedules` đang bật và bản ghi `medicine` từ mốc sớm hơn giữa 00:00 giờ VN hôm nay và 6 giờ trước.

Luật: nhắc hằng ngày từ giờ nhắc tới hết ngày VN khi hôm nay chưa ghi thuốc đó, và chỉ khi `updatedAt` của lịch không muộn hơn giờ nhắc của hôm nay. Nhắc hạ sốt khi `4 giờ <= since < 6 giờ`. Nhắc timer khi thời gian chạy `>=` ngưỡng. Công tắc và snooze chặn cả ba; giờ yên lặng chặn nhắc hằng ngày và nhắc timer, không chặn nhắc hạ sốt. `lib/server/dispatch.ts` không đổi: `urgency` chỉ là `normal` với `vaccine`, `TTL` chỉ dài với `vaccine`.

- [x] **Step 1: Viết test hỏng (Patch 3)**

Run: `kb_patch 3 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/lib/rules/pushSelection.test.ts b/lib/rules/pushSelection.test.ts
index cb82e25..62d9d0d 100644
--- a/lib/rules/pushSelection.test.ts
+++ b/lib/rules/pushSelection.test.ts
@@ -2,6 +2,7 @@ import { describe, expect, it } from "vitest";
 import type { VaccineDose } from "@/lib/content/vaccineSchema";
 import {
   agoText,
+  buildMedicineState,
   selectDueNotifications,
   wakeWindowMin,
   type BabyDispatchState,
@@ -18,6 +19,7 @@ function baby(over: Partial<BabyDispatchState> = {}): BabyDispatchState {
     lastFeed: { id: "L1", startedAt: minutesAgo(190) },
     breastRunningSince: null,
     runningTimers: [],
+    medicine: { schedules: [], loggedToday: [], lastAntipyretic: null },
     wake: null,
     vaccine: null,
     recipients: [{ userId: "u1", prefs: null }],
@@ -646,7 +648,371 @@ describe("selectDueNotifications — quiet hours and a sleeping baby (spec 2026-
           }),
         ],
         now,
-      ).map((d) => d.userId),
-    ).toEqual(["hold"]);
+      ).map((d) => `${d.userId}:${d.kind}`),
+      // The feed reminder is no longer held, and the forgotten timer has its own.
+    ).toEqual(["hold:feed", "hold:timer"]);
+  });
+});
+
+describe("selectDueNotifications — medicine (spec 2026-11-17 §4.3)", () => {
+  // `now` is 10:00 on 15/11 in VN (03:00Z); the VN day started at 17:00Z on 14/11.
+  const schedule = (over: Record<string, unknown> = {}) => ({
+    id: "m1",
+    name: "Vitamin D",
+    remindAtMin: 540, // 09:00
+    updatedAt: "2026-11-10T00:00:00Z",
+    ...over,
+  });
+  const medBaby = (
+    medicine: Partial<BabyDispatchState["medicine"]>,
+    over: Partial<BabyDispatchState> = {},
+  ) =>
+    baby({
+      lastFeed: null,
+      medicine: {
+        schedules: [],
+        loggedToday: [],
+        lastAntipyretic: null,
+        ...medicine,
+      },
+      ...over,
+    });
+
+  it("reminds once the time has come and the medicine is not logged today", () => {
+    expect(
+      selectDueNotifications([medBaby({ schedules: [schedule()] })], now),
+    ).toEqual([
+      {
+        userId: "u1",
+        kind: "medicine",
+        refKey: "med:m1:2026-11-15:540",
+        title: "Đến giờ uống Vitamin D",
+        body: "Hôm nay chưa ghi Vitamin D.",
+        url: "/",
+        tag: "medicine:m1",
+      },
+    ]);
+  });
+
+  it("waits for the time, and stays quiet once the medicine is logged", () => {
+    expect(
+      selectDueNotifications(
+        [medBaby({ schedules: [schedule({ remindAtMin: 601 })] })],
+        now,
+      ),
+    ).toEqual([]);
+    expect(
+      selectDueNotifications(
+        [medBaby({ schedules: [schedule()], loggedToday: ["vitamin d3"] })],
+        now,
+      ),
+    ).toEqual([]);
+    expect(
+      selectDueNotifications(
+        [medBaby({ schedules: [schedule()], loggedToday: ["DHA"] })],
+        now,
+      ).map((d) => d.refKey),
+    ).toEqual(["med:m1:2026-11-15:540"]);
+  });
+
+  it("uses a new key on a new day and after the time is moved", () => {
+    const next = new Date(now.getTime() + 24 * 3_600_000);
+    expect(
+      selectDueNotifications([medBaby({ schedules: [schedule()] })], next).map(
+        (d) => d.refKey,
+      ),
+    ).toEqual(["med:m1:2026-11-16:540"]);
+    expect(
+      selectDueNotifications(
+        [
+          medBaby({
+            schedules: [
+              // Moved at 09:30 to 09:45: still ahead then, so it reminds again today.
+              schedule({ remindAtMin: 585, updatedAt: "2026-11-15T02:30:00Z" }),
+            ],
+          }),
+        ],
+        now,
+      ).map((d) => d.refKey),
+    ).toEqual(["med:m1:2026-11-15:585"]);
+  });
+
+  it("starts tomorrow when the schedule was created or changed after today's time", () => {
+    expect(
+      selectDueNotifications(
+        [
+          medBaby({
+            // Switched on at 09:50 with the 09:00 default.
+            schedules: [schedule({ updatedAt: "2026-11-15T02:50:00Z" })],
+          }),
+        ],
+        now,
+      ),
+    ).toEqual([]);
+  });
+
+  it("follows the Nhắc thuốc switch, snooze and quiet hours", () => {
+    const on = {
+      feed_reminder: true,
+      wake_window: true,
+      vaccine: true,
+      snooze_until: null,
+    };
+    const due = selectDueNotifications(
+      [
+        medBaby(
+          { schedules: [schedule()] },
+          {
+            recipients: [
+              { userId: "off", prefs: { ...on, medicine: false } },
+              {
+                userId: "snoozed",
+                prefs: { ...on, snooze_until: minutesAgo(-30) },
+              },
+              {
+                userId: "quiet",
+                prefs: {
+                  ...on,
+                  quiet_enabled: true,
+                  quiet_start_min: 540,
+                  quiet_end_min: 660,
+                },
+              },
+              { userId: "on", prefs: on },
+              { userId: "none", prefs: null },
+            ],
+          },
+        ),
+      ],
+      now,
+    );
+    expect(due.map((d) => d.userId)).toEqual(["on", "none"]);
+  });
+});
+
+describe("selectDueNotifications — after an antipyretic dose (spec 2026-11-17 §4.3)", () => {
+  const dose = (minutes: number) => ({
+    id: "F1",
+    startedAt: minutesAgo(minutes),
+  });
+  const feverBaby = (minutes: number, over: Partial<BabyDispatchState> = {}) =>
+    baby({
+      lastFeed: null,
+      medicine: {
+        schedules: [],
+        loggedToday: ["Paracetamol"],
+        lastAntipyretic: dose(minutes),
+      },
+      ...over,
+    });
+
+  it("reminds from 4 hours up to, not including, 6 hours after the dose", () => {
+    expect(selectDueNotifications([feverBaby(239)], now)).toEqual([]);
+    expect(selectDueNotifications([feverBaby(240)], now)).toEqual([
+      {
+        userId: "u1",
+        kind: "medicine",
+        refKey: "fever:F1",
+        title: "Đã đủ 4 giờ từ liều hạ sốt",
+        body: "Liều trước lúc 06:00. Đo lại nhiệt độ cho bé.",
+        url: "/",
+        tag: "fever:b1",
+      },
+    ]);
+    expect(selectDueNotifications([feverBaby(359)], now)).toHaveLength(1);
+    expect(selectDueNotifications([feverBaby(360)], now)).toEqual([]);
+  });
+
+  it("is held by the switch and snooze, but not by quiet hours", () => {
+    const on = {
+      feed_reminder: true,
+      wake_window: true,
+      vaccine: true,
+      snooze_until: null,
+    };
+    const due = selectDueNotifications(
+      [
+        feverBaby(250, {
+          recipients: [
+            { userId: "off", prefs: { ...on, medicine: false } },
+            {
+              userId: "snoozed",
+              prefs: { ...on, snooze_until: minutesAgo(-30) },
+            },
+            {
+              userId: "quiet",
+              prefs: {
+                ...on,
+                quiet_enabled: true,
+                quiet_start_min: 540,
+                quiet_end_min: 660,
+              },
+            },
+          ],
+        }),
+      ],
+      now,
+    );
+    expect(due.map((d) => d.userId)).toEqual(["quiet"]);
+  });
+});
+
+describe("selectDueNotifications — a timer left running (spec 2026-11-17 §4.3)", () => {
+  const timer = (
+    type: "breast" | "sleep" | "pump" | "tummy",
+    minutes: number,
+    side: "left" | "right" | null = null,
+  ) => ({ id: `T-${type}`, type, startedAt: minutesAgo(minutes), side });
+  const timerBaby = (
+    runningTimers: BabyDispatchState["runningTimers"],
+    over: Partial<BabyDispatchState> = {},
+  ) => baby({ lastFeed: null, runningTimers, ...over });
+
+  it("reminds at each type's limit, not before", () => {
+    expect(
+      selectDueNotifications(
+        [
+          timerBaby([
+            timer("breast", 59, "left"),
+            timer("pump", 59),
+            timer("tummy", 29),
+            timer("sleep", 839),
+          ]),
+        ],
+        now,
+      ),
+    ).toEqual([]);
+    const due = selectDueNotifications(
+      [
+        timerBaby([
+          timer("breast", 60, "right"),
+          timer("pump", 60),
+          timer("tummy", 30),
+          timer("sleep", 840),
+        ]),
+      ],
+      now,
+    );
+    expect(due.map((d) => [d.kind, d.refKey, d.title])).toEqual([
+      ["timer", "timer:T-breast", "Timer Bú phải đã chạy quá 60 phút"],
+      ["timer", "timer:T-pump", "Timer Hút sữa đã chạy quá 60 phút"],
+      ["timer", "timer:T-tummy", "Timer Nằm sấp đã chạy quá 30 phút"],
+      ["timer", "timer:T-sleep", "Timer Ngủ đã chạy quá 14 giờ"],
+    ]);
+    expect(due[0]).toMatchObject({
+      body: "Nếu đã xong, mở Kim Bun để dừng.",
+      url: "/",
+      tag: "timer:T-breast",
+    });
+  });
+
+  it("follows the timer switch, snooze and quiet hours", () => {
+    const on = {
+      feed_reminder: true,
+      wake_window: true,
+      vaccine: true,
+      snooze_until: null,
+    };
+    const due = selectDueNotifications(
+      [
+        timerBaby([timer("tummy", 45)], {
+          recipients: [
+            { userId: "off", prefs: { ...on, timer_alert: false } },
+            {
+              userId: "snoozed",
+              prefs: { ...on, snooze_until: minutesAgo(-30) },
+            },
+            {
+              userId: "quiet",
+              prefs: {
+                ...on,
+                quiet_enabled: true,
+                quiet_start_min: 540,
+                quiet_end_min: 660,
+              },
+            },
+            { userId: "on", prefs: on },
+            { userId: "none", prefs: null },
+          ],
+        }),
+      ],
+      now,
+    );
+    expect(due.map((d) => d.userId)).toEqual(["on", "none"]);
+  });
+});
+
+describe("buildMedicineState (spec 2026-11-17 §4.3)", () => {
+  const log = (id: string, startedAt: string, details: unknown) => ({
+    id,
+    started_at: startedAt,
+    details,
+  });
+  const med = (name: string, antipyretic = false) => ({
+    name,
+    amount: 1,
+    unit: "ml",
+    antipyretic,
+  });
+
+  it("keeps enabled schedules, today's names and the latest antipyretic of the last 6 hours", () => {
+    const state = buildMedicineState({
+      schedules: [
+        {
+          id: "m1",
+          name: "Vitamin D",
+          remind_at_min: 540,
+          enabled: true,
+          updated_at: "2026-11-10T00:00:00Z",
+        },
+        {
+          id: "m2",
+          name: "DHA",
+          remind_at_min: 600,
+          enabled: false,
+          updated_at: "2026-11-10T00:00:00Z",
+        },
+      ],
+      medicineLogs: [
+        log("a", "2026-11-14T16:59:00Z", med("Hôm qua")), // 23:59 on 14/11 in VN
+        log("b", "2026-11-14T17:00:00Z", med("Vitamin D")), // 00:00 on 15/11
+        log("c", "2026-11-14T20:59:00Z", med("Paracetamol", true)), // 6 h 01 before now
+        log("d", "2026-11-14T22:00:00Z", med("Paracetamol", true)), // 5 h before now
+        log("e", "2026-11-15T01:00:00Z", med("Ibuprofen", true)), // 2 h before now
+        log("f", "2026-11-15T02:00:00Z", med("DHA")),
+        log("g", "2026-11-15T02:30:00Z", { broken: true }),
+      ],
+      now,
+    });
+    expect(state).toEqual({
+      schedules: [
+        {
+          id: "m1",
+          name: "Vitamin D",
+          remindAtMin: 540,
+          updatedAt: "2026-11-10T00:00:00Z",
+        },
+      ],
+      loggedToday: [
+        "Vitamin D",
+        "Paracetamol",
+        "Paracetamol",
+        "Ibuprofen",
+        "DHA",
+      ],
+      lastAntipyretic: { id: "e", startedAt: "2026-11-15T01:00:00Z" },
+    });
+  });
+
+  it("has no antipyretic when the last one is older than 6 hours", () => {
+    const state = buildMedicineState({
+      schedules: [],
+      medicineLogs: [
+        log("c", "2026-11-14T20:59:00Z", med("Paracetamol", true)),
+      ],
+      now,
+    });
+    expect(state.lastAntipyretic).toBeNull();
+    expect(state.loggedToday).toEqual(["Paracetamol"]);
   });
 });
diff --git a/lib/server/dispatch.test.ts b/lib/server/dispatch.test.ts
index 4cdc006..b9b3d9c 100644
--- a/lib/server/dispatch.test.ts
+++ b/lib/server/dispatch.test.ts
@@ -16,6 +16,7 @@ const dueBaby: BabyDispatchState = {
   lastFeed: { id: "L1", startedAt: "2026-11-14T23:00:00Z" }, // 4 hours ago
   breastRunningSince: null,
   runningTimers: [],
+  medicine: { schedules: [], loggedToday: [], lastAntipyretic: null },
   wake: null,
   vaccine: null,
   recipients: [{ userId: "u1", prefs: null }],
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run lib/rules/pushSelection.test.ts lib/server/dispatch.test.ts`
Expected: `Test Files  1 failed | 1 passed (2)`, `Tests  11 failed | 29 passed (40)`.

- [x] **Step 3: Viết code (Patch 4)**

Run: `kb_patch 4 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/lib/rules/notifications.ts b/lib/rules/notifications.ts
index 6ac4a84..e871da1 100644
--- a/lib/rules/notifications.ts
+++ b/lib/rules/notifications.ts
@@ -50,7 +50,8 @@ export const DEFAULT_QUIET: QuietPrefs = {
   quiet_end_min: 360,
 };
 
-function vnMinuteOfDay(now: Date): number {
+// Minutes after 00:00 Vietnam time.
+export function vnMinuteOfDay(now: Date): number {
   const [hours, minutes] = formatVnTime(now).split(":").map(Number);
   return hours * 60 + minutes;
 }
diff --git a/lib/rules/pushSelection.ts b/lib/rules/pushSelection.ts
index 08610f5..f8bc023 100644
--- a/lib/rules/pushSelection.ts
+++ b/lib/rules/pushSelection.ts
@@ -1,13 +1,16 @@
 import { VACCINES } from "@/lib/content/vaccines";
 import type { VaccineDose } from "@/lib/content/vaccineSchema";
-import { addDays, formatDayShort, WEEKDAYS } from "./days";
-import { DEFAULT_QUIET, inQuietHours } from "./notifications";
+import { addDays, formatDayShort, vnDayStartMs, WEEKDAYS } from "./days";
+import { detailsSchemas } from "./logDetails";
+import { sameMedicine } from "./medicineNames";
+import { DEFAULT_QUIET, inQuietHours, vnMinuteOfDay } from "./notifications";
 import { FORGOTTEN_BREAST_MS } from "./ratings";
 import { ageDays, formatVnTime, vnDateString } from "./time";
 import { TIMER_LIMIT_MIN } from "./timer";
 import { buildSchedule, type DoseRecord } from "./vaccines";
 
-export type NotificationKind = "feed" | "wake" | "vaccine";
+export type NotificationKind =
+  "feed" | "wake" | "vaccine" | "medicine" | "timer";
 
 export type Recipient = {
   userId: string;
@@ -58,10 +61,25 @@ export type BabyDispatchState = {
     choices: Record<string, string>;
     records: DoseRecord[];
   } | null;
+  // Spec 2026-11-17 §4.3. `schedules` holds the enabled ones only; `loggedToday`
+  // the names of the medicine logs since 00:00 VN; `lastAntipyretic` the latest
+  // antipyretic dose of the last 6 hours.
+  medicine: MedicineState;
   // Members with a user_id and at least one push subscription.
   recipients: Recipient[];
 };
 
+export type MedicineState = {
+  schedules: {
+    id: string;
+    name: string;
+    remindAtMin: number;
+    updatedAt: string;
+  }[];
+  loggedToday: string[];
+  lastAntipyretic: { id: string; startedAt: string } | null;
+};
+
 export type DueNotification = {
   userId: string;
   kind: NotificationKind;
@@ -248,7 +266,176 @@ function vaccineReminders(
   );
 }
 
-// Spec §8.3: "feed", "wake" and "vaccine".
+const SIX_HOURS_MS = 6 * HOUR_MS;
+
+// What the dispatcher knows about a baby's medicine, from the rows it loaded:
+// `medicineLogs` are the baby's medicine logs since the earlier of 00:00 VN
+// today and six hours ago.
+export function buildMedicineState(input: {
+  schedules: {
+    id: string;
+    name: string;
+    remind_at_min: number;
+    enabled: boolean;
+    updated_at: string;
+  }[];
+  medicineLogs: { id: string; started_at: string; details: unknown }[];
+  now: Date;
+}): MedicineState {
+  const { schedules, medicineLogs, now } = input;
+  const dayStart = vnDayStartMs(vnDateString(now));
+  const loggedToday: string[] = [];
+  let lastAntipyretic: { id: string; startedAt: string; at: number } | null =
+    null;
+  const sorted = [...medicineLogs].sort(
+    (a, b) => Date.parse(a.started_at) - Date.parse(b.started_at),
+  );
+  for (const log of sorted) {
+    const parsed = detailsSchemas.medicine.safeParse(log.details);
+    const at = Date.parse(log.started_at);
+    if (!parsed.success || at > now.getTime()) continue;
+    if (at >= dayStart) loggedToday.push(parsed.data.name);
+    if (parsed.data.antipyretic && now.getTime() - at < SIX_HOURS_MS)
+      lastAntipyretic = { id: log.id, startedAt: log.started_at, at };
+  }
+  return {
+    schedules: schedules
+      .filter((s) => s.enabled)
+      .map((s) => ({
+        id: s.id,
+        name: s.name,
+        remindAtMin: s.remind_at_min,
+        updatedAt: s.updated_at,
+      })),
+    loggedToday,
+    lastAntipyretic: lastAntipyretic && {
+      id: lastAntipyretic.id,
+      startedAt: lastAntipyretic.startedAt,
+    },
+  };
+}
+
+// The "Nhắc thuốc" switch and snooze hold both medicine reminders; quiet hours
+// hold only the daily one (spec 2026-11-17 §4.3).
+function wantsMedicine(
+  recipient: Recipient,
+  now: Date,
+  quietApplies: boolean,
+): boolean {
+  const prefs = recipient.prefs;
+  if (!prefs) return true;
+  return (
+    (prefs.medicine ?? true) &&
+    notSnoozed(prefs, now) &&
+    !(quietApplies && isQuiet(prefs, now))
+  );
+}
+
+// From the reminder time to the end of the VN day, while today has no log of
+// that medicine. A schedule created or changed after today's time starts tomorrow.
+function medicineReminders(
+  baby: BabyDispatchState,
+  now: Date,
+): DueNotification[] {
+  const today = vnDateString(now);
+  const minute = vnMinuteOfDay(now);
+  const dayStart = vnDayStartMs(today);
+  return baby.medicine.schedules
+    .filter((schedule) => {
+      const remindAt = dayStart + schedule.remindAtMin * 60_000;
+      return (
+        minute >= schedule.remindAtMin &&
+        Date.parse(schedule.updatedAt) <= remindAt &&
+        !baby.medicine.loggedToday.some((name) =>
+          sameMedicine(schedule.name, name),
+        )
+      );
+    })
+    .flatMap((schedule) =>
+      baby.recipients
+        .filter((recipient) => wantsMedicine(recipient, now, true))
+        .map((recipient): DueNotification => ({
+          userId: recipient.userId,
+          kind: "medicine",
+          // The time is part of the key: a schedule moved to later today reminds again.
+          refKey: `med:${schedule.id}:${today}:${schedule.remindAtMin}`,
+          title: `Đến giờ uống ${schedule.name}`,
+          body: `Hôm nay chưa ghi ${schedule.name}.`,
+          url: "/",
+          tag: `medicine:${schedule.id}`,
+        })),
+    );
+}
+
+// Four hours after the latest antipyretic dose: time to measure again. It never
+// says whether to give another dose.
+function feverReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
+  const dose = baby.medicine.lastAntipyretic;
+  if (!dose) return [];
+  const since = now.getTime() - Date.parse(dose.startedAt);
+  if (since < 4 * HOUR_MS || since >= SIX_HOURS_MS) return [];
+  const body = `Liều trước lúc ${formatVnTime(new Date(dose.startedAt))}. Đo lại nhiệt độ cho bé.`;
+  return baby.recipients
+    .filter((recipient) => wantsMedicine(recipient, now, false))
+    .map((recipient) => ({
+      userId: recipient.userId,
+      kind: "medicine",
+      refKey: `fever:${dose.id}`,
+      title: "Đã đủ 4 giờ từ liều hạ sốt",
+      body,
+      url: "/",
+      tag: `fever:${baby.babyId}`,
+    }));
+}
+
+const TIMER_NAME = { sleep: "Ngủ", pump: "Hút sữa", tummy: "Nằm sấp" } as const;
+
+function timerName(timer: RunningTimer): string {
+  if (timer.type === "breast")
+    return timer.side === "right" ? "Bú phải" : "Bú trái";
+  return TIMER_NAME[timer.type];
+}
+
+const limitText = (minutes: number) =>
+  minutes % 60 === 0 && minutes > 60
+    ? `${minutes / 60} giờ`
+    : `${minutes} phút`;
+
+function wantsTimer(recipient: Recipient, now: Date): boolean {
+  const prefs = recipient.prefs;
+  if (!prefs) return true;
+  return (
+    (prefs.timer_alert ?? true) &&
+    notSnoozed(prefs, now) &&
+    !isQuiet(prefs, now)
+  );
+}
+
+// Once per timer that ran past its limit (spec 2026-11-17 §4.3).
+function timerReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
+  return baby.runningTimers
+    .filter(
+      (timer) =>
+        now.getTime() - Date.parse(timer.startedAt) >=
+        TIMER_LIMIT_MIN[timer.type] * 60_000,
+    )
+    .flatMap((timer) =>
+      baby.recipients
+        .filter((recipient) => wantsTimer(recipient, now))
+        .map((recipient): DueNotification => ({
+          userId: recipient.userId,
+          kind: "timer",
+          refKey: `timer:${timer.id}`,
+          // "quá": still true when quiet hours or snooze delayed it.
+          title: `Timer ${timerName(timer)} đã chạy quá ${limitText(TIMER_LIMIT_MIN[timer.type])}`,
+          body: "Nếu đã xong, mở Kim Bun để dừng.",
+          url: "/",
+          tag: `timer:${timer.id}`,
+        })),
+    );
+}
+
+// Spec §8.3: "feed", "wake" and "vaccine"; spec 2026-11-17 §4.3: "medicine" and "timer".
 export function selectDueNotifications(
   babies: BabyDispatchState[],
   now: Date,
@@ -258,5 +445,8 @@ export function selectDueNotifications(
     ...feedReminders(baby, now),
     ...wakeReminders(baby, now),
     ...vaccineReminders(baby, now, vaccineDoses),
+    ...medicineReminders(baby, now),
+    ...feverReminders(baby, now),
+    ...timerReminders(baby, now),
   ]);
 }
diff --git a/lib/server/dispatchDeps.ts b/lib/server/dispatchDeps.ts
index 0e1e182..156436b 100644
--- a/lib/server/dispatchDeps.ts
+++ b/lib/server/dispatchDeps.ts
@@ -1,8 +1,11 @@
 import webpush from "web-push";
-import type {
-  BabyDispatchState,
-  RunningTimer,
+import { vnDayStartMs } from "@/lib/rules/days";
+import {
+  buildMedicineState,
+  type BabyDispatchState,
+  type RunningTimer,
 } from "@/lib/rules/pushSelection";
+import { vnDateString } from "@/lib/rules/time";
 import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
 import type { DispatchDeps } from "./dispatch";
 import { pushEnv } from "./pushEnv";
@@ -26,41 +29,65 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
   const states: BabyDispatchState[] = [];
   for (const baby of babies) {
     const since = new Date(now.getTime() - TWELVE_HOURS_MS).toISOString();
-    const [feeds, sleeps, running, members, doses] = await Promise.all([
-      db
-        .from("logs")
-        .select("id, started_at")
-        .eq("baby_id", baby.id)
-        .in("type", ["breast", "bottle"])
-        .gte("started_at", since)
-        .order("started_at", { ascending: false })
-        .limit(1),
-      db
-        .from("logs")
-        .select("id, ended_at")
-        .eq("baby_id", baby.id)
-        .eq("type", "sleep")
-        .gte("ended_at", since)
-        .order("ended_at", { ascending: false })
-        .limit(1),
-      // Running timers: at most one per type (unique index), so four rows at most.
-      db
-        .from("logs")
-        .select("id, type, started_at, details")
-        .eq("baby_id", baby.id)
-        .in("type", ["breast", "sleep", "pump", "tummy"])
-        .is("ended_at", null),
-      db
-        .from("family_members")
-        .select("user_id")
-        .eq("family_id", baby.family_id)
-        .not("user_id", "is", null),
-      db
-        .from("vaccine_doses")
-        .select("vaccine_code, dose_no, status, given_on, due_on_override")
-        .eq("baby_id", baby.id),
-    ]);
-    for (const result of [feeds, sleeps, running, members, doses])
+    // Medicine logs since the earlier of 00:00 VN today and six hours ago.
+    const medicineSince = new Date(
+      Math.min(vnDayStartMs(vnDateString(now)), now.getTime() - 6 * 3_600_000),
+    ).toISOString();
+    const [feeds, sleeps, running, members, doses, schedules, medicineLogs] =
+      await Promise.all([
+        db
+          .from("logs")
+          .select("id, started_at")
+          .eq("baby_id", baby.id)
+          .in("type", ["breast", "bottle"])
+          .gte("started_at", since)
+          .order("started_at", { ascending: false })
+          .limit(1),
+        db
+          .from("logs")
+          .select("id, ended_at")
+          .eq("baby_id", baby.id)
+          .eq("type", "sleep")
+          .gte("ended_at", since)
+          .order("ended_at", { ascending: false })
+          .limit(1),
+        // Running timers: at most one per type (unique index), so four rows at most.
+        db
+          .from("logs")
+          .select("id, type, started_at, details")
+          .eq("baby_id", baby.id)
+          .in("type", ["breast", "sleep", "pump", "tummy"])
+          .is("ended_at", null),
+        db
+          .from("family_members")
+          .select("user_id")
+          .eq("family_id", baby.family_id)
+          .not("user_id", "is", null),
+        db
+          .from("vaccine_doses")
+          .select("vaccine_code, dose_no, status, given_on, due_on_override")
+          .eq("baby_id", baby.id),
+        db
+          .from("medicine_schedules")
+          .select("id, name, remind_at_min, enabled, updated_at")
+          .eq("baby_id", baby.id)
+          .eq("enabled", true),
+        db
+          .from("logs")
+          .select("id, started_at, details")
+          .eq("baby_id", baby.id)
+          .eq("type", "medicine")
+          .gte("started_at", medicineSince),
+      ]);
+    for (const result of [
+      feeds,
+      sleeps,
+      running,
+      members,
+      doses,
+      schedules,
+      medicineLogs,
+    ])
       if (result.error) throw result.error;
 
     const userIds = (members.data ?? []).flatMap((m) =>
@@ -102,6 +129,11 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
           : null,
         sleepRunning: runningTypes.has("sleep"),
       },
+      medicine: buildMedicineState({
+        schedules: schedules.data ?? [],
+        medicineLogs: medicineLogs.data ?? [],
+        now,
+      }),
       vaccine: {
         dob: baby.dob,
         choices: parseChoices(baby.vaccine_choices),
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  145 passed (145)`, `Tests  903 passed (903)`.

- [x] **Step 5: Commit**

```bash
git add lib/rules/pushSelection.test.ts lib/server/dispatch.test.ts lib/rules/notifications.ts lib/rules/pushSelection.ts lib/server/dispatchDeps.ts
git commit -m "feat(push): daily medicine, post-antipyretic and long-timer reminders" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 3: Màn Cài đặt › Nhắc thuốc và hàng "Lịch nhắc thuốc" (§4.2, §4.4)

**Files:**

- Create: `lib/data/medicineSchedules.ts`, `components/settings/MedicineScheduleSection.tsx`, `app/cai-dat/nhac-thuoc/page.tsx`
- Modify: `lib/supabase/rows.ts`, `components/settings/NotificationsGroup.tsx`, `components/settings/SettingsScreen.tsx`, `sw/sw.template.js`
- Test: `components/settings/medicineschedule.test.tsx` (mới), `components/settings/notifications.test.tsx`, `scripts/sw.test.ts`

**Interfaces:**

- Consumes: `scheduleRows`, `newScheduleError`, `enabledCountText`, `DEFAULT_REMIND_MIN`, `ScheduleLike`, `ScheduleRow` (Task 1); `minutesToTime`, `timeToMinutes` (M3); bảng `medicine_schedules` (M3).
- Produces: `useMedicineSchedules`, `useScheduleActions`; `MedicineScheduleRow`; `MedicineScheduleView({ rows, busy, onToggle(row, enabled), onTime(schedule, minutes), onRemove(schedule), onAdd(name): string | null })`, `AddMedicineForm({ busy, onAdd })`, `MedicineScheduleSection({ baby })`; trang `/cai-dat/nhac-thuoc`; `NotificationsGroupView` có prop `medicine: string`; `NotificationsGroup` có prop `babyId: string`; `PAGES` của service worker có trang mới.

**Đọc trước khi làm (AGENTS.md):** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`. Trang mới chép đúng mẫu `app/cai-dat/cu-bu/page.tsx`. Mọi thay đổi ở màn này được ghi ngay (không có nút Lưu); nút "Xóa" hỏi lại bằng `window.confirm("Xóa nhắc thuốc này?")`; `SettingsSubpage` đã bọc `OnlineOnly` nên offline thì mọi nút mờ.

- [x] **Step 1: Viết test hỏng (Patch 5)**

Run: `kb_patch 5 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/components/settings/medicineschedule.test.tsx b/components/settings/medicineschedule.test.tsx
new file mode 100644
index 0000000..a39959d
--- /dev/null
+++ b/components/settings/medicineschedule.test.tsx
@@ -0,0 +1,121 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements, hostElements } from "@/components/ui/testTree";
+import { scheduleRows, type ScheduleLike } from "@/lib/rules/medicineSchedule";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import {
+  AddMedicineForm,
+  MedicineScheduleView,
+} from "./MedicineScheduleSection";
+
+const saved = (over: Partial<ScheduleLike>): ScheduleLike => ({
+  id: "s1",
+  name: "Vitamin D",
+  remind_at_min: 540,
+  enabled: true,
+  created_at: "2026-11-17T01:00:00Z",
+  ...over,
+});
+const rows = scheduleRows([
+  saved({}),
+  saved({
+    id: "s2",
+    name: "Men tiêu hoá",
+    remind_at_min: 1170,
+    enabled: false,
+  }),
+  saved({ id: "s3", name: "Siro sắt", remind_at_min: 480 }),
+]);
+const view = (
+  over: Partial<Parameters<typeof MedicineScheduleView>[0]> = {},
+) => ({
+  rows,
+  busy: false,
+  onToggle: () => {},
+  onTime: () => {},
+  onRemove: () => {},
+  onAdd: () => null,
+  ...over,
+});
+
+describe("MedicineScheduleView (spec 2026-11-17 §4.2)", () => {
+  it("lists the presets and the other medicines, with a time only where it is on", () => {
+    const html = renderToStaticMarkup(<MedicineScheduleView {...view()} />);
+    expect(html).toContain(
+      "Tới giờ mà hôm nay chưa ghi thuốc đó thì Kim Bun gửi một thông báo.",
+    );
+    const names = [...html.matchAll(/data-medicine="([^"]+)"/g)].map(
+      (m) => m[1],
+    );
+    expect(names).toEqual(["Vitamin D", "DHA", "Men tiêu hoá", "Siro sắt"]);
+    expect(html.match(/role="switch"/g)).toHaveLength(4);
+    expect(html.match(/aria-checked="(true|false)"/g)).toEqual([
+      'aria-checked="true"',
+      'aria-checked="false"',
+      'aria-checked="false"',
+      'aria-checked="true"',
+    ]);
+    // Only the two that are on show their time.
+    expect(html.match(/type="time"/g)).toHaveLength(2);
+    expect(html).toContain('aria-label="Giờ nhắc Vitamin D"');
+    expect(html).toContain('value="09:00"');
+    expect(html).toContain('value="08:00"');
+    expect(html).not.toContain('value="19:30"');
+    expect(html).toContain(`d="${ICON_PATHS.pill}"`);
+    // Only the medicine the family added can be removed.
+    expect(html.match(/>Xóa<\/button>/g)).toHaveLength(1);
+    expect(html).toContain(
+      "Lịch vừa bật hoặc vừa đổi sau giờ nhắc của hôm nay sẽ bắt đầu nhắc từ ngày mai.",
+    );
+  });
+
+  it("switches a row on or off, also a preset that has no row yet", () => {
+    const onToggle = vi.fn();
+    const switches = findElements(
+      MedicineScheduleView(view({ onToggle })),
+      (el) => el.props.checked !== undefined,
+    );
+    (switches[1].props.onChange as (v: boolean) => void)(true);
+    expect(onToggle).toHaveBeenCalledWith(rows[1], true);
+    expect(rows[1].schedule).toBeNull();
+    (switches[0].props.onChange as (v: boolean) => void)(false);
+    expect(onToggle).toHaveBeenCalledWith(rows[0], false);
+  });
+
+  it("saves a time as soon as it is a full HH:mm, and nothing else", () => {
+    const onTime = vi.fn();
+    const inputs = hostElements(
+      MedicineScheduleView(view({ onTime })),
+      "input",
+    );
+    const change = inputs[0].props.onChange as (e: {
+      target: { value: string };
+    }) => void;
+    change({ target: { value: "" } });
+    expect(onTime).not.toHaveBeenCalled();
+    change({ target: { value: "19:30" } });
+    expect(onTime).toHaveBeenCalledWith(rows[0].schedule, 1170);
+  });
+
+  it("removes only through the Xóa button of an added medicine", () => {
+    const onRemove = vi.fn();
+    const [button] = findElements(
+      MedicineScheduleView(view({ onRemove })),
+      (el) => el.type === "button" && el.props.children === "Xóa",
+    );
+    (button.props.onClick as () => void)();
+    expect(onRemove).toHaveBeenCalledWith(rows[3].schedule);
+  });
+});
+
+describe("AddMedicineForm", () => {
+  it("has a labelled name field limited to 80 characters and a Thêm button", () => {
+    const html = renderToStaticMarkup(
+      <AddMedicineForm busy={false} onAdd={() => null} />,
+    );
+    expect(html).toContain(">Tên thuốc khác</label>");
+    expect(html).toContain('maxLength="80"');
+    expect(html).toContain('placeholder="Ví dụ: Canxi"');
+    expect(html).toContain(">Thêm</button>");
+  });
+});
diff --git a/components/settings/notifications.test.tsx b/components/settings/notifications.test.tsx
index f7d96d2..1284e83 100644
--- a/components/settings/notifications.test.tsx
+++ b/components/settings/notifications.test.tsx
@@ -22,6 +22,7 @@ const view = (
   prefs,
   holdFeed: false,
   quiet: "Tắt",
+  medicine: "2 thuốc",
   disabled: false,
   snooze: "Không",
   device: <p>Thiết bị</p>,
@@ -101,6 +102,7 @@ describe("NotificationsGroupView — spec 2026-11-17 §4.4", () => {
       "Nhắc timer chạy quá lâu",
       "Không nhắc bú khi bé đang ngủ",
       "Giờ yên lặng",
+      "Lịch nhắc thuốc",
       "Tạm tắt nhắc",
     ].map((label) => html.indexOf(`>${label}</span>`));
     expect(order.every((at) => at >= 0)).toBe(true);
@@ -149,6 +151,19 @@ describe("NotificationsGroupView — spec 2026-11-17 §4.4", () => {
     expect(locked.props.onClick).toBeUndefined();
   });
 
+  it("Lịch nhắc thuốc links to its page and shows how many are on", () => {
+    const html = renderToStaticMarkup(<NotificationsGroupView {...view()} />);
+    expect(html).toContain('href="/cai-dat/nhac-thuoc"');
+    expect(html).toContain(">2 thuốc</span>");
+    expect(html).toContain(`d="${ICON_PATHS.calendar}"`);
+    // While the list is still loading the row has no value.
+    const loading = renderToStaticMarkup(
+      <NotificationsGroupView {...view({ medicine: "" })} />,
+    );
+    expect(loading).toContain(">Lịch nhắc thuốc</span>");
+    expect(loading).not.toContain("thuốc</span><svg");
+  });
+
   it("the snooze hint names the four reminders it pauses", () => {
     expect(SNOOZE_HINT).toBe(
       "Tạm tắt nhắc bú, nhắc thức, nhắc thuốc và nhắc timer trên mọi máy của bạn. Nhắc tiêm vẫn gửi.",
diff --git a/scripts/sw.test.ts b/scripts/sw.test.ts
index 238ab25..c46dae5 100644
--- a/scripts/sw.test.ts
+++ b/scripts/sw.test.ts
@@ -104,6 +104,7 @@ describe("service worker", () => {
         "/thong-ke",
         "/kham-pha",
         "/cai-dat/thanh-vien",
+        "/cai-dat/nhac-thuoc",
         "/dang-nhap",
         "/khan-cap",
         "/_next/static/chunks/app.js",
```

- [x] **Step 2: Chạy test, thấy nó hỏng**

Run: `bunx vitest run components/settings/medicineschedule.test.tsx components/settings/notifications.test.tsx scripts/sw.test.ts`
Expected: `Test Files  3 failed (3)`, `Tests  3 failed | 14 passed (17)`.

- [x] **Step 3: Viết code (Patch 6)**

Run: `kb_patch 6 | git apply --verbose`
Expected: mỗi file trong patch được báo `Applied patch <tên file> cleanly.`, không có dòng `error:`.

```diff
diff --git a/app/cai-dat/nhac-thuoc/page.tsx b/app/cai-dat/nhac-thuoc/page.tsx
new file mode 100644
index 0000000..6445802
--- /dev/null
+++ b/app/cai-dat/nhac-thuoc/page.tsx
@@ -0,0 +1,19 @@
+"use client";
+
+import { AuthGate } from "@/components/AuthGate";
+import { MedicineScheduleSection } from "@/components/settings/MedicineScheduleSection";
+import { SettingsSubpage } from "@/components/settings/SettingsSubpage";
+
+export default function Page() {
+  return (
+    <AuthGate need="baby">
+      {({ ctx }) =>
+        ctx?.baby ? (
+          <SettingsSubpage title="Nhắc thuốc">
+            <MedicineScheduleSection baby={ctx.baby} />
+          </SettingsSubpage>
+        ) : null
+      }
+    </AuthGate>
+  );
+}
diff --git a/components/settings/MedicineScheduleSection.tsx b/components/settings/MedicineScheduleSection.tsx
new file mode 100644
index 0000000..7898bf0
--- /dev/null
+++ b/components/settings/MedicineScheduleSection.tsx
@@ -0,0 +1,242 @@
+"use client";
+
+import { useState, type FormEvent } from "react";
+import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
+import { Button } from "@/components/ui/Button";
+import { ErrorCard } from "@/components/ui/ErrorCard";
+import { Icon } from "@/components/ui/Icon";
+import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
+import { Skeleton } from "@/components/ui/Skeleton";
+import { Switch } from "@/components/ui/Switch";
+import { toVietnameseError } from "@/lib/data/errors";
+import {
+  useMedicineSchedules,
+  useScheduleActions,
+} from "@/lib/data/medicineSchedules";
+import {
+  DEFAULT_REMIND_MIN,
+  newScheduleError,
+  scheduleRows,
+  type ScheduleLike,
+  type ScheduleRow,
+} from "@/lib/rules/medicineSchedule";
+import { minutesToTime, timeToMinutes } from "@/lib/rules/notifications";
+import type { Baby } from "@/lib/supabase/rows";
+import { cx } from "@/lib/ui/cx";
+
+const INTRO =
+  "Tới giờ mà hôm nay chưa ghi thuốc đó thì Kim Bun gửi một thông báo.";
+const FOOTNOTE =
+  "Lịch vừa bật hoặc vừa đổi sau giờ nhắc của hôm nay sẽ bắt đầu nhắc từ ngày mai.";
+
+// Spec 2026-11-17 §4.2: every change is saved at once; there is no Lưu button.
+export function MedicineScheduleView({
+  rows,
+  busy,
+  onToggle,
+  onTime,
+  onRemove,
+  onAdd,
+}: {
+  rows: ScheduleRow[];
+  busy: boolean;
+  onToggle: (row: ScheduleRow, enabled: boolean) => void;
+  onTime: (schedule: ScheduleLike, minutes: number) => void;
+  onRemove: (schedule: ScheduleLike) => void;
+  // Returns why the name cannot be added, or null when it was accepted.
+  onAdd: (name: string) => string | null;
+}) {
+  return (
+    <div className="flex flex-col gap-3">
+      <p className="px-1 text-[15px] leading-5 text-muted">{INTRO}</p>
+      <ul className="glass overflow-hidden rounded-[22px]">
+        {rows.map((row) => {
+          const schedule = row.schedule;
+          const on = schedule?.enabled ?? false;
+          return (
+            <li
+              key={row.key}
+              data-medicine={row.name}
+              className="flex flex-wrap items-center gap-x-3 border-b border-line px-4 py-2 last:border-b-0"
+            >
+              <span
+                className={cx(
+                  "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] text-bg",
+                  on ? "bg-cat-med" : "bg-muted",
+                )}
+              >
+                <Icon name="pill" size={17} strokeWidth={2.2} />
+              </span>
+              <span
+                className={cx(
+                  "min-w-0 flex-1 text-base font-semibold",
+                  on ? "text-ink" : "text-muted",
+                )}
+              >
+                {row.name}
+              </span>
+              {schedule && on && (
+                <input
+                  // Re-made when the saved time changes, so it always shows what is saved.
+                  key={schedule.remind_at_min}
+                  type="time"
+                  aria-label={`Giờ nhắc ${row.name}`}
+                  disabled={busy}
+                  className={cx(
+                    FIELD_INPUT,
+                    "w-[112px] text-center tabular-nums",
+                  )}
+                  defaultValue={minutesToTime(schedule.remind_at_min)}
+                  onChange={(event) => {
+                    const minutes = timeToMinutes(event.target.value);
+                    if (minutes !== null) onTime(schedule, minutes);
+                  }}
+                />
+              )}
+              <Switch
+                checked={on}
+                label={`Nhắc ${row.name}`}
+                disabled={busy}
+                onChange={(value) => onToggle(row, value)}
+              />
+              {schedule && !row.preset && (
+                <button
+                  type="button"
+                  disabled={busy}
+                  onClick={() => onRemove(schedule)}
+                  className="ml-[42px] min-h-11 basis-full text-left text-[15px] font-semibold text-danger disabled:opacity-50"
+                >
+                  Xóa
+                </button>
+              )}
+            </li>
+          );
+        })}
+      </ul>
+      <p className="px-1 text-[13px] leading-[18px] text-muted">{FOOTNOTE}</p>
+      <AddMedicineForm busy={busy} onAdd={onAdd} />
+    </div>
+  );
+}
+
+export function AddMedicineForm({
+  busy,
+  onAdd,
+}: {
+  busy: boolean;
+  onAdd: (name: string) => string | null;
+}) {
+  const [name, setName] = useState("");
+  const [message, setMessage] = useState<string | null>(null);
+
+  function submit(event: FormEvent) {
+    event.preventDefault();
+    const error = onAdd(name);
+    setMessage(error);
+    if (error === null) setName("");
+  }
+
+  return (
+    <form onSubmit={submit} className="flex flex-col gap-2">
+      <div className="flex items-end gap-2.5">
+        <div className="flex min-w-0 flex-1 flex-col gap-2">
+          <label htmlFor="medicine-name" className={cx(FIELD_LABEL, "px-1")}>
+            Tên thuốc khác
+          </label>
+          <input
+            id="medicine-name"
+            type="text"
+            maxLength={80}
+            placeholder="Ví dụ: Canxi"
+            className={FIELD_INPUT}
+            value={name}
+            onChange={(event) => {
+              setName(event.target.value);
+              setMessage(null);
+            }}
+          />
+        </div>
+        <Button type="submit" variant="secondary" size="md" disabled={busy}>
+          Thêm
+        </Button>
+      </div>
+      {message && (
+        <p role="alert" className="px-1 text-[15px] text-danger">
+          {message}
+        </p>
+      )}
+    </form>
+  );
+}
+
+export function MedicineScheduleSection({ baby }: { baby: Baby }) {
+  const schedules = useMedicineSchedules(baby.id);
+  const actions = useScheduleActions(baby.id);
+  const failed =
+    actions.add.error ??
+    actions.setEnabled.error ??
+    actions.setTime.error ??
+    actions.remove.error;
+
+  if (waitingForNetwork(schedules))
+    return <NeedsNetwork what="lịch nhắc thuốc" />;
+  if (schedules.isPending)
+    return (
+      <div className="flex flex-col gap-2.5">
+        {[0, 1, 2].map((i) => (
+          <Skeleton key={i} className="h-[52px]" />
+        ))}
+      </div>
+    );
+  if (schedules.isError && !schedules.data)
+    return (
+      <ErrorCard
+        message={toVietnameseError(schedules.error)}
+        onRetry={() => void schedules.refetch()}
+      />
+    );
+
+  const list = schedules.data ?? [];
+  return (
+    <>
+      <MedicineScheduleView
+        rows={scheduleRows(list)}
+        busy={
+          actions.add.isPending ||
+          actions.setEnabled.isPending ||
+          actions.setTime.isPending ||
+          actions.remove.isPending
+        }
+        onToggle={(row, enabled) =>
+          row.schedule
+            ? actions.setEnabled.mutate({ id: row.schedule.id, enabled })
+            : actions.add.mutate({
+                name: row.name,
+                remind_at_min: DEFAULT_REMIND_MIN,
+              })
+        }
+        onTime={(schedule, minutes) =>
+          actions.setTime.mutate({ id: schedule.id, remind_at_min: minutes })
+        }
+        onRemove={(schedule) => {
+          if (window.confirm("Xóa nhắc thuốc này?"))
+            actions.remove.mutate(schedule.id);
+        }}
+        onAdd={(name) => {
+          const error = newScheduleError(name, list);
+          if (error) return error;
+          actions.add.mutate({
+            name: name.trim(),
+            remind_at_min: DEFAULT_REMIND_MIN,
+          });
+          return null;
+        }}
+      />
+      {failed && (
+        <p role="alert" className="px-1 text-[15px] text-danger">
+          {toVietnameseError(failed)}
+        </p>
+      )}
+    </>
+  );
+}
diff --git a/components/settings/NotificationsGroup.tsx b/components/settings/NotificationsGroup.tsx
index b1d3b65..30069e9 100644
--- a/components/settings/NotificationsGroup.tsx
+++ b/components/settings/NotificationsGroup.tsx
@@ -13,7 +13,9 @@ import {
   useNotificationPrefs,
   useSavePrefs,
 } from "@/lib/data/notificationPrefs";
+import { useMedicineSchedules } from "@/lib/data/medicineSchedules";
 import { useNow } from "@/lib/hooks/useNow";
+import { enabledCountText } from "@/lib/rules/medicineSchedule";
 import {
   minutesToTime,
   PREF_OPTIONS,
@@ -48,6 +50,7 @@ export function NotificationsGroupView({
   prefs,
   holdFeed,
   quiet,
+  medicine,
   disabled,
   snooze,
   device,
@@ -60,6 +63,8 @@ export function NotificationsGroupView({
   holdFeed: boolean;
   // "Tắt" or "HH:mm–HH:mm".
   quiet: string;
+  // "Tắt", "<n> thuốc", or "" while the schedules are still loading.
+  medicine: string;
   disabled: boolean;
   snooze: string;
   device: ReactNode;
@@ -109,6 +114,13 @@ export function NotificationsGroupView({
         onClick={disabled ? undefined : onOpenQuiet}
         chevron={!disabled}
       />
+      <ListRow
+        label="Lịch nhắc thuốc"
+        icon="calendar"
+        iconColor="cat-diaper"
+        value={medicine}
+        href="/cai-dat/nhac-thuoc"
+      />
       <ListRow
         label="Tạm tắt nhắc"
         icon="pause"
@@ -266,9 +278,16 @@ export function SnoozeSheet({
   );
 }
 
-export function NotificationsGroup({ userId }: { userId: string }) {
+export function NotificationsGroup({
+  userId,
+  babyId,
+}: {
+  userId: string;
+  babyId: string;
+}) {
   const now = useNow(60_000);
   const prefs = useNotificationPrefs(userId);
+  const schedules = useMedicineSchedules(babyId);
   const save = useSavePrefs(userId);
   const [open, setOpen] = useState(false);
   const [quietOpen, setQuietOpen] = useState(false);
@@ -280,6 +299,7 @@ export function NotificationsGroup({ userId }: { userId: string }) {
         prefs={values}
         holdFeed={values.hold_feed_while_asleep}
         quiet={quietHoursValue(values)}
+        medicine={schedules.data ? enabledCountText(schedules.data) : ""}
         disabled={!prefs.isSuccess || save.isPending}
         snooze={snoozeValue(values.snooze_until, now)}
         device={<DevicePushControl />}
diff --git a/components/settings/SettingsScreen.tsx b/components/settings/SettingsScreen.tsx
index e0b12a4..d5290c4 100644
--- a/components/settings/SettingsScreen.tsx
+++ b/components/settings/SettingsScreen.tsx
@@ -99,7 +99,7 @@ export function SettingsScreen({
             href={isOwner ? "/cai-dat/cu-bu" : undefined}
           />
         </ListGroup>
-        <NotificationsGroup userId={userId} />
+        <NotificationsGroup userId={userId} babyId={baby.id} />
       </OnlineOnly>
 
       <AppearanceGroup />
diff --git a/lib/data/medicineSchedules.ts b/lib/data/medicineSchedules.ts
new file mode 100644
index 0000000..ac5b120
--- /dev/null
+++ b/lib/data/medicineSchedules.ts
@@ -0,0 +1,83 @@
+"use client";
+
+import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
+import { supabase } from "@/lib/supabase/client";
+import type { MedicineScheduleRow } from "@/lib/supabase/rows";
+import { PermissionDeniedError } from "./errors";
+
+const schedulesKey = (babyId: string) =>
+  ["medicine-schedules", babyId] as const;
+
+export function useMedicineSchedules(babyId: string) {
+  return useQuery({
+    queryKey: schedulesKey(babyId),
+    queryFn: async (): Promise<MedicineScheduleRow[]> => {
+      const { data, error } = await supabase()
+        .from("medicine_schedules")
+        .select("*")
+        .eq("baby_id", babyId)
+        .order("created_at");
+      if (error) throw error;
+      return data;
+    },
+    staleTime: 60_000,
+  });
+}
+
+async function updateSchedule(
+  id: string,
+  patch: { enabled?: boolean; remind_at_min?: number },
+): Promise<void> {
+  const { data, error } = await supabase()
+    .from("medicine_schedules")
+    .update(patch)
+    .eq("id", id)
+    .select("id");
+  if (error) throw error;
+  if (data.length === 0) throw new PermissionDeniedError();
+}
+
+// Spec 2026-11-17 §4.2: schedules are written online only (OnlineOnly in the UI).
+export function useScheduleActions(babyId: string) {
+  const queryClient = useQueryClient();
+  const onSettled = () =>
+    queryClient.invalidateQueries({ queryKey: schedulesKey(babyId) });
+  return {
+    add: useMutation({
+      mutationFn: async (input: { name: string; remind_at_min: number }) => {
+        const { error } = await supabase()
+          .from("medicine_schedules")
+          .insert({ baby_id: babyId, ...input });
+        if (error) throw error;
+      },
+      onSettled,
+    }),
+    setEnabled: useMutation({
+      mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
+        updateSchedule(id, { enabled }),
+      onSettled,
+    }),
+    setTime: useMutation({
+      mutationFn: ({
+        id,
+        remind_at_min,
+      }: {
+        id: string;
+        remind_at_min: number;
+      }) => updateSchedule(id, { remind_at_min }),
+      onSettled,
+    }),
+    remove: useMutation({
+      mutationFn: async (id: string) => {
+        const { data, error } = await supabase()
+          .from("medicine_schedules")
+          .delete()
+          .eq("id", id)
+          .select("id");
+        if (error) throw error;
+        if (data.length === 0) throw new PermissionDeniedError();
+      },
+      onSettled,
+    }),
+  };
+}
diff --git a/lib/supabase/rows.ts b/lib/supabase/rows.ts
index 3623d2f..cbcd00d 100644
--- a/lib/supabase/rows.ts
+++ b/lib/supabase/rows.ts
@@ -12,3 +12,4 @@ export type GrowthRow = Tables["growth"]["Row"];
 export type MusicLinkRow = Tables["music_links"]["Row"];
 export type PhotoRow = Tables["photos"]["Row"];
 export type MilestoneRow = Tables["milestones_achieved"]["Row"];
+export type MedicineScheduleRow = Tables["medicine_schedules"]["Row"];
diff --git a/sw/sw.template.js b/sw/sw.template.js
index 16b1dfa..bf5d1b1 100644
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -27,6 +27,7 @@ const PAGES = [
   "/cai-dat/ho-so",
   "/cai-dat/thanh-vien",
   "/cai-dat/cu-bu",
+  "/cai-dat/nhac-thuoc",
   "/cai-app",
   "/dang-nhap",
   "/khai-bao-be",
```

- [x] **Step 4: Chạy typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  146 passed (146)`, `Tests  909 passed (909)`.

- [x] **Step 5: Commit**

```bash
git add components/settings/medicineschedule.test.tsx components/settings/notifications.test.tsx scripts/sw.test.ts app/cai-dat/nhac-thuoc/page.tsx components/settings/MedicineScheduleSection.tsx components/settings/NotificationsGroup.tsx components/settings/SettingsScreen.tsx lib/data/medicineSchedules.ts lib/supabase/rows.ts sw/sw.template.js
git commit -m "feat(settings): medicine reminder schedule page and settings row" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

---

### Task 4: Checklist thiết bị và kiểm cuối M4

**Files:**

- Modify: `docs/device-checklist.md` (thêm bước 31–34 vào cuối), `docs/blueprint/plans/2026-11-17-kim-bun-nhac-thuoc-m4.md` (tick các ô và ghi kết quả)

**Interfaces:**

- Consumes: mọi thứ Task 1–3 tạo ra, và M3.
- Produces: nhánh `feat/kim-bun-nhac-thuoc-m4` chứa cả M3 và M4, sẵn sàng cho người dùng quyết định đưa lên `main`.

- [x] **Step 1: Thêm bước 31–34 vào checklist (Patch 7), commit**

Run: `kb_patch 7 | git apply --verbose`
Expected: `Applied patch docs/device-checklist.md cleanly.`

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index ef48038..c591e8b 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -498,3 +498,68 @@ Kết quả: Chờ người dùng.
 | iPhone 11     |     |         |         |
 | iPhone 16     |     |         |         |
 | iPhone 17 Pro |     |         |         |
+
+## Bước 31 — Bốn loại bản ghi mới (spec 2026-11-17 §3)
+
+1. "+" → nhóm "Khác" → ghi lần lượt Ăn dặm (gõ tên món, chọn Lượng, bật "Món mới"), Uống nước (bấm +10 vài lần), Tắm, Ghi chú (gõ một câu dài hơn 60 ký tự). Kỳ vọng: mỗi lần Lưu có toast Hoàn tác; toast của ghi chú dài bị cắt và kết thúc bằng "…".
+2. Mở Nhật ký. Kỳ vọng: bốn bản ghi hiện đủ với icon riêng; chip "Ăn dặm" lọc ra Ăn dặm và Uống nước; chip "Khác" lọc ra Tắm, Ghi chú, Hút sữa, Nằm sấp. Máy thứ hai cũng thấy.
+3. Bấm bản ghi Ghi chú. Kỳ vọng: sheet chỉ có "Nội dung" và "Thời điểm". Sửa chữ, Lưu. Bấm bản ghi Ăn dặm: có Món, Lượng, Món mới, Phản ứng.
+4. Thống kê → tab "Ăn dặm". Kỳ vọng: cột số bữa cho hôm nay, bảng có "Bữa ăn dặm" và "Nước (ml)".
+5. Dọn dẹp: xóa bốn bản ghi thử.
+
+Kết quả: Chờ người dùng.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
+
+## Bước 32 — Nhắc thuốc (spec 2026-11-17 §4.2, §4.3)
+
+1. Cài đặt → Thông báo → "Lịch nhắc thuốc". Kỳ vọng: có sẵn Vitamin D, DHA, Men tiêu hoá, đang tắt.
+2. Bật Vitamin D rồi đổi giờ nhắc thành giờ hiện tại cộng 2 phút. Không ghi Vitamin D. Khóa màn hình. Kỳ vọng: trong ≤ 3 phút nhận "Đến giờ uống Vitamin D" / "Hôm nay chưa ghi Vitamin D."
+3. Ghi một liều Vitamin D ("+" → Thuốc → chip Vitamin D → Lưu). Đổi giờ nhắc thành giờ hiện tại cộng 2 phút lần nữa. Kỳ vọng: không có thông báo, vì hôm nay đã ghi.
+4. "Tên thuốc khác": gõ "Canxi" → Thêm. Kỳ vọng: dòng Canxi hiện ra, đang bật, giờ 09:00, có nút "Xóa". Gõ "men tiêu hóa" → Thêm. Kỳ vọng: "Thuốc này đã có trong danh sách".
+5. Ghi một liều thuốc có bật "Hạ sốt", Thời điểm = bây giờ trừ 3 giờ 58 phút. Kỳ vọng: trong ≤ 4 phút nhận "Đã đủ 4 giờ từ liều hạ sốt" / "Liều trước lúc HH:mm. Đo lại nhiệt độ cho bé."
+6. Dọn dẹp: xóa dòng Canxi, tắt Vitamin D nếu không dùng, xóa hai bản ghi thuốc thử.
+
+Kết quả: Chờ người dùng.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
+
+## Bước 33 — Giờ yên lặng và "bé đang ngủ" (spec 2026-11-17 §4.3, §4.4)
+
+1. Cài đặt → Thông báo → "Giờ yên lặng": bật, đặt Từ = giờ hiện tại trừ 5 phút, Đến = giờ hiện tại cộng 10 phút → Lưu. Kỳ vọng: hàng hiện hai giờ vừa đặt. Đặt Từ bằng Đến rồi Lưu: "Giờ bắt đầu và kết thúc phải khác nhau".
+2. Tạo điều kiện nhắc bú như bước 2 (Khoảng cách cữ bú 1 giờ; ghi Bú bình lúc bây giờ trừ 59 phút). Kỳ vọng: 3 phút không có thông báo trên máy này; máy của người không bật giờ yên lặng vẫn nhận.
+3. Chờ qua giờ "Đến". Kỳ vọng: trong ≤ 2 phút nhận "Đến giờ bú rồi".
+4. Tắt giờ yên lặng. Bật "Không nhắc bú khi bé đang ngủ" (đọc dòng ghi chú bên dưới). Bấm "Ngủ" ở trang chủ, rồi ghi Bú bình lúc bây giờ trừ 61 phút. Kỳ vọng: không có nhắc bú khi timer Ngủ đang chạy. Bấm "Dừng" timer Ngủ. Kỳ vọng: trong ≤ 2 phút nhận "Đến giờ bú rồi".
+5. Dọn dẹp: tắt công tắc "bé đang ngủ" nếu không dùng, xóa các bản ghi thử, đặt lại Khoảng cách cữ bú.
+
+Kết quả: Chờ người dùng.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
+
+## Bước 34 — Canh timer (spec 2026-11-17 §5, §4.3)
+
+1. Bấm "Nằm sấp" ở trang chủ, sang tab Nhật ký. Kỳ vọng: một viên kính ngay trên thanh tab ghi "Nằm sấp · m:ss" đang nhảy và chữ "Dừng"; về tab Hôm nay thì viên biến mất.
+2. Ở Nhật ký bấm "Dừng" trên viên. Kỳ vọng: viên biến mất, toast Hoàn tác hiện phía trên chỗ viên vừa nằm.
+3. Sau một cữ bú mẹ đã xong: thẻ đầu trang chủ (khi đang "Trễ cữ bú") và hàng "Bấm giờ" có nhãn "Nên bú" trên nút của bên ngược lại, kèm dòng "Lần trước: … lúc …"; bảng "+" cũng có nhãn đó.
+4. Bấm "Nằm sấp" và để yên 31 phút. Kỳ vọng: nhận "Timer Nằm sấp đã chạy quá 30 phút"; trang chủ có dải vàng "Nằm sấp đã chạy … Còn đang nằm sấp không?" với nút "Dừng".
+5. Dọn dẹp: dừng timer, xóa các bản ghi Nằm sấp thử.
+
+Kết quả: Chờ người dùng.
+
+| Máy           | iOS | Kết quả | Ghi chú |
+| ------------- | --- | ------- | ------- |
+| iPhone 11     |     |         |         |
+| iPhone 16     |     |         |         |
+| iPhone 17 Pro |     |         |         |
```

```bash
git add docs/device-checklist.md
git commit -m "docs(checklist): steps 31–34 for the 2026-11-17 features" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 2: Typecheck và toàn bộ test**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  146 passed (146)`, `Tests  909 passed (909)`.

- [x] **Step 3: Build production**

Run: `bun run build`
Expected: lần đầu dừng với `SecurityFatalError` của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` (38 trang, thêm `/cai-dat/nhac-thuoc`) và thoát mã 0.

> **Kết quả 2026-11-17 (Task 1–3, Task 4 Step 1–3).** Trên nhánh `feat/kim-bun-nhac-thuoc-m4` (cắt từ `feat/kim-bun-yen-lang-m3`): cả 7 patch áp sạch; số test đỏ đúng như ghi (2 file không chạy được, 11/40, 3/17); cuối cùng `tsc --noEmit` sạch, `146 passed (146)` file, `909 passed (909)` test. `bun run build` dừng lần đầu với `SecurityFatalError`, lần hai `✓ Generating static pages (38/38)` có `/cai-dat/nhac-thuoc`, thoát mã 0.

- [x] **Step 4: Kiểm trên trình duyệt (phiên chính làm, chỉ nhìn)**

> **Kết quả 2026-11-17.** Phiên chính kiểm bằng trình duyệt có sẵn trong app Claude ở 375×812, người dùng đồng ý ("Kiểm trên trình duyệt"). Không gạt công tắc, không đổi giờ, không bấm Thêm hay Xóa, không gõ gì vào ô tên thuốc.
>
> - Mục 1: nhóm Thông báo có hàng "Lịch nhắc thuốc" giữa "Giờ yên lặng" và "Tạm tắt nhắc", giá trị `Tắt`, dẫn tới `/cai-dat/nhac-thuoc`; không có lỗi tải.
> - Mục 2: trang "Nhắc thuốc" có nút quay lại "Cài đặt", dòng giới thiệu, ba dòng Vitamin D, DHA, Men tiêu hoá đều đang tắt (không có ô giờ), dòng chú thích về lịch vừa bật, ô "Tên thuốc khác" với chữ mờ "Ví dụ: Canxi" (tối đa 80 ký tự) và nút "Thêm". Viên timer (đang có timer Ngủ thật chạy) hiện phía trên thanh tab, không che nội dung.
> - Mục 3: không tràn ngang ở Cài đặt và ở trang Nhắc thuốc.
> - Mục 4: trang Nhắc thuốc đọc rõ ở Hồng dịu và Ban đêm.
> - Mục 5: chưa thử bật lịch, đổi giờ, Thêm, Xóa và nhận push (ô giờ và nút "Xóa" chỉ có unit test). Đó là bước 32–34 của `docs/device-checklist.md`, chờ người dùng.

Bước này do **phiên chính** làm, bằng trình duyệt có sẵn trong app Claude, và cần người dùng đồng ý trước mỗi lần. Người thực thi là subagent thì để ô này chưa tick.

App dev nối vào Supabase thật của gia đình. Ở màn Nhắc thuốc **không có nút Lưu: mọi thao tác đều ghi ngay vào DB**. Trong cả bước này:

- Không gạt công tắc nào, không đổi ô giờ nào, không bấm "Thêm", không bấm "Xóa" ở màn Nhắc thuốc. Gõ chữ vào ô "Tên thuốc khác" để xem thì được, rồi xoá chữ đi; không bấm Enter.
- Không gạt công tắc nào ở nhóm Thông báo; không bấm Lưu ở đâu cả; không bấm nút bấm giờ hay Dừng.

Chạy `bun run dev` (nếu nó dừng với thông báo bảo mật thì chạy lại). Mở `http://localhost:3000/cai-dat` ở cỡ 375×812.

1. Nhóm Thông báo có hàng "Lịch nhắc thuốc" nằm giữa "Giờ yên lặng" và "Tạm tắt nhắc", giá trị `Tắt` (hoặc `<n> thuốc`), có mũi tên. Bấm vào hàng đó.
2. Trang "Nhắc thuốc": nút quay lại "Cài đặt"; dòng "Tới giờ mà hôm nay chưa ghi thuốc đó thì Kim Bun gửi một thông báo."; ba dòng Vitamin D, DHA, Men tiêu hoá (dòng đang tắt không có ô giờ và có icon xám); dòng chú thích "Lịch vừa bật hoặc vừa đổi sau giờ nhắc của hôm nay sẽ bắt đầu nhắc từ ngày mai."; ô "Tên thuốc khác" với chữ mờ "Ví dụ: Canxi" và nút "Thêm". Không có lỗi tải.
3. Chạy bằng javascript tool: `document.documentElement.scrollWidth <= window.innerWidth`. Kỳ vọng `true`.
4. Lặp lại mục 2 ở `document.documentElement.dataset.theme = "rose"` rồi `"night"`. Kỳ vọng: chữ đọc rõ.
5. Không kiểm được ở đây: bật một lịch, đổi giờ, Thêm, Xóa (đều ghi DB), và việc nhận push. Những việc đó là bước 32–34 của `docs/device-checklist.md`, do người dùng làm trên điện thoại.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này.

- [x] **Step 5: Commit phần ghi kết quả, rồi báo cáo**

```bash
git add docs/blueprint/plans/2026-11-17-kim-bun-nhac-thuoc-m4.md
git commit -m "docs(plan): record the M4 check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

Báo cáo cho người dùng: nhánh và `git log --oneline main..HEAD` (gồm cả commit của M3); kết quả typecheck, vitest, build; mục nào của Step 4 đã thấy tận mắt; và các bước 31–34 của checklist đang chờ người dùng. Việc đưa M3 và M4 lên `main` chờ người dùng đồng ý.
