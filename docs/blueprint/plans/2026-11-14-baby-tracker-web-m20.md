# Baby Tracker Web — M20 (Phân loại triệu chứng) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Trang `/trieu-chung` (spec §6.6): bước 1 tuổi và nhiệt độ gần nhất (tự điền từ nhật ký 6 giờ qua, sửa được), bước 2 câu hỏi có/không theo sáu nhóm từ `content/triage.vi.json`, kết quả 🔴 "Đi cấp cứu ngay" / 🟡 "Cho bé đi khám trong 24 giờ" / 🟢 "Theo dõi tại nhà" kèm nút 115, danh bạ khẩn cấp và dòng miễn trừ. Banner đỏ ở trang chủ có thêm nút mở trang này (§7.4).

**Architecture:**
- **Nội dung:** `content/triage.vi.json` (34 câu hỏi: 24 đỏ, 10 vàng; mỗi câu có `source`, `reviewedAt`), kiểm bằng zod trong `lib/content/triage.ts`.
- **Quy tắc thuần** (`lib/rules/triage.ts`): ngưỡng thở nhanh theo tuổi, lọc câu hỏi theo tuổi, các luật nhiệt độ, `evaluateTriage` (đỏ thắng vàng), dòng "Đi khám ngay nếu xuất hiện: …", đọc nhiệt độ gần nhất.
- **Giao diện** (`components/triage/`): `TriageScreen` (bước 1, bước 2, nút kết quả) và `TriageResult` (dùng lại `CallList` của M17).

**Tech Stack:** như M1–M19. Không thêm gói nào.

**Milestones của đợt phát hành 2:**
- M14–M19: xong.
- **M20 (plan này):** phân loại triệu chứng.
- M21: bài "Bệnh thường gặp" trong Cẩm nang, rồi chốt đợt 2.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Nguồn nội dung:** các trang NHS (sốt, nôn và tiêu chảy, nhiễm trùng nặng ở trẻ, viêm đường hô hấp nhỏ, phát ban không mất khi ấn ly, vàng da sơ sinh, mất nước; đọc ngày 2026-11-14) và danh sách dấu hiệu nguy hiểm của WHO IMCI có trong spec. Trang NICE và tài liệu IMCI không đọc tự động được, nên các câu dựa vào danh sách đỏ bắt buộc của spec ghi nguồn là trang ấn phẩm IMCI của WHO.
- **Luật đỏ bắt buộc (§6.6):** mỗi dấu hiệu trong danh sách của spec có một câu hỏi đỏ (`poor_feeding`, `convulsion`, `lethargic`, `fast_breathing`, `chest_indrawing`, `blue_skin`, `vomits_everything`, `bulging_fontanelle`, `jaundice_palms`, `pale_stool`, `bloody_stool`, `few_wet_diapers`), trừ ba luật nhiệt độ tính từ bước 1. Test khóa danh sách này.
- **Nhiệt độ (bước 1):** < 35,5°C đỏ; ≥ 40°C đỏ; ≥ 38°C khi dưới 91 ngày đỏ; ≥ 39°C khi 91–182 ngày cũng đỏ (NHS xếp mức này cùng nhóm với dưới 3 tháng sốt từ 38°C; NICE xếp vàng — app chọn bên an toàn hơn, nên trang chủ có thể báo vàng trong khi trang này báo đỏ cho cùng số đo); còn lại ≥ 38°C vàng. Ô để trống là chưa đo; nhập ngoài 30–43°C thì báo "Nhiệt độ từ 30 đến 43°C, ví dụ 38,5." (dưới 34°C vẫn nhận, để thân nhiệt rất thấp ra đỏ).
- **Thở nhanh:** câu hỏi ghi thẳng ngưỡng theo tuổi (60 / 50 / 40 lần/phút) qua chỗ `{fastBreathing}` trong nội dung.
- **Lọc theo tuổi:** "Bé có dưới 4 tã ướt trong 24 giờ qua" chỉ hỏi từ 6 ngày tuổi (như §7.2, §7.4, vì vài ngày đầu ít tã là bình thường); mọi tuổi đều có câu đỏ "Bé không có tã ướt nào trong 12 giờ qua" (NHS). Dưới câu dưới-4-tã hiện "Nhật ký ghi N tã ướt trong 24 giờ qua.", hoặc "Nhật ký chưa ghi tã nào trong 24 giờ qua." khi không có bản ghi tã. "Bé chưa đủ 24 giờ tuổi mà da đã vàng" chỉ hỏi tới 1 ngày tuổi; "Bé dưới 3 tháng sờ thấy nóng… mà chưa đo được nhiệt độ" tới 90 ngày; "Bé dưới 12 tháng đang bị nôn hoặc tiêu chảy" tới 364 ngày; "Bé bú ít hơn mọi ngày nhưng vẫn được hơn một nửa" (vàng) từ 60 ngày, còn dưới 60 ngày là câu đỏ "Bé dưới 2 tháng bú ít hơn mọi ngày". Test khóa: chỉ bốn câu đỏ có giới hạn tuổi.
- **Bú kém (§6.6, đỏ):** câu đỏ gồm "bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày"; bú ít hơn nhưng vẫn hơn một nửa là vàng từ 60 ngày tuổi; dưới 60 ngày mọi mức bú ít hơn đều đỏ (WHO coi bú kém ở trẻ dưới 2 tháng là dấu hiệu nguy hiểm).
- **Dấu hiệu đỏ thêm theo NHS/WHO:** thở rít khi nằm yên, sợ ánh sáng, cứng cổ, ban không mất khi ấn ly, nôn dịch xanh, khóc yếu hoặc thét, tay chân lạnh bất thường, thở rên hoặc ngừng thở, vàng da trong 24 giờ đầu, bé dưới 3 tháng có vẻ sốt chưa đo được.
- **Kết quả:** có dấu hiệu đỏ → đỏ; không có đỏ nhưng có vàng → vàng; còn lại → xanh. Danh sách lý do ghi dấu hiệu đỏ trước, rồi vàng, theo thứ tự câu hỏi (nhiệt độ đứng đầu mỗi mức). Kết quả xanh thêm "Chăm bé tại nhà" (`homeCare`); kết quả xanh và vàng có dòng "Đi khám ngay nếu xuất hiện: <ngưỡng sốt theo tuổi>, thân nhiệt dưới 35,5°C, <các dấu hiệu đỏ>.".
- **An toàn y tế (§2.1):** không kết quả nào hiện tên bệnh; hướng dẫn chăm không ghi liều thuốc ("Không tự cho bé uống thuốc khi chưa hỏi bác sĩ hoặc dược sĩ…"). Test chặn một số tên bệnh trong nội dung.
- **Nút gọi:** trang câu hỏi có nút "Gọi cấp cứu 115" ở đầu và cuối; "Làm lại" cuộn lên đầu trang; màn kết quả có `CallList` (115 rồi danh bạ gia đình) — đúng "nút gọi bác sĩ (danh bạ khẩn cấp)".
- **Trang chủ (§7.4):** `homeAlerts` nhận `triageAvailable: true`, nên câu sốt vàng đổi thành "Bé đang sốt — xem Phân loại triệu chứng." và banner đó có nút "Phân loại triệu chứng"; banner đỏ có thêm nút "Phân loại triệu chứng" cạnh "Gọi 115".
- **Offline:** `/trieu-chung` đã có trong service worker (M9); nội dung nằm trong bundle; danh bạ đã tải sẵn ở trang chủ (M17).
- **Bước của người dùng:** checklist bước 13 cần điện thoại thật; ghi là đang chờ.

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

