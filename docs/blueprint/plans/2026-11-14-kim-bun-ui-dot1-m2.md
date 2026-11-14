# Kim Bun UI — Đợt 1 / M2 (token 3 theme, kính, Icon, Backdrop) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-14

**Goal:** Đặt token màu Sáng / Tối / Ban đêm cùng lớp kính, in và tiêu điểm vào `app/globals.css`, kèm bảng token TypeScript có test tương phản, bộ icon SVG, bảng loại sự kiện và nền vệt màu `Backdrop`.

**Architecture:**

- `lib/rules/contrast.ts` tính tương phản WCAG; `lib/ui/tokens.ts` lặp lại giá trị token để test tương phản; `lib/ui/tokens.test.ts` so khớp với `app/globals.css`.
- Token cũ (`surface`, `soft`, `accent-soft`, …) được gán giá trị mới hoặc alias, nên màn hình cũ đổi màu mà không đổi bố cục.
- `components/ui/Icon.tsx` và `components/ui/Backdrop.tsx` là component đầu tiên của `components/ui/`; Vitest mở thêm `components/**/*.test.tsx` và render bằng `react-dom/server`.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, Vitest 5, Bun. Không thêm gói nào.

**Các mốc của Đợt 1 (spec §12):**

- **M1:** nhận diện Kim Bun — tên, logo, icon, manifest, service worker (spec §3.1–3.3). Wordmark (§3.4) chỉ dùng ở màn Đăng nhập và Cài app, nên làm cùng các màn đó ở Đợt 5.
- **M2:** token 3 theme, lớp kính, in, tiêu điểm, `Icon`, `Backdrop`, bảng loại sự kiện (spec §4.1–4.3, §4.5–4.8 phần CSS chung, §4.4 phần font; §5 phần `Backdrop`/`Icon`). Thang cỡ chữ §4.4 không thành token: component ở M4 và các đợt sau dùng class Tailwind có sẵn hoặc giá trị tùy ý (`text-[34px]/[41px]`) đúng bảng §4.4.
- **M3:** Ban đêm theo lịch và màu thanh trạng thái (spec §6.6, §6.7). Cần M2.
- **M4 (plan sau):** các component còn lại có cột "Đợt" = 1 ở spec §5: `Glass`, `Button`, `IconButton`, `Sheet`, `Segmented`, `ChipGroup`, `Switch`, `Swatch`, `ListGroup`/`ListRow`, `Toast`, `Skeleton`, `StatTile`. Cần M2.

Thứ tự làm: M1 → M2 → M3 → M4. M1 và M2 không phụ thuộc nhau.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- **Không tải font web.** Font chữ: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Noto Sans", sans-serif`. Font tròn: `ui-rounded, "SF Pro Rounded", -apple-system, sans-serif`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI (emoji cũ ở tab bar được thay ở Đợt 2).
- Chiều rộng thiết kế 375–440 pt.
- Logic nghiệp vụ là hàm thuần trong `lib/rules/`, có unit test.
- Mọi trang là client-rendered shell; không thêm middleware, không kiểm tra đăng nhập phía server.
- Route cũ phải còn chạy (không trả 404).
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong `.tsx` của `app/` và `components/`).
- Tương phản: mọi cặp chữ/nền ≥ 4.5:1 ở cả 3 theme (trên `--color-bg` và trên kính đã trộn với `--color-bg`); `--color-switch-on` ≥ 3:1 với `--color-bg`; theme Ban đêm không có `#FFFFFF` và không có màu hue 180–260.
- Không đổi các key `localStorage` đang có (`be-yeu-theme`, …), tên package `be-yeu`, tên cache service worker `be-yeu-…`, URL `bunkid.vercel.app`.
- Safari iOS 16.4 trở lên; vùng chạm ≥ 44×44 pt; tôn trọng `safe-area-inset-*`.
- Tôn trọng `prefers-reduced-motion: reduce` và `prefers-reduced-transparency: reduce`.
- Bản in `/bao-cao` vẫn đen trắng A4; khi in ẩn `Backdrop`, kính thành nền trắng không blur, không bóng.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).
- Bước checklist cần iPhone thật ghi "Chờ người dùng", không tự đánh "Đạt".

## Contracts with Other Plans

**Produces** (M3, M4 và Đợt 2–5 dùng, tên và kiểu cố định):

