# Kim Bun — Đợt ốm M5b: dữ liệu và luật của lần khám Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§8.2; phần luật của §8.3, §8.4 và của dòng "Từ M5" ở §6.4; các mục "thẻ và sheet lần khám" của §10.1 phần luật và dữ liệu)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** App đọc, thêm, sửa, xóa được lần khám và ảnh đơn thuốc trên server, có đủ luật thuần cho sheet và thẻ "Lần khám"; trang Ảnh không còn đọc ảnh của lần khám. Chưa có gì mới trên màn hình.

**Architecture:**

- **Ảnh:** phần tải lên và phần xóa của `usePhotoActions` (`lib/data/photos.ts`) tách thành hai hàm `uploadPhoto` (nhận thêm `visitId`) và `deletePhoto`, để lần khám dùng đúng đường của trang Ảnh. `usePhotos` thêm lọc `visit_id is null`.
- **Lần khám:** `lib/data/illness.ts` thêm `useVisits` (mỗi lần khám kèm các ảnh của nó) và `useVisitActions` (`add`, `update`, `removePhoto`, `remove`), ghi thẳng lên server như trang Ảnh, không qua outbox.
- **Luật:** file mới `lib/rules/visits.ts`: giá trị của sheet, kiểm "Lúc khám", dòng ngày giờ của thẻ, ai được xóa ảnh và lần khám, lý do tắt "Xóa đợt ốm".
- Không thêm gói, không thêm token màu, không thêm icon, không có migration (dùng migration của M5a).

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, TanStack Query, Supabase JS, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m5b`, cắt từ `main` sau khi M5a đã lên (migration `20261126000300_illness_visits.sql` đã áp lên Supabase thật). Baseline: 1981 test (208 file) vitest xanh, typecheck sạch.

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

1. **`useVisits(babyId, enabled = true)` trả mỗi lần khám kèm các ảnh của nó** (`Visit` = `VisitRow & { photos: PhotoRow[] }`), cũ trước; ảnh của một lần khám cũ trước. Một hàm đọc hai bảng cùng lúc (lần khám, và mọi ảnh có `visit_id` của bé). Khóa `["illness-visits", babyId]`, `staleTime` 60 giây; không có `refetchInterval` (spec không nói; máy khác thấy lần khám mới khi mở lại trang sau 60 giây). Không đọc từng trang: mỗi bé chỉ vài lần khám, mỗi lần tối đa 6 ảnh, xa dưới 1000 hàng của một lần đọc. `enabled` để Báo cáo không tải lần khám ở kỳ 7, 14 ngày (M5e). Cache được giữ trên máy như mọi query, nên lần khám đã xem một lần vẫn hiện khi mất mạng.
2. **`useVisitActions(babyId, familyId)`** có `add`, `update`, `remove` (spec) và thêm `removePhoto` (xóa một ảnh đã lưu ngay trong sheet, §8.4). `add` tự tạo mã bằng `crypto.randomUUID()`; `add` và `update` trả `{ id, failed }`: mã lần khám và các ảnh chưa tải được, để sheet (M5c) chuyển sang sửa lần khám vừa lưu. `update` với `patch` null chỉ tải ảnh. Sửa một lần khám đã bị xóa ở máy khác (0 hàng) báo câu chung "Bạn không có quyền thực hiện thao tác này", như trang Ảnh. Mọi thao tác xong thì tải lại danh sách lần khám và dung lượng ảnh.
3. **`uploadPhoto`, `deletePhoto` tách ra từ `usePhotoActions`**, trang Ảnh không đổi gì (vẫn object trước, hàng sau; hàng bị từ chối thì xóa object lại). Ảnh của lần khám có `visit_id`, `taken_on` = ngày giờ Việt Nam của `visited_at`, `caption` null (§8.2).
4. **Lọc `visit_id is null` của `usePhotos`** cũng áp cho ô chọn ảnh của mốc phát triển, vì nó dùng chung `usePhotos` (§8.2 nêu cả hai). Dung lượng (`photos_total_bytes`) vẫn tính cả ảnh đơn thuốc.
5. **"Lúc khám" (§8.4) có một câu lỗi cho cả hai luật:** giờ sau lúc này quá 1 phút cũng nằm ngoài đợt (đợt đang mở chỉ tới lúc này), nên cả hai báo "Lúc khám nằm ngoài đợt ốm.". Hai đầu của đợt tính vào đợt. Đợt đang mở tới lúc này cộng 1 phút; đợt đã đóng tới `ended_at`. Ô để nguyên như lúc mở sheet thì giữ giờ đã có tới từng giây (ô chỉ có phút), như sheet "Sửa đợt ốm". Ô bị xóa trống cũng nhận câu đó, nhưng sheet (M5c) tắt "Lưu" khi ô trống nên câu này không hiện vì ô trống. Một lần khám đã nằm ngoài đợt vì đợt bị sửa giờ (§8.1: lần khám thuộc đợt theo `episode_id`) cũng bị từ chối khi lưu, kể cả khi chỉ sửa ô khác: phải chọn lại "Lúc khám". Đó là đúng chữ §8.4, không phải lỗi.
6. **Chữ được cắt khoảng trắng hai đầu; ô trống lưu `null`** (§8.4). Độ dài tối đa do ô nhập giữ (`maxLength`, M5c), luật không có câu riêng; server vẫn từ chối chữ quá dài.
7. **`patch` null khi sửa mà không đổi gì**, so với giá trị đã lưu: sheet chỉ tải ảnh mới, hoặc đóng.
8. **Ai được xóa:** một ảnh: chủ gia đình hoặc người đã thêm ảnh (policy của `photos`). "Xóa lần khám": ẩn với người không phải chủ gia đình và không phải người tạo lần khám; tắt khi còn ảnh mà người đó không xóa được (§8.4).
9. **Lý do tắt "Xóa đợt ốm"** (§6.4 từ M5): danh sách lần khám chưa có dữ liệu (đang tải, lỗi, hay mất mạng chưa từng tải; spec chỉ nêu trường hợp mất mạng, nút tắt là cách an toàn cho cả ba) thì "Cần mạng để kiểm các lần khám."; đợt còn lần khám thì "Xóa các lần khám trước.". Plan M5d mới vẽ nó.
10. **Kiểu `VisitFields`** (giá trị sheet ghi) đặt ở `lib/data/illness.ts`; `lib/rules/visits.ts` chỉ nhập kiểu từ đó (`import type`), không nhập code.
11. **Bước trình duyệt chỉ có trang Ảnh thật**, chỉ xem: lệnh đọc `photos` nay mang thêm `visit_id=is.null`; nó trả 200 thì cột mới đã có trên Supabase thật. Plan này không có trang tạm.

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
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 5 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `864a3ea` cộng 18 patch của M4a, M4b, M4c và 2 patch của M5a trích từ các file plan đó (nền tạm trong lúc M4 chưa lên `main`). Trong bản chạy thử mỗi task code là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Patch 5 (spec) được sinh trên spec đã có các đoạn của M4. `bun run build` đã chạy xanh trên bản sao.
- **Đo lại trên `main` thật.** Sau khi M4c lên, `main` @ `88caf0b` (cây code trùng khít nền tạm ở trên, chỉ khác các file plan) được chép ra một bản sao sạch; mọi patch của M5 trích từ chính các file plan được áp lần lượt lên đó và đo lại: đỏ và xanh của Task 1 (19 đỏ → 210/2000) và Task 2 (1 file không nạp → 211/2015) đúng như ghi; `tsc` sạch; build 42/42. Cây cuối trùng bản chạy thử.
- **Trình duyệt.** Dùng khung Browser trong app, cỡ 375×812 (`resize_window` preset `mobile`); người dùng đã chọn sẵn ngày 2026-11-26, không hỏi lại. Gọi `navigate` trước. Chỉ khi bộ kiểm quyền của app từ chối khung Browser thì hỏi người dùng đúng một câu rồi làm tiếp. Trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập trong khung đó. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại `resize_window` và đọc `innerWidth` trước mỗi lần đo. Không đọc cả console: lọc bằng `onlyErrors` và `limit` nhỏ.
- **pgTAP.** Plan này không đổi DB nên không chạy pgTAP.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm màu, token hay icon. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Tải ảnh lên", không xóa ảnh, không bấm "Lưu" ở đâu cả.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Các file plan chưa chạy chưa được commit.** `git status` có thể thấy các file plan khác là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Opus 5.5`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng sau M5a. M5c (sheet), M5d (thẻ, luật tắt "Xóa đợt ốm") và M5e (Báo cáo, biểu đồ) dùng mọi thứ dưới mục Produces.

