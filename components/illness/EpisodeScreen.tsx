"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuickActions } from "@/components/actions/QuickActions";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { IconButton } from "@/components/ui/IconButton";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { toVietnameseError } from "@/lib/data/errors";
import { useEpisodeActions, useEpisodes } from "@/lib/data/illness";
import { useRangeLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import type { LogLike } from "@/lib/rules/describeLog";
import {
  detailRange,
  type EpisodeLike,
  feverChartModel,
} from "@/lib/rules/illness";
import { planClose } from "@/lib/rules/illnessForm";
import { dayRows, verdictView } from "@/lib/rules/illnessView";
import type { Baby } from "@/lib/supabase/rows";
import { EpisodeDayList } from "./EpisodeDayList";
import { EpisodeSheet } from "./EpisodeSheet";
import { EpisodeVerdict, type QuickLogType } from "./EpisodeVerdict";
import { FeverChartCard } from "./FeverChart";

const LIST = "/dot-om";

function Placeholders() {
  return (
    <div className="flex flex-col gap-[18px]">
      <Skeleton className="h-[248px] rounded-[26px]" />
      <Skeleton className="h-[280px] rounded-[28px]" />
    </div>
  );
}

// Spec 2026-11-26 §6.3 items 2 to 7: the cards of an episode whose logs have
// loaded, drawn without hooks. Exported for the temporary fixture page of the
// browser check.
export function EpisodeBody({
  episode,
  logs,
  babyName,
  now,
  closing,
  onLog,
  onClose,
}: {
  episode: EpisodeLike;
  logs: LogLike[];
  babyName: string;
  now: Date;
  // "Bé đã khỏi" is on its way.
  closing: boolean;
  onLog: (type: QuickLogType) => void;
  onClose: () => void;
}) {
  return (
    <>
      <EpisodeVerdict
        view={verdictView({ episode, logs, babyName, now })}
        onLog={onLog}
      />
      <FeverChartCard chart={feverChartModel(logs, episode, now)} />
      <EpisodeDayList rows={dayRows(logs, episode, now)} />
      {episode.ended_at === null && (
        <Button variant="secondary" block busy={closing} onClick={onClose}>
          Bé đã khỏi
        </Button>
      )}
    </>
  );
}

// Spec 2026-11-26 §6.3: the page of one illness episode. `id` comes from the
// address; an id the baby's episodes do not hold shows the not-found state.
export function EpisodeScreen({
  baby,
  userId,
  isOwner,
  id,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
  id: string | null;
}) {
  useLogsRealtime(baby.id);
  const now = useNow(60_000);
  const router = useRouter();
  const toast = useToast();
  const quick = useQuickActions();
  const episodes = useEpisodes(baby.id);
  const actions = useEpisodeActions(baby.id, userId);
  const [editing, setEditing] = useState(false);

  const all = episodes.data ?? [];
  const episode = all.find((item) => item.id === id) ?? null;
  const range = episode ? detailRange(episode) : null;
  const logs = useRangeLogs(
    baby.id,
    range?.from ?? "",
    range?.to ?? null,
    range !== null,
  );

  // Spec §6.3 item 7: no question asked; a refusal is a toast (§5.7).
  function close() {
    if (!episode) return;
    const plan = planClose(episode, all, new Date());
    if (!plan.ok) {
      toast(plan.message);
      return;
    }
    actions.update.mutate(
      { id: episode.id, patch: plan.patch },
      {
        onSuccess: () => toast("Đã đóng đợt ốm"),
        onError: (error) => toast(toVietnameseError(error)),
      },
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Đợt ốm"
        back={{ href: LIST, label: "Đợt ốm" }}
        action={
          episode && (
            <IconButton
              label="Sửa đợt ốm"
              icon="pencil"
              onClick={() => setEditing(true)}
            />
          )
        }
      />
      {waitingForNetwork(episodes) ? (
        <NeedsNetwork what="đợt ốm" />
      ) : episodes.isPending ? (
        <Placeholders />
      ) : episodes.isError && !episodes.data ? (
        <ErrorCard
          message={toVietnameseError(episodes.error)}
          onRetry={() => void episodes.refetch()}
        />
      ) : !episode ? (
        <EmptyState
          icon="calendar"
          text="Không tìm thấy đợt ốm này"
          action={{ label: "Về danh sách", href: LIST }}
        />
      ) : waitingForNetwork(logs) ? (
        <NeedsNetwork what="bản ghi của đợt ốm" />
      ) : logs.isPending ? (
        <Placeholders />
      ) : logs.isError && !logs.data ? (
        <ErrorCard
          message={toVietnameseError(logs.error)}
          onRetry={() => void logs.refetch()}
        />
      ) : (
        <EpisodeBody
          episode={episode}
          logs={logs.data ?? []}
          babyName={baby.name}
          now={now}
          closing={actions.update.isPending}
          onLog={quick.openInstant}
          onClose={close}
        />
      )}
      {editing && episode && (
        <EpisodeSheet
          babyId={baby.id}
          userId={userId}
          episode={episode}
          episodes={all}
          canDelete={isOwner || episode.created_by === userId}
          onClose={() => setEditing(false)}
          onDeleted={() => router.replace(LIST)}
        />
      )}
    </main>
  );
}