- Token CSS `--color-<tên>` cho mọi tên trong `TOKEN_NAMES` (Task 1) → class Tailwind `bg-<tên>`, `text-<tên>`, `border-<tên>` (ví dụ `bg-glass-solid`, `text-accent-text`, `bg-cat-feed`). Alias cũ: `surface`, `accent-soft`, `accent-ink`, `alarm`. `--font-sans`, `--font-rounded`.
- Utility CSS `glass`, `glass-strong` (Task 2); thuộc tính `data-backdrop` cho phần tử bị ẩn khi giảm trong suốt và khi in.
- `lib/ui/tokens.ts`: `THEME_NAMES`, `type ThemeName = "light" | "dark" | "night"`, `TOKEN_NAMES`, `type TokenName`, `THEMES: Record<ThemeName, Record<TokenName, string>>`, `ALIASES`, `STOOL_SWATCHES`, `GOOGLE_BUTTON`, `GOOGLE_G_COLORS`.
- `lib/rules/contrast.ts`: `parseColor`, `mixOver`, `contrastRatio(fg: string, bg: string): number`, `hue`.
- `lib/ui/icons.ts`: `ICON_PATHS`, `type IconName`. `components/ui/Icon.tsx`: `<Icon name size? strokeWidth? filled? className? />`.
- `lib/ui/categories.ts`: `type CategoryToken`, `CATEGORIES: Record<LogType, { token: CategoryToken; icon: IconName; label: string }>`.
- `components/ui/Backdrop.tsx`: `<Backdrop />` (đã gắn trong `Providers`).
- `vitest.config.ts` chạy cả `components/**/*.test.tsx`.

**Consumes:** không có (không phụ thuộc M1).

---

### Task 1: Hàm tương phản và bảng token TypeScript

**Files:**

- Create: `lib/rules/contrast.ts`, `lib/rules/contrast.test.ts`, `lib/ui/tokens.ts`, `lib/ui/contrast.test.ts`

**Interfaces:**

- Consumes: không.
- Produces:
  - `parseColor(color: string): { r: number; g: number; b: number; a: number }` — nhận `#RRGGBB` và `rgb(R G B / A)`; màu khác ném `Error`.
  - `mixOver(fg: string, bg: string): string` — trả `#rrggbb` chữ thường.
  - `contrastRatio(fg: string, bg: string): number` — tự trộn `fg` có alpha lên `bg`.
  - `hue(color: string): number | null` — độ 0–360, `null` khi xám.
  - `THEME_NAMES`, `ThemeName`, `TOKEN_NAMES`, `TokenName`, `THEMES`, `ALIASES`, `STOOL_SWATCHES`, `GOOGLE_BUTTON`, `GOOGLE_G_COLORS` (giá trị ở Step 5).

- [ ] **Step 1: Viết test hỏng cho `contrast.ts`**

`lib/rules/contrast.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, hue, mixOver, parseColor } from "./contrast";

describe("contrast", () => {
  it("parses hex and space-separated rgb with alpha", () => {
    expect(parseColor("#FBF3F0")).toEqual({ r: 251, g: 243, b: 240, a: 1 });
    expect(parseColor("rgb(255 255 255 / 0.55)")).toEqual({
      r: 255,
      g: 255,
      b: 255,
      a: 0.55,
    });
    expect(parseColor("rgb(43 27 34)")).toEqual({ r: 43, g: 27, b: 34, a: 1 });
    expect(() => parseColor("oklch(50% 0.1 20)")).toThrow();
  });

  it("mixes a translucent colour over a background", () => {
    expect(mixOver("rgb(255 255 255 / 0.55)", "#FBF3F0")).toBe("#fdfaf8");
    expect(mixOver("#123456", "#FFFFFF")).toBe("#123456");
  });

  it("matches known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#FFFFFF", "#767676")).toBeCloseTo(4.54, 2);
  });

  it("finds the hue, or null for greys", () => {
    expect(hue("#FF0000")).toBeCloseTo(0, 5);
    expect(hue("#0000FF")).toBeCloseTo(240, 5);
    expect(hue("#00FFFF")).toBeCloseTo(180, 5);
    expect(hue("#808080")).toBeNull();
    expect(hue("rgb(0 0 0 / 0.55)")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/rules/contrast.test.ts`
Expected: FAIL — `Failed to resolve import "./contrast"`.

- [ ] **Step 3: Viết `lib/rules/contrast.ts`**

