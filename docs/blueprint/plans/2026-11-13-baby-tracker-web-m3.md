# Baby Tracker Web — M3 (Trang chủ ghi chép) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-13-baby-tracker-web-design.md` (overview: `docs/blueprint/specs/2026-11-13-baby-tracker-overview.md`)

**Status:** approved 2026-11-13

**Goal:** Làm trang chủ để cả nhà bấm đồng hồ bú/ngủ, ghi bình/tã/thuốc/nhiệt độ và xem nhật ký 24 giờ.

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

**Consumes** (đã có trong repo):

- Từ M1 (`2026-11-13-baby-tracker-web-m1.md`): `supabase()`; `LogRow`, `Baby`, `FamilyMember` (`lib/supabase/rows.ts`); `Json` (`lib/supabase/types.ts`); `<AuthGate need="baby">`; `useMembers(familyId)`; RPC `stop_timer(p_log_id, p_ended_at)`; unique index `logs_one_running_timer` (lỗi `23505`)
- Từ M2 (`2026-11-13-baby-tracker-web-m2.md`): `planTimerPress`, `TimerButton`, `RunningLog`; `detailsSchemas`, `LogType`; `describeLog`; `formatAgeVi`, `formatVnTime`, `toVnLocalInput`, `fromVnLocalInput`

**Produces** (M4, M5 dùng):

- `lib/rules/quickEntry.ts`: `InstantType`, `QuickValues`, `QuickField`, `QUICK_FIELDS`, `defaultQuickValues`, `buildDetails`
- `lib/data/errors.ts`: `PermissionDeniedError`, `toVietnameseError`
- `lib/data/logs.ts`: `logsKey`, `fetchRecentLogs`, `useRecentLogs`, `insertLog`, `stopTimer`, `toRunning`, `useTimerPress`, `useStopTimer`, `useAddInstant`
- `lib/hooks/useNow.ts`: `useNow`
- `components/home/*` và trang chủ `/`

## File Structure

```
lib/rules/quickEntry.ts (+ test), lib/data/errors.ts (+ test), lib/data/logs.ts, lib/hooks/useNow.ts
components/home/HomeScreen.tsx, ActionGrid.tsx, RunningCard.tsx, RecentList.tsx, QuickEntrySheet.tsx
app/page.tsx (thay trang tạm của M1)
```

## Tasks

1. Trang chủ: đồng hồ, nhập nhanh, nhật ký 24 giờ

---

### Task 1: Trang chủ — đồng hồ, nhập nhanh, nhật ký 24 giờ

**Files:**

- Create: `lib/rules/quickEntry.ts`, `lib/data/errors.ts`, `lib/data/logs.ts`, `lib/hooks/useNow.ts`
- Create: `components/home/HomeScreen.tsx`, `components/home/ActionGrid.tsx`, `components/home/RunningCard.tsx`, `components/home/RecentList.tsx`, `components/home/QuickEntrySheet.tsx`
- Modify: `app/page.tsx` (thay toàn bộ)
- Test: `lib/rules/quickEntry.test.ts`, `lib/data/errors.test.ts`

**Interfaces:**

- Consumes: `planTimerPress`, `TimerButton`, `RunningLog` (M2 Task 1); `detailsSchemas`, `LogType` (M2 Task 1); `describeLog`, `formatAgeVi`, `formatVnTime`, `toVnLocalInput`, `fromVnLocalInput` (M2 Task 1); `supabase()`, `AuthGate`, `useMembers` (M1 Task 4); `LogRow`, `Baby`, `FamilyMember`, `Json` (M1 Task 3); RPC `stop_timer` (M1 Task 3)
- Produces:
  - `type InstantType = 'bottle' | 'diaper' | 'medicine' | 'temperature'`
  - `type QuickValues = Record<string, string | boolean>`
  - `type QuickField = { key: string; label: string; kind: 'number' | 'text' | 'select' | 'checkbox'; options?: { value: string; label: string }[]; showIf?: (v: QuickValues) => boolean }`
  - `QUICK_FIELDS: Record<InstantType, QuickField[]>`, `defaultQuickValues(type: InstantType): QuickValues`
  - `buildDetails(type: InstantType, values: QuickValues): { ok: true; details: Record<string, unknown> } | { ok: false; message: string }`
  - `class PermissionDeniedError extends Error`, `toVietnameseError(e: unknown): string`
  - `logsKey(babyId: string): readonly ['logs', string]`
  - `fetchRecentLogs(babyId: string, now?: Date): Promise<LogRow[]>`, `useRecentLogs(babyId: string)`
  - `insertLog(row: { id: string; baby_id: string; type: LogType; started_at: string; ended_at: string | null; details: Record<string, unknown> }): Promise<void>`
  - `stopTimer(id: string, endedAt: string): Promise<void>`
  - `toRunning(rows: LogRow[]): RunningLog[]`
  - `useTimerPress(babyId)`, `useStopTimer(babyId)`, `useAddInstant(babyId)`
  - `useNow(intervalMs: number): Date`

