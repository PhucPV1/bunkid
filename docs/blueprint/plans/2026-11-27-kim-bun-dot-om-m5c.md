# Kim Bun — Đợt ốm M5c: sheet "Lần khám" Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§8.4; "Mất mạng thì nút Thêm và Lưu tắt" của §8.2; phần "sheet lần khám" của §10.1; phần sheet của "thẻ lần khám có 0, 1 và 6 ảnh" ở §10.3)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Có sheet "Lần khám" để thêm và sửa một lần khám, kèm tối đa 6 ảnh đơn thuốc, xóa ảnh và xóa lần khám. Sheet chưa có lối vào (thẻ "Lần khám" là việc của M5d); chỉ thấy trên trang tạm.

**Architecture:**

- **`components/illness/VisitSheet.tsx`:** `VisitSheetView` vẽ sheet không dùng hook (để test bấm được nút), như `EpisodeSheetView`; `VisitSheet` giữ trạng thái: giá trị các ô, ảnh vừa chọn chưa gửi, ảnh tải lỗi, câu lỗi; gọi `buildVisit` (M5b) rồi `useVisitActions` (M5b).
- **Ảnh:** ảnh đã lưu lấy đường dẫn ký bằng `usePhotoUrls`; ảnh vừa chọn hiện bằng `URL.createObjectURL`, thu hồi khi sheet đóng. Ảnh chưa gửi có viền nét đứt.
- **Mất mạng:** dòng "Cần kết nối mạng để thay đổi các mục dưới đây." của `OnlineOnly` tách thành `OfflineNote` để dùng lại (`components/OnlineOnly.tsx`; `OnlineOnly` vẽ y như cũ).
- Không thêm gói, không thêm token màu, không thêm icon (`plus`, `close` đã có), không có migration.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m5c`, cắt từ `main` sau khi M5b đã lên. Baseline: 2015 test (211 file) vitest xanh, typecheck sạch.

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

1. **Sheet chưa có lối vào.** Nút "Thêm" và việc bấm vào một lần khám nằm ở thẻ "Lần khám" của M5d. Plan này chỉ thấy trên trang tạm; sau plan này app trên `main` không đổi gì trên màn hình.
2. **Tiêu đề "Lần khám"** cho cả thêm mới và sửa; dòng phụ "Chỉ cần ngày giờ. Các ô khác điền được sau." luôn có (§8.4). Thứ tự: dòng phụ, (mất mạng: dòng cần mạng), (ảnh lỗi: thẻ lỗi), "Lúc khám", "Nơi khám", "Bác sĩ kết luận", "Lời dặn", "Ảnh đơn thuốc, giấy khám"; chân sheet: câu lỗi của server, "Lưu", "Xóa lần khám", dòng lý do.
3. **Mất mạng** (§8.2 ghi "kèm `NeedsNetwork`"): câu của `NeedsNetwork` nói chuyện tải trang ("Cần mạng để tải … Trang sẽ tự tải khi có mạng lại."), không hợp với việc lưu. Sheet dùng câu sẵn có của các mục cần mạng, "Cần kết nối mạng để thay đổi các mục dưới đây.", ở đầu sheet. Tắt: "Lưu", ô "Thêm", nút xóa của ảnh đã lưu và "Xóa lần khám" (hai nút xóa cũng ghi thẳng lên server). Các ô chữ vẫn gõ được; ảnh vừa chọn chưa gửi vẫn bỏ ra được. Ghi vào spec §8.4 (Patch 3).
4. **"Lưu" tắt khi ô "Lúc khám" bị xóa trống**, không thêm câu nào (spec không có câu cho ô trống; dòng phụ đã nói "Chỉ cần ngày giờ").
5. **Mỗi lần bấm "Thêm" chọn một ảnh** (không chọn nhiều), để không phải nói gì khi chọn quá số chỗ còn lại.
6. **Ô ảnh trong sheet 60×78** như ở thẻ (§8.3). Nút xóa của ảnh là một dấu × tròn 24 px màu `danger-solid` ở góc trên phải, vùng chạm 44×44, nhãn đọc màn hình "Xóa ảnh". Ảnh chưa gửi (vừa chọn, hay tải lỗi) có viền nét đứt: khác ảnh đã lưu bằng hình dạng nên đọc được cả ở theme `night`. Viền này thêm sau bước nhìn thử lúc viết plan: khi 2 trong 4 ảnh tải lỗi, không có cách nào biết ảnh nào còn chờ. Ghi vào spec §8.4 (Patch 3).
7. **Ảnh vừa chọn bỏ ra không hỏi lại** (chưa gửi lên đâu cả); ảnh đã lưu hỏi "Xóa ảnh này?" rồi xóa ngay (§8.4). Hỏi lại bằng `window.confirm`, như "Xóa đợt ốm" và trang Ảnh.
8. **Dòng "Kho ảnh đã đầy. …"** chỉ hiện khi còn chỗ (chưa đủ 6 ảnh); đủ 6 thì ô "Thêm" đã ẩn, không cần nói gì thêm. Dung lượng chưa tải xong thì coi như chưa đầy.
9. **Lưu có ảnh lỗi** (§8.4): sheet ở lại, chuyển sang sửa lần khám vừa lưu; thẻ lỗi "Lần khám đã lưu, còn {k} ảnh chưa tải được." có nút "Thử lại" làm đúng việc của "Lưu" (chỉ tải các ảnh còn chờ, cộng ảnh chọn thêm). {k} chỉ đếm ảnh tải lỗi còn trong sheet.
10. **Lưu xong** thì sheet đóng, không có toast (spec không có câu nào). Sửa mà không đổi gì và không có ảnh mới: "Lưu" chỉ đóng sheet.
11. **Thêm lần khám cho đợt đã đóng:** "Lúc khám" vẫn mặc định là lúc này (đúng chữ §8.4), nằm ngoài đợt, nên phải chọn lại giờ; bấm "Lưu" ngay thì thấy "Lúc khám nằm ngoài đợt ốm.". Ghi vào spec §8.4 (Patch 3).
12. **"Thử lại" không gửi lần thứ hai.** Trong lúc đang lưu, thẻ lỗi ẩn đi ("Lưu" đang hiện vòng chờ), và `save()` không làm gì khi đang bận, khi mất mạng hay khi ô "Lúc khám" trống. Nếu không, bấm "Thử lại" hai lần trong lúc ảnh đang tải (vài giây trên điện thoại) sẽ tải mỗi ảnh hai lần, có thể quá 6 ảnh. Lỗi này lộ ra ở vòng reviewer của plan.
13. **Đợt chưa lên server.** Đợt ốm đi qua outbox, lần khám ghi thẳng lên server: thêm lần khám cho một đợt vừa bắt đầu mà outbox chưa gửi (hay đợt vừa bị xóa ở máy khác) thì server từ chối (khóa ngoại, mã `23503`). `toVietnameseError` nay đổi mã đó thành đúng chữ outbox dùng cho mã đó ("Bản ghi liên quan không còn", thêm dấu chấm như các câu khác của hàm này), thay cho câu tiếng Anh của Postgres; đợt lên server rồi bấm "Lưu" lại là được. Ghi vào spec §8.4 (Patch 3).
14. **Trên trang thật không có gì để xem**: sheet chưa có lối vào. Bước trình duyệt chỉ trên trang tạm.

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
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5c.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 3 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `864a3ea` cộng 18 patch của M4a, M4b, M4c và 7 patch của M5a, M5b trích từ các file plan đó (nền tạm trong lúc M4 chưa lên `main`). Trong bản chạy thử task code là hai commit (test trước, code sau; còn làm theo plan thì một commit ở Step 5). `tsc --noEmit` sạch sau commit code; số test đỏ và xanh là số đo thật trên cả bộ test. `bun run build` đã chạy xanh.
- **Đo lại trên `main` thật.** Sau khi M4c lên, `main` @ `88caf0b` (cây code trùng khít nền tạm ở trên, chỉ khác các file plan) được chép ra một bản sao sạch; mọi patch của M5 trích từ chính các file plan được áp lần lượt lên đó và đo lại: đỏ (2 file, 1 test) và xanh (212/2034) đúng như ghi; `tsc` sạch; build 42/42. Cây cuối trùng bản chạy thử.
- **Đã nhìn thử khi viết plan.** Trang tạm của Task 2 đã được mở ở 375 px trên bản sao ở trạng thái cuối của M5: số đo ở các mục của bước trình duyệt là của lần đó. Lần nhìn ấy lộ ra việc ảnh tải lỗi trông y như ảnh đã lưu; viền nét đứt đã có trong Patch 2 (Diễn giải spec mục 6). Chưa xem: bề ngang 390 và 440, các theme `peach`, `lavender`, `sea`, Safari iOS thật (bánh xe ngày giờ, chọn ảnh từ máy ảnh).
- **Trang tạm** vẽ `VisitSheetView` với dữ liệu giả, ảnh là hình vẽ tại chỗ (`data:` SVG); không đọc hay ghi gì của gia đình. Mã màu trong hình vẽ đó chỉ nằm ở trang tạm, không commit.
- **Trình duyệt.** Dùng khung Browser trong app, cỡ 375×812 (`resize_window` preset `mobile`); người dùng đã chọn sẵn ngày 2026-11-26, không hỏi lại. Gọi `navigate` trước. Chỉ khi bộ kiểm quyền của app từ chối khung Browser thì hỏi người dùng đúng một câu rồi làm tiếp. Trang tạm vẽ được khi chưa đăng nhập. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại `resize_window` và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt lại theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt nó khi xong. Sheet mở bằng `showModal` và trượt lên trong khoảng nửa giây: chờ 1,5 giây sau khi trang tải rồi mới đo. Không đọc cả console: lọc bằng `onlyErrors` và `limit` nhỏ.
- **pgTAP.** Plan này không đổi DB nên không chạy pgTAP.
- **Người dùng muốn màn hình gọn, ít số.** Không thêm chữ nào ngoài plan.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm token màu hay icon. `lib/themeGuard.test.ts` phải xanh.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Các file plan chưa chạy chưa được commit.** `git status` có thể thấy các file plan khác là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng sau M5b. M5d mở sheet từ thẻ "Lần khám" và dùng `OfflineNote` trong thẻ.

**Consumes (M5b):** `type Visit`, `type VisitFields`, `type VisitSaved`, `useVisits`, `useVisitActions` (`lib/data/illness.ts`); `MAX_VISIT_PHOTOS`, `type VisitRaw`, `visitToRaw`, `buildVisit`, `photoDeletable`, `visitDelete` (`lib/rules/visits.ts`).

**Consumes (đã ở `main` từ trước):** `OnlineOnly`; `usePhotosUsage`, `usePhotoUrls` (`lib/data/photos.ts`); `usage` (`lib/rules/photos.ts`); `useOnline`; `Sheet`, `Button`, `ErrorCard`, `Icon`; `FIELD_INPUT`, `FIELD_LABEL`; `type EpisodeLike`; `toVietnameseError`; `cx`.

**Produces:**

- `components/OnlineOnly.tsx`: `OfflineNote()` (dòng "Cần kết nối mạng để thay đổi các mục dưới đây.").
- `lib/data/errors.ts`: `toVietnameseError` đổi mã `23503` thành "Bản ghi liên quan không còn." (cho mọi chỗ gọi nó; trước đó là "Có lỗi xảy ra: …" kèm chữ tiếng Anh của Postgres).
- `components/illness/VisitSheet.tsx`: `type VisitPhotoTile = { key: string; src: string | undefined; deletable: boolean; pending: boolean }`; `VisitSheetView(props)` (không hook); `VisitSheet(props: { baby: Pick<Baby, "id" | "family_id">; userId: string; isOwner: boolean; episode: EpisodeLike; visit: Visit | null; onClose: () => void })`, `visit` null là thêm mới.
- Chữ đúng của spec §8.4: "Lần khám", "Chỉ cần ngày giờ. Các ô khác điền được sau.", "Lúc khám", "Nơi khám", "Bác sĩ kết luận", "Lời dặn", "Ảnh đơn thuốc, giấy khám", "Thêm", "Xóa ảnh này?", "Kho ảnh đã đầy. Xóa bớt ảnh ở trang Ảnh để thêm ảnh mới.", "Lần khám đã lưu, còn {k} ảnh chưa tải được.", "Lưu", "Xóa lần khám", "Xóa lần khám này và các ảnh của nó?", "Còn ảnh do người khác thêm. Nhờ người đó hoặc chủ gia đình xóa trước.".
- **Vitest sau M5c:** 2034 test, 212 file.

---

### Task 1: Sheet "Lần khám" (§8.4)

**Files:**

- Create: `components/illness/VisitSheet.tsx`
- Modify: `components/OnlineOnly.tsx` (tách `OfflineNote`)
- Modify: `lib/data/errors.ts` (mã `23503`)
- Test: `components/illness/visitsheet.test.tsx` (mới), `lib/data/errors.test.ts` (thêm một test)

**Interfaces:**

- Consumes: như mục Consumes ở trên.
- Produces: `OfflineNote`, `VisitPhotoTile`, `VisitSheetView`, `VisitSheet` (chữ ký ở Contracts); `toVietnameseError` đổi mã `23503` thành "Bản ghi liên quan không còn.".

- [ ] **Step 0: Kiểm M5b đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
git log --oneline -20 main | grep "the M5b plan and its check results"
git checkout -b feat/kim-bun-dot-om-m5c
bunx vitest run
```