**Consumes (M5a):** bảng `illness_visits`, cột `photos.visit_id` (đã áp lên Supabase thật); `VisitRow`, `PhotoRow.visit_id` (`lib/supabase/rows.ts`).

**Consumes (M2):** `type EpisodeLike` (`lib/rules/illness.ts`); `lib/data/illness.ts` với `useEpisodes`, `useEpisodeActions`; `lib/data/illness.test.ts` (không đổi).

**Consumes (đã ở `main` từ trước):** `usePhotos`, `usePhotoActions`, `usePhotosUsage`, `usePhotoUrls` (`lib/data/photos.ts`); `compressPhoto`; `photoPath`; `PermissionDeniedError`; `supabase`; `formatDayShort`, `formatVnTime`, `fromVnLocalInput`, `toVnLocalInput`, `vnDateString`.

**Produces:**

- `lib/data/photos.ts`: `uploadPhoto(input: { babyId: string; familyId: string; file: File; takenOn: string; caption: string | null; visitId?: string | null }): Promise<void>`; `deletePhoto(photo: PhotoRow): Promise<void>`; `usePhotos` chỉ đọc ảnh có `visit_id` null.
- `lib/data/illness.ts`: `type Visit = VisitRow & { photos: PhotoRow[] }`; `type VisitFields = { visited_at: string; place: string | null; conclusion: string | null; advice: string | null }`; `type VisitSaved = { id: string; failed: File[] }`; `visitsKey(babyId: string)` = `["illness-visits", babyId]`; `fetchVisits(babyId: string): Promise<Visit[]>`; `useVisits(babyId: string, enabled = true)` (kết quả `useQuery`, `data: Visit[]`, cũ trước); `useVisitActions(babyId: string, familyId: string)` = `{ add, update, removePhoto, remove }` (kết quả `useMutation`: `add` nhận `{ episodeId: string; fields: VisitFields; files: File[] }` và trả `VisitSaved`; `update` nhận `{ id: string; patch: VisitFields | null; visitedAt: string; files: File[] }` và trả `VisitSaved`; `removePhoto` nhận `PhotoRow`; `remove` nhận `Visit`).
- `lib/rules/visits.ts`: `MAX_VISIT_PHOTOS` = 6; `type VisitRaw = { at: string; place: string; conclusion: string; advice: string }`; `visitToRaw(visit: { visited_at; place; conclusion; advice } | null, now: Date): VisitRaw`; `buildVisit(input: { episode: EpisodeLike; stored: { visited_at; place; conclusion; advice } | null; opened: VisitRaw; openedAt: string; raw: VisitRaw; now: Date }): { ok: true; fields: VisitFields; patch: VisitFields | null } | { ok: false; error: string }`; `visitsOf(visits: Visit[], episodeId: string): Visit[]`; `visitHeading(visit): string`; `type Viewer = { userId: string; isOwner: boolean }`; `photoDeletable(photo: { created_by }, viewer: Viewer): boolean`; `visitDelete(visit: { created_by; photos }, viewer: Viewer): "hidden" | "blocked" | "allowed"`; `episodeDeleteBlock(visits: { episode_id }[] | undefined, episodeId: string): string | null`.
- Chữ đúng của spec: "Lúc khám nằm ngoài đợt ốm.", "Xóa các lần khám trước.", "Cần mạng để kiểm các lần khám.".
- **Vitest sau M5b:** 2015 test, 211 file.

---

### Task 1: Đọc và ghi lần khám, ảnh đơn thuốc (§8.2)

**Files:**

- Modify: `lib/data/photos.ts` (`uploadPhoto`, `deletePhoto`; lọc `visit_id is null`)
- Modify: `lib/data/illness.ts` (`useVisits`, `useVisitActions`)
- Test: `lib/data/photos.test.ts` (mới), `lib/data/illnessVisits.test.ts` (mới)

**Interfaces:**

- Consumes: `VisitRow`, `PhotoRow` (M5a); `compressPhoto`, `photoPath`, `PermissionDeniedError`, `supabase`, `vnDateString`.
- Produces: `uploadPhoto`, `deletePhoto`; `Visit`, `VisitFields`, `VisitSaved`, `visitsKey`, `fetchVisits`, `useVisits`, `useVisitActions` (chữ ký ở Contracts).

