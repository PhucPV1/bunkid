# Kim Bun — Đợt ốm M2b: luật của đợt ốm Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§4.3; §5.1; §5.2; §5.3; §5.7; điều kiện của nút "Mở lại đợt ốm" ở §6.4; khoảng tải bản ghi của §6.3; phần `lib/rules/illness.ts` của §10.1 trừ §5.4, §5.5, §5.6 và `feverChartModel`)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Mọi luật của một đợt ốm mà màn hình cần: ngày thứ mấy, bản ghi nào thuộc đợt, bé còn sốt không, nhãn của từng ngày, và các kiểm trước khi lưu. Chưa có gì mới trên màn hình.

**Architecture:**

- **Một file luật thuần** `lib/rules/illness.ts`, không nhập gì của React hay Supabase, có test đi kèm.
- **Mọi hàm nhận mảng bản ghi kiểu `LogLike`** (kiểu sẵn có của `describeLog`), tự lọc theo đợt và tự xếp theo giờ.
- **Chữ của §5.2 và §5.7 nằm ngay trong luật** (tiêu đề thẻ kết luận, các câu lỗi), vì spec định nghĩa chúng cùng với điều kiện.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** TypeScript 5.9.3 `strict`, Zod (qua `detailsSchemas` sẵn có), Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m2b`, cắt từ `main` sau khi M2a đã lên. Baseline: 1721 test vitest xanh (190 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc | Nội dung                                                                                                                                   | Plan                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| M1a | §3.1, §3.2, phần luật của §3.3 và §3.4: loại bản ghi `symptom`                                                                             | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md` (đã ở `main`) |
| M1b | phần còn lại của §3: phiếu Triệu chứng                                                                                                     | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1b.md` (đã ở `main`) |
| M2a | §4.1 và §4.2 trừ phần đọc bản ghi theo khoảng: bảng `illness_episodes`, pgTAP 017, outbox, `useEpisodes`. Chưa có gì hiện ra màn hình.     | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md`               |
| M2b | §4.3, §5.1–5.3, §5.7: luật thuần trong `lib/rules/illness.ts`. Chưa có gì hiện ra màn hình.                                                | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2b.md`               |
| M2c | §6.5: mô hình và hình vẽ biểu đồ sốt. Chỉ thấy trên trang tạm.                                                                             | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2c.md`               |
| M2d | chữ của §6.2 và §6.3; thẻ kết luận, ba nút ghi nhanh, danh sách từng ngày; `EmptyState` có dòng phụ và đường dẫn. Chỉ thấy trên trang tạm. | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2d.md`               |
| M2e | phần còn lại của §4.2 (`useRangeLogs`) và §6.4: luật và phiếu "Sửa đợt ốm". Chỉ thấy trên trang tạm.                                       | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2e.md`               |
| M2f | §6.1–6.3: trang `/dot-om` và `/dot-om/chi-tiet`. Mở được bằng địa chỉ, chưa có lối vào.                                                    | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2f.md`               |
| M2g | lối vào: dòng "Đợt ốm" ở Sức khỏe, hai trang trong service worker, Bước 38 của checklist                                                   | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2g.md`               |
| M3  | §5.5, §5.6, §7: tab Hôm nay                                                                                                                | chưa viết                                                             |
| M4  | §5.4, §9: so sánh và Báo cáo                                                                                                               | chưa viết                                                             |
| M5  | §8: lần khám                                                                                                                               | chưa viết                                                             |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Các luật không tin vào mảng bản ghi.** Mảng có thể xếp theo bất kỳ thứ tự nào (§4.2) và có thể lẫn bản ghi ngoài đợt: trang chi tiết tải dư tám ngày phía trước, và ghi lạc quan thêm bản ghi mới vào mọi danh sách đang giữ. Mọi hàm tự lọc theo đợt (§4.3) và tự xếp theo `started_at`.
2. **Bản ghi thuộc đợt tính cả hai đầu mút** (§4.3: ≥ `started_at` và ≤ `ended_at`).
3. **Với đợt đang mở, "≤ lúc này" của §4.3 được nới thêm 2 phút.** Đồng hồ của màn hình (`useNow`) chỉ nhích mỗi phút, nên một lần đo vừa lưu mang giờ mới hơn đồng hồ đó; so sát chữ thì nó bị coi là "sau lúc này" và thẻ không đổi cho tới phút sau. App cũng cho ghi một bản ghi sớm hơn giờ thật tối đa 1 phút. Vì không bản ghi nào mang giờ xa hơn thế, nới 2 phút không nhận nhầm bản ghi nào. Đợt đã đóng vẫn dừng đúng ở `ended_at`.
4. **Hai lần đo cùng một thời điểm:** lần cao hơn xếp sau, tức được coi là mới hơn. Spec không nói; chọn vậy để kết quả không phụ thuộc thứ tự mảng và nghiêng về phía "còn sốt".
5. **Hai lần đo cao nhất bằng nhau:** lần sau là "cao nhất" (`peak`).
6. **Số nhiệt độ viết như trang Báo cáo:** `Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 })`, tức "38,6" và "38" (không viết "38,0"). Global Constraints: dấu phẩy, tối đa 1 chữ số lẻ.
7. **Lần đo mới nhất dưới 35,5** ở `none` và `cleared`: tông trung tính, icon `thermo`, tiêu đề giữ nguyên (§5.2).
8. **Đợt đã đóng:** `feverStatus` vẫn trả `kind` theo các lần đo của đợt, nhưng `episodeVerdict` luôn trả "Đã khỏi sau {n} ngày".
9. **Từng ngày:** mọi ngày lịch từ ngày bắt đầu tới ngày cuối đều có một hàng, kể cả ngày không có bản ghi nào. Ngày đầu và ngày cuối chỉ tính các bản ghi thuộc đợt. `codes` của một ngày xếp theo mã; màn hình (M2d) xếp lại theo thứ tự của nội dung.
10. **"Hết sốt" cần một _ngày trước đó_ có lần đo từ 38,0.** Sốt rồi hạ trong cùng một ngày thì ngày đó vẫn mang nhãn theo lần đo cao nhất của nó.
11. **Lỗi trùng thời gian nằm dưới ô nào (§5.7, §6.4):** dưới "Bắt đầu" khi đợt đang mở (không có ô "Kết thúc") hoặc khi chính giờ bắt đầu rơi vào đợt khác; còn lại dưới "Kết thúc". Mỗi ô một câu; lỗi về giờ đứng trước lỗi trùng.
12. **`episodeError`** là câu cho Toast của các thao tác một chạm: lỗi của giờ bắt đầu trước, rồi tới giờ kết thúc.
13. **Không có bước trình duyệt.** Plan này không đổi gì trên màn hình.

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
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 8 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ commit cuối của M2a trong bản chạy thử. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. `bun run build` đã chạy xanh một lần trên bản sao có đủ cả bảy plan của M2, chưa chạy riêng cho plan này.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Người dùng muốn màn hình gọn, ít số.** Không thêm chữ nào ngoài plan.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm màu, token hay icon. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bấm "Bắt đầu đợt ốm", "Bé đã khỏi", "Mở lại đợt ốm", "Xóa đợt ốm", không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `content/triage.vi.json` và `docs/device-checklist.md`.** Hai file đó từ trước đã không theo prettier.
- **Các file plan của M2 chưa được commit.** `git status` sẽ thấy các file `…-dot-om-m2a.md` đến `…-m2g.md` chưa chạy là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng sau M2a nhưng không dùng gì của nó. M2c (biểu đồ), M2d (chữ của màn hình), M2e (phiếu sửa), M3 (tab Hôm nay) và M4 (so sánh, Báo cáo) dùng các luật dưới mục Produces.

