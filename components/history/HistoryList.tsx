import { PendingMark } from "@/components/sync/PendingMark";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { vnDayLabel } from "@/lib/rules/days";
import { describeLog } from "@/lib/rules/describeLog";
import { logTimeText } from "@/lib/rules/history";
import type { LogType } from "@/lib/rules/logDetails";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

// Spec §9 Nhật ký: one glass list per VN day.
export function HistoryList({
  groups,
  now,
  nameOf,
  pending,
  onOpen,
}: {
  groups: { day: string; summary: string; logs: LogRow[] }[];
  now: Date;
  nameOf: (userId: string) => string;
  pending: Set<string>;
  onOpen: (log: LogRow) => void;
}) {
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
            {group.logs.map((log) => {
              const category = CATEGORIES[log.type as LogType];
              return (
                <li
                  key={log.id}
                  className="border-b border-line last:border-b-0"
                >
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
                        <Icon
                          name={category.icon}
                          size={18}
                          strokeWidth={2.2}
                        />
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-base font-medium text-ink">
                        {describeLog(log, now)}{" "}
                        <PendingMark pending={pending.has(log.id)} />
                      </span>
                      {log.note && (
                        <span className="truncate text-[13px] text-muted">
                          {log.note}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="text-[15px] font-semibold text-ink tabular-nums">
                        {logTimeText(log)}
                      </span>
                      <span className="text-xs text-muted">
                        {nameOf(log.created_by)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </Glass>
        </section>
      ))}
    </>
  );
}
