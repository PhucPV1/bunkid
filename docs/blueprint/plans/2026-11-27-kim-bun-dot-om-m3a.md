# Kim Bun — Đợt ốm M3a: luật và chữ của tab Hôm nay Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§5.5, §5.6; phần chữ của §7.1 và §7.3; phần unit test §5.5, §5.6 của §10.1)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Có sẵn mọi luật, mọi câu chữ và phần lưu trên máy mà tab Hôm nay cần cho đợt ốm: khi nào mời bắt đầu, bắt đầu từ giờ nào, khi nào nhắc đóng và nhắc bằng câu nào. Chưa có gì hiện ra màn hình; M3b vẽ chúng.

**Architecture:**

- **Luật thuần** trong `lib/rules/illness.ts` (`inviteAlert`, `inviteStartedAt`, `closeReminder`), dùng lại `feverStatus` của M2b và lần đo của banner nhiệt độ (`bannerReading`, tách từ `lib/rules/alerts.ts`).
- **Chữ** trong `lib/rules/illnessView.ts` (`homeEpisodeCard`, `closeReminderView`), cùng file với chữ của hai trang Đợt ốm.
- **Giờ "không, để sau"** lưu trong `localStorage` của máy (`lib/data/storedTime.ts`) và đọc bằng hook `useStoredTime`.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m3a`, cắt từ `main` sau khi M2g đã lên. Baseline: 1880 test vitest xanh (200 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc      | Nội dung                                                                                       | Plan                                                                              |
| -------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| M1a, M1b | §3: bản ghi Triệu chứng                                                                        | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md`, `…-m1b.md` (đã ở `main`) |
| M2a–M2g  | §4, §5.1–5.3, §5.7, §6: đợt ốm, hai trang, lối vào ở Sức khỏe                                  | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md` … `…-m2g.md`              |
| M3a      | luật và chữ của §5.5, §5.6, §7; giờ "không, để sau" lưu trên máy. Chưa có gì hiện ra màn hình. | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3a.md`                           |
| M3b      | §7: thẻ đợt ốm, lời mời trong banner sốt, thẻ nhắc đóng trên tab Hôm nay; Bước 38 phần M3      | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3b.md`                           |
| M4       | §5.4, §9: so sánh và Báo cáo                                                                   | chưa viết                                                                         |
| M5       | §8: lần khám                                                                                   | chưa viết                                                                         |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Mốc M3 được cắt làm hai plan** để mỗi plan dưới khoảng 1.500 dòng: M3a (plan này) là luật, chữ và phần lưu trên máy, chưa có gì hiện ra màn hình; M3b vẽ chúng lên tab Hôm nay. Sau M3a app chạy như cũ; hai plan lên `main` riêng được.
2. **"Lần đo sinh ra alert" (§5.5)** là lần đo mà chính banner dùng: hàm `bannerReading` được tách ra từ `temperatureAlert` (lần đo hợp lệ mới nhất trong 6 giờ qua, không tính lần đo mang giờ sau lúc này). Không viết lại luật 6 giờ lần thứ hai; ngưỡng và chữ của banner không đổi (Global Constraints: không đổi banner của `homeAlerts`).
3. **Banner mang lời mời** là `fever` (vàng), `fever-infant` và `fever-high` (đỏ), đúng ba khóa của §5.5. Banner `hypothermia` và các banner phân, tã không có lời mời. `inviteAlert` trả về khóa của banner, để M3b biết vẽ lời mời vào banner nào.
4. **"Nằm sau `ended_at` muộn nhất"** so chặt: lần đo đúng giờ đóng đợt thuộc đợt đó (§4.3 tính cả hai đầu), nên vừa bấm "Bé đã khỏi" thì lời mời không hiện lại. Cùng cách so ở `inviteStartedAt`.
5. **"Chưa bị từ chối trong 24 giờ qua"** (và "chưa bị hoãn" ở §5.6): lời mời ẩn khi khoảng cách giữa lúc này và giờ đã lưu dưới 24 giờ, kể cả khi giờ lưu đi trước lúc này một chút (bấm bằng đồng hồ của trang); đủ 24 giờ thì hiện lại. Giờ lưu đi trước lúc này từ 24 giờ trở lên (đồng hồ máy từng sai) bị bỏ qua, để lời mời không bị giấu mãi.
6. **`inviteStartedAt`:** "48 giờ qua" gồm cả lần đo đúng 48 giờ trước; lần đo mang giờ sau lúc này không tính. Chỉ lần đo hợp lệ theo schema. Không còn lần đo nào như vậy thì là lúc này (§5.5).
7. **`planStart` nhận thêm giờ bắt đầu** và kiểm nó theo §5.7 như mọi lần bắt đầu khác (ở tương lai, trùng đợt khác). Bị từ chối thì M3b hiện câu lỗi bằng Toast và không xếp gì vào outbox.
8. **Mốc cuối của `quiet` (§5.6)** đúng như spec: giờ muộn nhất của `started_at`, bản ghi `symptom` cuối và liều hạ sốt cuối của đợt. Lần đo dưới 38 không dời mốc này. Mọi bản ghi chỉ tính khi thuộc đợt (§4.3, gồm 2 phút nới của đợt đang mở).
9. **Ranh 48 giờ:** đúng 48 giờ là nhắc ("lúc này − mốc cuối ≥ 48 giờ").
10. **Dòng phụ của thẻ Hôm nay (§7.1)** dùng đúng chữ chip của §6.2 ("Đang sốt", "Chưa đo lại", "Hết sốt", "Không sốt"); "Hết sốt" kèm {khoảng} của §5.2. Khi bản ghi của đợt chưa tải xong, thẻ có tiêu đề nhưng chưa có dòng phụ (như chip ở danh sách của M2f).
11. **"{x}°C lúc {giờ}" không bị tách dòng.** Bước nhìn thử khi viết plan (375 px) cho thấy "Hết sốt 23 giờ · 37,4°C lúc 25/11 23:59" bị ngắt giữa "25/11" và "23:59". Các dấu cách trong phần đó là dấu cách không ngắt (U+00A0), nên dòng chỉ xuống sau dấu "·". Chữ hiện ra không đổi. M3b ghi điều này vào spec §7.1.
12. **Icon của thẻ nhắc đóng (§7.3)**: spec không nói; bản vẽ vẽ dấu tích xanh cho `no-fever`. Plan lấy tông và icon của thẻ kết luận (§5.2) cho trạng thái lúc đó: hết sốt là dấu tích xanh, chưa đo lại là đồng hồ vàng, chưa đo là nhiệt kế trung tính, đo mà không sốt là dấu tích xanh, thân nhiệt thấp là nhiệt kế trung tính. Nhờ vậy ba dạng khác nhau cả ở theme `night`. M3b ghi điều này vào spec §7.3.
13. **Lưu trên máy:** giá trị trong `localStorage` là chuỗi ISO. Khóa `kb.illness.closeSnoozedAt.{episodeId}` không được dọn khi đợt đóng hay bị xóa (vài chục byte mỗi đợt). Không đọc được `localStorage` (chế độ riêng tư) thì coi như chưa từng bấm, và lần bấm chỉ có tác dụng tới khi đóng trang.

## Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript 5.9.3 `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu, không thêm icon. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`; mã hex trong bản vẽ không được chép vào component.
- Mọi thay đổi phải đúng ở cả 7 theme: `light`, `rose`, `peach`, `lavender`, `sea`, `dark`, `night`. Theme `night` chỉ có một tông màu: không trạng thái nào được phân biệt chỉ bằng màu, phải khác cả chữ, icon hoặc hình dạng.
- `glass` nằm trong `glass` hay `glass-strong` không có blur riêng (hotfix 7822c90).
- Mọi ngày giờ tính theo giờ Việt Nam (UTC+7), dùng `formatVnTime`, `vnDateString`, `vnDayStartMs`, `formatDayShort` có sẵn.
- Ngưỡng sốt là 38,0°C, dùng `hasFever` (`lib/rules/triage.ts`). Số thập phân viết dấu phẩy, tối đa 1 chữ số lẻ.
- Chữ về sức khỏe: chỉ dùng đúng các câu ghi trong spec này. App không chẩn đoán, không nêu liều thuốc. "Kết luận" của lần khám là chữ bố mẹ gõ lại lời bác sĩ, luôn hiện kèm nhãn nói rõ điều đó.
- Đợt ốm không được che, đổi chữ hay hạ mức bất kỳ banner nào của `homeAlerts`.
- Bản ghi (`logs`) vẫn ghi qua outbox như hiện tại. Bảng `logs` chỉ đổi ràng buộc `logs_type_check`; không thêm cột.
- Ở bề ngang 375 px không chữ nào trong các khối mới bị cắt "…". Được xuống dòng: tiêu đề thẻ kết luận, dòng mô tả của thẻ và hàng danh sách (tối đa 2 dòng), lời dặn của lần khám, hàng chip.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không bắt đầu hay đóng đợt ốm, không tải ảnh. Trạng thái nào dữ liệu thật không có thì xem trên trang fixture tạm, xóa trước khi commit.
- Áp migration lên Supabase thật: plan dừng lại, đưa lệnh `bunx supabase db push --linked` cho người dùng tự chạy. Code cần một migration không được đẩy lên `main` trước khi migration đó đã áp.
- Push lên `main` cần người dùng đồng ý từng lần.
- Test hiện có phải xanh: 1659 test vitest (184 file), pgTAP 001–015, `bun run typecheck`, `bun run build`.

### Ghi chú khi thực thi (của plan này, không thuộc spec)

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 8** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 8 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `8f6714e` (`Test Files  200 passed (200)`, `Tests  1880 passed (1880)`). Trong bản chạy thử mỗi task code là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. `bun run build` đã chạy xanh trên bản sao ở trạng thái cuối của M3b (42 trang).
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Người dùng muốn màn hình gọn, ít số.** Không thêm chữ nào ngoài plan.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm màu, token hay icon. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bấm "Bắt đầu đợt ốm", "Không", "Bé đã khỏi", "Chưa", "Mở lại đợt ốm", "Xóa đợt ốm", không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `content/triage.vi.json` và `docs/device-checklist.md`.** Hai file đó từ trước đã không theo prettier.
- **Các file plan chưa chạy chưa được commit.** `git status` có thể thấy các file plan khác là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng sau M2 (M2a–M2g). M3b đứng ngay sau và dùng mọi thứ plan này Produces. M4 và M5 không cần gì từ plan này.

**Consumes (M2, đã ở `main`):** `type EpisodeLike`, `feverStatus`, `episodeVerdict`, `episodeDayCount`, `formatCelsius`, `sinceText`, `symptomEntries`, `antipyreticTimes`, `checkEpisode` (`lib/rules/illness.ts`); `planStart` (`lib/rules/illnessForm.ts`); `episodeHref`, `CHIP_TEXT` (`lib/rules/illnessView.ts`).

**Consumes (đã ở `main` từ trước):** `homeAlerts` (`lib/rules/alerts.ts`); `hasFever` (`lib/rules/triage.ts`); `detailsSchemas` (`lib/rules/logDetails.ts`); `formatVnTime`, `vnDateString` (`lib/rules/time.ts`).

**Produces (cho M3b):**

- `lib/rules/alerts.ts`: `bannerReading(logs, now): { at: number; celsius: number } | null`.
- `lib/rules/illness.ts`: `inviteAlert(input: { episodes; alerts; logs; dismissedAt: number | null; now }): string | null`; `inviteStartedAt(logs, episodes, now): string`; `type CloseCase`; `closeReminder(input: { episode; logs; snoozedAt: number | null; now }): CloseCase | null`.
- `lib/rules/illnessForm.ts`: `planStart(episodes, now, startedAt?)`.
- `lib/rules/illnessView.ts`: `clockText`; `type HomeEpisodeView`, `homeEpisodeCard(input: { episode; logs: LogLike[] | undefined; now })`; `type CloseReminderView`, `closeReminderView(input: { kind; episode; logs; babyName; now })`.
- `lib/data/storedTime.ts`: `inviteDismissKey`, `closeSnoozeKey`, `deviceStore`, `readStoredTime`, `writeStoredTime`, `type TimeStore`.
- `lib/hooks/useStoredTime.ts`: `useStoredTime(key: string | null): { at: number | null | undefined; mark: (now: Date) => void }`.
- **Vitest sau M3a:** 1911 test, 203 file.

---

### Task 1: Lời mời bắt đầu đợt ốm: luật (§5.5)

**Files:**

- Modify: `lib/rules/alerts.ts` (tách `bannerReading` ra khỏi `temperatureAlert`), `lib/rules/illness.ts` (thêm vào cuối file), `lib/rules/illnessForm.ts` (`planStart`)
- Test: `lib/rules/illnessHome.test.ts` (mới), `lib/rules/alerts.test.ts`, `lib/rules/illnessForm.test.ts`

**Interfaces:**

- Consumes: `homeAlerts`, `temperatureAlert` (`lib/rules/alerts.ts`); `type EpisodeLike`, hằng `HOUR_MS` (`lib/rules/illness.ts`); `hasFever` (`lib/rules/triage.ts`); `detailsSchemas.temperature` (`lib/rules/logDetails.ts`); `checkEpisode` qua `planStart` (`lib/rules/illnessForm.ts`, M2e).
- Produces:
  - `bannerReading(logs: LogLike[], now: Date): { at: number; celsius: number } | null` (`lib/rules/alerts.ts`): lần đo mà banner nhiệt độ nói tới. `homeAlerts` không đổi kết quả.
  - `inviteAlert(input: { episodes: EpisodeLike[]; alerts: { key: string }[]; logs: LogLike[]; dismissedAt: number | null; now: Date }): string | null` (`lib/rules/illness.ts`): khóa của banner sốt mang lời mời (`"fever"`, `"fever-infant"` hoặc `"fever-high"`), hoặc `null`.
  - `inviteStartedAt(logs: LogLike[], episodes: EpisodeLike[], now: Date): string` (`lib/rules/illness.ts`): giờ bắt đầu (ISO) của đợt tạo từ lời mời.
  - `planStart(episodes: EpisodeLike[], now: Date, startedAt?: string)` (`lib/rules/illnessForm.ts`): thêm tham số thứ ba, mặc định `now.toISOString()`; kiểm theo §5.7 như cũ.

- [x] **Step 0: Kiểm M2 đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
grep -q '"/dot-om"' lib/nav.ts && test -f app/dot-om/chi-tiet/page.tsx && echo "M2 có trên main"
git checkout -b feat/kim-bun-dot-om-m3a
bunx vitest run
```

