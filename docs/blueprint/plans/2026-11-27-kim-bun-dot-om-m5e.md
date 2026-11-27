# Kim Bun — Đợt ốm M5e: vạch "Khám" trên biểu đồ và bảng "Lần khám" của Báo cáo Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (dòng "Lần khám (từ M5)" của §6.5; dòng "Sau bảng thuốc có bảng Lần khám (từ M5)" của §9; phần "`feverChartModel`" và "Báo cáo với kỳ Đợt ốm" của §10.1; phần "Báo cáo kỳ Đợt ốm" của §10.3; phần "thêm lần khám" và "in Báo cáo" của §10.4)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Biểu đồ sốt (trang chi tiết và Báo cáo) có một vạch dọc nét đứt kèm chữ "Khám" ở giờ mỗi lần khám; Báo cáo kỳ "Đợt ốm" có bảng "Lần khám" (Lúc khám, Nơi khám, Bác sĩ kết luận, Lời dặn). Hết mốc M5, hết spec.

**Architecture:**

- **Mô hình:** `feverChartModel` (`lib/rules/illness.ts`) nhận thêm giờ các lần khám và trả `visits` (chỗ của vạch, cách neo chữ, hay không chữ khi chữ chạm chữ trước); component chỉ vẽ.
- **Hình:** `FeverChart` thêm một dải cao 16 ở trên cùng (tọa độ âm của `viewBox`) chỉ khi có lần khám, nên hình không có lần khám không đổi gì; vạch vẽ trước các chấm.
- **Trang chi tiết:** `EpisodeScreen` chuyền giờ các lần khám của đợt (từ `useVisits` đã đọc ở M5d) vào `EpisodeBody`.
- **Báo cáo:** `ReportScreen` đọc `useVisits` chỉ ở kỳ "Đợt ốm", chờ nó như chờ bản ghi; `visitRows` (`lib/rules/report.ts`) làm các hàng của bảng.
- Không thêm gói, không thêm token màu, không thêm icon, không có migration.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m5e`, cắt từ `main` sau khi M5d đã lên. Baseline: 2044 test (213 file) vitest xanh, typecheck sạch.

**Các mốc của spec này:**

| Mốc      | Nội dung                                                                                                   | Plan                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| M1a, M1b | §3: bản ghi Triệu chứng                                                                                    | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md`, `…-m1b.md` (đã ở `main`)  |
| M2a–M2g  | §4, §5.1–5.3, §5.7, §6: đợt ốm, hai trang, lối vào ở Sức khỏe                                              | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md` … `…-m2g.md` (đã ở `main`) |
| M3a, M3b | §5.5, §5.6, §7: tab Hôm nay                                                                                | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3a.md`, `…-m3b.md` (đã ở `main`)  |
| M4a–M4c  | §5.4, §9: so sánh và Báo cáo                                                                               | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m4a.md` … `…-m4c.md`               |
| M5a      | §8.1: migration `20261126000300_illness_visits.sql`, pgTAP 018, kiểu `VisitRow`; áp lên Supabase thật      | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5a.md`                            |
| M5b      | §8.2 và phần luật của §8.4, §6.4: `useVisits`, `useVisitActions`, `lib/rules/visits.ts`                    | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5b.md`                            |
| M5c      | §8.4: sheet "Lần khám". Chỉ thấy trên trang tạm                                                            | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5c.md`                            |
| M5d      | §8.3, §6.3 mục 6, §6.4 từ M5: thẻ "Lần khám" trên trang chi tiết, luật tắt "Xóa đợt ốm"; Bước 38 mục 29–33 | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5d.md`                            |
| M5e      | §6.5 và §9 từ M5: vạch "Khám" trên biểu đồ, bảng "Lần khám" của Báo cáo; Bước 38 mục 34–35                 | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5e.md`                            |