Riêng M20:

- Trước khi viết code, đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (yêu cầu của `AGENTS.md`).
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier). Không chạy prettier trên `content/triage.vi.json` (mỗi mục một dòng).
- Câu chữ tiếng Việt trong `content/triage.vi.json`, `lib/rules/triage.ts` và `components/triage/` phải đúng từng ký tự như plan này.
- Không đọc, không in, không commit giá trị bí mật nào.

## Contracts with Other Plans

**Consumes** (đã có trong repo, tới commit `5448ffd` của M19):

- M17: `CallList({ contacts })`, `useEmergencyContacts(familyId)`
- M3–M6: `useRecentLogs(babyId)` (`lib/data/logs.ts`); `wetDiapersInWindow` (`lib/rules/ratings.ts`); `ageDays`, `formatAgeVi` (`lib/rules/time.ts`); `homeAlerts({ …, triageAvailable })` (`lib/rules/alerts.ts`), `AlertBanners`, `HomeScreen`
- `GUIDE_ITEMS` (`lib/nav.ts`); `/trieu-chung` trong `GUIDES` của `sw/sw.template.js` (M9)

**Produces** (M21 và đợt 3 dùng):

- `content/triage.vi.json`; `lib/content/triage.ts`: `TriageQuestionSchema`, `TriageContentSchema`, `TriageQuestion`, `TriageContent`, `TRIAGE`
- `lib/rules/triage.ts`: `TriageLevel`, `RESULT_TITLE`, `fastBreathingRate`, `questionText`, `visibleQuestions`, `Finding`, `temperatureFindings`, `TriageResult`, `evaluateTriage`, `goNowIf`, `recentCelsius`, `parseCelsius`
- `components/triage/TriageScreen.tsx`, `TriageResult.tsx`; trang `/trieu-chung`; `GUIDE_ITEMS` "Triệu chứng" → `/trieu-chung`
- Checklist bước 13

## File Structure

```
content/triage.vi.json                   # 6 nhóm, 34 câu hỏi, hướng dẫn chăm tại nhà
lib/content/triage.ts (+ test)           # schema zod và nạp nội dung
lib/rules/triage.ts (+ test)             # luật nhiệt độ, thở nhanh, đỏ thắng vàng
components/triage/TriageScreen.tsx, TriageResult.tsx; app/trieu-chung/page.tsx
lib/nav.ts (+ test), components/home/HomeScreen.tsx, components/home/AlertBanners.tsx
docs/device-checklist.md                 # bước 13
```

## Tasks

1. Nội dung phân loại triệu chứng
2. Quy tắc phân loại
3. Trang `/trieu-chung` và nút ở banner trang chủ
4. Checklist bước 13 và deploy

---

### Task 1: Nội dung phân loại triệu chứng

**Files:**

- Create: `content/triage.vi.json`, `lib/content/triage.ts`
- Test: `lib/content/triage.test.ts`

**Interfaces:**

- Consumes: `zod` 4.6.7
- Produces: `TriageQuestion = { code; group; level: "red" | "yellow"; text; short; minAgeDays?; maxAgeDays?; source; reviewedAt }`, `TriageContent = { title; disclaimer; reviewedAt; groups; homeCare; homeCareSource; questions }`, `TRIAGE`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m20.md` (file plan này, đi chung commit của Task 1). Commit mới nhất là `5448ffd docs: device checklist step 12 for growth`.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/content/triage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TRIAGE } from "./triage";

describe("content/triage.vi.json (spec §6.6, §10.2)", () => {
  it("every question has a source, a review date, a known group and a unique code", () => {
    const groups = new Set(TRIAGE.groups.map((g) => g.code));
    const codes = TRIAGE.questions.map((q) => q.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const q of TRIAGE.questions) {
      expect(q.source, q.code).toMatch(/^https:\/\//);
      expect(q.reviewedAt, q.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(groups.has(q.group), q.code).toBe(true);
    }
  });

  it("keeps the six groups of spec §6.6 in order", () => {
    expect(TRIAGE.groups.map((g) => g.name)).toEqual([
      "Sốt",
      "Hô hấp",
      "Tiêu hóa",
      "Da",
      "Hành vi, ăn bú",
      "Khác",
    ]);
  });

  it("has a red question for every mandatory danger sign that is not a temperature", () => {
    const red = new Set(
      TRIAGE.questions.filter((q) => q.level === "red").map((q) => q.code),
    );
    for (const code of [
      "poor_feeding",
      "convulsion",
      "lethargic",
      "fast_breathing",
      "chest_indrawing",
      "blue_skin",
      "vomits_everything",
      "bulging_fontanelle",
      "jaundice_palms",
      "pale_stool",
      "bloody_stool",
      "few_wet_diapers",
    ])
      expect(red.has(code), code).toBe(true);
  });

  it("asks the mandatory red signs at every age, except the age-specific ones", () => {
    const limited = TRIAGE.questions
      .filter((q) => q.level === "red")
      .filter((q) => q.minAgeDays !== undefined || q.maxAgeDays !== undefined)
      .map((q) => q.code);
    expect(limited).toEqual([
      "feels_hot_infant",
      "few_wet_diapers",
      "jaundice_first_day",
      "feeding_less_infant",
    ]);
  });

  it("never names a disease as a finding", () => {
    const text = JSON.stringify(TRIAGE).toLowerCase();
    for (const word of [
      "viêm phổi",
      "viêm màng não",
      "nhiễm trùng huyết",
      "sốt xuất huyết",
      "chẩn đoán",
    ])
      expect(text).not.toContain(word);
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/content/triage.test.ts`
Expected: FAIL — `Error: Cannot find module './triage' imported from …/lib/content/triage.test.ts`

