# Baby Tracker Web — M7 (Thanh tab, giao diện Sáng/Tối/Ban đêm, Cài đặt, Cài app) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** App có thanh tab dưới 5 mục (spec §6.18), hai trang mục lục Cẩm nang và Tiện ích, ba giao diện Sáng / Tối / Ban đêm cùng lựa chọn "Theo hệ thống" (§6.16, §6.18), trang `/cai-dat` với Giao diện, link cài app, tài khoản và Đăng xuất, và trang `/cai-app` hướng dẫn cài PWA (§6.17).

**Architecture:**
- **Màu:** mọi màu trong giao diện đổi sang màu theo vai trò (`bg-surface`, `text-ink`, `bg-accent`…), khai báo trong `@theme` của Tailwind 4 ở `app/globals.css`. Mỗi theme chỉ khai báo lại các biến `--color-*` dưới `:root[data-theme="dark"]` hoặc `:root[data-theme="night"]`.
- **Chọn theme:** lựa chọn lưu trong `localStorage`. Một script nhỏ trong `<head>` gắn `data-theme` trước khi trang hiện, nên không chớp màu.
- **Thanh tab:** `AuthGate` tự gắn thanh tab cho mọi trang cần bé (`need="baby"`).
- **Logic:** quy tắc chọn theme và chọn tab là hàm thuần có Vitest. Một test quét mã nguồn chặn màu cứng quay lại.

**Tech Stack:** như M1–M6 (Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, supabase-js 2.118.0, React Query 5.105.0, zod 4.6.7, recharts 3.10.1, Vitest 5.0.5). Không thêm thư viện. Chạy `prettier` 3.9.10 một lần qua `npx` (không thêm vào `package.json`).

**Milestones của đợt phát hành 1** (phần Cài đặt và thông báo được tách cho vừa cỡ plan):
- M1–M6 xong: nền tảng + đăng nhập · quy tắc thuần + khai báo bé · trang chủ ghi chép · đánh giá, cảnh báo, Realtime · `/nhat-ky` · `/thong-ke`.
- **M7:** thanh tab, Cẩm nang/Tiện ích, theme, `/cai-dat` (giao diện, tài khoản), `/cai-app`.
- **M8:** `/cai-dat` phần hồ sơ bé, `feed_interval_min`, thành viên.
- **M9:** service worker, offline outbox, Web Push, pg_cron, tạm tắt, phần Thông báo của `/cai-dat` và nút "Bật thông báo" của `/cai-app`.
- M8–M9 lập plan sau khi M7 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- §6.16 chỉ ghi "lưu `localStorage`", nên plan tự đặt khóa `be-yeu-theme` với giá trị `light` / `dark` / `night` / `system`. Mặc định là `system`: theo chế độ sáng/tối của máy, và tự đổi khi máy đổi.
- §6.18 theme Ban đêm: nền `#0b0b0b`; chữ, nút nhấn và màu cảnh báo đều là đỏ cam độ sáng thấp; không có màu trắng thuần ở đâu, kể cả hộp chú thích của biểu đồ.
- Màu theo vai trò (17 màu), mỗi màu thay cho một nhóm lớp Tailwind cũ:
  - Nền và chữ:
    - `surface` (nền trang, sheet) ← `bg-white`
    - `ink` (chữ chính) ← `text-neutral-900`, `text-neutral-700`
    - `muted` (chữ phụ) ← `text-neutral-600`, `text-neutral-500`
    - `soft` (nền nhạt) ← `bg-neutral-100`
  - Màu nhấn:
    - `accent` ← `bg-pink-500`
    - `on-accent` (chữ trên nền `accent` hoặc `alarm`) ← `text-white`
    - `accent-soft` ← `bg-pink-50`
    - `accent-ink` ← `text-pink-900/700/600`
    - `accent-line` ← `border-pink-200`
  - Cảnh báo đỏ:
    - `alarm` (nền banner đỏ) ← `bg-red-600`
    - `danger` (chữ lỗi, chữ nút gọi 115) ← `text-red-700/600`
    - `danger-soft` ← `bg-red-100`
    - `danger-ink` ← `text-red-900`
  - Lưu ý và tốt:
    - `warn-soft` ← `bg-amber-100/50`
    - `warn-ink` ← `text-amber-950/900`
    - `good-soft` ← `bg-emerald-100/50`
    - `good-ink` ← `text-emerald-900`
  - Ở theme Sáng, các màu lấy đúng giá trị Tailwind cũ. Vài cặp gần nhau được gộp (ví dụ `neutral-600` vào `neutral-500`), nên chữ phụ và nền vàng/xanh nhạt có thể lệch rất nhẹ so với trước.
  - `bg-black/40` (lớp phủ sau sheet) giữ nguyên vì hợp với mọi theme.
- Thanh tab hiện ở mọi trang dùng `AuthGate need="baby"`: `/`, `/nhat-ky`, `/thong-ke`, `/cam-nang`, `/tien-ich`, `/cai-dat`. Trang đăng nhập, khai báo bé và `/cai-app` không có thanh tab. Biểu tượng tab dùng emoji, có `aria-hidden`.
- Cẩm nang và Tiện ích (§6.18) là hai trang mục lục mới, `/cam-nang` và `/tien-ich`. Mục chưa xây (đợt 2–3) hiện chữ "Sắp có" và không bấm được. Ở M7 chỉ "Thống kê" bấm được.
- `<nav>` tạm ở trang chủ (M5–M6) được bỏ, vì thanh tab thay thế nó. Trang Nhật ký bỏ link "← Trang chủ". Trang Thống kê đổi link về thành "← Tiện ích".
- Sheet nhập nhanh và sheet bản ghi nâng lên `z-20` để phủ lên thanh tab (`z-10`).
- `/cai-app` (§6.17) không cần đăng nhập: người dùng cần đọc nó trước khi cài. Trang đăng nhập và `/cai-dat` có link tới nó.
  - Nếu không chạy ở chế độ `standalone`, trang hiện 3 bước cài và câu "phải cài mới nhận được thông báo".
  - Nếu đang chạy `standalone`, trang báo đã cài.
  - Nút "Bật thông báo" thuộc M9, cùng luồng đăng ký push.
