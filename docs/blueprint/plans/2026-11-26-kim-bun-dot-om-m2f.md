# Kim Bun — Đợt ốm M2f: hai trang Đợt ốm Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§6.1 trừ `nav` và service worker; §6.2; §6.3 mục 1, mục 7 và các trạng thái của trang; phần "Màn hình" của §10.1; §10.3)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26); đã thi công 2026-11-27, kết quả ở Task 3

**Goal:** Có hai trang của Đợt ốm: danh sách các đợt (bắt đầu một đợt bằng tay) và trang của một đợt (xem, sửa, đóng, mở lại, xóa). Sau plan này chúng mở được bằng địa chỉ; M2g thêm lối vào từ tab Sức khỏe.

**Architecture:**

- **Hai trang tĩnh:** `/dot-om` (danh sách) và `/dot-om/chi-tiet?id=…` (một đợt). Mã đợt nằm ở tham số của địa chỉ, nên cả hai là trang tĩnh.
- **Mỗi trang chia hai phần:** phần có hook (`EpisodeScreen`, `EpisodeListScreen`) đọc dữ liệu và nối các thao tác; phần vẽ không hook (`EpisodeBody`, `EpisodeListBody`) nhận sẵn dữ liệu, nên test và trang fixture vẽ được mọi trạng thái.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m2f`, cắt từ `main` sau khi M2e đã lên. Baseline: 1852 test vitest xanh (198 file), typecheck sạch. Migration `20261126000200_illness_episodes.sql` phải đã áp lên Supabase thật (M2a Task 4 Step 4): thiếu nó thì trang danh sách báo lỗi tải và "Bắt đầu đợt ốm" bị DB từ chối.

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

1. **Chip của thẻ "Đang diễn ra" nằm dưới dòng tiêu đề, và thẻ luôn có mũi tên bên phải.** Spec §6.2 ghi chip ở bên phải. Đo trên trang tạm ở 375 px: thẻ còn 247 px cho tiêu đề và chip; tiêu đề "Từ 24/11 · ngày thứ 3" rộng khoảng 165 px ("ngày thứ 31": 174 px) và chip rộng từ 66 tới 91 px, nên với chip "Chưa đo lại" hay "Không sốt" tiêu đề bị đẩy xuống hai dòng, chữ số ngày đứng riêng một dòng. Đặt chip dưới tiêu đề thì mọi trạng thái đều một dòng (tiêu đề 160–169 px).
2. **Chưa có đợt nào** thì trang chỉ là `EmptyState` (câu, dòng phụ, nút "Bắt đầu đợt ốm"), không có tiêu đề mục "Đang diễn ra". Có đợt đã qua mà không có đợt mở thì mục "Đang diễn ra" chứa nút "Bắt đầu đợt ốm" (§6.2).
3. **Trạng thái đang tải, mất mạng, lỗi** làm như các trang khác: khung chờ, `NeedsNetwork`, `ErrorCard` có "Thử lại". Trang chi tiết chờ danh sách đợt trước, tìm thấy đợt rồi mới tải bản ghi của nó; trong lúc bản ghi chưa về, đầu trang và nút bút chì đã có. Vừa bắt đầu một đợt khi mất mạng thì bản ghi của nó chưa tải được: trang có đầu trang và dòng "Cần mạng để tải bản ghi của đợt ốm…", chưa có thẻ, ba nút hay "Bé đã khỏi", cho tới khi có mạng.
4. **`id` đọc bằng `useSearchParams` trong `Suspense`** (tài liệu Next: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`); phần chờ là `GateLoading`. Trang vẫn là trang tĩnh, nên service worker (M2g) giữ được một bản cho mọi `id`.
5. **Sau "Xóa đợt ốm"** trang chuyển về `/dot-om` bằng `router.replace`, để nút quay lại của trình duyệt không dẫn về một đợt đã xóa. Việc chuyển trang nằm trong `onSuccess` của lần gọi `remove.mutate`; nếu sau này thấy xóa xong mà trang không chuyển (đợt biến khỏi danh sách làm phiếu bị gỡ trước khi `onSuccess` chạy) thì đó là chỗ cần xem. Giữa lúc đợt biến khỏi danh sách và lúc trang kịp chuyển, dòng "Không tìm thấy đợt ốm này" có thể chớp lên một nhịp.
6. **"Bé đã khỏi" và "Bắt đầu đợt ốm" bị từ chối** thì hiện Toast với câu của §5.7 và không ghi gì; lỗi khi xếp hàng chờ (hiếm) hiện Toast với câu của `toVietnameseError`.
7. **Giờ của trang** lấy từ `useNow(60_000)`: "đã hết sốt … giờ" và mốc 6 giờ tự cập nhật mỗi phút. Đồng hồ đó có thể chậm tới một phút so với giờ thật; luật của M2b đã nới 2 phút cho đợt đang mở, nên lần đo vừa lưu từ ba nút của thẻ hiện lên thẻ ngay (có test).
8. **Cả hai trang đều theo realtime của bản ghi** (`useLogsRealtime`), để chip và thẻ đổi theo khi máy khác ghi một lần đo. Bảng đợt ốm thì không nằm trong realtime (§4.1): máy khác thấy đợt mới nhờ lần tải lại mỗi 60 giây.
9. **"Bắt đầu đợt ốm" bỏ qua lần bấm thứ hai** khi lần đầu còn đang được xếp vào hàng chờ, để không tạo hai đợt.
10. **Không có dấu "chờ đồng bộ" riêng cho từng đợt.** Thanh đồng bộ chung của app (trong `PageHeader`) đã báo thay đổi đang chờ.
11. **Nút quay lại của trang chi tiết ghi "Đợt ốm"**, trùng với tiêu đề lớn của trang: đúng như spec §6.1 và §6.3.
12. **Trang chi tiết ở mốc này** có đầu trang, thẻ kết luận, biểu đồ, từng ngày và nút "Bé đã khỏi". Chưa có thẻ "So với thường ngày", nút "Báo cáo cho bác sĩ" (M4) và thẻ "Lần khám" (M5); M4 và M5 chèn chúng vào `EpisodeBody`.
13. **Chưa có lối vào.** Sau plan này hai trang mở được bằng địa chỉ; dòng "Đợt ốm" ở tab Sức khỏe, việc sáng tab và việc giữ trang để xem khi mất mạng là của M2g. Hai plan nên lên `main` gần nhau.
14. **Trên trang thật không tạo đợt ốm.** Dữ liệu thật chưa có đợt nào, nên trên trang thật chỉ thấy trạng thái trống của danh sách và trạng thái không tìm thấy của trang chi tiết; mọi thứ khác chỉ thấy trên trang tạm. Lần bấm "Bắt đầu đợt ốm", "Bé đã khỏi", "Lưu", "Mở lại", "Xóa" đầu tiên là của người dùng, theo Bước 38 (M2g).

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 4** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2f.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 4 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ commit cuối của M2e trong bản chạy thử. Trong bản chạy thử mỗi task là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Trang fixture của Task 3 đã qua `tsc --noEmit`. `bun run build` đã chạy xanh một lần trên bản sao có đủ cả bảy plan của M2 (42 trang, `/dot-om` và `/dot-om/chi-tiet` đều là trang tĩnh), chưa chạy riêng cho plan này.
- **Đã nhìn thử khi viết plan.** Các khối danh sách của trang fixture đã được mở ở 375 px, theme `rose`, trên bản sao (không có dữ liệu thật): số đo ghi ở mục 8 của bước trình duyệt là của lần đó; lần nhìn đó cũng là lúc lộ ra việc chip phải nằm dưới tiêu đề (Diễn giải spec mục 1). Chưa xem: hai khối "Trang chi tiết" ghép đủ, ba theme `light`, `dark`, `night`, bề ngang 390 và 440, và mọi trang thật.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP. Migration đã được áp ở M2a.
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

Plan này đứng sau M2e. M2g thêm lối vào. M3 thêm thẻ đợt ốm, lời mời và nhắc đóng vào tab Hôm nay; M4 chèn thẻ "So với thường ngày" và nút "Báo cáo cho bác sĩ" vào `EpisodeBody`; M5 chèn thẻ "Lần khám".

**Consumes (M2a):** `useEpisodes(babyId)`, `useEpisodeActions(babyId, userId)` (`start.mutate({ startedAt }, { onSuccess: (id) => …, onError })`, `update.mutate({ id, patch }, …)`, `start.isPending`, `update.isPending`); `EpisodeRow`.

**Consumes (M2b, M2c):** `detailRange`, `feverChartModel`, `type EpisodeLike` (`lib/rules/illness.ts`); `FeverChartCard` (`components/illness/FeverChart.tsx`).

**Consumes (M2d):** `verdictView`, `dayRows`, `episodeList`, `episodeHref`, `type EpisodeListView` (`lib/rules/illnessView.ts`); `EpisodeVerdict`, `type QuickLogType` (`components/illness/EpisodeVerdict.tsx`); `EpisodeDayList`; `EmptyState` với `detail` và `action.href`.

**Consumes (M2e):** `useRangeLogs(babyId, from, to, enabled)` (`lib/data/logs.ts`); `planStart`, `planClose` (`lib/rules/illnessForm.ts`); `EpisodeSheet`.