- [ ] **Step 4: Viết file nội dung**

Tạo `content/triage.vi.json` đúng từng ký tự (mỗi nhóm, mỗi câu một dòng):

```json
{
  "title": "Phân loại triệu chứng",
  "disclaimer": "Thông tin tham khảo, không thay thế bác sĩ.",
  "reviewedAt": "2026-11-14",
  "groups": [
    {"code": "fever", "name": "Sốt"},
    {"code": "breathing", "name": "Hô hấp"},
    {"code": "digestion", "name": "Tiêu hóa"},
    {"code": "skin", "name": "Da"},
    {"code": "behaviour", "name": "Hành vi, ăn bú"},
    {"code": "other", "name": "Khác"}
  ],
  "homeCare": [
    "Cho bé bú mẹ hoặc bú bình như bình thường; bé mệt thì cho bú ít một, nhiều lần.",
    "Mặc thoáng cho bé, không ủ ấm quá mức, không lau người bằng nước lạnh hay cồn.",
    "Theo dõi bé thường xuyên, kể cả ban đêm; ghi nhiệt độ và số tã ướt vào nhật ký.",
    "Không tự cho bé uống thuốc khi chưa hỏi bác sĩ hoặc dược sĩ về loại thuốc và liều theo cân nặng.",
    "Làm lại phân loại này khi bé có thêm dấu hiệu mới."
  ],
  "homeCareSource": "https://www.nhs.uk/conditions/fever-in-children/",
  "questions": [
    {"code": "feels_hot_infant", "group": "fever", "level": "red", "text": "Bé dưới 3 tháng sờ thấy nóng hoặc có vẻ sốt mà chưa đo được nhiệt độ", "short": "bé dưới 3 tháng có vẻ sốt", "maxAgeDays": 90, "source": "https://www.nhs.uk/conditions/fever-in-children/", "reviewedAt": "2026-11-14"},
    {"code": "fever_rash", "group": "fever", "level": "yellow", "text": "Bé sốt kèm phát ban", "short": "sốt kèm phát ban", "source": "https://www.nhs.uk/conditions/fever-in-children/", "reviewedAt": "2026-11-14"},
    {"code": "fever_5_days", "group": "fever", "level": "yellow", "text": "Bé sốt đã từ 5 ngày trở lên", "short": "sốt từ 5 ngày", "source": "https://www.nhs.uk/conditions/fever-in-children/", "reviewedAt": "2026-11-14"},
    {"code": "fever_cold_hands", "group": "fever", "level": "red", "text": "Tay chân bé lạnh bất thường trong khi người bé đang sốt hoặc run", "short": "tay chân lạnh bất thường", "source": "https://www.nhs.uk/conditions/fever-in-children/", "reviewedAt": "2026-11-14"},
    {"code": "fast_breathing", "group": "breathing", "level": "red", "text": "Bé thở từ {fastBreathing} lần/phút trở lên (đếm đủ 60 giây khi bé nằm yên, không khóc)", "short": "thở nhanh", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "chest_indrawing", "group": "breathing", "level": "red", "text": "Phần ngực dưới xương sườn của bé bị rút lõm vào mỗi khi hít vào", "short": "rút lõm lồng ngực", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "grunting_pauses", "group": "breathing", "level": "red", "text": "Bé thở rên, hoặc có lúc ngừng thở", "short": "thở rên, ngừng thở", "source": "https://www.nhs.uk/conditions/bronchiolitis/", "reviewedAt": "2026-11-14"},
    {"code": "stridor", "group": "breathing", "level": "red", "text": "Bé thở rít (tiếng rít khi hít vào) cả lúc nằm yên", "short": "thở rít khi nằm yên", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "blue_skin", "group": "breathing", "level": "red", "text": "Môi, lưỡi hoặc da bé tím tái, xám, hoặc tái nhợt loang lổ", "short": "tím tái, da loang lổ", "source": "https://www.nhs.uk/conditions/sepsis/", "reviewedAt": "2026-11-14"},
    {"code": "cold_worse", "group": "breathing", "level": "yellow", "text": "Bé ho, sổ mũi và ngày càng nặng hơn", "short": "ho, sổ mũi nặng dần", "source": "https://www.nhs.uk/conditions/bronchiolitis/", "reviewedAt": "2026-11-14"},
    {"code": "vomits_everything", "group": "digestion", "level": "red", "text": "Bé nôn ra tất cả mọi thứ, không giữ lại được chút sữa hay nước nào", "short": "nôn ra tất cả", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "green_vomit", "group": "digestion", "level": "red", "text": "Bé nôn ra dịch màu xanh lá hoặc vàng xanh", "short": "nôn dịch xanh", "source": "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/", "reviewedAt": "2026-11-14"},
    {"code": "bloody_stool", "group": "digestion", "level": "red", "text": "Phân có máu, hoặc tiêu chảy có máu", "short": "tiêu chảy có máu", "source": "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/", "reviewedAt": "2026-11-14"},
    {"code": "pale_stool", "group": "digestion", "level": "red", "text": "Phân bạc màu: trắng, xám hoặc vàng nhạt như kem", "short": "phân bạc màu", "source": "https://www.nhs.uk/conditions/jaundice-newborn/", "reviewedAt": "2026-11-14"},
    {"code": "no_wet_12h", "group": "digestion", "level": "red", "text": "Bé không có tã ướt nào trong 12 giờ qua", "short": "không có tã ướt trong 12 giờ", "source": "https://www.nhs.uk/conditions/sepsis/", "reviewedAt": "2026-11-14"},
    {"code": "few_wet_diapers", "group": "digestion", "level": "red", "text": "Bé có dưới 4 tã ướt trong 24 giờ qua", "short": "dưới 4 tã ướt trong 24 giờ", "minAgeDays": 6, "source": "https://www.nhs.uk/conditions/dehydration/", "reviewedAt": "2026-11-14"},
    {"code": "repeated_vomit", "group": "digestion", "level": "yellow", "text": "Bé nôn nhiều lần nhưng vẫn giữ lại được một ít sữa hoặc nước", "short": "nôn nhiều lần", "source": "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/", "reviewedAt": "2026-11-14"},
    {"code": "long_diarrhoea", "group": "digestion", "level": "yellow", "text": "Tiêu chảy hơn 7 ngày, hoặc nôn hơn 2 ngày", "short": "tiêu chảy hơn 7 ngày, nôn hơn 2 ngày", "source": "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/", "reviewedAt": "2026-11-14"},
    {"code": "dehydration_signs", "group": "digestion", "level": "yellow", "text": "Ít tã ướt hơn mọi ngày, mắt trũng, hoặc khóc không có nước mắt", "short": "dấu hiệu thiếu nước", "source": "https://www.nhs.uk/conditions/dehydration/", "reviewedAt": "2026-11-14"},
    {"code": "infant_dv", "group": "digestion", "level": "yellow", "text": "Bé dưới 12 tháng đang bị nôn hoặc tiêu chảy", "short": "bé dưới 12 tháng nôn, tiêu chảy", "maxAgeDays": 364, "source": "https://www.nhs.uk/conditions/diarrhoea-and-vomiting/", "reviewedAt": "2026-11-14"},
    {"code": "non_blanching_rash", "group": "skin", "level": "red", "text": "Có nốt hoặc mảng phát ban đỏ, tím không mất đi khi ấn mạnh một chiếc ly thủy tinh trong lên", "short": "ban không mất khi ấn ly", "source": "https://www.nhs.uk/conditions/meningitis/", "reviewedAt": "2026-11-14"},
    {"code": "jaundice_palms", "group": "skin", "level": "red", "text": "Vàng da lan tới lòng bàn tay hoặc lòng bàn chân", "short": "vàng da tới lòng bàn tay, bàn chân", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "jaundice_first_day", "group": "skin", "level": "red", "text": "Bé chưa đủ 24 giờ tuổi mà da đã vàng", "short": "vàng da trong 24 giờ đầu", "maxAgeDays": 1, "source": "https://www.nhs.uk/conditions/jaundice-newborn/", "reviewedAt": "2026-11-14"},
    {"code": "jaundice_worse", "group": "skin", "level": "yellow", "text": "Vàng da không đỡ hoặc đậm dần, hoặc nước tiểu vàng sẫm, nâu", "short": "vàng da không đỡ", "source": "https://www.nhs.uk/conditions/jaundice-newborn/", "reviewedAt": "2026-11-14"},
    {"code": "poor_feeding", "group": "behaviour", "level": "red", "text": "Bé bỏ bú, không bú được, hoặc bú chưa được một nửa lượng mọi ngày", "short": "bỏ bú, bú kém", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "convulsion", "group": "behaviour", "level": "red", "text": "Bé co giật", "short": "co giật", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "lethargic", "group": "behaviour", "level": "red", "text": "Bé li bì, khó đánh thức, hoặc mềm nhũn", "short": "li bì, khó đánh thức", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "weak_cry", "group": "behaviour", "level": "red", "text": "Bé khóc yếu, khóc thét the thé, hoặc khóc liên tục không dỗ được", "short": "khóc yếu hoặc khóc thét", "source": "https://www.nhs.uk/conditions/sepsis/", "reviewedAt": "2026-11-14"},
    {"code": "feeding_less_infant", "group": "behaviour", "level": "red", "text": "Bé dưới 2 tháng bú ít hơn mọi ngày", "short": "bé dưới 2 tháng bú ít hơn mọi ngày", "maxAgeDays": 59, "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "feeding_less", "group": "behaviour", "level": "yellow", "text": "Bé bú hoặc ăn ít hơn mọi ngày nhưng vẫn được hơn một nửa", "short": "bú ít hơn mọi ngày", "minAgeDays": 60, "source": "https://www.nhs.uk/conditions/bronchiolitis/", "reviewedAt": "2026-11-14"},
    {"code": "not_themselves", "group": "behaviour", "level": "yellow", "text": "Bé mệt, quấy, không như mọi khi và bạn thấy lo", "short": "mệt, quấy khác thường", "source": "https://www.nhs.uk/conditions/fever-in-children/", "reviewedAt": "2026-11-14"},
    {"code": "bulging_fontanelle", "group": "other", "level": "red", "text": "Thóp của bé phồng lên khi bé nằm yên", "short": "thóp phồng", "source": "https://www.who.int/publications/i/item/9789241506823", "reviewedAt": "2026-11-14"},
    {"code": "light_sensitive", "group": "other", "level": "red", "text": "Bé khó chịu, nhắm mắt hoặc quay đi khi gặp ánh sáng", "short": "sợ ánh sáng", "source": "https://www.nhs.uk/conditions/fever-in-children/", "reviewedAt": "2026-11-14"},
    {"code": "stiff_neck", "group": "other", "level": "red", "text": "Cổ bé cứng, khó cúi đầu", "short": "cứng cổ", "source": "https://www.nhs.uk/conditions/fever-in-children/", "reviewedAt": "2026-11-14"}
  ]
}
```