Expected: dòng `M2 có trên main`; `Test Files  200 passed (200)`, `Tests  1880 passed (1880)`. Không thấy dòng đó thì dừng: M2g (lối vào "Đợt ốm" ở Sức khỏe) chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [x] **Step 1: Viết test đỏ (Patch 1)**

Thêm `bannerReading` vào `alerts.test.ts`, một test cho tham số mới của `planStart`, và file mới `illnessHome.test.ts`. Mọi test của luật mới chạy cùng một mảng bản ghi theo ba thứ tự (tăng, giảm, xáo trộn), như `illness.test.ts` (spec §4.2: thứ tự của mảng không được bảo đảm).

```diff
diff --git a/lib/rules/alerts.test.ts b/lib/rules/alerts.test.ts
index b7a12a0..cf1a2ba 100644
--- a/lib/rules/alerts.test.ts
+++ b/lib/rules/alerts.test.ts
@@ -1,5 +1,6 @@
 import { describe, expect, it } from "vitest";
 import {
+  bannerReading,
   homeAlerts,
   medicineWarnings,
   vitaminDToday,
@@ -31,6 +32,32 @@ const alerts = (
   triageAvailable = false,
 ) => homeAlerts({ logs, ageDays, wetDiapers, triageAvailable, now: NOW });

+// Spec 2026-11-26 §5.5: the reading the temperature banner speaks of.
+describe("bannerReading", () => {
+  it("is the newest valid reading of the last 6 hours", () => {
+    expect(
+      bannerReading(
+        [temp(5, 39.1), temp(1, 37.2), temp(3, 38.4), temp(7, 40)],
+        NOW,
+      ),
+    ).toEqual({ at: NOW.getTime() - H, celsius: 37.2 });
+    expect(bannerReading([temp(6, 38.4)], NOW)).toEqual({
+      at: NOW.getTime() - 6 * H,
+      celsius: 38.4,
+    });
+  });
+
+  it("is null without one: too old, dated after now, not a reading", () => {
+    expect(bannerReading([], NOW)).toBeNull();
+    expect(bannerReading([temp(6.01, 39)], NOW)).toBeNull();
+    expect(bannerReading([temp(-0.01, 39)], NOW)).toBeNull();
+    expect(
+      bannerReading([log("temperature", 1, { celsius: "nóng" })], NOW),
+    ).toBeNull();
+    expect(bannerReading([med(1, true)], NOW)).toBeNull();
+  });
+});
+
 describe("homeAlerts — temperature", () => {
   it("flags fever under 3 months as red", () => {
     expect(alerts([temp(2, 38.2)])).toEqual([
diff --git a/lib/rules/illnessForm.test.ts b/lib/rules/illnessForm.test.ts
index ab3ebd4..9da6f68 100644
--- a/lib/rules/illnessForm.test.ts
+++ b/lib/rules/illnessForm.test.ts
@@ -140,6 +140,18 @@ describe("planStart", () => {
       message: "Trùng thời gian với một đợt ốm khác.",
     });
   });
+
+  // Spec §5.5: from the invite the episode starts at the first fever reading.
+  it("starts at the time it is given, and checks that time", () => {
+    expect(planStart([old], now, iso("2026-11-26 20:15"))).toEqual({
+      ok: true,
+      startedAt: iso("2026-11-26 20:15"),
+    });
+    expect(planStart([old], now, iso("2026-11-11 20:15"))).toEqual({
+      ok: false,
+      message: "Trùng thời gian với một đợt ốm khác.",
+    });
+  });
 });

 describe("planClose", () => {
diff --git a/lib/rules/illnessHome.test.ts b/lib/rules/illnessHome.test.ts
new file mode 100644
index 0000000..97f45e2
--- /dev/null
+++ b/lib/rules/illnessHome.test.ts
@@ -0,0 +1,207 @@
+import { describe, expect, it } from "vitest";
+import { type HomeAlert, homeAlerts } from "./alerts";
+import type { LogLike } from "./describeLog";
+import { type EpisodeLike, inviteAlert, inviteStartedAt } from "./illness";
+
+// Vietnam time, written the way a parent reads the clock.
+const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
+const iso = (text: string) => vn(text).toISOString();
+
+const episode = (
+  start: string,
+  end: string | null = null,
+  id = "ep1",
+): EpisodeLike => ({
+  id,
+  started_at: iso(start),
+  ended_at: end === null ? null : iso(end),
+});
+
+const at = (type: string, time: string, details: unknown): LogLike => ({
+  type,
+  started_at: iso(time),
+  ended_at: iso(time),
+  details,
+});
+const temp = (time: string, celsius: number) =>
+  at("temperature", time, { celsius, method: "nach" });
+
+// Spec §4.2: the rules may not lean on the order of the array. Every order of
+// `logs` must give the same answer.
+function orders(logs: LogLike[]): LogLike[][] {
+  const ascending = [...logs].sort((a, b) =>
+    a.started_at.localeCompare(b.started_at),
+  );
+  // Odd places first, then the even ones backwards: neither sorted way.
+  const shuffled = [
+    ...ascending.filter((_, index) => index % 2 === 1),
+    ...ascending.filter((_, index) => index % 2 === 0).reverse(),
+  ];
+  return [ascending, [...ascending].reverse(), shuffled];
+}
+function sameForEveryOrder<T>(
+  logs: LogLike[],
+  rule: (logs: LogLike[]) => T,
+): T {
+  const [first, ...rest] = orders(logs).map(rule);
+  for (const other of rest) expect(other).toEqual(first);
+  return first;
+}
+
+const NOW = vn("2026-11-27 12:00");
+const HOUR = 3_600_000;
+const past = episode("2026-11-20 08:00", "2026-11-27 09:00", "past");
+
+// The banners of the home page, for a baby of eight months unless said.
+const banners = (logs: LogLike[], ageDays = 240): HomeAlert[] =>
+  homeAlerts({
+    logs,
+    ageDays,
+    wetDiapers: { status: "no-data" },
+    triageAvailable: true,
+    now: NOW,
+  });
+
+// Spec 2026-11-26 §5.5: the invite to start an episode rides on the fever
+// banner. The answer is the key of that banner, or null.
+describe("inviteAlert", () => {
+  const invite = (
+    logs: LogLike[],
+    over: {
+      episodes?: EpisodeLike[];
+      dismissedAt?: number | null;
+      ageDays?: number;
+    } = {},
+  ) =>
+    sameForEveryOrder(logs, (ordered) =>
+      inviteAlert({
+        episodes: over.episodes ?? [],
+        alerts: banners(ordered, over.ageDays),
+        logs: ordered,
+        dismissedAt: over.dismissedAt ?? null,
+        now: NOW,
+      }),
+    );
+
+  it("rides on the yellow fever banner and on both red ones", () => {
+    expect(invite([temp("2026-11-27 11:00", 38.6)])).toBe("fever");
+    expect(invite([temp("2026-11-27 11:00", 38.6)], { ageDays: 60 })).toBe(
+      "fever-infant",
+    );
+    expect(invite([temp("2026-11-27 11:00", 40.2)])).toBe("fever-high");
+  });
+
+  it("stays away without a fever banner", () => {
+    expect(invite([])).toBeNull();
+    expect(invite([temp("2026-11-27 11:00", 37.4)])).toBeNull();
+    // Older than the banner's six hours.
+    expect(invite([temp("2026-11-27 05:59", 39)])).toBeNull();
+    // A newer reading without fever takes the banner away.
+    expect(
+      invite([temp("2026-11-27 10:00", 39), temp("2026-11-27 11:00", 37.2)]),
+    ).toBeNull();
+    // The low-temperature banner and the stool banners are not fever banners.
+    expect(invite([temp("2026-11-27 11:00", 35)])).toBeNull();
+    expect(
+      invite([
+        at("diaper", "2026-11-27 11:00", {
+          wet: false,
+          dirty: true,
+          stoolColor: "pale",
+        }),
+      ]),
+    ).toBeNull();
+  });
+
+  it("stays away while the baby has an open episode", () => {
+    const logs = [temp("2026-11-27 11:00", 38.6)];
+    expect(
+      invite(logs, { episodes: [past, episode("2026-11-27 09:30")] }),
+    ).toBeNull();
+    expect(invite(logs, { episodes: [past] })).toBe("fever");
+  });
+
+  it("stays away when the reading behind the banner is from before the latest end", () => {
+    // Bé đã khỏi was pressed at 09:00; the fever of 08:30 is inside that episode.
+    expect(
+      invite([temp("2026-11-27 08:30", 38.6)], { episodes: [past] }),
+    ).toBeNull();
+    // Taken at the very moment of the end: still that episode's.
+    expect(
+      invite([temp("2026-11-27 09:00", 38.6)], { episodes: [past] }),
+    ).toBeNull();
+    expect(invite([temp("2026-11-27 09:01", 38.6)], { episodes: [past] })).toBe(
+      "fever",
+    );
+    // The latest end counts, wherever that episode sits in the list.
+    const older = episode("2026-11-01 08:00", "2026-11-03 08:00", "older");
+    expect(
+      invite([temp("2026-11-27 08:30", 38.6)], { episodes: [older, past] }),
+    ).toBeNull();
+  });
+
+  it("stays away for 24 hours after Không on this device", () => {
+    const logs = [temp("2026-11-27 11:00", 38.6)];
+    const ago = (ms: number) => NOW.getTime() - ms;
+    expect(invite(logs, { dismissedAt: ago(0) })).toBeNull();
+    expect(invite(logs, { dismissedAt: ago(24 * HOUR - 1) })).toBeNull();
+    expect(invite(logs, { dismissedAt: ago(24 * HOUR) })).toBe("fever");
+    // The tap is stamped with the real time, a moment after the page's clock.
+    expect(invite(logs, { dismissedAt: ago(-900) })).toBeNull();
+    // A stamp from a clock that once ran more than a day ahead is not kept.
+    expect(invite(logs, { dismissedAt: ago(-24 * HOUR) })).toBe("fever");
+  });
+});
+
+// Spec §5.5 "Bắt đầu đợt ốm": where the new episode starts.
+describe("inviteStartedAt", () => {
+  const startedAt = (logs: LogLike[], episodes: EpisodeLike[] = []) =>
+    sameForEveryOrder(logs, (ordered) =>
+      inviteStartedAt(ordered, episodes, NOW),
+    );
+
+  it("is the time of the earliest reading from 38,0 in the last 48 hours", () => {
+    expect(
+      startedAt([
+        temp("2026-11-26 07:00", 37.4),
+        temp("2026-11-26 20:15", 38),
+        temp("2026-11-27 02:00", 39.4),
+        temp("2026-11-27 11:00", 38.6),
+        at("symptom", "2026-11-26 06:00", { codes: ["cough"] }),
+        // Not a valid reading.
+        at("temperature", "2026-11-26 05:00", { celsius: "nóng" }),
+      ]),
+    ).toBe(iso("2026-11-26 20:15"));
+  });
+
+  it("looks back 48 hours and not a minute more", () => {
+    expect(
+      startedAt([
+        temp("2026-11-25 11:59", 39),
+        temp("2026-11-25 12:00", 38.2),
+        temp("2026-11-27 11:00", 38.6),
+      ]),
+    ).toBe(iso("2026-11-25 12:00"));
+  });
+
+  it("only counts readings after the latest end of the baby's episodes", () => {
+    const older = episode("2026-11-01 08:00", "2026-11-03 08:00", "older");
+    const logs = [
+      temp("2026-11-26 20:15", 38.9),
+      temp("2026-11-27 09:00", 38.4),
+      temp("2026-11-27 11:00", 38.6),
+    ];
+    expect(startedAt(logs, [past, older])).toBe(iso("2026-11-27 11:00"));
+    expect(startedAt(logs, [older])).toBe(iso("2026-11-26 20:15"));
+  });
+
+  it("is now when no such reading is left", () => {
+    expect(startedAt([])).toBe(NOW.toISOString());
+    expect(startedAt([temp("2026-11-27 11:00", 37.4)])).toBe(NOW.toISOString());
+    expect(startedAt([temp("2026-11-27 08:30", 38.6)], [past])).toBe(
+      NOW.toISOString(),
+    );
+    // A reading dated after now is not one of the last 48 hours.
+    expect(startedAt([temp("2026-11-27 12:01", 38.6)])).toBe(NOW.toISOString());
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  3 failed | 198 passed (201)`, `Tests  12 failed | 1880 passed (1892)`. Mười hai test đỏ ở ba file: chín của file mới `illnessHome.test.ts` (chưa có `inviteAlert`, `inviteStartedAt`), hai của `bannerReading` (`alerts.test.ts`), một của `planStart` (giờ được truyền vào bị bỏ qua).

