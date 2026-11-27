import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDayShort } from "@/lib/rules/days";
import type { DayRowView } from "@/lib/rules/illnessView";

// Spec 2026-11-26 §6.3 item 4: one row per day of the episode, newest first.
// The label sits beside the title only, so the line under it keeps the full
// width of the row. Spec 2026-11-27 §6.1 (board E): the row itself opens
// nothing; a small button after the symptom chips opens the day's symptom
// sheet: "Sửa" when the day has symptoms, else "Ghi triệu chứng".
export function EpisodeDayList({
  rows,
  onEdit,
}: {
  rows: DayRowView[];
  onEdit: (day: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="mx-1 text-xl font-bold text-ink">Từng ngày</h2>
      <ul className="glass overflow-hidden rounded-[26px]">
        {rows.map((row) => {
          const logged = row.chips.length > 0;
          return (
            <li
              key={row.day}
              className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <span className="flex-1 text-base font-semibold text-ink">
                  {row.title}
                </span>
                {row.label && (
                  <StatusChip tone={row.label.tone}>
                    {row.label.text}
                  </StatusChip>
                )}
              </div>
              <span className="text-[15px] text-ink">{row.detail}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {row.chips.map((chip) => (
                  <StatusChip key={chip} tone="neutral">
                    {chip}
                  </StatusChip>
                ))}
                <button
                  type="button"
                  aria-label={`${logged ? "Sửa" : "Ghi"} triệu chứng ngày ${formatDayShort(row.day)}`}
                  onClick={() => onEdit(row.day)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-accent-tint px-3 text-[13px] font-semibold text-accent-text"
                >
                  <Icon name={logged ? "pencil" : "plus"} size={14} />
                  {logged ? "Sửa" : "Ghi triệu chứng"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