**Consumes (đã ở `main` từ trước):** `AuthGate`, `GateLoading` (`components/AuthGate.tsx`); `useQuickActions().openInstant(type)` (`components/actions/QuickActions.tsx`; `AuthGate need="baby"` đã bọc sẵn `QuickActionsProvider`); `useToast`; `useLogsRealtime`; `useNow`; `PageHeader`, `IconButton`, `Button`, `ListGroup`, `ListRow`, `StatusChip`, `Icon`, `Skeleton`, `ErrorCard`, `NeedsNetwork`, `waitingForNetwork`; `CATEGORY_CHIP`; `toVietnameseError`; `findElements`.

**Produces:**

- `components/illness/EpisodeScreen.tsx`: `EpisodeBody(props)` (chữ ký ở Task 1); `EpisodeScreen(props: { baby: Baby; userId: string; isOwner: boolean; id: string | null })`.
- `components/illness/EpisodeDetailPage.tsx`: `EpisodeDetailPage()`.
- `components/illness/EpisodeListScreen.tsx`: `EpisodeListBody(props: { view: EpisodeListView; starting: boolean; onStart: () => void })`; `EpisodeListScreen(props: { baby: Baby; userId: string })`.
- Hai trang tĩnh `/dot-om` và `/dot-om/chi-tiet?id={uuid}`.
- **Vitest sau M2f:** 1875 test, 200 file.

---

### Task 1: Trang chi tiết `/dot-om/chi-tiet` (§6.1, §6.3)

**Files:**

- Create: `components/illness/EpisodeScreen.tsx`, `components/illness/EpisodeDetailPage.tsx`, `app/dot-om/chi-tiet/page.tsx`
- Test: `components/illness/episodescreen.test.tsx` (mới)

**Interfaces:**

- Consumes: `useEpisodes`, `useEpisodeActions` (M2a); `detailRange`, `type EpisodeLike` (M2b); `feverChartModel`, `FeverChartCard` (M2c); `verdictView`, `dayRows`, `EpisodeVerdict`, `EpisodeDayList`, `type QuickLogType`, `EmptyState` có `action.href` (M2d); `useRangeLogs`, `planClose`, `EpisodeSheet` (M2e); sẵn có: `AuthGate`, `GateLoading`, `PageHeader`, `IconButton`, `Button`, `ErrorCard`, `NeedsNetwork`, `waitingForNetwork`, `Skeleton`, `useToast`, `useQuickActions().openInstant`, `useLogsRealtime`, `useNow`, `toVietnameseError`, `useRouter` và `useSearchParams` của `next/navigation`.
- Produces:
  - `EpisodeBody(props: { episode: EpisodeLike; logs: LogLike[]; babyName: string; now: Date; closing: boolean; onLog: (type: QuickLogType) => void; onClose: () => void })`: các khối của trang khi bản ghi đã tải, không có hook (để test và trang fixture vẽ được).
  - `EpisodeScreen(props: { baby: Baby; userId: string; isOwner: boolean; id: string | null })`
  - `EpisodeDetailPage()`: đọc `id` từ địa chỉ, bọc trong `Suspense`, rồi `AuthGate`.
  - Trang tĩnh `/dot-om/chi-tiet`.

- [x] **Step 0: Kiểm M2e đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f components/illness/EpisodeSheet.tsx && grep -q "export function useRangeLogs" lib/data/logs.ts && echo "M2e có trên main"
git checkout -b feat/kim-bun-dot-om-m2f
bunx vitest run
```

Expected: dòng `M2e có trên main`; `Test Files  198 passed (198)`, `Tests  1852 passed (1852)`. Không thấy dòng đó thì dừng: M2e chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

Mở plan M2a, Task 4 Step 4: phải có ghi giờ migration `20261126000200_illness_episodes.sql` được áp lên Supabase thật. Chưa có thì dừng và báo: plan này đưa ra các trang đọc và ghi bảng đó.

- [x] **Step 1: Viết test đỏ (Patch 1)**

Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` (AGENTS.md): một trang tĩnh gọi `useSearchParams` phải nằm trong `Suspense`, không thì `bun run build` lỗi.