- [ ] **Step 1: Viết test thất bại**

Tạo `lib/rules/quickEntry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildDetails,
  defaultQuickValues,
  QUICK_FIELDS,
} from "@/lib/rules/quickEntry";

describe("buildDetails", () => {
  it("builds bottle details, accepting comma decimals in numbers", () => {
    expect(buildDetails("bottle", { ml: "90", milk: "formula" })).toEqual({
      ok: true,
      details: { ml: 90, milk: "formula" },
    });
    expect(buildDetails("bottle", { ml: "", milk: "formula" })).toEqual({
      ok: false,
      message: "Nhập số ml từ 1 đến 400",
    });
  });
  it("only keeps the stool colour for a dirty diaper", () => {
    expect(
      buildDetails("diaper", { wet: true, dirty: false, stoolColor: "yellow" }),
    ).toEqual({
      ok: true,
      details: { wet: true, dirty: false },
    });
    expect(
      buildDetails("diaper", { wet: false, dirty: true, stoolColor: "pale" }),
    ).toEqual({
      ok: true,
      details: { wet: false, dirty: true, stoolColor: "pale" },
    });
    expect(
      buildDetails("diaper", { wet: false, dirty: false, stoolColor: "" }),
    ).toEqual({
      ok: false,
      message: "Chọn ít nhất ướt hoặc bẩn",
    });
  });
  it("builds medicine and temperature details", () => {
    expect(
      buildDetails("medicine", {
        name: " Paracetamol ",
        amount: "2,5",
        unit: "ml",
        antipyretic: true,
      }),
    ).toEqual({
      ok: true,
      details: {
        name: "Paracetamol",
        amount: 2.5,
        unit: "ml",
        antipyretic: true,
      },
    });
    expect(
      buildDetails("temperature", { celsius: "38,2", method: "nach" }),
    ).toEqual({
      ok: true,
      details: { celsius: 38.2, method: "nach" },
    });
    expect(
      buildDetails("temperature", { celsius: "45", method: "nach" }),
    ).toEqual({
      ok: false,
      message: "Nhập nhiệt độ từ 34 đến 43°C",
    });
  });
  it("provides a default for every declared field", () => {
    for (const type of [
      "bottle",
      "diaper",
      "medicine",
      "temperature",
    ] as const) {
      const defaults = defaultQuickValues(type);
      for (const field of QUICK_FIELDS[type])
        expect(defaults).toHaveProperty(field.key);
    }
  });
});
```

Tạo `lib/data/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PermissionDeniedError, toVietnameseError } from "@/lib/data/errors";

describe("toVietnameseError", () => {
  it("maps a duplicate running timer", () => {
    expect(toVietnameseError({ code: "23505", message: "duplicate key" })).toBe(
      "Đã có người bắt đầu trước.",
    );
  });
  it("maps permission errors", () => {
    expect(
      toVietnameseError({ code: "42501", message: "permission_denied" }),
    ).toBe("Bạn không có quyền thực hiện thao tác này");
    expect(toVietnameseError(new PermissionDeniedError())).toBe(
      "Bạn không có quyền thực hiện thao tác này",
    );
  });
  it("maps network failures", () => {
    expect(toVietnameseError(new TypeError("Failed to fetch"))).toBe(
      "Mất kết nối mạng, thử lại sau.",
    );
    expect(
      toVietnameseError({ code: "", message: "TypeError: Load failed" }),
    ).toBe("Mất kết nối mạng, thử lại sau.");
  });
  it("falls back to a generic message", () => {
    expect(toVietnameseError(new Error("boom"))).toBe("Có lỗi xảy ra: boom");
    expect(toVietnameseError("weird")).toBe("Có lỗi xảy ra.");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `bun run test lib/rules/quickEntry.test.ts lib/data/errors.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/rules/quickEntry"` và `Failed to resolve import "@/lib/data/errors"`.