```ts
export type Rgba = { r: number; g: number; b: number; a: number };

const HEX = /^#([0-9a-f]{6})$/i;
const RGB =
  /^rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*(?:\/\s*([0-9.]+)\s*)?\)$/i;

export function parseColor(color: string): Rgba {
  const hex = HEX.exec(color.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const rgb = RGB.exec(color.trim());
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] === undefined ? 1 : Number(rgb[4]),
    };
  }
  throw new Error(`Unsupported colour: ${color}`);
}

function toHex({ r, g, b }: Rgba): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

export function mixOver(fg: string, bg: string): string {
  const f = parseColor(fg);
  const b = parseColor(bg);
  return toHex({
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
    a: 1,
  });
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
  const { r, g, b } = parseColor(color);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const solidFg = parseColor(fg).a < 1 ? mixOver(fg, bg) : fg;
  const a = luminance(solidFg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function hue(color: string): number | null {
  const { r, g, b } = parseColor(color);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return null;
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/rules/contrast.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Viết `lib/ui/tokens.ts`**

```ts
export const THEME_NAMES = ["light", "dark", "night"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export const TOKEN_NAMES = [
  "bg",
  "blob-1",
  "blob-2",
  "blob-3",
  "ink",
  "muted",
  "glass",
  "glass-strong",
  "glass-solid",
  "edge",
  "line",
  "scrim",
  "accent",
  "on-accent",
  "accent-text",
  "accent-tint",
  "good",
  "warn",
  "danger",
  "danger-solid",
  "on-danger",
  "switch-on",
  "soft",
  "accent-line",
  "danger-soft",
  "danger-ink",
  "warn-soft",
  "warn-ink",
  "good-soft",
  "good-ink",
  "cat-feed",
  "cat-bottle",
  "cat-sleep",
  "cat-diaper",
  "cat-pump",
  "cat-tummy",
  "cat-med",
  "cat-temp",
] as const;
export type TokenName = (typeof TOKEN_NAMES)[number];

// Legacy token names kept so screens not yet redesigned still render. Value: the token each one points at.
export const ALIASES = {
  surface: "bg",
  "accent-soft": "accent-tint",
  "accent-ink": "accent-text",
  alarm: "danger-solid",
} as const satisfies Record<string, TokenName>;

export const THEMES: Record<ThemeName, Record<TokenName, string>> = {
  light: {
    bg: "#FBF3F0",
    "blob-1": "#FFC2A6",
    "blob-2": "#D9C9FF",
    "blob-3": "#FFB8CB",
    ink: "#2B1B22",
    muted: "#6E5560",
    glass: "rgb(255 255 255 / 0.55)",
    "glass-strong": "rgb(255 255 255 / 0.82)",
    "glass-solid": "#FFFFFF",
    edge: "rgb(255 255 255 / 0.85)",
    line: "rgb(43 27 34 / 0.07)",
    scrim: "rgb(43 27 34 / 0.22)",
    accent: "#B8285E",
    "on-accent": "#FFFFFF",
    "accent-text": "#B8285E",
    "accent-tint": "rgb(184 40 94 / 0.12)",
    good: "#1F7A3A",
    warn: "#955700",
    danger: "#C4142B",
    "danger-solid": "#C4142B",
    "on-danger": "#FFFFFF",
    "switch-on": "#1F7A3A",
    soft: "#F3E8E4",
    "accent-line": "#E9B9CB",
    "danger-soft": "#FCE4E2",
    "danger-ink": "#8A0F1F",
    "warn-soft": "#FCEBD0",
    "warn-ink": "#7A4300",
    "good-soft": "#DDF1E3",
    "good-ink": "#1A5A30",
    "cat-feed": "#C2185B",
    "cat-bottle": "#B0365D",
    "cat-sleep": "#5B4BC4",
    "cat-diaper": "#955700",
    "cat-pump": "#8E3FC4",
    "cat-tummy": "#2E7D46",
    "cat-med": "#C0392B",
    "cat-temp": "#1B6F87",
  },
  dark: {
    bg: "#0F0B12",
    "blob-1": "#6B2E46",
    "blob-2": "#33295C",
    "blob-3": "#5A1F38",
    ink: "#F5EEF2",
    muted: "#B8A9B1",
    glass: "rgb(255 255 255 / 0.08)",
    "glass-strong": "rgb(36 26 34 / 0.82)",
    "glass-solid": "#221F25",
    edge: "rgb(255 255 255 / 0.14)",
    line: "rgb(255 255 255 / 0.08)",
    scrim: "rgb(0 0 0 / 0.45)",
    accent: "#FF7AA8",
    "on-accent": "#2B0A17",
    "accent-text": "#FF9EBF",
    "accent-tint": "rgb(255 122 168 / 0.18)",
    good: "#8FDDA0",
    warn: "#FFC56B",
    danger: "#FF8A7A",
    "danger-solid": "#B3261E",
    "on-danger": "#FFFFFF",
    "switch-on": "#30D158",
    soft: "#221F25",
    "accent-line": "#5A2340",
    "danger-soft": "#3A1515",
    "danger-ink": "#FFD4CF",
    "warn-soft": "#3A2A10",
    "warn-ink": "#FFE2A8",
    "good-soft": "#0F2A1A",
    "good-ink": "#BFF0CB",
    "cat-feed": "#FF7AA8",
    "cat-bottle": "#FFA3B8",
    "cat-sleep": "#A99BFF",
    "cat-diaper": "#FFC56B",
    "cat-pump": "#D6A6FF",
    "cat-tummy": "#8FDDA0",
    "cat-med": "#FF8A7A",
    "cat-temp": "#7FD4EA",
  },
  night: {
    bg: "#0A0705",
    "blob-1": "#3A170A",
    "blob-2": "#2B1407",
    "blob-3": "#2B1407",
    ink: "#D9895C",
    muted: "#B5734F",
    glass: "rgb(217 137 92 / 0.06)",
    "glass-strong": "rgb(22 15 10 / 0.9)",
    "glass-solid": "#160F0A",
    edge: "rgb(217 137 92 / 0.16)",
    line: "rgb(217 137 92 / 0.1)",
    scrim: "rgb(0 0 0 / 0.55)",
    accent: "#6B2A12",
    "on-accent": "#F4A070",
    "accent-text": "#F4A070",
    "accent-tint": "rgb(107 42 18 / 0.6)",
    good: "#D9895C",
    warn: "#D9895C",
    danger: "#E0704A",
    "danger-solid": "#4A140A",
    "on-danger": "#E0704A",
    "switch-on": "#C06A34",
    soft: "#160F0A",
    "accent-line": "#4A1D0E",
    "danger-soft": "#2A0D07",
    "danger-ink": "#E0704A",
    "warn-soft": "#23140A",
    "warn-ink": "#D9895C",
    "good-soft": "#17140A",
    "good-ink": "#D9895C",
    "cat-feed": "#D9895C",
    "cat-bottle": "#D9895C",
    "cat-sleep": "#D9895C",
    "cat-diaper": "#D9895C",
    "cat-pump": "#D9895C",
    "cat-tummy": "#D9895C",
    "cat-med": "#D9895C",
    "cat-temp": "#D9895C",
  },
};

// Real stool colours (spec §4.2): the same in every theme.
export const STOOL_SWATCHES = {
  yellow: "#E2B33C",
  green: "#7C9A3A",
  brown: "#8A5A33",
  black: "#26221F",
  pale: "#EFEBE0",
  red: "#B3261E",
} as const;

// Google sign-in button colours (spec §9). Ban đêm uses theme tokens instead.
export const GOOGLE_BUTTON = {
  light: { bg: "#FFFFFF", border: "#747775", text: "#1F1F1F" },
  dark: { bg: "#131314", border: "#8E918F", text: "#E3E3E3" },
} as const;

export const GOOGLE_G_COLORS = {
  blue: "#4285F4",
  green: "#34A853",
  yellow: "#FBBC05",
  red: "#EA4335",
} as const;
```

- [ ] **Step 6: Viết test tương phản cho bảng token**

`lib/ui/contrast.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, hue, mixOver } from "@/lib/rules/contrast";
import { THEME_NAMES, THEMES, TOKEN_NAMES, type TokenName } from "./tokens";

