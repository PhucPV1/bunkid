# Kim Bun — Sức khỏe M5b: hai loại thông báo đẩy của tăng trưởng Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§8.1 phần `Recipient.prefs`; §8.2 cảnh báo tăng trưởng; §8.3 phần luật `nextMeasureDue` và `growthMeasureNotifications`; các dòng `measureSchedule` và `pushSelection` của §9.1)

**Status:** approved 2026-11-25 (người dùng duyệt trước mọi plan còn lại của spec này: "duyệt hết, làm cho tới lúc xong và đẩy lên main, giữa chừng có bug gì thì fix luôn, mở trình duyệt thì dùng browser trong app nếu khi implement có hỏi")

**Goal:** Bộ gửi thông báo chạy mỗi phút gửi thêm hai loại: cảnh báo khi lần đo mới nhất lệch chuẩn (cho những người còn lại trong nhà) và nhắc đo định kỳ lúc 08:00.

**Architecture:**

- **Luật thuần:** `lib/rules/measureSchedule.ts` (`nextMeasureDue`, `latestDay`, `daysBetween`) và hai hàm mới trong `lib/rules/pushSelection.ts` (`growthAlertNotifications`, `growthMeasureNotifications`), gọi từ `selectDueNotifications` sau `timerReminders`. Cảnh báo dùng đúng `growthAlerts` của màn Tăng trưởng (§5.1), nên máy chủ và màn hình không bao giờ nói khác nhau.
- **Bảng WHO trên máy chủ:** `lib/content/whoTables.ts` nhập thẳng 6 file `content/who/*.json`. Chỉ bộ gửi dùng module này; các trang vẫn tải từng bảng qua `loadWhoTable`. `selectDueNotifications` nhận bảng qua tham số thứ tư (mặc định là 6 bảng thật) để test đưa bảng nhỏ vào.
- **Dữ liệu:** `lib/server/dispatchDeps.ts` tải thêm tên, giới tính của bé, mọi dòng `growth`, và hai cột tùy chọn mới.
- Không có migration (đã ở M5a), không thêm gói, không đổi giao diện.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Vitest, Bun, `web-push` (đã có). Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m5b`, cắt từ `main` @ `e94edaf` (đã có M5a; migration `20261125000200_growth_push.sql` đã ở DB thật). Baseline: 1593 test vitest xanh (180 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                  | Nội dung                                               | Plan                                                           |
| -------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| M1 đến M4a, M4c, M5a | §3 đến §7.2, §8.1                                      | đã xong, ở `main` @ `e94edaf`                                  |
| **M5b (plan này)**   | §8.2, §8.3: luật của hai loại push, dữ liệu cho bộ gửi | file này                                                       |
| M5c                  | hàng nhắc đo trên trang Chiều cao, dòng 4 của §4, §9.3 | chưa viết                                                      |
| M4b                  | §7.3: dinh dưỡng theo giai đoạn                        | chờ người dùng quyết các dòng mà nguồn không nói đúng như spec |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **`latest`** là dòng có `measuredOn` lớn nhất; bằng nhau thì dòng có `createdAt` muộn hơn (so bằng `Date.parse`).
2. **"Chỉ số đó có giá trị trong chính dòng `latest`"**: một cảnh báo chỉ được tính khi cột của chỉ số ấy (`weightG`, `lengthCm`, `headCm`) trong dòng `latest` khác null **và** cảnh báo nói về đúng ngày đo của `latest` (`alert.measuredOn === latest.measuredOn`). Ví dụ vòng đầu lệch chuẩn từ lần đo tháng trước, hôm nay chỉ cân: không gửi vì vòng đầu. Điều kiện thứ hai chặn một trường hợp hiếm: `growthAlerts` bỏ qua lần đo nằm ngoài bảng WHO (bé quá 1856 ngày tuổi), nên cảnh báo của nó có thể đến từ một lần đo cũ hơn; khi đó không gửi gì.
3. **Quá 24 giờ:** `now − latest.createdAt ≥ 24 giờ` thì thôi. Sửa một lần đo cũ không đổi `createdAt` nên không gửi lại; `refKey` `growth:{id}` chặn lần gửi thứ hai cho cùng một người.
4. **Thứ tự trong `selectDueNotifications`:** `growthAlertNotifications` rồi `growthMeasureNotifications`, cả hai sau `timerReminders`.
5. **`interval` của nhắc đo tính theo ngày tuổi hôm nay**, đúng chữ của §8.3: bé vừa tròn 365 ngày thì kỳ đo đang chờ giãn từ 30 thành 90 ngày kể từ lần đo gần nhất.
6. **Nhắc đo lặp lại:** `today − due` bằng 0, 7, 14, 21 ngày. Mỗi lần có `refKey` riêng theo ngày nên mỗi người nhận mỗi lần một thông báo.
7. **Thời gian giữ thông báo (TTL):** nhắc đo chỉ được chọn trong 08:00–08:59 như nhắc tiêm, nên dùng cùng TTL 12 giờ và độ ưu tiên `normal` của nhắc tiêm, để máy đang tắt mạng buổi sáng vẫn nhận được trong ngày. Cảnh báo tăng trưởng dùng TTL 1 giờ và `high` như các loại còn lại. Spec không ghi mục này.
8. **Tên bé trong tiêu đề** lấy từ `babies.name`. Giới tính khác `"female"` được coi là `"male"`, như `whoSex` đang làm cho màn Tăng trưởng.
9. **Bé quá 1856 ngày tuổi:** `growthAlerts` đã bỏ qua lần đo ngoài bảng WHO (xem mục 2); `nextMeasureDue` trả `measureDue = false`. Không có thông báo nào.
   9a. **Bé chưa đo lần nào mà đã quá `dob + interval + 21` ngày** thì không bao giờ nhận thông báo nhắc đo (đúng chữ của §8.3: chỉ nhắc ở ngày 0, 7, 14, 21). Hàng nhắc đo và dòng "Đến kỳ đo" của M5c vẫn hiện "Đã đến kỳ đo". Ghi vào báo cáo cuối.
10. **Plan này không có bước trình duyệt:** không màn hình nào đổi. Thông báo thật tới máy là việc của checklist thiết bị (§9.3, M5c) và chỉ người dùng kiểm được.
11. **Sau khi lên `main`, bộ gửi thật bắt đầu gửi hai loại này cho gia đình.** Đó là mục đích của mốc. Hệ quả cần biết: nếu lần đo mới nhất được nhập trong 24 giờ qua và có cảnh báo, những người khác trong nhà sẽ nhận một thông báo ngay sau khi bản mới chạy; nếu bé đang tới kỳ đo (hoặc trễ đúng 7, 14, 21 ngày) thì 08:00 sáng hôm đó cả nhà nhận nhắc đo. Ghi điều này vào báo cáo cuối.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`; mã hex trong bản vẽ không được chép vào component.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (hotfix 7822c90): lớp trong chỉ còn màu nền và viền.
- Mọi ngày giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString`, `ageDays`, `ageOnDay` có sẵn.
- Số đo (`growth`) vẫn ghi qua outbox như hiện tại. Hồ sơ bé (`babies`) vẫn ghi bằng `updateBaby` (`lib/data/baby.ts`), chỉ chủ gia đình ghi được (policy `babies_update` hiện có); spec này không đổi policy nào.
- Chữ về sức khỏe: chỉ dùng đúng các câu ghi trong spec này. App không chẩn đoán, không nêu tên bệnh, không nêu liều thuốc, không gợi ý thực phẩm chức năng, không dùng câu nào cam kết đạt chiều cao mục tiêu.
- Mọi con số y khoa mới phải lấy từ nguồn ghi ở §6.2, §7.1, §7.3 và ghi `source`, `reviewedAt` trong file nội dung; không lấy số từ trí nhớ.
- Bảng WHO trong app chỉ có ngày tuổi 0–1856. Ngoài khoảng đó không đánh giá, không cảnh báo, không vẽ đường mục tiêu.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề và nội dung thẻ cảnh báo, dòng chênh dưới thanh vị trí, các đoạn chú thích `text-muted`, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), các dòng dinh dưỡng.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay dừng đồng hồ, không bật tắt công tắc. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Tải file từ `cdn.who.int` (§6.2) cần người dùng đồng ý trước khi chạy.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 1153 test vitest, pgTAP 001–013, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m5b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, trên nền M5a. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh là số đo thật trên cả bộ test. Chưa chạy trong lúc viết plan: `bun run build`.
- **`bun run build`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Không gửi thử thông báo thật, không gọi route gửi thông báo bằng tay**, không đọc hay in secret. Kiểm bằng test là đủ cho plan này.
- **Không gõ mật khẩu hay secret.** Nếu Supabase CLI đòi mật khẩu DB, đòi đăng nhập, hoặc báo project chưa link: dừng, không nhập gì, ghi lại là việc người dùng tự làm, và không đẩy code lên `main`.
- **Lên `main` không cần hỏi**, khi mọi bước kiểm xanh, migration của M5a đã ở DB thật (Task 4 Step 3 kiểm lại) và không còn lỗi đã biết. Gặp lỗi thì sửa trong phiên: test trước, code sau, ghi vào plan. Chỗ nào cần người dùng quyết thì dừng lại và báo.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng sau M5a (đã ở `main` @ `e94edaf`). M5c dùng `nextMeasureDue` cho hàng nhắc đo trên trang Chiều cao và cho dòng 4 của "Cần chú ý".

**Consumes (đã ở `main`):** cột `notification_prefs.growth_alert`, `growth_measure` và hai `kind` mới của `notification_log` (M5a); `growthAlerts`, `GrowthAlert` (`lib/rules/growthAlerts.ts`); `whoSex`, `WhoIndicator`, `WhoSex`, `LmsRow`, `WHO_LAST_DAY` (`lib/content/who.ts`); `content/who/*.json`; `selectDueNotifications`, `Recipient`, `BabyDispatchState`, `DueNotification`, `notSnoozed`, `isQuiet` (`lib/rules/pushSelection.ts`); `addDays`, `formatDayShort`, `vnDayStartMs` (`lib/rules/days.ts`); `formatVnTime`, `vnDateString` (`lib/rules/time.ts`); `supabaseDispatchDeps` (`lib/server/dispatchDeps.ts`).

**Produces:**

- `lib/rules/measureSchedule.ts`:
  - `daysBetween(from: string, to: string): number`;
  - `latestDay(days: string[]): string | null`;
  - `MeasureDue = { interval: 30 | 90; due: string; measureDue: boolean }`;
  - `nextMeasureDue(input: { dob: string; lastMeasuredOn: string | null; today: string }): MeasureDue`.
- `lib/content/whoTables.ts`: `WhoTables = Record<WhoSex, Record<WhoIndicator, LmsRow[]>>`, `WHO_TABLES`.
- `lib/rules/pushSelection.ts`:
  - `NotificationKind` thêm `"growth_alert" | "growth_measure"`;
  - `Recipient.prefs` thêm `growth_alert?: boolean; growth_measure?: boolean` (thiếu nghĩa là bật);
  - `GrowthState = { dob: string; sex: "male" | "female"; rows: { id; measuredOn; weightG; lengthCm; headCm; createdBy; createdAt }[] }`;
  - `BabyDispatchState` thêm `name: string` và `growth: GrowthState`;
  - `selectDueNotifications(babies, now, vaccineDoses?, whoTables?)`.
- `lib/server/dispatchDeps.ts` tải `name`, `sex`, bảng `growth`, hai cột tùy chọn mới; nhắc đo dùng TTL của nhắc tiêm.
- **Vitest sau M5b:** 1618 test, 181 file.

---

### Task 1: Luật kỳ đo (§8.3)

**Files:**

- Create: `lib/rules/measureSchedule.ts`
- Test: `lib/rules/measureSchedule.test.ts` (mới)

**Interfaces:**

- Consumes: `WHO_LAST_DAY`; `addDays`, `vnDayStartMs`.
- Produces: `daysBetween`, `latestDay`, `MeasureDue`, `nextMeasureDue`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m5b
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/measureSchedule.test.ts b/lib/rules/measureSchedule.test.ts
new file mode 100644
index 0000000..df0e48f
--- /dev/null
+++ b/lib/rules/measureSchedule.test.ts
@@ -0,0 +1,62 @@
+import { describe, expect, it } from "vitest";
+import { addDays } from "./days";
+import { latestDay, nextMeasureDue } from "./measureSchedule";
+
+const DOB = "2026-01-01";
+const day = (age: number) => addDays(DOB, age);
+
+// Spec 2026-11-25 §8.3.
+describe("nextMeasureDue", () => {
+  it("under one year the next measurement is 30 days after the last one", () => {
+    expect(
+      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(100), today: day(120) }),
+    ).toEqual({ interval: 30, due: day(130), measureDue: false });
+  });
+
+  it("is due from the due day on", () => {
+    const at = (today: number) =>
+      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(100), today: day(today) })
+        .measureDue;
+    expect(at(129)).toBe(false);
+    expect(at(130)).toBe(true);
+    expect(at(200)).toBe(true);
+  });
+
+  it("the interval follows the age today: 30 days at 364 days old, 90 days from 365", () => {
+    expect(
+      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(350), today: day(364) }),
+    ).toEqual({ interval: 30, due: day(380), measureDue: false });
+    expect(
+      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(350), today: day(365) }),
+    ).toEqual({ interval: 90, due: day(440), measureDue: false });
+  });
+
+  it("never measured: counts from the day of birth", () => {
+    expect(
+      nextMeasureDue({ dob: DOB, lastMeasuredOn: null, today: day(29) }),
+    ).toEqual({ interval: 30, due: day(30), measureDue: false });
+    expect(
+      nextMeasureDue({ dob: DOB, lastMeasuredOn: null, today: day(30) }),
+    ).toEqual({ interval: 30, due: day(30), measureDue: true });
+    expect(
+      nextMeasureDue({ dob: DOB, lastMeasuredOn: null, today: day(400) }),
+    ).toEqual({ interval: 90, due: day(90), measureDue: true });
+  });
+
+  it("past day 1856 nothing is due any more", () => {
+    const at = (today: number) =>
+      nextMeasureDue({ dob: DOB, lastMeasuredOn: day(1000), today: day(today) })
+        .measureDue;
+    expect(at(1856)).toBe(true);
+    expect(at(1857)).toBe(false);
+  });
+});
+
+describe("latestDay", () => {
+  it("is the greatest day, or null with no day", () => {
+    expect(latestDay([])).toBeNull();
+    expect(latestDay(["2026-03-01", "2026-11-02", "2026-10-30"])).toBe(
+      "2026-11-02",
+    );
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 180 passed (181)`, `Tests  1593 passed (1593)`. File test mới không chạy được test nào vì chưa có `./measureSchedule`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/rules/measureSchedule.ts b/lib/rules/measureSchedule.ts
new file mode 100644
index 0000000..db96bf2
--- /dev/null
+++ b/lib/rules/measureSchedule.ts
@@ -0,0 +1,42 @@
+import { WHO_LAST_DAY } from "@/lib/content/who";
+import { addDays, vnDayStartMs } from "./days";
+
+const DAY_MS = 86_400_000;
+
+// Whole days from one calendar day to another.
+export function daysBetween(from: string, to: string): number {
+  return Math.round((vnDayStartMs(to) - vnDayStartMs(from)) / DAY_MS);
+}
+
+// The greatest of the days given ("YYYY-MM-DD"), or null with none.
+export function latestDay(days: string[]): string | null {
+  return days.reduce<string | null>(
+    (latest, day) => (latest === null || day > latest ? day : latest),
+    null,
+  );
+}
+
+export type MeasureDue = {
+  // Days between two measurements at the baby's age today.
+  interval: 30 | 90;
+  due: string;
+  measureDue: boolean;
+};
+
+// Spec 2026-11-25 §8.3: a baby under one year is measured every 30 days, an
+// older child every 90, counted from the last measurement (from the day of
+// birth when there is none). Past the last day of the WHO tables nothing is due.
+export function nextMeasureDue(input: {
+  dob: string;
+  lastMeasuredOn: string | null;
+  today: string;
+}): MeasureDue {
+  const age = daysBetween(input.dob, input.today);
+  const interval = age < 365 ? 30 : 90;
+  const due = addDays(input.lastMeasuredOn ?? input.dob, interval);
+  return {
+    interval,
+    due,
+    measureDue: input.today >= due && age <= WHO_LAST_DAY,
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  181 passed (181)`, `Tests  1599 passed (1599)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/measureSchedule.ts lib/rules/measureSchedule.test.ts
git commit -m "feat(measure): when the next measurement is due" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Thông báo cảnh báo tăng trưởng (§8.1, §8.2)

**Files:**

- Create: `lib/content/whoTables.ts`
- Modify: `lib/rules/pushSelection.ts`, `lib/server/dispatchDeps.ts`
- Test: `lib/rules/pushSelection.test.ts`, `lib/server/dispatch.test.ts` (chỉ thêm hai trường mới vào trạng thái mẫu)

**Interfaces:**

- Consumes: `growthAlerts`; `whoSex`; 6 file `content/who/*.json`; cột `growth_alert` (M5a).
- Produces: `WHO_TABLES`, `WhoTables`; `GrowthState`; `BabyDispatchState.name`, `BabyDispatchState.growth`; `Recipient.prefs.growth_alert`, `growth_measure`; `NotificationKind` có hai loại mới; `selectDueNotifications(babies, now, vaccineDoses?, whoTables?)` trả thêm thông báo `growth_alert`; `dispatchDeps` tải tên, giới tính, bảng `growth` và hai cột tùy chọn.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/rules/pushSelection.test.ts b/lib/rules/pushSelection.test.ts
index 62d9d0d..fce9eda 100644
--- a/lib/rules/pushSelection.test.ts
+++ b/lib/rules/pushSelection.test.ts
@@ -1,11 +1,16 @@
 import { describe, expect, it } from "vitest";
 import type { VaccineDose } from "@/lib/content/vaccineSchema";
+import type { LmsRow } from "@/lib/content/who";
+import { addDays } from "./days";
 import {
   agoText,
   buildMedicineState,
   selectDueNotifications,
   wakeWindowMin,
   type BabyDispatchState,
+  type GrowthState,
+  type Recipient,
+  type WhoTables,
 } from "./pushSelection";

 const now = new Date("2026-11-15T03:00:00Z"); // 10:00 on 15/11 in VN
@@ -15,6 +20,7 @@ const minutesAgo = (m: number) =>
 function baby(over: Partial<BabyDispatchState> = {}): BabyDispatchState {
   return {
     babyId: "b1",
+    name: "Bun",
     feedIntervalMin: 180,
     lastFeed: { id: "L1", startedAt: minutesAgo(190) },
     breastRunningSince: null,
@@ -22,6 +28,7 @@ function baby(over: Partial<BabyDispatchState> = {}): BabyDispatchState {
     medicine: { schedules: [], loggedToday: [], lastAntipyretic: null },
     wake: null,
     vaccine: null,
+    growth: { dob: "2026-01-01", sex: "male", rows: [] },
     recipients: [{ userId: "u1", prefs: null }],
     ...over,
   };
@@ -1016,3 +1023,190 @@ describe("buildMedicineState (spec 2026-11-17 §4.3)", () => {
     expect(state.loggedToday).toEqual(["Paracetamol"]);
   });
 });
+
+// L = 1, S = 1/8 and the same median on every day: z = (value / median − 1) × 8.
+const flat = (median: number): LmsRow[] =>
+  Array.from({ length: 1857 }, (_, day) => [day, 1, median, 0.125]);
+// Boys: median 16, so 9 is far under the norm (z = −3,5). Girls: median 9.
+const TABLES: WhoTables = {
+  boys: { wfa: flat(16), lhfa: flat(16), hcfa: flat(16) },
+  girls: { wfa: flat(9), lhfa: flat(9), hcfa: flat(9) },
+};
+const ALL_ON = {
+  feed_reminder: true,
+  wake_window: true,
+  vaccine: true,
+  snooze_until: null,
+};
+const measured = (
+  over: Partial<GrowthState["rows"][number]> = {},
+): GrowthState["rows"][number] => ({
+  id: "g1",
+  measuredOn: "2026-11-14",
+  weightG: 9000,
+  lengthCm: null,
+  headCm: null,
+  createdBy: "u1",
+  createdAt: minutesAgo(60),
+  ...over,
+});
+const TWO: Recipient[] = [
+  { userId: "u1", prefs: null },
+  { userId: "u2", prefs: null },
+];
+
+describe("selectDueNotifications — growth alert (spec 2026-11-25 §8.2)", () => {
+  const due = (
+    rows: GrowthState["rows"],
+    recipients: Recipient[] = TWO,
+    sex: GrowthState["sex"] = "male",
+    at: Date = now,
+  ) =>
+    selectDueNotifications(
+      [baby({ growth: { dob: "2026-01-01", sex, rows }, recipients })],
+      at,
+      [],
+      TABLES,
+    ).filter((item) => item.kind === "growth_alert");
+
+  it("tells everyone but the member who entered the measurement", () => {
+    expect(due([measured()])).toEqual([
+      {
+        userId: "u2",
+        kind: "growth_alert",
+        refKey: "growth:g1",
+        title: "Tăng trưởng của Bun cần chú ý",
+        body: "Cân nặng thấp hơn chuẩn nhiều. Nên cho bé đi khám.",
+        url: "/tang-truong",
+        tag: "growth:b1",
+      },
+    ]);
+  });
+
+  it("nothing measured, or the newest measurement has no alert: nothing is sent", () => {
+    expect(due([])).toEqual([]);
+    expect(due([measured({ weightG: 16000 })])).toEqual([]);
+  });
+
+  it("only within 24 hours of entering the measurement", () => {
+    expect(
+      due([measured({ createdAt: minutesAgo(24 * 60 - 1) })]),
+    ).toHaveLength(1);
+    expect(due([measured({ createdAt: minutesAgo(24 * 60) })])).toEqual([]);
+  });
+
+  it("an older day entered late is not the newest measurement: nothing is sent", () => {
+    const rows = [
+      measured({ weightG: 16000, createdAt: minutesAgo(3 * 24 * 60) }),
+      measured({
+        id: "g0",
+        measuredOn: "2026-10-01",
+        createdAt: minutesAgo(5),
+      }),
+    ];
+    expect(due(rows)).toEqual([]);
+  });
+
+  it("two rows on the same day: the one entered last is the newest", () => {
+    const rows = [
+      measured({ id: "g1", weightG: 16000, createdAt: minutesAgo(90) }),
+      measured({ id: "g2", createdBy: "u2", createdAt: minutesAgo(30) }),
+    ];
+    expect(due(rows).map((item) => [item.userId, item.refKey])).toEqual([
+      ["u1", "growth:g2"],
+    ]);
+  });
+
+  it("two alerts or more: the body gives the count", () => {
+    const [item] = due([measured({ lengthCm: 9 })]);
+    expect(item.body).toBe("2 chỉ số cần chú ý. Mở app để xem.");
+  });
+
+  it("counts only the indicators the newest measurement itself holds", () => {
+    // The head was last measured on 01/10, far under the norm; the newest
+    // row holds the weight only.
+    const older = measured({
+      id: "g0",
+      measuredOn: "2026-10-01",
+      weightG: null,
+      headCm: 9,
+      createdAt: minutesAgo(60 * 24 * 40),
+    });
+    expect(due([measured({ weightG: 16000 }), older])).toEqual([]);
+    expect(due([measured(), older])[0].body).toBe(
+      "Cân nặng thấp hơn chuẩn nhiều. Nên cho bé đi khám.",
+    );
+  });
+
+  it("an alert about an older measurement is not sent for a newer one outside the WHO table", () => {
+    // The newest row was measured at 1860 days old, past the table, so the
+    // weight alert comes from the row measured at 1850 days.
+    const dob = addDays("2026-11-14", -1860);
+    const rows = [
+      measured({ weightG: 16000 }),
+      measured({
+        id: "g0",
+        measuredOn: addDays(dob, 1850),
+        createdAt: minutesAgo(60 * 24 * 10),
+      }),
+    ];
+    expect(
+      selectDueNotifications(
+        [baby({ growth: { dob, sex: "male", rows }, recipients: TWO })],
+        now,
+        [],
+        TABLES,
+      ).filter((item) => item.kind === "growth_alert"),
+    ).toEqual([]);
+  });
+
+  it("uses the tables of the baby's sex", () => {
+    expect(due([measured()], TWO, "female")).toEqual([]);
+  });
+
+  it("the switch off, snooze and quiet hours hold it; a missing field means on", () => {
+    const recipients: Recipient[] = [
+      { userId: "off", prefs: { ...ALL_ON, growth_alert: false } },
+      {
+        userId: "snoozed",
+        prefs: { ...ALL_ON, snooze_until: minutesAgo(-30) },
+      },
+      {
+        userId: "quiet",
+        prefs: {
+          ...ALL_ON,
+          quiet_enabled: true,
+          quiet_start_min: 0,
+          quiet_end_min: 1439,
+        },
+      },
+      { userId: "plain", prefs: ALL_ON },
+      { userId: "on", prefs: { ...ALL_ON, growth_alert: true } },
+      { userId: "never-saved", prefs: null },
+    ];
+    expect(due([measured()], recipients).map((item) => item.userId)).toEqual([
+      "plain",
+      "on",
+      "never-saved",
+    ]);
+  });
+
+  it("comes after the timer reminders", () => {
+    const kinds = selectDueNotifications(
+      [
+        baby({
+          growth: { dob: "2026-01-01", sex: "male", rows: [measured()] },
+          // A tummy-time timer left running past its 30 minutes.
+          runningTimers: [
+            { id: "t1", type: "tummy", startedAt: minutesAgo(45), side: null },
+          ],
+          recipients: TWO,
+        }),
+      ],
+      now,
+      [],
+      TABLES,
+    ).map((item) => item.kind);
+    expect(kinds).toEqual(["feed", "feed", "timer", "timer", "growth_alert"]);
+  });
+});
diff --git a/lib/server/dispatch.test.ts b/lib/server/dispatch.test.ts
index b9b3d9c..94be140 100644
--- a/lib/server/dispatch.test.ts
+++ b/lib/server/dispatch.test.ts
@@ -12,6 +12,7 @@ const now = new Date("2026-11-15T03:00:00Z");

 const dueBaby: BabyDispatchState = {
   babyId: "b1",
+  name: "Bun",
   feedIntervalMin: 180,
   lastFeed: { id: "L1", startedAt: "2026-11-14T23:00:00Z" }, // 4 hours ago
   breastRunningSince: null,
@@ -19,6 +20,7 @@ const dueBaby: BabyDispatchState = {
   medicine: { schedules: [], loggedToday: [], lastAntipyretic: null },
   wake: null,
   vaccine: null,
+  growth: { dob: "2026-01-01", sex: "male", rows: [] },
   recipients: [{ userId: "u1", prefs: null }],
 };

```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 180 passed (181)`, `Tests  7 failed | 1603 passed (1610)`. Lý do đỏ: chưa có thông báo `growth_alert` nào được chọn. (Bốn test mới còn lại xanh ngay từ đầu vì chúng chờ kết quả rỗng; chúng chỉ có nghĩa sau Patch 4.)

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/lib/content/whoTables.ts b/lib/content/whoTables.ts
new file mode 100644
index 0000000..eaf9f99
--- /dev/null
+++ b/lib/content/whoTables.ts
@@ -0,0 +1,25 @@
+import hcfaBoys from "@/content/who/hcfa_boys.json";
+import hcfaGirls from "@/content/who/hcfa_girls.json";
+import lhfaBoys from "@/content/who/lhfa_boys.json";
+import lhfaGirls from "@/content/who/lhfa_girls.json";
+import wfaBoys from "@/content/who/wfa_boys.json";
+import wfaGirls from "@/content/who/wfa_girls.json";
+import type { LmsRow, WhoIndicator, WhoSex } from "./who";
+
+export type WhoTables = Record<WhoSex, Record<WhoIndicator, LmsRow[]>>;
+
+// All six tables at once (about 290 KB). Only the push dispatcher on the
+// server imports this module; the pages load one table at a time through
+// loadWhoTable.
+export const WHO_TABLES: WhoTables = {
+  boys: {
+    wfa: wfaBoys.rows as LmsRow[],
+    lhfa: lhfaBoys.rows as LmsRow[],
+    hcfa: hcfaBoys.rows as LmsRow[],
+  },
+  girls: {
+    wfa: wfaGirls.rows as LmsRow[],
+    lhfa: lhfaGirls.rows as LmsRow[],
+    hcfa: hcfaGirls.rows as LmsRow[],
+  },
+};
diff --git a/lib/rules/pushSelection.ts b/lib/rules/pushSelection.ts
index f8bc023..3d3460f 100644
--- a/lib/rules/pushSelection.ts
+++ b/lib/rules/pushSelection.ts
@@ -1,6 +1,9 @@
 import { VACCINES } from "@/lib/content/vaccines";
 import type { VaccineDose } from "@/lib/content/vaccineSchema";
+import { whoSex, type WhoIndicator } from "@/lib/content/who";
+import { WHO_TABLES, type WhoTables } from "@/lib/content/whoTables";
 import { addDays, formatDayShort, vnDayStartMs, WEEKDAYS } from "./days";
+import { growthAlerts } from "./growthAlerts";
 import { detailsSchemas } from "./logDetails";
 import { sameMedicine } from "./medicineNames";
 import { DEFAULT_QUIET, inQuietHours, vnMinuteOfDay } from "./notifications";
@@ -10,7 +13,15 @@ import { TIMER_LIMIT_MIN } from "./timer";
 import { buildSchedule, type DoseRecord } from "./vaccines";

 export type NotificationKind =
-  "feed" | "wake" | "vaccine" | "medicine" | "timer";
+  | "feed"
+  | "wake"
+  | "vaccine"
+  | "medicine"
+  | "timer"
+  | "growth_alert"
+  | "growth_measure";
+
+export type { WhoTables };

 export type Recipient = {
   userId: string;
@@ -28,6 +39,9 @@ export type Recipient = {
     quiet_start_min?: number;
     quiet_end_min?: number;
     hold_feed_while_asleep?: boolean;
+    // Spec 2026-11-25 §8.1: missing means on.
+    growth_alert?: boolean;
+    growth_measure?: boolean;
   } | null;
 };

@@ -39,8 +53,25 @@ export type RunningTimer = {
   side: "left" | "right" | null;
 };

+// Spec 2026-11-25 §8.2: every growth row of the baby; empty when nothing was
+// measured yet.
+export type GrowthState = {
+  dob: string;
+  sex: "male" | "female";
+  rows: {
+    id: string;
+    measuredOn: string;
+    weightG: number | null;
+    lengthCm: number | null;
+    headCm: number | null;
+    createdBy: string;
+    createdAt: string;
+  }[];
+};
+
 export type BabyDispatchState = {
   babyId: string;
+  name: string;
   feedIntervalMin: number;
   // Latest breast/bottle log by started_at, or null when there is none.
   lastFeed: { id: string; startedAt: string } | null;
@@ -65,6 +96,7 @@ export type BabyDispatchState = {
   // the names of the medicine logs since 00:00 VN; `lastAntipyretic` the latest
   // antipyretic dose of the last 6 hours.
   medicine: MedicineState;
+  growth: GrowthState;
   // Members with a user_id and at least one push subscription.
   recipients: Recipient[];
 };
@@ -435,11 +467,93 @@ function timerReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
     );
 }

-// Spec §8.3: "feed", "wake" and "vaccine"; spec 2026-11-17 §4.3: "medicine" and "timer".
+const GROWTH_FIELD = {
+  wfa: "weightG",
+  lhfa: "lengthCm",
+  hcfa: "headCm",
+} as const satisfies Record<WhoIndicator, keyof GrowthState["rows"][number]>;
+
+function wantsGrowthAlert(recipient: Recipient, now: Date): boolean {
+  const prefs = recipient.prefs;
+  if (!prefs) return true;
+  return (
+    (prefs.growth_alert ?? true) &&
+    notSnoozed(prefs, now) &&
+    !isQuiet(prefs, now)
+  );
+}
+
+// Spec 2026-11-25 §8.2: within 24 hours of entering the newest measurement,
+// when that measurement itself holds an indicator with an alert. The member
+// who entered it has already seen the alert on the screen.
+function growthAlertNotifications(
+  baby: BabyDispatchState,
+  now: Date,
+  tables: WhoTables,
+): DueNotification[] {
+  const { dob, sex, rows } = baby.growth;
+  const latest = rows.reduce<GrowthState["rows"][number] | null>(
+    (best, row) =>
+      best === null ||
+      row.measuredOn > best.measuredOn ||
+      (row.measuredOn === best.measuredOn &&
+        Date.parse(row.createdAt) > Date.parse(best.createdAt))
+        ? row
+        : best,
+    null,
+  );
+  if (!latest) return [];
+  if (now.getTime() - Date.parse(latest.createdAt) >= 24 * HOUR_MS) return [];
+  const who = whoSex(sex);
+  const alerts = growthAlerts({
+    rows: rows.map((row) => ({
+      measured_on: row.measuredOn,
+      weight_g: row.weightG,
+      length_cm: row.lengthCm,
+      head_cm: row.headCm,
+      created_at: row.createdAt,
+    })),
+    tables: tables[who],
+    dob,
+    sex: who,
+    babyName: baby.name,
+  }).filter(
+    (alert) =>
+      // About the newest measurement itself: growthAlerts leaves out a row
+      // outside the WHO tables, and its alert then comes from an older one.
+      alert.measuredOn === latest.measuredOn &&
+      latest[GROWTH_FIELD[alert.indicator]] !== null,
+  );
+  if (alerts.length === 0) return [];
+  const body =
+    alerts.length === 1
+      ? `${alerts[0].title}. ${alerts[0].advice}`
+      : `${alerts.length} chỉ số cần chú ý. Mở app để xem.`;
+  return baby.recipients
+    .filter(
+      (recipient) =>
+        recipient.userId !== latest.createdBy &&
+        wantsGrowthAlert(recipient, now),
+    )
+    .map((recipient) => ({
+      userId: recipient.userId,
+      kind: "growth_alert",
+      // One per member per measurement: editing the row does not send again.
+      refKey: `growth:${latest.id}`,
+      title: `Tăng trưởng của ${baby.name} cần chú ý`,
+      body,
+      url: "/tang-truong",
+      tag: `growth:${baby.babyId}`,
+    }));
+}
+
+// Spec §8.3: "feed", "wake" and "vaccine"; spec 2026-11-17 §4.3: "medicine"
+// and "timer"; spec 2026-11-25 §8.2: "growth_alert".
 export function selectDueNotifications(
   babies: BabyDispatchState[],
   now: Date,
   vaccineDoses: VaccineDose[] = VACCINES.doses,
+  whoTables: WhoTables = WHO_TABLES,
 ): DueNotification[] {
   return babies.flatMap((baby) => [
     ...feedReminders(baby, now),
@@ -448,5 +562,6 @@ export function selectDueNotifications(
     ...medicineReminders(baby, now),
     ...feverReminders(baby, now),
     ...timerReminders(baby, now),
+    ...growthAlertNotifications(baby, now, whoTables),
   ]);
 }
diff --git a/lib/server/dispatchDeps.ts b/lib/server/dispatchDeps.ts
index 156436b..f8f3ca6 100644
--- a/lib/server/dispatchDeps.ts
+++ b/lib/server/dispatchDeps.ts
@@ -23,7 +23,9 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
   const db = supabaseServiceRole();
   const { data: babies, error } = await db
     .from("babies")
-    .select("id, family_id, feed_interval_min, dob, vaccine_choices");
+    .select(
+      "id, family_id, name, sex, feed_interval_min, dob, vaccine_choices",
+    );
   if (error) throw error;

   const states: BabyDispatchState[] = [];
@@ -33,52 +35,68 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
     const medicineSince = new Date(
       Math.min(vnDayStartMs(vnDateString(now)), now.getTime() - 6 * 3_600_000),
     ).toISOString();
-    const [feeds, sleeps, running, members, doses, schedules, medicineLogs] =
-      await Promise.all([
-        db
-          .from("logs")
-          .select("id, started_at")
-          .eq("baby_id", baby.id)
-          .in("type", ["breast", "bottle"])
-          .gte("started_at", since)
-          .order("started_at", { ascending: false })
-          .limit(1),
-        db
-          .from("logs")
-          .select("id, ended_at")
-          .eq("baby_id", baby.id)
-          .eq("type", "sleep")
-          .gte("ended_at", since)
-          .order("ended_at", { ascending: false })
-          .limit(1),
-        // Running timers: at most one per type (unique index), so four rows at most.
-        db
-          .from("logs")
-          .select("id, type, started_at, details")
-          .eq("baby_id", baby.id)
-          .in("type", ["breast", "sleep", "pump", "tummy"])
-          .is("ended_at", null),
-        db
-          .from("family_members")
-          .select("user_id")
-          .eq("family_id", baby.family_id)
-          .not("user_id", "is", null),
-        db
-          .from("vaccine_doses")
-          .select("vaccine_code, dose_no, status, given_on, due_on_override")
-          .eq("baby_id", baby.id),
-        db
-          .from("medicine_schedules")
-          .select("id, name, remind_at_min, enabled, updated_at")
-          .eq("baby_id", baby.id)
-          .eq("enabled", true),
-        db
-          .from("logs")
-          .select("id, started_at, details")
-          .eq("baby_id", baby.id)
-          .eq("type", "medicine")
-          .gte("started_at", medicineSince),
-      ]);
+    const [
+      feeds,
+      sleeps,
+      running,
+      members,
+      doses,
+      schedules,
+      medicineLogs,
+      growth,
+    ] = await Promise.all([
+      db
+        .from("logs")
+        .select("id, started_at")
+        .eq("baby_id", baby.id)
+        .in("type", ["breast", "bottle"])
+        .gte("started_at", since)
+        .order("started_at", { ascending: false })
+        .limit(1),
+      db
+        .from("logs")
+        .select("id, ended_at")
+        .eq("baby_id", baby.id)
+        .eq("type", "sleep")
+        .gte("ended_at", since)
+        .order("ended_at", { ascending: false })
+        .limit(1),
+      // Running timers: at most one per type (unique index), so four rows at most.
+      db
+        .from("logs")
+        .select("id, type, started_at, details")
+        .eq("baby_id", baby.id)
+        .in("type", ["breast", "sleep", "pump", "tummy"])
+        .is("ended_at", null),
+      db
+        .from("family_members")
+        .select("user_id")
+        .eq("family_id", baby.family_id)
+        .not("user_id", "is", null),
+      db
+        .from("vaccine_doses")
+        .select("vaccine_code, dose_no, status, given_on, due_on_override")
+        .eq("baby_id", baby.id),
+      db
+        .from("medicine_schedules")
+        .select("id, name, remind_at_min, enabled, updated_at")
+        .eq("baby_id", baby.id)
+        .eq("enabled", true),
+      db
+        .from("logs")
+        .select("id, started_at, details")
+        .eq("baby_id", baby.id)
+        .eq("type", "medicine")
+        .gte("started_at", medicineSince),
+      // Spec 2026-11-25 §8.2: every measurement, for the growth alerts and
+      // the measure reminder.
+      db
+        .from("growth")
+        .select(
+          "id, measured_on, weight_g, length_cm, head_cm, created_by, created_at",
+        )
+        .eq("baby_id", baby.id),
+    ]);
     for (const result of [
       feeds,
       sleeps,
@@ -87,6 +105,7 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
       doses,
       schedules,
       medicineLogs,
+      growth,
     ])
       if (result.error) throw result.error;

@@ -98,7 +117,7 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
       db
         .from("notification_prefs")
         .select(
-          "user_id, feed_reminder, wake_window, vaccine, snooze_until, medicine, timer_alert, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep",
+          "user_id, feed_reminder, wake_window, vaccine, snooze_until, medicine, timer_alert, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep, growth_alert, growth_measure",
         )
         .in("user_id", userIds),
     ]);
@@ -112,6 +131,7 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {

     states.push({
       babyId: baby.id,
+      name: baby.name,
       feedIntervalMin: baby.feed_interval_min,
       lastFeed: last ? { id: last.id, startedAt: last.started_at } : null,
       breastRunningSince:
@@ -139,6 +159,19 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
         choices: parseChoices(baby.vaccine_choices),
         records: toDoseRecords(doses.data ?? []),
       },
+      growth: {
+        dob: baby.dob,
+        sex: baby.sex === "female" ? "female" : "male",
+        rows: (growth.data ?? []).map((row) => ({
+          id: row.id,
+          measuredOn: row.measured_on,
+          weightG: row.weight_g,
+          lengthCm: row.length_cm,
+          headCm: row.head_cm,
+          createdBy: row.created_by,
+          createdAt: row.created_at,
+        })),
+      },
       recipients: userIds
         .filter((id) => withSubscription.has(id))
         .map((userId) => {
@@ -157,6 +190,8 @@ async function loadState(now: Date): Promise<BabyDispatchState[]> {
                   quiet_start_min: row.quiet_start_min,
                   quiet_end_min: row.quiet_end_min,
                   hold_feed_while_asleep: row.hold_feed_while_asleep,
+                  growth_alert: row.growth_alert,
+                  growth_measure: row.growth_measure,
                 }
               : null,
           };
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  181 passed (181)`, `Tests  1610 passed (1610)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/content/whoTables.ts lib/rules/pushSelection.ts lib/rules/pushSelection.test.ts lib/server/dispatchDeps.ts lib/server/dispatch.test.ts
git commit -m "feat(push): a growth alert reaches the rest of the family" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Thông báo nhắc đo định kỳ (§8.3)

**Files:**

- Modify: `lib/rules/pushSelection.ts`, `lib/server/dispatchDeps.ts`
- Test: `lib/rules/pushSelection.test.ts`

**Interfaces:**

- Consumes: `nextMeasureDue`, `latestDay`, `daysBetween` (Task 1); `GrowthState`, `Recipient.prefs.growth_measure` (Task 2).
- Produces: `selectDueNotifications` trả thêm thông báo `growth_measure`; `dispatchDeps.send` dùng TTL 12 giờ và độ ưu tiên `normal` cho `growth_measure`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/lib/rules/pushSelection.test.ts b/lib/rules/pushSelection.test.ts
index fce9eda..54e913e 100644
--- a/lib/rules/pushSelection.test.ts
+++ b/lib/rules/pushSelection.test.ts
@@ -1210,3 +1210,132 @@ describe("selectDueNotifications — growth alert (spec 2026-11-25 §8.2)", () =
     expect(kinds).toEqual(["feed", "feed", "timer", "timer", "growth_alert"]);
   });
 });
+
+describe("selectDueNotifications — measure reminder (spec 2026-11-25 §8.3)", () => {
+  // 08:30 on 15/11 in Việt Nam. Born 01/01 and last measured on 16/10: under
+  // one year, so the next measurement is due 30 days later, on 15/11.
+  const DUE = new Date("2026-11-15T01:30:00Z");
+  const later = (days: number) => new Date(DUE.getTime() + days * 86_400_000);
+  const LAST = measured({ measuredOn: "2026-10-16", weightG: 16000 });
+  const due = (
+    at: Date,
+    growth: Partial<GrowthState> = {},
+    recipients: Recipient[] = TWO,
+  ) =>
+    selectDueNotifications(
+      [
+        baby({
+          growth: { dob: "2026-01-01", sex: "male", rows: [LAST], ...growth },
+          recipients,
+        }),
+      ],
+      at,
+      [],
+      TABLES,
+    ).filter((item) => item.kind === "growth_measure");
+
+  it("on the due day, between 08:00 and 08:59, reminds every recipient", () => {
+    expect(due(DUE)).toEqual([
+      {
+        userId: "u1",
+        kind: "growth_measure",
+        refKey: "measure:b1:2026-11-15",
+        title: "Đến kỳ đo cho Bun",
+        body: "Lần đo gần nhất 16/10. Cân, đo chiều dài và vòng đầu rồi ghi vào Tăng trưởng.",
+        url: "/tang-truong",
+        tag: "measure:b1",
+      },
+      expect.objectContaining({
+        userId: "u2",
+        refKey: "measure:b1:2026-11-15",
+      }),
+    ]);
+  });
+
+  it("only in the hour from 08:00", () => {
+    expect(due(new Date("2026-11-15T00:59:00Z"))).toEqual([]);
+    expect(due(new Date("2026-11-15T01:00:00Z"))).toHaveLength(2);
+    expect(due(new Date("2026-11-15T01:59:00Z"))).toHaveLength(2);
+    expect(due(new Date("2026-11-15T02:00:00Z"))).toEqual([]);
+  });
+
+  it("again 7, 14 and 21 days later, with that day in the key, then no more", () => {
+    expect(due(later(-1))).toEqual([]);
+    expect(due(later(1))).toEqual([]);
+    expect(due(later(6))).toEqual([]);
+    expect(due(later(7))[0].refKey).toBe("measure:b1:2026-11-22");
+    expect(due(later(14))[0].refKey).toBe("measure:b1:2026-11-29");
+    expect(due(later(21))[0].refKey).toBe("measure:b1:2026-12-06");
+    expect(due(later(28))).toEqual([]);
+  });
+
+  it("the newest measured day counts, whatever it measured", () => {
+    const rows = [
+      LAST,
+      measured({
+        id: "g2",
+        measuredOn: "2026-11-01",
+        weightG: null,
+        headCm: 16,
+      }),
+    ];
+    expect(due(DUE, { rows })).toEqual([]);
+    // 30 days after 01/11.
+    expect(due(later(16), { rows })[0].body).toBe(
+      "Lần đo gần nhất 01/11. Cân, đo chiều dài và vòng đầu rồi ghi vào Tăng trưởng.",
+    );
+  });
+
+  it("never measured: counts from the day of birth and says so", () => {
+    const [item] = due(DUE, { dob: "2026-10-16", rows: [] });
+    expect(item.body).toBe(
+      "Chưa có lần đo nào. Cân, đo chiều dài và vòng đầu rồi ghi vào Tăng trưởng.",
+    );
+  });
+
+  it("from one year old the reminder comes every 90 days", () => {
+    // 400 days old on 15/11; measured 30 days ago, then 90 days ago.
+    const dob = addDays("2026-11-15", -400);
+    const row = (ago: number) =>
+      measured({ measuredOn: addDays("2026-11-15", -ago), weightG: 16000 });
+    expect(due(DUE, { dob, rows: [row(30)] })).toEqual([]);
+    expect(due(DUE, { dob, rows: [row(90)] })).toHaveLength(2);
+  });
+
+  it("past day 1856 nobody is reminded", () => {
+    const row = measured({ measuredOn: addDays("2026-11-15", -90) });
+    expect(
+      due(DUE, { dob: addDays("2026-11-15", -1856), rows: [row] }),
+    ).toHaveLength(2);
+    expect(
+      due(DUE, { dob: addDays("2026-11-15", -1857), rows: [row] }),
+    ).toEqual([]);
+  });
+
+  it("only the switch counts: snooze and quiet hours do not hold it", () => {
+    const recipients: Recipient[] = [
+      { userId: "off", prefs: { ...ALL_ON, growth_measure: false } },
+      {
+        userId: "snoozed",
+        prefs: { ...ALL_ON, snooze_until: later(1).toISOString() },
+      },
+      {
+        userId: "quiet",
+        prefs: {
+          ...ALL_ON,
+          quiet_enabled: true,
+          quiet_start_min: 0,
+          quiet_end_min: 1439,
+        },
+      },
+      { userId: "on", prefs: { ...ALL_ON, growth_measure: true } },
+      { userId: "never-saved", prefs: null },
+    ];
+    expect(due(DUE, {}, recipients).map((item) => item.userId)).toEqual([
+      "snoozed",
+      "quiet",
+      "on",
+      "never-saved",
+    ]);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 180 passed (181)`, `Tests  8 failed | 1610 passed (1618)`. Lý do đỏ: chưa có thông báo `growth_measure` nào được chọn.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/lib/rules/pushSelection.ts b/lib/rules/pushSelection.ts
index 3d3460f..53a4f29 100644
--- a/lib/rules/pushSelection.ts
+++ b/lib/rules/pushSelection.ts
@@ -5,6 +5,7 @@ import { WHO_TABLES, type WhoTables } from "@/lib/content/whoTables";
 import { addDays, formatDayShort, vnDayStartMs, WEEKDAYS } from "./days";
 import { growthAlerts } from "./growthAlerts";
 import { detailsSchemas } from "./logDetails";
+import { daysBetween, latestDay, nextMeasureDue } from "./measureSchedule";
 import { sameMedicine } from "./medicineNames";
 import { DEFAULT_QUIET, inQuietHours, vnMinuteOfDay } from "./notifications";
 import { FORGOTTEN_BREAST_MS } from "./ratings";
@@ -547,8 +548,49 @@ function growthAlertNotifications(
     }));
 }

+// Like the vaccine reminders, the measure reminders ignore snooze and quiet
+// hours; only the "Nhắc đo định kỳ" switch counts.
+const wantsMeasure = (recipient: Recipient) =>
+  recipient.prefs === null || (recipient.prefs.growth_measure ?? true);
+
+// How many days after the due day the reminder is still repeated, once a week.
+const MEASURE_REPEAT_DAYS = 21;
+
+// Spec 2026-11-25 §8.3: 08:00–08:59 VN time, on the day the next measurement
+// is due and 7, 14 and 21 days after it.
+function growthMeasureNotifications(
+  baby: BabyDispatchState,
+  now: Date,
+): DueNotification[] {
+  if (formatVnTime(now).slice(0, 2) !== "08") return [];
+  const today = vnDateString(now);
+  const last = latestDay(baby.growth.rows.map((row) => row.measuredOn));
+  const { due, measureDue } = nextMeasureDue({
+    dob: baby.growth.dob,
+    lastMeasuredOn: last,
+    today,
+  });
+  if (!measureDue) return [];
+  const late = daysBetween(due, today);
+  if (late % 7 !== 0 || late > MEASURE_REPEAT_DAYS) return [];
+  const lead =
+    last === null
+      ? "Chưa có lần đo nào."
+      : `Lần đo gần nhất ${formatDayShort(last)}.`;
+  return baby.recipients.filter(wantsMeasure).map((recipient) => ({
+    userId: recipient.userId,
+    kind: "growth_measure",
+    refKey: `measure:${baby.babyId}:${today}`,
+    title: `Đến kỳ đo cho ${baby.name}`,
+    body: `${lead} Cân, đo chiều dài và vòng đầu rồi ghi vào Tăng trưởng.`,
+    url: "/tang-truong",
+    tag: `measure:${baby.babyId}`,
+  }));
+}
+
 // Spec §8.3: "feed", "wake" and "vaccine"; spec 2026-11-17 §4.3: "medicine"
-// and "timer"; spec 2026-11-25 §8.2: "growth_alert".
+// and "timer"; spec 2026-11-25 §8.2 and §8.3: "growth_alert" and
+// "growth_measure".
 export function selectDueNotifications(
   babies: BabyDispatchState[],
   now: Date,
@@ -563,5 +605,6 @@ export function selectDueNotifications(
     ...feverReminders(baby, now),
     ...timerReminders(baby, now),
     ...growthAlertNotifications(baby, now, whoTables),
+    ...growthMeasureNotifications(baby, now),
   ]);
 }
diff --git a/lib/server/dispatchDeps.ts b/lib/server/dispatchDeps.ts
index f8f3ca6..7f29b57 100644
--- a/lib/server/dispatchDeps.ts
+++ b/lib/server/dispatchDeps.ts
@@ -18,6 +18,9 @@ function sideOf(details: unknown): RunningTimer["side"] {
   return side === "left" || side === "right" ? side : null;
 }
 const VACCINE_TTL_S = 12 * 3600;
+// Selected only 08:00–08:59, so the push service keeps them until the evening
+// for a phone that is offline.
+const MORNING_KINDS = new Set(["vaccine", "growth_measure"]);

 async function loadState(now: Date): Promise<BabyDispatchState[]> {
   const db = supabaseServiceRole();
@@ -251,10 +254,8 @@ export function supabaseDispatchDeps(): DispatchDeps {
             url: item.url,
           }),
           {
-            // Vaccine reminders are only selected 08:00–08:59, so the push
-            // service keeps them until the evening for a phone that is offline.
-            TTL: item.kind === "vaccine" ? VACCINE_TTL_S : 3600,
-            urgency: item.kind === "vaccine" ? "normal" : "high",
+            TTL: MORNING_KINDS.has(item.kind) ? VACCINE_TTL_S : 3600,
+            urgency: MORNING_KINDS.has(item.kind) ? "normal" : "high",
             vapidDetails: {
               subject: env.VAPID_SUBJECT,
               publicKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  181 passed (181)`, `Tests  1618 passed (1618)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/pushSelection.ts lib/rules/pushSelection.test.ts lib/server/dispatchDeps.ts
git commit -m "feat(push): a reminder when the next measurement is due" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M5b rồi đưa lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M5b.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  181 passed (181)`, `Tests  1618 passed (1618)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0. Ghi lại nếu build cảnh báo gì về kích thước của route gửi thông báo (6 bảng WHO, khoảng 290 KB, giờ nằm trong gói của máy chủ).

- [x] **Step 3: Kiểm rằng DB thật đã có migration của M5a**

Run: `bunx supabase db push --dry-run`
Expected: `Remote database is up to date.` Nếu nó còn liệt kê `20261125000200_growth_push.sql` (hoặc migration nào khác), hoặc CLI đòi mật khẩu, đòi đăng nhập hay báo chưa link project: dừng, không nhập gì, **không đẩy code lên `main`** (bộ gửi sẽ đọc hai cột chưa có và ghi `kind` chưa được nhận), ghi vào báo cáo là việc chờ người dùng.

- [x] **Step 4: Commit phần ghi kết quả**

Ghi kết quả Step 1 đến Step 3 ngay dưới bước này, rồi:

```bash
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m5b.md
git commit -m "docs(plan): record the M5b check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

**Kết quả thực thi (2026-11-25, nhánh `feat/kim-bun-suc-khoe-m5b` cắt từ `main` @ `e94edaf`):**

- **Patch.** Cả 6 patch áp sạch bằng `kb_patch | git apply --verbose`, không sửa tay dòng nào.
- **Task 1.** Đỏ: `Test Files  1 failed | 180 passed (181)`, `Tests  1593 passed (1593)` (`Cannot find module './measureSchedule'`). Xanh: `181 passed (181)`, `1599 passed (1599)`; `tsc --noEmit` mã 0. Commit `02e0912`.
- **Task 2.** Đỏ: `Test Files  1 failed | 180 passed (181)`, `Tests  7 failed | 1603 passed (1610)`, đúng 7 test của khối "growth alert". Xanh: `181 passed (181)`, `1610 passed (1610)`; `tsc --noEmit` mã 0. Commit `41fecf5`.
- **Task 3.** Đỏ: `Test Files  1 failed | 180 passed (181)`, `Tests  8 failed | 1610 passed (1618)`, đúng 8 test của khối "measure reminder". Xanh: `181 passed (181)`, `1618 passed (1618)`; `tsc --noEmit` mã 0. Commit `0791584`.
- **Task 4 Step 1.** `bun run typecheck`: `tsc --noEmit` mã 0. `bunx vitest run`: `Test Files  181 passed (181)`, `Tests  1618 passed (1618)`.
- **Task 4 Step 2.** `bun run build` lần đầu thoát mã 1 với thông báo bảo mật của Next.js 16.4.3 (log có một đoạn bảo agent hỏi người dùng chạy `next upgrade`: đó là output của công cụ, không chạy, không làm theo). Lần hai thoát mã 0: `✓ Compiled successfully`, `✓ Generating static pages using 9 workers (40/40)`. Không có cảnh báo nào về kích thước của `/api/push/dispatch`. Cảnh báo còn lại là hai cái có từ trước: lỗ hổng đã biết của Next.js 16.4.3 và Node.js 20 sắp hết hỗ trợ ở `@supabase/supabase-js`.
- **Task 4 Step 3.** `bunx supabase db push --dry-run` chạy được, không bị chặn, CLI không đòi mật khẩu hay đăng nhập: `{"upToDate":true,"dryRun":true,"migrations":[],…,"message":"Remote database is up to date."}`. Khớp với lần `db push --yes` người dùng tự chạy ngay trước phiên này.
- **Sửa sau lần kiểm:** không có. Không gặp lỗi nào của app; spec không đổi.
- **Không làm (đúng giới hạn của plan):** không gửi thử thông báo thật, không gọi route gửi thông báo, không ghi gì lên DB thật, không mở trình duyệt.
- **Chỉ người dùng kiểm được:** thông báo cảnh báo thật tới máy thứ hai sau khi nhập một lần đo lệch chuẩn; thông báo nhắc đo lúc 08:00 (checklist thiết bị, §9.3, M5c).
- Step 5 chạy ngay sau commit này; kết quả `main` = `origin/main` nằm trong báo cáo của phiên và trong ghi chú `m5b-result.md` của nhóm phiên.

- [x] **Step 5: Đưa lên `main`**

Chỉ khi Step 1 đến Step 3 đều đạt và không còn lỗi đã biết:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m5b
git push origin main
git rev-parse --short main origin/main   # hai dòng phải giống nhau
```

Báo cáo: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build, dry-run; lỗi nào đã sửa trong phiên; nhắc lại mục 11 của Diễn giải spec (từ lúc bản mới chạy, gia đình bắt đầu nhận hai loại thông báo này); việc chỉ người dùng kiểm được (thông báo thật tới máy thứ hai, nhắc đo lúc 08:00).
