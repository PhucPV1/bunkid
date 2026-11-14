# Kim Bun UI — Đợt 1 / M5 (Sheet, Toast) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-14

**Goal:** Tạo hai component có trạng thái của spec §5 (cột "Đợt" = 1): `Sheet` (bottom sheet trên `<dialog>`, kéo để đóng, hỏi "Bỏ thay đổi?") và `Toast` (thông báo nổi có một nút, gắn trong `Providers`).

**Architecture:**

- Mỗi component một file trong `components/ui/`, chỉ nhận props, không gọi dữ liệu. Class Tailwind dùng token của M2 (`bg-accent`, `glass`, `text-muted`…); không mã hex, không class bảng màu Tailwind (luật `lib/themeGuard.test.ts`).
- Logic thuần tách ra `lib/ui/` (`cx`, ngưỡng kéo sheet, reducer toast) để test không cần DOM. Component không dùng hook được test bằng cách gọi hàm component và duyệt cây phần tử (`components/ui/testTree.ts`); mọi component được test thêm bằng `renderToStaticMarkup`.
- `Sheet` dùng `<dialog>` + `showModal()`, kéo tay nắm để đóng, hỏi "Bỏ thay đổi?" khi form đã đổi, có hoạt ảnh trượt lên/xuống. `Toast` là một context gắn trong `Providers`, mỗi lúc một thông báo, tự tắt sau 5 giây.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, Vitest 5 (`react-dom/server` cho test render), Bun. Không thêm gói nào.

**Các mốc của Đợt 1 (spec §12):** M1 nhận diện, M2 token và kính, M3 Ban đêm theo lịch — đã làm xong trên nhánh `feat/kim-bun-dot1-m3`. **M4:** component không trạng thái (`Glass`, `Button`, `IconButton`, `Segmented`, `ChipGroup`, `Switch`, `Swatch`, `ListGroup`/`ListRow`, `StatTile`, `Skeleton`). **M5 (plan này):** `Sheet`, `Toast`. Cần M4. `TimerRing` (Đợt 3), `PageHeader`, `TabBar`, `ActionSheet` (Đợt 2) không thuộc plan này.

## Global Constraints

- Ngôn ngữ giao diện: chỉ tiếng Việt (`vi-VN`).
- Phiên bản giữ như `package.json` hiện tại: `next` 16.4.3, `react` 19.3.1, `tailwindcss` 4.3.3. Bun 1.x. TypeScript `strict: true`.
- **Không thêm thư viện nào** vào `dependencies` hay `devDependencies`.
- **Không tải font web.** Font chữ hệ thống đã đặt ở `--font-sans` (M2).
- Không dùng emoji làm icon ở bất kỳ đâu trong UI; icon dùng `components/ui/Icon.tsx`.
- Màu chỉ khai báo ở `app/globals.css`, `lib/ui/tokens.ts`, `lib/brand/logo.ts`. `lib/themeGuard.test.ts` giữ nguyên và phải xanh: không hex 6 chữ số và không class bảng màu Tailwind (`bg-white`, `text-gray-500`…) trong `.tsx` của `app/` và `components/`. Màu thật (ô phân) truyền vào component bằng prop, lấy từ `lib/ui/tokens.ts`.
- Component trong `components/ui/` không gọi dữ liệu, chỉ nhận props.
- Vùng chạm tối thiểu 44×44 pt (`min-h-11`/`size-11`); riêng nút đóng sheet 36 pt theo spec §8.
- Tôn trọng `prefers-reduced-motion: reduce` (M2 đã rút mọi animation/transition về 0.01 ms) và `prefers-reduced-transparency: reduce` (M2 đã thay `.glass` bằng nền đặc).
- Mọi giờ và số đo dùng `tabular-nums`.
- Trước khi dùng API của Next, đọc trang tương ứng trong `node_modules/next/dist/docs/` (AGENTS.md).

## Contracts with Other Plans

**Consumes** (từ M4):

