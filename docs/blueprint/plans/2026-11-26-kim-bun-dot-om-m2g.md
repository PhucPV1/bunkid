# Kim Bun — Đợt ốm M2g: lối vào Đợt ốm Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-26-kim-bun-dot-om-design.md` (phần `lib/nav.ts` và `sw/sw.template.js` của §6.1; `nav` và `sw` của §10.1; phần M2 của §10.4)

**Status:** approved 2026-11-27 (theo lời duyệt trước của người dùng ngày 2026-11-26)

**Goal:** Bố mẹ thấy dòng "Đợt ốm" ở tab Sức khỏe và mở được hai trang của nó, kể cả khi mất mạng.

**Architecture:**

- **Lối vào:** một mục đứng đầu `HEALTH_SICK` của `lib/nav.ts`; trang Sức khỏe tự vẽ mục đó, và tiền tố `/dot-om` làm sáng tab Sức khỏe ở cả hai trang.
- **Mất mạng:** hai trang được thêm vào `PAGES` của service worker.
- **Checklist thiết bị:** Bước 38 có thêm phần của M2.
- Không thêm gói, không thêm token màu, không thêm icon.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3 `strict`, Vitest, Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-dot-om-m2g`, cắt từ `main` sau khi M2f đã lên. Baseline: 1875 test vitest xanh (200 file), typecheck sạch.

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

1. **Plan này nhỏ và đứng riêng** để M2f không quá dài. Nó chỉ nên lên `main` khi hai trang của M2f đã ở đó (Step 0 kiểm điều này): dòng "Đợt ốm" dẫn tới `/dot-om`.
2. **Tab `health` sáng ở `/dot-om/chi-tiet`** nhờ tiền tố `/dot-om` của mục mới trong `HEALTH_SICK`; không cần thêm gì vào `HEALTH_PREFIXES`.
3. **Trang Sức khỏe không phải sửa:** `HealthScreen` vẽ mọi mục của `HEALTH_SICK`. Test của nó chỉ đổi danh sách thứ tự mong đợi.
4. **Test của service worker thêm một kiểm:** mất mạng, mở `/dot-om/chi-tiet?id=abc` vẫn ra bản đã giữ lúc cài (service worker so địa chỉ bỏ qua phần `?…`).
5. **Dòng mô tả "Gom sốt, thuốc, triệu chứng theo từng đợt"** có thể xuống hai dòng ở 375 px; Global Constraints cho phép dòng mô tả của hàng danh sách tối đa hai dòng.
6. **Không có trang fixture.** Mọi thứ plan này thêm đều thấy được trên trang thật mà không phải ghi gì.
7. **Bước 38 của checklist** có thêm mục 6 đến 13 cho M2. Các việc của §10.4 thuộc mốc sau: bắt đầu đợt từ lời mời và thẻ ở Hôm nay (M3), in Báo cáo kỳ "Đợt ốm" (M4), lần khám có ảnh (M5).
8. **Trên trang thật không tạo đợt ốm.** Lần bấm "Bắt đầu đợt ốm" đầu tiên là của người dùng, theo Bước 38.

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
    on' docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2g.md
}
kb_patch 1 | git apply --verbose   # đổi số 1 thành số patch cần áp
```

- **Đã chạy thử.** 3 patch đã được áp lần lượt lên một bản sao ở ngoài repo, bắt đầu từ commit cuối của M2f trong bản chạy thử. Trong bản chạy thử task code là hai commit (test trước, code sau; còn làm theo plan thì một commit ở Step 5). `tsc --noEmit` sạch sau commit code; số test đỏ và xanh là số đo thật trên cả bộ test. `bun run build` đã chạy xanh trên bản sao ở đúng trạng thái cuối của plan này: 42 trang, `/dot-om` và `/dot-om/chi-tiet` đều là trang tĩnh. Chưa nhìn trong trình duyệt: hàng "Đợt ốm" trên trang Sức khỏe (bước trình duyệt của plan này là lần đầu).
- **pgTAP.** Plan này không đụng DB nên không chạy pgTAP.
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

Plan này là plan cuối của M2. M3 (tab Hôm nay), M4 (so sánh và Báo cáo) và M5 (lần khám) đứng sau và không cần gì thêm từ plan này.

**Consumes (M2f):** hai trang tĩnh `/dot-om` và `/dot-om/chi-tiet`.

**Consumes (đã ở `main` từ trước):** `HEALTH_SICK: NavItem[]`, `activeTab(pathname: string): TabKey | null` (`lib/nav.ts`); `HealthScreen` (`components/health/HealthScreen.tsx`); mảng `PAGES` của `sw/sw.template.js`; icon `calendar`; token `cat-temp`.

**Produces:**

