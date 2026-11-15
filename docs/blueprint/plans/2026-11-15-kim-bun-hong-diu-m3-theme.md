# Kim Bun — M3 Bốn nền sáng dịu mắt Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-15-kim-bun-hong-diu-thuoc-popup-design.md` (§3, §6)

**Status:** approved 2026-11-15

**Goal:** Thêm 4 theme sáng tối hơn, không có bề mặt trắng tinh:

- `rose` — Hồng dịu, mặc định;
- `peach` — Đào mơ;
- `lavender` — Oải hương;
- `sea` — Biển sương.

Cài đặt có hàng **5 chấm màu** "Nền sáng", gồm Trắng cùng 4 nền trên. Checklist có thêm bước 30 cho cả 3 mốc.

**Architecture:**

- **Token:** mỗi theme mới có bộ token riêng trong `app/globals.css` (`:root[data-theme="<tên>"]`) và `lib/ui/tokens.ts`. Hai test có sẵn (khớp token, độ tương phản) tự kiểm theme mới.
- **Chọn theme** (`lib/rules/theme.ts`):
  - Khoá localStorage mới `be-yeu-light-style`.
  - Khi `resolveActiveTheme` tính ra `light`: style `white` giữ `light`, các style khác thay bằng chính tên style.
  - Lịch ban đêm và override vẫn thắng như cũ.
