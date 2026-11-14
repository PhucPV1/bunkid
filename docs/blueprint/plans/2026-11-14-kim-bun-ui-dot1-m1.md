# Kim Bun UI — Đợt 1 / M1 (nhận diện Kim Bun) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-14

**Goal:** Đổi tên app thành Kim Bun, thay logo bằng "Bánh bao Bun" và phục vụ icon PNG/SVG mới ở đúng các URL icon cũ, nối vào manifest, `<head>` và service worker.

**Architecture:**

- Logo là chuỗi SVG trong `lib/brand/logo.ts`; `lib/brand/iconFiles.ts` map 5 tên file sang SVG nguồn và kích thước.
- Route `app/icons/[file]/route.tsx` trả SVG trực tiếp hoặc PNG sinh bằng `ImageResponse` (`next/og`), sinh tĩnh lúc build bằng `generateStaticParams`. PNG tĩnh cũ trong `public/icons/` bị xóa để không che route.
- Giữ URL icon cũ nên `showNotification` và precache cũ vẫn chạy; precache thêm 2 URL mới.

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

**Produces:**

- `lib/brand/logo.ts`: `LOGO_GRADIENT: { from: "#FFD9C7"; to: "#EE7AA3" }`, `LOGO_SVG_ROUNDED`, `LOGO_SVG_SQUARE`, `LOGO_SVG_MASKABLE` (chuỗi).
- `lib/brand/iconFiles.ts`: `type IconFile`, `ICON_FILES`, `iconFile(name: string): IconFile | null`, `svgDataUri(svg: string): string`.
- URL icon: `/icons/icon.svg`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/maskable-512.png`, `/icons/apple-touch-icon.png`.
- Tên hiển thị "Kim Bun"; `docs/device-checklist.md` bước 20.

**Consumes:** không có.

---

### Task 1: Đổi tên thành Kim Bun

**Files:**

- Create: `lib/brandName.test.ts`
- Modify: `app/layout.tsx:8,10`, `public/manifest.webmanifest:2-3`, `sw/sw.template.js:37`, `scripts/sw.test.ts:190`, `components/auth/LoginScreen.tsx:22,35`, `components/install/InstallGuide.tsx:24,28,38,51`, `components/push/DevicePushControl.tsx:14,18,58`, `components/settings/SettingsScreen.tsx:77`, `components/settings/MembersSection.tsx:168`, `components/report/ReportScreen.tsx:227`, `README.md:1`

**Interfaces:**

- Consumes: không.
- Produces: tên hiển thị "Kim Bun"; `FALLBACK_TITLE` = "Kim Bun có thông báo mới".

- [ ] **Step 1: Viết test hỏng**

`lib/brandName.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Built from two parts so this file does not match itself.
const OLD_NAME = ["Bé", "Yêu"].join(" ");
const ROOTS = ["app", "components", "lib", "sw", "scripts"];
const FILES = ["public/manifest.webmanifest", "README.md"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx|js|json|md|webmanifest)$/.test(name) ? [path] : [];
  });
}

