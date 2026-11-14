# Baby Tracker Web — M11 (Gửi nhắc bú bằng Web Push) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-14

**Goal:** Đến giờ bú, mọi máy đã bật thông báo nhận "Đến giờ bú rồi" (spec §8.2, §8.3 dòng `feed`, §3). Cụ thể:
- Supabase `pg_cron` gọi `/api/push/dispatch` mỗi phút.
- Route chọn nhắc theo luật thuần.
- Ghi `notification_log` để không gửi trùng.
- Gửi bằng `web-push`, rồi dọn đăng ký đã chết.

**Architecture:**
- **Luật chọn:** hàm thuần `selectDueNotifications` (`lib/rules/pushSelection.ts`) nhận trạng thái từng bé đã tải sẵn.
- **Điều phối:** `runDispatch`/`handleDispatch` (`lib/server/dispatch.ts`) nhận dependencies qua tham số, nên Vitest thử được 401, gửi một lần dù gọi hai lần, và xử lý 404/410 mà không cần mạng.
- **Phần nối thật:** `lib/server/dispatchDeps.ts` nối với Supabase (service role, chỉ tạo sau khi đã kiểm secret) và `web-push`.
- **Lịch chạy:** migration bật `pg_cron` và `pg_net`, rồi đặt lịch `push-dispatch`. Lịch đọc `app_url` và `cron_secret` từ Supabase Vault, không viết cứng trong migration (§3).

**Tech Stack:** như M1–M10. Thêm `web-push` 3.6.7 (có trong danh sách §2.2) và dev-only `@types/web-push` 3.6.4 (lý do ở "Diễn giải spec").

**Milestones của đợt phát hành 1:**
- M1–M10: xong.
- **M11:** dispatch + nhắc bú + pg_cron + checklist bước 2 và 7.
- M12: outbox ghi offline §9, tắt các nút cần mạng khi offline. Lập plan sau khi M11 xong.

**Diễn giải spec (ghi rõ để implementer không phải đoán):**

- **Chỉ nhắc bú:** đợt 1 chỉ gửi `feed`. `wake` và `vaccine` thuộc đợt 2; kiểu `NotificationKind` đã có đủ ba giá trị để đợt 2 thêm luật.
- **Luật `feed` (§8.3), xét riêng từng bé:**
  - `L` là bản ghi `breast` hoặc `bottle` có `started_at` mới nhất trong 12 giờ qua.
  - Gửi khi có `L`, không có đồng hồ bú mẹ đang chạy, và `bây giờ ≥ L.started_at + feed_interval_min`. Đúng 12 giờ vẫn tính; 12 giờ 1 phút thì không.
  - Người nhận là thành viên có `user_id` và có ít nhất một đăng ký push. Không có dòng `notification_prefs` nghĩa là mọi công tắc bật.
  - Tắt "Nhắc cữ bú" thì không gửi. `snooze_until` còn trong tương lai thì không gửi; đã qua thì gửi.
- **Nội dung:**
  - `title` là "Đến giờ bú rồi".
  - `body` là "Cữ trước lúc HH:mm (X giờ Y phút trước)." theo giờ VN. Khi số phút là 0 thì ghi "X giờ trước".
  - `url` là `/`; `tag` là `feed:<babyId>`, để thông báo mới thay thông báo cũ; `refKey` là `feed:<L.id>`.
- **Không gửi trùng (§8.2):**
  - Mỗi mục được "nhận" trước khi gửi, bằng cách thêm `notification_log` với `on conflict do nothing` (upsert `ignoreDuplicates`) và lấy `id` trả về.
  - Không có `id` nghĩa là đã gửi rồi, nên bỏ qua. Vì vậy cron chạy trùng, hoặc cùng một cữ còn "đến giờ" suốt nhiều phút, chỉ gửi một lần.
  - Nếu mọi lần gửi của mục đó đều lỗi, mục vẫn tính là đã nhận và không gửi lại, đúng §8.2.
- **Kết quả trả về:**
  - `200 { selected, sent, failed }`.
  - `selected` là số mục luật chọn được ở lần gọi này (cron gọi tiếp thì vẫn đếm lại), `sent` là số lần gửi tới từng máy thành công, `failed` là số lần gửi lỗi.
  - Lỗi 404/410 thì xóa đăng ký đó. Gửi thành công thì cập nhật `last_success_at`. Lỗi khác thì `console.error` và bỏ qua.
- **Cách gửi:**
  - `TTL` 3600 giây.
  - `urgency` là `high` cho `feed`/`wake` và `normal` cho `vaccine`.
  - Payload JSON là `{ title, body, tag, url }`, đúng dạng service worker M9 đọc.
- **Xác thực route:**
  - Chỉ chấp nhận `Authorization: Bearer <CRON_SECRET>`, so bằng `timingSafeEqual` trên hai mã băm SHA-256, nên độ dài khác nhau cũng không làm lộ thông tin. Sai hoặc thiếu → `401 {"error":"unauthorized"}`.
  - Thiếu hoặc sai biến môi trường → `500 {"error":"not_configured"}`. Lỗi khác → `500 {"error":"server_error"}`.
- **Biến môi trường:** `lib/server/pushEnv.ts` đọc `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:`), `CRON_SECRET` (≥ 32 ký tự).
  - Next.js chép giá trị `NEXT_PUBLIC_*` vào code lúc build, kể cả code phía server. Trên Vercel biến này đã có từ M10.
  - Khi thử ở máy, phải đặt biến này lúc build (Task 3 Step 6).
- **Lịch cron (§3):**
  - Migration `create extension if not exists pg_cron with schema pg_catalog` và `pg_net with schema extensions`, rồi `cron.schedule('push-dispatch', '* * * * *', …)`.
  - `cron.schedule` cùng tên thì ghi đè, nên chạy lại migration không tạo job trùng.
  - Lệnh trong job chỉ gọi `net.http_post` khi Vault đã có cả `app_url` lẫn `cron_secret`. Vì vậy ở máy local (`db:reset`) và trước khi người dùng tạo secret, job chạy mỗi phút nhưng không làm gì.
