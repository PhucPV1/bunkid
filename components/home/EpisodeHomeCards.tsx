import Link from "next/link";
import {
  QuickLogButtons,
  type QuickLogType,
  TONE_CIRCLE,
} from "@/components/illness/EpisodeVerdict";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type {
  CloseReminderView,
  HomeEpisodeView,
} from "@/lib/rules/illnessView";
import { CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

const CARD = "glass flex flex-col rounded-[26px] p-4";

// Spec 2026-11-26 §7.1 (board "Hôm nay · C"): the open episode on the home
// page. The top row leads to its page; the three quick logs are those of the
// verdict card.
export function EpisodeCard({
  view,
  onLog,
}: {
  view: HomeEpisodeView;
  onLog: (type: QuickLogType) => void;
}) {
  return (
    <section className={cx(CARD, "gap-3.5")}>
      <Link
        href={view.href}
        className="flex min-h-11 items-center gap-3 text-ink"
      >
        <span
          className={cx(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            CATEGORY_CHIP["cat-temp"],
          )}
        >
          <Icon name="thermo" size={22} strokeWidth={2.2} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-base leading-[22px] font-bold">
            {view.title}
          </span>
          {view.sub && (
            <span className="text-[13px] leading-[18px] text-muted">
              {view.sub}
            </span>
          )}
        </span>
        <Icon name="chevronRight" size={18} className="shrink-0 text-muted" />
      </Link>
      <QuickLogButtons onLog={onLog} />
    </section>
  );
}

// Spec §7.3: the reminder to close the open episode, right under its card.
export function CloseReminder({
  view,
  busy,
  onClose,
  onSnooze,
}: {
  view: CloseReminderView;
  // "Bé đã khỏi" is on its way.
  busy: boolean;
  onClose: () => void;
  onSnooze: () => void;
}) {
  return (
    <section className={cx(CARD, "gap-3")}>
      <div className="flex items-start gap-3">
        <span
          className={cx(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            TONE_CIRCLE[view.tone],
          )}
        >
          <Icon name={view.icon} size={20} strokeWidth={2.2} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-base leading-[22px] font-bold text-balance text-ink">
            {view.title}
          </h2>
          <p className="text-[13px] leading-[18px] text-muted">{view.sub}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="md" busy={busy} onClick={onClose}>
          Bé đã khỏi
        </Button>
        <Button variant="secondary" size="md" onClick={onSnooze}>
          Chưa
        </Button>
      </div>
    </section>
  );
}