- [ ] **Step 5: Viết schema và phần nạp**

Tạo `lib/content/triage.ts`:

```ts
import { z } from "zod";
import data from "@/content/triage.vi.json";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const TriageQuestionSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9_]+$/),
    group: z.string().min(1),
    level: z.enum(["red", "yellow"]),
    // May contain {fastBreathing}, filled in with the age-based threshold.
    text: z.string().min(1),
    // Used in "Đi khám ngay nếu xuất hiện: …".
    short: z.string().min(1),
    minAgeDays: z.number().int().min(0).optional(),
    maxAgeDays: z.number().int().min(0).optional(),
    source: z.url(),
    reviewedAt: isoDate,
  })
  .strict();

export const TriageContentSchema = z
  .object({
    title: z.string().min(1),
    disclaimer: z.literal("Thông tin tham khảo, không thay thế bác sĩ."),
    reviewedAt: isoDate,
    groups: z.array(z.object({ code: z.string(), name: z.string() }).strict()),
    homeCare: z.array(z.string().min(1)).min(1),
    homeCareSource: z.url(),
    questions: z.array(TriageQuestionSchema),
  })
  .strict();

export type TriageQuestion = z.infer<typeof TriageQuestionSchema>;
export type TriageContent = z.infer<typeof TriageContentSchema>;

export const TRIAGE: TriageContent = TriageContentSchema.parse(data);
```

- [ ] **Step 6: Chạy test để thấy đạt**

Run: `bunx vitest run lib/content/triage.test.ts && bun run typecheck`
Expected: PASS — `Tests  5 passed (5)`; `tsc --noEmit` không in lỗi.

- [ ] **Step 7: Commit**

