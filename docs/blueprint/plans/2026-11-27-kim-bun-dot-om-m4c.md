# Kim Bun — Đợt ốm M4c: kỳ "Đợt ốm" của Báo cáo và nút báo cáo Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§9, trừ bảng "Lần khám" của M5; §6.3 mục 7; phần "Báo cáo với kỳ Đợt ốm" của §10.1; phần "Báo cáo kỳ Đợt ốm ở màn hình và ở bản xem trước khi in" của §10.3; phần "in Báo cáo kỳ Đợt ốm" của §10.4)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Trang Báo cáo cho bác sĩ có kỳ thứ ba "Đợt ốm" (mở thẳng bằng `/bao-cao?dot={id}`), với các ngày của đợt, biểu đồ sốt in ra giấy và chỉ các bản ghi thuộc đợt; trang chi tiết của đợt có nút "Báo cáo cho bác sĩ" dẫn tới đó.

**Architecture:**

- **`ReportScreen`** nhận thêm `dot` (mã đợt từ địa chỉ). Kỳ và đợt do `reportSelection` của M4b chọn; ngày, khoảng bản ghi và dòng dưới tên bé do `episodeReport` của M4b tính. Kỳ "Đợt ốm" đọc bản ghi bằng `useRangeLogs` (M2); kỳ 7, 14 ngày đọc như cũ bằng `useStatsLogs`, nay có thêm `enabled` để không tải khi đang ở kỳ "Đợt ốm".
- **Biểu đồ** dùng lại `feverChartModel` và phần vẽ của trang chi tiết: `FeverChartCard` tách ra `FeverChartFigure` (biểu đồ, ghi chú "7 ngày gần nhất", chú thích) để Báo cáo in nó không cần thẻ.
- **Bản in:** khối `@media print` có sẵn của `app/globals.css` đặt năm màu của biểu đồ về giá trị của theme sáng (các giá trị đã có trong `@theme`, không thêm token).
- **Địa chỉ:** `components/report/ReportPage.tsx` đọc `?dot=` trong một `Suspense`, như trang chi tiết đợt ốm, để `/bao-cao` vẫn là trang tĩnh mở được khi mất mạng.
- **Nút** "Báo cáo cho bác sĩ" trong `EpisodeBody`, trên "Bé đã khỏi".
- Không thêm gói, không thêm token màu, không thêm icon, không có migration.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m4c`, cắt từ `main` sau khi M4b đã lên. Baseline: 1969 test (208 file) vitest xanh, typecheck sạch.

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

1. **Mốc M4 được cắt làm ba plan** (xem plan M4a, Diễn giải spec mục 1). Plan này là phần còn lại của §9 (trừ bảng "Lần khám", của M5) và nút §6.3 mục 7.
2. **Lựa chọn "Đợt ốm"** chỉ có khi danh sách đợt ốm đã tải và có ít nhất một đợt (§9). Khi đang tải, khi lỗi hay mất mạng mà không có địa chỉ, trang vẫn là kỳ 7 ngày như trước: danh sách đợt ốm hỏng không được làm hỏng báo cáo 7 ngày.
3. **Mở bằng `?dot=` khi danh sách đợt ốm chưa tải xong:** trang chờ (khung chờ như lúc tải bản ghi; mất mạng: "Cần mạng để tải báo cáo. Trang sẽ tự tải khi có mạng lại."; lỗi: thẻ lỗi "Đợt ốm: …" có nút "Thử lại"), không hiện tạm kỳ 7 ngày rồi nhảy sang đợt ốm. Lúc đó chưa nút nào của "Khoảng thời gian" sáng. Ghi vào spec §9 (Patch 6).
4. **Chọn "Đợt ốm" bằng tay** là đợt đang mở, không có thì đợt có `started_at` muộn nhất, kể cả khi địa chỉ đã chỉ một đợt khác (đúng chữ §9; luật ở M4b). Địa chỉ giữ nguyên `?dot=` khi đổi kỳ; trang không sửa địa chỉ.
5. **Dòng dưới tên bé** thay phần "{n} ngày, từ … đến …" bằng dòng của `episodeReport`; phần " · in ngày {dd/mm/yyyy}" giữ nguyên. Đợt dài hơn 14 ngày: dòng "14 ngày cuối của đợt ốm" là một dòng riêng ngay dưới (spec không nói chỗ đặt). Ghi vào spec §9 (Patch 6).
6. **Bảng "Theo ngày"** dùng mọi bản ghi của các ngày lịch (cả phần trước `started_at` của ngày đầu, §9). **Nhiệt độ, thuốc, triệu chứng** chỉ lấy bản ghi thuộc đợt theo `belongsTo` (§4.3, đợt đang mở có nới 2 phút) và nằm từ 00:00 của ngày đầu tiên được in.
7. **Biểu đồ** là `feverChartModel` của đợt (§6.5: tối đa 7 ngày cuối, kèm "7 ngày gần nhất"), đặt trong mục "Nhiệt độ", giữa tiêu đề và các dòng đo, rộng tối đa 448 px (`max-w-md`), không bị cắt giữa hai trang giấy (`break-inside-avoid`). Không có lần đo nào trong 7 ngày mà biểu đồ vẽ thì không có biểu đồ: kỳ không có lần đo (mục đã ghi "Không đo trong khoảng này."), hay đợt dài hơn 7 ngày mà mọi lần đo nằm trước 7 ngày cuối (các dòng đo vẫn in, không in một khung trống). Kỳ 7 và 14 ngày không có biểu đồ. Ghi vào spec §9 (Patch 6).
8. **Màu trên giấy.** Khối in sẵn có đặt nền trắng, chữ đen, nhưng biểu đồ vẽ bằng năm màu của theme đang dùng: ở `dark` chữ "38" và "Sốt" (`danger-ink` #ffd4cf) gần như mất trên giấy trắng, viền chữ (`glass-solid`) thành mảng tối. Khối in nay đặt `glass-solid`, `danger`, `danger-ink`, `cat-med`, `cat-temp` về đúng giá trị của `@theme` (theme sáng); một test của `lib/ui/tokens.test.ts` giữ chúng khớp. Không thêm token. Chú thích có `print-color-adjust: exact` để ba dấu màu vẫn in khi trình duyệt bỏ nền. Lỗi này lộ ra khi giả lập bản in lúc viết plan. Ghi vào spec §9 (Patch 6).
9. **Nút "Báo cáo cho bác sĩ"** theo bản vẽ "Đợt ốm · A": nút chính (nền `accent`), cả bề ngang, cao 50 px, icon `doc` 20 px, đứng trên "Bé đã khỏi" và cách nó 10 px. Có ở cả đợt đang mở và đợt đã đóng. Nó là một `Link` mang dáng nút (`buttonClass`), như các nút dẫn trang khác của app.
10. **Nút quay lại của Báo cáo** vẫn về "Sức khỏe", kể cả khi mở từ trang chi tiết (spec không nói; nút quay lại của trình duyệt vẫn về trang chi tiết).
11. **`/bao-cao` vẫn là trang tĩnh** (`○` trong `bun run build`); service worker đã có `"/bao-cao"` trong `PAGES` và khớp bỏ qua tham số (`ignoreSearch`), nên `/bao-cao?dot=…` mở được khi mất mạng nếu đã mở một lần.
12. **Trên trang thật không tạo đợt ốm** và không bấm in. Kỳ "Đợt ốm" chỉ thấy đủ trên trang fixture; Bước 38 mục 25–28 để người dùng làm trên iPhone thật.

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
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 6 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `864a3ea` (M3b đã lên; `Test Files  204 passed (204)`, `Tests  1931 passed (1931)`). Lần chạy thử đầu là trên `8f6714e` cộng 16 patch của M3a và M3b trích từ hai file plan đó, trước khi M3b lên `main`; code của `864a3ea` trùng khít nền đó, và mọi số đo đã được đo lại trên `864a3ea`, sau 6 patch của M4a và 6 patch của M4b. Trong bản chạy thử mỗi task code là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Patch 5 (checklist) được sinh trên checklist đã có mục 24 của M4b; Patch 6 (spec) trên spec đã có đoạn §9 của M4b. `bun run build` đã chạy xanh trên bản sao ở trạng thái cuối của plan này (42 trang, `/bao-cao` vẫn `○`).
- **Đã nhìn thử khi viết plan.** Hai trang fixture của Task 3 đã được mở ở 375 px trên bản sao ở trạng thái cuối của plan này: số đo ở các mục của bước trình duyệt là của lần đó (theme `rose`; bản in giả lập ở `night` và `dark`). Lần giả lập bản in ở `dark` lộ ra việc chữ "38" và "Sốt" gần như mất trên giấy (Diễn giải spec mục 8; đã sửa trong Patch 1 và 2). Chưa xem: bề ngang 390 và 440, các theme `light`, `peach`, `lavender`, `sea`, bản xem trước khi in thật của trình duyệt, mọi trang thật.
- **Trang fixture của Báo cáo** vẽ `ReportScreen` thật trong một `QueryClient` riêng có sẵn dữ liệu giả, nên không đọc dữ liệu của gia đình. Riêng `useEpisodes` tự tải lại mỗi 60 giây, và `useGrowth`, `useVaccineDoses` tự đặt `staleTime` 60 giây (tải lại khi khung được bấm vào lại sau một phút): console có thể có lỗi 400 của `illness_episodes`, `growth` hay `vaccine_doses` (mã bé giả `fixture-baby` không phải uuid); trang giữ dữ liệu giả, bỏ qua các lỗi đó. Không có lệnh ghi nào.
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

Plan này đứng sau M4b và là plan cuối của mốc M4. M5 (lần khám) thêm bảng "Lần khám" vào kỳ "Đợt ốm" mà plan này làm, và thêm mốc "Khám" vào biểu đồ.

**Consumes (M4b):** `reportSelection`, `episodeReport`, `type ReportPeriod`, `symptomRows` (`lib/rules/report.ts`); `components/report/reportscreen.test.tsx` với các mock của nó; Bước 38 mục 22–24; các đoạn §5.4 và §9 của spec.

**Consumes (M4a):** `EpisodeBody` có thẻ `EpisodeUsual` (`components/illness/EpisodeScreen.tsx`); `components/illness/episodescreen.test.tsx` có thứ tự các khối tới "So với thường ngày".

**Consumes (M2):** `useEpisodes` (`lib/data/illness.ts`); `useRangeLogs(babyId, from, to, enabled)` (`lib/data/logs.ts`); `belongsTo`, `feverChartModel` (`lib/rules/illness.ts`); `FeverChart`, `FeverChartCard` (`components/illness/FeverChart.tsx`).

**Consumes (đã ở `main` từ trước):** `ReportScreen`, `useStatsLogs`, `Segmented`, `type ChoiceOption`, `buttonClass`, `Icon` (icon `doc`), `AuthGate`, `GateLoading`, khối `@media print` của `app/globals.css`, `THEMES` (`lib/ui/tokens.ts`).

**Produces:**

- `components/report/ReportScreen.tsx`: `ReportScreen(props: { baby: Baby; dot?: string | null })`.
- `components/report/ReportPage.tsx`: `ReportPage()` (đọc `?dot=` trong `Suspense`, rồi `AuthGate`); `app/bao-cao/page.tsx` vẽ nó.
- `components/illness/FeverChart.tsx`: `FeverChartFigure(props: { chart: FeverChart })`.
- `lib/data/logs.ts`: `useStatsLogs(babyId: string, since: string, enabled = true)`.
- `app/globals.css`: khối in đặt `--color-glass-solid`, `--color-danger`, `--color-danger-ink`, `--color-cat-med`, `--color-cat-temp` về giá trị của theme sáng.
- `EpisodeBody`: nút "Báo cáo cho bác sĩ" dẫn tới `/bao-cao?dot={id}`.
- `docs/device-checklist.md`: Bước 38 có mục 25–28.
- **Vitest sau M4c (hết M4):** 1981 test, 208 file.

---

### Task 1: Kỳ "Đợt ốm" trên trang Báo cáo (§9)

**Files:**

- Create: `components/report/ReportPage.tsx`
- Modify: `app/bao-cao/page.tsx` (vẽ `ReportPage`)
- Modify: `components/report/ReportScreen.tsx` (kỳ "Đợt ốm")
- Modify: `components/illness/FeverChart.tsx` (tách `FeverChartFigure` khỏi `FeverChartCard`, không đổi gì trên trang chi tiết)
- Modify: `lib/data/logs.ts` (`useStatsLogs` thêm `enabled`)
- Modify: `app/globals.css` (năm màu của biểu đồ trong khối in)
- Test: `components/report/reportscreen.test.tsx` (sửa), `lib/ui/tokens.test.ts` (thêm một test)

**Interfaces:**

- Consumes: `reportSelection`, `episodeReport`, `type ReportPeriod` (M4b); `useEpisodes`, `useRangeLogs`, `belongsTo`, `feverChartModel` (M2); `useSearchParams` của `next/navigation`.
- Produces: `ReportScreen({ baby, dot })`, `ReportPage()`, `FeverChartFigure({ chart })`, `useStatsLogs(babyId, since, enabled)`. Chữ đúng của spec §9: lựa chọn "Đợt ốm"; "14 ngày cuối của đợt ốm".

Trước khi viết, đọc `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` (AGENTS.md): một trang được dựng tĩnh mà gọi `useSearchParams` phải bọc phần gọi nó trong `Suspense`, không thì `next build` hỏng ("Missing Suspense boundary with useSearchParams"). `ReportPage` làm đúng như `EpisodeDetailPage` (`components/illness/EpisodeDetailPage.tsx`).

- [ ] **Step 0: Kiểm M4b đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f components/report/reportscreen.test.tsx && grep -q "export function reportSelection" lib/rules/report.ts && echo "M4b có trên main"
git checkout -b feat/kim-bun-dot-om-m4c
bunx vitest run
```

