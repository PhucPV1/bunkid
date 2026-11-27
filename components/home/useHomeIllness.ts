"use client";

import { useToast } from "@/components/ui/Toast";
import { closeSnoozeKey, inviteDismissKey } from "@/lib/data/storedTime";
import { toVietnameseError } from "@/lib/data/errors";
import { useEpisodeActions, useEpisodes } from "@/lib/data/illness";
import { useRangeLogs } from "@/lib/data/logs";
import { useStoredTime } from "@/lib/hooks/useStoredTime";
import type { HomeAlert } from "@/lib/rules/alerts";
import type { LogLike } from "@/lib/rules/describeLog";
import {
  closeReminder,
  inviteAlert,
  inviteStartedAt,
} from "@/lib/rules/illness";
import { planClose, planStart } from "@/lib/rules/illnessForm";
import {
  closeReminderView,
  type CloseReminderView,
  homeEpisodeCard,
  type HomeEpisodeView,
} from "@/lib/rules/illnessView";
import type { Baby } from "@/lib/supabase/rows";
import type { BannerInvite } from "./AlertBanners";

export type HomeIllness = {
  // Spec 2026-11-26 §7.2: the invite on the fever banner, or null.
  invite: BannerInvite | null;
  // Spec §7.1: the card of the open episode, or null.
  card: HomeEpisodeView | null;
  // Spec §7.3: the reminder to close it, or null.
  reminder: {
    view: CloseReminderView;
    busy: boolean;
    onClose: () => void;
    onSnooze: () => void;
  } | null;
};

// Spec §5.5, §5.6 and §7: what the home page shows of illness episodes.
// `logs` and `alerts` are the page's recent logs and banners; `now` is its
// clock, which the one-tap actions use too. Nothing shows while the episodes
// are unknown (loading, or offline without a copy), nor before the answers
// kept on this device have been read.
export function useHomeIllness(input: {
  baby: Baby;
  userId: string;
  logs: LogLike[];
  alerts: HomeAlert[];
  now: Date;
}): HomeIllness {
  const { baby, userId, logs, alerts, now } = input;
  const toast = useToast();
  const episodes = useEpisodes(baby.id);
  const actions = useEpisodeActions(baby.id, userId);
  const all = episodes.data;
  const open = all?.find((episode) => episode.ended_at === null) ?? null;
  // Spec §7: with an episode open, the page reads all of its logs.
  const range = useRangeLogs(
    baby.id,
    open?.started_at ?? "",
    null,
    open !== null,
  );
  const dismissed = useStoredTime(inviteDismissKey(baby.id));
  const snoozed = useStoredTime(open ? closeSnoozeKey(open.id) : null);

  const inviteKey =
    all && dismissed.at !== undefined
      ? inviteAlert({
          episodes: all,
          alerts,
          logs,
          dismissedAt: dismissed.at,
          now,
        })
      : null;

  // Spec §5.5: starts at the first fever reading, and stays on this page,
  // where the episode's card takes the invite's place. A refusal is a toast
  // and nothing is queued (§5.7).
  function start() {
    if (!all || actions.start.isPending) return;
    const plan = planStart(all, now, inviteStartedAt(logs, all, now));
    if (!plan.ok) {
      toast(plan.message);
      return;
    }
    actions.start.mutate(
      { startedAt: plan.startedAt },
      { onError: (error) => toast(toVietnameseError(error)) },
    );
  }

  // Spec §6.3 item 7, from the reminder: no question asked.
  function close() {
    if (!all || !open) return;
    const plan = planClose(open, all, now);
    if (!plan.ok) {
      toast(plan.message);
      return;
    }
    actions.update.mutate(
      { id: open.id, patch: plan.patch },
      {
        onSuccess: () => toast("Đã đóng đợt ốm"),
        onError: (error) => toast(toVietnameseError(error)),
      },
    );
  }

  const reminderKind =
    open && range.data && snoozed.at !== undefined
      ? closeReminder({
          episode: open,
          logs: range.data,
          snoozedAt: snoozed.at,
          now,
        })
      : null;

  return {
    invite: inviteKey
      ? {
          alertKey: inviteKey,
          busy: actions.start.isPending,
          onStart: start,
          onDismiss: () => dismissed.mark(now),
        }
      : null,
    card: open
      ? homeEpisodeCard({ episode: open, logs: range.data, now })
      : null,
    reminder:
      open && reminderKind && range.data
        ? {
            view: closeReminderView({
              kind: reminderKind,
              episode: open,
              logs: range.data,
              babyName: baby.name,
              now,
            }),
            busy: actions.update.isPending,
            onClose: close,
            onSnooze: () => snoozed.mark(now),
          }
        : null,
  };
}
