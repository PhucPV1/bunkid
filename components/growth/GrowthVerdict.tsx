import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import type { IndicatorSummary } from "@/lib/rules/growthView";
import { PositionBar } from "./PositionBar";

const SUB = "text-[13px] leading-[18px] text-muted";

// Spec 2026-11-25 §5.3: the verdict in words, one block per indicator.
export function GrowthVerdict({
  babyName,
  measured,
  calm,
  summaries,
}: {
  babyName: string;
  // "Đo gần nhất {dd/mm} · {tuổi}".
  measured: string;
  // No alert: the card opens with the reassuring heading.
  calm: boolean;
  summaries: IndicatorSummary[];
}) {
  return (
    <section className="glass flex flex-col gap-4 rounded-[26px] p-4">
      {calm ? (
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-good-soft text-good-ink">
            <Icon name="check" size={22} />
          </span>
          <div className="flex min-w-0 flex-col">
            <h2 className="text-xl leading-[26px] font-bold text-ink">
              {babyName} đang lớn đều
            </h2>
            <span className={SUB}>{measured}</span>
          </div>
        </div>
      ) : (
        <span className={SUB}>{measured}</span>
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
          <PositionBar
            position={item.position}
            label={`${item.chip.text}. ${item.compare}`}
          />
          <span className={SUB}>
            {item.change ? `${item.compare} · ${item.change}` : item.compare}
          </span>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-line pt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3.5 rounded-full bg-good/35" />
          Bình thường
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3.5 rounded-full bg-warn/35" />
          Thấp hoặc cao hơn chuẩn
        </span>
      </div>
    </section>
  );
}