- `lib/nav.ts`: `HEALTH_SICK` có bốn mục, mục đầu là `{ label: "Đợt ốm", href: "/dot-om", icon: "calendar", color: "cat-temp", detail: "Gom sốt, thuốc, triệu chứng theo từng đợt" }`; `/dot-om` và `/dot-om/chi-tiet` sáng tab `health`.
- `sw/sw.template.js`: `PAGES` có `"/dot-om"` và `"/dot-om/chi-tiet"`.
- `docs/device-checklist.md`: Bước 38 có mục 6–13 của M2.
- **Vitest sau M2g (hết M2):** 1875 test, 200 file. **pgTAP:** 17 file, 194 test (từ M2a, không đổi).

---

### Task 1: Dòng "Đợt ốm" ở Sức khỏe, và hai trang trong service worker (§6.1)

**Files:**

- Modify: `lib/nav.ts`, `sw/sw.template.js`
- Test: `lib/nav.test.ts`, `components/health/health.test.tsx`, `scripts/sw.test.ts`

**Interfaces:**

- Consumes: `HEALTH_SICK`, `activeTab` (`lib/nav.ts`); `HealthScreen` vẽ mọi mục của `HEALTH_SICK` nên không phải sửa; `PAGES` của `sw/sw.template.js`; hai trang `/dot-om` và `/dot-om/chi-tiet` (M2f).
- Produces: `HEALTH_SICK[0]` = `{ label: "Đợt ốm", href: "/dot-om", icon: "calendar", color: "cat-temp", detail: "Gom sốt, thuốc, triệu chứng theo từng đợt" }` (bốn mục); `activeTab("/dot-om")` và `activeTab("/dot-om/chi-tiet")` là `"health"`; `PAGES` có `"/dot-om"` và `"/dot-om/chi-tiet"`.

- [x] **Step 0: Kiểm M2f đã xong, rồi tạo nhánh**

```bash
git checkout main && git pull --ff-only
test -f app/dot-om/page.tsx && test -f app/dot-om/chi-tiet/page.tsx && echo "M2f có trên main"
git checkout -b feat/kim-bun-dot-om-m2g
bunx vitest run
```

Expected: dòng `M2f có trên main`; `Test Files  200 passed (200)`, `Tests  1875 passed (1875)`. Không thấy dòng đó thì dừng: M2f chưa lên `main`, và dòng "Đợt ốm" sẽ dẫn tới một trang không có. Số test khác đi vì `main` có commit mới thì vẫn làm tiếp, và ghi lại số xuất phát thật.

- [x] **Step 1: Viết test đỏ (Patch 1)**

```diff
diff --git a/components/health/health.test.tsx b/components/health/health.test.tsx
index e4b930f..0aa0482 100644
--- a/components/health/health.test.tsx
+++ b/components/health/health.test.tsx
@@ -219,6 +219,7 @@ describe("HealthScreen", () => {
       "Thống kê",
       "Khi bé ốm",
       "Khẩn cấp",
+      "Đợt ốm",
       "Triệu chứng",
       "Bệnh thường gặp",
       "Báo cáo cho bác sĩ",
diff --git a/lib/nav.test.ts b/lib/nav.test.ts
index cec1610..daf04da 100644
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -34,6 +34,9 @@ describe("nav", () => {
       "/kham-pha",
       "/cam-nang",
       "/tang-truong/chieu-cao",
+      // Spec 2026-11-26 §6.1: the list of illness episodes and one episode.
+      "/dot-om",
+      "/dot-om/chi-tiet",
       ...HEALTH_PAGES.map((item) => item.href),
     ])
       expect(activeTab(path), path).toBe("health");
@@ -43,6 +46,7 @@ describe("nav", () => {
       "/tiem-chung",
       "/phat-trien",
       "/thong-ke",
+      "/dot-om",
       "/trieu-chung",
       "/benh-thuong-gap",
       "/bao-cao",
@@ -63,6 +67,7 @@ describe("nav", () => {
   it("other pages light no tab, and a prefix alone is not a match", () => {
     expect(activeTab("/nhat-ky-cu")).toBeNull();
     expect(activeTab("/suc-khoe-cu")).toBeNull();
+    expect(activeTab("/dot-om-cu")).toBeNull();
     expect(activeTab("/dang-nhap")).toBeNull();
     expect(activeTab("/cai-app")).toBeNull();
   });
@@ -136,6 +141,13 @@ describe("Sức khỏe and Tiện ích items", () => {
       "Biểu đồ ngủ, bú, tã 7 và 14 ngày",
     ]);
     expect(nav.HEALTH_SICK.map(brief)).toEqual([
+      [
+        "Đợt ốm",
+        "/dot-om",
+        "calendar",
+        "cat-temp",
+        "Gom sốt, thuốc, triệu chứng theo từng đợt",
+      ],
       [
         "Triệu chứng",
         "/trieu-chung",
diff --git a/scripts/sw.test.ts b/scripts/sw.test.ts
index d30a3a4..82f33c1 100644
--- a/scripts/sw.test.ts
+++ b/scripts/sw.test.ts
@@ -106,6 +106,8 @@ describe("service worker", () => {
         "/suc-khoe",
         "/tien-ich",
         "/tang-truong/chieu-cao",
+        "/dot-om",
+        "/dot-om/chi-tiet",
         "/cai-dat/thanh-vien",
         "/cai-dat/nhac-thuoc",
         "/dang-nhap",
@@ -142,6 +144,11 @@ describe("service worker", () => {
     expect(await (await nav("/nhat-ky"))!.text()).toBe("fresh nhat-ky");
     online = false;
     expect(await (await nav("/nhat-ky?x=1"))!.text()).toBe("fresh nhat-ky");
+    // Spec 2026-11-26 §6.1: an episode's page opens offline whatever its id,
+    // from the shell kept at install.
+    expect(await (await nav("/dot-om/chi-tiet?id=abc"))!.text()).toContain(
+      "chunks/dot-om/chi-tiet.js",
+    );
     expect(await (await nav("/xem-them"))!.text()).toContain(
       "chunks/offline.js",
     );
```