- `/cai-dat` ở M7 có các phần Giao diện, Ứng dụng (link `/cai-app`), Tài khoản (tên hiển thị, vai trò, email, nút Đăng xuất). Hồ sơ bé, khoảng cách cữ bú và Thành viên thuộc M8; phần Thông báo thuộc M9.
- Khi chạy `bun run dev`, React Strict Mode vẽ lại `<html>` và xóa `data-theme` mà script đã gắn. Vì vậy `useSystemThemeSync` gắn lại theme trong `useLayoutEffect` lúc mount (theo hướng dẫn của Next.js). Bản production không cần nhưng chạy cũng không sao.
- Màu thanh trạng thái (`viewport.themeColor` `#f28ca0`) giữ nguyên ở mọi theme; đổi theo theme là việc sau, không thuộc M7.
- Đăng xuất gọi `supabase.auth.signOut()` rồi xóa cache React Query. `AuthGate` thấy mất phiên thì tự chuyển `/dang-nhap`.

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

Từ spec §2.2 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component (`'use client'`), tự kiểm tra phiên ở client.
- `supabase-js` khởi tạo với `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.
- Toàn bộ logic nghiệp vụ là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test. (Quy tắc giao diện và điều hướng của M7 không phải nghiệp vụ nên nằm ở `lib/theme.ts` và `lib/nav.ts`, vẫn là hàm thuần có test.)
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Tên route: `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`, `/`, `/nhat-ky`, `/thong-ke`, `/cam-nang`, `/tien-ich`, `/cai-dat`, `/cai-app`.
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`).
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x. Thêm thư viện khác phải ghi lý do trong plan.
- Không dùng Workbox, Serwist, `next-pwa`: service worker viết tay ở `public/sw.js` (M9).
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.

Riêng M7:

- Trước khi viết code Next.js, đọc trong `node_modules/next/dist/docs/01-app/`:
  - `01-getting-started/03-layouts-and-pages.md` (root layout)
  - `01-getting-started/04-linking-and-navigating.md` (`<Link>`)
  - `03-api-reference/04-functions/use-pathname.md` (`usePathname`)
  - `02-guides/preventing-flash-before-hydration.md` (script gắn theme trong `<head>`, mục "Re-applying attributes in development")

  Đây là yêu cầu của `AGENTS.md`.
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Từ M7, file `.tsx` trong `app/` và `components/` chỉ dùng màu theo vai trò. Không dùng lớp màu bảng Tailwind (`bg-pink-500`, `text-neutral-500`…) trừ `bg-black/40`, và không viết mã hex trong `components/`. Test `lib/themeGuard.test.ts` khóa quy tắc này.
- Câu chữ tiếng Việt trong `lib/theme.ts`, `lib/nav.ts` và các component mới phải đúng từng ký tự như plan này.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`3cd5862`):

- `AuthGate({ need, children })` với `GateState = { session: Session | null; ctx: FamilyContext }` (`components/AuthGate.tsx`)
- `FamilyMember` (`lib/supabase/rows.ts`, có `display_name`, `role`); `supabase()` (`lib/supabase/client.ts`)
- `Providers` (`components/Providers.tsx`); `app/layout.tsx` với `Providers` và `viewport`
- Các component có lớp màu cần đổi: toàn bộ `app/*.tsx`, `components/**/*.tsx` ở commit `3cd5862`
- `StatsChart` (`components/stats/StatsChart.tsx`, M6) với màu `#ec4899`, `#a16207`
- `<nav>` tạm ở `HomeScreen`, link "← Trang chủ" ở `HistoryScreen` và `StatsScreen` (M5–M6)

**Produces** (M8–M9 dùng):

- Màu theo vai trò trong `app/globals.css`: `surface`, `ink`, `muted`, `soft`, `accent`, `on-accent`, `accent-soft`, `accent-ink`, `accent-line`, `danger`, `alarm`, `danger-soft`, `danger-ink`, `warn-soft`, `warn-ink`, `good-soft`, `good-ink`. Dùng qua lớp Tailwind (`bg-surface`, `text-ink`…) hoặc `var(--color-…)`.
- `lib/theme.ts`: `ThemePref`, `Theme`, `THEME_STORAGE_KEY = "be-yeu-theme"`, `THEME_OPTIONS`, `parseThemePref`, `resolveTheme`, `THEME_INIT_SCRIPT`
- `lib/hooks/useTheme.ts`: `useSystemThemeSync()`, `useThemePref(): [ThemePref, (next: ThemePref) => void]`
- `lib/nav.ts`: `TabKey`, `TABS`, `MenuItem`, `GUIDE_ITEMS`, `TOOL_ITEMS`, `activeTab(pathname)`. Đợt 2–3 điền `href` cho mục "Sắp có" và thêm đường dẫn vào `activeTab` nếu cần.
- `components/nav/TabBar.tsx`, `components/nav/MenuScreen.tsx`; `AuthGate need="baby"` tự gắn thanh tab và chừa `pb-16`
- `components/settings/SettingsScreen.tsx` (`{ member, email }`). M8 thêm phần Hồ sơ bé, Khoảng cách cữ bú, Thành viên; M9 thêm phần Thông báo.
- `components/install/InstallGuide.tsx`. M9 thêm nút "Bật thông báo" khi `standalone`.
- Route `/cam-nang`, `/tien-ich`, `/cai-dat`, `/cai-app`

## File Structure