- [x] **Step 3: Viết luật lời mời (Patch 2)**

`temperatureAlert` giữ nguyên ngưỡng và chữ; chỉ phần tìm lần đo mới nhất được tách thành `bannerReading` để lời mời dùng đúng lần đo của banner. `illness.ts` nhập `bannerReading` từ `alerts.ts` (`alerts.ts` không nhập gì từ `illness.ts`, nên không có vòng).

```diff
diff --git a/lib/rules/alerts.ts b/lib/rules/alerts.ts
index d7c244e..ac3e249 100644
--- a/lib/rules/alerts.ts
+++ b/lib/rules/alerts.ts
@@ -17,12 +17,13 @@ const within = (log: LogLike, now: Date, hours: number) => {
   return start <= now.getTime() && now.getTime() - start <= hours * HOUR_MS;
 };

-function temperatureAlert(
+// The reading the temperature banner speaks of: the newest valid one of the
+// last 6 hours. Spec 2026-11-26 §5.5 hangs the invite to start an illness
+// episode on this same reading.
+export function bannerReading(
   logs: LogLike[],
-  ageDays: number,
-  triageAvailable: boolean,
   now: Date,
-): HomeAlert | null {
+): { at: number; celsius: number } | null {
   let latest: { at: number; celsius: number } | null = null;
   for (const log of logs) {
     if (log.type !== "temperature" || !within(log, now, 6)) continue;
@@ -32,6 +33,16 @@ function temperatureAlert(
     if (!latest || at > latest.at)
       latest = { at, celsius: parsed.data.celsius };
   }
+  return latest;
+}
+
+function temperatureAlert(
+  logs: LogLike[],
+  ageDays: number,
+  triageAvailable: boolean,
+  now: Date,
+): HomeAlert | null {
+  const latest = bannerReading(logs, now);
   if (!latest) return null;
   const c = latest.celsius;
   if (c < 35.5)
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index 59b4915..c91952c 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -1,3 +1,4 @@
+import { bannerReading } from "./alerts";
 import { addDays, formatDayShort, vnDayStartMs } from "./days";
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
@@ -634,3 +635,73 @@ export function feverChartModel(
     ariaLabel,
   };
 }
+
+// Spec §5.5: the fever banners of the home page that carry the invite.
+const INVITE_ALERTS = ["fever", "fever-infant", "fever-high"];
+// A "not now" on this device holds for a day.
+const REST_MS = 24 * HOUR_MS;
+const LOOK_BACK_MS = 48 * HOUR_MS;
+
+// Is a "not now" given at `at` still in force? The tap is stamped with the
+// real time, which can be a moment after the page's clock, so a stamp a little
+// ahead of `now` holds too; one a day or more ahead (the clock was wrong when
+// it was written) does not.
+function resting(at: number | null, now: Date): boolean {
+  return at !== null && Math.abs(now.getTime() - at) < REST_MS;
+}
+
+// The latest end among the baby's episodes; -Infinity when none has ended.
+function latestEnd(episodes: EpisodeLike[]): number {
+  let latest = -Infinity;
+  for (const episode of episodes)
+    if (episode.ended_at)
+      latest = Math.max(latest, Date.parse(episode.ended_at));
+  return latest;
+}
+
+// Spec §5.5: the invite to start an episode. It shows when the baby has no
+// open episode, the home page has a fever banner, the reading behind that
+// banner was taken after the latest end of the baby's episodes (so the invite
+// does not come straight back after "Bé đã khỏi"), and "Không" was not
+// answered on this device in the last 24 hours. Returns the key of the banner
+// that carries the invite, or null.
+//   episodes     every episode of the baby (useEpisodes)
+//   alerts       what homeAlerts returned for the same logs and the same now
+//   logs         the recent logs (useRecentLogs)
+//   dismissedAt  when "Không" was last answered on this device, in ms; or null
+export function inviteAlert(input: {
+  episodes: EpisodeLike[];
+  alerts: { key: string }[];
+  logs: LogLike[];
+  dismissedAt: number | null;
+  now: Date;
+}): string | null {
+  const { episodes, alerts, logs, dismissedAt, now } = input;
+  if (episodes.some((episode) => episode.ended_at === null)) return null;
+  const alert = alerts.find((item) => INVITE_ALERTS.includes(item.key));
+  if (!alert) return null;
+  const reading = bannerReading(logs, now);
+  if (!reading || reading.at <= latestEnd(episodes)) return null;
+  if (resting(dismissedAt, now)) return null;
+  return alert.key;
+}
+
+// Spec §5.5 "Bắt đầu đợt ốm": the new episode starts at the earliest reading
+// from 38,0 of the last 48 hours, counting only readings after the latest end
+// of the baby's episodes; without such a reading it starts now.
+export function inviteStartedAt(
+  logs: LogLike[],
+  episodes: EpisodeLike[],
+  now: Date,
+): string {
+  const after = Math.max(latestEnd(episodes), now.getTime() - LOOK_BACK_MS - 1);
+  let earliest = now.getTime();
+  for (const log of logs) {
+    if (log.type !== "temperature") continue;
+    const at = Date.parse(log.started_at);
+    if (at <= after || at >= earliest) continue;
+    const parsed = detailsSchemas.temperature.safeParse(log.details);
+    if (parsed.success && hasFever(parsed.data.celsius)) earliest = at;
+  }
+  return new Date(earliest).toISOString();
+}
diff --git a/lib/rules/illnessForm.ts b/lib/rules/illnessForm.ts
index 3e393d7..d8df3dd 100644
--- a/lib/rules/illnessForm.ts
+++ b/lib/rules/illnessForm.ts
@@ -81,12 +81,13 @@ function refusal(input: Parameters<typeof checkEpisode>[0]): Refused | null {
   return message ? { ok: false, message } : null;
 }

-// "Bắt đầu đợt ốm": a new open episode that starts now.
+// "Bắt đầu đợt ốm": a new open episode. It starts now; from the invite on
+// Hôm nay it starts at the first fever reading (spec §5.5, inviteStartedAt).
 export function planStart(
   episodes: EpisodeLike[],
   now: Date,
+  startedAt: string = now.toISOString(),
 ): { ok: true; startedAt: string } | Refused {
-  const startedAt = now.toISOString();
   return (
     refusal({
       id: null,
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  201 passed (201)`, `Tests  1892 passed (1892)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/alerts.ts lib/rules/alerts.test.ts lib/rules/illness.ts lib/rules/illnessHome.test.ts lib/rules/illnessForm.ts lib/rules/illnessForm.test.ts
git commit -m "feat(illness): the rules of the invite to start an episode" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Nhắc đóng đợt ốm: luật (§5.6)

**Files:**

- Modify: `lib/rules/illness.ts` (thêm vào cuối file)
- Test: `lib/rules/illnessHome.test.ts`

**Interfaces:**

- Consumes: `feverStatus`, `symptomEntries`, `antipyreticTimes` (`lib/rules/illness.ts`, M2b); hàm nội bộ `resting(at, now)` của Task 1.
- Produces: `type CloseCase = "no-fever" | "unchecked" | "quiet"`; `closeReminder(input: { episode: EpisodeLike; logs: LogLike[]; snoozedAt: number | null; now: Date }): CloseCase | null` (`lib/rules/illness.ts`).

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/rules/illnessHome.test.ts b/lib/rules/illnessHome.test.ts
index 97f45e2..9b0f330 100644
--- a/lib/rules/illnessHome.test.ts
+++ b/lib/rules/illnessHome.test.ts
@@ -1,7 +1,12 @@
 import { describe, expect, it } from "vitest";
 import { type HomeAlert, homeAlerts } from "./alerts";
 import type { LogLike } from "./describeLog";
-import { type EpisodeLike, inviteAlert, inviteStartedAt } from "./illness";
+import {
+  closeReminder,
+  type EpisodeLike,
+  inviteAlert,
+  inviteStartedAt,
+} from "./illness";

 // Vietnam time, written the way a parent reads the clock.
 const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
@@ -25,6 +30,15 @@ const at = (type: string, time: string, details: unknown): LogLike => ({
 });
 const temp = (time: string, celsius: number) =>
   at("temperature", time, { celsius, method: "nach" });
+const dose = (time: string, antipyretic = true) =>
+  at("medicine", time, {
+    name: antipyretic ? "Hapacol" : "Vitamin D",
+    amount: 2.5,
+    unit: "ml",
+    antipyretic,
+  });
+const symptom = (time: string, codes: string[]) =>
+  at("symptom", time, { codes });

 // Spec §4.2: the rules may not lean on the order of the array. Every order of
 // `logs` must give the same answer.
@@ -205,3 +219,96 @@ describe("inviteStartedAt", () => {
     expect(startedAt([temp("2026-11-27 12:01", 38.6)])).toBe(NOW.toISOString());
   });
 });
+
+// Spec §5.6: the reminder to close an open episode. The answer is which of
+// the three cases it is, or null.
+describe("closeReminder", () => {
+  const open = episode("2026-11-22 08:00");
+  const reminder = (
+    logs: LogLike[],
+    over: { episode?: EpisodeLike; snoozedAt?: number | null; now?: Date } = {},
+  ) =>
+    sameForEveryOrder(logs, (ordered) =>
+      closeReminder({
+        episode: over.episode ?? open,
+        logs: ordered,
+        snoozedAt: over.snoozedAt ?? null,
+        now: over.now ?? NOW,
+      }),
+    );
+
+  it("no-fever: 48 hours since the last reading from 38,0, with a lower one after it", () => {
+    const logs = [
+      temp("2026-11-24 09:00", 39.1),
+      temp("2026-11-25 12:00", 38),
+      temp("2026-11-26 08:00", 37.2),
+      // Fever medicine and symptoms do not move this mark.
+      dose("2026-11-27 07:00"),
+      symptom("2026-11-27 07:00", ["cough"]),
+    ];
+    expect(reminder(logs)).toBe("no-fever");
+    expect(reminder(logs, { now: vn("2026-11-27 11:59") })).toBeNull();
+  });
+
+  it("unchecked: 48 hours since the newest reading, which is still from 38,0", () => {
+    const logs = [
+      temp("2026-11-24 09:00", 37.5),
+      temp("2026-11-25 12:00", 38.4),
+      dose("2026-11-27 07:00"),
+    ];
+    expect(reminder(logs)).toBe("unchecked");
+    expect(reminder(logs, { now: vn("2026-11-27 11:59") })).toBeNull();
+    // It never says the fever is over while the newest reading is a fever.
+    expect(reminder(logs, { now: vn("2026-12-05 12:00") })).toBe("unchecked");
+  });
+
+  it("quiet: no fever on record, and 48 hours since the start, the last symptom and the last fever medicine", () => {
+    // Nothing logged at all: the start is the mark.
+    expect(reminder([], { episode: episode("2026-11-25 12:00") })).toBe(
+      "quiet",
+    );
+    expect(reminder([], { episode: episode("2026-11-25 12:01") })).toBeNull();
+    // Readings under 38,0 do not move the mark.
+    const cool = [temp("2026-11-27 11:00", 37.1)];
+    expect(reminder(cool)).toBe("quiet");
+    expect(reminder([...cool, symptom("2026-11-25 12:00", ["cough"])])).toBe(
+      "quiet",
+    );
+    expect(
+      reminder([...cool, symptom("2026-11-25 12:01", ["cough"])]),
+    ).toBeNull();
+    expect(reminder([...cool, dose("2026-11-25 12:00")])).toBe("quiet");
+    expect(reminder([...cool, dose("2026-11-25 12:01")])).toBeNull();
+    // Medicine that is not for fever does not count.
+    expect(reminder([...cool, dose("2026-11-27 09:00", false)])).toBe("quiet");
+  });
+
+  it("only looks at logs of the episode", () => {
+    // A fever and a symptom from before the episode began.
+    expect(
+      reminder([
+        temp("2026-11-21 09:00", 39),
+        symptom("2026-11-21 09:00", ["cough"]),
+        temp("2026-11-23 09:00", 37),
+      ]),
+    ).toBe("quiet");
+  });
+
+  it("stays away for 24 hours after Chưa on this device", () => {
+    const logs = [temp("2026-11-24 09:00", 39.1), temp("2026-11-25 08:00", 37)];
+    const ago = (ms: number) => NOW.getTime() - ms;
+    expect(reminder(logs, { snoozedAt: ago(0) })).toBeNull();
+    expect(reminder(logs, { snoozedAt: ago(24 * HOUR - 1) })).toBeNull();
+    expect(reminder(logs, { snoozedAt: ago(24 * HOUR) })).toBe("no-fever");
+    expect(reminder(logs, { snoozedAt: ago(-900) })).toBeNull();
+    expect(reminder(logs, { snoozedAt: ago(-24 * HOUR) })).toBe("no-fever");
+  });
+
+  it("never shows for a closed episode", () => {
+    expect(
+      reminder([], {
+        episode: episode("2026-11-20 08:00", "2026-11-22 08:00"),
+      }),
+    ).toBeNull();
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 200 passed (201)`, `Tests  6 failed | 1892 passed (1898)`. Sáu test đỏ, đều của `closeReminder` trong `illnessHome.test.ts`.

