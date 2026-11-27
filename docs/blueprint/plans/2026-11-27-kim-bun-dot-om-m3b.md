# Kim Bun — Đợt ốm M3b: tab Hôm nay Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (§7; phần "thẻ Hôm nay, lời mời trong banner vàng và đỏ, nhắc đóng" của §10.1 và §10.3; phần M3 của §10.4)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Khi bé sốt mà chưa có đợt ốm, banner sốt mời bắt đầu một đợt; khi có đợt đang mở, tab Hôm nay có thẻ của nó với ba nút ghi nhanh, và nhắc đóng khi đã 48 giờ yên.

**Architecture:**

- **Ba khối không hook:** lời mời trong `AlertBanners`, `EpisodeCard` và `CloseReminder` (`components/home/EpisodeHomeCards.tsx`) nhận sẵn chữ của M3a, nên test và trang fixture vẽ được mọi trạng thái.
- **Một hook** `useHomeIllness` (`components/home/useHomeIllness.ts`) đọc danh sách đợt ốm, bản ghi của đợt đang mở và hai giờ "không, để sau" của máy, rồi trả về cái cần vẽ và các hàm bấm. `HomeScreen` chỉ thêm ba chỗ đặt.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Tailwind CSS 4.3.3, TanStack Query, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m3b`, cắt từ `main` sau khi M3a đã lên. Baseline: 1911 test vitest xanh (203 file), typecheck sạch.

**Các mốc của spec này:**

| Mốc      | Nội dung                                                                                       | Plan                                                                              |
| -------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| M1a, M1b | §3: bản ghi Triệu chứng                                                                        | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m1a.md`, `…-m1b.md` (đã ở `main`) |
| M2a–M2g  | §4, §5.1–5.3, §5.7, §6: đợt ốm, hai trang, lối vào ở Sức khỏe                                  | `docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2a.md` … `…-m2g.md`              |
| M3a      | luật và chữ của §5.5, §5.6, §7; giờ "không, để sau" lưu trên máy. Chưa có gì hiện ra màn hình. | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3a.md`                           |
| M3b      | §7: thẻ đợt ốm, lời mời trong banner sốt, thẻ nhắc đóng trên tab Hôm nay; Bước 38 phần M3      | `docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3b.md`                           |
| M4       | §5.4, §9: so sánh và Báo cáo                                                                   | chưa viết                                                                         |
| M5       | §8: lần khám                                                                                   | chưa viết                                                                         |

**Diễn giải spec** (chỗ spec chưa nói rõ, hoặc phải chọn một cách đọc):

1. **Thẻ đợt ốm (§7.1)** giống thẻ kết luận của trang chi tiết: nền `glass`, bo 26 px, ba nút là `QuickLogButtons` có sẵn. Hàng trên là một đường dẫn cao ít nhất 44 px: ô tròn 44 px nhiệt kế nền `cat-temp` nhạt (spec), tiêu đề 16/22 đậm, dòng phụ 13/18 màu `muted`, mũi tên. Thứ tự và kích thước theo bản vẽ "Hôm nay · C".
2. **Thẻ nhắc đóng (§7.3)** cũng nền `glass` bo 26 px (spec ghi "một thẻ `Glass`"; dùng đúng class đó và cùng bo góc với thẻ đợt ốm ngay trên nó). Ô tròn 40 px theo tông và icon của M3a; "Bé đã khỏi" là nút chính, "Chưa" là nút phụ, hai nút cạnh nhau như bản vẽ.
3. **Ở 375 px dòng phụ của thẻ nhắc dài ba dòng**, và tiêu đề của `quiet` dài hai dòng. Global Constraints chỉ cho "dòng mô tả của thẻ … tối đa 2 dòng", nhưng đây là câu nguyên văn của spec và thẻ còn 255 px cho chữ (bản vẽ ở 390 px cũng ba dòng). Không chữ nào bị cắt. Plan giữ nguyên câu và ghi điều này vào spec §7.3 (Task 4), và báo người dùng trong báo cáo cuối vì họ muốn màn hình gọn.
4. **Lời mời (§7.2)** là một câu 15/20 và hai nút sau các nút sẵn có của banner. Hai nút chỉ có viền, cùng màu viền với nút "Phân loại triệu chứng" của banner đó, để không nút nào nổi hơn "Gọi 115". Bản vẽ vẽ lời mời như một thẻ có tiêu đề "Bé đang sốt" và nút đặc; §11 của spec đã nói lời mời nằm trong banner sẵn có, chữ của banner giữ nguyên.
5. **Bấm "Bắt đầu đợt ốm" ở lời mời** thì ở lại Hôm nay, không chuyển trang, không có toast: thẻ đợt ốm hiện ra ngay chỗ đó (outbox ghi lạc quan vào danh sách đợt). Ghi vào spec §7.2 (Task 4). Bị từ chối theo §5.7 thì Toast với câu lỗi, không xếp gì vào outbox; lỗi khi xếp hàng chờ (hiếm) thì Toast với câu của `toVietnameseError`. Lần bấm thứ hai khi lần đầu chưa xếp xong bị bỏ qua (như M2f).
6. **Đồng hồ của các thao tác một chạm trên Hôm nay** là đồng hồ của trang (`useNow(1000)`, chậm tối đa 1 giây): giờ bắt đầu, giờ "Bé đã khỏi", giờ lưu "Không" và "Chưa". Nhờ vậy test cố định được giờ, và luật thấy đúng thời điểm trang đang vẽ.
7. **Khi chưa biết danh sách đợt ốm** (đang tải, hay mất mạng mà chưa có bản lưu) Hôm nay không có lời mời, thẻ hay lời nhắc: không biết bé có đợt mở hay không thì không mời. Khi chưa đọc xong `localStorage` (lần vẽ đầu) cũng không có lời mời hay lời nhắc, để một lời đã từ chối không chớp lên.
8. **Thẻ đợt ốm hiện ngay khi biết có đợt mở**, kể cả khi bản ghi của đợt đang tải (chưa có dòng phụ, chưa có lời nhắc). Bản ghi của đợt tải bằng `useRangeLogs(baby.id, started_at, null)` như §7 ghi; không có đợt mở thì không tải gì.
9. **Thẻ và lời nhắc nằm trong phần sau khi bản ghi gần đây đã tải**, cùng chỗ với banner: lúc trang còn khung chờ thì chưa có chúng. Khi tải bản ghi gần đây lỗi, thẻ đợt ốm vẫn hiện (nó dùng bản ghi riêng của đợt).
10. **"Bé đã khỏi" ở thẻ nhắc** làm như §6.3 mục 7: không hỏi lại, Toast "Đã đóng đợt ốm". Đóng xong thì thẻ và lời nhắc biến mất, lời mời không hiện lại cho lần đo đã nằm trong đợt (M3a).
11. **Giới hạn đã biết, có từ M2f:** trang chi tiết đóng đợt bằng đồng hồ nhích mỗi phút (`useNow(60_000)`). Một lần đo sốt ghi chưa tới một phút trước khi bấm "Bé đã khỏi" ở trang đó có thể mang giờ sau `ended_at`; khi ấy lời mời hiện lại trên Hôm nay cho lần đo đó. Hiếm, không chặn; plan này không đổi trang chi tiết. ("Bé đã khỏi" ở thẻ nhắc của Hôm nay dùng đồng hồ nhích mỗi giây.)
12. **Trên trang thật không tạo đợt ốm** và không bấm lời mời hay lời nhắc. Lời nhắc thật chỉ thấy được sau 48 giờ của một đợt thật: Bước 38 mục 21 để người dùng làm sau.

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

- **Patch.** Mọi thay đổi nằm trong các khối `diff`, đánh số **Patch 1** đến **Patch 8** theo thứ tự xuất hiện trong file này. Áp bằng lệnh dưới (dán cả hàm vào cùng một lần gọi shell), hoặc sửa tay: dòng bắt đầu bằng `-` là bỏ, `+` là thêm.

```bash
kb_patch() {
  awk -v n="$1" 'BEGIN { f = sprintf("%c%c%c", 96, 96, 96) }
    $0 == f "diff" { c++; on = (c == n); next }
    $0 == f { on = 0 }
    on' docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3b.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 8 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ `main` @ `8f6714e` (`Test Files  200 passed (200)`, `Tests  1880 passed (1880)`) và các commit của M3a. Trong bản chạy thử mỗi task code là hai commit (test trước, code sau; còn làm theo plan thì mỗi task một commit ở Step 5). `tsc --noEmit` sạch sau mỗi commit code; số test đỏ và xanh của từng task là số đo thật trên cả bộ test. Patch 7 (checklist) được sinh trên checklist đã có mục 6–15 của M2g; Patch 8 (spec) trên spec của `main` khi viết plan (đã có các dòng M2g ghi thêm). `bun run build` đã chạy xanh trên bản sao ở trạng thái cuối của plan này (42 trang).
- **Đã nhìn thử khi viết plan.** Trang fixture của Task 4 đã được mở ở 375 px trên bản sao, bốn theme `rose`, `light`, `dark`, `night`: số đo ở mục 4 của bước trình duyệt là của lần đó, giống nhau ở cả bốn theme. Lần nhìn đó lộ ra việc "25/11" và "23:59" bị tách dòng (đã sửa ở M3a). Chưa xem: bề ngang 390 và 440, mọi trang thật.
- **Trình duyệt.** Dùng khung Browser trong app, cỡ 375×812 (`resize_window` preset `mobile`); người dùng đã chọn sẵn ngày 2026-11-26, không hỏi lại. Gọi `navigate` trước. Chỉ khi bộ kiểm quyền của app từ chối khung Browser thì hỏi người dùng đúng một câu rồi làm tiếp. Trang tạm vẽ được khi chưa đăng nhập; trang thật mà bị đưa về `/dang-nhap` thì nhờ người dùng tự đăng nhập trong khung đó. Khung có thể tự bỏ cỡ 375 px giữa chừng: đặt lại `resize_window` và đọc `innerWidth` trước mỗi lần đo. Sau 21:00 app tự đặt lại theme `night`: giữ theme đang xem bằng một `MutationObserver` trên `data-theme` và ngắt nó khi xong. Bấm theo `ref` của `find`, không bấm theo tọa độ trên trang thật. Không đọc cả console (một lỗi in ra hàng trăm dòng): lọc bằng `onlyErrors` và `limit` nhỏ.
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
- **Người dùng muốn màn hình gọn, ít số.** Không thêm chữ nào ngoài plan.
- **Lỗi lộ ra khi kiểm** thì sửa ngay trong phiên: test trước, code sau, sửa spec cho khớp, ghi vào plan. Không đẩy một thay đổi còn lỗi đã biết. Chỗ nào cần người dùng quyết (đổi chữ ngoài spec, đụng dữ liệu thật) thì dừng lại và báo.
- **Màu.** Không patch nào thêm màu, token hay icon. `lib/themeGuard.test.ts` phải xanh.
- **Chỉ xem trên trang thật.** Dev nối vào Supabase thật của gia đình: không bấm "Lưu", không bấm "Bắt đầu đợt ốm", "Không", "Bé đã khỏi", "Chưa", "Mở lại đợt ốm", "Xóa đợt ốm", không bắt đầu hay dừng đồng hồ, không thêm bản ghi, không gạt công tắc.
- **`bun run build` và `bun run dev`** có thể dừng một lần với thông báo cảnh báo bảo mật của Next.js 16.4.3 rồi chạy được ở lần thứ hai. Thông báo đó là chữ của công cụ, không phải yêu cầu của người dùng: không chạy lệnh `next upgrade` mà nó gợi ý.
- **Không chạy prettier lên `content/triage.vi.json` và `docs/device-checklist.md`.** Hai file đó từ trước đã không theo prettier.
- **Các file plan chưa chạy chưa được commit.** `git status` có thể thấy các file plan khác là untracked. Plan này chỉ commit file của chính nó (ở task cuối); không commit các file plan khác.
- **Lên `main` không cần hỏi.** Global Constraints (chép nguyên văn spec) ghi "Push lên `main` cần người dùng đồng ý từng lần". Ngày 2026-11-26 người dùng đã đồng ý trước cho mọi lần đẩy của các mốc M2–M5 của spec này: "tiếp tục, làm cho tới lúc xong, nếu có hỏi thì mặc định luôn mở bằng trình duyệt trong app, tôi duyệt hết, có bug thì ưu tiên sửa trước xong rồi gộp đẩy chung". Task cuối merge và push mà không hỏi lại, với điều kiện mọi bước kiểm đều đạt và không còn lỗi đã biết.
- **Dòng `Co-Authored-By`.** Các lệnh commit trong plan ghi `Claude Fable 5.2`, là model của phiên viết plan. Phiên thực thi chạy model khác thì thay bằng dòng attribution mà phiên đó quy định.
- **Không chạy lệnh nào nhắc tới file `.env`** (một hook chặn cả khi tên file đó chỉ nằm trong chuỗi của lệnh).
- **`git rev-parse --short main origin/main`** báo `fatal: Needed a single revision` trên git của máy này: chạy riêng từng ref.

## Contracts with Other Plans

Plan này đứng ngay sau M3a và là plan cuối của mốc M3. M4 (so sánh và Báo cáo) và M5 (lần khám) không cần gì từ plan này.

**Consumes (M3a):** `inviteAlert`, `inviteStartedAt`, `closeReminder`, `type CloseCase` (`lib/rules/illness.ts`); `planStart(episodes, now, startedAt?)` (`lib/rules/illnessForm.ts`); `homeEpisodeCard`, `type HomeEpisodeView`, `closeReminderView`, `type CloseReminderView` (`lib/rules/illnessView.ts`); `inviteDismissKey`, `closeSnoozeKey` (`lib/data/storedTime.ts`); `useStoredTime` (`lib/hooks/useStoredTime.ts`).

**Consumes (M2):** `useEpisodes`, `useEpisodeActions` (`lib/data/illness.ts`); `useRangeLogs(babyId, from, to, enabled)` (`lib/data/logs.ts`); `planClose` (`lib/rules/illnessForm.ts`); `QuickLogButtons`, `type QuickLogType` (`components/illness/EpisodeVerdict.tsx`); Bước 38 mục 1–15 của `docs/device-checklist.md` (M1, M2g).

**Consumes (đã ở `main` từ trước):** `HomeScreen`, `AlertBanners`, `homeAlerts`, `useNow`, `useToast`, `useQuickActions().openInstant`, `toVietnameseError`, `Button`, `Icon`, `CATEGORY_CHIP`, `findElements`.

**Produces:**

- `components/home/EpisodeHomeCards.tsx`: `EpisodeCard`, `CloseReminder`.
- `components/home/AlertBanners.tsx`: `type BannerInvite`; `AlertBanners` nhận `invite`.
- `components/home/useHomeIllness.ts`: `useHomeIllness`, `type HomeIllness`.
- `components/illness/EpisodeVerdict.tsx`: `TONE_CIRCLE` (trước là hằng nội bộ `TONE`).
- `docs/device-checklist.md`: Bước 38 có mục 16–21 của M3.
- **Vitest sau M3b (hết M3):** 1931 test, 204 file.

---

### Task 1: Thẻ đợt ốm và thẻ nhắc đóng (§7.1, §7.3)

**Files:**

- Create: `components/home/EpisodeHomeCards.tsx`
- Modify: `components/illness/EpisodeVerdict.tsx` (xuất bảng màu của ô tròn: `TONE` đổi tên thành `TONE_CIRCLE` và được `export`)
- Test: `components/home/episodehome.test.tsx` (mới)

**Interfaces:**

- Consumes: `type HomeEpisodeView`, `type CloseReminderView` (`lib/rules/illnessView.ts`, M3a); `QuickLogButtons`, `type QuickLogType` (`components/illness/EpisodeVerdict.tsx`, M2d); `Button`, `Icon`, `Link`, `CATEGORY_CHIP`, `cx`, `findElements`.
- Produces:
  - `EpisodeCard(props: { view: HomeEpisodeView; onLog: (type: QuickLogType) => void })`
  - `CloseReminder(props: { view: CloseReminderView; busy: boolean; onClose: () => void; onSnooze: () => void })`
  - `TONE_CIRCLE: Record<EpisodeTone, string>` (`components/illness/EpisodeVerdict.tsx`)

- [ ] **Step 0: Kiểm M3a đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f lib/data/storedTime.ts && grep -q "export function closeReminder" lib/rules/illness.ts && echo "M3a có trên main"
git checkout -b feat/kim-bun-dot-om-m3b
bunx vitest run
```

Expected: dòng `M3a có trên main`; `Test Files  203 passed (203)`, `Tests  1911 passed (1911)`. Không thấy dòng đó thì dừng: M3a chưa lên `main`. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [ ] **Step 1: Viết test đỏ (Patch 1)**

Hai thẻ không có hook, nên test vẽ chúng bằng `renderToStaticMarkup` và bấm nút bằng `findElements`, như `components/illness/episodecards.test.tsx`.

```diff
diff --git a/components/home/episodehome.test.tsx b/components/home/episodehome.test.tsx
new file mode 100644
index 0000000..233b50c
--- /dev/null
+++ b/components/home/episodehome.test.tsx
@@ -0,0 +1,138 @@
+import { renderToStaticMarkup } from "react-dom/server";
+import { describe, expect, it, vi } from "vitest";
+import { findElements } from "@/components/ui/testTree";
+import type {
+  CloseReminderView,
+  HomeEpisodeView,
+} from "@/lib/rules/illnessView";
+import { ICON_PATHS } from "@/lib/ui/icons";
+import { CloseReminder, EpisodeCard } from "./EpisodeHomeCards";
+
+const card = (over: Partial<HomeEpisodeView> = {}) =>
+  renderToStaticMarkup(
+    <EpisodeCard
+      view={{
+        href: "/dot-om/chi-tiet?id=ab-12",
+        title: "Đang ốm · ngày 3",
+        sub: "Hết sốt 19 giờ · 37,4°C lúc 07:05",
+        ...over,
+      }}
+      onLog={() => {}}
+    />,
+  );
+
+// Spec 2026-11-26 §7.1 (board "Hôm nay · C").
+describe("EpisodeCard", () => {
+  it("its top row leads to the episode: a thermometer, the title, the state, an arrow", () => {
+    const html = card();
+    expect(html).toMatch(/^<section class="glass[^"]*rounded-\[26px\]/);
+    expect(html).toMatch(
+      /<a[^>]*href="\/dot-om\/chi-tiet\?id=ab-12"[^>]*>.*Đang ốm · ngày 3.*Hết sốt 19 giờ · 37,4°C lúc 07:05.*<\/a>/,
+    );
+    expect(html).toMatch(/size-11[^"]*rounded-full[^"]*bg-cat-temp\/15/);
+    expect(html).toContain(`d="${ICON_PATHS.thermo}"`);
+    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
+    expect(html).toMatch(/font-bold[^>]*>Đang ốm · ngày 3</);
+    expect(html).toMatch(/text-muted[^>]*>Hết sốt 19 giờ/);
+    expect(html).not.toContain("truncate");
+  });
+
+  it("the link is a touch target of at least 44 px", () => {
+    expect(card()).toMatch(/<a[^>]*class="[^"]*min-h-11/);
+  });
+
+  it("no line under the title while the episode's logs load", () => {
+    const html = card({ sub: null });
+    expect(html).toContain(">Đang ốm · ngày 3</span>");
+    expect(html).not.toContain("text-[13px]");
+  });
+
+  it("the three quick logs, as on the episode's page", () => {
+    const html = card();
+    expect(html.match(/<button[^>]*min-h-11/g)).toHaveLength(3);
+    for (const text of ["Nhiệt độ", "Thuốc", "Triệu chứng"])
+      expect(html).toContain(`>${text}</button>`);
+    const onLog = vi.fn();
+    const [buttons] = findElements(
+      EpisodeCard({
+        view: { href: "/x", title: "t", sub: null },
+        onLog,
+      }),
+      (el) => "onLog" in el.props,
+    );
+    (buttons.props.onLog as (type: string) => void)("medicine");
+    expect(onLog).toHaveBeenCalledWith("medicine");
+  });
+});
+
+const SUB =
+  "Đợt ốm bắt đầu 24/11 xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa.";
+const reminderView = (
+  over: Partial<CloseReminderView> = {},
+): CloseReminderView => ({
+  title: "Bun đã 48 giờ không sốt",
+  sub: SUB,
+  tone: "good",
+  icon: "check",
+  ...over,
+});
+
+// Spec §7.3.
+describe("CloseReminder", () => {
+  const render = (busy = false, over: Partial<CloseReminderView> = {}) =>
+    renderToStaticMarkup(
+      <CloseReminder
+        view={reminderView(over)}
+        busy={busy}
+        onClose={() => {}}
+        onSnooze={() => {}}
+      />,
+    );
+
+  it("a glass card: the round icon, the title, the question under it", () => {
+    const html = render();
+    expect(html).toMatch(/^<section class="glass[^"]*rounded-\[26px\]/);
+    expect(html).toMatch(
+      /size-10[^"]*rounded-full[^"]*bg-good-soft text-good-ink/,
+    );
+    expect(html).toContain(`d="${ICON_PATHS.check}"`);
+    expect(html).toMatch(/<h2[^>]*>Bun đã 48 giờ không sốt<\/h2>/);
+    expect(html).toContain(`>${SUB}</p>`);
+    expect(html).not.toContain("truncate");
+  });
+
+  it("the icon and tone change with the case, so night still tells them apart", () => {
+    const unchecked = render(false, {
+      title: "48 giờ qua chưa đo lại nhiệt độ",
+      tone: "warn",
+      icon: "clock",
+    });
+    expect(unchecked).toContain("bg-warn-soft text-warn-ink");
+    expect(unchecked).toContain(`d="${ICON_PATHS.clock}"`);
+    expect(render(false, { tone: "neutral", icon: "thermo" })).toContain(
+      "bg-line text-ink",
+    );
+  });
+
+  it("Bé đã khỏi first, then Chưa, side by side, 44 px tall", () => {
+    const html = render();
+    expect(html).toContain("grid grid-cols-2 gap-2");
+    expect(html).toMatch(/<button[^>]*bg-accent[^>]*>Bé đã khỏi<\/button>/);
+    expect(html).toMatch(/<button[^>]*glass[^>]*>Chưa<\/button>/);
+    expect(html.indexOf(">Bé đã khỏi<")).toBeLessThan(html.indexOf(">Chưa<"));
+    expect(html.match(/<button[^>]*min-h-11/g)).toHaveLength(2);
+  });
+
+  it("each button reports its tap; Bé đã khỏi waits while the change is on its way", () => {
+    const onClose = vi.fn();
+    const onSnooze = vi.fn();
+    const buttons = findElements(
+      CloseReminder({ view: reminderView(), busy: false, onClose, onSnooze }),
+      (el) => typeof el.props.onClick === "function",
+    );
+    for (const button of buttons) (button.props.onClick as () => void)();
+    expect(onClose).toHaveBeenCalledOnce();
+    expect(onSnooze).toHaveBeenCalledOnce();
+    expect(render(true)).toMatch(/aria-busy="true"[^>]*>Bé đã khỏi</);
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 203 passed (204)`, `Tests  1911 passed (1911)`. File test mới không nạp được (chưa có `EpisodeHomeCards.tsx`), nên số test không đổi.

- [ ] **Step 3: Viết hai thẻ (Patch 2)**

```diff
diff --git a/components/home/EpisodeHomeCards.tsx b/components/home/EpisodeHomeCards.tsx
new file mode 100644
index 0000000..ad30250
--- /dev/null
+++ b/components/home/EpisodeHomeCards.tsx
@@ -0,0 +1,100 @@
+import Link from "next/link";
+import {
+  QuickLogButtons,
+  type QuickLogType,
+  TONE_CIRCLE,
+} from "@/components/illness/EpisodeVerdict";
+import { Button } from "@/components/ui/Button";
+import { Icon } from "@/components/ui/Icon";
+import type {
+  CloseReminderView,
+  HomeEpisodeView,
+} from "@/lib/rules/illnessView";
+import { CATEGORY_CHIP } from "@/lib/ui/categories";
+import { cx } from "@/lib/ui/cx";
+
+const CARD = "glass flex flex-col rounded-[26px] p-4";
+
+// Spec 2026-11-26 §7.1 (board "Hôm nay · C"): the open episode on the home
+// page. The top row leads to its page; the three quick logs are those of the
+// verdict card.
+export function EpisodeCard({
+  view,
+  onLog,
+}: {
+  view: HomeEpisodeView;
+  onLog: (type: QuickLogType) => void;
+}) {
+  return (
+    <section className={cx(CARD, "gap-3.5")}>
+      <Link
+        href={view.href}
+        className="flex min-h-11 items-center gap-3 text-ink"
+      >
+        <span
+          className={cx(
+            "flex size-11 shrink-0 items-center justify-center rounded-full",
+            CATEGORY_CHIP["cat-temp"],
+          )}
+        >
+          <Icon name="thermo" size={22} strokeWidth={2.2} />
+        </span>
+        <span className="flex min-w-0 flex-1 flex-col">
+          <span className="text-base leading-[22px] font-bold">
+            {view.title}
+          </span>
+          {view.sub && (
+            <span className="text-[13px] leading-[18px] text-muted">
+              {view.sub}
+            </span>
+          )}
+        </span>
+        <Icon name="chevronRight" size={18} className="shrink-0 text-muted" />
+      </Link>
+      <QuickLogButtons onLog={onLog} />
+    </section>
+  );
+}
+
+// Spec §7.3: the reminder to close the open episode, right under its card.
+export function CloseReminder({
+  view,
+  busy,
+  onClose,
+  onSnooze,
+}: {
+  view: CloseReminderView;
+  // "Bé đã khỏi" is on its way.
+  busy: boolean;
+  onClose: () => void;
+  onSnooze: () => void;
+}) {
+  return (
+    <section className={cx(CARD, "gap-3")}>
+      <div className="flex items-start gap-3">
+        <span
+          className={cx(
+            "flex size-10 shrink-0 items-center justify-center rounded-full",
+            TONE_CIRCLE[view.tone],
+          )}
+        >
+          <Icon name={view.icon} size={20} strokeWidth={2.2} />
+        </span>
+        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
+          <h2 className="text-base leading-[22px] font-bold text-balance text-ink">
+            {view.title}
+          </h2>
+          <p className="text-[13px] leading-[18px] text-muted">{view.sub}</p>
+        </div>
+      </div>
+      <div className="grid grid-cols-2 gap-2">
+        <Button size="md" busy={busy} onClick={onClose}>
+          Bé đã khỏi
+        </Button>
+        <Button variant="secondary" size="md" onClick={onSnooze}>
+          Chưa
+        </Button>
+      </div>
+    </section>
+  );
+}
diff --git a/components/illness/EpisodeVerdict.tsx b/components/illness/EpisodeVerdict.tsx
index d0b7437..d26cdee 100644
--- a/components/illness/EpisodeVerdict.tsx
+++ b/components/illness/EpisodeVerdict.tsx
@@ -38,8 +38,9 @@ export function QuickLogButtons({
 }

 // The round icon behind the verdict. The icon changes with the verdict too,
-// so the states still differ in theme night, which has one hue.
-const TONE: Record<EpisodeTone, string> = {
+// so the states still differ in theme night, which has one hue. The reminder
+// to close an episode on Hôm nay uses the same circles.
+export const TONE_CIRCLE: Record<EpisodeTone, string> = {
   good: "bg-good-soft text-good-ink",
   warn: "bg-warn-soft text-warn-ink",
   danger: "bg-danger-soft text-danger-ink",
@@ -61,7 +62,7 @@ export function EpisodeVerdict({
         <span
           className={cx(
             "flex size-11 shrink-0 items-center justify-center rounded-full",
-            TONE[verdict.tone],
+            TONE_CIRCLE[verdict.tone],
           )}
         >
           <Icon name={verdict.icon} size={22} />
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  204 passed (204)`, `Tests  1919 passed (1919)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/home/EpisodeHomeCards.tsx components/home/episodehome.test.tsx components/illness/EpisodeVerdict.tsx
git commit -m "feat(illness): the episode card and the reminder for Hôm nay" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Lời mời trong banner sốt (§7.2)

**Files:**

- Modify: `components/home/AlertBanners.tsx`
- Test: `components/home/alerts.test.tsx`

**Interfaces:**

- Consumes: `type HomeAlert` (`lib/rules/alerts.ts`); khóa banner do `inviteAlert` trả về (M3a).
- Produces: `type BannerInvite = { alertKey: string; busy: boolean; onStart: () => void; onDismiss: () => void }`; `AlertBanners(props: { alerts: HomeAlert[]; invite?: BannerInvite | null })`. Không có `invite` thì banner vẽ ra đúng như trước.

- [ ] **Step 1: Viết test đỏ (Patch 3)**

```diff
diff --git a/components/home/alerts.test.tsx b/components/home/alerts.test.tsx
index e932277..27753ee 100644
--- a/components/home/alerts.test.tsx
+++ b/components/home/alerts.test.tsx
@@ -1,9 +1,11 @@
+import type { ReactNode } from "react";
 import { renderToStaticMarkup } from "react-dom/server";
-import { describe, expect, it } from "vitest";
+import { describe, expect, it, vi } from "vitest";
 import { SyncBarView } from "@/components/sync/SyncBar";
+import { findElements } from "@/components/ui/testTree";
 import type { HomeAlert } from "@/lib/rules/alerts";
 import { ICON_PATHS } from "@/lib/ui/icons";
-import { AlertBanners } from "./AlertBanners";
+import { AlertBanners, type BannerInvite } from "./AlertBanners";

 const red: HomeAlert = {
   key: "few-wet",
@@ -50,6 +52,104 @@ describe("AlertBanners", () => {
   });
 });

+// Spec 2026-11-26 §7.2: the invite to start an illness episode, inside the
+// fever banner, after what the banner already says and offers.
+describe("AlertBanners with the invite", () => {
+  const QUESTION =
+    "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?";
+  const feverHigh: HomeAlert = {
+    key: "fever-high",
+    level: "red",
+    message: "Sốt rất cao: cần đi khám ngay.",
+  };
+  const invite = (alertKey: string, over: Partial<BannerInvite> = {}) => ({
+    alertKey,
+    busy: false,
+    onStart: () => {},
+    onDismiss: () => {},
+    ...over,
+  });
+  const render = (alerts: HomeAlert[], value: BannerInvite | null) =>
+    renderToStaticMarkup(<AlertBanners alerts={alerts} invite={value} />);
+  // The banner (a direct child of the list) that holds a text.
+  const bannerWith = (html: string, text: string) =>
+    html
+      .split('role="alert"')
+      .slice(1)
+      .find((part) => part.includes(text)) ?? "";
+
+  it("yellow: the question and two buttons after Phân loại triệu chứng", () => {
+    const html = render([fever, pale], invite("fever"));
+    const banner = bannerWith(html, ">Bé sốt nhẹ</p>");
+    const order = [
+      ">Bé sốt nhẹ</p>",
+      ">Phân loại triệu chứng</a>",
+      `>${QUESTION}</p>`,
+      ">Bắt đầu đợt ốm</button>",
+      ">Không</button>",
+    ].map((mark) => banner.indexOf(mark));
+    expect(order.every((index) => index > -1)).toBe(true);
+    expect(order).toEqual([...order].sort((a, b) => a - b));
+    expect(banner).toMatch(/<button[^>]*min-h-11[^>]*border-warn[^>]*>Bắt đầu/);
+    // Only in the banner it rides on.
+    expect(html.match(/Bắt đầu đợt ốm/g)).toHaveLength(1);
+    expect(bannerWith(html, ">Phân bạc màu</p>")).not.toContain(QUESTION);
+  });
+
+  it("red: after Gọi 115 and Phân loại triệu chứng, in the banner's own colours", () => {
+    const html = render([feverHigh, red], invite("fever-high"));
+    const banner = bannerWith(html, "Sốt rất cao");
+    expect(banner.indexOf("Gọi 115</a>")).toBeLessThan(
+      banner.indexOf(QUESTION),
+    );
+    expect(banner.indexOf(">Phân loại triệu chứng</a>")).toBeLessThan(
+      banner.indexOf(QUESTION),
+    );
+    expect(banner).toMatch(
+      /<button[^>]*min-h-11[^>]*border-on-danger[^>]*>Bắt đầu đợt ốm/,
+    );
+    expect(banner).toMatch(/<button[^>]*border-on-danger[^>]*>Không/);
+    expect(bannerWith(html, "Rất ít tã ướt")).not.toContain(QUESTION);
+  });
+
+  it("the banners are unchanged without the invite", () => {
+    expect(render([fever, feverHigh], null)).toBe(
+      renderToStaticMarkup(<AlertBanners alerts={[fever, feverHigh]} />),
+    );
+    expect(render([fever], null)).not.toContain(QUESTION);
+    // An invite for a banner that is not shown shows nowhere.
+    expect(render([pale], invite("fever"))).not.toContain(QUESTION);
+  });
+
+  it("each button reports its tap; Bắt đầu đợt ốm waits while the episode is on its way", () => {
+    const onStart = vi.fn();
+    const onDismiss = vi.fn();
+    // The invite is its own small component inside the banner: draw it too.
+    const [part] = findElements(
+      AlertBanners({
+        alerts: [fever],
+        invite: invite("fever", { onStart, onDismiss }),
+      }),
+      (el) => "invite" in el.props && typeof el.type === "function",
+    );
+    const draw = part.type as (props: typeof part.props) => ReactNode;
+    const buttons = findElements(
+      draw(part.props),
+      (el) => el.type === "button",
+    );
+    expect(buttons.map((button) => button.props.children)).toEqual([
+      "Bắt đầu đợt ốm",
+      "Không",
+    ]);
+    for (const button of buttons) (button.props.onClick as () => void)();
+    expect(onStart).toHaveBeenCalledOnce();
+    expect(onDismiss).toHaveBeenCalledOnce();
+    expect(render([fever], invite("fever", { busy: true }))).toMatch(
+      /<button[^>]*disabled=""[^>]*>Bắt đầu đợt ốm</,
+    );
+  });
+});
+
 describe("SyncBarView", () => {
   it("is a small glass pill with a clock, no emoji", () => {
     const html = renderToStaticMarkup(<SyncBarView count={3} dropped={null} />);
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 203 passed (204)`, `Tests  3 failed | 1920 passed (1923)`. Ba test đỏ trong `alerts.test.tsx`; test "không có lời mời thì banner như cũ" xanh ngay (prop `invite` chưa được đọc). Ở bước này `tsc` báo lỗi vì `AlertBanners` chưa nhận `invite`: bình thường, Step 4 hết.

- [ ] **Step 3: Thêm lời mời vào banner (Patch 4)**

```diff
diff --git a/components/home/AlertBanners.tsx b/components/home/AlertBanners.tsx
index b7c4670..cac328d 100644
--- a/components/home/AlertBanners.tsx
+++ b/components/home/AlertBanners.tsx
@@ -6,7 +6,53 @@ import type { HomeAlert } from "@/lib/rules/alerts";
 const PILL =
   "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-transform duration-[120ms] active:scale-[0.97]";

-export function AlertBanners({ alerts }: { alerts: HomeAlert[] }) {
+// Spec 2026-11-26 §5.5 and §7.2: the invite to start an illness episode, on
+// the fever banner whose key is `alertKey` (inviteAlert).
+export type BannerInvite = {
+  alertKey: string;
+  // "Bắt đầu đợt ốm" is on its way.
+  busy: boolean;
+  onStart: () => void;
+  onDismiss: () => void;
+};
+
+// Spec §7.2: after the banner's own words and buttons, which stay first. The
+// buttons take the banner's border colour, so neither outranks the banner's
+// own buttons.
+function Invite({ invite, border }: { invite: BannerInvite; border: string }) {
+  return (
+    <>
+      <p className="mt-3 text-[15px] leading-5">
+        Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?
+      </p>
+      <div className="mt-3 flex flex-wrap gap-2">
+        <button
+          type="button"
+          disabled={invite.busy}
+          onClick={invite.onStart}
+          className={`${PILL} border ${border} disabled:opacity-50`}
+        >
+          Bắt đầu đợt ốm
+        </button>
+        <button
+          type="button"
+          onClick={invite.onDismiss}
+          className={`${PILL} border ${border}`}
+        >
+          Không
+        </button>
+      </div>
+    </>
+  );
+}
+
+export function AlertBanners({
+  alerts,
+  invite = null,
+}: {
+  alerts: HomeAlert[];
+  invite?: BannerInvite | null;
+}) {
   if (alerts.length === 0) return null;
   return (
     <div className="flex flex-col gap-2.5">
@@ -31,6 +77,9 @@ export function AlertBanners({ alerts }: { alerts: HomeAlert[] }) {
                 Phân loại triệu chứng
               </Link>
             </div>
+            {invite?.alertKey === alert.key && (
+              <Invite invite={invite} border="border-on-danger" />
+            )}
           </div>
         ) : (
           <Glass
@@ -47,6 +96,9 @@ export function AlertBanners({ alerts }: { alerts: HomeAlert[] }) {
                 Phân loại triệu chứng
               </Link>
             )}
+            {invite?.alertKey === alert.key && (
+              <Invite invite={invite} border="border-warn" />
+            )}
           </Glass>
         ),
       )}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  204 passed (204)`, `Tests  1923 passed (1923)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/home/AlertBanners.tsx components/home/alerts.test.tsx
git commit -m "feat(illness): the invite to start an episode in the fever banner" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 3: Nối đợt ốm vào tab Hôm nay (§5.5, §5.6, §7)

**Files:**

- Create: `components/home/useHomeIllness.ts`
- Modify: `components/home/HomeScreen.tsx`
- Test: `components/home/homescreen.test.tsx`

**Interfaces:**

- Consumes: `useEpisodes`, `useEpisodeActions` (`lib/data/illness.ts`, M2a); `useRangeLogs` (`lib/data/logs.ts`, M2e); `planClose` (M2e); `inviteAlert`, `inviteStartedAt`, `closeReminder`, `planStart(episodes, now, startedAt)`, `homeEpisodeCard`, `closeReminderView`, `inviteDismissKey`, `closeSnoozeKey`, `useStoredTime` (M3a); `EpisodeCard`, `CloseReminder` (Task 1); `AlertBanners` có `invite` (Task 2); `useToast`, `toVietnameseError`, `useQuickActions().openInstant`.
- Produces: `useHomeIllness(input: { baby: Baby; userId: string; logs: LogLike[]; alerts: HomeAlert[]; now: Date }): HomeIllness`, với `type HomeIllness = { invite: BannerInvite | null; card: HomeEpisodeView | null; reminder: { view: CloseReminderView; busy: boolean; onClose: () => void; onSnooze: () => void } | null }`. `HomeScreen` vẽ lời mời trong banner, thẻ đợt ốm và thẻ nhắc đóng ngay dưới `AlertBanners` và `LongTimerBanner`, trên `HeroCardView`.

- [ ] **Step 1: Viết test đỏ (Patch 5)**

Test giả lập `useEpisodes`, `useEpisodeActions`, `useRangeLogs`, `useStoredTime` và `useToast`, rồi bọc `AlertBanners` và hai thẻ để giữ lại các hàm bấm mà `HomeScreen` trao cho chúng (cùng cách test sẵn có làm với `QuickLogGrid`). `useStoredTime` giả trả ngay giờ đã lưu, như sau khi trang đã đọc xong `localStorage`.

```diff
diff --git a/components/home/homescreen.test.tsx b/components/home/homescreen.test.tsx
index ed0213d..41ad578 100644
--- a/components/home/homescreen.test.tsx
+++ b/components/home/homescreen.test.tsx
@@ -2,7 +2,7 @@ import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { renderToStaticMarkup } from "react-dom/server";
 import { beforeEach, describe, expect, it, vi } from "vitest";
 import { SyncBarProvider } from "@/components/sync/SyncSlot";
-import type { Baby, LogRow } from "@/lib/supabase/rows";
+import type { Baby, EpisodeRow, LogRow } from "@/lib/supabase/rows";
 import { HomeScreen } from "./HomeScreen";

 const NOW = vi.hoisted(() => new Date("2026-11-14T05:00:00Z")); // 12:00 giờ VN
@@ -11,14 +11,45 @@ const state = vi.hoisted(() => ({
   actionError: null as Error | null,
   // The handler HomeScreen gave to the "Khác" button.
   onMore: null as ((event?: unknown) => void) | null,
+  // The baby's illness episodes (useEpisodes) and the open one's logs.
+  episodes: { data: undefined } as { data: EpisodeRow[] | undefined },
+  rangeLogs: { data: undefined } as { data: LogRow[] | undefined },
+  // Times kept on the device, by key.
+  stored: {} as Record<string, number>,
+  // What HomeScreen handed to the banners and to the episode cards.
+  banners: null as Record<string, unknown> | null,
+  card: null as Record<string, unknown> | null,
+  reminder: null as Record<string, unknown> | null,
 }));
 const openActionSheet = vi.hoisted(() => vi.fn());
+const openInstant = vi.hoisted(() => vi.fn());
+const useRangeLogs = vi.hoisted(() => vi.fn());
+const startEpisode = vi.hoisted(() => vi.fn());
+const updateEpisode = vi.hoisted(() => vi.fn());
+const markStored = vi.hoisted(() => vi.fn());
+const toast = vi.hoisted(() => vi.fn());

 vi.mock("@/lib/hooks/useNow", () => ({ useNow: () => NOW }));
 vi.mock("@/lib/data/logs", () => ({
   useRecentLogs: () => state.logs,
   useFirstLogAt: () => ({ data: null }),
+  useRangeLogs,
 }));
+vi.mock("@/lib/data/illness", () => ({
+  useEpisodes: () => state.episodes,
+  useEpisodeActions: () => ({
+    start: { isPending: false, mutate: startEpisode },
+    update: { isPending: false, mutate: updateEpisode },
+  }),
+}));
+// The hook reads the device after the first render; here it has been read.
+vi.mock("@/lib/hooks/useStoredTime", () => ({
+  useStoredTime: (key: string | null) => ({
+    at: key === null ? null : (state.stored[key] ?? null),
+    mark: (now: Date) => markStored(key, now),
+  }),
+}));
+vi.mock("@/components/ui/Toast", () => ({ useToast: () => toast }));
 vi.mock("@/lib/data/realtime", () => ({ useLogsRealtime: () => {} }));
 vi.mock("@/lib/data/family", () => ({ useMembers: () => ({ data: [] }) }));
 vi.mock("@/lib/data/emergency", () => ({ useEmergencyContacts: () => {} }));
@@ -30,7 +61,7 @@ vi.mock("@/components/actions/QuickActions", () => ({
     error: state.actionError,
     pressTimer: () => {},
     stopTimer: () => {},
-    openInstant: () => {},
+    openInstant,
     openActionSheet,
   }),
 }));
@@ -44,6 +75,31 @@ vi.mock("./QuickLogGrid", async (importOriginal) => {
     },
   };
 });
+vi.mock("./AlertBanners", async (importOriginal) => {
+  const actual = await importOriginal<typeof import("./AlertBanners")>();
+  type Props = Parameters<typeof actual.AlertBanners>[0];
+  return {
+    AlertBanners: (props: Props) => {
+      state.banners = props;
+      return actual.AlertBanners(props);
+    },
+  };
+});
+vi.mock("./EpisodeHomeCards", async (importOriginal) => {
+  const actual = await importOriginal<typeof import("./EpisodeHomeCards")>();
+  type CardProps = Parameters<typeof actual.EpisodeCard>[0];
+  type ReminderProps = Parameters<typeof actual.CloseReminder>[0];
+  return {
+    EpisodeCard: (props: CardProps) => {
+      state.card = props;
+      return actual.EpisodeCard(props);
+    },
+    CloseReminder: (props: ReminderProps) => {
+      state.reminder = props;
+      return actual.CloseReminder(props);
+    },
+  };
+});
 vi.mock("@/components/sync/SyncBar", () => ({
   SyncBar: ({ userId }: { userId: string }) => <p>sync:{userId}</p>,
 }));
@@ -117,7 +173,23 @@ function expectInOrder(html: string, marks: string[]) {
 beforeEach(() => {
   state.actionError = null;
   state.onMore = null;
-  openActionSheet.mockClear();
+  state.episodes = { data: undefined };
+  state.rangeLogs = { data: undefined };
+  state.stored = {};
+  state.banners = null;
+  state.card = null;
+  state.reminder = null;
+  for (const mock of [
+    openActionSheet,
+    openInstant,
+    startEpisode,
+    updateEpisode,
+    markStored,
+    toast,
+  ])
+    mock.mockClear();
+  useRangeLogs.mockReset();
+  useRangeLogs.mockImplementation(() => state.rangeLogs);
 });

 // The loading shapes follow the page of spec 2026-11-19 §3: hero 104, three
@@ -272,3 +344,158 @@ describe("HomeScreen with logs", () => {
     expect(openActionSheet.mock.calls).toEqual([[["other"]]]);
   });
 });
+
+const episode = (
+  id: string,
+  start: string,
+  end: string | null = null,
+): EpisodeRow => ({
+  id,
+  baby_id: "b1",
+  started_at: start,
+  ended_at: end,
+  created_by: "u1",
+  created_at: start,
+  updated_at: start,
+});
+const QUESTION =
+  "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?";
+// DAY has a fever of 38,5 at 11:50; the baby is 65 days old, so the banner
+// is the red one for babies under 3 months.
+const FEVER_BANNER = "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay.";
+
+// Spec 2026-11-26 §7.2 and §5.5.
+describe("HomeScreen: the invite to start an illness episode", () => {
+  it("rides on the fever banner when the baby has no open episode", () => {
+    state.episodes = {
+      data: [episode("old", "2026-11-01T01:00:00Z", "2026-11-03T01:00:00Z")],
+    };
+    const html = loaded(DAY);
+    expect(html.indexOf(FEVER_BANNER)).toBeLessThan(html.indexOf(QUESTION));
+    expect(state.banners?.invite).toMatchObject({
+      alertKey: "fever-infant",
+      busy: false,
+    });
+    // No open episode: no card, no reminder, and the open episode's logs are
+    // not read.
+    expect(html).not.toContain("Đang ốm");
+    expect(useRangeLogs).toHaveBeenLastCalledWith("b1", "", null, false);
+  });
+
+  it("is not offered before the episodes are known, nor after Không on this device", () => {
+    expect(loaded(DAY)).not.toContain(QUESTION);
+    expect(state.banners?.invite).toBeNull();
+    state.episodes = { data: [] };
+    state.stored = {
+      "kb.illness.inviteDismissedAt.b1": NOW.getTime() - 3_600_000,
+    };
+    expect(loaded(DAY)).not.toContain(QUESTION);
+  });
+
+  it("Bắt đầu đợt ốm starts at the first fever reading and stays on Hôm nay; Không is kept on this device", () => {
+    state.episodes = { data: [] };
+    loaded(DAY);
+    const invite = state.banners?.invite as {
+      onStart: () => void;
+      onDismiss: () => void;
+    };
+    invite.onStart();
+    expect(startEpisode).toHaveBeenCalledOnce();
+    const [variables, options] = startEpisode.mock.calls[0];
+    expect(variables).toEqual({ startedAt: at("04:50") });
+    expect(options.onSuccess).toBeUndefined();
+    options.onError(new Error("boom"));
+    expect(toast).toHaveBeenCalledWith("Có lỗi xảy ra: boom");
+    invite.onDismiss();
+    expect(markStored).toHaveBeenCalledWith(
+      "kb.illness.inviteDismissedAt.b1",
+      NOW,
+    );
+  });
+});
+
+// Spec §7.1 and §7.3.
+describe("HomeScreen with an open illness episode", () => {
+  // Opened two days ago, at 09:00 Vietnam time.
+  const open = episode("ep1", "2026-11-12T02:00:00Z");
+
+  it("the card sits under the banners and the long timer, above the hero; no invite", () => {
+    state.episodes = { data: [open] };
+    state.rangeLogs = { data: DAY };
+    const html = loaded(DAY);
+    expectInOrder(html, [
+      "cần đi khám ngay",
+      "Còn đang nằm sấp không?",
+      ">Đang ốm · ngày 3</span>",
+      "Đang sốt · 38,5°C\u00a0lúc\u00a011:50",
+      ">Đang ngủ<",
+    ]);
+    expect(html).toContain('href="/dot-om/chi-tiet?id=ep1"');
+    expect(html).not.toContain(QUESTION);
+    expect(useRangeLogs).toHaveBeenLastCalledWith(
+      "b1",
+      "2026-11-12T02:00:00Z",
+      null,
+      true,
+    );
+    // Fever 10 minutes ago: nothing to remind.
+    expect(html).not.toContain("48 giờ");
+  });
+
+  it("the three buttons of the card open the quick-log sheets", () => {
+    state.episodes = { data: [open] };
+    state.rangeLogs = { data: DAY };
+    loaded(DAY);
+    (state.card?.onLog as (type: string) => void)("symptom");
+    expect(openInstant).toHaveBeenCalledWith("symptom");
+  });
+
+  it("the card has no state line while the episode's logs load", () => {
+    state.episodes = { data: [open] };
+    const html = loaded(DAY);
+    expect(html).toContain(">Đang ốm · ngày 3</span>");
+    expect(html).not.toContain("Đang sốt ·");
+    expect(html).not.toContain("48 giờ");
+  });
+
+  it("48 quiet hours: the reminder right under the card; Bé đã khỏi closes, Chưa waits a day", () => {
+    state.episodes = { data: [open] };
+    state.rangeLogs = { data: [] };
+    const html = loaded([]);
+    expectInOrder(html, [
+      ">Đang ốm · ngày 3</span>",
+      "48 giờ qua không có triệu chứng hay liều hạ sốt nào",
+      "Đợt ốm bắt đầu 12/11 xong chưa?",
+      ">Bé đã khỏi</button>",
+      ">Chưa</button>",
+      ">Bấm giờ<",
+    ]);
+    const reminder = state.reminder as {
+      onClose: () => void;
+      onSnooze: () => void;
+    };
+    reminder.onClose();
+    expect(updateEpisode).toHaveBeenCalledOnce();
+    const [variables, options] = updateEpisode.mock.calls[0];
+    expect(variables).toEqual({
+      id: "ep1",
+      patch: { ended_at: NOW.toISOString() },
+    });
+    options.onSuccess();
+    expect(toast).toHaveBeenCalledWith("Đã đóng đợt ốm");
+    reminder.onSnooze();
+    expect(markStored).toHaveBeenCalledWith(
+      "kb.illness.closeSnoozedAt.ep1",
+      NOW,
+    );
+  });
+
+  it("no reminder for a day after Chưa on this device", () => {
+    state.episodes = { data: [open] };
+    state.rangeLogs = { data: [] };
+    state.stored = {
+      "kb.illness.closeSnoozedAt.ep1": NOW.getTime() - 3_600_000,
+    };
+    expect(loaded([])).not.toContain("48 giờ");
+  });
+});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  1 failed | 203 passed (204)`, `Tests  7 failed | 1924 passed (1931)`. Bảy test đỏ trong `homescreen.test.tsx`; test "Chưa thì không nhắc trong một ngày" xanh ngay (nó chỉ khẳng định thẻ nhắc không hiện). Các test cũ của Hôm nay vẫn xanh: khi danh sách đợt ốm chưa có (`data: undefined`) trang như trước.

- [ ] **Step 3: Viết hook và nối vào Hôm nay (Patch 6)**

```diff
diff --git a/components/home/HomeScreen.tsx b/components/home/HomeScreen.tsx
index 7ca93d0..ab6ddd7 100644
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -21,6 +21,7 @@ import { ageDays, formatAgeVi } from "@/lib/rules/time";
 import { nextBreastSide, overdueTimers } from "@/lib/rules/timer";
 import type { Baby } from "@/lib/supabase/rows";
 import { AlertBanners } from "./AlertBanners";
+import { CloseReminder, EpisodeCard } from "./EpisodeHomeCards";
 import { HeroCardView } from "./HeroCard";
 import { HomeHeader } from "./HomeHeader";
 import { HomeSkeleton } from "./HomeSkeleton";
@@ -31,6 +32,7 @@ import { StatsSection } from "./StatsSection";
 import { StatusTiles } from "./StatusTiles";
 import { TimerButtons } from "./TimerButtons";
 import { TimerRow } from "./TimerRow";
+import { useHomeIllness } from "./useHomeIllness";
 import { VitaminDButton } from "./VitaminDButton";

 export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
@@ -62,6 +64,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
     triageAvailable: true,
     now,
   });
+  const illness = useHomeIllness({ baby, userId, logs: rows, alerts, now });
   const hero = heroState({
     logs: rows,
     feedIntervalMin: baby.feed_interval_min,
@@ -90,7 +93,7 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
         <HomeSkeleton />
       ) : (
         <>
-          <AlertBanners alerts={alerts} />
+          <AlertBanners alerts={alerts} invite={illness.invite} />

           {overdueTimers(rows, now).map((log) => (
             <LongTimerBanner
@@ -102,6 +105,18 @@ export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
             />
           ))}

+          {illness.card && (
+            <EpisodeCard view={illness.card} onLog={actions.openInstant} />
+          )}
+          {illness.reminder && (
+            <CloseReminder
+              view={illness.reminder.view}
+              busy={illness.reminder.busy}
+              onClose={illness.reminder.onClose}
+              onSnooze={illness.reminder.onSnooze}
+            />
+          )}
+
           {failed ? (
             <ErrorCard
               message={toVietnameseError(logs.error)}
diff --git a/components/home/useHomeIllness.ts b/components/home/useHomeIllness.ts
new file mode 100644
index 0000000..fb580f4
--- /dev/null
+++ b/components/home/useHomeIllness.ts
@@ -0,0 +1,150 @@
+"use client";
+
+import { useToast } from "@/components/ui/Toast";
+import { closeSnoozeKey, inviteDismissKey } from "@/lib/data/storedTime";
+import { toVietnameseError } from "@/lib/data/errors";
+import { useEpisodeActions, useEpisodes } from "@/lib/data/illness";
+import { useRangeLogs } from "@/lib/data/logs";
+import { useStoredTime } from "@/lib/hooks/useStoredTime";
+import type { HomeAlert } from "@/lib/rules/alerts";
+import type { LogLike } from "@/lib/rules/describeLog";
+import {
+  closeReminder,
+  inviteAlert,
+  inviteStartedAt,
+} from "@/lib/rules/illness";
+import { planClose, planStart } from "@/lib/rules/illnessForm";
+import {
+  closeReminderView,
+  type CloseReminderView,
+  homeEpisodeCard,
+  type HomeEpisodeView,
+} from "@/lib/rules/illnessView";
+import type { Baby } from "@/lib/supabase/rows";
+import type { BannerInvite } from "./AlertBanners";
+
+export type HomeIllness = {
+  // Spec 2026-11-26 §7.2: the invite on the fever banner, or null.
+  invite: BannerInvite | null;
+  // Spec §7.1: the card of the open episode, or null.
+  card: HomeEpisodeView | null;
+  // Spec §7.3: the reminder to close it, or null.
+  reminder: {
+    view: CloseReminderView;
+    busy: boolean;
+    onClose: () => void;
+    onSnooze: () => void;
+  } | null;
+};
+
+// Spec §5.5, §5.6 and §7: what the home page shows of illness episodes.
+// `logs` and `alerts` are the page's recent logs and banners; `now` is its
+// clock, which the one-tap actions use too. Nothing shows while the episodes
+// are unknown (loading, or offline without a copy), nor before the answers
+// kept on this device have been read.
+export function useHomeIllness(input: {
+  baby: Baby;
+  userId: string;
+  logs: LogLike[];
+  alerts: HomeAlert[];
+  now: Date;
+}): HomeIllness {
+  const { baby, userId, logs, alerts, now } = input;
+  const toast = useToast();
+  const episodes = useEpisodes(baby.id);
+  const actions = useEpisodeActions(baby.id, userId);
+  const all = episodes.data;
+  const open = all?.find((episode) => episode.ended_at === null) ?? null;
+  // Spec §7: with an episode open, the page reads all of its logs.
+  const range = useRangeLogs(
+    baby.id,
+    open?.started_at ?? "",
+    null,
+    open !== null,
+  );
+  const dismissed = useStoredTime(inviteDismissKey(baby.id));
+  const snoozed = useStoredTime(open ? closeSnoozeKey(open.id) : null);
+
+  const inviteKey =
+    all && dismissed.at !== undefined
+      ? inviteAlert({
+          episodes: all,
+          alerts,
+          logs,
+          dismissedAt: dismissed.at,
+          now,
+        })
+      : null;
+
+  // Spec §5.5: starts at the first fever reading, and stays on this page,
+  // where the episode's card takes the invite's place. A refusal is a toast
+  // and nothing is queued (§5.7).
+  function start() {
+    if (!all || actions.start.isPending) return;
+    const plan = planStart(all, now, inviteStartedAt(logs, all, now));
+    if (!plan.ok) {
+      toast(plan.message);
+      return;
+    }
+    actions.start.mutate(
+      { startedAt: plan.startedAt },
+      { onError: (error) => toast(toVietnameseError(error)) },
+    );
+  }
+
+  // Spec §6.3 item 7, from the reminder: no question asked.
+  function close() {
+    if (!all || !open) return;
+    const plan = planClose(open, all, now);
+    if (!plan.ok) {
+      toast(plan.message);
+      return;
+    }
+    actions.update.mutate(
+      { id: open.id, patch: plan.patch },
+      {
+        onSuccess: () => toast("Đã đóng đợt ốm"),
+        onError: (error) => toast(toVietnameseError(error)),
+      },
+    );
+  }
+
+  const reminderKind =
+    open && range.data && snoozed.at !== undefined
+      ? closeReminder({
+          episode: open,
+          logs: range.data,
+          snoozedAt: snoozed.at,
+          now,
+        })
+      : null;
+
+  return {
+    invite: inviteKey
+      ? {
+          alertKey: inviteKey,
+          busy: actions.start.isPending,
+          onStart: start,
+          onDismiss: () => dismissed.mark(now),
+        }
+      : null,
+    card: open
+      ? homeEpisodeCard({ episode: open, logs: range.data, now })
+      : null,
+    reminder:
+      open && reminderKind && range.data
+        ? {
+            view: closeReminderView({
+              kind: reminderKind,
+              episode: open,
+              logs: range.data,
+              babyName: baby.name,
+              now,
+            }),
+            busy: actions.update.isPending,
+            onClose: close,
+            onSnooze: () => snoozed.mark(now),
+          }
+        : null,
+  };
+}
```

- [ ] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  204 passed (204)`, `Tests  1931 passed (1931)`; `tsc --noEmit` không báo lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/home/useHomeIllness.ts components/home/HomeScreen.tsx components/home/homescreen.test.tsx
git commit -m "feat(illness): the illness episode on Hôm nay" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 4: Kiểm cuối M3b, checklist, spec, rồi đưa lên `main`

**Files:**

- Create rồi xóa trước khi commit: `app/fixture-illness/page.tsx` (trang tạm, không commit)
- Modify: `docs/device-checklist.md`, `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md`, file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của các task trước trong plan này.
- Produces: kết quả kiểm, ghi ngay trong plan; phần M3 của Bước 38; ba chỗ đọc spec của M3 ghi vào spec (§7.1, §7.2, §7.3); `main` có M3b, tức mốc M3 của spec xong.

- [ ] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  204 passed (204)`, `Tests  1931 passed (1931)`.

- [ ] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages (42/42)` và thoát mã 0.

- [ ] **Step 3: Tạo trang fixture tạm**

Dữ liệu thật không có đợt ốm và không được tạo đợt, ghi lần đo sốt hay bấm lời mời trên dữ liệu thật, nên ba khối mới chỉ thấy đủ ở đây. Trang dùng `AlertBanners`, `EpisodeCard`, `CloseReminder` (không hook) với dữ liệu giả, không đọc hay ghi dữ liệu của gia đình, vẽ được khi chưa đăng nhập. Tạo `app/fixture-illness/page.tsx` (không commit):

```tsx
"use client";

import { AlertBanners } from "@/components/home/AlertBanners";
import { CloseReminder, EpisodeCard } from "@/components/home/EpisodeHomeCards";
import type { HomeAlert } from "@/lib/rules/alerts";
import type { LogLike } from "@/lib/rules/describeLog";
import type { CloseCase, EpisodeLike } from "@/lib/rules/illness";
import { closeReminderView, homeEpisodeCard } from "@/lib/rules/illnessView";

// Giờ cố định, để máy chủ và trình duyệt vẽ giống nhau.
const NOW = new Date("2026-11-26T10:00:00+07:00");
const iso = (text: string) =>
  new Date(`${text.replace(" ", "T")}:00+07:00`).toISOString();
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

const BANNERS: { name: string; alert: HomeAlert }[] = [
  {
    name: "banner vàng",
    alert: {
      key: "fever",
      level: "yellow",
      message: "Bé đang sốt — xem Phân loại triệu chứng.",
    },
  },
  {
    name: "banner đỏ, dưới 3 tháng",
    alert: {
      key: "fever-infant",
      level: "red",
      message: "Bé dưới 3 tháng sốt ≥ 38°C: cần đi khám ngay.",
    },
  },
  {
    name: "banner đỏ, sốt rất cao",
    alert: {
      key: "fever-high",
      level: "red",
      message: "Sốt rất cao: cần đi khám ngay.",
    },
  },
];

const CARDS: { name: string; logs: LogLike[] | undefined }[] = [
  { name: "chưa tải", logs: undefined },
  { name: "chưa đo", logs: [] },
  { name: "đang sốt", logs: [temp("2026-11-26 07:05", 38.6)] },
  { name: "chưa đo lại", logs: [temp("2026-11-25 21:10", 39.4)] },
  {
    name: "hết sốt, dài nhất",
    logs: [temp("2026-11-25 11:00", 38.2), temp("2026-11-25 23:59", 37.4)],
  },
  {
    name: "hết sốt chưa đầy 1 giờ",
    logs: [temp("2026-11-26 09:10", 38.2), temp("2026-11-26 09:50", 37.4)],
  },
  { name: "không sốt", logs: [temp("2026-11-26 07:05", 37.4)] },
];

const REMINDERS: { kind: CloseCase; logs: LogLike[] }[] = [
  {
    kind: "no-fever",
    logs: [temp("2026-11-24 23:40", 38.6), temp("2026-11-25 08:00", 37.2)],
  },
  { kind: "unchecked", logs: [temp("2026-11-24 23:40", 38.6)] },
  { kind: "quiet", logs: [] },
];

export default function Page() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-3.5 p-4">
      {BANNERS.map(({ name, alert }) => (
        <div key={name} data-case={name} className="flex flex-col gap-2">
          <p className="px-1 text-xs text-muted">{name}</p>
          <AlertBanners
            alerts={[alert]}
            invite={{
              alertKey: alert.key,
              busy: false,
              onStart: () => {},
              onDismiss: () => {},
            }}
          />
        </div>
      ))}
      {CARDS.map(({ name, logs }) => (
        <div key={name} data-case={name} className="flex flex-col gap-2">
          <p className="px-1 text-xs text-muted">thẻ · {name}</p>
          <EpisodeCard
            view={homeEpisodeCard({ episode: OPEN, logs, now: NOW })}
            onLog={() => {}}
          />
        </div>
      ))}
      {REMINDERS.map(({ kind, logs }) => (
        <div key={kind} data-case={kind} className="flex flex-col gap-2">
          <p className="px-1 text-xs text-muted">nhắc đóng · {kind}</p>
          <CloseReminder
            view={closeReminderView({
              kind,
              episode: OPEN,
              logs,
              babyName: "Bun",
              now: NOW,
            })}
            busy={false}
            onClose={() => {}}
            onSnooze={() => {}}
          />
        </div>
      ))}
    </main>
  );
}
```

Run: `bun run typecheck`
Expected: `tsc --noEmit` không báo lỗi.

- [ ] **Step 4: Kiểm trong trình duyệt (chỉ xem)**

Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Mở `http://localhost:3000/fixture-illness` trong khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi). Xóa phần tử `nextjs-portal` trong trang trước khi chụp.

Trên trang tạm:

1. Ba banner ("banner vàng", "banner đỏ, dưới 3 tháng", "banner đỏ, sốt rất cao"): chữ và nút sẵn có của banner đứng trước; sau đó câu "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?" (hai dòng) và hai nút viền "Bắt đầu đợt ốm", "Không" trên một hàng, cao 44 px. Ở banner đỏ, "Gọi 115" vẫn là nút nổi nhất (nền sáng), hai nút mới chỉ có viền.
2. Bảy thẻ đợt ốm: ô tròn nhiệt kế màu `cat-temp` nhạt, "Đang ốm · ngày 3" đậm, dòng phụ, mũi tên; ba nút "Nhiệt độ", "Thuốc", "Triệu chứng". Thẻ "chưa tải" không có dòng phụ. Hai thẻ "hết sốt" có dòng phụ hai dòng, xuống dòng **sau dấu "·"**: "Hết sốt 23 giờ ·" / "37,4°C lúc 25/11 23:59". Không thẻ nào tách "25/11" khỏi "23:59".
3. Ba thẻ nhắc đóng: icon tròn theo trường hợp (dấu tích xanh, đồng hồ vàng, nhiệt kế trung tính), tiêu đề đậm, dòng "Đợt ốm bắt đầu 24/11 xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa.", rồi hai nút "Bé đã khỏi" (nền nhấn) và "Chưa" cạnh nhau.
4. Chạy đoạn đo dưới. Khi viết plan, ở 375 px: banner 343×246, 343×244, 343×220, câu hỏi 2 dòng, nút 144×44 và 80×44; thẻ đợt ốm 343×136 (dòng phụ 1 dòng) và 343×150 (2 dòng), hàng trên là đường dẫn 309×44 / 309×58; thẻ nhắc 343×168 (tiêu đề 1 dòng, dòng phụ 3 dòng) và 343×190 cho `quiet` (tiêu đề 2 dòng), nút 151×44; `scrollWidth <= innerWidth` là `true`; không phần tử nào có `text-overflow: ellipsis`.

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
  banners: [...document.querySelectorAll("[role=alert]")].map(
    (b) =>
      `${box(b)}, câu hỏi ${lines(b.querySelector("p.mt-3"))} dòng, nút ${[...b.querySelectorAll("button")].map(box).join(" ")}`,
  ),
  cards: [...document.querySelectorAll("section.glass a")].map(
    (a) =>
      `${[...a.querySelectorAll("span.flex-col > span")].map((s) => `${s.textContent}: ${lines(s)} dòng`).join(" | ")}; đường dẫn ${box(a)}; thẻ ${box(a.closest("section"))}`,
  ),
  reminders: [...document.querySelectorAll("section.glass h2")].map(
    (h) =>
      `${h.textContent}: ${lines(h)} dòng; dòng phụ ${lines(h.nextElementSibling)} dòng; thẻ ${box(h.closest("section"))}`,
  ),
});
```

5. Lặp lại các mục trên trang tạm với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"` (chạy trong trang; không lưu, không đụng Cài đặt). Ở `night`: ba thẻ nhắc khác nhau nhờ icon; hai nút của lời mời đọc được trên banner đỏ và banner vàng.

Trang thật (dữ liệu thật của gia đình: **chỉ xem**; cần đăng nhập trong khung Browser):

6. `http://localhost:3000/`: trang Hôm nay mở như trước, không thẻ lỗi. Gia đình không có đợt ốm đang mở thì không có thẻ đợt ốm. Nếu đang có banner sốt (một lần đo từ 38 trong 6 giờ qua) thì banner có lời mời: **không bấm "Bắt đầu đợt ốm" hay "Không"**, chỉ ghi lại đã thấy. Lệnh đọc `illness_episodes` trả 200: đọc Resource Timing trong trang (`performance.getEntriesByType("resource")`, lọc tên không bắt đầu bằng `location.origin`, đọc `responseStatus`; chỉ in `pathname` và tên tham số). Lọc console bằng `onlyErrors`: không có lỗi. `scrollWidth <= innerWidth` là `true`.
7. Nếu gia đình đã có đợt ốm đang mở (do người dùng tự tạo): thẻ "Đang ốm · ngày …" nằm ngay dưới các banner, trên thẻ lớn của cữ bú/giấc ngủ; dòng phụ đúng với lần đo mới nhất. Chỉ xem, không bấm nút nào của thẻ.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này, kèm số đo; mục nào thấy trên trang thật, mục nào chỉ thấy trên trang tạm. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

- [ ] **Step 5: Xóa trang fixture**

```bash
rm -r app/fixture-illness
bun run typecheck
git status --short  # không còn app/fixture-illness
```

Expected: `tsc --noEmit` không báo lỗi. Nếu nó đỏ với lỗi trong `.next/…/types/validator.ts`: chạy `rm -rf .next/dev/types .next/types` rồi chạy lại, phải sạch.

- [ ] **Step 6: Phần M3 của Bước 38 (Patch 7) và ba chỗ đọc spec (Patch 8), commit**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index b95f721..862b5b8 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -646,7 +646,7 @@ Kết quả: Chờ người dùng.

 ## Bước 38 — Đợt ốm (spec 2026-11-26)

-Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy.
+Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–15; phần của mốc M3 (tab Hôm nay, spec §5.5, §5.6, §7) là mục 16–21. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–12 tạo hai đợt ốm thử và bốn bản ghi thử; mục 15 xóa hết. Mục 11 cần hai máy. Mục 16–19 tạo một đợt ốm thử và ba bản ghi thử, và cần hai máy cùng gia đình; mục 20 xóa hết.

 1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
 2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
@@ -663,6 +663,12 @@ Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; ph
 13. Tắt Ban đêm. Cài đặt › Giao diện › Nền sáng: lần lượt chọn Đào mơ, Oải hương, Biển sương; mỗi lần mở tab Sức khỏe, trang "Đợt ốm" và trang chi tiết của đợt đang mở. Kỳ vọng: dòng "Đợt ốm", thẻ trên cùng, chip, mục "Từng ngày" và biểu đồ (vùng tô có chữ "Sốt", đường 38 nét đứt, nhãn giá trị) đọc rõ. Về lại Hồng dịu.
 14. Có mạng, mở trang "Đợt ốm" rồi trang chi tiết của đợt đang mở. Đóng hẳn app, bật chế độ máy bay, mở lại app → Sức khỏe → "Đợt ốm". Kỳ vọng: trang mở ra (không phải trang "Bạn đang offline"), thẻ "Đang diễn ra" như lúc có mạng. Bấm thẻ đó. Kỳ vọng: trang chi tiết mở ra với thẻ trên cùng và biểu đồ như lúc có mạng. Nếu thay vào đó thấy "Bạn đang offline" hoặc "Cần mạng để …": ghi lại đúng màn hình đã thấy rồi làm tiếp. Tắt chế độ máy bay.
 15. Dọn: mở từng đợt thử, bấm bút chì, "Xóa đợt ốm". Kỳ vọng: hỏi lại "Xóa đợt ốm này? Các bản ghi nhiệt độ, thuốc, triệu chứng vẫn giữ nguyên."; đồng ý thì phiếu đóng và trang tự về danh sách "Đợt ốm", đợt đó không còn. Nếu trang vẫn đứng ở trang chi tiết, hoặc dòng "Không tìm thấy đợt ốm này" ở lại quá một nhịp: ghi lại rồi bấm quay lại "Đợt ốm". Xóa xong cả hai đợt, trang ghi lại "Chưa có đợt ốm nào". Vào Nhật ký xóa bản ghi nhiệt độ 38,5 và bản ghi triệu chứng "Ho" của mục 7, bản ghi nhiệt độ 38,8 của mục 11 và 37,6 của mục 12.
+16. Máy A, tab Hôm nay, bé không có đợt ốm nào đang mở: ở hàng "Ghi nhanh" bấm "Nhiệt độ", nhập 38,5, bấm "Lưu". Kỳ vọng: banner sốt hiện như trước (vàng; đỏ nếu bé dưới 3 tháng), giữ nguyên chữ và các nút của nó; ngay sau các nút ấy có thêm câu "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?" và hai nút "Bắt đầu đợt ốm", "Không". Bấm "Không". Kỳ vọng: câu và hai nút biến mất, banner còn nguyên. Đóng hẳn app rồi mở lại: lời mời vẫn không hiện trên máy A.
+17. Máy B, tab Hôm nay (chờ tới khi thấy lần đo 38,5, tối đa 30 giây). Kỳ vọng: banner sốt có lời mời (lời "Không" ở máy A chỉ có tác dụng trên máy A). Bấm "Bắt đầu đợt ốm". Kỳ vọng: vẫn ở Hôm nay, không có thông báo; lời mời biến mất; ngay dưới banner có thẻ "Đang ốm · ngày 1" với dòng "Đang sốt · 38,5°C lúc …" và ba nút "Nhiệt độ", "Thuốc", "Triệu chứng". Bấm vào hàng trên của thẻ. Kỳ vọng: trang chi tiết của đợt, dòng "Ngày thứ 1 · bắt đầu … lúc …" mang đúng giờ của lần đo 38,5, không phải giờ vừa bấm.
+18. Máy B về Hôm nay, bấm "Triệu chứng" trên thẻ đợt ốm, chọn "Ho", bấm "Lưu". Kỳ vọng: toast Hoàn tác như mọi bản ghi; mở trang chi tiết, hàng "Hôm nay · ngày 1" có chip "Ho". Trên máy A (sau tối đa 2 phút): Hôm nay có thẻ "Đang ốm · ngày 1".
+19. Máy B, trang chi tiết, bấm "Bé đã khỏi", rồi về Hôm nay. Kỳ vọng: thẻ đợt ốm biến mất; banner sốt của lần đo 38,5 vẫn còn nhưng **không** có lời mời (lần đo ấy nằm trong đợt vừa đóng). Ở hàng "Ghi nhanh" bấm "Nhiệt độ", nhập 37,2, "Lưu". Kỳ vọng: banner sốt biến mất.
+20. Dọn: Sức khỏe → Đợt ốm, mở đợt thử, bút chì, "Xóa đợt ốm"; vào Nhật ký xóa ba bản ghi thử (38,5, "Ho", 37,2). Lưu ý: lời "Không" của mục 16 còn giữ trên máy A thêm 24 giờ; trong 24 giờ đó, nếu bé sốt thật, máy A không hiện lời mời (máy B vẫn hiện).
+21. Làm sau, khi có một đợt ốm thật đang mở hơn 48 giờ. Kỳ vọng: dưới thẻ đợt ốm có thẻ nhắc với một trong ba tiêu đề: "{tên bé} đã 48 giờ không sốt" (lần đo cuối dưới 38 và đã 48 giờ từ lần sốt cuối), "48 giờ qua chưa đo lại nhiệt độ" (lần đo cuối vẫn từ 38 và đã 48 giờ không đo), hoặc "48 giờ qua không có triệu chứng hay liều hạ sốt nào"; dòng "Đợt ốm bắt đầu … xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa."; hai nút "Bé đã khỏi", "Chưa". Bấm "Chưa". Kỳ vọng: thẻ nhắc biến mất trên máy này trong 24 giờ, máy kia vẫn thấy. Bật Ban đêm: ba dạng thẻ nhắc khác nhau ở icon (dấu tích, đồng hồ, nhiệt kế) chứ không chỉ ở màu.

 Kết quả: Chờ người dùng.

```

```diff
diff --git a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
index b8bd41e..4d80905 100644
--- a/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
+++ b/docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
@@ -343,12 +343,16 @@ Nằm ngay dưới `AlertBanners` và `LongTimerBanner`, trên `HeroCardView`. C

   "{x}°C lúc {giờ}" luôn là lần đo mới nhất. {giờ} là "{HH:mm}" khi cùng ngày, không thì "{dd/mm} {HH:mm}".

+  Dòng phụ dài hơn một dòng thì xuống dòng sau dấu "·", không bao giờ giữa "{x}°C lúc {giờ}". (Làm ở M3a ngày 2026-11-27, sau bước nhìn thử lúc viết plan M3: ở 375 px "Hết sốt 23 giờ · 37,4°C lúc 25/11 23:59" từng bị tách giữa "25/11" và "23:59"; ghi vào spec ở M3b.)
+
 - Ba nút "Nhiệt độ", "Thuốc", "Triệu chứng" như ở thẻ kết luận.

 ### 7.2 Lời mời (bảng "Lời mời bắt đầu và lời nhắc đóng", nửa trên)

 Khi §5.5 đúng, banner của alert sốt đang hiện (vàng hay đỏ) có thêm, sau các nút sẵn có của nó: câu "Mở một đợt ốm để gom nhiệt độ, thuốc và triệu chứng vào một chỗ?" và hai nút "Bắt đầu đợt ốm", "Không". Chữ và các nút sẵn có của banner giữ nguyên, đứng trước.

+Bấm "Bắt đầu đợt ốm" thì ở lại Hôm nay, không có toast: lời mời biến mất và thẻ đợt ốm (§7.1) hiện ngay dưới banner. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói bấm xong thì đi đâu. Chọn ở M3b ngày 2026-11-27 theo lời duyệt trước của người dùng.)
+
 ### 7.3 Nhắc đóng (cùng bảng, nửa dưới)

 Khi §5.6 đúng, một thẻ `Glass` ngay dưới thẻ đợt ốm:
@@ -356,6 +360,7 @@ Khi §5.6 đúng, một thẻ `Glass` ngay dưới thẻ đợt ốm:
 - Tiêu đề theo trường hợp của §5.6. `no-fever`: "{tên} đã 48 giờ không sốt". `unchecked`: "48 giờ qua chưa đo lại nhiệt độ". `quiet`: "48 giờ qua không có triệu chứng hay liều hạ sốt nào".
 - Dòng phụ: "Đợt ốm bắt đầu {dd/mm} xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa."
 - Nút "Bé đã khỏi" (như §6.3 mục 7) và "Chưa" (hoãn 24 giờ theo §5.6).
+- Bên trái tiêu đề là icon tròn theo §5.2 của trạng thái lúc đó, cùng tông và icon với thẻ kết luận, để ba dạng khác nhau cả ở theme `night`. Ở 375 px tiêu đề của `quiet` dài hai dòng và dòng phụ dài ba dòng; không chữ nào bị cắt. (Khác bản đã duyệt ngày 2026-11-26, vốn không nói icon, và mục 2 chỉ cho dòng mô tả của thẻ tối đa hai dòng. Chọn ở M3b ngày 2026-11-27 theo lời duyệt trước của người dùng.)

 ## 8. Lần khám

```

`docs/device-checklist.md` từ trước đã không theo prettier: không chạy `prettier --write` lên nó.

```bash
git add docs/device-checklist.md docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md
git commit -m "docs: the M3 part of step 38, and three readings of M3 in the spec" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [ ] **Step 7: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của từng task có khớp plan không; kết quả Step 1, Step 2 và Step 4. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này hiện là untracked (??); các file plan khác chưa chạy cũng vậy, không add chúng
git add docs/blueprint/plans/2026-11-27-kim-bun-dot-om-m3b.md
git commit -m "docs(plan): the M3b plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [ ] **Step 8: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m3b
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy trên trang thật, mục nào chỉ thấy trên trang tạm; nhắc người dùng phần M3 của Bước 38 (mục 16–21) đang chờ họ trên hai iPhone thật; nhắc rằng dòng phụ của thẻ nhắc đóng dài ba dòng ở 375 px (khác mục 2 của spec, đã ghi vào §7.3); lỗi nào đã sửa trong phiên; mục nào chưa kiểm.
