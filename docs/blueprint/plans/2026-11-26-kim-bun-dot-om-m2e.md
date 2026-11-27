# Kim Bun — Đợt ốm M2e: bản ghi theo khoảng và phiếu Sửa đợt ốm Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (phần `fetchLogsBetween` và `useRangeLogs` của §4.2; §6.4 trừ luật lần khám của M5; phần thao tác một chạm và chỗ hiện lỗi của §5.7; phần tương ứng của §10.1 và §10.3)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** App đọc được bản ghi của một khoảng thời gian bất kỳ, và có phiếu "Sửa đợt ốm": sửa giờ bắt đầu và kết thúc, mở lại, xóa. Cả hai chưa được trang nào dùng; M2f gắn chúng vào trang chi tiết.

**Architecture:**

- **Đọc theo khoảng:** `fetchLogsBetween` trong `lib/data/logs.ts` đọc từng trang 1000 hàng cho tới khi một trang về thiếu, rồi phủ các thay đổi đang chờ; `useRangeLogs` là hook của nó.
- **Luật của phiếu:** `lib/rules/illnessForm.ts` đổi hai ô ngày giờ thành một thay đổi để gửi (hoặc các câu lỗi theo ô), và có ba hàm cho các thao tác một chạm. Thuần, có test.
- **Phiếu chia hai phần:** `EpisodeSheetView` chỉ vẽ và không có hook, nên test bấm được từng nút; `EpisodeSheet` giữ trạng thái và gọi `useEpisodeActions`.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m2e`, cắt từ `main` sau khi M2d đã lên. Baseline: 1821 test vitest xanh (195 file), typecheck sạch. **Khi chạy (2026-11-27):** nền thật là 195 file / 1825 test, vì M2c thêm 3 test (hai bản sửa của biểu đồ sốt) và M2d thêm 1 test (tiêu đề thẻ kết luận chia đều hai dòng); mọi con số test xanh trong plan này vì vậy cộng 4, số file không đổi. Số đo thật ghi ở Task 4 Step 6.

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

1. **`useRangeLogs(babyId, from, to, enabled = true)`.** Không tự tải lại theo giờ. Khóa nằm dưới `logsKey(babyId)`, nên một bản ghi mới và một sự kiện realtime (`useLogsRealtime`) làm mới nó như mọi danh sách bản ghi khác.
2. **Ghi lạc quan có thể đưa bản ghi ngoài khoảng vào cache của một khoảng** (`enqueueLogChange` áp bản ghi mới lên mọi danh sách dưới `logsKey`). Lần tải lại kế tiếp lọc nó đi, và mọi luật của M2b tự lọc theo đợt, nên không hiện sai. Không sửa hành vi sẵn có đó.
3. **Thứ tự của `fetchLogsBetween`** (tăng dần rồi `id`) chỉ để các trang không xáo hàng; lớp phủ đang chờ xếp lại mảng, nên nơi dùng không được dựa vào thứ tự (§4.2).
4. **Ô không đổi thì giữ nguyên giá trị đã lưu, tới từng giây, và không nằm trong thay đổi được gửi.** Ô `datetime-local` chỉ giữ tới phút, còn giờ bắt đầu do lời mời (M3) hay "Bé đã khỏi" ghi thì có giây. Không đổi ô nào thì "Lưu" chỉ đóng phiếu.
5. **Ô bị xóa trống** báo "Nhập giờ bắt đầu" hoặc "Nhập giờ kết thúc", là hai câu sẵn có của phiếu bản ghi (`lib/rules/logForm.ts`). Spec không có câu cho trường hợp này.
6. **Thứ tự nút: "Lưu", "Mở lại đợt ốm", "Xóa đợt ốm"**, theo các phiếu sẵn có của app (nút chính trên cùng, nút xóa dưới cùng). Spec §6.4 chỉ liệt kê các thành phần.
7. **"Mở lại đợt ốm" bị từ chối thì câu lỗi hiện ngay trong phiếu** (dòng báo phía trên các nút), không hiện bằng Toast như §5.7 ghi cho các thao tác một chạm: Toast nằm dưới lớp nền mờ của phiếu đang mở và nằm ngoài hộp thoại, nên không đọc được. Trên thực tế nút này chỉ hiện khi việc mở lại hợp lệ; lỗi chỉ xảy ra khi danh sách đợt đổi giữa lúc vẽ và lúc bấm.
8. **Bấm "Mở lại đợt ốm" khi đang sửa dở ô giờ** thì chỉ việc mở lại được gửi; phần sửa dở bị bỏ và phiếu đóng, không hỏi lại. Spec không nói tới trường hợp này.
9. **Phiếu không tự rời trang sau khi xóa.** Nó gọi `onDeleted`; M2f nối việc quay về danh sách.
10. **Phiếu không có icon ở đầu**, như phiếu "Sửa lần đo" của Tăng trưởng.
11. **Ba hàm `planStart`, `planClose`, `planReopen`** gói luật của §5.7 cho thao tác một chạm: kiểm trước, bị từ chối thì trả một câu và không có gì được xếp vào outbox. M2f dùng `planStart` và `planClose`; M3 dùng lại `planClose`, còn lời mời của M3 (§5.5) bắt đầu đợt ở giờ của lần đo sốt chứ không phải lúc này, nên M3 sẽ phải mở rộng `planStart` hoặc gọi thẳng `checkEpisode`.
12. **Luật tắt nút "Xóa đợt ốm" khi còn lần khám** (§6.4, "Từ M5") chưa có ở đây.
13. **Phiếu chưa mở được từ trang nào.** Bước trình duyệt chỉ xem trang fixture; nút "Lưu", "Mở lại", "Xóa" thật chưa từng được bấm ở đâu (dev nối vào dữ liệu thật).

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 6** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2e.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ commit cuối của M2d trong bản chạy thử. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang fixture của Task 4 đã qua `tsc --noEmit`. `bun run build` đã chạy xanh một lần trên bản sao có đủ cả bảy plan của M2, chưa chạy riêng cho plan này. Chưa nhìn trong trình duyệt: phiếu sửa (bước trình duyệt của plan này là lần đầu).
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

Plan này đứng sau M2d. M2f dùng `useRangeLogs`, mở `EpisodeSheet` từ nút bút chì của trang chi tiết, và dùng `planStart`, `planClose`; M3 dùng `useRangeLogs` và `planClose` (lời mời của M3 cần một giờ bắt đầu khác lúc này, nên `planStart` như ở đây chưa đủ cho nó); M4 dùng `useRangeLogs` trong Báo cáo; M5 thêm luật lần khám vào `EpisodeSheet`.

**Consumes (M2a):** `useEpisodeActions(babyId: string, userId: string)` với `update.mutate({ id, patch }, { onSuccess, onError })`, `remove.mutate(id, { onSuccess, onError })`, `update.isPending`, `remove.isPending` (`lib/data/illness.ts`); `EpisodeRow`.

**Consumes (M2b):** `checkEpisode`, `episodeError`, `canReopen`, `type EpisodeErrors`, `type EpisodeLike` (`lib/rules/illness.ts`).

**Consumes (đã ở `main` từ trước):** `logsKey` và các hàm sẵn có của `lib/data/logs.ts`; `withPending` (`lib/data/outbox.ts`); `LogRow`; `toVnLocalInput`, `fromVnLocalInput` (`lib/rules/time.ts`); `Sheet` (`open`, `onClose`, `title`, `dirty`, `footer`); `Button`; `FIELD_INPUT`, `FIELD_LABEL` (`components/quick/styles.ts`); `toVietnameseError`; `findElements` (`components/ui/testTree.ts`).

**Produces:**

- `lib/data/logs.ts`: `fetchLogsBetween(babyId: string, from: string, to: string | null): Promise<LogRow[]>`; `useRangeLogs(babyId: string, from: string, to: string | null, enabled = true)` (kết quả `useQuery` với `data: LogRow[] | undefined`).
- `lib/rules/illnessForm.ts`: `type EpisodeTimes`; `type EpisodeRaw`; `episodeToRaw(episode: EpisodeLike): EpisodeRaw`; `buildEpisodePatch(input)`; `planStart(episodes: EpisodeLike[], now: Date)`; `planClose(episode: EpisodeLike, episodes: EpisodeLike[], now: Date)`; `planReopen(episode: EpisodeLike, episodes: EpisodeLike[], now: Date)` (chữ ký đầy đủ ở Task 2).
- `components/illness/EpisodeSheet.tsx`: `EpisodeSheetView(props)` (chữ ký ở Task 3); `EpisodeSheet(props: { babyId: string; userId: string; episode: EpisodeRow; episodes: EpisodeRow[]; canDelete: boolean; onClose: () => void; onDeleted: () => void })`.
- **Vitest sau M2e:** 1852 test, 198 file. (Khi chạy: 1856 test, 198 file; xem Task 4 Step 6.)

---

### Task 1: Đọc bản ghi của một khoảng thời gian (§4.2, §10.1)

**Files:**

- Modify: `lib/data/logs.ts`
- Test: `lib/data/logsRange.test.ts` (mới)

**Interfaces:**

- Consumes: `logsKey`, `withPending` (qua `lib/data/outbox.ts`), `supabase`, `LogRow` sẵn có.
- Produces:
  - `fetchLogsBetween(babyId: string, from: string, to: string | null): Promise<LogRow[]>`: mọi bản ghi có `started_at` trong `[from, to)`; `to` là `null` thì không có cận trên. Thứ tự của mảng trả về không được bảo đảm.
  - `useRangeLogs(babyId: string, from: string, to: string | null, enabled = true)`: kết quả `useQuery`, khóa `[...logsKey(babyId), "range", from, to ?? "open"]`.

- [x] **Step 0: Kiểm M2d đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f components/illness/EpisodeVerdict.tsx && grep -q "action.href" components/ui/EmptyState.tsx && echo "M2d có trên main"
git checkout -b feat/kim-bun-dot-om-m2e
bunx vitest run
```

