# Baby Tracker Web — M21 (Bệnh thường gặp, chốt đợt 2) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Phần cẩm nang "Bệnh thường gặp" (spec §6.6): 10 bài đọc (cảm lạnh, sổ mũi, nôn trớ, táo bón, hăm tã, chàm sữa, nấm miệng, vàng da sinh lý, viêm tiểu phế quản, tiêu chảy), mỗi bài có mục "Khi nào đi khám ngay", ghi nguồn và ngày rà soát. Sau đó ghi kết luận đợt 2 vào checklist thiết bị.

**Architecture:**
- **Nội dung:** `content/conditions.vi.json` (mỗi bài một dòng), kiểm bằng zod trong `lib/content/conditions.ts`.
- **Giao diện:** `components/conditions/ConditionsScreen.tsx` — một trang `/benh-thuong-gap` với 10 khối `<details>` (mở từng bài, có `id` để dẫn link `#ma_bai`), nút "Phân loại triệu chứng" và "Gọi 115" ở đầu.
- **Offline:** nội dung nằm trong bundle; trang được thêm vào service worker.

**Tech Stack:** như M1–M20. Không thêm gói nào.

**Milestones của đợt phát hành 2:**
- M14–M20: xong.
- **M21 (plan này):** bệnh thường gặp và kết luận đợt 2.
- Sau đó: đợt 3 (mốc phát triển, bồng bế, nhạc, tiếng ồn trắng, hút sữa và tummy time, ảnh, báo cáo cho bác sĩ).

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Nguồn:** mỗi bài lấy từ một trang NHS (đọc 2026-11-14): cảm lạnh, cảm lạnh/ho/đau tai ở trẻ, trào ngược ở trẻ, táo bón ở trẻ, hăm tã, chàm (viêm da cơ địa), nấm miệng, vàng da sơ sinh, viêm tiểu phế quản, nôn và tiêu chảy. Trang NHS dùng cho Anh; nội dung đã bỏ số điện thoại và dịch vụ của Anh, thay bằng "đi khám", "gọi 115".
- **Tên bệnh:** bài đọc có tên bệnh ở tiêu đề (đây là cẩm nang, spec cho phép). Kết quả phân loại triệu chứng (M20) vẫn không hiện tên bệnh.
- **Không ghi liều thuốc (§2.1):** chỗ nào nói tới thuốc đều là "hỏi bác sĩ, dược sĩ"; chỉ ghi giới hạn tuổi do nguồn nêu (thuốc bôi nấm miệng cho trẻ trên 4 tháng; không dùng thuốc thông mũi cho trẻ dưới 6 tuổi; không cho trẻ dưới 12 tháng ăn mật ong). Test chặn mẫu liều kiểu "mg", "ml/kg".
- **"Khi nào đi khám ngay":** dấu hiệu riêng của từng bệnh theo NHS, cộng đủ bộ dấu hiệu nguy hiểm chung trùng với câu đỏ của M20 (bỏ bú hoặc bú kém; li bì hoặc co giật; thở nhanh, thở rên, rút lõm hoặc tím tái; sốt từ 38°C dưới 3 tháng, từ 39°C khi 3–6 tháng, từ 40°C mọi tuổi hoặc thân nhiệt dưới 35,5°C; không có tã ướt trong 12 giờ; ban không mất khi ấn ly; thóp phồng). Dấu hiệu nào là đỏ ở M20 thì nằm trong "Khi nào đi khám ngay", không nằm trong "Nên cho bé đi khám".
- **Menu:** Cẩm nang → "Bệnh thường gặp" mở `/benh-thuong-gap`; `activeTab` coi trang này thuộc tab Cẩm nang.
- **Kết luận đợt 2:** phần tự động chạy được ngay; phần điện thoại do người dùng làm. Người dùng đã cho phép trước: việc chỉ người dùng làm được thì ghi "Chờ người dùng", không đánh dấu Đạt.

## Global Constraints

Từ spec §2.1 (nguyên văn):

