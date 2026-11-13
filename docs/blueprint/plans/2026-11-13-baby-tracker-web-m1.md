# Baby Tracker Web — M1 (Nền tảng, đăng nhập, spike iPhone) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-13

**Goal:** Dựng PWA Next.js + Supabase có schema, RLS, đăng nhập Google và tạo gia đình, deploy lên Vercel, và kiểm chứng đăng nhập Google trong PWA standalone trên iPhone thật trước khi xây tiếp.

**Architecture:** Mọi trang là client-rendered shell; client gọi thẳng Supabase bằng `supabase-js` (PKCE, phiên trong `localStorage`), RLS trong Postgres là ranh giới bảo mật duy nhất. Logic nghiệp vụ là hàm thuần trong `lib/rules/` có Vitest. Schema, RLS và RPC nằm trong `supabase/migrations/`, kiểm bằng pgTAP trên Supabase local.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.3, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, Vitest 5.0.5, Supabase CLI 2.122.0 (devDependency), Bun 1.4.x, pgTAP.

**Milestones của đợt phát hành 1:** M1 nền tảng + đăng nhập + spike iPhone · M2 quy tắc thuần + khai báo bé · M3 trang chủ ghi chép · M4 đánh giá, cảnh báo, nhật ký, thống kê, Realtime, cài đặt · M5 service worker, offline outbox, Web Push. Mỗi milestone một file plan, làm theo thứ tự; M4–M5 lập plan sau khi M3 xong.

**Lệch so với spec (người dùng đã duyệt 2026-11-13):** Spec §4.1/§5.2 chỉ cho member sửa bản ghi của chính mình, nên member không dừng được đồng hồ người khác bấm. M1 thêm RPC `stop_timer(p_log_id uuid, p_ended_at timestamptz)` (security definer): mọi thành viên được dừng một đồng hồ đang chạy, RPC chỉ ghi `ended_at`, không cho sửa gì khác.

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

Từ spec §2.2 (áp dụng cho M1–M3) và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7.
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component (`'use client'`), tự kiểm tra phiên ở client.
- `supabase-js` khởi tạo với `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.
- OAuth callback là trang client `/auth/callback`.
- Toàn bộ logic nghiệp vụ là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Tuổi của bé tính bằng số ngày: `ageDays = (ngày hiện tại theo giờ VN) − dob`.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Cột `created_by` có `default auth.uid()`; client không bao giờ gửi `created_by`.
- Tên route: `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`, `/`.
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`; Vitest 5 cần Node ^22.12). Dev-only `vite` 7.3.7 ghim chính xác vì là peer dependency bắt buộc của Vitest 5.
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x. Thêm thư viện khác phải ghi lý do trong plan.
- Không dùng Workbox, Serwist, `next-pwa`: service worker viết tay ở `public/sw.js` (M5).
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.

## Contracts with Other Plans

**Consumes:** không có (M1 là plan đầu tiên của unit `web`).

**Produces** (M2–M5 và unit `ios` dùng lại, không tạo lại):

- Bảng: `public.families`, `public.family_members`, `public.babies`, `public.logs` đúng cột ở spec §5 (các bảng còn lại của §5 do milestone cần nó thêm bằng migration chỉ-thêm).
- Trigger: `set_updated_at()`, `forbid_immutable_change(variadic cột)`, `keep_last_owner()`.
- Hàm SQL: `is_member(fam uuid) → boolean`, `is_owner(fam uuid) → boolean`, `baby_family(b uuid) → uuid`.
- RPC: `claim_membership() → setof families`, `can_create_family() → boolean`, `create_family(name text, display_name text) → families`, `stop_timer(p_log_id uuid, p_ended_at timestamptz) → logs`.
- TypeScript:
  - `lib/env.ts`: `parsePublicEnv`, `publicEnv(): PublicEnv`
  - `lib/supabase/client.ts`: `supabase(): SupabaseClient<Database>`
  - `lib/supabase/types.ts`: `Database`, `Json` (sinh bằng `bun run db:types`)
  - `lib/supabase/rows.ts`: `Family`, `FamilyMember`, `Baby`, `LogRow`
  - `lib/data/session.ts`: `useSession(): { session: Session | null; loading: boolean }`
  - `lib/data/family.ts`: `type FamilyContext = { family: Family; member: FamilyMember; baby: Baby | null } | null`, `fetchFamilyContext(userId)`, `useFamilyContext(userId)` (key `['family-context', userId]`), `useMembers(familyId)` (key `['members', familyId]`)
  - `lib/routing.ts`: `Landing`, `GateNeed`, `resolveLanding`, `gateRedirect`
  - `components/AuthGate.tsx`: `<AuthGate need={GateNeed}>{(state: GateState) => ReactNode}</AuthGate>`, `type GateState = { session: Session | null; ctx: FamilyContext }`
  - `components/Providers.tsx`: `Providers` (QueryClientProvider, đã bọc trong `app/layout.tsx`)
- Scripts `package.json`: `dev`, `build`, `typecheck`, `test`, `icons`, `db:start`, `db:reset`, `db:test`, `db:types`.
- Deploy: repo GitHub nối Vercel, `APP_URL`, Supabase cloud đã `db push`, `docs/device-checklist.md` có kết quả Bước 0.

## File Structure

```
package.json, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts
.gitignore, .env.example, README.md
app/layout.tsx, app/globals.css, app/page.tsx (trang tạm, M3 thay)
app/dang-nhap/page.tsx, app/auth/callback/page.tsx, app/chua-duoc-moi/page.tsx
components/Providers.tsx, components/AuthGate.tsx
components/auth/LoginScreen.tsx, components/auth/NotInvited.tsx
lib/env.ts, lib/routing.ts
lib/supabase/client.ts, types.ts (sinh), rows.ts
lib/data/session.ts, family.ts
scripts/png.ts, scripts/make-icons.ts
public/manifest.webmanifest, public/icons/{icon-192,icon-512,apple-touch-icon}.png
supabase/config.toml (sinh), supabase/migrations/*.sql, supabase/tests/*.test.sql
docs/device-checklist.md
```