Expected: dòng `M2d có trên main`; `Test Files  195 passed (195)`, `Tests  1821 passed (1821)`. Không thấy dòng đó thì dừng: M2d chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [x] **Step 1: Viết test đỏ (Patch 1)**

File test thay Supabase bằng một vật thế ghi lại mọi lệnh gọi và trả từng trang đã chuẩn bị sẵn.

```diff
diff --git a/lib/data/logsRange.test.ts b/lib/data/logsRange.test.ts
new file mode 100644
index 0000000..1821a98
--- /dev/null
+++ b/lib/data/logsRange.test.ts
@@ -0,0 +1,168 @@
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { LogRow } from "@/lib/supabase/rows";
+import { fetchLogsBetween, useRangeLogs } from "./logs";
+
+type Result = { data: unknown; error: unknown };
+
+// A stand-in for the Supabase client: every builder call is recorded, and each
+// awaited request takes the next prepared page.
+const db = vi.hoisted(() => ({
+  calls: [] as unknown[][],
+  pages: [] as Result[],
+}));
+const withPending = vi.hoisted(() =>
+  vi.fn(
+    async (
+      _babyId: string,
+      rows: unknown[],
+      _inRange: (row: { started_at: string }) => boolean,
+    ) => rows,
+  ),
+);
+
+vi.mock("@/lib/supabase/client", () => ({
+  supabase: () => ({
+    from: (table: string) => {
+      const chain: Record<string, unknown> = {};
+      for (const name of ["select", "eq", "gte", "lt", "order", "range"])
+        chain[name] = (...args: unknown[]) => {
+          db.calls.push([table, name, ...args]);
+          return chain;
+        };
+      chain.then = (resolve: (value: Result) => void) =>
+        resolve(db.pages.shift() ?? { data: [], error: null });
+      return chain;
+    },
+  }),
+}));
+vi.mock("@tanstack/react-query", () => ({
+  useQuery: (options: unknown) => options,
+  useInfiniteQuery: (options: unknown) => options,
+  useMutation: (options: unknown) => options,
+  useQueryClient: () => ({}),
+}));
+vi.mock("./outbox", () => ({ enqueueLogChange: vi.fn(), withPending }));
+
+const rows = (count: number, prefix: string) =>
+  Array.from({ length: count }, (_, i) => ({
+    id: `${prefix}${i}`,
+    started_at: "2026-11-20T02:00:00.000Z",
+  })) as LogRow[];
+const page = (data: LogRow[]): Result => ({ data, error: null });
+const FROM = "2026-11-19T17:00:00.000Z";
+const TO = "2026-11-23T17:00:00.000Z";
+
+beforeEach(() => {
+  db.calls = [];
+  db.pages = [];
+  withPending.mockClear();
+});
+
+// Spec 2026-11-26 §4.2.
+describe("fetchLogsBetween", () => {
+  it("one short page: from..to, oldest first then id, rows 0–999", async () => {
+    db.pages = [page(rows(3, "a"))];
+    const result = await fetchLogsBetween("b1", FROM, TO);
+    expect(result.map((row) => row.id)).toEqual(["a0", "a1", "a2"]);
+    expect(db.calls).toEqual([
+      ["logs", "select", "*"],
+      ["logs", "eq", "baby_id", "b1"],
+      ["logs", "gte", "started_at", FROM],
+      ["logs", "lt", "started_at", TO],
+      ["logs", "order", "started_at", { ascending: true }],
+      ["logs", "order", "id"],
+      ["logs", "range", 0, 999],
+    ]);
+  });
+
+  it("an open range has no upper bound", async () => {
+    db.pages = [page(rows(1, "a"))];
+    await fetchLogsBetween("b1", FROM, null);
+    expect(db.calls.map((call) => call[1])).toEqual([
+      "select",
+      "eq",
+      "gte",
+      "order",
+      "order",
+      "range",
+    ]);
+  });
+
+  it("reads on while a page comes back full, and stops at the first short one", async () => {
+    db.pages = [
+      page(rows(1000, "a")),
+      page(rows(1000, "b")),
+      page(rows(7, "c")),
+      page(rows(5, "never")),
+    ];
+    const result = await fetchLogsBetween("b1", FROM, null);
+    expect(result).toHaveLength(2007);
+    expect(result[2006].id).toBe("c6");
+    expect(
+      db.calls
+        .filter((call) => call[1] === "range")
+        .map((call) => call.slice(2)),
+    ).toEqual([
+      [0, 999],
+      [1000, 1999],
+      [2000, 2999],
+    ]);
+  });
+
+  it("a page of exactly 1000 rows is followed by one more request", async () => {
+    db.pages = [page(rows(1000, "a")), page([])];
+    expect(await fetchLogsBetween("b1", FROM, TO)).toHaveLength(1000);
+    expect(db.calls.filter((call) => call[1] === "range")).toHaveLength(2);
+  });
+
+  it("throws the server's error, also on a later page", async () => {
+    const error = { code: "42501", message: "denied" };
+    db.pages = [page(rows(1000, "a")), { data: null, error }];
+    await expect(fetchLogsBetween("b1", FROM, TO)).rejects.toBe(error);
+    expect(withPending).not.toHaveBeenCalled();
+  });
+
+  it("waiting inserts are laid over only when they fall inside the range", async () => {
+    db.pages = [page(rows(2, "a"))];
+    await fetchLogsBetween("b1", FROM, TO);
+    expect(withPending).toHaveBeenCalledTimes(1);
+    const [babyId, passed, inRange] = withPending.mock.calls[0];
+    expect(babyId).toBe("b1");
+    expect(passed).toHaveLength(2);
+    const at = (started_at: string) => inRange({ started_at });
+    expect(at("2026-11-19T16:59:59.999Z")).toBe(false);
+    expect(at(FROM)).toBe(true);
+    expect(at("2026-11-23T16:59:59.999Z")).toBe(true);
+    expect(at(TO)).toBe(false);
+
+    db.pages = [page([])];
+    await fetchLogsBetween("b1", FROM, null);
+    const open = withPending.mock.calls[1][2];
+    expect(open({ started_at: "2026-11-19T16:59:59.999Z" })).toBe(false);
+    expect(open({ started_at: "2031-01-01T00:00:00.000Z" })).toBe(true);
+  });
+});
+
+type QueryOptions = {
+  queryKey: unknown[];
+  queryFn: () => Promise<unknown>;
+  enabled: boolean;
+};
+
+describe("useRangeLogs", () => {
+  it("keys the range under the baby's logs, so a log change refreshes it", () => {
+    const closed = useRangeLogs("b1", FROM, TO) as unknown as QueryOptions;
+    expect(closed.queryKey).toEqual(["logs", "b1", "range", FROM, TO]);
+    expect(closed.enabled).toBe(true);
+    const open = useRangeLogs("b1", FROM, null) as unknown as QueryOptions;
+    expect(open.queryKey).toEqual(["logs", "b1", "range", FROM, "open"]);
+  });
+
+  it("reads through fetchLogsBetween, and not at all when switched off", async () => {
+    db.pages = [page(rows(2, "a"))];
+    const options = useRangeLogs("b1", FROM, TO) as unknown as QueryOptions;
+    expect(await options.queryFn()).toHaveLength(2);
+    const off = useRangeLogs("b1", FROM, TO, false) as unknown as QueryOptions;
+    expect(off.enabled).toBe(false);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 195 passed (196)`, `Tests  8 failed | 1821 passed (1829)`. 8 test của file mới đỏ: hai hàm chưa có trong `lib/data/logs.ts`.

