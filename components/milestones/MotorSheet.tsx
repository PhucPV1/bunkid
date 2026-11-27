"use client";

import { PendingMark } from "@/components/sync/PendingMark";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import type { MotorMilestone } from "@/lib/content/milestones";
import {
  motorBar,
  motorRange,
  motorStatus,
  type MotorState,
} from "@/lib/rules/milestones";
import type { MilestoneRow } from "@/lib/supabase/rows";
import { cx } from "@/lib/ui/cx";

const CHIP: Record<MotorState, string> = {
  done: "bg-good-soft text-good-ink",
  window: "bg-accent-tint text-accent-text",
  early: "bg-ink/7 text-ink",
  late: "bg-warn-soft text-warn-ink",
};

const BAR: Record<MotorState, string> = {
  done: "bg-good",
  window: "bg-accent",
  early: "bg-muted/45",
  late: "bg-warn",
};

type BodyProps = {
  motor: readonly MotorMilestone[];
  ageMonths: number;
  ageText: string;
  babyName: string;
  byCode: ReadonlyMap<string, MilestoneRow>;
  pending: ReadonlySet<string>;
  canEdit: (row: MilestoneRow | undefined) => boolean;
  onPick: (code: string, title: string) => void;
};

// Spec 2026-11-27 §4.4: the seven WHO motor milestones with their age windows.
// Hook-free, so tests can walk the tree.
export function MotorSheetBody({
  motor,
  ageMonths,
  ageText,
  babyName,
  byCode,
  pending,
  canEdit,
  onPick,
}: BodyProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-[13px] text-muted">
        <span aria-hidden="true" className="h-3.5 w-0.5 rounded bg-ink" />
        {babyName} hôm nay: {ageText}
      </p>
      <ul className="glass overflow-hidden rounded-[22px]">
        {motor.map((m) => {
          const row = byCode.get(m.code);
          const { state } = motorStatus(m, ageMonths, row !== undefined);
          const bar = motorBar(m, ageMonths);
          const chip =
            row !== undefined
              ? `Đạt ${row.achieved_on.split("-").reverse().join("/")}`
              : motorStatus(m, ageMonths, false).text;
          return (
            <li key={m.code} className="border-b border-line">
              <button
                type="button"
                disabled={!canEdit(row)}
                onClick={() => onPick(m.code, m.name)}
                className="flex min-h-[60px] w-full flex-col gap-2 px-4 py-3 text-left disabled:opacity-100"
              >
                <span className="flex w-full items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex size-[22px] shrink-0 items-center justify-center rounded-full",
                      row ? "bg-good text-bg" : "border-2 border-muted/50",
                    )}
                  >
                    {row && <Icon name="check" size={13} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1 text-base text-ink">
                    {m.name} <PendingMark pending={pending.has(m.code)} />
                  </span>
                  <span
                    className={cx(
                      "shrink-0 rounded-full px-2.5 text-[13px] leading-[22px] font-semibold whitespace-nowrap",
                      CHIP[state],
                    )}
                  >
                    {chip}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="relative h-2.5 w-full rounded-full bg-ink/7"
                >
                  <span
                    className={cx(
                      "absolute inset-y-0 rounded-full",
                      BAR[state],
                    )}
                    style={{ left: bar.left, width: bar.width }}
                  />
                  <span
                    className="absolute -top-1 -bottom-1 -ml-px w-0.5 rounded bg-ink"
                    style={{ left: bar.today }}
                  />
                </span>
                <span className="sr-only">{motorRange(m)}</span>
              </button>
            </li>
          );
        })}
        <li
          aria-hidden="true"
          className="flex justify-between px-4 pt-2 pb-3 text-[13px] text-muted"
        >
          <span>0</span>
          <span>6</span>
          <span>12</span>
          <span>18 tháng</span>
        </li>
      </ul>
      <p className="px-1 text-[13px] text-muted">
        Thanh màu là khoảng tuổi bé thường làm được. Bấm một mốc để ghi ngày
        đạt.
      </p>
    </div>
  );
}

export function MotorSheet({
  onClose,
  ...body
}: BodyProps & { onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title="Vận động lớn">
      <MotorSheetBody {...body} />
    </Sheet>
  );
}
