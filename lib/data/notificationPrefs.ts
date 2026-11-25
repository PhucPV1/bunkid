"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_QUIET,
  type PrefKey,
  type QuietPrefs,
} from "@/lib/rules/notifications";
import { supabase } from "@/lib/supabase/client";
import { PermissionDeniedError } from "./errors";

export type NotificationPrefs = Record<PrefKey, boolean> &
  QuietPrefs & {
    hold_feed_while_asleep: boolean;
    snooze_until: string | null;
  };

// Spec §5.2: no row means every switch is on and nothing is snoozed.
export const DEFAULT_PREFS: NotificationPrefs = {
  feed_reminder: true,
  wake_window: true,
  vaccine: true,
  // Spec 2026-11-17 §4.1: the column defaults.
  medicine: true,
  timer_alert: true,
  // Spec 2026-11-25 §8.1: the column defaults.
  growth_alert: true,
  growth_measure: true,
  ...DEFAULT_QUIET,
  hold_feed_while_asleep: false,
  snooze_until: null,
};

const prefsKey = (userId: string) => ["notification-prefs", userId] as const;

export async function fetchPrefs(userId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase()
    .from("notification_prefs")
    .select(
      "feed_reminder, wake_window, vaccine, snooze_until, medicine, timer_alert, growth_alert, growth_measure, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? DEFAULT_PREFS;
}

export async function savePrefs(
  userId: string,
  patch: Partial<NotificationPrefs>,
): Promise<void> {
  // Upsert writes only the patched columns; a new row gets defaults for the rest.
  const { data, error } = await supabase()
    .from("notification_prefs")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select("user_id");
  if (error) throw error;
  if (data.length === 0) throw new PermissionDeniedError();
}

export function useNotificationPrefs(userId: string) {
  return useQuery({
    queryKey: prefsKey(userId),
    queryFn: () => fetchPrefs(userId),
  });
}

export function useSavePrefs(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => savePrefs(userId, patch),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: prefsKey(userId) }),
  });
}
