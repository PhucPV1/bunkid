# Kim Bun UI — Đợt 5 / M5 (Đăng nhập, Chưa được mời, Khai báo bé, màn chờ) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm lại các màn đầu vào app theo spec §3.4, §9 và §10:

- **Đăng nhập:** logo 96, wordmark 34, câu "Nhật ký chăm bé của cả nhà", nút "Đăng nhập bằng Google" theo mẫu của Google, màu lấy từ `GOOGLE_BUTTON`. Ở theme Ban đêm nút là kính và logo G một màu.
- **Chưa được mời** và **Khai báo bé:** thẻ kính trên `Backdrop`, form dùng component ui.
- **Màn chờ và màn lỗi tải của `AuthGate`:** `Skeleton` đúng hình khối và `ErrorCard` thay "Đang tải…" và câu lỗi trơn.

**Architecture:**

- Hai component mới:
  - `components/brand/BrandMark.tsx`: logo `/icons/icon.svg` kèm wordmark font tròn, cỡ `lg` 96/34 hoặc `md` 64/28.
  - `components/auth/GoogleButton.tsx`: màu Sáng / Tối lấy từ `GOOGLE_BUTTON`, đặt qua biến CSS; logo G 4 màu từ `GOOGLE_G_COLORS`. Theme Ban đêm đổi sang nền kính, chữ và logo G dùng `--color-ink`, chỉ bằng class `in-data-[theme=night]:`, không cần JavaScript. Phần đè biến màu G đặt trên thẻ `<svg>`, vì biến gốc nằm trong `style` của nút và `style` inline thắng mọi class trên chính nút.
- `AuthGate` export thêm `GateLoading` và `GateError` (view không hook) để test.
- `LoginScreen`, `NotInvited`, `BabyForm`, trang `/khai-bao-be` giữ nguyên dữ liệu và luật: `signInWithOAuth`, `can_create_family`, `create_family`, `parseBabyForm`, `createBaby`, `updateBaby`, `onCreated`.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 5** (M5 cũ tách đôi vì quá dài cho một plan; dọn dẹp cuối thành M7):

| Mốc               | Nội dung                                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1–M4             | Nhật ký, Thống kê, Tăng trưởng, Tiêm chủng, Phát triển, Khẩn cấp, Triệu chứng, Bệnh thường gặp, Bồng bế, Nhạc, Ồn trắng, Ảnh, Báo cáo — đã xong trên nhánh `feat/kim-bun-dot5-m4` |
| **M5 (plan này)** | Đăng nhập, Chưa được mời, Khai báo bé (`BabyForm`), màn chờ / lỗi của `AuthGate`                                                                                                  |
| M6                | Bên trong 3 trang con Cài đặt (Hồ sơ bé, Thành viên, Cữ bú; bỏ tiêu đề lặp), Offline, Cài app (logo 64 + wordmark 28)                                                             |
| M7                | Trang chủ đang tải / lỗi, dòng đồng bộ dưới header, nhãn bị xuống dòng, ô chọn ảnh tiếng Anh, thanh dung lượng ở Ban đêm, xóa token cũ, checklist cuối (§11.2 bước 7, 8)          |

**Quyết định cho chỗ spec chưa nói rõ:**

