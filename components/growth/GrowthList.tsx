import { PendingMark } from "@/components/sync/PendingMark";
import { ListGroup } from "@/components/ui/ListGroup";
import { StatusChip } from "@/components/ui/StatusChip";
import type { GrowthListItem } from "@/lib/rules/growthView";
import type { GrowthRow } from "@/lib/supabase/rows";

// Spec 2026-11-25 §5.5: the measurements as a glass list, each with its
// change since the one before and a status in words.
export function GrowthList({
  items,
  pending,
  canEdit,
  onOpen,
}: {
  items: GrowthListItem<GrowthRow>[];
  pending: Set<string>;
  canEdit: (row: GrowthRow) => boolean;
  onOpen: (row: GrowthRow) => void;
}) {
  return (
    <ListGroup title="Các lần đo">
      {items.map(({ row, title, values, delta, chip, outside }) => (
        <li key={row.id} className="border-b border-line last:border-b-0">
          <button
            type="button"
            disabled={!canEdit(row)}
            onClick={() => onOpen(row)}
            className="flex min-h-[52px] w-full flex-col gap-0.5 px-4 py-2.5 text-left disabled:opacity-100"
          >
            {/* The chip shares a line with the title only: beside the whole
                row it left the values too narrow at 375 px and they broke
                between a number and its unit. */}
            <span className="flex items-start gap-3">
              <span className="min-w-0 flex-1 text-base font-semibold text-ink tabular-nums">
                {title} <PendingMark pending={pending.has(row.id)} />
              </span>
              {chip ? (
                <StatusChip tone={chip.tone}>{chip.text}</StatusChip>
              ) : (
                outside && (
                  <span className="shrink-0 text-[13px] text-muted">
                    Ngoài bảng WHO
                  </span>
                )
              )}
            </span>
            <span className="text-[15px] text-ink tabular-nums">{values}</span>
            {delta && (
              <span className="text-[13px] leading-[18px] text-muted">
                {delta}
              </span>
            )}
          </button>
        </li>
      ))}
    </ListGroup>
  );
}
