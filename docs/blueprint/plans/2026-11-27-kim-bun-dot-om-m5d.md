# Kim Bun — Đợt ốm M5d: thẻ "Lần khám" trên trang chi tiết Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§8.3; §6.3 mục 6; dòng "Từ M5" của §6.4; phần "thẻ lần khám" và "trang chi tiết" của §10.1; phần "thẻ lần khám có 0, 1 và 6 ảnh" của §10.3; phần "thêm lần khám có ảnh" của §10.4)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Trang chi tiết của một đợt ốm có thẻ "Lần khám": danh sách lần khám cũ trước, nút "Thêm" và bấm vào lần khám để sửa (sheet của M5c), bấm ảnh để xem lớn. "Xóa đợt ốm" tắt khi đợt còn lần khám. Lần khám dùng được thật từ plan này. Thêm lần khám cho một đợt vừa bắt đầu mà outbox chưa gửi thì server từ chối với câu "Bản ghi liên quan không còn." (M5c, Diễn giải spec mục 13).

**Architecture:**

- **`components/illness/VisitsCard.tsx`:** `VisitsCardView` vẽ thẻ không dùng hook; `VisitsCard` nhận kết quả `useVisits` của trang, lọc lần khám của đợt (`visitsOf`), lấy đường dẫn ảnh (`usePhotoUrls`), mở `VisitSheet` (M5c) và `PhotoViewer` của trang Ảnh (chỉ xem).
- **`EpisodeScreen`:** đọc `useVisits` một lần; `EpisodeBody` nhận thẻ qua một chỗ trống `visits` (để `EpisodeBody` vẫn không dùng hook) và đặt nó sau thẻ "So với thường ngày"; `EpisodeSheet` nhận `deleteBlock` từ `episodeDeleteBlock` (M5b).
- **`EpisodeSheetView`:** "Xóa đợt ốm" tắt khi có `deleteBlock`, dòng lý do ngay dưới nút.
- Không thêm gói, không thêm token màu, không thêm icon, không có migration.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m5d`, cắt từ `main` sau khi M5c đã lên. Baseline: 2034 test (212 file) vitest xanh, typecheck sạch.

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

1. **Chỗ của thẻ:** sau thẻ "So với thường ngày", trên nút "Báo cáo cho bác sĩ" (§6.3 mục 5–7). Có ở cả đợt đang mở và đợt đã đóng; nút "Thêm" có ở cả hai.
2. **Một lần khám trong thẻ** (§8.3): dòng "{dd/mm} {HH:mm} · {nơi khám}" chữ 13 px màu nhạt; nhãn nhỏ "Bác sĩ kết luận" và kết luận đậm chỉ có khi có kết luận (§11: kết luận luôn có nhãn); lời dặn chữ 13 px, giữ các chỗ xuống dòng như lúc gõ; các ô ảnh 60×78. Phần chữ là một nút mở sheet sửa; mỗi ô ảnh là một nút riêng mở ảnh lớn (một nút không được nằm trong nút khác). Nhãn đọc màn hình của ô ảnh là "Ảnh 1", "Ảnh 2", …
3. **Xem ảnh lớn** dùng `PhotoViewer` của trang Ảnh với `canDelete` tắt: chỉ xem. Xóa ảnh của lần khám làm trong sheet (§8.4), để danh sách lần khám được tải lại đúng.
4. **Thẻ khi danh sách lần khám chưa có:** đang tải: một khung chờ; mất mạng mà chưa từng tải: "Cần mạng để tải lần khám. Trang sẽ tự tải khi có mạng lại." (`NeedsNetwork`); lỗi: thẻ lỗi có "Thử lại". "Thêm" tắt cho tới khi danh sách đã tải. Mất mạng: dòng "Cần kết nối mạng để thay đổi các mục dưới đây." (`OfflineNote` của M5c) dưới tiêu đề và "Thêm" tắt; danh sách đã tải vẫn hiện (cache giữ trên máy).
5. **Trang đọc lần khám một lần** (`useVisits` trong `EpisodeScreen`), cho thẻ và cho lý do tắt "Xóa đợt ốm"; M5e dùng tiếp cho vạch "Khám" của biểu đồ.
6. **"Xóa đợt ốm"** (§6.4 từ M5): tắt khi `episodeDeleteBlock` có lý do; dòng lý do chữ 13 px màu nhạt ngay dưới nút, chỉ khi người đó thấy nút (chủ gia đình hoặc người tạo). Lần khám do máy khác thêm sau lúc kiểm: server từ chối lệnh xóa của outbox (khóa ngoại, mã `23503`), outbox bỏ lệnh đó với câu sẵn có "Bản ghi liên quan không còn", và đợt hiện lại sau lần tải lại. Ghi vào spec §6.4 (Patch 3).
7. **Bước 38 mục 29–33** do plan này thêm: thêm lần khám có ảnh, sửa, mất mạng, "Xóa đợt ốm" tắt, xóa ảnh và xóa lần khám. Mục 30 kiểm "Lúc khám nằm ngoài đợt ốm." bằng cách đặt "Lúc khám" sang hôm qua (trước giờ bắt đầu của đợt).
8. **Trên trang thật chỉ xem.** Gia đình chưa có đợt ốm (lúc viết plan) và không được tạo đợt hay lần khám trên dữ liệu thật; thẻ đủ trạng thái chỉ thấy trên trang tạm. Bước 38 mục 29–33 để người dùng làm trên iPhone thật.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 3** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5d.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 3 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `864a3ea` cộng 18 patch của M4a, M4b, M4c và 10 patch của M5a, M5b, M5c trích từ các file plan đó (nền tạm trong lúc M4 chưa lên `main`). Trong bản chạy thử task code là hai commit (test trước, code sau; còn làm theo plan thì một commit ở Step 5). `tsc --noEmit` sạch sau commit code; số test đỏ và xanh là số đo thật trên cả bộ test. Patch 3 được sinh trên spec đã có các đoạn của M4, M5b, M5c và trên checklist đã có mục 25–28 của M4c. `bun run build` đã chạy xanh.
- **Đo lại trên `main` thật.** Sau khi M4c lên, `main` @ `88caf0b` (cây code trùng khít nền tạm ở trên, chỉ khác các file plan) được chép ra một bản sao sạch; mọi patch của M5 trích từ chính các file plan được áp lần lượt lên đó và đo lại: đỏ (3 file, 3 test) và xanh (213/2044) đúng như ghi; `tsc` sạch; build 42/42. Cây cuối trùng bản chạy thử.
- **Đã nhìn thử khi viết plan.** Trang tạm của Task 2 đã được mở ở 375 px trên bản sao ở trạng thái cuối của M5 (theme `rose` và `night`): số đo ở các mục của bước trình duyệt là của lần đó. Chưa xem: bề ngang 390 và 440, các theme `peach`, `lavender`, `sea`, mọi trang thật.
- **Trang tạm** vẽ `VisitsCardView`, `EpisodeBody` và `EpisodeSheetView` với dữ liệu giả, ảnh là hình vẽ tại chỗ (`data:` SVG); không đọc hay ghi gì của gia đình. Mã màu trong hình vẽ đó chỉ nằm ở trang tạm, không commit.
- **Trình duyệt.** Dùng khung Browser trong app, cỡ 375×812 (`resize_window` preset `mobile`); người dùng đã chọn sẵn ngày 2026-11-26, không hỏi lại. Gọi `navigate` trước. Chỉ khi bộ kiểm quyền của app từ chối khung Browser thì hỏi người dùng đúng một câu rồi làm tiếp. Trang tạm vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập trong khung đó. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại `resize_window` và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt lại theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt nó khi xong. Bấm theo `ref` của `find`, không bấm theo tọa độ trên trang thật. Không đọc cả console: lọc bằng `onlyErrors` và `limit` nhỏ.
- **pgTAP.** Plan này không đổi DB nên không chạy pgTAP.
- **Người dùng muốn màn hình gọn, ít số.** Không thêm chữ nào ngoài plan.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm token màu hay icon. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", "Thêm", "Bắt đầu đợt ốm", "Bé đã khỏi", "Mở lại đợt ốm", "Xóa đợt ốm", không tải ảnh, không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `docs/device-checklist.md`.** File đó từ trước đã không theo prettier.
- **Các file plan chưa chạy chưa được commit.** `git status` có thể thấy các file plan khác là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng sau M5c. M5e thêm vạch "Khám" vào biểu đồ của trang chi tiết, dùng `useVisits` mà `EpisodeScreen` đã đọc ở plan này.

**Consumes (M5c):** `VisitSheet`, `OfflineNote`.

**Consumes (M5b):** `type Visit`, `useVisits` (`lib/data/illness.ts`); `visitsOf`, `visitHeading`, `episodeDeleteBlock` (`lib/rules/visits.ts`).

**Consumes (M4):** `EpisodeBody` có thẻ `EpisodeUsual` và nút "Báo cáo cho bác sĩ"; `components/illness/episodescreen.test.tsx` với các mock và thứ tự các khối; `docs/device-checklist.md` có Bước 38 mục 22–28.

**Consumes (đã ở `main` từ trước):** `EpisodeScreen`, `EpisodeSheet`, `EpisodeSheetView`; `PhotoViewer` (`components/photos/PhotosScreen.tsx`); `usePhotoUrls`; `useOnline`; `Glass`, `Button`, `ErrorCard`, `Icon`, `NeedsNetwork`, `waitingForNetwork`, `Skeleton`; `toVietnameseError`.

**Produces:**

- `components/illness/VisitsCard.tsx`: `type VisitCardRow = { id: string; heading: string; conclusion: string | null; advice: string | null; photos: { id: string; src: string | undefined }[] }`; `VisitsCardView(props: { status: "loading" | "offline" | "error" | "ready"; error: string | null; rows: VisitCardRow[]; online: boolean; onRetry; onAdd; onOpen: (visitId: string) => void; onPhoto: (visitId: string, photoId: string) => void })`; `VisitsCard(props: { baby: Baby; userId: string; isOwner: boolean; episode: EpisodeLike; visits: ReturnType<typeof useVisits> })`.
- `components/illness/EpisodeScreen.tsx`: `EpisodeBody` nhận thêm `visits?: ReactNode` (đặt sau "So với thường ngày"); `EpisodeScreen` đọc `useVisits(baby.id)`.
- `components/illness/EpisodeSheet.tsx`: `EpisodeSheetView` và `EpisodeSheet` nhận thêm `deleteBlock: string | null`.
- `docs/device-checklist.md`: Bước 38 có mục 29–33.
- **Vitest sau M5d:** 2044 test, 213 file.

---

### Task 1: Thẻ "Lần khám" và luật tắt "Xóa đợt ốm" (§8.3, §6.3 mục 6, §6.4)

**Files:**

- Create: `components/illness/VisitsCard.tsx`
- Modify: `components/illness/EpisodeScreen.tsx` (đọc lần khám; chỗ của thẻ; `deleteBlock`)
- Modify: `components/illness/EpisodeSheet.tsx` (`deleteBlock`)
- Test: `components/illness/visitscard.test.tsx` (mới), `components/illness/episodescreen.test.tsx`, `components/illness/episodesheet.test.tsx` (sửa)

**Interfaces:**

- Consumes: như mục Consumes ở trên.
- Produces: `VisitCardRow`, `VisitsCardView`, `VisitsCard`, `EpisodeBody({ …, visits })`, `EpisodeSheetView({ …, deleteBlock })`, `EpisodeSheet({ …, deleteBlock })` (chữ ký ở Contracts).

- [ ] **Step 0: Kiểm M5c đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
git log --oneline -20 main | grep "the M5c plan and its check results"
git checkout -b feat/kim-bun-dot-om-m5d
bunx vitest run
```

