import { PendingMark } from "@/components/sync/PendingMark";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import {
  type DayPeriodKey,
  type OpenDayPeriod,
  type OpenPeriodDay,
  periodListId,
} from "@/lib/rules/dayPeriods";
import { vnDayLabel } from "@/lib/rules/days";
import { describeLog } from "@/lib/rules/describeLog";
import { logTimeText } from "@/lib/rules/history";
import type { LogType } from "@/lib/rules/logDetails";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

type RowProps = {
  now: Date;
  nameOf: (userId: string) => string;
  pending: Set<string>;
  onOpen: (log: LogRow) => void;
};

// One log as a tappable row. A plain function, not a component, so tests that
// walk the returned tree see its button.
function logRow(log: LogRow, { now, nameOf, pending, onOpen }: RowProps) {
  const category = CATEGORIES[log.type as LogType];
  return (
    <button
      type="button"
      onClick={() => onOpen(log)}
      className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left"
    >
      {category && (
        <span
          className={cx(
            "flex size-[34px] shrink-0 items-center justify-center rounded-full",
            CATEGORY_CHIP[category.token],
          )}
        >
          <Icon name={category.icon} size={18} strokeWidth={2.2} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-medium text-ink">
          {describeLog(log, now)} <PendingMark pending={pending.has(log.id)} />
        </span>
        {log.note && (
          <span className="truncate text-[13px] text-muted">{log.note}</span>
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="text-[15px] font-semibold text-ink tabular-nums">
          {logTimeText(log)}
        </span>
        <span className="text-xs text-muted">{nameOf(log.created_by)}</span>
      </span>
    </button>
  );
}

const PERIOD_ROW = "flex min-h-[52px] w-full items-center gap-2.5 px-4 py-2";
const PERIOD_LABEL = "shrink-0 whitespace-nowrap text-base font-bold";
const PERIOD_SUMMARY =
  "min-w-0 flex-1 text-right text-[13px] text-muted tabular-nums";

// Spec 2026-11-27 (Nhật ký theo buổi) §4.1–§4.3: one period of a day.
function periodItem(
  day: string,
  period: OpenDayPeriod<LogRow>,
  row: RowProps,
  onToggle: (day: string, key: DayPeriodKey, open: boolean) => void,
) {
  if (period.kind !== "logs")
    return (
      <li
        key={period.key}
        className={cx(PERIOD_ROW, "border-b border-line last:border-b-0")}
      >
        <span
          className={cx(
            PERIOD_LABEL,
            period.kind === "empty" ? "text-muted" : "text-ink",
          )}
        >
          {period.label}
        </span>
        <span className={PERIOD_SUMMARY}>
          {period.kind === "empty" ? "Không có bản ghi" : period.summary}
        </span>
      </li>
    );
  const id = periodListId(day, period.key);
  return (
    <li key={period.key} className="border-b border-line last:border-b-0">
      <button
        type="button"
        aria-expanded={period.open}
        aria-controls={period.open ? id : undefined}
        onClick={() => onToggle(day, period.key, !period.open)}
        // At night bg-line at full strength leaves the muted summary under
        // 4.5:1; 70% of it keeps 4.58:1 on glass over the page background.
        className={cx(
          PERIOD_ROW,
          "bg-line text-left in-data-[theme=night]:bg-line/70",
        )}
      >
        <span className={cx(PERIOD_LABEL, "text-ink")}>{period.label}</span>
        <span className={PERIOD_SUMMARY}>{period.summary}</span>
        {!period.open && (
          <PendingMark
            pending={period.logs.some((log) => row.pending.has(log.id))}
          />
        )}
        <Icon
          name={period.open ? "chevronUp" : "chevronDown"}
          size={18}
          className="shrink-0"
        />
      </button>
      {period.open && (
        <ul id={id}>
          {period.logs.map((log) => (
            <li key={log.id} className="border-t border-line">
              {logRow(log, row)}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// Spec §9 Nhật ký: one glass list per VN day; spec 2026-11-27 (Nhật ký theo
// buổi): the day's symptom rows, then its periods.
export function HistoryList({
  groups,
  now,
  nameOf,
  pending,
  onOpen,
  onToggle,
}: {
  groups: OpenPeriodDay<LogRow>[];
  now: Date;
  nameOf: (userId: string) => string;
  pending: Set<string>;
  onOpen: (log: LogRow) => void;
  onToggle: (day: string, key: DayPeriodKey, open: boolean) => void;
}) {
  const row: RowProps = { now, nameOf, pending, onOpen };
  return (
    <>
      {groups.map((group) => (
        // Days below the screen skip layout and paint until scrolled near.
        <section
          key={group.day}
          className="flex flex-col gap-2.5 [contain-intrinsic-size:auto_1400px] [content-visibility:auto]"
        >
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-xl leading-[26px] font-bold text-ink">
              {vnDayLabel(group.day, now)}
            </h2>
            <span className="text-[13px] text-muted tabular-nums">
              {group.summary}
            </span>
          </div>
          <Glass as="ul" className="overflow-hidden">
            {group.symptoms.map((log) => (
              <li key={log.id} className="border-b border-line last:border-b-0">
                {logRow(log, row)}
              </li>
            ))}
            {group.periods.map((period) =>
              periodItem(group.day, period, row, onToggle),
            )}
          </Glass>
        </section>
      ))}
    </>
  );
}
