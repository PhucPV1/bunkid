# Baby Tracker Web — M9 (Service worker, trang offline, xem dữ liệu khi mất mạng) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Bé Yêu mở được khi mất mạng:
- Service worker viết tay (spec §8.4) giữ sẵn khung app và các trang đã mở.
- Trang `/offline` hiện khi chưa có bản lưu.
- Dữ liệu React Query đã tải được lưu vào IndexedDB, nên lúc offline vẫn xem được bú, ngủ, tã, nhật ký và thống kê (§9, gạch đầu dòng đầu tiên).
- Service worker có sẵn phần nhận push và bấm vào thông báo, để M10 chỉ còn phía máy chủ.

**Architecture:**
- **Mã nguồn service worker:** nằm ở `sw/sw.template.js`. Script `scripts/build-sw.ts` chạy ở `prebuild`, điền `CACHE_VERSION` (commit SHA trên Vercel, `dev` ở máy) rồi ghi ra `public/sw.js`. File này không commit.
- **Kiểm thử:** Vitest nạp chính file template vào một môi trường giả (`self`, `caches`, `fetch`), rồi bắn sự kiện `install`, `activate`, `fetch`, `push`, `notificationclick`.
- **Đăng ký service worker:** `Providers` đăng ký `/sw.js`, chỉ trong bản production.
- **Lưu cache dữ liệu:** `PersistQueryClientProvider` của `@tanstack/react-query-persist-client` 5.x, với một persister tự viết lưu vào Dexie 4.x (§9).

**Tech Stack:** như M1–M8 (Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, supabase-js 2.118.0, React Query 5.105.0, zod 4.6.7, recharts 3.10.1, Vitest 5.0.5). Thêm `dexie` 4.4.7 và `@tanstack/react-query-persist-client` 5.105.0; cả hai có trong danh sách thư viện được phép của spec §2.2.

**Milestones của đợt phát hành 1** (phần offline và thông báo được tách làm ba cho vừa cỡ plan):
- M1–M8: xong.
- **M9:** service worker, `/offline`, lưu cache dữ liệu để xem khi offline.
- M10: Web Push.
  - Gồm `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/dispatch` và nhắc bú `feed` (§8).
  - pg_cron + Vault.
  - Phần Thông báo trong `/cai-dat`, có tạm tắt 2/4/8 giờ.
  - Nút "Bật thông báo" ở `/cai-app`.
  - M10 làm trước M11 vì nhắc bú là tính năng người dùng cần nhất.
- M11: ghi offline qua outbox §9, chip "N mục chờ đồng bộ", tắt các nút cần mạng khi offline.
- M10–M11 lập plan sau khi M9 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Chỉ có ở bản production:** service worker chỉ đăng ký khi `NODE_ENV === "production"` (Vercel, hoặc `bun run build && bun run start` ở máy). Lý do: `public/sw.js` chỉ được tạo ở `prebuild`. `bun run dev` không có service worker.
- **App shell (§8.4):** gồm `/`, `/offline`, `/manifest.webmanifest`, `icon-192`, `icon-512` và `apple-touch-icon`, lưu bắt buộc bằng `cache.addAll`.
- **Trang cẩm nang:** `/khan-cap`, `/tiem-chung`, `/trieu-chung`, `/bong-be`, `/phat-trien` được lưu kiểu "thử từng cái, lỗi thì bỏ qua", vì đợt 1 chưa có các trang này.
- **Các trang của app và file tĩnh của chúng:** spec không ghi điều này; plan thêm để §9 "khi mất mạng vẫn xem được" chạy đúng ngay từ lần đầu.
  - Khi cài, service worker lưu thêm (kiểu thử, lỗi thì bỏ qua) mọi trang khác của app: `/nhat-ky`, `/thong-ke`, `/cam-nang`, `/tien-ich`, `/cai-dat`, `/cai-app`, `/dang-nhap`, `/khai-bao-be`, `/chua-duoc-moi`.
  - Mọi trang đều là khung client tĩnh, giống nhau với mọi người dùng, nên lưu sẵn là an toàn.
  - Sau đó service worker đọc HTML của từng trang đã lưu (kể cả `/` và `/offline`), lấy mọi đường dẫn `/_next/static/...` và lưu luôn. Nhờ vậy, chỉ cần mở app online một lần là offline mở được mọi tab, và trang `/offline` có đủ JS để nút "Thử lại" chạy.
- **Không lưu `/auth/...`:** URL callback đăng nhập chứa mã dùng một lần.
- **Chuyển tab khi offline:** Next.js lấy dữ liệu trang bằng request RSC. Service worker không lưu các request này (§8.4 chỉ nói điều hướng HTML và `/_next/static`). Khi offline, request RSC lỗi thì Next.js tự chuyển sang tải cả trang, và service worker trả bản HTML đã lưu hoặc `/offline`.
- **Trang `/offline`:**
  - Có tiêu đề "Bạn đang offline", nút "Thử lại" (tải lại trang hiện tại) và link tới các trang cẩm nang đang có trong cache.
  - Đợt 1 chưa có trang cẩm nang nào, nên danh sách trống.
  - Trang không dùng `AuthGate` và không có thanh tab.
- **Thông báo:**
  - Sự kiện `push` luôn gọi `showNotification`. Payload hỏng thì hiện "Bé Yêu có thông báo mới".
  - Sự kiện `notificationclick` focus cửa sổ đang mở rồi chuyển tới `data.url`, không có cửa sổ thì mở cửa sổ mới.
  - M9 chưa gửi push nào; M10 dùng hai sự kiện này.
- **Lưu cache dữ liệu (§9):**
  - Toàn bộ cache React Query được lưu vào IndexedDB (Dexie, database `be-yeu`, bảng `kv`, khóa `react-query`) và giữ 7 ngày (`gcTime` và `maxAge` cùng 7 ngày).
  - `buster` là `"1"`. Đổi giá trị này khi cấu trúc dữ liệu của một query thay đổi.
  - Đăng xuất gọi `queryClient.clear()` (M7), nên bản lưu cũng thành rỗng.
- **Lệnh ghi đang chờ mạng** không được lưu (`shouldDehydrateMutation: () => false`), vì sau khi tải lại trang chúng không chạy tiếp được. M9 chưa đổi cách ghi: khi offline, nút ghi chờ tới khi có mạng mới chạy. Ghi offline đúng cách (outbox §9) thuộc M11.
- **Mở app khi đang offline (React Query):** React Query mặc định coi là có mạng cho tới khi trình duyệt bắn sự kiện `offline`. App mở trong chế độ máy bay không có sự kiện đó, nên sẽ tải lại, lỗi, và đè màn lỗi lên dữ liệu cũ.
  - `trackBrowserOnline` cho `onlineManager` bắt đầu từ `navigator.onLine`, rồi theo sự kiện `online`/`offline`.
  - Khi offline, query tạm dừng, không báo lỗi, và giữ dữ liệu đã khôi phục.
