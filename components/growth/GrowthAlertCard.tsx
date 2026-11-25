import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { GrowthAlert, GrowthAlertLevel } from "@/lib/rules/growthAlerts";
import { cx } from "@/lib/ui/cx";

const TONE: Record<GrowthAlertLevel, { card: string; solid: string }> = {
  yellow: {
    card: "border-warn/35 bg-warn-soft text-warn-ink",
    solid: "bg-warn text-bg",
  },
  red: {
    card: "border-danger/35 bg-danger-soft text-danger-ink",
    solid: "bg-danger-solid text-on-danger",
  },
};

// Spec 2026-11-25 §5.3: one growth alert at the top of the page.
export function GrowthAlertCard({
  alert,
  onWhy,
}: {
  alert: GrowthAlert;
  onWhy: () => void;
}) {
  const tone = TONE[alert.level];
  return (
    <section
      aria-label={alert.title}
      className={cx("flex flex-col gap-3 rounded-[26px] border p-4", tone.card)}
    >
      <div className="flex items-start gap-3">
        <span
          className={cx(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            tone.solid,
          )}
        >
          <Icon name="alert" size={22} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xl leading-[26px] font-bold">{alert.title}</h2>
          <p className="text-[15px] leading-5">{alert.body}</p>
        </div>
      </div>
      <p className="text-[15px] leading-5 font-bold">{alert.advice}</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/bao-cao"
          className={cx(
            "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
            tone.solid,
          )}
        >
          Báo cáo cho bác sĩ
        </Link>
        <button
          type="button"
          onClick={onWhy}
          className="min-h-11 rounded-full px-3.5 text-sm font-semibold underline"
        >
          Vì sao có cảnh báo này?
        </button>
      </div>
    </section>
  );
}
