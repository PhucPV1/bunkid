"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PrefKey } from "@/lib/rules/notifications";
import { supabase } from "@/lib/supabase/client";
import { PermissionDeniedError } from "./errors";

export type NotificationPrefs = Record<PrefKey, boolean> & {
  snooze_until: string | null;
};

// Spec §5.2: no row means every switch is on and nothing is snoozed.
export const DEFAULT_PREFS: NotificationPrefs = {
  feed_reminder: true,
  wake_window: true,
  vaccine: true,
  snooze_until: null,
};

const prefsKey = (userId: string) => ["notification-prefs", userId] as const;

export async function fetchPrefs(userId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase()
    .from("notification_prefs")
    .select("feed_reminder, wake_window, vaccine, snooze_until")
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