- **Dữ liệu cũ thắng màn lỗi:** khi query lỗi mà vẫn còn dữ liệu (ví dụ Wi-Fi không có internet thật), giao diện vẫn hiện dữ liệu, không hiện câu lỗi.
  - Áp dụng ở `AuthGate`, trang chủ, Nhật ký và Thống kê.
  - `AuthGate` coi là "đã sẵn sàng" khi query gia đình có dữ liệu (`family.data !== undefined`; `null` nghĩa là chưa thuộc gia đình nào, vẫn tính là đã tải), không đòi trạng thái `success`. Lý do: query lỗi mà còn dữ liệu có trạng thái `error`, và khi mở app offline nó giữ nguyên trạng thái đó.
  - Query lỗi mà còn dữ liệu vẫn được lưu (`shouldDehydrateQuery: (q) => q.state.data !== undefined`).
- **Đăng nhập khi offline:**
  - Access token Supabase hết hạn sau 1 giờ. Khi offline, supabase-js không làm mới được token. Sau khoảng 25 giây thử lại, `getSession()` trả "không có phiên", và app đẩy người dùng về `/dang-nhap`.
  - `useSession` xử lý: khi `navigator.onLine` là `false`, nó dùng phiên đã lưu trong `localStorage` (khóa mặc định của supabase-js `sb-<phần đầu host>-auth-token`) để mở app ngay và hiện dữ liệu đã lưu.
  - Mọi request thật vẫn đi qua RLS với token thật, nên việc này không mở thêm quyền nào.
  - Khi có mạng, hành vi giữ như cũ. Riêng sự kiện `SIGNED_OUT` luôn đăng xuất.
  - Giới hạn: Wi-Fi "có kết nối nhưng không vào được internet" vẫn báo `navigator.onLine = true`. Khi đó token hết hạn vẫn bị đẩy về `/dang-nhap` sau khoảng 25 giây. M9 nhắm vào chế độ máy bay và mất sóng.
- **Biểu đồ Thống kê khi offline:** file JS của biểu đồ (`recharts`, nạp bằng `next/dynamic`) không nằm trong HTML nên service worker không lưu sẵn được. Nếu chưa từng tải nó khi có mạng, trang Thống kê offline vẫn hiện bảng số liệu, chỗ biểu đồ ghi "Biểu đồ cần mạng để tải lần đầu.", không sập trang.
- **Ghi cache vào IndexedDB:** React Query báo thay đổi nhiều lần mỗi giây, nên persister gom lại: mỗi giây ghi tối đa một lần, chỉ ghi bản mới nhất. Lỗi IndexedDB chỉ ghi `console.warn`, không làm hỏng app.
- **Header của `/sw.js`:** `next.config.ts` đặt `Content-Type: application/javascript; charset=utf-8` và `Cache-Control: no-cache, no-store, must-revalidate` (theo hướng dẫn PWA của Next.js), để iPhone luôn lấy bản service worker mới.

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

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7. M9 thêm `dexie` 4.4.7 (phát hành 2026-10-19) và `@tanstack/react-query-persist-client` 5.105.0 (cùng bản với `@tanstack/react-query`).
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Không dùng `@supabase/ssr`, không có `proxy.ts`/middleware. Mọi trang là client component (`'use client'`), tự kiểm tra phiên ở client.
- `supabase-js` khởi tạo với `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`.
- Toàn bộ logic nghiệp vụ là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Không dùng Workbox, Serwist, `next-pwa`: service worker viết tay. File nguồn `sw/sw.template.js`; `scripts/build-sw.ts` chạy trong `prebuild` thay `__CACHE_VERSION__` bằng `process.env.VERCEL_GIT_COMMIT_SHA` (local: `'dev'`) và ghi ra `public/sw.js` (file này nằm trong `.gitignore`).
- Request tới Supabase không qua cache của service worker.
- Giao diện ưu tiên điện thoại; chiều rộng thiết kế 375–440 pt, vùng chạm tối thiểu 44×44 pt, tôn trọng `safe-area-inset-*`.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Tên route: `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`, `/`, `/nhat-ky`, `/thong-ke`, `/cam-nang`, `/tien-ich`, `/cai-dat`, `/cai-app`, `/offline`.
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`).
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x. Thêm thư viện khác phải ghi lý do trong plan.
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.

Từ M7:

- File `.tsx` trong `app/` và `components/` chỉ dùng màu theo vai trò (`bg-surface`, `text-ink`, `text-muted`, `bg-accent`, `text-on-accent`…). Không dùng lớp màu bảng Tailwind (trừ `bg-black/40`) và không viết mã hex trong `components/`. `lib/themeGuard.test.ts` khóa quy tắc này.

Riêng M9:

- Trước khi viết code Next.js, đọc trong `node_modules/next/dist/docs/01-app/02-guides/`:
  - `progressive-web-apps.md`: mục "5. Creating a Service Worker" và "8. Securing your application", phần header cho `/sw.js`.
  - `offline-support.md`: mục "Testing". Kiểm tra offline bằng `next build && next start`, không bằng dev.
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- `sw/sw.template.js` là JavaScript thuần chạy trong service worker: không `import`, chỉ dùng `self`, `caches`, `fetch`, `Response`, `URL`. Mọi API của worker gọi qua `self.` (`self.clients`, `self.registration`, `self.skipWaiting`) để test thay được.

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`3d0a99f`):

- `components/Providers.tsx`: có `useSystemThemeSync()` (M7) và `QueryClientProvider` với `retry: 1`, `refetchOnWindowFocus: true`
- `next.config.ts` (`reactStrictMode: true`), `package.json` (scripts, `engines`), `.gitignore`
- `public/manifest.webmanifest`, `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (M1)
- `vitest.config.ts`: test được tìm ở `lib/**/*.test.ts` và `scripts/**/*.test.ts`
- Đăng xuất ở `SettingsScreen` gọi `queryClient.clear()` (M7)
- Màu theo vai trò của M7

**Produces** (M10–M11 dùng):

- `sw/sw.template.js` → `public/sw.js`:
  - Cache tên `be-yeu-<CACHE_VERSION>`.
  - `push` đọc payload JSON `{ title, body, tag, url }` và luôn hiện thông báo.
  - `notificationclick` mở `data.url`. M10 gửi đúng payload này.
