import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import type { HabitKey, HabitRow } from "@/lib/rules/habits";
import { CATEGORY_CHIP, type CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import type { IconName } from "@/lib/ui/icons";

const LOOK: Record<
  HabitKey,
  { icon: IconName; token: CategoryToken; bar: string }
> = {
  sleep: { icon: "moon", token: "cat-sleep", bar: "bg-cat-sleep" },
  tummy: { icon: "smile", token: "cat-tummy", bar: "bg-cat-tummy" },
  vitaminD: { icon: "sun", token: "cat-med", bar: "bg-cat-med" },
};

// Spec 2026-11-25 §7.1: sleep, tummy time and vitamin D over the seven days
// before today, each against its norm.
export function HabitsCard({ rows }: { rows: HabitRow[] }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="mx-1 text-xl leading-[26px] font-bold text-ink">
        Thói quen 7 ngày qua
      </h2>
      <ul className="glass overflow-hidden rounded-[26px]">
        {rows.map((row) => {
          const look = LOOK[row.key];
          return (
            <li
              key={row.key}
              className="flex flex-col gap-2.5 border-b border-line px-4 py-3.5 last:border-b-0"
            >
              <span className="flex items-start gap-3">
                <span
                  className={cx(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    CATEGORY_CHIP[look.token],
                  )}
                >
                  <Icon name={look.icon} size={18} strokeWidth={2.2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {/* The chip shares a line with the name only: beside the
                      value line it would leave that line about 116 px at
                      375 px wide. */}
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-base font-bold text-ink">
                      {row.title}
                    </span>
                    {row.chip && (
                      <StatusChip tone={row.chip.tone}>
                        {row.chip.text}
                      </StatusChip>
                    )}
                  </span>
                  <span className="text-[13px] leading-[18px] text-muted">
                    {row.line}
                  </span>
                </span>
              </span>
              {row.progress !== null && (
                <span
                  aria-hidden
                  className="block h-1.5 overflow-hidden rounded-full bg-line"
                >
                  <span
                    className={cx("block h-full rounded-full", look.bar)}
                    style={{ width: `${row.progress * 100}%` }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {/* The source of the tummy-time norm is named only while that row is
          shown, in the baby's first year. It wraps as a whole: at 375 and
          390 px the note is a few px too long for one line, and "2019."
          would drop onto a line of its own. */}
      <p className="px-1 text-[13px] leading-[18px] text-muted">
        Chuẩn giấc ngủ như trang Thống kê.
        {rows.some((row) => row.key === "tummy") && (
          <>
            {" "}
            <span className="whitespace-nowrap">Nằm sấp: WHO 2019.</span>
          </>
        )}
      </p>
    </section>
  );
}