- [ ] **Step 3: Viết code thuần**

Tạo `lib/rules/quickEntry.ts`:

```ts
import { detailsSchemas } from "./logDetails";

export type InstantType = "bottle" | "diaper" | "medicine" | "temperature";
export type QuickValues = Record<string, string | boolean>;
export type QuickField = {
  key: string;
  label: string;
  kind: "number" | "text" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  showIf?: (values: QuickValues) => boolean;
};

export const QUICK_FIELDS: Record<InstantType, QuickField[]> = {
  bottle: [
    { key: "ml", label: "Số ml", kind: "number" },
    {
      key: "milk",
      label: "Loại sữa",
      kind: "select",
      options: [
        { value: "breast_milk", label: "Sữa mẹ" },
        { value: "formula", label: "Sữa công thức" },
      ],
    },
  ],
  diaper: [
    { key: "wet", label: "Ướt", kind: "checkbox" },
    { key: "dirty", label: "Bẩn", kind: "checkbox" },
    {
      key: "stoolColor",
      label: "Màu phân",
      kind: "select",
      showIf: (v) => v.dirty === true,
      options: [
        { value: "", label: "Không ghi" },
        { value: "yellow", label: "Vàng" },
        { value: "green", label: "Xanh" },
        { value: "brown", label: "Nâu" },
        { value: "black", label: "Đen" },
        { value: "pale", label: "Bạc màu / trắng" },
        { value: "red", label: "Có máu / đỏ" },
      ],
    },
  ],
  medicine: [
    { key: "name", label: "Tên thuốc", kind: "text" },
    { key: "amount", label: "Lượng", kind: "number" },
    {
      key: "unit",
      label: "Đơn vị",
      kind: "select",
      options: ["ml", "mg", "giọt", "viên"].map((u) => ({
        value: u,
        label: u,
      })),
    },
    { key: "antipyretic", label: "Thuốc hạ sốt", kind: "checkbox" },
  ],
  temperature: [
    { key: "celsius", label: "Nhiệt độ (°C)", kind: "number" },
    {
      key: "method",
      label: "Đo ở",
      kind: "select",
      options: [
        { value: "nach", label: "Nách" },
        { value: "tran", label: "Trán" },
        { value: "tai", label: "Tai" },
        { value: "hau_mon", label: "Hậu môn" },
      ],
    },
  ],
};

const DEFAULTS: Record<InstantType, QuickValues> = {
  bottle: { ml: "", milk: "breast_milk" },
  diaper: { wet: true, dirty: false, stoolColor: "" },
  medicine: { name: "", amount: "", unit: "ml", antipyretic: false },
  temperature: { celsius: "", method: "nach" },
};

const MESSAGES: Record<InstantType, string> = {
  bottle: "Nhập số ml từ 1 đến 400",
  diaper: "Chọn ít nhất ướt hoặc bẩn",
  medicine: "Nhập tên thuốc và lượng dùng",
  temperature: "Nhập nhiệt độ từ 34 đến 43°C",
};

export function defaultQuickValues(type: InstantType): QuickValues {
  return { ...DEFAULTS[type] };
}

function toNumber(value: string | boolean | undefined): number {
  if (typeof value !== "string" || value.trim() === "") return Number.NaN;
  return Number(value.trim().replace(",", "."));
}

function rawDetails(
  type: InstantType,
  v: QuickValues,
): Record<string, unknown> {
  switch (type) {
    case "bottle":
      return { ml: toNumber(v.ml), milk: v.milk };
    case "diaper":
      return {
        wet: v.wet === true,
        dirty: v.dirty === true,
        ...(v.dirty === true &&
        typeof v.stoolColor === "string" &&
        v.stoolColor !== ""
          ? { stoolColor: v.stoolColor }
          : {}),
      };
    case "medicine":
      return {
        name: typeof v.name === "string" ? v.name.trim() : "",
        amount: toNumber(v.amount),
        unit: v.unit,
        antipyretic: v.antipyretic === true,
      };
    case "temperature":
      return { celsius: toNumber(v.celsius), method: v.method };
  }
}

export function buildDetails(
  type: InstantType,
  values: QuickValues,
):
  | { ok: true; details: Record<string, unknown> }
  | { ok: false; message: string } {
  const result = detailsSchemas[type].safeParse(rawDetails(type, values));
  return result.success
    ? { ok: true, details: result.data as Record<string, unknown> }
    : { ok: false, message: MESSAGES[type] };
}
```

