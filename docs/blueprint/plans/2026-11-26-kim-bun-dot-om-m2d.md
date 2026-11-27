# Kim Bun — Đợt ốm M2d: thẻ kết luận và từng ngày Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (chữ của §6.2; §6.3 mục 2 và mục 4; trạng thái trống của §6.2 và §6.3; phần tương ứng của §10.1 và §10.3)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Có thẻ kết luận của một đợt ốm (bé còn sốt không, ba con số chính, ba nút ghi nhanh) và danh sách từng ngày của đợt. Chúng chưa nằm trên trang nào; M2f đặt chúng lên trang chi tiết.

**Architecture:**

- **Chữ:** `lib/rules/illnessView.ts` đổi kết quả của các luật M2b thành đúng những dòng chữ màn hình hiện, cho cả trang chi tiết và danh sách. Thuần, có test.
- **Hình:** hai file component không có hook, nhận sẵn dữ liệu đã thành chữ: `EpisodeVerdict.tsx` (thẻ kết luận và ba nút) và `EpisodeDayList.tsx`.
- **`EmptyState`** nhận thêm một dòng phụ và một hành động dạng đường dẫn.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m2d`, cắt từ `main` sau khi M2c đã lên. Baseline: 1798 test vitest xanh (193 file), typecheck sạch. **Khi chạy (2026-11-27):** nền thật là 193 file / 1801 test, vì M2c thêm 3 test cho hai bản sửa của biểu đồ sốt; mọi con số test xanh trong plan này vì vậy cộng 3. Số đo thật ghi ở Task 4 Step 6.

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

1. **Hàng "Sốt cao nhất" khi đợt chưa có lần đo nào ghi "Chưa đo"**, không ghi "Không sốt". Spec §6.3 viết: lần đo cao nhất từ 38,0 thì ghi giờ và số, "không thì giá trị 'Không sốt'". Đọc sát chữ thì đợt chưa đo cũng ghi "Không sốt", tức app khẳng định một điều chưa ai đo. Plan dùng "Chưa đo" (chữ sẵn có của hàng "Đo gần nhất") cho trường hợp đó, và "Không sốt" khi đã có lần đo mà chưa lần nào từ 38,0.
2. **Giờ nhỏ của hàng "Thuốc hạ sốt"** là "gần nhất {HH:mm} hôm nay" hoặc "gần nhất {dd/mm} {HH:mm}", cùng luật giờ với hai hàng trên.
3. **Thẻ của đợt đã đóng vẫn có đủ ba hàng**; mọi giờ ở dạng "{dd/mm} {HH:mm}" trừ khi rơi đúng hôm nay.
4. **Nhãn §5.3 của một ngày đứng cùng dòng với tiêu đề của hàng**, không nằm bên phải cả hàng như bản vẽ: dòng mô tả nhờ vậy có trọn bề ngang và nằm trên một dòng ở 375 px.
5. **Mục có tiêu đề "Từng ngày"** như bản vẽ. Spec gọi khối này là "Từng ngày" nhưng không nói có tiêu đề hay không.
6. **Ba nút ghi nhanh dùng chữ 14 px và đệm ngang 4 px** (nút `Button` cỡ `md` bình thường là 15 px và 16 px): một phần ba bề ngang thẻ ở 375 px là 97,7 px, và chữ "Triệu chứng" rộng 80,1 px ở 14 px.
7. **Chip của thẻ "Đang diễn ra"** (dùng ở M2f) chỉ có khi bản ghi của đợt đã tải xong và đợt có lần đo; tông lấy theo §5.2 (`statusTone`).
8. **Ngày thuộc năm khác** viết đủ năm cho riêng ngày đó: "30/12/2025 – 02/01 · 4 ngày".
9. **Mã triệu chứng mà nội dung không còn** bị bỏ qua khi vẽ chip, như ở M1.
10. **Chữ của danh sách (`episodeList`) nằm cùng file với chữ của trang chi tiết** và được viết ở plan này; M2f mới vẽ danh sách.
11. **`EmptyState` thêm hai thứ tùy chọn** (dòng phụ `detail`, và `action.href`), để vẽ được trạng thái "Chưa có đợt ốm nào" kèm dòng giải thích (§6.2) và đường dẫn "Về danh sách" (§6.3). Ba nơi đang dùng không đổi.
12. **Các component mới chưa nằm trên trang nào.** Bước trình duyệt xem chúng trên trang fixture.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này (thêm khi chạy: **Patch 7** và **Patch 8**, bản sửa sau bước trình duyệt, ở cuối file). Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2d.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ commit cuối của M2c trong bản chạy thử. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang fixture của Task 4 đã qua `tsc --noEmit`. `bun run build` đã chạy xanh một lần trên bản sao có đủ cả bảy plan của M2, chưa chạy riêng cho plan này.
- **Đã nhìn thử khi viết plan.** Trang fixture đã được mở ở 375 px, theme `rose`, trên bản sao (không có dữ liệu thật): mọi hàng của thẻ kết luận cao 44 px, mọi tiêu đề một dòng, nút rộng 97,7 px với chữ "Triệu chứng" 80,1 px, mọi dòng mô tả của "Từng ngày" một dòng; đường dẫn "Về danh sách" và nút "Bắt đầu đợt ốm" của hai trạng thái trống cao 44 px, dòng phụ xuống hai dòng. Chưa xem: ba theme `light`, `dark`, `night`, bề ngang 390 và 440, và trang thật.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Trình duyệt.** Dùng khung Browser trong app, cỡ 375×812 (`resize_window` preset `mobile`); người dùng đã chọn sẵn ngày 2026-11-26, không hỏi lại. Gọi `navigate` trước. Chỉ khi bộ kiểm quyền của app từ chối khung Browser thì hỏi người dùng đúng một câu rồi làm tiếp. Trang tạm vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập trong khung đó. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại `resize_window` và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt lại theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt nó khi xong. Bấm theo `ref` của `find`, không bấm theo tọa độ trên trang thật. Không đọc cả console (một lỗi in ra hàng trăm dòng): lọc bằng `onlyErrors` và `limit` nhỏ.
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

Plan này đứng sau M2c. M2f đặt thẻ kết luận và danh sách từng ngày lên trang chi tiết, vẽ danh sách từ `episodeList` và dùng hai dạng mới của `EmptyState`; M3 dùng lại `QuickLogButtons`, `whenText` và `episodeHref` cho thẻ ở Hôm nay.

**Consumes (M2b, `lib/rules/illness.ts`):** `feverStatus`, `statusTone`, `episodeVerdict`, `episodeDays`, `episodeDayCount`, `antipyreticTimes`, `formatCelsius`, `type EpisodeLike`, `type EpisodeTone`, `type Verdict`, `type DayLabel`.

**Consumes (đã ở `main` từ trước):** `symptomShorts(codes: readonly string[], symptoms: readonly TriageSymptom[]): string[]` (`lib/rules/symptomForm.ts`); `TRIAGE` (`lib/content/triage.ts`); `formatDayShort`, `formatDayFull` (`lib/rules/days.ts`); `formatVnTime`, `vnDateString` (`lib/rules/time.ts`); `hasFever`; `Button`, `buttonClass`, `Icon`, `StatusChip` (tông `good`, `warn`, `danger`, `neutral`), `cx`; `findElements` (`components/ui/testTree.ts`).

**Produces:**

- `lib/rules/illnessView.ts`: `episodeHref(id: string): string`; `whenText(at: number, now: Date): string`; `type SummaryRow`; `type VerdictView`; `verdictView(input: { episode: EpisodeLike; logs: LogLike[]; babyName: string; now: Date }): VerdictView`; `type DayRowView`; `dayRows(logs: LogLike[], episode: EpisodeLike, now: Date): DayRowView[]`; `type EpisodeListView`; `episodeList(input: { episodes: EpisodeLike[]; openLogs: LogLike[] | undefined; now: Date }): EpisodeListView`.
- `components/illness/EpisodeVerdict.tsx`: `type QuickLogType`; `QuickLogButtons(props: { onLog: (type: QuickLogType) => void })`; `EpisodeVerdict(props: { view: VerdictView; onLog: (type: QuickLogType) => void })`.
- `components/illness/EpisodeDayList.tsx`: `EpisodeDayList(props: { rows: DayRowView[] })`.
- `components/ui/EmptyState.tsx`: thêm `detail?: string` và `action?: { label: string; onClick?: () => void; href?: string }`.
- **Vitest sau M2d:** 1821 test, 195 file. **Thực tế: 1825 test, 195 file** (+3 từ M2c, +1 từ bản sửa ở cuối plan này). Các plan sau (M2e–M2g) cộng 4 vào mọi con số test xanh của mình; số file không đổi.

---

### Task 1: Chữ của danh sách và của trang chi tiết: `lib/rules/illnessView.ts` (§6.2, §6.3)

**Files:**

- Create: `lib/rules/illnessView.ts`
- Test: `lib/rules/illnessView.test.ts` (mới)

**Interfaces:**

- Consumes (M2b): `feverStatus`, `statusTone`, `episodeVerdict`, `episodeDays`, `episodeDayCount`, `antipyreticTimes`, `formatCelsius`, `type EpisodeLike`, `type EpisodeTone`, `type Verdict`, `type DayLabel`. Từ M1a: `symptomShorts` (`lib/rules/symptomForm.ts`), `TRIAGE`. Sẵn có: `formatDayShort`, `formatDayFull`, `formatVnTime`, `vnDateString`, `hasFever`.
- Produces:
  - `episodeHref(id: string): string` = `/dot-om/chi-tiet?id={id}`
  - `whenText(at: number, now: Date): string`
  - `type SummaryRow = { label: string; when: string | null; value: string }`
  - `type VerdictView = { verdict: Verdict; sub: string; rows: SummaryRow[]; open: boolean }`
  - `verdictView(input: { episode: EpisodeLike; logs: LogLike[]; babyName: string; now: Date }): VerdictView`
  - `type DayRowView = { day: string; title: string; detail: string; chips: string[]; label: DayLabel | null }`
  - `dayRows(logs: LogLike[], episode: EpisodeLike, now: Date): DayRowView[]`
  - `type EpisodeListView = { open: { id: string; href: string; title: string; chip: { text: string; tone: EpisodeTone } | null } | null; past: { id: string; href: string; text: string }[] }`
  - `episodeList(input: { episodes: EpisodeLike[]; openLogs: LogLike[] | undefined; now: Date }): EpisodeListView`

- [x] **Step 0: Kiểm M2c đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f components/illness/FeverChart.tsx && echo "M2c có trên main"
git checkout -b feat/kim-bun-dot-om-m2d
bunx vitest run
```

