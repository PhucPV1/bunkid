# Kim Bun — Giao diện Liquid Glass (đổi tên và làm lại UI)

**Status:** approved 2026-11-14
**Ngày:** 2026-11-14
**Unit:** `web` (PWA Next.js trên Vercel). Một unit, không đụng Supabase, push server, outbox.
**Liên quan:** spec gốc `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (gọi tắt là "spec gốc"), audit `docs/ui-audit-2026-11-14.md`, bản vẽ trên canvas Claude Design "Kim Bun — UI concepts" (https://claude.ai/artifact/CXCfnTEi9XqUTXB9CEJ2DX; hướng đã chốt là hàng "B · Liquid Glass" và "Logo 1 · Bánh bao Bun"). Mọi giá trị cần để code đều nằm trong spec này; canvas chỉ để tham khảo hình.

## 1. Mục tiêu

1. Đổi tên ứng dụng từ "Bé Yêu" thành **Kim Bun**, có logo và icon mới.
2. Làm lại toàn bộ giao diện theo phong cách **iOS 26 Liquid Glass** để app trông và dùng như app native trên iPhone.
3. Sửa các lỗi UI/UX trong audit: viền theo màu chữ, độ tương phản nút, thông tin quan trọng bị chìm, lưới nút lệch, sheet nhập không giới hạn chiều cao, emoji ở tab bar, Khẩn cấp bị chôn, Cài đặt quá dài.
4. Ba theme: **Sáng**, **Tối**, **Ban đêm** (kính tối tông hổ phách).

Ngoài phạm vi: đổi bảng, RLS, outbox, push server, luật nghiệp vụ trong `lib/rules/` (chỉ thêm các hàm ở mục 2.3), tính năng nghiệp vụ mới, ghi chú trong sheet nhập nhanh, đa ngôn ngữ.

## 2. Global Constraints

### 2.1 Giữ từ spec gốc

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Next.js 16.x (App Router), React 19.x, TypeScript 5.x `strict: true`, Bun 1.x, Tailwind CSS 4.x. Phiên bản chính xác giữ như `package.json` hiện tại (`next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3).
- Mọi trang là client-rendered shell như hiện nay; không thêm middleware, không kiểm tra đăng nhập phía server.
- Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.
- Chiều rộng thiết kế 375–440 pt; vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`.
- Logic nghiệp vụ là hàm thuần trong `lib/rules/`, có unit test.
- Trước khi viết code dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).

### 2.2 Riêng đợt này

- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`. Icon tự vẽ bằng SVG; PNG icon sinh bằng `ImageResponse` của `next/og` (có sẵn trong Next).
- **Không tải font web.** Font chữ: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Noto Sans", sans-serif`. Font tròn cho wordmark: `ui-rounded, "SF Pro Rounded", -apple-system, sans-serif`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- **Màu chỉ khai báo ở 3 nơi:** `app/globals.css` (token CSS), `lib/ui/tokens.ts` (bảng màu dùng chung cho test, màu ô phân, màu nút Google), `lib/brand/logo.ts` (logo). `lib/themeGuard.test.ts` giữ nguyên luật: không mã hex 6 chữ số và không class bảng màu Tailwind trong `components/`; component lấy màu ô phân và nút Google bằng cách import từ `lib/ui/tokens.ts`.
- **Tương phản:** mọi cặp chữ/nền trong mục 4.1–4.2 đạt **≥ 4.5:1** ở cả 3 theme, tính trên `--color-bg` và trên kính đã trộn alpha với `--color-bg`. Icon màu loại sự kiện đạt ≥ 4.5:1 (cùng bảng). `--color-switch-on` đạt ≥ 3:1 so với `--color-bg`. Viền kính (`--color-edge`) là trang trí, không tính. Có test tự động (mục 11.1).
- Không đổi `localStorage` key đang có (`be-yeu-theme` và các key khác) để người dùng không mất cài đặt. Không đổi tên package `be-yeu`, tên repo, URL `bunkid.vercel.app`.
- Route cũ phải còn chạy: route bị gộp thì chuyển hướng (mục 6.2), không trả 404.
- Báo cáo `/bao-cao` khi in vẫn đen trắng trên A4 (spec gốc §6.15). Trong `@media print`: ẩn `Backdrop`, tab bar, nút "+"; kính thành nền trắng, bỏ blur và bóng.
- Tôn trọng `prefers-reduced-motion: reduce` (tắt chuyển động) và `prefers-reduced-transparency: reduce` (bỏ kính, dùng nền đặc).

### 2.3 Hàm thuần mới trong `lib/rules/`

| Hàm                   | File                      | Việc                                                                                                                        |
| --------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `resolveActiveTheme`  | `lib/rules/theme.ts`      | Chọn theme đang hiệu lực từ lựa chọn, hệ thống, lịch Ban đêm, bật tay (mục 6.6)                                             |
| `nextNightBoundary`   | `lib/rules/theme.ts`      | Mốc lịch kế tiếp theo `schedule.start`/`schedule.end`, giờ VN                                                               |
| `timeChipToDate`      | `lib/rules/timeChips.ts`  | Đổi chip "Bây giờ / 5 phút trước / 15 phút trước" thành thời điểm                                                           |
| `recentBottleAmounts` | `lib/rules/quickEntry.ts` | Tối đa 3 giá trị ml khác nhau gần nhất từ log `bottle`, mới nhất trước                                                      |
| `recentMedicineNames` | `lib/rules/quickEntry.ts` | Tối đa 4 tên thuốc khác nhau gần nhất (so sánh không phân biệt hoa thường, giữ cách viết lần gần nhất)                      |
| `heroState`           | `lib/rules/hero.ts`       | Chọn trạng thái thẻ chính Trang chủ (mục 7.2)                                                                               |
| `sleepStatusLine`     | `lib/rules/status.ts`     | Export riêng dòng ngủ/thức đang có trong `homeStatusLines` (hàm `sleepLine` hiện tại); `homeStatusLines` giữ nguyên kết quả |
| `contrastRatio`       | `lib/rules/contrast.ts`   | Tỉ lệ tương phản WCAG giữa hai màu, hỗ trợ trộn màu có alpha lên nền                                                        |

`lib/theme.ts` giữ `resolveTheme(pref, prefersDark)`, `parseThemePref`, `THEME_STORAGE_KEY` để không vỡ code cũ; `THEME_INIT_SCRIPT` và `useTheme` chuyển sang dùng `resolveActiveTheme`. `THEME_OPTIONS` đổi ngay từ đợt 1 thành Sáng (`"light"`) / Tối (`"dark"`) / Tự động (`"system"`), bỏ lựa chọn "Ban đêm", để không màn nào còn ghi `"night"` vào `be-yeu-theme`.

## 3. Tên và nhận diện

### 3.1 Tên

Thay "Bé Yêu" bằng "Kim Bun" ở mọi chuỗi người dùng nhìn thấy:

| File                                            | Chỗ                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `app/layout.tsx`                                | `metadata.title`, `appleWebApp.title`                                        |
| `public/manifest.webmanifest`                   | `name` = "Kim Bun", `short_name` = "Kim Bun"                                 |
| `sw/sw.template.js` (và `public/sw.js` sinh ra) | `FALLBACK_TITLE` = "Kim Bun có thông báo mới"; cập nhật `scripts/sw.test.ts` |
| `components/auth/LoginScreen.tsx`               | Tiêu đề, link cài app                                                        |
| `components/install/InstallGuide.tsx`           | Tiêu đề "Cài Kim Bun" và 3 câu hướng dẫn                                     |
| `components/push/DevicePushControl.tsx`         | 3 câu nhắc ("… Thông báo → Kim Bun …")                                       |
| `components/settings/*`                         | "Cài Kim Bun lên màn hình chính", câu hướng dẫn thành viên                   |
| `components/report/ReportScreen.tsx`            | Dòng chân "ứng dụng Kim Bun"                                                 |
| `README.md`                                     | Tiêu đề                                                                      |