- [x] **Step 2: Chạy để thấy đỏ**

Run: `bunx vitest run`
Expected: `Test Files  3 failed | 197 passed (200)`, `Tests  5 failed | 1870 passed (1875)`. Năm test đỏ ở ba file: hai của `nav`, một của trang Sức khỏe, hai của service worker.

- [x] **Step 3: Thêm mục và hai trang (Patch 2)**

```diff
diff --git a/lib/nav.ts b/lib/nav.ts
index 808fa1b..177ff7f 100644
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -60,6 +60,15 @@ export const HEALTH_STATS: NavItem = {
 };

 export const HEALTH_SICK: NavItem[] = [
+  // Spec 2026-11-26 §6.1: first of "Khi bé ốm". /dot-om/chi-tiet lights the
+  // Sức khỏe tab through this prefix.
+  {
+    label: "Đợt ốm",
+    href: "/dot-om",
+    icon: "calendar",
+    color: "cat-temp",
+    detail: "Gom sốt, thuốc, triệu chứng theo từng đợt",
+  },
   {
     label: "Triệu chứng",
     href: "/trieu-chung",
diff --git a/sw/sw.template.js b/sw/sw.template.js
index 056b1f1..e04940a 100644
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -17,6 +17,8 @@ const PAGES = [
   "/thong-ke",
   "/tang-truong",
   "/tang-truong/chieu-cao",
+  "/dot-om",
+  "/dot-om/chi-tiet",
   "/on-trang",
   "/nhac",
   "/anh",
```

- [x] **Step 4: Chạy để thấy xanh**

Run: `bunx vitest run && bun run typecheck`
Expected: `Test Files  200 passed (200)`, `Tests  1875 passed (1875)`; `tsc --noEmit` không báo lỗi.

- [x] **Step 5: Commit**

```bash
git add lib/nav.ts lib/nav.test.ts sw/sw.template.js scripts/sw.test.ts components/health/health.test.tsx
git commit -m "feat(nav): Đợt ốm on Sức khỏe and in the service worker" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

### Task 2: Kiểm cuối M2g, checklist thiết bị, rồi đưa lên `main`

**Files:**

- Modify: `docs/device-checklist.md`, file plan này (ghi kết quả kiểm)

**Interfaces:**

- Consumes: mọi thứ của task trước trong plan này, và hai trang của M2f.
- Produces: kết quả kiểm, ghi ngay trong plan; phần M2 của Bước 38; `main` có M2g, tức người dùng thấy "Đợt ốm" trong app. Mốc M2 của spec xong.

- [x] **Step 1: Chạy cả bộ kiểm**

Run: `bun run typecheck && bunx vitest run`
Expected: `tsc --noEmit` không báo lỗi; `Test Files  200 passed (200)`, `Tests  1875 passed (1875)`.

- [x] **Step 2: Build**

Run: `bun run build`
Expected: lần đầu có thể dừng với thông báo bảo mật của Next.js 16.4.3 (bình thường; không chạy `next upgrade`). Chạy lại đúng lệnh đó: `✓ Generating static pages` và thoát mã 0.

- [x] **Step 3: Kiểm trong trình duyệt (chỉ xem, trên trang thật)**

Plan này không có trang fixture: mọi thứ nó thêm đều nằm trên trang thật. Chạy `bun run dev` (lần đầu có thể dừng vì thông báo bảo mật: chạy lại). Dùng khung Browser của app, cỡ 375×812 (xem mục "Trình duyệt" ở Ghi chú khi thực thi); trang thật cần đăng nhập.

1. `http://localhost:3000/suc-khoe`: mục "Khi bé ốm" có bốn hàng, hàng đầu là "Đợt ốm" với icon lịch và dòng "Gom sốt, thuốc, triệu chứng theo từng đợt", rồi "Triệu chứng", "Bệnh thường gặp", "Báo cáo cho bác sĩ". Dòng mô tả của hàng "Đợt ốm" được xuống tối đa hai dòng và không bị cắt "…": đo số dòng bằng đoạn dưới và ghi lại. Thẻ "Khẩn cấp" và các phần khác của trang như trước.

