import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import type { UsualView } from "@/lib/rules/illnessView";

// Spec 2026-11-26 §5.4 and §6.3 item 5 (board "Đợt ốm · A"): one day of the
// episode against the baby's usual days. Each chip says it in words, so the
// rows differ in theme night too. No advice; the card ends with the way to
// symptom triage.
export function EpisodeUsual({ view }: { view: UsualView }) {
  return (
    <section className="glass flex flex-col gap-1 rounded-[26px] px-4 pt-4 pb-1">
      <h2 className="text-base leading-[22px] font-bold text-ink">
        So với thường ngày
      </h2>
      {view.sub && (
        <p className="pb-1.5 text-[13px] leading-[18px] text-muted">
          {view.sub}
        </p>
      )}
      {view.message && (
        <p className="pb-2 text-[15px] text-muted">{view.message}</p>
      )}
      {view.rows.map((row) => (
        <div
          key={row.label}
          className="flex min-h-[52px] items-center gap-2.5 border-t border-line py-1.5"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold text-ink">
              {row.label}
            </span>
            <span className="text-[13px] leading-[18px] text-muted">
              {row.line}
            </span>
          </span>
          <StatusChip tone={row.chip.tone}>{row.chip.text}</StatusChip>
        </div>
      ))}
      <Link
        href="/trieu-chung"
        className="flex min-h-11 items-center gap-2 border-t border-line text-[15px] font-semibold text-accent-text"
      >
        <span className="flex-1">Phân loại triệu chứng</span>
        <Icon name="chevronRight" size={18} />
      </Link>
    </section>
  );
}