Chạy theo thứ tự M5a → M5b → M5c → M5d → M5e, mỗi plan một phiên, mỗi plan lên `main` riêng. Chỉ M5a có migration; bốn plan sau cần migration đó đã áp lên Supabase thật (M5a không lên `main` được trước lúc đó).

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Chữ "Khám" ở "phía trên"** (§6.5): trong một dải riêng cao 16 đơn vị ở trên cùng của hình, trên cả chỗ dành cho nhãn giá trị; nên chữ không bao giờ đè lên nhãn giá trị, chữ "Sốt" hay "°C". Dải chỉ có khi trong các ngày được vẽ có lần khám; hình không có lần khám vẫn như cũ (`viewBox="0 0 330 204"`), có lần khám thì `viewBox="0 -16 330 220"`.
2. **Vạch** nét đứt `3 3`, màu `ink` mờ 45%, dày 1,25, chạy từ ngay dưới chữ tới đáy vùng vẽ, vẽ trước các chấm và đường nối (chấm nằm trên vạch). Khác đường 38,0 (ngang, đỏ) bằng hướng và màu, khác ranh giới ngày (liền, rất mờ) bằng nét đứt; ở theme `night` vẫn khác nhờ hướng và nét.
3. **Chữ "Khám"** 11 px, đậm 600, màu `muted`. Vạch gần mép trái hay phải (dưới 10% bề ngang) thì chữ neo đầu hay cuối vào vạch, như nhãn giá trị. Hai lần khám gần đến mức chữ chạm nhau (khoảng dưới 11% bề ngang, tức dưới nửa ngày trên trục một tuần) thì lần sau chỉ có vạch.
4. **Lần khám ngoài các ngày được vẽ** (đợt dài hơn 7 ngày; hay đợt bị sửa giờ tới mức lần khám rơi ra ngoài các ngày của đợt) thì không có vạch. Lần khám nằm ngoài giờ của đợt mà vẫn trong một ngày được vẽ thì vẫn có vạch (lần khám thuộc đợt theo `episode_id`, §8.1). Không có lần đo thì không có hình (§6.5), nên cũng không có vạch.
5. **Chú thích và `aria-label` không đổi** (câu của §6.5 không nói tới lần khám; thẻ "Lần khám" ngay dưới đã liệt kê đủ).
6. **Chỗ của bảng "Lần khám"** (§9): spec đặt cả bảng này và bảng "Triệu chứng" "sau bảng thuốc". Bảng "Lần khám" đứng ngay sau bảng thuốc, bảng "Triệu chứng" sau nó. Kỳ 7 và 14 ngày không có bảng "Lần khám", nên bảng "Triệu chứng" vẫn ngay sau bảng thuốc như M4b.
7. **Bảng có mọi lần khám của đợt** (theo `episode_id`, §8.1), cũ trước, kể cả lần nằm trước 14 ngày cuối của một đợt dài: bác sĩ cần các kết luận trước. Đợt chưa có lần khám thì không có bảng (như bảng "Triệu chứng"). Ô không có giá trị để trống. Lúc khám viết "{dd/mm} {HH:mm}" như các dòng nhiệt độ, và được xuống dòng giữa ngày và giờ: ở 375 px, giữ một dòng làm ba cột chữ hẹp tới mức lời dặn dài 20 dòng (thấy khi nhìn thử lúc viết plan). Lời dặn giữ các chỗ xuống dòng. Không in ảnh.
8. **Kỳ "Đợt ốm" chờ danh sách lần khám** như chờ bản ghi: báo cáo cho bác sĩ không được in thiếu một lần khám chỉ vì danh sách chưa tải. Đang tải: khung chờ, nút in tắt; mất mạng mà chưa từng tải: "Cần mạng để tải báo cáo. Trang sẽ tự tải khi có mạng lại."; lỗi: thẻ lỗi "Lần khám: …" có "Thử lại". Kỳ 7 và 14 ngày không tải lần khám (`useVisits(babyId, false)`), nên không bao giờ chờ nó.
9. **Bước 38 mục 34–35** do plan này thêm. Hết mục này, Bước 38 đủ phần của cả năm mốc.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 5** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5e.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 5 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `864a3ea` cộng 18 patch của M4a, M4b, M4c và 13 patch của M5a–M5d trích từ các file plan đó (nền tạm trong lúc M4 chưa lên `main`). Trong bản chạy thử mỗi task code là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Patch 5 được sinh trên spec và checklist đã có phần của M4 và M5b–M5d. `bun run build` đã chạy xanh trên bản sao ở trạng thái cuối của plan này (42 trang, `/bao-cao` và `/dot-om/chi-tiet` vẫn `○`).
- **Đo lại trên `main` thật.** Sau khi M4c lên, `main` @ `88caf0b` (cây code trùng khít nền tạm ở trên, chỉ khác các file plan) được chép ra một bản sao sạch; mọi patch của M5 trích từ chính các file plan được áp lần lượt lên đó và đo lại: đỏ và xanh của Task 1 (8 đỏ → 214/2053) và Task 2 (4 đỏ → 215/2057) đúng như ghi; `tsc` sạch; build 42/42. Cây cuối trùng bản chạy thử.
- **Đã nhìn thử khi viết plan.** Hai trang của trang tạm Task 3 đã được mở ở 375 px trên bản sao ở trạng thái cuối của plan này: số đo ở các mục của bước trình duyệt là của lần đó (theme `rose`; bản in giả lập ở `dark`). Lần nhìn ấy lộ ra cột Lúc khám ép ba cột chữ quá hẹp; Patch 4 đã cho cột đó xuống dòng (Diễn giải spec mục 7). Chưa xem: bề ngang 390 và 440, các theme `light`, `peach`, `lavender`, `sea`, bản xem trước khi in thật của trình duyệt, mọi trang thật.
- **Trang tạm của Báo cáo** vẽ `ReportScreen` thật trong một `QueryClient` riêng có sẵn dữ liệu giả, nên không đọc dữ liệu của gia đình. Riêng `useEpisodes` tự tải lại mỗi 60 giây, và vài query tự đặt `staleTime` 60 giây (tải lại khi khung được bấm vào lại sau một phút): console có thể có lỗi 400 (mã bé giả `fixture-baby` không phải uuid); trang giữ dữ liệu giả, bỏ qua các lỗi đó. Không có lệnh ghi nào.
- **Trình duyệt.** Dùng khung Browser trong app, cỡ 375×812 (`resize_window` preset `mobile`); người dùng đã chọn sẵn ngày 2026-11-26, không hỏi lại. Gọi `navigate` trước. Chỉ khi bộ kiểm quyền của app từ chối khung Browser thì hỏi người dùng đúng một câu rồi làm tiếp. Trang tạm vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập trong khung đó. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại `resize_window` và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt lại theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt nó khi xong. Bấm theo `ref` của `find`, không bấm theo tọa độ trên trang thật. Không đọc cả console: lọc bằng `onlyErrors` và `limit` nhỏ.
- **pgTAP.** Plan này không đổi DB nên không chạy pgTAP.
- **Người dùng muốn màn hình gọn, ít số.** Không thêm chữ nào ngoài plan. Không thêm câu thống kê nào về bé.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm token màu hay icon. `lib/themeGuard.test.ts` và `lib/ui/tokens.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", "Thêm", "Bắt đầu đợt ốm", "Bé đã khỏi", "Mở lại đợt ốm", "Xóa đợt ốm", không tải ảnh, không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc. Không bấm "In / Lưu PDF" trên trang thật.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `docs/device-checklist.md`.** File đó từ trước đã không theo prettier.
- **Các file plan chưa chạy chưa được commit.** `git status` có thể thấy các file plan khác là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng sau M5d và là plan cuối của spec. Không plan nào dùng thứ nó làm ra.

**Consumes (M5d):** `EpisodeScreen` đọc `useVisits(baby.id)`; `EpisodeBody` có `visits`; `components/illness/episodescreen.test.tsx` có mock `useVisits`, `usePhotoUrls` và test "the visits card lists this episode's visits"; Bước 38 mục 29–33.

**Consumes (M5b):** `type Visit`, `visitsKey`, `useVisits(babyId, enabled)` (`lib/data/illness.ts`); `visitsOf` (`lib/rules/visits.ts`).

**Consumes (M4):** `ReportScreen` với kỳ "Đợt ốm", `reportSelection`, `episodeReport`, `symptomRows`; `components/report/reportscreen.test.tsx` với các mock của nó; `FeverChartFigure`, `FeverChartCard`; khối in của `app/globals.css`.

**Consumes (M2):** `feverChartModel`, `type FeverChart`, `belongsTo` (`lib/rules/illness.ts`); `FeverChart` (`components/illness/FeverChart.tsx`); `lib/rules/feverChart.test.ts`, `components/illness/feverchart.test.tsx`.

**Produces:**

- `lib/rules/illness.ts`: `type FeverChartVisit = { x: number; word: "start" | "middle" | "end" | null }`; `FeverChart.visits: FeverChartVisit[]`; `feverChartModel(logs, episode, now, visitTimes: number[] = [])`.
- `components/illness/FeverChart.tsx`: `FeverChart` vẽ vạch (`line[data-visit]`) và chữ "Khám".
- `components/illness/EpisodeScreen.tsx`: `EpisodeBody` nhận thêm `visitTimes?: number[]`.
- `lib/rules/report.ts`: `visitRows(visits: { visited_at; place; conclusion; advice }[]): { at: string; place: string; conclusion: string; advice: string }[]`.
- `components/report/ReportScreen.tsx`: bảng "Lần khám" ở kỳ "Đợt ốm"; biểu đồ của báo cáo có vạch "Khám".
- `docs/device-checklist.md`: Bước 38 có mục 34–35 (đủ năm mốc).
- **Vitest sau M5e (hết M5):** 2057 test, 215 file.

---

### Task 1: Vạch "Khám" trên biểu đồ sốt (§6.5)

**Files:**

- Modify: `lib/rules/illness.ts` (`feverChartModel` nhận giờ các lần khám)
- Modify: `components/illness/FeverChart.tsx` (dải, vạch, chữ)
- Modify: `components/illness/EpisodeScreen.tsx` (chuyền giờ các lần khám của đợt)
- Test: `lib/rules/feverChartVisits.test.ts` (mới), `components/illness/feverchart.test.tsx`, `components/illness/episodescreen.test.tsx` (thêm)

**Interfaces:**

- Consumes: `useVisits` (đã đọc trong `EpisodeScreen`), `visitsOf`.
- Produces: `FeverChartVisit`, `FeverChart.visits`, `feverChartModel(…, visitTimes)`, `EpisodeBody({ …, visitTimes })`.

- [ ] **Step 0: Kiểm M5d đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
git log --oneline -20 main | grep "the M5d plan and its check results"
git checkout -b feat/kim-bun-dot-om-m5e
bunx vitest run
```

Expected: lệnh `grep` in đúng một dòng (không thấy thì dừng và báo người dùng); `Test Files  213 passed (213)`, `Tests  2044 passed (2044)`. `main` có thêm commit khác thì ghi lại số xuất phát thật.

- [ ] **Step 1: Viết test đỏ (Patch 1)**

`feverChartVisits.test.ts` (mới): không lần khám thì `visits` rỗng; chỗ của vạch; neo chữ ở hai mép; xếp theo giờ và bỏ chữ chạm chữ trước; lần khám ngoài 7 ngày được vẽ. `feverchart.test.tsx`: có lần khám thì cao thêm 16, vạch nét đứt, một chữ khi hai chữ chạm nhau; không lần khám thì như cũ. `episodescreen.test.tsx`: lần khám của đợt có vạch, lần khám của đợt khác thì không.