```bash
git add docs/blueprint/plans/2026-11-14-baby-tracker-web-m20.md content/triage.vi.json lib/content/triage.ts lib/content/triage.test.ts && git commit -m "feat(triage): symptom questions with sources and red danger signs"
```

---

### Task 2: Quy tắc phân loại

**Files:**

- Create: `lib/rules/triage.ts`
- Test: `lib/rules/triage.test.ts`

**Interfaces:**

- Consumes: `TriageQuestion` (Task 1)
- Produces: `TriageLevel`, `RESULT_TITLE`, `fastBreathingRate(ageDays)`, `questionText(question, ageDays)`, `visibleQuestions(questions, ageDays)`, `Finding = { level; text }`, `temperatureFindings(celsius, ageDays)`, `TriageResult = { level; findings }`, `evaluateTriage({ questions, checked, celsius, ageDays })`, `goNowIf(questions, ageDays)`, `recentCelsius(logs, now)`, `parseCelsius(raw): number | null | "bad"`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/triage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { TriageQuestion } from "@/lib/content/triage";
import {
  evaluateTriage,
  fastBreathingRate,
  goNowIf,
  parseCelsius,
  questionText,
  recentCelsius,
  temperatureFindings,
  visibleQuestions,
} from "./triage";

const q = (
  code: string,
  level: "red" | "yellow",
  extra: Partial<TriageQuestion> = {},
): TriageQuestion => ({
  code,
  group: "other",
  level,
  text: `${code} text`,
  short: `${code} short`,
  source: "https://example.org",
  reviewedAt: "2026-11-14",
  ...extra,
});

const questions = [
  q("breath", "red", { text: "Thở từ {fastBreathing} lần/phút" }),
  q("rash", "yellow"),
  q("convulsion", "red"),
  q("newborn_only", "red", { maxAgeDays: 1 }),
  q("diapers", "red", { minAgeDays: 6 }),
];

describe("fast breathing (spec §6.6)", () => {
  it("uses 60 / 50 / 40 breaths per minute by age", () => {
    expect([0, 59, 60, 364, 365, 700].map(fastBreathingRate)).toEqual([
      60, 60, 50, 50, 40, 40,
    ]);
    expect(questionText(questions[0], 61)).toBe("Thở từ 50 lần/phút");
  });
});

describe("visibleQuestions", () => {
  it("applies minAgeDays and maxAgeDays", () => {
    const codes = (age: number) =>
      visibleQuestions(questions, age).map((x) => x.code);
    expect(codes(0)).toEqual(["breath", "rash", "convulsion", "newborn_only"]);
    expect(codes(6)).toEqual(["breath", "rash", "convulsion", "diapers"]);
  });
});

describe("temperatureFindings (spec §6.6)", () => {
  it("covers every temperature rule at its boundary", () => {
    const level = (c: number | null, age: number) =>
      temperatureFindings(c, age).map((f) => f.level);
    expect(level(null, 30)).toEqual([]);
    expect(level(35.4, 200)).toEqual(["red"]);
    expect(level(35.5, 200)).toEqual([]);
    expect(level(38, 90)).toEqual(["red"]);
    expect(level(37.9, 90)).toEqual([]);
    expect(level(38, 91)).toEqual(["yellow"]);
    expect(level(39, 182)).toEqual(["red"]);
    expect(level(39, 183)).toEqual(["yellow"]);
    expect(level(40, 700)).toEqual(["red"]);
    expect(temperatureFindings(38.2, 30)[0].text).toBe(
      "Bé dưới 3 tháng sốt từ 38°C trở lên",
    );
  });
});

describe("evaluateTriage (red beats yellow)", () => {
  const run = (
    checked: string[],
    celsius: number | null = null,
    ageDays = 61,
  ) =>
    evaluateTriage({ questions, checked: new Set(checked), celsius, ageDays });

  it("is green with nothing ticked and a normal temperature", () => {
    expect(run([], 37.2)).toEqual({ level: "green", findings: [] });
  });

  it("is yellow when only yellow findings match", () => {
    expect(run(["rash"])).toEqual({
      level: "yellow",
      findings: [{ level: "yellow", text: "rash text" }],
    });
    expect(run([], 38.5, 120).level).toBe("yellow");
  });

  it("is red when any red finding matches, listing red ones first", () => {
    expect(run(["rash", "breath"], 38.5, 120)).toEqual({
      level: "red",
      findings: [
        { level: "red", text: "Thở từ 50 lần/phút" },
        { level: "yellow", text: "Bé đang sốt từ 38°C trở lên" },
        { level: "yellow", text: "rash text" },
      ],
    });
  });

  it("ignores a ticked question hidden for this age", () => {
    expect(run(["newborn_only"], null, 61).level).toBe("green");
  });
});

describe("goNowIf", () => {
  it("lists the fever threshold for the age, low temperature and the red signs", () => {
    expect(goNowIf(questions, 61)).toBe(
      "Đi khám ngay nếu xuất hiện: sốt từ 38°C, thân nhiệt dưới 35,5°C, breath short, convulsion short, diapers short.",
    );
    expect(goNowIf(questions, 400)).toMatch(
      /^Đi khám ngay nếu xuất hiện: sốt từ 40°C,/,
    );
  });
});

