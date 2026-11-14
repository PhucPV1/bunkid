"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { activeTab, TABS, type TabKey } from "@/lib/nav";
import { cx } from "@/lib/ui/cx";

export function TabBarView({
  current,
  onPlus,
  plusOpen = false,
}: {
  current: TabKey | null;
  onPlus?: () => void;
  plusOpen?: boolean;
}) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-4 bottom-[max(calc(env(safe-area-inset-bottom)+10px),26px)] z-10 mx-auto flex max-w-md items-center gap-2.5 print:hidden"
    >
      <ul
        className={cx(
          "glass-strong grid h-[62px] flex-1 grid-cols-3 rounded-full p-1 shadow-[0_10px_30px_rgb(0_0_0/0.15)] in-data-[theme=dark]:shadow-[0_10px_30px_rgb(0_0_0/0.25)] in-data-[theme=night]:shadow-none",
          plusOpen && "opacity-60",
        )}
      >
        {TABS.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key} className="flex">
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
}: {
  onPlus?: () => void;
  plusOpen?: boolean;
}) {
  return (
    <TabBarView
      current={activeTab(usePathname())}
      onPlus={onPlus}
      plusOpen={plusOpen}
    />
  );
}
