# Kim Bun — Đợt ốm M4a: thẻ "So với thường ngày" Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§5.4; §6.3 mục 5; phần §5.4 của §10.1; phần "trang chi tiết" của §10.3; phần M4 của §10.4)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Trang chi tiết của một đợt ốm có thẻ "So với thường ngày": bú, tã ướt và giờ ngủ của một ngày trong đợt so với trung bình 7 ngày trước khi ốm, mỗi hàng một chip "Ít hơn", "Như thường" hoặc "Nhiều hơn".

**Architecture:**

- **Luật thuần** `usualComparison` trong `lib/rules/illness.ts`: chọn ngày so sánh, chọn các ngày nền, tính bằng `dailyStats` có sẵn, so ngưỡng 0,75 và 1,25 bằng số nguyên cho chính xác.
- **Chữ** `usualView` trong `lib/rules/illnessView.ts`, cùng file với chữ của trang chi tiết.
- **Thẻ** `EpisodeUsual` (`components/illness/EpisodeUsual.tsx`) không có hook; `EpisodeBody` đặt nó ngay sau "Từng ngày". Bản ghi là bản ghi trang đã tải (`detailRange` đọc từ ngày thứ 8 trước ngày bắt đầu), không tải thêm gì.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m4a`, cắt từ `main` sau khi M3b đã lên. Baseline: 1931 test (204 file) vitest xanh, typecheck sạch.

**Các mốc của spec này:**

| Mốc      | Nội dung                                                                                     | Plan                                                                              |
| -------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| M1a, M1b | §3: bản ghi Triệu chứng                                                                      | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md`, `…-m1b.md` (đã ở `main`) |
| M2a–M2g  | §4, §5.1–5.3, §5.7, §6: đợt ốm, hai trang, lối vào ở Sức khỏe                                | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md` … `…-m2g.md`              |
| M3a, M3b | §5.5, §5.6, §7: thẻ đợt ốm, lời mời, nhắc đóng trên tab Hôm nay                              | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3a.md`, `…-m3b.md`               |
| M4a      | §5.4: thẻ "So với thường ngày" trên trang chi tiết; Bước 38 mục 22–23                        | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4a.md`                           |
| M4b      | §9: bảng "Triệu chứng" của Báo cáo (mọi kỳ), luật của kỳ "Đợt ốm"; Bước 38 mục 24            | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4b.md`                           |
| M4c      | §9, §6.3 mục 7: kỳ "Đợt ốm" của Báo cáo, `/bao-cao?dot={id}`, nút báo cáo; Bước 38 mục 25–28 | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4c.md`                           |
| M5       | §8: lần khám                                                                                 | chưa viết                                                                         |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Mốc M4 được cắt làm ba plan** để mỗi plan dưới khoảng 1.500 dòng: M4a (plan này) là thẻ "So với thường ngày"; M4b là bảng "Triệu chứng" của Báo cáo và các luật của kỳ "Đợt ốm"; M4c là kỳ "Đợt ốm" trên trang Báo cáo và nút "Báo cáo cho bác sĩ". Sau mỗi plan app chạy được và lên `main` riêng được. Nút "Báo cáo cho bác sĩ" (§6.3 mục 7) chưa có ở plan này: nó dẫn tới kỳ "Đợt ốm" mà M4c mới làm.
2. **Ngày so sánh `D`** (§5.4): đợt đang mở là hôm qua; đợt đã đóng là ngày trước ngày của `ended_at`. `D` được phép là chính ngày bắt đầu (spec chỉ loại `D` trước ngày bắt đầu); khi đó `D` vẫn tính trọn ngày lịch như bảng "Theo ngày" của Báo cáo, kể cả phần trước `started_at`. `D` trước ngày bắt đầu thì thẻ chỉ ghi "Chưa có ngày trọn nào của đợt ốm để so." Ghi vào spec §5.4 (Patch 6).
3. **Một ngày nền "có bản ghi"** khi có ít nhất một bản ghi `breast`, `bottle`, `sleep` hoặc `diaper` **bắt đầu** trong ngày lịch đó (giờ Việt Nam). Một giấc ngủ từ tối hôm trước vẫn được cộng phút vào ngày sau (như `dailyStats`), nhưng tự nó không làm ngày sau thành ngày có bản ghi. Ghi vào spec §5.4 (Patch 6).
4. **Trung bình nền** là tổng chia cho số ngày nền được tính (3 tới 7), không chia cho 7. Ngưỡng so bằng số nguyên: "Ít hơn" khi `giá trị × số ngày × 4 ≤ tổng × 3`; với Ngủ, "Nhiều hơn" khi `giá trị × số ngày × 4 ≥ tổng × 5`. Nhờ vậy đúng 0,75 hay đúng 1,25 không lệch vì số lẻ của máy.
5. **Bú** là `feeds` của `dailyStats` (bú mẹ và bú bình cách nhau dưới 30 phút là một cữ, như trang Thống kê); **Tã ướt** là `wetDiapers`; **Ngủ** là `sleepMinutes` (giấc ngủ qua nửa đêm được chia hai ngày).
6. **Làm tròn** (§5.4): nền làm tròn tới số nguyên gần nhất (`Math.round`, 0,5 làm tròn lên). Với Ngủ, cả giờ của ngày `D` và giờ nền làm tròn tới giờ gần nhất từ số phút. Tỷ lệ và chip tính trên số chưa làm tròn, nên có thể thấy "13 giờ · thường 13 giờ" mà chip vẫn đúng.
7. **Cả ba hàng đều ẩn** (trung bình nền của cả ba bằng 0, ví dụ bảy ngày trước chỉ ghi tã bẩn) thì thẻ ghi "Chưa đủ dữ liệu trước khi ốm để so." như khi thiếu ngày nền. Spec không nói trường hợp này. Ghi vào spec §5.4 (Patch 6).
8. **Khi thẻ chỉ có một câu** ("Chưa có ngày trọn …", "Chưa đủ dữ liệu …"), thẻ không có dòng phụ "Hôm qua, so với …": dòng đó nói thẻ so cái gì với cái gì, mà lúc ấy không có gì được so. Đường dẫn "Phân loại triệu chứng" vẫn ở cuối thẻ. Ghi vào spec §5.4 (Patch 6).
9. **Hình của thẻ** theo bản vẽ "Đợt ốm · A": nền `glass`, bo 26 px; tiêu đề "So với thường ngày" 16/22 đậm nằm trong thẻ; dòng phụ 13/18 màu `muted`; mỗi hàng cao ít nhất 52 px với tên 15 px đậm vừa, dòng số 13/18 màu `muted`, chip `StatusChip` bên phải. Bản vẽ không vẽ đường dẫn "Phân loại triệu chứng" (§6.3 mục 5): nó là một hàng 44 px có mũi tên phải, chữ 15 px đậm vừa màu `accent-text`, kẻ trên như các hàng.
10. **Tông của chip:** "Ít hơn" `warn`, "Như thường" `good`, "Nhiều hơn" trung tính. Ở theme `night` ba chip khác nhau ở chữ.
11. **Trên trang thật không tạo đợt ốm.** Gia đình hiện chưa có đợt nào; thẻ chỉ thấy đủ trên trang fixture. Bước 38 mục 22–23 để người dùng làm trên iPhone thật.

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
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4a.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `864a3ea` (M3b đã lên; `Test Files  204 passed (204)`, `Tests  1931 passed (1931)`). Lần chạy thử đầu là trên `8f6714e` cộng 16 patch của M3a và M3b trích từ hai file plan đó, trước khi M3b lên `main`; code của `864a3ea` trùng khít nền đó, và mọi số đo đã được đo lại trên `864a3ea`. Trong bản chạy thử mỗi task code là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Patch 5 (checklist) được sinh trên checklist đã có mục 16–21 của M3b; Patch 6 (spec) trên spec đã có các dòng M3b ghi thêm. `bun run build` đã chạy xanh trên bản sao ở trạng thái cuối của cả ba plan M4 (42 trang).
- **Đã nhìn thử khi viết plan.** Trang fixture của Task 3 đã được mở ở 375 px trên bản sao: số đo ở mục 3 của bước trình duyệt là của lần đó (đo ở `dark`, nhìn thêm ở `rose` và `night`). Chưa xem: bề ngang 390 và 440, theme `light`, mọi trang thật.
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

Plan này đứng sau M3b và trước M4b, M4c. M4b không dùng code nào của plan này, nhưng Patch 5 và 6 của M4b được sinh trên checklist và spec đã có phần của plan này, và Step 0 của M4b kiểm plan này đã lên `main`; M4c thêm nút "Báo cáo cho bác sĩ" vào cùng chỗ của `EpisodeBody` mà plan này sửa. Thứ tự chạy: M4a, M4b, M4c.

**Consumes (M2):** `EpisodeBody`, `EpisodeScreen` (`components/illness/EpisodeScreen.tsx`); `detailRange`, `type EpisodeLike`, `type EpisodeTone` (`lib/rules/illness.ts`); `components/illness/episodescreen.test.tsx`; Bước 38 mục 1–21 của `docs/device-checklist.md` (M1, M2g, M3b).

**Consumes (đã ở `main` từ trước):** `dailyStats` (`lib/rules/dailyStats.ts`), `addDays`, `formatDayShort` (`lib/rules/days.ts`), `vnDateString` (`lib/rules/time.ts`), `StatusChip`, `Icon` (icon `chevronRight`), `Link` của `next/link`.

**Produces:**

- `lib/rules/illness.ts`: `usualComparison(logs: LogLike[], episode: EpisodeLike, now: Date): UsualComparison`; `type UsualKey = "feeds" | "wetDiapers" | "sleepMinutes"`; `type UsualVerdict = "less" | "usual" | "more"`; `type UsualRow = { key: UsualKey; value: number; base: number; verdict: UsualVerdict }`; `type UsualComparison = { kind: "no-day" } | { kind: "no-base" } | { kind: "rows"; day: string; rows: UsualRow[] }`.
- `lib/rules/illnessView.ts`: `usualView(logs, episode, now): UsualView`; `type UsualView = { sub: string | null; message: string | null; rows: { label: string; line: string; chip: { text: string; tone: EpisodeTone } }[] }`.
- `components/illness/EpisodeUsual.tsx`: `EpisodeUsual(props: { view: UsualView })`.
- `docs/device-checklist.md`: Bước 38 có mục 22–23.
- Spec §5.4: một đoạn ghi bốn cách đọc (Diễn giải spec mục 2, 3, 7, 8).
- **Vitest sau M4a:** 1953 test, 206 file.

---

### Task 1: Luật và chữ của "So với thường ngày" (§5.4)

**Files:**

- Modify: `lib/rules/illness.ts` (thêm `usualComparison` và các kiểu của nó, trước `checkEpisode`)
- Modify: `lib/rules/illnessView.ts` (thêm `usualView`, trước bảng chữ của chip danh sách)
- Test: `lib/rules/illnessUsual.test.ts` (mới)

**Interfaces:**

- Consumes: `dailyStats(logs, days, now): DayStat[]` (`lib/rules/dailyStats.ts`); `addDays`, `formatDayShort`; `vnDateString`; `type EpisodeLike`, `type EpisodeTone`.
- Produces: `usualComparison`, `type UsualKey`, `type UsualVerdict`, `type UsualRow`, `type UsualComparison` (`lib/rules/illness.ts`); `usualView`, `type UsualView` (`lib/rules/illnessView.ts`). Chữ đúng của spec §5.4: "Bú", "Tã ướt", "Ngủ"; "{giá trị} cữ · thường {nền} cữ", "{giá trị} lần · thường {nền} lần", "{giá trị} giờ · thường {nền} giờ"; "Ít hơn", "Như thường", "Nhiều hơn"; "Hôm qua, so với trung bình 7 ngày trước khi ốm" (đợt đã đóng: "{dd/mm}, so với trung bình 7 ngày trước khi ốm"); "Chưa có ngày trọn nào của đợt ốm để so."; "Chưa đủ dữ liệu trước khi ốm để so."

- [x] **Step 0: Kiểm M3b đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f components/home/useHomeIllness.ts && grep -q "useHomeIllness" components/home/HomeScreen.tsx && echo "M3b có trên main"
git checkout -b feat/kim-bun-dot-om-m4a
bunx vitest run
```