- Ngôn ngữ giao diện và nội dung: chỉ tiếng Việt (`vi-VN`).
- Múi giờ nghiệp vụ: `Asia/Ho_Chi_Minh` (ranh giới ngày, giờ gửi nhắc tiêm 08:00).
- Lưu thời gian trong DB: `timestamptz` (UTC). Ngày không có giờ: `date`.
- Đơn vị: gram (cân nặng), cm (chiều dài, vòng đầu), °C (nhiệt độ), ml (sữa).
- Mọi khóa chính là UUID v4. Bản ghi `logs` sinh UUID ở client để gửi lại offline không bị trùng.
- Chỉ dùng gói miễn phí: Vercel Hobby, Supabase Free. Không thêm dịch vụ trả phí.
- Bí mật không bao giờ xuống client: `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
- An toàn y tế: app **không** đặt tên bệnh, **không** tính liều thuốc. Mọi màn kết quả triệu chứng có nút gọi `115` và dòng "Thông tin tham khảo, không thay thế bác sĩ."
- Nội dung y tế (lịch tiêm, triệu chứng, mốc phát triển, chuẩn đánh giá) mỗi mục phải ghi `source` (URL) và `reviewedAt` (ngày).
- Đăng nhập chỉ bằng Google (Supabase Auth). Quyền truy cập dữ liệu do danh sách Gmail trong `family_members` quyết định.

Từ spec §2.2, §9 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `@tanstack/react-query-persist-client` 5.105.0, `dexie` 4.4.7, `web-push` 3.6.7, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `@types/web-push` 3.6.4, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x. TypeScript `strict: true`.
- Mọi trang là client component, tự kiểm tra phiên ở client.
- Bản ghi còn trong outbox hiện biểu tượng ⏳. Đầu trang có chip "N mục chờ đồng bộ". Bỏ mục: toast "Không lưu được: <lý do>" (§9).
- Các thao tác ghi không qua outbox cần online: ảnh, thành viên, hồ sơ bé (`babies`), `music_links`, `emergency_contacts`, `notification_prefs`, đăng ký push. Offline thì nút bị tắt kèm chú thích "Cần kết nối mạng" (§9).
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.
- Runtime: Node.js 22.x.

Từ M7:

- File `.tsx` trong `app/` và `components/` chỉ dùng màu theo vai trò (`bg-warn-soft`, `text-warn-ink`, `bg-danger-soft`, `text-danger-ink`…). `lib/themeGuard.test.ts` khóa quy tắc này.

Riêng M21:

- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier). Không chạy prettier trên `content/conditions.vi.json`.
- Câu chữ tiếng Việt trong `content/conditions.vi.json` và `components/conditions/ConditionsScreen.tsx` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, tới commit `da10d4d` của M20):

- `AuthGate`, `GUIDE_ITEMS`/`activeTab` (`lib/nav.ts`), `sw/sw.template.js` (`GUIDES`), `/trieu-chung` (M20), màu theo vai trò (M7)
- `docs/device-checklist.md` tới bước 13

**Produces** (đợt 3 dùng):

- `content/conditions.vi.json`; `lib/content/conditions.ts`: `ConditionArticleSchema`, `ConditionsContentSchema`, `ConditionArticle`, `CONDITIONS`
- `components/conditions/ConditionsScreen.tsx`; trang `/benh-thuong-gap` (link sâu `/benh-thuong-gap#<code>`)
- Checklist bước 14 và dòng "Kết luận đợt 2"

## File Structure

```
content/conditions.vi.json               # 10 bài
lib/content/conditions.ts (+ test)       # schema zod và nạp nội dung
components/conditions/ConditionsScreen.tsx; app/benh-thuong-gap/page.tsx
lib/nav.ts (+ test), sw/sw.template.js   # menu, cache trang
docs/device-checklist.md                 # bước 14, kết luận đợt 2
```

## Tasks

1. Nội dung bệnh thường gặp
2. Trang `/benh-thuong-gap`
3. Checklist bước 14, kết luận đợt 2 và deploy

---

### Task 1: Nội dung bệnh thường gặp

**Files:**

- Create: `content/conditions.vi.json`, `lib/content/conditions.ts`
- Test: `lib/content/conditions.test.ts`

**Interfaces:**

- Consumes: `zod` 4.6.7
- Produces: `ConditionArticle = { code; title; summary; signs; homeCare; seeDoctor; goNow; usualCourse; source; reviewedAt }`, `CONDITIONS = { title; intro; disclaimer; reviewedAt; articles }`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m21.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `da10d4d docs: device checklist step 13 for symptom triage`.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/content/conditions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CONDITIONS } from "./conditions";