- **Logo** là thẻ `<img src="/icons/icon.svg">` (file đã có, được service worker lưu sẵn), không vẽ lại trong component. Ở Ban đêm logo mờ 80% để đỡ chói.
- **Wordmark "Kim Bun"** là `<h1>` ở màn Đăng nhập. `BrandMark` có prop `heading` để M6 dùng thẻ `<p>` ở màn Cài app, vì màn đó đã có `PageHeader` làm `<h1>`.
- **Nút Google:** cao 50, bo tròn hẳn, viền 1 px, logo G 18 px bên trái chữ.
- **Màn chờ của `AuthGate`:** khung tiêu đề, thẻ chính cao 300, 3 ô số, 4 hàng list (đúng hình Trang chủ, spec §10), có `aria-busy="true"`.
- **Màn lỗi của `AuthGate`:** `ErrorCard` với lời `LOAD_ERROR_TEXT` như cũ và nút "Thử lại".
- **Giới tính ở form khai báo bé:** `Segmented` Bé gái / Bé trai, thay cặp nút radio. Lúc mới mở chưa chọn ô nào, như cũ.
- **Trang `/khai-bao-be`:** `PageHeader` không có nút quay lại (tiêu đề "Khai báo bé" hoặc "Lịch tiêm của bé"), nội dung trong thẻ kính.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`. **Không tải font web**; wordmark dùng `font-rounded` (`ui-rounded, "SF Pro Rounded", -apple-system, sans-serif`).
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. Component lấy màu nút Google bằng cách import `GOOGLE_BUTTON`, `GOOGLE_G_COLORS` từ `lib/ui/tokens.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Spec §9: nút Google
  - Sáng: nền `#FFFFFF`, viền `#747775`, chữ `#1F1F1F`, logo G 4 màu.
  - Tối: nền `#131314`, viền `#8E918F`, chữ `#E3E3E3`, logo G 4 màu.
  - Ban đêm: nền `.glass`, chữ và logo G một màu `--color-ink`.
- Không đổi luồng đăng nhập, tạo gia đình, khai báo bé, chuyển hướng của `AuthGate` (`gateRedirect`, `keep`), và chữ người dùng thấy, trừ chỗ plan ghi rõ: câu dưới logo đổi thành "Nhật ký chăm bé của cả nhà" theo spec §3.4; "Đang tải…" của màn chờ thành `Skeleton`.
- Vùng chạm tối thiểu 44×44 pt. Khoảng an toàn tai thỏ (`safe-area-inset-*`) đã do `body` trong `app/globals.css` lo; màn hình chỉ dùng padding thường (`p-4`, `px-4 pt-2 pb-4` như các màn M1–M4), **không** thêm `env(safe-area-inset-*)` lần nữa.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:** khi kiểm tay **không bấm "Đăng nhập bằng Google", "Đăng xuất", "Tạo gia đình", "Lưu"**. Màn đăng nhập xem được trong cửa sổ ẩn danh, hoặc sau khi tự đăng xuất; nếu không có cách xem mà không đăng xuất, bỏ qua màn đó và ghi rõ.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot5-m4`):

- `components/ui/`: `PageHeader`, `Button`, `Glass`, `Segmented`, `Skeleton`, `ErrorCard`; `components/ui/testTree.ts`.
- `components/quick/styles.ts`: `FIELD_LABEL`, `FIELD_INPUT`.
- `lib/ui/tokens.ts`: `GOOGLE_BUTTON`, `GOOGLE_G_COLORS`; `lib/ui/cx.ts`.
- `/icons/icon.svg` (Đợt 1, `app/icons/[file]/route.tsx`).
- `lib/data/loadError.ts`: `classifyLoadError`, `LOAD_ERROR_TEXT`; `lib/data/baby.ts`: `createBaby`, `updateBaby`; `lib/rules/babyInput.ts`: `babyToRaw`, `parseBabyForm`, `BabyFormRaw`, `BabyInput`.
- `components/vaccines/VaccineSetup.tsx` (Đợt 5 / M2).

**Produces** (M6 dùng):

- `components/brand/BrandMark.tsx`: `BrandMark({ size?: "lg" | "md"; tagline?: string; heading?: boolean })`.
- `components/auth/GoogleButton.tsx`: `GoogleButton({ onClick: () => void })`.
- `components/AuthGate.tsx`: export thêm `GateLoading()`, `GateError({ message, onRetry })`.
- `LoginScreen`, `NotInvited`, `BabyForm`: cùng chữ ký, giao diện mới.

---

### Task 1: `BrandMark` và `GoogleButton`

**Files:**

- Create: `components/brand/BrandMark.tsx`, `components/auth/GoogleButton.tsx`, `components/auth/brand.test.tsx`

**Interfaces:**

- Consumes: `GOOGLE_BUTTON`, `GOOGLE_G_COLORS`; `cx`.
- Produces: `BrandMark`, `GoogleButton` (chữ ký ở Contracts).

- [ ] **Step 1: Viết test hỏng**

`components/auth/brand.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandMark } from "@/components/brand/BrandMark";
import { GOOGLE_BUTTON, GOOGLE_G_COLORS } from "@/lib/ui/tokens";
import { GoogleButton } from "./GoogleButton";