Tạo `lib/data/errors.ts`:

```ts
export class PermissionDeniedError extends Error {
  constructor() {
    super("permission_denied");
    this.name = "PermissionDeniedError";
  }
}

const PERMISSION = "Bạn không có quyền thực hiện thao tác này";

export function toVietnameseError(e: unknown): string {
  if (e instanceof PermissionDeniedError) return PERMISSION;
  const message =
    typeof e === "object" && e !== null && "message" in e
      ? String((e as { message: unknown }).message)
      : "";
  // supabase-js reports fetch failures as an error object, not a thrown TypeError.
  if (/failed to fetch|network|load failed/i.test(message))
    return "Mất kết nối mạng, thử lại sau.";
  if (typeof e === "object" && e !== null && "code" in e) {
    const code = (e as { code?: unknown }).code;
    if (code === "23505") return "Đã có người bắt đầu trước.";
    if (code === "42501") return PERMISSION;
  }
  if (e instanceof Error) return `Có lỗi xảy ra: ${e.message}`;
  if (typeof e === "object" && e !== null && "message" in e)
    return `Có lỗi xảy ra: ${String((e as { message: unknown }).message)}`;
  return "Có lỗi xảy ra.";
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `bun run test lib/rules/quickEntry.test.ts lib/data/errors.test.ts`
Expected: PASS — quickEntry 4, errors 4.

- [ ] **Step 5: Data layer và hook**

Tạo `lib/data/logs.ts`:

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LogType } from "@/lib/rules/logDetails";
import {
  planTimerPress,
  type RunningLog,
  type TimerButton,
} from "@/lib/rules/timer";
import { supabase } from "@/lib/supabase/client";
import type { LogRow } from "@/lib/supabase/rows";
import type { Json } from "@/lib/supabase/types";

export const logsKey = (babyId: string) => ["logs", babyId] as const;

export async function fetchRecentLogs(
  babyId: string,
  now: Date = new Date(),
): Promise<LogRow[]> {
  const since = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const { data, error } = await supabase()
    .from("logs")
    .select("*")
    .eq("baby_id", babyId)
    .or(`started_at.gte.${since},ended_at.is.null`)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function useRecentLogs(babyId: string) {
  return useQuery({
    queryKey: logsKey(babyId),
    queryFn: () => fetchRecentLogs(babyId),
    refetchInterval: 30_000,
  });
}

export async function insertLog(row: {
  id: string;
  baby_id: string;
  type: LogType;
  started_at: string;
  ended_at: string | null;
  details: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase()
    .from("logs")
    .insert({ ...row, details: row.details as Json });
  if (error) throw error;
}

export async function stopTimer(id: string, endedAt: string): Promise<void> {
  const { error } = await supabase().rpc("stop_timer", {
    p_log_id: id,
    p_ended_at: endedAt,
  });
  if (error) throw error;
}

export function toRunning(rows: LogRow[]): RunningLog[] {
  return rows
    .filter((row) => row.ended_at === null)
    .map((row) => ({
      id: row.id,
      type: row.type as LogType,
      details: (row.details ?? {}) as Record<string, unknown>,
    }));
}

export function useTimerPress(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      running,
      button,
    }: {
      running: RunningLog[];
      button: TimerButton;
    }) => {
      const now = new Date().toISOString();
      for (const action of planTimerPress(running, button)) {
        if (action.kind === "stop") await stopTimer(action.id, now);
        else
          await insertLog({
            id: crypto.randomUUID(),
            baby_id: babyId,
            type: action.type,
            started_at: now,
            ended_at: null,
            details: action.details,
          });
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: logsKey(babyId) }),
  });
}

export function useStopTimer(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stopTimer(id, new Date().toISOString()),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: logsKey(babyId) }),
  });
}

export function useAddInstant(babyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      details,
      at,
    }: {
      type: LogType;
      details: Record<string, unknown>;
      at: Date;
    }) => {
      const iso = at.toISOString();
      return insertLog({
        id: crypto.randomUUID(),
        baby_id: babyId,
        type,
        started_at: iso,
        ended_at: iso,
        details,
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: logsKey(babyId) }),
  });
}
```