- `lib/ui/cx.ts`: `cx(...parts: (string | false | null | undefined)[]): string`.
- `components/ui/testTree.ts`: `hostElements(node: ReactNode, tag: string): ReactElement<TreeProps>[]`.
- `components/ui/Button.tsx`: `<Button variant? size? block? busy? …ButtonHTMLAttributes>` với `variant` `"secondary"` và `"danger"`.
- `components/ui/IconButton.tsx`: `<IconButton label icon variant? small? filled? …ButtonHTMLAttributes>` với `variant="plain"`, `small`.
- `app/globals.css`: keyframes `kb-pulse` đã có (M5 chèn keyframes mới ngay sau nó).

**Consumes** (từ M2):

- `lib/ui/icons.ts`: `type IconName`. `components/ui/Icon.tsx`: `<Icon name size? strokeWidth? filled? className? />`.
- `lib/ui/categories.ts`: `type CategoryToken` (`"cat-feed" | "cat-bottle" | "cat-sleep" | "cat-diaper" | "cat-pump" | "cat-tummy" | "cat-med" | "cat-temp"`).
- `lib/ui/tokens.ts`: `STOOL_SWATCHES` (chỉ dùng trong test).
- Token CSS → class Tailwind: `bg-accent`, `text-on-accent`, `text-accent-text`, `bg-danger-solid`, `text-on-danger`, `text-danger`, `text-ink`, `text-muted`, `bg-muted`, `text-bg`, `bg-bg`, `from-bg`, `bg-glass-solid`, `bg-line`, `border-line`, `border-muted`, `bg-switch-on`, `bg-cat-*`, `text-cat-*`, `text-good`, `text-warn`, `backdrop:bg-scrim`, `ring-accent-text`, `ring-offset-bg`; utility `glass`, `glass-strong`.
- `vitest.config.ts` đã chạy `components/**/*.test.tsx`.

**Produces** (Đợt 2–5 dùng, tên và kiểu cố định):

- `lib/ui/sheet.ts`: `SHEET_DRAG_CLOSE_PX = 80`, `dragOffset(dy: number): number`, `shouldDismissDrag(dy: number): boolean`.
- `components/ui/Sheet.tsx`: `type SheetVariant = "bottom" | "floating"`, `<Sheet open onClose title icon? iconColor? dirty? footer? variant? children />`.
- `lib/ui/toast.ts`: `TOAST_MS = 5000`, `type ToastAction`, `type ToastItem`, `type ToastState`, `type ToastEvent`, `INITIAL_TOAST`, `toastReducer`.
- `components/ui/Toast.tsx`: `<ToastProvider>` (gắn trong `Providers`), `<ToastView item onDismiss />`, `useToast(): (message: string, action?: ToastAction) => void`.
- `app/globals.css`: keyframes `kb-sheet-in`, `kb-sheet-out`, `kb-fade-in`.

---

### Task 1: `Sheet`

**Files:**

- Create: `lib/ui/sheet.ts`, `lib/ui/sheet.test.ts`, `components/ui/Sheet.tsx`, `components/ui/sheet.test.tsx`
- Modify: `app/globals.css` (thêm 3 keyframes ngay sau khối `@keyframes kb-pulse` của M4)

**Interfaces:**

- Consumes: `cx`, `Button`, `IconButton` (M4); `Icon`, `IconName`, `CategoryToken` (M2).
- Produces: `SHEET_DRAG_CLOSE_PX`, `dragOffset`, `shouldDismissDrag`; `Sheet`, `SheetVariant` (chữ ký ở Contracts). Hành vi: `open` true → `showModal()`; Esc, nút "Đóng", chạm vùng tối, kéo tay nắm xuống quá 80 px → nếu `dirty` thì hiện "Bỏ thay đổi?" (nút "Tiếp tục nhập", "Bỏ"), không thì trượt xuống rồi gọi `onClose()`. Cha đặt `open` false thì đóng ngay.

- [ ] **Step 1: Đọc docs**

Đọc `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (chỉ thị `"use client"`) để chắc file dùng hook có chỉ thị đúng.

- [ ] **Step 2: Viết test hỏng**

`lib/ui/sheet.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dragOffset, SHEET_DRAG_CLOSE_PX, shouldDismissDrag } from "./sheet";