Expected: dòng `M2c có trên main`; `Test Files  193 passed (193)`, `Tests  1798 passed (1798)`. Không thấy dòng đó thì dừng: M2c chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/illnessView.test.ts b/lib/rules/illnessView.test.ts
new file mode 100644
index 0000000..850f727
--- /dev/null
+++ b/lib/rules/illnessView.test.ts
@@ -0,0 +1,259 @@
+import { describe, expect, it } from "vitest";
+import type { LogLike } from "./describeLog";
+import type { EpisodeLike } from "./illness";
+import {
+  dayRows,
+  episodeHref,
+  episodeList,
+  verdictView,
+  whenText,
+} from "./illnessView";
+
+const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
+const iso = (text: string) => vn(text).toISOString();
+const episode = (
+  start: string,
+  end: string | null = null,
+  id = "ep1",
+): EpisodeLike => ({
+  id,
+  started_at: iso(start),
+  ended_at: end === null ? null : iso(end),
+});
+const at = (type: string, time: string, details: unknown): LogLike => ({
+  type,
+  started_at: iso(time),
+  ended_at: iso(time),
+  details,
+});
+const temp = (time: string, celsius: number) =>
+  at("temperature", time, { celsius, method: "nach" });
+const dose = (time: string) =>
+  at("medicine", time, {
+    name: "Hapacol",
+    amount: 2.5,
+    unit: "ml",
+    antipyretic: true,
+  });
+const symptom = (time: string, codes: string[]) =>
+  at("symptom", time, { codes });
+
+describe("whenText", () => {
+  const now = vn("2026-11-26 10:00");
+
+  it("says hôm nay for a time today, the date otherwise", () => {
+    expect(whenText(vn("2026-11-26 07:05").getTime(), now)).toBe(
+      "07:05 hôm nay",
+    );
+    expect(whenText(vn("2026-11-25 23:59").getTime(), now)).toBe("25/11 23:59");
+  });
+});
+
+describe("episodeHref", () => {
+  it("carries the id as a query parameter, so the page stays static", () => {
+    expect(episodeHref("ab-12")).toBe("/dot-om/chi-tiet?id=ab-12");
+  });
+});
+
+// Spec 2026-11-26 §6.3 item 2.
+describe("verdictView", () => {
+  const open = episode("2026-11-24 23:30");
+  const now = vn("2026-11-26 10:00");
+  const logs = [
+    temp("2026-11-24 23:40", 38.4),
+    temp("2026-11-25 15:00", 39.2),
+    temp("2026-11-26 07:05", 37.6),
+    dose("2026-11-25 15:10"),
+    dose("2026-11-26 02:00"),
+  ];
+
+  it("open: the verdict, the day and start, three rows, and it takes quick logs", () => {
+    expect(verdictView({ episode: open, logs, babyName: "Bun", now })).toEqual({
+      verdict: {
+        title: "Bun đã hết sốt 19 giờ",
+        tone: "good",
+        icon: "check",
+      },
+      sub: "Ngày thứ 3 · bắt đầu 24/11 lúc 23:30",
+      rows: [
+        { label: "Đo gần nhất", when: "07:05 hôm nay", value: "37,6°C" },
+        { label: "Sốt cao nhất", when: "25/11 15:00", value: "39,2°C" },
+        {
+          label: "Thuốc hạ sốt",
+          when: "gần nhất 02:00 hôm nay",
+          value: "2 liều",
+        },
+      ],
+      open: true,
+    });
+  });
+
+  it("nothing measured, nothing given", () => {
+    const view = verdictView({ episode: open, logs: [], babyName: "Bun", now });
+    expect(view.verdict.title).toBe("Chưa đo nhiệt độ");
+    expect(view.rows).toEqual([
+      { label: "Đo gần nhất", when: null, value: "Chưa đo" },
+      { label: "Sốt cao nhất", when: null, value: "Chưa đo" },
+      { label: "Thuốc hạ sốt", when: null, value: "Chưa dùng" },
+    ]);
+  });
+
+  it("measured but never from 38,0: Không sốt, with no time", () => {
+    const view = verdictView({
+      episode: open,
+      logs: [temp("2026-11-26 07:05", 37.6)],
+      babyName: "Bun",
+      now,
+    });
+    expect(view.rows[1]).toEqual({
+      label: "Sốt cao nhất",
+      when: null,
+      value: "Không sốt",
+    });
+  });
+
+  it("closed: Đã khỏi, its two dates, the same rows, no quick logs", () => {
+    const closed = episode("2026-11-24 23:30", "2026-11-26 08:00");
+    const view = verdictView({
+      episode: closed,
+      logs,
+      babyName: "Bun",
+      now: vn("2026-12-02 10:00"),
+    });
+    expect(view.verdict.title).toBe("Đã khỏi sau 3 ngày");
+    expect(view.sub).toBe("24/11 – 26/11");
+    expect(view.rows[0]).toEqual({
+      label: "Đo gần nhất",
+      when: "26/11 07:05",
+      value: "37,6°C",
+    });
+    expect(view.rows[2].when).toBe("gần nhất 26/11 02:00");
+    expect(view.open).toBe(false);
+  });
+});
+
+// Spec §6.3 item 4.
+describe("dayRows", () => {
+  const open = episode("2026-11-24 23:30");
+  const now = vn("2026-11-26 10:00");
+
+  it("titles, the line under them, chips in the content's order, the label", () => {
+    const rows = dayRows(
+      [
+        temp("2026-11-24 23:40", 38.4),
+        temp("2026-11-25 15:00", 39.2),
+        dose("2026-11-25 15:10"),
+        dose("2026-11-25 21:00"),
+        symptom("2026-11-25 08:00", ["fussy", "cough"]),
+        symptom("2026-11-25 20:00", ["runny_nose", "cough", "gone_code"]),
+      ],
+      open,
+      now,
+    );
+    expect(rows).toEqual([
+      {
+        day: "2026-11-26",
+        title: "Hôm nay · ngày 3",
+        detail: "Chưa đo · không dùng thuốc",
+        chips: [],
+        label: null,
+      },
+      {
+        day: "2026-11-25",
+        title: "25/11 · ngày 2",
+        detail: "Cao nhất 39,2°C · 2 liều hạ sốt",
+        // The content lists Sổ mũi, Ho, …, Quấy; a code it lost is left out.
+        chips: ["Sổ mũi", "Ho", "Quấy"],
+        label: { text: "Sốt cao", tone: "danger" },
+      },
+      {
+        day: "2026-11-24",
+        title: "24/11 · ngày 1",
+        detail: "Cao nhất 38,4°C · không dùng thuốc",
+        chips: [],
+        label: { text: "Sốt", tone: "warn" },
+      },
+    ]);
+  });
+
+  it("a day with medicine but no reading", () => {
+    const rows = dayRows([dose("2026-11-26 09:00")], open, now);
+    expect(rows[0].detail).toBe("Chưa đo · 1 liều hạ sốt");
+  });
+});
+
+// Spec §6.2.
+describe("episodeList", () => {
+  const now = vn("2026-11-26 10:00");
+  const open = episode("2026-11-24 23:30", null, "open");
+  const past = [
+    episode("2026-10-10 08:00", "2026-10-13 09:00", "oct"),
+    episode("2025-12-30 08:00", "2026-01-02 09:00", "newyear"),
+    episode("2026-11-01 08:00", "2026-11-01 20:00", "nov"),
+  ];
+
+  it("no episode at all", () => {
+    expect(episodeList({ episodes: [], openLogs: undefined, now })).toEqual({
+      open: null,
+      past: [],
+    });
+  });
+
+  it("the open episode: since when, which day, and a chip for its state", () => {
+    const chip = (logs: LogLike[] | undefined) =>
+      episodeList({ episodes: [open, ...past], openLogs: logs, now }).open;
+    expect(chip([temp("2026-11-26 09:00", 38.5)])).toEqual({
+      id: "open",
+      href: "/dot-om/chi-tiet?id=open",
+      title: "Từ 24/11 · ngày thứ 3",
+      chip: { text: "Đang sốt", tone: "warn" },
+    });
+    expect(chip([temp("2026-11-26 09:00", 39.5)])?.chip).toEqual({
+      text: "Đang sốt",
+      tone: "danger",
+    });
+    expect(chip([temp("2026-11-25 09:00", 38.5)])?.chip).toEqual({
+      text: "Chưa đo lại",
+      tone: "warn",
+    });
+    expect(
+      chip([temp("2026-11-25 09:00", 38.5), temp("2026-11-26 09:00", 37)])
+        ?.chip,
+    ).toEqual({ text: "Hết sốt", tone: "good" });
+    expect(chip([temp("2026-11-26 09:00", 37)])?.chip).toEqual({
+      text: "Không sốt",
+      tone: "good",
+    });
+    // Nothing measured, or the logs have not loaded: no chip.
+    expect(chip([])?.chip).toBeNull();
+    expect(chip(undefined)?.chip).toBeNull();
+  });
+
+  it("past episodes newest first, with the year on dates of another year", () => {
+    expect(
+      episodeList({ episodes: [...past, open], openLogs: [], now }).past,
+    ).toEqual([
+      {
+        id: "nov",
+        href: "/dot-om/chi-tiet?id=nov",
+        text: "01/11 – 01/11 · 1 ngày",
+      },
+      {
+        id: "oct",
+        href: "/dot-om/chi-tiet?id=oct",
+        text: "10/10 – 13/10 · 4 ngày",
+      },
+      {
+        id: "newyear",
+        href: "/dot-om/chi-tiet?id=newyear",
+        text: "30/12/2025 – 02/01 · 4 ngày",
+      },
+    ]);
+  });
+
+  it("only closed episodes: nothing is open", () => {
+    expect(episodeList({ episodes: past, openLogs: undefined, now }).open).toBe(
+      null,
+    );
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 193 passed (194)`, `Tests  1798 passed (1798)`. File test mới không nạp được vì `./illnessView` chưa có, nên 12 test của nó chưa được đếm.

- [x] **Step 3: Viết phần chữ (Patch 2)**

```diff
diff --git a/lib/rules/illnessView.ts b/lib/rules/illnessView.ts
new file mode 100644
index 0000000..1eb80a2
--- /dev/null
+++ b/lib/rules/illnessView.ts
@@ -0,0 +1,189 @@
+import { TRIAGE } from "@/lib/content/triage";
+import { formatDayFull, formatDayShort } from "./days";
+import type { LogLike } from "./describeLog";
+import {
+  antipyreticTimes,
+  type DayLabel,
+  type EpisodeLike,
+  episodeDayCount,
+  episodeDays,
+  type EpisodeTone,
+  episodeVerdict,
+  feverStatus,
+  formatCelsius,
+  statusTone,
+  type Verdict,
+} from "./illness";
+import { symptomShorts } from "./symptomForm";
+import { formatVnTime, vnDateString } from "./time";
+import { hasFever } from "./triage";
+
+// Spec 2026-11-26 §6: the words of the list and of an episode's page. The
+// rules themselves are in illness.ts.
+
+// Spec §6.1: the id travels as a query parameter, so both pages stay static
+// and work offline.
+export function episodeHref(id: string): string {
+  return `/dot-om/chi-tiet?id=${id}`;
+}
+
+const dayOf = (ms: number) => vnDateString(new Date(ms));
+const shortDay = (ms: number) => formatDayShort(dayOf(ms));
+
+// Spec §6.3: "{HH:mm} hôm nay" for a time today, "{dd/mm} {HH:mm}" otherwise.
+export function whenText(at: number, now: Date): string {
+  const time = formatVnTime(new Date(at));
+  return dayOf(at) === vnDateString(now)
+    ? `${time} hôm nay`
+    : `${shortDay(at)} ${time}`;
+}
+
+export type SummaryRow = {
+  label: string;
+  // The small time between the label and the value; null when there is none.
+  when: string | null;
+  value: string;
+};
+
+export type VerdictView = {
+  verdict: Verdict;
+  sub: string;
+  rows: SummaryRow[];
+  // An open episode has the three quick-log buttons.
+  open: boolean;
+};
+
+// Spec §6.3 item 2: the verdict card.
+export function verdictView(input: {
+  episode: EpisodeLike;
+  logs: LogLike[];
+  babyName: string;
+  now: Date;
+}): VerdictView {
+  const { episode, logs, babyName, now } = input;
+  const status = feverStatus(logs, episode, now);
+  const doses = antipyreticTimes(logs, episode, now);
+  const start = Date.parse(episode.started_at);
+  const { latest, peak } = status;
+  return {
+    verdict: episodeVerdict({ episode, status, babyName, now }),
+    sub: episode.ended_at
+      ? `${shortDay(start)} – ${shortDay(Date.parse(episode.ended_at))}`
+      : `Ngày thứ ${episodeDayCount(episode, now)} · bắt đầu ${shortDay(start)} lúc ${formatVnTime(new Date(start))}`,
+    rows: [
+      latest
+        ? {
+            label: "Đo gần nhất",
+            when: whenText(latest.at, now),
+            value: `${formatCelsius(latest.celsius)}°C`,
+          }
+        : { label: "Đo gần nhất", when: null, value: "Chưa đo" },
+      peak && hasFever(peak.celsius)
+        ? {
+            label: "Sốt cao nhất",
+            when: whenText(peak.at, now),
+            value: `${formatCelsius(peak.celsius)}°C`,
+          }
+        : {
+            label: "Sốt cao nhất",
+            when: null,
+            // Nothing measured is not the same as no fever.
+            value: peak ? "Không sốt" : "Chưa đo",
+          },
+      doses.length > 0
+        ? {
+            label: "Thuốc hạ sốt",
+            when: `gần nhất ${whenText(doses[doses.length - 1], now)}`,
+            value: `${doses.length} liều`,
+          }
+        : { label: "Thuốc hạ sốt", when: null, value: "Chưa dùng" },
+    ],
+    open: episode.ended_at === null,
+  };
+}
+
+export type DayRowView = {
+  day: string;
+  title: string;
+  detail: string;
+  // Short names of the day's symptoms, in the content's order.
+  chips: string[];
+  label: DayLabel | null;
+};
+
+// Spec §6.3 item 4: one row per day, newest first.
+export function dayRows(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): DayRowView[] {
+  const today = vnDateString(now);
+  return episodeDays(logs, episode, now).map((row) => ({
+    day: row.day,
+    title: `${row.day === today ? "Hôm nay" : formatDayShort(row.day)} · ngày ${row.n}`,
+    detail: [
+      row.peak === null ? "Chưa đo" : `Cao nhất ${formatCelsius(row.peak)}°C`,
+      row.doses > 0 ? `${row.doses} liều hạ sốt` : "không dùng thuốc",
+    ].join(" · "),
+    chips: symptomShorts(row.codes, TRIAGE.symptoms),
+    label: row.label,
+  }));
+}
+
+const CHIP_TEXT = {
+  fever: "Đang sốt",
+  stale: "Chưa đo lại",
+  cleared: "Hết sốt",
+  none: "Không sốt",
+} as const;
+
+export type EpisodeListView = {
+  open: {
+    id: string;
+    href: string;
+    title: string;
+    chip: { text: string; tone: EpisodeTone } | null;
+  } | null;
+  past: { id: string; href: string; text: string }[];
+};
+
+// Spec §6.2: the list page. `openLogs` are the logs of the open episode
+// (useRangeLogs); undefined until they have loaded, and then there is no chip.
+export function episodeList(input: {
+  episodes: EpisodeLike[];
+  openLogs: LogLike[] | undefined;
+  now: Date;
+}): EpisodeListView {
+  const { episodes, openLogs, now } = input;
+  const year = vnDateString(now).slice(0, 4);
+  // Spec §6.2: a date of another year is written with its year.
+  const date = (iso: string) => {
+    const day = dayOf(Date.parse(iso));
+    return day.startsWith(year) ? formatDayShort(day) : formatDayFull(day);
+  };
+  const current = episodes.find((episode) => episode.ended_at === null);
+  let open: EpisodeListView["open"] = null;
+  if (current) {
+    const status = openLogs ? feverStatus(openLogs, current, now) : null;
+    open = {
+      id: current.id,
+      href: episodeHref(current.id),
+      title: `Từ ${shortDay(Date.parse(current.started_at))} · ngày thứ ${episodeDayCount(current, now)}`,
+      chip:
+        status && status.kind !== "unmeasured"
+          ? { text: CHIP_TEXT[status.kind], tone: statusTone(status) }
+          : null,
+    };
+  }
+  return {
+    open,
+    past: episodes
+      .filter((episode) => episode.ended_at !== null)
+      .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))
+      .map((episode) => ({
+        id: episode.id,
+        href: episodeHref(episode.id),
+        text: `${date(episode.started_at)} – ${date(String(episode.ended_at))} · ${episodeDayCount(episode, now)} ngày`,
+      })),
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  194 passed (194)`, `Tests  1810 passed (1810)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/illnessView.ts lib/rules/illnessView.test.ts
git commit -m "feat(illness): the words of the list and the episode page" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Thẻ kết luận, ba nút ghi nhanh, danh sách từng ngày (§6.3 mục 2 và 4)

**Files:**

- Create: `components/illness/EpisodeVerdict.tsx`, `components/illness/EpisodeDayList.tsx`
- Test: `components/illness/episodecards.test.tsx` (mới)

**Interfaces:**

- Consumes: `VerdictView`, `DayRowView` (Task 1); `EpisodeTone` (M2b); `Button`, `Icon`, `StatusChip`, `cx` sẵn có.
- Produces:
  - `type QuickLogType = "temperature" | "medicine" | "symptom"`
  - `QuickLogButtons(props: { onLog: (type: QuickLogType) => void })`: ba nút "Nhiệt độ", "Thuốc", "Triệu chứng". M3 dùng lại cho thẻ ở Hôm nay.
  - `EpisodeVerdict(props: { view: VerdictView; onLog: (type: QuickLogType) => void })`
  - `EpisodeDayList(props: { rows: DayRowView[] })`

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/illness/episodecards.test.tsx b/components/illness/episodecards.test.tsx
new file mode 100644
index 0000000..d9b5017
--- /dev/null
+++ b/components/illness/episodecards.test.tsx
@@ -0,0 +1,159 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import type { DayRowView, VerdictView } from "@/lib/rules/illnessView";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { EpisodeDayList } from "./EpisodeDayList";
+import { EpisodeVerdict, QuickLogButtons } from "./EpisodeVerdict";
+
+const view = (over: Partial<VerdictView> = {}): VerdictView => ({
+  verdict: { title: "Bun đã hết sốt 19 giờ", tone: "good", icon: "check" },
+  sub: "Ngày thứ 3 · bắt đầu 24/11 lúc 23:30",
+  rows: [
+    { label: "Đo gần nhất", when: "07:05 hôm nay", value: "37,6°C" },
+    { label: "Sốt cao nhất", when: "25/11 15:00", value: "39,2°C" },
+    { label: "Thuốc hạ sốt", when: "gần nhất 02:00 hôm nay", value: "2 liều" },
+  ],
+  open: true,
+  ...over,
+});
+const card = (over: Partial<VerdictView> = {}) =>
+  renderToStaticMarkup(<EpisodeVerdict view={view(over)} onLog={() => {}} />);
+
+// Spec 2026-11-26 §6.3 item 2.
+describe("EpisodeVerdict", () => {
+  it("heads the card with a round icon, the verdict and the line under it", () => {
+    const html = card();
+    expect(html).toContain("glass");
+    expect(html).toMatch(
+      /size-11[^"]*rounded-full[^"]*bg-good-soft text-good-ink/,
+    );
+    expect(html).toContain(`d="${ICON_PATHS.check}"`);
+    expect(html).toContain(">Bun đã hết sốt 19 giờ</h2>");
+    expect(html).toContain(">Ngày thứ 3 · bắt đầu 24/11 lúc 23:30</span>");
+  });
+
+  it("the tone and the icon both change with the verdict", () => {
+    const fever = card({
+      verdict: { title: "Bun đang sốt 39,4°C", tone: "danger", icon: "thermo" },
+    });
+    expect(fever).toContain("bg-danger-soft text-danger-ink");
+    expect(fever).toContain(`d="${ICON_PATHS.thermo}"`);
+    const stale = card({
+      verdict: { title: "Chưa đo lại sau 38,6°C", tone: "warn", icon: "clock" },
+    });
+    expect(stale).toContain("bg-warn-soft text-warn-ink");
+    expect(stale).toContain(`d="${ICON_PATHS.clock}"`);
+    const none = card({
+      verdict: { title: "Chưa đo nhiệt độ", tone: "neutral", icon: "thermo" },
+    });
+    expect(none).toContain("bg-line text-ink");
+  });
+
+  it("three rows: label, a small time, the value in bold", () => {
+    const html = card();
+    for (const text of ["Đo gần nhất", "Sốt cao nhất", "Thuốc hạ sốt"])
+      expect(html).toContain(`>${text}</span>`);
+    expect(html).toMatch(/text-\[13px\][^>]*text-muted[^>]*>07:05 hôm nay</);
+    expect(html).toMatch(/font-bold[^>]*>37,6°C</);
+    expect(html).toContain(">gần nhất 02:00 hôm nay</span>");
+    expect(html.match(/min-h-11[^"]*border-b/g)).toHaveLength(3);
+    expect(html).not.toContain("truncate");
+  });
+
+  it("a row without a time has only its value", () => {
+    const html = card({
+      rows: [
+        { label: "Đo gần nhất", when: null, value: "Chưa đo" },
+        { label: "Sốt cao nhất", when: null, value: "Chưa đo" },
+        { label: "Thuốc hạ sốt", when: null, value: "Chưa dùng" },
+      ],
+    });
+    expect(html).toContain(">Chưa dùng</span>");
+    expect(html.match(/text-\[13px\][^>]*text-muted/g)).toHaveLength(1);
+  });
+
+  it("an open episode has the three quick logs; a closed one has none", () => {
+    expect(card().match(/<button/g)).toHaveLength(3);
+    expect(card({ open: false })).not.toContain("<button");
+  });
+});
+
+describe("QuickLogButtons", () => {
+  it("three buttons of at least 44 px that name their log type", () => {
+    const html = renderToStaticMarkup(<QuickLogButtons onLog={() => {}} />);
+    expect(html).toContain("grid grid-cols-3 gap-2");
+    expect(html.match(/<button[^>]*min-h-11/g)).toHaveLength(3);
+    for (const text of ["Nhiệt độ", "Thuốc", "Triệu chứng"])
+      expect(html).toContain(`>${text}</button>`);
+    // "Triệu chứng" needs the room: narrower padding and 14 px text.
+    expect(html.match(/px-1! text-sm!/g)).toHaveLength(3);
+  });
+
+  it("each button opens the sheet of its type", () => {
+    const onLog = vi.fn();
+    const buttons = findElements(
+      QuickLogButtons({ onLog }),
+      (el) => typeof el.props.onClick === "function",
+    );
+    expect(buttons).toHaveLength(3);
+    for (const button of buttons) (button.props.onClick as () => void)();
+    expect(onLog.mock.calls).toEqual([
+      ["temperature"],
+      ["medicine"],
+      ["symptom"],
+    ]);
+  });
+});
+
+// Spec §6.3 item 4.
+describe("EpisodeDayList", () => {
+  const rows: DayRowView[] = [
+    {
+      day: "2026-11-26",
+      title: "Hôm nay · ngày 3",
+      detail: "Chưa đo · không dùng thuốc",
+      chips: [],
+      label: null,
+    },
+    {
+      day: "2026-11-25",
+      title: "25/11 · ngày 2",
+      detail: "Cao nhất 39,2°C · 2 liều hạ sốt",
+      chips: ["Sổ mũi", "Ho", "Quấy"],
+      label: { text: "Sốt cao", tone: "danger" },
+    },
+    {
+      day: "2026-11-24",
+      title: "24/11 · ngày 1",
+      detail: "Cao nhất 38,4°C · không dùng thuốc",
+      chips: [],
+      label: { text: "Sốt", tone: "warn" },
+    },
+  ];
+  const html = renderToStaticMarkup(<EpisodeDayList rows={rows} />);
+  const items = html.split("<li").slice(1);
+
+  it("a titled list with one row per day, none of them a link or a button", () => {
+    expect(html).toContain(">Từng ngày</h2>");
+    expect(items).toHaveLength(3);
+    expect(html).not.toContain("<a ");
+    expect(html).not.toContain("<button");
+    expect(html).not.toContain("truncate");
+  });
+
+  it("the label shares a line with the title only, so the line under it has the full width", () => {
+    expect(items[1]).toMatch(
+      />25\/11 · ngày 2<\/span><span class="[^"]*bg-danger-soft text-danger-ink[^"]*">Sốt cao<\/span><\/div>/,
+    );
+    expect(items[1]).toContain(">Cao nhất 39,2°C · 2 liều hạ sốt</span>");
+    expect(items[2]).toContain("bg-warn-soft text-warn-ink");
+  });
+
+  it("symptom chips are neutral and only there when the day has symptoms", () => {
+    expect(items[1].match(/bg-line text-ink/g)).toHaveLength(3);
+    expect(items[1]).toContain(">Quấy</span>");
+    expect(items[0]).not.toContain("bg-line text-ink");
+    expect(items[0]).not.toContain("rounded-full");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 194 passed (195)`, `Tests  1810 passed (1810)`. File test mới không nạp được vì hai component chưa có, nên 10 test của nó chưa được đếm.

- [x] **Step 3: Viết ba component (Patch 4)**

```diff
diff --git a/components/illness/EpisodeDayList.tsx b/components/illness/EpisodeDayList.tsx
new file mode 100644
index 0000000..f451419
--- /dev/null
+++ b/components/illness/EpisodeDayList.tsx
@@ -0,0 +1,40 @@
+import { StatusChip } from "@/components/ui/StatusChip";
+import type { DayRowView } from "@/lib/rules/illnessView";
+
+// Spec 2026-11-26 §6.3 item 4: one row per day of the episode, newest first.
+// The rows open nothing. The label sits beside the title only, so the line
+// under it keeps the full width of the row.
+export function EpisodeDayList({ rows }: { rows: DayRowView[] }) {
+  return (
+    <section className="flex flex-col gap-2.5">
+      <h2 className="mx-1 text-xl font-bold text-ink">Từng ngày</h2>
+      <ul className="glass overflow-hidden rounded-[26px]">
+        {rows.map((row) => (
+          <li
+            key={row.day}
+            className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0"
+          >
+            <div className="flex items-start gap-2">
+              <span className="flex-1 text-base font-semibold text-ink">
+                {row.title}
+              </span>
+              {row.label && (
+                <StatusChip tone={row.label.tone}>{row.label.text}</StatusChip>
+              )}
+            </div>
+            <span className="text-[15px] text-ink">{row.detail}</span>
+            {row.chips.length > 0 && (
+              <div className="flex flex-wrap gap-1.5">
+                {row.chips.map((chip) => (
+                  <StatusChip key={chip} tone="neutral">
+                    {chip}
+                  </StatusChip>
+                ))}
+              </div>
+            )}
+          </li>
+        ))}
+      </ul>
+    </section>
+  );
+}
diff --git a/components/illness/EpisodeVerdict.tsx b/components/illness/EpisodeVerdict.tsx
new file mode 100644
index 0000000..2fd5c81
--- /dev/null
+++ b/components/illness/EpisodeVerdict.tsx
@@ -0,0 +1,99 @@
+import { Button } from "@/components/ui/Button";
+import { Icon } from "@/components/ui/Icon";
+import type { EpisodeTone } from "@/lib/rules/illness";
+import type { VerdictView } from "@/lib/rules/illnessView";
+import { cx } from "@/lib/ui/cx";
+
+export type QuickLogType = "temperature" | "medicine" | "symptom";
+
+const QUICK_LOGS: { type: QuickLogType; label: string }[] = [
+  { type: "temperature", label: "Nhiệt độ" },
+  { type: "medicine", label: "Thuốc" },
+  { type: "symptom", label: "Triệu chứng" },
+];
+
+// Spec 2026-11-26 §6.3 and §7.1: the three quick logs of an open episode.
+// A third of a card is about 98 px at 375 px, and "Triệu chứng" is 82 px wide
+// at 14 px: hence the narrow padding and the smaller text.
+export function QuickLogButtons({
+  onLog,
+}: {
+  onLog: (type: QuickLogType) => void;
+}) {
+  return (
+    <div className="grid grid-cols-3 gap-2">
+      {QUICK_LOGS.map((item) => (
+        <Button
+          key={item.type}
+          variant="secondary"
+          size="md"
+          className="px-1! text-sm!"
+          onClick={() => onLog(item.type)}
+        >
+          {item.label}
+        </Button>
+      ))}
+    </div>
+  );
+}
+
+// The round icon behind the verdict. The icon changes with the verdict too,
+// so the states still differ in theme night, which has one hue.
+const TONE: Record<EpisodeTone, string> = {
+  good: "bg-good-soft text-good-ink",
+  warn: "bg-warn-soft text-warn-ink",
+  danger: "bg-danger-soft text-danger-ink",
+  neutral: "bg-line text-ink",
+};
+
+// Spec §6.3 item 2: the verdict card of an episode's page.
+export function EpisodeVerdict({
+  view,
+  onLog,
+}: {
+  view: VerdictView;
+  onLog: (type: QuickLogType) => void;
+}) {
+  const { verdict } = view;
+  return (
+    <section className="glass flex flex-col gap-3.5 rounded-[26px] p-4">
+      <div className="flex items-center gap-3">
+        <span
+          className={cx(
+            "flex size-11 shrink-0 items-center justify-center rounded-full",
+            TONE[verdict.tone],
+          )}
+        >
+          <Icon name={verdict.icon} size={22} />
+        </span>
+        <div className="flex min-w-0 flex-col">
+          <h2 className="text-xl leading-[26px] font-bold text-ink">
+            {verdict.title}
+          </h2>
+          <span className="text-[13px] leading-[18px] text-muted">
+            {view.sub}
+          </span>
+        </div>
+      </div>
+      <div className="flex flex-col border-t border-line">
+        {view.rows.map((row) => (
+          <div
+            key={row.label}
+            className="flex min-h-11 items-center gap-2 border-b border-line last:border-b-0"
+          >
+            <span className="flex-1 text-[15px] text-ink">{row.label}</span>
+            {row.when && (
+              <span className="text-[13px] whitespace-nowrap text-muted">
+                {row.when}
+              </span>
+            )}
+            <span className="text-base font-bold whitespace-nowrap text-ink tabular-nums">
+              {row.value}
+            </span>
+          </div>
+        ))}
+      </div>
+      {view.open && <QuickLogButtons onLog={onLog} />}
+    </section>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  195 passed (195)`, `Tests  1820 passed (1820)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/illness/EpisodeVerdict.tsx components/illness/EpisodeDayList.tsx components/illness/episodecards.test.tsx
git commit -m "feat(illness): the verdict card and the day list" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: `EmptyState` có dòng phụ và hành động là đường dẫn (§6.2, §6.3)

**Files:**

- Modify: `components/ui/EmptyState.tsx`
- Test: `components/ui/states.test.tsx`

**Interfaces:**

- Consumes: `Button`, `buttonClass` (`components/ui/Button.tsx`); `Icon`; `Link` của Next.
- Produces: `EmptyState(props: { icon: IconName; text: string; detail?: string; action?: { label: string; onClick?: () => void; href?: string } })`. Có `href` thì hành động là một đường dẫn mang dáng nút phụ; không thì là nút gọi `onClick` như trước. Ba nơi đang dùng (`GrowthScreen`, `HistoryScreen`, `PhotosScreen`) không phải đổi.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/ui/states.test.tsx b/components/ui/states.test.tsx
index e318fa7..405d862 100644
--- a/components/ui/states.test.tsx
+++ b/components/ui/states.test.tsx
@@ -35,6 +35,34 @@ describe("EmptyState", () => {
       renderToStaticMarkup(<EmptyState icon="list" text="Trống." />),
     ).not.toContain("<button");
   });
+
+  // Spec 2026-11-26 §6.2 and §6.3.
+  it("takes a second, smaller line and an action that is a link", () => {
+    const html = renderToStaticMarkup(
+      <EmptyState
+        icon="calendar"
+        text="Chưa có đợt ốm nào"
+        detail="Khi bé ốm, mở một đợt."
+        action={{ label: "Về danh sách", href: "/dot-om" }}
+      />,
+    );
+    expect(html).toContain(">Chưa có đợt ốm nào</p>");
+    expect(html).toContain(
+      '<p class="text-[13px] leading-[18px] text-muted">Khi bé ốm, mở một đợt.</p>',
+    );
+    expect(html.indexOf("Chưa có đợt ốm nào")).toBeLessThan(
+      html.indexOf("Khi bé ốm, mở một đợt."),
+    );
+    expect(html).toMatch(/<a[^>]*href="\/dot-om"[^>]*>Về danh sách<\/a>/);
+    expect(html).toMatch(/<a[^>]*class="[^"]*glass[^"]*min-h-11/);
+    expect(html).not.toContain("<button");
+    // Without the second line there is no empty paragraph.
+    expect(
+      renderToStaticMarkup(<EmptyState icon="list" text="Trống." />).match(
+        /<p /g,
+      ),
+    ).toHaveLength(1);
+  });
 });

 describe("ErrorCard", () => {
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 194 passed (195)`, `Tests  1 failed | 1820 passed (1821)`. Một test mới đỏ: `EmptyState` chưa vẽ dòng phụ và chưa biết `href`.

- [x] **Step 3: Mở rộng `EmptyState` (Patch 6)**

```diff
diff --git a/components/ui/EmptyState.tsx b/components/ui/EmptyState.tsx
index 51e9b20..bdec4d3 100644
--- a/components/ui/EmptyState.tsx
+++ b/components/ui/EmptyState.tsx
@@ -1,26 +1,43 @@
+import Link from "next/link";
 import type { IconName } from "@/lib/ui/icons";
-import { Button } from "./Button";
+import { Button, buttonClass } from "./Button";
 import { Icon } from "./Icon";

 // Spec §10: an empty list — a 40 px muted icon, one sentence, and an action.
+// Spec 2026-11-26 §6.2 and §6.3: optionally a second, smaller line, and an
+// action that leads to another page.
 export function EmptyState({
   icon,
   text,
+  detail,
   action,
 }: {
   icon: IconName;
   text: string;
-  action?: { label: string; onClick: () => void };
+  detail?: string;
+  // With `href` the action is a link; otherwise a button that calls onClick.
+  action?: { label: string; onClick?: () => void; href?: string };
 }) {
   return (
     <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
       <Icon name={icon} size={40} strokeWidth={1.6} className="text-muted" />
       <p className="text-base text-muted">{text}</p>
-      {action && (
-        <Button variant="secondary" size="md" onClick={action.onClick}>
-          {action.label}
-        </Button>
+      {detail && (
+        <p className="text-[13px] leading-[18px] text-muted">{detail}</p>
       )}
+      {action &&
+        (action.href !== undefined ? (
+          <Link
+            href={action.href}
+            className={buttonClass({ variant: "secondary", size: "md" })}
+          >
+            {action.label}
+          </Link>
+        ) : (
+          <Button variant="secondary" size="md" onClick={action.onClick}>
+            {action.label}
+          </Button>
+        ))}
     </div>
   );
 }
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  195 passed (195)`, `Tests  1821 passed (1821)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/ui/EmptyState.tsx components/ui/states.test.tsx
git commit -m "feat(ui): EmptyState with a second line and a link" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M2d, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-illness/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M2d.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  195 passed (195)`, `Tests  1821 passed (1821)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm**

Thẻ kết luận và danh sách từng ngày chưa nằm trên trang nào, và dữ liệu thật chưa có đợt ốm nào: năm trạng thái của §5.2, đợt đã đóng, các dòng dài nhất và hai trạng thái trống mới chỉ thấy được ở đây. Trang này không đọc hay ghi dữ liệu của gia đình và vẽ được khi chưa đăng nhập. Tạo `app/fixture-illness/page.tsx` (không commit):

```tsx
"use client";

import { EpisodeDayList } from "@/components/illness/EpisodeDayList";
import { EpisodeVerdict } from "@/components/illness/EpisodeVerdict";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LogLike } from "@/lib/rules/describeLog";
import type { EpisodeLike } from "@/lib/rules/illness";
import { dayRows, verdictView } from "@/lib/rules/illnessView";

// Giờ cố định, để máy chủ và trình duyệt vẽ giống nhau.
const NOW = new Date("2026-11-26T10:00:00+07:00");
const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const episode = (start: string, end: string | null = null): EpisodeLike => ({
  id: "fixture",
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
});
const at = (type: string, time: string, details: unknown): LogLike => ({
  type,
  started_at: iso(time),
  ended_at: iso(time),
  details,
});
const temp = (time: string, celsius: number) =>
  at("temperature", time, { celsius, method: "nach" });
const dose = (time: string) =>
  at("medicine", time, {
    name: "Hapacol",
    amount: 2.5,
    unit: "ml",
    antipyretic: true,
  });
const symptom = (time: string, codes: string[]) =>
  at("symptom", time, { codes });

const THREE_DAYS = episode("2026-11-24 20:10");
const THREE_DAYS_LOGS = [
  temp("2026-11-24 20:10", 38.6),
  temp("2026-11-24 23:00", 38.1),
  temp("2026-11-25 02:15", 39.2),
  temp("2026-11-25 05:00", 38.3),
  temp("2026-11-25 09:30", 38),
  temp("2026-11-25 14:00", 38.9),
  temp("2026-11-25 16:10", 38),
  temp("2026-11-25 21:00", 38.4),
  temp("2026-11-26 02:30", 37.9),
  temp("2026-11-26 07:05", 37.6),
  dose("2026-11-24 20:20"),
  dose("2026-11-25 02:20"),
  dose("2026-11-25 14:05"),
  dose("2026-11-25 20:05"),
  symptom("2026-11-24 21:00", ["fever", "runny_nose"]),
  symptom("2026-11-25 08:00", ["fever", "runny_nose", "cough", "fussy"]),
  symptom("2026-11-26 08:00", ["runny_nose", "cough"]),
];

// Thẻ kết luận: năm trạng thái của đợt đang mở, rồi một đợt đã đóng.
const VERDICTS: { name: string; episode: EpisodeLike; logs: LogLike[] }[] = [
  { name: "unmeasured", episode: THREE_DAYS, logs: [] },
  {
    name: "fever, từ 39",
    episode: THREE_DAYS,
    logs: [temp("2026-11-26 09:10", 39.4), dose("2026-11-26 09:15")],
  },
  {
    name: "fever, dưới 39",
    episode: THREE_DAYS,
    logs: [temp("2026-11-26 09:10", 38.2)],
  },
  {
    name: "stale",
    episode: THREE_DAYS,
    logs: [temp("2026-11-25 21:00", 38.6)],
  },
  { name: "cleared", episode: THREE_DAYS, logs: THREE_DAYS_LOGS },
  { name: "none", episode: THREE_DAYS, logs: [temp("2026-11-26 09:10", 37.1)] },
  {
    name: "none, dưới 35,5",
    episode: THREE_DAYS,
    logs: [temp("2026-11-26 09:10", 35.2)],
  },
  {
    name: "cleared, tiêu đề dài nhất và 12 liều hôm nay",
    episode: THREE_DAYS,
    logs: [
      temp("2026-11-26 09:10", 38.5),
      temp("2026-11-26 09:40", 37.4),
      ...Array.from({ length: 12 }, (_, index) =>
        dose(
          `2026-11-26 ${String(index % 10).padStart(2, "0")}:${index < 10 ? "05" : "45"}`,
        ),
      ),
    ],
  },
  {
    name: "đã đóng",
    episode: episode("2026-11-10 08:00", "2026-11-13 09:00"),
    logs: [
      temp("2026-11-10 09:00", 38.8),
      temp("2026-11-12 09:00", 37.2),
      dose("2026-11-10 09:05"),
      dose("2026-11-10 15:00"),
      dose("2026-11-10 21:00"),
      dose("2026-11-11 03:00"),
      dose("2026-11-11 09:00"),
      dose("2026-11-11 15:00"),
      dose("2026-11-11 21:00"),
      dose("2026-11-12 03:00"),
      dose("2026-11-12 09:05"),
      dose("2026-11-12 15:00"),
      dose("2026-11-12 21:00"),
      dose("2026-11-13 03:00"),
    ],
  },
];

const LONG_DAYS = [
  ...THREE_DAYS_LOGS,
  ...Array.from({ length: 12 }, (_, index) =>
    dose(`2026-11-25 ${String(index * 2).padStart(2, "0")}:30`),
  ),
  symptom("2026-11-25 22:00", [
    "wheeze",
    "spit_up",
    "vomit",
    "diarrhoea",
    "white_mouth",
    "hand_foot_spots",
  ]),
];

const CASE = "px-1 text-[13px] text-muted";

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">
        Fixture thẻ kết luận, từng ngày, trạng thái trống
      </p>
      {VERDICTS.map((item) => (
        <div
          key={item.name}
          data-case={item.name}
          className="flex flex-col gap-1"
        >
          <span className={CASE}>Thẻ kết luận · {item.name}</span>
          <EpisodeVerdict
            view={verdictView({
              episode: item.episode,
              logs: item.logs,
              babyName: "Bun",
              now: NOW,
            })}
            onLog={() => {}}
          />
        </div>
      ))}
      <div data-case="days" className="flex flex-col gap-1">
        <span className={CASE}>Từng ngày · 3 ngày</span>
        <EpisodeDayList rows={dayRows(THREE_DAYS_LOGS, THREE_DAYS, NOW)} />
      </div>
      <div data-case="days-long" className="flex flex-col gap-1">
        <span className={CASE}>Từng ngày · dòng dài nhất, nhiều chip</span>
        <EpisodeDayList rows={dayRows(LONG_DAYS, THREE_DAYS, NOW)} />
      </div>
      <div data-case="missing">
        <EmptyState
          icon="calendar"
          text="Không tìm thấy đợt ốm này"
          action={{ label: "Về danh sách", href: "/fixture-illness" }}
        />
      </div>
      <div data-case="empty">
        <EmptyState
          icon="calendar"
          text="Chưa có đợt ốm nào"
          detail="Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ."
          action={{ label: "Bắt đầu đợt ốm", onClick: () => {} }}
        />
      </div>
    </main>
  );
}
```

Run: `bun run typecheck`
Expected: `tsc --noEmit` không báo lỗi.

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở `http://localhost:3000/fixture-illness` trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp.

1. Trang có chín thẻ kết luận, hai danh sách "Từng ngày", rồi hai khối trạng thái trống. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
2. **Chín thẻ kết luận**, mỗi thẻ có icon tròn, tiêu đề, dòng phụ và ba hàng. So từng thẻ với bảng dưới (giờ của trang là 10:00 ngày 26/11):

   | Khối                                         | Tiêu đề                       | Icon và tông         | Ba giá trị bên phải            |
   | -------------------------------------------- | ----------------------------- | -------------------- | ------------------------------ |
   | unmeasured                                   | Chưa đo nhiệt độ              | nhiệt kế, trung tính | Chưa đo · Chưa đo · Chưa dùng  |
   | fever, từ 39                                 | Bun đang sốt 39,4°C           | nhiệt kế, đỏ         | 39,4°C · 39,4°C · 1 liều       |
   | fever, dưới 39                               | Bun đang sốt 38,2°C           | nhiệt kế, vàng       | 38,2°C · 38,2°C · Chưa dùng    |
   | stale                                        | Chưa đo lại sau 38,6°C        | đồng hồ, vàng        | 38,6°C · 38,6°C · Chưa dùng    |
   | cleared                                      | Bun đã hết sốt 13 giờ         | dấu tích, xanh       | 37,6°C · 39,2°C · 4 liều       |
   | none                                         | Bun không sốt                 | dấu tích, xanh       | 37,1°C · Không sốt · Chưa dùng |
   | none, dưới 35,5                              | Bun không sốt                 | nhiệt kế, trung tính | 35,2°C · Không sốt · Chưa dùng |
   | cleared, tiêu đề dài nhất và 12 liều hôm nay | Bun đã hết sốt chưa đầy 1 giờ | dấu tích, xanh       | 37,4°C · 38,5°C · 12 liều      |
   | đã đóng                                      | Đã khỏi sau 4 ngày            | dấu tích, xanh       | 37,2°C · 38,8°C · 12 liều      |

   Dòng phụ của tám thẻ đầu: "Ngày thứ 3 · bắt đầu 24/11 lúc 20:10"; của thẻ đã đóng: "10/11 – 13/11". Thẻ "cleared" có các giờ "07:05 hôm nay", "25/11 02:15", "gần nhất 25/11 20:05". Thẻ "tiêu đề dài nhất" có hàng "Thuốc hạ sốt" ghi "gần nhất 09:05 hôm nay" và "12 liều" trên một dòng. Thẻ đã đóng có "gần nhất 13/11 03:00" và **không** có ba nút.

3. Không chữ nào bị cắt "…". Chạy đoạn đo dưới: mọi hàng của thẻ kết luận cao 44 px (một dòng), mọi tiêu đề một dòng trừ tiêu đề dài nhất "Bun đã hết sốt chưa đầy 1 giờ", vốn hai dòng ở 375 và 390 px và một dòng ở 440 px (tiêu đề được phép xuống hai dòng; sửa khi chạy: bản viết plan ghi "mọi tiêu đề một dòng ở 375 px" vì dữ liệu fixture lúc đó chưa vẽ ra tiêu đề dài nhất, xem kết quả dưới Step 4), và chữ của ba nút nằm trọn trong nút (đo khi viết plan: nút rộng 97,7 px, chữ "Triệu chứng" 80,1 px, nút cao 44 px).

```js
const lines = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return new Set([...range.getClientRects()].map((r) => Math.round(r.top)))
    .size;
};
JSON.stringify({
  rowHeights: [
    ...new Set(
      [
        ...document.querySelectorAll("[data-case] section .min-h-11.border-b"),
      ].map((el) => Math.round(el.getBoundingClientRect().height)),
    ),
  ],
  titlesOnTwoLines: [
    ...document.querySelectorAll("[data-case] section h2.text-xl"),
  ]
    .filter((el) => lines(el) > 1)
    .map((el) => el.textContent),
  buttons: [
    ...document.querySelectorAll("[data-case] .grid.grid-cols-3 button"),
  ]
    .slice(0, 3)
    .map((button) => {
      const range = document.createRange();
      range.selectNodeContents(button);
      const box = button.getBoundingClientRect();
      return `${button.textContent}: chữ ${range.getBoundingClientRect().width.toFixed(1)} trong nút ${box.width.toFixed(1)} × ${box.height}`;
    }),
  days: [...document.querySelectorAll("[data-case^=days] li")].map((li) =>
    [...li.querySelectorAll(":scope > span, :scope > div > span.flex-1")]
      .map((el) => `${el.textContent}: ${lines(el)} dòng`)
      .join(" | "),
  ),
});
```

4. **"Từng ngày · 3 ngày":** tiêu đề mục "Từng ngày"; ba hàng, mới nhất trước: "Hôm nay · ngày 3" với "Cao nhất 37,9°C · không dùng thuốc" và nhãn "Hết sốt"; "25/11 · ngày 2" với "Cao nhất 39,2°C · 3 liều hạ sốt" và nhãn "Sốt cao"; "24/11 · ngày 1" với "Cao nhất 38,6°C · 1 liều hạ sốt" và nhãn "Sốt". Nhãn đứng cùng dòng với tiêu đề của hàng; dòng mô tả một dòng; hàng 25/11 có bốn chip theo thứ tự Sốt, Sổ mũi, Ho, Quấy, hàng hôm nay có Sổ mũi, Ho. Hàng không bấm được (không phải nút hay đường dẫn).
5. **"Từng ngày · dòng dài nhất, nhiều chip":** hàng "25/11 · ngày 2" ghi "Cao nhất 39,2°C · 15 liều hạ sốt" trên một dòng; các chip xuống thành nhiều hàng, không chip nào tràn khỏi thẻ hay bị cắt.
6. **Khối "missing":** icon lịch, câu "Không tìm thấy đợt ốm này", và "Về danh sách" là một đường dẫn (`<a>`) mang dáng nút, cao ít nhất 44 px. **Khối "empty":** câu "Chưa có đợt ốm nào", dưới nó dòng nhỏ hơn "Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ." (được xuống dòng, không bị cắt), rồi nút "Bắt đầu đợt ốm" cao ít nhất 44 px. Nút ở đây không làm gì.
7. Lặp lại các mục trên trang tạm với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"` (chạy trong trang; không lưu, không đụng Cài đặt). Ở `night` (một tông màu): ba loại thẻ vẫn phân biệt được bằng icon (nhiệt kế, đồng hồ, dấu tích) và bằng chữ của tiêu đề; nhãn của ngày phân biệt bằng chữ.
8. Đặt bề ngang 390 rồi 440 và chạy lại đoạn đo của mục 3.

Trang thật (chỉ xem): `EmptyState` đang dùng ở ba trang. Mở `http://localhost:3000/tang-truong`, `/nhat-ky` và `/anh`: trang nào đang ở trạng thái trống thì câu và nút của nó vẫn như trước; trang đang có dữ liệu thì ghi "không ở trạng thái trống, không xem được". **Không bấm nút nào của trạng thái trống.** Lọc console bằng `onlyErrors`: không có lỗi mới. Các component khác của plan này chưa nằm trên trang nào.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo: các con số của đoạn đo ở từng bề ngang, và theme nào đã xem. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

**Kết quả Step 4 (2026-11-27, khung Browser trong app, khoảng 10:03–10:08, trang `http://localhost:3000/fixture-illness`):**

- **Dữ liệu fixture của plan sai một chỗ, đã sửa ngay trong khối `tsx` ở Step 3.** Khối "cleared, tiêu đề dài nhất và 12 liều hôm nay" đặt lần sốt cuối lúc 09:00, giờ của trang là 10:00: {khoảng} của §5.2 là tròn 1 giờ nên tiêu đề ra "Bun đã hết sốt 1 giờ", không phải "… chưa đầy 1 giờ" như bảng của mục 2. Luật đúng spec; tiêu đề dài nhất chưa hề được vẽ. Đổi lần đo đó sang 09:10 (hàng "Sốt cao nhất" của khối này vì vậy ghi "09:10 hôm nay"). Sau khi đổi, chín thẻ khớp bảng của mục 2 từng chữ.
- **Lỗi lộ ra và đã sửa (Patch 7, Patch 8 ở cuối file).** Với dữ liệu đúng, ở 375 px tiêu đề dài nhất xuống hai dòng "Bun đã hết sốt chưa đầy 1" / "giờ": chữ "giờ" đứng một mình, số 1 rời đơn vị (dòng rộng 238,9 và 29,0 px trong ô 253 px). Spec cho tiêu đề xuống dòng nên không phạm ràng buộc nào, nhưng đây là trạng thái gặp ngay sau khi bé hạ sốt. Sửa: `text-balance` trên tiêu đề. Sau sửa: "Bun đã hết sốt" / "chưa đầy 1 giờ" (134,8 và 133,1 px). Mọi số dưới đây đo **sau** bản sửa.
- **Mục 1:** 13 khối (9 thẻ kết luận, 2 danh sách, 2 trạng thái trống); `scrollWidth <= innerWidth` là `true` ở 375, 390, 440 px.
- **Mục 2:** chín thẻ khớp bảng: tiêu đề, icon (đọc theo đường vẽ của `ICON_PATHS`), tông của vòng tròn, dòng phụ, ba hàng kể cả giờ nhỏ; tám thẻ đang mở có ba nút (24 nút), thẻ đã đóng không có nút.
- **Mục 3 (đoạn đo của plan), 375 px:** `rowHeights` = [44] (27 hàng); `titlesOnTwoLines` = ["Bun đã hết sốt chưa đầy 1 giờ"]; nút "Nhiệt độ: chữ 57.3 trong nút 97.7 × 44", "Thuốc: chữ 42.2 trong nút 97.7 × 44", "Triệu chứng: chữ 80.1 trong nút 97.7 × 44" (chữ 14 px, đệm 4 px); mọi tiêu đề và dòng mô tả của "Từng ngày" 1 dòng. Đo thêm: không phần tử nào có `text-overflow: ellipsis`, không phần tử nào ra ngoài màn hình hay tràn ô của nó; trong mỗi hàng của thẻ, nhãn, giờ nhỏ và giá trị không chạm nhau (hở ít nhất 4 px) và không xuống dòng; dòng phụ của cả chín thẻ một dòng.
- **Mục 4:** "Từng ngày · 3 ngày" khớp từng chữ: tiêu đề mục, ba hàng mới nhất trước, nhãn "Hết sốt" (`good`), "Sốt cao" (`danger`), "Sốt" (`warn`) cùng dòng với tiêu đề của hàng, chip "Sổ mũi, Ho" / "Sốt, Sổ mũi, Ho, Quấy" / "Sốt, Sổ mũi"; không hàng nào chứa nút hay đường dẫn.
- **Mục 5:** hàng "25/11 · ngày 2" ghi "Cao nhất 39,2°C · 15 liều hạ sốt" một dòng; 10 chip thành 3 hàng, không chip nào ra khỏi thẻ hay xuống dòng bên trong.
- **Mục 6:** "missing": icon lịch, "Không tìm thấy đợt ốm này", `<a>` "Về danh sách" 129,4 × 44 px, không có `<button>`. "empty": "Chưa có đợt ốm nào" 16 px một dòng, dòng phụ 13 px hai dòng không bị cắt, nút "Bắt đầu đợt ốm" 143,5 × 44 px.
- **Mục 7:** chạy lại toàn bộ các phép đo trên ở `rose`, `light`, `dark`, `night` (giữ theme bằng `MutationObserver`, ngắt khi xong): bốn theme cho kết quả giống nhau từng số ở cả ba bề ngang. Nhìn bằng mắt ở 375 px: `rose` cả trang từ trên xuống; `night` các khối unmeasured, hai khối fever, stale, cleared, none, "Từng ngày · 3 ngày", cuối danh sách dài và hai trạng thái trống; `light` hai khối fever, stale, danh sách dài, "missing"; `dark` fever dưới 39, stale, cleared, hai danh sách. Ở `night` ba loại thẻ phân biệt được bằng icon (nhiệt kế, đồng hồ, dấu tích) và chữ tiêu đề; nhãn của ngày phân biệt bằng chữ.
- **Mục 8:** 390 px: như 375 px, nút rộng 102,7 px, tiêu đề dài nhất vẫn hai dòng. 440 px: nút rộng 119,3 px, không tiêu đề nào hai dòng. Còn lại không đổi (hàng 44 px, 3 hàng chip, không tràn).
- **Trang thật (chỉ xem, 375 px, theme `dark` đang đặt sẵn, không bấm gì):** `/tang-truong`, `/nhat-ky`, `/anh` đều mở được, đang đăng nhập, cả ba đang có dữ liệu: không ở trạng thái trống, không xem được `EmptyState` ở đó. Console lọc `onlyErrors`: không có dòng nào ở cả ba trang. Không tràn ngang.
- **Ghi chú:** ảnh chụp ngay sau khi cuộn ở `night` có vài thẻ ra ô trống; chụp lại sau 1,2 giây thì đủ (ảnh chụp trước khi trình duyệt kịp vẽ lớp kính, không phải lỗi của trang).
- **Chưa kiểm:** theme `peach`, `lavender`, `sea` (plan không liệt kê); nhìn bằng mắt từng khối ở từng theme và ở 390, 440 px (phần đó chỉ có số đo); iPhone thật; Safari iOS trước 17.5 không có `text-wrap: balance` nên ở đó tiêu đề dài nhất vẫn xuống dòng kiểu cũ (chữ "giờ" đứng riêng); `EmptyState` trên ba trang thật; tên bé dài hơn "Bun"; thẻ và danh sách trên trang thật (chưa trang nào dùng, M2f).
- Ảnh và bản sao trang fixture nằm ở thư mục ghi chú chung của nhóm phiên (ngoài repo): `m2d-*.jpg`, `m2d-*.png`, `m2d-fixture-page.tsx.txt`.

- [x] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-illness
bun run typecheck
git status --short  # không còn app/fixture-illness
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts` (thư mục `.next` còn trỏ tới trang tạm vừa xóa): chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [x] **Step 6: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

**Kết quả (2026-11-27):**

| Bước                                   | Plan (đã cộng 3 của M2c)                                  | Đo thật                                                   |
| -------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| Step 0, nền                            | 193 file / 1801 test                                      | 193 file / 1801 test                                      |
| Task 1 đỏ                              | `1 failed \| 193 passed (194)`, `1801 passed`             | khớp                                                      |
| Task 1 xanh                            | 194 / 1813                                                | 194 / 1813, `tsc` thoát 0                                 |
| Task 2 đỏ                              | `1 failed \| 194 passed (195)`, `1813 passed`             | khớp                                                      |
| Task 2 xanh                            | 195 / 1823                                                | 195 / 1823, `tsc` thoát 0                                 |
| Task 3 đỏ                              | `1 failed \| 194 passed (195)`, `1 failed \| 1823 passed` | khớp                                                      |
| Task 3 xanh                            | 195 / 1824                                                | 195 / 1824, `tsc` thoát 0                                 |
| Bản sửa đỏ (Patch 7)                   | ngoài plan                                                | `1 failed \| 194 passed (195)`, `1 failed \| 1824 passed` |
| Bản sửa xanh (Patch 8), cũng là Step 1 | ngoài plan                                                | **195 file / 1825 test**, `tsc` thoát 0                   |

- Số đỏ và xanh của cả ba task khớp plan sau khi cộng 3. Sáu patch áp sạch bằng `kb_patch`.
- **Step 2, build:** chạy hai đợt (trước bước trình duyệt, và lại sau bản sửa, khi trang fixture đã xóa). Mỗi đợt lần đầu thoát 1 với thông báo bảo mật của Next.js 16.4.3 (không chạy `next upgrade`), lần hai thoát 0, `✓ Generating static pages (40/40)`.
- **Step 3:** trang fixture qua `tsc --noEmit`. Server dev chạy bằng `preview_start` với một `.claude/launch.json` tạm; file đó và trang fixture đã xóa, server đã tắt.
- **Step 4:** ghi ngay dưới Step 4. Một lỗi đã sửa (tiêu đề dài nhất, Patch 7 và 8); một chỗ sai trong dữ liệu fixture của plan đã sửa.
- **Step 5:** sau khi xóa trang tạm, `tsc --noEmit` thoát 0 (đã xóa `.next/dev/types` và `.next/types` trước).
- **Khác với ghi chú của plan:** các file plan M2a–M2g đã được commit từ trước (không còn untracked), nên commit docs của plan này là một lần sửa file, không phải thêm file. `Link` của Next 16.4.3 đã đọc ở `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` trước Task 3: `href` chuỗi và `className` vẫn như app đang dùng.
- **Spec đã sửa cho khớp (cùng commit docs):** §6.3 mục 2, hàng "Sốt cao nhất" ghi "Chưa đo" khi đợt chưa có lần đo nào (Diễn giải 1 của plan này; bản duyệt đọc sát chữ là "Không sốt"); và câu về tiêu đề chia đều hai dòng.
- **Chưa kiểm:** xem danh sách ở cuối kết quả Step 4. Plan này không đụng DB, không chạy pgTAP.
- **Cho các plan sau:** nền của M2e là 195 file / 1825 test (plan M2e ghi 1821): cộng 4 vào mọi con số test xanh của M2e–M2g; cuối M2 là 200 file / 1879 test nếu không plan nào thêm test. Không patch nào của M2e–M2g sửa các file của plan này (`illnessView.ts`, `EpisodeVerdict.tsx`, `EpisodeDayList.tsx`, `EmptyState.tsx` và test của chúng; đã tìm tên file trong phần đầu diff của ba plan). Dữ liệu fixture của M2f nếu chép khối "tiêu đề dài nhất" thì dùng lần đo 09:10, không phải 09:00.

```bash
git status --short   # file plan này hiện là untracked (??); các file plan khác của M2 chưa chạy cũng vậy, không add chúng
git add docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2d.md
git commit -m "docs(plan): the M2d plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 7: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m2d
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy, ở theme nào; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.

### Bản sửa sau bước trình duyệt (thêm khi chạy, 2026-11-27): tiêu đề hai dòng chia đều

Lộ ra ở Task 4 Step 4, sau khi sửa dữ liệu fixture: ở 375 px tiêu đề dài nhất của thẻ kết luận, "{tên} đã hết sốt chưa đầy 1 giờ", xuống hai dòng và để chữ "giờ" đứng một mình ở dòng dưới. Test trước (Patch 7), code sau (Patch 8); một commit `fix(illness): the verdict title breaks into even lines`.

**Patch 7 (test đỏ):** `Test Files  1 failed | 194 passed (195)`, `Tests  1 failed | 1824 passed (1825)`.

```diff
diff --git a/components/illness/episodecards.test.tsx b/components/illness/episodecards.test.tsx
index d9b5017..9c7e826 100644
--- a/components/illness/episodecards.test.tsx
+++ b/components/illness/episodecards.test.tsx
@@ -33,6 +33,21 @@ describe("EpisodeVerdict", () => {
     expect(html).toContain(">Ngày thứ 3 · bắt đầu 24/11 lúc 23:30</span>");
   });

+  // At 375 px the longest title takes two lines; balanced, its last word is
+  // not left alone on the second.
+  it("a title that needs two lines breaks into even lines", () => {
+    const html = card({
+      verdict: {
+        title: "Bun đã hết sốt chưa đầy 1 giờ",
+        tone: "good",
+        icon: "check",
+      },
+    });
+    expect(html).toMatch(
+      /<h2 class="[^"]*text-balance[^"]*">Bun đã hết sốt chưa đầy 1 giờ<\/h2>/,
+    );
+  });
+
   it("the tone and the icon both change with the verdict", () => {
     const fever = card({
       verdict: { title: "Bun đang sốt 39,4°C", tone: "danger", icon: "thermo" },
```

**Patch 8 (code):** `Test Files  195 passed (195)`, `Tests  1825 passed (1825)`; `tsc --noEmit` thoát 0.

```diff
diff --git a/components/illness/EpisodeVerdict.tsx b/components/illness/EpisodeVerdict.tsx
index 2fd5c81..d0b7437 100644
--- a/components/illness/EpisodeVerdict.tsx
+++ b/components/illness/EpisodeVerdict.tsx
@@ -67,7 +67,7 @@ export function EpisodeVerdict({
           <Icon name={verdict.icon} size={22} />
         </span>
         <div className="flex min-w-0 flex-col">
-          <h2 className="text-xl leading-[26px] font-bold text-ink">
+          <h2 className="text-xl leading-[26px] font-bold text-balance text-ink">
             {verdict.title}
           </h2>
           <span className="text-[13px] leading-[18px] text-muted">
```

`text-wrap: balance` có từ Safari 17.5; Safari 16.4–17.4 bỏ qua thuộc tính này và xuống dòng như trước (không vỡ gì).