Expected: dòng `M4b có trên main`; `Test Files  208 passed (208)`, `Tests  1969 passed (1969)`. Không thấy dòng đó thì dừng: M4b chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [ ] **Step 1: Viết test đỏ (Patch 1)**

`render` của file test nay nhận `dot`, `range` và `episodes`; hai mock mới (`next/navigation`, `AuthGate`) để vẽ `ReportPage`. Test của bản in nằm ở `lib/ui/tokens.test.ts`, cạnh các test so `globals.css` với `lib/ui/tokens.ts`.

```diff
diff --git a/components/report/reportscreen.test.tsx b/components/report/reportscreen.test.tsx
index 7663f96..3a539b3 100644
--- a/components/report/reportscreen.test.tsx
+++ b/components/report/reportscreen.test.tsx
@@ -1,6 +1,7 @@
 import { renderToStaticMarkup } from "react-dom/server";
 import { beforeEach, describe, expect, it, vi } from "vitest";
-import type { Baby, LogRow } from "@/lib/supabase/rows";
+import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";
+import { ReportPage } from "./ReportPage";
 import { ReportScreen } from "./ReportScreen";
 
 const NOW = new Date("2026-11-26T10:00:00+07:00");
@@ -10,6 +11,7 @@ const state = vi.hoisted(() => ({
   stats: {} as Record<string, unknown>,
   range: {} as Record<string, unknown>,
   episodes: {} as Record<string, unknown>,
+  search: "",
 }));
 
 vi.mock("@/lib/data/logs", () => ({ useStatsLogs, useRangeLogs }));
@@ -20,6 +22,20 @@ vi.mock("@/lib/data/growth", () => ({
 }));
 vi.mock("@/lib/data/vaccines", () => ({ useVaccineDoses: () => loaded([]) }));
 vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
+vi.mock("next/navigation", () => ({
+  useSearchParams: () => new URLSearchParams(state.search),
+}));
+// The gate is stood in for: it hands the page a signed-in member with a baby.
+vi.mock("@/components/AuthGate", () => ({
+  GateLoading: () => <div data-gate-loading />,
+  AuthGate: ({
+    need,
+    children,
+  }: {
+    need: string;
+    children: (gate: unknown) => unknown;
+  }) => <div data-need={need}>{children({ ctx: { baby } }) as never}</div>,
+}));
 
 const LOADING = {
   data: undefined,
@@ -32,6 +48,14 @@ const LOADING = {
 function loaded(data: unknown) {
   return { ...LOADING, data, isPending: false, fetchStatus: "idle" };
 }
+const OFFLINE = { ...LOADING, fetchStatus: "paused" };
+const FAILED = {
+  ...LOADING,
+  isPending: false,
+  isError: true,
+  error: new Error("boom"),
+  fetchStatus: "idle",
+};
 
 const iso = (text: string) =>
   new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
@@ -58,10 +82,45 @@ const SYMPTOMS = [
   log("symptom", "2026-11-21 21:15", { codes: ["fever"], note: "quấy cả tối" }),
 ];
 
-function render(input: { stats?: unknown[] } = {}) {
+const episode = (
+  id: string,
+  start: string,
+  end: string | null,
+): EpisodeRow => ({
+  id,
+  baby_id: "b1",
+  started_at: iso(start),
+  ended_at: end === null ? null : iso(end),
+  created_by: "u1",
+  created_at: iso(start),
+  updated_at: iso(start),
+});
+const OPEN = episode("open", "2026-11-24 23:30", null);
+const PAST = episode("past", "2026-10-10 08:00", "2026-10-12 09:00");
+
+function render(
+  input: {
+    stats?: unknown[];
+    range?: Record<string, unknown>;
+    episodes?: Record<string, unknown>;
+    dot?: string | null;
+  } = {},
+) {
   state.stats = loaded(input.stats ?? []);
-  return renderToStaticMarkup(<ReportScreen baby={baby} />);
+  if (input.range) state.range = input.range;
+  if (input.episodes) state.episodes = input.episodes;
+  return renderToStaticMarkup(
+    <ReportScreen baby={baby} dot={input.dot ?? null} />,
+  );
 }
+const pressed = (html: string) =>
+  [...html.matchAll(/aria-pressed="true"[^>]*>([^<]*)<\/button>/g)].map(
+    (match) => match[1],
+  );
+const choices = (html: string) =>
+  [
+    ...html.matchAll(/aria-pressed="(?:true|false)"[^>]*>([^<]*)<\/button>/g),
+  ].map((match) => match[1]);
 
 beforeEach(() => {
   useStatsLogs.mockReset();
@@ -70,6 +129,7 @@ beforeEach(() => {
   useRangeLogs.mockImplementation(() => state.range);
   state.range = LOADING;
   state.episodes = loaded([]);
+  state.search = "";
 });
 
 // Spec 2026-11-26 §9: "Triệu chứng", for every period.
@@ -114,3 +174,190 @@ describe("ReportScreen: symptoms", () => {
     expect(html).not.toContain(">Triệu chứng</h3>");
   });
 });
+
+// Spec 2026-11-26 §9: the period "Đợt ốm".
+describe("ReportScreen: the episode period", () => {
+  const EPISODE_LOGS = [
+    // On the first day, before the episode began: a feed counts for the day,
+    // the reading does not belong to the episode.
+    log("breast", "2026-11-24 20:00", { side: "left" }),
+    log("temperature", "2026-11-24 20:00", { celsius: 37.9, method: "nach" }),
+    log("symptom", "2026-11-24 20:05", { codes: ["vomit"] }),
+    log("temperature", "2026-11-24 23:40", { celsius: 38.4, method: "nach" }),
+    log("temperature", "2026-11-25 15:00", { celsius: 39.2, method: "nach" }),
+    log("medicine", "2026-11-25 15:10", {
+      name: "Hapacol",
+      amount: 2.5,
+      unit: "ml",
+      antipyretic: true,
+    }),
+    log("symptom", "2026-11-25 08:00", { codes: ["cough"] }),
+  ];
+
+  it("7 and 14 days only, while the baby has no episode or they load", () => {
+    expect(choices(render())).toEqual(["7 ngày", "14 ngày"]);
+    expect(choices(render({ episodes: LOADING }))).toEqual([
+      "7 ngày",
+      "14 ngày",
+    ]);
+  });
+
+  it("a third choice Đợt ốm once the baby has one; 7 days stay the default", () => {
+    const html = render({ episodes: loaded([OPEN, PAST]) });
+    expect(choices(html)).toEqual(["7 ngày", "14 ngày", "Đợt ốm"]);
+    expect(pressed(html)).toEqual(["7 ngày"]);
+    expect(html).toContain("7 ngày, từ 20/11 đến 26/11 · in ngày 26/11/2026");
+    // The 7 days read their logs as before; the episode's are not asked for.
+    expect(useStatsLogs).toHaveBeenLastCalledWith(
+      "b1",
+      iso("2026-11-19 00:00"),
+      true,
+    );
+    expect(useRangeLogs).toHaveBeenLastCalledWith("b1", "", null, false);
+  });
+
+  it("/bao-cao?dot={id}: that episode, its days, its line", () => {
+    const html = render({
+      episodes: loaded([OPEN, PAST]),
+      range: loaded([]),
+      dot: "past",
+    });
+    expect(pressed(html)).toEqual(["Đợt ốm"]);
+    expect(html).toContain(
+      ">Đợt ốm 10/10 – 12/10 · 3 ngày · in ngày 26/11/2026</p>",
+    );
+    expect(useRangeLogs).toHaveBeenLastCalledWith(
+      "b1",
+      iso("2026-10-09 00:00"),
+      iso("2026-10-13 00:00"),
+      true,
+    );
+    expect(useStatsLogs.mock.lastCall?.[2]).toBe(false);
+    const days = [
+      ...html.matchAll(
+        /<tr class="break-inside-avoid"><td[^>]*>(\d\d\/\d\d)<\/td>/g,
+      ),
+    ].map((match) => match[1]);
+    expect(days).toEqual(["10/10", "11/10", "12/10"]);
+    expect(html).not.toContain("14 ngày cuối của đợt ốm");
+  });
+
+  it("an open episode: whole days in the daily table, only the episode's logs in the others", () => {
+    const html = render({
+      episodes: loaded([OPEN, PAST]),
+      range: loaded(EPISODE_LOGS),
+      dot: "open",
+    });
+    expect(html).toContain(
+      ">Đợt ốm từ 24/11 · ngày thứ 3 · in ngày 26/11/2026</p>",
+    );
+    expect(useRangeLogs).toHaveBeenLastCalledWith(
+      "b1",
+      iso("2026-11-23 00:00"),
+      null,
+      true,
+    );
+    // The feed before the start still counts for 24/11.
+    expect(html).toMatch(
+      /<td[^>]*>24\/11<\/td><td[^>]*>0<\/td><td[^>]*>1<\/td>/,
+    );
+    expect(html).not.toContain("37,9°C");
+    expect(html).toContain("24/11 23:40: 38,4°C (nách)");
+    expect(html).toContain("25/11 15:10: Hapacol (hạ sốt) — 2,5 ml");
+    expect(html).toContain(">Ho</td>");
+    expect(html).not.toContain(">Nôn</td>");
+  });
+
+  it("the fever chart stands before the readings and is printed", () => {
+    const html = render({
+      episodes: loaded([OPEN]),
+      range: loaded(EPISODE_LOGS),
+      dot: "open",
+    });
+    const chart = html.indexOf(
+      'aria-label="Biểu đồ nhiệt độ: 2 lần đo, cao nhất 39,2°C, 1 liều hạ sốt."',
+    );
+    expect(chart).toBeGreaterThan(html.indexOf(">Nhiệt độ</h3>"));
+    expect(chart).toBeLessThan(html.indexOf("24/11 23:40: 38,4°C"));
+    expect(html).toContain("Từ 38°C là sốt");
+    expect(html).toContain("[print-color-adjust:exact]");
+    expect(html.slice(html.indexOf(">Nhiệt độ</h3>") - 400)).not.toMatch(
+      /print:hidden[^>]*>[^<]*<svg/,
+    );
+  });
+
+  it("no chart for 7 or 14 days, nor without a reading in the 7 days it draws", () => {
+    const temperature = log("temperature", "2026-11-25 15:00", {
+      celsius: 39.2,
+      method: "nach",
+    });
+    expect(render({ stats: [temperature] })).not.toContain("Biểu đồ nhiệt độ");
+    expect(
+      render({ episodes: loaded([PAST]), range: loaded([]), dot: "past" }),
+    ).not.toContain("Biểu đồ nhiệt độ");
+    // A long episode whose readings all come before its last 7 days: the
+    // readings are listed, and no empty chart frame is printed.
+    const long = episode("long", "2026-10-01 08:00", "2026-10-20 09:00");
+    const early = log("temperature", "2026-10-08 09:00", {
+      celsius: 38.6,
+      method: "nach",
+    });
+    const html = render({
+      episodes: loaded([long]),
+      range: loaded([early]),
+      dot: "long",
+    });
+    expect(html).toContain("08/10 09:00: 38,6°C (nách)");
+    expect(html).not.toContain("Biểu đồ nhiệt độ");
+  });
+
+  it("longer than 14 days: the last 14, and it says so", () => {
+    const long = episode("long", "2026-10-01 08:00", "2026-10-20 09:00");
+    const html = render({
+      episodes: loaded([long]),
+      range: loaded([]),
+      dot: "long",
+    });
+    expect(html).toContain(
+      ">Đợt ốm 01/10 – 20/10 · 20 ngày · in ngày 26/11/2026</p>",
+    );
+    expect(html).toContain(">14 ngày cuối của đợt ốm</p>");
+  });
+
+  it("an id the baby's episodes do not hold: the 7 days", () => {
+    const html = render({ episodes: loaded([OPEN]), dot: "gone" });
+    expect(pressed(html)).toEqual(["7 ngày"]);
+    expect(html).toContain("7 ngày, từ 20/11 đến 26/11");
+  });
+
+  it("while the episodes load, the address waits: placeholders, not the 7 days", () => {
+    const html = render({ episodes: LOADING, dot: "past" });
+    expect(html).toContain("kb-pulse");
+    expect(html).not.toContain("7 ngày, từ");
+    expect(pressed(html)).toEqual([]);
+    expect(useStatsLogs.mock.lastCall?.[2]).toBe(false);
+    expect(render({ episodes: OFFLINE, dot: "past" })).toContain(
+      "Cần mạng để tải báo cáo. Trang sẽ tự tải khi có mạng lại.",
+    );
+    const failed = render({ episodes: FAILED, dot: "past" });
+    expect(failed).toContain("Đợt ốm: Có lỗi xảy ra: boom");
+    expect(failed).toContain(">Thử lại</button>");
+  });
+});
+
+// Spec §9: /bao-cao?dot={id}.
+describe("ReportPage", () => {
+  it("hands the dot of the address to the report behind the gate", () => {
+    state.stats = loaded([]);
+    state.range = loaded([]);
+    state.episodes = loaded([OPEN, PAST]);
+    state.search = "dot=past";
+    const html = renderToStaticMarkup(<ReportPage />);
+    expect(html).toContain('data-need="baby"');
+    expect(html).toContain("Đợt ốm 10/10 – 12/10 · 3 ngày");
+    state.search = "";
+    expect(renderToStaticMarkup(<ReportPage />)).toContain(
+      "7 ngày, từ 20/11 đến 26/11",
+    );
+  });
+});
diff --git a/lib/ui/tokens.test.ts b/lib/ui/tokens.test.ts
index 1207530..5bf2f6a 100644
--- a/lib/ui/tokens.test.ts
+++ b/lib/ui/tokens.test.ts
@@ -37,6 +37,31 @@ describe("globals.css matches lib/ui/tokens.ts", () => {
     },
   );
 
+  // Spec 2026-11-26 §9: the fever chart is printed with the doctor report,
+  // black on white whatever the theme; its marks keep the light theme's
+  // colours, so a dark theme does not print pale lines and dark halos.
+  it("on paper the chart's colours are the light theme's", () => {
+    const print = css.slice(css.indexOf("@media print {"));
+    const start = print.indexOf(":root[data-theme] {");
+    const vars = Object.fromEntries(
+      [
+        ...print
+          .slice(start, print.indexOf("}", start))
+          .matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;]+);/g),
+      ].map((m) => [m[1], m[2].trim().toUpperCase()]),
+    );
+    for (const token of [
+      "glass-solid",
+      "danger",
+      "danger-ink",
+      "cat-med",
+      "cat-temp",
+    ] as const)
+      expect(vars[token], `--color-${token}`).toBe(
+        THEMES.light[token].toUpperCase(),
+      );
+  });
+
   it("the legacy tokens are gone", () => {
     for (const name of LEGACY)
       expect(css, `--color-${name}`).not.toMatch(
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 206 passed (208)`, `Tests  1 failed | 1966 passed (1967)`. `reportscreen.test.tsx` không nạp được (chưa có `ReportPage.tsx`), nên ba test của M4b trong file đó tạm không được đếm; test mới của `tokens.test.ts` đỏ vì khối in chưa có năm màu.

