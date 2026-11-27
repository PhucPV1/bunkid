import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { EpisodeTone } from "@/lib/rules/illness";
import type { VerdictView } from "@/lib/rules/illnessView";
import { cx } from "@/lib/ui/cx";

export type QuickLogType = "temperature" | "medicine" | "symptom";

const QUICK_LOGS: { type: QuickLogType; label: string }[] = [
  { type: "temperature", label: "Nhiệt độ" },
  { type: "medicine", label: "Thuốc" },
  { type: "symptom", label: "Triệu chứng" },
];

// Spec 2026-11-26 §6.3 and §7.1: the three quick logs of an open episode.
// A third of a card is about 98 px at 375 px, and "Triệu chứng" is 82 px wide
// at 14 px: hence the narrow padding and the smaller text.
export function QuickLogButtons({
  onLog,
}: {
  onLog: (type: QuickLogType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {QUICK_LOGS.map((item) => (
        <Button
          key={item.type}
          variant="secondary"
          size="md"
          className="px-1! text-sm!"
          onClick={() => onLog(item.type)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

// The round icon behind the verdict. The icon changes with the verdict too,
// so the states still differ in theme night, which has one hue.
const TONE: Record<EpisodeTone, string> = {
  good: "bg-good-soft text-good-ink",
  warn: "bg-warn-soft text-warn-ink",
  danger: "bg-danger-soft text-danger-ink",
  neutral: "bg-line text-ink",
};

// Spec §6.3 item 2: the verdict card of an episode's page.
export function EpisodeVerdict({
  view,
  onLog,
}: {
  view: VerdictView;
  onLog: (type: QuickLogType) => void;
}) {
  const { verdict } = view;
  return (
    <section className="glass flex flex-col gap-3.5 rounded-[26px] p-4">
      <div className="flex items-center gap-3">
        <span
          className={cx(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            TONE[verdict.tone],
          )}
        >
          <Icon name={verdict.icon} size={22} />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 className="text-xl leading-[26px] font-bold text-balance text-ink">
            {verdict.title}
          </h2>
          <span className="text-[13px] leading-[18px] text-muted">
            {view.sub}
          </span>
        </div>
      </div>
      <div className="flex flex-col border-t border-line">
        {view.rows.map((row) => (
          <div
            key={row.label}
            className="flex min-h-11 items-center gap-2 border-b border-line last:border-b-0"
          >
            <span className="flex-1 text-[15px] text-ink">{row.label}</span>
            {row.when && (
              <span className="text-[13px] whitespace-nowrap text-muted">
                {row.when}
              </span>
            )}
            <span className="text-base font-bold whitespace-nowrap text-ink tabular-nums">
              {row.value}
            </span>
          </div>
        ))}
      </div>
      {view.open && <QuickLogButtons onLog={onLog} />}
    </section>
  );
}
