import Link from "next/link";
import type { NavItem } from "@/lib/nav";
import { CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { Icon } from "./Icon";

// The line a card shows from live data. `text: null` means there is nothing
// to show yet, so the card keeps its description.
export type LiveLine = { text: string | null; warn: boolean };

// Spec 2026-11-25 §3.4 and §3.5: a card of the Sức khỏe and Tiện ích pages.
export function NavCard({
  item,
  live,
  short = false,
}: {
  item: NavItem;
  live?: LiveLine;
  short?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cx(
        "glass flex flex-col gap-1.5 rounded-[26px] p-4 text-ink",
        short ? "min-h-28" : "min-h-32",
      )}
    >
      <span
        className={cx(
          "flex size-9 items-center justify-center rounded-full",
          CATEGORY_CHIP[item.color],
        )}
      >
        <Icon name={item.icon} size={18} strokeWidth={2.2} />
      </span>
      <span className="text-base font-bold">{item.label}</span>
      <span
        className={cx(
          "line-clamp-2 text-[13px] leading-[18px]",
          live?.warn ? "font-semibold text-warn" : "text-muted",
        )}
      >
        {live?.text ?? item.detail}
      </span>
    </Link>
  );
}