- [ ] **Step 3: Viết kỳ "Đợt ốm" (Patch 2)**

```diff
diff --git a/app/bao-cao/page.tsx b/app/bao-cao/page.tsx
index 8f17f2c..74f2ff0 100644
--- a/app/bao-cao/page.tsx
+++ b/app/bao-cao/page.tsx
@@ -1,12 +1,7 @@
 "use client";
 
-import { AuthGate } from "@/components/AuthGate";
-import { ReportScreen } from "@/components/report/ReportScreen";
+import { ReportPage } from "@/components/report/ReportPage";
 
 export default function Page() {
-  return (
-    <AuthGate need="baby">
-      {({ ctx }) => (ctx?.baby ? <ReportScreen baby={ctx.baby} /> : null)}
-    </AuthGate>
-  );
+  return <ReportPage />;
 }
diff --git a/app/globals.css b/app/globals.css
index e2a6b24..d86f3b0 100644
--- a/app/globals.css
+++ b/app/globals.css
@@ -443,6 +443,12 @@ dialog[data-closing] > .glass-strong {
     --color-bg: #ffffff;
     --color-ink: #000000;
     --color-muted: #444444;
+    /* Spec 2026-11-26 §9: the fever chart prints in the light theme's colours. */
+    --color-glass-solid: #ffffff;
+    --color-danger: #c4142b;
+    --color-danger-ink: #8a0f1f;
+    --color-cat-med: #c0392b;
+    --color-cat-temp: #1b6f87;
   }
   body {
     background: #ffffff;
diff --git a/components/illness/FeverChart.tsx b/components/illness/FeverChart.tsx
index f85d00f..c21bedd 100644
--- a/components/illness/FeverChart.tsx
+++ b/components/illness/FeverChart.tsx
@@ -197,8 +197,35 @@ export function FeverChart({ chart }: { chart: FeverChartModel }) {
 
 const LEGEND = "flex items-center gap-1.5";
 
-// The card around the chart: its title, what the marks mean, and the two
-// notes of spec §6.5.
+// The chart with the note of spec §6.5 and what the marks mean, without a
+// card: the episode's page puts it in one, the doctor report prints it bare.
+export function FeverChartFigure({ chart }: { chart: FeverChartModel }) {
+  return (
+    <>
+      <FeverChart chart={chart} />
+      {chart.truncated && (
+        <p className="px-1 text-xs text-muted">7 ngày gần nhất</p>
+      )}
+      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1 text-xs text-muted">
+        <span className={LEGEND}>
+          <span className="size-2.5 rounded-full bg-cat-temp" />
+          Nhiệt độ
+        </span>
+        <span className={LEGEND}>
+          <span className="size-[9px] rotate-45 bg-cat-med" />
+          Liều hạ sốt
+        </span>
+        <span className={LEGEND}>
+          <span className="w-3.5 border-t-2 border-dashed border-danger" />
+          Từ 38°C là sốt
+        </span>
+      </div>
+    </>
+  );
+}
+
+// The card around the chart: its title, the chart, or the one sentence of
+// spec §6.5 when the episode has no reading.
 export function FeverChartCard({ chart }: { chart: FeverChartModel | null }) {
   return (
     <Glass className="flex flex-col gap-2.5 p-3">
@@ -206,26 +233,7 @@ export function FeverChartCard({ chart }: { chart: FeverChartModel | null }) {
         Nhiệt độ và thuốc hạ sốt
       </h2>
       {chart ? (
-        <>
-          <FeverChart chart={chart} />
-          {chart.truncated && (
-            <p className="px-1 text-xs text-muted">7 ngày gần nhất</p>
-          )}
-          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1 text-xs text-muted">
-            <span className={LEGEND}>
-              <span className="size-2.5 rounded-full bg-cat-temp" />
-              Nhiệt độ
-            </span>
-            <span className={LEGEND}>
-              <span className="size-[9px] rotate-45 bg-cat-med" />
-              Liều hạ sốt
-            </span>
-            <span className={LEGEND}>
-              <span className="w-3.5 border-t-2 border-dashed border-danger" />
-              Từ 38°C là sốt
-            </span>
-          </div>
-        </>
+        <FeverChartFigure chart={chart} />
       ) : (
         <p className="px-1 text-[15px] text-muted">
           Chưa có lần đo nào trong đợt này.
diff --git a/components/report/ReportPage.tsx b/components/report/ReportPage.tsx
new file mode 100644
index 0000000..3b178c9
--- /dev/null
+++ b/components/report/ReportPage.tsx
@@ -0,0 +1,32 @@
+"use client";
+
+import { useSearchParams } from "next/navigation";
+import { Suspense } from "react";
+import { AuthGate, GateLoading } from "@/components/AuthGate";
+import { ReportScreen } from "./ReportScreen";
+
+function Report() {
+  const dot = useSearchParams().get("dot");
+  return (
+    <AuthGate need="baby">
+      {({ ctx }) =>
+        ctx?.baby ? <ReportScreen baby={ctx.baby} dot={dot} /> : null
+      }
+    </AuthGate>
+  );
+}
+
+// Spec 2026-11-26 §9: /bao-cao?dot={id} opens the report on that episode.
+// The id is a query parameter so the page stays one static shell that also
+// opens offline. Reading the address in a prerendered page needs a Suspense
+// boundary
+// (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md):
+// the static HTML holds the fallback, and the page itself renders in the
+// browser.
+export function ReportPage() {
+  return (
+    <Suspense fallback={<GateLoading />}>
+      <Report />
+    </Suspense>
+  );
+}
diff --git a/components/report/ReportScreen.tsx b/components/report/ReportScreen.tsx
index 2786abb..e5c7ca7 100644
--- a/components/report/ReportScreen.tsx
+++ b/components/report/ReportScreen.tsx
@@ -1,18 +1,20 @@
 "use client";
 
 import { useState } from "react";
+import { FeverChartFigure } from "@/components/illness/FeverChart";
 import { Button } from "@/components/ui/Button";
 import { ErrorCard } from "@/components/ui/ErrorCard";
 import { Icon } from "@/components/ui/Icon";
 import { PageHeader } from "@/components/ui/PageHeader";
-import { Segmented } from "@/components/ui/Segmented";
+import { type ChoiceOption, Segmented } from "@/components/ui/Segmented";
 import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
 import { Skeleton } from "@/components/ui/Skeleton";
 import { VACCINES } from "@/lib/content/vaccines";
 import { whoSex, type LmsRow } from "@/lib/content/who";
 import { toVietnameseError } from "@/lib/data/errors";
 import { useGrowth, useWhoTable } from "@/lib/data/growth";
-import { useStatsLogs } from "@/lib/data/logs";
+import { useEpisodes } from "@/lib/data/illness";
+import { useRangeLogs, useStatsLogs } from "@/lib/data/logs";
 import { useNow } from "@/lib/hooks/useNow";
 import { useVaccineDoses } from "@/lib/data/vaccines";
 import {
@@ -21,10 +23,14 @@ import {
   statsFetchSince,
 } from "@/lib/rules/dailyStats";
 import { formatDayShort, vnDayRange, vnDayStartMs } from "@/lib/rules/days";
+import { belongsTo, feverChartModel } from "@/lib/rules/illness";
 import {
+  episodeReport,
   growthSummary,
   medicineRows,
   REPORT_DAYS,
+  type ReportPeriod,
+  reportSelection,
   symptomRows,
   temperatureRows,
   vaccineSummary,
@@ -36,17 +42,48 @@ import type { Baby } from "@/lib/supabase/rows";
 
 const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
 const dmy = (day: string) => day.split("-").reverse().join("/");
-const RANGES = REPORT_DAYS.map((n) => ({
-  value: String(n),
+const RANGES: ChoiceOption<ReportPeriod>[] = REPORT_DAYS.map((n) => ({
+  value: n === 7 ? "7" : "14",
   label: `${n} ngày`,
 }));
+// Spec 2026-11-26 §9: the third choice, once the baby has an episode.
+const EPISODE: ChoiceOption<ReportPeriod> = { value: "dot", label: "Đợt ốm" };
 
-export function ReportScreen({ baby }: { baby: Baby }) {
-  const [range, setRange] = useState<(typeof REPORT_DAYS)[number]>(7);
+// `dot` is the episode named by the address (/bao-cao?dot={id}), or null.
+export function ReportScreen({
+  baby,
+  dot = null,
+}: {
+  baby: Baby;
+  dot?: string | null;
+}) {
+  const [picked, setPicked] = useState<ReportPeriod | null>(null);
   const now = useNow(60_000);
-  const days = vnDayRange(now, range);
+  const episodes = useEpisodes(baby.id);
+  // null while the address names an episode and the list is still loading:
+  // nothing is shown yet rather than 7 days that then jump.
+  const selection = reportSelection({
+    picked,
+    address: dot,
+    episodes: episodes.data,
+  });
+  const episode = selection?.episode ?? null;
+  const report = episode ? episodeReport(episode, now) : null;
+  const range = selection?.period === "14" ? 14 : 7;
+  const days = report ? report.days : vnDayRange(now, range);
   const fromMs = vnDayStartMs(days[0]);
-  const logs = useStatsLogs(baby.id, statsFetchSince(days));
+  const statsLogs = useStatsLogs(
+    baby.id,
+    statsFetchSince(days),
+    selection !== null && report === null,
+  );
+  const rangeLogs = useRangeLogs(
+    baby.id,
+    report?.from ?? "",
+    report?.to ?? null,
+    report !== null,
+  );
+  const logs = report ? rangeLogs : statsLogs;
   const growth = useGrowth(baby.id);
   const doses = useVaccineDoses(baby.id);
   const sex = whoSex(baby.sex);
@@ -55,10 +92,16 @@ export function ReportScreen({ baby }: { baby: Baby }) {
   const hcfa = useWhoTable("hcfa", sex);
 
   const rows = logs.data ?? [];
+  // The daily table counts whole calendar days; the readings, the medicines
+  // and the symptoms of an episode are only the logs that belong to it.
+  const own = episode
+    ? rows.filter((log) => belongsTo(episode, log.started_at, now))
+    : rows;
   const stats = dailyStats(rows, days, now);
-  const temperatures = temperatureRows(rows, fromMs);
-  const medicines = medicineRows(rows, fromMs);
-  const symptoms = symptomRows(rows, fromMs);
+  const temperatures = temperatureRows(own, fromMs);
+  const medicines = medicineRows(own, fromMs);
+  const symptoms = symptomRows(own, fromMs);
+  const chart = episode ? feverChartModel(rows, episode, now) : null;
   const measures = growthSummary(
     growth.data ?? [],
     {
@@ -80,8 +123,9 @@ export function ReportScreen({ baby }: { baby: Baby }) {
   const cell = "border border-line px-2 py-1 print:border-ink";
   // A report for a doctor must never print "nothing recorded" while data is
   // still loading or failed to load (offline without a cache).
-  const ready = Boolean(logs.data && growth.data && doses.data);
+  const ready = Boolean(selection && logs.data && growth.data && doses.data);
   const failures = [
+    ...(selection ? [] : [{ label: "Đợt ốm", query: episodes }]),
     { label: "Nhật ký", query: logs },
     { label: "Tăng trưởng", query: growth },
     { label: "Tiêm chủng", query: doses },
@@ -96,11 +140,13 @@ export function ReportScreen({ baby }: { baby: Baby }) {
         />
         <Segmented
           label="Khoảng thời gian"
-          options={RANGES}
-          value={String(range)}
-          onChange={(value) =>
-            setRange(Number(value) as (typeof REPORT_DAYS)[number])
+          options={
+            episodes.data && episodes.data.length > 0
+              ? [...RANGES, EPISODE]
+              : RANGES
           }
+          value={selection?.period ?? "dot"}
+          onChange={setPicked}
         />
         <Button block disabled={!ready} onClick={() => window.print()}>
           <Icon name="doc" size={18} />
@@ -115,7 +161,9 @@ export function ReportScreen({ baby }: { baby: Baby }) {
         ))}
         {!ready &&
           failures.length === 0 &&
-          ([logs, growth, doses].some(waitingForNetwork) ? (
+          ([selection ? logs : episodes, growth, doses].some(
+            waitingForNetwork,
+          ) ? (
             <NeedsNetwork what="báo cáo" />
           ) : (
             <div className="flex flex-col gap-2.5">
@@ -142,10 +190,14 @@ export function ReportScreen({ baby }: { baby: Baby }) {
               {baby.allergies ? ` · Dị ứng: ${baby.allergies}` : ""}
             </p>
             <p className="text-muted">
-              {range} ngày, từ {formatDayShort(days[0])} đến{" "}
-              {formatDayShort(days[days.length - 1])} · in ngày{" "}
-              {dmy(vnDateString(now))}
+              {report
+                ? report.line
+                : `${range} ngày, từ ${formatDayShort(days[0])} đến ${formatDayShort(days[days.length - 1])}`}{" "}
+              · in ngày {dmy(vnDateString(now))}
             </p>
+            {report?.truncated && (
+              <p className="text-muted">14 ngày cuối của đợt ốm</p>
+            )}
           </section>
 
           <section>
@@ -180,6 +232,13 @@ export function ReportScreen({ baby }: { baby: Baby }) {
 
           <section>
             <h3 className="font-semibold">Nhiệt độ</h3>
+            {/* Spec 2026-11-26 §9: the episode's chart, on paper too; not
+                an empty frame when its last 7 days have no reading. */}
+            {chart && chart.points.length > 0 && (
+              <div className="flex max-w-md flex-col gap-2.5 py-2 break-inside-avoid [print-color-adjust:exact]">
+                <FeverChartFigure chart={chart} />
+              </div>
+            )}
             {temperatures.length === 0 ? (
               <p className="text-muted">Không đo trong khoảng này.</p>
             ) : (
diff --git a/lib/data/logs.ts b/lib/data/logs.ts
index 0f53f68..034d2d6 100644
--- a/lib/data/logs.ts
+++ b/lib/data/logs.ts
@@ -204,10 +204,11 @@ export function useHistoryLogs(babyId: string, dob: string) {
   });
 }
 
-export function useStatsLogs(babyId: string, since: string) {
+export function useStatsLogs(babyId: string, since: string, enabled = true) {
   return useQuery({
     queryKey: [...logsKey(babyId), "stats", since],
     queryFn: () => fetchLogsSince(babyId, since),
+    enabled,
   });
 }
 
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  208 passed (208)`, `Tests  1980 passed (1980)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add app/bao-cao/page.tsx app/globals.css components/illness/FeverChart.tsx components/report/ReportPage.tsx components/report/ReportScreen.tsx components/report/reportscreen.test.tsx lib/data/logs.ts lib/ui/tokens.test.ts
git commit -m "feat(report): the period Đợt ốm, at /bao-cao?dot=" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Nút "Báo cáo cho bác sĩ" trên trang chi tiết (§6.3 mục 7)

**Files:**

- Modify: `components/illness/EpisodeScreen.tsx` (`EpisodeBody`)
- Test: `components/illness/episodescreen.test.tsx` (sửa)

**Interfaces:**

- Consumes: `buttonClass`, `Icon`, `Link`; địa chỉ `/bao-cao?dot={id}` của Task 1.
- Produces: nút "Báo cáo cho bác sĩ" trong `EpisodeBody`. Chữ ký của `EpisodeBody` không đổi.

Trước khi viết, đọc `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` (AGENTS.md): nút là một `Link` mang dáng nút, như ở `components/conditions/ConditionsScreen.tsx`; không có tham số nào mới.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/illness/episodescreen.test.tsx b/components/illness/episodescreen.test.tsx
index 7cfbb9e..27c2973 100644
--- a/components/illness/episodescreen.test.tsx
+++ b/components/illness/episodescreen.test.tsx
@@ -171,7 +171,7 @@ describe("EpisodeScreen", () => {
     expect(useLogsRealtime).toHaveBeenCalledWith("b1");
   });
 
-  it("an open episode: verdict, chart, days, the comparison, then Bé đã khỏi", () => {
+  it("an open episode: verdict, chart, days, the comparison, the report, then Bé đã khỏi", () => {
     const html = render();
     expect(html).toContain(">Bun đã hết sốt 19 giờ</h2>");
     expect(html).toContain(">Ngày thứ 3 · bắt đầu 24/11 lúc 23:30</span>");
@@ -193,13 +193,13 @@ describe("EpisodeScreen", () => {
       ">Nhiệt độ và thuốc hạ sốt</h2>",
       ">Từng ngày</h2>",
       ">So với thường ngày</h2>",
+      "Báo cáo cho bác sĩ</a>",
       ">Bé đã khỏi</button>",
     ].map((mark) => html.indexOf(mark));
     expect(order).toEqual([...order].sort((a, b) => a - b));
     expect(order[0]).toBeGreaterThan(-1);
-    // Not in this milestone: the report, the visits.
-    for (const text of ["Báo cáo cho bác sĩ", "Lần khám"])
-      expect(html).not.toContain(text);
+    // Not in this milestone: the visits.
+    expect(html).not.toContain("Lần khám");
   });
 
   // The page's clock moves once a minute; a log saved since its last tick is
@@ -239,6 +239,9 @@ describe("EpisodeScreen", () => {
     expect(html).toContain(">10/10 – 12/10</span>");
     expect(html).toContain(">Chưa có lần đo nào trong đợt này.</p>");
     expect(html).toContain(">So với thường ngày</h2>");
+    expect(html).toMatch(
+      /<a[^>]*href="\/bao-cao\?dot=past"[^>]*>.*Báo cáo cho bác sĩ<\/a>/,
+    );
     expect(html).not.toContain("Bé đã khỏi");
     expect(html).not.toContain(">Triệu chứng</button>");
     expect(useRangeLogs).toHaveBeenCalledWith(
@@ -317,6 +320,18 @@ describe("EpisodeBody", () => {
     );
   });
 
+  // Spec §6.3 item 7 and §9 (board "Đợt ốm · A"): a full-width link styled
+  // as the main button, with the document icon, above "Bé đã khỏi".
+  it("Báo cáo cho bác sĩ opens the report on this episode", () => {
+    const html = renderToStaticMarkup(body(false));
+    expect(html).toMatch(
+      /<a class="[^"]*bg-accent[^"]*min-h-\[50px\][^"]*w-full[^"]*" href="\/bao-cao\?dot=open">/,
+    );
+    expect(html).toMatch(
+      new RegExp(`d="${ICON_PATHS.doc}".*Báo cáo cho bác sĩ</a>`),
+    );
+  });
+
   it("hands the quick-log type on from the verdict card", () => {
     const onLog = vi.fn();
     const [verdict] = findElements(
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 207 passed (208)`, `Tests  3 failed | 1978 passed (1981)`.

