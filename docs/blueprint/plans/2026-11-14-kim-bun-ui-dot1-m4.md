# Kim Bun UI — Đợt 1 / M4 (component không trạng thái) Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/blueprint/specs/2026-11-14-kim-bun-liquid-glass-ui-design.md`

**Status:** approved 2026-11-14

**Goal:** Tạo các component không trạng thái của spec §5 (cột "Đợt" = 1): `Glass`, `Button`, `IconButton`, `Segmented`, `ChipGroup`, `Switch`, `Swatch`, `ListGroup`/`ListRow`, `StatTile`, `Skeleton`.

**Architecture:**

- Mỗi component một file trong `components/ui/`, chỉ nhận props, không gọi dữ liệu. Class Tailwind dùng token của M2 (`bg-accent`, `glass`, `text-muted`…); không mã hex, không class bảng màu Tailwind (luật `lib/themeGuard.test.ts`).
- Logic thuần tách ra `lib/ui/` (`cx`, ngưỡng kéo sheet, reducer toast) để test không cần DOM. Component không dùng hook được test bằng cách gọi hàm component và duyệt cây phần tử (`components/ui/testTree.ts`); mọi component được test thêm bằng `renderToStaticMarkup`.
- `Sheet` dùng `<dialog>` + `showModal()`, kéo tay nắm để đóng, hỏi "Bỏ thay đổi?" khi form đã đổi, có hoạt ảnh trượt lên/xuống. `Toast` là một context gắn trong `Providers`, mỗi lúc một thông báo, tự tắt sau 5 giây.

**Tech Stack:** Next.js 16.4.3 (App Router), React 19.3.1, TypeScript 5.9, Tailwind CSS 4.3.3, Vitest 5 (`react-dom/server` cho test render), Bun. Không thêm gói nào.

**Các mốc của Đợt 1 (spec §12):** M1 nhận diện, M2 token và kính, M3 Ban đêm theo lịch — đã làm xong trên nhánh `feat/kim-bun-dot1-m3`. **M4 (plan này):** component không trạng thái của §5 có "Đợt" = 1. **M5 (plan kế):** `Sheet` và `Toast`, dùng `Button`/`IconButton` của M4. `TimerRing` (Đợt 3), `PageHeader`, `TabBar`, `ActionSheet` (Đợt 2) không thuộc plan này.

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

**Consumes** (từ M2, đã có trong code):

- `lib/ui/icons.ts`: `type IconName`. `components/ui/Icon.tsx`: `<Icon name size? strokeWidth? filled? className? />`.
- `lib/ui/categories.ts`: `type CategoryToken` (`"cat-feed" | "cat-bottle" | "cat-sleep" | "cat-diaper" | "cat-pump" | "cat-tummy" | "cat-med" | "cat-temp"`).
- `lib/ui/tokens.ts`: `STOOL_SWATCHES` (chỉ dùng trong test).
- Token CSS → class Tailwind: `bg-accent`, `text-on-accent`, `text-accent-text`, `bg-danger-solid`, `text-on-danger`, `text-danger`, `text-ink`, `text-muted`, `bg-muted`, `text-bg`, `bg-bg`, `from-bg`, `bg-glass-solid`, `bg-line`, `border-line`, `border-muted`, `bg-switch-on`, `bg-cat-*`, `text-cat-*`, `text-good`, `text-warn`, `backdrop:bg-scrim`, `ring-accent-text`, `ring-offset-bg`; utility `glass`, `glass-strong`.
- `vitest.config.ts` đã chạy `components/**/*.test.tsx`.

**Produces** (M5 và Đợt 2–5 dùng, tên và kiểu cố định):

