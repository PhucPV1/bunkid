"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useNow } from "@/lib/hooks/useNow";
import {
  activeTab,
  showsTabTimer,
  TABS,
  type Tab,
  type TabKey,
} from "@/lib/nav";
import { formatClock, formatTabClock, timerLabel } from "@/lib/rules/hero";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORY_CHIP, CATEGORY_SOLID, categoryOf } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

// The running timer the Hôm nay tab shows, and how many others are running.
export type TabTimer = { log: LogRow; more: number };

// Spec 2026-11-19 §4: the Hôm nay tab while a timer runs on another page. Only
// this component ticks every second, and only while the tile shows.
function TimerTab({
  tab,
  timer,
  current,
}: {
  tab: Tab;
  timer: TabTimer;
  current: boolean;
}) {
  const now = useNow(1000);
  const { log, more } = timer;
  const category = categoryOf(log.type);
  const ms = now.getTime() - Date.parse(log.started_at);
  return (
    <Link
      href={tab.href}
      aria-current={current ? "page" : undefined}
      aria-label={`${tab.label}, ${timerLabel(log)} đã chạy ${formatClock(ms)}`}
      className={cx(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full px-1",
        CATEGORY_CHIP[category.token],
      )}
    >
      <span
        className={cx(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          CATEGORY_SOLID[category.token],
        )}
      >
        <Icon name={category.icon} size={18} strokeWidth={2.2} />
      </span>
      <span className="flex flex-col">
        <span className="text-[17px] leading-5 font-bold whitespace-nowrap text-ink tabular-nums">
          {formatTabClock(ms)}
        </span>
        {/* text-ink: text-muted is too faint on the tint in Ban đêm. */}
        <span className="text-[10px] leading-3 font-semibold whitespace-nowrap text-ink">
          {more > 0 ? `${tab.label} · +${more}` : tab.label}
        </span>
      </span>
    </Link>
  );
}

export function TabBarView({
  current,
  onPlus,
  plusOpen = false,
  timer = null,
}: {
  current: TabKey | null;
  onPlus?: () => void;
  plusOpen?: boolean;
  // Spec 2026-11-19 §4: turns the Hôm nay tab into the wider timer tile.
  timer?: TabTimer | null;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-4 bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)] z-10 mx-auto flex max-w-md items-center gap-2.5 print:hidden"
    >
      <ul
        className={cx(
          "glass-strong flex h-[62px] flex-1 rounded-full p-1 shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=dark]:shadow-[0_10px_30px_rgb(0_0_0/0.25)] in-data-[theme=night]:shadow-none",
          plusOpen && "opacity-60",
        )}
      >
        {TABS.map((tab) => {
          const active = tab.key === current;
          const tile = tab.key === "home" ? timer : null;
          return (
            <li
              key={tab.key}
              className={cx("flex", tile ? "flex-[1.7]" : "flex-1")}
            >
              {tile ? (
                <TimerTab tab={tab} timer={tile} current={active} />
              ) : (
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] leading-3 font-semibold",
                    active ? "bg-accent-tint text-accent-text" : "text-ink/80",
                  )}
                >
                  <Icon name={tab.icon} size={22} />
                  {tab.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {onPlus && (
        <button
          type="button"
          onClick={onPlus}
          aria-label={plusOpen ? "Đóng" : "Ghi lại"}
          aria-expanded={plusOpen}
          className={cx(
            "flex size-[62px] shrink-0 items-center justify-center rounded-full shadow-[0_10px_26px_rgb(0_0_0/0.2)] transition-transform duration-[120ms] active:scale-[0.97] in-data-[theme=night]:shadow-none",
            plusOpen ? "bg-ink text-bg" : "bg-accent text-on-accent",
          )}
        >
          <Icon
            name={plusOpen ? "close" : "plus"}
            size={26}
            strokeWidth={2.4}
          />
        </button>
      )}
    </nav>
  );
}

export function TabBar({
  onPlus,
  plusOpen,
  timer = null,
}: {
  onPlus?: () => void;
  plusOpen?: boolean;
  timer?: TabTimer | null;
}) {
  const pathname = usePathname();
  return (
    <TabBarView
      current={activeTab(pathname)}
      onPlus={onPlus}
      plusOpen={plusOpen}
      // Hôm nay already shows the running timer on its hero card.
      timer={showsTabTimer(pathname) ? timer : null}
    />
  );
}