- `scripts/build-sw.ts`: `buildServiceWorker(template, version)`; chạy trong `prebuild`.
- `useServiceWorker()` (`lib/hooks/useServiceWorker.ts`): đăng ký `/sw.js` ở production. M10 lấy `navigator.serviceWorker.ready` để gọi `pushManager.subscribe`.
- `lib/data/localDb.ts`: `localDb()` là Dexie database `be-yeu`, `version(1)` có bảng `kv` (khóa chính `key`). M11 thêm `version(2)` với bảng `outbox`.
- `lib/data/persister.ts`: `createDexiePersister(table?)`, `PERSIST_KEY`, `PERSIST_MAX_AGE_MS`
- `lib/data/onlineStatus.ts`: `trackBrowserOnline(status, events)`
- `lib/data/storedSession.ts`: `authStorageKey(supabaseUrl)`, `parseStoredSession(raw)`
- `useSession()` (`lib/data/session.ts`): khi offline, dùng phiên đã lưu thay vì `null`
- `Providers` dùng `PersistQueryClientProvider`; `gcTime` mặc định 7 ngày; React Query biết đang offline ngay từ lúc mở app
- `AuthGate`, `HomeScreen`, `HistoryScreen`, `StatsScreen` chỉ hiện câu lỗi khi không có dữ liệu
- Route `/offline`

## File Structure

```
sw/sw.template.js                     # service worker viết tay (cache, offline, push, bấm thông báo)
scripts/build-sw.ts (+ test)          # điền CACHE_VERSION, ghi public/sw.js
scripts/sw.test.ts                    # chạy template trong môi trường giả
package.json                          # sửa: prebuild; thêm dexie, persist-client
.gitignore                            # sửa: public/sw.js
app/offline/page.tsx                  # trang "Bạn đang offline"
lib/hooks/useServiceWorker.ts         # đăng ký /sw.js ở production
next.config.ts                        # sửa: header cho /sw.js
lib/data/localDb.ts                   # Dexie database be-yeu
lib/data/persister.ts (+ test)        # lưu / khôi phục cache React Query (gom ghi mỗi giây)
lib/data/onlineStatus.ts (+ test)     # React Query biết offline ngay khi mở app
components/Providers.tsx              # sửa: đăng ký SW, PersistQueryClientProvider
lib/data/storedSession.ts (+ test)    # đọc phiên đăng nhập đã lưu
lib/data/session.ts                   # sửa: dùng phiên đã lưu khi offline
components/AuthGate.tsx, components/home/HomeScreen.tsx, components/history/HistoryScreen.tsx, components/stats/StatsScreen.tsx  # sửa: dữ liệu cũ thắng câu lỗi
```

## Tasks

1. Service worker và script tạo `public/sw.js`
2. Trang `/offline`, đăng ký service worker, header
3. Lưu cache dữ liệu và trạng thái offline của React Query
4. Mở app offline: giữ đăng nhập, hiện dữ liệu cũ thay vì lỗi

---

### Task 1: Service worker và script tạo `public/sw.js`

**Files:**

- Create: `sw/sw.template.js`, `scripts/build-sw.ts`
- Modify: `package.json` (thêm script `prebuild`), `.gitignore` (thêm `public/sw.js`)
- Test: `scripts/build-sw.test.ts`, `scripts/sw.test.ts`

**Interfaces:**

- Consumes: các file trong `public/` (manifest, icon)
- Produces:
  - `buildServiceWorker(template: string, version: string): string` — ném `Error("sw.template.js has no __CACHE_VERSION__")` khi template thiếu chỗ điền
  - Chạy `bun scripts/build-sw.ts` thì ghi `public/sw.js` và in `public/sw.js written (cache version <v>)`
  - Hành vi của service worker:
    - `install`: lưu shell, mọi trang của app, trang cẩm nang và file tĩnh mà các trang đó dùng, rồi `skipWaiting`.
    - `activate`: xóa cache có tên khác, rồi `clients.claim`.
    - `fetch`: điều hướng HTML thì network-first; `/_next/static` thì cache-first; host khác và request không phải GET thì bỏ qua.
    - `push` và `notificationclick` như mô tả ở Contracts.

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m9.md` (file plan này, đi chung commit của Task 1); commit mới nhất là `3d0a99f feat(settings): manage family members`.

- [ ] **Step 2: Đọc tài liệu**

Đọc `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`, mục "5. Creating a Service Worker" (sự kiện `push` và `notificationclick`).

- [ ] **Step 3: Viết test thất bại**

Tạo `scripts/build-sw.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildServiceWorker } from "./build-sw";

