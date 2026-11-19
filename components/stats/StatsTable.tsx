import { Glass } from "@/components/ui/Glass";
import type { DayStat, StatsTab } from "@/lib/rules/dailyStats";
import { vnDayLabel } from "@/lib/rules/days";
import { formatDuration } from "@/lib/rules/time";

export const STATS_COLUMNS: Record<
  StatsTab,
  { label: string; value: (s: DayStat) => string }[]
> = {
  sleep: [
    {
      label: "Giờ ngủ",
      value: (s) =>
        s.sleepMinutes === 0 ? "—" : formatDuration(s.sleepMinutes * 60_000),
    },
  ],
  feed: [
    { label: "Cữ bú", value: (s) => String(s.feeds) },
    { label: "Bình (ml)", value: (s) => String(s.bottleMl) },
  ],
  diaper: [
    { label: "Ướt", value: (s) => String(s.wetDiapers) },
    { label: "Bẩn", value: (s) => String(s.dirtyDiapers) },
  ],
  pump: [{ label: "Sữa hút (ml)", value: (s) => String(s.pumpMl) }],
  tummy: [
    {
      label: "Nằm sấp",
      value: (s) =>
        s.tummyMinutes === 0 ? "—" : formatDuration(s.tummyMinutes * 60_000),
    },
  ],
  solids: [
    { label: "Bữa ăn dặm", value: (s) => String(s.solidsMeals) },
    { label: "Nước (ml)", value: (s) => String(s.waterMl) },
  ],
};

export function StatsTable({
  stats,
  tab,
  now,
}: {
  stats: DayStat[];
  tab: StatsTab;
  now: Date;
}) {
  const columns = STATS_COLUMNS[tab];
  return (
    <Glass className="overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[13px] text-muted">
            <th className="px-4 py-2.5 font-medium">Ngày</th>
            {columns.map((column) => (
              <th
                key={column.label}
                className="px-4 py-2.5 text-right font-medium"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...stats].reverse().map((s) => (
            <tr key={s.day} className="border-t border-line">
              <td className="px-4 py-2.5 text-[15px] text-ink">
                {vnDayLabel(s.day, now)}
              </td>
              {columns.map((column) => (
                <td
                  key={column.label}
                  className="px-4 py-2.5 text-right text-[15px] text-ink tabular-nums"
                >
                  {column.value(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Glass>
  );
}
