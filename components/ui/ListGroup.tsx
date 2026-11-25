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

// Spec 2026-11-25 §4: a "Cần chú ý" row whose detail is a warning.
const DETAIL_TONE = {
  muted: "text-[13px] text-muted",
  warn: "text-[13px] font-semibold text-warn",
  danger: "text-[13px] font-semibold text-danger",
} as const;

export function ListRow({
  label,
  detail,
  detailTone = "muted",
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
  detailTone?: keyof typeof DETAIL_TONE;
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
        {detail && <span className={DETAIL_TONE[detailTone]}>{detail}</span>}
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