- `lib/ui/cx.ts`: `cx(...parts: (string | false | null | undefined)[]): string`.
- `components/ui/testTree.ts`: `type TreeProps`, `hostElements(node: ReactNode, tag: string): ReactElement<TreeProps>[]` (chỉ dùng trong test).
- `components/ui/Glass.tsx`: `type GlassRadius = "sheet" | "hero" | "card" | "tile" | "field"`, `<Glass strong? radius? as? className? …HTMLAttributes>`.
- `components/ui/Button.tsx`: `type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"`, `type ButtonSize = "md" | "lg"`, `buttonClass(opts?: { variant?; size?; block? }): string`, `<Button variant? size? block? busy? …ButtonHTMLAttributes>`.
- `components/ui/IconButton.tsx`: `type IconButtonVariant = "glass" | "plain" | "accent" | "danger"`, `<IconButton label icon variant? small? filled? …ButtonHTMLAttributes>`.
- `components/ui/Segmented.tsx`: `type ChoiceOption<T extends string> = { value: T; label: string }`, `<Segmented<T> label options value onChange className? />`.
- `components/ui/ChipGroup.tsx`: `<ChipGroup<T> label options value onChange className? />`.
- `components/ui/Switch.tsx`: `<Switch checked onChange label disabled? />`.
- `components/ui/Swatch.tsx`: `<Swatch color: string | null label selected onSelect outlined? />`.
- `components/ui/ListGroup.tsx`: `type ListRowIconColor = CategoryToken | "muted" | "accent"`, `<ListGroup title? className?>`, `<ListRow label detail? value? icon? iconColor? href? onClick? trailing? chevron? />`.
- `components/ui/StatTile.tsx`: `type StatTone = "good" | "warn" | "danger" | "muted"`, `<StatTile label value note? tone? />`.
- `components/ui/Skeleton.tsx`: `<Skeleton className? />`.
- `app/globals.css`: keyframes `kb-pulse` (chèn ngay trước `@media (prefers-reduced-motion: reduce)`).

---

### Task 1: `cx`, cây test, `Glass`, `Button`, `IconButton`

**Files:**

- Create: `lib/ui/cx.ts`, `lib/ui/cx.test.ts`, `components/ui/testTree.ts`, `components/ui/Glass.tsx`, `components/ui/Button.tsx`, `components/ui/IconButton.tsx`, `components/ui/basics.test.tsx`

**Interfaces:**

- Consumes: `Icon`, `IconName` (M2).
- Produces: `cx`; `hostElements(node: ReactNode, tag: string): ReactElement<TreeProps>[]` và `type TreeProps` (chỉ dùng trong test); `Glass`, `GlassRadius`; `Button`, `buttonClass`, `ButtonVariant`, `ButtonSize`; `IconButton`, `IconButtonVariant` (chữ ký ở Contracts).

- [ ] **Step 1: Viết test hỏng**

`lib/ui/cx.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins truthy class names with one space", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
    expect(cx()).toBe("");
  });
});
```

`components/ui/basics.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { Button, buttonClass } from "./Button";
import { Glass } from "./Glass";
import { IconButton } from "./IconButton";

describe("Glass", () => {
  it("is a glass card by default", () => {
    expect(renderToStaticMarkup(<Glass>x</Glass>)).toBe(
      '<div class="glass rounded-[28px]">x</div>',
    );
  });

  it("takes strong glass, a radius, a tag and extra props", () => {
    const html = renderToStaticMarkup(
      <Glass
        strong
        radius="sheet"
        as="section"
        className="p-4"
        aria-label="Khối"
      >
        x
      </Glass>,
    );
    expect(html).toBe(
      '<section aria-label="Khối" class="glass-strong rounded-[38px] p-4">x</section>',
    );
  });
});

describe("Button", () => {
  it("defaults to a large primary pill of type button", () => {
    const html = renderToStaticMarkup(<Button>Lưu</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain("bg-accent text-on-accent");
    expect(html).toContain("min-h-[50px]");
    expect(html).toContain("rounded-full");
    expect(html).toContain(">Lưu</button>");
  });

  it("supports every variant and the medium size", () => {
    expect(buttonClass({ variant: "secondary" })).toContain("glass text-ink");
    expect(buttonClass({ variant: "ghost" })).toContain("text-accent-text");
    expect(
      buttonClass({ variant: "danger", size: "md", block: true }),
    ).toContain("bg-danger-solid text-on-danger");
    expect(buttonClass({ size: "md" })).toContain("min-h-11");
    expect(buttonClass({ block: true })).toContain("w-full");
    expect(buttonClass()).not.toContain("w-full");
  });

  it("busy disables only this button and marks it busy", () => {
    const html = renderToStaticMarkup(
      <Button busy type="submit">
        Lưu
      </Button>,
    );
    expect(html).toContain('type="submit"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("opacity-60");
  });

  it("passes the click handler through", () => {
    const onClick = vi.fn();
    const element = Button({ onClick, children: "x" });
    (element.props as { onClick: () => void }).onClick();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("IconButton", () => {
  it("is a 44 pt round glass button named by its label", () => {
    const html = renderToStaticMarkup(
      <IconButton label="Khẩn cấp" icon="phone" />,
    );
    expect(html).toContain('aria-label="Khẩn cấp"');
    expect(html).toContain('type="button"');
    expect(html).toContain("size-11");
    expect(html).toContain("glass text-ink");
    expect(html).toContain(`d="${ICON_PATHS.phone}"`);
  });

  it("has a small 36 pt size, other variants and aria-pressed", () => {
    const html = renderToStaticMarkup(
      <IconButton
        label="Ban đêm"
        icon="moon"
        small
        filled
        variant="accent"
        aria-pressed
      />,
    );
    expect(html).toContain("size-9");
    expect(html).toContain("bg-accent text-on-accent");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('fill="currentColor"');
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test lib/ui/cx.test.ts components/ui/basics.test.tsx`
Expected: FAIL — `Cannot find module "./cx"` và `"./Button"`.