Tạo `lib/hooks/useNow.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
```

Run: `bun run typecheck`
Expected: không lỗi.

- [ ] **Step 6: Các component trang chủ**

Tạo `components/home/ActionGrid.tsx`:

```tsx
"use client";

import type { InstantType } from "@/lib/rules/quickEntry";
import type { RunningLog, TimerButton } from "@/lib/rules/timer";

const TIMERS: { label: string; button: TimerButton }[] = [
  { label: "Bú trái", button: { type: "breast", side: "left" } },
  { label: "Bú phải", button: { type: "breast", side: "right" } },
  { label: "Ngủ", button: { type: "sleep" } },
];

const INSTANTS: { label: string; type: InstantType }[] = [
  { label: "Bình", type: "bottle" },
  { label: "Tã", type: "diaper" },
  { label: "Thuốc", type: "medicine" },
  { label: "Nhiệt độ", type: "temperature" },
];

function isActive(running: RunningLog[], button: TimerButton): boolean {
  return running.some(
    (r) =>
      r.type === button.type &&
      (button.type !== "breast" || r.details.side === button.side),
  );
}

export function ActionGrid({
  running,
  busy,
  onTimer,
  onInstant,
}: {
  running: RunningLog[];
  busy: boolean;
  onTimer: (button: TimerButton) => void;
  onInstant: (type: InstantType) => void;
}) {
  const base = "min-h-16 rounded-2xl text-lg font-medium disabled:opacity-50";
  return (
    <section className="grid grid-cols-3 gap-3">
      {TIMERS.map(({ label, button }) => {
        const active = isActive(running, button);
        return (
          <button
            key={label}
            type="button"
            disabled={busy}
            onClick={() => onTimer(button)}
            className={`${base} ${active ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-900"}`}
          >
            {active ? `Dừng ${label.toLowerCase()}` : label}
          </button>
        );
      })}
      {INSTANTS.map(({ label, type }) => (
        <button
          key={type}
          type="button"
          onClick={() => onInstant(type)}
          className={`${base} bg-neutral-100`}
        >
          {label}
        </button>
      ))}
    </section>
  );
}
```

Tạo `components/home/RunningCard.tsx`:

```tsx
"use client";

import { describeLog } from "@/lib/rules/describeLog";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";

export function RunningCard({
  log,
  who,
  now,
  busy,
  onStop,
}: {
  log: LogRow;
  who: string;
  now: Date;
  busy: boolean;
  onStop: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-pink-200 p-4">
      <div>
        <p className="font-medium">{describeLog(log, now)}</p>
        <p className="text-sm text-neutral-500">
          {who} bắt đầu lúc {formatVnTime(new Date(log.started_at))}
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onStop}
        className="min-h-11 rounded-xl bg-pink-500 px-4 text-white disabled:opacity-50"
      >
        Dừng
      </button>
    </div>
  );
}
```

Tạo `components/home/RecentList.tsx`:

```tsx
"use client";

import { describeLog } from "@/lib/rules/describeLog";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";