```js
const lines = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return new Set([...range.getClientRects()].map((r) => Math.round(r.top)))
    .size;
};
JSON.stringify(
  [...document.querySelectorAll('a[href="/dot-om"] span.flex-col > span')].map(
    (el) => `${el.textContent}: ${lines(el)} dòng`,
  ),
);
```

2. Bấm hàng "Đợt ốm": tới `/dot-om`, tiêu đề lớn "Đợt ốm", nút quay lại ghi "Sức khỏe", và tab Sức khỏe **sáng**. **Không bấm "Bắt đầu đợt ốm".**
3. `http://localhost:3000/dot-om/chi-tiet?id=khong-co`: tab Sức khỏe sáng; "Không tìm thấy đợt ốm này"; bấm "Về danh sách" thì về `/dot-om`.
4. `http://localhost:3000/trieu-chung`, `/benh-thuong-gap`, `/bao-cao`: vẫn mở được từ ba hàng còn lại của mục "Khi bé ốm".
5. `document.documentElement.scrollWidth <= window.innerWidth` là `true` ở `/suc-khoe` và `/dot-om`. Lọc console bằng `onlyErrors`: không có lỗi.
6. Lặp mục 1 với `document.documentElement.dataset.theme = "rose"`, `"light"`, `"dark"`, `"night"` (chạy trong trang; không lưu, không đụng Cài đặt): hàng "Đợt ốm" đọc được ở cả bốn theme.

Service worker chỉ chạy ở bản build, không chạy ở `bun run dev`: việc mở hai trang khi mất mạng không kiểm được ở đây, đã có test (Task 1) và nằm trong Bước 38 của checklist.

Dừng `bun run dev` khi xong. Ghi kết quả từng mục ngay dưới bước này. Mục nào không cho thấy được thì ghi "chưa kiểm". Nếu bước này lộ ra lỗi và code phải đổi: sửa (test trước, code sau), rồi chạy lại Step 1 và Step 2 trước khi đi tiếp.

- [x] **Step 4: Thêm phần M2 vào Bước 38 của checklist (Patch 3), commit**

