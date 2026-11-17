import type { ReactNode } from "react";
import { cx } from "@/lib/ui/cx";

// A small accent pill pinned to a corner of the control it points at. The control
// needs `relative`; `className` places the pill (e.g. "-top-2 right-2").
export function HintBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "pointer-events-none absolute rounded-full bg-accent px-[7px] py-1 text-[11px] leading-[11px] font-bold whitespace-nowrap text-on-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