Expected: lệnh `grep` in đúng một dòng (không thấy thì dừng và báo người dùng); `Test Files  211 passed (211)`, `Tests  2015 passed (2015)`. `main` có thêm commit khác thì ghi lại số xuất phát thật.

- [ ] **Step 1: Viết test đỏ (Patch 1)**

`VisitSheetView`: các ô theo thứ tự, câu lỗi dưới "Lúc khám", "Lưu" tắt khi ô trống, đủ 6 ảnh thì ẩn "Thêm", nút xóa ảnh chỉ khi được xóa, viền nét đứt của ảnh chưa gửi, kho đầy, thẻ lỗi có "Thử lại" (ẩn trong lúc đang lưu), mất mạng, ba dạng của "Xóa lần khám", câu lỗi của server, và các ô và nút báo đúng việc. `VisitSheet`: mở đúng giá trị khi thêm mới và khi sửa, ai được xóa ảnh và lần khám, đủ 6 ảnh, kho đầy, mất mạng. `errors.test.ts`: mã `23503`.

```diff
diff --git a/components/illness/visitsheet.test.tsx b/components/illness/visitsheet.test.tsx
new file mode 100644
index 0000000..9f6e3f6
--- /dev/null
+++ b/components/illness/visitsheet.test.tsx
@@ -0,0 +1,359 @@
+import type { ComponentProps, FormEvent } from "react";
+import { renderToStaticMarkup } from "react-dom/server";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import type { Visit } from "@/lib/data/illness";
+import type { PhotoRow } from "@/lib/supabase/rows";
+import { VisitSheet, VisitSheetView } from "./VisitSheet";
+
+const state = vi.hoisted(() => ({
+  online: true,
+  usage: 0,
+  visits: undefined as unknown,
+}));
+const action = () => ({ isPending: false, mutate: vi.fn() });
+const actions = vi.hoisted(() => ({
+  add: { isPending: false, mutate: vi.fn() },
+  update: { isPending: false, mutate: vi.fn() },
+  remove: { isPending: false, mutate: vi.fn() },
+  removePhoto: { isPending: false, mutate: vi.fn() },
+}));
+
+vi.mock("@/lib/data/illness", () => ({
+  useVisitActions: () => actions,
+  useVisits: () => ({ data: state.visits }),
+}));
+vi.mock("@/lib/data/photos", () => ({
+  usePhotosUsage: () => ({ data: state.usage }),
+  usePhotoUrls: (paths: string[]) => ({
+    data: Object.fromEntries(paths.map((path) => [path, `https://x/${path}`])),
+  }),
+}));
+vi.mock("@/lib/hooks/useOnline", () => ({ useOnline: () => state.online }));
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const episode = {
+  id: "e1",
+  started_at: iso("2026-11-24 23:30"),
+  ended_at: null,
+};
+const photo = (id: string, createdBy: string) =>
+  ({
+    id,
+    visit_id: "v1",
+    created_by: createdBy,
+    storage_path: `f1/b1/${id}.jpg`,
+  }) as PhotoRow;
+const saved = (photos: PhotoRow[], createdBy = "u2"): Visit =>
+  ({
+    id: "v1",
+    episode_id: "e1",
+    baby_id: "b1",
+    visited_at: iso("2026-11-25 09:15"),
+    place: "Phòng khám Nhi",
+    conclusion: "Viêm họng",
+    advice: "Uống nhiều nước",
+    created_by: createdBy,
+    created_at: iso("2026-11-25 09:15"),
+    updated_at: iso("2026-11-25 09:15"),
+    photos,
+  }) as Visit;
+
+type ViewProps = ComponentProps<typeof VisitSheetView>;
+const viewProps = (over: Partial<ViewProps> = {}): ViewProps => ({
+  formId: "f1",
+  raw: { at: "2026-11-25T09:15", place: "", conclusion: "", advice: "" },
+  error: null,
+  message: null,
+  failed: 0,
+  photos: [],
+  room: true,
+  full: false,
+  online: true,
+  saving: false,
+  busy: false,
+  deletion: "hidden",
+  dirty: false,
+  inputKey: 0,
+  onRaw: () => {},
+  onSubmit: () => {},
+  onRetry: () => {},
+  onPick: () => {},
+  onDeletePhoto: () => {},
+  onDelete: () => {},
+  onClose: () => {},
+  ...over,
+});
+const view = (over: Partial<ViewProps> = {}) =>
+  renderToStaticMarkup(<VisitSheetView {...viewProps(over)} />);
+const tiles = (n: number, pending = false) =>
+  Array.from({ length: n }, (_, i) => ({
+    key: `p${i}`,
+    src: `https://x/p${i}.jpg`,
+    deletable: true,
+    pending,
+  }));
+
+beforeEach(() => {
+  state.online = true;
+  state.usage = 0;
+  state.visits = undefined;
+  for (const name of ["add", "update", "remove", "removePhoto"] as const)
+    Object.assign(actions[name], action());
+});
+
+// Spec 2026-11-26 §8.4.
+describe("VisitSheetView", () => {
+  it("the sheet: its line, the four fields, the photos, then Lưu", () => {
+    const html = view();
+    expect(html).toContain(">Lần khám</h2>");
+    expect(html).toContain(">Chỉ cần ngày giờ. Các ô khác điền được sau.</p>");
+    const order = [
+      ">Lúc khám</span>",
+      ">Nơi khám</span>",
+      ">Bác sĩ kết luận</span>",
+      ">Lời dặn</span>",
+      ">Ảnh đơn thuốc, giấy khám</span>",
+      ">Lưu</button>",
+    ].map((mark) => html.indexOf(mark));
+    expect(order[0]).toBeGreaterThan(-1);
+    expect(order).toEqual([...order].sort((a, b) => a - b));
+    expect(html).toContain('type="datetime-local"');
+    expect(html).toContain('value="2026-11-25T09:15"');
+    expect(html).toMatch(/<input[^>]*maxLength="80"/);
+    expect(html).toMatch(/<input[^>]*maxLength="120"/);
+    expect(html).toMatch(/<textarea[^>]*rows="3"[^>]*maxLength="500"/);
+    expect(html).toMatch(/<input[^>]*type="file"[^>]*accept="image\/\*"/);
+    expect(html).toMatch(/>Thêm<input[^>]*type="file"/);
+    expect(html).not.toContain("Xóa lần khám");
+    expect(html).not.toContain('role="alert"');
+  });
+
+  it("an error sits under Lúc khám", () => {
+    const html = view({ error: "Lúc khám nằm ngoài đợt ốm." });
+    const at = html.indexOf(">Lúc khám</span>");
+    const error = html.indexOf(">Lúc khám nằm ngoài đợt ốm.</span>");
+    expect(at).toBeLessThan(error);
+    expect(error).toBeLessThan(html.indexOf(">Nơi khám</span>"));
+  });
+
+  it("Lưu waits for a time", () => {
+    const html = view({
+      raw: { at: "", place: "", conclusion: "", advice: "" },
+    });
+    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Lưu<\/button>/);
+  });
+
+  it("up to six photos: the sixth hides Thêm", () => {
+    expect(view({ photos: tiles(5) }).match(/<img/g)).toHaveLength(5);
+    const html = view({ photos: tiles(6), room: false });
+    expect(html.match(/<img/g)).toHaveLength(6);
+    expect(html).not.toContain(">Thêm<");
+    expect(html).not.toContain('type="file"');
+  });
+
+  it("a photo has a delete button only when it may be deleted", () => {
+    const photos = [
+      { ...tiles(1)[0], deletable: false },
+      { ...tiles(2)[1], deletable: true },
+    ];
+    expect(view({ photos }).match(/aria-label="Xóa ảnh"/g)).toHaveLength(1);
+  });
+
+  it("a photo not sent yet has a dashed outline, so it shows which ones wait", () => {
+    const html = view({
+      photos: [...tiles(1), { ...tiles(2, true)[1] }],
+    });
+    expect(html.match(/outline-dashed/g)).toHaveLength(1);
+    expect(html.indexOf("outline-dashed")).toBeGreaterThan(
+      html.indexOf('src="https://x/p0.jpg"'),
+    );
+  });
+
+  it("a full store hides Thêm and says why", () => {
+    const html = view({ full: true });
+    expect(html).not.toContain(">Thêm<");
+    expect(html).toContain(
+      "Kho ảnh đã đầy. Xóa bớt ảnh ở trang Ảnh để thêm ảnh mới.",
+    );
+    expect(view({ full: true, room: false })).not.toContain("Kho ảnh");
+  });
+
+  it("photos that did not go up: an error card that tries again", () => {
+    const onRetry = vi.fn();
+    const html = view({ failed: 2, onRetry });
+    expect(html).toContain("Lần khám đã lưu, còn 2 ảnh chưa tải được.");
+    expect(html).toContain(">Thử lại</button>");
+    const tree = VisitSheetView(viewProps({ failed: 2, onRetry }));
+    const [card] = findElements(tree, (el) => el.props.onRetry !== undefined);
+    (card.props.onRetry as () => void)();
+    expect(onRetry).toHaveBeenCalledOnce();
+  });
+
+  it("while a save is on its way the error card waits, so Thử lại cannot start a second one", () => {
+    const html = view({ failed: 2, busy: true, saving: true });
+    expect(html).not.toContain("Lần khám đã lưu");
+    expect(html).not.toContain(">Thử lại</button>");
+    expect(html).toMatch(/aria-busy="true"[^>]*>Lưu</);
+  });
+
+  it("offline: a note; Lưu, Thêm and the deletes are off; a photo not sent yet can still go", () => {
+    const html = view({
+      online: false,
+      deletion: "allowed",
+      photos: [...tiles(1), { ...tiles(2, true)[1] }],
+    });
+    expect(html).toContain("Cần kết nối mạng để thay đổi các mục dưới đây.");
+    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Lưu<\/button>/);
+    expect(html).toMatch(/<input[^>]*type="file"[^>]*disabled=""/);
+    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Xóa lần khám<\/button>/);
+    const deletes = html.match(/<button[^>]*aria-label="Xóa ảnh"[^>]*>/g) ?? [];
+    expect(deletes).toHaveLength(2);
+    expect(deletes[0]).toContain('disabled=""');
+    expect(deletes[1]).not.toContain('disabled=""');
+  });
+
+  it("Xóa lần khám: on, or off with the reason", () => {
+    expect(view({ deletion: "allowed" })).toMatch(
+      /<button(?![^>]*disabled="")[^>]*text-danger![^>]*>Xóa lần khám<\/button>/,
+    );
+    const blocked = view({ deletion: "blocked" });
+    expect(blocked).toMatch(
+      /<button[^>]*disabled=""[^>]*>Xóa lần khám<\/button>/,
+    );
+    expect(blocked).toContain(
+      ">Còn ảnh do người khác thêm. Nhờ người đó hoặc chủ gia đình xóa trước.</p>",
+    );
+  });
+
+  it("a refusal is announced above the buttons", () => {
+    expect(view({ message: "Mất kết nối mạng, thử lại sau." })).toMatch(
+      /role="alert"[^>]*>Mất kết nối mạng, thử lại sau.<\/p>/,
+    );
+  });
+
+  it("the fields, the photo picker and the buttons report to the sheet", () => {
+    const onRaw = vi.fn();
+    const onSubmit = vi.fn();
+    const onPick = vi.fn();
+    const onDeletePhoto = vi.fn();
+    const onDelete = vi.fn();
+    const props = viewProps({
+      photos: tiles(1),
+      deletion: "allowed",
+      onRaw,
+      onSubmit,
+      onPick,
+      onDeletePhoto,
+      onDelete,
+    });
+    const tree = VisitSheetView(props);
+    const change = (type: string, index: number, value: unknown) => {
+      const fields = findElements(tree, (el) => el.type === type);
+      (fields[index].props.onChange as (event: unknown) => void)({
+        target: value,
+      });
+    };
+    change("input", 0, { value: "2026-11-25T10:00" });
+    expect(onRaw).toHaveBeenLastCalledWith({
+      ...props.raw,
+      at: "2026-11-25T10:00",
+    });
+    change("input", 1, { value: "Nhà" });
+    expect(onRaw).toHaveBeenLastCalledWith({ ...props.raw, place: "Nhà" });
+    change("input", 2, { value: "Sốt siêu vi" });
+    expect(onRaw).toHaveBeenLastCalledWith({
+      ...props.raw,
+      conclusion: "Sốt siêu vi",
+    });
+    change("textarea", 0, { value: "Tái khám nếu sốt cao" });
+    expect(onRaw).toHaveBeenLastCalledWith({
+      ...props.raw,
+      advice: "Tái khám nếu sốt cao",
+    });
+    const file = { name: "a.jpg" } as File;
+    change("input", 3, { files: [file] });
+    expect(onPick).toHaveBeenCalledWith(file);
+    change("input", 3, { files: [] });
+    expect(onPick).toHaveBeenCalledOnce();
+    const [form] = findElements(tree, (el) => el.type === "form");
+    const event = { preventDefault: () => {} } as FormEvent;
+    (form.props.onSubmit as (event: FormEvent) => void)(event);
+    expect(onSubmit).toHaveBeenCalledWith(event);
+    const [x] = findElements(
+      tree,
+      (el) => el.props["aria-label"] === "Xóa ảnh",
+    );
+    (x.props.onClick as () => void)();
+    expect(onDeletePhoto).toHaveBeenCalledWith("p0");
+    const [remove] = findElements(
+      tree,
+      (el) => el.props.children === "Xóa lần khám",
+    );
+    (remove.props.onClick as () => void)();
+    expect(onDelete).toHaveBeenCalledOnce();
+  });
+});
+
+describe("VisitSheet", () => {
+  const sheet = (visit: Visit | null, userId = "u2", isOwner = false) =>
+    renderToStaticMarkup(
+      <VisitSheet
+        baby={{ id: "b1", family_id: "f1" }}
+        userId={userId}
+        isOwner={isOwner}
+        episode={episode}
+        visit={visit}
+        onClose={() => {}}
+      />,
+    );
+
+  it("a new visit opens on now, with Thêm and no delete", () => {
+    vi.useFakeTimers({ now: new Date("2026-11-26T10:00:30+07:00") });
+    const html = sheet(null);
+    vi.useRealTimers();
+    expect(html).toContain('value="2026-11-26T10:00"');
+    expect(html).toMatch(/>Thêm<input[^>]*type="file"/);
+    expect(html).not.toContain("Xóa lần khám");
+  });
+
+  it("a saved visit opens on its values and its photos", () => {
+    const visit = saved([photo("p1", "u2"), photo("p2", "u1")]);
+    state.visits = [visit];
+    const html = sheet(visit);
+    expect(html).toContain('value="2026-11-25T09:15"');
+    expect(html).toContain('value="Phòng khám Nhi"');
+    expect(html).toContain('value="Viêm họng"');
+    expect(html).toContain(">Uống nhiều nước</textarea>");
+    expect(html).toContain('src="https://x/f1/b1/p1.jpg"');
+    expect(html).toContain('src="https://x/f1/b1/p2.jpg"');
+    // u2 added p1 and the visit; p2 is u1's.
+    expect(html.match(/aria-label="Xóa ảnh"/g)).toHaveLength(1);
+    expect(html).toMatch(/disabled=""[^>]*>Xóa lần khám<\/button>/);
+    expect(html).toContain("Còn ảnh do người khác thêm.");
+  });
+
+  it("the owner may delete every photo and the visit", () => {
+    const visit = saved([photo("p1", "u2"), photo("p2", "u1")]);
+    const html = sheet(visit, "u9", true);
+    expect(html.match(/aria-label="Xóa ảnh"/g)).toHaveLength(2);
+    expect(html).toMatch(
+      /<button(?![^>]*disabled="")[^>]*>Xóa lần khám<\/button>/,
+    );
+  });
+
+  it("six photos hide Thêm; a full store hides it too", () => {
+    const six = saved(
+      Array.from({ length: 6 }, (_, i) => photo(`p${i}`, "u2")),
+    );
+    expect(sheet(six)).not.toContain(">Thêm<");
+    state.usage = 1000 * 1024 ** 2;
+    expect(sheet(null)).toContain("Kho ảnh đã đầy.");
+  });
+
+  it("offline, Lưu is off", () => {
+    state.online = false;
+    expect(sheet(null)).toMatch(/disabled=""[^>]*>Lưu<\/button>/);
+  });
+});
diff --git a/lib/data/errors.test.ts b/lib/data/errors.test.ts
index 60ec147..1e1028a 100644
--- a/lib/data/errors.test.ts
+++ b/lib/data/errors.test.ts
@@ -11,6 +11,12 @@ describe("toVietnameseError", () => {
       "Đã có người bắt đầu trước.",
     );
   });