Expected: lệnh `grep` in đúng một dòng (không thấy thì dừng và báo người dùng); `Test Files  212 passed (212)`, `Tests  2034 passed (2034)`. `main` có thêm commit khác thì ghi lại số xuất phát thật.

- [ ] **Step 1: Viết test đỏ (Patch 1)**

`visitscard.test.tsx` (mới): tiêu đề và "Thêm", dòng "Chưa có lần khám nào.", một lần khám đủ các dòng theo thứ tự, không nhãn khi không có kết luận, ba trạng thái chờ, mất mạng, các nút báo đúng việc; `VisitsCard` chỉ lấy lần khám của đợt, cũ trước. `episodescreen.test.tsx`: thứ tự các khối nay có "Lần khám" giữa "So với thường ngày" và nút báo cáo; thẻ hiện lần khám của đợt (bỏ kiểm "không có Lần khám" của M2). `episodesheet.test.tsx`: "Xóa đợt ốm" tắt kèm lý do.

```diff
diff --git a/components/illness/episodescreen.test.tsx b/components/illness/episodescreen.test.tsx
index 27c2973..0dd36fc 100644
--- a/components/illness/episodescreen.test.tsx
+++ b/components/illness/episodescreen.test.tsx
@@ -10,6 +10,7 @@ const NOW = new Date("2026-11-26T10:00:00+07:00");
 const state = vi.hoisted(() => ({
   episodes: {} as Record<string, unknown>,
   logs: {} as Record<string, unknown>,
+  visits: {} as Record<string, unknown>,
   search: "id=open",
 }));
 const useRangeLogs = vi.hoisted(() => vi.fn());
@@ -21,6 +22,13 @@ vi.mock("@/lib/data/illness", () => ({
     update: { isPending: false, mutate: () => {} },
     remove: { isPending: false, mutate: () => {} },
   }),
+  useVisits: () => state.visits,
+  useVisitActions: () => ({}),
+}));
+vi.mock("@/lib/data/photos", () => ({
+  usePhotoUrls: () => ({ data: {} }),
+  usePhotoActions: () => ({ remove: { isPending: false, mutate: () => {} } }),
+  usePhotosUsage: () => ({ data: 0 }),
 }));
 vi.mock("@/lib/data/logs", () => ({ useRangeLogs }));
 vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime }));
@@ -127,12 +135,14 @@ function render(
     id?: string | null;
     episodes?: Record<string, unknown>;
     logs?: Record<string, unknown>;
+    visits?: Record<string, unknown>;
     userId?: string;
     isOwner?: boolean;
   } = {},
 ) {
   state.episodes = input.episodes ?? loaded([open, past]);
   state.logs = input.logs ?? loaded(LOGS);
+  state.visits = input.visits ?? loaded([]);
   return renderToStaticMarkup(
     <EpisodeScreen
       baby={baby}
@@ -171,7 +181,7 @@ describe("EpisodeScreen", () => {
     expect(useLogsRealtime).toHaveBeenCalledWith("b1");
   });
 
-  it("an open episode: verdict, chart, days, the comparison, the report, then Bé đã khỏi", () => {
+  it("an open episode: verdict, chart, days, the comparison, the visits, the report, then Bé đã khỏi", () => {
     const html = render();
     expect(html).toContain(">Bun đã hết sốt 19 giờ</h2>");
     expect(html).toContain(">Ngày thứ 3 · bắt đầu 24/11 lúc 23:30</span>");
@@ -193,13 +203,35 @@ describe("EpisodeScreen", () => {
       ">Nhiệt độ và thuốc hạ sốt</h2>",
       ">Từng ngày</h2>",
       ">So với thường ngày</h2>",
+      ">Lần khám</h2>",
       "Báo cáo cho bác sĩ</a>",
       ">Bé đã khỏi</button>",
     ].map((mark) => html.indexOf(mark));
     expect(order).toEqual([...order].sort((a, b) => a - b));
     expect(order[0]).toBeGreaterThan(-1);
-    // Not in this milestone: the visits.
-    expect(html).not.toContain("Lần khám");
+    expect(html).toContain(">Chưa có lần khám nào.</p>");
+  });
+
+  // Spec §8.3: the card shows the episode's visits from the page's one read.
+  it("the visits card lists this episode's visits", () => {
+    const html = render({
+      visits: loaded([
+        {
+          id: "v1",
+          episode_id: "open",
+          baby_id: "b1",
+          visited_at: iso("2026-11-25 09:15"),
+          place: "Phòng khám Nhi",
+          conclusion: "Viêm họng",
+          advice: null,
+          created_by: "u1",
+          photos: [],
+        },
+      ]),
+    });
+    expect(html).toContain(">25/11 09:15 · Phòng khám Nhi</span>");
+    expect(html).toContain(">Viêm họng</span>");
+    expect(html).not.toContain("Chưa có lần khám nào.");
   });
 
   // The page's clock moves once a minute; a log saved since its last tick is
diff --git a/components/illness/episodesheet.test.tsx b/components/illness/episodesheet.test.tsx
index 66975f3..277bb0f 100644
--- a/components/illness/episodesheet.test.tsx
+++ b/components/illness/episodesheet.test.tsx
@@ -37,6 +37,7 @@ const viewProps = (over: Partial<ViewProps> = {}): ViewProps => ({
   busy: false,
   canReopen: false,
   canDelete: false,
+  deleteBlock: null,
   onRaw: () => {},
   onSubmit: () => {},
   onReopen: () => {},
@@ -105,6 +106,27 @@ describe("EpisodeSheetView", () => {
     );
   });
 
+  // Spec §6.4 from M5.
+  it("Xóa đợt ốm is off, with the reason, while the episode may have visits", () => {
+    for (const reason of [
+      "Xóa các lần khám trước.",
+      "Cần mạng để kiểm các lần khám.",
+    ]) {
+      const html = view({ canDelete: true, deleteBlock: reason });
+      expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Xóa đợt ốm<\/button>/);
+      expect(html).toContain(`>${reason}</p>`);
+      expect(html.indexOf(">Xóa đợt ốm<")).toBeLessThan(
+        html.indexOf(`>${reason}<`),
+      );
+    }
+    expect(view({ canDelete: true })).toMatch(
+      /<button(?![^>]*disabled="")[^>]*>Xóa đợt ốm<\/button>/,
+    );
+    expect(view({ deleteBlock: "Xóa các lần khám trước." })).not.toContain(
+      "Xóa các lần khám trước.",
+    );
+  });
+
   it("a refusal is announced above the buttons; the buttons wait while a change is on its way", () => {
     const html = view({
       message: "Trùng thời gian với một đợt ốm khác.",
@@ -181,6 +203,7 @@ describe("EpisodeSheet", () => {
         episode={episode}
         episodes={episodes}
         canDelete={canDelete}
+        deleteBlock={null}
         onClose={() => {}}
         onDeleted={() => {}}
       />,
diff --git a/components/illness/visitscard.test.tsx b/components/illness/visitscard.test.tsx
new file mode 100644
index 0000000..d5752be
--- /dev/null
+++ b/components/illness/visitscard.test.tsx
@@ -0,0 +1,201 @@
+import type { ComponentProps } from "react";
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import type { Visit } from "@/lib/data/illness";
+import type { Baby, PhotoRow } from "@/lib/supabase/rows";
+import { VisitsCard, VisitsCardView } from "./VisitsCard";
+
+const state = vi.hoisted(() => ({ online: true }));
+vi.mock("@/lib/data/photos", () => ({
+  usePhotoUrls: (paths: string[]) => ({
+    data: Object.fromEntries(paths.map((path) => [path, `https://x/${path}`])),
+  }),
+  usePhotoActions: () => ({ remove: { isPending: false, mutate: () => {} } }),
+  usePhotosUsage: () => ({ data: 0 }),
+}));
+vi.mock("@/lib/data/illness", () => ({
+  useVisitActions: () => ({}),
+  useVisits: () => ({ data: undefined }),
+}));
+vi.mock("@/lib/hooks/useOnline", () => ({ useOnline: () => state.online }));
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const photo = (id: string, visitId: string) =>
+  ({ id, visit_id: visitId, storage_path: `f1/b1/${id}.jpg` }) as PhotoRow;
+const visit = (
+  id: string,
+  episodeId: string,
+  at: string,
+  over: Partial<Visit> = {},
+): Visit =>
+  ({
+    id,
+    episode_id: episodeId,
+    baby_id: "b1",
+    visited_at: iso(at),
+    place: null,
+    conclusion: null,
+    advice: null,
+    created_by: "u1",
+    created_at: iso(at),
+    updated_at: iso(at),
+    photos: [],
+    ...over,
+  }) as Visit;
+
+type ViewProps = ComponentProps<typeof VisitsCardView>;
+const viewProps = (over: Partial<ViewProps> = {}): ViewProps => ({
+  status: "ready",
+  error: null,
+  rows: [],
+  online: true,
+  onRetry: () => {},
+  onAdd: () => {},
+  onOpen: () => {},
+  onPhoto: () => {},
+  ...over,
+});
+const view = (over: Partial<ViewProps> = {}) =>
+  renderToStaticMarkup(<VisitsCardView {...viewProps(over)} />);
+const row = (over: Partial<ViewProps["rows"][number]> = {}) => ({
+  id: "v1",
+  heading: "25/11 09:15 · Phòng khám Nhi",
+  conclusion: "Viêm họng",
+  advice: "Uống nhiều nước.\nTái khám nếu sốt cao.",
+  photos: [],
+  ...over,
+});
+
+beforeEach(() => {
+  state.online = true;
+});
+
+// Spec 2026-11-26 §8.3.
+describe("VisitsCardView", () => {
+  it("the title with Thêm; no visit yet: one line", () => {
+    const html = view();
+    expect(html).toContain(">Lần khám</h2>");
+    expect(html).toMatch(/<button(?![^>]*disabled="")[^>]*>.*Thêm<\/button>/);
+    expect(html).toContain(">Chưa có lần khám nào.</p>");
+  });
+
+  it("a visit: the time and place, the doctor's conclusion under its label, the advice, the photos", () => {
+    const html = view({
+      rows: [
+        row({
+          photos: [
+            { id: "p1", src: "https://x/p1.jpg" },
+            { id: "p2", src: undefined },
+          ],
+        }),
+      ],
+    });
+    const order = [
+      ">25/11 09:15 · Phòng khám Nhi</span>",
+      ">Bác sĩ kết luận</span>",
+      ">Viêm họng</span>",
+      ">Uống nhiều nước.\nTái khám nếu sốt cao.</span>",
+    ].map((mark) => html.indexOf(mark));
+    expect(order[0]).toBeGreaterThan(-1);
+    expect(order).toEqual([...order].sort((a, b) => a - b));
+    expect(html).toContain("whitespace-pre-line");
+    expect(html.match(/h-\[78px\] w-\[60px\]/g)).toHaveLength(2);
+    expect(html.match(/<img/g)).toHaveLength(1);
+    expect(html).not.toContain("Chưa có lần khám nào.");
+  });
+
+  it("without a conclusion there is no label either", () => {
+    const html = view({ rows: [row({ conclusion: null, advice: null })] });
+    expect(html).not.toContain("Bác sĩ kết luận");
+  });
+
+  it("loading, offline and failed", () => {
+    expect(view({ status: "loading" })).toContain("animate-[kb-pulse");
+    expect(view({ status: "offline" })).toContain(
+      "Cần mạng để tải lần khám. Trang sẽ tự tải khi có mạng lại.",
+    );
+    const failed = view({ status: "error", error: "Có lỗi xảy ra: boom" });
+    expect(failed).toContain(">Có lỗi xảy ra: boom</p>");
+    expect(failed).toContain(">Thử lại</button>");
+    for (const status of ["loading", "offline", "error"] as const)
+      expect(view({ status })).toMatch(/disabled=""[^>]*>.*Thêm<\/button>/);
+  });
+
+  it("offline: the note, and Thêm is off", () => {
+    const html = view({ online: false });
+    expect(html).toContain("Cần kết nối mạng để thay đổi các mục dưới đây.");
+    expect(html).toMatch(/disabled=""[^>]*>.*Thêm<\/button>/);
+  });
+
+  it("Thêm, a visit and a photo report their taps", () => {
+    const onAdd = vi.fn();
+    const onOpen = vi.fn();
+    const onPhoto = vi.fn();
+    const tree = VisitsCardView(
+      viewProps({
+        rows: [row({ photos: [{ id: "p1", src: "https://x/p1.jpg" }] })],
+        onAdd,
+        onOpen,
+        onPhoto,
+      }),
+    );
+    const buttons = findElements(tree, (el) => el.type === "button");
+    for (const button of buttons) (button.props.onClick as () => void)();
+    const [add] = findElements(tree, (el) => el.props.onClick === onAdd);
+    expect(add).toBeDefined();
+    expect(onOpen).toHaveBeenCalledWith("v1");
+    expect(onPhoto).toHaveBeenCalledWith("v1", "p1");
+  });
+});
+
+describe("VisitsCard", () => {
+  const baby = { id: "b1", family_id: "f1", name: "Bun" } as unknown as Baby;
+  const card = (visits: Record<string, unknown>) =>
+    renderToStaticMarkup(
+      <VisitsCard
+        baby={baby}
+        userId="u1"
+        isOwner={false}
+        episode={{
+          id: "e1",
+          started_at: iso("2026-11-24 23:30"),
+          ended_at: null,
+        }}
+        visits={visits as never}
+      />,
+    );
+
+  it("shows the visits of this episode, oldest first, with their photos", () => {
+    const html = card({
+      data: [
+        visit("v2", "e1", "2026-11-26 08:00", { place: "Bệnh viện Nhi" }),
+        visit("v9", "e2", "2026-11-25 08:00", { place: "Khác" }),
+        visit("v1", "e1", "2026-11-25 09:15", {
+          photos: [photo("p1", "v1")],
+        }),
+      ],
+      isPending: false,
+      isError: false,
+      fetchStatus: "idle",
+    });
+    expect(html).not.toContain("Khác");
+    expect(html.indexOf(">25/11 09:15</span>")).toBeGreaterThan(-1);
+    expect(html.indexOf(">25/11 09:15</span>")).toBeLessThan(
+      html.indexOf(">26/11 08:00 · Bệnh viện Nhi</span>"),
+    );
+    expect(html).toContain('src="https://x/f1/b1/p1.jpg"');
+  });
+
+  it("waits for the network when the visits never loaded", () => {
+    expect(
+      card({
+        data: undefined,
+        isPending: true,
+        isError: false,
+        fetchStatus: "paused",
+      }),
+    ).toContain("Cần mạng để tải lần khám.");
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  3 failed | 210 passed (213)`, `Tests  3 failed | 2033 passed (2036)`. `visitscard.test.tsx` không nạp được (`./VisitsCard` chưa có); ba test đỏ: hai của `EpisodeScreen` (chưa có "Lần khám") và một của `EpisodeSheetView` (nút chưa tắt).

- [ ] **Step 3: Viết thẻ và nối vào trang (Patch 2)**

```diff
diff --git a/components/illness/EpisodeScreen.tsx b/components/illness/EpisodeScreen.tsx
index 580d3f7..6a7ced2 100644
--- a/components/illness/EpisodeScreen.tsx
+++ b/components/illness/EpisodeScreen.tsx
@@ -2,7 +2,7 @@
 
 import Link from "next/link";
 import { useRouter } from "next/navigation";
-import { useState } from "react";
+import { type ReactNode, useState } from "react";
 import { useQuickActions } from "@/components/actions/QuickActions";
 import { Button, buttonClass } from "@/components/ui/Button";
 import { EmptyState } from "@/components/ui/EmptyState";
@@ -14,7 +14,7 @@ import { PageHeader } from "@/components/ui/PageHeader";
 import { Skeleton } from "@/components/ui/Skeleton";
 import { useToast } from "@/components/ui/Toast";
 import { toVietnameseError } from "@/lib/data/errors";
-import { useEpisodeActions, useEpisodes } from "@/lib/data/illness";
+import { useEpisodeActions, useEpisodes, useVisits } from "@/lib/data/illness";
 import { useRangeLogs } from "@/lib/data/logs";
 import { useLogsRealtime } from "@/lib/data/realtime";
 import { useNow } from "@/lib/hooks/useNow";
@@ -26,12 +26,14 @@ import {
 } from "@/lib/rules/illness";
 import { planClose } from "@/lib/rules/illnessForm";
 import { dayRows, usualView, verdictView } from "@/lib/rules/illnessView";
+import { episodeDeleteBlock } from "@/lib/rules/visits";
 import type { Baby } from "@/lib/supabase/rows";
 import { EpisodeDayList } from "./EpisodeDayList";
 import { EpisodeSheet } from "./EpisodeSheet";
 import { EpisodeUsual } from "./EpisodeUsual";
 import { EpisodeVerdict, type QuickLogType } from "./EpisodeVerdict";
 import { FeverChartCard } from "./FeverChart";
+import { VisitsCard } from "./VisitsCard";
 
 const LIST = "/dot-om";
 
@@ -53,6 +55,7 @@ export function EpisodeBody({
   babyName,
   now,
   closing,
+  visits = null,
   onLog,
   onClose,
 }: {
@@ -62,6 +65,8 @@ export function EpisodeBody({
   now: Date;
   // "Bé đã khỏi" is on its way.
   closing: boolean;
+  // Spec §6.3 item 6: the card "Lần khám" (§8.3), which reads by itself.
+  visits?: ReactNode;
   onLog: (type: QuickLogType) => void;
   onClose: () => void;
 }) {
@@ -74,6 +79,7 @@ export function EpisodeBody({
       <FeverChartCard chart={feverChartModel(logs, episode, now)} />
       <EpisodeDayList rows={dayRows(logs, episode, now)} />
       <EpisodeUsual view={usualView(logs, episode, now)} />
+      {visits}
       {/* Spec §6.3 item 7: the report of this episode (§9), then, while it
           is open, "Bé đã khỏi". */}
       <div className="flex flex-col gap-2.5">
@@ -114,6 +120,7 @@ export function EpisodeScreen({
   const quick = useQuickActions();
   const episodes = useEpisodes(baby.id);
   const actions = useEpisodeActions(baby.id, userId);
+  const visits = useVisits(baby.id);
   const [editing, setEditing] = useState(false);
 
   const all = episodes.data ?? [];
@@ -189,6 +196,15 @@ export function EpisodeScreen({
           babyName={baby.name}
           now={now}
           closing={actions.update.isPending}
+          visits={
+            <VisitsCard
+              baby={baby}
+              userId={userId}
+              isOwner={isOwner}
+              episode={episode}
+              visits={visits}
+            />
+          }
           onLog={quick.openInstant}
           onClose={close}
         />
@@ -200,6 +216,7 @@ export function EpisodeScreen({
           episode={episode}
           episodes={all}
           canDelete={isOwner || episode.created_by === userId}
+          deleteBlock={episodeDeleteBlock(visits.data, episode.id)}
           onClose={() => setEditing(false)}
           onDeleted={() => router.replace(LIST)}
         />
diff --git a/components/illness/EpisodeSheet.tsx b/components/illness/EpisodeSheet.tsx
index 4f158ba..7f68bd5 100644
--- a/components/illness/EpisodeSheet.tsx
+++ b/components/illness/EpisodeSheet.tsx
@@ -29,6 +29,7 @@ export function EpisodeSheetView({
   busy,
   canReopen: reopen,
   canDelete,
+  deleteBlock,
   onRaw,
   onSubmit,
   onReopen,
@@ -47,6 +48,8 @@ export function EpisodeSheetView({
   busy: boolean;
   canReopen: boolean;
   canDelete: boolean;
+  // Why "Xóa đợt ốm" is off (spec §6.4 from M5), or null.
+  deleteBlock: string | null;
   onRaw: (next: EpisodeRaw) => void;
   onSubmit: (event: FormEvent) => void;
   onReopen: () => void;
@@ -107,13 +110,16 @@ export function EpisodeSheetView({
             <Button
               variant="ghost"
               block
-              disabled={busy}
+              disabled={busy || deleteBlock !== null}
               className="text-danger!"
               onClick={onDelete}
             >
               Xóa đợt ốm
             </Button>
           )}
+          {canDelete && deleteBlock && (
+            <p className="px-1 text-[13px] text-muted">{deleteBlock}</p>
+          )}
         </div>
       }
     >
@@ -146,6 +152,7 @@ export function EpisodeSheet({
   episode,
   episodes,
   canDelete,
+  deleteBlock,
   onClose,
   onDeleted,
 }: {
@@ -156,6 +163,8 @@ export function EpisodeSheet({
   episodes: EpisodeRow[];
   // The owner of the family or whoever started the episode.
   canDelete: boolean;
+  // Why "Xóa đợt ốm" is off: the episode has visits, or they are not loaded.
+  deleteBlock: string | null;
   onClose: () => void;
   // The episode is gone: its page has nothing left to show.
   onDeleted: () => void;
@@ -220,6 +229,7 @@ export function EpisodeSheet({
       busy={actions.update.isPending || actions.remove.isPending}
       canReopen={canReopen(episode, episodes)}
       canDelete={canDelete}
+      deleteBlock={deleteBlock}
       onRaw={setRaw}
       onSubmit={submit}
       onReopen={reopen}
diff --git a/components/illness/VisitsCard.tsx b/components/illness/VisitsCard.tsx
new file mode 100644
index 0000000..f90364f
--- /dev/null
+++ b/components/illness/VisitsCard.tsx
@@ -0,0 +1,215 @@
+"use client";
+
+import { useState } from "react";
+import { OfflineNote } from "@/components/OnlineOnly";
+import { PhotoViewer } from "@/components/photos/PhotosScreen";
+import { Button } from "@/components/ui/Button";
+import { ErrorCard } from "@/components/ui/ErrorCard";
+import { Glass } from "@/components/ui/Glass";
+import { Icon } from "@/components/ui/Icon";
+import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
+import { Skeleton } from "@/components/ui/Skeleton";
+import { toVietnameseError } from "@/lib/data/errors";
+import type { useVisits, Visit } from "@/lib/data/illness";
+import { usePhotoUrls } from "@/lib/data/photos";
+import { useOnline } from "@/lib/hooks/useOnline";
+import type { EpisodeLike } from "@/lib/rules/illness";
+import { visitHeading, visitsOf } from "@/lib/rules/visits";
+import type { Baby, PhotoRow } from "@/lib/supabase/rows";
+import { VisitSheet } from "./VisitSheet";
+
+export type VisitCardRow = {
+  id: string;
+  heading: string;
+  conclusion: string | null;
+  advice: string | null;
+  photos: { id: string; src: string | undefined }[];
+};
+
+// Spec 2026-11-26 §8.3, drawn without hooks so a test can press its buttons.
+export function VisitsCardView({
+  status,
+  error,
+  rows,
+  online,
+  onRetry,
+  onAdd,
+  onOpen,
+  onPhoto,
+}: {
+  status: "loading" | "offline" | "error" | "ready";
+  error: string | null;
+  // Oldest first.
+  rows: VisitCardRow[];
+  online: boolean;
+  onRetry: () => void;
+  onAdd: () => void;
+  onOpen: (visitId: string) => void;
+  onPhoto: (visitId: string, photoId: string) => void;
+}) {
+  return (
+    <Glass className="flex flex-col gap-3 p-4">
+      <div className="flex items-center justify-between gap-3">
+        <h2 className="text-[15px] font-semibold text-ink">Lần khám</h2>
+        <Button
+          variant="secondary"
+          size="md"
+          disabled={!online || status !== "ready"}
+          onClick={onAdd}
+        >
+          <Icon name="plus" size={18} />
+          Thêm
+        </Button>
+      </div>
+      {!online && <OfflineNote />}
+      {status === "loading" ? (
+        <Skeleton className="h-[60px]" />
+      ) : status === "offline" ? (
+        <NeedsNetwork what="lần khám" />
+      ) : status === "error" ? (
+        <ErrorCard message={error ?? ""} onRetry={onRetry} />
+      ) : rows.length === 0 ? (
+        <p className="text-[15px] text-muted">Chưa có lần khám nào.</p>
+      ) : (
+        <ul className="flex flex-col divide-y divide-line">
+          {rows.map((row) => (
+            <li
+              key={row.id}
+              className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0"
+            >
+              {/* The whole text opens the sheet; the photos open themselves. */}
+              <button
+                type="button"
+                onClick={() => onOpen(row.id)}
+                className="flex min-h-11 flex-col items-start gap-0.5 text-left"
+              >
+                <span className="text-[13px] text-muted tabular-nums">
+                  {row.heading}
+                </span>
+                {row.conclusion && (
+                  <>
+                    <span className="pt-1 text-[12px] text-muted">
+                      Bác sĩ kết luận
+                    </span>
+                    <span className="text-[15px] font-bold text-ink">
+                      {row.conclusion}
+                    </span>
+                  </>
+                )}
+                {row.advice && (
+                  <span className="pt-0.5 text-[13px] whitespace-pre-line text-ink">
+                    {row.advice}
+                  </span>
+                )}
+              </button>
+              {row.photos.length > 0 && (
+                <div className="flex flex-wrap gap-2">
+                  {row.photos.map((photo, index) => (
+                    <button
+                      key={photo.id}
+                      type="button"
+                      aria-label={`Ảnh ${index + 1}`}
+                      onClick={() => onPhoto(row.id, photo.id)}
+                      className="h-[78px] w-[60px] overflow-hidden rounded-[10px] bg-line"
+                    >
+                      {photo.src && (
+                        <img
+                          src={photo.src}
+                          alt=""
+                          className="h-full w-full object-cover"
+                          loading="lazy"
+                        />
+                      )}
+                    </button>
+                  ))}
+                </div>
+              )}
+            </li>
+          ))}
+        </ul>
+      )}
+    </Glass>
+  );
+}
+
+// The card of the episode's page, with its sheet and the photo viewer.
+export function VisitsCard({
+  baby,
+  userId,
+  isOwner,
+  episode,
+  visits,
+}: {
+  baby: Baby;
+  userId: string;
+  isOwner: boolean;
+  episode: EpisodeLike;
+  // The page reads the visits once, for this card and for "Xóa đợt ốm".
+  visits: ReturnType<typeof useVisits>;
+}) {
+  const online = useOnline();
+  const [editing, setEditing] = useState<Visit | "new" | null>(null);
+  const [viewing, setViewing] = useState<PhotoRow | null>(null);
+  const own = visitsOf(visits.data ?? [], episode.id);
+  const urls = usePhotoUrls(
+    own.flatMap((visit) => visit.photos.map((photo) => photo.storage_path)),
+  );
+  const status = visits.data
+    ? "ready"
+    : waitingForNetwork(visits)
+      ? "offline"
+      : visits.isError
+        ? "error"
+        : "loading";
+  return (
+    <>
+      <VisitsCardView
+        status={status}
+        error={visits.isError ? toVietnameseError(visits.error) : null}
+        rows={own.map((visit) => ({
+          id: visit.id,
+          heading: visitHeading(visit),
+          conclusion: visit.conclusion,
+          advice: visit.advice,
+          photos: visit.photos.map((photo) => ({
+            id: photo.id,
+            src: urls.data?.[photo.storage_path],
+          })),
+        }))}
+        online={online}
+        onRetry={() => void visits.refetch()}
+        onAdd={() => setEditing("new")}
+        onOpen={(id) =>
+          setEditing(own.find((visit) => visit.id === id) ?? null)
+        }
+        onPhoto={(visitId, photoId) =>
+          setViewing(
+            own
+              .find((visit) => visit.id === visitId)
+              ?.photos.find((photo) => photo.id === photoId) ?? null,
+          )
+        }
+      />
+      {editing && (
+        <VisitSheet
+          baby={baby}
+          userId={userId}
+          isOwner={isOwner}
+          episode={episode}
+          visit={editing === "new" ? null : editing}
+          onClose={() => setEditing(null)}
+        />
+      )}
+      {/* Seeing only: a photo of a visit is deleted in its sheet (§8.4). */}
+      {viewing && (
+        <PhotoViewer
+          photo={viewing}
+          url={urls.data?.[viewing.storage_path]}
+          baby={baby}
+          canDelete={false}
+          onClose={() => setViewing(null)}
+        />
+      )}
+    </>
+  );
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  213 passed (213)`, `Tests  2044 passed (2044)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/illness/VisitsCard.tsx components/illness/EpisodeScreen.tsx components/illness/EpisodeSheet.tsx components/illness/visitscard.test.tsx components/illness/episodescreen.test.tsx components/illness/episodesheet.test.tsx
git commit -m "feat(illness): the visits card on the episode page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Kiểm cuối M5d, checklist, spec, rồi đưa lên `main`

**Files:**

- Create rồi xóa (không commit): `app/fixture-visits/page.tsx`
- Modify: `docs/device-checklist.md` (Bước 38 mục 29–33), `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§6.4, §8.3)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của Task 1.
- Produces: kết quả kiểm, ghi ngay trong plan; Bước 38 mục 29–33; hai đoạn đọc spec; `main` có M5d.

- [ ] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  213 passed (213)`, `Tests  2044 passed (2044)`.

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages using 9 workers (42/42)`, dòng `├ ○ /dot-om/chi-tiet` (vẫn tĩnh), và thoát mã 0.

- [ ] **Step 3: Tạo trang fixture tạm**

Gia đình chưa có đợt ốm và không được tạo đợt hay lần khám trên dữ liệu thật, nên thẻ chỉ thấy đủ ở đây. Trang vẽ thẻ ở năm trạng thái (chưa có; ba lần khám với 1 ảnh, 6 ảnh và chữ dài, chỉ có giờ; mất mạng; chưa từng tải và mất mạng; lỗi), rồi thân trang chi tiết của một đợt đang mở với thẻ; `?case=xoa` và `?case=xoa-mang` vẽ sheet "Sửa đợt ốm" với hai lý do tắt "Xóa đợt ốm". Tạo `app/fixture-visits/page.tsx` (không commit):

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EpisodeBody } from "@/components/illness/EpisodeScreen";
import { EpisodeSheetView } from "@/components/illness/EpisodeSheet";
import {
  type VisitCardRow,
  VisitsCardView,
} from "@/components/illness/VisitsCard";
import type { LogLike } from "@/lib/rules/describeLog";
import type { EpisodeLike } from "@/lib/rules/illness";

// Dữ liệu giả, không đọc hay ghi gì của gia đình. Ảnh là hình vẽ tại chỗ.
const NOW = new Date("2026-11-26T10:00:00+07:00");
const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
const picture = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="78"><rect width="60" height="78" fill="hsl(${hue} 60% 80%)"/><path d="M10 20h40M10 32h40M10 44h28" stroke="hsl(${hue} 40% 40%)" stroke-width="3"/></svg>`,
  )}`;
const photos = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    src: picture(i * 50),
  }));
const ONE: VisitCardRow = {
  id: "v1",
  heading: "25/11 09:15 · Phòng khám Nhi",
  conclusion: "Viêm họng",
  advice: "Uống nhiều nước.",
  photos: photos(1),
};
const LONG: VisitCardRow = {
  id: "v2",
  heading: "26/11 08:05 · Phòng khám Nhi Đồng 2, cơ sở Lý Tự Trọng, quận 1",
  conclusion: "Viêm họng cấp, theo dõi thêm viêm tai giữa bên phải",
  advice:
    "Uống nhiều nước, chia nhỏ cữ bú. Hạ sốt khi trên 38,5 độ, cách nhau ít nhất 4 tiếng.\nTái khám ngay nếu sốt cao không hạ, thở nhanh, bỏ bú.",
  photos: photos(6),
};
const BARE: VisitCardRow = {
  id: "v3",
  heading: "26/11 18:40",
  conclusion: null,
  advice: null,
  photos: [],
};
const card = (
  rows: VisitCardRow[],
  status: "loading" | "offline" | "error" | "ready" = "ready",
  online = true,
) => (
  <VisitsCardView
    status={status}
    error={status === "error" ? "Có lỗi xảy ra: thử" : null}
    rows={rows}
    online={online}
    onRetry={() => {}}
    onAdd={() => {}}
    onOpen={() => {}}
    onPhoto={() => {}}
  />
);
const OPEN: EpisodeLike = {
  id: "fixture",
  started_at: iso("2026-11-24 23:30"),
  ended_at: null,
};
const temp = (time: string, celsius: number): LogLike => ({
  type: "temperature",
  started_at: iso(time),
  ended_at: iso(time),
  details: { celsius, method: "nach" },
});

function Fixture() {
  const name = useSearchParams().get("case");
  if (name === "xoa" || name === "xoa-mang")
    return (
      <EpisodeSheetView
        formId="fixture"
        raw={{ start: "2026-11-20T08:00", end: "2026-11-22T09:30" }}
        errors={{}}
        message={null}
        dirty={false}
        saving={false}
        busy={false}
        canReopen
        canDelete
        deleteBlock={
          name === "xoa"
            ? "Xóa các lần khám trước."
            : "Cần mạng để kiểm các lần khám."
        }
        onRaw={() => {}}
        onSubmit={(event) => event.preventDefault()}
        onReopen={() => {}}
        onDelete={() => {}}
        onClose={() => {}}
      />
    );
  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <h2>chưa có</h2>
      {card([])}
      <h2>một lần khám, rồi một lần khám đủ 6 ảnh, rồi một lần chỉ có giờ</h2>
      {card([ONE, LONG, BARE])}
      <h2>mất mạng</h2>
      {card([ONE], "ready", false)}
      <h2>chưa từng tải, mất mạng</h2>
      {card([], "offline", false)}
      <h2>lỗi</h2>
      {card([], "error")}
      <h2>cả trang · đợt đang mở</h2>
      <EpisodeBody
        episode={OPEN}
        logs={[temp("2026-11-25 15:00", 39.2), temp("2026-11-26 07:05", 37.6)]}
        babyName="Bun"
        now={NOW}
        closing={false}
        visits={card([ONE])}
        onLog={() => {}}
        onClose={() => {}}
      />
    </main>
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

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở các trang dưới trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp.

Trên trang tạm `http://localhost:3000/fixture-visits`:

1. Theme `rose`. Thẻ thứ hai (ba lần khám). Kỳ vọng: dòng ngày giờ của lần khám thứ hai (nơi khám dài) xuống 2 dòng, hai dòng kia 1 dòng; kết luận "Viêm họng cấp, theo dõi thêm viêm tai giữa bên phải" 2 dòng, đậm, dưới nhãn nhỏ "Bác sĩ kết luận"; lời dặn của lần thứ hai 4 dòng (giữ chỗ xuống dòng); lần thứ ba chỉ có "26/11 18:40", không nhãn; 7 ô ảnh 60×78, 6 ô của lần thứ hai nằm trên 2 hàng; nút "Thêm" 101×44; phần chữ của ba lần khám cao 92, 192 và 44 px (vùng chạm ≥ 44); không chữ nào bị cắt "…" (đếm phần tử có `text-overflow: ellipsis` mà chữ dài hơn ô: 0); `document.documentElement.scrollWidth <= innerWidth`. Khi viết plan đúng như vậy (ảnh `m5-the-lan-kham-375-rose.jpg`).
2. Đặt `document.documentElement.dataset.theme = "night"`. Kỳ vọng: nhãn "Bác sĩ kết luận", kết luận, lời dặn và dòng ngày giờ khác nhau ở cỡ và độ đậm của chữ, đọc rõ. Khi viết plan đúng như vậy (ảnh `m5-the-lan-kham-375-night.jpg`). Lặp lại với `light` và `dark`.
3. Kỳ vọng: thẻ thứ nhất ghi "Chưa có lần khám nào."; thẻ "mất mạng" có dòng "Cần kết nối mạng để thay đổi các mục dưới đây." và nút "Thêm" `disabled`; thẻ "chưa từng tải, mất mạng" có thêm "Cần mạng để tải lần khám. Trang sẽ tự tải khi có mạng lại."; thẻ "lỗi" có "Có lỗi xảy ra: thử" và "Thử lại", nút "Thêm" `disabled`. Khi viết plan đúng như vậy.
4. Phần "cả trang · đợt đang mở". Kỳ vọng: theo chiều dọc, "So với thường ngày" < "Lần khám" < "Báo cáo cho bác sĩ" < "Bé đã khỏi". Khi viết plan: 2883 < 3038 < 3296 < 3356 px (đọc `getBoundingClientRect().top + scrollY` của phần tử cuối mang mỗi chữ).
5. `?case=xoa`, theme `night`. Kỳ vọng: sheet "Sửa đợt ốm"; "Xóa đợt ốm" `disabled`; ngay dưới là "Xóa các lần khám trước.". `?case=xoa-mang`: dòng "Cần mạng để kiểm các lần khám.". Khi viết plan đúng như vậy (ảnh `m5-sua-dot-om-xoa-tat-375-night.jpg`).

Trang thật (dữ liệu thật của gia đình: **chỉ xem**; cần đăng nhập trong khung Browser):

6. `http://localhost:3000/dot-om`. Nếu gia đình có đợt ốm (do người dùng tự tạo): mở trang chi tiết của nó. Kỳ vọng: thẻ "Lần khám" sau "So với thường ngày"; lệnh đọc `illness_visits` và lệnh đọc `photos` có `visit_id=not.is.null` trả 200 (đọc Resource Timing trong trang, `performance.getEntriesByType("resource")`, lọc tên chứa `/rest/v1/`; chỉ in `pathname`, tên tham số và `responseStatus`). Không bấm "Thêm", không bấm vào lần khám. Không có đợt nào: ghi "chưa kiểm (gia đình chưa có đợt ốm)". Lọc console bằng `onlyErrors`: không có lỗi. `scrollWidth <= innerWidth`.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo; mục nào thấy trên trang thật, mục nào chỉ thấy trên trang tạm. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

- [ ] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-visits
bun run typecheck
git status --short  # không còn app/fixture-visits
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts`: chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [ ] **Step 6: Phần M5d của Bước 38 và các chỗ đọc spec (Patch 3), commit**

```diff
diff --git a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
index c2d6e89..1296003 100644
--- a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
+++ b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
@@ -300,6 +300,7 @@ Trang theo realtime của bản ghi như danh sách (xem §6.2; khác bản đã
 - Nút "Xóa đợt ốm", chỉ hiện với chủ gia đình hoặc người tạo. Hỏi lại một lần: "Xóa đợt ốm này? Các bản ghi nhiệt độ, thuốc, triệu chứng vẫn giữ nguyên."
 - Xóa xong, trang chuyển về `/dot-om` bằng `router.replace` (thay địa chỉ hiện tại, không thêm vào lịch sử), để nút quay lại của trình duyệt không dẫn về một đợt đã xóa. Giữa lúc đợt biến khỏi danh sách và lúc trang chuyển xong, dòng "Không tìm thấy đợt ốm này" có thể chớp lên một nhịp. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói xóa xong trang đi đâu. Làm ở M2f ngày 2026-11-27 theo lời duyệt trước của người dùng; ghi vào spec ở M2g.)
 - Từ M5: đợt còn lần khám thì nút "Xóa đợt ốm" tắt, kèm dòng "Xóa các lần khám trước."; khi `useVisits` chưa có dữ liệu (mất mạng, chưa từng tải) nút cũng tắt, kèm dòng "Cần mạng để kiểm các lần khám."
+- Dòng lý do nằm ngay dưới nút "Xóa đợt ốm". Danh sách lần khám tải lỗi cũng tính là chưa có dữ liệu. Lần khám do máy khác thêm sau lúc kiểm thì server từ chối lệnh xóa (đợt còn lần khám); outbox bỏ lệnh đó với câu sẵn có "Bản ghi liên quan không còn", và đợt hiện lại sau lần tải lại. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói ba chỗ này. Chọn ở M5d ngày 2026-11-27 theo lời duyệt trước của người dùng.)
 - Nút "Lưu".
 
 ### 6.5 Biểu đồ sốt
@@ -412,6 +413,7 @@ alter table public.photos add foreign key (visit_id, baby_id)
 - Tiêu đề "Lần khám", bên phải nút "Thêm".
 - Mỗi lần khám, cũ trước: dòng "{dd/mm} {HH:mm} · {nơi khám}" (không có nơi khám thì chỉ ngày giờ); nhãn nhỏ "Bác sĩ kết luận" rồi `conclusion` đậm; `advice` chữ nhỏ; các ảnh thành ô 60×78 bấm để xem lớn. Bấm vào lần khám mở sheet sửa.
 - Chưa có lần khám: dòng "Chưa có lần khám nào."
+- Thẻ đứng sau thẻ "So với thường ngày", trên nút "Báo cáo cho bác sĩ". Dòng ngày giờ chữ nhỏ màu nhạt; nhãn "Bác sĩ kết luận" chỉ có khi có kết luận; lời dặn giữ các chỗ xuống dòng như lúc gõ. Bấm phần chữ thì mở sheet sửa; bấm một ô ảnh thì xem ảnh lớn, chỉ xem (xóa ảnh ở trong sheet); nhãn đọc màn hình của ô ảnh là "Ảnh 1", "Ảnh 2", …. Nút "Thêm" có ở cả đợt đã đóng; tắt khi mất mạng (kèm dòng "Cần kết nối mạng để thay đổi các mục dưới đây.") và khi danh sách lần khám chưa tải xong. Chưa từng tải mà mất mạng: "Cần mạng để tải lần khám. Trang sẽ tự tải khi có mạng lại."; tải lỗi: thẻ lỗi có "Thử lại". (Khác bản đã duyệt ngày 2026-11-26, vốn không nói mấy chỗ này. Chọn ở M5d ngày 2026-11-27 theo lời duyệt trước của người dùng.)
 
 ### 8.4 Sheet "Lần khám" (bảng "Lần khám — phiếu nhập")
 
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index 456ae1e..d02134b 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -646,7 +646,7 @@ Kết quả: Chờ người dùng.
 
 ## Bước 38 — Đợt ốm (spec 2026-11-26)
 
-Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23, bảng "Triệu chứng" của Báo cáo là mục 24, kỳ "Đợt ốm" của Báo cáo và nút "Báo cáo cho bác sĩ" là mục 25–28. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó. Mục 24 tạo một bản ghi Triệu chứng thử và xóa nó. Mục 25 tạo một đợt ốm thử và một bản ghi nhiệt độ thử; mục 28 xóa cả hai.
+Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21; phần của mốc M4 (so sánh và Báo cáo, spec §5.4, §9) bắt đầu từ mục 22: thẻ "So với thường ngày" là mục 22–23, bảng "Triệu chứng" của Báo cáo là mục 24, kỳ "Đợt ốm" của Báo cáo và nút "Báo cáo cho bác sĩ" là mục 25–28; phần của mốc M5 (lần khám, spec §8) bắt đầu từ mục 29: thẻ và sheet "Lần khám" là mục 29–33. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết. Mục 22 tạo một đợt ốm thử; mục 23 xóa nó. Mục 24 tạo một bản ghi Triệu chứng thử và xóa nó. Mục 25 tạo một đợt ốm thử và một bản ghi nhiệt độ thử; mục 28 xóa cả hai. Mục 29 tạo một đợt ốm thử, một lần khám thử và một ảnh thử, mục 33 thêm một ảnh thử nữa; mục 33 xóa hết.
 
 1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
 2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
@@ -676,6 +676,11 @@ Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; ph
 26. Bấm "7 ngày". Kỳ vọng: báo cáo bảy ngày như trước ("7 ngày, từ … đến …"), không có biểu đồ. Bấm "Đợt ốm". Kỳ vọng: lại là đợt vừa mở.
 27. Bật Ban đêm, bấm "In / Lưu PDF". Kỳ vọng: bản xem trước nền trắng chữ đen; biểu đồ in màu như ở nền sáng: đường và chấm màu xanh, vùng sốt hồng nhạt, chữ "38" và "Sốt" đỏ đậm đọc rõ, ba dấu của chú thích có màu; biểu đồ không bị cắt đôi giữa hai trang. Hủy in, tắt Ban đêm.
 28. Về trang chi tiết, bấm "Bé đã khỏi", rồi "Báo cáo cho bác sĩ". Kỳ vọng: dòng dưới tên bé là "Đợt ốm {dd/mm} – {dd/mm} · 1 ngày · in ngày …". Đóng hẳn app, bật chế độ máy bay, mở lại app → Sức khỏe → "Đợt ốm" → hàng của đợt vừa đóng → "Báo cáo cho bác sĩ". Kỳ vọng: trang mở ra (không phải trang "Bạn đang offline") và vẫn chọn "Đợt ốm". Nếu thay vào đó thấy "Cần mạng để tải báo cáo. …" hay một màn khác: ghi lại đúng màn hình đã thấy. Tắt chế độ máy bay. Dọn: bút chì → "Xóa đợt ốm"; vào Nhật ký xóa bản ghi 38,5.
+29. Sức khỏe → "Đợt ốm" → "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết có thẻ "Lần khám" (sau "So với thường ngày", trên "Báo cáo cho bác sĩ") với nút "Thêm" và dòng "Chưa có lần khám nào.". Bấm "Thêm". Kỳ vọng: phiếu "Lần khám" có dòng "Chỉ cần ngày giờ. Các ô khác điền được sau.", ô "Lúc khám" ghi giờ hiện tại, ba ô "Nơi khám", "Bác sĩ kết luận", "Lời dặn", mục "Ảnh đơn thuốc, giấy khám" có ô "Thêm". Gõ "thử" vào "Nơi khám", bấm ô "Thêm", chụp một tờ giấy bất kỳ. Kỳ vọng: ảnh hiện thành một ô có viền nét đứt và dấu × đỏ. Bấm "Lưu". Kỳ vọng: phiếu đóng; thẻ có dòng "{dd/mm} {HH:mm} · thử" và một ô ảnh; bấm ô ảnh thì thấy ảnh lớn. Đóng ảnh. Vào Tiện ích → Ảnh. Kỳ vọng: ảnh vừa chụp **không** có ở trang Ảnh.
+30. Về trang chi tiết, bấm dòng "… · thử". Kỳ vọng: phiếu mở với "thử" và ảnh đã lưu (không còn viền nét đứt). Gõ "thử kết luận" vào "Bác sĩ kết luận", gõ hai dòng vào "Lời dặn", bấm "Lưu". Kỳ vọng: thẻ có nhãn nhỏ "Bác sĩ kết luận", dưới là "thử kết luận" chữ đậm, rồi lời dặn đúng hai dòng; không chữ nào bị cắt. Mở lại, đặt "Lúc khám" sang hôm qua (trước giờ bắt đầu của đợt), bấm "Lưu". Kỳ vọng: dòng đỏ "Lúc khám nằm ngoài đợt ốm." dưới ô, phiếu không đóng. Đóng phiếu, chọn bỏ thay đổi.
+31. Bật chế độ máy bay. Kỳ vọng: thẻ "Lần khám" có dòng "Cần kết nối mạng để thay đổi các mục dưới đây.", nút "Thêm" mờ. Bấm dòng lần khám. Kỳ vọng: phiếu có dòng đó; "Lưu" và "Xóa lần khám" mờ. Đóng phiếu, tắt chế độ máy bay.
+32. Bấm bút chì ở đầu trang. Kỳ vọng: "Xóa đợt ốm" mờ, ngay dưới là dòng "Xóa các lần khám trước.". Đóng phiếu.
+33. Dọn: bấm dòng lần khám, bấm dấu × trên ảnh. Kỳ vọng: hỏi lại "Xóa ảnh này?"; đồng ý thì ảnh biến mất ngay, phiếu vẫn mở. Bấm ô "Thêm", chụp một ảnh nữa, bấm "Lưu". Mở lại lần khám, bấm "Xóa lần khám". Kỳ vọng: hỏi lại "Xóa lần khám này và các ảnh của nó?"; đồng ý thì phiếu đóng, thẻ ghi lại "Chưa có lần khám nào.". Bút chì → "Xóa đợt ốm" bấm được: xóa đợt thử.
 
 Kết quả: Chờ người dùng.
 
```

`docs/device-checklist.md` từ trước đã không theo prettier: không chạy `prettier --write` lên nó.

```bash
git add docs/device-checklist.md docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
git commit -m "docs: the M5d part of step 38, and readings of §6.4 and §8.3 in the spec" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của Task 1 có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này là untracked (??), hoặc đã được commit lúc duyệt thì là M; các file plan khác chưa chạy: không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5d.md
git commit -m "docs(plan): the M5d plan and its check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m5d
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm; nhắc người dùng phần M5d của Bước 38 (mục 29–33) đang chờ họ trên iPhone thật; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
