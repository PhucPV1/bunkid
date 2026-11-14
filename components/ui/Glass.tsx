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