## Tasks

1. Khởi tạo dự án (Next.js, Tailwind, Vitest, env, icon, manifest)
2. Schema Postgres + trigger + pgTAP
3. RLS, RPC + pgTAP, sinh type TypeScript
4. Luồng đăng nhập Google + gia đình + deploy + spike trên iPhone

---

### Task 1: Khởi tạo dự án

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`, `README.md`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `lib/env.ts`, `scripts/png.ts`, `scripts/make-icons.ts`, `public/manifest.webmanifest`
- Test: `lib/env.test.ts`, `scripts/png.test.ts`

**Interfaces:**

- Consumes: không có
- Produces: `parsePublicEnv(raw: Record<string, string | undefined>): PublicEnv`, `publicEnv(): PublicEnv`, `type PublicEnv = { NEXT_PUBLIC_SUPABASE_URL: string; NEXT_PUBLIC_SUPABASE_ANON_KEY: string }`; `solidPng(size: number, rgb: [number, number, number]): Buffer`; alias import `@/*` → thư mục gốc.

- [ ] **Step 1: Khởi tạo git và cấu hình gói**

Run: `cd /Users/phuc.phamv/Documents/other/bun-kid && git init -b main`
Expected: `Initialized empty Git repository`

Tạo `package.json`:

```json
{
  "name": "be-yeu",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "icons": "bun scripts/make-icons.ts",
    "db:start": "supabase start",
    "db:reset": "supabase db reset",
    "db:test": "supabase test db",
    "db:types": "supabase gen types typescript --local --schema public > lib/supabase/types.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "2.118.0",
    "@tanstack/react-query": "5.105.0",
    "next": "16.4.3",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "zod": "4.6.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "22.20.5",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "supabase": "2.122.0",
    "tailwindcss": "4.3.3",
    "typescript": "5.9.3",
    "vite": "7.3.7",
    "vitest": "5.0.5"
  },
  "engines": { "node": "22.x" },
  "trustedDependencies": ["supabase"]
}
```

`vite` có mặt vì là peer dependency bắt buộc của Vitest 5 (ghim để không bị cài bản trôi). `trustedDependencies` cần vì Bun mặc định chặn script `postinstall` (gói `supabase` tải binary CLI trong `postinstall`).

Tạo `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "supabase"]
}
```

Tạo `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

Tạo `postcss.config.mjs`:

```js
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

Tạo `vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
```

Tạo `.gitignore`:

```
node_modules/
.next/
next-env.d.ts
*.tsbuildinfo
.env*.local
.vercel/
supabase/.branches/
supabase/.temp/
```

Tạo `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run: `bun install`
Expected: cài xong không lỗi; `bunx supabase --version` in ra `2.122.0`.

- [ ] **Step 2: Viết test thất bại cho env và PNG**

Tạo `lib/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/lib/env";

describe("parsePublicEnv", () => {
  it("returns the values when both are valid", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.x",
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
  });

  it("names every missing variable in the error", () => {
    expect(() => parsePublicEnv({})).toThrow(
      "Thiếu hoặc sai biến môi trường: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("rejects a URL that is not a URL", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "abc",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.x",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });
});
```

Tạo `scripts/png.test.ts`:

```ts
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { solidPng } from "./png";

describe("solidPng", () => {
  it("writes the PNG signature and the requested size", () => {
    const png = solidPng(16, [242, 140, 160]);
    expect([...png.subarray(0, 8)]).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(png.subarray(12, 16).toString("ascii")).toBe("IHDR");
    expect(png.readUInt32BE(16)).toBe(16);
    expect(png.readUInt32BE(20)).toBe(16);
  });

  it("fills every pixel with the colour", () => {
    const png = solidPng(2, [1, 2, 3]);
    const idatStart = png.indexOf("IDAT") + 4;
    const idatLength = png.readUInt32BE(idatStart - 8);
    const raw = inflateSync(png.subarray(idatStart, idatStart + idatLength));
    expect([...raw]).toEqual([0, 1, 2, 3, 1, 2, 3, 0, 1, 2, 3, 1, 2, 3]);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `bun run test`
Expected: FAIL — `Failed to resolve import "@/lib/env"` và `Failed to resolve import "./png"`.

- [ ] **Step 4: Viết code tối thiểu**

Tạo `lib/env.ts`:

```ts
import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

export type PublicEnv = z.infer<typeof PublicEnvSchema>;

export function parsePublicEnv(
  raw: Record<string, string | undefined>,
): PublicEnv {
  const result = PublicEnvSchema.safeParse(raw);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Thiếu hoặc sai biến môi trường: ${names.join(", ")}`);
  }
  return result.data;
}

export function publicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
```

`process.env.NEXT_PUBLIC_*` phải viết nguyên văn như trên để Next.js nhúng giá trị lúc build.

Tạo `scripts/png.ts`:

```ts
import { deflateSync } from "node:zlib";

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

export function solidPng(
  size: number,
  [r, g, b]: [number, number, number],
): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour RGB
  const row = Buffer.alloc(1 + size * 3);
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
```

Tạo `scripts/make-icons.ts`:

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { solidPng } from "./png";

const PINK: [number, number, number] = [242, 140, 160];
mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", solidPng(192, PINK));
writeFileSync("public/icons/icon-512.png", solidPng(512, PINK));
writeFileSync("public/icons/apple-touch-icon.png", solidPng(180, PINK));
console.log("Đã tạo 3 icon trong public/icons");
```

- [ ] **Step 5: Chạy test, xác nhận đạt**

Run: `bun run test`
Expected: PASS — 5 test đạt (`lib/env.test.ts` 3, `scripts/png.test.ts` 2).

- [ ] **Step 6: Tạo icon, manifest và khung giao diện**

Run: `bun run icons`
Expected: `Đã tạo 3 icon trong public/icons`

Tạo `public/manifest.webmanifest`:

```json
{
  "name": "Bé Yêu",
  "short_name": "Bé Yêu",
  "lang": "vi",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f28ca0",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Tạo `app/globals.css`:

```css
@import "tailwindcss";

html {
  -webkit-text-size-adjust: 100%;
}

body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

Tạo `app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bé Yêu",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Bé Yêu", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f28ca0",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

Tạo `app/page.tsx` (M3 sẽ thay bằng trang chủ thật):

```tsx
export default function Page() {
  return <main className="p-6 text-2xl font-semibold">Bé Yêu</main>;
}
```

Tạo `README.md`:

````markdown
# Bé Yêu

PWA theo dõi chăm sóc bé. Spec: `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md`.

## Chạy local

```bash
bun install
cp .env.example .env.local   # điền URL và anon key của Supabase project
bun run dev
```

## Kiểm thử

```bash
bun run test        # Vitest cho lib/rules và scripts
bun run db:start    # cần OrbStack/Docker đang chạy
bun run db:test     # pgTAP cho schema và RLS
```
````

- [ ] **Step 7: Kiểm tra type và build**

Run: `bun run typecheck && bun run build`
Expected: không lỗi TypeScript; `next build` in `✓ Compiled successfully` và liệt kê route `/`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js PWA with Tailwind, Vitest, env parsing and icons"
```

---

### Task 2: Schema Postgres + trigger + pgTAP

**Files:**

- Create: `supabase/config.toml` (sinh bởi CLI), `supabase/migrations/20261113000100_schema.sql`
- Test: `supabase/tests/001_schema.test.sql`

**Interfaces:**

- Consumes: Supabase CLI từ Task 1 (`bun run db:start`, `db:reset`, `db:test`)
- Produces: bảng `families`, `family_members`, `babies`, `logs` (đã bật RLS, chưa có policy → mặc định chặn hết); unique index `logs_one_running_timer (baby_id, type) where ended_at is null`; hàm trigger `set_updated_at()`, `forbid_immutable_change()`, `keep_last_owner()`; lỗi `immutable_column: <cột>` và `last_owner` (SQLSTATE `P0001`).

- [ ] **Step 1: Bật Docker và khởi tạo Supabase local**

Run: `open -a OrbStack && bunx supabase init`
Expected: tạo `supabase/config.toml`, in `Finished supabase init.`

Run: `bun run db:start`
Expected: lần đầu tải image (vài phút), cuối cùng in `Started supabase local development setup.` kèm `API URL: http://127.0.0.1:54321`.

- [ ] **Step 2: Viết test pgTAP thất bại**

Tạo `supabase/tests/001_schema.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table('public', 'families', 'families exists');
select has_table('public', 'family_members', 'family_members exists');
select has_table('public', 'babies', 'babies exists');
select has_table('public', 'logs', 'logs exists');

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'me@example.com');
insert into public.families (id, name) values ('10000000-0000-0000-0000-000000000001', 'Nhà A');
insert into public.family_members (family_id, email, user_id, role, display_name)
  values ('10000000-0000-0000-0000-000000000001', 'me@example.com', '00000000-0000-0000-0000-0000000000a1', 'owner', 'Mẹ');
insert into public.babies (id, family_id, name, dob, sex)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bé', '2026-09-13', 'female');
insert into public.logs (id, baby_id, type, started_at, created_by)
  values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'sleep', now(), '00000000-0000-0000-0000-0000000000a1');

select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, created_by)
     values ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'sleep', now(), '00000000-0000-0000-0000-0000000000a1') $$,
  '23505', null, 'only one running timer per type per baby');

select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'diaper', now(), now() - interval '1 minute', '00000000-0000-0000-0000-0000000000a1') $$,
  '23514', null, 'ended_at must not precede started_at');

select throws_ok(
  $$ update public.logs set baby_id = '20000000-0000-0000-0000-000000000009'
     where id = '30000000-0000-0000-0000-000000000001' $$,
  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');

select throws_ok(
  $$ insert into public.family_members (family_id, email, role, display_name)
     values ('10000000-0000-0000-0000-000000000001', 'Dad@Example.com', 'member', 'Ba') $$,
  '23514', null, 'email must be stored lowercase');

select throws_ok(
  $$ delete from public.family_members where email = 'me@example.com' $$,
  'P0001', 'last_owner', 'cannot delete the last owner');

select * from finish();
rollback;
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `bun run db:test`
Expected: FAIL — `not ok 1 - families exists` (và lỗi `relation "public.families" does not exist` ở các câu insert).

- [ ] **Step 4: Viết migration**

Tạo `supabase/migrations/20261113000100_schema.sql`:

```sql
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  email text not null check (email = lower(email) and position('@' in email) > 1),
  user_id uuid references auth.users (id) on delete set null,
  role text not null check (role in ('owner', 'member')),
  display_name text not null check (length(trim(display_name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (family_id, email)
);
create index family_members_user_idx on public.family_members (user_id);

create table public.babies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  dob date not null,
  sex text not null check (sex in ('male', 'female')),
  birth_weight_g int check (birth_weight_g between 300 and 7000),
  birth_length_cm numeric(4, 1) check (birth_length_cm between 20 and 70),
  birth_head_cm numeric(4, 1) check (birth_head_cm between 15 and 50),
  blood_type text,
  allergies text,
  notes text,
  feed_interval_min int not null default 180 check (feed_interval_min between 60 and 360),
  vaccine_choices jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index babies_family_idx on public.babies (family_id);

create table public.logs (
  id uuid primary key,
  baby_id uuid not null references public.babies (id) on delete cascade,
  type text not null check (type in ('breast', 'bottle', 'sleep', 'diaper', 'medicine', 'temperature', 'pump', 'tummy')),
  started_at timestamptz not null,
  ended_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  note text,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index logs_baby_started_idx on public.logs (baby_id, started_at desc);
create unique index logs_one_running_timer on public.logs (baby_id, type) where ended_at is null;

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create function public.forbid_immutable_change() returns trigger
language plpgsql as $$
declare
  col text;
begin
  foreach col in array tg_argv loop
    if (to_jsonb(new) -> col) is distinct from (to_jsonb(old) -> col) then
      raise exception 'immutable_column: %', col using errcode = 'P0001';
    end if;
  end loop;
  return new;
end $$;

create function public.keep_last_owner() returns trigger
language plpgsql as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if not exists (
      select 1 from public.family_members
      where family_id = old.family_id and role = 'owner' and id <> old.id
    ) then
      -- Cascade from deleting the whole family: the parent row is already gone.
      if tg_op = 'DELETE' and not exists (select 1 from public.families where id = old.family_id) then
        return old;
      end if;
      raise exception 'last_owner' using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

create trigger babies_set_updated_at before update on public.babies
  for each row execute function public.set_updated_at();
create trigger logs_set_updated_at before update on public.logs
  for each row execute function public.set_updated_at();

create trigger babies_immutable before update on public.babies
  for each row execute function public.forbid_immutable_change('id', 'family_id');
create trigger family_members_immutable before update on public.family_members
  for each row execute function public.forbid_immutable_change('id', 'family_id');
create trigger logs_immutable before update on public.logs
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');

create trigger family_members_keep_owner before update or delete on public.family_members
  for each row execute function public.keep_last_owner();

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.babies enable row level security;
alter table public.logs enable row level security;
```

- [ ] **Step 5: Áp migration và chạy test**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `supabase/tests/001_schema.test.sql .. ok`, `All tests successful.`

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(db): families, members, babies, logs schema with integrity triggers"
```

---

### Task 3: RLS, RPC + pgTAP, sinh type TypeScript

**Files:**

- Create: `supabase/migrations/20261113000200_rls.sql`
- Create: `lib/supabase/types.ts` (sinh), `lib/supabase/rows.ts`
- Test: `supabase/tests/002_rls.test.sql`

**Interfaces:**

- Consumes: bảng và trigger từ Task 2
- Produces: `is_member(fam uuid)`, `is_owner(fam uuid)`, `baby_family(b uuid)`; RPC `claim_membership()`, `can_create_family()`, `create_family(name, display_name)`, `stop_timer(p_log_id, p_ended_at)`; lỗi `family_exists` (`P0001`), `permission_denied` (`42501`), `not_authenticated` (`28000`); type `Database`, `Json`; alias `Family`, `FamilyMember`, `Baby`, `LogRow`.

- [ ] **Step 1: Viết test pgTAP thất bại**

Tạo `supabase/tests/002_rls.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

-- Fixtures (run as the superuser that executes the test).
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@example.com'),
  ('cccccccc-0000-0000-0000-000000000001', 'c@example.com'),
  ('dddddddd-0000-0000-0000-000000000001', 'd@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000001', 'Nhà A');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000001', 'a@example.com', 'aaaaaaaa-0000-0000-0000-000000000001', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000001', 'b@example.com', 'bbbbbbbb-0000-0000-0000-000000000001', 'member', 'Bà'),
  ('f0000000-0000-0000-0000-000000000001', 'd@example.com', null, 'member', 'Ba'),
  ('f0000000-0000-0000-0000-000000000001', 'e@example.com', null, 'member', 'Cô');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Bé', '2026-09-13', 'female');
insert into public.logs (id, baby_id, type, started_at, ended_at, created_by) values
  ('1a000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000001', 'sleep', now() - interval '1 hour', null, 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('1b000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000001', 'diaper', now(), now(), 'bbbbbbbb-0000-0000-0000-000000000001');

-- As C (signed in, not in any family)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000001","email":"c@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.logs', 'outsider sees no logs');
select is_empty('select id from public.babies', 'outsider sees no babies');
select is_empty('select id from public.families', 'outsider sees no families');
select is_empty('select id from public.family_members', 'outsider sees no members');
select is(public.can_create_family(), false, 'cannot create a family once one exists');
select throws_ok($$ select public.create_family('Nhà C', 'Ba') $$, 'P0001', 'family_exists', 'create_family refuses when a family exists');
select throws_ok(
  $$ select public.stop_timer('1a000000-0000-0000-0000-000000000001', now()) $$,
  '42501', 'permission_denied', 'outsider cannot stop a timer');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","email":"b@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.logs), 2, 'member sees every log of the family');
select lives_ok($$ update public.logs set note = 'b' where id = '1a000000-0000-0000-0000-000000000001' $$, 'update of another member log runs without error');
select lives_ok($$ update public.logs set note = 'b' where id = '1b000000-0000-0000-0000-000000000001' $$, 'member updates own log');
select lives_ok($$ delete from public.logs where id = '1a000000-0000-0000-0000-000000000001' $$, 'delete of another member log runs without error');
select throws_ok(
  $$ insert into public.family_members (family_id, email, role, display_name)
     values ('f0000000-0000-0000-0000-000000000001', 'x@example.com', 'member', 'X') $$,
  '42501', null, 'member cannot add a Gmail');
select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('1c000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000001', 'diaper', now(), now(), 'aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', null, 'member cannot insert a log on behalf of someone else');
select isnt(
  (select ended_at from public.stop_timer('1a000000-0000-0000-0000-000000000001', now())),
  null, 'member can stop a timer another person started');
reset role;

select is((select note from public.logs where id = '1a000000-0000-0000-0000-000000000001'), null, 'member update of another log changed nothing');
select is((select count(*)::int from public.logs where id = '1a000000-0000-0000-0000-000000000001'), 1, 'member delete of another log removed nothing');
select is((select note from public.logs where id = '1b000000-0000-0000-0000-000000000001'), 'b', 'member update of own log applied');

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","email":"a@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ update public.logs set note = 'by-owner' where id = '1b000000-0000-0000-0000-000000000001' $$, 'owner updates a member log');
select throws_ok(
  $$ delete from public.family_members where email = 'a@example.com' $$,
  'P0001', 'last_owner', 'owner cannot remove the last owner');
reset role;
select is((select note from public.logs where id = '1b000000-0000-0000-0000-000000000001'), 'by-owner', 'owner update applied');

-- As D (invited, first sign-in)
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000001","email":"D@Example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.claim_membership()), 1, 'claim_membership returns the family');
reset role;
select is(
  (select user_id from public.family_members where email = 'd@example.com'),
  'dddddddd-0000-0000-0000-000000000001'::uuid, 'claim_membership links the matching email (case-insensitive)');
select is(
  (select user_id from public.family_members where email = 'e@example.com'),
  null, 'claim_membership leaves other emails alone');

-- Empty database: the first person may create a family
delete from public.families;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000001","email":"c@example.com","role":"authenticated"}', true);
set local role authenticated;
select is(public.can_create_family(), true, 'can create a family when none exists');
select lives_ok($$ select public.create_family('Nhà C', 'Ba') $$, 'create_family succeeds on an empty database');
reset role;
select is(
  (select count(*)::int from public.family_members where user_id = 'cccccccc-0000-0000-0000-000000000001' and role = 'owner'),
  1, 'creator becomes the owner');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `bun run db:test`
Expected: FAIL — `002_rls.test.sql` báo `function public.can_create_family() does not exist` ở test 5 (test 1–4 có thể đạt vì RLS đã chặn hết).

- [ ] **Step 3: Viết migration RLS và RPC**

Tạo `supabase/migrations/20261113000200_rls.sql`:

```sql
create function public.is_member(fam uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = fam and m.user_id = auth.uid()
  );
$$;

create function public.is_owner(fam uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = fam and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

create function public.baby_family(b uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select family_id from public.babies where id = b;
$$;

-- families
create policy families_select on public.families for select to authenticated
  using (public.is_member(id));
create policy families_update on public.families for update to authenticated
  using (public.is_owner(id)) with check (public.is_owner(id));

-- family_members
create policy family_members_select on public.family_members for select to authenticated
  using (public.is_member(family_id));
create policy family_members_insert on public.family_members for insert to authenticated
  with check (public.is_owner(family_id));
create policy family_members_update on public.family_members for update to authenticated
  using (public.is_owner(family_id)) with check (public.is_owner(family_id));
create policy family_members_delete on public.family_members for delete to authenticated
  using (public.is_owner(family_id));

-- babies
create policy babies_select on public.babies for select to authenticated
  using (public.is_member(family_id));
create policy babies_insert on public.babies for insert to authenticated
  with check (public.is_owner(family_id));
create policy babies_update on public.babies for update to authenticated
  using (public.is_owner(family_id)) with check (public.is_owner(family_id));
create policy babies_delete on public.babies for delete to authenticated
  using (public.is_owner(family_id));

-- logs
create policy logs_select on public.logs for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy logs_insert on public.logs for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy logs_update on public.logs for update to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  )
  with check (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
create policy logs_delete on public.logs for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );

-- RPC
create function public.claim_membership() returns setof public.families
language plpgsql security definer set search_path = '' as $$
declare
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.family_members set user_id = auth.uid()
    where email = em and user_id is null;
  return query
    select f.* from public.families f
    join public.family_members m on m.family_id = f.id
    where m.user_id = auth.uid()
    order by f.created_at;
end $$;

create function public.can_create_family() returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.families);
$$;

create function public.create_family(name text, display_name text) returns public.families
language plpgsql security definer set search_path = '' as $$
declare
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  fam public.families;
begin
  if auth.uid() is null or em = '' then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  lock table public.families in exclusive mode;
  if exists (select 1 from public.families) then
    raise exception 'family_exists' using errcode = 'P0001';
  end if;
  insert into public.families (name) values (create_family.name) returning * into fam;
  insert into public.family_members (family_id, email, user_id, role, display_name)
    values (fam.id, em, auth.uid(), 'owner', create_family.display_name);
  return fam;
end $$;

-- Deviation from spec (approved in plan M1): any member may stop a running timer.
create function public.stop_timer(p_log_id uuid, p_ended_at timestamptz) returns public.logs
language plpgsql security definer set search_path = '' as $$
declare
  l public.logs;
begin
  select * into l from public.logs where id = p_log_id for update;
  if not found or not public.is_member(public.baby_family(l.baby_id)) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
  if l.ended_at is null then
    update public.logs set ended_at = greatest(p_ended_at, l.started_at)
      where id = p_log_id returning * into l;
  end if;
  return l;
end $$;

revoke execute on function
  public.is_member(uuid), public.is_owner(uuid), public.baby_family(uuid),
  public.claim_membership(), public.can_create_family(), public.create_family(text, text),
  public.stop_timer(uuid, timestamptz)
  from public, anon;
grant execute on function
  public.is_member(uuid), public.is_owner(uuid), public.baby_family(uuid),
  public.claim_membership(), public.can_create_family(), public.create_family(text, text),
  public.stop_timer(uuid, timestamptz)
  to authenticated;
```

- [ ] **Step 4: Áp migration và chạy test**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001_schema.test.sql .. ok`, `002_rls.test.sql .. ok`, `All tests successful.`

Nếu test `can create a family when none exists` lỗi `last_owner` ở câu `delete from public.families`: trigger `keep_last_owner` đang thấy dòng `families` cha trong lúc cascade. Sửa bằng cách đổi điều kiện thoát sớm thành `if tg_op = 'DELETE' and pg_trigger_depth() > 1 then return old; end if;` trong migration Task 2, rồi chạy lại bước này.

- [ ] **Step 5: Sinh type TypeScript và alias**

Run: `mkdir -p lib/supabase && bun run db:types`
Expected: `lib/supabase/types.ts` được tạo, có `export type Database` và `export type Json`; `grep -c stop_timer lib/supabase/types.ts` in số ≥ 1.

Tạo `lib/supabase/rows.ts`:

```ts
import type { Database } from "./types";

type Tables = Database["public"]["Tables"];

export type Family = Tables["families"]["Row"];
export type FamilyMember = Tables["family_members"]["Row"];
export type Baby = Tables["babies"]["Row"];
export type LogRow = Tables["logs"]["Row"];
```

Run: `bun run typecheck`
Expected: không lỗi.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(db): RLS policies, membership RPCs, stop_timer and generated types"
```

---

### Task 4: Đăng nhập Google + gia đình + deploy + spike trên iPhone

**Files:**

- Create: `lib/routing.ts`, `lib/supabase/client.ts`, `lib/data/session.ts`, `lib/data/family.ts`
- Create: `components/Providers.tsx`, `components/AuthGate.tsx`, `components/auth/LoginScreen.tsx`, `components/auth/NotInvited.tsx`
- Create: `app/dang-nhap/page.tsx`, `app/auth/callback/page.tsx`, `app/chua-duoc-moi/page.tsx`, `docs/device-checklist.md`
- Modify: `app/layout.tsx` (bọc `Providers`), `README.md` (thêm mục Thiết lập)
- Test: `lib/routing.test.ts`

**Interfaces:**

- Consumes: `publicEnv()` (Task 1); `Database`, `Family`, `FamilyMember`, `Baby` (Task 3); RPC `claim_membership`, `can_create_family`, `create_family` (Task 3)
- Produces:
  - `type Landing = '/dang-nhap' | '/chua-duoc-moi' | '/khai-bao-be' | '/'`
  - `type GateNeed = 'anonymous' | 'no-family' | 'family' | 'baby'`
  - `resolveLanding(s: { hasSession: boolean; hasFamily: boolean; hasBaby: boolean }): Landing`
  - `gateRedirect(need: GateNeed, landing: Landing): Landing | null`
  - `supabase(): SupabaseClient<Database>`
  - `useSession(): { session: Session | null; loading: boolean }`
  - `type FamilyContext = { family: Family; member: FamilyMember; baby: Baby | null } | null`
  - `fetchFamilyContext(userId: string): Promise<FamilyContext>`, `useFamilyContext(userId: string | undefined)` (query key `['family-context', userId]`)
  - `useMembers(familyId: string)` (query key `['members', familyId]`, trả `FamilyMember[]`)
  - `<AuthGate need={GateNeed}>{(state: GateState) => ReactNode}</AuthGate>`, `type GateState = { session: Session | null; ctx: FamilyContext }`

- [ ] **Step 1: Viết test thất bại cho routing**

Tạo `lib/routing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { gateRedirect, resolveLanding } from "@/lib/routing";

describe("resolveLanding", () => {
  it("sends a signed-out user to the login page", () => {
    expect(
      resolveLanding({ hasSession: false, hasFamily: false, hasBaby: false }),
    ).toBe("/dang-nhap");
  });
  it("sends a signed-in user without a family to the not-invited page", () => {
    expect(
      resolveLanding({ hasSession: true, hasFamily: false, hasBaby: false }),
    ).toBe("/chua-duoc-moi");
  });
  it("sends a family without a baby to onboarding", () => {
    expect(
      resolveLanding({ hasSession: true, hasFamily: true, hasBaby: false }),
    ).toBe("/khai-bao-be");
  });
  it("sends a complete family home", () => {
    expect(
      resolveLanding({ hasSession: true, hasFamily: true, hasBaby: true }),
    ).toBe("/");
  });
});

describe("gateRedirect", () => {
  it("lets each page render only for its own landing", () => {
    expect(gateRedirect("anonymous", "/dang-nhap")).toBeNull();
    expect(gateRedirect("no-family", "/chua-duoc-moi")).toBeNull();
    expect(gateRedirect("family", "/khai-bao-be")).toBeNull();
    expect(gateRedirect("baby", "/")).toBeNull();
  });
  it("redirects to the landing everywhere else", () => {
    expect(gateRedirect("anonymous", "/")).toBe("/");
    expect(gateRedirect("no-family", "/khai-bao-be")).toBe("/khai-bao-be");
    expect(gateRedirect("family", "/dang-nhap")).toBe("/dang-nhap");
    expect(gateRedirect("baby", "/chua-duoc-moi")).toBe("/chua-duoc-moi");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `bun run test lib/routing.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/routing"`.

- [ ] **Step 3: Viết `lib/routing.ts`**

```ts
export type Landing = "/dang-nhap" | "/chua-duoc-moi" | "/khai-bao-be" | "/";
export type GateNeed = "anonymous" | "no-family" | "family" | "baby";

export function resolveLanding(s: {
  hasSession: boolean;
  hasFamily: boolean;
  hasBaby: boolean;
}): Landing {
  if (!s.hasSession) return "/dang-nhap";
  if (!s.hasFamily) return "/chua-duoc-moi";
  if (!s.hasBaby) return "/khai-bao-be";
  return "/";
}

const PAGE_FOR_NEED: Record<GateNeed, Landing> = {
  anonymous: "/dang-nhap",
  "no-family": "/chua-duoc-moi",
  family: "/khai-bao-be",
  baby: "/",
};

export function gateRedirect(need: GateNeed, landing: Landing): Landing | null {
  return PAGE_FOR_NEED[need] === landing ? null : landing;
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `bun run test lib/routing.test.ts`
Expected: PASS — 6 test đạt.

- [ ] **Step 5: Supabase client, session, family context**

Tạo `lib/supabase/client.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "./types";

let client: SupabaseClient<Database> | null = null;

export function supabase(): SupabaseClient<Database> {
  if (!client) {
    const env = publicEnv();
    client = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }
  return client;
}
```

Tạo `lib/data/session.ts`:

```ts
"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useSession(): { session: Session | null; loading: boolean } {
  const [state, setState] = useState<{
    session: Session | null;
    loading: boolean;
  }>({
    session: null,
    loading: true,
  });

  useEffect(() => {
    const sb = supabase();
    // getSession() waits for supabase-js to finish the PKCE code exchange on /auth/callback.
    sb.auth
      .getSession()
      .then(({ data }) => setState({ session: data.session, loading: false }));
    const { data } = sb.auth.onAuthStateChange((_event, session) =>
      setState({ session, loading: false }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
```

Tạo `lib/data/family.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Baby, Family, FamilyMember } from "@/lib/supabase/rows";

export type FamilyContext = {
  family: Family;
  member: FamilyMember;
  baby: Baby | null;
} | null;

export async function fetchFamilyContext(
  userId: string,
): Promise<FamilyContext> {
  const sb = supabase();
  const { data: families, error } = await sb.rpc("claim_membership");
  if (error) throw error;
  const family = families?.[0];
  if (!family) return null;

  const { data: member, error: memberError } = await sb
    .from("family_members")
    .select("*")
    .eq("family_id", family.id)
    .eq("user_id", userId)
    .single();
  if (memberError) throw memberError;

  const { data: babies, error: babyError } = await sb
    .from("babies")
    .select("*")
    .eq("family_id", family.id)
    .order("created_at")
    .limit(1);
  if (babyError) throw babyError;

  return { family, member, baby: babies[0] ?? null };
}

export function useFamilyContext(userId: string | undefined) {
  return useQuery({
    queryKey: ["family-context", userId],
    queryFn: () => fetchFamilyContext(userId as string),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useMembers(familyId: string) {
  return useQuery({
    queryKey: ["members", familyId],
    queryFn: async (): Promise<FamilyMember[]> => {
      const { data, error } = await supabase()
        .from("family_members")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });
}
```

- [ ] **Step 6: Providers, AuthGate và các trang đăng nhập**

Tạo `components/Providers.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

Sửa `app/layout.tsx`: thêm `import { Providers } from '@/components/Providers';` và đổi phần `body` thành:

```tsx
<body className="min-h-dvh bg-white text-neutral-900 antialiased">
  <Providers>{children}</Providers>
</body>
```

Tạo `components/AuthGate.tsx`:

```tsx
"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useFamilyContext, type FamilyContext } from "@/lib/data/family";
import { useSession } from "@/lib/data/session";
import { gateRedirect, resolveLanding, type GateNeed } from "@/lib/routing";

export type GateState = { session: Session | null; ctx: FamilyContext };

export function AuthGate({
  need,
  children,
}: {
  need: GateNeed;
  children: (state: GateState) => ReactNode;
}) {
  const router = useRouter();
  const { session, loading } = useSession();
  const family = useFamilyContext(session?.user.id);
  const ready = !loading && (!session || family.isSuccess);
  const landing = ready
    ? resolveLanding({
        hasSession: Boolean(session),
        hasFamily: Boolean(family.data),
        hasBaby: Boolean(family.data?.baby),
      })
    : null;
  const redirect = landing ? gateRedirect(need, landing) : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (session && family.isError) {
    return (
      <main className="p-6 text-center">
        <p className="mb-4">Không tải được dữ liệu gia đình.</p>
        <button
          type="button"
          className="min-h-11 rounded-xl bg-pink-500 px-4 text-white"
          onClick={() => family.refetch()}
        >
          Thử lại
        </button>
      </main>
    );
  }
  if (!ready || redirect)
    return <main className="p-6 text-center text-neutral-500">Đang tải…</main>;
  return <>{children({ session, ctx: family.data ?? null })}</>;
}
```

Tạo `components/auth/LoginScreen.tsx`:

```tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">Bé Yêu</h1>
      <p className="text-neutral-600">
        Theo dõi bú, ngủ, tã của bé cùng cả nhà.
      </p>
      <button
        type="button"
        onClick={signIn}
        className="min-h-12 rounded-2xl bg-pink-500 text-lg font-medium text-white"
      >
        Đăng nhập bằng Google
      </button>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </main>
  );
}
```

Tạo `components/auth/NotInvited.tsx`:

```tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
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
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Bạn chưa được mời</h1>
      <p>
        Đang đăng nhập: <strong>{email}</strong>
      </p>
      <p className="text-neutral-600">
        Nhờ ba/mẹ của bé thêm Gmail này vào gia đình.
      </p>

      {canCreate.data === true && (
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-2xl border border-pink-200 p-4"
        >
          <h2 className="font-medium">Tạo gia đình</h2>
          <label className="flex flex-col gap-1">
            Tên gia đình
            <input
              className="min-h-11 rounded-xl border px-3"
              maxLength={80}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            Bạn là (ví dụ Mẹ, Ba)
            <input
              className="min-h-11 rounded-xl border px-3"
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={create.isPending}
            className="min-h-11 rounded-xl bg-pink-500 text-white disabled:opacity-50"
          >
            Tạo gia đình
          </button>
          {create.isError && (
            <p role="alert" className="text-red-600">
              Không tạo được gia đình. Thử lại sau.
            </p>
          )}
        </form>
      )}

      <button
        type="button"
        onClick={() => supabase().auth.signOut()}
        className="min-h-11 rounded-xl border"
      >
        Đăng xuất
      </button>
    </main>
  );
}
```

Tạo `app/dang-nhap/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { LoginScreen } from "@/components/auth/LoginScreen";

export default function Page() {
  return <AuthGate need="anonymous">{() => <LoginScreen />}</AuthGate>;
}
```

Tạo `app/auth/callback/page.tsx` (sau khi `supabase-js` đổi `code` lấy phiên, `AuthGate` tự chuyển trang; còn ở lại trang này nghĩa là đăng nhập thất bại):

```tsx
"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";

export default function Page() {
  return (
    <AuthGate need="anonymous">
      {() => (
        <main className="mx-auto max-w-md p-6 text-center">
          <p className="mb-4">Đăng nhập không thành công.</p>
          <Link href="/dang-nhap" className="text-pink-600 underline">
            Thử lại
          </Link>
        </main>
      )}
    </AuthGate>
  );
}
```

Tạo `app/chua-duoc-moi/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { NotInvited } from "@/components/auth/NotInvited";

export default function Page() {
  return (
    <AuthGate need="no-family">
      {({ session }) => <NotInvited email={session?.user.email ?? ""} />}
    </AuthGate>
  );
}
```

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; mọi test Vitest đạt; `next build` liệt kê route `/`, `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`.

- [ ] **Step 7: 👤 Người dùng thiết lập Supabase cloud, Google OAuth, Vercel**

Implementer **dừng lại và nhờ người dùng** làm các bước này (cần tài khoản của họ), rồi nhận lại `APP_URL`, Supabase URL và anon key:

1. Tạo Supabase project, region `ap-southeast-1` (Singapore). Lấy Project URL, anon key, project ref.
2. Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application). Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. Supabase → Authentication → Providers → Google: bật, dán Client ID và Client Secret.
3. Tạo repo GitHub riêng tư, rồi implementer chạy: `git remote add origin <url> && git push -u origin main`.
4. Vercel → Add New Project → import repo. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Deploy. Ghi lại `APP_URL` (ví dụ `https://be-yeu.vercel.app`).
5. Supabase → Authentication → URL Configuration: Site URL = `<APP_URL>`; Redirect URLs: `<APP_URL>/auth/callback` và `http://localhost:3000/auth/callback`.

Sau đó **người dùng** chạy trong terminal của họ (lệnh mở trình duyệt và hỏi mật khẩu DB, implementer không tự chạy được):

Run: `bunx supabase login && bunx supabase link --project-ref <project-ref> && bunx supabase db push`
Expected: `Applying migration 20261113000100_schema.sql...`, `Applying migration 20261113000200_rls.sql...`, `Finished supabase db push.`

Tạo `.env.local` (không commit) với hai biến của project cloud. Run: `bun run dev`, mở `http://localhost:3000/dang-nhap`, bấm "Đăng nhập bằng Google".
Expected: đăng nhập xong quay về `http://localhost:3000/chua-duoc-moi` hiện đúng Gmail và form "Tạo gia đình" (database trống). **Chưa bấm Tạo gia đình.**

Thêm vào cuối `README.md`:

```markdown
## Thiết lập lần đầu

1. Supabase project (Singapore); bật Google provider với OAuth client Web, redirect `https://<ref>.supabase.co/auth/v1/callback`.
2. Supabase → Auth → URL Configuration: Site URL `<APP_URL>`, Redirect URLs `<APP_URL>/auth/callback`, `http://localhost:3000/auth/callback`.
3. `bunx supabase link --project-ref <ref> && bunx supabase db push`.
4. Vercel: import repo, đặt `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Người đăng nhập đầu tiên tạo gia đình và thành chủ nhà; Gmail khác phải được chủ nhà thêm.
6. Gói Supabase Free tạm dừng project sau 7 ngày không có hoạt động: vào dashboard bấm Restore.
```

- [ ] **Step 8: Commit và deploy**

```bash
git add -A && git commit -m "feat(auth): Google sign-in, family bootstrap and auth gate"
```

Run: `git push`
Expected: Vercel build xanh (Deployments → Ready).

- [ ] **Step 9: 👤 Spike trên iPhone thật (cổng chặn)**

Tạo `docs/device-checklist.md`:

```markdown
# Device checklist

Thiết bị: iPhone 11, iPhone 16, iPhone 17 Pro. Ghi Đạt / Không đạt, phiên bản iOS và ghi chú.

## Bước 0 — Đăng nhập Google trong PWA standalone (M1)

1. Safari mở `<APP_URL>/dang-nhap` → Chia sẻ → Thêm vào MH chính → mở từ biểu tượng.
2. Bấm "Đăng nhập bằng Google", hoàn tất đăng nhập.
3. Kỳ vọng: quay lại **bên trong** app (không phải tab Safari), trang "Bạn chưa được mời" hiện đúng Gmail.
4. Vuốt tắt hẳn app, mở lại từ biểu tượng. Kỳ vọng: vẫn ở trang có Gmail, không phải trang đăng nhập.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         |         |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

Implementer nhờ người dùng chạy Bước 0 trên ít nhất một iPhone và điền bảng.
Expected: cả 4 kỳ vọng đạt. **Nếu bước 3 hoặc 4 không đạt: dừng toàn bộ plan, báo người dùng kết quả, không làm M2–M5.**

Sau khi đạt, người dùng bấm "Tạo gia đình" trên iPhone. Expected: chuyển tới `/khai-bao-be`, trang này trả 404 cho tới khi xong M2.

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist with step 0 results"
```

---

## Ngoài phạm vi M1

- M2: quy tắc thuần `lib/rules/*` và trang `/khai-bao-be`.
- M3: trang chủ ghi chép (đồng hồ, nhập nhanh, nhật ký 24 giờ).
- M4: quy tắc §7.1–7.2, cảnh báo §7.4, Vitamin D, `/nhat-ky`, `/thong-ke`, Realtime §5.3, `/cai-dat`, `/cai-app`, thanh tab dưới, dòng "Cữ bú tiếp theo khoảng HH:mm" và "Bé đã thức X phút" (§6.2), trang lỗi "Máy chủ đang ngủ" khi Supabase tạm dừng (§10.1).
- M5: service worker §8.4, offline outbox §9, push `feed` §8, pg_cron + Vault, tạm tắt thông báo, checklist thiết bị bước 1–4 và 7.