```diff
diff --git a/components/illness/episodescreen.test.tsx b/components/illness/episodescreen.test.tsx
index 0dd36fc..7e75675 100644
--- a/components/illness/episodescreen.test.tsx
+++ b/components/illness/episodescreen.test.tsx
@@ -232,6 +232,28 @@ describe("EpisodeScreen", () => {
     expect(html).toContain(">25/11 09:15 · Phòng khám Nhi</span>");
     expect(html).toContain(">Viêm họng</span>");
     expect(html).not.toContain("Chưa có lần khám nào.");
+    // Spec §6.5 from M5: the visit is marked on the chart too.
+    expect(html.match(/<line[^>]*data-visit/g)).toHaveLength(1);
+    expect(html).toContain(">Khám</text>");
+  });
+
+  it("a visit of another episode is not on this chart", () => {
+    const html = render({
+      visits: loaded([
+        {
+          id: "v9",
+          episode_id: "past",
+          baby_id: "b1",
+          visited_at: iso("2026-11-25 09:15"),
+          place: null,
+          conclusion: null,
+          advice: null,
+          created_by: "u1",
+          photos: [],
+        },
+      ]),
+    });
+    expect(html).not.toContain("Khám</text>");
   });
 
   // The page's clock moves once a minute; a log saved since its last tick is
diff --git a/components/illness/feverchart.test.tsx b/components/illness/feverchart.test.tsx
index b65c394..de5fda1 100644
--- a/components/illness/feverchart.test.tsx
+++ b/components/illness/feverchart.test.tsx
@@ -167,3 +167,31 @@ describe("FeverChartCard", () => {
     expect(html).not.toContain("Liều hạ sốt");
   });
 });
+
+// Spec §6.5 from M5: a band above the plot holds the word of each visit.
+describe("FeverChart with visits", () => {
+  const withVisits = feverChartModel(
+    [temp("2026-11-25 12:00", 38.6)],
+    episode("2026-11-25 08:00"),
+    vn("2026-11-25 20:00"),
+    [vn("2026-11-25 12:00").getTime(), vn("2026-11-25 13:00").getTime()],
+  )!;
+  const html = renderToStaticMarkup(<FeverChart chart={withVisits} />);
+
+  it("is 16 units taller: the band sits above the drawing", () => {
+    expect(html).toContain('viewBox="0 -16 330 220"');
+  });
+
+  it("draws a dashed line per visit and one word where it fits", () => {
+    expect(html.match(/<line[^>]*data-visit/g)).toHaveLength(2);
+    expect(html).toMatch(/<line[^>]*data-visit[^>]*stroke-dasharray="3 3"/);
+    expect(html.match(/>Khám<\/text>/g)).toHaveLength(1);
+    expect(html).toMatch(/<text[^>]*x="178"[^>]*y="-4"[^>]*>Khám<\/text>/);
+  });
+
+  it("without a visit the chart is as before", () => {
+    const plain = renderToStaticMarkup(<FeverChart chart={threeDays} />);
+    expect(plain).toContain('viewBox="0 0 330 204"');
+    expect(plain).not.toContain("Khám");
+  });
+});
diff --git a/lib/rules/feverChartVisits.test.ts b/lib/rules/feverChartVisits.test.ts
new file mode 100644
index 0000000..627ed8f
--- /dev/null
+++ b/lib/rules/feverChartVisits.test.ts
@@ -0,0 +1,80 @@
+import { describe, expect, it } from "vitest";
+import type { LogLike } from "./describeLog";
+import { type EpisodeLike, feverChartModel } from "./illness";
+
+const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
+const at = (text: string) => vn(text).getTime();
+const episode = (start: string): EpisodeLike => ({
+  id: "ep1",
+  started_at: vn(start).toISOString(),
+  ended_at: null,
+});
+const temp = (time: string, celsius: number): LogLike => ({
+  type: "temperature",
+  started_at: vn(time).toISOString(),
+  ended_at: vn(time).toISOString(),
+  details: { celsius, method: "nach" },
+});
+const round = (value: number) => Math.round(value * 1000) / 1000;
+const marks = (chart: ReturnType<typeof feverChartModel>) =>
+  chart!.visits.map((visit) => ({ ...visit, x: round(visit.x) }));
+
+// Spec 2026-11-26 §6.5 from M5: a dashed line with the word "Khám" above it.
+describe("feverChartModel, visits", () => {
+  const oneDay = (visits?: number[]) =>
+    feverChartModel(
+      [temp("2026-11-25 09:00", 38.6)],
+      episode("2026-11-25 08:00"),
+      vn("2026-11-25 20:00"),
+      visits,
+    );
+
+  it("no visit: no mark", () => {
+    expect(oneDay()!.visits).toEqual([]);
+    expect(oneDay([])!.visits).toEqual([]);
+  });
+
+  it("a visit sits at its time; the word is centred on it", () => {
+    expect(marks(oneDay([at("2026-11-25 12:00")]))).toEqual([
+      { x: 0.5, word: "middle" },
+    ]);
+  });
+
+  it("near an edge the word is anchored to stay inside the plot", () => {
+    expect(
+      marks(oneDay([at("2026-11-25 01:00"), at("2026-11-25 23:00")])),
+    ).toEqual([
+      { x: 0.042, word: "start" },
+      { x: 0.958, word: "end" },
+    ]);
+  });
+
+  it("oldest first; a word that would touch the one before it is left out, its line stays", () => {
+    expect(
+      marks(
+        oneDay([
+          at("2026-11-25 16:00"),
+          at("2026-11-25 12:00"),
+          at("2026-11-25 13:00"),
+        ]),
+      ),
+    ).toEqual([
+      { x: 0.5, word: "middle" },
+      { x: 0.542, word: null },
+      { x: 0.667, word: "middle" },
+    ]);
+  });
+
+  it("a visit outside the days drawn is not marked", () => {
+    const chart = feverChartModel(
+      [temp("2026-11-19 09:00", 38.6)],
+      episode("2026-11-10 08:00"),
+      vn("2026-11-20 10:00"),
+      [at("2026-11-12 09:00"), at("2026-11-19 12:00")],
+    );
+    expect(chart!.truncated).toBe(true);
+    expect(chart!.visits).toHaveLength(1);
+    // The 19th is the 6th of the 7 days drawn (14th to 20th).
+    expect(chart!.visits[0].x).toBeCloseTo(5.5 / 7);
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  3 failed | 211 passed (214)`, `Tests  8 failed | 2045 passed (2053)`. Tám test đỏ: năm của `feverChartVisits.test.ts` (`chart.visits` chưa có), hai của `FeverChart with visits`, một của `EpisodeScreen` (chưa có vạch).

- [ ] **Step 3: Vẽ vạch "Khám" (Patch 2)**

