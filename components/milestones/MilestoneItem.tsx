import type { ReactNode } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { Icon } from "@/components/ui/Icon";
import type { MilestoneRow } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";

// One milestone row inside a ListGroup (spec §9 Phát triển). The check is an icon, not "✓".
export function MilestoneItem({
  title,
  row,
  pending,
  disabled,
  extra,
  onOpen,
}: {
  title: string;
  row: MilestoneRow | undefined;
  pending: boolean;
  disabled: boolean;
  extra?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        className="flex min-h-[52px] w-full items-start gap-3 px-4 py-2.5 text-left disabled:opacity-100"
      >
        <span
          aria-hidden="true"
          className={cx(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
            row ? "bg-good text-bg" : "border-2 border-muted/50",
          )}
        >
          {row && <Icon name="check" size={14} strokeWidth={3} />}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-base text-ink">
            {title} <PendingMark pending={pending} />
          </span>
          {row && (
            <span className="text-[13px] text-muted tabular-nums">
              Đạt ngày {row.achieved_on.split("-").reverse().join("/")}
              {row.note ? ` · ${row.note}` : ""}
              {row.photo_id ? " · có ảnh" : ""}
            </span>
          )}
          {extra}
        </span>
      </button>
    </li>
  );
}
