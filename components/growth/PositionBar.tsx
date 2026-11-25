import { cx } from "@/lib/ui/cx";

// Spec 2026-11-25 §5.3: where a measurement sits between z −3 and z +3. The
// middle two thirds (z −2 to +2) are the normal range.
//
// The two kinds of zone differ in height as well as in colour: the normal
// range is a 10 px pill, the two ends are 6 px tails. The Ban đêm theme gives
// good and warn the same colour, and colour alone is also lost on a
// colour-blind reader. GrowthVerdict draws its legend with the same classes.
export const ZONE_NORMAL = "h-2.5 bg-good/45";
export const ZONE_OFF = "h-1.5 bg-warn/35";

export function PositionBar({
  position,
  label,
}: {
  // 0–100, from gaugePosition.
  position: number;
  label: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className="relative my-[5px] flex h-2.5 items-center"
    >
      <span className={cx("w-[16.7%] rounded-l-full", ZONE_OFF)} />
      <span className={cx("flex-1 rounded-full", ZONE_NORMAL)} />
      <span className={cx("w-[16.7%] rounded-r-full", ZONE_OFF)} />
      <span
        className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-glass-solid bg-ink"
        style={{ left: `${position}%` }}
      />
    </span>
  );
}