```diff
diff --git a/components/illness/episodescreen.test.tsx b/components/illness/episodescreen.test.tsx
new file mode 100644
index 0000000..a64565a
--- /dev/null
+++ b/components/illness/episodescreen.test.tsx
@@ -0,0 +1,338 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { EpisodeDetailPage } from "./EpisodeDetailPage";
+import { findElements } from "@/components/ui/testTree";
+import { EpisodeBody, EpisodeScreen } from "./EpisodeScreen";
+
+const NOW = new Date("2026-11-26T10:00:00+07:00");
+const state = vi.hoisted(() => ({
+  episodes: {} as Record<string, unknown>,
+  logs: {} as Record<string, unknown>,
+  search: "id=open",
+}));
+const useRangeLogs = vi.hoisted(() => vi.fn());
+const useLogsRealtime = vi.hoisted(() => vi.fn());
+
+vi.mock("@/lib/data/illness", () => ({
+  useEpisodes: () => state.episodes,
+  useEpisodeActions: () => ({
+    update: { isPending: false, mutate: () => {} },
+    remove: { isPending: false, mutate: () => {} },
+  }),
+}));
+vi.mock("@/lib/data/logs", () => ({ useRangeLogs }));
+vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime }));
+vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
+vi.mock("@/components/actions/QuickActions", () => ({
+  useQuickActions: () => ({ openInstant: () => {} }),
+}));
+vi.mock("@/components/ui/Toast", () => ({ useToast: () => () => {} }));
+vi.mock("next/navigation", () => ({
+  useRouter: () => ({ push: () => {}, replace: () => {} }),
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
+  }) => (
+    <div data-need={need}>
+      {
+        children({
+          session: { user: { id: "u2" } },
+          ctx: { baby, member: { role: "member" } },
+        }) as never
+      }
+    </div>
+  ),
+}));
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const baby = { id: "b1", family_id: "f1", name: "Bun" } as unknown as Baby;
+const episode = (
+  id: string,
+  start: string,
+  end: string | null,
+  createdBy = "u1",
+): EpisodeRow => ({
+  id,
+  baby_id: "b1",
+  started_at: iso(start),
+  ended_at: end === null ? null : iso(end),
+  created_by: createdBy,
+  created_at: iso(start),
+  updated_at: iso(start),
+});
+const open = episode("open", "2026-11-24 23:30", null);
+const past = episode("past", "2026-10-10 08:00", "2026-10-12 09:00");
+const log = (type: string, time: string, details: unknown) =>
+  ({
+    id: `${type}-${time}`,
+    baby_id: "b1",
+    type,
+    started_at: iso(time),
+    ended_at: iso(time),
+    details,
+    note: null,
+    created_by: "u1",
+    created_at: iso(time),
+    updated_at: iso(time),
+  }) as LogRow;
+const LOGS = [
+  log("temperature", "2026-11-24 23:40", { celsius: 38.4, method: "nach" }),
+  log("temperature", "2026-11-25 15:00", { celsius: 39.2, method: "nach" }),
+  log("temperature", "2026-11-26 07:05", { celsius: 37.6, method: "nach" }),
+  log("medicine", "2026-11-25 15:10", {
+    name: "Hapacol",
+    amount: 2.5,
+    unit: "ml",
+    antipyretic: true,
+  }),
+  log("symptom", "2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
+];
+
+const LOADING = {
+  data: undefined,
+  isPending: true,
+  isError: false,
+  error: null,
+  fetchStatus: "fetching",
+  refetch: () => {},
+};
+const OFFLINE = { ...LOADING, fetchStatus: "paused" };
+const FAILED = {
+  ...LOADING,
+  isPending: false,
+  isError: true,
+  error: new Error("boom"),
+  fetchStatus: "idle",
+};
+const loaded = (data: unknown) => ({
+  ...LOADING,
+  data,
+  isPending: false,
+  fetchStatus: "idle",
+});
+
+function render(
+  input: {
+    id?: string | null;
+    episodes?: Record<string, unknown>;
+    logs?: Record<string, unknown>;
+    userId?: string;
+    isOwner?: boolean;
+  } = {},
+) {
+  state.episodes = input.episodes ?? loaded([open, past]);
+  state.logs = input.logs ?? loaded(LOGS);
+  return renderToStaticMarkup(
+    <EpisodeScreen
+      baby={baby}
+      userId={input.userId ?? "u2"}
+      isOwner={input.isOwner ?? false}
+      id={input.id === undefined ? "open" : input.id}
+    />,
+  );
+}
+
+beforeEach(() => {
+  useRangeLogs.mockReset();
+  useRangeLogs.mockImplementation(() => state.logs);
+  useLogsRealtime.mockClear();
+  state.search = "id=open";
+});
+
+// Spec 2026-11-26 §6.3.
+describe("EpisodeScreen", () => {
+  it("is titled Đợt ốm, goes back to the list and has the edit pencil", () => {
+    const html = render();
+    expect(html).toContain(">Đợt ốm</h1>");
+    expect(html).toMatch(/<a[^>]*href="\/dot-om"[^>]*>.*Đợt ốm<\/a>/);
+    expect(html).toContain('aria-label="Sửa đợt ốm"');
+    expect(html).toContain(`d="${ICON_PATHS.pencil}"`);
+  });
+
+  it("reads the logs from 8 days before the first day, open-ended, and follows realtime", () => {
+    render();
+    expect(useRangeLogs).toHaveBeenCalledWith(
+      "b1",
+      iso("2026-11-16 00:00"),
+      null,
+      true,
+    );
+    expect(useLogsRealtime).toHaveBeenCalledWith("b1");
+  });
+
+  it("an open episode: verdict, chart, days, then Bé đã khỏi", () => {
+    const html = render();
+    expect(html).toContain(">Bun đã hết sốt 19 giờ</h2>");
+    expect(html).toContain(">Ngày thứ 3 · bắt đầu 24/11 lúc 23:30</span>");
+    expect(html).toContain(">39,2°C</span>");
+    for (const text of ["Nhiệt độ", "Thuốc", "Triệu chứng"])
+      expect(html).toContain(`>${text}</button>`);
+    expect(html).toContain(">Nhiệt độ và thuốc hạ sốt</h2>");
+    expect(html).toContain(
+      'aria-label="Biểu đồ nhiệt độ: 3 lần đo, cao nhất 39,2°C, 1 liều hạ sốt."',
+    );
+    expect(html).toContain(">Từng ngày</h2>");
+    expect(html).toContain(">25/11 · ngày 2</span>");
+    expect(html).toContain(">Sổ mũi</span>");
+    expect(html).toMatch(/<button[^>]*w-full[^>]*>Bé đã khỏi<\/button>/);
+    const order = [
+      ">Bun đã hết sốt 19 giờ</h2>",
+      ">Nhiệt độ và thuốc hạ sốt</h2>",
+      ">Từng ngày</h2>",
+      ">Bé đã khỏi</button>",
+    ].map((mark) => html.indexOf(mark));
+    expect(order).toEqual([...order].sort((a, b) => a - b));
+    // Not in this milestone: the comparison card, the report, the visits.
+    for (const text of ["So với thường ngày", "Báo cáo cho bác sĩ", "Lần khám"])
+      expect(html).not.toContain(text);
+  });
+
+  // The page's clock moves once a minute; a log saved since its last tick is
+  // dated after it and must show at once.
+  it("a reading saved after the page's clock last moved is on the card at once", () => {
+    const fresh = {
+      ...LOGS[0],
+      id: "fresh",
+      started_at: new Date(NOW.getTime() + 20_000).toISOString(),
+      details: { celsius: 38.8, method: "nach" },
+    } as LogRow;
+    const html = render({ logs: loaded([fresh]) });
+    expect(html).toContain(">Bun đang sốt 38,8°C</h2>");
+    expect(html).toContain(">Cao nhất 38,8°C · không dùng thuốc</span>");
+    expect(html).not.toContain("Chưa đo nhiệt độ");
+  });
+
+  it("a closed episode: Đã khỏi, no quick logs and no Bé đã khỏi; its logs stop after its last day", () => {
+    const html = render({ id: "past", logs: loaded([]) });
+    expect(html).toContain(">Đã khỏi sau 3 ngày</h2>");
+    expect(html).toContain(">10/10 – 12/10</span>");
+    expect(html).toContain(">Chưa có lần đo nào trong đợt này.</p>");
+    expect(html).not.toContain("Bé đã khỏi");
+    expect(html).not.toContain(">Triệu chứng</button>");
+    expect(useRangeLogs).toHaveBeenCalledWith(
+      "b1",
+      iso("2026-10-02 00:00"),
+      iso("2026-10-13 00:00"),
+      true,
+    );
+  });
+
+  it("an id that is not among the baby's episodes: one sentence and the way back", () => {
+    for (const id of ["gone", null]) {
+      const html = render({ id });
+      expect(html).toContain(">Không tìm thấy đợt ốm này</p>");
+      expect(html).toMatch(/<a[^>]*href="\/dot-om"[^>]*>Về danh sách<\/a>/);
+      expect(html).not.toContain('aria-label="Sửa đợt ốm"');
+      expect(html).not.toContain("Bé đã khỏi");
+    }
+    // No episode: no logs are asked for.
+    expect(useRangeLogs).toHaveBeenLastCalledWith("b1", "", null, false);
+  });
+
+  it("while the episodes load there are placeholders; offline it says what it waits for", () => {
+    const loading = render({ episodes: LOADING });
+    expect(loading).toContain("animate-[kb-pulse");
+    expect(loading).not.toContain("Không tìm thấy");
+    const offline = render({ episodes: OFFLINE });
+    expect(offline).toContain(
+      "Cần mạng để tải đợt ốm. Trang sẽ tự tải khi có mạng lại.",
+    );
+    expect(offline).not.toContain("animate-[kb-pulse");
+  });
+
+  it("a failed load has Thử lại", () => {
+    const html = render({ episodes: FAILED });
+    expect(html).toContain('role="alert"');
+    expect(html).toContain(">Có lỗi xảy ra: boom</p>");
+    expect(html).toContain(">Thử lại</button>");
+  });
+
+  it("the episode is known but its logs are not yet: the header stays, the cards wait", () => {
+    const loading = render({ logs: LOADING });
+    expect(loading).toContain('aria-label="Sửa đợt ốm"');
+    expect(loading).toContain("animate-[kb-pulse");
+    expect(loading).not.toContain("Chưa đo nhiệt độ");
+    expect(loading).not.toContain("Bé đã khỏi");
+    expect(render({ logs: OFFLINE })).toContain(
+      "Cần mạng để tải bản ghi của đợt ốm. Trang sẽ tự tải khi có mạng lại.",
+    );
+    expect(render({ logs: FAILED })).toContain(">Thử lại</button>");
+  });
+});
+
+describe("EpisodeBody", () => {
+  const body = (closing: boolean, onClose: () => void = () => {}) =>
+    EpisodeBody({
+      episode: open,
+      logs: LOGS,
+      babyName: "Bun",
+      now: NOW,
+      closing,
+      onLog: () => {},
+      onClose,
+    });
+
+  it("Bé đã khỏi reports the tap, and waits while the change is on its way", () => {
+    const onClose = vi.fn();
+    const [button] = findElements(
+      body(false, onClose),
+      (el) => el.props.children === "Bé đã khỏi",
+    );
+    (button.props.onClick as () => void)();
+    expect(onClose).toHaveBeenCalledOnce();
+    expect(renderToStaticMarkup(body(true))).toMatch(
+      /aria-busy="true"[^>]*>Bé đã khỏi</,
+    );
+  });
+
+  it("hands the quick-log type on from the verdict card", () => {
+    const onLog = vi.fn();
+    const [verdict] = findElements(
+      EpisodeBody({
+        episode: open,
+        logs: LOGS,
+        babyName: "Bun",
+        now: NOW,
+        closing: false,
+        onLog,
+        onClose: () => {},
+      }),
+      (el) => "view" in el.props && "onLog" in el.props,
+    );
+    (verdict.props.onLog as (type: string) => void)("symptom");
+    expect(onLog).toHaveBeenCalledWith("symptom");
+  });
+});
+
+// Spec §6.1.
+describe("EpisodeDetailPage", () => {
+  it("takes the id from the address and hands it to the screen behind the gate", () => {
+    state.episodes = loaded([open, past]);
+    state.logs = loaded(LOGS);
+    state.search = "id=past";
+    const html = renderToStaticMarkup(<EpisodeDetailPage />);
+    expect(html).toContain('data-need="baby"');
+    expect(html).toContain(">Đã khỏi sau 3 ngày</h2>");
+    expect(html).not.toContain("data-gate-loading");
+  });
+
+  it("an address without an id shows the not-found state", () => {
+    state.episodes = loaded([open, past]);
+    state.logs = loaded(LOGS);
+    state.search = "";
+    expect(renderToStaticMarkup(<EpisodeDetailPage />)).toContain(
+      ">Không tìm thấy đợt ốm này</p>",
+    );
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 198 passed (199)`, `Tests  1852 passed (1852)`. File test mới không nạp được vì hai component chưa có, nên 13 test của nó chưa được đếm.

- [x] **Step 3: Viết trang chi tiết (Patch 2)**