- [ ] **Step 3: Thêm nút (Patch 4)**

```diff
diff --git a/components/illness/EpisodeScreen.tsx b/components/illness/EpisodeScreen.tsx
index a4d48b7..580d3f7 100644
--- a/components/illness/EpisodeScreen.tsx
+++ b/components/illness/EpisodeScreen.tsx
@@ -1,11 +1,13 @@
 "use client";
 
+import Link from "next/link";
 import { useRouter } from "next/navigation";
 import { useState } from "react";
 import { useQuickActions } from "@/components/actions/QuickActions";
-import { Button } from "@/components/ui/Button";
+import { Button, buttonClass } from "@/components/ui/Button";
 import { EmptyState } from "@/components/ui/EmptyState";
 import { ErrorCard } from "@/components/ui/ErrorCard";
+import { Icon } from "@/components/ui/Icon";
 import { IconButton } from "@/components/ui/IconButton";
 import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
 import { PageHeader } from "@/components/ui/PageHeader";
@@ -72,11 +74,22 @@ export function EpisodeBody({
       <FeverChartCard chart={feverChartModel(logs, episode, now)} />
       <EpisodeDayList rows={dayRows(logs, episode, now)} />
       <EpisodeUsual view={usualView(logs, episode, now)} />
-      {episode.ended_at === null && (
-        <Button variant="secondary" block busy={closing} onClick={onClose}>
-          Bé đã khỏi
-        </Button>
-      )}
+      {/* Spec §6.3 item 7: the report of this episode (§9), then, while it
+          is open, "Bé đã khỏi". */}
+      <div className="flex flex-col gap-2.5">
+        <Link
+          href={`/bao-cao?dot=${episode.id}`}
+          className={buttonClass({ block: true })}
+        >
+          <Icon name="doc" size={20} />
+          Báo cáo cho bác sĩ
+        </Link>
+        {episode.ended_at === null && (
+          <Button variant="secondary" block busy={closing} onClick={onClose}>
+            Bé đã khỏi
+          </Button>
+        )}
+      </div>
     </>
   );
 }
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  208 passed (208)`, `Tests  1981 passed (1981)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/illness/EpisodeScreen.tsx components/illness/episodescreen.test.tsx
git commit -m "feat(illness): Báo cáo cho bác sĩ on the episode page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M4c, checklist, spec, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-report/page.tsx`, `app/fixture-illness/page.tsx` (hai trang tạm, không commit)
- Modify: `docs/device-checklist.md`, `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md`, file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; Bước 38 mục 25–28; một đoạn đọc spec ở §9; `main` có M4c, tức mốc M4 của spec xong.

