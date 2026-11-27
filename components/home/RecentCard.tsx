import Link from "next/link";
import { PendingMark } from "@/components/sync/PendingMark";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { describeLog } from "@/lib/rules/describeLog";
import { logTimeText } from "@/lib/rules/history";
import type { LogType } from "@/lib/rules/logDetails";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { SECTION_TITLE } from "./sectionTitle";

const MAX_ROWS = 6;

// Spec §7.1 step 10. `logs` arrive filtered (finished, last 24 hours) and newest first.
export function RecentCard({
  logs,
  now,
  nameOf,
  pending,
}: {
  logs: LogRow[];
  now: Date;
  nameOf: (userId: string) => string;
  pending: Set<string>;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className={SECTION_TITLE}>Gần đây</h2>
        <Link
          href="/nhat-ky"
          className="inline-flex min-h-11 items-center px-1 text-[15px] font-semibold text-accent-text"
        >
          Tất cả
        </Link>
      </div>
      {logs.length === 0 ? (
        <Glass className="p-4 text-[15px] text-muted">
          Chưa có ghi chép nào trong 24 giờ qua.
        </Glass>
      ) : (
        <Glass as="ul" className="overflow-hidden">
          {logs.slice(0, MAX_ROWS).map((log) => {
            const category = CATEGORIES[log.type as LogType];
            return (
              <li
                key={log.id}
                className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
              >
                {category && (
                  <span
                    className={cx(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      CATEGORY_CHIP[category.token],
                    )}
                  >
                    <Icon name={category.icon} size={17} strokeWidth={2.2} />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base font-medium text-ink">
                    {describeLog(log, now)}
                  </span>
                  <span className="text-[13px] leading-[18px] text-muted">
                    {nameOf(log.created_by)}{" "}
                    <PendingMark pending={pending.has(log.id)} />
                  </span>
                </span>
                <span className="text-[15px] font-semibold text-ink tabular-nums">
                  {logTimeText(log)}
                </span>
              </li>
            );
          })}
        </Glass>
      )}
    </section>
  );
}
