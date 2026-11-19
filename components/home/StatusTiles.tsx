import { Glass } from "@/components/ui/Glass";
import type { StatusTile } from "@/lib/rules/status";
import { cx } from "@/lib/ui/cx";

const TONE: Record<StatusTile["tone"], string> = {
  good: "text-good",
  warn: "text-warn",
  muted: "text-muted",
};

// Spec 2026-11-19 §3.3: next feed, last feed and last diaper, then the time of
// today's Vitamin D once it is logged. Only a late feed has the warn tone.
export function StatusTiles({
  tiles,
  vitaminD,
}: {
  tiles: StatusTile[];
  vitaminD: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <Glass
            key={tile.label}
            radius="tile"
            className={cx(
              "flex flex-col px-3 py-2.5",
              tile.tone === "warn" && "border-warn!",
            )}
          >
            <span className="text-xs leading-4 whitespace-nowrap text-muted">
              {tile.label}
            </span>
            <span className="text-xl leading-[26px] font-bold whitespace-nowrap text-ink tabular-nums">
              {tile.value}
            </span>
            <span
              className={cx(
                "text-xs leading-4 font-semibold whitespace-nowrap",
                TONE[tile.tone],
              )}
            >
              {tile.note}
            </span>
          </Glass>
        ))}
      </div>
      {vitaminD && (
        <p className="px-1 text-[13px] leading-[18px] text-muted">
          Vitamin D đã uống {vitaminD}
        </p>
      )}
    </div>
  );
}
