# Kim Bun UI — Đợt 5 / M4 (Nhạc, Ồn trắng, Ảnh, Báo cáo) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-15

**Goal:** Làm lại 4 màn Nhạc, Ồn trắng, Ảnh, Báo cáo theo spec §9 và §10.

- `PageHeader` có nút "‹ Khám phá"; nội dung nằm trong thẻ kính.
- `Segmented` thay các nhóm nút chọn cũ.
- Nút phát/dừng là `IconButton` 64 (`play` / `stop` `filled`).
- `Icon` thay ký tự "▶".
- Xem ảnh mở trong `Sheet`.
- `Skeleton` / `ErrorCard` / `EmptyState` thay "Đang tải…" và câu lỗi trơn.
- Báo cáo in ra vẫn đen trắng trên A4 (spec §2.2).

**Architecture:**

- `IconButton` có thêm prop `large` (tròn 64, icon 28) để làm nút phát/dừng (spec §9).
- Các màn giữ nguyên dữ liệu, luật và hành vi:
  - `musicItems`, `parseYouTubeUrl`, `parseLinkTitle`, `useYouTubeOpener`;
  - âm thanh Web Audio của Ồn trắng (`seamlessNoise`, `scheduleVolume`, hẹn giờ trên đồng hồ âm thanh);
  - `usage`, `groupByAgeMonth`, `parsePhotoForm`, `exifDate`;
  - `dailyStats`, `temperatureRows`, `medicineRows`, `growthSummary`, `vaccineSummary`, điều kiện `ready` của Báo cáo.
- Mỗi màn có test SSR bằng `renderToStaticMarkup`, bọc `QueryClientProvider` khi có hook dữ liệu.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, TanStack Query 5, Vitest 5 (`react-dom/server`, môi trường `node`), Bun. Không thêm gói nào.

**Các mốc của Đợt 5:**

| Mốc               | Nội dung                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1–M3             | Nhật ký, Thống kê, Tăng trưởng, Tiêm chủng, Phát triển, Khẩn cấp, Triệu chứng, Bệnh thường gặp, Bồng bế — đã xong trên nhánh `feat/kim-bun-dot5-m3`                         |
| **M4 (plan này)** | Nhạc, Ồn trắng, Ảnh, Báo cáo                                                                                                                                                |
| M5                | Đăng nhập, Khai báo bé, Chưa được mời, Cài app, Offline, `AuthGate`; bên trong 3 trang con Cài đặt                                                                          |
| M6                | Trang chủ đang tải / lỗi, dòng đồng bộ dưới header, nhãn bị xuống dòng ("Hậu môn", "Đổi ngày hẹn", "Phân loại triệu chứng"), xóa token cũ, checklist cuối (§11.2 bước 7, 8) |

**Quyết định cho chỗ spec chưa nói rõ:**

- **Nhạc:**
  - Mỗi mục là một hàng trong `ListGroup`. Bên trái là chip tròn icon `play` màu `cat-sleep` (bấm thì mở YouTube như cũ), rồi tên bài, rồi link "Mở trên web".
  - Hàng dưới có "Ẩn" / "Hiện lại" và "Xóa" kiểu `ghost` cỡ `md`; "Xóa" chữ đỏ, vẫn hỏi lại.
  - Chọn "Thư giãn / ru ngủ" / "Phát triển trí não" và "Mở YouTube bằng" đều là `Segmented`.
  - Form thêm link nằm trong thẻ kính.
- **Ồn trắng:**
  - "Loại âm" (3 lựa chọn) và "Hẹn giờ tắt" (Không / 15 / 30 / 60 phút) là `Segmented`.
  - Thanh âm lượng nằm trong thẻ kính.
  - Nút phát/dừng là `IconButton` `large` nền `accent`, ở giữa, nhãn "Phát" / "Dừng". Dòng trạng thái đặt dưới nút.
  - Bấm lại lựa chọn đang chọn khi đang phát thì phát lại từ đầu, như hành vi cũ (nút cũ cũng gọi `start` mỗi lần bấm).
- **Ảnh:**
  - Thanh dung lượng có nền `--color-line`.
  - Form tải ảnh nằm trong thẻ kính.
  - Đang tải: lưới 6 `Skeleton` vuông; mất mạng khi chưa có bộ nhớ đệm (truy vấn bị dừng): câu "Cần mạng để tải ảnh.". Trống: `EmptyState` icon `image` "Chưa có ảnh nào.", không có nút vì thẻ tải ảnh nằm ngay phía trên. Lỗi: `ErrorCard`.
  - Xem ảnh: `Sheet`, tiêu đề là ngày chụp dd/mm/yyyy. "Xóa ảnh" kiểu `ghost` chữ đỏ, vẫn hỏi lại. Nút "Đóng" cũ bỏ vì `Sheet` có nút đóng.