```diff
diff --git a/components/illness/EpisodeScreen.tsx b/components/illness/EpisodeScreen.tsx
index 6a7ced2..06796c6 100644
--- a/components/illness/EpisodeScreen.tsx
+++ b/components/illness/EpisodeScreen.tsx
@@ -26,7 +26,7 @@ import {
 } from "@/lib/rules/illness";
 import { planClose } from "@/lib/rules/illnessForm";
 import { dayRows, usualView, verdictView } from "@/lib/rules/illnessView";
-import { episodeDeleteBlock } from "@/lib/rules/visits";
+import { episodeDeleteBlock, visitsOf } from "@/lib/rules/visits";
 import type { Baby } from "@/lib/supabase/rows";
 import { EpisodeDayList } from "./EpisodeDayList";
 import { EpisodeSheet } from "./EpisodeSheet";
@@ -56,6 +56,7 @@ export function EpisodeBody({
   now,
   closing,
   visits = null,
+  visitTimes = [],
   onLog,
   onClose,
 }: {
@@ -67,6 +68,8 @@ export function EpisodeBody({
   closing: boolean;
   // Spec §6.3 item 6: the card "Lần khám" (§8.3), which reads by itself.
   visits?: ReactNode;
+  // The times of the episode's visits, marked on the chart (§6.5 from M5).
+  visitTimes?: number[];
   onLog: (type: QuickLogType) => void;
   onClose: () => void;
 }) {
@@ -76,7 +79,7 @@ export function EpisodeBody({
         view={verdictView({ episode, logs, babyName, now })}
         onLog={onLog}
       />
-      <FeverChartCard chart={feverChartModel(logs, episode, now)} />
+      <FeverChartCard chart={feverChartModel(logs, episode, now, visitTimes)} />
       <EpisodeDayList rows={dayRows(logs, episode, now)} />
       <EpisodeUsual view={usualView(logs, episode, now)} />
       {visits}
@@ -196,6 +199,9 @@ export function EpisodeScreen({
           babyName={baby.name}
           now={now}
           closing={actions.update.isPending}
+          visitTimes={visitsOf(visits.data ?? [], episode.id).map((visit) =>
+            Date.parse(visit.visited_at),
+          )}
           visits={
             <VisitsCard
               baby={baby}
diff --git a/components/illness/FeverChart.tsx b/components/illness/FeverChart.tsx
index c21bedd..a58505b 100644
--- a/components/illness/FeverChart.tsx
+++ b/components/illness/FeverChart.tsx
@@ -12,6 +12,10 @@ const BOTTOM = 154;
 // The row of dose marks under the plot, and the day names under that.
 const DOSE_Y = 170;
 const DAY_Y = 198;
+// The band above the drawing, at negative y, for the word "Khám" of a visit
+// (spec §6.5 from M5); there only when a visit is drawn, so a chart without
+// one is unchanged.
+const VISIT_BAND = 16;
 
 const MUTED = "var(--color-muted)";
 const INK = "var(--color-ink)";
@@ -27,11 +31,12 @@ const round = (value: number) => Math.round(value * 10) / 10;
 // as well as colour (theme night has one hue).
 export function FeverChart({ chart }: { chart: FeverChartModel }) {
   const feverY = round(py(chart.feverY));
+  const band = chart.visits.length > 0 ? VISIT_BAND : 0;
   return (
     <svg
       role="img"
       aria-label={chart.ariaLabel}
-      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
+      viewBox={`0 ${-band} ${WIDTH} ${HEIGHT + band}`}
       className="w-full"
     >
       <rect
@@ -76,6 +81,38 @@ export function FeverChart({ chart }: { chart: FeverChartModel }) {
           strokeOpacity={0.14}
         />
       ))}
+      {/* A visit: a dashed line through the plot, from just under its
+          word in the band above. */}
+      {chart.visits.map((visit, index) => (
+        <line
+          key={index}
+          data-visit
+          x1={round(px(visit.x))}
+          x2={round(px(visit.x))}
+          y1={0}
+          y2={BOTTOM}
+          stroke={INK}
+          strokeOpacity={0.45}
+          strokeWidth={1.25}
+          strokeDasharray="3 3"
+        />
+      ))}
+      {chart.visits.map(
+        (visit, index) =>
+          visit.word && (
+            <text
+              key={index}
+              x={round(px(visit.x))}
+              y={-4}
+              textAnchor={visit.word}
+              fontSize={11}
+              fontWeight={600}
+              fill={MUTED}
+            >
+              Khám
+            </text>
+          ),
+      )}
       <text x={6} y={11} fontSize={11} fill={MUTED}>
         °C
       </text>
diff --git a/lib/rules/illness.ts b/lib/rules/illness.ts
index a5d8884..9affec1 100644
--- a/lib/rules/illness.ts
+++ b/lib/rules/illness.ts
@@ -483,6 +483,8 @@ const SIDE_MAX_X = 0.85;
 const BELOW_MIN_Y = 0.2;
 // The word "Sốt" in the top band of the plot: right, left, then middle.
 const WORD_Y0 = 0.87;
+// The word "Khám" of a visit, about 30 px at 375 px wide.
+const VISIT_WORD_W = 0.11;
 const WORD_BOXES: { at: "start" | "middle" | "end"; x0: number; x1: number }[] =
   [
     { at: "end", x0: 0.9, x1: 1 },
@@ -512,6 +514,14 @@ export type FeverChartPoint = {
   label: FeverChartLabel | null;
 };
 
+// A doctor's visit (spec §6.5 from M5): a dashed line at its time, with the
+// word "Khám" above the plot. `word` is how the word is anchored on the line,
+// or null when it would touch the word of the visit before.
+export type FeverChartVisit = {
+  x: number;
+  word: "start" | "middle" | "end" | null;
+};
+
 export type FeverChart = {
   // The episode is longer than 7 days: only its last 7 are drawn.
   truncated: boolean;
@@ -529,6 +539,8 @@ export type FeverChart = {
   // Oldest first.
   points: FeverChartPoint[];
   doses: { at: number; x: number }[];
+  // Oldest first; only the visits inside the days drawn.
+  visits: FeverChartVisit[];
   ariaLabel: string;
 };
 
@@ -557,11 +569,13 @@ function labelBox(x: number, y: number, label: FeverChartLabel): Box {
 
 // Spec §6.5: everything the fever chart draws, as fractions of the plot; the
 // component only turns them into pixels. null when the episode has no reading
-// at all (the card then says so).
+// at all (the card then says so). `visitTimes` are the times of the episode's
+// doctor's visits, in ms.
 export function feverChartModel(
   logs: LogLike[],
   episode: EpisodeLike,
   now: Date,
+  visitTimes: number[] = [],
 ): FeverChart | null {
   const readings = episodeReadings(logs, episode, now);
   if (readings.length === 0) return null;
@@ -674,6 +688,24 @@ export function feverChartModel(
     .filter(inWindow)
     .map((at) => ({ at, x: xOf(at) }));
 
+  // The words sit in a band of their own above the plot, so they only have
+  // to keep off each other.
+  const visits: FeverChartVisit[] = [];
+  let wordEnd = -Infinity;
+  for (const at of visitTimes.filter(inWindow).sort((a, b) => a - b)) {
+    const x = xOf(at);
+    const anchor = anchorOf(x);
+    const x0 =
+      anchor === "start"
+        ? x
+        : anchor === "end"
+          ? x - VISIT_WORD_W
+          : x - VISIT_WORD_W / 2;
+    const free = x0 >= wordEnd;
+    if (free) wordEnd = x0 + VISIT_WORD_W;
+    visits.push({ x, word: free ? anchor : null });
+  }
+
   const highest = degrees.length > 0 ? Math.max(...degrees) : null;
   const ariaLabel = [
     `Biểu đồ nhiệt độ${count > CHART_DAYS ? ", 7 ngày gần nhất" : ""}: ${drawn.length} lần đo`,
@@ -703,6 +735,7 @@ export function feverChartModel(
     feverWord,
     points,
     doses,
+    visits,
     ariaLabel,
   };
 }
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  214 passed (214)`, `Tests  2053 passed (2053)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/illness.ts components/illness/FeverChart.tsx components/illness/EpisodeScreen.tsx lib/rules/feverChartVisits.test.ts components/illness/feverchart.test.tsx components/illness/episodescreen.test.tsx
git commit -m "feat(illness): doctor's visits on the fever chart" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Bảng "Lần khám" của Báo cáo (§9)

**Files:**

- Modify: `lib/rules/report.ts` (`visitRows`)
- Modify: `components/report/ReportScreen.tsx` (đọc lần khám ở kỳ "Đợt ốm", chờ nó, bảng, vạch trên biểu đồ)
- Test: `lib/rules/reportVisits.test.ts` (mới), `components/report/reportscreen.test.tsx` (thêm)

**Interfaces:**

- Consumes: `useVisits(babyId, enabled)`, `visitsOf`, `feverChartModel(…, visitTimes)` (Task 1).
- Produces: `visitRows`; bảng "Lần khám" của kỳ "Đợt ốm".

- [ ] **Step 1: Viết test đỏ (Patch 3)**

`reportVisits.test.ts` (mới): mỗi lần khám một hàng, ô trống khi không có giá trị. `reportscreen.test.tsx`: bảng bốn cột sau bảng thuốc và trước bảng "Triệu chứng", chỉ lần khám của đợt, hai vạch trên biểu đồ; không bảng khi không có lần khám hay ở kỳ 7 ngày (và kỳ 7 ngày không tải lần khám); kỳ "Đợt ốm" chờ lần khám (đang tải, mất mạng, lỗi).

```diff
diff --git a/components/report/reportscreen.test.tsx b/components/report/reportscreen.test.tsx
index 3a539b3..86267c6 100644
--- a/components/report/reportscreen.test.tsx
+++ b/components/report/reportscreen.test.tsx
@@ -7,7 +7,9 @@ import { ReportScreen } from "./ReportScreen";
 const NOW = new Date("2026-11-26T10:00:00+07:00");
 const useStatsLogs = vi.hoisted(() => vi.fn());
 const useRangeLogs = vi.hoisted(() => vi.fn());
