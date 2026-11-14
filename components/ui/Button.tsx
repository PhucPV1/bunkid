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