describe("buildServiceWorker", () => {
  it("fills in the cache version", () => {
    const out = buildServiceWorker(
      readFileSync("sw/sw.template.js", "utf8"),
      "abc123",
    );
    expect(out).toContain('const CACHE_VERSION = "abc123";');
    expect(out).not.toContain("__CACHE_VERSION__");
  });

  it("refuses a template without the placeholder", () => {
    expect(() => buildServiceWorker("self.x = 1;", "v")).toThrow(
      "sw.template.js has no __CACHE_VERSION__",
    );
  });
});
```

Tạo `scripts/sw.test.ts`. Test này chạy thật nội dung template trong `new Function`, với `self`, `caches`, `fetch` giả. Test đọc file theo đường dẫn tính từ gốc repo, nơi `bun run test` chạy:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { buildServiceWorker } from "./build-sw";

const ORIGIN = "https://bunkid.test";
type Listener = (event: Record<string, unknown>) => void;

// Each fake page links one static file named after it; "/" links two.
function pageHtml(url: string): string {
  if (url.startsWith("/_next/")) return `asset ${url}`;
  if (url === "/")
    return '<script src="/_next/static/chunks/app.js"></script><link href="/_next/static/css/a.css">';
  return `<script src="/_next/static/chunks${url}.js"></script>`;
}

function fakeCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const keyOf = (input: string | Request) =>
    typeof input === "string"
      ? new URL(input, ORIGIN).pathname
      : new URL(input.url).pathname;
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      match: async (input: string | Request) =>
        store.get(keyOf(input))?.clone(),
      put: async (input: string | Request, response: Response) => {
        store.set(keyOf(input), response);
      },
      add: vi.fn(async (url: string) => {
        store.set(keyOf(url), new Response(pageHtml(url)));
      }),
      addAll: vi.fn(async (urls: string[]) => {
        for (const url of urls)
          store.set(keyOf(url), new Response(pageHtml(url)));
      }),
    };
  };
  return {
    stores,
    api: {
      open,
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
    },
  };
}

function loadWorker(fetchImpl: (request: Request) => Promise<Response>) {
  const listeners: Record<string, Listener> = {};
  const caches = fakeCaches();
  const windowClient = {
    focus: vi.fn(async () => undefined),
    navigate: vi.fn(async () => undefined),
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
    skipWaiting: vi.fn(async () => undefined),
    registration: { showNotification: vi.fn(async () => undefined) },
    clients: {
      claim: vi.fn(async () => undefined),
      matchAll: vi.fn(async () => [] as (typeof windowClient)[]),
      openWindow: vi.fn(async () => undefined),
    },
  };
  const source = buildServiceWorker(
    readFileSync("sw/sw.template.js", "utf8"),
    "test",
  );
  new Function("self", "caches", "fetch", source)(self, caches.api, fetchImpl);
  return { listeners, caches, self, windowClient };
}

async function dispatch(listener: Listener, extra: Record<string, unknown>) {
  let waited: Promise<unknown> | undefined;
  let responded: Promise<Response> | undefined;
  listener({
    ...extra,
    waitUntil: (p: Promise<unknown>) => (waited = p),
    respondWith: (p: Promise<Response>) => (responded = p),
  });
  await waited;
  return responded ? await responded : undefined;
}

describe("service worker", () => {
  it("install caches the shell, every page and the static files each page links", async () => {
    const { listeners, caches, self } = loadWorker(async () => new Response());
    await dispatch(listeners.install, {});
    const store = caches.stores.get("be-yeu-test")!;
    expect([...store.keys()]).toEqual(
      expect.arrayContaining([
        "/",
        "/offline",
        "/manifest.webmanifest",
        "/icons/icon-192.png",
        "/nhat-ky",
        "/thong-ke",
        "/dang-nhap",
        "/khan-cap",
        "/_next/static/chunks/app.js",
        "/_next/static/css/a.css",
        "/_next/static/chunks/offline.js",
        "/_next/static/chunks/nhat-ky.js",
      ]),
    );
    expect(self.skipWaiting).toHaveBeenCalled();
  });

  it("activate deletes caches of older versions", async () => {
    const { listeners, caches, self } = loadWorker(async () => new Response());
    await caches.api.open("be-yeu-old");
    await caches.api.open("be-yeu-test");
    await dispatch(listeners.activate, {});
    expect([...caches.stores.keys()]).toEqual(["be-yeu-test"]);
    expect(self.clients.claim).toHaveBeenCalled();
  });

  it("navigations are network-first and fall back to the cache, then /offline", async () => {
    let online = true;
    const { listeners } = loadWorker(async () => {
      if (!online) throw new TypeError("Failed to fetch");
      return new Response("fresh nhat-ky", { status: 200 });
    });
    await dispatch(listeners.install, {});
    const nav = (path: string) =>
      dispatch(listeners.fetch, {
        request: { method: "GET", url: `${ORIGIN}${path}`, mode: "navigate" },
      });
    expect(await (await nav("/nhat-ky"))!.text()).toBe("fresh nhat-ky");
    online = false;
    expect(await (await nav("/nhat-ky?x=1"))!.text()).toBe("fresh nhat-ky");
    expect(await (await nav("/xem-them"))!.text()).toContain(
      "chunks/offline.js",
    );
    online = true;
    await nav("/auth/callback?code=abc");
    online = false;
    expect(await (await nav("/auth/callback?code=abc"))!.text()).toContain(
      "chunks/offline.js",
    );
  });

  it("static files are cache-first; other hosts and non-GET requests are left alone", async () => {
    const network = vi.fn(async () => new Response("asset", { status: 200 }));
    const { listeners } = loadWorker(network);
    const get = (url: string, method = "GET") =>
      dispatch(listeners.fetch, { request: { method, url, mode: "cors" } });
    await get(`${ORIGIN}/_next/static/chunks/x.js`);
    await get(`${ORIGIN}/_next/static/chunks/x.js`);
    expect(network).toHaveBeenCalledTimes(1);
    expect(await get("https://abc.supabase.co/rest/v1/logs")).toBeUndefined();
    expect(await get(`${ORIGIN}/api/x`, "POST")).toBeUndefined();
  });

  it("push always shows a notification, even with a broken payload", async () => {
    const { listeners, self } = loadWorker(async () => new Response());
    await dispatch(listeners.push, {
      data: {
        json: () => ({
          title: "Đến giờ bú rồi",
          body: "Cữ trước lúc 07:00",
          tag: "feed:b1",
          url: "/",
        }),
      },
    });
    await dispatch(listeners.push, {
      data: {
        json: () => {
          throw new SyntaxError("bad json");
        },
      },
    });
    expect(self.registration.showNotification).toHaveBeenNthCalledWith(
      1,
      "Đến giờ bú rồi",
      expect.objectContaining({
        body: "Cữ trước lúc 07:00",
        tag: "feed:b1",
        data: { url: "/" },
      }),
    );
    expect(self.registration.showNotification).toHaveBeenNthCalledWith(
      2,
      "Bé Yêu có thông báo mới",
      expect.objectContaining({ data: { url: "/" } }),
    );
  });

  it("notificationclick focuses an open window or opens a new one", async () => {
    const { listeners, self, windowClient } = loadWorker(
      async () => new Response(),
    );
    const close = vi.fn();
    const click = () =>
      dispatch(listeners.notificationclick, {
        notification: { close, data: { url: "/tiem-chung" } },
      });
    await click();
    expect(self.clients.openWindow).toHaveBeenCalledWith("/tiem-chung");
    self.clients.matchAll.mockResolvedValueOnce([windowClient]);
    await click();
    expect(windowClient.focus).toHaveBeenCalled();
    expect(windowClient.navigate).toHaveBeenCalledWith("/tiem-chung");
    expect(close).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 4: Chạy test để thấy thất bại**

Run: `bun run test scripts/build-sw.test.ts scripts/sw.test.ts`
Expected: FAIL — `Cannot find module './build-sw'` ở cả hai file.

- [ ] **Step 5: Viết `scripts/build-sw.ts`**

```ts
import { readFileSync, writeFileSync } from "node:fs";

const PLACEHOLDER = "__CACHE_VERSION__";

export function buildServiceWorker(template: string, version: string): string {
  if (!template.includes(PLACEHOLDER))
    throw new Error(`sw.template.js has no ${PLACEHOLDER}`);
  return template.replaceAll(PLACEHOLDER, version);
}

if (process.argv[1]?.endsWith("build-sw.ts")) {
  const version = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
  writeFileSync(
    "public/sw.js",
    buildServiceWorker(readFileSync("sw/sw.template.js", "utf8"), version),
  );
  console.log(`public/sw.js written (cache version ${version})`);
}
```

`process.argv[1]` kiểm tra file đang được chạy trực tiếp (`bun scripts/build-sw.ts`), để khi Vitest import hàm thì không ghi file.

- [ ] **Step 6: Viết `sw/sw.template.js`**

```js
// Source of public/sw.js. scripts/build-sw.ts fills in the cache version.
const CACHE_VERSION = "__CACHE_VERSION__";
const CACHE = `be-yeu-${CACHE_VERSION}`;
const SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];
// Every page is a static client shell, the same for every user, so it is safe to keep.
const PAGES = [
  "/nhat-ky",
  "/thong-ke",
  "/cam-nang",
  "/tien-ich",
  "/cai-dat",
  "/cai-app",
  "/dang-nhap",
  "/khai-bao-be",
  "/chua-duoc-moi",
];
const GUIDES = [
  "/khan-cap",
  "/tiem-chung",
  "/trieu-chung",
  "/bong-be",
  "/phat-trien",
];
const FALLBACK_TITLE = "Bé Yêu có thông báo mới";

