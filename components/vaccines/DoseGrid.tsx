import { PendingMark } from "@/components/sync/PendingMark";
import { Icon } from "@/components/ui/Icon";
import type { VaccineGroup } from "@/lib/content/vaccineSchema";
import { formatDayFull } from "@/lib/rules/days";
import { doseKey } from "@/lib/rules/vaccineForm";
import { doseCell, vaccineGrid, type DoseTone } from "@/lib/rules/vaccineGrid";
import type { ScheduleItem } from "@/lib/rules/vaccines";
import { cx } from "@/lib/ui/cx";

const TONE: Record<DoseTone, string> = {
  done: "bg-good-soft text-good-ink",
  skipped: "bg-muted/10 text-muted",
  late: "bg-danger-soft text-danger-ink",
  soon: "bg-warn-soft text-warn-ink",
  open: "bg-muted/10 text-ink",
};

const LEGEND = [
  { swatch: "bg-good-soft", text: "Đã tiêm" },
  { swatch: "bg-danger-soft", text: "Trễ hẹn" },
  { swatch: "bg-warn-soft", text: "Sắp tới" },
  { swatch: "bg-muted/10", text: "Chưa tiêm" },
];

const HEAD = "text-[13px] leading-[18px] font-semibold text-muted";
const LABEL_COLUMN =
  "sticky left-0 z-10 bg-glass-solid w-[108px] min-w-[108px]";

// Spec 2026-11-19 §7.2: vaccines × dose numbers. `onChoose` is given to the
// family owner only; without it an unchosen group is plain text.
export function DoseGrid({
  items,
  groups,
  pending,
  onOpen,
  onChoose,
}: {
  items: ScheduleItem[];
  groups: VaccineGroup[];
  pending: Set<string>;
  onOpen: (item: ScheduleItem) => void;
  onChoose?: () => void;
}) {
  const { columns, rows } = vaccineGrid(items, groups);
  const doseColumns = Array.from({ length: columns }, (_, i) => i + 1);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="glass relative overflow-hidden rounded-[22px]">
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0">
            <thead>
              <tr>
                <th
                  scope="col"
                  className={cx(LABEL_COLUMN, "px-3 py-2 text-left", HEAD)}
                >
                  Vắc xin
                </th>
                {doseColumns.map((n) => (
                  <th
                    key={n}
                    scope="col"
                    className={cx(
                      "w-[78px] min-w-[78px] px-1 py-2 text-center",
                      HEAD,
                    )}
                  >
                    Mũi {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.kind}:${row.key}`}>
                  <th
                    scope="row"
                    className={cx(LABEL_COLUMN, "px-3 py-1 text-left")}
                  >
                    <span className="line-clamp-3 text-[13px] leading-[18px] font-medium text-ink">
                      {row.label}
                    </span>
                  </th>
                  {row.kind === "unchosen" ? (
                    <td colSpan={columns} className="p-1">
                      {onChoose ? (
                        <button
                          type="button"
                          onClick={onChoose}
                          className="flex min-h-14 w-full items-center justify-center gap-1 rounded-[14px] border border-dashed border-muted px-3 text-[13px] leading-[18px] font-semibold whitespace-nowrap text-ink"
                        >
                          Chưa chọn loại
                          <Icon name="chevronRight" size={16} />
                        </button>
                      ) : (
                        <span className="block px-2 text-[13px] leading-[18px] whitespace-nowrap text-muted">
                          Chưa chọn loại
                        </span>
                      )}
                    </td>
                  ) : (
                    row.cells.map((item, i) =>
                      item ? (
                        <td key={i} className="p-1">
                          {doseButton(
                            item,
                            pending.has(
                              doseKey(item.dose.code, item.dose.doseNo),
                            ),
                            onOpen,
                          )}
                        </td>
                      ) : (
                        <td key={i} className="p-1"></td>
                      ),
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {columns > 3 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-glass-solid to-transparent"
          />
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[12px] leading-4 text-muted">
        {LEGEND.map((entry) => (
          <li key={entry.text} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cx("size-2.5 rounded-[3px]", entry.swatch)}
            ></span>
            {entry.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

// A plain function, not a component, so the button stays in DoseGrid's tree.
function doseButton(
  item: ScheduleItem,
  pending: boolean,
  onOpen: (item: ScheduleItem) => void,
) {
  const { label, date, tone } = doseCell(item);
  const day = date ? formatDayFull(date) : null;
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`${item.dose.name}: ${label}${day ? ` ${day}` : ""}`}
      className={cx(
        "relative mx-auto flex w-[70px] min-h-14 flex-col items-center justify-center rounded-[14px] px-1 py-1.5",
        TONE[tone],
      )}
    >
      <span className="flex items-center gap-0.5 text-[13px] leading-[18px] font-semibold whitespace-nowrap">
        {tone === "done" && <Icon name="check" size={12} strokeWidth={3} />}
        {label}
      </span>
      {day && <span className="text-[12px] leading-4 tabular-nums">{day}</span>}
      {pending && (
        <span className="absolute top-0.5 right-0.5">
          <PendingMark pending />
        </span>
      )}
    </button>
  );
}
