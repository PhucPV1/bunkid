"use client";

import { useQuickActions } from "@/components/actions/QuickActions";
import { SyncBarSlot } from "@/components/sync/SyncSlot";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import { useFirstLogAt, useRecentLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useNow } from "@/lib/hooks/useNow";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
import { heroState } from "@/lib/rules/hero";
import { medicinePrefill } from "@/lib/rules/quickEntry";
import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
import { sleepStatusLine } from "@/lib/rules/status";
import { homeStatTiles, totalsLine } from "@/lib/rules/summaryText";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import { nextBreastSide, overdueTimers } from "@/lib/rules/timer";
import type { Baby } from "@/lib/supabase/rows";
import { AlertBanners } from "./AlertBanners";
import { HeroCardView } from "./HeroCard";
import { HomeHeader } from "./HomeHeader";
import { HomeSkeleton } from "./HomeSkeleton";
import { LongTimerBanner } from "./LongTimerBanner";
import { QuickLogGrid } from "./QuickLogGrid";
import { RecentCard } from "./RecentCard";
import { StatsSection } from "./StatsSection";
import { TimerButtons } from "./TimerButtons";
import { TimerRow } from "./TimerRow";
import { VitaminDButton } from "./VitaminDButton";

export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
  const now = useNow(1000);
  useLogsRealtime(baby.id);
  const logs = useRecentLogs(baby.id);
  const firstLogAt = useFirstLogAt(baby.id);
  const members = useMembers(baby.family_id);
  // Loaded here too so /khan-cap has the family's numbers even when first opened offline.
  useEmergencyContacts(baby.family_id);
  const actions = useQuickActions();
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
  // Offline at start the fetch is "paused", not "fetching": keep the page so logs go to the outbox.
  const loading = logs.isPending && logs.fetchStatus === "fetching";
  const failed = logs.isError && !logs.data;

  const rows = logs.data ?? [];
  const age = ageDays(baby.dob, now);
  const ratings = rateLast24h({
    logs: rows,
    ageDays: age,
    firstLogAt: firstLogAt.data ?? null,
    now,
  });
  const alerts = homeAlerts({
    logs: rows,
    ageDays: age,
    wetDiapers: ratings.wetDiapers,
    triageAvailable: true,
    now,
  });
  const hero = heroState({
    logs: rows,
    feedIntervalMin: baby.feed_interval_min,
    now,
  });
  const heroLog = hero.kind === "running" ? hero.log : null;
  const nextSide = nextBreastSide(rows, now);
  const vitaminD = vitaminDToday(rows, now);
  const sub =
    [sleepStatusLine(rows, now), vitaminD && `Vitamin D đã uống ${vitaminD}`]
      .filter(Boolean)
      .join(" · ") || null;
  const otherTimers = rows.filter(
    (row) => row.ended_at === null && row.id !== heroLog?.id,
  );
  const recentRows = rows.filter(
    (row) =>
      row.ended_at !== null &&
      Date.parse(row.started_at) >= now.getTime() - WINDOW_MS,
  );
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] p-4">
      <HomeHeader name={baby.name} age={formatAgeVi(baby.dob, now)} />
      <SyncBarSlot />

      {loading ? (
        <HomeSkeleton />
      ) : (
        <>
          <AlertBanners alerts={alerts} />

          {overdueTimers(rows, now).map((log) => (
            <LongTimerBanner
              key={log.id}
              log={log}
              now={now}
              busy={actions.busy}
              onStop={() => actions.stopTimer(log)}
            />
          ))}

          {failed ? (
            <ErrorCard
              message={toVietnameseError(logs.error)}
              onRetry={() => void logs.refetch()}
            />
          ) : (
            <HeroCardView
              state={hero}
              now={now}
              who={heroLog ? nameOf(heroLog.created_by) : ""}
              sub={sub}
              pending={heroLog ? pending.has(heroLog.id) : false}
              busy={actions.busy}
              onTimer={actions.pressTimer}
              onStop={actions.stopTimer}
              nextSide={nextSide}
            />
          )}

          {otherTimers.map((log) => (
            <TimerRow
              key={log.id}
              log={log}
              who={nameOf(log.created_by)}
              now={now}
              busy={actions.busy}
              pending={pending.has(log.id)}
              onStop={() => actions.stopTimer(log)}
            />
          ))}

          <TimerButtons
            running={actions.running}
            busy={actions.busy}
            onTimer={actions.pressTimer}
            suggestSide={nextSide?.suggest ?? null}
          />

          <QuickLogGrid onInstant={(type) => actions.openInstant(type)} />

          {actions.error && (
            <p role="alert" className="px-1 text-danger">
              {toVietnameseError(actions.error)}
            </p>
          )}

          {vitaminD === null && (
            <VitaminDButton
              onRecord={() =>
                actions.openInstant(
                  "medicine",
                  medicinePrefill("Vitamin D", rows),
                )
              }
            />
          )}

          {logs.data && (
            <StatsSection
              tiles={homeStatTiles({ ratings, logs: rows, now })}
              totals={totalsLine(windowTotals(rows, now))}
            />
          )}

          {!failed && (
            <RecentCard
              logs={recentRows}
              now={now}
              nameOf={nameOf}
              pending={pending}
            />
          )}
        </>
      )}
    </main>
  );
}