```diff
diff --git a/app/dot-om/chi-tiet/page.tsx b/app/dot-om/chi-tiet/page.tsx
new file mode 100644
index 0000000..ba3530f
--- /dev/null
+++ b/app/dot-om/chi-tiet/page.tsx
@@ -0,0 +1,7 @@
+"use client";
+
+import { EpisodeDetailPage } from "@/components/illness/EpisodeDetailPage";
+
+export default function Page() {
+  return <EpisodeDetailPage />;
+}
diff --git a/components/illness/EpisodeDetailPage.tsx b/components/illness/EpisodeDetailPage.tsx
new file mode 100644
index 0000000..216dd6a
--- /dev/null
+++ b/components/illness/EpisodeDetailPage.tsx
@@ -0,0 +1,38 @@
+"use client";
+
+import { useSearchParams } from "next/navigation";
+import { Suspense } from "react";
+import { AuthGate, GateLoading } from "@/components/AuthGate";
+import { EpisodeScreen } from "./EpisodeScreen";
+
+function Detail() {
+  const id = useSearchParams().get("id");
+  return (
+    <AuthGate need="baby">
+      {({ session, ctx }) =>
+        ctx?.baby && session ? (
+          <EpisodeScreen
+            baby={ctx.baby}
+            userId={session.user.id}
+            isOwner={ctx.member.role === "owner"}
+            id={id}
+          />
+        ) : null
+      }
+    </AuthGate>
+  );
+}
+
+// Spec 2026-11-26 §6.1: /dot-om/chi-tiet?id={uuid}. The id is a query
+// parameter so the page is one static shell that also opens offline. Reading
+// the address in a prerendered page needs a Suspense boundary
+// (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md):
+// the static HTML holds the fallback, and the page itself renders in the
+// browser.
+export function EpisodeDetailPage() {
+  return (
+    <Suspense fallback={<GateLoading />}>
+      <Detail />
+    </Suspense>
+  );
+}
diff --git a/components/illness/EpisodeScreen.tsx b/components/illness/EpisodeScreen.tsx
new file mode 100644
index 0000000..12166dc
--- /dev/null
+++ b/components/illness/EpisodeScreen.tsx
@@ -0,0 +1,194 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+import { useQuickActions } from "@/components/actions/QuickActions";
+import { Button } from "@/components/ui/Button";
+import { EmptyState } from "@/components/ui/EmptyState";
+import { ErrorCard } from "@/components/ui/ErrorCard";
+import { IconButton } from "@/components/ui/IconButton";
+import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
+import { PageHeader } from "@/components/ui/PageHeader";
+import { Skeleton } from "@/components/ui/Skeleton";
+import { useToast } from "@/components/ui/Toast";
+import { toVietnameseError } from "@/lib/data/errors";
+import { useEpisodeActions, useEpisodes } from "@/lib/data/illness";
+import { useRangeLogs } from "@/lib/data/logs";
+import { useLogsRealtime } from "@/lib/data/realtime";
+import { useNow } from "@/lib/hooks/useNow";
+import type { LogLike } from "@/lib/rules/describeLog";
+import {
+  detailRange,
+  type EpisodeLike,
+  feverChartModel,
+} from "@/lib/rules/illness";
+import { planClose } from "@/lib/rules/illnessForm";
+import { dayRows, verdictView } from "@/lib/rules/illnessView";
+import type { Baby } from "@/lib/supabase/rows";
+import { EpisodeDayList } from "./EpisodeDayList";
+import { EpisodeSheet } from "./EpisodeSheet";
+import { EpisodeVerdict, type QuickLogType } from "./EpisodeVerdict";
+import { FeverChartCard } from "./FeverChart";
+
+const LIST = "/dot-om";
+
+function Placeholders() {
+  return (
+    <div className="flex flex-col gap-[18px]">
+      <Skeleton className="h-[248px] rounded-[26px]" />
+      <Skeleton className="h-[280px] rounded-[28px]" />
+    </div>
+  );
+}
+
+// Spec 2026-11-26 §6.3 items 2 to 7: the cards of an episode whose logs have
+// loaded, drawn without hooks. Exported for the temporary fixture page of the
+// browser check.
+export function EpisodeBody({
+  episode,
+  logs,
+  babyName,
+  now,
+  closing,
+  onLog,
+  onClose,
+}: {
+  episode: EpisodeLike;
+  logs: LogLike[];
+  babyName: string;
+  now: Date;
+  // "Bé đã khỏi" is on its way.
+  closing: boolean;
+  onLog: (type: QuickLogType) => void;
+  onClose: () => void;
+}) {
+  return (
+    <>
+      <EpisodeVerdict
+        view={verdictView({ episode, logs, babyName, now })}
+        onLog={onLog}
+      />
+      <FeverChartCard chart={feverChartModel(logs, episode, now)} />
+      <EpisodeDayList rows={dayRows(logs, episode, now)} />
+      {episode.ended_at === null && (
+        <Button variant="secondary" block busy={closing} onClick={onClose}>
+          Bé đã khỏi
+        </Button>
+      )}
+    </>
+  );
+}
+
+// Spec 2026-11-26 §6.3: the page of one illness episode. `id` comes from the
+// address; an id the baby's episodes do not hold shows the not-found state.
+export function EpisodeScreen({
+  baby,
+  userId,
+  isOwner,
+  id,
+}: {
+  baby: Baby;
+  userId: string;
+  isOwner: boolean;
+  id: string | null;
+}) {
+  useLogsRealtime(baby.id);
+  const now = useNow(60_000);
+  const router = useRouter();
+  const toast = useToast();
+  const quick = useQuickActions();
+  const episodes = useEpisodes(baby.id);
+  const actions = useEpisodeActions(baby.id, userId);
+  const [editing, setEditing] = useState(false);
+
+  const all = episodes.data ?? [];
+  const episode = all.find((item) => item.id === id) ?? null;
+  const range = episode ? detailRange(episode) : null;
+  const logs = useRangeLogs(
+    baby.id,
+    range?.from ?? "",
+    range?.to ?? null,
+    range !== null,
+  );
+
+  // Spec §6.3 item 7: no question asked; a refusal is a toast (§5.7).
+  function close() {
+    if (!episode) return;
+    const plan = planClose(episode, all, new Date());
+    if (!plan.ok) {
+      toast(plan.message);
+      return;
+    }
+    actions.update.mutate(
+      { id: episode.id, patch: plan.patch },
+      {
+        onSuccess: () => toast("Đã đóng đợt ốm"),
+        onError: (error) => toast(toVietnameseError(error)),
+      },
+    );
+  }
+
+  return (
+    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
+      <PageHeader
+        title="Đợt ốm"
+        back={{ href: LIST, label: "Đợt ốm" }}
+        action={
+          episode && (
+            <IconButton
+              label="Sửa đợt ốm"
+              icon="pencil"
+              onClick={() => setEditing(true)}
+            />
+          )
+        }
+      />
+      {waitingForNetwork(episodes) ? (
+        <NeedsNetwork what="đợt ốm" />
+      ) : episodes.isPending ? (
+        <Placeholders />
+      ) : episodes.isError && !episodes.data ? (
+        <ErrorCard
+          message={toVietnameseError(episodes.error)}
+          onRetry={() => void episodes.refetch()}
+        />
+      ) : !episode ? (
+        <EmptyState
+          icon="calendar"
+          text="Không tìm thấy đợt ốm này"
+          action={{ label: "Về danh sách", href: LIST }}
+        />
+      ) : waitingForNetwork(logs) ? (
+        <NeedsNetwork what="bản ghi của đợt ốm" />
+      ) : logs.isPending ? (
+        <Placeholders />
+      ) : logs.isError && !logs.data ? (
+        <ErrorCard
+          message={toVietnameseError(logs.error)}
+          onRetry={() => void logs.refetch()}
+        />
+      ) : (
+        <EpisodeBody
+          episode={episode}
+          logs={logs.data ?? []}
+          babyName={baby.name}
+          now={now}
+          closing={actions.update.isPending}
+          onLog={quick.openInstant}
+          onClose={close}
+        />
+      )}
+      {editing && episode && (
+        <EpisodeSheet
+          babyId={baby.id}
+          userId={userId}
+          episode={episode}
+          episodes={all}
+          canDelete={isOwner || episode.created_by === userId}
+          onClose={() => setEditing(false)}
+          onDeleted={() => router.replace(LIST)}
+        />
+      )}
+    </main>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  199 passed (199)`, `Tests  1865 passed (1865)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/illness/EpisodeScreen.tsx components/illness/EpisodeDetailPage.tsx components/illness/episodescreen.test.tsx app/dot-om/chi-tiet/page.tsx
git commit -m "feat(illness): the episode page at /dot-om/chi-tiet" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Trang danh sách `/dot-om` (§6.1, §6.2)

**Files:**

- Create: `components/illness/EpisodeListScreen.tsx`, `app/dot-om/page.tsx`
- Test: `components/illness/episodelist.test.tsx` (mới)

**Interfaces:**

- Consumes: `useEpisodes`, `useEpisodeActions` (M2a); `episodeList`, `episodeHref`, `type EpisodeListView`, `EmptyState` có `detail` (M2d); `useRangeLogs`, `planStart` (M2e); sẵn có: `AuthGate`, `PageHeader`, `Button`, `ListGroup`, `ListRow`, `StatusChip`, `Icon`, `CATEGORY_CHIP`, `ErrorCard`, `NeedsNetwork`, `Skeleton`, `useToast`, `useNow`, `useLogsRealtime`, `useRouter`.
- Produces:
  - `EpisodeListBody(props: { view: EpisodeListView; starting: boolean; onStart: () => void })`: ba trạng thái của danh sách, không có hook.
  - `EpisodeListScreen(props: { baby: Baby; userId: string })`
  - Trang tĩnh `/dot-om`.

- [x] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/illness/episodelist.test.tsx b/components/illness/episodelist.test.tsx
new file mode 100644
index 0000000..9368d32
--- /dev/null
+++ b/components/illness/episodelist.test.tsx
@@ -0,0 +1,216 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { findElements } from "@/components/ui/testTree";
+import { EpisodeListBody, EpisodeListScreen } from "./EpisodeListScreen";
+
+const NOW = new Date("2026-11-26T10:00:00+07:00");
+const state = vi.hoisted(() => ({
+  episodes: {} as Record<string, unknown>,
+  logs: {} as Record<string, unknown>,
+}));
+const useRangeLogs = vi.hoisted(() => vi.fn());
+const useLogsRealtime = vi.hoisted(() => vi.fn());
+
+vi.mock("@/lib/data/illness", () => ({
+  useEpisodes: () => state.episodes,
+  useEpisodeActions: () => ({
+    start: { isPending: false, mutate: () => {} },
+  }),
+}));
+vi.mock("@/lib/data/logs", () => ({ useRangeLogs }));
+vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime }));
+vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
+vi.mock("@/components/ui/Toast", () => ({ useToast: () => () => {} }));
+vi.mock("next/navigation", () => ({
+  useRouter: () => ({ push: () => {} }),
+}));
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const baby = { id: "b1", family_id: "f1", name: "Bun" } as unknown as Baby;
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
+const open = episode("open", "2026-11-24 23:30", null);
+const october = episode("oct", "2026-10-10 08:00", "2026-10-13 09:00");
+const september = episode("sep", "2026-09-28 08:00", "2026-10-02 09:00");
+const fever = {
+  id: "t1",
+  baby_id: "b1",
+  type: "temperature",
+  started_at: iso("2026-11-26 09:00"),
+  ended_at: iso("2026-11-26 09:00"),
+  details: { celsius: 38.5, method: "nach" },
+} as unknown as LogRow;
+
+const LOADING = {
+  data: undefined,
+  isPending: true,
+  isError: false,
+  error: null,
+  fetchStatus: "fetching",
+  refetch: () => {},
+};
+const loaded = (data: unknown) => ({
+  ...LOADING,
+  data,
+  isPending: false,
+  fetchStatus: "idle",
+});
+
+function render(
+  episodes: Record<string, unknown>,
+  logs: Record<string, unknown> = loaded([fever]),
+) {
+  state.episodes = episodes;
+  state.logs = logs;
+  return renderToStaticMarkup(<EpisodeListScreen baby={baby} userId="u1" />);
+}
+
+beforeEach(() => {
+  useRangeLogs.mockReset();
+  useRangeLogs.mockImplementation(() => state.logs);
+});
+
+// Spec 2026-11-26 §6.2.
+describe("EpisodeListScreen", () => {
+  it("is titled Đợt ốm, goes back to Sức khỏe and follows realtime", () => {
+    useLogsRealtime.mockClear();
+    const html = render(loaded([open]));
+    expect(useLogsRealtime).toHaveBeenCalledWith("b1");
+    expect(html).toContain(">Đợt ốm</h1>");
+    expect(html).toMatch(/<a[^>]*href="\/suc-khoe"[^>]*>.*Sức khỏe<\/a>/);
+  });
+
+  it("an open episode: a card that leads to its page, with its state as a chip", () => {
+    const html = render(loaded([september, open, october]));
+    expect(html).toContain(">Đang diễn ra</h2>");
+    expect(html).toMatch(
+      /<a[^>]*class="glass [^"]*"[^>]*href="\/dot-om\/chi-tiet\?id=open"/,
+    );
+    expect(html).toContain("bg-cat-temp/15 text-cat-temp");
+    expect(html).toContain(`d="${ICON_PATHS.thermo}"`);
+    // The chip sits under the title, so the title keeps one line at 375 px.
+    expect(html).toMatch(
+      />Từ 24\/11 · ngày thứ 3<\/span><span class="[^"]*bg-warn-soft text-warn-ink[^"]*">Đang sốt<\/span><\/span>/,
+    );
+    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
+    expect(html).not.toContain("Bắt đầu đợt ốm");
+    expect(useRangeLogs).toHaveBeenCalledWith(
+      "b1",
+      open.started_at,
+      null,
+      true,
+    );
+  });
+
+  it("past episodes: one row each, newest first, each leading to its page", () => {
+    const html = render(loaded([september, open, october]));
+    expect(html).toContain(">Đã qua</h2>");
+    const first = html.indexOf(">10/10 – 13/10 · 4 ngày</span>");
+    const second = html.indexOf(">28/09 – 02/10 · 5 ngày</span>");
+    expect(first).toBeGreaterThan(-1);
+    expect(first).toBeLessThan(second);
+    expect(html).toContain('href="/dot-om/chi-tiet?id=oct"');
+    expect(html).toContain('href="/dot-om/chi-tiet?id=sep"');
+    expect(html.indexOf(">Đang diễn ra</h2>")).toBeLessThan(
+      html.indexOf(">Đã qua</h2>"),
+    );
+  });
+
+  it("no chip until the open episode's logs have loaded, or when nothing was measured", () => {
+    for (const logs of [LOADING, loaded([])]) {
+      const html = render(loaded([open]), logs);
+      expect(html).toContain(">Từ 24/11 · ngày thứ 3</span>");
+      expect(html).not.toContain("Đang sốt");
+      expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
+    }
+  });
+
+  it("nothing open: the button to start one, and no logs are asked for", () => {
+    const html = render(loaded([october]));
+    expect(html).toContain(">Đang diễn ra</h2>");
+    expect(html).toMatch(/<button[^>]*w-full[^>]*>Bắt đầu đợt ốm<\/button>/);
+    expect(html).toContain(">Đã qua</h2>");
+    expect(useRangeLogs).toHaveBeenCalledWith("b1", "", null, false);
+  });
+
+  it("only an open episode: no Đã qua", () => {
+    expect(render(loaded([open]))).not.toContain("Đã qua");
+  });
+
+  it("no episode at all: the empty state with its line and the start button", () => {
+    const html = render(loaded([]));
+    expect(html).toContain(">Chưa có đợt ốm nào</p>");
+    expect(html).toContain(
+      ">Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ.</p>",
+    );
+    expect(html).toContain(">Bắt đầu đợt ốm</button>");
+    expect(html).not.toContain("Đang diễn ra");
+    expect(html).not.toContain("Đã qua");
+  });
+
+  it("loading, offline and a failed load", () => {
+    expect(render(LOADING)).toContain("animate-[kb-pulse");
+    expect(render({ ...LOADING, fetchStatus: "paused" })).toContain(
+      "Cần mạng để tải đợt ốm. Trang sẽ tự tải khi có mạng lại.",
+    );
+    const failed = render({
+      ...LOADING,
+      isPending: false,
+      isError: true,
+      error: new Error("boom"),
+      fetchStatus: "idle",
+    });
+    expect(failed).toContain(">Có lỗi xảy ra: boom</p>");
+    expect(failed).toContain(">Thử lại</button>");
+  });
+});
+
+describe("EpisodeListBody", () => {
+  it("Bắt đầu đợt ốm reports the tap, from the section and from the empty state", () => {
+    const onStart = vi.fn();
+    for (const view of [
+      {
+        open: null,
+        past: [{ id: "oct", href: "/x", text: "10/10 – 13/10 · 4 ngày" }],
+      },
+      { open: null, past: [] },
+    ]) {
+      const [button] = findElements(
+        EpisodeListBody({ view, starting: false, onStart }),
+        (el) =>
+          el.props.children === "Bắt đầu đợt ốm" ||
+          (el.props.action as { label?: string } | undefined)?.label ===
+            "Bắt đầu đợt ốm",
+      );
+      const tap = (button.props.onClick ??
+        (button.props.action as { onClick: () => void }).onClick) as () => void;
+      tap();
+    }
+    expect(onStart).toHaveBeenCalledTimes(2);
+  });
+
+  it("the start button waits while an episode is being started", () => {
+    const html = renderToStaticMarkup(
+      <EpisodeListBody
+        view={{ open: null, past: [{ id: "oct", href: "/x", text: "a" }] }}
+        starting
+        onStart={() => {}}
+      />,
+    );
+    expect(html).toMatch(/aria-busy="true"[^>]*>Bắt đầu đợt ốm</);
+  });
+});
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 199 passed (200)`, `Tests  1865 passed (1865)`. File test mới không nạp được vì `./EpisodeListScreen` chưa có, nên 10 test của nó chưa được đếm.

