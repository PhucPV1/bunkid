import { Fragment } from "react";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import type { IndicatorSummary, VerdictHead } from "@/lib/rules/growthView";
import { cx } from "@/lib/ui/cx";
import {
  PositionBar,
  StandardLabels,
  ZONE_NORMAL,
  ZONE_OFF,
} from "./PositionBar";

const SUB = "text-[13px] leading-[18px] text-muted";

// Spec 2026-11-25 §5.3 and §5.6: the verdict in words, one block per
// indicator, each with the norm in numbers under its bar.
export function GrowthVerdict({
  head,
  measured,
  summaries,
}: {
  // The heading (none with an alert) and the note about values near the edge.
  head: VerdictHead;
  // "Đo gần nhất {dd/mm} · {tuổi}".
  measured: string;
  summaries: IndicatorSummary[];
}) {
  return (
    <section className="glass flex flex-col gap-4 rounded-[26px] p-4">
      {head.heading ? (
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-good-soft text-good-ink">
            <Icon name="check" size={22} />
          </span>
          <div className="flex min-w-0 flex-col">
            <h2 className="text-xl leading-[26px] font-bold text-ink">
              {head.heading}
            </h2>
            <span className={SUB}>{measured}</span>
          </div>
        </div>
      ) : (
        <span className={SUB}>{measured}</span>
      )}
      {head.note && (
        <p className="rounded-2xl bg-warn-soft px-3 py-2.5 text-sm leading-5 text-warn-ink">
          {head.note.strong.map((sentence) => (
            <Fragment key={sentence}>
              <strong className="font-bold">{sentence}</strong>{" "}
            </Fragment>
          ))}
          {head.note.rest}
        </p>
      )}
      {summaries.map((item) => (
        <div key={item.indicator} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[15px] font-semibold text-ink">
              {item.title}
            </span>
            <span className="text-base font-bold text-ink tabular-nums">
              {item.value}
            </span>
            <StatusChip tone={item.chip.tone}>{item.chip.text}</StatusChip>
          </div>
          <PositionBar position={item.position} label={item.barLabel} />
          <StandardLabels standard={item.standard} near={item.near} />
          {item.nearLine && (
            <span className="text-[13px] leading-[18px] font-semibold text-warn">
              {item.nearLine}
            </span>
          )}
          {item.change && <span className={SUB}>{item.change}</span>}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-line pt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className={cx("w-3.5 rounded-full", ZONE_NORMAL)} />
          Bình thường
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cx("w-3.5 rounded-full", ZONE_OFF)} />
          Thấp hoặc cao hơn chuẩn
        </span>
      </div>
    </section>
  );
}