describe("content/conditions.vi.json (spec §6.6, §10.2)", () => {
  it("has the ten articles of spec §6.6 in order", () => {
    expect(CONDITIONS.articles.map((a) => a.title)).toEqual([
      "Cảm lạnh",
      "Sổ mũi, nghẹt mũi",
      "Nôn trớ",
      "Táo bón",
      "Hăm tã",
      "Chàm sữa (viêm da cơ địa)",
      "Nấm miệng (tưa lưỡi)",
      "Vàng da sinh lý",
      "Viêm tiểu phế quản",
      "Tiêu chảy",
    ]);
  });

  it("every article has a source, a review date, a unique code and a go-now list", () => {
    const codes = CONDITIONS.articles.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const article of CONDITIONS.articles) {
      expect(article.source, article.code).toMatch(/^https:\/\/www\.nhs\.uk\//);
      expect(article.reviewedAt, article.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.goNow.length, article.code).toBeGreaterThan(0);
    }
  });

  it("gives no medicine doses", () => {
    const text = JSON.stringify(CONDITIONS);
    expect(text).not.toMatch(/\d+\s*(mg|ml\/kg|mg\/kg|giọt\/lần)/i);
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/content/conditions.test.ts`
Expected: FAIL — `Error: Cannot find module './conditions' imported from …/lib/content/conditions.test.ts`

- [ ] **Step 4: Viết file nội dung**

Tạo `content/conditions.vi.json` đúng từng ký tự (mỗi bài một dòng):

```json
{
  "title": "Bệnh thường gặp",
  "intro": "Bài đọc tham khảo về các bệnh nhẹ hay gặp ở trẻ nhỏ. Khi bé có dấu hiệu lạ, dùng Phân loại triệu chứng hoặc hỏi bác sĩ.",
  "disclaimer": "Thông tin tham khảo, không thay thế bác sĩ.",
  "reviewedAt": "2026-11-14",
  "articles": [
    {"code": "cam_lanh", "title": "Cảm lạnh", "summary": "Bệnh nhẹ do virus ở mũi, họng; trẻ nhỏ có thể bị nhiều lần trong năm.", "signs": ["Sổ mũi hoặc nghẹt mũi, hắt hơi", "Ho, khàn tiếng, có thể sốt nhẹ", "Quấy, bú kém hơn, ngủ không yên, thở bằng miệng", "Có thể nôn sau khi ho"], "homeCare": ["Cho bé bú mẹ hoặc bú bình như thường, chia nhiều cữ nhỏ nếu bé nghẹt mũi", "Cho bé nghỉ ngơi, giữ phòng thoáng", "Không cho bé dưới 12 tháng ăn mật ong", "Không dùng thuốc ho, thuốc thông mũi hay thuốc cảm cho trẻ nhỏ khi chưa hỏi bác sĩ hoặc dược sĩ", "Không cho bé xông hơi bằng bát nước nóng (dễ bỏng)"], "seeDoctor": ["Sốt cao kéo dài hơn 3 ngày", "Triệu chứng nặng dần, hoặc sau 10 ngày chưa đỡ", "Ho kéo dài hơn 3 tuần", "Bé lúc nóng lúc lạnh, run", "Bạn thấy lo"], "goNow": ["Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Thường đỡ sau 1–2 tuần; ở trẻ nhỏ có thể lâu hơn.", "source": "https://www.nhs.uk/conditions/common-cold/", "reviewedAt": "2026-11-14"},
    {"code": "so_mui", "title": "Sổ mũi, nghẹt mũi", "summary": "Mũi tắc hoặc chảy nước làm bé khó bú và khó ngủ, thường đi kèm cảm lạnh.", "signs": ["Nước mũi trong, sau đặc và có thể vàng hoặc xanh", "Bé thở khụt khịt, bú ngắt quãng", "Ngủ không yên vì nghẹt mũi"], "homeCare": ["Nhỏ nước muối sinh lý để làm mềm gỉ mũi (hỏi dược sĩ, bác sĩ cách dùng cho trẻ nhỏ)", "Cho bú nhiều cữ nhỏ, nghỉ giữa cữ để bé thở", "Rửa tay trước khi chăm bé", "Không dùng thuốc co mạch, thuốc thông mũi cho trẻ dưới 6 tuổi trừ khi bác sĩ kê"], "seeDoctor": ["Đau tai hoặc bé dụi tai kèm sốt, sau 3 ngày chưa đỡ", "Ho kéo dài hơn 3 tuần", "Bé lúc nóng lúc lạnh, run"], "goNow": ["Bé thở rít, hoặc không nuốt được sữa, nước hay nước bọt", "Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Thường hết trong 2 tuần.", "source": "https://www.nhs.uk/baby/health/colds-coughs-and-ear-infections-in-children/", "reviewedAt": "2026-11-14"},
    {"code": "non_tro", "title": "Nôn trớ", "summary": "Sữa trào ngược lên rất thường gặp ở trẻ dưới 1 tuổi; nếu bé vui vẻ và tăng cân tốt thì thường không đáng lo.", "signs": ["Ọc sữa trong hoặc ngay sau cữ bú", "Ho, nấc khi bú; quấy khi bú", "Ợ hơi, nuốt ực sau bú"], "homeCare": ["Bế bé thẳng người trong và một lúc sau khi bú", "Cho bé ợ hơi nhiều lần trong cữ bú", "Luôn cho bé ngủ nằm ngửa trên mặt phẳng; không kê cao đầu giường, không cho nằm nghiêng hay sấp", "Hỏi nhân viên y tế về tư thế bú hoặc cách pha, cầm bình"], "seeDoctor": ["Bé không tăng cân hoặc sụt cân", "Bắt đầu trớ sau 6 tháng tuổi, hoặc vẫn trớ sau 1 tuổi", "Nôn vọt thành tia", "Bụng chướng, ấn đau", "Bé khóc không dứt, hoặc từ chối bú"], "goNow": ["Nôn ra dịch xanh lá, vàng xanh, hoặc có máu", "Phân có máu", "Nôn nhiều lần, không giữ được chút sữa hay nước nào", "Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Thường bắt đầu trước 8 tuần tuổi và đỡ dần trước 1 tuổi.", "source": "https://www.nhs.uk/conditions/reflux-in-babies/", "reviewedAt": "2026-11-14"},
    {"code": "tao_bon", "title": "Táo bón", "summary": "Bé đi ngoài ít, phân cứng hoặc rặn đau; trẻ bú mẹ hoàn toàn có thể vài ngày mới đi một lần mà vẫn bình thường nếu phân mềm.", "signs": ["Ít hơn 3 lần trong một tuần, phân to cứng hoặc vón cục", "Rặn nhiều, khóc khi đi ngoài", "Có thể dính chút máu khi phân rất cứng", "Biếng ăn, đau bụng đỡ hơn sau khi đi được"], "homeCare": ["Bé bú mẹ: cho bú nhiều hơn", "Bé bú sữa công thức: pha đúng tỷ lệ; hỏi bác sĩ về cho uống thêm nước (dưới 6 tháng chỉ dùng nước đun sôi để nguội)", "Bé đã ăn dặm: thêm rau, trái cây nghiền", "Không tự dùng thuốc nhuận tràng hay thụt hậu môn khi chưa hỏi bác sĩ"], "seeDoctor": ["Bạn nghĩ bé bị táo bón: nên cho bé đi khám sớm", "Táo bón kéo dài dù đã cho bú, ăn nhiều hơn"], "goNow": ["Bụng chướng căng kèm nôn", "Phân có nhiều máu", "Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Điều trị có thể mất vài tháng; nên theo hướng dẫn của bác sĩ.", "source": "https://www.nhs.uk/baby/health/constipation-in-children/", "reviewedAt": "2026-11-14"},
    {"code": "ham_ta", "title": "Hăm tã", "summary": "Da vùng quấn tã đỏ, rát do ẩm ướt và cọ xát; phần lớn nhẹ và chăm tại nhà được.", "signs": ["Mảng đỏ hoặc trợt ở mông, vùng quấn tã", "Nốt sẩn, mụn nước, hoặc da khô bong vảy", "Bé khó chịu, quấy khi thay tã"], "homeCare": ["Thay tã ngay khi ướt hoặc bẩn", "Làm sạch bằng nước hoặc khăn ướt không mùi, không cồn; lau khô nhẹ", "Để bé không mặc tã một lúc mỗi ngày", "Dùng tã thấm tốt, vừa vặn, không quấn chặt", "Không dùng xà phòng, phấn rôm, sữa tắm tạo bọt hay kem sát khuẩn; hỏi dược sĩ về kem bảo vệ da"], "seeDoctor": ["Hăm không đỡ, nặng hơn hoặc lan rộng", "Bé sốt", "Bé rất khó chịu"], "goNow": ["Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Thường đỡ sau vài ngày nếu giữ da sạch, khô.", "source": "https://www.nhs.uk/baby/caring-for-a-newborn/nappy-rash/", "reviewedAt": "2026-11-14"},
    {"code": "cham_sua", "title": "Chàm sữa (viêm da cơ địa)", "summary": "Da khô, ngứa, đỏ từng đợt; ở trẻ nhỏ hay gặp ở má, khuỷu tay, đầu gối.", "signs": ["Da khô, ráp, nứt, đóng vảy hoặc dày lên", "Đỏ hoặc hồng, ngứa nên bé hay cọ mặt", "Lúc nặng lúc nhẹ theo từng đợt"], "homeCare": ["Bôi kem dưỡng ẩm ít nhất 2 lần mỗi ngày, kể cả khi da đã đỡ", "Tắm bằng sữa tắm dịu nhẹ hoặc kem dưỡng thay xà phòng", "Cắt móng tay ngắn, đeo bao tay cho bé", "Tránh xà phòng, bột giặt mạnh, vải thô gây ngứa", "Mẹ đang cho bú không cần kiêng ăn trừ khi bác sĩ khuyên; hỏi bác sĩ trước khi dùng kem có thuốc"], "seeDoctor": ["Da chảy dịch, đóng mày hoặc có mụn mủ", "Da đau, sưng, nóng", "Chàm không đỡ dù đã chăm như trên"], "goNow": ["Chàm phồng rộp, đau, lan nhanh, nhất là khi bé sốt hoặc có vẻ mệt", "Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Không khỏi hẳn ngay nhưng thường đỡ dần khi bé lớn.", "source": "https://www.nhs.uk/conditions/atopic-eczema/", "reviewedAt": "2026-11-14"},
    {"code": "nam_mieng", "title": "Nấm miệng (tưa lưỡi)", "summary": "Mảng trắng trong miệng bé do nấm, hay gặp ở trẻ nhỏ.", "signs": ["Lớp trắng trên lưỡi, có thể ngả vàng hoặc xám, trông như váng sữa đông", "Đốm trắng ở má trong, lợi; lau không sạch", "Bé có thể bú ít, bú ngắt quãng vì khó chịu"], "homeCare": ["Tiệt trùng núm vú giả và bình sữa sau mỗi lần dùng", "Thay núm bình, miếng che đầu ti hằng tuần", "Giặt nóng khăn, yếm, áo ngực khi đang cho bú", "Không tự dùng thuốc; thuốc bôi miệng chỉ dùng cho trẻ trên 4 tháng theo hướng dẫn của dược sĩ, bác sĩ"], "seeDoctor": ["Bé dưới 4 tháng có dấu hiệu nấm miệng", "Dùng thuốc 1 tuần không đỡ", "Bé khó nuốt hoặc đau khi nuốt"], "goNow": ["Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Thường đỡ sau khoảng 1 tuần điều trị.", "source": "https://www.nhs.uk/conditions/oral-thrush-in-babies/", "reviewedAt": "2026-11-14"},
    {"code": "vang_da_sinh_ly", "title": "Vàng da sinh lý", "summary": "Da và lòng trắng mắt vàng ở trẻ sơ sinh, thường tự hết; cần theo dõi sát trong 2 tuần đầu.", "signs": ["Da vàng, rõ nhất khoảng ngày thứ 3", "Lòng trắng mắt vàng", "Thường nhạt dần sau khoảng 2 tuần"], "homeCare": ["Cho bú 8–12 lần mỗi ngày; đánh thức bé dậy bú nếu bé ngủ nhiều", "Theo dõi màu da dưới ánh sáng tự nhiên, màu nước tiểu và màu phân", "Giữ một ít phân bạc màu (nếu có) để cho bác sĩ xem", "Không phơi nắng để chữa vàng da; nếu cần, bác sĩ sẽ chiếu đèn"], "seeDoctor": ["Vàng da không đỡ hoặc đậm dần", "Vàng da kéo dài quá 2 tuần (quá 3 tuần ở bé sinh non)", "Nước tiểu vàng sẫm hoặc nâu"], "goNow": ["Vàng da khi bé chưa đủ 24 giờ tuổi", "Vàng da lan tới lòng bàn tay, lòng bàn chân", "Phân bạc màu: trắng, xám hoặc vàng nhạt như kem", "Bé ưỡn người, co cứng hoặc mềm nhũn, khóc thét the thé", "Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Thường hết sau khoảng 2 tuần.", "source": "https://www.nhs.uk/conditions/jaundice-newborn/", "reviewedAt": "2026-11-14"},
    {"code": "viem_tieu_phe_quan", "title": "Viêm tiểu phế quản", "summary": "Nhiễm virus đường thở nhỏ, hay gặp ở trẻ dưới 2 tuổi, bắt đầu như cảm lạnh.", "signs": ["Sổ mũi, ho, có thể sốt nhẹ", "Sau vài ngày ho nhiều hơn, thở nhanh hoặc khò khè", "Bú ít hơn"], "homeCare": ["Cho bú nhiều cữ nhỏ; bế bé hơi thẳng người khi bú", "Theo dõi bé cả ban đêm", "Không chườm lạnh, không cởi hết đồ để hạ sốt", "Hỏi dược sĩ, bác sĩ trước khi dùng thuốc hạ sốt (không dùng cho bé dưới 2 tháng khi chưa có chỉ định)"], "seeDoctor": ["Cảm lạnh nặng dần", "Bé bú hoặc ăn ít hơn hẳn", "Có dấu hiệu thiếu nước: ít tã ướt hơn, mắt trũng, khóc không có nước mắt", "Bé mệt, quấy, không như mọi khi"], "goNow": ["Bé có lúc ngừng thở", "Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Nặng nhất ngày 3–5; ho thường đỡ trong 3 tuần.", "source": "https://www.nhs.uk/conditions/bronchiolitis/", "reviewedAt": "2026-11-14"},
    {"code": "tieu_chay", "title": "Tiêu chảy", "summary": "Đi ngoài phân lỏng nhiều lần, thường do virus; điều quan trọng nhất là giữ cho bé đủ nước.", "signs": ["Phân lỏng hoặc toàn nước, nhiều lần hơn mọi ngày", "Có thể kèm nôn, sốt", "Mông đỏ do đi ngoài nhiều"], "homeCare": ["Tiếp tục cho bú mẹ hoặc bú bình như thường; cho bú nhiều cữ nhỏ nếu bé nôn", "Không pha sữa loãng hơn hướng dẫn", "Không cho uống nước ép trái cây hay nước ngọt có ga", "Hỏi nhân viên y tế về dung dịch bù nước (ORS) cho trẻ nhỏ", "Rửa tay kỹ sau khi thay tã"], "seeDoctor": ["Bé dưới 12 tháng bị tiêu chảy hoặc nôn: nên hỏi nhân viên y tế sớm", "Có dấu hiệu thiếu nước: ít tã ướt, mắt trũng, thóp trũng, khóc không có nước mắt", "Tiêu chảy hơn 7 ngày, hoặc nôn hơn 2 ngày"], "goNow": ["Phân có máu", "Nôn ra dịch xanh, hoặc nôn ra máu", "Nôn nhiều lần, không giữ được chút sữa hay nước nào", "Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "Bé li bì, khó đánh thức, mềm nhũn, hoặc co giật", "Bé thở nhanh, thở rên, rút lõm lồng ngực, hoặc môi, da tím tái", "Sốt từ 38°C khi bé dưới 3 tháng, từ 39°C khi bé 3–6 tháng, từ 40°C ở mọi tuổi; hoặc thân nhiệt dưới 35,5°C", "Bé không có tã ướt nào trong 12 giờ", "Ban đỏ hoặc tím không mất đi khi ấn ly thủy tinh lên", "Thóp phồng khi bé nằm yên"], "usualCourse": "Tiêu chảy thường hết sau 5–7 ngày, nôn sau 1–2 ngày.", "source": "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/", "reviewedAt": "2026-11-14"}
  ]
}
```

- [ ] **Step 5: Viết schema và phần nạp**

Tạo `lib/content/conditions.ts`:

```ts
import { z } from "zod";
import data from "@/content/conditions.vi.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const lines = z.array(z.string().min(1)).min(1);

export const ConditionArticleSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    title: z.string().min(1),
    summary: z.string().min(1),
    signs: lines,
    homeCare: lines,
    seeDoctor: lines,
    // Spec §6.6: every article has "Khi nào đi khám ngay".
    goNow: lines,
    usualCourse: z.string().min(1),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const ConditionsContentSchema = z
  .object({
    title: z.string().min(1),
    intro: z.string().min(1),
    disclaimer: z.literal("Thông tin tham khảo, không thay thế bác sĩ."),
    reviewedAt: isoDate,
    articles: z.array(ConditionArticleSchema).min(1),
  })
  .strict();

export type ConditionArticle = z.infer<typeof ConditionArticleSchema>;

export const CONDITIONS = ConditionsContentSchema.parse(data);
```

- [ ] **Step 6: Chạy test để thấy đạt**

Run: `bunx vitest run lib/content/conditions.test.ts && bun run typecheck`
Expected: PASS — `Tests  3 passed (3)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 7: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m21.md content/conditions.vi.json lib/content/conditions.ts lib/content/conditions.test.ts && git commit -m "feat(guide): ten common illness articles with sources"
```

---

### Task 2: Trang `/benh-thuong-gap`

**Files:**

- Create: `components/conditions/ConditionsScreen.tsx`, `app/benh-thuong-gap/page.tsx`
- Modify: `lib/nav.ts`, `sw/sw.template.js`
- Test: `lib/nav.test.ts`, `lib/themeGuard.test.ts`, `scripts/sw.test.ts` (đã có)

**Interfaces:**

- Consumes: `CONDITIONS`, `ConditionArticle` (Task 1); `AuthGate`
- Produces: `ConditionsScreen()`; trang `/benh-thuong-gap`; `GUIDE_ITEMS` "Bệnh thường gặp" → `/benh-thuong-gap`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -47,6 +47,12 @@
     );
   });
 
+  it("Cẩm nang opens the common illnesses guide", () => {
+    expect(GUIDE_ITEMS.find((i) => i.label === "Bệnh thường gặp")?.href).toBe(
+      "/benh-thuong-gap",
+    );
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `AssertionError: expected null to be '/benh-thuong-gap'`; `Tests  1 failed | 7 passed (8)`.

- [ ] **Step 3: Sửa menu và service worker**

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -20,7 +20,7 @@
   { label: "Triệu chứng", href: "/trieu-chung" },
   { label: "Phát triển", href: null },
   { label: "Bồng bế", href: null },
-  { label: "Bệnh thường gặp", href: null },
+  { label: "Bệnh thường gặp", href: "/benh-thuong-gap" },
 ];
 
 export const TOOL_ITEMS: MenuItem[] = [
@@ -41,6 +41,7 @@
       "/cam-nang",
       "/tiem-chung",
       "/trieu-chung",
+      "/benh-thuong-gap",
       "/phat-trien",
       "/bong-be",
     ],
```

```diff
--- a/sw/sw.template.js
+++ b/sw/sw.template.js
@@ -26,6 +26,7 @@
   "/khan-cap",
   "/tiem-chung",
   "/trieu-chung",
+  "/benh-thuong-gap",
   "/bong-be",
   "/phat-trien",
 ];
```

- [ ] **Step 4: Tạo `components/conditions/ConditionsScreen.tsx` và `app/benh-thuong-gap/page.tsx`**

```tsx
import Link from "next/link";
import { CONDITIONS, type ConditionArticle } from "@/lib/content/conditions";

const SECTIONS: { key: "signs" | "homeCare" | "seeDoctor"; title: string }[] = [
  { key: "signs", title: "Dấu hiệu" },
  { key: "homeCare", title: "Chăm bé tại nhà" },
  { key: "seeDoctor", title: "Nên cho bé đi khám" },
];

export function ConditionsScreen() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{CONDITIONS.title}</h1>
      <p>{CONDITIONS.intro}</p>
      <div className="flex gap-2">
        <Link
          href="/trieu-chung"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border px-3"
        >
          Phân loại triệu chứng
        </Link>
        <a
          href="tel:115"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-alarm px-3 font-semibold text-on-accent"
        >
          Gọi 115
        </a>
      </div>
      <div className="flex flex-col gap-2">
        {CONDITIONS.articles.map((article) => (
          <Article key={article.code} article={article} />
        ))}
      </div>
      <p className="text-sm text-muted">{CONDITIONS.disclaimer}</p>
    </main>
  );
}

function Article({ article }: { article: ConditionArticle }) {
  return (
    <details id={article.code} className="rounded-2xl border">
      <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">
        {article.title}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">
        <p>{article.summary}</p>
        {SECTIONS.map((section) => (
          <section key={section.key}>
            <h2 className="font-medium">{section.title}</h2>
            <ul className="list-disc pl-5">
              {article[section.key].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <section className="rounded-xl bg-danger-soft p-3 text-danger-ink">
          <h2 className="font-semibold">Khi nào đi khám ngay</h2>
          <ul className="list-disc pl-5">
            {article.goNow.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <p className="text-sm text-muted">
          Thường kéo dài: {article.usualCourse}
        </p>
        <p className="text-sm text-muted">
          Nguồn:{" "}
          <a
            href={article.source}
            className="inline-flex min-h-11 items-center underline"
            target="_blank"
            rel="noreferrer"
          >
            NHS
          </a>{" "}
          (xem lại {article.reviewedAt.split("-").reverse().join("/")})
        </p>
      </div>
    </details>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { ConditionsScreen } from "@/components/conditions/ConditionsScreen";

export default function Page() {
  return <AuthGate need="baby">{() => <ConditionsScreen />}</AuthGate>;
}
```

- [ ] **Step 5: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  265 passed (265)` (261 + 3 + 1); build thành công, có `○ /benh-thuong-gap`.

- [ ] **Step 6: Commit**

```bash
git add components/conditions app/benh-thuong-gap lib/nav.ts lib/nav.test.ts sw/sw.template.js && git commit -m "feat(guide): /benh-thuong-gap with go-now signs for each illness"
```

---

### Task 3: Checklist bước 14, kết luận đợt 2 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 2; toàn bộ checklist bước 7–13
- Produces: bước 14; dòng "Kết luận đợt 2"

- [ ] **Step 1: Thêm bước 14 vào cuối `docs/device-checklist.md`**

Thêm một dòng trống trước tiêu đề mới, rồi:

````markdown
## Bước 14 — Bệnh thường gặp (M21)

1. Cẩm nang → Bệnh thường gặp. Kỳ vọng: 10 mục (Cảm lạnh, Sổ mũi nghẹt mũi, Nôn trớ, Táo bón, Hăm tã, Chàm sữa, Nấm miệng, Vàng da sinh lý, Viêm tiểu phế quản, Tiêu chảy), nút "Phân loại triệu chứng" và "Gọi 115" ở đầu.
2. Mở một mục. Kỳ vọng: Dấu hiệu, Chăm bé tại nhà, Nên cho bé đi khám, khung đỏ "Khi nào đi khám ngay", thời gian thường kéo dài, nguồn NHS.
3. Bật chế độ máy bay, đóng hẳn app rồi mở lại → Cẩm nang → Bệnh thường gặp. Kỳ vọng: vẫn đọc được.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
````

Run: `grep '^## ' docs/device-checklist.md | tail -1`
Expected: `## Bước 14 — Bệnh thường gặp (M21)`.

- [ ] **Step 2: Chạy toàn bộ kiểm thử tự động**

Run: `bun run test && open -a OrbStack && bun run db:start && bun run db:test`
Expected: `Tests  265 passed (265)`; pgTAP `001`…`008` `ok`, `All tests successful.`

- [ ] **Step 3: Ghi kết luận đợt 2**

Thêm ngay dưới dòng "**Kết luận đợt 1 (2026-11-14):** …" ở đầu file (cách một dòng trống):

```markdown
**Kết luận đợt 2 (2026-11-14):** Chờ người dùng. Phần tự động đạt: Vitest 265 test và pgTAP 001–008 xanh. Tiêu chí §11 còn chờ trên điện thoại thật: nhận push nhắc tiêm (bước 9, mục 5) trên ít nhất 1 máy, bước 7 đầy đủ (nhắc thức bị tạm tắt chặn — bước 11 mục 5; nhắc tiêm vẫn đến — bước 9 mục 4–5), và các bước 8–14.
```

- [ ] **Step 4: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist step 14 and release 2 status" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/benh-thuong-gap`
Expected: `200`.

- [ ] **Step 5: 👤 Ghi bước của người dùng**

Bảng kết quả bước 14 để trống. Trong báo cáo cuối ghi: "Checklist bước 8–14 và tiêu chí §11 của đợt 2 chờ người dùng."

---

## Ngoài phạm vi M21

- Đợt 3: mốc phát triển (`/phat-trien`, `milestones_achieved`), bồng bế, nhạc, tiếng ồn trắng, hút sữa và tummy time, ảnh, báo cáo cho bác sĩ.