const TEXT: TokenName[] = [
  "ink",
  "muted",
  "accent-text",
  "good",
  "warn",
  "danger",
  "cat-feed",
  "cat-bottle",
  "cat-sleep",
  "cat-diaper",
  "cat-pump",
  "cat-tummy",
  "cat-med",
  "cat-temp",
];
const PAIRS: [TokenName, TokenName][] = [
  ["on-accent", "accent"],
  ["on-danger", "danger-solid"],
  ["danger-ink", "danger-soft"],
  ["warn-ink", "warn-soft"],
  ["good-ink", "good-soft"],
  ["ink", "soft"],
  ["muted", "soft"],
];

describe.each(THEME_NAMES)("theme %s", (name) => {
  const t = THEMES[name];
  const glassOverBg = mixOver(t.glass, t.bg);

  it.each(TEXT)("%s reads at ≥ 4.5:1 on the page and on glass", (token) => {
    expect(contrastRatio(t[token], t.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t[token], glassOverBg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(PAIRS)("%s on %s reads at ≥ 4.5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("the switch's on colour stands out from the page at ≥ 3:1", () => {
    expect(contrastRatio(t["switch-on"], t.bg)).toBeGreaterThanOrEqual(3);
  });
});

describe("Ban đêm", () => {
  it("has no pure white and no blue or cyan anywhere", () => {
    for (const token of TOKEN_NAMES) {
      const value = THEMES.night[token];
      expect(value.toUpperCase()).not.toBe("#FFFFFF");
      const h = hue(value);
      if (h !== null)
        expect(h < 180 || h > 260, `${token} ${value} hue ${h}`).toBe(true);
    }
  });
});
```

- [ ] **Step 7: Chạy test để thấy xanh**

Run: `bun run test lib/rules/contrast.test.ts lib/ui/contrast.test.ts`
Expected: PASS. Nếu một cặp hỏng, đừng hạ ngưỡng: đối chiếu lại giá trị với spec §4.1–4.2 (giá trị trong spec đã được tính là đạt).

- [ ] **Step 8: Commit**

```bash
git add lib/rules/contrast.ts lib/rules/contrast.test.ts lib/ui/tokens.ts lib/ui/contrast.test.ts
git commit -m "feat(ui): theme token table with WCAG contrast checks"
```

---

### Task 2: Token CSS 3 theme, kính, in, tiêu điểm

**Files:**

- Modify: `app/globals.css` (viết lại toàn bộ)
- Create: `lib/ui/tokens.test.ts`

**Interfaces:**

- Consumes: `THEMES`, `TOKEN_NAMES`, `ALIASES` (Task 1).
- Produces: biến `--color-<token>` ở `@theme` (Sáng), `:root[data-theme="dark"]`, `:root[data-theme="night"]`; alias `--color-surface`, `--color-accent-soft`, `--color-accent-ink`, `--color-alarm`; `--font-sans`, `--font-rounded`; utility `glass`, `glass-strong`; `[data-backdrop]` ẩn khi giảm trong suốt và khi in.

- [ ] **Step 1: Viết test hỏng so khớp CSS với bảng token**

`lib/ui/tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ALIASES, THEME_NAMES, THEMES, TOKEN_NAMES } from "./tokens";

const css = readFileSync("app/globals.css", "utf8");

const OPENERS = {
  light: "@theme {",
  dark: ':root[data-theme="dark"] {',
  night: ':root[data-theme="night"] {',
} as const;

function block(opener: string): Record<string, string> {
  const start = css.indexOf(opener);
  if (start < 0) throw new Error(`missing block ${opener}`);
  const body = css.slice(start + opener.length, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const m of body.matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;]+);/g))
    vars[m[1]] = m[2].trim().replace(/\s+/g, " ");
  return vars;
}