describe("sheet drag", () => {
  it("closes only past 80 px downwards", () => {
    expect(SHEET_DRAG_CLOSE_PX).toBe(80);
    expect(shouldDismissDrag(80)).toBe(false);
    expect(shouldDismissDrag(81)).toBe(true);
    expect(shouldDismissDrag(-200)).toBe(false);
  });

  it("follows the finger downwards only", () => {
    expect(dragOffset(40)).toBe(40);
    expect(dragOffset(-30)).toBe(0);
  });
});
```

`components/ui/sheet.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { Sheet } from "./Sheet";

const noop = () => {};

describe("Sheet", () => {
  it("is a dialog labelled by its title, with handle, close button, body and footer", () => {
    const html = renderToStaticMarkup(
      <Sheet
        open
        title="Thay tã"
        icon="drop"
        iconColor="cat-diaper"
        onClose={noop}
        footer={<button>Lưu</button>}
      >
        <p>Thân</p>
      </Sheet>,
    );
    expect(html).toContain("<dialog");
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(">Thay tã</h2>");
    expect(html).toContain("data-sheet-handle");
    expect(html).toContain('aria-label="Đóng"');
    expect(html).toContain("size-9");
    expect(html).toContain(`d="${ICON_PATHS.drop}"`);
    expect(html).toContain("bg-cat-diaper/15 text-cat-diaper");
    expect(html).toContain("<p>Thân</p>");
    expect(html).toContain(">Lưu</button>");
    expect(html).toContain("max-h-[88dvh] rounded-[38px]");
    expect(html).toContain("glass-strong");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("backdrop:bg-scrim");
    expect(html).not.toContain("Bỏ thay đổi?");
  });

  it("the floating variant has no handle and a smaller radius", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="Ghi lại cho Bun" variant="floating" onClose={noop}>
        x
      </Sheet>,
    );
    expect(html).not.toContain("data-sheet-handle");
    expect(html).toContain("rounded-[34px]");
  });

  it("slides in with the iOS curve", () => {
    const html = renderToStaticMarkup(
      <Sheet open title="a" onClose={noop}>
        x
      </Sheet>,
    );
    expect(html).toContain(
      "animate-[kb-sheet-in_280ms_cubic-bezier(0.32,0.72,0,1)]",
    );
  });
});
```

- [ ] **Step 3: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/sheet.test.ts components/ui/sheet.test.tsx`
Expected: FAIL — `Cannot find module "./sheet"` và `"./Sheet"`.

- [ ] **Step 4: Viết `lib/ui/sheet.ts`**

```ts
export const SHEET_DRAG_CLOSE_PX = 80;

export function dragOffset(dy: number): number {
  return Math.max(0, dy);
}

export function shouldDismissDrag(dy: number): boolean {
  return dy > SHEET_DRAG_CLOSE_PX;
}
```

- [ ] **Step 5: Thêm keyframes vào `app/globals.css`**

Chèn ngay sau khối `@keyframes kb-pulse { … }` (M4):

```css
@keyframes kb-sheet-in {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes kb-sheet-out {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

@keyframes kb-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

- [ ] **Step 6: Viết `components/ui/Sheet.tsx`**

```tsx
"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import type { IconName } from "@/lib/ui/icons";
import { dragOffset, shouldDismissDrag } from "@/lib/ui/sheet";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

export type SheetVariant = "bottom" | "floating";

const CHIP: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed/15 text-cat-feed",
  "cat-bottle": "bg-cat-bottle/15 text-cat-bottle",
  "cat-sleep": "bg-cat-sleep/15 text-cat-sleep",
  "cat-diaper": "bg-cat-diaper/15 text-cat-diaper",
  "cat-pump": "bg-cat-pump/15 text-cat-pump",
  "cat-tummy": "bg-cat-tummy/15 text-cat-tummy",
  "cat-med": "bg-cat-med/15 text-cat-med",
  "cat-temp": "bg-cat-temp/15 text-cat-temp",
};

const BOTTOM_PAD = "pb-[calc(20px+env(safe-area-inset-bottom))]";