describe("step 1 helpers", () => {
  const now = new Date("2026-11-14T10:00:00Z");
  const log = (type: string, hoursAgo: number, details: unknown) => ({
    type,
    started_at: new Date(now.getTime() - hoursAgo * 3_600_000).toISOString(),
    details,
  });

  it("recentCelsius takes the newest temperature of the last 6 hours", () => {
    expect(
      recentCelsius(
        [
          log("temperature", 1, { celsius: 38.4 }),
          log("temperature", 0.5, { celsius: 38.9 }),
          log("diaper", 0.1, { wet: true }),
        ],
        now,
      ),
    ).toBe(38.9);
    expect(
      recentCelsius([log("temperature", 6.1, { celsius: 39 })], now),
    ).toBeNull();
  });

  it("parseCelsius accepts a comma and 30–43°C", () => {
    expect(parseCelsius("38,5")).toBe(38.5);
    expect(parseCelsius("33,8")).toBe(33.8);
    expect(parseCelsius("29,9")).toBe("bad");
    expect(parseCelsius(" ")).toBeNull();
    expect(parseCelsius("44")).toBe("bad");
    expect(parseCelsius("abc")).toBe("bad");
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/rules/triage.test.ts`
Expected: FAIL — `Error: Cannot find module './triage' imported from …/lib/rules/triage.test.ts`

- [ ] **Step 3: Viết quy tắc**

Tạo `lib/rules/triage.ts`:

```ts
import type { TriageQuestion } from "@/lib/content/triage";

export type TriageLevel = "red" | "yellow" | "green";

export const RESULT_TITLE: Record<TriageLevel, string> = {
  red: "Đi cấp cứu ngay",
  yellow: "Cho bé đi khám trong 24 giờ",
  green: "Theo dõi tại nhà",
};

// Spec §6.6: ≥ 60 breaths/min under 60 days, ≥ 50 from 60 to 364 days, ≥ 40 from 365 days.
export function fastBreathingRate(ageDays: number): number {
  if (ageDays < 60) return 60;
  if (ageDays < 365) return 50;
  return 40;
}

export function questionText(
  question: TriageQuestion,
  ageDays: number,
): string {
  return question.text.replace(
    "{fastBreathing}",
    String(fastBreathingRate(ageDays)),
  );
}

export function visibleQuestions(
  questions: TriageQuestion[],
  ageDays: number,
): TriageQuestion[] {
  return questions.filter(
    (q) =>
      (q.minAgeDays === undefined || ageDays >= q.minAgeDays) &&
      (q.maxAgeDays === undefined || ageDays <= q.maxAgeDays),
  );
}

export type Finding = { level: "red" | "yellow"; text: string };

// Spec §6.6 temperature rules. 3–6 months ≥ 39°C is also red here: NHS lists it with
// under-3-months ≥ 38°C, and over-triage is the safe side.
export function temperatureFindings(
  celsius: number | null,
  ageDays: number,
): Finding[] {
  if (celsius === null) return [];
  if (celsius < 35.5) return [{ level: "red", text: "Thân nhiệt dưới 35,5°C" }];
  if (celsius >= 40) return [{ level: "red", text: "Sốt từ 40°C trở lên" }];
  if (celsius >= 38 && ageDays < 91)
    return [{ level: "red", text: "Bé dưới 3 tháng sốt từ 38°C trở lên" }];
  if (celsius >= 39 && ageDays < 183)
    return [{ level: "red", text: "Bé 3–6 tháng sốt từ 39°C trở lên" }];
  if (celsius >= 38)
    return [{ level: "yellow", text: "Bé đang sốt từ 38°C trở lên" }];
  return [];
}

export type TriageResult = {
  level: TriageLevel;
  // Red findings first, then yellow, in question order.
  findings: Finding[];
};

export function evaluateTriage(input: {
  questions: TriageQuestion[];
  checked: Set<string>;
  celsius: number | null;
  ageDays: number;
}): TriageResult {
  const { questions, checked, celsius, ageDays } = input;
  const answered: Finding[] = visibleQuestions(questions, ageDays)
    .filter((q) => checked.has(q.code))
    .map((q) => ({ level: q.level, text: questionText(q, ageDays) }));
  const all = [...temperatureFindings(celsius, ageDays), ...answered];
  const findings = [
    ...all.filter((f) => f.level === "red"),
    ...all.filter((f) => f.level === "yellow"),
  ];
  const level: TriageLevel = findings.some((f) => f.level === "red")
    ? "red"
    : findings.length > 0
      ? "yellow"
      : "green";
  return { level, findings };
}

// "Đi khám ngay nếu xuất hiện: …" on the green result.
export function goNowIf(questions: TriageQuestion[], ageDays: number): string {
  const fever =
    ageDays < 91
      ? "sốt từ 38°C"
      : ageDays < 183
        ? "sốt từ 39°C"
        : "sốt từ 40°C";
  const signs = visibleQuestions(questions, ageDays)
    .filter((q) => q.level === "red")
    .map((q) => q.short);
  return `Đi khám ngay nếu xuất hiện: ${[fever, "thân nhiệt dưới 35,5°C", ...signs].join(", ")}.`;
}

// Step 1: the latest temperature logged in the last 6 hours, if any.
export function recentCelsius(
  logs: { type: string; started_at: string; details: unknown }[],
  now: Date,
): number | null {
  const since = now.getTime() - 6 * 3_600_000;
  const latest = logs
    .filter((log) => log.type === "temperature")
    .filter((log) => {
      const at = Date.parse(log.started_at);
      return at >= since && at <= now.getTime();
    })
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))[0];
  const celsius = (latest?.details as { celsius?: unknown } | undefined)
    ?.celsius;
  return typeof celsius === "number" ? celsius : null;
}

export function parseCelsius(raw: string): number | null | "bad" {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  const n = Number(text);
  if (!/^\d+(\.\d+)?$/.test(text) || n < 30 || n > 43) return "bad";
  return n;
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bunx vitest run lib/rules/triage.test.ts && bun run test && bun run typecheck`
Expected: PASS — file này `Tests  10 passed (10)`; cả bộ `Tests  260 passed (260)` (245 + 5 + 10); `tsc --noEmit` không in lỗi.

- [ ] **Step 5: Commit**

```bash
git add lib/rules/triage.ts lib/rules/triage.test.ts && git commit -m "feat(triage): temperature, fast-breathing and red-over-yellow rules"
```

---

### Task 3: Trang `/trieu-chung` và nút ở banner trang chủ

**Files:**

- Create: `components/triage/TriageResult.tsx`, `components/triage/TriageScreen.tsx`, `app/trieu-chung/page.tsx`
- Modify: `lib/nav.ts`, `components/home/HomeScreen.tsx`, `components/home/AlertBanners.tsx`
- Test: `lib/nav.test.ts`, `lib/themeGuard.test.ts` (đã có), `lib/rules/alerts.test.ts` (đã có, đã test cả hai câu sốt)

**Interfaces:**

- Consumes: Task 1, Task 2; `CallList`, `useEmergencyContacts` (M17); `useRecentLogs`; `wetDiapersInWindow`; `AuthGate`
- Produces: `TriageResult({ result, ageDays, contacts, onRestart })`, `TriageScreen({ baby })`, trang `/trieu-chung`

- [ ] **Step 1: Viết test thất bại**

```diff
--- a/lib/nav.test.ts
+++ b/lib/nav.test.ts
@@ -41,6 +41,12 @@
     );
   });
 