**Consumes (đã ở `main`):** `LogLike` (`lib/rules/describeLog.ts`, `{ type: string; started_at: string; ended_at: string | null; details: unknown }`); `detailsSchemas` (`lib/rules/logDetails.ts`); `hasFever` (`lib/rules/triage.ts`); `addDays`, `vnDayStartMs` (`lib/rules/days.ts`); `vnDateString` (`lib/rules/time.ts`).

**Produces (`lib/rules/illness.ts`):**

- `type EpisodeLike = { id: string; started_at: string; ended_at: string | null }` (`EpisodeRow` của M2a khớp kiểu này)
- `episodeDay(startedAt: string, at: Date): number`
- `episodeDayCount(episode: EpisodeLike, now: Date): number`
- `belongsTo(episode: EpisodeLike, startedAt: string, now: Date): boolean` (đợt đang mở: tới `now` cộng 2 phút, nên `now` được phép chậm tới một phút so với giờ thật)
- `type Reading = { at: number; celsius: number }`; `episodeReadings(logs: LogLike[], episode: EpisodeLike, now: Date): Reading[]`
- `antipyreticTimes(logs: LogLike[], episode: EpisodeLike, now: Date): number[]`
- `type SymptomEntry = { at: number; codes: string[] }`; `symptomEntries(logs: LogLike[], episode: EpisodeLike, now: Date): SymptomEntry[]`
- `formatCelsius(celsius: number): string`
- `detailRange(episode: EpisodeLike): { from: string; to: string | null }`
- `type FeverKind`, `type FeverStatus`, `feverStatus(logs: LogLike[], episode: EpisodeLike, now: Date): FeverStatus`
- `sinceText(ms: number): string`
- `type EpisodeTone`, `statusTone(status: FeverStatus): EpisodeTone`
- `type Verdict`, `episodeVerdict(input: { episode: EpisodeLike; status: FeverStatus; babyName: string; now: Date }): Verdict`
- `type DayLabel`, `type EpisodeDayRow`, `episodeDays(logs: LogLike[], episode: EpisodeLike, now: Date): EpisodeDayRow[]`
- `type EpisodeErrors`, `checkEpisode(input: { id: string | null; started_at: string; ended_at: string | null; episodes: EpisodeLike[]; now: Date }): EpisodeErrors`
- `episodeError(errors: EpisodeErrors): string | null`
- `canReopen(episode: EpisodeLike, episodes: EpisodeLike[]): boolean`
- **Vitest sau M2b:** 1772 test, 191 file.

---

### Task 1: Ngày của đợt, bản ghi thuộc đợt, lần đo (§4.3, §5.1)

**Files:**

- Create: `lib/rules/illness.ts`
- Test: `lib/rules/illness.test.ts` (mới)

**Interfaces:**

- Consumes: `LogLike` (`lib/rules/describeLog.ts`); `detailsSchemas` (`lib/rules/logDetails.ts`); `addDays`, `vnDayStartMs` (`lib/rules/days.ts`); `vnDateString` (`lib/rules/time.ts`).
- Produces:
  - `type EpisodeLike = { id: string; started_at: string; ended_at: string | null }`
  - `episodeDay(startedAt: string, at: Date): number`
  - `episodeDayCount(episode: EpisodeLike, now: Date): number`
  - `belongsTo(episode: EpisodeLike, startedAt: string, now: Date): boolean`
  - `type Reading = { at: number; celsius: number }`; `episodeReadings(logs: LogLike[], episode: EpisodeLike, now: Date): Reading[]` (cũ trước)
  - `antipyreticTimes(logs: LogLike[], episode: EpisodeLike, now: Date): number[]` (cũ trước)
  - `type SymptomEntry = { at: number; codes: string[] }`; `symptomEntries(logs: LogLike[], episode: EpisodeLike, now: Date): SymptomEntry[]`
  - `formatCelsius(celsius: number): string`
  - `detailRange(episode: EpisodeLike): { from: string; to: string | null }`