- **`@types/web-push`** (dev, ngoài danh sách §2.2): gói `web-push` không kèm kiểu TypeScript, mà `strict: true` cần kiểu để biên dịch. Gói này chỉ có kiểu, không chạy lúc runtime.
- **Đăng ký đã chết:** nếu `/api/push/unsubscribe` xóa 0 dòng (máy vừa đổi người dùng mà chưa làm mới), dòng cũ sẽ bị xóa ở lần gửi gặp 404/410.

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

Từ spec §2.2, §3 và phiên bản ghim:

- Phiên bản ghim chính xác (không dùng `^`/`~`): `next` 16.4.3, `react` 19.3.1, `react-dom` 19.3.1, `@supabase/supabase-js` 2.118.0, `@tanstack/react-query` 5.105.0, `@tanstack/react-query-persist-client` 5.105.0, `dexie` 4.4.7, `zod` 4.6.7, `recharts` 3.10.1, `react-is` 19.3.1, `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, `typescript` 5.9.3, `vitest` 5.0.5, `supabase` 2.122.0, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 22.20.5, `vite` 7.3.7. M11 thêm `web-push` 3.6.7 và dev `@types/web-push` 3.6.4.
- Trình quản lý gói: Bun 1.x (`bun install`, `bun run`). TypeScript `strict: true`.
- Mọi API route khai báo `export const runtime = 'nodejs'`.
- Cron: Vercel Hobby chỉ cho cron 1 lần/ngày nên **không dùng Vercel Cron**. Dùng `pg_cron` + `pg_net` trong Supabase. `APP_URL` và `CRON_SECRET` đọc từ Supabase Vault (secret tên `app_url` và `cron_secret`, đọc qua `vault.decrypted_secrets`), không viết cứng trong migration.
- `/api/push/dispatch`: chỉ chấp nhận `Authorization: Bearer <CRON_SECRET>` (so sánh thời gian hằng định), sai thì trả 401. Lấy dữ liệu bằng service role. Mỗi mục: `insert into notification_log … on conflict do nothing returning id`, chỉ gửi khi insert thành công. TTL 3600 giây, `urgency: 'high'` cho `feed`/`wake`, `'normal'` cho `vaccine`. Phản hồi 404/410 thì xóa subscription, thành công thì cập nhật `last_success_at`, lỗi khác thì `console.error`. Trả `200 { selected, sent, failed }`.
- Biến môi trường server: `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (dạng `mailto:<email chủ app>`), `CRON_SECRET` (chuỗi ngẫu nhiên ≥ 32 byte, trùng giá trị trong Supabase Vault). Client: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- Toàn bộ logic nghiệp vụ (gồm chọn thông báo) là hàm thuần trong `lib/rules/`, không gọi mạng hay DB, có unit test.
- Supabase project đặt ở region `ap-southeast-1` (Singapore).
- Runtime: Node.js 22.x (`"engines": { "node": "22.x" }` trong `package.json`).
- Thư viện được phép (spec §2.2): `@supabase/supabase-js` 2.x, `web-push` 3.x, `dexie` 4.x, `@tanstack/react-query` 5.x, `@tanstack/react-query-persist-client` 5.x, `zod` 4.x, `recharts` 3.x, Tailwind CSS 4.x, `vitest` 3.x trở lên; dev-only `exceljs` 4.x. Thêm thư viện khác phải ghi lý do trong plan.
- Mức hỗ trợ: Safari iOS 16.4 trở lên. Thiết bị kiểm thử: iPhone 11, iPhone 16, iPhone 17 Pro.

Từ M10:

- `SUPABASE_SERVICE_ROLE_KEY` chỉ đọc trong `lib/server/`, và chỉ API route import thư mục đó. Build không được chứa `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET` trong `.next/static`.
- Không đọc, không in, không commit giá trị bí mật nào. Người dùng tự tạo và tự dán secret vào Vercel và Supabase Vault.

Riêng M11:

- Trước khi viết code Next.js, đọc `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` và `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` (mục "3. Implementing Server Actions": cách dùng `webpush.sendNotification`). Đây là yêu cầu của `AGENTS.md`.
- Mã nguồn theo định dạng hiện có của repo: nháy kép, dấu chấm phẩy, có dấu phẩy cuối (prettier).
- Câu chữ tiếng Việt trong `lib/rules/pushSelection.ts` phải đúng từng ký tự như plan này (có test khóa lại).

## Contracts with Other Plans

**Consumes** (đã có trong repo, commit `fbb1410`..`730f691`):

- **Bảng (M1, M10):**
  - `babies(id, family_id, feed_interval_min)`, `logs(id, baby_id, type, started_at, ended_at)`, `family_members(family_id, user_id)`.
  - `push_subscriptions(id, user_id, endpoint, p256dh, auth, last_success_at)`, `notification_prefs(user_id, feed_reminder, snooze_until)`.
  - `notification_log(user_id, kind, ref_key, unique(user_id, kind, ref_key))`.