- [ ] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  208 passed (208)`, `Tests  1981 passed (1981)`.

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages using 9 workers (42/42)`, dòng `├ ○ /bao-cao` (vẫn tĩnh), và thoát mã 0.

- [ ] **Step 3: Tạo hai trang fixture tạm**

Gia đình chưa có đợt ốm và không được tạo đợt trên dữ liệu thật, nên kỳ "Đợt ốm" chỉ thấy đủ ở đây. Trang Báo cáo vẽ `ReportScreen` thật với ba đợt giả (đang mở từ hôm kia; đã đóng 3 ngày; đã đóng 20 ngày) và bản ghi giả của đợt đang mở; giờ tính từ hôm nay (xem Ghi chú khi thực thi về lần tải lại 60 giây). Tạo `app/fixture-report/page.tsx` (không commit):

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ReportScreen } from "@/components/report/ReportScreen";
import { logsKey } from "@/lib/data/logs";
import { episodesKey, growthKey, vaccineDosesKey } from "@/lib/data/outbox";
import { statsFetchSince } from "@/lib/rules/dailyStats";
import { addDays, vnDayRange } from "@/lib/rules/days";
import { episodeReport } from "@/lib/rules/report";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";

// Dữ liệu giả, không đọc hay ghi gì của gia đình. Giờ tính từ hôm nay.
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
const episode = (id: string, start: string, end: string | null) =>
  ({
    id,
    baby_id: BABY.id,
    started_at: start,
    ended_at: end,
    created_by: "fixture",
    created_at: start,
    updated_at: start,
  }) as EpisodeRow;