```diff
diff --git a/docs/device-checklist.md b/docs/device-checklist.md
index 8164598..92712b3 100644
--- a/docs/device-checklist.md
+++ b/docs/device-checklist.md
@@ -646,13 +646,21 @@ Kết quả: Chờ người dùng.

 ## Bước 38 — Đợt ốm (spec 2026-11-26)

-Phần của mốc M1 (bản ghi Triệu chứng, spec §3). Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó.
+Phần của mốc M1 (bản ghi Triệu chứng, spec §3) là mục 1–5; phần của mốc M2 (đợt ốm, spec §4–§6) là mục 6–13. Các mốc sau của spec thêm mục của mình vào cuối danh sách này. Mục 2 tạo một bản ghi Triệu chứng thử và mục 4 xóa nó. Mục 6–10 tạo hai đợt ốm thử và hai bản ghi thử; mục 13 xóa hết.

 1. Mở app từ màn hình chính, bấm "+". Kỳ vọng: nhóm "Khác" có năm ô, ô đầu là "Triệu chứng", không chữ nào bị cắt. Bấm "Triệu chứng". Kỳ vọng: phiếu "Triệu chứng" có dòng "Bấm những gì bé đang có.", các chip dưới nhãn "Hay gặp", nút "Xem tất cả … triệu chứng", ô "Ghi chú (không bắt buộc)", rồi "Lúc nào?"; nút "Lưu" mờ và chưa bấm được.
 2. Bấm "Sổ mũi" và "Ho". Kỳ vọng: hai chip đổi sang nền đậm và có dấu ✓; dòng trên ghi "Đã chọn 2."; nút "Lưu" bấm được. Bấm "Xem tất cả … triệu chứng". Kỳ vọng: các chip còn lại hiện theo nhóm "Hô hấp", "Tiêu hóa", "Da", "Hành vi, ăn bú", "Khác"; nút thành "Thu gọn". Gõ ghi chú "thử", bấm "Lưu". Kỳ vọng: toast "Đã ghi Triệu chứng: Sổ mũi, Ho · thử lúc …" có nút "Hoàn tác".
 3. Tab Nhật ký. Kỳ vọng: có dòng "Triệu chứng: Sổ mũi, Ho · thử"; bộ lọc "Nhiệt độ" vẫn hiện dòng này, bộ lọc "Khác" thì không. Về tab Hôm nay, bấm nút "Khác" của hàng "Ghi nhanh". Kỳ vọng: phiếu chỉ có nhóm "Khác", trong đó có ô "Triệu chứng"; hàng "Ghi nhanh" của Hôm nay vẫn năm nút như trước.
 4. Ở Nhật ký bấm vào dòng đó. Kỳ vọng: phiếu "Bản ghi" có hai chip đang chọn và ô "Ghi chú (không bắt buộc)" chứa "thử"; không có ô "Ghi chú" thứ hai. Bỏ chọn "Ho", bấm "Lưu". Kỳ vọng: dòng thành "Triệu chứng: Sổ mũi · thử". Mở lại dòng đó, bấm "Xóa bản ghi".
 5. Bật Ban đêm, mở lại phiếu "Triệu chứng", chọn một chip. Kỳ vọng: chip đang chọn vẫn phân biệt được với chip chưa chọn nhờ nền đậm và dấu ✓.
+6. Tab Sức khỏe. Kỳ vọng: mục "Khi bé ốm" có dòng "Đợt ốm" đứng đầu, trên "Triệu chứng". Bấm vào. Kỳ vọng: trang "Đợt ốm" có nút quay lại "Sức khỏe"; chưa có đợt nào thì ghi "Chưa có đợt ốm nào" kèm dòng "Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ." và nút "Bắt đầu đợt ốm"; tab Sức khỏe vẫn sáng. Bấm "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết mở ra, thẻ trên cùng ghi "Chưa đo nhiệt độ" và "Ngày thứ 1 · bắt đầu … lúc …" đúng giờ vừa bấm, có ba nút "Nhiệt độ", "Thuốc", "Triệu chứng"; thẻ "Nhiệt độ và thuốc hạ sốt" ghi "Chưa có lần đo nào trong đợt này."; mục "Từng ngày" có một hàng "Hôm nay · ngày 1" ghi "Chưa đo · không dùng thuốc"; cuối trang có nút "Bé đã khỏi".
+7. Trong thẻ trên cùng bấm "Nhiệt độ", nhập 38,5, bấm "Lưu". Kỳ vọng: thẻ thành "… đang sốt 38,5°C", hàng "Đo gần nhất" và "Sốt cao nhất" đều ghi 38,5°C; biểu đồ có một chấm kèm số 38,5 nằm trong vùng tô có chữ "Sốt"; hàng hôm nay ghi "Cao nhất 38,5°C · không dùng thuốc" với nhãn "Sốt". Bấm "Triệu chứng", chọn "Ho", bấm "Lưu". Kỳ vọng: hàng hôm nay có chip "Ho".
+8. Bấm nút bút chì ở đầu trang. Kỳ vọng: phiếu "Sửa đợt ốm" có ô "Bắt đầu", nút "Lưu" và "Xóa đợt ốm"; không có ô "Kết thúc", không có "Mở lại đợt ốm". Lùi giờ bắt đầu 2 giờ, bấm "Lưu". Kỳ vọng: dòng dưới tiêu đề của thẻ đổi sang giờ mới. Mở lại phiếu, đặt giờ bắt đầu sang ngày mai, bấm "Lưu". Kỳ vọng: dòng đỏ "Giờ bắt đầu ở tương lai." dưới ô, phiếu không đóng. Đóng phiếu, chọn bỏ thay đổi.
+9. Bấm "Bé đã khỏi". Kỳ vọng: không hỏi lại; toast "Đã đóng đợt ốm"; tiêu đề thẻ thành "Đã khỏi sau 1 ngày"; ba nút và nút "Bé đã khỏi" biến mất. Bấm quay lại "Đợt ốm". Kỳ vọng: mục "Đang diễn ra" là nút "Bắt đầu đợt ốm"; mục "Đã qua" có một hàng "… – … · 1 ngày". Bấm hàng đó, bấm bút chì. Kỳ vọng: phiếu có cả "Bắt đầu" và "Kết thúc", có "Mở lại đợt ốm". Bấm "Mở lại đợt ốm". Kỳ vọng: phiếu đóng, trang lại là đợt đang mở, có ba nút và "Bé đã khỏi"; ở danh sách, thẻ "Đang diễn ra" ghi "Từ … · ngày thứ 1" với chip "Đang sốt" (hoặc "Chưa đo lại" nếu lần đo đã quá 6 giờ) nằm dưới dòng đó.
+10. Bấm "Bé đã khỏi" để đóng đợt. Bật chế độ máy bay. Ở danh sách bấm "Bắt đầu đợt ốm". Kỳ vọng: trang chi tiết của đợt mới mở ra ngay, thanh đồng bộ báo có thay đổi đang chờ. Nếu thay vào đó thấy trang "Bạn đang offline" hoặc "Không tìm thấy đợt ốm này": ghi lại đúng màn hình đã thấy rồi làm tiếp; đợt vừa tạo vẫn nằm trong hàng chờ và sẽ hiện khi có mạng. Tắt chế độ máy bay. Kỳ vọng: sau vài giây thanh đồng bộ hết; đóng hẳn app rồi mở lại, đợt mới vẫn ở mục "Đang diễn ra".
+11. Trên máy thứ hai (đang mở sẵn trang "Đợt ốm" từ trước mục 10, không tải lại). Kỳ vọng: sau tối đa 2 phút thấy đợt mới ở mục "Đang diễn ra".
+12. Bật Ban đêm và mở trang chi tiết của đợt đang mở. Kỳ vọng: trên biểu đồ, lần đo là chấm tròn còn liều hạ sốt là hình thoi; chữ "Sốt" và đường 38 nét đứt vẫn đọc được; thẻ trên cùng vẫn phân biệt được nhờ icon và chữ. Mở trang chi tiết trong Safari bằng một đường dẫn sai mã (thêm vài chữ vào cuối địa chỉ; app đã cài không có thanh địa chỉ). Kỳ vọng: "Không tìm thấy đợt ốm này" và đường dẫn "Về danh sách".
+13. Dọn: mở từng đợt thử, bấm bút chì, "Xóa đợt ốm". Kỳ vọng: hỏi lại "Xóa đợt ốm này? Các bản ghi nhiệt độ, thuốc, triệu chứng vẫn giữ nguyên."; đồng ý thì về trang danh sách và đợt đó không còn. Xóa xong cả hai đợt, trang ghi lại "Chưa có đợt ốm nào". Vào Nhật ký xóa bản ghi nhiệt độ 38,5 và bản ghi triệu chứng "Ho" của mục 7.

 Kết quả: Chờ người dùng.

```

