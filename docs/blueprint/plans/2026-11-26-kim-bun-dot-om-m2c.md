# Kim Bun — Đợt ốm M2c: biểu đồ sốt Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§6.5 trừ mốc "Khám"; phần `feverChartModel` của §10.1; phần biểu đồ của §10.3)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Có biểu đồ sốt kèm mốc liều hạ sốt của một đợt ốm. Biểu đồ chưa nằm trên trang nào; M2f đặt nó lên trang chi tiết.

**Architecture:**

- **Mô hình:** `feverChartModel` trong `lib/rules/illness.ts` là hàm thuần trả về điểm, mốc, vạch chia và chỗ đặt nhãn, dưới dạng tỉ lệ của vùng vẽ.
- **Hình vẽ:** `components/illness/FeverChart.tsx` là SVG vẽ tay, chỉ đổi tỉ lệ ra tọa độ; `FeverChartCard` bọc nó trong một thẻ có tiêu đề và chú thích.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m2c`, cắt từ `main` sau khi M2b đã lên. Baseline: 1772 test vitest xanh (191 file), typecheck sạch.

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

1. **Mô hình trả tỉ lệ 0–1, component đổi ra tọa độ.** `viewBox` là 330×204: vùng vẽ từ x 34 tới 322 và y 26 tới 154 (chừa chỗ phía trên cho nhãn của lần đo nằm sát đỉnh thang), hàng liều hạ sốt ở y 170, tên ngày ở y 198.
2. **Hàng liều hạ sốt nằm dưới vùng vẽ** như spec ghi; bản vẽ đặt các hình thoi đè lên đáy vùng vẽ.
3. **Nhãn giá trị** chỉ có ở chấm mới nhất và ở chấm cao nhất từ 38,0 (hai lần đo cao nhất bằng nhau: lấy lần sau); cùng một chấm thì một nhãn. Spec không nói chỗ đặt nhãn. Plan chọn: nhãn nằm trên chấm, không kèm "°C" (đơn vị đã ghi ở trục); nhãn neo đầu hoặc cuối chữ vào chấm khi chấm cách mép dưới 10% bề ngang; mỗi nhãn có một viền màu nền thẻ để đọc được khi đường nối chạy qua. Riêng nhãn của chấm mới nhất: mô hình tính ô chữ của nó và lấy chỗ đầu tiên không che một chấm khác hay nhãn của chấm cao nhất, theo thứ tự trên chấm, bên phải chấm (bên phải chấm mới nhất không bao giờ có gì được vẽ; dùng khi chấm chưa quá 85% bề ngang), dưới chấm (khi chấm cao hơn 20% bề cao), bên trái chấm (khi chấm đã quá 85% bề ngang); không chỗ nào trống thì lấy chỗ che các chấm khác ít nhất, và không bao giờ lấy chỗ chạm nhãn của chấm cao nhất (sửa ngày 2026-11-27 sau bước trình duyệt; bản đầu ghi "thì ở trên", làm hai nhãn số đè lên nhau trên trục nhiều ngày: xem "Sửa lỗi lộ ra khi kiểm" ở cuối file). Không chỗ nào trống là khi mấy lần đo cuối chỉ cách nhau vài pixel: trục 5 đến 7 ngày, hoặc đo dồn trong vài giờ. Nhãn khi ấy có thể che một phần một chấm trước, số vẫn đọc được. Bài học từ biểu đồ Tăng trưởng: nhãn đè nhau là loại lỗi hay gặp nhất, và dáng thường gặp nhất ở đây là đo lại sau một liều hạ sốt, thấp hơn lần trước một chút.
4. **Chữ "Sốt" của vùng tô** nằm ở góc trên phải như bản vẽ; khi một chấm hay một nhãn chạm tới chỗ đó thì chữ sang góc trên trái, rồi tới giữa; cả ba chỗ đều vướng thì ở lại bên phải.
5. **Đợt dài hơn 7 ngày:** chỉ vẽ 7 ngày cuối; thang nhiệt tính theo các lần đo được vẽ. Đợt có lần đo nhưng không lần nào nằm trong 7 ngày cuối: vẽ khung trống, không dùng câu "Chưa có lần đo nào trong đợt này." (câu đó chỉ cho đợt không có lần đo nào).
6. **`aria-label`:** "Biểu đồ nhiệt độ: {n} lần đo, cao nhất {x}°C, {m} liều hạ sốt."; đợt bị cắt thì "Biểu đồ nhiệt độ, 7 ngày gần nhất: …" và ba con số chỉ tính 7 ngày được vẽ. Spec chỉ nêu ba thứ phải có.
7. **Vạch ranh giới ngày chạy xuống qua hàng liều hạ sốt**, để thấy liều nào thuộc ngày nào. **Chú thích luôn có đủ ba mục**, kể cả khi đợt chưa có liều hạ sốt nào.
8. **Trục dọc** ghi số không kèm đơn vị, "°C" ở góc trên trái, số 38 đậm: theo bản vẽ.
9. **Lần đo là chấm tròn, liều hạ sốt là hình thoi:** khác nhau cả hình dạng, để theme `night` (một tông màu) vẫn phân biệt được.
10. **Mốc "Khám" của §6.5** thuộc M5, chưa có ở đây.
11. **Biểu đồ chưa nằm trên trang nào.** Bước trình duyệt chỉ xem trang fixture; M2f mới đưa nó lên trang chi tiết.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này (thêm ngày 2026-11-27: **Patch 5** đến **Patch 8** ở cuối file là hai bản sửa lỗi lộ ra khi kiểm). Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ commit cuối của M2b trong bản chạy thử. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang fixture của Task 3 đã qua `tsc --noEmit`. `bun run build` đã chạy xanh một lần trên bản sao có đủ cả bảy plan của M2, chưa chạy riêng cho plan này.
- **Đã nhìn thử khi viết plan.** Mười ba khối của trang fixture đã được mở ở 375 px, theme `rose`, trên bản sao (không có dữ liệu thật), sau khi sửa cách đặt nhãn theo góp ý của reviewer: hình rộng 317 px; đoạn đo của mục 11 trả `overlaps`, `outside`, `onDot` đều rỗng ở cả mười hai khối có hình; nhãn "Hôm nay" rộng 44 px, nhãn ngày khác 26 px. Chưa xem: ba theme `light`, `dark`, `night`, bề ngang 390 và 440, và trang thật.
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

Plan này đứng sau M2b. M2f đặt `FeverChartCard` lên trang chi tiết; M4 dùng `FeverChart` trong Báo cáo; M5 thêm mốc "Khám" vào mô hình và hình vẽ.

**Consumes (M2b):** `episodeReadings`, `antipyreticTimes`, `episodeDayCount`, `formatCelsius`, `type Reading`, `type EpisodeLike` (`lib/rules/illness.ts`).

**Consumes (đã ở `main` từ trước):** `LogLike`; `hasFever`; `addDays`, `formatDayShort`, `vnDayStartMs`; `vnDateString`; `Glass`.

**Produces:**

- `lib/rules/illness.ts`: `type FeverChartLabel`, `type FeverChartPoint`, `type FeverChart`, `feverChartModel(logs: LogLike[], episode: EpisodeLike, now: Date): FeverChart | null` (kiểu đầy đủ ở Task 1).
- `components/illness/FeverChart.tsx`: `FeverChart(props: { chart: FeverChart })`; `FeverChartCard(props: { chart: FeverChart | null })`.
- **Vitest sau M2c:** 1801 test, 193 file (plan viết 1798; hai bản sửa lỗi ở cuối file thêm 3 test, nên con số "sau plan" của M2d đến M2g đều cộng 3).

---

### Task 1: Mô hình của biểu đồ sốt: `feverChartModel` (§6.5)

**Files:**

- Modify: `lib/rules/illness.ts`
- Test: `lib/rules/feverChart.test.ts` (mới)

**Interfaces:**

- Consumes (M2b): `episodeReadings`, `antipyreticTimes`, `episodeDayCount`, `formatCelsius`, `Reading`, `EpisodeLike`; `hasFever`; `addDays`, `formatDayShort`, `vnDayStartMs`; `vnDateString`.
- Produces:
  - `type FeverChartLabel = { text: string; anchor: "start" | "middle" | "end"; place: "above" | "side" | "below" }` (`side` với `anchor: "start"` là bên phải chấm, với `anchor: "end"` là bên trái)
  - `type FeverChartPoint = { at: number; celsius: number; x: number; y: number; latest: boolean; label: FeverChartLabel | null }`
  - `type FeverChart = { truncated: boolean; days: { day: string; label: string; x: number }[]; dividers: number[]; ticks: { celsius: number; y: number }[]; feverY: number; feverWord: "start" | "middle" | "end"; points: FeverChartPoint[]; doses: { at: number; x: number }[]; ariaLabel: string }`. Mọi `x` và `y` là tỉ lệ 0–1 của vùng vẽ (`x` từ trái sang, `y` từ độ thấp nhất lên).
  - `feverChartModel(logs: LogLike[], episode: EpisodeLike, now: Date): FeverChart | null` (`null` khi đợt không có lần đo nào)

- [x] **Step 0: Kiểm M2b đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
grep -q "export function canReopen" lib/rules/illness.ts && echo "M2b có trên main"
git checkout -b feat/kim-bun-dot-om-m2c
bunx vitest run
```

