import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatTile } from "@/components/ui/StatTile";
import type { HomeStatTile } from "@/lib/rules/summaryText";
import { cx } from "@/lib/ui/cx";
import { GROUP_LABEL } from "./sectionTitle";

// Spec 2026-11-19 §3.5: the tiles, then one sentence per yellow or red rating
// (in tile order), then the totals line when there is something to total.
export function StatsSection({
  tiles,
  totals,
}: {
  tiles: HomeStatTile[];
  totals: string | null;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className={GROUP_LABEL}>24 giờ qua</h2>
        <Link
          href="/thong-ke"
          className="inline-flex min-h-11 items-center gap-0.5 px-1 text-[13px] font-semibold text-accent-text"
        >
          Thống kê
          <Icon name="chevronRight" size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <StatTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            note={tile.note}
            tone={tile.tone}
          />
        ))}
      </div>
      {tiles.map(
        (tile) =>
          tile.explain && (
            <p
              key={tile.label}
              className={cx(
                "px-1 text-[13px] leading-[18px]",
                tile.tone === "danger" ? "text-danger" : "text-warn",
              )}
            >
              {tile.explain}
            </p>
          ),
      )}
      {totals && (
        <p className="px-1 text-[13px] leading-[18px] text-muted tabular-nums">
          {totals}
        </p>
      )}
    </section>
  );
}
