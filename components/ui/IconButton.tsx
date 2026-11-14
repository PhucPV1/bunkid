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
  large = false,
  filled = false,
  type = "button",
  className,
  ...rest
}: {
  label: string;
  icon: IconName;
  variant?: IconButtonVariant;
  small?: boolean;
  large?: boolean;
  filled?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children">) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50",
        large ? "size-16" : small ? "size-9" : "size-11",
        VARIANT[variant],
        className,
      )}
    >
      <Icon name={icon} size={large ? 28 : small ? 16 : 20} filled={filled} />
    </button>
  );
}