- **Server (M10):** `supabaseServiceRole()` (`lib/server/supabaseServer.ts`), `bearerToken()` (`lib/server/pushSubscriptions.ts`).
- **Quy tắc:** `formatVnTime` (`lib/rules/time.ts`).
- **Service worker (M9):** sự kiện `push` đọc `{ title, body, tag, url }`, `notificationclick` mở `url`.
- **Phía người dùng (M10):** đã bật thông báo, nên có dòng `push_subscriptions`. Vercel đã có `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.

**Produces** (đợt 2 và M12 dùng):

- `lib/rules/pushSelection.ts`: `NotificationKind`, `Recipient`, `BabyDispatchState`, `DueNotification`, `agoText`, `selectDueNotifications(babies, now)`. Đợt 2 thêm luật `wake` và `vaccine` vào hàm này.
- `lib/server/secret.ts`: `secretsMatch(given, expected)`
- `lib/server/pushEnv.ts`: `PushEnv`, `parsePushEnv`, `pushEnv()`
- `lib/server/dispatch.ts`: `StoredSubscription`, `SendResult`, `DispatchDeps`, `DispatchResult`, `runDispatch(deps, now)`, `handleDispatch(request, deps, now?)`
- `lib/server/dispatchDeps.ts`: `supabaseDispatchDeps()`
- `POST /api/push/dispatch`
- Migration `20261114000300_push_cron.sql`: job `push-dispatch` mỗi phút; test `005_push_cron.test.sql`
- README bước 8; `docs/device-checklist.md` bước 2 và 7

## File Structure

```
lib/rules/pushSelection.ts (+ test)      # luật chọn nhắc bú §8.3
lib/server/secret.ts (+ test)            # so sánh secret thời gian hằng định
lib/server/pushEnv.ts                    # đọc VAPID + CRON_SECRET
lib/server/dispatch.ts (+ test)          # điều phối: nhận, gửi, dọn đăng ký
lib/server/dispatchDeps.ts               # nối với Supabase (service role) và web-push
app/api/push/dispatch/route.ts
package.json, bun.lock                   # thêm web-push, @types/web-push
supabase/migrations/20261114000300_push_cron.sql, supabase/tests/005_push_cron.test.sql
README.md, docs/device-checklist.md      # sửa: thiết lập cron, checklist bước 2 và 7
```

## Tasks

1. Luật chọn nhắc bú
2. Điều phối gửi: secret, không gửi trùng, dọn đăng ký chết
3. Route `/api/push/dispatch` với Supabase và `web-push`
4. Lịch pg_cron, Vault và thử trên iPhone

---

### Task 1: Luật chọn nhắc bú

**Files:**

- Create: `lib/rules/pushSelection.ts`
- Test: `lib/rules/pushSelection.test.ts`

**Interfaces:**

- Consumes: `formatVnTime(instant: Date): string` (`lib/rules/time.ts`)
- Produces:
  - `type NotificationKind = "feed" | "wake" | "vaccine"`
  - `type Recipient = { userId: string; prefs: { feed_reminder: boolean; snooze_until: string | null } | null }`
  - `type BabyDispatchState = { babyId: string; feedIntervalMin: number; lastFeed: { id: string; startedAt: string } | null; breastRunning: boolean; recipients: Recipient[] }`
  - `type DueNotification = { userId; kind: NotificationKind; refKey; title; body; url; tag }` (mọi trường còn lại là `string`)
  - `agoText(ms: number): string`
  - `selectDueNotifications(babies: BabyDispatchState[], now: Date): DueNotification[]`

- [ ] **Step 1: Kiểm tra trạng thái repo**

Run: `git status --short && git log --oneline -1`
Expected: chỉ có `?? docs/blueprint/plans/2026-11-14-baby-tracker-web-m11.md` (file plan này, đi chung commit của Task 1); commit mới nhất là `730f691 feat(push): enable notifications per device, preference switches and snooze`.

- [ ] **Step 2: Viết test thất bại**

Tạo `lib/rules/pushSelection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  agoText,
  selectDueNotifications,
  type BabyDispatchState,
} from "./pushSelection";

const now = new Date("2026-11-15T03:00:00Z"); // 10:00 on 15/11 in VN
const minutesAgo = (m: number) =>
  new Date(now.getTime() - m * 60_000).toISOString();

function baby(over: Partial<BabyDispatchState> = {}): BabyDispatchState {
  return {
    babyId: "b1",
    feedIntervalMin: 180,
    lastFeed: { id: "L1", startedAt: minutesAgo(190) },
    breastRunning: false,
    recipients: [{ userId: "u1", prefs: null }],
    ...over,
  };
}

describe("selectDueNotifications — feed (spec §8.3)", () => {
  it("reminds every recipient once the interval has passed", () => {
    const due = selectDueNotifications(
      [
        baby({
          recipients: [
            { userId: "u1", prefs: null },
            { userId: "u2", prefs: null },
          ],
        }),
      ],
      now,
    );
    expect(due).toEqual([
      {
        userId: "u1",
        kind: "feed",
        refKey: "feed:L1",
        title: "Đến giờ bú rồi",
        body: "Cữ trước lúc 06:50 (3 giờ 10 phút trước).",
        url: "/",
        tag: "feed:b1",
      },
      expect.objectContaining({ userId: "u2", refKey: "feed:L1" }),
    ]);
  });

  it("waits until exactly started_at + feed_interval_min", () => {
    expect(
      selectDueNotifications(
        [baby({ lastFeed: { id: "L1", startedAt: minutesAgo(179) } })],
        now,
      ),
    ).toEqual([]);
    expect(
      selectDueNotifications(
        [baby({ lastFeed: { id: "L1", startedAt: minutesAgo(180) } })],
        now,
      ),
    ).toHaveLength(1);
  });

  it("stays quiet when the last feed is older than 12 hours, or there is none", () => {
    expect(
      selectDueNotifications(
        [baby({ lastFeed: { id: "L1", startedAt: minutesAgo(720) } })],
        now,
      ),
    ).toHaveLength(1);
    expect(
      selectDueNotifications(
        [baby({ lastFeed: { id: "L1", startedAt: minutesAgo(721) } })],
        now,
      ),
    ).toEqual([]);
    expect(selectDueNotifications([baby({ lastFeed: null })], now)).toEqual([]);
  });

  it("stays quiet while a breast timer is running", () => {
    expect(
      selectDueNotifications([baby({ breastRunning: true })], now),
    ).toEqual([]);
  });

  it("respects the feed switch and snooze; an expired snooze no longer blocks", () => {
    const due = selectDueNotifications(
      [
        baby({
          recipients: [
            {
              userId: "off",
              prefs: { feed_reminder: false, snooze_until: null },
            },
            {
              userId: "snoozed",
              prefs: { feed_reminder: true, snooze_until: minutesAgo(-30) },
            },
            {
              userId: "woke",
              prefs: { feed_reminder: true, snooze_until: minutesAgo(1) },
            },
            {
              userId: "plain",
              prefs: { feed_reminder: true, snooze_until: null },
            },
          ],
        }),
      ],
      now,
    );
    expect(due.map((d) => d.userId)).toEqual(["woke", "plain"]);
  });

  it("handles each baby on its own", () => {
    const due = selectDueNotifications(
      [
        baby(),
        baby({
          babyId: "b2",
          lastFeed: { id: "L2", startedAt: minutesAgo(30) },
        }),
      ],
      now,
    );
    expect(due.map((d) => d.tag)).toEqual(["feed:b1"]);
  });

  it("agoText writes hours and minutes", () => {
    expect(agoText(185 * 60_000)).toBe("3 giờ 5 phút trước");
    expect(agoText(120 * 60_000)).toBe("2 giờ trước");
    expect(agoText(45 * 60_000 + 59_000)).toBe("45 phút trước");
  });
});
```

- [ ] **Step 3: Chạy test để thấy thất bại**

Run: `bun run test lib/rules/pushSelection.test.ts`
Expected: FAIL — `Cannot find module './pushSelection'`.

- [ ] **Step 4: Viết `lib/rules/pushSelection.ts`**

```ts
import { formatVnTime } from "./time";