const EPISODES = [
  episode("open", at(-2, "23:30"), null),
  episode("past", at(-40, "08:00"), at(-38, "09:00")),
  episode("long", at(-80, "08:00"), at(-61, "09:00")),
];
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
  ...[-3, -2, -1, 0].flatMap((day) => [
    log("breast", at(day, "02:00"), { side: "left" }, at(day, "02:20")),
    log("bottle", at(day, "09:00"), { ml: 90, milk: "formula" }),
    log("diaper", at(day, "09:30"), { wet: true, dirty: day === -1 }),
    log("sleep", at(day, "12:00"), {}, at(day, "14:30")),
  ]),
  log("temperature", at(-2, "20:00"), { celsius: 37.6, method: "nach" }),
  log("temperature", at(-2, "23:40"), { celsius: 38.4, method: "nach" }),
  log("temperature", at(-1, "03:15"), { celsius: 39.2, method: "tai" }),
  log("medicine", at(-1, "03:30"), {
    name: "Hapacol 150",
    amount: 2.5,
    unit: "ml",
    antipyretic: true,
  }),
  log("temperature", at(-1, "15:00"), { celsius: 38.6, method: "nach" }),
  log("temperature", at(0, "07:05"), { celsius: 37.4, method: "nach" }),
  log("symptom", at(-1, "08:00"), {
    codes: ["runny_nose", "cough", "fussy"],
    note: "Ho nhiều về đêm, bú ít hơn mọi ngày, quấy khi đặt xuống",
  }),
  log("symptom", at(0, "06:30"), { codes: ["cough"] }),
];