function staticAssets(html) {
  return [...new Set(html.match(/\/_next\/static\/[^"'\s)<>\\]+/g) || [])];
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
      const optional = [...PAGES, ...GUIDES];
      await Promise.allSettled(optional.map((url) => cache.add(url)));
      const assets = [];
      for (const url of ["/", "/offline", ...optional]) {
        const page = await cache.match(url);
        if (page) assets.push(...staticAssets(await page.text()));
      }
      await Promise.allSettled(
        [...new Set(assets)].map((url) => cache.add(url)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  // The OAuth callback URL carries a one-time code; never keep it.
  const keep = !new URL(request.url).pathname.startsWith("/auth/");
  try {
    const response = await fetch(request);
    if (keep && response.status === 200 && !response.redirected)
      await cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match("/offline")) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.status === 200) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Supabase and every other host go straight to the network.
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") event.respondWith(networkFirst(request));
  else if (url.pathname.startsWith("/_next/static/"))
    event.respondWith(cacheFirst(request));
});

function readPayload(event) {
  try {
    const data = event.data ? event.data.json() : null;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

self.addEventListener("push", (event) => {
  const data = readPayload(event);
  const title =
    typeof data.title === "string" && data.title ? data.title : FALLBACK_TITLE;
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === "string" ? data.body : "",
      tag: typeof data.tag === "string" ? data.tag : undefined,
      icon: "/icons/icon-192.png",
      data: { url: typeof data.url === "string" ? data.url : "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        try {
          await client.focus();
          await client.navigate(url);
          return;
        } catch {
          // An uncontrolled window cannot navigate; open a new one instead.
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
```

- [ ] **Step 7: Chạy test để thấy đạt**

Run: `bun run test scripts/build-sw.test.ts scripts/sw.test.ts && bun run typecheck`
Expected: PASS — build-sw 2 test, sw 6 test; không lỗi type.

- [ ] **Step 8: Chạy script trong `prebuild`, bỏ `public/sw.js` khỏi git**

Trong `package.json`, thay

```json
    "dev": "next dev",
    "build": "next build",
```

bằng:

```json
    "dev": "next dev",
    "prebuild": "bun scripts/build-sw.ts",
    "build": "next build",
```

Thêm một dòng `public/sw.js` vào cuối `.gitignore`.

Run: `bun scripts/build-sw.ts && head -2 public/sw.js && git status --short`
Expected:
- `public/sw.js written (cache version dev)`.
- Dòng thứ hai của file là `const CACHE_VERSION = "dev";`.
- `git status` không liệt kê `public/sw.js`.

Bun và npm đều tự chạy `prebuild` trước `build`, nên Vercel cũng tạo `public/sw.js` với `VERCEL_GIT_COMMIT_SHA`.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(sw): hand-written service worker with offline shell and push handlers"
```

`git add -A` lần này đưa cả file plan M9 vào commit.

---

### Task 2: Trang `/offline`, đăng ký service worker, header

**Files:**

- Create: `app/offline/page.tsx`, `lib/hooks/useServiceWorker.ts`
- Modify: `components/Providers.tsx` (import, gọi hook), `next.config.ts` (toàn bộ)

**Interfaces:**

- Consumes: `public/sw.js` (Task 1); màu theo vai trò (M7)
- Produces: `useServiceWorker(): void`; route `/offline`; header `Cache-Control: no-cache, no-store, must-revalidate` cho `/sw.js`

- [ ] **Step 1: Tạo `app/offline/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

const GUIDES = [
  { href: "/khan-cap", label: "Thông tin khẩn cấp" },
  { href: "/tiem-chung", label: "Tiêm chủng" },
  { href: "/trieu-chung", label: "Triệu chứng" },
  { href: "/bong-be", label: "Bồng bế" },
  { href: "/phat-trien", label: "Phát triển" },
];

export default function Page() {
  const [cached, setCached] = useState<typeof GUIDES>([]);

  useEffect(() => {
    if (!("caches" in window)) return;
    void Promise.all(
      GUIDES.map(async (guide) =>
        (await caches.match(guide.href)) ? guide : null,
      ),
    ).then((found) =>
      setCached(found.filter((g): g is (typeof GUIDES)[number] => g !== null)),
    );
  }, []);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Bạn đang offline</h1>
      <p className="text-muted">
        Kết nối mạng rồi bấm Thử lại. Những trang đã mở trước đó vẫn xem được.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-12 rounded-2xl bg-accent text-on-accent"
      >
        Thử lại
      </button>
      {cached.length > 0 && (
        <ul className="divide-y rounded-2xl border text-left">
          {cached.map((guide) => (
            <li key={guide.href}>
              <a href={guide.href} className="flex min-h-12 items-center px-4">
                {guide.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

Link cẩm nang dùng thẻ `<a>`, không dùng `<Link>`. Khi offline, tải cả trang mới để service worker trả được bản đã lưu.

- [ ] **Step 2: Tạo `lib/hooks/useServiceWorker.ts`**

```ts
"use client";

import { useEffect } from "react";

export function useServiceWorker(): void {
  useEffect(() => {
    // public/sw.js only exists after `bun run build` (prebuild), so dev skips it.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Service worker registration failed", error);
    });
  }, []);
}
```

- [ ] **Step 3: Gọi hook trong `components/Providers.tsx`**

Thêm import ngay sau dòng `import { useState, type ReactNode } from "react";`:

```tsx
import { useServiceWorker } from "@/lib/hooks/useServiceWorker";
```

Rồi thay

```tsx
export function Providers({ children }: { children: ReactNode }) {
  useSystemThemeSync();
```

bằng:

```tsx
export function Providers({ children }: { children: ReactNode }) {
  useSystemThemeSync();
  useServiceWorker();
```

(Task 3 thay lại toàn bộ file này.)

- [ ] **Step 4: Thay `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 5: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected:
- Không lỗi type; `Tests  127 passed (127)` (119 của M1–M8, thêm 8 của Task 1).
- Đầu ra của build có dòng `public/sw.js written (cache version dev)`, in trước phần của `next build` (do `prebuild`).
- `next build` thành công, có thêm route `○ /offline` (tổng 13 route).

- [ ] **Step 6: Kiểm tra header bằng bản production ở máy**

Run: `bun run start` (chạy nền; nếu cổng 3000 đang bận thì chạy `PORT=3100 bun run start` và đổi số cổng trong hai lệnh `curl` dưới đây), rồi `curl -sI http://localhost:3000/sw.js`, rồi `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/offline`, rồi tắt server.
Expected: `HTTP/1.1 200 OK`, `Content-Type: application/javascript; charset=utf-8`, `Cache-Control: no-cache, no-store, must-revalidate`; `/offline` trả `200`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(sw): register service worker in production, offline page, sw.js headers"
```

---

### Task 3: Lưu cache dữ liệu và trạng thái offline của React Query

**Files:**

- Create: `lib/data/localDb.ts`, `lib/data/persister.ts`, `lib/data/onlineStatus.ts`
- Modify: `package.json`, `bun.lock` (qua `bun add`), `components/Providers.tsx` (toàn bộ)
- Test: `lib/data/persister.test.ts`, `lib/data/onlineStatus.test.ts`

**Interfaces:**

- Consumes: `useServiceWorker` (Task 2); `useSystemThemeSync` (M7)
- Produces:
  - `type KvRow = { key: string; value: unknown }`; `localDb()` (Dexie `be-yeu`, `version(1).stores({ kv: "key" })`)
  - `PERSIST_KEY = "react-query"`, `PERSIST_MAX_AGE_MS = 604_800_000` (7 ngày)
  - `createDexiePersister(table?: () => { put; get; delete }): Persister`
    - Mặc định dùng `localDb().kv`; test truyền bảng giả.
    - Ghi tối đa mỗi giây một lần.
    - Lỗi chỉ `console.warn`.
  - `trackBrowserOnline(status: { onLine: boolean }, events: EventTarget): void` — đặt `onlineManager` của React Query theo `status.onLine` ngay, rồi theo sự kiện `online`/`offline`
  - `Providers` bọc app bằng `PersistQueryClientProvider`:
    - `maxAge` 7 ngày, `buster` `"1"`.
    - Lưu query còn dữ liệu; không lưu lệnh ghi.
    - Gọi `trackBrowserOnline(navigator, window)` trước khi tạo `QueryClient`.

- [ ] **Step 1: Cài thư viện**

Run: `bun add dexie@4.4.7 @tanstack/react-query-persist-client@5.105.0 --exact`
Expected:
- In ra `installed dexie@4.4.7` và `installed @tanstack/react-query-persist-client@5.105.0`.
- `package.json` có `"dexie": "4.4.7"` và `"@tanstack/react-query-persist-client": "5.105.0"`, không có `^`.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/data/persister.test.ts`:

```ts
import type { PersistedClient } from "@tanstack/react-query-persist-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDexiePersister, PERSIST_KEY } from "./persister";

function memoryTable() {
  const rows = new Map<string, unknown>();
  const put = vi.fn(async (row: { key: string; value: unknown }) => {
    rows.set(row.key, row.value);
  });
  return {
    rows,
    put,
    table: () => ({
      put,
      get: async (key: string) =>
        rows.has(key) ? { key, value: rows.get(key) } : undefined,
      delete: async (key: string) => {
        rows.delete(key);
      },
    }),
  };
}

const snapshot = (timestamp: number): PersistedClient => ({
  timestamp,
  buster: "",
  clientState: { queries: [], mutations: [] },
});

afterEach(() => vi.useRealTimers());

describe("createDexiePersister", () => {
  it("writes only the latest snapshot, once per second", async () => {
    vi.useFakeTimers();
    const memory = memoryTable();
    const persister = createDexiePersister(memory.table);
    expect(await persister.restoreClient()).toBeUndefined();
    await persister.persistClient(snapshot(1));
    await persister.persistClient(snapshot(2));
    expect(memory.put).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(memory.put).toHaveBeenCalledTimes(1);
    expect([...memory.rows.keys()]).toEqual([PERSIST_KEY]);
    expect(await persister.restoreClient()).toEqual(snapshot(2));
    await persister.removeClient();
    expect(await persister.restoreClient()).toBeUndefined();
  });

  it("never throws when IndexedDB fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const broken = () => ({
      put: async () => {
        throw new Error("quota");
      },
      get: async () => {
        throw new Error("blocked");
      },
      delete: async () => {
        throw new Error("blocked");
      },
    });
    const persister = createDexiePersister(broken);
    expect(await persister.restoreClient()).toBeUndefined();
    await persister.removeClient();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
```

Tạo `lib/data/onlineStatus.test.ts`:

```ts
import { onlineManager } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { trackBrowserOnline } from "./onlineStatus";

afterEach(() => onlineManager.setOnline(true));

describe("trackBrowserOnline", () => {
  it("starts from navigator.onLine and follows online/offline events", () => {
    const events = new EventTarget();
    trackBrowserOnline({ onLine: false }, events);
    expect(onlineManager.isOnline()).toBe(false);
    events.dispatchEvent(new Event("online"));
    expect(onlineManager.isOnline()).toBe(true);
    events.dispatchEvent(new Event("offline"));
    expect(onlineManager.isOnline()).toBe(false);
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bun run test lib/data/persister.test.ts lib/data/onlineStatus.test.ts`
Expected: FAIL — `Cannot find module './persister'` và `Cannot find module './onlineStatus'`.

- [ ] **Step 4: Tạo `lib/data/localDb.ts`**

```ts
import Dexie, { type Table } from "dexie";

export type KvRow = { key: string; value: unknown };

class LocalDb extends Dexie {
  kv!: Table<KvRow, string>;

  constructor() {
    super("be-yeu");
    this.version(1).stores({ kv: "key" });
  }
}

let db: LocalDb | null = null;

// Created on first use so server-side prerendering never touches IndexedDB.
export function localDb(): LocalDb {
  db ??= new LocalDb();
  return db;
}
```

- [ ] **Step 5: Tạo `lib/data/persister.ts`**

```ts
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { localDb, type KvRow } from "./localDb";

export const PERSIST_KEY = "react-query";
export const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const WRITE_DELAY_MS = 1000;

type KvTable = {
  put(row: KvRow): Promise<unknown>;
  get(key: string): Promise<KvRow | undefined>;
  delete(key: string): Promise<unknown>;
};

function warn(error: unknown) {
  console.warn("Không lưu được dữ liệu để xem offline", error);
}

// The cache changes many times a second while queries load, so writes are
// batched: only the latest snapshot is written, at most once per second.
export function createDexiePersister(
  table: () => KvTable = () => localDb().kv,
): Persister {
  let pending: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function flush() {
    timer = null;
    const client = pending;
    pending = null;
    if (client)
      await table().put({ key: PERSIST_KEY, value: client }).catch(warn);
  }

  return {
    persistClient: (client: PersistedClient) => {
      pending = client;
      timer ??= setTimeout(() => void flush(), WRITE_DELAY_MS);
    },
    restoreClient: async () => {
      try {
        return (await table().get(PERSIST_KEY))?.value as
          PersistedClient | undefined;
      } catch (error) {
        warn(error);
        return undefined;
      }
    },
    removeClient: async () => {
      pending = null;
      if (timer) clearTimeout(timer);
      timer = null;
      await table().delete(PERSIST_KEY).catch(warn);
    },
  };
}
```

- [ ] **Step 6: Tạo `lib/data/onlineStatus.ts`**

```ts
import { onlineManager } from "@tanstack/react-query";

type EventSource = Pick<
  EventTarget,
  "addEventListener" | "removeEventListener"
>;

// React Query assumes "online" until an event fires. An app opened in airplane
// mode never gets one, so start from navigator.onLine instead.
export function trackBrowserOnline(
  status: { onLine: boolean },
  events: EventSource,
): void {
  onlineManager.setEventListener((setOnline) => {
    setOnline(status.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    events.addEventListener("online", goOnline);
    events.addEventListener("offline", goOffline);
    return () => {
      events.removeEventListener("online", goOnline);
      events.removeEventListener("offline", goOffline);
    };
  });
}
```

- [ ] **Step 7: Chạy test để thấy đạt**

Run: `bun run test lib/data/persister.test.ts lib/data/onlineStatus.test.ts`
Expected: PASS — persister 2 test, onlineStatus 1 test.

- [ ] **Step 8: Thay `components/Providers.tsx`**

```tsx
"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";
import { trackBrowserOnline } from "@/lib/data/onlineStatus";
import { createDexiePersister, PERSIST_MAX_AGE_MS } from "@/lib/data/persister";
import { useServiceWorker } from "@/lib/hooks/useServiceWorker";
import { useSystemThemeSync } from "@/lib/hooks/useTheme";

// Bump when a cached query's data shape changes, so old saved data is dropped.
const PERSIST_BUSTER = "1";

export function Providers({ children }: { children: ReactNode }) {
  useSystemThemeSync();
  useServiceWorker();
  const [client] = useState(() => {
    if (typeof window !== "undefined") trackBrowserOnline(navigator, window);
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: true,
          gcTime: PERSIST_MAX_AGE_MS,
        },
      },
    });
  });
  const [persister] = useState(() => createDexiePersister());
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          // Keep queries whose last refetch failed offline, as long as they hold data.
          shouldDehydrateQuery: (query) => query.state.data !== undefined,
          // Paused writes cannot resume after a reload (no mutation defaults).
          shouldDehydrateMutation: () => false,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

`createDexiePersister()` chỉ trả về một object. Dexie chỉ mở IndexedDB khi persister thật sự đọc hoặc ghi, và việc đó chỉ xảy ra ở trình duyệt; `trackBrowserOnline` cũng chỉ chạy khi có `window`. Vì vậy prerender phía server không chạm tới IndexedDB hay `navigator`.

- [ ] **Step 9: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  130 passed (130)`; build thành công với 13 route.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(offline): persist query cache in IndexedDB and start React Query offline-aware"
```

---

### Task 4: Mở app offline: giữ đăng nhập, hiện dữ liệu cũ thay vì lỗi

**Files:**

- Create: `lib/data/storedSession.ts`
- Modify:
  - `lib/data/session.ts` (toàn bộ)
  - `components/AuthGate.tsx` (2 dòng), `components/home/HomeScreen.tsx`, `components/history/HistoryScreen.tsx` (mỗi file 1 dòng)
  - `components/stats/StatsScreen.tsx` (1 dòng, cộng chỗ nạp biểu đồ)
- Test: `lib/data/storedSession.test.ts`

**Interfaces:**

- Consumes: `publicEnv()` (`lib/env.ts`); `supabase()`; React Query offline-aware (Task 3)
- Produces:
  - `authStorageKey(supabaseUrl: string): string` — `sb-<phần đầu hostname>-auth-token`, đúng khóa mặc định của supabase-js 2.118
  - `parseStoredSession(raw: string | null): Session | null` — nhận JSON có `access_token` (chuỗi) và `user.id` (chuỗi), ngược lại `null`
  - `AuthGate` sẵn sàng khi `family.data !== undefined`; trang Thống kê ghi "Biểu đồ cần mạng để tải lần đầu." khi không nạp được biểu đồ
  - `useSession()` giữ chữ ký cũ `{ session, loading }`:
    - Khi `navigator.onLine` là `false`, dùng phiên đã lưu nếu supabase-js không trả phiên.
    - Sự kiện `SIGNED_OUT` luôn đặt `null`.

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/data/storedSession.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { authStorageKey, parseStoredSession } from "./storedSession";

describe("stored session", () => {
  it("authStorageKey matches the supabase-js default key", () => {
    expect(authStorageKey("https://abcdefgh.supabase.co")).toBe(
      "sb-abcdefgh-auth-token",
    );
    expect(authStorageKey("http://127.0.0.1:54321")).toBe("sb-127-auth-token");
  });

  it("parseStoredSession accepts a saved session and rejects anything else", () => {
    const saved = {
      access_token: "jwt",
      refresh_token: "r",
      expires_at: 1,
      user: { id: "u1", email: "me@example.com" },
    };
    expect(parseStoredSession(JSON.stringify(saved))?.user.id).toBe("u1");
    expect(parseStoredSession(null)).toBeNull();
    expect(parseStoredSession("not json")).toBeNull();
    expect(
      parseStoredSession(JSON.stringify({ access_token: "jwt" })),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bun run test lib/data/storedSession.test.ts`
Expected: FAIL — `Cannot find module './storedSession'`.

- [ ] **Step 3: Tạo `lib/data/storedSession.ts`**

```ts
import type { Session } from "@supabase/supabase-js";

// Same key supabase-js uses by default (sb-<first part of the host>-auth-token).
export function authStorageKey(supabaseUrl: string): string {
  return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
}

export function parseStoredSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "access_token" in value &&
      typeof value.access_token === "string" &&
      "user" in value &&
      typeof value.user === "object" &&
      value.user !== null &&
      "id" in value.user &&
      typeof value.user.id === "string"
    )
      return value as Session;
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run test lib/data/storedSession.test.ts`
Expected: PASS — 2 test.

- [ ] **Step 5: Thay `lib/data/session.ts`**

```ts
"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { publicEnv } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";
import { authStorageKey, parseStoredSession } from "./storedSession";

function storedSession(): Session | null {
  try {
    return parseStoredSession(
      window.localStorage.getItem(
        authStorageKey(publicEnv().NEXT_PUBLIC_SUPABASE_URL),
      ),
    );
  } catch {
    return null;
  }
}

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
    // Offline, an expired access token cannot be refreshed and supabase-js
    // reports no session after ~25 s of retries. Keep the saved sign-in so
    // cached data stays viewable; RLS still guards every real request.
    const offlineFallback = () => (navigator.onLine ? null : storedSession());
    const saved = offlineFallback();
    if (saved) setState({ session: saved, loading: false });
    // getSession() waits for supabase-js to finish the PKCE code exchange on /auth/callback.
    sb.auth.getSession().then(({ data }) =>
      setState({
        session: data.session ?? offlineFallback(),
        loading: false,
      }),
    );
    const { data } = sb.auth.onAuthStateChange((event, session) =>
      setState({
        session: session ?? (event === "SIGNED_OUT" ? null : offlineFallback()),
        loading: false,
      }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
```

Khi có mạng, hành vi y như trước, kể cả lúc đổi mã PKCE trên `/auth/callback`: `offlineFallback()` trả `null` nên trạng thái chỉ đến từ supabase-js.

- [ ] **Step 6: Hiện dữ liệu cũ thay vì câu lỗi**

1. `components/AuthGate.tsx`, hai dòng. Thay

```tsx
  const ready = !loading && (!session || family.isSuccess);
```

bằng

```tsx
  const ready = !loading && (!session || family.data !== undefined);
```

và thay

```tsx
  if (session && family.isError) {
```

bằng

```tsx
  if (session && family.isError && !family.data) {
```

2. `components/home/HomeScreen.tsx`: thay

```tsx
        {logs.isError ? (
```

bằng

```tsx
        {logs.isError && !logs.data ? (
```

3. `components/history/HistoryScreen.tsx`: thay

```tsx
      {history.isError && (
```

bằng

```tsx
      {history.isError && !history.data && (
```

4. `components/stats/StatsScreen.tsx`: thay

```tsx
      {logs.isError ? (
```

bằng

```tsx
      {logs.isError && !logs.data ? (
```

5. Cũng trong `components/stats/StatsScreen.tsx`, cho chỗ nạp biểu đồ không sập khi offline. Thay

```tsx
const StatsChart = dynamic(
  () => import("./StatsChart").then((m) => m.StatsChart),
```

bằng

```tsx
function ChartUnavailable() {
  return <p className="h-60 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
}

const StatsChart = dynamic(
  () =>
    import("./StatsChart")
      .then((m) => m.StatsChart)
      // Offline before the chart was ever loaded: keep the table, skip the chart.
      .catch(() => ChartUnavailable),
```

- [ ] **Step 7: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; `Tests  132 passed (132)` (119 của M1–M8, Task 1: 8, Task 3: 3, Task 4: 2); build thành công với 13 route.

- [ ] **Step 8: 👤 Kiểm tra tay bằng bản production ở máy**

Run: `bun run build && bun run start`. Lý do và lưu ý:
- Service worker chỉ chạy ở production.
- `bun run start` dùng cổng 3000, cổng đã có trong Redirect URLs của Supabase từ M1. Nếu cổng 3000 đang bận, dừng chương trình đang chiếm cổng đó; không đổi cổng, vì đăng nhập Google chỉ quay về `localhost:3000`.

Mở `http://localhost:3000/` trong Claude in Chrome: bắt đầu bằng `tabs_context_mcp`, mở tab mới bằng `tabs_create_mcp`. Nếu Chrome không kết nối được, hỏi người dùng dùng trình duyệt nào trước khi đổi. Nhờ người dùng tự đăng nhập Google nếu cần. Kiểm tra cùng người dùng:

1. Tải lại trang chủ một lần. Trong console:
   - `navigator.serviceWorker.controller !== null` → `true`.
   - `(await caches.keys())` → `["be-yeu-dev"]`.
   - `(await (await caches.open("be-yeu-dev")).keys()).length` → lớn hơn 20 (các trang và file tĩnh).
2. Còn online, chỉ ở trang chủ (chưa bấm tab nào). Chờ 2 giây cho cache dữ liệu được ghi.
3. Chuyển offline: DevTools → Network → Offline, hoặc tắt Wi-Fi của máy. Tải lại trang chủ:
   - Vẫn hiện tên bé, thẻ "24 giờ qua" và danh sách ghi chép như trước khi mất mạng.
   - Không phải trang lỗi của trình duyệt.
   - Sau 5 giây cũng không hiện câu "Bạn đang offline. Kết nối mạng rồi thử lại.".
4. Vẫn offline, bấm lần lượt các tab "Nhật ký", "Cẩm nang", "Tiện ích" → "Thống kê", "Cài đặt":
   - Trang nào cũng mở được (không phải "Bạn đang offline").
   - Nhật ký hiện bản ghi đã tải.
   - Thống kê có thể trống, vì dữ liệu thống kê chưa tải lần nào.
5. Vẫn offline, gõ thẳng `http://localhost:3000/khong-co-trang-nay` → hiện "Bạn đang offline" và nút "Thử lại". Bật mạng lại, bấm "Thử lại" → trang 404 của Next.js (chứng tỏ JS của `/offline` đã chạy).
6. Online, về trang chủ, ghi một tã thử → hiện ngay; xóa tã thử ở Nhật ký.
7. Vào Cài đặt → Đăng xuất, chờ 2 giây. Trong console chạy lệnh dưới → `0` (cache dữ liệu đã rỗng):

   ```js
   await new Promise((r) => { const q = indexedDB.open("be-yeu"); q.onsuccess = () => { const g = q.result.transaction("kv").objectStore("kv").get("react-query"); g.onsuccess = () => r(g.result?.value.clientState.queries.length ?? 0); }; })
   ```

   Đăng nhập lại.

- [ ] **Step 9: Commit và deploy**

```bash
git add -A && git commit -m "feat(offline): keep the saved sign-in offline and show cached data over errors"
```

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app. Nhờ người dùng thử trên iPhone 16 hoặc 17 Pro (iPhone 11 đang iOS 16.3, chưa đủ 16.4):

1. Mở PWA khi có mạng, đóng hẳn app, rồi mở lại một lần nữa để service worker mới tiếp quản.
2. Bật chế độ máy bay rồi mở app → trang chủ hiện dữ liệu cũ. Bấm từng tab → đều mở được.
3. Tắt chế độ máy bay.
4. Lần sau, khi app đã đóng hơn 1 giờ (ví dụ sáng hôm sau): bật chế độ máy bay rồi mở app → vẫn vào trang chủ với dữ liệu cũ, không bị đẩy về trang đăng nhập.

Nhờ người dùng xác nhận bước 1–3 đạt. Bước 4 báo lại khi làm được.

---

## Ngoài phạm vi M9

- **M10:** Web Push theo §8.
  - API route `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/dispatch` và hàm thuần chọn thông báo cho `feed`.
  - pg_cron + Vault (`app_url`, `cron_secret`), biến môi trường VAPID.
  - Phần Thông báo của `/cai-dat`: bật trên máy này, 3 công tắc, Tạm tắt 2/4/8 giờ, Bật lại.
  - Nút "Bật thông báo" của `/cai-app`; checklist thiết bị bước 1–2 và 7.
- **M11:** offline outbox §9.
  - Dexie `version(2)` có bảng `outbox`; bộ xả outbox chạy khi khởi động, khi có mạng lại và mỗi 30 giây; phân loại lỗi tạm thời và vĩnh viễn.
  - Biểu tượng ⏳ và chip "N mục chờ đồng bộ".
  - Khi offline, nút ghi không qua outbox bị tắt kèm "Cần kết nối mạng".
  - Checklist thiết bị bước 4.