+const useVisits = vi.hoisted(() => vi.fn());
 const state = vi.hoisted(() => ({
+  visits: {} as Record<string, unknown>,
   stats: {} as Record<string, unknown>,
   range: {} as Record<string, unknown>,
   episodes: {} as Record<string, unknown>,
@@ -15,7 +17,10 @@ const state = vi.hoisted(() => ({
 }));
 
 vi.mock("@/lib/data/logs", () => ({ useStatsLogs, useRangeLogs }));
-vi.mock("@/lib/data/illness", () => ({ useEpisodes: () => state.episodes }));
+vi.mock("@/lib/data/illness", () => ({
+  useEpisodes: () => state.episodes,
+  useVisits,
+}));
 vi.mock("@/lib/data/growth", () => ({
   useGrowth: () => loaded([]),
   useWhoTable: () => loaded(undefined),
@@ -103,9 +108,11 @@ function render(
     stats?: unknown[];
     range?: Record<string, unknown>;
     episodes?: Record<string, unknown>;
+    visits?: Record<string, unknown>;
     dot?: string | null;
   } = {},
 ) {
+  if (input.visits) state.visits = input.visits;
   state.stats = loaded(input.stats ?? []);
   if (input.range) state.range = input.range;
   if (input.episodes) state.episodes = input.episodes;
@@ -127,6 +134,9 @@ beforeEach(() => {
   useStatsLogs.mockImplementation(() => state.stats);
   useRangeLogs.mockReset();
   useRangeLogs.mockImplementation(() => state.range);
+  useVisits.mockReset();
+  useVisits.mockImplementation(() => state.visits);
+  state.visits = loaded([]);
   state.range = LOADING;
   state.episodes = loaded([]);
   state.search = "";
@@ -311,6 +321,101 @@ describe("ReportScreen: the episode period", () => {
     expect(html).not.toContain("Biểu đồ nhiệt độ");
   });
 
+  // Spec §9 from M5: the visits of the episode, after the medicines.
+  it("a table of the episode's visits after the medicines, and the visit on the chart", () => {
+    const visit = (id: string, episodeId: string, at: string, over = {}) => ({
+      id,
+      episode_id: episodeId,
+      visited_at: iso(at),
+      place: null,
+      conclusion: null,
+      advice: null,
+      photos: [],
+      ...over,
+    });
+    const html = render({
+      episodes: loaded([OPEN, PAST]),
+      range: loaded(EPISODE_LOGS),
+      visits: loaded([
+        visit("v2", "open", "2026-11-26 08:05"),
+        visit("v9", "past", "2026-10-11 09:00", { place: "Khác" }),
+        visit("v1", "open", "2026-11-25 09:15", {
+          place: "Phòng khám Nhi",
+          conclusion: "Viêm họng",
+          advice: "Uống nhiều nước",
+        }),
+      ]),
+      dot: "open",
+    });
+    expect(useVisits).toHaveBeenLastCalledWith("b1", true);
+    expect(html).toMatch(
+      /<h3[^>]*>Lần khám<\/h3><table[^>]*><thead><tr><th[^>]*>Lúc khám<\/th><th[^>]*>Nơi khám<\/th><th[^>]*>Bác sĩ kết luận<\/th><th[^>]*>Lời dặn<\/th><\/tr><\/thead>/,
+    );
+    const rows = [
+      ...html.matchAll(
+        /<tr class="break-inside-avoid"><td[^>]*>(\d\d\/\d\d \d\d:\d\d)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><\/tr>/g,
+      ),
+    ].map((match) => match.slice(1));
+    expect(rows).toContainEqual([
+      "25/11 09:15",
+      "Phòng khám Nhi",
+      "Viêm họng",
+      "Uống nhiều nước",
+    ]);
+    expect(rows).toContainEqual(["26/11 08:05", "", "", ""]);
+    expect(html).not.toContain("Khác");
+    const medicines = html.indexOf(">Thuốc đã dùng</h3>");
+    const visits = html.indexOf(">Lần khám</h3>");
+    const symptoms = html.indexOf(">Triệu chứng</h3>");
+    expect(medicines).toBeLessThan(visits);
+    expect(visits).toBeLessThan(symptoms);
+    expect(html.match(/<line[^>]*data-visit/g)).toHaveLength(2);
+  });
+
+  it("no visit, or 7 days: no visits table; 7 days do not ask for them", () => {
+    const html = render({
+      episodes: loaded([OPEN]),
+      range: loaded(EPISODE_LOGS),
+      dot: "open",
+    });
+    expect(html).not.toContain(">Lần khám</h3>");
+    expect(render({ episodes: loaded([OPEN]) })).not.toContain(
+      ">Lần khám</h3>",
+    );
+    expect(useVisits).toHaveBeenLastCalledWith("b1", false);
+  });
+
+  it("the episode period waits for the visits, like the other data", () => {
+    const loading = render({
+      episodes: loaded([OPEN]),
+      range: loaded(EPISODE_LOGS),
+      visits: LOADING,
+      dot: "open",
+    });
+    expect(loading).toContain("kb-pulse");
+    expect(loading).toMatch(/disabled=""[^>]*>.*In \/ Lưu PDF/);
+    expect(loading).not.toContain(">Nhiệt độ</h3>");
+    expect(
+      render({
+        episodes: loaded([OPEN]),
+        range: loaded(EPISODE_LOGS),
+        visits: OFFLINE,
+        dot: "open",
+      }),
+    ).toContain("Cần mạng để tải báo cáo. Trang sẽ tự tải khi có mạng lại.");
+    const failed = render({
+      episodes: loaded([OPEN]),
+      range: loaded(EPISODE_LOGS),
+      visits: FAILED,
+      dot: "open",
+    });
+    expect(failed).toContain("Lần khám: Có lỗi xảy ra: boom");
+    // The 7 days never wait for the visits.
+    expect(render({ episodes: loaded([OPEN]), visits: LOADING })).toContain(
+      ">Thuốc đã dùng</h3>",
+    );
+  });
+
   it("longer than 14 days: the last 14, and it says so", () => {
     const long = episode("long", "2026-10-01 08:00", "2026-10-20 09:00");
     const html = render({
diff --git a/lib/rules/reportVisits.test.ts b/lib/rules/reportVisits.test.ts
new file mode 100644
index 0000000..85b4100
--- /dev/null
+++ b/lib/rules/reportVisits.test.ts
@@ -0,0 +1,38 @@
+import { describe, expect, it } from "vitest";
+import { visitRows } from "./report";
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const visit = (
+  at: string,
+  over: { place?: string; conclusion?: string; advice?: string } = {},
+) => ({
+  visited_at: iso(at),
+  place: over.place ?? null,
+  conclusion: over.conclusion ?? null,
+  advice: over.advice ?? null,
+});
+
+// Spec 2026-11-26 §9 from M5: the table "Lần khám" of the episode period.
+describe("visitRows", () => {
+  it("one row per visit, in the order given: time, place, conclusion, advice", () => {
+    expect(
+      visitRows([
+        visit("2026-11-25 09:15", {
+          place: "Phòng khám Nhi",
+          conclusion: "Viêm họng",
+          advice: "Uống nhiều nước",
+        }),
+        visit("2026-11-26 08:05"),
+      ]),
+    ).toEqual([
+      {
+        at: "25/11 09:15",
+        place: "Phòng khám Nhi",
+        conclusion: "Viêm họng",
+        advice: "Uống nhiều nước",
+      },
+      { at: "26/11 08:05", place: "", conclusion: "", advice: "" },
+    ]);
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 213 passed (215)`, `Tests  4 failed | 2053 passed (2057)`. Bốn test đỏ: một của `visitRows` (`visitRows is not a function`), ba mới của `ReportScreen: the episode period`.

- [ ] **Step 3: Viết bảng (Patch 4)**

```diff
diff --git a/components/report/ReportScreen.tsx b/components/report/ReportScreen.tsx
index e5c7ca7..11040a7 100644
--- a/components/report/ReportScreen.tsx
+++ b/components/report/ReportScreen.tsx
@@ -13,7 +13,7 @@ import { VACCINES } from "@/lib/content/vaccines";
 import { whoSex, type LmsRow } from "@/lib/content/who";
 import { toVietnameseError } from "@/lib/data/errors";
 import { useGrowth, useWhoTable } from "@/lib/data/growth";
-import { useEpisodes } from "@/lib/data/illness";
+import { useEpisodes, useVisits } from "@/lib/data/illness";
 import { useRangeLogs, useStatsLogs } from "@/lib/data/logs";
 import { useNow } from "@/lib/hooks/useNow";
 import { useVaccineDoses } from "@/lib/data/vaccines";
@@ -34,10 +34,12 @@ import {
   symptomRows,
   temperatureRows,
   vaccineSummary,
+  visitRows,
 } from "@/lib/rules/report";
 import { formatAgeVi, vnDateString } from "@/lib/rules/time";
 import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
 import { buildSchedule } from "@/lib/rules/vaccines";
+import { visitsOf } from "@/lib/rules/visits";
 import type { Baby } from "@/lib/supabase/rows";
 
 const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
@@ -84,6 +86,9 @@ export function ReportScreen({
     report !== null,
   );
   const logs = report ? rangeLogs : statsLogs;
+  // Spec §9 from M5: the episode's visits, read only for the episode period.
+  const visits = useVisits(baby.id, report !== null);
+  const episodeVisits = episode ? visitsOf(visits.data ?? [], episode.id) : [];
   const growth = useGrowth(baby.id);
   const doses = useVaccineDoses(baby.id);
   const sex = whoSex(baby.sex);
@@ -101,7 +106,15 @@ export function ReportScreen({
   const temperatures = temperatureRows(own, fromMs);
   const medicines = medicineRows(own, fromMs);
   const symptoms = symptomRows(own, fromMs);
-  const chart = episode ? feverChartModel(rows, episode, now) : null;
+  const visitTable = visitRows(episodeVisits);
+  const chart = episode
+    ? feverChartModel(
+        rows,
+        episode,
+        now,
+        episodeVisits.map((visit) => Date.parse(visit.visited_at)),
+      )
+    : null;
   const measures = growthSummary(
     growth.data ?? [],
     {
@@ -123,10 +136,17 @@ export function ReportScreen({
   const cell = "border border-line px-2 py-1 print:border-ink";
   // A report for a doctor must never print "nothing recorded" while data is
   // still loading or failed to load (offline without a cache).
-  const ready = Boolean(selection && logs.data && growth.data && doses.data);
+  const ready = Boolean(
+    selection &&
+    logs.data &&
+    growth.data &&
+    doses.data &&
+    (report === null || visits.data),
+  );
   const failures = [
     ...(selection ? [] : [{ label: "Đợt ốm", query: episodes }]),
     { label: "Nhật ký", query: logs },
+    ...(report ? [{ label: "Lần khám", query: visits }] : []),
     { label: "Tăng trưởng", query: growth },
     { label: "Tiêm chủng", query: doses },
   ].filter(({ query }) => query.isError && !query.data);
@@ -161,9 +181,12 @@ export function ReportScreen({
         ))}
         {!ready &&
           failures.length === 0 &&
-          ([selection ? logs : episodes, growth, doses].some(
-            waitingForNetwork,
-          ) ? (
+          ([
+            selection ? logs : episodes,
+            growth,
+            doses,
+            ...(report ? [visits] : []),
+          ].some(waitingForNetwork) ? (
             <NeedsNetwork what="báo cáo" />
           ) : (
             <div className="flex flex-col gap-2.5">
@@ -267,6 +290,38 @@ export function ReportScreen({
             )}
           </section>
 
+          {/* Spec 2026-11-26 §9 from M5: the visits of the episode, without
+              their photos; only when it has one. */}
+          {visitTable.length > 0 && (
+            <section>
+              <h3 className="font-semibold">Lần khám</h3>
+              <table className="w-full border-collapse text-left">
+                <thead>
+                  <tr>
+                    <th className={cell}>Lúc khám</th>
+                    <th className={cell}>Nơi khám</th>
+                    <th className={cell}>Bác sĩ kết luận</th>
+                    <th className={cell}>Lời dặn</th>
+                  </tr>
+                </thead>
+                <tbody>
+                  {visitTable.map((row, i) => (
+                    <tr key={i} className="break-inside-avoid">
+                      {/* The time may break after its day: on a phone the
+                          three columns of text need the room. */}
+                      <td className={`${cell} tabular-nums`}>{row.at}</td>
+                      <td className={cell}>{row.place}</td>
+                      <td className={cell}>{row.conclusion}</td>
+                      <td className={`${cell} whitespace-pre-line`}>
+                        {row.advice}
+                      </td>
+                    </tr>
+                  ))}
+                </tbody>
+              </table>
+            </section>
+          )}
+
           {/* Spec 2026-11-26 §9: only when the period has a symptom log. */}
           {symptoms.length > 0 && (
             <section>
diff --git a/lib/rules/report.ts b/lib/rules/report.ts
index f93965c..25802f7 100644
--- a/lib/rules/report.ts
+++ b/lib/rules/report.ts
@@ -103,6 +103,25 @@ export function symptomRows(
     });
 }
 
+// Spec 2026-11-26 §9 from M5: the table "Lần khám" of the episode period, a
+// row per visit in the order given; an empty field is an empty cell. No
+// photo is printed.
+export function visitRows(
+  visits: {
+    visited_at: string;
+    place: string | null;
+    conclusion: string | null;
+    advice: string | null;
+  }[],
+): { at: string; place: string; conclusion: string; advice: string }[] {
+  return visits.map((visit) => ({
+    at: when(visit.visited_at),
+    place: visit.place ?? "",
+    conclusion: visit.conclusion ?? "",
+    advice: visit.advice ?? "",
+  }));
+}
+
 export type ReportPeriod = "7" | "14" | "dot";
 
 // Spec 2026-11-26 §9: the period the report shows. `picked` is the choice
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  215 passed (215)`, `Tests  2057 passed (2057)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/report.ts components/report/ReportScreen.tsx lib/rules/reportVisits.test.ts components/report/reportscreen.test.tsx
git commit -m "feat(report): the doctor's visits of the episode period" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M5e, checklist, spec, rồi đưa lên `main`

**Files:**

- Create rồi xóa (không commit): `app/fixture-report-visits/page.tsx`
- Modify: `docs/device-checklist.md` (Bước 38 mục 34–35), `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§6.5, §9)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của Task 1 và Task 2.
- Produces: kết quả kiểm, ghi ngay trong plan; Bước 38 mục 34–35; hai đoạn đọc spec; `main` có M5e (hết spec).

- [ ] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  215 passed (215)`, `Tests  2057 passed (2057)`.

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages using 9 workers (42/42)`, dòng `├ ○ /bao-cao` và `├ ○ /dot-om/chi-tiet` (vẫn tĩnh), và thoát mã 0.

- [ ] **Step 3: Tạo trang fixture tạm**

Gia đình chưa có đợt ốm và không được tạo đợt hay lần khám trên dữ liệu thật, nên vạch "Khám" và bảng chỉ thấy đủ ở đây. `?view=chart` vẽ ba thẻ biểu đồ (một ngày: một đợt đã đóng của hôm qua, để hình không phụ thuộc giờ mở trang; ba ngày với hai lần khám gần nhau; 7 ngày cuối của một đợt 13 ngày, có một lần khám trước 7 ngày đó); không tham số `view` thì vẽ `ReportScreen` thật với một đợt đang mở từ hôm kia, bản ghi và ba lần khám giả (mở bằng `?dot=open`). Giờ tính từ hôm nay. Tạo `app/fixture-report-visits/page.tsx` (không commit):

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FeverChartCard } from "@/components/illness/FeverChart";
import { ReportScreen } from "@/components/report/ReportScreen";
import { type Visit, visitsKey } from "@/lib/data/illness";
import { logsKey } from "@/lib/data/logs";
import { episodesKey, growthKey, vaccineDosesKey } from "@/lib/data/outbox";
import { statsFetchSince } from "@/lib/rules/dailyStats";
import { addDays, vnDayRange } from "@/lib/rules/days";
import type { LogLike } from "@/lib/rules/describeLog";
import { feverChartModel } from "@/lib/rules/illness";
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
const OPEN = episode("open", at(-2, "23:30"), null);
const LONG = episode("long", at(-12, "08:00"), null);
let n = 0;
const log = (type: string, start: string, details: unknown) =>
  ({
    id: `fixture-${(n += 1)}`,
    baby_id: BABY.id,
    type,
    started_at: start,
    ended_at: start,
    details,
    note: null,
  }) as LogRow;
const LOGS: LogRow[] = [
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
  log("symptom", at(-1, "08:00"), { codes: ["cough"] }),
];
const visit = (
  id: string,
  episodeId: string,
  time: string,
  over: Partial<Visit> = {},
): Visit =>
  ({
    id,
    episode_id: episodeId,
    baby_id: BABY.id,
    visited_at: time,
    place: null,
    conclusion: null,
    advice: null,
    created_by: "fixture",
    created_at: time,
    updated_at: time,
    photos: [],
    ...over,
  }) as Visit;
const VISITS: Visit[] = [
  visit("v1", "open", at(-1, "09:15"), {
    place: "Phòng khám Nhi Đồng 2, cơ sở Lý Tự Trọng, quận 1",
    conclusion: "Viêm họng cấp, theo dõi thêm viêm tai giữa bên phải",
    advice:
      "Uống nhiều nước, chia nhỏ cữ bú. Hạ sốt khi trên 38,5 độ, cách nhau ít nhất 4 tiếng.\nTái khám ngay nếu sốt cao không hạ, thở nhanh, bỏ bú.",
  }),
  visit("v2", "open", at(-1, "11:30")),
  visit("v3", "open", at(0, "08:05"), { place: "Nhà" }),
];

// The chart alone: one day (yesterday, closed, so it does not depend on
// the hour the page is opened), three days with two visits close together, and
// the last 7 days of a long episode with a visit before them.
function Charts() {
  const now = new Date();
  const times = (list: string[]) => list.map((time) => Date.parse(time));
  const cases = [
    {
      name: "1 ngày",
      chart: feverChartModel(
        [log("temperature", at(-1, "06:00"), { celsius: 38.6, method: "nach" })],
        episode("one", at(-1, "05:00"), at(-1, "20:00")),
        now,
        times([at(-1, "07:30")]),
      ),
    },
    {
      name: "3 ngày, hai lần khám gần nhau",
      chart: feverChartModel(
        LOGS,
        OPEN,
        now,
        times(VISITS.map((v) => v.visited_at)),
      ),
    },
    {
      name: "13 ngày, 7 ngày cuối",
      chart: feverChartModel(
        [
          log("temperature", at(-3, "09:00"), {
            celsius: 39.6,
            method: "nach",
          }),
        ],
        LONG,
        now,
        times([at(-11, "09:00"), at(-3, "10:00")]),
      ),
    },
  ];
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      {cases.map((item) => (
        <section key={item.name} className="flex flex-col gap-2">
          <h2>{item.name}</h2>
          <FeverChartCard chart={item.chart} />
        </section>
      ))}
    </main>
  );
}

function Report({ dot }: { dot: string | null }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    const now = new Date();
    queryClient.setQueryData(episodesKey(BABY.id), [OPEN]);
    queryClient.setQueryData(growthKey(BABY.id), []);
    queryClient.setQueryData(vaccineDosesKey(BABY.id), []);
    queryClient.setQueryData(visitsKey(BABY.id), VISITS);
    for (const count of [7, 14])
      queryClient.setQueryData(
        [...logsKey(BABY.id), "stats", statsFetchSince(vnDayRange(now, count))],
        LOGS,
      );
    const report = episodeReport(OPEN, now);
    queryClient.setQueryData(
      [...logsKey(BABY.id), "range", report.from, report.to ?? "open"],
      LOGS,
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <ReportScreen baby={BABY} dot={dot} />
    </QueryClientProvider>
  );
}

function Fixture() {
  const params = useSearchParams();
  return params.get("view") === "chart" ? (
    <Charts />
  ) : (
    <Report dot={params.get("dot")} />
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

Run: `bun run typecheck`
Expected: `tsc --noEmit` không báo lỗi.

- [ ] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở các trang dưới trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp. Ngày ghi dưới đây là của lần viết plan (hôm nay 27/11); lúc chạy thì theo hôm nay.

Trên trang tạm `http://localhost:3000/fixture-report-visits?view=chart`, theme `rose`:

1. Chạy đoạn đo dưới. Kỳ vọng: ba hình 317×211; số vạch 1, 3, 1; số chữ "Khám" 1, 2, 1 (ở hình thứ hai, hai lần khám 09:15 và 11:30 cùng ngày chỉ có một chữ); mọi chữ "Khám" nằm trong hình và không chạm chữ nào khác; `aria-label` không nhắc tới lần khám. Nhìn: vạch nét đứt xám đi từ ngay dưới chữ "Khám" xuống đáy vùng vẽ, chấm và nhãn giá trị nằm trên vạch. Khi viết plan đúng như vậy (ảnh `m5-bieu-do-kham-375-rose.jpg`).

```js
const hit = (a, b) =>
  !(
    a.right <= b.left ||
    b.right <= a.left ||
    a.bottom <= b.top ||
    b.bottom <= a.top
  );
JSON.stringify(
  [...document.querySelectorAll("svg[role=img]")].map((svg) => {
    const words = [...svg.querySelectorAll("text")].filter(
      (t) => t.textContent === "Khám",
    );
    const others = [...svg.querySelectorAll("text")].filter(
      (t) => t.textContent !== "Khám",
    );
    const box = svg.getBoundingClientRect();
    return {
      size: [Math.round(box.width), Math.round(box.height)],
      lines: svg.querySelectorAll("line[data-visit]").length,
      words: words.length,
      inside: words.every((t) => {
        const b = t.getBoundingClientRect();
        return b.left >= box.left && b.right <= box.right && b.top >= box.top;
      }),
      touching: words.some((t) =>
        others.some((o) =>
          hit(t.getBoundingClientRect(), o.getBoundingClientRect()),
        ),
      ),
      aria: svg.getAttribute("aria-label"),
    };
  }),
);
```

2. Đặt `document.documentElement.dataset.theme = "night"`, rồi `"dark"`, `"light"`. Kỳ vọng: vạch và chữ "Khám" đọc được, khác đường 38 nét đứt đỏ; ở hình thứ hai, chữ "Sốt" (không có viền nền) vẫn đọc được khi một vạch chạy gần nó.

Trên trang tạm `http://localhost:3000/fixture-report-visits?dot=open`, theme `rose`:

3. Kỳ vọng: đang chọn "Đợt ốm"; các tiêu đề mục theo thứ tự "Theo ngày", "Nhiệt độ", "Thuốc đã dùng", "Lần khám", "Triệu chứng", "Tăng trưởng (lần đo gần nhất)", "Tiêm chủng"; biểu đồ có 3 vạch; bảng "Lần khám" ba hàng: "26/11 09:15" với nơi khám, kết luận, lời dặn dài; "26/11 11:30" ba ô trống; "27/11 08:05" với "Nhà"; nút "In / Lưu PDF" bấm được. Bốn cột rộng 63, 80, 71 và 94 px; ba hàng cao 417, 57 và 57 px; giờ xuống dòng giữa ngày và giờ; không chữ nào bị cắt; `document.documentElement.scrollWidth <= innerWidth`. Khi viết plan đúng như vậy (ảnh `m5-bao-cao-lan-kham-375-rose.jpg`).
4. Đặt `document.documentElement.dataset.theme = "dark"`, rồi giả lập bản in bằng đoạn dưới (chép mọi luật `@media print` vào một thẻ `<style>`; không bấm in). Kỳ vọng: `--color-ink` #000, `--color-muted` #444; chữ "Khám" màu `rgb(68, 68, 68)`, vạch `rgb(0, 0, 0)`; phần điều khiển ẩn; bảng "Lần khám" chữ đen trên nền trắng. Khi viết plan đúng như vậy (ảnh `m5-bao-cao-ban-in-gia-lap-theme-dark.jpg`; viền ô của bảng do lớp `print:` của Tailwind chỉ thấy khi in thật, như bảng "Triệu chứng" của M4b).

```js
const rules = [];
for (const sheet of document.styleSheets) {
  try {
    for (const rule of sheet.cssRules)
      if (rule.media && rule.media.mediaText.includes("print"))
        for (const inner of rule.cssRules) rules.push(inner.cssText);
  } catch {}
}
const style = document.createElement("style");
style.textContent = rules.join("\n");
document.head.appendChild(style);
const svg = document.querySelector("svg[role=img]");
svg.scrollIntoView();
const css = getComputedStyle(document.documentElement);
JSON.stringify({
  ink: css.getPropertyValue("--color-ink").trim(),
  muted: css.getPropertyValue("--color-muted").trim(),
  word: getComputedStyle(
    [...svg.querySelectorAll("text")].find((t) => t.textContent === "Khám"),
  ).fill,
  line: getComputedStyle(svg.querySelector("line[data-visit]")).stroke,
});
```

5. `?dot=open`, bấm "7 ngày" (theo `ref` của `find`). Kỳ vọng: không có bảng "Lần khám", không có biểu đồ; bảng "Triệu chứng" ngay sau "Thuốc đã dùng".

Trang thật (dữ liệu thật của gia đình: **chỉ xem**; cần đăng nhập trong khung Browser):

6. Mở `http://localhost:3000/bao-cao` bằng `navigate` (tải trang mới, không bấm từ trang khác tới: Resource Timing giữ các lệnh đọc của trang trước): kỳ 7 ngày như trước; Resource Timing (`performance.getEntriesByType("resource")`, lọc tên chứa `/rest/v1/`; chỉ in `pathname` và `responseStatus`) **không** có lệnh đọc `illness_visits`. Nếu gia đình có đợt ốm (do người dùng tự tạo): bấm "Đợt ốm"; kỳ vọng lệnh đọc `illness_visits` trả 200, báo cáo hiện (có bảng "Lần khám" nếu đợt có lần khám). Không bấm "In / Lưu PDF". Lọc console bằng `onlyErrors`: không có lỗi. `scrollWidth <= innerWidth`.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo; mục nào thấy trên trang thật, mục nào chỉ thấy trên trang tạm. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

- [ ] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-report-visits
bun run typecheck
git status --short  # không còn app/fixture-report-visits
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts`: chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [ ] **Step 6: Phần M5e của Bước 38 và các chỗ đọc spec (Patch 5), commit**

```diff
diff --git a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
index 1296003..892578c 100644
--- a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
+++ b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
@@ -313,6 +313,7 @@ Hàm thuần `feverChartModel` trong `lib/rules/illness.ts` trả về điểm,
 - Lần đo: chấm tròn nối bằng đường liền, màu `cat-temp`. Chấm mới nhất to hơn, có nhãn giá trị. Lần đo cao nhất ≥ 38,0 cũng có nhãn giá trị (trùng chấm mới nhất thì một nhãn).
 - Liều hạ sốt: hình thoi màu `cat-med` trên một hàng riêng dưới vùng vẽ.
 - Lần khám (từ M5): vạch dọc nét đứt có chữ "Khám" phía trên.
+- Chữ "Khám" nằm trong một dải cao 16 đơn vị trên cùng của hình; dải chỉ có khi trong các ngày được vẽ có lần khám, nên hình không có lần khám vẫn như cũ. Vạch gần mép thì chữ neo đầu hay cuối vào vạch; hai lần khám gần đến mức chữ chạm nhau thì lần sau chỉ có vạch. Lần khám ngoài các ngày được vẽ thì không có vạch. Chú thích và `aria-label` không đổi. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói mấy chỗ này. Chọn ở M5e ngày 2026-11-27 theo lời duyệt trước của người dùng.)
 - Chú thích: "Nhiệt độ", "Liều hạ sốt", "Từ 38°C là sốt".
 - Không có lần đo: thẻ chỉ ghi "Chưa có lần đo nào trong đợt này."
 - `role="img"` với `aria-label` nêu số lần đo, giá trị cao nhất và số liều.
@@ -441,6 +442,7 @@ alter table public.photos add foreign key (visit_id, baby_id)
   - Biểu đồ §6.5 đứng trước bảng nhiệt độ và in ra giấy.
   - Dòng "14 ngày cuối của đợt ốm" là một dòng riêng, ngay dưới dòng "Đợt ốm …". Biểu đồ nằm trong mục "Nhiệt độ", giữa tiêu đề và các dòng đo, và chỉ có khi 7 ngày nó vẽ có lần đo (không in một khung trống). Trên giấy, biểu đồ mang màu của theme sáng (đường, chấm, hình thoi, vùng sốt, chữ "38" và "Sốt"), kể cả khi app đang ở theme tối. Mở bằng `?dot=` khi danh sách đợt ốm chưa tải xong thì trang chờ (khung chờ; mất mạng: "Cần mạng để tải báo cáo. …"; lỗi: thẻ lỗi "Đợt ốm: …"), không hiện tạm kỳ 7 ngày. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bốn chỗ này. Chọn ở M4c ngày 2026-11-27 theo lời duyệt trước của người dùng.)
   - Sau bảng thuốc có bảng "Lần khám" (từ M5): Lúc khám, Nơi khám, Bác sĩ kết luận, Lời dặn. Không in ảnh.
+  - Bảng "Lần khám" đứng sau bảng thuốc và trước bảng "Triệu chứng" (spec đặt cả hai sau bảng thuốc). Bảng có mọi lần khám của đợt theo `episode_id`, cũ trước, kể cả lần nằm trước 14 ngày cuối; đợt chưa có lần khám thì không có bảng. Ô không có giá trị để trống; ô Lúc khám viết "{dd/mm} {HH:mm}" và được xuống dòng giữa ngày và giờ trên màn hình hẹp; lời dặn giữ các chỗ xuống dòng. Biểu đồ của báo cáo cũng có vạch "Khám". Kỳ "Đợt ốm" chờ danh sách lần khám như chờ bản ghi (khung chờ; mất mạng: "Cần mạng để tải báo cáo. …"; lỗi: thẻ lỗi "Lần khám: …"); kỳ 7 và 14 ngày không tải lần khám. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói mấy chỗ này. Chọn ở M5e ngày 2026-11-27 theo lời duyệt trước của người dùng.)
 - Với mọi kỳ: khi kỳ có bản ghi `symptom`, sau bảng thuốc có bảng "Triệu chứng": Giờ, Triệu chứng (các `short`), Ghi chú.
 - Kỳ 7 và 14 ngày: ngoài bảng "Triệu chứng", không đổi gì.
 - Bảng "Triệu chứng": mỗi bản ghi một hàng, cũ trước; Giờ viết "{dd/mm} {HH:mm}" như các dòng nhiệt độ. Mã không còn trong nội dung thì bỏ; bản ghi chỉ còn mã lạ thì ô Triệu chứng để trống. Không có ghi chú thì ô Ghi chú để trống. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói ba chỗ này. Chọn ở M4b ngày 2026-11-27 theo lời duyệt trước của người dùng.)
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index d02134b..572eb12 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -646,7 +646,7 @@ Kết quả: Chờ người dùng.
 
 ## Bước 38 — Đợt ốm (spec 2026-11-26)
 
-Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23, bảng "Triệu chứng" của Báo cáo là mục 24, kỳ "Đợt ốm" của Báo cáo và nút "Báo cáo cho bác sĩ" là mục 25–28; phần của mốc M5 (lần khám, spec §8) bắt đầu từ mục 29: thẻ và sheet "Lần khám" là mục 29–33. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó. Mục 24 tạo một bản ghi Triệu chứng thử và xóa nó. Mục 25 tạo một đợt ốm thử và một bản ghi nhiệt độ thử; mục 28 xóa cả hai. Mục 29 tạo một đợt ốm thử, một lần khám thử và một ảnh thử, mục 33 thêm một ảnh thử nữa; mục 33 xóa hết.
+Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23, bảng "Triệu chứng" của Báo cáo là mục 24, kỳ "Đợt ốm" của Báo cáo và nút "Báo cáo cho bác sĩ" là mục 25–28; phần của mốc M5 (lần khám, spec §8) là mục 29–35: thẻ và sheet "Lần khám" là mục 29–33, vạch "Khám" trên biểu đồ và bảng "Lần khám" của Báo cáo là mục 34–35. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó. Mục 24 tạo một bản ghi Triệu chứng thử và xóa nó. Mục 25 tạo một đợt ốm thử và một bản ghi nhiệt độ thử; mục 28 xóa cả hai. Mục 29 tạo một đợt ốm thử, một lần khám thử và một ảnh thử, mục 33 thêm một ảnh thử nữa; mục 33 xóa hết. Mục 34 tạo một đợt ốm thử, một bản ghi nhiệt độ thử và một lần khám thử; mục 35 xóa hết.
 
 1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
 2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
@@ -681,6 +681,8 @@ Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; ph
 31. Bật chế độ máy bay. Kỳ vọng: thẻ "Lần khám" có dòng "Cần kết nối mạng để thay đổi các mục dưới đây.", nút "Thêm" mờ. Bấm dòng lần khám. Kỳ vọng: phiếu có dòng đó; "Lưu" và "Xóa lần khám" mờ. Đóng phiếu, tắt chế độ máy bay.
 32. Bấm bút chì ở đầu trang. Kỳ vọng: "Xóa đợt ốm" mờ, ngay dưới là dòng "Xóa các lần khám trước.". Đóng phiếu.
 33. Dọn: bấm dòng lần khám, bấm dấu × trên ảnh. Kỳ vọng: hỏi lại "Xóa ảnh này?"; đồng ý thì ảnh biến mất ngay, phiếu vẫn mở. Bấm ô "Thêm", chụp một ảnh nữa, bấm "Lưu". Mở lại lần khám, bấm "Xóa lần khám". Kỳ vọng: hỏi lại "Xóa lần khám này và các ảnh của nó?"; đồng ý thì phiếu đóng, thẻ ghi lại "Chưa có lần khám nào.". Bút chì → "Xóa đợt ốm" bấm được: xóa đợt thử.
+34. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Trong thẻ trên cùng bấm "Nhiệt độ", nhập 38,5, bấm "Lưu". Trong thẻ "Lần khám" bấm "Thêm", gõ "thử" vào "Nơi khám", bấm "Lưu" (không chọn ảnh). Kỳ vọng: biểu đồ "Nhiệt độ và thuốc hạ sốt" có thêm một vạch dọc nét đứt ở giờ vừa lưu, chữ "Khám" ở trên cùng hình, không đè lên số hay chữ "Sốt". Bật Ban đêm. Kỳ vọng: vạch và chữ "Khám" vẫn đọc được. Tắt Ban đêm.
+35. Bấm "Báo cáo cho bác sĩ". Kỳ vọng: biểu đồ của báo cáo cũng có vạch "Khám"; sau mục "Thuốc đã dùng" là bảng "Lần khám" bốn cột "Lúc khám", "Nơi khám", "Bác sĩ kết luận", "Lời dặn", một hàng với giờ vừa lưu và "thử"; bảng không tràn ra ngoài màn hình, không chữ nào bị cắt. Bấm "In / Lưu PDF". Kỳ vọng: bản xem trước có bảng đó, không có ảnh. Hủy in. Bấm "7 ngày". Kỳ vọng: không có bảng "Lần khám". Dọn: về trang chi tiết, bấm dòng lần khám, "Xóa lần khám"; bút chì → "Xóa đợt ốm"; vào Nhật ký xóa bản ghi 38,5.
 
 Kết quả: Chờ người dùng.
 
```

`docs/device-checklist.md` từ trước đã không theo prettier: không chạy `prettier --write` lên nó.

```bash
git add docs/device-checklist.md docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
git commit -m "docs: the M5e part of step 38, and readings of §6.5 and §9 in the spec" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này là untracked (??), hoặc đã được commit lúc duyệt thì là M; các file plan khác chưa chạy: không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5e.md
git commit -m "docs(plan): the M5e plan and its check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m5e
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm; nhắc người dùng phần M5 của Bước 38 (mục 29–35) đang chờ họ trên iPhone thật, và rằng cả năm mốc của spec Đợt ốm đã xong; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
