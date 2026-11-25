# Kim Bun — Sức khỏe M4a: thói quen 7 ngày qua Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-25-kim-bun-chieu-cao-tang-truong-suc-khoe-design.md` (§7.1 thói quen 7 ngày qua, §7.2 dữ liệu; mục 6 của §6.3; phần tương ứng của §9.1 và §9.2)

**Status:** approved 2026-11-25 (người dùng duyệt cả hai chỗ thêm vào spec nêu ở Diễn giải spec, mục 4, và cho phép chạy, sửa lỗi gặp giữa chừng, rồi đẩy lên `main` mà không hỏi lại)

**Goal:** Trang Chiều cao có khối "Thói quen 7 ngày qua": giấc ngủ, nằm sấp và vitamin D của bảy ngày trước hôm nay, mỗi thứ so với chuẩn của nó.

**Architecture:**

- **Luật thuần:** `lib/rules/habits.ts`, hàm `habitStats(logs, dob, now)`. Nó dùng lại `dailyStats` (cắt phút ngủ và phút nằm sấp theo nửa đêm), `dailyNorm("sleep", …)` (chuẩn giấc ngủ của trang Thống kê) và `VITAMIN_D` (tên thuốc). Nó trả các hàng để vẽ và, cho §4, câu của hai dòng "Cần chú ý" (M4c mới dùng).
- **Khối giao diện:** `components/height/HabitsCard.tsx` chỉ vẽ. `HeightScreen` tải bản ghi bằng `useStatsLogs` với đúng khoảng 14 ngày của trang Thống kê, nên hai trang dùng chung một lần tải.
- Không có migration, không thêm gói, không thêm token màu.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-suc-khoe-m4a`, cắt từ `main` @ `95df7bb` (đã có trọn mốc M3). Baseline: 1540 test vitest xanh (178 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc                | Nội dung                                                                                    | Plan                          |
| ------------------ | ------------------------------------------------------------------------------------------- | ----------------------------- |
| M1, M2, M3         | §3, §4 dòng 1 đến 3, §5, §6                                                                 | đã xong, ở `main` @ `95df7bb` |
| **M4a (plan này)** | §7.1, §7.2: thói quen 7 ngày qua trên trang Chiều cao                                       | file này                      |
| M4b                | §7.3: dinh dưỡng theo giai đoạn (file nội dung, đối chiếu nguồn, khối trên trang Chiều cao) | chưa viết                     |
| M4c                | dòng 5 và 6 của §4: "Ngủ ít hơn chuẩn", "Nằm sấp còn ít" trên trang Sức khỏe                | chưa viết                     |
| M5                 | §8 Push, dòng 4 của §4, §9.3                                                                | chưa viết                     |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **M4 chia ba plan.** Spec §10 ghi M4 là một mốc. Thói quen (plan này), dinh dưỡng (M4b, cần mở từng nguồn để đối chiếu từng dòng) và hai dòng "Cần chú ý" (M4c) tách được và mỗi phần tự chạy được.
2. **"Ngày có dữ liệu"** là ngày có số phút lớn hơn 0 sau khi cắt theo nửa đêm: một giấc ngủ kéo qua nửa đêm tính cho cả hai ngày, mỗi ngày phần của nó. Với nằm sấp, "ngày có bản ghi nằm sấp" cũng được đọc là ngày có phút nằm sấp lớn hơn 0.
3. **Giá trị giấc ngủ** viết bằng `formatDuration` có sẵn: "13 giờ 05 phút mỗi ngày". Trong dòng "Cần chú ý" (§4) số giờ viết tối đa 1 chữ số thập phân và **làm tròn xuống**: "13,5 giờ mỗi ngày", "13 giờ mỗi ngày". Làm tròn xuống vì 13 giờ 59 phút mà làm tròn lên sẽ in ra "14 giờ mỗi ngày · nên 14–17 giờ" dưới tiêu đề "Ngủ ít hơn chuẩn". Một đồng hồ ngủ hay nằm sấp quên dừng thì vẫn được đếm tới lúc này, như trang Thống kê đang làm.
4. **Hai chỗ bố cục và chữ thêm vào spec; người dùng đã duyệt cùng plan này ngày 2026-11-25** (§7.1 đã ghi, có đánh dấu):
   - **Chip đứng cùng dòng với tên hàng; dòng giá trị nằm dưới, dùng hết bề ngang.** Ở 375 px, chip "Nhiều hơn chuẩn" (khoảng 135 px) mà đứng cạnh dòng "17 giờ 45 phút mỗi ngày · nên 14–17 giờ" thì dòng đó chỉ còn khoảng 116 px và xuống ba dòng. Con số là ước lượng từ số đo chữ của font; Task 4 đo lại.
   - **Câu "Nằm sấp: WHO 2019." chỉ hiện khi hàng Nằm sấp đang hiện** (bé dưới 1 tuổi). Bé lớn hơn chỉ còn "Chuẩn giấc ngủ như trang Thống kê."
5. **Khối thói quen chờ bản ghi tải xong.** Đang tải hoặc lỗi thì không vẽ khối, không vẽ khung chờ; các thẻ khác của trang không bị ảnh hưởng.
6. **Khối thói quen có cả khi bé quá 1856 ngày tuổi** (chỉ còn hàng Giấc ngủ, vẫn có chip): §7.1 ghi hàng này "luôn" hiện, và chuẩn giấc ngủ không lấy từ bảng WHO 0–1856 ngày nên câu "ngoài khoảng đó không đánh giá" của §2 không áp vào nó. Người dùng cần biết khi duyệt.
7. **`habitStats` trả thêm `attention`** (câu của dòng 5 và 6 ở §4) để M4c không tính lại; plan này chưa hiện nó ở đâu.
8. **Dùng chung truy vấn 14 ngày:** `useStatsLogs(baby.id, statsFetchSince(vnDayRange(now, 14)))`, đúng khóa của trang Thống kê khi chọn "14 ngày". Trang Chiều cao không nghe realtime; bản ghi mới hiện sau lần tải lại kế tiếp.
9. **Kiểm trình duyệt** chỉ xem, không bấm Lưu. Theo quy ước của người dùng, mặc định dùng Claude in Chrome; cỡ 375 px cần khung Browser trong app và phải hỏi người dùng trước khi dùng.

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
    on' docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m4a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `95df7bb`. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang tạm của Task 4 đã qua `tsc --noEmit`. Chưa chạy trong lúc viết plan: `bun run build` và bước kiểm trình duyệt.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Không chạy lệnh `next upgrade` mà nó gợi ý.
- **Màu.** Không patch nào thêm màu hay token; màu chỉ đi qua lớp Tailwind của token có sẵn. `lib/themeGuard.test.ts` phải xanh.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bắt đầu hay dừng đồng hồ, không thêm bản ghi.
- **Lên `main`.** Spec yêu cầu người dùng đồng ý từng lần. Task 4 dừng lại hỏi, không tự push. Người dùng không muốn đẩy một thay đổi còn lỗi đã biết: nếu bước trình duyệt lộ ra lỗi thì nêu lỗi và cách sửa trước, rồi mới hỏi.
- **Người dùng muốn màn hình gọn.** Không thêm chữ nào ngoài plan; nếu người dùng muốn bỏ bớt chữ thì ghi lại yêu cầu và sửa theo, kèm test và sửa spec.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).

## Contracts with Other Plans

Plan này đứng sau M3d (đã ở `main` @ `95df7bb`). M4b thêm khối dinh dưỡng ngay dưới khối này; M4c đưa `attention` lên trang Sức khỏe.

**Consumes (đã ở `main`):** `dailyStats`, `statsFetchSince` (`lib/rules/dailyStats.ts`); `dailyNorm` (`lib/rules/ratings.ts`); `VITAMIN_D` (`lib/rules/medicineNames.ts`); `detailsSchemas` (`lib/rules/logDetails.ts`); `LogLike` (`lib/rules/describeLog.ts`); `vnDayRange` (`lib/rules/days.ts`); `ageDays`, `formatDuration`, `vnDateString` (`lib/rules/time.ts`); `useStatsLogs` (`lib/data/logs.ts`); `StatusChip`, `Icon`, `CATEGORY_CHIP`, `CategoryToken`, `IconName`, `cx`; `HeightScreen` (M3c).

**Produces:**

- `lib/rules/habits.ts`:
  - `HabitKey = "sleep" | "tummy" | "vitaminD"`;
  - `HabitRow = { key: HabitKey; title: string; line: string; chip: { text: string; tone: "good" | "warn" | "neutral" } | null; progress: number | null }`;
  - `HabitStats = { rows: HabitRow[]; attention: { sleep: string | null; tummy: string | null } }`;
  - `habitStats(logs: LogLike[], dob: string, now: Date): HabitStats`.
- `components/height/HabitsCard.tsx`: `HabitsCard({ rows: HabitRow[] })`.
- `HeightScreen` gọi `useStatsLogs` và vẽ `HabitsCard` sau thẻ tốc độ tăng, trước đoạn cuối trang.
- **Vitest sau M4a:** 1576 test, 180 file.

---

### Task 1: Luật thói quen 7 ngày qua (§7.1)

**Files:**

- Create: `lib/rules/habits.ts`
- Test: `lib/rules/habits.test.ts` (mới)

**Interfaces:**

- Consumes: `dailyStats`, `dailyNorm`, `VITAMIN_D`, `detailsSchemas`, `LogLike`, `vnDayRange`, `ageDays`, `formatDuration`, `vnDateString`.
- Produces: `HabitKey`, `HabitRow`, `HabitStats`, `habitStats(logs, dob, now)`.

- [x] **Step 0: Tạo nhánh**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/kim-bun-suc-khoe-m4a
```

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/habits.test.ts b/lib/rules/habits.test.ts
new file mode 100644
index 0000000..7c286e7
--- /dev/null
+++ b/lib/rules/habits.test.ts
@@ -0,0 +1,324 @@
+import { describe, expect, it } from "vitest";
+import { addDays } from "./days";
+import type { LogLike } from "./describeLog";
+import { habitStats } from "./habits";
+
+// "Now" is noon on 25/11 in Việt Nam: the window is 18/11 to 24/11.
+const NOW = new Date("2026-11-25T05:00:00Z");
+const TODAY = "2026-11-25";
+const WINDOW = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 7));
+// 76 days old: sleep should be 14–17 hours.
+const DOB = "2026-09-10";
+
+// A timed log that starts at 02:00 Việt Nam time on that day.
+const timed = (
+  type: "sleep" | "tummy",
+  day: string,
+  minutes: number,
+): LogLike => {
+  const start = Date.parse(`${day}T02:00:00+07:00`);
+  return {
+    type,
+    started_at: new Date(start).toISOString(),
+    ended_at: new Date(start + minutes * 60_000).toISOString(),
+    details: {},
+  };
+};
+const medicine = (day: string, name: string, hour = 8): LogLike => ({
+  type: "medicine",
+  started_at: new Date(
+    Date.parse(`${day}T${String(hour).padStart(2, "0")}:00:00+07:00`),
+  ).toISOString(),
+  ended_at: null,
+  details: { name, amount: 1, unit: "giọt", antipyretic: false },
+});
+const everyDay = (type: "sleep" | "tummy", minutes: number, days = WINDOW) =>
+  days.map((day) => timed(type, day, minutes));
+const row = (logs: LogLike[], key: "sleep" | "tummy" | "vitaminD", dob = DOB) =>
+  habitStats(logs, dob, NOW).rows.find((item) => item.key === key);
+
+// Spec 2026-11-25 §7.1.
+describe("habitStats: the window", () => {
+  it("is the seven full days before today: today and the day before the window do not count", () => {
+    const logs = [
+      ...everyDay("sleep", 15 * 60),
+      timed("sleep", TODAY, 60),
+      // 02:00 to 12:00 on 17/11: wholly before the window.
+      timed("sleep", addDays(TODAY, -8), 10 * 60),
+    ];
+    expect(row(logs, "sleep")?.line).toBe(
+      "15 giờ 00 phút mỗi ngày · nên 14–17 giờ",
+    );
+  });
+
+  it("a sleep that runs past midnight is split between the two days", () => {
+    // 22:00 on 17/11 to 12:00 on 18/11: only the 12 hours of 18/11 count.
+    const start = Date.parse("2026-11-17T22:00:00+07:00");
+    const across: LogLike = {
+      type: "sleep",
+      started_at: new Date(start).toISOString(),
+      ended_at: new Date(start + 14 * 3_600_000).toISOString(),
+      details: {},
+    };
+    const logs = [across, ...everyDay("sleep", 12 * 60, WINDOW.slice(1))];
+    expect(row(logs, "sleep")?.line).toBe(
+      "12 giờ 00 phút mỗi ngày · nên 14–17 giờ",
+    );
+  });
+
+  it("a sleep that starts last night and runs into today counts up to midnight only", () => {
+    // 22:00 on 24/11 to 06:00 on 25/11: two hours belong to the window.
+    const start = Date.parse("2026-11-24T22:00:00+07:00");
+    const intoToday: LogLike = {
+      type: "sleep",
+      started_at: new Date(start).toISOString(),
+      ended_at: new Date(start + 8 * 3_600_000).toISOString(),
+      details: {},
+    };
+    // Six days of 14 hours, and 12 + 2 hours on the last day.
+    const logs = [
+      ...everyDay("sleep", 14 * 60, WINDOW.slice(0, 6)),
+      timed("sleep", WINDOW[6], 12 * 60),
+      intoToday,
+    ];
+    expect(row(logs, "sleep")?.line).toBe(
+      "14 giờ 00 phút mỗi ngày · nên 14–17 giờ",
+    );
+  });
+
+  // The same as on the Thống kê page: a timer nobody stopped keeps counting.
+  it("a timer still running counts up to now, cut at each midnight", () => {
+    const running: LogLike = {
+      type: "sleep",
+      started_at: new Date(
+        Date.parse("2026-11-24T20:00:00+07:00"),
+      ).toISOString(),
+      ended_at: null,
+      details: {},
+    };
+    // Six days of 15 hours; the last day has the 4 hours before midnight.
+    const logs = [...everyDay("sleep", 15 * 60, WINDOW.slice(0, 6)), running];
+    // (6 × 900 + 240) / 7 = 805,7 → 806 minutes.
+    expect(row(logs, "sleep")?.line).toBe(
+      "13 giờ 26 phút mỗi ngày · nên 14–17 giờ",
+    );
+  });
+
+  it("lists sleep, tummy time and vitamin D, in that order, for a young baby", () => {
+    expect(
+      habitStats([], DOB, NOW).rows.map((item) => [item.key, item.title]),
+    ).toEqual([
+      ["sleep", "Giấc ngủ"],
+      ["tummy", "Nằm sấp"],
+      ["vitaminD", "Vitamin D"],
+    ]);
+  });
+});
+
+describe("habitStats: sleep", () => {
+  it("inside the norm: Đủ, and the bar is the mean over the top of the norm", () => {
+    expect(row(everyDay("sleep", 15 * 60), "sleep")).toEqual({
+      key: "sleep",
+      title: "Giấc ngủ",
+      line: "15 giờ 00 phút mỗi ngày · nên 14–17 giờ",
+      chip: { text: "Đủ", tone: "good" },
+      progress: 15 / 17,
+    });
+  });
+
+  it("the two ends of the norm are inside it", () => {
+    expect(row(everyDay("sleep", 14 * 60), "sleep")?.chip?.text).toBe("Đủ");
+    expect(row(everyDay("sleep", 17 * 60), "sleep")?.chip?.text).toBe("Đủ");
+  });
+
+  it("under the norm: Ít hơn chuẩn in warn", () => {
+    expect(row(everyDay("sleep", 14 * 60 - 1), "sleep")).toMatchObject({
+      line: "13 giờ 59 phút mỗi ngày · nên 14–17 giờ",
+      chip: { text: "Ít hơn chuẩn", tone: "warn" },
+    });
+  });
+
+  it("over the norm: Nhiều hơn chuẩn, neutral, and the bar is full", () => {
+    expect(row(everyDay("sleep", 17 * 60 + 1), "sleep")).toMatchObject({
+      chip: { text: "Nhiều hơn chuẩn", tone: "neutral" },
+      progress: 1,
+    });
+  });
+
+  it("the mean divides by the days that have sleep, not by seven", () => {
+    // Five days of 15 hours and two days nobody logged.
+    expect(
+      row(everyDay("sleep", 15 * 60, WINDOW.slice(0, 5)), "sleep")?.line,
+    ).toBe("15 giờ 00 phút mỗi ngày · nên 14–17 giờ");
+  });
+
+  it("fewer than five days with sleep: says so, no chip, no bar", () => {
+    expect(
+      row(everyDay("sleep", 15 * 60, WINDOW.slice(0, 4)), "sleep"),
+    ).toEqual({
+      key: "sleep",
+      title: "Giấc ngủ",
+      line: "Chưa đủ dữ liệu ngủ 7 ngày",
+      chip: null,
+      progress: null,
+    });
+  });
+
+  it("the norm follows the baby's age", () => {
+    // 200 days old: 12–15 hours.
+    expect(
+      row(everyDay("sleep", 13 * 60), "sleep", addDays(TODAY, -200))?.line,
+    ).toBe("13 giờ 00 phút mỗi ngày · nên 12–15 giờ");
+  });
+});
+
+describe("habitStats: tummy time", () => {
+  it("30 minutes a day or more: Đủ, the bar full", () => {
+    const logs = [
+      timed("tummy", WINDOW[0], 20),
+      timed("tummy", WINDOW[2], 40),
+      timed("tummy", WINDOW[5], 30),
+    ];
+    expect(row(logs, "tummy")).toEqual({
+      key: "tummy",
+      title: "Nằm sấp",
+      line: "30 phút mỗi ngày · nên từ 30 phút",
+      chip: { text: "Đủ", tone: "good" },
+      progress: 1,
+    });
+  });
+
+  it("under 30 minutes: Còn thiếu in warn, the bar in proportion", () => {
+    expect(
+      row(everyDay("tummy", 15, WINDOW.slice(0, 3)), "tummy"),
+    ).toMatchObject({
+      line: "15 phút mỗi ngày · nên từ 30 phút",
+      chip: { text: "Còn thiếu", tone: "warn" },
+      progress: 0.5,
+    });
+  });
+
+  it("two logs on one day add up for that day", () => {
+    const logs = [
+      timed("tummy", WINDOW[0], 20),
+      {
+        ...timed("tummy", WINDOW[0], 10),
+        started_at: new Date(
+          Date.parse(`${WINDOW[0]}T15:00:00+07:00`),
+        ).toISOString(),
+        ended_at: new Date(
+          Date.parse(`${WINDOW[0]}T15:10:00+07:00`),
+        ).toISOString(),
+      },
+      timed("tummy", WINDOW[1], 30),
+      timed("tummy", WINDOW[2], 30),
+    ];
+    expect(row(logs, "tummy")?.line).toBe("30 phút mỗi ngày · nên từ 30 phút");
+  });
+
+  it("fewer than three days with tummy time: says so, no chip, no bar", () => {
+    expect(row(everyDay("tummy", 40, WINDOW.slice(0, 2)), "tummy")).toEqual({
+      key: "tummy",
+      title: "Nằm sấp",
+      line: "Tuần này chưa ghi nằm sấp",
+      chip: null,
+      progress: null,
+    });
+  });
+
+  it("is shown until the first birthday", () => {
+    expect(row([], "tummy", addDays(TODAY, -364))).toBeDefined();
+    expect(row([], "tummy", addDays(TODAY, -365))).toBeUndefined();
+  });
+});
+
+describe("habitStats: vitamin D", () => {
+  it("six days or more: Đều, the bar in sevenths", () => {
+    const logs = WINDOW.slice(0, 6).map((day) => medicine(day, "Vitamin D3"));
+    expect(row(logs, "vitaminD")).toEqual({
+      key: "vitaminD",
+      title: "Vitamin D",
+      line: "Đã uống 6 trên 7 ngày",
+      chip: { text: "Đều", tone: "good" },
+      progress: 6 / 7,
+    });
+  });
+
+  it("five days or fewer: how many days were missed, neutral", () => {
+    const logs = WINDOW.slice(0, 5).map((day) => medicine(day, "vitamin d"));
+    expect(row(logs, "vitaminD")).toMatchObject({
+      line: "Đã uống 5 trên 7 ngày",
+      chip: { text: "Sót 2 ngày", tone: "neutral" },
+    });
+    expect(row([], "vitaminD")).toMatchObject({
+      line: "Đã uống 0 trên 7 ngày",
+      chip: { text: "Sót 7 ngày", tone: "neutral" },
+      progress: 0,
+    });
+  });
+
+  it("two doses on one day are one day; other medicines and today do not count", () => {
+    const logs = [
+      medicine(WINDOW[0], "Vitamin D3"),
+      medicine(WINDOW[0], "Vitamin D3", 20),
+      medicine(WINDOW[1], "Vitamin DHA"),
+      medicine(WINDOW[2], "Paracetamol"),
+      medicine(TODAY, "Vitamin D3"),
+    ];
+    expect(row(logs, "vitaminD")?.line).toBe("Đã uống 1 trên 7 ngày");
+  });
+
+  it("is shown until the second birthday", () => {
+    expect(row([], "vitaminD", addDays(TODAY, -729))).toBeDefined();
+    expect(row([], "vitaminD", addDays(TODAY, -730))).toBeUndefined();
+  });
+});
+
+// Spec §4, rows 5 and 6: what the Sức khỏe page says when a habit is short.
+describe("habitStats: what needs attention", () => {
+  it("sleep under the norm: the hours a day against the norm", () => {
+    expect(
+      habitStats(everyDay("sleep", 13 * 60 + 30), DOB, NOW).attention,
+    ).toEqual({
+      sleep: "13,5 giờ mỗi ngày · nên 14–17 giờ",
+      tummy: null,
+    });
+  });
+
+  // Rounded to the nearest tenth, 13 giờ 59 phút would read "14 giờ" under a
+  // title that says the baby sleeps less than 14.
+  it("the hours are rounded down, so they never read as the norm they are under", () => {
+    expect(
+      habitStats(everyDay("sleep", 14 * 60 - 1), DOB, NOW).attention.sleep,
+    ).toBe("13,9 giờ mỗi ngày · nên 14–17 giờ");
+    expect(
+      habitStats(everyDay("sleep", 13 * 60), DOB, NOW).attention.sleep,
+    ).toBe("13 giờ mỗi ngày · nên 14–17 giờ");
+  });
+
+  it("tummy time under 30 minutes: the minutes a day against the norm", () => {
+    expect(
+      habitStats(everyDay("tummy", 15, WINDOW.slice(0, 3)), DOB, NOW).attention,
+    ).toEqual({ sleep: null, tummy: "15 phút mỗi ngày · nên từ 30 phút" });
+  });
+
+  it("nothing when the habit is fine, over the norm, or not judged for lack of data", () => {
+    for (const logs of [
+      [...everyDay("sleep", 15 * 60), ...everyDay("tummy", 40)],
+      everyDay("sleep", 18 * 60),
+      everyDay("sleep", 10 * 60, WINDOW.slice(0, 4)),
+      [],
+    ])
+      expect(habitStats(logs, DOB, NOW).attention).toEqual({
+        sleep: null,
+        tummy: null,
+      });
+  });
+
+  it("a baby past the first birthday has no tummy-time line", () => {
+    expect(
+      habitStats(everyDay("tummy", 15), addDays(TODAY, -400), NOW).attention
+        .tummy,
+    ).toBeNull();
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 178 passed (179)`, `Tests  1540 passed (1540)`. File test mới không chạy được test nào vì chưa có `./habits`.

- [x] **Step 3: Viết code (Patch 2)**

```diff
diff --git a/lib/rules/habits.ts b/lib/rules/habits.ts
new file mode 100644
index 0000000..f2d2943
--- /dev/null
+++ b/lib/rules/habits.ts
@@ -0,0 +1,147 @@
+import { dailyStats } from "./dailyStats";
+import { vnDayRange } from "./days";
+import type { LogLike } from "./describeLog";
+import { detailsSchemas } from "./logDetails";
+import { VITAMIN_D } from "./medicineNames";
+import { dailyNorm } from "./ratings";
+import { ageDays, formatDuration, vnDateString } from "./time";
+
+// Spec 2026-11-25 §7.1: three habits that help a child grow, over the seven
+// full days before today.
+export type HabitKey = "sleep" | "tummy" | "vitaminD";
+
+export type HabitRow = {
+  key: HabitKey;
+  title: string;
+  // "{giá trị} · {chuẩn}", or the line that says there is not enough data.
+  line: string;
+  // Null when the habit is not judged for lack of data.
+  chip: { text: string; tone: "good" | "warn" | "neutral" } | null;
+  // 0–1 along the bar; null with no bar.
+  progress: number | null;
+};
+
+export type HabitStats = {
+  rows: HabitRow[];
+  // Spec §4, rows 5 and 6: the detail of the row on the Sức khỏe page when
+  // the habit is short; null otherwise.
+  attention: { sleep: string | null; tummy: string | null };
+};
+
+const WINDOW_DAYS = 7;
+// A day nobody logged is usually a day somebody forgot, not a day without
+// sleep: the mean divides by the days that have data, and below these counts
+// the habit is not judged at all.
+const SLEEP_MIN_DAYS = 5;
+const TUMMY_MIN_DAYS = 3;
+// WHO 2019, physical activity under 5 years: at least 30 minutes a day of
+// tummy time for infants not yet mobile.
+const TUMMY_NORM_MINUTES = 30;
+const TUMMY_UNTIL_DAY = 365;
+const VITAMIN_D_UNTIL_DAY = 730;
+const VITAMIN_D_GOOD_DAYS = 6;
+
+const oneDecimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
+
+// The mean over the days that have a value, in whole minutes.
+function meanOf(values: number[]): { days: number; mean: number } {
+  const present = values.filter((value) => value > 0);
+  const total = present.reduce((sum, value) => sum + value, 0);
+  return {
+    days: present.length,
+    mean: present.length === 0 ? 0 : Math.round(total / present.length),
+  };
+}
+
+export function habitStats(
+  logs: LogLike[],
+  dob: string,
+  now: Date,
+): HabitStats {
+  const age = ageDays(dob, now);
+  // Eight days ending today, without today.
+  const days = vnDayRange(now, WINDOW_DAYS + 1).slice(0, WINDOW_DAYS);
+  const stats = dailyStats(logs, days, now);
+  const rows: HabitRow[] = [];
+  const attention: HabitStats["attention"] = { sleep: null, tummy: null };
+
+  const sleep = meanOf(stats.map((day) => day.sleepMinutes));
+  const norm = dailyNorm("sleep", age);
+  if (sleep.days < SLEEP_MIN_DAYS || !norm || norm.max === undefined) {
+    rows.push({
+      key: "sleep",
+      title: "Giấc ngủ",
+      line: "Chưa đủ dữ liệu ngủ 7 ngày",
+      chip: null,
+      progress: null,
+    });
+  } else {
+    const range = `nên ${norm.min}–${norm.max} giờ`;
+    const low = sleep.mean < norm.min * 60;
+    rows.push({
+      key: "sleep",
+      title: "Giấc ngủ",
+      line: `${formatDuration(sleep.mean * 60_000)} mỗi ngày · ${range}`,
+      chip: low
+        ? { text: "Ít hơn chuẩn", tone: "warn" }
+        : sleep.mean > norm.max * 60
+          ? { text: "Nhiều hơn chuẩn", tone: "neutral" }
+          : { text: "Đủ", tone: "good" },
+      progress: Math.min(1, sleep.mean / (norm.max * 60)),
+    });
+    // Tenths of an hour, rounded down: under the norm it must never read as
+    // the norm itself ("14 giờ mỗi ngày · nên 14–17 giờ").
+    if (low)
+      attention.sleep = `${oneDecimal.format(Math.floor(sleep.mean / 6) / 10)} giờ mỗi ngày · ${range}`;
+  }
+
+  if (age < TUMMY_UNTIL_DAY) {
+    const tummy = meanOf(stats.map((day) => day.tummyMinutes));
+    if (tummy.days < TUMMY_MIN_DAYS) {
+      rows.push({
+        key: "tummy",
+        title: "Nằm sấp",
+        line: "Tuần này chưa ghi nằm sấp",
+        chip: null,
+        progress: null,
+      });
+    } else {
+      const line = `${tummy.mean} phút mỗi ngày · nên từ ${TUMMY_NORM_MINUTES} phút`;
+      const short = tummy.mean < TUMMY_NORM_MINUTES;
+      rows.push({
+        key: "tummy",
+        title: "Nằm sấp",
+        line,
+        chip: short
+          ? { text: "Còn thiếu", tone: "warn" }
+          : { text: "Đủ", tone: "good" },
+        progress: Math.min(1, tummy.mean / TUMMY_NORM_MINUTES),
+      });
+      if (short) attention.tummy = line;
+    }
+  }
+
+  if (age < VITAMIN_D_UNTIL_DAY) {
+    const given = new Set<string>();
+    for (const log of logs) {
+      if (log.type !== "medicine") continue;
+      const details = detailsSchemas.medicine.safeParse(log.details);
+      if (!details.success || !VITAMIN_D.test(details.data.name.trim()))
+        continue;
+      const day = vnDateString(new Date(log.started_at));
+      if (days.includes(day)) given.add(day);
+    }
+    rows.push({
+      key: "vitaminD",
+      title: "Vitamin D",
+      line: `Đã uống ${given.size} trên ${WINDOW_DAYS} ngày`,
+      chip:
+        given.size >= VITAMIN_D_GOOD_DAYS
+          ? { text: "Đều", tone: "good" }
+          : { text: `Sót ${WINDOW_DAYS - given.size} ngày`, tone: "neutral" },
+      progress: given.size / WINDOW_DAYS,
+    });
+  }
+
+  return { rows, attention };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  179 passed (179)`, `Tests  1566 passed (1566)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/habits.ts lib/rules/habits.test.ts
git commit -m "feat(habits): sleep, tummy time and vitamin D over the last seven days" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Thẻ "Thói quen 7 ngày qua" (§7.1)

**Files:**

- Create: `components/height/HabitsCard.tsx`
- Test: `components/height/habitscard.test.tsx` (mới)

**Interfaces:**

- Consumes: `HabitRow`, `HabitKey` (Task 1); `StatusChip`, `Icon`, `CATEGORY_CHIP`, `cx`.
- Produces: `HabitsCard({ rows })`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/height/habitscard.test.tsx b/components/height/habitscard.test.tsx
new file mode 100644
index 0000000..c91943b
--- /dev/null
+++ b/components/height/habitscard.test.tsx
@@ -0,0 +1,122 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import type { HabitRow } from "@/lib/rules/habits";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { HabitsCard } from "./HabitsCard";
+
+const CHIP = "font-semibold whitespace-nowrap";
+const sleep: HabitRow = {
+  key: "sleep",
+  title: "Giấc ngủ",
+  line: "13 giờ 30 phút mỗi ngày · nên 14–17 giờ",
+  chip: { text: "Ít hơn chuẩn", tone: "warn" },
+  progress: 0.79,
+};
+const tummy: HabitRow = {
+  key: "tummy",
+  title: "Nằm sấp",
+  line: "30 phút mỗi ngày · nên từ 30 phút",
+  chip: { text: "Đủ", tone: "good" },
+  progress: 1,
+};
+const vitaminD: HabitRow = {
+  key: "vitaminD",
+  title: "Vitamin D",
+  line: "Đã uống 5 trên 7 ngày",
+  chip: { text: "Sót 2 ngày", tone: "neutral" },
+  progress: 5 / 7,
+};
+const render = (rows: HabitRow[]) =>
+  renderToStaticMarkup(<HabitsCard rows={rows} />);
+
+// Spec 2026-11-25 §7.1.
+describe("HabitsCard", () => {
+  it("is titled, lists one row per habit in a glass group, and names its sources", () => {
+    const html = render([sleep, tummy, vitaminD]);
+    expect(html).toContain(">Thói quen 7 ngày qua</h2>");
+    expect(html).toContain("glass");
+    expect(html).toContain("rounded-[26px]");
+    expect(html.match(/<li /g)).toHaveLength(3);
+    expect(html).toContain(
+      ">Chuẩn giấc ngủ như trang Thống kê. Nằm sấp: WHO 2019.</p>",
+    );
+    expect(html.indexOf("Giấc ngủ")).toBeLessThan(html.indexOf("Nằm sấp"));
+    expect(html.indexOf("Nằm sấp")).toBeLessThan(html.indexOf("Vitamin D"));
+  });
+
+  it("each habit has its icon in its own colour", () => {
+    const html = render([sleep, tummy, vitaminD]);
+    for (const [icon, colour] of [
+      ["moon", "bg-cat-sleep/15 text-cat-sleep"],
+      ["smile", "bg-cat-tummy/15 text-cat-tummy"],
+      ["sun", "bg-cat-med/15 text-cat-med"],
+    ] as const) {
+      expect(html).toContain(`d="${ICON_PATHS[icon]}"`);
+      expect(html).toContain(colour);
+    }
+    expect(html).toContain("size-9");
+  });
+
+  it("a row: the name, the value against the norm, the chip in its tone", () => {
+    const html = render([sleep, tummy, vitaminD]);
+    expect(html).toContain(">Giấc ngủ</span>");
+    expect(html).toContain(
+      '<span class="text-[13px] leading-[18px] text-muted">13 giờ 30 phút mỗi ngày · nên 14–17 giờ</span>',
+    );
+    expect(html).toContain(
+      `${CHIP} bg-warn-soft text-warn-ink">Ít hơn chuẩn</span>`,
+    );
+    expect(html).toContain(`${CHIP} bg-good-soft text-good-ink">Đủ</span>`);
+    expect(html).toContain(`${CHIP} bg-line text-ink">Sót 2 ngày</span>`);
+  });
+
+  // Beside the value line a chip such as "Nhiều hơn chuẩn" would leave it
+  // about 116 px at 375 px wide, and it would run onto three lines.
+  it("the chip shares a line with the name only; the value line has the full width under it", () => {
+    const html = render([sleep]);
+    expect(html).toContain(
+      '<span class="flex items-center gap-2"><span class="min-w-0 flex-1 text-base font-bold text-ink">Giấc ngủ</span><span class="shrink-0',
+    );
+    expect(html.indexOf("Ít hơn chuẩn")).toBeLessThan(
+      html.indexOf("13 giờ 30 phút mỗi ngày"),
+    );
+  });
+
+  it("the bar is decoration in the habit's colour, as wide as the progress", () => {
+    const html = render([sleep, tummy, vitaminD]);
+    expect(
+      html.match(
+        /aria-hidden="true" class="block h-1.5 overflow-hidden rounded-full bg-line"/g,
+      ),
+    ).toHaveLength(3);
+    expect(html).toContain(
+      'class="block h-full rounded-full bg-cat-sleep" style="width:79%"',
+    );
+    expect(html).toContain(
+      'class="block h-full rounded-full bg-cat-tummy" style="width:100%"',
+    );
+    expect(html).toMatch(/bg-cat-med" style="width:71\.42857142857\d*%"/);
+  });
+
+  it("a habit not judged for lack of data: its line only, no chip and no bar", () => {
+    const html = render([
+      {
+        key: "sleep",
+        title: "Giấc ngủ",
+        line: "Chưa đủ dữ liệu ngủ 7 ngày",
+        chip: null,
+        progress: null,
+      },
+    ]);
+    expect(html).toContain(">Chưa đủ dữ liệu ngủ 7 ngày</span>");
+    expect(html).not.toContain(CHIP);
+    expect(html).not.toContain("h-1.5");
+  });
+
+  it("an older child has fewer rows, and the note names only the norms that are shown", () => {
+    const html = render([sleep, vitaminD]);
+    expect(html.match(/<li /g)).toHaveLength(2);
+    expect(html).toContain(">Chuẩn giấc ngủ như trang Thống kê.</p>");
+    expect(html).not.toContain("WHO 2019");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 179 passed (180)`, `Tests  1566 passed (1566)`. File test mới không chạy được test nào vì chưa có `./HabitsCard`.

- [x] **Step 3: Viết code (Patch 4)**

```diff
diff --git a/components/height/HabitsCard.tsx b/components/height/HabitsCard.tsx
new file mode 100644
index 0000000..f616b88
--- /dev/null
+++ b/components/height/HabitsCard.tsx
@@ -0,0 +1,84 @@
+import { Icon } from "@/components/ui/Icon";
+import { StatusChip } from "@/components/ui/StatusChip";
+import type { HabitKey, HabitRow } from "@/lib/rules/habits";
+import { CATEGORY_CHIP, type CategoryToken } from "@/lib/ui/categories";
+import { cx } from "@/lib/ui/cx";
+import type { IconName } from "@/lib/ui/icons";
+
+const LOOK: Record<
+  HabitKey,
+  { icon: IconName; token: CategoryToken; bar: string }
+> = {
+  sleep: { icon: "moon", token: "cat-sleep", bar: "bg-cat-sleep" },
+  tummy: { icon: "smile", token: "cat-tummy", bar: "bg-cat-tummy" },
+  vitaminD: { icon: "sun", token: "cat-med", bar: "bg-cat-med" },
+};
+
+// Spec 2026-11-25 §7.1: sleep, tummy time and vitamin D over the seven days
+// before today, each against its norm.
+export function HabitsCard({ rows }: { rows: HabitRow[] }) {
+  return (
+    <section className="flex flex-col gap-2.5">
+      <h2 className="mx-1 text-xl leading-[26px] font-bold text-ink">
+        Thói quen 7 ngày qua
+      </h2>
+      <ul className="glass overflow-hidden rounded-[26px]">
+        {rows.map((row) => {
+          const look = LOOK[row.key];
+          return (
+            <li
+              key={row.key}
+              className="flex flex-col gap-2.5 border-b border-line px-4 py-3.5 last:border-b-0"
+            >
+              <span className="flex items-start gap-3">
+                <span
+                  className={cx(
+                    "flex size-9 shrink-0 items-center justify-center rounded-full",
+                    CATEGORY_CHIP[look.token],
+                  )}
+                >
+                  <Icon name={look.icon} size={18} strokeWidth={2.2} />
+                </span>
+                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
+                  {/* The chip shares a line with the name only: beside the
+                      value line it would leave that line about 116 px at
+                      375 px wide. */}
+                  <span className="flex items-center gap-2">
+                    <span className="min-w-0 flex-1 text-base font-bold text-ink">
+                      {row.title}
+                    </span>
+                    {row.chip && (
+                      <StatusChip tone={row.chip.tone}>
+                        {row.chip.text}
+                      </StatusChip>
+                    )}
+                  </span>
+                  <span className="text-[13px] leading-[18px] text-muted">
+                    {row.line}
+                  </span>
+                </span>
+              </span>
+              {row.progress !== null && (
+                <span
+                  aria-hidden
+                  className="block h-1.5 overflow-hidden rounded-full bg-line"
+                >
+                  <span
+                    className={cx("block h-full rounded-full", look.bar)}
+                    style={{ width: `${row.progress * 100}%` }}
+                  />
+                </span>
+              )}
+            </li>
+          );
+        })}
+      </ul>
+      {/* The source of the tummy-time norm is named only while that row is
+          shown, in the baby's first year. */}
+      <p className="px-1 text-[13px] leading-[18px] text-muted">
+        Chuẩn giấc ngủ như trang Thống kê.
+        {rows.some((row) => row.key === "tummy") && " Nằm sấp: WHO 2019."}
+      </p>
+    </section>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  180 passed (180)`, `Tests  1573 passed (1573)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/height/HabitsCard.tsx components/height/habitscard.test.tsx
git commit -m "feat(habits): the card of the last seven days" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Trang Chiều cao hiện thói quen (§6.3 mục 6, §7.2)

**Files:**

- Modify: `components/height/HeightScreen.tsx`
- Test: `components/height/heightscreen.test.tsx`

**Interfaces:**

- Consumes: `habitStats` (Task 1), `HabitsCard` (Task 2); `useStatsLogs`, `statsFetchSince`, `vnDayRange`.
- Produces: `HeightScreen` tải bản ghi 14 ngày và vẽ `HabitsCard` sau thẻ tốc độ tăng.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/height/heightscreen.test.tsx b/components/height/heightscreen.test.tsx
index 5afad9c..207241e 100644
--- a/components/height/heightscreen.test.tsx
+++ b/components/height/heightscreen.test.tsx
@@ -1,16 +1,21 @@
 import { renderToStaticMarkup } from "react-dom/server";
 import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
+import { statsFetchSince } from "@/lib/rules/dailyStats";
+import { vnDayRange } from "@/lib/rules/days";
 import type { Baby, GrowthRow } from "@/lib/supabase/rows";
 import { HeightScreen } from "./HeightScreen";

 const state = vi.hoisted(() => ({
   growth: {} as Record<string, unknown>,
   table: {} as Record<string, unknown>,
+  logs: {} as Record<string, unknown>,
 }));
 const useGrowth = vi.hoisted(() => vi.fn());
 const useWhoTable = vi.hoisted(() => vi.fn());
+const useStatsLogs = vi.hoisted(() => vi.fn());

 vi.mock("@/lib/data/growth", () => ({ useGrowth, useWhoTable }));
+vi.mock("@/lib/data/logs", () => ({ useStatsLogs }));
 // The chart is loaded lazily; a stand-in shows what it was given.
 vi.mock("next/dynamic", () => ({
   default:
@@ -88,18 +93,20 @@ const baby = (over: Partial<Baby> = {}) =>
   }) as unknown as Baby;

 function render(
-  query: { growth?: unknown; table?: unknown } = {},
+  query: { growth?: unknown; table?: unknown; logs?: unknown } = {},
   who: Baby = baby(),
   isOwner = true,
 ) {
   state.growth = (query.growth ?? loaded(ROWS)) as Record<string, unknown>;
   state.table = (query.table ?? TABLE) as Record<string, unknown>;
+  state.logs = (query.logs ?? loaded([])) as Record<string, unknown>;
   return renderToStaticMarkup(<HeightScreen baby={who} isOwner={isOwner} />);
 }

 beforeAll(() => {
   useGrowth.mockImplementation(() => state.growth);
   useWhoTable.mockImplementation(() => state.table);
+  useStatsLogs.mockImplementation(() => state.logs);
   vi.useFakeTimers({ toFake: ["Date"] });
   vi.setSystemTime(new Date("2026-11-20T05:00:00Z")); // 12:00 giờ VN
 });
@@ -131,6 +138,7 @@ describe("HeightScreen", () => {
       ">Di truyền dự kiến</h2>",
       ">Đường tới 180 cm</h2>",
       ">Tốc độ tăng</span>",
+      ">Thói quen 7 ngày qua</h2>",
       ">Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và nhắc việc, không thay lời khuyên của bác sĩ.</p>",
     ].map((mark) => html.indexOf(mark));
     expect(order.every((i) => i >= 0)).toBe(true);
@@ -175,6 +183,33 @@ describe("HeightScreen", () => {
     );
   });

+  // Spec 2026-11-25 §7.1 and §7.2.
+  it("reads the logs of the last 14 days, the query the Thống kê page already uses", () => {
+    useStatsLogs.mockClear();
+    render();
+    expect(useStatsLogs).toHaveBeenCalledWith(
+      "b1",
+      statsFetchSince(vnDayRange(new Date("2026-11-20T05:00:00Z"), 14)),
+    );
+  });
+
+  it("the habits of the last seven days: one row per habit for the baby's age", () => {
+    // 67 days old and nothing logged: sleep and tummy time are not judged.
+    const html = render();
+    expect(html).toContain(">Giấc ngủ</span>");
+    expect(html).toContain(">Chưa đủ dữ liệu ngủ 7 ngày</span>");
+    expect(html).toContain(">Tuần này chưa ghi nằm sấp</span>");
+    expect(html).toContain(">Đã uống 0 trên 7 ngày</span>");
+  });
+
+  it("the habits wait for the logs: no block while they load or after they fail", () => {
+    for (const html of [render({ logs: LOADING }), render({ logs: FAILED })]) {
+      expect(html).not.toContain("Thói quen 7 ngày qua");
+      expect(html).toContain(">Tốc độ tăng</span>");
+      expect(html).toContain("Chiều cao lúc lớn phần lớn do di truyền.");
+    }
+  });
+
   it("no target: the goal card says so, there is no path, the rest stays", () => {
     const html = render({}, baby({ target_height_cm: null }));
     expect(html).toContain(">Chưa có mục tiêu chiều cao</p>");
@@ -236,6 +271,11 @@ describe("HeightScreen", () => {
     expect(html).toContain(">Bảng WHO trong app tới 5 tuổi.</p>");
     expect(html).not.toContain("data-chart");
     expect(html).not.toContain("Tốc độ tăng");
+    // Past the first two years only sleep is a habit the page follows.
+    expect(html).toContain(">Thói quen 7 ngày qua</h2>");
+    expect(html).not.toContain("Nằm sấp");
+    expect(html).not.toContain("Vitamin D");
+    expect(html).toContain(">Chuẩn giấc ngủ như trang Thống kê.</p>");
     expect(html).toContain(">Di truyền dự kiến</h2>");
     expect(html).toContain("Chiều cao lúc lớn phần lớn do di truyền.");
   });
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: FAIL, `Test Files  1 failed | 179 passed (180)`, `Tests  4 failed | 1572 passed (1576)`. Lý do đỏ: trang chưa gọi `useStatsLogs` và chưa vẽ khối thói quen.

- [x] **Step 3: Viết code (Patch 6)**

```diff
diff --git a/components/height/HeightScreen.tsx b/components/height/HeightScreen.tsx
index 426ecfa..d1422c9 100644
--- a/components/height/HeightScreen.tsx
+++ b/components/height/HeightScreen.tsx
@@ -10,6 +10,10 @@ import { Skeleton } from "@/components/ui/Skeleton";
 import { whoSex, type LmsRow } from "@/lib/content/who";
 import { toVietnameseError } from "@/lib/data/errors";
 import { useGrowth, useWhoTable } from "@/lib/data/growth";
+import { useStatsLogs } from "@/lib/data/logs";
+import { statsFetchSince } from "@/lib/rules/dailyStats";
+import { vnDayRange } from "@/lib/rules/days";
+import { habitStats } from "@/lib/rules/habits";
 import { heightView } from "@/lib/rules/heightView";
 import type { Baby } from "@/lib/supabase/rows";
 import {
@@ -18,6 +22,7 @@ import {
   TargetPathCard,
   VelocityCard,
 } from "./HeightCards";
+import { HabitsCard } from "./HabitsCard";
 import { HeightGoalSheet } from "./HeightGoalSheet";

 const NOTE = "px-1 text-[13px] leading-[18px] text-muted";
@@ -49,6 +54,11 @@ export function HeightScreen({
   const edit = isOwner ? () => setEditing(true) : undefined;
   const sex = whoSex(baby.sex);
   const table = useWhoTable("lhfa", sex);
+  // Spec §7.2: the 14-day query of the Thống kê page, shared through its
+  // cache; the habits read the seven full days before today from it.
+  const now = new Date();
+  const logs = useStatsLogs(baby.id, statsFetchSince(vnDayRange(now, 14)));
+  const habits = logs.data ? habitStats(logs.data, baby.dob, now) : null;
   const view =
     growth.data && table.data
       ? heightView({
@@ -62,7 +72,7 @@ export function HeightScreen({
           },
           rows: growth.data,
           table: table.data.rows as LmsRow[],
-          today: new Date(),
+          today: now,
         })
       : null;

@@ -109,6 +119,7 @@ export function HeightScreen({
               <VelocityCard velocity={view.velocity} />
             </>
           )}
+          {habits && <HabitsCard rows={habits.rows} />}
           <p className={NOTE}>
             Chiều cao lúc lớn phần lớn do di truyền. Kim Bun giúp theo dõi và
             nhắc việc, không thay lời khuyên của bác sĩ.
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  180 passed (180)`, `Tests  1576 passed (1576)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/height/HeightScreen.tsx components/height/heightscreen.test.tsx
git commit -m "feat(height): the Chiều cao page shows the habits of the last seven days" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M4a và hỏi người dùng trước khi lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-height/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  180 passed (180)`, `Tests  1576 passed (1576)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm cho các trạng thái dữ liệu thật không có**

Trang này không đọc hay ghi dữ liệu của gia đình; nó dựng thẻ thói quen từ các hàng cho sẵn. Tạo `app/fixture-height/page.tsx`:

```tsx
"use client";

import { HabitsCard } from "@/components/height/HabitsCard";
import type { HabitRow } from "@/lib/rules/habits";

const row = (
  key: HabitRow["key"],
  line: string,
  chip: HabitRow["chip"],
  progress: number | null,
): HabitRow => ({
  key,
  title: { sleep: "Giấc ngủ", tummy: "Nằm sấp", vitaminD: "Vitamin D" }[key],
  line,
  chip,
  progress,
});

// Năm bộ hàng: 1 còn thiếu · 2 đủ cả · 3 ngủ nhiều hơn chuẩn (chip dài nhất) ·
// 4 chưa đủ dữ liệu · 5 bé trên 2 tuổi (chỉ còn giấc ngủ).
const SETS: HabitRow[][] = [
  [
    row(
      "sleep",
      "13 giờ 30 phút mỗi ngày · nên 14–17 giờ",
      { text: "Ít hơn chuẩn", tone: "warn" },
      13.5 / 17,
    ),
    row(
      "tummy",
      "15 phút mỗi ngày · nên từ 30 phút",
      { text: "Còn thiếu", tone: "warn" },
      0.5,
    ),
    row(
      "vitaminD",
      "Đã uống 5 trên 7 ngày",
      { text: "Sót 2 ngày", tone: "neutral" },
      5 / 7,
    ),
  ],
  [
    row(
      "sleep",
      "15 giờ 00 phút mỗi ngày · nên 14–17 giờ",
      { text: "Đủ", tone: "good" },
      15 / 17,
    ),
    row(
      "tummy",
      "42 phút mỗi ngày · nên từ 30 phút",
      { text: "Đủ", tone: "good" },
      1,
    ),
    row("vitaminD", "Đã uống 7 trên 7 ngày", { text: "Đều", tone: "good" }, 1),
  ],
  [
    row(
      "sleep",
      "17 giờ 45 phút mỗi ngày · nên 14–17 giờ",
      { text: "Nhiều hơn chuẩn", tone: "neutral" },
      1,
    ),
    row("tummy", "Tuần này chưa ghi nằm sấp", null, null),
    row(
      "vitaminD",
      "Đã uống 0 trên 7 ngày",
      { text: "Sót 7 ngày", tone: "neutral" },
      0,
    ),
  ],
  [
    row("sleep", "Chưa đủ dữ liệu ngủ 7 ngày", null, null),
    row("tummy", "Tuần này chưa ghi nằm sấp", null, null),
    row(
      "vitaminD",
      "Đã uống 6 trên 7 ngày",
      { text: "Đều", tone: "good" },
      6 / 7,
    ),
  ],
  [
    row(
      "sleep",
      "11 giờ 20 phút mỗi ngày · nên 10–13 giờ",
      { text: "Đủ", tone: "good" },
      11.33 / 13,
    ),
  ],
];

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture thói quen 7 ngày qua</p>
      {SETS.map((rows, index) => (
        <HabitsCard key={index} rows={rows} />
      ))}
    </main>
  );
}
```

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Hỏi người dùng dùng trình duyệt nào trước khi mở (xem Diễn giải spec, mục 9). Chạy `bun run dev`. Cỡ 375×812.

Trên trang tạm `http://localhost:3000/fixture-height` (năm khối, mỗi khối có tiêu đề "Thói quen 7 ngày qua"):

1. **Khối 1:** ba hàng. Mỗi hàng: vòng tròn icon bên trái (mặt trăng tím, mặt cười, mặt trời), tên đậm, chip cùng dòng với tên ở bên phải, dòng xám ngay dưới tên, rồi một thanh mảnh màu của hàng. Chip "Ít hơn chuẩn" và "Còn thiếu" nền vàng; "Sót 2 ngày" nền xám. Thanh của Nằm sấp dài một nửa.
2. **Khối 2:** ba chip nền xanh "Đủ", "Đủ", "Đều"; hai thanh sau đầy.
3. **Khối 3:** chip "Nhiều hơn chuẩn" (nền xám) nằm cùng dòng với "Giấc ngủ"; dòng "17 giờ 45 phút mỗi ngày · nên 14–17 giờ" nằm trên **một** dòng. Dùng `getBoundingClientRect()` ghi lại bề ngang của dòng đó và bề ngang chỗ dành cho nó; nếu nó xuống hai dòng thì ghi lại, quá hai dòng là lỗi. Hàng Nằm sấp chỉ có dòng "Tuần này chưa ghi nằm sấp", không chip, không thanh. Thanh của Vitamin D rỗng.
4. **Khối 4:** hai hàng đầu không có chip và thanh ("Chưa đủ dữ liệu ngủ 7 ngày", "Tuần này chưa ghi nằm sấp").
5. **Khối 5:** chỉ một hàng Giấc ngủ; dòng dưới khối ghi "Chuẩn giấc ngủ như trang Thống kê." và **không** có "Nằm sấp: WHO 2019.". Bốn khối trên thì có đủ cả hai câu.
6. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
7. Lặp mục 1 đến 3 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: chip, thanh và dòng xám đọc rõ; ở `night` chip vàng và chip xanh cùng tông, phân biệt được bằng chữ.

Trang thật `http://localhost:3000/tang-truong/chieu-cao` (dữ liệu thật của gia đình: chỉ xem):

8. Khối "Thói quen 7 ngày qua" nằm sau thẻ "Tốc độ tăng", trước đoạn "Chiều cao lúc lớn phần lớn do di truyền…". Ghi lại từng hàng đang hiện: tên, dòng xám, chip.
9. Đối chiếu hàng Giấc ngủ với trang `http://localhost:3000/thong-ke`, tab Ngủ, chọn **14 ngày** (khoảng 7 ngày của trang đó tính cả hôm nay và thiếu ngày đầu của khung thói quen). Đọc số giờ của bảy ngày ngay trước hôm nay, bỏ những ngày 0 giờ, lấy trung bình các ngày còn lại. Ghi lại bảy con số, trung bình tính tay, và con số của khối; hai số lệch nhau quá 6 phút (0,1 giờ, do trang Thống kê làm tròn từng ngày) thì nêu ra. Nếu có dưới 5 ngày khác 0 thì khối phải ghi "Chưa đủ dữ liệu ngủ 7 ngày".
10. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm".

**Kết quả kiểm (2026-11-25, khoảng 23 giờ, giờ Việt Nam)**

Trước bước này: 6 patch áp sạch bằng `kb_patch`, không sửa tay; đỏ và xanh đúng số ghi ở từng task. `bun run typecheck` sạch; `Test Files  180 passed (180)`, `Tests  1576 passed (1576)`; `bun run build` lần đầu mã 1 (thông báo bảo mật Next.js 16.4.3; không chạy `next upgrade`), lần hai mã 0, 40/40 trang.

Trình duyệt: khung Browser trong app, 375×812, DPR 2. Phiên điều phối dặn dùng khung này không cần hỏi, nhưng bộ kiểm quyền của app chặn lần mở đầu vì luật của người dùng ghi mặc định là Claude in Chrome; extension Claude in Chrome không kết nối (thử hai lần). Người dùng chọn "Khung Browser trong app" trên question card, sau đó mới mở. Khung còn đăng nhập, theme mở sẵn `night`. `bun run dev` lần đầu cũng dừng vì thông báo bảo mật, lần hai chạy. App tự đặt lại `data-theme` theo lịch đêm, nên muốn xem theme khác phải giữ thuộc tính bằng một `MutationObserver` trong trang (không lưu gì, mất khi chuyển trang).

Trang tạm `/fixture-height` (không phải trang thật):

1. Đạt. Ba hàng, vòng icon 36×36, tên đậm một dòng, chip cùng dòng với tên ở bên phải, dòng xám ngay dưới, thanh cao 6 px. Thanh Giấc ngủ 79,4 %, Nằm sấp 50,0 %, Vitamin D 71,4 %. Ở `rose`: icon và thanh tím, xanh lá, đỏ; "Ít hơn chuẩn" và "Còn thiếu" nền vàng, "Sót 2 ngày" nền xám.
2. Đạt. "Đủ", "Đủ", "Đều" nền xanh; hai thanh sau đầy (tỉ lệ 1), thanh Giấc ngủ 88,2 %.
3. Đạt. Chip "Nhiều hơn chuẩn" rộng 125,8 px (plan ước 135), cùng dòng với "Giấc ngủ". Dòng "17 giờ 45 phút mỗi ngày · nên 14–17 giờ" nằm trên **một** dòng: chữ rộng 238,9 px, chỗ dành cho nó 261 px (dòng dài nhất trong năm khối là 239,5 px). Hàng Nằm sấp chỉ có "Tuần này chưa ghi nằm sấp", không chip, không thanh. Thanh Vitamin D rỗng (tỉ lệ 0), còn thấy nền thanh.
4. Đạt. Hai hàng đầu không chip, không thanh.
5. Đạt. Khối 5 chỉ có hàng Giấc ngủ và dòng "Chuẩn giấc ngủ như trang Thống kê."; bốn khối trên có đủ hai câu.
6. Đạt: `scrollWidth` 375, `innerWidth` 375. Cũng `true` ở 390, 393, 430 và 440 px; ở cả năm bề ngang mọi tên hàng và dòng xám đều một dòng, không chữ nào bị cắt.
7. Đạt. Đã chụp `night`, `rose`, `light`, `dark`; `peach`, `lavender`, `sea` chỉ đo màu (chip vàng và xanh giống `rose`). Chip, thanh và dòng xám đọc rõ ở cả bảy theme; ở `night` mọi thứ một tông cam, chip vàng và chip xanh chỉ phân biệt được bằng chữ, đúng như plan ghi.

**Chỗ chưa đẹp lộ ra ở mục 1 đến 5 (đã sửa, xem "Sửa sau lần kiểm"):** dòng chú thích "Chuẩn giấc ngủ như trang Thống kê. Nằm sấp: WHO 2019." cần 353 px trên một dòng, mà chỗ chứa chữ là 335 px ở 375 px và 350 px ở 390 px, nên chữ "2019." rớt xuống dòng hai một mình. Từ 393 px trở lên thì vừa một dòng.

Trang thật `/tang-truong/chieu-cao` (`night`, chỉ xem; không chạm gì trên trang này):

8. Đạt. Thứ tự: thẻ mục tiêu, "Di truyền dự kiến", "Đường tới 180 cm", "Tốc độ tăng", "Thói quen 7 ngày qua", đoạn "Chiều cao lúc lớn phần lớn do di truyền…". Ba hàng đang hiện:
   - Giấc ngủ · "12 giờ 56 phút mỗi ngày · nên 14–17 giờ" · chip "Ít hơn chuẩn" · thanh 76,1 %.
   - Nằm sấp · "2 phút mỗi ngày · nên từ 30 phút" · chip "Còn thiếu" · thanh 6,7 %.
   - Vitamin D · "Đã uống 6 trên 7 ngày" · chip "Đều" · thanh 85,7 %.
9. Đạt, lệch 0 phút. Trang Thống kê, tab Ngủ, 14 ngày (chỉ bấm "14 ngày" và "Ngủ", rồi bấm lại "7 ngày"): 18/11 3 giờ 04; 19/11 15 giờ 00; 20/11 13 giờ 44; 21/11 12 giờ 10; 22/11 15 giờ 20; 23/11 12 giờ 32; 24/11 18 giờ 45. Cả bảy ngày khác 0; tổng 5435 phút, chia 7 là 776,4, làm tròn 776 phút = 12 giờ 56 phút, đúng con số của khối.
10. Đạt: `scrollWidth` 375, `innerWidth` 375.

Chưa kiểm: hàng Nằm sấp và Vitamin D chưa đối chiếu tay với nhật ký (plan chỉ yêu cầu Giấc ngủ); trạng thái đang tải và lỗi tải bản ghi trên trang thật (chỉ có unit test); phía thành viên; bé trên 1 tuổi, trên 2 tuổi và quá 1856 ngày tuổi trên dữ liệu thật (chỉ thấy khối 5 của trang tạm và unit test); trình đọc màn hình; iPhone thật, PWA.

Dev đã dừng, khung Browser đã đóng, trang tạm đã xóa. Không có `.claude/launch.json` nào còn lại.

### Sửa sau lần kiểm

**1. Chữ "2019." rớt dòng một mình dưới khối thói quen (commit `cb2cc96`).**

- Lỗi: như ghi ở trên; gặp ở 375 và 390 px, tức là mọi bé dưới 1 tuổi trên iPhone cỡ thường.
- Sửa: trong `HabitsCard`, câu "Nằm sấp: WHO 2019." nằm trong một `span` `whitespace-nowrap`, nên không ngắt giữa chừng. Chữ không đổi, không thêm câu nào.
- Test trước: thêm test "the source of the tummy-time norm wraps as a whole, never in the middle" trong `components/height/habitscard.test.tsx`; đỏ `Test Files  1 failed | 179 passed (180)`, `Tests  1 failed | 1576 passed (1577)`. Test "is titled, lists one row per habit…" đổi từ so cả chuỗi `<p>` sang tìm từng câu, vì giờ có `span` ở giữa.
- Sau khi sửa: `tsc --noEmit` sạch; `Test Files  180 passed (180)`, `Tests  1577 passed (1577)`; `bun run build` lần đầu mã 1 (thông báo bảo mật), lần hai mã 0, 40/40 trang.
- Xem lại trên trình duyệt: ở 375 và 390 px ghi chú là hai dòng "Chuẩn giấc ngủ như trang Thống kê." / "Nằm sấp: WHO 2019."; ở 393 và 440 px là một dòng; khối 5 vẫn một câu. Trang thật ở 375 px: hai dòng như trên, `scrollWidth <= innerWidth` vẫn `true`.
- Spec §7.1 đã thêm một câu ghi việc này (file spec vẫn untracked).

**Vitest sau M4a:** 1577 test, 180 file (plan ghi 1576; thêm 1 test của bản sửa).

- [x] **Step 5: Xóa trang fixture, commit phần ghi kết quả rồi dừng lại hỏi người dùng**

```bash
rm -r app/fixture-height
bun run typecheck   # nếu đỏ vì .next/dev/types còn trỏ tới trang tạm: rm -r .next/dev/types rồi chạy lại
git status --short   # chỉ file plan này đổi; file spec có thể hiện là untracked: không commit nó
git add docs/blueprint/plans/2026-11-25-kim-bun-chieu-cao-suc-khoe-m4a.md
git commit -m "docs(plan): record the M4a check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

**Khi thực thi (2026-11-25):** không dừng lại hỏi ở bước này. Người dùng đã cho phép trước ("duyệt hết, làm cho tới lúc xong và đẩy lên main, giữa chừng có bug gì thì fix luôn", xem Status ở đầu file), và lỗi duy nhất lộ ra đã sửa xong trước khi đẩy. `bun run typecheck` đỏ một lần vì `.next/dev/types` còn trỏ tới trang tạm; xóa thư mục đó rồi chạy lại thì sạch.

Báo cáo cho người dùng: `git log --oneline main..HEAD`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; chỗ nào chưa đẹp thì nêu trước, kèm cách sửa. Gửi ảnh khối thói quen trên trang thật. Hỏi người dùng có đưa nhánh lên `main` không. Chỉ khi người dùng đồng ý mới chạy:

```bash
git checkout main
git merge --ff-only feat/kim-bun-suc-khoe-m4a
git push origin main
```
