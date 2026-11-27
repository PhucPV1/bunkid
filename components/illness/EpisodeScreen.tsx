"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useQuickActions } from "@/components/actions/QuickActions";
import { SymptomDaySheet } from "@/components/quick/SymptomDaySheet";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { toVietnameseError } from "@/lib/data/errors";
import { useEpisodeActions, useEpisodes, useVisits } from "@/lib/data/illness";
import { useRangeLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import type { LogLike } from "@/lib/rules/describeLog";
import {
  detailRange,
  type EpisodeLike,
  episodeDay,
  feverChartModel,
} from "@/lib/rules/illness";
import { planClose } from "@/lib/rules/illnessForm";
import { dayRows, usualView, verdictView } from "@/lib/rules/illnessView";
import { episodeDeleteBlock, visitsOf } from "@/lib/rules/visits";
import type { Baby } from "@/lib/supabase/rows";
import { EpisodeDayList } from "./EpisodeDayList";
import { EpisodeSheet } from "./EpisodeSheet";
import { EpisodeUsual } from "./EpisodeUsual";
import { EpisodeVerdict, type QuickLogType } from "./EpisodeVerdict";
import { FeverChartCard } from "./FeverChart";
import { VisitsCard } from "./VisitsCard";

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
  visits = null,
  visitTimes = [],
  onLog,
  onClose,
  onEditDay = () => {},
}: {
  episode: EpisodeLike;
  logs: LogLike[];
  babyName: string;
  now: Date;
  // "Bé đã khỏi" is on its way.
  closing: boolean;
  // Spec §6.3 item 6: the card "Lần khám" (§8.3), which reads by itself.
  visits?: ReactNode;
  // The times of the episode's visits, marked on the chart (§6.5 from M5).
  visitTimes?: number[];
  onLog: (type: QuickLogType) => void;
  onClose: () => void;
  // Spec 2026-11-27 §6.1: "Sửa" or "Ghi triệu chứng" on a day's row.
  onEditDay?: (day: string) => void;
}) {
  return (
    <>
      <EpisodeVerdict
        view={verdictView({ episode, logs, babyName, now })}
        onLog={onLog}
      />
      <FeverChartCard chart={feverChartModel(logs, episode, now, visitTimes)} />
      <EpisodeDayList rows={dayRows(logs, episode, now)} onEdit={onEditDay} />
      <EpisodeUsual view={usualView(logs, episode, now)} />
      {visits}
      {/* Spec §6.3 item 7: the report of this episode (§9), then, while it
          is open, "Bé đã khỏi". */}
      <div className="flex flex-col gap-2.5">
        <Link
          href={`/bao-cao?dot=${episode.id}`}
          className={buttonClass({ block: true })}
        >
          <Icon name="doc" size={20} />
          Báo cáo cho bác sĩ
        </Link>
        {episode.ended_at === null && (
          <Button variant="secondary" block busy={closing} onClick={onClose}>
            Bé đã khỏi
          </Button>
        )}
      </div>
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
  const visits = useVisits(baby.id);
  const [editing, setEditing] = useState(false);
  // Spec 2026-11-27 §5.1: the day whose symptom sheet is open.
  const [symptomDay, setSymptomDay] = useState<string | null>(null);

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
          visitTimes={visitsOf(visits.data ?? [], episode.id).map((visit) =>
            Date.parse(visit.visited_at),
          )}
          visits={
            <VisitsCard
              baby={baby}
              userId={userId}
              isOwner={isOwner}
              episode={episode}
              visits={visits}
            />
          }
          onLog={quick.openInstant}
          onClose={close}
          onEditDay={setSymptomDay}
        />
      )}
      {symptomDay && episode && (
        <SymptomDaySheet
          baby={baby}
          userId={userId}
          canModify={(createdBy) => isOwner || createdBy === userId}
          day={symptomDay}
          sub={`Ngày ${episodeDay(episode.started_at, new Date(`${symptomDay}T12:00:00+07:00`))} của đợt ốm · cả ngày`}
          onClose={() => setSymptomDay(null)}
        />
      )}
      {editing && episode && (
        <EpisodeSheet
          babyId={baby.id}
          userId={userId}
          episode={episode}
          episodes={all}
          canDelete={isOwner || episode.created_by === userId}
          deleteBlock={episodeDeleteBlock(visits.data, episode.id)}
          onClose={() => setEditing(false)}
          onDeleted={() => router.replace(LIST)}
        />
      )}
    </main>
  );
}
