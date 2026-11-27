# Kim Bun — Đợt ốm M4b: bảng "Triệu chứng" và luật của kỳ "Đợt ốm" trong Báo cáo Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§9: bảng "Triệu chứng" của mọi kỳ; phần luật của kỳ "Đợt ốm"; phần "Báo cáo" của §10.1; phần M4 của §10.4)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Báo cáo cho bác sĩ có bảng "Triệu chứng" (Giờ, Triệu chứng, Ghi chú) khi kỳ có bản ghi triệu chứng, và có sẵn các luật mà M4c cần cho kỳ "Đợt ốm": kỳ nào, đợt nào, những ngày nào, đọc bản ghi từ đâu tới đâu, dòng nào dưới tên bé.

**Architecture:**

- **Luật thuần** trong `lib/rules/report.ts`, cùng file với các dòng nhiệt độ và thuốc của Báo cáo: `symptomRows` (bảng "Triệu chứng"), `reportSelection` (kỳ và đợt của trang), `episodeReport` (ngày, khoảng bản ghi và dòng của kỳ "Đợt ốm").
- **Bảng** "Triệu chứng" trong `ReportScreen`, sau mục "Thuốc đã dùng", cùng kiểu ô với bảng "Theo ngày".
- `reportSelection` và `episodeReport` chưa được trang nào dùng ở plan này; M4c dùng chúng. Kỳ 7 và 14 ngày không đổi gì ngoài bảng mới.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m4b`, cắt từ `main` sau khi M4a đã lên. Baseline: 1953 test (206 file) vitest xanh, typecheck sạch.

**Các mốc của spec này:**

| Mốc      | Nội dung                                                                                         | Plan                                                                              |
| -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| M1a, M1b | §3: bản ghi Triệu chứng                                                                          | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md`, `…-m1b.md` (đã ở `main`) |
| M2a–M2g  | §4, §5.1–5.3, §5.7, §6: đợt ốm, hai trang, lối vào ở Sức khỏe                                    | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md` … `…-m2g.md`              |
| M3a, M3b | §5.5, §5.6, §7: thẻ đợt ốm, lời mời, nhắc đóng trên tab Hôm nay                                  | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3a.md`, `…-m3b.md`               |
| M4a      | §5.4: thẻ "So với thường ngày" trên trang chi tiết; Bước 38 mục 22–23                            | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4a.md`                           |
| M4b      | §9: bảng "Triệu chứng" của Báo cáo (mọi kỳ), luật của kỳ "Đợt ốm"; Bước 38 mục 24                | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4b.md`                           |
| M4c      | §9, §6.3 mục 7: kỳ "Đợt ốm" của Báo cáo, `/bao-cao?dot={id}`, nút báo cáo; Bước 38 mục 25–28     | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4c.md`                           |
| M5       | §8: lần khám                                                                                     | chưa viết                                                                         |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Mốc M4 được cắt làm ba plan** (xem plan M4a, Diễn giải spec mục 1). Plan này có bảng "Triệu chứng" (spec §9 ghi nó cho mọi kỳ, nên nó đứng riêng được) và hai luật thuần của kỳ "Đợt ốm". Hai luật đó lên `main` trước khi có chỗ dùng, như M3a đã làm với các luật của tab Hôm nay: chúng có test, và M4c giữ được dưới 1.500 dòng.
2. **Bảng "Triệu chứng"** chỉ có khi kỳ có ít nhất một bản ghi `symptom` hợp lệ theo schema. Mỗi bản ghi một hàng, cũ trước. Kỳ tính từ 00:00 của ngày đầu tiên như các dòng nhiệt độ và thuốc (`fromMs`).
3. **Ô "Giờ"** viết "{dd/mm} {HH:mm}" giống các dòng nhiệt độ và thuốc của Báo cáo, một dòng (`whitespace-nowrap`), để "26/11" không tách khỏi "08:00".
4. **Ô "Triệu chứng"** là các `short` theo thứ tự của nội dung, nối bằng ", " (như Nhật ký). Mã không còn trong nội dung thì bỏ (spec §3.1); bản ghi chỉ còn mã lạ thì ô để trống (spec §3.1 cho Nhật ký chữ "Triệu chứng" không kèm tên; trong một cột tên là "Triệu chứng" thì ô trống là cùng ý). Không có ghi chú thì ô "Ghi chú" để trống. Ghi vào spec §9 (Patch 6).
5. **Kiểu bảng:** cùng ô kẻ với bảng "Theo ngày" (`border-line`, khi in `border-ink`), mỗi hàng `break-inside-avoid` để không bị cắt giữa hai trang giấy. Ở 375 px hai cột sau xuống dòng; không chữ nào bị cắt.
6. **`reportSelection`** (dùng ở M4c): không có địa chỉ và chưa chọn gì thì 7 ngày. `?dot={id}` có trong danh sách đợt ốm thì kỳ "Đợt ốm" với đợt đó; mã không có thì như không có tham số (§9). Chọn "Đợt ốm" bằng tay: đợt đang mở, không có thì đợt có `started_at` muộn nhất, kể cả khi địa chỉ đã chọn một đợt khác (đúng chữ §9). Chọn 7 hay 14 ngày bằng tay thì thắng địa chỉ. Địa chỉ có mã mà danh sách chưa tải xong: chưa biết (`null`), để M4c chờ thay vì hiện tạm 7 ngày. Đợt bị xóa mất trong lúc xem: về 7 ngày.
7. **`episodeReport`** (dùng ở M4c): các ngày từ ngày bắt đầu tới ngày của `ended_at` (đợt đang mở: hôm nay), tối đa 14 ngày cuối (`truncated`). Bản ghi đọc từ 00:00 của ngày **trước** ngày đầu tiên được in (như `statsFetchSince`, để giấc ngủ từ tối hôm trước vẫn được tính) tới 00:00 của ngày sau ngày cuối (đợt đang mở: không chặn). Dòng: "Đợt ốm {dd/mm} – {dd/mm} · {n} ngày" và "Đợt ốm từ {dd/mm} · ngày thứ {n}", với ngày đầu và số ngày của **cả đợt**, kể cả khi chỉ in 14 ngày cuối. Giờ bắt đầu được đi trước lúc này tới 1 phút (§5.7), nên ngay trước nửa đêm một đợt đang mở có thể bắt đầu vào ngày mai và `episodeDayCount` là 0: `episodeReport` khi đó vẫn lấy một ngày (ngày bắt đầu) thay vì một danh sách rỗng làm hỏng trang.
8. **Trên trang thật không thêm bản ghi.** Bảng chỉ thấy trên trang thật khi gia đình đã tự ghi triệu chứng trong kỳ; trang fixture có đủ các trường hợp. Bước 38 mục 24 để người dùng làm trên iPhone thật.

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
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `864a3ea` (M3b đã lên; `Test Files  204 passed (204)`, `Tests  1931 passed (1931)`). Lần chạy thử đầu là trên `8f6714e` cộng 16 patch của M3a và M3b trích từ hai file plan đó, trước khi M3b lên `main`; code của `864a3ea` trùng khít nền đó, và mọi số đo đã được đo lại trên `864a3ea`, sau 6 patch của M4a. Trong bản chạy thử mỗi task code là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Patch 5 (checklist) được sinh trên checklist đã có mục 22–23 của M4a; Patch 6 (spec) trên spec đã có đoạn §5.4 của M4a. `bun run build` đã chạy xanh trên bản sao ở trạng thái cuối của cả ba plan M4 (42 trang).
- **Đã nhìn thử khi viết plan.** Trang fixture của Task 3 đã được mở ở 375 px theme `rose` trên bản sao ở đúng trạng thái cuối của plan này: số đo ở mục 2 và 3 của bước trình duyệt là của lần đó. Chưa xem: bề ngang 390 và 440, các theme khác, bản xem trước khi in, mọi trang thật.
- **Trang fixture của plan này không đọc dữ liệu của gia đình:** mọi truy vấn của `ReportScreen` đã có dữ liệu giả trong một `QueryClient` riêng của trang. Ba bảng WHO (`useWhoTable`) được nạp từ chính mã của app (`loadWhoTable` dùng `import()`). `useGrowth` và `useVaccineDoses` tự đặt `staleTime` 60 giây, nên sau một phút, khi khung trình duyệt được bấm vào lại, chúng có thể tải lại với mã bé giả `fixture-baby` (không phải uuid): console có thể có lỗi 400 của `growth` hay `vaccine_doses`; trang giữ dữ liệu giả, bỏ qua các lỗi đó. Không có lệnh ghi nào.
- **Trình duyệt.** Dùng khung Browser trong app, cỡ 375×812 (`resize_window` preset `mobile`); người dùng đã chọn sẵn ngày 2026-11-26, không hỏi lại. Gọi `navigate` trước. Chỉ khi bộ kiểm quyền của app từ chối khung Browser thì hỏi người dùng đúng một câu rồi làm tiếp. Trang tạm vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập trong khung đó. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại `resize_window` và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt lại theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt nó khi xong. Bấm theo `ref` của `find`, không bấm theo tọa độ trên trang thật. Không đọc cả console (một lỗi in ra hàng trăm dòng): lọc bằng `onlyErrors` và `limit` nhỏ.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP, và không có migration.
- **Người dùng muốn màn hình gọn, ít số.** Không thêm chữ nào ngoài plan. Không thêm câu thống kê nào về bé.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm token màu hay icon. `lib/themeGuard.test.ts` và `lib/ui/tokens.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bấm "Bắt đầu đợt ốm", "Bé đã khỏi", "Mở lại đợt ốm", "Xóa đợt ốm", không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc. Bấm "In / Lưu PDF" thì chỉ xem bản xem trước rồi hủy.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `content/triage.vi.json` và `docs/device-checklist.md`.** Hai file đó từ trước đã không theo prettier.
- **Các file plan chưa chạy chưa được commit.** `git status` có thể thấy các file plan khác là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng sau M4a và trước M4c. M4c dùng hai luật của Task 1 và sửa tiếp `ReportScreen` cùng file test của Task 2.