- **Báo cáo:**
  - Trên màn hình, phần chọn 7/14 ngày (`Segmented`) và nút "In / Lưu PDF" (`Button` có icon `doc`) nằm trong khối `print:hidden`.
  - Nội dung báo cáo nằm trong thẻ kính. Khi in, thẻ bỏ viền và đệm (`print:border-0 print:p-0`); nền trắng, bỏ blur đã có sẵn trong `@media print` của `app/globals.css`.
  - Ô bảng có viền `--color-line` trên màn hình và viền đen khi in (`print:border-ink`; `--color-ink` là `#000000` khi in).
  - Đang tải: 3 `Skeleton`. Lỗi từng phần: `ErrorCard` "Nhật ký: …" có nút "Thử lại".

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- Không dùng emoji làm icon ở bất kỳ đâu trong UI.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh (không hex 6 chữ số, không class bảng màu Tailwind trong mọi `.tsx` dưới `app/` và `components/`, kể cả file test).
- Spec §2.2: báo cáo `/bao-cao` khi in vẫn đen trắng trên A4; trong `@media print` ẩn `Backdrop`, tab bar, nút "+"; kính thành nền trắng, bỏ blur và bóng.
- Không đổi dữ liệu, luật, quyền (xóa link/ảnh: chủ gia đình hoặc người tạo), các câu xác nhận xóa, `OnlineOnly`, và chữ người dùng thấy, trừ chỗ plan ghi rõ (bỏ "▶").
- Vùng chạm tối thiểu 44×44 pt; tôn trọng `safe-area-inset-*`.
- Không đổi `localStorage` key, tên package `be-yeu`, tên cache service worker `be-yeu-…`.
- **Dev dùng chung Supabase thật của gia đình:**
  - Khi kiểm tay **không thêm link, không ẩn/xóa mục nhạc, không tải ảnh, không xóa ảnh**.
  - Được: bấm phát/dừng Ồn trắng (chỉ phát âm trên máy), đổi tab Nhạc, đổi "Mở YouTube bằng" (lưu trên máy), mở xem ảnh rồi đóng, đổi 7/14 ngày ở Báo cáo.
  - Không bấm mở YouTube.
- Trước khi dùng API của Next/React mới, đọc docs tương ứng (`node_modules/next/dist/docs/`, AGENTS.md).

## Contracts with Other Plans

**Consumes** (đã có trên nhánh `feat/kim-bun-dot5-m3`):

- `components/ui/`: `PageHeader`, `Button`, `IconButton`, `Glass`, `Icon`, `ListGroup`, `Segmented`, `Sheet`, `Skeleton`, `EmptyState`, `ErrorCard`.
- `components/quick/styles.ts`: `FIELD_LABEL`, `FIELD_INPUT`. `components/OnlineOnly.tsx`.
- Dữ liệu và luật có sẵn của 4 màn (xem import trong từng file hiện có).

**Produces:**

- `components/ui/IconButton.tsx`: prop mới `large?: boolean` (tròn 64, icon 28).
- `MusicScreen`, `YouTubeModePicker`, `NoiseScreen`, `PhotosScreen`, `ReportScreen`: cùng chữ ký, giao diện mới.
- `components/photos/PhotosScreen.tsx`: export thêm `PhotoViewer` để test.

---

### Task 1: Màn Nhạc

**Files:**

- Modify: `components/music/MusicScreen.tsx`, `components/music/YouTubeModePicker.tsx` (viết lại cả hai)
- Create: `components/music/music.test.tsx`

**Interfaces:**

- Consumes: `PageHeader`, `Segmented`, `ListGroup`, `Button`, `Icon`, `ErrorCard`; `FIELD_LABEL`, `FIELD_INPUT`; `OnlineOnly`; `MUSIC_PRESETS`, `MusicCategory`; `useMusicActions`, `useMusicLinks`; `useOnline`; `useYouTubeOpener`; `BRAIN_NOTE`, `musicItems`, `parseLinkTitle`, `MusicItem`; `parseYouTubeUrl`, `webUrl`, `youtubePath`, `OpenMode`.
- Produces: `MusicScreen({ familyId, userId, isOwner })`, `YouTubeModePicker({ mode, onChange })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/music/music.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { findElements } from "@/components/ui/testTree";
import { ICON_PATHS } from "@/lib/ui/icons";
import { MusicScreen } from "./MusicScreen";
import { YouTubeModePicker } from "./YouTubeModePicker";

describe("MusicScreen", () => {
  it("a header back to Khám phá, two segmented pickers, a glass list with play icons and the add form", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <MusicScreen familyId="f1" userId="u1" isOwner />
      </QueryClientProvider>,
    );
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain(">Nhạc cho bé</h1>");
    expect(html).toContain('aria-label="Loại nhạc"');
    expect(html).toMatch(
      /aria-pressed="true"[^>]*>Thư giãn \/ ru ngủ<\/button>/,
    );
    expect(html).toContain('aria-label="Mở YouTube bằng"');
    expect(html).toContain(`d="${ICON_PATHS.play}"`);
    expect(html).not.toContain("▶");
    expect(html).toContain("Mở trên web");
    expect(html).toContain(">Thêm link YouTube</h2>");
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("rounded-2xl border");
  });
});

describe("YouTubeModePicker", () => {
  it("is a two-way segmented control", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <YouTubeModePicker mode="web" onChange={onChange} />,
    );
    expect(html).toMatch(/aria-pressed="true"[^>]*>Trình duyệt<\/button>/);
    const [segmented] = findElements(
      YouTubeModePicker({ mode: "web", onChange }),
      (el) => el.props.options !== undefined,
    );
    (segmented.props.onChange as (v: string) => void)("app");
    expect(onChange).toHaveBeenCalledWith("app");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/music/music.test.tsx`
Expected: FAIL — bản cũ không có `PageHeader`, dùng "▶" và `role="tablist"`; `YouTubeModePicker` cũ không phải `Segmented` (2 test hỏng).

- [ ] **Step 3: Viết lại `components/music/YouTubeModePicker.tsx`**