Expected: dòng `M2b có trên main`; `Test Files  191 passed (191)`, `Tests  1772 passed (1772)`. Không thấy dòng đó thì dừng: M2b chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/feverChart.test.ts b/lib/rules/feverChart.test.ts
new file mode 100644
index 0000000..10b852a
--- /dev/null
+++ b/lib/rules/feverChart.test.ts
@@ -0,0 +1,343 @@
+import { describe, expect, it } from "vitest";
+import type { LogLike } from "./describeLog";
+import { type EpisodeLike, feverChartModel } from "./illness";
+
+const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
+const iso = (text: string) => vn(text).toISOString();
+const episode = (start: string, end: string | null = null): EpisodeLike => ({
+  id: "ep1",
+  started_at: iso(start),
+  ended_at: end === null ? null : iso(end),
+});
+const temp = (time: string, celsius: number): LogLike => ({
+  type: "temperature",
+  started_at: iso(time),
+  ended_at: iso(time),
+  details: { celsius, method: "nach" },
+});
+const dose = (time: string): LogLike => ({
+  type: "medicine",
+  started_at: iso(time),
+  ended_at: iso(time),
+  details: { name: "Hapacol", amount: 2.5, unit: "ml", antipyretic: true },
+});
+const round = (value: number) => Math.round(value * 1000) / 1000;
+
+// Spec 2026-11-26 §6.5.
+describe("feverChartModel", () => {
+  it("is null when the episode has no reading", () => {
+    const open = episode("2026-11-25 08:00");
+    const now = vn("2026-11-25 12:00");
+    expect(feverChartModel([], open, now)).toBeNull();
+    // A reading before the episode and a dose are not readings of the episode.
+    expect(
+      feverChartModel(
+        [temp("2026-11-25 07:00", 39), dose("2026-11-25 09:00")],
+        open,
+        now,
+      ),
+    ).toBeNull();
+  });
+
+  it("one day: the whole of today, 36 to 40 degrees, the fever line in the middle", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-25 12:00", 38.6), dose("2026-11-25 18:00")],
+      episode("2026-11-25 08:00"),
+      vn("2026-11-25 20:00"),
+    )!;
+    expect(chart.truncated).toBe(false);
+    expect(chart.days).toEqual([
+      { day: "2026-11-25", label: "Hôm nay", x: 0.5 },
+    ]);
+    expect(chart.dividers).toEqual([]);
+    expect(chart.ticks).toEqual([
+      { celsius: 36, y: 0 },
+      { celsius: 37, y: 0.25 },
+      { celsius: 38, y: 0.5 },
+      { celsius: 39, y: 0.75 },
+      { celsius: 40, y: 1 },
+    ]);
+    expect(chart.feverY).toBe(0.5);
+    expect(chart.points).toHaveLength(1);
+    expect(chart.points[0]).toMatchObject({
+      celsius: 38.6,
+      x: 0.5,
+      latest: true,
+      label: { text: "38,6", anchor: "middle", place: "above" },
+    });
+    expect(round(chart.points[0].y)).toBe(0.65);
+    expect(chart.doses).toEqual([
+      { at: vn("2026-11-25 18:00").getTime(), x: 0.75 },
+    ]);
+    expect(chart.ariaLabel).toBe(
+      "Biểu đồ nhiệt độ: 1 lần đo, cao nhất 38,6°C, 1 liều hạ sốt.",
+    );
+  });
+
+  it("three days: a label in the middle of each day, a divider between days", () => {
+    const logs = [
+      temp("2026-11-24 23:40", 38.4),
+      temp("2026-11-25 15:00", 39.2),
+      temp("2026-11-26 09:00", 37.6),
+      dose("2026-11-25 15:10"),
+      dose("2026-11-24 23:00"), // before the episode
+    ];
+    const open = episode("2026-11-24 23:30");
+    const now = vn("2026-11-26 10:00");
+    const chart = feverChartModel(logs, open, now)!;
+    expect(chart.days.map((day) => [day.label, round(day.x)])).toEqual([
+      ["24/11", 0.167],
+      ["25/11", 0.5],
+      ["Hôm nay", 0.833],
+    ]);
+    expect(chart.dividers.map(round)).toEqual([0.333, 0.667]);
+    expect(chart.points.map((point) => point.celsius)).toEqual([
+      38.4, 39.2, 37.6,
+    ]);
+    expect(chart.doses).toHaveLength(1);
+    // The same answer for the array in any order.
+    expect(feverChartModel([...logs].reverse(), open, now)).toEqual(chart);
+    expect(
+      feverChartModel([logs[2], logs[0], logs[4], logs[1], logs[3]], open, now),
+    ).toEqual(chart);
+  });
+
+  it("labels the newest point and the highest one from 38,0; one label when they are the same point", () => {
+    const open = episode("2026-11-24 08:00");
+    const now = vn("2026-11-26 10:00");
+    const labels = (logs: LogLike[]) =>
+      feverChartModel(logs, open, now)!.points.map((point) =>
+        point.label ? point.label.text : null,
+      );
+    expect(
+      labels([
+        temp("2026-11-24 09:00", 38.4),
+        temp("2026-11-24 20:00", 39.2),
+        temp("2026-11-26 09:00", 37.6),
+      ]),
+    ).toEqual([null, "39,2", "37,6"]);
+    expect(
+      labels([temp("2026-11-24 09:00", 38.4), temp("2026-11-26 09:00", 39)]),
+    ).toEqual([null, "39"]);
+    // No reading from 38,0: only the newest point has a label.
+    expect(
+      labels([temp("2026-11-24 09:00", 37.8), temp("2026-11-26 09:00", 37.2)]),
+    ).toEqual([null, "37,2"]);
+    // Two equal highest readings: the later one carries the label.
+    expect(
+      labels([
+        temp("2026-11-24 09:00", 39.2),
+        temp("2026-11-25 09:00", 39.2),
+        temp("2026-11-26 09:00", 37.2),
+      ]),
+    ).toEqual([null, "39,2", "37,2"]);
+  });
+
+  it("only the newest point is marked latest", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-24 09:00", 38.4), temp("2026-11-24 20:00", 39.2)],
+      episode("2026-11-24 08:00"),
+      vn("2026-11-24 21:00"),
+    )!;
+    expect(chart.points.map((point) => point.latest)).toEqual([false, true]);
+  });
+
+  it("a label near an edge is anchored to stay inside the plot", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-24 00:30", 39.4), temp("2026-11-26 23:30", 38.2)],
+      episode("2026-11-24 00:10"),
+      vn("2026-11-26 23:40"),
+    )!;
+    expect(chart.points.map((point) => point.label?.anchor)).toEqual([
+      "start",
+      "end",
+    ]);
+  });
+
+  it("the newest label moves beside its dot when above it would cover the highest reading's label", () => {
+    const open = episode("2026-11-24 08:00");
+    const now = vn("2026-11-24 22:00");
+    const places = (logs: LogLike[]) =>
+      feverChartModel(logs, open, now)!.points.map(
+        (point) => point.label?.place,
+      );
+    expect(
+      places([temp("2026-11-24 12:00", 39.2), temp("2026-11-24 13:00", 38.9)]),
+    ).toEqual(["above", "side"]);
+    // Far apart in time, or far apart in degrees: both stay above.
+    expect(
+      places([temp("2026-11-24 09:00", 39.2), temp("2026-11-24 20:00", 38.9)]),
+    ).toEqual(["above", "above"]);
+    expect(
+      places([temp("2026-11-24 12:00", 39.6), temp("2026-11-24 13:00", 36.8)]),
+    ).toEqual(["above", "above"]);
+  });
+
+  it("a lower reading soon after a higher one: its label does not cover the earlier dot", () => {
+    // Three days; the fever is coming down. The earlier dot of today has no
+    // label of its own, and the newest label above its dot would sit on it.
+    const chart = feverChartModel(
+      [
+        temp("2026-11-25 15:00", 39.2),
+        temp("2026-11-26 08:00", 38.6),
+        temp("2026-11-26 09:00", 38.1),
+      ],
+      episode("2026-11-24 23:30"),
+      vn("2026-11-26 10:00"),
+    )!;
+    expect(chart.points.map((point) => point.label)).toEqual([
+      { text: "39,2", anchor: "middle", place: "above" },
+      null,
+      { text: "38,1", anchor: "start", place: "side" },
+    ]);
+  });
+
+  it("near the right edge there is no room beside the dot: the label goes under it", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-24 22:00", 38.6), temp("2026-11-24 23:00", 38.1)],
+      episode("2026-11-24 00:10"),
+      vn("2026-11-24 23:50"),
+    )!;
+    expect(chart.points[1].label).toEqual({
+      text: "38,1",
+      anchor: "end",
+      place: "below",
+    });
+    // Above and under both taken (the fever went down, then up again): the
+    // label goes beside the dot on the left.
+    const zigzag = feverChartModel(
+      [
+        temp("2026-11-26 14:00", 38.8),
+        temp("2026-11-26 17:00", 37.6),
+        temp("2026-11-26 20:00", 38.3),
+      ],
+      episode("2026-11-24 23:30"),
+      vn("2026-11-26 21:00"),
+    )!;
+    expect(zigzag.points.map((point) => point.label)).toEqual([
+      { text: "38,8", anchor: "middle", place: "above" },
+      null,
+      { text: "38,3", anchor: "end", place: "side" },
+    ]);
+    // Low on the scale as well: nothing fits, so it stays above.
+    const low = feverChartModel(
+      [temp("2026-11-24 22:00", 36.9), temp("2026-11-24 23:00", 36.5)],
+      episode("2026-11-24 00:10"),
+      vn("2026-11-24 23:50"),
+    )!;
+    expect(low.points[1].label?.place).toBe("above");
+  });
+
+  it("the word Sốt takes the first of right, left, middle that no dot and no label reaches", () => {
+    const open = episode("2026-11-24 00:10");
+    const now = vn("2026-11-24 23:50");
+    const word = (logs: LogLike[], of: EpisodeLike = open, at: Date = now) =>
+      feverChartModel(logs, of, at)!.feverWord;
+    expect(word([temp("2026-11-24 12:00", 39.8)])).toBe("end");
+    // A dot high up near the right edge.
+    expect(word([temp("2026-11-24 22:00", 39.8)])).toBe("start");
+    // On the right but well under the top band: the word stays.
+    expect(word([temp("2026-11-24 22:00", 38.6)])).toBe("end");
+    // The newest reading 39,1 late on the last of three days: its label,
+    // anchored at its end, reaches the top right corner.
+    expect(
+      word(
+        [temp("2026-11-26 20:00", 39.1)],
+        episode("2026-11-24 23:30"),
+        vn("2026-11-26 21:00"),
+      ),
+    ).toBe("start");
+    // Right and left both taken: the middle.
+    expect(
+      word([temp("2026-11-24 01:00", 39.9), temp("2026-11-24 22:00", 39.8)]),
+    ).toBe("middle");
+    // All three taken: it stays on the right.
+    expect(
+      word([
+        temp("2026-11-24 01:00", 39.9),
+        temp("2026-11-24 12:00", 39.9),
+        temp("2026-11-24 22:00", 39.8),
+      ]),
+    ).toBe("end");
+  });
+
+  it("the scale grows by whole degrees to hold a low and a very high reading", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-24 09:00", 35.2), temp("2026-11-24 20:00", 40.6)],
+      episode("2026-11-24 08:00"),
+      vn("2026-11-24 21:00"),
+    )!;
+    expect(chart.ticks.map((tick) => tick.celsius)).toEqual([
+      35, 36, 37, 38, 39, 40, 41,
+    ]);
+    expect(chart.feverY).toBe(0.5);
+    expect(round(chart.points[1].y)).toBe(0.933);
+  });
+
+  it("more than 7 days: only the last 7, and it says so", () => {
+    const logs = [
+      temp("2026-11-18 09:00", 39.8), // day 1, outside the window
+      dose("2026-11-18 09:10"),
+      temp("2026-11-21 09:00", 38.8),
+      temp("2026-11-27 09:00", 37),
+      dose("2026-11-21 09:10"),
+    ];
+    const chart = feverChartModel(
+      logs,
+      episode("2026-11-18 08:00"),
+      vn("2026-11-27 10:00"),
+    )!;
+    expect(chart.truncated).toBe(true);
+    expect(chart.days.map((day) => day.label)).toEqual([
+      "21/11",
+      "22/11",
+      "23/11",
+      "24/11",
+      "25/11",
+      "26/11",
+      "Hôm nay",
+    ]);
+    expect(chart.dividers).toHaveLength(6);
+    expect(chart.points.map((point) => point.celsius)).toEqual([38.8, 37]);
+    expect(chart.points[0].label?.text).toBe("38,8");
+    expect(chart.doses).toHaveLength(1);
+    expect(chart.ariaLabel).toBe(
+      "Biểu đồ nhiệt độ, 7 ngày gần nhất: 2 lần đo, cao nhất 38,8°C, 1 liều hạ sốt.",
+    );
+  });
+
+  it("exactly 7 days is not cut", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-21 09:00", 38.8)],
+      episode("2026-11-21 08:00"),
+      vn("2026-11-27 10:00"),
+    )!;
+    expect(chart.truncated).toBe(false);
+    expect(chart.days).toHaveLength(7);
+  });
+
+  it("readings only before the window: an empty frame, not the empty state", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-18 09:00", 39.8)],
+      episode("2026-11-18 08:00"),
+      vn("2026-11-27 10:00"),
+    )!;
+    expect(chart.points).toEqual([]);
+    expect(chart.ticks.map((tick) => tick.celsius)).toEqual([
+      36, 37, 38, 39, 40,
+    ]);
+    expect(chart.ariaLabel).toBe(
+      "Biểu đồ nhiệt độ, 7 ngày gần nhất: 0 lần đo, 0 liều hạ sốt.",
+    );
+  });
+
+  it("a closed episode ends on the day of its end, by its date", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-20 09:00", 38.8), temp("2026-11-21 09:00", 37)],
+      episode("2026-11-20 08:00", "2026-11-21 12:00"),
+      vn("2026-11-27 10:00"),
+    )!;
+    expect(chart.days.map((day) => day.label)).toEqual(["20/11", "21/11"]);
+    expect(chart.points[1].latest).toBe(true);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 191 passed (192)`, `Tests  15 failed | 1772 passed (1787)`. 15 test của file mới đỏ vì `feverChartModel` chưa có.

- [x] **Step 3: Viết mô hình (Patch 2)**

Patch thêm vào cuối `lib/rules/illness.ts` và thêm `formatDayShort` vào dòng import đầu file.

```diff
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index 1ad983e..81f9c1b 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -1,4 +1,4 @@
-import { addDays, vnDayStartMs } from "./days";
+import { addDays, formatDayShort, vnDayStartMs } from "./days";
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
 import { vnDateString } from "./time";
