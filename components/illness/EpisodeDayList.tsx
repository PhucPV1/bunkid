import { StatusChip } from "@/components/ui/StatusChip";
import type { DayRowView } from "@/lib/rules/illnessView";

// Spec 2026-11-26 §6.3 item 4: one row per day of the episode, newest first.
// The rows open nothing. The label sits beside the title only, so the line
// under it keeps the full width of the row.
export function EpisodeDayList({ rows }: { rows: DayRowView[] }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="mx-1 text-xl font-bold text-ink">Từng ngày</h2>
      <ul className="glass overflow-hidden rounded-[26px]">
        {rows.map((row) => (
          <li
            key={row.day}
            className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0"
          >
            <div className="flex items-start gap-2">
              <span className="flex-1 text-base font-semibold text-ink">
                {row.title}
              </span>
              {row.label && (
                <StatusChip tone={row.label.tone}>{row.label.text}</StatusChip>
              )}
            </div>
            <span className="text-[15px] text-ink">{row.detail}</span>
            {row.chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {row.chips.map((chip) => (
                  <StatusChip key={chip} tone="neutral">
                    {chip}
                  </StatusChip>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