```
app/globals.css                       # màu theo vai trò + giá trị cho Tối, Ban đêm
lib/themeGuard.test.ts                # chặn lớp màu bảng Tailwind và mã hex trong UI
app/*.tsx, components/**/*.tsx        # sửa hàng loạt: lớp màu cũ → màu theo vai trò
components/stats/StatsChart.tsx       # sửa: màu biểu đồ theo theme
lib/theme.ts (+ test)                 # lựa chọn theme, script gắn theme trước khi vẽ
lib/hooks/useTheme.ts                 # đọc/lưu lựa chọn, theo chế độ của máy
app/layout.tsx, components/Providers.tsx  # sửa: script trong <head>, đồng bộ theme hệ thống
lib/nav.ts (+ test)                   # tab, mục lục Cẩm nang / Tiện ích, tab đang chọn
components/nav/TabBar.tsx, components/nav/MenuScreen.tsx
app/cam-nang/page.tsx, app/tien-ich/page.tsx
components/AuthGate.tsx               # sửa: gắn thanh tab
components/home/HomeScreen.tsx, components/history/HistoryScreen.tsx, components/stats/StatsScreen.tsx  # sửa: bỏ nav tạm
components/home/QuickEntrySheet.tsx, components/history/LogEditSheet.tsx  # sửa: z-20
components/settings/SettingsScreen.tsx, app/cai-dat/page.tsx
components/install/InstallGuide.tsx, app/cai-app/page.tsx
components/auth/LoginScreen.tsx       # sửa: link tới /cai-app
```

## Tasks

1. Màu theo vai trò và theme Tối, Ban đêm trong CSS
2. Chọn giao diện: lưu lựa chọn, gắn theme trước khi vẽ
3. Thanh tab và trang Cẩm nang, Tiện ích
4. Trang Cài đặt và trang Cài app

---

### Task 1: Màu theo vai trò và theme Tối, Ban đêm trong CSS

**Files:**

- Create: `lib/themeGuard.test.ts`
- Modify: `app/globals.css` (toàn bộ), mọi `app/*.tsx` và `components/**/*.tsx` có lớp màu (bằng lệnh đổi hàng loạt), `components/stats/StatsChart.tsx` (toàn bộ)

**Interfaces:**

- Consumes: các component hiện có (commit `3cd5862`)
- Produces: 17 màu theo vai trò (danh sách ở Contracts); `:root[data-theme="dark"]` và `:root[data-theme="night"]` khai báo lại chúng; test chặn màu cứng

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m7.md` (file plan này, đi chung commit của Task 1); commit mới nhất là `3cd5862 feat(stats): /thong-ke daily charts for sleep, feeds and diapers`.

- [ ] **Step 2: Viết test chặn màu cứng**

Tạo `lib/themeGuard.test.ts` (đọc file từ thư mục gốc repo, nơi `bun run test` chạy):

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PALETTE =
  /\b(?:bg|text|border|divide|ring|fill|stroke|outline|from|to|via|placeholder|caret|decoration|shadow)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?(?:\/\d+)?/g;
const ALLOWED = new Set(["bg-black/40"]);

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("theme guard", () => {
  it("UI code uses theme colors, not fixed palette classes or hex colors", () => {
    const problems: string[] = [];
    for (const file of [...tsxFiles("app"), ...tsxFiles("components")]) {
      const source = readFileSync(file, "utf8");
      for (const match of source.match(PALETTE) ?? [])
        if (!ALLOWED.has(match)) problems.push(`${file}: ${match}`);
      if (file.startsWith("components") && /#[0-9a-fA-F]{6}\b/.test(source))
        problems.push(`${file}: hex color`);
    }
    expect(problems).toEqual([]);
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bun run test lib/themeGuard.test.ts`
Expected: FAIL — `expected [ …(N) ] to deeply equal []`, danh sách có các dòng như `components/AuthGate.tsx: bg-pink-500` và `components/stats/StatsChart.tsx: hex color`.

