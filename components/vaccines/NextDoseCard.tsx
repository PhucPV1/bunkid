import { formatDueDate } from "@/lib/rules/vaccineForm";
import { nextDoseLabel, type ScheduleItem } from "@/lib/rules/vaccines";
import { cx } from "@/lib/ui/cx";

const LABEL =
  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] uppercase";

// Spec 2026-11-19 §7: the "cần làm trước" card. `today` is a Vietnam day.
export function NextDoseCard({
  item,
  today,
  onOpen,
}: {
  item: ScheduleItem;
  today: string;
  onOpen: (item: ScheduleItem) => void;
}) {
  const label = nextDoseLabel(item, today);
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cx(
        "glass flex w-full flex-col items-start gap-0.5 rounded-[28px] p-4 text-left",
        label.overdue && "border-warn!",
      )}
    >
      <span className={cx(LABEL, label.overdue ? "text-warn" : "text-muted")}>
        {label.text}
      </span>
      <span className="text-xl leading-[26px] font-bold text-ink">
        {item.dose.name}
      </span>
      <span className="text-[13px] leading-[18px] text-muted">
        Hẹn {formatDueDate(item.due)} ·{" "}
        {item.dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
      </span>
    </button>
  );
}