Expected: dòng `M3b có trên main`; `Test Files  204 passed (204)`, `Tests  1931 passed (1931)`. Không thấy dòng đó thì dừng: M3b chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [x] **Step 1: Viết test đỏ (Patch 1)**

Mỗi ngày giả của bé dựng bằng hàm `routine` (cữ bú cách 2 giờ, tã ướt lúc :30, một giấc từ 08:00). Mọi luật phải cho cùng kết quả khi mảng bản ghi xếp tăng, giảm hay xáo trộn (§4.2), nên ca đầu chạy qua `anyOrder`.

```diff
diff --git a/lib/rules/illnessUsual.test.ts b/lib/rules/illnessUsual.test.ts
new file mode 100644
index 0000000..d67bbad
--- /dev/null
+++ b/lib/rules/illnessUsual.test.ts
@@ -0,0 +1,347 @@
+import { describe, expect, it } from "vitest";
+import { addDays } from "./days";
+import type { LogLike } from "./describeLog";
+import { type EpisodeLike, usualComparison } from "./illness";
+import { usualView } from "./illnessView";
+
+// Vietnam time, written the way a parent reads the clock.
+const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
+const iso = (text: string) => vn(text).toISOString();
+const NOW = vn("2026-11-26 10:00");
+
+const episode = (start: string, end: string | null = null): EpisodeLike => ({
+  id: "ep1",
+  started_at: iso(start),
+  ended_at: end === null ? null : iso(end),
+});
+// Started late on 24/11, so yesterday (25/11) is its first whole day, and
+// the seven days before it are 17/11 to 23/11.
+const OPEN = episode("2026-11-24 23:30");
+const BASE = Array.from({ length: 7 }, (_, i) => addDays("2026-11-17", i));
+
+const at = (type: string, time: string, end: string, details: unknown) => ({
+  type,
+  started_at: iso(time),
+  ended_at: iso(end),
+  details,
+});
+const pad = (n: number) => String(n).padStart(2, "0");
+
+// One day of the baby's routine: feeds two hours apart from 01:00 (12 at most), wet
+// diapers at half past each hour from 00:30, one sleep from 08:00.
+function routine(
+  day: string,
+  usual: { feeds?: number; wet?: number; sleepMinutes?: number },
+): LogLike[] {
+  const logs: LogLike[] = [];
+  for (let i = 0; i < (usual.feeds ?? 0); i += 1)
+    logs.push(
+      at(
+        "breast",
+        `${day} ${pad(1 + 2 * i)}:00`,
+        `${day} ${pad(1 + 2 * i)}:20`,
+        { side: "left" },
+      ),
+    );
+  for (let i = 0; i < (usual.wet ?? 0); i += 1)
+    logs.push(
+      at("diaper", `${day} ${pad(i)}:30`, `${day} ${pad(i)}:30`, {
+        wet: true,
+        dirty: false,
+      }),
+    );
+  const sleep = usual.sleepMinutes ?? 0;
+  if (sleep > 0) {
+    const end = new Date(vn(`${day} 08:00`).getTime() + sleep * 60_000);
+    logs.push({
+      type: "sleep",
+      started_at: iso(`${day} 08:00`),
+      ended_at: end.toISOString(),
+      details: {},
+    });
+  }
+  return logs;
+}
+const week = (usual: Parameters<typeof routine>[1], days = BASE) =>
+  days.flatMap((day) => routine(day, usual));
+
+// Spec §4.2: the rules may not lean on the order of the array.
+function anyOrder<T>(logs: LogLike[], rule: (logs: LogLike[]) => T): T {
+  const ascending = [...logs].sort((a, b) =>
+    a.started_at.localeCompare(b.started_at),
+  );
+  const shuffled = [
+    ...ascending.filter((_, i) => i % 2 === 1),
+    ...ascending.filter((_, i) => i % 2 === 0).reverse(),
+  ];
+  const [first, ...rest] = [ascending, [...ascending].reverse(), shuffled].map(
+    rule,
+  );
+  for (const other of rest) expect(other).toEqual(first);
+  return first;
+}
+
+const USUAL = { feeds: 8, wet: 6, sleepMinutes: 14 * 60 };
+
+// Spec 2026-11-26 §5.4.
+describe("usualComparison", () => {
+  it("an open episode compares yesterday with the 7 days before its first day", () => {
+    const logs = [
+      ...week(USUAL),
+      ...routine("2026-11-25", { feeds: 6, wet: 5, sleepMinutes: 15 * 60 }),
+      // Today and the episode's own first evening are not compared.
+      ...routine("2026-11-26", { feeds: 1 }),
+    ];
+    expect(anyOrder(logs, (l) => usualComparison(l, OPEN, NOW))).toEqual({
+      kind: "rows",
+      day: "2026-11-25",
+      rows: [
+        { key: "feeds", value: 6, base: 8, verdict: "less" },
+        { key: "wetDiapers", value: 5, base: 6, verdict: "usual" },
+        { key: "sleepMinutes", value: 900, base: 840, verdict: "usual" },
+      ],
+    });
+  });
+
+  it("a closed episode compares the day before the day it ended", () => {
+    const closed = episode("2026-11-24 23:30", "2026-11-26 08:00");
+    const logs = [...week(USUAL), ...routine("2026-11-25", USUAL)];
+    expect(usualComparison(logs, closed, vn("2026-12-20 09:00"))).toMatchObject(
+      { kind: "rows", day: "2026-11-25" },
+    );
+  });
+
+  it("the first day itself may be the day compared, counted as a whole calendar day", () => {
+    const started = episode("2026-11-25 18:00");
+    const logs = [...week(USUAL), ...routine("2026-11-25", USUAL)];
+    expect(usualComparison(logs, started, NOW)).toMatchObject({
+      kind: "rows",
+      day: "2026-11-25",
+      rows: [
+        { key: "feeds", value: 8, verdict: "usual" },
+        { key: "wetDiapers", value: 6, verdict: "usual" },
+        { key: "sleepMinutes", value: 840, verdict: "usual" },
+      ],
+    });
+  });
+
+  it("no day to compare before the episode's first day", () => {
+    const logs = week(USUAL);
+    expect(usualComparison(logs, episode("2026-11-26 07:00"), NOW)).toEqual({
+      kind: "no-day",
+    });
+    const sameDay = episode("2026-11-20 07:00", "2026-11-20 21:00");
+    expect(usualComparison(logs, sameDay, NOW)).toEqual({ kind: "no-day" });
+  });
+
+  it("needs at least 3 days with a feed, a sleep or a diaper before the episode", () => {
+    const yesterday = routine("2026-11-25", USUAL);
+    const two = week(USUAL, BASE.slice(0, 2));
+    // A day with only a temperature or a medicine does not count.
+    const other = BASE.slice(2).map((day) => ({
+      type: "temperature",
+      started_at: iso(`${day} 09:00`),
+      ended_at: iso(`${day} 09:00`),
+      details: { celsius: 37, method: "nach" },
+    }));
+    expect(
+      usualComparison([...two, ...other, ...yesterday], OPEN, NOW),
+    ).toEqual({ kind: "no-base" });
+    const three = week(USUAL, BASE.slice(0, 3));
+    expect(usualComparison([...three, ...yesterday], OPEN, NOW)).toMatchObject({
+      kind: "rows",
+    });
+  });
+
+  it("averages only the days that were logged", () => {
+    // Four quiet days (the baby was away) do not pull the average down.
+    const logs = [
+      ...week(USUAL, BASE.slice(4)),
+      ...routine("2026-11-25", USUAL),
+    ];
+    expect(usualComparison(logs, OPEN, NOW)).toMatchObject({
+      kind: "rows",
+      rows: [
+        { key: "feeds", value: 8, base: 8, verdict: "usual" },
+        { key: "wetDiapers", value: 6, base: 6, verdict: "usual" },
+        { key: "sleepMinutes", value: 840, base: 840, verdict: "usual" },
+      ],
+    });
+  });
+
+  it("logs before the 7 days do not count", () => {
+    const logs = [
+      ...week(USUAL, BASE.slice(0, 2)),
+      ...routine("2026-11-16", USUAL),
+      ...routine("2026-11-15", USUAL),
+      ...routine("2026-11-25", USUAL),
+    ];
+    expect(usualComparison(logs, OPEN, NOW)).toEqual({ kind: "no-base" });
+  });
+
+  it("feeds and wet diapers: at most 0.75 of usual is less, anything above is as usual", () => {
+    const verdicts = [6, 7, 12].map((feeds) => {
+      const logs = [
+        ...week(USUAL),
+        ...routine("2026-11-25", { ...USUAL, feeds }),
+      ];
+      const result = usualComparison(logs, OPEN, NOW);
+      return result.kind === "rows" ? result.rows[0].verdict : result.kind;
+    });
+    expect(verdicts).toEqual(["less", "usual", "usual"]);
+  });
+
+  it("sleep: at most 0.75 is less, at least 1.25 is more", () => {
+    const verdicts = [9, 10, 14, 15, 16].map((hours) => {
+      const logs = [
+        ...week({ ...USUAL, sleepMinutes: 12 * 60 }),
+        ...routine("2026-11-25", { ...USUAL, sleepMinutes: hours * 60 }),
+      ];
+      const result = usualComparison(logs, OPEN, NOW);
+      return result.kind === "rows" ? result.rows[2].verdict : result.kind;
+    });
+    expect(verdicts).toEqual(["less", "usual", "usual", "more", "more"]);
+  });
+
+  it("the thresholds hold exactly when the average is not a round number", () => {
+    // 8, 8 and 9 feeds: the average is 8.33…, and 0.75 of it is 6.25.
+    const base = [
+      ...routine(BASE[0], { ...USUAL, feeds: 8 }),
+      ...routine(BASE[1], { ...USUAL, feeds: 8 }),
+      ...routine(BASE[2], { ...USUAL, feeds: 9 }),
+    ];
+    const verdict = (feeds: number) => {
+      const logs = [...base, ...routine("2026-11-25", { ...USUAL, feeds })];
+      const result = usualComparison(logs, OPEN, NOW);
+      return result.kind === "rows" ? result.rows[0] : result.kind;
+    };
+    expect(verdict(6)).toMatchObject({ verdict: "less", base: 25 / 3 });
+    expect(verdict(7)).toMatchObject({ verdict: "usual" });
+  });
+
+  it("a measure that is 0 on average has no row; none left means too little data", () => {
+    const noWet = [
+      ...week({ feeds: 8, sleepMinutes: 840 }),
+      ...routine("2026-11-25", USUAL),
+    ];
+    const result = usualComparison(noWet, OPEN, NOW);
+    expect(result.kind === "rows" && result.rows.map((row) => row.key)).toEqual(
+      ["feeds", "sleepMinutes"],
+    );
+    // Only dirty diapers: the days count, but every average is 0.
+    const dirty = BASE.map((day) => ({
+      type: "diaper",
+      started_at: iso(`${day} 09:00`),
+      ended_at: iso(`${day} 09:00`),
+      details: { wet: false, dirty: true },
+    }));
+    expect(
+      usualComparison([...dirty, ...routine("2026-11-25", USUAL)], OPEN, NOW),
+    ).toEqual({ kind: "no-base" });
+  });
+
+  it("a sleep that began the evening before a day counts for that day", () => {
+    const logs = [
+      ...week(USUAL),
+      ...routine("2026-11-25", { feeds: 8, wet: 6 }),
+      {
+        type: "sleep",
+        started_at: iso("2026-11-24 22:00"),
+        ended_at: iso("2026-11-25 06:00"),
+        details: {},
+      },
+    ];
+    const result = usualComparison(logs, OPEN, NOW);
+    expect(result.kind === "rows" && result.rows[2]).toEqual({
+      key: "sleepMinutes",
+      value: 360,
+      base: 840,
+      verdict: "less",
+    });
+  });
+});
+
+// Spec §5.4 and §6.3 item 5: the words of the card.
+describe("usualView", () => {
+  it("three rows: the value, the usual one, and a chip", () => {
+    const logs = [
+      ...week(USUAL),
+      ...routine("2026-11-25", { feeds: 6, wet: 5, sleepMinutes: 15 * 60 }),
+    ];
+    expect(usualView(logs, OPEN, NOW)).toEqual({
+      sub: "Hôm qua, so với trung bình 7 ngày trước khi ốm",
+      message: null,
+      rows: [
+        {
+          label: "Bú",
+          line: "6 cữ · thường 8 cữ",
+          chip: { text: "Ít hơn", tone: "warn" },
+        },
+        {
+          label: "Tã ướt",
+          line: "5 lần · thường 6 lần",
+          chip: { text: "Như thường", tone: "good" },
+        },
+        {
+          label: "Ngủ",
+          line: "15 giờ · thường 14 giờ",
+          chip: { text: "Như thường", tone: "good" },
+        },
+      ],
+    });
+  });
+
+  it("a closed episode names its day", () => {
+    const closed = episode("2026-11-24 23:30", "2026-11-26 08:00");
+    const logs = [...week(USUAL), ...routine("2026-11-25", USUAL)];
+    expect(usualView(logs, closed, vn("2026-12-20 09:00")).sub).toBe(
+      "25/11, so với trung bình 7 ngày trước khi ốm",
+    );
+  });
+
+  it("rounds the usual value to a whole number and sleep to whole hours", () => {
+    const base = [
+      ...routine(BASE[0], { feeds: 7, wet: 5, sleepMinutes: 13 * 60 }),
+      ...routine(BASE[1], { feeds: 8, wet: 6, sleepMinutes: 14 * 60 }),
+    ];
+    const logs = [
+      ...base,
+      ...routine(BASE[2], { feeds: 8, wet: 6, sleepMinutes: 14 * 60 + 30 }),
+      ...routine("2026-11-25", {
+        feeds: 8,
+        wet: 6,
+        sleepMinutes: 15 * 60 + 30,
+      }),
+    ];
+    // Feeds 23/3 = 7.67, wet 17/3 = 5.67, sleep 13 h 50 min; yesterday 15 h 30.
+    expect(usualView(logs, OPEN, NOW).rows.map((row) => row.line)).toEqual([
+      "8 cữ · thường 8 cữ",
+      "6 lần · thường 6 lần",
+      "16 giờ · thường 14 giờ",
+    ]);
+  });
+
+  it("more sleep than usual is a neutral chip", () => {
+    const logs = [
+      ...week({ ...USUAL, sleepMinutes: 12 * 60 }),
+      ...routine("2026-11-25", { ...USUAL, sleepMinutes: 15 * 60 }),
+    ];
+    expect(usualView(logs, OPEN, NOW).rows[2].chip).toEqual({
+      text: "Nhiều hơn",
+      tone: "neutral",
+    });
+  });
+
+  it("one sentence instead of the rows when there is nothing to compare", () => {
+    expect(usualView(week(USUAL), episode("2026-11-26 07:00"), NOW)).toEqual({
+      sub: null,
+      message: "Chưa có ngày trọn nào của đợt ốm để so.",
+      rows: [],
+    });
+    expect(usualView(routine("2026-11-25", USUAL), OPEN, NOW)).toEqual({
+      sub: null,
+      message: "Chưa đủ dữ liệu trước khi ốm để so.",
+      rows: [],
+    });
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 204 passed (205)`, `Tests  17 failed | 1931 passed (1948)`. Cả 17 test mới đỏ vì `usualComparison` và `usualView` chưa có (`is not a function`).