- [ ] **Step 4: Thay `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-surface: #ffffff;
  --color-ink: oklch(20.5% 0 0);
  --color-muted: oklch(55.6% 0 0);
  --color-soft: oklch(97% 0 0);
  --color-accent: oklch(65.6% 0.241 354.308);
  --color-on-accent: #ffffff;
  --color-accent-soft: oklch(97.1% 0.014 343.198);
  --color-accent-ink: oklch(52.5% 0.223 3.958);
  --color-accent-line: oklch(89.9% 0.061 343.231);
  --color-danger: oklch(57.7% 0.245 27.325);
  --color-alarm: oklch(57.7% 0.245 27.325);
  --color-danger-soft: oklch(93.6% 0.032 17.717);
  --color-danger-ink: oklch(39.6% 0.141 25.723);
  --color-warn-soft: oklch(96.2% 0.059 95.617);
  --color-warn-ink: oklch(41.4% 0.112 45.904);
  --color-good-soft: oklch(95% 0.052 163.051);
  --color-good-ink: oklch(37.8% 0.077 168.94);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --color-surface: #121212;
  --color-ink: #f5f5f5;
  --color-muted: #a3a3a3;
  --color-soft: #262626;
  --color-accent: #ec4899;
  --color-on-accent: #ffffff;
  --color-accent-soft: #3b0d24;
  --color-accent-ink: #f9a8d4;
  --color-accent-line: #831843;
  --color-danger: #f87171;
  --color-alarm: #b91c1c;
  --color-danger-soft: #450a0a;
  --color-danger-ink: #fecaca;
  --color-warn-soft: #422006;
  --color-warn-ink: #fde68a;
  --color-good-soft: #022c22;
  --color-good-ink: #a7f3d0;
}

:root[data-theme="night"] {
  color-scheme: dark;
  --color-surface: #0b0b0b;
  --color-ink: #c2603a;
  --color-muted: #a5512f;
  --color-soft: #1a0f0a;
  --color-accent: #5a200e;
  --color-on-accent: #e07a4f;
  --color-accent-soft: #24110a;
  --color-accent-ink: #d0693f;
  --color-accent-line: #4a1d0e;
  --color-danger: #e0583a;
  --color-alarm: #4a140a;
  --color-danger-soft: #2a0d07;
  --color-danger-ink: #e0704a;
  --color-warn-soft: #23140a;
  --color-warn-ink: #cf7a3f;
  --color-good-soft: #17140a;
  --color-good-ink: #b98a45;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

`:root[data-theme=…]` nằm ngoài `@layer` nên thắng biến mặc định mà Tailwind sinh trong `@layer theme`.

- [ ] **Step 5: Đổi lớp màu hàng loạt rồi định dạng lại**

Run:

```bash
perl -pi -e 's/\bbg-white\b/bg-surface/g; s/\btext-neutral-(900|700)\b/text-ink/g; s/\btext-neutral-(600|500)\b/text-muted/g; s/\bbg-neutral-100\b/bg-soft/g; s/\bbg-pink-500\b/bg-accent/g; s/\btext-white\b/text-on-accent/g; s/\bbg-pink-50\b/bg-accent-soft/g; s/\btext-pink-(900|700|600)\b/text-accent-ink/g; s/\bborder-pink-200\b/border-accent-line/g; s/\bbg-red-600\b/bg-alarm/g; s/\btext-red-(700|600)\b/text-danger/g; s/\bbg-red-100\b/bg-danger-soft/g; s/\btext-red-900\b/text-danger-ink/g; s/\bbg-amber-(100|50)\b/bg-warn-soft/g; s/\btext-amber-(950|900)\b/text-warn-ink/g; s/\bbg-emerald-(100|50)\b/bg-good-soft/g; s/\btext-emerald-900\b/text-good-ink/g' $(git ls-files 'app/*.tsx' 'components/*.tsx')
```

Run: `npx --yes prettier@3.9.10 --write $(git ls-files 'app/*.tsx' 'components/*.tsx')`
Expected: lệnh đầu không in gì. `git diff --stat` báo 20 file đổi (19 file `.tsx` và `app/globals.css`). Prettier chỉ gói lại dòng ở `components/auth/LoginScreen.tsx` và `components/home/RecentList.tsx`, vì lớp mới ngắn hơn.

`\b` giữ cho `bg-pink-50` không khớp nhầm `bg-pink-500`. Lệnh đầu đổi cả `text-white` thành `text-on-accent`: mọi chỗ dùng `text-white` hiện nay đều nằm trên nền `bg-pink-500` hoặc `bg-red-600`.

- [ ] **Step 6: Cho biểu đồ dùng màu theo theme**

Thay toàn bộ `components/stats/StatsChart.tsx`:

```tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function StatsChart({
  rows,
  primaryName,
  secondaryName,
  decimals,
}: {
  rows: { label: string; primary: number; secondary: number | null }[];
  primaryName: string;
  secondaryName: string | null;
  decimals: boolean;
}) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--color-muted)"
            strokeOpacity={0.4}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
            interval={0}
          />
          <YAxis
            allowDecimals={decimals}
            width={32}
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
          />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString("vi-VN")}
            contentStyle={{
              background: "var(--color-surface)",
              borderColor: "var(--color-accent-line)",
              color: "var(--color-ink)",
            }}
            itemStyle={{ color: "var(--color-ink)" }}
            cursor={{ fill: "var(--color-soft)" }}
          />
          {secondaryName && (
            <Legend
              formatter={(value) => (
                <span style={{ color: "var(--color-ink)" }}>{value}</span>
              )}
            />
          )}
          <Bar
            dataKey="primary"
            name={primaryName}
            fill="var(--color-accent)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          {secondaryName && (
            <Bar
              dataKey="secondary"
              name={secondaryName}
              fill="var(--color-warn-ink)"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 7: Chạy test, type, build**

Run: `bun run test lib/themeGuard.test.ts && bun run typecheck && bun run test && bun run build`
Expected: guard 1 test đạt; không lỗi type; `Tests  104 passed (104)` (103 của M1–M6 + 1); `next build` thành công với 8 route như M6.

Run: `grep -rnE 'bg-white|text-white|pink-|neutral-|amber-|emerald-|red-[0-9]' app components`
Expected: không in dòng nào.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(theme): role-based color tokens with dark and night palettes"
```

`git add -A` lần này đưa cả file plan M7 vào commit.

---

### Task 2: Chọn giao diện: lưu lựa chọn, gắn theme trước khi vẽ

**Files:**

- Create: `lib/theme.ts`, `lib/hooks/useTheme.ts`
- Modify: `app/layout.tsx` (import, thẻ `<html>`, thêm `<head>`), `components/Providers.tsx` (import, gọi hook)
- Test: `lib/theme.test.ts`

**Interfaces:**

- Consumes: các biến `data-theme` của Task 1
- Produces:
  - `type ThemePref = "light" | "dark" | "night" | "system"`, `type Theme = "light" | "dark" | "night"`
  - `THEME_STORAGE_KEY = "be-yeu-theme"`
  - `THEME_OPTIONS: { value: ThemePref; label: string }[]` — Sáng, Tối, Ban đêm, Theo hệ thống
  - `parseThemePref(raw: string | null): ThemePref` — giá trị lạ hoặc `null` thành `"system"`
  - `resolveTheme(pref: ThemePref, prefersDark: boolean): Theme`
  - `THEME_INIT_SCRIPT: string` — JavaScript tự chứa, cùng quy tắc với hai hàm trên, lỗi `localStorage` thì dùng `light`
  - `useSystemThemeSync(): void` — khi máy đổi sáng/tối, áp lại theme theo lựa chọn đang lưu
  - `useThemePref(): [ThemePref, (next: ThemePref) => void]` — đổi lựa chọn thì lưu, áp ngay lên `<html data-theme>`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/theme.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  parseThemePref,
  resolveTheme,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
} from "./theme";

function runInitScript(stored: string | null, prefersDark: boolean): string {
  const root = { dataset: {} as Record<string, string> };
  const window = {
    matchMedia: () => ({ matches: prefersDark }),
  };
  const localStorage = {
    getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null),
  };
  new Function("window", "document", "localStorage", THEME_INIT_SCRIPT)(
    window,
    { documentElement: root },
    localStorage,
  );
  return root.dataset.theme;
}

describe("theme", () => {
  it("parseThemePref falls back to system for unknown values", () => {
    expect(parseThemePref("night")).toBe("night");
    expect(parseThemePref(null)).toBe("system");
    expect(parseThemePref("blue")).toBe("system");
  });

  it("resolveTheme follows the device only for system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("night", false)).toBe("night");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("THEME_INIT_SCRIPT applies the same rules before React loads", () => {
    expect(runInitScript("night", false)).toBe("night");
    expect(runInitScript(null, true)).toBe("dark");
    expect(runInitScript("system", false)).toBe("light");
    expect(runInitScript("blue", true)).toBe("dark");
  });

  it("THEME_INIT_SCRIPT falls back to light when storage throws", () => {
    const root = { dataset: {} as Record<string, string> };
    const localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    new Function("window", "document", "localStorage", THEME_INIT_SCRIPT)(
      {},
      { documentElement: root },
      localStorage,
    );
    expect(root.dataset.theme).toBe("light");
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bun run test lib/theme.test.ts`
Expected: FAIL — `Cannot find module './theme'`.