- [ ] **Step 3: Viết `lib/ui/cx.ts`**

```ts
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
```

- [ ] **Step 4: Viết `components/ui/testTree.ts`** (dùng cho test các task sau)

```ts
import { isValidElement, type ReactElement, type ReactNode } from "react";

export type TreeProps = Record<string, unknown> & { children?: ReactNode };

// Walks the elements a hook-free component returns and collects host elements of one tag.
// Child components (e.g. <Icon />) are not expanded.
export function hostElements(
  node: ReactNode,
  tag: string,
): ReactElement<TreeProps>[] {
  const found: ReactElement<TreeProps>[] = [];
  const visit = (n: ReactNode): void => {
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (!isValidElement<TreeProps>(n)) return;
    if (n.type === tag) found.push(n);
    visit(n.props.children);
  };
  visit(node);
  return found;
}
```

- [ ] **Step 5: Viết `components/ui/Glass.tsx`**

```tsx
import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "@/lib/ui/cx";

export type GlassRadius = "sheet" | "hero" | "card" | "tile" | "field";

const RADIUS: Record<GlassRadius, string> = {
  sheet: "rounded-[38px]",
  hero: "rounded-[32px]",
  card: "rounded-[28px]",
  tile: "rounded-[24px]",
  field: "rounded-[16px]",
};

export function Glass({
  strong = false,
  radius = "card",
  as = "div",
  className,
  children,
  ...rest
}: {
  strong?: boolean;
  radius?: GlassRadius;
  as?: "div" | "section" | "article" | "header" | "ul" | "li" | "nav" | "form";
  className?: string;
  children?: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  return createElement(
    as,
    {
      ...rest,
      className: cx(
        strong ? "glass-strong" : "glass",
        RADIUS[radius],
        className,
      ),
    },
    children,
  );
}
```

- [ ] **Step 6: Viết `components/ui/Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/ui/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent",
  secondary: "glass text-ink",
  ghost: "bg-transparent text-accent-text",
  danger: "bg-danger-solid text-on-danger",
};

const SIZE: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-[15px]",
  lg: "min-h-[50px] px-5 text-base",
};

// Also used to style <Link> as a button.
export function buttonClass({
  variant = "primary",
  size = "lg",
  block = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
} = {}): string {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-transform duration-[120ms] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    block && "w-full",
  );
}

export function Button({
  variant,
  size,
  block,
  busy = false,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  busy?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cx(
        buttonClass({ variant, size, block }),
        busy && "opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 7: Viết `components/ui/IconButton.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/ui/cx";
import type { IconName } from "@/lib/ui/icons";
import { Icon } from "./Icon";

export type IconButtonVariant = "glass" | "plain" | "accent" | "danger";

const VARIANT: Record<IconButtonVariant, string> = {
  glass: "glass text-ink",
  plain: "text-ink",
  accent: "bg-accent text-on-accent",
  danger: "glass text-danger",
};