export function Sheet({
  open,
  onClose,
  title,
  icon,
  iconColor,
  dirty = false,
  footer,
  variant = "bottom",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: IconName;
  iconColor?: CategoryToken;
  dirty?: boolean;
  footer?: ReactNode;
  variant?: SheetVariant;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [confirming, setConfirming] = useState(false);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState<{ startY: number; dy: number } | null>(null);
  // A tap on the scrim closes the sheet; a text selection released over it does not.
  const downOnScrim = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setConfirming(false);
      setClosing(false);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Every way of closing goes through here; unsaved input asks first.
  function requestClose() {
    if (dirty) {
      setConfirming(true);
      return;
    }
    setClosing(true);
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClose={() => {
        // The browser can close the dialog itself (e.g. a second Esc on Android Chrome):
        // tell the parent so `open` does not stay true and block the next open.
        setConfirming(false);
        setClosing(false);
        if (open) onClose();
      }}
      onPointerDown={(event) => {
        downOnScrim.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (downOnScrim.current && event.target === event.currentTarget)
          requestClose();
        downOnScrim.current = false;
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none flex-col justify-end bg-transparent p-2 text-ink backdrop:animate-[kb-fade-in_200ms_ease-out] backdrop:bg-scrim open:flex"
    >
      <div
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) {
            setClosing(false);
            onClose();
          }
        }}
        style={
          drag && drag.dy > 0
            ? { transform: `translateY(${dragOffset(drag.dy)}px)` }
            : undefined
        }
        className={cx(
          "glass-strong mx-auto flex w-full max-w-md flex-col shadow-[0_-10px_40px_rgb(0_0_0/0.18)]",
          variant === "bottom"
            ? "max-h-[88dvh] rounded-[38px]"
            : "mb-24 max-h-[80dvh] rounded-[34px]",
          closing
            ? "animate-[kb-sheet-out_280ms_cubic-bezier(0.32,0.72,0,1)_forwards]"
            : "animate-[kb-sheet-in_280ms_cubic-bezier(0.32,0.72,0,1)]",
        )}
      >
        {variant === "bottom" && (
          <div
            data-sheet-handle
            className="flex cursor-grab touch-none justify-center pt-2.5 pb-1"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDrag({ startY: event.clientY, dy: 0 });
            }}
            onPointerMove={(event) => {
              if (drag)
                setDrag({
                  startY: drag.startY,
                  dy: event.clientY - drag.startY,
                });
            }}
            onPointerUp={() => {
              if (drag && shouldDismissDrag(drag.dy)) requestClose();
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
          >
            <span className="h-[5px] w-9 rounded-full bg-muted/40" />
          </div>
        )}
        <header className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && iconColor && (
              <span
                className={cx(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  CHIP[iconColor],
                )}
              >
                <Icon name={icon} size={18} strokeWidth={2.2} />
              </span>
            )}
            <h2 id={titleId} className="text-[22px] leading-7 font-bold">
              {title}
            </h2>
          </div>
          <IconButton
            label="Đóng"
            icon="close"
            small
            variant="plain"
            className="bg-muted/15"
            onClick={requestClose}
          />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
          {children}
        </div>
        {confirming ? (
          <div
            role="alertdialog"
            aria-label="Bỏ thay đổi?"
            className={cx("flex flex-col gap-3 px-5 pt-2", BOTTOM_PAD)}
          >
            <p className="text-center font-semibold">Bỏ thay đổi?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Tiếp tục nhập
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirming(false);
                  setClosing(true);
                }}
              >
                Bỏ
              </Button>
            </div>
          </div>
        ) : footer ? (
          <div className={cx("px-5 pt-2", BOTTOM_PAD)}>{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
}
```

Ghi chú cho người làm: khi giảm chuyển động, M2 rút animation về 0.01 ms nên `animationend` vẫn bắn và `onClose()` vẫn được gọi.

- [ ] **Step 7: Chạy test để thấy xanh**

Run: `bun run test lib/ui/sheet.test.ts components/ui/sheet.test.tsx lib/themeGuard.test.ts`
Expected: PASS (sheet drag 2, Sheet 3, themeGuard 1).

- [ ] **Step 8: Typecheck**

Run: `bun run typecheck`
Expected: không lỗi.

- [ ] **Step 9: Commit**

```bash
git add lib/ui/sheet.ts lib/ui/sheet.test.ts components/ui/Sheet.tsx components/ui/sheet.test.tsx app/globals.css
git commit -m "feat(ui): bottom sheet on dialog with drag to close and discard prompt"
```

---

### Task 2: `Toast`

**Files:**

- Create: `lib/ui/toast.ts`, `lib/ui/toast.test.ts`, `components/ui/Toast.tsx`, `components/ui/toast.test.tsx`
- Modify: `components/Providers.tsx:1-10` (import), `components/Providers.tsx:49-51` (bọc `children`)

**Interfaces:**

- Consumes: `cx` (M4).
- Produces: `TOAST_MS`, `ToastAction`, `ToastItem`, `ToastState`, `ToastEvent`, `INITIAL_TOAST`, `toastReducer`; `ToastProvider`, `ToastView`, `useToast` (chữ ký ở Contracts). Mỗi lúc một thông báo; thông báo mới thay thông báo cũ; tự tắt sau `TOAST_MS`; hết giờ của thông báo cũ không tắt thông báo mới. Khi một `Sheet` đang mở, toast nằm dưới lớp tối và không bấm được: nơi dùng (Đợt 3–4) gọi `useToast` sau khi sheet đã đóng.

- [ ] **Step 1: Viết test hỏng**

`lib/ui/toast.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { INITIAL_TOAST, TOAST_MS, toastReducer } from "./toast";

describe("toastReducer", () => {
  it("shows one toast at a time with increasing ids", () => {
    const action = { label: "Hoàn tác", onAction: vi.fn() };
    const first = toastReducer(INITIAL_TOAST, {
      type: "show",
      message: "Đã ghi Tã ướt lúc 17:16",
      action,
    });
    expect(first.current).toEqual({
      id: 1,
      message: "Đã ghi Tã ướt lúc 17:16",
      action,
    });
    const second = toastReducer(first, {
      type: "show",
      message: "Đã ghi Bú bình lúc 17:20",
    });
    expect(second.current).toEqual({
      id: 2,
      message: "Đã ghi Bú bình lúc 17:20",
      action: undefined,
    });
  });

  it("an old timer does not dismiss a newer toast", () => {
    const first = toastReducer(INITIAL_TOAST, { type: "show", message: "a" });
    const second = toastReducer(first, { type: "show", message: "b" });
    expect(toastReducer(second, { type: "dismiss", id: 1 })).toBe(second);
    expect(toastReducer(second, { type: "dismiss", id: 2 }).current).toBeNull();
  });

  it("lasts five seconds", () => {
    expect(TOAST_MS).toBe(5000);
  });
});
```

`components/ui/toast.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { hostElements } from "./testTree";
import { ToastProvider, ToastView, useToast } from "./Toast";

describe("ToastView", () => {
  it("is a polite live region floating above the tab bar", () => {
    const html = renderToStaticMarkup(
      <ToastView item={null} onDismiss={() => {}} />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px)]");
    expect(html).toContain("print:hidden");
    expect(html).not.toContain("glass-strong");
  });

  it("shows the message and one action button", () => {
    const item = {
      id: 3,
      message: "Đã ghi Tã ướt lúc 17:16",
      action: { label: "Hoàn tác", onAction: () => {} },
    };
    const html = renderToStaticMarkup(
      <ToastView item={item} onDismiss={() => {}} />,
    );
    expect(html).toContain("glass-strong");
    expect(html).toContain(">Đã ghi Tã ướt lúc 17:16</span>");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain(">Hoàn tác</button>");
  });

  it("runs the action and dismisses that toast", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    const [button] = hostElements(
      ToastView({
        item: { id: 7, message: "x", action: { label: "Hoàn tác", onAction } },
        onDismiss,
      }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith(7);
  });
});

describe("useToast", () => {
  function Probe() {
    const show = useToast();
    return <span>{typeof show}</span>;
  }

  it("works inside ToastProvider", () => {
    expect(
      renderToStaticMarkup(
        <ToastProvider>
          <Probe />
        </ToastProvider>,
      ),
    ).toContain("<span>function</span>");
  });

  it("throws outside ToastProvider", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      "useToast must be used inside ToastProvider",
    );
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/toast.test.ts components/ui/toast.test.tsx`
Expected: FAIL — `Cannot find module "./toast"` và `"./Toast"`.

- [ ] **Step 3: Viết `lib/ui/toast.ts`**

```ts
export const TOAST_MS = 5000;

export type ToastAction = { label: string; onAction: () => void };
export type ToastItem = { id: number; message: string; action?: ToastAction };
export type ToastState = { nextId: number; current: ToastItem | null };
export type ToastEvent =
  | { type: "show"; message: string; action?: ToastAction }
  | { type: "dismiss"; id: number };

export const INITIAL_TOAST: ToastState = { nextId: 1, current: null };

export function toastReducer(state: ToastState, event: ToastEvent): ToastState {
  if (event.type === "show")
    return {
      nextId: state.nextId + 1,
      current: {
        id: state.nextId,
        message: event.message,
        action: event.action,
      },
    };
  return state.current?.id === event.id ? { ...state, current: null } : state;
}
```

- [ ] **Step 4: Viết `components/ui/Toast.tsx`**

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import {
  INITIAL_TOAST,
  TOAST_MS,
  toastReducer,
  type ToastAction,
  type ToastItem,
} from "@/lib/ui/toast";

type ShowToast = (message: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastView({
  item,
  onDismiss,
}: {
  item: ToastItem | null;
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+74px)] z-40 flex justify-center print:hidden"
    >
      {item && (
        <div className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 shadow-[0_10px_30px_rgb(0_0_0/0.15)]">
          <span className="text-[15px] font-medium text-ink">
            {item.message}
          </span>
          {item.action && (
            <button
              type="button"
              onClick={() => {
                item.action?.onAction();
                onDismiss(item.id);
              }}
              className="min-h-11 shrink-0 rounded-full px-4 text-[15px] font-semibold text-accent-text"
            >
              {item.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, INITIAL_TOAST);
  const show = useCallback<ShowToast>(
    (message, action) => dispatch({ type: "show", message, action }),
    [],
  );
  const current = state.current;
  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "dismiss", id: current.id }),
      TOAST_MS,
    );
    return () => window.clearTimeout(timer);
  }, [current]);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastView
        item={current}
        onDismiss={(id) => dispatch({ type: "dismiss", id })}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside ToastProvider");
  return show;
}
```

- [ ] **Step 5: Gắn `ToastProvider` vào `components/Providers.tsx`**

Thêm import cạnh import `Backdrop`:

```ts
import { ToastProvider } from "@/components/ui/Toast";
```

Thay ba dòng cuối trong JSX:

```tsx
      <Backdrop />
      <OutboxSync />
      {children}
```

bằng:

```tsx
      <Backdrop />
      <OutboxSync />
      <ToastProvider>{children}</ToastProvider>
```

- [ ] **Step 6: Chạy test để thấy xanh**

Run: `bun run test lib/ui/toast.test.ts components/ui/toast.test.tsx lib/themeGuard.test.ts`
Expected: PASS (toastReducer 3, ToastView 3, useToast 2, themeGuard 1).

- [ ] **Step 7: Commit**

```bash
git add lib/ui/toast.ts lib/ui/toast.test.ts components/ui/Toast.tsx components/ui/toast.test.tsx components/Providers.tsx
git commit -m "feat(ui): toast with one action, mounted in providers"
```

---

## Kết thúc M5

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: mọi test xanh, typecheck không lỗi, build xong.
- [ ] Kiểm nhanh trên trình duyệt: `bun run dev`, mở `http://localhost:3000` (375 px). Expected: trang chủ không đổi gì so với trước (chưa màn nào dùng `Sheet`); `ToastView` rỗng không chiếm chỗ, không chặn chạm vào tab bar. Tắt dev server.
- [ ] Đợt 1 xong. Bước tiếp theo: dùng `blueprint-writing-plans` lập plan Đợt 2 (khung điều hướng, spec §12) với Produces của M2–M5 làm Consumes.