- [x] **Step 3: Viết luật và chữ (Patch 2)**

`dailyStats` được gọi một lần cho ngày `D` và các ngày nền. Mỗi giá trị là số nguyên và trung bình là tổng chia số ngày, nên ngưỡng được so bằng phép nhân số nguyên (Diễn giải spec mục 4).

```diff
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index 0b0e8af..a5d8884 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -1,4 +1,5 @@
 import { bannerReading } from "./alerts";
+import { dailyStats } from "./dailyStats";
 import { addDays, formatDayShort, vnDayStartMs } from "./days";
 import type { LogLike } from "./describeLog";
 import { detailsSchemas } from "./logDetails";
@@ -329,6 +330,76 @@ export function episodeDays(
   return rows.reverse();
 }

+// Spec §5.4: one day of the episode against the baby's usual days.
+export type UsualKey = "feeds" | "wetDiapers" | "sleepMinutes";
+export type UsualVerdict = "less" | "usual" | "more";
+export type UsualRow = {
+  key: UsualKey;
+  // The day compared: feeds, wet diapers, or minutes of sleep.
+  value: number;
+  // The average of the days before the episode, not rounded.
+  base: number;
+  verdict: UsualVerdict;
+};
+export type UsualComparison =
+  | { kind: "no-day" }
+  | { kind: "no-base" }
+  | { kind: "rows"; day: string; rows: UsualRow[] };
+
+const USUAL_KEYS: UsualKey[] = ["feeds", "wetDiapers", "sleepMinutes"];
+const BASE_DAYS = 7;
+const BASE_MIN_DAYS = 3;
+// A day counts towards the usual only when something of the routine was
+// logged that day.
+const ROUTINE = new Set(["breast", "bottle", "sleep", "diaper"]);
+
+// Spec §5.4: the day compared is yesterday for an open episode and the day
+// before the last day for a closed one; it may not be before the first day.
+// The usual is the average of the 7 calendar days before the first day,
+// counting only the days with a feed, a sleep or a diaper (at least 3).
+// `logs` must reach back to the 8th day before the first day (detailRange),
+// so a sleep from the evening before still counts. A measure that is 0 on
+// average has no row; with no row left there is nothing to compare.
+// Every value is a whole number and the average is a sum over a count, so the
+// thresholds 0.75 and 1.25 are checked on whole numbers, exactly.
+export function usualComparison(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): UsualComparison {
+  const firstDay = vnDateString(new Date(episode.started_at));
+  const lastDay = vnDateString(
+    episode.ended_at ? new Date(episode.ended_at) : now,
+  );
+  const day = addDays(lastDay, -1);
+  if (day < firstDay) return { kind: "no-day" };
+  const logged = new Set(
+    logs
+      .filter((log) => ROUTINE.has(log.type))
+      .map((log) => vnDateString(new Date(log.started_at))),
+  );
+  const baseDays = Array.from({ length: BASE_DAYS }, (_, i) =>
+    addDays(firstDay, i - BASE_DAYS),
+  ).filter((baseDay) => logged.has(baseDay));
+  if (baseDays.length < BASE_MIN_DAYS) return { kind: "no-base" };
+  const [target, ...base] = dailyStats(logs, [day, ...baseDays], now);
+  const count = base.length;
+  const rows = USUAL_KEYS.flatMap((key): UsualRow[] => {
+    const sum = base.reduce((total, stat) => total + stat[key], 0);
+    if (sum === 0) return [];
+    const value = target[key];
+    // value / (sum / count) <= 0.75, and >= 1.25 for sleep.
+    const verdict: UsualVerdict =
+      value * count * 4 <= sum * 3
+        ? "less"
+        : key === "sleepMinutes" && value * count * 4 >= sum * 5
+          ? "more"
+          : "usual";
+    return [{ key, value, base: sum / count, verdict }];
+  });
+  return rows.length > 0 ? { kind: "rows", day, rows } : { kind: "no-base" };
+}
+
 const MINUTE_MS = 60_000;
 const OVERLAP = "Trùng thời gian với một đợt ốm khác.";

diff --git a/lib/rules/illnessView.ts b/lib/rules/illnessView.ts
index 2e31ef5..e88f214 100644
--- a/lib/rules/illnessView.ts
+++ b/lib/rules/illnessView.ts
@@ -14,6 +14,9 @@ import {
   formatCelsius,
   sinceText,
   statusTone,
+  usualComparison,
+  type UsualKey,
+  type UsualVerdict,
   type Verdict,
 } from "./illness";
 import { symptomShorts } from "./symptomForm";
@@ -132,6 +135,63 @@ export function dayRows(
   }));
 }

+const USUAL_LABEL: Record<UsualKey, string> = {
+  feeds: "Bú",
+  wetDiapers: "Tã ướt",
+  sleepMinutes: "Ngủ",
+};
+const USUAL_CHIP: Record<UsualVerdict, { text: string; tone: EpisodeTone }> = {
+  less: { text: "Ít hơn", tone: "warn" },
+  usual: { text: "Như thường", tone: "good" },
+  more: { text: "Nhiều hơn", tone: "neutral" },
+};
+// Spec §5.4: "{giá trị} cữ · thường {nền} cữ"; the usual value is rounded to
+// a whole number, and sleep is counted in whole hours.
+const usualLine = (key: UsualKey, value: number, base: number) =>
+  key === "sleepMinutes"
+    ? `${Math.round(value / 60)} giờ · thường ${Math.round(base / 60)} giờ`
+    : `${value} ${key === "feeds" ? "cữ" : "lần"} · thường ${Math.round(base)} ${key === "feeds" ? "cữ" : "lần"}`;
+
+export type UsualView = {
+  // What is compared with what; null when there is nothing to compare.
+  sub: string | null;
+  // The one sentence instead of the rows.
+  message: string | null;
+  rows: {
+    label: string;
+    line: string;
+    chip: { text: string; tone: EpisodeTone };
+  }[];
+};
+
+// Spec §6.3 item 5: the card "So với thường ngày". No advice, ever.
+export function usualView(
+  logs: LogLike[],
+  episode: EpisodeLike,
+  now: Date,
+): UsualView {
+  const result = usualComparison(logs, episode, now);
+  if (result.kind !== "rows")
+    return {
+      sub: null,
+      message:
+        result.kind === "no-day"
+          ? "Chưa có ngày trọn nào của đợt ốm để so."
+          : "Chưa đủ dữ liệu trước khi ốm để so.",
+      rows: [],
+    };
+  const day = episode.ended_at ? formatDayShort(result.day) : "Hôm qua";
+  return {
+    sub: `${day}, so với trung bình 7 ngày trước khi ốm`,
+    message: null,
+    rows: result.rows.map((row) => ({
+      label: USUAL_LABEL[row.key],
+      line: usualLine(row.key, row.value, row.base),
+      chip: USUAL_CHIP[row.verdict],
+    })),
+  };
+}
+
 const CHIP_TEXT = {
   fever: "Đang sốt",
   stale: "Chưa đo lại",
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  205 passed (205)`, `Tests  1948 passed (1948)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/rules/illness.ts lib/rules/illnessView.ts lib/rules/illnessUsual.test.ts
git commit -m "feat(illness): the usual feeds, wet diapers and sleep before an episode" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Thẻ "So với thường ngày" trên trang chi tiết (§6.3 mục 5)

**Files:**

- Create: `components/illness/EpisodeUsual.tsx`
- Modify: `components/illness/EpisodeScreen.tsx` (`EpisodeBody` đặt thẻ sau `EpisodeDayList`)
- Test: `components/illness/episodeusual.test.tsx` (mới), `components/illness/episodescreen.test.tsx` (sửa: thẻ nay có trên trang)

**Interfaces:**

- Consumes: `usualView`, `type UsualView` (Task 1); `StatusChip`, `Icon`, `Link` (`next/link`).
- Produces: `EpisodeUsual(props: { view: UsualView })` (`components/illness/EpisodeUsual.tsx`). `EpisodeBody` không đổi chữ ký.

Trước khi viết, đọc `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` (AGENTS.md): thẻ dùng `Link` như các thẻ khác của app, không có tham số nào mới.

- [x] **Step 1: Viết test đỏ (Patch 3)**

Thẻ không có hook, nên test vẽ nó bằng `renderToStaticMarkup`. Test của trang (`episodescreen.test.tsx`) bỏ "So với thường ngày" khỏi danh sách "chưa có ở mốc này", thêm thứ tự các khối và một ca có bản ghi bú trước đợt.

```diff
diff --git a/components/illness/episodescreen.test.tsx b/components/illness/episodescreen.test.tsx
index a64565a..7cfbb9e 100644
--- a/components/illness/episodescreen.test.tsx
+++ b/components/illness/episodescreen.test.tsx
@@ -171,7 +171,7 @@ describe("EpisodeScreen", () => {
     expect(useLogsRealtime).toHaveBeenCalledWith("b1");
   });