+  it("Cẩm nang opens symptom triage", () => {
+    expect(GUIDE_ITEMS.find((i) => i.label === "Triệu chứng")?.href).toBe(
+      "/trieu-chung",
+    );
+  });
+
   it("every menu link opens under its own tab", () => {
     for (const item of GUIDE_ITEMS)
       if (item.href) expect(activeTab(item.href)).toBe("guide");
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bunx vitest run lib/nav.test.ts`
Expected: FAIL — `AssertionError: expected null to be '/trieu-chung'`; `Tests  1 failed | 6 passed (7)`.

- [ ] **Step 3: Sửa menu, trang chủ và banner**

```diff
--- a/lib/nav.ts
+++ b/lib/nav.ts
@@ -17,7 +17,7 @@
 
 export const GUIDE_ITEMS: MenuItem[] = [
   { label: "Tiêm chủng", href: "/tiem-chung" },
-  { label: "Triệu chứng", href: null },
+  { label: "Triệu chứng", href: "/trieu-chung" },
   { label: "Phát triển", href: null },
   { label: "Bồng bế", href: null },
   { label: "Bệnh thường gặp", href: null },
```

```diff
--- a/components/home/HomeScreen.tsx
+++ b/components/home/HomeScreen.tsx
@@ -72,7 +72,7 @@
     logs: rows,
     ageDays: age,
     wetDiapers: ratings.wetDiapers,
-    triageAvailable: false,
+    triageAvailable: true,
     now,
   });
   const statusLines = homeStatusLines({
```

```diff
--- a/components/home/AlertBanners.tsx
+++ b/components/home/AlertBanners.tsx
@@ -1,3 +1,4 @@
+import Link from "next/link";
 import type { HomeAlert } from "@/lib/rules/alerts";
 
 export function AlertBanners({ alerts }: { alerts: HomeAlert[] }) {
@@ -11,13 +12,30 @@
           className={`rounded-2xl p-4 ${alert.level === "red" ? "bg-alarm text-on-accent" : "bg-warn-soft text-warn-ink"}`}
         >
           <p className="font-semibold">{alert.message}</p>
+          {alert.key === "fever" && (
+            <Link
+              href="/trieu-chung"
+              className="mt-3 inline-flex min-h-11 items-center rounded-xl border px-4 font-semibold"
+            >
+              Phân loại triệu chứng
+            </Link>
+          )}
           {alert.level === "red" && (
-            <a
-              href="tel:115"
-              className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-surface px-4 font-semibold text-danger"
-            >
-              Gọi 115
-            </a>
+            <div className="mt-3 flex flex-wrap gap-2">
+              <a
+                href="tel:115"
+                className="inline-flex min-h-11 items-center rounded-xl bg-surface px-4 font-semibold text-danger"
+              >
+                Gọi 115
+              </a>
+              {/* Spec §7.4: red banners also open symptom triage. */}
+              <Link
+                href="/trieu-chung"
+                className="inline-flex min-h-11 items-center rounded-xl border border-on-accent px-4 font-semibold"
+              >
+                Phân loại triệu chứng
+              </Link>
+            </div>
           )}
         </div>
       ))}
```

- [ ] **Step 4: Tạo `components/triage/TriageResult.tsx`**

```tsx
import { CallList } from "@/components/emergency/CallList";
import { TRIAGE } from "@/lib/content/triage";
import {
  goNowIf,
  RESULT_TITLE,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { EmergencyContactRow } from "@/lib/supabase/rows";

const CARD = {
  red: "bg-alarm text-on-accent",
  yellow: "bg-warn-soft text-warn-ink",
  green: "bg-good-soft text-good-ink",
} as const;

const ICON = { red: "🔴", yellow: "🟡", green: "🟢" } as const;

// Spec §6.6: every result shows 115, the family's doctor numbers and the disclaimer.
export function TriageResult({
  result,
  ageDays,
  contacts,
  onRestart,
}: {
  result: Result;
  ageDays: number;
  contacts: EmergencyContactRow[];
  onRestart: () => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div
        role="alert"
        className={`flex flex-col gap-2 rounded-2xl p-4 ${CARD[result.level]}`}
      >
        <p className="text-xl font-semibold">
          <span aria-hidden="true">{ICON[result.level]}</span>{" "}
          {RESULT_TITLE[result.level]}
        </p>
        {result.findings.length > 0 && (
          <ul className="list-disc pl-5">
            {result.findings.map((finding) => (
              <li key={finding.text}>{finding.text}</li>
            ))}
          </ul>
        )}
      </div>
      {result.level === "green" && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Chăm bé tại nhà</h2>
          <ul className="list-disc pl-5">
            {TRIAGE.homeCare.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      {result.level !== "red" && (
        <p className="font-medium">{goNowIf(TRIAGE.questions, ageDays)}</p>
      )}
      <CallList contacts={contacts} />
      <p className="text-sm text-muted">{TRIAGE.disclaimer}</p>
      <button
        type="button"
        onClick={onRestart}
        className="min-h-12 rounded-2xl border"
      >
        Làm lại
      </button>
    </section>
  );
}
```

- [ ] **Step 5: Tạo `components/triage/TriageScreen.tsx` và `app/trieu-chung/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { TRIAGE } from "@/lib/content/triage";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { useRecentLogs } from "@/lib/data/logs";
import { wetDiapersInWindow } from "@/lib/rules/ratings";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import {
  evaluateTriage,
  parseCelsius,
  questionText,
  recentCelsius,
  visibleQuestions,
  type TriageResult as Result,
} from "@/lib/rules/triage";
import type { Baby } from "@/lib/supabase/rows";
import { TriageResult } from "./TriageResult";

export function TriageScreen({ baby }: { baby: Baby }) {
  const now = new Date();
  const age = ageDays(baby.dob, now);
  const logs = useRecentLogs(baby.id);
  const contacts = useEmergencyContacts(baby.family_id);
  const logged = recentCelsius(logs.data ?? [], now);
  const [celsius, setCelsius] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  // Step 1 (spec §6.6): prefilled from a temperature logged in the last 6 hours, editable.
  const temperature =
    celsius ?? (logged === null ? "" : String(logged).replace(".", ","));
  const questions = visibleQuestions(TRIAGE.questions, age);
  const wet = wetDiapersInWindow(logs.data ?? [], now);
  const diapersLogged = (logs.data ?? []).some(
    (log) =>
      log.type === "diaper" &&
      now.getTime() - Date.parse(log.started_at) <= 24 * 3_600_000,
  );

  function toggle(code: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  function submit() {
    const parsed = parseCelsius(temperature);
    if (parsed === "bad") {
      setError("Nhiệt độ từ 30 đến 43°C, ví dụ 38,5.");
      return;
    }
    setError(null);
    setResult(
      evaluateTriage({
        questions: TRIAGE.questions,
        checked,
        celsius: parsed,
        ageDays: age,
      }),
    );
    window.scrollTo({ top: 0 });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{TRIAGE.title}</h1>
      <p className="text-sm text-muted">{TRIAGE.disclaimer}</p>
      {!result && (
        <a
          href="tel:115"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-alarm font-semibold text-on-accent"
        >
          Gọi cấp cứu 115
        </a>
      )}
      {result ? (
        <TriageResult
          result={result}
          ageDays={age}
          contacts={contacts.data ?? []}
          onRestart={() => {
            setResult(null);
            setChecked(new Set());
            setCelsius(null);
            setError(null);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <>
          <section className="flex flex-col gap-2 rounded-2xl bg-soft p-4">
            <p>
              Tuổi của bé: <strong>{formatAgeVi(baby.dob, now)}</strong>
            </p>
            <label className="flex flex-col gap-1">
              Nhiệt độ gần nhất (°C, để trống nếu chưa đo)
              <input
                inputMode="decimal"
                className="min-h-11 rounded-xl border bg-surface px-3"
                value={temperature}
                onChange={(e) => setCelsius(e.target.value)}
              />
            </label>
            {logged !== null && celsius === null && (
              <p className="text-sm text-muted">
                Lấy từ nhật ký trong 6 giờ qua.
              </p>
            )}
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </section>
          <p>Đánh dấu những gì bé đang có:</p>
          {TRIAGE.groups.map((group) => {
            const list = questions.filter((q) => q.group === group.code);
            if (list.length === 0) return null;
            return (
              <fieldset key={group.code} className="flex flex-col gap-1">
                <legend className="mb-1 text-lg font-medium">
                  {group.name}
                </legend>
                {list.map((question) => (
                  <label
                    key={question.code}
                    className="flex min-h-11 items-start gap-3 py-1"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-5 shrink-0"
                      checked={checked.has(question.code)}
                      onChange={(e) => toggle(question.code, e.target.checked)}
                    />
                    <span>
                      {questionText(question, age)}
                      {question.code === "few_wet_diapers" && logs.data && (
                        <span className="block text-sm text-muted">
                          {diapersLogged
                            ? `Nhật ký ghi ${wet} tã ướt trong 24 giờ qua.`
                            : "Nhật ký chưa ghi tã nào trong 24 giờ qua."}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </fieldset>
            );
          })}
          <button
            type="button"
            onClick={submit}
            className="min-h-12 rounded-2xl bg-accent text-on-accent"
          >
            Xem kết quả
          </button>
          <a
            href="tel:115"
            className="flex min-h-12 items-center justify-center rounded-2xl bg-alarm font-semibold text-on-accent"
          >
            Gọi cấp cứu 115
          </a>
        </>
      )}
    </main>
  );
}
```

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { TriageScreen } from "@/components/triage/TriageScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) => (ctx?.baby ? <TriageScreen baby={ctx.baby} /> : null)}
    </AuthGate>
  );
}
```

- [ ] **Step 6: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  261 passed (261)`; build thành công, có `○ /trieu-chung`.

- [ ] **Step 7: Commit**

```bash
git add components/triage app/trieu-chung lib/nav.ts lib/nav.test.ts components/home/HomeScreen.tsx components/home/AlertBanners.tsx && git commit -m "feat(triage): /trieu-chung with results, 115 and family contacts"
```

---

### Task 4: Checklist bước 13 và deploy

**Files:**

- Modify: `docs/device-checklist.md`

**Interfaces:**

- Consumes: Task 3
- Produces: checklist bước 13

- [ ] **Step 1: Thêm bước 13 vào cuối `docs/device-checklist.md`**

````markdown
## Bước 13 — Phân loại triệu chứng (M20)

1. Cẩm nang → Triệu chứng. Kỳ vọng: tuổi của bé; ô nhiệt độ (tự điền kèm "Lấy từ nhật ký trong 6 giờ qua." nếu vừa đo); sáu nhóm Sốt, Hô hấp, Tiêu hóa, Da, Hành vi, ăn bú, Khác; nút "Gọi cấp cứu 115".
2. Xóa ô nhiệt độ, không đánh dấu gì → "Xem kết quả". Kỳ vọng: 🟢 "Theo dõi tại nhà", mục "Chăm bé tại nhà", dòng "Đi khám ngay nếu xuất hiện: …", nút 115, danh bạ khẩn cấp, dòng "Thông tin tham khảo, không thay thế bác sĩ.".
3. "Làm lại" → xóa ô nhiệt độ nếu đã tự điền → đánh dấu "Bé sốt kèm phát ban" → Xem kết quả. Kỳ vọng: 🟡 "Cho bé đi khám trong 24 giờ".
4. "Làm lại" → xóa ô nhiệt độ nếu đã tự điền → đánh dấu "Bé sốt kèm phát ban" và "Bé co giật" → Xem kết quả. Kỳ vọng: 🔴 "Đi cấp cứu ngay", dòng "Bé co giật" đứng trước dòng phát ban.
5. "Làm lại" → nhập nhiệt độ 38 (bé dưới 3 tháng) hoặc 40 (mọi tuổi) → Xem kết quả. Kỳ vọng: 🔴.
6. Không có kết quả nào hiện tên bệnh.
7. Trang chủ: khi có banner đỏ (ví dụ ghi nhiệt độ 40°C rồi xóa sau khi xem), banner có nút "Gọi 115" và nút "Phân loại triệu chứng" mở đúng trang.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
````

Thêm một dòng trống trước tiêu đề mới.

Run: `grep -n '^## ' docs/device-checklist.md | tail -1`
Expected: `## Bước 13 — Phân loại triệu chứng (M20)`.

- [ ] **Step 2: Commit và deploy**

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist step 13 for symptom triage" && git push
```

Run: chờ Vercel deploy Ready, rồi `curl -s -o /dev/null -w "%{http_code}" https://bunkid.vercel.app/trieu-chung`
Expected: `200`.

- [ ] **Step 3: 👤 Ghi bước của người dùng**

Bảng kết quả bước 13 để trống. Trong báo cáo cuối ghi: "Checklist bước 13 chờ người dùng."

---

## Ngoài phạm vi M20

- **M21:** bài "Bệnh thường gặp" (cảm lạnh, sổ mũi, nôn trớ, táo bón, hăm tã, chàm sữa, nấm miệng, vàng da sinh lý, viêm tiểu phế quản, tiêu chảy), mỗi bài có "Khi nào đi khám ngay"; chốt đợt 2.