```tsx
"use client";

import { Segmented } from "@/components/ui/Segmented";
import type { OpenMode } from "@/lib/rules/youtube";

const OPTIONS: { value: OpenMode; label: string }[] = [
  { value: "app", label: "App YouTube" },
  { value: "web", label: "Trình duyệt" },
];

export function YouTubeModePicker({
  mode,
  onChange,
}: {
  mode: OpenMode;
  onChange: (mode: OpenMode) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <p className="px-1 text-[13px] font-semibold text-muted">
        Mở YouTube bằng
      </p>
      <Segmented
        label="Mở YouTube bằng"
        options={OPTIONS}
        value={mode}
        onChange={onChange}
      />
      <p className="px-1 text-[13px] text-muted">
        Chọn "Trình duyệt" nếu bấm vào mà iPhone báo địa chỉ không hợp lệ (ví dụ
        YouTube cài ngoài App Store). Lựa chọn lưu trên máy này.
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Viết lại `components/music/MusicScreen.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { ListGroup } from "@/components/ui/ListGroup";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { MUSIC_PRESETS, type MusicCategory } from "@/lib/content/music";
import { toVietnameseError } from "@/lib/data/errors";
import { useMusicActions, useMusicLinks } from "@/lib/data/music";
import { useOnline } from "@/lib/hooks/useOnline";
import { useYouTubeOpener } from "@/lib/hooks/useYouTubeOpener";
import {
  BRAIN_NOTE,
  musicItems,
  parseLinkTitle,
  type MusicItem,
} from "@/lib/rules/music";
import { parseYouTubeUrl, webUrl, youtubePath } from "@/lib/rules/youtube";
import { YouTubeModePicker } from "./YouTubeModePicker";

const TABS: { value: MusicCategory; label: string }[] = [
  { value: "relax", label: "Thư giãn / ru ngủ" },
  { value: "brain", label: "Phát triển trí não" },
];

export function MusicScreen({
  familyId,
  userId,
  isOwner,
}: {
  familyId: string;
  userId: string;
  isOwner: boolean;
}) {
  const links = useMusicLinks(familyId);
  const actions = useMusicActions(familyId);
  // Hiding and deleting need the network (spec gốc §9); the add form says so once.
  const online = useOnline();
  const youtube = useYouTubeOpener();
  const [tab, setTab] = useState<MusicCategory>("relax");
  const [showHidden, setShowHidden] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const items = musicItems({
    presets: MUSIC_PRESETS,
    links: links.data ?? [],
    category: tab,
  });
  const hiddenCount = items.filter((item) => item.hidden).length;
  const showing = showHidden && hiddenCount > 0;
  const visible = items.filter((item) => showing || !item.hidden);
  const onError = (e: unknown) => setMessage(toVietnameseError(e));

  function toggleHidden(item: MusicItem) {
    setMessage(null);
    if (item.kind === "preset")
      actions.setPresetHidden.mutate(
        {
          presetCode: item.preset.presetCode,
          category: item.preset.category,
          hidden: !item.hidden,
        },
        { onError },
      );
    else
      actions.setLinkHidden.mutate(
        { id: item.link.id, hidden: !item.hidden },
        { onError },
      );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Nhạc cho bé"
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <Segmented
        label="Loại nhạc"
        options={TABS}
        value={tab}
        onChange={setTab}
      />
      <YouTubeModePicker mode={youtube.mode} onChange={youtube.setMode} />
      {tab === "brain" && (
        <p className="rounded-[16px] bg-warn-soft p-3 text-[15px] text-warn-ink">
          {BRAIN_NOTE}
        </p>
      )}
      {!online && (
        <p role="status" className="px-1 text-[13px] text-muted">
          Cần kết nối mạng để ẩn, hiện lại hoặc xóa.
        </p>
      )}
      <ListGroup>
        {visible.map((item) => {
          const path = youtubePath(item.target);
          const canDelete =
            item.kind === "link" &&
            (isOwner || item.link.created_by === userId);
          return (
            <li
              key={item.key}
              className="flex flex-col gap-1 border-b border-line px-4 py-2 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => youtube.open(path)}
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cat-sleep/15 text-cat-sleep">
                    <Icon name="play" size={16} filled />
                  </span>
                  <span
                    className={`text-base font-medium ${item.hidden ? "text-muted" : "text-ink"}`}
                  >
                    {item.title}
                  </span>
                </button>
                <a
                  href={webUrl(path)}
                  target="_blank"
                  rel="noopener"
                  className="flex min-h-11 shrink-0 items-center text-[13px] font-semibold text-accent-text"
                >
                  Mở trên web
                </a>
              </div>
              <div className="flex gap-1 pl-12">
                <Button
                  variant="ghost"
                  size="md"
                  disabled={!online}
                  onClick={() => toggleHidden(item)}
                >
                  {item.hidden ? "Hiện lại" : "Ẩn"}
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="md"
                    disabled={!online}
                    className="text-danger!"
                    onClick={() => {
                      if (window.confirm(`Xóa "${item.title}"?`)) {
                        setMessage(null);
                        actions.remove.mutate(item.link.id, { onError });
                      }
                    }}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ListGroup>
      {hiddenCount > 0 && (
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowHidden(!showing)}
        >
          {showing ? "Ẩn các mục đã ẩn" : `Hiện các mục đã ẩn (${hiddenCount})`}
        </Button>
      )}
      {message && (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {message}
        </p>
      )}
      <AddLinkForm category={tab} familyId={familyId} />
      {links.isError && !links.data && (
        <ErrorCard
          message={toVietnameseError(links.error)}
          onRetry={() => void links.refetch()}
        />
      )}
    </main>
  );
}

function AddLinkForm({
  category,
  familyId,
}: {
  category: MusicCategory;
  familyId: string;
}) {
  const actions = useMusicActions(familyId);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const target = url.trim() === "" ? null : parseYouTubeUrl(url);
  // Spec gốc §6.11: an invalid link is reported right at the input.
  const urlError =
    url.trim() !== "" && !target ? "Link YouTube không hợp lệ." : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsedTitle = parseLinkTitle(title);
    if (!target) {
      setError("Dán link YouTube của bài hát hoặc danh sách phát.");
      return;
    }
    if (parsedTitle === "too_long") {
      setError("Tên tối đa 80 ký tự.");
      return;
    }
    setError(null);
    actions.add.mutate(
      { category, title: parsedTitle, target },
      {
        onSuccess: () => {
          setUrl("");
          setTitle("");
        },
        onError: (e) => setError(toVietnameseError(e)),
      },
    );
  }

  return (
    <OnlineOnly>
      {/* noValidate: links without https:// are accepted (spec gốc §6.11). */}
      <form
        noValidate
        onSubmit={submit}
        className="glass flex flex-col gap-3 rounded-[28px] p-4"
      >
        <h2 className="text-[17px] font-semibold text-ink">
          Thêm link YouTube
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Link</span>
          <input
            type="url"
            inputMode="url"
            className={FIELD_INPUT}
            placeholder="https://youtu.be/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {urlError && (
            <span className="text-[13px] text-danger">{urlError}</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Tên (không bắt buộc)</span>
          <input
            className={FIELD_INPUT}
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-[15px] text-danger">
            {error}
          </p>
        )}
        <Button type="submit" block busy={actions.add.isPending}>
          Thêm vào {category === "relax" ? "Thư giãn" : "Phát triển trí não"}
        </Button>
      </form>
    </OnlineOnly>
  );
}
```

Form dùng thẻ `<form>` có class `glass` thay vì `Glass as="form"`, vì `Glass` khai kiểu `HTMLAttributes` nên không nhận `noValidate`.

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/music lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (music 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/music
git commit -m "feat(music): glass music list with play icons and segmented pickers"
```