- [x] **Step 3: Viết luật nhắc đóng (Patch 4)**

```diff
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index c91952c..0b0e8af 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -705,3 +705,47 @@ export function inviteStartedAt(
   }
   return new Date(earliest).toISOString();
 }
+
+// Spec §5.6: an open episode with nothing new for this long may be over.
+const CLOSE_AFTER_MS = 48 * HOUR_MS;
+
+export type CloseCase = "no-fever" | "unchecked" | "quiet";
+
+// Spec §5.6: the reminder to close an open episode. Each case has its own
+// last mark; the reminder shows once that mark is 48 hours old, unless
+// "Chưa" was answered on this device in the last 24 hours.
+//   no-fever   the fever is over (cleared): the last reading from 38,0
+//   unchecked  the newest reading is still from 38,0: that reading
+//   quiet      no fever on record: the latest of the start, the last symptom
+//              log and the last dose of fever medicine
+// So it never says the fever is over while the newest reading is a fever.
+//   logs       the logs of the episode (useRangeLogs)
+//   snoozedAt  when "Chưa" was last answered on this device, in ms; or null
+export function closeReminder(input: {
+  episode: EpisodeLike;
+  logs: LogLike[];
+  snoozedAt: number | null;
+  now: Date;
+}): CloseCase | null {
+  const { episode, logs, snoozedAt, now } = input;
+  if (episode.ended_at !== null) return null;
+  const { kind, latest, lastFever } = feverStatus(logs, episode, now);
+  let result: CloseCase;
+  let mark: number;
+  if (kind === "cleared" && lastFever) {
+    result = "no-fever";
+    mark = lastFever.at;
+  } else if ((kind === "fever" || kind === "stale") && latest) {
+    result = "unchecked";
+    mark = latest.at;
+  } else {
+    result = "quiet";
+    mark = Math.max(
+      Date.parse(episode.started_at),
+      symptomEntries(logs, episode, now).at(-1)?.at ?? -Infinity,
+      antipyreticTimes(logs, episode, now).at(-1) ?? -Infinity,
+    );
+  }
+  if (now.getTime() - mark < CLOSE_AFTER_MS) return null;
+  return resting(snoozedAt, now) ? null : result;
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  201 passed (201)`, `Tests  1898 passed (1898)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/illness.ts lib/rules/illnessHome.test.ts
git commit -m "feat(illness): the rule of the reminder to close an episode" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Chữ của thẻ đợt ốm và của lời nhắc trên Hôm nay (§7.1, §7.3)

**Files:**

- Modify: `lib/rules/illnessView.ts` (thêm vào cuối file)
- Test: `lib/rules/illnessView.test.ts`

**Interfaces:**

- Consumes: `feverStatus`, `episodeVerdict`, `episodeDayCount`, `formatCelsius`, `sinceText`, `type CloseCase`, `type EpisodeTone`, `type Verdict` (`lib/rules/illness.ts`); `CHIP_TEXT`, `episodeHref`, `dayOf`, `shortDay` có sẵn trong `lib/rules/illnessView.ts` (M2d).
- Produces (`lib/rules/illnessView.ts`):
  - `clockText(at: number, now: Date): string`: "{HH:mm}" khi cùng ngày, không thì "{dd/mm} {HH:mm}".
  - `type HomeEpisodeView = { href: string; title: string; sub: string | null }`; `homeEpisodeCard(input: { episode: EpisodeLike; logs: LogLike[] | undefined; now: Date }): HomeEpisodeView`. `sub` là `null` khi `logs` là `undefined`. Phần "{x}°C lúc {giờ}" của `sub` nối bằng dấu cách không ngắt (U+00A0).
  - `type CloseReminderView = { title: string; sub: string; tone: EpisodeTone; icon: Verdict["icon"] }`; `closeReminderView(input: { kind: CloseCase; episode: EpisodeLike; logs: LogLike[]; babyName: string; now: Date }): CloseReminderView`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/lib/rules/illnessView.test.ts b/lib/rules/illnessView.test.ts
index 850f727..21d9f45 100644
--- a/lib/rules/illnessView.test.ts
+++ b/lib/rules/illnessView.test.ts
@@ -2,9 +2,12 @@ import { describe, expect, it } from "vitest";
 import type { LogLike } from "./describeLog";
 import type { EpisodeLike } from "./illness";
 import {
+  clockText,
+  closeReminderView,
   dayRows,
   episodeHref,
   episodeList,
+  homeEpisodeCard,
   verdictView,
   whenText,
 } from "./illnessView";
@@ -257,3 +260,110 @@ describe("episodeList", () => {
     );
   });
 });
+
+// Spec 2026-11-26 §7.1: {giờ} on the home card.
+describe("clockText", () => {
+  const now = vn("2026-11-26 10:00");
+
+  it("is the time alone for a time today, with the date otherwise", () => {
+    expect(clockText(vn("2026-11-26 07:05").getTime(), now)).toBe("07:05");
+    expect(clockText(vn("2026-11-25 23:59").getTime(), now)).toBe(
+      "25/11 23:59",
+    );
+  });
+});
+
+// Spec §7.1: the episode card of the home page.
+describe("homeEpisodeCard", () => {
+  const open = episode("2026-11-24 23:30", null, "ab-12");
+  const now = vn("2026-11-26 10:00");
+  const card = (logs: LogLike[] | undefined, at = now) =>
+    homeEpisodeCard({ episode: open, logs, now: at });
+
+  it("leads to the episode's page and names the day it is on", () => {
+    expect(card([])).toEqual({
+      href: "/dot-om/chi-tiet?id=ab-12",
+      title: "Đang ốm · ngày 3",
+      sub: "Chưa đo nhiệt độ",
+    });
+    expect(card([], vn("2026-11-24 23:45")).title).toBe("Đang ốm · ngày 1");
+  });
+
+  // The reading after "·" has no plain space: the line never breaks inside it.
+  const nb = (text: string) => text.replaceAll(" ", "\u00a0");
+
+  it("the line under the title follows the fever state, with the newest reading", () => {
+    expect(card([temp("2026-11-26 07:05", 38.6)]).sub).toBe(
+      `Đang sốt · ${nb("38,6°C lúc 07:05")}`,
+    );
+    // More than 6 hours old, and taken yesterday.
+    expect(card([temp("2026-11-25 21:10", 38)]).sub).toBe(
+      `Chưa đo lại · ${nb("38°C lúc 25/11 21:10")}`,
+    );
+    expect(
+      card([temp("2026-11-25 15:00", 39.2), temp("2026-11-26 07:05", 37.4)])
+        .sub,
+    ).toBe(`Hết sốt 19 giờ · ${nb("37,4°C lúc 07:05")}`);
+    expect(
+      card([temp("2026-11-26 09:10", 38.2), temp("2026-11-26 09:50", 37.4)])
+        .sub,
+    ).toBe(`Hết sốt chưa đầy 1 giờ · ${nb("37,4°C lúc 09:50")}`);
+    expect(card([temp("2026-11-26 07:05", 37.4)]).sub).toBe(
+      `Không sốt · ${nb("37,4°C lúc 07:05")}`,
+    );
+  });
+
+  it("has no line under the title until the episode's logs have loaded", () => {
+    expect(card(undefined)).toEqual({
+      href: "/dot-om/chi-tiet?id=ab-12",
+      title: "Đang ốm · ngày 3",
+      sub: null,
+    });
+  });
+});
+
+// Spec §7.3: the reminder to close the episode.
+describe("closeReminderView", () => {
+  const open = episode("2026-11-24 23:30");
+  const now = vn("2026-11-29 10:00");
+  const SUB =
+    "Đợt ốm bắt đầu 24/11 xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa.";
+  const view = (kind: "no-fever" | "unchecked" | "quiet", logs: LogLike[]) =>
+    closeReminderView({ kind, episode: open, logs, babyName: "Bun", now });
+
+  it("no-fever: names the baby; the icon and tone of a fever that is over", () => {
+    expect(
+      view("no-fever", [
+        temp("2026-11-25 15:00", 39.2),
+        temp("2026-11-26 07:05", 37.4),
+      ]),
+    ).toEqual({
+      title: "Bun đã 48 giờ không sốt",
+      sub: SUB,
+      tone: "good",
+      icon: "check",
+    });
+  });
+
+  it("unchecked: a clock, because nobody measured again", () => {
+    expect(view("unchecked", [temp("2026-11-25 15:00", 39.2)])).toEqual({
+      title: "48 giờ qua chưa đo lại nhiệt độ",
+      sub: SUB,
+      tone: "warn",
+      icon: "clock",
+    });
+  });
+
+  it("quiet: the icon of the episode's state, measured or not", () => {
+    expect(view("quiet", [])).toEqual({
+      title: "48 giờ qua không có triệu chứng hay liều hạ sốt nào",
+      sub: SUB,
+      tone: "neutral",
+      icon: "thermo",
+    });
+    expect(view("quiet", [temp("2026-11-26 07:05", 37.4)])).toMatchObject({
+      tone: "good",
+      icon: "check",
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 200 passed (201)`, `Tests  7 failed | 1898 passed (1905)`. Bảy test đỏ trong `illnessView.test.ts`: một của `clockText`, ba của `homeEpisodeCard`, ba của `closeReminderView`.