@@ -388,3 +388,226 @@ export function canReopen(
   if (episodes.some((other) => other.ended_at === null)) return false;
   return episodes.every((other) => startOf(other) <= startOf(episode));
 }
+
+const CHART_DAYS = 7;
+
+// The chart's geometry, in fractions of the plot (about 288 × 128 px at
+// 375 px wide), so the model can keep the texts apart.
+type Box = { x0: number; x1: number; y0: number; y1: number };
+const hit = (a: Box, b: Box) =>
+  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
+// A dot, with a little air round it.
+const DOT_X = 0.025;
+const DOT_Y = 0.055;
+// A value label such as "38,6", halo included.
+const LABEL_W = 0.11;
+// A label nearer than this to the left or right edge is anchored inwards.
+const LABEL_EDGE = 0.1;
+// The newest label may sit beside its dot up to here, under it from here up.
+const SIDE_MAX_X = 0.85;
+const BELOW_MIN_Y = 0.2;
+// The word "Sốt" in the top band of the plot: right, left, then middle.
+const WORD_Y0 = 0.87;
+const WORD_BOXES: { at: "start" | "middle" | "end"; x0: number; x1: number }[] =
+  [
+    { at: "end", x0: 0.9, x1: 1 },
+    { at: "start", x0: 0, x1: 0.1 },
+    { at: "middle", x0: 0.45, x1: 0.55 },
+  ];
+
+export type FeverChartLabel = {
+  // "38,6", without the unit.
+  text: string;
+  // Which end of the text sits on the point, so it stays inside the plot.
+  anchor: "start" | "middle" | "end";
+  // Above the dot; or, where that would cover another dot or label, beside
+  // it or under it. Beside is to the right with anchor "start" and to the
+  // left with anchor "end".
+  place: "above" | "side" | "below";
+};
+
+export type FeverChartPoint = {
+  at: number;
+  celsius: number;
+  // 0 = left edge of the plot, 1 = right edge.
+  x: number;
+  // 0 = lowest degree of the scale, 1 = highest.
+  y: number;
+  latest: boolean;
+  label: FeverChartLabel | null;
+};
+
+export type FeverChart = {
+  // The episode is longer than 7 days: only its last 7 are drawn.
+  truncated: boolean;
+  // One per day; x is the middle of the day.
+  days: { day: string; label: string; x: number }[];
+  // The day borders inside the plot.
+  dividers: number[];
+  // One per whole degree, lowest first.
+  ticks: { celsius: number; y: number }[];
+  // Where 38,0 sits on the scale.
+  feverY: number;
+  // Where in the top band of the fever zone the word "Sốt" sits: the first
+  // of right, left, middle that no dot and no label reaches.
+  feverWord: "start" | "middle" | "end";
+  // Oldest first.
+  points: FeverChartPoint[];
+  doses: { at: number; x: number }[];
+  ariaLabel: string;
+};
+
+const dotBox = (x: number, y: number): Box => ({
+  x0: x - DOT_X,
+  x1: x + DOT_X,
+  y0: y - DOT_Y,
+  y1: y + DOT_Y,
+});
+
+function labelBox(x: number, y: number, label: FeverChartLabel): Box {
+  if (label.place === "side") {
+    const left = label.anchor === "end" ? x - 0.035 - LABEL_W : x + 0.035;
+    return { x0: left, x1: left + LABEL_W, y0: y - 0.06, y1: y + 0.06 };
+  }
+  const x0 =
+    label.anchor === "start"
+      ? x - 0.01
+      : label.anchor === "end"
+        ? x + 0.01 - LABEL_W
+        : x - LABEL_W / 2;
+  return label.place === "above"
+    ? { x0, x1: x0 + LABEL_W, y0: y + 0.07, y1: y + 0.21 }
+    : { x0, x1: x0 + LABEL_W, y0: y - 0.19, y1: y - 0.06 };
+}
+
+// Spec §6.5: everything the fever chart draws, as fractions of the plot; the
+// component only turns them into pixels. null when the episode has no reading
+// at all (the card then says so).
+export function feverChartModel(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): FeverChart | null {
+  const readings = episodeReadings(logs, episode, now);
+  if (readings.length === 0) return null;
+
+  const today = vnDateString(now);
+  const count = episodeDayCount(episode, now);
+  const shown = Math.min(count, CHART_DAYS);
+  const lastDay = addDays(
+    vnDateString(new Date(episode.started_at)),
+    count - 1,
+  );
+  const firstDay = addDays(lastDay, 1 - shown);
+  const from = vnDayStartMs(firstDay);
+  const span = shown * DAY_MS;
+  const xOf = (at: number) => (at - from) / span;
+  const inWindow = (at: number) => at >= from && at < from + span;
+
+  const drawn = readings.filter((reading) => inWindow(reading.at));
+  const degrees = drawn.map((reading) => reading.celsius);
+  const yMin = Math.min(36, Math.floor(Math.min(...degrees, 36)));
+  const yMax = Math.max(40, Math.ceil(Math.max(...degrees, 40)));
+  const yOf = (celsius: number) => (celsius - yMin) / (yMax - yMin);
+
+  const latest = drawn.at(-1) ?? null;
+  let peak: Reading | null = null;
+  for (const reading of drawn)
+    if (hasFever(reading.celsius) && (!peak || reading.celsius >= peak.celsius))
+      peak = reading;
+
+  const points = drawn.map((reading): FeverChartPoint => ({
+    at: reading.at,
+    celsius: reading.celsius,
+    x: xOf(reading.at),
+    y: yOf(reading.celsius),
+    latest: reading === latest,
+    label: null,
+  }));
+  const anchorOf = (x: number) =>
+    x < LABEL_EDGE ? "start" : x > 1 - LABEL_EDGE ? "end" : "middle";
+  const boxes: Box[] = points.map((point) => dotBox(point.x, point.y));
+
+  // The highest reading keeps its label above the dot.
+  const peakPoint = points.find(
+    (point) => point.at === peak?.at && !point.latest,
+  );
+  if (peak && peakPoint && peak !== latest) {
+    peakPoint.label = {
+      text: formatCelsius(peak.celsius),
+      anchor: anchorOf(peakPoint.x),
+      place: "above",
+    };
+    boxes.push(labelBox(peakPoint.x, peakPoint.y, peakPoint.label));
+  }
+  // The newest label takes the first place that covers no other dot and not
+  // the highest reading's label: above, beside on the right, under, beside on
+  // the left. Nothing is ever drawn to the right of the newest dot, so that
+  // side is free whenever it fits; near the right edge it does not fit, and
+  // the left side is the last try (the line runs behind the label there, and
+  // the halo keeps it readable).
+  const newest = points.at(-1);
+  if (newest) {
+    const others = boxes.filter((_, index) => index !== points.length - 1);
+    const text = formatCelsius(newest.celsius);
+    const options: FeverChartLabel[] = [
+      { text, anchor: anchorOf(newest.x), place: "above" },
+      ...(newest.x <= SIDE_MAX_X
+        ? [{ text, anchor: "start", place: "side" } as const]
+        : []),
+      ...(newest.y >= BELOW_MIN_Y
+        ? [{ text, anchor: anchorOf(newest.x), place: "below" } as const]
+        : []),
+      ...(newest.x > SIDE_MAX_X
+        ? [{ text, anchor: "end", place: "side" } as const]
+        : []),
+    ];
+    newest.label =
+      options.find((option) => {
+        const box = labelBox(newest.x, newest.y, option);
+        return !others.some((other) => hit(box, other));
+      }) ?? options[0];
+    boxes.push(labelBox(newest.x, newest.y, newest.label));
+  }
+  const feverWord =
+    WORD_BOXES.find(
+      (word) =>
+        !boxes.some((box) => hit(box, { ...word, y0: WORD_Y0, y1: 1.05 })),
+    )?.at ?? "end";
+
+  const doses = antipyreticTimes(logs, episode, now)
+    .filter(inWindow)
+    .map((at) => ({ at, x: xOf(at) }));
+
+  const highest = degrees.length > 0 ? Math.max(...degrees) : null;
+  const ariaLabel = [
+    `Biểu đồ nhiệt độ${count > CHART_DAYS ? ", 7 ngày gần nhất" : ""}: ${drawn.length} lần đo`,
+    ...(highest === null ? [] : [`cao nhất ${formatCelsius(highest)}°C`]),
+    `${doses.length} liều hạ sốt.`,
+  ].join(", ");
+
+  return {
+    truncated: count > CHART_DAYS,
+    days: Array.from({ length: shown }, (_, index) => {
+      const day = addDays(firstDay, index);
+      return {
+        day,
+        label: day === today ? "Hôm nay" : formatDayShort(day),
+        x: (index + 0.5) / shown,
+      };
+    }),
+    dividers: Array.from(
+      { length: shown - 1 },
+      (_, index) => (index + 1) / shown,
+    ),
+    ticks: Array.from({ length: yMax - yMin + 1 }, (_, index) => ({
+      celsius: yMin + index,
+      y: index / (yMax - yMin),
+    })),
+    feverY: yOf(38),
+    feverWord,
+    points,
+    doses,
+    ariaLabel,
+  };
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  192 passed (192)`, `Tests  1787 passed (1787)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/illness.ts lib/rules/feverChart.test.ts
git commit -m "feat(illness): the fever chart model" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Hình vẽ biểu đồ và thẻ của nó (§6.5)

**Files:**

- Create: `components/illness/FeverChart.tsx`
- Test: `components/illness/feverchart.test.tsx` (mới)

**Interfaces:**

- Consumes: `feverChartModel`, `FeverChart` (Task 1); `Glass` (`components/ui/Glass.tsx`).
- Produces:
  - `FeverChart(props: { chart: FeverChart })`: một `<svg role="img">`, `viewBox="0 0 330 204"`.
  - `FeverChartCard(props: { chart: FeverChart | null })`: thẻ "Nhiệt độ và thuốc hạ sốt" có hình, chú thích, dòng "7 ngày gần nhất" khi bị cắt; `null` thì chỉ có câu "Chưa có lần đo nào trong đợt này."
  - Để test và bước trình duyệt tìm: nhãn giá trị mang `data-point-label`, mốc liều mang `data-dose`, vạch ranh giới ngày mang `data-day-border`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/illness/feverchart.test.tsx b/components/illness/feverchart.test.tsx
new file mode 100644
index 0000000..e337d67
--- /dev/null
+++ b/components/illness/feverchart.test.tsx
@@ -0,0 +1,141 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import type { LogLike } from "@/lib/rules/describeLog";
+import { type EpisodeLike, feverChartModel } from "@/lib/rules/illness";
+import { FeverChart, FeverChartCard } from "./FeverChart";
+
+const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
+const iso = (text: string) => vn(text).toISOString();
+const episode = (start: string): EpisodeLike => ({
+  id: "ep1",
+  started_at: iso(start),
+  ended_at: null,
+});
+const temp = (time: string, celsius: number): LogLike => ({
+  type: "temperature",
+  started_at: iso(time),
+  ended_at: iso(time),
+  details: { celsius, method: "nach" },
+});
+const dose = (time: string): LogLike => ({
+  type: "medicine",
+  started_at: iso(time),
+  ended_at: iso(time),
+  details: { name: "Hapacol", amount: 2.5, unit: "ml", antipyretic: true },
+});
+
+const threeDays = feverChartModel(
+  [
+    temp("2026-11-24 23:40", 38.4),
+    temp("2026-11-25 15:00", 39.2),
+    temp("2026-11-26 09:00", 37.6),
+    dose("2026-11-25 15:10"),
+    dose("2026-11-26 02:00"),
+  ],
+  episode("2026-11-24 23:30"),
+  vn("2026-11-26 10:00"),
+)!;
+
+// Spec 2026-11-26 §6.5.
+describe("FeverChart", () => {
+  const html = renderToStaticMarkup(<FeverChart chart={threeDays} />);
+
+  it("is one image with the model's description", () => {
+    expect(html).toMatch(/^<svg[^>]*role="img"/);
+    expect(html).toContain(
+      'aria-label="Biểu đồ nhiệt độ: 3 lần đo, cao nhất 39,2°C, 2 liều hạ sốt."',
+    );
+    expect(html).toContain('viewBox="0 0 330 204"');
+  });
+
+  it("draws a dot per reading on one line, the newest one larger", () => {
+    expect(html.match(/<circle/g)).toHaveLength(3);
+    expect(html.match(/<circle[^>]*r="4"/g)).toHaveLength(2);
+    expect(html.match(/<circle[^>]*r="6.5"/g)).toHaveLength(1);
+    expect(html.match(/<polyline/g)).toHaveLength(1);
+    expect(html).toContain('stroke="var(--color-cat-temp)"');
+  });
+
+  it("labels the highest and the newest reading, with a halo in the card's colour", () => {
+    expect(html).toMatch(/<text[^>]*data-point-label[^>]*>39,2<\/text>/);
+    expect(html).toMatch(/<text[^>]*data-point-label[^>]*>37,6<\/text>/);
+    expect(html.match(/data-point-label/g)).toHaveLength(2);
+    expect(html).toMatch(
+      /data-point-label[^>]*stroke="var\(--color-glass-solid\)"/,
+    );
+  });
+
+  it("marks each dose with a diamond in the medicine colour, under the plot", () => {
+    expect(html.match(/data-dose/g)).toHaveLength(2);
+    expect(html).toMatch(
+      /<path[^>]*data-dose[^>]*fill="var\(--color-cat-med\)"/,
+    );
+  });
+
+  it("shades the fever zone, names it and dashes the 38 line", () => {
+    expect(html).toMatch(/<rect[^>]*fill="var\(--color-danger\)"/);
+    expect(html).toMatch(/<text[^>]*text-anchor="end"[^>]*>Sốt<\/text>/);
+    expect(html).toMatch(/<line[^>]*stroke-dasharray="4 4"/);
+    expect(html.match(/stroke-dasharray="4 4"/g)).toHaveLength(1);
+  });
+
+  it("names the whole degrees and the days, with a line at each day border", () => {
+    for (const degree of [36, 37, 38, 39, 40])
+      expect(html).toContain(`>${degree}</text>`);
+    expect(html).toContain(">°C</text>");
+    for (const day of ["24/11", "25/11", "Hôm nay"])
+      expect(html).toContain(`>${day}</text>`);
+    expect(html.match(/data-day-border/g)).toHaveLength(2);
+  });
+
+  it("uses no colour of its own", () => {
+    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
+  });
+
+  it("a single reading has a dot and no line", () => {
+    const one = renderToStaticMarkup(
+      <FeverChart
+        chart={feverChartModel(
+          [temp("2026-11-25 12:00", 38.6)],
+          episode("2026-11-25 08:00"),
+          vn("2026-11-25 20:00"),
+        )!}
+      />,
+    );
+    expect(one.match(/<circle/g)).toHaveLength(1);
+    expect(one).not.toContain("<polyline");
+  });
+});
+
+describe("FeverChartCard", () => {
+  it("titles the chart and explains its three marks", () => {
+    const html = renderToStaticMarkup(<FeverChartCard chart={threeDays} />);
+    expect(html).toContain(">Nhiệt độ và thuốc hạ sốt</h2>");
+    expect(html).toContain("<svg");
+    for (const text of ["Nhiệt độ", "Liều hạ sốt", "Từ 38°C là sốt"])
+      expect(html).toContain(`${text}</span>`);
+    expect(html).not.toContain("7 ngày gần nhất");
+    expect(html).not.toContain("Chưa có lần đo nào");
+  });
+
+  it("says so when only the last 7 days are drawn", () => {
+    const long = feverChartModel(
+      [temp("2026-11-21 09:00", 38.8)],
+      episode("2026-11-18 08:00"),
+      vn("2026-11-27 10:00"),
+    )!;
+    const html = renderToStaticMarkup(<FeverChartCard chart={long} />);
+    expect(html).toContain(">7 ngày gần nhất</p>");
+    expect(html.indexOf("</svg>")).toBeLessThan(
+      html.indexOf(">7 ngày gần nhất</p>"),
+    );
+  });
+
+  it("without a reading: only the title and one sentence", () => {
+    const html = renderToStaticMarkup(<FeverChartCard chart={null} />);
+    expect(html).toContain(">Nhiệt độ và thuốc hạ sốt</h2>");
+    expect(html).toContain(">Chưa có lần đo nào trong đợt này.</p>");
+    expect(html).not.toContain("<svg");
+    expect(html).not.toContain("Liều hạ sốt");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 192 passed (193)`, `Tests  1787 passed (1787)`. File test mới không nạp được vì `./FeverChart` chưa có, nên 11 test của nó chưa được đếm.

- [x] **Step 3: Viết component (Patch 4)**

Hình vẽ bằng SVG tay, không dùng recharts: render tĩnh được nên test đọc được từng phần tử. Màu chỉ lấy qua biến CSS của theme.

```diff
diff --git a/components/illness/FeverChart.tsx b/components/illness/FeverChart.tsx
new file mode 100644
index 0000000..f1c3b29
--- /dev/null
+++ b/components/illness/FeverChart.tsx
@@ -0,0 +1,235 @@
+import { Glass } from "@/components/ui/Glass";
+import type { FeverChart as FeverChartModel } from "@/lib/rules/illness";
+
+// The drawing, in viewBox units (about one CSS px at 375 px wide).
+const WIDTH = 330;
+const HEIGHT = 204;
+const LEFT = 34;
+const RIGHT = 322;
+// Room above the plot for the label of a reading at the top of the scale.
+const TOP = 26;
+const BOTTOM = 154;
+// The row of dose marks under the plot, and the day names under that.
+const DOSE_Y = 170;
+const DAY_Y = 198;
+
+const MUTED = "var(--color-muted)";
+const INK = "var(--color-ink)";
+const TEMP = "var(--color-cat-temp)";
+
+const px = (x: number) => LEFT + x * (RIGHT - LEFT);
+const py = (y: number) => BOTTOM - y * (BOTTOM - TOP);
+const round = (value: number) => Math.round(value * 10) / 10;
+
+// Spec 2026-11-26 §6.5: the fever chart. Everything it draws comes from
+// feverChartModel; this component only turns fractions into coordinates.
+// A reading is a round dot and a dose a diamond, so the two differ by shape
+// as well as colour (theme night has one hue).
+export function FeverChart({ chart }: { chart: FeverChartModel }) {
+  const feverY = round(py(chart.feverY));
+  return (
+    <svg
+      role="img"
+      aria-label={chart.ariaLabel}
+      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
+      className="w-full"
+    >
+      <rect
+        x={LEFT}
+        y={TOP}
+        width={RIGHT - LEFT}
+        height={feverY - TOP}
+        fill="var(--color-danger)"
+        fillOpacity={0.07}
+      />
+      {chart.ticks
+        .filter((tick) => tick.celsius !== 38)
+        .map((tick) => (
+          <line
+            key={tick.celsius}
+            x1={LEFT}
+            x2={RIGHT}
+            y1={round(py(tick.y))}
+            y2={round(py(tick.y))}
+            stroke={INK}
+            strokeOpacity={0.08}
+          />
+        ))}
+      <line
+        x1={LEFT}
+        x2={RIGHT}
+        y1={feverY}
+        y2={feverY}
+        stroke="var(--color-danger)"
+        strokeWidth={1.5}
+        strokeDasharray="4 4"
+      />
+      {chart.dividers.map((x) => (
+        <line
+          key={x}
+          data-day-border
+          x1={round(px(x))}
+          x2={round(px(x))}
+          y1={TOP}
+          y2={DOSE_Y + 10}
+          stroke={INK}
+          strokeOpacity={0.14}
+        />
+      ))}
+      <text x={6} y={11} fontSize={11} fill={MUTED}>
+        °C
+      </text>
+      {chart.ticks.map((tick) => (
+        <text
+          key={tick.celsius}
+          x={LEFT - 6}
+          y={round(py(tick.y)) + 4}
+          textAnchor="end"
+          fontSize={11}
+          fontWeight={tick.celsius === 38 ? 600 : 400}
+          fill={tick.celsius === 38 ? "var(--color-danger-ink)" : MUTED}
+        >
+          {tick.celsius}
+        </text>
+      ))}
+      <text
+        x={
+          chart.feverWord === "end"
+            ? RIGHT - 4
+            : chart.feverWord === "start"
+              ? LEFT + 4
+              : (LEFT + RIGHT) / 2
+        }
+        y={TOP + 12}
+        textAnchor={chart.feverWord}
+        fontSize={11}
+        fontWeight={600}
+        fill="var(--color-danger-ink)"
+      >
+        Sốt
+      </text>
+      {chart.days.map((day) => (
+        <text
+          key={day.day}
+          x={round(px(day.x))}
+          y={DAY_Y}
+          textAnchor="middle"
+          fontSize={11}
+          fill={MUTED}
+        >
+          {day.label}
+        </text>
+      ))}
+      {chart.points.length > 1 && (
+        <polyline
+          points={chart.points
+            .map((point) => `${round(px(point.x))},${round(py(point.y))}`)
+            .join(" ")}
+          fill="none"
+          stroke={TEMP}
+          strokeWidth={2.5}
+          strokeLinecap="round"
+          strokeLinejoin="round"
+        />
+      )}
+      {chart.points.map((point) => (
+        <circle
+          key={point.at}
+          cx={round(px(point.x))}
+          cy={round(py(point.y))}
+          r={point.latest ? 6.5 : 4}
+          fill={TEMP}
+          stroke={point.latest ? "var(--color-glass-solid)" : "none"}
+          strokeWidth={point.latest ? 2.5 : 0}
+        />
+      ))}
+      {chart.doses.map((dose) => (
+        <path
+          key={dose.at}
+          data-dose
+          d={`M${round(px(dose.x))} ${DOSE_Y - 6}l6 6-6 6-6-6z`}
+          fill="var(--color-cat-med)"
+        />
+      ))}
+      {chart.points.map(
+        (point) =>
+          point.label && (
+            <text
+              key={point.at}
+              data-point-label
+              x={
+                round(px(point.x)) +
+                (point.label.place !== "side"
+                  ? 0
+                  : point.label.anchor === "end"
+                    ? -11
+                    : 11)
+              }
+              y={
+                round(py(point.y)) +
+                (point.label.place === "side"
+                  ? 4.5
+                  : point.label.place === "below"
+                    ? 21
+                    : point.latest
+                      ? -12
+                      : -9)
+              }
+              textAnchor={point.label.anchor}
+              fontSize={point.latest ? 13 : 12}
+              fontWeight={700}
+              fill={INK}
+              // A halo in the card's colour keeps the number readable where
+              // the line runs behind it.
+              stroke="var(--color-glass-solid)"
+              strokeWidth={3}
+              strokeLinejoin="round"
+              style={{ paintOrder: "stroke" }}
+            >
+              {point.label.text}
+            </text>
+          ),
+      )}
+    </svg>
+  );
+}
+
+const LEGEND = "flex items-center gap-1.5";
+
+// The card around the chart: its title, what the marks mean, and the two
+// notes of spec §6.5.
+export function FeverChartCard({ chart }: { chart: FeverChartModel | null }) {
+  return (
+    <Glass className="flex flex-col gap-2.5 p-3">
+      <h2 className="px-1 text-[15px] font-semibold text-ink">
+        Nhiệt độ và thuốc hạ sốt
+      </h2>
+      {chart ? (
+        <>
+          <FeverChart chart={chart} />
+          {chart.truncated && (
+            <p className="px-1 text-xs text-muted">7 ngày gần nhất</p>
+          )}
+          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1 text-xs text-muted">
+            <span className={LEGEND}>
+              <span className="size-2.5 rounded-full bg-cat-temp" />
+              Nhiệt độ
+            </span>
+            <span className={LEGEND}>
+              <span className="size-[9px] rotate-45 bg-cat-med" />
+              Liều hạ sốt
+            </span>
+            <span className={LEGEND}>
+              <span className="w-3.5 border-t-2 border-dashed border-danger" />
+              Từ 38°C là sốt
+            </span>
+          </div>
+        </>
+      ) : (
+        <p className="px-1 text-[15px] text-muted">
+          Chưa có lần đo nào trong đợt này.
+        </p>
+      )}
+    </Glass>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  193 passed (193)`, `Tests  1798 passed (1798)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/illness/FeverChart.tsx components/illness/feverchart.test.tsx
git commit -m "feat(illness): the fever chart" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M2c, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-illness/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M2c.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  193 passed (193)`, `Tests  1798 passed (1798)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm**

Biểu đồ chưa nằm trên trang nào của app, nên chỉ thấy được ở đây: mười ba dáng, gồm những dáng dễ làm nhãn đè nhau. Trang này không đọc hay ghi dữ liệu của gia đình và vẽ được khi chưa đăng nhập. Tạo `app/fixture-illness/page.tsx` (không commit):

```tsx
"use client";

import { FeverChartCard } from "@/components/illness/FeverChart";
import type { LogLike } from "@/lib/rules/describeLog";
import { type EpisodeLike, feverChartModel } from "@/lib/rules/illness";

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

// Biểu đồ: các dáng mà dữ liệu thật không có.
const CHARTS: { name: string; episode: EpisodeLike; logs: LogLike[] }[] = [
  { name: "3 ngày", episode: THREE_DAYS, logs: THREE_DAYS_LOGS },
  {
    name: "1 ngày, một lần đo",
    episode: episode("2026-11-26 06:00"),
    logs: [temp("2026-11-26 06:10", 38.4), dose("2026-11-26 06:20")],
  },
  {
    name: "hơn 7 ngày (đợt 10 ngày)",
    episode: episode("2026-11-17 08:00"),
    logs: [
      temp("2026-11-17 09:00", 39.9),
      temp("2026-11-20 09:00", 38.8),
      temp("2026-11-21 20:00", 39.1),
      temp("2026-11-22 09:00", 38.2),
      temp("2026-11-23 09:00", 37.8),
      temp("2026-11-24 09:00", 38.1),
      temp("2026-11-25 09:00", 37.5),
      temp("2026-11-26 09:00", 37),
      dose("2026-11-20 09:10"),
      dose("2026-11-21 20:10"),
      dose("2026-11-22 09:10"),
      dose("2026-11-24 09:10"),
    ],
  },
  {
    name: "không có lần đo",
    episode: THREE_DAYS,
    logs: [dose("2026-11-25 09:00")],
  },
  {
    name: "đỉnh sát lần đo mới nhất (nhãn mới nhất nằm bên phải chấm)",
    episode: episode("2026-11-26 00:10"),
    logs: [temp("2026-11-26 08:00", 39.2), temp("2026-11-26 09:00", 38.9)],
  },
  {
    name: "nhãn ở góc trên phải (chữ Sốt sang trái)",
    episode: episode("2026-11-25 20:00", "2026-11-25 23:50"),
    logs: [temp("2026-11-25 20:30", 38.5), temp("2026-11-25 23:00", 39.8)],
  },
  {
    name: "lần đo đầu ngày, sát mép trái, 40,0",
    episode: episode("2026-11-26 00:05"),
    logs: [temp("2026-11-26 00:20", 40), temp("2026-11-26 09:30", 38.4)],
  },
  {
    name: "đo lại sau một giờ, thấp hơn (nhãn bên phải, không che chấm trước)",
    episode: episode("2026-11-24 23:30"),
    logs: [
      temp("2026-11-25 15:00", 39.2),
      temp("2026-11-26 08:00", 38.6),
      temp("2026-11-26 09:00", 38.1),
    ],
  },
  {
    name: "sát mép phải, đo lại thấp hơn (nhãn dưới chấm)",
    episode: episode("2026-11-25 00:10", "2026-11-25 23:50"),
    logs: [temp("2026-11-25 22:00", 38.6), temp("2026-11-25 23:00", 38.1)],
  },
  {
    name: "hạ rồi sốt lại cuối ngày thứ ba (nhãn bên trái chấm)",
    episode: episode("2026-11-23 23:30", "2026-11-25 21:00"),
    logs: [
      temp("2026-11-25 14:00", 38.8),
      temp("2026-11-25 17:00", 37.6),
      temp("2026-11-25 20:00", 38.3),
    ],
  },
  {
    name: "mới nhất 39,1 cuối ngày thứ ba (chữ Sốt sang trái)",
    episode: episode("2026-11-23 23:30", "2026-11-25 21:00"),
    logs: [temp("2026-11-24 09:00", 38.4), temp("2026-11-25 20:00", 39.1)],
  },
  {
    name: "mới nhất đúng 40,0 (sát mép trên)",
    episode: episode("2026-11-26 00:05"),
    logs: [temp("2026-11-26 05:00", 38.5), temp("2026-11-26 09:30", 40)],
  },
  {
    name: "thang 34 đến 43",
    episode: episode("2026-11-25 08:00"),
    logs: [
      temp("2026-11-25 09:00", 34.2),
      temp("2026-11-25 20:00", 42.6),
      temp("2026-11-26 09:00", 36.8),
    ],
  },
];

const CASE = "px-1 text-[13px] text-muted";

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture biểu đồ sốt</p>
      {CHARTS.map((item) => (
        <div
          key={item.name}
          data-case={item.name}
          className="flex flex-col gap-1"
        >
          <span className={CASE}>{item.name}</span>
          <FeverChartCard
            chart={feverChartModel(item.logs, item.episode, NOW)}
          />
        </div>
      ))}
    </main>
  );
}
```

Run: `bun run typecheck`
Expected: `tsc --noEmit` không báo lỗi.

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở `http://localhost:3000/fixture-illness` trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp.

1. Trang có mười ba khối, mỗi khối một thẻ "Nhiệt độ và thuốc hạ sốt". `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
2. **"3 ngày":** một đường nối 10 chấm tròn, chấm mới nhất to hơn và có viền; nhãn "39,2" trên chấm cao nhất và "37,6" bên phải chấm mới nhất (chỗ phía trên đã có chấm 37,9 của lần đo trước); 4 hình thoi trên một hàng riêng dưới vùng vẽ; vùng từ 38 trở lên tô nhạt, có chữ "Sốt" ở góc trên phải; đường 38 nét đứt; trục dọc 36 đến 40, số 38 đậm, "°C" ở góc trên trái; ba nhãn ngày "24/11", "25/11", "Hôm nay" và hai vạch dọc ở ranh giới ngày; chú thích "Nhiệt độ", "Liều hạ sốt", "Từ 38°C là sốt".
3. **"1 ngày, một lần đo":** một chấm, không có đường nối; nhãn "38,4"; một hình thoi; một nhãn ngày "Hôm nay".
4. **"hơn 7 ngày":** bảy nhãn ngày từ "20/11" tới "Hôm nay", không nhãn nào đè nhau; dòng "7 ngày gần nhất" ngay dưới hình; lần đo 39,9 của ngày 17/11 không được vẽ; nhãn "39,1" và "37".
5. **"không có lần đo":** thẻ chỉ có tiêu đề và câu "Chưa có lần đo nào trong đợt này.", không có hình, không có chú thích.
6. **"đỉnh sát lần đo mới nhất":** "39,2" nằm trên chấm của nó, "38,9" nằm bên phải chấm mới nhất; hai nhãn không đè nhau.
7. **"nhãn ở góc trên phải":** chữ "Sốt" nằm ở góc trên trái của vùng tô; nhãn "39,8" không đè chữ nào.
8. **"lần đo đầu ngày, sát mép trái, 40,0":** nhãn "40" nằm trọn trong hình, không bị cắt ở mép trái hay mép trên.
9. **"đo lại sau một giờ, thấp hơn":** nhãn "38,1" nằm bên phải chấm mới nhất và không che chấm 38,6 ngay trước nó; "39,2" trên chấm cao nhất của hôm qua. **"sát mép phải, đo lại thấp hơn":** nhãn "38,1" nằm dưới chấm mới nhất (bên phải không còn chỗ), "38,6" trên chấm trước. **"hạ rồi sốt lại cuối ngày thứ ba":** nhãn "38,3" nằm bên trái chấm mới nhất (trên và dưới đều vướng chấm khác), "38,8" trên chấm cao nhất; đường nối chạy sau nhãn vẫn đọc được. **"mới nhất 39,1 cuối ngày thứ ba":** chữ "Sốt" ở góc trên trái, nhãn "39,1" không đè chữ nào. **"mới nhất đúng 40,0":** nhãn "40" nằm trọn trong hình, không bị cắt ở mép trên.
10. **"thang 34 đến 43":** mười số 34 đến 43 trên trục dọc, không số nào đè nhau; nhãn "42,6" nằm trọn trong hình.
11. Chạy đoạn đo dưới đây trong trang. Mọi khối phải trả `overlaps: []`, `outside: []`, `onDot: []`: không hai chữ nào trong một hình giao nhau, không chữ nào ra ngoài hình, không nhãn giá trị nào đè lên một chấm.

```js
const box = (el) => el.getBoundingClientRect();
const hit = (a, b) =>
  a.left < b.right - 0.5 &&
  b.left < a.right - 0.5 &&
  a.top < b.bottom - 0.5 &&
  b.top < a.bottom - 0.5;
JSON.stringify(
  [...document.querySelectorAll("[data-case]")].flatMap((block) => {
    const svg = block.querySelector("svg[role=img]");
    if (!svg) return [];
    const frame = box(svg);
    const texts = [...svg.querySelectorAll("text")];
    const overlaps = [];
    texts.forEach((a, i) =>
      texts.slice(i + 1).forEach((b) => {
        if (hit(box(a), box(b)))
          overlaps.push(`${a.textContent} x ${b.textContent}`);
      }),
    );
    const outside = texts
      .filter((t) => {
        const r = box(t);
        return (
          r.left < frame.left - 0.5 ||
          r.right > frame.right + 0.5 ||
          r.top < frame.top - 0.5 ||
          r.bottom > frame.bottom + 0.5
        );
      })
      .map((t) => t.textContent);
    const onDot = [...svg.querySelectorAll("[data-point-label]")]
      .filter((label) =>
        [...svg.querySelectorAll("circle")].some((dot) =>
          hit(box(label), box(dot)),
        ),
      )
      .map((label) => label.textContent);
    return [
      {
        name: block.dataset.case,
        width: Math.round(frame.width),
        overlaps,
        outside,
        onDot,
      },
    ];
  }),
);
```

12. Lặp lại các mục trên trang tạm với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"` (chạy trong trang; không lưu, không đụng Cài đặt). Ở `night` (một tông màu): chấm tròn và hình thoi vẫn phân biệt được bằng hình dạng; chữ "Sốt", đường 38 nét đứt và các nhãn giá trị vẫn đọc được trên nền thẻ.
13. Đặt bề ngang 390 rồi 440 (`resize_window` với `width` và `height: 812`) và chạy lại mục 11.

Trang thật (chỉ xem): mở `http://localhost:3000/`. Trang mở được như trước; lọc console bằng `onlyErrors`: không có lỗi mới. Plan này chưa đưa biểu đồ lên trang nào, nên không có gì để xem thêm ở trang thật.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo: bề ngang của hình ở 375 px, kết quả của đoạn đo ở từng theme và từng bề ngang. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

**Kết quả Step 4 (2026-11-27, khoảng 09:45 đến 10:20, khung Browser trong app):**

Server dev chạy bằng `preview_start` với một `.claude/launch.json` tạm (đã xóa). Khung mở ở theme `dark`; theme đổi bằng `document.documentElement.dataset.theme` trong trang. Ban ngày nên app không tự đặt lại `night`. Khung bỏ cỡ 375 px một lần giữa hai ảnh chụp trong cùng một lượt gọi; từ đó mỗi lượt đặt lại cỡ và đọc `innerWidth` trước khi đo.

- Mục 1: đạt. `innerWidth` 375, `scrollWidth` 375; 13 khối, 13 thẻ, 12 hình.
- Mục 2 đến 10: đạt, đọc bằng thuộc tính của từng phần tử và nhìn ảnh chụp. "3 ngày": 10 chấm, 1 đường nối, 1 chấm to có viền, "39,2" trên chấm cao nhất, "37,6" bên phải chấm mới nhất, 4 hình thoi cùng một hàng, 2 vạch ranh giới, "Sốt" ở góc phải, một đường nét đứt, trục 36 đến 40 với 38 đậm, "°C". "hơn 7 ngày": 7 chấm, 7 nhãn ngày, 6 vạch, dòng "7 ngày gần nhất", nhãn "39,1" và "37". "không có lần đo": chỉ tiêu đề và một câu. Chỗ đặt nhãn của các khối còn lại đúng như plan tả: bên phải ("38,9", "38,1"), dưới ("38,1" sát mép phải), bên trái ("38,3"), "Sốt" sang trái ở ba khối có nhãn hay chấm ở góc trên phải, hai nhãn "40" nằm trọn trong hình, thang 34 đến 43 đủ mười số.
- Mục 11, ở 375 px: hình rộng 317 px; `overlaps`, `outside`, `onDot` rỗng ở cả 12 khối có hình. Nhãn "Hôm nay" rộng 44 px, nhãn ngày khác 25 đến 26 px.
- Mục 12: đoạn đo rỗng ở cả bốn theme `rose`, `light`, `dark`, `night`. Nhìn bằng mắt: `rose` (khối 1 đến 5 và 9 đến 11, phóng to khối "nhãn bên trái chấm"), `night` (khối 1 đến 3), `light` (khối 9 đến 11), `dark` (khối 5 đến 7). Ở `night` chấm tròn và hình thoi khác nhau rõ bằng hình dạng; chữ "Sốt", đường 38 nét đứt và các nhãn đọc được. Chưa nhìn bằng mắt: từng khối ở từng theme (các khối còn lại chỉ có số đo).
- Mục 13: 390 px (hình 332 px) và 440 px (hình 382 px): đoạn đo rỗng ở cả bốn theme.
- Trang thật: `/` mở được, đang đăng nhập, tab Hôm nay như trước, không tràn ngang, không có lỗi console mới. Không bấm gì.

**Ngoài plan, vì cách đặt nhãn chưa reviewer nào đọc lại:** một trang tạm thứ hai vẽ 600 đợt ốm sinh ngẫu nhiên (hạt giống cố định; 1 đến 10 ngày, tới 13 lần đo, 60% số đợt có thêm một cụm đo trong 5 giờ cuối) và chạy đúng đoạn đo của mục 11 lên tất cả. Kết quả lần đầu: 44 đợt không rỗng, gồm 12 đợt có hai nhãn số đè lên nhau và 38 đợt nhãn đè lên một chấm; cả 44 đều là nhánh "không chỗ nào trống thì ở trên". Các chỗ đặt khác (phải, dưới, trái) không lệch với trình duyệt ở đợt nào. Console của trang đó còn báo hai phần tử trùng key. Hai lỗi đã sửa, xem "Sửa lỗi lộ ra khi kiểm" ở cuối file.

**Sau hai bản sửa, chạy lại cả bước này:** 13 khối của plan giữ nguyên chỗ đặt nhãn; thêm 4 khối cho các dáng vừa tìm ra (trục 7 ngày "39 / 38,2 / 38,6", trục 6 ngày "40 rồi 39,9", hai lần đo và hai liều cùng một phút, "36,9 rồi 36,5" sát mép phải). 16 khối có hình: đoạn đo rỗng ở 375, 390, 440 px, mỗi bề ngang bốn theme. 600 đợt ngẫu nhiên ở 375, 390, 440 px: 0 đợt chữ đè nhau, 0 đợt chữ ra ngoài hình, 22 đợt nhãn che một phần một chấm trước (cụm đo dày, không chỗ nào trống: giới hạn đã ghi ở Diễn giải 3). Tải lại trang có hai liều cùng phút: không thêm lỗi console nào.

**Chưa kiểm:** ba theme `peach`, `lavender`, `sea` (plan không liệt kê); máy thật; biểu đồ trên trang thật (chưa trang nào dùng nó, M2f mới đặt lên).

- [x] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-illness
bun run typecheck
git status --short  # không còn app/fixture-illness
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts` (thư mục `.next` còn trỏ tới trang tạm vừa xóa): chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [x] **Step 6: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này hiện là untracked (??); các file plan khác của M2 chưa chạy cũng vậy, không add chúng
git add docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2c.md
git commit -m "docs(plan): the M2c plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

**Kết quả (2026-11-27):**

- **Điểm xuất phát và điểm dừng khác plan, theo lời giao của phiên điều phối:** nhánh `feat/kim-bun-dot-om-m2c` cắt từ `feat/kim-bun-dot-om-m2b` @ `79066d8`, không từ `main`; Step 7 không chạy: không gộp vào `main`, không đẩy gì lên `origin`. Lý do: migration `20261126000200_illness_episodes.sql` của M2a chưa áp lên Supabase thật, và spec cấm đưa lên `main` code cần một migration chưa áp; phiên điều phối gộp và đẩy cả chồng nhánh M2 sau.
- Step 0: `canReopen` có trên nhánh M2b; nền 191 file / 1772 test, khớp. Các file plan của M2 đã được commit từ trước (ghi chú "chưa được commit" không còn đúng), nên Step 6 commit file này như một file đã theo dõi.
- Task 1: đỏ `1 failed | 191 passed (192)`, `15 failed | 1772 passed (1787)`; xanh 192 file / 1787 test; `tsc --noEmit` thoát 0. Khớp plan.
- Task 2: đỏ `1 failed | 192 passed (193)`, `1787 passed (1787)`; xanh 193 file / 1798 test; `tsc --noEmit` thoát 0. Khớp plan.
- Bốn patch áp sạch, không sửa tay.
- Step 1 (trước các bản sửa): `tsc --noEmit` thoát 0; 193 file / 1798 test. Step 2: lần đầu thoát 1 với thông báo bảo mật của Next.js 16.4.3 (không chạy `next upgrade`), lần hai thoát 0, 40/40 trang tĩnh.
- Bản sửa 1 (Patch 5, 6): đỏ `2 failed | 1797 passed (1799)`; xanh 193 file / 1799 test.
- Bản sửa 2 (Patch 7, 8): đỏ `2 failed | 1799 passed (1801)`; xanh 193 file / 1801 test.
- Sau hai bản sửa, chạy lại Step 1 và Step 2: `tsc --noEmit` thoát 0; **193 file / 1801 test**; build lần đầu thoát 1 (cùng thông báo), lần hai thoát 0, 40/40 trang tĩnh. Rồi chạy lại Step 4 (kết quả ghi ở đó).
- Step 5: sau khi xóa trang tạm, `tsc` đỏ ở `.next/dev/types/validator.ts` đúng như dự báo; xóa `.next/dev/types` và `.next/types` thì sạch.
- pgTAP: không chạy (plan không đụng DB).

- [ ] **Step 7: Đưa lên `main`**

**Không chạy (2026-11-27):** xem dòng đầu của phần Kết quả ở Step 6. Nhánh `feat/kim-bun-dot-om-m2c` dừng ở trạng thái đã commit, chưa gộp, chưa đẩy.

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m2c
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy, ở theme nào; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.

---

### Sửa lỗi lộ ra khi kiểm (2026-11-27, sau Step 4)

Hai lỗi, mỗi lỗi một commit: test đỏ trước, code sau. Spec không đổi (§6.5 không quy định chỗ đặt nhãn; chỗ đó là Diễn giải 3 của plan này, đã sửa ở trên). Không patch nào của M2d đến M2g sửa vào ba file này.

**Lỗi 1: nhãn của chấm mới nhất đè lên nhãn của chấm cao nhất.** Khi quanh chấm mới nhất không còn chỗ nào trống, mô hình đặt nhãn lên trên chấm, kể cả khi chỗ đó là nhãn của chấm cao nhất. Trên trục nhiều ngày các lần đo gần nhau chỉ cách vài pixel, nên dáng rất thường gặp cũng dính: tối qua 39,0, sáng nay 38,2 rồi 38,6 trên trục 7 ngày thì "39" và "38,6" đè lên nhau, không số nào đọc được. Mười ba khối của trang fixture không có dáng này. Sửa: không chỗ nào trống thì lấy chỗ che các chấm khác ít nhất (theo diện tích), và bỏ qua mọi chỗ chạm nhãn kia. Trên hoặc dưới luôn tránh được nhãn kia: nhãn đó nằm trên chấm cao nhất, còn chấm mới nhất không bao giờ cao hơn chấm đó. Kỳ vọng của một test cũ đổi theo: "36,9 rồi 36,5" sát mép phải nay đặt nhãn bên trái chấm (chỉ chạm phần hở quanh chấm trước) thay vì ở trên (che chấm trước).

Patch 5 (test; đỏ `2 failed | 1797 passed (1799)`):

```diff
diff --git a/lib/rules/feverChart.test.ts b/lib/rules/feverChart.test.ts
index 10b852a..c9db8d4 100644
--- a/lib/rules/feverChart.test.ts
+++ b/lib/rules/feverChart.test.ts
@@ -219,13 +219,58 @@ describe("feverChartModel", () => {
       null,
       { text: "38,3", anchor: "end", place: "side" },
     ]);
-    // Low on the scale as well: nothing fits, so it stays above.
+    // Low on the scale as well: no place is free. Above would sit on the
+    // earlier dot; beside on the left only touches the air round it.
     const low = feverChartModel(
       [temp("2026-11-24 22:00", 36.9), temp("2026-11-24 23:00", 36.5)],
       episode("2026-11-24 00:10"),
       vn("2026-11-24 23:50"),
     )!;
-    expect(low.points[1].label?.place).toBe("above");
+    expect(low.points[1].label).toEqual({
+      text: "36,5",
+      anchor: "end",
+      place: "side",
+    });
+  });
+
+  it("no place is free: the newest label never sits on the highest reading's label, and takes the place that covers least", () => {
+    // Seven days. 39,0 last night, 38,2 this morning, 38,6 two hours later:
+    // on a week's axis the three dots are a few pixels apart. Above the
+    // newest dot is the label "39"; under it is the dot of 38,2.
+    const chart = feverChartModel(
+      [
+        temp("2026-11-25 20:15", 39),
+        temp("2026-11-26 09:15", 38.2),
+        temp("2026-11-26 10:55", 38.6),
+      ],
+      episode("2026-11-20 08:00"),
+      vn("2026-11-26 11:30"),
+    )!;
+    expect(chart.days).toHaveLength(7);
+    expect(chart.points.map((point) => point.label)).toEqual([
+      { text: "39", anchor: "middle", place: "above" },
+      null,
+      { text: "38,6", anchor: "end", place: "side" },
+    ]);
+    // The fever at its peak on the morning of day six: 39,9 half an hour
+    // after 40. Above is the label "40"; the left side is all but free.
+    const peaking = feverChartModel(
+      [
+        temp("2026-11-26 00:40", 39.3),
+        temp("2026-11-26 07:50", 39.8),
+        temp("2026-11-26 08:50", 40),
+        temp("2026-11-26 09:25", 39.9),
+      ],
+      episode("2026-11-21 08:00"),
+      vn("2026-11-26 10:00"),
+    )!;
+    expect(peaking.days).toHaveLength(6);
+    expect(peaking.points.map((point) => point.label)).toEqual([
+      null,
+      null,
+      { text: "40", anchor: "middle", place: "above" },
+      { text: "39,9", anchor: "end", place: "side" },
+    ]);
   });
 
   it("the word Sốt takes the first of right, left, middle that no dot and no label reaches", () => {
```

Patch 6 (code; xanh 193 file / 1799 test):

```diff
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index 81f9c1b..066102d 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -394,8 +394,11 @@ const CHART_DAYS = 7;
 // The chart's geometry, in fractions of the plot (about 288 × 128 px at
 // 375 px wide), so the model can keep the texts apart.
 type Box = { x0: number; x1: number; y0: number; y1: number };
-const hit = (a: Box, b: Box) =>
-  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
+// How much of each other two boxes cover; 0 when they are apart.
+const covered = (a: Box, b: Box) =>
+  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) *
+  Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
+const hit = (a: Box, b: Box) => covered(a, b) > 0;
 // A dot, with a little air round it.
 const DOT_X = 0.025;
 const DOT_Y = 0.055;
@@ -532,23 +535,28 @@ export function feverChartModel(
   const peakPoint = points.find(
     (point) => point.at === peak?.at && !point.latest,
   );
+  let peakLabel: Box | null = null;
   if (peak && peakPoint && peak !== latest) {
     peakPoint.label = {
       text: formatCelsius(peak.celsius),
       anchor: anchorOf(peakPoint.x),
       place: "above",
     };
-    boxes.push(labelBox(peakPoint.x, peakPoint.y, peakPoint.label));
+    peakLabel = labelBox(peakPoint.x, peakPoint.y, peakPoint.label);
+    boxes.push(peakLabel);
   }
   // The newest label takes the first place that covers no other dot and not
   // the highest reading's label: above, beside on the right, under, beside on
   // the left. Nothing is ever drawn to the right of the newest dot, so that
   // side is free whenever it fits; near the right edge it does not fit, and
   // the left side is the last try (the line runs behind the label there, and
-  // the halo keeps it readable).
+  // the halo keeps it readable). Where no place is free (readings a few
+  // pixels apart, as on a week's axis), it takes the place that covers least
+  // of the other dots, and never one that reaches the other label: two
+  // numbers on each other cannot be read, a dot partly under a number can.
   const newest = points.at(-1);
   if (newest) {
-    const others = boxes.filter((_, index) => index !== points.length - 1);
+    const dots = boxes.slice(0, points.length - 1);
     const text = formatCelsius(newest.celsius);
     const options: FeverChartLabel[] = [
       { text, anchor: anchorOf(newest.x), place: "above" },
@@ -562,11 +570,20 @@ export function feverChartModel(
         ? [{ text, anchor: "end", place: "side" } as const]
         : []),
     ];
-    newest.label =
-      options.find((option) => {
-        const box = labelBox(newest.x, newest.y, option);
-        return !others.some((other) => hit(box, other));
-      }) ?? options[0];
+    const placed = options.map((option) => {
+      const box = labelBox(newest.x, newest.y, option);
+      return {
+        option,
+        onLabel: peakLabel !== null && hit(box, peakLabel),
+        onDots: dots.reduce((sum, dot) => sum + covered(box, dot), 0),
+      };
+    });
+    // Above or under always clears the other label: that label is above the
+    // highest dot, and the newest dot is never higher than it.
+    const clear = placed.filter((place) => !place.onLabel);
+    newest.label = (clear.length > 0 ? clear : placed).reduce((best, place) =>
+      place.onDots < best.onDots ? place : best,
+    ).option;
     boxes.push(labelBox(newest.x, newest.y, newest.label));
   }
   const feverWord =
```

Commit: `fix(illness): the newest label never sits on the other label`.

**Lỗi 2: hai bản ghi cùng một phút.** M2b đã tính tới hai lần đo cùng thời điểm (lần cao hơn xếp sau). `feverChartModel` lại tìm chấm cao nhất bằng mốc giờ, nên với 38,5 và 39,5 cùng phút rồi một lần đo sau đó, nhãn "39,5" bị gắn lên chấm 38,5. `FeverChart` dùng mốc giờ làm key cho chấm, nhãn và hình thoi, nên hai lần đo hay hai liều cùng phút bị trùng key (trình duyệt báo lỗi, và có thể vẽ thiếu hoặc lặp một phần tử khi cập nhật). Sửa: tìm chấm cao nhất theo vị trí trong mảng; key là vị trí.

Patch 7 (test; đỏ `2 failed | 1799 passed (1801)`):

```diff
diff --git a/components/illness/feverchart.test.tsx b/components/illness/feverchart.test.tsx
index e337d67..b65c394 100644
--- a/components/illness/feverchart.test.tsx
+++ b/components/illness/feverchart.test.tsx
@@ -92,6 +92,34 @@ describe("FeverChart", () => {
     expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
   });
 
+  it("draws two readings and two doses logged at the same minute, each once", () => {
+    const chart = feverChartModel(
+      [
+        temp("2026-11-25 20:00", 38.5),
+        temp("2026-11-25 20:00", 39.5),
+        temp("2026-11-25 22:00", 38.2),
+        dose("2026-11-25 20:10"),
+        dose("2026-11-25 20:10"),
+      ],
+      episode("2026-11-25 08:00"),
+      vn("2026-11-25 23:00"),
+    )!;
+    const twins = renderToStaticMarkup(<FeverChart chart={chart} />);
+    expect(twins.match(/<circle/g)).toHaveLength(3);
+    expect(twins.match(/data-dose/g)).toHaveLength(2);
+    expect(twins.match(/data-point-label/g)).toHaveLength(2);
+    // No two siblings share a key (the server renderer does not report it;
+    // the browser does, and may then drop or repeat one of them).
+    const children: unknown[] = FeverChart({ chart }).props.children;
+    for (const list of children) {
+      if (!Array.isArray(list)) continue;
+      const keys = list
+        .filter((child) => child !== null && typeof child === "object")
+        .map((child: { key: string | null }) => child.key);
+      expect(new Set(keys).size).toBe(keys.length);
+    }
+  });
+
   it("a single reading has a dot and no line", () => {
     const one = renderToStaticMarkup(
       <FeverChart
diff --git a/lib/rules/feverChart.test.ts b/lib/rules/feverChart.test.ts
index c9db8d4..9f74113 100644
--- a/lib/rules/feverChart.test.ts
+++ b/lib/rules/feverChart.test.ts
@@ -133,6 +133,27 @@ describe("feverChartModel", () => {
     ).toEqual([null, "39,2", "37,2"]);
   });
 
+  it("two readings at the same moment: the highest one's label sits on its own point", () => {
+    // Measured twice and logged with the same minute; a later reading is
+    // the newest. The label "39,5" belongs to the dot of 39,5.
+    const chart = feverChartModel(
+      [
+        temp("2026-11-24 20:00", 38.5),
+        temp("2026-11-24 20:00", 39.5),
+        temp("2026-11-24 22:00", 37),
+      ],
+      episode("2026-11-24 08:00"),
+      vn("2026-11-24 23:00"),
+    )!;
+    expect(
+      chart.points.map((point) => [point.celsius, point.label?.text ?? null]),
+    ).toEqual([
+      [38.5, null],
+      [39.5, "39,5"],
+      [37, "37"],
+    ]);
+  });
+
   it("only the newest point is marked latest", () => {
     const chart = feverChartModel(
       [temp("2026-11-24 09:00", 38.4), temp("2026-11-24 20:00", 39.2)],
```

Patch 8 (code; xanh 193 file / 1801 test):

```diff
diff --git a/components/illness/FeverChart.tsx b/components/illness/FeverChart.tsx
index f1c3b29..f85d00f 100644
--- a/components/illness/FeverChart.tsx
+++ b/components/illness/FeverChart.tsx
@@ -132,9 +132,10 @@ export function FeverChart({ chart }: { chart: FeverChartModel }) {
           strokeLinejoin="round"
         />
       )}
-      {chart.points.map((point) => (
+      {/* Keys are positions: two logs may carry the same minute. */}
+      {chart.points.map((point, index) => (
         <circle
-          key={point.at}
+          key={index}
           cx={round(px(point.x))}
           cy={round(py(point.y))}
           r={point.latest ? 6.5 : 4}
@@ -143,19 +144,19 @@ export function FeverChart({ chart }: { chart: FeverChartModel }) {
           strokeWidth={point.latest ? 2.5 : 0}
         />
       ))}
-      {chart.doses.map((dose) => (
+      {chart.doses.map((dose, index) => (
         <path
-          key={dose.at}
+          key={index}
           data-dose
           d={`M${round(px(dose.x))} ${DOSE_Y - 6}l6 6-6 6-6-6z`}
           fill="var(--color-cat-med)"
         />
       ))}
       {chart.points.map(
-        (point) =>
+        (point, index) =>
           point.label && (
             <text
-              key={point.at}
+              key={index}
               data-point-label
               x={
                 round(px(point.x)) +
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index 066102d..dba0b79 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -531,10 +531,9 @@ export function feverChartModel(
     x < LABEL_EDGE ? "start" : x > 1 - LABEL_EDGE ? "end" : "middle";
   const boxes: Box[] = points.map((point) => dotBox(point.x, point.y));
 
-  // The highest reading keeps its label above the dot.
-  const peakPoint = points.find(
-    (point) => point.at === peak?.at && !point.latest,
-  );
+  // The highest reading keeps its label above the dot. Its point is found by
+  // position, not by time: two readings may carry the same minute.
+  const peakPoint = peak ? points[drawn.indexOf(peak)] : undefined;
   let peakLabel: Box | null = null;
   if (peak && peakPoint && peak !== latest) {
     peakPoint.label = {
```

Commit: `fix(illness): two logs at the same minute on the fever chart`.

**Còn lại, không phải lỗi:** trong 600 đợt ngẫu nhiên còn 22 đợt nhãn che một phần một chấm trước, đều là cụm đo dày không còn chỗ nào trống (Diễn giải 3). Hai liều cùng phút vẽ hai hình thoi chồng khít lên nhau; `aria-label` vẫn đếm đủ.