- [ ] **Step 0: Kiểm M5a đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
git log --oneline -20 main | grep "the M5a plan and its check results"
grep -c '"illness_visits"' lib/supabase/types.ts
git checkout -b feat/kim-bun-dot-om-m5b
bunx vitest run
```

Expected: lệnh `grep` đầu in đúng một dòng (M5a đã lên `main`, nghĩa là migration đã áp; không thấy thì dừng và báo người dùng); lệnh thứ hai in `1`; `Test Files  208 passed (208)`, `Tests  1981 passed (1981)`. `main` có thêm commit khác thì ghi lại số xuất phát thật; mọi con số sau lệch đúng bằng số test mới.

- [ ] **Step 1: Viết test đỏ (Patch 1)**

Hai file test mới. `photos.test.ts`: `usePhotos` gửi `visit_id is null`; `uploadPhoto` lưu object rồi hàng mang `visit_id`, xóa object lại khi hàng bị từ chối; `deletePhoto` xóa object trước, hàng sau. `illnessVisits.test.ts`: `fetchVisits` gom ảnh theo lần khám; `useVisits` có `enabled`; `add`, `update`, `remove`, `removePhoto` theo đúng thứ tự của §8.2.

```diff
diff --git a/lib/data/illnessVisits.test.ts b/lib/data/illnessVisits.test.ts
new file mode 100644
index 0000000..a614858
--- /dev/null
+++ b/lib/data/illnessVisits.test.ts
@@ -0,0 +1,313 @@
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { PhotoRow, VisitRow } from "@/lib/supabase/rows";
+import {
+  fetchVisits,
+  type Visit,
+  type VisitFields,
+  useVisitActions,
+  useVisits,
+} from "./illness";
+
+type Result = { data: unknown; error: unknown };
+
+const db = vi.hoisted(() => ({
+  calls: [] as unknown[][],
+  results: {} as Record<string, Result[]>,
+}));
+const queryClient = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
+const uploadPhoto = vi.hoisted(() => vi.fn(async (_input: unknown) => {}));
+const deletePhoto = vi.hoisted(() => vi.fn(async (_photo: unknown) => {}));
+
+vi.mock("@/lib/supabase/client", () => ({
+  supabase: () => ({
+    from: (table: string) => {
+      const chain: Record<string, unknown> = {};
+      for (const name of [
+        "select",
+        "eq",
+        "not",
+        "order",
+        "insert",
+        "update",
+        "delete",
+      ])
+        chain[name] = (...args: unknown[]) => {
+          db.calls.push([table, name, ...args]);
+          return chain;
+        };
+      chain.then = (resolve: (value: Result) => void) =>
+        resolve(db.results[table]?.shift() ?? { data: [], error: null });
+      return chain;
+    },
+  }),
+}));
+vi.mock("@tanstack/react-query", () => ({
+  useQuery: (options: unknown) => options,
+  useMutation: (options: unknown) => options,
+  useQueryClient: () => queryClient,
+}));
+vi.mock("./outbox", () => ({
+  enqueueEpisodeChange: vi.fn(),
+  withPendingEpisodes: vi.fn(),
+  episodesKey: (babyId: string) => ["illness-episodes", babyId],
+}));
+vi.mock("./photos", () => ({ uploadPhoto, deletePhoto }));
+
+const visit = (id: string, visitedAt: string) =>
+  ({ id, baby_id: "b1", episode_id: "e1", visited_at: visitedAt }) as VisitRow;
+const photo = (id: string, visitId: string) =>
+  ({ id, visit_id: visitId, storage_path: `f1/b1/${id}.jpg` }) as PhotoRow;
+const FIELDS: VisitFields = {
+  visited_at: "2026-11-25T02:30:00.000Z",
+  place: "Phòng khám Nhi",
+  conclusion: null,
+  advice: null,
+};
+const UUID = /^[0-9a-f-]{36}$/;
+
+beforeEach(() => {
+  db.calls = [];
+  db.results = {};
+  uploadPhoto.mockReset();
+  uploadPhoto.mockImplementation(async () => {});
+  deletePhoto.mockReset();
+  deletePhoto.mockImplementation(async () => {});
+  queryClient.invalidateQueries.mockClear();
+});
+
+// Spec 2026-11-26 §8.2.
+describe("fetchVisits", () => {
+  it("reads every visit of the baby, oldest first, each with its photos", async () => {
+    db.results = {
+      illness_visits: [
+        {
+          data: [
+            visit("v1", "2026-11-24T02:00:00Z"),
+            visit("v2", "2026-11-25T02:00:00Z"),
+          ],
+          error: null,
+        },
+      ],
+      photos: [{ data: [photo("p1", "v2"), photo("p2", "v2")], error: null }],
+    };
+    const visits = await fetchVisits("b1");
+    expect(visits.map((v) => [v.id, v.photos.map((p) => p.id)])).toEqual([
+      ["v1", []],
+      ["v2", ["p1", "p2"]],
+    ]);
+    expect(db.calls).toEqual([
+      ["illness_visits", "select", "*"],
+      ["illness_visits", "eq", "baby_id", "b1"],
+      ["illness_visits", "order", "visited_at"],
+      ["illness_visits", "order", "id"],
+      ["photos", "select", "*"],
+      ["photos", "eq", "baby_id", "b1"],
+      ["photos", "not", "visit_id", "is", null],
+      ["photos", "order", "created_at"],
+      ["photos", "order", "id"],
+    ]);
+  });
+
+  it("throws the server's error", async () => {
+    const error = { code: "42501", message: "denied" };
+    db.results = { photos: [{ data: null, error }] };
+    await expect(fetchVisits("b1")).rejects.toBe(error);
+  });
+});
+
+describe("useVisits", () => {
+  it("is fresh for a minute and can wait", async () => {
+    const options = useVisits("b1", false) as unknown as {
+      queryKey: unknown[];
+      staleTime: number;
+      enabled: boolean;
+    };
+    expect(options.queryKey).toEqual(["illness-visits", "b1"]);
+    expect(options.staleTime).toBe(60_000);
+    expect(options.enabled).toBe(false);
+    expect((useVisits("b1") as unknown as { enabled: boolean }).enabled).toBe(
+      true,
+    );
+  });
+});
+
+type Mutation<T, R = unknown> = {
+  mutationFn: (value: T) => Promise<R>;
+  onSettled: () => Promise<void>;
+};
+type Saved = { id: string; failed: File[] };
+const actions = () =>
+  useVisitActions("b1", "f1") as unknown as {
+    add: Mutation<
+      { episodeId: string; fields: VisitFields; files: File[] },
+      Saved
+    >;
+    update: Mutation<
+      {
+        id: string;
+        patch: VisitFields | null;
+        visitedAt: string;
+        files: File[];
+      },
+      Saved
+    >;
+    removePhoto: Mutation<PhotoRow>;
+    remove: Mutation<Visit>;
+  };
+const fileA = { name: "a.jpg" } as File;
+const fileB = { name: "b.jpg" } as File;
+
+describe("useVisitActions", () => {
+  it("add saves the row under a new id, then each photo with the day of the visit", async () => {
+    const saved = await actions().add.mutationFn({
+      episodeId: "e1",
+      fields: FIELDS,
+      files: [fileA, fileB],
+    });
+    expect(saved.id).toMatch(UUID);
+    expect(saved.failed).toEqual([]);
+    expect(db.calls).toEqual([
+      [
+        "illness_visits",
+        "insert",
+        { id: saved.id, episode_id: "e1", baby_id: "b1", ...FIELDS },
+      ],
+    ]);
+    // 02:30 UTC is 09:30 in Vietnam, the same day.
+    expect(uploadPhoto.mock.calls.map(([input]) => input)).toEqual([
+      {
+        babyId: "b1",
+        familyId: "f1",
+        file: fileA,
+        takenOn: "2026-11-25",
+        caption: null,
+        visitId: saved.id,
+      },
+      {
+        babyId: "b1",
+        familyId: "f1",
+        file: fileB,
+        takenOn: "2026-11-25",
+        caption: null,
+        visitId: saved.id,
+      },
+    ]);
+  });
+
+  it("a photo that fails is skipped; the ones after it still go up", async () => {
+    uploadPhoto.mockImplementationOnce(async () => {
+      throw new Error("boom");
+    });
+    const saved = await actions().add.mutationFn({
+      episodeId: "e1",
+      fields: FIELDS,
+      files: [fileA, fileB],
+    });
+    expect(saved.failed).toEqual([fileA]);
+    expect(uploadPhoto).toHaveBeenCalledTimes(2);
+  });
+
+  it("a refused row uploads nothing", async () => {
+    const error = { code: "23503", message: "fk" };
+    db.results = { illness_visits: [{ data: null, error }] };
+    await expect(
+      actions().add.mutationFn({
+        episodeId: "e1",
+        fields: FIELDS,
+        files: [fileA],
+      }),
+    ).rejects.toBe(error);
+    expect(uploadPhoto).not.toHaveBeenCalled();
+  });
+
+  it("update writes the changed row, then uploads the photos", async () => {
+    db.results = { illness_visits: [{ data: [{ id: "v1" }], error: null }] };
+    const saved = await actions().update.mutationFn({
+      id: "v1",
+      patch: FIELDS,
+      visitedAt: FIELDS.visited_at,
+      files: [fileA],
+    });
+    expect(saved).toEqual({ id: "v1", failed: [] });
+    expect(db.calls).toEqual([
+      ["illness_visits", "update", FIELDS],
+      ["illness_visits", "eq", "id", "v1"],
+      ["illness_visits", "select", "id"],
+    ]);
+    expect(uploadPhoto).toHaveBeenCalledWith(
+      expect.objectContaining({ visitId: "v1", takenOn: "2026-11-25" }),
+    );
+  });
+
+  it("update with nothing changed only uploads the photos", async () => {
+    await actions().update.mutationFn({
+      id: "v1",
+      patch: null,
+      visitedAt: FIELDS.visited_at,
+      files: [fileA],
+    });
+    expect(db.calls).toEqual([]);
+    expect(uploadPhoto).toHaveBeenCalledTimes(1);
+  });
+
+  it("update of a visit that is gone is refused", async () => {
+    db.results = { illness_visits: [{ data: [], error: null }] };
+    await expect(
+      actions().update.mutationFn({
+        id: "v1",
+        patch: FIELDS,
+        visitedAt: FIELDS.visited_at,
+        files: [],
+      }),
+    ).rejects.toThrow("permission_denied");
+  });
+
+  it("remove deletes each photo, then the row", async () => {
+    db.results = { illness_visits: [{ data: [{ id: "v1" }], error: null }] };
+    const p1 = photo("p1", "v1");
+    const p2 = photo("p2", "v1");
+    await actions().remove.mutationFn({
+      ...visit("v1", FIELDS.visited_at),
+      photos: [p1, p2],
+    });
+    expect(deletePhoto.mock.calls).toEqual([[p1], [p2]]);
+    expect(db.calls).toEqual([
+      ["illness_visits", "delete"],
+      ["illness_visits", "eq", "id", "v1"],
+      ["illness_visits", "select", "id"],
+    ]);
+  });
+
+  it("remove stops at the first step that fails and keeps the rest", async () => {
+    const error = new Error("boom");
+    deletePhoto.mockImplementationOnce(async () => {
+      throw error;
+    });
+    await expect(
+      actions().remove.mutationFn({
+        ...visit("v1", FIELDS.visited_at),
+        photos: [photo("p1", "v1"), photo("p2", "v1")],
+      }),
+    ).rejects.toBe(error);
+    expect(deletePhoto).toHaveBeenCalledTimes(1);
+    expect(db.calls).toEqual([]);
+  });
+
+  it("removePhoto is the delete of the Photos page", async () => {
+    const p1 = photo("p1", "v1");
+    await actions().removePhoto.mutationFn(p1);
+    expect(deletePhoto).toHaveBeenCalledWith(p1);
+  });
+
+  it("every action reloads the visits and the space used", async () => {
+    const all = actions();
+    for (const action of [all.add, all.update, all.removePhoto, all.remove]) {
+      queryClient.invalidateQueries.mockClear();
+      await action.onSettled();
+      expect(queryClient.invalidateQueries.mock.calls).toEqual([
+        [{ queryKey: ["illness-visits", "b1"] }],
+        [{ queryKey: ["photos-usage", "f1"] }],
+      ]);
+    }
+  });
+});
diff --git a/lib/data/photos.test.ts b/lib/data/photos.test.ts
new file mode 100644
index 0000000..6745c09
--- /dev/null
+++ b/lib/data/photos.test.ts
@@ -0,0 +1,161 @@
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import type { PhotoRow } from "@/lib/supabase/rows";
+import { deletePhoto, uploadPhoto, usePhotos } from "./photos";
+
+type Result = { data: unknown; error: unknown };
+
+const db = vi.hoisted(() => ({
+  calls: [] as unknown[][],
+  results: [] as Result[],
+}));
+const nextResult = (): Result =>
+  db.results.shift() ?? { data: [], error: null };
+
+vi.mock("@/lib/supabase/client", () => ({
+  supabase: () => ({
+    from: (table: string) => {
+      const chain: Record<string, unknown> = {};
+      for (const name of [
+        "select",
+        "eq",
+        "is",
+        "order",
+        "range",
+        "insert",
+        "delete",
+      ])
+        chain[name] = (...args: unknown[]) => {
+          db.calls.push([table, name, ...args]);
+          return chain;
+        };
+      chain.then = (resolve: (value: Result) => void) => resolve(nextResult());
+      return chain;
+    },
+    storage: {
+      from: (bucket: string) => ({
+        upload: async (...args: unknown[]) => {
+          db.calls.push([bucket, "upload", ...args]);
+          return nextResult();
+        },
+        remove: async (...args: unknown[]) => {
+          db.calls.push([bucket, "remove", ...args]);
+          return nextResult();
+        },
+      }),
+    },
+  }),
+}));
+vi.mock("@/lib/photoCompress", () => ({
+  compressPhoto: async () => ({ size: 1234 }) as Blob,
+}));
+// The hooks are called outside React here: each returns the options it was given.
+vi.mock("@tanstack/react-query", () => ({
+  keepPreviousData: "keep",
+  useQuery: (options: unknown) => options,
+  useMutation: (options: unknown) => options,
+  useQueryClient: () => ({}),
+}));
+
+const UUID = /^[0-9a-f-]{36}$/;
+
+beforeEach(() => {
+  db.calls = [];
+  db.results = [];
+});
+
+// Spec 2026-11-26 §8.2: the photos of a visit stay off the Photos page.
+describe("usePhotos", () => {
+  it("reads only the photos that belong to no visit", async () => {
+    const options = usePhotos("b1") as unknown as {
+      queryFn: () => Promise<unknown>;
+    };
+    await options.queryFn();
+    expect(db.calls).toContainEqual(["photos", "is", "visit_id", null]);
+  });
+});
+
+describe("uploadPhoto", () => {
+  it("stores the object, then a row that points at the visit", async () => {
+    await uploadPhoto({
+      babyId: "b1",
+      familyId: "f1",
+      file: {} as File,
+      takenOn: "2026-11-25",
+      caption: null,
+      visitId: "v1",
+    });
+    const [upload, insert] = db.calls;
+    expect(upload[0]).toBe("photos");
+    expect(upload[1]).toBe("upload");
+    expect(upload[2]).toMatch(/^f1\/b1\/[0-9a-f-]{36}\.jpg$/);
+    expect(insert[0]).toBe("photos");
+    expect(insert[1]).toBe("insert");
+    const row = insert[2] as Record<string, unknown>;
+    expect(row).toMatchObject({
+      baby_id: "b1",
+      taken_on: "2026-11-25",
+      caption: null,
+      size_bytes: 1234,
+      visit_id: "v1",
+    });
+    expect(row.id).toMatch(UUID);
+    expect(row.storage_path).toBe(upload[2]);
+  });
+
+  it("a photo of the Photos page has no visit", async () => {
+    await uploadPhoto({
+      babyId: "b1",
+      familyId: "f1",
+      file: {} as File,
+      takenOn: "2026-11-25",
+      caption: "Tắm",
+    });
+    expect(db.calls[1][2]).toMatchObject({ caption: "Tắm", visit_id: null });
+  });
+
+  it("removes the object again when the row is refused", async () => {
+    const error = { code: "42501", message: "denied" };
+    db.results = [
+      { data: null, error: null },
+      { data: null, error },
+    ];
+    await expect(
+      uploadPhoto({
+        babyId: "b1",
+        familyId: "f1",
+        file: {} as File,
+        takenOn: "2026-11-25",
+        caption: null,
+        visitId: "v1",
+      }),
+    ).rejects.toBe(error);
+    expect(db.calls[2][1]).toBe("remove");
+    expect(db.calls[2][2]).toEqual([db.calls[0][2]]);
+  });
+});
+
+describe("deletePhoto", () => {
+  const photo = { id: "p1", storage_path: "f1/b1/p1.jpg" } as PhotoRow;
+
+  it("removes the object first, then the row", async () => {
+    db.results = [
+      { data: [], error: null },
+      { data: [{ id: "p1" }], error: null },
+    ];
+    await deletePhoto(photo);
+    expect(db.calls).toEqual([
+      ["photos", "remove", ["f1/b1/p1.jpg"]],
+      ["photos", "delete"],
+      ["photos", "eq", "id", "p1"],
+      ["photos", "select", "id"],
+    ]);
+  });
+
+  it("no row deleted means not allowed", async () => {
+    db.results = [
+      { data: [], error: null },
+      { data: [], error: null },
+    ];
+    await expect(deletePhoto(photo)).rejects.toThrow("permission_denied");
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  2 failed | 208 passed (210)`, `Tests  19 failed | 1981 passed (2000)`. Mười chín test đỏ đều thuộc hai file mới (`uploadPhoto is not a function`, `fetchVisits is not a function`, …).

- [ ] **Step 3: Viết `uploadPhoto`, `deletePhoto`, `useVisits`, `useVisitActions` (Patch 2)**

```diff
diff --git a/lib/data/illness.ts b/lib/data/illness.ts
index 5d9f7f7..2f0ebce 100644
--- a/lib/data/illness.ts
+++ b/lib/data/illness.ts
@@ -1,13 +1,16 @@
 "use client";
 
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
+import { vnDateString } from "@/lib/rules/time";
 import { supabase } from "@/lib/supabase/client";
-import type { EpisodeRow } from "@/lib/supabase/rows";
+import type { EpisodeRow, PhotoRow, VisitRow } from "@/lib/supabase/rows";
+import { PermissionDeniedError } from "./errors";
 import {
   enqueueEpisodeChange,
   episodesKey,
   withPendingEpisodes,
 } from "./outbox";
+import { deletePhoto, uploadPhoto } from "./photos";
 
 export type EpisodePatch = { started_at?: string; ended_at?: string | null };
 
@@ -80,3 +83,162 @@ export function useEpisodeActions(babyId: string, userId: string) {
     }),
   };
 }
+
+// Spec 2026-11-26 §8: a doctor's visit with the photos of its prescription.
+export type Visit = VisitRow & { photos: PhotoRow[] };
+// The columns of a visit the sheet writes; an empty field is null.
+export type VisitFields = {
+  visited_at: string;
+  place: string | null;
+  conclusion: string | null;
+  advice: string | null;
+};
+// What a save did: the visit's id, and the photos that did not go up.
+export type VisitSaved = { id: string; failed: File[] };
+
+export const visitsKey = (babyId: string) =>
+  ["illness-visits", babyId] as const;
+
+// Every visit of the baby, oldest first, each with its photos (oldest
+// first). A family has a handful of visits and at most six photos each, far
+// under the 1000 rows the server returns at once.
+export async function fetchVisits(babyId: string): Promise<Visit[]> {
+  const [visits, photos] = await Promise.all([
+    supabase()
+      .from("illness_visits")
+      .select("*")
+      .eq("baby_id", babyId)
+      .order("visited_at")
+      .order("id"),
+    supabase()
+      .from("photos")
+      .select("*")
+      .eq("baby_id", babyId)
+      .not("visit_id", "is", null)
+      .order("created_at")
+      .order("id"),
+  ]);
+  if (visits.error) throw visits.error;
+  if (photos.error) throw photos.error;
+  return visits.data.map((visit) => ({
+    ...visit,
+    photos: photos.data.filter((photo) => photo.visit_id === visit.id),
+  }));
+}
+
+// Spec §8.2: read from the server. The cache is kept on the phone like every
+// query, so a visit seen once still shows offline. `enabled` false loads
+// nothing (the report away from the "Đợt ốm" period).
+export function useVisits(babyId: string, enabled = true) {
+  return useQuery({
+    queryKey: visitsKey(babyId),
+    queryFn: () => fetchVisits(babyId),
+    staleTime: 60_000,
+    enabled,
+  });
+}
+
+// Takes the photos after the row is saved: a photo that fails is skipped,
+// the next one still goes up (spec §8.2).
+async function uploadAll(
+  ids: { babyId: string; familyId: string; visitId: string },
+  visitedAt: string,
+  files: File[],
+): Promise<File[]> {
+  const failed: File[] = [];
+  for (const file of files) {
+    try {
+      await uploadPhoto({
+        ...ids,
+        file,
+        takenOn: vnDateString(new Date(visitedAt)),
+        caption: null,
+      });
+    } catch {
+      failed.push(file);
+    }
+  }
+  return failed;
+}
+
+// Spec §8.2: visits and their photos go straight to the server and need the
+// network, like the Photos page; the screen turns the buttons off offline.
+export function useVisitActions(babyId: string, familyId: string) {
+  const queryClient = useQueryClient();
+  const onSettled = async () => {
+    await queryClient.invalidateQueries({ queryKey: visitsKey(babyId) });
+    await queryClient.invalidateQueries({
+      queryKey: ["photos-usage", familyId],
+    });
+  };
+  return {
+    // The row first, under a new id; then each photo.
+    add: useMutation({
+      mutationFn: async (input: {
+        episodeId: string;
+        fields: VisitFields;
+        files: File[];
+      }): Promise<VisitSaved> => {
+        const id = crypto.randomUUID();
+        const { error } = await supabase()
+          .from("illness_visits")
+          .insert({
+            id,
+            episode_id: input.episodeId,
+            baby_id: babyId,
+            ...input.fields,
+          });
+        if (error) throw error;
+        const failed = await uploadAll(
+          { babyId, familyId, visitId: id },
+          input.fields.visited_at,
+          input.files,
+        );
+        return { id, failed };
+      },
+      onSettled,
+    }),
+    // `patch` null: the fields did not change, only photos go up.
+    update: useMutation({
+      mutationFn: async (input: {
+        id: string;
+        patch: VisitFields | null;
+        visitedAt: string;
+        files: File[];
+      }): Promise<VisitSaved> => {
+        if (input.patch) {
+          const { data, error } = await supabase()
+            .from("illness_visits")
+            .update(input.patch)
+            .eq("id", input.id)
+            .select("id");
+          if (error) throw error;
+          if (data.length === 0) throw new PermissionDeniedError();
+        }
+        const failed = await uploadAll(
+          { babyId, familyId, visitId: input.id },
+          input.visitedAt,
+          input.files,
+        );
+        return { id: input.id, failed };
+      },
+      onSettled,
+    }),
+    removePhoto: useMutation({ mutationFn: deletePhoto, onSettled }),
+    // Each photo with the delete of the Photos page, then the row. A step
+    // that fails stops the rest; what is left can be deleted again.
+    remove: useMutation({
+      mutationFn: async (visit: Visit) => {
+        for (const photo of visit.photos) await deletePhoto(photo);
+        const { data, error } = await supabase()
+          .from("illness_visits")
+          .delete()
+          .eq("id", visit.id)
+          .select("id");
+        if (error) throw error;
+        if (data.length === 0) throw new PermissionDeniedError();
+      },
+      onSettled,
+    }),
+  };
+}
diff --git a/lib/data/photos.ts b/lib/data/photos.ts
index 89e2f9c..99a8067 100644
--- a/lib/data/photos.ts
+++ b/lib/data/photos.ts
@@ -29,6 +29,9 @@ export function usePhotos(babyId: string) {
           .from("photos")
           .select("*")
           .eq("baby_id", babyId)
+          // Spec 2026-11-26 §8.2: the photos of a doctor's visit live with
+          // the visit, not on the Photos page.
+          .is("visit_id", null)
           .order("taken_on", { ascending: false })
           .order("created_at", { ascending: false })
           // id last, so rows with equal sort values cannot shuffle between pages.
@@ -91,54 +94,68 @@ export function usePhotoActions(babyId: string, familyId: string) {
   };
   return {
     upload: useMutation({
-      mutationFn: async (input: {
+      mutationFn: (input: {
         file: File;
         takenOn: string;
         caption: string | null;
-      }) => {
-        const blob = await compressPhoto(input.file);
-        const id = crypto.randomUUID();
-        const path = photoPath(familyId, babyId, id);
-        const storage = supabase().storage.from(BUCKET);
-        const uploaded = await storage.upload(path, blob, {
-          contentType: "image/jpeg",
-          upsert: false,
-        });
-        if (uploaded.error) throw uploaded.error;
-        const { error } = await supabase().from("photos").insert({
-          id,
-          baby_id: babyId,
-          storage_path: path,
-          taken_on: input.takenOn,
-          caption: input.caption,
-          size_bytes: blob.size,
-        });
-        if (error) {
-          // No row means nobody can see or delete the object: remove it again.
-          await storage.remove([path]);
-          throw error;
-        }
-      },
-      onSettled,
-    }),
-    // Spec §5.2: delete the Storage object first, then the row.
-    remove: useMutation({
-      mutationFn: async (photo: PhotoRow) => {
-        const removed = await supabase()
-          .storage.from(BUCKET)
-          .remove([photo.storage_path]);
-        // 0 objects: already removed by an earlier, half-finished delete (or not
-        // allowed); the row delete below applies the same rule and decides.
-        if (removed.error) throw removed.error;
-        const { data, error } = await supabase()
-          .from("photos")
-          .delete()
-          .eq("id", photo.id)
-          .select("id");
-        if (error) throw error;
-        if (data.length === 0) throw new PermissionDeniedError();
-      },
+      }) => uploadPhoto({ babyId, familyId, ...input }),
       onSettled,
     }),
+    remove: useMutation({ mutationFn: deletePhoto, onSettled }),
   };
 }
+
+// Compress, store the object, then its row; a row that is refused takes the
+// object away again. `visitId` is the doctor's visit a prescription belongs
+// to (spec 2026-11-26 §8.2); a photo of the Photos page has none.
+export async function uploadPhoto(input: {
+  babyId: string;
+  familyId: string;
+  file: File;
+  takenOn: string;
+  caption: string | null;
+  visitId?: string | null;
+}): Promise<void> {
+  const blob = await compressPhoto(input.file);
+  const id = crypto.randomUUID();
+  const path = photoPath(input.familyId, input.babyId, id);
+  const storage = supabase().storage.from(BUCKET);
+  const uploaded = await storage.upload(path, blob, {
+    contentType: "image/jpeg",
+    upsert: false,
+  });
+  if (uploaded.error) throw uploaded.error;
+  const { error } = await supabase()
+    .from("photos")
+    .insert({
+      id,
+      baby_id: input.babyId,
+      storage_path: path,
+      taken_on: input.takenOn,
+      caption: input.caption,
+      size_bytes: blob.size,
+      visit_id: input.visitId ?? null,
+    });
+  if (error) {
+    // No row means nobody can see or delete the object: remove it again.
+    await storage.remove([path]);
+    throw error;
+  }
+}
+
+// Spec §5.2: delete the Storage object first, then the row.
+export async function deletePhoto(photo: PhotoRow): Promise<void> {
+  const removed = await supabase()
+    .storage.from(BUCKET)
+    .remove([photo.storage_path]);
+  // 0 objects: already removed by an earlier, half-finished delete (or not
+  // allowed); the row delete below applies the same rule and decides.
+  if (removed.error) throw removed.error;
+  const { data, error } = await supabase()
+    .from("photos")
+    .delete()
+    .eq("id", photo.id)
+    .select("id");
+  if (error) throw error;
+  if (data.length === 0) throw new PermissionDeniedError();
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  210 passed (210)`, `Tests  2000 passed (2000)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/data/photos.ts lib/data/illness.ts lib/data/photos.test.ts lib/data/illnessVisits.test.ts
git commit -m "feat(illness): read and write doctor's visits and their photos" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Luật của lần khám (§8.3, §8.4, §6.4)

**Files:**

- Create: `lib/rules/visits.ts`
- Test: `lib/rules/visits.test.ts`

**Interfaces:**

- Consumes: `type Visit`, `type VisitFields` (Task 1, chỉ kiểu); `type EpisodeLike` (M2); `formatDayShort`, `formatVnTime`, `fromVnLocalInput`, `toVnLocalInput`, `vnDateString`.
- Produces: `MAX_VISIT_PHOTOS`, `VisitRaw`, `visitToRaw`, `buildVisit`, `visitsOf`, `visitHeading`, `Viewer`, `photoDeletable`, `visitDelete`, `episodeDeleteBlock` (chữ ký ở Contracts).

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/lib/rules/visits.test.ts b/lib/rules/visits.test.ts
new file mode 100644
index 0000000..4a1a1ed
--- /dev/null
+++ b/lib/rules/visits.test.ts
@@ -0,0 +1,265 @@
+import { describe, expect, it } from "vitest";
+import type { Visit } from "@/lib/data/illness";
+import type { PhotoRow } from "@/lib/supabase/rows";
+import {
+  buildVisit,
+  episodeDeleteBlock,
+  photoDeletable,
+  visitDelete,
+  visitHeading,
+  visitsOf,
+  visitToRaw,
+} from "./visits";
+
+const iso = (text: string) =>
+  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
+const NOW = new Date("2026-11-26T10:00:30+07:00");
+const open = { id: "e1", started_at: iso("2026-11-24 23:30"), ended_at: null };
+const closed = {
+  id: "e1",
+  started_at: iso("2026-11-20 08:00"),
+  ended_at: iso("2026-11-22 09:30"),
+};
+const photo = (id: string, createdBy: string) =>
+  ({ id, created_by: createdBy }) as PhotoRow;
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
+// Spec 2026-11-26 §8.4.
+describe("visitToRaw", () => {
+  it("a new visit starts now, with every other field empty", () => {
+    expect(visitToRaw(null, NOW)).toEqual({
+      at: "2026-11-26T10:00",
+      place: "",
+      conclusion: "",
+      advice: "",
+    });
+  });
+
+  it("an existing visit opens on its own values, in Vietnam time", () => {
+    const saved = visit("v1", "e1", "2026-11-25 09:15", {
+      place: "Phòng khám Nhi",
+      conclusion: "Viêm họng",
+      advice: null,
+    });
+    expect(visitToRaw(saved, NOW)).toEqual({
+      at: "2026-11-25T09:15",
+      place: "Phòng khám Nhi",
+      conclusion: "Viêm họng",
+      advice: "",
+    });
+  });
+});
+
+describe("buildVisit", () => {
+  const opened = visitToRaw(null, NOW);
+  const build = (
+    raw: Partial<typeof opened>,
+    episode: typeof open | typeof closed = open,
+    stored: Parameters<typeof buildVisit>[0]["stored"] = null,
+  ) =>
+    buildVisit({
+      episode,
+      stored,
+      opened,
+      openedAt: NOW.toISOString(),
+      raw: { ...opened, ...raw },
+      now: NOW,
+    });
+
+  it("an untouched time keeps the moment the sheet opened, to the second", () => {
+    expect(build({})).toEqual({
+      ok: true,
+      fields: {
+        visited_at: NOW.toISOString(),
+        place: null,
+        conclusion: null,
+        advice: null,
+      },
+      patch: {
+        visited_at: NOW.toISOString(),
+        place: null,
+        conclusion: null,
+        advice: null,
+      },
+    });
+  });
+
+  it("trims the texts; a blank one is saved as null", () => {
+    const built = build({
+      at: "2026-11-25T09:15",
+      place: "  Phòng khám Nhi ",
+      conclusion: "   ",
+      advice: "Uống nhiều nước\n",
+    });
+    expect(built).toMatchObject({
+      ok: true,
+      fields: {
+        visited_at: iso("2026-11-25 09:15"),
+        place: "Phòng khám Nhi",
+        conclusion: null,
+        advice: "Uống nhiều nước",
+      },
+    });
+  });
+
+  it("the time must lie inside the episode, both ends included", () => {
+    const outside = { ok: false, error: "Lúc khám nằm ngoài đợt ốm." };
+    expect(build({ at: "2026-11-24T23:29" })).toEqual(outside);
+    expect(build({ at: "2026-11-24T23:30" })).toMatchObject({ ok: true });
+    expect(build({ at: "2026-11-21T10:00" }, closed)).toMatchObject({
+      ok: true,
+    });
+    expect(build({ at: "2026-11-22T09:30" }, closed)).toMatchObject({
+      ok: true,
+    });
+    expect(build({ at: "2026-11-22T09:31" }, closed)).toEqual(outside);
+  });
+
+  it("an open episode reaches now plus one minute, not further", () => {
+    expect(build({ at: "2026-11-26T10:01" })).toMatchObject({ ok: true });
+    expect(build({ at: "2026-11-26T10:02" })).toEqual({
+      ok: false,
+      error: "Lúc khám nằm ngoài đợt ốm.",
+    });
+  });
+
+  it("a closed episode's default (now) is outside it", () => {
+    expect(build({}, closed)).toEqual({
+      ok: false,
+      error: "Lúc khám nằm ngoài đợt ốm.",
+    });
+  });
+
+  it("an emptied time is outside the episode", () => {
+    expect(build({ at: "" })).toEqual({
+      ok: false,
+      error: "Lúc khám nằm ngoài đợt ốm.",
+    });
+  });
+
+  it("editing: nothing changed gives no patch; a change gives every field", () => {
+    const saved = visit("v1", "e1", "2026-11-25 09:15", {
+      place: "Phòng khám Nhi",
+    });
+    const raw = visitToRaw(saved, NOW);
+    const edit = (next: Partial<typeof raw>) =>
+      buildVisit({
+        episode: open,
+        stored: saved,
+        opened: raw,
+        openedAt: saved.visited_at,
+        raw: { ...raw, ...next },
+        now: NOW,
+      });
+    expect(edit({})).toEqual({
+      ok: true,
+      fields: {
+        visited_at: saved.visited_at,
+        place: "Phòng khám Nhi",
+        conclusion: null,
+        advice: null,
+      },
+      patch: null,
+    });
+    expect(edit({ conclusion: "Viêm họng" })).toMatchObject({
+      ok: true,
+      patch: {
+        visited_at: saved.visited_at,
+        place: "Phòng khám Nhi",
+        conclusion: "Viêm họng",
+        advice: null,
+      },
+    });
+  });
+});
+
+describe("visitsOf", () => {
+  it("the visits of one episode, oldest first, whatever order they come in", () => {
+    const visits = [
+      visit("v3", "e1", "2026-11-26 08:00"),
+      visit("v9", "e2", "2026-11-25 08:00"),
+      visit("v1", "e1", "2026-11-25 08:00"),
+    ];
+    expect(visitsOf(visits, "e1").map((v) => v.id)).toEqual(["v1", "v3"]);
+  });
+});
+
+describe("visitHeading", () => {
+  it("is the day and time, then the place when there is one", () => {
+    expect(
+      visitHeading(
+        visit("v1", "e1", "2026-11-25 09:05", { place: "Phòng khám Nhi" }),
+      ),
+    ).toBe("25/11 09:05 · Phòng khám Nhi");
+    expect(visitHeading(visit("v1", "e1", "2026-11-25 09:05"))).toBe(
+      "25/11 09:05",
+    );
+  });
+});
+
+describe("who may delete", () => {
+  const owner = { userId: "u9", isOwner: true };
+  const member = { userId: "u2", isOwner: false };
+
+  it("a photo: the owner of the family or whoever added it", () => {
+    expect(photoDeletable(photo("p1", "u1"), owner)).toBe(true);
+    expect(photoDeletable(photo("p1", "u2"), member)).toBe(true);
+    expect(photoDeletable(photo("p1", "u1"), member)).toBe(false);
+  });
+
+  it("a visit: hidden from others; blocked by a photo they cannot delete", () => {
+    const mine = visit("v1", "e1", "2026-11-25 09:05", { created_by: "u2" });
+    expect(visitDelete(mine, member)).toBe("allowed");
+    expect(visitDelete({ ...mine, created_by: "u1" }, member)).toBe("hidden");
+    expect(visitDelete({ ...mine, photos: [photo("p1", "u2")] }, member)).toBe(
+      "allowed",
+    );
+    expect(
+      visitDelete(
+        { ...mine, photos: [photo("p1", "u2"), photo("p2", "u1")] },
+        member,
+      ),
+    ).toBe("blocked");
+    expect(
+      visitDelete(
+        { ...mine, created_by: "u1", photos: [photo("p2", "u1")] },
+        owner,
+      ),
+    ).toBe("allowed");
+  });
+});
+
+// Spec §6.4: "Xóa đợt ốm" from M5.
+describe("episodeDeleteBlock", () => {
+  it("visits not loaded: the network is needed to check them", () => {
+    expect(episodeDeleteBlock(undefined, "e1")).toBe(
+      "Cần mạng để kiểm các lần khám.",
+    );
+  });
+
+  it("an episode with a visit cannot be deleted; one without can", () => {
+    const visits = [visit("v1", "e2", "2026-11-25 08:00")];
+    expect(episodeDeleteBlock(visits, "e2")).toBe("Xóa các lần khám trước.");
+    expect(episodeDeleteBlock(visits, "e1")).toBeNull();
+    expect(episodeDeleteBlock([], "e1")).toBeNull();
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 210 passed (211)`, `Tests  2000 passed (2000)`. File đỏ là `lib/rules/visits.test.ts`, không nạp được vì `./visits` chưa có.

- [ ] **Step 3: Viết luật (Patch 4)**

```diff
diff --git a/lib/rules/visits.ts b/lib/rules/visits.ts
new file mode 100644
index 0000000..57e684d
--- /dev/null
+++ b/lib/rules/visits.ts
@@ -0,0 +1,138 @@
+import type { Visit, VisitFields } from "@/lib/data/illness";
+import type { PhotoRow, VisitRow } from "@/lib/supabase/rows";
+import { formatDayShort } from "./days";
+import type { EpisodeLike } from "./illness";
+import {
+  formatVnTime,
+  fromVnLocalInput,
+  toVnLocalInput,
+  vnDateString,
+} from "./time";
+
+// Spec 2026-11-26 §8.4: a visit holds up to six photos.
+export const MAX_VISIT_PHOTOS = 6;
+
+const OUTSIDE = "Lúc khám nằm ngoài đợt ốm.";
+const MINUTE_MS = 60_000;
+
+type VisitValues = Pick<
+  VisitRow,
+  "visited_at" | "place" | "conclusion" | "advice"
+>;
+
+// The four fields of the "Lần khám" sheet as typed. `at` is a datetime-local
+// value in Vietnam time.
+export type VisitRaw = {
+  at: string;
+  place: string;
+  conclusion: string;
+  advice: string;
+};
+
+// A new visit opens on now; a saved one on its own values.
+export function visitToRaw(visit: VisitValues | null, now: Date): VisitRaw {
+  return {
+    at: toVnLocalInput(visit ? new Date(visit.visited_at) : now),
+    place: visit?.place ?? "",
+    conclusion: visit?.conclusion ?? "",
+    advice: visit?.advice ?? "",
+  };
+}
+
+const text = (value: string) => value.trim() || null;
+
+// Spec §8.4 "Lưu": the fields to save, or the sentence under "Lúc khám".
+// "Lúc khám" must not be more than a minute ahead of now and must lie in the
+// episode, both ends included (an open episode runs up to now): one sentence
+// for both, since a time ahead of now is outside the episode too. A time left
+// as it was opened keeps `openedAt` to the second (the field only holds
+// minutes). `stored` is the visit as saved, or null for a new one; `patch` is
+// null when nothing changed.
+export function buildVisit(input: {
+  episode: EpisodeLike;
+  stored: VisitValues | null;
+  opened: VisitRaw;
+  openedAt: string;
+  raw: VisitRaw;
+  now: Date;
+}):
+  | { ok: true; fields: VisitFields; patch: VisitFields | null }
+  | { ok: false; error: string } {
+  const { episode, stored, opened, openedAt, raw, now } = input;
+  const at =
+    raw.at === opened.at ? new Date(openedAt) : fromVnLocalInput(raw.at);
+  const ms = at.getTime();
+  const latest = now.getTime() + MINUTE_MS;
+  const end = episode.ended_at
+    ? Math.min(Date.parse(episode.ended_at), latest)
+    : latest;
+  if (Number.isNaN(ms) || ms < Date.parse(episode.started_at) || ms > end)
+    return { ok: false, error: OUTSIDE };
+  const fields: VisitFields = {
+    visited_at: at.toISOString(),
+    place: text(raw.place),
+    conclusion: text(raw.conclusion),
+    advice: text(raw.advice),
+  };
+  const same =
+    stored !== null &&
+    Date.parse(stored.visited_at) === ms &&
+    stored.place === fields.place &&
+    stored.conclusion === fields.conclusion &&
+    stored.advice === fields.advice;
+  return { ok: true, fields, patch: same ? null : fields };
+}
+
+// Spec §8.3: the visits of one episode, oldest first.
+export function visitsOf(visits: Visit[], episodeId: string): Visit[] {
+  return visits
+    .filter((visit) => visit.episode_id === episodeId)
+    .sort(
+      (a, b) =>
+        Date.parse(a.visited_at) - Date.parse(b.visited_at) ||
+        a.id.localeCompare(b.id),
+    );
+}
+
+// "{dd/mm} {HH:mm} · {nơi khám}"; without a place, only the day and time.
+export function visitHeading(visit: VisitValues): string {
+  const at = new Date(visit.visited_at);
+  const when = `${formatDayShort(vnDateString(at))} ${formatVnTime(at)}`;
+  return visit.place ? `${when} · ${visit.place}` : when;
+}
+
+export type Viewer = { userId: string; isOwner: boolean };
+
+// The policy of photos: the owner of the family or whoever added the photo.
+export function photoDeletable(
+  photo: Pick<PhotoRow, "created_by">,
+  viewer: Viewer,
+): boolean {
+  return viewer.isOwner || photo.created_by === viewer.userId;
+}
+
+// "Xóa lần khám": hidden from anyone who is neither the owner of the family
+// nor whoever added the visit; blocked while a photo is left that they may
+// not delete.
+export function visitDelete(
+  visit: Pick<Visit, "created_by" | "photos">,
+  viewer: Viewer,
+): "hidden" | "blocked" | "allowed" {
+  if (!viewer.isOwner && visit.created_by !== viewer.userId) return "hidden";
+  return visit.photos.every((photo) => photoDeletable(photo, viewer))
+    ? "allowed"
+    : "blocked";
+}
+
+// Spec §6.4 from M5: why "Xóa đợt ốm" is off, or null when it is on. An
+// episode with a visit cannot be deleted (the server refuses too), and
+// without the visits loaded there is no telling.
+export function episodeDeleteBlock(
+  visits: Pick<Visit, "episode_id">[] | undefined,
+  episodeId: string,
+): string | null {
+  if (!visits) return "Cần mạng để kiểm các lần khám.";
+  return visits.some((visit) => visit.episode_id === episodeId)
+    ? "Xóa các lần khám trước."
+    : null;
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  211 passed (211)`, `Tests  2015 passed (2015)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/visits.ts lib/rules/visits.test.ts
git commit -m "feat(illness): the rules of a doctor's visit" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Kiểm cuối M5b, spec, rồi đưa lên `main`

**Files:**

- Modify: `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§8.2, §8.4: các chỗ đọc spec của plan này)
- Modify: file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của Task 1 và Task 2.
- Produces: kết quả kiểm, ghi ngay trong plan; hai đoạn đọc spec; `main` có M5b.

- [ ] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  211 passed (211)`, `Tests  2015 passed (2015)`.

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages using 9 workers (42/42)` và thoát mã 0.

- [ ] **Step 3: Trang Ảnh thật (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở `http://localhost:3000/anh` trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi); cần đăng nhập thì nhờ người dùng. Không bấm gì trên trang. Đọc lệnh đọc ảnh trong trang (chỉ in đường dẫn, tên tham số và mã trả về; không in giá trị):

```js
JSON.stringify(
  performance
    .getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/rest/v1/photos"))
    .map((entry) => {
      const url = new URL(entry.name);
      return {
        path: url.pathname,
        params: [...url.searchParams.keys()],
        visitFilter: url.searchParams.get("visit_id"),
        status: entry.responseStatus,
      };
    }),
);
```

Không có mục nào (cache còn mới dưới 60 giây nên trang không đọc lại): chờ một phút, tải lại trang rồi chạy lại đoạn trên.

Expected: ít nhất một mục `path` `/rest/v1/photos` có `visit_id` trong `params`, `visitFilter` là `"is.null"` và `status` 200; trang vẽ lưới ảnh như trước (hoặc "Chưa có ảnh nào."). `status` 400 nghĩa là Supabase thật chưa có cột `visit_id`: dừng và báo người dùng (M5a chưa áp xong). Lọc console bằng `onlyErrors`: không có lỗi mới. Dừng `bun run dev` khi xong.

- [ ] **Step 4: Các chỗ đọc spec (Patch 5), commit**

```diff
diff --git a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
index ba0cf66..8458583 100644
--- a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
+++ b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
@@ -405,6 +405,7 @@ alter table public.photos add foreign key (visit_id, baby_id)
 - Quyền xóa ảnh theo policy sẵn có của `photos`: chủ gia đình hoặc người đã thêm ảnh đó.
 - Dung lượng: khi `usage(totalBytes).level === "full"` (`lib/rules/photos.ts`) thì không thêm được ảnh đơn thuốc, giống trang Ảnh.
 - Lưu lần khám mới: lưu hàng lần khám trước, rồi tải từng ảnh. Ảnh nào lỗi thì bỏ qua và tải tiếp ảnh sau; lần khám đã lưu vẫn giữ.
+- `useVisits(babyId, enabled = true)` trả mỗi lần khám kèm các ảnh của nó, cũ trước; khóa `["illness-visits", babyId]`, `staleTime` 60 giây, không đọc từng trang (mỗi bé chỉ vài lần khám, mỗi lần tối đa 6 ảnh). `useVisitActions(babyId, familyId)` có thêm `removePhoto` (xóa một ảnh đã lưu, §8.4); `add` và `update` trả mã lần khám và các ảnh chưa tải được. Phần tải ảnh và xóa ảnh của trang Ảnh tách thành `uploadPhoto`, `deletePhoto` dùng chung; trang Ảnh không đổi gì. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói mấy chỗ này. Chọn ở M5b ngày 2026-11-27 theo lời duyệt trước của người dùng.)
 
 ### 8.3 Thẻ "Lần khám" trên trang chi tiết
 
@@ -416,6 +417,7 @@ alter table public.photos add foreign key (visit_id, baby_id)
 
 - Dòng phụ: "Chỉ cần ngày giờ. Các ô khác điền được sau."
 - "Lúc khám" (ngày giờ, mặc định lúc này; không sau lúc này quá 1 phút; phải nằm trong khoảng của đợt, sai thì "Lúc khám nằm ngoài đợt ốm.").
+- Một câu cho cả hai lỗi của "Lúc khám": giờ sau lúc này quá 1 phút cũng nằm ngoài đợt (đợt đang mở chỉ tới lúc này). Hai đầu của đợt tính vào đợt: đúng `started_at` hay đúng `ended_at` đều hợp lệ. Ô để nguyên như lúc mở sheet thì giữ giờ đã có tới từng giây. Một lần khám đã nằm ngoài đợt vì đợt bị sửa giờ (§8.1) thì phải chọn lại "Lúc khám" mới lưu được, kể cả khi chỉ sửa ô khác. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bốn chỗ này. Chọn ở M5b ngày 2026-11-27 theo lời duyệt trước của người dùng.)
 - "Nơi khám" (tối đa 80), "Bác sĩ kết luận" (tối đa 120), "Lời dặn" (3 dòng, tối đa 500). Ô trống lưu `null`.
 - "Ảnh đơn thuốc, giấy khám": các ảnh đã có, mỗi ảnh có nút xóa; ô "Thêm" mở chọn ảnh (`accept="image/*"`). Tối đa 6 ảnh một lần khám; đủ 6 thì ẩn ô "Thêm". Ảnh chọn khi đang thêm mới được tải lên sau khi hàng lần khám đã lưu.
 - Nút xóa của một ảnh chỉ hiện với chủ gia đình hoặc người đã thêm ảnh đó. Bấm thì hỏi lại một lần "Xóa ảnh này?" rồi xóa ngay, không chờ "Lưu". Ảnh thêm vào khi đang sửa thì tải lên khi bấm "Lưu".
```

```bash
git add docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
git commit -m "docs: readings of §8.2 and §8.4 in the spec (M5b)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1 đến Step 3. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này là untracked (??), hoặc đã được commit lúc duyệt thì là M; các file plan khác chưa chạy: không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m5b.md
git commit -m "docs(plan): the M5b plan and its check results" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m5b
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; kết quả bước trang Ảnh thật; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