export function RecentList({
  logs,
  now,
  nameOf,
}: {
  logs: LogRow[];
  now: Date;
  nameOf: (userId: string) => string;
}) {
  if (logs.length === 0)
    return (
      <p className="text-neutral-500">Chưa có ghi chép nào trong 24 giờ qua.</p>
    );
  return (
    <ul className="divide-y rounded-2xl border">
      {logs.map((log) => (
        <li key={log.id} className="flex gap-3 p-3">
          <span className="w-12 shrink-0 tabular-nums text-neutral-500">
            {formatVnTime(new Date(log.started_at))}
          </span>
          <span className="flex-1">{describeLog(log, now)}</span>
          <span className="text-sm text-neutral-500">
            {nameOf(log.created_by)}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

Tạo `components/home/QuickEntrySheet.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useAddInstant } from "@/lib/data/logs";
import { toVietnameseError } from "@/lib/data/errors";
import {
  buildDetails,
  defaultQuickValues,
  QUICK_FIELDS,
  type InstantType,
  type QuickValues,
} from "@/lib/rules/quickEntry";
import { fromVnLocalInput, toVnLocalInput } from "@/lib/rules/time";

const TITLES: Record<InstantType, string> = {
  bottle: "Bú bình",
  diaper: "Thay tã",
  medicine: "Cho uống thuốc",
  temperature: "Đo nhiệt độ",
};

export function QuickEntrySheet({
  type,
  babyId,
  onClose,
}: {
  type: InstantType;
  babyId: string;
  onClose: () => void;
}) {
  const add = useAddInstant(babyId);
  const [values, setValues] = useState<QuickValues>(() =>
    defaultQuickValues(type),
  );
  const [at, setAt] = useState(() => toVnLocalInput(new Date()));
  const [message, setMessage] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const built = buildDetails(type, values);
    if (!built.ok) {
      setMessage(built.message);
      return;
    }
    add.mutate(
      { type, details: built.details, at: fromVnLocalInput(at) },
      { onSuccess: onClose, onError: (e) => setMessage(toVietnameseError(e)) },
    );
  }

  const input = "min-h-11 rounded-xl border px-3";
  return (
    <div
      className="fixed inset-0 z-10 flex items-end bg-black/40"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-3 rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-xl font-semibold">{TITLES[type]}</h2>
        {QUICK_FIELDS[type]
          .filter((field) => !field.showIf || field.showIf(values))
          .map((field) => {
            const value = values[field.key];
            const set = (next: string | boolean) =>
              setValues((prev) => ({ ...prev, [field.key]: next }));
            if (field.kind === "checkbox") {
              return (
                <label
                  key={field.key}
                  className="flex min-h-11 items-center gap-3"
                >
                  <input
                    type="checkbox"
                    className="size-5"
                    checked={value === true}
                    onChange={(e) => set(e.target.checked)}
                  />
                  {field.label}
                </label>
              );
            }
            if (field.kind === "select") {
              return (
                <label key={field.key} className="flex flex-col gap-1">
                  {field.label}
                  <select
                    className={input}
                    value={String(value)}
                    onChange={(e) => set(e.target.value)}
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            return (
              <label key={field.key} className="flex flex-col gap-1">
                {field.label}
                <input
                  className={input}
                  inputMode={field.kind === "number" ? "decimal" : "text"}
                  value={String(value)}
                  onChange={(e) => set(e.target.value)}
                />
              </label>
            );
          })}
        <label className="flex flex-col gap-1">
          Thời điểm
          <input
            type="datetime-local"
            className={input}
            value={at}
            onChange={(e) => setAt(e.target.value)}
          />
        </label>
        {message && (
          <p role="alert" className="text-red-600">
            {message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-2xl border"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={add.isPending}
            className="min-h-12 flex-1 rounded-2xl bg-pink-500 text-white disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
```

Tạo `components/home/HomeScreen.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useMembers } from "@/lib/data/family";
import { toVietnameseError } from "@/lib/data/errors";
import {
  toRunning,
  useRecentLogs,
  useStopTimer,
  useTimerPress,
} from "@/lib/data/logs";
import { useNow } from "@/lib/hooks/useNow";
import type { InstantType } from "@/lib/rules/quickEntry";
import { formatAgeVi } from "@/lib/rules/time";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { ActionGrid } from "./ActionGrid";
import { QuickEntrySheet } from "./QuickEntrySheet";
import { RecentList } from "./RecentList";
import { RunningCard } from "./RunningCard";

export function HomeScreen({
  baby,
  member,
}: {
  baby: Baby;
  member: FamilyMember;
}) {
  const now = useNow(1000);
  const logs = useRecentLogs(baby.id);
  const members = useMembers(baby.family_id);
  const press = useTimerPress(baby.id);
  const stop = useStopTimer(baby.id);
  const [sheet, setSheet] = useState<InstantType | null>(null);

  const rows = logs.data ?? [];
  const runningRows = rows.filter((row) => row.ended_at === null);
  const finishedRows = rows.filter((row) => row.ended_at !== null);
  const running = toRunning(rows);
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";
  const error = press.error ?? stop.error;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <header>
        <h1 className="text-2xl font-semibold">{baby.name}</h1>
        <p className="text-neutral-500">
          {formatAgeVi(baby.dob, now)} · Xin chào {member.display_name}
        </p>
      </header>

      <ActionGrid
        running={running}
        busy={press.isPending}
        onTimer={(button) => press.mutate({ running, button })}
        onInstant={setSheet}
      />

      {error && (
        <p role="alert" className="text-red-600">
          {toVietnameseError(error)}
        </p>
      )}

      {runningRows.map((log) => (
        <RunningCard
          key={log.id}
          log={log}
          who={nameOf(log.created_by)}
          now={now}
          busy={stop.isPending}
          onStop={() => stop.mutate(log.id)}
        />
      ))}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">24 giờ qua</h2>
        {logs.isError ? (
          <p className="text-red-600">{toVietnameseError(logs.error)}</p>
        ) : (
          <RecentList logs={finishedRows} now={now} nameOf={nameOf} />
        )}
      </section>

      {sheet && (
        <QuickEntrySheet
          type={sheet}
          babyId={baby.id}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
```

Thay toàn bộ `app/page.tsx`:

```tsx
"use client";

import { AuthGate } from "@/components/AuthGate";
import { HomeScreen } from "@/components/home/HomeScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? <HomeScreen baby={ctx.baby} member={ctx.member} /> : null
      }
    </AuthGate>
  );
}
```

Run: `bun run typecheck && bun run test && bun run build`
Expected: không lỗi type; mọi test Vitest đạt; `next build` thành công, liệt kê route `/`, `/dang-nhap`, `/auth/callback`, `/chua-duoc-moi`, `/khai-bao-be`.

- [ ] **Step 7: Kiểm tra tay trên localhost**

Run: `bun run dev`, đăng nhập owner, mở `http://localhost:3000/`.
Expected:

1. Header hiện tên bé và tuổi (ví dụ "2 tháng"), "Xin chào <tên>".
2. Bấm "Bú trái" → nút thành "Dừng bú trái", thẻ đang chạy hiện "Bú trái · dưới 1 phút (đang chạy)", số phút tăng theo thời gian.
3. Bấm "Bú phải" → thẻ đổi thành "Bú phải"; danh sách 24 giờ có dòng "Bú trái · …".
4. Bấm "Ngủ" trong lúc đang bú → hai thẻ đang chạy cùng lúc.
5. Bấm "Tã", chọn Bẩn + màu Vàng, Lưu → danh sách có "Tã ướt + bẩn (phân vàng)".
6. Bấm "Nhiệt độ", nhập 45, Lưu → hiện "Nhập nhiệt độ từ 34 đến 43°C", sheet không đóng.
7. Mở thêm một trình duyệt (cửa sổ ẩn danh) đăng nhập cùng tài khoản: trong ≤ 30 giây thấy đồng hồ đang chạy (Realtime để M4).

- [ ] **Step 8: Commit và deploy**

```bash
git add -A && git commit -m "feat(home): timers, quick entry sheet and 24-hour log list"
```

Run: `git push`
Expected: Vercel deploy Ready. Trên iPhone đã cài PWA: lặp lại bước 2–5 của Step 7 và đạt.

---

## Ngoài phạm vi M3 (để M4/M5)

- M4: quy tắc §7.1–7.2 (gom cữ bú, đánh giá 24 giờ), cảnh báo §7.4, Vitamin D, `/nhat-ky` (sửa/xóa), `/thong-ke`, Realtime §5.3, `/cai-dat` (thành viên, hồ sơ bé, theme Ban đêm), `/cai-app`, thanh tab dưới, dòng "Cữ bú tiếp theo khoảng HH:mm" và "Bé đã thức X phút" (§6.2), trang lỗi "Máy chủ đang ngủ" khi Supabase tạm dừng (§10.1).
- M5: service worker §8.4, offline outbox §9, push `feed` §8, pg_cron + Vault, tạm tắt thông báo, checklist thiết bị bước 1–4 và 7.