+  it("maps a missing related row, as the outbox does", () => {
+    expect(
+      toVietnameseError({ code: "23503", message: "violates foreign key" }),
+    ).toBe("Bản ghi liên quan không còn.");
+  });
+
   it("maps permission errors", () => {
     expect(
       toVietnameseError({ code: "42501", message: "permission_denied" }),
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 210 passed (212)`, `Tests  1 failed | 2015 passed (2016)`. `components/illness/visitsheet.test.tsx` không nạp được vì `./VisitSheet` chưa có; test đỏ là "maps a missing related row, as the outbox does" của `errors.test.ts`.

- [ ] **Step 3: Viết sheet (Patch 2)**

```diff
diff --git a/components/OnlineOnly.tsx b/components/OnlineOnly.tsx
index cccbcd9..e00263a 100644
--- a/components/OnlineOnly.tsx
+++ b/components/OnlineOnly.tsx
@@ -12,12 +12,18 @@ export function OnlineOnly({ children }: { children: ReactNode }) {
       disabled={!online}
       className="flex min-w-0 flex-col gap-6 [&_:is(input,select,textarea):disabled]:opacity-50"
     >
-      {!online && (
-        <p role="status" className="rounded-xl bg-warn-soft p-3 text-warn-ink">
-          Cần kết nối mạng để thay đổi các mục dưới đây.
-        </p>
-      )}
+      {!online && <OfflineNote />}
       {children}
     </fieldset>
   );
 }
+
+// The line above writes that are off while offline; also used where only
+// some buttons wait for the network (spec 2026-11-26 §8.2).
+export function OfflineNote() {
+  return (
+    <p role="status" className="rounded-xl bg-warn-soft p-3 text-warn-ink">
+      Cần kết nối mạng để thay đổi các mục dưới đây.
+    </p>
+  );
+}
diff --git a/components/illness/VisitSheet.tsx b/components/illness/VisitSheet.tsx
new file mode 100644
index 0000000..080209f
--- /dev/null
+++ b/components/illness/VisitSheet.tsx
@@ -0,0 +1,461 @@
+"use client";
+
+import { useEffect, useId, useRef, useState, type FormEvent } from "react";
+import { OfflineNote } from "@/components/OnlineOnly";
+import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
+import { Button } from "@/components/ui/Button";
+import { ErrorCard } from "@/components/ui/ErrorCard";
+import { Icon } from "@/components/ui/Icon";
+import { Sheet } from "@/components/ui/Sheet";
+import { toVietnameseError } from "@/lib/data/errors";
+import {
+  type Visit,
+  type VisitFields,
+  type VisitSaved,
+  useVisitActions,
+  useVisits,
+} from "@/lib/data/illness";
+import { usePhotosUsage, usePhotoUrls } from "@/lib/data/photos";
+import { useOnline } from "@/lib/hooks/useOnline";
+import type { EpisodeLike } from "@/lib/rules/illness";
+import { usage } from "@/lib/rules/photos";
+import {
+  buildVisit,
+  MAX_VISIT_PHOTOS,
+  photoDeletable,
+  type VisitRaw,
+  visitDelete,
+  visitToRaw,
+} from "@/lib/rules/visits";
+import type { Baby } from "@/lib/supabase/rows";
+import { cx } from "@/lib/ui/cx";
+
+const DELETE_VISIT = "Xóa lần khám này và các ảnh của nó?";
+const DELETE_PHOTO = "Xóa ảnh này?";
+
+// A photo in the sheet: saved (`pending` false) or picked and not sent yet.
+export type VisitPhotoTile = {
+  key: string;
+  src: string | undefined;
+  deletable: boolean;
+  pending: boolean;
+};
+
+// Spec 2026-11-26 §8.4, drawn without hooks so a test can press its buttons.
+export function VisitSheetView({
+  formId,
+  raw,
+  error,
+  message,
+  failed,
+  photos,
+  room,
+  full,
+  online,
+  saving,
+  busy,
+  deletion,
+  dirty,
+  inputKey,
+  onRaw,
+  onSubmit,
+  onRetry,
+  onPick,
+  onDeletePhoto,
+  onDelete,
+  onClose,
+}: {
+  formId: string;
+  raw: VisitRaw;
+  // The sentence under "Lúc khám".
+  error: string | null;
+  // A refusal of the server.
+  message: string | null;
+  // Photos the last Lưu could not send.
+  failed: number;
+  photos: VisitPhotoTile[];
+  // Fewer than six photos.
+  room: boolean;
+  // The family's photo store is full (§8.2).
+  full: boolean;
+  online: boolean;
+  // Lưu is on its way.
+  saving: boolean;
+  // Any change is on its way: every button waits.
+  busy: boolean;
+  deletion: "hidden" | "blocked" | "allowed";
+  dirty: boolean;
+  // A new key clears the file input after a pick.
+  inputKey: number;
+  onRaw: (next: VisitRaw) => void;
+  onSubmit: (event: FormEvent) => void;
+  onRetry: () => void;
+  onPick: (file: File) => void;
+  onDeletePhoto: (key: string) => void;
+  onDelete: () => void;
+  onClose: () => void;
+}) {
+  const text = (
+    label: string,
+    key: "place" | "conclusion",
+    maxLength: number,
+  ) => (
+    <label className="flex flex-col gap-1.5">
+      <span className={FIELD_LABEL}>{label}</span>
+      <input
+        className={FIELD_INPUT}
+        maxLength={maxLength}
+        value={raw[key]}
+        onChange={(event) => onRaw({ ...raw, [key]: event.target.value })}
+      />
+    </label>
+  );
+  return (
+    <Sheet
+      open
+      onClose={onClose}
+      title="Lần khám"
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
+            disabled={busy || !online || raw.at === ""}
+            className="min-h-14!"
+          >
+            Lưu
+          </Button>
+          {deletion !== "hidden" && (
+            <Button
+              variant="ghost"
+              block
+              disabled={busy || !online || deletion === "blocked"}
+              className="text-danger!"
+              onClick={onDelete}
+            >
+              Xóa lần khám
+            </Button>
+          )}
+          {deletion === "blocked" && (
+            <p className="px-1 text-[13px] text-muted">
+              Còn ảnh do người khác thêm. Nhờ người đó hoặc chủ gia đình xóa
+              trước.
+            </p>
+          )}
+        </div>
+      }
+    >
+      <form
+        id={formId}
+        onSubmit={onSubmit}
+        className="flex flex-col gap-4 pt-1"
+      >
+        <p className="text-[15px] text-muted">
+          Chỉ cần ngày giờ. Các ô khác điền được sau.
+        </p>
+        {!online && <OfflineNote />}
+        {/* Hidden while a save is on its way: "Thử lại" is that save. */}
+        {failed > 0 && !busy && (
+          <ErrorCard
+            message={`Lần khám đã lưu, còn ${failed} ảnh chưa tải được.`}
+            onRetry={onRetry}
+          />
+        )}
+        <label className="flex flex-col gap-1.5">
+          <span className={FIELD_LABEL}>Lúc khám</span>
+          <input
+            type="datetime-local"
+            className={FIELD_INPUT}
+            value={raw.at}
+            onChange={(event) => onRaw({ ...raw, at: event.target.value })}
+          />
+          {error && <span className="text-[13px] text-danger">{error}</span>}
+        </label>
+        {text("Nơi khám", "place", 80)}
+        {text("Bác sĩ kết luận", "conclusion", 120)}
+        <label className="flex flex-col gap-1.5">
+          <span className={FIELD_LABEL}>Lời dặn</span>
+          <textarea
+            rows={3}
+            maxLength={500}
+            className={`${FIELD_INPUT} py-2.5`}
+            value={raw.advice}
+            onChange={(event) => onRaw({ ...raw, advice: event.target.value })}
+          />
+        </label>
+        <div className="flex flex-col gap-1.5">
+          <span className={FIELD_LABEL}>Ảnh đơn thuốc, giấy khám</span>
+          <div className="flex flex-wrap gap-2.5 pt-1">
+            {photos.map((photo) => (
+              <div key={photo.key} className="relative h-[78px] w-[60px]">
+                <div
+                  className={cx(
+                    "h-full w-full overflow-hidden rounded-[10px] bg-line",
+                    // Not sent yet: a dashed outline, the same in every theme.
+                    photo.pending &&
+                      "outline-2 outline-offset-2 outline-muted outline-dashed",
+                  )}
+                >
+                  {photo.src && (
+                    <img
+                      src={photo.src}
+                      alt=""
+                      className="h-full w-full object-cover"
+                    />
+                  )}
+                </div>
+                {photo.deletable && (
+                  // 44 × 44 to tap, around a small round mark on the corner.
+                  <button
+                    type="button"
+                    aria-label="Xóa ảnh"
+                    disabled={busy || (!photo.pending && !online)}
+                    onClick={() => onDeletePhoto(photo.key)}
+                    className="absolute -top-2.5 -right-2.5 flex size-11 items-center justify-center disabled:opacity-50"
+                  >
+                    <span className="flex size-6 items-center justify-center rounded-full bg-danger-solid text-on-danger">
+                      <Icon name="close" size={14} />
+                    </span>
+                  </button>
+                )}
+              </div>
+            ))}
+            {room && !full && (
+              // The native file input shows English, so it hides behind
+              // a Vietnamese tile.
+              <label
+                className={cx(
+                  "flex h-[78px] w-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-muted text-[12px] font-semibold text-accent-text has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-text",
+                  (!online || busy) && "cursor-not-allowed opacity-50",
+                )}
+              >
+                <Icon name="plus" size={20} />
+                Thêm
+                <input
+                  key={inputKey}
+                  type="file"
+                  accept="image/*"
+                  className="sr-only"
+                  disabled={!online || busy}
+                  onChange={(event) => {
+                    const file = event.target.files?.[0];
+                    if (file) onPick(file);
+                  }}
+                />
+              </label>
+            )}
+          </div>
+          {room && full && (
+            <p className="px-1 text-[13px] text-muted">
+              Kho ảnh đã đầy. Xóa bớt ảnh ở trang Ảnh để thêm ảnh mới.
+            </p>
+          )}
+        </div>
+      </form>
+    </Sheet>
+  );
+}
+
+type Pending = { key: string; file: File; url: string };
+
+// The sheet as it was opened, or as it was last saved: the visit's id (null
+// until a new visit is saved), its stored fields, the form and its time.
+type Base = {
+  id: string | null;
+  stored: VisitFields | null;
+  raw: VisitRaw;
+  at: string;
+};
+
+export function VisitSheet({
+  baby,
+  userId,
+  isOwner,
+  episode,
+  visit,
+  onClose,
+}: {
+  baby: Pick<Baby, "id" | "family_id">;
+  userId: string;
+  isOwner: boolean;
+  episode: EpisodeLike;
+  // null: a new visit.
+  visit: Visit | null;
+  onClose: () => void;
+}) {
+  const actions = useVisitActions(baby.id, baby.family_id);
+  const visits = useVisits(baby.id);
+  const used = usePhotosUsage(baby.family_id);
+  const online = useOnline();
+  const formId = useId();
+  const [base, setBase] = useState<Base>(() => {
+    const now = new Date();
+    return {
+      id: visit?.id ?? null,
+      stored: visit,
+      raw: visitToRaw(visit, now),
+      at: visit?.visited_at ?? now.toISOString(),
+    };
+  });
+  const [raw, setRaw] = useState(base.raw);
+  const [pending, setPending] = useState<Pending[]>([]);
+  // The picked photos the last Lưu could not send.
+  const [failed, setFailed] = useState<string[]>([]);
+  const [error, setError] = useState<string | null>(null);
+  const [message, setMessage] = useState<string | null>(null);
+  const [inputKey, setInputKey] = useState(0);
+  const made = useRef<string[]>([]);
+  useEffect(() => {
+    const urls = made.current;
+    return () => urls.forEach((url) => URL.revokeObjectURL(url));
+  }, []);
+
+  // The visit as the server has it now: its photos change as they are
+  // deleted, and a new visit has some once its first save is done.
+  const current =
+    visits.data?.find((item) => item.id === base.id) ??
+    (visit && visit.id === base.id ? visit : null);
+  const saved = current?.photos ?? [];
+  const urls = usePhotoUrls(saved.map((photo) => photo.storage_path));
+  const viewer = { userId, isOwner };
+  const onError = (cause: unknown) => setMessage(toVietnameseError(cause));
+
+  const saving = actions.add.isPending || actions.update.isPending;
+  const busy =
+    saving || actions.remove.isPending || actions.removePhoto.isPending;
+
+  // Lưu and "Thử lại" both end here; neither may start a second save, nor
+  // one offline or without a time (the button is off then too).
+  function save() {
+    if (busy || !online || raw.at === "") return;
+    setMessage(null);
+    const built = buildVisit({
+      episode,
+      stored: base.stored,
+      opened: base.raw,
+      openedAt: base.at,
+      raw,
+      now: new Date(),
+    });
+    if (!built.ok) {
+      setError(built.error);
+      return;
+    }
+    setError(null);
+    const files = pending.map((item) => item.file);
+    // Spec §8.4: photos that did not go up stay in the sheet, which now
+    // edits the saved visit; the next Lưu only sends them.
+    const onSuccess = (result: VisitSaved) => {
+      if (result.failed.length === 0) {
+        onClose();
+        return;
+      }
+      setBase({
+        id: result.id,
+        stored: built.fields,
+        raw,
+        at: built.fields.visited_at,
+      });
+      const left = pending.filter((item) => result.failed.includes(item.file));
+      setPending(left);
+      setFailed(left.map((item) => item.key));
+    };
+    if (base.id === null)
+      actions.add.mutate(
+        { episodeId: episode.id, fields: built.fields, files },
+        { onSuccess, onError },
+      );
+    else if (built.patch === null && files.length === 0) onClose();
+    else
+      actions.update.mutate(
+        {
+          id: base.id,
+          patch: built.patch,
+          visitedAt: built.fields.visited_at,
+          files,
+        },
+        { onSuccess, onError },
+      );
+  }
+
+  function pick(file: File) {
+    const url = URL.createObjectURL(file);
+    made.current.push(url);
+    setPending((list) => [...list, { key: crypto.randomUUID(), file, url }]);
+    setInputKey((key) => key + 1);
+  }
+
+  // A photo not sent yet just leaves the sheet; a saved one is deleted now,
+  // without waiting for Lưu (§8.4).
+  function deletePhoto(key: string) {
+    const picked = pending.find((item) => item.key === key);
+    if (picked) {
+      URL.revokeObjectURL(picked.url);
+      setPending((list) => list.filter((item) => item.key !== key));
+      return;
+    }
+    const photo = saved.find((item) => item.id === key);
+    if (photo && window.confirm(DELETE_PHOTO))
+      actions.removePhoto.mutate(photo, { onError });
+  }
+
+  function remove() {
+    if (current && window.confirm(DELETE_VISIT))
+      actions.remove.mutate(current, { onSuccess: onClose, onError });
+  }
+
+  return (
+    <VisitSheetView
+      formId={formId}
+      raw={raw}
+      error={error}
+      message={message}
+      failed={pending.filter((item) => failed.includes(item.key)).length}
+      photos={[
+        ...saved.map((photo) => ({
+          key: photo.id,
+          src: urls.data?.[photo.storage_path],
+          deletable: photoDeletable(photo, viewer),
+          pending: false,
+        })),
+        ...pending.map((item) => ({
+          key: item.key,
+          src: item.url,
+          deletable: true,
+          pending: true,
+        })),
+      ]}
+      room={saved.length + pending.length < MAX_VISIT_PHOTOS}
+      full={usage(used.data ?? 0).level === "full"}
+      online={online}
+      saving={saving}
+      busy={busy}
+      deletion={current ? visitDelete(current, viewer) : "hidden"}
+      dirty={
+        pending.length > 0 ||
+        (Object.keys(raw) as (keyof VisitRaw)[]).some(
+          (key) => raw[key] !== base.raw[key],
+        )
+      }
+      inputKey={inputKey}
+      onRaw={setRaw}
+      onSubmit={(event) => {
+        event.preventDefault();
+        save();
+      }}
+      onRetry={save}
+      onPick={pick}
+      onDeletePhoto={deletePhoto}
+      onDelete={remove}
+      onClose={onClose}
+    />
+  );
+}
diff --git a/lib/data/errors.ts b/lib/data/errors.ts
index d03920f..3dc6f2a 100644
--- a/lib/data/errors.ts
+++ b/lib/data/errors.ts
@@ -21,6 +21,9 @@ export function toVietnameseError(e: unknown): string {
   if (typeof e === "object" && e !== null && "code" in e) {
     const code = (e as { code?: unknown }).code;
     if (code === "23505") return "Đã có người bắt đầu trước.";
+    // Spec 2026-11-26 §8: a visit whose episode is not on the server (yet,
+    // or any more); the outbox drops such a change with the same words.
+    if (code === "23503") return "Bản ghi liên quan không còn.";
     if (code === "42501") return PERMISSION;
   }
   if (e instanceof Error) return `Có lỗi xảy ra: ${e.message}`;
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  212 passed (212)`, `Tests  2034 passed (2034)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/illness/VisitSheet.tsx components/OnlineOnly.tsx lib/data/errors.ts components/illness/visitsheet.test.tsx lib/data/errors.test.ts
git commit -m "feat(illness): the doctor's visit sheet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Kiểm cuối M5c, spec, rồi đưa lên `main`

**Files:**

- Create rồi xóa (không commit): `app/fixture-visit-sheet/page.tsx`
- Modify: `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§8.4)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của Task 1.
- Produces: kết quả kiểm, ghi ngay trong plan; một đoạn đọc spec; `main` có M5c.

- [ ] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  212 passed (212)`, `Tests  2034 passed (2034)`.

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages using 9 workers (42/42)` và thoát mã 0.

- [ ] **Step 3: Tạo trang fixture tạm**

Sheet chưa có lối vào, nên chỉ thấy ở đây. Trang vẽ `VisitSheetView` với một trong bảy trạng thái, chọn bằng `?case=`: `moi` (thêm mới, trống), `sua` (sửa, 3 ảnh, một ảnh của người khác, "Xóa lần khám" tắt), `sau` (đủ 6 ảnh), `chua-tai` (2 ảnh đã lưu, 2 ảnh tải lỗi), `day` (kho đầy), `mat-mang` (mất mạng), `loi` (câu lỗi dưới "Lúc khám" và câu lỗi của server). Tạo `app/fixture-visit-sheet/page.tsx` (không commit):

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  type VisitPhotoTile,
  VisitSheetView,
} from "@/components/illness/VisitSheet";
import type { VisitRaw } from "@/lib/rules/visits";

// Dữ liệu giả, không đọc hay ghi gì của gia đình. Ảnh là hình vẽ tại chỗ.
const picture = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="78"><rect width="60" height="78" fill="hsl(${hue} 60% 80%)"/><path d="M10 20h40M10 32h40M10 44h28" stroke="hsl(${hue} 40% 40%)" stroke-width="3"/></svg>`,
  )}`;
const tiles = (count: number, over: Partial<VisitPhotoTile> = {}) =>
  Array.from({ length: count }, (_, i) => ({
    key: `p${i}`,
    src: picture(i * 50),
    deletable: true,
    pending: false,
    ...over,
  }));
const EMPTY: VisitRaw = {
  at: "2026-11-27T10:05",
  place: "",
  conclusion: "",
  advice: "",
};
const FULL: VisitRaw = {
  at: "2026-11-26T09:15",
  place: "Phòng khám Nhi Đồng 2, cơ sở Lý Tự Trọng, quận 1",
  conclusion: "Viêm họng cấp, theo dõi thêm viêm tai giữa bên phải",
  advice:
    "Uống nhiều nước, chia nhỏ cữ bú. Hạ sốt khi trên 38,5 độ, cách nhau ít nhất 4 tiếng.\nTái khám ngay nếu sốt cao không hạ, thở nhanh, bỏ bú.",
};
type Case = {
  raw: VisitRaw;
  photos: VisitPhotoTile[];
  deletion: "hidden" | "blocked" | "allowed";
  error?: string;
  message?: string;
  failed?: number;
  full?: boolean;
  online?: boolean;
};
const CASES: Record<string, Case> = {
  moi: { raw: EMPTY, photos: [], deletion: "hidden" },
  sua: {
    raw: FULL,
    photos: [...tiles(2), { ...tiles(3)[2], deletable: false }],
    deletion: "blocked",
  },
  sau: { raw: FULL, photos: tiles(6), deletion: "allowed" },
  "chua-tai": {
    raw: FULL,
    photos: [
      ...tiles(2),
      ...tiles(2, { pending: true }).map((t, i) => ({ ...t, key: `n${i}` })),
    ],
    deletion: "allowed",
    failed: 2,
  },
  day: { raw: FULL, photos: tiles(1), deletion: "allowed", full: true },
  "mat-mang": {
    raw: FULL,
    photos: [...tiles(1), { ...tiles(2, { pending: true })[1], key: "n1" }],
    deletion: "allowed",
    online: false,
  },
  loi: {
    raw: { ...EMPTY, at: "2026-11-20T08:00" },
    photos: [],
    deletion: "hidden",
    error: "Lúc khám nằm ngoài đợt ốm.",
    message: "Mất kết nối mạng, thử lại sau.",
  },
};

function Fixture() {
  const name = useSearchParams().get("case") ?? "moi";
  const item = CASES[name] ?? CASES.moi;
  const [raw, setRaw] = useState(item.raw);
  return (
    <main className="p-4">
      <p>Trang tạm: {name}</p>
      <VisitSheetView
        formId="fixture"
        raw={raw}
        error={item.error ?? null}
        message={item.message ?? null}
        failed={item.failed ?? 0}
        photos={item.photos}
        room={item.photos.length < 6}
        full={item.full ?? false}
        online={item.online ?? true}
        saving={false}
        busy={false}
        deletion={item.deletion}
        dirty={false}
        inputKey={0}
        onRaw={setRaw}
        onSubmit={(event) => event.preventDefault()}
        onRetry={() => {}}
        onPick={() => {}}
        onDeletePhoto={() => {}}
        onDelete={() => {}}
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

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở các trang dưới trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp. Thân sheet cuộn được: tìm phần tử cuộn bằng đoạn dưới rồi đặt `scrollTop`.

```js
const scroller = [...document.querySelectorAll("dialog *")].find(
  (el) =>
    el.scrollHeight > el.clientHeight + 5 &&
    getComputedStyle(el).overflowY !== "visible",
);
scroller.scrollTop = 9999;
```

1. `http://localhost:3000/fixture-visit-sheet?case=moi`, theme `rose`. Kỳ vọng: sheet "Lần khám" mở; dòng phụ một dòng; nhãn theo thứ tự "Lúc khám", "Nơi khám", "Bác sĩ kết luận", "Lời dặn", "Ảnh đơn thuốc, giấy khám"; ba ô cao 44 px, ô "Lời dặn" cao 94 px; ô "Thêm" 60×78; nút "Lưu" 317×56; không có "Xóa lần khám". Khi viết plan đúng như vậy.
2. `?case=sua`, theme `rose`, cuộn xuống cuối. Kỳ vọng: ba ô ảnh 60×78, hai ảnh có dấu × (vùng chạm 44×44), ảnh thứ ba (của người khác) không có; ô "Thêm" cạnh ảnh; "Xóa lần khám" mờ, dưới là "Còn ảnh do người khác thêm. Nhờ người đó hoặc chủ gia đình xóa trước." (2 dòng); dấu × của ảnh đầu không bị cắt ở mép trên. Đếm phần tử có `text-overflow: ellipsis` mà chữ dài hơn ô (không tính ô chọn ảnh ẩn `sr-only`): 0. `dialog.scrollWidth <= dialog.clientWidth`. Khi viết plan đúng như vậy (ảnh `m5-sheet-sua-375-rose.jpg` ở thư mục ghi chú của nhóm phiên).
3. `?case=chua-tai`, theme `night`. Kỳ vọng: đầu sheet có thẻ lỗi "Lần khám đã lưu, còn 2 ảnh chưa tải được." với nút "Thử lại"; cuộn xuống: bốn ảnh, hai ảnh sau có viền nét đứt thấy rõ ở `night`; ô "Thêm" xuống hàng dưới. Khi viết plan đúng như vậy.
4. `?case=sau`. Kỳ vọng: 6 ảnh trên 2 hàng; không có ô "Thêm" và không có ô chọn ảnh; "Xóa lần khám" bấm được.
5. `?case=day`. Kỳ vọng: 1 ảnh, không có ô "Thêm", dòng "Kho ảnh đã đầy. Xóa bớt ảnh ở trang Ảnh để thêm ảnh mới." (2 dòng).
6. `?case=mat-mang`, theme `rose`. Kỳ vọng: dòng nền vàng "Cần kết nối mạng để thay đổi các mục dưới đây." dưới dòng phụ; `button[type=submit]` và ô chọn ảnh `disabled`; dấu × của ảnh đã lưu `disabled`, của ảnh chưa gửi thì không; "Xóa lần khám" `disabled`.
7. `?case=loi`. Kỳ vọng: dòng đỏ "Lúc khám nằm ngoài đợt ốm." ngay dưới ô "Lúc khám"; câu "Mất kết nối mạng, thử lại sau." ngay trên "Lưu".
8. Lặp lại mục 2 với theme `light`, `dark`, `night` (`document.documentElement.dataset.theme = "…"`): chữ, ô và dấu × đọc rõ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

