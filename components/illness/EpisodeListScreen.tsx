"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { ListGroup, ListRow } from "@/components/ui/ListGroup";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusChip } from "@/components/ui/StatusChip";
import { useToast } from "@/components/ui/Toast";
import { toVietnameseError } from "@/lib/data/errors";
import { useEpisodeActions, useEpisodes } from "@/lib/data/illness";
import { useRangeLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import { planStart } from "@/lib/rules/illnessForm";
import {
  episodeHref,
  episodeList,
  type EpisodeListView,
} from "@/lib/rules/illnessView";
import type { Baby } from "@/lib/supabase/rows";
import { CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mx-1 text-xl font-bold text-ink">{children}</h2>;
}

// Spec 2026-11-26 §6.2: the three states of the list, drawn without hooks.
// Exported for the temporary fixture page of the browser check.
export function EpisodeListBody({
  view,
  starting,
  onStart,
}: {
  view: EpisodeListView;
  // "Bắt đầu đợt ốm" is on its way.
  starting: boolean;
  onStart: () => void;
}) {
  if (!view.open && view.past.length === 0)
    return (
      <EmptyState
        icon="calendar"
        text="Chưa có đợt ốm nào"
        detail="Khi bé ốm, mở một đợt để gom nhiệt độ, thuốc và triệu chứng vào một chỗ."
        action={{ label: "Bắt đầu đợt ốm", onClick: onStart }}
      />
    );
  return (
    <>
      <section className="flex flex-col gap-2.5">
        <SectionTitle>Đang diễn ra</SectionTitle>
        {view.open ? (
          <Link
            href={view.open.href}
            className="glass flex items-center gap-3 rounded-[26px] px-4 py-3.5 text-ink"
          >
            <span
              className={cx(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                CATEGORY_CHIP["cat-temp"],
              )}
            >
              <Icon name="thermo" size={20} strokeWidth={2.2} />
            </span>
            {/* The chip sits under the title: at 375 px the two do not fit
                side by side (the title is 165 px or more, a chip up to
                91 px, and the row has 247 px for both). */}
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span className="text-base font-bold">{view.open.title}</span>
              {view.open.chip && (
                <StatusChip tone={view.open.chip.tone}>
                  {view.open.chip.text}
                </StatusChip>
              )}
            </span>
            <Icon name="chevronRight" size={18} className="text-muted" />
          </Link>
        ) : (
          <Button block busy={starting} onClick={onStart}>
            Bắt đầu đợt ốm
          </Button>
        )}
      </section>
      {view.past.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionTitle>Đã qua</SectionTitle>
          <ListGroup>
            {view.past.map((row) => (
              <ListRow key={row.id} label={row.text} href={row.href} />
            ))}
          </ListGroup>
        </section>
      )}
    </>
  );
}

// Spec 2026-11-26 §6.2: every illness episode of the baby.
export function EpisodeListScreen({
  baby,
  userId,
}: {
  baby: Baby;
  userId: string;
}) {
  // The chip of the open episode follows logs written on another phone.
  useLogsRealtime(baby.id);
  const now = useNow(60_000);
  const router = useRouter();
  const toast = useToast();
  const episodes = useEpisodes(baby.id);
  const actions = useEpisodeActions(baby.id, userId);
  const all = episodes.data ?? [];
  const current = all.find((episode) => episode.ended_at === null) ?? null;
  // The chip of the open episode needs its logs; with none open, none are read.
  const openLogs = useRangeLogs(
    baby.id,
    current?.started_at ?? "",
    null,
    current !== null,
  );
  const view = episodeList({
    episodes: all,
    openLogs: current ? openLogs.data : undefined,
    now,
  });

  // Spec §6.2: starts now, then opens the new episode's page. A refusal is a
  // toast and nothing is queued (§5.7).
  function start() {
    // A second tap while the first is still being queued would start twice.
    if (actions.start.isPending) return;
    const plan = planStart(all, new Date());
    if (!plan.ok) {
      toast(plan.message);
      return;
    }
    actions.start.mutate(
      { startedAt: plan.startedAt },
      {
        onSuccess: (id) => router.push(episodeHref(id)),
        onError: (error) => toast(toVietnameseError(error)),
      },
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[22px] px-4 pt-2 pb-4">
      <PageHeader
        title="Đợt ốm"
        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
      />
      {waitingForNetwork(episodes) ? (
        <NeedsNetwork what="đợt ốm" />
      ) : episodes.isPending ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-[68px] rounded-[26px]" />
          <Skeleton className="h-[52px] rounded-[22px]" />
        </div>
      ) : episodes.isError && !episodes.data ? (
        <ErrorCard
          message={toVietnameseError(episodes.error)}
          onRetry={() => void episodes.refetch()}
        />
      ) : (
        <EpisodeListBody
          view={view}
          starting={actions.start.isPending}
          onStart={start}
        />
      )}
    </main>
  );
}