- [x] **Step 3: Viết trang danh sách (Patch 4)**

```diff
diff --git a/app/dot-om/page.tsx b/app/dot-om/page.tsx
new file mode 100644
index 0000000..0811a25
--- /dev/null
+++ b/app/dot-om/page.tsx
@@ -0,0 +1,16 @@
+"use client";
+
+import { AuthGate } from "@/components/AuthGate";
+import { EpisodeListScreen } from "@/components/illness/EpisodeListScreen";
+
+export default function Page() {
+  return (
+    <AuthGate need="baby">
+      {({ session, ctx }) =>
+        ctx?.baby && session ? (
+          <EpisodeListScreen baby={ctx.baby} userId={session.user.id} />
+        ) : null
+      }
+    </AuthGate>
+  );
+}
diff --git a/components/illness/EpisodeListScreen.tsx b/components/illness/EpisodeListScreen.tsx
new file mode 100644
index 0000000..0eec29a
--- /dev/null
+++ b/components/illness/EpisodeListScreen.tsx
@@ -0,0 +1,181 @@
+"use client";
+
+import Link from "next/link";
+import { useRouter } from "next/navigation";
+import { Button } from "@/components/ui/Button";
+import { EmptyState } from "@/components/ui/EmptyState";
+import { ErrorCard } from "@/components/ui/ErrorCard";
+import { Icon } from "@/components/ui/Icon";
+import { ListGroup, ListRow } from "@/components/ui/ListGroup";
+import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
+import { PageHeader } from "@/components/ui/PageHeader";
+import { Skeleton } from "@/components/ui/Skeleton";
+import { StatusChip } from "@/components/ui/StatusChip";
+import { useToast } from "@/components/ui/Toast";
+import { toVietnameseError } from "@/lib/data/errors";
+import { useEpisodeActions, useEpisodes } from "@/lib/data/illness";
+import { useRangeLogs } from "@/lib/data/logs";
+import { useLogsRealtime } from "@/lib/data/realtime";
+import { useNow } from "@/lib/hooks/useNow";
+import { planStart } from "@/lib/rules/illnessForm";
+import {
+  episodeHref,
+  episodeList,
+  type EpisodeListView,
+} from "@/lib/rules/illnessView";
+import type { Baby } from "@/lib/supabase/rows";
+import { CATEGORY_CHIP } from "@/lib/ui/categories";
+import { cx } from "@/lib/ui/cx";
+
+function SectionTitle({ children }: { children: string }) {
+  return <h2 className="mx-1 text-xl font-bold text-ink">{children}</h2>;
+}
+
+// Spec 2026-11-26 §6.2: the three states of the list, drawn without hooks.
+// Exported for the temporary fixture page of the browser check.
+export function EpisodeListBody({
+  view,
+  starting,
+  onStart,
+}: {
+  view: EpisodeListView;
+  // "Bắt đầu đợt ốm" is on its way.
+  starting: boolean;
+  onStart: () => void;
+}) {
+  if (!view.open && view.past.length === 0)
+    return (
+      <EmptyState
+        icon="calendar"
+        text="Chưa có đợt ốm nào"
+        detail="Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ."
+        action={{ label: "Bắt đầu đợt ốm", onClick: onStart }}
+      />
+    );
+  return (
+    <>
+      <section className="flex flex-col gap-2.5">
+        <SectionTitle>Đang diễn ra</SectionTitle>
+        {view.open ? (
+          <Link
+            href={view.open.href}
+            className="glass flex items-center gap-3 rounded-[26px] px-4 py-3.5 text-ink"
+          >
+            <span
+              className={cx(
+                "flex size-10 shrink-0 items-center justify-center rounded-full",
+                CATEGORY_CHIP["cat-temp"],
+              )}
+            >
+              <Icon name="thermo" size={20} strokeWidth={2.2} />
+            </span>
+            {/* The chip sits under the title: at 375 px the two do not fit
+                side by side (the title is 165 px or more, a chip up to
+                91 px, and the row has 247 px for both). */}
+            <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
+              <span className="text-base font-bold">{view.open.title}</span>
+              {view.open.chip && (
+                <StatusChip tone={view.open.chip.tone}>
+                  {view.open.chip.text}
+                </StatusChip>
+              )}
+            </span>
+            <Icon name="chevronRight" size={18} className="text-muted" />
+          </Link>
+        ) : (
+          <Button block busy={starting} onClick={onStart}>
+            Bắt đầu đợt ốm
+          </Button>
+        )}
+      </section>
+      {view.past.length > 0 && (
+        <section className="flex flex-col gap-2.5">
+          <SectionTitle>Đã qua</SectionTitle>
+          <ListGroup>
+            {view.past.map((row) => (
+              <ListRow key={row.id} label={row.text} href={row.href} />
+            ))}
+          </ListGroup>
+        </section>
+      )}
+    </>
+  );
+}
+
+// Spec 2026-11-26 §6.2: every illness episode of the baby.
+export function EpisodeListScreen({
+  baby,
+  userId,
+}: {
+  baby: Baby;
+  userId: string;
+}) {
+  // The chip of the open episode follows logs written on another phone.
+  useLogsRealtime(baby.id);
+  const now = useNow(60_000);
+  const router = useRouter();
+  const toast = useToast();
+  const episodes = useEpisodes(baby.id);
+  const actions = useEpisodeActions(baby.id, userId);
+  const all = episodes.data ?? [];
+  const current = all.find((episode) => episode.ended_at === null) ?? null;
+  // The chip of the open episode needs its logs; with none open, none are read.
+  const openLogs = useRangeLogs(
+    baby.id,
+    current?.started_at ?? "",
+    null,
+    current !== null,
+  );
+  const view = episodeList({
+    episodes: all,
+    openLogs: current ? openLogs.data : undefined,
+    now,
+  });
+
+  // Spec §6.2: starts now, then opens the new episode's page. A refusal is a
+  // toast and nothing is queued (§5.7).
+  function start() {
+    // A second tap while the first is still being queued would start twice.
+    if (actions.start.isPending) return;
+    const plan = planStart(all, new Date());
+    if (!plan.ok) {
+      toast(plan.message);
+      return;
+    }
+    actions.start.mutate(
+      { startedAt: plan.startedAt },
+      {
+        onSuccess: (id) => router.push(episodeHref(id)),
+        onError: (error) => toast(toVietnameseError(error)),
+      },
+    );
+  }
+
+  return (
+    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2 pb-4">
+      <PageHeader
+        title="Đợt ốm"
+        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
+      />
+      {waitingForNetwork(episodes) ? (
+        <NeedsNetwork what="đợt ốm" />
+      ) : episodes.isPending ? (
+        <div className="flex flex-col gap-2.5">
+          <Skeleton className="h-[68px] rounded-[26px]" />
+          <Skeleton className="h-[52px] rounded-[22px]" />
+        </div>
+      ) : episodes.isError && !episodes.data ? (
+        <ErrorCard
+          message={toVietnameseError(episodes.error)}
+          onRetry={() => void episodes.refetch()}
+        />
+      ) : (
+        <EpisodeListBody
+          view={view}
+          starting={actions.start.isPending}
+          onStart={start}
+        />
+      )}
+    </main>
+  );
+}
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  200 passed (200)`, `Tests  1875 passed (1875)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add components/illness/EpisodeListScreen.tsx components/illness/episodelist.test.tsx app/dot-om/page.tsx
git commit -m "feat(illness): the list of episodes at /dot-om" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M2f, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-illness/page.tsx` (trang tạm, không commit)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; `main` có M2f: hai trang mở được bằng địa chỉ.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  200 passed (200)`, `Tests  1875 passed (1875)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