**Consumes (M4a):** Bước 38 mục 22–23 của `docs/device-checklist.md`; đoạn §5.4 của spec.

**Consumes (M2, M1):** `type EpisodeLike`, `episodeDayCount` (`lib/rules/illness.ts`); `symptomShorts` (`lib/rules/symptomForm.ts`); `TRIAGE` (`lib/content/triage.ts`); schema `detailsSchemas.symptom` (`lib/rules/logDetails.ts`).

**Consumes (đã ở `main` từ trước):** `ReportScreen` (`components/report/ReportScreen.tsx`), `temperatureRows`, `medicineRows`, `REPORT_DAYS` (`lib/rules/report.ts`), `addDays`, `formatDayShort`, `vnDayStartMs` (`lib/rules/days.ts`), `useStatsLogs` (`lib/data/logs.ts`).

**Produces:**

- `lib/rules/report.ts`:
  - `symptomRows(logs: LogLike[], fromMs: number): { at: string; text: string; note: string }[]`
  - `type ReportPeriod = "7" | "14" | "dot"`
  - `reportSelection<T extends EpisodeLike>(input: { picked: ReportPeriod | null; address: string | null; episodes: T[] | undefined }): { period: ReportPeriod; episode: T | null } | null`
  - `episodeReport(episode: EpisodeLike, now: Date): { days: string[]; truncated: boolean; from: string; to: string | null; line: string }`
- `components/report/ReportScreen.tsx`: bảng "Triệu chứng" sau "Thuốc đã dùng". Chữ ký không đổi (`{ baby }`).
- `components/report/reportscreen.test.tsx` (mới): các mock của `ReportScreen` (`@/lib/data/logs` có cả `useStatsLogs` và `useRangeLogs`, `@/lib/data/illness`, `@/lib/data/growth`, `@/lib/data/vaccines`, `useNow`) mà M4c dùng tiếp.
- `docs/device-checklist.md`: Bước 38 có mục 24.
- **Vitest sau M4b:** 1969 test, 208 file.

---

### Task 1: Luật của bảng "Triệu chứng" và của kỳ "Đợt ốm" (§9)

**Files:**

- Modify: `lib/rules/report.ts` (thêm `symptomRows`, `type ReportPeriod`, `reportSelection`, `episodeReport`, trước `growthSummary`)
- Test: `lib/rules/reportIllness.test.ts` (mới)

**Interfaces:**

- Consumes: `type EpisodeLike`, `episodeDayCount(episode, now): number` (`lib/rules/illness.ts`); `symptomShorts(codes, symptoms): string[]`; `TRIAGE.symptoms`; `addDays`, `formatDayShort`, `vnDayStartMs`, `vnDateString`; hàm `when` sẵn có trong `report.ts` ("{dd/mm} {HH:mm}").
- Produces: `symptomRows`, `type ReportPeriod`, `reportSelection`, `episodeReport` (chữ ký ở Contracts). Chữ đúng của spec §9: "Đợt ốm {dd/mm} – {dd/mm} · {n} ngày", "Đợt ốm từ {dd/mm} · ngày thứ {n}".

