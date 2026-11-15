# Kim Bun — Nền Hồng dịu, chip thuốc nhanh, popup "Bỏ thay đổi?" giữa màn hình

**Status:** approved 2026-11-15 (cập nhật cùng ngày: thêm 3 nền Đào mơ, Oải hương, Biển sương theo yêu cầu của người dùng)
**Ngày:** 2026-11-15
**Unit:** `web` (PWA Next.js trên Vercel). Một unit; không đụng Supabase schema, RLS, outbox, push server.
**Liên quan:** spec UI `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md` (gọi tắt "spec UI"); bản vẽ Claude Design "Kim Bun – theme Sáng dịu mắt" (https://claude.ai/artifact/FRHccFB9sxZA9ZS8WScfbR). Phương án đã chọn: bảng "C · Hồng phấn tro" và "Popup 1 · Hộp thoại giữa màn hình". Mọi giá trị cần để code nằm trong spec này; canvas chỉ để xem hình.

## 1. Mục tiêu

1. Theme Sáng hiện tại chói vì quá nhiều trắng (nền `#FBF3F0`, kính trắng 55–82 %, khối đặc `#FFFFFF`). Thêm 4 nền sáng tối hơn, không có bề mặt trắng tinh: **Hồng dịu** (mặc định), **Đào mơ**, **Oải hương**, **Biển sương**. Theme Sáng cũ vẫn chọn được, tên "Trắng".
2. Sheet Thuốc có chip chọn nhanh **Vitamin D, DHA, Men tiêu hoá**. Bấm chip thì điền liều của lần ghi trước. Thêm đơn vị **gói** và **ống**.
3. Popup "Bỏ thay đổi?" hiện nằm ở đáy sheet. Khi đang gõ, bàn phím iPhone che mất đáy sheet nên người dùng không thấy popup. Chuyển popup thành **hộp thoại giữa màn hình** và tắt bàn phím trước khi hiện.

Ngoài phạm vi: đổi theme Tối và Ban đêm; đổi utility `glass` / `glass-strong`; cho người dùng sửa danh sách chip; thêm chip vào `LogEditSheet` (chỉ đổi ngưỡng Segmented ở §4.3); migration DB.

## 2. Global Constraints

- Giữ toàn bộ mục 2 của spec UI: chỉ tiếng Việt; Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Bun 1.x, TypeScript `strict`; Safari iOS ≥ 16.4; bề ngang 375–440 pt; vùng chạm ≥ 44×44 pt; không thêm dependency, không web font; logic thuần đặt trong `lib/rules/` và có unit test.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Giữ prefix khoá localStorage `be-yeu-*`, tên package và URL `bunkid.vercel.app`.
- Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Hai file phải giống nhau từng giá trị (`lib/ui/tokens.test.ts` kiểm). Ngoại lệ duy nhất: lớp tối `bg-black/35` và bóng `rgb(0 0 0/0.3)` của hộp thoại (§5.2), và `#E9DBDB` trong `public/manifest.webmanifest` (§3.1), vì JSON không import được token.
- Mọi token chữ phải đạt ≥ 4.5:1 trên nền và trên kính (`lib/ui/contrast.test.ts`). `switch-on` phải đạt ≥ 3:1 trên nền.
- Không lồng `glass` trong `glass` nếu chưa có quy tắc tắt blur (hotfix 7822c90 vẫn giữ).
- Màn hình không tự cộng thêm `env(safe-area-inset-*)`, vì `body` đã pad sẵn.
- Dev đang nối vào Supabase thật của gia đình. Kiểm tay không được bấm Lưu, không được bắt đầu đồng hồ.

## 3. Bốn nền sáng dịu mắt (theme `rose`, `peach`, `lavender`, `sea`)

Bản vẽ: bảng "C · Hồng phấn tro" (→ `rose`), "G · Đào mơ" (→ `peach`), "H · Oải hương" (→ `lavender`), "I · Biển sương" (→ `sea`) trên canvas.

### 3.1 Tên và cách chọn

- `THEME_NAMES` trong `lib/ui/tokens.ts` thành `["light", "rose", "peach", "lavender", "sea", "dark", "night"]`.
- Khoá localStorage mới `be-yeu-light-style`. Giá trị hợp lệ: `"white"`, `"rose"`, `"peach"`, `"lavender"`, `"sea"`. Thiếu khoá hoặc giá trị khác → `"rose"`.
- `lib/rules/theme.ts`:
  - `export type LightStyle = "white" | "rose" | "peach" | "lavender" | "sea"`.
  - `parseLightStyle(raw: string | null): LightStyle` trả đúng giá trị nếu hợp lệ, còn lại trả `"rose"`.
  - `resolveActiveTheme` nhận thêm `lightStyle: LightStyle`. Bước tính `day` như cũ cho ra `"light"` hoặc `"dark"`. Nếu ra `"light"` thì: `"white"` giữ `light`, các style khác thay bằng chính tên style. Override và lịch ban đêm giữ nguyên thứ tự ưu tiên hiện tại.
- `toggleNightOverride` không đổi: `current !== "night"` vẫn đúng với mọi theme sáng.
- `currentTheme()` trong `lib/hooks/useTheme.ts` trả về đúng tên khi `data-theme` là một trong `rose`, `peach`, `lavender`, `sea`, `dark`, `night`; còn lại trả `light`. `useNightMode` vẫn chỉ so `=== "night"`.
- `readThemeState` trả thêm `lightStyle`. `applyTheme()` truyền nó vào `resolveActiveTheme`.
- `THEME_INIT_SCRIPT` làm y như trên: khi `day` là `"light"` thì `"white"` → `light`, `peach` / `lavender` / `sea` → chính nó, còn lại → `rose`. Nếu localStorage ném lỗi, script vẽ `rose`. `lib/theme.test.ts` chứng minh script và `readThemeState` + `resolveActiveTheme` cho cùng kết quả với mọi style và một giá trị rác.
- `THEME_COLORS` có mục cho cả 7 theme, mỗi mục là `THEMES[name].bg`. `app/layout.tsx`: mục light của `themeColor` lấy `THEMES.rose.bg` (`#E9DBDB`) vì Hồng dịu là mặc định. `public/manifest.webmanifest` đổi `background_color` và `theme_color` thành `#E9DBDB`.

### 3.2 Cài đặt

- Trong `components/settings/AppearanceGroup.tsx`, ngay dưới Segmented "Giao diện" (Sáng / Tối / Tự động), thêm nhãn chữ nhỏ **"Nền sáng"** và một **hàng 5 chấm màu**, dùng component `Swatch` có sẵn, theo thứ tự: Trắng, Hồng dịu, Đào mơ, Oải hương, Biển sương. Không dùng Segmented, vì 5 nút một hàng thì "Oải hương" và "Biển sương" bị cắt chữ ở 375 px.
- Mỗi chấm có màu chia đôi chéo: nửa trên trái là `bg`, nửa dưới phải là `accent` của theme đó. Chuỗi CSS là `linear-gradient(135deg, <bg> 50%, <accent> 50%)`, do hàm thuần `lightSwatch(style)` trong `lib/theme.ts` dựng từ `THEMES` (Trắng dùng `THEMES.light`). Chấm đang chọn có vòng `ring-accent-text` như `Swatch` vẫn vẽ.
- Hàng chấm nằm trong một khối `glass` bo `rounded-[22px]`, `role="group"`, `aria-label="Nền sáng"`. Luôn hiện, kể cả khi đang chọn Tối.
- `AppearanceGroupView` nhận thêm `lightStyle: LightStyle` và `onLightStyle: (next: LightStyle) => void`.
- `LIGHT_STYLE_OPTIONS` (5 mục `{ value, label }`) và `LIGHT_STYLE_KEY = "be-yeu-light-style"` đặt trong `lib/theme.ts`. Hook `useLightStyle(): [LightStyle, (next: LightStyle) => void]` trong `lib/hooks/useTheme.ts` ghi localStorage rồi gọi `applyTheme()`, không xoá override ban đêm.

### 3.3 Token

Thêm 4 khối `:root[data-theme="rose"]`, `"peach"`, `"lavender"`, `"sea"` vào `app/globals.css` (không có `color-scheme: dark`), và 4 mục tương ứng vào `THEMES` trong `lib/ui/tokens.ts`.

Token riêng của từng theme:

| Token | rose (Hồng dịu) | peach (Đào mơ) | lavender (Oải hương) | sea (Biển sương) |
|---|---|---|---|---|
| bg | `#E9DBDB` | `#EFDCCD` | `#E3DDE9` | `#DDE3E8` |
| blob-1 | `#E5C0B8` | `#F0C6AB` | `#DACEE7` | `#CBD7E1` |
| blob-2 | `#D4C8DE` | `#EBCEBF` | `#D1D2E7` | `#D8D5E5` |
| blob-3 | `#E2B9C5` | `#EBC2B5` | `#E3CDDC` | `#E3D4D8` |
| ink | `#2B1B22` | `#2E1D18` | `#251F2E` | `#1D2630` |
| muted | `#66505A` | `#67503F` | `#5C5266` | `#4F5B66` |
| glass | `rgb(245 235 235 / 0.62)` | `rgb(247 234 224 / 0.64)` | `rgb(240 236 245 / 0.64)` | `rgb(236 241 245 / 0.64)` |
| glass-strong | `rgb(243 233 233 / 0.92)` | `rgb(245 232 222 / 0.92)` | `rgb(238 233 243 / 0.92)` | `rgb(235 240 244 / 0.92)` |
| glass-solid | `#F2E6E6` | `#F5E8DC` | `#EEE9F3` | `#EBEFF3` |
| edge | `rgb(255 248 248 / 0.5)` | `rgb(255 248 240 / 0.45)` | `rgb(255 255 255 / 0.45)` | `rgb(255 255 255 / 0.45)` |
| line | `rgb(43 27 34 / 0.08)` | `rgb(46 29 24 / 0.08)` | `rgb(37 31 46 / 0.08)` | `rgb(29 38 48 / 0.08)` |
| scrim | `rgb(43 27 34 / 0.26)` | `rgb(46 29 24 / 0.26)` | `rgb(37 31 46 / 0.26)` | `rgb(29 38 48 / 0.26)` |
| accent | `#A8255A` | `#A3324A` | `#8A2C6B` | `#2C5A85` |
| accent-text | `#A8255A` | `#A3324A` | `#8A2C6B` | `#2C5A85` |
| accent-tint | `rgb(168 37 90 / 0.12)` | `rgb(163 50 74 / 0.12)` | `rgb(138 44 107 / 0.12)` | `rgb(44 90 133 / 0.12)` |

Token chung, giống nhau ở cả 4 theme:

| Token | Giá trị | Token | Giá trị |
|---|---|---|---|
| on-accent | `#FFFFFF` | warn-ink | `#7A4300` |
| good | `#18692F` | good-soft | `#D5E9DA` |
| warn | `#7F4A00` | good-ink | `#1A5A30` |
| danger | `#AD1025` | cat-feed | `#A8134E` |
| danger-solid | `#AD1025` | cat-bottle | `#9A2D51` |
| on-danger | `#FFFFFF` | cat-sleep | `#5B4BC4` |
| switch-on | `#18692F` | cat-diaper | `#7F4A00` |
| danger-soft | `#F5DCD9` | cat-pump | `#7A33AD` |
| danger-ink | `#8A0F1F` | cat-tummy | `#236938` |
| warn-soft | `#F3E1C4` | cat-med | `#A8301F` |
| | | cat-temp | `#165E73` |

Đã đo bằng `lib/rules/contrast.ts`: mọi token chữ đạt ≥ 4.8:1 trên `bg` ở cả 4 theme (thấp nhất là `cat-sleep`: rose 4.81, peach 4.86, lavender 4.86, sea 5.00). Chữ trắng trên `accent`: rose 6.82, peach 6.75, lavender 7.91, sea 7.22. Các cặp nền mềm 6.23–7.43. Nếu `contrast.test.ts` vẫn báo trượt một token, làm đậm đúng token đó (giữ tông màu) cho tới khi đạt, rồi ghi giá trị mới vào phần "Diễn giải spec" của plan.

Không có `#FFFFFF` nào làm nền bề mặt trong 4 theme. Chỉ `on-accent` và `on-danger` dùng trắng, cho chữ đặt trên nút đậm.

### 3.4 Theme Sáng cũ

Theme `light` giữ nguyên mọi giá trị, hiện ra khi chọn "Nền sáng: Trắng".

## 4. Chip chọn nhanh trong sheet Thuốc

### 4.1 Luật (hàm thuần, `lib/rules/quickEntry.ts`)

- `MEDICINE_PRESETS = ["Vitamin D", "DHA", "Men tiêu hoá"] as const`, đúng thứ tự này.
- `recentMedicineNames(logs, exclude: readonly string[] = [])`: như hiện tại, nhưng bỏ qua tên trùng với `exclude` (so bằng `toLocaleLowerCase("vi")` sau khi `trim`) **trước khi** đếm đủ 4. `QuickEntrySheet` truyền `MEDICINE_PRESETS` vào.
- `medicinePrefill(name: string, logs: LogLike[]): Partial<QuickValues>`:
  - Tìm log `medicine` mới nhất có tên trùng `name` (so như trên). Có thì trả `{ name, amount: String(amount), unit, antipyretic }`. `amount` dùng dấu phẩy thập phân giống `stepAmount`, ví dụ `"2,5"`.
  - Không có và `name` là "Vitamin D" (so như trên) → `{ name: "Vitamin D", amount: "1", unit: "giọt", antipyretic: false }`.
  - Không có trường hợp nào ở trên → `{ name, amount: "", antipyretic: false }` (giữ đơn vị đang chọn).
- `const VITAMIN_D` trong `HomeScreen.tsx` thay bằng `medicinePrefill("Vitamin D", rows)` (`rows` là mảng log; `logs` trong file đó là object query), để nút "Ghi Vitamin D hôm nay" cũng lấy liều lần trước.

### 4.2 Giao diện (`components/quick/MedicineFields.tsx`)

- Dưới ô "Tên thuốc": nhãn **"Chọn nhanh"**, rồi `role="group"` `aria-label="Chọn nhanh"` gồm 3 chip theo `MEDICINE_PRESETS`.
- Dưới đó: nhãn **"Gần đây"**, rồi nhóm `aria-label="Thuốc gần đây"`, chỉ hiện khi danh sách sau khi lọc còn ít nhất 1 tên.
- Chip dùng style `VALUE_CHIP` hiện có, cao ≥ 44 px. Chip có tên trùng ô "Tên thuốc" (so như trên) thì **bỏ utility `glass`** (vì `glass` đặt shorthand `background`, sẽ giành với `bg-accent`) và dùng `border border-transparent bg-accent text-on-accent` (giữ viền 1 px để chip không đổi kích thước so với chip chưa chọn), theo cách variant primary của `Button` làm, kèm `aria-pressed="true"`. Các chip còn lại `aria-pressed="false"`.
- Bấm chip → `onChange({ ...values, ...medicinePrefill(chip, logs) })`. Ghi đè lượng, đơn vị và công tắc hạ sốt đang có. Sheet trở thành `dirty` như khi gõ tay.
- `MedicineFields` nhận thêm prop `logs: LogLike[]`, hoặc nhận sẵn một hàm `onPick(name)` từ `QuickEntrySheet`. Plan được chọn một trong hai, miễn là luật nằm trong `lib/rules/`.

### 4.3 Đơn vị gói và ống

- `detailsSchemas.medicine.unit` thành `z.enum(["ml", "mg", "giọt", "viên", "gói", "ống"])`. `QUICK_FIELDS.medicine` dùng cùng danh sách đó, đúng thứ tự.
- `components/ui/Segmented.tsx` hiện ném lỗi khi có hơn 4 lựa chọn. Nâng giới hạn thành **2–6**, thông báo lỗi đổi thành `Segmented needs 2–6 options, got N`. Cỡ chữ giữ 13 px cho 3–6 lựa chọn. Sửa `components/ui/segmented.test.tsx` cho giới hạn mới (6 thì render được, 7 thì ném lỗi).
- `components/quick/FieldList.tsx` (dùng trong `LogEditSheet`) đổi điều kiện `options.length <= 4` thành `<= 6`, để ô đơn vị khi sửa log cũng là Segmented 6 nút như sheet ghi nhanh, không bị rơi về `<select>`. Ngoài dòng này, `LogEditSheet` không đổi gì.
- Segmented "Đơn vị" phải giữ 6 nút trên **một dòng** ở bề ngang 375 px, không nút nào xuống dòng (kiểm trong Chrome (Claude in Chrome), cả sheet ghi nhanh lẫn `LogEditSheet`).
- `describeLog` không đổi: "Thuốc Men tiêu hoá 1 gói".
- Không có migration: cột `details` là jsonb, chỉ client kiểm. Rủi ro đã chấp nhận: máy nào còn chạy bản cũ đã cache sẽ thấy log có "gói"/"ống" ở dạng dự phòng (safeParse trượt) cho tới khi service worker cập nhật.

## 5. Popup "Bỏ thay đổi?" giữa màn hình (`components/ui/Sheet.tsx`)

### 5.1 Hành vi

- Mọi cách đóng (nút X, Esc/`cancel`, chạm scrim, kéo tay cầm quá ngưỡng) vẫn đi qua `requestClose()`. Khi `dirty`:
  1. Nếu `document.activeElement` là một `HTMLElement` nằm trong dialog thì gọi `.blur()` để tắt bàn phím.
  2. `setConfirming(true)`.
- Trong lúc `confirming`:
  - Esc (`cancel`) → `setConfirming(false)`, sheet ở lại.
  - Chạm vào lớp tối bên ngoài hộp thoại → `setConfirming(false)`.
  - Chạm scrim của sheet và kéo tay cầm đều bị bỏ qua.
- Bấm "Bỏ thay đổi" → `setConfirming(false); setClosing(true)`, chạy hiệu ứng đóng sheet như hiện tại.
- Bấm "Tiếp tục nhập" → `setConfirming(false)`. Không tự focus lại ô nhập, để bàn phím không bật lên ngoài ý muốn.
- Footer của sheet (nút Lưu) luôn hiện; xoá nhánh `confirming ? … : footer` ở đáy panel.

### 5.2 Giao diện

- Lớp phủ nằm **bên trong `<dialog>`**, là anh em sau panel, để luôn thuộc top layer: `fixed inset-0 z-10 flex items-center justify-center bg-black/35 p-6`. Lớp tối `bg-black/35` và bóng `rgb(0 0 0/0.3)` của hộp thoại được **miễn** quy tắc "màu chỉ đặt trong hai file": chúng là đen trong suốt, dùng chung cho mọi theme, giống bóng của panel sheet hiện có.
- Hộp thoại: `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` trỏ vào tiêu đề, `aria-describedby` trỏ vào dòng phụ. Class `w-full max-w-[300px] rounded-[28px] bg-glass-solid p-[22px_18px_16px] text-center shadow-[0_20px_60px_rgb(0_0_0/0.3)]`. Dùng màu đặc, không dùng `glass`, để tránh lỗi kính lồng nhau trên iOS và chữ dễ đọc trong cả 4 theme.
- Nội dung, từ trên xuống:
  - Tiêu đề `Bỏ thay đổi?`: `text-[19px] font-bold text-ink`.
  - Dòng phụ `Những gì vừa nhập sẽ không được lưu.`: `text-[15px] text-muted`.
  - Hai nút cách nhau 8 px, rộng hết hộp, cách dòng phụ 16 px: `<Button variant="danger">Bỏ thay đổi</Button>` rồi `<Button variant="secondary">Tiếp tục nhập</Button>`.
- Khi mở, focus đặt vào "Tiếp tục nhập" (gọi `focus({ preventScroll: true })` sau khi render). Hộp thoại nằm cố định giữa màn hình, nên không dính lỗi nhảy trang của 8648a1d.
- Hiệu ứng: lớp tối dùng `kb-fade-in` 180 ms; hộp thoại dùng keyframe mới `kb-pop-in` (opacity 0→1, scale 0.94→1) 180 ms, `cubic-bezier(0.32,0.72,0,1)`. Cả hai tắt khi `prefers-reduced-motion: reduce`.
- Theme Ban đêm: dùng sẵn token (`glass-solid #160F0A`, `danger-solid`, `on-danger`), không thêm màu.

## 6. Kiểm thử

### 6.1 Unit test (vitest)

- `lib/rules/theme.test.ts`: `parseLightStyle` (null, cả 5 giá trị, rác); `resolveActiveTheme` cho ra đúng theme sáng theo style; Tối, override và cửa sổ ban đêm vẫn thắng.
- `lib/theme.test.ts`: script inline khớp với `readThemeState` + `resolveActiveTheme` cho mọi style và một giá trị rác, cả khi thiếu khoá.
- `lib/ui/tokens.test.ts` và `lib/ui/contrast.test.ts`: `contrast.test.ts` tự chạy cho 4 theme mới vì lặp theo `THEME_NAMES`. `tokens.test.ts` phải thêm 4 mục `rose`, `peach`, `lavender`, `sea` vào map `OPENERS`; thiếu thì test ném lỗi và trượt type-check. Thêm ca: ngoài `on-accent` và `on-danger`, không token nào của 4 theme là `#FFFFFF`. `lib/theme.test.ts` kiểm `lightSwatch`.
- `lib/rules/quickEntry.test.ts`: `recentMedicineNames` có `exclude` (vẫn lấy đủ 4 tên sau khi lọc); `medicinePrefill` cho 3 nhánh, có ca so không phân biệt hoa thường và ca lượng thập phân `"2,5"`.
- `lib/rules/logDetails.test.ts`: schema chấp nhận `gói`, `ống`, và vẫn từ chối đơn vị lạ.
- `components/quick/choices.test.tsx`: có nhóm "Chọn nhanh" với 3 chip; chip đang chọn có `aria-pressed="true"`; nhóm "Gần đây" ẩn khi rỗng.
- Hộp thoại tách ra thành component trình bày riêng `DiscardConfirm({ onDiscard, onKeep })`, export từ `components/ui/Sheet.tsx`. `components/ui/sheet.test.tsx` render nó bằng `renderToStaticMarkup`: có `role="alertdialog"`, tiêu đề, dòng phụ và 2 nút đúng thứ tự. Sheet ở trạng thái thường vẫn render footer. Việc xoá nhánh `confirming ? … : footer` được kiểm bằng đọc code, không có test riêng.
- `components/quick/fieldlist.test.tsx`: `LOG_FIELDS.medicine` render ô đơn vị thành Segmented 6 nút, không có `<select>`. Sửa luôn comment "2–4 options" ở `FieldList.tsx:7`.
- `components/quick/choices.test.tsx`: kỳ vọng cũ khi bấm chip "Gần đây" (`{ ...values, name: "Vitamin D" }`) đổi theo `medicinePrefill`. Đây là thay đổi có chủ đích, không phải lỗi hồi quy.
- `components/settings/*`: AppearanceGroup có hàng 5 `Swatch` "Nền sáng" đúng thứ tự, chấm đang chọn có `selected`, bấm chấm gọi `onLightStyle` với đúng style.

### 6.2 Kiểm trong Chrome (Claude in Chrome, mở tab mới) (không bấm Lưu)

- Ở 375×812: trang chủ, Nhật ký, Cài đặt và sheet "+" với theme `rose`, `peach`, `lavender`, `sea`, `light`, `dark`, `night`. Không có tràn ngang.
- Đổi "Nền sáng" qua lại; tải lại trang không chớp trắng (script inline).
- Sheet Thuốc: bấm từng chip; Segmented 6 đơn vị nằm trên một dòng.
- Gõ dở rồi bấm X: hộp thoại hiện giữa màn hình. Esc / chạm ngoài → ở lại; "Bỏ thay đổi" → đóng.

### 6.3 Checklist thiết bị

Thêm **"Bước 30 — Nền sáng dịu mắt, chip thuốc, popup giữa màn hình"** vào `docs/device-checklist.md`, chờ người dùng thử trên iPhone:

1. Mở app lần đầu sau cập nhật → nền Hồng dịu, không chớp trắng.
2. Cài đặt › Nền sáng: bấm lần lượt Trắng, Đào mơ, Oải hương, Biển sương, rồi về lại Hồng dịu.
3. Sheet Thuốc: bấm DHA → điền tên (và liều lần trước nếu đã từng ghi).
4. Đang gõ tên thuốc, bàn phím đang mở, bấm X → bàn phím tắt, hộp thoại "Bỏ thay đổi?" hiện rõ giữa màn hình.

Không đánh dấu "Đạt" thay người dùng.

## 7. Thứ tự làm

Ba phần độc lập, làm theo thứ tự này: **§5 popup → §4 chip thuốc → §3 bốn nền sáng**. Popup sửa lỗi người dùng đang gặp; theme đụng nhiều file nhất nên làm cuối. Có thể gom cả ba vào một plan (ước lượng ≤ 12 task) hoặc tách mỗi phần một plan.