export type NotificationKind = "feed" | "wake" | "vaccine";

export type Recipient = {
  userId: string;
  // null: the user never saved preferences, so every switch is on (spec §5.2).
  prefs: { feed_reminder: boolean; snooze_until: string | null } | null;
};

export type BabyDispatchState = {
  babyId: string;
  feedIntervalMin: number;
  // Latest breast/bottle log by started_at, or null when there is none.
  lastFeed: { id: string; startedAt: string } | null;
  breastRunning: boolean;
  // Members with a user_id and at least one push subscription.
  recipients: Recipient[];
};

export type DueNotification = {
  userId: string;
  kind: NotificationKind;
  refKey: string;
  title: string;
  body: string;
  url: string;
  tag: string;
};

const HOUR_MS = 3_600_000;
const RECENT_FEED_MS = 12 * HOUR_MS;

export function agoText(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút trước`;
  if (minutes === 0) return `${hours} giờ trước`;
  return `${hours} giờ ${minutes} phút trước`;
}

function wantsFeed(recipient: Recipient, now: Date): boolean {
  const prefs = recipient.prefs;
  if (!prefs) return true;
  if (!prefs.feed_reminder) return false;
  return (
    prefs.snooze_until === null ||
    Date.parse(prefs.snooze_until) < now.getTime()
  );
}

function feedReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
  const last = baby.lastFeed;
  if (!last || baby.breastRunning) return [];
  const since = now.getTime() - Date.parse(last.startedAt);
  if (since > RECENT_FEED_MS) return [];
  if (since < baby.feedIntervalMin * 60_000) return [];
  const body = `Cữ trước lúc ${formatVnTime(new Date(last.startedAt))} (${agoText(since)}).`;
  return baby.recipients
    .filter((recipient) => wantsFeed(recipient, now))
    .map((recipient) => ({
      userId: recipient.userId,
      kind: "feed",
      refKey: `feed:${last.id}`,
      title: "Đến giờ bú rồi",
      body,
      url: "/",
      tag: `feed:${baby.babyId}`,
    }));
}

// Spec §8.3. Release 1 sends only "feed"; "wake" and "vaccine" come in release 2.
export function selectDueNotifications(
  babies: BabyDispatchState[],
  now: Date,
): DueNotification[] {
  return babies.flatMap((baby) => feedReminders(baby, now));
}
```

- [ ] **Step 5: Chạy test để thấy đạt**

Run: `bun run test lib/rules/pushSelection.test.ts && bun run typecheck`
Expected: PASS — 7 test; không lỗi type.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(rules): select due feed reminders per spec 8.3"
```

`git add -A` lần này đưa cả file plan M11 vào commit.

---

### Task 2: Điều phối gửi: secret, không gửi trùng, dọn đăng ký chết

**Files:**

- Create: `lib/server/secret.ts`, `lib/server/pushEnv.ts`, `lib/server/dispatch.ts`
- Test: `lib/server/secret.test.ts`, `lib/server/dispatch.test.ts`

**Interfaces:**

- Consumes: `selectDueNotifications`, `BabyDispatchState`, `DueNotification` (Task 1); `bearerToken` (M10)
- Produces:
  - `secretsMatch(given: string | null, expected: string): boolean` — `null` hoặc `expected` rỗng → `false`
  - `parsePushEnv(raw)`, `pushEnv(): { NEXT_PUBLIC_VAPID_PUBLIC_KEY; VAPID_PRIVATE_KEY; VAPID_SUBJECT; CRON_SECRET }` — thiếu hoặc sai thì ném `Thiếu hoặc sai biến môi trường: …`
  - `type StoredSubscription = { id; endpoint; p256dh; auth }`; `type SendResult = { ok: true } | { ok: false; statusCode: number | null }`
  - `type DispatchDeps = { cronSecret(); loadState(now); claim(item): Promise<boolean>; subscriptionsFor(userId); send(subscription, item): Promise<SendResult>; deleteSubscription(id); markSuccess(id, at) }`
  - `runDispatch(deps, now): Promise<{ selected; sent; failed }>`; `handleDispatch(request: Request, deps, now = new Date()): Promise<Response>`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/server/secret.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { secretsMatch } from "./secret";

describe("secretsMatch", () => {
  it("accepts only the exact secret", () => {
    expect(secretsMatch("s3cret-value", "s3cret-value")).toBe(true);
    expect(secretsMatch("s3cret-valuE", "s3cret-value")).toBe(false);
    expect(secretsMatch("short", "s3cret-value")).toBe(false);
    expect(secretsMatch(null, "s3cret-value")).toBe(false);
    expect(secretsMatch("", "")).toBe(false);
  });
});
```

Tạo `lib/server/dispatch.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { BabyDispatchState } from "@/lib/rules/pushSelection";
import {
  handleDispatch,
  type DispatchDeps,
  type SendResult,
  type StoredSubscription,
} from "./dispatch";

const SECRET = "c".repeat(64);
const now = new Date("2026-11-15T03:00:00Z");

const dueBaby: BabyDispatchState = {
  babyId: "b1",
  feedIntervalMin: 180,
  lastFeed: { id: "L1", startedAt: "2026-11-14T23:00:00Z" }, // 4 hours ago
  breastRunning: false,
  recipients: [{ userId: "u1", prefs: null }],
};

function fakeDeps(
  subscriptions: StoredSubscription[],
  sendResult: (s: StoredSubscription) => SendResult = () => ({ ok: true }),
) {
  const log = new Set<string>();
  const deps = {
    cronSecret: () => SECRET,
    loadState: async () => [dueBaby],
    claim: vi.fn(
      async (item: { userId: string; kind: string; refKey: string }) => {
        const key = `${item.userId}|${item.kind}|${item.refKey}`;
        if (log.has(key)) return false;
        log.add(key);
        return true;
      },
    ),
    subscriptionsFor: async () => subscriptions,
    send: vi.fn(async (s: StoredSubscription) => sendResult(s)),
    deleteSubscription: vi.fn(async () => undefined),
    markSuccess: vi.fn(async () => undefined),
  } satisfies DispatchDeps;
  return deps;
}

const sub = (id: string): StoredSubscription => ({
  id,
  endpoint: `https://web.push.apple.com/${id}`,
  p256dh: "p",
  auth: "a",
});