- [x] **Step 0: Kiểm M4a đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f components/illness/EpisodeUsual.tsx && grep -q "export function usualComparison" lib/rules/illness.ts && echo "M4a có trên main"
git checkout -b feat/kim-bun-dot-om-m4b
bunx vitest run
```

Expected: dòng `M4a có trên main`; `Test Files  206 passed (206)`, `Tests  1953 passed (1953)`. Không thấy dòng đó thì dừng: M4a chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/lib/rules/reportIllness.test.ts b/lib/rules/reportIllness.test.ts
new file mode 100644
index 0000000..5442c58
--- /dev/null
+++ b/lib/rules/reportIllness.test.ts
@@ -0,0 +1,173 @@
+import { describe, expect, it } from "vitest";
+import type { EpisodeLike } from "./illness";
+import { episodeReport, reportSelection, symptomRows } from "./report";
+
+const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
+const iso = (text: string) => vn(text).toISOString();
+const NOW = vn("2026-11-26 10:00");
+const episode = (
+  id: string,
+  start: string,
+  end: string | null = null,
+): EpisodeLike => ({
+  id,
+  started_at: iso(start),
+  ended_at: end === null ? null : iso(end),
+});
+const OPEN = episode("open", "2026-11-24 23:30");
+const PAST = episode("past", "2026-10-10 08:00", "2026-10-12 09:00");
+const OLDER = episode("older", "2026-09-01 08:00", "2026-09-03 09:00");
+
+// Spec 2026-11-26 §9: which period and which episode the report shows.
+describe("reportSelection", () => {
+  const episodes = [OPEN, PAST, OLDER];
+
+  it("without an address or a choice: 7 days", () => {
+    expect(reportSelection({ picked: null, address: null, episodes })).toEqual({
+      period: "7",
+      episode: null,
+    });
+  });
+
+  it("/bao-cao?dot={id} opens that episode", () => {
+    expect(
+      reportSelection({ picked: null, address: "past", episodes }),
+    ).toEqual({ period: "dot", episode: PAST });
+  });
+
+  it("an id the baby's episodes do not hold is as if there were none", () => {
+    expect(
+      reportSelection({ picked: null, address: "gone", episodes }),
+    ).toEqual({ period: "7", episode: null });
+  });
+
+  it("picked by hand: the open episode, else the one that started last", () => {
+    expect(
+      reportSelection({ picked: "dot", address: "past", episodes }),
+    ).toEqual({ period: "dot", episode: OPEN });
+    expect(
+      reportSelection({
+        picked: "dot",
+        address: null,
+        episodes: [OLDER, PAST],
+      }),
+    ).toEqual({ period: "dot", episode: PAST });
+  });
+
+  it("7 or 14 days picked by hand win over the address", () => {
+    expect(
+      reportSelection({ picked: "14", address: "past", episodes }),
+    ).toEqual({ period: "14", episode: null });
+  });
+
+  it("not known while the episodes are loading and the address names one", () => {
+    expect(
+      reportSelection({ picked: null, address: "past", episodes: undefined }),
+    ).toBeNull();
+    expect(
+      reportSelection({ picked: null, address: null, episodes: undefined }),
+    ).toEqual({ period: "7", episode: null });
+  });
+
+  it("no episode left (deleted meanwhile): back to 7 days", () => {
+    expect(
+      reportSelection({ picked: "dot", address: null, episodes: [] }),
+    ).toEqual({ period: "7", episode: null });
+  });
+});
+
+// Spec §9: the days, the logs and the line of the "Đợt ốm" period.
+describe("episodeReport", () => {
+  it("a closed episode: its first to its last day", () => {
+    expect(episodeReport(PAST, NOW)).toEqual({
+      days: ["2026-10-10", "2026-10-11", "2026-10-12"],
+      truncated: false,
+      from: iso("2026-10-09 00:00"),
+      to: iso("2026-10-13 00:00"),
+      line: "Đợt ốm 10/10 – 12/10 · 3 ngày",
+    });
+  });
+
+  it("an open episode: up to today, with no upper bound on the logs", () => {
+    expect(episodeReport(OPEN, NOW)).toEqual({
+      days: ["2026-11-24", "2026-11-25", "2026-11-26"],
+      truncated: false,
+      from: iso("2026-11-23 00:00"),
+      to: null,
+      line: "Đợt ốm từ 24/11 · ngày thứ 3",
+    });
+    // A start up to a minute ahead (§5.7) may fall on tomorrow's date just
+    // before midnight: the report still has that one day, and does not throw.
+    const ahead = episode("ahead", "2026-11-27 00:00");
+    expect(episodeReport(ahead, vn("2026-11-26 23:59"))).toEqual({
+      days: ["2026-11-27"],
+      truncated: false,
+      from: iso("2026-11-26 00:00"),
+      to: null,
+      line: "Đợt ốm từ 27/11 · ngày thứ 1",
+    });
+  });
+
+  it("longer than 14 days: only the last 14", () => {
+    const long = episode("long", "2026-10-01 08:00", "2026-10-20 09:00");
+    const report = episodeReport(long, NOW);
+    expect(report.days).toHaveLength(14);
+    expect(report.days[0]).toBe("2026-10-07");
+    expect(report.days[13]).toBe("2026-10-20");
+    expect(report.truncated).toBe(true);
+    expect(report.from).toBe(iso("2026-10-06 00:00"));
+    expect(report.line).toBe("Đợt ốm 01/10 – 20/10 · 20 ngày");
+  });
+
+  it("exactly 14 days is not cut", () => {
+    const fortnight = episode("f", "2026-10-01 08:00", "2026-10-14 09:00");
+    expect(episodeReport(fortnight, NOW).truncated).toBe(false);
+  });
+});
+
+// Spec §9: the table "Triệu chứng", for every period.
+describe("symptomRows", () => {
+  const from = Date.parse(iso("2026-11-20 00:00"));
+  const log = (time: string, details: unknown) => ({
+    type: "symptom",
+    started_at: iso(time),
+    details,
+  });
+
+  it("oldest first: the time, the short names in the content's order, the note", () => {
+    expect(
+      symptomRows(
+        [
+          log("2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
+          log("2026-11-21 21:15", { codes: ["fever"], note: "quấy cả tối" }),
+          log("2026-11-19 09:00", { codes: ["vomit"] }),
+          {
+            type: "temperature",
+            started_at: iso("2026-11-22 08:00"),
+            details: { celsius: 38, method: "nach" },
+          },
+        ],
+        from,
+      ),
+    ).toEqual([
+      { at: "21/11 21:15", text: "Sốt", note: "quấy cả tối" },
+      { at: "25/11 08:00", text: "Sổ mũi, Ho", note: "" },
+    ]);
+  });
+
+  it("codes the content no longer has are left out; a broken log is skipped", () => {
+    expect(
+      symptomRows(
+        [
+          log("2026-11-21 08:00", { codes: ["gone_code", "cough"] }),
+          log("2026-11-22 08:00", { codes: ["gone_code"] }),
+          log("2026-11-23 08:00", { codes: [] }),
+        ],
+        from,
+      ),
+    ).toEqual([
+      { at: "21/11 08:00", text: "Ho", note: "" },
+      { at: "22/11 08:00", text: "", note: "" },
+    ]);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 206 passed (207)`, `Tests  13 failed | 1953 passed (1966)`. Cả 13 test mới đỏ vì ba hàm chưa có (`is not a function`).