- [x] **Step 3: Thêm hai hàm vào `lib/data/logs.ts` (Patch 2)**

```diff
diff --git a/lib/data/logs.ts b/lib/data/logs.ts
index 5b3b6a2..0f53f68 100644
--- a/lib/data/logs.ts
+++ b/lib/data/logs.ts
@@ -211,6 +211,57 @@ export function useStatsLogs(babyId: string, since: string) {
   });
 }

+// PostgREST returns at most 1000 rows per request (max_rows).
+const RANGE_PAGE_ROWS = 1000;
+
+// Spec 2026-11-26 §4.2: every log that starts in [from, to); `to` null means
+// no upper bound. Read page after page until one comes back short. Oldest
+// first then id, only so the pages cannot shuffle: the overlay below and the
+// optimistic cache sort again, so callers must not rely on the order.
+export async function fetchLogsBetween(
+  babyId: string,
+  from: string,
+  to: string | null,
+): Promise<LogRow[]> {
+  const rows: LogRow[] = [];
+  for (let offset = 0; ; offset += RANGE_PAGE_ROWS) {
+    let query = supabase()
+      .from("logs")
+      .select("*")
+      .eq("baby_id", babyId)
+      .gte("started_at", from);
+    if (to !== null) query = query.lt("started_at", to);
+    const { data, error } = await query
+      .order("started_at", { ascending: true })
+      .order("id")
+      .range(offset, offset + RANGE_PAGE_ROWS - 1);
+    if (error) throw error;
+    rows.push(...data);
+    if (data.length < RANGE_PAGE_ROWS) break;
+  }
+  const fromMs = Date.parse(from);
+  const toMs = to === null ? null : Date.parse(to);
+  return withPending(babyId, rows, (row) => {
+    const at = Date.parse(row.started_at);
+    return at >= fromMs && (toMs === null || at < toMs);
+  });
+}
+
+// The logs of an illness episode (and of the days around it). Under logsKey,
+// so a new log and a realtime event refresh it like every other log list.
+export function useRangeLogs(
+  babyId: string,
+  from: string,
+  to: string | null,
+  enabled = true,
+) {
+  return useQuery({
+    queryKey: [...logsKey(babyId), "range", from, to ?? "open"],
+    queryFn: () => fetchLogsBetween(babyId, from, to),
+    enabled,
+  });
+}
+
 export function useSaveLog(babyId: string, userId: string) {
   const queryClient = useQueryClient();
   return useMutation({
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  196 passed (196)`, `Tests  1829 passed (1829)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/data/logs.ts lib/data/logsRange.test.ts
git commit -m "feat(logs): fetchLogsBetween and useRangeLogs" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Luật của phiếu sửa và của các thao tác một chạm: `lib/rules/illnessForm.ts` (§5.7, §6.4)

**Files:**

- Create: `lib/rules/illnessForm.ts`
- Test: `lib/rules/illnessForm.test.ts` (mới)

**Interfaces:**

- Consumes (M2b): `checkEpisode`, `episodeError`, `type EpisodeErrors`, `type EpisodeLike`. Sẵn có: `toVnLocalInput`, `fromVnLocalInput` (`lib/rules/time.ts`).
- Produces:
  - `type EpisodeTimes = { started_at?: string; ended_at?: string | null }` (khớp `EpisodePatch` của M2a)
  - `type EpisodeRaw = { start: string; end: string | null }`: hai giá trị `datetime-local` của phiếu, giờ Việt Nam; `end` là `null` với đợt đang mở.
  - `episodeToRaw(episode: EpisodeLike): EpisodeRaw`
  - `buildEpisodePatch(input: { episode: EpisodeLike; opened: EpisodeRaw; raw: EpisodeRaw; episodes: EpisodeLike[]; now: Date }): { ok: true; patch: EpisodeTimes | null } | { ok: false; errors: EpisodeErrors }` (`patch` là `null` khi không đổi gì)
  - `planStart(episodes: EpisodeLike[], now: Date): { ok: true; startedAt: string } | { ok: false; message: string }`
  - `planClose(episode: EpisodeLike, episodes: EpisodeLike[], now: Date): { ok: true; patch: { ended_at: string } } | { ok: false; message: string }`
  - `planReopen(episode: EpisodeLike, episodes: EpisodeLike[], now: Date): { ok: true; patch: { ended_at: null } } | { ok: false; message: string }`

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/rules/illnessForm.test.ts b/lib/rules/illnessForm.test.ts
new file mode 100644
index 0000000..ab3ebd4
--- /dev/null
+++ b/lib/rules/illnessForm.test.ts
@@ -0,0 +1,180 @@
+import { describe, expect, it } from "vitest";
+import type { EpisodeLike } from "./illness";
+import {
+  buildEpisodePatch,
+  episodeToRaw,
+  planClose,
+  planReopen,
+  planStart,
+} from "./illnessForm";
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
+
+const old = episode("2026-11-10 08:00", "2026-11-12 08:00", "old");
+const now = vn("2026-11-27 08:00");
+
+describe("episodeToRaw", () => {
+  it("writes the times the way a datetime-local field holds them, in Vietnam time", () => {
+    expect(episodeToRaw(episode("2026-11-24 23:30"))).toEqual({
+      start: "2026-11-24T23:30",
+      end: null,
+    });
+    expect(
+      episodeToRaw(episode("2026-11-24 23:30", "2026-11-26 07:05")),
+    ).toEqual({ start: "2026-11-24T23:30", end: "2026-11-26T07:05" });
+  });
+});
+
+// Spec 2026-11-26 §6.4.
+describe("buildEpisodePatch", () => {
+  // Stored with seconds, as "Bé đã khỏi" and the invite write them.
+  const closed: EpisodeLike = {
+    id: "ep1",
+    started_at: "2026-11-24T16:30:41.250Z",
+    ended_at: "2026-11-26T00:05:12.000Z",
+  };
+  const opened = episodeToRaw(closed);
+  const build = (raw: { start: string; end: string | null }) =>
+    buildEpisodePatch({
+      episode: closed,
+      opened,
+      raw,
+      episodes: [old, closed],
+      now,
+    });
+
+  it("nothing changed: nothing to save, and the stored seconds are left alone", () => {
+    expect(build(opened)).toEqual({ ok: true, patch: null });
+  });
+
+  it("only a changed field goes into the patch", () => {
+    expect(build({ ...opened, start: "2026-11-24T20:10" })).toEqual({
+      ok: true,
+      patch: { started_at: iso("2026-11-24 20:10") },
+    });
+    expect(build({ ...opened, end: "2026-11-26T09:00" })).toEqual({
+      ok: true,
+      patch: { ended_at: iso("2026-11-26 09:00") },
+    });
+    expect(
+      build({ start: "2026-11-24T20:10", end: "2026-11-26T09:00" }),
+    ).toEqual({
+      ok: true,
+      patch: {
+        started_at: iso("2026-11-24 20:10"),
+        ended_at: iso("2026-11-26 09:00"),
+      },
+    });
+  });
+
+  it("an unchanged field is checked with its stored value", () => {
+    // The end stays 07:05:12; a start of 07:05 is before it, so this passes.
+    expect(build({ ...opened, start: "2026-11-26T07:05" }).ok).toBe(true);
+    expect(build({ ...opened, start: "2026-11-26T07:06" })).toEqual({
+      ok: false,
+      errors: { ended_at: "Giờ kết thúc phải sau giờ bắt đầu." },
+    });
+  });
+
+  it("the errors of spec §5.7 come back by field", () => {
+    expect(build({ ...opened, start: "2026-11-11T08:00" })).toEqual({
+      ok: false,
+      errors: { started_at: "Trùng thời gian với một đợt ốm khác." },
+    });
+    expect(build({ ...opened, end: "2026-11-27T09:00" })).toEqual({
+      ok: false,
+      errors: { ended_at: "Giờ kết thúc ở tương lai." },
+    });
+  });
+
+  it("an emptied field asks for its time", () => {
+    expect(build({ ...opened, start: "" })).toEqual({
+      ok: false,
+      errors: { started_at: "Nhập giờ bắt đầu" },
+    });
+    expect(build({ ...opened, end: "" })).toEqual({
+      ok: false,
+      errors: { ended_at: "Nhập giờ kết thúc" },
+    });
+  });
+
+  it("an open episode has only its start", () => {
+    const open = episode("2026-11-25 08:00");
+    const raw = episodeToRaw(open);
+    expect(
+      buildEpisodePatch({
+        episode: open,
+        opened: raw,
+        raw: { start: "2026-11-25T06:00", end: null },
+        episodes: [old, open],
+        now,
+      }),
+    ).toEqual({ ok: true, patch: { started_at: iso("2026-11-25 06:00") } });
+  });
+});
+
+// Spec §5.7: the one-tap actions. A refusal is one sentence for a toast, and
+// nothing is queued.
+describe("planStart", () => {
+  it("starts now", () => {
+    expect(planStart([old], now)).toEqual({
+      ok: true,
+      startedAt: now.toISOString(),
+    });
+    expect(planStart([], now).ok).toBe(true);
+  });
+
+  it("is refused while another episode is open", () => {
+    expect(planStart([old, episode("2026-11-25 08:00")], now)).toEqual({
+      ok: false,
+      message: "Trùng thời gian với một đợt ốm khác.",
+    });
+  });
+});
+
+describe("planClose", () => {
+  const open = episode("2026-11-25 08:00");
+
+  it("ends the episode now", () => {
+    expect(planClose(open, [old, open], now)).toEqual({
+      ok: true,
+      patch: { ended_at: now.toISOString() },
+    });
+  });
+
+  it("is refused when the start is not before now", () => {
+    const ahead = episode("2026-11-27 08:00");
+    expect(planClose(ahead, [ahead], now)).toEqual({
+      ok: false,
+      message: "Giờ kết thúc phải sau giờ bắt đầu.",
+    });
+  });
+});
+
+describe("planReopen", () => {
+  const last = episode("2026-11-20 08:00", "2026-11-22 08:00", "last");
+
+  it("clears the end", () => {
+    expect(planReopen(last, [old, last], now)).toEqual({
+      ok: true,
+      patch: { ended_at: null },
+    });
+  });
+
+  it("is refused when a later episode would overlap", () => {
+    expect(planReopen(old, [old, last], now)).toEqual({
+      ok: false,
+      message: "Trùng thời gian với một đợt ốm khác.",
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 196 passed (197)`, `Tests  1829 passed (1829)`. File test mới không nạp được vì `./illnessForm` chưa có, nên 13 test của nó chưa được đếm.