---

### Task 2: Nút tròn 64 và màn Ồn trắng

**Files:**

- Modify: `components/ui/IconButton.tsx` (thêm prop `large`), `components/noise/NoiseScreen.tsx` (viết lại toàn file)
- Create: `components/ui/iconbutton.test.tsx`, `components/noise/noise.test.tsx`

**Interfaces:**

- Consumes: `PageHeader`, `Segmented`, `Glass`, `IconButton`; các hằng và hàm trong `lib/rules/noise.ts`.
- Produces: `IconButton({ …, large?: boolean })`; `NoiseScreen()`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/ui/iconbutton.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { IconButton } from "./IconButton";

describe("IconButton large", () => {
  it("is a 64 px circle with a 28 px icon", () => {
    const html = renderToStaticMarkup(
      <IconButton label="Phát" icon="play" large filled variant="accent" />,
    );
    expect(html).toContain("size-16");
    expect(html).toContain('width="28"');
    expect(html).toContain(`d="${ICON_PATHS.play}"`);
    expect(html).toContain('aria-label="Phát"');
    expect(html).not.toContain("size-11");
  });
});
```

`components/noise/noise.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { NoiseScreen } from "./NoiseScreen";

describe("NoiseScreen", () => {
  it("segmented sound and timer pickers, a glass volume card and a 64 px play button", () => {
    const html = renderToStaticMarkup(<NoiseScreen />);
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain('aria-label="Loại âm"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>Trắng<\/button>/);
    expect(html).toContain('aria-label="Hẹn giờ tắt"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>30 phút<\/button>/);
    expect(html).toContain('type="range"');
    expect(html).toContain("accent-accent");
    expect(html).toContain('aria-label="Phát"');
    expect(html).toContain("size-16");
    expect(html).toContain(`d="${ICON_PATHS.play}"`);
    expect(html).not.toContain("bg-soft");
    expect(html).not.toContain("rounded-xl border");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/ui/iconbutton.test.tsx components/noise/noise.test.tsx`
Expected: FAIL — `IconButton` chưa có `large` (vẫn `size-11`); `NoiseScreen` cũ không có `Segmented`, dùng `bg-soft` (2 test hỏng).

- [ ] **Step 3: Thêm `large` vào `components/ui/IconButton.tsx`**

Trong hàm `IconButton`:

1. Thêm `large = false,` vào danh sách tham số, ngay sau `small = false,`.
2. Thêm `large?: boolean;` vào kiểu props, ngay sau `small?: boolean;`.
3. Thay dòng `small ? "size-9" : "size-11",` bằng:

```tsx
        large ? "size-16" : small ? "size-9" : "size-11",
```

4. Thay dòng `<Icon name={icon} size={small ? 16 : 20} filled={filled} />` bằng:

```tsx
<Icon name={icon} size={large ? 28 : small ? 16 : 20} filled={filled} />
```

- [ ] **Step 4: Viết lại `components/noise/NoiseScreen.tsx`**

Giữ nguyên phần trên của file (các import từ `lib/rules/noise`, `type Player`, `AudioSessionNavigator`, `FADE_S`, `scheduleVolume`) và toàn bộ phần logic trong `NoiseScreen` từ `const [color, setColor]` đến hết `useEffect(() => stop, []);`. Chỉ thay:

1. Thêm các import ngay dưới dòng `import { useEffect, useRef, useState } from "react";`:

```tsx
import { Glass } from "@/components/ui/Glass";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
```

2. Thêm hằng ngay trên `export function NoiseScreen() {`:

```tsx
const TIMER_CHOICES = TIMER_OPTIONS.map((option) => ({
  value: String(option),
  label: option === 0 ? "Không" : `${option} phút`,
}));
```

3. Xóa hằng `const pill = (active: boolean) => …;` và thay toàn bộ khối `return ( … );` cuối hàm `NoiseScreen` bằng:

```tsx
return (
  <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
    <PageHeader
      title="Tiếng ồn trắng"
      back={{ href: "/kham-pha", label: "Khám phá" }}
    />
    <Glass as="section" className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-muted">Loại âm</span>
        <Segmented
          label="Loại âm"
          options={NOISE_OPTIONS}
          value={color}
          onChange={(next) => {
            setColor(next);
            if (playing) start(next, minutes);
          }}
        />
        <p className="text-[13px] text-muted">
          {NOISE_OPTIONS.find((o) => o.value === color)?.hint}
        </p>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-muted">Âm lượng</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="min-h-11 accent-accent"
        />
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-muted">
          Hẹn giờ tắt
        </span>
        <Segmented
          label="Hẹn giờ tắt"
          options={TIMER_CHOICES}
          value={String(minutes)}
          onChange={(next) => {
            const option = Number(next);
            setMinutes(option);
            if (playing) start(color, option);
          }}
        />
      </div>
    </Glass>
    <div className="flex flex-col items-center gap-2">
      <IconButton
        label={playing ? "Dừng" : "Phát"}
        icon={playing ? "stop" : "play"}
        filled
        large
        variant="accent"
        onClick={() => (playing ? stop() : start(color, minutes))}
      />
      <span aria-hidden="true" className="text-[13px] font-semibold text-ink">
        {playing ? "Dừng" : "Phát"}
      </span>
    </div>
    {playing && (
      <p role="status" className="text-center text-[15px] text-muted">
        {interrupted
          ? "Âm đang bị ngắt. Bấm Dừng rồi Phát để chạy lại."
          : remaining === null
            ? "Đang phát, không hẹn giờ tắt."
            : `Tắt sau ${formatRemaining(remaining)}`}
      </p>
    )}
    <p className="px-1 text-[13px] text-muted">
      Đặt điện thoại cách xa bé ít nhất 2 m, để âm lượng vừa đủ nghe. iPhone có
      thể dừng âm khi khóa màn hình; nếu vậy, để màn hình sáng với độ sáng thấp.
    </p>
  </main>
);
```

`Segmented` cần `options` dạng `{ value; label }`. `NOISE_OPTIONS` có thêm `hint` nên vẫn hợp kiểu. Nếu typecheck báo `minutes` có kiểu hẹp (`0 | 15 | 30 | 60`), đổi `setMinutes(option)` thành `setMinutes(option as (typeof TIMER_OPTIONS)[number])` và ghi lại trong báo cáo.

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/ui components/noise lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (iconbutton 1, noise 1, các test ui cũ giữ nguyên, themeGuard 1); typecheck không lỗi.

- [ ] **Step 6: Commit**

```bash
git add components/ui/IconButton.tsx components/ui/iconbutton.test.tsx components/noise
git commit -m "feat(noise): segmented pickers and a 64 px play button"
```

---

### Task 3: Màn Ảnh

**Files:**

- Modify: `components/photos/PhotosScreen.tsx` (viết lại toàn file)
- Create: `components/photos/photos.test.tsx`

**Interfaces:**

- Consumes: `PageHeader`, `Glass`, `Button`, `Sheet`, `Skeleton`, `EmptyState`, `ErrorCard`; `FIELD_LABEL`, `FIELD_INPUT`; `OnlineOnly`; dữ liệu và luật ảnh có sẵn.
- Produces: `PhotosScreen({ baby, userId, isOwner })` (cùng chữ ký), `PhotoViewer({ photo, url, baby, canDelete, onClose })` (export để test).

- [ ] **Step 1: Viết test hỏng**

`components/photos/photos.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby, PhotoRow } from "@/lib/supabase/rows";
import { PhotosScreen, PhotoViewer } from "./PhotosScreen";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
} as Baby;
const wrap = (node: ReactNode) =>
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {node}
    </QueryClientProvider>,
  );

describe("PhotosScreen", () => {
  it("a header, a usage bar on the line colour, a glass upload card and skeletons while loading", () => {
    const html = wrap(<PhotosScreen baby={baby} userId="u1" isOwner />);
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain(">Ảnh của bé</h1>");
    expect(html).toContain("bg-line");
    expect(html).not.toContain("bg-soft");
    expect(html).toContain(">Chọn ảnh</span>");
    expect(html).toContain(">Tải ảnh lên</button>");
    expect(html.match(/aspect-square/g)?.length).toBeGreaterThanOrEqual(6);
  });
});

describe("PhotoViewer", () => {
  it("a sheet titled with the date, the photo, and a red Xóa ảnh", () => {
    const photo = {
      id: "p1",
      baby_id: "b1",
      storage_path: "f1/p1.jpg",
      taken_on: "2026-11-01",
      caption: "Bun cười",
      created_by: "u1",
    } as PhotoRow;
    const html = wrap(
      <PhotoViewer
        photo={photo}
        url="https://example.test/p1.jpg"
        baby={baby}
        canDelete
        onClose={() => {}}
      />,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain(">01/11/2026</h2>");
    expect(html).toContain('src="https://example.test/p1.jpg"');
    expect(html).toContain(">Bun cười</p>");
    expect(html).toContain(">Xóa ảnh</button>");
    expect(html).toContain("text-danger!");
    expect(html).not.toContain(">Đóng</button>");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/photos/photos.test.tsx`
Expected: FAIL — `PhotoViewer` chưa được export; bản cũ không có `PageHeader`, dùng `bg-soft`.

- [ ] **Step 3: Viết lại `components/photos/PhotosScreen.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { OnlineOnly } from "@/components/OnlineOnly";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/quick/styles";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Glass } from "@/components/ui/Glass";
import { PageHeader } from "@/components/ui/PageHeader";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { toVietnameseError } from "@/lib/data/errors";
import {
  usePhotoActions,
  usePhotos,
  usePhotosUsage,
  usePhotoUrls,
} from "@/lib/data/photos";
import { PhotoReadError, readHead } from "@/lib/photoCompress";
import { exifDate } from "@/lib/rules/exifDate";
import {
  defaultTakenOn,
  groupByAgeMonth,
  parsePhotoForm,
  usage,
} from "@/lib/rules/photos";
import { vnDateString } from "@/lib/rules/time";
import type { Baby, PhotoRow } from "@/lib/supabase/rows";

const BAR = {
  ok: "bg-accent",
  warn: "bg-warn",
  full: "bg-danger",
} as const;

const dmy = (day: string) => day.split("-").reverse().join("/");

export function PhotosScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const photos = usePhotos(baby.id);
  const rows = photos.data ?? [];
  const total = usePhotosUsage(baby.family_id);
  const [open, setOpen] = useState<{ photo: PhotoRow; url?: string } | null>(
    null,
  );
  const used = usage(total.data ?? 0);
  const groups = groupByAgeMonth(rows, baby.dob);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Ảnh của bé"
        back={{ href: "/kham-pha", label: "Khám phá" }}
      />
      <section className="flex flex-col gap-1.5 px-1">
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full ${BAR[used.level]}`}
            style={{ width: `${used.percent}%` }}
          />
        </div>
        <p
          role={used.level === "ok" ? undefined : "status"}
          className={`text-[13px] ${used.level === "ok" ? "text-muted" : "text-danger"}`}
        >
          {used.text}
        </p>
      </section>
      {used.level !== "full" && <UploadForm baby={baby} />}
      {photos.isPending && photos.fetchStatus === "paused" ? (
        <p className="px-1 text-[15px] text-muted">Cần mạng để tải ảnh.</p>
      ) : photos.isPending ? (
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-[12px]" />
          ))}
        </div>
      ) : photos.isError && !photos.data ? (
        <ErrorCard
          message={toVietnameseError(photos.error)}
          onRetry={() => void photos.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState icon="image" text="Chưa có ảnh nào." />
      ) : (
        groups.map((group) => (
          <PhotoGroup
            key={group.months}
            label={group.label}
            photos={group.photos}
            onOpen={(photo, url) => setOpen({ photo, url })}
          />
        ))
      )}
      {open && (
        <PhotoViewer
          photo={open.photo}
          url={open.url}
          baby={baby}
          canDelete={isOwner || open.photo.created_by === userId}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}

function UploadForm({ baby }: { baby: Baby }) {
  const actions = usePhotoActions(baby.id, baby.family_id);
  const [file, setFile] = useState<File | null>(null);
  const [takenOn, setTakenOn] = useState("");
  const [caption, setCaption] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  // Changing the key clears the file input after an upload.
  const [inputKey, setInputKey] = useState(0);
  const today = vnDateString(new Date());

  async function pick(next: File | null) {
    setFile(next);
    setMessage(null);
    if (!next) return;
    const day = exifDate(await readHead(next).catch(() => new Uint8Array()));
    setTakenOn(defaultTakenOn(day, next.lastModified, baby.dob, new Date()));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("Chọn một ảnh trước.");
      return;
    }
    const parsed = parsePhotoForm(
      { takenOn, caption },
      { dob: baby.dob, today },
    );
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    actions.upload.mutate(
      { file, takenOn: parsed.value.taken_on, caption: parsed.value.caption },
      {
        onSuccess: () => {
          setFile(null);
          setCaption("");
          setInputKey((k) => k + 1);
          setMessage("Đã tải ảnh lên.");
        },
        onError: (e) =>
          setMessage(
            e instanceof PhotoReadError ? e.message : toVietnameseError(e),
          ),
      },
    );
  }

  return (
    <OnlineOnly>
      <Glass as="form" onSubmit={submit} className="flex flex-col gap-3 p-4">
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Chọn ảnh</span>
          <input
            key={inputKey}
            type="file"
            accept="image/*"
            className="min-h-11 text-[15px] text-ink"
            onChange={(e) => void pick(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>Ngày chụp</span>
              <input
                type="date"
                className={FIELD_INPUT}
                min={baby.dob}
                max={today}
                value={takenOn}
                onChange={(e) => setTakenOn(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={FIELD_LABEL}>Ghi chú (không bắt buộc)</span>
              <input
                className={FIELD_INPUT}
                maxLength={200}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>
          </>
        )}
        {message && (
          <p role="status" className="text-[15px] text-ink">
            {message}
          </p>
        )}
        <Button
          type="submit"
          block
          disabled={!file}
          busy={actions.upload.isPending}
        >
          {actions.upload.isPending ? "Đang tải lên…" : "Tải ảnh lên"}
        </Button>
      </Glass>
    </OnlineOnly>
  );
}

export function PhotoViewer({
  photo,
  url,
  baby,
  canDelete,
  onClose,
}: {
  photo: PhotoRow;
  url: string | undefined;
  baby: Baby;
  canDelete: boolean;
  onClose: () => void;
}) {
  const actions = usePhotoActions(baby.id, baby.family_id);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <Sheet
      open
      onClose={onClose}
      title={dmy(photo.taken_on)}
      footer={
        canDelete ? (
          <OnlineOnly>
            <Button
              variant="ghost"
              block
              busy={actions.remove.isPending}
              className="text-danger!"
              onClick={() => {
                if (window.confirm("Xóa ảnh này? Không khôi phục được."))
                  actions.remove.mutate(photo, {
                    onSuccess: onClose,
                    onError: (e) => setMessage(toVietnameseError(e)),
                  });
              }}
            >
              Xóa ảnh
            </Button>
          </OnlineOnly>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3 pt-1">
        {url ? (
          <img
            src={url}
            alt={photo.caption ?? ""}
            className="w-full rounded-[16px]"
          />
        ) : (
          <p className="text-[15px] text-muted">Cần mạng để xem ảnh.</p>
        )}
        {photo.caption && <p className="text-base text-ink">{photo.caption}</p>}
        {message && (
          <p role="alert" className="text-[15px] text-danger">
            {message}
          </p>
        )}
      </div>
    </Sheet>
  );
}

function PhotoGroup({
  label,
  photos,
  onOpen,
}: {
  label: string;
  photos: PhotoRow[];
  onOpen: (photo: PhotoRow, url: string | undefined) => void;
}) {
  const urls = usePhotoUrls(photos.map((p) => p.storage_path));
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="px-1 text-xl leading-[26px] font-bold text-ink">
        {label}
      </h2>
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((photo) => {
          const url = urls.data?.[photo.storage_path];
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpen(photo, url)}
              className="aspect-square overflow-hidden rounded-[12px] bg-line"
              aria-label={photo.caption ?? `Ảnh ngày ${photo.taken_on}`}
            >
              {url && (
                <img
                  src={url}
                  alt={photo.caption ?? ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

Ghi chú: thanh dung lượng mức "warn" đổi từ `bg-warn-ink` sang `bg-warn`; chữ cảnh báo đổi từ `text-danger-ink` sang `text-danger`, cặp màu có trong bài kiểm tra tương phản trên nền trang. Nếu typecheck báo `Glass as="form"` không nhận `onSubmit`, đổi về `<form onSubmit={submit} className="glass flex flex-col gap-3 rounded-[28px] p-4">` và ghi lại trong báo cáo.

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/photos lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (photos 2, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Commit**

```bash
git add components/photos
git commit -m "feat(photos): glass upload card, photo sheet and loading states"
```

---

### Task 4: Màn Báo cáo; kiểm toàn bộ

**Files:**

- Modify: `components/report/ReportScreen.tsx` (sửa phần đầu màn hình, khung nội dung và class ô bảng)
- Create: `components/report/report.test.tsx`

**Interfaces:**

- Consumes: `PageHeader`, `Segmented`, `Button`, `Icon`, `Skeleton`, `ErrorCard`; dữ liệu và luật báo cáo có sẵn. Khung nội dung dùng class `glass` trực tiếp để thêm được `print:rounded-none`.
- Produces: `ReportScreen({ baby })`, cùng chữ ký.

- [ ] **Step 1: Viết test hỏng**

`components/report/report.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Baby } from "@/lib/supabase/rows";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ReportScreen } from "./ReportScreen";

const baby = {
  id: "b1",
  family_id: "f1",
  name: "Bun",
  dob: "2026-09-10",
  sex: "male",
  vaccine_choices: {},
} as unknown as Baby;

describe("ReportScreen", () => {
  it("screen controls stay off paper: header, 7/14 days, a print button and skeletons while loading", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ReportScreen baby={baby} />
      </QueryClientProvider>,
    );
    expect(html).toContain("print:hidden");
    expect(html).toContain('href="/kham-pha"');
    expect(html).toContain(">Báo cáo cho bác sĩ</h1>");
    expect(html).toContain('aria-label="Khoảng thời gian"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>7 ngày<\/button>/);
    expect(html).toContain(`d="${ICON_PATHS.doc}"`);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>(?:(?!<button)[\s\S])*In \/ Lưu PDF<\/button>/);
    expect(html).toContain("kb-pulse");
    expect(html).not.toContain("bg-soft");
    expect(html).not.toContain("Đang tải dữ liệu…");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/report/report.test.tsx`
Expected: FAIL — bản cũ không có `PageHeader`, dùng `bg-soft` và chữ "Đang tải dữ liệu…".

- [ ] **Step 3: Sửa `components/report/ReportScreen.tsx`**

1. Thêm các import ngay dưới dòng `import { useState } from "react";`:

```tsx
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
```

2. Thêm hằng ngay dưới dòng `const dmy = …;`:

```tsx
const RANGES = REPORT_DAYS.map((n) => ({
  value: String(n),
  label: `${n} ngày`,
}));
```

3. Đổi dòng `const cell = "border px-2 py-1";` thành:

```tsx
const cell = "border border-line px-2 py-1 print:border-ink";
```

4. Thay toàn bộ khối `<div className="flex flex-col gap-3 print:hidden"> … </div>` (từ `<h1 className="text-2xl font-semibold">Báo cáo cho bác sĩ</h1>` đến hết đoạn `!ready && failures.length === 0`) bằng:

```tsx
<div className="flex flex-col gap-[18px] print:hidden">
  <PageHeader
    title="Báo cáo cho bác sĩ"
    back={{ href: "/kham-pha", label: "Khám phá" }}
  />
  <Segmented
    label="Khoảng thời gian"
    options={RANGES}
    value={String(range)}
    onChange={(value) =>
      setRange(Number(value) as (typeof REPORT_DAYS)[number])
    }
  />
  <Button block disabled={!ready} onClick={() => window.print()}>
    <Icon name="doc" size={18} />
    In / Lưu PDF
  </Button>
  {failures.map(({ label, query }) => (
    <ErrorCard
      key={label}
      message={`${label}: ${toVietnameseError(query.error)}`}
      onRetry={() => void query.refetch()}
    />
  ))}
  {!ready && failures.length === 0 && (
    <div className="flex flex-col gap-2.5">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[60px]" />
      ))}
    </div>
  )}
</div>
```

5. Đổi thẻ mở `<main …>` thành:

```tsx
    <main className="mx-auto flex max-w-2xl flex-col gap-[18px] px-4 pt-2 pb-4 print:max-w-none print:p-0 print:text-sm">
```

6. Bọc toàn bộ nội dung trong `{ready && ( <> … </> )}` bằng một thẻ kính. Thay `{ready && (\n        <>` bằng:

```tsx
      {ready && (
        <div className="glass flex flex-col gap-4 rounded-[28px] p-4 text-ink print:rounded-none print:border-0 print:p-0">
```

và thay `        </>\n      )}` cuối file (ngay trước `</main>`) bằng:

```tsx
        </div>
      )}
```

Trong `failures`, mỗi `query` là kết quả `useQuery`/`useStatsLogs` có `refetch`. Nếu TypeScript báo `refetch` không có trên kiểu hợp của mảng, khai báo mảng với kiểu `{ label: string; query: { isError: boolean; data: unknown; error: unknown; refetch: () => unknown } }[]`, rồi ghi lại trong báo cáo.

- [ ] **Step 4: Chạy test để thấy xanh**

Run: `bun run test components/report lib/themeGuard.test.ts && bun run typecheck`
Expected: PASS (report 1, themeGuard 1); typecheck không lỗi.

- [ ] **Step 5: Typecheck, test, build**

Run: `bun run typecheck && bun run test && bun run build`
Expected: typecheck không lỗi; mọi test xanh. Số test: 629 có sẵn + 2 music + 1 iconbutton + 1 noise + 2 photos + 1 report = 636. Build xong.

- [ ] **Step 6: Kiểm trên trình duyệt**

Run: `bun run dev`, mở `http://localhost:3000` ở bề rộng 375 px, đăng nhập. **Không thêm link, không ẩn/xóa nhạc, không tải hay xóa ảnh, không bấm mở YouTube.**
Expected:

- **Khám phá → Nhạc:**
  - Có nút "‹ Khám phá" và 2 ô chọn nút liền (loại nhạc, "Mở YouTube bằng").
  - Danh sách kính, mỗi bài có chip ▷ icon (không còn ký tự "▶"), "Mở trên web", "Ẩn".
  - Có thẻ kính "Thêm link YouTube".
  - Đổi sang "Phát triển trí não": hiện khung vàng ghi chú.
- **Khám phá → Ồn trắng:**
  - Thẻ kính có "Loại âm", "Âm lượng", "Hẹn giờ tắt".
  - Nút tròn to "Phát": bấm thì có tiếng và nút thành "Dừng" kèm dòng "Tắt sau …"; bấm "Dừng" để tắt.
- **Khám phá → Ảnh:**
  - Có thanh dung lượng và thẻ kính "Chọn ảnh".
  - Lưới ảnh theo tháng tuổi, hoặc icon ảnh và "Chưa có ảnh nào.".
  - Nếu có ảnh: bấm một ảnh, sheet mở có ngày ở tiêu đề; đóng nó.
- **Khám phá → Báo cáo:**
  - Có nút "‹ Khám phá", ô chọn 7 / 14 ngày, nút "In / Lưu PDF" có icon.
  - Nội dung báo cáo trong thẻ kính.
  - Mở Print Preview (Cmd+P trong trình duyệt nếu được, hoặc giả lập media print): không có tab bar, nút "+", nút điều khiển; nền trắng chữ đen, bảng có viền đen. Đóng hộp in mà không in.
- Đổi qua theme Sáng, xem lại 4 màn. Đặt lại lựa chọn giao diện như ban đầu. Tắt dev server. Nếu không mở được trình duyệt có đăng nhập, ghi rõ phần chưa kiểm.

- [ ] **Step 7: Commit**

```bash
git add components/report
git commit -m "feat(report): screen header and controls, glass report card, print stays black and white"
```

---

## Kết thúc M4 (Đợt 5)

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: 636 test xanh, typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: lập plan Đợt 5 / M5 (Đăng nhập, Khai báo bé, Chưa được mời, Cài app, Offline, `AuthGate`; bên trong 3 trang con Cài đặt).