describe("app name", () => {
  it("no user-visible text still says the old name", () => {
    const hits = [...ROOTS.flatMap(walk), ...FILES].filter((file) =>
      readFileSync(file, "utf8").includes(OLD_NAME),
    );
    expect(hits).toEqual([]);
  });

  it("the manifest uses the new name", () => {
    const manifest = JSON.parse(
      readFileSync("public/manifest.webmanifest", "utf8"),
    );
    expect(manifest.name).toBe("Kim Bun");
    expect(manifest.short_name).toBe("Kim Bun");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/brandName.test.ts`
Expected: FAIL — test đầu liệt kê khoảng 12 file (trong đó có `app/layout.tsx`, `sw/sw.template.js`, `scripts/sw.test.ts`, `README.md`); test thứ hai báo `expected 'Bé Yêu' to be 'Kim Bun'`.

- [ ] **Step 3: Thay tên**

Run:

```bash
grep -rl "Bé Yêu" app components lib sw scripts public/manifest.webmanifest README.md | xargs perl -pi -e 's/Bé Yêu/Kim Bun/g'
```

Không sửa tay `public/sw.js`: file này bị `.gitignore` và được `prebuild` sinh lại từ `sw/sw.template.js`.

- [ ] **Step 4: Kiểm lại các câu đã đổi**

Run: `grep -rn "Kim Bun" app components sw scripts public/manifest.webmanifest README.md`
Expected: đúng các dòng sau (số dòng có thể lệch ±1 do formatter):

- `app/layout.tsx`: `title: "Kim Bun",` và `appleWebApp: { capable: true, title: "Kim Bun", ... }`
- `public/manifest.webmanifest`: `"name": "Kim Bun"`, `"short_name": "Kim Bun"`
- `sw/sw.template.js`: `const FALLBACK_TITLE = "Kim Bun có thông báo mới";`
- `scripts/sw.test.ts`: `"Kim Bun có thông báo mới",`
- `components/auth/LoginScreen.tsx`: `>Kim Bun</h1>` và `Cách cài Kim Bun lên màn hình chính`
- `components/install/InstallGuide.tsx`: `Cài Kim Bun`, `Kim Bun đã được cài…`, `Phải cài Kim Bun…`, `3. Mở Kim Bun…`
- `components/push/DevicePushControl.tsx`: 3 câu có `Kim Bun`
- `components/settings/SettingsScreen.tsx`: `Cài Kim Bun lên màn hình chính`
- `components/settings/MembersSection.tsx`: `mở Kim Bun và đăng nhập`
- `components/report/ReportScreen.tsx`: `ứng dụng Kim Bun`
- `README.md`: `# Kim Bun`

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test lib/brandName.test.ts scripts/sw.test.ts`
Expected: PASS cả hai file.

- [ ] **Step 6: Commit**

```bash
git add -A lib/brandName.test.ts app components sw scripts public/manifest.webmanifest README.md
git commit -m "feat(brand): rename the app to Kim Bun"
```

---

### Task 2: Logo SVG và route icon

**Files:**

- Create: `lib/brand/logo.ts`, `lib/brand/iconFiles.ts`, `lib/brand/logo.test.ts`, `app/icons/[file]/route.tsx`
- Delete: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/apple-touch-icon.png`

**Interfaces:**

- Consumes: không.
- Produces:
  - `LOGO_GRADIENT: { from: "#FFD9C7"; to: "#EE7AA3" }`
  - `LOGO_SVG_ROUNDED: string`, `LOGO_SVG_SQUARE: string`, `LOGO_SVG_MASKABLE: string`
  - `type IconFile = { contentType: "image/svg+xml"; svg: string } | { contentType: "image/png"; size: number; svg: string }`
  - `ICON_FILES: Record<string, IconFile>` với đúng 5 khóa `icon.svg`, `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png`
  - `iconFile(name: string): IconFile | null`
  - `svgDataUri(svg: string): string`
  - Route `GET /icons/<file>` cho 5 tên trên; tên khác trả 404.

- [ ] **Step 1: Đọc docs**

Đọc `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md` (mục Route Handlers), `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md` (mục "With Route Handlers") và `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md`.

- [ ] **Step 2: Viết test hỏng**

`lib/brand/logo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ICON_FILES, iconFile, svgDataUri } from "./iconFiles";
import {
  LOGO_GRADIENT,
  LOGO_SVG_MASKABLE,
  LOGO_SVG_ROUNDED,
  LOGO_SVG_SQUARE,
} from "./logo";

const ALL = [LOGO_SVG_ROUNDED, LOGO_SVG_SQUARE, LOGO_SVG_MASKABLE];

describe("logo", () => {
  it("every variant is one ASCII-only SVG document", () => {
    for (const svg of ALL) {
      expect(
        svg.startsWith(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">',
        ),
      ).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      expect(/^[\x20-\x7E]*$/.test(svg)).toBe(true);
      expect(svg).toContain(`stop-color="${LOGO_GRADIENT.from}"`);
      expect(svg).toContain(`stop-color="${LOGO_GRADIENT.to}"`);
      expect(svg).toContain('fill="#FFC94A"');
    }
  });

  it("only the rounded variant has rounded corners", () => {
    expect(LOGO_SVG_ROUNDED).toContain('rx="27"');
    expect(LOGO_SVG_SQUARE).not.toContain("rx=");
    expect(LOGO_SVG_MASKABLE).not.toContain("rx=");
  });

  it("the maskable variant shrinks the artwork to 80% around the centre", () => {
    expect(LOGO_SVG_MASKABLE).toContain(
      '<g transform="translate(12 12) scale(0.8)">',
    );
    expect(LOGO_SVG_SQUARE).not.toContain("<g ");
  });
});

describe("icon files", () => {
  it("serves exactly the five icon URLs", () => {
    expect(Object.keys(ICON_FILES).sort()).toEqual([
      "apple-touch-icon.png",
      "icon-192.png",
      "icon-512.png",
      "icon.svg",
      "maskable-512.png",
    ]);
  });

  it("maps each file to its source and size", () => {
    expect(iconFile("icon.svg")).toEqual({
      contentType: "image/svg+xml",
      svg: LOGO_SVG_ROUNDED,
    });
    expect(iconFile("icon-192.png")).toEqual({
      contentType: "image/png",
      size: 192,
      svg: LOGO_SVG_SQUARE,
    });
    expect(iconFile("icon-512.png")).toEqual({
      contentType: "image/png",
      size: 512,
      svg: LOGO_SVG_SQUARE,
    });
    expect(iconFile("maskable-512.png")).toEqual({
      contentType: "image/png",
      size: 512,
      svg: LOGO_SVG_MASKABLE,
    });
    expect(iconFile("apple-touch-icon.png")).toEqual({
      contentType: "image/png",
      size: 180,
      svg: LOGO_SVG_SQUARE,
    });
  });

  it("rejects unknown names, including inherited object keys", () => {
    expect(iconFile("favicon.ico")).toBeNull();
    expect(iconFile("constructor")).toBeNull();
    expect(iconFile("")).toBeNull();
  });

  it("svgDataUri round-trips through base64", () => {
    const uri = svgDataUri(LOGO_SVG_SQUARE);
    expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(atob(uri.slice("data:image/svg+xml;base64,".length))).toBe(
      LOGO_SVG_SQUARE,
    );
  });
});
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test lib/brand/logo.test.ts`
Expected: FAIL — `Failed to resolve import "./iconFiles"`.

- [ ] **Step 4: Viết `lib/brand/logo.ts`**

```ts
export const LOGO_GRADIENT = { from: "#FFD9C7", to: "#EE7AA3" } as const;

const DEFS =
  '<defs><linearGradient id="kb1" x1="0" y1="0" x2="1" y2="1">' +
  `<stop offset="0" stop-color="${LOGO_GRADIENT.from}"/>` +
  `<stop offset="1" stop-color="${LOGO_GRADIENT.to}"/>` +
  "</linearGradient></defs>";

const ART =
  '<path d="M20 80c0-23 18-42 40-42s40 19 40 42c0 8-6 13-14 13H34c-8 0-14-5-14-13z" fill="#FFF8F2"/>' +
  '<path d="M50 41c3-7 7-10 10-10s7 3 10 10" fill="none" stroke="#F0C3B2" stroke-width="3.5" stroke-linecap="round"/>' +
  '<path d="M43 67c2.5 3 7.5 3 10 0M67 67c2.5 3 7.5 3 10 0" fill="none" stroke="#2B1B22" stroke-width="3.6" stroke-linecap="round"/>' +
  '<path d="M55 76c3 2.4 7 2.4 10 0" fill="none" stroke="#2B1B22" stroke-width="3" stroke-linecap="round"/>' +
  '<circle cx="40" cy="76" r="4.5" fill="#FF9EB5" opacity="0.75"/>' +
  '<circle cx="80" cy="76" r="4.5" fill="#FF9EB5" opacity="0.75"/>' +
  '<path d="M93 14l3.4 9.6 9.6 3.4-9.6 3.4L93 40l-3.4-9.6L80 27l9.6-3.4z" fill="#FFC94A"/>';

function svg(background: string, art: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${DEFS}${background}${art}</svg>`;
}

const ROUNDED_BG = '<rect width="120" height="120" rx="27" fill="url(#kb1)"/>';
const SQUARE_BG = '<rect width="120" height="120" fill="url(#kb1)"/>';

export const LOGO_SVG_ROUNDED = svg(ROUNDED_BG, ART);
export const LOGO_SVG_SQUARE = svg(SQUARE_BG, ART);
export const LOGO_SVG_MASKABLE = svg(
  SQUARE_BG,
  `<g transform="translate(12 12) scale(0.8)">${ART}</g>`,
);
```

- [ ] **Step 5: Viết `lib/brand/iconFiles.ts`**

```ts
import { LOGO_SVG_MASKABLE, LOGO_SVG_ROUNDED, LOGO_SVG_SQUARE } from "./logo";

export type IconFile =
  | { contentType: "image/svg+xml"; svg: string }
  | { contentType: "image/png"; size: number; svg: string };

export const ICON_FILES: Record<string, IconFile> = {
  "icon.svg": { contentType: "image/svg+xml", svg: LOGO_SVG_ROUNDED },
  "icon-192.png": { contentType: "image/png", size: 192, svg: LOGO_SVG_SQUARE },
  "icon-512.png": { contentType: "image/png", size: 512, svg: LOGO_SVG_SQUARE },
  "maskable-512.png": {
    contentType: "image/png",
    size: 512,
    svg: LOGO_SVG_MASKABLE,
  },
  "apple-touch-icon.png": {
    contentType: "image/png",
    size: 180,
    svg: LOGO_SVG_SQUARE,
  },
};

export function iconFile(name: string): IconFile | null {
  return Object.hasOwn(ICON_FILES, name) ? ICON_FILES[name] : null;
}

// The logo is ASCII-only (tested), so btoa is safe in both Node and the browser.
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test lib/brand/logo.test.ts`
Expected: PASS (7 test).

- [ ] **Step 7: Viết route `app/icons/[file]/route.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { ICON_FILES, iconFile, svgDataUri } from "@/lib/brand/iconFiles";

export const runtime = "nodejs";
export const dynamicParams = false;

export function generateStaticParams(): { file: string }[] {
  return Object.keys(ICON_FILES).map((file) => ({ file }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await params;
  const icon = iconFile(file);
  if (!icon) return new Response("Not found", { status: 404 });
  if (icon.contentType === "image/svg+xml") {
    return new Response(icon.svg, {
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
    });
  }
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={svgDataUri(icon.svg)}
      width={icon.size}
      height={icon.size}
      alt=""
    />,
    { width: icon.size, height: icon.size },
  );
}
```

- [ ] **Step 8: Xóa PNG cũ để không che route**

Run: `git rm public/icons/icon-192.png public/icons/icon-512.png public/icons/apple-touch-icon.png`
Expected: 3 dòng `rm 'public/icons/…'`.

- [ ] **Step 9: Build và kiểm route**

Run: `bun run typecheck && bun run build`
Expected: typecheck không lỗi; build xong, bảng route có dòng `/icons/[file]` kèm 5 đường dẫn con được sinh tĩnh (ký hiệu `●` hoặc `○` theo chú thích của Next).

Run (bật server nền rồi kiểm):

```bash
bun run start -- -p 3100 & PID=$!; sleep 5
curl -s -o /tmp/kb-192.png -w "%{http_code} %{content_type}\n" http://localhost:3100/icons/icon-192.png
file /tmp/kb-192.png
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3100/icons/icon.svg
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/icons/khong-co.png
kill $PID
```

Expected:

- `200 image/png`
- `/tmp/kb-192.png: PNG image data, 192 x 192, …`
- `200 image/svg+xml; charset=utf-8`
- `404`

- [ ] **Step 10: Commit**

```bash
git add lib/brand app/icons
git commit -m "feat(brand): Kim Bun logo and generated app icons"
```

---

### Task 3: Nối icon vào manifest, layout, service worker; dọn script cũ; checklist

**Files:**

- Create: `lib/brand/manifest.test.ts`
- Modify: `public/manifest.webmanifest`, `app/layout.tsx:7-12`, `sw/sw.template.js:4-11`, `scripts/sw.test.ts:96-101`, `package.json` (bỏ script `icons`), `docs/device-checklist.md` (thêm bước 20)
- Delete: `scripts/make-icons.ts`, `scripts/png.ts`, `scripts/png.test.ts`

**Interfaces:**

- Consumes: `ICON_FILES` (Task 2).
- Produces: manifest trỏ 3 icon PNG; `<link rel="icon" href="/icons/icon.svg">` và `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`; service worker precache thêm `/icons/icon.svg`, `/icons/maskable-512.png`.

- [ ] **Step 1: Viết test hỏng cho manifest**

`lib/brand/manifest.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ICON_FILES } from "./iconFiles";

const manifest = JSON.parse(
  readFileSync("public/manifest.webmanifest", "utf8"),
);

describe("web app manifest", () => {
  it("lists the generated icons with the right purposes", () => {
    expect(manifest.icons).toEqual([
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });

  it("every manifest icon is served by the icon route", () => {
    for (const icon of manifest.icons)
      expect(Object.keys(ICON_FILES)).toContain(
        icon.src.replace("/icons/", ""),
      );
  });

  it("uses the light background colour", () => {
    expect(manifest.background_color).toBe("#FBF3F0");
    expect(manifest.theme_color).toBe("#FBF3F0");
  });
});
```

- [ ] **Step 2: Sửa test service worker cho precache mới**

Trong `scripts/sw.test.ts`, test "install caches the shell, every page and the static files each page links", thêm 2 dòng vào mảng `expect.arrayContaining([...])` ngay sau `"/icons/icon-192.png",`:

```ts
        "/icons/icon.svg",
        "/icons/maskable-512.png",
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test lib/brand/manifest.test.ts scripts/sw.test.ts`
Expected: FAIL — manifest: `icons` khác mảng mong đợi, `background_color` là `"#ffffff"`; sw: thiếu `/icons/icon.svg` trong cache.

- [ ] **Step 4: Sửa `public/manifest.webmanifest`**

Nội dung đầy đủ:

```json
{
  "name": "Kim Bun",
  "short_name": "Kim Bun",
  "lang": "vi",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#FBF3F0",
  "theme_color": "#FBF3F0",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

- [ ] **Step 5: Sửa `sw/sw.template.js`**

Thay mảng `SHELL` (dòng 4–11) bằng:

```js
const SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];
```

Giữ nguyên `icon: "/icons/icon-192.png"` trong `showNotification`.

- [ ] **Step 6: Sửa `app/layout.tsx` (metadata icon)**

Thay `icons: { apple: "/icons/apple-touch-icon.png" },` bằng:

```ts
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
```

- [ ] **Step 7: Dọn script tạo icon cũ**

Kiểm import thật trước khi xóa:

Run: `grep -rnE "from ['\"](\./|@/scripts/)png['\"]" app components lib scripts sw`
Expected: chỉ 2 dòng, ở `scripts/make-icons.ts` và `scripts/png.test.ts`.

Run: `git rm scripts/make-icons.ts scripts/png.ts scripts/png.test.ts`

Trong `package.json` xóa dòng `"icons": "bun scripts/make-icons.ts",` trong `scripts`.

- [ ] **Step 8: Thêm bước 20 vào `docs/device-checklist.md`**

Thêm cuối file:

```markdown
## Bước 20 — Kim Bun: tên và icon (UI đợt 1)

1. Trên iPhone đã cài app cũ: xóa biểu tượng cũ khỏi màn hình chính, mở `bunkid.vercel.app` bằng Safari, Chia sẻ → Thêm vào MH chính. Kỳ vọng: tên gợi ý "Kim Bun", biểu tượng bánh bao trên nền đào–hồng; tab Safari hiện favicon bánh bao.
2. Gửi một thông báo thử (nhắc bú). Kỳ vọng: thông báo có biểu tượng bánh bao.

Kết quả: Chờ người dùng.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 9: Chạy test để thấy xanh**

Run: `bun run test lib/brand scripts/sw.test.ts && bun run typecheck`
Expected: PASS; typecheck không lỗi.

- [ ] **Step 10: Commit**

```bash
git add -A public/manifest.webmanifest app/layout.tsx sw/sw.template.js scripts package.json lib/brand/manifest.test.ts docs/device-checklist.md
git commit -m "feat(brand): wire Kim Bun icons into manifest, head and service worker"
```

---

## Kết thúc M1

- [ ] Chạy lần cuối: `bun run test && bun run typecheck`. Expected: xanh.
- [ ] Bước 20 trong `docs/device-checklist.md` để "Chờ người dùng", không đánh "Đạt".