- [x] **Step 3: Viết luật của phiếu (Patch 4)**

```diff
diff --git a/lib/rules/illnessForm.ts b/lib/rules/illnessForm.ts
new file mode 100644
index 0000000..3e393d7
--- /dev/null
+++ b/lib/rules/illnessForm.ts
@@ -0,0 +1,137 @@
+import {
+  checkEpisode,
+  type EpisodeErrors,
+  episodeError,
+  type EpisodeLike,
+} from "./illness";
+import { fromVnLocalInput, toVnLocalInput } from "./time";
+
+// The columns of an episode a parent can change.
+export type EpisodeTimes = { started_at?: string; ended_at?: string | null };
+
+// The two datetime-local values of the "Sửa đợt ốm" sheet (spec §6.4), in
+// Vietnam time. `end` is null for an open episode, which has no end field.
+export type EpisodeRaw = { start: string; end: string | null };
+
+export function episodeToRaw(episode: EpisodeLike): EpisodeRaw {
+  return {
+    start: toVnLocalInput(new Date(episode.started_at)),
+    end: episode.ended_at ? toVnLocalInput(new Date(episode.ended_at)) : null,
+  };
+}
+
+// Spec §6.4 "Lưu": what to save, or the sentence under each field. `opened` is
+// the form as it was opened: a field left as it was keeps its stored value to
+// the second (the field itself only holds minutes), and stays out of the
+// patch. `patch` null means nothing changed.
+export function buildEpisodePatch(input: {
+  episode: EpisodeLike;
+  opened: EpisodeRaw;
+  raw: EpisodeRaw;
+  episodes: EpisodeLike[];
+  now: Date;
+}):
+  | { ok: true; patch: EpisodeTimes | null }
+  | { ok: false; errors: EpisodeErrors } {
+  const { episode, opened, raw, episodes, now } = input;
+  const startChanged = raw.start !== opened.start;
+  const endChanged = raw.end !== opened.end;
+  const start = startChanged
+    ? fromVnLocalInput(raw.start)
+    : new Date(episode.started_at);
+  const end =
+    raw.end === null
+      ? null
+      : endChanged
+        ? fromVnLocalInput(raw.end)
+        : new Date(String(episode.ended_at));
+  const missing: EpisodeErrors = {};
+  if (Number.isNaN(start.getTime())) missing.started_at = "Nhập giờ bắt đầu";
+  if (end && Number.isNaN(end.getTime()))
+    missing.ended_at = "Nhập giờ kết thúc";
+  if (missing.started_at || missing.ended_at)
+    return { ok: false, errors: missing };
+
+  const started_at = start.toISOString();
+  const ended_at = end ? end.toISOString() : null;
+  const errors = checkEpisode({
+    id: episode.id,
+    started_at,
+    ended_at,
+    episodes,
+    now,
+  });
+  if (episodeError(errors)) return { ok: false, errors };
+  if (!startChanged && !endChanged) return { ok: true, patch: null };
+  return {
+    ok: true,
+    patch: {
+      ...(startChanged ? { started_at } : {}),
+      ...(endChanged ? { ended_at } : {}),
+    },
+  };
+}
+
+type Refused = { ok: false; message: string };
+
+// Spec §5.7: a one-tap action is checked first. When it is refused the caller
+// shows `message` in a toast and queues nothing.
+function refusal(input: Parameters<typeof checkEpisode>[0]): Refused | null {
+  const message = episodeError(checkEpisode(input));
+  return message ? { ok: false, message } : null;
+}
+
+// "Bắt đầu đợt ốm": a new open episode that starts now.
+export function planStart(
+  episodes: EpisodeLike[],
+  now: Date,
+): { ok: true; startedAt: string } | Refused {
+  const startedAt = now.toISOString();
+  return (
+    refusal({
+      id: null,
+      started_at: startedAt,
+      ended_at: null,
+      episodes,
+      now,
+    }) ?? {
+      ok: true,
+      startedAt,
+    }
+  );
+}
+
+// "Bé đã khỏi": the episode ends now.
+export function planClose(
+  episode: EpisodeLike,
+  episodes: EpisodeLike[],
+  now: Date,
+): { ok: true; patch: { ended_at: string } } | Refused {
+  const ended_at = now.toISOString();
+  return (
+    refusal({
+      id: episode.id,
+      started_at: episode.started_at,
+      ended_at,
+      episodes,
+      now,
+    }) ?? { ok: true, patch: { ended_at } }
+  );
+}
+
+// "Mở lại đợt ốm": the end is cleared.
+export function planReopen(
+  episode: EpisodeLike,
+  episodes: EpisodeLike[],
+  now: Date,
+): { ok: true; patch: { ended_at: null } } | Refused {
+  return (
+    refusal({
+      id: episode.id,
+      started_at: episode.started_at,
+      ended_at: null,
+      episodes,
+      now,
+    }) ?? { ok: true, patch: { ended_at: null } }
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  197 passed (197)`, `Tests  1842 passed (1842)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/illnessForm.ts lib/rules/illnessForm.test.ts
git commit -m "feat(illness): the edit form and the one-tap actions" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Phiếu "Sửa đợt ốm" (§6.4)

**Files:**

- Create: `components/illness/EpisodeSheet.tsx`
- Test: `components/illness/episodesheet.test.tsx` (mới)

**Interfaces:**

- Consumes: `buildEpisodePatch`, `episodeToRaw`, `planReopen`, `type EpisodeRaw` (Task 2); `canReopen`, `type EpisodeErrors` (M2b); `useEpisodeActions` (M2a); `EpisodeRow`; `Sheet`, `Button`, `FIELD_INPUT`, `FIELD_LABEL`, `toVietnameseError` sẵn có.
- Produces:
  - `EpisodeSheetView(props: { formId: string; raw: EpisodeRaw; errors: EpisodeErrors; message: string | null; dirty: boolean; saving: boolean; busy: boolean; canReopen: boolean; canDelete: boolean; onRaw: (next: EpisodeRaw) => void; onSubmit: (event: FormEvent) => void; onReopen: () => void; onDelete: () => void; onClose: () => void })`: phần vẽ, không có hook.
  - `EpisodeSheet(props: { babyId: string; userId: string; episode: EpisodeRow; episodes: EpisodeRow[]; canDelete: boolean; onClose: () => void; onDeleted: () => void })`: giữ trạng thái và gọi `useEpisodeActions`.

- [x] **Step 1: Viết test đỏ (Patch 5)**

```diff
diff --git a/components/illness/episodesheet.test.tsx b/components/illness/episodesheet.test.tsx
new file mode 100644
index 0000000..66975f3
--- /dev/null
+++ b/components/illness/episodesheet.test.tsx
@@ -0,0 +1,218 @@
+import type { ComponentProps, FormEvent } from "react";
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import type { EpisodeRow } from "@/lib/supabase/rows";
+import { EpisodeSheet, EpisodeSheetView } from "./EpisodeSheet";
+
+const actions = vi.hoisted(() => ({
+  update: { isPending: false, mutate: vi.fn() },
+  remove: { isPending: false, mutate: vi.fn() },
+}));
+vi.mock("@/lib/data/illness", () => ({ useEpisodeActions: () => actions }));
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const row = (id: string, start: string, end: string | null): EpisodeRow => ({
+  id,
+  baby_id: "b1",
+  started_at: iso(start),
+  ended_at: end === null ? null : iso(end),
+  created_by: "u1",
+  created_at: iso(start),
+  updated_at: iso(start),
+});
+const old = row("old", "2026-11-10 08:00", "2026-11-12 08:00");
+const last = row("last", "2026-11-20 08:00", "2026-11-22 09:30");
+const open = row("open", "2026-11-25 08:00", null);
+
+type ViewProps = ComponentProps<typeof EpisodeSheetView>;
+const viewProps = (over: Partial<ViewProps> = {}): ViewProps => ({
+  formId: "f1",
+  raw: { start: "2026-11-20T08:00", end: "2026-11-22T09:30" },
+  errors: {},
+  message: null,
+  dirty: false,
+  saving: false,
+  busy: false,
+  canReopen: false,
+  canDelete: false,
+  onRaw: () => {},
+  onSubmit: () => {},
+  onReopen: () => {},
+  onDelete: () => {},
+  onClose: () => {},
+  ...over,
+});
+const view = (over: Partial<ViewProps> = {}) =>
+  renderToStaticMarkup(<EpisodeSheetView {...viewProps(over)} />);
+
+beforeEach(() => {
+  actions.update.isPending = false;
+  actions.remove.isPending = false;
+});
+
+// Spec 2026-11-26 §6.4.
+describe("EpisodeSheetView", () => {
+  it("a closed episode: Bắt đầu and Kết thúc, and Lưu submits the form", () => {
+    const html = view();
+    expect(html).toContain("<dialog");
+    expect(html).toContain(">Sửa đợt ốm</h2>");
+    expect(html).toContain(">Bắt đầu</span>");
+    expect(html).toContain(">Kết thúc</span>");
+    expect(html.match(/type="datetime-local"/g)).toHaveLength(2);
+    expect(html).toContain('value="2026-11-20T08:00"');
+    expect(html).toContain('value="2026-11-22T09:30"');
+    expect(html).toContain('<form id="f1"');
+    expect(html).toMatch(
+      /<button[^>]*form="f1"[^>]*type="submit"[^>]*min-h-14![^>]*>Lưu<\/button>/,
+    );
+    expect(html).not.toContain("Mở lại đợt ốm");
+    expect(html).not.toContain("Xóa đợt ốm");
+  });
+
+  it("an open episode has no Kết thúc", () => {
+    const html = view({ raw: { start: "2026-11-25T08:00", end: null } });
+    expect(html).toContain(">Bắt đầu</span>");
+    expect(html).not.toContain("Kết thúc");
+    expect(html.match(/type="datetime-local"/g)).toHaveLength(1);
+  });
+
+  it("an error sits under its own field", () => {
+    const html = view({
+      errors: {
+        started_at: "Giờ bắt đầu ở tương lai.",
+        ended_at: "Giờ kết thúc phải sau giờ bắt đầu.",
+      },
+    });
+    const start = html.indexOf(">Bắt đầu</span>");
+    const startError = html.indexOf(">Giờ bắt đầu ở tương lai.</span>");
+    const end = html.indexOf(">Kết thúc</span>");
+    const endError = html.indexOf(">Giờ kết thúc phải sau giờ bắt đầu.</span>");
+    expect(start).toBeLessThan(startError);
+    expect(startError).toBeLessThan(end);
+    expect(end).toBeLessThan(endError);
+    expect(html.match(/text-\[13px\] text-danger/g)).toHaveLength(2);
+  });
+
+  it("Mở lại đợt ốm and Xóa đợt ốm show only when they are allowed", () => {
+    const html = view({ canReopen: true, canDelete: true });
+    expect(html).toContain(">Mở lại đợt ốm</button>");
+    expect(html).toMatch(/text-danger![^>]*>Xóa đợt ốm<\/button>/);
+    expect(html.indexOf(">Lưu<")).toBeLessThan(html.indexOf(">Mở lại đợt ốm<"));
+    expect(html.indexOf(">Mở lại đợt ốm<")).toBeLessThan(
+      html.indexOf(">Xóa đợt ốm<"),
+    );
+  });
+
+  it("a refusal is announced above the buttons; the buttons wait while a change is on its way", () => {
+    const html = view({
+      message: "Trùng thời gian với một đợt ốm khác.",
+      canReopen: true,
+      canDelete: true,
+      busy: true,
+    });
+    expect(html).toMatch(
+      /role="alert"[^>]*>Trùng thời gian với một đợt ốm khác.<\/p>/,
+    );
+    expect(
+      html.match(
+        /<button[^>]*disabled=""[^>]*>(Lưu|Mở lại đợt ốm|Xóa đợt ốm)</g,
+      ),
+    ).toHaveLength(3);
+  });
+
+  it("the fields and the buttons report to the sheet", () => {
+    const onRaw = vi.fn();
+    const onSubmit = vi.fn();
+    const onReopen = vi.fn();
+    const onDelete = vi.fn();
+    const tree = EpisodeSheetView(
+      viewProps({
+        canReopen: true,
+        canDelete: true,
+        onRaw,
+        onSubmit,
+        onReopen,
+        onDelete,
+      }),
+    );
+    const inputs = findElements(tree, (el) => el.type === "input");
+    expect(inputs).toHaveLength(2);
+    const change = (index: number, value: string) =>
+      (inputs[index].props.onChange as (event: unknown) => void)({
+        target: { value },
+      });
+    change(0, "2026-11-20T07:00");
+    expect(onRaw).toHaveBeenLastCalledWith({
+      start: "2026-11-20T07:00",
+      end: "2026-11-22T09:30",
+    });
+    change(1, "2026-11-22T10:00");
+    expect(onRaw).toHaveBeenLastCalledWith({
+      start: "2026-11-20T08:00",
+      end: "2026-11-22T10:00",
+    });
+    const [form] = findElements(tree, (el) => el.type === "form");
+    const event = { preventDefault: () => {} } as FormEvent;
+    (form.props.onSubmit as (event: FormEvent) => void)(event);
+    expect(onSubmit).toHaveBeenCalledWith(event);
+    const press = (label: string) => {
+      const [button] = findElements(tree, (el) => el.props.children === label);
+      (button.props.onClick as () => void)();
+    };
+    press("Mở lại đợt ốm");
+    press("Xóa đợt ốm");
+    expect(onReopen).toHaveBeenCalledOnce();
+    expect(onDelete).toHaveBeenCalledOnce();
+  });
+});
+
+describe("EpisodeSheet", () => {
+  const sheet = (
+    episode: EpisodeRow,
+    episodes: EpisodeRow[],
+    canDelete = false,
+  ) =>
+    renderToStaticMarkup(
+      <EpisodeSheet
+        babyId="b1"
+        userId="u1"
+        episode={episode}
+        episodes={episodes}
+        canDelete={canDelete}
+        onClose={() => {}}
+        onDeleted={() => {}}
+      />,
+    );
+
+  it("opens on the episode's own times, in Vietnam time", () => {
+    const html = sheet(last, [old, last]);
+    expect(html).toContain('value="2026-11-20T08:00"');
+    expect(html).toContain('value="2026-11-22T09:30"');
+    expect(
+      sheet(open, [old, last, open]).match(/datetime-local/g),
+    ).toHaveLength(1);
+  });
+
+  it("offers Mở lại đợt ốm only for the latest closed episode while none is open", () => {
+    expect(sheet(last, [old, last])).toContain(">Mở lại đợt ốm</button>");
+    expect(sheet(old, [old, last])).not.toContain("Mở lại đợt ốm");
+    expect(sheet(last, [old, last, open])).not.toContain("Mở lại đợt ốm");
+    expect(sheet(open, [old, last, open])).not.toContain("Mở lại đợt ốm");
+  });
+
+  it("offers Xóa đợt ốm only to whoever may delete", () => {
+    expect(sheet(last, [old, last], true)).toContain(">Xóa đợt ốm</button>");
+    expect(sheet(last, [old, last], false)).not.toContain("Xóa đợt ốm");
+  });
+
+  it("every button waits while a change is being queued", () => {
+    actions.update.isPending = true;
+    const html = sheet(last, [old, last], true);
+    expect(html).toMatch(/aria-busy="true"[^>]*>Lưu</);
+    expect(
+      html.match(/<button[^>]*disabled=""[^>]*>(Mở lại đợt ốm|Xóa đợt ốm)</g),
+    ).toHaveLength(2);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 197 passed (198)`, `Tests  1842 passed (1842)`. File test mới không nạp được vì `./EpisodeSheet` chưa có, nên 10 test của nó chưa được đếm.

- [x] **Step 3: Viết phiếu (Patch 6)**

```diff
diff --git a/components/illness/EpisodeSheet.tsx b/components/illness/EpisodeSheet.tsx
new file mode 100644
index 0000000..4f158ba
--- /dev/null
+++ b/components/illness/EpisodeSheet.tsx
@@ -0,0 +1,230 @@
+"use client";
+
+import { useId, useState, type FormEvent } from "react";
+import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
+import { Button } from "@/components/ui/Button";
+import { Sheet } from "@/components/ui/Sheet";
+import { toVietnameseError } from "@/lib/data/errors";
+import { useEpisodeActions } from "@/lib/data/illness";
+import { canReopen, type EpisodeErrors } from "@/lib/rules/illness";
+import {
+  buildEpisodePatch,
+  type EpisodeRaw,
+  episodeToRaw,
+  planReopen,
+} from "@/lib/rules/illnessForm";
+import type { EpisodeRow } from "@/lib/supabase/rows";
+
+const DELETE_QUESTION =
+  "Xóa đợt ốm này? Các bản ghi nhiệt độ, thuốc, triệu chứng vẫn giữ nguyên.";
+
+// Spec 2026-11-26 §6.4, drawn without hooks so a test can press its buttons.
+export function EpisodeSheetView({
+  formId,
+  raw,
+  errors,
+  message,
+  dirty,
+  saving,
+  busy,
+  canReopen: reopen,
+  canDelete,
+  onRaw,
+  onSubmit,
+  onReopen,
+  onDelete,
+  onClose,
+}: {
+  formId: string;
+  raw: EpisodeRaw;
+  errors: EpisodeErrors;
+  // A refusal that belongs to no field (the server's, or of "Mở lại đợt ốm").
+  message: string | null;
+  dirty: boolean;
+  // Lưu is on its way.
+  saving: boolean;
+  // Any change is on its way: every button waits.
+  busy: boolean;
+  canReopen: boolean;
+  canDelete: boolean;
+  onRaw: (next: EpisodeRaw) => void;
+  onSubmit: (event: FormEvent) => void;
+  onReopen: () => void;
+  onDelete: () => void;
+  onClose: () => void;
+}) {
+  const field = (
+    label: string,
+    value: string,
+    setValue: (next: string) => void,
+    error: string | undefined,
+  ) => (
+    <label className="flex flex-col gap-1.5">
+      <span className={FIELD_LABEL}>{label}</span>
+      <input
+        type="datetime-local"
+        className={FIELD_INPUT}
+        value={value}
+        onChange={(event) => setValue(event.target.value)}
+      />
+      {error && <span className="text-[13px] text-danger">{error}</span>}
+    </label>
+  );
+  return (
+    <Sheet
+      open
+      onClose={onClose}
+      title="Sửa đợt ốm"
+      dirty={dirty}
+      footer={
+        <div className="flex flex-col gap-2">
+          {message && (
+            <p role="alert" className="text-[15px] text-danger">
+              {message}
+            </p>
+          )}
+          <Button
+            type="submit"
+            form={formId}
+            block
+            busy={saving}
+            disabled={busy}
+            className="min-h-14!"
+          >
+            Lưu
+          </Button>
+          {reopen && (
+            <Button
+              variant="secondary"
+              block
+              disabled={busy}
+              onClick={onReopen}
+            >
+              Mở lại đợt ốm
+            </Button>
+          )}
+          {canDelete && (
+            <Button
+              variant="ghost"
+              block
+              disabled={busy}
+              className="text-danger!"
+              onClick={onDelete}
+            >
+              Xóa đợt ốm
+            </Button>
+          )}
+        </div>
+      }
+    >
+      <form
+        id={formId}
+        onSubmit={onSubmit}
+        className="flex flex-col gap-4 pt-1"
+      >
+        {field(
+          "Bắt đầu",
+          raw.start,
+          (start) => onRaw({ ...raw, start }),
+          errors.started_at,
+        )}
+        {raw.end !== null &&
+          field(
+            "Kết thúc",
+            raw.end,
+            (end) => onRaw({ ...raw, end }),
+            errors.ended_at,
+          )}
+      </form>
+    </Sheet>
+  );
+}
+
+export function EpisodeSheet({
+  babyId,
+  userId,
+  episode,
+  episodes,
+  canDelete,
+  onClose,
+  onDeleted,
+}: {
+  babyId: string;
+  userId: string;
+  episode: EpisodeRow;
+  // Every episode of the baby, for the overlap check and for "Mở lại đợt ốm".
+  episodes: EpisodeRow[];
+  // The owner of the family or whoever started the episode.
+  canDelete: boolean;
+  onClose: () => void;
+  // The episode is gone: its page has nothing left to show.
+  onDeleted: () => void;
+}) {
+  const actions = useEpisodeActions(babyId, userId);
+  const formId = useId();
+  const [opened] = useState(() => episodeToRaw(episode));
+  const [raw, setRaw] = useState(opened);
+  const [errors, setErrors] = useState<EpisodeErrors>({});
+  const [message, setMessage] = useState<string | null>(null);
+  const onError = (error: unknown) => setMessage(toVietnameseError(error));
+
+  function submit(event: FormEvent) {
+    event.preventDefault();
+    setMessage(null);
+    const built = buildEpisodePatch({
+      episode,
+      opened,
+      raw,
+      episodes,
+      now: new Date(),
+    });
+    if (!built.ok) {
+      setErrors(built.errors);
+      return;
+    }
+    setErrors({});
+    if (built.patch === null) onClose();
+    else
+      actions.update.mutate(
+        { id: episode.id, patch: built.patch },
+        { onSuccess: onClose, onError },
+      );
+  }
+
+  // A toast would sit under the sheet's backdrop, so a refusal shows here.
+  function reopen() {
+    const plan = planReopen(episode, episodes, new Date());
+    if (!plan.ok) {
+      setMessage(plan.message);
+      return;
+    }
+    actions.update.mutate(
+      { id: episode.id, patch: plan.patch },
+      { onSuccess: onClose, onError },
+    );
+  }
+
+  function remove() {
+    if (window.confirm(DELETE_QUESTION))
+      actions.remove.mutate(episode.id, { onSuccess: onDeleted, onError });
+  }
+
+  return (
+    <EpisodeSheetView
+      formId={formId}
+      raw={raw}
+      errors={errors}
+      message={message}
+      dirty={raw.start !== opened.start || raw.end !== opened.end}
+      saving={actions.update.isPending}
+      busy={actions.update.isPending || actions.remove.isPending}
+      canReopen={canReopen(episode, episodes)}
+      canDelete={canDelete}
+      onRaw={setRaw}
+      onSubmit={submit}
+      onReopen={reopen}
+      onDelete={remove}
+      onClose={onClose}
+    />
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  198 passed (198)`, `Tests  1852 passed (1852)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/illness/EpisodeSheet.tsx components/illness/episodesheet.test.tsx
git commit -m "feat(illness): the edit sheet" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M2e, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-illness/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M2e.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  198 passed (198)`, `Tests  1852 passed (1852)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm**

Phiếu sửa chưa mở được từ trang nào: chỉ thấy được ở đây. Trang dùng `EpisodeSheetView` (phần vẽ), nên không nút nào ghi dữ liệu. Trang này không đọc hay ghi dữ liệu của gia đình và vẽ được khi chưa đăng nhập. Tạo `app/fixture-illness/page.tsx` (không commit):

```tsx
"use client";

import { useState } from "react";
import { EpisodeSheetView } from "@/components/illness/EpisodeSheet";
import type { EpisodeRaw } from "@/lib/rules/illnessForm";

// Phiếu ở đây là phần vẽ, không nối với dữ liệu: bấm nút nào cũng không ghi gì.
export default function Page() {
  const [sheet, setSheet] = useState<"closed" | "open" | null>(null);
  const [raw, setRaw] = useState<EpisodeRaw>({
    start: "2026-11-20T08:00",
    end: "2026-11-22T09:30",
  });
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture phiếu sửa đợt ốm</p>
      <button
        type="button"
        className="glass min-h-11 rounded-full px-4 text-ink"
        onClick={() => setSheet("closed")}
      >
        Mở phiếu sửa · đợt đã đóng, có lỗi
      </button>
      <button
        type="button"
        className="glass min-h-11 rounded-full px-4 text-ink"
        onClick={() => setSheet("open")}
      >
        Mở phiếu sửa · đợt đang mở
      </button>
      {sheet && (
        <EpisodeSheetView
          formId="fixture-form"
          raw={sheet === "closed" ? raw : { start: raw.start, end: null }}
          errors={
            sheet === "closed"
              ? {
                  started_at: "Trùng thời gian với một đợt ốm khác.",
                  ended_at: "Giờ kết thúc phải sau giờ bắt đầu.",
                }
              : {}
          }
          message={
            sheet === "closed" ? "Trùng thời gian với một đợt ốm khác." : null
          }
          dirty={false}
          saving={false}
          busy={false}
          canReopen={sheet === "closed"}
          canDelete
          // Gõ vào phiếu của đợt đang mở không được làm mất ô "Kết thúc" của phiếu kia.
          onRaw={sheet === "closed" ? setRaw : () => {}}
          onSubmit={(event) => event.preventDefault()}
          onReopen={() => {}}
          onDelete={() => {}}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
```

Run: `bun run typecheck`
Expected: `tsc --noEmit` không báo lỗi.

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở `http://localhost:3000/fixture-illness` trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp.

1. Trang có hai nút mở phiếu. `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
2. **Nút "Mở phiếu sửa · đợt đã đóng, có lỗi":** phiếu trượt lên, tiêu đề "Sửa đợt ốm". Hai ô ngày giờ "Bắt đầu" và "Kết thúc", mỗi ô cao ít nhất 44 px. Dưới ô "Bắt đầu" có dòng đỏ "Trùng thời gian với một đợt ốm khác."; dưới ô "Kết thúc" có "Giờ kết thúc phải sau giờ bắt đầu."; mỗi dòng nằm trọn trong phiếu. Trên các nút có câu báo "Trùng thời gian với một đợt ốm khác.". Ba nút theo thứ tự "Lưu", "Mở lại đợt ốm", "Xóa đợt ốm" (chữ đỏ), mỗi nút cao ít nhất 44 px và đều nằm trong màn hình. Phiếu ở đây chỉ là phần vẽ: bấm nút nào cũng không ghi gì. Đóng bằng Esc.
3. **Nút "Mở phiếu sửa · đợt đang mở":** chỉ có ô "Bắt đầu"; không có "Kết thúc", không có "Mở lại đợt ốm"; có "Lưu" và "Xóa đợt ốm"; không có dòng lỗi nào. Đóng bằng Esc.
4. Với phiếu đang mở: `document.documentElement.scrollWidth <= window.innerWidth` vẫn là `true`.
5. Lặp lại các mục trên trang tạm với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"` (chạy trong trang; không lưu, không đụng Cài đặt). Ở `night`: dòng lỗi vẫn đọc được trên nền phiếu, và nút "Xóa đợt ốm" phân biệt với hai nút kia bằng chữ.
6. Đặt bề ngang 390 rồi 440 và xem lại mục 2.

Trang thật (chỉ xem): mở `http://localhost:3000/`. Trang mở được như trước; lọc console bằng `onlyErrors`: không có lỗi mới. Phiếu và `useRangeLogs` chưa được trang nào dùng.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo: chiều cao của từng ô và từng nút, số dòng của hai câu lỗi, và theme nào đã xem. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

**Kết quả Step 4 (2026-11-27, khung Browser trong app, sáng, trang `http://localhost:3000/fixture-illness`):**

Cách đo: `innerWidth` đọc trước mỗi lần đo (375, 390, 440 đều đúng). Theme giữ bằng một `MutationObserver` trên `data-theme`, đã ngắt khi xong. `nextjs-portal` đã xóa trước khi đo và chụp. Phiếu được đo sau khi trượt lên xong (đo sớm hơn 1 giây thì phiếu còn đang trượt và mọi tọa độ nằm dưới mép màn hình; đó không phải lỗi). "Trong phiếu" nghĩa là hình chữ nhật của phần tử nằm trọn trong tấm phiếu và trong màn hình.

1. **Mục 1, đạt.** Hai nút mở phiếu, mỗi nút 343 × 44 px. `scrollWidth` 375 ≤ `innerWidth` 375.
2. **Mục 2, đạt (375 px, `rose`).** Tiêu đề "Sửa đợt ốm". Ô "Bắt đầu" và ô "Kết thúc" mỗi ô 317 × 44 px, giá trị không bị cắt. Dưới ô "Bắt đầu": "Trùng thời gian với một đợt ốm khác.", 13 px, **1 dòng** (cao 19,5 px), trong phiếu. Dưới ô "Kết thúc": "Giờ kết thúc phải sau giờ bắt đầu.", 13 px, **1 dòng**, trong phiếu. Câu báo phía trên các nút (`role="alert"`): 1 dòng, trong phiếu. Nút theo đúng thứ tự: "Lưu" 317 × 56 px, "Mở lại đợt ốm" 317 × 50 px, "Xóa đợt ốm" 317 × 50 px, chữ màu `danger`; mỗi nút 1 dòng chữ; đáy nút cuối ở 783 px, màn hình cao 812 px. Tấm phiếu từ 277,5 tới 804 px. Không phần tử nào có "…". Esc đóng phiếu.
3. **Mục 3, đạt.** Chỉ có ô "Bắt đầu" (317 × 44 px); không có "Kết thúc", không có "Mở lại đợt ốm", không dòng lỗi, không câu báo. "Lưu" 56 px, "Xóa đợt ốm" 50 px. Tấm phiếu từ 501 tới 804 px. Esc đóng phiếu.
4. **Mục 4, đạt.** Với phiếu đang mở, `scrollWidth <= innerWidth` là `true` ở mọi lần đo (cả ba bề ngang, cả bốn theme).
5. **Mục 5, đạt.** Ở 375 px bốn theme `rose`, `light`, `dark`, `night` cho cùng số đo từng số, cho cả hai phiếu; Esc đóng được cả tám lần. Nhìn bằng mắt ở 375 px: `rose` cả hai phiếu, `light` và `dark` phiếu có lỗi, `night` cả hai phiếu. Ở `night`: hai dòng lỗi và câu báo đọc được trên nền phiếu; "Xóa đợt ốm" khác hai nút kia bằng chữ và bằng hình (không nền, không viền; "Mở lại đợt ốm" có viền, "Lưu" có nền).
6. **Mục 6, đạt.** 390 px (màn hình 844): ô và nút rộng 332 px, chiều cao như mục 2, tấm phiếu từ 309,5 tới 836 px. 440 px (màn hình 956): rộng 382 px, tấm phiếu từ 421,5 tới 948 px. Ở cả hai bề ngang, bốn theme cùng số đo; mọi câu 1 dòng, mọi nút trong màn hình, không "…", không tràn ngang. Nhìn bằng mắt: 390 px `rose`, 440 px `night`.
7. **Ngoài plan, trên fixture.** Đặt một giá trị vào ô "Bắt đầu" của phiếu đợt đã đóng (qua sự kiện `input`): ô nhận `2026-11-21T07:15`, ô "Kết thúc" không đổi. Xóa trống ô: ô hiện "dd/mm/yyyy, --:--" và vẫn cao 44 px. Mở phiếu "đợt đang mở" rồi quay lại phiếu kia: ô "Kết thúc" còn nguyên `2026-11-22T09:30`.
8. **Trang thật `/` (chỉ xem, 375 px, theme `dark` của máy).** Mở được như trước, không bị đưa về `/dang-nhap`, không tràn ngang; console lọc `onlyErrors`: không có dòng nào. Không bấm gì.

Không lỗi nào lộ ra ở bước này; code không đổi sau Task 3.

**Chưa kiểm:**

- Theme `peach`, `lavender`, `sea`.
- iPhone thật và Safari iOS: ô `datetime-local` của iOS vẽ khác Chromium (dùng bộ chọn ngày giờ của máy); chiều cao ô và nút trên iOS chưa đo. Màn hình thấp hơn 812 px cũng chưa đo.
- `EpisodeSheet` (phần giữ trạng thái): chưa trang nào dùng. Ba hàm `submit`, `reopen`, `remove` của nó chưa có test nào chạy qua (test của Task 3 chỉ vẽ tĩnh và bấm `EpisodeSheetView`), và chưa được bấm trong trình duyệt: "Lưu", "Mở lại đợt ốm", "Xóa đợt ốm" thật, hộp hỏi `window.confirm`, hộp hỏi bỏ thay đổi khi đang sửa dở. M2f gắn phiếu vào trang chi tiết; lần bấm thật đầu tiên là của người dùng (Bước 38).
- Câu "Nhập giờ bắt đầu", "Nhập giờ kết thúc" và câu báo của server trong phiếu thật: chỉ có unit test của luật; trên fixture chỉ thấy các câu đặt sẵn.
- Lý do của Diễn giải 7 (Toast nằm dưới lớp nền mờ của phiếu): chưa nhìn trong trình duyệt, vì chưa nơi nào vừa mở phiếu vừa hiện Toast.
- `useRangeLogs` chưa có trang nào dùng: chưa có lệnh đọc thật nào tới Supabase; việc đọc từng trang 1000 hàng chỉ kiểm bằng vật thế trong test.

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

| Bước                        | Plan (đã cộng 4 của M2c và M2d)                           | Đo thật                                 |
| --------------------------- | --------------------------------------------------------- | --------------------------------------- |
| Step 0, nền                 | 195 file / 1825 test                                      | 195 file / 1825 test                    |
| Task 1 đỏ                   | `1 failed \| 195 passed (196)`, `8 failed \| 1825 passed` | khớp                                    |
| Task 1 xanh                 | 196 / 1833                                                | 196 / 1833, `tsc` thoát 0               |
| Task 2 đỏ                   | `1 failed \| 196 passed (197)`, `1833 passed`             | khớp (file test mới không nạp được)     |
| Task 2 xanh                 | 197 / 1846                                                | 197 / 1846, `tsc` thoát 0               |
| Task 3 đỏ                   | `1 failed \| 197 passed (198)`, `1846 passed`             | khớp (file test mới không nạp được)     |
| Task 3 xanh, cũng là Step 1 | 198 / 1856                                                | **198 file / 1856 test**, `tsc` thoát 0 |

- Số đỏ và xanh của cả ba task khớp plan sau khi cộng 4. Sáu patch áp sạch bằng `kb_patch`. Không có bản sửa nào, nên không có test nào thêm ngoài plan.
- **Step 2, build:** lần đầu thoát 1 với thông báo bảo mật của Next.js 16.4.3 (không chạy `next upgrade`), lần hai thoát 0, `✓ Generating static pages (40/40)`. Code không đổi sau lần build đó.
- **Step 3:** trang fixture qua `tsc --noEmit`. Server dev chạy bằng `preview_start` với một `.claude/launch.json` tạm; file đó và trang fixture đã xóa, server đã tắt.
- **Step 4:** ghi ngay dưới Step 4. Không lỗi nào lộ ra.
- **Step 5:** sau khi xóa trang tạm, `tsc --noEmit` đỏ một lần vì `.next/dev/types/validator.ts` còn trỏ tới trang vừa xóa; xóa `.next/dev/types` và `.next/types` rồi chạy lại thì thoát 0.
- **Khác với ghi chú của plan:** các file plan M2a–M2g đã được commit từ trước (không còn untracked), nên commit docs của plan này là một lần sửa file. Plan này không dùng API nào của Next ngoài chỉ thị `"use client"`; trang `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md` đã đọc trước Task 3.
- **Spec đã sửa cho khớp (cùng commit docs):** §5.7 và §6.4, "Mở lại đợt ốm" bị từ chối thì câu lỗi hiện ngay trong sheet, không bằng `Toast` (Diễn giải 7); §6.4, ô bị xóa trống báo "Nhập giờ bắt đầu" hoặc "Nhập giờ kết thúc" (Diễn giải 5). Cả hai ghi rõ là khác bản đã duyệt ngày 2026-11-26.
- **Không thuộc plan này, chưa ghi vào spec:** việc nới 2 phút cho "≤ lúc này" của đợt đang mở (§4.3) nằm ở M2b (`OPEN_SLACK_MS` trong `lib/rules/illness.ts`); plan này không áp dụng nó ở đâu. Spec §4.3 hiện chưa có câu nào về nó.
- **Chưa kiểm:** xem danh sách ở cuối kết quả Step 4. Plan này không đụng DB, không chạy pgTAP.
- **Cho các plan sau:** nền của M2f là 198 file / 1856 test (plan M2f ghi 1852): vẫn cộng 4 vào mọi con số test xanh của M2f và M2g; cuối M2 là 200 file / 1879 test nếu không plan nào thêm test. Code của plan này đúng y sáu patch, không có dòng nào khác đi. `EpisodeSheet` chưa từng chạy với trạng thái thật: M2f là nơi đầu tiên mở nó, nên bước trình duyệt của M2f cần xem cả phần giữ trạng thái (ít nhất các đường không ghi dữ liệu: "Lưu" khi không đổi gì, ô giờ ở tương lai, ô bị xóa trống, đóng khi đang sửa dở).

```bash
git status --short   # file plan này hiện là untracked (??); các file plan khác của M2 chưa chạy cũng vậy, không add chúng
git add docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2e.md
git commit -m "docs(plan): the M2e plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 7: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m2e
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy, ở theme nào; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
