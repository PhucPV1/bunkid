import { StatTile } from "@/components/ui/StatTile";
import type { HomeStatTile } from "@/lib/rules/summaryText";
import { SECTION_TITLE } from "./sectionTitle";

export function StatsSection({
  tiles,
  totals,
}: {
  tiles: HomeStatTile[];
  totals: string;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={SECTION_TITLE}>24 giờ qua</h2>
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
      <p className="px-1 text-[13px] leading-[18px] text-muted tabular-nums">
        {totals}
      </p>
    </section>
  );
}