export function IconButton({
  label,
  icon,
  variant = "glass",
  small = false,
  filled = false,
  type = "button",
  className,
  ...rest
}: {
  label: string;
  icon: IconName;
  variant?: IconButtonVariant;
  small?: boolean;
  filled?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children">) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50",
        small ? "size-9" : "size-11",
        VARIANT[variant],
        className,
      )}
    >
      <Icon name={icon} size={small ? 16 : 20} filled={filled} />
    </button>
  );
}
```

- [ ] **Step 8: Chạy test để thấy xanh**

Run: `bun run test lib/ui/cx.test.ts components/ui/basics.test.tsx lib/themeGuard.test.ts`
Expected: PASS (cx 1, Glass 2, Button 4, IconButton 2, themeGuard 1). Nếu chuỗi `toBe(...)` của `Glass` lệch thứ tự thuộc tính, kiểm lại thứ tự spread `{ ...rest, className }` như Step 5 (React in thuộc tính theo thứ tự khai báo).

- [ ] **Step 9: Commit**

```bash
git add lib/ui/cx.ts lib/ui/cx.test.ts components/ui/testTree.ts components/ui/Glass.tsx components/ui/Button.tsx components/ui/IconButton.tsx components/ui/basics.test.tsx
git commit -m "feat(ui): glass block, buttons and icon buttons"
```

---

### Task 2: `Segmented` và `ChipGroup`

**Files:**

- Create: `components/ui/Segmented.tsx`, `components/ui/ChipGroup.tsx`, `components/ui/choices.test.tsx`

**Interfaces:**

- Consumes: `cx` (Task 1), `hostElements` (Task 1).
- Produces: `ChoiceOption<T>`, `Segmented<T>`, `ChipGroup<T>` (chữ ký ở Contracts). Cả hai là nhóm `role="group"` có `aria-label`, mỗi lựa chọn là `<button type="button" aria-pressed>`.

- [ ] **Step 1: Viết test hỏng**

`components/ui/choices.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ChipGroup } from "./ChipGroup";
import { Segmented, type ChoiceOption } from "./Segmented";
import { hostElements } from "./testTree";

type Kind = "wet" | "dirty" | "both";
const KINDS: ChoiceOption<Kind>[] = [
  { value: "wet", label: "Ướt" },
  { value: "dirty", label: "Bẩn" },
  { value: "both", label: "Cả hai" },
];