- [x] **Step 3: Viết chữ của thẻ và lời nhắc (Patch 6)**

```diff
diff --git a/lib/rules/illnessView.ts b/lib/rules/illnessView.ts
index 1eb80a2..2e31ef5 100644
--- a/lib/rules/illnessView.ts
+++ b/lib/rules/illnessView.ts
@@ -3,6 +3,7 @@ import { formatDayFull, formatDayShort } from "./days";
 import type { LogLike } from "./describeLog";
 import {
   antipyreticTimes,
+  type CloseCase,
   type DayLabel,
   type EpisodeLike,
   episodeDayCount,
@@ -11,6 +12,7 @@ import {
   episodeVerdict,
   feverStatus,
   formatCelsius,
+  sinceText,
   statusTone,
   type Verdict,
 } from "./illness";
@@ -187,3 +189,80 @@ export function episodeList(input: {
       })),
   };
 }
+
+// Spec §7.1 {giờ}: "{HH:mm}" for a time today, "{dd/mm} {HH:mm}" otherwise.
+export function clockText(at: number, now: Date): string {
+  const time = formatVnTime(new Date(at));
+  return dayOf(at) === vnDateString(now) ? time : `${shortDay(at)} ${time}`;
+}
+
+export type HomeEpisodeView = {
+  href: string;
+  title: string;
+  // The fever state and the newest reading; null until the logs have loaded.
+  sub: string | null;
+};
+
+// Spec §7.1: the card of the open episode on the home page. `logs` are the
+// logs of that episode (useRangeLogs); undefined until they have loaded.
+export function homeEpisodeCard(input: {
+  episode: EpisodeLike;
+  logs: LogLike[] | undefined;
+  now: Date;
+}): HomeEpisodeView {
+  const { episode, logs, now } = input;
+  let sub: string | null = null;
+  if (logs) {
+    const { kind, latest, lastFever } = feverStatus(logs, episode, now);
+    if (kind === "unmeasured" || !latest) sub = "Chưa đo nhiệt độ";
+    else {
+      const state =
+        kind === "cleared" && lastFever
+          ? `${CHIP_TEXT.cleared} ${sinceText(now.getTime() - lastFever.at)}`
+          : CHIP_TEXT[kind];
+      // The reading stays whole: its spaces do not break, so a narrow
+      // card breaks the line after "·", never inside "25/11 23:59".
+      const reading = `${formatCelsius(latest.celsius)}°C lúc ${clockText(latest.at, now)}`;
+      sub = `${state} · ${reading.replaceAll(" ", "\u00a0")}`;
+    }
+  }
+  return {
+    href: episodeHref(episode.id),
+    title: `Đang ốm · ngày ${episodeDayCount(episode, now)}`,
+    sub,
+  };
+}
+
+const CLOSE_TITLE: Record<CloseCase, (babyName: string) => string> = {
+  "no-fever": (babyName) => `${babyName} đã 48 giờ không sốt`,
+  unchecked: () => "48 giờ qua chưa đo lại nhiệt độ",
+  quiet: () => "48 giờ qua không có triệu chứng hay liều hạ sốt nào",
+};
+
+export type CloseReminderView = {
+  title: string;
+  sub: string;
+  // The round icon: the one the verdict card shows for the episode's state.
+  tone: EpisodeTone;
+  icon: Verdict["icon"];
+};
+
+// Spec §7.3: the reminder to close the open episode. `kind` comes from
+// closeReminder; `logs` are the logs of the episode.
+export function closeReminderView(input: {
+  kind: CloseCase;
+  episode: EpisodeLike;
+  logs: LogLike[];
+  babyName: string;
+  now: Date;
+}): CloseReminderView {
+  const { kind, episode, logs, babyName, now } = input;
+  const status = feverStatus(logs, episode, now);
+  const { tone, icon } = episodeVerdict({ episode, status, babyName, now });
+  return {
+    title: CLOSE_TITLE[kind](babyName),
+    sub: `Đợt ốm bắt đầu ${shortDay(Date.parse(episode.started_at))} xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa.`,
+    tone,
+    icon,
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  201 passed (201)`, `Tests  1905 passed (1905)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/illnessView.ts lib/rules/illnessView.test.ts
git commit -m "feat(illness): the words of the episode on Hôm nay" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Giờ "không, để sau" lưu trên máy (§5.5, §5.6)

**Files:**

- Create: `lib/data/storedTime.ts`, `lib/hooks/useStoredTime.ts`
- Test: `lib/data/storedTime.test.ts` (mới), `lib/hooks/useStoredTime.test.ts` (mới)

**Interfaces:**

- Consumes: `window.localStorage` (cách bắt lỗi như `lib/hooks/useYouTubeOpener.ts`: chế độ riêng tư hay bộ nhớ bị chặn thì không lưu, không ném lỗi).
- Produces:
  - `lib/data/storedTime.ts`: `type TimeStore = Pick<Storage, "getItem" | "setItem">`; `inviteDismissKey(babyId: string): string` = `"kb.illness.inviteDismissedAt.{babyId}"`; `closeSnoozeKey(episodeId: string): string` = `"kb.illness.closeSnoozedAt.{episodeId}"`; `deviceStore(): TimeStore | null`; `readStoredTime(store: TimeStore | null, key: string): number | null`; `writeStoredTime(store: TimeStore | null, key: string, at: Date): void`. Giá trị lưu là chuỗi ISO.
  - `lib/hooks/useStoredTime.ts`: `useStoredTime(key: string | null): { at: number | null | undefined; mark: (now: Date) => void }`. `at` là `undefined` ở lần vẽ đầu (và ngay sau khi `key` đổi), vì `localStorage` chỉ đọc được trong `useEffect`; M3b không hiện lời mời hay lời nhắc khi `at` còn `undefined`.

- [x] **Step 1: Viết test đỏ (Patch 7)**

```diff
diff --git a/lib/data/storedTime.test.ts b/lib/data/storedTime.test.ts
new file mode 100644
index 0000000..728aae1
--- /dev/null
+++ b/lib/data/storedTime.test.ts
@@ -0,0 +1,62 @@
+import { describe, expect, it } from "vitest";
+import {
+  closeSnoozeKey,
+  deviceStore,
+  inviteDismissKey,
+  readStoredTime,
+  type TimeStore,
+  writeStoredTime,
+} from "./storedTime";
+
+function memory(initial: Record<string, string> = {}) {
+  const items = new Map(Object.entries(initial));
+  const store: TimeStore = {
+    getItem: (key) => items.get(key) ?? null,
+    setItem: (key, value) => void items.set(key, value),
+  };
+  return { items, store };
+}
+const blocked: TimeStore = {
+  getItem: () => {
+    throw new Error("blocked");
+  },
+  setItem: () => {
+    throw new Error("blocked");
+  },
+};
+
+// Spec 2026-11-26 §5.5 and §5.6.
+describe("stored time", () => {
+  it("keeps the invite's answer per baby and the reminder's per episode", () => {
+    expect(inviteDismissKey("b1")).toBe("kb.illness.inviteDismissedAt.b1");
+    expect(closeSnoozeKey("e1")).toBe("kb.illness.closeSnoozedAt.e1");
+  });
+
+  it("reads back the moment that was written", () => {
+    const { items, store } = memory();
+    const at = new Date("2026-11-27T05:00:00.000Z");
+    writeStoredTime(store, "k", at);
+    expect(items.get("k")).toBe("2026-11-27T05:00:00.000Z");
+    expect(readStoredTime(store, "k")).toBe(at.getTime());
+  });
+
+  it("reads null when nothing is kept, or what is kept is not a time", () => {
+    expect(readStoredTime(memory().store, "k")).toBeNull();
+    expect(readStoredTime(memory({ k: "" }).store, "k")).toBeNull();
+    expect(readStoredTime(memory({ k: "hôm qua" }).store, "k")).toBeNull();
+    expect(readStoredTime(memory({ other: "2026-11-27" }).store, "k")).toBe(
+      null,
+    );
+  });
+
+  it("storage that is missing or blocked reads null and takes a write quietly", () => {
+    expect(readStoredTime(null, "k")).toBeNull();
+    expect(readStoredTime(blocked, "k")).toBeNull();
+    expect(() => writeStoredTime(null, "k", new Date())).not.toThrow();
+    expect(() => writeStoredTime(blocked, "k", new Date())).not.toThrow();
+  });
+
+  it("there is no device storage outside a browser", () => {
+    expect(deviceStore()).toBeNull();
+  });
+});
diff --git a/lib/hooks/useStoredTime.test.ts b/lib/hooks/useStoredTime.test.ts
new file mode 100644
index 0000000..b20ffc3
--- /dev/null
+++ b/lib/hooks/useStoredTime.test.ts
@@ -0,0 +1,20 @@
+import { createElement } from "react";
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import { useStoredTime } from "./useStoredTime";
+
+function Probe({ storageKey }: { storageKey: string | null }) {
+  const { at } = useStoredTime(storageKey);
+  return createElement("p", null, at === undefined ? "not read yet" : "read");
+}
+
+describe("useStoredTime", () => {
+  // The callers show nothing that depends on the answer until it has been
+  // read, so an invite that was turned down does not flash on the first paint.
+  it("does not know the time on the first render", () => {
+    for (const storageKey of ["kb.illness.inviteDismissedAt.b1", null])
+      expect(renderToStaticMarkup(createElement(Probe, { storageKey }))).toBe(
+        "<p>not read yet</p>",
+      );
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 201 passed (203)`, `Tests  1905 passed (1905)`. Hai file test mới không nạp được (chưa có hai module), nên số test không đổi.

- [x] **Step 3: Viết phần lưu trên máy (Patch 8)**

```diff
diff --git a/lib/data/storedTime.ts b/lib/data/storedTime.ts
new file mode 100644
index 0000000..3ff3ab0
--- /dev/null
+++ b/lib/data/storedTime.ts
@@ -0,0 +1,49 @@
+// Spec 2026-11-26 §5.5 and §5.6: the time of a "not now", kept on this device
+// only. Another phone of the family still gets the invite or the reminder.
+export type TimeStore = Pick<Storage, "getItem" | "setItem">;
+
+// "Không" on the invite to start an episode: one answer per baby.
+export function inviteDismissKey(babyId: string): string {
+  return `kb.illness.inviteDismissedAt.${babyId}`;
+}
+
+// "Chưa" on the reminder to close an episode: one answer per episode.
+export function closeSnoozeKey(episodeId: string): string {
+  return `kb.illness.closeSnoozedAt.${episodeId}`;
+}
+
+// The browser's storage; null where there is none or it may not be used
+// (private mode, blocked storage, a render outside the browser).
+export function deviceStore(): TimeStore | null {
+  try {
+    return window.localStorage;
+  } catch {
+    return null;
+  }
+}
+
+// The time kept under `key`, in ms; null when nothing is kept, it cannot be
+// read, or it is not a time.
+export function readStoredTime(
+  store: TimeStore | null,
+  key: string,
+): number | null {
+  try {
+    const at = Date.parse(store?.getItem(key) ?? "");
+    return Number.isNaN(at) ? null : at;
+  } catch {
+    return null;
+  }
+}
+
+export function writeStoredTime(
+  store: TimeStore | null,
+  key: string,
+  at: Date,
+): void {
+  try {
+    store?.setItem(key, at.toISOString());
+  } catch {
+    // Not kept. The caller still holds the time until the page is closed.
+  }
+}
diff --git a/lib/hooks/useStoredTime.ts b/lib/hooks/useStoredTime.ts
new file mode 100644
index 0000000..804d412
--- /dev/null
+++ b/lib/hooks/useStoredTime.ts
@@ -0,0 +1,39 @@
+"use client";
+
+import { useEffect, useState } from "react";
+import {
+  deviceStore,
+  readStoredTime,
+  writeStoredTime,
+} from "@/lib/data/storedTime";
+
+// A time kept on this device under `key` (lib/data/storedTime.ts).
+//   at    undefined until the storage has been read (the first render, and
+//         the render right after `key` changed), then the time in ms, or null
+//         when none is kept. With `key` null there is nothing to keep: null.
+//   mark  keeps `now` under the key and reports it at once.
+export function useStoredTime(key: string | null): {
+  at: number | null | undefined;
+  mark: (now: Date) => void;
+} {
+  const [read, setRead] = useState<{
+    key: string | null;
+    at: number | null;
+  } | null>(null);
+
+  useEffect(() => {
+    setRead({
+      key,
+      at: key === null ? null : readStoredTime(deviceStore(), key),
+    });
+  }, [key]);
+
+  function mark(now: Date) {
+    if (key === null) return;
+    writeStoredTime(deviceStore(), key, now);
+    setRead({ key, at: now.getTime() });
+  }
+
+  // A value read for another key is not this key's.
+  return { at: read && read.key === key ? read.at : undefined, mark };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  203 passed (203)`, `Tests  1911 passed (1911)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/data/storedTime.ts lib/data/storedTime.test.ts lib/hooks/useStoredTime.ts lib/hooks/useStoredTime.test.ts
git commit -m "feat(illness): the time of a not-now, kept on the device" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 5: Kiểm cuối M3a, rồi đưa lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M3a. Người dùng chưa thấy gì mới: các hàm này chỉ được dùng từ M3b.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  203 passed (203)`, `Tests  1911 passed (1911)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages (42/42)` và thoát mã 0.

Plan này không có bước trình duyệt: không component nào được thêm hay đổi.

- [x] **Step 3: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1 và Step 2. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này hiện là untracked (??); các file plan khác chưa chạy cũng vậy, không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3a.md
git commit -m "docs(plan): the M3a plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

**Kết quả (2026-11-27, nhánh `feat/kim-bun-dot-om-m3a` cắt từ `main` @ `8f6714e`):**

Mọi con số đo thật đều khớp plan, không lệch test nào. Tám patch áp sạch (`git apply --verbose`). Không lỗi nào lộ ra, không có bản sửa.

- **Task 1 Step 0:** dòng `M2 có trên main`; nền `Test Files  200 passed (200)`, `Tests  1880 passed (1880)`. Khớp plan.
- **Task 1 Step 2 (đỏ):** `Test Files  3 failed | 198 passed (201)`, `Tests  12 failed | 1880 passed (1892)`; chín test của `illnessHome.test.ts`, hai của `bannerReading`, một của `planStart`. Khớp plan.
- **Task 1 Step 4 (xanh):** 201 file / 1892 test; `tsc --noEmit` thoát 0. Commit `0c78015`.
- **Task 2 Step 2 (đỏ):** `Test Files  1 failed | 200 passed (201)`, `Tests  6 failed | 1892 passed (1898)`; sáu test của `closeReminder`. Khớp plan.
- **Task 2 Step 4 (xanh):** 201 file / 1898 test; `tsc` thoát 0. Commit `c822166`.
- **Task 3 Step 2 (đỏ):** `Test Files  1 failed | 200 passed (201)`, `Tests  7 failed | 1898 passed (1905)`; một của `clockText`, ba của `homeEpisodeCard`, ba của `closeReminderView`. Khớp plan.
- **Task 3 Step 4 (xanh):** 201 file / 1905 test; `tsc` thoát 0. Commit `7bb729e`.
- **Task 4 Step 2 (đỏ):** `Test Files  2 failed | 201 passed (203)`, `Tests  1905 passed (1905)`; hai file mới báo `Cannot find module './storedTime'` và `'./useStoredTime'`. Khớp plan.
- **Task 4 Step 4 (xanh):** 203 file / 1911 test; `tsc` thoát 0. Commit `c208aa3`.
- **Task 5 Step 1:** `tsc --noEmit` thoát 0; `Test Files  203 passed (203)`, `Tests  1911 passed (1911)`. Khớp plan.
- **Task 5 Step 2:** `bun run build` lần đầu thoát 1 (thông báo bảo mật của Next.js 16.4.3; không chạy `next upgrade`), lần hai thoát 0: `✓ Compiled successfully`, `✓ Generating static pages using 9 workers (42/42)`.
- **Trình duyệt:** plan không có bước này (không component nào đổi); không dựng trang fixture, không mở server dev. Chưa kiểm trên màn hình: mọi hàm của M3a chỉ hiện ra từ M3b.
- **Commit:** bốn commit code mang dòng `Co-Authored-By: Claude Opus 5.5`, model của phiên thực thi (Ghi chú khi thực thi). Plan M3b được commit nguyên trạng ở một commit docs riêng, để cây sạch.
- **Step 4:** chạy ngay sau commit này: `git merge --ff-only` vào `main`, đẩy `origin/main`, xóa nhánh.

- [x] **Step 4: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m3a
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
