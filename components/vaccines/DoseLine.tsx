import { formatDueDate } from "@/lib/rules/vaccineForm";
import type { ScheduleItem } from "@/lib/rules/vaccines";

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
      <span className="font-medium">{dose.name}</span>
      <span className="text-sm text-muted">
        {when} · {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
      </span>
      {item.unchosen && (
        <span className="rounded-full bg-soft px-2 text-sm">
          Chưa chọn loại
        </span>
      )}
      {item.pastMaxAge && (
        <span className="text-sm text-danger-ink">
          Đã quá tuổi khuyến cáo của loại vaccine này, hỏi bác sĩ.
        </span>
      )}
      {dose.note && item.state !== "done" && (
        <span className="text-sm text-muted">{dose.note}</span>
      )}
    </>
  );
}