- [ ] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-visit-sheet
bun run typecheck
git status --short  # không còn app/fixture-visit-sheet
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts`: chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [ ] **Step 6: Các chỗ đọc spec (Patch 3), commit**

```diff
diff --git a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
index 8458583..c2d6e89 100644
--- a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
+++ b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
@@ -423,6 +423,7 @@ alter table public.photos add foreign key (visit_id, baby_id)
 - Nút xóa của một ảnh chỉ hiện với chủ gia đình hoặc người đã thêm ảnh đó. Bấm thì hỏi lại một lần "Xóa ảnh này?" rồi xóa ngay, không chờ "Lưu". Ảnh thêm vào khi đang sửa thì tải lên khi bấm "Lưu".
 - Kho ảnh đã đầy (§8.2): ẩn ô "Thêm", hiện dòng "Kho ảnh đã đầy. Xóa bớt ảnh ở trang Ảnh để thêm ảnh mới."
 - Có ảnh tải lỗi: sheet ở lại, chuyển sang sửa lần khám vừa lưu, hiện `ErrorCard` "Lần khám đã lưu, còn {k} ảnh chưa tải được." Các ảnh lỗi vẫn nằm trong phiếu; bấm "Lưu" lần nữa chỉ tải các ảnh đó.
+- Mất mạng: đầu sheet có dòng "Cần kết nối mạng để thay đổi các mục dưới đây." (câu sẵn có của các mục cần mạng) thay cho `NeedsNetwork`, vốn nói chuyện tải trang; "Lưu", ô "Thêm", nút xóa của ảnh đã lưu và "Xóa lần khám" tắt; các ô chữ vẫn gõ được, ảnh chưa gửi vẫn bỏ ra được. "Lưu" cũng tắt khi ô "Lúc khám" bị xóa trống (không thêm câu nào). Mỗi lần bấm "Thêm" chọn một ảnh. Ảnh chưa gửi bỏ ra không hỏi lại (chưa gửi lên đâu cả); nút xóa của ảnh có nhãn đọc màn hình "Xóa ảnh". Trong lúc đang lưu, thẻ lỗi ẩn đi, để "Thử lại" không gửi lần thứ hai. Ảnh chưa gửi (vừa chọn, hay tải lỗi) có viền nét đứt, để biết ảnh nào còn chờ; viền khác bằng hình dạng nên đọc được cả ở theme `night`. Dòng "Kho ảnh đã đầy. …" chỉ hiện khi còn chỗ cho ảnh (chưa đủ 6). Lưu xong sheet đóng, không có toast; sửa mà không đổi gì thì "Lưu" chỉ đóng sheet. Thêm lần khám cho một đợt đã đóng: "Lúc khám" vẫn mặc định là lúc này, nằm ngoài đợt, nên phải chọn lại giờ trước khi lưu. Lần khám của một đợt chưa lên server (vừa bắt đầu, outbox chưa gửi) hay vừa bị xóa ở máy khác bị server từ chối; sheet báo câu sẵn có của outbox "Bản ghi liên quan không còn.". (Khác bản đã duyệt ngày 2026-11-26, vốn không nói mấy chỗ này. Chọn ở M5c ngày 2026-11-27 theo lời duyệt trước của người dùng; viền nét đứt thêm sau bước nhìn thử lúc viết plan M5.)
 - Nút "Lưu". Khi sửa có thêm "Xóa lần khám" (chủ gia đình hoặc người tạo lần khám), hỏi lại một lần: "Xóa lần khám này và các ảnh của nó?" Lần khám còn ảnh mà người đang dùng không xóa được (không phải chủ gia đình, không phải người thêm ảnh) thì nút tắt, kèm dòng "Còn ảnh do người khác thêm. Nhờ người đó hoặc chủ gia đình xóa trước."
 
 ## 9. Báo cáo cho bác sĩ
```

```bash
git add docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
git commit -m "docs: readings of §8.4 in the spec (M5c)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của Task 1 có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này là untracked (??), hoặc đã được commit lúc duyệt thì là M; các file plan khác chưa chạy: không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5c.md
git commit -m "docs(plan): the M5c plan and its check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m5c
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; các mục của bước trình duyệt (chỉ trên trang tạm); lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
