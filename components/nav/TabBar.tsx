"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeTab, TABS } from "@/lib/nav";

export function TabBar() {
  const current = activeTab(usePathname());
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-surface pb-[env(safe-area-inset-bottom)] print:hidden">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center text-xs ${active ? "font-semibold text-accent-ink" : "text-muted"}`}
              >
                <span aria-hidden="true" className="text-xl">
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