function Fixture() {
  const dot = useSearchParams().get("dot");
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    const now = new Date();
    queryClient.setQueryData(episodesKey(BABY.id), EPISODES);
    queryClient.setQueryData(growthKey(BABY.id), []);
    queryClient.setQueryData(vaccineDosesKey(BABY.id), []);
    for (const count of [7, 14])
      queryClient.setQueryData(
        [...logsKey(BABY.id), "stats", statsFetchSince(vnDayRange(now, count))],
        LOGS,
      );
    for (const item of EPISODES) {
      const report = episodeReport(item, now);
      queryClient.setQueryData(
        [...logsKey(BABY.id), "range", report.from, report.to ?? "open"],
        item.id === "open" ? LOGS : [],
      );
    }
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <ReportScreen baby={BABY} dot={dot} />
    </QueryClientProvider>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Fixture />
    </Suspense>
  );
}
```

Trang thứ hai là đúng trang fixture của M4a (thân trang chi tiết, không hook), để xem nút mới. Tạo `app/fixture-illness/page.tsx` (không commit):

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

- [ ] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở các trang dưới trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp. Ngày ghi dưới đây là của lần viết plan (hôm nay 27/11); lúc chạy thì theo hôm nay.

Trên trang tạm `http://localhost:3000/fixture-report?dot=open`:

1. "Khoảng thời gian" có ba nút "7 ngày", "14 ngày", "Đợt ốm", đang chọn "Đợt ốm". Dòng dưới tên bé "Đợt ốm từ 25/11 · ngày thứ 3 · in ngày 27/11/2026". Bảng "Theo ngày" ba hàng 25/11, 26/11, 27/11. Mục "Nhiệt độ": biểu đồ (chấm 39,2 có nhãn, chấm mới nhất 37,4 có nhãn, một hình thoi, vùng "Sốt", chú thích ba mục) rồi bốn dòng đo; **không** có dòng 37,6°C (đo lúc 20:00 ngày 25/11, trước giờ bắt đầu 23:30). Mục "Triệu chứng" hai hàng.
2. Chạy đoạn đo dưới. Khi viết plan, ở 375 px theme `rose`: ba nút 108×44, mỗi nút 1 dòng; `days` 3; biểu đồ 309×191 với nhãn "Biểu đồ nhiệt độ: 4 lần đo, cao nhất 39,2°C, 1 liều hạ sốt."; `overflow` là `true`; `ellipsis` là 0.

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
    (e) =>
      getComputedStyle(e).textOverflow === "ellipsis" &&
      e.scrollWidth > e.clientWidth,
  ).length,
  choices: [
    ...document.querySelectorAll('[aria-label="Khoảng thời gian"] button'),
  ].map(
    (b) =>
      `${b.textContent}${b.getAttribute("aria-pressed") === "true" ? "*" : ""} ${box(b)} ${lines(b)} dòng`,
  ),
  lines: [...document.querySelectorAll("section p.text-muted")]
    .slice(0, 2)
    .map((p) => p.textContent),
  days: [...document.querySelectorAll("table")][0]?.querySelectorAll("tbody tr")
    .length,
  chart: (() => {
    const svg = document.querySelector("svg[role=img]");
    return svg ? `${box(svg)} ${svg.getAttribute("aria-label")}` : null;
  })(),
  readings: [
    ...([...document.querySelectorAll("h3")]
      .find((h) => h.textContent === "Nhiệt độ")
      ?.parentElement.querySelectorAll("li") ?? []),
  ].map((li) => li.textContent),
});
```

3. `?dot=past`: dòng "Đợt ốm 18/10 – 20/10 · 3 ngày · in ngày 27/11/2026", `days` 3, không có biểu đồ, mục "Nhiệt độ" ghi "Không đo trong khoảng này.".
4. `?dot=long`: dòng "Đợt ốm 08/09 – 27/09 · 20 ngày · in ngày 27/11/2026", ngay dưới là dòng riêng "14 ngày cuối của đợt ốm"; `days` 14.
5. `?dot=gone` và không tham số: đang chọn "7 ngày", vẫn có ba nút; dòng "7 ngày, từ 21/11 đến 27/11 · in ngày 27/11/2026"; không có biểu đồ.
6. Ở `?dot=past` bấm "7 ngày" rồi bấm "Đợt ốm" (bấm theo `ref` của `find`). Kỳ vọng: dòng thành "Đợt ốm từ 25/11 · ngày thứ 3 · …" (đợt đang mở, không phải đợt của địa chỉ).
7. Ở `?dot=open`, đặt `document.documentElement.dataset.theme = "dark"`, rồi giả lập bản in bằng đoạn dưới (chép mọi luật `@media print` vào một thẻ `<style>`; không bấm in). Kỳ vọng: kết quả là `bg` và `glass-solid` #fff, `ink` #000 (bản dev có thể viết gọn mã màu: #fff là #ffffff), `danger` #c4142b, `danger-ink` #8a0f1f, `cat-med` #c0392b, `cat-temp` #1b6f87; trên màn: nền trắng, phần điều khiển ẩn, đường và chấm xanh, chữ "38" và "Sốt" đỏ đậm, ba dấu của chú thích có màu. Tải lại trang, làm lại ở `night`.

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
document.querySelector("svg[role=img]").scrollIntoView();
const css = getComputedStyle(document.documentElement);
JSON.stringify(
  Object.fromEntries(
    ["bg", "ink", "glass-solid", "danger", "danger-ink", "cat-med", "cat-temp"].map(
      (name) => [name, css.getPropertyValue(`--color-${name}`).trim()],
    ),
  ),
);
```

8. Tải lại, lặp lại mục 1 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"` (không giả lập in): ba nút, biểu đồ và hai bảng đọc được.

Trên trang tạm `http://localhost:3000/fixture-illness`:

9. Cuộn xuống cuối phần "cả trang · đợt đang mở". Kỳ vọng: sau thẻ "So với thường ngày" là nút "Báo cáo cho bác sĩ" (nền `accent`, icon tờ giấy), rồi "Bé đã khỏi". Khi viết plan: hai nút 343×50, cách nhau 10 px; đường dẫn của nút là `/bao-cao?dot=fixture`. Không bấm.

Trang thật (dữ liệu thật của gia đình: **chỉ xem**; cần đăng nhập trong khung Browser):

10. `http://localhost:3000/bao-cao`: gia đình chưa có đợt ốm thì chỉ có "7 ngày", "14 ngày", báo cáo như trước; có đợt (do người dùng tự tạo) thì có thêm "Đợt ốm". Lệnh đọc `illness_episodes` trả 200: đọc Resource Timing trong trang (`performance.getEntriesByType("resource")`, lọc tên không bắt đầu bằng `location.origin`, đọc `responseStatus`; chỉ in `pathname` và tên tham số). Không bấm "In / Lưu PDF".
11. `http://localhost:3000/bao-cao?dot=khong-co`: như mục 10 (mã không có thì như không có tham số). Nếu gia đình có đợt ốm thật: mở trang chi tiết của nó, thấy nút "Báo cáo cho bác sĩ"; bấm nút đó (chỉ dẫn trang, không ghi gì) và thấy kỳ "Đợt ốm" của đợt đó. Lọc console bằng `onlyErrors`: không có lỗi. `scrollWidth <= innerWidth` là `true` ở cả hai trang.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo; mục nào thấy trên trang thật, mục nào chỉ thấy trên trang tạm. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

- [ ] **Step 5: Xóa hai trang fixture**