- [ ] **Step 3: Viết `lib/theme.ts`**

```ts
export type ThemePref = "light" | "dark" | "night" | "system";
export type Theme = "light" | "dark" | "night";

export const THEME_STORAGE_KEY = "be-yeu-theme";

export const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
  { value: "night", label: "Ban đêm" },
  { value: "system", label: "Theo hệ thống" },
];

export function parseThemePref(raw: string | null): ThemePref {
  return raw === "light" || raw === "dark" || raw === "night" ? raw : "system";
}

export function resolveTheme(pref: ThemePref, prefersDark: boolean): Theme {
  if (pref !== "system") return pref;
  return prefersDark ? "dark" : "light";
}

// Runs inline in <head> before the first paint, so it cannot import anything.
export const THEME_INIT_SCRIPT = `(function(){var t="light";try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");if(p==="light"||p==="dark"||p==="night")t=p;else if(window.matchMedia("(prefers-color-scheme: dark)").matches)t="dark";}catch(e){}document.documentElement.dataset.theme=t;})();`;
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run test lib/theme.test.ts`
Expected: PASS — 4 test.

- [ ] **Step 5: Viết `lib/hooks/useTheme.ts`**

```ts
"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  parseThemePref,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePref,
} from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function readPref(): ThemePref {
  if (typeof window === "undefined") return "system";
  try {
    return parseThemePref(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function applyTheme(pref: ThemePref): void {
  document.documentElement.dataset.theme = resolveTheme(
    pref,
    window.matchMedia(DARK_QUERY).matches,
  );
}

export function useSystemThemeSync(): void {
  // Dev Strict Mode remounts <html> and clears the attribute the inline script set.
  useLayoutEffect(() => applyTheme(readPref()), []);
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme(readPref());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
}

export function useThemePref(): [ThemePref, (next: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(readPref);
  function choose(next: ThemePref) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode: the choice still applies until the app is closed.
    }
    applyTheme(next);
    setPref(next);
  }
  return [pref, choose];
}
```

Đọc `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`, mục "Re-applying attributes in development": `useLayoutEffect` trong `useSystemThemeSync` là cách sửa mà tài liệu đó đưa ra.

- [ ] **Step 6: Gắn script vào `app/layout.tsx`**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` (root layout). Layout là server component nên thẻ `<script>` được in thẳng vào HTML và chạy trước khi trang hiện.

Thêm import ngay sau dòng `import { Providers } from "@/components/Providers";`:

```tsx
import { THEME_INIT_SCRIPT } from "@/lib/theme";
```

Thay:

```tsx
    <html lang="vi">
      <body className="min-h-dvh bg-surface text-ink antialiased">
```

bằng:

```tsx
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-surface text-ink antialiased">
```

`suppressHydrationWarning` cần vì script đã gắn `data-theme` lên `<html>` trước khi React hydrate.

- [ ] **Step 7: Đồng bộ theo máy trong `components/Providers.tsx`**

Thêm import ngay sau dòng `import { useState, type ReactNode } from "react";`:

```tsx
import { useSystemThemeSync } from "@/lib/hooks/useTheme";
```

Rồi thêm dòng đầu tiên trong thân `Providers`:

```tsx
export function Providers({ children }: { children: ReactNode }) {
  useSystemThemeSync();
```

- [ ] **Step 8: Kiểm tra type, test, build và HTML**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  108 passed (108)`; build thành công.

Run: `grep -c 'be-yeu-theme' .next/server/app/dang-nhap.html`
Expected: `1` (script nằm trong HTML tĩnh).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(theme): saved theme choice applied before first paint"
```

---

### Task 3: Thanh tab và trang Cẩm nang, Tiện ích

**Files:**

- Create: `lib/nav.ts`, `components/nav/TabBar.tsx`, `components/nav/MenuScreen.tsx`, `app/cam-nang/page.tsx`, `app/tien-ich/page.tsx`
- Modify:
  - `components/AuthGate.tsx`: import, dòng `return` cuối
  - `components/home/QuickEntrySheet.tsx`, `components/history/LogEditSheet.tsx`: `z-10` → `z-20`
  - `components/home/HomeScreen.tsx`: bỏ `<nav>` và import `Link`
  - `components/history/HistoryScreen.tsx`: bỏ link và import `Link`
  - `components/stats/StatsScreen.tsx`: link về Tiện ích
- Test: `lib/nav.test.ts`

**Interfaces:**

- Consumes: `AuthGate` (đã đổi màu ở Task 1); màu `surface`, `accent-ink`, `muted`
- Produces:
  - `type TabKey = "home" | "history" | "guide" | "tools" | "settings"`
  - `TABS: { key: TabKey; href: string; label: string; icon: string }[]`
  - `type MenuItem = { label: string; href: string | null }` (`href = null` là "Sắp có")
  - `GUIDE_ITEMS`, `TOOL_ITEMS: MenuItem[]`
  - `activeTab(pathname: string): TabKey | null`
  - `TabBar()`, `MenuScreen({ title: string; items: MenuItem[] })`
  - `AuthGate need="baby"` bọc nội dung trong `<div className="pb-16">` và vẽ `TabBar`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/nav.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { activeTab, GUIDE_ITEMS, TABS, TOOL_ITEMS } from "./nav";

describe("nav", () => {
  it("has the five tabs of spec §6.18 in order", () => {
    expect(TABS.map((t) => t.label)).toEqual([
      "Trang chủ",
      "Nhật ký",
      "Cẩm nang",
      "Tiện ích",
      "Cài đặt",
    ]);
  });

  it("activeTab maps each page to its tab", () => {
    expect(activeTab("/")).toBe("home");
    expect(activeTab("/nhat-ky")).toBe("history");
    expect(activeTab("/thong-ke")).toBe("tools");
    expect(activeTab("/tien-ich")).toBe("tools");
    expect(activeTab("/tiem-chung")).toBe("guide");
    expect(activeTab("/cai-dat")).toBe("settings");
    expect(activeTab("/nhat-ky-cu")).toBeNull();
    expect(activeTab("/dang-nhap")).toBeNull();
  });

  it("every menu link opens under its own tab", () => {
    for (const item of GUIDE_ITEMS)
      if (item.href) expect(activeTab(item.href)).toBe("guide");
    for (const item of TOOL_ITEMS)
      if (item.href) expect(activeTab(item.href)).toBe("tools");
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bun run test lib/nav.test.ts`
Expected: FAIL — `Cannot find module './nav'`.

- [ ] **Step 3: Viết `lib/nav.ts`**

```ts
export type TabKey = "home" | "history" | "guide" | "tools" | "settings";

export const TABS: {
  key: TabKey;
  href: string;
  label: string;
  icon: string;
}[] = [
  { key: "home", href: "/", label: "Trang chủ", icon: "🏠" },
  { key: "history", href: "/nhat-ky", label: "Nhật ký", icon: "📖" },
  { key: "guide", href: "/cam-nang", label: "Cẩm nang", icon: "📚" },
  { key: "tools", href: "/tien-ich", label: "Tiện ích", icon: "🧰" },
  { key: "settings", href: "/cai-dat", label: "Cài đặt", icon: "⚙️" },
];

export type MenuItem = { label: string; href: string | null };

export const GUIDE_ITEMS: MenuItem[] = [
  { label: "Tiêm chủng", href: null },
  { label: "Triệu chứng", href: null },
  { label: "Phát triển", href: null },
  { label: "Bồng bế", href: null },
  { label: "Bệnh thường gặp", href: null },
];

export const TOOL_ITEMS: MenuItem[] = [
  { label: "Thống kê", href: "/thong-ke" },
  { label: "Tăng trưởng", href: null },
  { label: "Khẩn cấp", href: null },
  { label: "Nhạc", href: null },
  { label: "Ồn trắng", href: null },
  { label: "Ảnh", href: null },
  { label: "Báo cáo", href: null },
];

const OWNERS: { tab: TabKey; prefixes: string[] }[] = [
  { tab: "history", prefixes: ["/nhat-ky"] },
  {
    tab: "guide",
    prefixes: [
      "/cam-nang",
      "/tiem-chung",
      "/trieu-chung",
      "/phat-trien",
      "/bong-be",
    ],
  },
  {
    tab: "tools",
    prefixes: [
      "/tien-ich",
      "/thong-ke",
      "/tang-truong",
      "/khan-cap",
      "/nhac",
      "/on-trang",
      "/anh",
      "/bao-cao",
    ],
  },
  { tab: "settings", prefixes: ["/cai-dat"] },
];

export function activeTab(pathname: string): TabKey | null {
  if (pathname === "/") return "home";
  const owner = OWNERS.find(({ prefixes }) =>
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
  );
  return owner?.tab ?? null;
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run test lib/nav.test.ts`
Expected: PASS — 3 test.

- [ ] **Step 5: Tạo `components/nav/TabBar.tsx`**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md` và `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md`.

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeTab, TABS } from "@/lib/nav";

export function TabBar() {
  const current = activeTab(usePathname());
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center text-xs ${active ? "font-semibold text-accent-ink" : "text-muted"}`}
              >
                <span aria-hidden="true" className="text-xl">
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 6: Tạo `components/nav/MenuScreen.tsx`, `app/cam-nang/page.tsx`, `app/tien-ich/page.tsx`**

`components/nav/MenuScreen.tsx`:

```tsx
import Link from "next/link";
import type { MenuItem } from "@/lib/nav";

export function MenuScreen({
  title,
  items,
}: {
  title: string;
  items: MenuItem[];
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <ul className="divide-y rounded-2xl border">
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className="flex min-h-12 items-center justify-between px-4"
              >
                {item.label}
                <span aria-hidden="true">›</span>
              </Link>
            ) : (
              <span className="flex min-h-12 items-center justify-between px-4 text-muted">
                {item.label}
                <span className="text-sm">Sắp có</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

`app/cam-nang/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { MenuScreen } from "@/components/nav/MenuScreen";
import { GUIDE_ITEMS } from "@/lib/nav";

export default function Page() {
  return (
    <AuthGate need="baby">
      {() => <MenuScreen title="Cẩm nang" items={GUIDE_ITEMS} />}
    </AuthGate>
  );
}
```

`app/tien-ich/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { MenuScreen } from "@/components/nav/MenuScreen";
import { TOOL_ITEMS } from "@/lib/nav";

export default function Page() {
  return (
    <AuthGate need="baby">
      {() => <MenuScreen title="Tiện ích" items={TOOL_ITEMS} />}
    </AuthGate>
  );
}
```

- [ ] **Step 7: Gắn thanh tab trong `components/AuthGate.tsx`**

Thêm import ngay sau dòng `import { useEffect, type ReactNode } from "react";`:

```tsx
import { TabBar } from "@/components/nav/TabBar";
```

Thay dòng cuối của hàm:

```tsx
  return <>{children({ session, ctx: family.data ?? null })}</>;
```

bằng:

```tsx
  const content = children({ session, ctx: family.data ?? null });
  if (need !== "baby") return <>{content}</>;
  return (
    <>
      <div className="pb-16">{content}</div>
      <TabBar />
    </>
  );
```

- [ ] **Step 8: Cho sheet phủ lên thanh tab**

Trong `components/home/QuickEntrySheet.tsx` và `components/history/LogEditSheet.tsx`, mỗi file có đúng một dòng:

```tsx
      className="fixed inset-0 z-10 flex items-end bg-black/40"
```

Đổi `z-10` thành `z-20` ở cả hai file:

```tsx
      className="fixed inset-0 z-20 flex items-end bg-black/40"
```

- [ ] **Step 9: Bỏ điều hướng tạm**

1. `components/home/HomeScreen.tsx`: xóa dòng `import Link from "next/link";` và xóa nguyên khối (kể cả dòng trống ngay sau nó):

```tsx
      <nav className="flex gap-3">
        <Link
          href="/nhat-ky"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border"
        >
          Nhật ký
        </Link>
        <Link
          href="/thong-ke"
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border"
        >
          Thống kê
        </Link>
      </nav>
```

2. `components/history/HistoryScreen.tsx`: xóa dòng `import Link from "next/link";` và xóa:

```tsx
        <Link href="/" className="flex min-h-11 items-center text-accent-ink">
          ← Trang chủ
        </Link>
```

Header còn lại tiêu đề "Nhật ký" và nút "+ Thêm".

3. `components/stats/StatsScreen.tsx`: thay

```tsx
        <Link href="/" className="flex min-h-11 items-center text-accent-ink">
          ← Trang chủ
        </Link>
```

bằng:

```tsx
        <Link
          href="/tien-ich"
          className="flex min-h-11 items-center text-accent-ink"
        >
          ← Tiện ích
        </Link>
```

- [ ] **Step 10: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  111 passed (111)`; build thành công, route có thêm `○ /cam-nang` và `○ /tien-ich`.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat(nav): bottom tab bar with guide and tools menus"
```

---

### Task 4: Trang Cài đặt và trang Cài app

**Files:**

- Create: `components/settings/SettingsScreen.tsx`, `app/cai-dat/page.tsx`, `components/install/InstallGuide.tsx`, `app/cai-app/page.tsx`
- Modify: `components/auth/LoginScreen.tsx` (import, link tới `/cai-app`)

**Interfaces:**

- Consumes: `useThemePref`, `THEME_OPTIONS` (Task 2); `AuthGate` (Task 3, tự gắn thanh tab); `supabase()`; `FamilyMember`
- Produces: `SettingsScreen({ member: FamilyMember; email: string })`, `InstallGuide()`, route `/cai-dat`, `/cai-app`

- [ ] **Step 1: Tạo `components/settings/SettingsScreen.tsx`**

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useThemePref } from "@/lib/hooks/useTheme";
import { supabase } from "@/lib/supabase/client";
import type { FamilyMember } from "@/lib/supabase/rows";
import { THEME_OPTIONS } from "@/lib/theme";

const ROLE_LABEL: Record<string, string> = {
  owner: "Chủ gia đình",
  member: "Thành viên",
};

export function SettingsScreen({
  member,
  email,
}: {
  member: FamilyMember;
  email: string;
}) {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useThemePref();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await supabase().auth.signOut();
      queryClient.clear();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Cài đặt</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Giao diện</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={`min-h-11 rounded-xl px-3 ${theme === option.value ? "bg-accent text-on-accent" : "bg-soft"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Ứng dụng</h2>
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center justify-between rounded-xl border px-4"
        >
          Cài Bé Yêu lên màn hình chính
          <span aria-hidden="true">›</span>
        </Link>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tài khoản</h2>
        <p>
          {member.display_name} · {ROLE_LABEL[member.role] ?? member.role}
        </p>
        <p className="text-muted">{email}</p>
        <button
          type="button"
          disabled={signingOut}
          onClick={signOut}
          className="min-h-11 rounded-xl border disabled:opacity-50"
        >
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Tạo `app/cai-dat/page.tsx`**

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx ? (
          <SettingsScreen
            member={ctx.member}
            email={session?.user.email ?? ""}
          />
        ) : null
      }
    </AuthGate>
  );
}
```

- [ ] **Step 3: Tạo `components/install/InstallGuide.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallGuide() {
  const [standalone, setStandalone] = useState<boolean | null>(null);
  useEffect(() => setStandalone(isStandalone()), []);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Link href="/" className="flex min-h-11 items-center text-accent-ink">
        ← Quay lại
      </Link>
      <h1 className="text-2xl font-semibold">Cài Bé Yêu</h1>
      {standalone === true && (
        <p className="rounded-2xl bg-good-soft p-4 text-good-ink">
          Bé Yêu đã được cài và đang chạy từ màn hình chính.
        </p>
      )}
      {standalone === false && (
        <>
          <p className="rounded-2xl bg-warn-soft p-4 text-warn-ink">
            Phải cài Bé Yêu lên màn hình chính thì iPhone mới nhận được thông
            báo.
          </p>
          <ol className="flex flex-col gap-3">
            <li>
              1. Mở trang này bằng Safari, bấm nút <strong>Chia sẻ</strong>{" "}
              (hình vuông có mũi tên đi lên).
            </li>
            <li>
              2. Chọn <strong>Thêm vào MH chính</strong>, rồi bấm{" "}
              <strong>Thêm</strong>.
            </li>
            <li>
              3. Mở Bé Yêu từ biểu tượng mới trên màn hình chính và đăng nhập
              lại.
            </li>
          </ol>
        </>
      )}
    </main>
  );
}
```

`standalone` bắt đầu là `null` (chưa biết khi prerender), rồi được đo trong `useEffect`, nên HTML tĩnh không lệch với lần vẽ đầu ở client.

- [ ] **Step 4: Tạo `app/cai-app/page.tsx`**

```tsx
"use client";

import { InstallGuide } from "@/components/install/InstallGuide";

export default function Page() {
  return <InstallGuide />;
}
```

Trang này không dùng `AuthGate`: người chưa đăng nhập cũng xem được.

- [ ] **Step 5: Thêm link ở trang đăng nhập**

Trong `components/auth/LoginScreen.tsx`, thêm `import Link from "next/link";` ngay trên dòng `import { useState } from "react";`, rồi chèn ngay trước `{error && (`:

```tsx
      <Link
        href="/cai-app"
        className="flex min-h-11 items-center justify-center text-accent-ink underline"
      >
        Cách cài Bé Yêu lên màn hình chính
      </Link>
```

(Khối JSX, không có dấu `;`.)

- [ ] **Step 6: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  111 passed (111)`; build thành công với 12 route:
- `/`, `/_not-found`, `/auth/callback`
- `/cai-app`, `/cai-dat`, `/cam-nang`
- `/chua-duoc-moi`, `/dang-nhap`, `/khai-bao-be`
- `/nhat-ky`, `/thong-ke`, `/tien-ich`

- [ ] **Step 7: 👤 Kiểm tra tay trên localhost**

Run: `bun run dev`. Mở `http://localhost:3000/` trong Claude in Chrome: bắt đầu bằng `tabs_context_mcp`, mở tab mới bằng `tabs_create_mcp`. Nếu Chrome không kết nối được, hỏi người dùng dùng trình duyệt nào trước khi đổi. Nhờ người dùng tự đăng nhập Google nếu cần. Kiểm tra cùng người dùng:

1. Trang chủ trông như trước (Sáng), không còn hai nút "Nhật ký"/"Thống kê" dưới tên bé. Đáy màn hình có thanh tab 5 mục, "Trang chủ" đang tô màu.
2. Bấm từng tab:
   - "Nhật ký" → trang Nhật ký, không còn "← Trang chủ".
   - "Cẩm nang" → 5 mục đều ghi "Sắp có".
   - "Tiện ích" → "Thống kê" bấm được, các mục khác "Sắp có".
   - Bấm "Thống kê" → tab "Tiện ích" vẫn tô màu; link "← Tiện ích" quay về.
3. Ở trang chủ bấm "Bình" → sheet phủ lên cả thanh tab. Bấm Hủy.
4. Tab "Cài đặt" → thấy Giao diện (4 nút, "Theo hệ thống" đang chọn), Ứng dụng, Tài khoản (tên hiển thị · vai trò, email).
5. Bấm "Tối" → cả app đổi nền tối ngay. Tải lại trang → vẫn tối, không chớp trắng. Xem trang chủ, Nhật ký, Thống kê (biểu đồ và hộp chú thích đều tối).
6. Bấm "Ban đêm" → nền gần đen, chữ và nút màu đỏ cam, không còn chỗ nào trắng (cả sheet "Bình" và hộp chú thích biểu đồ khi chạm cột).
7. Bấm "Theo hệ thống", rồi đổi máy sang chế độ tối/sáng (macOS: System Settings → Appearance) → app đổi theo mà không cần tải lại.
8. Bấm "Cài Bé Yêu lên màn hình chính" → trang "Cài Bé Yêu" có 3 bước và câu "Phải cài Bé Yêu lên màn hình chính…", không có thanh tab; "← Quay lại" về trang chủ.
9. Về "Cài đặt" bấm "Đăng xuất" → về trang đăng nhập. Trang đăng nhập có link "Cách cài Bé Yêu lên màn hình chính" mở được `/cai-app`. Đăng nhập lại.

- [ ] **Step 8: Commit và deploy**

```bash
git add -A && git commit -m "feat(settings): /cai-dat with theme picker and sign-out, /cai-app install guide"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app. Nhờ người dùng mở PWA trên iPhone 16 hoặc 17 Pro (iPhone 11 đang iOS 16.3, chưa đủ 16.4):
- Thanh tab nằm trên vạch Home, không che nội dung.
- Thử "Ban đêm" rồi đóng hẳn app và mở lại: vẫn Ban đêm.
- `/cai-app` báo "Bé Yêu đã được cài…".

Nhờ người dùng xác nhận đạt.

---

## Ngoài phạm vi M7

- M8: `/cai-dat` phần Hồ sơ bé (sửa thông tin khai báo, owner), Khoảng cách cữ bú `feed_interval_min` 60–360 bước 15 (owner), Thành viên (danh sách; owner thêm/bớt/đổi vai trò; chặn mất owner cuối).
- M9: service worker §8.4, offline outbox §9, push `feed` §8, pg_cron + Vault, phần Thông báo của `/cai-dat` (bật trên máy này, 3 công tắc, Tạm tắt 2/4/8 giờ), nút "Bật thông báo" của `/cai-app`, checklist thiết bị bước 1–4 và 7.
