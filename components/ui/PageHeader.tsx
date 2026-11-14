"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useScrolledPast } from "@/lib/hooks/useScrolledPast";
import { cx } from "@/lib/ui/cx";
import { SyncBarSlot } from "@/components/sync/SyncSlot";
import { Icon } from "./Icon";

export const COMPACT_AFTER_PX = 40;

type HeaderProps = {
  title: string;
  back?: { href: string; label: string };
  action?: ReactNode;
};

export function PageHeaderView({
  title,
  back,
  action,
  compact,
}: HeaderProps & { compact: boolean }) {
  return (
    <>
      <div
        aria-hidden={!compact}
        className={cx(
          "glass-strong fixed inset-x-0 top-0 z-10 flex h-[calc(env(safe-area-inset-top)+44px)] items-end justify-center rounded-none border-x-0! border-t-0! pb-2.5 transition-opacity duration-[160ms] print:hidden",
          compact ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <span className="text-[17px] font-semibold text-ink">{title}</span>
      </div>
      <header className="flex flex-col gap-1.5 pt-2">
        {back && (
          <Link
            href={back.href}
            className="glass inline-flex min-h-11 items-center gap-0.5 self-start rounded-full pr-3.5 pl-2 text-base font-medium text-accent-text"
          >
            <Icon name="chevronLeft" size={18} strokeWidth={2.4} />
            {back.label}
          </Link>
        )}
        <div className="flex items-end justify-between gap-3 px-1">
          <h1 className="text-[34px] leading-[41px] font-bold text-ink">
            {title}
          </h1>
          {action}
        </div>
      </header>
    </>
  );
}

export function PageHeader(props: HeaderProps) {
  const compact = useScrolledPast(COMPACT_AFTER_PX);
  return (
    <>
      <PageHeaderView {...props} compact={compact} />
      <SyncBarSlot />
    </>
  );
}