const call = (deps: DispatchDeps, token?: string) =>
  handleDispatch(
    new Request("https://bunkid.test/api/push/dispatch", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
    deps,
    now,
  );

describe("POST /api/push/dispatch", () => {
  it("answers 401 to a missing or wrong secret and sends nothing", async () => {
    const deps = fakeDeps([sub("s1")]);
    expect((await call(deps)).status).toBe(401);
    expect((await call(deps, "d".repeat(64))).status).toBe(401);
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("sends each reminder once even when cron calls twice", async () => {
    const deps = fakeDeps([sub("s1"), sub("s2")]);
    const first = await call(deps, SECRET);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ selected: 1, sent: 2, failed: 0 });
    expect(await (await call(deps, SECRET)).json()).toEqual({
      selected: 1,
      sent: 0,
      failed: 0,
    });
    expect(deps.send).toHaveBeenCalledTimes(2);
    expect(deps.markSuccess).toHaveBeenCalledWith("s1", now);
  });

  it("removes subscriptions the push service reports as gone (404/410)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const deps = fakeDeps([sub("gone"), sub("expired"), sub("flaky")], (s) =>
      s.id === "gone"
        ? { ok: false, statusCode: 410 }
        : s.id === "expired"
          ? { ok: false, statusCode: 404 }
          : { ok: false, statusCode: 500 },
    );
    expect(await (await call(deps, SECRET)).json()).toEqual({
      selected: 1,
      sent: 0,
      failed: 3,
    });
    expect(deps.deleteSubscription.mock.calls).toEqual([["gone"], ["expired"]]);
    expect(error).toHaveBeenCalledWith("push send failed", "flaky", 500);
    error.mockRestore();
  });

  it("answers 500 when the secret is not configured", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const deps = {
      ...fakeDeps([]),
      cronSecret: () => {
        throw new Error("Thiếu hoặc sai biến môi trường: CRON_SECRET");
      },
    };
    expect((await call(deps, SECRET)).status).toBe(500);
    error.mockRestore();
  });
});
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `bun run test lib/server/secret.test.ts lib/server/dispatch.test.ts`
Expected: FAIL — `Cannot find module './secret'` và `Cannot find module './dispatch'`.

- [ ] **Step 3: Viết `lib/server/secret.ts`**

```ts
import { createHash, timingSafeEqual } from "node:crypto";

// Hashing first gives equal-length buffers, so timingSafeEqual never throws
// and the comparison time does not depend on where the strings differ.
export function secretsMatch(given: string | null, expected: string): boolean {
  if (given === null || expected === "") return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
```

- [ ] **Step 4: Viết `lib/server/pushEnv.ts`**

```ts
import { z } from "zod";

// Secrets for /api/push/dispatch. Server-only; never import from a client module.
const PushEnvSchema = z.object({
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(20),
  VAPID_PRIVATE_KEY: z.string().min(20),
  VAPID_SUBJECT: z.string().startsWith("mailto:"),
  CRON_SECRET: z.string().min(32),
});

export type PushEnv = z.infer<typeof PushEnvSchema>;

export function parsePushEnv(raw: Record<string, string | undefined>): PushEnv {
  const result = PushEnvSchema.safeParse(raw);
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Thiếu hoặc sai biến môi trường: ${names.join(", ")}`);
  }
  return result.data;
}