Lệnh kiểm: `grep -rn "Bé Yêu" app components lib sw public scripts README.md` không còn kết quả.

Ghi vào `docs/device-checklist.md`: iPhone đã cài app cũ phải **xóa biểu tượng cũ và cài lại** mới thấy tên và icon mới.

### 3.2 Logo "Bánh bao Bun"

Nguồn SVG duy nhất ở `lib/brand/logo.ts`, export:

- `LOGO_SVG_ROUNDED`: nền bo `rx="27"`, dùng cho favicon và logo trong app.
- `LOGO_SVG_SQUARE`: cùng nội dung, nền vuông không bo (iOS và Android tự bo), dùng để sinh PNG.
- `LOGO_SVG_MASKABLE`: nền vuông gradient đầy khung, phần hình (bánh bao, sao) thu về 80% quanh tâm (`<g transform="translate(12 12) scale(0.8)">`).

Nội dung `LOGO_SVG_ROUNDED` (viewBox `0 0 120 120`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="kb1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFD9C7"/>
      <stop offset="1" stop-color="#EE7AA3"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="27" fill="url(#kb1)"/>
  <path d="M20 80c0-23 18-42 40-42s40 19 40 42c0 8-6 13-14 13H34c-8 0-14-5-14-13z" fill="#FFF8F2"/>
  <path d="M50 41c3-7 7-10 10-10s7 3 10 10" fill="none" stroke="#F0C3B2" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M43 67c2.5 3 7.5 3 10 0M67 67c2.5 3 7.5 3 10 0" fill="none" stroke="#2B1B22" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M55 76c3 2.4 7 2.4 10 0" fill="none" stroke="#2B1B22" stroke-width="3" stroke-linecap="round"/>
  <circle cx="40" cy="76" r="4.5" fill="#FF9EB5" opacity="0.75"/>
  <circle cx="80" cy="76" r="4.5" fill="#FF9EB5" opacity="0.75"/>
  <path d="M93 14l3.4 9.6 9.6 3.4-9.6 3.4L93 40l-3.4-9.6L80 27l9.6-3.4z" fill="#FFC94A"/>
</svg>
```

`LOGO_SVG_SQUARE` bỏ `rx="27"`. `LOGO_SVG_MASKABLE` bỏ `rx="27"` và bọc 7 phần tử sau `<rect>` trong nhóm thu nhỏ nêu trên.

### 3.3 File icon

Giữ nguyên các URL icon cũ để service worker, manifest và thông báo đẩy không phải đổi đường dẫn:

| URL                           | Nội dung                                          | Kích thước |
| ----------------------------- | ------------------------------------------------- | ---------- |
| `/icons/icon.svg`             | `LOGO_SVG_ROUNDED`, `Content-Type: image/svg+xml` | vector     |
| `/icons/icon-192.png`         | PNG từ `LOGO_SVG_SQUARE`                          | 192×192    |
| `/icons/icon-512.png`         | PNG từ `LOGO_SVG_SQUARE`                          | 512×512    |
| `/icons/maskable-512.png`     | PNG từ `LOGO_SVG_MASKABLE`                        | 512×512    |
| `/icons/apple-touch-icon.png` | PNG từ `LOGO_SVG_SQUARE`                          | 180×180    |

- Phục vụ bằng một Route Handler `app/icons/[file]/route.tsx`: `file` chỉ nhận đúng 5 tên trên, tên khác trả 404. PNG dùng `ImageResponse` (`next/og`) vẽ SVG tương ứng. Kết quả tĩnh, sinh lúc build (`generateStaticParams` với 5 tên; cách khai báo tĩnh chính xác chốt ở plan sau khi đọc `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md` và trang Route Handlers).
- Xóa `public/icons/*.png` (file tĩnh trùng đường dẫn sẽ che route), `scripts/make-icons.ts`, script `icons` trong `package.json`. Xóa `scripts/png.ts` và `scripts/png.test.ts` nếu không file nào khác có câu lệnh `import` trỏ tới `scripts/png` (kiểm câu lệnh import, không tìm chữ "png").
- `app/layout.tsx`: `metadata.icons = { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" }`.
- `public/manifest.webmanifest`: `icons` = 192 (`purpose: "any"`), 512 (`purpose: "any"`), maskable-512 (`purpose: "maskable"`); `background_color: "#FBF3F0"`; `theme_color: "#FBF3F0"`.
- `sw/sw.template.js`: danh sách precache thêm `/icons/icon.svg` và `/icons/maskable-512.png`; `showNotification` vẫn dùng `icon: "/icons/icon-192.png"`.

### 3.4 Wordmark

"Kim Bun" font tròn (mục 2.2), độ đậm 800, `letter-spacing: -0.02em`. Dùng ở màn Đăng nhập (logo 96 pt + wordmark 34 pt + câu "Nhật ký chăm bé của cả nhà") và màn Cài app (logo 64 + wordmark 28).

## 4. Hệ thiết kế

### 4.1 Token màu

Khai báo trong `app/globals.css`: Sáng dưới `@theme`, Tối dưới `:root[data-theme="dark"]`, Ban đêm dưới `:root[data-theme="night"]`. Cùng giá trị phải có trong `lib/ui/tokens.ts` (object `THEMES.light/dark/night`); test mục 11.1 so khớp hai nơi bằng cách đọc `globals.css`.

**Token mới:**

| Token                                            | Sáng                      | Tối                       | Ban đêm                  |
| ------------------------------------------------ | ------------------------- | ------------------------- | ------------------------ |
| `--color-bg` (nền trang)                         | `#FBF3F0`                 | `#0F0B12`                 | `#0A0705`                |
| `--color-blob-1`                                 | `#FFC2A6`                 | `#6B2E46`                 | `#3A170A`                |
| `--color-blob-2`                                 | `#D9C9FF`                 | `#33295C`                 | `#2B1407`                |
| `--color-blob-3`                                 | `#FFB8CB`                 | `#5A1F38`                 | `#2B1407`                |
| `--color-ink` (chữ chính)                        | `#2B1B22`                 | `#F5EEF2`                 | `#D9895C`                |
| `--color-muted` (chữ phụ)                        | `#6E5560`                 | `#B8A9B1`                 | `#B5734F`                |
| `--color-glass` (thẻ kính)                       | `rgb(255 255 255 / 0.55)` | `rgb(255 255 255 / 0.08)` | `rgb(217 137 92 / 0.06)` |
| `--color-glass-strong` (sheet, tab bar)          | `rgb(255 255 255 / 0.82)` | `rgb(36 26 34 / 0.82)`    | `rgb(22 15 10 / 0.9)`    |
| `--color-glass-solid` (thay kính khi không blur) | `#FFFFFF`                 | `#221F25`                 | `#160F0A`                |
| `--color-edge` (viền kính, trang trí)            | `rgb(255 255 255 / 0.85)` | `rgb(255 255 255 / 0.14)` | `rgb(217 137 92 / 0.16)` |
| `--color-line` (đường kẻ trong list)             | `rgb(43 27 34 / 0.07)`    | `rgb(255 255 255 / 0.08)` | `rgb(217 137 92 / 0.10)` |
| `--color-scrim` (phủ sau sheet)                  | `rgb(43 27 34 / 0.22)`    | `rgb(0 0 0 / 0.45)`       | `rgb(0 0 0 / 0.55)`      |
| `--color-accent` (nền nút chính)                 | `#B8285E`                 | `#FF7AA8`                 | `#6B2A12`                |
| `--color-on-accent` (chữ trên nút chính)         | `#FFFFFF`                 | `#2B0A17`                 | `#F4A070`                |
| `--color-accent-text` (chữ/icon nhấn)            | `#B8285E`                 | `#FF9EBF`                 | `#F4A070`                |
| `--color-accent-tint` (nền tab đang chọn)        | `rgb(184 40 94 / 0.12)`   | `rgb(255 122 168 / 0.18)` | `rgb(107 42 18 / 0.6)`   |
| `--color-good`                                   | `#1F7A3A`                 | `#8FDDA0`                 | `#D9895C`                |
| `--color-warn`                                   | `#955700`                 | `#FFC56B`                 | `#D9895C`                |
| `--color-danger`                                 | `#C4142B`                 | `#FF8A7A`                 | `#E0704A`                |
| `--color-danger-solid` (nền banner đỏ, nút 115)  | `#C4142B`                 | `#B3261E`                 | `#4A140A`                |
| `--color-on-danger` (chữ trên `danger-solid`)    | `#FFFFFF`                 | `#FFFFFF`                 | `#E0704A`                |
| `--color-switch-on`                              | `#1F7A3A`                 | `#30D158`                 | `#C06A34`                |

**Token cũ** (giữ tên để màn chưa làm lại không vỡ; giá trị mới):

| Token cũ                                                              | Sáng                     | Tối                   | Ban đêm               |
| --------------------------------------------------------------------- | ------------------------ | --------------------- | --------------------- |
| `--color-surface`                                                     | `= --color-bg`           | `= --color-bg`        | `= --color-bg`        |
| `--color-ink`, `--color-muted`, `--color-accent`, `--color-on-accent` | như bảng trên            |                       |                       |
| `--color-soft`                                                        | `#F3E8E4`                | `#221F25`             | `#160F0A`             |
| `--color-accent-soft`                                                 | `= --color-accent-tint`  |                       |                       |
| `--color-accent-ink`                                                  | `= --color-accent-text`  |                       |                       |
| `--color-accent-line`                                                 | `#E9B9CB`                | `#5A2340`             | `#4A1D0E`             |
| `--color-alarm`                                                       | `= --color-danger-solid` |                       |                       |
| `--color-danger-soft` / `--color-danger-ink`                          | `#FCE4E2` / `#8A0F1F`    | `#3A1515` / `#FFD4CF` | `#2A0D07` / `#E0704A` |
| `--color-warn-soft` / `--color-warn-ink`                              | `#FCEBD0` / `#7A4300`    | `#3A2A10` / `#FFE2A8` | `#23140A` / `#D9895C` |
| `--color-good-soft` / `--color-good-ink`                              | `#DDF1E3` / `#1A5A30`    | `#0F2A1A` / `#BFF0CB` | `#17140A` / `#D9895C` |

Mỗi màn được làm lại thì bỏ dùng token cũ; khi mọi màn xong (đợt 5) thì token cũ có thể xóa nếu `grep` không còn chỗ dùng.

Theme Ban đêm: không có `#FFFFFF` và không có màu có hue 180–260 ở bất kỳ token nào.

### 4.2 Màu theo loại sự kiện và icon

Dùng cho icon, chip, chấm trong danh sách, cột biểu đồ. Nền chip = màu đó ở độ đục 14% (Sáng) / 18% (Tối) / 12% (Ban đêm).

| Loại (`logs.type`)        | Token                | Sáng      | Tối       | Ban đêm   | Icon     |
| ------------------------- | -------------------- | --------- | --------- | --------- | -------- |
| `breast`                  | `--color-cat-feed`   | `#C2185B` | `#FF7AA8` | `#D9895C` | `heart`  |
| `bottle`                  | `--color-cat-bottle` | `#B0365D` | `#FFA3B8` | `#D9895C` | `bottle` |
| `sleep`                   | `--color-cat-sleep`  | `#5B4BC4` | `#A99BFF` | `#D9895C` | `moon`   |
| `diaper`                  | `--color-cat-diaper` | `#955700` | `#FFC56B` | `#D9895C` | `drop`   |
| `pump`                    | `--color-cat-pump`   | `#8E3FC4` | `#D6A6FF` | `#D9895C` | `cup`    |
| `tummy`                   | `--color-cat-tummy`  | `#2E7D46` | `#8FDDA0` | `#D9895C` | `smile`  |
| `medicine` (cả Vitamin D) | `--color-cat-med`    | `#C0392B` | `#FF8A7A` | `#D9895C` | `pill`   |
| `temperature`             | `--color-cat-temp`   | `#1B6F87` | `#7FD4EA` | `#D9895C` | `thermo` |

Bảng map loại → token và icon nằm ở `lib/ui/categories.ts`, dùng chung cho Trang chủ, bảng 9 hành động, Nhật ký, Thống kê.

**Màu ô phân** (`lib/ui/tokens.ts`, `STOOL_SWATCHES`, giống nhau ở mọi theme vì là màu thật): `yellow` `#E2B33C`, `green` `#7C9A3A`, `brown` `#8A5A33`, `black` `#26221F`, `pale` `#EFEBE0`, `red` `#B3261E`; `""` (Không ghi) là ô viền đứt `--color-muted`. Ô `black` và `pale` có viền 1 px `--color-muted` ở mọi theme.

### 4.3 Kính

- Lớp `.glass`: `background: var(--color-glass); border: 1px solid var(--color-edge); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);`
- `.glass-strong` (sheet, tab bar, header thu gọn): như trên với `--color-glass-strong`, blur 40px.
- Nền đặc thay kính khi `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` hoặc `@media (prefers-reduced-transparency: reduce)`: `background: var(--color-glass-solid); backdrop-filter: none; -webkit-backdrop-filter: none`.
- Nền trang: component `Backdrop` vẽ 3 vệt tròn `--color-blob-1..3` (đường kính 300, 320, 340 px; `filter: blur(72px)`; độ đục 0.8) cố định (`position: fixed; inset: 0; z-index: -1; pointer-events: none`). Vị trí: vệt 1 góc trên trái (lệch −90, −60), vệt 2 bên phải (lệch +110 ra ngoài, top 260), vệt 3 dưới trái (lệch −60, top 720). Khi giảm trong suốt hoặc khi in: không vẽ.
- Bóng: thẻ chính `0 10px 40px rgb(0 0 0 / 0.10)` (Sáng) / `rgb(0 0 0 / 0.40)` (Tối); tab bar `0 10px 30px rgb(0 0 0 / 0.15)` (Sáng) / `0.25` (Tối). Ban đêm không có bóng.

### 4.4 Chữ

| Vai trò                       | Cỡ / dòng / đậm (px)                          |
| ----------------------------- | --------------------------------------------- |
| Tiêu đề lớn (tab, trang con)  | 34 / 41 / 700                                 |
| Tiêu đề sheet                 | 22 / 28 / 700                                 |
| Tiêu đề nhóm                  | 20 / 26 / 700                                 |
| Headline (tên mục trong list) | 17 / 22 / 600                                 |
| Thân                          | 16 / 22 / 400 hoặc 500                        |
| Phụ (meta, ghi chú)           | 13 / 18 / 400                                 |
| Nhãn nhóm (chữ hoa)           | 13 / 18 / 600, `letter-spacing: 0.04em`       |
| Nhãn tab, nhãn nút tròn       | 10 / 12 / 600 (tab), 12 / 16 / 500 (nút tròn) |
| Đồng hồ thẻ chính             | 48 / 52 / 600, `letter-spacing: -0.02em`      |
| Số liệu trong thẻ             | 22 / 28 / 700                                 |

Mọi giờ và số đo dùng `font-variant-numeric: tabular-nums`.

### 4.5 Kích thước

- Bo góc: sheet 38, thẻ chính 32, thẻ 28, ô bấm 24, ô nhập 16, icon nền trong list Cài đặt 9; nút và chip bo tròn hẳn (`9999px`).
- Khoảng cách: lề trang 16; giữa các khối 18; trong khối 10; đệm trong thẻ 16.
- Nút chính và phụ cao 50; nút tròn header 44; nút bấm giờ tròn 58; nút "+" 62; ô trong bảng 9 hành động cao 100; nút "Lưu" của sheet cao 56.
- Tab bar: cao 62, cách hai bên 16, cách đáy `calc(env(safe-area-inset-bottom) + 10px)`, tối thiểu 26.

### 4.6 Icon

`lib/ui/icons.ts` export `ICON_PATHS: Record<IconName, string>` (mỗi icon một chuỗi `d`). `components/ui/Icon.tsx` export `<Icon name size? strokeWidth? filled? />`: SVG `viewBox="0 0 24 24"`, `stroke="currentColor"`, `fill="none"` (hoặc `currentColor` khi `filled`), `stroke-linecap="round"`, `stroke-linejoin="round"`, mặc định size 22, nét 2, `aria-hidden="true"`.

```ts
export const ICON_PATHS = {
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  cup: "M6 8h12l-1.5 12a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2zM9 8V4h6v4",
  smile:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 14.5s1.5 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01",
  bottle: "M9 2h6M10 2v3l-2 3v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l-2-3V2M8 12h8",
  drop: "M12 2.7s-6 6.4-6 11a6 6 0 0 0 12 0c0-4.6-6-11-6-11z",
  pill: "M10.5 20.5a5 5 0 0 1-7-7l6-6a5 5 0 0 1 7 7zM8.5 8.5l7 7",
  thermo: "M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z",
  phone:
    "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  sliders:
    "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  explore: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5-2 5-5 2 2-5z",
  chart: "M3 3v18h18M7 15l4-4 3 3 6-6",
  ruler:
    "M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0L21.3 10.1a1 1 0 0 0 0-1.4zM7.5 10.5l2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2",
  syringe:
    "m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6",
  star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  hands: "M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z",
  wave: "M2 12h2M6 8v8M10 5v14M14 8v8M18 10v4M22 12h0",
  music:
    "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  image:
    "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  pause: "M10 4H6v16h4zM18 4h-4v16h4z",
  phoneApp:
    "M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  check: "M20 6 9 17l-5-5",
  chevronLeft: "m15 6-6 6 6 6",
  chevronRight: "m9 6 6 6-6 6",
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  stop: "M7 7h10v10H7z",
  play: "M7 4v16l13-8z",
} as const;
```

`stop` và `play` dùng với `filled`.

### 4.7 Chuyển động

- Sheet: trượt lên `transform: translateY(100%) → 0`, 280 ms, `cubic-bezier(0.32, 0.72, 0, 1)`; scrim mờ dần 200 ms. Đóng ngược lại.
- Nút: `:active { transform: scale(0.97) }` 120 ms.
- Header thu gọn: đổi độ đục 160 ms.
- Đổi trang: dùng View Transitions API nếu trình duyệt có (`document.startViewTransition`), không thì đổi thẳng.
- `prefers-reduced-motion: reduce`: bỏ mọi transform và transition ở trên (đổi tức thì).

### 4.8 Tiêu điểm bàn phím

Mọi phần tử bấm được có `:focus-visible { outline: 2px solid var(--color-accent-text); outline-offset: 2px }`. Checkbox/radio native còn sót đặt `accent-color: var(--color-accent)`.

## 5. Bộ component `components/ui/`

| Component               | Việc                                                                                                                                                                                                                                                                                     | Đợt |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `Backdrop`              | Nền vệt màu cố định (mục 4.3); đặt một lần trong `Providers`                                                                                                                                                                                                                             | 1   |
| `Glass`                 | Khối kính; props `strong`, `radius`, `as`                                                                                                                                                                                                                                                | 1   |
| `Button`                | `variant`: `primary` / `secondary` (kính) / `ghost` / `danger`; `size`: `md` 44 / `lg` 50; `busy` chỉ làm mờ chính nút đó                                                                                                                                                                | 1   |
| `IconButton`            | Nút tròn 44, `aria-label` bắt buộc                                                                                                                                                                                                                                                       | 1   |
| `Icon`                  | Mục 4.6                                                                                                                                                                                                                                                                                  | 1   |
| `Sheet`                 | Dựa trên `<dialog>` + `showModal()`; tay nắm 36×5; `max-height: 88dvh`, phần thân cuộn, khối nút dính đáy; đóng bằng Esc, nút đóng, chạm scrim, kéo tay nắm xuống > 80 px; khi form đã đổi mà đóng thì hỏi "Bỏ thay đổi?" với nút "Bỏ" và "Tiếp tục nhập"; `aria-labelledby` trỏ tiêu đề | 1   |
| `Segmented`             | 2–4 lựa chọn, `aria-pressed`                                                                                                                                                                                                                                                             | 1   |
| `ChipGroup`             | Chip chọn một; cuộn ngang, ẩn thanh cuộn, mép phải mờ dần 48 px                                                                                                                                                                                                                          | 1   |
| `Switch`                | Công tắc 51×31, `role="switch"`, `aria-checked`, nền bật `--color-switch-on`, tắt `--color-line` đậm (`--color-muted` ở độ đục 0.3)                                                                                                                                                      | 1   |
| `Swatch`                | Ô màu tròn 44 có nhãn 12 bên dưới, chọn thì có vòng 2 px `--color-accent-text` cách 3 px                                                                                                                                                                                                 | 1   |
| `ListGroup` / `ListRow` | Danh sách kính bo 22; hàng cao ≥ 52, icon nền màu 30×30 bo 9, nhãn, giá trị `--color-muted`, chevron hoặc `Switch`; đường kẻ `--color-line`                                                                                                                                              | 1   |
| `Toast`                 | Viên thuốc `.glass-strong` nổi 12 px trên tab bar, 5 giây, tối đa một nút; `role="status"`                                                                                                                                                                                               | 1   |
| `Skeleton`              | Khối giữ chỗ nền `--color-line`; nhấp nháy 1.4 s trừ khi giảm chuyển động                                                                                                                                                                                                                | 1   |
| `StatTile`              | Ô số liệu: nhãn 12, số 22/700, dòng phụ 11                                                                                                                                                                                                                                               | 1   |
| `TimerRing`             | Vòng 200, nét 12, màu loại sự kiện đầy vòng, nền vòng màu đó 12%                                                                                                                                                                                                                         | 3   |
| `PageHeader`            | Tiêu đề lớn; cuộn quá 40 px thì hiện thanh `.glass-strong` dính trên cùng, tiêu đề 17/600 ở giữa; trang con có nút "‹ <tên trang cha>" dạng viên thuốc; slot nút phải                                                                                                                    | 2   |
| `TabBar`                | Mục 6.1                                                                                                                                                                                                                                                                                  | 2   |
| `ActionSheet`           | Bảng 9 hành động (mục 6.3), dùng `Sheet` biến thể nổi (cách đáy 104, bo 34, không tay nắm)                                                                                                                                                                                               | 2   |

Component trong `components/ui/` không gọi dữ liệu, chỉ nhận props.

## 6. Điều hướng

### 6.1 Tab bar

Viên thuốc `.glass-strong` nổi, 3 tab chia đều, nút "+" tròn 62 nền `--color-accent` chữ `--color-on-accent` tách riêng bên phải, cách 10.

| Tab      | Route       | Icon      |
| -------- | ----------- | --------- |
| Hôm nay  | `/`         | `home`    |
| Nhật ký  | `/nhat-ky`  | `list`    |
| Khám phá | `/kham-pha` | `explore` |

- Tab đang chọn: chữ và icon `--color-accent-text`, nền viên thuốc `--color-accent-tint` bo 27; tab khác chữ `--color-ink` ở độ đục 0.8.
- `activeTab` trong `lib/nav.ts`: `/` và `/cai-dat*` → Hôm nay; `/nhat-ky*` → Nhật ký; `/kham-pha` và mọi route trong mục 6.4 → Khám phá.
- Tab bar và nút "+" hiện ở mọi trang `AuthGate need="baby"`, ẩn khi in. Nội dung trang có `padding-bottom` ≥ 120 px.

### 6.2 Route

- Thêm `/kham-pha`, `/cai-dat/ho-so`, `/cai-dat/thanh-vien`, `/cai-dat/cu-bu`.
- `/cam-nang` và `/tien-ich` thành trang chỉ gọi `router.replace("/kham-pha")`.
- Các route con khác giữ nguyên đường dẫn.

### 6.3 Nút "+" và bảng 9 hành động

- Bấm "+" mở `ActionSheet` tiêu đề "Ghi lại cho <tên bé>", chú thích nhỏ bên phải "icon đồng hồ = bấm giờ", lưới 3×3 theo thứ tự: Bú trái, Bú phải, Bú bình / Ngủ, Thay tã, Hút sữa / Thuốc, Nhiệt độ, Nằm sấp.
- Mỗi ô: chip tròn 44 màu loại + nhãn 14/600. Ô bấm giờ có icon `clock` 14 góc phải trên. Ô có timer đang chạy: viền 2 px `--color-accent-text`, nhãn "Dừng <tên>".
- Chọn ô bấm giờ: đóng bảng, gọi đúng hành động như nút bấm giờ ở Trang chủ (`useTimerPress` với `button` tương ứng; giữ luồng hỏi ml khi dừng hút sữa).
- Chọn ô ghi nhanh: đóng bảng, mở sheet tương ứng (mục 8).
- Khi bảng mở, nút "+" thành nút đóng (icon `close`, nền `--color-ink`, icon `--color-bg`); tab bar mờ độ đục 0.6.

### 6.4 Khám phá `/kham-pha`

Thứ tự:

1. Thẻ **Khẩn cấp**: kính nền `--color-danger-soft` độ đục 0.75, viền `--color-danger` độ đục 0.3, icon `phone` màu `--color-on-danger` trong vòng tròn 48 `--color-danger-solid`, tiêu đề "Khẩn cấp" 17/700 `--color-danger-ink`, dòng phụ "Gọi 115, bác sĩ, hồ sơ nhóm máu và dị ứng" → `/khan-cap`.
2. **Theo dõi** (lưới 2 cột thẻ kính cao ≥ 128): Thống kê (`chart`, "Biểu đồ ngủ, bú, tã 7 và 14 ngày") `/thong-ke`; Tăng trưởng (`ruler`, "Cân nặng, chiều dài theo chuẩn WHO") `/tang-truong`; Tiêm chủng (`syringe`, "Mũi tiếp theo và lịch đã tiêm") `/tiem-chung`; Phát triển (`star`, "Các mốc theo tháng tuổi") `/phat-trien`.
3. **Cẩm nang** (`ListGroup`): Triệu chứng (`thermo`, "Hỏi từng bước, biết khi nào đi khám") `/trieu-chung`; Bệnh thường gặp (`book`, "10 bài theo NHS") `/benh-thuong-gap`; Bồng bế (`hands`, "Tư thế bế, ợ hơi, cho bú") `/bong-be`.
4. **Dỗ bé và kỷ niệm** (lưới 3 ô kính 64): Ồn trắng (`wave`) `/on-trang`, Nhạc (`music`) `/nhac`, Ảnh (`image`) `/anh`.
5. Hàng **Báo cáo cho bác sĩ** (`doc`, "In A4 tóm tắt 14 ngày gần nhất") → `/bao-cao`.

Màu icon các mục: Thống kê `--color-cat-sleep`, Tăng trưởng `--color-cat-tummy`, Tiêm chủng `--color-cat-temp`, Phát triển `--color-cat-diaper`, Triệu chứng `--color-cat-med`, Bệnh thường gặp `--color-cat-feed`, Bồng bế `--color-cat-tummy`, Ồn trắng `--color-cat-sleep`, Nhạc `--color-cat-feed`, Ảnh `--color-cat-diaper`, Báo cáo `--color-cat-temp`.

`lib/nav.ts` thay `GUIDE_ITEMS`/`TOOL_ITEMS` bằng `EXPLORE_SECTIONS`; xóa `components/nav/MenuScreen.tsx`.

### 6.5 Header Trang chủ

Trái: avatar tròn 44 (chữ cái đầu tên bé, nền gradient `#FFD9C7` → `#EE7AA3` lấy từ `lib/brand/logo.ts`) + tên bé 20/700 + tuổi 13 `--color-muted`; cả khối là link `/cai-dat`. Phải: `IconButton` trăng (`moon`, `filled` khi đang Ban đêm, `aria-label` "Bật chế độ ban đêm"/"Tắt chế độ ban đêm", `aria-pressed`), `IconButton` Khẩn cấp (`phone`, màu `--color-danger`) → `/khan-cap`. Bỏ dòng "Xin chào …".

### 6.6 Ban đêm

Lưu trong `localStorage` của từng máy:

- `be-yeu-theme`: `"light" | "dark" | "system"`. Giá trị cũ `"night"` đọc thành `"system"` và ghi một override bật đến mốc kế tiếp.
- `be-yeu-night-schedule`: `{ "enabled": boolean, "start": "HH:mm", "end": "HH:mm" }`, mặc định `{ "enabled": true, "start": "21:00", "end": "06:00" }`. `start`, `end` theo bước 30 phút.
- `be-yeu-night-override`: `{ "on": boolean, "until": "<ISO 8601>" } | null`.

`resolveActiveTheme({ pref, prefersDark, schedule, override, now })` trả `"light" | "dark" | "night"`:

1. `override` khác null và `now < until`: `override.on` → `"night"`; ngược lại → theme ban ngày (bước 3).
2. `schedule.enabled` và giờ VN của `now` nằm trong `[start, end)` (khoảng có thể qua nửa đêm) → `"night"`.
3. `pref` (`"system"` → `prefersDark ? "dark" : "light"`).

`nextNightBoundary(now, schedule)`: thời điểm gần nhất sau `now` mà giờ VN bằng `start` hoặc `end`.

Nút trăng: `override = { on: theme hiện tại !== "night", until: schedule.enabled ? nextNightBoundary(now, schedule) : <now + 100 năm> }`.

`THEME_INIT_SCRIPT` trong `<head>` tính đúng 3 bước trên trước lần vẽ đầu (tự chứa, không import). `useTheme` tính lại mỗi phút khi app mở và khi `localStorage` đổi, để lịch tự chuyển.

### 6.7 Màu thanh trạng thái

`<meta name="theme-color">` cập nhật theo theme đang hiệu lực: Sáng `#FBF3F0`, Tối `#0F0B12`, Ban đêm `#0A0705`. `viewport.themeColor` khai báo hai giá trị theo `prefers-color-scheme` (`#FBF3F0` / `#0F0B12`). `appleWebApp.statusBarStyle` giữ `"default"`.

### 6.8 Cài đặt `/cai-dat`

Trang con kiểu iOS: `PageHeader` nút "‹ Hôm nay", tiêu đề lớn "Cài đặt", rồi:

1. Thẻ hồ sơ bé: avatar 60, tên 20/700, dòng phụ "Bé trai|Bé gái · sinh dd/mm/yyyy · X,X kg" (cân lúc sinh nếu có) → `/cai-dat/ho-so` (form hồ sơ hiện có).
2. Nhóm **GIA ĐÌNH**: Thành viên (`users`, "N người" ›) → `/cai-dat/thanh-vien` (nội dung `MembersSection` hiện có); Khoảng cách cữ bú (`clock`, "X giờ" ›) → `/cai-dat/cu-bu` (nội dung `FeedIntervalSection`).
3. Nhóm **THÔNG BÁO**: phần quyền thông báo của máy (`DevicePushControl`) ở đầu nhóm; Nhắc cữ bú (`bell`), Nhắc khi bé thức lâu (`sun`), Nhắc lịch tiêm (`syringe`) là `Switch`; Tạm tắt nhắc (`pause`, giá trị "Không" hoặc "Đến HH:mm" ›) mở sheet chọn 2 / 4 / 8 giờ hoặc "Bật lại ngay".
4. Nhóm **GIAO DIỆN**: `Segmented` Sáng / Tối / Tự động (`"system"`); hàng "Ban đêm theo lịch" (`moon`, `Switch`); hàng "Giờ ban đêm" ("21:00–06:00" ›) mở sheet hai `Segmented`/danh sách giờ bước 30 phút.
5. Nhóm **ỨNG DỤNG**: Cài Kim Bun lên màn hình chính (`phoneApp`) → `/cai-app`.
6. Nhóm **TÀI KHOẢN**: "<tên> · <vai trò>", dòng phụ "Đăng nhập bằng Google"; nút "Đăng xuất" chữ `--color-danger` canh giữa.

Màu icon nền: Thành viên `--color-cat-sleep`, Cữ bú `--color-cat-feed`, các hàng thông báo `--color-cat-diaper`, Tạm tắt `--color-muted`, Ban đêm `--color-cat-diaper`, Cài app `--color-cat-temp`; icon vẽ màu `--color-bg` trên nền màu đó.

Quyền sửa giữ như hiện nay: chỉ owner sửa hồ sơ và cữ bú; người không có quyền thấy giá trị, không thấy chevron. Phần cần mạng vẫn bọc `OnlineOnly`.

## 7. Trang chủ `/`

### 7.1 Thứ tự

1. Header (mục 6.5).
2. Banner cảnh báo (`homeAlerts`): mức đỏ là thẻ bo 28 nền `--color-danger-solid` chữ `--color-on-danger`, nút "Gọi 115" (nền `--color-bg`, chữ `--color-danger`) và "Phân loại triệu chứng" (viền `--color-on-danger`); mức vàng là thẻ kính viền `--color-warn`, chữ `--color-warn-ink`.
3. Dòng đồng bộ: `SyncBar` vẫn do `AuthGate` vẽ ở mọi trang, đặt ngay dưới header trang (trên Trang chủ là dưới header mục 6.5); kiểu viên thuốc kính nhỏ "N mục chờ đồng bộ" với icon `clock`.
4. Thẻ chính (mục 7.2).
5. Timer phụ đang chạy (khi có hơn một): mỗi cái một hàng kính "<loại> · <thời gian chạy> · <người>" + nút "Dừng".
6. **Bấm giờ**: 5 nút tròn 58 (Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp), nhãn 12 dưới. Đang chạy: nền màu loại, icon `--color-bg`, quầng 4 px màu loại độ đục 0.3.
7. **Ghi nhanh**: lưới 2×2 nút viên thuốc kính cao 56 (Thay tã, Bú bình, Thuốc, Nhiệt độ), chip icon màu loại 32.
8. Vitamin D: chưa uống hôm nay → nút kính viền đứt "Ghi Vitamin D hôm nay"; đã uống → không có nút, dòng phụ thẻ chính có "Vitamin D đã uống HH:mm".
9. **24 giờ qua**: 3 `StatTile` (Giấc ngủ, Cữ bú, Tã ướt) + dòng phụ "Bình X ml · Tã bẩn Y" (`windowTotals`).
10. **Gần đây**: thẻ kính, tối đa 6 bản ghi đã kết thúc trong 24 giờ; mỗi hàng chip màu loại 32 + mô tả 16/500 + "meta · người ghi" 13 + giờ; link "Tất cả" → `/nhat-ky`.

### 7.2 Thẻ chính

`heroState({ logs, feedIntervalMin, now })` trả một trong:

| Trạng thái | Khi                                                                                                                       | Hiển thị                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `running`  | Có timer đang chạy                                                                                                        | `TimerRing` màu loại; trong vòng: nhãn loại chữ hoa 13/600 ("BÚ TRÁI", "NGỦ", "HÚT SỮA", "NẰM SẤP"), đồng hồ, "<người> · từ HH:mm". Nút: bú mẹ có "Đổi bên" (`secondary`, bấm = bấm nút bên còn lại) và "Dừng" (`primary`); loại khác chỉ "Dừng" rộng hết |
| `overdue`  | Không timer chạy; cữ bú gần nhất trong 12 giờ; `now` ≥ giờ dự kiến (cùng điều kiện "Đã đến giờ bú" của `homeStatusLines`) | Viền thẻ và nhãn `--color-warn`; nhãn "TRỄ CỮ BÚ", số phút trễ cỡ 48 ("25 phút"), dòng "Dự kiến lúc HH:mm"; nút "Bú trái", "Bú phải"                                                                                                                      |
| `next`     | Không timer chạy; cữ bú gần nhất trong 12 giờ; chưa đến giờ                                                               | Nhãn "CỮ BÚ TIẾP THEO", giờ dự kiến cỡ 48, dòng "còn N phút"                                                                                                                                                                                              |
| `empty`    | Không timer chạy; không có cữ bú trong 12 giờ                                                                             | "Chưa có cữ bú nào gần đây" + nút "Bú trái", "Bú phải"                                                                                                                                                                                                    |

Dòng phụ dưới nút (mọi trạng thái), nối bằng " · ": `sleepStatusLine(...)` nếu khác null; "Vitamin D đã uống HH:mm" nếu đã uống.

Nhiều timer chạy: thẻ chính lấy timer có `started_at` muộn nhất; các timer còn lại ở mục 7.1 bước 5.

### 7.3 Ô 24 giờ

- Số đếm **luôn hiện** (ví dụ "6" tã ướt), dùng `ratings.wetDiapers`, `ratings.feeds`, `ratings.sleepMinutes` kể cả khi chưa có rating.
- Nhãn "Bình thường" / "Cần chú ý" / "Báo bác sĩ" và màu (`--color-good` / `--color-warn` / `--color-danger`) chỉ hiện khi `rateLast24h` trả rating cho chỉ số đó; chưa có rating thì dòng phụ là "Đánh giá sau 24 giờ đầu" màu `--color-muted`.

### 7.4 Hoàn tác

`Toast` "Đã ghi <mô tả> lúc HH:mm" với nút "Hoàn tác", 5 giây, hiện sau:

- Lưu bản ghi tức thời (Bình, Tã, Thuốc, Nhiệt độ, Vitamin D) → Hoàn tác gọi `useDeleteLog` với id vừa tạo (đi qua outbox, xóa được cả khi chưa gửi).
- Bấm "Dừng" một timer (ở thẻ chính, hàng timer phụ, nút bấm giờ đang chạy, hoặc bảng 9 hành động) → Hoàn tác gọi `useSaveLog` đặt `ended_at = null` cho log vừa dừng.

Không hiện Hoàn tác khi bắt đầu timer, khi "Đổi bên", hoặc khi bấm một nút bấm giờ làm dừng timer khác rồi bắt đầu timer mới. Hoàn tác lỗi: `Toast` "Không hoàn tác được: <toVietnameseError>". Khi luồng hỏi ml của hút sữa đang mở thì Toast đợi sheet đóng mới hiện.

Android có `navigator.vibrate`: rung 10 ms khi bấm nút bấm giờ. iOS bỏ qua.

## 8. Sheet nhập liệu

Mọi sheet dùng `Sheet`. Đầu sheet: chip icon màu loại 36 + tiêu đề 22/700 + nút đóng tròn 36. Đáy: nút "Lưu" `primary` cao 56 rộng hết. Lỗi kiểm tra (`buildDetails` trả `message`) hoặc lỗi lưu hiện ngay trên nút Lưu, `--color-danger`, `role="alert"`, sheet giữ mở.

### 8.1 Chip thời điểm

Nhóm "Lúc nào?" (`ChipGroup`): `Bây giờ` (mặc định) · `5 phút trước` · `15 phút trước` · `Chọn giờ…`. Chọn "Chọn giờ…" thì hiện ô `datetime-local` (giá trị đầu = bây giờ) như hiện nay. `timeChipToDate(chip, now, custom?)` trả `Date`.

### 8.2 Theo loại

Giữ `QUICK_FIELDS`, `buildDetails`, `defaultQuickValues` và thông báo lỗi trong `lib/rules/quickEntry.ts`; chỉ đổi cách nhập:

| Sheet    | Cách nhập                                                                                                                                                                                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thay tã  | `Segmented` Ướt / Bẩn / Cả hai → (`wet`, `dirty`) = (true, false) / (false, true) / (true, true); mặc định Ướt. Khi Bẩn hoặc Cả hai: nhóm "Màu phân" gồm 7 `Swatch` theo thứ tự Không ghi, Vàng, Xanh, Nâu, Đen, Bạc màu/trắng, Có máu/đỏ (giá trị `stoolColor` và màu ở mục 4.2), mặc định Không ghi |
| Bú bình  | Ô số ml cỡ 34/700 `inputMode="decimal"` với nút −10 và +10 (không xuống dưới 0); chip từ `recentBottleAmounts` (bấm điền số); `Segmented` Sữa mẹ / Sữa công thức (`milk`)                                                                                                                             |
| Thuốc    | Ô tên thuốc + chip từ `recentMedicineNames` (bấm điền tên); ô lượng `inputMode="decimal"`; `Segmented` ml / mg / giọt / viên (`unit`); `Switch` "Thuốc hạ sốt" (`antipyretic`); cảnh báo `medicineWarnings` là thẻ nền `--color-warn-soft` chữ `--color-warn-ink`                                     |
| Nhiệt độ | Ô số °C cỡ 34/700 `inputMode="decimal"`, rỗng như hiện nay, placeholder "37,0"; nút −0,1 và +0,1 (khi ô rỗng thì nút đầu tiên được bấm điền 37,0 rồi cộng/trừ); `Segmented` Nách / Trán / Tai / Hậu môn (`method`)                                                                                    |

Vitamin D vẫn mở sheet Thuốc điền sẵn (`VITAMIN_D` trong `HomeScreen`).

### 8.3 Sheet khác

`PumpSheet`, `LogEditSheet`, `GrowthSheet`, `DoseSheet`, `MilestoneSheet` chuyển sang `Sheet` và component ui; trường và logic giữ nguyên; checkbox bật/tắt đổi thành `Switch`; `select` có ≤ 4 lựa chọn đổi thành `Segmented`; `select` nhiều hơn giữ native với `accent-color`.

## 9. Các màn còn lại

Mọi màn dưới đây: `PageHeader` (trang con có nút quay lại về Khám phá hoặc Cài đặt), `Glass`/`ListGroup` thay khung viền, `Icon` thay emoji, `Skeleton` thay "Đang tải…".

| Màn                                          | Thay đổi riêng                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nhật ký `/nhat-ky`                           | Tiêu đề lớn + `IconButton` `calendar` "Thêm bản ghi cũ" (mở `LogEditSheet` trống như nút "+ Thêm" cũ); `ChipGroup` lọc theo `HISTORY_FILTERS`; mỗi ngày một nhóm, tiêu đề 20/700 + tóm tắt bên phải "N cữ · N tã · ngủ Xg Yp" (tính trên log của ngày đó); hàng: chip màu loại 34, mô tả 16/500, meta 13, giờ 15/600 bên phải, người ghi 12 dưới giờ                       |
| Thống kê `/thong-ke`                         | Loại dữ liệu là `ChipGroup`; 7/14 ngày là `Segmented` nhỏ bên phải tiêu đề; cột biểu đồ màu loại; không có dữ liệu thì thay biểu đồ bằng câu "Chưa có <loại> nào trong N ngày"                                                                                                                                                                                             |
| Tăng trưởng, Tiêm chủng, Phát triển          | Thẻ kính; danh sách mũi tiêm/mốc là `ListGroup`; khung cảnh báo nguồn của Tiêm chủng thu thành hàng "Nguồn lịch tiêm" (icon `book`) mở `Sheet` chứa nguyên văn cảnh báo                                                                                                                                                                                                    |
| Triệu chứng, Bệnh thường gặp, Bồng bế        | Câu hỏi và bài đọc trong thẻ kính; nút trả lời là `Button` `lg`                                                                                                                                                                                                                                                                                                            |
| Khẩn cấp `/khan-cap`                         | Nút "Gọi 115" nền `--color-danger-solid` chữ `--color-on-danger` cao 64; danh bạ là `ListGroup`; hồ sơ bé là thẻ kính                                                                                                                                                                                                                                                      |
| Nhạc, Ồn trắng, Ảnh                          | Thẻ kính; nút phát/dừng `IconButton` 64 (`play`/`stop` `filled`)                                                                                                                                                                                                                                                                                                           |
| Báo cáo `/bao-cao`                           | Màn hình dùng thẻ kính; bản in theo mục 2.2                                                                                                                                                                                                                                                                                                                                |
| Đăng nhập `/dang-nhap`                       | Trên `Backdrop`: logo 96 + wordmark 34 + "Nhật ký chăm bé của cả nhà"; nút "Đăng nhập bằng Google" theo mẫu nút của Google: Sáng nền `#FFFFFF`, viền `#747775`, chữ `#1F1F1F`, logo G 4 màu; Tối nền `#131314`, viền `#8E918F`, chữ `#E3E3E3`, logo G 4 màu; Ban đêm nền `.glass`, chữ và logo G một màu `--color-ink`. Màu nằm trong `lib/ui/tokens.ts` (`GOOGLE_BUTTON`) |
| Khai báo bé, Chưa được mời, Cài app, Offline | Thẻ kính trên `Backdrop`; form dùng component ui                                                                                                                                                                                                                                                                                                                           |

## 10. Trạng thái và lỗi

- Đang tải: `Skeleton` đúng hình khối (thẻ chính 300 cao, 3 ô số, 4 hàng list).
- Trống: icon 40 `--color-muted` + một câu + nút hành động (Nhật ký trống → "Ghi bản đầu tiên" mở bảng 9 hành động).
- Lỗi tải: thẻ kính viền `--color-danger`, lời lỗi `toVietnameseError`, nút "Thử lại".
- Lỗi lưu trong sheet: mục 8.
- Offline: giữ hành vi outbox hiện tại; dòng đồng bộ ở mục 7.1 bước 3.

## 11. Kiểm thử

### 11.1 Tự động (Vitest)

| File                           | Kiểm                                                                                                                                                                                                                                                                                                                                                                 | Đợt |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `lib/rules/theme.test.ts`      | Lịch 21:00–06:00 giờ VN: 20:59 ngày, 21:00 đêm, 05:59 đêm, 06:00 ngày; lịch 22:30–05:30; override còn hạn / hết hạn / bật / tắt; lịch tắt; `pref` cũ `"night"`; `nextNightBoundary` lúc 03:00, 12:00, 23:00                                                                                                                                                          | 1   |
| `lib/rules/contrast.test.ts`   | Đọc `THEMES` trong `lib/ui/tokens.ts`; với từng theme: `ink`, `muted`, `accent-text`, `good`, `warn`, `danger`, mọi `cat-*` trên `bg` và trên `glass` đã trộn với `bg` ≥ 4.5; `on-accent` trên `accent`, `on-danger` trên `danger-solid`, các cặp `*-ink` trên `*-soft` ≥ 4.5; `switch-on` trên `bg` ≥ 3; Ban đêm: không giá trị nào là `#FFFFFF`, không hue 180–260 | 1   |
| `lib/ui/tokens.test.ts`        | Mọi token trong `THEMES` có trong `app/globals.css` với cùng giá trị ở đúng khối theme                                                                                                                                                                                                                                                                               | 1   |
| `lib/themeGuard.test.ts`       | Giữ nguyên, phải xanh                                                                                                                                                                                                                                                                                                                                                | 1–5 |
| `scripts/sw.test.ts`           | `FALLBACK_TITLE` mới; precache có `/icons/icon.svg`, `/icons/maskable-512.png`                                                                                                                                                                                                                                                                                       | 1   |
| `lib/rules/status.test.ts`     | `sleepStatusLine` đúng như dòng ngủ của `homeStatusLines`                                                                                                                                                                                                                                                                                                            | 3   |
| `lib/rules/hero.test.ts`       | Đủ 4 trạng thái; nhiều timer chạy; biên 12 giờ                                                                                                                                                                                                                                                                                                                       | 3   |
| `lib/rules/timeChips.test.ts`  | 3 chip và "Chọn giờ…"                                                                                                                                                                                                                                                                                                                                                | 4   |
| `lib/rules/quickEntry.test.ts` | `recentBottleAmounts` (trùng, ít hơn 3, rỗng), `recentMedicineNames` (trùng khác hoa thường)                                                                                                                                                                                                                                                                         | 4   |

Mỗi đợt kết thúc với `bun run typecheck` và `bun run test` xanh.

### 11.2 Thủ công (`docs/device-checklist.md`, thêm bước mới)

Trên iPhone 11, 16, 17 Pro, mỗi theme Sáng / Tối / Ban đêm:

1. Xóa app cũ, cài lại: tên "Kim Bun", icon bánh bao trên màn hình chính; favicon đúng trong Safari; thông báo đẩy có icon mới.
2. Bật "Giảm độ trong suốt" trong Trợ năng iOS: kính thành nền đặc, chữ vẫn đọc được.
3. Ban đêm: nút trăng; lịch tự bật lúc 21:00 khi app đang mở; không còn trắng/xanh ở tab bar và icon.
4. Nút "+" từ cả 3 tab; 9 hành động đúng; `/cam-nang`, `/tien-ich` chuyển về Khám phá; các route con mở đúng; Cài đặt và 3 trang con.
5. Trang chủ đủ 4 trạng thái thẻ chính; bấm giờ, dừng, Hoàn tác.
6. 4 sheet nhập nhanh: cuộn được khi bật bàn phím trên iPhone 11; kéo xuống đóng; hỏi lại khi đang nhập dở.
7. Các màn ở mục 9 không còn viền đen/trắng, không emoji.
8. In `/bao-cao`: đen trắng A4, không có nền vệt màu.

## 12. Các đợt triển khai

Mỗi đợt là một plan riêng; test của đợt xanh mới sang đợt sau.

| Đợt                      | Nội dung                                                                                                                                                                                                                                                                                                                                     | Test (mục 11.1)                         | Checklist (mục 11.2)                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------ |
| 1. Nền móng và nhận diện | Đổi tên (3.1); logo, icon, manifest, service worker (3.2–3.4); token mới và token cũ (4.1–4.3), `lib/ui/tokens.ts`, `lib/ui/categories.ts`; chữ (4.4); `lib/ui/icons.ts`; component ui có cột "Đợt" = 1; Ban đêm (6.6) gồm thêm "Ban đêm theo lịch" và "Giờ ban đêm" vào phần Giao diện của màn Cài đặt hiện có; theme-color (6.7); in (2.2) | theme, contrast, tokens, themeGuard, sw | 1; 3 (chỉ lịch tự bật)               |
| 2. Khung điều hướng      | `TabBar`, nút "+" và `ActionSheet`, `PageHeader`; `/kham-pha`; chuyển hướng route; header Trang chủ (6.5, gồm nút trăng); Cài đặt và 3 trang con (6.8)                                                                                                                                                                                       | themeGuard                              | 2; 3 (nút trăng, tab bar và icon); 4 |
| 3. Trang chủ             | Mục 7, `TimerRing`, `heroState`, `sleepStatusLine`, Hoàn tác                                                                                                                                                                                                                                                                                 | status, hero, themeGuard                | 5                                    |
| 4. Nhập liệu             | Mục 8                                                                                                                                                                                                                                                                                                                                        | timeChips, quickEntry, themeGuard       | 6                                    |
| 5. Các màn còn lại       | Mục 9, 10; xóa token cũ không còn dùng                                                                                                                                                                                                                                                                                                       | themeGuard                              | 7, 8                                 |

Bước checklist cần iPhone thật ghi "Chờ người dùng" trong `docs/device-checklist.md`, không tự đánh "Đạt".