describe("globals.css matches lib/ui/tokens.ts", () => {
  it.each(THEME_NAMES)(
    "%s block declares every token with the same value",
    (name) => {
      const vars = block(OPENERS[name]);
      for (const token of TOKEN_NAMES)
        expect(vars[token]?.toUpperCase(), `--color-${token}`).toBe(
          THEMES[name][token].toUpperCase(),
        );
    },
  );

  it("the light block declares the legacy aliases", () => {
    const vars = block(OPENERS.light);
    for (const [alias, target] of Object.entries(ALIASES))
      expect(vars[alias], `--color-${alias}`).toBe(`var(--color-${target})`);
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/tokens.test.ts`
Expected: FAIL — `--color-bg: expected undefined to be '#FBF3F0'`.

- [ ] **Step 3: Viết lại `app/globals.css`**

Nội dung đầy đủ:

```css
@import "tailwindcss";

@theme {
  --font-sans:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto,
    "Noto Sans", sans-serif;
  --font-rounded: ui-rounded, "SF Pro Rounded", -apple-system, sans-serif;

  --color-bg: #fbf3f0;
  --color-blob-1: #ffc2a6;
  --color-blob-2: #d9c9ff;
  --color-blob-3: #ffb8cb;
  --color-ink: #2b1b22;
  --color-muted: #6e5560;
  --color-glass: rgb(255 255 255 / 0.55);
  --color-glass-strong: rgb(255 255 255 / 0.82);
  --color-glass-solid: #ffffff;
  --color-edge: rgb(255 255 255 / 0.85);
  --color-line: rgb(43 27 34 / 0.07);
  --color-scrim: rgb(43 27 34 / 0.22);
  --color-accent: #b8285e;
  --color-on-accent: #ffffff;
  --color-accent-text: #b8285e;
  --color-accent-tint: rgb(184 40 94 / 0.12);
  --color-good: #1f7a3a;
  --color-warn: #955700;
  --color-danger: #c4142b;
  --color-danger-solid: #c4142b;
  --color-on-danger: #ffffff;
  --color-switch-on: #1f7a3a;
  --color-soft: #f3e8e4;
  --color-accent-line: #e9b9cb;
  --color-danger-soft: #fce4e2;
  --color-danger-ink: #8a0f1f;
  --color-warn-soft: #fcebd0;
  --color-warn-ink: #7a4300;
  --color-good-soft: #ddf1e3;
  --color-good-ink: #1a5a30;
  --color-cat-feed: #c2185b;
  --color-cat-bottle: #b0365d;
  --color-cat-sleep: #5b4bc4;
  --color-cat-diaper: #955700;
  --color-cat-pump: #8e3fc4;
  --color-cat-tummy: #2e7d46;
  --color-cat-med: #c0392b;
  --color-cat-temp: #1b6f87;

  --color-surface: var(--color-bg);
  --color-accent-soft: var(--color-accent-tint);
  --color-accent-ink: var(--color-accent-text);
  --color-alarm: var(--color-danger-solid);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --color-bg: #0f0b12;
  --color-blob-1: #6b2e46;
  --color-blob-2: #33295c;
  --color-blob-3: #5a1f38;
  --color-ink: #f5eef2;
  --color-muted: #b8a9b1;
  --color-glass: rgb(255 255 255 / 0.08);
  --color-glass-strong: rgb(36 26 34 / 0.82);
  --color-glass-solid: #221f25;
  --color-edge: rgb(255 255 255 / 0.14);
  --color-line: rgb(255 255 255 / 0.08);
  --color-scrim: rgb(0 0 0 / 0.45);
  --color-accent: #ff7aa8;
  --color-on-accent: #2b0a17;
  --color-accent-text: #ff9ebf;
  --color-accent-tint: rgb(255 122 168 / 0.18);
  --color-good: #8fdda0;
  --color-warn: #ffc56b;
  --color-danger: #ff8a7a;
  --color-danger-solid: #b3261e;
  --color-on-danger: #ffffff;
  --color-switch-on: #30d158;
  --color-soft: #221f25;
  --color-accent-line: #5a2340;
  --color-danger-soft: #3a1515;
  --color-danger-ink: #ffd4cf;
  --color-warn-soft: #3a2a10;
  --color-warn-ink: #ffe2a8;
  --color-good-soft: #0f2a1a;
  --color-good-ink: #bff0cb;
  --color-cat-feed: #ff7aa8;
  --color-cat-bottle: #ffa3b8;
  --color-cat-sleep: #a99bff;
  --color-cat-diaper: #ffc56b;
  --color-cat-pump: #d6a6ff;
  --color-cat-tummy: #8fdda0;
  --color-cat-med: #ff8a7a;
  --color-cat-temp: #7fd4ea;
}

:root[data-theme="night"] {
  color-scheme: dark;
  --color-bg: #0a0705;
  --color-blob-1: #3a170a;
  --color-blob-2: #2b1407;
  --color-blob-3: #2b1407;
  --color-ink: #d9895c;
  --color-muted: #b5734f;
  --color-glass: rgb(217 137 92 / 0.06);
  --color-glass-strong: rgb(22 15 10 / 0.9);
  --color-glass-solid: #160f0a;
  --color-edge: rgb(217 137 92 / 0.16);
  --color-line: rgb(217 137 92 / 0.1);
  --color-scrim: rgb(0 0 0 / 0.55);
  --color-accent: #6b2a12;
  --color-on-accent: #f4a070;
  --color-accent-text: #f4a070;
  --color-accent-tint: rgb(107 42 18 / 0.6);
  --color-good: #d9895c;
  --color-warn: #d9895c;
  --color-danger: #e0704a;
  --color-danger-solid: #4a140a;
  --color-on-danger: #e0704a;
  --color-switch-on: #c06a34;
  --color-soft: #160f0a;
  --color-accent-line: #4a1d0e;
  --color-danger-soft: #2a0d07;
  --color-danger-ink: #e0704a;
  --color-warn-soft: #23140a;
  --color-warn-ink: #d9895c;
  --color-good-soft: #17140a;
  --color-good-ink: #d9895c;
  --color-cat-feed: #d9895c;
  --color-cat-bottle: #d9895c;
  --color-cat-sleep: #d9895c;
  --color-cat-diaper: #d9895c;
  --color-cat-pump: #d9895c;
  --color-cat-tummy: #d9895c;
  --color-cat-med: #d9895c;
  --color-cat-temp: #d9895c;
}

@layer base {
  *,
  ::before,
  ::after {
    border-color: var(--color-line);
  }
  :where(input, select, textarea) {
    border-color: color-mix(in srgb, var(--color-muted) 45%, transparent);
  }
  html {
    -webkit-text-size-adjust: 100%;
  }
  body {
    background: var(--color-bg);
    color: var(--color-ink);
    padding: env(safe-area-inset-top) env(safe-area-inset-right)
      env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
  :focus-visible {
    outline: 2px solid var(--color-accent-text);
    outline-offset: 2px;
  }
  input[type="checkbox"],
  input[type="radio"] {
    accent-color: var(--color-accent);
  }
}

@utility glass {
  background: var(--color-glass);
  border: 1px solid var(--color-edge);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  backdrop-filter: blur(24px) saturate(180%);
}

@utility glass-strong {
  background: var(--color-glass-strong);
  border: 1px solid var(--color-edge);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  backdrop-filter: blur(40px) saturate(180%);
}

@supports not (
  (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
) {
  .glass,
  .glass-strong {
    background: var(--color-glass-solid);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass,
  .glass-strong {
    background: var(--color-glass-solid);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  [data-backdrop] {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Spec §6.15 (spec gốc): the doctor report prints on A4 portrait, black on white whatever the theme. */
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }
  :root,
  :root[data-theme] {
    color-scheme: light;
    --color-bg: #ffffff;
    --color-ink: #000000;
    --color-muted: #444444;
  }
  body {
    background: #ffffff;
  }
  [data-backdrop] {
    display: none !important;
  }
  .glass,
  .glass-strong {
    background: #ffffff !important;
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    box-shadow: none !important;
  }
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test lib/ui/tokens.test.ts lib/themeGuard.test.ts`
Expected: PASS cả hai.

- [ ] **Step 5: Kiểm build CSS và nhìn qua trên máy**

Run: `bun run build`
Expected: build xong, không có cảnh báo `Unknown utility` hay lỗi CSS.

Run: `bun run dev`, mở `http://localhost:3000` ở bề rộng 375 px, đăng nhập. Kỳ vọng: nền trang hồng đào nhạt `#FBF3F0`, viền danh sách mảnh màu xám hồng (không còn viền đen); đổi Cài đặt → Giao diện → Tối thì viền mờ (không còn viền trắng). Tắt dev server.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css lib/ui/tokens.test.ts
git commit -m "feat(ui): Liquid Glass tokens for light, dark and night themes"
```

---

### Task 3: Icon, bảng loại sự kiện, Backdrop

**Files:**

- Create: `lib/ui/icons.ts`, `lib/ui/categories.ts`, `lib/ui/categories.test.ts`, `components/ui/Icon.tsx`, `components/ui/Backdrop.tsx`, `components/ui/ui.test.tsx`
- Modify: `vitest.config.ts:7-8`, `components/Providers.tsx`

**Interfaces:**

- Consumes: `TOKEN_NAMES`, `TokenName` (Task 1); `LOG_TYPES`, `LogType` từ `lib/rules/logDetails.ts` (đã có).
- Produces:
  - `ICON_PATHS` (object `as const`, đúng 37 khóa ở Step 3), `type IconName = keyof typeof ICON_PATHS`
  - `type CategoryToken = Extract<TokenName, \`cat-${string}\`>`
  - `CATEGORIES: Record<LogType, { token: CategoryToken; icon: IconName; label: string }>`
  - `<Icon name: IconName; size?: number = 22; strokeWidth?: number = 2; filled?: boolean = false; className?: string />`
  - `<Backdrop />` (có `data-backdrop`, `aria-hidden`), gắn trong `Providers`.

- [ ] **Step 1: Cho Vitest chạy test `.tsx` trong `components/`**

Sửa `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: [
      "lib/**/*.test.ts",
      "scripts/**/*.test.ts",
      "components/**/*.test.tsx",
    ],
  },
});
```

- [ ] **Step 2: Viết test hỏng**

`lib/ui/categories.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LOG_TYPES } from "@/lib/rules/logDetails";
import { CATEGORIES } from "./categories";
import { ICON_PATHS } from "./icons";
import { TOKEN_NAMES } from "./tokens";

describe("log categories", () => {
  it("covers every log type", () => {
    expect(Object.keys(CATEGORIES).sort()).toEqual([...LOG_TYPES].sort());
  });

  it("uses the spec's token, icon and label for each type", () => {
    expect(CATEGORIES).toEqual({
      breast: { token: "cat-feed", icon: "heart", label: "Bú mẹ" },
      bottle: { token: "cat-bottle", icon: "bottle", label: "Bú bình" },
      sleep: { token: "cat-sleep", icon: "moon", label: "Ngủ" },
      diaper: { token: "cat-diaper", icon: "drop", label: "Thay tã" },
      pump: { token: "cat-pump", icon: "cup", label: "Hút sữa" },
      tummy: { token: "cat-tummy", icon: "smile", label: "Nằm sấp" },
      medicine: { token: "cat-med", icon: "pill", label: "Thuốc" },
      temperature: { token: "cat-temp", icon: "thermo", label: "Nhiệt độ" },
    });
  });

  it("every token and icon exists", () => {
    for (const { token, icon } of Object.values(CATEGORIES)) {
      expect(TOKEN_NAMES).toContain(token);
      expect(ICON_PATHS[icon]).toBeTruthy();
    }
  });
});

describe("icon paths", () => {
  it("has the 37 icons the spec lists, each a non-empty path", () => {
    expect(Object.keys(ICON_PATHS)).toHaveLength(37);
    for (const d of Object.values(ICON_PATHS)) expect(d).toMatch(/^[Mm]/);
  });
});
```

`components/ui/ui.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { Backdrop } from "./Backdrop";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("draws the named path as a decorative outline", () => {
    const html = renderToStaticMarkup(<Icon name="heart" />);
    expect(html).toContain(`d="${ICON_PATHS.heart}"`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('fill="none"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('width="22"');
    expect(html).toContain('stroke-width="2"');
  });

  it("fills solid icons and takes a size", () => {
    const html = renderToStaticMarkup(
      <Icon name="stop" filled size={18} className="x" />,
    );
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('width="18"');
    expect(html).toContain('class="x"');
  });
});

describe("Backdrop", () => {
  it("is one hidden layer with three colour blobs", () => {
    const html = renderToStaticMarkup(<Backdrop />);
    expect(html).toContain("data-backdrop");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("bg-blob-1");
    expect(html).toContain("bg-blob-2");
    expect(html).toContain("bg-blob-3");
    expect(html).toContain("print:hidden");
  });
});
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/categories.test.ts components/ui/ui.test.tsx`
Expected: FAIL — `Failed to resolve import "./categories"` và `"./Backdrop"`.

- [ ] **Step 4: Viết `lib/ui/icons.ts`**

```ts
// 24×24 stroke icons (spec §4.6). `stop` and `play` are meant to be drawn filled.
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

export type IconName = keyof typeof ICON_PATHS;
```

Đếm: 37 khóa. Test Step 2 dựa vào con số này.

- [ ] **Step 5: Viết `lib/ui/categories.ts`**

```ts
import type { LogType } from "@/lib/rules/logDetails";
import type { IconName } from "./icons";
import type { TokenName } from "./tokens";

export type CategoryToken = Extract<TokenName, `cat-${string}`>;

export const CATEGORIES: Record<
  LogType,
  { token: CategoryToken; icon: IconName; label: string }
> = {
  breast: { token: "cat-feed", icon: "heart", label: "Bú mẹ" },
  bottle: { token: "cat-bottle", icon: "bottle", label: "Bú bình" },
  sleep: { token: "cat-sleep", icon: "moon", label: "Ngủ" },
  diaper: { token: "cat-diaper", icon: "drop", label: "Thay tã" },
  pump: { token: "cat-pump", icon: "cup", label: "Hút sữa" },
  tummy: { token: "cat-tummy", icon: "smile", label: "Nằm sấp" },
  medicine: { token: "cat-med", icon: "pill", label: "Thuốc" },
  temperature: { token: "cat-temp", icon: "thermo", label: "Nhiệt độ" },
};
```

- [ ] **Step 6: Viết `components/ui/Icon.tsx`**

```tsx
import { ICON_PATHS, type IconName } from "@/lib/ui/icons";

export function Icon({
  name,
  size = 22,
  strokeWidth = 2,
  filled = false,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
```

- [ ] **Step 7: Viết `components/ui/Backdrop.tsx`**

```tsx
// Soft colour blobs behind the glass (spec §4.3). Hidden when printing or with reduced transparency.
export function Backdrop() {
  return (
    <div
      data-backdrop
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-1 overflow-hidden print:hidden"
    >
      <div className="absolute -top-[60px] -left-[90px] size-[300px] rounded-full bg-blob-1 opacity-80 blur-[72px]" />
      <div className="absolute top-[260px] -right-[110px] size-[320px] rounded-full bg-blob-2 opacity-80 blur-[72px]" />
      <div className="absolute top-[720px] -left-[60px] size-[340px] rounded-full bg-blob-3 opacity-80 blur-[72px]" />
    </div>
  );
}
```

- [ ] **Step 8: Gắn `Backdrop` vào `components/Providers.tsx`**

Thêm import:

```ts
import { Backdrop } from "@/components/ui/Backdrop";
```

Trong JSX trả về, ngay trước `<OutboxSync />` thêm `<Backdrop />`:

```tsx
      <Backdrop />
      <OutboxSync />
      {children}
```

- [ ] **Step 9: Chạy test để thấy xanh**

Run: `bun run test lib/ui components/ui lib/themeGuard.test.ts`
Expected: PASS (categories 3, icons 1, Icon 2, Backdrop 1, themeGuard 1).

- [ ] **Step 10: Chạy toàn bộ và build**

Run: `bun run test && bun run typecheck && bun run build`
Expected: mọi test PASS, typecheck không lỗi, build xong.

- [ ] **Step 11: Kiểm trên trình duyệt**

Run: `bun run dev`, mở `http://localhost:3000` (375 px), đăng nhập.
Expected: sau nền trang có 3 vệt màu loang (đào góc trên trái, tím bên phải, hồng phía dưới), nội dung vẫn đọc rõ; ở Tối vệt màu mận/tím than; ở Ban đêm vệt nâu đỏ rất tối. Trình duyệt bật giảm trong suốt (Chrome DevTools → Rendering → `prefers-reduced-transparency: reduce`) thì vệt biến mất. In thử `/bao-cao` (Cmd+P): không có vệt màu. Tắt dev server.

- [ ] **Step 12: Commit**

```bash
git add vitest.config.ts lib/ui components/ui components/Providers.tsx
git commit -m "feat(ui): icon set, log categories and glass backdrop"
```

---

## Kết thúc M2

- [ ] Chạy lần cuối: `bun run test && bun run typecheck && bun run build`. Expected: xanh, build xong.