export function pushEnv(): PushEnv {
  return parsePushEnv({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}
```

- [ ] **Step 5: Viết `lib/server/dispatch.ts`**

```ts
import {
  selectDueNotifications,
  type BabyDispatchState,
  type DueNotification,
} from "@/lib/rules/pushSelection";
import { bearerToken } from "./pushSubscriptions";
import { secretsMatch } from "./secret";

export type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SendResult =
  { ok: true } | { ok: false; statusCode: number | null };

export type DispatchDeps = {
  cronSecret(): string;
  loadState(now: Date): Promise<BabyDispatchState[]>;
  // Inserts into notification_log; false when (user, kind, ref_key) was already sent.
  claim(item: DueNotification): Promise<boolean>;
  subscriptionsFor(userId: string): Promise<StoredSubscription[]>;
  send(
    subscription: StoredSubscription,
    item: DueNotification,
  ): Promise<SendResult>;
  deleteSubscription(id: string): Promise<void>;
  markSuccess(id: string, at: Date): Promise<void>;
};

export type DispatchResult = { selected: number; sent: number; failed: number };

export async function runDispatch(
  deps: DispatchDeps,
  now: Date,
): Promise<DispatchResult> {
  const items = selectDueNotifications(await deps.loadState(now), now);
  const result: DispatchResult = { selected: items.length, sent: 0, failed: 0 };
  for (const item of items) {
    // Claim first: a second cron run in the same minute finds the log row and stops.
    if (!(await deps.claim(item))) continue;
    for (const subscription of await deps.subscriptionsFor(item.userId)) {
      const outcome = await deps.send(subscription, item);
      if (outcome.ok) {
        result.sent += 1;
        await deps.markSuccess(subscription.id, now);
      } else {
        result.failed += 1;
        if (outcome.statusCode === 404 || outcome.statusCode === 410)
          await deps.deleteSubscription(subscription.id);
        else
          console.error(
            "push send failed",
            subscription.id,
            outcome.statusCode,
          );
      }
    }
  }
  return result;
}

export async function handleDispatch(
  request: Request,
  deps: DispatchDeps,
  now: Date = new Date(),
): Promise<Response> {
  let secret: string;
  try {
    secret = deps.cronSecret();
  } catch (error) {
    console.error("push dispatch is not configured", error);
    return Response.json({ error: "not_configured" }, { status: 500 });
  }
  if (!secretsMatch(bearerToken(request.headers.get("authorization")), secret))
    return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    return Response.json(await runDispatch(deps, now));
  } catch (error) {
    console.error("push dispatch failed", error);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Chạy test để thấy đạt**

Run: `bun run test lib/server/secret.test.ts lib/server/dispatch.test.ts && bun run typecheck`
Expected: PASS — secret 1 test, dispatch 4 test; không lỗi type.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(push): dispatch with cron secret, send-once log and dead subscription cleanup"
```

---

### Task 3: Route `/api/push/dispatch` với Supabase và `web-push`

**Files:**

- Create: `lib/server/dispatchDeps.ts`, `app/api/push/dispatch/route.ts`
- Modify: `package.json`, `bun.lock` (qua `bun add`)

**Interfaces:**

- Consumes: `DispatchDeps`, `handleDispatch` (Task 2); `pushEnv` (Task 2); `supabaseServiceRole` (M10); bảng ở "Consumes"
- Produces: `supabaseDispatchDeps(): DispatchDeps`; `POST /api/push/dispatch` (`runtime = "nodejs"`)

- [ ] **Step 1: Đọc tài liệu Next.js**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` và `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`, mục "3. Implementing Server Actions" (cách gọi `webpush.sendNotification` với khóa VAPID).

- [ ] **Step 2: Cài thư viện**

Run: `bun add web-push@3.6.7 --exact && bun add -d @types/web-push@3.6.4 --exact`
Expected:
- In ra `installed web-push@3.6.7` và `installed @types/web-push@3.6.4`.
- Trong `package.json`, `dependencies` có `"web-push": "3.6.7"` và `devDependencies` có `"@types/web-push": "3.6.4"`, không có `^`.

- [ ] **Step 3: Viết `lib/server/dispatchDeps.ts`**

```ts
import webpush from "web-push";
import type { BabyDispatchState } from "@/lib/rules/pushSelection";
import type { DispatchDeps } from "./dispatch";
import { pushEnv } from "./pushEnv";
import { supabaseServiceRole } from "./supabaseServer";

const TWELVE_HOURS_MS = 12 * 3_600_000;

async function loadState(now: Date): Promise<BabyDispatchState[]> {
  const db = supabaseServiceRole();
  const { data: babies, error } = await db
    .from("babies")
    .select("id, family_id, feed_interval_min");
  if (error) throw error;

  const states: BabyDispatchState[] = [];
  for (const baby of babies) {
    const since = new Date(now.getTime() - TWELVE_HOURS_MS).toISOString();
    const [feeds, running, members] = await Promise.all([
      db
        .from("logs")
        .select("id, started_at")
        .eq("baby_id", baby.id)
        .in("type", ["breast", "bottle"])
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(1),
      db
        .from("logs")
        .select("id")
        .eq("baby_id", baby.id)
        .eq("type", "breast")
        .is("ended_at", null)
        .limit(1),
      db
        .from("family_members")
        .select("user_id")
        .eq("family_id", baby.family_id)
        .not("user_id", "is", null),
    ]);
    for (const result of [feeds, running, members])
      if (result.error) throw result.error;

    const userIds = (members.data ?? []).flatMap((m) =>
      m.user_id ? [m.user_id] : [],
    );
    const [subscribed, prefs] = await Promise.all([
      db.from("push_subscriptions").select("user_id").in("user_id", userIds),
      db
        .from("notification_prefs")
        .select("user_id, feed_reminder, snooze_until")
        .in("user_id", userIds),
    ]);
    if (subscribed.error) throw subscribed.error;
    if (prefs.error) throw prefs.error;
    const withSubscription = new Set(subscribed.data.map((s) => s.user_id));
    const last = feeds.data?.[0];

    states.push({
      babyId: baby.id,
      feedIntervalMin: baby.feed_interval_min,
      lastFeed: last ? { id: last.id, startedAt: last.started_at } : null,
      breastRunning: (running.data ?? []).length > 0,
      recipients: userIds
        .filter((id) => withSubscription.has(id))
        .map((userId) => {
          const row = prefs.data.find((p) => p.user_id === userId);
          return {
            userId,
            prefs: row
              ? {
                  feed_reminder: row.feed_reminder,
                  snooze_until: row.snooze_until,
                }
              : null,
          };
        }),
    });
  }
  return states;
}

export function supabaseDispatchDeps(): DispatchDeps {
  // Created on first use, so a wrong secret gets its 401 without touching Supabase.
  let client: ReturnType<typeof supabaseServiceRole> | null = null;
  const db = () => (client ??= supabaseServiceRole());
  return {
    cronSecret: () => pushEnv().CRON_SECRET,
    loadState,
    async claim(item) {
      const { data, error } = await db()
        .from("notification_log")
        .upsert(
          { user_id: item.userId, kind: item.kind, ref_key: item.refKey },
          { onConflict: "user_id,kind,ref_key", ignoreDuplicates: true },
        )
        .select("id");
      if (error) throw error;
      return data.length > 0;
    },
    async subscriptionsFor(userId) {
      const { data, error } = await db()
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    async send(subscription, item) {
      const env = pushEnv();
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: item.title,
            body: item.body,
            tag: item.tag,
            url: item.url,
          }),
          {
            TTL: 3600,
            urgency: item.kind === "vaccine" ? "normal" : "high",
            vapidDetails: {
              subject: env.VAPID_SUBJECT,
              publicKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
              privateKey: env.VAPID_PRIVATE_KEY,
            },
          },
        );
        return { ok: true };
      } catch (error) {
        if (error instanceof webpush.WebPushError)
          return { ok: false, statusCode: error.statusCode };
        // Not an answer from the push service (bad VAPID key, network): log why.
        console.error(
          "web-push failed before reaching the push service",
          error,
        );
        return { ok: false, statusCode: null };
      }
    },
    async deleteSubscription(id) {
      const { error } = await db()
        .from("push_subscriptions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    async markSuccess(id, at) {
      const { error } = await db()
        .from("push_subscriptions")
        .update({ last_success_at: at.toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
  };
}
```

- [ ] **Step 4: Viết `app/api/push/dispatch/route.ts`**

```ts
import { handleDispatch } from "@/lib/server/dispatch";
import { supabaseDispatchDeps } from "@/lib/server/dispatchDeps";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleDispatch(request, supabaseDispatchDeps());
}
```

- [ ] **Step 5: Kiểm tra type, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected:
- Không lỗi type; `Tests  157 passed (157)` (145 của M1–M10 + 7 + 5).
- Build thành công, danh sách route có `ƒ /api/push/dispatch`, `ƒ /api/push/subscribe`, `ƒ /api/push/unsubscribe`.

Run: `grep -rlE 'SUPABASE_SERVICE_ROLE_KEY|VAPID_PRIVATE_KEY|CRON_SECRET' .next/static | wc -l`
Expected: `0`.

- [ ] **Step 6: Thử route bằng bản production ở máy (giá trị giả, không phải bí mật thật)**

Build lại với biến `NEXT_PUBLIC_*` giả, vì Next.js chép chúng vào code lúc build. Rồi chạy server với các biến server giả:

```bash
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key-0000000000 NEXT_PUBLIC_VAPID_PUBLIC_KEY=dummy-public-key-00000000000 && bun run build
```

```bash
PORT=3100 CRON_SECRET=test-secret-test-secret-test-secret-00 VAPID_PRIVATE_KEY=dummy-private-key-0000000000 VAPID_SUBJECT=mailto:test@example.com SUPABASE_SERVICE_ROLE_KEY=not-a-real-service-role-key-000 bun run start
```

Lệnh thứ hai chạy nền. Ở terminal khác:

```bash
curl -s -w ' %{http_code}\n' -X POST http://localhost:3100/api/push/dispatch
```

```bash
curl -s -w ' %{http_code}\n' -X POST -H 'authorization: Bearer wrong' http://localhost:3100/api/push/dispatch
```

```bash
curl -s -w ' %{http_code}\n' -X POST -H 'authorization: Bearer test-secret-test-secret-test-secret-00' http://localhost:3100/api/push/dispatch
```

Expected:
- Hai lệnh đầu: `{"error":"unauthorized"} 401`.
- Lệnh thứ ba: `{"error":"server_error"} 500`. Secret đúng nên handler đi tiếp, nhưng khóa service role là giả nên Supabase từ chối và không tải được dữ liệu.
- Mọi biến trong lệnh đều có giá trị khác rỗng. Lý do: Next.js chỉ lấy giá trị từ file biến môi trường của máy khi biến chưa có hoặc rỗng, nên giá trị đặt trong lệnh luôn thắng, và lần thử này không chạm tới khóa thật.

Sau đó tắt server (`lsof -ti :3100 -sTCP:LISTEN | xargs kill`), chạy `unset NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_VAPID_PUBLIC_KEY`, và chạy `bun run build` lại một lần để `.next` không còn giá trị giả.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(push): /api/push/dispatch sends feed reminders with web-push"
```

---

### Task 4: Lịch pg_cron, Vault và thử trên iPhone

**Files:**

- Create: `supabase/migrations/20261114000300_push_cron.sql`
- Modify: `README.md` (thêm bước 8), `docs/device-checklist.md` (thêm bước 2 và 7)
- Test: `supabase/tests/005_push_cron.test.sql`

**Interfaces:**

- Consumes: `POST /api/push/dispatch` (Task 3); Supabase Vault (`vault.decrypted_secrets`), `pg_cron`, `pg_net` (có sẵn trong Supabase local và cloud)
- Produces: job `push-dispatch` (`* * * * *`), không làm gì khi Vault thiếu `app_url` hoặc `cron_secret`

- [ ] **Step 1: Viết test pgTAP thất bại**

Tạo `supabase/tests/005_push_cron.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select is(
  (select schedule from cron.job where jobname = 'push-dispatch'),
  '* * * * *',
  'push-dispatch runs every minute');
select ok(
  (select command like '%/api/push/dispatch%' from cron.job where jobname = 'push-dispatch'),
  'push-dispatch calls /api/push/dispatch');
select ok(
  (select command like '%vault.decrypted_secrets%' and command not like '%vercel.app%'
   from cron.job where jobname = 'push-dispatch'),
  'push-dispatch reads the URL and secret from Vault');

-- Without the Vault secrets the job must run cleanly and send nothing.
select lives_ok(
  (select command from cron.job where jobname = 'push-dispatch'),
  'push-dispatch is a no-op until app_url and cron_secret exist');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test để thấy thất bại**

Run: `open -a OrbStack && bun run db:start && bun run db:test`
Expected: FAIL — `005_push_cron.test.sql` báo lỗi `relation "cron.job" does not exist` (hoặc `schema "cron" does not exist`); bốn file test cũ vẫn `ok`.

- [ ] **Step 3: Viết migration**

Tạo `supabase/migrations/20261114000300_push_cron.sql`:

```sql
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Every minute, POST /api/push/dispatch. The app URL and the shared secret live in
-- Supabase Vault (secrets "app_url" and "cron_secret"), never in this file.
-- Until both secrets exist the job does nothing.
select cron.schedule(
  'push-dispatch',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url')
      || '/api/push/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'app_url')
    and exists (select 1 from vault.decrypted_secrets where name = 'cron_secret');
  $$
);
```

- [ ] **Step 4: Chạy test để thấy đạt**

Run: `bun run db:reset && bun run db:test`
Expected: PASS — `001`…`004` `ok`, `005_push_cron.test.sql .. ok`, `All tests successful.`

- [ ] **Step 5: Thêm hướng dẫn vào `README.md`**

Thêm vào cuối mục "## Thiết lập lần đầu" (sau bước 7):

````markdown
8. Gửi nhắc bú (M11):
   - Tạo một chuỗi bí mật: `openssl rand -hex 32`.
   - Vercel → Environment Variables: thêm `CRON_SECRET` = chuỗi đó, rồi deploy lại.
   - Supabase → SQL Editor, chạy (thay hai giá trị trong nháy đơn):

     ```sql
     select vault.create_secret('https://bunkid.vercel.app', 'app_url'); -- không có dấu / ở cuối
     select vault.create_secret('<chuỗi CRON_SECRET ở trên>', 'cron_secret');
     ```

   - Cron `push-dispatch` (migration `20261114000300_push_cron.sql`) gọi `/api/push/dispatch` mỗi phút. Xem lịch sử ở Supabase → Integrations → Cron.
   - Khi project Supabase bị tạm dừng (bước 6) thì cron cũng dừng, không có nhắc.
````

- [ ] **Step 6: Thêm bước 2 và 7 vào `docs/device-checklist.md`**

Thêm vào cuối file:

```markdown
## Bước 2 — Nhắc bú (M11)

1. Cài đặt → Thông báo: "Máy này đang nhận thông báo.". Cài đặt → Khoảng cách cữ bú: chọn "1 giờ" → Lưu.
2. Nhật ký → "+ Thêm" → Bú bình 30 ml, Thời điểm = bây giờ trừ 59 phút → Lưu. Khóa màn hình.
3. Kỳ vọng: trong ≤ 2 phút nhận thông báo "Đến giờ bú rồi" / "Cữ trước lúc HH:mm (1 giờ … trước)." trên mọi máy đã bật thông báo; bấm vào thì mở trang chủ Bé Yêu.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         | Chỉ khi đã lên iOS 16.4 trở lên |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |

## Bước 7 — Tạm tắt (M11, phần nhắc bú)

1. Cài đặt → Thông báo → "2 giờ".
2. Nhật ký → "+ Thêm" → Bú bình 30 ml, Thời điểm = bây giờ trừ 61 phút → Lưu. Kỳ vọng: 3 phút không có thông báo trên máy này.
3. Bấm "Bật lại". Kỳ vọng: trong ≤ 2 phút nhận "Đến giờ bú rồi".
4. Dọn dẹp: xóa hai bản ghi Bú bình thử; Khoảng cách cữ bú đặt lại giá trị cũ (thường "3 giờ").
5. Phần "nhắc tiêm vẫn đến khi tạm tắt" kiểm ở đợt 2.

| Máy           | iOS | Kết quả | Ghi chú |
| ------------- | --- | ------- | ------- |
| iPhone 11     |     |         | Chỉ khi đã lên iOS 16.4 trở lên |
| iPhone 16     |     |         |         |
| iPhone 17 Pro |     |         |         |
```

- [ ] **Step 7: Commit, rồi nhờ người dùng thiết lập**

```bash
git add -A && git commit -m "feat(push): pg_cron job calling dispatch every minute via Vault secrets"
```

Nhờ người dùng làm. Không chạy thay, không đọc hay in giá trị bí mật:

1. Chạy `bunx supabase db push` → `Applying migration 20261114000300_push_cron.sql...`, `Finished supabase db push.`
2. Làm bước 8 của README: tạo `CRON_SECRET`, thêm vào Vercel, rồi tạo hai Vault secret `app_url` và `cron_secret` trong Supabase SQL Editor.

Chờ người dùng xác nhận cả hai việc rồi mới push.

- [ ] **Step 8: Deploy và xem cron chạy**

Run: `git push`
Expected: Vercel deploy Ready ở https://bunkid.vercel.app (bản này có `CRON_SECRET`).

Nhờ người dùng chạy trong Supabase SQL Editor, khoảng 2 phút sau deploy:

```sql
select status_code, content from net._http_response order by created desc limit 3;
```

Expected: các dòng mới nhất có `status_code` `200` và `content` dạng `{"selected":0,"sent":0,"failed":0}` (hoặc số khác 0 nếu đang đến giờ bú). Nếu thấy `401`, `cron_secret` trong Vault khác `CRON_SECRET` trên Vercel. Nếu thấy `500` với `not_configured`, Vercel còn thiếu biến.

- [ ] **Step 9: 👤 Thử trên iPhone (checklist bước 2 và 7)**

Nhờ người dùng làm theo `docs/device-checklist.md` bước 2 và bước 7 trên iPhone 16 và iPhone 17 Pro, điền bảng kết quả, rồi xác nhận đạt. Thêm iPhone 11 nếu máy đã lên iOS 16.4 trở lên. Lúc làm M5, máy này còn ở iOS 16.3, và spec §11 cần cả 3 máy đạt. Hỏi người dùng phiên bản iOS hiện tại của iPhone 11, và ghi đúng phiên bản vào bảng.

Khi người dùng gửi kết quả, ghi vào bảng trong `docs/device-checklist.md`, rồi:

```bash
git add docs/device-checklist.md && git commit -m "docs: device checklist results for feed reminders" && git push
```

---

## Ngoài phạm vi M11

- **Đợt 2:**
  - Luật `wake` (`W(ageDays)`) và `vaccine` (08:00–08:59 giờ VN, `D3`/`D1`) trong `selectDueNotifications`.
  - Phần "nhắc tiêm vẫn đến khi tạm tắt" của checklist bước 7.
- **M12:** outbox ghi offline §9 (Dexie `version(2)`, bộ xả, phân loại lỗi, ⏳, chip "N mục chờ đồng bộ"). Khi offline, tắt các nút cần mạng kèm "Cần kết nối mạng". Checklist bước 4.
