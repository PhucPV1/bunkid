import { PendingMark } from "@/components/sync/PendingMark";
import { formatDueDate } from "@/lib/rules/vaccineForm";
import type { ScheduleItem } from "@/lib/rules/vaccines";

export function DoseLine({
  item,
  pending,
}: {
  item: ScheduleItem;
  pending: boolean;
}) {
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
      <span className="text-base font-medium text-ink">
        {dose.name} <PendingMark pending={pending} />
      </span>
      <span className="text-[13px] text-muted tabular-nums">
        {when} · {dose.program === "tcmr" ? "Tiêm chủng mở rộng" : "Dịch vụ"}
      </span>
      {item.unchosen && (
        <span className="mt-0.5 rounded-full bg-muted/15 px-2 text-[13px] text-ink">
          Chưa chọn loại
        </span>
      )}
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