describe("Segmented", () => {
  it("renders a labelled group with one pressed button", () => {
    const html = renderToStaticMarkup(
      <Segmented
        label="Loại tã"
        options={KINDS}
        value="both"
        onChange={() => {}}
      />,
    );
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Loại tã"');
    expect(html).toContain("grid-template-columns:repeat(3, minmax(0, 1fr))");
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
    expect(html).toContain("glass");
  });

  it("reports the chosen value", () => {
    const onChange = vi.fn();
    const buttons = hostElements(
      Segmented({ label: "Loại tã", options: KINDS, value: "wet", onChange }),
      "button",
    );
    expect(buttons.map((b) => b.props["aria-pressed"])).toEqual([
      true,
      false,
      false,
    ]);
    (buttons[2].props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith("both");
  });

  it("refuses fewer than 2 or more than 4 options", () => {
    expect(() =>
      Segmented({
        label: "x",
        options: KINDS.slice(0, 1),
        value: "wet",
        onChange: () => {},
      }),
    ).toThrow();
    const five = [
      ...KINDS,
      { value: "wet", label: "a" },
      { value: "dirty", label: "b" },
    ] as ChoiceOption<Kind>[];
    expect(() =>
      Segmented({
        label: "x",
        options: five,
        value: "wet",
        onChange: () => {},
      }),
    ).toThrow();
  });
});

describe("ChipGroup", () => {
  const TIMES: ChoiceOption<string>[] = [
    { value: "now", label: "Bây giờ" },
    { value: "5", label: "5 phút trước" },
    { value: "15", label: "15 phút trước" },
    { value: "pick", label: "Chọn giờ…" },
  ];

  it("scrolls sideways with a faded right edge and hides the scrollbar", () => {
    const html = renderToStaticMarkup(
      <ChipGroup
        label="Lúc nào?"
        options={TIMES}
        value="now"
        onChange={() => {}}
      />,
    );
    expect(html).toContain('aria-label="Lúc nào?"');
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("[scrollbar-width:none]");
    expect(html).toContain("bg-linear-to-l from-bg");
    expect(html).toContain("bg-ink font-semibold text-bg");
  });

  it("reports the chosen value", () => {
    const onChange = vi.fn();
    const buttons = hostElements(
      ChipGroup({ label: "Lúc nào?", options: TIMES, value: "now", onChange }),
      "button",
    );
    expect(buttons).toHaveLength(4);
    (buttons[3].props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith("pick");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/ui/choices.test.tsx`
Expected: FAIL — `Cannot find module "./ChipGroup"`.

- [ ] **Step 3: Viết `components/ui/Segmented.tsx`**

```tsx
import { cx } from "@/lib/ui/cx";

export type ChoiceOption<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  if (options.length < 2 || options.length > 4)
    throw new Error(`Segmented needs 2–4 options, got ${options.length}`);
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("glass grid gap-1 rounded-[22px] p-1", className)}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
            className={cx(
              "min-h-11 rounded-[18px] px-2 text-[15px] text-ink transition-colors",
              on
                ? "bg-glass-solid font-semibold shadow-[0_2px_8px_rgb(0_0_0/0.08)]"
                : "font-medium",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Viết `components/ui/ChipGroup.tsx`**

```tsx
import { cx } from "@/lib/ui/cx";
import type { ChoiceOption } from "./Segmented";

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div className={cx("relative -mx-4", className)}>
      <div
        role="group"
        aria-label={label}
        className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const on = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(option.value)}
              className={cx(
                "min-h-11 shrink-0 rounded-full px-4 text-[15px]",
                on
                  ? "bg-ink font-semibold text-bg"
                  : "glass font-medium text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-bg to-transparent"
      />
    </div>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/ui/choices.test.tsx lib/themeGuard.test.ts`
Expected: PASS (Segmented 3, ChipGroup 2, themeGuard 1).

- [ ] **Step 6: Commit**

```bash
git add components/ui/Segmented.tsx components/ui/ChipGroup.tsx components/ui/choices.test.tsx
git commit -m "feat(ui): segmented control and chip group"
```

---

### Task 3: `Switch` và `Swatch`

**Files:**

- Create: `components/ui/Switch.tsx`, `components/ui/Swatch.tsx`, `components/ui/toggles.test.tsx`

**Interfaces:**

- Consumes: `cx`, `hostElements` (Task 1); `STOOL_SWATCHES` từ `lib/ui/tokens.ts` (M2, chỉ trong test).
- Produces: `Switch`, `Swatch` (chữ ký ở Contracts).

- [ ] **Step 1: Viết test hỏng**

`components/ui/toggles.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { STOOL_SWATCHES } from "@/lib/ui/tokens";
import { Swatch } from "./Swatch";
import { Switch } from "./Switch";
import { hostElements } from "./testTree";

describe("Switch", () => {
  it("is an iOS-sized switch button with its state", () => {
    const on = renderToStaticMarkup(
      <Switch checked label="Nhắc cữ bú" onChange={() => {}} />,
    );
    expect(on).toContain('role="switch"');
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain('aria-label="Nhắc cữ bú"');
    expect(on).toContain("h-[31px] w-[51px]");
    expect(on).toContain("after:-inset-[7px]");
    expect(on).toContain("bg-switch-on");
    expect(on).toContain("left-[22px]");
    const off = renderToStaticMarkup(
      <Switch checked={false} label="x" onChange={() => {}} />,
    );
    expect(off).toContain('aria-checked="false"');
    expect(off).toContain("bg-muted/30");
    expect(off).toContain("left-[2px]");
  });

  it("asks for the opposite state when pressed", () => {
    const onChange = vi.fn();
    const [button] = hostElements(
      Switch({ checked: true, label: "x", onChange }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("can be disabled", () => {
    expect(
      renderToStaticMarkup(
        <Switch checked label="x" disabled onChange={() => {}} />,
      ),
    ).toContain('disabled=""');
  });
});

describe("Swatch", () => {
  it("paints the real colour and shows the label", () => {
    const html = renderToStaticMarkup(
      <Swatch
        color={STOOL_SWATCHES.yellow}
        label="Vàng"
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(html).toContain(`background:${STOOL_SWATCHES.yellow}`);
    expect(html).toContain(">Vàng</span>");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("size-11 rounded-full");
  });

  it("rings the selected swatch, dashes the empty one, outlines on request", () => {
    expect(
      renderToStaticMarkup(
        <Swatch
          color={STOOL_SWATCHES.black}
          label="Đen"
          selected
          outlined
          onSelect={() => {}}
        />,
      ),
    ).toContain("ring-2 ring-accent-text ring-offset-[3px] ring-offset-bg");
    expect(
      renderToStaticMarkup(
        <Swatch
          color={STOOL_SWATCHES.black}
          label="Đen"
          selected={false}
          outlined
          onSelect={() => {}}
        />,
      ),
    ).toContain("border border-muted");
    const none = renderToStaticMarkup(
      <Swatch color={null} label="Không ghi" selected onSelect={() => {}} />,
    );
    expect(none).toContain("border-2 border-dashed border-muted");
    expect(none).not.toContain("background:");
  });

  it("calls onSelect when pressed", () => {
    const onSelect = vi.fn();
    const [button] = hostElements(
      Swatch({ color: null, label: "x", selected: false, onSelect }),
      "button",
    );
    (button.props.onClick as () => void)();
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
```

Test dùng `STOOL_SWATCHES.black` (không viết mã hex trong `.tsx`) vì `lib/themeGuard.test.ts` quét cả file test trong `components/`.

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/ui/toggles.test.tsx`
Expected: FAIL — `Cannot find module "./Swatch"`.

- [ ] **Step 3: Viết `components/ui/Switch.tsx`**

```tsx
import { cx } from "@/lib/ui/cx";

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 after:absolute after:-inset-[7px] after:content-[''] disabled:opacity-50",
        checked ? "bg-switch-on" : "bg-muted/30",
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute top-[2px] size-[27px] rounded-full bg-glass-solid shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-[left] duration-200",
          checked ? "left-[22px]" : "left-[2px]",
        )}
      />
    </button>
  );
}
```

Núm dùng `bg-glass-solid` (Sáng trắng, Tối `#221F25`, Ban đêm `#160F0A`) để Ban đêm không có màu trắng.

- [ ] **Step 4: Viết `components/ui/Swatch.tsx`**

```tsx
import { cx } from "@/lib/ui/cx";

// `color` is a real colour from lib/ui/tokens.ts (STOOL_SWATCHES); null draws the "Không ghi" swatch.
export function Swatch({
  color,
  label,
  selected,
  onSelect,
  outlined = false,
}: {
  color: string | null;
  label: string;
  selected: boolean;
  onSelect: () => void;
  outlined?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="flex min-w-11 flex-col items-center gap-1.5 text-ink"
    >
      <span
        aria-hidden="true"
        className={cx(
          "size-11 rounded-full",
          color === null && "border-2 border-dashed border-muted",
          outlined && "border border-muted",
          selected &&
            "ring-2 ring-accent-text ring-offset-[3px] ring-offset-bg",
        )}
        style={color === null ? undefined : { background: color }}
      />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
```

- [ ] **Step 5: Chạy test để thấy xanh**

Run: `bun run test components/ui/toggles.test.tsx lib/themeGuard.test.ts`
Expected: PASS (Switch 3, Swatch 3, themeGuard 1).

- [ ] **Step 6: Commit**

```bash
git add components/ui/Switch.tsx components/ui/Swatch.tsx components/ui/toggles.test.tsx
git commit -m "feat(ui): iOS switch and colour swatch"
```

---

### Task 4: `ListGroup`/`ListRow`, `StatTile`, `Skeleton`

**Files:**

- Create: `components/ui/ListGroup.tsx`, `components/ui/StatTile.tsx`, `components/ui/Skeleton.tsx`, `components/ui/lists.test.tsx`
- Modify: `app/globals.css` (thêm keyframes `kb-pulse` ngay trước khối `@media (prefers-reduced-motion: reduce)`)
- Đọc trước: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` (`ListRow` dùng `next/link`).

**Interfaces:**

- Consumes: `cx`, `hostElements` (Task 1); `Glass` (Task 1); `Switch` (Task 3, chỉ trong test); `Icon`, `IconName`, `CategoryToken` (M2).
- Produces: `ListGroup`, `ListRow`, `ListRowIconColor`, `StatTile`, `StatTone`, `Skeleton` (chữ ký ở Contracts); keyframes `kb-pulse`.

- [ ] **Step 1: Viết test hỏng**

`components/ui/lists.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ICON_PATHS } from "@/lib/ui/icons";
import { ListGroup, ListRow } from "./ListGroup";
import { Skeleton } from "./Skeleton";
import { StatTile } from "./StatTile";
import { Switch } from "./Switch";
import { hostElements } from "./testTree";

describe("ListGroup", () => {
  it("is a glass list under an optional small uppercase title", () => {
    const html = renderToStaticMarkup(
      <ListGroup title="Gia đình">
        <ListRow label="Thành viên" />
      </ListGroup>,
    );
    expect(html).toContain(">Gia đình</h2>");
    expect(html).toContain("uppercase");
    expect(html).toContain('<ul class="glass overflow-hidden rounded-[22px]">');
    expect(renderToStaticMarkup(<ListGroup>x</ListGroup>)).not.toContain("<h2");
  });
});

describe("ListRow", () => {
  it("a link row has an icon chip, value and chevron", () => {
    const html = renderToStaticMarkup(
      <ListRow
        label="Thành viên"
        value="3 người"
        icon="users"
        iconColor="cat-sleep"
        href="/cai-dat/thanh-vien"
      />,
    );
    expect(html).toContain('href="/cai-dat/thanh-vien"');
    expect(html).toContain("bg-cat-sleep");
    expect(html).toContain("size-[30px]");
    expect(html).toContain(`d="${ICON_PATHS.users}"`);
    expect(html).toContain(">3 người</span>");
    expect(html).toContain(`d="${ICON_PATHS.chevronRight}"`);
    expect(html).toContain("min-h-[52px]");
  });

  it("a row with a switch shows no chevron and no link", () => {
    const html = renderToStaticMarkup(
      <ListRow
        label="Nhắc cữ bú"
        trailing={<Switch checked label="Nhắc cữ bú" onChange={() => {}} />}
      />,
    );
    expect(html).toContain('role="switch"');
    expect(html).not.toContain(ICON_PATHS.chevronRight);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('<button type="button" class="flex min-h');
  });

  it("an action row is a button with a detail line", () => {
    const onClick = vi.fn();
    const html = renderToStaticMarkup(
      <ListRow label="Tạm tắt nhắc" detail="Không" onClick={onClick} />,
    );
    expect(html).toContain(">Không</span>");
    expect(html).toContain(ICON_PATHS.chevronRight);
    const [button] = hostElements(ListRow({ label: "x", onClick }), "button");
    (button.props.onClick as () => void)();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("chevron can be turned off", () => {
    expect(
      renderToStaticMarkup(<ListRow label="x" href="/a" chevron={false} />),
    ).not.toContain(ICON_PATHS.chevronRight);
  });
});

describe("StatTile", () => {
  it("shows label, value with tabular numbers, and a toned note", () => {
    const html = renderToStaticMarkup(
      <StatTile label="Tã ướt" value="6" note="Đủ nước" tone="good" />,
    );
    expect(html).toContain("glass rounded-[24px]");
    expect(html).toContain(">Tã ướt</span>");
    expect(html).toContain("tabular-nums");
    expect(html).toContain(">6</span>");
    expect(html).toContain("text-good");
    expect(
      renderToStaticMarkup(<StatTile label="a" value="1" />),
    ).not.toContain("text-[11px]");
  });
});

describe("Skeleton", () => {
  it("is a hidden pulsing placeholder that stops with reduced motion", () => {
    const html = renderToStaticMarkup(<Skeleton className="h-20" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("animate-[kb-pulse_1.4s_ease-in-out_infinite]");
    expect(html).toContain("motion-reduce:animate-none");
    expect(html).toContain("bg-line");
    expect(html).toContain("h-20");
  });
});
```

- [ ] **Step 2: Chạy test để thấy hỏng**

Run: `bun run test components/ui/lists.test.tsx`
Expected: FAIL — `Cannot find module "./ListGroup"`.

- [ ] **Step 3: Viết `components/ui/ListGroup.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import type { CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import type { IconName } from "@/lib/ui/icons";
import { Icon } from "./Icon";

export type ListRowIconColor = CategoryToken | "muted" | "accent";

const CHIP_BG: Record<ListRowIconColor, string> = {
  "cat-feed": "bg-cat-feed",
  "cat-bottle": "bg-cat-bottle",
  "cat-sleep": "bg-cat-sleep",
  "cat-diaper": "bg-cat-diaper",
  "cat-pump": "bg-cat-pump",
  "cat-tummy": "bg-cat-tummy",
  "cat-med": "bg-cat-med",
  "cat-temp": "bg-cat-temp",
  muted: "bg-muted",
  accent: "bg-accent",
};

const ROW = "flex min-h-[52px] w-full items-center gap-3 px-4 py-1.5 text-left";

export function ListGroup({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("flex flex-col gap-2", className)}>
      {title && (
        <h2 className="mx-4 text-[13px] font-semibold tracking-[0.04em] text-muted uppercase">
          {title}
        </h2>
      )}
      <ul className="glass overflow-hidden rounded-[22px]">{children}</ul>
    </section>
  );
}

export function ListRow({
  label,
  detail,
  value,
  icon,
  iconColor = "muted",
  href,
  onClick,
  trailing,
  chevron = href !== undefined || onClick !== undefined,
}: {
  label: string;
  detail?: string;
  value?: string;
  icon?: IconName;
  iconColor?: ListRowIconColor;
  href?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  chevron?: boolean;
}) {
  const content = (
    <>
      {icon && (
        <span
          className={cx(
            "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] text-bg",
            CHIP_BG[iconColor],
          )}
        >
          <Icon name={icon} size={17} strokeWidth={2.2} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base text-ink">{label}</span>
        {detail && <span className="text-[13px] text-muted">{detail}</span>}
      </span>
      {value && <span className="text-[15px] text-muted">{value}</span>}
      {trailing}
      {chevron && <Icon name="chevronRight" size={16} className="text-muted" />}
    </>
  );
  return (
    <li className="border-b border-line last:border-b-0">
      {href !== undefined ? (
        <Link href={href} className={ROW}>
          {content}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={ROW}>
          {content}
        </button>
      ) : (
        <div className={ROW}>{content}</div>
      )}
    </li>
  );
}
```

- [ ] **Step 4: Viết `components/ui/StatTile.tsx`**

```tsx
import { cx } from "@/lib/ui/cx";
import { Glass } from "./Glass";

export type StatTone = "good" | "warn" | "danger" | "muted";

const TONE: Record<StatTone, string> = {
  good: "text-good",
  warn: "text-warn",
  danger: "text-danger",
  muted: "text-muted",
};

export function StatTile({
  label,
  value,
  note,
  tone = "muted",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: StatTone;
}) {
  return (
    <Glass radius="tile" className="flex flex-col gap-1 p-3.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-[22px] leading-7 font-bold text-ink tabular-nums">
        {value}
      </span>
      {note && (
        <span className={cx("text-[11px] font-semibold", TONE[tone])}>
          {note}
        </span>
      )}
    </Glass>
  );
}
```

- [ ] **Step 5: Viết `components/ui/Skeleton.tsx`**

```tsx
import { cx } from "@/lib/ui/cx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "animate-[kb-pulse_1.4s_ease-in-out_infinite] rounded-[16px] bg-line motion-reduce:animate-none",
        className,
      )}
    />
  );
}
```

- [ ] **Step 6: Thêm keyframes vào `app/globals.css`**

Chèn ngay trước dòng `@media (prefers-reduced-motion: reduce) {`:

```css
@keyframes kb-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
```

- [ ] **Step 7: Chạy test để thấy xanh**

Run: `bun run test components/ui/lists.test.tsx lib/themeGuard.test.ts lib/ui/tokens.test.ts`
Expected: PASS (ListGroup 1, ListRow 4, StatTile 1, Skeleton 1, themeGuard 1, tokens 4).

- [ ] **Step 8: Commit**

```bash
git add components/ui/ListGroup.tsx components/ui/StatTile.tsx components/ui/Skeleton.tsx components/ui/lists.test.tsx app/globals.css
git commit -m "feat(ui): grouped list rows, stat tile and skeleton"
```

---

## Kết thúc M4

- [ ] Chạy toàn bộ: `bun run test && bun run typecheck && bun run build`. Expected: mọi test xanh (439 test có sẵn cộng test mới của M4), typecheck không lỗi, build xong.
- [ ] Bước tiếp theo: làm plan M5 `docs/blueprint/plans/2026-11-14-kim-bun-ui-dot1-m5.md` (`Sheet`, `Toast`).
