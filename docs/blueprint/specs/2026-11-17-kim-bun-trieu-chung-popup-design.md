# Kim Bun — Phân loại triệu chứng có gợi ý bệnh, popup đóng mượt

**Status:** approved 2026-11-17
**Ngày:** 2026-11-17
**Unit:** `web` (PWA Next.js). Một unit, không có migration.
**Liên quan:** spec gốc `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (§6.6 Phân loại triệu chứng, gọi tắt "spec gốc"), spec UI `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md` ("spec UI"). Code nền: `main` tại `5abb1fd`. Bản vẽ Claude Design "Kim Bun – Phân loại triệu chứng" (https://claude.ai/artifact/DfyotdcjEtR55uQbS2Gseq), token theme Hồng dịu. Phương án đã chọn: **A** (chip theo nhóm, một trang) cho màn nhập, **E** (tab chuyển bệnh) cho màn kết quả. Canvas chỉ để xem hình; mọi giá trị nằm trong spec này.
**Nội dung nguyên văn:** `docs/blueprint/specs/2026-11-17-kim-bun-trieu-chung-draft.patch` (gọi tắt "patch nháp"). Patch nháp chứa phần sửa popup (§3) và toàn bộ chữ của §4. Áp bằng `git apply`, rồi làm thêm những gì spec này nêu mà patch chưa có (§4.4).

## 1. Mục tiêu

1. **Popup đóng mượt.** Bảng "Ghi lại cho {tên bé}" (Sheet `variant="floating"`) đóng không còn giật: panel trượt hẳn ra khỏi màn hình, nền tối mờ dần.
2. **Phân loại triệu chứng hữu ích hơn.** Hiện màn `/trieu-chung` chỉ có câu hỏi dấu hiệu nguy hiểm nên chọn gì cũng ra đi khám hoặc đi cấp cứu. Sau thay đổi, người dùng chọn thêm triệu chứng thường gặp, và kết quả cho thấy:
   - những bệnh có thể gặp, mỗi bệnh kèm cách chăm tại nhà và khi nào cần đi khám;
   - các bước sơ cứu hoặc việc cần làm trong lúc chờ, khi có dấu hiệu liên quan.
3. **Bé từ 6 tháng sốt 38–39,9°C mà không có dấu hiệu nào khác** thì ra "Theo dõi tại nhà", không ra "đi khám trong 24 giờ" (theo NHS, fever in children).

Ngoài phạm vi: chẩn đoán; tính liều thuốc theo mg; lưu triệu chứng đã chọn vào nhật ký; ô tìm kiếm triệu chứng; đổi danh sách hay mức đỏ/vàng của các câu hỏi dấu hiệu nguy hiểm đang có; đổi trang Bệnh thường gặp ngoài việc tự có thêm bài mới; nhiều bé.

## 2. Global Constraints

- Giữ Global Constraints của `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`: chỉ dùng gói miễn phí, secret không bao giờ nằm ở client, **không tính liều thuốc**. Riêng luật "app **không** đặt tên bệnh" được nới như dòng dưới.
- **Nới luật tên bệnh (quyết định của người dùng, 2026-11-17).** Người dùng yêu cầu: "cái tôi cần là suy đoán bệnh có thể từ các triệu chứng và cách xử lý sơ cứu tạm thời tại nhà". Luật mới: app **không kết luận bệnh**, nhưng được gợi ý "bệnh có thể gặp" từ triệu chứng người dùng chọn, với điều kiện:
  - khối gợi ý luôn có dòng "Gợi ý theo triệu chứng đã chọn, không phải chẩn đoán.";
  - khối gợi ý không bao giờ thay thẻ mức độ, và không làm mức độ đổi;
  - không có chữ nào nói "bé bị …" như một kết luận.

  Phần triển khai sửa nguyên văn ba chỗ sau cho khớp:
  - dòng 35 của `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md` và dòng 25 của `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` thành: "An toàn y tế: app **không** kết luận bệnh (chỉ gợi ý bệnh có thể gặp, ghi rõ không phải chẩn đoán), **không** tính liều thuốc. Mọi màn kết quả triệu chứng có nút gọi `115` và dòng "Thông tin tham khảo, không thay thế bác sĩ.""
  - dòng 273 của spec gốc, đổi câu đầu thành: "Không có kết quả nào hiện tên bệnh như một kết luận; khối "Có thể bé đang bị" (spec 2026-11-17) chỉ là gợi ý."

- Giữ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Spec này không thêm token màu. `lib/themeGuard.test.ts` cấm mã hex trong `components/**/*.tsx`.
- Không lồng `glass` trong `glass` (hotfix 7822c90).
- Nội dung y khoa chỉ nằm trong `content/*.vi.json`, mỗi mục có `source` là URL và `reviewedAt` dạng `YYYY-MM-DD`. Lời miễn trừ giữ nguyên văn: "Thông tin tham khảo, không thay thế bác sĩ."
- Chữ về thuốc chỉ nêu ngưỡng tuổi (paracetamol từ 2 tháng; ibuprofen từ 3 tháng và nặng từ 5 kg), "đúng liều theo cân nặng ghi trên hộp hoặc hỏi dược sĩ", không aspirin, không dùng hai thuốc cùng lúc khi chưa hỏi bác sĩ. Không ghi số mg hay ml.
- Mức kết quả (đỏ, vàng, xanh) chỉ do câu hỏi dấu hiệu nguy hiểm và nhiệt độ quyết định. Triệu chứng thường không bao giờ làm mức tăng hay giảm.
- Mọi kết quả, ở cả ba mức, vẫn có nút gọi 115, danh bạ bác sĩ của gia đình và lời miễn trừ (spec gốc §6.6).
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay màn `/trieu-chung` thì được (màn này không ghi gì). Ở popup "Ghi lại cho Bun" chỉ được mở rồi đóng bằng nút ✕, bấm nền hoặc phím Esc; không bấm ô nào trong lưới.
- Test hiện có phải xanh: `bun run test`, `bun run typecheck`, `bun run build`.

## 3. Popup đóng mượt

Nguyên nhân giật, đo trên code `5abb1fd`:

1. Popup nổi có `mb-24` và dialog có `p-2`, nên đáy panel cách đáy màn hình 104 px. Keyframe `kb-sheet-out` chỉ dịch `translateY(100%)`, tức đúng chiều cao panel. Vì vậy khi hết animation, 104 px trên cùng của panel vẫn còn trên màn hình rồi biến mất cái bụp.
2. `::backdrop` chỉ có animation mở (`kb-fade-in`), không có animation đóng. Nền tối nằm nguyên rồi tắt cùng lúc với `dialog.close()`.
3. Panel `glass-strong` có `backdrop-filter: blur(40px) saturate(180%)`. Trong lúc trượt, trình duyệt phải làm mờ lại phần trang bên dưới ở từng khung hình.

Thay đổi, đúng như patch nháp:

- `app/globals.css`:
  - `kb-sheet-in` (`from`) và `kb-sheet-out` (`to`) dùng `transform: translateY(calc(100% + var(--kb-sheet-gap, 0px)))`.
  - Thêm keyframe `kb-fade-out` (opacity từ 1 về 0).
  - Thêm `dialog[data-closing]::backdrop { animation: kb-fade-out 280ms ease-in forwards; }`.
  - Thêm `dialog[data-closing] > .glass-strong { background: var(--color-glass-solid); -webkit-backdrop-filter: none; backdrop-filter: none; }`.
- `components/ui/Sheet.tsx`:
  - `<dialog>` có thuộc tính `data-closing=""` khi state `closing` là true, và không có thuộc tính này khi `closing` là false.
  - Panel có style `--kb-sheet-gap`: `8px` với `variant="bottom"`, `104px` với `variant="floating"`. Style kéo tay (`transform` khi kéo) vẫn giữ.
  - Panel thêm class `will-change-transform`.
- Thời lượng và đường cong không đổi: 280 ms `cubic-bezier(0.32,0.72,0,1)` cho panel.
- Luật `prefers-reduced-motion` trong `globals.css` thêm `::backdrop` vào danh sách selector (`*, ::before, ::after, ::backdrop`). Patch nháp chưa có chỗ này.
- Thứ tự khi đóng, đổi so với `5abb1fd` để nền không loé một khung hình:
  - `onAnimationEnd` của panel chỉ gọi `onClose()`, **không** gọi `setClosing(false)`;
  - `closing` (và `data-closing`) được xoá trong handler `onClose` của `<dialog>` (đã có `setClosing(false)`), tức là sau khi `dialog.close()` chạy;
  - lần mở sau vẫn đặt lại `closing` thành false trước `showModal()`, như hiện tại.
  - Cách này dựa vào việc mọi nơi dùng `Sheet` đặt `open` thành false trong `onClose`. Phần triển khai kiểm mọi chỗ gọi `<Sheet` (gồm `components/home/QuickEntrySheet.tsx`, `components/home/PumpSheet.tsx` và các nhóm ở Cài đặt) và ghi kết quả vào plan.

  Patch nháp chưa có thay đổi này.

- Khi người dùng chọn một ô trong lưới, `ActionSheet` vẫn gọi `onClose()` ngay, không chạy animation (đổi sang sheet khác). Phần này không đổi.

Test (`components/ui/sheet.test.tsx`): khi render ở trạng thái đóng (`closing` false) thì dialog không có `data-closing`. Panel có `--kb-sheet-gap:104px` khi `variant="floating"` và `--kb-sheet-gap:8px` khi `variant="bottom"`. Test cũ về class `animate-[kb-sheet-in…]` vẫn đúng.

Kiểm tay trên iPhone (ghi vào `docs/device-checklist.md` là bước chờ người dùng): mở popup "Ghi lại cho Bun" rồi đóng bằng ✕ và bằng bấm nền. Panel phải trượt hết xuống dưới đáy, nền tối mờ dần, không có cú nhảy ở cuối.

## 4. Nội dung

### 4.1 `content/triage.vi.json`

Thêm 4 khoá, đúng thứ tự khoá như patch nháp: `symptoms`, `symptomsSource`, `firstAid`, `whileGoing`. `reviewedAt` của file đổi thành `2026-11-17`.

- `symptoms`: 23 triệu chứng thường gặp. Mỗi mục có `code` (`^[a-z0-9_]+$`, không trùng), `group` (một mã trong `groups`), `text`, `suggests` (≥ 1 mã bài trong `conditions.vi.json`), và có thể có `minAgeDays`, `maxAgeDays`. Danh sách nguyên văn nằm trong patch nháp. Mã: `fever, runny_nose, cough, barking_cough, wheeze, spit_up, vomit, diarrhoea, hard_stool, gassy, diaper_rash, dry_red_skin, heat_rash, rash_after_fever, hand_foot_spots, yellow_skin, white_mouth, mouth_sores, ear_rub, sticky_eye, drooling` (từ 90 ngày), `long_crying` (đến 180 ngày), `fussy`.
- `symptomsSource`: patch nháp ghi `https://www.nhs.uk/conditions/baby/health/`. **Sửa thành** `https://www.nhs.uk/conditions/`. Lý do: mục lục bệnh của NHS là nguồn chung cho danh sách; mỗi bài bệnh có nguồn riêng.
- `firstAid`: 4 khối `seizure`, `breathing`, `fluids`, `fever`. Mỗi khối có `code`, `title`, `when` (≥ 1 phần tử), `steps` (≥ 1 dòng). Mỗi phần tử trong `when` là mã một câu hỏi trong `questions`, hoặc chuỗi `@fever`.
- `whileGoing`: 3 dòng, dùng cho kết quả đỏ.

### 4.2 `content/conditions.vi.json`

Thêm 9 bài sau 10 bài hiện có, theo thứ tự: `sot`, `viem_tai_giua`, `moc_rang`, `khoc_da_de`, `rom_say`, `sot_phat_ban`, `tay_chan_mieng`, `croup`, `dau_mat`. Chữ, nguồn và mốc tuổi nguyên văn trong patch nháp. `goNow` của mỗi bài mới gồm dấu hiệu riêng của bài (có thể không có), rồi 7 dòng `goNow` chung, giống 7 dòng cuối của bài `cam_lanh`. `reviewedAt` của file và của 9 bài mới là `2026-11-17`.

Mốc tuổi gợi ý (`minAgeDays`, `maxAgeDays`). Patch nháp đã có các mốc này:

| Bài                  | minAgeDays | maxAgeDays |
| -------------------- | ---------- | ---------- |
| `vang_da_sinh_ly`    | —          | 60         |
| `viem_tieu_phe_quan` | —          | 730        |
| `moc_rang`           | 90         | —          |
| `khoc_da_de`         | —          | 180        |
| `sot_phat_ban`       | 150        | 1100       |

Mốc tuổi chỉ dùng để lọc gợi ý ở §5.2. Trang Bệnh thường gặp vẫn hiện mọi bài, không lọc theo tuổi.

### 4.3 Nguồn

Mọi bài mới dẫn NHS (URL trong patch nháp). Bài `tay_chan_mieng` có thêm dấu hiệu nặng hay gặp ở Việt Nam: sốt từ 39°C hoặc trên 2 ngày; giật mình chới với, run chi, đi loạng choạng; nôn nhiều, li bì. Các dấu hiệu này theo hướng dẫn chẩn đoán, điều trị tay chân miệng của Bộ Y tế. `source` của bài vẫn là URL NHS.

### 4.4 Những gì patch nháp chưa có

Thêm trường `short` (tên trên tab) cho các bài sau. Bài không có `short` thì tab dùng `title`.

| Bài               | `short`      |
| ----------------- | ------------ |
| `so_mui`          | Sổ mũi       |
| `cham_sua`        | Chàm sữa     |
| `nam_mieng`       | Tưa lưỡi     |
| `vang_da_sinh_ly` | Vàng da      |
| `khoc_da_de`      | Khóc dạ đề   |
| `sot_phat_ban`    | Sốt phát ban |
| `croup`           | Croup        |
| `dau_mat`         | Đau mắt      |

Trong mỗi bài, `short` đứng ngay sau `title`.

## 5. Luật (`lib/rules/triage.ts` và file mới `lib/rules/symptoms.ts`)

### 5.1 Nhiệt độ: sửa `temperatureFindings`

Theo thứ tự, luật đầu tiên khớp thì dừng:

| Điều kiện                    | Kết quả                                       |
| ---------------------------- | --------------------------------------------- |
| `celsius === null`           | không có finding                              |
| `< 35.5`                     | đỏ, "Thân nhiệt dưới 35,5°C"                  |
| `>= 40`                      | đỏ, "Sốt từ 40°C trở lên"                     |
| `>= 38` và tuổi `< 91` ngày  | đỏ, "Bé dưới 3 tháng sốt từ 38°C trở lên"     |
| `>= 39` và tuổi `< 183` ngày | đỏ, "Bé 3–6 tháng sốt từ 39°C trở lên"        |
| `>= 38` và tuổi `< 183` ngày | vàng, "Bé 3–6 tháng đang sốt từ 38°C trở lên" |
| còn lại                      | không có finding                              |

So với hiện tại có hai chỗ đổi: (a) từ 183 ngày tuổi, 38–39,9°C không còn ra vàng; (b) chữ của finding vàng đổi từ "Bé đang sốt từ 38°C trở lên" thành "Bé 3–6 tháng đang sốt từ 38°C trở lên". `goNowIf` không đổi.

Hàm mới `hasFever(celsius: number | null): boolean` trả về true khi `celsius !== null && celsius >= 38`.

### 5.2 Gợi ý bệnh: `suggestConditions`

`lib/rules/symptoms.ts` export các hàm sau:

- `visibleSymptoms(symptoms, ageDays)`: lọc theo `minAgeDays` và `maxAgeDays` (cả hai mốc đều tính là thoả), giống `visibleQuestions`.
- `effectiveSymptoms(selected: Set<string>, celsius: number | null): Set<string>`: trả về `selected`, thêm `"fever"` khi `hasFever(celsius)`.
- `suggestConditions({ symptoms, articles, selected, ageDays })`, trả về `Suggestion[]`, với `Suggestion = { article: ConditionArticle; matched: string[]; score: number }`:
  1. Chỉ xét triệu chứng vừa nằm trong `visibleSymptoms(symptoms, ageDays)` vừa có trong `selected`.
  2. Mỗi triệu chứng cộng `1 / suggests.length` điểm cho mỗi bài trong `suggests` của nó.
  3. Bỏ bài có `minAgeDays > ageDays`, hoặc có `maxAgeDays < ageDays`.
  4. `matched` là `text` của các triệu chứng đã cộng điểm cho bài đó, theo thứ tự trong `symptoms`.
  5. Giữ mọi bài có `score > 0`. Sắp theo `score` giảm dần; bằng điểm thì theo thứ tự bài trong `articles`. Hai điểm coi là bằng nhau khi chênh nhau dưới `1e-9`.
  6. Gặp mã trong `suggests` mà không có bài tương ứng thì bỏ qua (test nội dung ở §7 bảo đảm không có trường hợp này).

### 5.3 Sơ cứu: `firstAidFor`

`firstAidFor({ blocks, checked, celsius, ageDays, questions })` trả về các khối có ít nhất một phần tử `when` khớp, theo thứ tự trong `firstAid`. Một phần tử khớp khi:

- nó là mã của một câu hỏi vừa nằm trong `visibleQuestions(questions, ageDays)` vừa có trong `checked`; hoặc
- nó là `@fever` và `hasFever(celsius)` là true.

### 5.4 Schema

- `lib/content/triage.ts`:
  - Thêm `TriageSymptomSchema` (strict): `code`, `group`, `text`, `suggests` (mảng ≥ 1), `minAgeDays?`, `maxAgeDays?`.
  - Thêm `FirstAidSchema` (strict): `code`, `title`, `when` (≥ 1), `steps` (≥ 1).
  - `TriageContentSchema` thêm `symptoms` (≥ 1), `symptomsSource` (URL), `firstAid` (≥ 1), `whileGoing` (≥ 1).
- `lib/content/conditions.ts`: `ConditionArticleSchema` thêm `short?` (chuỗi khác rỗng), `minAgeDays?`, `maxAgeDays?` (số nguyên ≥ 0).

## 6. Giao diện

### 6.1 Màn nhập (phương án A)

Thứ tự trong `TriageScreen` khi chưa có kết quả:

1. `PageHeader`, lời miễn trừ, nút gọi 115. Giữ như hiện tại.
2. Thẻ `Glass` gồm tuổi và ô nhiệt độ. Giữ như hiện tại.
3. Tiêu đề "Bé đang có gì?" (20 px, đậm), rồi dòng phụ "Chạm để chọn, chọn được nhiều." (14 px, `text-muted`).
4. Với mỗi nhóm trong `groups` có ít nhất một triệu chứng nhìn thấy (theo `visibleSymptoms`):
   - một nhãn nhóm (13 px, đậm vừa, `text-muted`);
   - một khối `role="group"`, `aria-label` là tên nhóm, chứa các chip xuống dòng (`flex-wrap`, `gap-2`).
5. Mỗi chip là `<button type="button" aria-pressed>`, cao tối thiểu 44 px, bo tròn hẳn, chữ 15 px:
   - Khi chưa chọn: class `glass font-medium text-ink`.
   - Khi đã chọn: class `bg-ink text-bg font-semibold`, chữ có tiền tố "✓ ". Giống `ChipGroup`, nhưng chọn được nhiều chip và chip xuống dòng.
6. Chip `fever` tự hiện là đã chọn khi `hasFever(nhiệt độ đã nhập)`. Lúc đó:
   - bấm vào chip không đổi gì;
   - chip có `aria-disabled="true"`;
   - ngay dưới khối Sốt có dòng 13 px `text-muted`: "Bật theo nhiệt độ đã nhập."
7. Tiêu đề "Có dấu hiệu nào dưới đây?" (20 px, đậm). Dưới đó là các `ListGroup` câu hỏi nguy hiểm, mở sẵn theo nhóm, mỗi câu một `Switch`. Giữ như hiện tại, kể cả dòng phụ về số tã ướt.
8. Nút "Xem kết quả" (lớn, full width), rồi nút gọi 115. Giữ như hiện tại.

Nút "Làm lại" xoá cả triệu chứng đã chọn, câu hỏi đã bật và nhiệt độ đã sửa.

Nhập nhiệt độ sai định dạng (`parseCelsius` trả về `"bad"`): giữ lỗi như hiện tại. Khi đó chip Sốt không tự bật.

### 6.2 Màn kết quả (phương án E)

`TriageResult` nhận thêm hai prop không bắt buộc: `suggestions?: Suggestion[]` (mặc định `[]`) và `firstAid?: FirstAid[]` (mặc định `[]`). Các khối, theo thứ tự (khối không có dữ liệu thì không hiện):

1. **Thẻ mức độ** (`role="alert"`). Giữ như hiện tại: màu, tiêu đề `RESULT_TITLE`, danh sách finding.
2. **Sơ cứu và việc trong lúc chờ:**
   - Mức đỏ:
     - mỗi khối `firstAid` khớp là một thẻ nền `bg-glass-solid`, viền 2 px `border-danger-solid`. Tiêu đề 18 px đậm `text-danger-ink`, các bước là danh sách đánh số;
     - sau các khối đó là thẻ `Glass` "Trên đường đi", nội dung là `whileGoing` dạng danh sách chấm.
   - Mức vàng: thẻ `Glass` tiêu đề "Trong lúc chờ đi khám". Bên trong, mỗi khối khớp có tiêu đề phụ 15 px đậm và danh sách đánh số các bước. Không có khối nào khớp thì dùng `TRIAGE.homeCare` dạng danh sách chấm.
   - Mức xanh: có khối khớp thì hiện thẻ `Glass` "Làm ngay tại nhà", cấu trúc giống mức vàng. Không có khối nào khớp thì không hiện thẻ này.
3. **"Có thể bé đang bị"**, khi `suggestions.length > 0`:
   - Tiêu đề 20 px. Ngay dưới là dòng 13 px `text-muted`: "Gợi ý theo triệu chứng đã chọn, không phải chẩn đoán." Dòng này viết thẳng trong component, **không** đưa vào `content/triage.vi.json`, vì test "never names a disease as a finding" trong `lib/content/triage.test.ts` cấm chữ "chẩn đoán" trong file nội dung.
   - Thanh tab `role="tablist"` (`aria-label="Bệnh có thể gặp"`), cuộn ngang khi tràn, ẩn thanh cuộn.
   - Mỗi tab là `<button role="tab" aria-selected aria-controls>`, cao tối thiểu 44 px, bo tròn hẳn, chữ là `short ?? title`. Tab đang chọn: nền `bg-glass-solid`, chữ đậm, có bóng nhẹ. Tab khác: nền trong suốt. Cả thanh nằm trong nền `bg-ink/8`, bo tròn hẳn, đệm 4 px.
   - Tab đầu tiên được chọn sẵn. Chạm vào tab thì chọn tab đó.
   - Bàn phím: chỉ tab đang chọn có `tabIndex=0`, các tab khác `-1`. Mũi tên trái/phải chọn tab trước/sau (vòng tròn) và chuyển focus sang tab đó; Home/End chọn tab đầu/cuối. Tab vừa chọn được cuộn vào tầm nhìn (`scrollIntoView({ block: "nearest", inline: "nearest" })`).
   - Bên dưới thanh tab là một `role="tabpanel"` (thẻ `Glass`), nội dung theo thứ tự:
     - "Khớp: " + `matched` nối bằng dấu phẩy (15 px, `text-muted`);
     - `summary`;
     - các mục "Dấu hiệu" (`signs`), "Chăm tại nhà" (`homeCare`), "Nên đi khám" (`seeDoctor`), mỗi mục có tiêu đề 15 px đậm và danh sách chấm;
     - khung `bg-danger-soft text-danger-ink` tiêu đề "Đi khám ngay", nội dung là `goNow`;
     - dòng 13 px `text-muted`: "Thường kéo dài: {usualCourse} · Nguồn: NHS (xem lại dd/mm/yyyy)", trong đó "NHS" là link tới `source`, mở tab mới.
   - Mức đỏ vẫn hiện khối này, đặt sau khối 2.
4. **Mức xanh và `suggestions` rỗng:** thẻ `Glass` "Chăm bé tại nhà" với `TRIAGE.homeCare`. Giữ như hiện tại.
5. Dòng "Đi khám ngay nếu xuất hiện: …" (`goNowIf`), chỉ khi mức không phải đỏ. Giữ như hiện tại.
6. `CallList`, lời miễn trừ, nút "Làm lại". Giữ như hiện tại.

Ghép dữ liệu trong `TriageScreen.submit()`:

- `selected = effectiveSymptoms(chip đã chọn, nhiệt độ)`;
- `suggestions = suggestConditions({ symptoms: TRIAGE.symptoms, articles: CONDITIONS.articles, selected, ageDays })`;
- `firstAid = firstAidFor({ blocks: TRIAGE.firstAid, checked, celsius, ageDays, questions: TRIAGE.questions })`;
- giữ nguyên `evaluateTriage(...)`.

### 6.3 Banner trang chủ

Logic của `lib/rules/alerts.ts` **không đổi**; chỉ sửa câu chú thích ở dòng 55–56. Bé từ 6 tháng sốt 38–39,9°C vẫn thấy banner vàng "Bé đang sốt — xem Phân loại triệu chứng." ở trang chủ. Banner này chỉ dẫn người dùng sang màn phân loại, không phải kết quả phân loại. Câu chú thích đó (đang nói ngưỡng sốt giữ giống `temperatureFindings`) đổi thành, bằng tiếng Anh như các chú thích khác trong file: "Banner thresholds stay as before; from 6 months, 38–39.9°C is green on the triage screen (spec 2026-11-17 §5.1)."

## 7. Test

- `lib/rules/triage.test.ts`: cập nhật bảng mốc của `temperatureFindings`.
  - `38` lúc `91` ngày → vàng; `38` lúc `182` ngày → vàng; `38` lúc `183` ngày → không có finding.
  - `39` lúc `183` ngày → không có finding; `39.9` lúc `700` ngày → không có finding; `40` lúc `700` ngày → đỏ.
  - `hasFever`: `null` → false, `37.9` → false, `38` → true.
  - Test "is red when any red finding matches, listing red ones first" (khoảng dòng 99) hiện mong chữ "Bé đang sốt từ 38°C trở lên". Đổi thành "Bé 3–6 tháng đang sốt từ 38°C trở lên"; giữ tuổi bé trong test ở khoảng 91–182 ngày để vẫn ra finding vàng.
- `lib/content/conditions.test.ts`: test "has the ten articles of spec §6.6 in order" đổi thành 19 bài theo thứ tự: 10 tiêu đề cũ, rồi 9 tiêu đề mới, mỗi tiêu đề một phần tử:
  1. "Sốt"
  2. "Viêm tai giữa"
  3. "Mọc răng"
  4. "Khóc dạ đề (colic)"
  5. "Rôm sảy"
  6. "Sốt phát ban (roseola)"
  7. "Tay chân miệng"
  8. "Viêm thanh quản (croup)"
  9. "Đau mắt đỏ, ghèn mắt"
- `lib/rules/symptoms.test.ts` (mới), dùng dữ liệu giả nhỏ:
  - lọc tuổi của `visibleSymptoms`, cả hai mốc;
  - `effectiveSymptoms` thêm `fever` khi nhiệt độ ≥ 38;
  - điểm `1/n` cộng dồn; hoà điểm thì theo thứ tự bài;
  - bỏ bài ngoài tuổi;
  - `matched` theo thứ tự triệu chứng;
  - không chọn gì → mảng rỗng;
  - `firstAidFor` khớp mã câu hỏi, khớp `@fever`, bỏ câu hỏi ẩn theo tuổi.
- `lib/content/triage.test.ts`, `lib/content/conditions.test.ts`:
  - mọi mã trong `suggests` có bài tương ứng;
  - mọi phần tử `when` là mã câu hỏi có thật hoặc `@fever`;
  - mọi `group` của triệu chứng có trong `groups`;
  - mã triệu chứng và mã bài không trùng;
  - mỗi bài trong bảng §4.4 có đúng `short` như bảng.
- `components/triage/triage.test.tsx`:
  - số `role="switch"` vẫn bằng số câu hỏi nhìn thấy;
  - số nút `aria-pressed` bằng số triệu chứng nhìn thấy theo tuổi của bé mẫu;
  - kết quả có `suggestions` render ra `role="tablist"`, đủ số `role="tab"`, tab đầu `aria-selected="true"`, và dòng "Khớp: …";
  - kết quả đỏ có `firstAid` khớp render ra tiêu đề khối và "Trên đường đi";
  - kết quả xanh không có `suggestions` vẫn có "Chăm bé tại nhà".
- `components/ui/sheet.test.tsx`: như §3.

## 8. Kiểm tay

Ghi vào `docs/device-checklist.md` thành bước mới, trạng thái chờ người dùng:

1. Popup "Ghi lại cho Bun" trên iPhone: đóng bằng ✕ và bằng bấm nền. Panel trượt hết, nền mờ dần, không giật.
2. `/trieu-chung` ở bề ngang 375 pt: chip xuống dòng, không tràn ngang. Thanh tab cuộn ngang được.
3. `/trieu-chung` với bé thật của gia đình: nhập 38,2, chọn "Sổ mũi, nghẹt mũi, hắt hơi" và "Dụi, kéo tai, quấy hơn khi nằm", không bật công tắc nào, bấm Xem kết quả. Điểm: Cảm lạnh = Viêm tai giữa = 2/3, Sổ mũi = 1/2, Mọc răng = 1/2 (chỉ khi bé từ 90 ngày), các bài còn lại có sốt = 1/6. Kết quả mong đợi theo tuổi bé:
   - dưới 90 ngày: thẻ đỏ "Bé dưới 3 tháng sốt từ 38°C trở lên", khối "Nếu bé đang sốt", "Trên đường đi", tab theo thứ tự Cảm lạnh, Viêm tai giữa, Sổ mũi, rồi các bài 1/6 (Sốt, Tay chân miệng, Croup);
   - đúng 90 ngày: như dòng trên, nhưng có thêm Mọc răng ngay sau Sổ mũi;
   - 91–182 ngày: thẻ vàng, thẻ "Trong lúc chờ đi khám" có khối sốt, tab Cảm lạnh, Viêm tai giữa, Sổ mũi, Mọc răng, rồi các bài 1/6 (Sốt, Tay chân miệng, Croup; từ 150 ngày có thêm Sốt phát ban, xếp sau Sốt);
   - từ 183 ngày: thẻ xanh "Theo dõi tại nhà", thẻ "Làm ngay tại nhà" có khối sốt, tab như dòng trên.