-  it("an open episode: verdict, chart, days, then Bé đã khỏi", () => {
+  it("an open episode: verdict, chart, days, the comparison, then Bé đã khỏi", () => {
     const html = render();
     expect(html).toContain(">Bun đã hết sốt 19 giờ</h2>");
     expect(html).toContain(">Ngày thứ 3 · bắt đầu 24/11 lúc 23:30</span>");
@@ -186,15 +186,19 @@ describe("EpisodeScreen", () => {
     expect(html).toContain(">25/11 · ngày 2</span>");
     expect(html).toContain(">Sổ mũi</span>");
     expect(html).toMatch(/<button[^>]*w-full[^>]*>Bé đã khỏi<\/button>/);
+    // No feed, sleep or diaper was logged before the episode.
+    expect(html).toContain(">Chưa đủ dữ liệu trước khi ốm để so.</p>");
     const order = [
       ">Bun đã hết sốt 19 giờ</h2>",
       ">Nhiệt độ và thuốc hạ sốt</h2>",
       ">Từng ngày</h2>",
+      ">So với thường ngày</h2>",
       ">Bé đã khỏi</button>",
     ].map((mark) => html.indexOf(mark));
     expect(order).toEqual([...order].sort((a, b) => a - b));
-    // Not in this milestone: the comparison card, the report, the visits.
-    for (const text of ["So với thường ngày", "Báo cáo cho bác sĩ", "Lần khám"])
+    expect(order[0]).toBeGreaterThan(-1);
+    // Not in this milestone: the report, the visits.
+    for (const text of ["Báo cáo cho bác sĩ", "Lần khám"])
       expect(html).not.toContain(text);
   });

@@ -213,11 +217,28 @@ describe("EpisodeScreen", () => {
     expect(html).not.toContain("Chưa đo nhiệt độ");
   });

+  it("compares yesterday with the days before the episode, from the same logs", () => {
+    const routine = ["2026-11-20", "2026-11-21", "2026-11-22", "2026-11-25"]
+      .flatMap((day) =>
+        ["02:00", "06:00", "10:00", "14:00"].map((time) =>
+          log("breast", `${day} ${time}`, { side: "left" }),
+        ),
+      )
+      .slice(0, -2);
+    const html = render({ logs: loaded([...LOGS, ...routine]) });
+    expect(html).toContain(
+      ">Hôm qua, so với trung bình 7 ngày trước khi ốm</p>",
+    );
+    expect(html).toContain(">2 cữ · thường 4 cữ</span>");
+    expect(html).toContain(">Ít hơn</span>");
+  });
+
   it("a closed episode: Đã khỏi, no quick logs and no Bé đã khỏi; its logs stop after its last day", () => {
     const html = render({ id: "past", logs: loaded([]) });
     expect(html).toContain(">Đã khỏi sau 3 ngày</h2>");
     expect(html).toContain(">10/10 – 12/10</span>");
     expect(html).toContain(">Chưa có lần đo nào trong đợt này.</p>");
+    expect(html).toContain(">So với thường ngày</h2>");
     expect(html).not.toContain("Bé đã khỏi");
     expect(html).not.toContain(">Triệu chứng</button>");
     expect(useRangeLogs).toHaveBeenCalledWith(
diff --git a/components/illness/episodeusual.test.tsx b/components/illness/episodeusual.test.tsx
new file mode 100644
index 0000000..5669246
--- /dev/null
+++ b/components/illness/episodeusual.test.tsx
@@ -0,0 +1,76 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it } from "vitest";
+import type { UsualView } from "@/lib/rules/illnessView";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { EpisodeUsual } from "./EpisodeUsual";
+
+const ROWS: UsualView = {
+  sub: "Hôm qua, so với trung bình 7 ngày trước khi ốm",
+  message: null,
+  rows: [
+    {
+      label: "Bú",
+      line: "6 cữ · thường 8 cữ",
+      chip: { text: "Ít hơn", tone: "warn" },
+    },
+    {
+      label: "Tã ướt",
+      line: "5 lần · thường 6 lần",
+      chip: { text: "Như thường", tone: "good" },
+    },
+    {
+      label: "Ngủ",
+      line: "17 giờ · thường 13 giờ",
+      chip: { text: "Nhiều hơn", tone: "neutral" },
+    },
+  ],
+};
+const card = (view: UsualView) =>
+  renderToStaticMarkup(<EpisodeUsual view={view} />);
+
+// Spec 2026-11-26 §5.4 and §6.3 item 5 (board "Đợt ốm · A").
+describe("EpisodeUsual", () => {
+  it("a glass card titled So với thường ngày, with what is compared under it", () => {
+    const html = card(ROWS);
+    expect(html).toMatch(/^<section class="glass[^"]*rounded-\[26px\]/);
+    expect(html).toMatch(/<h2[^>]*font-bold[^>]*>So với thường ngày<\/h2>/);
+    expect(html).toMatch(
+      /<p[^>]*text-muted[^>]*>Hôm qua, so với trung bình 7 ngày trước khi ốm<\/p>/,
+    );
+    expect(html).not.toContain("truncate");
+  });
+
+  it("one row each: the name, the numbers, and a chip with words", () => {
+    const html = card(ROWS);
+    expect(html).toMatch(
+      /font-semibold[^>]*>Bú<\/span><span[^>]*text-muted[^>]*>6 cữ · thường 8 cữ<\/span><\/span><span[^>]*bg-warn-soft[^>]*>Ít hơn<\/span>/,
+    );
+    expect(html).toMatch(/bg-good-soft[^>]*>Như thường<\/span>/);
+    expect(html).toMatch(/bg-line[^>]*>Nhiều hơn<\/span>/);
+    const order = ["Bú", "Tã ướt", "Ngủ"].map((label) =>
+      html.indexOf(`>${label}</span>`),
+    );
+    expect(order).toEqual([...order].sort((a, b) => a - b));
+    expect(order[0]).toBeGreaterThan(-1);
+  });
+
+  it("ends with the way to symptom triage, a touch target of 44 px", () => {
+    const html = card(ROWS);
+    expect(html).toMatch(
+      /<a class="[^"]*min-h-11[^"]*" href="\/trieu-chung">.*Phân loại triệu chứng.*<\/a><\/section>$/,
+    );
+    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
+  });
+
+  it("with nothing to compare: one sentence, no rows, the link stays", () => {
+    const html = card({
+      sub: null,
+      message: "Chưa đủ dữ liệu trước khi ốm để so.",
+      rows: [],
+    });
+    expect(html).toMatch(/<p[^>]*>Chưa đủ dữ liệu trước khi ốm để so\.<\/p>/);
+    expect(html).not.toContain("so với trung bình");
+    expect(html).not.toContain("rounded-full");
+    expect(html).toContain('href="/trieu-chung"');
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 204 passed (206)`, `Tests  3 failed | 1946 passed (1949)`. File test mới không nạp được (chưa có `EpisodeUsual.tsx`); ba test của trang chi tiết đỏ vì chưa có thẻ.

- [x] **Step 3: Viết thẻ và đặt nó lên trang (Patch 4)**

```diff
diff --git a/components/illness/EpisodeScreen.tsx b/components/illness/EpisodeScreen.tsx
index 12166dc..a4d48b7 100644
--- a/components/illness/EpisodeScreen.tsx
+++ b/components/illness/EpisodeScreen.tsx
@@ -23,10 +23,11 @@ import {
   feverChartModel,
 } from "@/lib/rules/illness";
 import { planClose } from "@/lib/rules/illnessForm";
-import { dayRows, verdictView } from "@/lib/rules/illnessView";
+import { dayRows, usualView, verdictView } from "@/lib/rules/illnessView";
 import type { Baby } from "@/lib/supabase/rows";
 import { EpisodeDayList } from "./EpisodeDayList";
 import { EpisodeSheet } from "./EpisodeSheet";
+import { EpisodeUsual } from "./EpisodeUsual";
 import { EpisodeVerdict, type QuickLogType } from "./EpisodeVerdict";
 import { FeverChartCard } from "./FeverChart";

@@ -70,6 +71,7 @@ export function EpisodeBody({
       />
       <FeverChartCard chart={feverChartModel(logs, episode, now)} />
       <EpisodeDayList rows={dayRows(logs, episode, now)} />
+      <EpisodeUsual view={usualView(logs, episode, now)} />
       {episode.ended_at === null && (
         <Button variant="secondary" block busy={closing} onClick={onClose}>
           Bé đã khỏi
diff --git a/components/illness/EpisodeUsual.tsx b/components/illness/EpisodeUsual.tsx
new file mode 100644
index 0000000..502dd56
--- /dev/null
+++ b/components/illness/EpisodeUsual.tsx
@@ -0,0 +1,49 @@
+import Link from "next/link";
+import { Icon } from "@/components/ui/Icon";
+import { StatusChip } from "@/components/ui/StatusChip";
+import type { UsualView } from "@/lib/rules/illnessView";
+
+// Spec 2026-11-26 §5.4 and §6.3 item 5 (board "Đợt ốm · A"): one day of the
+// episode against the baby's usual days. Each chip says it in words, so the
+// rows differ in theme night too. No advice; the card ends with the way to
+// symptom triage.
+export function EpisodeUsual({ view }: { view: UsualView }) {
+  return (
+    <section className="glass flex flex-col gap-1 rounded-[26px] px-4 pt-4 pb-1">
+      <h2 className="text-base leading-[22px] font-bold text-ink">
+        So với thường ngày
+      </h2>
+      {view.sub && (
+        <p className="pb-1.5 text-[13px] leading-[18px] text-muted">
+          {view.sub}
+        </p>
+      )}
+      {view.message && (
+        <p className="pb-2 text-[15px] text-muted">{view.message}</p>
+      )}
+      {view.rows.map((row) => (
+        <div
+          key={row.label}
+          className="flex min-h-[52px] items-center gap-2.5 border-t border-line py-1.5"
+        >
+          <span className="flex min-w-0 flex-1 flex-col">
+            <span className="text-[15px] font-semibold text-ink">
+              {row.label}
+            </span>
+            <span className="text-[13px] leading-[18px] text-muted">
+              {row.line}
+            </span>
+          </span>
+          <StatusChip tone={row.chip.tone}>{row.chip.text}</StatusChip>
+        </div>
+      ))}
+      <Link
+        href="/trieu-chung"
+        className="flex min-h-11 items-center gap-2 border-t border-line text-[15px] font-semibold text-accent-text"
+      >
+        <span className="flex-1">Phân loại triệu chứng</span>
+        <Icon name="chevronRight" size={18} />
+      </Link>
+    </section>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  206 passed (206)`, `Tests  1953 passed (1953)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/illness/EpisodeUsual.tsx components/illness/EpisodeScreen.tsx components/illness/episodeusual.test.tsx components/illness/episodescreen.test.tsx
git commit -m "feat(illness): the card So với thường ngày on the episode page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M4a, checklist, spec, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-illness/page.tsx` (trang tạm, không commit)
- Modify: `docs/device-checklist.md`, `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md`, file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; Bước 38 mục 22–23; một đoạn đọc spec ở §5.4; `main` có M4a.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  206 passed (206)`, `Tests  1953 passed (1953)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages using 9 workers (42/42)` và thoát mã 0.

- [x] **Step 3: Tạo trang fixture tạm**

Dữ liệu thật không có đợt ốm và không được tạo đợt, nên thẻ chỉ thấy đủ ở đây. Trang dùng `EpisodeUsual` và `EpisodeBody` (không hook) với dữ liệu giả, không đọc hay ghi dữ liệu của gia đình, vẽ được khi chưa đăng nhập. Bốn thẻ đứng riêng (đủ ba chip; đợt đã đóng; chưa có ngày trọn; chưa đủ dữ liệu), rồi cả phần thân trang của một đợt đang mở để xem thẻ đứng giữa "Từng ngày" và "Bé đã khỏi". Tạo `app/fixture-illness/page.tsx` (không commit):

```tsx
"use client";

import { EpisodeBody } from "@/components/illness/EpisodeScreen";
import { EpisodeUsual } from "@/components/illness/EpisodeUsual";
import { addDays } from "@/lib/rules/days";
import type { LogLike } from "@/lib/rules/describeLog";
import type { EpisodeLike } from "@/lib/rules/illness";
import { usualView } from "@/lib/rules/illnessView";

// Giờ cố định, để máy chủ và trình duyệt vẽ giống nhau.
const NOW = new Date("2026-11-26T10:00:00+07:00");
const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const pad = (n: number) => String(n).padStart(2, "0");
const OPEN: EpisodeLike = {
  id: "fixture",
  started_at: iso("2026-11-24 23:30"),
  ended_at: null,
};
const CLOSED: EpisodeLike = { ...OPEN, ended_at: iso("2026-11-26 08:00") };
const BASE = Array.from({ length: 7 }, (_, i) => addDays("2026-11-17", i));

// Một ngày: cữ bú cách 2 giờ từ 01:00, tã ướt lúc :30, một giấc từ 08:00.
function day(date: string, feeds: number, wet: number, sleepHours: number) {
  const logs: LogLike[] = [];
  for (let i = 0; i < feeds; i += 1)
    logs.push({
      type: "breast",
      started_at: iso(`${date} ${pad(1 + 2 * i)}:00`),
      ended_at: iso(`${date} ${pad(1 + 2 * i)}:20`),
      details: { side: "left" },
    });
  for (let i = 0; i < wet; i += 1)
    logs.push({
      type: "diaper",
      started_at: iso(`${date} ${pad(i)}:30`),
      ended_at: iso(`${date} ${pad(i)}:30`),
      details: { wet: true, dirty: false },
    });
  if (sleepHours > 0)
    logs.push({
      type: "sleep",
      started_at: iso(`${date} 08:00`),
      ended_at: new Date(
        Date.parse(iso(`${date} 08:00`)) + sleepHours * 3_600_000,
      ).toISOString(),
      details: {},
    });
  return logs;
}
const week = BASE.flatMap((date) => day(date, 8, 6, 12));
const temp = (time: string, celsius: number): LogLike => ({
  type: "temperature",
  started_at: iso(time),
  ended_at: iso(time),
  details: { celsius, method: "nach" },
});

const CASES: { name: string; episode: EpisodeLike; logs: LogLike[] }[] = [
  {
    name: "ít hơn, như thường, nhiều hơn",
    episode: OPEN,
    logs: [...week, ...day("2026-11-25", 6, 5, 15)],
  },
  {
    name: "đợt đã đóng",
    episode: CLOSED,
    logs: [...week, ...day("2026-11-25", 8, 3, 8)],
  },
  {
    name: "chưa có ngày trọn",
    episode: { ...OPEN, started_at: iso("2026-11-26 07:00") },
    logs: week,
  },
  { name: "chưa đủ dữ liệu", episode: OPEN, logs: day("2026-11-25", 6, 5, 9) },
];

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] p-4">
      {CASES.map(({ name, episode, logs }) => (
        <div key={name} data-case={name} className="flex flex-col gap-2">
          <p className="px-1 text-xs text-muted">thẻ · {name}</p>
          <EpisodeUsual view={usualView(logs, episode, NOW)} />
        </div>
      ))}
      <p className="px-1 text-xs text-muted">cả trang · đợt đang mở</p>
      <EpisodeBody
        episode={OPEN}
        logs={[
          ...week,
          ...day("2026-11-25", 6, 5, 15),
          temp("2026-11-25 02:00", 38.6),
          temp("2026-11-26 07:05", 37.4),
        ]}
        babyName="Bun"
        now={NOW}
        closing={false}
        onLog={() => {}}
        onClose={() => {}}
      />
    </main>
  );
}
```

Run: `bun run typecheck`
Expected: `tsc --noEmit` không báo lỗi.

- [x] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở `http://localhost:3000/fixture-illness` trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp.

Trên trang tạm:

1. Thẻ "ít hơn, như thường, nhiều hơn": tiêu đề "So với thường ngày", dòng "Hôm qua, so với trung bình 7 ngày trước khi ốm", ba hàng "Bú" (6 cữ · thường 8 cữ, chip "Ít hơn"), "Tã ướt" (5 lần · thường 6 lần, "Như thường"), "Ngủ" (15 giờ · thường 12 giờ, "Nhiều hơn"), rồi hàng "Phân loại triệu chứng" có mũi tên. Thẻ "đợt đã đóng": dòng đầu "25/11, so với trung bình 7 ngày trước khi ốm"; "Tã ướt" và "Ngủ" là "Ít hơn".
2. Thẻ "chưa có ngày trọn" và "chưa đủ dữ liệu": chỉ một câu ("Chưa có ngày trọn nào của đợt ốm để so.", "Chưa đủ dữ liệu trước khi ốm để so.") và hàng "Phân loại triệu chứng"; không dòng "Hôm qua, …", không chip.
3. Chạy đoạn đo dưới. Khi viết plan, ở 375 px: thẻ có ba hàng 343×293, thẻ một câu 343×127; mỗi hàng 309×54, dòng số 1 dòng; dòng phụ và câu 1 dòng; hàng "Phân loại triệu chứng" 309×44; `overflow` là `true`; `ellipsis` là 0.

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
JSON.stringify({
  w: innerWidth,
  overflow: document.documentElement.scrollWidth <= innerWidth,
  ellipsis: [...document.querySelectorAll("*")].filter(
    (e) => getComputedStyle(e).textOverflow === "ellipsis",
  ).length,
  cards: [...document.querySelectorAll("section.glass")]
    .filter((s) => s.querySelector("h2")?.textContent === "So với thường ngày")
    .map((s) => ({
      card: box(s),
      p: [...s.querySelectorAll("p")].map(
        (p) => `${p.textContent}: ${lines(p)} dòng`,
      ),
      rows: [...s.querySelectorAll("div.border-t")].map(
        (r) =>
          `${r.textContent}: ${box(r)}, ${lines(r.querySelector("span span:last-child"))} dòng`,
      ),
      link: box(s.querySelector("a")),
    })),
});
```

4. Phần "cả trang · đợt đang mở": thứ tự là thẻ kết luận, biểu đồ, "Từng ngày", "So với thường ngày", nút "Bé đã khỏi".
5. Lặp lại mục 1–4 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"` (chạy trong trang; không lưu, không đụng Cài đặt). Ở `night`: ba chip khác nhau ở chữ, đọc được.

Trang thật (dữ liệu thật của gia đình: **chỉ xem**; cần đăng nhập trong khung Browser):

6. `http://localhost:3000/dot-om`: trang mở như trước. Nếu gia đình đã có một đợt ốm (do người dùng tự tạo), bấm vào nó: thẻ "So với thường ngày" nằm dưới "Từng ngày", chữ đúng như mục 1 hoặc 2. Không có đợt nào thì mở `http://localhost:3000/dot-om/chi-tiet?id=khong-co`: "Không tìm thấy đợt ốm này", không có thẻ. Lọc console bằng `onlyErrors`: không có lỗi. `scrollWidth <= innerWidth` là `true`.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo; mục nào thấy trên trang thật, mục nào chỉ thấy trên trang tạm. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

**Kết quả (2026-11-27, phiên thực thi M4a):** khung Browser trong app, server dev chạy bằng `preview_start`; đo bằng đoạn JS trên, thêm màu chữ/nền của từng chip. Theme đổi bằng `dataset.theme` trong trang, giữ bằng `MutationObserver`; không lưu, không đụng Cài đặt. Khung tự bỏ cỡ 375 px một lần giữa chừng; đặt lại và đọc `innerWidth` trước mỗi lần đo.

1. Trang tạm, 375 px: đúng chữ từng thẻ. Thẻ ba chip: "Bú" 6 cữ · thường 8 cữ "Ít hơn", "Tã ướt" 5 lần · thường 6 lần "Như thường", "Ngủ" 15 giờ · thường 12 giờ "Nhiều hơn". Thẻ đợt đã đóng: "25/11, so với trung bình 7 ngày trước khi ốm"; "Bú" "Như thường", "Tã ướt" và "Ngủ" "Ít hơn". Đạt.
2. Hai thẻ một câu: chỉ câu "Chưa có ngày trọn nào của đợt ốm để so." / "Chưa đủ dữ liệu trước khi ốm để so." và hàng "Phân loại triệu chứng"; không dòng phụ, không chip. Đạt.
3. Số đo khớp plan: 375 px thẻ ba hàng 343×293, thẻ một câu 343×127, hàng 309×54 (dòng số 1 dòng), dòng phụ và câu 1 dòng, hàng "Phân loại triệu chứng" 309×44, `overflow` `true`, `ellipsis` 0 — ở cả `rose`, `light`, `dark`, `night`. Thêm 390 px (thẻ 358×293 / 358×127, hàng 324×54, đường dẫn 324×44) và 440 px (408×293 / 408×127, hàng 374×54, đường dẫn 374×44): mọi dòng 1 dòng, `overflow` `true`, `ellipsis` 0, ở cả bốn theme.
4. Phần "cả trang · đợt đang mở": thẻ kết luận ("Bun đã hết sốt 32 giờ"), "Nhiệt độ và thuốc hạ sốt", "Từng ngày", "So với thường ngày", "Bé đã khỏi" — đúng thứ tự. Đạt.
5. `night`: ba chip cùng màu chữ `rgb(217, 137, 92)`, khác nhau ở chữ ("Ít hơn", "Như thường", "Nhiều hơn"), đọc rõ trên ảnh chụp. `rose`, `light`, `dark`: chip "Ít hơn" nền `warn-soft`, "Như thường" nền `good-soft`, "Nhiều hơn" nền trung tính. Đạt.
6. Trang thật (đã đăng nhập sẵn, chỉ xem): `/dot-om` ở 375 px mở như trước, "Chưa có đợt ốm nào" (gia đình chưa có đợt), `scrollWidth <= innerWidth` `true`. `/dot-om/chi-tiet?id=khong-co`: "Không tìm thấy đợt ốm này", không có thẻ "So với thường ngày"; `/rest/v1/logs` 200; console lọc `onlyErrors`: không lỗi. Thẻ trên một đợt thật: **chưa kiểm** (không có đợt; Bước 38 mục 22–23 chờ người dùng). Theme `peach`, `lavender`, `sea`: **chưa kiểm**.

Không lộ lỗi nào; không có bản sửa.

- [x] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-illness
bun run typecheck
git status --short  # không còn app/fixture-illness
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts`: chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [x] **Step 6: Phần M4a của Bước 38 (Patch 5) và một đoạn đọc spec (Patch 6), commit**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index 862b5b8..568a92e 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -646,7 +646,7 @@ Kết quả: Chờ người dùng.

 ## Bước 38 — Đợt ốm (spec 2026-11-26)

-Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết.
+Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó.

 1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
 2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
@@ -669,6 +669,8 @@ Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; ph
 19. Máy B, trang chi tiết, bấm "Bé đã khỏi", rồi về Hôm nay. Kỳ vọng: thẻ đợt ốm biến mất; banner sốt của lần đo 38,5 vẫn còn nhưng **không** có lời mời (lần đo ấy nằm trong đợt vừa đóng). Ở hàng "Ghi nhanh" bấm "Nhiệt độ", nhập 37,2, "Lưu". Kỳ vọng: banner sốt biến mất.
 20. Dọn: Sức khỏe → Đợt ốm, mở đợt thử, bút chì, "Xóa đợt ốm"; vào Nhật ký xóa ba bản ghi thử (38,5, "Ho", 37,2). Lưu ý: lời "Không" của mục 16 còn giữ trên máy A thêm 24 giờ; trong 24 giờ đó, nếu bé sốt thật, máy A không hiện lời mời (máy B vẫn hiện).
 21. Làm sau, khi có một đợt ốm thật đang mở hơn 48 giờ. Kỳ vọng: dưới thẻ đợt ốm có thẻ nhắc với một trong ba tiêu đề: "{tên bé} đã 48 giờ không sốt" (lần đo cuối dưới 38 và đã 48 giờ từ lần sốt cuối), "48 giờ qua chưa đo lại nhiệt độ" (lần đo cuối vẫn từ 38 và đã 48 giờ không đo), hoặc "48 giờ qua không có triệu chứng hay liều hạ sốt nào"; dòng "Đợt ốm bắt đầu … xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa."; hai nút "Bé đã khỏi", "Chưa". Bấm "Chưa". Kỳ vọng: thẻ nhắc biến mất trên máy này trong 24 giờ, máy kia vẫn thấy. Bật Ban đêm: ba dạng thẻ nhắc khác nhau ở icon (dấu tích, đồng hồ, nhiệt kế) chứ không chỉ ở màu.
+22. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết có thẻ "So với thường ngày" ngay dưới mục "Từng ngày"; trong thẻ chỉ có câu "Chưa có ngày trọn nào của đợt ốm để so." và dòng "Phân loại triệu chứng" có mũi tên. Bấm bút chì, đổi "Bắt đầu" thành 08:00 của hôm kia, bấm "Lưu". Kỳ vọng: thẻ có dòng "Hôm qua, so với trung bình 7 ngày trước khi ốm" rồi tới ba hàng "Bú", "Tã ướt", "Ngủ" (hàng nào bảy ngày trước đó không có số thì không có); mỗi hàng có dòng "{số} cữ · thường {số} cữ", "{số} lần · thường {số} lần" hoặc "{số} giờ · thường {số} giờ" và một chip "Ít hơn", "Như thường" hoặc "Nhiều hơn"; không chữ nào bị cắt. Nếu bảy ngày trước hôm kia có ít hơn ba ngày được ghi bú, ngủ hay tã thì thay vào đó là câu "Chưa đủ dữ liệu trước khi ốm để so.". Bấm "Phân loại triệu chứng". Kỳ vọng: trang Phân loại triệu chứng mở ra. Quay lại.
+23. Bật Ban đêm. Kỳ vọng: các chip của thẻ "So với thường ngày" khác nhau ở chữ, đọc rõ. Tắt Ban đêm. Bấm "Bé đã khỏi". Kỳ vọng: dòng đầu của thẻ thành "{ngày hôm qua, dd/mm}, so với trung bình 7 ngày trước khi ốm", các hàng giữ nguyên. Dọn: bấm bút chì, "Xóa đợt ốm".

 Kết quả: Chờ người dùng.

```

```diff
diff --git a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
index 4d80905..e4455d8 100644
--- a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
+++ b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
@@ -221,6 +221,7 @@ Dùng `dailyStats` có sẵn.
 - Ngủ: ≤ 0,75 là "Ít hơn" (`warn`); ≥ 1,25 là "Nhiều hơn" (trung tính); còn lại "Như thường" (`good`).
 - Dòng số: "{giá trị} cữ · thường {nền} cữ", "{giá trị} lần · thường {nền} lần", "{giá trị} giờ · thường {nền} giờ". Nền làm tròn tới số nguyên gần nhất; giờ ngủ làm tròn tới giờ gần nhất.
 - Thẻ không có câu khuyên nào.
+- Ngày `D` được là chính ngày bắt đầu, và khi đó vẫn tính trọn ngày lịch như bảng "Theo ngày" của Báo cáo, kể cả phần trước `started_at`. Một ngày nền được tính khi có ít nhất một bản ghi `breast`, `bottle`, `sleep` hoặc `diaper` bắt đầu trong ngày đó. Cả ba hàng đều ẩn (trung bình nền bằng 0) thì thẻ ghi "Chưa đủ dữ liệu trước khi ốm để so.". Khi thẻ chỉ có một câu ("Chưa có ngày trọn …" hay "Chưa đủ dữ liệu …"), thẻ không có dòng phụ của §6.3 mục 5; đường dẫn "Phân loại triệu chứng" vẫn ở cuối thẻ. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bốn chỗ này. Chọn ở M4a ngày 2026-11-27 theo lời duyệt trước của người dùng.)

 ### 5.5 Lời mời bắt đầu

```

`docs/device-checklist.md` từ trước đã không theo prettier: không chạy `prettier --write` lên nó.

```bash
git add docs/device-checklist.md docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
git commit -m "docs: the M4a part of step 38, and a reading of §5.4 in the spec" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [x] **Step 7: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này là untracked (??), hoặc đã được commit lúc duyệt thì là M; các file plan khác chưa chạy: không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4a.md
git commit -m "docs(plan): the M4a plan and its check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

**Kết quả (2026-11-27, phiên thực thi M4a):** mọi số đo khớp plan, không lệch con nào.

- Step 0: `M3b có trên main`; nền `Test Files  204 passed (204)`, `Tests  1931 passed (1931)`.
- Task 1: đỏ `1 failed | 204 passed (205)`, `17 failed | 1931 passed (1948)` (12 `usualComparison is not a function`, 5 `usualView is not a function`); xanh `205 passed (205)`, `1948 passed (1948)`; `tsc` sạch. Commit `3d331ea`.
- Task 2: đỏ `2 failed | 204 passed (206)`, `3 failed | 1946 passed (1949)` (file `episodeusual.test.tsx` không nạp; ba test của `episodescreen.test.tsx`); xanh `206 passed (206)`, `1953 passed (1953)`; `tsc` sạch. Commit `a72b352`.
- Task 3 Step 1: `tsc` sạch; `206 passed (206)`, `1953 passed (1953)` (chạy lại sau Step 6, vẫn vậy).
- Step 2: build lần 1 thoát 1 (thông báo bảo mật của Next.js 16.4.3), lần 2 thoát 0, `✓ Generating static pages using 9 workers (42/42)`.
- Step 4: xem kết quả ngay dưới Step 4. Không lỗi, không bản sửa.
- Step 5: sau khi xóa trang tạm, `tsc` đỏ giả một lần (`.next/dev/types/validator.ts` còn trỏ tới `app/fixture-illness`); xóa `.next/dev/types` và `.next/types` thì sạch.
- Step 6: Patch 5 và 6 áp sạch. Commit `77e6210`.
- Chưa kiểm: thẻ trên một đợt ốm thật (gia đình chưa có đợt; Bước 38 mục 22–23 chờ người dùng trên iPhone thật), theme `peach`, `lavender`, `sea`, iPhone thật.

- [x] **Step 8: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m4a
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm; nhắc người dùng phần M4a của Bước 38 (mục 22–23) đang chờ họ trên iPhone thật; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