`docs/device-checklist.md` từ trước đã không theo prettier: không chạy `prettier --write` lên nó.

```bash
git add docs/device-checklist.md
git commit -m "docs(checklist): the M2 part of step 38" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

- [x] **Step 5: Ghi kết quả vào plan, commit**

Ghi ngay dưới bước này: số đo đỏ và xanh của Task 1 có khớp plan không; kết quả Step 1, Step 2 và Step 3. Mục nào không cho thấy được thì ghi "chưa kiểm". Đánh dấu `[x]` các bước đã làm.

```bash
git status --short   # file plan này hiện là untracked (??); các file plan khác của M2 chưa chạy cũng vậy, không add chúng
git add docs/blueprint/plans/2026-11-26-kim-bun-dot-om-m2g.md
git commit -m "docs(plan): the M2g plan and its check results" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
```

**Kết quả (2026-11-27, nhánh `feat/kim-bun-dot-om-m2g` cắt từ `main` @ `5f8be01`):**

Số test trong plan lệch 4 so với số thật: M2c thêm 3 test, M2d thêm 1. Mọi con số dưới đây là số đo thật; số của plan cộng 4 thì khớp.

- **Task 1 Step 0:** dòng `M2f có trên main`; nền `Test Files  200 passed (200)`, `Tests  1879 passed (1879)` (plan ghi 1875).
- **Task 1 Step 2 (đỏ):** `Test Files  3 failed | 197 passed (200)`, `Tests  5 failed | 1874 passed (1879)`; năm test đỏ đúng như plan tả (hai của `nav`, một của trang Sức khỏe, hai của service worker). Khớp plan + 4.
- **Task 1 Step 4 (xanh):** 200 file / 1879 test; `tsc --noEmit` thoát 0. Commit `c86f020`. Ba patch áp sạch.
- **Bản sửa sau bước kiểm** (xem mục cuối file): đỏ `1 failed | 199 passed (200)`, `2 failed | 1878 passed (1880)`; xanh 200 file / 1880 test. Commit `c59be69`.
- **Task 2 Step 1 (sau mọi commit code và docs):** `tsc --noEmit` thoát 0; `Test Files  200 passed (200)`, `Tests  1880 passed (1880)` (plan ghi 1875: + 4 từ M2c, M2d, + 1 test của bản sửa).
- **Task 2 Step 2:** `bun run build` lần đầu thoát 1 (thông báo bảo mật của Next.js 16.4.3; không chạy `next upgrade`), lần hai thoát 0: `✓ Generating static pages using 9 workers (42/42)`, `/dot-om` và `/dot-om/chi-tiet` đều `○`. Chạy cả trước và sau bản sửa, giống nhau.
- **Task 2 Step 3 (khung Browser trong app, 375×812, đang đăng nhập, chỉ xem; làm hai lần: trước bản sửa nhãn, và lại sau mọi commit):**
  1. Đạt. `/suc-khoe`, mục "Khi bé ốm": thẻ "Khẩn cấp" (343×101) rồi bốn hàng theo thứ tự "Đợt ốm", "Triệu chứng", "Bệnh thường gặp", "Báo cáo cho bác sĩ". Hàng "Đợt ốm" 341×75 px (vùng chạm ≥ 44 px), icon lịch; đoạn đo: `Đợt ốm: 1 dòng`, `Gom sốt, thuốc, triệu chứng theo từng đợt: 2 dòng` (chữ "đợt" xuống dòng hai), không `line-clamp`, không "…", `scrollHeight` = `clientHeight`. Ba hàng kia 341×56, mỗi dòng 1 dòng. Thẻ "Khẩn cấp" và các mục khác như trước.
  2. Đạt. Bấm hàng "Đợt ốm" (theo `ref`): tới `/dot-om`, tiêu đề lớn "Đợt ốm", nút quay lại "Sức khỏe", tab Sức khỏe có `aria-current="page"`; `GET /rest/v1/illness_episodes` trả 200 (Resource Timing); trạng thái trống "Chưa có đợt ốm nào". Không bấm "Bắt đầu đợt ốm".
  3. Đạt. `/dot-om/chi-tiet?id=khong-co`: tab Sức khỏe sáng, "Không tìm thấy đợt ốm này"; bấm "Về danh sách" về `/dot-om`.
  4. Đạt. Bấm ba hàng còn lại: `/trieu-chung` ("Phân loại triệu chứng"), `/benh-thuong-gap`, `/bao-cao` mở được. `/trieu-chung` không có thanh tab: có từ trước (trang đó ẩn thanh tab theo spec 2026-11-19 §6), không do plan này.
  5. Đạt. `scrollWidth` 375 = `innerWidth` ở `/suc-khoe` và `/dot-om`. Console lọc `onlyErrors`: không có lỗi.
  6. Đạt. `rose`, `light`, `dark`, `night`: hàng "Đợt ốm" đọc được, vẫn 1 + 2 dòng; ở `night` icon và chữ theo tông hổ phách.
  - Chưa kiểm (service worker chỉ chạy ở bản build): mở hai trang khi mất mạng; có test ở Task 1 và mục 14 của Bước 38. Chưa kiểm: theme `peach`, `lavender`, `sea` (mục 13 của Bước 38); iPhone thật.
- **Task 2 Step 4:** Patch 3 áp sạch. Ngoài Patch 3, Bước 38 có thêm các dòng kiểm cho những thứ M2 chưa ai kiểm được trên dữ liệu thật, viết cùng giọng: mục 8 thêm ô ngày giờ trên Safari iOS (bánh xe chọn ngày giờ); mục 11 thêm realtime đổi chip và thẻ trên máy thứ hai (lần đo 38,8); mục 12 thêm lần đo 37,6 để thấy nhãn không nằm trên đường 38, và hình thoi chỉ khi có liều; mục 13 mới: ba nền sáng Đào mơ, Oải hương, Biển sương; mục 14 mới: mở hai trang khi mất mạng từ app đã cài; mục dọn thành mục 15, ghi rõ chỗ dễ hỏng (trang có tự về "Đợt ốm" sau khi xóa không) và xóa thêm hai bản ghi thử của mục 11 và 12. Phần M2 giờ là mục 6–15, tạo hai đợt ốm thử và bốn bản ghi thử. Commit `2a8bdca` (cùng các chỗ sửa spec).
- **Step 6:** chạy ngay sau commit này: `git merge --ff-only` vào `main`, đẩy `origin/main`, xóa nhánh.

- [x] **Step 6: Đưa lên `main`**

Chỉ khi mọi bước trên đều đạt và không còn lỗi đã biết (lỗi tìm thấy khi kiểm phải được sửa, có test, và ghi vào plan trước; sửa xong thì chạy lại Step 1 và Step 2). Không hỏi lại người dùng: xem mục "Lên `main` không cần hỏi" ở Ghi chú khi thực thi.

```bash
git checkout main
git merge --ff-only feat/kim-bun-dot-om-m2g
git push origin main
git rev-parse --short main
git rev-parse --short origin/main   # hai dòng phải giống nhau
```

`git merge --ff-only` từ chối (ai đó đã đẩy thêm lên `main`) thì dừng và báo, không tự rebase.

Báo cáo bằng tiếng Việt: `git log --oneline` của các commit vừa lên `main`; kết quả typecheck, vitest, build; mục nào của bước trình duyệt đã thấy; nhắc người dùng phần M2 của Bước 38 (mục 6–13) đang chờ họ trên iPhone thật, và rằng chưa ai từng bấm "Bắt đầu đợt ốm", "Bé đã khỏi", "Lưu", "Mở lại" hay "Xóa" trên dữ liệu thật; lỗi nào đã sửa trong phiên; mục nào chưa kiểm.

## Bản sửa sau bước kiểm: nhãn giá trị nằm trên đường 38°C (2026-11-27)

**Lỗi (điểm để ngỏ từ M2c và M2f).** Luật đặt nhãn của chấm mới nhất chỉ tránh chấm khác và nhãn của chấm cao nhất, không tránh đường 38 nét đứt. Lần đo mới nhất sát dưới 38,0 (trục một ngày: 37,3 tới 37,6) có nhãn trên chấm nằm đè lên đường; viền nền của chữ chỉ che phần đường ngay sau nét chữ, nên một gạch ló ra sát con số, nhìn thoáng như "37,6-". Trên trang fixture 49 hình ở 375 px, 13 nhãn nằm trên đường (trên chấm: 37,3–37,6, cả giữa trục lẫn sát mép phải; dưới chấm: 38,5 sát mép phải khi trên chấm vướng chấm 38,9; bên cạnh: 38,1 ngay sau 38,6; 37,2 và 36,8 trên thang 34–43).

**Sửa (test trước, code sau; component không đổi, không thêm màu, không thêm chữ).** `feverChartModel` tính thêm cho mỗi chỗ đặt nhãn xem hộp của nhãn có chứa mực 38,0 không. Thứ tự chọn: bỏ chỗ chạm nhãn kia khi còn chỗ khác; trong số còn lại bỏ chỗ nằm trên đường khi còn chỗ khác; rồi lấy chỗ che chấm ít nhất (bằng nhau thì theo thứ tự trên, phải, dưới, trái). Các chỗ trên, cạnh, dưới ở ba độ cao không chồng nhau và luôn có ít nhất hai chỗ, nên bậc thứ hai luôn chọn được. Test mới "the newest label keeps off the 38 line" (37,2–37,7 sang bên phải; 37,1 và 37,8–38,5 vẫn ở trên; sát mép phải 37,5 xuống dưới; 38,9 rồi 38,5 sát mép phải sang trái; thang 34–43 với 37,2 sang bên cạnh). Một kỳ vọng cũ đổi: "đo lại sau một giờ, thấp hơn" nay đặt "38,1" dưới chấm thay vì bên phải (bên phải nằm trên đường). Test của hai bản sửa M2c ("no place is free…", "two readings at the same moment…") không đổi và xanh.

**Đã thử và bỏ:** né chấm trước, đường sau (chỉ dùng đường để phân xử khi che chấm bằng nhau). Trên 600 đợt ngẫu nhiên nó còn 15 đợt nhãn nằm trên đường (cụm đo dày, nơi chỗ trên chấm che ít chấm nhất).

**Đo trên trang fixture tạm** (khối biểu đồ của M2c thêm 31 khối "38: …" có lần đo mới nhất từ 37,2 tới 38,7, giữa trục và sát mép phải; không commit): đoạn đo của M2c thêm `onLine` (đường chạy qua hộp của nhãn, viền tính vào). Sau sửa, 50 khối / 49 hình: `overlaps`, `outside`, `onDot`, `onLine` đều rỗng ở 375 px (hình 317 px), 390 px (332 px), 440 px (382 px), mỗi bề ngang bốn theme `rose`, `light`, `dark`, `night`; khe nhỏ nhất giữa nhãn và đường 2,2 đơn vị viewBox. Nhìn bằng mắt: `rose` (giữa trục 37,5 và 37,6: nhãn bên phải chấm; sát mép phải 37,5: dưới chấm; 38,9 rồi 38,5: bên trái), `night` (dáng 3 ngày của M2f: "37,6" bên phải, không gạch nào sát số; trục 7 ngày 37,5: dưới chấm).

**Trang tạm 600 đợt ngẫu nhiên** (của M2c, cùng hạt giống), 375 px: trước sửa 47 đợt nhãn trên đường, 22 đợt nhãn chạm chấm; sau sửa 0 đợt trên đường, 31 đợt chạm chấm (390 và 440 px: 0 và 32). Chữ đè chữ 0, chữ ra ngoài hình 0, cả trước và sau. Cái giá: 9/600 đợt thêm nhãn chạm một phần một chấm trước ở cụm đo dày, cùng loại giới hạn M2c đã nhận; một nét đứt sau con số đọc nhầm thành dấu, một chấm khuất một phần thì không.

**Spec:** §6.5 ghi luật mới kèm chú thích khác bản duyệt 2026-11-26. Cùng commit, spec ghi bốn cách đọc của plan M2f, mỗi chỗ có chú thích khác bản duyệt: §6.2 nút "Bắt đầu đợt ốm" bỏ qua lần bấm thứ hai; §6.2 trạng thái trống có nút đó và không có tiêu đề mục; §6.2 (và một dòng ở §6.3) hai trang theo realtime của bản ghi; §6.4 xóa xong về `/dot-om` bằng `router.replace`.