describe("BrandMark", () => {
  it("lg: a 96 px logo, a 34 px rounded wordmark h1 and the tagline", () => {
    const html = renderToStaticMarkup(
      <BrandMark tagline="Nhật ký chăm bé của cả nhà" />,
    );
    expect(html).toContain('src="/icons/icon.svg"');
    expect(html).toContain('width="96"');
    expect(html).toMatch(
      /<h1[^>]*font-rounded[^>]*text-\[34px\][^>]*>Kim Bun<\/h1>/,
    );
    expect(html).toContain("font-extrabold");
    expect(html).toContain(">Nhật ký chăm bé của cả nhà</p>");
  });

  it("md without heading: 64 px logo, 28 px wordmark in a paragraph", () => {
    const html = renderToStaticMarkup(<BrandMark size="md" heading={false} />);
    expect(html).toContain('width="64"');
    expect(html).toMatch(/<p[^>]*text-\[28px\][^>]*>Kim Bun<\/p>/);
    expect(html).not.toContain("<h1");
  });
});

describe("GoogleButton", () => {
  it("Google's light and dark colours from tokens, a glass ink version at night, a four-colour G", () => {
    const html = renderToStaticMarkup(<GoogleButton onClick={() => {}} />);
    expect(html).toContain(`--gb-bg:${GOOGLE_BUTTON.light.bg}`);
    expect(html).toContain(`--gb-border:${GOOGLE_BUTTON.light.border}`);
    expect(html).toContain(`--gb-text:${GOOGLE_BUTTON.light.text}`);
    expect(html).toContain(`--gb-bg-dark:${GOOGLE_BUTTON.dark.bg}`);
    expect(html).toContain(`--g-blue:${GOOGLE_G_COLORS.blue}`);
    expect(html).toContain("bg-(--gb-bg)");
    expect(html).toContain("in-data-[theme=dark]:bg-(--gb-bg-dark)");
    expect(html).toContain("in-data-[theme=night]:bg-glass");
    expect(html).toContain("in-data-[theme=night]:text-ink");
    // On the svg, not the button: the button's inline style would win over its own class.
    expect(html).toMatch(/<svg[^>]*in-data-\[theme=night\]:\[--g-red:currentColor\]/);
    expect(
      html.match(/fill="var\(--g-(blue|green|yellow|red)\)"/g),
    ).toHaveLength(4);
    expect(html).toContain("Đăng nhập bằng Google</button>");
    expect(html).toContain("min-h-[50px]");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/auth/brand.test.tsx`
Expected: FAIL — không tìm thấy module `@/components/brand/BrandMark` (và `./GoogleButton`).

- [ ] **Step 3: Viết `components/brand/BrandMark.tsx`**

```tsx
import { cx } from "@/lib/ui/cx";

const SIZES = {
  lg: { logo: 96, text: "text-[34px] leading-[41px]" },
  md: { logo: 64, text: "text-[28px] leading-[34px]" },
} as const;

// Spec §3.4: logo + "Kim Bun" in the rounded font, weight 800, -0.02em.
export function BrandMark({
  size = "lg",
  tagline,
  heading = true,
}: {
  size?: "lg" | "md";
  tagline?: string;
  heading?: boolean;
}) {
  const s = SIZES[size];
  const wordmark = cx(
    "font-rounded font-extrabold tracking-[-0.02em] text-ink",
    s.text,
  );
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <img
        src="/icons/icon.svg"
        alt=""
        width={s.logo}
        height={s.logo}
        className="rounded-[22%] shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=night]:opacity-80 in-data-[theme=night]:shadow-none"
      />
      {heading ? (
        <h1 className={wordmark}>Kim Bun</h1>
      ) : (
        <p className={wordmark}>Kim Bun</p>
      )}
      {tagline && <p className="text-base text-muted">{tagline}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Viết `components/auth/GoogleButton.tsx`**

```tsx
import type { CSSProperties } from "react";
import { GOOGLE_BUTTON, GOOGLE_G_COLORS } from "@/lib/ui/tokens";

// Google's own button colours (spec §9), set as CSS variables so the theme can switch them.
const VARS = {
  "--gb-bg": GOOGLE_BUTTON.light.bg,
  "--gb-border": GOOGLE_BUTTON.light.border,
  "--gb-text": GOOGLE_BUTTON.light.text,
  "--gb-bg-dark": GOOGLE_BUTTON.dark.bg,
  "--gb-border-dark": GOOGLE_BUTTON.dark.border,
  "--gb-text-dark": GOOGLE_BUTTON.dark.text,
  "--g-blue": GOOGLE_G_COLORS.blue,
  "--g-green": GOOGLE_G_COLORS.green,
  "--g-yellow": GOOGLE_G_COLORS.yellow,
  "--g-red": GOOGLE_G_COLORS.red,
} as CSSProperties;

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={VARS}
      className="flex min-h-[50px] w-full items-center justify-center gap-3 rounded-full border border-(--gb-border) bg-(--gb-bg) px-5 text-base font-semibold text-(--gb-text) transition-transform duration-[120ms] active:scale-[0.97] in-data-[theme=dark]:border-(--gb-border-dark) in-data-[theme=dark]:bg-(--gb-bg-dark) in-data-[theme=dark]:text-(--gb-text-dark) in-data-[theme=night]:border-edge in-data-[theme=night]:bg-glass in-data-[theme=night]:text-ink in-data-[theme=night]:backdrop-blur-[24px]"
    >
      {/* The colour variables sit in the button's inline style, which beats any class
          on the button itself, so the night override is set one level down. */}
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        className="in-data-[theme=night]:[--g-blue:currentColor] in-data-[theme=night]:[--g-green:currentColor] in-data-[theme=night]:[--g-yellow:currentColor] in-data-[theme=night]:[--g-red:currentColor]"
      >
        <path
          fill="var(--g-blue)"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        />
        <path
          fill="var(--g-green)"
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        />
        <path
          fill="var(--g-yellow)"
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        />
        <path
          fill="var(--g-red)"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        />
      </svg>
      Đăng nhập bằng Google
    </button>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/auth/brand.test.tsx lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (BrandMark 2, GoogleButton 1, themeGuard 1); typecheck không lỗi. Nếu React in biến CSS trong `style` khác dạng `--gb-bg:#FFFFFF` (ví dụ có khoảng trắng), sửa assertion cho khớp đúng chuỗi React 19 in ra và ghi lại trong báo cáo.

- [ ] **Step 6: Commit**

```bash
git add components/brand/BrandMark.tsx components/auth/GoogleButton.tsx components/auth/brand.test.tsx
git commit -m "feat(auth): brand mark and Google sign-in button"
```

---

### Task 2: Màn Đăng nhập

**Files:**

- Modify: `components/auth/LoginScreen.tsx` (viết lại toàn file)
- Create: `components/auth/login.test.tsx`

**Interfaces:**

- Consumes: `BrandMark`, `GoogleButton` (Task 1); `supabase`.
- Produces: `LoginScreen()`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/auth/login.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoginScreen } from "./LoginScreen";

describe("LoginScreen", () => {
  it("logo, wordmark, tagline, the Google button and the install link", () => {
    const html = renderToStaticMarkup(<LoginScreen />);
    expect(html).toContain('src="/icons/icon.svg"');
    expect(html).toContain(">Kim Bun</h1>");
    expect(html).toContain(">Nhật ký chăm bé của cả nhà</p>");
    expect(html).toContain("Đăng nhập bằng Google</button>");
    expect(html).toContain("--gb-bg:");
    expect(html).toContain('href="/cai-app"');
    expect(html).not.toContain("bg-accent text-lg");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/auth/login.test.tsx`
Expected: FAIL — bản cũ không có logo, không có câu "Nhật ký chăm bé của cả nhà".

- [ ] **Step 3: Viết lại `components/auth/LoginScreen.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { supabase } from "@/lib/supabase/client";
import { GoogleButton } from "./GoogleButton";

export function LoginScreen() {
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    const { error: authError } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError)
      setError("Không mở được trang đăng nhập Google. Thử lại sau.");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-6 text-center">
      <BrandMark tagline="Nhật ký chăm bé của cả nhà" />
      <div className="flex flex-col gap-3">
        <GoogleButton onClick={() => void signIn()} />
        <Link
          href="/cai-app"
          className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-accent-text"
        >
          Cách cài Kim Bun lên màn hình chính
        </Link>
        {error && (
          <p role="alert" className="text-[15px] text-danger">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/auth lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (brand 3, login 1, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/auth/LoginScreen.tsx components/auth/login.test.tsx
git commit -m "feat(auth): Đăng nhập with logo, wordmark and Google button"
```

---

### Task 3: Chưa được mời; màn chờ và màn lỗi của `AuthGate`

**Files:**

- Modify: `components/auth/NotInvited.tsx` (viết lại toàn file), `components/AuthGate.tsx` (2 chỗ)
- Create: `components/auth/gate.test.tsx`

**Interfaces:**

- Consumes: `Glass`, `Button`, `Skeleton`, `ErrorCard`; `FIELD_LABEL`, `FIELD_INPUT`; `supabase`; `classifyLoadError`, `LOAD_ERROR_TEXT`.
- Produces: `NotInvited({ email })` (cùng chữ ký); `GateLoading()`, `GateError({ message: string; onRetry: () => void })`.

- [ ] **Step 1: Viết test hỏng**

`components/auth/gate.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GateError, GateLoading } from "@/components/AuthGate";
import { NotInvited } from "./NotInvited";

describe("AuthGate states", () => {
  it("loading draws the home page's shapes, not text", () => {
    const html = renderToStaticMarkup(<GateLoading />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("h-[300px]");
    expect(html.match(/kb-pulse/g)?.length).toBeGreaterThanOrEqual(9);
    expect(html).not.toContain("Đang tải…");
  });

  it("a load error is a retry card", () => {
    const html = renderToStaticMarkup(
      <GateError message="Mất kết nối" onRetry={() => {}} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain(">Mất kết nối</p>");
    expect(html).toContain(">Thử lại</button>");
  });
});

describe("NotInvited", () => {
  it("a large title, the signed-in Gmail and a secondary Đăng xuất", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <NotInvited email="ba@example.com" />
      </QueryClientProvider>,
    );
    expect(html).toContain(">Bạn chưa được mời</h1>");
    expect(html).toContain("text-[34px]");
    expect(html).toContain("<strong>ba@example.com</strong>");
    expect(html).toContain(">Đăng xuất</button>");
    expect(html).not.toContain("rounded-xl border");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/auth/gate.test.tsx`
Expected: FAIL — `Element type is invalid … got: undefined` cho `GateLoading` / `GateError` (chưa export); `NotInvited` cũ hỏng ở `text-[34px]`.

- [ ] **Step 3: Thêm `GateLoading`, `GateError` vào `components/AuthGate.tsx` và dùng chúng**

1. Thêm 2 import ngay dưới dòng `import { SyncBar } from "@/components/sync/SyncBar";`:

```tsx
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Skeleton } from "@/components/ui/Skeleton";
```

2. Thêm ngay trên dòng `export function AuthGate({`:

```tsx
// Spec §10: the gate waits with the home page's shapes (header, hero 300, 3 tiles, 4 rows).
export function GateLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex max-w-md flex-col gap-[18px] p-4"
    >
      <Skeleton className="h-11 w-48 rounded-full" />
      <Skeleton className="h-[300px] rounded-[32px]" />
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[92px] rounded-[24px]" />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[60px]" />
      ))}
    </main>
  );
}

export function GateError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <ErrorCard message={message} onRetry={onRetry} />
    </main>
  );
}
```

3. Trong hàm `AuthGate`, thay khối:

```tsx
  if (session && family.isError && !family.data) {
    return (
      <main className="p-6 text-center">
        <p className="mb-4">
          {
            LOAD_ERROR_TEXT[
              classifyLoadError(
                family.error,
                typeof navigator === "undefined" ? true : navigator.onLine,
              )
            ]
          }
        </p>
        <button
          type="button"
          className="min-h-11 rounded-xl bg-accent px-4 text-on-accent"
          onClick={() => family.refetch()}
        >
          Thử lại
        </button>
      </main>
    );
  }
  if (!ready || redirect)
    return <main className="p-6 text-center text-muted">Đang tải…</main>;
```

(từ `if (session && family.isError && !family.data) {` đến hết dòng `return <main className="p-6 text-center text-muted">Đang tải…</main>;`) bằng:

```tsx
if (session && family.isError && !family.data)
  return (
    <GateError
      message={
        LOAD_ERROR_TEXT[
          classifyLoadError(
            family.error,
            typeof navigator === "undefined" ? true : navigator.onLine,
          )
        ]
      }
      onRetry={() => void family.refetch()}
    />
  );
if (!ready || redirect) return <GateLoading />;
```

- [ ] **Step 4: Viết lại `components/auth/NotInvited.tsx`**

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { supabase } from "@/lib/supabase/client";

export function NotInvited({ email }: { email: string }) {
  const queryClient = useQueryClient();
  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const canCreate = useQuery({
    queryKey: ["can-create-family"],
    queryFn: async () => {
      const { data, error } = await supabase().rpc("can_create_family");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase().rpc("create_family", {
        name: familyName.trim(),
        display_name: displayName.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["family-context"] }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (familyName.trim() && displayName.trim()) create.mutate();
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <h1 className="px-1 text-[34px] leading-[41px] font-bold text-ink">
        Bạn chưa được mời
      </h1>
      <Glass className="flex flex-col gap-2 p-4 text-base text-ink">
        <p>
          Đang đăng nhập: <strong>{email}</strong>
        </p>
        <p className="text-muted">
          Nhờ ba/mẹ của bé thêm Gmail này vào gia đình.
        </p>
      </Glass>

      {canCreate.data === true && (
        <Glass as="form" onSubmit={submit} className="flex flex-col gap-3 p-4">
          <h2 className="text-[17px] font-semibold text-ink">Tạo gia đình</h2>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Tên gia đình</span>
            <input
              className={FIELD_INPUT}
              maxLength={80}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Bạn là (ví dụ Mẹ, Ba)</span>
            <input
              className={FIELD_INPUT}
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <Button type="submit" block busy={create.isPending}>
            Tạo gia đình
          </Button>
          {create.isError && (
            <p role="alert" className="text-[15px] text-danger">
              Không tạo được gia đình. Thử lại sau.
            </p>
          )}
        </Glass>
      )}

      <Button
        variant="secondary"
        block
        onClick={() => void supabase().auth.signOut()}
      >
        Đăng xuất
      </Button>
    </main>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/auth lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (gate 3, brand 3, login 1, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/AuthGate.tsx components/auth/NotInvited.tsx components/auth/gate.test.tsx
git commit -m "feat(auth): skeleton and retry card for the gate; glass Chưa được mời"
```

---

### Task 4: Form khai báo bé và trang `/khai-bao-be`; kiểm toàn bộ

**Files:**

- Modify: `components/baby/BabyForm.tsx` (viết lại toàn file), `app/khai-bao-be/page.tsx` (viết lại toàn file)
- Create: `components/baby/babyform.test.tsx`

**Interfaces:**

- Consumes: `PageHeader`, `Glass`, `Button`, `Segmented`; `FIELD_LABEL`, `FIELD_INPUT`; `OnlineOnly`; `VaccineSetup`; dữ liệu và luật bé có sẵn.
- Produces: `BabyForm({ familyId, baby?, onCreated? })`, cùng chữ ký; trang `/khai-bao-be` giao diện mới.

- [ ] **Step 1: Viết test hỏng**

`components/baby/babyform.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BabyForm } from "./BabyForm";

describe("BabyForm", () => {
  it("field styles, a segmented sex picker with nothing chosen yet, and a large Lưu", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <BabyForm familyId="f1" />
      </QueryClientProvider>,
    );
    expect(html).toContain(">Tên bé</span>");
    expect(html).toContain(">Ngày sinh</span>");
    expect(html).toContain('aria-label="Giới tính"');
    expect(html).toContain(">Bé gái</button>");
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).not.toContain('type="radio"');
    expect(html).toContain('inputMode="numeric"');
    expect(html).toMatch(/type="submit"[^>]*min-h-\[50px\][^>]*>Lưu<\/button>/);
    expect(html).not.toContain("rounded-xl border");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/baby/babyform.test.tsx`
Expected: FAIL — hỏng ngay ở `>Tên bé</span>` (bản cũ để chữ nhãn trần trong `<label>`, dùng radio và `rounded-xl border`).

- [ ] **Step 3: Viết lại `components/baby/BabyForm.tsx`**

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { createBaby, updateBaby } from "@/lib/data/baby";
import { toVietnameseError } from "@/lib/data/errors";
import {
  babyToRaw,
  parseBabyForm,
  type BabyFormRaw,
  type BabyInput,
} from "@/lib/rules/babyInput";
import { vnDateString } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";

const EMPTY: BabyFormRaw = {
  name: "",
  dob: "",
  sex: "",
  birthWeightG: "",
  birthLengthCm: "",
  birthHeadCm: "",
};

const SEXES = [
  { value: "female", label: "Bé gái" },
  { value: "male", label: "Bé trai" },
];

export function BabyForm({
  familyId,
  baby,
  onCreated,
}: {
  familyId: string;
  baby?: Baby;
  onCreated?: (created: Baby) => void;
}) {
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState<BabyFormRaw>(() =>
    baby ? babyToRaw(baby) : EMPTY,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof BabyFormRaw, string>>
  >({});

  const save = useMutation({
    mutationFn: async (value: BabyInput): Promise<Baby | null> => {
      if (!baby) return createBaby(familyId, value);
      await updateBaby(baby.id, value);
      return null;
    },
    onSuccess: async (created) => {
      // Tell the page first, so it can hold the gate before the refetch sees the baby.
      if (created) onCreated?.(created);
      await queryClient.invalidateQueries({ queryKey: ["family-context"] });
    },
  });

  function set<K extends keyof BabyFormRaw>(key: K, value: string) {
    setRaw((prev) => ({ ...prev, [key]: value }));
    save.reset();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = parseBabyForm(raw, new Date());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    save.mutate(result.value);
  }

  const error = (key: keyof BabyFormRaw) =>
    errors[key] ? (
      <span className="text-[13px] text-danger">{errors[key]}</span>
    ) : null;

  const text = (
    key: "name" | "birthWeightG" | "birthLengthCm" | "birthHeadCm",
    label: string,
    inputMode?: "numeric" | "decimal",
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL}>{label}</span>
      <input
        inputMode={inputMode}
        className={inputMode ? `${FIELD_INPUT} tabular-nums` : FIELD_INPUT}
        value={raw[key]}
        onChange={(e) => set(key, e.target.value)}
      />
      {error(key)}
    </label>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {text("name", "Tên bé")}
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Ngày sinh</span>
        <input
          type="date"
          className={FIELD_INPUT}
          max={vnDateString(new Date())}
          value={raw.dob}
          onChange={(e) => set("dob", e.target.value)}
        />
        {error("dob")}
      </label>
      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Giới tính</span>
        <Segmented
          label="Giới tính"
          options={SEXES}
          value={raw.sex}
          onChange={(sex) => set("sex", sex)}
        />
        {error("sex")}
      </div>
      {text("birthWeightG", "Cân nặng lúc sinh (g, không bắt buộc)", "numeric")}
      {text(
        "birthLengthCm",
        "Chiều dài lúc sinh (cm, không bắt buộc)",
        "decimal",
      )}
      {text("birthHeadCm", "Vòng đầu lúc sinh (cm, không bắt buộc)", "decimal")}
      <Button type="submit" size="lg" block busy={save.isPending}>
        Lưu
      </Button>
      {save.isError && (
        <p role="alert" className="text-[15px] text-danger">
          {baby
            ? toVietnameseError(save.error)
            : "Không lưu được. Thử lại sau."}
        </p>
      )}
      {baby && save.isSuccess && (
        <p role="status" className="text-[15px] text-good-ink">
          Đã lưu.
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Viết lại `app/khai-bao-be/page.tsx`**

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BabyForm } from "@/components/baby/BabyForm";
import { OnlineOnly } from "@/components/OnlineOnly";
import { Glass } from "@/components/ui/Glass";
import { PageHeader } from "@/components/ui/PageHeader";
import { VaccineSetup } from "@/components/vaccines/VaccineSetup";
import type { Baby } from "@/lib/supabase/rows";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [created, setCreated] = useState<Baby | null>(null);

  // Home must already see the new baby, or its gate sends us back here.
  async function finish() {
    await queryClient.refetchQueries({ queryKey: ["family-context"] });
    router.replace("/");
  }
  return (
    <AuthGate need="family" keep={created !== null}>
      {({ session, ctx }) => (
        <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
          <PageHeader title={created ? "Lịch tiêm của bé" : "Khai báo bé"} />
          {created && session ? (
            <VaccineSetup
              baby={created}
              userId={session.user.id}
              records={[]}
              initialChoices={{}}
              onDone={finish}
              onLater={finish}
            />
          ) : ctx?.member.role === "owner" ? (
            <Glass className="p-4">
              <OnlineOnly>
                <BabyForm familyId={ctx.family.id} onCreated={setCreated} />
              </OnlineOnly>
            </Glass>
          ) : (
            <Glass className="p-4 text-base text-muted">
              Chờ ba/mẹ của bé khai báo thông tin bé.
            </Glass>
          )}
        </main>
      )}
    </AuthGate>
  );
}
```

- [ ] **Step 5: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 636 có sẵn + 3 brand + 1 login + 3 gate + 1 babyform = 644. Build xong.

- [ ] **Step 6: Kiểm trên trình duyệt (không đăng nhập, không đăng xuất, không lưu)**

Run: `bun run dev`. **Không bấm "Đăng nhập bằng Google", "Đăng xuất", "Tạo gia đình", "Lưu".**
Expected:

- **Màn chờ:** mở `http://localhost:3000/` ở bề rộng 375 px và tải lại trang. Trong lúc chờ thấy các khối xám nhấp nháy theo hình Trang chủ, không có chữ "Đang tải…".
- **Đăng nhập:** mở `http://localhost:3000/dang-nhap` trong một tab ẩn danh hoặc phiên chưa đăng nhập (nếu trình duyệt kiểm thử không có cách này, bỏ qua và ghi rõ).
  - Có logo bánh bao 96, chữ "Kim Bun" tròn đậm, câu "Nhật ký chăm bé của cả nhà".
  - Nút Google trắng viền xám ở theme Sáng, đen ở theme Tối, kính với logo G một màu ở Ban đêm.
  - Đổi theme bằng `localStorage` (`be-yeu-theme` = `light` / `dark`, tắt lịch ban đêm) để xem đủ ba kiểu, rồi trả lại như cũ.
- **Khai báo bé:** nếu tài khoản đã có bé, `/khai-bao-be` sẽ chuyển về Trang chủ; khi đó chỉ kiểm bằng test SSR và ghi rõ.
- Tắt dev server.

- [ ] **Step 7: Commit**

```bash
git add components/baby app/khai-bao-be/page.tsx
git commit -m "feat(onboarding): glass Khai báo bé with a segmented sex picker"
```

---

## Kết thúc M5 (Đợt 5)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 644 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 5 / M6 (bên trong 3 trang con Cài đặt, Offline, Cài app).