Trong bảng trang của `bun run build`, `/dot-om` và `/dot-om/chi-tiet` phải mang dấu `○` (trang tĩnh). Thấy lỗi "Missing Suspense boundary with useSearchParams" thì `EpisodeDetailPage` đã mất `Suspense`: dừng và sửa.

- [x] **Step 3: Tạo trang fixture tạm**

Dữ liệu thật chưa có đợt ốm nào và không được tạo đợt trên dữ liệu thật, nên trang chi tiết có nội dung và mọi trạng thái của danh sách chỉ thấy được ở đây. Trang dùng `EpisodeBody` và `EpisodeListBody` (phần vẽ của hai trang) với dữ liệu giả. Trang này không đọc hay ghi dữ liệu của gia đình và vẽ được khi chưa đăng nhập. Tạo `app/fixture-illness/page.tsx` (không commit):

```tsx
"use client";

import { EpisodeListBody } from "@/components/illness/EpisodeListScreen";
import { EpisodeBody } from "@/components/illness/EpisodeScreen";
import type { LogLike } from "@/lib/rules/describeLog";
import type { EpisodeLike } from "@/lib/rules/illness";
import { episodeList } from "@/lib/rules/illnessView";

// Giờ cố định, để máy chủ và trình duyệt vẽ giống nhau.
const NOW = new Date("2026-11-26T10:00:00+07:00");
const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const episode = (
  id: string,
  start: string,
  end: string | null = null,
): EpisodeLike => ({
  id,
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

const OPEN = episode("open", "2026-11-24 20:10");
const PAST = [
  episode("oct", "2026-10-12 08:00", "2026-10-13 09:00"),
  episode("sep", "2026-09-28 08:00", "2026-10-02 09:00"),
  // Vắt qua năm: ngày thuộc năm khác viết đủ năm.
  episode("newyear", "2025-12-28 08:00", "2026-01-12 09:00"),
];

// Năm trạng thái của thẻ "Đang diễn ra", rồi hai trạng thái không có đợt mở.
const CASES: { name: string; episodes: EpisodeLike[]; logs?: LogLike[] }[] = [
  {
    name: "đang sốt, dưới 39",
    episodes: [OPEN, ...PAST],
    logs: [temp("2026-11-26 09:00", 38.5)],
  },
  {
    name: "đang sốt, từ 39",
    episodes: [OPEN],
    logs: [temp("2026-11-26 09:00", 39.5)],
  },
  {
    name: "chưa đo lại",
    episodes: [OPEN],
    logs: [temp("2026-11-25 09:00", 38.5)],
  },
  {
    name: "hết sốt",
    episodes: [OPEN],
    logs: [temp("2026-11-25 09:00", 38.5), temp("2026-11-26 09:00", 37)],
  },
  { name: "không sốt", episodes: [OPEN], logs: [temp("2026-11-26 09:00", 37)] },
  { name: "chưa đo (không chip)", episodes: [OPEN], logs: [] },
  {
    name: "đợt mở từ tháng trước, ngày thứ 31 (tiêu đề dài nhất) với chip dài nhất",
    episodes: [episode("long", "2026-10-27 08:00")],
    logs: [temp("2026-11-25 09:00", 38.5)],
  },
  { name: "không có đợt mở, có đợt đã qua", episodes: PAST },
  { name: "chưa có đợt nào", episodes: [] },
];

// Trang chi tiết: một đợt đang mở ba ngày và chính đợt đó sau khi đóng.
const DETAIL_LOGS = [
  temp("2026-11-24 20:10", 38.6),
  temp("2026-11-25 02:15", 39.2),
  temp("2026-11-25 14:00", 38.9),
  temp("2026-11-25 21:00", 38.4),
  temp("2026-11-26 07:05", 37.6),
  dose("2026-11-24 20:20"),
  dose("2026-11-25 02:20"),
  dose("2026-11-25 14:05"),
  symptom("2026-11-25 08:00", ["fever", "runny_nose", "cough", "fussy"]),
  symptom("2026-11-26 08:00", ["runny_nose", "cough"]),
];
const DETAILS: { name: string; episode: EpisodeLike }[] = [
  { name: "Trang chi tiết · đợt đang mở", episode: OPEN },
  {
    name: "Trang chi tiết · đợt đã đóng",
    episode: episode("closed", "2026-11-24 20:10", "2026-11-26 08:30"),
  },
];
const CASE = "px-1 text-[13px] text-muted";

// Không nút nào ở đây ghi dữ liệu: mọi hàm bấm đều rỗng.
export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2 pb-32">
      <p className="text-ink">Fixture trang đợt ốm</p>
      {DETAILS.map((item) => (
        <div
          key={item.name}
          data-case={item.name}
          className="flex flex-col gap-[18px]"
        >
          <span className={CASE}>{item.name}</span>
          <EpisodeBody
            episode={item.episode}
            logs={DETAIL_LOGS}
            babyName="Bun"
            now={NOW}
            closing={false}
            onLog={() => {}}
            onClose={() => {}}
          />
        </div>
      ))}
      {CASES.map((item) => (
        <div
          key={item.name}
          data-case={item.name}
          className="flex flex-col gap-2.5"
        >
          <span className={CASE}>Danh sách · {item.name}</span>
          <EpisodeListBody
            view={episodeList({
              episodes: item.episodes,
              openLogs: item.logs,
              now: NOW,
            })}
            starting={false}
            onStart={() => {}}
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

Trên trang tạm `http://localhost:3000/fixture-illness`:

