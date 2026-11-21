import { formatDueDate } from "@/lib/rules/vaccineForm";
import type { ScheduleItem } from "@/lib/rules/vaccines";

// Spec 2026-11-19 §7.3: the facts of one dose at the top of DoseSheet. The
// sheet title carries the name and the table carries the pending mark.
export function DoseLine({ item }: { item: ScheduleItem }) {
  const { dose, record } = item;
  const when =
    item.state === "done"
      ? record?.given_on
        ? `Đã tiêm ${formatDueDate(record.given_on)}`
        : "Đã tiêm"
      : item.state === "skipped"
        ? "Đã bỏ qua"
        : `Hẹn ${formatDueDate(item.due)}`;
  return (
    <>
      <span className="text-[13px] text-muted tabular-nums">
        {when} · {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
      </span>
      {item.pastMaxAge && (
        <span className="text-[13px] text-danger">
          Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ.
        </span>
      )}
      {dose.note && item.state !== "done" && (
        <span className="text-[13px] text-muted">{dose.note}</span>
      )}
    </>
  );
}