- [x] **Step 3: Viết ba luật (Patch 2)**

```diff
diff --git a/lib/rules/report.ts b/lib/rules/report.ts
index b751b9d..f93965c 100644
--- a/lib/rules/report.ts
+++ b/lib/rules/report.ts
@@ -1,5 +1,6 @@
+import { TRIAGE } from "@/lib/content/triage";
 import type { LmsRow, WhoIndicator } from "@/lib/content/who";
-import { formatDayShort } from "./days";
+import { addDays, formatDayShort, vnDayStartMs } from "./days";
 import { assess } from "./growth";
 import {
   formatGrowthValue,
@@ -8,7 +9,9 @@ import {
   INDICATORS,
   type GrowthInput,
 } from "./growthForm";
+import { type EpisodeLike, episodeDayCount } from "./illness";
 import { detailsSchemas } from "./logDetails";
+import { symptomShorts } from "./symptomForm";
 import { formatVnTime, vnDateString } from "./time";
 import type { ScheduleItem } from "./vaccines";
 
@@ -76,6 +79,99 @@ export function medicineRows(
     });
 }
 
+// Spec 2026-11-26 §9: the symptom logs of the period, oldest first: the
+// time, the short names in the content's order, the note. Codes the content
+// no longer has are left out (spec §3.1).
+export function symptomRows(
+  logs: LogLike[],
+  fromMs: number,
+): { at: string; text: string; note: string }[] {
+  return logs
+    .filter((log) => log.type === "symptom")
+    .filter((log) => Date.parse(log.started_at) >= fromMs)
+    .sort((a, b) => a.started_at.localeCompare(b.started_at))
+    .flatMap((log) => {
+      const parsed = detailsSchemas.symptom.safeParse(log.details);
+      if (!parsed.success) return [];
+      return [
+        {
+          at: when(log.started_at),
+          text: symptomShorts(parsed.data.codes, TRIAGE.symptoms).join(", "),
+          note: parsed.data.note ?? "",
+        },
+      ];
+    });
+}
+
+export type ReportPeriod = "7" | "14" | "dot";
+
+// Spec 2026-11-26 §9: the period the report shows. `picked` is the choice
+// made on the page (null until one is made), `address` the `dot` of
+// /bao-cao?dot={id}, `episodes` every episode of the baby (undefined while
+// they load). An address that names no episode counts as none; picking
+// "Đợt ốm" by hand takes the open episode, else the one that started last.
+// null: not known yet (the address names an episode and the list is loading).
+export function reportSelection<T extends EpisodeLike>(input: {
+  picked: ReportPeriod | null;
+  address: string | null;
+  episodes: T[] | undefined;
+}): { period: ReportPeriod; episode: T | null } | null {
+  const { picked, address, episodes } = input;
+  if (picked === "7" || picked === "14")
+    return { period: picked, episode: null };
+  if (!episodes)
+    return picked === null && address === null
+      ? { period: "7", episode: null }
+      : null;
+  const episode =
+    picked === null
+      ? (episodes.find((item) => item.id === address) ?? null)
+      : (episodes.find((item) => item.ended_at === null) ??
+        [...episodes].sort((a, b) =>
+          b.started_at.localeCompare(a.started_at),
+        )[0] ??
+        null);
+  return episode ? { period: "dot", episode } : { period: "7", episode: null };
+}
+
+const REPORT_EPISODE_DAYS = 14;
+const startIso = (day: string) => new Date(vnDayStartMs(day)).toISOString();
+
+// Spec 2026-11-26 §9: the days of the "Đợt ốm" period, from the first day to
+// the last (an open episode: today), the last 14 at most; the logs to read,
+// from the start of the day before the first day shown (a sleep from the
+// evening before still counts) to the start of the day after the last (an
+// open episode: no upper bound); and the line under the baby's name.
+export function episodeReport(
+  episode: EpisodeLike,
+  now: Date,
+): {
+  days: string[];
+  truncated: boolean;
+  from: string;
+  to: string | null;
+  line: string;
+} {
+  const firstDay = vnDateString(new Date(episode.started_at));
+  // A start may be up to a minute ahead (spec §5.7), so just before midnight
+  // an open episode can begin on tomorrow's date: it still has its first day.
+  const count = Math.max(1, episodeDayCount(episode, now));
+  const shown = Math.min(count, REPORT_EPISODE_DAYS);
+  const days = Array.from({ length: shown }, (_, i) =>
+    addDays(firstDay, count - shown + i),
+  );
+  const lastDay = days[days.length - 1];
+  return {
+    days,
+    truncated: count > REPORT_EPISODE_DAYS,
+    from: startIso(addDays(days[0], -1)),
+    to: episode.ended_at ? startIso(addDays(lastDay, 1)) : null,
+    line: episode.ended_at
+      ? `Đợt ốm ${formatDayShort(firstDay)} – ${formatDayShort(lastDay)} · ${count} ngày`
+      : `Đợt ốm từ ${formatDayShort(firstDay)} · ngày thứ ${count}`,
+  };
+}
+
 // Spec §6.15: the latest measurement of each indicator, with its WHO percentile.
 export function growthSummary(
   rows: (GrowthInput & { created_at?: string })[],
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  207 passed (207)`, `Tests  1966 passed (1966)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/report.ts lib/rules/reportIllness.test.ts
git commit -m "feat(report): the symptom rows, and the rules of the episode period" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Bảng "Triệu chứng" trong Báo cáo (§9)

**Files:**

- Modify: `components/report/ReportScreen.tsx` (một mục mới sau "Thuốc đã dùng")
- Test: `components/report/reportscreen.test.tsx` (mới)

**Interfaces:**

- Consumes: `symptomRows` (Task 1); `useStatsLogs`, `useGrowth`, `useWhoTable`, `useVaccineDoses`, `useNow` (đều bị mock trong test).
- Produces: bảng "Triệu chứng" của `ReportScreen`; file test `reportscreen.test.tsx` với các mock, hàm `loaded`, `log`, `render` mà M4c sửa tiếp.

- [x] **Step 1: Viết test đỏ (Patch 3)**

`report.test.tsx` sẵn có vẽ trang với một `QueryClient` thật (chỉ thấy khung chờ). File mới mock các hook dữ liệu để vẽ được báo cáo có số. Nó mock luôn `useRangeLogs` và `@/lib/data/illness` dù trang chưa dùng: M4c cần chúng, và mock một module chưa được nạp thì không sao.

```diff
diff --git a/components/report/reportscreen.test.tsx b/components/report/reportscreen.test.tsx
new file mode 100644
index 0000000..7663f96
--- /dev/null
+++ b/components/report/reportscreen.test.tsx
@@ -0,0 +1,116 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { Baby, LogRow } from "@/lib/supabase/rows";
+import { ReportScreen } from "./ReportScreen";
+
+const NOW = new Date("2026-11-26T10:00:00+07:00");
+const useStatsLogs = vi.hoisted(() => vi.fn());
+const useRangeLogs = vi.hoisted(() => vi.fn());
+const state = vi.hoisted(() => ({
+  stats: {} as Record<string, unknown>,
+  range: {} as Record<string, unknown>,
+  episodes: {} as Record<string, unknown>,
+}));
+
+vi.mock("@/lib/data/logs", () => ({ useStatsLogs, useRangeLogs }));
+vi.mock("@/lib/data/illness", () => ({ useEpisodes: () => state.episodes }));
+vi.mock("@/lib/data/growth", () => ({
+  useGrowth: () => loaded([]),
+  useWhoTable: () => loaded(undefined),
+}));
+vi.mock("@/lib/data/vaccines", () => ({ useVaccineDoses: () => loaded([]) }));
+vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
+
+const LOADING = {
+  data: undefined,
+  isPending: true,
+  isError: false,
+  error: null,
+  fetchStatus: "fetching",
+  refetch: () => {},
+};
+function loaded(data: unknown) {
+  return { ...LOADING, data, isPending: false, fetchStatus: "idle" };
+}
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const baby = {
+  id: "b1",
+  family_id: "f1",
+  name: "Bun",
+  dob: "2026-09-10",
+  sex: "male",
+  vaccine_choices: {},
+} as unknown as Baby;
+const log = (type: string, time: string, details: unknown) =>
+  ({
+    id: `${type}-${time}`,
+    baby_id: "b1",
+    type,
+    started_at: iso(time),
+    ended_at: iso(time),
+    details,
+    note: null,
+  }) as LogRow;
+const SYMPTOMS = [
+  log("symptom", "2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
+  log("symptom", "2026-11-21 21:15", { codes: ["fever"], note: "quấy cả tối" }),
+];
+
+function render(input: { stats?: unknown[] } = {}) {
+  state.stats = loaded(input.stats ?? []);
+  return renderToStaticMarkup(<ReportScreen baby={baby} />);
+}
+
+beforeEach(() => {
+  useStatsLogs.mockReset();
+  useStatsLogs.mockImplementation(() => state.stats);
+  useRangeLogs.mockReset();
+  useRangeLogs.mockImplementation(() => state.range);
+  state.range = LOADING;
+  state.episodes = loaded([]);
+});
+
+// Spec 2026-11-26 §9: "Triệu chứng", for every period.
+describe("ReportScreen: symptoms", () => {
+  it("a table after the medicines: time, short names, note", () => {
+    const html = render({ stats: SYMPTOMS });
+    expect(html).toMatch(
+      /<h3[^>]*>Triệu chứng<\/h3><table[^>]*><thead><tr><th[^>]*>Giờ<\/th><th[^>]*>Triệu chứng<\/th><th[^>]*>Ghi chú<\/th><\/tr><\/thead>/,
+    );
+    expect(html).toMatch(
+      /<td[^>]*>21\/11 21:15<\/td><td[^>]*>Sốt<\/td><td[^>]*>quấy cả tối<\/td>/,
+    );
+    expect(html).toMatch(
+      /<td[^>]*>25\/11 08:00<\/td><td[^>]*>Sổ mũi, Ho<\/td><td[^>]*><\/td>/,
+    );
+    const order = [
+      ">Thuốc đã dùng</h3>",
+      ">Triệu chứng</h3>",
+      ">Tăng trưởng (lần đo gần nhất)</h3>",
+    ].map((mark) => html.indexOf(mark));
+    expect(order).toEqual([...order].sort((a, b) => a - b));
+    expect(order[0]).toBeGreaterThan(-1);
+  });
+
+  it("a period without a symptom log has no such table", () => {
+    const html = render({
+      stats: [
+        log("temperature", "2026-11-25 08:00", {
+          celsius: 38.2,
+          method: "nach",
+        }),
+      ],
+    });
+    expect(html).toContain(">Nhiệt độ</h3>");
+    expect(html).not.toContain(">Triệu chứng</h3>");
+  });
+
+  it("a symptom log before the 7 days is not in the table", () => {
+    const html = render({
+      stats: [log("symptom", "2026-11-19 08:00", { codes: ["cough"] })],
+    });
+    expect(html).not.toContain(">Triệu chứng</h3>");
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 207 passed (208)`, `Tests  1 failed | 1968 passed (1969)`. Chỉ test đầu đỏ (chưa có bảng); hai test kia (không có bảng khi không có bản ghi triệu chứng trong kỳ) đã xanh từ trước và phải giữ xanh.

- [x] **Step 3: Thêm bảng (Patch 4)**

```diff
diff --git a/components/report/ReportScreen.tsx b/components/report/ReportScreen.tsx
index 76256e7..2786abb 100644
--- a/components/report/ReportScreen.tsx
+++ b/components/report/ReportScreen.tsx
@@ -25,6 +25,7 @@ import {
   growthSummary,
   medicineRows,
   REPORT_DAYS,
+  symptomRows,
   temperatureRows,
   vaccineSummary,
 } from "@/lib/rules/report";
@@ -57,6 +58,7 @@ export function ReportScreen({ baby }: { baby: Baby }) {
   const stats = dailyStats(rows, days, now);
   const temperatures = temperatureRows(rows, fromMs);
   const medicines = medicineRows(rows, fromMs);
+  const symptoms = symptomRows(rows, fromMs);
   const measures = growthSummary(
     growth.data ?? [],
     {
@@ -206,6 +208,33 @@ export function ReportScreen({ baby }: { baby: Baby }) {
             )}
           </section>
 
+          {/* Spec 2026-11-26 §9: only when the period has a symptom log. */}
+          {symptoms.length > 0 && (
+            <section>
+              <h3 className="font-semibold">Triệu chứng</h3>
+              <table className="w-full border-collapse text-left">
+                <thead>
+                  <tr>
+                    <th className={cell}>Giờ</th>
+                    <th className={cell}>Triệu chứng</th>
+                    <th className={cell}>Ghi chú</th>
+                  </tr>
+                </thead>
+                <tbody>
+                  {symptoms.map((row, i) => (
+                    <tr key={i} className="break-inside-avoid">
+                      <td className={`${cell} whitespace-nowrap tabular-nums`}>
+                        {row.at}
+                      </td>
+                      <td className={cell}>{row.text}</td>
+                      <td className={cell}>{row.note}</td>
+                    </tr>
+                  ))}
+                </tbody>
+              </table>
+            </section>
+          )}
+
           <section>
             <h3 className="font-semibold">Tăng trưởng (lần đo gần nhất)</h3>
             {measures.length === 0 ? (
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  208 passed (208)`, `Tests  1969 passed (1969)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/report/ReportScreen.tsx components/report/reportscreen.test.tsx
git commit -m "feat(report): the table Triệu chứng" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M4b, checklist, spec, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-report/page.tsx` (trang tạm, không commit)
- Modify: `docs/device-checklist.md`, `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md`, file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; Bước 38 mục 24; một đoạn đọc spec ở §9; `main` có M4b.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  208 passed (208)`, `Tests  1969 passed (1969)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages using 9 workers (42/42)` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm**

Trang vẽ `ReportScreen` thật trong một `QueryClient` riêng đã có sẵn dữ liệu giả (xem Ghi chú khi thực thi về các lần tải lại sau một phút), nên không đọc hay ghi dữ liệu của gia đình và vẽ được khi chưa đăng nhập. Giờ của bản ghi tính từ hôm nay. Có một ghi chú dài, một bản ghi chỉ có mã lạ, và một bản ghi 9 ngày trước (chỉ có ở kỳ 14 ngày). Tạo `app/fixture-report/page.tsx` (không commit):

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReportScreen } from "@/components/report/ReportScreen";
import { logsKey } from "@/lib/data/logs";
import { growthKey, vaccineDosesKey } from "@/lib/data/outbox";
import { statsFetchSince } from "@/lib/rules/dailyStats";
import { addDays, vnDayRange } from "@/lib/rules/days";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, LogRow } from "@/lib/supabase/rows";

// Dữ liệu giả, không đọc hay ghi gì của gia đình. Giờ tính từ hôm nay. Mọi
// truy vấn đã có dữ liệu và không bao giờ cũ, nên trang không gọi mạng.
const BABY = {
  id: "fixture-baby",
  family_id: "fixture",
  name: "Bun",
  dob: "2026-09-10",
  sex: "male",
  vaccine_choices: {},
  blood_type: null,
  allergies: null,
} as unknown as Baby;
const today = vnDateString(new Date());
const at = (day: number, time: string) =>
  new Date(`${addDays(today, day)}T${time}:00+07:00`).toISOString();
let n = 0;
const log = (type: string, start: string, details: unknown, end = start) =>
  ({
    id: `fixture-${(n += 1)}`,
    baby_id: BABY.id,
    type,
    started_at: start,
    ended_at: end,
    details,
    note: null,
  }) as LogRow;
const LOGS: LogRow[] = [
  log("breast", at(-1, "02:00"), { side: "left" }, at(-1, "02:20")),
  log("temperature", at(-1, "03:15"), { celsius: 39.2, method: "tai" }),
  log("medicine", at(-1, "03:30"), {
    name: "Hapacol 150",
    amount: 2.5,
    unit: "ml",
    antipyretic: true,
  }),
  // Ghi chú dài nhất có thể gặp hay gõ, và mã không còn trong nội dung.
  log("symptom", at(-1, "08:00"), {
    codes: ["runny_nose", "cough", "fussy", "gone_code"],
    note: "Ho nhiều về đêm, bú ít hơn mọi ngày, quấy khi đặt xuống",
  }),
  log("symptom", at(0, "06:30"), { codes: ["cough"] }),
  log("symptom", at(0, "07:00"), { codes: ["gone_code"] }),
  // Trước 7 ngày: không có trong bảng của kỳ 7 ngày, có trong kỳ 14 ngày.
  log("symptom", at(-9, "09:00"), {
    codes: ["barking_cough", "hand_foot_spots", "mouth_sores"],
  }),
];

export default function Page() {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    const now = new Date();
    queryClient.setQueryData(growthKey(BABY.id), []);
    queryClient.setQueryData(vaccineDosesKey(BABY.id), []);
    for (const count of [7, 14])
      queryClient.setQueryData(
        [...logsKey(BABY.id), "stats", statsFetchSince(vnDayRange(now, count))],
        LOGS,
      );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <ReportScreen baby={BABY} />
    </QueryClientProvider>
  );
}
```

Run: `bun run typecheck`
Expected: `tsc --noEmit` không báo lỗi.

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở `http://localhost:3000/fixture-report` trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp.

Trên trang tạm (ngày ghi dưới đây là của lần viết plan, hôm nay 27/11; lúc chạy thì theo hôm nay):

1. Kỳ "7 ngày": thứ tự các mục "Theo ngày", "Nhiệt độ", "Thuốc đã dùng", "Triệu chứng", "Tăng trưởng (lần đo gần nhất)", "Tiêm chủng". Bảng "Triệu chứng" có tiêu đề cột "Giờ", "Triệu chứng", "Ghi chú" và ba hàng, cũ trước: "26/11 08:00 | Sổ mũi, Ho, Quấy | Ho nhiều về đêm, bú ít hơn mọi ngày, quấy khi đặt xuống"; "27/11 06:30 | Ho | (trống)"; "27/11 07:00 | (trống) | (trống)". Không có hàng "18/11".
2. Chạy đoạn đo dưới. Khi viết plan, ở 375 px theme `rose`: bảng 309×253; ô giờ 1 dòng; "Sổ mũi, Ho, Quấy" 3 dòng; ghi chú 5 dòng; `overflow` là `true`; `ellipsis` là 0.
3. Bấm "14 ngày", chạy lại đoạn đo. Kỳ vọng: thêm hàng đầu "18/11 09:00 | Ho ông ổng, Nốt ở tay chân, Loét miệng | (trống)"; khi viết plan bảng 309×406, ô đó 5 dòng, ghi chú 6 dòng; không chữ nào bị cắt.

```js
const lines = (el) => {
  const r = document.createRange();
  r.selectNodeContents(el);
  return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
};
const box = (el) => {
  const b = el.getBoundingClientRect();
  return `${Math.round(b.width)}×${Math.round(b.height)}`;
};
const table = () => {
  const h = [...document.querySelectorAll("h3")].find(
    (x) => x.textContent === "Triệu chứng",
  );
  const t = h?.nextElementSibling;
  return t
    ? {
        table: box(t),
        rows: [...t.querySelectorAll("tbody tr")].map((r) =>
          [...r.cells]
            .map((c) => `${c.textContent || "(trống)"} ${lines(c)}d`)
            .join(" | "),
        ),
        order: [...document.querySelectorAll("h3")]
          .map((x) => x.textContent)
          .join(" → "),
      }
    : null;
};
JSON.stringify({
  w: innerWidth,
  overflow: document.documentElement.scrollWidth <= innerWidth,
  ellipsis: [...document.querySelectorAll("*")].filter(
    (e) => getComputedStyle(e).textOverflow === "ellipsis",
  ).length,
  table: table(),
});
```

4. Giả lập bản in trong trang (chạy trong trang, không bấm in): chép mọi luật trong `@media print` của các stylesheet vào một thẻ `<style>` mới, rồi nhìn bảng. Kỳ vọng: nền trắng, chữ đen, kẻ ô đen, phần điều khiển (tiêu đề trang, chọn kỳ, nút in) ẩn.

```js
const rules = [];
for (const sheet of document.styleSheets) {
  let list;
  try {
    list = sheet.cssRules;
  } catch {
    continue;
  }
  const walk = (rs) => {
    for (const r of rs) {
      if (r instanceof CSSMediaRule && r.media.mediaText.includes("print")) {
        for (const inner of r.cssRules)
          if (!(inner instanceof CSSPageRule)) rules.push(inner.cssText);
      } else if (r.cssRules) walk(r.cssRules);
    }
  };
  walk(list);
}
const style = document.createElement("style");
style.textContent = rules.join("\n");
document.head.appendChild(style);
rules.length;
```

5. Tải lại trang (bỏ giả lập in), lặp lại mục 1 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"`: bảng đọc được ở cả bốn.

Trang thật (dữ liệu thật của gia đình: **chỉ xem**; cần đăng nhập trong khung Browser):

6. `http://localhost:3000/bao-cao`: trang mở như trước, kỳ "7 ngày" và "14 ngày" như trước. Nếu gia đình đã ghi triệu chứng trong kỳ thì có bảng "Triệu chứng" sau "Thuốc đã dùng"; không thì không có. Không bấm "In / Lưu PDF". Lọc console bằng `onlyErrors`: không có lỗi. `scrollWidth <= innerWidth` là `true`.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo; mục nào thấy trên trang thật, mục nào chỉ thấy trên trang tạm. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

**Kết quả Step 4 (2026-11-27, khung Browser trong app, 375×812, `innerWidth` 375 trước mỗi lần đo):**

Trên trang tạm `/fixture-report` (hôm nay 27/11, đúng ngày của lần viết plan):

1. Đạt. Thứ tự "Theo ngày → Nhiệt độ → Thuốc đã dùng → Triệu chứng → Tăng trưởng (lần đo gần nhất) → Tiêm chủng". Ba hàng, cũ trước: "26/11 08:00 | Sổ mũi, Ho, Quấy | Ho nhiều về đêm, bú ít hơn mọi ngày, quấy khi đặt xuống"; "27/11 06:30 | Ho | (trống)"; "27/11 07:00 | (trống) | (trống)". Không có hàng "18/11".
2. Theme `rose`: bảng 309×253; ô giờ 1 dòng; "Sổ mũi, Ho, Quấy" 3 dòng; ghi chú 5 dòng; `overflow` `true` (`scrollWidth` 375) — khớp plan. **Lệch:** `ellipsis` là 2, không phải 0. Hai phần tử đó là hai nút "7 ngày" và "14 ngày" của `Segmented` (`components/ui/Segmented.tsx`), có lớp `truncate` từ commit `81c7005`, có từ trước M4b; cả hai không bị cắt thật (`scrollWidth` = `clientWidth` = 165). Đoạn đo đếm phần tử có kiểu `text-overflow: ellipsis`, không đếm chữ bị cắt; đếm chữ bị cắt thật (`ellipsis` và `scrollWidth > clientWidth`) thì 0. Không phải lỗi, không sửa.
3. Đạt. "14 ngày": thêm hàng đầu "18/11 09:00 | Ho ông ổng, Nốt ở tay chân, Loét miệng | (trống)"; bảng 309×406, ô đó 5 dòng, ghi chú 6 dòng ("Sổ mũi, Ho, Quấy" 2 dòng) — khớp plan. Chữ bị cắt thật: 0.
4. Đạt. 12 luật `@media print` được chép vào trang: nền `body` trắng, chữ ô đen, kẻ ô đen, không nút nào còn hiện (tiêu đề trang, chọn kỳ, nút in ẩn). Bảng ở 14 ngày đọc rõ, mỗi hàng nguyên vẹn.
5. Đạt. Tải lại, kỳ 7 ngày, theme `rose`, `light`, `dark`, `night`: cả bốn có ba hàng, không tràn ngang. Tương phản chữ ô / nền đo được ở `rose` (~14:1) và `light` (~16:1); `dark` và `night` có nền kính trong mờ nên không đo bằng số, đã nhìn ảnh chụp: đọc rõ.

Trên trang thật (dữ liệu thật của gia đình, chỉ xem; khung Browser đã đăng nhập sẵn):

6. Đạt. `/bao-cao` mở, kỳ mặc định "7 ngày"; `scrollWidth` 375 = `innerWidth`; chữ bị cắt thật 0; console lọc `onlyErrors`: không có lỗi. Không có bảng "Triệu chứng" ở "7 ngày" lẫn "14 ngày" (bảng "Theo ngày" 14 hàng): gia đình chưa ghi triệu chứng nào trong 14 ngày qua, nên bảng có chữ và giờ thật **chưa kiểm** trên trang thật (chỉ thấy trên trang tạm). Không bấm "In / Lưu PDF"; bản xem trước khi in thật của trình duyệt **chưa kiểm**.

Chưa kiểm: bề ngang 390 và 440 px; theme `peach`, `lavender`, `sea`; bản xem trước khi in thật; iPhone thật (Bước 38 mục 24, chờ người dùng).

- [x] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-report
bun run typecheck
git status --short  # không còn app/fixture-report
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts`: chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [x] **Step 6: Phần M4b của Bước 38 (Patch 5) và một đoạn đọc spec (Patch 6), commit**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index 568a92e..e262c7e 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -646,7 +646,7 @@ Kết quả: Chờ người dùng.
 
 ## Bước 38 — Đợt ốm (spec 2026-11-26)
 
-Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó.
+Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23, bảng "Triệu chứng" của Báo cáo là mục 24. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó. Mục 24 tạo một bản ghi Triệu chứng thử và xóa nó.
 
 1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
 2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
@@ -671,6 +671,7 @@ Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; ph
 21. Làm sau, khi có một đợt ốm thật đang mở hơn 48 giờ. Kỳ vọng: dưới thẻ đợt ốm có thẻ nhắc với một trong ba tiêu đề: "{tên bé} đã 48 giờ không sốt" (lần đo cuối dưới 38 và đã 48 giờ từ lần sốt cuối), "48 giờ qua chưa đo lại nhiệt độ" (lần đo cuối vẫn từ 38 và đã 48 giờ không đo), hoặc "48 giờ qua không có triệu chứng hay liều hạ sốt nào"; dòng "Đợt ốm bắt đầu … xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa."; hai nút "Bé đã khỏi", "Chưa". Bấm "Chưa". Kỳ vọng: thẻ nhắc biến mất trên máy này trong 24 giờ, máy kia vẫn thấy. Bật Ban đêm: ba dạng thẻ nhắc khác nhau ở icon (dấu tích, đồng hồ, nhiệt kế) chứ không chỉ ở màu.
 22. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết có thẻ "So với thường ngày" ngay dưới mục "Từng ngày"; trong thẻ chỉ có câu "Chưa có ngày trọn nào của đợt ốm để so." và dòng "Phân loại triệu chứng" có mũi tên. Bấm bút chì, đổi "Bắt đầu" thành 08:00 của hôm kia, bấm "Lưu". Kỳ vọng: thẻ có dòng "Hôm qua, so với trung bình 7 ngày trước khi ốm" rồi tới ba hàng "Bú", "Tã ướt", "Ngủ" (hàng nào bảy ngày trước đó không có số thì không có); mỗi hàng có dòng "{số} cữ · thường {số} cữ", "{số} lần · thường {số} lần" hoặc "{số} giờ · thường {số} giờ" và một chip "Ít hơn", "Như thường" hoặc "Nhiều hơn"; không chữ nào bị cắt. Nếu bảy ngày trước hôm kia có ít hơn ba ngày được ghi bú, ngủ hay tã thì thay vào đó là câu "Chưa đủ dữ liệu trước khi ốm để so.". Bấm "Phân loại triệu chứng". Kỳ vọng: trang Phân loại triệu chứng mở ra. Quay lại.
 23. Bật Ban đêm. Kỳ vọng: các chip của thẻ "So với thường ngày" khác nhau ở chữ, đọc rõ. Tắt Ban đêm. Bấm "Bé đã khỏi". Kỳ vọng: dòng đầu của thẻ thành "{ngày hôm qua, dd/mm}, so với trung bình 7 ngày trước khi ốm", các hàng giữ nguyên. Dọn: bấm bút chì, "Xóa đợt ốm".
+24. Bấm "+", nhóm "Khác", "Triệu chứng"; chọn "Ho", gõ ghi chú "thử", bấm "Lưu". Sức khỏe → "Báo cáo cho bác sĩ", để "7 ngày". Kỳ vọng: sau mục "Thuốc đã dùng" có bảng "Triệu chứng" ba cột "Giờ", "Triệu chứng", "Ghi chú"; có một hàng với giờ vừa lưu, "Ho", "thử"; bảng không tràn ra ngoài màn hình. Bấm "In / Lưu PDF". Kỳ vọng: bản xem trước có bảng đó, chữ đen trên nền trắng, có kẻ ô. Hủy in. Dọn: vào Nhật ký xóa bản ghi "Triệu chứng: Ho · thử". Mở lại Báo cáo. Kỳ vọng: không còn bảng "Triệu chứng" (nếu bảy ngày qua không có bản ghi triệu chứng nào khác).
 
 Kết quả: Chờ người dùng.
 
```

```diff
diff --git a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
index e4455d8..07ab994 100644
--- a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
+++ b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
@@ -437,6 +437,7 @@ alter table public.photos add foreign key (visit_id, baby_id)
   - Sau bảng thuốc có bảng "Lần khám" (từ M5): Lúc khám, Nơi khám, Bác sĩ kết luận, Lời dặn. Không in ảnh.
 - Với mọi kỳ: khi kỳ có bản ghi `symptom`, sau bảng thuốc có bảng "Triệu chứng": Giờ, Triệu chứng (các `short`), Ghi chú.
 - Kỳ 7 và 14 ngày: ngoài bảng "Triệu chứng", không đổi gì.
+- Bảng "Triệu chứng": mỗi bản ghi một hàng, cũ trước; Giờ viết "{dd/mm} {HH:mm}" như các dòng nhiệt độ. Mã không còn trong nội dung thì bỏ; bản ghi chỉ còn mã lạ thì ô Triệu chứng để trống. Không có ghi chú thì ô Ghi chú để trống. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói ba chỗ này. Chọn ở M4b ngày 2026-11-27 theo lời duyệt trước của người dùng.)
 
 ## 10. Kiểm thử
 
```

`docs/device-checklist.md` từ trước đã không theo prettier: không chạy `prettier --write` lên nó.

```bash
git add docs/device-checklist.md docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
git commit -m "docs: the M4b part of step 38, and a reading of §9 in the spec" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 7: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này là untracked (??), hoặc đã được commit lúc duyệt thì là M; các file plan khác chưa chạy: không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4b.md
git commit -m "docs(plan): the M4b plan and its check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

**Kết quả (2026-11-27, nhánh `feat/kim-bun-dot-om-m4b` cắt từ `main` @ `f28e7d1`):**

- Step 0: `M4a có trên main`; nền `Test Files  206 passed (206)`, `Tests  1953 passed (1953)` — khớp.
- Task 1: đỏ `Test Files  1 failed | 206 passed (207)`, `Tests  13 failed | 1953 passed (1966)` (4 `episodeReport`, 7 `reportSelection`, 2 `symptomRows` `is not a function`); xanh `207/1966`; `tsc` sạch — khớp. Commit `da11116`.
- Task 2: đỏ `Test Files  1 failed | 207 passed (208)`, `Tests  1 failed | 1968 passed (1969)` (chỉ "a table after the medicines…"); xanh `208/1969`; `tsc` sạch — khớp. Commit `d79184b`.
- Task 3 Step 1: `tsc` sạch, `208/1969`. Step 2: lần 1 thoát 1 (thông báo bảo mật của Next.js 16.4.3), lần 2 thoát 0, `✓ Generating static pages using 9 workers (42/42)`, `/bao-cao` vẫn `○`. Không chạy `next upgrade`.
- Step 4: xem kết quả ngay dưới Step 4. Một số lệch (`ellipsis` 2 thay vì 0) đã tìm ra nguyên nhân: hai nút có sẵn của `Segmented`, không bị cắt; không phải lỗi.
- Step 5: sau khi xóa trang tạm, `tsc` đỏ giả một lần ở `.next/dev/types/validator.ts`; `rm -rf .next/dev/types .next/types` rồi sạch.
- Step 6: Patch 5, 6 áp sạch. Commit `37ae3dd`. Sau đó chạy lại: `208/1969`; build lần 1 thoát 1 (thông báo bảo mật), lần 2 thoát 0, 42/42; `tsc` sạch; cây sạch.
- Không có lỗi, không có bản sửa ngoài plan.

- [x] **Step 8: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m4b
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm; nhắc người dùng phần M4b của Bước 38 (mục 24) đang chờ họ trên iPhone thật; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