1. Trang có hai khối "Trang chi tiết" rồi chín khối "Danh sách". `document.documentElement.scrollWidth <= window.innerWidth` là `true`.
2. **"Trang chi tiết · đợt đang mở":** từ trên xuống: thẻ kết luận "Bun đã hết sốt 13 giờ" có ba nút; thẻ "Nhiệt độ và thuốc hạ sốt" có hình; mục "Từng ngày" ba hàng; rồi nút "Bé đã khỏi" rộng hết bề ngang, cao ít nhất 44 px. Các khối cách nhau đều. Không có "So với thường ngày", "Báo cáo cho bác sĩ", "Lần khám" (M4, M5). **Không nút nào ở đây ghi dữ liệu** (mọi hàm bấm của trang tạm đều rỗng).
3. **"Trang chi tiết · đợt đã đóng":** thẻ "Đã khỏi sau 3 ngày" với dòng "24/11 – 26/11", không có ba nút; biểu đồ và "Từng ngày" như trên; không có nút "Bé đã khỏi".
4. **Sáu khối danh sách đầu:** tiêu đề mục "Đang diễn ra"; thẻ có icon nhiệt kế trong ô tròn, dòng "Từ 24/11 · ngày thứ 3" trên **một dòng**, chip nằm **dưới** dòng đó, mũi tên bên phải. Chip theo từng khối: "Đang sốt" (vàng), "Đang sốt" (đỏ), "Chưa đo lại", "Hết sốt", "Không sốt", và không có chip ở khối "chưa đo". Khối đầu có thêm mục "Đã qua" với ba hàng, mới nhất trước: "12/10 – 13/10 · 2 ngày", "28/09 – 02/10 · 5 ngày", "28/12/2025 – 12/01 · 16 ngày", mỗi hàng một dòng và có mũi tên.
5. **"đợt mở từ tháng trước…":** "Từ 27/10 · ngày thứ 31" vẫn trên một dòng, chip "Chưa đo lại" bên dưới.
6. **"không có đợt mở, có đợt đã qua":** dưới "Đang diễn ra" là nút "Bắt đầu đợt ốm" rộng hết bề ngang; rồi "Đã qua".
7. **"chưa có đợt nào":** icon lịch, "Chưa có đợt ốm nào", dòng "Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ." (được xuống dòng), nút "Bắt đầu đợt ốm"; không có tiêu đề mục nào.
8. Chạy đoạn đo dưới: mọi tiêu đề của thẻ "Đang diễn ra" và mọi hàng "Đã qua" đều một dòng (đo khi viết plan ở 375 px: tiêu đề rộng 160 px, bản dài nhất 169 px; thẻ cao 80 px khi có chip và 70 px khi không).

```js
const lines = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return new Set([...range.getClientRects()].map((r) => Math.round(r.top)))
    .size;
};
JSON.stringify({
  cards: [...document.querySelectorAll("[data-case] a.glass")].map((card) => {
    const title = card.querySelector("span.font-bold");
    return `${title.textContent}: ${lines(title)} dòng, rộng ${Math.round(title.getBoundingClientRect().width)}, thẻ cao ${Math.round(card.getBoundingClientRect().height)}`;
  }),
  past: [...document.querySelectorAll("[data-case] li")].map(
    (row) =>
      `${row.textContent}: ${lines(row.querySelector("span.text-base"))} dòng`,
  ),
});
```

9. Lặp lại các mục trên trang tạm với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"` (chạy trong trang; không lưu, không đụng Cài đặt). Ở `night`: các chip của thẻ "Đang diễn ra" phân biệt bằng chữ. Hai khối "Đang sốt" (dưới 39 và từ 39) chỉ khác màu: trên danh sách, sốt dưới hay từ 39 không phải hai trạng thái riêng, nên ở `night` chúng trông như nhau là đúng. Biểu đồ như đã kiểm ở M2c.
10. Đặt bề ngang 390 rồi 440 và chạy lại đoạn đo của mục 8.

Trang thật (dữ liệu thật của gia đình: **chỉ xem**; cần đăng nhập trong khung Browser). Chưa có lối vào từ tab Sức khỏe (M2g), nên gõ thẳng địa chỉ:

11. `http://localhost:3000/dot-om`: tiêu đề lớn "Đợt ốm", nút quay lại ghi "Sức khỏe", tab Sức khỏe **chưa** sáng (M2g mới thêm). Gia đình chưa có đợt nào thì trang là trạng thái trống của mục 7. **Không bấm "Bắt đầu đợt ốm".** Nếu lúc này gia đình đã có đợt ốm (do người dùng tự tạo), chỉ xem: thẻ và các hàng theo đúng dạng của mục 4.
12. `http://localhost:3000/dot-om/chi-tiet?id=khong-co`: nút quay lại ghi "Đợt ốm"; "Không tìm thấy đợt ốm này" và đường dẫn "Về danh sách"; không có nút bút chì. Bấm "Về danh sách": về `/dot-om`. `http://localhost:3000/dot-om/chi-tiet` (không có `id`): cùng trạng thái đó.
13. Nếu gia đình đã có đợt ốm: mở trang chi tiết của nó, chỉ xem, so thứ tự các khối với mục 2 hoặc 3. **Không bấm "Bé đã khỏi"; không bấm "Lưu" trong phiếu nào; trong phiếu "Sửa đợt ốm" chỉ bấm nút đóng.** Chưa có đợt nào thì ghi "trang chi tiết thật chưa xem được, chỉ thấy trên trang tạm".
14. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở các trang thật đã mở. Lọc console bằng `onlyErrors`: không có lỗi. Trang danh sách thật báo lỗi tải (thẻ có "Thử lại") thì dừng: nhiều khả năng migration của M2a chưa được áp.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo: các con số của đoạn đo ở từng bề ngang; mục nào thấy trên trang thật, mục nào chỉ thấy trên trang tạm. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

**Kết quả Step 4 (2026-11-27, khung Browser trong app; server dev chạy bằng `preview_start`, đã tắt):**

Trang tạm `/fixture-illness`, 375×812, theme `rose` (giữ bằng `MutationObserver`), đã xóa `nextjs-portal`:

1. Đạt. Hai khối "Trang chi tiết", chín khối "Danh sách" (thêm một khối "phiếu sửa" của phiên này, xem dưới). `scrollWidth <= innerWidth` là `true`; không phần tử nào bị cắt "…".
2. Đạt. Đợt đang mở: thẻ "Bun đã hết sốt 13 giờ" (1 dòng) 343×283 với ba nút 98×44; thẻ biểu đồ 343×280 (`aria-label` "Biểu đồ nhiệt độ: 5 lần đo, cao nhất 39,2°C, 3 liều hạ sốt."); "Từng ngày" ba hàng (343×328); nút "Bé đã khỏi" 343×50. Khoảng cách giữa các khối 18, 18, 17 px (17 do làm tròn). Không có "So với thường ngày", "Báo cáo cho bác sĩ", "Lần khám".
3. Đạt. Đợt đã đóng: "Đã khỏi sau 3 ngày", dòng "24/11 – 26/11", không nút nào trong khối; biểu đồ và "Từng ngày" như trên.
4. Đạt. Sáu khối đầu: "Từ 24/11 · ngày thứ 3" 1 dòng, rộng 160; chip nằm dưới tiêu đề: "Đang sốt" (`warn`) 77×22, "Đang sốt" (`danger`) 77×22, "Chưa đo lại" 91×22, "Hết sốt" 66×22, "Không sốt" 84×22, khối "chưa đo" không chip; mỗi thẻ có icon nhiệt kế và mũi tên. "Đã qua" ba hàng đúng thứ tự, mỗi hàng 1 dòng, cao 52–53, có mũi tên.
5. Đạt. "Từ 27/10 · ngày thứ 31": 1 dòng, rộng 169, chip "Chưa đo lại" bên dưới.
6. Đạt. Nút "Bắt đầu đợt ốm" 343×50 dưới "Đang diễn ra", rồi "Đã qua".
7. Đạt. Icon lịch, "Chưa có đợt ốm nào" (1 dòng), dòng phụ 2 dòng, nút "Bắt đầu đợt ốm" 144×44; không tiêu đề mục.
8. Đạt, đúng số của plan: tiêu đề 160 px (bản dài nhất 169 px), thẻ 343×80 khi có chip và 343×70 khi không.
9. Đạt. `light`, `dark`, `night`: mọi số đo ở trên giống `rose` từng con số (so cả chuỗi kết quả). Nhìn bằng mắt: `rose` (cả trang), `night` (chi tiết, danh sách, hai khối cuối), `dark` (chi tiết, danh sách), `light` (chi tiết, hai khối cuối). `night`: các chip đọc được bằng chữ; hai khối "Đang sốt" khác nhau rất ít (đúng như plan ghi).
10. Đạt. 390 px: tiêu đề 160 và 169, 1 dòng; thẻ 358×80 / 358×70; ba nút 103×44; "Bé đã khỏi" và "Bắt đầu đợt ốm" 358×50; thẻ biểu đồ 358×290. 440 px: thẻ 408×80 / 408×70; ba nút 119×44; nút 408×50; thẻ biểu đồ 408×321. Ở cả hai: không tràn, không "…", hàng "Đã qua" 1 dòng, dòng phụ của trạng thái trống 2 dòng.