- **Mở app không chớp trắng:** script inline `THEME_INIT_SCRIPT` làm y như trên.
- **Nơi đổi:** `AppearanceGroupView` có hàng `Swatch`. Màu mỗi chấm do `lightSwatch(style)` dựng: chia đôi chéo, nửa `bg`, nửa `accent` của theme đó. Hook `useLightStyle` ghi khoá rồi gọi `applyTheme()`.
- **Màu nền cho `theme-color` và manifest:**
  - `THEME_COLORS` có đủ 7 theme.
  - `app/layout.tsx` lấy `THEMES.rose.bg` cho mục light.
  - Manifest đổi sang `#E9DBDB`.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9 `strict`, Tailwind CSS 4.3.3, Vitest (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Nhánh:** `feat/kim-bun-hong-diu-m3`, cắt từ `feat/kim-bun-hong-diu-m2`. Baseline: 682 test xanh (sau M2).

**Các mốc của spec này:**

| Mốc | Nội dung |
| --- | --- |
| M1 | §5 popup giữa màn hình |
| M2 | §4 chip thuốc, đơn vị gói/ống, Segmented 2–6 |
| **M3 (plan này)** | §3 bốn nền sáng, checklist bước 30 |

**Quyết định cho chỗ spec chưa nói rõ:**

- **`resolveActiveTheme` bắt buộc có `lightStyle`** (không để tuỳ chọn), để không chỗ gọi nào quên truyền. `base` trong test luật dùng `lightStyle: "white"`, nhờ vậy mọi kỳ vọng `"light"` cũ giữ nguyên.
- **Nhãn `Nền sáng`** là chữ nhỏ (13 px, đậm, màu muted, `mx-4`) nằm trên hàng chấm. Segmented "Giao diện" đã có `<h2>` của nhóm phía trên.
- **Hàng chấm** nằm trong khối `glass` với `flex justify-between rounded-[22px] px-3 py-3`. Như vậy 5 chấm 44 px chia đều bề ngang ở 375 px, và nhãn 12 px "Biển sương" không bị cắt.
- **`useLightStyle` không xoá override ban đêm.** Đổi nền sáng không đụng Ban đêm, khác với `useThemePref`.
- **Tên trong code:** `rose`, `peach`, `lavender`, `sea`. Đây cũng là giá trị lưu trong `be-yeu-light-style` và giá trị của `data-theme`.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json`: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào.** Không tải font web. Không dùng emoji làm icon.
- **Màu:**
  - Mọi màu chỉ đặt trong `app/globals.css` và `lib/ui/tokens.ts`. Hai file phải giống nhau từng giá trị (`lib/ui/tokens.test.ts` kiểm).
  - Ngoại lệ, đúng như spec: lớp tối và bóng `rgb(0 0 0/0.3)` của hộp thoại (M1), và `#E9DBDB` trong `public/manifest.webmanifest`.
  - `lib/themeGuard.test.ts` phải xanh: không hex trong `.tsx` dưới `components/`. Gradient của chấm màu được dựng trong `lib/theme.ts` từ `THEMES`.
- Mọi token chữ đạt ≥ 4.5:1 trên nền và trên kính (`lib/ui/contrast.test.ts`). `switch-on` đạt ≥ 3:1 trên nền.
- Không có `#FFFFFF` nào làm nền bề mặt trong 4 theme mới. Chỉ `on-accent` và `on-danger` dùng trắng.
- Theme `light`, `dark`, `night` giữ nguyên mọi giá trị. Lịch ban đêm và nút mặt trăng chạy như cũ.
- Vùng chạm tối thiểu 44×44 pt. Không thêm `env(safe-area-inset-*)` trong màn hình.
- Không lồng `glass` trong `glass` nếu chưa có quy tắc tắt blur (hotfix `7822c90` giữ nguyên).
- **localStorage:**
  - Giữ prefix khoá `be-yeu-*`.
  - Khoá mới đúng tên `be-yeu-light-style`, giá trị `"white"` | `"rose"` | `"peach"` | `"lavender"` | `"sea"`. Thiếu khoá hoặc giá trị lạ thì coi là `"rose"`.
  - Tên package và URL `bunkid.vercel.app` giữ nguyên.
- **Dev dùng chung Supabase thật của gia đình.** Khi kiểm tay không bấm "Lưu", không bắt đầu timer.
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".
- Trước khi dùng API mới của Next/React, đọc docs trong `node_modules/next/dist/docs/` (AGENTS.md), nhất là `viewport`/`themeColor` khi sửa `app/layout.tsx`.
- Các đoạn "thay X bằng Y" có thể bị formatter làm lệch thụt lề: so khớp theo nội dung từng dòng, **bỏ qua thụt lề**.

## Contracts with Other Plans

**Consumes:** M1 (`Sheet` với popup giữa màn hình) và M2 (sheet Thuốc có chip). M3 không gọi API nào của hai mốc đó; chỉ kiểm chúng trong Chrome và checklist bước 30.

**Produces** (không plan nào sau dùng; ghi lại cho đủ):

- `lib/ui/tokens.ts`: `THEME_NAMES = ["light", "rose", "peach", "lavender", "sea", "dark", "night"]`, `THEMES.rose`, `THEMES.peach`, `THEMES.lavender`, `THEMES.sea`.
- `lib/rules/theme.ts`: `export type LightStyle = "white" | "rose" | "peach" | "lavender" | "sea"`; `parseLightStyle(raw: string | null): LightStyle`; `resolveActiveTheme` nhận thêm `lightStyle: LightStyle`.
- `lib/theme.ts`: `LIGHT_STYLE_KEY = "be-yeu-light-style"`; `LIGHT_STYLE_OPTIONS: { value: LightStyle; label: string }[]`; `lightSwatch(style: LightStyle): string`; `ThemeState.lightStyle`; `THEME_COLORS` đủ 7 theme.
- `lib/hooks/useTheme.ts`: `useLightStyle(): [LightStyle, (next: LightStyle) => void]`.
- `components/settings/AppearanceGroup.tsx`: `AppearanceGroupView` có thêm prop `lightStyle: LightStyle`, `onLightStyle: (next: LightStyle) => void`.

---

### Task 1: Token của 4 theme mới

**Files:**

- Modify: `lib/ui/tokens.ts` (dòng 1 `THEME_NAMES`, thêm 4 mục vào `THEMES` ngay sau `light`)
- Modify: `app/globals.css` (thêm 4 khối ngay sau dấu `}` đóng `@theme`, trước `:root[data-theme="dark"]`)
- Modify: `lib/theme.ts` (`THEME_COLORS`)
- Test: `lib/ui/tokens.test.ts` (`OPENERS`), `lib/ui/contrast.test.ts` (thêm 1 `describe`), `lib/theme.test.ts` (test `THEME_COLORS`)

**Interfaces:**

- Consumes: `THEMES`, `TOKEN_NAMES`, `ThemeName`.
- Produces: `ThemeName` có `"rose" | "peach" | "lavender" | "sea"`; 4 mục `THEMES`; `THEME_COLORS` đủ 7 theme.

- [ ] **Step 1: Viết test hỏng**

1. Trong `lib/ui/tokens.test.ts`, thay:

```ts
const OPENERS = {
  light: "@theme {",
  dark: ':root[data-theme="dark"] {',
  night: ':root[data-theme="night"] {',
} as const;
```

bằng:

```ts
const OPENERS = {
  light: "@theme {",
  rose: ':root[data-theme="rose"] {',
  peach: ':root[data-theme="peach"] {',
  lavender: ':root[data-theme="lavender"] {',
  sea: ':root[data-theme="sea"] {',
  dark: ':root[data-theme="dark"] {',
  night: ':root[data-theme="night"] {',
} as const;
```

2. Thêm vào cuối `lib/ui/contrast.test.ts`:

```ts
describe("the four soft light themes", () => {
  it.each(["rose", "peach", "lavender", "sea"] as const)(
    "%s has no pure white surface, only white text on solid buttons",
    (name) => {
      for (const token of TOKEN_NAMES) {
        if (token === "on-accent" || token === "on-danger") continue;
        expect(THEMES[name][token].toUpperCase(), token).not.toBe("#FFFFFF");
      }
    },
  );
});
```

3. Trong `lib/theme.test.ts`, thay test `"status bar colours match each theme's page colour"` bằng:

```ts
  it("status bar colours match each theme's page colour", () => {
    expect(THEME_COLORS).toEqual({
      light: "#FBF3F0",
      rose: "#E9DBDB",
      peach: "#EFDCCD",
      lavender: "#E3DDE9",
      sea: "#DDE3E8",
      dark: "#0F0B12",
      night: "#0A0705",
    });
  });
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/tokens.test.ts lib/ui/contrast.test.ts lib/theme.test.ts`
Expected: FAIL. `THEMES.rose` (và 3 theme kia) là `undefined`; `THEME_COLORS` chưa có các mục mới.

- [ ] **Step 3: Thêm 4 theme vào `lib/ui/tokens.ts`**

Thay dòng 1:

```ts
export const THEME_NAMES = ["light", "dark", "night"] as const;
```

bằng:

```ts
export const THEME_NAMES = [
  "light",
  "rose",
  "peach",
  "lavender",
  "sea",
  "dark",
  "night",
] as const;
```

Trong `THEMES`, ngay sau dấu `},` đóng mục `light` và trước `dark: {`, thêm nguyên khối sau. Màu trạng thái và màu danh mục giống nhau ở cả 4 theme; chúng được làm đậm hơn `light` để vẫn đạt 4.5:1 trên nền tối hơn.

```ts
  // Spec §3.3 Hồng dịu.
  rose: {
    bg: "#E9DBDB",
    "blob-1": "#E5C0B8",
    "blob-2": "#D4C8DE",
    "blob-3": "#E2B9C5",
    ink: "#2B1B22",
    muted: "#66505A",
    glass: "rgb(245 235 235 / 0.62)",
    "glass-strong": "rgb(243 233 233 / 0.92)",
    "glass-solid": "#F2E6E6",
    edge: "rgb(255 248 248 / 0.5)",
    line: "rgb(43 27 34 / 0.08)",
    scrim: "rgb(43 27 34 / 0.26)",
    accent: "#A8255A",
    "on-accent": "#FFFFFF",
    "accent-text": "#A8255A",
    "accent-tint": "rgb(168 37 90 / 0.12)",
    good: "#18692F",
    warn: "#7F4A00",
    danger: "#AD1025",
    "danger-solid": "#AD1025",
    "on-danger": "#FFFFFF",
    "switch-on": "#18692F",
    "danger-soft": "#F5DCD9",
    "danger-ink": "#8A0F1F",
    "warn-soft": "#F3E1C4",
    "warn-ink": "#7A4300",
    "good-soft": "#D5E9DA",
    "good-ink": "#1A5A30",
    "cat-feed": "#A8134E",
    "cat-bottle": "#9A2D51",
    "cat-sleep": "#5B4BC4",
    "cat-diaper": "#7F4A00",
    "cat-pump": "#7A33AD",
    "cat-tummy": "#236938",
    "cat-med": "#A8301F",
    "cat-temp": "#165E73",
  },
  // Spec §3.3 Đào mơ.
  peach: {
    bg: "#EFDCCD",
    "blob-1": "#F0C6AB",
    "blob-2": "#EBCEBF",
    "blob-3": "#EBC2B5",
    ink: "#2E1D18",
    muted: "#67503F",
    glass: "rgb(247 234 224 / 0.64)",
    "glass-strong": "rgb(245 232 222 / 0.92)",
    "glass-solid": "#F5E8DC",
    edge: "rgb(255 248 240 / 0.45)",
    line: "rgb(46 29 24 / 0.08)",
    scrim: "rgb(46 29 24 / 0.26)",
    accent: "#A3324A",
    "on-accent": "#FFFFFF",
    "accent-text": "#A3324A",
    "accent-tint": "rgb(163 50 74 / 0.12)",
    good: "#18692F",
    warn: "#7F4A00",
    danger: "#AD1025",
    "danger-solid": "#AD1025",
    "on-danger": "#FFFFFF",
    "switch-on": "#18692F",
    "danger-soft": "#F5DCD9",
    "danger-ink": "#8A0F1F",
    "warn-soft": "#F3E1C4",
    "warn-ink": "#7A4300",
    "good-soft": "#D5E9DA",
    "good-ink": "#1A5A30",
    "cat-feed": "#A8134E",
    "cat-bottle": "#9A2D51",
    "cat-sleep": "#5B4BC4",
    "cat-diaper": "#7F4A00",
    "cat-pump": "#7A33AD",
    "cat-tummy": "#236938",
    "cat-med": "#A8301F",
    "cat-temp": "#165E73",
  },
  // Spec §3.3 Oải hương.
  lavender: {
    bg: "#E3DDE9",
    "blob-1": "#DACEE7",
    "blob-2": "#D1D2E7",
    "blob-3": "#E3CDDC",
    ink: "#251F2E",
    muted: "#5C5266",
    glass: "rgb(240 236 245 / 0.64)",
    "glass-strong": "rgb(238 233 243 / 0.92)",
    "glass-solid": "#EEE9F3",
    edge: "rgb(255 255 255 / 0.45)",
    line: "rgb(37 31 46 / 0.08)",
    scrim: "rgb(37 31 46 / 0.26)",
    accent: "#8A2C6B",
    "on-accent": "#FFFFFF",
    "accent-text": "#8A2C6B",
    "accent-tint": "rgb(138 44 107 / 0.12)",
    good: "#18692F",
    warn: "#7F4A00",
    danger: "#AD1025",
    "danger-solid": "#AD1025",
    "on-danger": "#FFFFFF",
    "switch-on": "#18692F",
    "danger-soft": "#F5DCD9",
    "danger-ink": "#8A0F1F",
    "warn-soft": "#F3E1C4",
    "warn-ink": "#7A4300",
    "good-soft": "#D5E9DA",
    "good-ink": "#1A5A30",
    "cat-feed": "#A8134E",
    "cat-bottle": "#9A2D51",
    "cat-sleep": "#5B4BC4",
    "cat-diaper": "#7F4A00",
    "cat-pump": "#7A33AD",
    "cat-tummy": "#236938",
    "cat-med": "#A8301F",
    "cat-temp": "#165E73",
  },
  // Spec §3.3 Biển sương.
  sea: {
    bg: "#DDE3E8",
    "blob-1": "#CBD7E1",
    "blob-2": "#D8D5E5",
    "blob-3": "#E3D4D8",
    ink: "#1D2630",
    muted: "#4F5B66",
    glass: "rgb(236 241 245 / 0.64)",
    "glass-strong": "rgb(235 240 244 / 0.92)",
    "glass-solid": "#EBEFF3",
    edge: "rgb(255 255 255 / 0.45)",
    line: "rgb(29 38 48 / 0.08)",
    scrim: "rgb(29 38 48 / 0.26)",
    accent: "#2C5A85",
    "on-accent": "#FFFFFF",
    "accent-text": "#2C5A85",
    "accent-tint": "rgb(44 90 133 / 0.12)",
    good: "#18692F",
    warn: "#7F4A00",
    danger: "#AD1025",
    "danger-solid": "#AD1025",
    "on-danger": "#FFFFFF",
    "switch-on": "#18692F",
    "danger-soft": "#F5DCD9",
    "danger-ink": "#8A0F1F",
    "warn-soft": "#F3E1C4",
    "warn-ink": "#7A4300",
    "good-soft": "#D5E9DA",
    "good-ink": "#1A5A30",
    "cat-feed": "#A8134E",
    "cat-bottle": "#9A2D51",
    "cat-sleep": "#5B4BC4",
    "cat-diaper": "#7F4A00",
    "cat-pump": "#7A33AD",
    "cat-tummy": "#236938",
    "cat-med": "#A8301F",
    "cat-temp": "#165E73",
  },
```

- [ ] **Step 4: Thêm 4 khối CSS**

Trong `app/globals.css`, ngay sau dấu `}` đóng khối `@theme { … }` và trước dòng `:root[data-theme="dark"] {`, thêm:

```css
:root[data-theme="rose"] {
  --color-bg: #e9dbdb;
  --color-blob-1: #e5c0b8;
  --color-blob-2: #d4c8de;
  --color-blob-3: #e2b9c5;
  --color-ink: #2b1b22;
  --color-muted: #66505a;
  --color-glass: rgb(245 235 235 / 0.62);
  --color-glass-strong: rgb(243 233 233 / 0.92);
  --color-glass-solid: #f2e6e6;
  --color-edge: rgb(255 248 248 / 0.5);
  --color-line: rgb(43 27 34 / 0.08);
  --color-scrim: rgb(43 27 34 / 0.26);
  --color-accent: #a8255a;
  --color-on-accent: #ffffff;
  --color-accent-text: #a8255a;
  --color-accent-tint: rgb(168 37 90 / 0.12);
  --color-good: #18692f;
  --color-warn: #7f4a00;
  --color-danger: #ad1025;
  --color-danger-solid: #ad1025;
  --color-on-danger: #ffffff;
  --color-switch-on: #18692f;
  --color-danger-soft: #f5dcd9;
  --color-danger-ink: #8a0f1f;
  --color-warn-soft: #f3e1c4;
  --color-warn-ink: #7a4300;
  --color-good-soft: #d5e9da;
  --color-good-ink: #1a5a30;
  --color-cat-feed: #a8134e;
  --color-cat-bottle: #9a2d51;
  --color-cat-sleep: #5b4bc4;
  --color-cat-diaper: #7f4a00;
  --color-cat-pump: #7a33ad;
  --color-cat-tummy: #236938;
  --color-cat-med: #a8301f;
  --color-cat-temp: #165e73;
}

:root[data-theme="peach"] {
  --color-bg: #efdccd;
  --color-blob-1: #f0c6ab;
  --color-blob-2: #ebcebf;
  --color-blob-3: #ebc2b5;
  --color-ink: #2e1d18;
  --color-muted: #67503f;
  --color-glass: rgb(247 234 224 / 0.64);
  --color-glass-strong: rgb(245 232 222 / 0.92);
  --color-glass-solid: #f5e8dc;
  --color-edge: rgb(255 248 240 / 0.45);
  --color-line: rgb(46 29 24 / 0.08);
  --color-scrim: rgb(46 29 24 / 0.26);
  --color-accent: #a3324a;
  --color-on-accent: #ffffff;
  --color-accent-text: #a3324a;
  --color-accent-tint: rgb(163 50 74 / 0.12);
  --color-good: #18692f;
  --color-warn: #7f4a00;
  --color-danger: #ad1025;
  --color-danger-solid: #ad1025;
  --color-on-danger: #ffffff;
  --color-switch-on: #18692f;
  --color-danger-soft: #f5dcd9;
  --color-danger-ink: #8a0f1f;
  --color-warn-soft: #f3e1c4;
  --color-warn-ink: #7a4300;
  --color-good-soft: #d5e9da;
  --color-good-ink: #1a5a30;
  --color-cat-feed: #a8134e;
  --color-cat-bottle: #9a2d51;
  --color-cat-sleep: #5b4bc4;
  --color-cat-diaper: #7f4a00;
  --color-cat-pump: #7a33ad;
  --color-cat-tummy: #236938;
  --color-cat-med: #a8301f;
  --color-cat-temp: #165e73;
}

:root[data-theme="lavender"] {
  --color-bg: #e3dde9;
  --color-blob-1: #dacee7;
  --color-blob-2: #d1d2e7;
  --color-blob-3: #e3cddc;
  --color-ink: #251f2e;
  --color-muted: #5c5266;
  --color-glass: rgb(240 236 245 / 0.64);
  --color-glass-strong: rgb(238 233 243 / 0.92);
  --color-glass-solid: #eee9f3;
  --color-edge: rgb(255 255 255 / 0.45);
  --color-line: rgb(37 31 46 / 0.08);
  --color-scrim: rgb(37 31 46 / 0.26);
  --color-accent: #8a2c6b;
  --color-on-accent: #ffffff;
  --color-accent-text: #8a2c6b;
  --color-accent-tint: rgb(138 44 107 / 0.12);
  --color-good: #18692f;
  --color-warn: #7f4a00;
  --color-danger: #ad1025;
  --color-danger-solid: #ad1025;
  --color-on-danger: #ffffff;
  --color-switch-on: #18692f;
  --color-danger-soft: #f5dcd9;
  --color-danger-ink: #8a0f1f;
  --color-warn-soft: #f3e1c4;
  --color-warn-ink: #7a4300;
  --color-good-soft: #d5e9da;
  --color-good-ink: #1a5a30;
  --color-cat-feed: #a8134e;
  --color-cat-bottle: #9a2d51;
  --color-cat-sleep: #5b4bc4;
  --color-cat-diaper: #7f4a00;
  --color-cat-pump: #7a33ad;
  --color-cat-tummy: #236938;
  --color-cat-med: #a8301f;
  --color-cat-temp: #165e73;
}

:root[data-theme="sea"] {
  --color-bg: #dde3e8;
  --color-blob-1: #cbd7e1;
  --color-blob-2: #d8d5e5;
  --color-blob-3: #e3d4d8;
  --color-ink: #1d2630;
  --color-muted: #4f5b66;
  --color-glass: rgb(236 241 245 / 0.64);
  --color-glass-strong: rgb(235 240 244 / 0.92);
  --color-glass-solid: #ebeff3;
  --color-edge: rgb(255 255 255 / 0.45);
  --color-line: rgb(29 38 48 / 0.08);
  --color-scrim: rgb(29 38 48 / 0.26);
  --color-accent: #2c5a85;
  --color-on-accent: #ffffff;
  --color-accent-text: #2c5a85;
  --color-accent-tint: rgb(44 90 133 / 0.12);
  --color-good: #18692f;
  --color-warn: #7f4a00;
  --color-danger: #ad1025;
  --color-danger-solid: #ad1025;
  --color-on-danger: #ffffff;
  --color-switch-on: #18692f;
  --color-danger-soft: #f5dcd9;
  --color-danger-ink: #8a0f1f;
  --color-warn-soft: #f3e1c4;
  --color-warn-ink: #7a4300;
  --color-good-soft: #d5e9da;
  --color-good-ink: #1a5a30;
  --color-cat-feed: #a8134e;
  --color-cat-bottle: #9a2d51;
  --color-cat-sleep: #5b4bc4;
  --color-cat-diaper: #7f4a00;
  --color-cat-pump: #7a33ad;
  --color-cat-tummy: #236938;
  --color-cat-med: #a8301f;
  --color-cat-temp: #165e73;
}
```

Các khối này không có `color-scheme: dark`; cả 4 là theme sáng.

- [ ] **Step 5: `THEME_COLORS` đủ 7 theme**

Trong `lib/theme.ts`, thay:

```ts
export const THEME_COLORS: Record<ThemeName, string> = {
  light: THEMES.light.bg,
  dark: THEMES.dark.bg,
  night: THEMES.night.bg,
};
```

bằng:

```ts
export const THEME_COLORS = Object.fromEntries(
  THEME_NAMES.map((name) => [name, THEMES[name].bg]),
) as Record<ThemeName, string>;
```

và đổi dòng import từ `@/lib/ui/tokens` thành:

```ts
import { THEME_NAMES, THEMES, type ThemeName } from "@/lib/ui/tokens";
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test lib/ui/tokens.test.ts lib/ui/contrast.test.ts lib/theme.test.ts && bun run typecheck`
Expected: PASS. Typecheck không lỗi.

`contrast.test.ts` chạy cho mỗi theme mới đủ 14 token chữ, 5 cặp và `switch-on`. Đã đo trước: thấp nhất là `cat-sleep` 4.81 (rose), 4.86 (peach, lavender), 5.00 (sea); chữ trắng trên `accent` 6.75–7.91.

Nếu một token chữ trượt 4.5:1, làm đậm đúng token đó (giữ tông màu) ở **cả hai** file cho tới khi đạt, rồi ghi giá trị mới vào báo cáo cuối.

- [ ] **Step 7: Commit**

```bash
git add lib/ui/tokens.ts app/globals.css lib/theme.ts lib/ui/tokens.test.ts lib/ui/contrast.test.ts lib/theme.test.ts
git commit -m "feat(theme): Hồng dịu, Đào mơ, Oải hương and Biển sương tokens without white surfaces"
```

---

### Task 2: Chọn theme theo nền sáng, kể cả trước khi React chạy

**Files:**

- Modify: `lib/rules/theme.ts` (kiểu và hàm mới ở đầu file, `resolveActiveTheme`)
- Modify: `lib/theme.ts` (khoá, options, `lightSwatch`, `ThemeState`, `readThemeState`, `THEME_INIT_SCRIPT`)
- Modify: `lib/hooks/useTheme.ts` (import, `applyTheme`, `currentTheme`, hook mới `useLightStyle`)
- Test: `lib/rules/theme.test.ts`, `lib/theme.test.ts`

**Interfaces:**

- Consumes: `THEMES` cho 4 theme mới (Task 1).
- Produces: `LightStyle`, `parseLightStyle`, `resolveActiveTheme({ …, lightStyle })`, `LIGHT_STYLE_KEY`, `LIGHT_STYLE_OPTIONS`, `lightSwatch`, `ThemeState.lightStyle`, `useLightStyle`.

- [ ] **Step 1: Viết test hỏng cho luật**

Trong `lib/rules/theme.test.ts`:

1. Thêm `parseLightStyle` vào khối import từ `./theme`.
2. Trong `describe("resolveActiveTheme", …)`, thay `base` bằng:

```ts
  const base = {
    pref: "system" as const,
    prefersDark: false,
    schedule: DEFAULT_NIGHT_SCHEDULE,
    override: null,
    lightStyle: "white" as const,
  };
```

3. Thêm vào cuối `describe("resolveActiveTheme", …)`:

```ts
  it("a soft light style replaces light only, whether chosen or from the device", () => {
    for (const style of ["rose", "peach", "lavender", "sea"] as const) {
      const soft = { ...base, lightStyle: style };
      expect(resolveActiveTheme({ ...soft, now: vn("12:00") })).toBe(style);
      expect(
        resolveActiveTheme({ ...soft, pref: "light", now: vn("12:00") }),
      ).toBe(style);
      expect(
        resolveActiveTheme({ ...soft, pref: "dark", now: vn("12:00") }),
      ).toBe("dark");
      expect(
        resolveActiveTheme({ ...soft, prefersDark: true, now: vn("12:00") }),
      ).toBe("dark");
      expect(resolveActiveTheme({ ...soft, now: vn("22:00") })).toBe("night");
    }
    const morning = vn("06:00", 15).toISOString();
    expect(
      resolveActiveTheme({
        ...base,
        lightStyle: "sea",
        override: { on: false, until: morning },
        now: vn("22:00"),
      }),
    ).toBe("sea");
  });
```

4. Thêm vào trong `describe("stored values", …)`:

```ts
  it("parseLightStyle keeps the five known styles, anything else is Hồng dịu", () => {
    for (const style of ["white", "rose", "peach", "lavender", "sea"] as const)
      expect(parseLightStyle(style)).toBe(style);
    expect(parseLightStyle(null)).toBe("rose");
    expect(parseLightStyle("pink")).toBe("rose");
    expect(parseLightStyle("light")).toBe("rose");
  });
```

- [ ] **Step 2: Viết test hỏng cho storage và script inline**

Trong `lib/theme.test.ts`:

1. Thêm `LIGHT_STYLE_KEY`, `LIGHT_STYLE_OPTIONS`, `lightSwatch` vào khối import từ `./theme`.
2. Trong test `"readThemeState migrates the old stored night choice to an override"`, thêm `lightStyle: "rose",` vào object kỳ vọng, ngay sau `migrated: true,`.
3. Trong test `"readThemeState reads the three keys"`:
   - đổi tên thành `"readThemeState reads the four keys"`;
   - thêm `[LIGHT_STYLE_KEY]: "peach",` vào `store`;
   - thêm `lightStyle: "peach",` vào object kỳ vọng, ngay sau `migrated: false,`.
4. Thêm vào trong `describe("theme storage", …)`:

```ts
  it("offers five light backgrounds under be-yeu-light-style", () => {
    expect(LIGHT_STYLE_KEY).toBe("be-yeu-light-style");
    expect(LIGHT_STYLE_OPTIONS).toEqual([
      { value: "white", label: "Trắng" },
      { value: "rose", label: "Hồng dịu" },
      { value: "peach", label: "Đào mơ" },
      { value: "lavender", label: "Oải hương" },
      { value: "sea", label: "Biển sương" },
    ]);
  });

  it("each swatch is half page colour, half accent of its theme", () => {
    expect(lightSwatch("white")).toBe(
      "linear-gradient(135deg, #FBF3F0 50%, #B8285E 50%)",
    );
    expect(lightSwatch("sea")).toBe(
      "linear-gradient(135deg, #DDE3E8 50%, #2C5A85 50%)",
    );
  });
```

5. Trong mảng `cases` của `describe("THEME_INIT_SCRIPT matches resolveActiveTheme before React loads", …)`, thêm vào cuối mảng (trước `];`):

```ts
    {
      name: "white chosen, noon",
      store: { [LIGHT_STYLE_KEY]: "white" },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "light chosen, rose stored, noon",
      store: { [THEME_STORAGE_KEY]: "light", [LIGHT_STYLE_KEY]: "rose" },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "peach, noon",
      store: { [LIGHT_STYLE_KEY]: "peach" },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "lavender, noon",
      store: { [LIGHT_STYLE_KEY]: "lavender" },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "sea, night window",
      store: { [LIGHT_STYLE_KEY]: "sea" },
      dark: false,
      now: vn("22:00"),
    },
    {
      name: "junk light style, noon",
      store: { [LIGHT_STYLE_KEY]: "pink" },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "white chosen, dark device",
      store: { [LIGHT_STYLE_KEY]: "white" },
      dark: true,
      now: vn("12:00"),
    },
```

6. Thêm test này ngay sau `it.each(cases)("$name", …)`:

```ts
  it("paints Hồng dịu on the first frame when nothing is stored", () => {
    expect(runInitScript({}, false, vn("12:00"))).toBe("rose");
    expect(
      runInitScript({ [LIGHT_STYLE_KEY]: "lavender" }, false, vn("12:00")),
    ).toBe("lavender");
  });
```

7. Đổi test `"falls back to light when storage throws"`:
   - tên mới `"falls back to Hồng dịu when storage throws"`;
   - dòng cuối thành `expect(root.dataset.theme).toBe("rose");`.

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/theme.test.ts lib/theme.test.ts`
Expected: FAIL.

- Chưa có `parseLightStyle`, `LIGHT_STYLE_KEY`, `LIGHT_STYLE_OPTIONS`, `lightSwatch`.
- `readThemeState` chưa trả `lightStyle`.
- Script vẫn vẽ `light`.

- [ ] **Step 4: Sửa `lib/rules/theme.ts`**

1. Ngay dưới dòng `export type NightOverride = …`, thêm:

```ts
// Spec §3.1: which theme "light" means. Anything unknown is Hồng dịu.
export type LightStyle = "white" | "rose" | "peach" | "lavender" | "sea";

const LIGHT_STYLES: readonly LightStyle[] = [
  "white",
  "rose",
  "peach",
  "lavender",
  "sea",
];

export function parseLightStyle(raw: string | null): LightStyle {
  return LIGHT_STYLES.find((style) => style === raw) ?? "rose";
}
```

2. Thay cả hàm `resolveActiveTheme` bằng:

```ts
export function resolveActiveTheme(input: {
  pref: ThemePref;
  prefersDark: boolean;
  schedule: NightSchedule;
  override: NightOverride;
  lightStyle: LightStyle;
  now: Date;
}): ThemeName {
  const base: "light" | "dark" =
    input.pref === "system"
      ? input.prefersDark
        ? "dark"
        : "light"
      : input.pref;
  const day: ThemeName =
    base === "light" && input.lightStyle !== "white" ? input.lightStyle : base;
  const { override } = input;
  if (override && input.now.getTime() < Date.parse(override.until))
    return override.on ? "night" : day;
  return inNightWindow(input.now, input.schedule) ? "night" : day;
}
```

- [ ] **Step 5: Sửa `lib/theme.ts`**

1. Thay khối import từ `@/lib/rules/theme` và dòng `export type { ThemePref };` bằng:

```ts
import {
  nextNightBoundary,
  parseLightStyle,
  parseNightOverride,
  parseNightSchedule,
  toggleNightOverride,
  type LightStyle,
  type NightOverride,
  type NightSchedule,
  type ThemePref,
} from "@/lib/rules/theme";
```

```ts
export type { LightStyle, ThemePref };
```

(Dòng import từ `@/lib/ui/tokens` đã sửa ở Task 1, giữ nguyên.)

2. Ngay dưới `export const NIGHT_OVERRIDE_KEY = "be-yeu-night-override";`, thêm:

```ts
export const LIGHT_STYLE_KEY = "be-yeu-light-style";
```

3. Ngay dưới khối `THEME_OPTIONS`, thêm:

```ts
export const LIGHT_STYLE_OPTIONS: { value: LightStyle; label: string }[] = [
  { value: "white", label: "Trắng" },
  { value: "rose", label: "Hồng dịu" },
  { value: "peach", label: "Đào mơ" },
  { value: "lavender", label: "Oải hương" },
  { value: "sea", label: "Biển sương" },
];

// Spec §3.2: each Cài đặt swatch is split diagonally, page colour over accent.
export function lightSwatch(style: LightStyle): string {
  const t = THEMES[style === "white" ? "light" : style];
  return `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`;
}
```

4. Thay `ThemeState` và `readThemeState` bằng:

```ts
export type ThemeState = {
  pref: ThemePref;
  schedule: NightSchedule;
  override: NightOverride;
  lightStyle: LightStyle;
  migrated: boolean;
};

export function readThemeState(
  get: (key: string) => string | null,
  now: Date,
): ThemeState {
  const raw = get(THEME_STORAGE_KEY);
  const schedule = parseNightSchedule(get(NIGHT_SCHEDULE_KEY));
  const lightStyle = parseLightStyle(get(LIGHT_STYLE_KEY));
  // Before Ban đêm had a schedule, "night" was a stored theme. Keep it on until the next boundary.
  if (raw === "night")
    return {
      pref: "system",
      schedule,
      override: toggleNightOverride("light", schedule, now),
      migrated: true,
      lightStyle,
    };
  return {
    pref: parseThemePref(raw),
    schedule,
    override: parseNightOverride(get(NIGHT_OVERRIDE_KEY)),
    migrated: false,
    lightStyle,
  };
}
```

5. Trong chuỗi `THEME_INIT_SCRIPT`, sửa đúng hai chỗ, không đụng phần khác:
   - `var t="light";` thành `var t="rose";`
   - `hm=/^([01][0-9]|2[0-3]):(00|30)$/;` thành `hm=/^([01][0-9]|2[0-3]):(00|30)$/,st=ls.getItem("${LIGHT_STYLE_KEY}");if(day==="light")day=st==="white"?"light":st==="peach"||st==="lavender"||st==="sea"?st:"rose";`

   Sau khi sửa, đoạn đầu chuỗi phải đọc đúng như sau (phần sau `try{var rs=` giữ nguyên):

```text
export const THEME_INIT_SCRIPT = `(function(){var t="rose";try{var ls=localStorage,p=ls.getItem("${THEME_STORAGE_KEY}"),dk=window.matchMedia("(prefers-color-scheme: dark)").matches,day=p==="light"||p==="dark"?p:(dk?"dark":"light"),s={enabled:true,start:"21:00",end:"06:00"},hm=/^([01][0-9]|2[0-3]):(00|30)$/,st=ls.getItem("${LIGHT_STYLE_KEY}");if(day==="light")day=st==="white"?"light":st==="peach"||st==="lavender"||st==="sea"?st:"rose";try{var rs=
```

   `LIGHT_STYLE_KEY` khai báo ở đầu file, trước `THEME_INIT_SCRIPT`, nên template string dùng được. Comment phía trên script ("Mirrors readThemeState + resolveActiveTheme…") giữ nguyên.

- [ ] **Step 6: Sửa `lib/hooks/useTheme.ts`**

1. Đổi khối import từ `@/lib/theme` thành:

```ts
import {
  LIGHT_STYLE_KEY,
  NIGHT_OVERRIDE_KEY,
  NIGHT_SCHEDULE_KEY,
  readThemeState,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type LightStyle,
  type ThemePref,
} from "@/lib/theme";
```

và đổi `import type { ThemeName } from "@/lib/ui/tokens";` thành:

```ts
import { THEME_NAMES, type ThemeName } from "@/lib/ui/tokens";
```

2. Trong `applyTheme()`, thêm `lightStyle: state.lightStyle,` vào object truyền cho `resolveActiveTheme`, ngay sau `override: state.override,`.

3. Thay cả hàm `currentTheme()` bằng:

```ts
function currentTheme(): ThemeName {
  const value = document.documentElement.dataset.theme;
  return THEME_NAMES.find((name) => name === value) ?? "light";
}
```

4. Ngay sau hàm `useThemePref`, thêm:

```ts
// Spec §3.2: Cài đặt › Nền sáng. Unlike the theme choice, it leaves Ban đêm alone.
export function useLightStyle(): [LightStyle, (next: LightStyle) => void] {
  const [style, setStyle] = useState<LightStyle>(() =>
    typeof window === "undefined"
      ? "rose"
      : readThemeState(storageGet, new Date()).lightStyle,
  );
  function choose(next: LightStyle) {
    storageSet(LIGHT_STYLE_KEY, next);
    applyTheme();
    setStyle(next);
  }
  return [style, choose];
}
```

- [ ] **Step 7: Chạy test và typecheck**

Run: `bun run test lib/rules/theme.test.ts lib/theme.test.ts && bun run typecheck`
Expected: PASS. Mọi ca `THEME_INIT_SCRIPT`, cũ lẫn mới, đều khớp `resolveActiveTheme`; các ca "nothing stored, noon" giờ cùng ra `rose` ở cả hai phía. Typecheck không lỗi; ngoài test, `resolveActiveTheme` chỉ được gọi ở `applyTheme`.

- [ ] **Step 8: Commit**

```bash
git add lib/rules/theme.ts lib/rules/theme.test.ts lib/theme.ts lib/theme.test.ts lib/hooks/useTheme.ts
git commit -m "feat(theme): pick the soft light theme from be-yeu-light-style, Hồng dịu by default"
```

---

### Task 3: Hàng chấm "Nền sáng" trong Cài đặt, màu splash, checklist bước 30

**Files:**

- Modify: `components/settings/AppearanceGroup.tsx` (import, `AppearanceGroupView`, `AppearanceGroup`)
- Modify: `components/settings/appearance.test.tsx` (`base`, 1 test mới)
- Modify: `app/layout.tsx` (import, mục light của `themeColor`)
- Modify: `public/manifest.webmanifest` (`background_color`, `theme_color`), `lib/brand/manifest.test.ts` (test màu nền)
- Modify: `docs/device-checklist.md` (thêm bước 30 ở cuối file)

**Interfaces:**

- Consumes: `LIGHT_STYLE_OPTIONS`, `lightSwatch`, `LightStyle`, `useLightStyle` (Task 2); `THEMES.rose` (Task 1); `Swatch` (`components/ui/Swatch.tsx`, có sẵn: props `color`, `label`, `selected`, `onSelect`).
- Produces: `AppearanceGroupView({ pref, onPref, lightStyle, onLightStyle, schedule, onSchedule, onOpenHours })`.

- [ ] **Step 1: Viết test hỏng**

Trong `components/settings/appearance.test.tsx`:

1. Thêm `import { lightSwatch } from "@/lib/theme";` vào khối import đầu file. Thay `base` bằng:

```tsx
const base = {
  pref: "system" as const,
  onPref: () => {},
  lightStyle: "rose" as const,
  onLightStyle: () => {},
  schedule: DEFAULT_NIGHT_SCHEDULE,
  onSchedule: () => {},
  onOpenHours: () => {},
};
```

2. Thêm vào trong `describe("AppearanceGroupView", …)`:

```tsx
  it("has a Nền sáng row of five swatches right under the theme control", () => {
    const html = renderToStaticMarkup(<AppearanceGroupView {...base} />);
    expect(html).toContain(">Nền sáng</p>");
    expect(html).toContain('aria-label="Nền sáng"');
    for (const label of ["Trắng", "Hồng dịu", "Đào mơ", "Oải hương", "Biển sương"])
      expect(html).toContain(`>${label}</span>`);
    // No hex here: lib/themeGuard.test.ts scans every .tsx under components/, tests included.
    expect(html).toContain(lightSwatch("rose"));
    expect(html.indexOf('aria-label="Giao diện"')).toBeLessThan(
      html.indexOf('aria-label="Nền sáng"'),
    );
    expect(html.indexOf('aria-label="Nền sáng"')).toBeLessThan(
      html.indexOf(">Giờ ban đêm</span>"),
    );

    const onLightStyle = vi.fn();
    const swatches = findElements(
      AppearanceGroupView({ ...base, onLightStyle }),
      (el) => el.props.onSelect !== undefined,
    );
    expect(swatches.map((el) => el.props.label)).toEqual([
      "Trắng",
      "Hồng dịu",
      "Đào mơ",
      "Oải hương",
      "Biển sương",
    ]);
    expect(swatches.map((el) => el.props.selected)).toEqual([
      false,
      true,
      false,
      false,
      false,
    ]);
    (swatches[4].props.onSelect as () => void)();
    expect(onLightStyle).toHaveBeenCalledWith("sea");
  });
```

Test có sẵn `"changes theme and toggles the schedule"` lấy phần tử **đầu tiên** có prop `options`, tức là Segmented "Giao diện". `Swatch` không có prop `options`, nên test đó không phải sửa.

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/settings/appearance.test.tsx`
Expected: FAIL. Chưa có hàng "Nền sáng".

- [ ] **Step 3: Sửa `AppearanceGroup.tsx`**

1. Đổi import:

```tsx
import { useNightSchedule, useThemePref } from "@/lib/hooks/useTheme";
```

thành:

```tsx
import {
  useLightStyle,
  useNightSchedule,
  useThemePref,
} from "@/lib/hooks/useTheme";
```

và:

```tsx
import { THEME_OPTIONS } from "@/lib/theme";
```

thành:

```tsx
import {
  LIGHT_STYLE_OPTIONS,
  lightSwatch,
  THEME_OPTIONS,
  type LightStyle,
} from "@/lib/theme";
```

Thêm `import { Swatch } from "@/components/ui/Swatch";` ngay dưới dòng import `Switch`.

2. Trong `AppearanceGroupView`, thêm hai prop vào cả phần destructure lẫn phần type, ngay sau `onPref`:

```tsx
  lightStyle,
  onLightStyle,
```

```tsx
  lightStyle: LightStyle;
  onLightStyle: (next: LightStyle) => void;
```

3. Ngay sau Segmented "Giao diện" (khối `<Segmented label="Giao diện" … />`), thêm:

```text
      <p className="mx-4 pt-1 text-[13px] leading-[18px] font-semibold text-muted">
        Nền sáng
      </p>
      <div
        role="group"
        aria-label="Nền sáng"
        className="glass flex justify-between rounded-[22px] px-3 py-3"
      >
        {LIGHT_STYLE_OPTIONS.map((option) => (
          <Swatch
            key={option.value}
            color={lightSwatch(option.value)}
            label={option.label}
            selected={option.value === lightStyle}
            onSelect={() => onLightStyle(option.value)}
          />
        ))}
      </div>
```

4. Trong `AppearanceGroup()`:
   - thêm `const [lightStyle, setLightStyle] = useLightStyle();` ngay dưới dòng `useThemePref()`;
   - truyền `lightStyle={lightStyle}` và `onLightStyle={setLightStyle}` cho `AppearanceGroupView`, ngay sau `onPref={setPref}`.

- [ ] **Step 4: Màu splash và `theme-color` mặc định**

1. Trong `app/layout.tsx`, thêm import `import { THEMES } from "@/lib/ui/tokens";` dưới dòng import `THEME_INIT_SCRIPT`. Thay:

```tsx
    { media: "(prefers-color-scheme: light)", color: "#FBF3F0" },
```

bằng:

```tsx
    { media: "(prefers-color-scheme: light)", color: THEMES.rose.bg },
```

Mục dark `#0F0B12` giữ nguyên. Sau khi React chạy, `applyTheme()` vẫn ghi lại màu của theme đang bật lên mọi thẻ `theme-color`.

2. Trong `public/manifest.webmanifest`, thay:

```json
  "background_color": "#FBF3F0",
  "theme_color": "#FBF3F0",
```

bằng:

```json
  "background_color": "#E9DBDB",
  "theme_color": "#E9DBDB",
```

3. `lib/brand/manifest.test.ts` có test `"uses the light background colour"` đang chờ `#FBF3F0`; sau bước 2 nó sẽ đỏ. Thay cả test đó bằng:

```ts
  it("uses the Hồng dịu background colour", () => {
    expect(manifest.background_color).toBe("#E9DBDB");
    expect(manifest.theme_color).toBe("#E9DBDB");
  });
```

Số test không đổi vì đây là sửa test có sẵn.

- [ ] **Step 5: Chạy toàn bộ test và typecheck**

Run: `bun run test && bun run typecheck`
Expected: PASS hết, typecheck không lỗi. Số test:

- 682 (sau M2);
- Task 1: +88. `tokens.test` +4; `contrast.test` +80, vì `describe.each(THEME_NAMES)` chạy 14 token chữ, 5 cặp và 1 `switch-on` cho mỗi theme mới; cộng thêm 4 ca "no pure white".
- Task 2: +12. Luật +2, storage +2, script inline +7, first frame +1.
- Task 3: +1.

Tổng: 682 + 88 + 12 + 1 = **783 test**. Nếu tổng lệch, đếm lại theo số `it` thực tế. Không sửa test cho khớp số; điều cần là không test nào hỏng.

- [ ] **Step 6: Thêm bước 30 vào checklist**

Thêm vào cuối `docs/device-checklist.md`:

```markdown
## Bước 30 — Nền sáng dịu mắt, chip thuốc, popup giữa màn hình

1. Cập nhật app (đóng hẳn rồi mở lại). Kỳ vọng: nền Hồng dịu `#E9DBDB`, không có khối trắng tinh, không chớp trắng lúc mở.
2. Cài đặt › Giao diện › Nền sáng: bấm lần lượt Trắng, Đào mơ, Oải hương, Biển sương, rồi về lại Hồng dịu. Kỳ vọng: nền đổi ngay mỗi lần bấm, chữ đọc rõ; 21:00 Ban đêm vẫn tự bật.
3. "+" → "Thuốc", bấm DHA. Kỳ vọng: tên điền "DHA". Nếu đã từng ghi DHA thì lượng và đơn vị đúng như lần trước. Các nút đơn vị ml · mg · giọt · viên · gói · ống nằm trên một dòng.
4. Đang gõ tên thuốc (bàn phím đang mở) thì bấm X. Kỳ vọng: bàn phím tắt, hộp "Bỏ thay đổi?" hiện rõ giữa màn hình. Bấm "Tiếp tục nhập" thì chữ còn nguyên; bấm X lần nữa rồi "Bỏ thay đổi" thì sheet đóng.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 7: Kiểm trong Chrome (Claude in Chrome, mở tab mới)** (không bấm Lưu, không bắt đầu timer)

Chạy `bun run dev`, mở `http://localhost:3000` ở 375×812:

1. Chuẩn bị:
   - Xoá khoá `be-yeu-light-style` và `be-yeu-night-override` (DevTools › Application, hoặc `localStorage.removeItem(...)` qua javascript tool).
   - Tải lại khi giờ VN nằm ngoài 21:00–06:00, hoặc tắt "Ban đêm theo lịch" trước.
   - Kỳ vọng: `document.documentElement.dataset.theme === "rose"`.
2. Cài đặt › Nền sáng. Kỳ vọng:
   - 5 chấm chia đều một hàng, tên "Biển sương" không bị cắt;
   - chấm Hồng dịu có vòng chọn.
3. Bấm lần lượt Đào mơ, Oải hương, Biển sương, Trắng. Kỳ vọng: `dataset.theme` lần lượt là `peach`, `lavender`, `sea`, `light`. Ở mỗi theme, mở Trang chủ, Nhật ký, sheet "+", sheet "Thuốc" (chip M2) và popup "Bỏ thay đổi?" (M1):
   - không có khối trắng tinh (trừ Trắng);
   - chữ đọc rõ;
   - không tràn ngang.
4. Cài đặt › Giao diện › "Tối": theme `dark`, hàng chấm vẫn hiện. Về lại "Tự động".
5. Chọn Biển sương, rồi bấm mặt trăng ở Trang chủ: theme `night`. Bấm lại: về `sea`, không về `light`.
6. Về lại Hồng dịu, rồi tải lại trang: không thấy khung hình trắng nào trước nền hồng.

Ghi kết quả vào báo cáo cuối. iPhone thật thuộc bước 30, chờ người dùng.

- [ ] **Step 8: Commit**

```bash
git add components/settings/AppearanceGroup.tsx components/settings/appearance.test.tsx app/layout.tsx public/manifest.webmanifest lib/brand/manifest.test.ts docs/device-checklist.md
git commit -m "feat(settings): five light background swatches, Hồng dịu splash colour, checklist step 30"
```