```bash
rm -r app/fixture-report app/fixture-illness
bun run typecheck
git status --short  # không còn app/fixture-report, app/fixture-illness
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts`: chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [ ] **Step 6: Phần M4c của Bước 38 (Patch 5) và một đoạn đọc spec (Patch 6), commit**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index e262c7e..456ae1e 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -646,7 +646,7 @@ Kết quả: Chờ người dùng.
 
 ## Bước 38 — Đợt ốm (spec 2026-11-26)
 
-Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23, bảng "Triệu chứng" của Báo cáo là mục 24. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó. Mục 24 tạo một bản ghi Triệu chứng thử và xóa nó.
+Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23, bảng "Triệu chứng" của Báo cáo là mục 24, kỳ "Đợt ốm" của Báo cáo và nút "Báo cáo cho bác sĩ" là mục 25–28. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó. Mục 24 tạo một bản ghi Triệu chứng thử và xóa nó. Mục 25 tạo một đợt ốm thử và một bản ghi nhiệt độ thử; mục 28 xóa cả hai.
 
 1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
 2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
@@ -672,6 +672,10 @@ Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; ph
 22. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết có thẻ "So với thường ngày" ngay dưới mục "Từng ngày"; trong thẻ chỉ có câu "Chưa có ngày trọn nào của đợt ốm để so." và dòng "Phân loại triệu chứng" có mũi tên. Bấm bút chì, đổi "Bắt đầu" thành 08:00 của hôm kia, bấm "Lưu". Kỳ vọng: thẻ có dòng "Hôm qua, so với trung bình 7 ngày trước khi ốm" rồi tới ba hàng "Bú", "Tã ướt", "Ngủ" (hàng nào bảy ngày trước đó không có số thì không có); mỗi hàng có dòng "{số} cữ · thường {số} cữ", "{số} lần · thường {số} lần" hoặc "{số} giờ · thường {số} giờ" và một chip "Ít hơn", "Như thường" hoặc "Nhiều hơn"; không chữ nào bị cắt. Nếu bảy ngày trước hôm kia có ít hơn ba ngày được ghi bú, ngủ hay tã thì thay vào đó là câu "Chưa đủ dữ liệu trước khi ốm để so.". Bấm "Phân loại triệu chứng". Kỳ vọng: trang Phân loại triệu chứng mở ra. Quay lại.
 23. Bật Ban đêm. Kỳ vọng: các chip của thẻ "So với thường ngày" khác nhau ở chữ, đọc rõ. Tắt Ban đêm. Bấm "Bé đã khỏi". Kỳ vọng: dòng đầu của thẻ thành "{ngày hôm qua, dd/mm}, so với trung bình 7 ngày trước khi ốm", các hàng giữ nguyên. Dọn: bấm bút chì, "Xóa đợt ốm".
 24. Bấm "+", nhóm "Khác", "Triệu chứng"; chọn "Ho", gõ ghi chú "thử", bấm "Lưu". Sức khỏe → "Báo cáo cho bác sĩ", để "7 ngày". Kỳ vọng: sau mục "Thuốc đã dùng" có bảng "Triệu chứng" ba cột "Giờ", "Triệu chứng", "Ghi chú"; có một hàng với giờ vừa lưu, "Ho", "thử"; bảng không tràn ra ngoài màn hình. Bấm "In / Lưu PDF". Kỳ vọng: bản xem trước có bảng đó, chữ đen trên nền trắng, có kẻ ô. Hủy in. Dọn: vào Nhật ký xóa bản ghi "Triệu chứng: Ho · thử". Mở lại Báo cáo. Kỳ vọng: không còn bảng "Triệu chứng" (nếu bảy ngày qua không có bản ghi triệu chứng nào khác).
+25. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Trong thẻ trên cùng bấm "Nhiệt độ", nhập 38,5, bấm "Lưu". Cuộn xuống cuối trang. Kỳ vọng: nút "Báo cáo cho bác sĩ" (nền đậm, có icon tờ giấy) nằm ngay trên nút "Bé đã khỏi". Bấm nút đó. Kỳ vọng: trang "Báo cáo cho bác sĩ" có ba lựa chọn "7 ngày", "14 ngày", "Đợt ốm", đang chọn "Đợt ốm"; dòng dưới tên bé là "Đợt ốm từ {hôm nay, dd/mm} · ngày thứ 1 · in ngày …"; bảng "Theo ngày" chỉ có một hàng; mục "Nhiệt độ" có biểu đồ (một chấm kèm số 38,5 trong vùng có chữ "Sốt"; chú thích "Nhiệt độ", "Liều hạ sốt", "Từ 38°C là sốt") rồi tới dòng có 38,5°C.
+26. Bấm "7 ngày". Kỳ vọng: báo cáo bảy ngày như trước ("7 ngày, từ … đến …"), không có biểu đồ. Bấm "Đợt ốm". Kỳ vọng: lại là đợt vừa mở.
+27. Bật Ban đêm, bấm "In / Lưu PDF". Kỳ vọng: bản xem trước nền trắng chữ đen; biểu đồ in màu như ở nền sáng: đường và chấm màu xanh, vùng sốt hồng nhạt, chữ "38" và "Sốt" đỏ đậm đọc rõ, ba dấu của chú thích có màu; biểu đồ không bị cắt đôi giữa hai trang. Hủy in, tắt Ban đêm.
+28. Về trang chi tiết, bấm "Bé đã khỏi", rồi "Báo cáo cho bác sĩ". Kỳ vọng: dòng dưới tên bé là "Đợt ốm {dd/mm} – {dd/mm} · 1 ngày · in ngày …". Đóng hẳn app, bật chế độ máy bay, mở lại app → Sức khỏe → "Đợt ốm" → hàng của đợt vừa đóng → "Báo cáo cho bác sĩ". Kỳ vọng: trang mở ra (không phải trang "Bạn đang offline") và vẫn chọn "Đợt ốm". Nếu thay vào đó thấy "Cần mạng để tải báo cáo. …" hay một màn khác: ghi lại đúng màn hình đã thấy. Tắt chế độ máy bay. Dọn: bút chì → "Xóa đợt ốm"; vào Nhật ký xóa bản ghi 38,5.
 
 Kết quả: Chờ người dùng.
 
```

```diff
diff --git a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
index 07ab994..ba0cf66 100644
--- a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
+++ b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
@@ -434,6 +434,7 @@ alter table public.photos add foreign key (visit_id, baby_id)
   - Bảng nhiệt độ, bảng thuốc, bảng "Triệu chứng" chỉ lấy bản ghi thuộc đợt (§4.3) và nằm trong các ngày của báo cáo.
   - Dòng "{range} ngày, từ … đến …" sẵn có được thay bằng "Đợt ốm {dd/mm} – {dd/mm} · {n} ngày"; đợt đang mở: "Đợt ốm từ {dd/mm} · ngày thứ {n}". Phần " · in ngày {dd/mm/yyyy}" ở cuối dòng giữ nguyên.
   - Biểu đồ §6.5 đứng trước bảng nhiệt độ và in ra giấy.
+  - Dòng "14 ngày cuối của đợt ốm" là một dòng riêng, ngay dưới dòng "Đợt ốm …". Biểu đồ nằm trong mục "Nhiệt độ", giữa tiêu đề và các dòng đo, và chỉ có khi 7 ngày nó vẽ có lần đo (không in một khung trống). Trên giấy, biểu đồ mang màu của theme sáng (đường, chấm, hình thoi, vùng sốt, chữ "38" và "Sốt"), kể cả khi app đang ở theme tối. Mở bằng `?dot=` khi danh sách đợt ốm chưa tải xong thì trang chờ (khung chờ; mất mạng: "Cần mạng để tải báo cáo. …"; lỗi: thẻ lỗi "Đợt ốm: …"), không hiện tạm kỳ 7 ngày. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bốn chỗ này. Chọn ở M4c ngày 2026-11-27 theo lời duyệt trước của người dùng.)
   - Sau bảng thuốc có bảng "Lần khám" (từ M5): Lúc khám, Nơi khám, Bác sĩ kết luận, Lời dặn. Không in ảnh.
 - Với mọi kỳ: khi kỳ có bản ghi `symptom`, sau bảng thuốc có bảng "Triệu chứng": Giờ, Triệu chứng (các `short`), Ghi chú.
 - Kỳ 7 và 14 ngày: ngoài bảng "Triệu chứng", không đổi gì.
```

`docs/device-checklist.md` từ trước đã không theo prettier: không chạy `prettier --write` lên nó.

```bash
git add docs/device-checklist.md docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
git commit -m "docs: the M4c part of step 38, and readings of §9 in the spec" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này là untracked (??), hoặc đã được commit lúc duyệt thì là M; các file plan khác chưa chạy: không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4c.md
git commit -m "docs(plan): the M4c plan and its check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m4c
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm; nhắc người dùng phần M4c của Bước 38 (mục 25–28) đang chờ họ trên iPhone thật, và rằng mốc M4 của spec đã xong (còn M5); lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
