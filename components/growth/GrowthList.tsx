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
            className="flex min-h-[52px] w-full items-start gap-3 px-4 py-2.5 text-left disabled:opacity-100"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-ink tabular-nums">
                {title} <PendingMark pending={pending.has(row.id)} />
              </span>
              <span className="text-[15px] text-ink tabular-nums">
                {values}
              </span>
              {delta && (
                <span className="text-[13px] leading-[18px] text-muted">
                  {delta}
                </span>
              )}
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
          </button>
        </li>
      ))}
    </ListGroup>
  );
}