Trang thật (đã đăng nhập sẵn trong khung; 375 px, theme `dark` của máy; **không bấm nút ghi nào**):

11. Đạt. `/dot-om`: tiêu đề "Đợt ốm", nút quay lại "Sức khỏe" → `/suc-khoe`, không tab nào sáng thêm; gia đình chưa có đợt nào nên trang là trạng thái trống của mục 7. Lệnh `GET …/rest/v1/illness_episodes` (tham số `select`, `baby_id`, `order`) trả **200**. Không bấm "Bắt đầu đợt ốm".
12. Đạt. `/dot-om/chi-tiet?id=khong-co`: nút quay lại "Đợt ốm" → `/dot-om`, "Không tìm thấy đợt ốm này", đường dẫn "Về danh sách", không có bút chì; bấm "Về danh sách" về `/dot-om`. `/dot-om/chi-tiet` (không `id`): cùng trạng thái. Ở hai địa chỉ này không có lệnh đọc bản ghi theo khoảng nào được gửi (chỉ có lệnh đọc bản ghi gần đây của app).
13. Trang chi tiết thật chưa xem được (gia đình chưa có đợt nào), chỉ thấy trên trang tạm. **Chưa kiểm:** nút bút chì mở `EpisodeSheet` từ `EpisodeScreen` thật, ba nút ghi nhanh mở `QuickEntrySheet`, "Bé đã khỏi", việc chuyển trang sau "Bắt đầu đợt ốm" và sau "Xóa đợt ốm".
14. Đạt. `scrollWidth <= innerWidth` là `true` ở cả ba địa chỉ; console lọc `onlyErrors`: không có gì; không có thẻ lỗi tải.

Ghi chú về cách đo: `read_network_requests` của khung Browser không liệt kê lệnh `fetch` tới Supabase (chỉ thấy tài nguyên của `localhost`), nên mã 200 ở mục 11 đọc từ Resource Timing trong trang (`performance.getEntriesByType("resource")`, `responseStatus`), không in token hay mã của bé.

**`EpisodeSheet` thật trên trang tạm** (ngoài plan, theo lời giao của phiên: trang tạm có thêm `SheetHarness.tsx` dựng `EpisodeSheet` có trạng thái với đợt ốm giả, mã không phải uuid; `window.confirm` ở trang đó luôn trả lời "không" và ghi lại câu hỏi). Chỉ bấm những đường mà code không gọi `mutate`; 375 px, `rose`:

- Phiếu đợt đang mở: chỉ có ô "Bắt đầu", "Lưu", "Xóa đợt ốm". "Lưu" khi không đổi gì: phiếu đóng (`onClose`), không ghi gì.
- Ô "Bắt đầu" đặt sang năm 2099 rồi "Lưu": "Giờ bắt đầu ở tương lai." dưới ô, 1 dòng, phiếu ở lại. Xóa trống ô rồi "Lưu": "Nhập giờ bắt đầu".
- Đóng khi đang sửa dở (nút "Đóng", rồi Esc): hộp "Bỏ thay đổi?" 300×214 với hai nút 264×50. "Tiếp tục nhập": về phiếu, ô và câu lỗi còn nguyên. "Bỏ thay đổi": phiếu đóng; mở lại thì ô về giờ cũ, không còn câu lỗi.
- "Xóa đợt ốm": hỏi đúng câu "Xóa đợt ốm này? Các bản ghi nhiệt độ, thuốc, triệu chứng vẫn giữ nguyên."; trả lời "không" thì không có gì xảy ra, `onDeleted` không chạy.
- Phiếu đợt đã đóng mà dữ liệu giả có một đợt khác chồng lên: "Mở lại đợt ốm" bị từ chối, câu "Trùng thời gian với một đợt ốm khác." hiện trong phiếu, ngay trên nút "Lưu" (317×23, 1 dòng), đọc được ở `rose` và `night`. "Lưu" sau đó: câu ấy chuyển xuống dưới ô "Bắt đầu", dòng báo phía trên nút biến mất. Ô "Kết thúc" năm 2099: "Giờ kết thúc ở tương lai."; xóa trống: "Nhập giờ kết thúc"; trước giờ bắt đầu: "Giờ kết thúc phải sau giờ bắt đầu.". Phiếu cao nhất 359×496, đáy 804 / 812.
- Sau mọi lần bấm: hàng chờ `outbox` trong IndexedDB có 0 mục; đo lại bằng Resource Timing (tải lại trang tạm, "Lưu" không đổi và "Mở lại" bị từ chối): trang tạm không gửi lệnh nào ra ngoài `localhost`; console không lỗi.
- **Chưa kiểm:** `mutate` của `submit`, `reopen`, `remove` chạy thật (một lần "Lưu" hợp lệ, "Mở lại" được nhận, "Xóa" được đồng ý) và hai nhánh `onSuccess`, `onError` của chúng: phải ghi vào hàng chờ thật nên để cho Bước 38.

Không lỗi nào lộ ra ở bước này; không có code nào đổi sau Task 2. Một điều thấy được, không sửa (thuộc M2c): nhãn "37,6" của chấm mới nhất nằm trên chấm và đè lên đường nét đứt 38°C, một nét đứt ló ra ngay sau số; số vẫn đọc được nhờ viền.

Ảnh và bản fixture để ở thư mục ghi chú chung của nhóm phiên (ngoài repo): `m2f-*.jpg`, `m2f-fixture-page.tsx.txt`, `m2f-fixture-sheet-harness.tsx.txt`.

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
git add docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2f.md
git commit -m "docs(plan): the M2f plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

**Kết quả (2026-11-27):**

- **Số xuất phát khác plan.** M2c thêm 3 test và M2d thêm 1 test so với lúc viết plan này, nên nền thật là **198 file / 1856 test** (plan ghi 1852) và mọi con số test xanh của plan cộng thêm 4. Số test đỏ không đổi.
- Step 0: `M2e có trên main`; `Test Files  198 passed (198)`, `Tests  1856 passed (1856)`. Plan M2a có ghi giờ áp migration (09:35–09:48 ngày 2026-11-27, dry-run sau đó "Remote database is up to date.").
- Task 1: đỏ `Test Files  1 failed | 198 passed (199)`, `Tests  1856 passed (1856)` (file test không nạp được, đúng như plan); xanh `199 passed`, `1869 passed` (plan 1865 + 4); `tsc --noEmit` thoát 0.
- Task 2: đỏ `Test Files  1 failed | 199 passed (200)`, `Tests  1869 passed (1869)`; xanh `200 passed`, `1879 passed` (plan 1875 + 4); `tsc --noEmit` thoát 0.
- Bốn patch áp sạch bằng `kb_patch`, không sửa tay dòng nào.
- Step 1: `tsc --noEmit` thoát 0; **200 file / 1879 test**. Chạy lại sau khi xóa trang tạm: vẫn vậy.
- Step 2: `bun run build` lần đầu thoát 1 với thông báo bảo mật của Next.js 16.4.3 (không chạy `next upgrade`), lần hai thoát 0: `✓ Generating static pages (42/42)`, `/dot-om` và `/dot-om/chi-tiet` đều mang dấu `○`.
- Step 4: xem kết quả ngay dưới Step 4.
- Step 5: sau khi xóa trang tạm `tsc` đỏ giả vì `.next/dev/types/validator.ts`; `rm -rf .next/dev/types .next/types` rồi chạy lại: thoát 0.
- Không lỗi nào phải sửa; không test nào thêm ngoài plan.
- Spec, cùng commit docs này (mỗi chỗ có chú thích "Khác bản đã duyệt ngày 2026-11-26"): §4.2 danh sách đợt ốm tải lại sau mỗi lần outbox gửi xong (M2a); §4.3 nới 2 phút cho đợt đang mở (M2b); §5.2 nhiệt độ viết bằng `formatCelsius`, 38,0 là "38" như trang Báo cáo; §6.2 chip nằm dưới tiêu đề, thẻ luôn có mũi tên (M2f); §6.5 chỗ đặt nhãn, chữ "Sốt" đổi góc, câu `aria-label` (M2c).
- **Chưa kiểm:** theme `peach`, `lavender`, `sea`; iPhone thật và Safari iOS; trang chi tiết thật có nội dung và mọi nút ghi (mục 13 của Step 4); `mutate` của `EpisodeSheet`; trạng thái đang tải, mất mạng, lỗi của hai trang trong trình duyệt (chỉ có test); việc realtime đổi chip.

- [x] **Step 7: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m2f
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm, mục nào chưa; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