- [ ] **Step 0: Kiểm M2a đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f lib/data/illness.ts && test -f supabase/migrations/20261126000200_illness_episodes.sql && echo "M2a có trên main"
git checkout -b feat/kim-bun-dot-om-m2b
bunx vitest run
```

Expected: dòng `M2a có trên main`; `Test Files  190 passed (190)`, `Tests  1721 passed (1721)`. Không thấy dòng đó thì dừng: M2a chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật: mọi con số trong plan lệch đi đúng bằng chừng đó.

- [ ] **Step 1: Viết test đỏ (Patch 1)**

Hàm `sameForEveryOrder` trong file test chạy một luật với mảng bản ghi xếp tăng dần, giảm dần và xáo trộn, rồi đòi ba kết quả giống nhau (spec §4.2 và §10.1). Các task sau dùng lại nó.

```diff
diff --git a/lib/rules/illness.test.ts b/lib/rules/illness.test.ts
new file mode 100644
index 0000000..dc32a23
--- /dev/null
+++ b/lib/rules/illness.test.ts
@@ -0,0 +1,228 @@
+import { describe, expect, it } from "vitest";
+import type { LogLike } from "./describeLog";
+import {
+  antipyreticTimes,
+  belongsTo,
+  detailRange,
+  type EpisodeLike,
+  episodeDay,
+  episodeDayCount,
+  episodeReadings,
+  formatCelsius,
+  symptomEntries,
+} from "./illness";
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
+const dose = (time: string, antipyretic = true) =>
+  at("medicine", time, {
+    name: antipyretic ? "Hapacol" : "Vitamin D",
+    amount: 2.5,
+    unit: "ml",
+    antipyretic,
+  });
+const symptom = (time: string, codes: string[]) =>
+  at("symptom", time, { codes });
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
+// Spec 2026-11-26 §5.1.
+describe("episodeDay", () => {
+  it("counts Vietnam calendar days from the day the episode started", () => {
+    const start = iso("2026-11-24 23:30");
+    expect(episodeDay(start, vn("2026-11-24 23:59"))).toBe(1);
+    // Half an hour later it is the next calendar day in Vietnam.
+    expect(episodeDay(start, vn("2026-11-25 00:00"))).toBe(2);
+    expect(episodeDay(start, vn("2026-11-25 23:59"))).toBe(2);
+    expect(episodeDay(start, vn("2026-11-27 08:00"))).toBe(4);
+  });
+
+  it("follows the Vietnam day, not the UTC day", () => {
+    // 06:00 in Vietnam is still the previous day in UTC.
+    const start = iso("2026-11-25 06:00");
+    expect(start.slice(0, 10)).toBe("2026-11-24");
+    expect(episodeDay(start, vn("2026-11-25 06:30"))).toBe(1);
+    expect(episodeDay(start, vn("2026-11-26 01:00"))).toBe(2);
+  });
+
+  it("crosses a month and a year", () => {
+    expect(episodeDay(iso("2026-12-30 10:00"), vn("2027-01-02 09:00"))).toBe(4);
+  });
+});
+
+describe("episodeDayCount", () => {
+  it("an open episode is on today's day; a closed one has the day of its end", () => {
+    const now = vn("2026-11-27 08:00");
+    expect(episodeDayCount(episode("2026-11-24 23:30"), now)).toBe(4);
+    expect(
+      episodeDayCount(episode("2026-11-24 23:30", "2026-11-26 07:00"), now),
+    ).toBe(3);
+    expect(
+      episodeDayCount(episode("2026-11-24 09:00", "2026-11-24 21:00"), now),
+    ).toBe(1);
+  });
+});
+
+// Spec §4.3.
+describe("belongsTo", () => {
+  const now = vn("2026-11-27 08:00");
+
+  it("an open episode owns every log from its start up to now", () => {
+    const open = episode("2026-11-25 08:00");
+    expect(belongsTo(open, iso("2026-11-25 07:59"), now)).toBe(false);
+    expect(belongsTo(open, iso("2026-11-25 08:00"), now)).toBe(true);
+    expect(belongsTo(open, iso("2026-11-27 08:00"), now)).toBe(true);
+  });
+
+  // A screen's clock moves once a minute: a log saved 20 seconds after its
+  // last tick is dated after `now` and must still count at once.
+  it("an open episode also owns a log dated up to two minutes after now", () => {
+    const open = episode("2026-11-25 08:00");
+    const after = (ms: number) => new Date(now.getTime() + ms).toISOString();
+    expect(belongsTo(open, after(20_000), now)).toBe(true);
+    expect(belongsTo(open, after(120_000), now)).toBe(true);
+    expect(belongsTo(open, after(120_001), now)).toBe(false);
+  });
+
+  it("a closed episode owns its start and its end, nothing after", () => {
+    const closed = episode("2026-11-25 08:00", "2026-11-26 20:00");
+    expect(belongsTo(closed, iso("2026-11-26 20:00"), now)).toBe(true);
+    expect(belongsTo(closed, iso("2026-11-26 20:01"), now)).toBe(false);
+  });
+});
+
+describe("episodeReadings, antipyreticTimes, symptomEntries", () => {
+  const now = vn("2026-11-27 08:00");
+  const open = episode("2026-11-25 08:00");
+  const logs = [
+    temp("2026-11-25 07:00", 39.5), // before the episode
+    temp("2026-11-25 09:00", 38.6),
+    temp("2026-11-26 21:00", 37.4),
+    temp("2026-11-25 14:00", 39.2),
+    at("temperature", "2026-11-25 15:00", { celsius: 50, method: "nach" }), // not a valid reading
+    at("temperature", "2026-11-25 16:00", null),
+    dose("2026-11-25 09:10"),
+    dose("2026-11-25 07:10"), // before the episode
+    dose("2026-11-25 15:00", false), // not a fever medicine
+    dose("2026-11-26 03:00"),
+    symptom("2026-11-25 10:00", ["cough", "runny_nose"]),
+    symptom("2026-11-24 10:00", ["fever"]), // before the episode
+    at("symptom", "2026-11-25 11:00", { codes: [] }), // not valid
+    at("diaper", "2026-11-25 12:00", { wet: true, dirty: false }),
+  ];
+
+  it("readings: valid temperature logs of the episode, oldest first", () => {
+    const readings = sameForEveryOrder(logs, (list) =>
+      episodeReadings(list, open, now),
+    );
+    expect(readings).toEqual([
+      { at: vn("2026-11-25 09:00").getTime(), celsius: 38.6 },
+      { at: vn("2026-11-25 14:00").getTime(), celsius: 39.2 },
+      { at: vn("2026-11-26 21:00").getTime(), celsius: 37.4 },
+    ]);
+  });
+
+  it("two readings of the same minute: the higher one counts as the newer", () => {
+    const twice = [
+      temp("2026-11-25 09:00", 38.6),
+      temp("2026-11-25 09:00", 37.9),
+    ];
+    const readings = sameForEveryOrder(twice, (list) =>
+      episodeReadings(list, open, now),
+    );
+    expect(readings.map((r) => r.celsius)).toEqual([37.9, 38.6]);
+  });
+
+  it("doses: fever medicine of the episode only, oldest first", () => {
+    expect(
+      sameForEveryOrder(logs, (list) => antipyreticTimes(list, open, now)),
+    ).toEqual([
+      vn("2026-11-25 09:10").getTime(),
+      vn("2026-11-26 03:00").getTime(),
+    ]);
+  });
+
+  it("symptoms: valid symptom logs of the episode, oldest first", () => {
+    expect(
+      sameForEveryOrder(logs, (list) => symptomEntries(list, open, now)),
+    ).toEqual([
+      { at: vn("2026-11-25 10:00").getTime(), codes: ["cough", "runny_nose"] },
+    ]);
+  });
+
+  it("a closed episode stops counting at its end", () => {
+    const closed = episode("2026-11-25 08:00", "2026-11-25 20:00");
+    expect(episodeReadings(logs, closed, now).map((r) => r.celsius)).toEqual([
+      38.6, 39.2,
+    ]);
+    expect(antipyreticTimes(logs, closed, now)).toHaveLength(1);
+  });
+});
+
+describe("formatCelsius", () => {
+  it("writes a comma and at most one decimal", () => {
+    expect(formatCelsius(38.6)).toBe("38,6");
+    expect(formatCelsius(38)).toBe("38");
+    expect(formatCelsius(39.25)).toBe("39,3");
+    expect(formatCelsius(36.04)).toBe("36");
+  });
+});
+
+// Spec §6.3.
+describe("detailRange", () => {
+  it("open: from the start of the 8th day before the first day, no end", () => {
+    expect(detailRange(episode("2026-11-24 23:30"))).toEqual({
+      from: iso("2026-11-16 00:00"),
+      to: null,
+    });
+  });
+
+  it("closed: up to the start of the day after the last day", () => {
+    expect(
+      detailRange(episode("2026-11-24 23:30", "2026-11-26 07:00")),
+    ).toEqual({
+      from: iso("2026-11-16 00:00"),
+      to: iso("2026-11-27 00:00"),
+    });
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 190 passed (191)`, `Tests  1721 passed (1721)`. File test mới không nạp được vì `./illness` chưa có, nên 15 test của nó chưa được đếm.

- [ ] **Step 3: Viết các luật nền (Patch 2)**

```diff
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
new file mode 100644
index 0000000..367d56c
--- /dev/null
+++ b/lib/rules/illness.ts
@@ -0,0 +1,150 @@
+import { addDays, vnDayStartMs } from "./days";
+import type { LogLike } from "./describeLog";
+import { detailsSchemas } from "./logDetails";
+import { vnDateString } from "./time";
+
+const DAY_MS = 86_400_000;
+
+// Spec 2026-11-26 §4–§6: an illness episode is a stretch of time. Logs belong
+// to it by their time alone. Every rule here finds "newest", "last" and
+// "earliest" by started_at: the array of logs may come in any order (§4.2),
+// and it may hold logs from outside the episode.
+export type EpisodeLike = {
+  id: string;
+  started_at: string;
+  ended_at: string | null;
+};
+
+const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;
+
+// Spec §5.1: day n = Vietnam calendar days from the day of started_at to the
+// day of `at`, plus 1.
+export function episodeDay(startedAt: string, at: Date): number {
+  return (
+    dayNumber(vnDateString(at)) -
+    dayNumber(vnDateString(new Date(startedAt))) +
+    1
+  );
+}
+
+// The day an episode is on: today's for an open one; for a closed one the day
+// of its end, which is also how many days it lasted.
+export function episodeDayCount(episode: EpisodeLike, now: Date): number {
+  return episodeDay(
+    episode.started_at,
+    episode.ended_at ? new Date(episode.ended_at) : now,
+  );
+}
+
+// An open episode reaches a little past `now`. A screen's clock only moves
+// once a minute, so a log saved a moment ago is dated after it; and the app
+// itself lets a log be dated up to a minute ahead. Nothing can be logged
+// further ahead than that.
+const OPEN_SLACK_MS = 2 * 60_000;
+
+const endMs = (episode: EpisodeLike, now: Date) =>
+  episode.ended_at
+    ? Date.parse(episode.ended_at)
+    : now.getTime() + OPEN_SLACK_MS;
+
+// Spec §4.3: a log belongs to the episode when it starts from the episode's
+// start up to its end (an open episode: up to now, with the allowance
+// above), both ends included.
+export function belongsTo(
+  episode: EpisodeLike,
+  startedAt: string,
+  now: Date,
+): boolean {
+  const at = Date.parse(startedAt);
+  return at >= Date.parse(episode.started_at) && at <= endMs(episode, now);
+}
+
+export type Reading = { at: number; celsius: number };
+
+// Spec §5.2: a reading is a temperature log that passes the schema and
+// belongs to the episode. Oldest first; of two readings at the same moment
+// the higher one sorts last, so it counts as the newer.
+export function episodeReadings(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): Reading[] {
+  const readings: Reading[] = [];
+  for (const log of logs) {
+    if (log.type !== "temperature") continue;
+    if (!belongsTo(episode, log.started_at, now)) continue;
+    const parsed = detailsSchemas.temperature.safeParse(log.details);
+    if (parsed.success)
+      readings.push({
+        at: Date.parse(log.started_at),
+        celsius: parsed.data.celsius,
+      });
+  }
+  return readings.sort((a, b) => a.at - b.at || a.celsius - b.celsius);
+}
+
+// Times of the fever medicine given during the episode, oldest first.
+export function antipyreticTimes(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): number[] {
+  const times: number[] = [];
+  for (const log of logs) {
+    if (log.type !== "medicine") continue;
+    if (!belongsTo(episode, log.started_at, now)) continue;
+    const parsed = detailsSchemas.medicine.safeParse(log.details);
+    if (parsed.success && parsed.data.antipyretic)
+      times.push(Date.parse(log.started_at));
+  }
+  return times.sort((a, b) => a - b);
+}
+
+export type SymptomEntry = { at: number; codes: string[] };
+
+// The symptom logs of the episode, oldest first.
+export function symptomEntries(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): SymptomEntry[] {
+  const entries: SymptomEntry[] = [];
+  for (const log of logs) {
+    if (log.type !== "symptom") continue;
+    if (!belongsTo(episode, log.started_at, now)) continue;
+    const parsed = detailsSchemas.symptom.safeParse(log.details);
+    if (parsed.success)
+      entries.push({
+        at: Date.parse(log.started_at),
+        codes: parsed.data.codes,
+      });
+  }
+  return entries.sort((a, b) => a.at - b.at);
+}
+
+const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
+
+// "38,6": a comma and at most one decimal, like the doctor's report.
+export function formatCelsius(celsius: number): string {
+  return decimal.format(celsius);
+}
+
+const startOfDayIso = (day: string) =>
+  new Date(vnDayStartMs(day)).toISOString();
+
+// Spec §6.3: the logs the episode's page reads. From the start of the 8th day
+// before the first day (seven days to compare with, and one more so a sleep
+// that began the evening before still counts) to the start of the day after
+// the last one; an open episode has no upper bound.
+export function detailRange(episode: EpisodeLike): {
+  from: string;
+  to: string | null;
+} {
+  const firstDay = vnDateString(new Date(episode.started_at));
+  return {
+    from: startOfDayIso(addDays(firstDay, -8)),
+    to: episode.ended_at
+      ? startOfDayIso(addDays(vnDateString(new Date(episode.ended_at)), 1))
+      : null,
+  };
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  191 passed (191)`, `Tests  1736 passed (1736)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/illness.ts lib/rules/illness.test.ts
git commit -m "feat(illness): days, membership and readings of an episode" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Trạng thái sốt và tiêu đề thẻ kết luận (§5.2)

**Files:**

- Modify: `lib/rules/illness.ts`
- Test: `lib/rules/illness.test.ts`

**Interfaces:**

- Consumes: `episodeReadings`, `episodeDayCount`, `formatCelsius`, `Reading`, `EpisodeLike` (Task 1); `hasFever` (`lib/rules/triage.ts`).
- Produces:
  - `type FeverKind = "unmeasured" | "fever" | "stale" | "cleared" | "none"`
  - `type FeverStatus = { kind: FeverKind; latest: Reading | null; lastFever: Reading | null; peak: Reading | null }`
  - `feverStatus(logs: LogLike[], episode: EpisodeLike, now: Date): FeverStatus`
  - `sinceText(ms: number): string`
  - `type EpisodeTone = "good" | "warn" | "danger" | "neutral"`; `statusTone(status: FeverStatus): EpisodeTone`
  - `type Verdict = { title: string; tone: EpisodeTone; icon: "thermo" | "clock" | "check" }`
  - `episodeVerdict(input: { episode: EpisodeLike; status: FeverStatus; babyName: string; now: Date }): Verdict`

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/rules/illness.test.ts b/lib/rules/illness.test.ts
index dc32a23..0b1f71f 100644
--- a/lib/rules/illness.test.ts
+++ b/lib/rules/illness.test.ts
@@ -8,7 +8,11 @@ import {
   episodeDay,
   episodeDayCount,
   episodeReadings,
+  episodeVerdict,
+  feverStatus,
   formatCelsius,
+  sinceText,
+  statusTone,
   symptomEntries,
 } from "./illness";

@@ -226,3 +230,244 @@ describe("detailRange", () => {
     });
   });
 });
+
+// Spec §5.2.
+describe("feverStatus", () => {
+  const open = episode("2026-11-25 08:00");
+  const kindAt = (logs: LogLike[], now: string) =>
+    sameForEveryOrder(logs, (list) => feverStatus(list, open, vn(now))).kind;
+
+  it("unmeasured: no reading in the episode", () => {
+    const status = feverStatus(
+      [temp("2026-11-25 07:00", 39), dose("2026-11-25 09:00")],
+      open,
+      vn("2026-11-25 12:00"),
+    );
+    expect(status).toEqual({
+      kind: "unmeasured",
+      latest: null,
+      lastFever: null,
+      peak: null,
+    });
+  });
+
+  it("fever: the newest reading is from 38,0 and at most 6 hours old", () => {
+    const logs = [temp("2026-11-25 09:00", 37.5), temp("2026-11-25 10:00", 38)];
+    expect(kindAt(logs, "2026-11-25 10:00")).toBe("fever");
+    expect(kindAt(logs, "2026-11-25 16:00")).toBe("fever");
+    expect(kindAt(logs, "2026-11-25 16:01")).toBe("stale");
+  });
+
+  it("stale: the newest reading is from 38,0 and older than 6 hours", () => {
+    const logs = [temp("2026-11-25 10:00", 39.4)];
+    const status = feverStatus(logs, open, vn("2026-11-26 08:00"));
+    expect(status.kind).toBe("stale");
+    expect(status.latest?.celsius).toBe(39.4);
+  });
+
+  it("cleared: the newest reading is under 38,0 after one from 38,0", () => {
+    const logs = [
+      temp("2026-11-25 09:00", 38.6),
+      temp("2026-11-25 14:00", 39.2),
+      temp("2026-11-25 20:00", 38.1),
+      temp("2026-11-26 07:00", 37.9),
+    ];
+    const status = sameForEveryOrder(logs, (list) =>
+      feverStatus(list, open, vn("2026-11-26 09:00")),
+    );
+    expect(status.kind).toBe("cleared");
+    expect(status.latest).toEqual({
+      at: vn("2026-11-26 07:00").getTime(),
+      celsius: 37.9,
+    });
+    expect(status.lastFever).toEqual({
+      at: vn("2026-11-25 20:00").getTime(),
+      celsius: 38.1,
+    });
+    expect(status.peak).toEqual({
+      at: vn("2026-11-25 14:00").getTime(),
+      celsius: 39.2,
+    });
+  });
+
+  it("none: every reading is under 38,0", () => {
+    const logs = [
+      temp("2026-11-25 09:00", 37.9),
+      temp("2026-11-25 12:00", 37.2),
+    ];
+    const status = feverStatus(logs, open, vn("2026-11-25 13:00"));
+    expect(status.kind).toBe("none");
+    expect(status.lastFever).toBeNull();
+    expect(status.peak?.celsius).toBe(37.9);
+  });
+
+  it("a fever before the episode does not make it cleared", () => {
+    const logs = [temp("2026-11-25 07:00", 39), temp("2026-11-25 09:00", 37.5)];
+    expect(kindAt(logs, "2026-11-25 10:00")).toBe("none");
+  });
+
+  it("of two equal highest readings the later one is the peak", () => {
+    const logs = [
+      temp("2026-11-25 09:00", 39.2),
+      temp("2026-11-25 14:00", 39.2),
+    ];
+    const status = sameForEveryOrder(logs, (list) =>
+      feverStatus(list, open, vn("2026-11-25 15:00")),
+    );
+    expect(status.peak?.at).toBe(vn("2026-11-25 14:00").getTime());
+  });
+
+  it("a reading saved just after the page's clock last moved counts at once", () => {
+    const now = vn("2026-11-25 12:00");
+    const fresh: LogLike = {
+      type: "temperature",
+      started_at: new Date(now.getTime() + 20_000).toISOString(),
+      ended_at: null,
+      details: { celsius: 38.6, method: "nach" },
+    };
+    const status = feverStatus([fresh], open, now);
+    expect(status.kind).toBe("fever");
+    expect(status.latest?.celsius).toBe(38.6);
+  });
+
+  it("a closed episode reads its readings up to its end", () => {
+    const closed = episode("2026-11-25 08:00", "2026-11-26 08:00");
+    const logs = [
+      temp("2026-11-25 09:00", 38.6),
+      temp("2026-11-26 09:00", 36.8),
+    ];
+    const status = feverStatus(logs, closed, vn("2026-11-30 09:00"));
+    expect(status.latest?.celsius).toBe(38.6);
+  });
+});
+
+describe("sinceText", () => {
+  const HOUR = 3_600_000;
+
+  it("under an hour, whole hours up to 48, then whole days", () => {
+    expect(sinceText(0)).toBe("chưa đầy 1 giờ");
+    expect(sinceText(HOUR - 1)).toBe("chưa đầy 1 giờ");
+    expect(sinceText(HOUR)).toBe("1 giờ");
+    expect(sinceText(2.9 * HOUR)).toBe("2 giờ");
+    expect(sinceText(48 * HOUR - 1)).toBe("47 giờ");
+    expect(sinceText(48 * HOUR)).toBe("2 ngày");
+    expect(sinceText(71.9 * HOUR)).toBe("2 ngày");
+    expect(sinceText(72 * HOUR)).toBe("3 ngày");
+  });
+});
+
+describe("episodeVerdict", () => {
+  const open = episode("2026-11-25 08:00");
+  const verdict = (logs: LogLike[], now: string, of: EpisodeLike = open) =>
+    episodeVerdict({
+      episode: of,
+      status: feverStatus(logs, of, vn(now)),
+      babyName: "Bun",
+      now: vn(now),
+    });
+
+  it("unmeasured: neutral, the thermometer", () => {
+    expect(verdict([], "2026-11-25 12:00")).toEqual({
+      title: "Chưa đo nhiệt độ",
+      tone: "neutral",
+      icon: "thermo",
+    });
+  });
+
+  it("fever: warn under 39,0, danger from 39,0", () => {
+    expect(
+      verdict([temp("2026-11-25 10:00", 38.9)], "2026-11-25 11:00"),
+    ).toEqual({ title: "Bun đang sốt 38,9°C", tone: "warn", icon: "thermo" });
+    expect(verdict([temp("2026-11-25 10:00", 39)], "2026-11-25 11:00")).toEqual(
+      {
+        title: "Bun đang sốt 39°C",
+        tone: "danger",
+        icon: "thermo",
+      },
+    );
+  });
+
+  it("stale: warn and a clock, even from 39,0", () => {
+    expect(
+      verdict([temp("2026-11-25 10:00", 39.4)], "2026-11-25 17:00"),
+    ).toEqual({ title: "Chưa đo lại sau 39,4°C", tone: "warn", icon: "clock" });
+  });
+
+  it("cleared: counts from the last reading that was a fever", () => {
+    const logs = [
+      temp("2026-11-25 10:00", 38.6),
+      temp("2026-11-25 13:00", 37.4),
+    ];
+    expect(verdict(logs, "2026-11-25 13:30")).toEqual({
+      title: "Bun đã hết sốt 3 giờ",
+      tone: "good",
+      icon: "check",
+    });
+    expect(verdict(logs, "2026-11-27 11:00").title).toBe(
+      "Bun đã hết sốt 2 ngày",
+    );
+    expect(
+      verdict(
+        [temp("2026-11-25 10:00", 38.6), temp("2026-11-25 10:20", 37.4)],
+        "2026-11-25 10:30",
+      ).title,
+    ).toBe("Bun đã hết sốt chưa đầy 1 giờ");
+  });
+
+  it("none: good and a tick", () => {
+    expect(
+      verdict([temp("2026-11-25 10:00", 37.2)], "2026-11-25 11:00"),
+    ).toEqual({ title: "Bun không sốt", tone: "good", icon: "check" });
+  });
+
+  it("a newest reading under 35,5 is never green: neutral and the thermometer, same title", () => {
+    expect(
+      verdict([temp("2026-11-25 10:00", 35.4)], "2026-11-25 11:00"),
+    ).toEqual({ title: "Bun không sốt", tone: "neutral", icon: "thermo" });
+    expect(
+      verdict(
+        [temp("2026-11-25 09:00", 38.2), temp("2026-11-25 10:00", 35.4)],
+        "2026-11-25 11:00",
+      ),
+    ).toEqual({
+      title: "Bun đã hết sốt 2 giờ",
+      tone: "neutral",
+      icon: "thermo",
+    });
+    expect(
+      verdict([temp("2026-11-25 10:00", 35.5)], "2026-11-25 11:00").tone,
+    ).toBe("good");
+  });
+
+  it("a closed episode always reads Đã khỏi, whatever its last reading", () => {
+    const closed = episode("2026-11-24 23:30", "2026-11-26 07:00");
+    expect(
+      verdict([temp("2026-11-25 10:00", 39.4)], "2026-11-30 09:00", closed),
+    ).toEqual({ title: "Đã khỏi sau 3 ngày", tone: "good", icon: "check" });
+    expect(verdict([], "2026-11-30 09:00", closed).title).toBe(
+      "Đã khỏi sau 3 ngày",
+    );
+  });
+});
+
+describe("statusTone", () => {
+  const open = episode("2026-11-25 08:00");
+  const tone = (logs: LogLike[], now: string) =>
+    statusTone(feverStatus(logs, open, vn(now)));
+
+  it("is the tone of the verdict card for each kind", () => {
+    expect(tone([], "2026-11-25 12:00")).toBe("neutral");
+    expect(tone([temp("2026-11-25 10:00", 38.5)], "2026-11-25 11:00")).toBe(
+      "warn",
+    );
+    expect(tone([temp("2026-11-25 10:00", 40)], "2026-11-25 11:00")).toBe(
+      "danger",
+    );
+    expect(tone([temp("2026-11-25 10:00", 40)], "2026-11-25 17:00")).toBe(
+      "warn",
+    );
+    expect(tone([temp("2026-11-25 10:00", 36.9)], "2026-11-25 11:00")).toBe(
+      "good",
+    );
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 190 passed (191)`, `Tests  18 failed | 1736 passed (1754)`. 18 test mới đỏ vì bốn hàm chưa có.

- [ ] **Step 3: Viết trạng thái sốt (Patch 4)**

```diff
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index 367d56c..eca318c 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -2,6 +2,7 @@ import { addDays, vnDayStartMs } from "./days";
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
 import { vnDateString } from "./time";
+import { hasFever } from "./triage";

 const DAY_MS = 86_400_000;

@@ -148,3 +149,113 @@ export function detailRange(episode: EpisodeLike): {
       : null,
   };
 }
+
+const HOUR_MS = 3_600_000;
+// Spec §5.2: the window of the home page's fever banner (temperatureAlert).
+const FRESH_MS = 6 * HOUR_MS;
+const HIGH_FEVER = 39;
+const LOW_TEMPERATURE = 35.5;
+
+export type FeverKind = "unmeasured" | "fever" | "stale" | "cleared" | "none";
+
+export type FeverStatus = {
+  kind: FeverKind;
+  // The newest reading of the episode.
+  latest: Reading | null;
+  // The newest reading from 38,0.
+  lastFever: Reading | null;
+  // The highest reading; of equal ones, the later.
+  peak: Reading | null;
+};
+
+// Spec §5.2. For a closed episode `kind` is worked out the same way, but the
+// verdict card does not use it.
+export function feverStatus(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): FeverStatus {
+  const readings = episodeReadings(logs, episode, now);
+  const latest = readings.at(-1) ?? null;
+  if (!latest)
+    return { kind: "unmeasured", latest: null, lastFever: null, peak: null };
+  let lastFever: Reading | null = null;
+  let peak = readings[0];
+  for (const reading of readings) {
+    if (hasFever(reading.celsius)) lastFever = reading;
+    if (reading.celsius >= peak.celsius) peak = reading;
+  }
+  const kind: FeverKind = hasFever(latest.celsius)
+    ? now.getTime() - latest.at <= FRESH_MS
+      ? "fever"
+      : "stale"
+    : lastFever
+      ? "cleared"
+      : "none";
+  return { kind, latest, lastFever, peak };
+}
+
+// Spec §5.2 {khoảng}: under an hour; whole hours up to 48; then whole days.
+export function sinceText(ms: number): string {
+  if (ms < HOUR_MS) return "chưa đầy 1 giờ";
+  if (ms < 48 * HOUR_MS) return `${Math.floor(ms / HOUR_MS)} giờ`;
+  return `${Math.floor(ms / DAY_MS)} ngày`;
+}
+
+export type EpisodeTone = "good" | "warn" | "danger" | "neutral";
+
+// The tone of an open episode's state (verdict card, chip on the list).
+export function statusTone(status: FeverStatus): EpisodeTone {
+  const { kind, latest } = status;
+  if (kind === "unmeasured" || !latest) return "neutral";
+  if (kind === "fever") return latest.celsius >= HIGH_FEVER ? "danger" : "warn";
+  if (kind === "stale") return "warn";
+  // A body temperature this low has its own red banner on Hôm nay: no green.
+  return latest.celsius < LOW_TEMPERATURE ? "neutral" : "good";
+}
+
+export type Verdict = {
+  title: string;
+  tone: EpisodeTone;
+  icon: "thermo" | "clock" | "check";
+};
+
+// Spec §5.2: the heading of the verdict card.
+export function episodeVerdict(input: {
+  episode: EpisodeLike;
+  status: FeverStatus;
+  babyName: string;
+  now: Date;
+}): Verdict {
+  const { episode, status, babyName, now } = input;
+  if (episode.ended_at)
+    return {
+      title: `Đã khỏi sau ${episodeDayCount(episode, now)} ngày`,
+      tone: "good",
+      icon: "check",
+    };
+  const { kind, latest, lastFever } = status;
+  const tone = statusTone(status);
+  if (kind === "unmeasured" || !latest)
+    return { title: "Chưa đo nhiệt độ", tone, icon: "thermo" };
+  if (kind === "fever")
+    return {
+      title: `${babyName} đang sốt ${formatCelsius(latest.celsius)}°C`,
+      tone,
+      icon: "thermo",
+    };
+  if (kind === "stale")
+    return {
+      title: `Chưa đo lại sau ${formatCelsius(latest.celsius)}°C`,
+      tone,
+      icon: "clock",
+    };
+  return {
+    title:
+      kind === "cleared" && lastFever
+        ? `${babyName} đã hết sốt ${sinceText(now.getTime() - lastFever.at)}`
+        : `${babyName} không sốt`,
+    tone,
+    icon: tone === "good" ? "check" : "thermo",
+  };
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  191 passed (191)`, `Tests  1754 passed (1754)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/illness.ts lib/rules/illness.test.ts
git commit -m "feat(illness): fever status and the verdict" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Từng ngày của đợt và nhãn của ngày (§5.3, phần luật của §6.3 mục 4)

**Files:**

- Modify: `lib/rules/illness.ts`
- Test: `lib/rules/illness.test.ts`

**Interfaces:**

- Consumes: `episodeReadings`, `antipyreticTimes`, `symptomEntries`, `episodeDayCount` (Task 1); `hasFever`.
- Produces:
  - `type DayLabel = { text: "Sốt cao" | "Sốt" | "Hết sốt" | "Không sốt"; tone: "danger" | "warn" | "good" }`
  - `type EpisodeDayRow = { day: string; n: number; peak: number | null; doses: number; codes: string[]; label: DayLabel | null }`
  - `episodeDays(logs: LogLike[], episode: EpisodeLike, now: Date): EpisodeDayRow[]` (ngày mới nhất trước)

- [ ] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/lib/rules/illness.test.ts b/lib/rules/illness.test.ts
index 0b1f71f..61a220b 100644
--- a/lib/rules/illness.test.ts
+++ b/lib/rules/illness.test.ts
@@ -7,6 +7,7 @@ import {
   type EpisodeLike,
   episodeDay,
   episodeDayCount,
+  episodeDays,
   episodeReadings,
   episodeVerdict,
   feverStatus,
@@ -471,3 +472,101 @@ describe("statusTone", () => {
     );
   });
 });
+
+// Spec §5.3 and §6.3 item 4.
+describe("episodeDays", () => {
+  const open = episode("2026-11-24 23:30");
+  const now = vn("2026-11-27 08:00");
+  const logs = [
+    temp("2026-11-24 23:00", 40), // before the episode
+    temp("2026-11-24 23:40", 38.4),
+    temp("2026-11-25 03:00", 39),
+    temp("2026-11-25 15:00", 38.2),
+    dose("2026-11-25 03:10"),
+    dose("2026-11-25 09:30"),
+    symptom("2026-11-25 08:00", ["cough", "runny_nose"]),
+    symptom("2026-11-25 20:00", ["runny_nose", "fussy"]),
+    temp("2026-11-26 09:00", 37.6),
+    temp("2026-11-26 19:00", 37.9),
+    dose("2026-11-26 01:00", false),
+    symptom("2026-11-27 07:00", ["cough"]),
+  ];
+  const days = () =>
+    sameForEveryOrder(logs, (list) => episodeDays(list, open, now));
+
+  it("one row per day from the first day to today, newest first", () => {
+    expect(days().map((row) => [row.day, row.n])).toEqual([
+      ["2026-11-27", 4],
+      ["2026-11-26", 3],
+      ["2026-11-25", 2],
+      ["2026-11-24", 1],
+    ]);
+  });
+
+  it("each day: its highest reading, its doses, its symptom codes once each", () => {
+    expect(days()[2]).toEqual({
+      day: "2026-11-25",
+      n: 2,
+      peak: 39,
+      doses: 2,
+      codes: ["cough", "fussy", "runny_nose"],
+      label: { text: "Sốt cao", tone: "danger" },
+    });
+    expect(days()[3]).toMatchObject({ peak: 38.4, doses: 0, codes: [] });
+  });
+
+  it("labels: Sốt cao from 39,0, Sốt from 38,0, Hết sốt after a day with fever, none without a reading", () => {
+    expect(days().map((row) => row.label)).toEqual([
+      null,
+      { text: "Hết sốt", tone: "good" },
+      { text: "Sốt cao", tone: "danger" },
+      { text: "Sốt", tone: "warn" },
+    ]);
+    expect(days()[0]).toMatchObject({ peak: null, doses: 0, codes: ["cough"] });
+  });
+
+  it("Không sốt when no earlier day of the episode had a fever", () => {
+    const calm = [
+      temp("2026-11-24 23:40", 37.2),
+      temp("2026-11-25 09:00", 37.9),
+      temp("2026-11-26 09:00", 38),
+      temp("2026-11-27 07:00", 37),
+    ];
+    expect(
+      sameForEveryOrder(calm, (list) => episodeDays(list, open, now)).map(
+        (row) => row.label?.text,
+      ),
+    ).toEqual(["Hết sốt", "Sốt", "Không sốt", "Không sốt"]);
+  });
+
+  it("a fever earlier the same day does not turn the day into Hết sốt", () => {
+    const sameDay = [
+      temp("2026-11-24 23:40", 38.4),
+      temp("2026-11-24 23:50", 37),
+    ];
+    expect(episodeDays(sameDay, open, vn("2026-11-24 23:55"))).toEqual([
+      {
+        day: "2026-11-24",
+        n: 1,
+        peak: 38.4,
+        doses: 0,
+        codes: [],
+        label: { text: "Sốt", tone: "warn" },
+      },
+    ]);
+  });
+
+  it("a closed episode ends on the day of its end and leaves later logs out", () => {
+    const closed = episode("2026-11-24 23:30", "2026-11-26 12:00");
+    const rows = sameForEveryOrder(logs, (list) =>
+      episodeDays(list, closed, now),
+    );
+    expect(rows.map((row) => row.day)).toEqual([
+      "2026-11-26",
+      "2026-11-25",
+      "2026-11-24",
+    ]);
+    // 19:00 on the last day is after the end: only the 09:00 reading counts.
+    expect(rows[0].peak).toBe(37.6);
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 190 passed (191)`, `Tests  6 failed | 1754 passed (1760)`. 6 test mới đỏ vì `episodeDays` chưa có.

- [ ] **Step 3: Viết các ngày của đợt (Patch 6)**

```diff
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index eca318c..454a769 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -259,3 +259,71 @@ export function episodeVerdict(input: {
     icon: tone === "good" ? "check" : "thermo",
   };
 }
+
+export type DayLabel = {
+  text: "Sốt cao" | "Sốt" | "Hết sốt" | "Không sốt";
+  tone: "danger" | "warn" | "good";
+};
+
+export type EpisodeDayRow = {
+  // "2026-11-25", a Vietnam calendar day.
+  day: string;
+  // Its number in the episode, from 1.
+  n: number;
+  // The highest reading of the day; null without a reading.
+  peak: number | null;
+  // Doses of fever medicine that day.
+  doses: number;
+  // Codes of the day's symptom logs, each once, sorted by code.
+  codes: string[];
+  // Spec §5.3; null on a day without a reading.
+  label: DayLabel | null;
+};
+
+// Spec §5.3 and §6.3 item 4: one row per calendar day from the first day to
+// the last (an open episode: today), newest first. Only logs that belong to
+// the episode count, so the first and last day may be partial days.
+export function episodeDays(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): EpisodeDayRow[] {
+  const dayOf = (ms: number) => vnDateString(new Date(ms));
+  const firstDay = dayOf(Date.parse(episode.started_at));
+  const count = episodeDayCount(episode, now);
+  const readings = episodeReadings(logs, episode, now);
+  const doses = antipyreticTimes(logs, episode, now);
+  const symptoms = symptomEntries(logs, episode, now);
+  const rows: EpisodeDayRow[] = [];
+  let feverBefore = false;
+  for (let index = 0; index < count; index += 1) {
+    const day = addDays(firstDay, index);
+    const temperatures = readings
+      .filter((reading) => dayOf(reading.at) === day)
+      .map((reading) => reading.celsius);
+    const peak = temperatures.length > 0 ? Math.max(...temperatures) : null;
+    let label: DayLabel | null = null;
+    if (peak !== null) {
+      if (peak >= HIGH_FEVER) label = { text: "Sốt cao", tone: "danger" };
+      else if (hasFever(peak)) label = { text: "Sốt", tone: "warn" };
+      else
+        label = { text: feverBefore ? "Hết sốt" : "Không sốt", tone: "good" };
+    }
+    rows.push({
+      day,
+      n: index + 1,
+      peak,
+      doses: doses.filter((time) => dayOf(time) === day).length,
+      codes: [
+        ...new Set(
+          symptoms
+            .filter((entry) => dayOf(entry.at) === day)
+            .flatMap((entry) => entry.codes),
+        ),
+      ].sort(),
+      label,
+    });
+    if (hasFever(peak)) feverBefore = true;
+  }
+  return rows.reverse();
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  191 passed (191)`, `Tests  1760 passed (1760)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/illness.ts lib/rules/illness.test.ts
git commit -m "feat(illness): the days of an episode" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm khi lưu, và điều kiện mở lại (§5.7, phần luật của §6.4)

**Files:**

- Modify: `lib/rules/illness.ts`
- Test: `lib/rules/illness.test.ts`

**Interfaces:**

- Consumes: `EpisodeLike` (Task 1).
- Produces:
  - `type EpisodeErrors = { started_at?: string; ended_at?: string }`
  - `checkEpisode(input: { id: string | null; started_at: string; ended_at: string | null; episodes: EpisodeLike[]; now: Date }): EpisodeErrors` (đối tượng rỗng là lưu được)
  - `episodeError(errors: EpisodeErrors): string | null`
  - `canReopen(episode: EpisodeLike, episodes: EpisodeLike[]): boolean`

- [ ] **Step 1: Viết test đỏ (Patch 7)**

```diff
diff --git a/lib/rules/illness.test.ts b/lib/rules/illness.test.ts
index 61a220b..c798cf0 100644
--- a/lib/rules/illness.test.ts
+++ b/lib/rules/illness.test.ts
@@ -3,7 +3,10 @@ import type { LogLike } from "./describeLog";
 import {
   antipyreticTimes,
   belongsTo,
+  canReopen,
+  checkEpisode,
   detailRange,
+  episodeError,
   type EpisodeLike,
   episodeDay,
   episodeDayCount,
@@ -570,3 +573,156 @@ describe("episodeDays", () => {
     expect(rows[0].peak).toBe(37.6);
   });
 });
+
+// Spec §5.7.
+describe("checkEpisode", () => {
+  const now = vn("2026-11-27 08:00");
+  const others = [
+    episode("2026-11-10 08:00", "2026-11-12 08:00", "old"),
+    episode("2026-11-20 08:00", "2026-11-22 08:00", "mid"),
+  ];
+  const check = (start: string, end: string | null, id: string | null = null) =>
+    checkEpisode({
+      id,
+      started_at: iso(start),
+      ended_at: end === null ? null : iso(end),
+      episodes: others,
+      now,
+    });
+
+  it("a start more than a minute ahead is refused, a minute ahead is not", () => {
+    expect(check("2026-11-27 08:01", null)).toEqual({});
+    expect(check("2026-11-27 08:02", null)).toEqual({
+      started_at: "Giờ bắt đầu ở tương lai.",
+    });
+    // To the second: 60 seconds ahead passes, 61 does not.
+    const ahead = (ms: number) =>
+      checkEpisode({
+        id: null,
+        started_at: new Date(now.getTime() + ms).toISOString(),
+        ended_at: null,
+        episodes: [],
+        now,
+      });
+    expect(ahead(60_000)).toEqual({});
+    expect(ahead(61_000)).toEqual({ started_at: "Giờ bắt đầu ở tương lai." });
+  });
+
+  it("the end must be after the start", () => {
+    expect(check("2026-11-25 08:00", "2026-11-25 08:00")).toEqual({
+      ended_at: "Giờ kết thúc phải sau giờ bắt đầu.",
+    });
+    expect(check("2026-11-25 08:00", "2026-11-25 07:00")).toEqual({
+      ended_at: "Giờ kết thúc phải sau giờ bắt đầu.",
+    });
+    expect(check("2026-11-25 08:00", "2026-11-25 08:01")).toEqual({});
+  });
+
+  it("an end more than a minute ahead is refused", () => {
+    expect(check("2026-11-25 08:00", "2026-11-27 08:01")).toEqual({});
+    expect(check("2026-11-25 08:00", "2026-11-27 08:02")).toEqual({
+      ended_at: "Giờ kết thúc ở tương lai.",
+    });
+  });
+
+  it("an open episode may not start before the end of another one", () => {
+    expect(check("2026-11-22 07:59", null)).toEqual({
+      started_at: "Trùng thời gian với một đợt ốm khác.",
+    });
+    expect(check("2026-11-05 08:00", null)).toEqual({
+      started_at: "Trùng thời gian với một đợt ốm khác.",
+    });
+  });
+
+  it("two episodes may share one moment: this one starts as the other ends, or ends as it starts", () => {
+    expect(check("2026-11-22 08:00", null)).toEqual({});
+    expect(check("2026-11-12 08:00", "2026-11-20 08:00")).toEqual({});
+  });
+
+  it("a closed episode whose start is inside another: the error is under the start", () => {
+    expect(check("2026-11-21 08:00", "2026-11-25 08:00")).toEqual({
+      started_at: "Trùng thời gian với một đợt ốm khác.",
+    });
+  });
+
+  it("a closed episode that runs into a later one: the error is under the end", () => {
+    expect(check("2026-11-15 08:00", "2026-11-20 08:01")).toEqual({
+      ended_at: "Trùng thời gian với một đợt ốm khác.",
+    });
+    // Wrapping a whole other episode is an overlap as well.
+    expect(check("2026-11-19 08:00", "2026-11-23 08:00")).toEqual({
+      ended_at: "Trùng thời gian với một đợt ốm khác.",
+    });
+  });
+
+  it("an episode is not compared with itself", () => {
+    expect(check("2026-11-20 09:00", "2026-11-22 07:00", "mid")).toEqual({});
+    expect(check("2026-11-20 09:00", "2026-11-22 07:00", "new")).not.toEqual(
+      {},
+    );
+  });
+
+  it("an open episode elsewhere blocks everything after its start", () => {
+    const withOpen = [...others, episode("2026-11-25 08:00", null, "open")];
+    expect(
+      checkEpisode({
+        id: null,
+        started_at: iso("2026-11-27 08:00"),
+        ended_at: null,
+        episodes: withOpen,
+        now,
+      }),
+    ).toEqual({ started_at: "Trùng thời gian với một đợt ốm khác." });
+    // Reopening "mid" would run into the open one.
+    expect(
+      checkEpisode({
+        id: "mid",
+        started_at: iso("2026-11-20 08:00"),
+        ended_at: null,
+        episodes: withOpen,
+        now,
+      }),
+    ).toEqual({ started_at: "Trùng thời gian với một đợt ốm khác." });
+  });
+
+  it("reports one error per field, the time errors first", () => {
+    expect(check("2026-11-21 08:00", "2026-11-21 07:00")).toEqual({
+      started_at: "Trùng thời gian với một đợt ốm khác.",
+      ended_at: "Giờ kết thúc phải sau giờ bắt đầu.",
+    });
+    expect(check("2026-11-27 09:00", "2026-11-27 10:00")).toEqual({
+      started_at: "Giờ bắt đầu ở tương lai.",
+      ended_at: "Giờ kết thúc ở tương lai.",
+    });
+  });
+});
+
+describe("episodeError", () => {
+  it("is the one sentence a toast shows: the start's error first, null when all is well", () => {
+    expect(episodeError({})).toBeNull();
+    expect(episodeError({ ended_at: "Giờ kết thúc ở tương lai." })).toBe(
+      "Giờ kết thúc ở tương lai.",
+    );
+    expect(
+      episodeError({
+        started_at: "Giờ bắt đầu ở tương lai.",
+        ended_at: "Giờ kết thúc ở tương lai.",
+      }),
+    ).toBe("Giờ bắt đầu ở tương lai.");
+  });
+});
+
+// Spec §6.4.
+describe("canReopen", () => {
+  const old = episode("2026-11-10 08:00", "2026-11-12 08:00", "old");
+  const last = episode("2026-11-20 08:00", "2026-11-22 08:00", "last");
+  const open = episode("2026-11-25 08:00", null, "open");
+
+  it("only the closed episode with the latest start, and only while none is open", () => {
+    expect(canReopen(last, [old, last])).toBe(true);
+    expect(canReopen(last, [last, old])).toBe(true);
+    expect(canReopen(old, [old, last])).toBe(false);
+    expect(canReopen(last, [old, last, open])).toBe(false);
+    expect(canReopen(open, [old, last, open])).toBe(false);
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 190 passed (191)`, `Tests  12 failed | 1760 passed (1772)`. 12 test mới đỏ vì ba hàm chưa có.

- [ ] **Step 3: Viết các kiểm (Patch 8)**

```diff
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index 454a769..1ad983e 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -327,3 +327,64 @@ export function episodeDays(
   }
   return rows.reverse();
 }
+
+const MINUTE_MS = 60_000;
+const OVERLAP = "Trùng thời gian với một đợt ốm khác.";
+
+export type EpisodeErrors = { started_at?: string; ended_at?: string };
+
+const startOf = (episode: { started_at: string }) =>
+  Date.parse(episode.started_at);
+const endOf = (episode: { ended_at: string | null }) =>
+  episode.ended_at === null ? Infinity : Date.parse(episode.ended_at);
+
+// Spec §5.7: the checks before an episode is saved, one sentence per field.
+// `episodes` is every episode of the baby (useEpisodes); `id` is the episode
+// being changed, or null for a new one. An empty result means it may be saved.
+// Two ranges [start, end) overlap unless one starts where the other ends,
+// like the constraint on the server, which still has the last word.
+export function checkEpisode(input: {
+  id: string | null;
+  started_at: string;
+  ended_at: string | null;
+  episodes: EpisodeLike[];
+  now: Date;
+}): EpisodeErrors {
+  const { id, episodes } = input;
+  const start = startOf(input);
+  const end = endOf(input);
+  const limit = input.now.getTime() + MINUTE_MS;
+  const errors: EpisodeErrors = {};
+  if (start > limit) errors.started_at = "Giờ bắt đầu ở tương lai.";
+  if (end <= start) errors.ended_at = "Giờ kết thúc phải sau giờ bắt đầu.";
+  else if (end !== Infinity && end > limit)
+    errors.ended_at = "Giờ kết thúc ở tương lai.";
+  for (const other of episodes) {
+    if (other.id === id) continue;
+    const otherStart = startOf(other);
+    const otherEnd = endOf(other);
+    if (!(start < otherEnd && otherStart < end)) continue;
+    // Under the start when the start itself falls inside the other episode,
+    // and always for an open episode, which has no end field.
+    if (end === Infinity || (start >= otherStart && start < otherEnd))
+      errors.started_at ??= OVERLAP;
+    else errors.ended_at ??= OVERLAP;
+  }
+  return errors;
+}
+
+// The sentence for a toast, for the one-tap actions that have no field.
+export function episodeError(errors: EpisodeErrors): string | null {
+  return errors.started_at ?? errors.ended_at ?? null;
+}
+
+// Spec §6.4: "Mở lại đợt ốm" is offered for a closed episode, while the baby
+// has no open one, and only for the episode with the latest start.
+export function canReopen(
+  episode: EpisodeLike,
+  episodes: EpisodeLike[],
+): boolean {
+  if (episode.ended_at === null) return false;
+  if (episodes.some((other) => other.ended_at === null)) return false;
+  return episodes.every((other) => startOf(other) <= startOf(episode));
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  191 passed (191)`, `Tests  1772 passed (1772)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/illness.ts lib/rules/illness.test.ts
git commit -m "feat(illness): checks before saving an episode" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 5: Kiểm cuối M2b, rồi đưa lên `main`

**Files:**

- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M2b.

- [ ] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  191 passed (191)`, `Tests  1772 passed (1772)`.

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [ ] **Step 3: Không có bước trình duyệt, không có pgTAP**

Plan này chỉ thêm luật thuần và test của chúng: chưa component nào gọi tới (Diễn giải spec mục 13), và DB không đổi.

- [ ] **Step 4: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1 và Step 2. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này hiện là untracked (??); các file plan khác của M2 chưa chạy cũng vậy, không add chúng
git add docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2b.md
git commit -m "docs(plan): the M2b plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [ ] **Step 5: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m2b
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
